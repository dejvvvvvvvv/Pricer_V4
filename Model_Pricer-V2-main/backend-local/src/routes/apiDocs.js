/**
 * API Documentation & Versioning Routes.
 *
 * Endpoints:
 *   GET /api/docs        — JSON documentation (OpenAPI-compatible structure)
 *   GET /api/docs/html   — Self-contained interactive HTML documentation page
 *   GET /api/docs/openapi — OpenAPI 3.0.3 JSON schema export
 *   GET /api/version     — API version info
 *
 * No authentication required — documentation is public.
 *
 * @module routes/apiDocs
 */

import { Router } from "express";

// ── API Version Constants ──
export const API_VERSION = "v1";
export const API_VERSION_FULL = "1.0.0";

// ── Rate Limit Tiers ──
// Documents rate limits configured in index.js for each route group.
const RATE_LIMITS = {
  global: { windowMs: 60000, max: 100, description: "100 requests per minute per IP (all /api routes)" },
  write: { windowMs: 60000, max: 30, description: "30 write requests per minute per IP (POST/PATCH/PUT/DELETE)" },
  slice: { windowMs: 60000, max: 10, description: "10 requests per minute per IP (CPU-heavy slicing)" },
  mesh: { windowMs: 60000, max: 10, description: "10 requests per minute per IP (CPU-heavy mesh processing)" },
  auth: { windowMs: 60000, max: 20, description: "20 requests per minute per IP (brute-force protection)" },
};

// ── Error Codes ──
const ERROR_CODES = [
  { code: "MP_VALIDATION_ERROR", status: 400, description: "Request validation failed (missing/invalid fields)" },
  { code: "MP_AUTH_ERROR", status: 401, description: "Authentication failed (missing or invalid token)" },
  { code: "MP_FORBIDDEN", status: 403, description: "Access denied (insufficient permissions or tenant mismatch)" },
  { code: "MP_CORS_BLOCKED", status: 403, description: "CORS origin not in allowlist" },
  { code: "MP_NOT_FOUND", status: 404, description: "Resource or endpoint not found" },
  { code: "MP_UPLOAD_TOO_LARGE", status: 413, description: "Uploaded file exceeds size limit (250MB)" },
  { code: "MP_SLICER_TIMEOUT", status: 504, description: "PrusaSlicer operation timed out (300s default)" },
  { code: "MP_SLICING_FAILED", status: 500, description: "PrusaSlicer failed to produce output" },
  { code: "MP_SLICER_NOT_FOUND", status: 500, description: "PrusaSlicer binary not found on server" },
  { code: "MP_QUEUE_FULL", status: 429, description: "Slicing queue is at capacity" },
  { code: "MP_QUEUE_SUBMIT_FAILED", status: 500, description: "Failed to submit job to slicing queue" },
  { code: "MP_INTERNAL_ERROR", status: 500, description: "Unexpected internal server error" },
  { code: "MP_HEALTH_CHECK_FAILED", status: 500, description: "Health check encountered an error" },
];

// ── Endpoint Definitions ──
// Single source of truth for all API endpoints.
// HTML, JSON, and OpenAPI docs are generated from this array.

