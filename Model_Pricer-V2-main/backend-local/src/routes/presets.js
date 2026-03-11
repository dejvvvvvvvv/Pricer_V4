import { Router } from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";

import {
  createPresetFromIni,
  deletePreset,
  getIniPathForPreset,
  listPresets,
  readPresetsState,
  setDefaultPreset,
  updatePresetMeta,
  writePresetsState,
  getTenantPresetsFilesDir,
  ensureTenantPresetDirs,
} from "../presetsStore.js";

import { validate, presetSchemas } from "../middleware/validate.js";
import { fileExists } from "../util/fsSafe.js";

/**
 * Preset validation schemas for new endpoints.
 */
const duplicateSchema = {
  params: {
    id: { type: "string", required: true, minLength: 1, maxLength: 100, label: "Preset ID" },
  },
};

const validatePresetSchema = {
  body: {
    name: { type: "string", required: true, minLength: 1, maxLength: 200, label: "Preset name" },
    layerHeight: { type: "number", min: 0.01, max: 2.0, label: "Layer height" },
    nozzleDiameter: { type: "number", min: 0.1, max: 2.0, label: "Nozzle diameter" },
    infillDensity: { type: "number", min: 0, max: 100, label: "Infill density" },
    printSpeed: { type: "number", min: 1, max: 600, label: "Print speed" },
    temperature: { type: "number", min: 150, max: 500, label: "Nozzle temperature" },
    bedTemperature: { type: "number", min: 0, max: 200, label: "Bed temperature" },
  },
};

/**
 * PrusaSlicer default presets — commonly used print profiles.
 * These are reference values, not exhaustive.
 */
const PRUSASLICER_DEFAULTS = [
  {
    id: "default-pla-02",
    name: "PLA - 0.20mm QUALITY",
    description: "Standard PLA profile, 0.20mm layer height",
    material: "PLA",
    quality: "quality",
    layerHeight: 0.2,
    nozzleDiameter: 0.4,
    infillDensity: 15,
    printSpeed: 60,
    temperature: 215,
    bedTemperature: 60,
    supports: false,
    brim: false,
    isDefault: true,
    isActive: true,
  },
  {
    id: "default-pla-015",
    name: "PLA - 0.15mm QUALITY",
    description: "Fine PLA profile, 0.15mm layer height",
    material: "PLA",
    quality: "fine",
    layerHeight: 0.15,
    nozzleDiameter: 0.4,
    infillDensity: 15,
    printSpeed: 50,
    temperature: 215,
    bedTemperature: 60,
    supports: false,
    brim: false,
    isDefault: false,
    isActive: true,
  },
  {
    id: "default-pla-03",
    name: "PLA - 0.30mm DRAFT",
    description: "Fast PLA profile, 0.30mm layer height",
    material: "PLA",
    quality: "draft",
    layerHeight: 0.3,
    nozzleDiameter: 0.4,
    infillDensity: 15,
    printSpeed: 80,
    temperature: 220,
    bedTemperature: 60,
    supports: false,
    brim: false,
    isDefault: false,
    isActive: true,
  },
  {
    id: "default-petg-02",
    name: "PETG - 0.20mm QUALITY",
    description: "Standard PETG profile, 0.20mm layer height",
    material: "PETG",
    quality: "quality",
    layerHeight: 0.2,
    nozzleDiameter: 0.4,
    infillDensity: 15,
    printSpeed: 50,
    temperature: 240,
    bedTemperature: 85,
    supports: false,
    brim: false,
    isDefault: false,
    isActive: true,
  },
  {
    id: "default-abs-02",
    name: "ABS - 0.20mm QUALITY",
    description: "Standard ABS profile, 0.20mm layer height",
    material: "ABS",
    quality: "quality",
    layerHeight: 0.2,
    nozzleDiameter: 0.4,
    infillDensity: 15,
    printSpeed: 50,
    temperature: 255,
    bedTemperature: 100,
    supports: false,
    brim: true,
    isDefault: false,
    isActive: true,
  },
  {
    id: "default-tpu-02",
    name: "TPU - 0.20mm QUALITY",
    description: "Standard TPU (flexible) profile, 0.20mm layer height",
    material: "TPU",
    quality: "quality",
    layerHeight: 0.2,
    nozzleDiameter: 0.4,
    infillDensity: 20,
    printSpeed: 25,
    temperature: 230,
    bedTemperature: 50,
    supports: false,
    brim: true,
    isDefault: false,
    isActive: true,
  },
];

