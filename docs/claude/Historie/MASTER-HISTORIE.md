# MASTER-HISTORIE — Centralni index vsech zaznamu

> Tento soubor je JEDINY centralni rozcestnik pro vsechny zaznamy historie.
> Kazdy novy zaznam MUSI byt zaregistrovan zde.

---

## Statistiky

- **Celkem zaznamu:** 164 (102-158 + 2x ID 101)
- **Posledni zaznam:** 158-BK (UPRAVY 2026-03-10, Backend API Docs)
- **Posledni aktualizace:** 2026-03-11 (Batch 16-17 finalizace — ID 157-158: Admin Footer + Backend API Docs)

---

## Zaznamy podle dne

### 2026-02-19 (S01)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| 001 | GN | KONVERZACE | Prvni konverzace — zavedeni historie systemu |
| 002 | GN | UPRAVY | Vytvoreni historie infrastruktury (sablony, registry) |
| 003 | GN | OTAZKY | Q&A o historie systemu |
| 007 | GN | KONVERZACE | Pokracovani session — agent management |
| 008 | GN | UPRAVY | Agent mapy a skills |
| 009 | PE | KONVERZACE | Pricing engine diskuze |
| 010 | PE | UPRAVY | Pricing engine zmeny |
| 011 | PE | OTAZKY | Pricing engine Q&A |

### 2026-02-20 (S01-S02)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| 012-031 | ruzne | FUNKCNI TESTY | 20 admin stranek otestovano (prumer 17.5/20) |
| 032 | GN | KONVERZACE | Funkcni testy session |
| 033 | GN | UPRAVY | 22 novych + 2 uprav souboru |
| 034-037 | GN | UPRAVY | Faze 1-4 screenshoty a reporty |
| 038 | GN | DENNI-PREHLED | Denni prehled 2026-02-20 |
| 039-041 | AU | UPRAVY | Auth Research Phase 1-3 |
| 042 | AU | DENNI-PREHLED | Auth Research kompletni |

### 2026-02-22 (S01)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| 043 | AU | KONVERZACE | Sprint 1 Auth implementace |
| 044 | AU | UPRAVY | Sprint 1 (8 novych + 7 upravenych + 4 smazane) |
| 045 | AU | OTAZKY | 10 design decisions |
| 046 | AU | DENNI-PREHLED | Sprint 1 Complete |
| 047-051 | AU | UPRAVY | Faze 0-4 implementace (AuthContext, Login, Backend, Build fix) |

### 2026-02-23 (S01-S02)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| 052-054 | LG | UPRAVY/KONVERZACE | Login page wrapper, technicke zmeny |
| 055 | LG | OTAZKY | 6 Q&A o procesni discipline |
| 056 | AU | KONVERZACE | Sprint 1 testovani (3 bugy) |
| 057 | AU | UPRAVY | Firebase API key oprava |
| 058 | GN | UPRAVY | Sprint-Plan-Auth.md + RoadMap-Plan-BETA.md |

### 2026-02-24 (S01-S03)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| 059 | AU | UPRAVY | Google Sign-In error handling (Sprint 1 bugfix) |
| 060 | AU | UPRAVY | Auth headery v service souborech |
| 061 | AU | UPRAVY | Backend .env + 3 dokumentace |
| 062 | AU | KONVERZACE | Sprint 1 bugfixy session |
| 063 | AU | OTAZKY | 4 Q&A (task tracking, background agenti) |
| 064 | BK | UPRAVY | dotenv ESM import order fix |
| **065** | **GN** | **KONVERZACE** | **Sprint 2 iniciace — plan, 3 explore agenti** |
| **066** | **GN** | **UPRAVY** | **Sprint 2 implementacni plan (12 fazi)** |
| **067** | **FE** | **KONVERZACE** | **Toast/Notification system (Faze 1)** |
| **068** | **FE** | **UPRAVY** | **NotificationContext + ToastContainer + App.jsx** |
| **069** | **FE** | **FAZE** | **Kontrolni kroky po Fazi 1 (build PASS)** |
| **070** | **AC** | **UPRAVY** | **Profile tab realna data (useAuth, validace, toast)** |
| **071** | **AC** | **UPRAVY** | **Company tab storage (adminCompanyStorage, company:v1)** |
| **072** | **AC** | **UPRAVY** | **Security tab zmena hesla + Billing tab plan config** |
| **073** | **AC** | **KONVERZACE** | **Security+Billing implementace kontext** |
| **074** | **AC** | **KONVERZACE** | **Sprint 2 finalni souhrn** |
| **075** | **AC** | **UPRAVY** | **Sprint 2 kompletni zmeny (3 nove, 7 upravenych souboru)** |

