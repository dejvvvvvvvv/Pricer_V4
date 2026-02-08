// Template Renderer
// Uses simple {{variable}} replacement (no external dependency)
// Can be upgraded to Handlebars later

import { DEFAULT_TEMPLATES } from './templates/index.js';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceVars(template, data, prefix = '') {
  let result = template;

  if (!data || typeof data !== 'object') return result;

  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result = replaceVars(result, value, fullKey);
    } else {
      const escaped = escapeHtml(value);
      result = result.replace(new RegExp(`\\{\\{${fullKey}\\}\\}`, 'g'), escaped);
    }
  }

  return result;
}

export function renderTemplate(templateId, data) {
  const tmpl = DEFAULT_TEMPLATES[templateId];
  if (!tmpl) {
    return `<html><body><p>Template "${templateId}" not found.</p></body></html>`;
  }

  return replaceVars(tmpl, data);
}

export function listTemplates() {
  return Object.keys(DEFAULT_TEMPLATES);
}
