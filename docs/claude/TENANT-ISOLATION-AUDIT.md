# Tenant Isolation Audit Report

**Datum:** 2026-03-14
**Autor:** mp-mid-storage-tenant (Claude Opus 4.6)
**Scope:** Kompletni audit tenant izolace v cele aplikaci ModelPricer

---

## Executive Summary

Celkovy stav tenant izolace je **solidni** pro frontend localStorage storage helpery a **dobry** pro backend API routes. Identifikovano **4 P0**, **6 P1** a **5 P2** nalezu.

**Hlavni problemy:**
1. Backend email API nema zadnou tenant izolaci (P0)
2. Slicer queue/cache API endpoints nemaji tenant-scoped filtrovani (P1)
3. Widget public route skenuje localStorage vsech tenantu (P1 — design decision, ale riziko)
4. Nektera localStorage pouziti v UI komponentach nejsou tenant-scoped (P2 — UX data, ne business data)

---

## P0 Issues (Critical — Immediate Fix Required)

---

```
ISSUE: [P0] Email API routes nemaji zadnou tenant izolaci
FILE: Model_Pricer-V2-main/backend-local/src/routes/emailRoutes.js:1-41
POPIS: Cely emailRoutes.js modul nepouziva getTenantIdFromReq() ani zadny jiny
  tenant-scoping mechanismus. Endpointy /api/email/templates, /api/email/preview,
  /api/email/send a /api/email/log operuji nad globalnim stavem bez tenant filtrace.
  Jakykoli autentizovany uzivatel vidi email log vsech tenantu a muze posilat emaily
  z kontextu libovolneho tenanta.
FIX: Refaktorovat emailRoutes.js na factory pattern (createEmailRouter({ getTenantIdFromReq }))
  a filtrovat vsechny operace podle tenantId. Email log musi byt tenant-scoped.
```

---

```
ISSUE: [P0] Slicer queue job status pristupny bez tenant validace
FILE: Model_Pricer-V2-main/backend-local/src/index.js:834-842
POPIS: GET /api/slice/queue/:jobId vraci status libovolneho jobu pouze na zaklade jobId.
  Neoveruje ze pozadujici tenant je vlastnikem jobu. Tenant A muze zjistit status jobu
  tenanta B pokud zna (nebo uhodne) jobId.
FIX: Pridat tenant validaci — porovnat req.tenantId s job.tenantId pred vracenim dat.
  Stejny problem je v DELETE /api/slice/queue/:jobId (radek 847-858).
```

---

```
ISSUE: [P0] Slicer queue stats a cache stats jsou globalni (cross-tenant)
FILE: Model_Pricer-V2-main/backend-local/src/routes/slicer.js:134-145 (queue stats)
FILE: Model_Pricer-V2-main/backend-local/src/routes/slicer.js:195-206 (cache stats)
FILE: Model_Pricer-V2-main/backend-local/src/index.js:826-829 (queue stats)
POPIS: GET /api/slicer/queue/stats a GET /api/slicer/cache vraci globalni statistiky
  pres VSECHNY tenanty. Tenant A vidi kolik jobu ma tenant B ve fronte, celkovy hit rate
  cache atd. DELETE /api/slicer/cache (radek 215-236) maze cache vsech tenantu.
  Poznamka: /api/slicer/health je spravne globalni (system endpoint).
FIX: Queue a cache stats filtrovat podle tenantId. Cache clear omezit na tenant scope.
  Alternativne: presunout tyto endpointy do admin-only kontextu s explicitnim oprávnenim.
```

---

```
ISSUE: [P0] Notifications route nemá validaci tenantId proti path traversal
FILE: Model_Pricer-V2-main/backend-local/src/routes/notifications.js:100-102
POPIS: Funkce prefsFilePath() konstruuje cestu z tenantId (path.join(workspaceRoot, "config",
  tenantId, "notifications.json")), ale nevaliduje tenantId proti path traversal znakum
  (../). Config router (config.js) ma validateTenantId() + assertInWorkspace(),
  notifications router ne. V praxi je to castecne mitigovano middleware requireTenant,
  ktery cte tenant z JWT (ne z headeru v prod), ale v dev modu je mozne nastavit
  libovolny x-tenant-id header.
FIX: Pridat validateTenantId() kontrolu (reject znaky . / \) do prefsFilePath(),
  stejne jako to dela config.js.
```

---

