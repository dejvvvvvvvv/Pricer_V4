/*
  Invoice Storage — Tenant-scoped localStorage
  ----------------------------------------------
  Stores invoice records linked to orders.

  Namespace: invoices:v1
  Key format: modelpricer:<tenantId>:invoices:v1

  Public API:
    - saveInvoice(orderId, invoiceData)
    - getInvoice(orderId)
    - listInvoices()
    - updateInvoiceStatus(orderId, status)
    - deleteInvoice(orderId)
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_INVOICES = 'invoices:v1';

/**
 * Invoice statuses.
 */
export const INVOICE_STATUSES = ['draft', 'issued', 'sent', 'paid', 'canceled'];

/**
 * Read all invoices from tenant storage.
 * @returns {Object} Map of orderId -> invoiceRecord
 */
function readAll() {
  return readTenantJson(NS_INVOICES, {});
}

/**
 * Write all invoices to tenant storage.
 */
function writeAll(data) {
  writeTenantJson(NS_INVOICES, data);
}

/**
 * Save/create an invoice for a given order.
 *
 * @param {string} orderId
 * @param {Object} invoiceData
 * @param {string} invoiceData.invoiceNumber
 * @param {string} invoiceData.issueDate - ISO string
 * @param {string} invoiceData.dueDate - ISO string
 * @param {string} [invoiceData.status] - One of INVOICE_STATUSES (default 'issued')
 * @param {string} [invoiceData.htmlContent] - Generated HTML (optional, can be regenerated)
 * @param {number} [invoiceData.totalAmount]
 * @param {string} [invoiceData.vatRate]
 * @param {string} [invoiceData.bankAccount]
 * @param {string} [invoiceData.iban]
 * @returns {Object} The saved invoice record
 */
export function saveInvoice(orderId, invoiceData) {
  if (!orderId) throw new Error('orderId is required');

  const all = readAll();
  const existing = all[orderId] || {};

  const record = {
    ...existing,
    orderId,
    invoiceNumber: invoiceData.invoiceNumber || existing.invoiceNumber || '',
    issueDate: invoiceData.issueDate || existing.issueDate || new Date().toISOString(),
    dueDate: invoiceData.dueDate || existing.dueDate || '',
    status: invoiceData.status || existing.status || 'issued',
    htmlContent: invoiceData.htmlContent ?? existing.htmlContent ?? '',
    totalAmount: invoiceData.totalAmount ?? existing.totalAmount ?? 0,
    vatRate: invoiceData.vatRate ?? existing.vatRate ?? '',
    bankAccount: invoiceData.bankAccount ?? existing.bankAccount ?? '',
    iban: invoiceData.iban ?? existing.iban ?? '',
    created_at: existing.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  all[orderId] = record;
  writeAll(all);
  return record;
}

/**
 * Get invoice for a specific order.
 * @param {string} orderId
 * @returns {Object|null}
 */
export function getInvoice(orderId) {
  if (!orderId) return null;
  const all = readAll();
  return all[orderId] || null;
}

/**
 * List all invoices, sorted by created_at desc.
 * @returns {Array}
 */
export function listInvoices() {
  const all = readAll();
  return Object.values(all).sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || '')
  );
}

/**
 * Update the status of an invoice.
 * @param {string} orderId
 * @param {string} status - One of INVOICE_STATUSES
 * @returns {Object|null} Updated record or null if not found
 */
export function updateInvoiceStatus(orderId, status) {
  if (!orderId || !status) return null;
  const all = readAll();
  if (!all[orderId]) return null;

  all[orderId].status = status;
  all[orderId].updated_at = new Date().toISOString();
  if (status === 'paid') {
    all[orderId].paidAt = new Date().toISOString();
  }
  writeAll(all);
  return all[orderId];
}

/**
 * Delete an invoice.
 * @param {string} orderId
 */
export function deleteInvoice(orderId) {
  if (!orderId) return;
  const all = readAll();
  delete all[orderId];
  writeAll(all);
}
