/*
  Order Export Generator — Printable HTML documents for orders
  ------------------------------------------------------------
  Generates professional, A4-optimized HTML for:
    - Order summary (internal use — full pricing breakdown)
    - Packing slip (shipping — no prices, just items + quantities)

  Both functions return complete HTML strings suitable for window.open + print.

  Public API:
    - generateOrderSummaryHTML(order, companyConfig)
    - generatePackingSlipHTML(order, companyConfig)
*/

import { computeOrderTotals, getStatusLabel, collectOrderFlags, getFlagLabel } from './adminOrdersStorage';

// ── Helpers ──

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function formatMoney(amount) {
  const n = round2(amount);
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kc';
}

function formatDate(isoOrDate) {
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleDateString('cs-CZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return String(isoOrDate || '');
  }
}

function formatDateTime(isoOrDate) {
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleString('cs-CZ', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(isoOrDate || '');
  }
}

function formatTime(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} min`;
  return `${h}h ${r}m`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getSlicerTimeMin(slicer) {
  if (!slicer) return 0;
  if (Number(slicer.time_min) > 0) return Number(slicer.time_min);
  if (Number(slicer.estimatedTimeSeconds) > 0) return Number(slicer.estimatedTimeSeconds) / 60;
  return 0;
}

function getSlicerWeightG(slicer) {
  if (!slicer) return 0;
  return Number(slicer.weight_g) || Number(slicer.filamentGrams) || 0;
}

// ── Shared CSS ──

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1f2937;
    background: #fff;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.5;
  }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
  }
  table { width: 100%; border-collapse: collapse; }
  .label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #9ca3af;
    margin-bottom: 6px;
  }
  .th {
    padding: 10px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #6b7280;
    border-bottom: 2px solid #e5e7eb;
    background: #f9fafb;
  }
  .th-right { text-align: right; }
  .th-center { text-align: center; }
  .td {
    padding: 10px 12px;
    font-size: 13px;
    color: #1f2937;
    border-bottom: 1px solid #e5e7eb;
  }
  .td-muted { color: #4b5563; }
  .td-right { text-align: right; font-variant-numeric: tabular-nums; }
  .td-center { text-align: center; }
  .td-bold { font-weight: 600; }
`;

// ── Company header block ──

function companyHeaderHtml(company, title) {
  return `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #111827;">
    <div>
      <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0;">${escHtml(title)}</h1>
    </div>
    <div style="text-align:right;">
      <div style="font-size:16px;font-weight:700;color:#111827;">${escHtml(company.companyName || '')}</div>
      ${company.address ? `<div style="font-size:13px;color:#4b5563;margin-top:2px;">${escHtml(company.address)}</div>` : ''}
      ${company.city || company.zip ? `<div style="font-size:13px;color:#4b5563;">${escHtml([company.zip, company.city].filter(Boolean).join(' '))}</div>` : ''}
      ${company.ico ? `<div style="font-size:12px;color:#6b7280;margin-top:4px;">ICO: ${escHtml(company.ico)}</div>` : ''}
      ${company.dic ? `<div style="font-size:12px;color:#6b7280;">DIC: ${escHtml(company.dic)}</div>` : ''}
      ${company.email ? `<div style="font-size:12px;color:#6b7280;">${escHtml(company.email)}</div>` : ''}
      ${company.phone ? `<div style="font-size:12px;color:#6b7280;">${escHtml(company.phone)}</div>` : ''}
    </div>
  </div>`;
}

// ── Customer block ──

function customerBlockHtml(order) {
  const customer = order.customer_snapshot || {};
  const addr = order.shipping_address || {};

  return `
  <div style="margin-bottom:24px;">
    <div class="label">Zakaznik</div>
    <div style="font-size:15px;font-weight:700;color:#111827;">${escHtml(customer.name || '-')}</div>
    ${customer.company ? `<div style="font-size:13px;color:#4b5563;">${escHtml(customer.company)}</div>` : ''}
    ${customer.email ? `<div style="font-size:13px;color:#4b5563;">${escHtml(customer.email)}</div>` : ''}
    ${customer.phone ? `<div style="font-size:13px;color:#4b5563;">${escHtml(customer.phone)}</div>` : ''}
    ${addr.street ? `<div style="font-size:13px;color:#4b5563;margin-top:4px;">${escHtml(addr.street)}</div>` : ''}
    ${addr.city ? `<div style="font-size:13px;color:#4b5563;">${escHtml([addr.zip, addr.city].filter(Boolean).join(' '))}</div>` : ''}
  </div>`;
}

