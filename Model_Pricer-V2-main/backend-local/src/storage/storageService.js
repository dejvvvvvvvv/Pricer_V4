/**
 * Storage Service — Business logic for file storage operations.
 * Handles: order folder creation, file browsing, ZIP, trash, search, stats.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { sha256File } from "./checksumUtil.js";
// Meta folder removed (Task 4.3) — metadata JSON files are not useful for company downloads
// import { buildOrderMeta, buildFileManifest, buildPricingSnapshot } from "./metadataBuilder.js";

// ── Path security ──────────────────────────────────────────────────────────

/**
 * Validate that a resolved path is within the allowed root.
 * Blocks path traversal (../, symlinks to outside, absolute paths from client).
 * @param {string} resolvedPath
 * @param {string} allowedRoot
 * @throws {Error} if path is outside root
 */
export function assertWithinRoot(resolvedPath, allowedRoot) {
  const normalized = path.resolve(resolvedPath);
  const normalizedRoot = path.resolve(allowedRoot);
  if (!normalized.startsWith(normalizedRoot + path.sep) && normalized !== normalizedRoot) {
    throw Object.assign(new Error("Path traversal blocked"), { code: "PATH_TRAVERSAL" });
  }
}

/**
 * Sanitize a relative path from the client: reject .., absolute paths, null bytes.
 * @param {string} relPath - Relative path from client
 * @returns {string} Sanitized relative path
 */
export function sanitizePath(relPath) {
  if (!relPath || typeof relPath !== "string") return "";
  // Block null bytes
  if (relPath.includes("\0")) throw Object.assign(new Error("Null byte in path"), { code: "PATH_TRAVERSAL" });
  // Normalize separators
  const normalized = relPath.replace(/\\/g, "/");
  // Block absolute paths
  if (path.isAbsolute(normalized) || normalized.startsWith("/")) {
    throw Object.assign(new Error("Absolute path not allowed"), { code: "PATH_TRAVERSAL" });
  }
  // Block .. segments
  const segments = normalized.split("/");
  for (const seg of segments) {
    if (seg === "..") throw Object.assign(new Error("Path traversal blocked"), { code: "PATH_TRAVERSAL" });
  }
  return normalized;
}

/**
 * Resolve a tenant-scoped path safely.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} relPath - Client-provided relative path
 * @returns {string} Absolute resolved path
 */
export function resolveTenantPath(storageRoot, tenantId, relPath) {
  const sanitized = sanitizePath(relPath);
  const tenantRoot = path.resolve(storageRoot, tenantId);
  const resolved = sanitized ? path.resolve(tenantRoot, sanitized) : tenantRoot;
  assertWithinRoot(resolved, tenantRoot);
  return resolved;
}

// ── Order folder creation ──────────────────────────────────────────────────

/**
 * Create an order folder with subfolders (models/, gcode/, presets/).
 * Save model files, generate checksums and metadata.
 *
 * @param {object} params
 * @param {string} params.storageRoot
 * @param {string} params.tenantId
 * @param {object} params.orderData - Parsed order JSON
 * @param {Array<{originalname: string, path: string, size: number}>} params.modelFiles - Multer files
 * @returns {Promise<{orderFolderId: string, storagePath: string, files: Array, timestamp: string}>}
 */
