/*
  Admin Print Queue — Tenant-scoped Storage
  ------------------------------------------
  Purpose:
  - Manage print queue ordering (priority) for orders in PRINTING status.
  - Track print progress (manual % or timer-based estimate).
  - Persist print start times, completion times for production stats.

  Notes:
  - No backend dependency — localStorage only via tenant storage helpers.
  - Queue order is an array of order IDs (top = highest priority).
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_PRINT_QUEUE = 'print-queue:v1';
const NS_PRINT_STATS = 'print-stats:v1';

function nowIso() {
  return new Date().toISOString();
}

// ─── Queue Order ────────────────────────────────────────────────

/**
 * Load the print queue config.
 * Returns { queue: string[], progress: Record<string, ProgressEntry> }
 */
export function loadPrintQueue() {
  const stored = readTenantJson(NS_PRINT_QUEUE, null);
  if (stored && typeof stored === 'object') {
    return {
      queue: Array.isArray(stored.queue) ? stored.queue : [],
      progress: stored.progress && typeof stored.progress === 'object' ? stored.progress : {},
    };
  }
  return { queue: [], progress: {} };
}

/**
 * Save the print queue config.
 */
export function savePrintQueue(data) {
  writeTenantJson(NS_PRINT_QUEUE, {
    queue: Array.isArray(data.queue) ? data.queue : [],
    progress: data.progress && typeof data.progress === 'object' ? data.progress : {},
    updated_at: nowIso(),
  });
}

/**
 * Reorder queue: move orderId from one index to another.
 */
