// validatePricingInput.js
// Input validation and sanitization for the pricing pipeline.
// Pure function — no side effects, deterministic output.
//
// Usage:
//   import { validatePricingInput } from '@/lib/pricing/validatePricingInput';
//   const { valid, errors, sanitized } = validatePricingInput(rawInput);
//   // Use sanitized.uploadedFiles, sanitized.printConfigs, etc.

const MAX_QUANTITY = 10000;
const MAX_FILES = 500;

function toFiniteNumber(v, fallback = 0) {
  if (v == null) return fallback;
  const n = typeof v === 'string' && v.trim() === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampNonNegative(v) {
  return Math.max(0, toFiniteNumber(v, 0));
}

/**
 * Sanitize a single file's numeric metrics in result.metrics and result.modelInfo.
 * Returns a shallow-cloned file with sanitized nested objects.
 */
function sanitizeFile(file, index, errors) {
  if (file == null || typeof file !== 'object') {
    errors.push(`files[${index}]: must be an object, got ${typeof file}`);
    return null;
  }

  const f = { ...file };

  // Sanitize result.metrics
  if (f.result && typeof f.result === 'object') {
    f.result = { ...f.result };

    if (f.result.metrics && typeof f.result.metrics === 'object') {
      const m = { ...f.result.metrics };

      if (m.estimatedTimeSeconds != null) {
        const orig = m.estimatedTimeSeconds;
        m.estimatedTimeSeconds = clampNonNegative(orig);
        if (m.estimatedTimeSeconds !== toFiniteNumber(orig, -1)) {
          errors.push(`files[${index}].result.metrics.estimatedTimeSeconds: invalid value "${orig}", clamped to ${m.estimatedTimeSeconds}`);
        }
      }

      if (m.filamentGrams != null) {
        const orig = m.filamentGrams;
        m.filamentGrams = clampNonNegative(orig);
        if (m.filamentGrams !== toFiniteNumber(orig, -1)) {
          errors.push(`files[${index}].result.metrics.filamentGrams: invalid value "${orig}", clamped to ${m.filamentGrams}`);
        }
      }

      if (m.surfaceMm2 != null) {
        m.surfaceMm2 = clampNonNegative(m.surfaceMm2);
      }

      f.result.metrics = m;
    }

    // Sanitize result.modelInfo
    if (f.result.modelInfo && typeof f.result.modelInfo === 'object') {
      const mi = { ...f.result.modelInfo };

      if (mi.volumeMm3 != null) {
        mi.volumeMm3 = clampNonNegative(mi.volumeMm3);
      }

      if (mi.surfaceMm2 != null) {
        mi.surfaceMm2 = clampNonNegative(mi.surfaceMm2);
      }

      f.result.modelInfo = mi;
    }
  }

  return f;
}

/**
 * Sanitize printConfigs — ensure quantity is reasonable and numeric fields are valid.
 */
function sanitizePrintConfigs(configs, errors) {
  if (configs == null || typeof configs !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [key, cfg] of Object.entries(configs)) {
    if (cfg == null || typeof cfg !== 'object') {
      sanitized[key] = {};
      continue;
    }

    const s = { ...cfg };

    // Quantity: must be integer >= 1, capped at MAX_QUANTITY
    if (s.quantity != null) {
      const raw = s.quantity;
      s.quantity = Math.max(1, Math.round(toFiniteNumber(raw, 1)));

      if (s.quantity > MAX_QUANTITY) {
        errors.push(`printConfigs["${key}"].quantity: ${raw} exceeds maximum (${MAX_QUANTITY}), capped`);
        s.quantity = MAX_QUANTITY;
      }

      if (toFiniteNumber(raw, 1) < 1) {
        errors.push(`printConfigs["${key}"].quantity: invalid value "${raw}", defaulted to 1`);
      }
    }

    // Infill: clamp to 0-100 if present
    if (s.infill != null) {
      const raw = s.infill;
      const n = toFiniteNumber(raw, 0);
      s.infill = Math.max(0, Math.min(100, n));
      if (s.infill !== n) {
        errors.push(`printConfigs["${key}"].infill: value "${raw}" clamped to ${s.infill}`);
      }
    }

    sanitized[key] = s;
  }

  return sanitized;
}

/**
 * Validates and sanitizes pricing input before it enters the calculation pipeline.
 *
 * This function does NOT modify the original input — it returns a new sanitized copy.
 * The pricing engine (pricingEngineV3.js) already has internal guards (safeNum, clampMin0),
 * but this pre-validation catches issues earlier and provides clear error messages.
 *
 * @param {object} input - The raw input object for calculateOrderQuote
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
export function validatePricingInput(input) {
  const errors = [];

  if (input == null || typeof input !== 'object') {
    return {
      valid: false,
      errors: ['input must be a non-null object'],
      sanitized: {
        uploadedFiles: [],
        printConfigs: {},
      },
    };
  }

  const sanitized = { ...input };

  // --- Validate uploadedFiles ---
  if (!Array.isArray(input.uploadedFiles)) {
    if (input.uploadedFiles != null) {
      errors.push('uploadedFiles must be an array');
    }
    sanitized.uploadedFiles = [];
  } else {
    if (input.uploadedFiles.length > MAX_FILES) {
      errors.push(`uploadedFiles has ${input.uploadedFiles.length} items, exceeds maximum (${MAX_FILES})`);
    }

    const files = input.uploadedFiles.slice(0, MAX_FILES);
    const sanitizedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const sf = sanitizeFile(files[i], i, errors);
      if (sf !== null) {
        sanitizedFiles.push(sf);
      }
    }

    sanitized.uploadedFiles = sanitizedFiles;
  }

  // --- Validate printConfigs ---
  sanitized.printConfigs = sanitizePrintConfigs(input.printConfigs, errors);

  // --- Validate pricingConfig (lightweight — engine does deep normalization) ---
  if (input.pricingConfig != null && typeof input.pricingConfig !== 'object') {
    errors.push('pricingConfig must be an object');
    sanitized.pricingConfig = {};
  }

  // --- Validate feesConfig ---
  if (input.feesConfig != null && typeof input.feesConfig !== 'object') {
    errors.push('feesConfig must be an object');
    sanitized.feesConfig = {};
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}
