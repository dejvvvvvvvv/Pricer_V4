# ID-REGISTRY — Registr zkratek a pocitadlo historie

> Tento soubor je JEDINY zdroj pravdy pro ID system historie.
> Kazdy historie-agent MUSI precist tento soubor pred vytvorenim novych zaznamu.

---

## Aktualni pocitadlo

**Posledni pouzite ID:** 185
**Dalsi ID k pouziti:** 186
**Posledni aktualizace:** 2026-03-15 (Session S03 — Auth Security Review + Fixes, 184-AU + 185-AU)

---

## Format ID

```
{NNN}-{ZK}
```

- **NNN** = 3-mistne cislo s nulami (001, 002, ..., 999)
- **ZK** = 2-znakova zkratka oblasti (viz tabulka nize)
- Cislo je **globalni** — kazdy novy zaznam dostane dalsi cislo v rade (bez ohledu na oblast)
- Priklad: `001-TK`, `002-AD`, `003-TK` (TK ma 001 a 003, AD ma 002)

---

## Session format

```
S{NN}
```

- Kazdy novy chat/terminalni okno = nova session
- Cislovano v ramci dne: S01, S02, S03, ...
- Pokud nevime poradi, pouzij S01

---

## Registr zkratek

### Admin stranky
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| AD | Admin-Dashboard | src/pages/admin/AdminDashboard.jsx |
| AP | Admin-Pricing | src/pages/admin/AdminPricing.jsx |
| AF | Admin-Fees | src/pages/admin/AdminFees.jsx |
| AB | Admin-Branding | src/pages/admin/AdminBranding.jsx |
| AI | Admin-Integrations | src/pages/admin/AdminIntegrations.jsx |
| AO | Admin-Orders | src/pages/admin/AdminOrders.jsx |
| AA | Admin-Analytics | src/pages/admin/AdminAnalytics.jsx |
| AT | Admin-Team | src/pages/admin/AdminTeam.jsx |
| AW | Admin-Widget | src/pages/admin/AdminWidget.jsx |
| AM | Admin-Migration | src/pages/admin/AdminMigration.jsx |
| AS | Admin-Settings | src/pages/admin/ (obecne nastaveni) |
| AX | Admin-Presets | src/pages/admin/AdminPresets.jsx |
| AR | Admin-Parameters | src/pages/admin/AdminParameters.jsx |
| AE | Admin-Express | src/pages/admin/AdminExpress.jsx |
| DP | Doprava-Shipping | src/pages/admin/AdminShipping.jsx |
| PY | Admin-Payments | src/pages/admin/AdminPayments.jsx |

### Kalkulacky a widgety
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| TK | Test-Kalkulacka | src/pages/test-kalkulacka/ |
| WK | Widget-Kalkulacka | src/pages/widget-kalkulacka/ |
| WB | Widget-Builder | src/pages/admin/AdminWidget.jsx (builder cast) |

### Verejne stranky
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| HP | Home-Page | src/pages/home/ |
| PP | Pricing-Page | src/pages/pricing/ |
| SP | Support-Page | src/pages/support/ |
| MU | Model-Upload | src/pages/model-upload/ |
| MS | Model-Storage | src/pages/model-storage/ |
| LG | Login-Page | src/pages/login/ |

### Systemy a engine
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| PE | Pricing-Engine | src/lib/pricing/pricingEngineV3.js |
| ST | Storage | src/utils/adminTenantStorage.js + helpery |
| SB | Supabase | src/lib/supabase/ |
| SDB | Supabase-Database | docs (DB schema, migrations, RLS) |
| SH | Shopify | src/lib/shopify/ |
| AU | Auth | docs/claude/Research/Auth/ |
| RT | Routing | src/Routes.jsx |
| LC | LanguageContext | src/contexts/LanguageContext.jsx |
| BK | Backend | backend-local/ |

