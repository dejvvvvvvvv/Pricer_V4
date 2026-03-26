import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import multer from "multer";

import { ensureDir, fileExists } from "./util/fsSafe.js";
import { getHealthStatus, getDetailedHealthStatus, parseSlicerVersion } from "./util/health.js";
import { findPrusaSlicerConsole } from "./util/findSlicer.js";
import { validateEnvironment } from "./util/envValidator.js";
import { transformSTLFile } from "./util/stlTransform.js";
import { runPrusaSlicer } from "./slicer/runPrusaSlicer.js";
import { parseGcodeMetrics } from "./slicer/parseGcode.js";
import { runPrusaInfo } from "./slicer/runPrusaInfo.js";
import { parseModelInfo } from "./slicer/parseModelInfo.js";
import { classifySlicerError } from "./slicer/slicerErrorClassifier.js";
import { slicerCache } from "./slicer/slicerCache.js";

import {
  getIniPathForPreset,
  listPresets,
  readPresetsState,
} from "./presetsStore.js";

import storageRouter from "./storage/storageRouter.js";
import authClaimsRouter from "./routes/authClaims.js";
import { createPresetsRouter } from "./routes/presets.js";
import { createMeshRouter } from "./routes/mesh.js";
import { requireAuth, optionalAuth } from "./middleware/auth.js";
import { requireTenant } from "./middleware/tenant.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { slicingQueue } from "./jobs/slicingQueue.js";
import { createWebhooksRouter } from "./routes/webhooks.js";
import { createOrdersRouter } from "./routes/orders.js";
import { fireWebhook } from "./services/webhookService.js";
import { createApiDocsRouter, API_VERSION, API_VERSION_FULL } from "./routes/apiDocs.js";
import { createEmailRouter } from "./routes/emailRoutes.js";
import { createConfigRouter } from "./routes/config.js";
import { createInvoicesRouter } from "./routes/invoices.js";
import { createStatsRouter } from "./routes/stats.js";
import { createNotificationsRouter } from "./routes/notifications.js";
import { createStripeRouter } from "./routes/stripeRoutes.js";
import { initSentry, setupSentryErrorHandler, captureException } from "./services/sentryService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendRoot, "..");

const isWin = process.platform === "win32";

// ===== Environment validation (must run after dotenv, before app setup) =====
const envCheck = validateEnvironment();
if (!envCheck.valid && process.env.NODE_ENV === 'production') {
  console.error('FATAL: Missing required environment variables. Server cannot start in production mode.');
  process.exit(1);
}

// Read version from package.json (safe — no sensitive data exposed)
const PKG_VERSION = await fs.readFile(path.join(backendRoot, "package.json"), "utf8")
  .then((raw) => JSON.parse(raw).version || "unknown")
  .catch(() => "unknown");

const PORT = Number(process.env.PORT || 3001);
const WORKSPACE_ROOT = process.env.SLICER_WORKSPACE_ROOT || (isWin ? "C:\\modelpricer\\tmp" : path.join(os.tmpdir(), "modelpricer"));
const DEFAULT_INI = process.env.PRUSA_DEFAULT_INI || "";

const app = express();

// ===== Sentry (must be initialised before any middleware/routes) =====
await initSentry(app);

// ===== Security headers (P0 — before all other middleware) =====
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Stripe webhook needs raw body for signature verification (MUST be before express.json)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON for PATCH endpoints etc.
app.use(express.json({ limit: "2mb" }));

// ===== CORS configuration =====

/**
 * Build CORS config based on NODE_ENV.
 * - Development: allow all origins (origin: true) for easy local dev.
 * - Production: strict allowlist from CORS_ORIGINS env var (comma-separated).
 *   Requests with no origin (server-to-server, curl, health checks) are allowed.
 */
function buildCorsConfig() {
  const env = process.env.NODE_ENV || "development";

  const sharedConfig = {
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id", "x-api-version"],
    exposedHeaders: ["X-API-Version", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"],
    maxAge: 86400, // Cache preflight for 24 hours
  };

  if (env === "development") {
    return { ...sharedConfig, origin: true };
  }

  // Production: strict origins from CORS_ORIGINS env var
  const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    ...sharedConfig,
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server, curl, health checks)
      if (!origin) return cb(null, true);
      // Wildcard escape hatch (not recommended for production)
      if (allowedOrigins.includes("*")) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
  };
}

// Widget-specific CORS: /api/widget/* allows ANY origin because the widget
// is embedded on customer websites whose domains we cannot predict.
// Security: no credentials, limited methods, limited headers.
app.use(
  "/api/widget",
  cors({
    origin: true,
    credentials: false,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-tenant-id"],
    exposedHeaders: ["X-API-Version"],
    maxAge: 86400,
  })
);

// General CORS (all other routes)
app.use(cors(buildCorsConfig()));

// ===== /api/v1/* prefix rewrite =====
// Placed before all other /api middleware so /api/v1/health -> /api/health etc.
// This enables all existing routes to also work under the versioned prefix.
app.use((req, _res, next) => {
  if (req.url.startsWith("/api/v1/")) {
    req.url = req.url.replace("/api/v1/", "/api/");
  } else if (req.url === "/api/v1") {
    req.url = "/api";
  }
  next();
});

// ===== API Version header on all responses =====
app.use("/api", (_req, res, next) => {
  res.setHeader("X-API-Version", API_VERSION);
  next();
});

// ===== Request logging =====
app.use(requestLogger({ skipPaths: ["/api/health"] }));

// ===== Rate limiting =====
// Global: 100 req/min per IP for all /api routes
app.use("/api", rateLimit({ windowMs: 60_000, max: 100 }));

// Stricter: /api/slice is CPU-heavy (PrusaSlicer) — 10 req/min per IP
app.use("/api/slice", rateLimit({
  windowMs: 60_000,
  max: 10,
  message: "Too many slicing requests, please try again later",
}));

// Queue endpoints share the same rate limit bucket as /api/slice (already covered above)

// Stricter: /api/mesh — CPU-heavy (PrusaSlicer repair/analyze) — 10 req/min per IP
app.use("/api/mesh", rateLimit({
  windowMs: 60_000,
  max: 10,
  message: "Too many mesh processing requests, please try again later",
}));

// Stricter: /api/auth — 20 req/min per IP to limit brute-force
app.use("/api/auth", rateLimit({
  windowMs: 60_000,
  max: 20,
  message: "Too many auth requests, please try again later",
}));

