import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ─── Mock Supabase dependencies BEFORE importing the module under test ────
vi.mock('@/lib/supabase/storageAdapter', () => ({
  storageAdapter: {
    read: vi.fn().mockResolvedValue(null),
    write: vi.fn().mockResolvedValue(undefined),
    appendLog: vi.fn().mockResolvedValue([]),
    supabase: {
      insert: vi.fn().mockResolvedValue(undefined),
    },
  },
  getTableForNamespace: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/supabase/featureFlags', () => ({
  getStorageMode: vi.fn().mockReturnValue('localStorage'),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseAvailable: vi.fn().mockReturnValue(false),
}));

vi.mock('@/lib/debug', () => ({
  debug: vi.fn(),
}));

// ─── Import module under test ────────────────────────────────────────────
import {
  getTenantId,
  setTenantId,
  clearTenantId,
  readTenantJson,
  writeTenantJson,
  appendTenantLog,
  readTenantJsonAsync,
  writeTenantJsonAsync,
  appendTenantLogAsync,
} from '../adminTenantStorage.js';

import { storageAdapter, getTableForNamespace } from '@/lib/supabase/storageAdapter';
import { getStorageMode } from '@/lib/supabase/featureFlags';
import { isSupabaseAvailable } from '@/lib/supabase/client';

// ─── localStorage mock ───────────────────────────────────────────────────
function createLocalStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    /** Direct access to the backing store (for assertions). */
    _store: () => store,
  };
}

