/**
 * Storage Router — Express Router for /api/storage/* endpoints.
 * Handles order file storage, browsing, download, ZIP, trash, search, upload.
 */
import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";

import { fileURLToPath } from "node:url";
import {
  createOrderFolder,
  browseFolder,
  browseTrash,
  getFilePath,
  softDelete,
  restoreFromTrash,
  searchFiles,
  createFolder,
  renameItem,
  moveItem,
  getStats,
  sanitizePath,
  resolveTenantPath,
  assertWithinRoot,
} from "./storageService.js";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");

function getTenantId(req) {
  return String(req.headers["x-tenant-id"] || "").trim() || "demo-tenant";
}

function getStorageRoot() {
  return process.env.STORAGE_ROOT || path.resolve(backendRoot, "storage");
}

function ok(res, data) {
  return res.json({ ok: true, data });
}

function fail(res, status, errorCode, message) {
  return res.status(status).json({ ok: false, errorCode, message });
}

// ── Multer for model uploads (order creation) ─────────────────────────────

const orderUpload = multer({
  dest: path.resolve(backendRoot, "storage", ".tmp"),
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const allowed = [".stl", ".obj", ".3mf", ".amf", ".step", ".stp"];
    if (allowed.some((ext) => name.endsWith(ext))) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.originalname}`));
  },
});

// ── Multer for Company Library uploads ────────────────────────────────────

const libraryUpload = multer({
  dest: path.resolve(backendRoot, "storage", ".tmp"),
  limits: { fileSize: 250 * 1024 * 1024 },
});

// ── POST /api/storage/orders — Create order folder with files ─────────────

router.post("/orders", orderUpload.array("models", 20), async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();

    let orderData;
    try {
      orderData = JSON.parse(req.body?.orderData || "{}");
    } catch {
      return fail(res, 400, "MP_BAD_REQUEST", "Invalid orderData JSON");
    }

    const result = await createOrderFolder({
      storageRoot,
      tenantId,
      orderData,
      modelFiles: req.files || [],
    });

    // Clean up multer temp files
    for (const file of req.files || []) {
      fs.unlink(file.path).catch(() => {});
    }

    return ok(res, result);
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    return fail(res, 500, "MP_STORAGE_ORDER_FAILED", String(e?.message || e));
  }
});

// ── GET /api/storage/browse — List folder contents ────────────────────────

router.get("/browse", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const relPath = String(req.query.path || "");

    // Special case: browsing trash
    if (relPath === ".trash" || relPath === "Trash") {
      const items = await browseTrash(storageRoot, tenantId);
      return ok(res, { path: ".trash", items });
    }

    const result = await browseFolder(storageRoot, tenantId, relPath);
    return ok(res, result);
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    return fail(res, 500, "MP_BROWSE_FAILED", String(e?.message || e));
  }
});

// ── GET /api/storage/file — Download file (attachment) ────────────────────

router.get("/file", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const relPath = String(req.query.path || "");

    if (!relPath) return fail(res, 400, "MP_BAD_REQUEST", "Missing path query");

    const absPath = getFilePath(storageRoot, tenantId, relPath);
    const stat = await fs.stat(absPath);
    if (stat.isDirectory()) return fail(res, 400, "MP_BAD_REQUEST", "Cannot download a directory");

    const filename = path.basename(absPath);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Content-Length", stat.size);

    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
      ".stl": "model/stl",
      ".obj": "model/obj",
      ".3mf": "model/3mf",
      ".gcode": "text/plain",
      ".ini": "text/plain",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".pdf": "application/pdf",
      ".zip": "application/zip",
    };
    res.setHeader("Content-Type", mimeMap[ext] || "application/octet-stream");

    createReadStream(absPath).pipe(res);
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    if (e.code === "ENOENT") return fail(res, 404, "MP_NOT_FOUND", "File not found");
    return fail(res, 500, "MP_DOWNLOAD_FAILED", String(e?.message || e));
  }
});

// ── GET /api/storage/file/preview — Inline preview ────────────────────────

router.get("/file/preview", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const relPath = String(req.query.path || "");

    if (!relPath) return fail(res, 400, "MP_BAD_REQUEST", "Missing path query");

    const absPath = getFilePath(storageRoot, tenantId, relPath);
    const stat = await fs.stat(absPath);
    if (stat.isDirectory()) return fail(res, 400, "MP_BAD_REQUEST", "Cannot preview a directory");

    const filename = path.basename(absPath);
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Content-Length", stat.size);

    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
      ".stl": "model/stl",
      ".obj": "model/obj",
      ".3mf": "model/3mf",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".txt": "text/plain",
      ".gcode": "text/plain",
      ".ini": "text/plain",
    };
    res.setHeader("Content-Type", mimeMap[ext] || "application/octet-stream");

    createReadStream(absPath).pipe(res);
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    if (e.code === "ENOENT") return fail(res, 404, "MP_NOT_FOUND", "File not found");
    return fail(res, 500, "MP_PREVIEW_FAILED", String(e?.message || e));
  }
});

// ── POST /api/storage/zip — ZIP export ────────────────────────────────────

router.post("/zip", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const paths = req.body?.paths || [];

    if (!Array.isArray(paths) || paths.length === 0) {
      return fail(res, 400, "MP_BAD_REQUEST", "Missing or empty paths array");
    }

    // Dynamic import of archiver (optional dependency)
    let archiver;
    try {
      archiver = (await import("archiver")).default;
    } catch {
      return fail(res, 500, "MP_ZIP_UNAVAILABLE", "archiver package not installed");
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="download-${Date.now()}.zip"`);

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.pipe(res);

    archive.on("error", (err) => {
      res.status(500).end();
    });

    for (const relPath of paths) {
      try {
        const absPath = getFilePath(storageRoot, tenantId, relPath);
        const stat = await fs.stat(absPath);
        if (stat.isDirectory()) {
          archive.directory(absPath, path.basename(absPath));
        } else {
          archive.file(absPath, { name: path.basename(absPath) });
        }
      } catch {
        // Skip files that can't be accessed
      }
    }

    await archive.finalize();
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    if (!res.headersSent) return fail(res, 500, "MP_ZIP_FAILED", String(e?.message || e));
  }
});

