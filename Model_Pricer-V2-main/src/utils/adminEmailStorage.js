/*
  Admin Email — Tenant-scoped Storage (V1)
  -----------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for email notification configuration.
  - Define provider, sender info, event triggers and template references.

  Notes:
  - No legacy migration needed — this is a new namespace.
  - Templates are stored as references (template_id); actual content is managed elsewhere.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_EMAIL_V1 = 'email:v1';
const SCHEMA_VERSION = 1;

function nowIso() {
  return new Date().toISOString();
}

function parseBool(v, fallback = false) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return fallback;
}

function uuid(prefix = 'id') {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function normalizeTrigger(trigger, idx = 0) {
  const t = trigger && typeof trigger === 'object' ? trigger : {};

  return {
    event: String(t.event || '').trim() || `event_${idx}`,
    enabled: parseBool(t.enabled, false),
    template_id: String(t.template_id || '').trim() || '',
  };
}

export function getDefaultEmailConfigV1() {
  return {
    schema_version: SCHEMA_VERSION,
    provider: 'none',
    sender_name: '',
    sender_email: '',
    triggers: [
      { event: 'order_confirmed', enabled: false, template_id: 'order_confirmed' },
      { event: 'order_printing', enabled: false, template_id: 'order_printing' },
      { event: 'order_shipped', enabled: false, template_id: 'order_shipped' },
      { event: 'order_completed', enabled: false, template_id: 'order_completed' },
    ],
    templates: {},
    updated_at: nowIso(),
  };
}

export function normalizeEmailConfigV1(input) {
  const src = input && typeof input === 'object' ? input : {};
  const triggersRaw = Array.isArray(src.triggers) ? src.triggers : [];
  const triggers = triggersRaw.map(normalizeTrigger);

  const templates = src.templates && typeof src.templates === 'object' ? src.templates : {};

  return {
    schema_version: SCHEMA_VERSION,
    provider: String(src.provider || '').trim() || 'none',
    sender_name: String(src.sender_name || '').trim(),
    sender_email: String(src.sender_email || '').trim(),
    triggers,
    templates,
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function loadEmailConfigV1() {
  const stored = readTenantJson(NS_EMAIL_V1, null);
  if (stored && typeof stored === 'object') {
    return normalizeEmailConfigV1(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizeEmailConfigV1(getDefaultEmailConfigV1());
  writeTenantJson(NS_EMAIL_V1, seeded);
  return seeded;
}

export function saveEmailConfigV1(data) {
  const normalized = normalizeEmailConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_EMAIL_V1, next);
  return next;
}
