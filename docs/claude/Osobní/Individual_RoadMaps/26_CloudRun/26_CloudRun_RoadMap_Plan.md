# 26. Cloud Run — PrusaSlicer backend (Docker) — Detailni RoadMap Plan

> **Stav:** 🔴 0% hotovo | **Priorita:** KRITICKA
> **Zavislosti na jine sekce:** PrusaSlicer Backend (#2) jako zaklad, Supabase (#27) pro data
> **Kdo na nem zavisi:** Stripe webhooky (#8), Emaily (#22), Orders (#7), vsechno co potrebuje backend v produkci

---

## Prehled

Migrace lokalniho Express serveru do cloud infrastructure. Dve casti:
1. **Cloud Run** — Docker kontejner s PrusaSlicer pro narocne slicovani (4 CPU, 2 GB RAM)
2. **Cloud Functions** — lehky backend pro CRUD operace (0.17 CPU, 256 MB)

Firebase Hosting proxy smeruje pozadavky na spravny backend.

**Aktualni stav:** Lokalni Express server v `backend-local/` na portu 3001 (Vite proxy)

---

## Co je HOTOVO (✅)

### Lokalni Express server (80%)
- [x] Port 3001, Vite proxy `/api`
- [x] PrusaSlicer CLI spawn
- [x] G-code parsing
- [x] Health check
- [x] Preset management pres API
- [x] CORS nastaveni (lokalni)

---

## Co CHYBI / je potreba dodelat

### Faze 1: Docker image s PrusaSlicer (Priorita: KRITICKA)

#### Ukol 1.1: Dockerfile
- **Soubor:** `Dockerfile` (NOVY v rootu nebo `backend-local/Dockerfile`)
- **Co udelat:**
  - [ ] Base image: Ubuntu 22.04 nebo Debian Bookworm (PrusaSlicer potrebuje Linux libs)
  - [ ] Instalace PrusaSlicer:
    ```dockerfile
    FROM node:20-bookworm

    # Instalace PrusaSlicer dependencies
    RUN apt-get update && apt-get install -y \
        wget \
        libgl1-mesa-glx \
        libglu1-mesa \
        libgtk-3-0 \
        && rm -rf /var/lib/apt/lists/*

    # Stahnout PrusaSlicer AppImage nebo .deb
    # Varianta A: AppImage
    RUN wget https://github.com/prusa3d/PrusaSlicer/releases/download/version_X.X.X/PrusaSlicer-X.X.X+linux-x64-GTK3.AppImage \
        -O /usr/local/bin/prusaslicer && \
        chmod +x /usr/local/bin/prusaslicer

    # NEBO Varianta B: Build from source / .deb package

    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --production
    COPY . .

    ENV PORT=8080
    ENV PRUSASLICER_PATH=/usr/local/bin/prusaslicer
    EXPOSE 8080
    CMD ["node", "server.js"]
    ```
  - [ ] `.dockerignore` — vyloucit node_modules, .git, temp soubory
  - [ ] Otestovat lokalne: `docker build -t modelpricer-slicer . && docker run -p 8080:8080 modelpricer-slicer`
  - [ ] Overit ze PrusaSlicer funguje v kontejneru (headless mode)
- **? OTAZKA:** Ktera verze PrusaSlicer? (Aktualni stabilni: 2.7.x nebo 2.8.x)
- **? OTAZKA:** AppImage nebo .deb? AppImage je jednodussi ale vetsi

#### Ukol 1.2: Adaptace Express serveru pro Cloud Run
- **Soubor:** `backend-local/server.js` (nebo kopie)
- **Co udelat:**
  - [ ] Port z env variable: `process.env.PORT || 8080`
  - [ ] PrusaSlicer path z env: `process.env.PRUSASLICER_PATH`
  - [ ] Temp soubory do `/tmp` (Cloud Run requirement — jediny zapisovatelny adresar)
  - [ ] Graceful shutdown: `process.on('SIGTERM', ...)` (Cloud Run posila SIGTERM)
  - [ ] Request timeout: max 300s na Cloud Run (default)
  - [ ] Health check endpoint na `/` (Cloud Run health checks)

### Faze 2: Deploy na Cloud Run (Priorita: KRITICKA)

#### Ukol 2.1: Google Cloud setup
- **Co udelat:**
  - [ ] Google Cloud projekt (pokud neexistuje)
  - [ ] Enablenout Cloud Run API, Artifact Registry API
  - [ ] gcloud CLI instalace a login

#### Ukol 2.2: Build a push Docker image
- **Co udelat:**
  - [ ] Vytvorit Artifact Registry repositar:
    ```bash
    gcloud artifacts repositories create modelpricer \
      --repository-format=docker \
      --location=europe-west1
    ```
  - [ ] Build a push:
    ```bash
    gcloud builds submit \
      --tag europe-west1-docker.pkg.dev/PROJECT_ID/modelpricer/slicer:latest
    ```

#### Ukol 2.3: Deploy Cloud Run service
- **Co udelat:**
  - [ ] Deploy:
    ```bash
    gcloud run deploy modelpricer-slicer \
      --image europe-west1-docker.pkg.dev/PROJECT_ID/modelpricer/slicer:latest \
      --region europe-west1 \
      --cpu 4 \
      --memory 2Gi \
      --timeout 300 \
      --max-instances 5 \
      --min-instances 0 \
      --set-env-vars "SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...,CORS_ORIGINS=..."
    ```
  - [ ] Nastavit env variables (Supabase klice, CORS originy, Stripe webhook secret)
  - [ ] Otestovat: `curl https://SERVICE_URL/api/health`

### Faze 3: Cloud Functions pro CRUD (Priorita: VYSOKA)

#### Ukol 3.1: Cloud Functions setup
- **Soubor:** `functions/` (NOVY adresar)
- **Co udelat:**
  - [ ] `firebase init functions`
  - [ ] Migrace relevantich API endpointu z backend-local:
    - `POST /api/orders` → Cloud Function
    - `GET /api/orders/:id` → Cloud Function
    - `POST /api/payments/create-intent` → Cloud Function (Stripe)
    - `POST /api/stripe/webhook` → Cloud Function (Stripe webhook)
    - `POST /api/emails/send` → Cloud Function (Resend)
    - `POST /api/coupons/validate` → Cloud Function
  - [ ] Napojeni na Supabase (Service Role Key)
  - [ ] Firebase Auth middleware (overeni tokenu)

#### Ukol 3.2: Rozdeleni endpointu
- **Logika:**
  - `/api/slice/**` → Cloud Run (narocne, 4 CPU)
  - `/api/**` → Cloud Functions (lehke, 0.17 CPU, 256 MB)
- **Duvod:** Cloud Functions jsou VYRAZNE levnejsi pro jednoduche CRUD operace

### Faze 4: Firebase Hosting proxy (Priorita: VYSOKA)

#### Ukol 4.1: firebase.json rewrite pravidla
- **Soubor:** `firebase.json`
- **Co udelat:**
  - [ ] Rewrite pravidla:
    ```json
    {
      "hosting": {
        "rewrites": [
          {
            "source": "/api/slice/**",
            "run": {
              "serviceId": "modelpricer-slicer",
              "region": "europe-west1"
            }
          },
          {
            "source": "/api/**",
            "function": "api"
          },
          {
            "source": "**",
            "destination": "/index.html"
          }
        ]
      }
    }
    ```
  - [ ] Deploy: `firebase deploy --only hosting`
  - [ ] Otestovat ze vsechny routes fungujou

### Faze 5: CI/CD (Priorita: STREDNI, post-Beta)

#### Ukol 5.1: Automaticky deployment
- **Co udelat:**
  - [ ] GitHub Actions workflow:
    - Build Docker image
    - Push do Artifact Registry
    - Deploy na Cloud Run
    - Deploy Cloud Functions
    - Deploy Firebase Hosting
  - [ ] Trigger: push na `main` branch
- **Poznamka:** Pro Beta staci manualni deploy

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 1: Docker image | 6-10h | PrusaSlicer (#2) | KRITICKA |
| 2 | Faze 2: Cloud Run deploy | 3-5h | Faze 1, GCP ucet | KRITICKA |
| 3 | Faze 3: Cloud Functions | 6-10h | Supabase (#27), Auth (#20) | VYSOKA |
| 4 | Faze 4: Firebase proxy | 2-3h | Faze 2, 3 | VYSOKA |
| 5 | Faze 5: CI/CD | post-Beta | - | STREDNI |

**Celkem pro Beta:** ~17-28 hodin

---

## Odhad nakladu (Cloud Run)

| Polozka | Odhad | Poznamka |
|---------|-------|----------|
| Cloud Run (4 CPU, 2 GB) | ~$5-15/mesic | Min instances 0, platba za pouziti |
| Cloud Functions | ~$1-5/mesic | Free tier pokryje hodne |
| Artifact Registry | ~$1/mesic | Storage Docker images |
| Firebase Hosting | Zdarma | Spark plan |
| **Celkem** | ~$7-21/mesic | Pro beta provoz |

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| PrusaSlicer nefunguje v Dockeru | Stredni | Kriticky | Testovat lokalne pred deployem |
| Cold start Cloud Run (10-30s) | Vysoka | Stredni | Min instances 1 (drazsi) |
| Velky Docker image (> 1 GB) | Vysoka | Nizky | Multi-stage build, .dockerignore |
| Cloud Run timeout (5 min max) | Nizka | Stredni | Omezeni velikosti modelu |

---

## Kriticke doplnky (z review)

### PrusaSlicer v Dockeru — technické detaily
- [ ] PrusaSlicer CLI (`prusaslicer --export-gcode`) nepotrebuje GUI — ale sdilene knihovny ANO
- [ ] Potrebne linux packages: `libgl1-mesa-glx`, `libglu1-mesa`, mozna `xvfb` pro virtualni framebuffer
- [ ] Testovat: `docker run --rm IMAGE prusaslicer --help` — musi fungovat bez X serveru
- [ ] Verze: pouzit SPECIFICKE cislko verze (ne "latest") pro reproducibilni buildy
- [ ] Multi-stage build: build stage s kompilaci → runtime stage jen s binarkami

### Concurrency a scaling
- [ ] Cloud Run: `--concurrency 1` pro PrusaSlicer (CPU-intenzivni, nesdilej CPU mezi pozadavky)
- [ ] Max instances: 5-10 pro beta (omezeni nakladu)
- [ ] Cloud Functions: `--concurrency 80` (lehke CRUD, muze sdilest)
- [ ] Auto-scaling: Cloud Run automaticky pridava instance dle zateze

### Monitoring a logging
- [ ] Cloud Logging — vsechny logy automaticky
- [ ] Error reporting — upozorneni pri selhani
- [ ] Custom metriky: slice time, success rate, queue depth
- [ ] Cost alerts — nastavit budget alert na $50/mesic

### Rollback plan
- [ ] Pokud Cloud Run nefunguje → fallback na lokalni server
- [ ] Frontend musí umět prepnout API URL (env variable)
- [ ] Blue/green deployment — nova verze nezastavi starou dokud neni overena

---

## Poznamky

- **KRITICKE:** Cloud Run `/tmp` je jediny zapisovatelny adresar — temp soubory TAM
- **KRITICKE:** PrusaSlicer v headless mode nepotrebuje X server — ale nektere libs ano
- **TIP:** `--min-instances 0` = platba jen pri pouziti (levne pro beta)
- **TIP:** Docker multi-stage build zmensi image
- **TIP:** Cloud Run ma 300s max timeout (lze zvysit na 3600s) — pro velke modely
- **TIP:** `--concurrency 1` pro slicer — kazdy request dostane plny CPU
- **? OTAZKA:** AppImage vs .deb pro PrusaSlicer v Dockeru?
- **? OTAZKA:** Min instances 0 (cold start 10-30s) nebo 1 (vzdy bezí, drazsi)?
- **? OTAZKA:** Jak resit velke modely (>100MB)? Cloud Run ma limit na request body (32MB default, konfigurovatelny)
