/*
  Admin Email — Tenant-scoped Storage (V1)
  -----------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for email notification configuration.
  - Define provider, sender info, event triggers and template references.
  - Store email template content (subject + HTML body) with variable placeholders.
  - Store auto-send rules mapping order statuses to email templates.
  - Store email send log entries.

  Notes:
  - No legacy migration needed — this is a new namespace.
  - Template content namespace: email-templates:v1
  - Auto-send rules namespace: email-autosend:v1
  - Email log namespace: email-log:v1
  - Variables use {{variableName}} syntax.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_EMAIL_V1 = 'email:v1';
const NS_EMAIL_TEMPLATES_V1 = 'email-templates:v1';
const NS_EMAIL_AUTOSEND_V1 = 'email-autosend:v1';
const NS_EMAIL_LOG_V1 = 'email-log:v1';
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
  { key: 'trackingNumber', label_cs: 'Sledovaci cislo', label_en: 'Tracking number', sample: 'CZ1234567890' },
  { key: 'trackingUrl', label_cs: 'Sledovaci odkaz', label_en: 'Tracking URL', sample: 'https://tracking.example.com/abc123' },
  { key: 'companyName', label_cs: 'Nazev firmy', label_en: 'Company name', sample: 'ModelPricer s.r.o.' },
  { key: 'statusText', label_cs: 'Stav objednavky', label_en: 'Order status', sample: 'Odeslano' },
  { key: 'invoiceNumber', label_cs: 'Cislo faktury', label_en: 'Invoice number', sample: 'FA-2026-0042' },
  { key: 'paymentMethod', label_cs: 'Zpusob platby', label_en: 'Payment method', sample: 'Bankovni prevod' },
  { key: 'cancelReason', label_cs: 'Duvod zruseni', label_en: 'Cancel reason', sample: 'Na zadost zakaznika' },
];

// ---------------------------------------------------------------------------
// Template types with default content
// ---------------------------------------------------------------------------
export const EMAIL_TEMPLATE_TYPES = [
  { id: 'order_confirmed', label_cs: 'Potvrzeni objednavky', label_en: 'Order Confirmation', icon: 'CheckCircle2', category: 'order' },
  { id: 'order_shipped', label_cs: 'Objednavka odeslana', label_en: 'Order Shipped', icon: 'Truck', category: 'order' },
  { id: 'order_completed', label_cs: 'Objednavka dokoncena', label_en: 'Order Completed', icon: 'PackageCheck', category: 'order' },
  { id: 'order_cancelled', label_cs: 'Objednavka zrusena', label_en: 'Order Cancelled', icon: 'XCircle', category: 'order' },
  { id: 'invoice', label_cs: 'Faktura', label_en: 'Invoice', icon: 'FileText', category: 'payment' },
  { id: 'payment_received', label_cs: 'Platba prijata', label_en: 'Payment Received', icon: 'CreditCard', category: 'payment' },
  { id: 'welcome', label_cs: 'Uvitaci email', label_en: 'Welcome Email', icon: 'UserPlus', category: 'general' },
  { id: 'custom', label_cs: 'Vlastni sablona', label_en: 'Custom Template', icon: 'PenTool', category: 'general' },
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
        '<p><strong>Sledovaci cislo:</strong> {{trackingNumber}}</p>',
        '<p>Sledovat zasilku muzete zde: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>',
        '<p>S pozdravem,<br/>{{companyName}}</p>',
      ].join('\n'),
    },
    order_completed: {
      subject: 'Objednavka {{orderId}} dokoncena',
      body: [
        '<h2>Vase objednavka byla dokoncena</h2>',
        '<p>Vazeny/a <strong>{{customerName}}</strong>,</p>',
        '<p>Objednavka <strong>{{orderId}}</strong> byla uspesne dokoncena a dorucena.</p>',
        '<p>Dekujeme za Vasi duverou a tesime se na dalsi objednavku.</p>',
        '<p>S pozdravem,<br/>{{companyName}}</p>',
      ].join('\n'),
    },
    order_cancelled: {
      subject: 'Objednavka {{orderId}} byla zrusena',
      body: [
        '<h2>Objednavka zrusena</h2>',
        '<p>Vazeny/a <strong>{{customerName}}</strong>,</p>',
        '<p>Vase objednavka <strong>{{orderId}}</strong> byla zrusena.</p>',
        '<p><strong>Duvod:</strong> {{cancelReason}}</p>',
        '<p>Pokud mate jakekoli dotazy, kontaktujte nas.</p>',
        '<p>S pozdravem,<br/>{{companyName}}</p>',
      ].join('\n'),
    },
    invoice: {
      subject: 'Faktura {{invoiceNumber}} k objednavce {{orderId}}',
      body: [
        '<h2>Faktura k objednavce</h2>',
        '<p>Vazeny/a <strong>{{customerName}}</strong>,</p>',
        '<p>V priloze Vam zasilame fakturu <strong>{{invoiceNumber}}</strong> k objednavce <strong>{{orderId}}</strong>.</p>',
        '<table style="width:100%;border-collapse:collapse;margin:16px 0">',
        '  <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Celkova castka</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>{{totalPrice}}</strong></td></tr>',
        '  <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Zpusob platby</td><td style="padding:8px;border-bottom:1px solid #ddd">{{paymentMethod}}</td></tr>',
        '</table>',
        '<p>S pozdravem,<br/>{{companyName}}</p>',
      ].join('\n'),
    },
    payment_received: {
      subject: 'Platba za objednavku {{orderId}} prijata',
      body: [
        '<h2>Platba prijata</h2>',
        '<p>Vazeny/a <strong>{{customerName}}</strong>,</p>',
        '<p>Potvrzujeme prijem platby za objednavku <strong>{{orderId}}</strong>.</p>',
        '<table style="width:100%;border-collapse:collapse;margin:16px 0">',
        '  <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Castka</td><td style="padding:8px;border-bottom:1px solid #ddd"><strong>{{totalPrice}}</strong></td></tr>',
        '  <tr><td style="padding:8px;border-bottom:1px solid #ddd;color:#666">Zpusob platby</td><td style="padding:8px;border-bottom:1px solid #ddd">{{paymentMethod}}</td></tr>',
        '</table>',
        '<p>Vase objednavka bude co nejdrive zpracovana.</p>',
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
    custom: {
      subject: '',
      body: '<p></p>',
    },
  };
  return defaults[templateId] || { subject: '', body: '<p></p>' };
}

// ---------------------------------------------------------------------------
// Template content storage (separate namespace)
// ---------------------------------------------------------------------------
export function loadEmailTemplates() {
  const stored = readTenantJson(NS_EMAIL_TEMPLATES_V1, null);
  if (stored && typeof stored === 'object') {
    // Ensure all template types exist (merge new defaults for missing ones)
    let needsWrite = false;
    const merged = { ...stored };
    for (const t of EMAIL_TEMPLATE_TYPES) {
      if (!merged[t.id]) {
        merged[t.id] = getDefaultTemplateContent(t.id);
        needsWrite = true;
      }
    }
    if (needsWrite) {
      writeTenantJson(NS_EMAIL_TEMPLATES_V1, merged);
    }
    return merged;
  }
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
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_secure: true,
    api_key_name: '',
    test_email: '',
    triggers: [
      { event: 'order_confirmed', enabled: false, template_id: 'order_confirmed' },
      { event: 'order_printing', enabled: false, template_id: 'order_confirmed' },
      { event: 'order_shipped', enabled: false, template_id: 'order_shipped' },
      { event: 'order_completed', enabled: false, template_id: 'order_completed' },
      { event: 'order_cancelled', enabled: false, template_id: 'order_cancelled' },
      { event: 'payment_received', enabled: false, template_id: 'payment_received' },
      { event: 'invoice_created', enabled: false, template_id: 'invoice' },
      { event: 'customer_registered', enabled: false, template_id: 'welcome' },
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
    smtp_host: String(src.smtp_host || '').trim(),
    smtp_port: Number(src.smtp_port) || 587,
    smtp_user: String(src.smtp_user || '').trim(),
    smtp_secure: parseBool(src.smtp_secure, true),
    api_key_name: String(src.api_key_name || '').trim(),
    test_email: String(src.test_email || '').trim(),
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

// ---------------------------------------------------------------------------
// Auto-send rules
// ---------------------------------------------------------------------------
export const ORDER_STATUSES = [
  { value: 'new', label_cs: 'Nova', label_en: 'New' },
  { value: 'confirmed', label_cs: 'Potvrzena', label_en: 'Confirmed' },
  { value: 'printing', label_cs: 'V tisku', label_en: 'Printing' },
  { value: 'ready', label_cs: 'Pripravena', label_en: 'Ready' },
  { value: 'shipped', label_cs: 'Odeslana', label_en: 'Shipped' },
  { value: 'completed', label_cs: 'Dokoncena', label_en: 'Completed' },
  { value: 'cancelled', label_cs: 'Zrusena', label_en: 'Cancelled' },
  { value: 'paid', label_cs: 'Zaplacena', label_en: 'Paid' },
];

export function getDefaultAutoSendRules() {
  return [
    { template_id: 'order_confirmed', status_trigger: 'confirmed', enabled: false },
    { template_id: 'order_shipped', status_trigger: 'shipped', enabled: false },
    { template_id: 'order_completed', status_trigger: 'completed', enabled: false },
    { template_id: 'order_cancelled', status_trigger: 'cancelled', enabled: false },
    { template_id: 'payment_received', status_trigger: 'paid', enabled: false },
    { template_id: 'invoice', status_trigger: 'paid', enabled: false },
    { template_id: 'welcome', status_trigger: '', enabled: false },
    { template_id: 'custom', status_trigger: '', enabled: false },
  ];
}

export function loadAutoSendRules() {
  const stored = readTenantJson(NS_EMAIL_AUTOSEND_V1, null);
  if (stored && Array.isArray(stored)) return stored;
  const defaults = getDefaultAutoSendRules();
  writeTenantJson(NS_EMAIL_AUTOSEND_V1, defaults);
  return defaults;
}

export function saveAutoSendRules(rules) {
  writeTenantJson(NS_EMAIL_AUTOSEND_V1, rules);
  return rules;
}

// ---------------------------------------------------------------------------
// Email log
// ---------------------------------------------------------------------------
export function loadEmailLog() {
  const stored = readTenantJson(NS_EMAIL_LOG_V1, []);
  return Array.isArray(stored) ? stored : [];
}

export function addEmailLogEntry(entry) {
  const log = loadEmailLog();
  const newEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    date: nowIso(),
    template: entry.template || '',
    recipient: entry.recipient || '',
    subject: entry.subject || '',
    orderId: entry.orderId || '',
    status: entry.status || 'sent',
    ...entry,
  };
  log.unshift(newEntry);
  // Keep max 100 entries
  const trimmed = log.slice(0, 100);
  writeTenantJson(NS_EMAIL_LOG_V1, trimmed);
  return trimmed;
}

export function clearEmailLog() {
  writeTenantJson(NS_EMAIL_LOG_V1, []);
  return [];
}
