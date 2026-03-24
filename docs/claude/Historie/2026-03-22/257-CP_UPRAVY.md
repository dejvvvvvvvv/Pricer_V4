# 257-CP — UPRAVY — Customer Portal Research Documentation — 2026-03-22

## Metadata
- **ID:** 257-CP
- **Session:** S01
- **Datum:** 2026-03-22
- **Oblast:** Customer Portal (Research & Documentation)
- **Souvisejici ID:** 256-CP (KONVERZACE — research iniciace)
- **Trigger:** Uzivatelsky pozadavek na komplexni market research pred implementaci Customer Portal feature

---

## Souhrn uprav

Vytvoreni 3 komplementarnich research dokumentu jako vysledek paralelni research iniciace. Dokumenty pokryvaji:
1. **Part1 — Features:** Best practices pro customer portal, 7 klicovych oblasti (auth, dashboard, orders, models, presets, profile, communication) s prioritou, ukazateli a integracnimi body
2. **Part2 — Competitors:** Analyza 8 konkurencnich platform (Shapeways, Sculpteo, Xometry, Protolabs, Hubs, Amazon 3D, Shopify, Etsy) s learning pointy pro ModelPricer
3. **Part3 — Technical:** Architekturni rozhodnuti (API design, security, data patterns, performance, monitoring)

Dokumenty slouzı jako zaklad pro MASTER-ROADMAP-CP.md a faze-based implementaci (CP-PHASE-1 az CP-PHASE-4).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | docs/claude/Documentation/Customer-Portal-Research-Part1-Features.md | Novy soubor | 1-1328 | Feature matrix: 7 oblasti, 25+ features, P0/P1/P2 priorita, best practices, competitive advantages |
| 2 | docs/claude/Documentation/Customer-Portal-Research-Part2-Competitors.md | Novy soubor | 1-1123 | Competitor analysis: 8 platform, auth model, dashboard, order tracking, komunikace, learning points |
| 3 | docs/claude/Documentation/Customer-Portal-Research-Part3-Technical.md | Novy soubor | 1-1850+ | Technical architecture: API design (REST/GraphQL), security (RLS, rate limits, encryption), data patterns, performance, monitoring (Sentry), deployment |

---

## Detailni zmeny

### 1. `docs/claude/Documentation/Customer-Portal-Research-Part1-Features.md`

**Typ:** Novy soubor
**Radky:** 1-1328
**Duvod:** Dokumentace best practices a feature definice pro customer portal

**Obsah:**
- **Metadata:** Datum vytvoreni, verze, autor (agent), related IDs
- **Executive Summary:** Prehled 7 oblasti, timeline (PHASE-1 az PHASE-4 over 3-4 mesice)
- **Section 1 — Authentication & Authorization:**
  - Multi-provider (Firebase, Google, Email/Password, SSO opcne)
  - Tenant isolation (per-company customer portal)
  - Role-based access (customer, admin, viewer)
  - Best practice: OAuth 2.0, JWT, rate limiting

- **Section 2 — Dashboard & Overview:**
  - Recent orders (tabulka s filters)
  - Payment status (invoices, receipts, outstanding)
  - Order summary (total spend, saved time, avg material cost)
  - Quick actions (new order, re-print, bulk discount)
  - Best practice: Responsive grid, dark mode, accessibility

- **Section 3 — Order Management & Tracking:**
  - Status timeline (submitted -> slicing -> printing -> finished -> shipped)
  - Real-time status updates (WebSocket opcne via Supabase Realtime)
  - Estimated print time, actual time comparison
  - Cost breakdown (material, labor, markup)
  - File download, reprint button
  - Best practice: Event-driven updates, audit trail, customer notification

- **Section 4 — 3D Model Management:**
  - Model library (upload, rename, delete, organize by folder)
  - Model preview (3D viewer, stats, geometry analysis)
  - Versioning (keep history, diff previous versions)
  - Sharing (generate public link s expiration)
  - Best practice: Cloud storage (R2), virus scanning, compression

- **Section 5 — Presets & Saved Configurations:**
  - Save custom print configs (material, infill, support, scaling)
  - Quick-apply to models
  - Share with team (company-scoped)
  - Templates (standard, fast, eco, high-detail)
  - Best practice: JSON storage, schema validation, UI preview

