# MASTER-HISTORIE — ModelPricer Historie

**Centralny index** vsech zaznamu. Index je setrideny podle data a ID.

---

## 2026-02-24

### S01: Sprint 1 Auth Bugfixy — FINAL

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **001-AU** | 2026-02-24 | UPRAVY | AU | Sprint 1 Auth Bugfixy FINAL — 3 bugy opraveny | 11 | Bug 1: Google Sign-In error handling; Bug 2a: Auth headery v service souborech; Bug 2b: Backend .env |
| **002-AU** | 2026-02-24 | UPRAVY | AU | Sprint 1 Auth Bugfixy Faze 5 — Backend .env + Dokumentace | 4 | .env: FIREBASE_PROJECT_ID; Docs: Login, Register, Backend-Server aktualizovany |

### S03: Sprint 2 Faze 2-3-5 — Kontrolni Kroky + Profile + Company Tab

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **045-FE** | 2026-02-24 | FAZE2 | FE | Sprint 2 Faze 2 — Kontrolni kroky + Build verify | 0 | Build PASS (56.8s), Chrome offline, pripravenost na Fazi 3 |
| **046-AC** | 2026-02-24 | UPRAVY | AC | Sprint 2 Faze 3 — Profile Tab s Realnym Daty | 1 | useAuth() + useNotification(); validace firstName, lastName, phone; Email readOnly; Save button s loading |
| **047-AC** | 2026-02-24 | UPRAVY | AC | Sprint 2 Faze 5 — Company Tab s Realnym Ulozenim Dat | 2 | adminCompanyStorage.js (novy), namespace company:v1; Validace ICO/DIC/PSC/companyName; Country select; Save+Cancel handlery s toast |
| **048-AC** | 2026-02-24 | UPRAVY | AC | Sprint 2 Faze 7+9 — Security (changePassword) + Billing (subscription+i18n+a11y) | 10 | FirebaseAuthProvider.changePassword, Security tab s reauth a error mapping, Billing tab s planConfig, ARIA opravy, React.memo extract |
| **049-AC** | 2026-02-24 | FINALIZACE | AC | **Sprint 2 KOMPLETNE HOTOVO** — 5 ukolu implementovano, 10 souboru zmen | **10** | **Sprint 2 Summary:** Toast system (S2.1) + Profile tab realdata (S2.2) + Company storage (S2.3) + Security changePassword (S2.4) + Billing subscription (S2.5); Build PASS (43s); MEMORY+Docs aktualizovany; 3 Middle agenti + 1 Specific |

---

## 2026-02-25

### S01: Per-User Tenant Izolace — Faze 1+3+5 (Core + Auth + Cleanup)

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **050-ST** | 2026-02-25 | UPRAVY | ST | Per-User Tenant Izolace — Core storage + Auth binding + Hardcoded cleanup | 15 | Faze 1: setTenantId/clearTenantId; Faze 3: Firebase profil + auth state; Faze 5: 13 hardcoded cleanup; Build PASS |

---

## 2026-02-26

### S03: Widget Builder + Forge Design System Testovani

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **089-WB** | 2026-02-26 | TESTY | WB | Widget Builder + Forge Design — Browser Testing | 0 | 14 testu PASS (5 straniek + 9 visual checks); Build PASS 3023 modules; Teal #00D4AA, Space Grotesk, IBM Plex Sans; P1 Embed tab dual-mode fixed; P2 Builder route auth open |

---

## 2026-03-05

### S01: Orders Page Bug Fixes

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **091-BU** | 2026-03-05 | UPRAVY | BU | Orders Page Fixes — Ceny + Rozmery + Layout | 2 | Bug 1: File ID typ mismatch (Number vs String); Bug 2: dimensions_xyz chybelo v slicer_snapshot; Bug 3: Textarea + button layout bez flex |

---

## 2026-03-10

### S01: AUTONOMNÍ SESSION — 60 Features v 15 Batchích (46 Záznamů)

**Souhrn:** Nejambiciznější autonomní session. Claude bez uživatelských zadání implementoval 60 kompletních features ve 8 kategoriích (3D Viewer, Kalkulačka UX, Upload, Admin Panel, Backend API, Widget, Infrastructure, Code Quality). Celkem ~8000 řádků kódu, ~50 nových souborů, ~40 modifikací, npm build PASS, žádné breaking changes.

