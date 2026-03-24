# 00 — MASTER DOKUMENTACE

Hlavni index vsech dokumentacnich souboru projektu ModelPricer / Pricer V3.

Verze: 1.0
Datum aktualizace: 2026-03-22

---

## Navigace po dokumentaci

### Jak pouzivat tento soubor

Tento dokument je **centralni rozcestnik** — obsahuje seznam a kratkejici popis VSECH technickych dokumentu projektu. Kdyz chces najit dokumentaci neco:

1. **Prikklad 1:** Potrebujem informace o Customer Portalu
   - Hledej: "Customer Portal" (sekce 2.1)
   - Viz: `Customer-Portal-Dokumentace.md`

2. **Prikklad 2:** Potrebujem pochopit jak funguje Storage system
   - Hledej: "Storage & Tenant Scoping" (sekce 3.1)
   - Viz: `Storage-Utilities-Dokumentace.md`

3. **Prikklad 3:** Chci spravit bug v admin dashboard
   - Hledej: "Admin Pages & Dashboard" (sekce 1.4)
   - Viz: `Admin-Dashboard-Dokumentace.md` (pokud existuje)

---

## 1. FRONTEND DOKUMENTACE

### 1.1 Customer Portal (`/portal/*`)

**Dokument:** `Customer-Portal-Dokumentace.md`

**Obsah:**
- Prehled — co je portal, proc existuje
- Architektura — React komponenty, context, API
- Routing — `/portal/login`, `/portal/orders`, `/portal/models`, atd.
- Komponenty — detailni popis (CustomerDashboard, CustomerLogin, CustomerOrders, atd.)
- Backend API — 22 endpointu (dashboard, profil, objednavky, modely, presety, adresy, notifikace)
- Data model — JSON store per tenant
- Bezpecnost — auth, tenant isolation, GDPR, rate limiting
- i18n — lokalizace (cs + en)
- Testing — unit, integration, E2E
- Performance — lazy loading, caching, virtualizace

**Kdo cte:** Developerи pracujici na customer portalu, onboarding

---

### 1.2 Admin Pages & Dashboard

**Dokumenty (rozpracovane):**
- `Admin-Dashboard-Dokumentace.md` (pokud existuje)
- `AUDIT-AdminPages-2026-03-16.md` (audit, ne dokumentace)

**Obsah:**
- Admin routing (`/admin/*`)
- Admin pages (Branding, Pricing, Fees, Parameters, Presets, Orders, Analytics, Team, Widget)
- Permission system (role-based access)
- Tenant management

**Kdo cte:** Admin developerи, system administrati

---

### 1.3 Test Kalkulacka

**Dokument:** `Test-Kalkulacka-Dokumentace.md` (pokud existuje)

**Obsah:**
- Architektura test kalkulacky
- Komponenty
- State management
- Uzivatelskeho testovani

**Poznamka:** Widget kalkulacka je verejny duplikat test-kalkulacky (`/src/pages/widget-kalkulacka/`)

---

### 1.4 Widget Kalkulacka

**Dokument:** `Widget-Kalkulacka-Dokumentace.md`

**Obsah:**
- Public widget (`/w/:publicWidgetId`)
- Embedding externe (postMessage API)
- Hosting a delivery
- Bezpecnost (domain whitelist, origin validation)
- Vs. test-kalkulacka — rozdily

---

### 1.5 Widget Builder (VvvebJs-inspired visual editor)

**Dokument:** `Widget-Builder-Dokumentace.md`

**Obsah:**
- Architektura — 3-panel visual editor
- Blocks — 32 bloky (Calculator, Layout, Content, Form)
- Themes — 12 presety
- Components — BuilderCanvas, ElementRenderer, PreviewMode, atd.
- Property editors — 12 typu (Color, Number, Text, Boolean, atd.)
- Features — HTML5 DnD, undo/redo, auto-save, device frames
- Code editor s syntax highlighting

**Poznamka:** Widget builder je nova feature (session 2026-03-21), obsah vidim v Memory.md

---

### 1.6 Design System — Forge

**Dokument:** `Forge-Design-System-Dokumentace.md` (pokud existuje)

