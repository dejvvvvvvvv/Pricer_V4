/**
 * Email template: Order Shipped
 *
 * Sent when an order has been dispatched / shipped.
 * Includes optional tracking URL.
 * Czech language with full diacritics.
 *
 * @module email/templates/order-shipped
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
 * Render the order-shipped email.
 *
 * @param {object} data
 * @param {string}  data.orderNumber      - Display order number
 * @param {string}  data.customerName     - Customer full name
 * @param {string}  [data.customerEmail]  - Customer email
 * @param {Array}   [data.items]          - Order items array
 * @param {number}  [data.totalPrice]     - Total price
 * @param {string}  [data.currency='CZK'] - Currency code
 * @param {string}  [data.trackingUrl]    - Tracking URL (optional)
 * @param {string}  [data.companyName]    - Seller company name
 * @param {string}  [data.companyLogo]    - URL to company logo
 * @returns {{ subject: string, html: string, text: string }}
 */
export function render(data) {
  const {
    orderNumber = '',
    customerName = '',
    trackingUrl = '',
    companyName = 'ModelPricer',
    companyLogo = '',
  } = data || {};

  const subject = `Va\u0161e objedn\u00e1vka #${orderNumber} byla odesl\u00e1na`;

  const logoHtml = companyLogo
    ? `<img src="${esc(companyLogo)}" alt="${esc(companyName)}" style="max-height:40px;max-width:180px;" />`
    : `<span style="font-size:20px;font-weight:700;">${esc(companyName)}</span>`;

  const trackingHtml = trackingUrl
    ? `<div style="text-align:center;margin:20px 0;">
        <a href="${esc(trackingUrl)}" style="display:inline-block;padding:12px 28px;background:#1a1a2e;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
          Sledovat z\u00e1silku
        </a>
      </div>`
    : '';

  const trackingText = trackingUrl
    ? `\nSledov\u00e1n\u00ed z\u00e1silky: ${trackingUrl}\n`
    : '';

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
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Objedn\u00e1vka odesl\u00e1na</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 12px;">
      Dobr\u00fd den, ${esc(customerName)},
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      va\u0161e objedn\u00e1vka <strong>#${esc(orderNumber)}</strong> byla odesl\u00e1na!
      Z\u00e1silka je na cest\u011b k v\u00e1m.
    </p>

    <!-- Shipping indicator -->
    <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;padding:14px 16px;margin:16px 0;">
      <div style="display:flex;align-items:center;">
        <span style="font-size:24px;margin-right:12px;">&#x1F4E6;</span>
        <div>
          <strong style="color:#1d4ed8;font-size:14px;">Z\u00e1silka na cest\u011b</strong>
          <p style="margin:4px 0 0;font-size:13px;color:#2563eb;">
            Doru\u010den\u00ed o\u010dek\u00e1vejte v n\u00e1sleduj\u00edc\u00edch pracovn\u00edch dnech.
          </p>
        </div>
      </div>
    </div>

    ${trackingHtml}

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

va\u0161e objedn\u00e1vka #${orderNumber} byla odesl\u00e1na!
Z\u00e1silka je na cest\u011b k v\u00e1m.

Doru\u010den\u00ed o\u010dek\u00e1vejte v n\u00e1sleduj\u00edc\u00edch pracovn\u00edch dnech.
${trackingText}
D\u011bkujeme za va\u0161i objedn\u00e1vku!

${companyName}`;

  return { subject, html, text };
}
