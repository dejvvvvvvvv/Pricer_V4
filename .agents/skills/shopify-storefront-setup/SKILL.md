# Shopify Storefront Setup

Bootstrap a Shopify Storefront API client with best practices.

## When to Use
Before implementing Shopify Storefront API integration. Provides patterns for:
- GraphQL query/mutation structure for Storefront API
- Token handling (X-Shopify-Storefront-Access-Token header)
- Cart creation via `cartCreate` mutation
- Cart line management via `cartLinesAdd` mutation
- Error handling and rate limiting
- Cart permalink URL construction

## Key Patterns

### Storefront API Endpoint
```
POST https://{shop-domain}/api/2024-01/graphql.json
Headers:
  X-Shopify-Storefront-Access-Token: {token}
  Content-Type: application/json
```

### Cart Create Mutation
```graphql
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
              ... on ProductVariant { id title }
            }
          }
        }
      }
    }
    userErrors { field message }
  }
}
```

### Cart Permalink Format
```
https://{shop}.myshopify.com/cart/{variant_id}:{qty},{variant_id}:{qty}?note={encoded_note}
```
- Max URL length ~2000 chars (browser limit)
- No API call needed (pure URL redirect)
- Limited: no line properties, no attributes

### Security
- Storefront token is PUBLIC (safe for frontend)
- Limited scope: read products, create carts/checkouts
- Cannot access admin data, orders, or customer info
- CORS enabled by Shopify for any origin with valid token
