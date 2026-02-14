/**
 * Storage API client — Fetch wrapper for /api/storage/* endpoints.
 * Used by checkout flow, Model Storage page, and Orders modal.
 */

import { getTenantId } from "../utils/adminTenantStorage";

const BASE = "/api/storage";

function tenantHeaders() {
  return { "x-tenant-id": getTenantId() };
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
    headers: { "x-tenant-id": getTenantId() },
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
  const params = new URLSearchParams();
  if (folderPath) params.set("path", folderPath);

  const res = await fetch(`${BASE}/browse?${params}`, { headers: tenantHeaders() });
  return handleResponse(res);
}

/**
 * Download a file (returns a blob URL).
 * @param {string} filePath - Relative path
 * @returns {Promise<string>} Blob URL
 */
export async function downloadFile(filePath) {
  const params = new URLSearchParams({ path: filePath });
  const res = await fetch(`${BASE}/file?${params}`, { headers: tenantHeaders() });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/**
 * Get file preview URL.
 * @param {string} filePath - Relative path
 * @returns {string} Preview URL
 */
export function getPreviewUrl(filePath) {
  const params = new URLSearchParams({ path: filePath });
  return `${BASE}/file/preview?${params}`;
}

/**
 * Get direct download URL.
 * @param {string} filePath - Relative path
 * @returns {string} Download URL
 */
export function getDownloadUrl(filePath) {
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
  const res = await fetch(`${BASE}/search?${params}`, { headers: tenantHeaders() });
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
    headers: { ...tenantHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ paths }),
  });

  if (!res.ok) throw new Error(`ZIP failed: ${res.status}`);
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
  const form = new FormData();
  form.append("targetPath", targetPath);
  for (const file of files) {
    form.append("files", file);
  }

  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    headers: { "x-tenant-id": getTenantId() },
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
  const res = await fetch(`${BASE}/file`, {
    method: "DELETE",
    headers: { ...tenantHeaders(), "Content-Type": "application/json" },
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
    headers: { ...tenantHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ trashPath }),
  });
  return handleResponse(res);
}

/**
 * Create a new folder.
 * @param {string} folderPath - Relative path
 * @returns {Promise<{path}>}
 */
export async function createFolder(folderPath) {
  const res = await fetch(`${BASE}/folder`, {
    method: "POST",
    headers: { ...tenantHeaders(), "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE}/rename`, {
    method: "POST",
    headers: { ...tenantHeaders(), "Content-Type": "application/json" },
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
  const res = await fetch(`${BASE}/move`, {
    method: "POST",
    headers: { ...tenantHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath, destination }),
  });
  return handleResponse(res);
}

/**
 * Get storage statistics.
 * @returns {Promise<{totalFiles, totalFolders, totalSizeBytes, orderCount}>}
 */
export async function getStats() {
  const res = await fetch(`${BASE}/stats`, { headers: tenantHeaders() });
  return handleResponse(res);
}