**Obsah:**
- Forge tokeny (`forge-tokens.css`)
- Barvy, typografie, spacing
- Komponenty UI (ForgeButton, ForgeStatusBadge, ForgeStatCard, atd.)
- Dark theme (WCAG AA compliance)
- Ikony (AppIcon component)

---

### 1.7 Routing & Routes

**Dokument:** `Routing-Dokumentace.md` (HOTOVO — 2026-03-22)

**Obsah:**
- Struktura Routes.jsx
- Public routes (home, pricing, support, model-upload, public widget)
- Admin routes (protected) — branding, pricing, fees, parameters, presets, orders, analytics, team, widget
- Customer portal routes (protected) — login, register, dashboard, orders, models, presets, profile, support
- Lazy loading (React.lazy + Suspense)
- Error boundaries (ErrorBoundary wrapper)
- Redirect logika (return URL parametr, role-based)
- Bezpecnost & invarianty

---

### 1.8 Internationalization (i18n)

**Dokument:** `LanguageContext-Dokumentace.md` (pokud existuje)

**Obsah:**
- react-i18next nastaveni
- Translation soubory (`src/locales/{cs,en}/`)
- useLanguage hook
- useTranslation hook
- Prictiny cs/en lokalizace

---

### 1.9 Account & Auth (Frontend)

**Dokument:** `Account-Dokumentace.md`

**Obsah:**
- Account page
- Auth UI komponenty
- Login/Register flow
- Password reset
- Google Sign-In

---

### 1.10 Public Pages

**Dokument:** (rozpracovane — asi neni)

**Obsah:**
- Home page (`/`)
- Pricing page (`/pricing`)
- Support page (`/support`)
- Model Upload (`/model-upload`)
- Privacy, Terms, atd.

---

## 2. BACKEND DOKUMENTACE

### 2.1 Infrastructure & Build

**Dokument:** `Infrastructure-Dokumentace.md` (pokud existuje)

**Obsah:**
- Vite nastaveni (`vite.config.mjs`)
- Express backend (`backend-local/`)
- Middleware (auth, rateLimit, validate)
- Error handling
- Logging
- Docker, Cloud Run (Cloudflare R2, Supabase)

---

### 2.2 Pricing Engine V3

**Dokument:** `Pricing-Engine-Dokumentace.md`

**Obsah:**
- Algoritmus kalkulace (material, quality, size, infill, atd.)
- Cena vyroba
- Sleva volumove
- Cena za dopravu
- Nastaveni pricing parametru (admin)
- Backend: `pricingEngineV3.js`

---

### 2.3 Storage & Tenant Scoping

**Dokument:** `Storage-Utilities-Dokumentace.md`

**Obsah:**
- Tenant scoping system — `getTenantId()` entrypoint
- Storage namespaces (`modelpricer:${tenantId}:*`)
- Helper funkce (adminPricingStorage, adminFeesStorage, atd.)
- JSON persistence
- Cache & TTL

---

### 2.4 Supabase Integration

**Dokument:** `Supabase-Dokumentace.md` (pokud existuje)

**Obsah:**
- Supabase setup (PostgreSQL, RLS)
- Storage adapter (migrace z localStorage → Supabase)
- Auth bridge (Firebase → Supabase third-party)
- Migrace dat (25 tabulek)
- RLS policies
- Demo tenant ID

---

### 2.5 API & Endpoints

**Dokument:** (rozpracovane — popis je v jednotlivych *-Dokumentace.md souborech)

**Obsah:**
- Admin API (`/api/admin/*`)
- Customer API (`/api/customer/*`)
- Slicer API (`/api/slicer/*`)
- Storage API (`/api/storage/*`)
- Order API (`/api/orders/*`)
- Model Upload (`/api/models/*`)
- Presets API (`/api/presets/*`)

---

### 2.6 Build & Vite Config

**Dokument:** `Build-Config-Dokumentace.md` (pokud existuje)

**Obsah:**
- Vite port 4028
- Alias `@` → `src/`
- Build output `build/`
- Dev proxy `/api` → backend :3001
- CSS preprocessor (postcss)
- Code splitting

