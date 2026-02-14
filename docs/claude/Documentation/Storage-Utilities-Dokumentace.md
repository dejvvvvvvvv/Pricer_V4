# Storage Utilities -- Dokumentace

> 16 tenant-scoped localStorage helperu s Supabase dual-write podporou.
> Jediny zdroj pravdy pro admin konfiguraci v ModelPricer / Pricer V3.

---

## 1. Prehled

Storage Utilities tvoreni vrstvu mezi UI komponentami a persistentnim ulozistem (localStorage + volitelne Supabase). Kazdy storage helper:

- Cte/pise data pod tenant-scoped namespace klicem
- Normalizuje data pri cteni (graceful fallback na defaults)
- Pise idempotentne (normalizace pred zapisem)
- Volitelne migruje legacy klice z predchozich verzi
- Podporuje Supabase dual-write (fire-and-forget z pohledu sync API)

**Pocet souboru:** 16 storage helperu + 3 Supabase infrastrukturni moduly (celkem 19 souboru).

**Pocet namespaces:** 20 (viz featureFlags.js ALL_NAMESPACES).

---

## 2. Technologie

| Technologie | Pouziti |
|-------------|---------|
| JavaScript (ES Modules) | Vsechny storage helpery |
| `window.localStorage` | Primarni uloziste (sync) |
| `JSON.stringify` / `JSON.parse` | Serializace/deserializace |
| `@supabase/supabase-js` | Volitelny async backend (Phase 4) |
| Feature Flags (localStorage) | Per-namespace prepinac localStorage/supabase/dual-write |

**Runtime:** Browser (localStorage API). Non-browser kontext je bezpecne zachycen (`canUseLocalStorage()` guard).

---

## 3. Architektura (vsechny storage soubory)

### 3.1 Soubory a jejich namespace

| # | Soubor | Namespace(s) | Schema Ver | Popis |
|---|--------|-------------|------------|-------|
| 1 | `adminTenantStorage.js` | (zakladni vrstva) | -- | Centralni entrypoint, read/write/append, async API |
| 2 | `adminPricingStorage.js` | `pricing:v3` | 3 | Materialy, cas, zaokrouhleni, markup, volume discounts |
| 3 | `adminFeesStorage.js` | `fees:v3` | 3 | Poplatky (flat, per_gram, percent, ...), podminky |
| 4 | `adminOrdersStorage.js` | `orders:v1`, `orders:activity:v1` | 1 | Objednavky, seed data, activity log |
| 5 | `adminDashboardStorage.js` | `dashboard:v1`, `dashboard:v2` | 2 | Dashboard konfigurace, grid layout, KPI karty |
| 6 | `adminFormStorage.js` | `form:v1` | 1 | Checkout formular, povinne/nepovinne pole, GDPR |
| 7 | `adminExpressStorage.js` | `express:v1` | 1 | Express delivery tiers, surcharge, upsell |
| 8 | `adminShippingStorage.js` | `shipping:v1` | 1 | Metody dopravy (FIXED, WEIGHT_BASED, PICKUP) |
| 9 | `adminKanbanStorage.js` | `kanban:v1` | 1 | Kanban sloupce, WIP limity, barvy |
| 10 | `adminEmailStorage.js` | `email:v1` | 1 | Email notifikace, triggery, sablony |
| 11 | `adminCouponsStorage.js` | `coupons:v1` | 1 | Kupony, promokce, stacking rules |
| 12 | `adminAuditLogStorage.js` | `audit_log` | -- | Audit log (2000 entries retention) |
| 13 | `adminAnalyticsStorage.js` | `analytics:events` | -- | Analytika, eventy, sessions, CSV export |
| 14 | `adminTeamAccessStorage.js` | `team_users`, `team_invites` | -- | Tym, pozvani, seat limity, role |
| 15 | `adminBrandingWidgetStorage.js` | `branding`, `widgets`, `plan_features` | -- | Branding, widget instance, plan gating |
| 16 | `widgetThemeStorage.js` | `widget_theme` | -- | Widget CSS theme (56 vlastnosti), CSS vars |

### 3.2 Supabase infrastruktura

