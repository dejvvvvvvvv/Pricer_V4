# Wave 31 — Shopify Cart, Payments, Migration, Cleanup (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### Shopify Cart Integration (4 bug fixes)
1. **P0 tenantId missing** — ShopifyCartButton didn't pass tenantId to mapper. Widget variant lookups read wrong tenant's mappings. Fixed: added tenantId prop, passed through to mapQuoteToShopifyLines.
2. **P1 Token validation** — validateShopifyConfig required storefront_access_token for cart_permalink mode (which doesn't need it). Fixed: token only required for storefront_api mode.
3. **P1 State race** — "Continue without these" button re-triggered same unmapped warning. Fixed: allowPartial flag prevents re-check.
4. **P1 postMessage origin** — Fallback was '*' when document.referrer empty. Fixed: falls back to window.location.origin.

### AdminPayments (1 fix)
- Success/reset banners auto-dismiss after 3 seconds

### AdminMigration (3 fixes)
1. migrateLog() idempotency guard (checks existing rows before INSERT)
2. Rollback dialog reworded (flag-only switch, no data moved)
3. Migrate dialog backup reminder

### Unused Import Cleanup
- AdminFees.jsx: removed unused `getLearnMore` import

## Files Changed
| File | Changes |
|------|---------|
| `src/pages/widget-kalkulacka/components/ShopifyCartButton.jsx` | Added tenantId prop, allowPartial flag, targetOrigin fallback |
| `src/pages/widget-kalkulacka/index.jsx` | Pass tenantId to ShopifyCartButton |
| `src/lib/shopify/shopifyCartClient.js` | Token validation logic (cart_permalink vs storefront_api) |
| `src/pages/admin/AdminPayments.jsx` | Banner auto-dismiss (3s timeout) |
| `src/lib/supabase/migrationRunner.js` | Idempotency guard for migrateLog() |
| `src/pages/admin/AdminMigration.jsx` | Dialog wording updates |
| `src/pages/admin/AdminFees.jsx` | Removed unused getLearnMore import |

## Impact
- **P0 fix:** Widget Shopify integration now correctly scoped to tenant
- **P1 fixes:** Token validation, state race, postMessage security improved
- **Admin UX:** Auto-dismissing banners reduce clicking
- **Data integrity:** Migration now idempotent (safe for re-runs)

## Testing Notes
- Test Shopify cart with multi-tenant setup (verify variant lookups)
- Verify cart_permalink mode works without token
- Check AdminMigration backup reminder appears before migrate
- Confirm AdminPayments banners disappear after 3s
