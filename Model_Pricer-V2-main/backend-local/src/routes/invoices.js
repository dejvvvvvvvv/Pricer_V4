/**
 * Invoices API — invoice generation, retrieval, and PDF download for orders.
 *
 * Endpoints:
 *   GET  /api/invoices/:orderId          — Get existing invoice JSON for an order
 *   GET  /api/invoices/:orderId/pdf      — Download invoice as PDF
 *   POST /api/invoices/:orderId/generate — Generate a new invoice for an order
 *
 * Storage: JSON files per tenant at {workspace}/invoices/{tenantId}/{orderId}.json
 *
 * @module routes/invoices
 */

import { Router } from "express";
import { logInfo, logError } from "../util/logger.js";
import fs from "node:fs/promises";
import path from "node:path";
import { validate } from "../middleware/validate.js";
import { getOrder } from "../ordersStore.js";
import { generateInvoicePdf, buildInvoiceDataFromOrder } from "../services/invoiceService.js";

/**
 * Assert that a resolved path stays within the given base directory.
 * Throws a 400 error if a path traversal is detected.
 *
 * @param {string} resolvedPath
 * @param {string} base
 */
function assertInWorkspace(resolvedPath, base) {
  const abs = path.resolve(resolvedPath);
  const absBase = path.resolve(base);
  if (!abs.startsWith(absBase + path.sep) && abs !== absBase) {
    const err = new Error("Path traversal detected");
    err.status = 400;
    throw err;
  }
}

/**
 * Validate that an orderId contains no path traversal characters.
 * Rejects values containing '..', '/', or '\'.
 *
 * @param {string} orderId
 */
function validateOrderId(orderId) {
  if (!orderId || typeof orderId !== "string" || /[/\\]/.test(orderId) || orderId.includes("..")) {
    const err = new Error("Invalid order ID");
    err.status = 400;
    throw err;
  }
}

/**
 * Validate that a tenantId contains no path traversal characters.
 * Rejects values containing '.', '/', or '\'.
 *
 * @param {string} tenantId
 */
function validateTenantId(tenantId) {
  if (!tenantId || typeof tenantId !== "string" || /[./\\]/.test(tenantId)) {
    const err = new Error("Invalid tenant ID");
    err.status = 400;
    throw err;
  }
}

// ── Validation Schemas ──

const invoiceSchemas = {
  byOrderId: {
    params: {
      orderId: { type: "string", required: true, minLength: 1, maxLength: 100, label: "Order ID" },
    },
  },
};

/**
 * Creates the invoices router.
 *
 * @param {{ workspaceRoot: string, getTenantIdFromReq: (req) => string }} opts
 * @returns {Router}
 */