| Soubor | Cesta | Popis |
|--------|-------|-------|
| `featureFlags.js` | `src/lib/supabase/featureFlags.js` | Per-namespace mode: localStorage/supabase/dual-write |
| `storageAdapter.js` | `src/lib/supabase/storageAdapter.js` | Abstrakce read/write/append pres oba backendy |
| `client.js` | `src/lib/supabase/client.js` | Supabase klient + `isSupabaseAvailable()` |

### 3.3 Absolutni cesty

Vsechny storage helpery:
```
Model_Pricer-V2-main/src/utils/adminTenantStorage.js
Model_Pricer-V2-main/src/utils/adminPricingStorage.js
Model_Pricer-V2-main/src/utils/adminFeesStorage.js
Model_Pricer-V2-main/src/utils/adminOrdersStorage.js
Model_Pricer-V2-main/src/utils/adminDashboardStorage.js
Model_Pricer-V2-main/src/utils/adminFormStorage.js
Model_Pricer-V2-main/src/utils/adminExpressStorage.js
Model_Pricer-V2-main/src/utils/adminShippingStorage.js
Model_Pricer-V2-main/src/utils/adminKanbanStorage.js
Model_Pricer-V2-main/src/utils/adminEmailStorage.js
Model_Pricer-V2-main/src/utils/adminCouponsStorage.js
Model_Pricer-V2-main/src/utils/adminAuditLogStorage.js
Model_Pricer-V2-main/src/utils/adminAnalyticsStorage.js
Model_Pricer-V2-main/src/utils/adminTeamAccessStorage.js
Model_Pricer-V2-main/src/utils/adminBrandingWidgetStorage.js
Model_Pricer-V2-main/src/utils/widgetThemeStorage.js
```

Supabase vrstva:
```
Model_Pricer-V2-main/src/lib/supabase/featureFlags.js
Model_Pricer-V2-main/src/lib/supabase/storageAdapter.js
Model_Pricer-V2-main/src/lib/supabase/client.js
```

---

## 4. Import graf

```
                          featureFlags.js
                               |
                          storageAdapter.js  <--  client.js (supabase)
                               |
                     adminTenantStorage.js
                          /    |     \
                         /     |      \
    +-----------+-------+------+-------+--------+---------+
    |           |       |      |       |        |         |
 Pricing    Fees   Orders  Dashboard  Form   Express  Shipping
    |                                  |
    |                            Kanban  Email  Coupons
    |
    +--- (normalizePricingConfigForEngine -- konzumovano pricing engine)

    Samostatne (primo localStorage + Supabase fire-and-forget):
    +-----------+-----------+-----------+-----------+
    |           |           |           |           |
 AuditLog  Analytics  TeamAccess  Branding   WidgetTheme
                         |          |
                         +-- getPlanFeatures (plan gating)
```

**Skupina A** (pouziva `readTenantJson`/`writeTenantJson` z adminTenantStorage):
- adminPricingStorage, adminFeesStorage, adminOrdersStorage, adminDashboardStorage
- adminFormStorage, adminExpressStorage, adminShippingStorage, adminKanbanStorage
- adminEmailStorage, adminCouponsStorage

**Skupina B** (vlastni localStorage klice + explicitni Supabase fire-and-forget):
- adminAuditLogStorage, adminAnalyticsStorage, adminTeamAccessStorage
- adminBrandingWidgetStorage, widgetThemeStorage

---

## 6. Datovy model (namespace schema, key patterns)

### 6.1 Key pattern -- Skupina A (pres adminTenantStorage)

```
modelpricer:{tenantId}:{namespace}
```

Priklady:
```
modelpricer:demo-tenant:pricing:v3
modelpricer:demo-tenant:fees:v3
modelpricer:demo-tenant:orders:v1
modelpricer:demo-tenant:orders:activity:v1
modelpricer:demo-tenant:dashboard:v2
modelpricer:demo-tenant:form:v1
modelpricer:demo-tenant:express:v1
modelpricer:demo-tenant:shipping:v1
modelpricer:demo-tenant:kanban:v1
modelpricer:demo-tenant:email:v1
modelpricer:demo-tenant:coupons:v1
```

### 6.2 Key pattern -- Skupina B (vlastni klice)

