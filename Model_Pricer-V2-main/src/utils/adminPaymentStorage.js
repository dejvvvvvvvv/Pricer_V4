/*
  Admin Payment — Tenant-scoped Storage (V1)
  -------------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for payment method configuration.
  - Support bank transfer and card (Stripe) payment methods.
  - Variable symbol auto-increment tracking.

  Notes:
  - No legacy migration needed — this is a new namespace.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_PAYMENT_V1 = 'payment:v1';
const SCHEMA_VERSION = 1;

function nowIso() {
  return new Date().toISOString();
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(v, fallback = false) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return fallback;
}

export function getDefaultPaymentConfig() {
  return {
    schema_version: SCHEMA_VERSION,
    bank_transfer: {
      enabled: true,
      account_number: '',
      iban: '',
      swift: '',
      bank_name: '',
      due_days: 14,
      payment_instructions: '',
      variable_symbol: {
        mode: 'auto', // 'auto' | 'order_number'
        next_value: 70001,
        prefix: '',
      },
    },
    card_payment: {
      enabled: false,
      provider: 'stripe',
    },
    updated_at: nowIso(),
  };
}

export function normalizePaymentConfig(input) {
  const src = input && typeof input === 'object' ? input : {};
  const bt = src.bank_transfer && typeof src.bank_transfer === 'object' ? src.bank_transfer : {};
  const vs = bt.variable_symbol && typeof bt.variable_symbol === 'object' ? bt.variable_symbol : {};
  const cp = src.card_payment && typeof src.card_payment === 'object' ? src.card_payment : {};

  const vsMode = String(vs.mode || '').trim();
  const allowedVsModes = ['auto', 'order_number'];

  return {
    schema_version: SCHEMA_VERSION,
    bank_transfer: {
      enabled: parseBool(bt.enabled, true),
      account_number: String(bt.account_number || '').trim(),
      iban: String(bt.iban || '').trim(),
      swift: String(bt.swift || '').trim(),
      bank_name: String(bt.bank_name || '').trim(),
      due_days: safeNum(bt.due_days, 14),
      payment_instructions: String(bt.payment_instructions || '').trim(),
      variable_symbol: {
        mode: allowedVsModes.includes(vsMode) ? vsMode : 'auto',
        next_value: safeNum(vs.next_value, 70001),
        prefix: String(vs.prefix || '').trim(),
      },
    },
    card_payment: {
      enabled: parseBool(cp.enabled, false),
      provider: String(cp.provider || 'stripe').trim(),
    },
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function getPaymentConfig(tenantIdOverride) {
  const stored = readTenantJson(NS_PAYMENT_V1, null, tenantIdOverride);
  if (stored && typeof stored === 'object') {
    return normalizePaymentConfig(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizePaymentConfig(getDefaultPaymentConfig());
  writeTenantJson(NS_PAYMENT_V1, seeded, tenantIdOverride);
  return seeded;
}

export function savePaymentConfig(data, tenantIdOverride) {
  const normalized = normalizePaymentConfig(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_PAYMENT_V1, next, tenantIdOverride);
  return next;
}

// ─── Shorthand Helpers ───────────────────────────────────────

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label: 'Bank Transfer', configKey: 'bank_transfer' },
  { id: 'card', label: 'Card Payment', configKey: 'card_payment' },
];

/**
 * Get just the bank_transfer section of the payment config.
 * @param {string} [tenantIdOverride]
 * @returns {object} Bank transfer configuration
 */
export function getBankTransferConfig(tenantIdOverride) {
  const config = getPaymentConfig(tenantIdOverride);
  return config.bank_transfer || getDefaultPaymentConfig().bank_transfer;
}

/**
 * Returns an array of enabled payment methods.
 * Each item has { id, label }.
 * @param {string} [tenantIdOverride]
 * @returns {Array<{id: string, label: string}>}
 */
export function getEnabledPaymentMethods(tenantIdOverride) {
  const config = getPaymentConfig(tenantIdOverride);
  return PAYMENT_METHODS.filter((method) => {
    const section = config[method.configKey];
    return section && section.enabled === true;
  }).map(({ id, label }) => ({ id, label }));
}

/**
 * Get the next variable symbol and auto-increment the counter.
 *
 * If mode='auto': composes prefix + next_value, increments, saves.
 * If mode='order_number': returns null (caller uses order number digits).
 * Variable symbol max 10 digits (Czech banking standard).
 *
 * @param {string} [tenantIdOverride]
 * @returns {string|null}
 */
export function getNextVariableSymbol(tenantIdOverride) {
  const config = getPaymentConfig(tenantIdOverride);
  const vs = config.bank_transfer?.variable_symbol;

  if (!vs || vs.mode === 'order_number') {
    return null;
  }

  const prefix = String(vs.prefix || '').replace(/\D/g, '');
  const nextValue = Math.max(1, Math.floor(Number(vs.next_value) || 70001));
  const nextValueStr = String(nextValue);
  let symbol = prefix + nextValueStr;

  // Max 10 digits (Czech banking standard)
  if (symbol.length > 10) {
    symbol = symbol.slice(-10);
  }

  // Increment counter
  config.bank_transfer.variable_symbol.next_value = nextValue + 1;
  savePaymentConfig(config, tenantIdOverride);

  return symbol;
}