### UI a design
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| DS | Design-System | src/forge-tokens.css + src/components/ui/ |
| HD | Header | src/components/Header.jsx |
| FT | Footer | src/components/Footer.jsx |
| UI | UI-Components | src/components/ui/ |

### Infrastruktura a meta
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| CF | Config | vite.config.mjs, package.json |
| SC | Security | bezpecnostni audit/review |
| TS | Tests | testy, vitest |
| DC | Documentation | docs/claude/Documentation/ |
| AG | Agents | .claude/agents/ |
| SK | Skills | .agents/skills/ |
| GN | General | viceoborove, obecne |
| 3D | 3D-Models | 3D viewer, mesh analyza |

### Business logika
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| KS | Kupony-Slevy | kuponovy/slevovy system |
| VD | Volume-Discounts | mnozstevni slevy |
| CO | Checkout | checkout flow |
| FE | Fees | poplatky (MODEL + ORDER) |

---

## Pravidla pro nove zkratky

1. **Max 2 znaky** (velka pismena nebo cislice)
2. **Unikatni** v ramci celeho registru
3. **Intuitivne rozpoznatelne** — prvni pismena klicovych slov
4. **Pred pouzitim zapsat** do teto tabulky — NIKDY nepouzivej neregistrovanou zkratku
5. Pokud oblast neexistuje, pouzij `GN` (General) a nasledne pridej novou zkratku

---

## Typy souboru historie

| Typ | Popis | Suffix v nazvu souboru |
|-----|-------|----------------------|
| KONVERZACE | Uzivatelovy zpravy + Claude odpovedi | _KONVERZACE.md |
| UPRAVY | Technicke zmeny v souborech | _UPRAVY.md |
| OTAZKY | Otazky a odpovedi, rozhodnuti | _OTAZKY.md |
| FAZE | Individualni faze vicefazoveho planu/sprintu | _FAZE-{N}-{Nazev}.md |
| PLAN | Celkovy plan s viceero fazemi, roadmapp, risk register | _PLAN.md |
| DENNI-PREHLED | Souhrn celeho dne | DENNI-PREHLED.md |

---

---

## Pouzita ID (Funkcni Testy — 012 az 031)

| ID | Zkratka | Oblast | Score | Datum |
|----|---------|--------|-------|-------|
| 012 | TK | Test-Kalkulacka | 14/20 | 2026-02-20 |
| 013 | AD | Admin-Dashboard | 17/20 | 2026-02-20 |
| 014 | AP | Admin-Pricing | 18/20 | 2026-02-20 |
| 015 | AF | Admin-Fees | 16/20 | 2026-02-20 |
| 016 | AX | Admin-Presets | 17/20 | 2026-02-20 |
| 017 | AR | Admin-Parameters | 19/20 | 2026-02-20 |
| 018 | AO | Admin-Orders | 16/20 | 2026-02-20 |
| 019 | AB | Admin-Branding | 19/20 | 2026-02-20 |
| 020 | AW | Admin-Widget | 20/20 | 2026-02-20 |
| 021 | AA | Admin-Analytics | 17/20 | 2026-02-20 |
| 022 | AT | Admin-Team | 17/20 | 2026-02-20 |
| 023 | AE | Admin-Express | 20/20 | 2026-02-20 |
| 024 | DP | Doprava-Shipping | 20/20 | 2026-02-20 |
| 025 | KS | Kupony-Slevy | 19/20 | 2026-02-20 |
| 026 | GN | Admin-Emails | 17/20 | 2026-02-20 |
| 027 | AM | Admin-Migration | 20/20 | 2026-02-20 |
| 028 | AI | Admin-Integrations | 16/20 | 2026-02-20 |
| 029 | MS | Model-Storage | 18/20 | 2026-02-20 |
| 030 | LG | Login-Page | 14/20 | 2026-02-20 |
| 031 | GN | Account-Page | 16/20 | 2026-02-20 |

**Celkem: 350/400 (prumer 17.5/20)**

### Historie zaznamy (032-046)

