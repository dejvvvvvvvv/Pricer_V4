import { useRef, useCallback } from 'react';

/**
 * Hook that debounces recalculation triggers.
 *
 * @param {Function} onRecalc - callback(fileId) invoked after debounce
 * @param {Object} opts
 * @param {number} opts.defaultDelay - default debounce (ms), default 500
 * @param {number} opts.sliderDelay  - longer debounce for slider changes (ms), default 800
 */
export default function useDebouncedRecalculation(onRecalc, opts = {}) {
  const { defaultDelay = 500, sliderDelay = 800 } = opts;
  const timerRef = useRef(null);

  const cancel = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const trigger = useCallback(
    (fileId, { delay } = {}) => {
      cancel();
      const ms = delay ?? defaultDelay;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (fileId != null) onRecalc(fileId);
      }, ms);
    },
    [onRecalc, defaultDelay, cancel],
  );

  const triggerSlider = useCallback(
    (fileId) => trigger(fileId, { delay: sliderDelay }),
    [trigger, sliderDelay],
  );

  return { trigger, triggerSlider, cancel };
}
