// Default email templates
// Each template uses {{variable}} syntax for replacement

const baseLayout = (content) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
<div style="background:#1a1a1a;color:#fff;padding:20px 24px;">
<h1 style="margin:0;font-size:20px;">{{order.shop_name}}</h1>
</div>
<div style="padding:24px;">
${content}
</div>
<div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
This is an automated message. Do not reply to this email.
</div>
</div>
</body>
</html>`;

export const DEFAULT_TEMPLATES = {
  order_confirmed: baseLayout(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a1a;">Order Confirmed</h2>
    <p style="color:#4b5563;line-height:1.6;">Hi {{order.customer.name}},</p>
    <p style="color:#4b5563;line-height:1.6;">Your order <strong>#{{order.id}}</strong> has been confirmed. We will begin processing it shortly.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin:16px 0;">
      <strong style="color:#15803d;">Order Total: {{order.total}} CZK</strong>
    </div>
    <p style="color:#4b5563;line-height:1.6;">Thank you for your order!</p>
  `),

  order_printing: baseLayout(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a1a;">Your Order is Being Printed</h2>
    <p style="color:#4b5563;line-height:1.6;">Hi {{order.customer.name}},</p>
    <p style="color:#4b5563;line-height:1.6;">Great news! Your order <strong>#{{order.id}}</strong> is now being printed.</p>
    <p style="color:#4b5563;line-height:1.6;">We will notify you once it is ready for shipping.</p>
  `),

  order_shipped: baseLayout(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a1a;">Order Shipped</h2>
    <p style="color:#4b5563;line-height:1.6;">Hi {{order.customer.name}},</p>
    <p style="color:#4b5563;line-height:1.6;">Your order <strong>#{{order.id}}</strong> has been shipped!</p>
    <p style="color:#4b5563;line-height:1.6;">You should receive it within the estimated delivery timeframe.</p>
  `),

  order_completed: baseLayout(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#1a1a1a;">Order Completed</h2>
    <p style="color:#4b5563;line-height:1.6;">Hi {{order.customer.name}},</p>
    <p style="color:#4b5563;line-height:1.6;">Your order <strong>#{{order.id}}</strong> has been completed.</p>
    <p style="color:#4b5563;line-height:1.6;">We hope you enjoy your 3D printed items. Thank you for choosing us!</p>
  `),

  order_cancelled: baseLayout(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#ef4444;">Order Cancelled</h2>
    <p style="color:#4b5563;line-height:1.6;">Hi {{order.customer.name}},</p>
    <p style="color:#4b5563;line-height:1.6;">Your order <strong>#{{order.id}}</strong> has been cancelled.</p>
    <p style="color:#4b5563;line-height:1.6;">If you have any questions, please contact us.</p>
  `),
};