### 2026-02-25 (S01)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **076** | **ST** | **KONVERZACE** | **Per-User Tenant Izolace — plan S01, paralelni implementace 3 fazi, build PASS** |
| **077** | **ST** | **UPRAVY** | **15 upravenych souboru v storage, auth, admin, checkout** |
| **078** | **ST** | **OTAZKY** | **5 Q&A o modelu tenantu, migraci, test-kalkulacce** |
| **079** | **ST** | **KONVERZACE** | **P0 Code Review request + paralelni implementace 3 agentu + spusteni 4 opravnych agentu** |
| **080** | **ST** | **UPRAVY** | **6 souboru upravenych — setTenantId validace, logout order, getTenantId scope, legacy key removal, dead code** |
| **081** | **GN** | **KONVERZACE** | **P1 Fixes session — paralelni oprava 7 chyb, build PASS, BUGFIX-TRACKER vytvoreny** |
| **082** | **ST** | **UPRAVY** | **7 upravenych souboru + 1 novy (BUGFIX-TRACKER.md) — async API, cache, race condition, dead code** |
| **083** | **GN** | **DENNI-PREHLED** | **Denni prehled 2026-02-25: P0 review + P1 fixes complete, 7 bugs fixed, build PASS** |
| **084** | **ST** | **UPRAVY** | **P2 bugfixy — canUseLocalStorage() guardy v auditLog, teamAccess; getTenantId() cache v analytics; console.debug v tenantStorage** |

### 2026-02-26 (S02-S03)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **085** | **WB** | **KONVERZACE** | **Widget Builder vlny 1-3 — 9 paralelni agentu, kriticke bugy + design + verifikace** |
| **086** | **WB** | **UPRAVY** | **17+ upravenych souboru: PostMessage, Storage exports, Security, Typography, UX, A11y** |
| **087** | **WB** | **OTAZKY** | **12 Q&A: embed architektura, XSS sanitizace, konkurencni analyza, ARIA accessibility** |
| **088** | **GN** | **DENNI-PREHLED** | **Denni prehled 2026-02-26: Widget Builder complete (3 vlny), build PASS** |
| **089** | **WB** | **TESTY** | **Browser testing: AdminWidget, Embed tab, Builder UI, test-kalkulacka — 14/14 PASS, 1 bug opraven** |
| **090** | **SB** | **KONVERZACE** | **Supabase migrace sprint zahajeni (S03) — 6 paralelni research agentu, no questions asked** |
| **091** | **SB** | **UPRAVY** | **CP2 implementace — backend security, RLS policies (102), JWT bridge scaffolding, 11 findings (4 P0 fixed)** |
| **092** | **SB** | **DENNI-PREHLED** | **Sprint kompletni (17 deliverables, 76/76 tests PASS, build PASS, ready for production RLS + dual-write)** |

### 2026-02-27 (S01-S05)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **093** | **GN** | **KONVERZACE** | **Pruzkum stavu projektu + plan dalsich implementaci — parallelni diagnostika (pending plans, git, supabase, frontend build)** |
| **094** | **SB** | **UPRAVY** | **Auth Bridge + Tenant Auto-Registration — Faze 3 dokonceni (tenantRegistration.js, 4x integrace, 43 radku docs)** |
| **095** | **SB** | **KONVERZACE** | **Kompletni Supabase migrace & tenant izolace sprint (18 deliverables, 76/76 tests PASS, build PASS, 20+ agentu, 4 pending user actions)** |
| **096** | **SB** | **KONVERZACE** | **RLS Deploy via MCP (102 politik, 4 migrace) + Dual-Write Activation Guide rewrite (820 -> 200 radku)** |
| **097** | **SB** | **UPRAVY** | **4 Supabase RLS migrace pres MCP (102 politik nasazeno) + Dual-Write Guide rewrite (820 -> 200 radku, 7 casti A-G)** |

