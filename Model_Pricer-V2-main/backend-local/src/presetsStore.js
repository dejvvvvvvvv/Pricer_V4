import path from "node:path";
import fs from "node:fs/promises";
import { nanoid } from "nanoid";

// Simple local store for presets (per-tenant) used by backend-local.
// NOTE: This is a work-in-progress store (CP2 NEDOKONCENO). Endpoints will use it.
// Layout:
//   <workspaceRoot>/presets/<tenantId>/presets.json
//   <workspaceRoot>/presets/<tenantId>/files/<presetId>.ini

export function getTenantPresetsDir(workspaceRoot, tenantId) {
  return path.join(workspaceRoot, "presets", sanitizeTenantId(tenantId));
}

export function getTenantPresetsFilesDir(workspaceRoot, tenantId) {
  return path.join(getTenantPresetsDir(workspaceRoot, tenantId), "files");
}

export async function ensureTenantPresetDirs(workspaceRoot, tenantId) {
  const dir = getTenantPresetsDir(workspaceRoot, tenantId);
  const filesDir = getTenantPresetsFilesDir(workspaceRoot, tenantId);
  await fs.mkdir(filesDir, { recursive: true });
  return { dir, filesDir };
}

export async function readPresetsState(workspaceRoot, tenantId) {
  const dir = getTenantPresetsDir(workspaceRoot, tenantId);
  const statePath = path.join(dir, "presets.json");
  try {
    const raw = await fs.readFile(statePath, "utf8");
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return { presets: [], defaultPresetId: null };
  }
}

export async function writePresetsState(workspaceRoot, tenantId, state) {
  const dir = getTenantPresetsDir(workspaceRoot, tenantId);
  const statePath = path.join(dir, "presets.json");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(normalizeState(state), null, 2), "utf8");
}

export async function listPresets(workspaceRoot, tenantId) {
  const state = await readPresetsState(workspaceRoot, tenantId);
  return state;
}

export async function createPresetFromIni(workspaceRoot, tenantId, iniBufferOrString, meta) {
  await ensureTenantPresetDirs(workspaceRoot, tenantId);
  const state = await readPresetsState(workspaceRoot, tenantId);

  const id = meta?.id || `p_${nanoid(16)}`;
  const name = String(meta?.name || "Preset").trim() || "Preset";
  const order = Number.isFinite(Number(meta?.order)) ? Number(meta.order) : 0;
  const visibleInWidget = Boolean(meta?.visibleInWidget);

  const filesDir = getTenantPresetsFilesDir(workspaceRoot, tenantId);
  const iniPath = path.join(filesDir, `${id}.ini`);
  const content = Buffer.isBuffer(iniBufferOrString) ? iniBufferOrString : Buffer.from(String(iniBufferOrString || ""), "utf8");
  await fs.writeFile(iniPath, content);

  const preset = { id, name, order, visibleInWidget, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  state.presets = [...state.presets.filter((p) => p.id !== id), preset];
  // If this is the first preset, make it default
  if (!state.defaultPresetId) state.defaultPresetId = id;
  await writePresetsState(workspaceRoot, tenantId, state);

  return { preset, state };
}

export async function updatePresetMeta(workspaceRoot, tenantId, presetId, patch) {
  const state = await readPresetsState(workspaceRoot, tenantId);
  const idx = state.presets.findIndex((p) => p.id === presetId);
  if (idx === -1) return { ok: false, error: "Preset not found" };

  const prev = state.presets[idx];
  const next = {
    ...prev,
    name: patch?.name != null ? String(patch.name) : prev.name,
    order: patch?.order != null ? Number(patch.order) : prev.order,
    visibleInWidget: patch?.visibleInWidget != null ? Boolean(patch.visibleInWidget) : prev.visibleInWidget,
    updatedAt: new Date().toISOString()
  };

  state.presets[idx] = next;
  await writePresetsState(workspaceRoot, tenantId, state);
  return { ok: true, preset: next, state };
}

export async function setDefaultPreset(workspaceRoot, tenantId, presetId) {
  const state = await readPresetsState(workspaceRoot, tenantId);
  const exists = state.presets.some((p) => p.id === presetId);
  if (!exists) return { ok: false, error: "Preset not found" };
  state.defaultPresetId = presetId;
  await writePresetsState(workspaceRoot, tenantId, state);
  return { ok: true, state };
}

export async function deletePreset(workspaceRoot, tenantId, presetId) {
  const state = await readPresetsState(workspaceRoot, tenantId);
  const before = state.presets.length;
  state.presets = state.presets.filter((p) => p.id !== presetId);

  // If default deleted -> pick highest order (desc), else null
  if (state.defaultPresetId === presetId) {
    const next = [...state.presets].sort((a, b) => (b.order ?? 0) - (a.order ?? 0))[0];
    state.defaultPresetId = next?.id || null;
  }

  await writePresetsState(workspaceRoot, tenantId, state);

  // try delete ini file
  try {
    const filesDir = getTenantPresetsFilesDir(workspaceRoot, tenantId);
    await fs.unlink(path.join(filesDir, `${presetId}.ini`));
  } catch {}

  return { ok: true, removed: before - state.presets.length, state };
}

export async function getIniPathForPreset(workspaceRoot, tenantId, presetId) {
  const filesDir = getTenantPresetsFilesDir(workspaceRoot, tenantId);
  const iniPath = path.join(filesDir, `${presetId}.ini`);
  try {
    await fs.access(iniPath);
    return iniPath;
  } catch {
    return "";
  }
}

function sanitizeTenantId(v) {
  const s = String(v || "").trim() || "demo-tenant";
  return s.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeState(s) {
  const presets = Array.isArray(s?.presets) ? s.presets : [];
  return {
    presets: presets
      .map((p) => ({
        id: String(p?.id || ""),
        name: String(p?.name || "Preset"),
        order: Number.isFinite(Number(p?.order)) ? Number(p.order) : 0,
        visibleInWidget: Boolean(p?.visibleInWidget),
        createdAt: p?.createdAt || undefined,
        updatedAt: p?.updatedAt || undefined
      }))
      .filter((p) => p.id),
    defaultPresetId: s?.defaultPresetId ? String(s.defaultPresetId) : null
  };
}