## P1 Issues (High — Fix Before Next Release)

---

```
ISSUE: [P1] Widget getWidgetByPublicId() skenuje localStorage vsech tenantu
FILE: Model_Pricer-V2-main/src/utils/adminBrandingWidgetStorage.js:453-495
POPIS: Kdyz je getWidgetByPublicId() volano bez scopeTenantId (public route lookup),
  iteruje VSECHNY localStorage klice a hleda widgety vsech tenantu. To samo o sobe
  neni data leak (vraci jen matchujici widget), ale:
  1. Tenant A muze zjistit existenci widgetu tenanta B (information disclosure)
  2. V localStorage rezimu neexistuje zadna autorizace — kdokoli s pristupem k prohlizeci
     vidi data vsech tenantu co maji klice v localStorage
  Toto je z velke casti design decision pro demo/localStorage rezim.
FIX: V produkci pouzivat Supabase RLS lookup misto localStorage skenu (jak je
  naznaceno v komentari na radku 451). Pro localStorage rezim: zvazit zda je
  toto chovani akceptovatelne.
```

---

```
ISSUE: [P1] Backend getTenantIdFromReq() fallback na "demo-tenant" v produkci
FILE: Model_Pricer-V2-main/backend-local/src/index.js:218-235
POPIS: Funkce getTenantIdFromReq() v index.js ma fallback na "demo-tenant" VCETNE
  produkce (radek 233-234). Pokud z nejakeho duvodu neni tenant resolvnuty, vsechny
  requesty jdou na sdileny "demo-tenant" prostor — data leakage mezi uzivateli
  kteri nemaji nastaveny tenant.
  Srovnej s tenant.js middleware (requireTenant) ktery v prod spravne vraci 403.
  Problem je ze getTenantIdFromReq() v index.js se pouziva i pro routy co nemaji
  requireTenant middleware (napr. /api/widget/presets na radku 253-265).
FIX: V index.js getTenantIdFromReq(): v produkci NIKDY nevracet "demo-tenant".
  Misto toho: throw error nebo vracet null + handler musi zkontrolovat.
```

---

```
ISSUE: [P1] Mesh router ma vlastni getTenantId() s unsafe fallbackem
FILE: Model_Pricer-V2-main/backend-local/src/routes/mesh.js:89-94
POPIS: createMeshRouter() definuje lokalni getTenantId(req) ktera fallbackuje na
  "demo-tenant" bez ohledu na prostredi (dev/prod). Nekontroluje process.env.NODE_ENV.
  Navic mesh endpointy (/api/mesh/*) NEMAJI requireAuth + requireTenant middleware
  (viz index.js — chybi radek app.use("/api/mesh", requireAuth, requireTenant)).
  Mesh repair/analyze jsou CPU-narocne operace pristupne BEZ autentizace.
FIX: 1. Pridat requireAuth + requireTenant na /api/mesh v index.js.
  2. Pouzivat sdilenou getTenantIdFromReq() misto lokalni.
  3. V produkci nikdy fallbackovat na "demo-tenant".
```

---

```
ISSUE: [P1] ConfigBackupRestore pouziva primy localStorage pristup pro legacy klice
FILE: Model_Pricer-V2-main/src/pages/admin/components/ConfigBackupRestore.jsx:138,177
POPIS: Pri exportu/importu backup ConfigBackupRestore.jsx cte a zapisuje primo
  do localStorage pres legacyKey() funkce (radky 138, 177). Tyto operace neprochazi
  resolveAndValidateTenantId() z adminTenantStorage, takze teoreticky mohou
  zapsat data pod spatny tenant ID pokud je tenant_id modifikovan v runtime.
  AUTO_BACKUP_LS_KEY (radek 616, 694, 945) neni tenant-scoped — sdileny mezi tenanty.
FIX: 1. Pro legacy klice pouzit readTenantJson/writeTenantJson s prislusnym namespace.
  2. AUTO_BACKUP_LS_KEY prefixovat tenantId.
```

---

```
ISSUE: [P1] Invoices backend route chybi validace tenantId proti path traversal
FILE: Model_Pricer-V2-main/backend-local/src/routes/invoices.js:82-86
POPIS: invoiceDir() nepouziva validateTenantId() pro kontrolu path traversal znaku
  v tenantId. Sice pouziva assertInWorkspace(), ale jen relativne k invoices/ adresari.
  Pokud by tenantId obsahoval ".." (napr. "../../etc"), assertInWorkspace by mel zachytit,
  ale je to mene robustni nez explicitni validateTenantId() (regex reject).
FIX: Pridat validateTenantId() kontrolu pred path.join, stejne jako config.js.
```

