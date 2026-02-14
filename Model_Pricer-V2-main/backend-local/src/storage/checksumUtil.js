import crypto from "node:crypto";
import fs from "node:fs/promises";

/**
 * Compute SHA256 hash of a file.
 * @param {string} filePath - Absolute path to file
 * @returns {Promise<string>} Hex-encoded SHA256 hash
 */
export async function sha256File(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Compute SHA256 hash of a Buffer.
 * @param {Buffer} buffer
 * @returns {string} Hex-encoded SHA256 hash
 */
export function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
