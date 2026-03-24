# 258-CP_UPRAVY — Customer Portal Implementation Phase 1 — Technical Changes

**Session:** S01 (2026-03-22)
**Oblast:** Customer Portal (CP) — Implementation Phase 1
**Typ zaznamu:** UPRAVY (Technical Changes Record)

---

## Popis

Zaznam vsech novych a upravenych souboru pri vytvareni Customer Portal Phase 1.
Nove 16 frontend + infrastruktura souboru (8.1K radku), 2 upravene files (Routes.jsx, backend index.js), 3 dokumentacni files (~4.7K radku).

---

## Nove soubory (16 celkem, 8,113 radku)

### Frontend Pages (10 souboru, 6,320 radku)

#### Sidebar Layout & Navigation
- **src/pages/portal/CustomerPortalLayout.jsx** (608 lines)
  - Responsive sidebar layout (collapsed/expanded)
  - Navigation menu (Dashboard, Orders, Models, Presets, Profile, Support)
  - Logout handling
  - Mobile drawer support
  - Tenant context integration

#### Dashboard & Overview
- **src/pages/portal/CustomerDashboard.jsx** (594 lines)
  - Statistics cards (Total Orders, Total Spent, Models Uploaded, Active Projects)
  - Recent Orders widget (last 5 orders with status)
  - Quick Actions (Upload Model, View Orders)
  - Order trends miniature chart
  - Responsive grid layout

#### Orders Management
- **src/pages/portal/CustomerOrders.jsx** (617 lines)
  - Sortable orders table (date, model, status, total, action)
  - Status filter dropdown (All, Pending, Approved, In Progress, Completed, Cancelled)
  - Date range filter
  - Search by order ID / model name
  - Pagination (10 items per page)
  - Bulk actions (Export, Archive)

- **src/pages/portal/CustomerOrderDetail.jsx** (788 lines)
  - Order timeline (status progression with timestamps)
  - Order items breakdown (model, quantity, unit price, total)
  - Pricing breakdown (subtotal, fees, tax, total)
  - Payment status & method display
  - Notes & activity log section
  - Action buttons (Download Invoice, Reorder, Request Changes, Cancel Order)
  - Responsive detail layout

#### Models & Presets
- **src/pages/portal/CustomerModels.jsx** (666 lines)
  - Model gallery grid (name, thumbnail, upload date, material)
  - Upload new model button (drag-drop zone)
  - Search & filter by material
  - Delete & duplicate model actions
  - Model statistics (total count, total size, format breakdown)
  - Responsive grid with lazy loading

- **src/pages/portal/CustomerPresets.jsx** (454 lines)
  - Saved presets list (name, material, print time, cost estimate)
  - Create new preset button
  - Edit/Delete actions
  - Preset tags/categories
  - Quick apply to model feature
  - Search & sort functionality

#### Profile & Account
- **src/pages/portal/CustomerProfile.jsx** (646 lines)
  - 4-tab interface: Profile, Company, Security, Billing
  - Profile tab: name, email, phone, avatar upload
  - Company tab: company name, ICO, DIC, address (if applicable)
  - Security tab: password change, 2FA toggle, sessions management
  - Billing tab: subscription plan, payment methods, invoice history
  - Toast notifications for save feedback
  - Form validation & error handling

#### Support & Help
- **src/pages/portal/CustomerSupport.jsx** (589 lines)
  - FAQ section (expandable Q&A items)
  - Contact form (subject, message, attachment)
  - Live chat widget placeholder
  - Support ticket history
  - Documentation links
  - Responsive layout with collapsible FAQ

#### Authentication Pages
- **src/pages/portal/CustomerLogin.jsx** (603 lines)
  - Email + password login
  - Google Sign-In button
  - "Forgot password?" link
  - Register link redirect
  - Remember me checkbox
  - Error message display
  - Loading state handling

- **src/pages/portal/CustomerRegister.jsx** (755 lines)
  - Email, password, confirm password fields
  - Full name field
  - Terms & conditions checkbox
  - Privacy policy link
  - CAPTCHA placeholder
  - Form validation (password strength, email format)
  - Auto-login on successful registration
  - Back to login link

### Infrastructure & Context (6 souboru, 1,793 radku)

#### Frontend Context & State Management
- **src/context/CustomerContext.jsx** (458 lines)
  - CustomerContext provider (auth state, user data, tenant isolation)
  - useCustomer() hook
  - Actions: setUser, setLoading, setError, clearAuth
  - Supabase integration hooks
  - Tenant-scoped data loading
  - Error state management

#### Protected Routes
- **src/components/CustomerPrivateRoute.jsx** (186 lines)
  - Protected route wrapper for customer portal
  - Redirect to login if unauthenticated
  - Tenant verification
  - Loading spinner during auth check
  - Deep link handling (redirects to target after login)

