import { useEffect, useRef, useCallback } from 'react';

/**
 * URL parameter keys for calculator configuration sharing.
 * Only configuration values are encoded — never file data.
 */
const PARAM_KEYS = {
  material: 'material',
  quality: 'quality',
  infill: 'infill',
  supports: 'supports',
  quantity: 'quantity',
  color: 'color',
};

/**
 * Parse URL search params into a partial print configuration object.
 * Invalid or missing values are silently ignored (returns only valid keys).
 *
 * @returns {Object|null} Partial config or null if no valid params found.
 */
export function parseUrlConfig() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return null;

    const config = {};
    let hasAny = false;

    // material — string, lowercase
    const material = params.get(PARAM_KEYS.material);
    if (material && typeof material === 'string' && material.trim()) {
      config.material = material.trim().toLowerCase();
      hasAny = true;
    }

    // quality — string (e.g. 'standard', 'detail', 'draft' or numeric like '0.2')
    const quality = params.get(PARAM_KEYS.quality);
    if (quality && typeof quality === 'string' && quality.trim()) {
      config.quality = quality.trim().toLowerCase();
      hasAny = true;
    }

    // infill — integer 0-100
    const infillRaw = params.get(PARAM_KEYS.infill);
    if (infillRaw != null) {
      const infill = parseInt(infillRaw, 10);
      if (Number.isFinite(infill) && infill >= 0 && infill <= 100) {
        config.infill = infill;
        hasAny = true;
      }
    }

    // supports — boolean
    const supportsRaw = params.get(PARAM_KEYS.supports);
    if (supportsRaw != null) {
      config.supports = supportsRaw === 'true' || supportsRaw === '1';
      hasAny = true;
    }

    // quantity — positive integer
    const quantityRaw = params.get(PARAM_KEYS.quantity);
    if (quantityRaw != null) {
      const quantity = parseInt(quantityRaw, 10);
      if (Number.isFinite(quantity) && quantity >= 1 && quantity <= 9999) {
        config.quantity = quantity;
        hasAny = true;
      }
    }

    // color — string
    const color = params.get(PARAM_KEYS.color);
    if (color && typeof color === 'string' && color.trim()) {
      config.color = color.trim();
      hasAny = true;
    }

    return hasAny ? config : null;
  } catch {
    return null;
  }
}

/**
 * Build a shareable URL with the given config encoded as search params.
 *
 * @param {Object} config - Print configuration object.
 * @returns {string} Full URL with search params.
 */
export function buildShareableUrl(config) {
  const url = new URL(window.location.href);
  // Clear existing config params
  Object.values(PARAM_KEYS).forEach(k => url.searchParams.delete(k));

  if (config) {
    if (config.material) url.searchParams.set(PARAM_KEYS.material, config.material);
    if (config.quality) url.searchParams.set(PARAM_KEYS.quality, config.quality);
    if (config.infill != null) url.searchParams.set(PARAM_KEYS.infill, String(config.infill));
    if (config.supports != null) url.searchParams.set(PARAM_KEYS.supports, String(config.supports));
    if (config.quantity != null && config.quantity > 1) url.searchParams.set(PARAM_KEYS.quantity, String(config.quantity));
    if (config.color) url.searchParams.set(PARAM_KEYS.color, config.color);
  }

  return url.toString();
}

/**
 * Hook that syncs calculator configuration to/from URL search params.
 *
 * - On mount: reads URL params and returns initial config override (if any).
 * - On config change: debounced replaceState update (no history pollution).
 * - Provides `getShareableUrl()` for the share button.
 *
 * @param {Object} currentConfig - Current print config for the selected model.
 * @param {Object} [options]
 * @param {number} [options.debounceMs=300] - Debounce delay for URL updates.
 * @param {boolean} [options.enabled=true] - Whether to sync to URL.
 * @returns {{
 *   initialUrlConfig: Object|null,
 *   getShareableUrl: () => string,
 * }}
 */
export function useUrlState(currentConfig, options = {}) {
  const { debounceMs = 300, enabled = true } = options;
  const timerRef = useRef(null);
  const initialRef = useRef(null);
  const hasReadInitial = useRef(false);

  // Read URL params once on first call
  if (!hasReadInitial.current) {
    hasReadInitial.current = true;
    initialRef.current = parseUrlConfig();
  }

  // Debounced URL update via replaceState
  useEffect(() => {
    if (!enabled || !currentConfig) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      try {
        const newUrl = buildShareableUrl(currentConfig);
        if (newUrl !== window.location.href) {
          window.history.replaceState(null, '', newUrl);
        }
      } catch {
        // Silently ignore replaceState errors
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentConfig, debounceMs, enabled]);

  const getShareableUrl = useCallback(() => {
    return buildShareableUrl(currentConfig);
  }, [currentConfig]);

  return {
    initialUrlConfig: initialRef.current,
    getShareableUrl,
  };
}

export default useUrlState;
