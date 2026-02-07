# AGENT_MAP.md — Hierarchicka mapa agentu ModelPricer / Pricer V3

> **Zdroj pravdy** pro agentni ekosystem. Odkazovano z `CLAUDE.md` sekce 3.
> Posledni aktualizace: 2026-02-06

---

## 0) Prehled + Statistiky

### Hierarchicky princip
- **Senior (sr)** = vlastni celou domenu, architekturalni rozhodnuti, review, delegace. Model: **opus**
- **Middle (mid)** = vlastni 2-4 podoblasti, implementace stredne slozitych ukolu. Model: **Opus**
- **Specific (spec)** = ultra-uzky scope, 1 konkretni vec, minimalni chybovost. Model: **Opus** nebo **sonnet**

### Pojmenovaci konvence
`mp-{tier}-{domena}-{specializace}`
- `mp-sr-frontend` = Senior Frontend
- `mp-mid-frontend-public` = Middle Frontend Public Pages
- `mp-spec-fe-forms` = Specific Frontend Forms

### Celkove statistiky

| Domena | Senior | Middle | Specific | Celkem |
|--------|--------|--------|----------|--------|
| Frontend | 1 | 3 | 12 | **16** |
| Design & UX | 1 | 2 | 5 | **8** |
| Backend | 1 | 3 | 8 | **12** |
| Pricing & Business | 1 | 2 | 6 | **9** |
| Storage & Data | 1 | 2 | 4 | **7** |
| Security | 1 | 2 | 5 | **8** |
| Testing & Quality | 1 | 2 | 6 | **9** |
| Infrastructure | 1 | 2 | 4 | **7** |
| i18n & Lokalizace | 1 | 0 | 3 | **4** |
| 3D & Mesh | 1 | 0 | 3 | **4** |
| E-commerce & Integrace | 1 | 0 | 4 | **5** |
| Planovani & Orchestrace | 1 | 0 | 6 | **7** |
| Dokumentace & Research | 1 | 0 | 4 | **5** |
| **CELKEM** | **13** | **18** | **70** | **101** |

---

## 1) Frontend Domena (16 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-frontend` | Senior Frontend — architektura, patterns, React/Vite/JSX, code standards, delegace | opus | Cely `/src/` (read+review), deleguje na middle/specific |

### Middle (3)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-mid-frontend-public` | Public stranky + kalkulacka + marketing | sonnet | `/src/pages/home/`, `/src/pages/pricing/`, `/src/pages/support/`, `/src/pages/model-upload/`, `/src/pages/test-kalkulacka/`, `/src/components/marketing/` |
| `mp-mid-frontend-admin` | Admin panel — vsechny admin stranky, admin layout, admin UX | sonnet | `/src/pages/admin/`, `AdminLayout.jsx` |
| `mp-mid-frontend-widget` | Widget kalkulacka, embed, postMessage, widget builder, verejna route | sonnet | `/src/pages/widget/`, `/src/pages/widget-kalkulacka/`, widget routes |

### Specific (12)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-fe-layout` | Responsive layout — grid, flexbox, breakpoints, page structure | sonnet | Layout patterns v `/src/pages/`, `/src/components/ui/Container.jsx` |
| `mp-spec-fe-forms` | Formulare — React Hook Form, Zod validace, input UX, error states | sonnet | Vsechny form komponenty, validacni logika |
| `mp-spec-fe-3d-viewer` | 3D prohlizec — Three.js, STLLoader, OBJLoader, 3MFLoader, kamera, osvetleni | sonnet | `ModelViewer.jsx`, `FilePreview.jsx`, Three.js konfigurace |
| `mp-spec-fe-state` | State management — React state, context, Zustand, Jotai (budouci) | sonnet | `/src/context/`, hooks, state patterns |
| `mp-spec-fe-animations` | Animace a mikro-interakce — CSS transitions, loading states, skeleton screens | haiku | `/src/components/marketing/`, animacni patterns |
| `mp-spec-fe-tables` | Tabulky a data gridy — sortovani, filtrovani, paginace, responsive tables | sonnet | Admin tabulky v `/src/pages/admin/` |
| `mp-spec-fe-charts` | Grafy a vizualizace — Recharts, Chart.js, dashboard metriky | sonnet | `/src/pages/admin/AdminAnalytics.jsx`, graf komponenty |
| `mp-spec-fe-kanban` | Kanban board — drag-and-drop (@dnd-kit), karty, sloupce, WIP limity | sonnet | Admin Orders Kanban view (budouci Sekce 14) |
| `mp-spec-fe-upload` | File upload UX — drag-and-drop zona, progress bar, multi-file, validace klientska | sonnet | `FileUploadZone.jsx`, upload komponenty |
| `mp-spec-fe-checkout` | Checkout flow — kroky objednavky, souhrn, potvrzeni, CTA | sonnet | Checkout/order completion komponenty (budouci Sekce 2) |
| `mp-spec-fe-notifications` | Notifikacni UI — toast messages, alert banners, badge counts, notification center | haiku | Notifikacni komponenty (budouci Sekce 7/11) |
| `mp-spec-fe-routing` | Routing — React Router, route guards, lazy loading, code splitting | sonnet | `/src/Routes.jsx`, route konfigurace |

