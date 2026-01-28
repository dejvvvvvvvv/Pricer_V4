import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { nanoid } from "nanoid";
import multer from "multer";

import { ensureDir, fileExists } from "./util/fsSafe.js";
import { findPrusaSlicerConsole } from "./util/findSlicer.js";
import { runPrusaSlicer } from "./slicer/runPrusaSlicer.js";
import { parseGcodeMetrics } from "./slicer/parseGcode.js";
import { runPrusaInfo } from "./slicer/runPrusaInfo.js";
import { parseModelInfo } from "./slicer/parseModelInfo.js";

import {
  createPresetFromIni,
  deletePreset,
  getIniPathForPreset,
  listPresets,
  readPresetsState,
  setDefaultPreset,
  updatePresetMeta
} from "./presetsStore.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const projectRoot = path.resolve(backendRoot, "..");

const isWin = process.platform === "win32";

const PORT = Number(process.env.PORT || 3001);
const WORKSPACE_ROOT = process.env.SLICER_WORKSPACE_ROOT || (isWin ? "C:\\modelpricer\\tmp" : path.join(os.tmpdir(), "modelpricer"));
const DEFAULT_INI = process.env.PRUSA_DEFAULT_INI || "";

const app = express();

// JSON for PATCH endpoints etc.
app.use(express.json({ limit: "2mb" }));

// CORS for local dev
const corsOriginsRaw = (process.env.CORS_ORIGINS || "").trim();
const corsOrigins = corsOriginsRaw
  ? corsOriginsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      if (corsOrigins.includes("*")) return cb(null, true);
      if (corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);

app.get("/api/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "modelpricer-backend-local",
    port: PORT,
    workspaceRoot: WORKSPACE_ROOT,
    projectRoot,
    backendRoot,
    time: new Date().toISOString()
  });
});

// ===== Presets API (backend-local) =====

function getTenantIdFromReq(req) {
  const fromHeader = String(req.headers["x-tenant-id"] || "").trim();
  return fromHeader || "demo-tenant";
}

function ok(res, data) {
  return res.json({ ok: true, data });
}

function fail(res, status, errorCode, message, details) {
  return res.status(status).json({ ok: false, errorCode, message, details });
}

const presetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || "").toLowerCase();
    if (!name.endsWith(".ini")) return cb(new Error("Only .ini files are allowed"));
    cb(null, true);
  }
}).single("file");

app.get("/api/presets", async (req, res) => {
  try {
    const tenantId = getTenantIdFromReq(req);
    const state = await listPresets(WORKSPACE_ROOT, tenantId);
    return ok(res, state);
  } catch (e) {
    return fail(res, 500, "MP_PRESETS_LIST_FAILED", String(e?.message || e));
  }
});

app.post("/api/presets", presetUpload, async (req, res) => {
  try {
    const tenantId = getTenantIdFromReq(req);
    if (!req.file?.buffer) {
      return fail(res, 400, "MP_BAD_REQUEST", "Missing multipart field 'file' (.ini)");
    }

    const meta = {
      name: req.body?.name,
      order: req.body?.order,
      visibleInWidget: req.body?.visibleInWidget
    };

    const created = await createPresetFromIni(WORKSPACE_ROOT, tenantId, req.file.buffer, meta);
    return ok(res, created.state);
  } catch (e) {
    return fail(res, 500, "MP_PRESET_UPLOAD_FAILED", String(e?.message || e));
  }
});

app.patch("/api/presets/:id", async (req, res) => {
  try {
    const tenantId = getTenantIdFromReq(req);
    const presetId = String(req.params.id || "").trim();
    if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

    const out = await updatePresetMeta(WORKSPACE_ROOT, tenantId, presetId, req.body || {});
    if (!out.ok) return fail(res, 404, "MP_NOT_FOUND", out.error || "Preset not found");
    return ok(res, out.state);
  } catch (e) {
    return fail(res, 500, "MP_PRESET_PATCH_FAILED", String(e?.message || e));
  }
});

app.post("/api/presets/:id/default", async (req, res) => {
  try {
    const tenantId = getTenantIdFromReq(req);
    const presetId = String(req.params.id || "").trim();
    if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

    const out = await setDefaultPreset(WORKSPACE_ROOT, tenantId, presetId);
    if (!out.ok) return fail(res, 404, "MP_NOT_FOUND", out.error || "Preset not found");
    return ok(res, out.state);
  } catch (e) {
    return fail(res, 500, "MP_PRESET_DEFAULT_FAILED", String(e?.message || e));
  }
});

