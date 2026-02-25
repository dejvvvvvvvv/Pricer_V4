/*
  Admin Company tenant-scoped storage

  - Source of truth lives under: modelpricer:<tenantId>:company:v1
  - Stores company/billing information (name, ICO, DIC, address, etc.)

  Public API:
    - readCompanyData()   — reads company:v1 from tenant storage, returns object or default
    - writeCompanyData(data) — writes company:v1 to tenant storage
    - getDefaultCompanyData() — returns the default empty shape
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NAMESPACE = 'company:v1';

/**
 * Default (empty) company data shape.
 */
export function getDefaultCompanyData() {
  return {
    companyName: '',
    ico: '',
    dic: '',
    address: '',
    city: '',
    zip: '',
    country: 'CZ',
  };
}

/**
 * Read company data from tenant-scoped storage.
 * Returns stored data merged with defaults (so new fields get a fallback).
 */
export function readCompanyData() {
  const defaults = getDefaultCompanyData();
  const stored = readTenantJson(NAMESPACE, null);
  if (!stored || typeof stored !== 'object') return defaults;
  return { ...defaults, ...stored };
}

/**
 * Write company data to tenant-scoped storage.
 * @param {Object} data — company data object (same shape as getDefaultCompanyData)
 */
export function writeCompanyData(data) {
  writeTenantJson(NAMESPACE, data);
}