---

## 2) Design & UX Domena (8 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-design` | Senior Design — design system, vizualni konzistence, brand alignment, anti-AI-generic | opus | Cely design system, vizualni review |

### Middle (2)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-mid-design-system` | Design System — UI tokeny, component library, barvy, typografie, spacing | sonnet | `/src/components/ui/*`, design tokens |
| `mp-mid-design-ux` | UX Design — user flows, interakcni patterns, usability, cognitive load | sonnet | Vsechny user-facing stranky (review) |

### Specific (5)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-design-responsive` | Responsive design — mobile-first, touch interakce, breakpoints | sonnet | Media queries, responsive patterns |
| `mp-spec-design-a11y` | Accessibility — WCAG 2.1 AA, keyboard navigace, ARIA, kontrast, screen reader | sonnet | UI komponenty (a11y audit + patche) |
| `mp-spec-design-user-friendly` | User-Friendly design — intuitivni rozhrani, error prevence, jasne labely | haiku | UX review vsech stranek |
| `mp-spec-design-onboarding` | Onboarding UX — guided tours, tooltips, first-time experience (Driver.js, Shepherd.js) | sonnet | Onboarding komponenty (budouci Sekce 22) |
| `mp-spec-design-icons` | Ikony a vizualni prvky — ikonovy system, ilustrace, placeholdery, empty states | haiku | `/src/components/ui/Icon.jsx`, ikony |

---

## 3) Backend Domena (12 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-backend` | Senior Backend — Node.js ESM architektura, API design, error handling, middleware patterns | opus | Cely `/backend-local/`, API kontrakty |

### Middle (3)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-mid-backend-api` | REST API — endpointy, request/response, validace, error codes, versioning | sonnet | `/backend-local/` route handlers, controllers |
| `mp-mid-backend-services` | Business services — integrace, orchestrace logiky, background joby | sonnet | `/backend-local/` services |
| `mp-mid-backend-data` | Data layer — databazove modely, queries, Prisma ORM (budouci), migrace | sonnet | DB schema, ORM konfigurace |

### Specific (8)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-be-slicer` | PrusaSlicer CLI — spawn, timeout, parsing metrik, preset/INI flow, Win/Linux | sonnet | `/backend-local/` slicer-related kodu |
| `mp-spec-be-upload` | File upload processing — 3D validace, konverze formatu, mesh analyza, STEP->STL | sonnet | Upload handling, file processing pipeline |
| `mp-spec-be-email` | Email service — Nodemailer/Resend, React Email sablony, BullMQ fronta, tracking | sonnet | Email service (budouci Sekce 7) |
| `mp-spec-be-auth` | Autentizace — Firebase Auth, JWT, session management, role-based access | sonnet | `/src/context/AuthContext.jsx`, `/src/hooks/useAuth.js`, auth middleware |
| `mp-spec-be-queue` | Job queue — BullMQ, Redis, background tasks, scheduled jobs, retry logika | sonnet | Queue workers (budouci) |
| `mp-spec-be-websocket` | Real-time komunikace — Socket.io/WebSocket, live updates, chat (budouci Sekce 11) | sonnet | WebSocket server, events |
| `mp-spec-be-pdf` | PDF/dokument generovani — @react-pdf/renderer, PDFKit, faktury, dodaci listy | sonnet | Document generation (budouci Sekce 13) |
| `mp-spec-be-webhooks` | Webhooks — outgoing webhooks, event bus, retry, signature verification | sonnet | Webhook system (budouci Sekce 20) |

---

## 4) Pricing & Business Logic Domena (9 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-pricing` | Senior Pricing — pricing pipeline architektura, determinismus, strategy pattern | opus | `/src/lib/pricing/`, cenova logika |

