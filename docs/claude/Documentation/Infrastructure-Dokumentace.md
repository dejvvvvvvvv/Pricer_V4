# Infrastructure -- Dokumentace

> Kompletni dokumentace infrastruktury projektu ModelPricer / Pricer V3.
> Pokryva deployment, containerizaci, CI/CD, externi sluzby a environment variables.

**Posledni aktualizace:** 2026-03-19

---

## 1. Architektura -- prehled

```
                          +-----------------------+
                          |   Firebase Hosting    |
                          |   (frontend SPA)      |
                          +---------+-------------+
                                    |
                          /api/** rewrite
                                    |
                          +---------v-------------+
                          |   Google Cloud Run    |
                          |   (backend Express)   |
                          +---------+-------------+
                             |      |       |
              +--------------+      |       +------------------+
              |                     |                          |
    +---------v------+    +---------v--------+    +------------v----------+
    | Cloudflare R2  |    |    Supabase      |    |       Resend          |
    | (file storage) |    |   (databaze)     |    |   (transakcni email)  |
    +---------+------+    +---------+--------+    +-----------------------+
              |                     |
              |           +---------v--------+
              |           |   Firebase Auth  |
              |           |  (autentizace)   |
              |           +------------------+
              |
    +---------v------+    +------------------+    +-----------------------+
    |  Stripe        |    |     Sentry       |    |   GitHub Actions      |
    |  (platby)      |    |  (monitoring)    |    |      (CI/CD)          |
    +----------------+    +------------------+    +-----------------------+
```

### 1.1 Sluzby a jejich role

| Sluzba | Role | Stav |
|--------|------|------|
| **Firebase Hosting** | Hostovani frontendove SPA (React + Vite build) | Aktivni |
| **Google Cloud Run** | Backend Express server (kontejnerizovany) | Pripraveno |
| **Cloudflare R2** | Souborovy storage pro 3D modely, g-kody, faktury | Pripraveno |
| **Supabase** | Databaze (PostgreSQL) s RLS, dual-write podpora | Aktivni (dual-write) |
| **Firebase Auth** | Autentizace uzivatelu (email+heslo, Google Sign-In) | Aktivni |
| **Resend** | Transakcni emaily (potvrzeni objednavky, stav tisku, ...) | Pripraveno |
| **Stripe** | Platebni brana (Checkout Sessions, webhooky) | Pripraveno |
| **Sentry** | Error monitoring + performance tracing (frontend + backend) | Pripraveno |
| **GitHub Actions** | CI/CD pipeline (build, test, Docker build) | Aktivni |

---

## 2. Nove infrastrukturni soubory

### 2.1 Backend -- storage provider system

| Soubor | Cesta | Popis |
|--------|-------|-------|
| `storageProvider.js` | `backend-local/src/storage/storageProvider.js` | Abstraktni trida `StorageProvider` -- definuje interface pro vsechny storage backendy (uploadFile, downloadFile, deleteFile, listFiles, getSignedUrl, copyFile, moveFile, fileExists, getStats). Obsahuje sdilenou validaci tenant ID a sanitizaci cest. |
| `r2Provider.js` | `backend-local/src/storage/providers/r2Provider.js` | Implementace pro Cloudflare R2 pres S3-kompatibilni API (@aws-sdk/client-s3). Automaticky retry s exponencialnim backoffem, tenant-scoped key prefixy, presigned URL generovani. |
| `filesystemProvider.js` | `backend-local/src/storage/providers/filesystemProvider.js` | Wrapper nad existujicim storageService.js za jednotnym StorageProvider interface. Pouziva lokalni filesystem. V dev modu vraci API cestu misto signed URL. |
| `storageProviderFactory.js` | `backend-local/src/storage/storageProviderFactory.js` | Factory pattern -- vytvari spravny provider podle env `STORAGE_PROVIDER`. Podpora sync (`createStorageProvider`) i async (`createStorageProviderAsync`) inicializace. Singleton cache. |

### 2.2 Backend -- email system

