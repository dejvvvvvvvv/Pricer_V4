// Demo-only (Varianta A) audit log storage.
// Uses localStorage and is tenant-scoped.
//
// NOTE: In Varianta B, this becomes server-side (DB) with enforcement + pagination.

import { getTenantId } from './adminTenantStorage';
import { storageAdapter } from '../lib/supabase/storageAdapter';
import { getStorageMode } from '../lib/supabase/featureFlags';
import { isSupabaseAvailable } from '../lib/supabase/client';

const AUDIT_KEY = (tenantId) => `modelpricer:${tenantId}:audit_log`;

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

function randomId(prefix = 'aud') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`;
}

export function getAuditEntries(tenantId = getTenantId()) {
  const raw = localStorage.getItem(AUDIT_KEY(tenantId));
  const parsed = safeParse(raw, []);

  // Backward-compatible normalization:
  // older builds may have stored an object like { entries: [...] } or { items: [...] }.
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.entries)
      ? parsed.entries
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];

  return arr
    .slice()
    .sort((a, b) => (b?.timestamp || '').localeCompare(a?.timestamp || ''));
}

export function appendAuditEntry(
  entry,
  {
    tenantId = getTenantId(),
    actor = { id: 'demo-admin', email: 'admin@demo.local', name: 'Admin' },
    ip_address = '127.0.0.1',
    user_agent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  } = {}
) {
  const entries = getAuditEntries(tenantId);
  const full = {
    id: entry?.id || randomId(),
    tenant_id: tenantId,
    actor_user_id: actor?.id || 'demo-admin',
    actor_email: actor?.email || 'admin@demo.local',
    actor_name: actor?.name || 'Admin',
    action: entry?.action || 'UNKNOWN',
    entity_type: entry?.entity_type || 'system',
    entity_id: entry?.entity_id ?? null,
    timestamp: entry?.timestamp || nowIso(),
    ip_address,
    user_agent,
    summary: entry?.summary || '',
    diff: entry?.diff ?? null,
    metadata: entry?.metadata ?? null,
  };

  // Retention: keep last ~2000 entries in demo.
  const next = [full, ...entries].slice(0, 2000);
  localStorage.setItem(AUDIT_KEY(tenantId), JSON.stringify(next));

  // Fire-and-forget Supabase dual-write
  const mode = getStorageMode('audit_log');
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    storageAdapter.supabase.insert('audit_log', {
      tenant_id: tenantId,
      action: full.action,
      entity_type: full.entity_type,
      entity_id: full.entity_id,
      actor: { id: full.actor_user_id, email: full.actor_email, name: full.actor_name },
      details: { summary: full.summary, diff: full.diff, metadata: full.metadata },
      ip_address: full.ip_address,
      user_agent: full.user_agent,
      created_at: full.timestamp,
    }).catch(err => console.warn('[auditLog] Supabase insert failed:', err.message));
  }

  return full;
}

export function clearAuditLog(tenantId = getTenantId()) {
  localStorage.removeItem(AUDIT_KEY(tenantId));
}

export function filterAuditEntries(
  entries,
  {
    q = '',
    actor = 'all',
    entity = 'all',
    action = 'all',
    dateFrom = '',
    dateTo = '',
  } = {}
) {
  const query = (q || '').trim().toLowerCase();
  const from = dateFrom ? new Date(dateFrom).getTime() : null;
  const to = dateTo ? new Date(dateTo).getTime() : null;

  const list = Array.isArray(entries)
    ? entries
    : Array.isArray(entries?.entries)
      ? entries.entries
      : Array.isArray(entries?.items)
        ? entries.items
        : [];

  return list.filter((e) => {
    if (!e) return false;

    if (actor !== 'all' && e.actor_email !== actor && e.actor_user_id !== actor) return false;
    if (entity !== 'all' && e.entity_type !== entity) return false;
    if (action !== 'all' && e.action !== action) return false;

    if (from !== null || to !== null) {
      const ts = e.timestamp ? new Date(e.timestamp).getTime() : 0;
      if (from !== null && ts < from) return false;
      if (to !== null && ts > to) return false;
    }

    if (!query) return true;
    const hay = [
      e.actor_email,
      e.actor_name,
      e.action,
      e.entity_type,
      e.summary,
      JSON.stringify(e.metadata || {}),
    ]
      .join(' ')
      .toLowerCase();

    return hay.includes(query);
  });
}

// Compatibility alias
export const searchAuditEntries = filterAuditEntries;

