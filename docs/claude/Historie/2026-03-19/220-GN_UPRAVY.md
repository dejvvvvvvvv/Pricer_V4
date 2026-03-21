# 220-GN — UPRAVY — Stripe Payment Integration — 2026-03-19

## Metadata
- **ID:** 220-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General (Stripe — frontend + backend)
- **Souvisejici ID:** 217-GN (Master plan — cast D: Stripe), 218-BK (Vlna 3 backend), 219-GN (Vlna 4 Sentry)
- **Trigger:** Vlna 4 implementace BETA infrastruktury — Stripe platebni integrace

---

## Souhrn uprav

Implementace Stripe platebni integrace pro frontend i backend. Backend obsahuje service pro Checkout Session, webhook handling s HMAC verifikaci a raw body parserem. Frontend obsahuje klienta pro vytvareni platebni session, redirect na Stripe Checkout a URL validaci (stripe.com domain). 4 backend endpointy: /status, /create-checkout, /webhook, /session/:id.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | backend-local/src/services/stripeService.js | Novy soubor | cele | Backend Stripe service: createCheckoutSession(), constructWebhookEvent(), processWebhookEvent() |
| 2 | backend-local/src/routes/stripeRoutes.js | Novy soubor | cele | 4 endpointy: /status, /create-checkout, /webhook (raw body!), /session/:id |
| 3 | src/lib/stripe/stripeClient.js | Novy soubor | cele | Frontend: createPaymentSession(), redirectToCheckout(), verifyPaymentSession(), buildCheckoutUrls() |
| 4 | backend-local/.env.example | Zmeneno | — | Pridany STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PUBLIC_KEY |
| 5 | .env.example | Zmeneno | — | Pridano VITE_STRIPE_PUBLIC_KEY |

---

## Detailni zmeny

### 1. `backend-local/src/services/stripeService.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Centralizovany Stripe service pro backend — vytvareni sessions, webhook zpracovani

**Co se zmenilo:**
- Funkce `createCheckoutSession()` — vytvori Stripe Checkout Session s line items, success/cancel URL
- Funkce `constructWebhookEvent()` — overi webhook podpis (HMAC) z raw body
- Funkce `getCheckoutSession()` — nacte session pro verifikaci platby
- Funkce `processWebhookEvent()` — zpracuje eventy (checkout.session.completed, payment_intent.succeeded, atd.)
- Dynamicky import `stripe` balicku — graceful fallback bez balicku

---

### 2. `backend-local/src/routes/stripeRoutes.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Express router pro Stripe API endpointy

**Co se zmenilo:**
- `GET /status` — kontrola zda je Stripe nakonfigurovany
- `POST /create-checkout` — vytvoreni platebni session (autentizovany endpoint)
- `POST /webhook` — prijem webhook eventu (raw body parser! — DULEZITE pro HMAC verifikaci)
- `GET /session/:id` — dotaz na stav platby
- Komentar s mounting instrukcemi pro integraci do hlavniho Express serveru

```js
// DULEZITY ARCHITEKTURNI DETAIL — webhook MUSI pouzit raw body:
// app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
// Ostatni endpointy pouzivaji standardni express.json()
```

---

### 3. `src/lib/stripe/stripeClient.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Frontend klient pro Stripe — vytvareni session, redirect, verifikace

**Co se zmenilo:**
- Funkce `createPaymentSession()` — posle request na backend /create-checkout
- Funkce `redirectToCheckout()` — redirect na Stripe Checkout s URL validaci (`stripe.com` domain)
- Funkce `verifyPaymentSession()` — overi vysledek platby po redirectu zpet
- Funkce `buildCheckoutUrls()` — sestavi success/cancel URL z aktualniho originu
- Bezpecnostni URL validace — redirect JEN na `stripe.com` domenu

---

### 4. `backend-local/.env.example`

**Typ:** Zmeneno
**Radky:** —
**Duvod:** Dokumentace novych Stripe env promennych

**Co se zmenilo:**
- Pridany 3 promenne: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLIC_KEY`

---

### 5. `.env.example` (root)

**Typ:** Zmeneno
**Radky:** —
**Duvod:** Frontend env promenna pro Stripe public key

**Co se zmenilo:**
- Pridano `VITE_STRIPE_PUBLIC_KEY` pro frontend Stripe.js inicializaci

---

## Dopad zmen

- **Ovlivnene komponenty:** Checkout flow v kalkulacce, AdminPayments (budouci propojeni)
- **Breaking changes:** Ne — Stripe je volitelny, vsechny funkce maji graceful fallback
- **Nove zavislosti:** `stripe` (backend), `@stripe/stripe-js` (frontend, optional) — CEKAJI na npm install
- **Rizika:** Webhook endpoint vyzaduje raw body parser — musi byt mountovan PRED express.json() middleware. URL validace stripe.com zabranuje redirect hijackingu.

---

## Testovani

- **Build:** Neovereno (ceka na npm install novych balicku)
- **Manual test:** Zadny — infrastrukturni zmena, ceka na Stripe API klice a balicky
- **Poznamky:** Pro testovani je nutne nastavit Stripe test API klice v .env a pouzit Stripe CLI pro lokalni webhook forwarding (`stripe listen --forward-to localhost:3001/api/stripe/webhook`)

---