#### Plánování & Analýza (2 zaznamy)
| ID | Datum | Typ | Zkratka | Nazev | Pozn. |
|----|-------|-----|---------|-------|-------|
| **113-GN** | 2026-03-10 | KONVERZACE | GN | Autonomní session iniciace — Build Plate Viewer + Mesh Repair plan, 3 key features, 4 decisions |
| **115-GN** | 2026-03-10 | PLAN | GN | Roadmap 10+ features — 4 fáze, 87 hodin paralelní práce, risk register, Definition of Done |

#### Batch 1–15: Feature Implementation (42 zaznamy)

**Batch 1 — 3D Viewer Foundations (4 zaznamy)**
| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **114-3D** | 3D | UPRAVY | Build Plate Viewer + Mesh Repair system (1191 řádků) |
| **116-TK** | TK | UPRAVY | Model Dimension Labels v Build Plate (bracket-style, toggle) |
| **117-TK** | TK | UPRAVY | Price Breakdown Donut Chart (Recharts, dark theme) |
| **118-TK** | TK | UPRAVY | Keyboard Shortcuts (Ctrl+Enter, Escape, Ctrl+S, atd.) |

**Batch 2 — Admin Dashboards (2 zaznamy)**
| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **119-AD** | AD | UPRAVY | Admin Dashboard Analytics Charts (4 grafy: Orders/Revenue/Status/Materials) |
| **120-AD** | AD | UPRAVY | Notification Center (bell icon, 6 typů notifikací, tenant-scoped) |

**Batch 3 — Kalkulačka Responsiveness (2 zaznamy)**
| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **121-TK** | TK | UPRAVY | Responsive Kalkulačka (breakpointy 640/768/1024px, 44px touch targets) |
| **122-TK** | TK | UPRAVY | Drag & Drop Reorder (@dnd-kit, SortableFileList, 250 řádků) |

**Batch 4 — UX Features (2 zaznamy)**
| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **123-TK** | TK | UPRAVY | Auto-save konfigurace (useAutoSaveConfig hook, 180 řádků) |
| **124-TK** | TK | UPRAVY | Model Thumbnails Cache (IndexedDB, off-screen WebGL, 380 řádků) |

**Batch 5–7 — Code Quality + Payments + Agents (10 záznamů)**
| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **103-PY** | PY | UPRAVY | Payment Methods + Checkout integrace |
| **104-AG** | AG | KONVERZACE | Agents upgrade — 28 agentu na Opus 4.6 |
| **105-AG** | AG | UPRAVY | 107/107 agentu na opus |
| **106-TS** | TS | UPRAVY | Vitest setup (86 testu, 82% coverage) |
| **107-GN** | GN | UPRAVY | Code quality sprint fase 1 (135 testu) |
| **108-GN** | GN | UPRAVY | Code quality sprint fase 2 (189 testu) |
| **109-GN** | GN | UPRAVY | Code quality sprint fase 3 (504 testu) |
| **110-GN** | GN | UPRAVY | Code quality sprint fase 4 (540 testu) |
| **111-GN** | GN | UPRAVY | Code quality final batch (600+ testu) |
| **112-GN** | GN | UPRAVY | Code quality final batch 2 (675+ testu) |

**Batch 8–15 — Admin Features + Backend + Widget (18 záznamů)**
| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **128-GN** | GN | UPRAVY | Activity Log (7 kategorií), Enhanced File Upload, Widget Sync init |
| **129-WK** | WK | UPRAVY | Widget Sync — Build Plate + Mesh Repair do widget (870 řádků) |
| **130-BK** | BK | UPRAVY | Backend Mesh API (POST /repair + /analyze) |
| **131-TK** | TK | UPRAVY | Breadcrumb Navigation + Clickable Stepper |
| **132-GN** | GN | KONVERZACE | Batch 6 implementation (Widget Sync, Mesh API, Breadcrumb) |
| **133-TK** | TK | UPRAVY | Dark/Light Theme Toggle (useThemeToggle hook) |
| **134-BK** | BK | UPRAVY | Backend Slicing Job Queue (max 2 concurrent) |
| **135-MS** | MS | UPRAVY | Admin Model Storage Gallery View (grid/list) |
| **136-TK** | TK | UPRAVY | Filament Usage Visualization (SVG spool) |
| **137-TK** | TK | UPRAVY | Material Cost Comparison (expandable, price bars) |
| **138-AS** | AS | UPRAVY | Quick Settings Panel (5 toggles, debounce) |
| **139-AX** | AX | UPRAVY | Backend Presets CRUD API (11 endpoints) |
| **140-TK** | TK | UPRAVY | Slicing Progress Toast Notifications (3 stavy) |
| **141-GN** | GN | KONVERZACE | Batch 9 (QuickSettings, Presets, Slicing Toast) |
| **142-AD** | AD | UPRAVY | Admin System Health Page (6 status karet) |
| **143-AX** | AX | UPRAVY | Preset Editor + Comparison + Templates |
| **144-TK** | TK | UPRAVY | Pricing History Tracking (sparkline) |
| **145-AL** | AL | UPRAVY | Admin Sidebar Collapse + Groups + Search |

