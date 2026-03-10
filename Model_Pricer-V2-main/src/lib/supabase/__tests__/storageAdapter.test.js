import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock setup ────────────────────────────────────────────────────
// vi.mock calls are hoisted — factories must NOT reference top-level vars.
// We use vi.hoisted() to define mocks that are available inside factories.

const {
  mockFrom,
  mockSelect,
  mockEq,
  mockMaybeSingle,
  mockUpsert,
  mockInsert,
  mockUpdate,
  mockDeleteFn,
  mockOrder,
  mockLimit,
  mockRange,
  mockSingle,
  mockIsSupabaseAvailable,
  mockGetStorageMode,
  mockIsSupabaseEnabled,
  mockIsLocalStorageEnabled,
} = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockUpsert = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDeleteFn = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockRange = vi.fn();
  const mockSingle = vi.fn();

  const chain = {
    select: mockSelect,
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
    upsert: mockUpsert,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDeleteFn,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
    single: mockSingle,
  };
  for (const fn of Object.values(chain)) {
    fn.mockReturnValue(chain);
  }

  const mockFrom = vi.fn(() => chain);

  return {
    mockFrom,
    mockSelect,
    mockEq,
    mockMaybeSingle,
    mockUpsert,
    mockInsert,
    mockUpdate,
    mockDeleteFn,
    mockOrder,
    mockLimit,
    mockRange,
    mockSingle,
    mockIsSupabaseAvailable: vi.fn(() => true),
    mockGetStorageMode: vi.fn(() => 'localStorage'),
    mockIsSupabaseEnabled: vi.fn(() => false),
    mockIsLocalStorageEnabled: vi.fn(() => true),
  };
});

vi.mock('../client', () => ({
  supabase: { from: mockFrom },
  isSupabaseAvailable: mockIsSupabaseAvailable,
}));

vi.mock('../featureFlags', () => ({
  getStorageMode: mockGetStorageMode,
  isSupabaseEnabled: mockIsSupabaseEnabled,
  isLocalStorageEnabled: mockIsLocalStorageEnabled,
}));

// ─── Import module under test ──────────────────────────────────────
import { storageAdapter, getTableForNamespace } from '../storageAdapter';

// ─── localStorage mock ─────────────────────────────────────────────
const localStorageStore = {};
const localStorageMock = {
  getItem: vi.fn((key) => localStorageStore[key] ?? null),
  setItem: vi.fn((key, value) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(localStorageStore)) {
      delete localStorageStore[key];
    }
  }),
};

// ─── Helpers ───────────────────────────────────────────────────────
// Re-establish chainable returns after clearAllMocks wipes them
function rechain() {
  const chain = {
    select: mockSelect,
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
    upsert: mockUpsert,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDeleteFn,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
    single: mockSingle,
  };
  for (const fn of Object.values(chain)) {
    fn.mockReturnValue(chain);
  }
  mockFrom.mockReturnValue(chain);
}

function resetAllMocks() {
  vi.clearAllMocks();
  localStorageMock.clear();
  // Restore chain after clearing
  rechain();
  // Restore default flag values
  mockIsSupabaseAvailable.mockReturnValue(true);
  mockGetStorageMode.mockReturnValue('localStorage');
  mockIsSupabaseEnabled.mockReturnValue(false);
  mockIsLocalStorageEnabled.mockReturnValue(true);
}

function setFeatureFlagMode(mode) {
  mockGetStorageMode.mockReturnValue(mode);
  mockIsSupabaseEnabled.mockReturnValue(mode === 'supabase' || mode === 'dual-write');
  mockIsLocalStorageEnabled.mockReturnValue(mode === 'localStorage' || mode === 'dual-write');
}