| ID | Zkratka | Oblast | Typ | Datum |
|----|---------|--------|-----|-------|
| 032 | GN | General | KONVERZACE — funkcni testy session | 2026-02-20 |
| 033 | GN | General | UPRAVY — 22 novych + 2 uprav souboru | 2026-02-20 |
| 034 | GN | General | UPRAVY — Faze1 Screenshoty (5 PNG + 5 MD uprav) | 2026-02-20 |
| 035 | GN | General | UPRAVY — Faze2 Screenshoty (5 PNG + 5 MD uprav, stranky 017-021) | 2026-02-20 |
| 036 | GN | general-purpose | Faze 3 screenshoty + reporty | 2026-02-20 |
| 037 | GN | general-purpose | Faze 4 screenshoty + reporty | 2026-02-20 |
| 038 | GN | general-purpose | Denni prehled 2026-02-20 | 2026-02-20 |
| 039 | AU | Auth | UPRAVY — Phase 1 Auth Research | 2026-02-20 |
| 040 | AU | Auth | UPRAVY — Phase 2 Auth Research | 2026-02-20 |
| 041 | AU | Auth | UPRAVY — Phase 3 Auth Research (Security Checklist) | 2026-02-20 |
| 042 | AU | Auth | DENNI-PREHLED — Cela Auth Research kompletni (4 faze, 1483 radku) | 2026-02-20 |
| 043 | AU | Auth | KONVERZACE — Sprint 1 implementace (retroaktivni historia save) | 2026-02-22 |
| 044 | AU | Auth | UPRAVY — Sprint 1 (8 novych + 7 upravenych + 4 smazane, build PASS) | 2026-02-22 |
| 045 | AU | Auth | OTAZKY — 10 design decisions (email, role, Google, provider, token) | 2026-02-22 |
| 046 | AU | Auth | DENNI-PREHLED — Sprint 1 Complete (1200+ radku, kriticka chyba + oprava) | 2026-02-22 |
| 047 | AU | Auth | UPRAVY — Faze 0 (Priprava: adresare, firebase-admin, Firebase config overeni) | 2026-02-22 |
| 048 | AU | Auth | UPRAVY — Faze 1 (AuthContext rewrite, FirebaseAuthProvider, SupabaseAuthProvider stub, providers/index.jsx) | 2026-02-22 |
| 049 | AU | Auth | UPRAVY — Faze 2 (PrivateRoute aktivace, Login+Google, Register 1-step, GoogleSignInButton, smazane komponenty) | 2026-02-22 |
| 050 | AU | Auth | UPRAVY — Faze 3 (Backend auth middleware, tenant middleware, firebaseAdmin.js, apiClient interceptory) | 2026-02-22 |
| 051 | AU | Auth | UPRAVY — Faze 4 (Build fix .js->.jsx, MEMORY.md, procesni chyba dokumentace) | 2026-02-22 |
| 052 | LG | Login-Page | UPRAVY — Faze 1+3 (Login page wrapper, Register i18n) | 2026-02-23 |
| 053 | LG | Login-Page | KONVERZACE — Kompletni session S01 (plan, implementace, uzivateluv feedback, retroaktivni historia save) | 2026-02-23 |
| 054 | LG | Login-Page | UPRAVY — Kompletni technicke zmeny (login/index.jsx, register/index.jsx, obe dokumentace) | 2026-02-23 |
| 055 | LG | Login-Page | OTAZKY — 6 Q&A o procesni discipline, i18n, dokumentaci, prevenci budoucích chyb | 2026-02-23 |
| 056 | AU | Auth | KONVERZACE — Sprint 1 testovani (3 problemy: Google ticha chyba, backend offline, tenant isolation) | 2026-02-23 |
| 057 | AU | Auth | UPRAVY — Firebase API key oprava + diagnoza 3 problemu (nefixnute, mimo Sprint 1 scope) | 2026-02-23 |
| 058 | GN | General | UPRAVY — 2 nove dokumentace (Sprint-Plan-Auth.md, RoadMap-Plan-BETA.md) pro osobni ucely uzivatele | 2026-02-23 |
| 059 | AU | Auth | UPRAVY — Faze 1 Google Sign-In error handling (4 soubory, try/catch setDoc, console.error, handleGoogleError pattern) | 2026-02-24 |
| 060 | AU | Auth | UPRAVY — Faze 3 Auth headery v service souborech (presetsApi, slicerApi, storageApi: JWT tokeny, async authHeaders refaktor, 12 fetch volani) | 2026-02-24 |
| 061 | AU | Auth | UPRAVY — Faze 5 Backend .env (FIREBASE_PROJECT_ID) + 3 dokumentace (Login, Register, Backend-Server) | 2026-02-24 |
| 062 | AU | Auth | KONVERZACE — Kompletni konverzace Sprint 1 bugfixy session (7 zprav, plan, chyby procesu) | 2026-02-24 |
| 063 | AU | Auth | OTAZKY — 4 Q&A (task tracking, background agenti, chybejici typy zaznamu, zakaz compactu) | 2026-02-24 |
| 064 | BK | Backend | UPRAVY — dotenv ESM import order fix (index.js: side-effect import pred firebaseAdmin) | 2026-02-24 |
| 065 | GN | General | KONVERZACE — Sprint 2 iniciace S03 (uzivatel spousti, Claude planuvi, 3 agenti explore) | 2026-02-24 |
| 066 | GN | General | UPRAVY — Sprint 2 implementacni plan (12 fazi, 5 ukolu, CP1/CP2/CP3 framework) | 2026-02-24 |
| 067 | FE | Frontend | KONVERZACE — Toast/Notification system implementace (Faze 1) | 2026-02-24 |
| 068 | FE | Frontend | UPRAVY — NotificationContext.jsx, ToastContainer.jsx, App.jsx integrace | 2026-02-24 |
| 069 | FE | Frontend | FAZE — Kontrolni kroky po Fazi 1 (build PASS, browser test preskocen) | 2026-02-24 |
| 070 | AC | Account | UPRAVY — Profile tab realna data (useAuth, updateProfile, validace, toast) | 2026-02-24 |
| 071 | AC | Account | UPRAVY — Company tab tenant storage (adminCompanyStorage.js, company:v1) | 2026-02-24 |
| 072 | AC | Account | UPRAVY — Security tab zmena hesla + Billing tab plan config | 2026-02-24 |
| 073 | AC | Account | KONVERZACE — Security+Billing implementace kontext | 2026-02-24 |
| 074 | AC | Account | KONVERZACE — Sprint 2 finalni souhrn (vsech 5 ukolu hotovo) | 2026-02-24 |
| 075 | AC | Account | UPRAVY — Sprint 2 kompletni zmeny (10 souboru, 3 nove, 7 upravenych) | 2026-02-24 |
| 076 | ST | Storage | KONVERZACE — Per-User Tenant Izolace (2026-02-25, S01) | 2026-02-25 |
| 077 | ST | Storage | UPRAVY — 15 souboru tenant-scoped storage refaktor | 2026-02-25 |
| 078 | ST | Storage | OTAZKY — 5 Q&A o tenant modelu a migraci | 2026-02-25 |
| 079 | ST | Storage | KONVERZACE — P0 Code Review request + 3 agenti | 2026-02-25 |
| 080 | ST | Storage | UPRAVY — 6 souboru: setTenantId, getTenantId scope, legacy keys | 2026-02-25 |
| 081 | GN | General | KONVERZACE — P1 Fixes session (7 chyb, build PASS) | 2026-02-25 |
| 082 | ST | Storage | UPRAVY — 7 souboru + BUGFIX-TRACKER.md | 2026-02-25 |
| 083 | GN | General | DENNI-PREHLED — 2026-02-25 souhrn | 2026-02-25 |
| 084 | ST | Storage | UPRAVY — P2 bugfixy (3 oblasti, console.debug cleanup) | 2026-02-25 |
| 085 | WB | Widget-Builder | KONVERZACE — Widget Builder vlny 1-3 (2026-02-26, S02) | 2026-02-26 |
| 086 | WB | Widget-Builder | UPRAVY — 17+ souboru (PostMessage, Storage, Security, Typography, UX, A11y) | 2026-02-26 |
| 087 | WB | Widget-Builder | OTAZKY — 12 Q&A (embed, XSS, konkurence, ARIA) | 2026-02-26 |
| 088 | GN | General | DENNI-PREHLED — 2026-02-26 Widget Builder complete | 2026-02-26 |
| 089 | WB | Widget-Builder | TESTY — Browser testing: AdminWidget, Embed tab, Builder UI (14/14 PASS) | 2026-02-26 |
| 090 | SB | Supabase | KONVERZACE — Supabase migrace sprint zahajeni, 6 research agentu (S03) | 2026-02-26 |
| 091 | SB | Supabase | UPRAVY — CP2 implementace (backend security, RLS policies, JWT bridge scaffolding, 11 findings) | 2026-02-26 |
| 092 | SB | Supabase | DENNI-PREHLED — Sprint kompletni (17 deliverables, 76/76 tests PASS, build PASS, ready for prod RLS) | 2026-02-26 |
| 095 | SB | Supabase | KONVERZACE — Kompletni Supabase migrace & tenant izolace sprint (18 deliverables, dokumentace, design decisions, pending user actions) | 2026-02-27 |
| 096 | SB | Supabase | KONVERZACE — RLS Deploy via MCP (102 politik) + Dual-Write Guide rewrite | 2026-02-27 |
| 097 | SB | Supabase | UPRAVY — 4 RLS migrace (102 politik nasazeno) + Dual-Write Guide rewrite (820→200 radku, 7 casti A-G) | 2026-02-27 |
| 098 | AO | Admin-Orders | KONVERZACE — 3 fixes (filter collapse, order data fallback, status dropdown) | 2026-03-04 |
| 099 | AO | Admin-Orders | UPRAVY — Filter minimization, order totals fallback chains, StatusDropdown component | 2026-03-04 |
| 100 | AO | Admin-Orders | UPRAVY — Price fallback (totals_snapshot), KanbanCard field fix, mock data removal | 2026-03-04 |
| 101 | AO | Admin-Orders | KONVERZACE — Kompletni session S01 (3 originalni fixes + 4 extra, filter collapse, price/kanban fixes) | 2026-03-05 |
| 101 | AO | Admin-Orders | UPRAVY — Filter minimization, fallback chains, StatusDropdown, kanban unifikace, mock removal, 8 souboru | 2026-03-05 |
| 102 | PY | Admin-Payments | KONVERZACE — Payment Methods + Checkout integrace (AdminPayments, storage, radio vyber, platebni udaje) | 2026-03-09 |
| 103 | PY | Admin-Payments | UPRAVY — 2 nove + 5 upravenych souboru (AdminPayments, adminPaymentStorage, CheckoutForm, OrderConfirmation, checkoutSchema) | 2026-03-09 |
| 104 | AG | Agents | KONVERZACE — Vsechny agenty na Opus 4.6 (kontrola + prepnuti 28 agentu) | 2026-03-09 |
| 105 | AG | Agents | UPRAVY — 28 agent .md souboru zmeneno, 5 inline referenci, 107/107 opus | 2026-03-09 |
| 106 | TS | Tests | UPRAVY — Vitest setup (86 testu, 82% coverage) + code quality analyza | 2026-03-09 |
| 107 | GN | General | UPRAVY — Code quality sprint (135 testu, secure ID, console cleanup, ErrorBoundary) | 2026-03-09 |
| 108 | GN | General | UPRAVY — Code quality sprint pokracovani (189 testu, skeleton loading, backend validace, .env.example, console cleanup) | 2026-03-09 |
| 109 | GN | General | UPRAVY — Code quality sprint finalizace (ukoly 19-27: apiClient testy, hooks, breadcrumb, rate limiting, backend validace testy) | 2026-03-09 |
| 110 | GN | General | UPRAVY — Code quality sprint final (ukoly 28-38: CopyButton, clipboard refaktor, lazy loading, focus-visible, skip-to-content, ScrollToTop, breadcrumb testy, rate limiter testy, document titles, keyboard shortcuts) | 2026-03-09 |
| 111 | GN | General | UPRAVY — Code quality sprint final batch (ukoly 39-50: network error handler, export data, request logger, useMediaQuery, ForgeConfirmDialog, apiClient testy, lazy loading, a11y, clipboard refaktor) | 2026-03-09 |
| 112 | GN | General | UPRAVY — Code quality sprint final batch 2 (ukoly 51-57: useOnlineStatus testy, formatRelativeTime, useSortableData, print styles, ForgeConfirmDialog 5 stranek, OfflineBanner, health check) | 2026-03-09 |
| 154 | GN | General / Test-Kalkulacka | UPRAVY — Onboarding Tour Guide (7 kroků, SVG spotlight, localStorage, restart z klávesových zkratek) | 2026-03-10 |
| 155 | AO | Admin-Orders | UPRAVY — Admin Order Detail Page (status timeline, items, pricing, notes, activity log, akce) | 2026-03-10 |
| 156 | AO | Admin-Orders | UPRAVY — Admin Customers Page (agregace, stat karty, sortable tabulka, expandable rows, search, i18n) | 2026-03-10 |
| 157 | AL | Admin-Layout | UPRAVY — Admin Footer Enhancement (verze, online status, tenant ID, quick links, collapsed mode) | 2026-03-10 |
| 158 | BK | Backend | UPRAVY — Backend API Docs + Versioning (38 endpointů, JSON/HTML docs, v1 rewrite, X-API-Version) | 2026-03-10 |
| 116 | TK | Test-Kalkulacka | UPRAVY — Model Dimension Labels v Build Plate Vieweru | 2026-03-10 |
| 117 | TK | Test-Kalkulacka | UPRAVY — Price Breakdown Donut Chart | 2026-03-10 |
| 118 | TK | Test-Kalkulacka | UPRAVY — Keyboard Shortcuts v kalkulačce | 2026-03-10 |
| 119 | AD | Admin-Dashboard | UPRAVY — Analytics Charts | 2026-03-10 |
| 120 | AD | Admin-Dashboard | UPRAVY — Notification Center | 2026-03-10 |
| 121 | TK | Test-Kalkulacka | UPRAVY — Responsive Design | 2026-03-10 |
| 125 | AO | Admin-Orders | UPRAVY — Order Export + Bulk Actions (ExportDropdown, BulkActionsBar) | 2026-03-10 |
| 126 | GN | Frontend | UPRAVY — Page Transitions + Loading Skeletons (animations.css, PageTransition, 5 skeletons) | 2026-03-10 |
| 127 | TK | Test-Kalkulacka | UPRAVY — Print Time Visualization (SVG progress, 4 fáze, fun srovnání) | 2026-03-10 |

