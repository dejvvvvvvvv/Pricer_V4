/*
  Admin Email — Tenant-scoped Storage (V1)
  -----------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for email notification configuration.
  - Define provider, sender info, event triggers and template references.
  - Store email template content (subject + HTML body) with variable placeholders.

  Notes:
  - No legacy migration needed — this is a new namespace.
  - Template content namespace: email-templates:v1
  - Variables use {{variableName}} syntax.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';
import { generateId } from './generateId';

const NS_EMAIL_V1 = 'email:v1';
const NS_EMAIL_TEMPLATES_V1 = 'email-templates:v1';
const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Template variable definitions
// ---------------------------------------------------------------------------
export const EMAIL_TEMPLATE_VARIABLES = [
  { key: 'customerName', label_cs: 'Jmeno zakaznika', label_en: 'Customer name', sample: 'Jan Novak' },
  { key: 'customerEmail', label_cs: 'Email zakaznika', label_en: 'Customer email', sample: 'jan@example.com' },
  { key: 'orderId', label_cs: 'Cislo objednavky', label_en: 'Order ID', sample: 'ORD-2026-0042' },
  { key: 'orderDate', label_cs: 'Datum objednavky', label_en: 'Order date', sample: '11. 3. 2026' },
  { key: 'totalPrice', label_cs: 'Celkova cena', label_en: 'Total price', sample: '1 290 Kc' },
  { key: 'itemCount', label_cs: 'Pocet polozek', label_en: 'Item count', sample: '3' },
  { key: 'trackingUrl', label_cs: 'Sledovaci odkaz', label_en: 'Tracking URL', sample: 'https://tracking.example.com/abc123' },
  { key: 'companyName', label_cs: 'Nazev firmy', label_en: 'Company name', sample: 'ModelPricer s.r.o.' },
  { key: 'statusText', label_cs: 'Stav objednavky', label_en: 'Order status', sample: 'Odeslano' },
];

// ---------------------------------------------------------------------------
// Template types with default content
// ---------------------------------------------------------------------------
export const EMAIL_TEMPLATE_TYPES = [
  { id: 'order_confirmed', label_cs: 'Potvrzeni objednavky', label_en: 'Order Confirmation', icon: 'CheckCircle2' },
  { id: 'order_shipped', label_cs: 'Odeslani zasilky', label_en: 'Shipping Notification', icon: 'Truck' },
  { id: 'order_status_update', label_cs: 'Zmena stavu objednavky', label_en: 'Order Status Update', icon: 'RefreshCw' },
  { id: 'welcome', label_cs: 'Uvitaci email', label_en: 'Welcome Email', icon: 'UserPlus' },
];

export function getDefaultTemplateContent(templateId) {
  const defaults = {
    order_confirmed: {
      subject: 'Potvrzeni objednavky {{orderId}}',
      body: [
        '<h2>Dekujeme za Vasi objednavku!</h2>',
        '<p>Vazeny/a <strong>{{customerName}}</strong>,</p>',
        '<p>Vase objednavka <strong>{{orderId}}</strong> ze dne {{orderDate}} byla uspesne prijata.</p>',
        '<table style="width:100%;border-collapse:collapse;margin:16px 0">',
        '  <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Pocet polozek</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>{{itemCount}}</strong></td></tr>',
        '  <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Celkova cena</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>{{totalPrice}}</strong></td></tr>',
        '</table>',
        '<p>O dalsim prubehu Vas budeme informovat emailem.</p>',
        '<p>S pozdravem,<br/>{{companyName}}</p>',
      ].join('\n'),
    },
    order_shipped: {
      subject: 'Objednavka {{orderId}} byla odeslana',
      body: [
        '<h2>Vase objednavka je na ceste!</h2>',
        '<p>Vazeny/a <strong>{{customerName}}</strong>,</p>',
        '<p>Objednavka <strong>{{orderId}}</strong> byla odeslana.</p>',
        '<p>Sledovat zasilku muzete zde: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>',
        '<p>S pozdravem,<br/>{{companyName}}</p>',
      ].join('\n'),
    },
    order_status_update: {
      subject: 'Zmena stavu objednavky {{orderId}}',
      body: [
        '<h2>Aktualizace objednavky</h2>',
        '<p>Vazeny/a <strong>{{customerName}}</strong>,</p>',
        '<p>Stav Vasi objednavky <strong>{{orderId}}</strong> byl zmenen na: <strong>{{statusText}}</strong>.</p>',
        '<p>S pozdravem,<br/>{{companyName}}</p>',
      ].join('\n'),
    },
    welcome: {
      subject: 'Vitejte v {{companyName}}!',
      body: [
        '<h2>Vitejte!</h2>',
        '<p>Vazeny/a <strong>{{customerName}}</strong>,</p>',
        '<p>Dekujeme za registraci u <strong>{{companyName}}</strong>.</p>',
        '<p>Vas ucet je nyni aktivni. Muzete zacit pouzivat nasi sluzbu.</p>',
        '<p>Pokud mate jakekoli dotazy, nevahjte nas kontaktovat.</p>',
        '<p>S pozdravem,<br/>{{companyName}}</p>',
      ].join('\n'),
    },
  };
  return defaults[templateId] || { subject: '', body: '<p></p>' };
}

// ---------------------------------------------------------------------------
// Template content storage (separate namespace)
// ---------------------------------------------------------------------------
export function loadEmailTemplates() {
  const stored = readTenantJson(NS_EMAIL_TEMPLATES_V1, null);
  if (stored && typeof stored === 'object') return stored;
  // Seed defaults
  const defaults = {};
  for (const t of EMAIL_TEMPLATE_TYPES) {
    defaults[t.id] = getDefaultTemplateContent(t.id);
  }
  writeTenantJson(NS_EMAIL_TEMPLATES_V1, defaults);
  return defaults;
}

export function saveEmailTemplates(templates) {
  writeTenantJson(NS_EMAIL_TEMPLATES_V1, templates);
  return templates;
}

/**
 * Replace {{variable}} placeholders with sample data for preview.
 */