app.delete("/api/presets/:id", async (req, res) => {
  try {
    const tenantId = getTenantIdFromReq(req);
    const presetId = String(req.params.id || "").trim();
    if (!presetId) return fail(res, 400, "MP_BAD_REQUEST", "Missing preset id");

    const out = await deletePreset(WORKSPACE_ROOT, tenantId, presetId);
    if (!out.ok) return fail(res, 500, "MP_PRESET_DELETE_FAILED", out.error || "Delete failed");
    if (!out.removed) return fail(res, 404, "MP_NOT_FOUND", "Preset not found");
    return ok(res, out.state);
  } catch (e) {
    return fail(res, 500, "MP_PRESET_DELETE_FAILED", String(e?.message || e));
  }
});

app.get("/api/widget/presets", async (req, res) => {
  try {
    const tenantId = getTenantIdFromReq(req);
    const state = await listPresets(WORKSPACE_ROOT, tenantId);
    const presets = (state.presets || [])
      .filter((p) => !!p.visibleInWidget)
      .sort((a, b) => (b.order ?? 0) - (a.order ?? 0));

    return res.json({ presets, defaultPresetId: state.defaultPresetId || null });
  } catch (e) {
    return res.status(500).json({ presets: [], defaultPresetId: null, error: String(e?.message || e) });
  }
});

