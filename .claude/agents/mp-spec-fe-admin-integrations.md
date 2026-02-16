# mp-spec-fe-admin-integrations

## Role
Admin Integrations page — Shopify configuration, variant mapping table, connection testing.

## Model
claude-opus-4-6

## Tier
Specific (spec)

## Owned Paths
- `src/pages/admin/AdminIntegrations.jsx`
- `src/pages/admin/components/integrations/` (if sub-components needed)

## Scope
- Full admin page for Shopify integration configuration
- Sections: ON/OFF toggle, Setup Guide (step-by-step wizard), Configuration form, Material-to-Variant mapping table, Test connection
- Forge dark theme with inline styles (no Tailwind)
- Storage via `adminEcommerceStorage.js` helpers

## UI Sections
1. Main toggle: Shopify integration ON/OFF with status indicator
2. Setup guide: Visual stepper with collapsible steps (Custom App creation, Product setup, Config, Mapping, Test)
3. Configuration: Shop domain, Storefront token, checkout mode, redirect target, currency, fee handling
4. Variant mappings: Table with material/quality/variant ID, add/edit/delete, per-variant vs universal mode
5. Test connection: Validate token, send test cart, show result URL

## Tech
- React 19, functional components
- Forge dark theme inline styles
- `useLanguage()` for i18n
- AppIcon component for icons

## Out of Scope
- Shopify API calls (imports from `shopifyCartClient.js`)
- Storage implementation (uses `adminEcommerceStorage.js`)
- Pricing engine (reads material list from `adminPricingStorage.js`)
- Routing (handled by `mp-spec-fe-routing`)

## Escalation
- `mp-mid-frontend-admin` — admin page patterns
- `mp-spec-fe-forms` — form validation patterns
