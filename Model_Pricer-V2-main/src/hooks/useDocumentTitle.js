import { useEffect } from 'react';

/**
 * Sets document.title with optional suffix.
 * Restores the previous title on unmount.
 *
 * @param {string} title - Page title (e.g. 'Pricing Plans')
 * @param {string} [suffix='ModelPricer'] - Suffix appended after ' | '
 */
export function useDocumentTitle(title, suffix = 'ModelPricer') {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | ${suffix}` : suffix;
    return () => { document.title = prev; };
  }, [title, suffix]);
}