export function reorderQueue(queue, fromIndex, toIndex) {
  const next = [...queue];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

/**
 * Add an order to the queue (if not already present). Appends at the end.
 */
export function addToQueue(queue, orderId) {
  if (queue.includes(orderId)) return queue;
  return [...queue, orderId];
}

/**
 * Remove an order from the queue.
 */
export function removeFromQueue(queue, orderId) {
  return queue.filter((id) => id !== orderId);
}

// ─── Progress Tracking ──────────────────────────────────────────

/**
 * ProgressEntry shape:
 * {
 *   orderId: string,
 *   status: 'queued' | 'printing' | 'paused' | 'completed',
 *   manualPercent: number | null,      // 0-100, set by admin
 *   manualPercentAt: string | null,    // ISO timestamp when manual % was set
 *   startedAt: string | null,          // ISO timestamp when print started
 *   pausedAt: string | null,           // ISO timestamp when paused
 *   pausedDurationMs: number,          // total ms spent paused
 *   completedAt: string | null,        // ISO timestamp when completed
 *   estimatedTimeMin: number,          // from slicer data
 * }
 */

export function getDefaultProgress(orderId, estimatedTimeMin = 0) {
  return {
    orderId,
    status: 'queued',
    manualPercent: null,
    manualPercentAt: null,
    startedAt: null,
    pausedAt: null,
    pausedDurationMs: 0,
    completedAt: null,
    estimatedTimeMin: estimatedTimeMin || 0,
  };
}

/**
 * Calculate the current progress percentage.
 * Uses whichever is more recent: manual input or timer estimate.
 */
export function calculateProgress(entry) {
  if (!entry) return 0;
  if (entry.status === 'completed') return 100;
  if (entry.status === 'queued') return 0;

  const now = Date.now();

  // Timer-based progress
  let timerPercent = 0;
  let timerTimestamp = 0;
  if (entry.startedAt && entry.estimatedTimeMin > 0) {
    const startMs = new Date(entry.startedAt).getTime();
    const totalMs = entry.estimatedTimeMin * 60 * 1000;
    let elapsedMs = now - startMs - (entry.pausedDurationMs || 0);
    if (entry.status === 'paused' && entry.pausedAt) {
      elapsedMs -= (now - new Date(entry.pausedAt).getTime());
    }
    timerPercent = Math.min(99, Math.max(0, (elapsedMs / totalMs) * 100));
    timerTimestamp = startMs; // timer is always "as of now"
  }

  // Manual progress
  let manualPercent = 0;
  let manualTimestamp = 0;
  if (entry.manualPercent != null && entry.manualPercentAt) {
    manualPercent = entry.manualPercent;
    manualTimestamp = new Date(entry.manualPercentAt).getTime();
  }

  // Use whichever is more recent
  // For timer, we consider it always "current" (timestamp = now)
  // For manual, use the timestamp of when it was set
  // If manual was set after timer started and manual > timer, use manual
  if (manualTimestamp > 0 && manualPercent > timerPercent) {
    return Math.round(manualPercent);
  }

  return Math.round(timerPercent);
}

/**
 * Get elapsed time in minutes since print started (excluding paused time).
 */
export function getElapsedMinutes(entry) {
  if (!entry || !entry.startedAt) return 0;

  const now = entry.completedAt ? new Date(entry.completedAt).getTime() : Date.now();
  const startMs = new Date(entry.startedAt).getTime();
  let elapsedMs = now - startMs - (entry.pausedDurationMs || 0);

  if (entry.status === 'paused' && entry.pausedAt) {
    elapsedMs -= (now - new Date(entry.pausedAt).getTime());
  }

  return Math.max(0, elapsedMs / 60000);
}

/**
 * Get estimated completion time as a Date, or null if not available.
 */
export function getEstimatedCompletion(entry) {
  if (!entry || !entry.startedAt || !entry.estimatedTimeMin || entry.status === 'completed') return null;

  const startMs = new Date(entry.startedAt).getTime();
  const totalMs = entry.estimatedTimeMin * 60 * 1000;
  let completionMs = startMs + totalMs + (entry.pausedDurationMs || 0);

  if (entry.status === 'paused' && entry.pausedAt) {
    completionMs += (Date.now() - new Date(entry.pausedAt).getTime());
  }

  return new Date(completionMs);
}

// ─── Actions ────────────────────────────────────────────────────

export function startPrint(progress, orderId, estimatedTimeMin) {
  const entry = progress[orderId] || getDefaultProgress(orderId, estimatedTimeMin);
  return {
    ...progress,
    [orderId]: {
      ...entry,
      status: 'printing',
      startedAt: entry.startedAt || nowIso(),
      pausedAt: null,
      estimatedTimeMin: estimatedTimeMin || entry.estimatedTimeMin,
    },
  };
}

export function pausePrint(progress, orderId) {
  const entry = progress[orderId];
  if (!entry || entry.status !== 'printing') return progress;
  return {
    ...progress,
    [orderId]: {
      ...entry,
      status: 'paused',
      pausedAt: nowIso(),
    },
  };
}

export function resumePrint(progress, orderId) {
  const entry = progress[orderId];
  if (!entry || entry.status !== 'paused') return progress;
  const pausedMs = entry.pausedAt ? Date.now() - new Date(entry.pausedAt).getTime() : 0;
  return {
    ...progress,
    [orderId]: {
      ...entry,
      status: 'printing',
      pausedAt: null,
      pausedDurationMs: (entry.pausedDurationMs || 0) + pausedMs,
    },
  };
}

export function completePrint(progress, orderId) {
  const entry = progress[orderId];
  if (!entry) return progress;
  let pausedDuration = entry.pausedDurationMs || 0;
  if (entry.status === 'paused' && entry.pausedAt) {
    pausedDuration += Date.now() - new Date(entry.pausedAt).getTime();
  }
  return {
    ...progress,
    [orderId]: {
      ...entry,
      status: 'completed',
      completedAt: nowIso(),
      pausedAt: null,
      pausedDurationMs: pausedDuration,
      manualPercent: 100,
      manualPercentAt: nowIso(),
    },
  };
}

export function setManualProgress(progress, orderId, percent) {
  const entry = progress[orderId] || getDefaultProgress(orderId);
  return {
    ...progress,
    [orderId]: {
      ...entry,
      manualPercent: Math.max(0, Math.min(100, Number(percent) || 0)),
      manualPercentAt: nowIso(),
    },
  };
}

// ─── Production Stats ───────────────────────────────────────────

/**
 * Load production stats log.
 * Array of { orderId, completedAt, printTimeMin }
 */
export function loadPrintStats() {
  return readTenantJson(NS_PRINT_STATS, []);
}

/**
 * Save production stats log.
 */
export function savePrintStats(stats) {
  writeTenantJson(NS_PRINT_STATS, Array.isArray(stats) ? stats.slice(0, 500) : []);
}

/**
 * Log a completed print to stats.
 */
export function logCompletedPrint(orderId, printTimeMin) {
  const stats = loadPrintStats();
  const entry = {
    orderId,
    completedAt: nowIso(),
    printTimeMin: Math.round(printTimeMin * 100) / 100,
  };
  const next = [entry, ...stats].slice(0, 500);
  savePrintStats(next);
  return next;
}

/**
 * Calculate production stats for today.
 */
export function calculateTodayStats(stats, queueLength, totalEstimatedMin) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const todayCompletions = (stats || []).filter(
    (s) => s.completedAt && new Date(s.completedAt).getTime() >= todayStartMs
  );

  const completedCount = todayCompletions.length;
  const totalPrintTimeMin = todayCompletions.reduce((sum, s) => sum + (s.printTimeMin || 0), 0);

  // Utilization = printing time / elapsed hours today * 100
  const hoursElapsedToday = Math.max(0.1, (Date.now() - todayStartMs) / 3600000);
  const printTimeHours = totalPrintTimeMin / 60;
  const utilization = Math.min(100, Math.round((printTimeHours / hoursElapsedToday) * 100));

  return {
    completedToday: completedCount,
    queueLength,
    estimatedRemainingMin: Math.round(totalEstimatedMin),
    utilizationPercent: utilization,
    totalPrintTimeToday: Math.round(totalPrintTimeMin),
  };
}