### 2026-03-04 (S01)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **098** | **AO** | **KONVERZACE** | **3 fixes pro Admin Orders: filter collapse, order data fallback chains, status dropdown** |
| **099** | **AO** | **UPRAVY** | **Filter minimization (toggle, count), order totals fallback (time/weight/price), StatusDropdown component** |
| **100** | **AO** | **UPRAVY** | **Price fallback (totals_snapshot), KanbanCard field mappings fixed, mock seed data removed** |

### 2026-03-05 (S01)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **101** | **AO** | **KONVERZACE** | **Kompletni session S01 — 3 originalni fixes + 4 extra (price fallback, kanban unifikace), 8 souboru, build PASS, browser test OK** |
| **101** | **AO** | **UPRAVY** | **8 upravenych souboru: AdminOrders (filter collapse), adminOrdersStorage (fallback chains), OrderDetailModal (StatusDropdown), CheckoutForm (price fix), KanbanCard/Board (field mapping), statusTransitions (UPPERCASE), adminKanbanStorage (migration)** |

### 2026-03-09 (S01)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **102** | **PY** | **KONVERZACE** | **Payment Methods + Checkout integrace — AdminPayments stranka, adminPaymentStorage, CheckoutForm radio vyber, OrderConfirmation platebni udaje** |