// Write operations (POST/PATCH/PUT/DELETE) — 30 req/min per IP (lower than read)
// GET/HEAD/OPTIONS are skipped entirely — they never consume a bucket slot.
app.use("/api", rateLimit({
  windowMs: 60_000,
  max: 30,
  message: "Too many write requests, please try again later",
  skip: (req) => ["GET", "HEAD", "OPTIONS"].includes(req.method),
  keyGenerator: (req) => `write:${req.ip || req.connection?.remoteAddress || "unknown"}`,
}));

/**
 * GET /api/health — simple server health check.
 * Returns: { ok: true, status: "healthy" } for uptime monitors.
 * Does NOT expose: file paths, env vars, IPs, credentials.
 */
app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, data: { status: "healthy", uptime: process.uptime() } });
});

/**
 * GET /api/health/detailed — comprehensive health check with system diagnostics
 * and status of all integrated services (storage, Supabase, email, Stripe, Sentry).
 * Returns: uptime, memory, CPU, slicer, workspace, and all external service statuses.
 * Does NOT expose: file paths, env vars, API keys, secrets, IPs, credentials.
 */
app.get("/api/health/detailed", requireAuth, async (_req, res) => {
  try {
    // --- Build external services status from env (no secrets exposed) ---
    const storageProvider = process.env.STORAGE_PROVIDER || "filesystem";
    const emailProvider = process.env.EMAIL_PROVIDER || "none";
    const supabaseConfigured = !!(process.env.SUPABASE_URL);
    const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY);
    const stripeTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
    const sentryConfigured = !!(process.env.SENTRY_DSN);

    const externalServices = {
      storage: {
        provider: storageProvider,
        status: "ok", // If the server started, storage provider is loaded
      },
      supabase: {
        configured: supabaseConfigured,
        status: supabaseConfigured ? "ok" : "not_configured",
      },
      email: {
        provider: emailProvider,
        configured: emailProvider !== "none",
        status: emailProvider !== "none" ? "ok" : "mock",
      },
      stripe: {
        configured: stripeConfigured,
        mode: stripeTestMode ? "test" : stripeConfigured ? "live" : "none",
        status: stripeConfigured ? "ok" : "not_configured",
      },
      sentry: {
        configured: sentryConfigured,
        status: sentryConfigured ? "ok" : "not_configured",
      },
    };

    const health = await getDetailedHealthStatus({
      version: PKG_VERSION,
      checkSlicer: resolveSlicerCmd,
      getSlicerVersion: getSlicerVersionCached,
      workspaceRoot: WORKSPACE_ROOT,
      getCacheStats: () => slicerCache.getStats(),
      getQueueStats: () => slicingQueue.getQueueStats(),
      externalServices,
    });
    res.json({ ok: true, data: health });
  } catch (e) {
    res.status(500).json({
      ok: false,
      errorCode: "MP_HEALTH_CHECK_FAILED",
      message: String(e?.message || e),
    });
  }
});

/**
 * GET /api/health/services-status — public endpoint returning which services are configured.
 * Returns only boolean flags and provider names. No auth required.
 * Does NOT expose: API keys, secrets, tokens, file paths, or any sensitive data.
 */
app.get("/api/health/services-status", (_req, res) => {
  const storageProvider = process.env.STORAGE_PROVIDER || "filesystem";
  const emailProvider = process.env.EMAIL_PROVIDER || "none";
  const supabaseConfigured = !!(process.env.SUPABASE_URL);
  const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY);
  const stripeTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ?? false;
  const sentryConfigured = !!(process.env.SENTRY_DSN);

  res.json({
    ok: true,
    data: {
      storage: { provider: storageProvider },
      supabase: { configured: supabaseConfigured },
      email: {
        provider: emailProvider,
        configured: emailProvider !== "none",
      },
      stripe: {
        configured: stripeConfigured,
        testMode: stripeTestMode,
      },
      sentry: { configured: sentryConfigured },
    },
  });
});

/**
 * GET /api/version — API version info.
 * Returns: package version and API version.
 */
app.get("/api/version", (_req, res) => {
  res.json({ ok: true, data: { version: PKG_VERSION, apiVersion: API_VERSION } });
});

// ===== API Documentation (public, no auth) =====
const apiDocsRouter = createApiDocsRouter({ pkgVersion: PKG_VERSION });
app.use("/api/docs", apiDocsRouter);

// ===== Auth middleware for protected routes =====
// Apply requireAuth + requireTenant to all /api/presets, /api/slice, /api/storage
app.use("/api/presets", requireAuth, requireTenant);
app.use("/api/slice", optionalAuth, requireTenant);
app.use("/api/storage", requireAuth, requireTenant);
app.use("/api/webhooks", requireAuth, requireTenant);
app.use("/api/orders", requireAuth, requireTenant);

// ===== Auth for additional protected routes =====
app.use("/api/email", requireAuth, requireTenant);
app.use("/api/invoices", requireAuth, requireTenant);
app.use("/api/config", requireAuth, requireTenant);
app.use("/api/stats", requireAuth, requireTenant);
app.use("/api/notifications", requireAuth, requireTenant);
app.use("/api/payments/create-checkout", requireAuth, requireTenant);
app.use("/api/payments/session", requireAuth, requireTenant);

// ===== Auth claims API (Firebase-to-Supabase RLS bridge) =====
app.use("/api/auth", requireAuth, requireTenant, authClaimsRouter);

// ===== Helpers (used by presets router, slicing, widget, queue) =====

function getTenantIdFromReq(req) {
  // If requireTenant middleware ran, use req.tenantId
  if (req.tenantId) return req.tenantId;
  // Fallback for widget/public routes without auth (e.g. /api/widget/presets)
  const fromHeader = String(req.headers["x-tenant-id"] || "").trim();
  if (fromHeader) {
    console.warn(
      `[index] Using header-based tenant "${fromHeader}" — req.tenantId not set (public route?): ${req.method} ${req.originalUrl}`
    );
    return fromHeader;
  }
  if (process.env.NODE_ENV === 'development') {
    return "demo-tenant";
  }
  // In production, refuse to serve without a tenant — never fall back to demo-tenant
  throw Object.assign(
    new Error(`No tenant resolved for ${req.method} ${req.originalUrl}. Provide x-tenant-id header or use auth middleware.`),
    { status: 400, type: "validation", errorCode: "MP_VALIDATION_ERROR" }
  );
}

function ok(res, data) {
  return res.json({ ok: true, data });
}

function fail(res, status, errorCode, message, details) {
  return res.status(status).json({ ok: false, errorCode, message, details });
}

// ===== Presets API (route module) =====
const presetsRouter = createPresetsRouter({
  workspaceRoot: WORKSPACE_ROOT,
  getTenantIdFromReq,
});
app.use("/api/presets", presetsRouter);

