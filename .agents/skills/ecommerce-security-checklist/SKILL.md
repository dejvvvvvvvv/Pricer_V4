# E-commerce Security Checklist

Pre-deploy security audit for e-commerce integrations.

## When to Use
Before deploying any e-commerce integration (Shopify, WooCommerce, payment providers).

## Checklist

### Token Handling
- [ ] Storefront tokens stored only in localStorage (admin-scoped, not exposed to end users)
- [ ] Tokens never included in URL parameters or query strings
- [ ] Tokens passed only via HTTP headers (X-Shopify-Storefront-Access-Token)
- [ ] No tokens logged to console in production
- [ ] Token input fields use `type="password"` with copy/paste support

### Origin Validation
- [ ] All postMessage handlers validate `event.origin`
- [ ] Widget embed script checks origin against `baseOrigin`
- [ ] No wildcard (`*`) origin in production postMessage calls
- [ ] CORS not relaxed beyond what the external API requires

### XSS Prevention
- [ ] Shop domain input validated: alphanumeric + hyphens + dots only
- [ ] Variant IDs validated: numeric strings only
- [ ] All user-provided strings escaped before inclusion in GraphQL queries
- [ ] No `innerHTML` or `dangerouslySetInnerHTML` with user data
- [ ] URL redirect targets validated before `window.location.href` assignment

### URL Redirect Safety
- [ ] Checkout URLs must contain `.myshopify.com` or validated custom domain
- [ ] Cart permalink URLs must start with `https://`
- [ ] No open redirect vulnerabilities (user cannot control redirect destination)

### Data Exposure
- [ ] No sensitive admin data sent to Shopify (only prices, quantities, product info)
- [ ] Line item properties do not contain internal IDs or system data
- [ ] Cart notes do not contain PII or system internals
- [ ] Error messages do not leak internal system details

### Input Sanitization
- [ ] Admin form inputs validated before storage
- [ ] GraphQL variables properly typed (no string interpolation in queries)
- [ ] Numeric inputs (variant ID, quantity) parsed and validated
