/*
  Admin Form Configuration Storage
  Namespace: form:v1
  Manages checkout form field configuration for the tenant.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NAMESPACE = 'form:v1';

const DEFAULT_FORM_CONFIG = {
  required_fields: ['name', 'email'],
  optional_fields: ['phone', 'company', 'note'],
  gdpr_text: {
    cs: 'Souhlasim se zpracovanim svych osobnich udaju za ucelem vyrizeni objednavky.',
    en: 'I consent to the processing of my personal data for the purpose of fulfilling this order.',
  },
  company_field_visible: true,
};

export function loadFormConfig() {
  const existing = readTenantJson(NAMESPACE, null);
  if (existing && typeof existing === 'object') {
    return { ...DEFAULT_FORM_CONFIG, ...existing };
  }
  return { ...DEFAULT_FORM_CONFIG };
}

export function saveFormConfig(config) {
  const next = { ...DEFAULT_FORM_CONFIG, ...(config || {}), updated_at: new Date().toISOString() };
  writeTenantJson(NAMESPACE, next);
  return next;
}

export function getDefaultFormConfig() {
  return { ...DEFAULT_FORM_CONFIG };
}
