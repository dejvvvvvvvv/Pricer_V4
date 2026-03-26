/**
 * Storage API client — Fetch wrapper for /api/storage/* endpoints.
 * Used by checkout flow, Model Storage page, and Orders modal.
 *
 * Supports both local filesystem (dev) and R2 signed URLs (production).
 * In production, VITE_API_BASE_URL points to the Cloud Run backend service.
 * In development, Vite proxy handles /api -> localhost:3001.
 */

import { getTenantId } from "../utils/adminTenantStorage";

/**
 * API base URL — empty string in dev (Vite proxy), full URL in production.
 * @type {string}
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const BASE = `${API_BASE}/api/storage`;

/**
 * Sanitize a file/folder path to prevent path traversal attacks.
 * Removes ".." segments, "." segments, null bytes, and backslashes.
 * @param {string} path
 * @returns {string}
 */
function sanitizePath(path) {
  if (!path) return '';
  return String(path)
    .replace(/\\/g, '/')
    .replace(/\0/g, '')
    .split('/')
    .filter(seg => seg !== '..' && seg !== '.')
    .join('/');
}

async function authHeaders(extra = {}) {
  const h = { "x-tenant-id": getTenantId(), ...extra };
  if (window.__authGetToken) {
    try {
      const token = await window.__authGetToken();
      if (token) h['Authorization'] = `Bearer ${token}`;
    } catch { /* continue without auth */ }
  }
  return h;
}

async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      res.status === 404
        ? "Storage backend not found. Is the backend server running on port 3001?"
        : `Unexpected response (${res.status}). Backend may not be running.`
    );
  }
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || data.errorCode || `HTTP ${res.status}`);
  }
  return data.data;
}

/**
 * Save order files to backend storage.
 * @param {object} orderData - Full order object + modelMapping
 * @param {File[]} modelFiles - Original File objects from upload
 * @returns {Promise<{orderFolderId, storagePath, files, timestamp}>}
 */
export async function saveOrderFiles(orderData, modelFiles) {
  const form = new FormData();
  form.append("orderData", JSON.stringify(orderData));

  for (const file of modelFiles || []) {
    form.append("models", file);
  }

  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });

  return handleResponse(res);
}

/**
 * Browse a folder's contents.
 * @param {string} folderPath - Relative path
 * @returns {Promise<{path, items}>}
 */
export async function browseFolder(folderPath = "") {
  folderPath = sanitizePath(folderPath);
  const params = new URLSearchParams();
  if (folderPath) params.set("path", folderPath);

  const res = await fetch(`${BASE}/browse?${params}`, { headers: await authHeaders() });
  return handleResponse(res);
}

/**
 * Download a file (returns a blob URL).
 * @param {string} filePath - Relative path
 * @returns {Promise<string>} Blob URL
 */