```
modelpricer:{tenantId}:audit_log                      -- Audit log
modelpricer:demo-tenant:analytics:events              -- Analytics (hardcoded demo-tenant prefix)
modelpricer:{tenantId}:team_users                     -- Team uzivatele
modelpricer:{tenantId}:team_invites                   -- Team pozvani
modelpricer_branding__{tenantId}                      -- Branding (legacy pattern)
modelpricer_widgets__{tenantId}                       -- Widget instance (legacy pattern)
modelpricer_plan_features__{tenantId}                 -- Plan features (legacy pattern)
modelpricer:widget_theme:{tenantId}                   -- Widget theme
```

### 6.3 Tenant ID zdroj

```javascript
// Jediny spravny zpusob ziskani tenant ID:
import { getTenantId } from './adminTenantStorage';

// Implementace:
// 1. Zkontroluje canUseLocalStorage()
// 2. Cte localStorage klic: 'modelpricer:tenant_id'
// 3. Fallback: 'demo-tenant'
```

### 6.4 Feature flags klic

```
modelpricer:feature_flags:storage_modes
```

Hodnota: JSON objekt `{ "pricing:v3": "localStorage", "fees:v3": "dual-write", ... }`

### 6.5 Namespace -> Supabase table mapovani

| Namespace | Supabase Table |
|-----------|---------------|
| `pricing:v3` | `pricing_configs` |
| `fees:v3` | `fees` |
| `orders:v1` | `orders` |
| `orders:activity:v1` | `order_activity` |
| `shipping:v1` | `shipping_methods` |
| `coupons:v1` | `coupons` |
| `express:v1` | `express_tiers` |
| `form:v1` | `form_configs` |
| `email:v1` | `email_templates` |
| `kanban:v1` | `kanban_configs` |
| `dashboard:v1` | `dashboard_configs` |
| `dashboard:v2` | `dashboard_configs` |
| `audit_log` | `audit_log` |
| `analytics:events` | `analytics_events` |
| `team_users` | `team_members` |
| `team_invites` | `team_members` |
| `branding` | `branding` |
| `widgets` | `widget_configs` |
| `plan_features` | `tenants` |
| `widget_theme` | `widget_configs` |

---

## 8. API -- kazdy helper

### 8.1 adminTenantStorage.js (centralni entrypoint)

**Cesta:** `Model_Pricer-V2-main/src/utils/adminTenantStorage.js`

#### Sync API (backward compatible)

```javascript
// Ziskani tenant ID
getTenantId(): string
// Vraci: localStorage 'modelpricer:tenant_id' || 'demo-tenant'

// Cteni
readTenantJson(namespace: string, fallback: any): any
// Klic: modelpricer:{tenantId}:{namespace}
// Fallback: pri chybe parse nebo prazdnem klici
// VZDY synchronni, VZDY cte z localStorage

// Zapis
writeTenantJson(namespace: string, value: any): void
// VZDY pise localStorage (i v 'supabase' modu!)
// Pokud je Supabase povoleny: fire-and-forget async zapis
// Mode check: getStorageMode(namespace) === 'supabase' || 'dual-write'

// Append do log pole
appendTenantLog(namespace: string, entry: object, maxItems?: number): array
// Prepend entry na zacatek pole, orizne na maxItems (default 100)
// Supabase: fire-and-forget INSERT (ne upsert)
```

#### Async API (pro novy kod / migrace)

```javascript
// Async cteni
readTenantJsonAsync(namespace: string, fallback: any): Promise<any>
// V 'localStorage' modu: cte localStorage
// V 'dual-write' modu: cte Supabase, fallback na localStorage
// V 'supabase' modu: cte jen Supabase

// Async zapis
writeTenantJsonAsync(namespace: string, value: any): Promise<void>
// Respektuje feature flags
// V 'localStorage': pise jen localStorage
// V 'dual-write': pise OBA
// V 'supabase': pise jen Supabase

// Async append
appendTenantLogAsync(namespace: string, entry: object, maxItems?: number): Promise<void>
// Deleguje na storageAdapter.appendLog
```

### 8.2 adminPricingStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminPricingStorage.js`
**Namespace:** `pricing:v3` | **Schema version:** 3

```javascript
// Cteni (s legacy migraci + normalizaci + writeback)
loadPricingConfigV3(): PricingConfigV3
// 1. Cte readTenantJson('pricing:v3')
// 2. Pokud existuje: normalizuje + writeback chybejicich poli
// 3. Pokud neexistuje: pokusi se migrovat legacy klice
// 4. Pokud nic: seed defaults

// Zapis (vzdy normalizuje)
savePricingConfigV3(config: object): PricingConfigV3

// Normalizace (pouzitelne samostatne)
normalizePricingConfigV3(input: object): PricingConfigV3
normalizePricingConfigForEngine(input: object): PricingConfigV3

// Defaults
getDefaultPricingConfigV3(): PricingConfigV3

// Utility
normalizeMaterialKey(key: string): string
getColorEffectivePrice(material: object, colorId: string): number
```

