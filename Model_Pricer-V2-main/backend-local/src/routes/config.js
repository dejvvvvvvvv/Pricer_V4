/**
 * Config API — tenant branding, company configuration, and full config export/import.
 *
 * Endpoints:
 *   GET    /api/config/branding — Get branding config for tenant
 *   GET    /api/config/company  — Get company config for tenant
 *   GET    /api/config/export   — Export all tenant config as JSON
 *   POST   /api/config/import   — Import config JSON (validates structure, overwrites)
 *
 * Storage: JSON files per tenant at {workspace}/config/{tenantId}/<section>.json
 *
 * @module routes/config
 */

import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir } from "../util/fsSafe.js";

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
   * Resolve the config directory for a tenant.
   * @param {string} tenantId
   * @returns {string}
   */
  function configDir(tenantId) {
    return path.join(workspaceRoot, "config", tenantId);
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

      console.log(
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

  return router;
}

export default createConfigRouter;
