/**
 * Request validation middleware for ModelPricer backend API.
 *
 * Validates req.body, req.query, and req.params against a declarative schema.
 * Returns MP_VALIDATION_ERROR (400) with details array on failure.
 *
 * @module middleware/validate
 *
 * @example
 * import { validate } from './middleware/validate.js';
 *
 * app.post('/api/example', validate({
 *   body: {
 *     name:  { type: 'string', required: true, maxLength: 200 },
 *     count: { type: 'number', min: 1, max: 100 },
 *   },
 *   query: {
 *     page: { type: 'number', min: 1 },
 *   },
 * }), handler);
 */

/**
 * Creates a validation middleware from a schema definition.
 *
 * @param {{ body?: Record<string, FieldRules>, query?: Record<string, FieldRules>, params?: Record<string, FieldRules> }} schema
 *   Schema object. Each key is a request source (body/query/params).
 *   Values are objects mapping field names to validation rules.
 *
 * @typedef {Object} FieldRules
 * @property {'string'|'number'|'boolean'|'array'|'object'} [type] — Expected type
 * @property {boolean} [required] — Field must be present and non-empty
 * @property {number} [min] — Minimum value (number type) or minimum length (string type)
 * @property {number} [max] — Maximum value (number type) or maximum array length (array type)
 * @property {number} [maxLength] — Maximum string length
 * @property {number} [minLength] — Minimum string length
 * @property {RegExp} [pattern] — Regex pattern the string value must match
 * @property {string[]} [enum] — Allowed values (whitelist)
 * @property {string} [label] — Human-readable field name for error messages
 *
 * @returns {import('express').RequestHandler}
 */
export function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [source, fields] of Object.entries(schema)) {
      if (!fields || typeof fields !== "object") continue;

      const data = req[source];
      if (!data && source !== "params") {
        // If the entire source is missing and any field is required, flag it
        for (const [field, rules] of Object.entries(fields)) {
          if (rules.required) {
            const label = rules.label || `${source}.${field}`;
            errors.push({ field: `${source}.${field}`, message: `${label} is required` });
          }
        }
        continue;
      }

      for (const [field, rules] of Object.entries(fields)) {
        const value = data?.[field];
        const label = rules.label || `${source}.${field}`;

        // ── Required check ──
        if (rules.required && (value === undefined || value === null || value === "")) {
          errors.push({ field: `${source}.${field}`, message: `${label} is required` });
          continue;
        }

        // Skip further checks if value is absent and not required
        if (value === undefined || value === null) continue;

        // ── Type: number ──
        if (rules.type === "number") {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push({ field: `${source}.${field}`, message: `${label} must be a number` });
            continue;
          }
          if (rules.min !== undefined && num < rules.min) {
            errors.push({ field: `${source}.${field}`, message: `${label} must be >= ${rules.min}` });
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push({ field: `${source}.${field}`, message: `${label} must be <= ${rules.max}` });
          }
        }

        // ── Type: string ──
        if (rules.type === "string") {
          if (typeof value !== "string") {
            errors.push({ field: `${source}.${field}`, message: `${label} must be a string` });
            continue;
          }
          if (rules.minLength !== undefined && value.length < rules.minLength) {
            errors.push({ field: `${source}.${field}`, message: `${label} must be at least ${rules.minLength} characters` });
          }
          if (rules.maxLength !== undefined && value.length > rules.maxLength) {
            errors.push({ field: `${source}.${field}`, message: `${label} must not exceed ${rules.maxLength} characters` });
          }
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push({ field: `${source}.${field}`, message: `${label} has invalid format` });
          }
        }

        // ── Type: boolean ──
        if (rules.type === "boolean" && typeof value !== "boolean") {
          // Allow string "true"/"false" from query params
          if (source === "query" && (value === "true" || value === "false")) {
            // Coerce for downstream use
            req[source][field] = value === "true";
          } else {
            errors.push({ field: `${source}.${field}`, message: `${label} must be a boolean` });
          }
        }

        // ── Type: array ──
        if (rules.type === "array") {
          if (!Array.isArray(value)) {
            errors.push({ field: `${source}.${field}`, message: `${label} must be an array` });
            continue;
          }
          if (rules.min !== undefined && value.length < rules.min) {
            errors.push({ field: `${source}.${field}`, message: `${label} must have at least ${rules.min} items` });
          }
          if (rules.max !== undefined && value.length > rules.max) {
            errors.push({ field: `${source}.${field}`, message: `${label} must have at most ${rules.max} items` });
          }
        }

        // ── Type: object ──
        if (rules.type === "object" && (typeof value !== "object" || Array.isArray(value) || value === null)) {
          errors.push({ field: `${source}.${field}`, message: `${label} must be an object` });
        }

        // ── Enum (whitelist) ──
        if (rules.enum && !rules.enum.includes(String(value))) {
          errors.push({
            field: `${source}.${field}`,
            message: `${label} must be one of: ${rules.enum.join(", ")}`,
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        errorCode: "MP_VALIDATION_ERROR",
        message: "Request validation failed",
        details: errors,
      });
    }

    next();
  };
}

/**
 * Preset validation schemas — reusable across preset endpoints.
 */
export const presetSchemas = {
  /** POST /api/presets — create preset (body fields from multipart) */
  create: {
    body: {
      name: { type: "string", maxLength: 200, label: "Preset name" },
      order: { type: "number", min: 0, max: 10000, label: "Sort order" },
      visibleInWidget: { type: "string", label: "Widget visibility" },
    },
  },

  /** PATCH /api/presets/:id — update preset metadata */
  update: {
    params: {
      id: { type: "string", required: true, minLength: 1, maxLength: 100, label: "Preset ID" },
    },
  },

  /** DELETE /api/presets/:id, POST /api/presets/:id/default */
  byId: {
    params: {
      id: { type: "string", required: true, minLength: 1, maxLength: 100, label: "Preset ID" },
    },
  },
};

/**
 * Storage validation schemas.
 */
export const storageSchemas = {
  /** POST /api/storage/folder */
  createFolder: {
    body: {
      path: { type: "string", required: true, minLength: 1, maxLength: 500, label: "Folder path" },
    },
  },

  /** POST /api/storage/rename */
  rename: {
    body: {
      path: { type: "string", required: true, minLength: 1, maxLength: 500, label: "Item path" },
      newName: { type: "string", required: true, minLength: 1, maxLength: 255, label: "New name" },
    },
  },

  /** POST /api/storage/move */
  move: {
    body: {
      path: { type: "string", required: true, minLength: 1, maxLength: 500, label: "Source path" },
      destination: { type: "string", required: true, minLength: 1, maxLength: 500, label: "Destination" },
    },
  },

  /** POST /api/storage/restore */
  restore: {
    body: {
      trashPath: { type: "string", required: true, minLength: 1, maxLength: 500, label: "Trash path" },
    },
  },

  /** DELETE /api/storage/file */
  deleteFile: {
    body: {
      path: { type: "string", required: true, minLength: 1, maxLength: 500, label: "File path" },
    },
  },

  /** POST /api/storage/zip */
  zip: {
    body: {
      paths: { type: "array", required: true, min: 1, max: 100, label: "File paths" },
    },
  },

  /** GET /api/storage/search */
  search: {
    query: {
      q: { type: "string", maxLength: 200, label: "Search query" },
    },
  },

  /** GET /api/storage/file, GET /api/storage/file/preview */
  filePath: {
    query: {
      path: { type: "string", required: true, minLength: 1, maxLength: 500, label: "File path" },
    },
  },
};
