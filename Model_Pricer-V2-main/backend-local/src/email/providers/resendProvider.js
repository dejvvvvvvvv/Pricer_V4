/**
 * Resend Email Provider
 *
 * Production-ready email sending via the Resend API.
 * Falls back to mock/demo mode when RESEND_API_KEY is not configured.
 *
 * Features:
 * - Graceful fallback when API key missing (logs warning, returns mock response)
 * - Retry logic for 429 (rate limit) and 5xx errors (max 3 attempts, exponential backoff)
 * - GDPR-compliant logging (logs to/subject/status, never content)
 * - Batch sending support (up to 100 emails per batch via Resend API)
 *
 * Required npm package: resend
 *
 * @module email/providers/resendProvider
 */

import { logInfo, logWarn, logError } from '../../util/logger.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s exponential backoff
const DEFAULT_FROM = 'noreply@modelpricer.app';

/** @type {import('resend').Resend | null} */
let resendClient = null;

/** Whether we already warned about missing API key (avoid log spam). */
let warnedMissingKey = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Lazily initialize the Resend client via dynamic import.
 * Returns null if RESEND_API_KEY is not set or the `resend` package is not installed.
 *
 * @returns {Promise<import('resend').Resend | null>}
 */
async function getClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!warnedMissingKey) {
      logWarn('[resendProvider] RESEND_API_KEY is not set — emails will be logged but NOT sent.');
      warnedMissingKey = true;
    }
    return null;
  }

  // Dynamic import so the `resend` package is only loaded when actually needed.
  // Install: npm install resend
  try {
    const { Resend } = await import('resend');
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch (importErr) {
    logError('[resendProvider] Failed to import "resend" package. Install it: npm install resend');
    return null;
  }
}

/**
 * Validate basic email parameters.
 *
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.subject
 * @throws {Error} If required fields are missing
 */
function validateEmailParams({ to, subject }) {
  if (!to || typeof to !== 'string') {
    throw new Error('Email "to" address is required and must be a string.');
  }
  if (!subject || typeof subject !== 'string') {
    throw new Error('Email "subject" is required and must be a string.');
  }
}

/**
 * Sleep for the given number of milliseconds.
 *
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine whether an error is retryable (429 or 5xx).
 *
 * @param {Error & { statusCode?: number }} err
 * @returns {boolean}
 */
function isRetryableError(err) {
  const code = err?.statusCode || err?.status || 0;
  return code === 429 || (code >= 500 && code < 600);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a single email via Resend.
 *
 * Falls back to a mock/demo response when RESEND_API_KEY is not configured.
 * Implements retry logic for transient errors (429, 5xx).
 *
 * @param {object} params
 * @param {string}  params.to       - Recipient email address
 * @param {string}  [params.from]   - Sender address (defaults to EMAIL_FROM env or noreply@modelpricer.app)
 * @param {string}  params.subject  - Email subject
 * @param {string}  [params.html]   - HTML body
 * @param {string}  [params.text]   - Plain text body
 * @param {string}  [params.replyTo] - Reply-To address
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, mode?: string }>}
 */
