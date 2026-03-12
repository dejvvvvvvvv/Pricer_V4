/**
 * NotificationCenter — Bell icon with dropdown for admin header.
 *
 * Features:
 * - Unread badge with count (capped at 99+)
 * - Badge pulse animation on new notifications
 * - Dropdown with scrollable notification list (max 400px wide, 500px tall)
 * - Mark as read on click / Mark all as read / Clear all (with ForgeConfirmDialog)
 * - Relative timestamps in Czech
 * - Type-based icons & colors (order, slicing, config, storage, error, info)
 * - Notification preferences panel (per-type toggle, sound on/off)
 * - Click outside / Escape to close
 * - aria-live for accessibility
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import { useConfirmDialog } from '../../../components/ui/forge/ForgeConfirmDialog';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
  getUnreadCount,
  removeNotification,
  getNotificationPrefs,
  saveNotificationPrefs,
  NOTIFICATION_UPDATED_EVENT,
} from '../../../utils/adminNotificationStorage';

// ---- Icon & color mapping per notification type ----
const TYPE_CONFIG = {
  order:   { icon: 'ShoppingCart', color: 'var(--forge-accent-primary)', label: 'Objednavky' },
  slicing: { icon: 'Layers',      color: 'var(--forge-info)',           label: 'Slicovani' },
  config:  { icon: 'Settings',    color: 'var(--forge-warning)',        label: 'Konfigurace' },
  storage: { icon: 'HardDrive',   color: 'var(--forge-accent-secondary)', label: 'Uloziste' },
  error:   { icon: 'AlertCircle', color: 'var(--forge-error)',          label: 'Chyby' },
  info:    { icon: 'Info',        color: 'var(--forge-info)',           label: 'Informace' },
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
  const d = new Date(timestamp);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

// ---- Badge count formatter ----
function formatBadge(count) {
  if (count <= 0) return '';
  if (count > 99) return '99+';
  return String(count);
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
    top: '0px',
    right: '-2px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    backgroundColor: 'var(--forge-error)',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    fontFamily: 'var(--forge-font-tech)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 5px',
    lineHeight: 1,
    pointerEvents: 'none',
    boxShadow: '0 0 0 2px var(--forge-bg-surface)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '400px',
    maxHeight: '500px',
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
    gap: '6px',
    alignItems: 'center',
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
  headerIconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--forge-text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--forge-radius-sm)',
    transition: 'color 150ms, background-color 150ms',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    overscrollBehavior: 'contain',
  },
  item: (isUnread) => ({
    display: 'flex',
    gap: '10px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--forge-border-default)',
    backgroundColor: isUnread ? 'rgba(0, 212, 170, 0.04)' : 'transparent',
    borderLeft: isUnread ? '3px solid var(--forge-accent-primary)' : '3px solid transparent',
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
  // ---- Preferences panel ----
  prefsPanel: {
    borderTop: '1px solid var(--forge-border-default)',
    padding: '12px 16px',
    backgroundColor: 'var(--forge-bg-surface)',
  },
  prefsPanelTitle: {
    fontFamily: 'var(--forge-font-heading)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--forge-text-secondary)',
    margin: '0 0 10px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  prefsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 0',
  },
  prefsLabel: {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '12px',
    color: 'var(--forge-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  prefsToggle: (active) => ({
    width: '32px',
    height: '18px',
    borderRadius: '9px',
    backgroundColor: active ? 'var(--forge-accent-primary)' : 'var(--forge-bg-overlay)',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 150ms ease-out',
    flexShrink: 0,
  }),
  prefsToggleKnob: (active) => ({
    position: 'absolute',
    top: '2px',
    left: active ? '16px' : '2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'left 150ms ease-out',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  }),
  prefsDivider: {
    height: '1px',
    backgroundColor: 'var(--forge-border-default)',
    margin: '8px 0',
  },
};

// ---- Badge pulse animation (injected once) ----
const PULSE_CLASS = 'nc-badge-pulse';
let styleInjected = false;
function injectPulseStyle() {
  if (styleInjected || typeof document === 'undefined') return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes nc-badge-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    .${PULSE_CLASS} {
      animation: nc-badge-pulse 0.4s ease-out;
    }
  `;
  document.head.appendChild(style);
}

// ---- Toggle switch sub-component ----
function Toggle({ active, onChange, ariaLabel }) {
  return (
    <button
      style={styles.prefsToggle(active)}
      onClick={onChange}
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
    >
      <span style={styles.prefsToggleKnob(active)} />
    </button>
  );
}

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prefs, setPrefs] = useState(null);
  const [pulsing, setPulsing] = useState(false);
  const prevUnreadRef = useRef(0);
  const wrapperRef = useRef(null);

  const { confirm, ConfirmDialog } = useConfirmDialog();

  // Reload from storage
  const reload = useCallback(() => {
    const all = getNotifications();
    setNotifications(all);
    setUnreadCount(getUnreadCount());
  }, []);

  // Load prefs separately to avoid re-creating reload callback
  const loadPrefs = useCallback(() => {
    setPrefs(getNotificationPrefs());
  }, []);

  // Initial load + poll every 10s for external changes
  useEffect(() => {
    injectPulseStyle();
    reload();
    loadPrefs();
    const interval = setInterval(reload, 10000);
    return () => clearInterval(interval);
  }, [reload, loadPrefs]);

  // Reload when dropdown opens
  useEffect(() => {
    if (open) {
      reload();
      loadPrefs();
    }
  }, [open, reload, loadPrefs]);

  // Listen for custom event from other parts of the app
  useEffect(() => {
    const handler = () => reload();
    window.addEventListener(NOTIFICATION_UPDATED_EVENT, handler);
    return () => window.removeEventListener(NOTIFICATION_UPDATED_EVENT, handler);
  }, [reload]);

  // Badge pulse when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current && prevUnreadRef.current >= 0) {
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 500);
      prevUnreadRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setShowPrefs(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setShowPrefs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleToggle = () => {
    setOpen((v) => !v);
    if (open) setShowPrefs(false);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    reload();
  };

  const handleClearAll = async () => {
    const ok = await confirm({
      title: 'Smazat vsechny notifikace?',
      message: 'Tato akce smaze vsechny notifikace. Nelze ji vratit zpet.',
      confirmLabel: 'Smazat vse',
      cancelLabel: 'Zrusit',
      destructive: true,
    });
    if (!ok) return;
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

  // ---- Preferences handlers ----
  const updatePrefs = useCallback((updater) => {
    setPrefs((prev) => {
      const current = prev || getNotificationPrefs();
      const next = updater(current);
      saveNotificationPrefs(next);
      return next;
    });
  }, []);

  const toggleTypeEnabled = (type) => {
    updatePrefs((p) => ({
      ...p,
      enabledTypes: { ...p.enabledTypes, [type]: !p.enabledTypes[type] },
    }));
  };

  const toggleSound = () => {
    updatePrefs((p) => ({ ...p, soundEnabled: !p.soundEnabled }));
  };

  // Filter notifications by enabled types for display
  const currentPrefs = prefs || getNotificationPrefs();
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const typeEnabled = currentPrefs.enabledTypes[n.type];
      return typeEnabled !== false;
    });
  }, [notifications, currentPrefs]);

  const badgeText = formatBadge(unreadCount);

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
          <span
            style={styles.badge}
            className={pulsing ? PULSE_CLASS : undefined}
            aria-hidden="true"
          >
            {badgeText}
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
              {/* Settings gear */}
              <button
                onClick={() => setShowPrefs((v) => !v)}
                style={{
                  ...styles.headerIconBtn,
                  color: showPrefs ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                  backgroundColor: showPrefs ? 'var(--forge-accent-primary-ghost)' : 'transparent',
                }}
                aria-label="Nastaveni notifikaci"
                onMouseEnter={(e) => {
                  if (!showPrefs) {
                    e.currentTarget.style.color = 'var(--forge-text-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--forge-bg-overlay)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showPrefs) {
                    e.currentTarget.style.color = 'var(--forge-text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon name="Settings" size={14} />
              </button>
            </div>
          </div>

          {/* Preferences panel (collapsible) */}
          {showPrefs && (
            <div style={styles.prefsPanel}>
              <p style={styles.prefsPanelTitle}>Nastaveni</p>
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <div key={type} style={styles.prefsRow}>
                  <span style={styles.prefsLabel}>
                    <Icon name={cfg.icon} size={13} color={cfg.color} />
                    {cfg.label}
                  </span>
                  <Toggle
                    active={currentPrefs.enabledTypes[type] !== false}
                    onChange={() => toggleTypeEnabled(type)}
                    ariaLabel={`${cfg.label} notifikace`}
                  />
                </div>
              ))}
              <div style={styles.prefsDivider} />
              <div style={styles.prefsRow}>
                <span style={styles.prefsLabel}>
                  <Icon name={currentPrefs.soundEnabled ? 'Volume2' : 'VolumeX'} size={13} color="var(--forge-text-muted)" />
                  Zvuk
                </span>
                <Toggle
                  active={currentPrefs.soundEnabled}
                  onChange={toggleSound}
                  ariaLabel="Zvuk notifikaci"
                />
              </div>
            </div>
          )}

          {/* List */}
          <div style={styles.list}>
            {filteredNotifications.length === 0 ? (
              <div style={styles.empty}>
                <Icon name="BellOff" size={32} color="var(--forge-text-disabled)" />
                <span style={styles.emptyText}>Zadne notifikace</span>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
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

      {/* Confirm dialog for Clear All */}
      <ConfirmDialog />
    </div>
  );
};

export default NotificationCenter;
