/**
 * Orders Store — JSON file-based per-tenant order storage.
 *
 * Storage path: {workspaceRoot}/orders/{tenantId}.json
 *
 * Each tenant file contains:
 *   { orders: [...], _meta: { lastId: N, updatedAt: ISO } }
 *
 * Provides CRUD operations, status flow validation, filtering and statistics.
 *
 * @module ordersStore
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ensureDir } from "./util/fsSafe.js";

// ── Status flow definition ──

/**
 * Valid order statuses. The order of this array defines the forward-only flow.
 * CANCELED is a terminal state reachable from any non-terminal status.
 */
export const ORDER_STATUSES = [
  "new",
  "review",
  "approved",
  "processing",
  "printing",
  "post_processing",
  "ready",
  "shipped",
  "completed",
];

/** Map of uppercase frontend statuses to lowercase backend statuses. */
const STATUS_NORMALIZE = {
  NEW: "new",
  REVIEW: "review",
  APPROVED: "approved",
  PROCESSING: "processing",
  PRINTING: "printing",
  POSTPROCESS: "post_processing",
  POST_PROCESSING: "post_processing",
  READY: "ready",
  SHIPPED: "shipped",
  DONE: "completed",
  COMPLETED: "completed",
  CANCELED: "cancelled",
  CANCELLED: "cancelled",
};

/**
 * Normalize a status value (case-insensitive, handles frontend uppercase variants).
 *
 * @param {string} status
 * @returns {string}
 */
export function normalizeStatus(status) {
  if (!status) return "";
  const upper = String(status).toUpperCase();
  if (STATUS_NORMALIZE[upper]) return STATUS_NORMALIZE[upper];
  const lower = String(status).toLowerCase();
  if (ORDER_STATUSES.includes(lower) || lower === "cancelled") return lower;
  return lower;
}

/** Terminal statuses that cannot transition further (except cancel). */
const TERMINAL_STATUSES = ["completed", "cancelled"];

/**
 * Validate a status transition.
 * Rules:
 * - Cannot transition from a terminal status.
 * - Any non-terminal status can transition to "cancelled".
 * - Forward-only transitions within ORDER_STATUSES.
 *
 * @param {string} from
 * @param {string} to
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateStatusTransition(from, to) {
  const normFrom = normalizeStatus(from);
  const normTo = normalizeStatus(to);

  if (!ORDER_STATUSES.includes(normFrom) && normFrom !== "cancelled") {
    return { ok: false, error: `Unknown current status: ${from}` };
  }
  if (!ORDER_STATUSES.includes(normTo) && normTo !== "cancelled") {
    return { ok: false, error: `Unknown target status: ${to}. Valid: ${[...ORDER_STATUSES, "cancelled"].join(", ")}` };
  }

  if (normFrom === normTo) {
    return { ok: false, error: `Order is already in status "${normFrom}"` };
  }

  // Cannot transition from terminal statuses
  if (TERMINAL_STATUSES.includes(normFrom)) {
    return { ok: false, error: `Cannot transition from terminal status "${normFrom}"` };
  }

  // Cancel is always allowed from non-terminal
  if (normTo === "cancelled") {
    return { ok: true };
  }

  // Forward-only check
  const fromIdx = ORDER_STATUSES.indexOf(normFrom);
  const toIdx = ORDER_STATUSES.indexOf(normTo);

  if (fromIdx === -1 || toIdx === -1) {
    return { ok: false, error: `Invalid status transition: ${from} -> ${to}` };
  }

  if (toIdx <= fromIdx) {
    return { ok: false, error: `Cannot go backwards: "${normFrom}" -> "${normTo}". Status flow is forward-only.` };
  }

  return { ok: true };
}

// ── File I/O ──

/**
 * Resolve the JSON file path for a tenant's orders.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @returns {string}
 */
function ordersFilePath(workspaceRoot, tenantId) {
  return path.join(workspaceRoot, "orders", `${tenantId}.json`);
}

/**
 * Read the full orders state for a tenant.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @returns {Promise<{ orders: Array, _meta: Object }>}
 */
export async function readOrdersState(workspaceRoot, tenantId) {
  const p = ordersFilePath(workspaceRoot, tenantId);
  try {
    const raw = await fs.readFile(p, "utf8");
    const data = JSON.parse(raw);
    return {
      orders: Array.isArray(data.orders) ? data.orders : [],
      _meta: data._meta || { lastId: 0, updatedAt: new Date().toISOString() },
    };
  } catch {
    return { orders: [], _meta: { lastId: 0, updatedAt: new Date().toISOString() } };
  }
}

