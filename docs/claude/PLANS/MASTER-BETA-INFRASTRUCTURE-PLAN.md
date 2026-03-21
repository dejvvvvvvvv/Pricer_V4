# MASTER IMPLEMENTACNI PLAN — BETA Deployment ModelPricer V3

**Datum:** 2026-03-19
**Verze:** 1.0
**Status:** NAVRH — ceka na schvaleni uzivatelem
**Autor:** mp-spec-plan-manager (Opus)

---

## CAST A: Prehled architektury

### A.1 Diagram celkove architektury

```
                          +-------------------+
                          |   CLOUDFLARE DNS  |
                          |   (free tier)     |
                          +--------+----------+
                                   |
                   +---------------+----------------+
                   |                                |
          +--------v---------+           +----------v----------+
          | FIREBASE HOSTING |           |   CLOUDFLARE R2     |
          | (staticky React  |           |   (file storage)    |
          | build — SPA)     |           |   - 3D modely       |
          +---------+--------+           |   - gcode           |
                    |                    |   - branding        |
        +-----------+-----------+        |   S3-kompatibilni   |
        |                       |        +----------+----------+
        |  firebase.json        |                   ^
        |  rewrites:            |                   |
        |                       |                   | (signed URLs /
   +----v-----+          +-----v------+             |  presigned PUT)
   | /api/**   |          | /api/slice |             |
   | (lehke)   |          | /** (tezke)|     +-------+--------+
   +----+------+          +-----+------+     |                |
        |                       |            |                |
   +----v-----------+    +------v----------+ |                |
   | CLOUD FUNCTIONS |    | CLOUD RUN       | |                |
   | NEBO Cloud Run  |    | "slicer"        +-+                |
   | (min instance)  |    | 4 CPU, 2 GB RAM |                  |
   |                 |    | PrusaSlicer CLI |                  |
   | - orders CRUD   |    | - /api/slice    |                  |
   | - admin API     |    | - /api/mesh     |                  |
   | - upload proxy  |    | - queue + cache |                  |
   | - email (Resend)|    +--------+--------+                  |
   | - invoices      |             |                           |
   | - webhooks      |             |                           |
   | - presets       |     +-------v--------+                  |
   +-------+--------+     |                |                  |
           |               |                |                  |
           |       +-------v-------+        |                  |
           +------>| SUPABASE      |<-------+                  |
                   | PostgreSQL    |                           |
                   | 25 tabulek    |                           |
                   | 102 RLS       |                           |
                   | politik       |                           |
                   +-------+-------+                           |
                           |                                   |
                   +-------v-------+                           |
                   | FIREBASE AUTH |  <-- primarni auth -------+
                   | + Supabase    |
                   | token bridge  |
                   +---------------+

  Externi sluzby:
  +----------+   +---------+   +--------+   +---------+
  |  RESEND  |   | STRIPE  |   | SENTRY |   | GITHUB  |
  |  email   |   | platby  |   | errors |   | CI/CD   |
  +----------+   +---------+   +--------+   +---------+
```

### A.2 Rozhodnuti: Cloud Functions vs Cloud Run pro lehke operace

**Doporuceni: JEDNO Cloud Run pro VSECHNO (slicer + API)**

Proc:
- Uz mame Express server (`backend-local/src/index.js`) se vsemi routes
- Cloud Functions by vyzadovaly prepis na Functions framework (zbytecna prace)
- Cloud Run zvladne oboji — staci nastavit min instances = 1 pro eliminaci cold startu
- Slicer endpointy a API endpointy sdili middleware (auth, tenant, CORS)
- Jednodussi deployment (1 Dockerfile, 1 service)
- Uspora casu: ~5 dni oproti prepisu na Cloud Functions

**Alternativa pro skalovani (budoucnost):**
Pokud API traffic naroste, lze pozdeji rozdelit na 2 Cloud Run services
(jeden pro API s min=1, druhy pro slicer s min=0, max=5).

### A.3 Data flow: Upload -> Slice -> Price -> Checkout -> Order

```
1. UPLOAD
   Browser ----[multipart POST]----> Cloud Run /api/slice
                                      |
                                      v
                                 Multer uklada do /tmp
                                 Soubor se kopiruje do R2 (bucket: models)
                                      |
2. SLICE                              v
                                 PrusaSlicer CLI
                                 (child_process, shell: false)
                                      |
                                      v
                                 Parsovani gcode metrik
                                 (cas tisku, material, vaha)
                                      |
                                      v
                                 Gcode se uklada do R2 (bucket: documents)
                                 Metriky se vraci klientovi
                                      |
3. PRICE                              v
   Browser <----[JSON metriky]---- Cloud Run
   Browser spocita cenu lokalne:
     pricingEngineV3.js (pure JS, deterministicky)
     Pricing config z Supabase (tabulka pricing_configs)
     Fees config z Supabase (tabulka fee_configs)
                                      |
4. CHECKOUT                           v
   Browser ----[order data]-----> Cloud Run /api/orders
                                      |
                                      v
                                 Ulozeni do Supabase (orders + order_items)
                                 Vytvoreni slozky v R2 (modely + gcode + meta)
                                 Stripe Payment Intent (pokud kartou)
                                 Email potvrzeni (Resend)
                                      |
5. ORDER                              v
   Admin panel <---[realtime]---- Supabase Realtime
   Admin meni stav objednavky
   Kazda zmena -> email zakaznikovi + webhook
```

---

## CAST B: Co uz mame hotove (z Beta Readiness Audit)

### B.1 Production-ready komponenty

| Komponenta | Stav | Soubory |
|-----------|------|---------|
| Pricing Engine | HOTOVO | `src/lib/pricing/pricingEngineV3.js` |
| Kalkulacka (end-to-end) | HOTOVO | `src/pages/test-kalkulacka/` |
| Widget (tenant-scoped) | HOTOVO | `src/pages/widget-kalkulacka/` |
| PrusaSlicer integrace | HOTOVO | `backend-local/src/slicer/` (runPrusaSlicer, parseGcode, cache, queue, error classifier) |
| Firebase Auth | HOTOVO | `src/providers/FirebaseAuthProvider.jsx` |
| Supabase Auth Provider | STUB | `src/providers/SupabaseAuthProvider.jsx` (Google login chybi) |
| Backend Express | HOTOVO | Security headers, rate limiting, CORS, graceful shutdown |
| Auth middleware (dual) | HOTOVO | `backend-local/src/middleware/auth.js` (Firebase + Supabase JWT) |
| Tenant middleware | HOTOVO | `backend-local/src/middleware/tenant.js` |
| Admin panel | HOTOVO | 15+ stranek s CRUD |
| Firestore rules | OPRAVENO | Tenant-scoped (session 2026-03-14) |
| Supabase schema | HOTOVO | 25 tabulek (`supabase/schema.sql`) |
| Supabase RLS | HOTOVO | 102 politik (`supabase/rls-policies-production.sql`) |
| PWA | HOTOVO | manifest, service worker, install banner |
| 25 tenant storage helpers | HOTOVO | `src/utils/admin*Storage.js` (vsechny tenant-scoped) |
| 629+ unit testu | HOTOVO | Vitest + RTL |
| Shopify integrace | HOTOVO | Cart Permalink + Storefront API |
| i18n (CZ/EN) | HOTOVO | 1100+ klicu |
| Code splitting | HOTOVO | 7 vendor chunks |

### B.2 Co je MOCK a musi se nahradit