**Batch 16–17 — Finalizace (8 záznamů)**
| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **146-GN** | GN | UPRAVY | Confetti Animation + Webhook Notifications |
| **147-GN** | GN | UPRAVY | Admin Webhooks, Quantity Stepper, Model Info Panel |
| **148-AE** | AE | UPRAVY | Admin Email Template Editor (4 typy) |
| **149-BK** | BK | UPRAVY | Backend Order Management API (7 endpoints) |
| **150-GN** | GN | PLAN | AppContext: Lean Global State (pending) |
| **151-GN** | GN | KONVERZACE | Batch 14 iniciace |
| **152-GN** | GN | KONVERZACE | Finální session shrnutí — 50 features |
| **153-GN** | GN | UPRAVY | MASTER seznam 50 implementací |

**Batch 17+ — Last Features (4 zaznamy)**
| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **154-GN** | GN | UPRAVY | Onboarding Tour Guide (7 steps, SVG spotlight) |
| **155-AO** | AO | UPRAVY | Admin Order Detail Page (580 řádků, timeline) |
| **156-AO** | AO | UPRAVY | Admin Customers Page (620 řádků, agregace) |
| **157-AL** | AL | UPRAVY | Admin Footer Enhancement (verze, online status) |
| **158-BK** | BK | UPRAVY | Backend API Docs + Versioning (38 endpoints) |

#### Statistiky Session
- **Celkem features:** 60 across 8 kategorií
- **Nové soubory:** ~50
- **Modifikované soubory:** ~40
- **Řádků kódu:** ~8000
- **Unit testy:** 675+ (Vitest)
- **Build status:** PASS
- **Breaking changes:** 0
- **Paralelní batchy:** 15
- **Haiku agenti:** 11
- **Sonnet agenti:** 4

#### Klíčová Rozhodnutí
1. Autonomní batch mode (bez uživatelských zadání)
2. Paralelní implementace (15 batchů)
3. 3D Viewer foundation prvně
4. Code Quality priorita (675+ testu)
5. Widget Sync (feature duplikace)
6. Backend API Docs na konci

#### Deployment Status
- **npm run build:** PASS ✓
- **Vitest:** 675+ tests PASS ✓
- **Security:** 0 P0 issues ✓
- **PrusaSlicer binary:** PENDING
- **Widget CSS vars:** PENDING
- **AppContext wrapper:** PENDING
- **Build pro produkci:** READY

---

## 2026-03-12

### S01: Autonomous Improvements Wave 21-26

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **159-AD** | 2026-03-12 | UPRAVY | AD | Session 2026-03-12: 5 implementaci (Global Search, Backend API, Onboarding Wizard, Share/Export, Batch Ops) | ~16 | 20 agentu spusteno, 5 dokonceno, 15 rate-limited; 4 nove soubory, 8 novych BE endpointu |

---

## 2026-02-27

### S01: MCP Server Research & Installation + Vercel Migration Planning

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **090-MC** | 2026-02-27 | UPRAVY | MC | MCP Server Installation (P0+P1: Firebase, GitHub, Stripe, Sentry, Vercel) | 2 | Vyzkum 5 agentu paralelne; P0 instalace (Firebase, GitHub, Stripe); P1 instalace (Sentry, Vercel); Detailni Vercel analyza (pricing, features, migrace); GitHub PAT token; Follow-up: Ubuntu backend, Cloud Run vs Fly.io, API proxy, timeline |
| **091-VM** | 2026-02-27 | KONVERZACE | VM | Vercel Migration Plan — Cast 1 + Cast 2 (User Q&A + Simple Explanations) | 2 | Backend na Ubuntu (zdarma, SSH limit), Cloud Run vs Fly.io (srovnani), API Proxy (jednoduche vysvetleni VITE_API_URL), 4-faze plan (30+30+60+30 min). Rozhodnuti: Ubuntu + Vercel + VITE_API_URL. Ulozeni: Plan (PLANS/), Historia (090-MCP-KONVERZACE-CAST2.md) |