// ===== Widget presets (public, no auth — tenant validated) =====
/**
 * GET /api/widget/presets?widgetId=<publicWidgetId>
 *
 * Public endpoint for the embeddable widget to fetch visible presets.
 * Security: The tenant is resolved from the `widgetId` query parameter.
 * If `widgetId` is not provided, falls back to `x-tenant-id` header BUT
 * validates that the tenant actually exists (has a presets directory).
 * This prevents arbitrary tenant enumeration via spoofed headers.
 */
app.get("/api/widget/presets", async (req, res) => {
  try {
    // 1) Resolve tenantId — prefer widgetId query param over raw header
    let tenantId = "";
    const widgetId = String(req.query?.widgetId || "").trim();

    if (widgetId) {
      // Resolve tenant from widget config directory
      // Widget configs are stored at: <workspace>/config/<tenantId>/widget.json
      // We scan config dirs to find the one whose widget.json contains this widgetId.
      tenantId = await resolveTenantFromWidgetId(WORKSPACE_ROOT, widgetId);
      if (!tenantId) {
        return res.status(404).json({
          ok: false,
          errorCode: "MP_NOT_FOUND",
          message: "Widget not found or not configured.",
        });
      }
    } else {
      // Fallback: use x-tenant-id header, but VALIDATE tenant exists
      const fromHeader = String(req.headers["x-tenant-id"] || "").trim();
      if (!fromHeader) {
        return res.status(400).json({
          ok: false,
          errorCode: "MP_VALIDATION_ERROR",
          message: "Missing required query parameter 'widgetId' or header 'x-tenant-id'.",
        });
      }

      // Sanitize tenantId to prevent path traversal
      const sanitized = fromHeader.replace(/[^a-zA-Z0-9._-]/g, "_");
      if (sanitized !== fromHeader) {
        return res.status(400).json({
          ok: false,
          errorCode: "MP_VALIDATION_ERROR",
          message: "Invalid tenant ID format.",
        });
      }

      // Validate tenant exists by checking presets directory
      const tenantPresetsDir = path.join(WORKSPACE_ROOT, "presets", sanitized);
      if (!(await fileExists(tenantPresetsDir))) {
        // Return 404 — don't reveal whether tenant exists or not
        return res.status(404).json({
          ok: false,
          errorCode: "MP_NOT_FOUND",
          message: "Tenant not found.",
        });
      }

      tenantId = sanitized;
    }

    const state = await listPresets(WORKSPACE_ROOT, tenantId);
    const presets = (state.presets || [])
      .filter((p) => !!p.visibleInWidget)
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

    return res.json({ ok: true, data: { presets, defaultPresetId: state.defaultPresetId || null } });
  } catch (e) {
    return res.status(500).json({ ok: false, errorCode: "MP_PRESETS_LIST_FAILED", message: String(e?.message || e) });
  }
});

app.get("/api/health/prusa", requireAuth, async (_req, res) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const slicerCmd = await resolveSlicerCmd();
    if (!slicerCmd) {
      return res.status(503).json({
        ok: false,
        errorCode: "MP_SLICER_NOT_CONFIGURED",
        message: "PRUSA_SLICER_CMD not set and auto-detect failed.",
        // Only expose filesystem hint in development
        ...(isDev && {
          hint: `Put PrusaSlicer portable into ${path.join(projectRoot, "tools", "prusaslicer")} and/or set PRUSA_SLICER_CMD in backend-local/.env`
        })
      });
    }

    if (!(await fileExists(slicerCmd))) {
      return res.status(503).json({
        ok: false,
        errorCode: "MP_SLICER_NOT_FOUND",
        message: isDev ? `Slicer not found at: ${slicerCmd}` : "Slicer binary not found.",
      });
    }

    // Windows portable builds often don't support --version. --help is the safest truth source.
    const checkMethod = "--help";
    const final = await runSimple(slicerCmd, ["--help"], 15000);

    const stdout = truncate(final.stdout.trim(), 2000);
    const stderr = truncate(final.stderr.trim(), 2000);

    // Parse version from help output
    const version = parseSlicerVersion(final.stdout) || parseSlicerVersion(final.stderr) || null;

    const slicerOk = final.exitCode === 0;

    res.status(slicerOk ? 200 : 503).json({
      ok: slicerOk,
      data: {
        available: slicerOk,
        checkMethod,
        exitCode: final.exitCode,
        version,
        // Only expose paths and raw output in development
        ...(isDev && {
          slicerCmd,
          stdout,
          stderr,
        }),
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, errorCode: "MP_SLICER_CHECK_FAILED", message: String(e?.message || e) });
  }
});

// ===== Storage API =====
app.use("/api/storage", requireAuth, requireTenant, storageRouter);

// ===== Webhooks API =====
const webhooksRouter = createWebhooksRouter({
  workspaceRoot: WORKSPACE_ROOT,
  getTenantIdFromReq,
});
app.use("/api/webhooks", webhooksRouter);

// ===== Orders API =====
const ordersRouter = createOrdersRouter({
  workspaceRoot: WORKSPACE_ROOT,
  getTenantIdFromReq,
  fireWebhook: (ws, tid, event, data) => fireWebhook(ws, tid, event, data),
});
app.use("/api/orders", ordersRouter);

// ===== Mesh API (repair & analyze) =====
const meshRouter = createMeshRouter({
  workspaceRoot: WORKSPACE_ROOT,
  resolveSlicerCmd,
});
app.use("/api/mesh", requireAuth, requireTenant, meshRouter);

// ===== Email API =====
const emailRouter = createEmailRouter({ getTenantIdFromReq });
app.use("/api/email", emailRouter);

// ===== Config API (branding, company) =====
const configRouter = createConfigRouter({
  workspaceRoot: WORKSPACE_ROOT,
  getTenantIdFromReq,
});
app.use("/api/config", configRouter);

// ===== Invoices API =====
const invoicesRouter = createInvoicesRouter({
  workspaceRoot: WORKSPACE_ROOT,
  getTenantIdFromReq,
});
app.use("/api/invoices", invoicesRouter);

// ===== Stats API =====
const statsRouter = createStatsRouter({
  workspaceRoot: WORKSPACE_ROOT,
  getTenantIdFromReq,
  getCacheStats: () => slicerCache.getStats(),
  getQueueStats: () => slicingQueue.getQueueStats(),
});
app.use("/api/stats", statsRouter);

// ===== Notifications API =====
const notificationsRouter = createNotificationsRouter({
  workspaceRoot: WORKSPACE_ROOT,
  getTenantIdFromReq,
});
app.use("/api/notifications", notificationsRouter);

