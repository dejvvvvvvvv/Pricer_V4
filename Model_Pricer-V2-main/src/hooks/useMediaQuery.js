import { useState, useEffect } from 'react';

/**
 * Hook for responsive media queries.
 * Uses window.matchMedia for efficient, event-driven breakpoint detection
 * instead of resize listeners with manual width checks.
 *
 * @param {string} query - CSS media query string, e.g. '(max-width: 768px)'
 * @returns {boolean} Whether the media query currently matches
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);

    // Sync state in case it changed between render and effect
    setMatches(mql.matches);

    const handler = (e) => setMatches(e.matches);

    // Modern API (Safari 14+, all other evergreen browsers)
    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    // Legacy fallback (Safari 13 and older)
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [query]);

  return matches;
}

// Convenience hooks matching common breakpoints
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');
