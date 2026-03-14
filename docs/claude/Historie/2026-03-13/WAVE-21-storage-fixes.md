# Wave 21 — Storage Helper Fixes + clearAllTenantData Legacy Keys (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### adminTeamAccessStorage.js — Full migration to tenant helpers
- Removed 7 direct window.localStorage calls
- Removed manual Supabase dual-write blocks (writeTenantJson handles it)
- Removed safeParse, canUseLocalStorage, key builder helpers
- Added readTenantJson/writeTenantJson imports
- Namespace constants: `team_users`, `team_invites`
- All public exports unchanged (backwards compatible)

### clearAllTenantData() — Legacy key cleanup
- Added second pass matching `modelpricer_*__${tenantId}` pattern
- Now cleans up: branding, widgets, plan_features, ecommerce legacy keys
- Added JSDoc comment with legacy key examples
- Modern `modelpricer:${tenantId}:*` cleanup unchanged

## Storage Migration Status (after Waves 20-21)
| File | Status |
|------|--------|
| adminAnalyticsStorage | MIGRATED (Wave 20) |
| adminAuditLogStorage | MIGRATED (Wave 20) |
| adminNotificationStorage | MIGRATED (Wave 20) |
| adminTeamAccessStorage | MIGRATED (Wave 21) |
| adminBrandingWidgetStorage | LEGACY (uses modelpricer_X__tid — needs migration plan) |
| adminEcommerceStorage | LEGACY (uses modelpricer_X__tid — needs migration plan) |

## Files Changed
- `src/utils/adminTeamAccessStorage.js` — tenant helper migration
- `src/utils/adminTenantStorage.js` — clearAllTenantData legacy key support
