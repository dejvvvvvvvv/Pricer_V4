/**
 * R2 Storage Provider — Cloudflare R2 (S3-compatible) implementation.
 *
 * Uses @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner because R2
 * exposes an S3-compatible API.
 *
 * Required env vars (when STORAGE_PROVIDER=r2):
 *   R2_ACCOUNT_ID       – Cloudflare account ID
 *   R2_ACCESS_KEY_ID    – R2 API token access key
 *   R2_ACCESS_KEY_SECRET – R2 API token secret key
 *   R2_BUCKET_NAME      – Bucket name (default: modelpricer-files)
 *   R2_PUBLIC_URL       – (optional) Public bucket URL for unsigned access
 *
 * Tenant isolation:
 *   Every object key is prefixed with the validated tenantId:
 *     <tenantId>/<path>
 *
 * @module r2Provider
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { StorageProvider, validateTenantId, sanitizeStoragePath } from "../storageProvider.js";

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Tiny debug logger — logs only when DEBUG or NODE_ENV=development.
 * @param  {...any} args
 */
function debugLog(...args) {
  if (process.env.DEBUG || process.env.NODE_ENV === "development") {
    console.debug("[R2Provider]", ...args);
  }
}

/**
 * Build the full R2 object key from tenant + relative path.
 * @param {string} tenantId
 * @param {string} relPath
 * @returns {string}
 */
function buildKey(tenantId, relPath) {
  return `${tenantId}/${relPath}`;
}

/**
 * Transient error codes that warrant an automatic retry.
 * @type {Set<string>}
 */
const TRANSIENT_CODES = new Set([
  "SlowDown",
  "ServiceUnavailable",
  "InternalError",
  "RequestTimeout",
  "RequestTimeTooSkewed",
]);

/**
 * Transient HTTP status codes.
 * @type {Set<number>}
 */
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);

/**
 * Determine whether an error is transient and should be retried.
 * @param {Error} err
 * @returns {boolean}
 */
function isTransient(err) {
  if (TRANSIENT_CODES.has(err?.Code) || TRANSIENT_CODES.has(err?.name)) return true;
  if (TRANSIENT_STATUSES.has(err?.$metadata?.httpStatusCode)) return true;
  if (err?.code === "ECONNRESET" || err?.code === "ETIMEDOUT" || err?.code === "EPIPE") return true;
  return false;
}

/**
 * Execute an async operation with exponential-backoff retry.
 *
 * @template T
 * @param {() => Promise<T>} fn        - Async function to execute
 * @param {Object} [opts]
 * @param {number} [opts.maxRetries=3]  - Max retry attempts
 * @param {number} [opts.baseDelay=200] - Initial delay in ms
 * @returns {Promise<T>}
 */
