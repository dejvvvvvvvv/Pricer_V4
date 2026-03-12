/**
 * Notifications API — tenant notification preferences and test notifications.
 *
 * Endpoints:
 *   GET  /api/notifications/preferences — Get notification settings for tenant
 *   PUT  /api/notifications/preferences — Update notification settings
 *   POST /api/notifications/test        — Send a test notification (logged, not actually sent)
 *
 * Storage: JSON file per tenant at {workspace}/config/{tenantId}/notifications.json
 *
 * @module routes/notifications
 */

import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "../util/fsSafe.js";
import { validate } from "../middleware/validate.js";

/**
 * Default notification preferences for a new tenant.
 */
const DEFAULT_PREFERENCES = {
  email: {
    enabled: true,
    orderCreated: true,
    orderStatusChanged: true,
    orderCompleted: true,
    orderCancelled: true,
    slicingCompleted: false,
    slicingFailed: true,
    dailyDigest: false,
    recipientEmail: "",
  },
  webhook: {
    enabled: false,
    orderEvents: true,
    slicingEvents: true,
  },
  inApp: {
    enabled: true,
    orderEvents: true,
    systemEvents: true,
  },
};

/**
 * Allowed top-level keys in notification preferences.
 * Used to filter out unknown fields during import.
 */
const VALID_CHANNELS = ["email", "webhook", "inApp"];

// ── Validation Schemas ──

const notifSchemas = {
  updatePreferences: {
    body: {
      email: { type: "object", label: "Email preferences" },
      webhook: { type: "object", label: "Webhook preferences" },
      inApp: { type: "object", label: "In-app preferences" },
    },
  },
  testNotification: {
    body: {
      channel: {
        type: "string",
        required: true,
        enum: ["email", "webhook", "inApp"],
        label: "Notification channel",
      },
      message: { type: "string", maxLength: 500, label: "Test message" },
    },
  },
};

/**
 * Creates the notifications router.
 *
 * @param {{ workspaceRoot: string, getTenantIdFromReq: (req) => string }} opts
 * @returns {Router}
 */
export function createNotificationsRouter({ workspaceRoot, getTenantIdFromReq }) {
  const router = Router();

  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message, details) {
    return res.status(status).json({ ok: false, errorCode, message, details });
  }

  /**
   * Resolve the file path for tenant notification preferences.
   * @param {string} tenantId
   * @returns {string}
   */
  function prefsFilePath(tenantId) {
    return path.join(workspaceRoot, "config", tenantId, "notifications.json");
  }

  /**
   * Read notification preferences for a tenant.
   * Returns defaults merged with stored preferences.
   * @param {string} tenantId
   * @returns {Promise<object>}
   */
  async function readPreferences(tenantId) {
    const filePath = prefsFilePath(tenantId);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const stored = JSON.parse(raw);
      // Deep merge with defaults so new fields are always present
      return {
        email: { ...DEFAULT_PREFERENCES.email, ...stored.email },
        webhook: { ...DEFAULT_PREFERENCES.webhook, ...stored.webhook },
        inApp: { ...DEFAULT_PREFERENCES.inApp, ...stored.inApp },
        _meta: stored._meta || {},
      };
    } catch (e) {
      if (e.code === "ENOENT") {
        return { ...structuredClone(DEFAULT_PREFERENCES), _meta: {} };
      }
      throw e;
    }
  }

  /**
   * Write notification preferences for a tenant.
   * @param {string} tenantId
   * @param {object} prefs
   */
  async function writePreferences(tenantId, prefs) {
    const filePath = prefsFilePath(tenantId);
    await ensureDir(path.dirname(filePath));
    prefs._meta = prefs._meta || {};
    prefs._meta.updatedAt = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(prefs, null, 2), "utf8");
  }

  // ───────────────────────────────────────────────────
  // GET /api/notifications/preferences — Get notification settings
  // ───────────────────────────────────────────────────
  /**
   * Returns the current notification preferences for the tenant.
   * Missing fields are filled with defaults.
   */
  router.get("/preferences", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const prefs = await readPreferences(tenantId);
      return ok(res, prefs);
    } catch (e) {
      return fail(res, 500, "MP_NOTIFICATIONS_READ_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // PUT /api/notifications/preferences — Update notification settings
  // ───────────────────────────────────────────────────
  /**
   * Updates notification preferences. Supports partial updates per channel.
   * Unknown channels are ignored. Each channel is shallow-merged with existing values.
   *
   * Body example:
   * {
   *   "email": { "enabled": false, "dailyDigest": true },
   *   "inApp": { "systemEvents": false }
   * }
   */
  router.put("/preferences", validate(notifSchemas.updatePreferences), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const body = req.body || {};

      // Read current preferences (with defaults)
      const current = await readPreferences(tenantId);

      // Merge only valid channels
      const updatedChannels = [];
      for (const channel of VALID_CHANNELS) {
        if (body[channel] && typeof body[channel] === "object" && !Array.isArray(body[channel])) {
          current[channel] = { ...current[channel], ...body[channel] };
          updatedChannels.push(channel);
        }
      }

      if (updatedChannels.length === 0) {
        return fail(
          res,
          400,
          "MP_VALIDATION_ERROR",
          "No valid notification channels provided. Expected: email, webhook, inApp"
        );
      }

      // Record who made the change
      current._meta = current._meta || {};
      current._meta.updatedBy = req.user?.email || req.user?.uid || "api";

      await writePreferences(tenantId, current);

      console.log(
        `[notifications] Updated preferences for tenant ${tenantId}: ${updatedChannels.join(", ")}`
      );

      return ok(res, {
        updatedChannels,
        preferences: current,
      });
    } catch (e) {
      return fail(res, 500, "MP_NOTIFICATIONS_UPDATE_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/notifications/test — Send a test notification
  // ───────────────────────────────────────────────────
  /**
   * Sends a test notification for the specified channel.
   * In this implementation, the notification is logged but not actually delivered.
   * This validates the notification pipeline and preferences are correct.
   *
   * Body: { "channel": "email", "message": "Test notification message" }
   */
  router.post("/test", validate(notifSchemas.testNotification), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const { channel, message } = req.body;

      // Check if the channel is enabled in preferences
      const prefs = await readPreferences(tenantId);
      const channelPrefs = prefs[channel];

      if (!channelPrefs?.enabled) {
        return fail(
          res,
          409,
          "MP_NOTIFICATION_CHANNEL_DISABLED",
          `Notification channel "${channel}" is currently disabled. Enable it in preferences first.`
        );
      }

      const testMessage = message || `Test notification from ModelPricer at ${new Date().toISOString()}`;
      const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Log the test notification (this is where actual delivery would happen)
      console.log(
        `[notifications] TEST notification sent — tenant: ${tenantId}, channel: ${channel}, ` +
        `id: ${testId}, message: "${testMessage}"`
      );

      return ok(res, {
        testId,
        channel,
        message: testMessage,
        sentAt: new Date().toISOString(),
        delivered: true,
        note: "Test notification logged successfully. In production, this would trigger actual delivery.",
      });
    } catch (e) {
      return fail(res, 500, "MP_NOTIFICATION_TEST_FAILED", String(e?.message || e));
    }
  });

  return router;
}

export default createNotificationsRouter;
