// AdminTeamAccess — Team management page
// ----------------------------------------
// Scope: /admin/team
// - Card-based team member display (avatar, name, email, role, status, last login)
// - Invite new member form (name, email, role selector)
// - Role management: Owner, Admin, Manager, Viewer
// - Role permissions matrix
// - Recent team activity log
// - Remove member with confirmation
// - Data via adminTeamAccessStorage (tenant-scoped localStorage)

import React, { useCallback, useMemo, useState } from 'react';
import Icon from '../../components/AppIcon';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  acceptInviteToken,
  changeUserRole,
  createInvite,
  deleteInvite,
  deleteUser,
  disableUser,
  enableUser,
  getTeamInvites,
  getTeamSummary,
  getTeamUsers,
} from '../../utils/adminTeamAccessStorage';
import {
  getAuditEntries,
} from '../../utils/adminAuditLogStorage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = { members: 'members', roles: 'roles', activity: 'activity' };

const ROLE_ORDER = ['owner', 'admin', 'manager', 'viewer', 'operator'];

const ROLE_META = {
  owner: {
    label: 'Vlastnik',
    color: '#F0A030',
    description: 'Plny pristup vcetne fakturace a spravcu tymu',
  },
  admin: {
    label: 'Admin',
    color: 'var(--forge-accent-primary)',
    description: 'Plny pristup krome fakturace',
  },
  manager: {
    label: 'Manazer',
    color: '#6C9AFF',
    description: 'Sprava objednavek, cenotvorba, presety',
  },
  viewer: {
    label: 'Prohlizec',
    color: '#A78BFA',
    description: 'Pouze cteni — zadne zmeny',
  },
  operator: {
    label: 'Operator',
    color: '#60A5FA',
    description: 'Prace s objednavkami + cteni konfigurace',
  },
};

const PERMISSION_CATEGORIES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pricing', label: 'Cenotvorba' },
  { key: 'fees', label: 'Poplatky' },
  { key: 'parameters', label: 'Parametry' },
  { key: 'presets', label: 'Presety' },
  { key: 'orders', label: 'Objednavky' },
  { key: 'branding', label: 'Branding' },
  { key: 'widget', label: 'Widget' },
  { key: 'team', label: 'Tym' },
  { key: 'billing', label: 'Fakturace' },
  { key: 'audit', label: 'Audit log' },
];

const ROLE_PERMISSIONS = {
  owner: {
    dashboard: 'full', pricing: 'full', fees: 'full', parameters: 'full',
    presets: 'full', orders: 'full', branding: 'full', widget: 'full',
    team: 'full', billing: 'full', audit: 'full',
  },
  admin: {
    dashboard: 'full', pricing: 'full', fees: 'full', parameters: 'full',
    presets: 'full', orders: 'full', branding: 'full', widget: 'full',
    team: 'full', billing: 'none', audit: 'full',
  },
  manager: {
    dashboard: 'read', pricing: 'full', fees: 'full', parameters: 'read',
    presets: 'full', orders: 'full', branding: 'read', widget: 'read',
    team: 'none', billing: 'none', audit: 'none',
  },
  viewer: {
    dashboard: 'read', pricing: 'read', fees: 'read', parameters: 'read',
    presets: 'read', orders: 'read', branding: 'read', widget: 'read',
    team: 'none', billing: 'none', audit: 'none',
  },
  operator: {
    dashboard: 'read', pricing: 'read', fees: 'read', parameters: 'read',
    presets: 'read', orders: 'full', branding: 'read', widget: 'read',
    team: 'none', billing: 'none', audit: 'none',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(ts) {
  if (!ts) return '--';
  try {
    return new Date(ts).toLocaleString('cs-CZ', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts || '--';
  }
}

function formatDateShort(ts) {
  if (!ts) return '--';
  try {
    return new Date(ts).toLocaleString('cs-CZ', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return ts || '--';
  }
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name[0].toUpperCase();
}

function getRoleMeta(role) {
  return ROLE_META[role] || ROLE_META.viewer;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Avatar({ name, size = 40 }) {
  const initials = getInitials(name);
  let hash = 0;
  const str = name || '?';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const bg = `hsl(${hue}, 40%, 25%)`;
  const fg = `hsl(${hue}, 50%, 75%)`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        color: fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--forge-font-heading)',
        fontWeight: 700,
        fontSize: `${Math.round(size * 0.38)}px`,
        flexShrink: 0,
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }) {
  const meta = getRoleMeta(role);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '10px',
      fontFamily: 'var(--forge-font-tech)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
      color: meta.color,
      border: `1px solid color-mix(in srgb, ${meta.color} 25%, transparent)`,
      whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
}

function StatusDot({ status }) {
  const colorMap = {
    active: 'var(--forge-success)',
    disabled: 'var(--forge-text-muted)',
    pending: 'var(--forge-warning)',
    invited: 'var(--forge-warning)',
    revoked: 'var(--forge-error)',
    expired: 'var(--forge-error)',
  };
  const labelMap = {
    active: 'Aktivni',
    disabled: 'Neaktivni',
    pending: 'Ceka na prijem',
    invited: 'Pozvan',
    revoked: 'Zrusen',
    expired: 'Vyprsel',
  };
  const color = colorMap[status] || 'var(--forge-text-muted)';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      fontFamily: 'var(--forge-font-body)',
      color: 'var(--forge-text-secondary)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', backgroundColor: color,
        flexShrink: 0,
      }} />
      {labelMap[status] || status}
    </span>
  );
}

