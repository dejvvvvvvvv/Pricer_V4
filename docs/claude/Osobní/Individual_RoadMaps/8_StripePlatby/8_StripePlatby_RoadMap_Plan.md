# 8. Stripe platebni integrace — Detailni RoadMap Plan

> **Stav:** 🔴 0% hotovo | **Priorita:** VYSOKA
> **Zavislosti na jine sekce:** Auth (#20), Backend/Cloud Functions (#26), Supabase (#27)
> **Kdo na nem zavisi:** Orders (#7), Checkout (#1.6), Fakturace (#9), Ucet (#25)
> **Doporuceny pristup:** DIY s `stripe` npm (Payment Intents) + `resend` npm (emaily)

---

## Prehled

Platebni integrace pomoci Stripe Payment Intents. Pouzijeme Payment Intents (NE Checkout Sessions) protoze ceny se pocitaji dynamicky z pricing enginu — nemame fixni produktovy katalog.

**Technologicke rozhodnuti (z researche):**
- ❌ Medusa.js, Vendure, EverShop — OVERKILL (vlastni DB, neni pro dynamicke ceny)
- ✅ DIY: `stripe` npm + Payment Intents + webhooky
- Webhook handler: Cloud Functions NEBO Supabase Edge Functions
- CZK podpora: ano (castky v halerech, napr. 52500 = 525.00 Kc)

**Potrebne npm balicky:**
- Backend: `stripe` (server-side SDK)
- Frontend: `@stripe/stripe-js` + `@stripe/react-stripe-js` (Stripe Elements)
- Volitelne: `stripe-sync-engine` (auto-sync Stripe dat do PostgreSQL)

---

## Co je HOTOVO (✅)

Nic. Tato sekce je kompletne nova.

---

## Co CHYBI / je potreba dodelat

### Faze 1: Stripe Connect — Admin konfigurace (Priorita: VYSOKA)

#### Ukol 1.1: Admin UI pro Stripe nastaveni
- **Soubor:** `src/pages/admin/AdminIntegrations.jsx` (rozsireni) nebo nova sekce
- **Co udelat:**
  - [ ] Sekce "Platby" v Admin Integrations
  - [ ] Input pro Stripe Publishable Key (verejny klic)
  - [ ] Input pro Stripe Secret Key (tajny klic — pozor na bezpecnost!)
  - [ ] Testovaci rezim toggle (pouzit test klice)
  - [ ] Status indikator — propojeno/nepropojeno
  - [ ] Overeni ze klice fungujou (backend endpoint: `POST /api/stripe/verify`)
- **BEZPECNOSTNI POZOR:** Secret Key NESMI byt v localStorage! Musi byt ulozeny bezpecne — idealne v Supabase (encrypted) nebo env variable na backendu.
- **? OTAZKA:** Ukladat Stripe klice do Supabase (per-tenant) nebo do env variables backendu?
  - Per-tenant (Supabase): Flexibilni, kazda firma ma svuj Stripe ucet
  - Env variables: Jednodussi, ale jen jeden Stripe ucet pro vsechny
  - **Doporuceni:** Per-tenant do Supabase s encryptci pro multi-tenant SaaS

#### Ukol 1.2: Stripe Connect OAuth flow (volitelne, pro budoucnost)
- **Co udelat:**
  - [ ] Stripe Connect OAuth pro propojeni existujiciho Stripe uctu firmy
  - [ ] Redirectni flow: admin → Stripe → zpet s access_token
  - [ ] Ulozeni connected_account_id
- **Poznamka:** Pro MVP/Beta staci manualni zadani API klicu. OAuth je "nice to have".

### Faze 2: Payment Intent — Backend (Priorita: VYSOKA)

#### Ukol 2.1: Instalace a setup
- **Co udelat:**
  - [ ] `npm install stripe` na backendu (Cloud Functions)
  - [ ] Inicializace Stripe klienta:
    ```javascript
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // NEBO per-tenant:
    const stripe = require('stripe')(tenantStripeKey);
    ```

#### Ukol 2.2: Create Payment Intent endpoint
- **Soubor:** `backend-local/routes/payments.js` (NOVY)
- **Endpoint:** `POST /api/payments/create-intent`
- **Co udelat:**
  - [ ] Prijmout data z frontendu: `{ orderId, items, shippingMethod, expressTier, coupon }`
  - [ ] **PREPOCITAT CENU NA BACKENDU** — nikdy neverit frontendu!
  - [ ] Vytvorit Payment Intent:
    ```javascript
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalInMinorUnits, // napr. 52500 pro 525.00 Kc
      currency: 'czk', // nebo 'eur', 'usd'
      metadata: {
        order_id: orderId,
        tenant_id: tenantId,
        model_count: items.length
      },
      // Pro Stripe Connect (per-tenant):
      // stripeAccount: connectedAccountId
    });
    ```
  - [ ] Vrati `{ clientSecret: paymentIntent.client_secret }`
  - [ ] Ulozit `paymentIntent.id` do objednavky v Supabase

#### Ukol 2.3: CZK specifika
- **Co udelat:**
  - [ ] CZK: castky v halerech (1 Kc = 100 haleru)
  - [ ] EUR: castky v centech
  - [ ] USD: castky v centech
  - [ ] Konverzni funkce: `toCurrencyMinorUnits(amount, currency)`
  - [ ] Minimalni castka pro Stripe: 15 Kc (CZK), 0.50 EUR/USD
  - [ ] Zaokrouhleni — zadne floating point problemy

### Faze 3: Stripe Elements — Frontend (Priorita: VYSOKA)

#### Ukol 3.1: Instalace a setup
- **Co udelat:**
  - [ ] `npm install @stripe/stripe-js @stripe/react-stripe-js`
  - [ ] Inicializace Stripe na frontendu:
    ```javascript
    import { loadStripe } from '@stripe/stripe-js';
    const stripePromise = loadStripe(publishableKey);
    ```

#### Ukol 3.2: Platebni formular v checkoutu
- **Soubor:** `src/pages/test-kalkulacka/components/StripePaymentForm.jsx` (NOVY)
- **Co udelat:**
  - [ ] Wrapper: `<Elements stripe={stripePromise} options={{ clientSecret }}>`
  - [ ] `<PaymentElement />` — univerzalni platebni formular (karta, Apple Pay, Google Pay)
  - [ ] Submit handler:
    ```javascript
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation/${orderId}`
      }
    });
    ```
  - [ ] Loading state pri zpracovani platby
  - [ ] Error handling — zobrazeni chybove zpravy od Stripe
  - [ ] Uspesna platba → redirect na potvrzeni

#### Ukol 3.3: Integrace do checkout flow
- **Soubor:** `src/pages/test-kalkulacka/index.jsx` (Step 4)
- **Co udelat:**
  - [ ] Pokud zakaznik zvoli "Platba kartou":
    1. Frontend zavola `POST /api/payments/create-intent`
    2. Dostane `clientSecret`
    3. Zobrazi Stripe Elements s platebnim formularem
    4. Zakaznik vyplni kartu a potvrdi
    5. Stripe zpracuje platbu
    6. Redirect na potvrzeni
  - [ ] Pokud "Bankovni prevod" — bez Stripe, zobrazit fakturacni udaje
  - [ ] Pokud "Dobirka" — bez Stripe, vytvorit objednavku

### Faze 4: Webhook handler (Priorita: VYSOKA)

#### Ukol 4.1: Webhook endpoint
- **Varianta A — Cloud Functions:**
  ```javascript
  // functions/stripeWebhook.js
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
    }
    res.json({ received: true });
  });
  ```
- **Varianta B — Supabase Edge Function (Deno):**
  ```typescript
  // supabase/functions/stripe-webhook/index.ts
  import Stripe from 'https://esm.sh/stripe';
  ```
- **? OTAZKA:** Cloud Functions nebo Supabase Edge Functions? Doporucuji Cloud Functions (lepsi integrace s Firebase).

#### Ukol 4.2: Zpracovani udalosti
- **Co udelat:**
  - [ ] `payment_intent.succeeded`:
    - Update order status v Supabase: `pending` → `confirmed`
    - Ulozit `payment_id` a `amount_paid` do order
    - Trigger email "Objednavka potvrzena" pres Resend (#22)
  - [ ] `payment_intent.payment_failed`:
    - Update order status: → `payment_failed`
    - Trigger email "Platba selhala"
  - [ ] `charge.refunded`:
    - Update order status: → `refunded`
    - Trigger email "Penize vraceny"

#### Ukol 4.3: Webhook security
- **Co udelat:**
  - [ ] `STRIPE_WEBHOOK_SECRET` env variable (NE v kodu!)
  - [ ] Signature overeni (constructEvent)
  - [ ] Idempotence — kontrola ze udalost nebyla zpracovana 2x
  - [ ] Retry handling — Stripe posila opakovanĕ pokud webhook selze

### Faze 5: Testovani (Priorita: VYSOKA)

#### Ukol 5.1: Testovaci rezim
- **Co udelat:**
  - [ ] Pouzit Stripe testovaci klice (prefix `sk_test_`, `pk_test_`)
  - [ ] Testovaci karta: `4242 4242 4242 4242` (uspesna platba)
  - [ ] Testovaci karta pro selhani: `4000 0000 0000 0002`
  - [ ] Stripe CLI pro lokalni webhook testovani: `stripe listen --forward-to localhost:3001/api/stripe/webhook`
  - [ ] Scenare:
    - [ ] Uspesna platba → order confirmed
    - [ ] Selhala platba → error message
    - [ ] Refund → order refunded
    - [ ] 3D Secure karta → dalsi autorizace
    - [ ] CZK castky → spravne v halerech

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 1: Admin konfigurace | 3-5h | Auth (#20) | VYSOKA |
| 2 | Faze 2: Payment Intent backend | 4-6h | Cloud Functions (#26) | VYSOKA |
| 3 | Faze 3: Stripe Elements frontend | 4-6h | Faze 2 | VYSOKA |
| 4 | Faze 4: Webhook handler | 4-6h | Faze 2, Emaily (#22) | VYSOKA |
| 5 | Faze 5: Testovani | 3-4h | Faze 1-4 | VYSOKA |

**Celkem:** ~18-27 hodin (2-3 tydny realisticky)

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Stripe Secret Key leak | Nizka | Kriticky | Env variables, nikdy v kodu/localStorage |
| CZK zaokrouhleni chyby | Stredni | Stredni | Integer aritmetika (halere) |
| Webhook missing/delayed | Nizka | Vysoky | Idempotence, retry, fallback polling |
| 3D Secure preruseni | Stredni | Stredni | PaymentElement handling |

---

## Soubory ke zmene/vytvorit

| Soubor | Typ | Rozsah |
|--------|-----|--------|
| `src/pages/admin/AdminIntegrations.jsx` | Rozsireni — Stripe sekce | Stredni |
| `src/pages/test-kalkulacka/components/StripePaymentForm.jsx` | NOVY | Stredni |
| `backend-local/routes/payments.js` | NOVY | Velky |
| `functions/stripeWebhook.js` (Cloud Functions) | NOVY | Stredni |
| `package.json` (frontend) | @stripe/stripe-js, @stripe/react-stripe-js | Maly |
| `package.json` (backend) | stripe | Maly |

---

## Kriticke doplnky (z review)

### Idempotence a race conditions
- [ ] Deduplikace — `idempotencyKey` na Payment Intent create (zabranit dvojitemu vytvoreni)
- [ ] Lock mechanismus — zakaznik klikne "Zaplatit" 2x → druhy klik ignorovat
- [ ] Optimistic locking na objednavce — nelze platit za jiz zplacenou objednavku

### Error recovery
- [ ] Expirovaný Payment Intent → vytvorit novy (Stripe PI expiruje po 24h)
- [ ] Neuspesna 3D Secure → informovat zakaznika a nabidnout jinou kartu
- [ ] Network error pri platbe → zachovat stav a nabidnout retry
- [ ] Stripe je offline → fallback na bank transfer (zobrazit fakturacni udaje)

### Compliance a regulace
- [ ] PSD2/SCA compliance — Payment Element to resi automaticky
- [ ] GDPR — Stripe zpracovava karty, my nevidime cisla karet
- [ ] Stripe Radar — automaticka detekce podvodu (vcetne v test mode)
- [ ] Receipt email od Stripe (konfigurovatelne)

### Meny a lokalizace
- [ ] CZK jako default pro CZ firmy
- [ ] EUR pro SK/EU firmy
- [ ] Stripe Payment Element automaticky lokalizuje UI dle jazyka prohlizece
- [ ] `locale: 'cs'` pro cesky Payment Element

---

## Poznamky

- **KRITICKE:** Cena MUSI byt prepocitana na backendu — frontend muze byt manipulovan
- **KRITICKE:** Stripe Secret Key NIKDY v localStorage ani v frontendu
- **TIP:** Stripe testovaci rezim je zdarma — pouzivat od zacatku
- **TIP:** `stripe listen` CLI nastroj pro lokalni webhook testovani
- **TIP:** Payment Intents podporuji CZK primo — neni nutna konverze
- **? OTAZKA:** Stripe Connect (per-tenant Stripe ucet) vs jednoduchy Stripe (jeden ucet pro celou platformu)?
  - Pro MVP: jednoduchy Stripe s per-tenant klici v Supabase
  - Pro budoucnost: Stripe Connect s OAuth
- **? OTAZKA:** Jak resit refundy? Rucne pres Stripe dashboard nebo automaticky z admin panelu?
- **? OTAZKA:** Stripe subscription pro plan firmy vs. one-time Payment Intent pro objednavky zakazniku — to jsou DVA oddelene Stripe pouziti!
