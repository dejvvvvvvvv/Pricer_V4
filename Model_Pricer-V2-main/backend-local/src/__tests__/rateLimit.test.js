/**
 * Unit tests for backend rate limiting middleware.
 *
 * @module __tests__/rateLimit.test
 * @see ../middleware/rateLimit.js
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Test helpers (same pattern as validate.test.js) ─────────────

const mockReq = (ip = '127.0.0.1', overrides = {}) => ({
  ip,
  connection: { remoteAddress: ip },
  ...overrides,
});

const mockRes = () => {
  const headers = {};
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.set = vi.fn((key, value) => {
    headers[key] = value;
    return res;
  });
  res._headers = headers;
  return res;
};

// ── Tests ───────────────────────────────────────────────────────

describe('rateLimit middleware', () => {
  let next;
  let rateLimit;

  beforeEach(async () => {
    vi.useFakeTimers();
    // Fresh import each time to reset the module-level store Map
    vi.resetModules();
    const mod = await import('../middleware/rateLimit.js');
    rateLimit = mod.rateLimit;
    next = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── 1. Allows requests under the limit ──

  it('should call next() for requests under the limit', () => {
    const limiter = rateLimit({ max: 5, windowMs: 60000 });
    const req = mockReq();
    const res = mockRes();

    limiter(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  // ── 2. Returns 429 when limit exceeded ──

  it('should return 429 when request count exceeds max', () => {
    const limiter = rateLimit({ max: 3, windowMs: 60000 });
    const ip = '10.0.0.1';

    // Send 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const req = mockReq(ip);
      const res = mockRes();
      limiter(req, res, next);
    }

    // 4th request should be blocked
    const req = mockReq(ip);
    const res = mockRes();
    limiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        errorCode: 'MP_RATE_LIMITED',
      })
    );
  });

  // ── 3. Resets after window expires ──

  it('should reset the counter after windowMs expires', () => {
    const windowMs = 60000;
    const limiter = rateLimit({ max: 2, windowMs });
    const ip = '10.0.0.2';

    // Exhaust the limit
    for (let i = 0; i < 2; i++) {
      limiter(mockReq(ip), mockRes(), next);
    }

    // 3rd request is blocked
    const blockedRes = mockRes();
    limiter(mockReq(ip), blockedRes, next);
    expect(blockedRes.status).toHaveBeenCalledWith(429);

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1);

    // Next request should be allowed again
    const freshNext = vi.fn();
    const freshRes = mockRes();
    limiter(mockReq(ip), freshRes, freshNext);

    expect(freshNext).toHaveBeenCalledOnce();
    expect(freshRes.status).not.toHaveBeenCalled();
  });

  // ── 4. Sets X-RateLimit-Limit header ──

  it('should set X-RateLimit-Limit header to the configured max', () => {
    const limiter = rateLimit({ max: 50, windowMs: 60000 });
    const res = mockRes();

    limiter(mockReq(), res, next);

    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '50');
  });

  // ── 5. Sets X-RateLimit-Remaining header (decrements) ──

  it('should set X-RateLimit-Remaining header and decrement it', () => {
    const limiter = rateLimit({ max: 5, windowMs: 60000 });
    const ip = '10.0.0.3';

    // 1st request: remaining = 5 - 1 = 4
    const res1 = mockRes();
    limiter(mockReq(ip), res1, next);
    expect(res1._headers['X-RateLimit-Remaining']).toBe('4');

    // 2nd request: remaining = 5 - 2 = 3
    const res2 = mockRes();
    limiter(mockReq(ip), res2, next);
    expect(res2._headers['X-RateLimit-Remaining']).toBe('3');

    // 3rd request: remaining = 5 - 3 = 2
    const res3 = mockRes();
    limiter(mockReq(ip), res3, next);
    expect(res3._headers['X-RateLimit-Remaining']).toBe('2');
  });

  it('should clamp X-RateLimit-Remaining to 0 when limit exceeded', () => {
    const limiter = rateLimit({ max: 1, windowMs: 60000 });
    const ip = '10.0.0.4';

    // 1st request uses the limit
    limiter(mockReq(ip), mockRes(), next);

    // 2nd request exceeds, remaining should be 0 (not negative)
    const res = mockRes();
    limiter(mockReq(ip), res, next);
    expect(res._headers['X-RateLimit-Remaining']).toBe('0');
  });

  // ── 6. Sets X-RateLimit-Reset header ──

  it('should set X-RateLimit-Reset header as Unix timestamp in seconds', () => {
    const now = Date.now();
    const windowMs = 60000;
    const limiter = rateLimit({ max: 10, windowMs });
    const res = mockRes();

    limiter(mockReq(), res, next);

    const resetHeader = res._headers['X-RateLimit-Reset'];
    const expectedReset = String(Math.ceil((now + windowMs) / 1000));
    expect(resetHeader).toBe(expectedReset);
  });

  // ── 7. Custom message in 429 response ──

  it('should use custom message in 429 response', () => {
    const customMsg = 'Slow down, partner!';
    const limiter = rateLimit({ max: 1, windowMs: 60000, message: customMsg });
    const ip = '10.0.0.5';

    // Exhaust limit
    limiter(mockReq(ip), mockRes(), next);

    // Trigger 429
    const res = mockRes();
    limiter(mockReq(ip), res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: customMsg,
      })
    );
  });

  // ── 8. Custom key generator ──

  it('should use custom keyGenerator to derive the rate-limit key', () => {
    const limiter = rateLimit({
      max: 2,
      windowMs: 60000,
      keyGenerator: (req) => req.headers['x-api-key'],
    });

    const apiKey = 'my-api-key-123';
    const reqFactory = () => mockReq('different-ip-each-time', {
      headers: { 'x-api-key': apiKey },
    });

    // 2 allowed
    limiter(reqFactory(), mockRes(), next);
    limiter(reqFactory(), mockRes(), next);

    // 3rd should be blocked (same API key even though IP differs)
    const res = mockRes();
    limiter(reqFactory(), res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  // ── 9. Different IPs get separate limits ──

  it('should track different IPs independently', () => {
    const limiter = rateLimit({ max: 2, windowMs: 60000 });

    // IP A uses 2 requests
    limiter(mockReq('192.168.0.1'), mockRes(), next);
    limiter(mockReq('192.168.0.1'), mockRes(), next);

    // IP A is now blocked
    const resA = mockRes();
    limiter(mockReq('192.168.0.1'), resA, next);
    expect(resA.status).toHaveBeenCalledWith(429);

    // IP B should still be allowed
    const nextB = vi.fn();
    const resB = mockRes();
    limiter(mockReq('192.168.0.2'), resB, nextB);
    expect(nextB).toHaveBeenCalledOnce();
    expect(resB.status).not.toHaveBeenCalled();
  });

  // ── 10. Default options work (100 req/min) ──

  it('should use default options (max: 100, windowMs: 60000)', () => {
    const limiter = rateLimit();
    const ip = '10.0.0.10';

    // 100 requests should all pass
    for (let i = 0; i < 100; i++) {
      const n = vi.fn();
      limiter(mockReq(ip), mockRes(), n);
      expect(n).toHaveBeenCalledOnce();
    }

    // 101st should be blocked
    const res = mockRes();
    limiter(mockReq(ip), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should use default message when none provided', () => {
    const limiter = rateLimit({ max: 1 });
    const ip = '10.0.0.11';

    limiter(mockReq(ip), mockRes(), next);

    const res = mockRes();
    limiter(mockReq(ip), res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Too many requests, please try again later',
      })
    );
  });

  // ── 11. Error response format matches project standard ──

  it('should return error envelope with ok: false and errorCode: MP_RATE_LIMITED', () => {
    const limiter = rateLimit({ max: 1, windowMs: 60000 });
    const ip = '10.0.0.12';

    limiter(mockReq(ip), mockRes(), next);

    const res = mockRes();
    limiter(mockReq(ip), res, next);

    const response = res.json.mock.calls[0][0];
    expect(response).toEqual({
      ok: false,
      errorCode: 'MP_RATE_LIMITED',
      message: expect.any(String),
    });
  });

  // ── 12. Fallback key when req.ip is missing ──

  it('should fall back to req.connection.remoteAddress when req.ip is undefined', () => {
    const limiter = rateLimit({ max: 1, windowMs: 60000 });

    const req = { ip: undefined, connection: { remoteAddress: '10.0.0.99' } };
    limiter(req, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();

    // Same remoteAddress should be tracked
    const res = mockRes();
    const req2 = { ip: undefined, connection: { remoteAddress: '10.0.0.99' } };
    limiter(req2, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should use "unknown" when both req.ip and connection.remoteAddress are missing', () => {
    const limiter = rateLimit({ max: 1, windowMs: 60000 });

    const req = { ip: undefined, connection: undefined };
    limiter(req, mockRes(), next);

    const res = mockRes();
    const req2 = { ip: undefined, connection: undefined };
    limiter(req2, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(429);
  });

  // ── 13. next() is NOT called on 429 ──

  it('should not call next() when returning 429', () => {
    const limiter = rateLimit({ max: 1, windowMs: 60000 });
    const ip = '10.0.0.13';

    limiter(mockReq(ip), mockRes(), vi.fn());

    const blockedNext = vi.fn();
    limiter(mockReq(ip), mockRes(), blockedNext);
    expect(blockedNext).not.toHaveBeenCalled();
  });
});
