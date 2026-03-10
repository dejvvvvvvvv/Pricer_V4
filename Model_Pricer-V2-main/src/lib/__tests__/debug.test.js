import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('debug logger', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.resetModules();
  });

  describe('in DEV mode (import.meta.env.DEV = true)', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', true);
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should call console.log with all arguments', async () => {
      const { debug } = await import('../debug.js');
      debug('test message', 42, { key: 'value' });
      expect(consoleSpy).toHaveBeenCalledWith('test message', 42, { key: 'value' });
    });

    it('should call console.log once per call', async () => {
      const { debug } = await import('../debug.js');
      debug('first');
      debug('second');
      expect(consoleSpy).toHaveBeenCalledTimes(2);
    });

    it('should pass single argument through', async () => {
      const { debug } = await import('../debug.js');
      debug('only one');
      expect(consoleSpy).toHaveBeenCalledWith('only one');
    });

    it('should handle no arguments', async () => {
      const { debug } = await import('../debug.js');
      debug();
      expect(consoleSpy).toHaveBeenCalledWith();
    });

    it('should pass multiple arguments of different types', async () => {
      const { debug } = await import('../debug.js');
      const arr = [1, 2, 3];
      const obj = { nested: true };
      debug('label', arr, obj, null, undefined);
      expect(consoleSpy).toHaveBeenCalledWith('label', arr, obj, null, undefined);
    });
  });

  describe('in production mode (import.meta.env.DEV = false)', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false);
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should NOT call console.log', async () => {
      const { debug } = await import('../debug.js');
      debug('this should not log');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should NOT call console.log with multiple arguments', async () => {
      const { debug } = await import('../debug.js');
      debug('msg', 1, 2, 3);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should NOT call console.log even with no arguments', async () => {
      const { debug } = await import('../debug.js');
      debug();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
