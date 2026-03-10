import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStorageMode,
  setStorageMode,
  setAllStorageModes,
  getAllStorageModes,
  isSupabaseEnabled,
  isLocalStorageEnabled,
  ALL_NAMESPACES,
  VALID_MODES,
} from '../featureFlags.js';

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = 'modelpricer:feature_flags:storage_modes';

// ─── localStorage mock ──────────────────────────────────────────────
let store = {};

const localStorageMock = {
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
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
// Also ensure window.localStorage points to same mock (module uses window.localStorage)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
}

// ─── Helpers ─────────────────────────────────────────────────────────
function setFlags(flags) {
  store[STORAGE_KEY] = JSON.stringify(flags);
}

function getFlags() {
  const raw = store[STORAGE_KEY];
  return raw ? JSON.parse(raw) : {};
}

// ─── Tests ───────────────────────────────────────────────────────────

beforeEach(() => {
  store = {};
  vi.clearAllMocks();
});

// ── Exported constants ───────────────────────────────────────────────
describe('Exported constants', () => {
  it('should export ALL_NAMESPACES as a non-empty array', () => {
    expect(Array.isArray(ALL_NAMESPACES)).toBe(true);
    expect(ALL_NAMESPACES.length).toBeGreaterThan(0);
  });

  it('should include known namespaces', () => {
    expect(ALL_NAMESPACES).toContain('pricing:v3');
    expect(ALL_NAMESPACES).toContain('fees:v3');
    expect(ALL_NAMESPACES).toContain('orders:v1');
    expect(ALL_NAMESPACES).toContain('branding');
    expect(ALL_NAMESPACES).toContain('widgets');
  });

  it('should export VALID_MODES with exactly three modes', () => {
    expect(VALID_MODES).toEqual(['localStorage', 'supabase', 'dual-write']);
  });
});

// ── getStorageMode ───────────────────────────────────────────────────
describe('getStorageMode', () => {
  it('should return "localStorage" as default when no flags are set', () => {
    const mode = getStorageMode('pricing:v3');
    expect(mode).toBe('localStorage');
  });

  it('should return "localStorage" for an unknown namespace', () => {
    const mode = getStorageMode('nonexistent:v99');
    expect(mode).toBe('localStorage');
  });

  it('should return the stored mode when it is valid', () => {
    setFlags({ 'pricing:v3': 'supabase' });
    expect(getStorageMode('pricing:v3')).toBe('supabase');
  });

  it('should return "dual-write" when set', () => {
    setFlags({ 'orders:v1': 'dual-write' });
    expect(getStorageMode('orders:v1')).toBe('dual-write');
  });

  it('should fall back to "localStorage" when stored value is invalid', () => {
    setFlags({ 'pricing:v3': 'invalid-mode' });
    expect(getStorageMode('pricing:v3')).toBe('localStorage');
  });

  it('should fall back to "localStorage" when stored value is empty string', () => {
    setFlags({ 'pricing:v3': '' });
    expect(getStorageMode('pricing:v3')).toBe('localStorage');
  });

  it('should fall back to "localStorage" when stored value is null', () => {
    setFlags({ 'pricing:v3': null });
    expect(getStorageMode('pricing:v3')).toBe('localStorage');
  });

  it('should fall back to "localStorage" when stored value is a number', () => {
    setFlags({ 'pricing:v3': 42 });
    expect(getStorageMode('pricing:v3')).toBe('localStorage');
  });

  it('should handle null namespace gracefully', () => {
    const mode = getStorageMode(null);
    expect(mode).toBe('localStorage');
  });

  it('should handle undefined namespace gracefully', () => {
    const mode = getStorageMode(undefined);
    expect(mode).toBe('localStorage');
  });

  it('should return "localStorage" when localStorage contains corrupted JSON', () => {
    store[STORAGE_KEY] = 'not-valid-json{{{';
    expect(getStorageMode('pricing:v3')).toBe('localStorage');
  });
});

