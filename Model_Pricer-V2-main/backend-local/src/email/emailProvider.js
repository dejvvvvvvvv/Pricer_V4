/**
 * Email Provider Adapter
 *
 * Factory that creates a provider object based on configuration.
 * Supports: none (demo), smtp (stub), resend (PRODUCTION), sendgrid (stub).
 *
 * The provider selection is driven by:
 *   - config.provider parameter passed to createProvider()
 *   - process.env.EMAIL_PROVIDER as fallback
 *
 * @module email/emailProvider
 */

import { logInfo, logWarn } from '../util/logger.js';

/**
 * Create an email provider instance.
 *
 * @param {{ provider?: string }} [config]
 * @returns {{ type: string, send: (params: { to: string, from?: string, subject: string, html?: string, text?: string, replyTo?: string }) => Promise<{ success: boolean, messageId?: string, error?: string, mode?: string }>, sendBatch?: (emails: Array) => Promise<object> }}
 */
export function createProvider(config) {
  const type = String(config?.provider || process.env.EMAIL_PROVIDER || 'none');

  switch (type) {
    case 'smtp':
      return {
        type: 'smtp',
        async send({ to, subject, html, from }) {
          // In production: use nodemailer
          // For now: simulate success
          logInfo(`[SMTP] Would send to ${to}: ${subject}`);
          return { success: true, messageId: `smtp_${Date.now()}` };
        },
      };

    case 'resend':
      return {
        type: 'resend',
        async send({ to, from, subject, html, text, replyTo }) {
          // Dynamic import to avoid hard dependency when not using Resend
          const { sendEmail } = await import('./providers/resendProvider.js');
          return sendEmail({ to, from, subject, html, text, replyTo });
        },
        async sendBatch(emails) {
          const { sendBatchEmails } = await import('./providers/resendProvider.js');
          return sendBatchEmails(emails);
        },
      };

    case 'sendgrid':
      return {
        type: 'sendgrid',
        async send({ to, subject, html, from }) {
          // In production: use @sendgrid/mail or fetch
          logInfo(`[SendGrid] Would send to ${to}: ${subject}`);
          return { success: true, messageId: `sg_${Date.now()}` };
        },
      };

    default:
      return {
        type: 'none',
        async send({ to, subject }) {
          logInfo(`[Demo] Email to ${to}: ${subject} (no provider)`);
          return { success: true, messageId: `demo_${Date.now()}`, mode: 'demo' };
        },
      };
  }
}