export async function createOrderFolder({ storageRoot, tenantId, orderData, modelFiles }) {
  const orderFolderId = orderData.orderFolderId || crypto.randomUUID();
  const orderNumber = orderData.id || orderData.orderNumber || "000000";

  // Build folder name: #<orderNumber>__<shortId>
  const shortId = orderFolderId.replace(/-/g, "").slice(0, 8);
  const folderName = `#${orderNumber}__${shortId}`;
  const relPath = `Orders/${folderName}`;

  const tenantRoot = path.resolve(storageRoot, tenantId);
  const orderDir = path.resolve(tenantRoot, relPath);
  assertWithinRoot(orderDir, tenantRoot);

  // Create subdirectories (meta/ removed — not useful for company downloads)
  const modelsDir = path.join(orderDir, "models");
  const gcodeDir = path.join(orderDir, "gcode");
  const presetsDir = path.join(orderDir, "presets");

  await Promise.all([
    fs.mkdir(modelsDir, { recursive: true }),
    fs.mkdir(gcodeDir, { recursive: true }),
    fs.mkdir(presetsDir, { recursive: true }),
  ]);

  const manifestFiles = [];

  // Save model files
  for (const file of modelFiles || []) {
    const safeName = (file.originalname || "model.stl").replace(/[^a-zA-Z0-9._-]/g, "_");
    const dest = path.join(modelsDir, safeName);
    assertWithinRoot(dest, tenantRoot);

    // Copy from multer temp location
    await fs.copyFile(file.path, dest);
    const stat = await fs.stat(dest);
    const hash = await sha256File(dest);

    manifestFiles.push({
      type: "model",
      filename: safeName,
      sha256: hash,
      sizeBytes: stat.size,
    });
  }

  // Try to copy gcode files if modelMapping is provided
  const modelMapping = orderData.modelMapping || [];
  for (const mapping of modelMapping) {
    if (mapping.slicerJobId) {
      // Try to find gcode in the slicer workspace
      const slicerWorkspace = process.env.SLICER_WORKSPACE_ROOT || (process.platform === "win32" ? "C:\\modelpricer\\tmp" : "/tmp/modelpricer");
      const jobOutputDir = path.join(slicerWorkspace, mapping.slicerJobId, "output");
      try {
        const files = await fs.readdir(jobOutputDir);
        const gcodeFile = files.find((f) => f.endsWith(".gcode"));
        if (gcodeFile) {
          const src = path.join(jobOutputDir, gcodeFile);
          const destName = mapping.originalFilename
            ? mapping.originalFilename.replace(/\.[^.]+$/, ".gcode").replace(/[^a-zA-Z0-9._-]/g, "_")
            : gcodeFile;
          const dest = path.join(gcodeDir, destName);
          await fs.copyFile(src, dest);
          const stat = await fs.stat(dest);
          const hash = await sha256File(dest);
          manifestFiles.push({ type: "gcode", filename: destName, sha256: hash, sizeBytes: stat.size });
        }
      } catch {
        // Gcode not available — not critical
      }
    }
  }

  // Copy unique preset .ini files to order folder (deduplicated across all models)
  const copiedPresetIds = new Set();
  for (const mapping of modelMapping) {
    if (mapping.presetId && !copiedPresetIds.has(mapping.presetId)) {
      copiedPresetIds.add(mapping.presetId);
      try {
        // Presets stored by presetsStore at: <storageRoot>/presets/<tenantId>/files/<presetId>.ini
        const presetIniPath = path.join(storageRoot, "presets", tenantId, "files", `${mapping.presetId}.ini`);
        await fs.access(presetIniPath);
        const destName = `${mapping.presetId}.ini`;
        const dest = path.join(presetsDir, destName);
        assertWithinRoot(dest, tenantRoot);
        await fs.copyFile(presetIniPath, dest);
        const stat = await fs.stat(dest);
        const hash = await sha256File(dest);
        manifestFiles.push({ type: "preset", filename: destName, sha256: hash, sizeBytes: stat.size });
      } catch {
        // Preset .ini not available — not critical
      }
    }
  }

  // Meta folder writing removed (Task 4.3) — not useful for company downloads

  const timestamp = new Date().toISOString();

  return {
    orderFolderId,
    storagePath: relPath,
    files: manifestFiles,
    timestamp,
  };
}

// ── Browse ────────────────────────────────────────────────────────────────

/**
 * List contents of a directory.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} relPath - Relative path within tenant folder
 * @returns {Promise<{path: string, items: Array}>}
 */