async function withRetry(fn, { maxRetries = 3, baseDelay = 200 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isTransient(err)) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
        debugLog(`Transient error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, err?.Code || err?.name || err?.code);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

/**
 * Wrap an R2/S3 error into a friendlier object with an MP_ code.
 *
 * @param {string} operation - e.g. 'uploadFile'
 * @param {Error}  err
 * @returns {never}
 */
function wrapError(operation, err) {
  // Preserve typed errors thrown by our own validation
  if (err?.code?.startsWith?.("MP_")) throw err;

  const status = err?.$metadata?.httpStatusCode;
  const s3Code = err?.Code || err?.name || "UnknownError";

  if (status === 404 || s3Code === "NoSuchKey" || s3Code === "NotFound") {
    throw { code: "MP_NOT_FOUND", message: `[R2 ${operation}] Object not found` };
  }
  if (status === 403 || s3Code === "AccessDenied") {
    throw { code: "MP_R2_ACCESS_DENIED", message: `[R2 ${operation}] Access denied — check R2 credentials and bucket permissions` };
  }

  throw {
    code: "MP_R2_ERROR",
    message: `[R2 ${operation}] ${s3Code}: ${err?.message || String(err)}`,
    cause: err,
  };
}

/**
 * Collect a ReadableStream / Node stream body into a Buffer.
 * @param {import('stream').Readable | ReadableStream | Uint8Array} body
 * @returns {Promise<Buffer>}
 */
async function streamToBuffer(body) {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);

  // Node readable stream
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// ── R2Provider ───────────────────────────────────────────────────────────

export class R2Provider extends StorageProvider {
  /** @type {S3Client} */
  #client;

  /** @type {string} */
  #bucket;

  /**
   * @param {Object} [opts]                 - Override env-var driven defaults (useful for testing)
   * @param {string} [opts.accountId]
   * @param {string} [opts.accessKeyId]
   * @param {string} [opts.secretAccessKey]
   * @param {string} [opts.bucket]
   * @param {S3Client} [opts.client]        - Pre-built S3Client (for testing / DI)
   */
  constructor(opts = {}) {
    super();

    const accountId = opts.accountId || process.env.R2_ACCOUNT_ID;
    const accessKeyId = opts.accessKeyId || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = opts.secretAccessKey || process.env.R2_ACCESS_KEY_SECRET;
    this.#bucket = opts.bucket || process.env.R2_BUCKET_NAME || "modelpricer-files";

    if (opts.client) {
      this.#client = opts.client;
    } else {
      if (!accountId) throw new Error("R2Provider: R2_ACCOUNT_ID is required");
      if (!accessKeyId) throw new Error("R2Provider: R2_ACCESS_KEY_ID is required");
      if (!secretAccessKey) throw new Error("R2Provider: R2_ACCESS_KEY_SECRET is required");

      this.#client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }

    debugLog(`Initialised — bucket=${this.#bucket}`);
  }

  /** @override */
  get name() {
    return "r2";
  }

  // ── uploadFile ───────────────────────────────────────────────────────

  /**
   * Upload a file to R2.
   *
   * @param {string} tenantId
   * @param {string} path
   * @param {Buffer} buffer
   * @param {string} contentType
   * @returns {Promise<import('../storageProvider.js').UploadResult>}
   */
  async uploadFile(tenantId, path, buffer, contentType) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(path);
    const key = buildKey(tenantId, relPath);

    try {
      const result = await withRetry(() =>
        this.#client.send(
          new PutObjectCommand({
            Bucket: this.#bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType || "application/octet-stream",
          })
        )
      );
      debugLog("uploadFile OK:", key, `${buffer.length} bytes`);
      return { key, size: buffer.length, etag: result.ETag || "" };
    } catch (err) {
      wrapError("uploadFile", err);
    }
  }

  // ── downloadFile ─────────────────────────────────────────────────────

  /**
   * Download a file from R2.
   *
   * @param {string} tenantId
   * @param {string} path
   * @returns {Promise<import('../storageProvider.js').DownloadResult>}
   */
  async downloadFile(tenantId, path) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(path);
    const key = buildKey(tenantId, relPath);

    try {
      const result = await withRetry(() =>
        this.#client.send(
          new GetObjectCommand({
            Bucket: this.#bucket,
            Key: key,
          })
        )
      );
      const buffer = await streamToBuffer(result.Body);
      debugLog("downloadFile OK:", key, `${buffer.length} bytes`);
      return {
        buffer,
        contentType: result.ContentType || "application/octet-stream",
        size: buffer.length,
      };
    } catch (err) {
      wrapError("downloadFile", err);
    }
  }

  // ── deleteFile ───────────────────────────────────────────────────────

  /**
   * Delete a file from R2. Returns false if the file did not exist.
   *
   * @param {string} tenantId
   * @param {string} path
   * @returns {Promise<boolean>}
   */
  async deleteFile(tenantId, path) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(path);
    const key = buildKey(tenantId, relPath);

    try {
      // Check existence first — DeleteObject on R2 returns 204 even for
      // non-existent keys, so we need HeadObject to know the truth.
      const exists = await this.fileExists(tenantId, path);
      if (!exists) return false;

      await withRetry(() =>
        this.#client.send(
          new DeleteObjectCommand({
            Bucket: this.#bucket,
            Key: key,
          })
        )
      );
      debugLog("deleteFile OK:", key);
      return true;
    } catch (err) {
      // If the file vanished between the head and the delete, that is fine
      if (err?.code === "MP_NOT_FOUND") return false;
      wrapError("deleteFile", err);
    }
  }

  // ── listFiles ────────────────────────────────────────────────────────

  /**
   * List files under a prefix inside a tenant scope.
   *
   * @param {string} tenantId
   * @param {string} prefix
   * @param {Object} [options]
   * @param {number} [options.maxKeys=1000]
   * @param {string} [options.cursor]
   * @returns {Promise<{ items: import('../storageProvider.js').FileEntry[], cursor?: string }>}
   */
  async listFiles(tenantId, prefix = "", options = {}) {
    validateTenantId(tenantId);

    const safePfx = prefix ? sanitizeStoragePath(prefix) : "";
    const fullPrefix = safePfx ? `${tenantId}/${safePfx}` : `${tenantId}/`;
    const maxKeys = options.maxKeys || 1000;

    try {
      const result = await withRetry(() =>
        this.#client.send(
          new ListObjectsV2Command({
            Bucket: this.#bucket,
            Prefix: fullPrefix,
            MaxKeys: maxKeys,
            ContinuationToken: options.cursor || undefined,
          })
        )
      );

      const items = (result.Contents || []).map((obj) => ({
        key: obj.Key,
        size: obj.Size || 0,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : "",
      }));

      debugLog("listFiles OK:", fullPrefix, `${items.length} items`);
      return {
        items,
        cursor: result.IsTruncated ? result.NextContinuationToken : undefined,
      };
    } catch (err) {
      wrapError("listFiles", err);
    }
  }

  // ── getSignedUrl ─────────────────────────────────────────────────────

  /**
   * Generate a presigned GET URL for downloading a file.
   *
   * @param {string} tenantId
   * @param {string} path
   * @param {number} [expiresIn=3600]
   * @returns {Promise<string>}
   */
  async getSignedUrl(tenantId, path, expiresIn = 3600) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(path);
    const key = buildKey(tenantId, relPath);

    try {
      const command = new GetObjectCommand({
        Bucket: this.#bucket,
        Key: key,
      });
      const url = await getSignedUrl(this.#client, command, { expiresIn });
      debugLog("getSignedUrl OK:", key, `expires=${expiresIn}s`);
      return url;
    } catch (err) {
      wrapError("getSignedUrl", err);
    }
  }

  // ── copyFile ─────────────────────────────────────────────────────────

  /**
   * Copy a file within the same tenant scope.
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
    const srcKey = buildKey(tenantId, srcRel);
    const dstKey = buildKey(tenantId, dstRel);

    try {
      await withRetry(() =>
        this.#client.send(
          new CopyObjectCommand({
            Bucket: this.#bucket,
            Key: dstKey,
            CopySource: `${this.#bucket}/${srcKey}`,
          })
        )
      );
      debugLog("copyFile OK:", srcKey, "->", dstKey);
      return { key: dstKey };
    } catch (err) {
      wrapError("copyFile", err);
    }
  }

  // ── moveFile ─────────────────────────────────────────────────────────

  /**
   * Move a file: copy then delete the source.
   * Overrides the base-class default to keep logging consistent.
   *
   * @param {string} tenantId
   * @param {string} sourcePath
   * @param {string} destPath
   * @returns {Promise<{ key: string }>}
   */
  async moveFile(tenantId, sourcePath, destPath) {
    const result = await this.copyFile(tenantId, sourcePath, destPath);
    await this.deleteFile(tenantId, sourcePath);
    debugLog("moveFile OK:", sourcePath, "->", destPath);
    return result;
  }

  // ── fileExists ───────────────────────────────────────────────────────

  /**
   * Check whether a file exists in R2.
   *
   * @param {string} tenantId
   * @param {string} path
   * @returns {Promise<boolean>}
   */
  async fileExists(tenantId, path) {
    validateTenantId(tenantId);
    const relPath = sanitizeStoragePath(path);
    const key = buildKey(tenantId, relPath);

    try {
      await this.#client.send(
        new HeadObjectCommand({
          Bucket: this.#bucket,
          Key: key,
        })
      );
      return true;
    } catch (err) {
      const status = err?.$metadata?.httpStatusCode;
      if (status === 404 || err?.name === "NotFound" || err?.Code === "NoSuchKey") {
        return false;
      }
      wrapError("fileExists", err);
    }
  }

  // ── getStats ─────────────────────────────────────────────────────────

  /**
   * Aggregate storage statistics for a tenant by paginating through all
   * objects under the tenant prefix.
   *
   * @param {string} tenantId
   * @returns {Promise<import('../storageProvider.js').StorageStats>}
   */
  async getStats(tenantId) {
    validateTenantId(tenantId);
    const prefix = `${tenantId}/`;

    let totalFiles = 0;
    let totalSize = 0;
    let cursor;

    do {
      const result = await withRetry(() =>
        this.#client.send(
          new ListObjectsV2Command({
            Bucket: this.#bucket,
            Prefix: prefix,
            MaxKeys: 1000,
            ContinuationToken: cursor || undefined,
          })
        )
      );

      for (const obj of result.Contents || []) {
        totalFiles++;
        totalSize += obj.Size || 0;
      }

      cursor = result.IsTruncated ? result.NextContinuationToken : undefined;
    } while (cursor);

    debugLog("getStats OK:", tenantId, `files=${totalFiles} size=${totalSize}`);
    return { totalFiles, totalSize };
  }
}
