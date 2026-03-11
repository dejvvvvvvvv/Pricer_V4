/**
 * Orders API — full CRUD with status flow, filtering, stats, and webhook events.
 *
 * Endpoints:
 *   GET    /api/orders        — List orders with filters (status, dateFrom, dateTo, search, page, pageSize)
 *   GET    /api/orders/stats  — Get order statistics (counts per status, revenue totals)
 *   GET    /api/orders/:id    — Get single order details
 *   GET    /api/orders/:id/summary — Get printable HTML order summary
 *   POST   /api/orders        — Create new order (from checkout)
 *   PATCH  /api/orders/:id    — Update order fields
 *   PATCH  /api/orders/:id/status — Change order status with validation
 *   DELETE /api/orders/:id    — Soft delete (cancel) order
 *
 * Status flow (forward-only):
 *   new -> review -> approved -> processing -> printing -> post_processing -> ready -> shipped -> completed
 *   Any non-terminal status -> cancelled
 *
 * Storage: JSON file per tenant at {workspace}/orders/{tenantId}.json
 *
 * @module routes/orders
 */

import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  changeOrderStatus,
  softDeleteOrder,
  getOrderStats,
  ORDER_STATUSES,
  normalizeStatus,
} from "../ordersStore.js";
import { generateOrderSummaryHtml } from "../services/pdfService.js";

// ── Validation Schemas ──

const orderSchemas = {
  list: {
    query: {
      status: { type: "string", enum: [...ORDER_STATUSES, "cancelled"], label: "Status filter" },
      dateFrom: { type: "string", label: "Date from (ISO)" },
      dateTo: { type: "string", label: "Date to (ISO)" },
      search: { type: "string", maxLength: 200, label: "Search query" },
      page: { type: "number", min: 1, label: "Page number" },
      pageSize: { type: "number", min: 1, max: 200, label: "Page size" },
    },
  },

  byId: {
    params: {
      id: { type: "string", required: true, minLength: 1, maxLength: 100, label: "Order ID" },
    },
  },

  create: {
    body: {
      customerName: { type: "string", maxLength: 200, label: "Customer name" },
      customerEmail: { type: "string", maxLength: 200, label: "Customer email" },
    },
  },

  statusChange: {
    params: {
      id: { type: "string", required: true, minLength: 1, maxLength: 100, label: "Order ID" },
    },
    body: {
      status: {
        type: "string",
        required: true,
        enum: [...ORDER_STATUSES, "cancelled"],
        label: "New status",
      },
    },
  },
};

/**
 * Creates the orders router.
 *
 * @param {{ workspaceRoot: string, getTenantIdFromReq: (req) => string, fireWebhook: Function }} opts
 * @returns {Router}
 */
