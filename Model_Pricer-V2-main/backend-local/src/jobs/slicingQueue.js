/**
 * slicingQueue.js — In-memory job queue for PrusaSlicer slicing jobs.
 *
 * Pure service module — no Express dependency.
 * Manages job lifecycle: queued -> processing -> completed/failed.
 *
 * Features:
 * - Concurrency limit (default: 2 simultaneous jobs)
 * - Priority queue (high priority jobs are processed before normal)
 * - FIFO ordering within same priority level
 * - Auto-cleanup of completed jobs after TTL
 * - Event emission for job state changes
 * - Cancellation support (including mid-processing)
 * - File-based persistence of pending jobs across server restarts
 * - Queue status reporting with detailed statistics
 */

import { EventEmitter } from "node:events";
import { nanoid } from "nanoid";
import fs from "node:fs/promises";
import path from "node:path";

/** @typedef {"queued"|"processing"|"completed"|"failed"|"cancelled"} JobStatus */
/** @typedef {"high"|"normal"} JobPriority */

/**
 * @typedef {Object} SlicingJob
 * @property {string} id - Unique job identifier
 * @property {JobStatus} status - Current job status
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} tenantId - Tenant that owns this job
 * @property {JobPriority} priority - Job priority level
 * @property {Object} config - Slicing configuration (modelPath, iniPath, presetId, etc.)
 * @property {string|null} jobDir - Workspace directory for this job
 * @property {Date} createdAt - When the job was submitted
 * @property {Date|null} startedAt - When processing began
 * @property {Date|null} completedAt - When the job finished (completed/failed/cancelled)
 * @property {Object|null} result - Slicing result on success
 * @property {string|null} error - Error message on failure
 * @property {string|null} errorCode - MP_* error code on failure
 * @property {number} queuePosition - Position in queue (0 = next to process, -1 = not queued)
 * @property {import("node:child_process").ChildProcess|null} _childProcess - Internal: running slicer process (for cancellation)
 */

const DEFAULT_CONCURRENCY = 2;
const DEFAULT_MAX_QUEUE_SIZE = 50;
const COMPLETED_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes
const PERSIST_FILENAME = "slicing-queue-state.json";

export class SlicingQueue extends EventEmitter {
  /**
   * @param {Object} options
   * @param {number} [options.concurrency=2] - Max simultaneous slicing jobs
   * @param {number} [options.maxQueueSize=50] - Max jobs waiting in queue
   * @param {number} [options.completedTtlMs=3600000] - TTL for completed jobs (ms)
   * @param {string} [options.persistDir] - Directory for queue state persistence (optional)
   */
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
    this.maxQueueSize = options.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE;
    this.completedTtlMs = options.completedTtlMs ?? COMPLETED_TTL_MS;
    this.persistDir = options.persistDir || null;

    /** @type {Map<string, SlicingJob>} */
    this._jobs = new Map();

    /** @type {string[]} — ordered list of queued job IDs (priority-sorted) */
    this._pendingQueue = [];

    /** @type {Set<string>} — currently processing job IDs */
    this._processing = new Set();

