/**
 * NotificationCenter — Bell icon with dropdown for admin header.
 *
 * Features:
 * - Unread badge with count
 * - Dropdown with scrollable notification list
 * - Mark as read / Mark all as read / Clear all
 * - Relative timestamps in Czech
 * - Type-based icons (order, slicing, config, storage, error, info)
 * - Click outside to close
 * - aria-live for accessibility
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  getUnreadCount,
  removeNotification,
} from '../../../utils/adminNotificationStorage';

// ---- Icon & color mapping per notification type ----
const TYPE_CONFIG = {
  order:   { icon: 'ShoppingCart', color: 'var(--forge-accent-primary)' },
  slicing: { icon: 'Layers',      color: 'var(--forge-info)' },
  config:  { icon: 'Settings',    color: 'var(--forge-warning)' },
  storage: { icon: 'HardDrive',   color: 'var(--forge-accent-secondary)' },
  error:   { icon: 'AlertCircle', color: 'var(--forge-error)' },
  info:    { icon: 'Info',        color: 'var(--forge-info)' },
};

// ---- Relative time in Czech ----
function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'prave ted';
  if (minutes === 1) return 'pred 1 min';
  if (minutes < 60) return `pred ${minutes} min`;
  if (hours === 1) return 'pred 1 hodinou';
  if (hours < 24) return `pred ${hours} hod`;
  if (days === 1) return 'vcera';
  if (days < 7) return `pred ${days} dny`;
  // Fallback: date
  const d = new Date(timestamp);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

// ---- Styles ----
const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
  },
  bellButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    color: 'var(--forge-text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 'var(--forge-radius-sm)',
    transition: 'color 150ms ease-out, background-color 150ms ease-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    minWidth: '16px',
    height: '16px',
    borderRadius: '8px',
    backgroundColor: 'var(--forge-error)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: 'var(--forge-font-tech)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    lineHeight: 1,
    pointerEvents: 'none',
    boxShadow: '0 0 0 2px var(--forge-bg-surface)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '360px',
    maxHeight: '480px',
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-lg)',
    boxShadow: 'var(--forge-shadow-lg)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: '1px solid var(--forge-border-default)',
  },
  headerTitle: {
    fontFamily: 'var(--forge-font-heading)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  headerBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--forge-text-muted)',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-body)',
    padding: '2px 6px',
    borderRadius: 'var(--forge-radius-sm)',
    transition: 'color 150ms, background-color 150ms',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  item: (isUnread) => ({
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--forge-border-default)',
    backgroundColor: isUnread ? 'rgba(0, 212, 170, 0.04)' : 'transparent',
    cursor: 'pointer',
    transition: 'background-color 150ms ease-out',
  }),
  itemIconWrap: (color) => ({
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: 'var(--forge-radius-sm)',
    backgroundColor: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '2px',
  }),
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: (isUnread) => ({
    fontFamily: 'var(--forge-font-body)',
    fontSize: '13px',
    fontWeight: isUnread ? 600 : 400,
    color: 'var(--forge-text-primary)',
    margin: 0,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  itemDesc: {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '12px',
    color: 'var(--forge-text-muted)',
    margin: '2px 0 0',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemTime: {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '10px',
    color: 'var(--forge-text-muted)',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  itemClose: {
    background: 'none',
    border: 'none',
    color: 'var(--forge-text-disabled)',
    cursor: 'pointer',
    padding: '2px',
    borderRadius: 'var(--forge-radius-sm)',
    opacity: 0,
    transition: 'opacity 150ms, color 150ms',
    marginTop: '2px',
    flexShrink: 0,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 16px',
    color: 'var(--forge-text-muted)',
  },
  emptyText: {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '13px',
    marginTop: '12px',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'var(--forge-accent-primary)',
    flexShrink: 0,
    marginTop: '6px',
  },
};

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapperRef = useRef(null);

  // Reload from storage
  const reload = useCallback(() => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  // Initial load + poll every 10s for external changes
  useEffect(() => {
    reload();
    const interval = setInterval(reload, 10000);
    return () => clearInterval(interval);
  }, [reload]);

  // Reload when dropdown opens
  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  // Listen for custom event from other parts of the app
  useEffect(() => {
    const handler = () => reload();
    window.addEventListener('notification-storage-updated', handler);
    return () => window.removeEventListener('notification-storage-updated', handler);
  }, [reload]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    // Escape key
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleToggle = () => setOpen((v) => !v);

  const handleMarkAllRead = () => {
    markAllAsRead();
    reload();
  };

  const handleClearAll = () => {
    clearAllNotifications();
    reload();
  };

  const handleItemClick = (notif) => {
    if (!notif.read) {
      markAsRead(notif.id);
      reload();
    }
  };

  const handleRemove = (e, notifId) => {
    e.stopPropagation();
    removeNotification(notifId);
    reload();
  };

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        style={styles.bellButton}
        aria-label={`Notifikace${unreadCount > 0 ? ` (${unreadCount} neprectenych)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
          e.currentTarget.style.color = 'var(--forge-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--forge-text-secondary)';
        }}
      >
        <Icon name="Bell" size={20} />
        {unreadCount > 0 && (
          <span style={styles.badge} aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {unreadCount > 0 ? `${unreadCount} neprectenych notifikaci` : ''}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={styles.dropdown} role="dialog" aria-label="Notifikace">
          {/* Header */}
          <div style={styles.header}>
            <h3 style={styles.headerTitle}>Notifikace</h3>
            <div style={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={styles.headerBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--forge-accent-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary-ghost)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--forge-text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Oznacit vse
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  style={styles.headerBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--forge-error)';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 71, 87, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--forge-text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Smazat vse
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>
                <Icon name="BellOff" size={32} color="var(--forge-text-disabled)" />
                <span style={styles.emptyText}>Zadne nove notifikace</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                return (
                  <div
                    key={notif.id}
                    style={styles.item(!notif.read)}
                    onClick={() => handleItemClick(notif)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = notif.read
                        ? 'var(--forge-bg-overlay)'
                        : 'rgba(0, 212, 170, 0.07)';
                      // Show close button
                      const closeBtn = e.currentTarget.querySelector('[data-close]');
                      if (closeBtn) closeBtn.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = notif.read
                        ? 'transparent'
                        : 'rgba(0, 212, 170, 0.04)';
                      const closeBtn = e.currentTarget.querySelector('[data-close]');
                      if (closeBtn) closeBtn.style.opacity = '0';
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(notif);
                      }
                    }}
                  >
                    {/* Unread dot */}
                    {!notif.read ? (
                      <div style={styles.unreadDot} aria-hidden="true" />
                    ) : (
                      <div style={{ width: 6, minWidth: 6 }} />
                    )}

                    {/* Type icon */}
                    <div style={styles.itemIconWrap(config.color)}>
                      <Icon name={config.icon} size={16} color={config.color} />
                    </div>

                    {/* Content */}
                    <div style={styles.itemContent}>
                      <p style={styles.itemTitle(!notif.read)}>{notif.title}</p>
                      {notif.description && (
                        <p style={styles.itemDesc}>{notif.description}</p>
                      )}
                      <div style={styles.itemTime}>
                        {formatRelativeTime(notif.timestamp)}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      data-close
                      style={styles.itemClose}
                      onClick={(e) => handleRemove(e, notif.id)}
                      aria-label={`Smazat notifikaci: ${notif.title}`}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--forge-error)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--forge-text-disabled)';
                      }}
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