const ENDPOINTS = [
  // ── System ──
  {
    group: "System",
    method: "GET",
    path: "/api/health",
    summary: "Health check",
    description: "Server health check with diagnostics (status, version, uptime, memory). Used by uptime monitors.",
    auth: false,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Server health data",
      example: { ok: true, data: { status: "ok", version: "0.1.2", uptime: 12345, timestamp: "2026-03-11T10:00:00Z", memory: { rss: 50, heapUsed: 30 }, node: "v18.20.0" } },
    },
    curl: 'curl http://localhost:3001/api/health',
  },
  {
    group: "System",
    method: "GET",
    path: "/api/health/detailed",
    summary: "Detailed health check",
    description: "Detailed health check with system diagnostics: uptime, memory, CPU, storage status, slicer availability, cache stats, queue stats.",
    auth: false,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Detailed system diagnostics",
      example: { ok: true, data: { status: "healthy", uptime: 12345, uptimeHuman: "3h 25m 45s", memory: { heapUsedMB: 30, rssMB: 50 }, services: { slicer: "available", storage: "available" }, system: { cpuCount: 8, platform: "win32" } } },
    },
    curl: 'curl http://localhost:3001/api/health/detailed',
  },
  {
    group: "System",
    method: "GET",
    path: "/api/health/prusa",
    summary: "PrusaSlicer check",
    description: "PrusaSlicer availability check. Verifies the slicer binary is found and executable. Returns version info if available.",
    auth: false,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Slicer availability status",
      example: { ok: true, checkMethod: "--help", exitCode: 0, version: "2.7.1" },
    },
    curl: 'curl http://localhost:3001/api/health/prusa',
  },
  {
    group: "System",
    method: "GET",
    path: "/api/version",
    summary: "API version",
    description: "Returns current API and package version.",
    auth: false,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Version information",
      example: { ok: true, data: { version: "0.1.2", apiVersion: "v1" } },
    },
    curl: 'curl http://localhost:3001/api/version',
  },
  {
    group: "System",
    method: "GET",
    path: "/api/docs",
    summary: "JSON documentation",
    description: "Returns JSON documentation of all available API endpoints with OpenAPI-compatible structure.",
    auth: false,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "API documentation JSON",
      example: { ok: true, data: { apiVersion: "v1", version: "0.1.2", endpointCount: 38, groups: ["System", "Slicing", "..."], endpoints: ["..."] } },
    },
    curl: 'curl http://localhost:3001/api/docs',
  },
  {
    group: "System",
    method: "GET",
    path: "/api/docs/html",
    summary: "Interactive HTML docs",
    description: "Returns a self-contained HTML documentation page with interactive endpoint browser, search, filters, and copy buttons.",
    auth: false,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "HTML page (text/html)",
      example: "HTML page",
    },
    curl: 'curl http://localhost:3001/api/docs/html',
  },
  {
    group: "System",
    method: "GET",
    path: "/api/docs/openapi",
    summary: "OpenAPI 3.0.3 schema",
    description: "Returns an OpenAPI 3.0.3 JSON schema document for use with Swagger UI or other tools.",
    auth: false,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "OpenAPI JSON schema",
      example: "OpenAPI 3.0.3 JSON document",
    },
    curl: 'curl http://localhost:3001/api/docs/openapi',
  },

  // ── Slicing ──
  {
    group: "Slicing",
    method: "POST",
    path: "/api/slice",
    summary: "Slice a 3D model",
    description: "Upload a 3D model + optional INI/preset, run PrusaSlicer, return slicing metrics (time, filament, layers). Supports result caching for identical model+INI combinations.",
    auth: true,
    rateLimit: "slice",
    params: [
      { name: "model", in: "body (multipart)", type: "file", required: true, description: "3D model file (.stl, .obj, .3mf, .amf), max 250MB" },
      { name: "ini", in: "body (multipart)", type: "file", required: false, description: "PrusaSlicer .ini profile (overrides preset)" },
      { name: "presetId", in: "body", type: "string", required: false, description: "Preset ID to use (falls back to tenant default)" },
    ],
    requestBody: {
      contentType: "multipart/form-data",
      schema: {
        model: { type: "file", required: true, formats: [".stl", ".obj", ".3mf", ".amf"], maxSize: "250MB" },
        ini: { type: "file", required: false, formats: [".ini"] },
        presetId: { type: "string", required: false },
      },
    },
    response: {
      status: 200,
      description: "Slicing results with metrics",
      example: { success: true, jobId: "job-abc123", cached: false, durationMs: 4500, usedPreset: "default-pla-02", modelUsed: "test.stl", modelInfo: { volume: 1234.5, boundingBox: { min: [0, 0, 0], max: [50, 50, 30] } }, metrics: { estimatedTime: "1h 23m", filamentUsed: "12.5m", layers: 150 } },
    },
    errorResponses: [
      { status: 400, errorCode: "MP_VALIDATION_ERROR", description: "Missing model file or invalid file type" },
      { status: 400, errorCode: "MP_VALIDATION_ERROR", description: "No .ini profile available" },
      { status: 500, errorCode: "MP_SLICING_FAILED", description: "PrusaSlicer failed to produce output" },
      { status: 504, errorCode: "MP_SLICER_TIMEOUT", description: "PrusaSlicer timed out (300s)" },
    ],
    curl: 'curl -X POST http://localhost:3001/api/slice \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "x-tenant-id: demo-tenant" \\\n  -F "model=@model.stl" \\\n  -F "presetId=default-pla-02"',
  },
  {
    group: "Slicing",
    method: "POST",
    path: "/api/slice/queue",
    summary: "Queue a slicing job",
    description: "Submit a slicing job to the async queue. Returns immediately with a job ID for polling. Supports priority levels.",
    auth: true,
    rateLimit: "slice",
    params: [
      { name: "model", in: "body (multipart)", type: "file", required: true, description: "3D model file (.stl, .obj, .3mf, .amf), max 250MB" },
      { name: "ini", in: "body (multipart)", type: "file", required: false, description: "PrusaSlicer .ini profile" },
      { name: "presetId", in: "body", type: "string", required: false, description: "Preset ID to use" },
      { name: "priority", in: "body", type: "string", required: false, description: "Job priority: 'normal' (default) or 'high'", enum: ["normal", "high"] },
    ],
    requestBody: {
      contentType: "multipart/form-data",
      schema: {
        model: { type: "file", required: true, formats: [".stl", ".obj", ".3mf", ".amf"], maxSize: "250MB" },
        ini: { type: "file", required: false, formats: [".ini"] },
        presetId: { type: "string", required: false },
        priority: { type: "string", required: false, enum: ["normal", "high"], default: "normal" },
      },
    },
    response: {
      status: 202,
      description: "Job accepted and queued",
      example: { ok: true, data: { jobId: "job-abc123", status: "queued", position: 1 } },
    },
    errorResponses: [
      { status: 400, errorCode: "MP_BAD_REQUEST", description: "Missing model file" },
      { status: 429, errorCode: "MP_QUEUE_FULL", description: "Queue is at capacity" },
    ],
    curl: 'curl -X POST http://localhost:3001/api/slice/queue \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "x-tenant-id: demo-tenant" \\\n  -F "model=@model.stl" \\\n  -F "priority=high"',
  },
  {
    group: "Slicing",
    method: "GET",
    path: "/api/slice/queue",
    summary: "Queue statistics",
    description: "Get queue statistics (pending, processing, completed, failed counts).",
    auth: true,
    rateLimit: "slice",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Queue statistics",
      example: { ok: true, data: { pending: 2, processing: 1, completed: 15, failed: 0 } },
    },
    curl: 'curl http://localhost:3001/api/slice/queue \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Slicing",
    method: "GET",
    path: "/api/slice/queue/:jobId",
    summary: "Job status",
    description: "Get status and progress of a specific queued slicing job.",
    auth: true,
    rateLimit: "slice",
    params: [
      { name: "jobId", in: "path", type: "string", required: true, description: "Job ID returned from POST /api/slice/queue" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Job status and progress",
      example: { ok: true, data: { jobId: "job-abc123", status: "processing", progress: 45 } },
    },
    errorResponses: [
      { status: 404, errorCode: "MP_NOT_FOUND", description: "Job ID not found" },
    ],
    curl: 'curl http://localhost:3001/api/slice/queue/job-abc123 \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Slicing",
    method: "DELETE",
    path: "/api/slice/queue/:jobId",
    summary: "Cancel queued job",
    description: "Cancel a queued or processing slicing job. Kills the PrusaSlicer process if running.",
    auth: true,
    rateLimit: "slice",
    params: [
      { name: "jobId", in: "path", type: "string", required: true, description: "Job ID to cancel" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Job cancelled",
      example: { ok: true, data: { jobId: "job-abc123", status: "cancelled" } },
    },
    errorResponses: [
      { status: 404, errorCode: "MP_NOT_FOUND", description: "Job ID not found" },
      { status: 409, errorCode: "MP_CONFLICT", description: "Job already completed or cancelled" },
    ],
    curl: 'curl -X DELETE http://localhost:3001/api/slice/queue/job-abc123 \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },

  // ── Mesh ──
  {
    group: "Mesh",
    method: "POST",
    path: "/api/mesh/repair",
    summary: "Repair mesh",
    description: "Upload a 3D model, repair its mesh using PrusaSlicer, return repaired STL binary. Response header X-Mesh-Repair-Duration-Ms contains processing time.",
    auth: true,
    rateLimit: "mesh",
    params: [
      { name: "model", in: "body (multipart)", type: "file", required: true, description: "3D model file (.stl, .obj, .3mf, .amf), max 100MB" },
    ],
    requestBody: {
      contentType: "multipart/form-data",
      schema: {
        model: { type: "file", required: true, formats: [".stl", ".obj", ".3mf", ".amf"], maxSize: "100MB" },
      },
    },
    response: {
      status: 200,
      description: "Binary STL file (application/octet-stream)",
      example: "Binary STL file. Headers: X-Mesh-Repair-Duration-Ms: 1234",
    },
    curl: 'curl -X POST http://localhost:3001/api/mesh/repair \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -F "model=@broken_model.stl" \\\n  --output repaired.stl',
  },
  {
    group: "Mesh",
    method: "POST",
    path: "/api/mesh/analyze",
    summary: "Analyze mesh",
    description: "Upload a 3D model, analyze its mesh geometry (volume, triangle count, manifold status, bounding box dimensions).",
    auth: true,
    rateLimit: "mesh",
    params: [
      { name: "model", in: "body (multipart)", type: "file", required: true, description: "3D model file (.stl, .obj, .3mf, .amf), max 100MB" },
    ],
    requestBody: {
      contentType: "multipart/form-data",
      schema: {
        model: { type: "file", required: true, formats: [".stl", ".obj", ".3mf", ".amf"], maxSize: "100MB" },
      },
    },
    response: {
      status: 200,
      description: "Mesh analysis results",
      example: { ok: true, data: { fileName: "model.stl", volume: 1234.5, isManifold: true, triangleCount: 5000, boundingBox: { min: [0, 0, 0], max: [50, 50, 30] } } },
    },
    curl: 'curl -X POST http://localhost:3001/api/mesh/analyze \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -F "model=@model.stl"',
  },

  // ── Presets ──
  {
    group: "Presets",
    method: "GET",
    path: "/api/presets",
    summary: "List presets",
    description: "List all presets for the authenticated tenant. Returns preset metadata and the default preset ID.",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Array of preset objects",
      example: { ok: true, data: { presets: [{ id: "p_abc", name: "PLA 0.2mm", visibleInWidget: true, order: 1, hasIniFile: true }], defaultPresetId: "p_abc" } },
    },
    curl: 'curl http://localhost:3001/api/presets \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "x-tenant-id: demo-tenant"',
  },
  {
    group: "Presets",
    method: "GET",
    path: "/api/presets/defaults",
    summary: "Default presets",
    description: "Get PrusaSlicer built-in default presets (PLA, PETG, ABS, TPU reference profiles).",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Built-in preset list",
      example: { ok: true, data: { presets: [{ id: "default-pla-02", name: "PLA - 0.20mm QUALITY", material: "PLA", layerHeight: 0.2 }] } },
    },
    curl: 'curl http://localhost:3001/api/presets/defaults \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Presets",
    method: "GET",
    path: "/api/presets/:id",
    summary: "Get preset",
    description: "Get single preset details including INI file availability and default status.",
    auth: true,
    rateLimit: "global",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID (e.g. 'p_abc123')" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Preset details",
      example: { ok: true, data: { id: "p_abc", name: "PLA 0.2mm", hasIniFile: true, isDefault: true, visibleInWidget: true, order: 1 } },
    },
    errorResponses: [
      { status: 404, errorCode: "MP_NOT_FOUND", description: "Preset not found" },
    ],
    curl: 'curl http://localhost:3001/api/presets/p_abc \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Presets",
    method: "GET",
    path: "/api/presets/:id/content",
    summary: "Get preset INI",
    description: "Get the raw INI file content for a preset. Returns the PrusaSlicer configuration text.",
    auth: true,
    rateLimit: "global",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "INI file content",
      example: { ok: true, data: { presetId: "p_abc", content: "# PrusaSlicer config\nlayer_height = 0.2\ninfill_density = 20%\n..." } },
    },
    errorResponses: [
      { status: 404, errorCode: "MP_NOT_FOUND", description: "Preset or INI file not found" },
    ],
    curl: 'curl http://localhost:3001/api/presets/p_abc/content \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Presets",
    method: "POST",
    path: "/api/presets",
    summary: "Create preset",
    description: "Create a new preset from an uploaded .ini file. Optionally set name, sort order, and widget visibility.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "file", in: "body (multipart)", type: "file", required: true, description: "PrusaSlicer .ini file" },
      { name: "name", in: "body", type: "string", required: false, description: "Preset display name (max 200 chars)" },
      { name: "order", in: "body", type: "number", required: false, description: "Sort order (0-10000)" },
      { name: "visibleInWidget", in: "body", type: "boolean", required: false, description: "Show in public widget (default: false)" },
    ],
    requestBody: {
      contentType: "multipart/form-data",
      schema: {
        file: { type: "file", required: true, formats: [".ini"] },
        name: { type: "string", required: false, maxLength: 200 },
        order: { type: "number", required: false, min: 0, max: 10000 },
        visibleInWidget: { type: "boolean", required: false, default: false },
      },
    },
    response: {
      status: 201,
      description: "Updated preset list",
      example: { ok: true, data: { presets: [{ id: "p_new", name: "Custom PLA", visibleInWidget: true }], defaultPresetId: "p_new" } },
    },
    curl: 'curl -X POST http://localhost:3001/api/presets \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "x-tenant-id: demo-tenant" \\\n  -F "file=@config.ini" \\\n  -F "name=My Custom PLA" \\\n  -F "visibleInWidget=true"',
  },
  {
    group: "Presets",
    method: "POST",
    path: "/api/presets/validate",
    summary: "Validate preset config",
    description: "Validate a preset configuration and generate a test INI file. Does not save anything.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "name", in: "body", type: "string", required: true, description: "Preset name" },
      { name: "layerHeight", in: "body", type: "number", required: false, description: "Layer height 0.01-2.0 mm" },
      { name: "nozzleDiameter", in: "body", type: "number", required: false, description: "Nozzle diameter 0.1-2.0 mm" },
      { name: "infillDensity", in: "body", type: "number", required: false, description: "Infill 0-100%" },
      { name: "printSpeed", in: "body", type: "number", required: false, description: "Speed 1-600 mm/s" },
      { name: "temperature", in: "body", type: "number", required: false, description: "Nozzle temp 150-500 C" },
      { name: "bedTemperature", in: "body", type: "number", required: false, description: "Bed temp 0-200 C" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        name: { type: "string", required: true },
        layerHeight: { type: "number", required: false, min: 0.01, max: 2.0 },
        nozzleDiameter: { type: "number", required: false, min: 0.1, max: 2.0 },
        infillDensity: { type: "number", required: false, min: 0, max: 100 },
        printSpeed: { type: "number", required: false, min: 1, max: 600 },
        temperature: { type: "number", required: false, min: 150, max: 500 },
        bedTemperature: { type: "number", required: false, min: 0, max: 200 },
      },
    },
    response: {
      status: 200,
      description: "Validation result with generated INI",
      example: { ok: true, data: { valid: true, errors: [], generatedIni: "# PrusaSlicer config\nlayer_height = 0.2\n...", message: "Preset configuration is valid" } },
    },
    curl: 'curl -X POST http://localhost:3001/api/presets/validate \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name":"Test PLA","layerHeight":0.2,"infillDensity":20}\'',
  },
  {
    group: "Presets",
    method: "PATCH",
    path: "/api/presets/:id",
    summary: "Update preset",
    description: "Update preset metadata (name, order, visibility). Does not change the INI file.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID" },
      { name: "name", in: "body", type: "string", required: false, description: "New display name (max 200 chars)" },
      { name: "order", in: "body", type: "number", required: false, description: "New sort order (0-10000)" },
      { name: "visibleInWidget", in: "body", type: "boolean", required: false, description: "Widget visibility" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        name: { type: "string", required: false, maxLength: 200 },
        order: { type: "number", required: false, min: 0, max: 10000 },
        visibleInWidget: { type: "boolean", required: false },
      },
    },
    response: {
      status: 200,
      description: "Updated preset list",
      example: { ok: true, data: { presets: [{ id: "p_abc", name: "Updated Name" }], defaultPresetId: "p_abc" } },
    },
    curl: 'curl -X PATCH http://localhost:3001/api/presets/p_abc \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name":"Updated Name","visibleInWidget":true}\'',
  },
  {
    group: "Presets",
    method: "PUT",
    path: "/api/presets/:id",
    summary: "Replace preset",
    description: "Full update of a preset (replace metadata + regenerate INI if print settings provided).",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        name: { type: "string", required: false },
        layerHeight: { type: "number", required: false },
        nozzleDiameter: { type: "number", required: false },
        infillDensity: { type: "number", required: false },
      },
    },
    response: {
      status: 200,
      description: "Updated preset list",
      example: { ok: true, data: { presets: ["..."], defaultPresetId: "..." } },
    },
    curl: 'curl -X PUT http://localhost:3001/api/presets/p_abc \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name":"New Name","layerHeight":0.15}\'',
  },
  {
    group: "Presets",
    method: "POST",
    path: "/api/presets/:id/default",
    summary: "Set default preset",
    description: "Set a preset as the tenant default for slicing. Only one preset can be default at a time.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID to set as default" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Updated preset list with new default",
      example: { ok: true, data: { presets: ["..."], defaultPresetId: "p_abc" } },
    },
    curl: 'curl -X POST http://localhost:3001/api/presets/p_abc/default \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Presets",
    method: "POST",
    path: "/api/presets/:id/duplicate",
    summary: "Duplicate preset",
    description: "Duplicate an existing preset (copies metadata and INI file). Optionally provide a new name.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Source preset ID" },
      { name: "name", in: "body", type: "string", required: false, description: "Name for the copy (default: 'Original (copy)')" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        name: { type: "string", required: false, maxLength: 200 },
      },
    },
    response: {
      status: 201,
      description: "Duplicated preset and updated state",
      example: { ok: true, data: { preset: { id: "p_new", name: "PLA 0.2mm (copy)" }, state: {} } },
    },
    curl: 'curl -X POST http://localhost:3001/api/presets/p_abc/duplicate \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"name":"My Copy"}\'',
  },
  {
    group: "Presets",
    method: "DELETE",
    path: "/api/presets/:id",
    summary: "Delete preset",
    description: "Delete a preset and its INI file. Cannot delete the currently active default preset unless another exists.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Preset ID to delete" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Updated preset list after deletion",
      example: { ok: true, data: { presets: ["..."], defaultPresetId: "..." } },
    },
    errorResponses: [
      { status: 404, errorCode: "MP_NOT_FOUND", description: "Preset not found" },
    ],
    curl: 'curl -X DELETE http://localhost:3001/api/presets/p_abc \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },

  // ── Widget ──
  {
    group: "Widget",
    method: "GET",
    path: "/api/widget/presets",
    summary: "Public preset list",
    description: "Public endpoint (no auth). Returns presets marked as visible in widget with filtered fields. Used by embedded calculator widget.",
    auth: false,
    rateLimit: "global",
    params: [
      { name: "x-tenant-id", in: "header", type: "string", required: false, description: "Tenant ID (falls back to 'demo-tenant')" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Widget-visible presets (filtered fields)",
      example: { presets: [{ id: "p_abc", name: "PLA 0.2mm" }], defaultPresetId: "p_abc" },
    },
    curl: 'curl http://localhost:3001/api/widget/presets \\\n  -H "x-tenant-id: demo-tenant"',
  },

  // ── Orders ──
  {
    group: "Orders",
    method: "GET",
    path: "/api/orders",
    summary: "List orders",
    description: "List orders with filters (status, date range, search, pagination). Returns paginated results.",
    auth: true,
    rateLimit: "global",
    params: [
      { name: "status", in: "query", type: "string", required: false, description: "Filter by status", enum: ["new", "review", "approved", "processing", "printing", "post_processing", "ready", "shipped", "completed", "cancelled"] },
      { name: "dateFrom", in: "query", type: "string", required: false, description: "Filter from date (ISO 8601 format)" },
      { name: "dateTo", in: "query", type: "string", required: false, description: "Filter to date (ISO 8601 format)" },
      { name: "search", in: "query", type: "string", required: false, description: "Search in order number, customer name/email (max 200 chars)" },
      { name: "page", in: "query", type: "number", required: false, description: "Page number (default: 1, min: 1)" },
      { name: "pageSize", in: "query", type: "number", required: false, description: "Items per page (default: 20, max: 200)" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Paginated order list",
      example: { ok: true, data: { orders: [{ id: "ord_abc", orderNumber: "MP-0001", status: "new", customerName: "John Doe", totalPrice: 450 }], total: 42, page: 1, pageSize: 20 } },
    },
    curl: 'curl "http://localhost:3001/api/orders?status=new&page=1&pageSize=10" \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Orders",
    method: "GET",
    path: "/api/orders/stats",
    summary: "Order statistics",
    description: "Get order statistics: counts per status and revenue totals.",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Aggregated order statistics",
      example: { ok: true, data: { total: 42, byStatus: { new: 5, processing: 3, completed: 30, cancelled: 4 }, revenue: { total: 15000, currency: "CZK" } } },
    },
    curl: 'curl http://localhost:3001/api/orders/stats \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Orders",
    method: "GET",
    path: "/api/orders/:id",
    summary: "Get order",
    description: "Get single order details including items, customer info, status history.",
    auth: true,
    rateLimit: "global",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Order details",
      example: { ok: true, data: { id: "ord_abc", orderNumber: "MP-0001", status: "new", customerName: "John Doe", customerEmail: "john@example.com", items: [{ modelName: "part.stl", quantity: 2, price: 225 }], totalPrice: 450 } },
    },
    curl: 'curl http://localhost:3001/api/orders/ord_abc \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Orders",
    method: "GET",
    path: "/api/orders/:id/summary",
    summary: "Order summary (HTML)",
    description: "Get printable HTML order summary. Suitable for printing or PDF generation.",
    auth: true,
    rateLimit: "global",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
      { name: "company", in: "query", type: "string", required: false, description: "Company name for the summary header" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "HTML page (text/html)",
      example: "HTML page with order summary, printable layout",
    },
    curl: 'curl "http://localhost:3001/api/orders/ord_abc/summary?company=My+3D+Shop" \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Orders",
    method: "POST",
    path: "/api/orders",
    summary: "Create order",
    description: "Create a new order from checkout data. Fires order.created webhook.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "items", in: "body", type: "array", required: true, description: "Order items (each with modelName/name, quantity, price)" },
      { name: "customerName", in: "body", type: "string", required: false, description: "Customer name (max 200 chars)" },
      { name: "customerEmail", in: "body", type: "string", required: false, description: "Customer email (max 200 chars)" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        items: { type: "array", required: true, description: "Array of order items" },
        customerName: { type: "string", required: false, maxLength: 200 },
        customerEmail: { type: "string", required: false, maxLength: 200 },
      },
    },
    response: {
      status: 201,
      description: "Created order",
      example: { ok: true, data: { id: "ord_abc", orderNumber: "MP-0001", status: "new", createdAt: "2026-03-12T10:00:00Z" } },
    },
    curl: 'curl -X POST http://localhost:3001/api/orders \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"items":[{"modelName":"part.stl","quantity":2,"price":225}],"customerName":"John Doe","customerEmail":"john@example.com"}\'',
  },
  {
    group: "Orders",
    method: "PATCH",
    path: "/api/orders/:id",
    summary: "Update order",
    description: "Update order fields (not status -- use /status endpoint). Fires order.updated webhook.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        customerName: { type: "string", required: false },
        customerEmail: { type: "string", required: false },
        notes: { type: "string", required: false },
      },
    },
    response: {
      status: 200,
      description: "Updated order",
      example: { ok: true, data: { id: "ord_abc", orderNumber: "MP-0001" } },
    },
    curl: 'curl -X PATCH http://localhost:3001/api/orders/ord_abc \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"notes":"Rush order"}\'',
  },
  {
    group: "Orders",
    method: "PATCH",
    path: "/api/orders/:id/status",
    summary: "Change order status",
    description: "Change order status with forward-only validation. Fires order.updated/completed/cancelled webhook. Status flow: new -> review -> approved -> processing -> printing -> post_processing -> ready -> shipped -> completed. Cancelled is available from most states.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
      { name: "status", in: "body", type: "string", required: true, description: "New status", enum: ["new", "review", "approved", "processing", "printing", "post_processing", "ready", "shipped", "completed", "cancelled"] },
      { name: "note", in: "body", type: "string", required: false, description: "Status change note (stored in history)" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        status: { type: "string", required: true, enum: ["new", "review", "approved", "processing", "printing", "post_processing", "ready", "shipped", "completed", "cancelled"] },
        note: { type: "string", required: false },
      },
    },
    response: {
      status: 200,
      description: "Updated order with new status",
      example: { ok: true, data: { id: "ord_abc", status: "processing", statusHistory: [{ from: "approved", to: "processing", at: "2026-03-12T10:00:00Z" }] } },
    },
    errorResponses: [
      { status: 400, errorCode: "MP_VALIDATION_ERROR", description: "Invalid status transition" },
    ],
    curl: 'curl -X PATCH http://localhost:3001/api/orders/ord_abc/status \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"status":"processing","note":"Starting print"}\'',
  },
  {
    group: "Orders",
    method: "DELETE",
    path: "/api/orders/:id",
    summary: "Cancel order",
    description: "Soft delete (cancel) an order. Sets status to 'cancelled'. Fires order.cancelled webhook.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Order ID" },
      { name: "reason", in: "body/query", type: "string", required: false, description: "Cancellation reason" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Cancelled order",
      example: { ok: true, data: { id: "ord_abc", status: "cancelled" } },
    },
    curl: 'curl -X DELETE "http://localhost:3001/api/orders/ord_abc?reason=Customer+request" \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },

  // ── Webhooks ──
  {
    group: "Webhooks",
    method: "GET",
    path: "/api/webhooks",
    summary: "List webhooks",
    description: "List registered webhooks for the tenant. Secrets are masked in the response.",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Webhook list with valid event types",
      example: { ok: true, data: { webhooks: [{ id: "wh_abc", url: "https://example.com/webhook", events: ["order.created", "slice.completed"], active: true }], validEvents: ["order.created", "order.updated", "order.completed", "order.cancelled", "slice.completed", "slice.failed"] } },
    },
    curl: 'curl http://localhost:3001/api/webhooks \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Webhooks",
    method: "POST",
    path: "/api/webhooks",
    summary: "Register webhook",
    description: "Register a new webhook endpoint. Webhook payloads are signed with HMAC-SHA256 using the provided secret.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "url", in: "body", type: "string", required: true, description: "Webhook URL (must be HTTPS in production)" },
      { name: "events", in: "body", type: "array", required: true, description: "Events to subscribe to", enum: ["order.created", "order.updated", "order.completed", "order.cancelled", "slice.completed", "slice.failed"] },
      { name: "secret", in: "body", type: "string", required: true, description: "HMAC secret for signature verification (min 8 chars)" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        url: { type: "string", required: true, format: "uri" },
        events: { type: "array", required: true, items: { type: "string", enum: ["order.created", "order.updated", "order.completed", "order.cancelled", "slice.completed", "slice.failed"] } },
        secret: { type: "string", required: true, minLength: 8 },
      },
    },
    response: {
      status: 201,
      description: "Created webhook",
      example: { ok: true, data: { id: "wh_abc", url: "https://example.com/webhook", events: ["order.created"], active: true } },
    },
    curl: 'curl -X POST http://localhost:3001/api/webhooks \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"url":"https://example.com/webhook","events":["order.created"],"secret":"my-secret-key-12345"}\'',
  },
  {
    group: "Webhooks",
    method: "DELETE",
    path: "/api/webhooks/:id",
    summary: "Remove webhook",
    description: "Remove a registered webhook. Stops all future deliveries.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Webhook ID" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Deleted webhook",
      example: { ok: true, data: { id: "wh_abc", deleted: true } },
    },
    curl: 'curl -X DELETE http://localhost:3001/api/webhooks/wh_abc \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Webhooks",
    method: "POST",
    path: "/api/webhooks/:id/test",
    summary: "Test webhook",
    description: "Send a test event to a webhook to verify connectivity. Returns the HTTP status from the target.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "id", in: "path", type: "string", required: true, description: "Webhook ID to test" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Test delivery result",
      example: { ok: true, data: { webhookId: "wh_abc", testDelivered: true, status: 200, responseTimeMs: 150 } },
    },
    curl: 'curl -X POST http://localhost:3001/api/webhooks/wh_abc/test \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },

  // ── Email ──
  {
    group: "Email",
    method: "GET",
    path: "/api/email/templates",
    summary: "List email templates",
    description: "List available email templates for order confirmations, status updates, etc.",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Template list",
      example: { ok: true, templates: [{ id: "order_confirmed", name: "Order Confirmed" }, { id: "order_shipped", name: "Order Shipped" }] },
    },
    curl: 'curl http://localhost:3001/api/email/templates \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Email",
    method: "POST",
    path: "/api/email/send",
    summary: "Send email",
    description: "Send an email using a template. In demo mode (no provider configured), emails are logged but not actually sent.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "to", in: "body", type: "string", required: true, description: "Recipient email address" },
      { name: "subject", in: "body", type: "string", required: true, description: "Email subject" },
      { name: "templateId", in: "body", type: "string", required: false, description: "Template ID to render" },
      { name: "data", in: "body", type: "object", required: false, description: "Template data variables" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        to: { type: "string", required: true, format: "email" },
        subject: { type: "string", required: true },
        templateId: { type: "string", required: false },
        data: { type: "object", required: false },
      },
    },
    response: {
      status: 200,
      description: "Send result",
      example: { ok: true, success: true, mode: "demo", message: "Email logged (no provider configured)" },
    },
    curl: 'curl -X POST http://localhost:3001/api/email/send \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"to":"customer@example.com","subject":"Order Confirmed","templateId":"order_confirmed","data":{"orderNumber":"MP-0001"}}\'',
  },
  {
    group: "Email",
    method: "POST",
    path: "/api/email/preview",
    summary: "Preview email template",
    description: "Render an email template preview without sending. Returns the rendered HTML.",
    auth: true,
    rateLimit: "global",
    params: [
      { name: "templateId", in: "body", type: "string", required: true, description: "Template ID to render" },
      { name: "data", in: "body", type: "object", required: false, description: "Template data variables" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        templateId: { type: "string", required: true },
        data: { type: "object", required: false },
      },
    },
    response: {
      status: 200,
      description: "Rendered HTML preview",
      example: { ok: true, html: "<html><body><h1>Order Confirmed</h1>...</body></html>" },
    },
    curl: 'curl -X POST http://localhost:3001/api/email/preview \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"templateId":"order_confirmed","data":{"orderNumber":"MP-0001"}}\'',
  },
  {
    group: "Email",
    method: "GET",
    path: "/api/email/log",
    summary: "Email send log",
    description: "Get recent email send log (last 200 entries). Useful for debugging email delivery.",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Recent email log entries",
      example: { ok: true, log: [{ to: "user@example.com", subject: "Order Confirmed", status: "demo", timestamp: "2026-03-12T10:00:00Z" }] },
    },
    curl: 'curl http://localhost:3001/api/email/log \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },

  // ── Invoices ──
  {
    group: "Invoices",
    method: "GET",
    path: "/api/invoices/:orderId",
    summary: "Get invoice",
    description: "Get existing invoice for an order. Returns invoice data if previously generated.",
    auth: true,
    rateLimit: "global",
    params: [
      { name: "orderId", in: "path", type: "string", required: true, description: "Order ID" },
    ],
    requestBody: null,
    response: {
      status: 200,
      description: "Invoice data",
      example: { ok: true, data: { invoiceNumber: "INV-20260312-ABC123", orderId: "ord_abc", status: "generated", totalPrice: 1500, currency: "CZK", issuedAt: "2026-03-12T10:00:00Z" } },
    },
    errorResponses: [
      { status: 404, errorCode: "MP_NOT_FOUND", description: "No invoice found for this order" },
    ],
    curl: 'curl http://localhost:3001/api/invoices/ord_abc \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Invoices",
    method: "POST",
    path: "/api/invoices/:orderId/generate",
    summary: "Generate invoice",
    description: "Generate a new invoice for an order. Creates invoice data from order details, items, and pricing.",
    auth: true,
    rateLimit: "write",
    params: [
      { name: "orderId", in: "path", type: "string", required: true, description: "Order ID to generate invoice for" },
    ],
    requestBody: null,
    response: {
      status: 201,
      description: "Generated invoice",
      example: { ok: true, data: { invoiceNumber: "INV-20260312-ABC123", orderId: "ord_abc", items: [{ name: "part.stl x2", price: 450 }], totalPrice: 1500, currency: "CZK" } },
    },
    curl: 'curl -X POST http://localhost:3001/api/invoices/ord_abc/generate \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },

  // ── Config ──
  {
    group: "Config",
    method: "GET",
    path: "/api/config/branding",
    summary: "Get branding config",
    description: "Get branding configuration for the tenant (logo, colors, company name). Used by widget theming.",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Branding configuration",
      example: { ok: true, data: { companyName: "My 3D Print Shop", primaryColor: "#3b82f6", logoUrl: "https://..." } },
    },
    curl: 'curl http://localhost:3001/api/config/branding \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
  {
    group: "Config",
    method: "GET",
    path: "/api/config/company",
    summary: "Get company config",
    description: "Get company configuration for the tenant (address, ICO, DIC, contact info). Used for invoices and legal documents.",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Company configuration",
      example: { ok: true, data: { name: "My Company s.r.o.", ico: "12345678", dic: "CZ12345678", address: "Hlavni 1, 110 00 Praha 1", email: "info@company.cz", phone: "+420 123 456 789" } },
    },
    curl: 'curl http://localhost:3001/api/config/company \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },

  // ── Auth ──
  {
    group: "Auth",
    method: "POST",
    path: "/api/auth/set-claims",
    summary: "Set auth claims",
    description: "Set Firebase custom claims for Supabase RLS integration. User must refresh their token after calling this endpoint.",
    auth: true,
    rateLimit: "auth",
    params: [
      { name: "tenantId", in: "body", type: "string", required: false, description: "Explicit tenant ID (falls back to header/default)" },
    ],
    requestBody: {
      contentType: "application/json",
      schema: {
        tenantId: { type: "string", required: false },
      },
    },
    response: {
      status: 200,
      description: "Claims set successfully",
      example: { ok: true, data: { uid: "firebase-uid", claims: { role: "authenticated", tenant_id: "2800525a-d5cf-43cd-8de3-0145cdbd487c" } } },
    },
    curl: 'curl -X POST http://localhost:3001/api/auth/set-claims \\\n  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"tenantId":"my-tenant-id"}\'',
  },

  // ── Storage ──
  {
    group: "Storage",
    method: "GET",
    path: "/api/storage/*",
    summary: "Tenant file storage",
    description: "Tenant-scoped file storage API. Supports list, upload, download, rename, move, delete, trash/restore, search, zip. All paths are scoped to the authenticated tenant.",
    auth: true,
    rateLimit: "global",
    params: [],
    requestBody: null,
    response: {
      status: 200,
      description: "Storage operation result",
      example: { ok: true, data: {} },
    },
    curl: 'curl http://localhost:3001/api/storage/list \\\n  -H "Authorization: Bearer YOUR_TOKEN"',
  },
];

