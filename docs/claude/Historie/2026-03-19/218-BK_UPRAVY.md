# 218-BK — UPRAVY — Backend (Infrastruktura) — 2026-03-19

## Metadata
- **ID:** 218-BK
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** Backend — BETA infrastruktura implementace
- **Souvisejici ID:** 215-GN, 216-GN, 217-GN
- **Trigger:** Vlna 3 — implementace infrastruktury podle master planu z Vlny 2 (R2 storage, Docker/CI-CD, email/PDF faktury)

---

## Souhrn uprav

Implementace BETA infrastruktury ve 3 oblastech: (1) R2 Storage abstrakce s factory patternem a provider systemem, (2) Docker multi-stage build + GitHub Actions CI/CD + deploy skript pro Cloud Run, (3) Email system s Resend providerem a 4 ceske sablony + PDF fakturace s QR platbou (SPAYD). Celkem 15 novych souboru a 3 upravene.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | backend-local/src/storage/storageProvider.js | Novy soubor | cele | Abstraktni base class, 9 metod (upload/download/delete/list/exists/getUrl/getSignedUrl/copy/move) |
| 2 | backend-local/src/storage/providers/r2Provider.js | Novy soubor | cele | Cloudflare R2 provider — @aws-sdk/client-s3, presigned URLs, retry logika |
| 3 | backend-local/src/storage/providers/filesystemProvider.js | Novy soubor | cele | Filesystem wrapper nad existujicim storageService.js |
| 4 | backend-local/src/storage/storageProviderFactory.js | Novy soubor | cele | Factory — STORAGE_PROVIDER env var (r2/filesystem/auto) |
| 5 | backend-local/Dockerfile | Novy soubor | cele | Multi-stage build, node:20-slim, non-root user, dumb-init |
| 6 | backend-local/.dockerignore | Novy soubor | cele | Docker ignore (node_modules, .env, docs, tests) |
| 7 | .github/workflows/ci.yml | Novy soubor | cele | GitHub Actions — frontend build + backend check + docker build |
| 8 | scripts/deploy-cloudrun.sh | Novy soubor | cele | Artifact Registry + Cloud Run deploy skript |
| 9 | firebase.json | Zmeneno | aktualizace | Security headers, Cloud Run rewrite, dist slozka |
| 10 | backend-local/src/email/providers/resendProvider.js | Novy soubor | cele | Resend API, retry logika, GDPR logging (no body stored) |
| 11 | backend-local/src/email/templates/order-confirmed.js | Novy soubor | cele | Ceska email sablona — potvrzeni objednavky |
| 12 | backend-local/src/email/templates/order-printing.js | Novy soubor | cele | Ceska email sablona — zahajeni tisku |
| 13 | backend-local/src/email/templates/order-shipped.js | Novy soubor | cele | Ceska email sablona — odeslani + tracking URL |
| 14 | backend-local/src/email/templates/order-completed.js | Novy soubor | cele | Ceska email sablona — dokonceni objednavky |
| 15 | backend-local/src/services/invoiceService.js | Novy soubor | cele | pdfmake PDF faktura + QR platba (SPAYD format) |
| 16 | backend-local/src/email/emailProvider.js | Zmeneno | pridani case | Pridano case 'resend' pro ResendProvider |
| 17 | backend-local/src/routes/invoices.js | Zmeneno | PDF endpoint | Novy endpoint pro generovani PDF faktury |
| 18 | backend-local/.env.example | Zmeneno | nove promenne | R2, Resend, Sentry env vars |

---

## Detailni zmeny

### 1. `backend-local/src/storage/storageProvider.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Abstraktni vrstva pro storage — umoznuje prepinani mezi R2 a lokalnim filesystemem

**Co se zmenilo:**
- Abstract base class StorageProvider s 9 metodami
- Metody: upload, download, delete, list, exists, getUrl, getSignedUrl, copy, move
- Kazda metoda hazi NotImplementedError pokud neni override
- Spolecna validace parametru (bucket, key)

---

### 2. `backend-local/src/storage/providers/r2Provider.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Cloudflare R2 integrace pres S3-kompatibilni API

**Co se zmenilo:**
- Implementace StorageProvider pro R2
- @aws-sdk/client-s3 pro PutObject, GetObject, DeleteObject, ListObjectsV2, HeadObject, CopyObject
- @aws-sdk/s3-request-presigner pro presigned URLs (default 1h expiry)
- Retry logika (3 pokusy s exponential backoff)
- Konfigurace pres env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME

---

### 3. `backend-local/src/storage/providers/filesystemProvider.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Lokalni filesystem provider — wrapper nad existujicim storageService.js pro vyvoj

**Co se zmenilo:**
- Implementace StorageProvider delegujici na puvodni storageService
- Upload/download/delete/list/exists mapovane na fs operace
- getUrl vraci lokalni cestu, getSignedUrl neni podporovano (throws)

---

### 4. `backend-local/src/storage/storageProviderFactory.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Factory pattern pro volbu storage provideru podle env

**Co se zmenilo:**
- Cte STORAGE_PROVIDER env var (hodnoty: 'r2', 'filesystem', 'auto')
- 'auto' mode: R2 pokud je R2_ACCOUNT_ID nastaveno, jinak filesystem
- Singleton pattern — jedna instance per proces
- getStorageProvider() export

---

### 5. `backend-local/Dockerfile`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Kontejnerizace backendu pro Cloud Run deployment