export function createInvoicesRouter({ workspaceRoot, getTenantIdFromReq }) {
  const router = Router();

  function ok(res, data) {
    return res.json({ ok: true, data });
  }

  function fail(res, status, errorCode, message, details) {
    return res.status(status).json({ ok: false, errorCode, message, details });
  }

  /**
   * Get invoice directory path for a tenant.
   * Guards against path traversal via tenantId.
   */
  function invoiceDir(tenantId) {
    validateTenantId(tenantId);
    const dir = path.join(workspaceRoot, "invoices", tenantId);
    assertInWorkspace(dir, path.join(workspaceRoot, "invoices"));
    return dir;
  }

  /**
   * Get invoice file path for an order.
   * Guards against path traversal via orderId.
   */
  function invoicePath(tenantId, orderId) {
    validateOrderId(orderId);
    const dir = invoiceDir(tenantId);
    const filePath = path.join(dir, `${orderId}.json`);
    assertInWorkspace(filePath, dir);
    return filePath;
  }

  // ───────────────────────────────────────────────────
  // GET /api/invoices/:orderId/pdf — Download invoice as PDF
  // (Must be registered BEFORE /:orderId to avoid param capture)
  // ───────────────────────────────────────────────────
  router.get("/:orderId/pdf", validate(invoiceSchemas.byOrderId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const orderId = String(req.params.orderId).trim();

      // Load the order
      const order = await getOrder(workspaceRoot, tenantId, orderId);
      if (!order) {
        return fail(res, 404, "MP_NOT_FOUND", `Order ${orderId} not found`);
      }

      // Load existing invoice JSON if available (for invoice number consistency)
      let existingInvoice = null;
      try {
        const raw = await fs.readFile(invoicePath(tenantId, orderId), "utf8");
        existingInvoice = JSON.parse(raw);
      } catch {
        // No existing invoice — will generate fresh
      }

      // Build tenant config from env vars (in production these come from tenant storage)
      const tenantCfg = {
        companyName: process.env.INVOICE_COMPANY_NAME || '',
        companyAddress: process.env.INVOICE_COMPANY_ADDRESS || '',
        companyIco: process.env.INVOICE_COMPANY_ICO || '',
        companyDic: process.env.INVOICE_COMPANY_DIC || '',
        bankAccount: process.env.INVOICE_BANK_ACCOUNT || '',
        bankIban: process.env.INVOICE_BANK_IBAN || '',
        vatPayer: process.env.INVOICE_VAT_PAYER === 'true',
      };

      // If we have an existing invoice, use its invoice number
      const orderForPdf = existingInvoice
        ? { ...order, invoiceNumber: existingInvoice.invoiceNumber }
        : order;

      const invoiceData = buildInvoiceDataFromOrder(orderForPdf, tenantCfg);

      const pdfBuffer = await generateInvoicePdf(invoiceData);

      const filename = `faktura-${invoiceData.invoiceNumber}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      return res.send(pdfBuffer);
    } catch (e) {
      logError(`[invoices] PDF generation failed: ${e.message}`);
      const status = e.code === "MP_DEPENDENCY_MISSING" ? 501 : 500;
      return fail(res, status, e.code || "MP_PDF_FAILED", `PDF generation failed: ${e.message}`);
    }
  });

  // ───────────────────────────────────────────────────
  // GET /api/invoices/:orderId — Get invoice JSON for order
  // ───────────────────────────────────────────────────
  router.get("/:orderId", validate(invoiceSchemas.byOrderId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const orderId = String(req.params.orderId).trim();

      const filePath = invoicePath(tenantId, orderId);
      try {
        const raw = await fs.readFile(filePath, "utf8");
        const invoice = JSON.parse(raw);
        return ok(res, invoice);
      } catch (e) {
        if (e.code === "ENOENT") {
          return fail(res, 404, "MP_NOT_FOUND", `Invoice not found for order ${orderId}`);
        }
        throw e;
      }
    } catch (e) {
      return fail(res, 500, "MP_INVOICE_READ_FAILED", String(e?.message || e));
    }
  });

  // ───────────────────────────────────────────────────
  // POST /api/invoices/:orderId/generate — Generate invoice
  // ───────────────────────────────────────────────────
  router.post("/:orderId/generate", validate(invoiceSchemas.byOrderId), async (req, res) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      const orderId = String(req.params.orderId).trim();

      // Load the order to generate invoice from
      const order = await getOrder(workspaceRoot, tenantId, orderId);
      if (!order) {
        return fail(res, 404, "MP_NOT_FOUND", `Order ${orderId} not found`);
      }

      // Generate invoice data
      const now = new Date();
      const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${orderId.slice(-6).toUpperCase()}`;

      const invoice = {
        invoiceNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        tenantId,
        status: "generated",
        generatedAt: now.toISOString(),
        customer: {
          name: order.customerName || "",
          email: order.customerEmail || "",
          phone: order.customerPhone || "",
          address: order.shippingAddress || order.customerAddress || "",
        },
        items: (order.items || order.models || []).map((item, idx) => ({
          position: idx + 1,
          name: item.name || item.modelName || `Item ${idx + 1}`,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          totalPrice: (item.quantity || 1) * (item.unitPrice || item.price || 0),
        })),
        subtotal: order.subtotal || order.totalPrice || 0,
        fees: order.fees || [],
        totalPrice: order.totalPrice || 0,
        currency: order.currency || "CZK",
        notes: order.notes || "",
      };

      // Save invoice to file
      const dir = invoiceDir(tenantId);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(invoicePath(tenantId, orderId), JSON.stringify(invoice, null, 2), "utf8");

      logInfo(`[invoices] Generated invoice ${invoiceNumber} for order ${orderId} (tenant ${tenantId})`);
      return res.status(201).json({ ok: true, data: invoice });
    } catch (e) {
      return fail(res, 500, "MP_INVOICE_GENERATE_FAILED", String(e?.message || e));
    }
  });

  return router;
}

export default createInvoicesRouter;