---

## 3. SYSTEMY & INTEGRACE

### 3.1 Firebase & Authentication

**Dokument:** (rozpracovane — popis je v Account-Dokumentace.md)

**Obsah:**
- Firebase setup
- Email/password auth
- Google Sign-In
- Custom claims (role)
- JWT generation
- Admin SDK (backend)

---

### 3.2 Shopify Integration

**Dokument:** (rozpracovane)

**Obsah:**
- Storefront API
- Cart management
- Fee handling
- Per-variant vs universal fee

---

### 3.3 3D Model Processing (PrusaSlicer)

**Dokument:** (rozpracovane)

**Obsah:**
- PrusaSlicer API
- Model slicing
- Time & material estimation
- Integraci s kalkulackou

---

### 3.4 Email Notifications

**Dokument:** (rozpracovane — popis je v Infrastructure-Dokumentace.md)

**Obsah:**
- Resend provider
- Order email templates
- Invoice PDF generation
- Status update notifications

---

### 3.5 Payment Processing

**Dokument:** (rozpracovane)

**Obsah:**
- Stripe integration
- Payment methods
- Order fulfillment
- Refund handling

---

### 3.6 Monitoring & Logging

**Dokument:** (rozpracovane — popis je v Infrastructure-Dokumentace.md)

**Obsah:**
- Sentry setup
- Error tracking
- Performance monitoring
- Log aggregation

---

## 4. AUDIT & BUG REPORTS

### 4.1 Project Audits

| Soubor | Datum | Scope |
|--------|-------|-------|
| `AUDIT-FULL-PROJECT-2026-03-16.md` | 2026-03-16 | Komplexni audit (frontend, backend, design) |
| `AUDIT-AdminPages-2026-03-16.md` | 2026-03-16 | Admin stranky (routy, komponenty) |
| `AUDIT-PublicPages-2026-03-16.md` | 2026-03-16 | Public stranky (home, pricing, support) |
| `AUDIT-AdminAnalytics-2026-03-16.md` | 2026-03-16 | Admin Analytics stranka |

---

### 4.2 Bug Scans

| Soubor | Datum | Scope | Nalezu |
|--------|-------|-------|--------|
| `Project-Bug-Scan-1.md` | 2026-03-19 | Obecne | ~40 |
| `Project-Bug-Scan-2A-Admin.md` | 2026-03-19 | Admin stranky | ~30 |
| `Project-Bug-Scan-2B-Components.md` | 2026-03-19 | UI komponenty | ~20 |
| `Project-Bug-Scan-2C-Kalkulacka-Backend.md` | 2026-03-19 | Kalkulacka + backend | ~25 |
| `Project-Bug-Scan-2D-Hooks-Utils-Lib.md` | 2026-03-19 | Hooks, utils, lib | ~20 |
| `Project-Bug-Scan-2F-Routing-Config.md` | 2026-03-19 | Routing, config | ~15 |
| `Project-Bug-Scan-4-Kalkulacka-Deep.md` | 2026-03-19 | Kalkulacka (deep dive) | ~30 |
| `SafeNum-Input-Bug-Audit.md` | 2026-03-18 | SafeNum formatter (detaily) | ~60 |

---

### 4.3 Security Audits

Bezpecnostni audity jsou v PLANS sekci (viz nize).

---

## 5. PLANY A ROADMAPA

**Lokace:** `docs/claude/PLANS/`

| Soubor | Typ | Status |
|--------|-----|--------|
| `MASTER-BETA-INFRASTRUCTURE-PLAN.md` | Infrastruktura | V realizaci (Wave 1-9) |
| `BETA-CHECKLIST-STATUS.md` | Checklist | Live (70% hotovo) |
| `beta-readiness-audit-2026-03-16.md` | Audit | Dokonceno |
| `Redesign-Bugfix-Plan-2026-02-10.md` | Redesign | Dokonceno |
| Ostatni planove soubory | Archiv | — |

---

## 6. REFERENCE & POZADAVKY

### 6.1 Hlavni pravidla projektu

