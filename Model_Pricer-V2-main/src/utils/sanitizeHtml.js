/**
 * DOM-based HTML sanitizer — replaces regex approaches.
 * Strips dangerous tags and event handler attributes.
 */

const ALLOWED_TAGS = new Set([
  'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'hr',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'span', 'div', 'pre', 'code', 'blockquote',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
  'img', 'small', 'sub', 'sup', 'dl', 'dt', 'dd',
]);

const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'class', 'id',
  'width', 'height', 'colspan', 'rowspan', 'target', 'rel',
]);

const DANGEROUS_PROTOCOLS = /^\s*(javascript|data|vbscript)\s*:/i;

function sanitizeNode(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 1) {
      const tag = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        child.replaceWith(...child.childNodes);
        continue;
      }
      for (const attr of [...child.attributes]) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on') || !ALLOWED_ATTRS.has(name)) {
          child.removeAttribute(attr.name);
        } else if ((name === 'href' || name === 'src') && DANGEROUS_PROTOCOLS.test(attr.value)) {
          child.removeAttribute(attr.name);
        }
      }
      sanitizeNode(child);
    }
  }
}

export function sanitizeHtmlAllowBasic(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  const doc = new DOMParser().parseFromString(dirty, 'text/html');
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

/**
 * Sanitize an SVG string by removing dangerous elements and attributes.
 * Strips: script, foreignObject, iframe, object, embed elements;
 * all on* event handlers; javascript:/data:/vbscript: URIs.
 * @param {string} svgString - Raw SVG markup
 * @returns {string} Sanitized SVG string, or empty string if parsing fails
 */
export function sanitizeSvg(svgString) {
  if (!svgString || typeof svgString !== 'string') return '';
  try {
    const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
    if (doc.querySelector('parsererror')) return '';

    const DANGEROUS_ELEMENTS = ['script', 'foreignObject', 'foreignobject', 'iframe', 'object', 'embed'];
    for (const tag of DANGEROUS_ELEMENTS) {
      for (const el of [...doc.querySelectorAll(tag)]) el.remove();
    }

    const DANGEROUS_URI = /^\s*(javascript|data|vbscript)\s*:/i;
    for (const el of doc.querySelectorAll('*')) {
      for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) { el.removeAttribute(attr.name); continue; }
        if ((name === 'href' || name === 'xlink:href') && DANGEROUS_URI.test(attr.value)) {
          el.removeAttribute(attr.name);
        }
      }
    }

    return new XMLSerializer().serializeToString(doc.documentElement);
  } catch { return ''; }
}

export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize a value for safe CSV export.
 * Prevents formula injection in spreadsheet applications (Excel, Google Sheets, LibreOffice)
 * by prefixing dangerous leading characters with a single quote.
 *
 * @param {*} value - Value to sanitize
 * @returns {string} Safe CSV string value
 */
export function sanitizeCsvValue(value) {
  if (value == null) return '';
  const str = String(value);
  // Prevent formula injection — prefix dangerous leading characters
  if (/^[=+\-@\t\r]/.test(str)) {
    return "'" + str;
  }
  // Escape quotes and wrap if contains comma/newline/quote
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
