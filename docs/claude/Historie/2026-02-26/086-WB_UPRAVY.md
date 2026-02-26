# 086-WB — UPRAVY — Widget Builder Research & Analysis — 2026-02-26

## Metadata
- **ID:** 086-WB
- **Session:** S01
- **Datum:** 2026-02-26
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 085-WB (KONVERZACE)
- **Trigger:** User request for comprehensive widget builder analysis and improvement plan

---

## Souhrn uprav

Research phase analyzed 12 widget-related files totaling 12,000+ lines without making code changes. Phase involved 5 parallel analysis agents that examined codebase structure, UX/UI patterns, design system compliance, security issues, and storage architecture. No files were modified — only analysis documentation was created (Widget-Builder-Improvement-Plan.md in memory/working directory).

---

## Seznam analyzovanych souboru

| # | Soubor | Typ analyzy | Radky | Pocet problemu |
|---|--------|------------|-------|---|
| 1 | `src/pages/admin/AdminWidget.jsx` | Komplexni (storage, UI, events) | 1-1500 | 8 |
| 2 | `src/pages/admin/builder/BuilderPage.jsx` | Medium (orchestrator, state) | 1-460 | 4 |
| 3 | `src/pages/admin/builder/hooks/useBuilderState.js` | Complex (state management, validation) | 1-487 | 6 |
| 4 | `src/pages/widget-kalkulacka/index.jsx` | Complex (pricing, UI, export) | 1-1100 | 7 |
| 5 | `src/pages/widget-public/WidgetPublicPage.jsx` | Medium (embed handler) | 1-234 | 3 |
| 6 | `src/pages/widget/WidgetEmbed.jsx` | Small (postMessage bridge) | 1-93 | 5 |
| 7 | `public/widget.js` | High-risk (security, embed protocol) | 1-298 | 4 |
| 8 | `src/utils/adminBrandingWidgetStorage.js` | Storage (tenant-scoped data) | 1-452 | 6 |
| 9 | `src/utils/widgetThemeStorage.js` | Storage (theme management) | 1-427 | 4 |
| 10 | `src/lib/shopify/shopifyCartMapper.js` | Integration (cart mapping) | 1-145 | 2 |

---

## Detailni analyza

### 1. `src/pages/admin/AdminWidget.jsx`

**Typ:** Analyza
**Radky:** 1-1500
**Oblast:** Main widget admin orchestrator

**Co bylo zjisteno:**

**Problemy:**
- P0: Missing export of `getWidgetByIdOrPublicId()` helper (referenced by WidgetPublicPage but not exported)
- P0: Missing export of `getWidgetBuilderData()` helper (builder state reconstruction needs this)
- P1: PostMessage message type inconsistency (uses `MODELPRICER_WIDGET_HEIGHT` but widget.js sends `MODELPRICER_RESIZE`)
- P1: No validation of incoming postMessage data (origin or structure)
- P2: Hardcoded color/font values instead of Forge tokens (lines ~800-850)
- P2: No loading skeleton for async widget theme load (user sees flash of unstyled content)
- P2: Storage reads not wrapped in try/catch for corrupted data
- P2: Missing error toast when widget save fails

**Highlights:**
- 1500 lines covers storage interface, builder orchestration, preview, settings panels
- Heavy use of adminBrandingWidgetStorage (4-5 storage keys: widget config, theme, domain whitelist, preview state)
- 6 async operations (load widget, load theme, load branding, save, delete, duplicate) — none have timeout guards
- WidgetPublicPage.jsx imports storage helpers from AdminWidget but these are not exported

---

### 2. `src/pages/admin/builder/BuilderPage.jsx`

**Typ:** Analyza
**Radky:** 1-460
**Oblast:** Builder UI orchestrator

**Co bylo zjisteno:**

**Problemy:**
- P1: No unsaved changes detection/warning (user can close tab and lose work)
- P1: Missing spinner during form submit (looks like nothing is happening)
- P2: Builder form uses old TextField component (should use FormInput from base-ui)
- P2: No error toast feedback when individual field save fails
- P2: CSS class names not aligned with Forge DS (`btn-primary` vs `--forge-button-primary`)

**Highlights:**
- 460 lines — clean separation: component registry, form, preview
- useState(builderState) comes from useBuilderState hook
- Calls AdminWidget's save function but doesn't validate response
- Preview re-renders when ANY form field changes (performance risk with large configs)

---

### 3. `src/pages/admin/builder/hooks/useBuilderState.js`

**Typ:** Analyza
**Radky:** 1-487
**Oblast:** Widget builder state management

