/**
 * API Documentation & Versioning Routes.
 *
 * Endpoints:
 *   GET /api/docs      — JSON documentation of all available API endpoints
 *   GET /api/docs/html — Self-contained HTML documentation page (Forge dark theme)
 *   GET /api/version   — API version info
 *
 * No authentication required — documentation is public.
 *
 * @module routes/apiDocs
 */

import { Router } from "express";

// ── API Version Constants ──
export const API_VERSION = "v1";
export const API_VERSION_FULL = "1.0.0";

// ── Endpoint Definitions ──
// Single source of truth for all API endpoints.
// HTML and JSON docs are generated from this array.

const ENDPOINTS = [
  // ── System ──
  {
    group: "System",
    method: "GET",
    path: "/api/health",
    description: "Server health check with diagnostics (status, version, uptime, memory).",
    auth: false,
    params: [],
    response: {
      example: { ok: true, data: { status: "ok", version: "0.1.2", uptime: 12345, timestamp: "2026-03-11T10:00:00Z", memory: { rss: 50, heapUsed: 30 }, node: "v18.20.0" } },
    },
  },
  {
    group: "System",
    method: "GET",
    path: "/api/health/prusa",
    description: "PrusaSlicer availability check. Verifies the slicer binary is found and executable.",
    auth: false,
    params: [],
    response: {
      example: { ok: true, checkMethod: "--help", exitCode: 0 },
    },
  },
  {
    group: "System",
    method: "GET",
    path: "/api/version",
    description: "Returns current API and package version.",
    auth: false,
    params: [],
    response: {
      example: { ok: true, data: { version: "0.1.2", apiVersion: "v1" } },
    },
  },
  {
    group: "System",
    method: "GET",
    path: "/api/docs",
    description: "Returns this JSON documentation of all available API endpoints.",
    auth: false,
    params: [],
    response: {
      example: { ok: true, data: { apiVersion: "v1", version: "0.1.2", endpoints: ["..."] } },
    },
  },
  {
    group: "System",
    method: "GET",
    path: "/api/docs/html",
    description: "Returns a self-contained HTML documentation page with interactive endpoint browser.",
    auth: false,
    params: [],
    response: { example: "HTML page" },
  },

  // ── Slicing ──
  {
    group: "Slicing",
    method: "POST",
    path: "/api/slice",
    description: "Upload a 3D model + optional INI/preset, run PrusaSlicer, return slicing metrics (time, filament, layers).",
    auth: true,
    params: [
      { name: "model", in: "body (multipart)", type: "file", required: true, description: "3D model file (.stl, .obj, .3mf, .amf)" },
      { name: "ini", in: "body (multipart)", type: "file", required: false, description: "PrusaSlicer .ini profile (overrides preset)" },
      { name: "presetId", in: "body", type: "string", required: false, description: "Preset ID to use (falls back to tenant default)" },
    ],
    response: {
      example: { success: true, jobId: "job-abc123", durationMs: 4500, usedPreset: "default-pla-02", modelUsed: "test.stl", metrics: { estimatedTime: "1h 23m", filamentUsed: "12.5m", layers: 150 } },
    },
  },
  {
    group: "Slicing",
    method: "POST",
    path: "/api/slice/queue",
    description: "Submit a slicing job to the async queue. Returns immediately with a job ID for polling.",
    auth: true,
    params: [
      { name: "model", in: "body (multipart)", type: "file", required: true, description: "3D model file (.stl, .obj, .3mf, .amf)" },
      { name: "ini", in: "body (multipart)", type: "file", required: false, description: "PrusaSlicer .ini profile" },
      { name: "presetId", in: "body", type: "string", required: false, description: "Preset ID to use" },
    ],
    response: {
      example: { ok: true, data: { jobId: "job-abc123", status: "queued", position: 1 } },
    },
  },
  {
    group: "Slicing",
    method: "GET",
    path: "/api/slice/queue",
    description: "Get queue statistics (pending, processing, completed, failed counts).",
    auth: true,
    params: [],
    response: {
      example: { ok: true, data: { pending: 2, processing: 1, completed: 15, failed: 0 } },
    },
  },
  {
    group: "Slicing",
    method: "GET",
    path: "/api/slice/queue/:jobId",
    description: "Get status and progress of a specific queued slicing job.",
    auth: true,
    params: [
      { name: "jobId", in: "path", type: "string", required: true, description: "Job ID returned from POST /api/slice/queue" },
    ],
    response: {
      example: { ok: true, data: { jobId: "job-abc123", status: "processing", progress: 45 } },
    },
  },
  {
    group: "Slicing",
    method: "DELETE",
    path: "/api/slice/queue/:jobId",
    description: "Cancel a queued or processing slicing job.",
    auth: true,
    params: [
      { name: "jobId", in: "path", type: "string", required: true, description: "Job ID to cancel" },
    ],
    response: {
      example: { ok: true, data: { jobId: "job-abc123", status: "cancelled" } },
    },
  },

  // ── Mesh ──
  {
    group: "Mesh",
    method: "POST",
    path: "/api/mesh/repair",
    description: "Upload a 3D model, repair its mesh using PrusaSlicer, return repaired STL binary.",
    auth: true,
    params: [
      { name: "model", in: "body (multipart)", type: "file", required: true, description: "3D model file (.stl, .obj, .3mf, .amf), max 100MB" },
    ],
    response: {
      example: "Binary STL file (application/octet-stream). Headers: X-Mesh-Repair-Duration-Ms",
    },
  },
  {
    group: "Mesh",
    method: "POST",
    path: "/api/mesh/analyze",
    description: "Upload a 3D model, analyze its mesh (volume, triangle count, manifold status, bounding box).",
    auth: true,
    params: [
      { name: "model", in: "body (multipart)", type: "file", required: true, description: "3D model file (.stl, .obj, .3mf, .amf), max 100MB" },
    ],
    response: {
      example: { ok: true, data: { fileName: "model.stl", volume: 1234.5, isManifold: true, triangleCount: 5000, boundingBox: { min: [0, 0, 0], max: [50, 50, 30] } } },
    },
  },

  // ── Presets ──
  {
    group: "Presets",
    method: "GET",
    path: "/api/presets",
    description: "List all presets for the authenticated tenant.",
    auth: true,
    params: [],
    response: {
      example: { ok: true, data: { presets: [{ id: "p_abc", name: "PLA 0.2mm", visibleInWidget: true }], defaultPresetId: "p_abc" } },
    },
  },
  {
    group: "Presets",
    method: "GET",
    path: "/api/presets/defaults",
    description: "Get PrusaSlicer default presets (PLA, PETG, ABS, TPU reference profiles).",
    auth: true,
    params: [],
    response: {
      example: { ok: true, data: { presets: [{ id: "default-pla-02", name: "PLA - 0.20mm QUALITY", material: "PLA" }] } },
    },
  },
  {
    group: "Presets",
    method: "GET",
    path: "/api/presets/:id",
    description: "Get single preset details including INI file availability.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID" },
    ],
    response: {
      example: { ok: true, data: { id: "p_abc", name: "PLA 0.2mm", hasIniFile: true, isDefault: true } },
    },
  },
  {
    group: "Presets",
    method: "GET",
    path: "/api/presets/:id/content",
    description: "Get the raw INI file content for a preset.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID" },
    ],
    response: {
      example: { ok: true, data: { presetId: "p_abc", content: "# PrusaSlicer config\nlayer_height = 0.2\n..." } },
    },
  },
  {
    group: "Presets",
    method: "POST",
    path: "/api/presets",
    description: "Create a new preset from an uploaded .ini file.",
    auth: true,
    params: [
      { name: "file", in: "body (multipart)", type: "file", required: true, description: "PrusaSlicer .ini file" },
      { name: "name", in: "body", type: "string", required: false, description: "Preset display name" },
      { name: "order", in: "body", type: "number", required: false, description: "Sort order" },
      { name: "visibleInWidget", in: "body", type: "boolean", required: false, description: "Show in public widget" },
    ],
    response: {
      example: { ok: true, data: { presets: ["..."], defaultPresetId: "..." } },
    },
  },
  {
    group: "Presets",
    method: "POST",
    path: "/api/presets/validate",
    description: "Validate a preset configuration and generate a test INI file.",
    auth: true,
    params: [
      { name: "name", in: "body", type: "string", required: true, description: "Preset name" },
      { name: "layerHeight", in: "body", type: "number", required: false, description: "Layer height 0.01-2.0 mm" },
      { name: "nozzleDiameter", in: "body", type: "number", required: false, description: "Nozzle diameter 0.1-2.0 mm" },
      { name: "infillDensity", in: "body", type: "number", required: false, description: "Infill 0-100%" },
      { name: "printSpeed", in: "body", type: "number", required: false, description: "Speed 1-600 mm/s" },
      { name: "temperature", in: "body", type: "number", required: false, description: "Nozzle temp 150-500 C" },
      { name: "bedTemperature", in: "body", type: "number", required: false, description: "Bed temp 0-200 C" },
    ],
    response: {
      example: { ok: true, data: { valid: true, errors: [], generatedIni: "# generated...", message: "Preset configuration is valid" } },
    },
  },
  {
    group: "Presets",
    method: "PATCH",
    path: "/api/presets/:id",
    description: "Update preset metadata (name, order, visibility).",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID" },
      { name: "name", in: "body", type: "string", required: false, description: "New display name" },
      { name: "order", in: "body", type: "number", required: false, description: "New sort order" },
      { name: "visibleInWidget", in: "body", type: "boolean", required: false, description: "Widget visibility" },
    ],
    response: {
      example: { ok: true, data: { presets: ["..."], defaultPresetId: "..." } },
    },
  },
  {
    group: "Presets",
    method: "PUT",
    path: "/api/presets/:id",
    description: "Full update of a preset (replace metadata + regenerate INI if print settings provided).",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID" },
    ],
    response: {
      example: { ok: true, data: { presets: ["..."], defaultPresetId: "..." } },
    },
  },
  {
    group: "Presets",
    method: "POST",
    path: "/api/presets/:id/default",
    description: "Set a preset as the tenant default for slicing.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID to set as default" },
    ],
    response: {
      example: { ok: true, data: { presets: ["..."], defaultPresetId: "p_abc" } },
    },
  },
  {
    group: "Presets",
    method: "POST",
    path: "/api/presets/:id/duplicate",
    description: "Duplicate an existing preset (copies metadata and INI file).",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Source preset ID" },
      { name: "name", in: "body", type: "string", required: false, description: "Name for the copy (default: 'Original (copy)')" },
    ],
    response: {
      example: { ok: true, data: { preset: { id: "p_new", name: "PLA 0.2mm (copy)" }, state: {} } },
    },
  },
  {
    group: "Presets",
    method: "DELETE",
    path: "/api/presets/:id",
    description: "Delete a preset and its INI file.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID to delete" },
    ],
    response: {
      example: { ok: true, data: { presets: ["..."], defaultPresetId: "..." } },
    },
  },

  // ── Widget ──
  {
    group: "Widget",
    method: "GET",
    path: "/api/widget/presets",
    description: "Public endpoint. Returns presets marked as visible in widget (filtered fields, no auth required).",
    auth: false,
    params: [
      { name: "x-tenant-id", in: "header", type: "string", required: false, description: "Tenant ID (falls back to demo-tenant)" },
    ],
    response: {
      example: { presets: [{ id: "p_abc", name: "PLA 0.2mm" }], defaultPresetId: "p_abc" },
    },
  },

  // ── Orders ──
  {
    group: "Orders",
    method: "GET",
    path: "/api/orders",
    description: "List orders with filters (status, date range, search, pagination).",
    auth: true,
    params: [
      { name: "status", in: "query", type: "string", required: false, description: "Filter by status (new, review, approved, processing, printing, ...)" },
      { name: "dateFrom", in: "query", type: "string", required: false, description: "Filter from date (ISO format)" },
      { name: "dateTo", in: "query", type: "string", required: false, description: "Filter to date (ISO format)" },
      { name: "search", in: "query", type: "string", required: false, description: "Search in order number, customer name/email" },
      { name: "page", in: "query", type: "number", required: false, description: "Page number (default: 1)" },
      { name: "pageSize", in: "query", type: "number", required: false, description: "Items per page (default: 20, max: 200)" },
    ],
    response: {
      example: { ok: true, data: { orders: ["..."], total: 42, page: 1, pageSize: 20 } },
    },
  },
  {
    group: "Orders",
    method: "GET",
    path: "/api/orders/stats",
    description: "Get order statistics (counts per status, revenue totals).",
    auth: true,
    params: [],
    response: {
      example: { ok: true, data: { total: 42, byStatus: { new: 5, processing: 3, completed: 30 }, revenue: { total: 15000 } } },
    },
  },
  {
    group: "Orders",
    method: "GET",
    path: "/api/orders/:id",
    description: "Get single order details.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
    ],
    response: {
      example: { ok: true, data: { id: "ord_abc", orderNumber: "MP-0001", status: "new", items: ["..."] } },
    },
  },
  {
    group: "Orders",
    method: "GET",
    path: "/api/orders/:id/summary",
    description: "Get printable HTML order summary.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
      { name: "company", in: "query", type: "string", required: false, description: "Company name for the summary header" },
    ],
    response: { example: "HTML page (text/html)" },
  },
  {
    group: "Orders",
    method: "POST",
    path: "/api/orders",
    description: "Create a new order from checkout data. Fires order.created webhook.",
    auth: true,
    params: [
      { name: "items", in: "body", type: "array", required: true, description: "Order items (each with modelName/name)" },
      { name: "customerName", in: "body", type: "string", required: false, description: "Customer name" },
      { name: "customerEmail", in: "body", type: "string", required: false, description: "Customer email" },
    ],
    response: {
      example: { ok: true, data: { id: "ord_abc", orderNumber: "MP-0001", status: "new" } },
    },
  },
  {
    group: "Orders",
    method: "PATCH",
    path: "/api/orders/:id",
    description: "Update order fields (not status - use /status endpoint). Fires order.updated webhook.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
    ],
    response: {
      example: { ok: true, data: { id: "ord_abc", orderNumber: "MP-0001" } },
    },
  },
  {
    group: "Orders",
    method: "PATCH",
    path: "/api/orders/:id/status",
    description: "Change order status with forward-only validation. Fires order.updated/completed/cancelled webhook.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
      { name: "status", in: "body", type: "string", required: true, description: "New status (new, review, approved, processing, printing, post_processing, ready, shipped, completed, cancelled)" },
      { name: "note", in: "body", type: "string", required: false, description: "Status change note" },
    ],
    response: {
      example: { ok: true, data: { id: "ord_abc", status: "processing" } },
    },
  },
  {
    group: "Orders",
    method: "DELETE",
    path: "/api/orders/:id",
    description: "Soft delete (cancel) an order. Fires order.cancelled webhook.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
      { name: "reason", in: "body/query", type: "string", required: false, description: "Cancellation reason" },
    ],
    response: {
      example: { ok: true, data: { id: "ord_abc", status: "cancelled" } },
    },
  },

  // ── Webhooks ──
  {
    group: "Webhooks",
    method: "GET",
    path: "/api/webhooks",
    description: "List registered webhooks for the tenant (secrets masked).",
    auth: true,
    params: [],
    response: {
      example: { ok: true, data: { webhooks: [{ id: "wh_abc", url: "https://...", events: ["order.created"] }], validEvents: ["..."] } },
    },
  },
  {
    group: "Webhooks",
    method: "POST",
    path: "/api/webhooks",
    description: "Register a new webhook endpoint.",
    auth: true,
    params: [
      { name: "url", in: "body", type: "string", required: true, description: "Webhook URL (HTTPS)" },
      { name: "events", in: "body", type: "array", required: true, description: "Events to subscribe to (e.g. ['order.created', 'slice.completed'])" },
      { name: "secret", in: "body", type: "string", required: true, description: "HMAC secret for signature verification (min 8 chars)" },
    ],
    response: {
      example: { ok: true, data: { id: "wh_abc", url: "https://...", events: ["order.created"] } },
    },
  },
  {
    group: "Webhooks",
    method: "DELETE",
    path: "/api/webhooks/:id",
    description: "Remove a registered webhook.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Webhook ID" },
    ],
    response: {
      example: { ok: true, data: { id: "wh_abc", deleted: true } },
    },
  },
  {
    group: "Webhooks",
    method: "POST",
    path: "/api/webhooks/:id/test",
    description: "Send a test event to a webhook to verify connectivity.",
    auth: true,
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Webhook ID to test" },
    ],
    response: {
      example: { ok: true, data: { webhookId: "wh_abc", testDelivered: true, status: 200 } },
    },
  },

  // ── Auth ──
  {
    group: "Auth",
    method: "POST",
    path: "/api/auth/set-claims",
    description: "Set Firebase custom claims for Supabase RLS integration. User must refresh their token after.",
    auth: true,
    params: [
      { name: "tenantId", in: "body", type: "string", required: false, description: "Explicit tenant ID (falls back to header/default)" },
    ],
    response: {
      example: { ok: true, data: { uid: "firebase-uid", claims: { role: "authenticated", tenant_id: "..." } } },
    },
  },

  // ── Storage ──
  {
    group: "Storage",
    method: "GET",
    path: "/api/storage/*",
    description: "Tenant-scoped key-value storage API. See storage router for sub-routes.",
    auth: true,
    params: [],
    response: {
      example: { ok: true, data: {} },
    },
  },
];

