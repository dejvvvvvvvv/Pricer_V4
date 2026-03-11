/**
 * Admin Notification Storage — tenant-scoped persistent notifications.
 *
 * Stores up to MAX_NOTIFICATIONS in localStorage under
 * `modelpricer:${tenantId}:notifications`.
 *
 * Each notification: { id, type, title, description, timestamp, read }
 * Types: 'order' | 'slicing' | 'config' | 'storage' | 'info' | 'error'
 */

import { getTenantId } from './adminTenantStorage';
import { debug } from '@/lib/debug';

const NAMESPACE = 'notifications';
const MAX_NOTIFICATIONS = 50;

function buildKey(tenantId) {
  return `modelpricer:${tenantId}:${NAMESPACE}`;
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

/**
 * Read all notifications (newest first).
 */
export function getNotifications(tenantIdOverride) {
  if (!canUseLocalStorage()) return [];
  const tenantId = tenantIdOverride || getTenantId();
  try {
    const raw = window.localStorage.getItem(buildKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    debug('[adminNotificationStorage] Failed to read:', e);
    return [];
  }
}

/**
 * Write notifications array to storage.
 */
function writeNotifications(notifications, tenantIdOverride) {
  if (!canUseLocalStorage()) return;
  const tenantId = tenantIdOverride || getTenantId();
  try {
    window.localStorage.setItem(
      buildKey(tenantId),
      JSON.stringify(notifications)
    );
  } catch (e) {
    debug('[adminNotificationStorage] Failed to write:', e);
  }
}

/**
 * Add a new notification. Returns the new notification object.
 *
 * @param {{ type: string, title: string, description?: string }} data
 */
export function addNotification(data, tenantIdOverride) {
  const notifications = getNotifications(tenantIdOverride);
  const newNotif = {
    id: crypto.randomUUID ? crypto.randomUUID() : `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: data.type || 'info',
    title: data.title || '',
    description: data.description || '',
    timestamp: Date.now(),
    read: false,
  };

  // Prepend (newest first), enforce max limit
  const updated = [newNotif, ...notifications].slice(0, MAX_NOTIFICATIONS);
  writeNotifications(updated, tenantIdOverride);
  debug('[adminNotificationStorage] Added notification:', newNotif.title);
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