- **Section 6 — Profile & Account Management:**
  - Personal info (name, email, avatar)
  - Company info (name, address, tax ID, industry)
  - Billing address, default payment method
  - Notification preferences (email, SMS, in-app)
  - Password change, 2FA opcne
  - Best practice: Audit trail, data encryption, GDPR compliance

- **Section 7 — Communication & Notifications:**
  - Email notifications (order status, invoice, special offers)
  - In-app notifications (bell icon, notification center)
  - Message center (support tickets, announcements)
  - Unsubscribe management (per-channel)
  - Best practice: Queue-based (email service), event triggers, rate limits

- **Feature Prioritization Matrix:**
  - P0 (MVP): Auth, Dashboard, Orders, Profile
  - P1 (First update): Models, Tracking, Notifications
  - P2 (Next): Presets, Sharing, Analytics

- **Integration Points:**
  - Pricing engine (display predicted costs)
  - 3D viewer (embed)
  - Shopify cart (sync cart link, analytics)
  - Email service (Resend)
  - Payment processor (Stripe)

---

### 2. `docs/claude/Documentation/Customer-Portal-Research-Part2-Competitors.md`

**Typ:** Novy soubor
**Radky:** 1-1123
**Duvod:** Analyza konkurencnich platformy pro inspiraci a best-practice extraction

**Obsah:**

- **Metadata:** Datum, author (agent), scope, methodology
- **Executive Summary:** 8 platform, 15 learning points, competitive advantages for ModelPricer
- **Platform 1 — Shapeways.com**
  - Auth: Email, Google, PayPal
  - Dashboard: Featured prints, recent orders, orders status
  - Order tracking: Real-time status (10 stupnu), ETA, cost breakdown
  - Models: Browse marketplace, upload custom, versioning
  - Communication: Email notifications, support portal
  - Unique: Marketplace for 3D designs, royalty system
  - Learning: Community-driven model sharing is engagement driver

- **Platform 2 — Sculpteo.com**
  - Auth: Email, Google, LinkedIn
  - Dashboard: Sample materials, cost calculator preview
  - Order tracking: Timeline, file download, tracking number
  - Models: Upload, 3D preview, material simulace
  - Communication: Live chat, email, SMS notifications
  - Unique: Material simulator (shows final result)
  - Learning: Material visualization is critical for customer confidence

- **Platform 3 — Xometry.com**
  - Auth: Email (enterprise SSO opcne)
  - Dashboard: Project library, RFQ status, pricing comparison
  - Order tracking: RFQ process (quote -> approve -> produce), very detailed
  - Models: CAD file management, version control, access control per team member
  - Communication: Message center, project collaboration
  - Unique: B2B focus, RFQ workflow, project-based pricing
  - Learning: B2B customers care about collaboration, not just tracking

- **Platform 4 — Protolabs.com**
  - Auth: Enterprise (SSO, SAML)
  - Dashboard: Order summary, benchmarking (your costs vs average), payment terms
  - Order tracking: Detailed timeline, production photos
  - Models: Design hub, comparison tool
  - Communication: Email alerts, API for integrations
  - Unique: Benchmarking (competitive tool), design feedback
  - Learning: Benchmarking creates engagement (vs competition)

- **Platform 5 — Hubs (3D Printing Cloud)**
  - Auth: Email, Google, GitHub
  - Dashboard: Recent prints, queue status, lab overview
  - Order tracking: Real-time (WebSocket updates), camera feed opcne
  - Models: Library, batch operations, admin controls
  - Communication: In-app notifications, email
  - Unique: Real-time monitoring (can watch print live), lab management
  - Learning: Real-time feedback is wow factor, but infrastructure-heavy

- **Platform 6 — Amazon 3D Printing**
  - Auth: Amazon account
  - Dashboard: Orders, prints, digital library
  - Order tracking: Minimal (just status + ship date)
  - Models: Store, purchase
  - Communication: Email notifications
  - Unique: Integrated with Amazon ecosystem, marketplace focus
  - Learning: Integration with larger platform increases visibility

- **Platform 7 — Shopify (as archetype e-commerce)**
  - Auth: Shopify accounts + social
  - Dashboard: Orders, analytics, account settings
  - Order tracking: Timeline, tracking number, returns
  - Models: Product variants, customization options
  - Communication: Order email, notifications, marketing
  - Unique: Flexible, extensible, app ecosystem
  - Learning: WYSIWYG customization, app marketplace drives adoption

