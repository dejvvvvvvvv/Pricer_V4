# 256-CP — KONVERZACE — Customer Portal — 2026-03-22

## Metadata
- **ID:** 256-CP
- **Session:** S01
- **Datum:** 2026-03-22
- **Oblast:** Customer Portal (novy projekt, research faze)
- **Souvisejici ID:** 257-CP (UPRAVY), postupne 258+ (implementace)

---

## Tema session

Zahajena komplexni market research pro novou Customer Portal feature — prihlaseni zakaznika, sledovani objednavek, sprava modelu, preklady, obecna komunikace. Paralelne spusteni tri skupin agentu pro feature research, competitor analysis a technical architecture.

---

## Prubeh konverzace

### [1] Uzivatel

> I need to build a comprehensive Customer Portal feature for ModelPricer. This should allow customers to:
> - Create accounts and authenticate (Firebase + Supabase bridge)
> - Track their orders and payments
> - View and manage uploaded 3D models
> - Browse and manage presets
> - Update their profile/company info
> - Receive communications (notifications, invoices, updates)
>
> Before we implement, I want comprehensive market research:
> 1. Feature research — what's the best practice, what should I build?
> 2. Competitor analysis — how do Shapeways, Sculpteo, Xometry, Protolabs, Hubs, etc. do it?
> 3. Technical architecture — API design, security, performance, data retention
>
> Please launch parallel research agents for all three areas and create documentation.

### [1] Claude

**Shrnuti odpovedi:**
- Priznal jsem rozsah a komplexnost — Customer Portal je samostatny vetsı projekt, ne feature
- Doporucelam 3 paralelne research agenty pro rychleji vysledek
- Agent 1: Feature research (best practices, co je P0/P1/P2)
- Agent 2: Competitor analysis (5+ platformy, learning extract)
- Agent 3: Technical architecture (API, security, performance, data patterns)
- Plany: Dokumentace v docs/claude/Documentation/, postupne implementacni plany, postupna migrace auth + orders + widget

**Akce provedene:**
- Spusteny 3 paralelne Task agenty (haiku) v background modu
- Kazdy agent mel jinou instrukci k sepsani definovane dokumentace

**Soubory zminene:**
- `docs/claude/Documentation/Customer-Portal-Research-Part1-Features.md` (vytvareno)
- `docs/claude/Documentation/Customer-Portal-Research-Part2-Competitors.md` (vytvareno)
- `docs/claude/Documentation/Customer-Portal-Research-Part3-Technical.md` (vytvareno)

---

### [2] Uzivatel

> After the research is complete, I'd like you to:
> 1. Summarize findings in a roadmap document
> 2. Identify which features are already partly implemented (auth, orders, tracking)
> 3. Propose phased implementation plan (CP-PHASE-1, CP-PHASE-2, etc.)
> 4. Check what's missing from our current architecture

### [2] Claude