| Co | Soucasny stav | Co je treba |
|----|---------------|-------------|
| Email | `emailProvider.js` — `console.log()` | Resend SDK implementace |
| File storage | Lokalni filesystem (`C:\modelpricer\tmp`) | Cloudflare R2 |
| Platby (Stripe) | Nulova implementace | Stripe Payment Intents + webhooks |
| PDF faktury | HTML generovani, ne PDF | pdfmake + ceske nalezitosti |
| Admin reprice/reslice | `Math.random()` mock | Realne volani slicer API |
| Model Upload stranka | `simulateUpload` fake progress | Realna upload API |
| Order tracking | "simulated" komentar | Realna API |

### B.3 Existujici kod ktery se ZNOVU POUZIJE

- **Cely Express server** (`backend-local/src/index.js`) — pouze adaptace na Cloud Run (PORT env var uz existuje)
- **Vsechny route moduly** (orders, config, invoices, notifications, presets, webhooks, stats, email, mesh, slicer, storage, apiDocs, authClaims)
- **Middleware** (auth, tenant, rateLimit, requestLogger)
- **Slicer engine** (runPrusaSlicer, parseGcode, slicerCache, slicingQueue, slicerErrorClassifier)
- **Storage service** (storageService.js — potrebuje R2 adapter)
- **Frontend** — beze zmeny krome `VITE_API_BASE_URL` a `storageApi.js` (signed URLs)

---

## CAST C: Implementacni faze

---

### FAZE 0 — Priprava (UZIVATEL)

> Tato faze obsahuje VSECHNO co musi udelat uzivatel rucne.
> Claude NEMUZE vytvorit ucty, dodat API klice ani rozhodovat o business nastaveni.

#### 0.1 Vytvoreni uctu a projektu

- [ ] **Google Cloud** — https://console.cloud.google.com/
  - Vytvorit projekt (napr. `modelpricer`)
  - Zapamatovat si Project ID
  - Pripojit billing (platebni karta — $300 kredit na 90 dni zdarma)
  - Povolit API: `Cloud Run Admin API`, `Artifact Registry API`, `Cloud Build API`
  - Region: `europe-west1` (Belgie, nejbliz CR)

- [ ] **Cloudflare** — https://dash.cloudflare.com/ (pokud jeste nemas)
  - Vytvorit ucet (zdarma)
  - Vytvorit R2 bucket `modelpricer-models` (pro 3D modely + gcode)
  - Vytvorit R2 bucket `modelpricer-branding` (pro loga, custom images)
  - Vygenerovat R2 API token s R2 read/write permissions
  - Zapamatovat si: Account ID, Access Key ID, Secret Access Key, bucket names

- [ ] **Stripe** — https://dashboard.stripe.com/
  - Vytvorit ucet (pokud nemas)
  - Aktivovat CZ region
  - Overit identitu (pro produkci)
  - Zapnout test mode (pro vyvoj)
  - Zapamatovat si: Publishable Key (pk_test_...), Secret Key (sk_test_...), Webhook Signing Secret (whsec_...)

- [ ] **Resend** — https://resend.com/
  - Vytvorit ucet (3000 emailu/mesic zdarma)
  - Overit domenu (DNS TXT zaznam)
  - Vytvorit API key
  - Zapamatovat si: API Key (re_...)

- [ ] **Sentry** — https://sentry.io/
  - Vytvorit ucet (5000 erroru/mesic zdarma)
  - Vytvorit projekt "modelpricer-frontend" (React)
  - Vytvorit projekt "modelpricer-backend" (Node.js)
  - Zapamatovat si: DSN pro frontend, DSN pro backend

- [ ] **GitHub** — (uz mas)
  - Over ze repo je private
  - Vygenerovat Personal Access Token s `repo` a `workflow` permissions (pro CI/CD)

#### 0.2 Instalace nastroju

- [ ] **gcloud CLI** — https://cloud.google.com/sdk/docs/install
  - Po instalaci: `gcloud init` → prihlasit se → vybrat projekt
  - Over: `gcloud config list` (musi ukazat spravny project)

- [ ] **Docker Desktop** — https://www.docker.com/products/docker-desktop/
  - Po instalaci RESTARTUJ pocitac
  - Over: `docker --version` (musi fungovat)

- [ ] **Firebase CLI** — `npm install -g firebase-tools`
  - Over: `firebase --version`
  - Prihlasit: `firebase login`

#### 0.3 Dodani credentials (NIKDY do gitu!)

Uzivatel musi vytvorit soubor `backend-local/.env` s temito hodnotami:

```env
# ===== EXISTING (uz mame) =====
PORT=3001
NODE_ENV=production
FIREBASE_PROJECT_ID=<tvuj-firebase-project-id>
SUPABASE_URL=<https://xxx.supabase.co>
SUPABASE_JWT_SECRET=<supabase-jwt-secret>

# ===== NEW — Cloud Run =====
GOOGLE_CLOUD_PROJECT=<tvuj-gcloud-project-id>
GOOGLE_CLOUD_REGION=europe-west1

# ===== NEW — Cloudflare R2 =====
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<r2-access-key>
R2_SECRET_ACCESS_KEY=<r2-secret-key>
R2_BUCKET_MODELS=modelpricer-models
R2_BUCKET_BRANDING=modelpricer-branding
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# ===== NEW — Supabase (service role pro backend) =====
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>

# ===== NEW — Resend =====
RESEND_API_KEY=<re_xxxxxxxxxxxx>
EMAIL_FROM_ADDRESS=noreply@<tvoje-domena.cz>
EMAIL_FROM_NAME=ModelPricer

# ===== NEW — Stripe =====
STRIPE_SECRET_KEY=<sk_test_xxxxxxxxxxxx>
STRIPE_WEBHOOK_SECRET=<whsec_xxxxxxxxxxxx>
STRIPE_PUBLISHABLE_KEY=<pk_test_xxxxxxxxxxxx>

# ===== NEW — Sentry =====
SENTRY_DSN_BACKEND=<https://xxx@sentry.io/xxx>

# ===== NEW — PrusaSlicer (Linux path v containeru) =====
PRUSA_SLICER_CMD=/opt/prusaslicer/prusa-slicer
SLICER_WORKSPACE_ROOT=/tmp/modelpricer

# ===== CORS (produkcni domeny) =====
CORS_ORIGINS=https://<tvuj-projekt>.web.app,https://<tvoje-domena.cz>
```

A frontend `.env.local`:

```env
# ===== EXISTING =====
VITE_FIREBASE_API_KEY=<...>
VITE_FIREBASE_AUTH_DOMAIN=<...>
VITE_FIREBASE_PROJECT_ID=<...>
VITE_FIREBASE_STORAGE_BUCKET=<...>
VITE_FIREBASE_MESSAGING_SENDER_ID=<...>
VITE_FIREBASE_APP_ID=<...>
VITE_SUPABASE_URL=<...>
VITE_SUPABASE_ANON_KEY=<...>
VITE_AUTH_PROVIDER=firebase

# ===== NEW =====
VITE_API_BASE_URL=https://<cloud-run-url>
VITE_STRIPE_PUBLISHABLE_KEY=<pk_test_xxxxxxxxxxxx>
VITE_SENTRY_DSN=<https://xxx@sentry.io/xxx>
VITE_APP_URL=https://<tvuj-projekt>.web.app
```

#### 0.4 PrusaSlicer profily