function StatCard({ icon, label, value, color = 'var(--forge-accent-primary)' }) {
  return (
    <div style={{
      flex: '1 1 180px',
      minWidth: 160,
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-md)',
      padding: '18px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
    }}>
      <div style={{
        width: 36, height: 36,
        borderRadius: 'var(--forge-radius-sm)',
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color,
      }}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <div style={{
          fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--forge-text-muted)', marginBottom: '4px',
        }}>{label}</div>
        <div style={{
          fontFamily: 'var(--forge-font-heading)', fontSize: '22px',
          fontWeight: 700, color: 'var(--forge-text-primary)', lineHeight: 1.1,
        }}>{value}</div>
      </div>
    </div>
  );
}

function ConfirmButton({ label, onConfirm, confirmText, variant = 'default', icon }) {
  const [confirming, setConfirming] = useState(false);

  const styles = {
    default: {
      background: 'rgba(0,212,170,0.08)',
      border: '1px solid rgba(0,212,170,0.25)',
      color: 'var(--forge-accent-primary)',
    },
    danger: {
      background: 'rgba(255,71,87,0.08)',
      border: '1px solid rgba(255,71,87,0.25)',
      color: 'var(--forge-error)',
    },
    success: {
      background: 'rgba(0,212,170,0.08)',
      border: '1px solid rgba(0,212,170,0.25)',
      color: 'var(--forge-success)',
    },
  };

  const style = styles[variant] || styles.default;

  if (confirming) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => { onConfirm(); setConfirming(false); }}
          style={{
            ...style, padding: '4px 10px', borderRadius: 'var(--forge-radius-sm)',
            cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--forge-font-body)',
            fontWeight: 600,
          }}
        >
          {confirmText || 'Potvrdit'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)',
            color: 'var(--forge-text-muted)', padding: '4px 8px',
            borderRadius: 'var(--forge-radius-sm)', cursor: 'pointer',
            fontSize: '11px', fontFamily: 'var(--forge-font-body)',
          }}
        >
          Zrusit
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        ...style, padding: '4px 10px', borderRadius: 'var(--forge-radius-sm)',
        cursor: 'pointer', fontSize: '11px', fontFamily: 'var(--forge-font-body)',
        fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px',
      }}
    >
      {icon && <Icon name={icon} size={13} />}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Member Card
// ---------------------------------------------------------------------------