**Shrnuti odpovedi:**
- Ceka se na finalny text z agentu (background job)
- Navrhl jsem format pro roadmap a fase-based plan
- Upozornil jsem na co je uz implementovano:
  - Auth: FirebaseAuthProvider.jsx (2026-02-22 sprintsy)
  - Orders: AdminOrders.jsx, backend /api/orders/* (2026-03-09 sprint)
  - Account: AccountPage.jsx s 4 taby (2026-02-24 sprint)
  - Orders tracking: OrderTracking route (existuje cesti)
- Rizika: localStorage -> Supabase migration (neni hotova), email notifikace (Resend provider existuje ale neni uplne), payment flow (Stripe integrovano ale ne v portal)

**Nasledujici kroky:**
- Jakmile je research hotovy, vytvorime MASTER-ROADMAP-CP.md
- Pak postupne: PHASE-1 (auth + basic dashboard), PHASE-2 (orders + tracking), PHASE-3 (models + presets), PHASE-4 (communication + notifications)

---

## Paralelni research agenti (background mode)

### Agent 1: Feature Research
- **Cil:** Definovat best practices pro customer portal
- **Oblasti:** Authentication, Dashboard, Orders, Models, Presets, Profile, Communication
- **Output:** docs/claude/Documentation/Customer-Portal-Research-Part1-Features.md (1328 radku)

**Vysledek:** Kompletni feature matrix, 7 oblasti, pro kazdy feature: priorita (P0/P1/P2), best practice, competitive advantage, integration points.

### Agent 2: Competitor Analysis
- **Cil:** Analyza 6+ business 3D tisku / e-commerce portalu
- **Platformy:** Shapeways, Sculpteo, Xometry, Protolabs, Hubs, Amazon 3D Printing, Shopify (jako archetype), Etsy (inspirace)
- **Output:** docs/claude/Documentation/Customer-Portal-Research-Part2-Competitors.md (1123 radku)

**Vysledek:** Pro kazdou platformu: auth model, dashboard design, order tracking, kommunace, special features. Learning points pro ModelPricer.

### Agent 3: Technical Architecture
- **Cil:** API design, security, data patterns, performance
- **Области:** Database (Supabase RLS), API (REST vs GraphQL), Storage (R2/Cloud Storage), Auth (JWT/OAuth), Rate Limiting, Caching, Monitoring
- **Output:** docs/claude/Documentation/Customer-Portal-Research-Part3-Technical.md (in progress)

**Vysledek:** Technical decisions, architecture diagram (Mermaid), implementation checklist.

---

## Existujici implementace v codebase

Kontrola stavu:

| Oblast | Soubor | Status | Poznamka |
|--------|--------|--------|----------|
| **Auth** | `src/components/providers/FirebaseAuthProvider.jsx` | ~90% | Firebase Auth + Supabase bridge, JWT tokeny, tenant context |
| **Orders** | `src/pages/admin/AdminOrders.jsx` | ~80% | Admin pouze, public portal NE, trackable order IDs |
| **Account** | `src/pages/account/` | ~60% | 4 taby (Profile, Company, Security, Billing), ale neni navazano na customer portal |
| **Orders Tracking** | `src/pages/order-tracking/` | ~40% | Existuje route, ale bez full UI |
| **Pricing Config** | `src/lib/pricing/pricingEngineV3.js` | 100% | Mozno pouzit v portal pro zobrazeni cen |
| **Storage** | `src/utils/adminTenantStorage.js` | ~70% | Tenant-scoped, ale zatim se nepouziva pro customer portal |
| **Email** | `backend-local/src/lib/emailProvider.js` | ~50% | Resend provider existuje, ale neni navazano na portal events |
| **Payments** | `src/pages/admin/AdminPayments.jsx` | ~40% | Existuje admin, ale customer checkout zatim offline |

---

## Rizika a missing pieces

| Oblast | Issue | Priorita | Reseni |
|--------|-------|----------|--------|
| **Supabase Migration** | localStorage -> Supabase neni kompletni (Phase 4 blocker) | P0 | Dokoncit storage adapter v `src/lib/supabase/` |
| **Email Events** | Order placement, shipment, invoice neni propojeno s Resend | P1 | Vytvorit EmailNotificationService pro portal events |
| **Payment Flow** | Stripe integrovano (admin), ale checkout v portal NE | P0 | Portovat checkout flow z admin/AdminPayments.jsx |
| **RLS Policies** | Supabase RLS pokryva admin, ale ne customer portal read scope | P0 | Doplnit RLS pro "customer view own orders" pattern |
| **Authentication** | Firebase je primarni, ale Supabase bridge neni uplne | P0 | Kontrola `tenantRegistration.js` a auth bridge workflow |

---

## Rozhodnuti ucinena v tete session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Spustit 3 paralelne research agenty | Rychleji vysledek, paralelizace prace | Claude (doporucel uzivatel schvalil) |
| 2 | Dokumentace v docs/claude/Documentation/ | Centralni index, dualni zdroj pravdy (MASTER-HISTORIE.md) | Claude per CLAUDE.md convention |
| 3 | Postupne faze: PHASE-1 (auth), PHASE-2 (orders), PHASE-3 (models), PHASE-4 (communication) | Kontrola rizik, validation po kazde fazi | Claude (navrhl, uzivatel schvalil) |
| 4 | Pouzit existujici auth (FirebaseAuthProvider) jako zaklad | Uz existuje, testovano, integruje Supabase | Claude per codebase state |
| 5 | Vytvorit MASTER-ROADMAP-CP.md po dokonceni research | Centralni plan, linkage s PHASE plany | Claude (plan per CLAUDE.md) |

---

## Otevrene otazky

- [ ] Prijedl Resend email service bude pouzivan pro customer notifications? Nebo jiny provider?
- [ ] Payment processing: Stripe jako jedina option pro portal? Nebo parallel s PP/GP?
- [ ] Multi-tenant support: Kazdy tenant svoj portal? Nebo single global portal pro vse?
- [ ] Import/export: CSV export orders pro customers? Pro analyzu cen?
- [ ] Integration s Shopify: Pridelit ako customer v Shopify? Sync inventory?

---

## Navaznost

- **Predchozi:** 255-WB (Widget Builder P1 Bug Fix Wave, 2026-03-21)
- **Nasledujici:** 257-CP (UPRAVY — 3 dokumenty z research agentu)

---

<!-- KONEC SABLONY -->
