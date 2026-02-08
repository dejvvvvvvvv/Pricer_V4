// Email Provider Adapter
// Supports: none (demo), smtp, resend, sendgrid
// Actual API calls are stubbed for now (no real dependencies needed)

export function createProvider(config) {
  const type = String(config?.provider || 'none');

  switch (type) {
    case 'smtp':
      return {
        type: 'smtp',
        async send({ to, subject, html, from }) {
          // In production: use nodemailer
          // For now: simulate success
          console.log(`[SMTP] Would send to ${to}: ${subject}`);
          return { success: true, messageId: `smtp_${Date.now()}` };
        },
      };

    case 'resend':
      return {
        type: 'resend',
        async send({ to, subject, html, from }) {
          // In production: use @resend/node or fetch
          console.log(`[Resend] Would send to ${to}: ${subject}`);
          return { success: true, messageId: `resend_${Date.now()}` };
        },
      };

    case 'sendgrid':
      return {
        type: 'sendgrid',
        async send({ to, subject, html, from }) {
          // In production: use @sendgrid/mail or fetch
          console.log(`[SendGrid] Would send to ${to}: ${subject}`);
          return { success: true, messageId: `sg_${Date.now()}` };
        },
      };

    default:
      return {
        type: 'none',
        async send({ to, subject }) {
          console.log(`[Demo] Email to ${to}: ${subject} (no provider)`);
          return { success: true, messageId: `demo_${Date.now()}`, mode: 'demo' };
        },
      };
  }
}
