/**
 * Config API — tenant branding, company configuration, storage mode, and full config export/import.
 *
 * Endpoints:
 *   GET    /api/config/branding        — Get branding config for tenant
 *   GET    /api/config/company         — Get company config for tenant
 *   GET    /api/config/export          — Export all tenant config as JSON
 *   POST   /api/config/import          — Import config JSON (validates structure, overwrites)
 *   GET    /api/config/storage-mode    — Get current storage mode for tenant
 *   POST   /api/config/storage-mode    — Set storage mode for tenant
 *   GET    /api/config/supabase-status — Check Supabase connectivity
 *
 * Storage: JSON files per tenant at {workspace}/config/{tenantId}/<section>.json
 *
 * @module routes/config
 */

import { Router } from "express";
import { logInfo, logWarn } from "../util/logger.js";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "../util/fsSafe.js";

/**
 * Assert that a resolved path stays within the given base directory.
 * Throws a 400 error if a path traversal is detected.
 *
 * @param {string} resolvedPath
 * @param {string} base
 */
function assertInWorkspace(resolvedPath, base) {
  const abs = path.resolve(resolvedPath);
  const absBase = path.resolve(base);
  if (!abs.startsWith(absBase + path.sep) && abs !== absBase) {
    const err = new Error("Path traversal detected");
    err.status = 400;
    throw err;
  }
}

/**
 * All config sections that can be exported/imported.
 * Each maps to a JSON file in the tenant config directory.
 */
const CONFIG_SECTIONS = [
  "branding",
  "company",
  "pricing",
  "fees",
  "shipping",
  "parameters",
  "widget",
  "ecommerce",
];

/**
 * Valid storage modes for tenant data persistence.
 * - localStorage: all data in browser localStorage (default, no backend persistence)
 * - dual-write: writes to both localStorage and Supabase (migration phase)
 * - supabase: Supabase-only persistence (target state)
 * @type {readonly string[]}
 */
const VALID_STORAGE_MODES = ["localStorage", "dual-write", "supabase"];

/** Default storage configuration returned when no config file exists. */
const DEFAULT_STORAGE_CONFIG = { mode: "localStorage" };

/**
 * Creates the config router.
 *
 * @param {{ workspaceRoot: string, getTenantIdFromReq: (req) => string }} opts
 * @returns {Router}
 */
