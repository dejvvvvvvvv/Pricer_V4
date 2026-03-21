/**
 * Filesystem Storage Provider — wraps the existing storageService.js
 * functions behind the unified StorageProvider interface.
 *
 * IMPORTANT: This file does NOT modify storageService.js.  It delegates
 * to it wherever possible and fills in the gaps (upload, download, copy,
 * signed-url, file-exists) with direct fs/promises calls.
 *
 * Default storage root: STORAGE_ROOT env var, or <backend-local>/storage
 *
 * @module filesystemProvider
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  StorageProvider,
  validateTenantId,
  sanitizeStoragePath,
} from "../storageProvider.js";

import {
  resolveTenantPath,
  getStats as fsGetStats,
} from "../storageService.js";

import { sha256Buffer } from "../checksumUtil.js";

// ── Path constants ───────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..", "..");

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Debug logger — active when DEBUG or NODE_ENV=development.
 * @param  {...any} args
 */
function debugLog(...args) {
  if (process.env.DEBUG || process.env.NODE_ENV === "development") {
    console.debug("[FilesystemProvider]", ...args);
  }
}

/**
 * Resolve the storage root directory.
 * @returns {string}
 */
function getStorageRoot() {
  return process.env.STORAGE_ROOT || path.resolve(backendRoot, "storage");
}

/**
 * Common MIME-type lookup by extension.
 * @type {Record<string, string>}
 */
const MIME_BY_EXT = {
  ".stl": "model/stl",
  ".obj": "model/obj",
  ".3mf": "model/3mf",
  ".amf": "application/xml",
  ".step": "model/step",
  ".stp": "model/step",
  ".gcode": "text/plain",
  ".ini": "text/plain",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".txt": "text/plain",
  ".csv": "text/csv",
};

/**
 * Guess a MIME type from a file name.
 * @param {string} filename
 * @returns {string}
 */