- **Platform 8 — Etsy (Inspiration for Creator Economy)**
  - Auth: Email, social
  - Dashboard: Shop dashboard, recent sales, shop settings
  - Order tracking: Simple but effective (order date, status, tracking)
  - Models: Product listings, SEO-friendly, ratings/reviews
  - Communication: Messages, shop updates, notifications
  - Unique: Reviews + seller reputation, creator tools
  - Learning: User-generated content (reviews) is critical trust builder

- **Competitive Advantage for ModelPricer:**
  - Real-time cost tracking (show actual costs vs estimated)
  - Material savings suggestions (if user re-orders similar model)
  - Sustainability metrics (carbon footprint, material waste)
  - API for integrations (Shopify, ERP systems)
  - Bulk ordering workflow (team members can order under company account)

---

### 3. `docs/claude/Documentation/Customer-Portal-Research-Part3-Technical.md`

**Typ:** Novy soubor
**Radky:** 1-1850+
**Duvod:** Technicke architekturni rozhodnuti pro implementation

**Obsah:**

- **Metadata:** Datum, author (agent), technical scope, version
- **Executive Summary:** Architecture decisions (REST API, Supabase RLS, JWT, Stripe webhooks, email queue, Sentry monitoring)
- **Section 1 — API Design:**
  - Option 1: REST (simple, widely supported) — RECOMMENDED
  - Option 2: GraphQL (complex, but powerful for data fetching)
  - Decision: REST with Hypermedia links (HAL, JSON:API) for discoverability
  - Endpoints structure:
    ```
    GET    /api/v2/customer/me (current user profile)
    GET    /api/v2/customer/orders (list user's orders)
    GET    /api/v2/customer/orders/:id (order detail)
    GET    /api/v2/customer/orders/:id/tracking (status + events)
    POST   /api/v2/customer/orders (create new order)
    PATCH  /api/v2/customer/orders/:id (edit draft order)
    GET    /api/v2/customer/models (user's uploaded models)
    POST   /api/v2/customer/models (upload model)
    GET    /api/v2/customer/presets (saved configurations)
    POST   /api/v2/customer/presets (save new preset)
    ```
  - Rate limiting: 100 req/min per user, burst allowed
  - Versioning: X-API-Version header (default v2)

- **Section 2 — Authentication & Authorization:**
  - JWT tokens (Firebase + Supabase bridge)
  - Tenant isolation via `tenantId` claim
  - Role-based access:
    - `customer` — own data only
    - `customer_admin` — company data
    - `support` — all customers (read-only)
  - RLS policies:
    ```sql
    -- orders table
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "customers_can_view_own_orders" ON orders
      FOR SELECT USING (auth.uid()::text = customer_id);

    -- models table
    CREATE POLICY "customers_can_manage_own_models" ON models
      FOR ALL USING (auth.uid()::text = owner_id);
    ```
  - Refresh token rotation (7 days)

- **Section 3 — Data Storage & Supabase:**
  - Key tables:
    - `customers` (id, email, company_id, created_at, updated_at)
    - `customer_profiles` (customer_id, first_name, last_name, avatar_url, preferences)
    - `customer_orders` (id, customer_id, status, total_price, created_at, shipped_at, tracking_number)
    - `customer_models` (id, customer_id, filename, file_path_r2, created_at, updated_at)
    - `customer_presets` (id, customer_id, config_json, created_at)
    - `notifications` (id, customer_id, type, message, read_at, created_at)
  - Storage (R2):
    - `customer-models/` — uploaded 3D files
    - `customer-invoices/` — PDF invoices
  - RLS: All tables must have per-customer filters

- **Section 4 — Security:**
  - XSS Prevention: Sanitize all user input (DOMPurify for HTML)
  - CSRF: SameSite cookies, double-submit token pattern
  - Rate limiting: Redis-based (100 req/min per IP)
  - Data encryption: PII fields encrypted at rest (customer name, email)
  - HTTPS only: Strict-Transport-Security header
  - CORS: Allow only app.modelpricerio.com domain
  - Secrets management: .env file (Firebase, Stripe, Resend API keys)

