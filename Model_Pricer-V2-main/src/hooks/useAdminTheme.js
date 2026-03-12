import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'modelpricer:admin:theme';

/**
 * Hook for managing dark/light theme toggle in the admin panel.
 *
 * - Persists user preference in localStorage under 'modelpricer:admin:theme'
 * - Falls back to system preference (prefers-color-scheme) when no saved preference exists
 * - Applies theme via data-theme attribute on a provided container ref
 * - Separate from calculator theme (useThemeToggle) — independent storage key and scope
 *
 * @param {React.RefObject} containerRef - Ref to the admin layout root element
 * @returns {{ theme: 'dark'|'light', toggleTheme: Function, isDark: boolean }}
 */
export function useAdminTheme(containerRef) {
  const getSystemPreference = useCallback(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }, []);

  const getInitialTheme = useCallback(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return getSystemPreference();
  }, [getSystemPreference]);

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply data-theme attribute to the admin root container
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
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore */ }
  }, [theme]);

  // Listen for system preference changes when no explicit saved preference
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
          setTheme(e.matches ? 'light' : 'dark');
        }
      } catch { /* ignore */ }
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

export default useAdminTheme;
