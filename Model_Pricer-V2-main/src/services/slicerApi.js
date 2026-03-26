// src/services/slicerApi.js
// Local API client for backend-local (Express + PrusaSlicer CLI).
// In development, Vite proxy handles /api -> localhost:3001.
// In production, VITE_API_BASE_URL points to the Cloud Run backend service.

import { getTenantId } from '../utils/adminTenantStorage';

/**
 * API base URL — empty string in dev (Vite proxy), full URL in production.
 * @type {string}
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * @typedef {{
 *  jobId?: string,
 *  jobDir?: string,
 *  outGcodePath?: string,
 *  metrics?: {
 *    estimatedTimeSeconds?: number,
 *    filamentGrams?: number,
 *    filamentMm?: number,
 *  },
 *  modelInfo?: {
 *    sizeMm?: { x?: number, y?: number, z?: number },
 *    volumeMm3?: number,
 *  },
 *  ok?: boolean,
 *  success?: boolean,
 *  error?: string,
 *  message?: string,
 * }} SliceResponse
 */

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Sends STL/OBJ/3MF to backend-local for slicing.
 * Endpoint: POST /api/slice (multipart/form-data)
 * Field name: "model"
 *
 * @param {File} modelFile
 * @param {{ timeoutMs?: number, presetId?: string | null, tenantId?: string, quaternion?: { x: number, y: number, z: number, w: number } | null }} [opts]
 * @returns {Promise<SliceResponse>}
 */
export async function sliceModelLocal(modelFile, opts = {}) {
  if (!(modelFile instanceof File)) {
    throw new Error('sliceModelLocal: modelFile must be a File');
  }

  const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : 120_000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const formData = new FormData();
    formData.append('model', modelFile);

    const presetId = typeof opts.presetId === 'string' && opts.presetId.trim() ? opts.presetId.trim() : null;
    if (presetId) {
      // Backend expects presetId (optional). If not provided, backend uses default profile.
      formData.append('presetId', presetId);
    }

    // Auto-orient quaternion — only send if it represents a non-identity rotation
    const quat = opts.quaternion;
    if (quat && (quat.x !== 0 || quat.y !== 0 || quat.z !== 0)) {
      formData.append('quaternion_x', String(quat.x));
      formData.append('quaternion_y', String(quat.y));
      formData.append('quaternion_z', String(quat.z));
      formData.append('quaternion_w', String(quat.w));
    }

    const tenantId = typeof opts.tenantId === 'string' && opts.tenantId.trim()
      ? opts.tenantId.trim()
      : getTenantId();

    const headers = { 'x-tenant-id': tenantId };
    if (window.__authGetToken) {
      try {
        const token = await window.__authGetToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch { /* continue without auth */ }
    }

    const res = await fetch(`${API_BASE}/api/slice`, {
      method: 'POST',
      body: formData,
      headers,
      signal: controller.signal,
    });

    const text = await res.text();
    const json = tryJson(text);

    if (!res.ok) {
      const msg = (json && (json.error || json.message)) ? (json.error || json.message) : text;
      throw new Error(`Backend error (${res.status}): ${String(msg).slice(0, 500)}`);
    }

    if (!json) {
      throw new Error('Backend returned non-JSON response');
    }

    return json?.data ?? json;
  } catch (err) {
    // Normalize AbortError message
    if (err?.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs} ms`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