| Soubor | Cesta | Popis |
|--------|-------|-------|
| `emailProvider.js` | `backend-local/src/email/emailProvider.js` | Factory pro email providery. Podpora: `none` (demo/mock), `smtp` (stub), `resend` (produkce), `sendgrid` (stub). |
| `resendProvider.js` | `backend-local/src/email/providers/resendProvider.js` | Produkce-ready provider pro Resend API. Retry logika (429/5xx), batch sending (100 emailu/batch), GDPR-safe logging (nikdy neloguje obsah emailu). Graceful fallback na mock kdyz neni API klic. |
| `order-confirmed.js` | `backend-local/src/email/templates/order-confirmed.js` | Sablona pro email potvrzeni objednavky. Cesky jazyk s diakritikou. |
| `order-printing.js` | `backend-local/src/email/templates/order-printing.js` | Sablona pro email o zahajeni tisku. |
| `order-shipped.js` | `backend-local/src/email/templates/order-shipped.js` | Sablona pro email o odeslani zasilky. |
| `order-completed.js` | `backend-local/src/email/templates/order-completed.js` | Sablona pro email o dokonceni objednavky. |

### 2.3 Backend -- sluzby

| Soubor | Cesta | Popis |
|--------|-------|-------|
| `sentryService.js` | `backend-local/src/services/sentryService.js` | Sentry inicializace a helpery pro Express. Dynamicky import @sentry/node, PII scrubbing (nikdy neposila emaily/hesla/tokeny), graceful no-op pokud neni DSN. |
| `stripeService.js` | `backend-local/src/services/stripeService.js` | Stripe business logika -- Checkout Session vytvoreni, webhook zpracovani (checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed), session retrieval. Dynamicky import stripe balicku. |
| `invoiceService.js` | `backend-local/src/services/invoiceService.js` | Generovani PDF faktur (ceske pravni pozadavky). SPAYD QR kody pro platbu, DPH kalkulace. Pouziva pdfmake + qrcode. |

### 2.4 Backend -- routes

| Soubor | Cesta | Popis |
|--------|-------|-------|
| `stripeRoutes.js` | `backend-local/src/routes/stripeRoutes.js` | Express router pro platby: `POST /api/payments/create-checkout`, `POST /api/payments/webhook`, `GET /api/payments/session/:id`, `GET /api/payments/status`. Webhook nevyzaduje auth (overeni pres Stripe signature). |

### 2.5 Frontend -- integrace

| Soubor | Cesta | Popis |
|--------|-------|-------|
| `sentryInit.js` | `src/lib/sentry/sentryInit.js` | Sentry inicializace pro React. Dynamicky import @sentry/react (code-split), Session Replay s maskovani PII, browser tracing. No-op pokud neni `VITE_SENTRY_DSN`. |
| `stripeClient.js` | `src/lib/stripe/stripeClient.js` | Frontend utilita pro Stripe platby. Pouziva nativni fetch() (zadna npm zavislost na @stripe/stripe-js). Funkce: `isStripeConfigured()`, `createPaymentSession()`, `redirectToCheckout()`, `verifyPaymentSession()`, `buildCheckoutUrls()`. |

### 2.6 Infrastrukturni soubory