### 2026-03-10 (S01)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **113** | **GN** | **KONVERZACE** | **Autonomní implementační session — plán Build Plate Viewer + Mesh Repair, 3 features, 4 klíčová rozhodnutí, paralelní agenti** |
| **114** | **3D** | **UPRAVY** | **Build Plate Viewer (tab systém, grid 250x210mm, auto-orient Fibonacci sphere 42 bins, shadows, dimension labels, Forge dark theme), Mesh Repair System (analyzeMesh, repairMesh, autoOrientForPrinting, exportSTL, 759 řádků), MeshRepairPanel (433 řádků React komponenty s analýzou, opravou, exportem, české popisky)** |
| **115** | **GN** | **PLAN** | **Roadmap 10+ dalších features: Fáze 1-4 (P0-P3 priorita), 87 hodin paralelizovatelné práce (11 haiku + 4 sonnet agenti), risk register, Definition of Done, assignment matrix** |
| **116** | **TK** | **UPRAVY** | **Model Dimension Labels v Build Plate Vieweru — bracket-style lines, HTML labels, toggle button, @react-three/drei Html komponenta** |
| **117** | **TK** | **UPRAVY** | **Price Breakdown Donut Chart — PriceBreakdownChart.jsx (Recharts), dark theme, integrován do PricingCalculator.jsx, animace, responsive** |
| **118** | **TK** | **UPRAVY** | **Keyboard Shortcuts — Ctrl+Enter (slice), Escape (cancel), Ctrl+S (export), Ctrl+U (upload), ? (help), KeyboardShortcutsHelp komponenta, české popisky** |
| **119** | **AD** | **UPRAVY** | **Admin Dashboard Analytics Charts — DashboardCharts.jsx s 4 grafy: Orders (line), Revenue (stacked bar), Status (donut), Top Materials (horizontal bar), demo data, responsive grid** |
| **120** | **AD** | **UPRAVY** | **Notification Center — NotificationCenter.jsx (bell icon, badge, dropdown), adminNotificationStorage.js (tenant-scoped), 6 typů notifikací, max 50, relativní timestamps** |
| **121** | **TK** | **UPRAVY** | **Responsive Kalkulačka (Mobile) — responsive-kalkulacka.css (breakpointy 640/768/1024px), sticky bottom, 44px touch targets, iOS zoom prevention, 7 komponent modifikací** |
| **122** | **TK** | **UPRAVY** | **Drag & Drop Reorder souborů — @dnd-kit/core + @dnd-kit/sortable, SortableFileList.jsx (250 řádků), grip handle, DragOverlay, keyboard support, accessibility** |
| **123** | **TK** | **UPRAVY** | **Auto-save konfigurace tisku — useAutoSaveConfig hook (180 řádků), sessionStorage s debouncem 500ms, versionování schématu, restore na init, clear na checkout** |
| **124** | **TK** | **UPRAVY** | **Model Thumbnails generování — thumbnailGenerator.js (380 řádků, off-screen WebGL, IndexedDB cache, idb knihovna), ModelThumbnail.jsx (150 řádků, IntersectionObserver lazy load)** |
| **103** | **PY** | **UPRAVY** | **2 nove + 5 upravenych souboru: AdminPayments.jsx, adminPaymentStorage.js, Routes.jsx, AdminLayout.jsx, CheckoutForm.jsx (+225), OrderConfirmation.jsx (+398), checkoutSchema.js** |
| **104** | **AG** | **KONVERZACE** | **Vsechny agenty na Opus 4.6 — kontrola + prepnuti 28 agentu (20 Sonnet + 8 Haiku)** |
| **105** | **AG** | **UPRAVY** | **28 agent definic zmeneno (.claude/agents/), 5 inline referenci opraveno, 107/107 na opus** |
| **106** | **TS** | **UPRAVY** | **Vitest setup (86 testu, 82% coverage pricingEngineV3) + code quality analyza (hardcoded URL, CORS, console.log)** |
| **107** | **GN** | **UPRAVY** | **Code quality sprint: 135 unit testu (58 storage + 77 adapter), secure ID (crypto.randomUUID v 10 souborech), console.log cleanup, ErrorBoundary vylepseni + Routes izolace** |
| **108** | **GN** | **UPRAVY** | **Code quality sprint pokracovani: 189 novych testu (pricing validator 23, feature flags 51, Shopify 93, generateId 14, debug 8), skeleton loading (5 admin stranek), dashboard UX, .env.example, backend validace (11 endpointu), console.log cleanup (9 souboru)** |
| **109** | **GN** | **UPRAVY** | **Code quality sprint finalizace (ukoly 19-27): apiClient testy (15), useDocumentTitle + SEO (9 stranek), useKeyboardShortcut (3 modaly), hook testy (23), ForgeBreadcrumb, rate limiting (3 urovne), backend validace testy (56). Celkem 504 testu, 27 ukolu.** |
| **110** | **GN** | **UPRAVY** | **Code quality sprint final (ukoly 28-38): CopyButton + useCopyToClipboard (4 refaktor), focus-visible + skip-to-content, lazy loading 15 rout, ScrollToTopButton, ForgeBreadcrumb testy (8), rate limiter testy (16), clipboard testy (12), document titles (9 stranek), keyboard shortcuts (3 modaly). Celkem 540 testu, 38 ukolu.** |
| **111** | **GN** | **UPRAVY** | **Code quality sprint final batch (ukoly 39-50): network error handler + toast (2s debounce), exportData utilita (CSV/JSON) + admin integrace, request logger middleware (smart levels, slow detection), useMediaQuery hook, ForgeConfirmDialog (promise-based), apiClient testy (15), lazy loading 15 rout, focus-visible + skip-to-content a11y, copy-to-clipboard refaktor (4 soubory). Celkem 601 testu, 50 ukolu.** |
| **112** | **GN** | **UPRAVY** | **Code quality sprint final batch 2 (ukoly 51-57): useOnlineStatus + OfflineBanner testy (9), formatRelativeTime utilita + 37 testu + AdminDashboard integrace, useSortableData hook + AdminOrders 4 sloupce, print styly + Print tlacitko, ForgeConfirmDialog na 5 admin strankach (10 confirm nahrazeno), online/offline system (hook + banner + App.jsx), health check vylepseni (uptime, memory, verze). Celkem 675+ testu, 60+ ukolu.** |
| **125** | **AO** | **UPRAVY** | **Order Export + Bulk Actions — OrderExportActions.jsx (380 řádků): ExportDropdown (CSV/JSON export s filtry), BulkActionsBar (checkbox selection, bulk status change); AdminOrders integrací (selected state, handleBulkStatusChange)** |
| **126** | **GN** | **UPRAVY** | **Page Transitions + Loading Skeletons — animations.css (fade-in/slide-up/scale-fade s prefers-reduced-motion), PageTransition.jsx (CSS klasse wrapper + Suspense), 5 skeleton fallbacky (CalculatorSkeleton, AdminPageSkeleton, PublicPageSkeleton); Routes/AdminLayout/index.jsx/PricingCalculator integrace (11 souboru)** |
| **127** | **TK** | **UPRAVY** | **Print Time Visualization — PrintTimeVisualization.jsx (480 řádků): SVG kruhový progress s 4 fázemi (Heating/Printing/Cooling/Removal), fun srovnění (č. filmu, pracovního dne), tabulka fází, multi-file agregace; integrován do PricingCalculator.jsx** |
| **128** | **GN** | **UPRAVY** | **Batch 5: Admin Activity Log (adminActivityLog.js + AdminActivityLog.jsx, 7 kategorií, max 500 entries, filtry + CSV export), Enhanced File Upload (FileUploadZone.jsx drag animace, SVG ikony, validace, success flash, sample models), Widget Sync zahájení (widget-kalkulacka FileUploadZone.jsx)** |
| **129** | **WK** | **UPRAVY** | **Widget Sync — Build Plate + Mesh Repair portovány do widget-kalkulacka/ModelViewer.jsx, tab systém, builderMode prop pro embed, CSS vars tenant colors (--widget-btn-bg, --widget-accent-color), 870 řádků** |
| **130** | **BK** | **UPRAVY** | **Backend Mesh Repair + Analyze API — POST /api/mesh/repair (PrusaSlicer --repair), POST /api/mesh/analyze (PrusaSlicer --info), runPrusaRepair.js utility (280), mesh.js router (320), rate limiting 10/min, max 100MB, temp cleanup** |
| **131** | **TK** | **UPRAVY** | **Breadcrumb Navigation + Clickable Stepper — sticky breadcrumb, clickable steps s checkmark na completed, highestStepReached tracking, "Zpět na:" button, hover/keyboard/responsive support, 200 řádků CSS+JSX** |
| **132** | **GN** | **KONVERZACE** | **Batch 6 implementace — Widget Sync, Backend Mesh API, Breadcrumb UX, autonomní session, 3 features 1680 řádků, deployment pending PrusaSlicer setup** |
| **133** | **TK** | **UPRAVY** | **Dark/Light Theme Toggle — useThemeToggle.js hook (localStorage + prefers-color-scheme fallback), light-theme-kalkulacka.css (CSS vars přepisy), test-kalkulacka/index.jsx Sun/Moon button integrace** |
| **134** | **BK** | **UPRAVY** | **Backend Slicing Job Queue — slicingQueue.js (SlicingQueue class, EventEmitter, max 2 concurrent, max 50 queued, progress tracking, cancellation, 1h auto-cleanup), /api/slice/queue endpoints (POST/GET/DELETE)** |
| **135** | **MS** | **UPRAVY** | **Admin Model Storage Gallery View — list/grid toggle, sessionStorage persistence, CSS grid responsive (3→2→1 cols), image thumbnails, TypeBadge (color by type), checkbox overlay, hover actions (Edit/Delete/Download)** |
| **136** | **TK** | **UPRAVY** | **Filament Usage Visualization — SVG spool graphic, animated fill, stats (weight/length/%), warning 80%+, multi-file breakdown table, Forge dark theme, responsive** |
| **137** | **TK** | **UPRAVY** | **Material Cost Comparison — expandable section, price list all materials sorted cheapest→most, price diff bars (green→red), clickable select, i18n CZ/EN, useMemo cache** |
| **138** | **AS** | **UPRAVY** | **Quick Settings Panel — 5 ToggleSliders (markup, min order, express, free shipping, volume discounts), debounced saves, "Upravit vše" linky, Forge design, collapsible** |
| **139** | **AX** | **UPRAVY** | **Backend Presets CRUD API — 11 endpointy (GET/POST/PUT/DELETE + validate + duplicate + export-ini), 6 default templates (PLA/PETG/ABS/TPU/FLEX/NYLON), validatePresetConfig, generateIniFromConfig, presetsRouter refaktor** |
| **140** | **TK** | **UPRAVY** | **Slicing Progress Toast Notifications — useSlicingToasts hook, SlicingProgressToast komponenta, 3 stavy (processing/completed/failed), animovaný progress bar, auto-dismiss 5-10s, audio feedback (beep/error), adminNotificationStorage logging** |
| **141** | **GN** | **KONVERZACE** | **Batch 9 implementace (Admin & Backend) — QuickSettings Panel (5 controls, debounce 600ms), Backend Presets CRUD (11 endpoints, 6 defaults), Slicing Progress Toast (3 states, audio feedback), 3 komponenty + 1 router + 1 hook, 1490+ řádků** |
| **142** | **AD** | **UPRAVY** | **Admin System Health Page — 6 status karet (Backend, API Latence, Úložiště, Prohlížeč, PrusaSlicer, Prostředí), auto-refresh 30s, green/yellow/red indikátory, localStorage breakdown + progress bars** |
| **143** | **AX** | **UPRAVY** | **Preset Editor + Comparison + Templates — PresetComparison.jsx (side-by-side diff 2-3 presets), PresetTemplates.jsx (6 defaults: PLA/PETG/ABS/TPU/FLEX/NYLON), PresetInlineEditor.jsx (ForgeSlider kontroly), AdminPresets.jsx integrace** |
| **144** | **TK** | **UPRAVY** | **Pricing History Tracking — usePricingHistory hook (sessionStorage max 20), PricingHistory.jsx s SVG sparkline chartovým, entry porovnění (green/red diff), "Použít nastavení" restore, relativní timestamps** |
| **145** | **AL** | **UPRAVY** | **Admin Sidebar Collapse + Groups + Search — collapsible sidebar (260px ↔ 64px, Ctrl+B toggle), 4 navigační skupiny (Hlavní/Produkty/Design/Systém), search live filter, active route teal indicator, localStorage persistence, icon-only mode s tooltips** |
| **146** | **GN** | **UPRAVY** | **Confetti Animation + Backend Webhook Notifications — canvas konfeta (150 částic, 3s, fyzika: gravity/wind/rotation), success zvuk (Web Audio API, 800Hz+600Hz), webhook HMAC-SHA256 podpisy, 3x retry exponential backoff, 6 event typů (order.*/slice.*), CRUD endpoints** |
| **147** | **GN** | **UPRAVY** | **Batch 13 Finalizace (Items 39-42) — Admin Webhooks Management Page (webhookApi.js, AdminWebhooks.jsx), Quantity Stepper Component (long-press, presets, batch hint), Model Info Panel (metadata, build plate fit check, scale suggestions), workflow integrace** |
| **148** | **AE** | **UPRAVY** | **Admin Email Template Editor — 4 typy (order_confirmation, order_shipped, issue_notification, promotional), contentEditable editor, variable chips, live preview iframe, XSS sanitizace, 3 nové + 1 upravený soubor** |
| **149** | **BK** | **UPRAVY** | **Backend Order Management API — 7 endpointy (CRUD + status + stats), forward-only status flow, sequential order numbers (ORD-00001), audit trail, soft delete, webhook integration, ordersStore.js + orders.js router** |
| **150** | **GN** | **PLAN** | **AppContext: Lean Global State — probíhající; feature flags + online status + version + theme; zero breaking changes, AppProvider wrapper, Definition of Done** |
| **151** | **GN** | **KONVERZACE** | **Batch 14 iniciace — 3 features (Email Editor, Order API, AppContext), analýza + handoff, status normalizace P0 issue, build pending** |
| **152** | **GN** | **KONVERZACE** | **Finální session shrnutí — 50 features v 14 batchích, 8 kategorií, autonomní mode, decisions log, build PENDING** |
| **153** | **GN** | **UPRAVY** | **MASTER seznam 50 implementací (Batches 1-14 completeness), 8 kategorií, ~8000 řádků kódu, centrální přehled** |
| **154** | **GN** | **UPRAVY** | **Onboarding Tour Guide — 7-krokový interaktivní tour (upload/viewer/config/generate/pricing/mesh repair/done), useOnboardingTour hook, OnboardingTour.jsx s SVG spotlight mask + tooltip + buttons, localStorage persistance, data-tour atributy** |
| **155** | **AO** | **UPRAVY** | **Admin Order Detail Page — AdminOrderDetail.jsx (580 řádků), status timeline (vertical), items table, pricing breakdown, customer info, editable notes (textarea), activity log (API integration), akce tlačítka (status change/print/cancel), OrderDetailModal wrapper** |
| **156** | **AO** | **UPRAVY** | **Admin Customers Page — AdminCustomers.jsx (620 řádků), agregace z objednávek, 4 stat karty (Total Customers/Revenue/Repeat Rate/Avg Order Value), sortable tabulka (Email/Orders/Spent/Last), expandable rows (poslední 5 objednávek), search filtr, avatar placeholders, i18n CZ/EN** |
| **157** | **AL** | **UPRAVY** | **Admin Footer Enhancement — AdminLayout.jsx (250 řádků), verze z AppContext, online status dot, DEV/PROD badge, tenant ID copy button, quick links (Docs/Support/Changelog), tagline, collapsed mode** |
| **158** | **BK** | **UPRAVY** | **Backend API Docs + Versioning — apiDocs.js router (380 řádků), apiDocRegistry.js (470 řádků), 38 dokumentovaných endpointů, 9 domén, GET /api/docs (JSON), GET /api/docs/html (interactive HTML), v1 URL rewrite, X-API-Version header** |

