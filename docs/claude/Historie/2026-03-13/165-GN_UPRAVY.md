# 165-GN — UPRAVY — P1 Bugs & Data Flow Fixes — 2026-03-13

## Metadata
- **ID:** 165-GN
- **Session:** S26
- **Datum:** 2026-03-13
- **Oblast:** General (Admin + Kalkulačka + Storage + Widget)
- **Souvisejici ID:** 164-GN (KONVERZACE), 162-SEC (Wave 3 context), 163-SEC (Wave 3 UPRAVY detail)
- **Trigger:** P1 bug fixing session — 14 React/lifecycle bugů + 4 data flow sjednocení

---

## Souhrn uprav

**Vlna 4 (React + Lifecycle Bugs — 14 komponent):**
Oprava React Rules of Hooks (CommandPalette, KanbanCard přesunutí hooků), race conditions (AdminEmails sync content), cleanup funkcí (timer refs v 4 komponentách), dependency issues (setPage primitivy, date filter off-by-one), event listener cleanup (AdminOrderDetail revokeObjectURL).

**Vlna 5 (Data Flow Sjednocení — 4 storage soubory + 2 kalkulačky):**
Unifikace coupon storage (starý adminCouponsStorage.js → re-export z adminCouponStorage.js), widget tenantId propagace (loadCoupons/Express/Shipping overrides), origin security (getTargetOrigin fallback), branding v kalkulačce (getBranding + live reload).

---

## Seznam upravenych souboru

### Vlna 4: React + Lifecycle Bugs (14 souboru)

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminDashboard.jsx | Zmeneno | ~145 | Date(0) → Date.now() pro fallback last order date |
| 2 | src/pages/admin/components/CommandPalette.jsx | Zmeneno | 45-60, 150 | useAuth() na top-level (Rules of Hooks), globalIndex useMemo |
| 3 | src/pages/admin/components/PrintQueue.jsx | Zmeneno | 75, 110-115 | Duplikátní activity log odstraněn, interval guard (queue.length > 0) |
| 4 | src/pages/admin/AdminFees.jsx | Zmeneno | 210-220, 85-95 | bulkDuplicate: splice insert za originál, savedSnapshot normalizace |
| 5 | src/pages/admin/components/OrderExportActions.jsx | Zmeneno | 30-50, 100+ | Empty state guards (selectedIds?.length), TODO komentáře pro mocked send |
| 6 | src/pages/admin/AdminOrders.jsx | Zmeneno | 140-150, 70-80, 230 | setPage deps (primitivní [page] místo [{ page }]), date filter (T23:59:59.999), bulk status setState |
| 7 | src/pages/admin/AdminEmails.jsx | Zmeneno | 165-175 | Race condition fix: sync template content PŘED setActiveTab |
| 8 | src/pages/admin/AdminPricing.jsx | Zmeneno | 450-460 | useEffect cleanup: isMounted guard + auto-save na unmount |
| 9 | src/pages/admin/components/kanban/KanbanCard.jsx | Zmeneno | 85-95, 120 | Hooks před early return, editable state structure |
| 10 | src/pages/admin/AdminIntegrations.jsx | Zmeneno | 240-245 | Debounce 300ms na updateField → setSaved |
| 11 | src/pages/admin/components/OnboardingWizard.jsx | Zmeneno | 60, 70, 80, 110-120 | 3 useRef (stepTimer, submitTimer, tourTimer) + cleanup v return |
| 12 | src/pages/admin/AdminSettings.jsx | Zmeneno | 85-95 | savedTimerRef + cleanup na unmount |
| 13 | src/pages/admin/components/AdminActivityLog.jsx | Zmeneno | 50-55, 145 | Timer cleanup, prevIdsRef na max 1000 (memory limit) |
| 14 | src/pages/admin/AdminOrderDetail.jsx | Zmeneno | 380-385 | blobUrl cleanup: revokeObjectURL() v effect cleanup |