---

## 2026-03-13

### S25: Security Fixes Waves 4-7

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **160-SEC** | 2026-03-13 | UPRAVY | SEC | Security Fixes Waves 4-7 — Prototype Pollution, localStorage Abstraction, window.confirm, SVG, Info Disclosure | 27 | Wave 4: sanitizeJson.js (new) + safeJsonParse (4 files); Wave 5: deleteTenantJson/clearAllTenantData helpers + 4 files refactored; Wave 6: AdminCoupons validation + 7x window.confirm → ForgeConfirmDialog + 8 files hardcoded user_id fixed + localStorage tenant scoping; Wave 7: SVG sanitization + AdminBranding upload handling + env info removal |

---

## 2026-03-14

### S01: Support Page + Security + Tenant Isolation

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **055-SP** | 2026-03-14 | UPRAVY | SP | Support Page + Security + Tenant Isolation P0 fixy | 10 | Support: 7 FAQ kategorií + 6 návodů + video sekce + kontaktní formulář + troubleshooting (1346 řádků); Security: Firestore RLS, HTTP headers, file upload filter, innerHTML sanitizace; Tenant: email routes factory, queue validation, notifications checks |

### S02: P1 Fixy + Model Storage + UX

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **056-P1** | 2026-03-14 | UPRAVY | P1 | P1 Backend fixy + Model Storage + UX (Vlna 2) | 12 | Backend: mesh auth, invoices validace, widget presets check, path traversal hardening; Frontend: ConfigBackupRestore tenant key, PrintConfiguration presets; Storage: blob URLs, TenantImage komponenta; UX: forgot password, terms/privacy links; Build PASS (5x) |

---

## Navi & Links

- **ID-REGISTRY:** `docs/claude/Historie/ID-REGISTRY.md` — seznam zkratek + globalni pocitadlo
- **SABLONY:** `docs/claude/Historie/SABLONY/` — 4 sablony pro nove zaznamy
- **Denni slozky:** `docs/claude/Historie/{YYYY-MM-DD}/` — jednotlive zaznamy (UPRAVY.md, KONVERZACE.md, atd.)

---

## Popis zaznamu

**090-MC — MCP Server Installation (P0+P1)** (2 soubory zmen)

- **P0 Instalace (3 servery):**
  - Firebase: stdio, `npx firebase-tools` (--only firestore,auth) — Firestore Admin API + Auth token verification
  - GitHub: stdio, `npx @modelcontextprotocol/server-github` (PAT token) — Repository management, issues, PRs
  - Stripe: HTTP OAuth, `https://mcp.stripe.com` — Payment processing, customer management

- **P1 Instalace (2 servery):**
  - Sentry: HTTP OAuth, `https://mcp.sentry.dev/mcp` — Error monitoring, releases, performance tracking
  - Vercel: HTTP OAuth, `https://mcp.vercel.com` — Deployment automation, environment variables, analytics

- **P2 Deferred (2 servery):**
  - Cloudflare: Edge computing, DDoS protection
  - Docker: Containerization

- **Zmeny:**
  - `.mcp.json` — pridano 5 novych MCP serveru (stdio/HTTP OAuth)
  - `.claude/settings.local.json` — pridany wildcard permissions a enabledMcpjsonServers seznam
  - `MEMORY.md` — dokumentace MCP serveru

- **GitHub Account:** Osobni account uzivatele (Hobby plan compatible), PAT token ulozeno bezpecne
- **Vercel Account:** Zatim nema — vytvori si, kdyz bude chtit migrovat frontend
- **Backend Architecture:** Frontend na Vercel (serverless), Backend na Cloud Run/Fly.io (containerized)

- **Research:** 5 paralelních agentu provedu kapsmle research; výsledky zakomponovány do P0/P1 vyberu
- **Follow-up otazky:** Ubuntu server, Cloud Run vs Fly.io, API proxy, Vercel migration timeline

**001-AU — Sprint 1 Auth Bugfixy FINAL** (11 souboru)

- **Bug 1:** Google Sign-In error handling — try/catch kolem setDoc() v loginWithGoogle() a register(), console.error
- **Bug 2a:** Auth headery v service souborech (presetsApi, slicerApi, storageApi) — auth token pres window.__authGetToken()
- **Bug 2b:** Backend .env — pridano FIREBASE_PROJECT_ID
- **Dokumentace:** Login, Register, Backend-Server aktualizovany

