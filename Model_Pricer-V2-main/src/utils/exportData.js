/**
 * Data Export Utilities
 *
 * Functions for exporting data as CSV or JSON files.
 * Used by admin pages (Orders, Analytics) for data export.
 */

import { logSecurityEvent } from './securityAuditLog';

/**
 * Convert an array of objects to a CSV string.
 *
 * @param {Array<Object>} data - Array of objects to convert
 * @param {Array<{key: string, label: string}>} [columns] - Optional column definitions.
 *   If provided, only these keys are included and labels are used as headers.
 *   If omitted, all keys from the first object are used.
 * @returns {string} CSV string with header row
 */
export function toCSV(data, columns) {
  if (!data || data.length === 0) {
    return '';
  }

  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));
  const headers = cols.map((c) => escapeCSVField(c.label));

  const rows = data.map((row) =>
    cols.map((c) => escapeCSVField(row[c.key])).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Escape a single CSV field value.
 * Wraps in double quotes if the value contains commas, quotes, or newlines.
 * Double quotes within the value are escaped by doubling them.
 *
 * @param {*} value - Value to escape
 * @returns {string} Escaped CSV field
 */
function escapeCSVField(value) {
  let str = String(value ?? '');
  // Prevent formula injection in spreadsheet apps (Excel, Google Sheets, LibreOffice)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Create a Blob from content and trigger a browser download.
 *
 * @param {string} content - File content
 * @param {string} filename - Download filename
 * @param {string} mimeType - MIME type for the Blob
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data as a CSV file download.
 *
 * @param {Array<Object>} data - Data to export
 * @param {string} [filename='export.csv'] - Filename
 * @param {Array<{key: string, label: string}>} [columns] - Optional column definitions
 */
export function exportCSV(data, filename = 'export.csv', columns) {
  const csv = toCSV(data, columns);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  logSecurityEvent({
    event_type: 'data_export',
    details: `CSV export: ${filename} (${data.length} zaznamu)`,
    severity: 'info',
  });
}

/**
 * Export data as a JSON file download.
 *
 * @param {Array<Object>} data - Data to export
 * @param {string} [filename='export.json'] - Filename
 */
export function exportJSON(data, filename = 'export.json') {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
  logSecurityEvent({
    event_type: 'data_export',
    details: `JSON export: ${filename}`,
    severity: 'info',
  });
}