function MemberCard({ user, onRoleChange, onToggleStatus, onRemove, isInvite }) {
  const name = user.name || user.email?.split('@')[0] || '--';
  const email = user.email || '--';
  const role = user.role || 'viewer';
  const status = user.status || 'active';
  const lastLogin = user.lastLoginAt || user.last_login_at;

  return (
    <div style={{
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-md)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Top row: avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Avatar name={name} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--forge-font-heading)', fontWeight: 600,
            fontSize: '14px', color: 'var(--forge-text-primary)',
            lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isInvite ? email : name}
          </div>
          {!isInvite && (
            <div style={{
              fontSize: '12px', color: 'var(--forge-text-muted)',
              lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {email}
            </div>
          )}
        </div>
        <RoleBadge role={role} />
      </div>

      {/* Status + Last login */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '8px',
        padding: '10px 14px',
        backgroundColor: 'var(--forge-bg-elevated)',
        borderRadius: 'var(--forge-radius-sm)',
      }}>
        <StatusDot status={status} />
        <span style={{
          fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
        }}>
          {isInvite
            ? `Vyprsi: ${formatDate(user.expiresAt || user.expires_at)}`
            : `Posledni prihlaseni: ${formatDate(lastLogin)}`}
        </span>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
        borderTop: '1px solid var(--forge-border-default)',
        paddingTop: '12px',
      }}>
        {!isInvite && (
          <>
            {/* Role change */}
            <select
              value={role}
              onChange={(e) => onRoleChange?.(user.id, e.target.value)}
              aria-label="Zmena role"
              style={{
                background: 'var(--forge-bg-elevated)',
                border: '1px solid var(--forge-border-default)',
                color: 'var(--forge-text-primary)',
                borderRadius: 'var(--forge-radius-sm)',
                padding: '4px 8px',
                fontSize: '11px',
                fontFamily: 'var(--forge-font-body)',
                cursor: 'pointer',
              }}
            >
              {ROLE_ORDER.map((r) => (
                <option key={r} value={r}>{getRoleMeta(r).label}</option>
              ))}
            </select>

            {/* Toggle status */}
            {status === 'active' ? (
              <ConfirmButton
                label="Deaktivovat"
                icon="UserMinus"
                confirmText="Ano, deaktivovat"
                onConfirm={() => onToggleStatus?.(user.id, false)}
              />
            ) : (
              <ConfirmButton
                label="Aktivovat"
                icon="UserCheck"
                variant="success"
                confirmText="Ano, aktivovat"
                onConfirm={() => onToggleStatus?.(user.id, true)}
              />
            )}

            {/* Remove */}
            <ConfirmButton
              label="Odebrat"
              icon="Trash2"
              variant="danger"
              confirmText="Opravdu odebrat?"
              onConfirm={() => onRemove?.(user.id)}
            />
          </>
        )}

        {isInvite && status === 'pending' && (
          <>
            <ConfirmButton
              label="Simulovat prijem"
              icon="UserCheck"
              variant="success"
              confirmText="Potvrdit prijem"
              onConfirm={() => {
                acceptInviteToken(user.token, { name: user.email.split('@')[0] });
              }}
            />
            <ConfirmButton
              label="Zrusit pozvanku"
              icon="X"
              variant="danger"
              confirmText="Ano, zrusit"
              onConfirm={() => deleteInvite(user.id)}
            />
          </>
        )}

        {isInvite && status !== 'pending' && (
          <span style={{
            fontSize: '11px', color: 'var(--forge-text-muted)',
            fontFamily: 'var(--forge-font-body)', fontStyle: 'italic',
          }}>
            Zadne dostupne akce
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Permissions Matrix
// ---------------------------------------------------------------------------

function PermissionsMatrix() {
  const cellStyle = (level) => {
    const colors = {
      full: { bg: 'rgba(0,212,170,0.12)', color: 'var(--forge-success)', icon: 'Check' },
      read: { bg: 'rgba(96,165,250,0.12)', color: '#60A5FA', icon: 'Eye' },
      none: { bg: 'rgba(255,71,87,0.06)', color: 'var(--forge-text-disabled)', icon: 'Minus' },
    };
    return colors[level] || colors.none;
  };

  return (
    <div style={{
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-md)',
      overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table role="table" style={{
          width: '100%', borderCollapse: 'collapse',
          fontFamily: 'var(--forge-font-body)', fontSize: '13px',
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '12px 16px', textAlign: 'left',
                fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--forge-text-muted)',
                borderBottom: '1px solid var(--forge-border-default)',
                backgroundColor: 'var(--forge-bg-elevated)',
                position: 'sticky', left: 0, zIndex: 1,
              }}>
                Opravneni
              </th>
              {ROLE_ORDER.map((role) => (
                <th key={role} style={{
                  padding: '12px 14px', textAlign: 'center',
                  fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                  color: getRoleMeta(role).color,
                  borderBottom: '1px solid var(--forge-border-default)',
                  backgroundColor: 'var(--forge-bg-elevated)',
                  whiteSpace: 'nowrap',
                }}>
                  {getRoleMeta(role).label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_CATEGORIES.map((cat, idx) => (
              <tr key={cat.key} style={{
                backgroundColor: idx % 2 === 0 ? 'var(--forge-bg-surface)' : 'var(--forge-bg-void)',
              }}>
                <td style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--forge-border-default)',
                  color: 'var(--forge-text-primary)',
                  fontWeight: 500,
                  fontSize: '13px',
                  position: 'sticky', left: 0, zIndex: 1,
                  backgroundColor: idx % 2 === 0 ? 'var(--forge-bg-surface)' : 'var(--forge-bg-void)',
                }}>
                  {cat.label}
                </td>
                {ROLE_ORDER.map((role) => {
                  const level = ROLE_PERMISSIONS[role]?.[cat.key] || 'none';
                  const cell = cellStyle(level);
                  return (
                    <td key={role} style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--forge-border-default)',
                      textAlign: 'center',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 'var(--forge-radius-sm)',
                        backgroundColor: cell.bg, color: cell.color,
                      }}>
                        <Icon name={cell.icon} size={14} />
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--forge-border-default)',
        display: 'flex', gap: '20px', flexWrap: 'wrap',
        backgroundColor: 'var(--forge-bg-elevated)',
      }}>
        {[
          { icon: 'Check', label: 'Plny pristup', color: 'var(--forge-success)' },
          { icon: 'Eye', label: 'Pouze cteni', color: '#60A5FA' },
          { icon: 'Minus', label: 'Bez pristupu', color: 'var(--forge-text-disabled)' },
        ].map((item) => (
          <span key={item.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontFamily: 'var(--forge-font-body)',
            color: 'var(--forge-text-muted)',
          }}>
            <Icon name={item.icon} size={13} style={{ color: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

function ActivityLog({ entries }) {
  if (entries.length === 0) {
    return (
      <div style={{
        backgroundColor: 'var(--forge-bg-surface)',
        border: '1px solid var(--forge-border-default)',
        borderRadius: 'var(--forge-radius-md)',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <Icon name="Clock" size={32} style={{ color: 'var(--forge-text-muted)', marginBottom: '10px' }} />
        <div style={{
          fontFamily: 'var(--forge-font-body)', fontSize: '14px',
          color: 'var(--forge-text-muted)',
        }}>
          Zatim zadna tymova aktivita.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-md)',
      overflow: 'hidden',
    }}>
      {entries.map((entry, idx) => (
        <div
          key={entry.id || idx}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 16px',
            borderBottom: idx < entries.length - 1 ? '1px solid var(--forge-border-default)' : 'none',
            backgroundColor: idx % 2 === 0 ? 'var(--forge-bg-surface)' : 'var(--forge-bg-void)',
          }}
        >
          {/* Timeline dot */}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: 'var(--forge-accent-primary)',
            flexShrink: 0, marginTop: '6px',
            opacity: 0.6,
          }} />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap',
            }}>
              <span style={{
                fontFamily: 'var(--forge-font-body)', fontSize: '13px',
                fontWeight: 600, color: 'var(--forge-text-primary)',
              }}>
                {entry.actor_email || 'System'}
              </span>
              <span style={{
                fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
                padding: '1px 6px', borderRadius: 'var(--forge-radius-sm)',
                backgroundColor: 'var(--forge-bg-elevated)',
                border: '1px solid var(--forge-border-default)',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                {entry.action}
              </span>
            </div>
            {entry.summary && (
              <div style={{
                fontFamily: 'var(--forge-font-body)', fontSize: '12px',
                color: 'var(--forge-text-secondary)', marginTop: '2px',
              }}>
                {entry.summary}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span style={{
            fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
            color: 'var(--forge-text-muted)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {formatDateShort(entry.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite Form (inline, not modal)
// ---------------------------------------------------------------------------

function InviteForm({ onInviteSent }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('operator');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Vyplnte email.');
      return;
    }

    try {
      const result = createInvite({ email: email.trim(), role, message: name.trim() });
      if (result?.ok === false) {
        const errorMap = {
          INVALID_EMAIL: 'Neplatny format emailu.',
          ALREADY_MEMBER: 'Uzivatel je jiz clenem tymu.',
          ALREADY_INVITED: 'Pozvanku na tento email jiz existuje.',
          SEAT_LIMIT_REACHED: 'Dosazeno limitu mist v tymu.',
          INVALID_ROLE: 'Neplatna role.',
        };
        setError(errorMap[result.error] || result.error || 'Chyba pri odesilani pozvanky.');
        return;
      }
      setSuccess(`Pozvanka odeslana na ${email.trim()}`);
      setEmail('');
      setName('');
      setRole('operator');
      onInviteSent?.();
    } catch (err) {
      setError(err?.message || 'Chyba pri odesilani pozvanky.');
    }
  };

  return (
    <div style={{
      backgroundColor: 'var(--forge-bg-surface)',
      border: '1px solid var(--forge-border-default)',
      borderRadius: 'var(--forge-radius-md)',
      padding: '20px',
    }}>
      <div style={{
        fontFamily: 'var(--forge-font-heading)', fontSize: '15px',
        fontWeight: 600, color: 'var(--forge-text-primary)', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Icon name="UserPlus" size={18} style={{ color: 'var(--forge-accent-primary)' }} />
        Pozvat noveho clena
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Name */}
          <div style={{ flex: '1 1 160px', minWidth: 140 }}>
            <label style={labelStyle}>Jmeno</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jan Novak"
              style={inputStyle}
              aria-label="Jmeno noveho clena"
            />
          </div>

          {/* Email */}
          <div style={{ flex: '2 1 220px', minWidth: 200 }}>
            <label style={labelStyle}>Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jan@firma.cz"
              required
              style={inputStyle}
              aria-label="Email noveho clena"
            />
          </div>

          {/* Role */}
          <div style={{ flex: '1 1 130px', minWidth: 120 }}>
            <label style={labelStyle}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
              aria-label="Role noveho clena"
            >
              {ROLE_ORDER.filter((r) => r !== 'owner').map((r) => (
                <option key={r} value={r}>{getRoleMeta(r).label}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              backgroundColor: 'var(--forge-accent-primary)',
              color: '#0A0E17',
              border: '1px solid var(--forge-accent-primary)',
              borderRadius: 'var(--forge-radius-sm)',
              padding: '8px 18px',
              fontFamily: 'var(--forge-font-body)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              height: '36px',
            }}
          >
            <Icon name="Send" size={14} />
            Pozvat
          </button>
        </div>

        {/* Error / Success messages */}
        {error && (
          <div style={{
            marginTop: '10px', padding: '8px 12px',
            borderRadius: 'var(--forge-radius-sm)',
            backgroundColor: 'rgba(255,71,87,0.08)',
            border: '1px solid rgba(255,71,87,0.25)',
            color: 'var(--forge-error)',
            fontSize: '12px', fontFamily: 'var(--forge-font-body)',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            marginTop: '10px', padding: '8px 12px',
            borderRadius: 'var(--forge-radius-sm)',
            backgroundColor: 'rgba(0,212,170,0.08)',
            border: '1px solid rgba(0,212,170,0.25)',
            color: 'var(--forge-success)',
            fontSize: '12px', fontFamily: 'var(--forge-font-body)',
          }}>
            {success}
          </div>
        )}
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--forge-font-tech)',
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--forge-text-muted)',
  marginBottom: '4px',
};

const inputStyle = {
  width: '100%',
  background: 'var(--forge-bg-elevated)',
  border: '1px solid var(--forge-border-default)',
  color: 'var(--forge-text-primary)',
  borderRadius: 'var(--forge-radius-sm)',
  padding: '8px 12px',
  fontSize: '13px',
  fontFamily: 'var(--forge-font-body)',
  outline: 'none',
  boxSizing: 'border-box',
  height: '36px',
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminTeamAccess() {
  const { language } = useLanguage();
  const cs = language === 'cs';
  useDocumentTitle(cs ? 'Tym — Admin' : 'Team — Admin');

  const [tab, setTab] = useState(TABS.members);
  const [refreshKey, setRefreshKey] = useState(0);

  const users = useMemo(() => getTeamUsers(), [refreshKey]);
  const invites = useMemo(() => getTeamInvites(), [refreshKey]);
  const summary = useMemo(() => getTeamSummary(), [refreshKey]);

  // Audit entries filtered to team-related actions
  const teamActivity = useMemo(() => {
    const all = getAuditEntries();
    return all
      .filter((e) => e.entity_type?.startsWith('team') || e.action?.startsWith('TEAM_'))
      .slice(0, 50);
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleRoleChange = useCallback((userId, newRole) => {
    changeUserRole(userId, newRole);
    refresh();
  }, [refresh]);

  const handleToggleStatus = useCallback((userId, enable) => {
    if (enable) {
      enableUser(userId);
    } else {
      disableUser(userId);
    }
    refresh();
  }, [refresh]);

  const handleRemove = useCallback((userId) => {
    deleteUser(userId);
    refresh();
  }, [refresh]);

  const pendingInvites = useMemo(
    () => invites.filter((i) => i.status === 'pending'),
    [invites]
  );
  const otherInvites = useMemo(
    () => invites.filter((i) => i.status !== 'pending'),
    [invites]
  );

  // Tab button helper
  const tabBtn = (key, label, icon) => {
    const active = tab === key;
    return (
      <button
        key={key}
        onClick={() => setTab(key)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px',
          borderRadius: 'var(--forge-radius-sm)',
          border: `1px solid ${active ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
          backgroundColor: active ? 'var(--forge-bg-elevated)' : 'var(--forge-bg-surface)',
          color: active ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
          fontFamily: 'var(--forge-font-body)',
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          cursor: 'pointer',
          transition: 'all 150ms',
        }}
      >
        <Icon name={icon} size={15} />
        {label}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <ForgePageHeader
        title="Sprava tymu"
        breadcrumb="ADMIN / TYM"
        actions={
          <span style={{
            fontFamily: 'var(--forge-font-tech)', fontSize: '11px',
            color: 'var(--forge-text-muted)', padding: '6px 12px',
            backgroundColor: 'var(--forge-bg-surface)',
            border: '1px solid var(--forge-border-default)',
            borderRadius: 'var(--forge-radius-sm)',
          }}>
            Mista: {summary.activeUsers + summary.pendingInvites} / {summary.seatLimit}
          </span>
        }
      />

      {/* Stats */}
      <div style={{
        display: 'flex', gap: '14px', flexWrap: 'wrap',
        marginTop: '24px', marginBottom: '24px',
      }}>
        <StatCard icon="Users" label="Aktivni clenove" value={summary.activeUsers} />
        <StatCard
          icon="Mail"
          label="Cekajici pozvanky"
          value={summary.pendingInvites}
          color="#F0A030"
        />
        <StatCard
          icon="UserX"
          label="Neaktivni"
          value={summary.disabledUsers}
          color="var(--forge-text-muted)"
        />
        <StatCard
          icon="Shield"
          label="Pocet roli"
          value={ROLE_ORDER.length}
          color="#A78BFA"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabBtn(TABS.members, 'Clenove tymu', 'Users')}
        {tabBtn(TABS.roles, 'Role a opravneni', 'Shield')}
        {tabBtn(TABS.activity, `Aktivita (${teamActivity.length})`, 'Clock')}
      </div>

      {/* ============================================================ */}
      {/* TAB: Members */}
      {/* ============================================================ */}
      {tab === TABS.members && (
        <div>
          {/* Invite form */}
          <InviteForm onInviteSent={refresh} />

          {/* Active members */}
          <div style={{
            fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--forge-text-muted)',
            marginTop: '24px', marginBottom: '12px',
          }}>
            Clenove ({users.length})
          </div>

          {users.length === 0 ? (
            <div style={{
              backgroundColor: 'var(--forge-bg-surface)',
              border: '1px solid var(--forge-border-default)',
              borderRadius: 'var(--forge-radius-md)',
              padding: '32px', textAlign: 'center',
              color: 'var(--forge-text-muted)',
              fontFamily: 'var(--forge-font-body)', fontSize: '14px',
            }}>
              Zatim zadni clenove. Pozvete prvniho clena pomoci formulare vyse.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '14px',
            }}>
              {users.map((u) => (
                <MemberCard
                  key={u.id}
                  user={u}
                  onRoleChange={handleRoleChange}
                  onToggleStatus={handleToggleStatus}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <>
              <div style={{
                fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--forge-text-muted)',
                marginTop: '24px', marginBottom: '12px',
              }}>
                Cekajici pozvanky ({pendingInvites.length})
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '14px',
              }}>
                {pendingInvites.map((inv) => (
                  <MemberCard
                    key={inv.id}
                    user={inv}
                    isInvite
                    onRemove={() => { deleteInvite(inv.id); refresh(); }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Past invites (accepted/revoked/expired) */}
          {otherInvites.length > 0 && (
            <>
              <div style={{
                fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: 'var(--forge-text-muted)',
                marginTop: '24px', marginBottom: '12px',
              }}>
                Historie pozvanek ({otherInvites.length})
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '14px',
              }}>
                {otherInvites.map((inv) => (
                  <MemberCard key={inv.id} user={inv} isInvite />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: Roles & Permissions */}
      {/* ============================================================ */}
      {tab === TABS.roles && (
        <div>
          {/* Role cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}>
            {ROLE_ORDER.map((role) => {
              const meta = getRoleMeta(role);
              return (
                <div key={role} style={{
                  backgroundColor: 'var(--forge-bg-surface)',
                  border: '1px solid var(--forge-border-default)',
                  borderRadius: 'var(--forge-radius-md)',
                  padding: '18px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      backgroundColor: meta.color, flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: 'var(--forge-font-heading)',
                      fontSize: '15px', fontWeight: 600,
                      color: 'var(--forge-text-primary)',
                    }}>
                      {meta.label}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--forge-font-body)',
                    fontSize: '12px', color: 'var(--forge-text-muted)',
                    lineHeight: 1.4,
                  }}>
                    {meta.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permissions matrix */}
          <div style={{
            fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--forge-text-muted)',
            marginBottom: '12px',
          }}>
            Matice opravneni
          </div>
          <PermissionsMatrix />
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: Activity */}
      {/* ============================================================ */}
      {tab === TABS.activity && (
        <div>
          <div style={{
            fontFamily: 'var(--forge-font-tech)', fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: 'var(--forge-text-muted)',
            marginBottom: '12px',
          }}>
            Posledni tymova aktivita ({teamActivity.length})
          </div>
          <ActivityLog entries={teamActivity} />
        </div>
      )}
    </div>
  );
}