**PricingConfigV3 schema:**
```javascript
{
  schema_version: 3,
  materials: [{ id, key, name, enabled, price_per_gram, colors: [{id, name, hex, price_per_gram}] }],
  default_material_key: 'pla',
  materialPrices: { pla: 0.6 },          // legacy compat
  timeRate: 150,                          // legacy compat
  tenant_pricing: {
    rate_per_hour, min_billed_minutes_enabled, min_billed_minutes_value,
    min_price_per_model_enabled, min_price_per_model_value,
    min_order_total_enabled, min_order_total_value,
    rounding_enabled, rounding_step, rounding_mode, smart_rounding_enabled,
    markup_enabled, markup_mode, markup_value, markup_min_flat,
  },
  volume_discounts: { enabled, mode, scope, tiers: [{min_qty, value, label}] },
  // Engine root fields (duplikovano pro pricingEngineV3):
  rate_per_hour, minimum_billed_minutes, minimum_price_per_model,
  minimum_order_total, rounding: {enabled, step, mode, smart_rounding_enabled},
  markup: {enabled, mode, value, min_flat},
  updated_at: ISO string,
}
```

**Legacy migrace:**
- `modelpricer_pricing_config__test-customer-1`
- `admin_pricing_demo_v2:test-customer-1`

### 8.3 adminFeesStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminFeesStorage.js`
**Namespace:** `fees:v3` | **Schema version:** 3

```javascript
loadFeesConfigV3(): FeesConfigV3
saveFeesConfigV3(data: object): FeesConfigV3
normalizeFeesConfigV3(input: object): FeesConfigV3
getDefaultFeesConfigV3(): FeesConfigV3
migrateLegacyFeesToV3(): { migrated, source, data, notes }
```

**Fee types:** `flat`, `per_gram`, `per_minute`, `percent`, `per_cm3`, `per_cm2`, `per_piece`
**Fee scope:** `MODEL` | `ORDER`
**Charge basis:** `PER_PIECE` | `PER_FILE`

**Legacy migrace:**
- `modelpricer_fees_config__{customerId}` (auto-detect z localStorage)

### 8.4 adminOrdersStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminOrdersStorage.js`
**Namespace:** `orders:v1`, `orders:activity:v1`

```javascript
ensureOrdersSeeded(): void         // Seed 28 demo objednavek pokud prazdne
loadOrders(): Order[]              // Deep clone
saveOrders(orders: Order[]): void
appendOrderActivity(orderId: string, entry: object): void

// Utility
computeOrderTotals(order): Totals
extractOrderMaterials(order): string[]
extractOrderPresets(order): string[]
collectOrderFlags(order): string[]
getStatusLabel(status, language): string
getFlagLabel(flag, language): string
getOrderStoragePath(order): string|null
getOrderStorageStatus(order): string
round2(n): number
nowIso(): string
```

**Statusy:** `NEW`, `REVIEW`, `APPROVED`, `PRINTING`, `POSTPROCESS`, `READY`, `SHIPPED`, `DONE`, `CANCELED`
**Flagy:** `OUT_OF_BOUNDS`, `SLICER_FAILED`, `MISSING_SLICER_DATA`, `INVALID_CONFIG`

### 8.5 adminDashboardStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminDashboardStorage.js`
**Namespace:** `dashboard:v2` (s migraci z `dashboard:v1`)

```javascript
loadDashboardConfig(): DashboardConfigV2     // V1->V2 migrace
saveDashboardConfig(config): DashboardConfigV2
resetDashboardConfig(): DashboardConfigV2
buildDefaultDashboardConfig(): DashboardConfigV2
```

**Migrace:** V1 (bez grid layout) -> V2 (s grid layout, card positions)

### 8.6 adminFormStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminFormStorage.js`
**Namespace:** `form:v1`

```javascript
loadFormConfig(): FormConfig
saveFormConfig(config): FormConfig
getDefaultFormConfig(): FormConfig
```

