import { describe, it, expect } from 'vitest';
import { validatePricingInput } from '@/lib/pricing/validatePricingInput.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeValidFile({ id = 'file-0', estimatedTimeSeconds = 3600, filamentGrams = 50, volumeMm3 = 5000 } = {}) {
  return {
    id,
    name: 'test.stl',
    status: 'done',
    result: {
      metrics: { estimatedTimeSeconds, filamentGrams },
      modelInfo: { volumeMm3, sizeMm: { x: 20, y: 20, z: 20 } },
    },
  };
}

function makeValidInput(overrides = {}) {
  return {
    uploadedFiles: [makeValidFile()],
    printConfigs: { 'file-0': { quantity: 2, material: 'pla', quality: 'normal', infill: 20 } },
    pricingConfig: { rate_per_hour: 120, materials: [{ key: 'pla', price_per_gram: 0.5 }] },
    feesConfig: { fees: [] },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validatePricingInput', () => {
  // 1. Valid input passes through unchanged
  it('returns valid=true and no errors for well-formed input', () => {
    const input = makeValidInput();
    const { valid, errors, sanitized } = validatePricingInput(input);

    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
    expect(sanitized.uploadedFiles).toHaveLength(1);
    expect(sanitized.uploadedFiles[0].result.metrics.filamentGrams).toBe(50);
    expect(sanitized.printConfigs['file-0'].quantity).toBe(2);
  });

  // 2. Missing files -> empty array
  it('defaults uploadedFiles to empty array when missing', () => {
    const { valid, errors, sanitized } = validatePricingInput({
      printConfigs: {},
      pricingConfig: {},
    });

    expect(sanitized.uploadedFiles).toEqual([]);
    // No error for missing (only for non-array truthy value)
    expect(errors).toHaveLength(0);
  });

  it('reports error when uploadedFiles is not an array', () => {
    const { valid, errors, sanitized } = validatePricingInput({
      uploadedFiles: 'not-an-array',
      printConfigs: {},
    });

    expect(valid).toBe(false);
    expect(errors).toContain('uploadedFiles must be an array');
    expect(sanitized.uploadedFiles).toEqual([]);
  });

  // 3. Negative weight/metrics -> clamped to 0
  it('clamps negative filamentGrams to 0', () => {
    const input = makeValidInput({
      uploadedFiles: [makeValidFile({ filamentGrams: -10 })],
    });

    const { errors, sanitized } = validatePricingInput(input);

    expect(sanitized.uploadedFiles[0].result.metrics.filamentGrams).toBe(0);
    expect(errors.some(e => e.includes('filamentGrams'))).toBe(true);
  });

  it('clamps negative estimatedTimeSeconds to 0', () => {
    const input = makeValidInput({
      uploadedFiles: [makeValidFile({ estimatedTimeSeconds: -100 })],
    });

    const { errors, sanitized } = validatePricingInput(input);

    expect(sanitized.uploadedFiles[0].result.metrics.estimatedTimeSeconds).toBe(0);
    expect(errors.some(e => e.includes('estimatedTimeSeconds'))).toBe(true);
  });

  // 4. String values -> converted to numbers
  it('converts string metric values to numbers', () => {
    const file = makeValidFile();
    file.result.metrics.filamentGrams = '42.5';
    file.result.metrics.estimatedTimeSeconds = '1800';

    const input = makeValidInput({ uploadedFiles: [file] });
    const { sanitized } = validatePricingInput(input);

    expect(sanitized.uploadedFiles[0].result.metrics.filamentGrams).toBe(42.5);
    expect(sanitized.uploadedFiles[0].result.metrics.estimatedTimeSeconds).toBe(1800);
  });

  // 5. NaN values -> default to 0
  it('converts NaN metric values to 0', () => {
    const file = makeValidFile();
    file.result.metrics.filamentGrams = 'not-a-number';
    file.result.metrics.estimatedTimeSeconds = NaN;

    const input = makeValidInput({ uploadedFiles: [file] });
    const { errors, sanitized } = validatePricingInput(input);

    expect(sanitized.uploadedFiles[0].result.metrics.filamentGrams).toBe(0);
    expect(sanitized.uploadedFiles[0].result.metrics.estimatedTimeSeconds).toBe(0);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  // 6. Quantity 0 -> becomes 1
  it('clamps quantity of 0 to 1', () => {
    const input = makeValidInput({
      printConfigs: { 'file-0': { quantity: 0 } },
    });

    const { errors, sanitized } = validatePricingInput(input);

    expect(sanitized.printConfigs['file-0'].quantity).toBe(1);
    expect(errors.some(e => e.includes('quantity'))).toBe(true);
  });

  it('clamps negative quantity to 1', () => {
    const input = makeValidInput({
      printConfigs: { 'file-0': { quantity: -5 } },
    });

    const { sanitized } = validatePricingInput(input);

    expect(sanitized.printConfigs['file-0'].quantity).toBe(1);
  });

  // 7. Quantity > 10000 -> capped
  it('caps quantity at 10000', () => {
    const input = makeValidInput({
      printConfigs: { 'file-0': { quantity: 99999 } },
    });

    const { valid, errors, sanitized } = validatePricingInput(input);

    expect(valid).toBe(false);
    expect(sanitized.printConfigs['file-0'].quantity).toBe(10000);
    expect(errors.some(e => e.includes('exceeds maximum'))).toBe(true);
  });

  // 8. Null/undefined input handling
  it('handles null input gracefully', () => {
    const { valid, errors, sanitized } = validatePricingInput(null);

    expect(valid).toBe(false);
    expect(errors).toContain('input must be a non-null object');
    expect(sanitized.uploadedFiles).toEqual([]);
    expect(sanitized.printConfigs).toEqual({});
  });

  it('handles undefined input gracefully', () => {
    const { valid, errors, sanitized } = validatePricingInput(undefined);

    expect(valid).toBe(false);
    expect(errors).toContain('input must be a non-null object');
  });

  // 9. Multiple errors accumulated
  it('accumulates multiple errors from different sources', () => {
    const file = makeValidFile();
    file.result.metrics.filamentGrams = 'bad';
    file.result.metrics.estimatedTimeSeconds = -50;

    const input = {
      uploadedFiles: [file],
      printConfigs: { 'file-0': { quantity: 50000 } },
      pricingConfig: 'invalid',
      feesConfig: 42,
    };

    const { valid, errors } = validatePricingInput(input);

    expect(valid).toBe(false);
    // Should have errors for: filamentGrams (NaN), estimatedTimeSeconds (negative),
    // quantity (>10000), pricingConfig (not object), feesConfig (not object)
    expect(errors.length).toBeGreaterThanOrEqual(4);
  });

  // Additional edge cases

  it('handles file with no result object', () => {
    const input = makeValidInput({
      uploadedFiles: [{ id: 'f1', name: 'test.stl', status: 'done' }],
    });

    const { valid, sanitized } = validatePricingInput(input);

    // Should pass through — engine handles missing result internally
    expect(sanitized.uploadedFiles).toHaveLength(1);
    expect(sanitized.uploadedFiles[0].id).toBe('f1');
  });

  it('filters out null files from array', () => {
    const input = makeValidInput({
      uploadedFiles: [makeValidFile(), null, makeValidFile({ id: 'file-1' })],
    });

    const { errors, sanitized } = validatePricingInput(input);

    expect(sanitized.uploadedFiles).toHaveLength(2);
    expect(errors.some(e => e.includes('files[1]'))).toBe(true);
  });

  it('handles empty printConfigs gracefully', () => {
    const input = makeValidInput({ printConfigs: null });
    const { sanitized } = validatePricingInput(input);

    expect(sanitized.printConfigs).toEqual({});
  });

  it('clamps infill to 0-100 range', () => {
    const input = makeValidInput({
      printConfigs: { 'file-0': { quantity: 1, infill: 150 } },
    });

    const { errors, sanitized } = validatePricingInput(input);

    expect(sanitized.printConfigs['file-0'].infill).toBe(100);
    expect(errors.some(e => e.includes('infill'))).toBe(true);
  });

  it('handles negative infill', () => {
    const input = makeValidInput({
      printConfigs: { 'file-0': { quantity: 1, infill: -10 } },
    });

    const { sanitized } = validatePricingInput(input);

    expect(sanitized.printConfigs['file-0'].infill).toBe(0);
  });

  it('clamps negative volumeMm3 in modelInfo to 0', () => {
    const file = makeValidFile({ volumeMm3: -500 });

    const input = makeValidInput({ uploadedFiles: [file] });
    const { sanitized } = validatePricingInput(input);

    expect(sanitized.uploadedFiles[0].result.modelInfo.volumeMm3).toBe(0);
  });

  it('does not mutate the original input object', () => {
    const file = makeValidFile({ filamentGrams: -10 });
    const input = makeValidInput({ uploadedFiles: [file] });
    const originalGrams = input.uploadedFiles[0].result.metrics.filamentGrams;

    validatePricingInput(input);

    // Original should be untouched
    expect(input.uploadedFiles[0].result.metrics.filamentGrams).toBe(originalGrams);
  });

  it('rounds fractional quantity to nearest integer', () => {
    const input = makeValidInput({
      printConfigs: { 'file-0': { quantity: 3.7 } },
    });

    const { sanitized } = validatePricingInput(input);

    expect(sanitized.printConfigs['file-0'].quantity).toBe(4);
  });

  it('converts string quantity to number', () => {
    const input = makeValidInput({
      printConfigs: { 'file-0': { quantity: '5' } },
    });

    const { sanitized } = validatePricingInput(input);

    expect(sanitized.printConfigs['file-0'].quantity).toBe(5);
  });

  it('caps file count at MAX_FILES (500)', () => {
    const files = Array.from({ length: 600 }, (_, i) => makeValidFile({ id: `file-${i}` }));
    const input = makeValidInput({ uploadedFiles: files });

    const { errors, sanitized } = validatePricingInput(input);

    expect(sanitized.uploadedFiles).toHaveLength(500);
    expect(errors.some(e => e.includes('exceeds maximum (500)'))).toBe(true);
  });
});
