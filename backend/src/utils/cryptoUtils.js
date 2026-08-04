import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getMasterKey() {
  const secret =
    process.env.ENCRYPTION_SECRET ||
    process.env.JWT_SECRET ||
    "impression_master_key_secure_32_bytes_fallback!";
  return crypto.createHash("sha256").update(String(secret)).digest();
}

export function encrypt(text) {
  if (!text || typeof text !== "string" || !text.trim()) return "";
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text.trim(), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== "string") return "";
  if (!encryptedData.includes(":")) {
    // Return legacy unencrypted text if present
    return encryptedData;
  }

  try {
    const key = getMasterKey();
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return encryptedData;

    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("API Key Decryption Error:", err.message);
    return "";
  }
}
