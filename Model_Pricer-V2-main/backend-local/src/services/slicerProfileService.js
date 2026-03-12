/**
 * slicerProfileService.js — Service layer for managing slicer profiles/presets.
 *
 * Pure service — NO Express dependency (no req/res/next).
 * Lists available profiles from the profiles directory and validates them.
 *
 * @module services/slicerProfileService
 */

import fs from "node:fs/promises";
import path from "node:path";

/**
 * Required INI keys for a valid PrusaSlicer profile.
 * A profile missing any of these is considered invalid.
 */
const REQUIRED_KEYS = [
  "layer_height",
  "nozzle_diameter",
];

/**
 * Recommended INI keys — not required but flagged as warnings if missing.
 */
const RECOMMENDED_KEYS = [
  "fill_density",
  "perimeters",
  "temperature",
  "bed_temperature",
  "support_material",
];

/**
 * Parse a simple INI file content into a flat key-value map.
 * Ignores sections headers, comments, and empty lines.
 *
 * @param {string} content - Raw INI file content
 * @returns {Map<string, string>} Key-value pairs
 */
function parseIniFlat(content) {
  const result = new Map();
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments, section headers, empty lines
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";") || trimmed.startsWith("[")) {
      continue;
    }
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      result.set(key, value);
    }
  }

  return result;
}

/**
 * List available slicer profiles from a tenant's presets files directory.
 *
 * @param {string} workspaceRoot - Workspace root path
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<{ profiles: Array<{ name: string, filename: string, sizeBytes: number, modifiedAt: string }> }>}
 */
export async function listSlicerProfiles(workspaceRoot, tenantId) {
  const filesDir = path.join(workspaceRoot, "presets", sanitizeTenantId(tenantId), "files");

  let entries;
  try {
    entries = await fs.readdir(filesDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      return { profiles: [] };
    }
    throw err;
  }

  const profiles = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ini")) {
      continue;
    }

    const fullPath = path.join(filesDir, entry.name);
    let stat;
    try {
      stat = await fs.stat(fullPath);
    } catch {
      continue;
    }

    profiles.push({
      name: entry.name.replace(/\.ini$/, ""),
      filename: entry.name,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    });
  }

  // Sort by name
  profiles.sort((a, b) => a.name.localeCompare(b.name));

  return { profiles };
}

/**
 * Validate a slicer profile (INI file) for required keys and common issues.
 *
 * @param {string} workspaceRoot - Workspace root path
 * @param {string} tenantId - Tenant ID
 * @param {string} profileName - Profile name (without .ini extension)
 * @returns {Promise<{ valid: boolean, errors: string[], warnings: string[], keyCount: number, keys: string[] }>}
 */
export async function validateSlicerProfile(workspaceRoot, tenantId, profileName) {
  const safeName = profileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = safeName.endsWith(".ini") ? safeName : `${safeName}.ini`;
  const filesDir = path.join(workspaceRoot, "presets", sanitizeTenantId(tenantId), "files");
  const filePath = path.join(filesDir, filename);

  let content;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      return {
        valid: false,
        errors: [`Profile "${profileName}" not found.`],
        warnings: [],
        keyCount: 0,
        keys: [],
      };
    }
    throw err;
  }

  const parsed = parseIniFlat(content);
  const errors = [];
  const warnings = [];

  // Check required keys
  for (const key of REQUIRED_KEYS) {
    if (!parsed.has(key)) {
      errors.push(`Missing required key: ${key}`);
    }
  }

  // Check recommended keys
  for (const key of RECOMMENDED_KEYS) {
    if (!parsed.has(key)) {
      warnings.push(`Missing recommended key: ${key}`);
    }
  }

  // Validate layer_height is a reasonable number
  if (parsed.has("layer_height")) {
    const lh = parseFloat(parsed.get("layer_height"));
    if (isNaN(lh) || lh <= 0 || lh > 1.0) {
      errors.push(`Invalid layer_height value: "${parsed.get("layer_height")}" (expected 0.01-1.0 mm)`);
    }
  }

  // Validate nozzle_diameter is a reasonable number
  if (parsed.has("nozzle_diameter")) {
    const nd = parseFloat(parsed.get("nozzle_diameter"));
    if (isNaN(nd) || nd <= 0 || nd > 2.0) {
      errors.push(`Invalid nozzle_diameter value: "${parsed.get("nozzle_diameter")}" (expected 0.1-2.0 mm)`);
    }
  }

  // Check for empty file
  if (parsed.size === 0) {
    errors.push("Profile file is empty or contains no valid key=value pairs.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    keyCount: parsed.size,
    keys: [...parsed.keys()],
  };
}

/**
 * @param {string} v
 * @returns {string}
 */
function sanitizeTenantId(v) {
  const s = String(v || "").trim() || "demo-tenant";
  return s.replace(/[^a-zA-Z0-9._-]/g, "_");
}