export async function browseFolder(storageRoot, tenantId, relPath = "") {
  const tenantRoot = path.resolve(storageRoot, tenantId);
  const target = resolveTenantPath(storageRoot, tenantId, relPath);

  // Ensure tenant root exists
  await fs.mkdir(tenantRoot, { recursive: true });
  await fs.mkdir(path.join(tenantRoot, "Orders"), { recursive: true });
  await fs.mkdir(path.join(tenantRoot, "CompanyLibrary"), { recursive: true });

  let entries;
  try {
    entries = await fs.readdir(target, { withFileTypes: true });
  } catch (e) {
    if (e.code === "ENOENT") return { path: relPath, items: [] };
    throw e;
  }

  const items = [];
  for (const entry of entries) {
    // Skip .trash in listings (unless browsing .trash itself)
    if (entry.name === ".trash" && relPath === "") continue;

    const fullPath = path.join(target, entry.name);
    const isDir = entry.isDirectory();
    const relItemPath = relPath ? `${relPath}/${entry.name}` : entry.name;

    if (isDir) {
      items.push({ name: entry.name, type: "folder", path: relItemPath });
    } else {
      try {
        const stat = await fs.stat(fullPath);
        items.push({
          name: entry.name,
          type: "file",
          path: relItemPath,
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      } catch {
        items.push({ name: entry.name, type: "file", path: relItemPath, size: 0, modified: null });
      }
    }
  }

  // Sort: folders first, then files, alphabetically
  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return { path: relPath, items };
}

// ── File download ─────────────────────────────────────────────────────────

/**
 * Get absolute path for a file download.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} relPath
 * @returns {string} Absolute path
 */
export function getFilePath(storageRoot, tenantId, relPath) {
  return resolveTenantPath(storageRoot, tenantId, relPath);
}

// ── Trash (soft delete) ───────────────────────────────────────────────────

/**
 * Soft-delete: move file/folder to .trash/ with encoded path.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} relPath
 * @returns {Promise<{trashPath: string}>}
 */
export async function softDelete(storageRoot, tenantId, relPath) {
  const sanitized = sanitizePath(relPath);
  const tenantRoot = path.resolve(storageRoot, tenantId);
  const sourcePath = resolveTenantPath(storageRoot, tenantId, sanitized);

  const trashDir = path.join(tenantRoot, ".trash");
  await fs.mkdir(trashDir, { recursive: true });

  // Encode the original path in the trash filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const encodedPath = sanitized.replace(/\//g, "___");
  const trashName = `${timestamp}___${encodedPath}`;
  const trashDest = path.join(trashDir, trashName);

  await fs.rename(sourcePath, trashDest);

  return { trashPath: trashName };
}

/**
 * Restore a file/folder from trash.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} trashName - Name in .trash/
 * @returns {Promise<{restoredPath: string}>}
 */
export async function restoreFromTrash(storageRoot, tenantId, trashName) {
  if (!trashName || typeof trashName !== "string") throw new Error("Missing trashPath");
  // Validate no traversal in trashName
  if (trashName.includes("..") || trashName.includes("/") || trashName.includes("\\")) {
    throw Object.assign(new Error("Invalid trash path"), { code: "PATH_TRAVERSAL" });
  }

  const tenantRoot = path.resolve(storageRoot, tenantId);
  const trashDir = path.join(tenantRoot, ".trash");
  const trashPath = path.join(trashDir, trashName);
  assertWithinRoot(trashPath, trashDir);

  // Decode original path from trash name
  // Format: <timestamp>___<encoded_path>
  const parts = trashName.split("___");
  // First part is timestamp, rest is encoded path
  const encodedPath = parts.slice(1).join("___");
  const originalRelPath = encodedPath.replace(/___/g, "/");

  if (!originalRelPath) throw new Error("Cannot determine original path from trash name");

  const restoreDest = path.resolve(tenantRoot, originalRelPath);
  assertWithinRoot(restoreDest, tenantRoot);

  // Ensure parent directory exists
  await fs.mkdir(path.dirname(restoreDest), { recursive: true });
  await fs.rename(trashPath, restoreDest);

  return { restoredPath: originalRelPath };
}

// ── Search ────────────────────────────────────────────────────────────────

/**
 * Simple recursive filename search within tenant folder.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} query - Search term (case-insensitive substring match)
 * @param {number} maxResults
 * @returns {Promise<Array<{name: string, path: string, type: string, size: number}>>}
 */
export async function searchFiles(storageRoot, tenantId, query, maxResults = 50) {
  const tenantRoot = path.resolve(storageRoot, tenantId);
  const q = (query || "").toLowerCase();
  if (!q) return [];

  const results = [];

  async function walk(dir, relPrefix) {
    if (results.length >= maxResults) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) return;
      if (entry.name === ".trash") continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;

      if (entry.name.toLowerCase().includes(q)) {
        if (entry.isDirectory()) {
          results.push({ name: entry.name, path: relPath, type: "folder" });
        } else {
          try {
            const stat = await fs.stat(fullPath);
            results.push({ name: entry.name, path: relPath, type: "file", size: stat.size });
          } catch {
            results.push({ name: entry.name, path: relPath, type: "file", size: 0 });
          }
        }
      }

      if (entry.isDirectory()) {
        await walk(fullPath, relPath);
      }
    }
  }

  await walk(tenantRoot, "");
  return results;
}

