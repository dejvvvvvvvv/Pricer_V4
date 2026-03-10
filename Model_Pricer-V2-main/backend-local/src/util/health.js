/**
 * Health check utility — returns server diagnostics without exposing sensitive info.
 *
 * Included: status, uptime, timestamp, version, memory usage, node version.
 * Excluded: file paths, env vars, internal IPs, credentials.
 *
 * @param {object} opts
 * @param {string} opts.version - Package version from package.json
 * @returns {object} Health status payload
 */
export function getHealthStatus({ version = "unknown" } = {}) {
  const mem = process.memoryUsage();
  return {
    status: "ok",
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
