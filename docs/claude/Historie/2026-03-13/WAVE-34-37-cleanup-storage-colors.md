# Waves 34-37 — Cleanup, Storage Migration, Colors (2026-03-13)

## Session: Audit Fix Marathon (pokracovani)

### Wave 34 — Final P0 Fixes
- **AdminParameters.jsx:** 2x alert() nahrazeny auto-dismiss error bannerem (4s timeout, role="alert", Forge tokeny)
- **AdminWebhooks.jsx:** console.log potvrzen jako example kod v JSX template — pridan komentar

### Wave 35 — Storage Migration + Colors Batch 1
#### Storage migrace (3 soubory):
- **adminBrandingWidgetStorage.js:** Migrace na readTenantJson/writeTenantJson, namespace branding:v1, widgets:v1, plan_features:v1. Legacy migracni funkce volana z AdminLayout.
- **widgetThemeStorage.js:** Migrace na widget_theme:v1 namespace, legacy key migrace
- **adminEcommerceStorage.js:** Migrace na ecommerce:v1 namespace

#### Forge token nahrazeni (batch 1):
- **AdminActivityLog.jsx:** 13 hardcoded barev → Forge tokeny
- **AdminWebhooks.jsx:** 8 hardcoded barev → Forge tokeny

### Wave 36 — Colors Batch 2
Celkem 30+ nahrazeni hardcoded barev:
- **AdminOrderDetail.jsx:** 14 nahrazeni
- **AdminCustomers.jsx:** 4 nahrazeni
- **AdminTeamAccess.jsx:** 7 nahrazeni
- **AdminCoupons.jsx:** 2 nahrazeni
- **AnalyticsCharts.jsx:** 3 nahrazeni (tooltip styl)
- **WidgetEmbedTab.jsx:** 1 nahrazeni
- **AdminIntegrations.jsx:** 3 nahrazeni
- **AdminWidget.jsx:** 2 nahrazeni
- **AdminBranding.jsx:** 1 nahrazeni
- **TabShipping.jsx:** 2 nahrazeni
- **EmailTemplatePreview.jsx:** 3 nahrazeni (CSS, ne email HTML)

### Wave 37 — Console Cleanup
- Audit nalezl 8 P1 console.warn/error → debug() v:
  - adminTenantStorage.js, adminFeesStorage.js, featureFlags.js, test-kalkulacka/index.jsx
- Opravy provedeny (nebo v procesu)

### Build Status
- npm run build: PASS po kazde vlne
- Chunk size warning 2424 kB (znamy, pre-existing)

### Statistiky
- 3 legacy storage soubory migrovany na modern API
- 50+ hardcoded barev nahrazeno Forge tokeny
- Vsechny P0 z auditu opraveny