// ── OpenAPI Schema Generator ──

/**
 * Generates an OpenAPI 3.0.3 compatible schema from ENDPOINTS.
 * @param {string} pkgVersion
 * @returns {object}
 */
function generateOpenApiSchema(pkgVersion) {
  const paths = {};

  for (const ep of ENDPOINTS) {
    // Convert Express path params to OpenAPI format
    const oaPath = ep.path.replace(/:(\w+)/g, "{$1}").replace("/*", "");
    if (!paths[oaPath]) paths[oaPath] = {};

    const method = ep.method.toLowerCase();
    const operation = {
      tags: [ep.group],
      summary: ep.summary || ep.description.split(".")[0],
      description: ep.description,
      operationId: `${method}_${ep.path.replace(/[/:*]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "")}`,
      security: ep.auth ? [{ bearerAuth: [] }, { tenantId: [] }] : [],
      parameters: [],
      responses: {},
    };

    // Path/query/header params
    for (const p of ep.params) {
      if (p.in === "path" || p.in === "query" || p.in === "header") {
        const param = {
          name: p.name,
          in: p.in,
          required: !!p.required,
          description: p.description,
          schema: { type: p.type === "number" ? "number" : "string" },
        };
        if (p.enum) param.schema.enum = p.enum;
        operation.parameters.push(param);
      }
    }

    // Request body
    if (ep.requestBody) {
      const content = {};
      if (ep.requestBody.contentType === "multipart/form-data") {
        const properties = {};
        const required = [];
        for (const [k, v] of Object.entries(ep.requestBody.schema)) {
          if (v.type === "file") {
            properties[k] = { type: "string", format: "binary", description: v.formats ? `Accepted: ${v.formats.join(", ")}` : undefined };
          } else {
            properties[k] = { type: v.type };
            if (v.enum) properties[k].enum = v.enum;
            if (v.min !== undefined) properties[k].minimum = v.min;
            if (v.max !== undefined) properties[k].maximum = v.max;
          }
          if (v.required) required.push(k);
        }
        content["multipart/form-data"] = { schema: { type: "object", properties, required: required.length ? required : undefined } };
      } else {
        const properties = {};
        const required = [];
        for (const [k, v] of Object.entries(ep.requestBody.schema)) {
          properties[k] = { type: v.type };
          if (v.enum) properties[k].enum = v.enum;
          if (v.min !== undefined) properties[k].minimum = v.min;
          if (v.max !== undefined) properties[k].maximum = v.max;
          if (v.maxLength !== undefined) properties[k].maxLength = v.maxLength;
          if (v.minLength !== undefined) properties[k].minLength = v.minLength;
          if (v.format) properties[k].format = v.format;
          if (v.items) properties[k].items = v.items;
          if (v.description) properties[k].description = v.description;
          if (v.required) required.push(k);
        }
        content["application/json"] = { schema: { type: "object", properties, required: required.length ? required : undefined } };
      }
      operation.requestBody = { required: true, content };
    }

    // Success response
    const resStatus = String(ep.response?.status || 200);
    if (typeof ep.response?.example === "string") {
      operation.responses[resStatus] = {
        description: ep.response?.description || "Success",
      };
    } else {
      operation.responses[resStatus] = {
        description: ep.response?.description || "Success",
        content: {
          "application/json": {
            schema: { type: "object" },
            example: ep.response?.example,
          },
        },
      };
    }

    // Error responses
    if (ep.errorResponses) {
      for (const err of ep.errorResponses) {
        const errStatus = String(err.status);
        if (!operation.responses[errStatus]) {
          operation.responses[errStatus] = {
            description: err.description,
            content: {
              "application/json": {
                example: { ok: false, errorCode: err.errorCode, message: err.description },
              },
            },
          };
        }
      }
    }

    paths[oaPath][method] = operation;
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "ModelPricer API",
      version: API_VERSION_FULL,
      description: "SaaS API for 3D printing price calculation. Upload 3D models, slice with PrusaSlicer, calculate pricing, manage orders and presets.",
      contact: { name: "ModelPricer" },
    },
    servers: [
      { url: "http://localhost:3001", description: "Local development" },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Firebase JWT",
          description: "Firebase Authentication JWT token",
        },
        tenantId: {
          type: "apiKey",
          in: "header",
          name: "x-tenant-id",
          description: "Tenant ID for multi-tenant isolation",
        },
      },
    },
    tags: [
      { name: "System", description: "Health checks, version info, documentation" },
      { name: "Slicing", description: "3D model slicing with PrusaSlicer" },
      { name: "Mesh", description: "Mesh analysis and repair" },
      { name: "Presets", description: "PrusaSlicer preset management" },
      { name: "Widget", description: "Public widget endpoints (no auth)" },
      { name: "Orders", description: "Order management and status tracking" },
      { name: "Webhooks", description: "Webhook registration and event delivery" },
      { name: "Email", description: "Email templates and sending" },
      { name: "Invoices", description: "Invoice generation" },
      { name: "Config", description: "Tenant configuration (branding, company)" },
      { name: "Auth", description: "Authentication and claims" },
      { name: "Storage", description: "Tenant-scoped file storage" },
    ],
  };
}