**Dokument:** `/CLAUDE.md` v rootu repozitare (ne v `docs/`)

**Obsah:**
- Pravidla pro planovani a implementaci (P0)
- Povinne dotazovani pred planem
- Historie system
- Dokumentace povinna po kazde zmene
- Storage standards
- Importy & build stabilita
- Git pravidla
- Quality gates
- Prompt injection prevention (bezpecnost P0)

---

### 6.2 Domeny & Agent Mapa

**Dokument:** `docs/claude/AGENT_MAP.md`

**Obsah:**
- 107 agentu v 13 domenach
- Hierarchie (Senior/Middle/Specific)
- Odpovedznost kazdcho agenta
- Hot spot ownership

---

### 6.3 Skills Mapa

**Dokument:** `docs/claude/SKILLS_MAP.md`

**Obsah:**
- 29 skills (CLI commands, automatizace)
- Kategorie (git, testing, linting, atd.)
- Jak instalovat a pouzivat

---

### 6.4 Project Struktura

**Dokument:** `docs/claude/PROJECT_STRUCTURE.md` (pokud existuje)

**Obsah:**
- Mapa souboru a slozek
- Nazevni konvence
- Klicove cesty

---

### 6.5 Pravidla pro praci

**Dokumenty:**
- `docs/claude/Pravidla/Hlavní_Pozadavky.md` — hlavni pozadavky planovani
- `docs/claude/Pravidla/4kroky.md` — 4 povinne kontrolni kroky po implementaci

---

## 7. HISTORIE KONVERZACI

**Lokace:** `docs/claude/Historie/`

**Obsah:**
- `MASTER-HISTORIE.md` — centralni index vsech zaznamu
- `ID-REGISTRY.md` — registr zkratek + pocitadlo
- `SABLONY/` — 4 sablony (KONVERZACE, UPRAVY, OTAZKY, DENNI-PREHLED)
- `{YYYY-MM-DD}/` — denni slozky s historickymi zaznamy

---

## 8. MEMORY & UCENI

**Dokument:** `.claude/memory/MEMORY.md`

**Obsah:**
- MCP servery (10 celkem)
- Klicove cesty
- Konvence
- Agent hierarchie
- Hot spots (problematicke soubory)
- Pasti (veci ktere vypadaji spravne ale nefunguji)
- Audit findings (bezpecnost, performance)
- Lessons learned

---

## 9. MCP SETUP & EXTERNAL TOOLS

**Dokument:** `docs/claude/MCP_SETUP_VSCODE.md` (nebo `MCP_SETUP.md`)

**Obsah:**
- MCP servers (Supabase, Context7, Brave, atd.)
- Jak pripojit MCP server
- Konfigurace
- Bezpecnost

---

## 10. SEZNAM VSECH DOKUMENTACNICH SOUBORU

Abecedne radeni:

```
docs/claude/Documentation/
├── 00-MASTER-Dokumentace.md              ← YOU ARE HERE
├── Account-Dokumentace.md
├── Admin-Dashboard-Dokumentace.md        (pokud existuje)
├── Build-Config-Dokumentace.md           (pokud existuje)
├── Customer-Portal-Dokumentace.md        (HOTOVO — 2026-03-22)
├── Customer-Portal-Research-Part1-Features.md        (research doc)
├── Customer-Portal-Research-Part2-Competitors.md     (research doc)
├── Customer-Portal-Research-Part3-Technical.md       (research doc)
├── Forge-Design-System-Dokumentace.md    (pokud existuje)
├── Infrastructure-Dokumentace.md         (pokud existuje)
├── LanguageContext-Dokumentace.md        (pokud existuje)
├── Pricing-Engine-Dokumentace.md         (pokud existuje)
├── Routing-Dokumentace.md                (HOTOVO — 2026-03-22)
├── Storage-Utilities-Dokumentace.md      (pokud existuje)
├── Supabase-Dokumentace.md               (pokud existuje)
├── Test-Kalkulacka-Dokumentace.md        (pokud existuje)
├── Widget-Builder-Dokumentace.md
├── Widget-Kalkulacka-Dokumentace.md
├── AUDIT-FULL-PROJECT-2026-03-16.md
├── AUDIT-AdminPages-2026-03-16.md
├── AUDIT-PublicPages-2026-03-16.md
├── AUDIT-AdminAnalytics-2026-03-16.md
├── Project-Bug-Scan-*.md                 (7 souboru)
└── SafeNum-Input-Bug-Audit.md
```