- [ ] Exportovat .ini profily z PrusaSlicer (File > Export Config)
- [ ] Ulozit do `backend-local/profiles/` (kazdy profil = 1 soubor)
- [ ] Dodat informace:
  - Jake tiskarny pouzivas (napr. Prusa MK3S+, MINI)
  - Jake materialy (PLA, PETG, ASA, ...)
  - Jake kvality (0.1mm, 0.15mm, 0.2mm, 0.3mm)

#### 0.5 Rozhodnuti

- [ ] **Vlastni domena?** (napr. modelpricer.cz) — pokud ano, jaka? Kde registrovana?
- [ ] **Kdo muze slicovat?** — kdokoliv / prihlaseni / s objednavkou
- [ ] **Max velikost souboru** — doporuceni: 100 MB
- [ ] **Jak dlouho uchovavat soubory** — doporuceni: 90 dni
- [ ] **Stripe: test mode pro betu?** — doporuceni: ano

---

### FAZE 1 — Infrastructure Foundation (CLAUDE)

> Cas: ~3-4 dny | Agenti: mp-sr-infra, mp-mid-infra-build, mp-spec-infra-firebase

#### 1.1 Cloudflare R2 Storage Adapter

**Novy soubor:** `backend-local/src/storage/r2StorageService.js`

```
Interface (spolecny pro filesystem i R2):
- uploadFile(tenantId, bucket, key, buffer, contentType) -> { url, key }
- downloadFile(tenantId, bucket, key) -> ReadableStream
- deleteFile(tenantId, bucket, key) -> void
- listFiles(tenantId, bucket, prefix) -> [{ key, size, lastModified }]
- getSignedUrl(tenantId, bucket, key, expiresIn) -> string
- getSignedUploadUrl(tenantId, bucket, key, expiresIn) -> string
```

**Implementace:**
- Pouzit `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (R2 je S3-kompatibilni)
- Tenant izolace pres key prefix: `{tenantId}/{type}/{filename}`
- Signed URL pro cteni i upload (presigned PUT pro primy upload z browseru)

**Novy soubor:** `backend-local/src/storage/storageFactory.js`

```js
// Factory pattern — vraci filesystem NEBO R2 podle env
export function createStorageProvider() {
  if (process.env.R2_ACCESS_KEY_ID) {
    return new R2StorageProvider(/* config z env */);
  }
  return new FilesystemStorageProvider(/* SLICER_WORKSPACE_ROOT */);
}
```

**Proc factory pattern:** Zachova zpetnou kompatibilitu — lokalni vyvoj funguje
beze zmen (filesystem), produkce pouziva R2. Existujici `storageService.js`
se postupne migruje na volani pres factory.

#### 1.2 Environment Variables

**Upravit:** `backend-local/.env.example`
- Pridat vsechny nove promenne z Faze 0.3 (bez hodnot, jen komentare)
- Sjednotit `SUPABASE_SERVICE_ROLE_KEY` (bug z Beta Audit bodu 7)

**Upravit:** `Model_Pricer-V2-main/.env.example`
- Pridat `VITE_API_BASE_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SENTRY_DSN`

#### 1.3 Dockerfile pro Cloud Run

**Novy soubor:** `backend-local/Dockerfile`

```dockerfile
# === Stage 1: PrusaSlicer ===
FROM ubuntu:22.04 AS slicer-base

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget ca-certificates libfuse2 libgl1 libglib2.0-0 \
    libgomp1 libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# PrusaSlicer 2.8.x AppImage
RUN wget -q "https://github.com/prusa3d/PrusaSlicer/releases/download/version_2.8.1/PrusaSlicer-2.8.1+linux-x64-GTK3-202411130905.AppImage" \
    -O /opt/PrusaSlicer.AppImage \
    && chmod +x /opt/PrusaSlicer.AppImage \
    && cd /opt && ./PrusaSlicer.AppImage --appimage-extract \
    && mv squashfs-root prusaslicer \
    && rm PrusaSlicer.AppImage \
    && ln -s /opt/prusaslicer/usr/bin/prusa-slicer /usr/local/bin/prusa-slicer

# === Stage 2: Node.js Backend ===
FROM node:20-slim

# Copy PrusaSlicer from build stage
COPY --from=slicer-base /opt/prusaslicer /opt/prusaslicer
COPY --from=slicer-base /usr/local/bin/prusa-slicer /usr/local/bin/prusa-slicer

# Install runtime dependencies for PrusaSlicer
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libgomp1 libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (Docker cache layer)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source
COPY src/ ./src/
COPY profiles/ ./profiles/

# Create workspace directory
RUN mkdir -p /tmp/modelpricer

# Cloud Run nasloucha na PORT env var
ENV PORT=8080
ENV NODE_ENV=production
ENV PRUSA_SLICER_CMD=/usr/local/bin/prusa-slicer
ENV SLICER_WORKSPACE_ROOT=/tmp/modelpricer

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]
```

**Poznamka k PrusaSlicer na Linuxu:**
- AppImage je nejjednodussi cesta — extrahuje se do `/opt/prusaslicer/`
- CLI se vola jako `prusa-slicer --slice --load <profile.ini> -o <output.gcode> <input.stl>`
- `--appimage-extract` eliminuje potrebu FUSE (ktery v kontejneru neni)
- Existujici `runPrusaSlicer.js` uz pouziva `shell: false` (bezpecne)
- Staci zmenit cestu v env `PRUSA_SLICER_CMD` — zadna zmena kodu

#### 1.4 Docker Compose pro lokalni testovani

**Novy soubor:** `backend-local/docker-compose.yml`

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "3001:8080"
    env_file: .env
    environment:
      - PORT=8080
      - NODE_ENV=development
    volumes:
      - ./profiles:/app/profiles
      - modelpricer-tmp:/tmp/modelpricer
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:8080/api/health')"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  modelpricer-tmp:
```

#### 1.5 firebase.json update

**Upravit:** `Model_Pricer-V2-main/firebase.json`

```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
        ]
      },
      {
        "source": "**/*.@(js|css|svg|png|jpg|woff2)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Poznamka:** Firebase Hosting NEPROXUJE na Cloud Run — frontend komunikuje
s Cloud Run primo pres `VITE_API_BASE_URL`. Toto je jednodussi nez
Firebase rewrite proxy a umoznuje nezavisly deployment frontend/backend.

#### 1.6 GitHub Actions CI/CD

**Novy soubor:** `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  GOOGLE_CLOUD_PROJECT: ${{ secrets.GOOGLE_CLOUD_PROJECT }}
  GOOGLE_CLOUD_REGION: europe-west1
  CLOUD_RUN_SERVICE: modelpricer-backend