export async function downloadFile(filePath) {
  filePath = sanitizePath(filePath);
  const params = new URLSearchParams({ path: filePath });
  const res = await fetch(`${BASE}/file?${params}`, { headers: await authHeaders() });
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      throw new Error(data.message || `Download failed: ${res.status}`);
    }
    throw new Error(`Download failed: ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Get file preview as blob URL (tenant-scoped via auth headers).
 * Use this instead of plain URL to ensure tenant isolation.
 * @param {string} filePath - Relative path
 * @returns {Promise<string>} Blob URL
 */
export async function getPreviewBlob(filePath) {
  filePath = sanitizePath(filePath);
  const params = new URLSearchParams({ path: filePath });
  const res = await fetch(`${BASE}/file/preview?${params}`, { headers: await authHeaders() });
  if (!res.ok) {
    throw new Error(`Preview failed: ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Get file preview URL (plain URL without tenant headers).
 * WARNING: This URL does NOT include tenant auth headers.
 * Prefer getPreviewBlob() for tenant-isolated access.
 * Kept for backward compatibility only.
 * @param {string} filePath - Relative path
 * @returns {string} Preview URL
 * @deprecated Use getPreviewBlob() instead for tenant-safe access
 */
export function getPreviewUrl(filePath) {
  filePath = sanitizePath(filePath);
  const params = new URLSearchParams({ path: filePath });
  return `${BASE}/file/preview?${params}`;
}

/**
 * Get direct download URL (plain URL without tenant headers).
 * WARNING: This URL does NOT include tenant auth headers.
 * Prefer downloadFile() for tenant-isolated access.
 * Kept for backward compatibility only.
 * @param {string} filePath - Relative path
 * @returns {string} Download URL
 * @deprecated Use downloadFile() instead for tenant-safe access
 */
export function getDownloadUrl(filePath) {
  filePath = sanitizePath(filePath);
  const params = new URLSearchParams({ path: filePath });
  return `${BASE}/file?${params}`;
}

/**
 * Search files by name.
 * @param {string} query - Search term
 * @returns {Promise<Array>}
 */
export async function searchFiles(query) {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${BASE}/search?${params}`, { headers: await authHeaders() });
  return handleResponse(res);
}

/**
 * Create a ZIP archive of selected paths.
 * @param {string[]} paths - Array of relative paths
 * @returns {Promise<void>} Triggers browser download
 */
export async function createZip(paths) {
  const res = await fetch(`${BASE}/zip`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ paths }),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      throw new Error(`ZIP creation failed: ${res.status} - ${data.message || "Unknown error"}`);
    }
    const errorText = await res.text();
    throw new Error(`ZIP creation failed: ${res.status} - ${errorText}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `download-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Upload files to a target folder (Company Library).
 * @param {File[]} files
 * @param {string} targetPath
 * @returns {Promise<{uploaded: Array}>}
 */
export async function uploadFiles(files, targetPath = "CompanyLibrary") {
  targetPath = sanitizePath(targetPath) || "CompanyLibrary";
  const form = new FormData();
  form.append("targetPath", targetPath);
  for (const file of files) {
    form.append("files", file);
  }

  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });

  return handleResponse(res);
}

/**
 * Soft-delete a file or folder (move to trash).
 * @param {string} filePath - Relative path
 * @returns {Promise<{trashPath}>}
 */
export async function deleteFile(filePath) {
  filePath = sanitizePath(filePath);
  const res = await fetch(`${BASE}/file`, {
    method: "DELETE",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ path: filePath }),
  });
  return handleResponse(res);
}

/**
 * Restore a file from trash.
 * @param {string} trashPath - Trash item name
 * @returns {Promise<{restoredPath}>}
 */
export async function restoreFile(trashPath) {
  const res = await fetch(`${BASE}/restore`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ trashPath }),
  });
  return handleResponse(res);
}

/**
 * Permanently delete a single item from trash.
 * @param {string} trashPath - Trash item name
 * @returns {Promise<{deleted}>}
 */
export async function permanentDeleteTrashItem(trashPath) {
  const res = await fetch(`${BASE}/trash/item`, {
    method: "DELETE",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ trashPath }),
  });
  return handleResponse(res);
}

/**
 * Empty entire trash — permanently delete all trash items.
 * @returns {Promise<{deletedCount}>}
 */
export async function emptyTrash() {
  const res = await fetch(`${BASE}/trash/all`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return handleResponse(res);
}

/**
 * Auto-cleanup: permanently delete trash items older than maxAgeDays.
 * @param {number} maxAgeDays - Max age in days (default 20)
 * @returns {Promise<{deletedCount, deletedItems}>}
 */
export async function autoCleanupTrash(maxAgeDays = 20) {
  const res = await fetch(`${BASE}/trash/cleanup`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ maxAgeDays }),
  });
  return handleResponse(res);
}

/**
 * Create a new folder.
 * @param {string} folderPath - Relative path
 * @returns {Promise<{path}>}
 */
export async function createFolder(folderPath) {
  folderPath = sanitizePath(folderPath);
  const res = await fetch(`${BASE}/folder`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ path: folderPath }),
  });
  return handleResponse(res);
}

/**
 * Rename a file or folder.
 * @param {string} filePath - Current relative path
 * @param {string} newName - New name
 * @returns {Promise<{newPath}>}
 */
export async function renameItem(filePath, newName) {
  filePath = sanitizePath(filePath);
  const res = await fetch(`${BASE}/rename`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ path: filePath, newName }),
  });
  return handleResponse(res);
}

/**
 * Move a file or folder.
 * @param {string} filePath - Current path
 * @param {string} destination - Destination folder path
 * @returns {Promise<{newPath}>}
 */
export async function moveItem(filePath, destination) {
  filePath = sanitizePath(filePath);
  destination = sanitizePath(destination);
  const res = await fetch(`${BASE}/move`, {
    method: "POST",
    headers: await authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ path: filePath, destination }),
  });
  return handleResponse(res);
}

/**
 * Get storage statistics.
 * @returns {Promise<{totalFiles, totalFolders, totalSizeBytes, orderCount}>}
 */
export async function getStats() {
  const res = await fetch(`${BASE}/stats`, { headers: await authHeaders() });
  return handleResponse(res);
}

// ── Signed URL support (R2 / provider-agnostic) ────────────────────────

/**
 * Get a signed URL for direct download from R2 (or fallback filesystem URL).
 * Backend decides the URL format based on STORAGE_PROVIDER env var:
 *   - R2: returns a presigned S3/R2 URL valid for `expiresIn` seconds
 *   - Filesystem (dev): returns a relative /api/storage/file?path=... URL
 *
 * @param {string} filePath - Tenant-relative path (e.g. "orders/ORD-001/model.stl")
 * @returns {Promise<{ url: string, expiresAt: string }>}
 */
export async function getSignedDownloadUrl(filePath) {
  filePath = sanitizePath(filePath);
  const headers = await authHeaders();
  const params = new URLSearchParams({ path: filePath });
  const response = await fetch(`${BASE}/signed-url?${params}`, { headers });
  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.message || `Failed to get signed URL: ${response.status}`);
    }
    throw new Error(`Failed to get signed URL: ${response.status}`);
  }
  return response.json(); // { url, expiresAt }
}

/**
 * Get a signed URL for direct upload to R2 (future feature).
 * Enables client-side upload without proxying through the backend.
 *
 * Currently returns 501 Not Implemented from the backend.
 * Will be implemented when direct R2 upload is needed for large files.
 *
 * @param {string} filePath - Tenant-relative path
 * @param {string} contentType - MIME type (e.g. "model/stl", "application/octet-stream")
 * @returns {Promise<{ url: string, expiresAt: string }>}
 */
export async function getSignedUploadUrl(filePath, contentType) {
  filePath = sanitizePath(filePath);
  const headers = await authHeaders({ 'Content-Type': 'application/json' });
  const response = await fetch(`${BASE}/signed-upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ path: filePath, contentType }),
  });
  if (!response.ok) {
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await response.json();
      throw new Error(data.message || data.error || `Failed to get upload URL: ${response.status}`);
    }
    throw new Error(`Failed to get upload URL: ${response.status}`);
  }
  return response.json(); // { url, expiresAt }
}