**Schema:** `required_fields`, `optional_fields`, `gdpr_text` (cs/en), `company_field_visible`

### 8.7 adminExpressStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminExpressStorage.js`
**Namespace:** `express:v1`

```javascript
loadExpressConfigV1(): ExpressConfig
saveExpressConfigV1(data): ExpressConfig
normalizeExpressConfigV1(input): ExpressConfig
getDefaultExpressConfigV1(): ExpressConfig
```

**Tier surcharge types:** `percent` | `fixed`

### 8.8 adminShippingStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminShippingStorage.js`
**Namespace:** `shipping:v1`

```javascript
loadShippingConfigV1(): ShippingConfig
saveShippingConfigV1(data): ShippingConfig
normalizeShippingConfigV1(input): ShippingConfig
getDefaultShippingConfigV1(): ShippingConfig
```

**Shipping types:** `FIXED` | `WEIGHT_BASED` | `PICKUP`
**Free shipping:** `free_shipping_enabled`, `free_shipping_threshold`

### 8.9 adminKanbanStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminKanbanStorage.js`
**Namespace:** `kanban:v1`

```javascript
loadKanbanConfigV1(): KanbanConfig
saveKanbanConfigV1(data): KanbanConfig
normalizeKanbanConfigV1(input): KanbanConfig
getDefaultKanbanConfigV1(): KanbanConfig
```

**View modes:** `table` | `kanban`
**Default sloupce:** 8 (new, confirmed, printing, post_processing, ready, shipped, completed, cancelled)

### 8.10 adminEmailStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminEmailStorage.js`
**Namespace:** `email:v1`

```javascript
loadEmailConfigV1(): EmailConfig
saveEmailConfigV1(data): EmailConfig
normalizeEmailConfigV1(input): EmailConfig
getDefaultEmailConfigV1(): EmailConfig
```

**Triggery:** `order_confirmed`, `order_printing`, `order_shipped`, `order_completed`

### 8.11 adminCouponsStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminCouponsStorage.js`
**Namespace:** `coupons:v1`

```javascript
loadCouponsConfigV1(): CouponsConfig
saveCouponsConfigV1(data): CouponsConfig
normalizeCouponsConfigV1(input): CouponsConfig
getDefaultCouponsConfigV1(): CouponsConfig
```

**Coupon types:** `percent`, `fixed`, `free_shipping`
**Promotion types:** `percent`, `fixed`
**Applies to:** `all`, `category`, `specific_models`

### 8.12 adminAuditLogStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminAuditLogStorage.js`
**Klic:** `modelpricer:{tenantId}:audit_log`

```javascript
getAuditEntries(tenantId?): AuditEntry[]
appendAuditEntry(entry, options?): AuditEntry
clearAuditLog(tenantId?): void
filterAuditEntries(entries, filters): AuditEntry[]
searchAuditEntries(entries, filters): AuditEntry[]  // alias
```

**Pozor:** Tento helper pouziva primo `localStorage.getItem`/`setItem` (ne pres adminTenantStorage).
**Retention:** 2000 entries max.
**Supabase:** Explicitni fire-and-forget `storageAdapter.supabase.insert('audit_log', ...)`.

### 8.13 adminAnalyticsStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminAnalyticsStorage.js`
**Klic:** `modelpricer:demo-tenant:analytics:events`

```javascript
trackAnalyticsEvent({ tenantId, widgetInstanceId, sessionId, eventType, timestamp, metadata }): void
getAnalyticsEvents(): Event[]
setAnalyticsEvents(events): void
clearAnalyticsAll(): void
getAnalyticsSessions(): Session[]
buildSessionsFromEvents(events): Session[]
filterSessionsByRange(sessions, { fromISO, toISO }): Session[]
computeOverview({ fromISO, toISO }): OverviewData
findLostSessions({ fromISO, toISO, olderThanMinutes }): Session[]
generateCsv({ type, fromISO, toISO }): string
seedAnalyticsDemo(options): void
ensureDemoAnalyticsSeeded(): void
logExportToAudit({ actor, type, fromISO, toISO }): void
generateSessionId(): string
```