### Middle (2)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-mid-pricing-engine` | Pricing engine — base->fees->markup->minima->rounding pipeline, breakdown | sonnet | `/src/lib/pricing/pricingEngineV3.js`, `/src/lib/pricingService.js` |
| `mp-mid-pricing-discounts` | Slevy a promakce — kupony, mnozstevni slevy, promo akce, flash sales | sonnet | Discount logika (budouci Sekce 5, 10) |

### Specific (6)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-pricing-fees` | Fees & prplatky — MODEL/ORDER fees, post-processing, express surcharges, hidden fees | sonnet | `/src/utils/adminFeesStorage.js`, fee logika |
| `mp-spec-pricing-shipping` | Doprava — shipping metody, cenova pasma dle hmotnosti, free shipping podminka | sonnet | Shipping logic (budouci Sekce 4) |
| `mp-spec-pricing-tax` | Dane — DPH/VAT sazby, reverse charge, VIES validace, B2B pravidla | sonnet | Tax calculation (budouci Sekce 21) |
| `mp-spec-pricing-currency` | Multi-mena — dinero.js, exchange rates, Intl.NumberFormat, lokalni formatovani | sonnet | Currency (budouci Sekce 16) |
| `mp-spec-pricing-coupons` | Kuponovy system — validace, typy slev, limity, expirace, kombinovani | sonnet | Coupon engine (budouci Sekce 10) |
| `mp-spec-pricing-methods` | Cenotvorne metody — BoundingBox, Volume, Weight, Time, Slicer-based strategie | sonnet | Pricing strategies (budouci Sekce 15) |

---

## 5) Storage & Data Domena (7 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-storage` | Senior Storage — data architektura, storage strategie, tenant isolation | opus | Vsechny storage helpery, data flow |

### Middle (2)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-mid-storage-tenant` | Tenant localStorage — namespace konvence, helpery, CRUD, idempotence | sonnet | `/src/utils/admin*Storage.js` |
| `mp-mid-storage-db` | Databaze — PostgreSQL/Prisma schema, indexy, queries, performance (budouci Sekce 18) | sonnet | DB modely, migrace |

### Specific (4)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-storage-tenant-id` | TenantID — getTenantId() pouziti, tenant scoping, izolace dat | haiku | `adminTenantStorage.js`, tenant klice |
| `mp-spec-storage-migration` | Storage migrace — legacy klice, schema versioning, data transformace | sonnet | Migracni skripty |
| `mp-spec-storage-cache` | Caching — React Query (budouci), memoizace, localStorage cache, invalidace | sonnet | Cache patterns |
| `mp-spec-storage-branding` | Branding storage — widget config, logo, barvy, branding persistence | haiku | `/src/utils/adminBrandingWidgetStorage.js` |

---

## 6) Security Domena (8 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-security` | Senior Security — threat modeling, OWASP top 10, security architektura | opus | Cely repo (security review) |

### Middle (2)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-mid-security-app` | Aplikacni bezpecnost — XSS, CSRF, injection prevence, sanitizace, CSP | sonnet | Frontend + backend security |
| `mp-mid-security-infra` | Infrastrukturni bezpecnost — CORS, headers, rate limiting, helmet.js, HTTPS | sonnet | Server konfigurace, middleware |

### Specific (5)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-security-api-keys` | API klice & secrets — .env soubory, secret rotace, public key exposure prevence | haiku | `.env`, `.gitignore`, config soubory |
| `mp-spec-security-upload` | Upload bezpecnost — MIME validace, file size, malware prevence, sandbox | sonnet | Upload endpoint, file processing |
| `mp-spec-security-auth` | Auth bezpecnost — password hashing (argon2/bcrypt), brute-force, session hijacking | sonnet | Auth flow, login/register |
| `mp-spec-security-injection` | Prompt Injection — MCP sken, skill vetting, config poisoning, CLAUDE.md sekce 19 | sonnet | Externi veci, MCP, skills |
| `mp-spec-security-gdpr` | GDPR compliance — data export, pravo na vymaz, souhlas, cookie policy | sonnet | Privacy features (budouci Sekce 21) |

---

## 7) Testing & Quality Domena (9 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-quality` | Senior Quality — testing strategie, code review standardy, quality gates | opus | Cely repo (quality review) |

### Middle (2)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-mid-quality-code` | Code Quality — code review, lint, formatting, patterns, best practices | sonnet | Cely repo (read-only review) |
| `mp-mid-quality-test` | Testing — testovaci strategie, pokryti, mocking patterns | sonnet | Testy, test konfigurace |