---

| 129 | WK | Widget-Kalkulacka | UPRAVY — Widget Sync Build Plate + Mesh Repair portovány, builderMode prop, CSS vars | 2026-03-10 |
| 130 | BK | Backend | UPRAVY — Mesh Repair API (POST /repair, /analyze), runPrusaRepair utility, rate limiting | 2026-03-10 |
| 131 | TK | Test-Kalkulacka | UPRAVY — Breadcrumb Navigation + Clickable Stepper, highestStepReached tracking | 2026-03-10 |
| 132 | GN | General | KONVERZACE — Batch 6 implementace (Widget Sync, Backend Mesh API, Breadcrumb UX) | 2026-03-10 |
| 133 | TK | Test-Kalkulacka | UPRAVY — Dark/Light Theme Toggle (useThemeToggle hook, light-theme-kalkulacka.css, localStorage, prefers-color-scheme) | 2026-03-10 |
| 134 | BK | Backend | UPRAVY — Backend Slicing Job Queue (slicingQueue.js, EventEmitter, max 2 concurrent, /api/slice/queue endpoints) | 2026-03-10 |
| 135 | MS | Model-Storage | UPRAVY — Admin Model Storage Gallery View (list/grid toggle, sessionStorage, CSS grid, thumbnails, TypeBadge, hover actions) | 2026-03-10 |
| 136 | TK | Test-Kalkulacka | UPRAVY — Filament Usage Visualization (SVG spool, animated fill, stats, 80%+ warning, multi-file breakdown) | 2026-03-10 |
| 137 | TK | Test-Kalkulacka | UPRAVY — Material Cost Comparison (expandable section, price list sorted, diff bars, clickable select, i18n, useMemo cache) | 2026-03-10 |
| 138 | AS | Admin-Settings | UPRAVY — Quick Settings Panel (5 ToggleSliders, debounced saves, "Upravit všechna", Forge design, collapsible) | 2026-03-10 |
| 139 | AX | Admin-Presets | UPRAVY — Backend Presets CRUD API (11 endpointy, 6 defaults, validatePresetConfig, generateIniFromConfig) | 2026-03-10 |
| 140 | TK | Test-Kalkulacka | UPRAVY — Slicing Progress Toast Notifications (useSlicingToasts hook, 3 stavy, animace, audio feedback, auto-dismiss) | 2026-03-10 |
| 141 | GN | General | KONVERZACE — Batch 9 implementace (Admin & Backend) — 3 features 1490+ řádků | 2026-03-10 |
| 142 | AD | Admin-Dashboard | UPRAVY — Admin System Health Page (6 status karet, auto-refresh 30s, green/yellow/red) | 2026-03-10 |
| 143 | AX | Admin-Presets | UPRAVY — Preset Editor + Comparison + Templates (side-by-side diff, 6 defaults, ForgeSlider kontroly) | 2026-03-10 |
| 144 | TK | Test-Kalkulacka | UPRAVY — Pricing History Tracking (usePricingHistory hook, sessionStorage, SVG sparkline chart, entry porovnění) | 2026-03-10 |
| 145 | AL | Admin-Layout | UPRAVY — Admin Sidebar Collapse + Groups + Search (260px ↔ 64px, 4 skupiny, live filter, localStorage) | 2026-03-10 |
| 146 | GN | General | UPRAVY — Confetti Animation + Backend Webhook Notifications (canvas konfeta, webhook HMAC-SHA256, 6 event typů) | 2026-03-10 |
| 147 | GN | General | UPRAVY — Batch 13 Finalizace (Admin Webhooks Management, Quantity Stepper, Model Info Panel, workflow integrace) | 2026-03-10 |
| 148 | AE | Admin-Emails | UPRAVY — Admin Email Template Editor (4 typy, contentEditable, live preview, variable chips, XSS sanitizace) | 2026-03-10 |
| 149 | BK | Backend | UPRAVY — Backend Order Management API (7 endpointy, status flow validace, audit trail, soft delete, webhook integrace) | 2026-03-10 |
| 150 | GN | General | PLAN — AppContext: Lean Global State (feature flags, online status, version, theme; probíhající implementace) | 2026-03-10 |
| 151 | GN | General | KONVERZACE — Batch 14 implementace (3 features: Email Editor, Order API, AppContext; iniciace + analýza + handoff) | 2026-03-10 |

---

**Posledni aktualizace:** 2026-03-15 (Session S03 — Auth Security Review + Fixes, 184-AU + 185-AU)
**Posledni session:** S03 (2026-03-15) — Security review Supabase Auth migrace (2 zaznamy: KONVERZACE + UPRAVY)
