/**
 * 加密存储层
 * 对应 PRD 第 12.1 节：本地加密存储（P0）
 * 密钥由用户登录口令或本机随机种子派生（KDF）
 */

/**
 * 使用 Web Crypto API 进行加密/解密
 */

/**
 * 密钥派生函数（KDF）
 * 基于用户口令或本机随机种子派生密钥
 * 使用 PBKDF2 算法
 * @param password 用户口令（可选）
 * @param salt 盐值（如果未提供，使用本机随机种子）
 * @returns 加密密钥
 */
export async function deriveKey(
  password?: string,
  salt?: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  let keyMaterial: CryptoKey;
  
  if (password) {
    keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
  } else {
    // 如果没有密码，使用随机生成的密钥材料
    const randomKey = await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
    // 将密钥导出为原始格式，然后导入为 PBKDF2 密钥材料
    const rawKey = await crypto.subtle.exportKey("raw", randomKey);
    keyMaterial = await crypto.subtle.importKey(
      "raw",
      rawKey,
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );
  }

  // 如果没有提供 salt，生成随机 salt
  let saltBuffer: Uint8Array;
  if (salt) {
    // 创建新的 Uint8Array 以确保类型正确
    saltBuffer = new Uint8Array(salt);
  } else {
    saltBuffer = crypto.getRandomValues(new Uint8Array(16));
    // 保存 salt 到 localStorage（用于后续解密）
    localStorage.setItem(
      "x402_encryption_salt",
      Array.from(saltBuffer)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  }

  // 创建新的 ArrayBuffer 以确保类型正确
  const saltArrayBuffer = saltBuffer.buffer.slice(
    saltBuffer.byteOffset,
    saltBuffer.byteOffset + saltBuffer.byteLength
  ) as ArrayBuffer;

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 获取或生成加密密钥
 */
let cachedKey: CryptoKey | null = null;

export async function getEncryptionKey(
  password?: string
): Promise<CryptoKey> {
  if (cachedKey) {
    return cachedKey;
  }

  // 尝试从 localStorage 获取 salt
  const saltHex = localStorage.getItem("x402_encryption_salt");
  let salt: Uint8Array | undefined;
  if (saltHex) {
    salt = new Uint8Array(
      saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
  }

  cachedKey = await deriveKey(password, salt);
  return cachedKey;
}

/**
 * 数据加密函数（透明加密）
 * @param data 要加密的数据（JSON 字符串）
 * @param key 加密密钥
 * @returns 加密后的数据（Base64 字符串 + IV）
 */
export async function encryptData(
  data: string,
  key?: CryptoKey
): Promise<string> {
  const encryptionKey = key || (await getEncryptionKey());
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // 生成随机 IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 加密
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    encryptionKey,
    dataBuffer
  );

  // 将 IV 和加密数据组合
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  // 转换为 Base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * 数据解密函数
 * @param encryptedData 加密后的数据（Base64 字符串）
 * @param key 解密密钥
 * @returns 解密后的数据（JSON 字符串）
 */
export async function decryptData(
  encryptedData: string,
  key?: CryptoKey
): Promise<string> {
  const decryptionKey = key || (await getEncryptionKey());
  const combined = Uint8Array.from(
    atob(encryptedData),
    (c) => c.charCodeAt(0)
  );

  // 提取 IV 和加密数据
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  // 解密
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    decryptionKey,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * 敏感字段脱敏存储（只存 hash/截断）
 * 对应 PRD 第 12.1 节：最小敏感存储
 * @param sensitiveData 敏感数据
 * @returns 哈希值（SHA256）
 */
export async function hashSensitiveData(
  sensitiveData: string
): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(sensitiveData);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 清除缓存的加密密钥
 */
export function clearEncryptionKey(): void {
  cachedKey = null;
}