### Specific (6)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-test-unit` | Unit testy — Vitest/Jest, component testing, utility testing, hooks testing | sonnet | `__tests__/`, `*.test.js` |
| `mp-spec-test-e2e` | E2E testy — Playwright, kriticke user flows, smoke testy, CI integrace | sonnet | Playwright suite, `e2e/` |
| `mp-spec-test-api` | API testy — endpoint testing, contract testing, response validace | sonnet | API test suite |
| `mp-spec-test-visual` | Vizualni regrese — screenshot porovnani, Storybook (budouci), vizualni diffy | sonnet | Visual test suite |
| `mp-spec-test-build` | Build gatekeeper — npm run build, spousti testy, fixuje build-breaking chyby | sonnet | Build skripty, CI gates |
| `mp-spec-test-browser` | Browser test planner — manualni testovaci plany pro Chrome extension | haiku | `.md` testovaci plany |

---

## 8) Infrastructure & DevOps Domena (7 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-infra` | Senior Infra — deployment strategie, CI/CD architektura, monitoring | opus | Build, deploy, infra |

### Middle (2)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-mid-infra-build` | Build & bundling — Vite config, npm scripts, optimalizace, tree-shaking | sonnet | `vite.config.mjs`, `package.json`, build skripty |
| `mp-mid-infra-deploy` | Deploy & CI/CD — GitHub Actions, Firebase deploy, workflow automatizace | sonnet | `.github/workflows/`, deploy konfigurace |

### Specific (4)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-infra-docker` | Docker — kontejnerizace, docker-compose, multi-stage buildy (budouci) | sonnet | `Dockerfile`, `docker-compose.yml` |
| `mp-spec-infra-firebase` | Firebase — Auth konfigurace, Hosting, Firestore rules, Functions | sonnet | `/src/firebase.js`, firebase config |
| `mp-spec-infra-deps` | Dependency management — npm audit, verze, lockfile, security patches | sonnet | `package.json`, `package-lock.json` |
| `mp-spec-infra-monitoring` | Monitoring — error tracking, logging, Plausible/Umami analytics setup | sonnet | Monitoring konfigurace (budouci Sekce 19) |

---

## 9) i18n & Lokalizace Domena (4 agenti)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-i18n` | Senior i18n — internationalizace strategie, prekladovy management | sonnet | Cely i18n system |

### Specific (3)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-i18n-translations` | Preklady CZ/EN — useLanguage(), klice, chybejici preklady, hardcoded texty | haiku | `/src/locales/`, `/src/i18n.js` |
| `mp-spec-i18n-currency` | Formatovani men — dinero.js, Intl API, locale-aware cisla a ceny | haiku | Currency formatting helpers |
| `mp-spec-i18n-dates` | Datum/cas lokalizace — Intl.DateTimeFormat, casove zony, relativni casy | haiku | Date formatting helpers |

---

## 10) 3D & Mesh Domena (4 agenti)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-3d` | Senior 3D — 3D processing pipeline, mesh analyza, format podpora | sonnet | 3D soubory, Three.js, mesh logika |

### Specific (3)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-3d-viewer` | 3D Viewer — Three.js rendering, loadery (STL, OBJ, 3MF), kamera, osvetleni | sonnet | `ModelViewer.jsx`, Three.js |
| `mp-spec-3d-analysis` | Mesh analyza — printability check, tlouska sten, watertight, DFM zpetna vazba | sonnet | Mesh analysis pipeline (budouci Sekce 8) |
| `mp-spec-3d-conversion` | Format konverze — STEP->STL, opencascade.js, 3MF parsing | sonnet | File conversion pipeline (budouci Sekce 3) |

---

## 11) E-commerce & Integrace Domena (5 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-ecommerce` | Senior E-commerce — integracni strategie, API design, e-commerce patterns | sonnet | Integrace, API, e-commerce logika |

### Specific (4)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-ecom-shopify` | Shopify integrace — @shopify/shopify-api, webhooks, product sync | sonnet | Shopify connector (budouci Sekce 17) |
| `mp-spec-ecom-woo` | WooCommerce integrace — REST API klient, product/order sync | sonnet | WooCommerce connector (budouci Sekce 17) |
| `mp-spec-ecom-payments` | Platby — Stripe, PayPal, kreditovy system, platebni brana | sonnet | Payment integration (budouci Sekce 21) |
| `mp-spec-ecom-api` | Public API — OpenAPI spec, Redoc dokumentace, rate limiting, API klice | sonnet | Public API (budouci Sekce 20) |

