/**
 * Email template: Order Completed
 *
 * Sent when an order is fully completed / delivered.
 * Czech language with full diacritics.
 *
 * @module email/templates/order-completed
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
 * Render the order-completed email.
 *
 * @param {object} data
 * @param {string}  data.orderNumber      - Display order number
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
    totalPrice = 0,
    currency = 'CZK',
    companyName = 'ModelPricer',
    companyLogo = '',
  } = data || {};

  const subject = `Va\u0161e objedn\u00e1vka #${orderNumber} je dokon\u010dena`;

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
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Objedn\u00e1vka dokon\u010dena</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 12px;">
      Dobr\u00fd den, ${esc(customerName)},
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      va\u0161e objedn\u00e1vka <strong>#${esc(orderNumber)}</strong> byla \u00fasp\u011b\u0161n\u011b dokon\u010dena.
    </p>

    <!-- Success indicator -->
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:14px 16px;margin:16px 0;text-align:center;">
      <span style="font-size:32px;">&#x2705;</span>
      <p style="margin:8px 0 0;font-size:15px;color:#15803d;font-weight:600;">
        V\u0161e je hotovo!
      </p>
      <p style="margin:4px 0 0;font-size:13px;color:#16a34a;">
        Celkov\u00e1 \u010d\u00e1stka: ${formatPrice(totalPrice, currency)}
      </p>
    </div>

    <p style="color:#4b5563;line-height:1.6;margin:16px 0 8px;">
      Douf\u00e1me, \u017ee budete s va\u0161imi 3D tisky spokojeni.
      Pokud byste m\u011bli jak\u00e9koli dotazy, neposp\u00edchejte n\u00e1s kontaktovat.
    </p>

    <p style="color:#4b5563;line-height:1.6;margin:8px 0 0;">
      D\u011bkujeme, \u017ee jste si vybrali ${esc(companyName)}!
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

va\u0161e objedn\u00e1vka #${orderNumber} byla \u00fasp\u011b\u0161n\u011b dokon\u010dena.

Celkov\u00e1 \u010d\u00e1stka: ${formatPrice(totalPrice, currency)}

Douf\u00e1me, \u017ee budete s va\u0161imi 3D tisky spokojeni.
Pokud byste m\u011bli jak\u00e9koli dotazy, neposp\u00edchejte n\u00e1s kontaktovat.

D\u011bkujeme, \u017ee jste si vybrali ${companyName}!

${companyName}`;

  return { subject, html, text };
}