export function createOrdersRouter({ workspaceRoot, getTenantIdFromReq, fireWebhook }) {
  const router = Router();

  // ── Helpers ──
  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message, details) {
    return res.status(status).json({ ok: false, errorCode, message, details });
  }

  // ───────────────────────────────────────────────────
  // GET /api/orders/stats — Order statistics
  // Must be before /:id to avoid matching "stats" as an ID
  // ───────────────────────────────────────────────────
  router.get("/stats", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const stats = await getOrderStats(workspaceRoot, tenantId);
      return ok(res, stats);
    } catch (e) {
      return fail(res, 500, "MP_ORDERS_STATS_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/orders/:id/summary — Printable HTML order summary
  // Must be before /:id to avoid "summary" matching as an update
  // ───────────────────────────────────────────────────
  router.get("/:id/summary", validate(orderSchemas.byId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const orderId = String(req.params.id).trim();

      const order = await getOrder(workspaceRoot, tenantId, orderId);
      if (!order) return fail(res, 404, "MP_NOT_FOUND", "Order not found");

      const acceptLanguage = req.headers["accept-language"] || "";

      const result = generateOrderSummaryHtml(order, {
        acceptLanguage,
        companyName: req.query.company || undefined,
      });

      if (!result.ok) {
        return fail(res, 500, "MP_SUMMARY_GENERATION_FAILED", result.error);
      }

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(result.html);
    } catch (e) {
      return fail(res, 500, "MP_SUMMARY_GENERATION_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/orders — List orders with filters
  // ───────────────────────────────────────────────────
  router.get("/", validate(orderSchemas.list), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const filters = {
        status: req.query.status,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        search: req.query.search,
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      };

      const result = await listOrders(workspaceRoot, tenantId, filters);
      return ok(res, result);
    } catch (e) {
      return fail(res, 500, "MP_ORDERS_LIST_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/orders/:id — Get single order
  // ───────────────────────────────────────────────────
  router.get("/:id", validate(orderSchemas.byId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const orderId = String(req.params.id).trim();

      const order = await getOrder(workspaceRoot, tenantId, orderId);
      if (!order) return fail(res, 404, "MP_NOT_FOUND", "Order not found");

      return ok(res, order);
    } catch (e) {
      return fail(res, 500, "MP_ORDER_GET_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/orders — Create new order
  // ───────────────────────────────────────────────────
  router.post("/", validate(orderSchemas.create), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const body = req.body || {};

      // Validate items/models — at least one must be provided
      const hasItems = Array.isArray(body.items) && body.items.length > 0;
      const hasModels = Array.isArray(body.models) && body.models.length > 0;
      if (!hasItems && !hasModels) {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Order must have at least one item or model");
      }

      // Validate each item has required fields
      const items = body.items || [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.modelName && !item.name) {
          return fail(res, 400, "MP_VALIDATION_ERROR", `Item ${i} must have a modelName or name`);
        }
      }

      const order = await createOrder(workspaceRoot, tenantId, {
        ...body,
        _actor: req.user?.email || req.user?.uid || "api",
      });

      // Fire webhook (fire-and-forget)
      if (fireWebhook) {
        fireWebhook(workspaceRoot, tenantId, "order.created", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          customerEmail: order.customerEmail,
          totalPrice: order.totalPrice,
          currency: order.currency,
          itemCount: (order.items?.length || 0) + (order.models?.length || 0),
        });
      }

      console.log(`[orders] Created order ${order.orderNumber} (${order.id}) for tenant ${tenantId}`);
      return res.status(201).json({ ok: true, data: order });
    } catch (e) {
      return fail(res, 500, "MP_ORDER_CREATE_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // PATCH /api/orders/:id — Update order fields
  // ───────────────────────────────────────────────────
  router.patch("/:id", validate(orderSchemas.byId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const orderId = String(req.params.id).trim();
      const body = req.body || {};

      // Don't allow status change through this endpoint
      if (body.status) {
        return fail(
          res,
          400,
          "MP_VALIDATION_ERROR",
          "Use PATCH /api/orders/:id/status to change order status"
        );
      }

      const result = await updateOrder(workspaceRoot, tenantId, orderId, {
        ...body,
        _actor: req.user?.email || req.user?.uid || "api",
      });

      if (!result.ok) {
        return fail(res, 404, "MP_NOT_FOUND", result.error);
      }

      // Fire webhook (fire-and-forget)
      if (fireWebhook) {
        fireWebhook(workspaceRoot, tenantId, "order.updated", {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          status: result.order.status,
          updatedFields: Object.keys(body).filter((k) => k !== "_actor"),
        });
      }

      return ok(res, result.order);
    } catch (e) {
      return fail(res, 500, "MP_ORDER_UPDATE_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // PATCH /api/orders/:id/status — Change order status
  // ───────────────────────────────────────────────────
  router.patch("/:id/status", validate(orderSchemas.statusChange), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const orderId = String(req.params.id).trim();
      const { status, note } = req.body || {};

      const result = await changeOrderStatus(workspaceRoot, tenantId, orderId, status, {
        note,
        actor: req.user?.email || req.user?.uid || "api",
      });

      if (!result.ok) {
        // Determine if it's a not-found or a validation error
        const isNotFound = result.error === "Order not found";
        return fail(
          res,
          isNotFound ? 404 : 409,
          isNotFound ? "MP_NOT_FOUND" : "MP_STATUS_TRANSITION_INVALID",
          result.error
        );
      }

      // Fire appropriate webhook based on new status
      if (fireWebhook) {
        const normalizedNew = normalizeStatus(status);
        let event = "order.updated";
        if (normalizedNew === "completed") event = "order.completed";
        if (normalizedNew === "cancelled") event = "order.cancelled";

        fireWebhook(workspaceRoot, tenantId, event, {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          previousStatus: result.previousStatus,
          newStatus: result.newStatus,
          note: note || undefined,
        });
      }

      console.log(
        `[orders] Status changed: ${result.previousStatus} -> ${result.newStatus} for order ${orderId} (tenant ${tenantId})`
      );

      return ok(res, result.order);
    } catch (e) {
      return fail(res, 500, "MP_ORDER_STATUS_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // DELETE /api/orders/:id — Soft delete (cancel) order
  // ───────────────────────────────────────────────────
  router.delete("/:id", validate(orderSchemas.byId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const orderId = String(req.params.id).trim();
      const reason = req.body?.reason || req.query?.reason || "";

      const result = await softDeleteOrder(workspaceRoot, tenantId, orderId, {
        reason,
        actor: req.user?.email || req.user?.uid || "api",
      });

      if (!result.ok) {
        const isNotFound = result.error === "Order not found";
        return fail(
          res,
          isNotFound ? 404 : 409,
          isNotFound ? "MP_NOT_FOUND" : "MP_ORDER_DELETE_FAILED",
          result.error
        );
      }

      // Fire cancelled webhook
      if (fireWebhook) {
        fireWebhook(workspaceRoot, tenantId, "order.cancelled", {
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          reason,
        });
      }

      console.log(`[orders] Soft-deleted order ${orderId} for tenant ${tenantId}`);

      return ok(res, { id: orderId, status: "cancelled" });
    } catch (e) {
      return fail(res, 500, "MP_ORDER_DELETE_FAILED", String(e?.message || e));
    }
  });

  return router;
}

export default createOrdersRouter;
