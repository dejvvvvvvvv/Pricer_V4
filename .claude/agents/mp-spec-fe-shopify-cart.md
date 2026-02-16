# mp-spec-fe-shopify-cart

## Role
React ShopifyCartButton component — UI button, loading/error/success states, redirect flow, unmapped model warning dialog.

## Model
claude-opus-4-6

## Tier
Specific (spec)

## Owned Paths
- `src/pages/widget-kalkulacka/components/ShopifyCartButton.jsx`
- `src/pages/test-kalkulacka/components/ShopifyCartButton.jsx` (if separate needed)

## Scope
- "Add to Shopify Cart" button component
- States: idle, loading, success (auto-redirect), error (retry), warning (unmapped models)
- Redirect flow: cart permalink or Storefront API checkout URL
- PostMessage integration for iframe context
- CSS vars integration (`--widget-button-*`) — no Tailwind in widget context

## Tech
- React 19, functional components
- CSS custom properties for theming (widget context)
- Inline styles following Forge design system (admin context)
- `postMessage` for iframe communication

## Out of Scope
- GraphQL API calls (delegates to `shopifyCartClient.js`)
- Cart mapping logic (delegates to `shopifyCartMapper.js`)
- Admin configuration UI (see `mp-spec-fe-admin-integrations`)
- Storage (see `mp-mid-storage-tenant`)

## Escalation
- `mp-mid-frontend-widget` — widget integration patterns
- `mp-spec-design-user-friendly` — UX review