// ── setStorageMode ───────────────────────────────────────────────────
describe('setStorageMode', () => {
  it('should set a valid mode for a namespace', () => {
    setStorageMode('pricing:v3', 'supabase');
    expect(getFlags()['pricing:v3']).toBe('supabase');
  });

  it('should persist mode to localStorage via the correct key', () => {
    setStorageMode('fees:v3', 'dual-write');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String)
    );
    const saved = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(saved['fees:v3']).toBe('dual-write');
  });

  it('should overwrite an existing mode', () => {
    setStorageMode('pricing:v3', 'supabase');
    setStorageMode('pricing:v3', 'localStorage');
    expect(getFlags()['pricing:v3']).toBe('localStorage');
  });

  it('should not overwrite modes for other namespaces', () => {
    setStorageMode('pricing:v3', 'supabase');
    setStorageMode('fees:v3', 'dual-write');
    const flags = getFlags();
    expect(flags['pricing:v3']).toBe('supabase');
    expect(flags['fees:v3']).toBe('dual-write');
  });

  it('should reject an invalid mode and log a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    setStorageMode('pricing:v3', 'invalid-mode');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid mode')
    );
    // Should not have saved anything
    expect(getFlags()['pricing:v3']).toBeUndefined();
    warnSpy.mockRestore();
  });

  it('should reject empty string as mode', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setStorageMode('pricing:v3', '');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should reject null as mode', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setStorageMode('pricing:v3', null);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should reject undefined as mode', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setStorageMode('pricing:v3', undefined);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should allow setting mode for unknown namespace (no validation on namespace)', () => {
    setStorageMode('custom:namespace', 'supabase');
    expect(getFlags()['custom:namespace']).toBe('supabase');
  });
});

// ── setAllStorageModes ───────────────────────────────────────────────
describe('setAllStorageModes', () => {
  it('should set the same mode for all known namespaces', () => {
    setAllStorageModes('supabase');
    const flags = getFlags();
    for (const ns of ALL_NAMESPACES) {
      expect(flags[ns]).toBe('supabase');
    }
  });

  it('should overwrite previously set modes', () => {
    setStorageMode('pricing:v3', 'dual-write');
    setAllStorageModes('localStorage');
    const flags = getFlags();
    expect(flags['pricing:v3']).toBe('localStorage');
  });

  it('should reject an invalid mode and not save', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setStorageMode('pricing:v3', 'supabase'); // set something first
    setAllStorageModes('bogus');
    expect(warnSpy).toHaveBeenCalled();
    // pricing:v3 should still be 'supabase' from before
    expect(getFlags()['pricing:v3']).toBe('supabase');
    warnSpy.mockRestore();
  });

  it('should set dual-write for all namespaces', () => {
    setAllStorageModes('dual-write');
    const flags = getFlags();
    for (const ns of ALL_NAMESPACES) {
      expect(flags[ns]).toBe('dual-write');
    }
  });

  it('should not include unknown namespaces in the output', () => {
    setFlags({ 'custom:ns': 'supabase' });
    setAllStorageModes('localStorage');
    const flags = getFlags();
    // custom:ns is NOT in ALL_NAMESPACES, so setAllStorageModes replaces the entire flags object
    expect(flags['custom:ns']).toBeUndefined();
  });
});

// ── getAllStorageModes ────────────────────────────────────────────────
describe('getAllStorageModes', () => {
  it('should return all namespaces with default "localStorage" when nothing set', () => {
    const modes = getAllStorageModes();
    for (const ns of ALL_NAMESPACES) {
      expect(modes[ns]).toBe('localStorage');
    }
  });

  it('should return the correct count of namespaces', () => {
    const modes = getAllStorageModes();
    expect(Object.keys(modes).length).toBe(ALL_NAMESPACES.length);
  });

  it('should reflect individually set modes', () => {
    setStorageMode('pricing:v3', 'supabase');
    setStorageMode('fees:v3', 'dual-write');
    const modes = getAllStorageModes();
    expect(modes['pricing:v3']).toBe('supabase');
    expect(modes['fees:v3']).toBe('dual-write');
    expect(modes['orders:v1']).toBe('localStorage');
  });

  it('should fall back to "localStorage" for invalid stored values', () => {
    setFlags({ 'pricing:v3': 'invalid', 'fees:v3': 123 });
    const modes = getAllStorageModes();
    expect(modes['pricing:v3']).toBe('localStorage');
    expect(modes['fees:v3']).toBe('localStorage');
  });

  it('should not include namespaces outside ALL_NAMESPACES', () => {
    setFlags({ 'custom:ns': 'supabase' });
    const modes = getAllStorageModes();
    expect(modes['custom:ns']).toBeUndefined();
  });
});