**Event types:** `WIDGET_VIEW`, `MODEL_UPLOAD_STARTED`, `MODEL_UPLOAD_COMPLETED`, `SLICING_STARTED`, `SLICING_COMPLETED`, `PRICE_SHOWN`, `ADD_TO_CART_CLICKED`, `ORDER_CREATED`
**Max events:** 20000
**Pozor:** Pouziva hardcoded `'modelpricer:demo-tenant:analytics'` prefix.

### 8.14 adminTeamAccessStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminTeamAccessStorage.js`
**Klice:** `modelpricer:{tenantId}:team_users`, `modelpricer:{tenantId}:team_invites`

```javascript
// Cteni
getTeamUsers(tenantId?): User[]
getTeamInvites(tenantId?): Invite[]
getTeamSummary(tenantId?): { activeUsers, disabledUsers, pendingInvites, seatLimit }
getSeatLimit(tenantId?): number

// Operace
inviteUser({ email, role, message, expiryDays }, ctx): Result
resendInvite(inviteId, ctx): Result
revokeInvite(inviteId, ctx): Result
acceptInviteByToken(token, ctx): Result
updateUserRole(userId, role, ctx): Result
setUserEnabled(userId, enabled, ctx): Result
removeUser(userId, ctx): Result

// UI aliasy
createInvite     = inviteUser
deleteInvite     = revokeInvite
changeUserRole   = updateUserRole
disableUser(userId, ctx)
enableUser(userId, ctx)
deleteUser       = removeUser
getInviteByToken(token, ctx): Invite | null
acceptInviteToken({ token, name }, ctx): Result
getTenantForTeam(): string
```

**Role:** `admin` | `operator`
**Invite stavy:** `pending`, `accepted`, `expired`, `revoked`
**Auto-expire:** Pri cteni se automaticky oznacuji expirkovane pozvani.

### 8.15 adminBrandingWidgetStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/adminBrandingWidgetStorage.js`
**Klice:** `modelpricer_branding__{tenantId}`, `modelpricer_widgets__{tenantId}`, `modelpricer_plan_features__{tenantId}`

```javascript
// Plan features (gating)
getPlanFeatures(tenantId): PlanFeatures
setPlanFeatures(tenantId, next): PlanFeatures
getDefaultPlanFeatures(): PlanFeatures

// Branding
getBranding(tenantId): Branding
saveBranding(tenantId, brandingInput, updatedBy?): Branding
resetBrandingToDefaults(tenantId): Branding
getDefaultBranding(): Branding

// Widget instance
getWidgets(tenantId): Widget[]
saveWidgets(tenantId, widgets): Widget[]
createWidget(tenantId, input): Widget
duplicateWidget(tenantId, widgetId): Widget
deleteWidget(tenantId, widgetId): Widget[]
toggleWidgetStatus(tenantId, widgetId, status?): Widget
updateWidget(tenantId, widgetId, patch): Widget

// Domain whitelist
getWidgetDomains(tenantId, widgetId): Domain[]
addWidgetDomain(tenantId, widgetId, domain, allowSubdomains?): Domain
toggleWidgetDomain(tenantId, widgetId, domainId, isActive?): Domain
deleteWidgetDomain(tenantId, widgetId, domainId): Domain[]
validateDomainInput(domainInput): { ok, reason?, host? }
isDomainAllowedByWhitelist(hostname, domains): boolean

// Lookup
getWidgetByPublicId(publicWidgetId): { widget, tenantId } | null

// Theme (delegace)
updateWidgetTheme(tenantId, widgetId, themeConfig): Widget
getDefaultWidgetTheme()  // re-export z widgetThemeStorage.js
```

**Plan gating:** `can_hide_powered_by`, `max_widget_instances`, `max_users`, `can_use_domain_whitelist`
**Pozor:** Pouziva legacy key pattern `modelpricer_branding__{tenantId}` (s podtrzitky misto dvojtecky).

### 8.16 widgetThemeStorage.js

**Cesta:** `Model_Pricer-V2-main/src/utils/widgetThemeStorage.js`
**Klic:** `modelpricer:widget_theme:{tenantId}`

```javascript
getWidgetTheme(tenantIdOverride?): WidgetTheme
saveWidgetTheme(themeUpdate, tenantIdOverride?): WidgetTheme
resetWidgetTheme(tenantIdOverride?): WidgetTheme
getDefaultWidgetTheme(): WidgetTheme

// CSS utility
themeToCssVars(theme): { [cssVar: string]: string }
applyThemeToDom(theme, element?): void
themeToInlineStyle(theme): string

// Validace + metadata
isValidHex(color): boolean
THEME_PROPERTIES: PropertyDefinition[]    // 56 vlastnosti
FONT_OPTIONS: { value, label }[]          // 11 fontu
```

