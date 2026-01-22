/**
 * Persistence Id 生成工具
 * 对应 PRD 第 7.1 节：关键机制：Persistence Id（业务幂等关联令牌）
 */

/**
 * 生成 SHA256 哈希（使用 Web Crypto API）
 * @param data 要哈希的数据
 * @returns 十六进制哈希字符串
 */
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

/**
 * 生成 Persistence Id
 * 对应 PRD 第 7.1 节：令牌构成
 * `persistence_id = SHA256( normalized_url + method + network + recipient/payTo + amount_base_units + (orderId?nonce?validAfter?) + day_bucket )`
 * @param params 参数对象
 * @returns Persistence Id
 */
export async function generatePersistenceId(params: {
  normalizedUrl: string;
  method: string;
  network: string;
  recipient: string;
  amountBaseUnits: string;
  orderId?: string;
  nonce?: string;
  validAfter?: string;
  dayBucket?: string; // YYYY-MM-DD 格式
}): Promise<string> {
  // 构建数据字符串
  const parts = [
    params.normalizedUrl,
    params.method,
    params.network,
    params.recipient,
    params.amountBaseUnits,
  ];

  // 添加可选字段（任一存在即可）
  if (params.orderId) {
    parts.push(params.orderId);
  } else if (params.nonce) {
    parts.push(params.nonce);
  } else if (params.validAfter) {
    parts.push(params.validAfter);
  }

  // 添加 day_bucket（防止长期碰撞）
  const dayBucket =
    params.dayBucket || new Date().toISOString().split("T")[0];
  parts.push(dayBucket);

  // 拼接并哈希
  const dataString = parts.join("|");
  return await sha256(dataString);
}

/**
 * 生成幂等键
 * 对应 PRD 第 7.2 节：并发去重
 * 以 `persistence_id + stage(402/auth/receipt) + header_hash` 做幂等键
 * @param persistenceId Persistence Id
 * @param stage 阶段（402/auth/receipt）
 * @param headerHash Header 哈希
 * @returns 幂等键
 */
export function generateIdempotencyKey(
  persistenceId: string,
  stage: "402" | "auth" | "receipt",
  headerHash: string
): string {
  return `${persistenceId}|${stage}|${headerHash}`;
}

/**
 * 同步版本的 Persistence Id 生成（用于非异步场景）
 * 注意：此版本使用简化的哈希算法，生产环境建议使用异步版本
 * @param params 参数对象
 * @returns Persistence Id（简化版本）
 */
export function generatePersistenceIdSync(params: {
  normalizedUrl: string;
  method: string;
  network: string;
  recipient: string;
  amountBaseUnits: string;
  orderId?: string;
  nonce?: string;
  validAfter?: string;
  dayBucket?: string;
}): string {
  // 构建数据字符串
  const parts = [
    params.normalizedUrl,
    params.method,
    params.network,
    params.recipient,
    params.amountBaseUnits,
  ];

  if (params.orderId) {
    parts.push(params.orderId);
  } else if (params.nonce) {
    parts.push(params.nonce);
  } else if (params.validAfter) {
    parts.push(params.validAfter);
  }

  const dayBucket =
    params.dayBucket || new Date().toISOString().split("T")[0];
  parts.push(dayBucket);

  // 简化的哈希（仅用于开发/测试，生产环境应使用异步版本）
  const dataString = parts.join("|");
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 转换为 32 位整数
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}
