/**
 * routes/slicer.js — Express router for PrusaSlicer management endpoints.
 *
 * Endpoints:
 *   GET    /api/slicer/health                  — Slicer health check (version, availability)
 *   GET    /api/slicer/profiles                — List available slicer profiles
 *   POST   /api/slicer/profiles/:name/validate — Validate a profile config
 *   GET    /api/slicer/queue/stats             — Queue statistics
 *   DELETE /api/slicer/queue/:jobId            — Cancel a pending/processing job
 *   GET    /api/slicer/cache                   — Cache statistics
 *   DELETE /api/slicer/cache                   — Clear entire cache
 *
 * @module routes/slicer
 */

import { Router } from "express";
import { checkSlicerHealth } from "../services/slicerHealthService.js";
import { listSlicerProfiles, validateSlicerProfile } from "../services/slicerProfileService.js";

/**
 * Create the slicer management router.
 *
 * @param {Object} deps - Injected dependencies
 * @param {string} deps.workspaceRoot - Workspace root path
 * @param {() => Promise<string>} deps.resolveSlicerCmd - Resolves PrusaSlicer binary path
 * @param {(path: string) => Promise<boolean>} deps.fileExists - File existence check
 * @param {(req: import("express").Request) => string} deps.getTenantIdFromReq - Extract tenant ID from request
 * @param {import("../slicer/slicerCache.js").SlicerCache} deps.slicerCache - Slicer cache singleton
 * @param {import("../jobs/slicingQueue.js").SlicingQueue} deps.slicingQueue - Slicing queue singleton
 * @returns {Router}
 */
export function createSlicerRouter({
  workspaceRoot,
  resolveSlicerCmd,
  fileExists,
  getTenantIdFromReq,
  slicerCache,
  slicingQueue,
}) {
  const router = Router();

  // ----- 1. Slicer Health Check -----

  /**
   * GET /api/slicer/health
   *
   * Verifies PrusaSlicer is installed and accessible.
   * Returns version info and availability status.
   *
   * Response: { ok, data: { available, version, exitCode, error } }
   */
  router.get("/health", async (_req, res) => {
    try {
      const health = await checkSlicerHealth({ resolveSlicerCmd, fileExists });
      const status = health.available ? 200 : 503;
      return res.status(status).json({
        ok: health.available,
        data: health,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        errorCode: "MP_SLICER_HEALTH_FAILED",
        message: String(err?.message || err),
      });
    }
  });

  // ----- 2. Profile Management -----

  /**
   * GET /api/slicer/profiles
   *
   * List available slicer profiles (INI files) for the current tenant.
   *
   * Response: { ok, data: { profiles: [{ name, filename, sizeBytes, modifiedAt }] } }
   */
  router.get("/profiles", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const result = await listSlicerProfiles(workspaceRoot, tenantId);
      return res.json({ ok: true, data: result });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        errorCode: "MP_PROFILE_LIST_FAILED",
        message: String(err?.message || err),
      });
    }
  });

  /**
   * POST /api/slicer/profiles/:name/validate
   *
   * Validate a slicer profile INI file for required keys, value ranges,
   * and common issues. Returns errors (blocking) and warnings (non-blocking).
   *
   * Response: { ok, data: { valid, errors, warnings, keyCount, keys } }
   */
  router.post("/profiles/:name/validate", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const profileName = String(req.params.name || "").trim();

      if (!profileName) {
        return res.status(400).json({
          ok: false,
          errorCode: "MP_BAD_REQUEST",
          message: "Missing profile name.",
        });
      }

      const result = await validateSlicerProfile(workspaceRoot, tenantId, profileName);
      return res.json({ ok: result.valid, data: result });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        errorCode: "MP_PROFILE_VALIDATE_FAILED",
        message: String(err?.message || err),
      });
    }
  });

  // ----- 3. Queue Management -----

  /**
   * GET /api/slicer/queue/stats
   *
   * Returns detailed queue statistics: pending, active, completed, failed counts,
   * concurrency settings, and priority breakdown.
   *
   * Response: { ok, data: { queued, processing, completed, failed, cancelled, total, ... } }
   */
  router.get("/queue/stats", (_req, res) => {
    try {
      const stats = slicingQueue.getQueueStats();
      return res.json({ ok: true, data: stats });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        errorCode: "MP_QUEUE_STATS_FAILED",
        message: String(err?.message || err),
      });
    }
  });

  /**
   * DELETE /api/slicer/queue/:jobId
   *
   * Cancel a pending or processing job by ID.
   *
   * Response: { ok, data: { jobId, status: "cancelled" } }
   */
  router.delete("/queue/:jobId", (req, res) => {
    try {
      const jobId = String(req.params.jobId || "").trim();
      if (!jobId) {
        return res.status(400).json({
          ok: false,
          errorCode: "MP_BAD_REQUEST",
          message: "Missing jobId.",
        });
      }

      const result = slicingQueue.cancelJob(jobId);

      if (!result.ok) {
        const status = result.code === "MP_NOT_FOUND" ? 404 : 409;
        return res.status(status).json({
          ok: false,
          errorCode: result.code,
          message: result.message,
        });
      }

      return res.json({ ok: true, data: { jobId, status: "cancelled" } });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        errorCode: "MP_QUEUE_CANCEL_FAILED",
        message: String(err?.message || err),
      });
    }
  });

  // ----- 4. Cache Management -----

  /**
   * GET /api/slicer/cache
   *
   * Returns cache hit/miss statistics and size reporting.
   *
   * Response: { ok, data: { size, maxEntries, ttlMs, hits, misses, evictions, hitRate } }
   */
  router.get("/cache", (_req, res) => {
    try {
      const stats = slicerCache.getStats();
      return res.json({ ok: true, data: stats });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        errorCode: "MP_CACHE_STATS_FAILED",
        message: String(err?.message || err),
      });
    }
  });

  /**
   * DELETE /api/slicer/cache
   *
   * Clear all cached slicer results and reset statistics.
   *
   * Response: { ok, data: { cleared: true, previousSize } }
   */
  router.delete("/cache", (_req, res) => {
    try {
      const previousStats = slicerCache.getStats();
      const previousSize = previousStats.size;
      slicerCache.clear();

      return res.json({
        ok: true,
        data: {
          cleared: true,
          previousSize,
          message: `Cleared ${previousSize} cached entries.`,
        },
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        errorCode: "MP_CACHE_CLEAR_FAILED",
        message: String(err?.message || err),
      });
    }
  });

  return router;
}
