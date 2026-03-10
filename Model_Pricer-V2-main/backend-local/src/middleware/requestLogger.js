/**
 * Request logging middleware for ModelPricer backend API.
 *
 * Logs method, URL, status code, response time, and tenant ID.
 * Skips health check endpoints by default to reduce noise.
 * In production, only logs slow requests (>1s) and errors/warnings.
 *
 * @module middleware/requestLogger
 */

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

      const message = `${method} ${path} ${status} ${duration}ms`;

      if (level === "error") {
        const logData = {
          method,
          path,
          status,
          duration: `${duration}ms`,
          tenantId: req.tenantId || "none",
        };
        console.error(`[API] ${message}`, logData);
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