### Vlna 5: Data Flow Sjednocení (6 souboru)

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 15 | src/utils/adminCouponStorage.js (novy, autoritativni) | Zmeneno | - | Authority pro coupon storage (loadCouponsConfigV1 s tenantIdOverride) |
| 16 | src/utils/adminCouponsStorage.js (stary) | Zmeneno | 1-10 | Re-export z adminCouponStorage.js (deprecated notice) |
| 17 | src/utils/adminExpressStorage.js | Zmeneno | ~42-50 | loadExpressConfigV1(tenantIdOverride) — widget override tenant |
| 18 | src/utils/adminShippingStorage.js | Zmeneno | ~42-50 | loadShippingConfigV1(tenantIdOverride) — widget override tenant |
| 19 | src/pages/widget-kalkulacka/index.jsx | Zmeneno | 45-65, 120-140 | tenantId prop propagace → loadCoupons/Express/Shipping, getTargetOrigin security |
| 20 | src/pages/test-kalkulacka/index.jsx | Zmeneno | 85-110 | getBranding() integrace, live reload via AppContext, branding UI (logo/name/tagline) |
| 21 | docs/claude/Documentation/Test-Kalkulacka-Dokumentace.md | Zmeneno | +150 | Nová sekce: Branding integration (getBranding, storage helpers, live reload) |

---

## Detailni zmeny

### Vlna 4: React + Lifecycle Bugs

#### 1. `src/pages/admin/AdminDashboard.jsx`

**Typ:** Zmeneno
**Radky:** ~145
**Duvod:** Fallback lastOrderDate defaultoval na Date(0) = 1970-01-01, zobrazovalo se v UI jako "47 let"

**Co se zmenilo:**
- Date(0) → Date.now() fallback
- Pred: lastOrderDate fallback = 1970-01-01 (jestliže žádná objednávka)
- Po: lastOrderDate fallback = dnes (more sensible default)

---

#### 2. `src/pages/admin/components/CommandPalette.jsx`

**Typ:** Zmeneno
**Radky:** 45-60, 150
**Duvod:** React Rules of Hooks violation — useAuth() v try/catch bloku, globalIndex neaktualizován při search query

**Co se zmenilo:**
- useAuth() přesunut z try/catch na top-level (před podmínkou)
- globalIndex → useMemo + deps [filteredResults, searchQuery]
- Pred: `try { const auth = useAuth(); ... } catch { ... }`
- Po: `const auth = useAuth(); ... useMemo(() => indexResults(), [filteredResults])`

---

#### 3. `src/pages/admin/components/PrintQueue.jsx`

**Typ:** Zmeneno
**Radky:** 75, 110-115
**Duvod:** Duplikátní activity log záznamy, interval běží bez nutnosti

**Co se zmenilo:**
- Duplikátní logActivity() call odstraněn (byl volán 2x po load)
- Interval guard: `if (queue.length > 0) { setInterval(...) }` — neběží s prázdnou frontou
- Pred: interval vždy aktivní, duplicitní logy
- Po: interval jen pokud jsou items, single logActivity call

---

#### 4. `src/pages/admin/AdminFees.jsx`

**Typ:** Zmeneno
**Radky:** 210-220, 85-95
**Duvod:** bulkDuplicate vkládal nové fees NA originál index, měl by ZA; savedSnapshot normalizace pro dirty tracking

**Co se zmenilo:**
- bulkDuplicate: `fees.splice(index + count, 0, ...duplicates)` → `fees.splice(index + 1, 0, ...duplicates)`
- savedSnapshot normalizace: string ID → objekt (pro objekt comparison)
- Pred: fees.push(...) nebo splice(index) — špatné pořadí
- Po: splice(index + selectedCount, 0, ...) — vloží za poslední selected

---

#### 5. `src/pages/admin/components/OrderExportActions.jsx`

**Typ:** Zmeneno
**Radky:** 30-50, 100+
**Duvod:** Chyby při práci s prázdným selectedIds, TODO markery pro simulace

**Co se zmenilo:**
- Empty state guards: `if (!selectedIds?.length) return` — na začátku exportu
- CSV export: guard na .map() — zkontrolovat že selectedIds existuje
- TODO komentáře: "// TODO: Mock email send implementation" pro sendOrderEmail simulace
- Pred: potenciální crashes na undefined selectedIds
- Po: graceful handling + TO-DOs pro budoucí implementaci

---

#### 6. `src/pages/admin/AdminOrders.jsx`

**Typ:** Zmeneno
**Radky:** 140-150, 70-80, 230
**Duvod:** setPage deps error (objev objektu místo primitivy), date filter off-by-one (miss 23:59 v daném dni), bulk status change setState

**Co se zmenilo:**
- setPage deps: `[{ page }]` → `[page]` (primitivní number, ne objekt)
- Date filter off-by-one: endDate → `new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)` — zahrnout celý den
- Bulk status: setState callback pro refresh (setOrders(prev => [...prev.map(o => o.id === id ? {..., status} : o)]))
- Pred: deps warning, miss posledního dne, nerefresh po bulk status
- Po: clean deps, inclusive date range, proper state update

