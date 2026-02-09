// Demo-only (Varianta A) Team & Access storage (users, invites) with seat limits.
// Uses localStorage and is tenant-scoped.

import { getTenantId } from './adminTenantStorage';
import { getPlanFeatures } from './adminBrandingWidgetStorage';
import { appendAuditEntry } from './adminAuditLogStorage';
import { storageAdapter } from '../lib/supabase/storageAdapter';
import { getStorageMode } from '../lib/supabase/featureFlags';
import { isSupabaseAvailable } from '../lib/supabase/client';

const USERS_KEY = (tenantId) => `modelpricer:${tenantId}:team_users`;
const INVITES_KEY = (tenantId) => `modelpricer:${tenantId}:team_invites`;

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function randomToken() {
  // Short, URL-safe-ish token for demo purposes.
  return `inv_${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 8)}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase());
}

function seedUsersIfNeeded(tenantId) {
  const raw = localStorage.getItem(USERS_KEY(tenantId));
  if (raw) return;
  const seeded = [
    {
      id: 'u_admin_demo',
      name: 'Admin',
      email: 'admin@modelpricer.demo',
      role: 'admin',
      status: 'active',
      lastLoginAt: nowIso(),
      createdAt: nowIso(),
    },
  ];
  localStorage.setItem(USERS_KEY(tenantId), JSON.stringify(seeded));
}

function seedInvitesIfNeeded(tenantId) {
  const raw = localStorage.getItem(INVITES_KEY(tenantId));
  if (raw) return;
  localStorage.setItem(INVITES_KEY(tenantId), JSON.stringify([]));
}

function readUsers(tenantId) {
  seedUsersIfNeeded(tenantId);
  return safeParse(localStorage.getItem(USERS_KEY(tenantId)), []);
}

function writeUsers(tenantId, users) {
  localStorage.setItem(USERS_KEY(tenantId), JSON.stringify(users));

  // Fire-and-forget Supabase dual-write
  const mode = getStorageMode('team_users');
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    storageAdapter.supabase.writeConfig('team_members', tenantId, 'team_users', users)
      .catch(err => console.warn('[teamAccess] Supabase users write failed:', err.message));
  }
}

function readInvites(tenantId) {
  seedInvitesIfNeeded(tenantId);
  const invites = safeParse(localStorage.getItem(INVITES_KEY(tenantId)), []);
  // Auto-expire.
  const now = Date.now();
  let changed = false;
  const updated = invites.map((i) => {
    if (i.status === 'pending' && i.expiresAt && new Date(i.expiresAt).getTime() < now) {
      changed = true;
      return { ...i, status: 'expired' };
    }
    return i;
  });
  if (changed) localStorage.setItem(INVITES_KEY(tenantId), JSON.stringify(updated));
  return updated;
}

function writeInvites(tenantId, invites) {
  localStorage.setItem(INVITES_KEY(tenantId), JSON.stringify(invites));

  // Fire-and-forget Supabase dual-write
  const mode = getStorageMode('team_invites');
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    storageAdapter.supabase.writeConfig('team_members', tenantId, 'team_invites', invites)
      .catch(err => console.warn('[teamAccess] Supabase invites write failed:', err.message));
  }
}

export function getTenantForTeam() {
  return getTenantId();
}

export function getSeatLimit(tenantId = getTenantId()) {
  const plan = getPlanFeatures?.(tenantId);
  const max = plan?.features?.max_users;
  // Default for demo (Starter)
  return Number.isFinite(max) ? max : 1;
}

export function getTeamUsers(tenantId = getTenantId()) {
  return readUsers(tenantId);
}

export function getTeamInvites(tenantId = getTenantId()) {
  return readInvites(tenantId);
}

export function getTeamSummary(tenantId = getTenantId()) {
  const users = readUsers(tenantId);
  const invites = readInvites(tenantId);
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const disabledUsers = users.filter((u) => u.status === 'disabled').length;
  const pendingInvites = invites.filter((i) => i.status === 'pending').length;
  return { activeUsers, disabledUsers, pendingInvites, seatLimit: getSeatLimit(tenantId) };
}

export function inviteUser(
  {
    email,
    role = 'operator',
    message = '',
    expiryDays = 7,
  },
  {
    tenantId = getTenantId(),
    actor = { id: 'u_admin_demo', email: 'admin@modelpricer.demo' },
    baseUrl = '',
  } = {}
) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) {
    return { ok: false, error: 'INVALID_EMAIL' };
  }
  if (!['admin', 'operator'].includes(role)) {
    return { ok: false, error: 'INVALID_ROLE' };
  }

  const users = readUsers(tenantId);
  const invites = readInvites(tenantId);

  const alreadyMember = users.some((u) => u.email.toLowerCase() === cleanEmail);
  const alreadyInvited = invites.some((i) => i.status === 'pending' && i.email.toLowerCase() === cleanEmail);
  if (alreadyMember) return { ok: false, error: 'ALREADY_MEMBER' };
  if (alreadyInvited) return { ok: false, error: 'ALREADY_INVITED' };

  const summary = getTeamSummary(tenantId);
  const usedSeats = summary.activeUsers + summary.pendingInvites;
  if (usedSeats >= summary.seatLimit) {
    return { ok: false, error: 'SEAT_LIMIT_REACHED', seatLimit: summary.seatLimit };
  }

  const token = randomToken();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
  const invite = {
    id: `inv_${Date.now()}`,
    tenantId,
    email: cleanEmail,
    role,
    message,
    token,
    createdAt,
    expiresAt,
    status: 'pending',
    createdByUserId: actor?.id || null,
  };

  const updatedInvites = [invite, ...invites];
  writeInvites(tenantId, updatedInvites);

  appendAuditEntry(
    {
      tenantId,
      actor,
      action: 'TEAM_INVITE_SENT',
      entityType: 'team.invite',
      entityId: invite.id,
      summary: `Invite sent to ${cleanEmail} (${role})`,
      diff: { after: { email: cleanEmail, role, status: 'pending', expiresAt } },
      metadata: { email: cleanEmail, role },
    }
  );

  const inviteLink = `${baseUrl || ''}/invite/accept?token=${encodeURIComponent(token)}`;
  return { ok: true, invite, inviteLink };
}

export function resendInvite(inviteId, { tenantId = getTenantId(), actor } = {}) {
  const invites = readInvites(tenantId);
  const idx = invites.findIndex((i) => i.id === inviteId);
  if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
  const current = invites[idx];
  if (current.status !== 'pending') return { ok: false, error: 'NOT_PENDING' };

  const next = {
    ...current,
    token: randomToken(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: nowIso(),
  };
  const updated = [...invites];
  updated[idx] = next;
  writeInvites(tenantId, updated);

  appendAuditEntry({
    tenantId,
    actor,
    action: 'TEAM_INVITE_RESENT',
    entityType: 'team.invite',
    entityId: inviteId,
    summary: `Invite resent to ${next.email}`,
    diff: { before: { token: current.token, expiresAt: current.expiresAt }, after: { token: next.token, expiresAt: next.expiresAt } },
    metadata: { email: next.email },
  });

  return { ok: true, invite: next };
}

export function revokeInvite(inviteId, { tenantId = getTenantId(), actor } = {}) {
  const invites = readInvites(tenantId);
  const idx = invites.findIndex((i) => i.id === inviteId);
  if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
  const current = invites[idx];
  if (current.status !== 'pending') return { ok: false, error: 'NOT_PENDING' };

  const next = { ...current, status: 'revoked', updatedAt: nowIso() };
  const updated = [...invites];
  updated[idx] = next;
  writeInvites(tenantId, updated);

  appendAuditEntry({
    tenantId,
    actor,
    action: 'TEAM_INVITE_REVOKED',
    entityType: 'team.invite',
    entityId: inviteId,
    summary: `Invite revoked for ${next.email}`,
    diff: { before: { status: current.status }, after: { status: next.status } },
    metadata: { email: next.email },
  });

  return { ok: true };
}

export function acceptInviteByToken(
  token,
  { tenantId = getTenantId(), name = '', actorEmail = null } = {}
) {
  const cleanToken = String(token || '').trim();
  if (!cleanToken) return { ok: false, error: 'MISSING_TOKEN' };

  const invites = readInvites(tenantId);
  const idx = invites.findIndex((i) => i.status === 'pending' && i.token === cleanToken);
  if (idx === -1) return { ok: false, error: 'INVALID_OR_EXPIRED' };
  const invite = invites[idx];
  if (invite.expiresAt && new Date(invite.expiresAt).getTime() < Date.now()) {
    const updated = [...invites];
    updated[idx] = { ...invite, status: 'expired', updatedAt: nowIso() };
    writeInvites(tenantId, updated);
    return { ok: false, error: 'INVITE_EXPIRED' };
  }

  const users = readUsers(tenantId);
  const existing = users.find((u) => u.email.toLowerCase() === invite.email.toLowerCase());
  let nextUsers = users;
  let newUser = existing;
  if (!existing) {
    newUser = {
      id: `u_${Math.random().toString(36).slice(2, 10)}`,
      name: String(name || '').trim() || invite.email.split('@')[0],
      email: invite.email,
      role: invite.role,
      status: 'active',
      lastLoginAt: null,
      createdAt: nowIso(),
    };
    nextUsers = [newUser, ...users];
    writeUsers(tenantId, nextUsers);
  }

  const updatedInvites = [...invites];
  updatedInvites[idx] = { ...invite, status: 'accepted', acceptedAt: nowIso(), acceptedByEmail: actorEmail };
  writeInvites(tenantId, updatedInvites);

  appendAuditEntry({
    tenantId,
    actor: { id: newUser?.id || null, email: actorEmail || invite.email },
    action: 'TEAM_INVITE_ACCEPTED',
    entityType: 'team.invite',
    entityId: invite.id,
    summary: `Invite accepted: ${invite.email} (${invite.role})`,
    diff: { before: { status: 'pending' }, after: { status: 'accepted' } },
    metadata: { email: invite.email, role: invite.role },
  });

  return { ok: true, user: newUser, invite: updatedInvites[idx] };
}

export function updateUserRole(userId, role, { tenantId = getTenantId(), actor } = {}) {
  if (!['admin', 'operator'].includes(role)) return { ok: false, error: 'INVALID_ROLE' };
  const users = readUsers(tenantId);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
  const current = users[idx];
  const next = { ...current, role, updatedAt: nowIso() };
  const updated = [...users];
  updated[idx] = next;
  writeUsers(tenantId, updated);

  appendAuditEntry({
    tenantId,
    actor,
    action: 'TEAM_ROLE_CHANGED',
    entityType: 'team.user',
    entityId: userId,
    summary: `Role changed: ${current.email} (${current.role} → ${role})`,
    diff: { before: { role: current.role }, after: { role } },
    metadata: { email: current.email },
  });
  return { ok: true, user: next };
}

export function setUserEnabled(userId, enabled, { tenantId = getTenantId(), actor } = {}) {
  const users = readUsers(tenantId);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { ok: false, error: 'NOT_FOUND' };
  const current = users[idx];
  const nextStatus = enabled ? 'active' : 'disabled';
  const next = { ...current, status: nextStatus, updatedAt: nowIso() };
  const updated = [...users];
  updated[idx] = next;
  writeUsers(tenantId, updated);

  appendAuditEntry({
    tenantId,
    actor,
    action: enabled ? 'TEAM_USER_ENABLED' : 'TEAM_USER_DISABLED',
    entityType: 'team.user',
    entityId: userId,
    summary: `${enabled ? 'Enabled' : 'Disabled'} user: ${current.email}`,
    diff: { before: { status: current.status }, after: { status: nextStatus } },
    metadata: { email: current.email },
  });

  return { ok: true, user: next };
}

export function removeUser(userId, { tenantId = getTenantId(), actor } = {}) {
  const users = readUsers(tenantId);
  const current = users.find((u) => u.id === userId);
  const updated = users.filter((u) => u.id !== userId);
  if (!current) return { ok: false, error: 'NOT_FOUND' };
  writeUsers(tenantId, updated);

  appendAuditEntry({
    tenantId,
    actor,
    action: 'TEAM_USER_REMOVED',
    entityType: 'team.user',
    entityId: userId,
    summary: `Removed user: ${current.email}`,
    diff: { before: current, after: null },
    metadata: { email: current.email },
  });
  return { ok: true };
}

// ------------------------------------------------------------
// Compatibility aliases (so UI can import stable names)
// These map the UI-friendly names to the internal demo storage API.
// ------------------------------------------------------------

/** UI alias: createInvite({ email, role, message?, actor? }) */
export const createInvite = inviteUser;

/** UI alias: deleteInvite(inviteId, ctx) */
export const deleteInvite = revokeInvite;

/** UI alias: changeUserRole(userId, role, ctx) */
export const changeUserRole = updateUserRole;

/** UI alias: disableUser(userId, ctx) */
export function disableUser(userId, ctx = {}) {
  return setUserEnabled(userId, false, ctx);
}

/** UI alias: enableUser(userId, ctx) */
export function enableUser(userId, ctx = {}) {
  return setUserEnabled(userId, true, ctx);
}

/** UI alias: deleteUser(userId, ctx) */
export const deleteUser = removeUser;

/**
 * UI helper: getInviteByToken(token)
 * Returns a sanitized invite payload for the acceptance page.
 */
export function getInviteByToken(token, { tenantId = getTenantId() } = {}) {
  const invites = readInvites(tenantId);
  const inv = invites.find((i) => i.token === token);
  if (!inv) return null;
  const expired = inv.expiresAt ? new Date(inv.expiresAt).getTime() < Date.now() : false;
  const status = expired ? 'expired' : inv.status;
  return {
    id: inv.id,
    tenantId,
    email: inv.email,
    role: inv.role,
    status,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  };
}

/**
 * UI alias: acceptInviteToken({ token, name })
 * Finds the invite by token in the current tenant and accepts it.
 */
export function acceptInviteToken({ token, name }, ctx = {}) {
  const tenantId = ctx.tenantId || getTenantId();
  // acceptInviteByToken performs validation + status updates.
  return acceptInviteByToken({ tenantId, token, name }, ctx);
}