// ===== Stripe Payments API =====
const stripeRouter = createStripeRouter();
app.use("/api/payments", stripeRouter);

// ===== Initialize workspace and queue persistence =====

await ensureDir(WORKSPACE_ROOT);

// Configure queue persistence directory and restore pending jobs from previous run
slicingQueue.persistDir = WORKSPACE_ROOT;
try {
  const { restored, skipped } = await slicingQueue.loadPersistedState(WORKSPACE_ROOT);
  if (restored > 0 || skipped > 0) {
    console.log(`[slicingQueue] Restored ${restored} jobs from persistence (${skipped} skipped)`);
  }
} catch (err) {
  console.warn(`[slicingQueue] Failed to restore persisted state: ${err.message}`);
}

// ===== Upload & slice =====

app.post(
  "/api/slice",
  createJobMiddleware,
  createUploader().fields([
    { name: "model", maxCount: 1 },
    { name: "ini", maxCount: 1 }
  ]),
  async (req, res) => {
    // Track transformed file path for cleanup in finally block
    let transformedPath = null;
    try {
      const slicerCmd = await resolveSlicerCmd();
      if (!slicerCmd) {
        return res.status(500).json({
          ok: false,
          errorCode: "MP_SLICER_NOT_CONFIGURED",
          message: "PrusaSlicer CLI not configured.",
          hint: "Set PRUSA_SLICER_CMD in backend-local/.env or place portable in ../tools/prusaslicer"
        });
      }

      const modelFile = req.files?.model?.[0];
      if (!modelFile?.path) {
        return res.status(400).json({ ok: false, errorCode: "MP_VALIDATION_ERROR", message: "Missing file field 'model' (multipart)." });
      }

      const iniFile = req.files?.ini?.[0];

      const tenantId = getTenantIdFromReq(req);
      const presetId = typeof req.body?.presetId === "string" ? req.body.presetId.trim() : "";

      let iniPath = iniFile?.path || "";
      let usedPreset = null;

      // 1) explicit presetId
      if (!iniPath && presetId) {
        const fromPreset = await getIniPathForPreset(WORKSPACE_ROOT, tenantId, presetId);
        if (fromPreset) {
          iniPath = fromPreset;
          usedPreset = presetId;
        }
      }

      // 2) tenant default preset
      if (!iniPath) {
        const state = await readPresetsState(WORKSPACE_ROOT, tenantId);
        if (state.defaultPresetId) {
          const fromDefault = await getIniPathForPreset(WORKSPACE_ROOT, tenantId, state.defaultPresetId);
          if (fromDefault) {
            iniPath = fromDefault;
            usedPreset = state.defaultPresetId;
          }
        }
      }

      // 3) env default ini
      if (!iniPath) iniPath = DEFAULT_INI;

      if (!iniPath) {
        return res.status(400).json({
          ok: false,
          errorCode: "MP_VALIDATION_ERROR",
          message: "No .ini profile provided.",
          hint: "Upload an 'ini' file OR create presets via /api/presets OR set PRUSA_DEFAULT_INI in backend-local/.env"
        });
      }
      if (!(await fileExists(iniPath))) {
        return res.status(400).json({ ok: false, errorCode: "MP_VALIDATION_ERROR", message: `INI not found: ${iniPath}` });
      }

      // ===== Parse and apply quaternion rotation =====
      const quaternion = parseQuaternion(req.body);
      const transformResult = await applyQuaternionTransform(modelFile.path, quaternion);
      const slicingModelPath = transformResult.modelPath;
      transformedPath = transformResult.transformedPath;

      // ===== Check slicer result cache =====
      let cacheKey = null;
      try {
        cacheKey = await slicerCache.computeKey(slicingModelPath, iniPath);
        const cached = slicerCache.get(cacheKey);
        if (cached) {
          console.log(`[slice] Cache HIT for job ${req.jobId} (key: ${cacheKey.slice(0, 12)}...)`);
          return res.json({
            ok: true,
            data: {
              jobId: req.jobId,
              cached: true,
              ...cached,
            },
          });
        }
      } catch {
        // Cache key computation failed (file read error) — proceed without cache
        cacheKey = null;
      }

      // Optional: get model dimensions (bounding box) before slicing.
      // Uses the rotated model so dimensions reflect the actual orientation being sliced.
      let modelInfo = null;
      let modelInfoError = "";
      try {
        const infoRun = await runPrusaInfo({
          slicerCmd,
          modelPath: slicingModelPath,
          timeoutMs: 20000
        });

        // Persist for debugging
        if (infoRun.stderr) {
          await fs.writeFile(path.join(req.jobDir, "prusa_info_stderr.log"), infoRun.stderr, "utf8").catch(() => {});
        }
        if (infoRun.stdout) {
          await fs.writeFile(path.join(req.jobDir, "prusa_info_stdout.log"), infoRun.stdout, "utf8").catch(() => {});
        }

        if (infoRun.exitCode === 0) {
          modelInfo = parseModelInfo(infoRun.stdout);
        } else {
          modelInfoError = `PrusaSlicer --info failed (exit ${infoRun.exitCode}): ${truncate(infoRun.stderr, 300)}`;
        }
      } catch (e) {
        modelInfoError = `PrusaSlicer --info error: ${String(e?.message || e)}`;
      }

      let run;
      try {
        run = await runPrusaSlicer({
          slicerCmd,
          modelPath: slicingModelPath,
          iniPath,
          outDir: req.jobOutputDir,
          timeoutMs: 300000
        });
      } catch (err) {
        const classified = classifySlicerError({ error: err, context: "slice" });
        const isDev = process.env.NODE_ENV === 'development';
        return res.status(classified.httpStatus).json({
          ok: false,
          errorCode: classified.errorCode,
          message: classified.message,
          data: {
            jobId: req.jobId,
            ...(isDev && { hint: classified.hint, jobDir: req.jobDir }),
          },
        });
      }

      // Persist slicer stderr for debugging
      if (run.stderr) {
        await fs.writeFile(path.join(req.jobDir, "prusa_stderr.log"), run.stderr, "utf8").catch(() => {});
      }
      if (run.stdout) {
        await fs.writeFile(path.join(req.jobDir, "prusa_stdout.log"), run.stdout, "utf8").catch(() => {});
      }

      const isDev2 = process.env.NODE_ENV === 'development';

      if (run.exitCode !== 0) {
        const classified = classifySlicerError({ stderr: run.stderr, exitCode: run.exitCode, context: "slice" });
        return res.status(classified.httpStatus).json({
          ok: false,
          errorCode: classified.errorCode,
          message: classified.message,
          data: {
            exitCode: run.exitCode,
            jobId: req.jobId,
            ...(isDev2 && {
              jobDir: req.jobDir,
              stderr: run.stderr.slice(0, 5000),
              hint: classified.hint,
            }),
          },
        });
      }

      if (!(await fileExists(run.outGcodePath))) {
        return res.status(500).json({
          ok: false,
          errorCode: "MP_SLICING_FAILED",
          message: "out.gcode was not produced.",
          data: {
            jobId: req.jobId,
            ...(isDev2 && {
              jobDir: req.jobDir,
              stderr: run.stderr.slice(0, 5000),
            }),
          },
        });
      }

      const gcodeText = await fs.readFile(run.outGcodePath, "utf8");
      const metrics = parseGcodeMetrics(gcodeText);

      const responseData = {
        durationMs: run.durationMs,
        usedPreset,
        modelUsed: modelFile.originalname,
        modelInfo,
        modelInfoError: modelInfoError || undefined,
        rotationApplied: !!transformedPath,
        metrics,
      };

      // Store in cache for future identical requests
      if (cacheKey) {
        slicerCache.set(cacheKey, responseData);
      }

      res.json({
        ok: true,
        data: {
          jobId: req.jobId,
          cached: false,
          ...responseData,
          // Only expose internal paths in development
          ...(isDev2 && {
            jobDir: req.jobDir,
            outGcodePath: run.outGcodePath,
            slicerCmd,
            iniUsed: iniPath,
          }),
        },
      });
    } catch (e) {
      const isDevCatch = process.env.NODE_ENV === 'development';
      res.status(500).json({
        ok: false,
        errorCode: "MP_INTERNAL_ERROR",
        message: String(e?.message || e),
        data: {
          jobId: req.jobId,
          ...(isDevCatch && { jobDir: req.jobDir }),
        },
      });
    } finally {
      // Always cleanup the transformed STL file to prevent temp file accumulation
      await cleanupTransformedFile(transformedPath);
    }
  }
);