---

```
ISSUE: [P1] PrintConfiguration uklada user presets bez tenant prefixu
FILE: Model_Pricer-V2-main/src/pages/test-kalkulacka/components/PrintConfiguration.jsx:270,281
POPIS: User presets pro tiskarnu se ukladaji do localStorage pod fixnim klicem
  (USER_PRESETS_KEY) bez tenant prefixu. Pokud vice tenantu pouziva stejny prohlizec,
  sdili user presets. Toto je calculator page (ne admin), ale muze vest k data bleedingu.
FIX: Prefixovat USER_PRESETS_KEY tenantId pomoci readTenantJson/writeTenantJson.
```

---

## P2 Issues (Medium — Plan for Future Sprint)

---

```
ISSUE: [P2] useThemeToggle a useAdminTheme ukladaji theme preference globalne
FILE: Model_Pricer-V2-main/src/hooks/useThemeToggle.js:3 (key: 'modelpricer:theme')
FILE: Model_Pricer-V2-main/src/hooks/useAdminTheme.js:25 (key neznamy — necteno uplne)
POPIS: Theme preference (dark/light) se uklada pod globalnim klicem 'modelpricer:theme'
  bez tenant prefixu. Pokud uzivatel spravuje vice tenantu, theme preference je sdilena.
  Toto je UX preference, ne business data — nizka priorita.
FIX: Presunout na tenant-scoped klic nebo ponechat globalni (dokumentovat jako expected).
```

---

```
ISSUE: [P2] useOnboardingTour uklada stav globalne
FILE: Model_Pricer-V2-main/src/hooks/useOnboardingTour.js:4 (key: 'modelpricer:onboarding:calculator')
POPIS: Onboarding completed flag je globalni — pokud uzivatel dokonci onboarding pro
  tenanta A, nebude videt onboarding pro tenanta B. UX issue, ne security.
FIX: Prefixovat tenantId nebo ponechat globalni (expected UX).
```

---

```
ISSUE: [P2] LanguageContext uklada jazyk globalne
FILE: Model_Pricer-V2-main/src/contexts/LanguageContext.jsx:16,21
POPIS: Jazykova preference ('language') je globalni — sdilena mezi tenanty.
  Toto je pravdepodobne zamyslene chovani (uzivatelska preference, ne tenant konfigurace).
FIX: Zadny — dokumentovat jako expected behavior.
```

---

```
ISSUE: [P2] AdminLayout sidebar collapsed stav neni tenant-scoped
FILE: Model_Pricer-V2-main/src/pages/admin/AdminLayout.jsx:40,51
POPIS: Sidebar collapsed/expanded stav se uklada do localStorage bez tenant prefixu.
  UX preference, ne business data.
FIX: Nizka priorita — dokumentovat nebo prefixovat.
```

---

```
ISSUE: [P2] Supabase feature flags storage neni tenant-scoped
FILE: Model_Pricer-V2-main/src/lib/supabase/featureFlags.js:64,77
POPIS: Feature flags pro Supabase storage mode se ukladaji pod globalnim klicem,
  coz znamena ze vsechny tenanty v jednom prohlizeci sdili stejne feature flags.
  V praxi to neovlivnuje bezpecnost (flags urcuji jen zda se pouziva LS vs Supabase),
  ale mohlo by to vest k neocekavaneho chovani pri multi-tenant pouziti.
FIX: Prefixovat klic tenantId nebo ponechat globalni s dokumentaci.
```

---

## Pozitivni nalezy (co je spravne)

### Frontend Storage Helpers (GOOD)
Vsechny admin*Storage.js soubory (24 souboru) spravne pouzivaji tenant-scoped storage:

