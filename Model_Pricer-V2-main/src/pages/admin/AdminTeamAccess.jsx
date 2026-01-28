import React, { useMemo, useState } from 'react';
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
      return 'bg-gray-50 text-gray-800 border border-gray-200';
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
    <div className="min-h-screen bg-white text-gray-900">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.teamAccess')}</h1>
            <p className="text-gray-600 mt-1">
              Správa uživatelů v tenantovi, role/opr... (Varianta A demo)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-600">Seat limit</div>
              <div className="text-sm font-semibold">{seatUsed}/{seatLimit}</div>
            </div>
              <button
                onClick={() => setInviteOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
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
            className={`px-4 py-2 rounded-xl text-sm border transition ${
              tab === TABS.users ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setTab(TABS.roles)}
            className={`px-4 py-2 rounded-xl text-sm border transition ${
              tab === TABS.roles ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Roles & Permissions
          </button>
          <button
            onClick={() => setTab(TABS.audit)}
            className={`px-4 py-2 rounded-xl text-sm border transition ${
              tab === TABS.audit ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
          >
            Audit Log
          </button>
        </div>

        {/* Users tab */}
        {tab === TABS.users && (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Active users</div>
                <div className="text-2xl font-bold mt-1">{summary.activeUsers}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Pending invites</div>
                <div className="text-2xl font-bold mt-1">{summary.pendingInvites}</div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                <div className="text-sm text-gray-600">Disabled users</div>
                <div className="text-2xl font-bold mt-1">{summary.disabledUsers}</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Users & Invites</div>
                  <div className="text-xs text-gray-600">Invite = demo: copy link & accept</div>
                </div>
                <button
            onClick={() => setInviteOpen(true)}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 text-white text-sm font-semibold shadow-sm"
          >
            Invite user
          </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-600">
                    <tr className="text-left">
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Last login</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-gray-200">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{u.name || '—'}</div>
                          <div className="text-gray-600 text-xs">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              confirmAnd('Change role?', () => changeUserRole(u.id, e.target.value))
                            }
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1"
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
                        <td className="px-4 py-3 text-gray-700">{formatDate(u.last_login_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {u.status === 'active' ? (
              <button
                onClick={() => confirmAnd('Disable user?', () => disableUser(u.id))}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={() => confirmAnd('Enable user?', () => enableUser(u.id))}
                className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-medium"
              >
                Enable
              </button>
            )}
                            <button
              onClick={() =>
                confirmAnd('Remove user from tenant?', () => deleteUser(u.id))
              }
              className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium"
            >
              Remove
            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {invites.map((inv) => (
                      <tr key={inv.id} className="border-t border-gray-200">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{inv.email}</div>
                          <div className="text-gray-600 text-xs">Invite expires: {formatDate(inv.expires_at)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-800">{inv.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-lg text-xs ${badgeClass(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">—</td>
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
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium"
                >
                  Copy link
                </button>
                                <button
                  onClick={() => {
                    confirmAnd('Resend invite (new token)?', () => resendInvite(inv.id));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium"
                >
                  Resend
                </button>
                                <button
                  onClick={() =>
                    confirmAnd('Revoke invite?', () => deleteInvite(inv.id))
                  }
                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-medium"
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
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-medium"
                >
                  Simulate accept
                </button>
                              </>
                            )}
                            {inv.status !== 'pending' && (
                              <span className="text-gray-500">No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {users.length === 0 && invites.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-600">
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
              <div key={role.name} className="rounded-2xl bg-gray-50 border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold">{role.name}</div>
                    <div className="text-gray-600 text-sm mt-1">{role.description}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 border border-gray-200">MVP</span>
                </div>
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-2">Permissions</div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-800"
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
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-600 mb-1">Search</div>
                  <input
                    value={auditQ}
                    onChange={(e) => setAuditQ(e.target.value)}
                    placeholder="email, action, entity..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Actor</div>
                  <select
                    value={auditActor}
                    onChange={(e) => setAuditActor(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
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
                  <div className="text-xs text-gray-600 mb-1">Entity</div>
                  <select
                    value={auditEntity}
                    onChange={(e) => setAuditEntity(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
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
                  <div className="text-xs text-gray-600 mb-1">Action</div>
                  <input
                    value={auditAction}
                    onChange={(e) => setAuditAction(e.target.value)}
                    placeholder="e.g. TEAM_INVITE_SENT"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Date from</div>
                  <input
                    type="date"
                    value={auditDateFrom}
                    onChange={(e) => setAuditDateFrom(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Date to</div>
                  <input
                    type="date"
                    value={auditDateTo}
                    onChange={(e) => setAuditDateTo(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Audit log</div>
                  <div className="text-xs text-gray-600">Entries: {auditEntries.length}</div>
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
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm"
                >
                  Reset filters
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-gray-600">
                    <tr className="text-left">
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Actor</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">Summary</th>
                      <th className="px-4 py-3">...</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditEntries.map((e) => (
                      <tr key={e.id} className="border-t border-gray-200">
                        <td className="px-4 py-3 text-gray-700">{formatDate(e.timestamp)}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{e.actor_email || 'System'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 border border-gray-200">
                            {e.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {e.entity_type}
                          {e.entity_id ? `:${e.entity_id}` : ''}
                        </td>
                        <td className="px-4 py-3 text-gray-800">{e.summary || '—'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setAuditDetail(e)}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                    {auditEntries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Invite user</div>
                <div className="text-sm text-gray-600 mt-1">
                  Seats used: {seatUsed}/{seatLimit}
                </div>
              </div>
              <button
                onClick={() => {
                  setInviteOpen(false);
                  setLastInviteLink('');
                  setInviteError('');
                }}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {inviteError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {inviteError}
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Email</div>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Role</div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Message (optional)</div>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              {lastInviteLink && (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Invite link (demo)</div>
                  <div className="text-sm break-all">{lastInviteLink}</div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => copyToClipboard(lastInviteLink)}
                      className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm"
                    >
                      Copy link
                    </button>
                    <a
                      href={lastInviteLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm"
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
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-sm"
              >
                Close
              </button>
              <button
                onClick={handleInviteSend}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit detail modal */}
      {auditDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold">Audit details</div>
                <div className="text-sm text-gray-600 mt-1">{auditDetail.summary}</div>
              </div>
              <button
                onClick={() => setAuditDetail(null)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                <div className="text-xs text-gray-600">Meta</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div><span className="text-gray-600">Time:</span> {formatDate(auditDetail.timestamp)}</div>
                  <div><span className="text-gray-600">Actor:</span> {auditDetail.actor_email || 'System'}</div>
                  <div><span className="text-gray-600">Action:</span> {auditDetail.action}</div>
                  <div><span className="text-gray-600">Entity:</span> {auditDetail.entity_type}{auditDetail.entity_id ? `:${auditDetail.entity_id}` : ''}</div>
                  <div><span className="text-gray-600">IP:</span> {auditDetail.ip_address || '—'}</div>
                  <div><span className="text-gray-600">User agent:</span> {auditDetail.user_agent || '—'}</div>
                </div>
              </div>
              <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                <div className="text-xs text-gray-600">Metadata</div>
                <pre className="mt-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl p-3 overflow-auto max-h-64">
{JSON.stringify(auditDetail.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-4">
              <div className="text-xs text-gray-600">Diff</div>
              <pre className="mt-2 text-xs bg-gray-50/70 border border-gray-200 rounded-xl p-3 overflow-auto max-h-72">
{JSON.stringify(auditDetail.diff || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