// ── isSupabaseEnabled ────────────────────────────────────────────────
describe('isSupabaseEnabled', () => {
  it('should return false when mode is "localStorage" (default)', () => {
    expect(isSupabaseEnabled('pricing:v3')).toBe(false);
  });

  it('should return true when mode is "supabase"', () => {
    setStorageMode('pricing:v3', 'supabase');
    expect(isSupabaseEnabled('pricing:v3')).toBe(true);
  });

  it('should return true when mode is "dual-write"', () => {
    setStorageMode('pricing:v3', 'dual-write');
    expect(isSupabaseEnabled('pricing:v3')).toBe(true);
  });

  it('should return false for unknown namespace (defaults to localStorage)', () => {
    expect(isSupabaseEnabled('nonexistent:v99')).toBe(false);
  });

  it('should return false when stored value is invalid', () => {
    setFlags({ 'pricing:v3': 'bogus' });
    expect(isSupabaseEnabled('pricing:v3')).toBe(false);
  });
});

// ── isLocalStorageEnabled ────────────────────────────────────────────
describe('isLocalStorageEnabled', () => {
  it('should return true when mode is "localStorage" (default)', () => {
    expect(isLocalStorageEnabled('pricing:v3')).toBe(true);
  });

  it('should return false when mode is "supabase"', () => {
    setStorageMode('pricing:v3', 'supabase');
    expect(isLocalStorageEnabled('pricing:v3')).toBe(false);
  });

  it('should return true when mode is "dual-write"', () => {
    setStorageMode('pricing:v3', 'dual-write');
    expect(isLocalStorageEnabled('pricing:v3')).toBe(true);
  });

  it('should return true for unknown namespace (defaults to localStorage)', () => {
    expect(isLocalStorageEnabled('nonexistent:v99')).toBe(true);
  });

  it('should return true when stored value is invalid (falls back to localStorage)', () => {
    setFlags({ 'pricing:v3': 'bogus' });
    expect(isLocalStorageEnabled('pricing:v3')).toBe(true);
  });
});

// ── Persistence & isolation ──────────────────────────────────────────
describe('Persistence and isolation', () => {
  it('should persist flags across multiple getStorageMode calls', () => {
    setStorageMode('pricing:v3', 'supabase');
    // Multiple reads should return same value
    expect(getStorageMode('pricing:v3')).toBe('supabase');
    expect(getStorageMode('pricing:v3')).toBe('supabase');
    expect(getStorageMode('pricing:v3')).toBe('supabase');
  });

  it('should store all flags under a single localStorage key', () => {
    setStorageMode('pricing:v3', 'supabase');
    setStorageMode('fees:v3', 'dual-write');
    setStorageMode('orders:v1', 'localStorage');

    const raw = store[STORAGE_KEY];
    const parsed = JSON.parse(raw);
    expect(parsed['pricing:v3']).toBe('supabase');
    expect(parsed['fees:v3']).toBe('dual-write');
    expect(parsed['orders:v1']).toBe('localStorage');
  });

  it('should handle localStorage.getItem returning null gracefully', () => {
    // store is empty, getItem returns null
    expect(getStorageMode('pricing:v3')).toBe('localStorage');
  });
});

// ── Rollback scenario ────────────────────────────────────────────────
describe('Rollback scenario (reset to localStorage)', () => {
  it('should reset all namespaces to localStorage using setAllStorageModes', () => {
    // Arrange — set various modes
    setStorageMode('pricing:v3', 'supabase');
    setStorageMode('fees:v3', 'dual-write');
    setStorageMode('orders:v1', 'supabase');

    // Act — rollback
    setAllStorageModes('localStorage');

    // Assert — all are localStorage
    const modes = getAllStorageModes();
    for (const ns of ALL_NAMESPACES) {
      expect(modes[ns]).toBe('localStorage');
    }
  });

  it('should reset a single namespace by setting it back to localStorage', () => {
    setStorageMode('pricing:v3', 'supabase');
    setStorageMode('pricing:v3', 'localStorage');
    expect(getStorageMode('pricing:v3')).toBe('localStorage');
  });
});

// ── isSupabaseEnabled + isLocalStorageEnabled truth table ─────────────
describe('Mode boolean helpers truth table', () => {
  const truthTable = [
    // [mode,           isSupabaseEnabled, isLocalStorageEnabled]
    ['localStorage',  false,              true],
    ['supabase',      true,               false],
    ['dual-write',    true,               true],
  ];

  it.each(truthTable)(
    'mode="%s" -> isSupabaseEnabled=%s, isLocalStorageEnabled=%s',
    (mode, expectedSupabase, expectedLocal) => {
      setStorageMode('pricing:v3', mode);
      expect(isSupabaseEnabled('pricing:v3')).toBe(expectedSupabase);
      expect(isLocalStorageEnabled('pricing:v3')).toBe(expectedLocal);
    }
  );
});