    // Auto-cleanup timer
    this._cleanupTimer = setInterval(() => this._cleanup(), CLEANUP_INTERVAL_MS);
    // Allow the process to exit even if the timer is still running
    if (this._cleanupTimer.unref) {
      this._cleanupTimer.unref();
    }
  }

  /**
   * Add a new slicing job to the queue.
   *
   * @param {Object} config - Slicing configuration
   * @param {string} config.tenantId - Tenant ID
   * @param {string} config.modelPath - Path to the uploaded model file
   * @param {string} config.modelOriginalName - Original filename
   * @param {string} [config.iniPath] - Path to INI profile
   * @param {string} [config.presetId] - Preset ID to resolve INI from
   * @param {string} [config.jobDir] - Workspace directory
   * @param {string} [config.jobOutputDir] - Output directory within jobDir
   * @param {JobPriority} [config.priority="normal"] - Job priority
   * @returns {{ ok: true, job: SlicingJob } | { ok: false, code: string, message: string }}
   */
  addJob(config) {
    // Guard: queue full
    if (this._pendingQueue.length >= this.maxQueueSize) {
      return {
        ok: false,
        code: "MP_QUEUE_FULL",
        message: `Queue is full (max ${this.maxQueueSize} pending jobs). Try again later.`,
      };
    }

    const priority = config.priority === "high" ? "high" : "normal";
    const id = `sqj-${nanoid(12)}`;

    /** @type {SlicingJob} */
    const job = {
      id,
      status: "queued",
      progress: 0,
      tenantId: config.tenantId,
      priority,
      config: { ...config },
      jobDir: config.jobDir || null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      errorCode: null,
      queuePosition: -1,
      _childProcess: null,
    };

    this._jobs.set(id, job);
    this._insertByPriority(id, priority);
    this._updateQueuePositions();

    // Persist queue state (fire-and-forget)
    this._persistState();

    // Try to process next job(s) immediately
    this._processNext();

    return { ok: true, job: this._toPublic(job) };
  }

  /**
   * Insert a job ID into the pending queue respecting priority ordering.
   * High priority jobs go before normal priority jobs but after
   * existing high priority jobs (FIFO within same priority).
   *
   * @param {string} jobId
   * @param {JobPriority} priority
   * @private
   */
  _insertByPriority(jobId, priority) {
    if (priority === "high") {
      // Find the index of the first normal-priority job
      let insertIdx = this._pendingQueue.length; // default: end
      for (let i = 0; i < this._pendingQueue.length; i++) {
        const existingJob = this._jobs.get(this._pendingQueue[i]);
        if (existingJob && existingJob.priority !== "high") {
          insertIdx = i;
          break;
        }
      }
      this._pendingQueue.splice(insertIdx, 0, jobId);
    } else {
      // Normal priority: append at end
      this._pendingQueue.push(jobId);
    }
  }

  /**
   * Update the queuePosition field for all queued jobs.
   * @private
   */
  _updateQueuePositions() {
    for (let i = 0; i < this._pendingQueue.length; i++) {
      const job = this._jobs.get(this._pendingQueue[i]);
      if (job) {
        job.queuePosition = i;
      }
    }
    // Reset position for non-queued jobs
    for (const job of this._jobs.values()) {
      if (job.status !== "queued") {
        job.queuePosition = -1;
      }
    }
  }

  /**
   * Get the public status of a job.
   *
   * @param {string} jobId
   * @returns {SlicingJob|null} Public job object (without internal fields) or null if not found
   */
  getJobStatus(jobId) {
    const job = this._jobs.get(jobId);
    if (!job) return null;
    return this._toPublic(job);
  }

  /**
   * Get aggregate queue statistics with detailed breakdown.
   *
   * @returns {{ queued: number, processing: number, completed: number, failed: number, cancelled: number, total: number, concurrency: number, maxQueueSize: number, highPriorityQueued: number, normalPriorityQueued: number }}
   */
  getQueueStats() {
    const stats = {
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      total: 0,
      concurrency: this.concurrency,
      maxQueueSize: this.maxQueueSize,
      highPriorityQueued: 0,
      normalPriorityQueued: 0,
    };

    for (const job of this._jobs.values()) {
      stats[job.status] = (stats[job.status] || 0) + 1;
      stats.total++;

      if (job.status === "queued") {
        if (job.priority === "high") {
          stats.highPriorityQueued++;
        } else {
          stats.normalPriorityQueued++;
        }
      }
    }

    return stats;
  }

  /**
   * Cancel a job. If queued, removes from queue. If processing, kills the child process.
   *
   * @param {string} jobId
   * @returns {{ ok: true } | { ok: false, code: string, message: string }}
   */
  cancelJob(jobId) {
    const job = this._jobs.get(jobId);
    if (!job) {
      return { ok: false, code: "MP_NOT_FOUND", message: `Job ${jobId} not found.` };
    }

    if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      return {
        ok: false,
        code: "MP_JOB_ALREADY_FINISHED",
        message: `Job ${jobId} is already ${job.status}.`,
      };
    }

    if (job.status === "queued") {
      // Remove from pending queue
      this._pendingQueue = this._pendingQueue.filter((id) => id !== jobId);
      this._updateQueuePositions();
    }

    if (job.status === "processing") {
      // Kill the running slicer process
      this._processing.delete(jobId);
      if (job._childProcess) {
        try {
          job._childProcess.kill();
        } catch {
          // Process may have already exited
        }
      }
    }

    job.status = "cancelled";
    job.completedAt = new Date();
    job.error = "Cancelled by user.";
    job.errorCode = "MP_JOB_CANCELLED";

    this.emit("job:cancelled", { jobId, tenantId: job.tenantId });

    // Persist queue state
    this._persistState();

    // Try to start next queued job since a slot opened up
    this._processNext();

    return { ok: true };
  }

  /**
   * Register the slicer execution function. This decouples the queue from
   * the actual slicing implementation (runPrusaSlicer, INI resolution, etc.).
   *
   * The executor receives (job) and must return a Promise that resolves with
   * { result, childProcess? } or rejects with an error.
   *
   * The executor can call job._updateProgress(percent) to report progress.
   *
   * @param {(job: SlicingJob, updateProgress: (pct: number) => void) => Promise<Object>} executor
   */
  setExecutor(executor) {
    this._executor = executor;
  }

  /**
   * Load persisted queue state from disk and re-queue pending jobs.
   * In-progress jobs from previous run are re-queued (they cannot be resumed).
   *
   * @param {string} [persistDir] - Override the persist directory
   * @returns {Promise<{ restored: number, skipped: number }>}
   */
  async loadPersistedState(persistDir) {
    const dir = persistDir || this.persistDir;
    if (!dir) return { restored: 0, skipped: 0 };

    const filePath = path.join(dir, PERSIST_FILENAME);
    let restored = 0;
    let skipped = 0;

    try {
      const raw = (await fs.readFile(filePath, "utf8")).trim();
      if (!raw) {
        // Empty file — start fresh, clean it up silently
        await fs.unlink(filePath).catch(() => {});
        return { restored: 0, skipped: 0 };
      }
      const state = JSON.parse(raw);

      if (!Array.isArray(state?.pendingJobs)) {
        return { restored: 0, skipped: 0 };
      }

      for (const savedJob of state.pendingJobs) {
        // Only restore jobs that were queued or processing (in-progress jobs become queued)
        if (!savedJob?.id || !savedJob?.config?.tenantId) {
          skipped++;
          continue;
        }

        // Check if model file still exists before re-queuing
        if (savedJob.config?.modelPath) {
          try {
            await fs.access(savedJob.config.modelPath);
          } catch {
            // Model file no longer exists — skip this job
            console.warn(`[slicingQueue] Skipping restored job ${savedJob.id} — model file not found: ${savedJob.config.modelPath}`);
            skipped++;
            continue;
          }
        }

        const result = this.addJob({
          ...savedJob.config,
          priority: savedJob.priority || "normal",
        });

        if (result.ok) {
          restored++;
          console.log(`[slicingQueue] Restored job from persistence: ${result.job.id} (was ${savedJob.id})`);
        } else {
          skipped++;
        }
      }

      // Clear the persistence file after successful restore
      await fs.unlink(filePath).catch(() => {});
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.warn(`[slicingQueue] Failed to load persisted queue state: ${err.message}`);
      }
      // ENOENT is expected on first run — no persisted state
    }

    return { restored, skipped };
  }

  /**
   * Try to start processing the next queued job(s) if there is capacity.
   * @private
   */
  _processNext() {
    while (this._processing.size < this.concurrency && this._pendingQueue.length > 0) {
      const jobId = this._pendingQueue.shift();
      const job = this._jobs.get(jobId);

      // Job could have been cancelled while waiting
      if (!job || job.status !== "queued") continue;

      this._updateQueuePositions();
      this._startJob(job);
    }
  }

  /**
   * Start processing a single job.
   * @param {SlicingJob} job
   * @private
   */
  async _startJob(job) {
    job.status = "processing";
    job.startedAt = new Date();
    job.progress = 0;
    job.queuePosition = -1;
    this._processing.add(job.id);

    // Persist state (job moved from queue to processing)
    this._persistState();

    this.emit("job:started", { jobId: job.id, tenantId: job.tenantId, priority: job.priority });

    if (!this._executor) {
      this._failJob(job, "No executor configured for slicing queue.", "MP_QUEUE_NO_EXECUTOR");
      return;
    }

    const updateProgress = (pct) => {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      if (clamped !== job.progress) {
        job.progress = clamped;
        this.emit("job:progress", { jobId: job.id, progress: clamped, tenantId: job.tenantId });
      }
    };

    try {
      const result = await this._executor(job, updateProgress);

      // Job may have been cancelled during execution
      if (job.status === "cancelled") return;

      job.status = "completed";
      job.progress = 100;
      job.completedAt = new Date();
      job.result = result;
      this._processing.delete(job.id);

      this.emit("job:completed", { jobId: job.id, tenantId: job.tenantId, result });
    } catch (err) {
      // Job may have been cancelled (kill causes an error)
      if (job.status === "cancelled") return;

      const errorCode = err.errorCode || "MP_SLICING_FAILED";
      this._failJob(job, String(err?.message || err), errorCode);
    }

    // Persist state after job completion
    this._persistState();

    // Process next queued job
    this._processNext();
  }

  /**
   * Mark a job as failed.
   * @param {SlicingJob} job
   * @param {string} errorMessage
   * @param {string} [errorCode="MP_SLICING_FAILED"]
   * @private
   */
  _failJob(job, errorMessage, errorCode = "MP_SLICING_FAILED") {
    job.status = "failed";
    job.completedAt = new Date();
    job.error = errorMessage;
    job.errorCode = errorCode;
    this._processing.delete(job.id);

    this.emit("job:failed", { jobId: job.id, tenantId: job.tenantId, error: errorMessage, errorCode });
  }

  /**
   * Remove completed/failed/cancelled jobs older than TTL.
   * @private
   */
  _cleanup() {
    const now = Date.now();
    for (const [id, job] of this._jobs) {
      if (
        (job.status === "completed" || job.status === "failed" || job.status === "cancelled") &&
        job.completedAt &&
        now - job.completedAt.getTime() > this.completedTtlMs
      ) {
        this._jobs.delete(id);
      }
    }
  }

  /**
   * Persist pending queue state to disk (fire-and-forget).
   * Only saves queued jobs — processing/completed/failed are not persisted.
   * @private
   */
  _persistState() {
    if (!this.persistDir) return;

    const pendingJobs = this._pendingQueue
      .map((id) => this._jobs.get(id))
      .filter((job) => job && job.status === "queued")
      .map((job) => ({
        id: job.id,
        priority: job.priority,
        config: job.config,
        createdAt: job.createdAt,
      }));

    const filePath = path.join(this.persistDir, PERSIST_FILENAME);
    const data = JSON.stringify({ savedAt: new Date().toISOString(), pendingJobs }, null, 2);

    fs.writeFile(filePath, data, "utf8").catch((err) => {
      console.warn(`[slicingQueue] Failed to persist queue state: ${err.message}`);
    });
  }

  /**
   * Return a public-safe copy of a job (strips internal fields like _childProcess).
   * @param {SlicingJob} job
   * @returns {Object}
   * @private
   */
  _toPublic(job) {
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      tenantId: job.tenantId,
      priority: job.priority,
      queuePosition: job.queuePosition,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
      errorCode: job.errorCode,
      // Include model name for UX
      modelName: job.config?.modelOriginalName || null,
    };
  }

  /**
   * Graceful shutdown — persist state, cancel all pending/processing jobs and clear timers.
   */
  shutdown() {
    // Persist before shutdown so pending jobs can be restored
    this._persistState();

    clearInterval(this._cleanupTimer);

    // Cancel all processing jobs
    for (const jobId of this._processing) {
      this.cancelJob(jobId);
    }

    // Cancel all queued jobs
    for (const jobId of [...this._pendingQueue]) {
      this.cancelJob(jobId);
    }
  }
}

// Singleton instance
export const slicingQueue = new SlicingQueue();
