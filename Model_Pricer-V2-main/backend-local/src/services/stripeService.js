/**
 * stripeService.js — Stripe payment integration (business logic layer)
 *
 * Pure service functions for Stripe Checkout Sessions.
 * No Express dependency (no req/res/next).
 *
 * Stripe package is dynamically imported — graceful skip when not installed.
 * Install: npm install stripe
 *
 * Environment variables:
 *   STRIPE_SECRET_KEY     — Stripe secret API key (sk_test_... or sk_live_...)
 *   STRIPE_WEBHOOK_SECRET — Webhook endpoint signing secret (whsec_...)
 *
 * Currency note:
 *   Stripe uses smallest currency unit (cents/halere).
 *   CZK: 1 CZK = 100 haleru, so unit_amount = price * 100
 *   EUR: 1 EUR = 100 cents
 *   USD: 1 USD = 100 cents
 */

// ---------------------------------------------------------------------------
// Stripe client — lazy singleton with dynamic import
// ---------------------------------------------------------------------------

/** @type {import('stripe').default | null} */
let _stripeInstance = null;

/** @type {boolean} */
let _stripeLoadAttempted = false;

/** @type {string | null} */
let _stripeLoadError = null;

/**
 * Get or create the Stripe client instance (async, dynamic import).
 * Returns null if stripe package is not installed or STRIPE_SECRET_KEY is missing.
 *
 * @returns {Promise<import('stripe').default | null>}
 */
async function getStripeClient() {
  if (_stripeInstance) return _stripeInstance;
  if (_stripeLoadAttempted) return null;

  _stripeLoadAttempted = true;

  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!secretKey) {
    _stripeLoadError = 'STRIPE_SECRET_KEY environment variable is not set';
    console.warn('[stripeService]', _stripeLoadError);
    return null;
  }

  try {
    const { default: Stripe } = await import('stripe');
    _stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-06-20',
      appInfo: {
        name: 'ModelPricer',
        version: '0.1.0',
      },
    });
    console.log('[stripeService] Stripe client initialized successfully');
    return _stripeInstance;
  } catch (err) {
    _stripeLoadError = `Failed to load stripe package: ${err.message}`;
    console.warn('[stripeService]', _stripeLoadError);
    console.warn('[stripeService] Install with: npm install stripe');
    return null;
  }
}

/**
 * Get the Stripe client synchronously (must have been initialized via getStripeClient first).
 * Throws if not initialized.
 *
 * @returns {import('stripe').default}
 * @throws {Error} If Stripe client is not initialized
 */
function getStripeClientSync() {
  if (!_stripeInstance) {
    throw Object.assign(
      new Error('Stripe client is not initialized. Call getStripeClient() first.'),
      { code: 'MP_STRIPE_NOT_INITIALIZED' }
    );
  }
  return _stripeInstance;
}

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} StripeServiceError
 * @property {string} code - MP_ prefixed error code
 * @property {string} message - Human-readable error message
 * @property {number} [statusHint] - Suggested HTTP status (not set directly — for route layer)
 */

/**
 * Create a typed service error.
 *
 * @param {string} code
 * @param {string} message
 * @param {number} [statusHint]
 * @returns {Error & { code: string, statusHint?: number }}
 */