app.get("/api/health/prusa", async (_req, res) => {
  try {
    const slicerCmd = await resolveSlicerCmd();
    if (!slicerCmd) {
      return res.status(500).json({
        ok: false,
        error: "PRUSA_SLICER_CMD not set and auto-detect failed.",
        hint: `Put PrusaSlicer portable into ${path.join(projectRoot, "tools", "prusaslicer")} and/or set PRUSA_SLICER_CMD in backend-local/.env`
      });
    }

    if (!(await fileExists(slicerCmd))) {
      return res.status(500).json({ ok: false, error: `Slicer not found at: ${slicerCmd}` });
    }

    // Windows portable builds often don't support --version. --help is the safest truth source.
    const checkMethod = "--help";
    const final = await runSimple(slicerCmd, ["--help"], 15000);

    const stdout = truncate(final.stdout.trim(), 2000);
    const stderr = truncate(final.stderr.trim(), 2000);

    res.json({
      ok: final.exitCode === 0,
      slicerCmd,
      checkMethod,
      exitCode: final.exitCode,
      stdout,
      stderr
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// ===== Upload & slice =====

await ensureDir(WORKSPACE_ROOT);

app.post(
  "/api/slice",
  createJobMiddleware,
  createUploader().fields([
    { name: "model", maxCount: 1 },
    { name: "ini", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const slicerCmd = await resolveSlicerCmd();
      if (!slicerCmd) {
        return res.status(500).json({
          success: false,
          error: "PrusaSlicer CLI not configured.",
          hint: "Set PRUSA_SLICER_CMD in backend-local/.env or place portable in ../tools/prusaslicer"
        });
      }

      const modelFile = req.files?.model?.[0];
      if (!modelFile?.path) {
        return res.status(400).json({ success: false, error: "Missing file field 'model' (multipart)." });
      }

      const iniFile = req.files?.ini?.[0];

      const tenantId = getTenantIdFromReq(req);
      const presetId = typeof req.body?.presetId === "string" ? req.body.presetId.trim() : "";

      let iniPath = iniFile?.path || "";
      let usedPreset = null;

      // 1) explicit presetId
      if (!iniPath && presetId) {
        const fromPreset = await getIniPathForPreset(WORKSPACE_ROOT, tenantId, presetId);
        if (fromPreset) {
          iniPath = fromPreset;
          usedPreset = presetId;
        }
      }

      // 2) tenant default preset
      if (!iniPath) {
        const state = await readPresetsState(WORKSPACE_ROOT, tenantId);
        if (state.defaultPresetId) {
          const fromDefault = await getIniPathForPreset(WORKSPACE_ROOT, tenantId, state.defaultPresetId);
          if (fromDefault) {
            iniPath = fromDefault;
            usedPreset = state.defaultPresetId;
          }
        }
      }

      // 3) env default ini
      if (!iniPath) iniPath = DEFAULT_INI;

      if (!iniPath) {
        return res.status(400).json({
          success: false,
          error: "No .ini profile provided.",
          hint: "Upload an 'ini' file OR create presets via /api/presets OR set PRUSA_DEFAULT_INI in backend-local/.env"
        });
      }
      if (!(await fileExists(iniPath))) {
        return res.status(400).json({ success: false, error: `INI not found: ${iniPath}` });
      }

      // Optional: get model dimensions (bounding box) before slicing.
      // Useful for enforcing max X/Y/Z limits later.
      let modelInfo = null;
      let modelInfoError = "";
      try {
        const infoRun = await runPrusaInfo({
          slicerCmd,
          modelPath: modelFile.path,
          timeoutMs: 20000
        });

        // Persist for debugging
        if (infoRun.stderr) {
          await fs.writeFile(path.join(req.jobDir, "prusa_info_stderr.log"), infoRun.stderr, "utf8").catch(() => {});
        }
        if (infoRun.stdout) {
          await fs.writeFile(path.join(req.jobDir, "prusa_info_stdout.log"), infoRun.stdout, "utf8").catch(() => {});
        }

        if (infoRun.exitCode === 0) {
          modelInfo = parseModelInfo(infoRun.stdout);
        } else {
          modelInfoError = `PrusaSlicer --info failed (exit ${infoRun.exitCode}): ${truncate(infoRun.stderr, 300)}`;
        }
      } catch (e) {
        modelInfoError = `PrusaSlicer --info error: ${String(e?.message || e)}`;
      }

      const run = await runPrusaSlicer({
        slicerCmd,
        modelPath: modelFile.path,
        iniPath,
        outDir: req.jobOutputDir,
        timeoutMs: 300000
      });

      // Persist slicer stderr for debugging
      if (run.stderr) {
        await fs.writeFile(path.join(req.jobDir, "prusa_stderr.log"), run.stderr, "utf8").catch(() => {});
      }
      if (run.stdout) {
        await fs.writeFile(path.join(req.jobDir, "prusa_stdout.log"), run.stdout, "utf8").catch(() => {});
      }

      if (run.exitCode !== 0) {
        return res.status(500).json({
          success: false,
          error: "PrusaSlicer returned non-zero exit code.",
          exitCode: run.exitCode,
          jobId: req.jobId,
          jobDir: req.jobDir,
          stderr: run.stderr.slice(0, 5000)
        });
      }

      if (!(await fileExists(run.outGcodePath))) {
        return res.status(500).json({
          success: false,
          error: "out.gcode was not produced.",
          jobId: req.jobId,
          jobDir: req.jobDir,
          stderr: run.stderr.slice(0, 5000)
        });
      }

      const gcodeText = await fs.readFile(run.outGcodePath, "utf8");
      const metrics = parseGcodeMetrics(gcodeText);

      res.json({
        success: true,
        jobId: req.jobId,
        jobDir: req.jobDir,
        outGcodePath: run.outGcodePath,
        durationMs: run.durationMs,
        slicerCmd,
        iniUsed: iniPath,
        usedPreset,
        modelUsed: modelFile.originalname,
        modelInfo,
        modelInfoError: modelInfoError || undefined,
        metrics
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        jobId: req.jobId,
        jobDir: req.jobDir,
        error: String(e?.message || e)
      });
    }
  }
);

// ===== Error handler (CORS etc.) =====
app.use((err, _req, res, _next) => {
  res.status(500).json({ success: false, error: String(err?.message || err) });
});

app.listen(PORT, () => {
  console.log(`[backend-local] listening on http://127.0.0.1:${PORT}`);
  console.log(`[backend-local] workspace: ${WORKSPACE_ROOT}`);
});

// ===== Helpers =====

async function resolveSlicerCmd() {
  const fromEnv = (process.env.PRUSA_SLICER_CMD || "").trim();
  if (fromEnv) return fromEnv;
  // Try auto-detect inside project root
  const found = await findPrusaSlicerConsole(projectRoot);
  return found || "";
}

function createJobMiddleware(req, _res, next) {
  const jobId = `job-${nanoid(10)}`;
  req.jobId = jobId;
  req.jobDir = path.join(WORKSPACE_ROOT, jobId);
  req.jobInputDir = path.join(req.jobDir, "input");
  req.jobOutputDir = path.join(req.jobDir, "output");

  Promise.all([ensureDir(req.jobInputDir), ensureDir(req.jobOutputDir)])
    .then(() => next())
    .catch(next);
}

function createUploader() {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, req.jobInputDir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9\._-]/g, "_");
      cb(null, safe);
    }
  });

  const fileFilter = (_req, file, cb) => {
    const name = (file.originalname || "").toLowerCase();
    const ok = name.endsWith(".stl") || name.endsWith(".obj") || name.endsWith(".3mf") || name.endsWith(".amf") || name.endsWith(".ini");
    if (!ok) return cb(new Error(`Unsupported file type: ${file.originalname}`));
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 250 * 1024 * 1024 // 250MB
    }
  });
}

async function runSimple(cmd, args, timeoutMs) {
  // Minimal runner for health check
  const { spawn } = await import("node:child_process");
  return await new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { windowsHide: true, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => (stdout += String(d)));
    child.stderr?.on("data", (d) => (stderr += String(d)));

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      reject(new Error(`Command timed out after ${timeoutMs}ms: ${cmd} ${args.join(" ")}`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, stdout, stderr });
    });
  });
}

function truncate(s, maxLen) {
  if (!s) return "";
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + `\n... (truncated ${s.length - maxLen} chars)`;
}