// ── POST /api/storage/upload — Upload to Company Library ──────────────────

router.post("/upload", libraryUpload.array("files", 10), async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const targetPath = String(req.body?.targetPath || "CompanyLibrary");

    const tenantRoot = path.resolve(storageRoot, tenantId);
    const destDir = resolveTenantPath(storageRoot, tenantId, targetPath);
    await fs.mkdir(destDir, { recursive: true });

    const uploaded = [];
    for (const file of req.files || []) {
      const safeName = (file.originalname || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
      const dest = path.join(destDir, safeName);
      assertWithinRoot(dest, tenantRoot);

      await fs.copyFile(file.path, dest);
      fs.unlink(file.path).catch(() => {});

      const stat = await fs.stat(dest);
      uploaded.push({
        name: safeName,
        path: `${targetPath}/${safeName}`,
        size: stat.size,
      });
    }

    return ok(res, { uploaded });
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    return fail(res, 500, "MP_UPLOAD_FAILED", String(e?.message || e));
  }
});

// ── DELETE /api/storage/file — Soft delete ────────────────────────────────

router.delete("/file", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const relPath = String(req.body?.path || "");

    if (!relPath) return fail(res, 400, "MP_BAD_REQUEST", "Missing path");

    const result = await softDelete(storageRoot, tenantId, relPath);
    return ok(res, result);
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    if (e.code === "ENOENT") return fail(res, 404, "MP_NOT_FOUND", "File not found");
    return fail(res, 500, "MP_DELETE_FAILED", String(e?.message || e));
  }
});

// ── POST /api/storage/restore — Restore from trash ────────────────────────

router.post("/restore", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const trashPath = String(req.body?.trashPath || "");

    if (!trashPath) return fail(res, 400, "MP_BAD_REQUEST", "Missing trashPath");

    const result = await restoreFromTrash(storageRoot, tenantId, trashPath);
    return ok(res, result);
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    if (e.code === "ENOENT") return fail(res, 404, "MP_NOT_FOUND", "Trash item not found");
    return fail(res, 500, "MP_RESTORE_FAILED", String(e?.message || e));
  }
});

// ── GET /api/storage/search — Search files ────────────────────────────────

router.get("/search", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const query = String(req.query.q || "");

    if (!query) return ok(res, []);

    const results = await searchFiles(storageRoot, tenantId, query);
    return ok(res, results);
  } catch (e) {
    return fail(res, 500, "MP_SEARCH_FAILED", String(e?.message || e));
  }
});

// ── POST /api/storage/folder — Create folder ──────────────────────────────

router.post("/folder", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const relPath = String(req.body?.path || "");

    if (!relPath) return fail(res, 400, "MP_BAD_REQUEST", "Missing path");

    await createFolder(storageRoot, tenantId, relPath);
    return ok(res, { path: relPath });
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    return fail(res, 500, "MP_FOLDER_FAILED", String(e?.message || e));
  }
});

// ── GET /api/storage/stats — Storage statistics ───────────────────────────

router.get("/stats", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();

    const stats = await getStats(storageRoot, tenantId);
    return ok(res, stats);
  } catch (e) {
    return fail(res, 500, "MP_STATS_FAILED", String(e?.message || e));
  }
});

// ── POST /api/storage/rename — Rename file/folder ─────────────────────────

router.post("/rename", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const relPath = String(req.body?.path || "");
    const newName = String(req.body?.newName || "");

    if (!relPath || !newName) return fail(res, 400, "MP_BAD_REQUEST", "Missing path or newName");

    const result = await renameItem(storageRoot, tenantId, relPath, newName);
    return ok(res, result);
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    if (e.code === "ENOENT") return fail(res, 404, "MP_NOT_FOUND", "Item not found");
    return fail(res, 500, "MP_RENAME_FAILED", String(e?.message || e));
  }
});

// ── POST /api/storage/move — Move file/folder ─────────────────────────────

router.post("/move", async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const storageRoot = getStorageRoot();
    const relPath = String(req.body?.path || "");
    const destination = String(req.body?.destination || "");

    if (!relPath || !destination) return fail(res, 400, "MP_BAD_REQUEST", "Missing path or destination");

    const result = await moveItem(storageRoot, tenantId, relPath, destination);
    return ok(res, result);
  } catch (e) {
    if (e.code === "PATH_TRAVERSAL") return fail(res, 403, "MP_PATH_TRAVERSAL", e.message);
    if (e.code === "ENOENT") return fail(res, 404, "MP_NOT_FOUND", "Item not found");
    return fail(res, 500, "MP_MOVE_FAILED", String(e?.message || e));
  }
});

export default router;