// ===== Slicing Queue API =====

// Wire up the queue executor — this runs when a queued job is ready to process.
// It reuses the same slicing logic as the synchronous /api/slice endpoint.
slicingQueue.setExecutor(async (job, updateProgress) => {
  const { config } = job;
  let transformedPath = null;

  try {
    const slicerCmd = await resolveSlicerCmd();
    if (!slicerCmd) {
      throw new Error("PrusaSlicer CLI not configured.");
    }

    // Resolve INI path (same logic as /api/slice)
    let iniPath = config.iniPath || "";
    let usedPreset = null;

    // 1) explicit presetId
    if (!iniPath && config.presetId) {
      const fromPreset = await getIniPathForPreset(WORKSPACE_ROOT, config.tenantId, config.presetId);
      if (fromPreset) {
        iniPath = fromPreset;
        usedPreset = config.presetId;
      }
    }

    // 2) tenant default preset
    if (!iniPath) {
      const state = await readPresetsState(WORKSPACE_ROOT, config.tenantId);
      if (state.defaultPresetId) {
        const fromDefault = await getIniPathForPreset(WORKSPACE_ROOT, config.tenantId, state.defaultPresetId);
        if (fromDefault) {
          iniPath = fromDefault;
          usedPreset = state.defaultPresetId;
        }
      }
    }

    // 3) env default ini
    if (!iniPath) iniPath = DEFAULT_INI;

    if (!iniPath) {
      throw new Error("No .ini profile available. Upload an INI file, create presets, or set PRUSA_DEFAULT_INI.");
    }
    if (!(await fileExists(iniPath))) {
      throw new Error(`INI not found: ${iniPath}`);
    }

    // ===== Apply quaternion rotation if provided =====
    const quaternion = config.quaternion || null;
    const transformResult = await applyQuaternionTransform(config.modelPath, quaternion);
    const slicingModelPath = transformResult.modelPath;
    transformedPath = transformResult.transformedPath;

    // Optional: model info (uses rotated model for accurate dimensions)
    let modelInfo = null;
    try {
      const infoRun = await runPrusaInfo({
        slicerCmd,
        modelPath: slicingModelPath,
        timeoutMs: 20000,
      });
      if (infoRun.exitCode === 0) {
        modelInfo = parseModelInfo(infoRun.stdout);
      }
    } catch {
      // Non-critical — continue without model info
    }

    updateProgress(5); // Starting slicer

    // Run PrusaSlicer with progress parsing from stderr
    const run = await runPrusaSlicerWithProgress({
      slicerCmd,
      modelPath: slicingModelPath,
      iniPath,
      outDir: config.jobOutputDir,
      timeoutMs: 300000,
      onProgress: (pct) => {
        // Map slicer progress (0-100) to job progress (5-95 range)
        updateProgress(5 + Math.round(pct * 0.9));
      },
      onChildProcess: (child) => {
        // Store reference for cancellation support
        job._childProcess = child;
      },
    });

    // Persist logs
    if (run.stderr && config.jobDir) {
      await fs.writeFile(path.join(config.jobDir, "prusa_stderr.log"), run.stderr, "utf8").catch(() => {});
    }
    if (run.stdout && config.jobDir) {
      await fs.writeFile(path.join(config.jobDir, "prusa_stdout.log"), run.stdout, "utf8").catch(() => {});
    }

    if (run.exitCode !== 0) {
      const classified = classifySlicerError({ stderr: run.stderr, exitCode: run.exitCode, context: "slice" });
      const err = new Error(classified.message);
      err.errorCode = classified.errorCode;
      throw err;
    }

    if (!(await fileExists(run.outGcodePath))) {
      const err = new Error("PrusaSlicer did not produce out.gcode.");
      err.errorCode = "MP_SLICING_FAILED";
      throw err;
    }

    updateProgress(95); // Parsing gcode

    const gcodeText = await fs.readFile(run.outGcodePath, "utf8");
    const metrics = parseGcodeMetrics(gcodeText);

    return {
      durationMs: run.durationMs,
      usedPreset,
      modelUsed: config.modelOriginalName,
      modelInfo,
      rotationApplied: !!transformedPath,
      metrics,
    };
  } finally {
    // Always cleanup the transformed STL file to prevent temp file accumulation
    await cleanupTransformedFile(transformedPath);
  }
});

