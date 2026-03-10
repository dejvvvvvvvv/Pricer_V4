import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock getTenantId before importing apiClient
vi.mock('@/utils/adminTenantStorage', () => ({
  getTenantId: vi.fn(() => 'test-tenant-123'),
}));

// Mock axios — provide create() that returns a fake instance with interceptor capture
const mockInterceptors = {
  request: { handlers: [], use(fn) { this.handlers.push(fn); } },
  response: { handlers: [], use(successFn, errorFn) { this.handlers.push({ success: successFn, error: errorFn }); } },
};

const mockAxiosInstance = vi.fn(); // the callable instance itself (for retries)
mockAxiosInstance.interceptors = mockInterceptors;
mockAxiosInstance.defaults = { headers: { common: {} } };

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

// Now import — this triggers the module-level code that registers interceptors
let apiClient;
let axios;
let getTenantId;
let requestInterceptor;
let responseSuccessInterceptor;
let responseErrorInterceptor;

beforeEach(async () => {
  // Reset modules so interceptors re-register fresh each test suite
  vi.resetModules();

  // Re-setup mocks after resetModules
  mockInterceptors.request.handlers = [];
  mockInterceptors.response.handlers = [];

  vi.doMock('@/utils/adminTenantStorage', () => ({
    getTenantId: vi.fn(() => 'test-tenant-123'),
  }));

  vi.doMock('axios', () => ({
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  }));

  const mod = await import('../apiClient.js');
  apiClient = mod.default;

  const tenantMod = await import('@/utils/adminTenantStorage');
  getTenantId = tenantMod.getTenantId;

  // Capture the interceptor handlers that apiClient.js registered
  requestInterceptor = mockInterceptors.request.handlers[0];
  const responseHandler = mockInterceptors.response.handlers[0];
  responseSuccessInterceptor = responseHandler.success;
  responseErrorInterceptor = responseHandler.error;

  // Clean up window auth hooks
  delete window.__authGetToken;
  delete window.__authRefreshToken;
});

afterEach(() => {
  delete window.__authGetToken;
  delete window.__authRefreshToken;
  vi.restoreAllMocks();
});

describe('apiClient', () => {
  // ── Default config ──────────────────────────────────────────────

  describe('default config', () => {
    it('should create axios instance with baseURL /api and 30s timeout', async () => {
      const axiosMod = await import('axios');
      expect(axiosMod.default.create).toHaveBeenCalledWith({
        baseURL: '/api',
        timeout: 30000,
      });
    });
  });

  // ── Request interceptor ─────────────────────────────────────────

  describe('request interceptor', () => {
    it('should attach x-tenant-id header from getTenantId', async () => {
      const config = { headers: {} };
      const result = await requestInterceptor(config);

      expect(getTenantId).toHaveBeenCalled();
      expect(result.headers['x-tenant-id']).toBe('test-tenant-123');
    });

    it('should add Authorization header when window.__authGetToken returns a token', async () => {
      window.__authGetToken = vi.fn().mockResolvedValue('my-jwt-token');
      const config = { headers: {} };

      const result = await requestInterceptor(config);

      expect(window.__authGetToken).toHaveBeenCalled();
      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('should proceed without Authorization header when window.__authGetToken is not set', async () => {
      const config = { headers: {} };

      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should proceed without Authorization header when window.__authGetToken returns null', async () => {
      window.__authGetToken = vi.fn().mockResolvedValue(null);
      const config = { headers: {} };

      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should proceed without Authorization header when window.__authGetToken throws', async () => {
      window.__authGetToken = vi.fn().mockRejectedValue(new Error('Token fetch failed'));
      const config = { headers: {} };

      const result = await requestInterceptor(config);

      expect(result.headers.Authorization).toBeUndefined();
      // Should not throw — error is caught silently
    });
  });

  // ── Response interceptor — success ──────────────────────────────

  describe('response interceptor (success)', () => {
    it('should pass through successful responses unchanged', () => {
      const response = { status: 200, data: { price: 100 } };
      const result = responseSuccessInterceptor(response);

      expect(result).toBe(response);
    });
  });

  // ── Response interceptor — error handling ───────────────────────

  describe('response interceptor (error handling)', () => {
    it('should reject with error for 403 status', async () => {
      const error = {
        response: { status: 403 },
        config: { headers: {} },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    });

    it('should reject with error for 500 status', async () => {
      const error = {
        response: { status: 500 },
        config: { headers: {} },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    });

    it('should reject with error for network error (no response)', async () => {
      const error = {
        message: 'Network Error',
        config: { headers: {} },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    });
  });

  // ── Token refresh on 401 ───────────────────────────────────────

  describe('token refresh on 401', () => {
    it('should refresh token and retry request on first 401', async () => {
      const retryResponse = { status: 200, data: { ok: true } };
      window.__authRefreshToken = vi.fn().mockResolvedValue('new-jwt-token');
      mockAxiosInstance.mockResolvedValueOnce(retryResponse);

      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: undefined },
      };

      const result = await responseErrorInterceptor(error);

      expect(window.__authRefreshToken).toHaveBeenCalled();
      expect(error.config._retry).toBe(true);
      expect(error.config.headers.Authorization).toBe('Bearer new-jwt-token');
      expect(mockAxiosInstance).toHaveBeenCalledWith(error.config);
      expect(result).toBe(retryResponse);
    });

    it('should not retry when _retry flag is already set (prevent infinite loop)', async () => {
      window.__authRefreshToken = vi.fn().mockResolvedValue('new-jwt-token');

      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: true },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(window.__authRefreshToken).not.toHaveBeenCalled();
    });

    it('should reject when window.__authRefreshToken is not set on 401', async () => {
      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: undefined },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(error.config._retry).toBe(true);
    });

    it('should reject when window.__authRefreshToken returns null', async () => {
      window.__authRefreshToken = vi.fn().mockResolvedValue(null);

      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: undefined },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    });

    it('should reject when window.__authRefreshToken throws', async () => {
      window.__authRefreshToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));

      const error = {
        response: { status: 401 },
        config: { headers: {}, _retry: undefined },
      };

      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
    });
  });
});
