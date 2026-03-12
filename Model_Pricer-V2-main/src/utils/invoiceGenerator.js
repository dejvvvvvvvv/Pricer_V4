/*
  Invoice Generator — HTML Invoice Generation
  ---------------------------------------------
  Generates professional HTML invoices from order data + company branding.

  Public API:
    - generateInvoiceHTML(order, companyConfig, invoiceNumber, options)
    - generateInvoiceNumber(orderId)
    - formatInvoiceDate(isoOrDate)
    - getDueDate(issueDateIso, daysToAdd)
*/

// ── Helpers ──

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function formatMoney(amount) {
  const n = round2(amount);
  // Czech locale: space as thousands separator, comma for decimals
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kc';
}

export function formatInvoiceDate(isoOrDate) {
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    return d.toLocaleDateString('cs-CZ', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return String(isoOrDate || '');
  }
}

export function getDueDate(issueDateIso, daysToAdd = 14) {
  const d = new Date(issueDateIso || Date.now());
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString();
}

export function generateInvoiceNumber(orderId) {
  const year = new Date().getFullYear();
  const digits = String(orderId || '').replace(/\D/g, '');
  const seq = digits.slice(-5).padStart(5, '0');
  return `${year}-${seq}`;
}

// ── Main generator ──

/**
 * Generate complete HTML for a printable invoice.
 *
 * @param {Object} order - Order object (same shape as adminOrdersStorage)
 * @param {Object} companyConfig - Company data from adminCompanyStorage
 * @param {string} invoiceNumber - Invoice number string
 * @param {Object} [options]
 * @param {string} [options.issueDate] - ISO date of issue (defaults to now)
 * @param {string} [options.dueDate] - ISO due date (defaults to issueDate + 14 days)
 * @param {boolean} [options.showLogo] - Whether to show company logo
 * @param {string} [options.logoUrl] - URL/data-uri for company logo
 * @param {string} [options.vatRate] - VAT rate string, e.g. "21" for 21%. Empty = no VAT.
 * @param {string} [options.bankAccount] - Bank account number
 * @param {string} [options.iban] - IBAN
 * @param {string} [options.footerNote] - Additional footer note
 * @returns {string} Complete HTML document string
 */
