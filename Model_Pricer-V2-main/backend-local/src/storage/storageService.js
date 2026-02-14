/**
 * Storage Service — Business logic for file storage operations.
 * Handles: order folder creation, file browsing, ZIP, trash, search, stats.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { sha256File } from "./checksumUtil.js";
import { buildOrderMeta, buildFileManifest, buildPricingSnapshot } from "./metadataBuilder.js";

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
 * Create an order folder with subfolders (models/, gcode/, presets/, meta/).
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

  // Create subdirectories
  const modelsDir = path.join(orderDir, "models");
  const gcodeDir = path.join(orderDir, "gcode");
  const presetsDir = path.join(orderDir, "presets");
  const metaDir = path.join(orderDir, "meta");

  await Promise.all([
    fs.mkdir(modelsDir, { recursive: true }),
    fs.mkdir(gcodeDir, { recursive: true }),
    fs.mkdir(presetsDir, { recursive: true }),
    fs.mkdir(metaDir, { recursive: true }),
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
      const workspaceRoot = process.env.SLICER_WORKSPACE_ROOT || (process.platform === "win32" ? "C:\\modelpricer\\tmp" : "/tmp/modelpricer");
      const jobOutputDir = path.join(workspaceRoot, mapping.slicerJobId, "output");
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

    // Try to copy preset .ini
    if (mapping.presetId) {
      const workspaceRoot = process.env.SLICER_WORKSPACE_ROOT || (process.platform === "win32" ? "C:\\modelpricer\\tmp" : "/tmp/modelpricer");
      try {
        const presetDir = path.join(workspaceRoot, tenantId, "presets");
        const presetFiles = await fs.readdir(presetDir);
        const iniFile = presetFiles.find((f) => f.includes(mapping.presetId) && f.endsWith(".ini"));
        if (iniFile) {
          const src = path.join(presetDir, iniFile);
          const dest = path.join(presetsDir, iniFile);
          await fs.copyFile(src, dest);
          const stat = await fs.stat(dest);
          const hash = await sha256File(dest);
          manifestFiles.push({ type: "preset", filename: iniFile, sha256: hash, sizeBytes: stat.size });
        }
      } catch {
        // Preset not available — not critical
      }
    }
  }

  // Write metadata files
  const orderMeta = buildOrderMeta(orderData);
  const fileManifest = buildFileManifest(manifestFiles);
  const pricingSnapshot = buildPricingSnapshot(orderData);

  await Promise.all([
    fs.writeFile(path.join(metaDir, "order-meta.json"), JSON.stringify(orderMeta, null, 2), "utf8"),
    fs.writeFile(path.join(metaDir, "file-manifest.json"), JSON.stringify(fileManifest, null, 2), "utf8"),
    fs.writeFile(path.join(metaDir, "pricing-snapshot.json"), JSON.stringify(pricingSnapshot, null, 2), "utf8"),
  ]);

  // Add meta files to manifest list for the response
  manifestFiles.push(
    { type: "meta", filename: "order-meta.json", sha256: "", sizeBytes: 0 },
    { type: "meta", filename: "file-manifest.json", sha256: "", sizeBytes: 0 },
    { type: "meta", filename: "pricing-snapshot.json", sha256: "", sizeBytes: 0 }
  );

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
