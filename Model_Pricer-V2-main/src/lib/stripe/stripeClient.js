/**
 * stripeClient.js — Frontend Stripe utilities
 *
 * Provides functions to:
 *   1. Check if Stripe payments are configured on the backend
 *   2. Create a payment session via backend API
 *   3. Redirect the customer to Stripe Checkout
 *   4. Verify payment status after redirect
 *
 * Uses native fetch() — no npm dependencies required.
 * Optionally supports @stripe/stripe-js for Stripe Elements (not required
 * for basic Checkout redirect flow).
 *
 * All API calls go through the Vite proxy (/api -> backend:3001).
 */

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * @typedef {'NETWORK_ERROR' | 'API_ERROR' | 'VALIDATION_ERROR' | 'NOT_CONFIGURED' | 'TENANT_ERROR'} StripeClientErrorType
 */

/** @type {Record<string, StripeClientErrorType>} */
export const StripeErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  TENANT_ERROR: 'TENANT_ERROR',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Get the API base URL. In dev mode, Vite proxies /api to the backend.
 * In production, VITE_API_BASE_URL can override this.
 *
 * @returns {string}
 */
function getApiBase() {
  return import.meta.env?.VITE_API_BASE_URL || '';
}

/**
 * Get tenant ID from storage. Dynamic import to avoid circular dependency.
 *
 * @returns {Promise<string>}
 */
async function getTenantIdAsync() {
  try {
    const { getTenantId } = await import('@/utils/adminTenantStorage');
    const id = getTenantId();
    if (!id) {
      throw Object.assign(new Error('No tenant ID available'), {
        type: StripeErrorType.TENANT_ERROR,
      });
    }
    return id;
  } catch (err) {
    if (err.type === StripeErrorType.TENANT_ERROR) throw err;
    throw Object.assign(new Error(`Failed to get tenant ID: ${err.message}`), {
      type: StripeErrorType.TENANT_ERROR,
      cause: err,
    });
  }
}

/**
 * Get auth token for API requests.
 * Uses the global window.__authGetToken set by AuthContext (same pattern as apiClient.js).
 *
 * @returns {Promise<string|null>}
 */
async function getAuthToken() {
  if (typeof window.__authGetToken === 'function') {
    try {
      return await window.__authGetToken();
    } catch {
      // Token fetch failed — continue without auth
      return null;
    }
  }
  return null;
}

/**
 * Make an authenticated API request.
 *
 * @param {string} path - API path (e.g., '/api/payments/status')
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
async function apiRequest(path, options = {}) {
  const base = getApiBase();
  const url = `${base}${path}`;

  const headers = {
    ...(options.headers || {}),
  };

  // Add tenant ID header
  try {
    const tenantId = await getTenantIdAsync();
    headers['x-tenant-id'] = tenantId;
  } catch {
    // For public endpoints (like /status), tenant ID is optional
  }

  // Add auth token if available
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    throw Object.assign(new Error(`Network error: ${err.message}`), {
      type: StripeErrorType.NETWORK_ERROR,
      cause: err,
    });
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw Object.assign(
      new Error(`Invalid response from server (HTTP ${response.status})`),
      { type: StripeErrorType.API_ERROR, status: response.status }
    );
  }

  if (!response.ok || json.ok === false) {
    const errorMsg =
      json.error?.message || json.message || `API error (HTTP ${response.status})`;
    throw Object.assign(new Error(errorMsg), {
      type: StripeErrorType.API_ERROR,
      status: response.status,
      code: json.error?.code,
      serverResponse: json,
    });
  }

  return json;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if Stripe is configured on the backend.
 * This is a public endpoint (no auth required).
 *
 * @returns {Promise<boolean>} True if Stripe is ready to accept payments
 */
export async function isStripeConfigured() {
  try {
    const json = await apiRequest('/api/payments/status', { method: 'GET' });
    return json.data?.configured === true;
  } catch {
    return false;
  }
}

