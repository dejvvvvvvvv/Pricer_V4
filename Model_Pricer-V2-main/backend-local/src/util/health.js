/**
 * Health check utility — returns server diagnostics without exposing sensitive info.
 *
 * Included: status, uptime, timestamp, version, memory usage, node version,
 *           slicer availability + version, cache stats, queue stats.
 * Excluded: file paths, env vars, internal IPs, credentials.
 *
 * @module util/health
 */

/**
 * Returns basic health status payload.
 *
 * @param {object} opts
 * @param {string} opts.version - Package version from package.json
 * @returns {object} Health status payload
 */
export function getHealthStatus({ version = "unknown" } = {}) {
  const mem = process.memoryUsage();
  return {
    status: "healthy",
    service: "modelpricer-backend-local",
    version,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    },
    node: process.version,
  };
}

/**
 * Returns detailed health status with additional diagnostics.
 * Used by /api/health/detailed endpoint.
 *
 * @param {object} opts
 * @param {string} opts.version - Package version from package.json
 * @param {Function} [opts.checkSlicer] - Async function that resolves slicer command path (or empty string)
 * @param {Function} [opts.getSlicerVersion] - Async function that returns slicer version string (or null)
 * @param {string} [opts.workspaceRoot] - Path to workspace root (existence is checked, path not exposed)
 * @param {Function} [opts.getCacheStats] - Function returning cache statistics
 * @param {Function} [opts.getQueueStats] - Function returning queue statistics
 * @returns {Promise<object>} Detailed health status payload
 */
export async function getDetailedHealthStatus({
  version = "unknown",
  checkSlicer,
  getSlicerVersion,
  workspaceRoot,
  getCacheStats,
  getQueueStats,
} = {}) {
  const mem = process.memoryUsage();
  const cpus = await import("node:os").then((os) => os.cpus());

  // Check slicer availability without exposing paths
  let slicerAvailable = false;
  if (checkSlicer) {
    try {
      const cmd = await checkSlicer();
      slicerAvailable = !!cmd;
    } catch {
      slicerAvailable = false;
    }
  }

  // Get slicer version if available
  let slicerVersion = null;
  if (slicerAvailable && getSlicerVersion) {
    try {
      slicerVersion = await getSlicerVersion();
    } catch {
      slicerVersion = null;
    }
  }

  // Check workspace directory exists without exposing path
  let storageAvailable = false;
  if (workspaceRoot) {
    try {
      const fsmod = await import("node:fs/promises");
      await fsmod.access(workspaceRoot);
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
  }

  // Collect optional stats
  const cacheStats = getCacheStats ? getCacheStats() : null;
  const queueStats = getQueueStats ? getQueueStats() : null;

  return {
    status: "healthy",
    service: "modelpricer-backend-local",
    version,
    uptime: Math.floor(process.uptime()),
    uptimeHuman: formatUptime(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
      externalMB: Math.round((mem.external || 0) / 1024 / 1024),
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      cpuCount: cpus.length,
      nodeVersion: process.version,
    },
    services: {
      slicer: slicerAvailable ? "available" : "unavailable",
      slicerVersion: slicerVersion || "unknown",
      storage: storageAvailable ? "available" : "unavailable",
    },
    ...(cacheStats ? { cache: cacheStats } : {}),
    ...(queueStats ? { queue: queueStats } : {}),
    node: process.version,
  };
}

/**
 * Parse PrusaSlicer version from --help or --version output.
 *
 * Looks for patterns like:
 *   "PrusaSlicer-2.7.4+linux-x64"
 *   "PrusaSlicer 2.7.4"
 *   "PrusaSlicer version 2.7.4"
 *   "based on Slic3r 2.7.4"
 *
 * @param {string} output - stdout or stderr from PrusaSlicer --help or --version
 * @returns {string|null} Version string (e.g., "2.7.4") or null if not found
 */
export function parseSlicerVersion(output) {
  if (!output) return null;

  // Try common version patterns in PrusaSlicer output
  const patterns = [
    // "PrusaSlicer-2.7.4+..." or "PrusaSlicer-2.7.4-..."
    /PrusaSlicer[- ]v?(\d+\.\d+(?:\.\d+)?(?:[+\-][^\s]*)?)/i,
    // "version 2.7.4" or "Version: 2.7.4"
    /version[:\s]+v?(\d+\.\d+(?:\.\d+)?)/i,
    // "Slic3r 2.7.4" (older builds)
    /Slic3r[- ]v?(\d+\.\d+(?:\.\d+)?)/i,
  ];

  for (const re of patterns) {
    const m = output.match(re);
    if (m) {
      return m[1];
    }
  }

  return null;
}

/**
 * Format seconds into human-readable uptime string.
 * @param {number} seconds
 * @returns {string}
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}