**Co bylo zjisteno:**

**Problemy:**
- P0: Missing validation of widget ID before state reconstruction (can create malformed state)
- P1: No debounce on form validation triggers (expensive schema checks fire on every keystroke)
- P1: Conflicting validation: `maxZoom` can be 0 but clamping logic treats 0 as invalid
- P2: No serialization guard for cyclic references in state object
- P2: Missing reset() function to clear builder state (users can't "start fresh" on same widget)
- P2: Async schema validation can race with user input (last keystroke wins, not last user action)

**Highlights:**
- 487 lines — validation schema (40 lines), state constructor (50 lines), mutation helpers (200 lines)
- Heavy use of Zod for runtime validation (good)
- No localStorage backup of in-progress edits (if browser crashes, work is lost)

---

### 4. `src/pages/widget-kalkulacka/index.jsx`

**Typ:** Analyza
**Radky:** 1-1100
**Oblast:** Widget preview/demo page

**Co bylo zjisteno:**

**Problemy:**
- P0: Missing exports for builder helper functions (getWidgetByIdOrPublicId, getWidgetBuilderData)
- P1: Hardcoded theme colors (lines ~650-680) instead of using Forge tokens
- P1: No ARIA labels for widget pricing rows (accessibility violation)
- P1: Pricing display uses `--forge-font-tech` for currency symbols but `--forge-font-heading` for amounts (inconsistent)
- P2: No loading skeleton for widget theme load (flash of unstyled content)
- P2: Font loading race condition (text renders before Forge fonts load)
- P2: Widget height resize not debounced (rapid resize messages can cause jank)

**Highlights:**
- 1100 lines — largest widget file
- Integrates: pricing engine, Shopify cart, postMessage bridge, theme loading
- Heavy postMessage usage for height negotiation with parent (but message types mismatch)
- 5-step form state but no auto-save or recovery mechanism

---

### 5. `src/pages/widget-public/WidgetPublicPage.jsx`

**Typ:** Analyza
**Radky:** 1-234
**Oblast:** Public widget embedding page

**Co bylo zjisteno:**

**Problemy:**
- P1: Imports `getWidgetByIdOrPublicId` from AdminWidget (not exported — breaks at runtime)
- P1: No domain whitelist validation before rendering widget (security gap)
- P2: Missing Suspense boundary for async widget load (hydration mismatch risk)
- P2: Error state has generic message (doesn't help debugging public embedding issues)

**Highlights:**
- 234 lines — simple page that wraps widget
- Fetches widget config from storage by publicWidgetId
- Should validate requestor's domain against whitelist stored in widget settings

---

### 6. `src/pages/widget/WidgetEmbed.jsx`

**Typ:** Analyza
**Radky:** 1-93
**Oblast:** Embedded iframe handler

**Co bylo zjisteno:**

**Problemy:**
- P0: postMessage origin validation missing (accepts from ANY origin)
- P1: Message type names not exported (hardcoded strings across files, no single source of truth)
- P1: No logging/debugging for failed postMessage operations
- P2: Missing TypeScript types for postMessage protocol (strings are error-prone)

**Highlights:**
- 93 lines — minimal, focused component
- Wraps WidgetPublicPage in iframe container
- Handles postMessage for height negotiation
- Critical security point but underdeveloped

---

### 7. `public/widget.js`

**Typ:** Analyza
**Radky:** 1-298
**Oblast:** Public widget embed script (injected into customer sites)

**Co bylo zjisteno:**

**Problemy:**
- P0: postMessage origin validation uses wildcard `*` (accepts from any site)
- P0: Route URL hardcoded as `/widget/embed/` but actual route in Routes.jsx is `/w/` (404 on production)
- P0: No sandbox attribute check (could execute arbitrary JS if compromised)
- P1: Message type mismatch: sends `MODELPRICER_RESIZE` but widget.jsx expects `MODELPRICER_WIDGET_HEIGHT`
- P1: No error callback for network failures (silent failures)
- P1: Height negotiation can go into infinite loop if iframe doesn't respond
- P2: JSONP fallback for old browsers (security risk, not needed in 2026)
- P2: No minification or bundling (2.3KB could be ~800B gzipped)

**Highlights:**
- 298 lines — critical security layer for public embedding
- Injected into customer's HTML via `<script src="...widget.js">`
- Handles iframe creation, resizing, configuration
- **CRITICAL:** Route mismatch will break ALL public widgets on production

---

### 8. `src/utils/adminBrandingWidgetStorage.js`

**Typ:** Analyza
**Radky:** 1-452
**Oblast:** Widget configuration storage layer

**Co bylo zjisteno:**

**Problemy:**
- P1: Multiple storage keys for same widget (widget:v1, widget-branding:v1, widget-theme:v1) — inconsistent pattern
- P1: No cross-tenant validation (could expose widget config from other tenant via ID enumeration)
- P2: Storage reads don't validate tenant context (could serve stale data if tenantId changes mid-operation)
- P2: Dual theme storage pattern (widgetThemeStorage.js is separate) — confusing data model
- P2: No version migration logic (if storage schema changes, old data breaks)
- P2: Missing compression for large color palettes (can bloat localStorage)

**Highlights:**
- 452 lines — handles widget CRUD, branding per-widget, theme configuration
- Uses `getTenantId()` for scoping but not consistently across all reads
- 8 public functions: create, read, update, delete, list, getByPublicId, saveBranding, saveTheme
- Missing exports documented in issue 086-WB-002

---

### 9. `src/utils/widgetThemeStorage.js`

**Typ:** Analyza
**Radky:** 1-427
**Oblast:** Widget theme management

**Co bylo zjisteno:**

**Problemy:**
- P2: Separate from adminBrandingWidgetStorage but uses same storage keys (duplication, confusion)
- P2: No type validation for color values (can accept invalid HEX, RGB, etc.)
- P2: Theme presets hardcoded (should be configurable per tenant)
- P1: Missing fallback theme (if custom theme load fails, widget renders unstyled)
- P2: No CSS variable generation helper (theme data not connected to actual CSS output)

**Highlights:**
- 427 lines — manages color scheme, typography overrides, layout presets
- Used by widget-kalkulacka for runtime theme application
- Could be merged with adminBrandingWidgetStorage for clarity

---

### 10. `src/lib/shopify/shopifyCartMapper.js`

**Typ:** Analyza
**Radky:** 1-145
**Oblast:** Shopify cart integration

**Co bylo zjisteno:**

**Problemy:**
- P2: isValidShopifyUrl() uses regex that's vulnerable to open redirect (e.g., `//evil.com` passes validation)
- P2: No timeout on fetch call to Storefront API (can hang if Shopify is slow)

**Highlights:**
- 145 lines — maps widget quote to Shopify cart format
- 3 mapping modes: per_variant, universal, separate_variant
- Used by ShopifyCartButton in widget-kalkulacka

---

## Dopad zmen

- **Analyza bez modifikace:** Zadne zmeny v codebase — jen research
- **Nove soubory:** Widget-Builder-Improvement-Plan.md (mimo git repo — working doc)
- **Ovlivnene komponenty:** AdminWidget, BuilderPage, widget-kalkulacka, WidgetPublicPage, WidgetEmbed, widget.js, storage layers
- **Breaking changes:** Ne (research only)
- **Nove zavislosti:** Ne
- **Rizika:** Zadna (read-only analysis)

---

## Doporucena porizadi implementace

**Wave 1 (Critical — do 1 dne):**
1. Export missing functions from AdminWidget.jsx
2. Fix postMessage route mismatch (widget.js: `/widget/embed/` → `/w/`)
3. Fix postMessage origin validation (remove wildcard, whitelist domains)
4. Fix message type consistency (MODELPRICER_RESIZE vs MODELPRICER_WIDGET_HEIGHT)
5. Fix cross-tenant pricing leak in storage
6. Fix domain whitelist validation in WidgetPublicPage

**Wave 2 (Design & UX — do 3 dnu):**
1. Align hardcoded colors with Forge tokens
2. Add micro-UX (loading skeletons, error toasts)
3. Fix accessibility (ARIA labels, focus styles)
4. Fix font violations (heading vs tech fonts)
5. Add unsaved changes detection in builder
6. Add validation debounce in useBuilderState
7. Add error toast on widget save fail
8. Fix CSS class names to Forge conventions

**Wave 3 (Storage & Polish — do 5 dnu):**
1. Consolidate storage keys (widget-branding:v1, widget-theme:v1 → single namespace)
2. Add theme fallback and validation
3. Add builder state localStorage backup
4. Fix isValidShopifyUrl() regex
5. Debounce widget resize messages
6. Add Suspense boundaries for async loads
7. Performance: memoize expensive validations

---

## Testovani

- **Build:** No changes — N/A
- **Manual test:** Ne (research only)
- **Poznamky:** Ceka na Wave 1 implementaci pro validation

---

<!-- KONEC SABLONY -->
