/**
 * Webhook Service — manages webhook registrations and delivers event payloads.
 *
 * Features:
 * - Per-tenant webhook registration (stored as JSON files)
 * - HMAC-SHA256 payload signing for verification
 * - Fire-and-forget delivery with retry (3 attempts, exponential backoff)
 * - 10s timeout per HTTP request
 *
 * Supported events:
 *   order.created, order.updated, order.completed, order.cancelled,
 *   slice.completed, slice.failed
 *
 * @module webhookService
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { ensureDir } from "../util/fsSafe.js";

/** All valid webhook event types. */
const VALID_EVENTS = [
  "order.created",
  "order.updated",
  "order.completed",
  "order.cancelled",
  "slice.completed",
  "slice.failed",
];

/** Retry delays in milliseconds (exponential backoff). */
const RETRY_DELAYS = [1_000, 5_000, 25_000];

/** HTTP timeout per delivery attempt (ms). */
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * Resolve the config file path for a tenant's webhooks.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @returns {string}
 */
function configPath(workspaceRoot, tenantId) {
  return path.join(workspaceRoot, "webhooks", tenantId, "config.json");
}

/**
 * Read all webhook configs for a tenant.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @returns {Promise<Array>}
 */
async function readConfigs(workspaceRoot, tenantId) {
  const p = configPath(workspaceRoot, tenantId);
  try {
    const raw = await fs.readFile(p, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Persist webhook configs for a tenant.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {Array} configs
 */
async function writeConfigs(workspaceRoot, tenantId, configs) {
  const p = configPath(workspaceRoot, tenantId);
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(configs, null, 2), "utf8");
}

/**
 * Compute HMAC-SHA256 hex digest for a payload string.
 *
 * @param {string} payload - JSON string
 * @param {string} secret
 * @returns {string} "sha256=<hex>"
 */
function signPayload(payload, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload, "utf8");
  return `sha256=${hmac.digest("hex")}`;
}

/**
 * Deliver a webhook payload to a single URL with retry logic.
 * Runs entirely in the background — never throws to the caller.
 *
 * @param {Object} webhook - { id, url, secret }
 * @param {Object} body - The full event payload object
 */
async function deliverWithRetry(webhook, body) {
  const payloadStr = JSON.stringify(body);
  const signature = signPayload(payloadStr, webhook.secret);

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

      const resp = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ModelPricer-Signature": signature,
          "X-ModelPricer-Event": body.event,
          "X-ModelPricer-Webhook-Id": webhook.id,
        },
        body: payloadStr,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (resp.ok) {
        console.log(
          `[webhook] Delivered ${body.event} to ${webhook.url} (attempt ${attempt + 1}, status ${resp.status})`
        );
        return; // success
      }

      console.warn(
        `[webhook] Non-OK response ${resp.status} from ${webhook.url} for ${body.event} (attempt ${attempt + 1})`
      );
    } catch (err) {
      const reason = err?.name === "AbortError" ? "timeout" : String(err?.message || err);
      console.warn(
        `[webhook] Delivery failed for ${body.event} to ${webhook.url} (attempt ${attempt + 1}): ${reason}`
      );
    }

    // Wait before next retry (unless we've exhausted all attempts)
    if (attempt < RETRY_DELAYS.length) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }
  }

  console.error(
    `[webhook] All ${RETRY_DELAYS.length + 1} delivery attempts exhausted for ${body.event} to ${webhook.url}`
  );
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Register a new webhook for a tenant.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {string} url - The endpoint URL to receive events
 * @param {string[]} events - Array of event names to subscribe to
 * @param {string} secret - Shared secret for HMAC signing
 * @returns {Promise<{ ok: boolean, webhook?: Object, error?: string }>}
 */
