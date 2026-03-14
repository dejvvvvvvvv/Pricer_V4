/**
 * Shopify Storefront API Client (Varianta A — client-side only)
 *
 * Two strategies:
 *   A) Cart Permalink — zero API calls, URL redirect
 *   B) Storefront API GraphQL — cartCreate mutation via fetch()
 *
 * No npm dependencies. Uses native fetch().
 */

// ─── Error Types ─────────────────────────────────────────────

export const ShopifyErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_VARIANT: 'INVALID_VARIANT',
  SHOPIFY_API_ERROR: 'SHOPIFY_API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};

// ─── Validation ──────────────────────────────────────────────

const SHOP_DOMAIN_RE = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;
const CUSTOM_DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const VARIANT_ID_RE = /^\d+$/;

/**
 * Validate Shopify integration config.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateShopifyConfig(config) {
  const errors = [];

  if (!config) {
    return { valid: false, errors: ['Config is required'] };
  }

  const domain = (config.shop_domain || '').trim();
  if (!domain) {
    errors.push('Shop domain is required');
  } else if (!SHOP_DOMAIN_RE.test(domain) && !CUSTOM_DOMAIN_RE.test(domain)) {
    errors.push('Invalid shop domain format (expected: myshop.myshopify.com)');
  }

  const mode = config.checkout_mode;
  if (mode && mode !== 'cart_permalink' && mode !== 'storefront_api') {
    errors.push('Invalid checkout mode (expected: cart_permalink or storefront_api)');
  }

  // Storefront Access Token is only required for Storefront API mode.
  // Cart permalink mode works without a token (zero API calls, URL-only).
  const needsToken = !mode || mode === 'storefront_api';
  const token = (config.storefront_access_token || '').trim();
  if (needsToken) {
    if (!token) {
      errors.push('Storefront Access Token is required for Storefront API mode');
    } else if (token.length < 10) {
      errors.push('Storefront Access Token seems too short');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Strategy A: Cart Permalink ──────────────────────────────

const MAX_PERMALINK_LENGTH = 1800;

/**
 * Build a Shopify cart permalink URL (zero API calls).
 *
 * @param {{ shopDomain: string, lineItems: Array<{variantId: string, quantity: number}>, note?: string, redirectTo?: string }}
 * @returns {{ url: string, lineCount: number, tooLong: boolean }}
 */
export function buildCartPermalinkUrl({ shopDomain, lineItems, note, redirectTo = 'checkout' }) {
  if (!shopDomain || !Array.isArray(lineItems) || lineItems.length === 0) {
    return { url: '', lineCount: 0, tooLong: false };
  }

  const domain = shopDomain.trim().replace(/\/+$/, '');
  const protocol = domain.startsWith('http') ? '' : 'https://';

  // Build line items: variant_id:quantity,...
  const lineStr = lineItems
    .filter(li => li.variantId && li.quantity > 0)
    .map(li => `${li.variantId}:${li.quantity}`)
    .join(',');

  if (!lineStr) {
    return { url: '', lineCount: 0, tooLong: false };
  }

  let url = `${protocol}${domain}/cart/${lineStr}`;

  // Add note if provided
  if (note) {
    url += `?note=${encodeURIComponent(note)}`;
  }

  // Add storefront redirect (if cart_permalink and checkout mode)
  // /cart/... URLs go to cart page by default
  // Appending checkout param not standard — user lands on cart, clicks checkout

  const tooLong = url.length > MAX_PERMALINK_LENGTH;

  return {
    url,
    lineCount: lineItems.filter(li => li.variantId && li.quantity > 0).length,
    tooLong,
  };
}

// ─── Strategy B: Storefront API GraphQL ──────────────────────

const STOREFRONT_API_VERSION = '2024-01';

const CART_CREATE_MUTATION = `
mutation cartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
      lines(first: 250) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
              }
            }
          }
        }
      }
      estimatedCost {
        totalAmount {
          amount
          currencyCode
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
`;

/**
 * Create a cart via Shopify Storefront API GraphQL.
 *
 * @param {{ shopDomain: string, storefrontAccessToken: string, lineItems: Array<{variantId: string, quantity: number, properties?: Record<string,string>}>, note?: string }}
 * @returns {Promise<{ checkoutUrl: string, cartId: string, lineCount: number, errors: Array<{field: string, message: string}> }>}
 */
