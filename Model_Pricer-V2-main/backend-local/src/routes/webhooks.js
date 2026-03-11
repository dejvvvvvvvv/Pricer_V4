/**
 * Webhook management routes.
 *
 * Endpoints:
 *   GET    /api/webhooks          — list registered webhooks (secrets masked)
 *   POST   /api/webhooks          — register a new webhook
 *   DELETE /api/webhooks/:id      — remove a webhook
 *   POST   /api/webhooks/:id/test — send a test event to a webhook
 *
 * All endpoints require authentication and a valid tenant context
 * (requireAuth + requireTenant applied in index.js).
 *
 * @module routes/webhooks
 */

import { Router } from "express";
import {
  registerWebhook,
  removeWebhook,
  getWebhooks,
  sendTestEvent,
  VALID_EVENTS,
} from "../services/webhookService.js";

/**
 * Creates the webhooks router.
 *
 * @param {{ workspaceRoot: string, getTenantIdFromReq: (req) => string }} opts
 * @returns {Router}
 */
export function createWebhooksRouter({ workspaceRoot, getTenantIdFromReq }) {
  const router = Router();

  // ── Helpers ──
  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message, details) {
    return res.status(status).json({ ok: false, errorCode, message, details });
  }

  // ───────────────────────────────────────────────────
  // GET /api/webhooks — List all webhooks for tenant
  // ───────────────────────────────────────────────────
  router.get("/", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const webhooks = await getWebhooks(workspaceRoot, tenantId);
      return ok(res, { webhooks, validEvents: VALID_EVENTS });
    } catch (e) {
      return fail(res, 500, "MP_WEBHOOK_LIST_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/webhooks — Register a new webhook
  // ───────────────────────────────────────────────────
  router.post("/", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const { url, events, secret } = req.body || {};

      // Basic presence checks
      if (!url || typeof url !== "string") {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Field 'url' is required and must be a string.");
      }
      if (!events || !Array.isArray(events) || events.length === 0) {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Field 'events' is required and must be a non-empty array.");
      }
      if (!secret || typeof secret !== "string") {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Field 'secret' is required and must be a string (min 8 chars).");
      }

      const result = await registerWebhook(workspaceRoot, tenantId, url.trim(), events, secret);

      if (!result.ok) {
        return fail(res, 400, "MP_VALIDATION_ERROR", result.error);
      }

      return res.status(201).json({ ok: true, data: result.webhook });
    } catch (e) {
      return fail(res, 500, "MP_WEBHOOK_CREATE_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // DELETE /api/webhooks/:id — Remove a webhook
  // ───────────────────────────────────────────────────
  router.delete("/:id", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const webhookId = String(req.params.id || "").trim();
      if (!webhookId) {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Missing webhook id.");
      }

      const result = await removeWebhook(workspaceRoot, tenantId, webhookId);
      if (!result.ok) {
        return fail(res, 404, "MP_NOT_FOUND", result.error);
      }

      return res.status(200).json({ ok: true, data: { id: webhookId, deleted: true } });
    } catch (e) {
      return fail(res, 500, "MP_WEBHOOK_DELETE_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/webhooks/:id/test — Send test event
  // ───────────────────────────────────────────────────
  router.post("/:id/test", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const webhookId = String(req.params.id || "").trim();
      if (!webhookId) {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Missing webhook id.");
      }

      const result = await sendTestEvent(workspaceRoot, tenantId, webhookId);
      if (!result.ok) {
        const status = result.error === "Webhook not found" ? 404 : 502;
        const code = result.error === "Webhook not found" ? "MP_NOT_FOUND" : "MP_WEBHOOK_TEST_FAILED";
        return fail(res, status, code, result.error);
      }

      return ok(res, { webhookId, testDelivered: true, status: result.status });
    } catch (e) {
      return fail(res, 500, "MP_WEBHOOK_TEST_FAILED", String(e?.message || e));
    }
  });

  return router;
}

export default createWebhooksRouter;