const TENANT_ID = 'test-tenant-123';
const LS_KEY = 'modelpricer:test-tenant-123:pricing:v3';
const NAMESPACE = 'pricing:v3';
const FALLBACK = { default: true };

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe('storageAdapter', () => {
  beforeEach(() => {
    resetAllMocks();
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── NAMESPACE_TABLE_MAP ──────────────────────────────────────
  describe('getTableForNamespace', () => {
    it('should map pricing:v3 to pricing_configs', () => {
      expect(getTableForNamespace('pricing:v3')).toBe('pricing_configs');
    });

    it('should map fees:v3 to fees', () => {
      expect(getTableForNamespace('fees:v3')).toBe('fees');
    });

    it('should map orders:v1 to orders', () => {
      expect(getTableForNamespace('orders:v1')).toBe('orders');
    });

    it('should map orders:activity:v1 to order_activity', () => {
      expect(getTableForNamespace('orders:activity:v1')).toBe('order_activity');
    });

    it('should map shipping:v1 to shipping_methods', () => {
      expect(getTableForNamespace('shipping:v1')).toBe('shipping_methods');
    });

    it('should map coupons:v1 to coupons', () => {
      expect(getTableForNamespace('coupons:v1')).toBe('coupons');
    });

    it('should map express:v1 to express_tiers', () => {
      expect(getTableForNamespace('express:v1')).toBe('express_tiers');
    });

    it('should map form:v1 to form_configs', () => {
      expect(getTableForNamespace('form:v1')).toBe('form_configs');
    });

    it('should map email:v1 to email_templates', () => {
      expect(getTableForNamespace('email:v1')).toBe('email_templates');
    });

    it('should map kanban:v1 to kanban_configs', () => {
      expect(getTableForNamespace('kanban:v1')).toBe('kanban_configs');
    });

    it('should map dashboard:v1 to dashboard_configs', () => {
      expect(getTableForNamespace('dashboard:v1')).toBe('dashboard_configs');
    });

    it('should map dashboard:v2 to dashboard_configs', () => {
      expect(getTableForNamespace('dashboard:v2')).toBe('dashboard_configs');
    });

    it('should map audit_log to audit_log', () => {
      expect(getTableForNamespace('audit_log')).toBe('audit_log');
    });

    it('should map analytics:events to analytics_events', () => {
      expect(getTableForNamespace('analytics:events')).toBe('analytics_events');
    });

    it('should map team_users to team_members', () => {
      expect(getTableForNamespace('team_users')).toBe('team_members');
    });

    it('should map team_invites to team_members', () => {
      expect(getTableForNamespace('team_invites')).toBe('team_members');
    });

    it('should map branding to branding', () => {
      expect(getTableForNamespace('branding')).toBe('branding');
    });

    it('should map widgets to widget_configs', () => {
      expect(getTableForNamespace('widgets')).toBe('widget_configs');
    });

    it('should map plan_features to tenants', () => {
      expect(getTableForNamespace('plan_features')).toBe('tenants');
    });

    it('should map widget_theme to widget_configs', () => {
      expect(getTableForNamespace('widget_theme')).toBe('widget_configs');
    });

    it('should return null for unknown namespace', () => {
      expect(getTableForNamespace('unknown:v1')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getTableForNamespace('')).toBeNull();
    });
  });

  // ─── read() ───────────────────────────────────────────────────
  describe('read', () => {
    describe('localStorage mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('localStorage');
      });

      it('should read from localStorage when mode is localStorage', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue(JSON.stringify({ price: 100 }));

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual({ price: 100 });
        expect(localStorageMock.getItem).toHaveBeenCalledWith(LS_KEY);
        expect(mockFrom).not.toHaveBeenCalled();
      });

      it('should return fallback when localStorage has no value', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue(null);

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual(FALLBACK);
      });

      it('should return fallback when localStorage has corrupt JSON', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue('not-valid-json{{{');

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual(FALLBACK);
      });
    });

    describe('supabase mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('supabase');
      });

      it('should read from Supabase when mode is supabase', async () => {
        // Arrange
        const supabaseData = { materials: ['PLA', 'ABS'] };
        mockMaybeSingle.mockResolvedValue({
          data: { data: supabaseData },
          error: null,
        });

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual(supabaseData);
        expect(mockFrom).toHaveBeenCalledWith('pricing_configs');
        expect(mockSelect).toHaveBeenCalledWith('data');
        expect(mockEq).toHaveBeenCalledWith('tenant_id', TENANT_ID);
        expect(mockEq).toHaveBeenCalledWith('namespace', NAMESPACE);
      });

      it('should return fallback when Supabase returns an error', async () => {
        // Arrange
        mockMaybeSingle.mockResolvedValue({
          data: null,
          error: { message: 'Connection refused' },
        });

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual(FALLBACK);
      });

      it('should return fallback when Supabase row not found in supabase-only mode', async () => {
        // Arrange - maybeSingle returns null data when no row found
        mockMaybeSingle.mockResolvedValue({ data: null, error: null });

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual(FALLBACK);
      });

      it('should return fallback when Supabase throws an exception', async () => {
        // Arrange
        mockMaybeSingle.mockRejectedValue(new Error('Network timeout'));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual(FALLBACK);
        warnSpy.mockRestore();
      });

      it('should fall back to localStorage when Supabase is unavailable', async () => {
        // Arrange
        mockIsSupabaseAvailable.mockReturnValue(false);
        localStorageMock.getItem.mockReturnValue(JSON.stringify({ cached: true }));

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual({ cached: true });
        expect(mockFrom).not.toHaveBeenCalled();
      });

      it('should fall back to localStorage when namespace has no table mapping', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue(JSON.stringify({ local: true }));

        // Act
        const result = await storageAdapter.read('unknown:v1', TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual({ local: true });
      });
    });

    describe('dual-write mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('dual-write');
      });

      it('should read from Supabase first in dual-write mode', async () => {
        // Arrange
        const supabaseData = { source: 'supabase' };
        mockMaybeSingle.mockResolvedValue({
          data: { data: supabaseData },
          error: null,
        });

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual(supabaseData);
      });

      it('should fall back to localStorage when Supabase row not found in dual-write', async () => {
        // Arrange - no row in Supabase (NOT_FOUND sentinel)
        mockMaybeSingle.mockResolvedValue({ data: null, error: null });
        localStorageMock.getItem.mockReturnValue(JSON.stringify({ source: 'localStorage' }));

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert
        expect(result).toEqual({ source: 'localStorage' });
        expect(localStorageMock.getItem).toHaveBeenCalledWith(LS_KEY);
      });

      it('should fall back to localStorage when Supabase errors in dual-write', async () => {
        // Arrange — supabaseReadConfig returns fallback on error
        mockMaybeSingle.mockResolvedValue({
          data: null,
          error: { message: 'RLS violation' },
        });
        localStorageMock.getItem.mockReturnValue(JSON.stringify({ source: 'localStorage' }));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act
        const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

        // Assert — on error, supabaseReadConfig returns fallback (NOT_FOUND),
        // then dual-write reads from localStorage
        expect(localStorageMock.getItem).toHaveBeenCalled();
        warnSpy.mockRestore();
      });
    });
  });

  // ─── write() ──────────────────────────────────────────────────
  describe('write', () => {
    const writeData = { materials: ['PLA'], markup: 1.5 };

    describe('localStorage mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('localStorage');
      });

      it('should write only to localStorage', async () => {
        // Act
        await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, writeData);

        // Assert
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          LS_KEY,
          JSON.stringify(writeData)
        );
        expect(mockFrom).not.toHaveBeenCalled();
      });
    });

    describe('supabase mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('supabase');
      });

      it('should write only to Supabase', async () => {
        // Arrange
        mockUpsert.mockResolvedValue({ error: null });

        // Act
        await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, writeData);

        // Assert
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalledWith('pricing_configs');
        expect(mockUpsert).toHaveBeenCalledWith(
          expect.objectContaining({
            tenant_id: TENANT_ID,
            namespace: NAMESPACE,
            data: writeData,
          }),
          { onConflict: 'tenant_id,namespace' }
        );
      });

      it('should include updated_at timestamp in upsert', async () => {
        // Arrange
        mockUpsert.mockResolvedValue({ error: null });

        // Act
        await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, writeData);

        // Assert
        const upsertArg = mockUpsert.mock.calls[0][0];
        expect(upsertArg.updated_at).toBeDefined();
        expect(new Date(upsertArg.updated_at).toISOString()).toBe(upsertArg.updated_at);
      });

      it('should not write to Supabase when it is unavailable', async () => {
        // Arrange
        mockIsSupabaseAvailable.mockReturnValue(false);

        // Act
        await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, writeData);

        // Assert
        expect(mockFrom).not.toHaveBeenCalled();
      });

      it('should not write to Supabase when namespace has no table mapping', async () => {
        // Act
        await storageAdapter.write('unknown:v1', TENANT_ID, LS_KEY, writeData);

        // Assert
        expect(mockFrom).not.toHaveBeenCalled();
      });

      it('should handle Supabase write error gracefully', async () => {
        // Arrange
        mockUpsert.mockResolvedValue({ error: { message: 'Quota exceeded' } });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act - should not throw
        await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, writeData);

        // Assert
        expect(mockFrom).toHaveBeenCalled();
        warnSpy.mockRestore();
      });

      it('should handle Supabase write exception gracefully', async () => {
        // Arrange
        mockUpsert.mockRejectedValue(new Error('Network error'));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act - should not throw
        await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, writeData);

        // Assert
        expect(mockFrom).toHaveBeenCalled();
        warnSpy.mockRestore();
      });
    });

    describe('dual-write mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('dual-write');
      });

      it('should write to both localStorage and Supabase', async () => {
        // Arrange
        mockUpsert.mockResolvedValue({ error: null });

        // Act
        await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, writeData);

        // Assert
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          LS_KEY,
          JSON.stringify(writeData)
        );
        expect(mockFrom).toHaveBeenCalledWith('pricing_configs');
        expect(mockUpsert).toHaveBeenCalled();
      });

      it('should still write to localStorage even if Supabase fails', async () => {
        // Arrange
        mockUpsert.mockRejectedValue(new Error('Supabase down'));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act
        await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, writeData);

        // Assert
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          LS_KEY,
          JSON.stringify(writeData)
        );
        warnSpy.mockRestore();
      });
    });
  });

  // ─── readList() ───────────────────────────────────────────────
  describe('readList', () => {
    const LS_LIST_KEY = 'modelpricer:test-tenant-123:orders:v1';
    const LIST_NS = 'orders:v1';
    const LIST_FALLBACK = [];

    describe('localStorage mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('localStorage');
      });

      it('should read list from localStorage', async () => {
        // Arrange
        const orders = [{ id: 1 }, { id: 2 }];
        localStorageMock.getItem.mockReturnValue(JSON.stringify(orders));

        // Act
        const result = await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK);

        // Assert
        expect(result).toEqual(orders);
        expect(localStorageMock.getItem).toHaveBeenCalledWith(LS_LIST_KEY);
      });

      it('should return fallback when localStorage has no list data', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue(null);

        // Act
        const result = await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK);

        // Assert
        expect(result).toEqual([]);
      });
    });

    describe('supabase mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('supabase');
      });

      it('should read list from Supabase', async () => {
        // Arrange
        const supabaseOrders = [{ id: 'abc', total: 500 }];
        // The query chain ends with the last .eq() call which must resolve
        mockEq.mockResolvedValue({ data: supabaseOrders, error: null });

        // Act
        const result = await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK);

        // Assert
        expect(result).toEqual(supabaseOrders);
        expect(mockFrom).toHaveBeenCalledWith('orders');
      });

      it('should pass orderBy option to Supabase query', async () => {
        // Arrange
        mockOrder.mockResolvedValue({ data: [], error: null });

        // Act
        await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK, {
          orderBy: 'created_at',
          ascending: false,
        });

        // Assert
        expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      });

      it('should pass limit option to Supabase query', async () => {
        // Arrange
        mockLimit.mockResolvedValue({ data: [], error: null });

        // Act
        await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK, {
          limit: 25,
        });

        // Assert
        expect(mockLimit).toHaveBeenCalledWith(25);
      });

      it('should use range for pagination when offset is provided', async () => {
        // Arrange
        mockRange.mockResolvedValue({ data: [], error: null });

        // Act
        await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK, {
          offset: 10,
          limit: 20,
        });

        // Assert
        expect(mockRange).toHaveBeenCalledWith(10, 29); // offset + limit - 1
      });

      it('should use default limit of 50 when offset provided without limit', async () => {
        // Arrange
        mockRange.mockResolvedValue({ data: [], error: null });

        // Act
        await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK, {
          offset: 0,
        });

        // Assert
        expect(mockRange).toHaveBeenCalledWith(0, 49); // 0 + 50 - 1
      });

      it('should return fallback when Supabase list returns error', async () => {
        // Arrange
        mockEq.mockResolvedValue({
          data: null,
          error: { message: 'Table not found' },
        });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act
        const result = await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK);

        // Assert
        expect(result).toEqual([]);
        warnSpy.mockRestore();
      });

      it('should return fallback when Supabase throws exception', async () => {
        // Arrange
        mockEq.mockRejectedValue(new Error('Connection lost'));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act
        const result = await storageAdapter.readList(LIST_NS, TENANT_ID, LS_LIST_KEY, LIST_FALLBACK);

        // Assert
        expect(result).toEqual([]);
        warnSpy.mockRestore();
      });
    });

    describe('dual-write mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('dual-write');
      });

      it('should fall back to localStorage when Supabase returns null in dual-write', async () => {
        // Arrange - supabaseReadList returns null on error
        mockEq.mockResolvedValue({ data: null, error: { message: 'error' } });
        const localOrders = [{ id: 'local-1' }];
        localStorageMock.getItem.mockReturnValue(JSON.stringify(localOrders));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act
        const result = await storageAdapter.readList('orders:v1', TENANT_ID, LS_LIST_KEY, LIST_FALLBACK);

        // Assert
        expect(result).toEqual(localOrders);
        warnSpy.mockRestore();
      });
    });
  });

  // ─── appendLog() ──────────────────────────────────────────────
  describe('appendLog', () => {
    const LOG_NS = 'audit_log';
    const LOG_LS_KEY = 'modelpricer:test-tenant-123:audit_log';
    const logEntry = {
      action: 'pricing_updated',
      user: 'admin@test.com',
      timestamp: '2026-03-09T10:00:00Z',
    };

    describe('localStorage mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('localStorage');
      });

      it('should prepend entry to localStorage array', async () => {
        // Arrange
        const existing = [{ action: 'old_action' }];
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existing));

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 100);

        // Assert
        const written = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(written[0]).toEqual(logEntry);
        expect(written[1]).toEqual({ action: 'old_action' });
        expect(written).toHaveLength(2);
      });

      it('should truncate to maxItems', async () => {
        // Arrange - existing has 3 items, maxItems = 3 → new + first 2 old
        const existing = [{ id: 1 }, { id: 2 }, { id: 3 }];
        localStorageMock.getItem.mockReturnValue(JSON.stringify(existing));

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 3);

        // Assert
        const written = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(written).toHaveLength(3);
        expect(written[0]).toEqual(logEntry);
      });

      it('should create new array when localStorage is empty', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue(null);

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 100);

        // Assert
        const written = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
        expect(written).toEqual([logEntry]);
      });

      it('should not call Supabase in localStorage mode', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue('[]');

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 100);

        // Assert
        expect(mockFrom).not.toHaveBeenCalled();
      });
    });

    describe('supabase mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('supabase');
      });

      it('should insert into Supabase table', async () => {
        // Arrange
        mockSingle.mockResolvedValue({ data: { id: 'new-1' }, error: null });

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 100);

        // Assert
        expect(mockFrom).toHaveBeenCalledWith('audit_log');
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            tenant_id: TENANT_ID,
            action: 'pricing_updated',
            user: 'admin@test.com',
          })
        );
      });

      it('should use entry timestamp as created_at', async () => {
        // Arrange
        mockSingle.mockResolvedValue({ data: { id: 'new-1' }, error: null });

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 100);

        // Assert
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            created_at: '2026-03-09T10:00:00Z',
          })
        );
      });

      it('should generate created_at when entry has no timestamp', async () => {
        // Arrange
        const entryNoTs = { action: 'test' };
        mockSingle.mockResolvedValue({ data: {}, error: null });

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, entryNoTs, 100);

        // Assert
        const insertArg = mockInsert.mock.calls[0][0];
        expect(insertArg.created_at).toBeDefined();
        expect(new Date(insertArg.created_at).toISOString()).toBe(insertArg.created_at);
      });

      it('should not write to localStorage in supabase-only mode', async () => {
        // Arrange
        mockSingle.mockResolvedValue({ data: {}, error: null });

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 100);

        // Assert
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
      });

      it('should handle Supabase insert error gracefully', async () => {
        // Arrange
        mockSingle.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Act - should not throw
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 100);

        // Assert
        expect(mockFrom).toHaveBeenCalled();
        warnSpy.mockRestore();
      });
    });

    describe('dual-write mode', () => {
      beforeEach(() => {
        setFeatureFlagMode('dual-write');
      });

      it('should write to both localStorage and Supabase', async () => {
        // Arrange
        localStorageMock.getItem.mockReturnValue('[]');
        mockSingle.mockResolvedValue({ data: {}, error: null });

        // Act
        await storageAdapter.appendLog(LOG_NS, TENANT_ID, LOG_LS_KEY, logEntry, 100);

        // Assert
        expect(localStorageMock.setItem).toHaveBeenCalled();
        expect(mockFrom).toHaveBeenCalledWith('audit_log');
        expect(mockInsert).toHaveBeenCalled();
      });
    });
  });

  // ─── Direct Supabase operations ───────────────────────────────
  describe('storageAdapter.supabase (direct operations)', () => {
    it('should expose readConfig method', () => {
      expect(typeof storageAdapter.supabase.readConfig).toBe('function');
    });

    it('should expose writeConfig method', () => {
      expect(typeof storageAdapter.supabase.writeConfig).toBe('function');
    });

    it('should expose readList method', () => {
      expect(typeof storageAdapter.supabase.readList).toBe('function');
    });

    it('should expose insert method', () => {
      expect(typeof storageAdapter.supabase.insert).toBe('function');
    });

    it('should expose update method', () => {
      expect(typeof storageAdapter.supabase.update).toBe('function');
    });

    it('should expose delete method', () => {
      expect(typeof storageAdapter.supabase.delete).toBe('function');
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────
  describe('edge cases', () => {
    it('should handle read with null data column from Supabase (row exists, data is null)', async () => {
      // Arrange - row exists but data column is null
      setFeatureFlagMode('supabase');
      mockMaybeSingle.mockResolvedValue({
        data: { data: null },
        error: null,
      });

      // Act
      const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

      // Assert - should return null (the actual data), not the fallback
      expect(result).toBeNull();
    });

    it('should handle write with undefined value', async () => {
      // Arrange
      setFeatureFlagMode('localStorage');

      // Act - should not throw
      await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, undefined);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle write with empty object', async () => {
      // Arrange
      setFeatureFlagMode('localStorage');

      // Act
      await storageAdapter.write(NAMESPACE, TENANT_ID, LS_KEY, {});

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(LS_KEY, '{}');
    });

    it('should handle appendLog with maxItems of 1', async () => {
      // Arrange
      setFeatureFlagMode('localStorage');
      const existing = [{ old: true }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existing));

      // Act
      await storageAdapter.appendLog('audit_log', TENANT_ID, 'key', { new: true }, 1);

      // Assert
      const written = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(written).toHaveLength(1);
      expect(written[0]).toEqual({ new: true });
    });

    it('should read from localStorage when Supabase is unavailable even in supabase mode', async () => {
      // Arrange
      setFeatureFlagMode('supabase');
      mockIsSupabaseAvailable.mockReturnValue(false);
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ fallback: true }));

      // Act
      const result = await storageAdapter.read(NAMESPACE, TENANT_ID, LS_KEY, FALLBACK);

      // Assert
      expect(result).toEqual({ fallback: true });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should handle readList with custom select option', async () => {
      // Arrange
      setFeatureFlagMode('supabase');
      mockEq.mockResolvedValue({ data: [], error: null });

      // Act
      await storageAdapter.readList('orders:v1', TENANT_ID, 'key', [], {
        select: 'id,total,status',
      });

      // Assert
      expect(mockSelect).toHaveBeenCalledWith('id,total,status');
    });

    it('should default select to * when no select option provided', async () => {
      // Arrange
      setFeatureFlagMode('supabase');
      mockEq.mockResolvedValue({ data: [], error: null });

      // Act
      await storageAdapter.readList('orders:v1', TENANT_ID, 'key', []);

      // Assert
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should default ascending to false when orderBy is set without ascending', async () => {
      // Arrange
      setFeatureFlagMode('supabase');
      mockOrder.mockResolvedValue({ data: [], error: null });

      // Act
      await storageAdapter.readList('orders:v1', TENANT_ID, 'key', [], {
        orderBy: 'created_at',
      });

      // Assert
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });
});