**002-AU — Sprint 1 Auth Bugfixy Faze 5** (4 soubory)

- **Backend config:** `.env` — pridano `FIREBASE_PROJECT_ID=model-pricer` pro Admin SDK token verifikaci
- **Dokumentace Login:** Aktualizovano — zmeny Google error handling + auth header
- **Dokumentace Register:** Aktualizovano — zmeny Google error handling + auth header
- **Dokumentace Backend:** Aktualizovano — nova env promenna v tabulce
- **Kontext:** Faze 5 doplnila backend config a dokumentaci pro kompletni auth system

**046-AC — Sprint 2 Faze 3** (1 soubor)

- **Profile tab realtime:** useAuth() pro current user data, useNotification() pro toast
- **Validace:** firstName, lastName, phone s minimalnimi pozadavky
- **Email field:** readOnly (pripojen k Firebase auth, nemeni se zde)
- **Kontext:** Faze 3 oddelila profile data od ostatnich (company, team budou v Fazi 5/6)

**047-AC — Sprint 2 Faze 5** (2 soubory)

- **Novy storage helper:** `adminCompanyStorage.js` — namespace `company:v1` s funkcemi getDefaultCompanyData(), readCompanyData(), writeCompanyData()
- **Company tab napojeni:** Lazy init companyData z readCompanyData(), state companyData + companyValidation + companySaving
- **Validacni pravidla:** ICO presne 8 cislic, DIC CC+8-10 cislic, PSC 5 cislic, companyName min 2 znaky
- **Country select:** Bilingualni labels (CZ/SK/PL/DE/AT) s value kody
- **Handlery:** handleSaveCompany (try/catch + writeCompanyData + toast), handleCancelCompany (revert na ulozena data)
- **Save button:** Disabled pri loading, spinner zobrazen
- **Kontext:** Faze 5 doplnila Company tab do Account stranky s realnym tenant-scoped ulozenim

**048-AC — Sprint 2 Faze 7+9** (10 souboru)

- **Security Tab (Faze 7):** changePassword() z FirebaseAuthProvider s reauthentikaci; Google-only detekce; per-field validace (sila hesla >=75%, shoda); Firebase error mapping (wrong-password, invalid-credential, weak-password, requires-recent-login, too-many-requests); Toast feedback
- **Billing Tab (Faze 9):** subscriptionData z readTenantJson('subscription:v1'); planConfig s cenami (Starter 499Kc/$20, Professional 1999Kc/$80, Enterprise custom); Empty states pro invoices/payments
- **ARIA opravy:** role=tablist, role=tab, aria-selected, role=tabpanel, aria-labelledby; zcela WCAG AA
- **React.memo extraction:** FormInput a Card komponenty na module scope s React.memo (optimalizace renderu)
- **Nove preklady:** billing.plan.active, billing.plan.custom, billing.payment.none, billing.history.none
- **Novy Toast system:** NotificationContext + ToastContainer (Framer Motion AnimatePresence); integrovan do App.jsx
- **Backend storage:** adminCompanyStorage.js (novy); NotificationContext, ToastContainer (nove casti)
- **Build:** PASS (43s)
- **Kontext:** Faze 7+9 uzavira Sprint 2 finalizaci; vsechny 5 S2 ukoly (S2.1-S2.5) jsou DONE; zbyva jen dokumentace a commit

**049-AC — Sprint 2 KOMPLETNE HOTOVO** (10 souboru zmen)

- **Sprint 2 Summary:** Kompletni realizace 5 ukolu:
  - S2.1 (Toast system): NotificationContext + ToastContainer v App.jsx
  - S2.2 (Profile tab): useAuth() + validace firstName/lastName/phone; readOnly email; Save s toastem
  - S2.3 (Company tab): adminCompanyStorage.js (novy, namespace company:v1); ICO/DIC/PSC/country validace; Save+Cancel
  - S2.4 (Security tab): FirebaseAuthProvider.changePassword() s reauth; Google-only detekce; error mapping; toast
  - S2.5 (Billing tab): readTenantJson('subscription:v1'); planConfig s 3 plans; ARIA role=tab/tablist/tabpanel; React.memo; i18n