#### API Service Layer
- **src/services/customerApi.js** (278 lines)
  - GET /api/customer/profile
  - GET /api/customer/orders
  - GET /api/customer/orders/{id}
  - GET /api/customer/models
  - POST /api/customer/models
  - DELETE /api/customer/models/{id}
  - GET /api/customer/presets
  - POST /api/customer/presets
  - PUT /api/customer/presets/{id}
  - Error handling & retry logic
  - Auth header injection (JWT token)

#### Client-Side Storage Helpers
- **src/utils/customerStorage.js** (279 lines)
  - getCustomerOrders(tenantId)
  - saveCustomerOrder(tenantId, order)
  - getCustomerModels(tenantId)
  - getCustomerPresets(tenantId)
  - saveCustomerPreset(tenantId, preset)
  - deleteCustomerPreset(tenantId, presetId)
  - localStorage wrapper with namespacing
  - Supabase adapter stubs for Phase 2

#### Backend Data Store
- **backend-local/src/customerStore.js** (873 lines)
  - In-memory customer data store (development mode)
  - Customer profile management (name, email, company)
  - Order history (status, items, pricing, timeline)
  - Model library (uploaded STL files, metadata)
  - Preset definitions (print configs, material, cost)
  - CRUD operations for all entities
  - Tenant isolation (per-tenant data partitioning)
  - Mock data generators (10 sample customers, 50+ orders, 20+ models, 15+ presets)

#### Backend API Routes
- **backend-local/src/routes/customerPortal.js** (719 lines)
  - GET /api/customer/profile — return current user profile
  - GET /api/customer/orders — list all orders with pagination
  - GET /api/customer/orders/:id — order detail + timeline
  - POST /api/customer/orders/:id/notes — add order note
  - GET /api/customer/models — list uploaded models
  - POST /api/customer/models — upload model (endpoint stub, multipart handling)
  - DELETE /api/customer/models/:id — delete model from library
  - GET /api/customer/presets — list saved presets
  - POST /api/customer/presets — create preset
  - PUT /api/customer/presets/:id — update preset
  - DELETE /api/customer/presets/:id — delete preset
  - PUT /api/customer/profile — update profile data
  - All routes: requireAuth + requireTenant middleware
  - Error handling & validation

---

## Upravene soubory (2 souboru, 43 radku)

### Routing Configuration
- **src/Routes.jsx** (+43 lines)
  - Added lazy imports for customer portal pages:
    ```javascript
    const CustomerPortalLayout = lazy(() => import('./pages/portal/CustomerPortalLayout'));
    const CustomerDashboard = lazy(() => import('./pages/portal/CustomerDashboard'));
    const CustomerOrders = lazy(() => import('./pages/portal/CustomerOrders'));
    const CustomerOrderDetail = lazy(() => import('./pages/portal/CustomerOrderDetail'));
    const CustomerModels = lazy(() => import('./pages/portal/CustomerModels'));
    const CustomerPresets = lazy(() => import('./pages/portal/CustomerPresets'));
    const CustomerProfile = lazy(() => import('./pages/portal/CustomerProfile'));
    const CustomerSupport = lazy(() => import('./pages/portal/CustomerSupport'));
    const CustomerLogin = lazy(() => import('./pages/portal/CustomerLogin'));
    const CustomerRegister = lazy(() => import('./pages/portal/CustomerRegister'));
    ```
  - Added route tree under `/portal`:
    - `/portal/login` → CustomerLogin
    - `/portal/register` → CustomerRegister
    - `/portal/*` (protected with CustomerPrivateRoute):
      - `/portal/dashboard` → CustomerDashboard
      - `/portal/orders` → CustomerOrders
      - `/portal/orders/:id` → CustomerOrderDetail
      - `/portal/models` → CustomerModels
      - `/portal/presets` → CustomerPresets
      - `/portal/profile` → CustomerProfile
      - `/portal/support` → CustomerSupport

### Backend Server Configuration
- **backend-local/src/index.js** (5 lines added)
  - Import customer portal routes: `import customerPortalRouter from './routes/customerPortal.js';`
  - Mount router: `app.use('/api/customer', customerPortalRouter);`
  - Placed after existing route imports
  - Middleware chain: requireAuth, requireTenant applied in routes file

---

## Research & Documentation (3 soubory, ~4,677 radku)

### Feature Research
- **docs/claude/Documentation/Customer-Portal-Research-Part1-Features.md** (1,328 lines)
  - Customer Portal Overview (7 sections)
  - Competitive analysis (Printful, Treatstock, MyMiniFactory, Cults3D)
  - User persona (Small-medium printing shops, freelancers, individual creators)
  - 9 Core Features (Dashboard, Orders, Models, Presets, Profile, Support, Notifications, Wishlist, Analytics)
  - Feature matrix comparison with competitors
  - User workflow (Upload → Configure → Price → Order → Track → Support)
  - Success metrics & KPIs

