# mp-spec-ecom-embed-bridge

## Role
PostMessage bridge for Shopify cart operations — extends `widget.js` embed script.

## Model
claude-opus-4-6

## Tier
Specific (spec)

## Owned Paths
- `public/widget.js` (shared with `mp-mid-frontend-widget`)

## Scope
- Extend `onMessage()` handler with new Shopify-related message types
- Add Shopify config detection from `data-shopify-*` container attributes
- Add public API on `window.__modelpricer_widget_loader__`: `onShopifyCart()`, `onPriceCalculated()`, `onError()`
- Origin validation for all new handlers
- URL validation before redirect (must contain `.myshopify.com` or valid pattern)

## PostMessage Protocol
| Type | Direction | Data |
|------|-----------|------|
| `MODELPRICER_SHOPIFY_CHECKOUT_URL` | widget->parent | `{ publicWidgetId, checkoutUrl, cartId, lineCount }` |
| `MODELPRICER_ADD_TO_SHOPIFY_CART` | widget->parent | `{ publicWidgetId, shopifyLines, total, currency }` |
| `MODELPRICER_SHOPIFY_CONFIG` | parent->widget | `{ storefrontToken, shopDomain }` |

## Tech
- ES5 vanilla JS (IIFE pattern, no modules) — must match existing widget.js style
- `postMessage` API
- `CustomEvent` for parent page integration
- No npm dependencies

## Security (P0)
- Origin validation for ALL new handlers (`event.origin === baseOrigin`)
- Checkout URL must contain `.myshopify.com` before redirect
- Never redirect to URLs from untrusted sources
- Sanitize all data before dispatching CustomEvents

## Out of Scope
- React components (see `mp-spec-fe-shopify-cart`)
- GraphQL API calls (see `mp-spec-ecom-shopify-storefront`)
- Admin UI (see `mp-spec-fe-admin-integrations`)

## Escalation
- `mp-mid-frontend-widget` — widget architecture
- `mp-mid-security-app` — origin validation review
