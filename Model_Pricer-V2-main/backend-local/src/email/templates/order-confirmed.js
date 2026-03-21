/**
 * Email template: Order Confirmed
 *
 * Sent when an order is accepted / confirmed by the shop.
 * Czech language with full diacritics.
 *
 * @module email/templates/order-confirmed
 */

/**
 * Escape HTML special characters.
 * @param {*} val
 * @returns {string}
 */
function esc(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format price with currency.
 * @param {number} amount
 * @param {string} [currency='CZK']
 * @returns {string}
 */
function formatPrice(amount, currency = 'CZK') {
  const num = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, minimumFractionDigits: 2 }).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
}

/**
 * Build items table rows HTML.
 * @param {Array} items
 * @param {string} currency
 * @returns {string}
 */
function buildItemRows(items, currency) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<tr><td colspan="4" style="padding:8px 12px;text-align:center;color:#9ca3af;">Bez polo\u017eek</td></tr>';
  }
  return items.map((item, i) => {
    const name = esc(item.name || item.modelName || `Polo\u017eka ${i + 1}`);
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice || item.price) || 0;
    const total = Number(item.totalPrice) || unitPrice * qty;
    return `<tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:8px 12px;">${name}</td>
      <td style="padding:8px 12px;text-align:center;">${qty}</td>
      <td style="padding:8px 12px;text-align:right;">${formatPrice(unitPrice, currency)}</td>
      <td style="padding:8px 12px;text-align:right;">${formatPrice(total, currency)}</td>
    </tr>`;
  }).join('');
}

/**
 * Render the order-confirmed email.
 *
 * @param {object} data
 * @param {string}  data.orderNumber      - Display order number (e.g. "ORD-2026-001")
 * @param {string}  data.customerName     - Customer full name
 * @param {string}  [data.customerEmail]  - Customer email
 * @param {Array}   [data.items]          - Order items array
 * @param {number}  [data.totalPrice]     - Total price
 * @param {string}  [data.currency='CZK'] - Currency code
 * @param {string}  [data.companyName]    - Seller company name
 * @param {string}  [data.companyLogo]    - URL to company logo
 * @returns {{ subject: string, html: string, text: string }}
 */
export function render(data) {
  const {
    orderNumber = '',
    customerName = '',
    items = [],
    totalPrice = 0,
    currency = 'CZK',
    companyName = 'ModelPricer',
    companyLogo = '',
  } = data || {};

  const subject = `Va\u0161e objedn\u00e1vka #${orderNumber} byla p\u0159ijata`;

  const logoHtml = companyLogo
    ? `<img src="${esc(companyLogo)}" alt="${esc(companyName)}" style="max-height:40px;max-width:180px;" />`
    : `<span style="font-size:20px;font-weight:700;">${esc(companyName)}</span>`;

  const html = `<!DOCTYPE html>
<html lang="cs">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">

  <!-- Header -->
  <div style="background:#1a1a2e;color:#ffffff;padding:20px 24px;text-align:center;">
    ${logoHtml}
  </div>

  <!-- Body -->
  <div style="padding:24px;">
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Objedn\u00e1vka p\u0159ijata</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 12px;">
      Dobr\u00fd den, ${esc(customerName)},
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 20px;">
      va\u0161e objedn\u00e1vka <strong>#${esc(orderNumber)}</strong> byla \u00fasp\u011b\u0161n\u011b p\u0159ijata.
      Brzy za\u010dneme s jej\u00edm zpracov\u00e1n\u00edm.
    </p>

    <!-- Items table -->
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;text-align:left;font-weight:600;color:#374151;">Polo\u017eka</th>
          <th style="padding:8px 12px;text-align:center;font-weight:600;color:#374151;">Ks</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;color:#374151;">Cena/ks</th>
          <th style="padding:8px 12px;text-align:right;font-weight:600;color:#374151;">Celkem</th>
        </tr>
      </thead>
      <tbody>
        ${buildItemRows(items, currency)}
      </tbody>
    </table>

    <!-- Total -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px 16px;margin:16px 0;text-align:right;">
      <strong style="color:#15803d;font-size:16px;">Celkem: ${formatPrice(totalPrice, currency)}</strong>
    </div>

    <p style="color:#4b5563;line-height:1.6;margin:16px 0 0;">
      D\u011bkujeme za va\u0161i objedn\u00e1vku!
    </p>
  </div>

  <!-- Footer -->
  <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
    Toto je automatick\u00e1 zpr\u00e1va od ${esc(companyName)}. Neodpov\u00eddejte na tento e-mail.
  </div>

</div>
</body>
</html>`;

  const text = `${subject}

Dobr\u00fd den, ${customerName},

va\u0161e objedn\u00e1vka #${orderNumber} byla \u00fasp\u011b\u0161n\u011b p\u0159ijata.
Brzy za\u010dneme s jej\u00edm zpracov\u00e1n\u00edm.

Celkov\u00e1 cena: ${formatPrice(totalPrice, currency)}

D\u011bkujeme za va\u0161i objedn\u00e1vku!

${companyName}`;

  return { subject, html, text };
}