export function renderTemplatePreview(html, subject) {
  const sampleData = {};
  for (const v of EMAIL_TEMPLATE_VARIABLES) {
    sampleData[v.key] = v.sample;
  }
  const replace = (str) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleData[key] || `{{${key}}}`);
  return {
    subject: replace(subject || ''),
    body: replace(html || ''),
  };
}

/**
 * Basic HTML sanitizer — strips script tags and event handlers.
 * Not a full sanitizer; use DOMPurify in production.
 */
export function sanitizeTemplateHtml(html) {
  if (!html) return '';
  let s = html;
  // Remove <script> tags
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Remove on* event attributes
  s = s.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  s = s.replace(/\s+on\w+\s*=\s*\S+/gi, '');
  // Remove javascript: protocol
  s = s.replace(/javascript\s*:/gi, '');
  return s;
}

function nowIso() {
  return new Date().toISOString();
}

function parseBool(v, fallback = false) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return fallback;
}

function normalizeTrigger(trigger, idx = 0) {
  const t = trigger && typeof trigger === 'object' ? trigger : {};

  return {
    event: String(t.event || '').trim() || `event_${idx}`,
    enabled: parseBool(t.enabled, false),
    template_id: String(t.template_id || '').trim() || '',
  };
}

export function getDefaultEmailConfigV1() {
  return {
    schema_version: SCHEMA_VERSION,
    provider: 'none',
    sender_name: '',
    sender_email: '',
    triggers: [
      { event: 'order_confirmed', enabled: false, template_id: 'order_confirmed' },
      { event: 'order_printing', enabled: false, template_id: 'order_printing' },
      { event: 'order_shipped', enabled: false, template_id: 'order_shipped' },
      { event: 'order_completed', enabled: false, template_id: 'order_completed' },
    ],
    templates: {},
    updated_at: nowIso(),
  };
}

export function normalizeEmailConfigV1(input) {
  const src = input && typeof input === 'object' ? input : {};
  const triggersRaw = Array.isArray(src.triggers) ? src.triggers : [];
  const triggers = triggersRaw.map(normalizeTrigger);

  const templates = src.templates && typeof src.templates === 'object' ? src.templates : {};

  return {
    schema_version: SCHEMA_VERSION,
    provider: String(src.provider || '').trim() || 'none',
    sender_name: String(src.sender_name || '').trim(),
    sender_email: String(src.sender_email || '').trim(),
    triggers,
    templates,
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function loadEmailConfigV1() {
  const stored = readTenantJson(NS_EMAIL_V1, null);
  if (stored && typeof stored === 'object') {
    return normalizeEmailConfigV1(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizeEmailConfigV1(getDefaultEmailConfigV1());
  writeTenantJson(NS_EMAIL_V1, seeded);
  return seeded;
}

export function saveEmailConfigV1(data) {
  const normalized = normalizeEmailConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_EMAIL_V1, next);
  return next;
}