export function createConfigRouter({ workspaceRoot, getTenantIdFromReq }) {
  const router = Router();

  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message, details) {
    return res.status(status).json({ ok: false, errorCode, message, details });
  }

  /**
   * Validate that a tenantId contains no path traversal characters.
   * @param {string} tenantId
   */
  function validateTenantId(tenantId) {
    if (!tenantId || typeof tenantId !== "string" || /[./\\]/.test(tenantId)) {
      const err = new Error("Invalid tenant ID");
      err.status = 400;
      throw err;
    }
  }

  /**
   * Resolve the config directory for a tenant.
   * Guards against path traversal via tenantId.
   * @param {string} tenantId
   * @returns {string}
   */
  function configDir(tenantId) {
    validateTenantId(tenantId);
    const dir = path.join(workspaceRoot, "config", tenantId);
    assertInWorkspace(dir, path.join(workspaceRoot, "config"));
    return dir;
  }

  /**
   * Read a tenant config file, returning empty object if not found.
   * @param {string} tenantId
   * @param {string} filename
   * @returns {Promise<object>}
   */
  async function readTenantConfig(tenantId, filename) {
    const filePath = path.join(configDir(tenantId), filename);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw);
    } catch (e) {
      if (e.code === "ENOENT") return {};
      throw e;
    }
  }

  /**
   * Write a tenant config file, creating directories as needed.
   * @param {string} tenantId
   * @param {string} filename
   * @param {object} data
   */
  async function writeTenantConfig(tenantId, filename, data) {
    const dir = configDir(tenantId);
    await ensureDir(dir);
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  // ───────────────────────────────────────────────────
  // GET /api/config/branding — Get branding configuration
  // ───────────────────────────────────────────────────
  router.get("/branding", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const branding = await readTenantConfig(tenantId, "branding.json");
      return ok(res, branding);
    } catch (e) {
      return fail(res, 500, "MP_CONFIG_READ_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/config/company — Get company configuration
  // ───────────────────────────────────────────────────
  router.get("/company", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const company = await readTenantConfig(tenantId, "company.json");
      return ok(res, company);
    } catch (e) {
      return fail(res, 500, "MP_CONFIG_READ_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/config/export — Export all tenant config as JSON
  // ───────────────────────────────────────────────────
  /**
   * Exports all tenant configuration sections into a single JSON object.
   * Useful for backup, migration, or cloning tenant settings.
   *
   * Response: { ok: true, data: { _meta: {...}, branding: {...}, pricing: {...}, ... } }
   */
  router.get("/export", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);

      const exportData = {
        _meta: {
          exportedAt: new Date().toISOString(),
          tenantId,
          version: 1,
          sections: [],
        },
      };

      for (const section of CONFIG_SECTIONS) {
        const data = await readTenantConfig(tenantId, `${section}.json`);
        exportData[section] = data;
        // Track which sections actually have data
        if (Object.keys(data).length > 0) {
          exportData._meta.sections.push(section);
        }
      }

      return ok(res, exportData);
    } catch (e) {
      return fail(res, 500, "MP_CONFIG_EXPORT_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/config/import — Import config JSON
  // ───────────────────────────────────────────────────
  /**
   * Imports a previously exported config JSON, overwriting matching sections.
   * Validates the structure before writing.
   *
   * Body: the exported JSON object (must have _meta.version).
   * Optional query param: ?sections=branding,pricing (import only specific sections).
   */
  router.post("/import", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const body = req.body;

      // --- Validation ---
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Request body must be a JSON object");
      }

      if (!body._meta || typeof body._meta !== "object") {
        return fail(
          res,
          400,
          "MP_VALIDATION_ERROR",
          "Missing _meta field. This does not look like a valid config export."
        );
      }

      if (!body._meta.version || body._meta.version > 1) {
        return fail(
          res,
          400,
          "MP_VALIDATION_ERROR",
          `Unsupported config version: ${body._meta.version}. Expected version 1.`
        );
      }

      // Determine which sections to import
      const requestedSections = req.query.sections
        ? String(req.query.sections).split(",").map((s) => s.trim()).filter(Boolean)
        : CONFIG_SECTIONS;

      const validationErrors = [];
      const sectionsToWrite = [];

      for (const section of requestedSections) {
        if (!CONFIG_SECTIONS.includes(section)) {
          validationErrors.push(`Unknown config section: "${section}"`);
          continue;
        }

        const sectionData = body[section];
        if (sectionData === undefined) {
          // Section not present in import — skip silently
          continue;
        }

        if (typeof sectionData !== "object" || Array.isArray(sectionData) || sectionData === null) {
          validationErrors.push(`Section "${section}" must be a JSON object, got ${typeof sectionData}`);
          continue;
        }

        sectionsToWrite.push({ section, data: sectionData });
      }

      if (validationErrors.length > 0) {
        return fail(res, 400, "MP_VALIDATION_ERROR", "Config import validation failed", validationErrors);
      }

      if (sectionsToWrite.length === 0) {
        return fail(res, 400, "MP_VALIDATION_ERROR", "No valid sections found in import data");
      }

      // --- Write sections ---
      const importedSections = [];
      for (const { section, data } of sectionsToWrite) {
        await writeTenantConfig(tenantId, `${section}.json`, data);
        importedSections.push(section);
      }

      logInfo(
        `[config] Imported ${importedSections.length} sections for tenant ${tenantId}: ${importedSections.join(", ")}`
      );

      return ok(res, {
        importedSections,
        importedAt: new Date().toISOString(),
        tenantId,
      });
    } catch (e) {
      return fail(res, 500, "MP_CONFIG_IMPORT_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/config/storage-mode — Get current storage mode
  // ───────────────────────────────────────────────────
  /**
   * Returns the current storage mode for the authenticated tenant.
   * If no storage-config.json exists yet, returns the default: { mode: 'localStorage' }.
   *
   * @returns {{ ok: true, data: { mode: 'localStorage' | 'dual-write' | 'supabase' } }}
   */
  router.get("/storage-mode", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const config = await readTenantConfig(tenantId, "storage-config.json");

      // If file was empty or missing, return default
      const mode = VALID_STORAGE_MODES.includes(config.mode)
        ? config.mode
        : DEFAULT_STORAGE_CONFIG.mode;

      return ok(res, { mode });
    } catch (e) {
      return fail(res, 500, "MP_STORAGE_MODE_READ_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/config/storage-mode — Set storage mode
  // ───────────────────────────────────────────────────
  /**
   * Changes the storage mode for the authenticated tenant.
   * Validates that the requested mode is one of the allowed values.
   * Persists the change to {workspaceRoot}/config/{tenantId}/storage-config.json.
   *
   * @param {object} req.body - Must contain { mode: 'localStorage' | 'dual-write' | 'supabase' }
   * @returns {{ ok: true, data: { mode: string, updatedAt: string } }}
   */
  router.post("/storage-mode", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const { mode } = req.body || {};

      // --- Validation ---
      if (!mode || typeof mode !== "string") {
        return fail(
          res,
          400,
          "MP_VALIDATION_ERROR",
          "Request body must contain a 'mode' string field."
        );
      }

      if (!VALID_STORAGE_MODES.includes(mode)) {
        return fail(
          res,
          400,
          "MP_VALIDATION_ERROR",
          `Invalid storage mode "${mode}". Must be one of: ${VALID_STORAGE_MODES.join(", ")}`
        );
      }

      // Read current config to detect actual changes
      const currentConfig = await readTenantConfig(tenantId, "storage-config.json");
      const previousMode = currentConfig.mode || DEFAULT_STORAGE_CONFIG.mode;

      const updatedAt = new Date().toISOString();
      const newConfig = { mode, updatedAt };

      await writeTenantConfig(tenantId, "storage-config.json", newConfig);

      if (previousMode !== mode) {
        logInfo(
          `[config/storage-mode] Tenant "${tenantId}" changed storage mode: "${previousMode}" -> "${mode}"`
        );
      } else {
        logInfo(
          `[config/storage-mode] Tenant "${tenantId}" set storage mode to "${mode}" (unchanged)`
        );
      }

      return ok(res, { mode, updatedAt });
    } catch (e) {
      return fail(res, 500, "MP_STORAGE_MODE_WRITE_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/config/supabase-status — Check Supabase connectivity
  // ───────────────────────────────────────────────────
  /**
   * Performs a lightweight connectivity check against the Supabase REST API.
   * Uses a simple HTTP fetch to `${SUPABASE_URL}/rest/v1/` with the apikey header.
   * Does NOT require a Supabase client library — plain fetch only.
   *
   * Environment variables used:
   * - SUPABASE_URL — project URL (required)
   * - SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY — for the apikey header
   *
   * @returns {{ ok: true, data: { connected: boolean, url: string, error?: string } }}
   */
  router.get("/supabase-status", async (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const apiKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    // If env vars are not configured at all, report that immediately
    if (!supabaseUrl) {
      return ok(res, {
        connected: false,
        url: "",
        error: "SUPABASE_URL is not configured on the server.",
      });
    }

    if (!apiKey) {
      return ok(res, {
        connected: false,
        url: supabaseUrl,
        error:
          "No Supabase API key configured (SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY).",
      });
    }

    // Mask the URL for the response — show host only, no path/credentials
    let maskedUrl = "";
    try {
      const parsed = new URL(supabaseUrl);
      maskedUrl = parsed.host; // e.g. "xxxx.supabase.co"
    } catch {
      maskedUrl = supabaseUrl;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: "GET",
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 200) {
        return ok(res, { connected: true, url: maskedUrl });
      }

      // Non-OK status — Supabase is reachable but returned an error
      logWarn(
        `[config/supabase-status] Supabase responded with HTTP ${response.status}`
      );
      return ok(res, {
        connected: false,
        url: maskedUrl,
        error: `Supabase responded with HTTP ${response.status}`,
      });
    } catch (/** @type {any} */ fetchError) {
      const errorMessage =
        fetchError?.name === "AbortError"
          ? "Connection timed out after 8 seconds"
          : String(fetchError?.message || fetchError);

      logWarn(`[config/supabase-status] Connectivity check failed: ${errorMessage}`);

      return ok(res, {
        connected: false,
        url: maskedUrl,
        error: errorMessage,
      });
    }
  });

  return router;
}

export default createConfigRouter;
