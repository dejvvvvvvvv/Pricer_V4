---
id: UPRAVY-SEC-W4-7
session: S25
date: 2026-03-13
type: UPRAVY
---

# Security Fixes Waves 4-7 — 2026-03-13

## Wave 4 — Prototype Pollution Prevention
- NEW: `src/utils/sanitizeJson.js` — `stripDangerousKeys()` + `safeJsonParse()`
- AdminPresets.jsx: 2x JSON.parse → safeJsonParse (share string + file import)
- AdminPricing.jsx: 1x JSON.parse → safeJsonParse (config import)
- AdminParameters.jsx: 1x JSON.parse → safeJsonParse (file import)
- ConfigBackupRestore.jsx: 1x JSON.parse → safeJsonParse (backup file import)

## Wave 5 — localStorage Abstraction & Tenant Isolation
- adminTenantStorage.js: Added `deleteTenantJson()` + `clearAllTenantData()`
- BuilderPage.jsx: Direct localStorage → readTenantJson()
- OnboardingOverlay.jsx: Direct localStorage → writeTenantJson()
- AdminIntegrations.jsx: Direct localStorage → writeTenantJson()
- AdminSettings.jsx: Direct localStorage → deleteTenantJson() + clearAllTenantData()

## Wave 6 — window.confirm, Coupons, Audit Trail, Cross-Tenant
- AdminCoupons.jsx: Percent validation clamped to 0-100
- 7x window.confirm → ForgeConfirmDialog (AdminAnalytics, AdminMigration, AdminPricing, AdminWidget)
- 8 files: Hardcoded 'admin' user_id → authUser?.email from AuthContext
- AdminSystemHealth.jsx: 3 localStorage loops scoped to current tenant only
- adminBrandingWidgetStorage.js: getWidgetByPublicId() accepts scopeTenantId param

## Wave 7 — SVG, Info Disclosure, Role Enforcement
- sanitizeHtml.js: Added `sanitizeSvg()` — strips script, foreignObject, on* handlers, dangerous URIs
- AdminBranding.jsx: SVG uploads sanitized before storage, invalid SVGs rejected
- AdminSystemHealth.jsx: Removed VITE_API_URL exposure from environment info
- AdminTeamAccess.jsx + AdminLayout.jsx: SECURITY TODO comments + requiredPermission nav metadata

## Soubory zmenene/vytvorene
- src/utils/sanitizeJson.js (NEW)
- src/utils/sanitizeHtml.js (sanitizeSvg added)
- src/utils/adminTenantStorage.js (deleteTenantJson, clearAllTenantData)
- src/utils/adminBrandingWidgetStorage.js (scoped widget lookup)
- src/pages/admin/AdminPresets.jsx
- src/pages/admin/AdminPricing.jsx
- src/pages/admin/AdminParameters.jsx
- src/pages/admin/AdminBranding.jsx
- src/pages/admin/AdminCoupons.jsx
- src/pages/admin/AdminAnalytics.jsx
- src/pages/admin/AdminMigration.jsx
- src/pages/admin/AdminWidget.jsx
- src/pages/admin/AdminSystemHealth.jsx
- src/pages/admin/AdminSettings.jsx
- src/pages/admin/AdminIntegrations.jsx
- src/pages/admin/AdminTeamAccess.jsx
- src/pages/admin/AdminLayout.jsx
- src/pages/admin/AdminOrderDetail.jsx
- src/pages/admin/AdminOrders.jsx
- src/pages/admin/AdminBranding.jsx
- src/pages/admin/builder/BuilderPage.jsx
- src/pages/admin/builder/components/OnboardingOverlay.jsx
- src/pages/admin/components/ConfigBackupRestore.jsx
- src/pages/admin/components/OrderExportActions.jsx
- src/pages/admin/components/orders/TabCustomer.jsx
- src/pages/admin/components/orders/QuickOrderForm.jsx
- src/pages/admin/components/orders/PrintQueue.jsx
