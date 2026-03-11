/**
 * PDF Service — generates printable HTML order summaries.
 *
 * Pure service module with NO Express dependency (no req/res/next).
 * Returns styled HTML strings that can be rendered in a browser and
 * printed via window.print() or saved as PDF via the browser's print dialog.
 *
 * Features:
 * - Print-ready HTML with @media print CSS
 * - Bilingual support (CZ / EN)
 * - Order details: header, customer info, items table, fees, totals
 * - Professional, clean layout suitable for invoices/receipts
 *
 * @module services/pdfService
 */

// ── Translations ──

const TRANSLATIONS = {
  cs: {
    title: "Souhrn objednavky",
    orderNumber: "Cislo objednavky",
    date: "Datum",
    status: "Stav",
    customerInfo: "Zakaznik",
    name: "Jmeno",
    email: "E-mail",
    itemsTable: "Polozky",
    col_item: "Polozka",
    col_material: "Material",
    col_quality: "Kvalita",
    col_qty: "Mnozstvi",
    col_unitPrice: "Cena/ks",
    col_total: "Celkem",
    subtotal: "Mezisouc\u0306et",
    fees: "Poplatky",
    totalPrice: "Celkova cena",
    notes: "Poznamky",
    footer: "Dekujeme za Vasi objednavku.",
    generatedAt: "Vygenerovano",
    page: "Strana",
    noItems: "Zadne polozky",
    status_new: "Nova",
    status_review: "Ke kontrole",
    status_approved: "Schvalena",
    status_processing: "Zpracovava se",
    status_printing: "Tisk",
    status_post_processing: "Dokoncovani",
    status_ready: "Pripravena",
    status_shipped: "Odeslana",
    status_completed: "Dokoncena",
    status_cancelled: "Zrusena",
  },
  en: {
    title: "Order Summary",
    orderNumber: "Order Number",
    date: "Date",
    status: "Status",
    customerInfo: "Customer",
    name: "Name",
    email: "Email",
    itemsTable: "Items",
    col_item: "Item",
    col_material: "Material",
    col_quality: "Quality",
    col_qty: "Qty",
    col_unitPrice: "Unit Price",
    col_total: "Total",
    subtotal: "Subtotal",
    fees: "Fees",
    totalPrice: "Total Price",
    notes: "Notes",
    footer: "Thank you for your order.",
    generatedAt: "Generated",
    page: "Page",
    noItems: "No items",
    status_new: "New",
    status_review: "In Review",
    status_approved: "Approved",
    status_processing: "Processing",
    status_printing: "Printing",
    status_post_processing: "Post-processing",
    status_ready: "Ready",
    status_shipped: "Shipped",
    status_completed: "Completed",
    status_cancelled: "Cancelled",
  },
};

/**
 * Resolve language from Accept-Language header value.
 *
 * @param {string} [acceptLanguage] - Accept-Language header value
 * @returns {"cs" | "en"}
 */
function resolveLanguage(acceptLanguage) {
  if (!acceptLanguage) return "en";
  const lower = acceptLanguage.toLowerCase();
  if (lower.startsWith("cs") || lower.startsWith("sk")) return "cs";
  return "en";
}

/**
 * Format a date string for display.
 *
 * @param {string} isoDate - ISO date string
 * @param {"cs" | "en"} lang
 * @returns {string}
 */
function formatDate(isoDate, lang) {
  if (!isoDate) return "—";
  try {
    const d = new Date(isoDate);
    const locale = lang === "cs" ? "cs-CZ" : "en-US";
    return d.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(isoDate);
  }
}

/**
 * Format a price value with currency.
 *
 * @param {number} value
 * @param {string} currency
 * @param {"cs" | "en"} lang
 * @returns {string}
 */
function formatPrice(value, currency, lang) {
  const num = Number(value) || 0;
  const cur = currency || "CZK";
  try {
    const locale = lang === "cs" ? "cs-CZ" : "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${cur}`;
  }
}

/**
 * Translate a status key.
 *
 * @param {string} status
 * @param {Object} t - translations object
 * @returns {string}
 */
function translateStatus(status, t) {
  const key = `status_${status}`;
  return t[key] || status || "—";
}

