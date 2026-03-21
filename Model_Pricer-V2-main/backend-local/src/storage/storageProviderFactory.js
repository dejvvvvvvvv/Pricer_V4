/**
 * Storage Provider Factory — returns the correct storage provider based on
 * the STORAGE_PROVIDER environment variable.
 *
 * Supported values:
 *   'filesystem' (default) — local disk, wraps existing storageService.js
 *   'r2'                   — Cloudflare R2 via S3-compatible SDK
 *
 * Usage:
 *   import { createStorageProvider } from './storageProviderFactory.js';
 *   const storage = createStorageProvider();
 *   const result  = await storage.uploadFile(tenantId, 'path/file.stl', buf, 'model/stl');
 *
 * The factory caches the provider instance (singleton) so that repeated
 * calls return the same object — this avoids creating multiple S3Client
 * instances in the R2 case.
 *
 * @module storageProviderFactory
 */

import { FilesystemProvider } from "./providers/filesystemProvider.js";

/** @type {import('./storageProvider.js').StorageProvider | null} */
let cachedProvider = null;

/**
 * Create (or return the cached) storage provider.
 *
 * @param {Object} [opts]              - Provider-specific options (passed through to constructor)
 * @param {boolean} [opts.fresh=false] - Force a new instance instead of the cached one
 * @returns {import('./storageProvider.js').StorageProvider}
 */
export function createStorageProvider(opts = {}) {
  if (cachedProvider && !opts.fresh) return cachedProvider;

  const providerName = (process.env.STORAGE_PROVIDER || "filesystem").toLowerCase().trim();

  switch (providerName) {
    case "r2": {
      // Dynamic import avoided — R2Provider is imported eagerly so that
      // misconfiguration surfaces immediately at startup, not lazily.
      // If @aws-sdk/client-s3 is not installed the import will throw a
      // clear error right here.
      //
      // NOTE: We use a dynamic import() wrapped in a sync getter so that
      // the heavy AWS SDK is only loaded when actually needed (i.e. when
      // STORAGE_PROVIDER=r2).  The factory still returns synchronously by
      // throwing if called before the provider is ready.
      throw new Error(
        "R2 provider requires async initialisation. Use createStorageProviderAsync() instead."
      );
    }
    case "filesystem": {
      cachedProvider = new FilesystemProvider(opts);
      return cachedProvider;
    }
    default:
      throw new Error(
        `Unknown STORAGE_PROVIDER "${providerName}". Supported values: filesystem, r2`
      );
  }
}

/**
 * Async version of createStorageProvider.
 * Required for the R2 provider because @aws-sdk/client-s3 may need to be
 * loaded dynamically.
 *
 * @param {Object} [opts] - Provider-specific options
 * @param {boolean} [opts.fresh=false]
 * @returns {Promise<import('./storageProvider.js').StorageProvider>}
 */
export async function createStorageProviderAsync(opts = {}) {
  if (cachedProvider && !opts.fresh) return cachedProvider;

  const providerName = (process.env.STORAGE_PROVIDER || "filesystem").toLowerCase().trim();

  switch (providerName) {
    case "r2": {
      const { R2Provider } = await import("./providers/r2Provider.js");
      cachedProvider = new R2Provider(opts);
      return cachedProvider;
    }
    case "filesystem": {
      cachedProvider = new FilesystemProvider(opts);
      return cachedProvider;
    }
    default:
      throw new Error(
        `Unknown STORAGE_PROVIDER "${providerName}". Supported values: filesystem, r2`
      );
  }
}

/**
 * Clear the cached provider instance.
 * Primarily useful in tests to reset state between runs.
 */
export function resetStorageProvider() {
  cachedProvider = null;
}
