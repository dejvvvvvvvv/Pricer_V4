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
export function getHealthStatus({ version = "unknown", getCacheStats, getQueueStats } = {}) {
  const mem = process.memoryUsage();
  const uptimeSec = Math.floor(process.uptime());

  const payload = {
    status: "healthy",
    service: "modelpricer-backend-local",
    version,
    uptime: uptimeSec,
    uptimeHuman: formatUptime(uptimeSec),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    node: process.version,
  };

  // Lightweight cache summary (hit rate only — no sensitive details)
  if (getCacheStats) {
    try {
      const cs = getCacheStats();
      payload.cache = { size: cs.size, hitRate: cs.hitRate };
    } catch {
      payload.cache = { available: false };
    }
  }

  // Lightweight queue summary (counts only)
  if (getQueueStats) {
    try {
      const qs = getQueueStats();
      payload.queue = { queued: qs.queued, processing: qs.processing };
    } catch {
      payload.queue = { available: false };
    }
  }

  return payload;
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
 * @param {object} [opts.externalServices] - External service configuration status (env-derived, no secrets)
 * @returns {Promise<object>} Detailed health status payload
 */
export async function getDetailedHealthStatus({
  version = "unknown",
  checkSlicer,
  getSlicerVersion,
  workspaceRoot,
  getCacheStats,
  getQueueStats,
  externalServices,
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
  let workspaceAvailable = false;
  if (workspaceRoot) {
    try {
      const fsmod = await import("node:fs/promises");
      await fsmod.access(workspaceRoot);
      workspaceAvailable = true;
    } catch {
      workspaceAvailable = false;
    }
  }

  // Collect optional stats
  const cacheStats = getCacheStats ? getCacheStats() : null;
  const queueStats = getQueueStats ? getQueueStats() : null;

  // Build services object with slicer + workspace + external integrations
  const services = {
    slicer: {
      status: slicerAvailable ? "ok" : "unavailable",
      version: slicerVersion || "unknown",
    },
    workspace: {
      status: workspaceAvailable ? "ok" : "unavailable",
    },
  };

  // Merge external service statuses (Supabase, Stripe, Email, Sentry, Storage provider)
  if (externalServices) {
    for (const [key, value] of Object.entries(externalServices)) {
      services[key] = value;
    }
  }

  // Determine overall status from all services
  const allStatuses = Object.values(services).map((s) =>
    typeof s === "object" && s !== null ? s.status : s
  );
  const hasError = allStatuses.some((s) => s === "error");
  const hasUnavailable = allStatuses.some(
    (s) => s === "unavailable" || s === "not_configured"
  );
  const overallStatus = hasError
    ? "degraded"
    : hasUnavailable
      ? "partial"
      : "healthy";

  return {
    status: overallStatus,
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
    services,
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