### Competitor Analysis
- **docs/claude/Documentation/Customer-Portal-Research-Part2-Competitors.md** (1,123 lines)
  - Deep dive on 8 print-on-demand platforms
  - Feature comparison matrix (14x8 grid)
  - UI/UX observations from each platform
  - What ModelPricer does differently
  - Integration points (Shopify, Stripe, email, webhooks)
  - Recommendations for Phase 2 & Phase 3

### Technical Architecture
- **docs/claude/Documentation/Customer-Portal-Research-Part3-Technical.md** (2,226 lines)
  - Architecture overview (Frontend pages, Context, API service, Backend routes, Storage)
  - Database schema for customer portal (customers, orders, models, presets tables)
  - API contract specifications (10 core endpoints)
  - Security model (requireAuth, requireTenant, RLS policies)
  - Performance considerations (lazy loading, pagination, caching)
  - Supabase integration plan for Phase 2
  - Testing strategy (unit tests, integration tests, e2e tests)

---

## Build & Validation

### npm run build
- **Status:** ✅ PASS (57.91s)
- **Output:** No errors, no warnings
- **Bundle:** All lazy-loaded routes properly code-split
- **Size:** Frontend +18KB, Backend +12KB (acceptable for Phase 1)

### Quality Gates
- ✅ No P0 issues
- ✅ Imports/exports verified (no white screen risk)
- ✅ Case sensitivity checked (Windows → Linux compatible)
- ✅ Lazy route imports validated
- ✅ Backend route mounting confirmed
- ✅ Tenant context integration verified

---

## Celkem statistika

| Kategorie | Pocet | Radku |
|-----------|-------|-------|
| **Nove soubory** | 16 | 8,113 |
| Upravene soubory | 2 | 43 |
| Dokumentacni soubory | 3 | ~4,677 |
| **CELKEM** | **21** | **~12,833** |

---

## Phase 1 Deliverables Checklist

- [x] CustomerPortalLayout — sidebar + navigation
- [x] CustomerDashboard — stats + recent orders
- [x] CustomerOrders — list + filters + pagination
- [x] CustomerOrderDetail — timeline + items + actions
- [x] CustomerModels — gallery + upload + search
- [x] CustomerPresets — saved presets + CRUD
- [x] CustomerProfile — 4 tabs (profile, company, security, billing)
- [x] CustomerSupport — FAQ + contact form
- [x] CustomerLogin — email + Google signin
- [x] CustomerRegister — signup form + validation
- [x] CustomerContext — state management + hooks
- [x] CustomerPrivateRoute — route protection
- [x] customerApi.js — service layer (10 endpoints)
- [x] customerStorage.js — client-side helpers
- [x] customerStore.js — backend data store (mock)
- [x] customerPortal.js — backend routes (12 endpoints)
- [x] Routes.jsx — routing configuration
- [x] backend index.js — router mounting
- [x] Research Part 1 — features & personas
- [x] Research Part 2 — competitors & UI/UX
- [x] Research Part 3 — technical architecture
- [x] Build PASS — no errors/warnings

---

## Design Decisions

1. **Page-by-page approach:** Separate components for each customer portal page (vs. single monolithic page)
2. **Context-based state:** CustomerContext for auth + tenant-scoped data (vs. Redux)
3. **Backend mock store:** In-memory customerStore.js for development (vs. hardcoded responses)
4. **Service layer:** customerApi.js abstracts HTTP calls (easy transition to Supabase in Phase 2)
5. **Lazy route loading:** All customer portal routes are lazy-imported (improve initial load time)
6. **Tenant isolation:** All API endpoints use requireTenant middleware

---

## Poznamky pro Phase 2

- **Supabase migration:** Replace customerStore.js mock with Supabase SDK calls
- **RLS policies:** Add row-level security for customer portal tables
- **Avatar upload:** Implement image upload to R2 storage in CustomerProfile
- **Email notifications:** Send order confirmation emails via Resend
- **Real-time updates:** Add Supabase Realtime subscription for order status changes
- **Payment methods:** Integrate Stripe payment method management in Billing tab
- **2FA:** Implement second-factor authentication in Security tab

---

## Soubory k aktualizaci v MEMORY.md

```markdown
## Session 2026-03-22 — Customer Portal Phase 1 Implementation
- **16 nove frontend + backend soubory** (8,113 radku)
- **3 dokumentacni soubory** (4,677 radku research)
- **2 upravene soubory** (Routes.jsx, backend index.js)
- **Build PASS** (57.91s)
- **IDs:** 256-257 (research), 258-259 (planning/implementation)
- **Key files:** src/pages/portal/*, src/context/CustomerContext.jsx, src/services/customerApi.js, backend-local/src/routes/customerPortal.js
```

---

**Zaznam vytvorzen:** 2026-03-22 (S01)
**Status:** ✅ COMPLETE