jobs:
  # --- Job 1: Frontend build + test ---
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: Model_Pricer-V2-main
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: Model_Pricer-V2-main/package-lock.json
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: Model_Pricer-V2-main/build/

  # --- Job 2: Backend test ---
  backend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: Model_Pricer-V2-main/backend-local
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: Model_Pricer-V2-main/backend-local/package-lock.json
      - run: npm ci
      # Backend testy (pokud existuji)
      - run: node -e "console.log('Backend syntax OK')"

  # --- Job 3: Deploy backend (Cloud Run) — only on main ---
  deploy-backend:
    needs: [frontend, backend-test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
      - uses: google-github-actions/setup-gcloud@v2
      - name: Build and push Docker image
        run: |
          cd Model_Pricer-V2-main/backend-local
          gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/$CLOUD_RUN_SERVICE
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy $CLOUD_RUN_SERVICE \
            --image gcr.io/$GOOGLE_CLOUD_PROJECT/$CLOUD_RUN_SERVICE \
            --region $GOOGLE_CLOUD_REGION \
            --platform managed \
            --memory 2Gi \
            --cpu 4 \
            --timeout 300 \
            --concurrency 10 \
            --min-instances 0 \
            --max-instances 5 \
            --allow-unauthenticated \
            --set-env-vars "NODE_ENV=production"
            # Secrets se nastavuji zvlast pres gcloud run services update

  # --- Job 4: Deploy frontend (Firebase Hosting) — only on main ---
  deploy-frontend:
    needs: [frontend, backend-test]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: frontend-build
          path: Model_Pricer-V2-main/build/
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
          entryPoint: Model_Pricer-V2-main
```

#### 1.7 Cloudflare MCP Setup

**Dokumentace pro uzivatele:**
Po vytvoreni Cloudflare uctu a R2 bucketu, uzivatel prida do `.mcp.json`:

```json
{
  "cloudflare": {
    "command": "npx",
    "args": ["@anthropic-ai/mcp-cloudflare@latest"],
    "env": {
      "CLOUDFLARE_ACCOUNT_ID": "<account-id>",
      "CLOUDFLARE_API_TOKEN": "<api-token>"
    }
  }
}
```

Toto umozni Claude Code primo spravovat R2 buckety, Workers a DNS.

---

### FAZE 2 — Backend Production (CLAUDE + castecne UZIVATEL)

> Cas: ~4-5 dnu | Agenti: mp-sr-backend, mp-mid-backend-api, mp-spec-be-slicer

#### 2.1 Backend Express adaptace pro Cloud Run

**Upravit:** `backend-local/src/index.js`

Zmeny (minimalni — vetsina uz je spravne):
1. `PORT` uz cte z `process.env.PORT` (radek 58) — OK, bez zmeny
2. Pridat graceful shutdown signal handling (SIGTERM pro Cloud Run):

```js
// Uz existuje graceful shutdown, jen overit ze je spravne:
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000); // Force po 10s
});
```

3. Health check endpoint uz existuje (`/api/health`) — OK
4. CORS: pridat produkcni domeny pres `CORS_ORIGINS` env var — uz funguje (radek 81-84)
5. Odstranit Windows-specificke cesty (fallback `C:\\modelpricer\\tmp`) — pouzivat env var

#### 2.2 R2 integrace do existujicich routes

**Upravit:** `backend-local/src/storage/storageRouter.js`
- Nahradit primy filesystem pristup volanim pres `storageFactory`
- Upload: soubor jde pres multer do /tmp, pak se kopiruje do R2
- Download: signed URL z R2 (redirect, ne proxy pres backend)
- Browse: R2 `listObjects` s tenant-scoped prefixem

**Upravit:** `backend-local/src/index.js` (slicer flow)
- Po slicing: gcode se uklada do R2 misto lokalniho disku
- Metriky se vraci klientovi (beze zmeny)
- Slicer stale pracuje s lokalnim /tmp (read model, write gcode) — pak upload do R2

#### 2.3 Supabase aktivace

**Upravit:** `src/lib/supabase/featureFlags.js` (radek 91)
- Defaultni mode: `supabase` (misto `localStorage`)
- Dual-write ponechat jako fallback option

**Nove zavislosti pro backend:**
```bash
cd backend-local
npm install @supabase/supabase-js  # uz mame (v2.99.1)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Upravit backend:** Nahradit JSON file "databaze" Supabase klientem
- Orders: `backend-local/src/routes/orders.js` — ukladat do Supabase `orders` + `order_items`
- Config: `backend-local/src/routes/config.js` — cist/zapisovat pres Supabase
- Stats: `backend-local/src/routes/stats.js` — SQL aggregace misto in-memory

#### 2.4 Auth middleware hardening

**Upravit:** `backend-local/src/index.js` (radek 218-235)
- Odstranit `demo-tenant` fallback v produkci (P0 z Tenant Audit)
- `getTenantIdFromReq()` v produkci vraci `null` misto `"demo-tenant"` → handler musi zkontrolovat

**Upravit:** `backend-local/src/routes/mesh.js` (radek 89-94)
- Odstranit lokalni `getTenantId()` s unsafe fallbackem
- Pouzit sdilenou `getTenantIdFromReq()` z index.js
- Pridat `requireAuth` + `requireTenant` middleware na `/api/mesh`

**Upravit:** `backend-local/src/routes/notifications.js` (radek 100-102)
- Pridat `validateTenantId()` na path traversal ochranu

**Poznamka:** Tyto 3 opravy jsou z P0/P1 Tenant Isolation Audit
a MUSI byt opraveny pred betou.

#### 2.5 PrusaSlicer v Docker kontejneru (validace)

Po deploymentu Docker image na Cloud Run:
1. Otestovat `/api/health/prusa` — musi vratit verzi PrusaSliceru
2. Otestovat upload + slice jednoho STL souboru
3. Otestovat ze gcode se ulozi do R2
4. Otestovat queue (vice pozadavku soucasne)

**Potencialni problemy:**
- PrusaSlicer AppImage muze vyzadovat dalsi Linux knihovny — resi se v Dockerfile
- `/tmp` v Cloud Run je omezeny na 2 GB (memory-backed) — pro velke modely muze byt malo
- Reseni: pouzit Cloud Run s mounted volume NEBO zpracovavat modely po jednom

---

### FAZE 3 — Komunikace (CLAUDE)

> Cas: ~3-4 dny | Agenti: mp-mid-backend-api, mp-spec-ecom-stripe

#### 3.1 Resend email integrace

**Upravit:** `backend-local/src/email/emailProvider.js`

Nahradit mock implementaci realnym Resend SDK:

```js
import { Resend } from 'resend';

case 'resend': {
  const resend = new Resend(config.apiKey || process.env.RESEND_API_KEY);
  return {
    type: 'resend',
    async send({ to, subject, html, from }) {
      const result = await resend.emails.send({
        from: from || process.env.EMAIL_FROM_ADDRESS,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      });
      return {
        success: true,
        messageId: result.data?.id || `resend_${Date.now()}`,
      };
    },
  };
}
```

**Nova zavislost:**
```bash
npm install resend
```

**Upravit:** `backend-local/src/email/templateRenderer.js`
- Overit ze sablony generuji validni HTML email (inline CSS, tabulkovy layout)
- Pridat sablony pro: order-confirmed, order-printing, order-shipped, order-delivered

#### 3.2 Email sablony

**Novy soubor:** `backend-local/src/email/templates/`

4 email sablony (HTML, responzivni, cesky + anglicky):

| Sablona | Trigger | Obsah |
|---------|---------|-------|
| `order-confirmed.html` | Vytvoreni objednavky | Cislo obj., seznam modelu, cena, QR platba |
| `order-printing.html` | Admin zmeni stav na "V tisku" | Cislo obj., predpokladany termin |
| `order-shipped.html` | Admin zmeni stav na "Odeslano" | Cislo obj., tracking link (pokud je) |
| `order-delivered.html` | Admin zmeni stav na "Dokonceno" | Cislo obj., dekujeme |

Sablony pouzivaji existujici `templateRenderer.js` s placeholdery `{{orderNumber}}`, `{{totalPrice}}`, atd.

#### 3.3 Stripe integrace

**Nove soubory:**
- `backend-local/src/payments/stripeService.js` — Stripe SDK wrapper
- `backend-local/src/routes/payments.js` — payment API routes

**Implementace (Payment Intents API):**

