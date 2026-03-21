/**
 * stripeRoutes.js — Stripe payment API routes
 *
 * Provides three endpoints:
 *   POST /api/payments/create-checkout — Create a Stripe Checkout Session
 *   POST /api/payments/webhook        — Handle Stripe webhook events
 *   GET  /api/payments/session/:id     — Verify payment status
 *   GET  /api/payments/status          — Check if Stripe is configured
 *
 * =====================================================================
 * MOUNTING INSTRUCTIONS (for backend-local/src/index.js)
 * =====================================================================
 *
 * 1. Import the router factory:
 *
 *    import { createStripeRouter } from './routes/stripeRoutes.js';
 *
 * 2. BEFORE the global express.json() middleware, register the webhook
 *    route with raw body parsing. This is CRITICAL — Stripe webhook
 *    signature verification requires the raw (unparsed) request body.
 *    If express.json() parses it first, signature verification WILL fail.
 *
 *    // MUST be BEFORE app.use(express.json(...))
 *    app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
 *
 * 3. AFTER the middleware setup, mount the router with auth + tenant:
 *
 *    // Auth + Tenant required for create-checkout and session retrieval
 *    // The webhook endpoint skips auth (Stripe sends it directly)
 *    const stripeRouter = createStripeRouter();
 *    app.use('/api/payments', stripeRouter);
 *
 * 4. Rate limiting (recommended):
 *
 *    app.use('/api/payments', rateLimit({
 *      windowMs: 60_000,
 *      max: 20,
 *      message: 'Too many payment requests, please try again later',
 *    }));
 *
 * Full example diff for index.js:
 *
 *   // --- Add import at top ---
 *   import { createStripeRouter } from './routes/stripeRoutes.js';
 *
 *   // --- Add BEFORE app.use(express.json({ limit: "2mb" })); ---
 *   // Stripe webhook needs raw body for signature verification
 *   app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
 *
 *   // --- Add in the auth/tenant middleware section (around line 210-220) ---
 *   app.use('/api/payments/create-checkout', requireAuth, requireTenant);
 *   app.use('/api/payments/session', requireAuth, requireTenant);
 *   // NOTE: /api/payments/webhook does NOT get auth (Stripe calls it directly)
 *   // NOTE: /api/payments/status is public (frontend checks if Stripe is available)
 *
 *   // --- Add in the router mounting section (around line 400-450) ---
 *   const stripeRouter = createStripeRouter();
 *   app.use('/api/payments', stripeRouter);
 *
 * =====================================================================
 */

import { Router } from 'express';
import {
  createCheckoutSession,
  constructWebhookEvent,
  getCheckoutSession,
  isStripeConfigured,
  processWebhookEvent,
} from '../services/stripeService.js';

/**
 * Create the Stripe payments router.
 *
 * @returns {import('express').Router}
 */
