/**
 * Unit tests for backend request logging middleware.
 *
 * @module __tests__/requestLogger.test
 * @see ../middleware/requestLogger.js
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// ── Test helpers ─────────────────────────────────────────────────

const mockReq = (overrides = {}) => ({
  method: 'GET',
  path: '/api/models',
  ip: '127.0.0.1',
  connection: { remoteAddress: '127.0.0.1' },
  ...overrides,
});

/**
 * Creates a mock response that extends EventEmitter so we can
 * simulate the 'finish' event exactly like Express does.
 */
const mockRes = (statusCode = 200) => {
  const emitter = new EventEmitter();
  emitter.statusCode = statusCode;
  return emitter;
};

// ── Tests ────────────────────────────────────────────────────────

describe('requestLogger middleware', () => {
  let next;
  let requestLogger;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Fresh import each time to avoid stale module state
    vi.resetModules();
    const mod = await import('../middleware/requestLogger.js');
    requestLogger = mod.requestLogger;
    next = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  // ── 1. Calls next() — does not block the request ──

  it('should call next() without blocking the request', () => {
    const middleware = requestLogger();
    const req = mockReq();
    const res = mockRes();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  // ── 2. Logs on response finish with method, path, status, duration ──

  it('should log method, path, status, and duration on response finish', () => {
    const middleware = requestLogger();
    const req = mockReq({ method: 'POST', path: '/api/orders' });
    const res = mockRes(201);

    // Set non-production so 2xx gets logged
    process.env.NODE_ENV = 'development';

    middleware(req, res, next);

    // Advance time by 42ms to simulate request duration
    vi.advanceTimersByTime(42);
    res.emit('finish');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('POST /api/orders 201 42ms')
    );
  });

  // ── 3. Skips paths in skipPaths array ──

  it('should skip logging for paths in the skipPaths array', () => {
    const middleware = requestLogger({ skipPaths: ['/api/health'] });
    const req = mockReq({ path: '/api/health' });
    const res = mockRes();

    middleware(req, res, next);

    // next() is still called (request not blocked)
    expect(next).toHaveBeenCalledOnce();

    // But no finish listener should be registered
    res.emit('finish');
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should skip paths that start with a skipPaths prefix', () => {
    const middleware = requestLogger({ skipPaths: ['/api/health'] });
    const req = mockReq({ path: '/api/health/detailed' });
    const res = mockRes();

    middleware(req, res, next);
    res.emit('finish');

    expect(console.log).not.toHaveBeenCalled();
  });

  it('should use default skipPaths of ["/api/health"] when none provided', () => {
    const middleware = requestLogger();
    const req = mockReq({ path: '/api/health' });
    const res = mockRes();

    middleware(req, res, next);
    res.emit('finish');

    expect(console.log).not.toHaveBeenCalled();
  });

  // ── 4. Uses console.error for 5xx responses ──

  it('should use console.error for 5xx status codes', () => {
    const middleware = requestLogger();
    const req = mockReq({ method: 'GET', path: '/api/crash' });
    const res = mockRes(500);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[API]'),
      expect.objectContaining({
        method: 'GET',
        path: '/api/crash',
        status: 500,
      })
    );
  });

  it('should use console.error for 503 status codes', () => {
    const middleware = requestLogger();
    const req = mockReq();
    const res = mockRes(503);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.error).toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  // ── 5. Uses console.warn for 4xx responses ──

  it('should use console.warn for 4xx status codes', () => {
    const middleware = requestLogger();
    const req = mockReq({ method: 'POST', path: '/api/invalid' });
    const res = mockRes(400);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[API] POST /api/invalid 400')
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it('should use console.warn for 404 status codes', () => {
    const middleware = requestLogger();
    const req = mockReq({ path: '/api/notfound' });
    const res = mockRes(404);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.warn).toHaveBeenCalled();
  });

  // ── 6. Uses console.log for 2xx responses in development ──

  it('should use console.log for 2xx responses in development', () => {
    process.env.NODE_ENV = 'development';
    const middleware = requestLogger();
    const req = mockReq();
    const res = mockRes(200);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[API]')
    );
  });

  // ── 7. In production, only logs slow requests (>1000ms) for 2xx ──

  it('should NOT log 2xx responses in production when duration <= 1000ms', () => {
    process.env.NODE_ENV = 'production';
    const middleware = requestLogger();
    const req = mockReq();
    const res = mockRes(200);

    middleware(req, res, next);

    vi.advanceTimersByTime(500); // 500ms — fast request
    res.emit('finish');

    expect(console.log).not.toHaveBeenCalled();
  });

  it('should log 2xx responses in production when duration > 1000ms', () => {
    process.env.NODE_ENV = 'production';
    const middleware = requestLogger();
    const req = mockReq();
    const res = mockRes(200);

    middleware(req, res, next);

    vi.advanceTimersByTime(1500); // 1500ms — slow request
    res.emit('finish');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('1500ms')
    );
  });

  it('should always log 4xx in production regardless of duration', () => {
    process.env.NODE_ENV = 'production';
    const middleware = requestLogger();
    const req = mockReq();
    const res = mockRes(401);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.warn).toHaveBeenCalled();
  });

  it('should always log 5xx in production regardless of duration', () => {
    process.env.NODE_ENV = 'production';
    const middleware = requestLogger();
    const req = mockReq();
    const res = mockRes(500);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.error).toHaveBeenCalled();
  });

  // ── 8. Does NOT log request body by default ──

  it('should NOT log request body when logBody is false (default)', () => {
    const middleware = requestLogger();
    const req = mockReq({ body: { email: 'test@example.com' } });
    const res = mockRes(400);

    middleware(req, res, next);
    res.emit('finish');

    // console.warn is called for 4xx status, but body should not be logged
    const allLogCalls = [
      ...console.log.mock.calls,
      ...console.warn.mock.calls,
      ...console.error.mock.calls,
    ];
    const bodyLogCalls = allLogCalls.filter(
      (args) => args[0] && String(args[0]).includes('Body:')
    );
    expect(bodyLogCalls).toHaveLength(0);
  });

  // ── 9. When logBody is true, logs body for non-info levels ──

  it('should log request body when logBody is true and response is 4xx', () => {
    const middleware = requestLogger({ logBody: true });
    const req = mockReq({
      body: { email: 'test@example.com', name: 'Test' },
    });
    const res = mockRes(400);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[API] Body:'),
      expect.objectContaining({ email: 'test@example.com', name: 'Test' })
    );
  });

  it('should log request body when logBody is true and response is 5xx', () => {
    const middleware = requestLogger({ logBody: true });
    const req = mockReq({ body: { data: 'test' } });
    const res = mockRes(500);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('[API] Body:'),
      expect.objectContaining({ data: 'test' })
    );
  });

  it('should NOT log body for 2xx even when logBody is true', () => {
    process.env.NODE_ENV = 'development';
    const middleware = requestLogger({ logBody: true });
    const req = mockReq({ body: { data: 'test' } });
    const res = mockRes(200);

    middleware(req, res, next);
    res.emit('finish');

    // The info-level log is called, but body should NOT be logged (level === "info")
    const bodyLogCalls = console.log.mock.calls.filter(
      (args) => args[0] && String(args[0]).includes('Body:')
    );
    expect(bodyLogCalls).toHaveLength(0);
  });

  it('should NOT log body when body is empty', () => {
    const middleware = requestLogger({ logBody: true });
    const req = mockReq({ body: {} });
    const res = mockRes(400);

    middleware(req, res, next);
    res.emit('finish');

    const bodyLogCalls = console.log.mock.calls.filter(
      (args) => args[0] && String(args[0]).includes('Body:')
    );
    expect(bodyLogCalls).toHaveLength(0);
  });

  it('should NOT log body when body is undefined', () => {
    const middleware = requestLogger({ logBody: true });
    const req = mockReq(); // no body
    const res = mockRes(400);

    middleware(req, res, next);
    res.emit('finish');

    const bodyLogCalls = console.log.mock.calls.filter(
      (args) => args[0] && String(args[0]).includes('Body:')
    );
    expect(bodyLogCalls).toHaveLength(0);
  });

  // ── 10. Never logs sensitive fields ──

  it('should strip password from logged body', () => {
    const middleware = requestLogger({ logBody: true });
    const req = mockReq({
      body: { email: 'user@test.com', password: 'secret123' },
    });
    const res = mockRes(400);

    middleware(req, res, next);
    res.emit('finish');

    const bodyArg = console.log.mock.calls.find(
      (args) => args[0] && String(args[0]).includes('Body:')
    );
    expect(bodyArg).toBeDefined();
    const loggedBody = bodyArg[1];
    expect(loggedBody).not.toHaveProperty('password');
    expect(loggedBody).toHaveProperty('email', 'user@test.com');
  });

  it('should strip token, secret, apiKey, accessToken, refreshToken from logged body', () => {
    const middleware = requestLogger({ logBody: true });
    const req = mockReq({
      body: {
        username: 'admin',
        token: 'jwt-token-xyz',
        secret: 'my-secret',
        apiKey: 'ak_12345',
        accessToken: 'at_abc',
        refreshToken: 'rt_def',
      },
    });
    const res = mockRes(422);

    middleware(req, res, next);
    res.emit('finish');

    const bodyArg = console.log.mock.calls.find(
      (args) => args[0] && String(args[0]).includes('Body:')
    );
    expect(bodyArg).toBeDefined();
    const loggedBody = bodyArg[1];
    expect(loggedBody).toHaveProperty('username', 'admin');
    expect(loggedBody).not.toHaveProperty('token');
    expect(loggedBody).not.toHaveProperty('secret');
    expect(loggedBody).not.toHaveProperty('apiKey');
    expect(loggedBody).not.toHaveProperty('accessToken');
    expect(loggedBody).not.toHaveProperty('refreshToken');
  });

  it('should not mutate the original req.body when stripping sensitive fields', () => {
    const middleware = requestLogger({ logBody: true });
    const originalBody = { email: 'a@b.com', password: 'pass', token: 'tok' };
    const req = mockReq({ body: originalBody });
    const res = mockRes(400);

    middleware(req, res, next);
    res.emit('finish');

    // Original body should still have the sensitive fields
    expect(originalBody).toHaveProperty('password', 'pass');
    expect(originalBody).toHaveProperty('token', 'tok');
  });

  // ── 11. Includes tenantId from req.tenantId ──

  it('should include tenantId in error log data when present on req', () => {
    const middleware = requestLogger();
    const req = mockReq({ tenantId: 'tenant-abc-123' });
    const res = mockRes(500);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[API]'),
      expect.objectContaining({ tenantId: 'tenant-abc-123' })
    );
  });

  it('should use "none" as tenantId fallback when req.tenantId is missing', () => {
    const middleware = requestLogger();
    const req = mockReq(); // no tenantId
    const res = mockRes(500);

    middleware(req, res, next);
    res.emit('finish');

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[API]'),
      expect.objectContaining({ tenantId: 'none' })
    );
  });

  // ── 12. Duration is included in error log data ──

  it('should include duration in the error log data object', () => {
    const middleware = requestLogger();
    const req = mockReq();
    const res = mockRes(502);

    middleware(req, res, next);

    vi.advanceTimersByTime(150);
    res.emit('finish');

    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ duration: '150ms' })
    );
  });

  // ── 13. Default options (no arguments) ──

  it('should work with no options (default logBody=false, skipPaths=["/api/health"])', () => {
    const middleware = requestLogger();
    const req = mockReq({ method: 'GET', path: '/api/models' });
    const res = mockRes(200);
    process.env.NODE_ENV = 'development';

    middleware(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalledOnce();
    expect(console.log).toHaveBeenCalled();
  });

  // ── 14. Custom skipPaths ──

  it('should respect custom skipPaths and log non-skipped paths', () => {
    const middleware = requestLogger({
      skipPaths: ['/api/health', '/api/metrics'],
    });

    // Skipped
    const skippedReq = mockReq({ path: '/api/metrics' });
    const skippedRes = mockRes();
    middleware(skippedReq, skippedRes, vi.fn());
    skippedRes.emit('finish');
    expect(console.log).not.toHaveBeenCalled();

    // Not skipped
    process.env.NODE_ENV = 'development';
    const loggedReq = mockReq({ path: '/api/orders' });
    const loggedRes = mockRes(200);
    middleware(loggedReq, loggedRes, vi.fn());
    loggedRes.emit('finish');
    expect(console.log).toHaveBeenCalled();
  });
});
