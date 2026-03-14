/**
 * formatters.js — Centralni utility funkce pro formatovani
 *
 * Pouzivej tyto funkce misto lokalnich duplikatu.
 * Import: import { formatMoney, formatTime, ... } from '@/utils/formatters';
 */

import { round2 } from './adminOrdersStorage';

// ─── Mena ────────────────────────────────────────────────────────────────────

/**
 * Formatuje castku na string s menou.
 * @param {number|string} amount
 * @param {string} currency - 'CZK' (default) nebo jiny symbol
 * @returns {string} napr. "1 234.50 Kc"
 */
export function formatMoney(amount, currency = 'CZK') {
  const val = round2(amount);
  if (currency === 'CZK') {
    return `${val.toFixed(2)} Kc`;
  }
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(val);
  } catch {
    return `${val.toFixed(2)} ${currency}`;
  }
}

/**
 * Formatuje castku na cely pocet bez desetinnych mist (pro kompaktni zobrazeni).
 * @param {number|string} amount
 * @returns {string} napr. "1234 Kc"
 */
export function formatMoneyInt(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0 Kc';
  return `${Math.round(n)} Kc`;
}

// ─── Cas (minuty) ─────────────────────────────────────────────────────────────

/**
 * Formatuje cas v minutach na human-readable string.
 * @param {number|string} min - pocet minut
 * @returns {string} napr. "2h 15m" nebo "45 min"
 */
export function formatTime(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} min`;
  return `${h}h ${r}m`;
}

// ─── Datum a datum+cas ────────────────────────────────────────────────────────

/**
 * Formatuje ISO datum+cas na lokalizovany string.
 * @param {string|Date} iso - ISO string nebo Date objekt
 * @param {string} locale - locale string (default: 'cs-CZ')
 * @returns {string} napr. "15.03.2026 14:30"
 */
export function formatDateTime(iso, locale = 'cs-CZ') {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

/**
 * Formatuje ISO datum (bez casu) na lokalizovany string.
 * @param {string|Date} iso - ISO string nebo Date objekt
 * @param {string} locale - locale string (default: 'cs-CZ')
 * @returns {string} napr. "15.03.2026"
 */
export function formatDate(iso, locale = 'cs-CZ') {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return String(iso) || '--';
  }
}

/**
 * Formatuje cas z data (jen hodiny:minuty).
 * @param {string|Date} date
 * @param {string} locale
 * @returns {string} napr. "14:30"
 */
export function formatTimeShort(date, locale = 'cs-CZ') {
  if (!date) return '--';
  try {
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
}

// ─── Relativni cas ───────────────────────────────────────────────────────────

/**
 * Formatuje timestamp na relativni cesky cas ("pred 5 min", "vcera", atd.).
 * @param {number|string|Date} timestamp - ms timestamp, ISO string nebo Date
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  const ts = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const now = Date.now();
  const diff = now - ts;

  if (diff < 0) return 'prave ted';

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'prave ted';

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return 'pred 1 min';
  if (minutes < 60) return `pred ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'pred 1 hodinou';
  if (hours < 24) return `pred ${hours} hod`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'vcera';
  if (days < 7) return `pred ${days} dny`;
  if (days < 30) return `pred ${Math.floor(days / 7)} tydny`;

  const d = new Date(ts);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

// ─── Velikost souboru ─────────────────────────────────────────────────────────

/**
 * Formatuje velikost v bajtech na human-readable string.
 * @param {number} bytes
 * @returns {string} napr. "1.5 MB", "256 KB", "512 B"
 */
export function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── Bezpecna konverze cisla ──────────────────────────────────────────────────

/**
 * Bezpecne prevede hodnotu na cislo — vraci fallback kdyz neni konverze mozna.
 * Pouzivej pro vstupy z formularu a externiho JSON.
 * @param {*} val - vstupni hodnota
 * @param {number} fallback - default 0
 * @param {number|undefined} min - volitelne minimum (clamp)
 * @param {number|undefined} max - volitelne maximum (clamp)
 * @returns {number}
 */
export function safeNum(val, fallback = 0, min, max) {
  const raw = typeof val === 'string' && val.trim() === '' ? NaN : Number(val);
  let n = Number.isFinite(raw) ? raw : fallback;
  if (min !== undefined && n < min) n = min;
  if (max !== undefined && n > max) n = max;
  return n;
}