/**
 * Validate preset configuration fields.
 * Returns an array of error strings (empty = valid).
 *
 * @param {Object} config
 * @returns {string[]}
 */
function validatePresetConfig(config) {
  const errors = [];

  // Required fields
  if (!config.name || typeof config.name !== "string" || !config.name.trim()) {
    errors.push("name is required and must be a non-empty string");
  }

  // Numerical range validations
  const ranges = {
    layerHeight: { min: 0.01, max: 2.0, label: "Layer height (mm)" },
    nozzleDiameter: { min: 0.1, max: 2.0, label: "Nozzle diameter (mm)" },
    infillDensity: { min: 0, max: 100, label: "Infill density (%)" },
    printSpeed: { min: 1, max: 600, label: "Print speed (mm/s)" },
    temperature: { min: 150, max: 500, label: "Nozzle temperature (C)" },
    bedTemperature: { min: 0, max: 200, label: "Bed temperature (C)" },
  };

  for (const [key, range] of Object.entries(ranges)) {
    const val = config[key];
    if (val !== undefined && val !== null && val !== "") {
      const num = Number(val);
      if (isNaN(num)) {
        errors.push(`${range.label} must be a number`);
      } else if (num < range.min || num > range.max) {
        errors.push(`${range.label} must be between ${range.min} and ${range.max}`);
      }
    }
  }

  // Material validation (optional but if present, must be a known type)
  const knownMaterials = ["PLA", "PETG", "ABS", "ASA", "TPU", "PA", "PC", "HIPS", "PVA", "PP", "OTHER"];
  if (config.material && !knownMaterials.includes(String(config.material).toUpperCase())) {
    errors.push(`Unknown material type: ${config.material}. Known: ${knownMaterials.join(", ")}`);
  }

  // Quality validation (optional)
  const knownQualities = ["draft", "quality", "fine", "ultra"];
  if (config.quality && !knownQualities.includes(String(config.quality).toLowerCase())) {
    errors.push(`Unknown quality level: ${config.quality}. Known: ${knownQualities.join(", ")}`);
  }

  return errors;
}

/**
 * Generate a PrusaSlicer INI string from a preset config object.
 *
 * @param {Object} config
 * @returns {string}
 */
function generateIniFromConfig(config) {
  const lines = [
    `# generated by ModelPricer preset builder`,
    `# preset: ${config.name || "unnamed"}`,
    `# date: ${new Date().toISOString()}`,
    ``,
  ];

  const mapping = {
    layerHeight: "layer_height",
    nozzleDiameter: "nozzle_diameter",
    infillDensity: "fill_density",
    printSpeed: "perimeter_speed",
    temperature: "temperature",
    bedTemperature: "bed_temperature",
    supports: "support_material",
    brim: "brim_width",
  };

  for (const [jsKey, iniKey] of Object.entries(mapping)) {
    const val = config[jsKey];
    if (val === undefined || val === null) continue;

    if (jsKey === "infillDensity") {
      lines.push(`${iniKey} = ${val}%`);
    } else if (jsKey === "supports") {
      lines.push(`${iniKey} = ${val ? "1" : "0"}`);
    } else if (jsKey === "brim") {
      lines.push(`brim_width = ${val ? "5" : "0"}`);
    } else {
      lines.push(`${iniKey} = ${val}`);
    }
  }

  return lines.join("\n") + "\n";
}


/**
 * Creates the presets router.
 *
 * @param {{ workspaceRoot: string, getTenantIdFromReq: (req) => string }} opts
 * @returns {Router}
 */
