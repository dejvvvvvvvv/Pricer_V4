# BETA Checklist — Stav implementace

**Datum:** 2026-03-19
**Zdroj:** `MASTER-BETA-INFRASTRUCTURE-PLAN.md` CAST H + overeni existujicich souboru
**Posledni aktualizace:** 2026-03-19

---

## HOTOVO (implementovano — soubory existuji v repu)

### Infrastruktura

- [x] **Cloudflare R2 storage abstrakce**
  - `backend-local/src/storage/storageProvider.js` — interface
  - `backend-local/src/storage/storageProviderFactory.js` — factory (filesystem vs r2)
  - `backend-local/src/storage/providers/r2Provider.js` — R2 implementace
  - `backend-local/src/storage/providers/filesystemProvider.js` — lokalni filesystem
- [x] **Dockerfile pro Cloud Run** — `backend-local/Dockerfile` (multi-stage, PrusaSlicer AppImage + node:20-slim)
- [x] **.dockerignore** — `backend-local/.dockerignore`
- [x] **GitHub Actions CI pipeline** — `.github/workflows/ci.yml`
- [x] **Cloud Run deploy script** — `scripts/deploy-cloudrun.sh`
- [x] **Firebase Hosting konfigurace** — `Model_Pricer-V2-main/firebase.json`
  - Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
  - Cloud Run rewrite (`/api/**` -> `modelpricer-api` service)
  - Cache headers pro staticke assety (1 rok, immutable)
- [x] **Service worker cache versioning** — `public/sw.js` (`CACHE_VERSION` nahrazovatelny pres CI/CD `__SW_CACHE_VERSION__`)

### Backend Services

- [x] **Resend email provider** — `backend-local/src/email/providers/resendProvider.js`
  - Graceful fallback (mock kdyz RESEND_API_KEY chybi)
  - Retry logika (429 + 5xx, exponential backoff, 3 pokusy)
  - Batch sending (az 100 emailu)
  - GDPR-safe logging (nikdy neloguje obsah)
- [x] **4 ceske email sablony**
  - `backend-local/src/email/templates/order-confirmed.js`
  - `backend-local/src/email/templates/order-printing.js`
  - `backend-local/src/email/templates/order-shipped.js`
  - `backend-local/src/email/templates/order-completed.js`
  - `backend-local/src/email/templates/index.js`
- [x] **PDF faktura service** — `backend-local/src/services/invoiceService.js`
  - pdfmake pro PDF generovani
  - QR platba (SPAYD format)
  - Ceske nalezitosti (ICO, DIC, DUZP, cislo faktury)
- [x] **Sentry monitoring (backend)** — `backend-local/src/services/sentryService.js`
- [x] **Stripe payment integration (backend)**
  - `backend-local/src/services/stripeService.js` — Payment Intents, refunds
  - `backend-local/src/routes/stripeRoutes.js` — API routes
  - Stripe routes mounted v `backend-local/src/index.js` (radek 45)
- [x] **Health check rozsireni** — services-status endpoint v `backend-local/src/index.js`
- [x] **Signed URL endpointy** — v `backend-local/src/storage/storageRouter.js` + `r2Provider.js`

### Frontend

- [x] **Sentry frontend** — `src/lib/sentry/sentryInit.js`
  - Dynamic import (nebrzdi initial bundle)
  - Graceful fallback kdyz @sentry/react neni nainstalovany
- [x] **Stripe frontend client** — `src/lib/stripe/stripeClient.js`
  - `isStripeConfigured()` helper
- [x] **AdminPayments — Stripe konfigurace sekce** — `src/pages/admin/AdminPayments.jsx`
  - Zobrazeni Stripe status (test/live klice)
  - Maskovany klíc v UI
- [x] **API_BASE (VITE_API_BASE_URL)** — ve vsech service souborech:
  - `src/lib/apiClient.js`
  - `src/services/presetsApi.js`
  - `src/services/slicerApi.js`
  - `src/services/storageApi.js`
  - `src/config/api.js`
  - `src/lib/stripe/stripeClient.js`

### Dokumentace

- [x] **Infrastructure-Dokumentace.md** — `docs/claude/Documentation/Infrastructure-Dokumentace.md`
- [x] **Master plan** — `docs/claude/PLANS/MASTER-BETA-INFRASTRUCTURE-PLAN.md` (1495 radku, 8 CASTI A-H)
- [x] **Beta readiness audit** — `docs/claude/PLANS/beta-readiness-audit-2026-03-16.md`
- [x] **Cloudflare MCP setup** — `docs/claude/MCP_SETUP_CLOUDFLARE.md`
- [x] **Security audit** — `docs/claude/BETA-SECURITY-AUDIT.md`
- [x] **Tenant isolation audit** — `docs/claude/TENANT-ISOLATION-AUDIT.md`