**Pocet theme vlastnosti:** 56 (15 originalnich + 41 Widget Builder V3)
**CSS promenne:** 47 (`--widget-*` prefixovane)

---

## 9. Data flow (sync vs async, dual-write)

### 9.1 Sync API (writeTenantJson) -- pouziva Skupina A

```
UI komponenta
  |
  v
writeTenantJson(namespace, value)
  |
  +---> [1] localStorage.setItem(key, JSON.stringify(value))   -- VZDY, sync
  |
  +---> [2] Kontrola: getStorageMode(namespace)
         |
         +-- 'localStorage' --> stop
         |
         +-- 'supabase' || 'dual-write'
               |
               +---> storageAdapter.write(namespace, tenantId, key, value)
                       |
                       +---> fire-and-forget (Promise .catch() log warning)
```

**Dulezite:** `writeTenantJson()` VZDY pise do localStorage, i kdyz je mod nastaven na `'supabase'`. Toto je zamerne pro backward kompatibilitu sync API. Supabase zapis je fire-and-forget -- jeho selhani nemeni navratovou hodnotu.

### 9.2 Async API (writeTenantJsonAsync) -- pro novy kod

```
UI komponenta (await)
  |
  v
writeTenantJsonAsync(namespace, value)
  |
  v
storageAdapter.write(namespace, tenantId, key, value)
  |
  +-- 'localStorage' mod:
  |     localStorage.setItem() -- sync
  |
  +-- 'dual-write' mod:
  |     localStorage.setItem() + supabaseWriteConfig() -- oba
  |
  +-- 'supabase' mod:
        supabaseWriteConfig() -- jen Supabase
```

### 9.3 Read flow (sync vs async)

```
readTenantJson(namespace, fallback)
  --> VZDY localStorage (sync, backward compat)

readTenantJsonAsync(namespace, fallback)
  --> storageAdapter.read()
      --> 'localStorage': localStorage
      --> 'dual-write': Supabase, fallback localStorage
      --> 'supabase': jen Supabase
```

### 9.4 Skupina B -- explicitni Supabase dual-write

Skupina B helperu (audit, analytics, team, branding, widgetTheme) maji vlastni localStorage logiku a explicitne volaji `storageAdapter.supabase.insert()` nebo `storageAdapter.supabase.writeConfig()` jako fire-and-forget. Neprochazi pres `readTenantJson`/`writeTenantJson`.

Priklad (z adminAuditLogStorage.js):
```javascript
// [1] Sync localStorage zapis
localStorage.setItem(AUDIT_KEY(tenantId), JSON.stringify(next));

// [2] Fire-and-forget Supabase
const mode = getStorageMode('audit_log');
if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
  storageAdapter.supabase.insert('audit_log', { ... })
    .catch(err => console.warn(...));
}
```

### 9.5 Feature flag mody

| Mod | localStorage cteni | localStorage zapis | Supabase cteni | Supabase zapis |
|-----|--------------------|--------------------|----------------|----------------|
| `localStorage` (default) | ANO | ANO | NE | NE |
| `dual-write` | fallback | ANO | primarni | ANO |
| `supabase` | NE (async) / ANO (sync) | ANO (sync) / NE (async) | ANO | ANO |

**Pozor k `supabase` modu:** Sync API (`writeTenantJson`) VZDY pise localStorage i v tomto modu. Async API (`writeTenantJsonAsync`) respektuje mod a v `supabase` modu pise JEN do Supabase.

---

## 14. Bezpecnost (tenant izolace)

### 14.1 Klicova pravidla

1. **Kazdy localStorage klic obsahuje tenant ID** -- data jednoho tenanta jsou neviditelna pro jineho
2. **getTenantId() je jediny zdroj** -- nikdy nehardcodit `'demo-tenant'` nebo `'test-customer-1'`
3. **Validace pri cteni** -- kazdy helper normalizuje data a vraci defaults pri nevalidnich datech
4. **Plan gating** -- branding a widget operace kontroluji `getPlanFeatures()` pred povolenim operace
5. **Domain whitelist** -- widget embed kontroluje `isDomainAllowedByWhitelist()` pred renderovanim

