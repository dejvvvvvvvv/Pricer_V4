import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from '../formatRelativeTime.js';

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-03-10T12:00:00.000Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('English (default)', () => {
    it('should return "Just now" for under 60 seconds ago', () => {
      const date = new Date(NOW - 30 * 1000);
      expect(formatRelativeTime(date)).toBe('Just now');
    });

    it('should return "Just now" for 0 seconds ago', () => {
      const date = new Date(NOW);
      expect(formatRelativeTime(date)).toBe('Just now');
    });

    it('should return "1 minute ago" for exactly 1 minute', () => {
      const date = new Date(NOW - 60 * 1000);
      expect(formatRelativeTime(date)).toBe('1 minute ago');
    });

    it('should return "5 minutes ago" for 5 minutes', () => {
      const date = new Date(NOW - 5 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('5 minutes ago');
    });

    it('should return "59 minutes ago" for 59 minutes', () => {
      const date = new Date(NOW - 59 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('59 minutes ago');
    });

    it('should return "1 hour ago" for exactly 1 hour', () => {
      const date = new Date(NOW - 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('1 hour ago');
    });

    it('should return "3 hours ago" for 3 hours', () => {
      const date = new Date(NOW - 3 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('3 hours ago');
    });

    it('should return "Yesterday" for 1 day ago', () => {
      const date = new Date(NOW - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('Yesterday');
    });

    it('should return "4 days ago" for 4 days', () => {
      const date = new Date(NOW - 4 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('4 days ago');
    });

    it('should return "1 week ago" for exactly 7 days', () => {
      const date = new Date(NOW - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('1 week ago');
    });

    it('should return "3 weeks ago" for 21 days', () => {
      const date = new Date(NOW - 21 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date)).toBe('3 weeks ago');
    });

    it('should fall back to localized date string for > 30 days', () => {
      const date = new Date(NOW - 45 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date);
      // Should be a locale date string, not a relative time
      expect(result).not.toContain('ago');
      expect(result).not.toBe('Just now');
      // Should contain some date-like content (month/day/year)
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Czech (cs)', () => {
    it('should return "Prave ted" for under 60 seconds ago', () => {
      const date = new Date(NOW - 10 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Prave ted');
    });

    it('should return "Pred 1 min" for exactly 1 minute', () => {
      const date = new Date(NOW - 60 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Pred 1 min');
    });

    it('should return "Pred 15 min" for 15 minutes', () => {
      const date = new Date(NOW - 15 * 60 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Pred 15 min');
    });

    it('should return "Pred 1 hod" for exactly 1 hour', () => {
      const date = new Date(NOW - 60 * 60 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Pred 1 hod');
    });

    it('should return "Pred 5 hod" for 5 hours', () => {
      const date = new Date(NOW - 5 * 60 * 60 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Pred 5 hod');
    });

    it('should return "Vcera" for 1 day ago', () => {
      const date = new Date(NOW - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Vcera');
    });

    it('should return "Pred 3 dny" for 3 days', () => {
      const date = new Date(NOW - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Pred 3 dny');
    });

    it('should return "Pred 1 tydnem" for 7 days', () => {
      const date = new Date(NOW - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Pred 1 tydnem');
    });

    it('should return "Pred 2 tydny" for 14 days', () => {
      const date = new Date(NOW - 14 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(date, 'cs')).toBe('Pred 2 tydny');
    });

    it('should fall back to localized date string for > 30 days', () => {
      const date = new Date(NOW - 60 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(date, 'cs');
      expect(result).not.toContain('Pred');
      expect(result).not.toBe('Prave ted');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('should return "Unknown date" for invalid date string', () => {
      expect(formatRelativeTime('not-a-date')).toBe('Unknown date');
    });

    it('should treat null as epoch (Date(null) = Jan 1 1970)', () => {
      // new Date(null) returns epoch, which is a valid date (not NaN)
      const result = formatRelativeTime(null);
      expect(result).not.toBe('Unknown date');
      // It's far in the past (>30 days), so it falls back to locale date
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return "Unknown date" for undefined', () => {
      // new Date(undefined) returns Invalid Date
      expect(formatRelativeTime(undefined)).toBe('Unknown date');
    });

    it('should return "Nezname datum" for invalid date in Czech', () => {
      expect(formatRelativeTime('invalid', 'cs')).toBe('Nezname datum');
    });

    it('should treat null as epoch in Czech (Date(null) = Jan 1 1970)', () => {
      // new Date(null) returns epoch, which is a valid date (not NaN)
      const result = formatRelativeTime(null, 'cs');
      expect(result).not.toBe('Nezname datum');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept ISO string input', () => {
      const iso = new Date(NOW - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(iso)).toBe('5 minutes ago');
    });

    it('should accept timestamp number input', () => {
      const timestamp = NOW - 2 * 60 * 60 * 1000;
      expect(formatRelativeTime(timestamp)).toBe('2 hours ago');
    });

    it('should accept Date object input', () => {
      const dateObj = new Date(NOW - 3 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(dateObj)).toBe('3 days ago');
    });

    it('should show absolute date for future dates', () => {
      const futureDate = new Date(NOW + 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(futureDate);
      // Should be a locale date string, not relative
      expect(result).not.toContain('ago');
      expect(result).not.toBe('Just now');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should show absolute date for future dates in Czech', () => {
      const futureDate = new Date(NOW + 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(futureDate, 'cs');
      expect(result).not.toContain('Pred');
      expect(result).not.toBe('Prave ted');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should default to English when lang is not specified', () => {
      const date = new Date(NOW - 30 * 1000);
      expect(formatRelativeTime(date)).toBe('Just now');
    });
  });

  describe('Boundary transitions', () => {
    it('should transition from "Just now" to "1 minute ago" at 60 seconds', () => {
      const at59 = new Date(NOW - 59 * 1000);
      const at60 = new Date(NOW - 60 * 1000);
      expect(formatRelativeTime(at59)).toBe('Just now');
      expect(formatRelativeTime(at60)).toBe('1 minute ago');
    });

    it('should transition from minutes to "1 hour ago" at 60 minutes', () => {
      const at59min = new Date(NOW - 59 * 60 * 1000);
      const at60min = new Date(NOW - 60 * 60 * 1000);
      expect(formatRelativeTime(at59min)).toBe('59 minutes ago');
      expect(formatRelativeTime(at60min)).toBe('1 hour ago');
    });

    it('should transition from hours to "Yesterday" at 24 hours', () => {
      const at23h = new Date(NOW - 23 * 60 * 60 * 1000);
      const at24h = new Date(NOW - 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(at23h)).toBe('23 hours ago');
      expect(formatRelativeTime(at24h)).toBe('Yesterday');
    });

    it('should transition from days to "1 week ago" at 7 days', () => {
      const at6d = new Date(NOW - 6 * 24 * 60 * 60 * 1000);
      const at7d = new Date(NOW - 7 * 24 * 60 * 60 * 1000);
      expect(formatRelativeTime(at6d)).toBe('6 days ago');
      expect(formatRelativeTime(at7d)).toBe('1 week ago');
    });
  });
});