**Co se zmenilo:**
- Multi-stage build (builder + production)
- Base image: node:20-slim
- Non-root user (node) pro bezpecnost
- dumb-init jako PID 1 (spravny signal handling)
- HEALTHCHECK instrukce (/api/health)
- Exposovany port 3001

---

### 6. `backend-local/.dockerignore`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Minimalizace Docker build kontextu

**Co se zmenilo:**
- Ignorovany: node_modules, .env, docs, tests, .git, *.md

---

### 7. `.github/workflows/ci.yml`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Automatizace buildu a deploymentu pres GitHub Actions

**Co se zmenilo:**
- 3 jobs: frontend-build (npm run build), backend-check (lint + test), docker-build
- Trigger na push do main a pull requesty
- Docker build pouziva Artifact Registry
- Caching node_modules pro rychlost

---

### 8. `scripts/deploy-cloudrun.sh`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Automatizovany deploy skript pro Cloud Run

**Co se zmenilo:**
- Push image do Artifact Registry
- Cloud Run deploy s konfigurovatelnou pameti/CPU
- Env vars z .env nebo Secret Manager
- Region nastaveni (europe-west1)

---

### 9. `firebase.json`

**Typ:** Zmeneno
**Radky:** aktualizace
**Duvod:** Priprava pro production hosting s Cloud Run rewrite

**Co se zmenilo:**
- Pridany security headers (X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security)
- Pridany Cloud Run rewrite pravidla pro /api/* cesty
- Zmena dist slozky z build na dist (Vite)

---

### 10. `backend-local/src/email/providers/resendProvider.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Produkce-ready email provider (Resend.com)

**Co se zmenilo:**
- Resend API integrace (RESEND_API_KEY env var)
- send() metoda s from, to, subject, html parametry
- Retry logika (3 pokusy)
- GDPR logging — loguje metadata (to, subject, timestamp), NIKDY telo emailu
- Konfigurovatelny FROM adresa pres env

---

### 11-14. Email sablony (`backend-local/src/email/templates/order-*.js`)

**Typ:** Nove soubory (4 kusy)
**Radky:** cele
**Duvod:** Ceske email sablony pro objednavkovy workflow

**Co se zmenilo:**
- `order-confirmed.js` — potvrzeni objednavky (cislo, polozky, cena, kontakt)
- `order-printing.js` — zahajeni tisku (odhadovany cas, cislo objednavky)
- `order-shipped.js` — odeslani (tracking URL, prepravce, kontakt)
- `order-completed.js` — dokonceni a feedback (dekujeme, recenze odkaz)
- Vsechny sablony: cesky text, inline CSS, responsive HTML, brand placeholder

---

### 15. `backend-local/src/services/invoiceService.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** PDF fakturace s QR platbou pro cesky trh

**Co se zmenilo:**
- pdfmake pro generovani PDF
- Hlavicka s logem, cislem faktury, datumy (vystaveni, splatnost, DUZP)
- Tabulka polozek (nazev, mnozstvi, cena, DPH, celkem)
- Souhrn (zaklad DPH, DPH 21%, celkem s DPH)
- QR kod pro platbu ve formatu SPAYD (cesky bankovni standard)
- qrcode knihovna pro generovani QR kodu
- Podpora pro: ICO, DIC, bankovni ucet, variabilni symbol

---

### 16. `backend-local/src/email/emailProvider.js`

**Typ:** Zmeneno
**Radky:** pridani case
**Duvod:** Registrace Resend provideru v email factory

**Co se zmenilo:**
- Pridano case 'resend' do switch pro EMAIL_PROVIDER env var
- Import ResendProvider

---

### 17. `backend-local/src/routes/invoices.js`

**Typ:** Zmeneno
**Radky:** novy endpoint
**Duvod:** API endpoint pro generovani PDF faktur

**Co se zmenilo:**
- Novy POST /api/invoices/:orderId/pdf endpoint
- Cte data objednavky, generuje PDF pres invoiceService
- Vraci PDF jako buffer s Content-Type: application/pdf

---

### 18. `backend-local/.env.example`

**Typ:** Zmeneno
**Radky:** doplneni
**Duvod:** Dokumentace novych env promennych

**Co se zmenilo:**
- Pridany R2 promenne (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)
- Pridany Resend promenne (RESEND_API_KEY, EMAIL_FROM)
- Pridany Sentry promenne (SENTRY_DSN)
- Pridano STORAGE_PROVIDER (r2/filesystem/auto)

---

## Dopad zmen

- **Ovlivnene komponenty:** Backend storage system (storageRouter.js muze byt prepojen na novy provider), email system (emailProvider.js), invoicing (invoices.js route)
- **Breaking changes:** Ne — vsechny zmeny jsou aditivni, existujici filesystem storage zustava jako fallback
- **Nove zavislosti:** @aws-sdk/client-s3, @aws-sdk/s3-request-presigner (pro R2), resend (email), pdfmake + qrcode (faktury)
- **Rizika:** NPM packages musi byt nainstalovany uzivatelem; R2 vyzaduje Cloudflare ucet a API klice; Resend vyzaduje verifikovanou domenu

---

## Testovani

- **Build:** Nekontrolovano (ceka na npm install novych balicku)
- **Manual test:** Strukturalni overeni souboru a importu
- **Poznamky:** Uzivatel musi spustit `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner resend pdfmake qrcode` v backend-local/

---