| Soubor | Cesta | Popis |
|--------|-------|-------|
| `Dockerfile` | `backend-local/Dockerfile` | Multi-stage build na bazi node:20-slim pro Cloud Run. Non-root user, dumb-init pro signaly, profilove soubory pro PrusaSlicer. |
| `.dockerignore` | `backend-local/.dockerignore` | Ignoruje node_modules, .env, testy, storage data, dokumentaci, IDE soubory. |
| `ci.yml` | `.github/workflows/ci.yml` | GitHub Actions CI pipeline: 3 joby (frontend build, backend build, Docker image build). Spousti se na push/PR do main. |
| `deploy-cloudrun.sh` | `scripts/deploy-cloudrun.sh` | Deployment skript pro Cloud Run. 5 kroku: Artifact Registry, Docker auth, build, push, deploy. Konfigurovatelny pres env vars. |
| `firebase.json` | `firebase.json` | Firebase Hosting konfigurace: security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy), cache immutable pro static assety, rewrite /api/** na Cloud Run service, SPA fallback. |
| `sw.js` | `public/sw.js` | Service worker pro PWA. Cache-first pro static assety, network-first pro API. Verzovany cache bucket (`__SW_CACHE_VERSION__` nahradi CI pipeline). |
| `.env.example` | `.env.example` | Sablona pro frontend env vars s komentari a vysvetlenim kazde promenne. |

---

## 3. Storage Provider System

### 3.1 Architektura

```
storageProviderFactory.js
    |
    +-- STORAGE_PROVIDER=filesystem --> FilesystemProvider
    |                                       |
    |                                       +-- storageService.js (existujici)
    |                                       +-- fs/promises (primy pristup)
    |
    +-- STORAGE_PROVIDER=r2 ----------> R2Provider
                                            |
                                            +-- @aws-sdk/client-s3
                                            +-- @aws-sdk/s3-request-presigner
```

### 3.2 StorageProvider interface

Kazdy provider MUSI implementovat:

| Metoda | Popis | Navratova hodnota |
|--------|-------|-------------------|
| `uploadFile(tenantId, path, buffer, contentType)` | Nahraje soubor | `{ key, size, etag }` |
| `downloadFile(tenantId, path)` | Stahne soubor | `{ buffer, contentType, size }` |
| `deleteFile(tenantId, path)` | Smaze soubor | `boolean` |
| `listFiles(tenantId, prefix, options)` | Vypise soubory | `{ items[], cursor? }` |
| `getSignedUrl(tenantId, path, expiresIn)` | Presigned URL | `string` |
| `copyFile(tenantId, sourcePath, destPath)` | Kopie souboru | `{ key }` |
| `moveFile(tenantId, sourcePath, destPath)` | Presun souboru | `{ key }` |
| `fileExists(tenantId, path)` | Existuje soubor? | `boolean` |
| `getStats(tenantId)` | Statistiky tenanta | `{ totalFiles, totalSize }` |

### 3.3 Tenant izolace

Kazdy object key je prefixovany validovanym `tenantId`:

```
<tenantId>/<relativni-cesta>
```

Validace zahrnuje:
- Nesmí byt prazdny retezec
- Max 128 znaku
- Zakazane znaky: `/`, `\`, `..`, `\0`, `<`, `>`, `|`, `:`, `*`, `?`, `"`
- Nesmi byt `.` nebo `..`

### 3.4 Jak prepnout mezi filesystem a R2

```bash
# Lokalni vyvoj (vychozi -- neni treba nic nastavovat):
# STORAGE_PROVIDER=filesystem (default)

# Produkce s Cloudflare R2:
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=...
R2_ACCESS_KEY_SECRET=...
R2_BUCKET_NAME=modelpricer-files
```

R2Provider vyzaduje async inicializaci:
```javascript
import { createStorageProviderAsync } from './storageProviderFactory.js';
const storage = await createStorageProviderAsync();
await storage.uploadFile(tenantId, 'models/cube.stl', buffer, 'model/stl');
```

### 3.5 R2Provider -- specialni vlastnosti

- **Exponencialni backoff retry** pro transientni chyby (429, 500, 502, 503, 504, ECONNRESET, ETIMEDOUT)
- **Max 3 retrye** s jitterem (200ms * 2^attempt + random 0-100ms)
- **MP_ error codes** -- vsechny chyby jsou wrappovany do strukturovanych objektu s kodem (`MP_NOT_FOUND`, `MP_R2_ACCESS_DENIED`, `MP_R2_ERROR`, `MP_INVALID_TENANT`, `MP_INVALID_PATH`)
- **Debug logging** -- loguje jen kdyz `DEBUG` nebo `NODE_ENV=development`

---

## 4. Dockerfile a kontejnerizace

### 4.1 Multi-stage build

```
Stage 1 (deps):     node:20-slim
                    |-- npm ci --production --ignore-scripts
                    `-- Vysledek: cisty node_modules bez devDependencies

Stage 2 (runtime):  node:20-slim
                    |-- dumb-init pro spravne signal handling
                    |-- COPY --from=deps node_modules
                    |-- COPY src/ + profiles/ + package.json
                    |-- Non-root user (appuser:1001)
                    |-- ENV NODE_ENV=production, PORT=8080
                    `-- CMD: dumb-init node src/index.js
```

### 4.2 Bezpecnostni aspekty

| Opatreni | Popis |
|----------|-------|
| Non-root user | `appuser:1001` -- kontejner nebezi jako root |
| dumb-init | Spravne forwardovani signalu (SIGTERM, SIGINT pro graceful shutdown) |
| --ignore-scripts | npm postinstall skripty se nespousti (ochrana pred supply chain utoky) |
| .dockerignore | Excluduje .env, testy, storage data, dokumentaci |
| node:20-slim | Minimalni image (~180 MB vs ~900 MB plna verze) |

### 4.3 PrusaSlicer v kontejneru

Aktualne NENI v Dockerfile. Backend gracefully degraduje kdyz PrusaSlicer neni dostupny (health endpoint hlasi `slicer_available: false`). Budouci implementace: samostatny sidecar kontejner nebo AppImage instalace primo v Dockerfile.

---

## 5. CI/CD Pipeline

### 5.1 GitHub Actions (`.github/workflows/ci.yml`)

Spousti se na: `push` a `pull_request` do vetce `main`.

| Job | Co dela | Zavislosti |
|-----|---------|------------|
| `frontend-build` | `npm ci` + `npm run build` (Vite) + `npm test` (vitest) | Node 20, npm cache |
| `backend-build` | `npm ci` + `node --check src/index.js` | Node 20, npm cache |
| `docker-build` | `docker build` (overeni Dockerfile) | backend-build |

Concurrency: `ci-${{ github.ref }}` s `cancel-in-progress: true` -- pri novem push se predesle buildy zrusi.

### 5.2 Deploy script (`scripts/deploy-cloudrun.sh`)

5 kroku:
1. Zajisteni existence Artifact Registry repositare
2. Konfigurace Docker autentizace pro Artifact Registry
3. Build Docker image
4. Push do Artifact Registry
5. Deploy na Cloud Run

Konfigurovatelne env vars:

| Promenna | Vychozi | Popis |
|----------|---------|-------|
| `GCP_PROJECT_ID` | (povinne) | Google Cloud projekt |
| `GCP_REGION` | `europe-west1` | Region Cloud Run |
| `SERVICE_NAME` | `modelpricer-api` | Nazev Cloud Run sluzby |
| `MEMORY` | `2Gi` | Pametovy limit kontejneru |
| `CPU` | `4` | Pocet CPU |
| `MAX_INSTANCES` | `10` | Maximalni pocet instanci |
| `IMAGE_TAG` | `latest` | Tag Docker image |

---

## 6. Firebase Hosting konfigurace

### 6.1 Security headers

| Header | Hodnota | Ucel |
|--------|---------|------|
| X-Content-Type-Options | nosniff | Prevence MIME sniffing |
| X-Frame-Options | SAMEORIGIN | Prevence clickjacking |
| Referrer-Policy | strict-origin-when-cross-origin | Omezeni Referer headeru |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Blokace nepotrebnych API |

### 6.2 Caching

Static assety (JS, CSS, SVG, PNG, JPG, WEBP, WOFF2) maji:
```
Cache-Control: public, max-age=31536000, immutable
```
= 1 rok, neoverovat znovu (Vite hash v nazvu souboru zajisti invalidaci).

### 6.3 Rewrites

| Pattern | Cil | Popis |
|---------|-----|-------|
| `/api/**` | Cloud Run `modelpricer-api` (europe-west1) | Backend API proxy |
| `**` | `/index.html` | SPA fallback (React Router) |

---

## 7. Service Worker (PWA)

### 7.1 Strategie cachovani

| Typ pozadavku | Strategie | Duvod |
|---------------|-----------|-------|
| Static assety (JS, CSS, fonty, obrazky) | Cache-first, network fallback | Assety se nemeni (hash v nazvu) |
| API volani (/api/*) | Network-first, bez cache | Ceny a data musi byt aktualni |
| Navigace | Network-first, offline fallback | SPA musi fungovat online |

### 7.2 Verzovani cache

```javascript
const CACHE_VERSION = (typeof __SW_CACHE_VERSION__ !== 'undefined')
  ? __SW_CACHE_VERSION__
  : 'v2';
const CACHE_NAME = `modelpricer-${CACHE_VERSION}`;
```

CI pipeline muze nahradit `__SW_CACHE_VERSION__` build hashem nebo git SHA (napr. pres `sed`).

---

## 8. Environment Variables -- kompletni seznam

### 8.1 Frontend (VITE_ prefix -- viditelne v prohlizeci)

| Promenna | Povinne | Tajne | Popis |
|----------|---------|-------|-------|
| `VITE_FIREBASE_API_KEY` | **ANO** | Ne (klientsky klic) | Firebase API klic |
| `VITE_FIREBASE_AUTH_DOMAIN` | **ANO** | Ne | Firebase Auth domena |
| `VITE_FIREBASE_PROJECT_ID` | **ANO** | Ne | Firebase projekt ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | **ANO** | Ne | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **ANO** | Ne | Firebase Messaging sender |
| `VITE_FIREBASE_APP_ID` | **ANO** | Ne | Firebase aplikacni ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Ne | Ne | Google Analytics ID |
| `VITE_SUPABASE_URL` | Ne | Ne | Supabase projekt URL |
| `VITE_SUPABASE_ANON_KEY` | Ne | Ne (klientsky klic) | Supabase anonni klic |
| `VITE_AUTH_PROVIDER` | Ne | Ne | Auth provider (`firebase` / `supabase`), default: `firebase` |
| `VITE_API_BASE_URL` | Ne | Ne | Override API base URL (produkce) |
| `VITE_APP_URL` | Ne | Ne | App URL pro OAuth redirecty |
| `VITE_SENTRY_DSN` | Ne | Ne | Sentry DSN pro frontend error tracking |
| `VITE_APP_VERSION` | Ne | Ne | Verze aplikace pro Sentry release |
| `VITE_STRIPE_PUBLIC_KEY` | Ne | Ne (publishable key) | Stripe publishable key (pk_test/pk_live) |

### 8.2 Backend (serverove -- NESMI zacinat VITE_)

| Promenna | Povinne | Tajne | Popis |
|----------|---------|-------|-------|
| `PORT` | Ne | Ne | Port Express serveru (Cloud Run nastavi automaticky, default 3001 lokalne, 8080 v kontejneru) |
| `NODE_ENV` | Ne | Ne | `development` / `production` |
| `STORAGE_PROVIDER` | Ne | Ne | `filesystem` (vychozi) nebo `r2` |
| `STORAGE_ROOT` | Ne | Ne | Korenovy adresar pro filesystem provider |
| `R2_ACCOUNT_ID` | Kdyz R2 | **ANO** | Cloudflare ucet ID |
| `R2_ACCESS_KEY_ID` | Kdyz R2 | **ANO** | R2 API token access key |
| `R2_ACCESS_KEY_SECRET` | Kdyz R2 | **ANO** | R2 API token secret key |
| `R2_BUCKET_NAME` | Ne | Ne | Nazev R2 bucketu (default: `modelpricer-files`) |
| `R2_PUBLIC_URL` | Ne | Ne | Verejna URL bucketu (pro unsigned pristup) |
| `RESEND_API_KEY` | Ne | **ANO** | Resend API klic pro odesilani emailu |
| `EMAIL_PROVIDER` | Ne | Ne | Email provider (`none` / `smtp` / `resend` / `sendgrid`), default: `none` |
| `EMAIL_FROM` | Ne | Ne | Adresa odesilatele emailu (default: `noreply@modelpricer.app`) |
| `STRIPE_SECRET_KEY` | Ne | **ANO** | Stripe tajny API klic (sk_test/sk_live) |
| `STRIPE_WEBHOOK_SECRET` | Ne | **ANO** | Stripe webhook signing secret (whsec_...) |
| `SENTRY_DSN` | Ne | Ne | Sentry DSN pro backend error tracking |
| `APP_VERSION` | Ne | Ne | Verze aplikace pro Sentry release (backend) |
| `FIREBASE_PROJECT_ID` | Ne | Ne | Firebase projekt pro backend operace |
| `SUPABASE_URL` | Ne | Ne | Supabase URL pro backend |
| `SUPABASE_SERVICE_ROLE_KEY` | Ne | **ANO** | Supabase service role klic (plna prava, NIKDY na frontend!) |
| `SLICER_WORKSPACE_ROOT` | Ne | Ne | Adresar pro docasne slicer soubory (default: `/tmp/modelpricer`) |
| `PRUSA_SLICER_PATH` | Ne | Ne | Cesta k PrusaSlicer binarce |
| `INVOICE_COMPANY_NAME` | Ne | Ne | Nazev firmy na fakturach |
| `INVOICE_COMPANY_ADDRESS` | Ne | Ne | Adresa firmy na fakturach |
| `INVOICE_COMPANY_ICO` | Ne | Ne | ICO na fakturach |
| `INVOICE_COMPANY_DIC` | Ne | Ne | DIC na fakturach |
| `INVOICE_BANK_ACCOUNT` | Ne | Ne | Cislo uctu na fakturach |
| `INVOICE_BANK_IBAN` | Ne | Ne | IBAN na fakturach (pouzity i pro QR platbu) |
| `INVOICE_VAT_PAYER` | Ne | Ne | `true` pokud je firma platce DPH |
| `GCP_PROJECT_ID` | Kdyz deploy | Ne | Google Cloud projekt (pro deploy script) |
| `GCP_REGION` | Ne | Ne | Cloud Run region (default: `europe-west1`) |

### 8.3 Bezpecnostni pravidla

- **Tajne promenne** (oznacene **ANO**) NESMI byt v gitu -- pouzivejte `.env.local`, Cloud Run secret manager nebo CI/CD secrets.
- Frontend promenne s prefixem `VITE_` jsou **verejne** -- kdokoliv si je muze precist v build outputu.
- `SUPABASE_SERVICE_ROLE_KEY` NIKDY nesmi zacinat s `VITE_` -- dal by plny pristup ke vsem datum v Supabase.
- Sablona pro frontend promenne: `Model_Pricer-V2-main/.env.example`

---

## 9. MCP Servery

| Server | Typ | Priorita | Popis |
|--------|-----|----------|-------|
| **Supabase** | plugin | P0 | Pristup k Supabase databazi (SQL, migrace, RLS) |
| **Context7** | HTTP | P0 | Aktualni dokumentace knihoven (React, Vite, Firebase, ...) |
| **Brave Search** | stdio | P0 | Web vyhledavani pro research |
| **Firebase** | stdio | P0 | Firebase operace (auth, hosting, firestore) |
| **GitHub** | stdio | P0 | GitHub operace (issues, PR, commits) |
| **Stripe** | HTTP/OAuth | P0 | Stripe platby a webhooky |
| **Claude in Chrome** | stdio | -- | Browser automatizace pro testovani |
| **Sentry** | HTTP/OAuth | P1 | Error monitoring pristup |
| **Vercel** | HTTP/OAuth | P1 | Alternativni hosting (nepouzivany) |

**Konfigurace:** `Model_Pricer-V2-main/.mcp.json` (gitignored)
**Permissions:** `.claude/settings.local.json`

---

## 10. NPM balicky k instalaci (infrastrukturni zavislosti)

### 10.1 Backend (backend-local)

| Balicek | Popis | Povinny |
|---------|-------|---------|
| `@aws-sdk/client-s3` | S3-kompatibilni klient pro Cloudflare R2 | Kdyz `STORAGE_PROVIDER=r2` |
| `@aws-sdk/s3-request-presigner` | Generovani presigned URL pro R2 | Kdyz `STORAGE_PROVIDER=r2` |
| `resend` | Resend API klient pro emaily | Kdyz `EMAIL_PROVIDER=resend` |
| `pdfmake` | Generovani PDF faktur | Pro fakturacni modul |
| `qrcode` | QR kody pro SPAYD platby na fakturach | Pro fakturacni modul |
| `@sentry/node` | Sentry SDK pro Node.js backend | Pro error monitoring |
| `stripe` | Stripe API klient | Pro platebni modul |

### 10.2 Frontend (hlavni package.json)

| Balicek | Popis | Povinny |
|---------|-------|---------|
| `@sentry/react` | Sentry SDK pro React frontend | Pro error monitoring |

### 10.3 Instalacni prikazy

```bash
# Backend -- vsechny infrastrukturni zavislosti:
cd Model_Pricer-V2-main/backend-local
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner resend pdfmake qrcode @sentry/node stripe

# Frontend -- Sentry:
cd Model_Pricer-V2-main
npm install @sentry/react
```

**Poznamka:** Vsechny infrastrukturni moduly pouzivaji **dynamicky import** (lazy loading). Pokud balicek neni nainstalovany, modul gracefully degraduje na no-op/mock chovani. To znamena ze aplikace funguje i bez techto balicku -- funkce jsou pouze nedostupne.

---

## 11. Stripe integrace -- detaily

### 11.1 Architektura

```
Frontend (stripeClient.js)
    |
    +-- isStripeConfigured() ----------> GET  /api/payments/status
    +-- createPaymentSession() --------> POST /api/payments/create-checkout
    +-- redirectToCheckout(url) --------> window.location.href = stripe.com
    +-- verifyPaymentSession(id) ------> GET  /api/payments/session/:id
                                              |
                                        stripeRoutes.js
                                              |
                                        stripeService.js
                                              |
                                        Stripe API (stripe npm)
```

### 11.2 Webhook flow

```
Stripe (event) --> POST /api/payments/webhook
                        |
                   1. Overi signature (STRIPE_WEBHOOK_SECRET)
                   2. processWebhookEvent(event)
                   3. Aktualizuje stav objednavky
                   4. Vzdy vrati 200 (i pri chybe zpracovani)
```

Podporovane eventy:
- `checkout.session.completed` -- platba uspesne dokoncena
- `payment_intent.succeeded` -- platebni zamer uspesny
- `payment_intent.payment_failed` -- platba selhala

### 11.3 Mena a castky

Stripe pouziva nejmensi jednotku meny (halere/centy):
- CZK: `unitPrice * 100` (1 CZK = 100 haleru)
- EUR/USD: `unitPrice * 100` (1 EUR = 100 centu)

Podporovane meny: `czk`, `eur`, `usd`, `gbp`, `pln`.

---

## 12. Sentry integrace -- detaily

### 12.1 Frontend (sentryInit.js)

- Dynamicky import `@sentry/react` (code-split, nezpomaluje prvni nacteni)
- Browser tracing + Session Replay
- PII ochrana: `sendDefaultPii: false`, `maskAllText: true`, `blockAllMedia: true`
- Sample rates: 100% v dev, 10% v produkci (traces), 10% sessions / 100% chybovych sessions (replay)

### 12.2 Backend (sentryService.js)

- Dynamicky import `@sentry/node`
- PII scrubbing: `beforeSend` callback odebira hesla, tokeny, emaily, IP adresy
- `setupExpressErrorHandler(app)` -- musi byt PO vsech routes ale PRED custom error handlery
- Helper funkce: `captureException(error, context)`, `captureMessage(msg, level)`, `setUser(user)`

---

## 13. Email system -- detaily

### 13.1 Provider hierarchie

```
emailProvider.js (factory)
    |
    +-- 'none'     --> Demo mode (loguje, neodeslije)
    +-- 'smtp'     --> SMTP stub (pro budouci Nodemailer)
    +-- 'resend'   --> resendProvider.js (produkce)
    +-- 'sendgrid' --> SendGrid stub (pro budouci integraci)
```

### 13.2 Email templates

4 sablony pro objednavkovy lifecycle:

| Sablona | Trigger | Popis |
|---------|---------|-------|
| `order-confirmed` | Objednavka potvrzena | Potvrzeni prijeti objednavky |
| `order-printing` | Zahajeni tisku | Informace o zahajeni vyrobe |
| `order-shipped` | Odeslani zasilky | Tracking informace |
| `order-completed` | Objednavka dokoncena | Dekujeme za nakup |

Vsechny sablony jsou v cestine s plnou diakritikou.

### 13.3 Resend Provider -- produkce

- Retry logika: max 3 pokusy s exponencialnim backoffem (1s, 2s, 4s) pro 429 a 5xx chyby
- Batch sending: az 100 emailu v jednom API volani, automaticky split vetsi davek
- GDPR-safe: nikdy neloguje obsah emailu (jen to, subject, status)
- Mock mode: pokud neni `RESEND_API_KEY`, vraci mock odpoved (pro vyvoj)

---

## 14. Fakturacni modul (invoiceService.js)

### 14.1 Ceske pravni pozadavky

Generovane PDF faktury obsahuji vsechny zakonem pozadovane udaje:
1. Dodavatel (nazev, adresa, ICO, DIC)
2. Odberatel (nazev, adresa, ICO, DIC)
3. Cislo faktury (unikatni sekvencni)
4. Datum vystaveni, datum zdanitelneho plneni, datum splatnosti
5. Polozky (popis, mnozstvi, jednotkova cena, celkem)
6. Zaklad dane, sazba DPH, castka DPH, celkem s DPH
7. Bankovni ucet (cislo uctu, IBAN)
8. QR platba (SPAYD format)
9. Poznamka: "Nejsem platce DPH" nebo "Platce DPH"

### 14.2 QR platba (SPAYD)

Format: `SPD*1.0*ACC:{iban}*AM:{castka}*CC:CZK*VS:{variabilni_symbol}*MSG:{zprava}`

Variabilni symbol se extrahuje z cisla faktury (prvnich 10 cislic).

---

## 15. Changelog

| Datum | Zmena |
|-------|-------|
| 2026-03-19 | Prvni verze dokumentace -- kompletni infrastruktura |

---

> **Vlastnik:** `mp-sr-infra`
> **Eskalace:** `mp-sr-orchestrator`
> **Posledni aktualizace:** 2026-03-19
