# FRONTEND INFRASTRUCTURE — ModelPricer V3
# Complete Blueprint of All Pages, Components, UI Elements & Planned Extensions

> **Generated:** 2026-02-07 by `mp-sr-frontend`
> **Scope:** Every existing page, every existing component, every planned page/component across all phases (S01-S22).
> **Purpose:** Definitive source-of-truth for frontend shell implementation, delegation, and review.

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Layout System](#2-layout-system)
3. [Existing Pages — Full Inventory](#3-existing-pages)
4. [Planned Pages — Future Phases](#4-planned-pages)
5. [Existing Components — Full Inventory](#5-existing-components)
6. [New Components Needed — All Phases](#6-new-components-needed)
7. [Component Hierarchy Trees](#7-component-hierarchy-trees)
8. [State Architecture](#8-state-architecture)
9. [Routing Map](#9-routing-map)
10. [Responsive Strategy](#10-responsive-strategy)

---

## 1. ARCHITECTURE OVERVIEW

### Tech Stack
- **Framework:** React 19 (JSX, no TypeScript)
- **Build:** Vite 6+ (ESM dev, optimized production)
- **Routing:** React Router v6 (BrowserRouter)
- **Styling:** Mixed — Tailwind utility classes (public pages, marketing), inline `<style>` blocks (admin pages), CSS custom properties (widget theming)
- **State:** React useState/useMemo/useEffect (no Redux/Zustand). Context for language (LanguageContext). localStorage for tenant-scoped persistence.
- **Animations:** Framer Motion (marketing pages, account page)
- **Icons:** Lucide-react via AppIcon wrapper
- **UI Primitives:** CVA (class-variance-authority) for Button, Radix UI Slot for composition

### Module Boundaries
```
src/
  App.jsx                    — Root (renders Routes)
  Routes.jsx                 — All route definitions (HOT SPOT)
  components/
    ui/                      — Design system primitives (Button, Card, Input, etc.)
    marketing/               — Marketing-specific components (Sparkles, etc.)
    AppIcon.jsx              — Lucide icon wrapper
    AppImage.jsx             — Image wrapper
    ErrorBoundary.jsx        — Global error boundary
    PrivateRoute.jsx         — Auth guard (currently disabled)
    SmoothScroll.jsx         — Lenis smooth scroll
    ScrollToTop.jsx          — Scroll-to-top on navigate
  pages/
    home/                    — Landing page
    login/                   — Firebase auth login
    register/                — Multi-step registration
    pricing/                 — SaaS pricing plans
    support/                 — FAQ + contact
    account/                 — User account settings
    model-upload/            — Basic 3-step calculator (legacy)
    test-kalkulacka/         — 5-step wizard (Upload/Config/Price/Checkout/Confirm)
    widget-kalkulacka/       — Embeddable widget calculator (theme support)
    widget-public/           — Public widget embed route
    admin/                   — Admin panel (sidebar layout)
      builder/               — Widget WYSIWYG builder (fullscreen)
      components/            — Admin-specific shared components
  contexts/
    LanguageContext.jsx       — i18n context (inline CS/EN dictionary, 770+ lines)
  hooks/
    useAuth.js               — Firebase auth hook
  lib/
    pricing/pricingEngineV3.js — Pricing calculation engine
    pricingService.js        — Pricing service layer
    slicingApiClient.js      — Slicer API client
    utils.js                 — General utilities
  utils/
    admin*Storage.js         — Tenant-scoped localStorage helpers (pricing, fees, branding, orders, etc.)
    cn.js                    — clsx/tailwind-merge utility
    widgetThemeStorage.js    — Widget theme CSS vars
    slicerErrorClassifier.js — Slicer error classification
```

---

## 2. LAYOUT SYSTEM

### Layout Types

| Layout Type | Description | Used By |
|-------------|-------------|---------|
| **PublicLayout** | Header + main + Footer (via Routes.jsx wrapper) | Home, Login, Register, Pricing, Support, Account, ModelUpload, TestKalkulacka, InviteAccept, 404 |
| **AdminLayout** | 260px sidebar + main content area (admin-layout) | All /admin/* pages |
| **FullscreenLayout** | No header/footer/sidebar — full viewport | Widget Builder (/admin/widget/builder/:id) |
| **EmbeddedLayout** | No chrome at all — standalone embeddable | Widget Public (/w/:publicWidgetId) |
| **WizardLayout** | Step-based progression with stepper UI | TestKalkulacka (5 steps), Register (3 steps), ModelUpload (3 steps) |

### AdminLayout Structure
```
AdminLayout
  +-- aside.admin-sidebar (260px, fixed left)
  |     +-- admin-sidebar-header ("Admin Panel" + subtitle)
  |     +-- nav.admin-nav
  |     |     +-- Link.admin-nav-item (10 nav items)
  |     +-- admin-sidebar-footer (Back to home link)
  +-- main.admin-content (flex-1, padding 32px)
        +-- <Outlet /> (child route content)
```

### Nav Items (AdminLayout sidebar)
1. Dashboard — LayoutDashboard icon — /admin
2. Branding — Palette icon — /admin/branding
3. Pricing — DollarSign icon — /admin/pricing
4. Fees — Receipt icon — /admin/fees
5. Parameters — Settings icon — /admin/parameters
6. Presets — Layers icon — /admin/presets
7. Orders — ShoppingCart icon — /admin/orders
8. Analytics — BarChart3 icon — /admin/analytics
9. Team Access — Users icon — /admin/team
10. Widget — Code icon — /admin/widget

---

## 3. EXISTING PAGES — FULL INVENTORY

---

### 3.1 HOME PAGE

- **Route:** `/`
- **File:** `src/pages/home/index.jsx`
- **Layout:** PublicLayout (full-width)
- **Major Sections:**
  1. **Hero Section** — headline, subtitle, 2 CTA buttons (Pricing, ModelUpload), trust badge, 3 metric cards (3 kroky, 14 dni, 100%), hero image mockup with live preview UI
  2. **Trust Strip** — LogoMarquee with 10 tech labels
  3. **How It Works** — 4 SpotlightCards (Upload, Config, Slicer, Cart)
  4. **Demo Preview** — Side-by-side comparison: Old Way (email mockup) vs New Way (calculator benefits checklist + mini widget preview)
  5. **Features** — 6 feature cards in 3-column grid (Slicer, Pricing, Presets, Branding, Limits, Cart)
  6. **Pricing Teaser** — CTA banner linking to /pricing
  7. **For Whom** — 3 audience cards (Shops, Studios, Printers)
  8. **Global Map** — Static GlobalMap component + customer avatars + star rating
  9. **Interactive Map** — InteractiveWorldMap component
  10. **FAQ** — Accordion with 3 FAQ items
- **Components Used:** BackgroundPattern, Sparkles, MotionNumber, LogoMarquee, SpotlightCard, ImageRipple, GlobalMap, InteractiveWorldMap, Accordion, Reveal, Button, Icon, Link
- **UI Elements:** h1 headline, p subtitle, Button (lg, primary), Button (lg, outline), metric cards with MotionNumber, image mockup with traffic light dots, email thread mockup, checkmark list, mini widget preview with grid stats
- **Responsive:** lg:grid-cols-12 hero -> stacks; md:grid-cols-2 for steps; sm:grid-cols-2 / lg:grid-cols-3 for features; md:grid-cols-3 for audience; lg:grid-cols-2 for map section
- **State:** Language context (useLanguage hook for translations)

---

### 3.2 LOGIN PAGE

- **Route:** `/login`
- **File:** `src/pages/login/index.jsx`
- **Layout:** PublicLayout (centered form)
- **Major Sections:**
  1. **Login Form** — email + password fields, submit button
  2. **Social Login** — OAuth buttons
  3. **Language Toggle** — CS/EN switcher
- **Components Used:** LoginForm, LoginHeader, LoginActions, SocialLogin, LanguageToggle
- **UI Elements:** text inputs (email, password), submit button, social OAuth buttons, language toggle
- **Responsive:** centered form, max-width constraint
- **State:** Firebase auth (signInWithEmailAndPassword), redirect logic (from location state), AuthContext

---

### 3.3 REGISTER PAGE

- **Route:** `/register`
- **File:** `src/pages/register/index.jsx`
- **Layout:** PublicLayout (centered wizard)
- **Major Sections:**
  1. **Header** — title "Vytvorit ucet" + subtitle
  2. **Progress Steps** — 3-step indicator (Role, Details, Verification)
  3. **Step 1: Role Selection** — 2 RoleSelectionCards (Customer vs Host/Provider)
  4. **Step 2: Registration Form** — full registration form with selected role
  5. **Trust Indicators** — 3-column grid (placeholder)
- **Components Used:** ProgressSteps, RoleSelectionCard, RegistrationForm, LanguageToggle, Button, Icon
- **UI Elements:** step indicator (3 steps), role cards with icon/title/description/benefits list, form inputs (name, email, password, etc.), back/continue buttons
- **Responsive:** md:grid-cols-2 for role cards, max-w-4xl container
- **State:** currentStep (1-3), selectedRole, currentLanguage

---

### 3.4 PRICING PAGE

- **Route:** `/pricing`
- **File:** `src/pages/pricing/index.jsx`
- **Layout:** PublicLayout (full-width sections)
- **Major Sections:**
  1. **Hero** — headline + subtitle + 2 CTAs + 3 KPI cards (8s, 60%, 24/7) + "What you get" card with 4 checkmark rows + glossary terms
  2. **Plans** — 3 PricingPlanCards (Starter/Professional/Enterprise) in lg:grid-cols-3
  3. **Annual Discount Banner** — CTA with contact button
  4. **FAQ** — lg:grid-cols-12 split: left (5 cols) with CTAs + SupportHoverCards, right (7 cols) with FaqTabs
  5. **Final CTA** — contact + demo buttons
- **Components Used:** Container, Button, TooltipProvider, MotionNumber, PricingPlanCard, FaqTabs, GlossaryTerm, SupportHoverCards, motion (framer-motion)
- **UI Elements:** animated h1, 3 KPI metric cards, 3 pricing plan cards (one highlighted with badge), feature lists with checkmarks, CTA buttons (gradient variant), FAQ tabbed accordion
- **Responsive:** lg:grid-cols-2 hero, lg:grid-cols-3 plans, sm:grid-cols-3 KPIs, lg:grid-cols-12 FAQ
- **State:** Language context, computed currency (Kc vs $)

---

### 3.5 SUPPORT PAGE

- **Route:** `/support`
- **File:** `src/pages/support/index.jsx`
- **Layout:** PublicLayout (custom CSS — NOT Tailwind)
- **Major Sections:**
  1. **Hero** — gradient background (#667eea to #764ba2), h1, subtitle, search box
  2. **Quick Links** — 4-column grid (Documentation, Video Tutorials, Live Chat, Email Support)
  3. **FAQ Section** — 4 categories (Getting Started, Pricing & Fees, Technical, Account & Billing), each with 3-4 Q&A items
  4. **Contact Section** — gradient card with email + live chat methods
- **Components Used:** Icon, useLanguage
- **UI Elements:** search input with icon, 4 link cards (icon + title + desc), FAQ items (h4 question + p answer), contact methods (icon + label + detail)
- **Responsive:** 4-col links -> 2-col at 768px, 2-col contact methods -> 1-col at 768px
- **State:** Language context, FAQ data (inline CS/EN arrays)

---

### 3.6 ACCOUNT PAGE

- **Route:** `/account`
- **File:** `src/pages/account/index.jsx`
- **Layout:** PublicLayout (centered max-w-5xl)
- **Major Sections:**
  1. **Header** — avatar (initials), title "Account Settings", subtitle
  2. **Pill Tab Navigation** — 4 tabs: Profile, Company, Security, Billing (animated with Framer Motion layoutId)
  3. **Profile Tab** — first name, last name, email, phone inputs in 2-col grid
  4. **Company Tab** — business name, ICO, DIC, address, city, ZIP, country select
  5. **Security Tab** — change password form with strength meter, 2FA toggle, active sessions list
  6. **Billing Tab** — current plan card (Professional, 1,299 Kc), payment method (Visa 4242), 3 invoice history rows
- **Components Used:** BackgroundPattern, Icon, motion/AnimatePresence (Framer Motion), inline FormInput + Card components
- **UI Elements:** avatar circle with camera button, animated pill tabs, form inputs with icons, password strength bar (animated), 2FA toggle button, session card, plan card with ACTIVE badge, payment card, invoice rows with download icon
- **Responsive:** md:grid-cols-2 for profile/company/security/billing grids
- **State:** activeTab, profileData (mock), passwordData, passwordStrength computed

---

### 3.7 MODEL UPLOAD PAGE (Legacy)

- **Route:** `/model-upload`
- **File:** `src/pages/model-upload/index.jsx`
- **Layout:** PublicLayout (wizard, 3-step)
- **Major Sections:**
  1. **Step Indicator** — 3 steps (Upload, Config, Price)
  2. **Step 1: File Upload** — FileUploadZone (drag & drop)
  3. **Step 2: Configuration** — ModelViewer (3D preview) + PrintConfiguration (material, quality, infill, supports, quantity)
  4. **Step 3: Price Review** — PricingCalculator (breakdown table)
- **Components Used:** FileUploadZone, ModelViewer, PrintConfiguration, PricingCalculator, Button, Icon
- **UI Elements:** drag-drop upload zone, 3D model viewer (Three.js STL loader), material select, quality select, infill slider, supports checkbox, quantity input, pricing breakdown table
- **Responsive:** Step-based layout, components stack vertically on mobile
- **State:** currentStep, uploadedFiles, selectedFile, printConfigs, isProcessing

---

### 3.8 TEST CALCULATOR (5-Step Wizard)

- **Route:** `/test-kalkulacka`
- **File:** `src/pages/test-kalkulacka/index.jsx` (800+ lines)
- **Layout:** PublicLayout (5-step wizard)
- **Major Sections:**
  1. **Step 1: Upload** — FileUploadZone, file list with status indicators
  2. **Step 2: Configuration** — per-model PrintConfiguration + ModelViewer, material/quality/infill/supports/quantity per file
  3. **Step 3: Pricing** — PricingCalculator with full breakdown (material cost, time cost, fees, volume discounts), GenerateButton for slicing
  4. **Step 4: Checkout** — CheckoutForm (react-hook-form + zod validation) with billing/shipping address
  5. **Step 5: Confirmation** — OrderConfirmation with order summary
- **Components Used:** FileUploadZone, ModelViewer, PrintConfiguration, PricingCalculator, GenerateButton, ErrorBoundary, CheckoutForm, OrderConfirmation
- **Sub-components (local):**
  - `components/FileUploadZone.jsx` — drag-drop + file browser
  - `components/ModelViewer.jsx` — Three.js STL renderer
  - `components/PrintConfiguration.jsx` — material/quality/infill/supports/quantity controls
  - `components/PricingCalculator.jsx` — pricing breakdown display with volume discounts
  - `components/GenerateButton.jsx` — slice trigger with progress
  - `components/ErrorBoundary.jsx` — React error boundary
  - `components/CheckoutForm.jsx` — react-hook-form checkout
  - `components/OrderConfirmation.jsx` — order confirmation display
- **Hooks (local):**
  - `hooks/useDebouncedRecalculation.js` — debounced auto-recalc on config changes
- **Schemas (local):**
  - `schemas/checkoutSchema.js` — zod validation schema
- **UI Elements:** drag-drop zone, file list with thumbnails/status badges, 3D viewer, material dropdown, quality preset buttons, infill slider with percentage, supports toggle, quantity number input, pricing table (line items + subtotal + fees + total), generate/slice button with spinner, checkout form (name, email, phone, company, address fields), payment method selector, order summary card
- **Responsive:** Single-column wizard with step navigation buttons
- **State:** currentStep, uploadedFiles[], selectedFileId, printConfigs{}, isProcessing, sliceAllProcessing, pricingConfig, feesConfig, feeSelections, batchProgress
- **Data Sources:** adminPricingStorage (loadPricingConfigV3), adminFeesStorage (loadFeesConfigV3), slicerApi (sliceModelLocal), presetsApi (fetchWidgetPresets)

---

### 3.9 WIDGET CALCULATOR (Embeddable)

- **Route:** Embedded component (not a direct route — used by WidgetPublicPage and Builder)
- **File:** `src/pages/widget-kalkulacka/index.jsx`
- **Layout:** EmbeddedLayout (themed, no header/footer)
- **Major Sections:**
  1. **Widget Header** — WidgetHeader (logo, business name, tagline)
  2. **Widget Stepper** — WidgetStepper (step progress)
  3. **Step 1: Upload** — FileUploadZone
  4. **Step 2: Configuration** — PrintConfiguration + ModelViewer
  5. **Step 3: Summary/Price** — PricingCalculator
  6. **Widget Footer** — WidgetFooter ("Powered by ModelPricer")
- **Components Used:** WidgetHeader, WidgetStepper, WidgetFooter, WidgetSkeleton, FileUploadZone, ModelViewer, PrintConfiguration, PricingCalculator, GenerateButton, ErrorBoundary
- **Props Interface:** theme, builderMode, forceStep, onElementSelect, onElementHover, selectedElementId, hoveredElementId, onTextEditStart, embedded, showHeader, publicWidgetId, onQuoteCalculated
- **UI Elements:** Same as test-kalkulacka steps 1-3 but with theme CSS vars, widget header with branding, stepper with step dots, powered-by footer
- **Responsive:** Designed for iframe embedding, adapts to container width
- **State:** Same calculator state + theme from props/CSS vars, postMessage communication for iframe

---

### 3.10 WIDGET PUBLIC PAGE

- **Route:** `/w/:publicWidgetId`
- **File:** `src/pages/widget-public/WidgetPublicPage.jsx`
- **Layout:** EmbeddedLayout (no Header/Footer — standalone)
- **Purpose:** Public URL for embedding widget via iframe
- **Components Used:** WidgetKalkulacka (from widget-kalkulacka)
- **State:** publicWidgetId from URL params, widget config lookup

---

### 3.11 ADMIN DASHBOARD

- **Route:** `/admin`
- **File:** `src/pages/admin/AdminDashboard.jsx` (1600+ lines)
- **Layout:** AdminLayout (sidebar)
- **Major Sections:**
  1. **Dashboard Header** — title + "Edit dashboard" / "Refresh" buttons (or edit mode controls: columns select, add KPI, reset, cancel, save)
  2. **Branding Tips Banner** — dismissable tip banner with up to 3 recommendations
  3. **Section Toggles** (edit mode only) — checkboxes for Activity, Quick Stats, Branding Tips
  4. **KPI Cards Grid** — react-grid-layout drag-and-drop grid of metric cards (configurable columns 2-6, per-card color/title/size/lock)
  5. **Recent Activity** — audit log entries (last 5)
  6. **Quick Stats** — 4-column grid (Avg Price 30d, Avg Time 30d, Pending Invites, New Orders)
  7. **Add Metric Modal** — searchable/filterable metric catalog for adding new KPI cards
  8. **Settings Modal** — per-card settings (custom title, color, background, lock, size, time range)
- **Components Used:** react-grid-layout (WidthProvider+GridLayout), Icon, useLanguage, inline SettingsModal
- **UI Elements:** drag-handle icon, lock/unlock toggle, settings gear, trash delete, color picker (native input[type=color]), column count select, metric search input, category filter select, metric rows with icon/title/key, size preset buttons (1x1, 2x1, 1x2, 2x2), width/height selects, time range select (7/30/90 days), resize handles
- **Responsive:** Dashboard actions wrap on sm, stats grid auto-fit columns
- **State:** dashboardConfig (persistent, tenant-scoped), draftConfig (edit mode), refreshKey, showAddModal, settingsCardId, computed metrics from multiple storage sources (analytics, team, orders, parameters, presets, pricing, fees, widgets, branding)

---

### 3.12 ADMIN BRANDING

- **Route:** `/admin/branding`
- **File:** `src/pages/admin/AdminBranding.jsx` (1190 lines)
- **Layout:** AdminLayout (sidebar) + 2-column grid (form left, preview right)
- **Major Sections:**
  1. **Page Header** — title, subtitle, save status badge (Saved/Unsaved), Reset button, Save button
  2. **Unsaved Changes Banner** — yellow warning banner when dirty
  3. **Business Information** — business name input, tagline input
  4. **Logo** — current logo preview, drag-drop upload area, file chooser + apply + remove buttons
  5. **Calculator Settings** — checkbox group (showLogo, showBusinessName, showTagline, showPoweredBy with PRO gate), corner radius slider (0-24px)
  6. **Color Scheme** — primary/secondary/background color inputs with swatches, 4 color presets (Blue, Green, Purple, Orange)
  7. **Typography** — font family radio group (Inter, Roboto, Poppins, Open Sans)
  8. **Live Preview** (right column, sticky) — calculator mockup reflecting all branding changes in real-time
- **Components Used:** Icon, useLanguage
- **UI Elements:** text inputs with validation, file input (hidden), drag-drop area, color text input + color swatch div, color preset buttons, radio buttons for fonts, checkbox toggles with PRO chip, range slider, live preview mockup (header with logo/name/tagline, form fields, calculate button, powered-by footer)
- **Responsive:** branding-grid 2-col -> 1-col at 1024px, sticky preview becomes static
- **State:** branding object (15+ fields), savedSnapshot, isDirty, errors, logoDraft/logoDraftPreview, plan features, validation errors

---

### 3.13 ADMIN PRICING

- **Route:** `/admin/pricing`
- **File:** `src/pages/admin/AdminPricing.jsx` (2500+ lines)
- **Layout:** AdminLayout (sidebar)
- **Major Sections:**
  1. **Page Header** — title, save status, save/reset buttons
  2. **Materials Section** — material table (key, name, price per gram, enabled toggle), add material button
  3. **Time Pricing** — hourly rate input
  4. **Minimum Price** — minimum order value input
  5. **Rounding** — rounding rules configuration
  6. **Volume Discounts** — discount tiers table (min quantity, discount percentage), add tier button
  7. **Pricing Preview/Simulator** — live calculation preview
- **Components Used:** Icon, useLanguage
- **UI Elements:** material table rows with inline editing, add/remove buttons, number inputs, toggle switches, discount tier rows, simulation panel
- **Responsive:** Table scrolls horizontally on small screens
- **State:** pricingConfig (complex nested object), savedSnapshot, isDirty, validation

---

### 3.14 ADMIN FEES

- **Route:** `/admin/fees`
- **File:** `src/pages/admin/AdminFees.jsx` (2168 lines)
- **Layout:** AdminLayout (sidebar) + 2-column grid (440px list panel + editor panel)
- **Major Sections:**
  1. **Page Header** — title, subtitle, status pill (Saved/Unsaved), New Fee button, Save button
  2. **Fee List Panel** (left, 440px)
     - Search input
     - 3 filter selects (Scope, Status, Widget required)
     - Bulk action bar (select all, enable, disable, duplicate, delete, scope tags, required tags)
     - Fee rows (checkbox, active dot, name, chips for scope/type/required/charge_basis, value)
  3. **Fee Editor Panel** (right)
     - Section: Basics — name input, category input, description textarea, active toggle
     - Section: Calculation — scope select, type select, value number input, charge_basis select
     - Section: Widget Visibility — required/selectable/selectedByDefault/applyToSelected toggles
     - Section: Conditions (AND) — condition rows (key select, operator select, value input/select), add condition button
     - Section: Preview/Simulator — 11 simulation inputs, MATCH/NO MATCH pill, estimated fee amount, "Why" explanation with per-condition pass/fail rows
- **Components Used:** Icon, useLanguage
- **UI Elements:** search input with icon, filter selects, checkbox toggles, fee list rows with dot/name/chips/value, bulk action buttons, segmented buttons (MODEL/ORDER, Required/Optional), form inputs/selects/textarea, condition rows (key/op/value), simulator grid inputs, match/nomatch pill badge, amount display, why-list rows (ok/bad styling)
- **Responsive:** 2-col layout -> 1-col at 1100px, simulator grid 3-col -> 2-col at 900px -> 1-col at 640px, condition grid collapses
- **State:** fees[], activeId, selectedIds[], search, 3 filters, banner, savedSnapshot, materials[], sim (11 fields), computed: dirty, activeFee, filteredFees, validation, simResult

---

### 3.15 ADMIN PARAMETERS

- **Route:** `/admin/parameters/*`
- **File:** `src/pages/admin/AdminParameters.jsx`
- **Layout:** AdminLayout (sidebar), internal sub-routing
- **Major Sections:**
  1. Parameter categories list
  2. Parameter editor (per parameter: active toggle, default value override, widget visibility, min/max limits)
- **State:** Parameters config from tenant storage

---

### 3.16 ADMIN PRESETS

- **Route:** `/admin/presets/*`
- **File:** `src/pages/admin/AdminPresets.jsx`
- **Layout:** AdminLayout (sidebar), internal sub-routing
- **Major Sections:**
  1. Presets list (quality presets from .ini files)
  2. Preset editor/uploader
- **State:** Presets list from tenant storage

---

### 3.17 ADMIN ORDERS

- **Route:** `/admin/orders`
- **File:** `src/pages/admin/AdminOrders.jsx`
- **Layout:** AdminLayout (sidebar)
- **Major Sections:**
  1. **Order List** — paginated table (15/page) with filters (status, search, date range), status badges, flag badges
  2. **Order Detail** — header with status/flags, customer info, model list with thumbnails, per-model pricing breakdown, status change workflow, notes/audit log, reprice/reslice simulation with revision history
  3. **Confirm Modal** — destructive action confirmation
- **Components Used:** Icon, useLanguage, inline Badge, PillButton, ConfirmModal
- **UI Elements:** order table rows (ID, customer, date, total, status badge, flag badges), filter pills, pagination buttons, order detail card, model thumbnail list, pricing breakdown table, status dropdown, note textarea, activity timeline, revision diff display
- **Responsive:** Table scroll on mobile, detail view stacks vertically
- **State:** orders (from localStorage), filters, pagination, selected order detail, confirmation modal state

---

### 3.18 ADMIN ANALYTICS

- **Route:** `/admin/analytics`
- **File:** `src/pages/admin/AdminAnalytics.jsx`
- **Layout:** AdminLayout (sidebar)
- **Major Sections:**
  1. **Range Tabs** — 7d / 30d / 90d selector
  2. **Overview Stats** — stat cards (total sessions, avg price, avg time, total revenue, etc.)
  3. **Sessions Table** — filterable/sortable table of analytics sessions
  4. **Lost Sessions** — sessions that started but didn't complete
  5. **Export** — CSV download button
  6. **Admin Actions** — clear all data, reseed demo data
- **Components Used:** Icon, useLanguage, inline TabButton, StatCard, MiniSeriesTable
- **UI Elements:** tab buttons (7d/30d/90d), stat cards (title/value/sub), data table rows, CSV export button, clear/reseed buttons
- **Responsive:** stat cards auto-fit grid, table scroll on mobile
- **State:** range (7/30/90), computed overview from storage, sessions list

---

### 3.19 ADMIN TEAM ACCESS

- **Route:** `/admin/team`
- **File:** `src/pages/admin/AdminTeamAccess.jsx`
- **Layout:** AdminLayout (sidebar)
- **Major Sections:**
  1. **Summary** — seat count, active users, pending invites
  2. **Tabs** — Users / Roles / Audit
  3. **Users Tab** — user list with role badges, enable/disable/delete actions, role change
  4. **Roles Tab** — invite form (email, role select, message), invite list with status/resend/delete
  5. **Audit Tab** — searchable/filterable audit log table
- **Components Used:** Icon, useLanguage
- **UI Elements:** summary stat cards, tab buttons, user rows with avatar/name/email/role badge/status badge, action buttons (enable/disable/delete/change role), invite form (email input, role select, message textarea), invite rows with token/link/status, audit log table rows with timestamp/actor/action/entity
- **Responsive:** Tables scroll on mobile
- **State:** tab, users, invites, summary, seatLimit, invite form fields, audit search/filters

---

### 3.20 ADMIN WIDGET

- **Route:** `/admin/widget`
- **File:** `src/pages/admin/AdminWidget.jsx`
- **Layout:** AdminLayout (sidebar) + 4 tab panels
- **Major Sections:**
  1. **Widget Selector** — create/select/duplicate/delete widget instances
  2. **Config Tab** (WidgetConfigTab) — widget name, theme overrides, feature toggles
  3. **Embed Tab** (WidgetEmbedTab) — iframe embed code, script embed code, copy buttons
  4. **Domains Tab** (WidgetDomainsTab) — allowed domains list, add/toggle/delete
  5. **Settings Tab** (WidgetSettingsTab) — advanced settings
  6. **Create Modal** — name input for new widget
- **Sub-components:**
  - `components/WidgetConfigTab.jsx`
  - `components/WidgetEmbedTab.jsx`
  - `components/WidgetDomainsTab.jsx`
  - `components/WidgetSettingsTab.jsx`
- **UI Elements:** widget selector dropdown, 4 tab buttons (Config/Embed/Domains/Settings), form inputs for widget config, code blocks with copy buttons, domain list with toggle/delete, create modal with name input
- **Responsive:** Tab content stacks vertically on mobile
- **State:** widgets[], selectedId, editor state, domains[], activeTab, createModal state

---

### 3.21 WIDGET BUILDER

- **Route:** `/admin/widget/builder/:id`
- **File:** `src/pages/admin/AdminWidgetBuilder.jsx` -> delegates to `src/pages/admin/builder/BuilderPage.jsx`
- **Layout:** FullscreenLayout (no sidebar, no header/footer)
- **Major Sections:**
  1. **TopBar** (BuilderTopBar) — back button, widget name, device switcher (desktop/tablet/mobile), undo/redo, save button, preview step switcher (Upload/Config/Summary)
  2. **Left Panel** (BuilderLeftPanel, 35%) — tabbed panel:
     - Elements Tab (ElementsTab) — clickable element tree of widget structure
     - Style Tab (StyleTab) — property editors for selected element
     - Global Tab (GlobalTab) — global theme settings
  3. **Right Panel** (BuilderRightPanel, 65%) — DevicePreviewFrame containing live widget preview
  4. **Onboarding Overlay** — first-run tutorial overlay
- **Sub-components:**
  - `builder/components/BuilderTopBar.jsx`
  - `builder/components/BuilderLeftPanel.jsx`
  - `builder/components/BuilderRightPanel.jsx`
  - `builder/components/DevicePreviewFrame.jsx`
  - `builder/components/OnboardingOverlay.jsx`
  - `builder/components/QuickThemeDropdown.jsx`
  - `builder/components/BuilderColorPicker.jsx`
  - `builder/components/tabs/ElementsTab.jsx`
  - `builder/components/tabs/StyleTab.jsx`
  - `builder/components/tabs/GlobalTab.jsx`
  - `builder/components/editors/TextPropertyEditor.jsx`
  - `builder/components/editors/NumberPropertyEditor.jsx`
  - `builder/components/editors/SelectPropertyEditor.jsx`
  - `builder/components/editors/BooleanPropertyEditor.jsx`
  - `builder/components/editors/ColorPropertyEditor.jsx`
- **Hooks (local):**
  - `builder/hooks/useBuilderState.js` — builder state management
- **UI Elements:** back arrow button, breadcrumb (widget name), device toggle buttons (3 breakpoints), undo/redo buttons, save button, step preview tabs, element tree (collapsible), property editors (text inputs, number inputs, color pickers, select dropdowns, boolean toggles), device frame (desktop/tablet/mobile with realistic chrome), live widget preview inside frame, theme preset dropdown, onboarding steps
- **Responsive:** Builder is desktop-only (fullscreen layout)
- **State:** builder state from useBuilderState hook (widget config, selected element, undo/redo stack, theme), previewStep, toast

---

### 3.22 INVITE ACCEPT

- **Route:** `/invite/accept`
- **File:** `src/pages/InviteAccept.jsx`
- **Layout:** PublicLayout (centered card, dark gradient bg)
- **Major Sections:**
  1. **Header** — icon + title "Accept invite" + subtitle
  2. **Error states** — missing token, expired invite
  3. **Accept form** — name input, accept button
  4. **Success state** — confirmation message
- **UI Elements:** icon badge, h1 title, error banner (red), name input, accept button, success banner
- **State:** token (from URL query), invite lookup, name input, error, done

---

### 3.23 NOT FOUND (404)

- **Route:** `*` (catch-all)
- **File:** `src/pages/NotFound.jsx`
- **Layout:** PublicLayout (centered)
- **Major Sections:**
  1. **404 Number** — large "404" text
  2. **Message** — "Page Not Found" + description
  3. **Actions** — Go Back button + Back to Home button
- **Components Used:** Button, Icon
- **UI Elements:** large 404 text (opacity-20), h2 heading, p description, 2 buttons (primary with ArrowLeft icon, outline with Home icon)
- **Responsive:** sm:flex-row for buttons
- **State:** None (stateless)

---

## 4. PLANNED PAGES — FUTURE PHASES

### Phase 2 (S06-S08)

#### 4.1 ADMIN SHIPPING (Planned)
- **Route:** `/admin/shipping`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Shipping Methods List — table of methods with name/price/enabled toggle
  2. Method Editor — flat rate, weight-based, free-above-threshold config
  3. Shipping Zones — zone definitions with country/region selectors
  4. Calculator Integration — how shipping appears in checkout step
- **New Components Needed:** ShippingMethodCard, ShippingZoneEditor, WeightBasedRateTable, FreeShippingProgress

#### 4.2 MULTI-FORMAT 3D SUPPORT (Enhancement)
- **Route:** Enhances existing calculator pages
- **Changes:** FileUploadZone accepts .obj, .3mf, .step in addition to .stl
- **New Components Needed:** FormatBadge, FormatIcon

### Phase 3 (S09-S12)

#### 4.3 ADMIN PROMOTIONS / COUPONS (Planned)
- **Route:** `/admin/promotions`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Coupon List — table with code/type/value/usage/status
  2. Coupon Editor — code generator, discount type (percent/flat), conditions (min order, date range, max uses), scope (all/specific materials)
  3. Active Promotions — display active banners/campaigns
- **New Components Needed:** CouponInput, CouponBadge, CouponCodeGenerator, PromotionBanner, DiscountTimer

#### 4.4 ADMIN EMAIL TEMPLATES (Planned)
- **Route:** `/admin/emails`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Template List — order confirmation, shipping notification, quote ready, etc.
  2. Template Editor — WYSIWYG HTML email editor with variable insertion
  3. Email Preview — desktop/mobile preview toggle
  4. Send Test — test email sending
- **New Components Needed:** EmailTemplateEditor, EmailPreview, EmailVariableInserter, EmailDesktopMobileToggle

#### 4.5 ADMIN ORDERS KANBAN (Planned)
- **Route:** `/admin/orders/kanban`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Kanban Board — columns for each order status (New, Review, In Progress, Printing, Shipped, Done)
  2. Kanban Cards — order summary cards, draggable between columns
  3. Quick Actions — status change on drop, notes on click
- **New Components Needed:** KanbanBoard, KanbanColumn, KanbanCard, KanbanDragHandle, KanbanDropZone

### Phase 4 (S13-S15)

#### 4.6 PRINT QUALITY REPORTS (Enhancement)
- **Route:** Enhances /admin/orders detail view
- **Sections:**
  1. Quality Report Card — print quality metrics per order/model
  2. Photo Upload — before/after print photos
  3. Issue Tracking — defect classification, resolution notes
- **New Components Needed:** QualityReportCard, PhotoUploadGrid, DefectClassifier, QualityTimeline

### Phase 5 (S16-S18)

#### 4.7 ADMIN PDF DOCUMENTS (Planned)
- **Route:** `/admin/documents`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Template List — quote PDF, invoice PDF, delivery note, receipt
  2. Template Editor — field placement, branding integration, variable mapping
  3. PDF Preview — rendered PDF preview
  4. Generation History — list of generated documents
- **New Components Needed:** PDFTemplateEditor, PDFFieldPlacer, PDFPreview, DocumentHistoryTable

#### 4.8 ADMIN CUSTOMERS / CUSTOMER PORTAL (Planned)
- **Route:** `/admin/customers`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Customer List — searchable/sortable table (name, email, orders count, total spent, last order, status)
  2. Customer Detail — profile info, order history, communication log, notes
  3. Customer Segments — tag-based grouping, bulk actions
- **New Components Needed:** CustomerList, CustomerDetail, CustomerCard, CustomerSegmentTag, CommunicationLog, CustomerNotes

### Phase 6 (S19-S20)

#### 4.9 ADMIN LOCALIZATION (Planned)
- **Route:** `/admin/localization`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Language Settings — supported languages list, default language
  2. Currency Settings — currency format, exchange rates
  3. Translation Override — custom translation strings for widget
  4. Regional Settings — date format, number format, units
- **New Components Needed:** LanguageSelector, CurrencyFormatter, TranslationOverrideTable, RegionalPreview

#### 4.10 API DEVELOPER PORTAL (Planned)
- **Route:** `/admin/api`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. API Keys — generate/revoke keys, key list with scopes
  2. Webhooks — endpoint URL, event selection, delivery history
  3. API Documentation — interactive API explorer
  4. Rate Limits — usage metrics, tier info
- **New Components Needed:** APIKeyManager, APIKeyCard, WebhookConfig, WebhookEventSelector, WebhookDeliveryLog, APIExplorer, RateLimitMeter

#### 4.11 ADMIN CRM & MARKETING (Planned)
- **Route:** `/admin/crm`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Contact Management — customer contacts, lead tracking
  2. Email Campaigns — campaign builder, analytics
  3. Automation Rules — trigger/action workflows
- **New Components Needed:** ContactManager, LeadPipeline, CampaignBuilder, CampaignAnalytics, AutomationRuleEditor

#### 4.12 ADMIN SECURITY & COMPLIANCE (Planned)
- **Route:** `/admin/security`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Access Logs — detailed login/action logs
  2. IP Whitelist — allowed IP ranges
  3. GDPR Tools — data export, data deletion requests
  4. Compliance Dashboard — checklist, audit trail
- **New Components Needed:** AccessLogTable, IPWhitelistEditor, GDPRRequestManager, ComplianceDashboard, ComplianceChecklist

### Phase 7 (S21-S22)

#### 4.13 ADMIN TECHNOLOGIES / PRINTER CONFIG (Planned)
- **Route:** `/admin/technologies`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Technology List — FDM, SLA, SLS, etc. with parameters
  2. Printer Profiles — printer-specific configs (build volume, nozzle, etc.)
  3. Material-Technology Matrix — which materials work with which technologies
- **New Components Needed:** TechnologyCard, PrinterProfileEditor, BuildVolumeVisualizer, MaterialTechMatrix

#### 4.14 ADMIN E-COMMERCE INTEGRATIONS (Planned)
- **Route:** `/admin/integrations`
- **Layout:** AdminLayout (sidebar)
- **Sections:**
  1. Integration List — WooCommerce, Shopify, Shoptet status cards
  2. Setup Wizard — per-platform connection wizard
  3. Sync Status — product/order sync logs
  4. Mapping Config — field mapping between platforms
- **New Components Needed:** IntegrationCard, IntegrationSetupWizard, SyncStatusLog, FieldMappingEditor, PlatformIcon

---

## 5. EXISTING COMPONENTS — FULL INVENTORY

### 5.1 UI Kit Components (src/components/ui/)

#### Button
- **File:** `src/components/ui/Button.jsx`
- **Purpose:** Primary action button with multiple variants
- **Variants:** default, primary, outline, ghost, gradient, destructive, link
- **Sizes:** default (h-10), sm (h-9), lg (h-11), icon (h-10 w-10)
- **Props:** variant, size, asChild (Radix Slot), fullWidth, loading, iconName/icon, iconPosition (left/right), disabled, className
- **Dependencies:** CVA, Radix Slot, AppIcon, cn utility
- **Used By:** Every page

#### Card
- **File:** `src/components/ui/Card.jsx`
- **Purpose:** Container card with header/content structure
- **Used By:** Account page, various sections

#### Input
- **File:** `src/components/ui/Input.jsx`
- **Purpose:** Form text input
- **Used By:** Various forms

#### Label
- **File:** `src/components/ui/label.jsx`
- **Purpose:** Form label
- **Used By:** Various forms

#### Select
- **File:** `src/components/ui/Select.jsx`
- **Purpose:** Dropdown select
- **Used By:** Calculator configs, admin forms

#### Checkbox
- **File:** `src/components/ui/Checkbox.jsx`
- **Purpose:** Checkbox input
- **Used By:** Fee editor, calculator supports toggle

#### Slider
- **File:** `src/components/ui/Slider.jsx`
- **Purpose:** Range slider
- **Used By:** Infill configuration, corner radius

#### Dialog
- **File:** `src/components/ui/Dialog.jsx`
- **Purpose:** Modal dialog overlay
- **Used By:** Various confirmation/create modals

#### Container
- **File:** `src/components/ui/Container.jsx`
- **Purpose:** Max-width centered container
- **Used By:** Pricing page sections

#### Header
- **File:** `src/components/ui/Header.jsx`
- **Purpose:** Global site header with navigation
- **Used By:** All PublicLayout pages (via Routes.jsx)

#### Footer
- **File:** `src/components/ui/Footer.jsx`
- **Purpose:** Global site footer
- **Used By:** All PublicLayout pages (via Routes.jsx)

#### Tooltip
- **File:** `src/components/ui/tooltip.jsx`
- **Purpose:** Hover tooltip
- **Used By:** Pricing page (TooltipProvider), glossary terms

#### ColorPicker
- **File:** `src/components/ui/ColorPicker.jsx`
- **Purpose:** Color picker component
- **Used By:** AdminBranding, Widget Builder

#### BackgroundPattern
- **File:** `src/components/ui/BackgroundPattern.jsx`
- **Purpose:** Decorative background pattern overlay
- **Used By:** Home page, Account page

#### WelcomeHeader
- **File:** `src/components/ui/WelcomeHeader.jsx`
- **Purpose:** Welcome greeting header
- **Used By:** (Currently unused or minimal usage)

#### Icon (AppIcon wrapper)
- **File:** `src/components/AppIcon.jsx`
- **Purpose:** Lucide icon wrapper accepting icon name as string
- **Props:** name (string), size, color, className
- **Used By:** Every page and component

### 5.2 Marketing Components (src/components/marketing/)

#### Sparkles
- **File:** `src/components/marketing/Sparkles.jsx`
- **Purpose:** Animated sparkle particles overlay
- **Props:** className, count
- **Used By:** Home hero, hero cards

#### MotionNumber
- **File:** `src/components/marketing/MotionNumber.jsx`
- **Purpose:** Animated counting number (count-up effect)
- **Props:** value, suffix
- **Used By:** Home metrics, Pricing KPIs

#### LogoMarquee
- **File:** `src/components/marketing/LogoMarquee.jsx`
- **Purpose:** Horizontally scrolling text/logo strip
- **Props:** items (string array)
- **Used By:** Home trust strip

#### SpotlightCard
- **File:** `src/components/marketing/SpotlightCard.jsx`
- **Purpose:** Card with mouse-following spotlight effect
- **Used By:** Home features, how-it-works, audience sections

#### ImageRipple
- **File:** `src/components/marketing/ImageRipple.jsx`
- **Purpose:** Ripple effect on image interaction
- **Used By:** Home hero image

#### ImageReveal
- **File:** `src/components/marketing/ImageReveal.jsx`
- **Purpose:** Scroll-triggered image reveal animation
- **Used By:** (Available for marketing sections)

#### GlobalMap
- **File:** `src/components/marketing/GlobalMap.jsx`
- **Purpose:** Static SVG world map with location dots
- **Used By:** Home global usage section

#### InteractiveWorldMap
- **File:** `src/components/marketing/InteractiveWorldMap.jsx`
- **Purpose:** Interactive SVG world map with hover/click
- **Used By:** Home interactive map section

#### Accordion
- **File:** `src/components/marketing/Accordion.jsx`
- **Purpose:** Expandable FAQ accordion
- **Props:** items (array of {q, a})
- **Used By:** Home FAQ section

#### FaqTabs
- **File:** `src/components/marketing/FaqTabs.jsx`
- **Purpose:** Tabbed FAQ with category switching
- **Props:** categories, glossary
- **Used By:** Pricing FAQ section

#### Tabs
- **File:** `src/components/marketing/Tabs.jsx`
- **Purpose:** Generic tab switcher
- **Used By:** Marketing sections

#### GlossaryTerm
- **File:** `src/components/marketing/GlossaryTerm.jsx`
- **Purpose:** Inline glossary term with tooltip definition
- **Props:** termKey, glossary
- **Used By:** Pricing page feature rows

#### Reveal
- **File:** `src/components/marketing/Reveal.jsx`
- **Purpose:** Scroll-triggered fade-in/slide-up animation wrapper
- **Props:** className, delay
- **Used By:** Home page (wraps most sections)

#### MeshGradient
- **File:** `src/components/marketing/MeshGradient.jsx`
- **Purpose:** Animated mesh gradient background
- **Used By:** (Available for marketing backgrounds)

#### PricingPlanCard
- **File:** `src/components/marketing/PricingPlanCard.jsx`
- **Purpose:** Individual pricing plan card with features list
- **Props:** name, description, price, currency, period, features, highlighted, badgeText, ctaText, ctaTo
- **Used By:** Pricing page plans grid

#### SupportHoverCards
- **File:** `src/components/marketing/SupportHoverCards.jsx`
- **Purpose:** Hover-activated support contact cards
- **Props:** language, className
- **Used By:** Pricing FAQ sidebar

### 5.3 Calculator Components

#### FileUploadZone (3 copies)
- **Files:**
  - `src/pages/model-upload/components/FileUploadZone.jsx`
  - `src/pages/test-kalkulacka/components/FileUploadZone.jsx`
  - `src/pages/widget-kalkulacka/components/FileUploadZone.jsx`
- **Purpose:** Drag-and-drop file upload area with file type validation
- **Props:** onFilesSelected, accept, multiple, disabled
- **UI:** Dashed border drop zone, icon, text, file input

#### ModelViewer (3 copies)
- **Files:**
  - `src/pages/model-upload/components/ModelViewer.jsx`
  - `src/pages/test-kalkulacka/components/ModelViewer.jsx`
  - `src/pages/widget-kalkulacka/components/ModelViewer.jsx`
- **Purpose:** Three.js-based 3D STL model preview
- **Props:** file/modelData, className

#### PrintConfiguration (3 copies)
- **Files:**
  - `src/pages/model-upload/components/PrintConfiguration.jsx`
  - `src/pages/test-kalkulacka/components/PrintConfiguration.jsx`
  - `src/pages/widget-kalkulacka/components/PrintConfiguration.jsx`
- **Purpose:** Material/quality/infill/supports/quantity selector panel
- **Props:** config, onChange, pricingConfig, disabled

#### PricingCalculator (3 copies)
- **Files:**
  - `src/pages/model-upload/components/PricingCalculator.jsx`
  - `src/pages/test-kalkulacka/components/PricingCalculator.jsx`
  - `src/pages/widget-kalkulacka/components/PricingCalculator.jsx`
- **Purpose:** Price breakdown display (material + time + fees + discounts = total)
- **Props:** sliceResults, printConfig, pricingConfig, feesConfig, feeSelections

#### GenerateButton (2 copies)
- **Files:**
  - `src/pages/test-kalkulacka/components/GenerateButton.jsx`
  - `src/pages/widget-kalkulacka/components/GenerateButton.jsx`
- **Purpose:** Slice trigger button with loading state and progress
- **Props:** onClick, loading, disabled, progress

#### ErrorBoundary (2 copies)
- **Files:**
  - `src/pages/test-kalkulacka/components/ErrorBoundary.jsx`
  - `src/pages/widget-kalkulacka/components/ErrorBoundary.jsx`
- **Purpose:** React error boundary for calculator crashes
- **Also:** `src/components/ErrorBoundary.jsx` (global version)

#### CheckoutForm
- **File:** `src/pages/test-kalkulacka/components/CheckoutForm.jsx`
- **Purpose:** Order checkout form with billing/shipping details (react-hook-form + zod)
- **Props:** onSubmit, orderData, onBack
- **Used By:** TestKalkulacka step 4

#### OrderConfirmation
- **File:** `src/pages/test-kalkulacka/components/OrderConfirmation.jsx`
- **Purpose:** Order success confirmation with summary
- **Props:** orderData, onNewOrder
- **Used By:** TestKalkulacka step 5

### 5.4 Widget-Specific Components

#### WidgetHeader
- **File:** `src/pages/widget-kalkulacka/components/WidgetHeader.jsx`
- **Purpose:** Widget branded header (logo + business name + tagline)
- **Props:** branding, theme

#### WidgetStepper
- **File:** `src/pages/widget-kalkulacka/components/WidgetStepper.jsx`
- **Purpose:** Widget step indicator (dots/lines)
- **Props:** currentStep, totalSteps, theme

#### WidgetFooter
- **File:** `src/pages/widget-kalkulacka/components/WidgetFooter.jsx`
- **Purpose:** "Powered by ModelPricer" footer
- **Props:** showPoweredBy, theme

#### WidgetSkeleton
- **File:** `src/pages/widget-kalkulacka/components/WidgetSkeleton.jsx`
- **Purpose:** Loading skeleton placeholder for widget
- **Used By:** Widget while loading config

### 5.5 Builder Components

#### BuilderTopBar
- **File:** `src/pages/admin/builder/components/BuilderTopBar.jsx`
- **Purpose:** Top toolbar with back, name, device switcher, undo/redo, save
- **Props:** widgetName, device, onDeviceChange, canUndo, canRedo, onUndo, onRedo, onSave, onBack

#### BuilderLeftPanel
- **File:** `src/pages/admin/builder/components/BuilderLeftPanel.jsx`
- **Purpose:** Left sidebar with tabbed panels (Elements, Style, Global)
- **Props:** activeTab, children

#### BuilderRightPanel
- **File:** `src/pages/admin/builder/components/BuilderRightPanel.jsx`
- **Purpose:** Right panel containing device preview frame
- **Props:** children

#### DevicePreviewFrame
- **File:** `src/pages/admin/builder/components/DevicePreviewFrame.jsx`
- **Purpose:** Device frame (desktop/tablet/mobile) wrapping live widget preview
- **Props:** device, children

#### QuickThemeDropdown
- **File:** `src/pages/admin/builder/components/QuickThemeDropdown.jsx`
- **Purpose:** Predefined theme preset selector
- **Props:** onSelect

#### BuilderColorPicker
- **File:** `src/pages/admin/builder/components/BuilderColorPicker.jsx`
- **Purpose:** Advanced color picker for builder
- **Props:** value, onChange

#### OnboardingOverlay
- **File:** `src/pages/admin/builder/components/OnboardingOverlay.jsx`
- **Purpose:** First-run onboarding tutorial overlay
- **Props:** onComplete

#### Property Editors (builder/components/editors/)
- **TextPropertyEditor** — text input editor
- **NumberPropertyEditor** — number input editor
- **SelectPropertyEditor** — dropdown editor
- **BooleanPropertyEditor** — toggle/checkbox editor
- **ColorPropertyEditor** — color picker editor

#### Tab Panels (builder/components/tabs/)
- **ElementsTab** — element tree navigation
- **StyleTab** — CSS property editors for selected element
- **GlobalTab** — global theme configuration

### 5.6 Other Components

#### AppImage
- **File:** `src/components/AppImage.jsx`
- **Purpose:** Image wrapper component

#### FilePreview
- **File:** `src/components/FilePreview.jsx`
- **Purpose:** Generic file preview component

#### ModelPreview
- **File:** `src/components/ModelPreview.jsx`
- **Purpose:** Model thumbnail/preview

#### PrivateRoute
- **File:** `src/components/PrivateRoute.jsx`
- **Purpose:** Auth-guarded route wrapper (currently disabled for dev)

#### SmoothScroll
- **File:** `src/components/SmoothScroll.jsx`
- **Purpose:** Lenis smooth scrolling integration

#### ScrollToTop
- **File:** `src/components/ScrollToTop.jsx`
- **Purpose:** Scroll to top on route change

### 5.7 Login/Register Sub-components

#### LoginForm
- **File:** `src/pages/login/components/LoginForm.jsx`
- **Purpose:** Email/password login form

#### LoginHeader
- **File:** `src/pages/login/components/LoginHeader.jsx`
- **Purpose:** Login page header

#### LoginActions
- **File:** `src/pages/login/components/LoginActions.jsx`
- **Purpose:** Additional login actions (forgot password, register link)

#### SocialLogin
- **File:** `src/pages/login/components/SocialLogin.jsx`
- **Purpose:** Social OAuth buttons (Google, GitHub, etc.)

#### LanguageToggle (login + register)
- **Files:**
  - `src/pages/login/components/LanguageToggle.jsx`
  - `src/pages/register/components/LanguageToggle.jsx`
- **Purpose:** CS/EN language switcher

#### ProgressSteps
- **File:** `src/pages/register/components/ProgressSteps.jsx`
- **Purpose:** Step progress indicator for registration
- **Props:** currentStep, totalSteps, steps

#### RoleSelectionCard
- **File:** `src/pages/register/components/RoleSelectionCard.jsx`
- **Purpose:** Role selection card (Customer vs Host)
- **Props:** role, title, description, icon, benefits, isSelected, onSelect

#### RegistrationForm
- **File:** `src/pages/register/components/RegistrationForm.jsx`
- **Purpose:** Registration form fields
- **Props:** selectedRole

### 5.8 Account Sub-components

#### AccountOverviewCard
- **File:** `src/pages/account/components/AccountOverviewCard.jsx`
- **Purpose:** Account overview summary card

### 5.9 Widget Admin Sub-components

#### WidgetConfigTab
- **File:** `src/pages/admin/components/WidgetConfigTab.jsx`
- **Purpose:** Widget configuration tab panel

#### WidgetEmbedTab
- **File:** `src/pages/admin/components/WidgetEmbedTab.jsx`
- **Purpose:** Embed code tab panel

#### WidgetDomainsTab
- **File:** `src/pages/admin/components/WidgetDomainsTab.jsx`
- **Purpose:** Domain whitelist management tab

#### WidgetSettingsTab
- **File:** `src/pages/admin/components/WidgetSettingsTab.jsx`
- **Purpose:** Advanced widget settings tab

### 5.10 Legacy Widget Components

#### WidgetEmbed
- **File:** `src/pages/widget/WidgetEmbed.jsx`
- **Purpose:** Legacy widget embed component

#### WidgetPreview
- **File:** `src/pages/widget/WidgetPreview.jsx`
- **Purpose:** Legacy widget preview component

---

## 6. NEW COMPONENTS NEEDED — ALL PHASES

### Phase 2: Shipping & Multi-Format

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| ShippingMethodCard | Display shipping method with price/toggle | method, onToggle, onEdit | /admin/shipping |
| ShippingMethodEditor | Edit shipping method (flat/weight-based/free) | method, onChange, onSave | /admin/shipping |
| ShippingZoneEditor | Define shipping zones by country/region | zone, countries, onChange | /admin/shipping |
| WeightBasedRateTable | Weight-tier pricing table | rates, onChange, onAddTier | /admin/shipping |
| FreeShippingProgress | Progress bar toward free shipping threshold | current, threshold, currency | Checkout step |
| ShippingSelector | Select shipping method during checkout | methods, selected, onChange | CheckoutForm |
| FormatBadge | File format indicator badge (STL/OBJ/3MF) | format | FileUploadZone |
| FormatIcon | File format icon | format, size | File lists |

### Phase 3: Coupons, Email Templates, Kanban

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| CouponInput | Coupon code entry field with apply button | value, onChange, onApply, status | CheckoutForm |
| CouponBadge | Applied coupon display with remove option | code, discount, onRemove | PricingCalculator |
| CouponCodeGenerator | Random code generator for admin | onGenerate, prefix, length | /admin/promotions |
| CouponEditor | Full coupon configuration form | coupon, onChange, materials | /admin/promotions |
| CouponListTable | Coupon list with search/filter | coupons, onEdit, onDelete | /admin/promotions |
| PromotionBanner | Active promotion banner display | promotion, onDismiss | Calculator pages |
| DiscountTimer | Countdown timer for limited-time offers | endDate | Calculator pages |
| EmailTemplateEditor | WYSIWYG HTML email template editor | template, variables, onChange | /admin/emails |
| EmailPreview | Email preview in desktop/mobile frame | html, device | /admin/emails |
| EmailVariableInserter | Insert dynamic variables into template | variables, onInsert | /admin/emails |
| EmailTestSender | Send test email form | templateId, recipientEmail | /admin/emails |
| KanbanBoard | Drag-and-drop kanban board container | columns, onDragEnd | /admin/orders/kanban |
| KanbanColumn | Single kanban column with drop zone | title, cards, status, count | /admin/orders/kanban |
| KanbanCard | Draggable order card in kanban | order, onQuickAction | /admin/orders/kanban |
| KanbanDragHandle | Drag handle element for cards | | /admin/orders/kanban |

### Phase 4: Quality Reports

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| QualityReportCard | Print quality metrics summary | report, order | Order detail |
| PhotoUploadGrid | Grid of uploaded print photos | photos, onUpload, onDelete | Order detail |
| DefectClassifier | Defect type selector with severity | defects, onClassify | Order detail |
| QualityTimeline | Quality check timeline | events | Order detail |
| QualityStarRating | Star rating input | value, onChange, max | Order detail |

### Phase 5: PDF Documents, Customer Portal

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| PDFTemplateEditor | Visual PDF template designer | template, fields, onChange | /admin/documents |
| PDFFieldPlacer | Drag-and-drop field placement on PDF | fields, onPlace, onMove | /admin/documents |
| PDFPreview | Rendered PDF preview iframe | pdfUrl | /admin/documents |
| DocumentHistoryTable | Generated documents list | documents, onDownload | /admin/documents |
| CustomerList | Searchable customer table | customers, filters, onSelect | /admin/customers |
| CustomerDetail | Customer profile with tabs | customer, orders, notes | /admin/customers |
| CustomerCard | Customer summary card | customer | /admin/customers |
| CustomerSegmentTag | Customer segment/tag badge | segment, color | /admin/customers |
| CommunicationLog | Customer communication history | messages, onSend | /admin/customers |
| CustomerNotes | Customer notes with add/edit | notes, onAdd, onEdit | /admin/customers |

### Phase 6: Localization, API, CRM, Security

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| LanguageSelector | Supported language list manager | languages, onAdd, onRemove | /admin/localization |
| CurrencyFormatter | Currency format preview | amount, currency, locale | /admin/localization |
| TranslationOverrideTable | Custom translation string editor | translations, onChange | /admin/localization |
| RegionalPreview | Date/number/unit format preview | locale, settings | /admin/localization |
| APIKeyManager | API key list with create/revoke | keys, onCreate, onRevoke | /admin/api |
| APIKeyCard | Single API key display with scope | key, scopes, onRevoke | /admin/api |
| WebhookConfig | Webhook endpoint configuration | webhook, events, onChange | /admin/api |
| WebhookEventSelector | Event type multi-select | events, selected, onChange | /admin/api |
| WebhookDeliveryLog | Webhook delivery history table | deliveries | /admin/api |
| APIExplorer | Interactive API documentation | endpoints | /admin/api |
| RateLimitMeter | API rate limit usage gauge | used, limit, period | /admin/api |
| ContactManager | CRM contact list/editor | contacts, onEdit | /admin/crm |
| LeadPipeline | Sales lead pipeline stages | leads, stages, onMove | /admin/crm |
| CampaignBuilder | Email campaign builder | campaign, templates, onChange | /admin/crm |
| CampaignAnalytics | Campaign performance metrics | campaignId, metrics | /admin/crm |
| AutomationRuleEditor | Trigger/action workflow editor | rule, triggers, actions | /admin/crm |
| AccessLogTable | Security access log table | logs, filters | /admin/security |
| IPWhitelistEditor | IP whitelist manager | ips, onAdd, onRemove | /admin/security |
| GDPRRequestManager | GDPR data request handler | requests, onProcess | /admin/security |
| ComplianceDashboard | Compliance status overview | items, score | /admin/security |
| ComplianceChecklist | Interactive compliance checklist | items, onToggle | /admin/security |

### Phase 7: Technologies, E-commerce

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| TechnologyCard | Print technology summary card | technology, onEdit | /admin/technologies |
| PrinterProfileEditor | Printer profile configuration form | printer, onChange | /admin/technologies |
| BuildVolumeVisualizer | 3D build volume visualization | width, height, depth | /admin/technologies |
| MaterialTechMatrix | Material-technology compatibility matrix | materials, technologies | /admin/technologies |
| IntegrationCard | E-commerce integration status card | platform, status, onConfigure | /admin/integrations |
| IntegrationSetupWizard | Multi-step integration setup | platform, steps, currentStep | /admin/integrations |
| SyncStatusLog | Product/order sync history | logs, filters | /admin/integrations |
| FieldMappingEditor | Field mapping between platforms | sourceFields, targetFields | /admin/integrations |
| PlatformIcon | E-commerce platform logo icon | platform, size | /admin/integrations |

### Cross-Cutting Components (Needed Across Multiple Phases)

| Component | Purpose | Props | Used In |
|-----------|---------|-------|---------|
| DataTable | Reusable sortable/filterable table | columns, data, sort, filter, pagination | Multiple admin pages |
| EmptyState | Consistent empty state display | icon, title, description, action | Multiple admin pages |
| StatusBadge | Consistent status badge | status, variant | Orders, Invites, Integrations |
| ConfirmDialog | Reusable confirmation dialog | title, message, onConfirm, onCancel | Multiple admin pages |
| Toast | Toast notification system | message, type, duration | Multiple admin pages |
| SearchInput | Consistent search input with icon | value, onChange, placeholder | Multiple admin pages |
| FilterBar | Multi-filter horizontal bar | filters, onChange | Multiple admin pages |
| Pagination | Consistent pagination control | page, total, pageSize, onChange | Multiple admin pages |
| BulkActionBar | Bulk selection action toolbar | selectedCount, actions | Multiple admin pages |
| TabNavigation | Consistent tab navigation | tabs, activeTab, onChange | Multiple admin pages |
| StatCard | Consistent KPI stat card | title, value, sub, icon, color | Dashboard, Analytics |
| ProgressBar | Generic progress bar | value, max, label, color | Multiple |
| DateRangePicker | Date range selector | from, to, onChange | Analytics, Orders |
| AvatarCircle | User avatar with initials fallback | name, imageUrl, size | Account, Team |
| CopyButton | Click-to-copy with feedback | text, label | Widget Embed, API |

---

## 7. COMPONENT HIERARCHY TREES

### Public Pages
```
App
  Routes (BrowserRouter)
    SmoothScroll
    ScrollToTop
    Header
      Logo
      NavLinks
      LanguageToggle
      AuthButtons
    main
      Home
        BackgroundPattern
        Reveal > Sparkles, Button, MotionNumber
        LogoMarquee
        SpotlightCard > Icon
        ImageRipple > Hero Mockup
        GlobalMap / InteractiveWorldMap
        Accordion
      Login
        LoginForm > LoginHeader, SocialLogin, LoginActions
      Register
        ProgressSteps
        RoleSelectionCard > Icon
        RegistrationForm
      Pricing
        Container
        MotionNumber
        PricingPlanCard
        GlossaryTerm
        FaqTabs
        SupportHoverCards
      Support
        Icon
        FAQ Categories > FAQ Items
      Account
        BackgroundPattern
        AnimatePresence > Tab Content
          FormInput, Card (inline)
      ModelUpload
        FileUploadZone
        ModelViewer
        PrintConfiguration
        PricingCalculator
      TestKalkulacka
        ErrorBoundary
        FileUploadZone
        ModelViewer
        PrintConfiguration
        PricingCalculator
        GenerateButton
        CheckoutForm
        OrderConfirmation
    Footer
```

### Admin Pages
```
AdminLayout
  aside.admin-sidebar
    NavItems (10 links)
  main.admin-content
    Outlet
      AdminDashboard
        react-grid-layout (WidthProvider)
          StatCards (N configurable KPI cards)
        ActivityList
        QuickStatsGrid
        AddMetricModal
        SettingsModal
      AdminBranding
        BusinessInfoSection (inputs)
        LogoSection (upload area)
        CalcSettingsSection (checkboxes, slider)
        ColorSchemeSection (color inputs, presets)
        TypographySection (radio buttons)
        LivePreview (calculator mockup)
      AdminPricing
        MaterialsTable (rows with inline edit)
        TimePricing (hourly rate input)
        MinPrice (input)
        Rounding (config)
        VolumeDiscounts (tier table)
        Simulator (preview)
      AdminFees
        FeeListPanel
          Search + Filters + BulkBar
          FeeRows (checkbox, dot, name, chips, value)
        FeeEditorPanel
          BasicsSection (name, category, description, active)
          CalcSection (scope, type, value, charge_basis)
          WidgetSection (required, selectable, selectedByDefault)
          ConditionsSection (condition rows)
          SimulatorSection (inputs + result)
      AdminParameters
        ParameterList > ParameterEditor
      AdminPresets
        PresetList > PresetEditor
      AdminOrders
        OrderList (table + filters + pagination)
        OrderDetail (models + pricing + status + audit)
      AdminAnalytics
        RangeTabs (7d/30d/90d)
        StatCards (overview)
        SessionsTable
        LostSessionsList
        ExportButton
      AdminTeamAccess
        SummaryCards
        TabButtons (Users/Roles/Audit)
        UsersList (rows + actions)
        InviteForm + InviteList
        AuditLog (table)
      AdminWidget
        WidgetSelector
        TabButtons (Config/Embed/Domains/Settings)
        WidgetConfigTab
        WidgetEmbedTab
        WidgetDomainsTab
        WidgetSettingsTab
```

### Widget Builder (Fullscreen)
```
BuilderPage
  BuilderTopBar
    BackButton
    WidgetName
    DeviceSwitcher (Desktop/Tablet/Mobile)
    UndoRedo
    SaveButton
    StepSwitcher (Upload/Config/Summary)
  BuilderLeftPanel
    ElementsTab > ElementTree
    StyleTab > PropertyEditors
      TextPropertyEditor
      NumberPropertyEditor
      SelectPropertyEditor
      BooleanPropertyEditor
      ColorPropertyEditor
    GlobalTab > ThemeConfig
    QuickThemeDropdown
  BuilderRightPanel
    DevicePreviewFrame
      WidgetKalkulacka (live preview)
        WidgetHeader
        WidgetStepper
        FileUploadZone / PrintConfiguration / PricingCalculator
        WidgetFooter
  OnboardingOverlay
```

### Widget Embed (Standalone)
```
WidgetPublicPage
  WidgetKalkulacka (theme from config, embedded=true)
    WidgetHeader
    WidgetStepper
    Step 1: FileUploadZone
    Step 2: PrintConfiguration + ModelViewer
    Step 3: PricingCalculator + GenerateButton
    WidgetFooter
```

---

## 8. STATE ARCHITECTURE

### Global State
| State | Provider | Scope | Source |
|-------|----------|-------|--------|
| Language (CS/EN) | LanguageContext | All pages | `src/contexts/LanguageContext.jsx` |
| Auth User | AuthContext | Protected routes | `src/context/AuthContext` (Firebase) |

### Per-Page State (useState)
| Page | Key State | Persistence |
|------|-----------|-------------|
| TestKalkulacka | currentStep, uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections | pricingConfig/feesConfig from localStorage |
| WidgetKalkulacka | Same as above + theme | Theme from props/config |
| AdminDashboard | dashboardConfig, draftConfig | localStorage (tenant-scoped) |
| AdminBranding | branding, savedSnapshot, errors, logoDraft | localStorage (tenant-scoped) |
| AdminPricing | pricingConfig, savedSnapshot | localStorage (tenant-scoped) |
| AdminFees | fees[], activeId, selectedIds, filters | localStorage (tenant-scoped) |
| AdminOrders | orders[], filters, selectedOrder | localStorage (tenant-scoped) |
| AdminAnalytics | range, sessions | localStorage (tenant-scoped) |
| AdminTeamAccess | tab, users, invites, audit | localStorage (tenant-scoped) |
| AdminWidget | widgets[], selectedId, editor, domains | localStorage (tenant-scoped) |
| BuilderPage | builder state (useBuilderState hook), previewStep | localStorage (tenant-scoped) |
| Account | activeTab, profileData, passwordData | Mock data (no persistence) |
| Register | currentStep, selectedRole | Session only |

### Tenant-Scoped Storage Helpers
| Helper | Namespace | Key Pattern |
|--------|-----------|-------------|
| adminTenantStorage | — | `modelpricer:tenant_id` |
| adminPricingStorage | pricing:v3 | `modelpricer:${tenantId}:pricing:v3` |
| adminFeesStorage | fees:v3 | `modelpricer:${tenantId}:fees:v3` |
| adminBrandingWidgetStorage | branding | `modelpricer:${tenantId}:branding:*` |
| adminOrdersStorage | orders | `modelpricer:${tenantId}:orders:*` |
| adminAnalyticsStorage | analytics | `modelpricer:${tenantId}:analytics:*` |
| adminTeamAccessStorage | team | `modelpricer:${tenantId}:team:*` |
| adminDashboardStorage | dashboard | `modelpricer:${tenantId}:dashboard:*` |
| adminAuditLogStorage | audit | `modelpricer:${tenantId}:audit:*` |
| adminFormStorage | form | `modelpricer:${tenantId}:form:*` |
| widgetThemeStorage | theme | Widget theme CSS variable generation |

---

## 9. ROUTING MAP

### Complete Route Table

| # | Path | Component | Layout | Auth | Status |
|---|------|-----------|--------|------|--------|
| 1 | `/` | Home | PublicLayout | No | Existing |
| 2 | `/login` | Login | PublicLayout | No | Existing |
| 3 | `/register` | Register | PublicLayout | No | Existing |
| 4 | `/pricing` | Pricing | PublicLayout | No | Existing |
| 5 | `/support` | Support | PublicLayout | No | Existing |
| 6 | `/account` | AccountPage | PublicLayout | Yes* | Existing (*guard disabled for dev) |
| 7 | `/model-upload` | ModelUpload | PublicLayout | No | Existing (legacy) |
| 8 | `/test-kalkulacka` | TestKalkulacka | PublicLayout | No | Existing |
| 9 | `/invite/accept` | InviteAccept | PublicLayout | No | Existing |
| 10 | `/admin` | AdminDashboard | AdminLayout | Yes* | Existing |
| 11 | `/admin/branding` | AdminBranding | AdminLayout | Yes* | Existing |
| 12 | `/admin/pricing` | AdminPricing | AdminLayout | Yes* | Existing |
| 13 | `/admin/fees` | AdminFees | AdminLayout | Yes* | Existing |
| 14 | `/admin/parameters/*` | AdminParameters | AdminLayout | Yes* | Existing |
| 15 | `/admin/presets/*` | AdminPresets | AdminLayout | Yes* | Existing |
| 16 | `/admin/orders` | AdminOrders | AdminLayout | Yes* | Existing |
| 17 | `/admin/analytics` | AdminAnalytics | AdminLayout | Yes* | Existing |
| 18 | `/admin/team` | AdminTeamAccess | AdminLayout | Yes* | Existing |
| 19 | `/admin/widget` | AdminWidget | AdminLayout | Yes* | Existing |
| 20 | `/admin/widget/builder/:id` | AdminWidgetBuilder | Fullscreen | Yes* | Existing |
| 21 | `/w/:publicWidgetId` | WidgetPublicPage | Embedded | No | Existing |
| 22 | `*` | NotFound | PublicLayout | No | Existing |
| — | `/admin/shipping` | AdminShipping | AdminLayout | Yes | Phase 2 |
| — | `/admin/promotions` | AdminPromotions | AdminLayout | Yes | Phase 3 |
| — | `/admin/emails` | AdminEmails | AdminLayout | Yes | Phase 3 |
| — | `/admin/orders/kanban` | AdminOrdersKanban | AdminLayout | Yes | Phase 3 |
| — | `/admin/documents` | AdminDocuments | AdminLayout | Yes | Phase 5 |
| — | `/admin/customers` | AdminCustomers | AdminLayout | Yes | Phase 5 |
| — | `/admin/localization` | AdminLocalization | AdminLayout | Yes | Phase 6 |
| — | `/admin/api` | AdminAPI | AdminLayout | Yes | Phase 6 |
| — | `/admin/crm` | AdminCRM | AdminLayout | Yes | Phase 6 |
| — | `/admin/security` | AdminSecurity | AdminLayout | Yes | Phase 6 |
| — | `/admin/technologies` | AdminTechnologies | AdminLayout | Yes | Phase 7 |
| — | `/admin/integrations` | AdminIntegrations | AdminLayout | Yes | Phase 7 |

### Route Structure in Routes.jsx
```
BrowserRouter
  /w/:publicWidgetId                    (top-level, no header/footer)
  /admin/widget/builder/:id             (top-level, fullscreen)
  * (catch-all wrapper with Header+Footer)
    /login
    /register
    /
    /model-upload
    /test-kalkulacka
    /pricing
    /support
    /account
    /invite/accept
    /admin (AdminLayout + Outlet)
      index -> AdminDashboard
      branding
      pricing
      fees
      parameters/*
      presets/*
      orders
      widget
      analytics
      team
    * -> NotFound
```

---

## 10. RESPONSIVE STRATEGY

### Breakpoints Used
- **sm:** 640px (Tailwind default)
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px

### Per-Layout Responsive Behavior

| Layout | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|--------|-----------------|---------------------|-------------------|
| PublicLayout | Header hamburger menu, single column, stacked CTAs | 2-col grids, visible nav | Full nav, multi-col grids |
| AdminLayout | Sidebar hidden (not yet implemented - needs mobile drawer) | Sidebar collapsed or overlay | Full 260px sidebar |
| FullscreenLayout (Builder) | Not supported (desktop only) | Limited support | Full 35%/65% split |
| EmbeddedLayout (Widget) | Full-width, steps stacked | Adapts to container | Adapts to container |
| WizardLayout | Single column, full-width steps | Centered with max-width | Centered with max-width |

### Critical Responsive Gaps (Known Issues)
1. **AdminLayout has no mobile hamburger** — sidebar is always visible at 260px
2. **AdminFees 2-col layout** at 1100px collapse works, but bulkbar can overflow
3. **AdminDashboard KPI grid** — react-grid-layout is not natively responsive; columns are manually set
4. **Widget Builder** — designed for desktop only, no tablet/mobile fallback
5. **Tables in AdminOrders/AdminAnalytics** — rely on horizontal scroll but no dedicated mobile card view

---

## APPENDIX A: FILE COUNT SUMMARY

| Category | Count |
|----------|-------|
| Pages (existing) | 23 routes |
| Pages (planned) | 12 new routes |
| Components (UI Kit) | 15 |
| Components (Marketing) | 16 |
| Components (Calculator) | 8 unique (some duplicated 3x) |
| Components (Widget-specific) | 4 |
| Components (Builder) | 15 |
| Components (Login/Register) | 7 |
| Components (Admin sub-components) | 4 |
| Components (Other) | 6 |
| **Total Existing Components** | **~75** |
| **New Components Needed** | **~80** |
| Contexts | 1 (LanguageContext) |
| Custom Hooks | 2 (useAuth, useDebouncedRecalculation) |
| Utils/Helpers | 15 |
| Storage Helpers | 10 |

## APPENDIX B: ADMIN SIDEBAR NAVIGATION — FUTURE STATE

After all phases are implemented, the admin sidebar will have:

```
Dashboard           (existing)
Branding            (existing)
Pricing             (existing)
Fees                (existing)
Parameters          (existing)
Presets             (existing)
Orders              (existing, + kanban view)
Shipping            (Phase 2)
Promotions          (Phase 3)
Email Templates     (Phase 3)
Analytics           (existing)
Customers           (Phase 5)
Documents           (Phase 5)
Team Access         (existing)
Widget              (existing)
Technologies        (Phase 7)
Integrations        (Phase 7)
API                 (Phase 6)
Localization        (Phase 6)
CRM                 (Phase 6)
Security            (Phase 6)
```

Total: 22 nav items. Will need grouping/collapsible sections in the sidebar.

Suggested groups:
1. **Overview:** Dashboard
2. **Pricing:** Pricing, Fees, Promotions
3. **Products:** Parameters, Presets, Technologies
4. **Orders:** Orders, Shipping, Documents
5. **Customers:** Customers, CRM
6. **Marketing:** Widget, Email Templates, Analytics
7. **Settings:** Branding, Team Access, Localization, API, Integrations, Security

---

*End of Frontend Infrastructure Document*
