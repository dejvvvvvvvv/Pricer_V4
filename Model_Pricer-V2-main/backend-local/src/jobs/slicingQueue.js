/**
 * slicingQueue.js — In-memory job queue for PrusaSlicer slicing jobs.
 *
 * Pure service module — no Express dependency.
 * Manages job lifecycle: queued -> processing -> completed/failed.
 *
 * Features:
 * - Concurrency limit (default: 2 simultaneous jobs)
 * - FIFO ordering
 * - Auto-cleanup of completed jobs after TTL
 * - Event emission for job state changes
 * - Cancellation support (including mid-processing)
 */

import { EventEmitter } from "node:events";
import { nanoid } from "nanoid";

/** @typedef {"queued"|"processing"|"completed"|"failed"|"cancelled"} JobStatus */

/**
 * @typedef {Object} SlicingJob
 * @property {string} id - Unique job identifier
 * @property {JobStatus} status - Current job status
 * @property {number} progress - Progress percentage (0-100)
 * @property {string} tenantId - Tenant that owns this job
 * @property {Object} config - Slicing configuration (modelPath, iniPath, presetId, etc.)
 * @property {string|null} jobDir - Workspace directory for this job
 * @property {Date} createdAt - When the job was submitted
 * @property {Date|null} startedAt - When processing began
 * @property {Date|null} completedAt - When the job finished (completed/failed/cancelled)
 * @property {Object|null} result - Slicing result on success
 * @property {string|null} error - Error message on failure
 * @property {import("node:child_process").ChildProcess|null} _childProcess - Internal: running slicer process (for cancellation)
 */

const DEFAULT_CONCURRENCY = 2;
const DEFAULT_MAX_QUEUE_SIZE = 50;
const COMPLETED_TTL_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes

export class SlicingQueue extends EventEmitter {
  /**
   * @param {Object} options
   * @param {number} [options.concurrency=2] - Max simultaneous slicing jobs
   * @param {number} [options.maxQueueSize=50] - Max jobs waiting in queue
   * @param {number} [options.completedTtlMs=3600000] - TTL for completed jobs (ms)
   */
  constructor(options = {}) {
    super();
    this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
    this.maxQueueSize = options.maxQueueSize ?? DEFAULT_MAX_QUEUE_SIZE;
    this.completedTtlMs = options.completedTtlMs ?? COMPLETED_TTL_MS;

    /** @type {Map<string, SlicingJob>} */
    this._jobs = new Map();

    /** @type {string[]} — ordered list of queued job IDs */
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

    const id = `sqj-${nanoid(12)}`;

    /** @type {SlicingJob} */
    const job = {
      id,
      status: "queued",
      progress: 0,
      tenantId: config.tenantId,
      config: { ...config },
      jobDir: config.jobDir || null,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
      _childProcess: null,
    };

    this._jobs.set(id, job);
    this._pendingQueue.push(id);

    // Try to process next job(s) immediately
    this._processNext();

    return { ok: true, job: this._toPublic(job) };
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
   * Get aggregate queue statistics.
   *
   * @returns {{ queued: number, processing: number, completed: number, failed: number, cancelled: number, total: number }}
   */
  getQueueStats() {
    const stats = { queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0, total: 0 };
    for (const job of this._jobs.values()) {
      stats[job.status] = (stats[job.status] || 0) + 1;
      stats.total++;
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

    this.emit("job:cancelled", { jobId, tenantId: job.tenantId });

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
   * Try to start processing the next queued job(s) if there is capacity.
   * @private
   */
  _processNext() {
    while (this._processing.size < this.concurrency && this._pendingQueue.length > 0) {
      const jobId = this._pendingQueue.shift();
      const job = this._jobs.get(jobId);

      // Job could have been cancelled while waiting
      if (!job || job.status !== "queued") continue;

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
    this._processing.add(job.id);

    this.emit("job:started", { jobId: job.id, tenantId: job.tenantId });

    if (!this._executor) {
      this._failJob(job, "No executor configured for slicing queue.");
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

      this._failJob(job, String(err?.message || err));
    }

    // Process next queued job
    this._processNext();
  }

  /**
   * Mark a job as failed.
   * @param {SlicingJob} job
   * @param {string} errorMessage
   * @private
   */
  _failJob(job, errorMessage) {
    job.status = "failed";
    job.completedAt = new Date();
    job.error = errorMessage;
    this._processing.delete(job.id);

    this.emit("job:failed", { jobId: job.id, tenantId: job.tenantId, error: errorMessage });
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
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
      // Include model name for UX
      modelName: job.config?.modelOriginalName || null,
    };
  }

  /**
   * Graceful shutdown — cancel all pending/processing jobs and clear timers.
   */
  shutdown() {
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