export function generateInvoiceHTML(order, companyConfig, invoiceNumber, options = {}) {
  const {
    issueDate = new Date().toISOString(),
    dueDate = getDueDate(issueDate),
    showLogo = false,
    logoUrl = '',
    vatRate = '',
    bankAccount = '',
    iban = '',
    footerNote = '',
  } = options;

  const company = companyConfig || {};
  const customer = order.customer_snapshot || {};
  const models = order.models || [];

  // Compute totals
  let subtotalModels = 0;
  const rows = models.map((m, idx) => {
    const bd = m.price_breakdown_snapshot || {};
    const qty = Number(m.quantity) || 1;
    const unitPrice = Number(bd.model_total) || Number(bd.total) || Number(bd.totalPrice) || Number(m.totalPrice) || Number(m.price) || 0;
    const lineTotal = round2(unitPrice * qty);
    subtotalModels += lineTotal;

    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;">
          ${escHtml(m.file_snapshot?.filename || `Model ${idx + 1}`)}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#4b5563;">
          ${escHtml(m.material_snapshot?.name || '-')}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;text-align:center;">
          ${qty}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;text-align:right;font-variant-numeric:tabular-nums;">
          ${formatMoney(unitPrice)}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#1f2937;text-align:right;font-weight:600;font-variant-numeric:tabular-nums;">
          ${formatMoney(lineTotal)}
        </td>
      </tr>`;
  });

  // Fees
  const fees = order.one_time_fees || [];
  const feesTotal = round2(fees.reduce((s, f) => s + (Number(f.amount) || 0), 0));
  const feesRows = fees.filter(f => Number(f.amount) > 0).map(f => `
    <tr>
      <td colspan="4" style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
        ${escHtml(f.label || f.name || 'Poplatek')}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;">
        ${formatMoney(f.amount)}
      </td>
    </tr>`);

  // Shipping
  const shippingTotal = Number(order.totals_snapshot?.shipping_total) || 0;
  const minOrderDelta = Number(order.totals_snapshot?.min_order_delta) || 0;

  const subtotal = round2(subtotalModels + feesTotal + shippingTotal + minOrderDelta);

  // VAT
  const hasVat = vatRate && Number(vatRate) > 0;
  const vatAmount = hasVat ? round2(subtotal * (Number(vatRate) / 100)) : 0;
  const grandTotal = round2(subtotal + vatAmount);

  // Variable symbol = invoice number without dashes
  const variableSymbol = invoiceNumber.replace(/\D/g, '');

  // Logo HTML
  const logoHtml = showLogo && logoUrl
    ? `<img src="${escAttr(logoUrl)}" alt="Logo" style="max-height:60px;max-width:200px;object-fit:contain;" />`
    : '';

  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Faktura ${escHtml(invoiceNumber)}</title>
  <style>
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
  </style>
</head>
<body>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #111827;">
    <div>
      ${logoHtml}
      <h1 style="font-size:28px;font-weight:800;color:#111827;margin-top:${showLogo && logoUrl ? '12px' : '0'};">FAKTURA</h1>
      <div style="font-size:14px;color:#6b7280;margin-top:4px;">c. ${escHtml(invoiceNumber)}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:16px;font-weight:700;color:#111827;">${escHtml(company.companyName || '')}</div>
      ${company.address ? `<div style="font-size:13px;color:#4b5563;margin-top:2px;">${escHtml(company.address)}</div>` : ''}
      ${company.city || company.zip ? `<div style="font-size:13px;color:#4b5563;">${escHtml([company.zip, company.city].filter(Boolean).join(' '))}</div>` : ''}
      ${company.ico ? `<div style="font-size:12px;color:#6b7280;margin-top:6px;">ICO: ${escHtml(company.ico)}</div>` : ''}
      ${company.dic ? `<div style="font-size:12px;color:#6b7280;">DIC: ${escHtml(company.dic)}</div>` : ''}
    </div>
  </div>

  <!-- Dates + Customer -->
  <div style="display:flex;justify-content:space-between;gap:32px;margin-bottom:28px;">
    <div style="flex:1;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:8px;">Odberatel</div>
      <div style="font-size:15px;font-weight:700;color:#111827;">${escHtml(customer.name || '-')}</div>
      ${customer.company ? `<div style="font-size:13px;color:#4b5563;">${escHtml(customer.company)}</div>` : ''}
      ${customer.email ? `<div style="font-size:13px;color:#4b5563;">${escHtml(customer.email)}</div>` : ''}
      ${customer.phone ? `<div style="font-size:13px;color:#4b5563;">${escHtml(customer.phone)}</div>` : ''}
      ${order.shipping_address?.street ? `<div style="font-size:13px;color:#4b5563;margin-top:4px;">${escHtml(order.shipping_address.street)}</div>` : ''}
      ${order.shipping_address?.city ? `<div style="font-size:13px;color:#4b5563;">${escHtml([order.shipping_address.zip, order.shipping_address.city].filter(Boolean).join(' '))}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Datum vystaveni</div>
          <div style="font-size:14px;font-weight:600;color:#111827;">${formatInvoiceDate(issueDate)}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Datum splatnosti</div>
          <div style="font-size:14px;font-weight:600;color:#111827;">${formatInvoiceDate(dueDate)}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Objednavka</div>
          <div style="font-size:14px;font-weight:600;color:#111827;">${escHtml(order.id || '-')}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Items table -->
  <table style="margin-bottom:24px;">
    <thead>
      <tr style="background:#f9fafb;">
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Polozka</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Material</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Ks</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Cena/ks</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;border-bottom:2px solid #e5e7eb;">Celkem</th>
      </tr>
    </thead>
    <tbody>
      ${rows.join('')}
      ${feesRows.join('')}
      ${shippingTotal > 0 ? `
      <tr>
        <td colspan="4" style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Doprava</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;">${formatMoney(shippingTotal)}</td>
      </tr>` : ''}
      ${minOrderDelta > 0 ? `
      <tr>
        <td colspan="4" style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;">Dorovnani min. objednavky</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right;font-variant-numeric:tabular-nums;">${formatMoney(minOrderDelta)}</td>
      </tr>` : ''}
    </tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:28px;">
    <div style="width:280px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#4b5563;">
        <span>Zaklad</span>
        <span style="font-variant-numeric:tabular-nums;">${formatMoney(subtotal)}</span>
      </div>
      ${hasVat ? `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#4b5563;">
        <span>DPH ${escHtml(vatRate)} %</span>
        <span style="font-variant-numeric:tabular-nums;">${formatMoney(vatAmount)}</span>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:18px;font-weight:800;color:#111827;border-top:2px solid #111827;margin-top:4px;">
        <span>Celkem</span>
        <span style="font-variant-numeric:tabular-nums;">${formatMoney(grandTotal)}</span>
      </div>
    </div>
  </div>

  <!-- Payment info -->
  ${bankAccount || iban ? `
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:8px;">Platebni udaje</div>
    ${bankAccount ? `<div style="font-size:13px;color:#4b5563;"><strong>Cislo uctu:</strong> ${escHtml(bankAccount)}</div>` : ''}
    ${iban ? `<div style="font-size:13px;color:#4b5563;"><strong>IBAN:</strong> ${escHtml(iban)}</div>` : ''}
    <div style="font-size:13px;color:#4b5563;"><strong>Variabilni symbol:</strong> ${escHtml(variableSymbol)}</div>
  </div>` : `
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;margin-bottom:8px;">Variabilni symbol</div>
    <div style="font-size:15px;font-weight:700;color:#111827;font-variant-numeric:tabular-nums;">${escHtml(variableSymbol)}</div>
  </div>`}

  <!-- Footer -->
  <div style="border-top:1px solid #e5e7eb;padding-top:16px;font-size:12px;color:#9ca3af;text-align:center;">
    ${company.companyName ? `<div>${escHtml(company.companyName)}${company.ico ? ` | ICO: ${escHtml(company.ico)}` : ''}${company.dic ? ` | DIC: ${escHtml(company.dic)}` : ''}</div>` : ''}
    ${footerNote ? `<div style="margin-top:6px;">${escHtml(footerNote)}</div>` : ''}
    <div style="margin-top:6px;">Faktura vygenerovana: ${formatInvoiceDate(new Date())}</div>
  </div>

</body>
</html>`;
}

// ── HTML escaping ──

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return escHtml(str);
}