/**
 * Escape HTML special characters to prevent XSS.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── CSS ──

const PRINT_CSS = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #1a1a2e;
    background: #fff;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 3px solid #1a1a2e;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  .header-left h1 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
  }

  .header-left .company-name {
    font-size: 14px;
    color: #555;
  }

  .header-right {
    text-align: right;
    font-size: 12px;
    color: #555;
  }

  .header-right .order-number {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }

  .meta-section {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 16px;
  }

  .meta-section h2 {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #555;
    margin-bottom: 8px;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 6px;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 13px;
  }

  .meta-label {
    color: #555;
    font-weight: 500;
  }

  .meta-value {
    color: #1a1a2e;
    font-weight: 600;
  }

  .status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .status-new { background: #e3f2fd; color: #1565c0; }
  .status-review { background: #fff3e0; color: #e65100; }
  .status-approved { background: #e8f5e9; color: #2e7d32; }
  .status-processing { background: #f3e5f5; color: #7b1fa2; }
  .status-printing { background: #e0f7fa; color: #00838f; }
  .status-post_processing { background: #fce4ec; color: #c62828; }
  .status-ready { background: #e8f5e9; color: #1b5e20; }
  .status-shipped { background: #e3f2fd; color: #0d47a1; }
  .status-completed { background: #c8e6c9; color: #1b5e20; }
  .status-cancelled { background: #ffebee; color: #b71c1c; }

  .items-section {
    margin-bottom: 24px;
  }

  .items-section h2 {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #555;
    margin-bottom: 10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }

  thead th {
    background: #1a1a2e;
    color: #fff;
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  thead th:last-child,
  thead th:nth-child(4),
  thead th:nth-child(5) {
    text-align: right;
  }

  tbody td {
    padding: 8px 10px;
    border-bottom: 1px solid #e9ecef;
    vertical-align: top;
  }

  tbody td:last-child,
  tbody td:nth-child(4),
  tbody td:nth-child(5) {
    text-align: right;
    white-space: nowrap;
  }

  tbody tr:nth-child(even) {
    background: #f8f9fa;
  }

  .totals-section {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 24px;
  }

  .totals-table {
    width: 300px;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
    border-bottom: 1px solid #e9ecef;
  }

  .totals-row.grand-total {
    font-size: 16px;
    font-weight: 700;
    border-top: 2px solid #1a1a2e;
    border-bottom: 2px solid #1a1a2e;
    padding: 10px 0;
    margin-top: 4px;
  }

  .totals-label {
    color: #555;
  }

  .totals-value {
    font-weight: 600;
    color: #1a1a2e;
  }

  .fee-row .totals-label {
    padding-left: 12px;
    font-size: 12px;
  }

  .notes-section {
    background: #fffde7;
    border: 1px solid #fff9c4;
    border-radius: 6px;
    padding: 14px;
    margin-bottom: 24px;
  }

  .notes-section h2 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 6px;
  }

  .notes-section p {
    font-size: 13px;
    color: #333;
    white-space: pre-wrap;
  }

  .footer {
    border-top: 1px solid #dee2e6;
    padding-top: 16px;
    text-align: center;
    font-size: 11px;
    color: #999;
  }

  .footer .thank-you {
    font-size: 14px;
    color: #555;
    margin-bottom: 8px;
  }

  /* Print-specific styles */
  @media print {
    body {
      padding: 0;
      font-size: 11px;
    }

    .header {
      border-bottom-width: 2px;
    }

    .meta-section {
      border: 1px solid #ccc;
      background: #fafafa;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    thead th {
      background: #1a1a2e !important;
      color: #fff !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    tbody tr:nth-child(even) {
      background: #f5f5f5 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .status-badge {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .notes-section {
      background: #fffef0 !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .no-print {
      display: none !important;
    }

    @page {
      margin: 15mm;
      size: A4;
    }
  }