export function createPresetsRouter({ workspaceRoot, getTenantIdFromReq }) {
  const router = Router();

  // ── Multer for INI upload ──
  const presetUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const name = String(file.originalname || "").toLowerCase();
      if (!name.endsWith(".ini")) return cb(new Error("Only .ini files are allowed"));
      cb(null, true);
    },
  }).single("file");

  // ── Helper ──
  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message, details) {
    return res.status(status).json({ ok: false, errorCode, message, details });
  }

  // ───────────────────────────────────────────────────
  // GET /api/presets — List all presets for tenant
  // ───────────────────────────────────────────────────
  router.get("/", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const state = await listPresets(workspaceRoot, tenantId);
      return ok(res, state);
    } catch (e) {
      return fail(res, 500, "MP_PRESETS_LIST_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/presets/defaults — Get PrusaSlicer default presets
  // ───────────────────────────────────────────────────
  router.get("/defaults", (_req, res) => {
    return ok(res, { presets: PRUSASLICER_DEFAULTS });
  });

  // ───────────────────────────────────────────────────
  // GET /api/presets/:id — Get single preset details
  // ───────────────────────────────────────────────────
  router.get("/:id", validate(presetSchemas.byId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const presetId = String(req.params.id || "").trim();
      if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

      const state = await readPresetsState(workspaceRoot, tenantId);
      const preset = state.presets.find((p) => p.id === presetId);
      if (!preset) return fail(res, 404, "MP_NOT_FOUND", "Preset not found");

      // Check if INI file exists
      const iniPath = await getIniPathForPreset(workspaceRoot, tenantId, presetId);
      const hasIniFile = !!iniPath;

      return ok(res, {
        ...preset,
        hasIniFile,
        isDefault: state.defaultPresetId === presetId,
      });
    } catch (e) {
      return fail(res, 500, "MP_PRESET_GET_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/presets/:id/content — Get INI file content
  // ───────────────────────────────────────────────────
  router.get("/:id/content", validate(presetSchemas.byId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const presetId = String(req.params.id || "").trim();
      if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

      const iniPath = await getIniPathForPreset(workspaceRoot, tenantId, presetId);
      if (!iniPath) return fail(res, 404, "MP_NOT_FOUND", "INI file not found for this preset. The .ini file may not have been uploaded.");

      const content = await fs.readFile(iniPath, "utf8");
      return ok(res, { presetId, content });
    } catch (e) {
      return fail(res, 500, "MP_PRESET_CONTENT_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/presets — Create new preset (INI upload)
  // ───────────────────────────────────────────────────
  router.post("/", presetUpload, async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      if (!req.file?.buffer) {
        return fail(res, 400, "MP_BAD_REQUEST", "Missing multipart field 'file' (.ini)");
      }

      const meta = {
        name: req.body?.name,
        order: req.body?.order,
        visibleInWidget: req.body?.visibleInWidget,
      };

      const created = await createPresetFromIni(workspaceRoot, tenantId, req.file.buffer, meta);
      return ok(res, created.state);
    } catch (e) {
      return fail(res, 500, "MP_PRESET_UPLOAD_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/presets/validate — Validate preset config
  // ───────────────────────────────────────────────────
  router.post("/validate", validate(validatePresetSchema), async (req, res) => {
    try {
      const config = req.body || {};
      const errors = validatePresetConfig(config);

      if (errors.length > 0) {
        return ok(res, { valid: false, errors });
      }

      // Generate test INI to verify it can be created
      const iniContent = generateIniFromConfig(config);

      return ok(res, {
        valid: true,
        errors: [],
        generatedIni: iniContent,
        message: "Preset configuration is valid",
      });
    } catch (e) {
      return fail(res, 500, "MP_PRESET_VALIDATE_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // PATCH /api/presets/:id — Update preset metadata
  // ───────────────────────────────────────────────────
  router.patch("/:id", validate(presetSchemas.update), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const presetId = String(req.params.id || "").trim();
      if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

      const out = await updatePresetMeta(workspaceRoot, tenantId, presetId, req.body || {});
      if (!out.ok) return fail(res, 404, "MP_NOT_FOUND", out.error || "Preset not found");
      return ok(res, out.state);
    } catch (e) {
      return fail(res, 500, "MP_PRESET_PATCH_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // PUT /api/presets/:id — Full update preset (replace)
  // ───────────────────────────────────────────────────
  router.put("/:id", validate(presetSchemas.update), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const presetId = String(req.params.id || "").trim();
      if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

      const body = req.body || {};

      // Validate the config if print settings are provided
      if (body.layerHeight || body.temperature || body.printSpeed) {
        const errors = validatePresetConfig(body);
        if (errors.length > 0) {
          return fail(res, 400, "MP_VALIDATION_ERROR", "Invalid preset configuration", errors);
        }
      }

      // Update metadata
      const out = await updatePresetMeta(workspaceRoot, tenantId, presetId, body);
      if (!out.ok) return fail(res, 404, "MP_NOT_FOUND", out.error || "Preset not found");

      // If print settings were provided, regenerate the INI file
      if (body.layerHeight || body.temperature || body.printSpeed) {
        const iniContent = generateIniFromConfig(body);
        await ensureTenantPresetDirs(workspaceRoot, tenantId);
        const filesDir = getTenantPresetsFilesDir(workspaceRoot, tenantId);
        const iniPath = path.join(filesDir, `${presetId}.ini`);
        await fs.writeFile(iniPath, iniContent, "utf8");
      }

      return ok(res, out.state);
    } catch (e) {
      return fail(res, 500, "MP_PRESET_PUT_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/presets/:id/default — Set as default preset
  // ───────────────────────────────────────────────────
  router.post("/:id/default", validate(presetSchemas.byId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const presetId = String(req.params.id || "").trim();
      if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

      const out = await setDefaultPreset(workspaceRoot, tenantId, presetId);
      if (!out.ok) return fail(res, 404, "MP_NOT_FOUND", out.error || "Preset not found");
      return ok(res, out.state);
    } catch (e) {
      return fail(res, 500, "MP_PRESET_DEFAULT_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/presets/:id/duplicate — Duplicate a preset
  // ───────────────────────────────────────────────────
  router.post("/:id/duplicate", validate(duplicateSchema), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const presetId = String(req.params.id || "").trim();
      if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

      // Read existing preset
      const state = await readPresetsState(workspaceRoot, tenantId);
      const original = state.presets.find((p) => p.id === presetId);
      if (!original) return fail(res, 404, "MP_NOT_FOUND", "Source preset not found");

      // Read original INI file (if exists)
      const originalIniPath = await getIniPathForPreset(workspaceRoot, tenantId, presetId);
      let iniBuffer = null;
      if (originalIniPath) {
        try {
          iniBuffer = await fs.readFile(originalIniPath);
        } catch {
          // INI file missing — continue without it
        }
      }

      // Create new preset with copied metadata
      const newName = req.body?.name || `${original.name} (copy)`;
      const meta = {
        name: newName,
        order: original.order,
        visibleInWidget: original.visibleInWidget,
        material_key: original.material_key,
        print_overrides: original.print_overrides ? { ...original.print_overrides } : {},
      };

      if (iniBuffer) {
        const created = await createPresetFromIni(workspaceRoot, tenantId, iniBuffer, meta);
        return ok(res, { preset: created.preset, state: created.state });
      }

      // No INI file — create preset entry without file
      const newId = `p_${nanoid(16)}`;
      const newPreset = {
        id: newId,
        name: newName,
        order: meta.order || 0,
        visibleInWidget: meta.visibleInWidget || false,
        material_key: meta.material_key || null,
        print_overrides: meta.print_overrides || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      state.presets.push(newPreset);
      await writePresetsState(workspaceRoot, tenantId, state);

      return ok(res, { preset: newPreset, state });
    } catch (e) {
      return fail(res, 500, "MP_PRESET_DUPLICATE_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // DELETE /api/presets/:id — Delete preset (soft delete with cleanup)
  // ───────────────────────────────────────────────────
  router.delete("/:id", validate(presetSchemas.byId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const presetId = String(req.params.id || "").trim();
      if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

      const out = await deletePreset(workspaceRoot, tenantId, presetId);
      if (!out.ok) return fail(res, 500, "MP_PRESET_DELETE_FAILED", out.error || "Delete failed");
      if (!out.removed) return fail(res, 404, "MP_NOT_FOUND", "Preset not found");
      return ok(res, out.state);
    } catch (e) {
      return fail(res, 500, "MP_PRESET_DELETE_FAILED", String(e?.message || e));
    }
  });

  return router;
}

export default createPresetsRouter;
