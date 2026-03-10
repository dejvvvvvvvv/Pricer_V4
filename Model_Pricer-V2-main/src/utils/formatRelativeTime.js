/**
 * Format a date as a relative time string (e.g., "2 hours ago", "yesterday").
 * Supports Czech (cs) and English (en).
 *
 * @param {Date|string|number} date - The date to format (ISO string, timestamp, or Date object)
 * @param {string} [lang='en'] - Language code ('cs' or 'en')
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date, lang = 'en') {
  const now = Date.now();
  const then = new Date(date).getTime();

  if (isNaN(then)) {
    return lang === 'cs' ? 'Nezname datum' : 'Unknown date';
  }

  const diffMs = now - then;

  // Future dates — show absolute date
  if (diffMs < 0) {
    return new Date(then).toLocaleDateString(lang === 'cs' ? 'cs-CZ' : 'en-US');
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (lang === 'cs') {
    if (diffSec < 60) return 'Prave ted';
    if (diffMin === 1) return 'Pred 1 min';
    if (diffMin < 60) return `Pred ${diffMin} min`;
    if (diffHour === 1) return 'Pred 1 hod';
    if (diffHour < 24) return `Pred ${diffHour} hod`;
    if (diffDay === 1) return 'Vcera';
    if (diffDay < 7) return `Pred ${diffDay} dny`;
    if (diffWeek === 1) return 'Pred 1 tydnem';
    if (diffDay < 30) return `Pred ${diffWeek} tydny`;
    return new Date(then).toLocaleDateString('cs-CZ');
  }

  // English
  if (diffSec < 60) return 'Just now';
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour === 1) return '1 hour ago';
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffWeek === 1) return '1 week ago';
  if (diffDay < 30) return `${diffWeek} weeks ago`;
  return new Date(then).toLocaleDateString('en-US');
}