// ─── Test Suite ──────────────────────────────────────────────────────────
describe('adminTenantStorage', () => {
  let mockLS;

  beforeEach(() => {
    mockLS = createLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: mockLS,
      writable: true,
      configurable: true,
    });

    // Reset Supabase mocks to defaults
    vi.mocked(getStorageMode).mockReturnValue('localStorage');
    vi.mocked(isSupabaseAvailable).mockReturnValue(false);
    vi.mocked(storageAdapter.write).mockReset().mockResolvedValue(undefined);
    vi.mocked(storageAdapter.read).mockReset().mockResolvedValue(null);
    vi.mocked(storageAdapter.appendLog).mockReset().mockResolvedValue([]);
    vi.mocked(storageAdapter.supabase.insert).mockReset().mockResolvedValue(undefined);
    vi.mocked(getTableForNamespace).mockReset().mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ════════════════════════════════════════════════════════════════════════
  // getTenantId
  // ════════════════════════════════════════════════════════════════════════
  describe('getTenantId', () => {
    it('should return "demo-tenant" when no tenant ID is stored', () => {
      const result = getTenantId();
      expect(result).toBe('demo-tenant');
    });

    it('should return stored tenant ID from localStorage', () => {
      mockLS.setItem('modelpricer:tenant_id', 'my-tenant-123');
      // Reset the mock call count so getItem is fresh
      mockLS.getItem.mockClear();

      const result = getTenantId();
      expect(result).toBe('my-tenant-123');
      expect(mockLS.getItem).toHaveBeenCalledWith('modelpricer:tenant_id');
    });

    it('should return "demo-tenant" when stored value is empty string', () => {
      // localStorage.getItem returns '' which is falsy via || operator
      mockLS.setItem('modelpricer:tenant_id', '');
      // Empty string stored → getItem returns '' → falsy → falls back to 'demo-tenant'
      // But our mock stores String(value), so '' is stored as ''
      // getItem returns '' which is falsy in JS, so || 'demo-tenant' kicks in
      const result = getTenantId();
      expect(result).toBe('demo-tenant');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // setTenantId
  // ════════════════════════════════════════════════════════════════════════
  describe('setTenantId', () => {
    it('should store tenant ID in localStorage', () => {
      setTenantId('tenant-abc');
      expect(mockLS.setItem).toHaveBeenCalledWith('modelpricer:tenant_id', 'tenant-abc');
    });

    it('should trim whitespace from tenant ID', () => {
      setTenantId('  tenant-spaces  ');
      expect(mockLS.setItem).toHaveBeenCalledWith('modelpricer:tenant_id', 'tenant-spaces');
    });

    it('should not store when id is null', () => {
      setTenantId(null);
      expect(mockLS.setItem).not.toHaveBeenCalled();
    });

    it('should not store when id is undefined', () => {
      setTenantId(undefined);
      expect(mockLS.setItem).not.toHaveBeenCalled();
    });

    it('should not store when id is empty string', () => {
      setTenantId('');
      expect(mockLS.setItem).not.toHaveBeenCalled();
    });

    it('should not store when id is a number (not a string)', () => {
      setTenantId(42);
      expect(mockLS.setItem).not.toHaveBeenCalled();
    });

    it('should warn on invalid id', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      setTenantId(null);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('setTenantId called with invalid id'),
        null
      );
      warnSpy.mockRestore();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // clearTenantId
  // ════════════════════════════════════════════════════════════════════════
  describe('clearTenantId', () => {
    it('should remove tenant_id from localStorage', () => {
      mockLS.setItem('modelpricer:tenant_id', 'some-tenant');
      clearTenantId();
      expect(mockLS.removeItem).toHaveBeenCalledWith('modelpricer:tenant_id');
    });

    it('should result in getTenantId returning "demo-tenant" after clearing', () => {
      mockLS.setItem('modelpricer:tenant_id', 'some-tenant');
      clearTenantId();
      // After removeItem, getItem returns null, so getTenantId falls back
      const result = getTenantId();
      expect(result).toBe('demo-tenant');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Key format — modelpricer:${tenantId}:${namespace}
  // ════════════════════════════════════════════════════════════════════════
  describe('key format', () => {
    it('should use pattern modelpricer:<tenantId>:<namespace> for read', () => {
      mockLS.setItem('modelpricer:tenant_id', 'tenant-x');
      readTenantJson('pricing:v3', null);
      expect(mockLS.getItem).toHaveBeenCalledWith('modelpricer:tenant-x:pricing:v3');
    });

    it('should use pattern modelpricer:<tenantId>:<namespace> for write', () => {
      mockLS.setItem('modelpricer:tenant_id', 'tenant-y');
      writeTenantJson('fees:v3', { test: true });
      expect(mockLS.setItem).toHaveBeenCalledWith(
        'modelpricer:tenant-y:fees:v3',
        JSON.stringify({ test: true })
      );
    });

    it('should use tenantIdOverride when provided for read', () => {
      mockLS.setItem('modelpricer:tenant_id', 'default-tenant');
      readTenantJson('pricing:v3', null, 'override-tenant');
      expect(mockLS.getItem).toHaveBeenCalledWith('modelpricer:override-tenant:pricing:v3');
    });

    it('should use tenantIdOverride when provided for write', () => {
      mockLS.setItem('modelpricer:tenant_id', 'default-tenant');
      writeTenantJson('pricing:v3', { val: 1 }, 'override-tenant');
      expect(mockLS.setItem).toHaveBeenCalledWith(
        'modelpricer:override-tenant:pricing:v3',
        JSON.stringify({ val: 1 })
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // readTenantJson
  // ════════════════════════════════════════════════════════════════════════
  describe('readTenantJson', () => {
    beforeEach(() => {
      mockLS.setItem('modelpricer:tenant_id', 'test-tenant');
    });

    it('should return parsed JSON data when key exists', () => {
      const data = { material: 'PLA', price: 42 };
      mockLS.setItem('modelpricer:test-tenant:pricing:v3', JSON.stringify(data));

      const result = readTenantJson('pricing:v3', null);
      expect(result).toEqual(data);
    });

    it('should return fallback when key does not exist', () => {
      const fallback = { default: true };
      const result = readTenantJson('nonexistent:ns', fallback);
      expect(result).toEqual(fallback);
    });

    it('should return fallback when stored value is null', () => {
      const result = readTenantJson('pricing:v3', 'default-val');
      expect(result).toBe('default-val');
    });

    it('should return fallback when JSON is corrupt', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockLS.setItem('modelpricer:test-tenant:pricing:v3', '{broken json!!!');

      const result = readTenantJson('pricing:v3', { safe: true });
      expect(result).toEqual({ safe: true });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should return undefined as fallback when no fallback specified', () => {
      const result = readTenantJson('missing:ns');
      expect(result).toBeUndefined();
    });

    it('should handle arrays as stored data', () => {
      const arr = [1, 2, 3, { nested: true }];
      mockLS.setItem('modelpricer:test-tenant:list:v1', JSON.stringify(arr));
      const result = readTenantJson('list:v1', []);
      expect(result).toEqual(arr);
    });

    it('should handle string values in JSON', () => {
      mockLS.setItem('modelpricer:test-tenant:simple:v1', JSON.stringify('just a string'));
      const result = readTenantJson('simple:v1', '');
      expect(result).toBe('just a string');
    });

    it('should handle numeric values in JSON', () => {
      mockLS.setItem('modelpricer:test-tenant:num:v1', JSON.stringify(99.5));
      const result = readTenantJson('num:v1', 0);
      expect(result).toBe(99.5);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // writeTenantJson
  // ════════════════════════════════════════════════════════════════════════
  describe('writeTenantJson', () => {
    beforeEach(() => {
      mockLS.setItem('modelpricer:tenant_id', 'write-tenant');
    });

    it('should write JSON-serialized data to localStorage', () => {
      const data = { markup: 1.3, currency: 'CZK' };
      writeTenantJson('pricing:v3', data);
      expect(mockLS.setItem).toHaveBeenCalledWith(
        'modelpricer:write-tenant:pricing:v3',
        JSON.stringify(data)
      );
    });

    it('should overwrite existing data', () => {
      writeTenantJson('pricing:v3', { old: true });
      writeTenantJson('pricing:v3', { new: true });
      // Last call should have the new data
      const calls = mockLS.setItem.mock.calls.filter(
        ([key]) => key === 'modelpricer:write-tenant:pricing:v3'
      );
      expect(calls).toHaveLength(2);
      expect(calls[1][1]).toBe(JSON.stringify({ new: true }));
    });

    it('should handle writing null value', () => {
      writeTenantJson('pricing:v3', null);
      expect(mockLS.setItem).toHaveBeenCalledWith(
        'modelpricer:write-tenant:pricing:v3',
        'null'
      );
    });

    it('should handle writing array value', () => {
      writeTenantJson('orders:v1', [1, 2, 3]);
      expect(mockLS.setItem).toHaveBeenCalledWith(
        'modelpricer:write-tenant:orders:v1',
        '[1,2,3]'
      );
    });

    it('should warn and not throw when localStorage.setItem fails', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockLS.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => writeTenantJson('pricing:v3', { big: 'data' })).not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should NOT fire Supabase write when mode is localStorage', () => {
      vi.mocked(getStorageMode).mockReturnValue('localStorage');
      writeTenantJson('pricing:v3', { val: 1 });
      expect(storageAdapter.write).not.toHaveBeenCalled();
    });

    it('should fire Supabase write when mode is dual-write and Supabase available', () => {
      vi.mocked(getStorageMode).mockReturnValue('dual-write');
      vi.mocked(isSupabaseAvailable).mockReturnValue(true);
      writeTenantJson('pricing:v3', { val: 2 });
      expect(storageAdapter.write).toHaveBeenCalledWith(
        'pricing:v3',
        'write-tenant',
        'modelpricer:write-tenant:pricing:v3',
        { val: 2 }
      );
    });

    it('should fire Supabase write when mode is supabase and Supabase available', () => {
      vi.mocked(getStorageMode).mockReturnValue('supabase');
      vi.mocked(isSupabaseAvailable).mockReturnValue(true);
      writeTenantJson('fees:v3', { fee: 10 });
      expect(storageAdapter.write).toHaveBeenCalledWith(
        'fees:v3',
        'write-tenant',
        'modelpricer:write-tenant:fees:v3',
        { fee: 10 }
      );
    });

    it('should NOT fire Supabase write when Supabase is not available even in dual-write mode', () => {
      vi.mocked(getStorageMode).mockReturnValue('dual-write');
      vi.mocked(isSupabaseAvailable).mockReturnValue(false);
      writeTenantJson('pricing:v3', { val: 3 });
      expect(storageAdapter.write).not.toHaveBeenCalled();
    });

    it('should still write to localStorage even when Supabase write fails', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(getStorageMode).mockReturnValue('dual-write');
      vi.mocked(isSupabaseAvailable).mockReturnValue(true);
      vi.mocked(storageAdapter.write).mockRejectedValueOnce(new Error('Network error'));

      writeTenantJson('pricing:v3', { val: 4 });

      // localStorage write should still happen
      expect(mockLS.setItem).toHaveBeenCalledWith(
        'modelpricer:write-tenant:pricing:v3',
        JSON.stringify({ val: 4 })
      );
      warnSpy.mockRestore();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Tenant isolation
  // ════════════════════════════════════════════════════════════════════════
  describe('tenant isolation', () => {
    it('should produce different keys for different tenants', () => {
      const data = { shared: false };

      writeTenantJson('pricing:v3', data, 'tenant-A');
      writeTenantJson('pricing:v3', data, 'tenant-B');

      const writeCalls = mockLS.setItem.mock.calls.filter(
        ([key]) => key.includes('pricing:v3')
      );
      expect(writeCalls).toHaveLength(2);
      expect(writeCalls[0][0]).toBe('modelpricer:tenant-A:pricing:v3');
      expect(writeCalls[1][0]).toBe('modelpricer:tenant-B:pricing:v3');
    });

    it('should read data scoped to the correct tenant', () => {
      // Write different data for two tenants
      mockLS.setItem(
        'modelpricer:tenant-1:pricing:v3',
        JSON.stringify({ price: 100 })
      );
      mockLS.setItem(
        'modelpricer:tenant-2:pricing:v3',
        JSON.stringify({ price: 200 })
      );

      const result1 = readTenantJson('pricing:v3', null, 'tenant-1');
      const result2 = readTenantJson('pricing:v3', null, 'tenant-2');

      expect(result1).toEqual({ price: 100 });
      expect(result2).toEqual({ price: 200 });
    });

    it('should not leak data between tenants', () => {
      mockLS.setItem(
        'modelpricer:tenant-secret:fees:v3',
        JSON.stringify({ secret: true })
      );

      const result = readTenantJson('fees:v3', null, 'tenant-other');
      expect(result).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // appendTenantLog
  // ════════════════════════════════════════════════════════════════════════
  describe('appendTenantLog', () => {
    beforeEach(() => {
      mockLS.setItem('modelpricer:tenant_id', 'log-tenant');
    });

    it('should prepend entry to the log array', () => {
      const entry = { action: 'test', timestamp: '2026-01-01' };
      const result = appendTenantLog('audit_log', entry);

      expect(result).toEqual([entry]);
    });

    it('should prepend new entries (newest first)', () => {
      appendTenantLog('audit_log', { id: 1 });
      // After first call, localStorage has [{id:1}]
      const result = appendTenantLog('audit_log', { id: 2 });
      expect(result[0]).toEqual({ id: 2 });
      expect(result[1]).toEqual({ id: 1 });
    });

    it('should limit entries to maxItems', () => {
      // Seed with 3 existing entries
      mockLS.setItem(
        'modelpricer:log-tenant:audit_log',
        JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }])
      );

      const result = appendTenantLog('audit_log', { id: 4 }, 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 4 });
      // Last old entry should be dropped
    });

    it('should default maxItems to 100', () => {
      // Create 100 existing entries
      const existing = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      mockLS.setItem(
        'modelpricer:log-tenant:audit_log',
        JSON.stringify(existing)
      );

      const result = appendTenantLog('audit_log', { id: 'new' });
      expect(result).toHaveLength(100);
      expect(result[0]).toEqual({ id: 'new' });
    });

    it('should write to localStorage', () => {
      appendTenantLog('audit_log', { action: 'click' });
      expect(mockLS.setItem).toHaveBeenCalledWith(
        'modelpricer:log-tenant:audit_log',
        expect.any(String)
      );
    });

    it('should fire Supabase insert when mode is dual-write and table exists', () => {
      vi.mocked(getStorageMode).mockReturnValue('dual-write');
      vi.mocked(isSupabaseAvailable).mockReturnValue(true);
      vi.mocked(getTableForNamespace).mockReturnValue('audit_logs');

      const entry = { action: 'login', timestamp: '2026-03-09T00:00:00Z' };
      appendTenantLog('audit_log', entry);

      expect(storageAdapter.supabase.insert).toHaveBeenCalledWith(
        'audit_logs',
        expect.objectContaining({
          tenant_id: 'log-tenant',
          action: 'login',
        })
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Async API
  // ════════════════════════════════════════════════════════════════════════
  describe('readTenantJsonAsync', () => {
    beforeEach(() => {
      mockLS.setItem('modelpricer:tenant_id', 'async-tenant');
    });

    it('should delegate to storageAdapter.read', async () => {
      vi.mocked(storageAdapter.read).mockResolvedValue({ async: true });
      const result = await readTenantJsonAsync('pricing:v3', null);
      expect(storageAdapter.read).toHaveBeenCalledWith(
        'pricing:v3',
        'async-tenant',
        'modelpricer:async-tenant:pricing:v3',
        null
      );
      expect(result).toEqual({ async: true });
    });

    it('should use tenantIdOverride when provided', async () => {
      await readTenantJsonAsync('pricing:v3', {}, 'custom-tenant');
      expect(storageAdapter.read).toHaveBeenCalledWith(
        'pricing:v3',
        'custom-tenant',
        'modelpricer:custom-tenant:pricing:v3',
        {}
      );
    });
  });

  describe('writeTenantJsonAsync', () => {
    beforeEach(() => {
      mockLS.setItem('modelpricer:tenant_id', 'async-tenant');
    });

    it('should delegate to storageAdapter.write', async () => {
      const data = { async: 'write' };
      await writeTenantJsonAsync('fees:v3', data);
      expect(storageAdapter.write).toHaveBeenCalledWith(
        'fees:v3',
        'async-tenant',
        'modelpricer:async-tenant:fees:v3',
        data
      );
    });

    it('should use tenantIdOverride when provided', async () => {
      await writeTenantJsonAsync('fees:v3', {}, 'other-tenant');
      expect(storageAdapter.write).toHaveBeenCalledWith(
        'fees:v3',
        'other-tenant',
        'modelpricer:other-tenant:fees:v3',
        {}
      );
    });
  });

  describe('appendTenantLogAsync', () => {
    beforeEach(() => {
      mockLS.setItem('modelpricer:tenant_id', 'async-tenant');
    });

    it('should delegate to storageAdapter.appendLog', async () => {
      const entry = { event: 'test' };
      await appendTenantLogAsync('audit_log', entry, 50);
      expect(storageAdapter.appendLog).toHaveBeenCalledWith(
        'audit_log',
        'async-tenant',
        'modelpricer:async-tenant:audit_log',
        entry,
        50
      );
    });

    it('should default maxItems to 100', async () => {
      await appendTenantLogAsync('audit_log', { x: 1 });
      expect(storageAdapter.appendLog).toHaveBeenCalledWith(
        'audit_log',
        'async-tenant',
        'modelpricer:async-tenant:audit_log',
        { x: 1 },
        100
      );
    });

    it('should use tenantIdOverride when provided', async () => {
      await appendTenantLogAsync('audit_log', { y: 2 }, 10, 'manual-tenant');
      expect(storageAdapter.appendLog).toHaveBeenCalledWith(
        'audit_log',
        'manual-tenant',
        'modelpricer:manual-tenant:audit_log',
        { y: 2 },
        10
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // Edge cases
  // ════════════════════════════════════════════════════════════════════════
  describe('edge cases', () => {
    beforeEach(() => {
      mockLS.setItem('modelpricer:tenant_id', 'edge-tenant');
    });

    it('should handle namespace with special characters', () => {
      const data = { special: true };
      writeTenantJson('my-ns:v2.1', data);
      expect(mockLS.setItem).toHaveBeenCalledWith(
        'modelpricer:edge-tenant:my-ns:v2.1',
        JSON.stringify(data)
      );
    });

    it('should handle empty object as data', () => {
      writeTenantJson('pricing:v3', {});
      const raw = mockLS.setItem.mock.calls.find(
        ([key]) => key === 'modelpricer:edge-tenant:pricing:v3'
      );
      expect(raw[1]).toBe('{}');
    });

    it('should handle deeply nested data', () => {
      const deep = { a: { b: { c: { d: [1, 2, { e: 'deep' }] } } } };
      writeTenantJson('deep:v1', deep);
      const result = readTenantJson('deep:v1', null);
      expect(result).toEqual(deep);
    });

    it('should handle boolean false as stored value', () => {
      writeTenantJson('bool:v1', false);
      const result = readTenantJson('bool:v1', true);
      expect(result).toBe(false);
    });

    it('should handle zero as stored value', () => {
      writeTenantJson('zero:v1', 0);
      const result = readTenantJson('zero:v1', 999);
      expect(result).toBe(0);
    });

    it('should handle empty array as stored value', () => {
      writeTenantJson('arr:v1', []);
      const result = readTenantJson('arr:v1', ['default']);
      expect(result).toEqual([]);
    });

    it('should handle localStorage.getItem throwing an error', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Use tenantIdOverride to skip getTenantId() (which also calls getItem).
      // Mock the getItem call for the actual data key to throw.
      mockLS.getItem.mockImplementationOnce(() => {
        throw new Error('SecurityError');
      });

      const result = readTenantJson('pricing:v3', { fallback: true }, 'edge-tenant');
      expect(result).toEqual({ fallback: true });
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should read and write roundtrip correctly', () => {
      const original = {
        materials: ['PLA', 'ABS', 'PETG'],
        prices: { PLA: 0.05, ABS: 0.06 },
        enabled: true,
        version: 3,
      };

      writeTenantJson('pricing:v3', original);
      const result = readTenantJson('pricing:v3', null);
      expect(result).toEqual(original);
    });
  });
});
