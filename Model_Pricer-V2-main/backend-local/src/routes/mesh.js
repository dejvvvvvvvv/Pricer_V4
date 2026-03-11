import express from "express";
import path from "node:path";
import fs from "node:fs/promises";
import multer from "multer";
import { nanoid } from "nanoid";

import { ensureDir, fileExists } from "../util/fsSafe.js";
import { runPrusaRepair } from "../slicer/runPrusaRepair.js";
import { runPrusaInfo } from "../slicer/runPrusaInfo.js";
import { parseModelInfo } from "../slicer/parseModelInfo.js";

/**
 * Mesh API routes — repair and analyze 3D models using PrusaSlicer.
 *
 * POST /api/mesh/repair  — Repair a 3D model mesh, return repaired STL binary
 * POST /api/mesh/analyze — Analyze a 3D model, return mesh info JSON
 *
 * @param {Object} deps
 * @param {string} deps.workspaceRoot  — Temp workspace directory
 * @param {Function} deps.resolveSlicerCmd — Async function returning PrusaSlicer path
 * @returns {express.Router}
 */
export function createMeshRouter({ workspaceRoot, resolveSlicerCmd }) {
  const router = express.Router();

  // ===== Allowed file extensions =====
  const ALLOWED_EXTENSIONS = [".stl", ".obj", ".3mf", ".amf"];
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

  // ===== Multer setup for mesh uploads =====
  function createMeshUploader(jobInputDir) {
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, jobInputDir),
      filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        cb(null, safe);
      },
    });

    const fileFilter = (_req, file, cb) => {
      const name = (file.originalname || "").toLowerCase();
      const ext = path.extname(name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`Unsupported file type: ${file.originalname}. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`));
      }
      cb(null, true);
    };

    return multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });
  }

  // ===== Job directory middleware =====
  async function createMeshJob(req, _res, next) {
    try {
      const jobId = `mesh-${nanoid(10)}`;
      req.meshJobId = jobId;
      req.meshJobDir = path.join(workspaceRoot, jobId);
      req.meshInputDir = path.join(req.meshJobDir, "input");
      req.meshOutputDir = path.join(req.meshJobDir, "output");
      await Promise.all([ensureDir(req.meshInputDir), ensureDir(req.meshOutputDir)]);
      next();
    } catch (err) {
      next(err);
    }
  }

  // ===== Cleanup helper =====
  async function cleanupJobDir(jobDir) {
    if (!jobDir) return;
    try {
      await fs.rm(jobDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup — log but don't fail
      console.warn(`[mesh] Failed to clean up job dir: ${jobDir}`);
    }
  }

  // ===== Response helpers =====
  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message, details) {
    return res.status(status).json({ ok: false, errorCode, message, details });
  }

  // ===== Tenant ID extraction =====
  function getTenantId(req) {
    if (req.tenantId) return req.tenantId;
    const fromHeader = String(req.headers["x-tenant-id"] || "").trim();
    if (fromHeader) return fromHeader;
    return "demo-tenant";
  }

  // ===== POST /api/mesh/repair =====
  /**
   * Accepts multipart form data with a 3D model file (STL/OBJ/3MF/AMF).
   * Repairs the mesh using PrusaSlicer --repair --export-stl.
   * Returns the repaired STL file as binary download.
   *
   * Request: multipart/form-data with field "model" (required)
   * Response: application/octet-stream (repaired .stl binary)
   *
   * Error codes:
   *   MP_SLICER_UNAVAILABLE (503) — PrusaSlicer not found/configured
   *   MP_VALIDATION_ERROR   (400) — Missing file or invalid format
   *   MP_UPLOAD_TOO_LARGE   (413) — File exceeds 100MB (handled by multer error handler)
   *   MP_SLICER_TIMEOUT     (504) — Repair timed out
   *   MP_REPAIR_FAILED      (500) — PrusaSlicer repair returned error
   */
  router.post(
    "/repair",
    createMeshJob,
    (req, res, next) => {
      const upload = createMeshUploader(req.meshInputDir);
      upload.single("model")(req, res, next);
    },
    async (req, res) => {
      const jobDir = req.meshJobDir;
      try {
        const tenantId = getTenantId(req);
        const isProd = process.env.NODE_ENV === "production";

        // 1) Check PrusaSlicer availability
        const slicerCmd = await resolveSlicerCmd();
        if (!slicerCmd) {
          return fail(res, 503, "MP_SLICER_UNAVAILABLE", "PrusaSlicer CLI is not configured or not found on this server.", {
            ...(!isProd && { hint: "Set PRUSA_SLICER_CMD in backend-local/.env or place portable in ../tools/prusaslicer" }),
          });
        }

        // 2) Validate uploaded file
        const modelFile = req.file;
        if (!modelFile?.path) {
          return fail(res, 400, "MP_VALIDATION_ERROR", "Missing multipart field 'model' (3D model file).");
        }

        // 3) Run PrusaSlicer --repair
        let run;
        try {
          run = await runPrusaRepair({
            slicerCmd,
            modelPath: modelFile.path,
            outDir: req.meshOutputDir,
            timeoutMs: 60_000,
          });
        } catch (err) {
          if (err.message?.includes("timed out")) {
            return fail(res, 504, "MP_SLICER_TIMEOUT", "Mesh repair timed out after 60 seconds. The model may be too complex.", {
              ...(!isProd && { jobId: req.meshJobId }),
            });
          }
          // ENOENT = slicer binary not found at runtime
          if (err.code === "ENOENT") {
            return fail(res, 503, "MP_SLICER_UNAVAILABLE", "PrusaSlicer binary not found at the configured path.");
          }
          throw err;
        }

        // 4) Check exit code
        if (run.exitCode !== 0) {
          return fail(res, 500, "MP_REPAIR_FAILED", "PrusaSlicer mesh repair returned a non-zero exit code.", {
            exitCode: run.exitCode,
            ...(!isProd && {
              jobId: req.meshJobId,
              stderr: run.stderr?.slice(0, 2000),
            }),
          });
        }

        // 5) Verify output file exists
        if (!(await fileExists(run.outStlPath))) {
          return fail(res, 500, "MP_REPAIR_FAILED", "PrusaSlicer completed but did not produce a repaired STL file.", {
            ...(!isProd && { jobId: req.meshJobId }),
          });
        }

        // 6) Stream repaired file back as binary download
        const originalName = modelFile.originalname || "model.stl";
        const baseName = path.basename(originalName, path.extname(originalName));
        const downloadName = `${baseName}_repaired.stl`;

        res.set("Content-Type", "application/octet-stream");
        res.set("Content-Disposition", `attachment; filename="${downloadName}"`);
        res.set("X-Mesh-Repair-Duration-Ms", String(run.durationMs));

        const fileBuffer = await fs.readFile(run.outStlPath);
        res.send(fileBuffer);
      } catch (err) {
        const isProd = process.env.NODE_ENV === "production";
        fail(res, 500, "MP_INTERNAL_ERROR", String(err?.message || err), {
          ...(!isProd && { jobId: req.meshJobId }),
        });
      } finally {
        // Always clean up temp files
        cleanupJobDir(jobDir);
      }
    }
  );

  // ===== POST /api/mesh/analyze =====
  /**
   * Accepts multipart form data with a 3D model file (STL/OBJ/3MF/AMF).
   * Runs PrusaSlicer --info to extract mesh metadata.
   * Returns JSON with volume, surface area, manifold status, triangle count, etc.
   *
   * Request: multipart/form-data with field "model" (required)
   * Response: { ok: true, data: { volume, triangleCount, isManifold, boundingBox, ... } }
   *
   * Error codes:
   *   MP_SLICER_UNAVAILABLE (503) — PrusaSlicer not found/configured
   *   MP_VALIDATION_ERROR   (400) — Missing file or invalid format
   *   MP_SLICER_TIMEOUT     (504) — Analysis timed out
   *   MP_ANALYSIS_FAILED    (500) — PrusaSlicer --info returned error
   */
  router.post(
    "/analyze",
    createMeshJob,
    (req, res, next) => {
      const upload = createMeshUploader(req.meshInputDir);
      upload.single("model")(req, res, next);
    },
    async (req, res) => {
      const jobDir = req.meshJobDir;
      try {
        const tenantId = getTenantId(req);
        const isProd = process.env.NODE_ENV === "production";

        // 1) Check PrusaSlicer availability
        const slicerCmd = await resolveSlicerCmd();
        if (!slicerCmd) {
          return fail(res, 503, "MP_SLICER_UNAVAILABLE", "PrusaSlicer CLI is not configured or not found on this server.", {
            ...(!isProd && { hint: "Set PRUSA_SLICER_CMD in backend-local/.env or place portable in ../tools/prusaslicer" }),
          });
        }

        // 2) Validate uploaded file
        const modelFile = req.file;
        if (!modelFile?.path) {
          return fail(res, 400, "MP_VALIDATION_ERROR", "Missing multipart field 'model' (3D model file).");
        }

        // 3) Run PrusaSlicer --info
        let infoRun;
        try {
          infoRun = await runPrusaInfo({
            slicerCmd,
            modelPath: modelFile.path,
            timeoutMs: 30_000,
          });
        } catch (err) {
          if (err.message?.includes("timed out")) {
            return fail(res, 504, "MP_SLICER_TIMEOUT", "Mesh analysis timed out after 30 seconds.", {
              ...(!isProd && { jobId: req.meshJobId }),
            });
          }
          if (err.code === "ENOENT") {
            return fail(res, 503, "MP_SLICER_UNAVAILABLE", "PrusaSlicer binary not found at the configured path.");
          }
          throw err;
        }

        // 4) Check exit code
        if (infoRun.exitCode !== 0) {
          return fail(res, 500, "MP_ANALYSIS_FAILED", "PrusaSlicer --info returned a non-zero exit code.", {
            exitCode: infoRun.exitCode,
            ...(!isProd && {
              jobId: req.meshJobId,
              stderr: infoRun.stderr?.slice(0, 2000),
            }),
          });
        }

        // 5) Parse model info
        const parsed = parseModelInfo(infoRun.stdout);

        // 6) Build response in the requested format
        const data = {
          fileName: modelFile.originalname,
          volume: parsed.volumeMm3 ?? null,
          surfaceArea: null, // PrusaSlicer --info does not report surface area
          isManifold: parsed.manifold ?? null,
          triangleCount: parsed.facets ?? null,
          vertexCount: null, // PrusaSlicer --info does not report vertex count separately
          parts: parsed.parts ?? null,
          boundingBox: parsed.bboxMm ?? null,
          size: parsed.sizeMm ?? null,
          repairNeeded: parsed.manifold === false,
          raw: parsed.raw,
          durationMs: null, // --info doesn't return timing from the runner, but we can measure
        };

        return ok(res, data);
      } catch (err) {
        const isProd = process.env.NODE_ENV === "production";
        fail(res, 500, "MP_INTERNAL_ERROR", String(err?.message || err), {
          ...(!isProd && { jobId: req.meshJobId }),
        });
      } finally {
        // Always clean up temp files
        cleanupJobDir(jobDir);
      }
    }
  );

  return router;
}