function serviceError(code, message, statusHint) {
  const err = new Error(message);
  err.code = code;
  if (statusHint) err.statusHint = statusHint;
  return err;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const SUPPORTED_CURRENCIES = ['czk', 'eur', 'usd', 'gbp', 'pln'];

/**
 * Validate createCheckoutSession parameters.
 *
 * @param {Object} params
 * @returns {string[]} Array of validation error messages (empty = valid)
 */
function validateCheckoutParams(params) {
  const errors = [];

  if (!params) {
    return ['params is required'];
  }

  if (!params.tenantId || typeof params.tenantId !== 'string') {
    errors.push('tenantId is required');
  }

  if (!params.orderId || typeof params.orderId !== 'string') {
    errors.push('orderId is required');
  }

  if (!Array.isArray(params.items) || params.items.length === 0) {
    errors.push('items must be a non-empty array');
  } else {
    for (let i = 0; i < params.items.length; i++) {
      const item = params.items[i];
      if (!item.name || typeof item.name !== 'string') {
        errors.push(`items[${i}].name is required`);
      }
      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`items[${i}].quantity must be a positive integer`);
      }
      if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
        errors.push(`items[${i}].unitPrice must be a non-negative number`);
      }
    }
  }

  const currency = (params.currency || '').toLowerCase();
  if (currency && !SUPPORTED_CURRENCIES.includes(currency)) {
    errors.push(`currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }

  if (params.customerEmail && typeof params.customerEmail === 'string') {
    // Basic email format check (full validation is Stripe's responsibility)
    if (!params.customerEmail.includes('@')) {
      errors.push('customerEmail must be a valid email address');
    }
  }

  if (!params.successUrl || typeof params.successUrl !== 'string') {
    errors.push('successUrl is required');
  }

  if (!params.cancelUrl || typeof params.cancelUrl !== 'string') {
    errors.push('cancelUrl is required');
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if Stripe is configured and available.
 *
 * @returns {Promise<{ configured: boolean, error?: string }>}
 */
export async function isStripeConfigured() {
  const client = await getStripeClient();
  if (client) {
    return { configured: true };
  }
  return {
    configured: false,
    error: _stripeLoadError || 'Stripe is not available',
  };
}

/**
 * Create a Stripe Checkout Session for an order.
 *
 * @param {Object} params
 * @param {string} params.tenantId - Tenant identifier
 * @param {string} params.orderId - Order identifier for tracking
 * @param {Array<{ name: string, description?: string, quantity: number, unitPrice: number }>} params.items
 *   Line items. unitPrice is in the main currency unit (e.g. CZK, not halere).
 * @param {string} [params.currency='czk'] - ISO 4217 currency code (lowercase)
 * @param {string} [params.customerEmail] - Pre-fill customer email on Checkout page
 * @param {string} params.successUrl - Redirect URL after successful payment (must include {CHECKOUT_SESSION_ID} placeholder)
 * @param {string} params.cancelUrl - Redirect URL when customer cancels
 * @returns {Promise<{ sessionId: string, url: string }>} Stripe Checkout Session ID and redirect URL
 * @throws {Error} With code MP_STRIPE_NOT_CONFIGURED, MP_VALIDATION_ERROR, or MP_STRIPE_API_ERROR
 */
export async function createCheckoutSession(params) {
  // Validate input
  const validationErrors = validateCheckoutParams(params);
  if (validationErrors.length > 0) {
    throw serviceError(
      'MP_VALIDATION_ERROR',
      `Invalid checkout parameters: ${validationErrors.join('; ')}`,
      400
    );
  }

  // Get Stripe client
  const stripe = await getStripeClient();
  if (!stripe) {
    throw serviceError(
      'MP_STRIPE_NOT_CONFIGURED',
      'Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.',
      503
    );
  }

  const currency = (params.currency || 'czk').toLowerCase();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: params.items.map((item) => ({
        price_data: {
          currency,
          product_data: {
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
          },
          // Stripe uses smallest currency unit (cents/halere)
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),
      ...(params.customerEmail ? { customer_email: params.customerEmail } : {}),
      metadata: {
        tenantId: params.tenantId,
        orderId: params.orderId,
        source: 'modelpricer',
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    // Log session creation without PII
    console.log(
      '[stripeService] Checkout session created:',
      JSON.stringify({
        sessionId: session.id,
        tenantId: params.tenantId,
        orderId: params.orderId,
        currency,
        itemCount: params.items.length,
      })
    );

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (err) {
    // Log Stripe API error without sensitive data
    console.error(
      '[stripeService] Checkout session creation failed:',
      JSON.stringify({
        tenantId: params.tenantId,
        orderId: params.orderId,
        stripeErrorType: err.type,
        stripeErrorCode: err.code,
        message: err.message,
      })
    );

    throw serviceError(
      'MP_STRIPE_API_ERROR',
      `Stripe API error: ${err.message}`,
      502
    );
  }
}

/**
 * Verify and construct a Stripe webhook event from raw payload.
 *
 * @param {Buffer|string} payload - Raw request body (NOT parsed JSON)
 * @param {string} signature - Value of the `stripe-signature` header
 * @returns {import('stripe').Stripe.Event} Verified Stripe event
 * @throws {Error} With code MP_STRIPE_NOT_INITIALIZED or MP_WEBHOOK_SIGNATURE_INVALID
 */
export function constructWebhookEvent(payload, signature) {
  const stripe = getStripeClientSync();
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

  if (!webhookSecret) {
    throw serviceError(
      'MP_STRIPE_NOT_CONFIGURED',
      'STRIPE_WEBHOOK_SECRET environment variable is not set',
      500
    );
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.warn(
      '[stripeService] Webhook signature verification failed:',
      err.message
    );
    throw serviceError(
      'MP_WEBHOOK_SIGNATURE_INVALID',
      `Webhook signature verification failed: ${err.message}`,
      400
    );
  }
}

/**
 * Retrieve a Checkout Session with expanded line items and payment intent.
 * Useful for verifying payment status after redirect from Stripe.
 *
 * @param {string} sessionId - Stripe Checkout Session ID (cs_...)
 * @returns {Promise<{
 *   id: string,
 *   paymentStatus: string,
 *   paymentIntentId: string | null,
 *   amountTotal: number | null,
 *   currency: string | null,
 *   customerEmail: string | null,
 *   metadata: Record<string, string>,
 *   status: string
 * }>} Normalized session details
 * @throws {Error} With code MP_STRIPE_NOT_CONFIGURED, MP_VALIDATION_ERROR, or MP_STRIPE_API_ERROR
 */
export async function getCheckoutSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw serviceError('MP_VALIDATION_ERROR', 'sessionId is required', 400);
  }

  const stripe = await getStripeClient();
  if (!stripe) {
    throw serviceError(
      'MP_STRIPE_NOT_CONFIGURED',
      'Stripe is not configured',
      503
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent'],
    });

    // Return normalized data — no raw Stripe objects leak outside this layer
    return {
      id: session.id,
      paymentStatus: session.payment_status,
      paymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || session.customer_email || null,
      metadata: session.metadata || {},
      status: session.status,
    };
  } catch (err) {
    console.error(
      '[stripeService] Failed to retrieve session:',
      JSON.stringify({
        sessionId,
        stripeErrorType: err.type,
        message: err.message,
      })
    );

    throw serviceError(
      'MP_STRIPE_API_ERROR',
      `Failed to retrieve checkout session: ${err.message}`,
      502
    );
  }
}

/**
 * Handle a verified Stripe webhook event.
 * Extracts relevant data from the event and returns a structured result
 * that the route layer can use to update order status.
 *
 * @param {import('stripe').Stripe.Event} event - Verified Stripe event
 * @returns {{ handled: boolean, eventType: string, data?: Object }}
 */
export function processWebhookEvent(event) {
  const eventType = event.type;

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const tenantId = session.metadata?.tenantId || null;
      const orderId = session.metadata?.orderId || null;

      // Log without PII
      console.log(
        '[stripeService] checkout.session.completed:',
        JSON.stringify({ tenantId, orderId, paymentStatus: session.payment_status })
      );

      return {
        handled: true,
        eventType,
        data: {
          tenantId,
          orderId,
          sessionId: session.id,
          paymentStatus: session.payment_status,
          paymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : null,
          amountTotal: session.amount_total,
          currency: session.currency,
          customerEmail: session.customer_details?.email || null,
        },
      };
    }

    case 'payment_intent.succeeded': {
      const intent = event.data.object;
      const tenantId = intent.metadata?.tenantId || null;
      const orderId = intent.metadata?.orderId || null;

      console.log(
        '[stripeService] payment_intent.succeeded:',
        JSON.stringify({ tenantId, orderId, intentId: intent.id })
      );

      return {
        handled: true,
        eventType,
        data: {
          tenantId,
          orderId,
          paymentIntentId: intent.id,
          amountReceived: intent.amount_received,
          currency: intent.currency,
        },
      };
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      const tenantId = intent.metadata?.tenantId || null;
      const orderId = intent.metadata?.orderId || null;
      const lastError = intent.last_payment_error;

      console.warn(
        '[stripeService] payment_intent.payment_failed:',
        JSON.stringify({
          tenantId,
          orderId,
          intentId: intent.id,
          errorCode: lastError?.code,
          errorType: lastError?.type,
        })
      );

      return {
        handled: true,
        eventType,
        data: {
          tenantId,
          orderId,
          paymentIntentId: intent.id,
          errorCode: lastError?.code || null,
          errorType: lastError?.type || null,
          errorMessage: lastError?.message || null,
        },
      };
    }

    default:
      // Unhandled event type — acknowledge but don't process
      console.log(`[stripeService] Unhandled event type: ${eventType}`);
      return { handled: false, eventType };
  }
}
