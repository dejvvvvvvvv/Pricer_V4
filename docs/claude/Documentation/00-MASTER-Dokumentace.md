# ModelPricer V3 — Master Dokumentace

> Hlavni referencni dokument projektu ModelPricer / Pricer V3. Obsahuje kompletni prehled architektury,
> souborovy strom, route mapu, komponentni hierarchii, data flow, API kontrakty a odkazy na vsechny
> detailni dokumenty.

**Verze:** 3.0
**Posledni aktualizace:** 2026-02-13
**Pocet zdrojovych souboru:** 291 (JS/JSX/MJS)
**Pocet radku kodu:** ~72 500 (frontend + backend, bez node_modules/build/tools)
**Pocet CSS souboru:** 12 (~1 440 radku)
**Dokumentacnich souboru:** 45 (viz sekce 20)

---

## Obsah

1. [Co je ModelPricer](#1-co-je-modelpricer)
2. [Cilova skupina a business model](#2-cilova-skupina-a-business-model)
3. [Klicove funkce](#3-klicove-funkce)
4. [Technologicky stack](#4-technologicky-stack)
5. [Architektura na vysoke urovni](#5-architektura-na-vysoke-urovni)
6. [Souborovy strom (File Tree)](#6-souborovy-strom)
7. [Route mapa (URL Wireframe)](#7-route-mapa)
8. [Komponentni hierarchie](#8-komponentni-hierarchie)
9. [Data flow — zivotni cyklus objednavky](#9-data-flow)
10. [Pricing Engine pipeline](#10-pricing-engine-pipeline)
11. [Storage architektura](#11-storage-architektura)
12. [Backend API kontrakty](#12-backend-api-kontrakty)
13. [Supabase infrastruktura](#13-supabase-infrastruktura)
14. [Widget & Embed system](#14-widget-a-embed-system)
15. [Forge Design System](#15-forge-design-system)
16. [i18n (lokalizace)](#16-i18n-lokalizace)
17. [Bezpecnostni prehled](#17-bezpecnostni-prehled)
18. [Znamy technicky dluh](#18-znamy-technicky-dluh)
19. [Jak spustit projekt](#19-jak-spustit-projekt)
20. [Katalog dokumentace](#20-katalog-dokumentace)

---

## 1. Co je ModelPricer

ModelPricer (interni nazev **Pricer V3**, brand **FORGE**) je SaaS platforma pro firmy
provozujici 3D tiskove sluzby. Resi hlavni bolest techto firem: **jak rychle a presne
nacenit 3D tisk** pro koncoveho zakaznika.

### Jak to funguje

```
Zakaznik nahra 3D model (STL/OBJ/3MF)
         |
         v
Vybere material, infill, layer height, pocet kusu
         |
         v
Backend spusti PrusaSlicer CLI → vrati cas tisku + spotrebu materialu
         |
         v
Pricing Engine vypocita deterministickou cenu
  (base price + fees + markup + volume discounts + minima + zaokrouhleni)
         |
         v
Zakaznik vidi cenu → muze objednat (checkout flow)
         |
         v
Admin spravuje objednavky v admin panelu (kanban, detail, storage)
```

### V cem je unikatni

- **Deterministicky pricing** — stejna konfigurace = vzdy stejna cena (zadne nahodne faktory)
- **PrusaSlicer integrace** — realny cas tisku a spotreba materialu, ne odhady
- **Embedovatelny widget** — zakaznik si vlozi kalkulacku primo na svuj e-shop (iframe + postMessage)
- **Plne konfigurovatelny admin** — materialy, fees, markup, presets, branding, volume discounts
- **Multi-tenant architektura** — jeden nasazeny system obsluhuje vice firem

---

## 2. Cilova skupina a business model

### Cilova skupina
- Male a stredni 3D tiskove firmy (1-50 zamestnancu)
- Provozovatele e-shopu s 3D tiskem
- Makerspace a FabLab provozovatele

### Business model (cenove tarify)

| Tarif | Cena CZK | Cena USD | Urceni |
|-------|----------|----------|--------|
| **Starter** | 499 Kc/mes | $20/mes | Zacatecnici, 1 tiskarna |
| **Professional** | 1 999 Kc/mes | $80/mes | Stredni firmy, neomezene tiskarny |
| **Enterprise** | Na miru | Custom | Velke firmy, custom integrace |

### Hlavni hodnotova nabidka
- Ušetri cas pri cenotvorbe (minuty misto hodin)
- Eliminuje chyby v manualnich nacenenych
- Profesionalni vzhled pro zakaznika (widget na e-shopu)

---

## 3. Klicove funkce

### 3.1 Pro zakaznika (Public)
- **3D Model Upload** — drag & drop STL/OBJ/3MF s nahledy
- **3D Model Viewer** — Three.js vizualizace nahranaho modelu
- **Konfigurace tisku** — material, infill, layer height, pocet kusu
- **Realtime pricing** — okamzity prepocet ceny pri zmene parametru
- **Checkout flow** — 5-krokovy wizard (upload → config → slicer → rekapitulace → objednavka)
- **Volume discounts** — automaticke slevy pri vetsim poctu kusu
- **Widget embed** — kalkulacka jako iframe na externim e-shopu

### 3.2 Pro admina (Admin Panel)
- **Dashboard** — prehled metrik, grafy, KPI
- **Materials & Pricing** — sprava materialu, cen za gram, markup
- **Fees** — MODEL a ORDER poplatky (selektivni, povinne, skryte)
- **Parameters** — PrusaSlicer parametry (infill, layer height, supports...)
- **Presets** — prednastavene konfigurace pro rychle naceneni
- **Orders** — seznam objednavek + kanban board + detail modal
- **Model Storage** — souborovy manazer (modely, G-code, presety)
- **Widget Builder** — vizualni editor embedovatelne kalkulacky
- **Branding** — logo, barvy, nazev firmy
- **Analytics** — statistiky pouzivani, revenue, konverze
- **Team Access** — sprava tymu, role, pozvani
- **Coupons** — promo kody, slevy (pripraveno)
- **Express/Shipping** — expresni tisk a doprava (pripraveno)
- **Emails** — emailove sablony a notifikace (pripraveno)
- **Migration** — migrace z localStorage do Supabase (Phase 4)

### 3.3 Pro vyvojare
- **Slicer UI** — PrusaSlicer-like rozhrani v browseru (prototype)
- **Pricing Engine V3** — deterministicky pipeline s breakdown
- **20 storage helperu** — tenant-scoped localStorage s Supabase dual-write
- **Feature flags** — per-namespace prepinani localStorage/Supabase/dual-write

---

## 4. Technologicky stack

### 4.1 Frontend

| Technologie | Verze | Ucel |
|-------------|-------|------|
| **React** | 19.1.1 | UI framework |
| **Vite** | 5.0.0 | Build tool, dev server (port 4028) |
| **JavaScript (JSX)** | ES2022+ | Jazyk (bez TypeScript) |
| **React Router** | 6.0.2 | Client-side routing |
| **Tailwind CSS** | 3.4.6 | Utility CSS (castecne, misto toho Forge tokens) |
| **Forge Design System** | custom | CSS custom properties, dark theme |
| **Three.js** | 0.180.0 | 3D model viewer |
| **@react-three/fiber** | 9.3.0 | React wrapper pro Three.js |
| **@react-three/drei** | 9.122.0 | Three.js helpery |
| **framer-motion** | 12.23.12 | Animace a transitions |
| **react-hook-form** | 7.62.0 | Formularova validace |
| **zod** | 4.1.9 | Schema validace |
| **recharts** | 2.15.2 | Grafy a vizualizace |
| **lucide-react** | 0.484.0 | Ikony |
| **Firebase** | 12.7.0 | Auth + Firestore |
| **@supabase/supabase-js** | 2.95.3 | Database (migrace z localStorage) |
| **Lenis** | 1.3.17 | Smooth scrolling |
| **react-colorful** | 5.6.1 | Color picker |
| **react-dropzone** | 14.2.3 | File upload |
| **d3** | 7.9.0 | Data vizualizace (GlobalMap) |
| **Radix UI** | various | Pristupne UI primitiva |
| **class-variance-authority** | 0.7.1 | Variant-based styling |

### 4.2 Backend

| Technologie | Verze | Ucel |
|-------------|-------|------|
| **Node.js** | 18+ | Runtime |
| **Express** | 4.19.2 | HTTP server |
| **multer** | 1.4.5 | File upload handling |
| **archiver** | 7.0.0 | ZIP generovani |
| **nanoid** | 5.0.7 | UUID generovani |
| **cors** | 2.8.5 | CORS middleware |
| **PrusaSlicer CLI** | 2.9.4 | 3D model slicing |

### 4.3 Infrastructure

| Technologie | Ucel |
|-------------|------|
| **Firebase Hosting** | Frontend deployment |
| **Firebase Auth** | Autentizace uzivatelu |
| **Firestore** | Uzivatelske profily |
| **Cloud Functions** | Serverless backend (budouci) |
| **Supabase** | Database migrace (25 tabulek s RLS) |
| **localStorage** | Primarni data storage (soucasny stav) |

---

## 5. Architektura na vysoke urovni

```
+------------------------------------------------------------------+
|                        BROWSER (Client)                          |
|                                                                  |
|  +------------------+  +-------------------+  +---------------+  |
|  |   Public Pages   |  |   Admin Panel     |  |  Widget       |  |
|  |  (Home, Pricing, |  |  (Dashboard,      |  |  (iframe v    |  |
|  |   Support, Login)|  |   Pricing, Fees,  |  |   e-shopu)    |  |
|  +--------+---------+  |   Orders, ...)    |  +-------+-------+  |
|           |             +--------+----------+          |          |
|           |                      |                     |          |
|  +--------+----------------------+---------------------+-------+  |
|  |              SHARED LAYER                                   |  |
|  |  Routes.jsx | Header/Footer | LanguageContext | AuthContext  |  |
|  |  Pricing Engine V3 | Storage Helpers | Forge Components     |  |
|  +---------------------------+----------------------------------+  |
|                              |                                    |
+------------------------------+------------------------------------+
                               |
                    Vite Proxy /api → :3001
                               |
+------------------------------+------------------------------------+
|                     BACKEND (Express :3001)                       |
|                                                                   |
|  +------------------+  +-----------------+  +------------------+  |
|  | Slicer Routes    |  | Presets Routes  |  | Storage Routes   |  |
|  | /api/slicer/*    |  | /api/presets/*  |  | /api/storage/*   |  |
|  +--------+---------+  +--------+--------+  +--------+---------+  |
|           |                      |                    |           |
|  +--------+---------+  +--------+--------+  +--------+---------+  |
|  | PrusaSlicer CLI  |  | presetsStore.js |  | storageService   |  |
|  | (spawn child)    |  | (FS JSON CRUD)  |  | (FS + checksums) |  |
|  +------------------+  +-----------------+  +------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
                               |
+------------------------------+------------------------------------+
|                     DATA LAYER                                    |
|                                                                   |
|  +------------------+  +-----------------+  +------------------+  |
|  | localStorage     |  | Supabase        |  | File System      |  |
|  | (20 namespaces,  |  | (25 tabulek,    |  | (backend-local/  |  |
|  |  tenant-scoped)  |  |  RLS, budouci)  |  |  storage/)       |  |
|  +------------------+  +-----------------+  +------------------+  |
|                                                                   |
+-------------------------------------------------------------------+
```

### Vrstvy systemu

| Vrstva | Popis | Klicove soubory |
|--------|-------|-----------------|
| **Presentation** | React komponenty, Forge UI, routing | `src/pages/`, `src/components/` |
| **Business Logic** | Pricing engine, slicer integrace, checkout | `src/lib/pricing/`, `src/services/` |
| **State & Storage** | Tenant-scoped helpery, context providers | `src/utils/`, `src/contexts/` |
| **Data** | localStorage, Supabase, filesystem | `src/lib/supabase/`, `backend-local/src/storage/` |
| **Infrastructure** | Vite, Firebase, CORS, proxying | `vite.config.mjs`, `firebase.json` |

---

## 6. Souborovy strom

```
Model_Pricer-V2-main/
|
|-- index.html                          # Vite entrypoint (HTML)
|-- public/
|   |-- index.html                      # Fallback (OBA musi byt synchronizovany!)
|   |-- manifest.json                   # PWA manifest
|   |-- widget.js                       # Widget embed loader
|   `-- code/engine.js                  # Standalone pricing engine
|
|-- package.json                        # 38 dependencies, 12 devDependencies
|-- vite.config.mjs                     # Port 4028, alias @→src, proxy /api→:3001
|-- tailwind.config.js                  # Tailwind konfigurace
|-- postcss.config.js                   # PostCSS pipeline
|-- firebase.json                       # Firebase Hosting config
|-- firestore.rules                     # Firestore security rules
|-- jsconfig.json                       # Path aliases
|
|-- src/
|   |-- index.jsx                       # React entrypoint
|   |-- App.jsx                         # App wrapper (AuthProvider + LanguageProvider)
|   |-- Routes.jsx                      # 19+ rout, lazy loading (129 radku)
|   |
|   |-- components/                     # Sdilene komponenty
|   |   |-- AppIcon.jsx                 # Lucide icon wrapper (70+ importu)
|   |   |-- AppImage.jsx                # Image s lazy loading
|   |   |-- ErrorBoundary.jsx           # React error boundary
|   |   |-- FilePreview.jsx             # Nahled souboru (nepouzivany)
|   |   |-- ModelPreview.jsx            # 3D model nahled (nepouzivany)
|   |   |-- PrivateRoute.jsx            # Auth guard (ZAKOMENTOVANY!)
|   |   |-- ScrollToTop.jsx             # Scroll reset pri navigaci
|   |   |-- SmoothScroll.jsx            # Lenis smooth scroll
|   |   |
|   |   |-- ui/                         # Base UI komponenty (18 ks)
|   |   |   |-- Header.jsx              # Hlavicka (462 r., Forge dark theme)
|   |   |   |-- Footer.jsx              # Paticka (Forge styled)
|   |   |   |-- Button.jsx              # CVA button (Tailwind)
|   |   |   |-- Input.jsx               # Input s Forge variantou
|   |   |   |-- Select.jsx              # Custom select (bez Radix)
|   |   |   |-- Card.jsx                # Card container
|   |   |   |-- Checkbox.jsx            # Radix checkbox
|   |   |   |-- ColorPicker.jsx         # react-colorful wrapper
|   |   |   |-- Container.jsx           # Max-width wrapper
|   |   |   |-- Dialog.jsx              # Radix dialog
|   |   |   |-- Slider.jsx              # Radix slider
|   |   |   |-- Icon.jsx                # Icon wrapper
|   |   |   |-- BackgroundPattern.jsx   # SVG pattern
|   |   |   |-- ErrorState.jsx          # Error UI (nepouzivany)
|   |   |   |-- LoadingState.jsx        # Loading UI (nepouzivany)
|   |   |   |-- WelcomeHeader.jsx       # Welcome banner
|   |   |   |-- label.jsx               # Radix label
|   |   |   |-- tooltip.jsx             # Radix tooltip
|   |   |   |
|   |   |   `-- forge/                  # Forge Design System (26 komponent)
|   |   |       |-- ForgeButton.jsx
|   |   |       |-- ForgeCard.jsx
|   |   |       |-- ForgeCheckbox.jsx
|   |   |       |-- ForgeColorPicker.jsx
|   |   |       |-- ForgeDialog.jsx
|   |   |       |-- ForgeFaqAccordion.jsx
|   |   |       |-- ForgeHeroUnderline.jsx
|   |   |       |-- ForgeInput.jsx
|   |   |       |-- ForgeNumberedCard.jsx
|   |   |       |-- ForgePageHeader.jsx
|   |   |       |-- ForgePriceBreakdown.jsx
|   |   |       |-- ForgePricingCard.jsx
|   |   |       |-- ForgePrinterSVG.jsx    # Animovana tiskarna (18s cyklus)
|   |   |       |-- ForgeProgressBar.jsx
|   |   |       |-- ForgeSectionLabel.jsx
|   |   |       |-- ForgeSelect.jsx
|   |   |       |-- ForgeSlider.jsx
|   |   |       |-- ForgeSquiggle.jsx
|   |   |       |-- ForgeStatCard.jsx
|   |   |       |-- ForgeStatusBadge.jsx
|   |   |       |-- ForgeStatusIndicator.jsx
|   |   |       |-- ForgeTable.jsx
|   |   |       |-- ForgeTabs.jsx
|   |   |       |-- ForgeToast.jsx
|   |   |       `-- ForgeToggle.jsx
|   |   |
|   |   `-- marketing/                  # Marketing komponenty (16 ks, vetsina nepouzivana)
|   |       |-- Accordion.jsx
|   |       |-- FaqTabs.jsx
|   |       |-- GlobalMap.jsx + .css
|   |       |-- GlossaryTerm.jsx
|   |       |-- ImageReveal.jsx
|   |       |-- ImageRipple.jsx
|   |       |-- InteractiveWorldMap.jsx
|   |       |-- LogoMarquee.jsx
|   |       |-- MeshGradient.jsx
|   |       |-- MotionNumber.jsx
|   |       |-- PricingPlanCard.jsx
|   |       |-- Reveal.jsx              # Jedina aktivne pouzivana
|   |       |-- Sparkles.jsx
|   |       |-- SpotlightCard.jsx
|   |       |-- SupportHoverCards.jsx
|   |       `-- Tabs.jsx
|   |
|   |-- pages/                          # Stranky (page-level komponenty)
|   |   |-- NotFound.jsx                # 404 stranka
|   |   |-- InviteAccept.jsx            # Pozvani do tymu
|   |   |
|   |   |-- home/index.jsx             # Homepage (434 r.)
|   |   |-- pricing/index.jsx          # Cenova stranka (355 r.)
|   |   |-- support/index.jsx          # Podpora + FAQ (359 r.)
|   |   |
|   |   |-- login/                     # Prihlaseni
|   |   |   |-- index.jsx
|   |   |   `-- components/ (5 subcomponent)
|   |   |
|   |   |-- register/                  # Registrace
|   |   |   |-- index.jsx
|   |   |   `-- components/ (4 subcomponent)
|   |   |
|   |   |-- account/                   # Uzivatelsky ucet
|   |   |   |-- index.jsx (1036 r.)
|   |   |   `-- components/AccountOverviewCard.jsx
|   |   |
|   |   |-- test-kalkulacka/           # Hlavni kalkulacka (dark theme)
|   |   |   |-- index.jsx              # 5-step wizard orchestrator (1049 r.)
|   |   |   |-- schemas/checkoutSchema.js
|   |   |   |-- hooks/useDebouncedRecalculation.js
|   |   |   |-- utils/geomEstimate.js
|   |   |   `-- components/            # 14 subkomponent
|   |   |       |-- CheckoutForm.jsx   # Checkout formular (595 r.)
|   |   |       |-- PricingCalculator.jsx (626 r.)
|   |   |       |-- PrintConfiguration.jsx (1010 r.)
|   |   |       |-- ModelViewer.jsx    # Three.js viewer (659 r.)
|   |   |       |-- FileUploadZone.jsx (330 r.)
|   |   |       |-- OrderConfirmation.jsx
|   |   |       |-- GenerateButton.jsx + .module.css
|   |   |       |-- CouponInput.jsx
|   |   |       |-- ErrorBoundary.jsx
|   |   |       |-- PromoBar.jsx
|   |   |       |-- ExpressTierSelector.jsx  # (nepouzivany)
|   |   |       |-- PostProcessingSelector.jsx  # (nepouzivany)
|   |   |       |-- ShippingSelector.jsx  # (nepouzivany)
|   |   |       `-- UpsellPanel.jsx       # (nepouzivany)
|   |   |
|   |   |-- test-kalkulacka-white/     # Kalkulacka (light theme, kopie)
|   |   |   `-- (stejna struktura jako test-kalkulacka)
|   |   |
|   |   |-- widget-kalkulacka/         # Widget kalkulacka (pro iframe embed)
|   |   |   |-- index.jsx (907 r.)
|   |   |   |-- utils/geomEstimate.js
|   |   |   `-- components/ (17 subkomponent)
|   |   |
|   |   |-- widget/                    # Widget embed helpery
|   |   |   |-- WidgetEmbed.jsx
|   |   |   `-- WidgetPreview.jsx
|   |   |
|   |   |-- widget-public/            # Verejna widget stranka
|   |   |   `-- WidgetPublicPage.jsx
|   |   |
|   |   |-- slicer/                    # PrusaSlicer-like UI (prototype)
|   |   |   |-- index.jsx
|   |   |   |-- mockData.js
|   |   |   `-- components/ (11 subkomponent)
|   |   |
|   |   `-- admin/                     # Admin panel
|   |       |-- AdminLayout.jsx        # Sidebar + outlet (482 r.)
|   |       |-- AdminDashboard.jsx     # Dashboard (1848 r.)
|   |       |-- AdminPricing.jsx       # Pricing config (3173 r.) ← NEJVETSI
|   |       |-- AdminFees.jsx          # Fees config (2418 r.)
|   |       |-- AdminParameters.jsx    # Slicer parametry (2530 r.)
|   |       |-- AdminPresets.jsx       # Preset management (1163 r.)
|   |       |-- AdminOrders.jsx        # Objednavky (1519 r.)
|   |       |-- AdminWidget.jsx        # Widget config (1554 r.)
|   |       |-- AdminWidgetBuilder.jsx # Vizualni builder
|   |       |-- AdminBranding.jsx      # Branding (1289 r.)
|   |       |-- AdminAnalytics.jsx     # Analyticke (701 r.)
|   |       |-- AdminTeamAccess.jsx    # Tym management (839 r.)
|   |       |-- AdminModelStorage.jsx  # File manager (328 r.)
|   |       |-- AdminCoupons.jsx       # Kupony (989 r., lazy)
|   |       |-- AdminExpress.jsx       # Express tisk (663 r., lazy)
|   |       |-- AdminShipping.jsx      # Doprava (670 r., lazy)
|   |       |-- AdminEmails.jsx        # Emaily (638 r., lazy)
|   |       |-- AdminMigration.jsx     # DB migrace (406 r., lazy)
|   |       |
|   |       |-- builder/              # Widget builder subsystem
|   |       |   |-- BuilderPage.jsx
|   |       |   |-- config/            # elementRegistry, quickThemes, onboardingSteps
|   |       |   |-- hooks/             # useBuilderState, useElementSelection, useUndoRedo
|   |       |   |-- styles/            # builder-tokens.css
|   |       |   `-- components/        # 10 builder komponent + 5 editoru + 3 taby
|   |       |
|   |       `-- components/
|   |           |-- orders/            # Order subsystem (5 komponent)
|   |           |   |-- OrderDetailModal.jsx
|   |           |   |-- TabCustomer.jsx
|   |           |   |-- TabShipping.jsx
|   |           |   |-- TabItemsFiles.jsx
|   |           |   `-- StorageStatusBadge.jsx
|   |           |
|   |           |-- kanban/            # Kanban board (6 souboru)
|   |           |   |-- KanbanBoard.jsx
|   |           |   |-- KanbanCard.jsx
|   |           |   |-- KanbanColumn.jsx
|   |           |   |-- KanbanFilters.jsx
|   |           |   |-- statusTransitions.js
|   |           |   `-- useKanbanDnd.js
|   |           |
|   |           |-- storage/           # File manager UI (5 komponent)
|   |           |   |-- BreadcrumbBar.jsx
|   |           |   |-- FileListPanel.jsx
|   |           |   |-- FileToolbar.jsx
|   |           |   |-- FolderTreePanel.jsx
|   |           |   `-- PreviewPanel.jsx
|   |           |
|   |           `-- Widget*Tab.jsx     # 4 taby pro widget config
|   |
|   |-- contexts/
|   |   `-- LanguageContext.jsx        # i18n provider (1130 r., 462 klicu CS+EN)
|   |
|   |-- context/
|   |   `-- AuthContext.jsx            # Firebase Auth + Firestore profil
|   |
|   |-- hooks/                         # Custom React hooks
|   |   |-- useAuth.js                 # Legacy auth hook (nepouzivany)
|   |   |-- useStorageQuery.js         # Async storage cteni
|   |   |-- useStorageMutation.js      # Async storage zapis
|   |   |-- useSupabaseRealtime.js     # Postgres Changes subscription
|   |   `-- useStorageBrowser.js       # File manager hook (328 r.)
|   |
|   |-- lib/
|   |   |-- utils.js                   # cn() — clsx + tailwind-merge
|   |   |-- pricingService.js          # Legacy pricing (NAHRAZEN V3, dead code)
|   |   |-- slicingApiClient.js        # Legacy slicer klient (ORPHANED)
|   |   |
|   |   |-- pricing/                   # Pricing Engine V3
|   |   |   |-- pricingEngineV3.js     # Hlavni pipeline (1205 r.)
|   |   |   |-- shippingCalculator.js  # Kalkulace dopravy
|   |   |   `-- couponValidator.js     # Validace kuponu
|   |   |
|   |   `-- supabase/                  # Supabase integrace
|   |       |-- client.js              # Supabase client init
|   |       |-- featureFlags.js        # Per-namespace mode prepinani
|   |       |-- storageAdapter.js      # Universal read/write adapter (347 r.)
|   |       |-- migrationRunner.js     # 19 migraci (537 r.)
|   |       `-- index.js               # Re-exporty
|   |
|   |-- services/                      # API klienti (fetch-based)
|   |   |-- presetsApi.js              # /api/presets/* (7 metod)
|   |   |-- slicerApi.js               # /api/slicer/* (1 metoda)
|   |   `-- storageApi.js              # /api/storage/* (13 metod)
|   |
|   |-- utils/                         # Tenant-scoped storage helpery
|   |   |-- adminTenantStorage.js      # ENTRYPOINT — getTenantId(), read/writeTenantJson
|   |   |-- adminPricingStorage.js     # namespace: pricing:v3 (496 r.)
|   |   |-- adminFeesStorage.js        # namespace: fees:v3
|   |   |-- adminBrandingWidgetStorage.js  # namespace: branding
|   |   |-- adminOrdersStorage.js      # namespace: orders
|   |   |-- adminAnalyticsStorage.js   # namespace: analytics
|   |   |-- adminTeamAccessStorage.js  # namespace: team_access
|   |   |-- adminDashboardStorage.js   # namespace: dashboard
|   |   |-- adminKanbanStorage.js      # namespace: kanban
|   |   |-- adminCouponsStorage.js     # namespace: coupons
|   |   |-- adminEmailStorage.js       # namespace: email_config
|   |   |-- adminExpressStorage.js     # namespace: express
|   |   |-- adminShippingStorage.js    # namespace: shipping
|   |   |-- adminFormStorage.js        # namespace: form_fields
|   |   |-- adminAuditLogStorage.js    # namespace: audit_log
|   |   |-- widgetThemeStorage.js      # namespace: widget_themes
|   |   |-- dashboardMetricRegistry.js # Metric definice
|   |   |-- slicerErrorClassifier.js   # Error classification
|   |   |-- cn.js                      # clsx utility (duplikat lib/utils.js)
|   |   `-- ini.js                     # INI parser (ORPHANED)
|   |
|   |-- styles/                        # Globalni CSS
|   |   |-- forge-tokens.css           # Design tokens (~45 CSS promennych)
|   |   |-- forge-typography.css       # Font tridy (12 trid)
|   |   |-- forge-animations.css       # Keyframe animace (12 animaci)
|   |   |-- forge-utilities.css        # Utility tridy
|   |   |-- forge-textures.css         # Textury a patterny
|   |   |-- index.css                  # Root import
|   |   `-- tailwind.css               # Tailwind @layer direktivy
|   |
|   |-- config/
|   |   `-- api.js                     # API base URL (HARDCODED LAN IP!)
|   |
|   |-- data/                          # Staticka data
|   |   |-- prusaParameterCatalog.js   # PrusaSlicer parametry (6272 r.)
|   |   |-- faq.js                     # FAQ data
|   |   `-- glossary.js                # Glosar pojmu
|   |
|   |-- firebase.js                    # Firebase config + init
|   |-- i18n.js                        # i18next init (nepouzivany)
|   |
|   `-- assets/
|       `-- logo.png                   # FORGE logo
|
|-- backend-local/                     # Express backend (dev-only)
|   |-- package.json                   # 6 dependencies
|   |-- src/
|   |   |-- index.js                   # Express server (483 r., port 3001)
|   |   |-- presetsStore.js            # Presets CRUD (FS JSON)
|   |   |
|   |   |-- slicer/                    # PrusaSlicer integrace
|   |   |   |-- runPrusaSlicer.js      # CLI spawn + timeout
|   |   |   |-- runPrusaInfo.js        # Model info extraction
|   |   |   |-- parseGcode.js          # G-code metriky parsing
|   |   |   `-- parseModelInfo.js      # Model geometry parsing
|   |   |
|   |   |-- storage/                   # File storage system
|   |   |   |-- storageService.js      # FS operace (551 r.)
|   |   |   |-- storageRouter.js       # Express routes (425 r.)
|   |   |   |-- checksumUtil.js        # SHA256 checksums
|   |   |   `-- metadataBuilder.js     # File metadata
|   |   |
|   |   |-- email/                     # Email system (pripraveno)
|   |   |   |-- emailService.js        # Email orchestrace
|   |   |   |-- emailProvider.js       # SMTP/Console provider
|   |   |   |-- templateRenderer.js    # Mustache-like sablony
|   |   |   |-- triggers.js            # Event-based triggery
|   |   |   `-- templates/index.js     # Email sablony
|   |   |
|   |   |-- routes/
|   |   |   `-- emailRoutes.js         # Email API routes (NEPRIPOJENY!)
|   |   |
|   |   `-- util/
|   |       |-- findSlicer.js          # PrusaSlicer binary discovery
|   |       `-- fsSafe.js              # Safe FS operace
|   |
|   |-- storage/                       # Fyzicke soubory (per-tenant)
|   |   `-- {tenantId}/
|   |       |-- CompanyLibrary/        # Firemni knihovna modelu
|   |       |-- Orders/                # Objednavkove slozky
|   |       `-- .trash/                # Kos
|   |
|   `-- profiles/                      # PrusaSlicer preset INI soubory
|
|-- supabase/                          # Supabase konfigurace
|   |-- schema.sql                     # 25 tabulek s RLS (551 r.)
|   |-- storage-policies.sql           # Storage bucket policies
|   `-- seed.sql                       # Testovaci data
|
|-- functions/                         # Firebase Cloud Functions
|   |-- index.js                       # Firestore triggers
|   `-- package.json
|
`-- tools/
    `-- prusaslicer/PrusaSlicer-2.9.4/ # Bundled PrusaSlicer binary
```

---

## 7. Route mapa

### 7.1 Vizualni wireframe

```
URL                              Komponenta              Layout        Auth    Lazy
========================================================================================

STANDALONE (bez Header/Footer):
/w/:publicWidgetId               WidgetPublicPage         ---           Ne      Ne
/slicer                          SlicerPage               ---           Ne      Ano
/admin/widget/builder/:id        AdminWidgetBuilder       ---           Ne      Ne

S HEADER + FOOTER:
/                                Home                     Header+Footer Ne      Ne
/pricing                         Pricing                  Header+Footer Ne      Ne
/support                         Support                  Header+Footer Ne      Ne
/login                           Login                    Header+Footer Ne      Ne
/register                        Register                 Header+Footer Ne      Ne
/account                         AccountPage              Header+Footer (*)     Ne
/test-kalkulacka                 TestKalkulacka           Header+Footer Ne      Ne
/test-kalkulacka-white           TestKalkulackaWhite      Header+Footer Ne      Ne
/model-upload                    → redirect → /test-kalkulacka-white
/invite/accept                   InviteAccept             Header+Footer Ne      Ne

ADMIN PANEL (AdminLayout sidebar):
/admin                           AdminDashboard           AdminLayout   (*)     Ne
/admin/branding                  AdminBranding            AdminLayout   (*)     Ne
/admin/pricing                   AdminPricing             AdminLayout   (*)     Ne
/admin/fees                      AdminFees                AdminLayout   (*)     Ne
/admin/parameters/*              AdminParameters          AdminLayout   (*)     Ne
/admin/presets/*                  AdminPresets             AdminLayout   (*)     Ne
/admin/orders/*                  AdminOrders              AdminLayout   (*)     Ne
/admin/model-storage             AdminModelStorage        AdminLayout   (*)     Ano
/admin/widget                    AdminWidget              AdminLayout   (*)     Ne
/admin/analytics                 AdminAnalytics           AdminLayout   (*)     Ne
/admin/team                      AdminTeamAccess          AdminLayout   (*)     Ne
/admin/express                   AdminExpress             AdminLayout   (*)     Ano
/admin/shipping                  AdminShipping            AdminLayout   (*)     Ano
/admin/emails                    AdminEmails              AdminLayout   (*)     Ano
/admin/coupons                   AdminCoupons             AdminLayout   (*)     Ano
/admin/migration                 AdminMigration           AdminLayout   (*)     Ano

FALLBACK:
*                                NotFound                 Header+Footer Ne      Ne

(*) = PrivateRoute ZAKOMENTOVANY — admin je aktualne verejne pristupny (P0 bug)
```

### 7.2 Navigacni struktura

```
                           Header (vzdy viditelny)
                          /    |    \       \
                         /     |     \       \
                       Home  Pricing  Support  Login/Register
                                                     |
                                                   Account

          Test-Kalkulacka ←→ Test-Kalkulacka-White
                |
         5-step wizard:
         1. Upload → 2. Config → 3. Slicer → 4. Rekapitulace → 5. Checkout
                                                                      |
                                                                  Order vytvoren
                                                                      |
                                                           Admin Panel (sidebar)
                                                          /    |    |    |    \
                                                 Dashboard Pricing Fees Orders ...
                                                                         |
                                                                  OrderDetailModal
                                                                  (3 taby: Customer,
                                                                   Shipping, Items+Files)
```

---

## 8. Komponentni hierarchie

### 8.1 Public stranky

```
Routes.jsx
  |-- SmoothScroll
  |-- ScrollToTop
  |-- Header.jsx (sdileny, Forge dark theme)
  |-- <main>
  |   |-- Home
  |   |   |-- ForgeHeroUnderline
  |   |   |-- ForgePrinterSVG
  |   |   |-- ForgeStatCard (x4)
  |   |   |-- ForgeNumberedCard (x4)
  |   |   |-- ForgeSectionLabel
  |   |   |-- ForgePricingCard (x3)
  |   |   |-- ForgeFaqAccordion
  |   |   `-- Reveal (scroll animace)
  |   |
  |   |-- Pricing
  |   |   |-- ForgeSectionLabel
  |   |   |-- ForgePricingCard (x3)
  |   |   |-- ForgeStatCard
  |   |   `-- ForgeFaqAccordion
  |   |
  |   |-- Support
  |   |   |-- ForgeSectionLabel
  |   |   |-- ForgeFaqAccordion
  |   |   |-- ForgeInput
  |   |   `-- ForgeButton
  |   |
  |   |-- TestKalkulacka (5-step wizard)
  |   |   |-- FileUploadZone (react-dropzone)
  |   |   |-- ModelViewer (Three.js)
  |   |   |-- PrintConfiguration (material, infill, layer height)
  |   |   |-- PricingCalculator (cena + breakdown)
  |   |   |-- GenerateButton (slicer trigger)
  |   |   |-- CouponInput
  |   |   |-- CheckoutForm (react-hook-form + zod)
  |   |   |-- OrderConfirmation
  |   |   `-- ErrorBoundary
  |   |
  |   `-- Login / Register / Account / NotFound
  |
  `-- Footer.jsx (sdileny, Forge dark theme)
```

### 8.2 Admin panel

```
AdminLayout.jsx
  |-- Sidebar (navigace, 15 polozek)
  |-- Mobile hamburger menu
  |-- <Outlet>
      |
      |-- AdminDashboard
      |   |-- KPI karty
      |   |-- Revenue graf (Recharts)
      |   |-- Material pouziti
      |   `-- Posledni objednavky
      |
      |-- AdminPricing (3173 r. — nejvetsi soubor)
      |   |-- MaterialEditor (CRUD)
      |   |-- Markup konfigurace
      |   |-- Volume Discounts (pravidla, preview)
      |   |-- Minimum prices
      |   |-- Rounding pravidla
      |   `-- Pricing preview/simulator
      |
      |-- AdminFees (2418 r.)
      |   |-- MODEL fees (per-model poplatky)
      |   |-- ORDER fees (per-objednavka poplatky)
      |   |-- Fee types: selektivni/povinne/skryte
      |   `-- Negativni poplatky (slevy)
      |
      |-- AdminOrders
      |   |-- OrdersList (tabulka, filtry, paginace)
      |   |-- KanbanBoard (drag & drop statusy)
      |   `-- OrderDetailModal (70% overlay)
      |       |-- TabCustomer (kontakt, poznamky, aktivita)
      |       |-- TabShipping (adresa, stitek)
      |       `-- TabItemsFiles (modely, soubory, download)
      |
      |-- AdminWidget
      |   |-- WidgetConfigTab
      |   |-- WidgetDomainsTab
      |   |-- WidgetEmbedTab
      |   |-- WidgetSettingsTab
      |   `-- AdminWidgetBuilder (fullscreen)
      |       |-- BuilderTopBar
      |       |-- BuilderLeftPanel
      |       |-- BuilderRightPanel
      |       |-- DevicePreviewFrame
      |       |-- OnboardingOverlay
      |       `-- QuickThemeDropdown
      |
      `-- AdminModelStorage
          |-- FolderTreePanel
          |-- FileListPanel
          |-- FileToolbar
          |-- BreadcrumbBar
          `-- PreviewPanel
```

---

## 9. Data flow

### 9.1 Zivotni cyklus objednavky

```
ZAKAZNIK                    FRONTEND                 BACKEND              STORAGE
   |                           |                        |                    |
   |  1. Nahraje STL soubor    |                        |                    |
   |-------------------------->|                        |                    |
   |                           |  2. POST /api/slicer   |                    |
   |                           |----------------------->|                    |
   |                           |                        | 3. PrusaSlicer CLI |
   |                           |                        |    spawn + parse   |
   |                           |  4. { time, grams }    |                    |
   |                           |<-----------------------|                    |
   |                           |                        |                    |
   |                           |  5. Pricing Engine V3  |                    |
   |                           |  (lokalni kalkulace)   |                    |
   |                           |     base_price         |                    |
   |                           |     + MODEL fees       |                    |
   |                           |     + markup           |                    |
   |                           |     + volume discount  |                    |
   |                           |     + minima           |                    |
   |                           |     + rounding         |                    |
   |                           |     = final_price      |                    |
   |  6. Zobrazi cenu          |                        |                    |
   |<--------------------------|                        |                    |
   |                           |                        |                    |
   |  7. Vyplni checkout       |                        |                    |
   |-------------------------->|                        |                    |
   |                           |  8. POST /api/storage/orders               |
   |                           |----------------------->|                    |
   |                           |                        | 9. Ulozi soubory   |
   |                           |                        |------------------->|
   |                           |                        | (model, gcode,     |
   |                           |                        |  preset, metadata) |
   |                           |                        |                    |
   |                           | 10. { order + storage }|                    |
   |                           |<-----------------------|                    |
   |                           |                        |                    |
   |                           | 11. Ulozi do localStorage                   |
   |                           |     (adminOrdersStorage)                    |
   |                           |                        |                    |
   |  12. OrderConfirmation    |                        |                    |
   |<--------------------------|                        |                    |
```

### 9.2 Pricing data flow

```
Admin nakonfiguruje:
  AdminPricing → adminPricingStorage → localStorage (pricing:v3)
  AdminFees    → adminFeesStorage    → localStorage (fees:v3)

Zakaznik v kalkulacce:
  TestKalkulacka → PricingCalculator
                       |
                       v
              pricingEngineV3.calculatePrice({
                weight_g, time_min, materialId, quantity,
                pricingConfig, feesConfig
              })
                       |
                       v
              Pipeline:
              1. base_price = weight_g * price_per_gram
              2. + MODEL fees (selektivni, povinne)
              3. * markup multiplier
              4. * volume discount (dle quantity pravidel)
              5. max(result, minimum_price)
              6. round(result, rounding_rules)
                       |
                       v
              { finalPrice, breakdown[] }
```

---

## 10. Pricing Engine pipeline

```
INPUT                    PIPELINE STEPS                          OUTPUT
=====                    ==============                          ======

weight_g          1. BASE PRICE                          finalPrice (number)
time_min             weight_g * price_per_gram           breakdown (array)
materialId           → base_price                        modelTotal (number)
quantity                                                 orderTotal (number)
pricingConfig     2. MODEL FEES
feesConfig           for each fee where scope=MODEL:
                     if fee.type === 'percentage':
                       base_price * fee.value / 100
                     else:
                       fee.value
                     → subtotal_after_fees

                  3. MARKUP
                     subtotal * markup_multiplier
                     → subtotal_after_markup

                  4. VOLUME DISCOUNTS
                     match quantity against discount rules
                     (e.g., 5+ = -10%, 10+ = -20%)
                     → subtotal_after_volume

                  5. MINIMUM PRICE
                     max(subtotal, minimum_price)
                     → subtotal_after_min

                  6. ROUNDING
                     round to nearest N (e.g., 5 Kc)
                     → final_model_price

                  7. ORDER FEES (per-order)
                     for each fee where scope=ORDER:
                     add to order total
                     → order_total

                  RESULT:
                  {
                    finalPrice: 186.00,
                    breakdown: [
                      { label: "Zakladni cena", value: 120 },
                      { label: "Express", value: 50 },
                      { label: "Markup 1.2x", value: 24 },
                      { label: "Volume -10%", value: -16 },
                      ...
                    ]
                  }
```

---

## 11. Storage architektura

### 11.1 localStorage (soucasny primarni storage)

```
modelpricer:tenant_id                    → "demo-tenant"
modelpricer:{tid}:pricing:v3             → { materials: [...], markup: {...}, ... }
modelpricer:{tid}:fees:v3                → { modelFees: [...], orderFees: [...] }
modelpricer:{tid}:branding               → { companyName, logo, colors }
modelpricer:{tid}:orders                 → [ order1, order2, ... ]
modelpricer:{tid}:analytics              → { events: [...], metrics: {...} }
modelpricer:{tid}:team_access            → { members: [...], roles: [...] }
modelpricer:{tid}:dashboard              → { layout: [...], widgets: [...] }
modelpricer:{tid}:kanban                 → { columns: [...], config: {...} }
modelpricer:{tid}:coupons                → { coupons: [...] }
modelpricer:{tid}:email_config           → { templates: [...], smtp: {...} }
modelpricer:{tid}:express                → { tiers: [...] }
modelpricer:{tid}:shipping               → { zones: [...], methods: [...] }
modelpricer:{tid}:form_fields            → { fields: [...] }
modelpricer:{tid}:audit_log              → [ event1, event2, ... ]
modelpricer:{tid}:widget_themes          → { themes: [...] }
modelpricer:{tid}:parameters             → { catalog: [...] }
modelpricer:{tid}:presets                → { presets: [...] }
```

### 11.2 Supabase (migrace, budouci)

| Tabulka | localStorage namespace | Status |
|---------|------------------------|--------|
| `pricing_configs` | `pricing:v3` | Pripraveno |
| `fees_configs` | `fees:v3` | Pripraveno |
| `materials` | (v pricing:v3) | Pripraveno |
| `orders` | `orders` | Pripraveno |
| `order_items` | (v orders) | Pripraveno |
| `branding` | `branding` | Pripraveno |
| `widget_configs` | `widget_themes` | Pripraveno |
| `analytics_events` | `analytics` | Pripraveno |
| `team_members` | `team_access` | Pripraveno |
| `audit_logs` | `audit_log` | Pripraveno |
| ... | | 25 tabulek celkem |

**Feature Flags (per-namespace):**

| Mode | Chovani |
|------|---------|
| `localStorage` | Pouze localStorage (default, bezpecny) |
| `supabase` | Pouze Supabase |
| `dual-write` | localStorage + fire-and-forget Supabase zapis |

### 11.3 File System (backend)

```
backend-local/storage/
  {tenantId}/
    CompanyLibrary/
      Modely/               # Firemni knihovna modelu
    Orders/
      #{orderNumber}__{uuid}/
        models/              # STL/OBJ/3MF soubory
        gcode/               # Vygenerovane G-code
        presets/              # INI konfigurace
        meta/
          file-manifest.json  # SHA256 checksums
          order-meta.json     # Metadata objednavky
          pricing-snapshot.json
    .trash/                  # Smazane soubory
```

---

## 12. Backend API kontrakty

### 12.1 Slicer API

| Metoda | Endpoint | Popis | Body | Response |
|--------|----------|-------|------|----------|
| POST | `/api/slicer` | Spusti PrusaSlicer | `FormData: file, presetId, layerHeight, infill, supports` | `{ success, metrics: { time_min, weight_g, filament_mm } }` |
| GET | `/api/slicer/health` | Health check | - | `{ status, slicerPath, version }` |
| GET | `/api/slicer/presets` | Seznam presetu | - | `{ presets: [...] }` |

### 12.2 Presets API

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/presets` | Seznam vsech presetu |
| GET | `/api/presets/:id` | Detail presetu |
| POST | `/api/presets` | Vytvoreni presetu |
| PUT | `/api/presets/:id` | Aktualizace presetu |
| DELETE | `/api/presets/:id` | Smazani presetu |
| POST | `/api/presets/import` | Import INI souboru |
| GET | `/api/presets/export/:id` | Export jako INI |

### 12.3 Storage API

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/storage/tree` | Strom slozek |
| GET | `/api/storage/list` | Seznam souboru ve slozce |
| POST | `/api/storage/mkdir` | Vytvoreni slozky |
| POST | `/api/storage/upload` | Upload souboru (multer) |
| GET | `/api/storage/download/:path` | Stazeni souboru |
| DELETE | `/api/storage/delete` | Smazani (→ trash) |
| POST | `/api/storage/rename` | Prejmenovani |
| POST | `/api/storage/move` | Presunuti |
| POST | `/api/storage/copy` | Kopirovani |
| GET | `/api/storage/preview/:path` | Nahled souboru |
| POST | `/api/storage/zip` | ZIP stazeni |
| POST | `/api/storage/orders` | Vytvoreni order slozky |
| GET | `/api/storage/trash` | Obsah kose |
| POST | `/api/storage/restore` | Obnoveni z kose |

### 12.4 CORS & Proxy

```
Frontend (Vite :4028) → proxy /api/* → Backend (Express :3001)
CORS: origin ['http://localhost:4028', 'http://127.0.0.1:4028']
```

---

## 13. Supabase infrastruktura

### 13.1 Schema (25 tabulek)

```sql
-- Hlavni tabulky s RLS (Row Level Security)
tenants, tenant_users, pricing_configs, materials,
volume_discount_rules, fees_configs, fee_items,
orders, order_items, order_fees, order_activity,
presets, preset_materials, parameters, parameter_categories,
branding, widget_configs, widget_domains,
team_invites, analytics_events, audit_logs,
coupons, coupon_usage, email_templates, email_logs
```

### 13.2 Storage Buckety

| Bucket | Typ | Ucel |
|--------|-----|------|
| `models` | private | 3D modely (STL, OBJ, 3MF) |
| `documents` | private | G-code, presety, metadata |
| `branding` | public | Loga, brandy |

### 13.3 Migrace

19 migraci v `migrationRunner.js`, spustitelne pres `AdminMigration.jsx`:
- Dry-run mode, progress bar, backup download
- Per-namespace mode switching (localStorage → dual-write → supabase)

---

## 14. Widget a Embed system

### 14.1 Architektura

```
E-shop (externi web)
  |
  |  <script src="https://forge.app/widget.js"></script>
  |  <div id="forge-widget" data-id="abc123"></div>
  |
  v
widget.js (loader)
  |
  |  Vytvori <iframe src="https://forge.app/w/abc123">
  |
  v
WidgetPublicPage.jsx → WidgetKalkulacka
  |
  |  postMessage({ type: 'FORGE_PRICE_UPDATE', price: 186 })
  |
  v
E-shop (prijme postMessage, zobrazi cenu)
```

### 14.2 Bezpecnost

- Domain whitelist v `widget_configs.allowed_domains`
- postMessage origin validace (POZOR: aktualne `target: '*'` — P0 bug)
- Samostatna route bez Header/Footer (cista iframe)

### 14.3 Widget Builder

- Vizualni editor (`/admin/widget/builder/:id`)
- Fullscreen layout (bez admin sidebar)
- Undo/Redo (useUndoRedo hook)
- Quick themes (prednastavene barevne schemata)
- Element registry (konfigurovatelne UI elementy)
- Onboarding overlay (prvni pouziti)
- Device preview (desktop/tablet/mobile ramecky)

---

## 15. Forge Design System

### 15.1 Principy

- **Tmave pozadi** — `#08090C` (void), `#12141A` (surface)
- **Zadna genericka modra** — hlavni akcenty: teal `#00D4AA` + orange `#F97316`
- **WCAG AA compliance** — min kontrast 4.5:1
- **Anti-AI checklist** — zadne "typicke AI" patterny

### 15.2 Klicove tokeny

```css
/* Pozadi */
--forge-bg-void:       #08090C;    /* Hlavni pozadi */
--forge-bg-surface:    #12141A;    /* Karty, panely */
--forge-bg-elevated:   #1A1D24;    /* Zvysene elementy */

/* Text */
--forge-text-primary:  #E8ECF1;    /* Hlavni text */
--forge-text-secondary:#9BA3B0;    /* Sekundarni */
--forge-text-muted:    #7A8291;    /* Utlumeny (WCAG AA) */

/* Akcenty */
--forge-accent-teal:   #00D4AA;    /* Primarni CTA */
--forge-accent-orange: #F97316;    /* Sekundarni CTA */

/* Fonty */
--forge-font-heading:  'Space Grotesk';  /* Nadpisy (text-lg+) */
--forge-font-body:     'Inter';          /* Telo textu */
--forge-font-tech:     'Space Mono';     /* Ceny, kody, 12px labely */
```

### 15.3 Font pravidla

| Pouziti | Font | Kdy |
|---------|------|-----|
| Nadpisy (h1-h4, text-lg+) | `--forge-font-heading` (Space Grotesk) | Vzdy pro velky text |
| Telo textu | `--forge-font-body` (Inter) | Odstavce, popisy |
| Ceny, kody, rozmery | `--forge-font-tech` (Space Mono) | POUZE male 12px labely |

### 15.4 Komponenty (26 ks)

Vsechny v `src/components/ui/forge/` s prefixem `Forge*`. Detaily viz `Forge-Design-System-Dokumentace.md`.

---

## 16. i18n (lokalizace)

### 16.1 Implementace

- **LanguageContext.jsx** — inline CS/EN slovnik (1130 radku, 462 klicu)
- Hook: `useLanguage()` → `{ t, language, setLanguage }`
- Prepinani: `cs` ↔ `en` (ikona vlajky v Header)
- 100% parita CS/EN klicu

### 16.2 Namespaces

```
common.*        — sdilene texty (Ulozit, Zrusit, Nacitani...)
admin.*         — admin panel
admin.pricing.* — pricing sekce
admin.fees.*    — fees sekce
admin.orders.*  — orders sekce
admin.storage.* — model storage
checkout.*      — checkout formular
pricing.*       — cenova stranka
support.*       — podpora
```

### 16.3 Znamy problemy

- Nektery texty jsou hardcoded (bez `t()`)
- Marketing komponenty nepouzivaji `useLanguage()`
- Slicer UI je kompletne anglicky
- Nektere admin stranky maji smesici CS/EN textu

---

## 17. Bezpecnostni prehled

### 17.1 Kriticke problemy (P0)

| # | Problem | Kde | Dopad |
|---|---------|-----|-------|
| 1 | **PrivateRoute zakomentovany** | `Routes.jsx:86-88` | Admin panel verejne pristupny |
| 2 | **Zadna autentizace na API** | `backend-local/src/index.js` | 22 endpointu bez auth |
| 3 | **Firestore wildcard rules** | `firestore.rules` | Kazdy prihlaseny uzivatel cte/pise cokoliv |
| 4 | **Health endpoint leaks paths** | `/api/slicer/health` | Odhaluje interni cesty serveru |
| 5 | **postMessage target '*'** | Widget embed | Cross-origin data leak |
| 6 | **Upload bez file type validace** | `/api/storage/upload` | Prijme .exe, .bat, cokoliv |

### 17.2 Dulezite problemy (P1)

- Hardcoded `tenant_id: 'demo-tenant'` na 4+ mistech
- Account stranka bez PrivateRoute
- `console.log` leaks PII v account page
- Chybejici rate limiting na vsech API endpointech
- Chybejici CSRF ochrana

---

## 18. Znamy technicky dluh

### 18.1 Dead code

| Soubor | Duvod |
|--------|-------|
| `src/lib/pricingService.js` | Nahrazen pricingEngineV3.js |
| `src/lib/slicingApiClient.js` | Nikde nepouzivan (orphaned) |
| `src/utils/ini.js` | Nikde nepouzivan (orphaned) |
| `src/hooks/useAuth.js` | Nahrazen AuthContext.jsx |
| `src/i18n.js` | Nahrazen LanguageContext.jsx |
| 15/16 marketing komponent | Nahrazeny Forge variantami |
| 6 subkomponent v test-kalkulacka | Pripraveny ale nepouzivany |
| `src/components/ui/ErrorState.jsx` | Implementovan ale nepouzivan |
| `src/components/ui/LoadingState.jsx` | Implementovan ale nepouzivan |
| `src/components/FilePreview.jsx` | Duplikat, nepouzivan |
| `src/components/ModelPreview.jsx` | Duplikat, nepouzivan |

### 18.2 Duplikace

| Duplikat | Pocet | Problem |
|----------|-------|---------|
| `safeNum()` funkce | 4x | Ruzne implementace v ruznych souborech |
| `createId()`/`uuid()` | 4x | Ruzne UUID generatory |
| ErrorBoundary | 4x | V test-kalkulacka, white, widget + globalni |
| `cn()` utility | 2x | `src/utils/cn.js` vs `src/lib/utils.js` |
| `useAuth` hook | 2x | `src/hooks/useAuth.js` vs `src/context/AuthContext.jsx` |
| test-kalkulacka-white | cela slozka | Kompletni kopie test-kalkulacka |

### 18.3 Error logy

- **Error_Log.md** — 507 radku, 69+ zaznamu (code bugy, state issues, security, config)
- **Design-Error_LOG.md** — 1183 radku, 166+ zaznamu (font, color, WCAG, spacing, responsive, inline-style, token, layout)

Detailni chyby viz jednotlive error log soubory v `docs/claude/`.

---

## 19. Jak spustit projekt

### 19.1 Predpoklady

- Node.js 18+
- npm
- PrusaSlicer 2.9.4 (volitelne, pro slicer funkce)

### 19.2 Frontend

```bash
cd Model_Pricer-V2-main
npm install
npm run dev          # → http://localhost:4028
```

### 19.3 Backend

```bash
cd Model_Pricer-V2-main/backend-local
npm install
node src/index.js    # → http://localhost:3001
```

### 19.4 Build

```bash
npm run build        # → build/ slozka
npm run serve        # → nahled produkciho buildu
```

### 19.5 Dulezite porty

| Sluzba | Port | Popis |
|--------|------|-------|
| Vite Dev Server | 4028 | Frontend |
| Express Backend | 3001 | API + slicer + storage |
| PrusaSlicer | - | CLI (spawn child process) |

---

## 20. Katalog dokumentace

### 20.1 Public Frontend

| Dokument | Popis | Soubor |
|----------|-------|--------|
| [Home](Home-Dokumentace.md) | Homepage, hero, pricing preview, FAQ | `src/pages/home/` |
| [Pricing](Pricing-Dokumentace.md) | Cenova stranka, 3 tarify | `src/pages/pricing/` |
| [Support](Support-Dokumentace.md) | Podpora, FAQ, kontaktni formular | `src/pages/support/` |
| [Login](Login-Dokumentace.md) | Prihlaseni (Firebase Auth) | `src/pages/login/` |
| [Register](Register-Dokumentace.md) | Registrace (multi-step) | `src/pages/register/` |
| [Account](Account-Dokumentace.md) | Uzivatelsky profil | `src/pages/account/` |
| [NotFound](NotFound-Dokumentace.md) | 404 stranka | `src/pages/NotFound.jsx` |

### 20.2 Kalkulacky

| Dokument | Popis | Soubor |
|----------|-------|--------|
| [Test-Kalkulacka](Test-Kalkulacka-Dokumentace.md) | Hlavni kalkulacka (dark theme, 5-step wizard) | `src/pages/test-kalkulacka/` |
| [Test-Kalkulacka-White](Test-Kalkulacka-White-Dokumentace.md) | Kalkulacka (light theme, kopie) | `src/pages/test-kalkulacka-white/` |
| [Widget-Kalkulacka](Widget-Kalkulacka-Dokumentace.md) | Embedovatelna widget kalkulacka | `src/pages/widget-kalkulacka/` |

### 20.3 Admin Panel

| Dokument | Popis | Soubor |
|----------|-------|--------|
| [AdminLayout](AdminLayout-Dokumentace.md) | Sidebar layout, navigace | `AdminLayout.jsx` |
| [AdminDashboard](AdminDashboard-Dokumentace.md) | Dashboard, KPI, grafy | `AdminDashboard.jsx` |
| [AdminPricing](AdminPricing-Dokumentace.md) | Materialy, markup, volume discounts | `AdminPricing.jsx` |
| [AdminFees](AdminFees-Dokumentace.md) | MODEL + ORDER poplatky | `AdminFees.jsx` |
| [AdminParameters](AdminParameters-Dokumentace.md) | PrusaSlicer parametry | `AdminParameters.jsx` |
| [AdminPresets](AdminPresets-Dokumentace.md) | Preset management | `AdminPresets.jsx` |
| [AdminWidget](AdminWidget-Dokumentace.md) | Widget config + builder | `AdminWidget.jsx` |
| [AdminBranding](AdminBranding-Dokumentace.md) | Logo, barvy, nazev | `AdminBranding.jsx` |
| [AdminAnalytics](AdminAnalytics-Dokumentace.md) | Statistiky, export | `AdminAnalytics.jsx` |
| [AdminTeamAccess](AdminTeamAccess-Dokumentace.md) | Tym, role, pozvani | `AdminTeamAccess.jsx` |
| [AdminExpress-Shipping](AdminExpress-Shipping-Dokumentace.md) | Express tisk + doprava (lazy) | `AdminExpress.jsx` + `AdminShipping.jsx` |
| [AdminEmails-Coupons](AdminEmails-Coupons-Dokumentace.md) | Emaily + kupony (lazy) | `AdminEmails.jsx` + `AdminCoupons.jsx` |
| [AdminMigration](AdminMigration-Dokumentace.md) | Supabase migrace (lazy) | `AdminMigration.jsx` |
| [Orders](Orders-Dokumentace.md) | Objednavky, checkout, kanban | `AdminOrders.jsx` + subsystem |
| [Model Storage](Model_Storage-Dokumentace.md) | Souborovy manazer | `AdminModelStorage.jsx` + subsystem |

### 20.4 Slicer

| Dokument | Popis | Soubor |
|----------|-------|--------|
| [Slicer](Slicer-Dokumentace.md) | PrusaSlicer-like UI (prototype) | `src/pages/slicer/` |

### 20.5 Backend

| Dokument | Popis | Soubor |
|----------|-------|--------|
| [Backend-Server](Backend-Server-Dokumentace.md) | Express setup, middleware, CORS | `backend-local/src/index.js` |
| [Backend-Slicer](Backend-Slicer-Dokumentace.md) | PrusaSlicer CLI integrace | `backend-local/src/slicer/` |
| [Backend-Email](Backend-Email-Dokumentace.md) | Email system (pripraveny) | `backend-local/src/email/` |
| [Backend-Presets](Backend-Presets-Dokumentace.md) | Presets + Storage service | `backend-local/src/presetsStore.js` + `storage/` |

### 20.6 Core Systems

| Dokument | Popis | Soubor |
|----------|-------|--------|
| [LanguageContext](LanguageContext-Dokumentace.md) | i18n provider (462 klicu CS+EN) | `src/contexts/LanguageContext.jsx` |
| [Routing](Routing-Dokumentace.md) | React Router konfigurace | `src/Routes.jsx` |
| [Pricing-Engine](Pricing-Engine-Dokumentace.md) | Pricing pipeline V3 | `src/lib/pricing/` |
| [Storage-Utilities](Storage-Utilities-Dokumentace.md) | 20 tenant-scoped helperu | `src/utils/` |
| [Hooks](Hooks-Dokumentace.md) | 5 custom React hooks | `src/hooks/` |

### 20.7 Infrastructure

| Dokument | Popis | Soubor |
|----------|-------|--------|
| [Supabase](Supabase-Dokumentace.md) | Schema, RLS, migrace | `supabase/` + `src/lib/supabase/` |
| [Build-Config](Build-Config-Dokumentace.md) | Vite, Tailwind, PostCSS | `vite.config.mjs` + configs |
| [Firebase](Firebase-Dokumentace.md) | Auth, Hosting, Firestore | `firebase.json` + `firestore.rules` |
| [Forge-Design-System](Forge-Design-System-Dokumentace.md) | Design tokeny, 26 komponent, CSS | `src/styles/` + `src/components/ui/forge/` |

### 20.8 Komponenty a Utility

| Dokument | Popis | Soubor |
|----------|-------|--------|
| [Base-UI-Components](Base-UI-Components-Dokumentace.md) | 18 base UI komponent | `src/components/ui/` |
| [Marketing-Components](Marketing-Components-Dokumentace.md) | 24 marketing komponent | `src/components/marketing/` + Forge |
| [Utility-Components](Utility-Components-Dokumentace.md) | 10 utility komponent | `src/components/` (root) |
| [Services-API](Services-API-Dokumentace.md) | 3 API klienti | `src/services/` |
| [Lib-Utilities](Lib-Utilities-Dokumentace.md) | cn, pricingService, ini, slicingApiClient | `src/lib/` + `src/utils/` |

### 20.9 Error logy

| Soubor | Popis | Radku | Zaznamu |
|--------|-------|-------|---------|
| `docs/claude/Error_Log.md` | Kodove chyby, state, security, config | 507 | 69+ |
| `docs/claude/Design-Error_LOG.md` | Design nesrovnalosti, WCAG, fonty | 1183 | 166+ |

---

## Statistiky projektu

| Metrika | Hodnota |
|---------|---------|
| Celkem zdrojovych souboru (JS/JSX/MJS) | 291 |
| Celkem radku kodu | ~72 500 |
| Celkem CSS souboru | 12 |
| Celkem CSS radku | ~1 440 |
| React komponent | ~150 |
| Admin stranek | 18 |
| Public stranek | 7 |
| API endpointu | 22 |
| Storage helperu | 20 |
| Custom hooks | 5 |
| Forge komponent | 26 |
| Prekladovych klicu | 462 (CS + EN) |
| Supabase tabulek | 25 |
| npm dependencies | 38 |
| npm devDependencies | 12 |
| Nejvetsi soubor | `AdminPricing.jsx` (3173 r.) |
| Dokumentacnich souboru | 45 |