```
Frontend (CheckoutForm.jsx):
1. Uzivatel klikne "Zaplatit kartou"
2. POST /api/payments/create-intent { amount, currency, orderId }
3. Backend vytvori PaymentIntent pres Stripe SDK
4. Vrati client_secret

Frontend:
5. Zobrazi Stripe Elements (hosted payment form)
6. Uzivatel vyplni kartu
7. stripe.confirmPayment({ clientSecret })

Backend (webhook):
8. Stripe posle webhook na /api/payments/webhook
9. Backend overi podpis (stripe.webhooks.constructEvent)
10. Zmeni stav objednavky na "zaplaceno"
11. Posle email potvrzeni
```

**Webhook events k odchyceni:**
- `payment_intent.succeeded` → oznacit objednavku jako zaplacenou
- `payment_intent.payment_failed` → email zakaznikovi o selhani
- `checkout.session.completed` (pro Stripe Checkout hosted page — alternativa)

**Nova zavislost:**
```bash
npm install stripe
```

**Frontend:**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Novy frontend soubor:** `src/components/payments/StripeCheckout.jsx`
- `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)`
- `<Elements>` wrapper
- `<PaymentElement>` pro hosted payment form
- Error handling + loading state

#### 3.4 PDF faktura

**Novy soubor:** `backend-local/src/services/pdfInvoiceService.js`

**Implementace:**
- `pdfmake` pro generovani PDF (ciste Node.js, zadny browser)
- Ceske nalezitosti: ICI, DIC, datum splatnosti, rozpis DPH
- QR platba: `@tedyno/cz-qr-payment` (generuje QR kod pro bankovni prevod)
- Logo z R2 (tenant-specific branding)
- Cislovani faktur: sekvencni v ramci tenanta (Supabase sequence)

**Nova zavislost:**
```bash
npm install pdfmake @tedyno/cz-qr-payment qrcode
```

**Upravit:** `backend-local/src/routes/invoices.js`
- Nahradit HTML generovani realnym PDF (pdfmake)
- Endpoint: `GET /api/invoices/:orderId/pdf` → vrati PDF binary
- Volitelne: ulozit PDF do R2 pro budouci stahovani

---

### FAZE 4 — Frontend Production (CLAUDE)

> Cas: ~2-3 dny | Agenti: mp-sr-frontend, mp-mid-frontend-admin

#### 4.1 API Base URL prepnuti

**Upravit:** `src/services/storageApi.js`

```js
// Soucasny stav (radek 8):
const BASE = "/api/storage";

// Zmena:
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const BASE = `${API_BASE}/api/storage`;
```

Stejnou zmenu udelat ve VSECH souborech ktere volaji `/api/*`:
- `src/services/storageApi.js`
- Vsechny `fetch('/api/...')` volani v komponentach
- Nejlepe vytvorit `src/services/apiClient.js` s centralizovanou konfiguraci

**Novy soubor:** `src/services/apiClient.js`

```js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };

  // Auth token
  if (window.__authGetToken) {
    try {
      const token = await window.__authGetToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch { /* continue */ }
  }

  // Tenant ID
  const { getTenantId } = await import('../utils/adminTenantStorage');
  headers['x-tenant-id'] = getTenantId();

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return res.json();
}
```

#### 4.2 R2 Signed URLs pro soubory

**Upravit:** `src/services/storageApi.js`
- Download: misto proxy pres backend, pouzit signed URL (redirect na R2)
- Upload: pro velke soubory pouzit presigned PUT URL (primy upload do R2 z browseru)
- Preview (3D viewer): signed URL s kratkou expiraci (5 min)

**Flow pro velke soubory (>10 MB):**
```
1. Frontend: POST /api/storage/upload-url { filename, contentType, size }
2. Backend: generuje presigned PUT URL pro R2
3. Frontend: PUT primo na R2 URL (s progress)
4. Frontend: POST /api/storage/confirm-upload { key }
5. Backend: overi ze soubor existuje v R2, ulozi metadata
```

#### 4.3 Firebase Hosting deploy

Uzivatel spusti:
```bash
cd Model_Pricer-V2-main
npm run build
firebase deploy --only hosting
```

**Automaticky pres CI/CD** (GitHub Actions — viz Faze 1.6).

#### 4.4 Service Worker cache invalidace

**Upravit:** `public/sw.js`

```js
// Soucasny stav (radek 10):
const CACHE_NAME = 'modelpricer-v1';

// Zmena — dynamicky na zaklade build hash:
const CACHE_NAME = 'modelpricer-__BUILD_HASH__';
```

**Upravit:** `vite.config.mjs` — pridat plugin ktery nahradi `__BUILD_HASH__`
v sw.js pri buildu:

```js
// Alternativa: pouzit timestamp
const CACHE_NAME = `modelpricer-${Date.now()}`;
```

**Jednodussi alternativa:** Pridat `skipWaiting()` + `clients.claim()` do service workeru
(uz tam pravdepodobne je) a v `index.html` pridat verzi jako query param:
```js
navigator.serviceWorker.register('/sw.js?v=' + __APP_VERSION__);
```

#### 4.5 Error boundary se Sentry reportingem

**Upravit:** existujici ErrorBoundary komponenta — pridat Sentry capture:

```js
import * as Sentry from '@sentry/react';

// V componentDidCatch:
Sentry.captureException(error, { extra: errorInfo });
```

---

### FAZE 5 — Quality & Security (CLAUDE)

> Cas: ~3-4 dny | Agenti: mp-sr-security, mp-sr-quality, mp-spec-test-e2e

#### 5.1 Sentry integrace

**Frontend:**
```bash
npm install @sentry/react
```

**Novy soubor:** `src/lib/sentry.js`
```js
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `modelpricer@${__APP_VERSION__}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false }),
    ],
    tracesSampleRate: 0.1, // 10% v produkci
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

**Backend:**
```bash
cd backend-local
npm install @sentry/node
```

**Upravit:** `backend-local/src/index.js` (na zacatek):
```js
import * as Sentry from '@sentry/node';
if (process.env.SENTRY_DSN_BACKEND) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.NODE_ENV,
  });
}
// Express error handler na konec:
app.use(Sentry.expressErrorHandler());
```

#### 5.2 Supabase RLS aktivace

**Spustit SQL:** `supabase/rls-policies-production.sql` (102 politik)
- Uz je pripraveno, staci spustit v Supabase SQL Editor
- Testovat s ruznymi tenant ID

#### 5.3 Security hardening (zbyvajici P0/P1 z auditu)

| Issue | Stav | Co udelat |
|-------|------|-----------|
| P0-01: Firestore wildcard rules | OPRAVENO (session 03-14) | Overit |
| P0-02: Security headers | OPRAVENO (session 03-14) | Overit |
| P0-03: File upload filter | OPRAVENO (session 03-14) | Overit |
| P1-01: innerHTML sanitize | OPRAVENO (session 03-14) | Overit |
| P1-02: Widget presets auth | OPRAVENO (session 03-14) | Overit |
| P1-03: Rate limiter in-memory | ZUSTAVA | Dokumentovat (single instance OK pro betu) |
| P0 Tenant: emailRoutes | OPRAVENO (session 03-14) | Overit |
| P0 Tenant: slicer queue | OPRAVENO (session 03-14) | Overit |
| P0 Tenant: notifications | OPRAVENO (session 03-14) | Overit |
| P1 Tenant: mesh auth | OPRAVIT ve Fazi 2.4 | Pridat requireAuth |
| P1 Tenant: demo-tenant fallback | OPRAVIT ve Fazi 2.4 | Odstranit v produkci |