export function createStripeRouter() {
  const router = Router();

  // -----------------------------------------------------------------
  // GET /api/payments/status — Check if Stripe is configured
  // Public endpoint (no auth required) — returns only boolean flag
  // -----------------------------------------------------------------
  router.get('/status', async (_req, res) => {
    try {
      const result = await isStripeConfigured();
      res.json({
        ok: true,
        data: {
          configured: result.configured,
          // Do not expose internal error details to unauthenticated users
        },
      });
    } catch (err) {
      console.error('[stripeRoutes] /status error:', err.message);
      res.status(500).json({
        ok: false,
        error: { message: 'Failed to check Stripe status' },
      });
    }
  });

  // -----------------------------------------------------------------
  // POST /api/payments/create-checkout — Create Stripe Checkout Session
  // Requires: requireAuth + requireTenant (set in index.js middleware)
  // -----------------------------------------------------------------
  router.post('/create-checkout', async (req, res) => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          ok: false,
          error: { code: 'MP_TENANT_REQUIRED', message: 'Tenant ID is required' },
        });
      }

      const { orderId, items, currency, customerEmail, successUrl, cancelUrl } = req.body || {};

      const result = await createCheckoutSession({
        tenantId,
        orderId,
        items,
        currency,
        customerEmail,
        successUrl,
        cancelUrl,
      });

      return res.json({
        ok: true,
        data: {
          sessionId: result.sessionId,
          url: result.url,
        },
      });
    } catch (err) {
      const statusCode = err.statusHint || 500;
      const errorCode = err.code || 'MP_INTERNAL_ERROR';

      // Do not log customer email or payment details
      console.error(
        '[stripeRoutes] /create-checkout error:',
        JSON.stringify({
          code: errorCode,
          message: err.message,
          tenantId: req.tenantId,
        })
      );

      return res.status(statusCode).json({
        ok: false,
        error: {
          code: errorCode,
          message: err.message,
        },
      });
    }
  });

  // -----------------------------------------------------------------
  // POST /api/payments/webhook — Stripe webhook handler
  //
  // CRITICAL: This endpoint MUST receive the raw (unparsed) body.
  //           The express.raw() middleware must be applied to this path
  //           BEFORE the global express.json() middleware in index.js.
  //           See mounting instructions at the top of this file.
  //
  // No auth middleware — Stripe sends webhooks directly.
  // Security is handled by signature verification (STRIPE_WEBHOOK_SECRET).
  // -----------------------------------------------------------------
  router.post('/webhook', async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      console.warn('[stripeRoutes] Webhook received without stripe-signature header');
      return res.status(400).json({
        ok: false,
        error: { message: 'Missing stripe-signature header' },
      });
    }

    let event;
    try {
      event = constructWebhookEvent(req.body, signature);
    } catch (err) {
      // Log the failure but don't expose details to potential attackers
      console.warn(
        '[stripeRoutes] Webhook signature verification failed:',
        err.code || err.message
      );
      return res.status(400).json({
        ok: false,
        error: { message: 'Webhook signature verification failed' },
      });
    }

    // Process the verified event
    try {
      const result = processWebhookEvent(event);

      if (result.handled && result.data) {
        // TODO: Update order status in database/storage based on event type.
        // This is where you would call orderService.updatePaymentStatus()
        // or similar function to persist the payment state change.
        //
        // Example:
        //   if (result.eventType === 'checkout.session.completed') {
        //     await orderService.markAsPaid(result.data.tenantId, result.data.orderId, {
        //       stripeSessionId: result.data.sessionId,
        //       paymentIntentId: result.data.paymentIntentId,
        //       amountTotal: result.data.amountTotal,
        //       currency: result.data.currency,
        //     });
        //   }
        //
        //   if (result.eventType === 'payment_intent.payment_failed') {
        //     await orderService.markPaymentFailed(result.data.tenantId, result.data.orderId, {
        //       errorCode: result.data.errorCode,
        //       errorMessage: result.data.errorMessage,
        //     });
        //   }

        console.log(
          '[stripeRoutes] Webhook processed:',
          JSON.stringify({
            eventType: result.eventType,
            tenantId: result.data.tenantId,
            orderId: result.data.orderId,
          })
        );
      }

      // Always return 200 to Stripe — even for unhandled events.
      // Returning non-2xx causes Stripe to retry (up to 3 days).
      return res.json({ received: true });
    } catch (err) {
      console.error('[stripeRoutes] Webhook processing error:', err.message);
      // Still return 200 to prevent Stripe retries for processing errors.
      // The event was verified — the issue is on our side.
      return res.json({ received: true, processingError: true });
    }
  });

  // -----------------------------------------------------------------
  // GET /api/payments/session/:sessionId — Verify payment status
  // Requires: requireAuth + requireTenant (set in index.js middleware)
  // -----------------------------------------------------------------
  router.get('/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          ok: false,
          error: { code: 'MP_TENANT_REQUIRED', message: 'Tenant ID is required' },
        });
      }

      const session = await getCheckoutSession(sessionId);

      // Verify that the session belongs to the requesting tenant
      if (session.metadata?.tenantId && session.metadata.tenantId !== tenantId) {
        console.warn(
          '[stripeRoutes] Tenant mismatch on session retrieval:',
          JSON.stringify({
            requestTenant: tenantId,
            sessionTenant: session.metadata.tenantId,
            sessionId,
          })
        );
        return res.status(403).json({
          ok: false,
          error: {
            code: 'MP_TENANT_MISMATCH',
            message: 'Session does not belong to this tenant',
          },
        });
      }

      return res.json({
        ok: true,
        data: {
          sessionId: session.id,
          paymentStatus: session.paymentStatus,
          amountTotal: session.amountTotal,
          currency: session.currency,
          orderId: session.metadata?.orderId || null,
          status: session.status,
        },
      });
    } catch (err) {
      const statusCode = err.statusHint || 500;
      const errorCode = err.code || 'MP_INTERNAL_ERROR';

      console.error(
        '[stripeRoutes] /session/:id error:',
        JSON.stringify({
          code: errorCode,
          message: err.message,
          sessionId: req.params.sessionId,
        })
      );

      return res.status(statusCode).json({
        ok: false,
        error: {
          code: errorCode,
          message: err.message,
        },
      });
    }
  });

  return router;
}

export default createStripeRouter;