/**
 * Create a Stripe Checkout Session via the backend API.
 *
 * @param {Object} params
 * @param {string} params.orderId - Order ID for tracking
 * @param {Array<{ name: string, description?: string, quantity: number, unitPrice: number }>} params.items
 *   Line items with prices in main currency unit (CZK, not halere)
 * @param {string} [params.currency='czk'] - ISO 4217 currency code
 * @param {string} [params.customerEmail] - Pre-fill email on Checkout page
 * @param {string} params.successUrl - Redirect after successful payment
 * @param {string} params.cancelUrl - Redirect on cancel
 * @returns {Promise<{ sessionId: string, url: string }>} Session ID and Checkout URL
 * @throws {Error} With type from StripeErrorType
 */
export async function createPaymentSession({
  orderId,
  items,
  currency = 'czk',
  customerEmail,
  successUrl,
  cancelUrl,
}) {
  // Basic client-side validation before making the API call
  if (!orderId) {
    throw Object.assign(new Error('orderId is required'), {
      type: StripeErrorType.VALIDATION_ERROR,
    });
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('items must be a non-empty array'), {
      type: StripeErrorType.VALIDATION_ERROR,
    });
  }
  if (!successUrl || !cancelUrl) {
    throw Object.assign(new Error('successUrl and cancelUrl are required'), {
      type: StripeErrorType.VALIDATION_ERROR,
    });
  }

  const json = await apiRequest('/api/payments/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      items,
      currency,
      customerEmail,
      successUrl,
      cancelUrl,
    }),
  });

  return {
    sessionId: json.data?.sessionId,
    url: json.data?.url,
  };
}

/**
 * Redirect the browser to Stripe Checkout.
 * This is a simple redirect — no Stripe.js dependency needed.
 *
 * @param {string} checkoutUrl - The Checkout URL from createPaymentSession
 * @returns {void}
 */
export function redirectToCheckout(checkoutUrl) {
  if (!checkoutUrl || typeof checkoutUrl !== 'string') {
    console.error('[stripeClient] Invalid checkout URL:', checkoutUrl);
    return;
  }

  // Validate that the URL is from Stripe (basic safety check)
  try {
    const parsed = new URL(checkoutUrl);
    if (
      parsed.protocol !== 'https:' ||
      !parsed.hostname.endsWith('.stripe.com')
    ) {
      console.warn(
        '[stripeClient] Checkout URL is not from stripe.com:',
        parsed.hostname
      );
      // Still redirect — the URL came from our own backend
    }
  } catch {
    console.error('[stripeClient] Malformed checkout URL:', checkoutUrl);
    return;
  }

  window.location.href = checkoutUrl;
}

/**
 * Verify a payment session status after redirect from Stripe.
 * Call this on the success/cancel page to confirm payment went through.
 *
 * @param {string} sessionId - Stripe Checkout Session ID (from URL params)
 * @returns {Promise<{
 *   sessionId: string,
 *   paymentStatus: 'paid' | 'unpaid' | 'no_payment_required',
 *   amountTotal: number | null,
 *   currency: string | null,
 *   orderId: string | null,
 *   status: string
 * }>}
 */
export async function verifyPaymentSession(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw Object.assign(new Error('sessionId is required'), {
      type: StripeErrorType.VALIDATION_ERROR,
    });
  }

  const json = await apiRequest(
    `/api/payments/session/${encodeURIComponent(sessionId)}`,
    { method: 'GET' }
  );

  return json.data || {};
}

/**
 * Build success and cancel URLs for Stripe Checkout redirect.
 * Appends the session_id parameter so the success page can verify the payment.
 *
 * @param {Object} [options]
 * @param {string} [options.successPath='/payment-success'] - Path for success redirect
 * @param {string} [options.cancelPath='/test-kalkulacka'] - Path for cancel redirect
 * @returns {{ successUrl: string, cancelUrl: string }}
 */
export function buildCheckoutUrls(options = {}) {
  const {
    successPath = '/payment-success',
    cancelPath = '/test-kalkulacka',
  } = options;

  const origin = window.location.origin;

  return {
    // {CHECKOUT_SESSION_ID} is a Stripe template variable — replaced by actual session ID
    successUrl: `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}${cancelPath}?payment=cancelled`,
  };
}