`;

// ── HTML Generation ──

/**
 * Build items rows from order.items or order.models arrays.
 *
 * @param {Object} order
 * @param {Object} t - translations
 * @param {"cs" | "en"} lang
 * @returns {{ rowsHtml: string, itemsSubtotal: number }}
 */
function buildItemRows(order, t, lang) {
  const currency = order.currency || "CZK";
  const allItems = [];

  // Normalize items from both "items" and "models" arrays
  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      allItems.push({
        name: item.modelName || item.name || item.fileName || "—",
        material: item.material || item.materialName || "—",
        quality: item.quality || item.layerHeight || "—",
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice || item.price || 0),
        total: Number(item.totalPrice || item.lineTotal || 0),
      });
    }
  }

  if (Array.isArray(order.models)) {
    for (const model of order.models) {
      const qty = Number(model.quantity) || 1;
      const unit = Number(model.unitPrice || model.price || 0);
      allItems.push({
        name: model.modelName || model.name || model.fileName || "—",
        material: model.material || model.materialName || "—",
        quality: model.quality || model.layerHeight || "—",
        quantity: qty,
        unitPrice: unit,
        total: Number(model.totalPrice || model.lineTotal || 0) || unit * qty,
      });
    }
  }

  if (allItems.length === 0) {
    return {
      rowsHtml: `<tr><td colspan="6" style="text-align:center;color:#999;padding:20px;">${escapeHtml(t.noItems)}</td></tr>`,
      itemsSubtotal: 0,
    };
  }

  let itemsSubtotal = 0;
  let rowsHtml = "";

  for (const item of allItems) {
    const lineTotal = item.total || item.unitPrice * item.quantity;
    itemsSubtotal += lineTotal;

    rowsHtml += `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(String(item.material))}</td>
        <td>${escapeHtml(String(item.quality))}</td>
        <td>${item.quantity}</td>
        <td>${formatPrice(item.unitPrice, currency, lang)}</td>
        <td>${formatPrice(lineTotal, currency, lang)}</td>
      </tr>
    `;
  }

  return { rowsHtml, itemsSubtotal };
}

/**
 * Build fees breakdown HTML.
 *
 * @param {Object} order
 * @param {Object} t - translations
 * @param {"cs" | "en"} lang
 * @returns {{ feesHtml: string, feesTotal: number }}
 */
function buildFeesSection(order, t, lang) {
  const currency = order.currency || "CZK";
  const fees = [];

  // one_time_fees from order
  if (Array.isArray(order.one_time_fees)) {
    for (const fee of order.one_time_fees) {
      fees.push({
        label: fee.label || fee.name || fee.type || "Fee",
        amount: Number(fee.amount || fee.value || 0),
      });
    }
  }

  // totals_snapshot may contain fee breakdowns
  if (order.totals_snapshot) {
    const snap = order.totals_snapshot;
    if (typeof snap.setupFee === "number" && snap.setupFee > 0) {
      fees.push({ label: lang === "cs" ? "Poplatek za nastaveni" : "Setup fee", amount: snap.setupFee });
    }
    if (typeof snap.shippingFee === "number" && snap.shippingFee > 0) {
      fees.push({ label: lang === "cs" ? "Doprava" : "Shipping", amount: snap.shippingFee });
    }
    if (typeof snap.rushFee === "number" && snap.rushFee > 0) {
      fees.push({ label: lang === "cs" ? "Expresni priplatek" : "Rush fee", amount: snap.rushFee });
    }
  }

  if (fees.length === 0) {
    return { feesHtml: "", feesTotal: 0 };
  }

  let feesTotal = 0;
  let feesHtml = "";

  for (const fee of fees) {
    feesTotal += fee.amount;
    feesHtml += `
      <div class="totals-row fee-row">
        <span class="totals-label">${escapeHtml(fee.label)}</span>
        <span class="totals-value">${formatPrice(fee.amount, currency, lang)}</span>
      </div>
    `;
  }

  return { feesHtml, feesTotal };
}

/**
 * Generate a complete printable HTML order summary.
 *
 * This is the main entry point for the service. It takes an order object
 * and returns a self-contained HTML string with embedded CSS.
 *
 * @param {Object} order - The full order object from ordersStore
 * @param {Object} [options]
 * @param {string} [options.acceptLanguage] - Accept-Language header value for i18n
 * @param {string} [options.companyName] - Company/tenant name for the header
 * @returns {{ ok: boolean, html?: string, error?: string }}
 */
export function generateOrderSummaryHtml(order, options = {}) {
  if (!order) {
    return { ok: false, error: "Order is required" };
  }

  if (!order.id) {
    return { ok: false, error: "Order must have an id" };
  }

  const lang = resolveLanguage(options.acceptLanguage);
  const t = TRANSLATIONS[lang];
  const currency = order.currency || "CZK";
  const companyName = options.companyName || "ModelPricer";

  // Build items table
  const { rowsHtml, itemsSubtotal } = buildItemRows(order, t, lang);

  // Build fees
  const { feesHtml, feesTotal } = buildFeesSection(order, t, lang);

  // Total price — use order.totalPrice if available, otherwise compute
  const totalPrice = Number(order.totalPrice) || (itemsSubtotal + feesTotal);

  // Status CSS class
  const statusClass = `status-${(order.status || "new").replace(/\s+/g, "_")}`;

  const now = new Date().toISOString();

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(t.title)} — ${escapeHtml(order.orderNumber || order.id)}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>${escapeHtml(t.title)}</h1>
      <div class="company-name">${escapeHtml(companyName)}</div>
    </div>
    <div class="header-right">
      <div class="order-number">${escapeHtml(order.orderNumber || order.id)}</div>
      <div>${escapeHtml(t.date)}: ${escapeHtml(formatDate(order.createdAt, lang))}</div>
      <div>
        <span class="status-badge ${statusClass}">${escapeHtml(translateStatus(order.status, t))}</span>
      </div>
    </div>
  </div>

  <!-- Customer & Order Meta -->
  <div class="meta-grid">
    <div class="meta-section">
      <h2>${escapeHtml(t.customerInfo)}</h2>
      ${order.customerName ? `
      <div class="meta-row">
        <span class="meta-label">${escapeHtml(t.name)}</span>
        <span class="meta-value">${escapeHtml(order.customerName)}</span>
      </div>` : ""}
      ${order.customerEmail ? `
      <div class="meta-row">
        <span class="meta-label">${escapeHtml(t.email)}</span>
        <span class="meta-value">${escapeHtml(order.customerEmail)}</span>
      </div>` : ""}
      ${!order.customerName && !order.customerEmail ? `
      <div class="meta-row">
        <span class="meta-label" style="color:#999;">—</span>
      </div>` : ""}
    </div>

    <div class="meta-section">
      <h2>${escapeHtml(t.orderNumber)}</h2>
      <div class="meta-row">
        <span class="meta-label">ID</span>
        <span class="meta-value" style="font-size:11px;word-break:break-all;">${escapeHtml(order.id)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">${escapeHtml(t.status)}</span>
        <span class="meta-value">
          <span class="status-badge ${statusClass}">${escapeHtml(translateStatus(order.status, t))}</span>
        </span>
      </div>
      ${order.completedAt ? `
      <div class="meta-row">
        <span class="meta-label">${lang === "cs" ? "Dokonceno" : "Completed"}</span>
        <span class="meta-value">${escapeHtml(formatDate(order.completedAt, lang))}</span>
      </div>` : ""}
    </div>
  </div>

  <!-- Items Table -->
  <div class="items-section">
    <h2>${escapeHtml(t.itemsTable)}</h2>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(t.col_item)}</th>
          <th>${escapeHtml(t.col_material)}</th>
          <th>${escapeHtml(t.col_quality)}</th>
          <th>${escapeHtml(t.col_qty)}</th>
          <th>${escapeHtml(t.col_unitPrice)}</th>
          <th>${escapeHtml(t.col_total)}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals-section">
    <div class="totals-table">
      <div class="totals-row">
        <span class="totals-label">${escapeHtml(t.subtotal)}</span>
        <span class="totals-value">${formatPrice(itemsSubtotal, currency, lang)}</span>
      </div>
      ${feesHtml ? `
      <div class="totals-row">
        <span class="totals-label" style="font-weight:600;">${escapeHtml(t.fees)}</span>
        <span class="totals-value">${formatPrice(feesTotal, currency, lang)}</span>
      </div>
      ${feesHtml}
      ` : ""}
      <div class="totals-row grand-total">
        <span class="totals-label">${escapeHtml(t.totalPrice)}</span>
        <span class="totals-value">${formatPrice(totalPrice, currency, lang)}</span>
      </div>
    </div>
  </div>

  ${order.notes ? `
  <!-- Notes -->
  <div class="notes-section">
    <h2>${escapeHtml(t.notes)}</h2>
    <p>${escapeHtml(order.notes)}</p>
  </div>
  ` : ""}

  <!-- Footer -->
  <div class="footer">
    <div class="thank-you">${escapeHtml(t.footer)}</div>
    <div>${escapeHtml(t.generatedAt)}: ${escapeHtml(formatDate(now, lang))}</div>
  </div>

  <!-- Print button (hidden when printing) -->
  <div class="no-print" style="text-align:center;margin-top:30px;">
    <button onclick="window.print()" style="
      padding: 10px 28px;
      font-size: 14px;
      font-weight: 600;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    ">${lang === "cs" ? "Tisknout / Ulozit jako PDF" : "Print / Save as PDF"}</button>
  </div>

</body>
</html>`;

  return { ok: true, html };
}
