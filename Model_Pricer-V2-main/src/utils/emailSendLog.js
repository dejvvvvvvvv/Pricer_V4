/*
  Email Send Log — Tenant-scoped localStorage
  ---------------------------------------------
  Records simulated email sends per order.

  Namespace: email-send-log:v1
  Key format: modelpricer:<tenantId>:email-send-log:v1

  Public API:
    - logEmailSent(orderId, entry) — record a sent email
    - getEmailLog(orderId) — get all sent emails for an order
    - getAllEmailLogs() — get all email logs
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_EMAIL_LOG = 'email-send-log:v1';

function readAll() {
  return readTenantJson(NS_EMAIL_LOG, {});
}

function writeAll(data) {
  writeTenantJson(NS_EMAIL_LOG, data);
}

/**
 * Log a simulated email send.
 *
 * @param {string} orderId
 * @param {Object} entry
 * @param {string} entry.templateId - Which template was used
 * @param {string} entry.templateName - Human-readable template name
 * @param {string} entry.recipientEmail - Recipient address
 * @param {string} entry.subject - Email subject (rendered)
 * @param {boolean} [entry.hasInvoice] - Whether invoice was attached
 * @returns {Object} The log entry with timestamp
 */
export function logEmailSent(orderId, entry) {
  if (!orderId) return null;

  const all = readAll();
  if (!all[orderId]) all[orderId] = [];

  const record = {
    id: `eml-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    templateId: entry.templateId || '',
    templateName: entry.templateName || '',
    recipientEmail: entry.recipientEmail || '',
    subject: entry.subject || '',
    hasInvoice: entry.hasInvoice || false,
  };

  all[orderId] = [record, ...all[orderId]].slice(0, 50);
  writeAll(all);
  return record;
}

/**
 * Get all email send records for a given order.
 * @param {string} orderId
 * @returns {Array}
 */
export function getEmailLog(orderId) {
  if (!orderId) return [];
  const all = readAll();
  return all[orderId] || [];
}

/**
 * Get all email logs across all orders.
 * @returns {Object} Map of orderId -> [entries]
 */
export function getAllEmailLogs() {
  return readAll();
}