### Bezpecnost (z Beta Security Sprint 2026-03-14)

- [x] Firestore rules tenant-scoped
- [x] Security HTTP headers (Firebase Hosting)
- [x] File upload filter (allowlist + blocklist + MIME check)
- [x] isDev safe default
- [x] innerHTML sanitizace v AdminEmails
- [x] Health endpoints za requireAuth
- [x] Widget presets endpoint tenant validace

### Auth

- [x] Firebase Auth provider (primarni)
- [x] Supabase Auth provider (stub, Google login chybi)
- [x] Backend dual-auth middleware (Firebase + Supabase JWT)
- [x] Tenant middleware

---

## ZBYVA UDELAT

### Uzivatel MUSI (Claude to nemuze udelat)

> Tyto polozky vyzaduji pristup k dashboardum, platebni kartu, nebo rozhodnuti o business nastaveni.

- [ ] **Google Cloud** — vytvorit ucet + projekt + billing + povolit API (Cloud Run, Artifact Registry, Cloud Build)
- [ ] **Cloudflare** — vytvorit ucet + R2 bucket + API token + R2 API klice
  - Navod: `docs/claude/MCP_SETUP_CLOUDFLARE.md`
- [ ] **Stripe** — vytvorit ucet (CZ verifikace) + ziskat API klice (publishable + secret)
- [ ] **Resend** — vytvorit ucet + overit domenu + ziskat API key
- [ ] **Sentry** — vytvorit ucet + projekt + ziskat DSN (frontend i backend)
- [ ] **Vyplnit .env soubory** s credentials (viz `.env.example` soubory)
- [ ] **Nainstalovat nastroje:**
  - `gcloud` CLI (https://cloud.google.com/sdk/docs/install)
  - Docker Desktop (https://www.docker.com/products/docker-desktop)
- [ ] **Exportovat PrusaSlicer profily** (`.ini` soubory do `backend-local/profiles/`)
- [ ] **Rozhodnout:** vlastni domena? (pokud ano, nastavit DNS na Cloudflare)
- [ ] **Nainstalovat npm packages** (viz seznam nize)

### NPM packages k instalaci

```bash
# Backend (v adresari backend-local/)
cd backend-local
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner  # R2 storage
npm install resend                                              # Email (Resend API)
npm install pdfmake qrcode                                      # PDF faktury + QR platba
npm install @sentry/node                                        # Monitoring (backend)
npm install stripe                                              # Platby (Stripe SDK)

# Frontend (v rootu Model_Pricer-V2-main/)
cd ../Model_Pricer-V2-main
npm install @sentry/react                                       # Monitoring (frontend)
# @stripe/stripe-js — OPTIONAL (pro Stripe Elements, zatim pres loadStripe CDN)
```

> **POZNAMKA:** Vsechny tyto packages pouzivaji dynamic import v kodu,
> takze build projde i bez nich — ale v runtime budou v mock/fallback modu.

---

### Claude muze dodělat (kod uz castecne existuje nebo je v planu)

| # | Polozka | Priorita | Stav | Poznamka |
|---|---------|----------|------|----------|
| 1 | PrusaSlicer v Docker kontejneru (Linux AppImage) | P0 | Dockerfile existuje, neotestovano | Test az na Linux/CI |
| 2 | Supabase dual-write aktivace | P1 | Kod existuje v `featureFlags.js` | Prepnout flagy z `localStorage` na `dual-write` |
| 3 | E2E testy (Playwright) | P1 | Neexistuji | Zakladni flow: upload -> slice -> cena -> checkout |
| 4 | Admin System Health page | P2 | Neexistuje | Zobrazeni stavu sluzeb (R2, Stripe, Resend, Sentry, DB) |
| 5 | Supabase production RLS aktivace | P1 | Schema + politiky existuji | Spustit `rls-policies-production.sql` |
| 6 | Rate limiting pro production | P1 | Existuje middleware | Overit limity pro produkci |
| 7 | Stripe webhook handler | P1 | `stripeRoutes.js` existuje | Dodelat `payment_intent.succeeded` handler |
| 8 | Email notification triggers | P1 | `backend-local/src/email/triggers.js` existuje | Napojit na order events |
| 9 | Admin reprice/reslice — realne volani | P2 | Mock (`Math.random()`) | Nahradit realnym volanim slicer API |
| 10 | Model Upload page — realna upload API | P2 | `simulateUpload` fake progress | Napojit na R2 upload endpoint |
| 11 | Docker Compose pro lokalni testovani | P2 | Neexistuje | `docker-compose.yml` pro lokalni vyvoj |
| 12 | .env.example sjednoceni | P1 | Castecne opraveno | Overit SUPABASE_SERVICE_ROLE_KEY vs SUPABASE_JWT_SECRET |
| 13 | Admin role enforcement (backend) | P1 | Client-side only | Backend middleware pro admin role |
| 14 | Order tracking page — realna API | P2 | "simulated" komentar | Napojit na orders API |
| 15 | CI/CD — automaticky deploy | P2 | CI existuje, deploy manual | Pridat deploy step do GitHub Actions |

---

## CHECKLIST CAST H — Mapovani na stav

> Prevzato z `MASTER-BETA-INFRASTRUCTURE-PLAN.md` CAST H.
> Oznaceni: HOTOVO = implementovano, CEKA = na uzivatele, CLAUDE = Claude muze udelat.

### H.1 Infrastruktura

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Google Cloud projekt s billing | CEKA | Uzivatel musi vytvorit |
| Cloud Run service bezi | CEKA | Po Docker build + deploy |
| PrusaSlicer v Cloud Run | HOTOVO (Dockerfile) | Neotestovano na Linuxu |
| R2 buckety existuji | CEKA | Uzivatel musi vytvorit |
| Firebase Hosting deploy | CEKA | `firebase deploy` po vyplneni .env |
| Vlastni domena | CEKA | Rozhodnuti uzivatele |
| HTTPS | HOTOVO (auto) | Firebase Hosting + Cloud Run = auto HTTPS |
| GitHub Actions CI/CD | HOTOVO | `.github/workflows/ci.yml` |

### H.2 Backend

| Polozka | Stav | Poznamka |
|---------|------|----------|
| API endpointy funguji | HOTOVO (kod) | Testovani az po deploy |
| Auth middleware Firebase JWT | HOTOVO | `backend-local/src/middleware/auth.js` |
| Tenant izolace | HOTOVO | `backend-local/src/middleware/tenant.js` |
| Rate limiting | HOTOVO | Existujici middleware |
| CORS produkcni domeny | CLAUDE | Aktualizovat po ziskani domeny |
| Security headers | HOTOVO | V Express i Firebase Hosting |
| Graceful shutdown | HOTOVO | SIGTERM handler v `index.js` |
| Error responses | HOTOVO | Neleakuji systemove cesty |

### H.3 Databaze

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Supabase 25 tabulek | HOTOVO | `supabase/schema.sql` |
| RLS 102 politik | HOTOVO (soubor) | `supabase/rls-policies-production.sql` — NESPUSTENO |
| `get_request_tenant_id()` | HOTOVO | V schema |
| Demo tenant data migrovana | CLAUDE | Po aktivaci Supabase |
| Backup | CEKA | Supabase Pro plan automaticky |

### H.4 Storage

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Upload do R2 | HOTOVO (kod) | `r2Provider.js` — testovani az po R2 bucketu |
| Download z R2 (signed URLs) | HOTOVO (kod) | `r2Provider.js` + `storageRouter.js` |
| Tenant izolace (key prefix) | HOTOVO | `{tenantId}/{type}/{filename}` |
| Presigned upload URL | HOTOVO (kod) | V `r2Provider.js` |
| R2 lifecycle pravidla | CEKA | Uzivatel nastavi v Cloudflare Dashboard |

### H.5 Email

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Resend API key | CEKA | Uzivatel musi ziskat |
| Domain verifikace | CEKA | Uzivatel musi overit v Resend |
| Email sablony (CZ + EN) | HOTOVO | 4 sablony v `templates/` |
| Email pri vytvoreni objednavky | CLAUDE | Trigger existuje, napojit |
| Email pri zmene stavu | CLAUDE | Trigger existuje, napojit |

### H.6 Platby

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Stripe test mode | CEKA | Uzivatel musi ziskat test klice |
| Payment Intent | HOTOVO (kod) | `stripeService.js` |
| Stripe Elements na frontendu | CLAUDE | `stripeClient.js` existuje, UI dodelat |
| Test platba (4242...) | CEKA | Az po Stripe uctu |
| Webhook `payment_intent.succeeded` | CLAUDE | Dodelat handler |
| Objednavka oznacena jako zaplacena | CLAUDE | Napojit na webhook |
| PDF faktura | HOTOVO (kod) | `invoiceService.js` (pdfmake + QR SPAYD) |

### H.7 Frontend

| Polozka | Stav | Poznamka |
|---------|------|----------|
| `npm run build` | HOTOVO | Build prochazi |
| Routing | HOTOVO | Vsechny stranky se nacitaji |
| Kalkulacka end-to-end | HOTOVO | S lokalnim backendem funguje |
| Widget v iframe | HOTOVO | Tenant-scoped |
| Admin CRUD | HOTOVO | 15+ stranek |
| Service worker aktualizace | HOTOVO | Cache versioning implementovan |
| Sentry errory | HOTOVO (kod) | Az po instalaci @sentry/react |

### H.8 Security

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Zadne secrets v gitu | HOTOVO | `.gitignore` spravne nastaven |
| `.env` v `.gitignore` | HOTOVO | |
| Firebase rules tenant-scoped | HOTOVO | Sprint 2026-03-14 |
| Supabase RLS | HOTOVO (soubor) | Nespusteno na produkci |
| File upload filter | HOTOVO | Allowlist + blocklist + MIME |
| CORS | HOTOVO | Omezeno na povolene domeny |
| Rate limiting | HOTOVO | Middleware v Express |
| Demo-tenant fallback | HOTOVO | Deaktivovan v produkci |

### H.9 Monitoring

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Sentry frontend | HOTOVO (kod) | `sentryInit.js` — az po instalaci @sentry/react |
| Sentry backend | HOTOVO (kod) | `sentryService.js` — az po instalaci @sentry/node |
| Cloud Run logy | CEKA | Az po deploy na Google Cloud |
| Alerting (Sentry) | CEKA | Uzivatel nastavi v Sentry dashboardu |

### H.10 Dokumentace

| Polozka | Stav | Poznamka |
|---------|------|----------|
| README.md s produkcnim setupem | CLAUDE | Aktualizovat pred betou |
| `.env.example` kompletni | CLAUDE | Doplnit chybejici promenne |
| Deployment postup | HOTOVO | Master plan + deploy script |
| API dokumentace | HOTOVO | `apiDocs` route na backendu |

---

## SHRUTI — Co chybi k BETA spusteni

### Blockers (neni mozne spustit bez tohoto)

1. **Google Cloud + Cloudflare ucty** — uzivatel musi vytvorit
2. **NPM packages** — nainstalovat (viz seznam vyse)
3. **Stripe ucet** — pokud chceme platby kartou
4. **Resend ucet** — pokud chceme odesilat emaily
5. **.env credentials** — vsechny klice a tokeny

### Nice-to-have (muze byt po bete)

- E2E testy (Playwright)
- Admin System Health page
- Admin reprice/reslice (realne, ne mock)
- Model Upload (realna API, ne simulate)
- Order tracking (realna API)
- Docker Compose pro lokalni vyvoj

---

## Casovy odhad

| Co | Kdo | Cas |
|----|-----|-----|
| Ucty + credentials | Uzivatel | ~2-3 hodiny |
| npm install + .env | Uzivatel | ~30 min |
| Docker build + test | Claude + Uzivatel | ~1-2 hodiny |
| Deploy na Cloud Run | Claude + Uzivatel | ~1-2 hodiny |
| Firebase deploy | Claude + Uzivatel | ~30 min |
| Stripe webhook dodelani | Claude | ~1-2 hodiny |
| Email triggers napojeni | Claude | ~1 hodina |
| E2E testy zaklad | Claude | ~2-3 hodiny |
| **CELKEM** | | **~10-14 hodin** |

---

## Reference

| Dokument | Cesta |
|----------|-------|
| Master plan (CAST A-H) | `docs/claude/PLANS/MASTER-BETA-INFRASTRUCTURE-PLAN.md` |
| Beta readiness audit | `docs/claude/PLANS/beta-readiness-audit-2026-03-16.md` |
| Cloudflare MCP setup | `docs/claude/MCP_SETUP_CLOUDFLARE.md` |
| Cloud Run plan | `docs/claude/PLANS/Cloude Run a Supabase implementace.md` |
| Security audit | `docs/claude/BETA-SECURITY-AUDIT.md` |
| Tenant isolation audit | `docs/claude/TENANT-ISOLATION-AUDIT.md` |
| Infrastructure docs | `docs/claude/Documentation/Infrastructure-Dokumentace.md` |

---

*Posledni aktualizace: 2026-03-19*
*Stav: HOTOVO kod = ~70%, CEKA na uzivatele = ~20%, CLAUDE dodelat = ~10%*
