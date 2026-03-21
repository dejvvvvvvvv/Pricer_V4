/**
 * Email template: Order Printing
 *
 * Sent when an order enters the printing phase.
 * Czech language with full diacritics.
 *
 * @module email/templates/order-printing
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
 * Render the order-printing email.
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
    items = [],
    companyName = 'ModelPricer',
    companyLogo = '',
  } = data || {};

  const subject = `Va\u0161e objedn\u00e1vka #${orderNumber} se tiskne`;

  const logoHtml = companyLogo
    ? `<img src="${esc(companyLogo)}" alt="${esc(companyName)}" style="max-height:40px;max-width:180px;" />`
    : `<span style="font-size:20px;font-weight:700;">${esc(companyName)}</span>`;

  const itemCount = Array.isArray(items) ? items.length : 0;
  const itemsSummary = itemCount > 0
    ? `Va\u0161e objedn\u00e1vka obsahuje ${itemCount} polo\u017e${itemCount === 1 ? 'ku' : itemCount < 5 ? 'ky' : 'ek'}.`
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
    <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Objedn\u00e1vka se tiskne</h2>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 12px;">
      Dobr\u00fd den, ${esc(customerName)},
    </p>
    <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
      va\u0161e objedn\u00e1vka <strong>#${esc(orderNumber)}</strong> pr\u00e1v\u011b vstoupila do f\u00e1ze tisku.
      ${itemsSummary}
    </p>

    <!-- Status indicator -->
    <div style="background:#e0f2fe;border:1px solid #7dd3fc;border-radius:6px;padding:14px 16px;margin:16px 0;">
      <div style="display:flex;align-items:center;">
        <span style="font-size:24px;margin-right:12px;">&#x1F5A8;</span>
        <div>
          <strong style="color:#0369a1;font-size:14px;">Tisk prob\u00edh\u00e1</strong>
          <p style="margin:4px 0 0;font-size:13px;color:#0284c7;">
            Budeme v\u00e1s informovat, a\u017e bude objedn\u00e1vka p\u0159ipravena k odesl\u00e1n\u00ed.
          </p>
        </div>
      </div>
    </div>

    <p style="color:#4b5563;line-height:1.6;margin:16px 0 0;">
      D\u011bkujeme za va\u0161i trp\u011blivost!
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

va\u0161e objedn\u00e1vka #${orderNumber} pr\u00e1v\u011b vstoupila do f\u00e1ze tisku.
${itemsSummary}

Budeme v\u00e1s informovat, a\u017e bude objedn\u00e1vka p\u0159ipravena k odesl\u00e1n\u00ed.

D\u011bkujeme za va\u0161i trp\u011blivost!

${companyName}`;

  return { subject, html, text };
}
