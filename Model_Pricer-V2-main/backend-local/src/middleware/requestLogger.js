/**
 * Request logging middleware for ModelPricer backend API.
 *
 * Logs method, URL, status code, response time, and tenant ID.
 * Uses colored output for different status ranges (2xx green, 4xx yellow, 5xx red).
 * Skips health check endpoints by default to reduce noise.
 * In production, only logs slow requests (>1s) and errors/warnings.
 *
 * @module middleware/requestLogger
 */

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

/**
 * Get colored status text based on HTTP status code range.
 * @param {number} status
 * @returns {string}
 */
function coloredStatus(status) {
  if (status >= 500) return `${colors.red}${status}${colors.reset}`;
  if (status >= 400) return `${colors.yellow}${status}${colors.reset}`;
  if (status >= 300) return `${colors.cyan}${status}${colors.reset}`;
  return `${colors.green}${status}${colors.reset}`;
}

/**
 * Get colored duration text (red if slow, yellow if moderate).
 * @param {number} ms
 * @returns {string}
 */
function coloredDuration(ms) {
  if (ms >= 5000) return `${colors.red}${ms}ms${colors.reset}`;
  if (ms >= 1000) return `${colors.yellow}${ms}ms${colors.reset}`;
  return `${colors.gray}${ms}ms${colors.reset}`;
}

/**
 * Creates a request logging middleware.
 *
 * @param {Object} [options]
 * @param {boolean} [options.logBody=false] - Whether to log request body (disabled by default for security).
 * @param {string[]} [options.skipPaths=['/api/health']] - Path prefixes to skip logging.
 * @returns {import('express').RequestHandler}
 */
export function requestLogger({ logBody = false, skipPaths = ["/api/health"] } = {}) {
  return (req, res, next) => {
    // Skip health checks and other noisy paths
    if (skipPaths.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const start = Date.now();
    const { method, path } = req;

    // Hook into response finish event
    res.on("finish", () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

      const methodStr = `${colors.bold}${method.padEnd(7)}${colors.reset}`;
      const statusStr = coloredStatus(status);
      const durationStr = coloredDuration(duration);
      const tenantStr = req.tenantId ? `${colors.gray}[${req.tenantId}]${colors.reset}` : "";

      const message = `${methodStr} ${path} ${statusStr} ${durationStr} ${tenantStr}`;

      if (level === "error") {
        console.error(`[API] ${message}`);
      } else if (level === "warn") {
        console.warn(`[API] ${message}`);
      } else if (process.env.NODE_ENV !== "production" || duration > 1000) {
        // In production, only log slow requests (>1s)
        console.log(`[API] ${message}`);
      }

      // Optionally log request body (never log sensitive fields)
      if (logBody && req.body && Object.keys(req.body).length > 0 && level !== "info") {
        const safeBody = { ...req.body };
        delete safeBody.password;
        delete safeBody.token;
        delete safeBody.secret;
        delete safeBody.apiKey;
        delete safeBody.accessToken;
        delete safeBody.refreshToken;
        console.log(`[API] Body:`, safeBody);
      }
    });

    next();
  };
}
