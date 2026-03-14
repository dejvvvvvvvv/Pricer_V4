/**
 * Admin Notification Storage — tenant-scoped persistent notifications.
 *
 * Stores up to MAX_NOTIFICATIONS in localStorage under
 * `modelpricer:${tenantId}:notifications`.
 *
 * Each notification: { id, type, title, description, timestamp, read }
 * Types: 'order' | 'slicing' | 'config' | 'storage' | 'info' | 'error'
 *
 * Preferences stored under `modelpricer:${tenantId}:notification-prefs:v1`:
 * { enabledTypes: { order, slicing, config, storage, info, error }, soundEnabled }
 */

import { getTenantId, readTenantJson, writeTenantJson } from './adminTenantStorage';
import { debug } from '@/lib/debug';

const NAMESPACE = 'notifications';
const PREFS_NAMESPACE = 'notification-prefs:v1';
const MAX_NOTIFICATIONS = 50;

/** Custom event name dispatched after any write to notifications storage. */
export const NOTIFICATION_UPDATED_EVENT = 'notification-storage-updated';

/** Dispatch update event so NotificationCenter can react without polling. */
function dispatchUpdate() {
  try {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_UPDATED_EVENT));
  } catch { /* SSR guard */ }
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

/** Default notification preferences. */
const DEFAULT_PREFS = {
  enabledTypes: {
    order: true,
    slicing: true,
    config: true,
    storage: true,
    info: true,
    error: true,
  },
  soundEnabled: true,
};

/**
 * Read notification preferences (merged with defaults).
 */
export function getNotificationPrefs(tenantIdOverride) {
  const parsed = readTenantJson(PREFS_NAMESPACE, null, tenantIdOverride);
  if (!parsed) return { ...DEFAULT_PREFS, enabledTypes: { ...DEFAULT_PREFS.enabledTypes } };
  return {
    enabledTypes: { ...DEFAULT_PREFS.enabledTypes, ...(parsed.enabledTypes || {}) },
    soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : DEFAULT_PREFS.soundEnabled,
  };
}

/**
 * Save notification preferences.
 */
export function saveNotificationPrefs(prefs, tenantIdOverride) {
  writeTenantJson(PREFS_NAMESPACE, prefs, tenantIdOverride);
}

// ---------------------------------------------------------------------------
// Sound — Web Audio API beep (no external files)
// ---------------------------------------------------------------------------

let _audioCtx = null;

/**
 * Play a short system-like notification beep via Web Audio API.
 * Safe to call multiple times; creates AudioContext lazily.
 */
export function playNotificationSound() {
  try {
    if (!_audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      _audioCtx = new AudioCtx();
    }
    const ctx = _audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);       // A5
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.08); // C6
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // Silently ignore — browsers may block audio before user gesture
  }
}

// ---------------------------------------------------------------------------
// Notifications CRUD
// ---------------------------------------------------------------------------

/**
 * Read all notifications (newest first).
 */
export function getNotifications(tenantIdOverride) {
  const data = readTenantJson(NAMESPACE, [], tenantIdOverride);
  return Array.isArray(data) ? data : [];
}

/**
 * Write notifications array to storage and dispatch update event.
 */
function writeNotifications(notifications, tenantIdOverride) {
  writeTenantJson(NAMESPACE, notifications, tenantIdOverride);
  dispatchUpdate();
}

/**
 * Add a new notification. Returns the new notification object.
 * Respects notification preferences — if the type is disabled, returns null.
 * Plays sound if enabled in preferences.
 *
 * @param {{ type: string, title: string, description?: string }} data
 */
export function addNotification(data, tenantIdOverride) {
  const prefs = getNotificationPrefs(tenantIdOverride);
  const type = data.type || 'info';

  // Check if this notification type is enabled
  if (prefs.enabledTypes && prefs.enabledTypes[type] === false) {
    debug('[adminNotificationStorage] Type disabled, skipping:', type);
    return null;
  }

  const notifications = getNotifications(tenantIdOverride);
  const newNotif = {
    id: crypto.randomUUID(),
    type,
    title: data.title || '',
    description: data.description || '',
    timestamp: Date.now(),
    read: false,
  };

  // Prepend (newest first), enforce max limit
  const updated = [newNotif, ...notifications].slice(0, MAX_NOTIFICATIONS);
  writeNotifications(updated, tenantIdOverride);
  debug('[adminNotificationStorage] Added notification:', newNotif.title);

  // Play sound if enabled
  if (prefs.soundEnabled) {
    playNotificationSound();
  }

  return newNotif;
}

/**
 * Mark a single notification as read.
 */
export function markAsRead(notificationId, tenantIdOverride) {
  const notifications = getNotifications(tenantIdOverride);
  const updated = notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  writeNotifications(updated, tenantIdOverride);
}

/**
 * Mark all notifications as read.
 */
export function markAllAsRead(tenantIdOverride) {
  const notifications = getNotifications(tenantIdOverride);
  const updated = notifications.map((n) => ({ ...n, read: true }));
  writeNotifications(updated, tenantIdOverride);
}

/**
 * Remove a single notification by ID.
 */
export function removeNotification(notificationId, tenantIdOverride) {
  const notifications = getNotifications(tenantIdOverride);
  const updated = notifications.filter((n) => n.id !== notificationId);
  writeNotifications(updated, tenantIdOverride);
}

/**
 * Clear all notifications.
 */
export function clearAllNotifications(tenantIdOverride) {
  writeNotifications([], tenantIdOverride);
}

/**
 * Get count of unread notifications.
 */
export function getUnreadCount(tenantIdOverride) {
  return getNotifications(tenantIdOverride).filter((n) => !n.read).length;
}
