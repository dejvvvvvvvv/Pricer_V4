# 222-GN — UPRAVY — Dokumentace + Stripe Mount + AdminPayments (Vlna 6) — 2026-03-19

## Metadata
- **ID:** 222-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General (Dokumentace + Backend + Admin Frontend + i18n)
- **Souvisejici ID:** 220-GN (Stripe backend service), 221-GN (Frontend API update), 217-GN (master plan)
- **Trigger:** BETA infrastrukturni sprint — Vlna 6: Dokumentace infrastruktury, Stripe routes mount do backendu, AdminPayments Stripe konfiguracni sekce

---

## Souhrn uprav

Tri oblasti: (1) Nova kompletni Infrastructure dokumentace (568 radku) + aktualizace 3 existujicich doku, (2) Stripe routes napojeni do backend index.js s raw body parserem pro webhook HMAC, (3) AdminPayments.jsx nova sekce Stripe Configuration se status badge, masked key a setup guide + 17 i18n klicu. Build PASS.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | docs/claude/Documentation/Infrastructure-Dokumentace.md | Novy soubor | 568 | Kompletni infra dokumentace (Cloud Run, R2, Resend, PDF, Sentry, Stripe, Docker, CI/CD) |
| 2 | docs/claude/Documentation/Storage-Utilities-Dokumentace.md | Zmeneno | nova sekce | Storage Provider System sekce (abstract base, R2 provider, factory) |
| 3 | docs/claude/Documentation/Build-Config-Dokumentace.md | Zmeneno | nova sekce | Dockerfile, CI/CD pipeline, deploy flow, firebase.json, SW cache verze |
| 4 | docs/claude/Documentation/00-MASTER-Dokumentace.md | Zmeneno | 1 radek | Odkaz na Infrastructure-Dokumentace.md v tabulce |
| 5 | backend-local/src/index.js | Zmeneno | import+mount | Import stripeRoutes, raw body parser PRED express.json(), auth middleware, router mount |
| 6 | src/pages/admin/AdminPayments.jsx | Zmeneno | nova sekce | Section 3: Stripe Configuration (status badge, masked API key, webhook URL, setup guide) |
| 7 | src/contexts/LanguageContext.jsx | Zmeneno | 17 klicu | 17 novych i18n klicu CZ+EN pro admin.payments.stripe.* |

---

## Detailni zmeny

### 1. `docs/claude/Documentation/Infrastructure-Dokumentace.md`

**Typ:** Novy soubor
**Radky:** 568
**Duvod:** Zadna dokumentace infrastruktury neexistovala — pokryva 8 novych systemu z Vln 3-4

**Co se zmenilo:**
- Kompletni dokumentace: Cloud Run deployment, Cloudflare R2 storage, Resend email, PDF fakturace, Sentry monitoring, Stripe platby
- Architektura 5 vrstev (Firebase Hosting + Cloud Functions + Cloud Run + R2 + Supabase)
- Docker multi-stage build popis
- GitHub Actions CI/CD pipeline popis
- Referencni tabulka .env promennych

---

### 2. `docs/claude/Documentation/Storage-Utilities-Dokumentace.md`

**Typ:** Zmeneno
**Duvod:** R2 storage abstrakce z Vlny 3 nebyla zdokumentovana

**Co se zmenilo:**
- Nova sekce "Storage Provider System" — abstract base class, R2 provider, filesystem provider, factory pattern
- Popis `STORAGE_PROVIDER` env promenne (r2/filesystem/auto)

---

### 3. `docs/claude/Documentation/Build-Config-Dokumentace.md`

**Typ:** Zmeneno
**Duvod:** Docker a CI/CD konfigurace z Vlny 3 nebyly zdokumentovany

**Co se zmenilo:**
- Sekce Dockerfile (multi-stage: build + production, node:20-slim)
- Sekce CI/CD pipeline (GitHub Actions: lint + test + build + deploy)
- Sekce deploy flow (Cloud Run, firebase.json hosting)
- Sekce Service Worker cache verze (dynamicky CACHE_VERSION)

---

### 4. `docs/claude/Documentation/00-MASTER-Dokumentace.md`

**Typ:** Zmeneno
**Duvod:** Novy Infrastructure doc musi byt v master rozcestniku

**Co se zmenilo:**
- Pridan radek do tabulky: Infrastructure-Dokumentace.md s popisem

---

### 5. `backend-local/src/index.js`

**Typ:** Zmeneno
**Duvod:** Stripe routes z Vlny 4 (220-GN) nebyly napojeny do Express serveru

**Co se zmenilo:**
- Import `stripeRoutes` z `./routes/stripe.js`
- Raw body parser (`express.raw({type: 'application/json'})`) PRED `express.json()` — nutne pro Stripe webhook HMAC verifikaci
- Auth middleware pro Stripe sub-paths (kromecka /webhook)
- Router mount na `/api/stripe`
- Syntax check: PASS

---

### 6. `src/pages/admin/AdminPayments.jsx`

**Typ:** Zmeneno
**Duvod:** Admin panel potrebuje vizualni Stripe konfiguracni sekci

**Co se zmenilo:**
- Nova Section 3: "Stripe Configuration"
- Status badge (connected/not configured) na zaklade pritomnosti Stripe klice v env
- Masked API key zobrazeni (sk_live_****1234)
- Webhook URL zobrazeni s copy tlacitkem
- Setup guide s kroky pro konfiguraci Stripe

---

### 7. `src/contexts/LanguageContext.jsx`

**Typ:** Zmeneno
**Duvod:** i18n klice pro novou Stripe sekci v AdminPayments

**Co se zmenilo:**
- 17 novych i18n klicu v CZ i EN pro `admin.payments.stripe.*`
- Klice: title, status, connected, notConfigured, apiKey, webhookUrl, setupGuide, step1-4, testMode, liveMode, description

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminPayments.jsx (nova sekce), backend index.js (novy route mount), LanguageContext (nove klice)
- **Breaking changes:** Ne — Stripe routes jsou aditivni, AdminPayments nova sekce je pod existujicimi
- **Nove zavislosti:** Zadne (stripe balicek uz pridan v predchozi vlne, ceka na npm install)
- **Rizika:** Stripe raw body parser musi byt PRED express.json() — poradi importu je kriticke

---

## Testovani

- **Build:** npm run build — PASS
- **Backend syntax check:** PASS
- **Manual test:** Neprovedeno (ceka na npm install stripe balicku)
- **Poznamky:** Dokumentace pokryva vsechny systemy z Vln 3-6

---