// Log queue events (dev diagnostics) + fire webhooks
slicingQueue.on("job:started", ({ jobId, priority }) => {
  console.log(`[slicingQueue] Job ${jobId} started processing (priority: ${priority || "normal"})`);
});
slicingQueue.on("job:completed", ({ jobId, tenantId, result }) => {
  console.log(`[slicingQueue] Job ${jobId} completed`);
  // Fire slice.completed webhook (fire-and-forget)
  if (tenantId) {
    fireWebhook(WORKSPACE_ROOT, tenantId, "slice.completed", {
      jobId,
      modelUsed: result?.modelUsed,
      usedPreset: result?.usedPreset,
      durationMs: result?.durationMs,
      metrics: result?.metrics,
    });
  }
});
slicingQueue.on("job:failed", ({ jobId, tenantId, error, errorCode }) => {
  console.log(`[slicingQueue] Job ${jobId} failed [${errorCode || "MP_SLICING_FAILED"}]: ${error}`);
  // Fire slice.failed webhook (fire-and-forget)
  if (tenantId) {
    fireWebhook(WORKSPACE_ROOT, tenantId, "slice.failed", {
      jobId,
      error: String(error),
      errorCode: errorCode || "MP_SLICING_FAILED",
    });
  }
});

/**
 * POST /api/slice/queue — Submit a slicing job to the queue.
 * Accepts the same multipart payload as POST /api/slice.
 * Returns immediately with a job ID for polling.
 */
app.post(
  "/api/slice/queue",
  createJobMiddleware,
  createUploader().fields([
    { name: "model", maxCount: 1 },
    { name: "ini", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const modelFile = req.files?.model?.[0];
      if (!modelFile?.path) {
        return fail(res, 400, "MP_BAD_REQUEST", "Missing file field 'model' (multipart).");
      }

      const tenantId = getTenantIdFromReq(req);
      const presetId = typeof req.body?.presetId === "string" ? req.body.presetId.trim() : "";
      const iniFile = req.files?.ini?.[0];

      const priority = req.body?.priority === "high" ? "high" : "normal";

      // Parse quaternion for rotation (will be applied by the queue executor)
      const quaternion = parseQuaternion(req.body);

      const result = slicingQueue.addJob({
        tenantId,
        modelPath: modelFile.path,
        modelOriginalName: modelFile.originalname,
        iniPath: iniFile?.path || "",
        presetId,
        priority,
        quaternion,
        jobDir: req.jobDir,
        jobOutputDir: req.jobOutputDir,
      });

      if (!result.ok) {
        return fail(res, 429, result.code, result.message);
      }

      return res.status(202).json({
        ok: true,
        data: result.job,
      });
    } catch (e) {
      return fail(res, 500, "MP_QUEUE_SUBMIT_FAILED", String(e?.message || e));
    }
  }
);

/**
 * GET /api/slice/queue — Get queue statistics for the current tenant.
 * Returns only counts for jobs belonging to this tenant, plus global capacity info.
 */
app.get("/api/slice/queue", (req, res) => {
  const tenantId = getTenantIdFromReq(req);

  // Get global capacity info
  const globalStats = slicingQueue.getQueueStats();

  // Compute tenant-scoped counts by iterating tenant's jobs only.
  // slicingQueue._jobs is a Map<string, SlicingJob> — we filter by tenantId.
  const tenantStats = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    total: 0,
    highPriorityQueued: 0,
    normalPriorityQueued: 0,
    // Capacity info is global (shared resource)
    concurrency: globalStats.concurrency,
    maxQueueSize: globalStats.maxQueueSize,
  };

  for (const job of slicingQueue._jobs.values()) {
    if (job.tenantId !== tenantId) continue;
    tenantStats[job.status] = (tenantStats[job.status] || 0) + 1;
    tenantStats.total++;
    if (job.status === "queued") {
      if (job.priority === "high") {
        tenantStats.highPriorityQueued++;
      } else {
        tenantStats.normalPriorityQueued++;
      }
    }
  }

  return ok(res, tenantStats);
});

/**
 * GET /api/slice/queue/:jobId — Get status and progress of a specific job.
 * Tenant-isolated: only the tenant that created the job can view it.
 */
app.get("/api/slice/queue/:jobId", (req, res) => {
  const jobId = String(req.params.jobId || "").trim();
  if (!jobId) return fail(res, 400, "MP_BAD_REQUEST", "Missing jobId.");

  const tenantId = getTenantIdFromReq(req);
  const job = slicingQueue.getJobStatus(jobId);
  if (!job || job.tenantId !== tenantId) {
    return fail(res, 404, "MP_NOT_FOUND", `Job ${jobId} not found.`);
  }

  return ok(res, job);
});

/**
 * DELETE /api/slice/queue/:jobId — Cancel a queued or processing job.
 * Tenant-isolated: only the tenant that created the job can cancel it.
 */
app.delete("/api/slice/queue/:jobId", (req, res) => {
  const jobId = String(req.params.jobId || "").trim();
  if (!jobId) return fail(res, 400, "MP_BAD_REQUEST", "Missing jobId.");

  // Check tenant ownership before allowing cancellation
  const tenantId = getTenantIdFromReq(req);
  const job = slicingQueue.getJobStatus(jobId);
  if (!job || job.tenantId !== tenantId) {
    return fail(res, 404, "MP_NOT_FOUND", `Job ${jobId} not found.`);
  }

  const result = slicingQueue.cancelJob(jobId);
  if (!result.ok) {
    const status = result.code === "MP_NOT_FOUND" ? 404 : 409;
    return fail(res, status, result.code, result.message);
  }

  return ok(res, { jobId, status: "cancelled" });
});

// ===== Sentry error handler (must be after all routes, before custom error handlers) =====
setupSentryErrorHandler(app);

