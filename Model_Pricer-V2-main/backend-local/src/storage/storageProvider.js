/**
 * Storage Provider — Abstract interface for storage backends.
 *
 * Defines the contract that all storage providers (filesystem, R2, etc.) must
 * implement. This module also provides shared tenant-ID validation used by
 * every concrete provider.
 *
 * Usage:
 *   import { createStorageProvider } from './storageProviderFactory.js';
 *   const storage = createStorageProvider();
 *   await storage.uploadFile(tenantId, 'orders/model.stl', buffer, 'model/stl');
 *
 * @module storageProvider
 */

// ── Tenant-ID validation (shared across all providers) ───────────────────

/**
 * Characters forbidden inside a tenantId.
 * Blocks path traversal, null bytes and shell metacharacters.
 * @type {RegExp}
 */
const UNSAFE_TENANT_RE = /[/\\..\0<>|:*?"]/;

/**
 * Validate a tenant identifier.
 * Every public method on a provider MUST call this before doing anything else.
 *
 * Rules:
 *  - Must be a non-empty string
 *  - No slashes, backslashes, dots-dot, null bytes or shell metacharacters
 *  - Maximum 128 characters
 *
 * @param {string} tenantId
 * @throws {{ code: string, message: string }} MP_INVALID_TENANT
 */
export function validateTenantId(tenantId) {
  if (!tenantId || typeof tenantId !== "string") {
    throw { code: "MP_INVALID_TENANT", message: "tenantId is required and must be a non-empty string" };
  }
  if (tenantId.length > 128) {
    throw { code: "MP_INVALID_TENANT", message: "tenantId must be 128 characters or fewer" };
  }
  if (UNSAFE_TENANT_RE.test(tenantId)) {
    throw { code: "MP_INVALID_TENANT", message: "tenantId contains forbidden characters" };
  }
  if (tenantId === "." || tenantId === "..") {
    throw { code: "MP_INVALID_TENANT", message: "tenantId cannot be '.' or '..'" };
  }
}

/**
 * Sanitize a storage path (the part *after* the tenant prefix).
 * Rejects null bytes and '..' segments.
 *
 * @param {string} p
 * @returns {string} Normalised path with forward slashes, no leading slash
 * @throws {{ code: string, message: string }} MP_INVALID_PATH
 */
export function sanitizeStoragePath(p) {
  if (!p || typeof p !== "string") {
    throw { code: "MP_INVALID_PATH", message: "path is required and must be a non-empty string" };
  }
  if (p.includes("\0")) {
    throw { code: "MP_INVALID_PATH", message: "path contains null bytes" };
  }
  const normalized = p.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/");
  for (const seg of segments) {
    if (seg === "..") {
      throw { code: "MP_INVALID_PATH", message: "path traversal (..) is not allowed" };
    }
  }
  return normalized;
}

// ── Abstract StorageProvider ─────────────────────────────────────────────

/**
 * @typedef {Object} UploadResult
 * @property {string} key   - Full storage key (tenantId/path)
 * @property {number} size  - Size in bytes
 * @property {string} [etag] - ETag / checksum when available
 */

/**
 * @typedef {Object} DownloadResult
 * @property {Buffer} buffer      - File contents
 * @property {string} contentType - MIME type
 * @property {number} size        - Size in bytes
 */

/**
 * @typedef {Object} FileEntry
 * @property {string} key          - Full storage key
 * @property {number} size         - Size in bytes
 * @property {string} lastModified - ISO-8601 timestamp
 */

/**
 * @typedef {Object} StorageStats
 * @property {number} totalFiles - Total number of files
 * @property {number} totalSize  - Total size in bytes
 */

/**
 * Abstract base class for storage providers.
 *
 * Concrete providers MUST override every method.  The default implementations
 * throw so that missing overrides are caught immediately during development.
 *
 * @abstract
 */
export class StorageProvider {
  /**
   * Human-readable provider name (for logging).
   * @type {string}
   */
  get name() {
    return "abstract";
  }

  /**
   * Upload a file.
   *
   * @param {string} tenantId    - Tenant identifier
   * @param {string} path        - Relative path inside the tenant scope
   * @param {Buffer} buffer      - File contents
   * @param {string} contentType - MIME type (e.g. 'model/stl')
   * @returns {Promise<UploadResult>}
   */
  async uploadFile(_tenantId, _path, _buffer, _contentType) {
    throw new Error("StorageProvider.uploadFile() must be implemented by subclass");
  }

  /**
   * Download a file.
   *
   * @param {string} tenantId - Tenant identifier
   * @param {string} path     - Relative path inside the tenant scope
   * @returns {Promise<DownloadResult>}
   */
  async downloadFile(_tenantId, _path) {
    throw new Error("StorageProvider.downloadFile() must be implemented by subclass");
  }

  /**
   * Delete a file.
   *
   * @param {string} tenantId - Tenant identifier
   * @param {string} path     - Relative path inside the tenant scope
   * @returns {Promise<boolean>} true if deleted, false if it did not exist
   */
  async deleteFile(_tenantId, _path) {
    throw new Error("StorageProvider.deleteFile() must be implemented by subclass");
  }

  /**
   * List files under a prefix.
   *
   * @param {string} tenantId          - Tenant identifier
   * @param {string} prefix            - Key prefix (e.g. 'orders/')
   * @param {Object} [options]
   * @param {number} [options.maxKeys]  - Maximum number of entries (default 1000)
   * @param {string} [options.cursor]   - Continuation token for pagination
   * @returns {Promise<{ items: FileEntry[], cursor?: string }>}
   */
  async listFiles(_tenantId, _prefix, _options) {
    throw new Error("StorageProvider.listFiles() must be implemented by subclass");
  }

  /**
   * Generate a time-limited signed URL for downloading a file.
   *
   * @param {string} tenantId           - Tenant identifier
   * @param {string} path               - Relative path inside the tenant scope
   * @param {number} [expiresIn=3600]   - Lifetime in seconds (default 1 hour)
   * @returns {Promise<string>} Pre-signed URL
   */
  async getSignedUrl(_tenantId, _path, _expiresIn) {
    throw new Error("StorageProvider.getSignedUrl() must be implemented by subclass");
  }

  /**
   * Copy a file within the same tenant scope.
   *
   * @param {string} tenantId   - Tenant identifier
   * @param {string} sourcePath - Source relative path
   * @param {string} destPath   - Destination relative path
   * @returns {Promise<{ key: string }>}
   */
  async copyFile(_tenantId, _sourcePath, _destPath) {
    throw new Error("StorageProvider.copyFile() must be implemented by subclass");
  }

  /**
   * Move (rename) a file within the same tenant scope.
   * Default implementation: copy + delete.
   *
   * @param {string} tenantId   - Tenant identifier
   * @param {string} sourcePath - Source relative path
   * @param {string} destPath   - Destination relative path
   * @returns {Promise<{ key: string }>}
   */
  async moveFile(tenantId, sourcePath, destPath) {
    const result = await this.copyFile(tenantId, sourcePath, destPath);
    await this.deleteFile(tenantId, sourcePath);
    return result;
  }

  /**
   * Check whether a file exists.
   *
   * @param {string} tenantId - Tenant identifier
   * @param {string} path     - Relative path inside the tenant scope
   * @returns {Promise<boolean>}
   */
  async fileExists(_tenantId, _path) {
    throw new Error("StorageProvider.fileExists() must be implemented by subclass");
  }

  /**
   * Get aggregate storage statistics for a tenant.
   *
   * @param {string} tenantId - Tenant identifier
   * @returns {Promise<StorageStats>}
   */
  async getStats(_tenantId) {
    throw new Error("StorageProvider.getStats() must be implemented by subclass");
  }
}
