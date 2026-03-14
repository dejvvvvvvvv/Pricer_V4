# Wave 20 — Dashboard, API Consistency, Storage Audit (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### Admin Dashboard (3 fixes)
1. **Order row navigation** — Fixed click going to /admin/orders (list) instead of /admin/orders/${id} (detail)
2. **Activity feed empty state** — Improved from single italic line to icon + two-line explanation
3. **Duplicate storage reads** — loadCouponsConfigV1 and getBranding called once via shared useMemo instead of duplicated in multiple hooks

### Backend API Error Consistency (14 response format fixes)
- Unified POST /api/slice from `{success, error}` to standard `{ok, errorCode, message}` format
- Fixed GET /api/widget/presets error response (was mixed success/error shape)
- Fixed GET /api/health/prusa — changed 500 to 503 for slicer unavailability
- All routes now use consistent `{ok, errorCode, message, data}` pattern

### Storage Helper Audit (23 files reviewed)
- **6 CRITICAL:** Direct localStorage bypassing tenant helper (analytics, branding, ecommerce, audit log, team, notifications)
- **10 MODERATE:** Missing tenantIdOverride on admin-only helpers
- **7 COMPLIANT:** Full pattern compliance
- **Key finding:** adminBrandingWidgetStorage + adminEcommerceStorage use legacy `modelpricer_X__${tenantId}` format — clearAllTenantData() misses them

### Storage Fixes Applied (3 files)
- adminAnalyticsStorage.js → readTenantJson/writeTenantJson
- adminAuditLogStorage.js → readTenantJson/writeTenantJson
- adminNotificationStorage.js → readTenantJson/writeTenantJson

## Files Changed
- `src/pages/admin/AdminDashboard.jsx` — navigation, empty state, dedup
- `backend-local/src/index.js` — 14 response format normalizations
- `src/utils/adminAnalyticsStorage.js` — tenant helper migration
- `src/utils/adminAuditLogStorage.js` — tenant helper migration
- `src/utils/adminNotificationStorage.js` — tenant helper migration
