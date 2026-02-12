import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import Icon from '../../components/AppIcon';
import {
  acceptInviteToken,
  changeUserRole,
  createInvite,
  deleteInvite,
  deleteUser,
  disableUser,
  enableUser,
  getSeatLimit,
  getTeamInvites,
  getTeamSummary,
  getTeamUsers,
  resendInvite,
} from '../../utils/adminTeamAccessStorage';
import {
  getAuditEntries,
  searchAuditEntries,
} from '../../utils/adminAuditLogStorage';

const TABS = {
  users: 'users',
  roles: 'roles',
  audit: 'audit',
};

function badgeClass(status) {
  switch (status) {
    case 'active':
      return 'bg-green-600/20 text-green-200 border border-green-500/30';
    case 'disabled':
      return 'bg-gray-600/20 text-gray-200 border border-gray-500/30';
    case 'invited':
    case 'pending':
      return 'bg-yellow-600/20 text-yellow-200 border border-yellow-500/30';
    case 'revoked':
      return 'bg-red-600/20 text-red-200 border border-red-500/30';
    default:
      return 'bg-gray-600/20 text-gray-200 border border-gray-500/30';
  }
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function copyToClipboard(text) {
  try {
    navigator.clipboard?.writeText(text);
  } catch {
    // ignore
  }
}

export default function AdminTeamAccess() {
  const { t } = useLanguage();
  const [tab, setTab] = useState(TABS.users);
  const [refreshKey, setRefreshKey] = useState(0);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operator');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [lastInviteLink, setLastInviteLink] = useState('');

  const users = useMemo(() => getTeamUsers(), [refreshKey]);
  const invites = useMemo(() => getTeamInvites(), [refreshKey]);
  const summary = useMemo(() => getTeamSummary(), [refreshKey]);
  const seatLimit = useMemo(() => getSeatLimit(), [refreshKey]);

  // AUDIT
  const [auditQ, setAuditQ] = useState('');
  const [auditActor, setAuditActor] = useState('');
  const [auditEntity, setAuditEntity] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditDetail, setAuditDetail] = useState(null);

  const inviteOverlayRef = useRef(null);
  const auditDetailOverlayRef = useRef(null);

  // Scroll containment for invite modal — always block, no scrollable content
  useEffect(() => {
    if (!inviteOpen) return;
    document.body.style.overflow = 'hidden';
    const el = inviteOverlayRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); e.stopPropagation(); };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
    };
  }, [inviteOpen]);

  // Scroll containment for audit detail modal — smooth easing
  useEffect(() => {
    if (!auditDetail) return;
    document.body.style.overflow = 'hidden';
    const overlayEl = auditDetailOverlayRef.current;
    if (!overlayEl) return;

    let targetY = 0;
    let rafId = null;

    const animate = () => {
      const inner = overlayEl.querySelector('.w-full');
      if (!inner) { rafId = null; return; }
      const diff = targetY - inner.scrollTop;
      if (Math.abs(diff) < 0.5) { inner.scrollTop = targetY; rafId = null; return; }
      inner.scrollTop += diff * 0.18;
      rafId = requestAnimationFrame(animate);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const inner = overlayEl.querySelector('.w-full');
      if (!inner) return;
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 40;
      if (e.deltaMode === 2) delta *= inner.clientHeight;
      if (rafId === null) targetY = inner.scrollTop;
      const maxScroll = inner.scrollHeight - inner.clientHeight;
      targetY = Math.max(0, Math.min(maxScroll, targetY + delta));
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    overlayEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      overlayEl.removeEventListener('wheel', handleWheel);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.style.overflow = '';
    };
  }, [auditDetail]);

  const actors = useMemo(() => {
    const set = new Set(getAuditEntries().map((e) => e.actor_email).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [refreshKey]);

  const auditEntries = useMemo(() => {
    return searchAuditEntries({
      q: auditQ,
      actor_email: auditActor || undefined,
      entity_type: auditEntity || undefined,
      action: auditAction || undefined,
      date_from: auditDateFrom || undefined,
      date_to: auditDateTo || undefined,
    });
  }, [auditQ, auditActor, auditEntity, auditAction, auditDateFrom, auditDateTo, refreshKey]);

  const seatUsed = summary.activeUsers + summary.pendingInvites;

  const roleDefinition = useMemo(
    () => [
      {
        name: 'Admin',
        description: 'Plný přístup + správa týmu + audit log',
        permissions: [
          'dashboard.read',
          'pricing.read',
          'pricing.write',
          'fees.read',
          'fees.write',
          'parameters.read',
          'parameters.write',
          'presets.read',
          'presets.write',
          'orders.read',
          'orders.write_status',
          'orders.export',
          'branding.read',
          'branding.write',
          'widget.read',
          'widget.write',
          'team.read',
          'team.write',
          'audit.read',
        ],
      },
      {
        name: 'Operator',
        description: 'Práce s objednávkami + read-only konfigurace',
        permissions: [
          'dashboard.read',
          'orders.read',
          'orders.write_status',
          'orders.export',
          'pricing.read',
          'fees.read',
          'parameters.read',
          'presets.read',
          'branding.read',
          'widget.read',
        ],
      },
    ],
    []
  );

  const handleInviteSend = () => {
    setInviteError('');
    try {
      const invite = createInvite({ email: inviteEmail, role: inviteRole, message: inviteMessage });
      const link = `${window.location.origin}/invite/accept?token=${encodeURIComponent(invite.token)}`;
      setLastInviteLink(link);
      setInviteEmail('');
      setInviteMessage('');
      setInviteRole('operator');
      setInviteOpen(true); // keep open to show link
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setInviteError(e?.message || 'Invite failed');
    }
  };

  const confirmAnd = (message, fn) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm(message);
    if (!ok) return;
    fn();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--forge-bg-void)', color: 'var(--forge-text-primary)' }}>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--forge-text-primary)' }}>{t('admin.teamAccess')}</h1>
            <p className="mt-1" style={{ color: 'var(--forge-text-secondary)' }}>
              Správa uživatelů v tenantovi, role/opr... (Varianta A demo)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
              <div className="text-xs" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Seat limit</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--forge-text-primary)' }}>{seatUsed}/{seatLimit}</div>
            </div>
              <button
                onClick={() => setInviteOpen(true)}
                className="px-4 py-2 rounded-xl transition text-sm font-semibold flex items-center gap-2 shadow-sm"
                style={{ background: 'var(--forge-accent-primary)', color: '#0A0E17', border: '1px solid var(--forge-accent-primary)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
              <Icon name="userPlus" size={18} />
              Invite user
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setTab(TABS.users)}
            className="px-4 py-2 rounded-xl text-sm border transition"
            style={{
              background: tab === TABS.users ? 'var(--forge-bg-elevated)' : 'var(--forge-bg-surface)',
              borderColor: tab === TABS.users ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)',
              color: tab === TABS.users ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
            }}
          >
            Users
          </button>
          <button
            onClick={() => setTab(TABS.roles)}
            className="px-4 py-2 rounded-xl text-sm border transition"
            style={{
              background: tab === TABS.roles ? 'var(--forge-bg-elevated)' : 'var(--forge-bg-surface)',
              borderColor: tab === TABS.roles ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)',
              color: tab === TABS.roles ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
            }}
          >
            Roles & Permissions
          </button>
          <button
            onClick={() => setTab(TABS.audit)}
            className="px-4 py-2 rounded-xl text-sm border transition"
            style={{
              background: tab === TABS.audit ? 'var(--forge-bg-elevated)' : 'var(--forge-bg-surface)',
              borderColor: tab === TABS.audit ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)',
              color: tab === TABS.audit ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
            }}
          >
            Audit Log
          </button>
        </div>

        {/* Users tab */}
        {tab === TABS.users && (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl p-4" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
                <div className="text-sm" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>Active users</div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--forge-accent-primary)' }}>{summary.activeUsers}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
                <div className="text-sm" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>Pending invites</div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--forge-text-primary)' }}>{summary.pendingInvites}</div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
                <div className="text-sm" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>Disabled users</div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--forge-text-primary)' }}>{summary.disabledUsers}</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-elevated)' }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--forge-text-primary)' }}>Users & Invites</div>
                  <div className="text-xs" style={{ color: 'var(--forge-text-muted)' }}>Invite = demo: copy link & accept</div>
                </div>
                <button
            onClick={() => setInviteOpen(true)}
            className="px-3 py-2 rounded-xl text-sm font-semibold shadow-sm"
            style={{ background: 'var(--forge-accent-primary)', color: '#0A0E17', border: '1px solid var(--forge-accent-primary)' }}
          >
            Invite user
          </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ background: 'var(--forge-bg-elevated)' }}>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>User</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Last login</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id} style={{ borderTop: '1px solid var(--forge-border-default)', background: idx % 2 === 0 ? 'var(--forge-bg-surface)' : 'var(--forge-bg-void)' }}>
                        <td className="px-4 py-3">
                          <div className="font-semibold" style={{ color: 'var(--forge-text-primary)' }}>{u.name || '—'}</div>
                          <div className="text-xs" style={{ color: 'var(--forge-text-muted)' }}>{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              confirmAnd('Change role?', () => changeUserRole(u.id, e.target.value))
                            }
                            className="rounded-lg px-2 py-1"
                            style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                          >
                            <option value="admin">Admin</option>
                            <option value="operator">Operator</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-lg text-xs ${badgeClass(u.status)}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--forge-text-secondary)' }}>{formatDate(u.last_login_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {u.status === 'active' ? (
              <button
                onClick={() => confirmAnd('Disable user?', () => disableUser(u.id))}
                className="px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', color: 'var(--forge-accent-primary)' }}
              >
                Disable
              </button>
            ) : (
              <button
                onClick={() => confirmAnd('Enable user?', () => enableUser(u.id))}
                className="px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', color: 'var(--forge-success)' }}
              >
                Enable
              </button>
            )}
                            <button
              onClick={() =>
                confirmAnd('Remove user from tenant?', () => deleteUser(u.id))
              }
              className="px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)', color: 'var(--forge-error)' }}
            >
              Remove
            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {invites.map((inv, idx) => (
                      <tr key={inv.id} style={{ borderTop: '1px solid var(--forge-border-default)', background: (users.length + idx) % 2 === 0 ? 'var(--forge-bg-surface)' : 'var(--forge-bg-void)' }}>
                        <td className="px-4 py-3">
                          <div className="font-semibold" style={{ color: 'var(--forge-text-primary)' }}>{inv.email}</div>
                          <div className="text-xs" style={{ color: 'var(--forge-text-muted)' }}>Invite expires: {formatDate(inv.expires_at)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ color: 'var(--forge-text-secondary)' }}>{inv.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-lg text-xs ${badgeClass(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--forge-text-secondary)' }}>—</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {inv.status === 'pending' && (
                              <>
                                <button
                  onClick={() => {
                    const link = `${window.location.origin}/invite/accept?token=${encodeURIComponent(
                      inv.token
                    )}`;
                    copyToClipboard(link);
                  }}
                  className="px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', color: 'var(--forge-accent-primary)' }}
                >
                  Copy link
                </button>
                                <button
                  onClick={() => {
                    confirmAnd('Resend invite (new token)?', () => resendInvite(inv.id));
                  }}
                  className="px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', color: 'var(--forge-accent-primary)' }}
                >
                  Resend
                </button>
                                <button
                  onClick={() =>
                    confirmAnd('Revoke invite?', () => deleteInvite(inv.id))
                  }
                  className="px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)', color: 'var(--forge-error)' }}
                >
                  Revoke
                </button>
                                <button
                  onClick={() => {
                    // DEMO: accept without leaving admin
                    confirmAnd('Simulate accept invite?', () =>
                      acceptInviteToken(inv.token, { name: inv.email.split('@')[0] })
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', color: 'var(--forge-success)' }}
                >
                  Simulate accept
                </button>
                              </>
                            )}
                            {inv.status !== 'pending' && (
                              <span style={{ color: 'var(--forge-text-muted)' }}>No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {users.length === 0 && invites.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center" style={{ color: 'var(--forge-text-muted)' }}>
                          No users.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Roles tab */}
        {tab === TABS.roles && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleDefinition.map((role) => (
              <div key={role.name} className="rounded-2xl p-5" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold" style={{ color: 'var(--forge-text-primary)' }}>{role.name}</div>
                    <div className="text-sm mt-1" style={{ color: 'var(--forge-text-secondary)' }}>{role.description}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>MVP</span>
                </div>
                <div className="mt-4">
                  <div className="text-xs mb-2" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Permissions</div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-tech)' }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audit tab */}
        {tab === TABS.audit && (
          <div className="mt-6">
            <div className="rounded-2xl p-4" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Search</div>
                  <input
                    value={auditQ}
                    onChange={(e) => setAuditQ(e.target.value)}
                    placeholder="email, action, entity..."
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                  />
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actor</div>
                  <select
                    value={auditActor}
                    onChange={(e) => setAuditActor(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                  >
                    <option value="">All</option>
                    {actors.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Entity</div>
                  <select
                    value={auditEntity}
                    onChange={(e) => setAuditEntity(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                  >
                    <option value="">All</option>
                    <option value="team">team</option>
                    <option value="orders">orders</option>
                    <option value="pricing">pricing</option>
                    <option value="fees">fees</option>
                    <option value="parameters">parameters</option>
                    <option value="presets">presets</option>
                    <option value="branding">branding</option>
                    <option value="widget">widget</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action</div>
                  <input
                    value={auditAction}
                    onChange={(e) => setAuditAction(e.target.value)}
                    placeholder="e.g. TEAM_INVITE_SENT"
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                  />
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date from</div>
                  <input
                    type="date"
                    value={auditDateFrom}
                    onChange={(e) => setAuditDateFrom(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                  />
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Date to</div>
                  <input
                    type="date"
                    value={auditDateTo}
                    onChange={(e) => setAuditDateTo(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-elevated)' }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--forge-text-primary)' }}>Audit log</div>
                  <div className="text-xs" style={{ color: 'var(--forge-text-muted)' }}>Entries: {auditEntries.length}</div>
                </div>
                <button
                  onClick={() => {
                    setAuditQ('');
                    setAuditActor('');
                    setAuditEntity('');
                    setAuditAction('');
                    setAuditDateFrom('');
                    setAuditDateTo('');
                  }}
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)' }}
                >
                  Reset filters
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left" style={{ background: 'var(--forge-bg-elevated)' }}>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Time</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actor</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Entity</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary</th>
                      <th className="px-4 py-3" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>...</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditEntries.map((e, idx) => (
                      <tr key={e.id} style={{ borderTop: '1px solid var(--forge-border-default)', background: idx % 2 === 0 ? 'var(--forge-bg-surface)' : 'var(--forge-bg-void)' }}>
                        <td className="px-4 py-3" style={{ color: 'var(--forge-text-secondary)' }}>{formatDate(e.timestamp)}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold" style={{ color: 'var(--forge-text-primary)' }}>{e.actor_email || 'System'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-tech)' }}>
                            {e.action}
                          </span>
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--forge-text-secondary)' }}>
                          {e.entity_type}
                          {e.entity_id ? `:${e.entity_id}` : ''}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--forge-text-primary)' }}>{e.summary || '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setAuditDetail(e)}
                            className="px-3 py-1.5 rounded-lg"
                            style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {auditEntries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center" style={{ color: 'var(--forge-text-muted)' }}>
                          No audit entries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div ref={inviteOverlayRef} className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-lg rounded-2xl p-5" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--forge-text-primary)' }}>Invite user</div>
                <div className="text-sm mt-1" style={{ color: 'var(--forge-text-muted)' }}>
                  Seats used: {seatUsed}/{seatLimit}
                </div>
              </div>
              <button
                onClick={() => {
                  setInviteOpen(false);
                  setLastInviteLink('');
                  setInviteError('');
                }}
                className="p-2 rounded-xl"
                style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)' }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {inviteError && (
              <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)', color: 'var(--forge-error)' }}>
                {inviteError}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</div>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Message (optional)</div>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)' }}
                />
              </div>

              {lastInviteLink && (
                <div className="p-3 rounded-xl" style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)' }}>
                  <div className="text-xs mb-1" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Invite link (demo)</div>
                  <div className="text-sm break-all" style={{ color: 'var(--forge-accent-primary)' }}>{lastInviteLink}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => copyToClipboard(lastInviteLink)}
                      className="px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)' }}
                    >
                      Copy link
                    </button>
                    <a
                      href={lastInviteLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl text-sm"
                      style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)', textDecoration: 'none' }}
                    >
                      Open accept page
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setInviteOpen(false);
                  setLastInviteLink('');
                  setInviteError('');
                }}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)' }}
              >
                Close
              </button>
              <button
                onClick={handleInviteSend}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--forge-accent-primary)', color: '#0A0E17', border: '1px solid var(--forge-accent-primary)' }}
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit detail modal */}
      {auditDetail && (
        <div ref={auditDetailOverlayRef} className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.65)' }}>
          <div className="w-full max-w-3xl rounded-2xl p-5" style={{ background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--forge-text-primary)' }}>Audit details</div>
                <div className="text-sm mt-1" style={{ color: 'var(--forge-text-secondary)' }}>{auditDetail.summary}</div>
              </div>
              <button
                onClick={() => setAuditDetail(null)}
                className="p-2 rounded-xl"
                style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)' }}
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl p-4" style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)' }}>
                <div className="text-xs" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Meta</div>
                <div className="mt-2 space-y-1 text-sm" style={{ color: 'var(--forge-text-primary)' }}>
                  <div><span style={{ color: 'var(--forge-text-muted)' }}>Time:</span> {formatDate(auditDetail.timestamp)}</div>
                  <div><span style={{ color: 'var(--forge-text-muted)' }}>Actor:</span> {auditDetail.actor_email || 'System'}</div>
                  <div><span style={{ color: 'var(--forge-text-muted)' }}>Action:</span> {auditDetail.action}</div>
                  <div><span style={{ color: 'var(--forge-text-muted)' }}>Entity:</span> {auditDetail.entity_type}{auditDetail.entity_id ? `:${auditDetail.entity_id}` : ''}</div>
                  <div><span style={{ color: 'var(--forge-text-muted)' }}>IP:</span> {auditDetail.ip_address || '—'}</div>
                  <div><span style={{ color: 'var(--forge-text-muted)' }}>User agent:</span> {auditDetail.user_agent || '—'}</div>
                </div>
              </div>
              <div className="rounded-2xl p-4" style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)' }}>
                <div className="text-xs" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Metadata</div>
                <pre className="mt-2 text-xs rounded-xl p-3 overflow-auto max-h-64" style={{ background: 'var(--forge-bg-void)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)' }}>
{JSON.stringify(auditDetail.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4 rounded-2xl p-4" style={{ background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)' }}>
              <div className="text-xs" style={{ color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-tech)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Diff</div>
              <pre className="mt-2 text-xs rounded-xl p-3 overflow-auto max-h-72" style={{ background: 'var(--forge-bg-void)', border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)' }}>
{JSON.stringify(auditDetail.diff || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