// ===== 404 handler — catch unmatched routes =====
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    errorCode: "MP_NOT_FOUND",
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ===== Global error handler (CORS, multer, validation, typed errors, etc.) =====
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV === "development";

  // Multer file size limit
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      ok: false,
      errorCode: "MP_UPLOAD_TOO_LARGE",
      message: "Uploaded file exceeds the size limit",
    });
  }

  // Multer file type or other multer errors
  if (err.name === "MulterError" || err.message?.includes("Unsupported file type") || err.message?.includes("Only .ini files")) {
    return res.status(400).json({
      ok: false,
      errorCode: "MP_VALIDATION_ERROR",
      message: String(err.message),
    });
  }

  // CORS errors
  if (err.message?.startsWith("CORS blocked")) {
    return res.status(403).json({
      ok: false,
      errorCode: "MP_CORS_BLOCKED",
      message: String(err.message),
    });
  }

  // Validation errors (from express-validator or custom ValidationError)
  if (err.name === "ValidationError" || err.type === "validation") {
    return res.status(400).json({
      ok: false,
      errorCode: "MP_VALIDATION_ERROR",
      message: String(err.message || "Validation failed"),
      details: err.details || err.errors || undefined,
    });
  }

  // Auth errors
  if (err.name === "AuthError" || err.type === "auth" || err.status === 401) {
    return res.status(401).json({
      ok: false,
      errorCode: "MP_AUTH_ERROR",
      message: isDev ? String(err.message || "Authentication failed") : "Authentication failed",
    });
  }

  // Forbidden (tenant, permissions)
  if (err.status === 403 || err.type === "forbidden") {
    return res.status(403).json({
      ok: false,
      errorCode: "MP_FORBIDDEN",
      message: isDev ? String(err.message || "Access denied") : "Access denied",
    });
  }

  // Not found errors
  if (err.status === 404 || err.type === "not_found") {
    return res.status(404).json({
      ok: false,
      errorCode: "MP_NOT_FOUND",
      message: String(err.message || "Resource not found"),
    });
  }

  // Timeout errors (PrusaSlicer or other)
  if (err.message?.includes("timed out") || err.code === "ETIMEDOUT" || err.type === "timeout") {
    return res.status(504).json({
      ok: false,
      errorCode: "MP_SLICER_TIMEOUT",
      message: isDev ? String(err.message || "Operation timed out") : "Operation timed out",
    });
  }

  // JSON parse errors (malformed request body)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      ok: false,
      errorCode: "MP_VALIDATION_ERROR",
      message: "Invalid JSON in request body",
    });
  }

  // Log unexpected errors
  console.error("[API] Unhandled error:", err);

  // Report unexpected errors to Sentry
  captureException(err, {
    route: `${_req.method} ${_req.originalUrl}`,
    tenantId: _req.tenantId,
    userId: _req.user?.uid,
  });

  // Generic fallback — don't leak stack traces in production
  res.status(err.status || 500).json({
    ok: false,
    errorCode: err.errorCode || "MP_INTERNAL_ERROR",
    message: isDev ? String(err?.message || err) : "Internal server error",
    ...((isDev && err.stack) ? { stack: err.stack } : {}),
  });
});

const server = app.listen(PORT, () => {
  const env = process.env.NODE_ENV || "development";
  const storage = process.env.STORAGE_PROVIDER || "filesystem";
  const email = process.env.EMAIL_PROVIDER || "none";
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeKey
    ? (stripeKey.startsWith("sk_test_") ? "test" : "live")
    : "off";
  const sentry = process.env.SENTRY_DSN ? "on" : "off";
  const version = process.env.APP_VERSION || API_VERSION_FULL || "1.0.0";

  const pad = (label, value) =>
    `\u2551 ${label.padEnd(13)} ${String(value).padEnd(25)}\u2551`;

  console.log("");
  console.log("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551         ModelPricer API Server          \u2551");
  console.log("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
  console.log(pad("Port:", PORT));
  console.log(pad("Environment:", env));
  console.log(pad("Storage:", storage));
  console.log(pad("Email:", email));
  console.log(pad("Stripe:", stripe));
  console.log(pad("Sentry:", sentry));
  console.log(pad("Version:", version));
  console.log(pad("Workspace:", WORKSPACE_ROOT.length > 25 ? "..." + WORKSPACE_ROOT.slice(-22) : WORKSPACE_ROOT));
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D");
  console.log(`  API docs: http://127.0.0.1:${PORT}/api/docs/html`);
  console.log("");
});

// Graceful shutdown — stop accepting connections, persist queue, clear caches
let isShuttingDown = false;
function gracefulShutdown(signal) {
  if (isShuttingDown) return;           // prevent double-shutdown
  isShuttingDown = true;

  console.log(`[backend-local] Received ${signal}. Starting graceful shutdown...`);
  console.log("[backend-local] Stopping new connections...");

  slicingQueue.shutdown();
  slicerCache.shutdown();
  console.log("[backend-local] Queue and cache shut down.");

  server.close(() => {
    console.log("[backend-local] All connections closed. Goodbye.");
    process.exit(0);
  });

  // Force exit after 30s if graceful shutdown hangs (Cloud Run sends SIGTERM)
  const SHUTDOWN_TIMEOUT_MS = 30_000;
  setTimeout(() => {
    console.error(`[backend-local] Forced shutdown after ${SHUTDOWN_TIMEOUT_MS / 1000}s timeout.`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ===== Helpers =====

/**
 * Resolve tenant ID from a public widget ID.
 * Scans <workspaceRoot>/config/<tenantId>/widget.json files to find which
 * tenant owns the given publicWidgetId.
 *
 * @param {string} workspaceRoot
 * @param {string} widgetId - The public widget ID to look up
 * @returns {Promise<string|null>} The tenant ID, or null if not found
 */
async function resolveTenantFromWidgetId(workspaceRoot, widgetId) {
  if (!widgetId) return null;

  const configDir = path.join(workspaceRoot, "config");
  let tenantDirs;
  try {
    tenantDirs = await fs.readdir(configDir, { withFileTypes: true });
  } catch {
    // Config directory doesn't exist — no tenants configured
    return null;
  }

  for (const entry of tenantDirs) {
    if (!entry.isDirectory()) continue;

    // Sanitize directory name to prevent path traversal
    const dirName = entry.name;
    const widgetConfigPath = path.join(configDir, dirName, "widget.json");
    try {
      const raw = await fs.readFile(widgetConfigPath, "utf8");
      const config = JSON.parse(raw);
      // Check if this tenant's widget config matches the requested widgetId
      if (config.publicWidgetId === widgetId || config.widgetId === widgetId) {
        return dirName;
      }
    } catch {
      // No widget.json or invalid JSON — skip this tenant
      continue;
    }
  }

  return null;
}

// ===== Quaternion helpers for STL rotation before slicing =====

/**
 * Parse quaternion fields from request body (FormData or JSON).
 * Returns null if quaternion is not provided or is identity (no rotation needed).
 * Returns { x, y, z, w } if valid quaternion is present.
 *
 * @param {object} body - req.body
 * @returns {{ x: number, y: number, z: number, w: number } | null}
 */
function parseQuaternion(body) {
  if (!body) return null;

  const x = parseFloat(body.quaternion_x);
  const y = parseFloat(body.quaternion_y);
  const z = parseFloat(body.quaternion_z);
  const w = parseFloat(body.quaternion_w);

  // If any component is not a finite number, skip rotation
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(w)) {
    return null;
  }

  // Identity quaternion (0, 0, 0, 1) — no rotation needed
  const EPSILON = 0.001;
  if (Math.abs(x) < EPSILON && Math.abs(y) < EPSILON && Math.abs(z) < EPSILON && Math.abs(w - 1) < EPSILON) {
    return null;
  }

  // Validate unit quaternion (|q| should be ~1.0)
  const magnitude = Math.sqrt(x * x + y * y + z * z + w * w);
  if (Math.abs(magnitude - 1.0) > 0.01) {
    console.warn(`[slice] Quaternion magnitude ${magnitude.toFixed(4)} is not unit — ignoring rotation.`);
    return null;
  }

  return { x, y, z, w };
}

/**
 * Apply quaternion rotation to an STL file. Returns the path to the transformed file,
 * or the original path if no rotation is needed or if transformation fails (fallback).
 *
 * @param {string} modelPath - Original STL file path
 * @param {{ x: number, y: number, z: number, w: number } | null} quaternion - Parsed quaternion or null
 * @returns {Promise<{ modelPath: string, transformedPath: string | null }>}
 */
async function applyQuaternionTransform(modelPath, quaternion) {
  if (!quaternion) {
    return { modelPath, transformedPath: null };
  }

  try {
    const transformedPath = await transformSTLFile(modelPath, quaternion);
    console.log(`[slice] STL rotated: quaternion=(${quaternion.x}, ${quaternion.y}, ${quaternion.z}, ${quaternion.w}) → ${transformedPath}`);
    return { modelPath: transformedPath, transformedPath };
  } catch (err) {
    console.warn(`[slice] STL transform failed, falling back to original file: ${err?.message || err}`);
    return { modelPath, transformedPath: null };
  }
}

/**
 * Cleanup a transformed STL file (if it was created).
 * Always called in finally blocks to avoid accumulating temp files.
 *
 * @param {string | null} transformedPath
 */
async function cleanupTransformedFile(transformedPath) {
  if (!transformedPath) return;
  try {
    await fs.unlink(transformedPath);
  } catch {
    // File may already be deleted or not exist — ignore
  }
}

async function resolveSlicerCmd() {
  const fromEnv = (process.env.PRUSA_SLICER_CMD || "").trim();
  if (fromEnv) return fromEnv;
  // Try auto-detect inside project root
  const found = await findPrusaSlicerConsole(projectRoot);
  return found || "";
}

/**
 * Get PrusaSlicer version string (cached for 5 minutes to avoid repeated spawns).
 * Parses the version from --help output (Windows portable builds often lack --version).
 *
 * @returns {Promise<string|null>}
 */
let _cachedSlicerVersion = null;
let _cachedSlicerVersionExpiry = 0;
async function getSlicerVersionCached() {
  if (_cachedSlicerVersion && Date.now() < _cachedSlicerVersionExpiry) {
    return _cachedSlicerVersion;
  }
  const cmd = await resolveSlicerCmd();
  if (!cmd) return null;
  try {
    const result = await runSimple(cmd, ["--help"], 15000);
    const version = parseSlicerVersion(result.stdout) || parseSlicerVersion(result.stderr);
    _cachedSlicerVersion = version;
    _cachedSlicerVersionExpiry = Date.now() + 5 * 60 * 1000; // Cache 5 min
    return version;
  } catch {
    return null;
  }
}

function createJobMiddleware(req, _res, next) {
  const jobId = `job-${nanoid(10)}`;
  req.jobId = jobId;
  req.jobDir = path.join(WORKSPACE_ROOT, jobId);
  req.jobInputDir = path.join(req.jobDir, "input");
  req.jobOutputDir = path.join(req.jobDir, "output");

  Promise.all([ensureDir(req.jobInputDir), ensureDir(req.jobOutputDir)])
    .then(() => next())
    .catch(next);
}

function createUploader() {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, req.jobInputDir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9\._-]/g, "_");
      cb(null, safe);
    }
  });

  const fileFilter = (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const ok = name.endsWith(".stl") || name.endsWith(".obj") || name.endsWith(".3mf") || name.endsWith(".amf") || name.endsWith(".ini");
    if (!ok) return cb(new Error(`Unsupported file type: ${file.originalname}`));
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 250 * 1024 * 1024 // 250MB
    }
  });
}