- **Section 5 — Order Tracking & Real-Time Updates:**
  - Option 1: Polling (simpler, less overhead)
  - Option 2: WebSocket via Supabase Realtime (better UX)
  - Decision: Polling (short-term), WebSocket (roadmap for PHASE-3)
  - Polling interval: 30s (configurable)
  - Events: order.status_changed, order.shipped, order.delivered
  - Notification channels:
    - Email (Resend)
    - In-app (localStorage, then Supabase notifications table)
    - SMS (optional, future)

- **Section 6 — Email Service:**
  - Provider: Resend (transactional emails)
  - Triggers:
    - Order confirmation (immediately)
    - Order status change (queued, printing, shipped, delivered)
    - Invoice ready (24h after delivery)
    - Support ticket reply (immediately)
  - Template engine: Handlebars or Jinja2
  - Queue: Redis-based (SQS alternative)

- **Section 7 — Payment Processing:**
  - Provider: Stripe
  - Webhook verification: HMAC-SHA256
  - Key events:
    - charge.succeeded — update order status
    - charge.failed — notify customer, retry
    - invoice.created — send to customer email
  - Idempotency: Request deduplication by idempotency_key
  - PCI compliance: No sensitive data in DB (use Stripe tokens)

- **Section 8 — Performance & Caching:**
  - Frontend:
    - Cache API responses (5 min for orders, 1 hour for models)
    - Lazy load models list (pagination, 20 per page)
    - Image optimization (WebP, responsive sizes)
  - Backend:
    - Redis cache for frequently accessed data (tenant config, pricing rules)
    - Database indexes on (customer_id, created_at) for orders
    - Connection pooling (10 connections per tenant)
  - CDN: CloudFlare for static assets

- **Section 9 — Monitoring & Observability:**
  - Error tracking: Sentry (already integrated in MEMORY.md)
  - Logging: Structured logging (JSON format, searchable)
  - Metrics:
    - Active users (daily, weekly, monthly)
    - Order completion rate
    - API latency (p50, p95, p99)
    - Error rate (4xx, 5xx)
  - Alerting: Slack webhook for critical errors

- **Section 10 — Deployment & Scaling:**
  - Containerization: Docker (Dockerfile in backend-local/)
  - Deployment platform: Google Cloud Run (recommended, per MEMORY.md)
  - Database: Supabase managed (automatic backups, scaling)
  - Storage: Cloudflare R2 (already set up)
  - CI/CD: GitHub Actions (build + test + deploy)
  - Horizontal scaling: Stateless API servers, shared Redis/Supabase

- **Decision Summary Table:**
  | Component | Decision | Rationale |
  |-----------|----------|-----------|
  | API Style | REST | Simplicity, existing skill set |
  | Auth | JWT + Firebase bridge | Already implemented |
  | Database | Supabase + RLS | Tenant isolation, audit trail |
  | Storage | Cloudflare R2 | Performance, cost-effective |
  | Email | Resend | Low setup, transactional focus |
  | Payments | Stripe | Full-featured, PCI compliance |
  | Monitoring | Sentry + structured logging | Error tracking, debugging |
  | Deployment | Google Cloud Run | Serverless, auto-scaling |
  | Caching | Redis + CDN | Performance, reduced DB load |
  | Real-time | Polling (now), WebSocket (future) | MVP focus, scalable upgrade path |

---

## Dopad zmen

- **Ovlivnene komponenty:** N/A (pouze dokumentace, zatim zadne kod)
- **Breaking changes:** Ne
- **Nove zavislosti:** Ne (je to research, zadne npm balicky)
- **Rizika:**
  - Dokumenty mohou obsahovat zastarale reference (sync s realnym kodem v implementaci)
  - Arch decisions se mohou zmenit pri implementaci na zaklade nalezenych problemu

---

## Testovani

- **Build:** N/A (markdownonly)
- **Manual test:** Dokumenty procitany, formaty zkontrolovany (markdown, tabulky, code blocks)
- **Poznamky:**
  - 3 dokumenty jsou 4301+ radku dohromady
  - Ready pro kickoff implementacnich planu (CP-PHASE-1 az PHASE-4)
  - Pokud uzivatel potrebuje detaly, jsou dokumenty dostupny pro Q&A

---

<!-- KONEC SABLONY -->
