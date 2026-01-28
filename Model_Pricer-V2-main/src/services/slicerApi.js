// src/services/slicerApi.js
// Local API client for backend-local (Express + PrusaSlicer CLI).
// Uses Vite proxy: /api -> http://127.0.0.1:3001

import { getTenantId } from '../utils/adminTenantStorage';

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
 * @param {{ timeoutMs?: number, presetId?: string | null, tenantId?: string }} [opts]
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

    const tenantId = typeof opts.tenantId === 'string' && opts.tenantId.trim()
      ? opts.tenantId.trim()
      : getTenantId();

    const res = await fetch('/api/slice', {
      method: 'POST',
      body: formData,
      headers: {
        'x-tenant-id': tenantId,
      },
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

    return json;
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