| Soubor | Pouziva readTenantJson/writeTenantJson | Tenant Isolated |
|--------|----------------------------------------|-----------------|
| adminTenantStorage.js | CORE — definuje API | YES |
| adminPricingStorage.js | YES | YES |
| adminFeesStorage.js | YES + legacy migration | YES |
| adminOrdersStorage.js | YES | YES |
| adminBrandingWidgetStorage.js | YES + legacy migration | YES |
| adminEcommerceStorage.js | YES + legacy migration | YES |
| adminEmailStorage.js | YES | YES |
| adminExpressStorage.js | YES | YES |
| adminShippingStorage.js | YES | YES |
| adminCouponStorage.js | YES | YES |
| adminCouponsStorage.js | YES | YES |
| adminAnalyticsStorage.js | YES | YES |
| adminAuditLogStorage.js | YES | YES |
| adminNotificationStorage.js | YES | YES |
| adminTeamAccessStorage.js | YES | YES |
| adminFormStorage.js | YES | YES |
| adminKanbanStorage.js | YES | YES |
| adminDashboardStorage.js | YES | YES |
| adminPaymentStorage.js | YES | YES |
| adminCompanyStorage.js | YES | YES |
| adminPrintQueueStorage.js | YES | YES |
| adminSettingsStorage.js | YES | YES |
| adminOrderViewsStorage.js | YES | YES |
| adminOrderTagsStorage.js | YES | YES |
| invoiceStorage.js | YES | YES |
| emailSendLog.js | YES | YES |
| widgetThemeStorage.js | YES + legacy migration | YES |
| securityAuditLog.js | YES (vlastni buildKey) | YES |
| adminActivityLog.js | YES (vlastni buildKey) | YES |

### Backend API Routes (MOSTLY GOOD)
Vetsina backend rout spravne pouziva `getTenantIdFromReq()` a data jsou izolovana per-tenant:

| Route Module | Pouziva getTenantIdFromReq | Path Traversal Guard |
|-------------|---------------------------|---------------------|
| orders.js | YES | N/A (JSON store) |
| config.js | YES | YES (validateTenantId + assertInWorkspace) |
| invoices.js | YES | PARTIAL (assertInWorkspace, chybi validateTenantId) |
| notifications.js | YES | NO (chybi) |
| presets.js | YES | N/A (presetsStore handles) |
| webhooks.js | YES | N/A (webhookService handles) |
| slicer.js | YES (profiles) | N/A |
| stats.js | YES | N/A (JSON store) |
| emailRoutes.js | NO | NO |
| storageRouter.js | YES | YES (assertWithinRoot) |

### adminTenantStorage.js Security Features (EXCELLENT)
- `resolveAndValidateTenantId()` — rejects tenant override mismatch (security warning log)
- `buildKey()` — consistent `modelpricer:${tenantId}:${namespace}` format
- `clearAllTenantData()` — handles both modern and legacy key formats
- Supabase dual-write respects tenant isolation

### Backend Tenant Middleware (GOOD)
- `requireTenant` middleware correctly prioritizes JWT token tenant over header
- Warns on header/token mismatch (potential spoofing)
- Rejects unauthenticated requests in production without tenant

### storageApi.js Frontend Client (GOOD)
- All requests include `x-tenant-id` header via `authHeaders()`
- Path sanitization prevents traversal attacks
- Auth token included when available

---

## Doporuceni pro prioritizaci

### Immediate (P0 — tento sprint):
1. **emailRoutes.js** — pridat tenant izolaci (nejkritictejsi nalez)
2. **Slicer queue job access** — pridat tenant validaci na job status/cancel
3. **Slicer/cache stats** — omezit na tenant scope
4. **notifications.js** — pridat validateTenantId()

### Next sprint (P1):
5. **index.js getTenantIdFromReq()** — odstranit prod fallback na "demo-tenant"
6. **mesh.js** — pridat requireAuth + requireTenant middleware
7. **invoices.js** — pridat validateTenantId()
8. **ConfigBackupRestore.jsx** — tenant-scope auto-backup klic
9. **PrintConfiguration.jsx** — tenant-scope user presets

### Backlog (P2):
10. Theme/onboarding/language/sidebar preferences — dokumentovat jako expected globalni

---

## Metodika auditu

Auditovano:
- 24 admin*Storage.js souboru v `src/utils/`
- 5 dalsi *Storage.js souboru (invoice, email, widget, security, activity)
- 12 backend route modulu v `backend-local/src/routes/`
- Backend entry point (`index.js`) vcetne middleware
- `storageApi.js` (frontend API client)
- `storageAdapter.js` (Supabase adapter)
- `storageRouter.js` (backend storage endpoints)
- Widget public page a widget.js loader
- Tenant middleware (`tenant.js`)
- Hledani primych localStorage pristupu v celkem codebase (`src/`)
