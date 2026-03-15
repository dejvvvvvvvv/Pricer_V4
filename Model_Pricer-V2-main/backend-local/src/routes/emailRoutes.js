/**
 * Email API Routes — tenant-scoped email operations.
 *
 * Endpoints:
 *   GET  /api/email/templates — list available templates for tenant
 *   POST /api/email/preview   — render template preview (tenant-scoped)
 *   POST /api/email/send      — send a test email (tenant-scoped, logged per tenant)
 *   GET  /api/email/log       — get recent email log for tenant
 *
 * All endpoints require auth + tenant middleware (applied in index.js).
 * Email logs are scoped per tenant — tenants cannot see each other's logs.
 *
 * @module routes/emailRoutes
 */

import { Router } from "express";
import { sendEmail, getEmailLog } from "../email/emailService.js";
import { renderTemplate, listTemplates } from "../email/templateRenderer.js";

/**
 * Creates the email router with tenant isolation.
 *
 * @param {{ getTenantIdFromReq: (req) => string }} opts
 * @returns {Router}
 */
export function createEmailRouter({ getTenantIdFromReq }) {
  const router = Router();

  /**
   * Per-tenant email log storage (in-memory).
   * Key: tenantId, Value: array of log entries (most recent first).
   * @type {Map<string, Array<object>>}
   */
  const tenantEmailLogs = new Map();
  const MAX_LOG_PER_TENANT = 200;

  /**
   * Append an entry to the tenant-scoped email log.
   * @param {string} tenantId
   * @param {object} entry
   */
  function logEmailForTenant(tenantId, entry) {
    let log = tenantEmailLogs.get(tenantId);
    if (!log) {
      log = [];
      tenantEmailLogs.set(tenantId, log);
    }
    log.unshift({ ...entry, tenantId, timestamp: new Date().toISOString() });
    if (log.length > MAX_LOG_PER_TENANT) {
      log.length = MAX_LOG_PER_TENANT;
    }
  }

  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message, details) {
    return res.status(status).json({ ok: false, errorCode, message, details });
  }

  // ───────────────────────────────────────────────────
  // GET /api/email/templates — list available templates
  // ───────────────────────────────────────────────────
  /**
   * Returns available email templates.
   * Templates are currently global but served in tenant context.
   */
  router.get("/templates", (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const templates = listTemplates();
      return ok(res, { tenantId, templates });
    } catch (err) {
      return fail(res, 500, "MP_EMAIL_ERROR", String(err?.message || err));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/email/preview — render template preview
  // ───────────────────────────────────────────────────
  /**
   * Renders an email template with provided data.
   * Body: { templateId: string, data: object }
   */
  router.post("/preview", (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const { templateId, data } = req.body || {};

      if (!templateId || typeof templateId !== "string") {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Missing or invalid templateId.");
      }

      const html = renderTemplate(templateId, data || {});
      return ok(res, { tenantId, templateId, html });
    } catch (err) {
      return fail(res, 400, "MP_EMAIL_TEMPLATE_ERROR", String(err?.message || err));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/email/send — send a test email
  // ───────────────────────────────────────────────────
  /**
   * Sends an email (or simulates in demo mode).
   * The result is logged in the tenant-scoped email log.
   *
   * Body: { to: string, subject: string, templateId?: string, data?: object, providerConfig?: object }
   */
  router.post("/send", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const { to, subject, templateId, data, providerConfig } = req.body || {};

      if (!to || typeof to !== "string") {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Missing or invalid 'to' field.");
      }
      if (!subject || typeof subject !== "string") {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Missing or invalid 'subject' field.");
      }

      const result = await sendEmail({ to, subject, templateId, data, providerConfig });

      // Log to tenant-scoped log
      logEmailForTenant(tenantId, {
        to,
        subject,
        templateId: templateId || null,
        status: result.mode === "demo" ? "demo" : "sent",
        provider: result.mode,
      });

      return ok(res, { tenantId, ...result });
    } catch (err) {
      // Log failure to tenant log as well
      try {
        const tenantId = getTenantIdFromReq(req);
        logEmailForTenant(tenantId, {
          to: req.body?.to,
          subject: req.body?.subject,
          templateId: req.body?.templateId,
          status: "failed",
          error: String(err?.message || err),
        });
      } catch {
        // Ignore logging errors
      }
      return fail(res, 500, "MP_EMAIL_SEND_FAILED", String(err?.message || err));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/email/log — get recent email log for tenant
  // ───────────────────────────────────────────────────
  /**
   * Returns the email log scoped to the current tenant.
   * Other tenants' logs are never visible.
   */
  router.get("/log", (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const log = tenantEmailLogs.get(tenantId) || [];
      return ok(res, { tenantId, log });
    } catch (err) {
      return fail(res, 500, "MP_EMAIL_ERROR", String(err?.message || err));
    }
  });

  return router;
}

export default createEmailRouter;