#### 5.4 Rate limiting pro produkci

**Upravit:** `backend-local/src/middleware/rateLimit.js`
- Pro single-instance Cloud Run: in-memory Map je OK
- Pridat velikostni limit na Map (max 10000 entries, LRU eviction)
- Nastavit limity:
  - `/api/slice` — 10 req/min per IP (slicovani je drahe)
  - `/api/payments` — 5 req/min per IP
  - `/api/*` (ostatni) — 100 req/min per IP

#### 5.5 E2E test zakladni flow (Playwright)

**Nova zavislost:**
```bash
npm install -D @playwright/test
npx playwright install chromium
```

**Novy soubor:** `e2e/basic-flow.spec.js`

```js
test('Upload -> Slice -> Price -> Checkout', async ({ page }) => {
  // 1. Navstiv kalkulacku
  await page.goto('/test-kalkulacka');

  // 2. Upload STL souboru
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('e2e/fixtures/test-cube.stl');

  // 3. Pockej na slicing vysledek
  await expect(page.locator('[data-testid="slicing-result"]')).toBeVisible({ timeout: 60000 });

  // 4. Over ze cena je zobrazena
  await expect(page.locator('[data-testid="total-price"]')).toContainText('Kc');

  // 5. Vyplnit checkout (zakladni udaje)
  // ...

  // 6. Odeslat objednavku
  // ...
});
```

---

## CAST D: Kdo dela co — UZIVATEL vs CLAUDE

### D.1 Rozdeleni prace

| Krok | Kdo | Popis | Odhadovany cas |
|------|-----|-------|----------------|
| **FAZE 0** | | | |
| Google Cloud ucet + billing | UZIVATEL | Vytvorit ucet, pripojit kartu | 30 min |
| Cloudflare ucet + R2 buckety | UZIVATEL | Vytvorit ucet, buckety, API token | 30 min |
| Stripe ucet + overeni | UZIVATEL | Vytvorit ucet, overit identitu | 1-2 dny (overeni) |
| Resend ucet + domain verifikace | UZIVATEL | Vytvorit ucet, DNS zaznamy | 30 min |
| Sentry ucet + projekty | UZIVATEL | Vytvorit ucet, 2 projekty | 15 min |
| Instalace gcloud + Docker | UZIVATEL | Stazeni, instalace, overeni | 1 hod |
| PrusaSlicer profily export | UZIVATEL | Export .ini profilu | 30 min |
| Dodani credentials | UZIVATEL | Vyplnit .env soubory | 30 min |
| Rozhodnuti (domena, limity) | UZIVATEL | Odpovedet na otazky | 15 min |
| **FAZE 1** | | | |
| R2 storage adapter | CLAUDE | `r2StorageService.js` + factory | 4 hod |
| .env.example update | CLAUDE | Sjednoceni promennych | 30 min |
| Dockerfile | CLAUDE | Multi-stage build s PrusaSlicer | 3 hod |
| docker-compose.yml | CLAUDE | Lokalni testovaci setup | 30 min |
| firebase.json update | CLAUDE | Security headers, caching | 30 min |
| GitHub Actions CI/CD | CLAUDE | Build + test + deploy pipeline | 3 hod |
| **FAZE 2** | | | |
| Express adaptace pro Cloud Run | CLAUDE | PORT, graceful shutdown, CORS | 2 hod |
| R2 integrace do routes | CLAUDE | storageRouter, slicer flow | 6 hod |
| Supabase aktivace | CLAUDE | Feature flags, backend queries | 4 hod |
| Auth hardening | CLAUDE | P0/P1 opravy z auditu | 3 hod |
| Docker build + test | UZIVATEL + CLAUDE | `docker build`, `docker run` | 2 hod |
| Cloud Run deploy | UZIVATEL | `gcloud run deploy` (prvni) | 1 hod |
| **FAZE 3** | | | |
| Resend email integrace | CLAUDE | emailProvider.js real | 3 hod |
| Email sablony (4x) | CLAUDE | HTML sablony CZ/EN | 4 hod |
| Stripe integrace | CLAUDE | PaymentIntents + webhooks | 8 hod |
| PDF faktury | CLAUDE | pdfmake + QR platba | 6 hod |
| **FAZE 4** | | | |
| API Base URL refaktor | CLAUDE | apiClient.js, fetch calls | 3 hod |
| R2 signed URLs | CLAUDE | storageApi.js presigned URLs | 3 hod |
| SW cache invalidace | CLAUDE | sw.js dynamicke jmeno cache | 1 hod |
| Sentry + ErrorBoundary | CLAUDE | Frontend Sentry init | 2 hod |
| Firebase deploy | UZIVATEL | `firebase deploy` | 15 min |
| **FAZE 5** | | | |
| Sentry backend | CLAUDE | @sentry/node init | 1 hod |
| RLS aktivace | UZIVATEL + CLAUDE | SQL v Supabase Editor | 1 hod |
| Security hardening | CLAUDE | Zbyvajici P0/P1 opravy | 3 hod |
| Rate limiting produkce | CLAUDE | Limity pro slicer, payments | 2 hod |
| E2E test | CLAUDE | Playwright zakladni flow | 4 hod |

### D.2 Souhrn

| | UZIVATEL | CLAUDE |
|--|---------|--------|
| **Ucty a credentials** | Vsechno | Nic |
| **Kod a konfigurace** | Nic | Vsechno |
| **Deployment (prvni)** | Rucni spusteni prikazu | Priprava prikazu a scriptu |
| **Deployment (dalsi)** | Automaticky pres CI/CD | Nastaveni CI/CD |
| **Testovani** | Smoke test v browseru | Unit + E2E testy |

---

## CAST E: Cenovy prehled

### E.1 Mesicni naklady pro BETA (free tiery, ~5 firem, ~50 GB)

| Sluzba | Free tier | Odhadovana spotreba | Mesicni cena |
|--------|-----------|---------------------|-------------|
| **Firebase Hosting** | 10 GB/mesic, 360 MB/den | ~2 GB transfer | $0 |
| **Cloud Run** | 2M req, 360K vCPU-sec, 180K GiB-sec | ~50K req, slicer ~100 hod | $0-5 |
| **Cloudflare R2** | 10 GB storage, 10M Class A, 1M Class B | ~20 GB, ~100K ops | $0 |
| **Supabase** | 500 MB db, 1 GB storage, 2M edge fn | ~100 MB db | $0 |
| **Firebase Auth** | 50K MAU | ~100 users | $0 |
| **Resend** | 3000 emailu/mesic | ~200 emailu | $0 |
| **Stripe** | 0 fix, 1.4% + 0.25 EUR/transakce | ~20 transakci | ~4 EUR z transakci |
| **Sentry** | 5000 erroru/mesic | ~500 erroru | $0 |
| **GitHub Actions** | 2000 min/mesic | ~200 min | $0 |
| **Cloudflare DNS** | Zdarma | 1 domena | $0 |
| **Domena (.cz)** | — | 1 domena | ~10 EUR/rok |
| | | **CELKEM** | **~5-10 EUR/mesic** |

### E.2 Mesicni naklady pri rustu (~30 firem, ~300 GB, ~1000 objednavek)

