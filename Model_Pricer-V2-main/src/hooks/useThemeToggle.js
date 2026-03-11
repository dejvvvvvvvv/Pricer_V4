import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'modelpricer:theme';

/**
 * Hook for managing dark/light theme toggle on the calculator page.
 *
 * - Persists user preference in localStorage under 'modelpricer:theme'
 * - Falls back to system preference (prefers-color-scheme) when no saved preference exists
 * - Applies theme via data-theme attribute on a container ref
 * - Does NOT affect global styles — scoped to the calculator page only
 *
 * @param {React.RefObject} containerRef - Ref to the calculator container element
 * @returns {{ theme: 'dark'|'light', toggleTheme: Function, isDark: boolean }}
 */
export function useThemeToggle(containerRef) {
  // Detect system preference
  const getSystemPreference = useCallback(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }, []);

  // Read saved preference or fall back to system
  const getInitialTheme = useCallback(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return getSystemPreference();
  }, [getSystemPreference]);

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply data-theme attribute to container
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;

    if (theme === 'light') {
      el.setAttribute('data-theme', 'light');
    } else {
      el.removeAttribute('data-theme');
    }
  }, [theme, containerRef]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Listen for system preference changes (only when no explicit saved preference)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      // Only auto-switch if user hasn't explicitly chosen
      if (!saved) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };

    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const isDark = theme === 'dark';

  return useMemo(() => ({ theme, toggleTheme, isDark }), [theme, toggleTheme, isDark]);
}

export default useThemeToggle;