async function runSimple(cmd, args, timeoutMs) {
  // Minimal runner for health check
  const { spawn } = await import("node:child_process");
  return await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => (stdout += String(d)));
    child.stderr?.on("data", (d) => (stderr += String(d)));

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmd} ${args.join(" ")}`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, stdout, stderr });
    });
  });
}

function truncate(s, maxLen) {
  if (!s) return "";
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + `\n... (truncated ${s.length - maxLen} chars)`;
}

/**
 * Run PrusaSlicer with real-time progress parsing from stderr.
 * PrusaSlicer outputs lines like "Slicing... 45%" or "=> Processing... 80%"
 * to stderr. This function parses those and calls onProgress(pct).
 *
 * @param {Object} opts
 * @param {string} opts.slicerCmd
 * @param {string} opts.modelPath
 * @param {string} opts.iniPath
 * @param {string} opts.outDir
 * @param {number} [opts.timeoutMs=300000]
 * @param {(pct: number) => void} [opts.onProgress]
 * @param {(child: import("node:child_process").ChildProcess) => void} [opts.onChildProcess]
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string, outGcodePath: string, durationMs: number }>}
 */
async function runPrusaSlicerWithProgress({ slicerCmd, modelPath, iniPath, outDir, timeoutMs = 300000, onProgress, onChildProcess }) {
  const { spawn } = await import("node:child_process");
  const outGcodePath = path.join(outDir, "out.gcode");

  const args = [
    "--export-gcode",
    "-o",
    outGcodePath,
    modelPath,
    "--load",
    iniPath,
  ];

  const start = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn(slicerCmd, args, { cwd: outDir, windowsHide: true, shell: false });

    if (onChildProcess) onChildProcess(child);

    let stdout = "";
    let stderr = "";

    // Regex to match progress lines from PrusaSlicer stderr.
    // Examples: "Slicing... 45%", "=> Generating perimeters 80%", "72%"
    const progressRe = /(\d{1,3})%/;

    child.stdout?.on("data", (d) => (stdout += String(d)));
    child.stderr?.on("data", (d) => {
      const chunk = String(d);
      stderr += chunk;

      // Try to extract progress percentage from this chunk
      if (onProgress) {
        const lines = chunk.split(/\r?\n/);
        for (const line of lines) {
          const match = line.match(progressRe);
          if (match) {
            const pct = parseInt(match[1], 10);
            if (pct >= 0 && pct <= 100) {
              onProgress(pct);
            }
          }
        }
      }
    });

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // ignore
      }
      reject(new Error(`PrusaSlicer timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code,
        stdout,
        stderr,
        outGcodePath,
        durationMs: Date.now() - start,
      });
    });
  });
}