/**
 * Generates the HTML documentation page.
 * Self-contained: no external CSS or JS dependencies.
 *
 * @param {string} pkgVersion - Package version from package.json
 * @returns {string} Complete HTML document
 */
function generateHtmlDocs(pkgVersion) {
  const groups = {};
  for (const ep of ENDPOINTS) {
    if (!groups[ep.group]) groups[ep.group] = [];
    groups[ep.group].push(ep);
  }

  const groupOrder = ["System", "Slicing", "Mesh", "Presets", "Widget", "Orders", "Webhooks", "Auth", "Storage"];
  const groupIcons = {
    System: "&#9881;",       // gear
    Slicing: "&#9986;",      // scissors
    Mesh: "&#9651;",         // triangle
    Presets: "&#9776;",      // hamburger
    Widget: "&#9635;",       // square
    Orders: "&#9993;",       // envelope
    Webhooks: "&#128279;",   // link
    Auth: "&#128274;",       // lock
    Storage: "&#128451;",    // cabinet
  };

  const methodColors = {
    GET: "#22c55e",
    POST: "#3b82f6",
    PATCH: "#eab308",
    PUT: "#f97316",
    DELETE: "#ef4444",
  };

  let endpointSections = "";

  for (const groupName of groupOrder) {
    const eps = groups[groupName];
    if (!eps) continue;

    let endpointCards = "";
    for (let i = 0; i < eps.length; i++) {
      const ep = eps[i];
      const color = methodColors[ep.method] || "#94a3b8";
      const paramsHtml = ep.params.length > 0
        ? `<table class="params-table">
            <thead><tr><th>Name</th><th>In</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>${ep.params.map(p =>
              `<tr><td><code>${p.name}</code></td><td>${p.in}</td><td>${p.type}</td><td>${p.required ? '<span class="req">Yes</span>' : "No"}</td><td>${p.description}</td></tr>`
            ).join("")}</tbody>
           </table>`
        : '<p class="no-params">No parameters</p>';

      const responseJson = typeof ep.response.example === "string"
        ? ep.response.example
        : JSON.stringify(ep.response.example, null, 2);

      endpointCards += `
        <div class="endpoint" data-method="${ep.method}" data-path="${ep.path}" data-group="${groupName}">
          <div class="endpoint-header" onclick="this.parentElement.classList.toggle('open')">
            <span class="method-badge" style="background:${color}">${ep.method}</span>
            <code class="endpoint-path">${ep.path}</code>
            ${ep.auth ? '<span class="auth-badge">Auth</span>' : '<span class="public-badge">Public</span>'}
            <span class="endpoint-desc">${ep.description}</span>
            <span class="chevron">&#9662;</span>
          </div>
          <div class="endpoint-body">
            <h4>Parameters</h4>
            ${paramsHtml}
            <h4>Response Example</h4>
            <pre class="response-example"><code>${escapeHtml(responseJson)}</code></pre>
          </div>
        </div>`;
    }

    endpointSections += `
      <section class="group-section" id="group-${groupName.toLowerCase()}">
        <h2 class="group-title">${groupIcons[groupName] || ""} ${groupName} <span class="ep-count">${eps.length}</span></h2>
        ${endpointCards}
      </section>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ModelPricer API Documentation</title>
<style>
  :root {
    --bg: #0f1117;
    --bg-card: #1a1d27;
    --bg-hover: #22263a;
    --border: #2a2e3f;
    --text: #e2e8f0;
    --text-muted: #7a8291;
    --accent: #3b82f6;
    --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
    --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    line-height: 1.6;
    padding: 0;
  }

  .container { max-width: 960px; margin: 0 auto; padding: 24px 16px; }

  header {
    border-bottom: 1px solid var(--border);
    padding: 32px 0 24px;
    margin-bottom: 24px;
  }

  header h1 {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  header .version {
    color: var(--text-muted);
    font-size: 14px;
    margin-top: 4px;
  }

  header .meta {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--text-muted);
  }

  header .meta span { display: flex; align-items: center; gap: 4px; }

  .search-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .search-bar input {
    flex: 1;
    min-width: 200px;
    padding: 10px 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 14px;
    font-family: var(--font-mono);
    outline: none;
    transition: border-color .15s;
  }

  .search-bar input:focus { border-color: var(--accent); }
  .search-bar input::placeholder { color: var(--text-muted); }

  .filter-btn {
    padding: 8px 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    transition: all .15s;
  }

  .filter-btn:hover, .filter-btn.active {
    background: var(--bg-hover);
    color: var(--text);
    border-color: var(--accent);
  }

  .group-section { margin-bottom: 32px; }

  .group-title {
    font-size: 18px;
    font-weight: 600;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ep-count {
    font-size: 12px;
    background: var(--bg-hover);
    color: var(--text-muted);
    padding: 2px 8px;
    border-radius: 10px;
    margin-left: auto;
  }

  .endpoint {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 8px;
    overflow: hidden;
    transition: border-color .15s;
  }

  .endpoint:hover { border-color: #3a3f52; }

  .endpoint-header {
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    flex-wrap: wrap;
  }

  .method-badge {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    color: #fff;
    min-width: 56px;
    text-align: center;
    flex-shrink: 0;
  }

  .endpoint-path {
    font-family: var(--font-mono);
    font-size: 14px;
    color: var(--text);
    flex-shrink: 0;
  }

  .auth-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(234, 179, 8, 0.15);
    color: #eab308;
    border: 1px solid rgba(234, 179, 8, 0.3);
    flex-shrink: 0;
  }

  .public-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
    flex-shrink: 0;
  }

  .endpoint-desc {
    color: var(--text-muted);
    font-size: 13px;
    flex: 1;
    min-width: 0;
  }

  .chevron {
    color: var(--text-muted);
    font-size: 12px;
    transition: transform .2s;
    flex-shrink: 0;
    margin-left: auto;
  }

  .endpoint.open .chevron { transform: rotate(180deg); }

  .endpoint-body {
    display: none;
    padding: 0 16px 16px;
    border-top: 1px solid var(--border);
  }

  .endpoint.open .endpoint-body { display: block; }

  .endpoint-body h4 {
    font-size: 13px;
    color: var(--text-muted);
    margin: 16px 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .params-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .params-table th {
    text-align: left;
    padding: 6px 10px;
    background: var(--bg);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .params-table td {
    padding: 6px 10px;
    border-top: 1px solid var(--border);
  }

  .params-table code {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--accent);
  }

  .req { color: #ef4444; font-weight: 600; }

  .no-params { color: var(--text-muted); font-size: 13px; font-style: italic; }

  .response-example {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px 16px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;
  }

  .response-example code {
    font-family: var(--font-mono);
    color: #a5b4fc;
  }

  .no-results {
    text-align: center;
    color: var(--text-muted);
    padding: 40px;
    font-size: 14px;
    display: none;
  }

  footer {
    border-top: 1px solid var(--border);
    padding: 16px 0;
    margin-top: 32px;
    color: var(--text-muted);
    font-size: 12px;
    text-align: center;
  }

  @media (max-width: 640px) {
    .endpoint-desc { display: none; }
    .container { padding: 16px 8px; }
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>ModelPricer API</h1>
    <div class="version">v${API_VERSION_FULL} (${API_VERSION}) &middot; Package ${pkgVersion}</div>
    <div class="meta">
      <span>${ENDPOINTS.length} endpoints</span>
      <span>${groupOrder.length} groups</span>
      <span>Base URL: /api</span>
    </div>
  </header>

  <div class="search-bar">
    <input type="text" id="searchInput" placeholder="Search endpoints... (path, method, description)" autocomplete="off">
    <button class="filter-btn active" data-filter="all" onclick="filterMethod('all', this)">All</button>
    <button class="filter-btn" data-filter="GET" onclick="filterMethod('GET', this)">GET</button>
    <button class="filter-btn" data-filter="POST" onclick="filterMethod('POST', this)">POST</button>
    <button class="filter-btn" data-filter="PATCH" onclick="filterMethod('PATCH', this)">PATCH</button>
    <button class="filter-btn" data-filter="PUT" onclick="filterMethod('PUT', this)">PUT</button>
    <button class="filter-btn" data-filter="DELETE" onclick="filterMethod('DELETE', this)">DELETE</button>
  </div>

  <div id="endpointContainer">
    ${endpointSections}
  </div>

  <div class="no-results" id="noResults">No endpoints match your search.</div>

  <footer>
    ModelPricer API Documentation &middot; Generated at ${new Date().toISOString().split("T")[0]}
  </footer>
</div>

<script>
(function() {
  var activeMethod = "all";
  var searchInput = document.getElementById("searchInput");
  var noResults = document.getElementById("noResults");

  function applyFilters() {
    var query = searchInput.value.toLowerCase().trim();
    var endpoints = document.querySelectorAll(".endpoint");
    var sections = document.querySelectorAll(".group-section");
    var anyVisible = false;

    endpoints.forEach(function(ep) {
      var method = ep.getAttribute("data-method");
      var path = ep.getAttribute("data-path").toLowerCase();
      var group = ep.getAttribute("data-group").toLowerCase();
      var desc = ep.querySelector(".endpoint-desc");
      var descText = desc ? desc.textContent.toLowerCase() : "";

      var matchMethod = activeMethod === "all" || method === activeMethod;
      var matchSearch = !query || path.includes(query) || method.toLowerCase().includes(query) || descText.includes(query) || group.includes(query);

      if (matchMethod && matchSearch) {
        ep.style.display = "";
        anyVisible = true;
      } else {
        ep.style.display = "none";
      }
    });

    sections.forEach(function(sec) {
      var visibleEps = sec.querySelectorAll(".endpoint:not([style*='display: none'])");
      sec.style.display = visibleEps.length > 0 ? "" : "none";
    });

    noResults.style.display = anyVisible ? "none" : "block";
  }

  searchInput.addEventListener("input", applyFilters);

  window.filterMethod = function(method, btn) {
    activeMethod = method;
    document.querySelectorAll(".filter-btn").forEach(function(b) { b.classList.remove("active"); });
    btn.classList.add("active");
    applyFilters();
  };
})();
</script>
</body>
</html>`;
}

/**
 * Escape HTML special characters for safe embedding in HTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Creates the API documentation and versioning router.
 *
 * @param {{ pkgVersion: string }} opts
 * @returns {Router}
 */
export function createApiDocsRouter({ pkgVersion }) {
  const router = Router();

  /**
   * GET /api/docs — JSON documentation of all endpoints.
   */
  router.get("/", (_req, res) => {
    res.json({
      ok: true,
      data: {
        apiVersion: API_VERSION,
        version: pkgVersion,
        generatedAt: new Date().toISOString(),
        endpointCount: ENDPOINTS.length,
        groups: [...new Set(ENDPOINTS.map((e) => e.group))],
        endpoints: ENDPOINTS.map((ep) => ({
          group: ep.group,
          method: ep.method,
          path: ep.path,
          description: ep.description,
          auth: ep.auth,
          params: ep.params,
        })),
      },
    });
  });

  /**
   * GET /api/docs/html — Self-contained HTML documentation page.
   */
  router.get("/html", (_req, res) => {
    const html = generateHtmlDocs(pkgVersion);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  return router;
}

export { ENDPOINTS };
export default createApiDocsRouter;