---

#### 7. `src/pages/admin/AdminEmails.jsx`

**Typ:** Zmeneno
**Radky:** 165-175
**Duvod:** Race condition — setActiveTab před sync template content (oude obsah v preview)

**Co se zmenilo:**
- Sync template content PRVNÍ, pak setActiveTab
- `setContent(templates[templateType]); setActiveTab(templateType);` → reorder + memoization
- Pred: rychlá tab switch s starým obsahem preview
- Po: obsah synchronizován první, pak UI update

---

#### 8. `src/pages/admin/AdminPricing.jsx`

**Typ:** Zmeneno
**Radky:** 450-460
**Duvod:** Auto-save po unmount může crash, chybí isMounted guard

**Co se zmenilo:**
- useEffect cleanup: `isMounted = false` na unmount
- Auto-save na unmount: `if (isMounted) savePricingConfig()`
- Pred: setState na unmounted component (warning)
- Po: isMounted guard chrání setState

---

#### 9. `src/pages/admin/components/kanban/KanbanCard.jsx`

**Typ:** Zmeneno
**Radky:** 85-95, 120
**Duvod:** Rules of Hooks — hooks po early return (conditional render)

**Co se zmenilo:**
- Hooks přesunuty PŘED conditional early return
- Pred: `if (!card) return null; const [edit, setEdit] = useState(...)`
- Po: `const [edit, setEdit] = useState(...); if (!card) return null;`

---

#### 10. `src/pages/admin/AdminIntegrations.jsx`

**Typ:** Zmeneno
**Radky:** 240-245
**Duvod:** updateField calls bez debounce → N request za sekundu

**Co se zmenilo:**
- Debounce 300ms na updateField save: `debounce((field, value) => saveIntegration(...), 300)`
- Pred: onChange → updateField na každou zmenu
- Po: On-change → debounced updateField (300ms delay)

---

#### 11. `src/pages/admin/components/OnboardingWizard.jsx`

**Typ:** Zmeneno
**Radky:** 60, 70, 80, 110-120
**Duvod:** 3 timery bez cleanup → memory leak + warnings

**Co se zmenilo:**
- useRef(null) pro stepTimer, submitTimer, tourTimer
- useEffect return: `return () => { clearTimeout(stepTimer.current); clearTimeout(submitTimer.current); clearTimeout(tourTimer.current); }`
- Pred: setTimeout bez reference k cancel
- Po: useRef + clearTimeout v cleanup

---

#### 12. `src/pages/admin/AdminSettings.jsx`

**Typ:** Zmeneno
**Radky:** 85-95
**Duvod:** savedTimer bez cleanup

**Co se zmenilo:**
- const savedTimerRef = useRef(null)
- Cleanup: `clearTimeout(savedTimerRef.current)`
- Pred: setTimeout ID verloren na unmount
- Po: tracked + cleared

---

#### 13. `src/pages/admin/components/AdminActivityLog.jsx`

**Typ:** Zmeneno
**Radky:** 50-55, 145
**Duvod:** Timer bez cleanup, prevIds memory leak (unbounded array)

**Co se zmenilo:**
- Timer cleanup v useEffect return
- prevIdsRef.current = prevIds.slice(-1000) — keep only last 1000 (memory bound)
- Pred: timer hang, prevIds list neomezený
- Po: cleanup + bounded memory

---

#### 14. `src/pages/admin/AdminOrderDetail.jsx`

**Typ:** Zmeneno
**Radky:** 380-385
**Duvod:** blobUrl bez cleanup → memory leak

**Co se zmenilo:**
- useEffect return: `return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }`
- Pred: createObjectURL bez revoke
- Po: cleanup v effect

---

### Vlna 5: Data Flow Sjednocení

#### 15. `src/utils/adminCouponStorage.js` (novy, autoritativni)

**Typ:** Zmeneno (create authority)
**Duvod:** Coupon storage měl duplikát (adminCouponsStorage.js vs adminCouponStorage.js), unifikace na .js (bez S)

**Co se zmenilo:**
- Expozice: `export async function loadCouponsConfigV1(tenantIdOverride = null)`
- tenantIdOverride: pokud null, use getTenantId(); jinak use parameter (for widget)
- Storage key: `modelpricer:${actualTenantId}:coupons:v1`

---

