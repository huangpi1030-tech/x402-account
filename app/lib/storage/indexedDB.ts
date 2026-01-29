/**
 * IndexedDB 封装
 * 对应 PRD 第 12.1 节：本地加密存储（P0）
 * 存储介质：IndexedDB（优先）- 结构化、容量大
 */

import { CanonicalRecord, RawEvidence, AuditLog, UUID, ISODateTime } from "@/types";

/**
 * 数据库配置
 */
const DB_NAME = "X402AccountDB";
const DB_VERSION = 1;

/**
 * 对象存储名称
 */
const STORES = {
  CANONICAL: "canonical",
  RAW_EVIDENCE: "rawEvidence",
  AUDIT_LOG: "auditLog",
} as const;

/**
 * IndexedDB 数据库实例
 */
let dbInstance: IDBDatabase | null = null;

/**
 * IndexedDB 初始化函数
 * @returns Promise<IDBDatabase>
 */
export async function initIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("IndexedDB 打开失败"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建 Canonical 对象存储
      if (!db.objectStoreNames.contains(STORES.CANONICAL)) {
        const canonicalStore = db.createObjectStore(STORES.CANONICAL, {
          keyPath: "event_id",
        });
        canonicalStore.createIndex("persistence_id", "persistence_id", {
          unique: false,
        });
        canonicalStore.createIndex("status", "status", { unique: false });
        canonicalStore.createIndex("paid_at", "paid_at", { unique: false });
        canonicalStore.createIndex("created_at", "created_at", {
          unique: false,
        });
      }

      // 创建 RawEvidence 对象存储
      if (!db.objectStoreNames.contains(STORES.RAW_EVIDENCE)) {
        const evidenceStore = db.createObjectStore(STORES.RAW_EVIDENCE, {
          keyPath: "evidence_id",
        });
        evidenceStore.createIndex("persistence_id", "persistence_id", {
          unique: false,
        });
        evidenceStore.createIndex("processed", "processed", {
          unique: false,
        });
        evidenceStore.createIndex("captured_at", "captured_at", {
          unique: false,
        });
      }

      // 创建 AuditLog 对象存储（append-only）
      if (!db.objectStoreNames.contains(STORES.AUDIT_LOG)) {
        const auditStore = db.createObjectStore(STORES.AUDIT_LOG, {
          keyPath: "audit_id",
          autoIncrement: false,
        });
        auditStore.createIndex("resource_type", "resource_type", {
          unique: false,
        });
        auditStore.createIndex("resource_id", "resource_id", {
          unique: false,
        });
        auditStore.createIndex("timestamp", "timestamp", { unique: false });
        auditStore.createIndex("operator", "operator", { unique: false });
      }
    };
  });
}

/**
 * 获取数据库实例（确保已初始化）
 */
async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    return await initIndexedDB();
  }
  return dbInstance;
}

/**
 * 数据存储接口 - Canonical Record
 */
export async function saveCanonical(record: CanonicalRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CANONICAL], "readwrite");
    const store = transaction.objectStore(STORES.CANONICAL);
    const request = store.put(record);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("保存 Canonical 失败"));
  });
}

/**
 * 数据存储接口 - RawEvidence (WAL)
 */
export async function saveRawEvidence(evidence: RawEvidence): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.RAW_EVIDENCE], "readwrite");
    const store = transaction.objectStore(STORES.RAW_EVIDENCE);
    const request = store.put(evidence);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("保存 RawEvidence 失败"));
  });
}

/**
 * 数据存储接口 - Audit Log (append-only)
 */
export async function saveAuditLog(log: AuditLog): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.AUDIT_LOG], "readwrite");
    const store = transaction.objectStore(STORES.AUDIT_LOG);
    const request = store.add(log); // 使用 add 而不是 put，确保 append-only

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("保存 AuditLog 失败"));
  });
}

/**
 * 数据查询接口 - 按 event_id 查询 Canonical
 */
export async function getCanonicalByEventId(
  eventId: UUID
): Promise<CanonicalRecord | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CANONICAL], "readonly");
    const store = transaction.objectStore(STORES.CANONICAL);
    const request = store.get(eventId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(new Error("查询 Canonical 失败"));
  });
}

/**
 * 数据查询接口 - 按 persistence_id 查询 Canonical
 */
export async function getCanonicalByPersistenceId(
  persistenceId: string
): Promise<CanonicalRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CANONICAL], "readonly");
    const store = transaction.objectStore(STORES.CANONICAL);
    const index = store.index("persistence_id");
    const request = index.getAll(persistenceId);

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(new Error("查询 Canonical 失败"));
  });
}

/**
 * 数据查询接口 - 按时间范围查询 Canonical
 */
export async function getCanonicalByTimeRange(
  startTime: ISODateTime,
  endTime: ISODateTime
): Promise<CanonicalRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CANONICAL], "readonly");
    const store = transaction.objectStore(STORES.CANONICAL);
    const index = store.index("created_at");
    const range = IDBKeyRange.bound(startTime, endTime);
    const request = index.getAll(range);

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(new Error("查询 Canonical 失败"));
  });
}

/**
 * 数据查询接口 - 获取所有 Canonical（分页）
 */
export async function getAllCanonical(
  limit?: number,
  offset?: number
): Promise<CanonicalRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CANONICAL], "readonly");
    const store = transaction.objectStore(STORES.CANONICAL);
    const index = store.index("created_at");
    const request = index.openCursor(null, "prev"); // 倒序

    const results: CanonicalRecord[] = [];
    let count = 0;
    let skipped = offset || 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        if (skipped > 0) {
          skipped--;
          cursor.continue();
          return;
        }
        if (limit && count >= limit) {
          resolve(results);
          return;
        }
        results.push(cursor.value);
        count++;
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(new Error("查询 Canonical 失败"));
  });
}

/**
 * 数据查询接口 - 按 resource_id 查询 AuditLog
 */
export async function getAuditLogsByResourceId(
  resourceId: UUID
): Promise<AuditLog[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.AUDIT_LOG], "readonly");
    const store = transaction.objectStore(STORES.AUDIT_LOG);
    const index = store.index("resource_id");
    const request = index.getAll(resourceId);

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(new Error("查询 AuditLog 失败"));
  });
}

/**
 * 数据迁移函数（版本升级）
 */
export async function migrateDatabase(
  oldVersion: number,
  newVersion: number
): Promise<void> {
  // 这里可以实现数据迁移逻辑
  // 实际迁移逻辑根据需求实现
}
