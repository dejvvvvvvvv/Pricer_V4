import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateId } from '../generateId.js';

describe('generateId', () => {
  it('should return a string', () => {
    const result = generateId();
    expect(typeof result).toBe('string');
  });

  it('should return unique values on multiple calls', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('should include prefix followed by underscore when prefix is provided', () => {
    const result = generateId('order');
    expect(result).toMatch(/^order_.+/);
  });

  it('should not contain underscore prefix when no prefix is provided', () => {
    const result = generateId();
    expect(result).not.toMatch(/^_/);
  });

  it('should not contain underscore prefix when called with default empty string', () => {
    const result = generateId('');
    expect(result).not.toMatch(/^_/);
  });

  it('should have reasonable length (at least 8 characters)', () => {
    const result = generateId();
    expect(result.length).toBeGreaterThanOrEqual(8);
  });

  it('should have reasonable length with prefix', () => {
    const result = generateId('test');
    // "test_" = 5 chars + id chars
    expect(result.length).toBeGreaterThan(5);
  });

  describe('with crypto.randomUUID available', () => {
    it('should use crypto.randomUUID', () => {
      // In jsdom/node, crypto.randomUUID is available
      const result = generateId();
      // UUID v4 format: 8-4-4-4-12 hex chars
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('should produce UUID format with prefix', () => {
      const result = generateId('item');
      expect(result).toMatch(
        /^item_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });
  });

  describe('fallback when crypto.randomUUID is not available', () => {
    let originalRandomUUID;

    beforeEach(() => {
      originalRandomUUID = globalThis.crypto.randomUUID;
      // Remove crypto.randomUUID to trigger fallback
      vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(undefined);
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: originalRandomUUID,
        writable: true,
        configurable: true,
      });
    });

    it('should still return a string', () => {
      const result = generateId();
      expect(typeof result).toBe('string');
    });

    it('should return unique values on multiple calls', () => {
      const ids = new Set();
      for (let i = 0; i < 50; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(50);
    });

    it('should include prefix when provided', () => {
      const result = generateId('fallback');
      expect(result.startsWith('fallback_')).toBe(true);
    });

    it('should not produce UUID format (uses Date.now + Math.random)', () => {
      const result = generateId();
      // Fallback format is base36 timestamp + random, NOT UUID
      expect(result).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it('should have reasonable length', () => {
      const result = generateId();
      expect(result.length).toBeGreaterThanOrEqual(8);
    });
  });
});