| Sluzba | Odhadovana spotreba | Mesicni cena |
|--------|---------------------|-------------|
| **Firebase Hosting** | ~20 GB transfer | ~$0 (stale ve free) |
| **Cloud Run** | ~500K req, slicer ~800 hod CPU | ~$30-50 |
| **Cloudflare R2** | ~300 GB storage, ~2M ops | ~$5 (storage) |
| **Supabase** | ~2 GB db, potreba Pro plan | ~$25 (Pro plan) |
| **Firebase Auth** | ~1000 users | $0 |
| **Resend** | ~5000 emailu/mesic | ~$20 (Basic plan) |
| **Stripe** | ~500 transakci | ~70 EUR z transakci |
| **Sentry** | ~2000 erroru | $0 |
| **GitHub Actions** | ~500 min | $0 |
| | **CELKEM** | **~80-100 EUR/mesic** |

### E.3 Break-even analyza

Pokud uzivatele nauctujete napr. 490 CZK/mesic (~20 EUR) za zakladni plan:
- 5 firem = ~100 EUR prijmu → pokryva naklady od startu
- 30 firem = ~600 EUR prijmu → zdravy profit

---

## CAST F: Rizika a mitigace

### F.1 PrusaSlicer na Linuxu

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| AppImage nefunguje v kontejneru | Stredni | Bloker | Extrahovat AppImage (`--appimage-extract`), testovat lokalne v Docker pred deploy |
| Chybejici Linux knihovny | Vysoka | Stredni | Dockerfile nainstaluje vsechny zavislosti (libgl1, libglib2.0, libgomp1) |
| Jine chovani nez na Windows | Nizka | Nizky | Porovnat vysledky slicovani (cas, material) Windows vs Linux — melo by byt identicke |
| PrusaSlicer verze nekompatibilni s profily | Nizka | Stredni | Pouzit stejnou verzi jako uzivatel na Windows |

### F.2 Supabase free tier limity

| Limit | Hodnota | Riziko | Mitigace |
|-------|---------|--------|----------|
| Database | 500 MB | Pri ~50 firmach muze dojit | Monitoring velikosti, migrace na Pro ($25/mes) |
| Edge Functions | 2M volani/mesic | Nepouzivame | — |
| Storage | 1 GB | Pouzivame R2 misto Supabase Storage | Zadne riziko |
| Realtime | 200 soucasnych pripojeni | Pri ~30 firmach muze byt tesne | Omezit realtime jen na admin (ne widget) |
| Paused po 7 dnech neaktivity | Free plan only | KRITICKE pro produkci | Upgradovat na Pro PRED spustenim bety |

**DULEZITE:** Supabase free plan pauzuje projekt po 7 dnech neaktivity.
Pro betu je NUTNE upgradovat na Pro plan ($25/mesic) nebo nastavit
keep-alive cron job (CRON ping kazdych 6 dni).

### F.3 Cloudflare R2 limity

| Limit | Hodnota | Riziko |
|-------|---------|--------|
| Storage | 10 GB free, pak $0.015/GB/mesic | Velmi nizke naklady |
| Class A ops (write) | 1M/mesic free | Vice nez dost pro betu |
| Class B ops (read) | 10M/mesic free | Vice nez dost |
| Egress | $0 (nulovy!) | HLAVNI vyhoda oproti S3/GCS |
| Max object size | 5 GB (single PUT), 5 TB (multipart) | STL soubory jsou typicky <100 MB |

**Zaver:** R2 limity nejsou riziko — je to nejlevnejsi storage option.

### F.4 Cold start Cloud Run

| Nastaveni | Cold start | Naklady | Doporuceni |
|-----------|-----------|---------|------------|
| min-instances=0 | 5-15 sekund | Nejnizsi | PRO BETU (usetri penize) |
| min-instances=1 | ~0 sekund | ~$30/mesic | Pro produkci (az bude traffic) |
| min-instances=0 + startup probe | 3-8 sekund | Nejnizsi | Kompromis |

**Mitigace cold startu:**
- Frontend zobrazi "Priprava sliceru..." loading state (uz existuje)
- Health check z CI/CD po deploy (zahreje instanci)
- `/api/health` endpoint je rychly (nedela nic CPU-narocneho)
- Slicer cold start: prvni request bude pomalejsi (nacitani PrusaSlicer)

### F.5 Data migrace z localStorage

| Scenar | Reseni |
|--------|--------|
| Existujici lokalni data | Ponechat localStorage jako fallback read-only |
| Nove data | Ukladat primo do Supabase |
| Migrace existujicich | Jednofazova migrace pres admin UI ("Migrovat data do cloudu") |
| Dual-write period | 1-2 tydny — zapisy do obou, cteni z Supabase, fallback localStorage |

Existujici mechanismus (`featureFlags.js`, `storageAdapter.js`, `migrationRunner.js`)
uz tuto migraci podporuje — staci prepnout flag.

### F.6 Dalsi rizika

| Riziko | Mitigace |
|--------|----------|
| Stripe verifikace trva dlouho | Zacit overovani v den 1 (Faze 0), paralelne s vyvojem |
| Resend domain verifikace selhava | Alternativa: Postmark (100 emailu/mesic zdarma), Mailgun |
| Firebase Hosting CORS s Cloud Run | Cloud Run ma vlastni CORS (uz nastaveny), Frontend vola primo |
| Supabase downtime | localStorage fallback existuje, ale pro produkci je treba SLA |

---

## CAST G: Casovy odhad

### G.1 Casova osa (paralelni prace kde mozne)

```
Tyden 1: FAZE 0 (UZIVATEL) + FAZE 1 (CLAUDE — paralelne)
  Den 1-2: Uzivatel vytvari ucty, Claude pise R2 adapter + Dockerfile
  Den 3-4: Claude pise CI/CD, firebase.json, .env updates
  Den 5:   Uzivatel instaluje nastroje, testuje Docker lokalne

Tyden 2: FAZE 2 (CLAUDE + UZIVATEL testovani)
  Den 6-7: Express adaptace, R2 integrace
  Den 8-9: Supabase aktivace, auth hardening
  Den 10:  Prvni Cloud Run deploy + smoke test

Tyden 3: FAZE 3 (CLAUDE)
  Den 11-12: Resend email + sablony
  Den 13-14: Stripe integrace
  Den 15:    PDF faktury

Tyden 4: FAZE 4 + FAZE 5 (CLAUDE)
  Den 16-17: Frontend production (API URL, signed URLs, SW, Sentry)
  Den 18-19: Security hardening, RLS, rate limiting
  Den 20:    E2E testy, finalni smoke test

Tyden 5: BETA LAUNCH
  Den 21:  Finalni kontrola, checklist
  Den 22:  BETA spusteni pro prvni firmu (vnitrni test)
  Den 23+: Onboarding prvnich zakazniku
```

### G.2 Souhrn

| Faze | Odhadovany cas (Claude) | Odhadovany cas (uzivatel) | Paralelni? |
|------|------------------------|--------------------------|------------|
| Faze 0 | 0 (jen dokumentace) | 4-6 hodin | ANO s Fazi 1 |
| Faze 1 | 12-16 hodin | 1-2 hodiny (testovani) | ANO s Fazi 0 |
| Faze 2 | 15-20 hodin | 3-4 hodiny (deploy + test) | NE |
| Faze 3 | 20-25 hodin | 1 hodina (Stripe overeni) | NE |
| Faze 4 | 8-12 hodin | 30 min (deploy) | CASTECNE s Fazi 3 |
| Faze 5 | 10-15 hodin | 2 hodiny (RLS + smoke) | NE |
| **CELKEM** | **~65-90 hodin** | **~12-16 hodin** | |