---

## Navigace

| Slozka | Obsah |
|--------|-------|
| `Historie/SABLONY/` | 6 sablon (KONVERZACE, UPRAVY, OTAZKY, FAZE, DENNI-PREHLED, TESTY) |
| `Historie/ID-REGISTRY.md` | Registr zkratek + globalni pocitadlo |
| `Historie/2026-02-19/` | 8 zaznamu (historie system setup, pricing engine) |
| `Historie/2026-02-20/` | 11 zaznamu (funkcni testy, auth research) |
| `Historie/2026-02-22/` | 9 zaznamu (Sprint 1 Auth implementace) |
| `Historie/2026-02-23/` | 7 zaznamu (login page, Sprint 1 testovani) |
| `Historie/2026-02-24/` | 17 zaznamu (Sprint 1 bugfixy + Sprint 2 komplet) |
| `Historie/2026-02-25/` | 8 zaznamu (Per-User Tenant Izolace + P0 Code Review + P1 Fixes) |
| `Historie/2026-02-26/` | 6 zaznamu (Widget Builder Wave 1-3 Complete + Browser Testy + Supabase Migrace) |
| `Historie/2026-03-04/` | 3 zaznamu (Admin Orders: filter collapse, order data, status dropdown + price fallback, kanban, mock removal) |
| `Historie/2026-03-05/` | 2 zaznamu (Admin Orders kompletni session S01: konverzace + technicke zmeny, 8 souboru) |
| `Historie/2026-03-09/` | 11 zaznamu (Payment Methods + Checkout integrace + Agents model upgrade + Vitest setup & code quality + Code quality sprint 5x + Code quality sprint final batch 2) |
| `Historie/2026-03-10/` | 46 zaznamu (Autonomní session: plán + batch1-15 + 4x KONVERZACE + Batch 16-17 UPRAVY + denní přehled; ID 113-158) |