// ── HTML Documentation Generator ──

/**
 * Generates the interactive HTML documentation page.
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

  const groupOrder = ["System", "Slicing", "Mesh", "Presets", "Widget", "Orders", "Invoices", "Email", "Config", "Webhooks", "Auth", "Storage"];
  const groupIcons = {
    System: "&#9881;",
    Slicing: "&#9986;",
    Mesh: "&#9651;",
    Presets: "&#9776;",
    Widget: "&#9635;",
    Orders: "&#9993;",
    Invoices: "&#128196;",
    Email: "&#9993;",
    Config: "&#9881;",
    Webhooks: "&#128279;",
    Auth: "&#128274;",
    Storage: "&#128451;",
  };

  const methodColors = {
    GET: "#22c55e",
    POST: "#3b82f6",
    PATCH: "#eab308",
    PUT: "#f97316",
    DELETE: "#ef4444",
  };

  // Build sidebar nav
  let sidebarHtml = "";
  for (const groupName of groupOrder) {
    const eps = groups[groupName];
    if (!eps) continue;
    sidebarHtml += `<a class="nav-group" href="#group-${groupName.toLowerCase()}" onclick="scrollToGroup('${groupName.toLowerCase()}')">${groupIcons[groupName] || ""} ${groupName} <span class="nav-count">${eps.length}</span></a>\n`;
  }

  // Build endpoint sections
  let endpointSections = "";

  for (const groupName of groupOrder) {
    const eps = groups[groupName];
    if (!eps) continue;

    let endpointCards = "";
    for (let i = 0; i < eps.length; i++) {
      const ep = eps[i];
      const color = methodColors[ep.method] || "#94a3b8";
      const rl = ep.rateLimit ? RATE_LIMITS[ep.rateLimit] : null;

      // Parameters table
      const paramsHtml = ep.params.length > 0
        ? `<table class="params-table">
            <thead><tr><th>Name</th><th>In</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>${ep.params.map(p => {
              let desc = escapeHtml(p.description);
              if (p.enum) desc += ` <span class="enum-values">Enum: ${p.enum.join(", ")}</span>`;
              return `<tr><td><code>${p.name}</code></td><td><span class="param-in">${p.in}</span></td><td><span class="param-type">${p.type}</span></td><td>${p.required ? '<span class="req">Yes</span>' : '<span class="opt">No</span>'}</td><td>${desc}</td></tr>`;
            }).join("")}</tbody>
           </table>`
        : '<p class="no-params">No parameters</p>';

      // Request body schema
      let requestBodyHtml = "";
      if (ep.requestBody) {
        const schemaJson = JSON.stringify(ep.requestBody.schema, null, 2);
        requestBodyHtml = `
          <h4>Request Body <span class="content-type">${ep.requestBody.contentType}</span></h4>
          <div class="code-block-wrapper">
            <pre class="code-block"><code>${syntaxHighlightJson(schemaJson)}</code></pre>
            <button class="copy-btn" onclick="copyCode(this)" title="Copy to clipboard">Copy</button>
          </div>`;
      }

      // Response example
      const responseJson = typeof ep.response.example === "string"
        ? ep.response.example
        : JSON.stringify(ep.response.example, null, 2);
      const isJsonResponse = typeof ep.response.example !== "string";

      // Error responses
      let errorResponsesHtml = "";
      if (ep.errorResponses && ep.errorResponses.length > 0) {
        errorResponsesHtml = `
          <h4>Error Responses</h4>
          <table class="params-table error-table">
            <thead><tr><th>Status</th><th>Error Code</th><th>Description</th></tr></thead>
            <tbody>${ep.errorResponses.map(e =>
              `<tr><td><span class="status-code status-${String(e.status)[0]}xx">${e.status}</span></td><td><code>${e.errorCode}</code></td><td>${escapeHtml(e.description)}</td></tr>`
            ).join("")}</tbody>
          </table>`;
      }

      // Curl example
      let curlHtml = "";
      if (ep.curl) {
        curlHtml = `
          <h4>Example Request</h4>
          <div class="code-block-wrapper">
            <pre class="code-block curl-block"><code>${escapeHtml(ep.curl)}</code></pre>
            <button class="copy-btn" onclick="copyCode(this)" title="Copy to clipboard">Copy</button>
          </div>`;
      }

      // Rate limit badge
      const rlBadge = rl ? `<span class="rate-badge" title="${rl.description}">${rl.max}/min</span>` : "";

      endpointCards += `
        <div class="endpoint" data-method="${ep.method}" data-path="${ep.path}" data-group="${groupName}" data-auth="${ep.auth}">
          <div class="endpoint-header" onclick="this.parentElement.classList.toggle('open')">
            <span class="method-badge" style="background:${color}">${ep.method}</span>
            <code class="endpoint-path">${ep.path}</code>
            ${ep.auth ? '<span class="auth-badge" title="Requires Authorization header">Auth</span>' : '<span class="public-badge" title="No authentication required">Public</span>'}
            ${rlBadge}
            <span class="endpoint-desc">${ep.summary || ""}</span>
            <span class="chevron">&#9662;</span>
          </div>
          <div class="endpoint-body">
            <p class="full-desc">${escapeHtml(ep.description)}</p>
            <h4>Parameters</h4>
            ${paramsHtml}
            ${requestBodyHtml}
            <h4>Response <span class="status-code status-2xx">${ep.response.status || 200}</span> ${ep.response.description ? `<span class="resp-desc">${escapeHtml(ep.response.description)}</span>` : ""}</h4>
            <div class="code-block-wrapper">
              <pre class="code-block"><code>${isJsonResponse ? syntaxHighlightJson(responseJson) : escapeHtml(responseJson)}</code></pre>
              ${isJsonResponse ? '<button class="copy-btn" onclick="copyCode(this)" title="Copy to clipboard">Copy</button>' : ""}
            </div>
            ${errorResponsesHtml}
            ${curlHtml}
          </div>
        </div>`;
    }

    endpointSections += `
      <section class="group-section" id="group-${groupName.toLowerCase()}">
        <h2 class="group-title">${groupIcons[groupName] || ""} ${groupName} <span class="ep-count">${eps.length}</span></h2>
        ${endpointCards}
      </section>`;
  }

  // Error codes table
  let errorCodesHtml = ERROR_CODES.map(e =>
    `<tr><td><code>${e.code}</code></td><td><span class="status-code status-${String(e.status)[0]}xx">${e.status}</span></td><td>${escapeHtml(e.description)}</td></tr>`
  ).join("");

  // Rate limits table
  let rateLimitsHtml = Object.entries(RATE_LIMITS).map(([key, rl]) =>
    `<tr><td><code>${key}</code></td><td>${rl.max} / ${rl.windowMs / 1000}s</td><td>${escapeHtml(rl.description)}</td></tr>`
  ).join("");

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
    --bg-sidebar: #141720;
    --border: #2a2e3f;
    --text: #e2e8f0;
    --text-muted: #7a8291;
    --accent: #3b82f6;
    --teal: #14b8a6;
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
    display: flex;
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 220px;
    min-height: 100vh;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    padding: 20px 0;
    position: fixed;
    top: 0;
    left: 0;
    overflow-y: auto;
    z-index: 10;
  }

  .sidebar-title {
    font-size: 15px;
    font-weight: 700;
    padding: 0 16px 12px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 8px;
    color: var(--text);
  }

  .sidebar-sub {
    font-size: 11px;
    color: var(--text-muted);
    display: block;
    margin-top: 2px;
    font-weight: 400;
  }

  .nav-group {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    color: var(--text-muted);
    font-size: 13px;
    text-decoration: none;
    transition: all .15s;
    cursor: pointer;
  }

  .nav-group:hover { color: var(--text); background: var(--bg-hover); }

  .nav-count {
    margin-left: auto;
    font-size: 11px;
    background: var(--bg-hover);
    padding: 1px 6px;
    border-radius: 8px;
  }

  .sidebar-section {
    padding: 12px 16px 4px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-top: 8px;
  }

  .sidebar-link {
    display: block;
    padding: 5px 16px;
    color: var(--text-muted);
    font-size: 12px;
    text-decoration: none;
    transition: color .15s;
  }

  .sidebar-link:hover { color: var(--text); }

  /* ── Main ── */
  .main { margin-left: 220px; flex: 1; padding: 24px 32px; max-width: 960px; }

  header {
    border-bottom: 1px solid var(--border);
    padding: 16px 0 20px;
    margin-bottom: 24px;
  }

  header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }

  header .version { color: var(--text-muted); font-size: 14px; margin-top: 4px; }

  header .meta {
    display: flex;
    gap: 16px;
    margin-top: 10px;
    font-size: 13px;
    color: var(--text-muted);
    flex-wrap: wrap;
  }

  header .meta span { display: flex; align-items: center; gap: 4px; }

  /* ── Auth info ── */
  .auth-info {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 24px;
  }

  .auth-info h3 { font-size: 15px; margin-bottom: 8px; }
  .auth-info p { font-size: 13px; color: var(--text-muted); margin-bottom: 6px; }

  .auth-info .code-block-wrapper { margin-top: 8px; }

  /* ── Search & Filters ── */
  .search-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    position: sticky;
    top: 0;
    background: var(--bg);
    padding: 8px 0;
    z-index: 5;
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

  .filter-btn-auth { font-size: 12px; padding: 6px 10px; }

  /* ── Groups ── */
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

  /* ── Endpoint cards ── */
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

  .rate-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(59, 130, 246, 0.1);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.2);
    flex-shrink: 0;
    cursor: help;
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

  .full-desc {
    font-size: 13px;
    color: var(--text-muted);
    margin: 12px 0;
    line-height: 1.5;
  }

  .endpoint-body h4 {
    font-size: 13px;
    color: var(--text-muted);
    margin: 16px 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .content-type {
    font-size: 11px;
    color: var(--teal);
    font-family: var(--font-mono);
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
  }

  .resp-desc {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
  }

  /* ── Tables ── */
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
    vertical-align: top;
  }

  .params-table code {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--accent);
  }

  .param-in {
    font-size: 11px;
    color: var(--teal);
    font-family: var(--font-mono);
  }

  .param-type {
    font-size: 11px;
    color: #c084fc;
    font-family: var(--font-mono);
  }

  .enum-values {
    display: block;
    font-size: 11px;
    color: #f59e0b;
    font-family: var(--font-mono);
    margin-top: 2px;
  }

  .req { color: #ef4444; font-weight: 600; }
  .opt { color: var(--text-muted); }

  .no-params { color: var(--text-muted); font-size: 13px; font-style: italic; }

  .status-code {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .status-2xx { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .status-4xx { background: rgba(234, 179, 8, 0.15); color: #eab308; }
  .status-5xx { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

  /* ── Code blocks ── */
  .code-block-wrapper {
    position: relative;
  }

  .code-block {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px 16px;
    overflow-x: auto;
    font-size: 12px;
    line-height: 1.5;
  }

  .code-block code {
    font-family: var(--font-mono);
    color: #a5b4fc;
  }

  .curl-block code { color: #94a3b8; }

  .copy-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 10px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-muted);
    font-size: 11px;
    cursor: pointer;
    transition: all .15s;
    z-index: 2;
  }

  .copy-btn:hover { color: var(--text); border-color: var(--accent); }
  .copy-btn.copied { color: #22c55e; border-color: #22c55e; }

  /* ── JSON syntax highlight ── */
  .json-key { color: #60a5fa; }
  .json-string { color: #34d399; }
  .json-number { color: #f59e0b; }
  .json-bool { color: #c084fc; }
  .json-null { color: #94a3b8; }

  /* ── Reference tables ── */
  .ref-section {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .ref-section h3 {
    font-size: 15px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ref-section table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .ref-section th {
    text-align: left;
    padding: 6px 10px;
    background: var(--bg);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
  }
  .ref-section td { padding: 6px 10px; border-top: 1px solid var(--border); }

  /* ── No results ── */
  .no-results {
    text-align: center;
    color: var(--text-muted);
    padding: 40px;
    font-size: 14px;
    display: none;
  }

  /* ── Footer ── */
  footer {
    border-top: 1px solid var(--border);
    padding: 16px 0;
    margin-top: 32px;
    color: var(--text-muted);
    font-size: 12px;
    text-align: center;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { margin-left: 0; padding: 16px 8px; }
    .endpoint-desc { display: none; }
  }
</style>
</head>
<body>

<nav class="sidebar">
  <div class="sidebar-title">
    ModelPricer API
    <span class="sidebar-sub">v${API_VERSION_FULL}</span>
  </div>
  <div class="sidebar-section">Endpoints</div>
  ${sidebarHtml}
  <div class="sidebar-section">Reference</div>
  <a class="sidebar-link" href="#auth-section">Authentication</a>
  <a class="sidebar-link" href="#rate-limits-section">Rate Limits</a>
  <a class="sidebar-link" href="#error-codes-section">Error Codes</a>
  <a class="sidebar-link" href="#versioning-section">Versioning</a>
  <div class="sidebar-section">Export</div>
  <a class="sidebar-link" href="/api/docs" target="_blank">JSON</a>
  <a class="sidebar-link" href="/api/docs/openapi" target="_blank">OpenAPI 3.0</a>
</nav>

<div class="main">
  <header>
    <h1>ModelPricer API</h1>
    <div class="version">v${API_VERSION_FULL} (${API_VERSION}) &middot; Package ${pkgVersion}</div>
    <div class="meta">
      <span>${ENDPOINTS.length} endpoints</span>
      <span>${groupOrder.length} groups</span>
      <span>Base URL: /api</span>
      <span>Versioned: /api/v1/*</span>
    </div>
  </header>

  <!-- Auth info -->
  <div class="auth-info" id="auth-section">
    <h3>&#128274; Authentication</h3>
    <p>Protected endpoints require a Firebase JWT token in the <code>Authorization</code> header and a tenant identifier in the <code>x-tenant-id</code> header.</p>
    <p>Public endpoints (marked <span class="public-badge">Public</span>) do not require authentication.</p>
    <div class="code-block-wrapper">
      <pre class="code-block"><code><span class="json-key">Authorization</span>: Bearer <span class="json-string">eyJhbGciOi...</span>
<span class="json-key">x-tenant-id</span>: <span class="json-string">demo-tenant</span>
<span class="json-key">Content-Type</span>: <span class="json-string">application/json</span></code></pre>
      <button class="copy-btn" onclick="copyCode(this)" title="Copy to clipboard">Copy</button>
    </div>
  </div>

  <!-- Search + filters -->
  <div class="search-bar">
    <input type="text" id="searchInput" placeholder="Search endpoints... (path, method, description)" autocomplete="off">
    <button class="filter-btn active" data-filter="all" onclick="filterMethod('all', this)">All</button>
    <button class="filter-btn" data-filter="GET" onclick="filterMethod('GET', this)">GET</button>
    <button class="filter-btn" data-filter="POST" onclick="filterMethod('POST', this)">POST</button>
    <button class="filter-btn" data-filter="PATCH" onclick="filterMethod('PATCH', this)">PATCH</button>
    <button class="filter-btn" data-filter="PUT" onclick="filterMethod('PUT', this)">PUT</button>
    <button class="filter-btn" data-filter="DELETE" onclick="filterMethod('DELETE', this)">DELETE</button>
    <button class="filter-btn filter-btn-auth" id="authFilterBtn" onclick="toggleAuthFilter(this)">Auth only</button>
  </div>

  <!-- Endpoints -->
  <div id="endpointContainer">
    ${endpointSections}
  </div>

  <div class="no-results" id="noResults">No endpoints match your search.</div>

  <!-- Rate limits reference -->
  <div class="ref-section" id="rate-limits-section">
    <h3>&#9201; Rate Limits</h3>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">Rate limit headers are included in responses: <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>, <code>Retry-After</code>.</p>
    <table>
      <thead><tr><th>Tier</th><th>Limit</th><th>Description</th></tr></thead>
      <tbody>${rateLimitsHtml}</tbody>
    </table>
  </div>

  <!-- Error codes reference -->
  <div class="ref-section" id="error-codes-section">
    <h3>&#9888; Error Codes</h3>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:10px;">All error responses follow the format: <code>{ ok: false, errorCode: "MP_...", message: "..." }</code></p>
    <table>
      <thead><tr><th>Code</th><th>Status</th><th>Description</th></tr></thead>
      <tbody>${errorCodesHtml}</tbody>
    </table>
  </div>

  <!-- Versioning -->
  <div class="ref-section" id="versioning-section">
    <h3>&#128279; API Versioning</h3>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">All endpoints are available under both <code>/api/*</code> and <code>/api/v1/*</code>. The versioned prefix is recommended for production use.</p>
    <p style="font-size:13px;color:var(--text-muted);">The <code>X-API-Version</code> response header is included on all <code>/api</code> responses.</p>
  </div>

  <footer>
    ModelPricer API Documentation &middot; Generated ${new Date().toISOString().split("T")[0]} &middot; <a href="/api/docs/openapi" style="color:var(--accent);text-decoration:none;">OpenAPI JSON</a>
  </footer>
</div>

<script>
(function() {
  var activeMethod = "all";
  var authOnly = false;
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
      var isAuth = ep.getAttribute("data-auth") === "true";
      var desc = ep.querySelector(".endpoint-desc");
      var descText = desc ? desc.textContent.toLowerCase() : "";
      var fullDesc = ep.querySelector(".full-desc");
      var fullDescText = fullDesc ? fullDesc.textContent.toLowerCase() : "";

      var matchMethod = activeMethod === "all" || method === activeMethod;
      var matchSearch = !query || path.includes(query) || method.toLowerCase().includes(query) || descText.includes(query) || fullDescText.includes(query) || group.includes(query);
      var matchAuth = !authOnly || isAuth;

      if (matchMethod && matchSearch && matchAuth) {
        ep.style.display = "";
        anyVisible = true;
      } else {
        ep.style.display = "none";
      }
    });

    sections.forEach(function(sec) {
      var visibleEps = sec.querySelectorAll('.endpoint');
      var hasVisible = false;
      visibleEps.forEach(function(e) { if (e.style.display !== 'none') hasVisible = true; });
      sec.style.display = hasVisible ? "" : "none";
    });

    noResults.style.display = anyVisible ? "none" : "block";
  }

  searchInput.addEventListener("input", applyFilters);

  // Keyboard shortcut: / to focus search
  document.addEventListener("keydown", function(e) {
    if (e.key === "/" && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      searchInput.blur();
      applyFilters();
    }
  });

  window.filterMethod = function(method, btn) {
    activeMethod = method;
    document.querySelectorAll(".filter-btn:not(.filter-btn-auth)").forEach(function(b) { b.classList.remove("active"); });
    btn.classList.add("active");
    applyFilters();
  };

  window.toggleAuthFilter = function(btn) {
    authOnly = !authOnly;
    btn.classList.toggle("active", authOnly);
    btn.textContent = authOnly ? "Auth only" : "Auth only";
    applyFilters();
  };

  window.copyCode = function(btn) {
    var pre = btn.parentElement.querySelector("code");
    var text = pre.textContent;
    navigator.clipboard.writeText(text).then(function() {
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(function() {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 1500);
    });
  };

  window.scrollToGroup = function(groupId) {
    var el = document.getElementById("group-" + groupId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
})();
</script>
</body>
</html>`;
}

/**
 * Simple JSON syntax highlighting for HTML display.
 * Wraps keys, strings, numbers, booleans, and null in colored spans.
 * @param {string} json - Pretty-printed JSON string
 * @returns {string} HTML with syntax highlighting spans
 */
function syntaxHighlightJson(json) {
  return escapeHtml(json)
    .replace(/&quot;([^&]*?)&quot;\s*:/g, '<span class="json-key">&quot;$1&quot;</span>:')
    .replace(/:\s*&quot;([^&]*?)&quot;/g, ': <span class="json-string">&quot;$1&quot;</span>')
    .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="json-bool">$1</span>')
    .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
    // Strings in arrays
    .replace(/\[\s*&quot;([^&]*?)&quot;/g, '[<span class="json-string">&quot;$1&quot;</span>')
    .replace(/,\s*&quot;([^&]*?)&quot;/g, ', <span class="json-string">&quot;$1&quot;</span>');
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
   * GET /api/docs — JSON documentation of all endpoints (enriched with schemas).
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
        rateLimits: RATE_LIMITS,
        errorCodes: ERROR_CODES,
        authentication: {
          type: "Bearer",
          header: "Authorization",
          format: "Bearer <Firebase JWT>",
          tenantHeader: "x-tenant-id",
          tenantFallback: "demo-tenant",
        },
        endpoints: ENDPOINTS.map((ep) => ({
          group: ep.group,
          method: ep.method,
          path: ep.path,
          summary: ep.summary,
          description: ep.description,
          auth: ep.auth,
          rateLimit: ep.rateLimit,
          params: ep.params,
          requestBody: ep.requestBody || null,
          response: ep.response,
          errorResponses: ep.errorResponses || [],
          curl: ep.curl || null,
        })),
      },
    });
  });

  /**
   * GET /api/docs/html — Self-contained interactive HTML documentation page.
   */
  router.get("/html", (_req, res) => {
    const html = generateHtmlDocs(pkgVersion);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  });

  /**
   * GET /api/docs/openapi — OpenAPI 3.0.3 JSON schema export.
   */
  router.get("/openapi", (_req, res) => {
    const schema = generateOpenApiSchema(pkgVersion);
    res.json(schema);
  });

  return router;
}

export { ENDPOINTS, RATE_LIMITS, ERROR_CODES };
export default createApiDocsRouter;