---

## 12) Planovani & Orchestrace Domena (7 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-orchestrator` | Tier0 Orchestrator — delegace, konflikt management, merge poradi, celkova koordinace | opus | Koordinace vsech agentu |

### Specific (6)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-plan-manager` | Planovaci koordinator — prijima pozadavky, Context Briefs, syntetizuje plany | opus | Planovani velkych features |
| `mp-spec-plan-frontend` | FE planovac — UI architektura, komponenty, routing, API kontrakty z FE pohledu | sonnet | FE planovani |
| `mp-spec-plan-backend` | BE planovac — API endpointy, data flow, integrace | sonnet | BE planovani |
| `mp-spec-plan-ux` | UX planovac — user flows, interakce, design patterns | sonnet | UX planovani |
| `mp-spec-plan-critic` | Kritik — kontrola planu z pohledu zakaznika, identifikuje user-unfriendly aspekty | opus | Kriticka revize planu |
| `mp-spec-plan-product` | Produktovy specifikator — acceptance criteria, edge cases, scope locks | sonnet | Specifikace, requirements |

---

## 13) Dokumentace & Research Domena (5 agentu)

### Senior (1)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-sr-docs` | Senior Dokumentace — dokumentacni strategie, konzistence, onboarding | sonnet | `docs/`, README, CLAUDE.md |

### Specific (4)

| Agent | Role | Model | Scope |
|-------|------|-------|-------|
| `mp-spec-docs-api` | API dokumentace — OpenAPI/Swagger specs, Redoc, endpoint docs | sonnet | API docs (budouci Sekce 20) |
| `mp-spec-docs-dev` | Developer docs — CLAUDE.md, AGENT_MAP, SKILLS_MAP, patterns | sonnet | `docs/claude/`, dev onboarding |
| `mp-spec-research-web` | Web research — Context7-first, Brave search, citace, doporuceni | sonnet | Externi zdroje |
| `mp-spec-research-oss` | OSS Scout — vyhledavani knihoven, licence audit, kvalita hodnoceni | sonnet | NPM, GitHub, licence |

---

## 14) Hot Spot Ownership Matrix

> Sdilene soubory — kdo je **primarni vlastnik** a kdo musi byt informovan.
> Aktualizovano pro hierarchicky system: vlastnictvi na nejnizsim prislusnem tieru.

| Soubor / Oblast | Primarni vlastnik | Informovat |
|-----------------|-------------------|------------|
| `/src/Routes.jsx` | `mp-spec-fe-routing` | `mp-mid-frontend-admin`, `mp-mid-frontend-widget` |
| `/src/utils/adminTenantStorage.js` | `mp-mid-storage-tenant` | `mp-mid-frontend-admin`, `mp-mid-pricing-engine` |
| `/src/utils/adminPricingStorage.js` | `mp-mid-storage-tenant` | `mp-mid-pricing-engine` |
| `/src/utils/adminFeesStorage.js` | `mp-mid-storage-tenant` | `mp-spec-pricing-fees` |
| `/src/lib/pricing/pricingEngineV3.js` | `mp-mid-pricing-engine` | `mp-spec-pricing-fees`, `mp-mid-frontend-public` |
| `/src/components/ui/*` | `mp-mid-design-system` | `mp-mid-frontend-public`, `mp-mid-frontend-admin` |
| `/vite.config.mjs` | `mp-mid-infra-build` | `mp-mid-infra-deploy` |
| `/backend-local/*` | `mp-mid-backend-api` | `mp-spec-be-slicer` |
| `package.json` | `mp-spec-infra-deps` | `mp-mid-infra-build`, `mp-spec-test-build` |
| `CLAUDE.md` | `mp-spec-docs-dev` | `mp-sr-orchestrator` |
| `/src/context/AuthContext.jsx` | `mp-spec-be-auth` | `mp-mid-frontend-public`, `mp-mid-frontend-admin` |
| `/src/pages/admin/AdminWidget.jsx` | `mp-mid-frontend-admin` | `mp-mid-frontend-widget` |
| `/src/pages/widget-kalkulacka/*` | `mp-mid-frontend-widget` | `mp-mid-security-app` |
| `/src/i18n.js` | `mp-sr-i18n` | `mp-spec-i18n-translations` |

**Pravidlo:** Pokud agent meni soubor kde neni primarni vlastnik, musi to uvest v handoff reportu a koordinovat pres `mp-sr-orchestrator`.

---

