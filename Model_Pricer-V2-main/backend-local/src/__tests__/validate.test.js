/**
 * Unit tests for backend validation middleware.
 *
 * @module __tests__/validate.test
 * @see ../middleware/validate.js
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validate, presetSchemas, storageSchemas } from '../middleware/validate.js';

// ── Test helpers ──────────────────────────────────────────────

const mockReq = (body = {}, query = {}, params = {}) => ({ body, query, params });

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// ── Tests ─────────────────────────────────────────────────────

describe('validate middleware', () => {
  let next;

  beforeEach(() => {
    next = vi.fn();
  });

  // ── 1. Passes valid input ──

  describe('valid input', () => {
    it('should call next() when all required fields are present and valid', () => {
      const schema = {
        body: {
          name: { type: 'string', required: true, maxLength: 200 },
          count: { type: 'number', min: 1, max: 100 },
        },
      };
      const req = mockReq({ name: 'Test', count: 5 });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() when schema has no fields', () => {
      const req = mockReq();
      const res = mockRes();

      validate({})(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 2. Rejects missing required field ──

  describe('required fields', () => {
    it('should return 400 when a required field is missing', () => {
      const schema = {
        body: {
          name: { type: 'string', required: true },
        },
      };
      const req = mockReq({});
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          errorCode: 'MP_VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'body.name',
              message: expect.stringContaining('required'),
            }),
          ]),
        })
      );
    });

    it('should treat null as missing for required fields', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
      };
      const req = mockReq({ name: null });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should treat empty string as missing for required fields', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
      };
      const req = mockReq({ name: '' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should flag required fields when entire body source is missing', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
      };
      // req.body is undefined
      const req = { body: undefined, query: {}, params: {} };
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      const details = res.json.mock.calls[0][0].details;
      expect(details).toHaveLength(1);
      expect(details[0].field).toBe('body.name');
    });
  });

  // ── 3. Validates string type ──

  describe('type: string', () => {
    it('should reject non-string value when type is string', () => {
      const schema = {
        body: { name: { type: 'string' } },
      };
      const req = mockReq({ name: 12345 });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('must be a string');
    });

    it('should accept valid string', () => {
      const schema = {
        body: { name: { type: 'string' } },
      };
      const req = mockReq({ name: 'hello' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 4. Validates number type ──

  describe('type: number', () => {
    it('should reject NaN when type is number', () => {
      const schema = {
        body: { count: { type: 'number' } },
      };
      const req = mockReq({ count: 'not-a-number' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('must be a number');
    });

    it('should accept numeric string (coerced via Number())', () => {
      const schema = {
        body: { count: { type: 'number' } },
      };
      const req = mockReq({ count: '42' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should accept actual number value', () => {
      const schema = {
        body: { count: { type: 'number' } },
      };
      const req = mockReq({ count: 7 });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 5. Validates min/max ──

  describe('min/max constraints', () => {
    it('should reject number below min', () => {
      const schema = {
        body: { count: { type: 'number', min: 5 } },
      };
      const req = mockReq({ count: 3 });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('>= 5');
    });

    it('should reject number above max', () => {
      const schema = {
        body: { count: { type: 'number', max: 10 } },
      };
      const req = mockReq({ count: 15 });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('<= 10');
    });

    it('should accept number exactly at min', () => {
      const schema = {
        body: { count: { type: 'number', min: 5 } },
      };
      const req = mockReq({ count: 5 });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should accept number exactly at max', () => {
      const schema = {
        body: { count: { type: 'number', max: 10 } },
      };
      const req = mockReq({ count: 10 });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 6. Validates maxLength / minLength ──

  describe('string length constraints', () => {
    it('should reject string exceeding maxLength', () => {
      const schema = {
        body: { name: { type: 'string', maxLength: 5 } },
      };
      const req = mockReq({ name: 'toolongstring' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('must not exceed 5 characters');
    });

    it('should reject string shorter than minLength', () => {
      const schema = {
        body: { name: { type: 'string', minLength: 3 } },
      };
      const req = mockReq({ name: 'ab' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('at least 3 characters');
    });

    it('should accept string at exactly maxLength', () => {
      const schema = {
        body: { name: { type: 'string', maxLength: 5 } },
      };
      const req = mockReq({ name: 'abcde' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 7. Validates pattern ──

  describe('pattern validation', () => {
    it('should reject string not matching pattern', () => {
      const schema = {
        body: { code: { type: 'string', pattern: /^[A-Z]{3}$/ } },
      };
      const req = mockReq({ code: 'ab1' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('invalid format');
    });

    it('should accept string matching pattern', () => {
      const schema = {
        body: { code: { type: 'string', pattern: /^[A-Z]{3}$/ } },
      };
      const req = mockReq({ code: 'ABC' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 8. Multiple errors ──

  describe('multiple validation errors', () => {
    it('should accumulate all validation errors in a single response', () => {
      const schema = {
        body: {
          name: { type: 'string', required: true },
          count: { type: 'number', min: 1 },
          email: { type: 'string', required: true },
        },
      };
      const req = mockReq({ count: -5 });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      // name required + count < min + email required = 3 errors
      expect(details.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ── 9. Optional fields ──

  describe('optional fields', () => {
    it('should allow missing optional fields', () => {
      const schema = {
        body: {
          name: { type: 'string', required: true },
          nickname: { type: 'string' },
        },
      };
      const req = mockReq({ name: 'Test' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should skip validation when optional value is undefined', () => {
      const schema = {
        body: {
          count: { type: 'number', min: 10 },
        },
      };
      const req = mockReq({});
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 10. Body / query / params validation ──

  describe('all three sources (body, query, params)', () => {
    it('should validate body fields', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
      };
      const req = mockReq({});
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].field).toBe('body.name');
    });

    it('should validate query fields', () => {
      const schema = {
        query: { page: { type: 'number', min: 1 } },
      };
      const req = mockReq({}, { page: 'abc' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].field).toBe('query.page');
    });

    it('should validate params fields', () => {
      const schema = {
        params: { id: { type: 'string', required: true, minLength: 1 } },
      };
      const req = mockReq({}, {}, {});
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].field).toBe('params.id');
    });

    it('should validate across multiple sources simultaneously', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
        query: { page: { type: 'number', min: 1 } },
        params: { id: { type: 'string', required: true } },
      };
      const req = mockReq({}, { page: 0 }, {});
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const details = res.json.mock.calls[0][0].details;
      const fields = details.map((d) => d.field);
      expect(fields).toContain('body.name');
      expect(fields).toContain('params.id');
    });
  });

  // ── 11. Enum validation ──

  describe('enum validation', () => {
    it('should reject value not in enum list', () => {
      const schema = {
        body: { status: { enum: ['active', 'inactive', 'pending'] } },
      };
      const req = mockReq({ status: 'deleted' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('must be one of');
    });

    it('should accept value in enum list', () => {
      const schema = {
        body: { status: { enum: ['active', 'inactive'] } },
      };
      const req = mockReq({ status: 'active' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should coerce value to string for enum comparison', () => {
      const schema = {
        body: { level: { enum: ['1', '2', '3'] } },
      };
      const req = mockReq({ level: 2 });
      const res = mockRes();

      validate(schema)(req, res, next);

      // Number 2 is coerced to String("2") which is in the enum
      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 12. Edge cases ──

  describe('edge cases', () => {
    it('should handle empty body object', () => {
      const schema = {
        body: { optional: { type: 'string' } },
      };
      const req = mockReq({});
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should handle null body (missing source with required field)', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
      };
      const req = { body: null, query: {}, params: {} };
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle undefined body (missing source with required field)', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
      };
      const req = { body: undefined, query: {}, params: {} };
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should skip non-object schema entries gracefully', () => {
      const schema = {
        body: null,
      };
      const req = mockReq({ anything: 'goes' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should use custom label in error messages', () => {
      const schema = {
        body: { name: { type: 'string', required: true, label: 'Preset name' } },
      };
      const req = mockReq({});
      const res = mockRes();

      validate(schema)(req, res, next);

      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('Preset name');
    });
  });

  // ── 13. Boolean type ──

  describe('type: boolean', () => {
    it('should reject non-boolean value in body', () => {
      const schema = {
        body: { active: { type: 'boolean' } },
      };
      const req = mockReq({ active: 'yes' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('must be a boolean');
    });

    it('should accept actual boolean value', () => {
      const schema = {
        body: { active: { type: 'boolean' } },
      };
      const req = mockReq({ active: true });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should coerce "true"/"false" strings in query params', () => {
      const schema = {
        query: { verbose: { type: 'boolean' } },
      };
      const req = mockReq({}, { verbose: 'true' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.query.verbose).toBe(true);
    });

    it('should coerce "false" string in query params to false', () => {
      const schema = {
        query: { verbose: { type: 'boolean' } },
      };
      const req = mockReq({}, { verbose: 'false' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.query.verbose).toBe(false);
    });
  });

  // ── 14. Array type ──

  describe('type: array', () => {
    it('should reject non-array value', () => {
      const schema = {
        body: { items: { type: 'array' } },
      };
      const req = mockReq({ items: 'not-an-array' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('must be an array');
    });

    it('should reject array with too few items (min)', () => {
      const schema = {
        body: { items: { type: 'array', min: 2 } },
      };
      const req = mockReq({ items: ['one'] });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('at least 2 items');
    });

    it('should reject array with too many items (max)', () => {
      const schema = {
        body: { items: { type: 'array', max: 2 } },
      };
      const req = mockReq({ items: ['a', 'b', 'c'] });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('at most 2 items');
    });

    it('should accept valid array within bounds', () => {
      const schema = {
        body: { items: { type: 'array', min: 1, max: 5 } },
      };
      const req = mockReq({ items: ['a', 'b'] });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 15. Object type ──

  describe('type: object', () => {
    it('should reject non-object value', () => {
      const schema = {
        body: { config: { type: 'object' } },
      };
      const req = mockReq({ config: 'string' });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      const details = res.json.mock.calls[0][0].details;
      expect(details[0].message).toContain('must be an object');
    });

    it('should reject array as object type', () => {
      const schema = {
        body: { config: { type: 'object' } },
      };
      const req = mockReq({ config: [1, 2, 3] });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    it('should reject null as object type', () => {
      const schema = {
        body: { config: { type: 'object', required: true } },
      };
      const req = mockReq({ config: null });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid plain object', () => {
      const schema = {
        body: { config: { type: 'object' } },
      };
      const req = mockReq({ config: { key: 'value' } });
      const res = mockRes();

      validate(schema)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  // ── 16. Response structure ──

  describe('error response structure', () => {
    it('should return correct error envelope', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
      };
      const req = mockReq({});
      const res = mockRes();

      validate(schema)(req, res, next);

      const response = res.json.mock.calls[0][0];
      expect(response).toEqual({
        ok: false,
        errorCode: 'MP_VALIDATION_ERROR',
        message: 'Request validation failed',
        details: expect.any(Array),
      });
    });

    it('should include field path and message in each detail', () => {
      const schema = {
        body: { name: { type: 'string', required: true } },
      };
      const req = mockReq({});
      const res = mockRes();

      validate(schema)(req, res, next);

      const detail = res.json.mock.calls[0][0].details[0];
      expect(detail).toHaveProperty('field');
      expect(detail).toHaveProperty('message');
      expect(typeof detail.field).toBe('string');
      expect(typeof detail.message).toBe('string');
    });
  });

  // ── 17. Exported schemas smoke tests ──

  describe('presetSchemas', () => {
    it('should be importable and have expected keys', () => {
      expect(presetSchemas).toBeDefined();
      expect(presetSchemas.create).toBeDefined();
      expect(presetSchemas.update).toBeDefined();
      expect(presetSchemas.byId).toBeDefined();
    });

    it('should validate a valid preset create body', () => {
      const req = mockReq({ name: 'My Preset', order: 5, visibleInWidget: 'true' });
      const res = mockRes();

      validate(presetSchemas.create)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should reject preset byId with missing id param', () => {
      const req = mockReq({}, {}, {});
      const res = mockRes();

      validate(presetSchemas.byId)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('storageSchemas', () => {
    it('should be importable and have expected keys', () => {
      expect(storageSchemas).toBeDefined();
      expect(storageSchemas.createFolder).toBeDefined();
      expect(storageSchemas.rename).toBeDefined();
      expect(storageSchemas.move).toBeDefined();
      expect(storageSchemas.zip).toBeDefined();
    });

    it('should validate a valid createFolder body', () => {
      const req = mockReq({ path: '/uploads/new-folder' });
      const res = mockRes();

      validate(storageSchemas.createFolder)(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('should reject createFolder with missing path', () => {
      const req = mockReq({});
      const res = mockRes();

      validate(storageSchemas.createFolder)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject zip with empty paths array', () => {
      const req = mockReq({ paths: [] });
      const res = mockRes();

      validate(storageSchemas.zip)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
