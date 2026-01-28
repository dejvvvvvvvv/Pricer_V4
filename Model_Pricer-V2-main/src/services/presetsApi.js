// src/services/presetsApi.js
// Unified API client for Presets (backend-local).
// Uses Vite proxy: /api -> http://127.0.0.1:3001

/**
 * @typedef {{ ok: true, data: any }} ApiOk
 * @typedef {{ ok: false, errorCode: string, message: string, status?: number, details?: any }} ApiErr
 * @typedef {ApiOk | ApiErr} ApiResult
 */

export function getTenantId() {
  // Keep consistent with /src/utils/adminTenantStorage.js
  try {
    return localStorage.getItem('modelpricer:tenant_id') || 'demo-tenant';
  } catch {
    return 'demo-tenant';
  }
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Fetch wrapper:
 * - Adds x-tenant-id header
 * - Normalizes errors
 * - Supports backend formats: {ok:false,errorCode,message} or {success:false,error|message}
 *
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<ApiResult>}
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('/') ? path : `/${path}`;
  const tenantId = getTenantId();

  const headers = new Headers(options.headers || {});
  headers.set('x-tenant-id', tenantId);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  // If we're sending JSON, ensure correct content-type.
  const body = options.body;
  if (body && typeof body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const text = await res.text();
    const json = tryJson(text);

    // Helper to pick message
    const pickMessage = () => {
      if (json && typeof json === 'object') {
        return (
          json.message ||
          json.error ||
          json.hint ||
          (typeof json === 'string' ? json : '')
        );
      }
      return text;
    };

    // If backend used our structured format
    if (json && typeof json === 'object' && json.ok === false) {
      return {
        ok: false,
        errorCode: String(json.errorCode || 'API_ERROR'),
        message: String(json.message || pickMessage() || 'Request failed'),
        status: res.status,
        details: json.details,
      };
    }

    // If HTTP status not ok
    if (!res.ok) {
      const errorCode =
        (json && typeof json === 'object' && (json.errorCode || json.code))
          ? String(json.errorCode || json.code)
          : `HTTP_${res.status}`;

      return {
        ok: false,
        errorCode,
        message: String(pickMessage() || 'Request failed'),
        status: res.status,
        details: json,
      };
    }

    // Some endpoints may return {success:false}
    if (json && typeof json === 'object' && json.success === false) {
      return {
        ok: false,
        errorCode: String(json.errorCode || 'API_ERROR'),
        message: String(json.message || json.error || 'Request failed'),
        status: res.status,
        details: json,
      };
    }

    // OK
    // backend-local uses: { ok:true, data: ... }
    if (json && typeof json === 'object' && json.ok === true && 'data' in json) {
      return { ok: true, data: json.data };
    }

    return { ok: true, data: json ?? text };
  } catch (e) {
    return {
      ok: false,
      errorCode: 'NETWORK_ERROR',
      message: 'Network error: backend unreachable',
      details: String(e?.message || e),
    };
  }
}

export async function listPresets() {
  return apiFetch('/api/presets', { method: 'GET' });
}

/**
 * Upload preset ini (multipart).
 * backend-local expects field name: "file".
 *
 * @param {File} file
 * @param {{ name?: string, order?: number, visibleInWidget?: boolean }} [meta]
 */
export async function uploadPreset(file, meta = {}) {
  if (!(file instanceof File)) {
    return { ok: false, errorCode: 'MP_BAD_REQUEST', message: 'uploadPreset: file must be a File' };
  }

  const form = new FormData();
  form.append('file', file);

  if (meta?.name != null) form.append('name', String(meta.name));
  if (meta?.order != null) form.append('order', String(meta.order));
  if (meta?.visibleInWidget != null) form.append('visibleInWidget', meta.visibleInWidget ? 'true' : 'false');

  return apiFetch('/api/presets', { method: 'POST', body: form });
}

/**
 * @param {string} id
 * @param {{ name?: string, order?: number, visibleInWidget?: boolean }} patch
 */
export async function patchPreset(id, patch) {
  if (!id) return { ok: false, errorCode: 'MP_BAD_REQUEST', message: 'Missing preset id' };
  return apiFetch(`/api/presets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch || {}),
  });
}

export async function deletePreset(id) {
  if (!id) return { ok: false, errorCode: 'MP_BAD_REQUEST', message: 'Missing preset id' };
  return apiFetch(`/api/presets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function setDefaultPreset(id) {
  if (!id) return { ok: false, errorCode: 'MP_BAD_REQUEST', message: 'Missing preset id' };
  return apiFetch(`/api/presets/${encodeURIComponent(id)}/default`, { method: 'POST' });
}

export async function fetchWidgetPresets() {
  return apiFetch('/api/widget/presets', { method: 'GET' });
}
