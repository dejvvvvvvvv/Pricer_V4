# mp-spec-ecom-product-mapping

## Role
Material-to-Shopify-variant mapping logic — transforms pricing engine output into Shopify line items.

## Model
claude-opus-4-6

## Tier
Specific (spec)

## Owned Paths
- `src/lib/shopify/shopifyCartMapper.js`

## Scope
- Transform `calculateOrderQuote()` output to Shopify cart line items
- Variant lookup: per-variant mode (material+quality -> variant ID) and universal mode
- Fee handling strategies: included_in_price, line_property, separate_variant
- Volume discount price adjustments
- Unmapped model detection and fallback variant assignment
- Quantity aggregation for same material+quality combinations

## Tech
- Pure JavaScript, no dependencies
- Input: pricing engine quote result format
- Output: `{ lineItems, unmappedModels, feeLines, warnings, totalCalculated }`

## Edge Cases
- Multiple models with same material → aggregate quantities
- Volume discounts → adjusted unit price + breakdown in properties
- Currency mismatch → warning (price sent as-is)
- Missing variant mapping → fallback variant or unmapped warning

## Out of Scope
- Shopify API calls (see `mp-spec-ecom-shopify-storefront`)
- UI components (see `mp-spec-fe-shopify-cart`)
- Storage persistence (see `mp-mid-storage-tenant`)
- Pricing engine internals (see `mp-mid-pricing-engine`)

## Escalation
- `mp-sr-pricing` — pricing engine output format questions
- `mp-sr-ecommerce` — architecture decisions