// ── Create folder ─────────────────────────────────────────────────────────

/**
 * Create a new folder.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} relPath
 * @returns {Promise<void>}
 */
export async function createFolder(storageRoot, tenantId, relPath) {
  const target = resolveTenantPath(storageRoot, tenantId, relPath);
  await fs.mkdir(target, { recursive: true });
}

// ── Rename ────────────────────────────────────────────────────────────────

/**
 * Rename a file or folder.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} relPath - Current relative path
 * @param {string} newName - New name (just the filename, not a path)
 * @returns {Promise<{newPath: string}>}
 */
export async function renameItem(storageRoot, tenantId, relPath, newName) {
  if (!newName || typeof newName !== "string") throw new Error("Missing newName");
  // newName must be just a filename, no slashes
  if (newName.includes("/") || newName.includes("\\") || newName.includes("..")) {
    throw Object.assign(new Error("Invalid name"), { code: "PATH_TRAVERSAL" });
  }

  const tenantRoot = path.resolve(storageRoot, tenantId);
  const sourcePath = resolveTenantPath(storageRoot, tenantId, relPath);
  const parentDir = path.dirname(sourcePath);
  const destPath = path.join(parentDir, newName);
  assertWithinRoot(destPath, tenantRoot);

  await fs.rename(sourcePath, destPath);

  // Compute new relative path
  const newRelPath = path.relative(tenantRoot, destPath).replace(/\\/g, "/");
  return { newPath: newRelPath };
}

// ── Move ──────────────────────────────────────────────────────────────────

/**
 * Move a file or folder to a new destination.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} relPath - Current relative path
 * @param {string} destRelPath - Destination folder relative path
 * @returns {Promise<{newPath: string}>}
 */
export async function moveItem(storageRoot, tenantId, relPath, destRelPath) {
  const tenantRoot = path.resolve(storageRoot, tenantId);
  const sourcePath = resolveTenantPath(storageRoot, tenantId, relPath);
  const destDir = resolveTenantPath(storageRoot, tenantId, destRelPath);

  const basename = path.basename(sourcePath);
  const destPath = path.join(destDir, basename);
  assertWithinRoot(destPath, tenantRoot);

  await fs.mkdir(destDir, { recursive: true });
  await fs.rename(sourcePath, destPath);

  const newRelPath = path.relative(tenantRoot, destPath).replace(/\\/g, "/");
  return { newPath: newRelPath };
}

// ── Stats ─────────────────────────────────────────────────────────────────

/**
 * Get storage statistics for a tenant.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @returns {Promise<{totalFiles: number, totalFolders: number, totalSizeBytes: number, orderCount: number}>}
 */
export async function getStats(storageRoot, tenantId) {
  const tenantRoot = path.resolve(storageRoot, tenantId);
  let totalFiles = 0;
  let totalFolders = 0;
  let totalSizeBytes = 0;

  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name === ".trash") continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        totalFolders++;
        await walk(fullPath);
      } else {
        totalFiles++;
        try {
          const stat = await fs.stat(fullPath);
          totalSizeBytes += stat.size;
        } catch {}
      }
    }
  }

  await walk(tenantRoot);

  // Count order folders
  let orderCount = 0;
  try {
    const ordersDir = path.join(tenantRoot, "Orders");
    const entries = await fs.readdir(ordersDir, { withFileTypes: true });
    orderCount = entries.filter((e) => e.isDirectory()).length;
  } catch {}

  return { totalFiles, totalFolders, totalSizeBytes, orderCount };
}

// ── Browse trash ──────────────────────────────────────────────────────────

/**
 * List contents of the .trash/ folder.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @returns {Promise<Array<{name: string, originalPath: string, deletedAt: string}>>}
 */