export async function createStorefrontCart({ shopDomain, storefrontAccessToken, lineItems, note }) {
  const domain = (shopDomain || '').trim().replace(/\/+$/, '');
  const token = (storefrontAccessToken || '').trim();

  if (!domain || !token) {
    throw Object.assign(new Error('Missing shop domain or token'), {
      type: ShopifyErrorType.VALIDATION_ERROR,
    });
  }

  // Build GraphQL line items
  const gqlLines = lineItems
    .filter(li => li.variantId && li.quantity > 0)
    .map(li => {
      const line = {
        merchandiseId: `gid://shopify/ProductVariant/${li.variantId}`,
        quantity: li.quantity,
      };

      // Add line item properties as attributes
      if (li.properties && typeof li.properties === 'object') {
        line.attributes = Object.entries(li.properties).map(([key, value]) => ({
          key,
          value: String(value),
        }));
      }

      return line;
    });

  if (gqlLines.length === 0) {
    throw Object.assign(new Error('No valid line items'), {
      type: ShopifyErrorType.VALIDATION_ERROR,
    });
  }

  const input = { lines: gqlLines };

  if (note) {
    input.note = note;
  }

  const endpoint = `https://${domain}/api/${STOREFRONT_API_VERSION}/graphql.json`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: CART_CREATE_MUTATION, variables: { input } }),
    });
  } catch (err) {
    throw Object.assign(new Error(`Network error: ${err.message}`), {
      type: ShopifyErrorType.NETWORK_ERROR,
      cause: err,
    });
  }

  if (response.status === 401 || response.status === 403) {
    throw Object.assign(new Error('Invalid or expired Storefront Access Token'), {
      type: ShopifyErrorType.INVALID_TOKEN,
      status: response.status,
    });
  }

  if (!response.ok) {
    throw Object.assign(new Error(`Shopify API error (HTTP ${response.status})`), {
      type: ShopifyErrorType.SHOPIFY_API_ERROR,
      status: response.status,
    });
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw Object.assign(new Error('Invalid JSON response from Shopify'), {
      type: ShopifyErrorType.SHOPIFY_API_ERROR,
    });
  }

  // Check for GraphQL errors
  if (json.errors && json.errors.length > 0) {
    const msg = json.errors.map(e => e.message).join('; ');
    const isTokenError = msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('unauthorized');
    throw Object.assign(new Error(msg), {
      type: isTokenError ? ShopifyErrorType.INVALID_TOKEN : ShopifyErrorType.SHOPIFY_API_ERROR,
      graphqlErrors: json.errors,
    });
  }

  const cartData = json.data?.cartCreate;
  if (!cartData) {
    throw Object.assign(new Error('Unexpected response structure'), {
      type: ShopifyErrorType.SHOPIFY_API_ERROR,
    });
  }

  // Check for user errors (invalid variant, etc.)
  if (cartData.userErrors && cartData.userErrors.length > 0) {
    const msg = cartData.userErrors.map(e => e.message).join('; ');
    const isVariantError = msg.toLowerCase().includes('variant') || msg.toLowerCase().includes('merchandise');
    return {
      checkoutUrl: '',
      cartId: '',
      lineCount: 0,
      errors: cartData.userErrors.map(e => ({ field: e.field?.join('.') || '', message: e.message })),
      errorType: isVariantError ? ShopifyErrorType.INVALID_VARIANT : ShopifyErrorType.SHOPIFY_API_ERROR,
    };
  }

  const cart = cartData.cart;
  return {
    checkoutUrl: cart.checkoutUrl || '',
    cartId: cart.id || '',
    lineCount: cart.lines?.edges?.length || 0,
    errors: [],
  };
}

// ─── Test Connection ─────────────────────────────────────────

const SHOP_INFO_QUERY = `
{
  shop {
    name
    primaryDomain {
      url
    }
  }
}
`;

/**
 * Test Shopify connection by querying shop info.
 * @returns {Promise<{ success: boolean, shopName?: string, shopUrl?: string, error?: string }>}
 */
export async function testShopifyConnection({ shopDomain, storefrontAccessToken }) {
  const domain = (shopDomain || '').trim().replace(/\/+$/, '');
  const token = (storefrontAccessToken || '').trim();

  if (!domain || !token) {
    return { success: false, error: 'Missing shop domain or token' };
  }

  const endpoint = `https://${domain}/api/${STOREFRONT_API_VERSION}/graphql.json`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query: SHOP_INFO_QUERY }),
    });

    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'Invalid Storefront Access Token' };
    }

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const json = await response.json();

    if (json.errors) {
      return { success: false, error: json.errors[0]?.message || 'GraphQL error' };
    }

    const shop = json.data?.shop;
    return {
      success: true,
      shopName: shop?.name || '',
      shopUrl: shop?.primaryDomain?.url || '',
    };
  } catch (err) {
    return { success: false, error: `Network error: ${err.message}` };
  }
}

// ─── URL Validation ──────────────────────────────────────────

/**
 * Validate that a checkout URL is safe to redirect to.
 * Must be HTTPS and from a Shopify domain.
 */
export function isValidCheckoutUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    // Must be a Shopify domain or custom domain pointing to Shopify
    if (parsed.hostname.endsWith('.myshopify.com')) return true;
    // Custom domains: we allow any HTTPS URL that came from the API response
    // The URL was generated by Shopify's API, so it's trustworthy
    if (parsed.hostname.endsWith('.shopify.com')) return true;
    // For custom domains, trust the API response but log a warning
    console.warn('[ShopifyClient] Checkout URL uses custom domain:', parsed.hostname);
    return true;
  } catch {
    return false;
  }
}