export async function sendEmail({ to, from, subject, html, text, replyTo }) {
  validateEmailParams({ to, subject });

  const fromAddress = from || process.env.EMAIL_FROM || DEFAULT_FROM;

  // GDPR-safe log — never log html/text content
  logInfo(`[resendProvider] Sending email to=${to} subject="${subject}"`);

  // --- Graceful fallback when API key is missing ---
  let client;
  try {
    client = await getClient();
  } catch {
    client = null;
  }

  if (!client) {
    logWarn(`[resendProvider] No Resend client — mock response for to=${to} subject="${subject}"`);
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      mode: 'mock',
    };
  }

  // --- Send with retry ---
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const payload = {
        from: fromAddress,
        to,
        subject,
        ...(html ? { html } : {}),
        ...(text ? { text } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      };

      const { data, error } = await client.emails.send(payload);

      if (error) {
        const errObj = new Error(error.message || 'Resend API error');
        errObj.statusCode = error.statusCode || 500;
        throw errObj;
      }

      logInfo(`[resendProvider] Sent OK to=${to} messageId=${data?.id}`);
      return {
        success: true,
        messageId: data?.id || `resend_${Date.now()}`,
      };
    } catch (err) {
      lastError = err;
      logWarn(`[resendProvider] Attempt ${attempt}/${MAX_RETRIES} failed for to=${to}: ${err.message}`);

      if (attempt < MAX_RETRIES && isRetryableError(err)) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logInfo(`[resendProvider] Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // Non-retryable or last attempt — break out
      break;
    }
  }

  // --- All retries exhausted ---
  const errorMessage = lastError?.message || 'Unknown error sending email';
  logError(`[resendProvider] Failed to send email to=${to} subject="${subject}" error="${errorMessage}"`);
  return {
    success: false,
    error: errorMessage,
  };
}

/**
 * Send a batch of emails via Resend.
 *
 * Resend supports up to 100 emails per batch API call.
 * For larger batches, this function automatically splits into chunks.
 *
 * @param {Array<{ to: string, from?: string, subject: string, html?: string, text?: string, replyTo?: string }>} emails
 * @returns {Promise<{ success: boolean, results: Array<{ to: string, success: boolean, messageId?: string, error?: string }>, totalSent: number, totalFailed: number }>}
 */
export async function sendBatchEmails(emails) {
  if (!Array.isArray(emails) || emails.length === 0) {
    return { success: true, results: [], totalSent: 0, totalFailed: 0 };
  }

  logInfo(`[resendProvider] Batch send: ${emails.length} email(s)`);

  let client;
  try {
    client = await getClient();
  } catch {
    client = null;
  }

  // --- Fallback: send individually if no client or batch API unavailable ---
  const results = [];
  let totalSent = 0;
  let totalFailed = 0;

  if (!client) {
    // Mock mode — return mock results for all
    for (const email of emails) {
      const result = await sendEmail(email);
      results.push({ to: email.to, ...result });
      if (result.success) totalSent++;
      else totalFailed++;
    }
    return { success: totalFailed === 0, results, totalSent, totalFailed };
  }

  // --- Resend batch API: chunks of 100 ---
  const BATCH_SIZE = 100;
  const fromAddress = process.env.EMAIL_FROM || DEFAULT_FROM;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);

    const batchPayload = chunk.map((email) => ({
      from: email.from || fromAddress,
      to: email.to,
      subject: email.subject,
      ...(email.html ? { html: email.html } : {}),
      ...(email.text ? { text: email.text } : {}),
      ...(email.replyTo ? { reply_to: email.replyTo } : {}),
    }));

    try {
      const { data, error } = await client.batch.send(batchPayload);

      if (error) {
        // Batch failed — fall back to individual sends for this chunk
        logWarn(`[resendProvider] Batch API failed, falling back to individual sends: ${error.message}`);
        for (const email of chunk) {
          const result = await sendEmail(email);
          results.push({ to: email.to, ...result });
          if (result.success) totalSent++;
          else totalFailed++;
        }
        continue;
      }

      // Process batch results
      const batchResults = data?.data || [];
      for (let j = 0; j < chunk.length; j++) {
        const batchItem = batchResults[j];
        if (batchItem?.id) {
          results.push({ to: chunk[j].to, success: true, messageId: batchItem.id });
          totalSent++;
          logInfo(`[resendProvider] Batch item OK to=${chunk[j].to} messageId=${batchItem.id}`);
        } else {
          results.push({ to: chunk[j].to, success: false, error: 'No ID returned from batch' });
          totalFailed++;
        }
      }
    } catch (err) {
      logError(`[resendProvider] Batch chunk failed: ${err.message}`);
      // Fall back to individual sends for this chunk
      for (const email of chunk) {
        const result = await sendEmail(email);
        results.push({ to: email.to, ...result });
        if (result.success) totalSent++;
        else totalFailed++;
      }
    }
  }

  return { success: totalFailed === 0, results, totalSent, totalFailed };
}