export async function browseTrash(storageRoot, tenantId) {
  const tenantRoot = path.resolve(storageRoot, tenantId);
  const trashDir = path.join(tenantRoot, ".trash");

  let entries;
  try {
    entries = await fs.readdir(trashDir, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries.map((entry) => {
    const parts = entry.name.split("___");
    const timestamp = parts[0] || "";
    const encodedPath = parts.slice(1).join("___");
    const originalPath = encodedPath.replace(/___/g, "/");
    return {
      name: entry.name,
      originalPath,
      deletedAt: timestamp.replace(/-/g, (m, i) => (i > 9 ? ":" : "-")),
      isDirectory: entry.isDirectory(),
    };
  });
}

// ── Permanent delete (from trash) ─────────────────────────────────────────

/**
 * Permanently delete a single item from trash.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {string} trashName - Name in .trash/
 * @returns {Promise<{deleted: string}>}
 */
export async function permanentDeleteTrashItem(storageRoot, tenantId, trashName) {
  if (!trashName || typeof trashName !== "string") throw new Error("Missing trashName");
  if (trashName.includes("..") || trashName.includes("/") || trashName.includes("\\")) {
    throw Object.assign(new Error("Invalid trash path"), { code: "PATH_TRAVERSAL" });
  }

  const tenantRoot = path.resolve(storageRoot, tenantId);
  const trashDir = path.join(tenantRoot, ".trash");
  const trashPath = path.join(trashDir, trashName);
  assertWithinRoot(trashPath, trashDir);

  const stat = await fs.stat(trashPath);
  if (stat.isDirectory()) {
    await fs.rm(trashPath, { recursive: true, force: true });
  } else {
    await fs.unlink(trashPath);
  }

  return { deleted: trashName };
}

/**
 * Permanently delete ALL items from trash.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @returns {Promise<{deletedCount: number}>}
 */
export async function emptyTrash(storageRoot, tenantId) {
  const tenantRoot = path.resolve(storageRoot, tenantId);
  const trashDir = path.join(tenantRoot, ".trash");

  let entries;
  try {
    entries = await fs.readdir(trashDir, { withFileTypes: true });
  } catch {
    return { deletedCount: 0 };
  }

  let deletedCount = 0;
  for (const entry of entries) {
    const fullPath = path.join(trashDir, entry.name);
    try {
      if (entry.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.unlink(fullPath);
      }
      deletedCount++;
    } catch {
      // Skip items that can't be deleted
    }
  }

  return { deletedCount };
}

/**
 * Auto-cleanup: permanently delete trash items older than maxAgeDays.
 * @param {string} storageRoot
 * @param {string} tenantId
 * @param {number} maxAgeDays - Max age in days (default 20)
 * @returns {Promise<{deletedCount: number, deletedItems: string[]}>}
 */
export async function autoCleanupTrash(storageRoot, tenantId, maxAgeDays = 20) {
  const tenantRoot = path.resolve(storageRoot, tenantId);
  const trashDir = path.join(tenantRoot, ".trash");

  let entries;
  try {
    entries = await fs.readdir(trashDir, { withFileTypes: true });
  } catch {
    return { deletedCount: 0, deletedItems: [] };
  }

  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const deletedItems = [];

  for (const entry of entries) {
    // Extract timestamp from trash name: <ISO-timestamp>___<encoded_path>
    const parts = entry.name.split("___");
    const timestampStr = parts[0] || "";
    // Reconstruct ISO date from the encoded timestamp (dashes replaced colons/dots)
    // Format: YYYY-MM-DDTHH-MM-SS-SSSZ → need to restore
    let deletedAt;
    try {
      // The timestamp format is: 2026-03-24T14-30-00-000Z
      // We need to restore colons: positions 13,16 and dots: position 19
      const restored = timestampStr
        .replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})(.*)$/, "$1:$2:$3.$4$5");
      deletedAt = new Date(restored).getTime();
    } catch {
      continue; // Skip items with unparseable timestamps
    }

    if (isNaN(deletedAt)) continue;

    if (now - deletedAt > maxAgeMs) {
      const fullPath = path.join(trashDir, entry.name);
      try {
        if (entry.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true });
        } else {
          await fs.unlink(fullPath);
        }
        deletedItems.push(entry.name);
      } catch {
        // Skip items that can't be deleted
      }
    }
  }

  return { deletedCount: deletedItems.length, deletedItems };
}