### 14.2 Co je zachyceno

| Hrozba | Ochrana |
|--------|---------|
| Cross-tenant data leakage | Namespace klice s tenant ID |
| Corrupt JSON v localStorage | try/catch + graceful fallback |
| Non-browser kontext (SSR) | `canUseLocalStorage()` guard |
| Schema drift (stare verze) | Normalizace pri cteni + writeback |
| Plan bypass (branding) | Server-like enforcement v saveBranding/createWidget |
| Widget embed na nepovolene domene | Domain whitelist validace |

### 14.3 Co NENI zachyceno

| Hrozba | Status |
|--------|--------|
| localStorage pristupny jinym JS na domene | **Zname omezeni** -- localStorage nema izolaci po tenant |
| Tenant ID manipulace v DevTools | **Nechraneno** -- localStorage je klientsky |
| XSS pristup k storage | **Zavisi na celkove XSS ochrane aplikace** |
| Supabase bez RLS v demo | **Nechraneno** v demo modu |

### 14.4 Audit trail

`adminAuditLogStorage.js` zaznamenava:
- Vsechny team operace (invite, role change, enable/disable, remove)
- Analytics exporty
- Kazdy zaznam: `actor`, `action`, `entity_type`, `entity_id`, `timestamp`, `ip_address`, `user_agent`, `summary`, `diff`

---

## 17. Zname omezeni

### 17.1 localStorage limity

- **Kapacita:** ~5-10 MB na domenu (browser-specific)
- **Synchronni API:** Blokuje main thread pri velkem JSON parse
- **Zadna izolace** mezi tenaty na stejne domene (klientsky pristup)
- **Zadne TTL/expirace** -- data zustavaji dokud nejsou explicitne smazana

### 17.2 Analytics hardcoded prefix

`adminAnalyticsStorage.js` pouziva hardcoded `'modelpricer:demo-tenant:analytics'` misto dynamickeho tenant ID. To znamena ze analytika v multi-tenant prostredi sdili data.

### 17.3 Branding legacy key pattern

`adminBrandingWidgetStorage.js` pouziva `modelpricer_branding__{tenantId}` (s podtrzitky) misto standardniho `modelpricer:{tenantId}:branding` (s dvojteckami). Toto je legacy pattern ktery se lisi od Skupiny A.

### 17.4 Skupina B neprochazi pres adminTenantStorage

5 helperu (audit, analytics, team, branding, widgetTheme) ma vlastni localStorage logiku a neprochazi pres centralni `readTenantJson`/`writeTenantJson`. To znamena:
- Zmeny v adminTenantStorage (napr. novy middleware) se na ne nevztahuji
- Supabase dual-write logika je duplikovana v kazdem helperu

### 17.5 Fire-and-forget Supabase

Sync API (`writeTenantJson`) pise do Supabase fire-and-forget. To znamena:
- UI nedostane zpetnou vazbu o Supabase selhani
- Data mohou byt nekonzistentni mezi localStorage a Supabase
- Jedine indikace selhani jsou `console.warn` hlasky

### 17.6 readTenantJson neni idempotentni pro vedlejsi efekty

Nektere `load*` funkce (pricing, fees, dashboard, orders) pri cteni provadi:
- Legacy migraci (zapis migrovanych dat)
- Seed defaults (zapis defaultu pokud prazdne)
- Writeback normalizovanych dat

To znamena ze prvni cteni muze mit vedlejsi efekty na localStorage.

### 17.7 Zadna podpora pro storage events

Helpery neposlouchaji `window.addEventListener('storage', ...)`. Zmeny v localStorage z jineho tabu/okna se nepropaguji do aktualni session bez manualni obnovy.

### 17.8 Tenant ID fallback

`getTenantId()` vraci `'demo-tenant'` pokud klic `modelpricer:tenant_id` neexistuje. V produkci musi byt nastaveny skutecny tenant ID (napr. z auth kontextu).

---

> **Vlastnik:** `mp-mid-storage-tenant` (SINGLE OWNER pro `src/utils/admin*Storage.js`)
> **Eskalace:** `mp-sr-storage`
> **Konzumenti:** `mp-mid-frontend-admin`, `mp-mid-frontend-widget`
> **Posledni aktualizace:** 2026-02-13