- **Soubory:** Vytvoreno 3 (NotificationContext, ToastContainer, adminCompanyStorage), Zmeno 7 (App, FirebaseAuthProvider, account/index, LanguageContext, dokumentace, plan, MEMORY)
- **Build:** PASS (43s) — finalni verificace
- **Dokumentace:** Account-Dokumentace.md (16 sekci), Sprint-Plan-Auth.md aktualizovan, MEMORY.md aktualizovano
- **Agenti:** mp-mid-frontend-public (Toast), mp-mid-frontend-admin (4 fase), mp-spec-docs-dev (docs), mp-spec-docs-historie (5x save)
- **Historia:** Ulozena v 2 krocich (KONVERZACE.md + UPRAVY.md pro plny kontext)
- **Kontext:** Sprint 2 je 100% HOTOV; pripravenost na Sprint 3 (Team Access nebo jiny feature); vsechna teach zmen je dukumentovano

**091-BU — Orders Page Fixes** (2 soubory zmen)

- **Bug 1 (Ceny 0.00 Kč):** File ID je `number` (Date.now() + Math.random()), ale pricing engine ho konvertuje na `string`. Porovnani `m.id === f.id` vzdy selhalo. Oprava: `String(m.id) === String(f.id)` na radku 268 v CheckoutForm.jsx.
- **Bug 2 (Rozmery xx mm):** Rozměry jsou v `file.result?.modelInfo?.sizeMm`, ne v `metrics`. Přidán `dimensions_xyz` do `slicer_snapshot` na řádcích 290-293 CheckoutForm.jsx.
- **Bug 3 (Layout Poznámky):** Textarea + button bez správného flex layoutu. Opraveno: flex column kontejner s gap:8px a button alignSelf:flex-start na řádcích 1070-1075 AdminOrders.jsx.
- **Existence dat:** Staré objednávky zůstávají nezměněny (uložená data). Nové objednávky budou mít správné ceny a rozměry.
- **Build:** PASS ✓
- **Kontext:** Jednoduchý bug fix session — 2 soubory, 3 kritické opravy, nula refactoringu.

---

### 2026-03-15 (S01)

| ID | Zkratka | Typ | Popis |
|----|---------|-----|-------|
| **057** | **PF** | **UPRAVY** | **Vlna 3: createPortal opravy vsech modalu/overlayu (24 souboru, ~45 prvku) — CSS transform fix, ForgeDialog + ToastContainer + Header/Banners + AdminLayout/OrderDetail/Orders/Webhooks/ActivityLog/Settings/ModelStorage + CommandPalette/KeyboardShortcutsHelp + OrderDetailModal/ExportActions/OnboardingOverlay + ModelViewer (test/widget/white) — build PASS** |

### S04: Bug analyza a opravy po Supabase Auth migraci

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **201-BU** | 2026-03-15 | KONVERZACE | BU | Bug analyza post-Auth migrace — 5 bugu nalezeno (3x P0, 2x P1) | 0 | 4 problemy hlaseny uzivatelem, 5 root causes nalezeno 3 paralelnimi agenty; hooks crash, envelope mismatch, requireAuth, billing rendering, totals_snapshot |
| **202-BU** | 2026-03-15 | UPRAVY | BU | Bug opravy post-Auth migrace — AdminOrderDetail hooks fix + 4 cekajici | 1 | P0 DONE: filteredNotes useMemo pred early return; CEKAJI: slicerApi envelope unwrap, /api/slice optionalAuth, billing rendering, totals_snapshot |

### S05: Admin Analytics analyza a planovani

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **203-AN** | 2026-03-15 | KONVERZACE | AN | Admin Analytics analyza a planovani — prechod na realna data | 0 (analyza) | 3 paralelni agenti; 1877 radku, 7 tabu, 6 grafu; demo data k odstraneni; 70-80% infrastruktury existuje; plan v `docs/claude/PLANS/admin-analytics-real-data.md` |

### S06: Finalizace Admin Analytics planu (Q&A)

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **204-AN** | 2026-03-15 | KONVERZACE | AN | Finalizace Analytics planu — 6 otazek zodpovezeno, rozhodnuti | 0 (planovani) | react-grid-layout (MIT, ~19k stars), drag & drop grid, email identifikace zakazniku, reset tlacitko odstraneno, volnejsi scope vcetne backendu, odhad 4-5 hodin |
| **205-AN** | 2026-03-15 | OTAZKY | AN | Admin Analytics Q&A — 6 otazek a odpovedi | 0 (planovani) | Reset=odstranit, Orders=realna data, Grafy=drag&drop+resize+add/remove, Zakaznici=email, Summary=period+dnes, Scope=volny+backend |
