/*
  Admin Kanban — Tenant-scoped Storage (V1)
  ------------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for order kanban board configuration.
  - Define columns (statuses), WIP limits, colors, and visibility.
  - Support both table and kanban view modes.

  Notes:
  - No legacy migration needed — this is a new namespace.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_KANBAN_V1 = 'kanban:v1';
const SCHEMA_VERSION = 1;

function nowIso() {
  return new Date().toISOString();
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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

function normalizeColumn(col, idx = 0) {
  const c = col && typeof col === 'object' ? col : {};

  return {
    id: String(c.id || '').trim() || uuid('col'),
    label: String(c.label || '').trim() || `Column ${idx + 1}`,
    wip_limit: safeNum(c.wip_limit, 0), // 0 = unlimited
    color: String(c.color || '').trim() || '#3b82f6',
    sort_order: safeNum(c.sort_order, idx),
    visible: parseBool(c.visible, true),
  };
}

export function getDefaultKanbanConfigV1() {
  return {
    schema_version: SCHEMA_VERSION,
    view_mode: 'table',
    columns: [
      { id: 'new', label: 'New', wip_limit: 0, color: '#3b82f6', sort_order: 0, visible: true },
      { id: 'confirmed', label: 'Confirmed', wip_limit: 0, color: '#8b5cf6', sort_order: 1, visible: true },
      { id: 'printing', label: 'Printing', wip_limit: 5, color: '#f59e0b', sort_order: 2, visible: true },
      { id: 'post_processing', label: 'Post-Processing', wip_limit: 3, color: '#06b6d4', sort_order: 3, visible: true },
      { id: 'ready', label: 'Ready', wip_limit: 0, color: '#10b981', sort_order: 4, visible: true },
      { id: 'shipped', label: 'Shipped', wip_limit: 0, color: '#6366f1', sort_order: 5, visible: true },
      { id: 'completed', label: 'Completed', wip_limit: 0, color: '#22c55e', sort_order: 6, visible: true },
      { id: 'cancelled', label: 'Cancelled', wip_limit: 0, color: '#ef4444', sort_order: 7, visible: true },
    ],
    updated_at: nowIso(),
  };
}

export function normalizeKanbanConfigV1(input) {
  const src = input && typeof input === 'object' ? input : {};
  const columnsRaw = Array.isArray(src.columns) ? src.columns : [];
  const columns = columnsRaw.map(normalizeColumn);

  const viewMode = String(src.view_mode || '').trim() || 'table';
  const normalizedViewMode = ['table', 'kanban'].includes(viewMode) ? viewMode : 'table';

  return {
    schema_version: SCHEMA_VERSION,
    view_mode: normalizedViewMode,
    columns,
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function loadKanbanConfigV1() {
  const stored = readTenantJson(NS_KANBAN_V1, null);
  if (stored && typeof stored === 'object') {
    return normalizeKanbanConfigV1(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizeKanbanConfigV1(getDefaultKanbanConfigV1());
  writeTenantJson(NS_KANBAN_V1, seeded);
  return seeded;
}

export function saveKanbanConfigV1(data) {
  const normalized = normalizeKanbanConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_KANBAN_V1, next);
  return next;
}