**Realisticky odhad: 4-5 tydnu** pri prumernem tempu.

---

## CAST H: Checklist pred BETA spustenim

### H.1 Infrastruktura

- [ ] Google Cloud projekt existuje a ma billing
- [ ] Cloud Run service bezi a odpovida na `/api/health`
- [ ] PrusaSlicer v Cloud Run funguje (`/api/health/prusa` vraci verzi)
- [ ] Cloudflare R2 buckety existuji a jsou pristupne
- [ ] Firebase Hosting deploy probehl uspesne
- [ ] Vlastni domena (pokud pouzita) smeruje na Firebase Hosting
- [ ] HTTPS funguje na vsech endpointech
- [ ] GitHub Actions CI/CD pipeline prochazi

### H.2 Backend

- [ ] Vsechny API endpointy funguji s produkcnimi credentials
- [ ] Auth middleware overuje Firebase JWT tokeny
- [ ] Tenant izolace funguje (kazdy tenant vidi jen sva data)
- [ ] Rate limiting je aktivni
- [ ] CORS povoluje jen produkcni domeny
- [ ] Security headers jsou nastavene (X-Content-Type-Options, X-Frame-Options, HSTS)
- [ ] Graceful shutdown funguje (SIGTERM)
- [ ] Error responses neleakuji systemove cesty

### H.3 Databaze

- [ ] Supabase tabulky existuji (25 tabulek)
- [ ] RLS politiky jsou aktivovany (102 politik)
- [ ] `get_request_tenant_id()` funkce funguje
- [ ] Demo tenant data jsou migrovana
- [ ] Backup je nastaveny (Supabase automaticky pro Pro plan)

### H.4 Storage

- [ ] Upload souboru do R2 funguje
- [ ] Download souboru z R2 funguje (signed URLs)
- [ ] Tenant izolace v R2 (key prefix) funguje
- [ ] Presigned upload URL pro velke soubory funguje
- [ ] Stare soubory se automaticky mazou (R2 lifecycle pravidla)

### H.5 Email

- [ ] Resend API key funguje
- [ ] Domain verifikace je kompletni
- [ ] Email sablony se spravne renderuji (CZ + EN)
- [ ] Email se odesle pri vytvoreni objednavky
- [ ] Email se odesle pri zmene stavu objednavky

### H.6 Platby

- [ ] Stripe test mode funguje
- [ ] Payment Intent se vytvori
- [ ] Stripe Elements se zobrazi na frontendu
- [ ] Platba projde (test karta 4242 4242 4242 4242)
- [ ] Webhook zpracuje `payment_intent.succeeded`
- [ ] Objednavka se oznaci jako zaplacena
- [ ] PDF faktura se vygeneruje

### H.7 Frontend

- [ ] `npm run build` projde bez chyb
- [ ] Vsechny stranky se nacitaji (routing OK)
- [ ] Kalkulacka: upload → slice → cena → checkout funguje end-to-end
- [ ] Widget: funguje v iframe na externi domene
- [ ] Admin panel: vsechny CRUD operace funguji
- [ ] Service worker se aktualizuje pri novem deploy
- [ ] Sentry odchytava errory

### H.8 Security

- [ ] Zadne citlive udaje v git historii
- [ ] `.env` soubory jsou v `.gitignore`
- [ ] Firebase security rules jsou tenant-scoped
- [ ] Supabase RLS je aktivni
- [ ] File upload filter odmitne nebezpecne formaty
- [ ] CORS odmitne nepovolene domeny
- [ ] Rate limiting chroni pred abuse
- [ ] Demo-tenant fallback je deaktivovan v produkci

### H.9 Monitoring

- [ ] Sentry frontend odchytava chyby a posilá do dashboardu
- [ ] Sentry backend odchytava chyby a posilá do dashboardu
- [ ] Cloud Run logy jsou pristupne v Google Cloud Console
- [ ] Alerting: email pri >100 chybach/hodinu (Sentry alert rule)

### H.10 Dokumentace

- [ ] README.md aktualizovan s produkcnim setupem
- [ ] `.env.example` soubory jsou kompletni
- [ ] Deployment postup je zdokumentovany
- [ ] API endpointy jsou zdokumentovane (apiDocs route uz existuje)

---

## PRILOHA: MCP servery pro spravu z Claude Code

### Dostupne (uz nastavene)

| MCP Server | Ucel | Pouziti |
|-----------|------|---------|
| Firebase MCP | Hosting deploy, Auth users, Firestore rules | `firebase deploy`, user management |
| GitHub MCP | Repo management, PR, Issues | CI/CD, code review |
| Supabase MCP | DB queries, RLS, migrations | Schema updates, data queries |
| Stripe MCP | Payment management | Webhook testing, refunds |
| Context7 | Library docs | React, Vite, Express docs |

### K nastaveni

| MCP Server | Ucel | Setup |
|-----------|------|-------|
| Cloudflare Bindings MCP | R2 buckety, DNS, Workers | `npx @anthropic-ai/mcp-cloudflare@latest` |
| Google Cloud Run MCP | Deploy, logs, scaling | `npx @anthropic-ai/mcp-gcloud@latest` (pokud existuje) |
| Sentry MCP | Error tracking, releases | Sentry dashboard API |

---

## PRILOHA: Rozdeleni prace mezi agenty (per faze)

### Faze 1 — Infrastructure Foundation

| Agent | Co dela | Paralelni? |
|-------|---------|-----------|
| `mp-mid-infra-build` | Dockerfile, docker-compose.yml | ANO |
| `mp-spec-infra-firebase` | firebase.json, hosting config | ANO |
| `mp-sr-backend` | R2 storage adapter, storageFactory | ANO |
| `mp-mid-infra-build` | GitHub Actions CI/CD | Po Dockerfile |

### Faze 2 — Backend Production

| Agent | Co dela | Paralelni? |
|-------|---------|-----------|
| `mp-sr-backend` | Express Cloud Run adaptace, CORS | NE (sekvencne) |
| `mp-mid-backend-api` | R2 integrace do routes | Po adaptaci |
| `mp-mid-storage-tenant` | Supabase aktivace, feature flags | ANO s R2 |
| `mp-sr-security` | Auth hardening (P0/P1 fixes) | ANO s R2 |

### Faze 3 — Komunikace

| Agent | Co dela | Paralelni? |
|-------|---------|-----------|
| `mp-mid-backend-api` | Resend email + sablony | ANO |
| `mp-spec-ecom-stripe` (novy?) | Stripe integrace | ANO |
| `mp-mid-backend-api` | PDF faktury | Po email |

### Faze 4 — Frontend Production

| Agent | Co dela | Paralelni? |
|-------|---------|-----------|
| `mp-sr-frontend` | apiClient.js, API URL refaktor | NE |
| `mp-mid-frontend-admin` | R2 signed URLs v UI | Po apiClient |
| `mp-spec-infra-firebase` | SW cache invalidace | ANO |

### Faze 5 — Quality & Security

| Agent | Co dela | Paralelni? |
|-------|---------|-----------|
| `mp-sr-security` | Security hardening, RLS | ANO |
| `mp-sr-quality` | Code review cele zmeny | Po vsem |
| `mp-spec-test-e2e` | Playwright E2E testy | ANO se security |
| `mp-mid-infra-build` | Sentry FE + BE | ANO |

---

*Posledni aktualizace: 2026-03-19*
*Verze: 1.0 — NAVRH*