## 15) Template pro vytvoreni noveho agenta

Kdyz potrebujes noveho agenta, pouzij tento checklist:

### 15.1 Rozhodnuti
- [ ] Opakovany task (>2x stejny typ prace)?
- [ ] Specializovana domena (nova oblast ktera nepatri existujicimu agentovi)?
- [ ] Hot spot (soubor/oblast ktera potrebuje dedicatedniho vlastnika)?

Pokud alespon 1x ANO -> vytvor agenta.

### 15.2 Urceni tieru
- [ ] **Senior** — potrebuje architekturalni rozhodnuti, delegaci, cross-domain review? -> `mp-sr-*` (opus)
- [ ] **Middle** — vlastni 2-4 podoblasti, implementuje stredne slozite ukoly? -> `mp-mid-*` (sonnet)
- [ ] **Specific** — ultra-uzky scope, 1 konkretni vec? -> `mp-spec-*` (haiku/sonnet)

### 15.3 Implementace
1. **Ucel** — co agent dela (1 veta)
2. **Tier** — Senior / Middle / Specific
3. **Model** — opus / sonnet / haiku
4. **Scope** — konkretni soubory/slozky (IN a OUT)
5. **Soubor** — vytvor definici v `.agents/` (nebo primo v CLAUDE.md task definici)
5.5. **SECURITY SCAN** — pokud agent pochazi z externiho zdroje, projdi checklist v `CLAUDE.md` sekce 19.3. Externi = cokoliv co jsi nenapsal sam.
6. **AGENT_MAP** — pridej agenta do prislusne domeny v tomto souboru
7. **CLAUDE.md** — aktualizuj odkaz v sekci 3

### 15.4 Pojmenovani
- Prefix: `mp-` (ModelPricer)
- Format: `mp-{tier}-{domena}-{specializace}`
  - `mp-sr-*` pro Senior
  - `mp-mid-*` pro Middle
  - `mp-spec-*` pro Specific
- Lowercase, pomlcky

---

## 16) Budouci sekce implementacniho planu — pokryti agenty

> Mapovani sekci budouciho implementacniho planu na dedicovane agenty.

| Sekce | Oblast | Primarni agenti |
|-------|--------|----------------|
| 1 | Bug Fixes & Reactivity | `mp-mid-frontend-public`, `mp-spec-fe-state` |
| 2 | Contact Form & Order Completion | `mp-spec-fe-checkout`, `mp-spec-fe-forms` |
| 3 | Multi-Format 3D Support | `mp-spec-3d-conversion`, `mp-spec-be-upload` |
| 4 | Shipping & Delivery | `mp-spec-pricing-shipping` |
| 5 | Quantity Discounts | `mp-mid-pricing-discounts` |
| 6 | Post-Processing Services | `mp-spec-pricing-fees` |
| 7 | Email Notifications | `mp-spec-be-email`, `mp-spec-fe-notifications` |
| 8 | Printability Check | `mp-spec-3d-analysis` |
| 10 | Coupon System | `mp-spec-pricing-coupons` |
| 11 | Real-time (WebSocket) | `mp-spec-be-websocket` |
| 12 | Customer Portal | `mp-mid-frontend-public`, `mp-spec-fe-routing` |
| 13 | PDF/Document Generation | `mp-spec-be-pdf` |
| 14 | Kanban Board | `mp-spec-fe-kanban` |
| 15 | Pricing Methods | `mp-spec-pricing-methods` |
| 16 | i18n & Multi-currency | `mp-sr-i18n`, `mp-spec-pricing-currency` |
| 17 | E-commerce Integrace | `mp-spec-ecom-shopify`, `mp-spec-ecom-woo` |
| 18 | Advanced Technologies | `mp-sr-3d`, `mp-spec-be-slicer` |
| 19 | CRM & Marketing | `mp-sr-ecommerce`, `mp-spec-infra-monitoring` |
| 20 | Public API & Webhooks | `mp-spec-ecom-api`, `mp-spec-be-webhooks` |
| 21 | Tax, Credits, Custom Domains | `mp-spec-pricing-tax`, `mp-spec-ecom-payments`, `mp-spec-security-gdpr` |
| 22 | Onboarding | `mp-spec-design-onboarding` |

---

## 17) Changelog

| Datum | Zmena |
|-------|-------|
| 2026-02-06 | Inicialni verze — 32 agentu, 6 kategorii |
| 2026-02-06 | Kompletni prepis — hierarchicky system (Senior/Middle/Specific), 101 agentu, 13 domen |