/**
 * Write the full orders state for a tenant.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {{ orders: Array, _meta: Object }} state
 */
async function writeOrdersState(workspaceRoot, tenantId, state) {
  const p = ordersFilePath(workspaceRoot, tenantId);
  await ensureDir(path.dirname(p));
  state._meta.updatedAt = new Date().toISOString();
  await fs.writeFile(p, JSON.stringify(state, null, 2), "utf8");
}

// ── CRUD Operations ──

/**
 * List orders with optional filters.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {Object} [filters]
 * @param {string} [filters.status] — Filter by status
 * @param {string} [filters.dateFrom] — ISO date string, orders created on or after
 * @param {string} [filters.dateTo] — ISO date string, orders created on or before
 * @param {string} [filters.search] — Search in customerName, customerEmail, id, notes
 * @param {number} [filters.page] — Page number (1-based)
 * @param {number} [filters.pageSize] — Items per page (default 50)
 * @returns {Promise<{ orders: Array, total: number, page: number, pageSize: number }>}
 */
export async function listOrders(workspaceRoot, tenantId, filters = {}) {
  const state = await readOrdersState(workspaceRoot, tenantId);
  let orders = state.orders.filter((o) => !o._deleted);

  // Status filter
  if (filters.status) {
    const normStatus = normalizeStatus(filters.status);
    orders = orders.filter((o) => normalizeStatus(o.status) === normStatus);
  }

  // Date range filters
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    orders = orders.filter((o) => new Date(o.createdAt).getTime() >= from);
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    orders = orders.filter((o) => new Date(o.createdAt).getTime() <= to);
  }

  // Search filter
  if (filters.search) {
    const q = String(filters.search).toLowerCase();
    orders = orders.filter((o) => {
      const haystack = [
        o.id,
        o.customerName,
        o.customerEmail,
        o.notes,
        o.orderNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  // Sort by createdAt descending (newest first)
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = orders.length;
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(filters.pageSize) || 50));
  const start = (page - 1) * pageSize;
  const paged = orders.slice(start, start + pageSize);

  return { orders: paged, total, page, pageSize };
}

/**
 * Get a single order by ID.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {string} orderId
 * @returns {Promise<Object|null>}
 */
export async function getOrder(workspaceRoot, tenantId, orderId) {
  const state = await readOrdersState(workspaceRoot, tenantId);
  const order = state.orders.find((o) => o.id === orderId && !o._deleted);
  return order || null;
}

/**
 * Create a new order.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {Object} data — Order data (customerName, customerEmail, items, etc.)
 * @returns {Promise<Object>} The created order
 */
export async function createOrder(workspaceRoot, tenantId, data) {
  const state = await readOrdersState(workspaceRoot, tenantId);
  const now = new Date().toISOString();

  state._meta.lastId = (state._meta.lastId || 0) + 1;
  const seqNum = String(state._meta.lastId).padStart(5, "0");

  const order = {
    id: crypto.randomUUID(),
    orderNumber: `ORD-${seqNum}`,
    status: "new",
    customerId: data.customerId || null,
    customerName: data.customerName || "",
    customerEmail: data.customerEmail || "",
    items: Array.isArray(data.items) ? data.items : [],
    models: Array.isArray(data.models) ? data.models : [],
    totalPrice: Number(data.totalPrice) || 0,
    currency: data.currency || "CZK",
    notes: data.notes || "",
    flags: Array.isArray(data.flags) ? data.flags : [],
    one_time_fees: Array.isArray(data.one_time_fees) ? data.one_time_fees : [],
    totals_snapshot: data.totals_snapshot || null,
    activityLog: [
      {
        action: "created",
        timestamp: now,
        actor: data._actor || "system",
      },
    ],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    _deleted: false,
  };

  state.orders.push(order);
  await writeOrdersState(workspaceRoot, tenantId, state);

  return order;
}

/**
 * Update order fields (not status — use changeOrderStatus for that).
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {string} orderId
 * @param {Object} updates — Fields to update
 * @returns {Promise<{ ok: boolean, order?: Object, error?: string }>}
 */
export async function updateOrder(workspaceRoot, tenantId, orderId, updates) {
  const state = await readOrdersState(workspaceRoot, tenantId);
  const idx = state.orders.findIndex((o) => o.id === orderId && !o._deleted);
  if (idx === -1) return { ok: false, error: "Order not found" };

  const order = state.orders[idx];
  const now = new Date().toISOString();

  // Allowlisted fields for update
  const allowed = [
    "customerName", "customerEmail", "customerId",
    "notes", "items", "models", "totalPrice", "currency",
    "flags", "one_time_fees", "totals_snapshot",
  ];

  const changed = [];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      changed.push(key);
      order[key] = updates[key];
    }
  }

  if (changed.length === 0) {
    return { ok: true, order };
  }

  order.updatedAt = now;
  order.activityLog = order.activityLog || [];
  order.activityLog.push({
    action: "updated",
    fields: changed,
    timestamp: now,
    actor: updates._actor || "system",
  });

  state.orders[idx] = order;
  await writeOrdersState(workspaceRoot, tenantId, state);

  return { ok: true, order };
}