// ── Footer ──

function footerHtml(company) {
  return `
  <div style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:11px;color:#9ca3af;text-align:center;margin-top:32px;">
    ${company.companyName ? `<div>${escHtml(company.companyName)}${company.ico ? ` | ICO: ${escHtml(company.ico)}` : ''}</div>` : ''}
    <div style="margin-top:4px;">Vytvoreno: ${formatDateTime(new Date())}</div>
  </div>`;
}

// ================================================================
// generateOrderSummaryHTML
// ================================================================

/**
 * Generate a complete HTML document with an internal order summary.
 * Contains full pricing breakdown, model specs, notes, and flags.
 *
 * @param {Object} order - Order object from adminOrdersStorage
 * @param {Object} [companyConfig] - Company data from adminCompanyStorage
 * @returns {string} Complete HTML document string
 */
export function generateOrderSummaryHTML(order, companyConfig) {
  const company = companyConfig || {};
  const customer = order.customer_snapshot || {};
  const models = order.models || [];
  const totals = computeOrderTotals(order);
  const flags = collectOrderFlags(order);

  // Model rows
  const modelRows = models.map((m, idx) => {
    const bd = m.price_breakdown_snapshot || {};
    const qty = Number(m.quantity) || 1;
    const slicer = m.slicer_snapshot || {};
    const unitPrice = Number(bd.model_total) || Number(bd.total) || Number(bd.totalPrice) || Number(m.totalPrice) || Number(m.price) || 0;
    const lineTotal = round2(unitPrice * qty);
    const timeMin = getSlicerTimeMin(slicer);
    const weightG = getSlicerWeightG(slicer);

    return `
      <tr>
        <td class="td">${escHtml(m.file_snapshot?.filename || `Model ${idx + 1}`)}</td>
        <td class="td td-muted">${escHtml(m.material_snapshot?.name || '-')}</td>
        <td class="td td-muted">${escHtml(m.preset_snapshot?.name || '-')}</td>
        <td class="td td-center">${qty}</td>
        <td class="td td-muted td-center">${timeMin > 0 ? formatTime(timeMin) : '-'}</td>
        <td class="td td-muted td-center">${weightG > 0 ? `${round2(weightG)} g` : '-'}</td>
        <td class="td td-right">${formatMoney(unitPrice)}</td>
        <td class="td td-right td-bold">${formatMoney(lineTotal)}</td>
      </tr>`;
  }).join('');

  // Fees rows
  const fees = order.one_time_fees || [];
  const feesRows = fees.filter(f => Number(f.amount) > 0).map(f => `
    <tr>
      <td class="td td-muted" colspan="7">${escHtml(f.label || f.name || 'Poplatek')}</td>
      <td class="td td-right">${formatMoney(f.amount)}</td>
    </tr>`).join('');

  // Notes
  const notes = (order.notes || []).filter(n => n.text);
  const notesHtml = notes.length > 0 ? `
  <div style="margin-top:24px;">
    <div class="label">Poznamky</div>
    ${notes.map(n => `
      <div style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:6px;">
        <div style="font-size:12px;color:#9ca3af;margin-bottom:2px;">${formatDateTime(n.timestamp || n.created_at)}</div>
        <div style="font-size:13px;color:#1f2937;">${escHtml(n.text)}</div>
      </div>
    `).join('')}
  </div>` : '';

  // Flags
  const flagsHtml = flags.length > 0 ? `
  <div style="margin-top:16px;padding:10px 14px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:6px;">
    <div style="font-size:12px;font-weight:700;color:#d97706;margin-bottom:4px;">Upozorneni</div>
    <div style="font-size:12px;color:#92400e;">${flags.map(f => getFlagLabel(f, 'cs')).join(' / ')}</div>
  </div>` : '';

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Souhrn objednavky ${escHtml(order.id || '')}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>

  ${companyHeaderHtml(company, 'SOUHRN OBJEDNAVKY')}

  <!-- Order meta -->
  <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:24px;">
    <div style="flex:1;">
      ${customerBlockHtml(order)}
    </div>
    <div style="text-align:right;">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div>
          <div class="label">Cislo objednavky</div>
          <div style="font-size:16px;font-weight:800;color:#111827;">${escHtml(order.id || '-')}</div>
        </div>
        <div>
          <div class="label">Datum vytvoreni</div>
          <div style="font-size:14px;font-weight:600;color:#111827;">${formatDate(order.created_at)}</div>
        </div>
        <div>
          <div class="label">Status</div>
          <div style="font-size:14px;font-weight:600;color:#111827;">${getStatusLabel(order.status, 'cs')}</div>
        </div>
      </div>
    </div>
  </div>

  ${flagsHtml}

  <!-- Items table -->
  <table style="margin-top:20px;margin-bottom:20px;">
    <thead>
      <tr>
        <th class="th">Polozka</th>
        <th class="th">Material</th>
        <th class="th">Kvalita</th>
        <th class="th th-center">Ks</th>
        <th class="th th-center">Cas tisku</th>
        <th class="th th-center">Hmotnost</th>
        <th class="th th-right">Cena/ks</th>
        <th class="th th-right">Celkem</th>
      </tr>
    </thead>
    <tbody>
      ${modelRows}
      ${feesRows}
      ${totals.shipping_total > 0 ? `
      <tr>
        <td class="td td-muted" colspan="7">Doprava</td>
        <td class="td td-right">${formatMoney(totals.shipping_total)}</td>
      </tr>` : ''}
      ${totals.min_order_delta > 0 ? `
      <tr>
        <td class="td td-muted" colspan="7">Dorovnani min. objednavky</td>
        <td class="td td-right">${formatMoney(totals.min_order_delta)}</td>
      </tr>` : ''}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:20px;">
    <div style="width:300px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#4b5563;">
        <span>Subtotal modely</span>
        <span style="font-variant-numeric:tabular-nums;">${formatMoney(totals.subtotal_models)}</span>
      </div>
      ${totals.one_time_fees_total > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#4b5563;">
        <span>Jednorazove poplatky</span>
        <span style="font-variant-numeric:tabular-nums;">${formatMoney(totals.one_time_fees_total)}</span>
      </div>` : ''}
      ${totals.shipping_total > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#4b5563;">
        <span>Doprava</span>
        <span style="font-variant-numeric:tabular-nums;">${formatMoney(totals.shipping_total)}</span>
      </div>` : ''}
      ${totals.min_order_delta > 0 ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#4b5563;">
        <span>Dorovnani min. objednavky</span>
        <span style="font-variant-numeric:tabular-nums;">${formatMoney(totals.min_order_delta)}</span>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:800;color:#111827;border-top:2px solid #111827;margin-top:4px;">
        <span>Celkem</span>
        <span style="font-variant-numeric:tabular-nums;">${formatMoney(totals.total)}</span>
      </div>
    </div>
  </div>

  <!-- Summary stats -->
  <div style="display:flex;gap:16px;margin-bottom:20px;">
    <div style="flex:1;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
      <div class="label">Celkovy cas tisku</div>
      <div style="font-size:15px;font-weight:700;color:#111827;">${formatTime(totals.sum_time_min)}</div>
    </div>
    <div style="flex:1;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
      <div class="label">Celkova hmotnost</div>
      <div style="font-size:15px;font-weight:700;color:#111827;">${round2(totals.sum_weight_g)} g</div>
    </div>
    <div style="flex:1;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
      <div class="label">Pocet kusu</div>
      <div style="font-size:15px;font-weight:700;color:#111827;">${totals.sum_pieces}</div>
    </div>
  </div>

  ${notesHtml}

  ${footerHtml(company)}

</body>
</html>`;
}

// ================================================================
// generatePackingSlipHTML
// ================================================================

/**
 * Generate a packing slip — simple item list without prices.
 * For orders that are ready to ship.
 *
 * @param {Object} order - Order object from adminOrdersStorage
 * @param {Object} [companyConfig] - Company data from adminCompanyStorage
 * @returns {string} Complete HTML document string
 */
export function generatePackingSlipHTML(order, companyConfig) {
  const company = companyConfig || {};
  const customer = order.customer_snapshot || {};
  const addr = order.shipping_address || {};
  const models = order.models || [];

  // Item rows — no prices
  const itemRows = models.map((m, idx) => {
    const qty = Number(m.quantity) || 1;
    return `
      <tr>
        <td class="td" style="font-weight:600;">${escHtml(m.file_snapshot?.filename || `Model ${idx + 1}`)}</td>
        <td class="td td-muted">${escHtml(m.material_snapshot?.name || '-')}</td>
        <td class="td td-muted">${escHtml(m.preset_snapshot?.name || '-')}</td>
        <td class="td td-center" style="font-weight:700;font-size:15px;">${qty}</td>
      </tr>`;
  }).join('');

  const totalPieces = models.reduce((s, m) => s + (Number(m.quantity) || 1), 0);

  // Shipping address block
  const addressHtml = (addr.street || addr.city) ? `
  <div style="margin-bottom:24px;padding:16px;border:2px solid #111827;border-radius:8px;">
    <div class="label">Dorucovaci adresa</div>
    <div style="font-size:15px;font-weight:700;color:#111827;">${escHtml(customer.name || '-')}</div>
    ${customer.company ? `<div style="font-size:13px;color:#4b5563;">${escHtml(customer.company)}</div>` : ''}
    ${addr.street ? `<div style="font-size:14px;color:#1f2937;margin-top:6px;">${escHtml(addr.street)}</div>` : ''}
    ${addr.city ? `<div style="font-size:14px;color:#1f2937;">${escHtml([addr.zip, addr.city].filter(Boolean).join(' '))}</div>` : ''}
    ${customer.phone ? `<div style="font-size:13px;color:#4b5563;margin-top:6px;">Tel: ${escHtml(customer.phone)}</div>` : ''}
  </div>` : `
  <div style="margin-bottom:24px;">
    <div class="label">Zakaznik</div>
    <div style="font-size:15px;font-weight:700;color:#111827;">${escHtml(customer.name || '-')}</div>
    ${customer.company ? `<div style="font-size:13px;color:#4b5563;">${escHtml(customer.company)}</div>` : ''}
    ${customer.phone ? `<div style="font-size:13px;color:#4b5563;margin-top:4px;">Tel: ${escHtml(customer.phone)}</div>` : ''}
  </div>`;

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Dodaci list ${escHtml(order.id || '')}</title>
  <style>
    ${BASE_STYLES}
    .checkbox {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #9ca3af;
      border-radius: 3px;
      vertical-align: middle;
      margin-right: 8px;
    }
  </style>
</head>
<body>

  ${companyHeaderHtml(company, 'DODACI LIST')}

  <!-- Order info -->
  <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:24px;">
    <div style="flex:1;">
      ${addressHtml}
    </div>
    <div style="text-align:right;">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div>
          <div class="label">Cislo objednavky</div>
          <div style="font-size:16px;font-weight:800;color:#111827;">${escHtml(order.id || '-')}</div>
        </div>
        <div>
          <div class="label">Datum</div>
          <div style="font-size:14px;font-weight:600;color:#111827;">${formatDate(new Date())}</div>
        </div>
        <div>
          <div class="label">Pocet polozek</div>
          <div style="font-size:14px;font-weight:600;color:#111827;">${totalPieces} ks</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Items table -->
  <table style="margin-bottom:24px;">
    <thead>
      <tr>
        <th class="th">Polozka</th>
        <th class="th">Material</th>
        <th class="th">Kvalita</th>
        <th class="th th-center">Pocet kusu</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
    <tfoot>
      <tr>
        <td class="td td-bold" colspan="3" style="border-top:2px solid #e5e7eb;">Celkem polozek</td>
        <td class="td td-center td-bold" style="border-top:2px solid #e5e7eb;font-size:16px;">${totalPieces}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Checklist -->
  <div style="margin-bottom:24px;">
    <div class="label">Kontrola baleni</div>
    <div style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
      <div style="padding:6px 0;font-size:13px;color:#4b5563;">
        <span class="checkbox"></span> Vsechny polozky zkontrolovany
      </div>
      <div style="padding:6px 0;font-size:13px;color:#4b5563;">
        <span class="checkbox"></span> Baleni zabezpeceno
      </div>
      <div style="padding:6px 0;font-size:13px;color:#4b5563;">
        <span class="checkbox"></span> Stitek s adresou prilepen
      </div>
    </div>
  </div>

  <!-- Signature -->
  <div style="display:flex;gap:40px;margin-top:40px;">
    <div style="flex:1;">
      <div style="border-top:1px solid #9ca3af;padding-top:8px;font-size:12px;color:#9ca3af;">Datum a podpis baleni</div>
    </div>
    <div style="flex:1;">
      <div style="border-top:1px solid #9ca3af;padding-top:8px;font-size:12px;color:#9ca3af;">Prevzal</div>
    </div>
  </div>

  ${footerHtml(company)}

</body>
</html>`;
}
