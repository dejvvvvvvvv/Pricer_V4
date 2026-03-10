import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateShopifyConfig,
  buildCartPermalinkUrl,
  createStorefrontCart,
  testShopifyConnection,
  isValidCheckoutUrl,
  ShopifyErrorType,
} from '../shopifyCartClient.js';

// ─── Global fetch mock ────────────────────────────────────────

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────

function mockFetchResponse({ status = 200, ok = true, json = {} } = {}) {
  globalThis.fetch.mockResolvedValueOnce({
    status,
    ok,
    json: () => Promise.resolve(json),
  });
}

function mockFetchNetworkError(message = 'Failed to fetch') {
  globalThis.fetch.mockRejectedValueOnce(new Error(message));
}

function mockFetchBadJson({ status = 200, ok = true } = {}) {
  globalThis.fetch.mockResolvedValueOnce({
    status,
    ok,
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
  });
}

// ═══════════════════════════════════════════════════════════════
// validateShopifyConfig
// ═══════════════════════════════════════════════════════════════

describe('validateShopifyConfig', () => {
  it('should return invalid when config is null', () => {
    const result = validateShopifyConfig(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Config is required');
  });

  it('should return invalid when config is undefined', () => {
    const result = validateShopifyConfig(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Config is required');
  });

  it('should require shop_domain', () => {
    const result = validateShopifyConfig({
      storefront_access_token: 'shpat_abcdef1234567890',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Shop domain is required');
  });

  it('should reject invalid shop_domain format', () => {
    const result = validateShopifyConfig({
      shop_domain: 'not-valid',
      storefront_access_token: 'shpat_abcdef1234567890',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid shop domain'))).toBe(true);
  });

  it('should accept valid myshopify.com domain', () => {
    const result = validateShopifyConfig({
      shop_domain: 'my-shop.myshopify.com',
      storefront_access_token: 'shpat_abcdef1234567890',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept custom domain format', () => {
    const result = validateShopifyConfig({
      shop_domain: 'shop.example.com',
      storefront_access_token: 'shpat_abcdef1234567890',
    });
    expect(result.valid).toBe(true);
  });

  it('should require storefront_access_token', () => {
    const result = validateShopifyConfig({
      shop_domain: 'test.myshopify.com',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Storefront Access Token is required');
  });

  it('should reject too short storefront_access_token', () => {
    const result = validateShopifyConfig({
      shop_domain: 'test.myshopify.com',
      storefront_access_token: 'short',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('too short'))).toBe(true);
  });

  it('should reject invalid checkout_mode', () => {
    const result = validateShopifyConfig({
      shop_domain: 'test.myshopify.com',
      storefront_access_token: 'shpat_abcdef1234567890',
      checkout_mode: 'invalid_mode',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid checkout mode'))).toBe(true);
  });

  it('should accept cart_permalink checkout_mode', () => {
    const result = validateShopifyConfig({
      shop_domain: 'test.myshopify.com',
      storefront_access_token: 'shpat_abcdef1234567890',
      checkout_mode: 'cart_permalink',
    });
    expect(result.valid).toBe(true);
  });

  it('should accept storefront_api checkout_mode', () => {
    const result = validateShopifyConfig({
      shop_domain: 'test.myshopify.com',
      storefront_access_token: 'shpat_abcdef1234567890',
      checkout_mode: 'storefront_api',
    });
    expect(result.valid).toBe(true);
  });

  it('should accept config without checkout_mode (optional)', () => {
    const result = validateShopifyConfig({
      shop_domain: 'test.myshopify.com',
      storefront_access_token: 'shpat_abcdef1234567890',
    });
    expect(result.valid).toBe(true);
  });

  it('should collect multiple errors', () => {
    const result = validateShopifyConfig({
      checkout_mode: 'bad',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ═══════════════════════════════════════════════════════════════
// buildCartPermalinkUrl
// ═══════════════════════════════════════════════════════════════

describe('buildCartPermalinkUrl', () => {
  it('should build correct permalink URL with variant IDs and quantities', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'test-shop.myshopify.com',
      lineItems: [
        { variantId: '12345', quantity: 2 },
        { variantId: '67890', quantity: 1 },
      ],
    });

    expect(result.url).toBe('https://test-shop.myshopify.com/cart/12345:2,67890:1');
    expect(result.lineCount).toBe(2);
    expect(result.tooLong).toBe(false);
  });

  it('should return empty result when shopDomain is missing', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: '',
      lineItems: [{ variantId: '123', quantity: 1 }],
    });

    expect(result.url).toBe('');
    expect(result.lineCount).toBe(0);
  });

  it('should return empty result when lineItems is empty', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'test.myshopify.com',
      lineItems: [],
    });

    expect(result.url).toBe('');
    expect(result.lineCount).toBe(0);
  });

  it('should return empty result when lineItems is not an array', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'test.myshopify.com',
      lineItems: null,
    });

    expect(result.url).toBe('');
  });

  it('should filter out items with zero quantity', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'test.myshopify.com',
      lineItems: [
        { variantId: '111', quantity: 0 },
        { variantId: '222', quantity: 3 },
      ],
    });

    expect(result.url).toBe('https://test.myshopify.com/cart/222:3');
    expect(result.lineCount).toBe(1);
  });

  it('should filter out items without variantId', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'test.myshopify.com',
      lineItems: [
        { variantId: '', quantity: 1 },
        { variantId: '222', quantity: 1 },
      ],
    });

    expect(result.url).toBe('https://test.myshopify.com/cart/222:1');
    expect(result.lineCount).toBe(1);
  });

  it('should return empty URL when all line items are filtered out', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'test.myshopify.com',
      lineItems: [
        { variantId: '', quantity: 1 },
        { variantId: '111', quantity: 0 },
      ],
    });

    expect(result.url).toBe('');
    expect(result.lineCount).toBe(0);
  });

  it('should add note as query parameter when provided', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'test.myshopify.com',
      lineItems: [{ variantId: '123', quantity: 1 }],
      note: 'ModelPricer order',
    });

    expect(result.url).toContain('?note=ModelPricer%20order');
  });

  it('should not add protocol when domain already includes http', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'https://test.myshopify.com',
      lineItems: [{ variantId: '123', quantity: 1 }],
    });

    expect(result.url).toBe('https://test.myshopify.com/cart/123:1');
    expect(result.url).not.toContain('https://https://');
  });

  it('should strip trailing slashes from domain', () => {
    const result = buildCartPermalinkUrl({
      shopDomain: 'test.myshopify.com///',
      lineItems: [{ variantId: '123', quantity: 1 }],
    });

    expect(result.url).toBe('https://test.myshopify.com/cart/123:1');
  });

  it('should flag tooLong when URL exceeds 1800 characters', () => {
    // Create many line items to exceed URL length
    const lineItems = Array.from({ length: 200 }, (_, i) => ({
      variantId: `${1000000000 + i}`,
      quantity: 99,
    }));

    const result = buildCartPermalinkUrl({
      shopDomain: 'test.myshopify.com',
      lineItems,
    });

    expect(result.tooLong).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// createStorefrontCart
// ═══════════════════════════════════════════════════════════════

describe('createStorefrontCart', () => {
  const validParams = {
    shopDomain: 'test-shop.myshopify.com',
    storefrontAccessToken: 'shpat_abcdef1234567890',
    lineItems: [{ variantId: '12345', quantity: 2 }],
  };

  it('should throw VALIDATION_ERROR when shop domain is missing', async () => {
    await expect(
      createStorefrontCart({ ...validParams, shopDomain: '' })
    ).rejects.toMatchObject({ type: ShopifyErrorType.VALIDATION_ERROR });
  });

  it('should throw VALIDATION_ERROR when token is missing', async () => {
    await expect(
      createStorefrontCart({ ...validParams, storefrontAccessToken: '' })
    ).rejects.toMatchObject({ type: ShopifyErrorType.VALIDATION_ERROR });
  });

  it('should throw VALIDATION_ERROR when no valid line items', async () => {
    await expect(
      createStorefrontCart({
        ...validParams,
        lineItems: [{ variantId: '', quantity: 0 }],
      })
    ).rejects.toMatchObject({ type: ShopifyErrorType.VALIDATION_ERROR });
  });

  it('should send correct GraphQL mutation to Shopify endpoint', async () => {
    mockFetchResponse({
      json: {
        data: {
          cartCreate: {
            cart: {
              id: 'gid://shopify/Cart/abc',
              checkoutUrl: 'https://test-shop.myshopify.com/cart/c/abc',
              lines: { edges: [{ node: { id: 'line1', quantity: 2, merchandise: { id: 'v1', title: 'Test' } } }] },
              estimatedCost: { totalAmount: { amount: '100.00', currencyCode: 'CZK' } },
            },
            userErrors: [],
          },
        },
      },
    });

    await createStorefrontCart(validParams);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = globalThis.fetch.mock.calls[0];

    expect(url).toBe('https://test-shop.myshopify.com/api/2024-01/graphql.json');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-Shopify-Storefront-Access-Token']).toBe('shpat_abcdef1234567890');

    const body = JSON.parse(options.body);
    expect(body.query).toContain('cartCreate');
    expect(body.variables.input.lines).toEqual([
      {
        merchandiseId: 'gid://shopify/ProductVariant/12345',
        quantity: 2,
      },
    ]);
  });

  it('should include line item properties as attributes', async () => {
    mockFetchResponse({
      json: {
        data: {
          cartCreate: {
            cart: {
              id: 'gid://shopify/Cart/abc',
              checkoutUrl: 'https://test-shop.myshopify.com/cart/c/abc',
              lines: { edges: [] },
            },
            userErrors: [],
          },
        },
      },
    });

    await createStorefrontCart({
      ...validParams,
      lineItems: [
        {
          variantId: '12345',
          quantity: 1,
          properties: { Model: 'cube.stl', Material: 'PLA' },
        },
      ],
    });

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    const line = body.variables.input.lines[0];
    expect(line.attributes).toEqual([
      { key: 'Model', value: 'cube.stl' },
      { key: 'Material', value: 'PLA' },
    ]);
  });

  it('should include note in cart input when provided', async () => {
    mockFetchResponse({
      json: {
        data: {
          cartCreate: {
            cart: { id: 'c1', checkoutUrl: 'https://x.myshopify.com/cart/c/c1', lines: { edges: [] } },
            userErrors: [],
          },
        },
      },
    });

    await createStorefrontCart({ ...validParams, note: 'Test note' });

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body.variables.input.note).toBe('Test note');
  });

  it('should return checkoutUrl, cartId, and lineCount on success', async () => {
    mockFetchResponse({
      json: {
        data: {
          cartCreate: {
            cart: {
              id: 'gid://shopify/Cart/xyz',
              checkoutUrl: 'https://test-shop.myshopify.com/cart/c/xyz',
              lines: {
                edges: [
                  { node: { id: 'l1', quantity: 2 } },
                  { node: { id: 'l2', quantity: 1 } },
                ],
              },
            },
            userErrors: [],
          },
        },
      },
    });

    const result = await createStorefrontCart(validParams);

    expect(result.checkoutUrl).toBe('https://test-shop.myshopify.com/cart/c/xyz');
    expect(result.cartId).toBe('gid://shopify/Cart/xyz');
    expect(result.lineCount).toBe(2);
    expect(result.errors).toEqual([]);
  });

  it('should throw NETWORK_ERROR on fetch failure', async () => {
    mockFetchNetworkError('Connection refused');

    await expect(createStorefrontCart(validParams)).rejects.toMatchObject({
      type: ShopifyErrorType.NETWORK_ERROR,
    });
  });

  it('should throw INVALID_TOKEN on 401 response', async () => {
    mockFetchResponse({ status: 401, ok: false });

    await expect(createStorefrontCart(validParams)).rejects.toMatchObject({
      type: ShopifyErrorType.INVALID_TOKEN,
      status: 401,
    });
  });

  it('should throw INVALID_TOKEN on 403 response', async () => {
    mockFetchResponse({ status: 403, ok: false });

    await expect(createStorefrontCart(validParams)).rejects.toMatchObject({
      type: ShopifyErrorType.INVALID_TOKEN,
      status: 403,
    });
  });

  it('should throw SHOPIFY_API_ERROR on non-OK response', async () => {
    mockFetchResponse({ status: 500, ok: false });

    await expect(createStorefrontCart(validParams)).rejects.toMatchObject({
      type: ShopifyErrorType.SHOPIFY_API_ERROR,
      status: 500,
    });
  });

  it('should throw SHOPIFY_API_ERROR on invalid JSON response', async () => {
    mockFetchBadJson();

    await expect(createStorefrontCart(validParams)).rejects.toMatchObject({
      type: ShopifyErrorType.SHOPIFY_API_ERROR,
    });
  });

  it('should throw on GraphQL errors', async () => {
    mockFetchResponse({
      json: {
        errors: [{ message: 'Something went wrong' }],
      },
    });

    await expect(createStorefrontCart(validParams)).rejects.toMatchObject({
      type: ShopifyErrorType.SHOPIFY_API_ERROR,
    });
  });

  it('should throw INVALID_TOKEN on GraphQL access denied error', async () => {
    mockFetchResponse({
      json: {
        errors: [{ message: 'Access denied for this Storefront Access Token' }],
      },
    });

    await expect(createStorefrontCart(validParams)).rejects.toMatchObject({
      type: ShopifyErrorType.INVALID_TOKEN,
    });
  });

  it('should throw SHOPIFY_API_ERROR when cartCreate data is missing', async () => {
    mockFetchResponse({
      json: { data: {} },
    });

    await expect(createStorefrontCart(validParams)).rejects.toMatchObject({
      type: ShopifyErrorType.SHOPIFY_API_ERROR,
    });
  });

  it('should return user errors (e.g. invalid variant) without throwing', async () => {
    mockFetchResponse({
      json: {
        data: {
          cartCreate: {
            cart: null,
            userErrors: [
              { field: ['lines', '0', 'merchandiseId'], message: 'Variant not found' },
            ],
          },
        },
      },
    });

    const result = await createStorefrontCart(validParams);

    expect(result.checkoutUrl).toBe('');
    expect(result.cartId).toBe('');
    expect(result.lineCount).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('Variant not found');
    expect(result.errorType).toBe(ShopifyErrorType.INVALID_VARIANT);
  });

  it('should filter out line items with zero quantity', async () => {
    mockFetchResponse({
      json: {
        data: {
          cartCreate: {
            cart: { id: 'c1', checkoutUrl: 'https://x.myshopify.com/c', lines: { edges: [] } },
            userErrors: [],
          },
        },
      },
    });

    await createStorefrontCart({
      ...validParams,
      lineItems: [
        { variantId: '111', quantity: 0 },
        { variantId: '222', quantity: 3 },
      ],
    });

    const body = JSON.parse(globalThis.fetch.mock.calls[0][1].body);
    expect(body.variables.input.lines).toHaveLength(1);
    expect(body.variables.input.lines[0].merchandiseId).toContain('222');
  });

  it('should strip trailing slashes from shop domain', async () => {
    mockFetchResponse({
      json: {
        data: {
          cartCreate: {
            cart: { id: 'c1', checkoutUrl: 'https://x.myshopify.com/c', lines: { edges: [] } },
            userErrors: [],
          },
        },
      },
    });

    await createStorefrontCart({
      ...validParams,
      shopDomain: 'test-shop.myshopify.com///',
    });

    const url = globalThis.fetch.mock.calls[0][0];
    expect(url).toBe('https://test-shop.myshopify.com/api/2024-01/graphql.json');
  });
});

// ═══════════════════════════════════════════════════════════════
// testShopifyConnection
// ═══════════════════════════════════════════════════════════════

describe('testShopifyConnection', () => {
  const validParams = {
    shopDomain: 'test.myshopify.com',
    storefrontAccessToken: 'shpat_abcdef1234567890',
  };

  it('should return failure when domain is missing', async () => {
    const result = await testShopifyConnection({ ...validParams, shopDomain: '' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing');
  });

  it('should return failure when token is missing', async () => {
    const result = await testShopifyConnection({ ...validParams, storefrontAccessToken: '' });
    expect(result.success).toBe(false);
  });

  it('should return success with shop info on valid response', async () => {
    mockFetchResponse({
      json: {
        data: {
          shop: {
            name: 'My Test Shop',
            primaryDomain: { url: 'https://my-test-shop.myshopify.com' },
          },
        },
      },
    });

    const result = await testShopifyConnection(validParams);

    expect(result.success).toBe(true);
    expect(result.shopName).toBe('My Test Shop');
    expect(result.shopUrl).toBe('https://my-test-shop.myshopify.com');
  });

  it('should return failure on 401 response', async () => {
    mockFetchResponse({ status: 401, ok: false });

    const result = await testShopifyConnection(validParams);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid Storefront Access Token');
  });

  it('should return failure on non-OK response', async () => {
    mockFetchResponse({ status: 500, ok: false });

    const result = await testShopifyConnection(validParams);
    expect(result.success).toBe(false);
    expect(result.error).toContain('HTTP 500');
  });

  it('should return failure on GraphQL errors', async () => {
    mockFetchResponse({
      json: {
        errors: [{ message: 'Some GraphQL error' }],
      },
    });

    const result = await testShopifyConnection(validParams);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Some GraphQL error');
  });

  it('should return failure on network error', async () => {
    mockFetchNetworkError('DNS resolution failed');

    const result = await testShopifyConnection(validParams);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });
});

// ═══════════════════════════════════════════════════════════════
// isValidCheckoutUrl
// ═══════════════════════════════════════════════════════════════

describe('isValidCheckoutUrl', () => {
  it('should accept HTTPS myshopify.com URL', () => {
    expect(isValidCheckoutUrl('https://test.myshopify.com/cart/c/abc')).toBe(true);
  });

  it('should accept HTTPS shopify.com URL', () => {
    expect(isValidCheckoutUrl('https://checkout.shopify.com/abc')).toBe(true);
  });

  it('should accept HTTPS custom domain (trusted from API)', () => {
    // Custom domains are trusted when they come from API responses
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(isValidCheckoutUrl('https://shop.example.com/checkout/abc')).toBe(true);
    spy.mockRestore();
  });

  it('should reject HTTP URLs', () => {
    expect(isValidCheckoutUrl('http://test.myshopify.com/cart/c/abc')).toBe(false);
  });

  it('should reject null', () => {
    expect(isValidCheckoutUrl(null)).toBe(false);
  });

  it('should reject undefined', () => {
    expect(isValidCheckoutUrl(undefined)).toBe(false);
  });

  it('should reject empty string', () => {
    expect(isValidCheckoutUrl('')).toBe(false);
  });

  it('should reject non-string values', () => {
    expect(isValidCheckoutUrl(123)).toBe(false);
  });

  it('should reject malformed URLs', () => {
    expect(isValidCheckoutUrl('not-a-url')).toBe(false);
  });
});