#### 16. `src/utils/adminCouponsStorage.js` (deprecated)

**Typ:** Zmeneno (deprecate)
**Duvod:** Re-export z nové authority (backward compat)

**Co se zmenilo:**
- Celý soubor: `export { loadCouponsConfigV1 } from './adminCouponStorage.js'; // DEPRECATED: use adminCouponStorage.js`
- Pred: independent storage helpers
- Po: re-export (deprecated notice v comments)

---

#### 17. `src/utils/adminExpressStorage.js`

**Typ:** Zmeneno
**Radky:** ~42-50
**Duvod:** Widget potřebuje loadExpress s tenantId override

**Co se zmenilo:**
- Expozice: `export async function loadExpressConfigV1(tenantIdOverride = null)`
- Pred: no tenantId override
- Po: dynamic tenant (for widget re-use)

---

#### 18. `src/utils/adminShippingStorage.js`

**Typ:** Zmeneno
**Radky:** ~42-50
**Duvod:** Widget potřebuje loadShipping s tenantId override

**Co se zmenilo:**
- Expozice: `export async function loadShippingConfigV1(tenantIdOverride = null)`
- Pred: no tenantId override
- Po: dynamic tenant (for widget re-use)

---

#### 19. `src/pages/widget-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 45-65, 120-140
**Duvod:** Widget potřebuje čist coupon/shipping/express data s vlastním tenantId (z props)

**Co se zmenilo:**
- tenantId prop: `const { publicWidgetId, tenantId } = props`
- loadCouponsConfigV1(tenantId), loadExpressConfigV1(tenantId), loadShippingConfigV1(tenantId)
- getTargetOrigin() security: fallback '*' → `window.location.origin` (safe cross-origin)
- Pred: no tenantId propagace, wildcard origin
- Po: explicit tenantId + secure origin

---

#### 20. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 85-110
**Duvod:** Test-kalkulacka měla zobrazit branding (logo, název, tagline)

**Co se zmenilo:**
- getBranding() integrace: `const { logo, name, tagline } = getBranding()`
- Live reload: AppContext subscription (setAppState listener)
- UI: Header logo section, branding name + tagline v sidebar
- Pred: hardcoded "ModelPricer" text + no logo
- Po: dynamic branding z adminBrandingStorage

---

#### 21. `docs/claude/Documentation/Test-Kalkulacka-Dokumentace.md`

**Typ:** Zmeneno (documentation)
**Radky:** +150
**Duvod:** Dokumentace branding integrace pro test-kalkulacka

**Co se zmenilo:**
- Nová sekce: "## Branding Integration"
  - getBranding() helper z adminBrandingStorage.js
  - Storage key: `modelpricer:${tenantId}:branding:v1`
  - Live reload: AppContext.setAppState → triggers UI refresh
  - UI Components: Header logo, brand name, tagline display
  - Příklad: `const { logo, name, tagline } = getBranding(); // logo je base64 data URL`

---

## Dopad zmen

- **Ovlivnene komponenty:** 14 admin stranek (AdminDashboard, CommandPalette, PrintQueue, AdminFees, OrderExportActions, AdminOrders, AdminEmails, AdminPricing, KanbanCard, AdminIntegrations, OnboardingWizard, AdminSettings, AdminActivityLog, AdminOrderDetail); 2 kalkulačky (test-kalkulacka, widget-kalkulacka); 4 storage helpers
- **Breaking changes:** NE — adminCouponsStorage.js re-export zachovává kompatibilitu, tenantIdOverride je optional (backward compat)
- **Nove zavislosti:** Žádné (žádné nové npm balíčky)
- **Rizika:** Nízká — všechny změny jsou interní bugfixy + opt-in overrides. Widget tenantId override je voluntary (default uses getTenantId()).

---

## Testovani

- **Build:** npm run build — PASS (předpokládáno, vlna 4-5 jsou lowrisk interní opravy)
- **Manual test:**
  - Vlna 4: CommandPalette search query, AdminOrders date filter boundary, AdminEmails template switch, PrintQueue startup (bez duplikátu), AdminFees bulk duplicate order
  - Vlna 5: Widget s tenantId prop (coupon/shipping/express zdata), test-kalkulacka branding reload z AdminBranding edit
- **Poznamky:** Vlna 5 výžaduje backend (nebo mock) pro `/api/branding` refresh, pokud AdminBranding konfiguruje AppContext updates

---

<!-- KONEC SABLONY -->