/**
 * Change order status with validation.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {string} orderId
 * @param {string} newStatus
 * @param {Object} [opts]
 * @param {string} [opts.note] — Optional note for the transition
 * @param {string} [opts.actor] — Who made the change
 * @returns {Promise<{ ok: boolean, order?: Object, error?: string }>}
 */
export async function changeOrderStatus(workspaceRoot, tenantId, orderId, newStatus, opts = {}) {
  const state = await readOrdersState(workspaceRoot, tenantId);
  const idx = state.orders.findIndex((o) => o.id === orderId && !o._deleted);
  if (idx === -1) return { ok: false, error: "Order not found" };

  const order = state.orders[idx];
  const validation = validateStatusTransition(order.status, newStatus);
  if (!validation.ok) return { ok: false, error: validation.error };

  const now = new Date().toISOString();
  const previousStatus = order.status;
  const normalizedNew = normalizeStatus(newStatus);

  order.status = normalizedNew;
  order.updatedAt = now;

  if (normalizedNew === "completed") {
    order.completedAt = now;
  }

  order.activityLog = order.activityLog || [];
  order.activityLog.push({
    action: "status_changed",
    from: previousStatus,
    to: normalizedNew,
    note: opts.note || undefined,
    timestamp: now,
    actor: opts.actor || "system",
  });

  state.orders[idx] = order;
  await writeOrdersState(workspaceRoot, tenantId, state);

  return { ok: true, order, previousStatus, newStatus: normalizedNew };
}

/**
 * Soft-delete (cancel) an order.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {string} orderId
 * @param {Object} [opts]
 * @param {string} [opts.reason] — Reason for cancellation
 * @param {string} [opts.actor]
 * @returns {Promise<{ ok: boolean, order?: Object, error?: string }>}
 */
export async function softDeleteOrder(workspaceRoot, tenantId, orderId, opts = {}) {
  const state = await readOrdersState(workspaceRoot, tenantId);
  const idx = state.orders.findIndex((o) => o.id === orderId && !o._deleted);
  if (idx === -1) return { ok: false, error: "Order not found" };

  const order = state.orders[idx];

  // If already completed, cannot delete
  if (normalizeStatus(order.status) === "completed") {
    return { ok: false, error: "Cannot delete a completed order" };
  }

  const now = new Date().toISOString();
  order.status = "cancelled";
  order._deleted = true;
  order.updatedAt = now;
  order.activityLog = order.activityLog || [];
  order.activityLog.push({
    action: "cancelled",
    reason: opts.reason || undefined,
    timestamp: now,
    actor: opts.actor || "system",
  });

  state.orders[idx] = order;
  await writeOrdersState(workspaceRoot, tenantId, state);

  return { ok: true, order };
}

/**
 * Compute order statistics (counts per status, revenue totals).
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @returns {Promise<Object>}
 */
export async function getOrderStats(workspaceRoot, tenantId) {
  const state = await readOrdersState(workspaceRoot, tenantId);
  const active = state.orders.filter((o) => !o._deleted);

  const byStatus = {};
  for (const s of [...ORDER_STATUSES, "cancelled"]) {
    byStatus[s] = 0;
  }

  let totalRevenue = 0;
  let completedRevenue = 0;
  let totalOrders = active.length;

  for (const order of active) {
    const ns = normalizeStatus(order.status);
    if (byStatus[ns] !== undefined) {
      byStatus[ns]++;
    }

    const price = Number(order.totalPrice) || 0;
    totalRevenue += price;
    if (ns === "completed") {
      completedRevenue += price;
    }
  }

  return {
    totalOrders,
    byStatus,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    completedRevenue: Math.round(completedRevenue * 100) / 100,
    currency: active[0]?.currency || "CZK",
  };
}
