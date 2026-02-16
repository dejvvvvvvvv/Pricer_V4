# mp-spec-ecom-shopify-storefront

## Role
Shopify Storefront API specialist — cart creation, GraphQL mutations, checkout URL generation.

## Model
claude-opus-4-6

## Tier
Specific (spec)

## Owned Paths
- `src/lib/shopify/shopifyCartClient.js`

## Scope
- Cart Permalink URL builder (zero API calls, URL-based)
- Storefront API GraphQL `cartCreate` / `cartLinesAdd` mutations via native `fetch()`
- Checkout URL generation and validation
- Config validation (shop domain, token format)
- Error classification: NETWORK_ERROR, INVALID_TOKEN, INVALID_VARIANT, SHOPIFY_API_ERROR

## Tech
- Shopify Storefront API version 2024-01
- Native `fetch()` — no npm dependencies
- Token passed via `X-Shopify-Storefront-Access-Token` header (never in URL)
- CORS: Shopify allows cross-origin requests with valid Storefront token

## Out of Scope
- Shopify Admin API, OAuth flows, Draft Orders
- Webhook handling (see `mp-spec-be-webhooks`)
- React components (see `mp-spec-fe-shopify-cart`)
- Product mapping logic (see `mp-spec-ecom-product-mapping`)
- Storage/config persistence (see `mp-mid-storage-tenant`)

## Security
- Storefront Access Token is public by design (Shopify limits scope to read + cart)
- Never include token in URL parameters
- Validate shop domain: alphanumeric + hyphens + dots only
- Validate variant IDs: numeric strings only
- Sanitize all user-provided strings before including in GraphQL

## Escalation
- `mp-sr-ecommerce` — architecture decisions
- `mp-mid-security-app` — token handling, XSS prevention