function guessMime(filename) {
  const ext = path.extname(filename).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

// ── FilesystemProvider ───────────────────────────────────────────────────

export class FilesystemProvider extends StorageProvider {
  /** @type {string} */
  #storageRoot;

  /**
   * @param {Object} [opts]
   * @param {string} [opts.storageRoot] - Override the default storage root
   */
  constructor(opts = {}) {
    super();
    this.#storageRoot = opts.storageRoot || getStorageRoot();
    debugLog("Initialised — root=" + this.#storageRoot);
  }

  /** @override */
  get name() {
    return "filesystem";
  }

  /**
   * Resolve an absolute path for a tenant + relative path,
   * ensuring it stays within the tenant root.
   * @param {string} tenantId
   * @param {string} relPath
   * @returns {string}
   */
  #resolve(tenantId, relPath) {
    return resolveTenantPath(this.#storageRoot, tenantId, relPath);
  }

  // ── uploadFile ───────────────────────────────────────────────────────

  /**
   * Write a buffer to the filesystem.
   *
   * @param {string} tenantId
   * @param {string} filePath
   * @param {Buffer} buffer
   * @param {string} _contentType - Ignored on filesystem (MIME is derived at read time)
   * @returns {Promise<import('../storageProvider.js').UploadResult>}
   */
  async uploadFile(tenantId, filePath, buffer, _contentType) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(filePath);
    const absPath = this.#resolve(tenantId, relPath);

    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, buffer);

    const hash = sha256Buffer(buffer);
    const key = `${tenantId}/${relPath}`;
    debugLog("uploadFile OK:", key, `${buffer.length} bytes`);

    return { key, size: buffer.length, etag: hash };
  }

  // ── downloadFile ─────────────────────────────────────────────────────

  /**
   * Read a file from the filesystem.
   *
   * @param {string} tenantId
   * @param {string} filePath
   * @returns {Promise<import('../storageProvider.js').DownloadResult>}
   */
  async downloadFile(tenantId, filePath) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(filePath);
    const absPath = this.#resolve(tenantId, relPath);

    try {
      const buffer = await fs.readFile(absPath);
      const contentType = guessMime(path.basename(absPath));
      debugLog("downloadFile OK:", absPath, `${buffer.length} bytes`);
      return { buffer, contentType, size: buffer.length };
    } catch (err) {
      if (err?.code === "ENOENT") {
        throw { code: "MP_NOT_FOUND", message: `File not found: ${relPath}` };
      }
      throw { code: "MP_FS_ERROR", message: `[Filesystem downloadFile] ${err?.message || err}`, cause: err };
    }
  }

  // ── deleteFile ───────────────────────────────────────────────────────

  /**
   * Delete a file from the filesystem.
   *
   * @param {string} tenantId
   * @param {string} filePath
   * @returns {Promise<boolean>}
   */
  async deleteFile(tenantId, filePath) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(filePath);
    const absPath = this.#resolve(tenantId, relPath);

    try {
      await fs.unlink(absPath);
      debugLog("deleteFile OK:", absPath);
      return true;
    } catch (err) {
      if (err?.code === "ENOENT") return false;
      throw { code: "MP_FS_ERROR", message: `[Filesystem deleteFile] ${err?.message || err}`, cause: err };
    }
  }

  // ── listFiles ────────────────────────────────────────────────────────

  /**
   * Recursively list files under a prefix.
   *
   * @param {string} tenantId
   * @param {string} prefix
   * @param {Object} [options]
   * @param {number} [options.maxKeys=1000]
   * @returns {Promise<{ items: import('../storageProvider.js').FileEntry[], cursor?: string }>}
   */
  async listFiles(tenantId, prefix = "", options = {}) {
    validateTenantId(tenantId);
    const safePfx = prefix ? sanitizeStoragePath(prefix) : "";
    const targetDir = safePfx
      ? this.#resolve(tenantId, safePfx)
      : path.resolve(this.#storageRoot, tenantId);

    const maxKeys = options.maxKeys || 1000;
    const items = [];

    /**
     * @param {string} dir
     * @param {string} relPrefix
     */
    const walk = async (dir, relPrefix) => {
      if (items.length >= maxKeys) return;

      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return; // directory does not exist — no items
      }

      for (const entry of entries) {
        if (items.length >= maxKeys) return;
        if (entry.name === ".trash" || entry.name === ".tmp") continue;

        const fullPath = path.join(dir, entry.name);
        const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          await walk(fullPath, relPath);
        } else {
          try {
            const stat = await fs.stat(fullPath);
            items.push({
              key: `${tenantId}/${relPath}`,
              size: stat.size,
              lastModified: stat.mtime.toISOString(),
            });
          } catch {
            items.push({
              key: `${tenantId}/${relPath}`,
              size: 0,
              lastModified: "",
            });
          }
        }
      }
    };

    await walk(targetDir, safePfx);
    debugLog("listFiles OK:", targetDir, `${items.length} items`);

    // Filesystem provider does not support cursor-based pagination — all
    // results are returned in one shot (capped at maxKeys).
    return { items };
  }

  // ── getSignedUrl ─────────────────────────────────────────────────────

  /**
   * Filesystem has no concept of signed URLs.  Returns a local file:// URI
   * in development, or throws in production (callers should use downloadFile
   * or serve through Express instead).
   *
   * @param {string} tenantId
   * @param {string} filePath
   * @param {number} [_expiresIn]
   * @returns {Promise<string>}
   */
  async getSignedUrl(tenantId, filePath, _expiresIn) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(filePath);

    if (process.env.NODE_ENV === "production") {
      throw {
        code: "MP_FS_NO_SIGNED_URL",
        message: "Filesystem provider does not support signed URLs in production. Use the R2 provider or serve files through the API.",
      };
    }

    // In development, return a relative API path that the storageRouter can serve
    const apiPath = `/api/storage/file?path=${encodeURIComponent(relPath)}`;
    debugLog("getSignedUrl (dev fallback):", apiPath);
    return apiPath;
  }

  // ── copyFile ─────────────────────────────────────────────────────────

  /**
   * Copy a file on the local filesystem.
   *
   * @param {string} tenantId
   * @param {string} sourcePath
   * @param {string} destPath
   * @returns {Promise<{ key: string }>}
   */
  async copyFile(tenantId, sourcePath, destPath) {
    validateTenantId(tenantId);
    const srcRel = sanitizeStoragePath(sourcePath);
    const dstRel = sanitizeStoragePath(destPath);
    const srcAbs = this.#resolve(tenantId, srcRel);
    const dstAbs = this.#resolve(tenantId, dstRel);

    try {
      await fs.mkdir(path.dirname(dstAbs), { recursive: true });
      await fs.copyFile(srcAbs, dstAbs);
      const key = `${tenantId}/${dstRel}`;
      debugLog("copyFile OK:", srcAbs, "->", dstAbs);
      return { key };
    } catch (err) {
      if (err?.code === "ENOENT") {
        throw { code: "MP_NOT_FOUND", message: `Source file not found: ${srcRel}` };
      }
      throw { code: "MP_FS_ERROR", message: `[Filesystem copyFile] ${err?.message || err}`, cause: err };
    }
  }

  // ── moveFile ─────────────────────────────────────────────────────────

  /**
   * Move (rename) a file on the local filesystem.
   * Uses fs.rename which is atomic on the same volume.
   *
   * @param {string} tenantId
   * @param {string} sourcePath
   * @param {string} destPath
   * @returns {Promise<{ key: string }>}
   */
  async moveFile(tenantId, sourcePath, destPath) {
    validateTenantId(tenantId);
    const srcRel = sanitizeStoragePath(sourcePath);
    const dstRel = sanitizeStoragePath(destPath);
    const srcAbs = this.#resolve(tenantId, srcRel);
    const dstAbs = this.#resolve(tenantId, dstRel);

    try {
      await fs.mkdir(path.dirname(dstAbs), { recursive: true });
      await fs.rename(srcAbs, dstAbs);
      const key = `${tenantId}/${dstRel}`;
      debugLog("moveFile OK:", srcAbs, "->", dstAbs);
      return { key };
    } catch (err) {
      if (err?.code === "ENOENT") {
        throw { code: "MP_NOT_FOUND", message: `Source file not found: ${srcRel}` };
      }
      // Cross-device rename — fall back to copy+delete
      if (err?.code === "EXDEV") {
        const result = await this.copyFile(tenantId, sourcePath, destPath);
        await this.deleteFile(tenantId, sourcePath);
        return result;
      }
      throw { code: "MP_FS_ERROR", message: `[Filesystem moveFile] ${err?.message || err}`, cause: err };
    }
  }

  // ── fileExists ───────────────────────────────────────────────────────

  /**
   * Check whether a file exists on disk.
   *
   * @param {string} tenantId
   * @param {string} filePath
   * @returns {Promise<boolean>}
   */
  async fileExists(tenantId, filePath) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(filePath);
    const absPath = this.#resolve(tenantId, relPath);

    try {
      const stat = await fs.stat(absPath);
      return stat.isFile();
    } catch {
      return false;
    }
  }

  // ── getStats ─────────────────────────────────────────────────────────

  /**
   * Delegate to the existing storageService.getStats and map the result
   * to the provider interface shape.
   *
   * @param {string} tenantId
   * @returns {Promise<import('../storageProvider.js').StorageStats>}
   */
  async getStats(tenantId) {
    validateTenantId(tenantId);

    const raw = await fsGetStats(this.#storageRoot, tenantId);
    debugLog("getStats OK:", tenantId, `files=${raw.totalFiles} size=${raw.totalSizeBytes}`);
    return {
      totalFiles: raw.totalFiles,
      totalSize: raw.totalSizeBytes,
    };
  }
}