export async function registerWebhook(workspaceRoot, tenantId, url, events, secret) {
  // Validate URL
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: "URL must use http or https protocol" };
    }
  } catch {
    return { ok: false, error: "Invalid URL" };
  }

  // Validate events
  if (!Array.isArray(events) || events.length === 0) {
    return { ok: false, error: "At least one event is required" };
  }
  const invalid = events.filter((e) => !VALID_EVENTS.includes(e));
  if (invalid.length > 0) {
    return { ok: false, error: `Invalid events: ${invalid.join(", ")}. Valid: ${VALID_EVENTS.join(", ")}` };
  }

  // Validate secret
  if (!secret || typeof secret !== "string" || secret.length < 8) {
    return { ok: false, error: "Secret must be a string of at least 8 characters" };
  }

  const configs = await readConfigs(workspaceRoot, tenantId);

  // Limit webhooks per tenant (prevent abuse)
  if (configs.length >= 20) {
    return { ok: false, error: "Maximum of 20 webhooks per tenant reached" };
  }

  const webhook = {
    id: crypto.randomUUID(),
    url,
    events,
    secret,
    createdAt: new Date().toISOString(),
    active: true,
  };

  configs.push(webhook);
  await writeConfigs(workspaceRoot, tenantId, configs);

  // Return webhook without exposing the full secret
  const { secret: _s, ...safe } = webhook;
  return { ok: true, webhook: { ...safe, secretPreview: secret.slice(0, 4) + "****" } };
}

/**
 * Remove a webhook by id.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {string} webhookId
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function removeWebhook(workspaceRoot, tenantId, webhookId) {
  const configs = await readConfigs(workspaceRoot, tenantId);
  const idx = configs.findIndex((w) => w.id === webhookId);
  if (idx === -1) {
    return { ok: false, error: "Webhook not found" };
  }
  configs.splice(idx, 1);
  await writeConfigs(workspaceRoot, tenantId, configs);
  return { ok: true };
}

/**
 * Get all webhooks for a tenant (secrets masked).
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @returns {Promise<Array>}
 */
export async function getWebhooks(workspaceRoot, tenantId) {
  const configs = await readConfigs(workspaceRoot, tenantId);
  return configs.map(({ secret, ...rest }) => ({
    ...rest,
    secretPreview: secret ? secret.slice(0, 4) + "****" : "****",
  }));
}

/**
 * Fire a webhook event for a tenant. Delivers to all matching subscriptions
 * in the background (fire-and-forget). Never blocks the caller.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {string} event - Event name (e.g. "order.created")
 * @param {Object} data - Event-specific payload data
 */
export async function fireWebhook(workspaceRoot, tenantId, event, data) {
  if (!VALID_EVENTS.includes(event)) {
    console.warn(`[webhook] Ignoring unknown event: ${event}`);
    return;
  }

  let configs;
  try {
    configs = await readConfigs(workspaceRoot, tenantId);
  } catch (err) {
    console.warn(`[webhook] Failed to read configs for tenant ${tenantId}: ${err?.message || err}`);
    return;
  }

  const matching = configs.filter((w) => w.active && w.events.includes(event));
  if (matching.length === 0) return;

  const body = {
    event,
    timestamp: new Date().toISOString(),
    tenantId,
    data: data || {},
  };

  console.log(`[webhook] Firing ${event} to ${matching.length} subscriber(s) for tenant ${tenantId}`);

  // Fire-and-forget — do not await the deliveries
  for (const webhook of matching) {
    deliverWithRetry(webhook, body).catch((err) => {
      console.error(`[webhook] Unexpected error in deliverWithRetry: ${err?.message || err}`);
    });
  }
}

/**
 * Send a test event to a specific webhook.
 *
 * @param {string} workspaceRoot
 * @param {string} tenantId
 * @param {string} webhookId
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function sendTestEvent(workspaceRoot, tenantId, webhookId) {
  const configs = await readConfigs(workspaceRoot, tenantId);
  const webhook = configs.find((w) => w.id === webhookId);
  if (!webhook) {
    return { ok: false, error: "Webhook not found" };
  }

  const body = {
    event: "test",
    timestamp: new Date().toISOString(),
    tenantId,
    data: {
      message: "This is a test webhook delivery from ModelPricer.",
      webhookId,
    },
  };

  const payloadStr = JSON.stringify(body);
  const signature = signPayload(payloadStr, webhook.secret);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    const resp = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ModelPricer-Signature": signature,
        "X-ModelPricer-Event": "test",
        "X-ModelPricer-Webhook-Id": webhook.id,
      },
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (resp.ok) {
      return { ok: true, status: resp.status };
    }
    return { ok: false, error: `Endpoint returned status ${resp.status}` };
  } catch (err) {
    const reason = err?.name === "AbortError" ? "Request timed out (10s)" : String(err?.message || err);
    return { ok: false, error: reason };
  }
}

export { VALID_EVENTS };
