/**
 * Stats API — order statistics, model metrics, and system usage endpoints.
 *
 * Endpoints:
 *   GET /api/stats/orders — Order statistics (count by status, revenue by period, avg order value)
 *   GET /api/stats/models — Model statistics (total sliced, avg print time, material usage)
 *   GET /api/stats/usage  — System usage (API calls estimate, storage, active tenants)
 *
 * Data sources: ordersStore.js (JSON file-based), slicerCache stats, slicingQueue stats.
 *
 * @module routes/stats
 */

import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  readOrdersState,
  normalizeStatus,
  ORDER_STATUSES,
} from "../ordersStore.js";

// ── Validation Schemas ──

const statsSchemas = {
  orders: {
    query: {
      period: {
        type: "string",
        enum: ["day", "week", "month", "year", "all"],
        label: "Time period",
      },
      dateFrom: { type: "string", label: "Date from (ISO)" },
      dateTo: { type: "string", label: "Date to (ISO)" },
    },
  },
};

/**
 * Creates the stats router.
 *
 * @param {{
 *   workspaceRoot: string,
 *   getTenantIdFromReq: (req) => string,
 *   getCacheStats?: () => object,
 *   getQueueStats?: () => object,
 * }} opts
 * @returns {Router}
 */
export function createStatsRouter({ workspaceRoot, getTenantIdFromReq, getCacheStats, getQueueStats }) {
  const router = Router();

  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message) {
    return res.status(status).json({ ok: false, errorCode, message });
  }

  /**
   * Get the start of a period relative to now.
   * @param {string} period — "day", "week", "month", "year", "all"
   * @returns {Date}
   */
  function getPeriodStart(period) {
    const now = new Date();
    switch (period) {
      case "day":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "week": {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        return d;
      }
      case "month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "year":
        return new Date(now.getFullYear(), 0, 1);
      case "all":
      default:
        return new Date(0);
    }
  }

  // ───────────────────────────────────────────────────
  // GET /api/stats/orders — Order statistics
  // ───────────────────────────────────────────────────
  /**
   * Returns order counts by status, revenue breakdown by period,
   * average order value, and recent order trends.
   *
   * Query params:
   *   ?period=month  — Filter stats to this period (day/week/month/year/all). Default: all.
   *   ?dateFrom=ISO  — Custom date range start (overrides period).
   *   ?dateTo=ISO    — Custom date range end.
   */
  router.get("/orders", validate(statsSchemas.orders), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const state = await readOrdersState(workspaceRoot, tenantId);
      const allOrders = state.orders.filter((o) => !o._deleted);

      // Determine date filter
      const period = req.query.period || "all";
      let dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : getPeriodStart(period);
      let dateTo = req.query.dateTo ? new Date(req.query.dateTo) : new Date();

      const filtered = allOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= dateFrom.getTime() && t <= dateTo.getTime();
      });

      // Count by status
      const byStatus = {};
      for (const s of [...ORDER_STATUSES, "cancelled"]) {
        byStatus[s] = 0;
      }
      for (const order of filtered) {
        const ns = normalizeStatus(order.status);
        if (byStatus[ns] !== undefined) byStatus[ns]++;
      }

      // Revenue calculations
      let totalRevenue = 0;
      let completedRevenue = 0;
      let completedCount = 0;
      const revenueByDay = {};

      for (const order of filtered) {
        const price = Number(order.totalPrice) || 0;
        totalRevenue += price;

        const ns = normalizeStatus(order.status);
        if (ns === "completed") {
          completedRevenue += price;
          completedCount++;
        }

        // Group revenue by day for trend data
        const day = order.createdAt ? order.createdAt.slice(0, 10) : "unknown";
        if (!revenueByDay[day]) {
          revenueByDay[day] = { date: day, revenue: 0, count: 0 };
        }
        revenueByDay[day].revenue += price;
        revenueByDay[day].count++;
      }

      const avgOrderValue = filtered.length > 0
        ? Math.round((totalRevenue / filtered.length) * 100) / 100
        : 0;

      const avgCompletedValue = completedCount > 0
        ? Math.round((completedRevenue / completedCount) * 100) / 100
        : 0;

      // Sort trend data by date
      const trend = Object.values(revenueByDay).sort((a, b) => a.date.localeCompare(b.date));

      return ok(res, {
        period,
        dateRange: { from: dateFrom.toISOString(), to: dateTo.toISOString() },
        totalOrders: filtered.length,
        totalOrdersAllTime: allOrders.length,
        byStatus,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        completedRevenue: Math.round(completedRevenue * 100) / 100,
        avgOrderValue,
        avgCompletedValue,
        currency: allOrders[0]?.currency || "CZK",
        trend,
      });
    } catch (e) {
      return fail(res, 500, "MP_STATS_ORDERS_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/stats/models — Model / slicing statistics
  // ───────────────────────────────────────────────────
  /**
   * Returns model/slicing statistics aggregated from order items.
   * Tracks total models sliced, average print time, material usage, etc.
   */
  router.get("/models", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const state = await readOrdersState(workspaceRoot, tenantId);
      const allOrders = state.orders.filter((o) => !o._deleted);

      let totalModels = 0;
      let totalPrintTimeMin = 0;
      let totalFilamentG = 0;
      let totalFilamentM = 0;
      let modelsWithPrintTime = 0;
      const materialCounts = {};

      for (const order of allOrders) {
        // Count items and models
        const items = [...(order.items || []), ...(order.models || [])];
        totalModels += items.length;

        for (const item of items) {
          // Aggregate print time (stored in minutes or seconds depending on source)
          const printTime = Number(item.printTimeMin || item.printTime || 0);
          if (printTime > 0) {
            totalPrintTimeMin += printTime;
            modelsWithPrintTime++;
          }

          // Aggregate filament usage
          const filamentG = Number(item.filamentUsedG || item.materialWeight || 0);
          if (filamentG > 0) totalFilamentG += filamentG;

          const filamentM = Number(item.filamentUsedM || item.filamentLength || 0);
          if (filamentM > 0) totalFilamentM += filamentM;

          // Count material types
          const material = item.material || item.materialName || "unknown";
          materialCounts[material] = (materialCounts[material] || 0) + 1;
        }
      }

      const avgPrintTimeMin = modelsWithPrintTime > 0
        ? Math.round((totalPrintTimeMin / modelsWithPrintTime) * 10) / 10
        : 0;

      // Sort materials by usage count
      const topMaterials = Object.entries(materialCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return ok(res, {
        totalModelsSliced: totalModels,
        totalOrders: allOrders.length,
        avgModelsPerOrder: allOrders.length > 0
          ? Math.round((totalModels / allOrders.length) * 10) / 10
          : 0,
        printTime: {
          totalMinutes: Math.round(totalPrintTimeMin * 10) / 10,
          totalHours: Math.round((totalPrintTimeMin / 60) * 10) / 10,
          avgMinutesPerModel: avgPrintTimeMin,
        },
        filament: {
          totalGrams: Math.round(totalFilamentG * 10) / 10,
          totalMeters: Math.round(totalFilamentM * 10) / 10,
        },
        topMaterials,
      });
    } catch (e) {
      return fail(res, 500, "MP_STATS_MODELS_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/stats/usage — System usage statistics
  // ───────────────────────────────────────────────────
  /**
   * Returns system usage info: slicer cache stats, queue stats,
   * process uptime, memory usage. Does not expose sensitive paths.
   */
  router.get("/usage", async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);

      // Slicer cache stats (if available)
      const cacheStats = getCacheStats ? getCacheStats() : null;

      // Queue stats (if available)
      const queueStats = getQueueStats ? getQueueStats() : null;

      // Process info (safe subset)
      const memUsage = process.memoryUsage();

      return ok(res, {
        tenantId,
        uptime: {
          seconds: Math.round(process.uptime()),
          formatted: formatUptime(process.uptime()),
        },
        memory: {
          heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 10) / 10,
          heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 10) / 10,
          rssMB: Math.round(memUsage.rss / 1024 / 1024 * 10) / 10,
        },
        slicerCache: cacheStats || { available: false },
        slicingQueue: queueStats || { available: false },
      });
    } catch (e) {
      return fail(res, 500, "MP_STATS_USAGE_FAILED", String(e?.message || e));
    }
  });

  return router;
}

/**
 * Format seconds into a human-readable uptime string.
 * @param {number} seconds
 * @returns {string}
 */
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

export default createStatsRouter;
