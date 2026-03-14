---
id: UPRAVY-SEC-W3
session: S25
date: 2026-03-13
type: UPRAVY
---

# Security Fixes Wave 3 — 2026-03-13

## Supabase Database Setup (completed earlier in session)
- 36 tables with RLS, 135 policies
- 3 storage buckets with size limits
- Auto-seed trigger for new tenants
- INSERT WITH CHECK on all tables

## Security Fixes Completed

### Wave 1 — Auth & Tenant Isolation
- AdminLayout.jsx: Auth guard (useAuth unconditional, redirect to /login)
- adminTenantStorage.js: getTenantId returns null instead of 'demo-tenant', new getTenantIdOrThrow()

### Wave 2 — XSS, Sandbox, CSV Injection, SSRF
- sanitizeHtml.js: New DOM-based HTML sanitizer (allowlist tags/attrs)
- AdminOrderDetail.jsx, OrderExportActions.jsx: XSS fix (sanitizeHtmlAllowBasic)
- AdminEmails.jsx: Sanitization at template load
- EmailTemplatePreview.jsx: sandbox="" (removed allow-same-origin)
- WidgetEmbedTab.jsx: Removed allow-same-origin from sandbox
- exportData.js, adminAnalyticsStorage.js: CSV formula injection prevention
- webhookService.js: SSRF prevention (isPrivateUrl blocking RFC 1918)

### Wave 3 — Math.random Replacement
- 15 files: Math.random() → crypto.randomUUID() / crypto.getRandomValues()
- Files: AdminPresets, AdminFees, AdminExpress, AdminPricing, AdminShipping, AdminCoupons, blockLibrary, emailSendLog, adminCouponStorage, adminEmailStorage, adminEcommerceStorage, adminBrandingWidgetStorage, adminOrderTagsStorage, adminNotificationStorage, generateId

### Wave 4 — Research Phase (in progress)
- Path traversal: ALREADY PROTECTED (sanitizePath + assertWithinRoot)
- Prototype pollution: 4 files identified (AdminPresets, AdminPricing, AdminParameters, ConfigBackupRestore)
- Direct localStorage: 4 P1 abstraction leaks identified (BuilderPage, OnboardingOverlay, AdminIntegrations, AdminSettings)

## Soubory zmenene
- src/utils/sanitizeHtml.js (NEW)
- src/utils/adminTenantStorage.js
- src/pages/admin/AdminLayout.jsx
- src/pages/admin/AdminOrderDetail.jsx
- src/pages/admin/AdminEmails.jsx
- src/pages/admin/AdminExpress.jsx
- src/pages/admin/AdminPricing.jsx
- src/pages/admin/AdminPresets.jsx
- src/pages/admin/AdminFees.jsx
- src/pages/admin/AdminShipping.jsx
- src/pages/admin/AdminCoupons.jsx
- src/pages/admin/components/orders/OrderExportActions.jsx
- src/pages/admin/components/EmailTemplatePreview.jsx
- src/pages/admin/components/WidgetEmbedTab.jsx
- src/utils/exportData.js
- src/utils/adminAnalyticsStorage.js
- backend-local/src/services/webhookService.js
- + 15 files with Math.random fix