---

## 11. RYCHLY INDEX — JAK NAJIT CO POTREBUJI

| Potrebuji pochopit... | Viz dokument | Sekce |
|----------------------|--------------|-------|
| Customer Portal (`/portal`) | Customer-Portal-Dokumentace.md | 1-11 |
| Routing system (`src/Routes.jsx`) | Routing-Dokumentace.md | 1-10 |
| Admin Dashboard (`/admin`) | Admin-Dashboard-Dokumentace.md | (pokud existuje) |
| Pricing algoritmus | Pricing-Engine-Dokumentace.md | — |
| Tenant scoping & storage | Storage-Utilities-Dokumentace.md | — |
| Widget kalkulacka | Widget-Kalkulacka-Dokumentace.md | — |
| Widget builder (visual editor) | Widget-Builder-Dokumentace.md | — |
| Design system (Forge) | Forge-Design-System-Dokumentace.md | — |
| i18n & lokalizace | LanguageContext-Dokumentace.md | — |
| Account & Auth | Account-Dokumentace.md | — |
| Supabase migrace | Supabase-Dokumentace.md | — |
| Backend infrastruktura | Infrastructure-Dokumentace.md | — |
| Build & Vite | Build-Config-Dokumentace.md | — |
| Agent system | docs/claude/AGENT_MAP.md | — |
| Skills | docs/claude/SKILLS_MAP.md | — |
| CLAUDE.md pravidla | /CLAUDE.md v rootu | Sekce 0-20 |
| Historia konverzaci | docs/claude/Historie/ | — |

---

## 12. POZNAMKY PRO MAINTAINERY

### Pravidla pro udrzbu tohoto dokumentu

1. **Update po kazde nove dokumentaci** — kdyz vytvoris novy soubor v `Documentation/`, aktualizuj tento dokument (sekce 10)
2. **Linky jsou relativni** — uz je v adresari `docs/claude/Documentation/`
3. **Datum aktualizace** — na zacatku dokumentu (`Datum aktualizace: YYYY-MM-DD`)
4. **ASCII safe** — bez diakritiky (pro kompatibilitu se starymi systemy)

### Sekce ktere potrebuji vypleneni (TODO)

- [x] Customer-Portal-Dokumentace.md — HOTOVO (2026-03-22)
- [x] Routing-Dokumentace.md — HOTOVO (2026-03-22)
- [ ] Admin-Dashboard-Dokumentace.md — neexistuje, potreba vytvoreni
- [ ] Build-Config-Dokumentace.md — neexistuje, potreba vytvoreni
- [ ] Forge-Design-System-Dokumentace.md — neexistuje, potreba vytvoreni
- [ ] Infrastructure-Dokumentace.md — neexistuje, potreba vytvoreni
- [ ] LanguageContext-Dokumentace.md — neexistuje, potreba vytvoreni
- [ ] Pricing-Engine-Dokumentace.md — neexistuje, potreba vytvoreni
- [ ] Storage-Utilities-Dokumentace.md — neexistuje, potreba vytvoreni
- [ ] Supabase-Dokumentace.md — neexistuje, potreba vytvoreni
- [ ] Test-Kalkulacka-Dokumentace.md — neexistuje, potreba vytvoreni

---

## 13. Zmeny v tomto dokumentu

| Datum | Zmena | Autor |
|-------|-------|-------|
| 2026-03-22 | Vytvoreni Routing-Dokumentace.md + aktualizace master | Claude Code |
| 2026-03-22 | Aktualizace: Customer-Portal-Dokumentace.md jako HOTOVO + research entries | Claude Code |
| 2026-03-22 | Vytvoreni master dokumentu + pridan Customer-Portal-Dokumentace.md | Claude Code |

