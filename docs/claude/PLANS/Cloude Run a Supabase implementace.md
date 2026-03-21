# Cloud Run + Supabase + Cloudflare R2 — Kompletni implementacni plan

> Tento dokument obsahuje VSECHNY kroky ktere musis udelat, informace ktere musis dodat,
> a nastaveni ktere musis provest, aby backend fungoval pres Cloud Run + Supabase + Cloudflare R2.
>
> Supabase uz mame v projektu nastavene (25 tabulek, StorageAdapter, migracni runner).
> Firestore NEPOUZIVAME — Supabase je lepsi volba protoze uz ho mame a Cloud Run funguje s obojim stejne.
>
> **Zmena oproti puvodni verzi:**
> - Supabase = POUZE databaze (metadata, objednavky, konfigurace)
> - Cloudflare R2 = binarni soubory (3D modely, gcode, branding assety)
> - Email = Resend (ne nodemailer/SMTP)
> - PDF = pdfmake + QR platba pro ceske platby
> - Monitoring = Sentry
> - CI/CD = GitHub Actions

---

## ARCHITEKTURA

```
Firebase Hosting (frontend — staticky React build)
    |
    |-- /api/slice/**  --> Cloud Run "slicer" (4 CPU, 2 GB, PrusaSlicer)
    |-- /api/**        --> Cloud Functions (0.17 CPU, 256 MB, levne)
    |
    +-- Supabase (POUZE databaze — PostgreSQL, metadata, objednavky, konfigurace)
    |
    +-- Cloudflare R2 (binarni soubory — 3D modely, gcode, branding assety)
    |
    +-- Resend (transakcni emaily — 3000/mesic free tier)
    |
    +-- Sentry (monitoring — 5000 chyb/mesic free tier)
```

- **Cloud Run "slicer"** = POUZE slicovani modelu (drahy, silny kontejner)
- **Cloud Functions** = vsechno ostatni — objednavky, admin CRUD, email, PDF (levny)
- **Supabase** = databaze (PostgreSQL, 25 tabulek) — BEZ storage bucketu pro soubory
- **Cloudflare R2** = S3-kompatibilni object storage pro binarni soubory (modely, gcode, PDF, branding)
- **Resend** = transakcni emaily (potvrzeni objednavek, zmeny stavu)
- **Sentry** = error monitoring + performance (frontend i backend)

### Proc Cloudflare R2 misto Supabase Storage?

| Kritérium | Supabase Storage | Cloudflare R2 |
|-----------|-----------------|---------------|
| Egress (stahovani) | Placeny po free tieru | **ZDARMA** (nulovy egress) |
| Free tier | 1 GB storage | **10 GB storage** |
| S3 kompatibilita | Castecna | **Plna** (S3 API) |
| CDN | Zadne | **Cloudflare CDN** (globalni) |
| Velke soubory (3D modely, gcode) | OK ale drahy egress | **Idealni** |

### Proc dva backendy?

| Operace | Kam jde | Proc |
|---------|---------|------|
| Slicovani modelu | Cloud Run (4 CPU) | PrusaSlicer je narocny na CPU |
| Ulozeni objednavky | Cloud Functions (0.17 CPU) | Jednoduche, nepotrebuje vykon |
| Cteni dat z admin | Cloud Functions | Jednoduche |
| Upload souboru | Cloud Functions | Soubor jde do Cloudflare R2 |
| Odeslani emailu | Cloud Functions | Resend API call |
| Generovani PDF | Cloud Functions | pdfmake v pameti |

### MCP servery pro spravvu infrastruktury

| MCP server | Ucel |
|------------|------|
| **Cloudflare Bindings MCP** | Sprava R2 bucketu, upload/download souboru |
| **Google Cloud Run MCP** | Deployment a sprava Cloud Run sluzeb |
| **Stripe MCP** (`@stripe/mcp`) | Nastaveni platebni brany |
| **Sentry MCP** | Monitoring chyb, alerty |

---

## CAST 1: Google Cloud ucet a projekt

### Co musis udelat:

1. **Vytvor Google Cloud ucet**
   - Jdi na: https://console.cloud.google.com/
   - Klikni "Get started for free" nebo "Zacit zdarma"
   - Prihlas se svym Google uctem
   - Google ti da **$300 kredit na 90 dni zdarma**

2. **Vytvor novy projekt**
   - V Google Cloud Console klikni nahore na vyber projektu
   - Klikni "New Project" / "Novy projekt"
   - Nazev: `modelpricer` (nebo jaky chces)
   - Zapamatuj si **Project ID** — budes ho potrebovat vsude

3. **Povol billing (fakturaci)**
   - Menu > Billing > Propoj projekt s fakturacnim uctem
   - Musis pridat platebni kartu (ale $300 kredit pokryje hodne)
   - BEZ tohoto kroku Cloud Run nepojede

4. **Povol potrebne API**
   - Jdi na: Menu > APIs & Services > Enable APIs
   - Povol tyto API (klikni Enable u kazdeho):
     - `Cloud Run Admin API`
     - `Cloud Build API`
     - `Artifact Registry API`
     - `Cloud Functions API`

### Informace ktere mi musis dodat:
- [ ] Tvoje **Google Cloud Project ID** (napr. `modelpricer-12345`)
- [ ] Jaky **region** chces pouzit (doporucuji `europe-west1` = Belgie, nejbliz CR)

---

## CAST 2: Instalace nastroju na tvuj pocitac

### Co musis nainstalovat:

1. **Google Cloud CLI (gcloud)**
   - Stahni z: https://cloud.google.com/sdk/docs/install
   - Pro Windows: stahni installer a spust
   - Po instalaci otevri terminal a spust:
     ```
     gcloud init
     ```
   - Vyberes svuj Google ucet a projekt

2. **Docker Desktop**
   - Stahni z: https://www.docker.com/products/docker-desktop/
   - Pro Windows: stahni a nainstaluj
   - Po instalaci RESTARTUJ pocitac
   - Over ze funguje:
     ```
     docker --version
     ```

3. **Firebase CLI** (pokud jeste nemas)
   - Uz mas? Over:
     ```
     firebase --version
     ```
   - Pokud ne:
     ```
     npm install -g firebase-tools
     firebase login
     ```

4. **Wrangler CLI** (Cloudflare)
   - Pro spravu R2 bucketu:
     ```
     npm install -g wrangler
     wrangler login
     ```

### Informace ktere mi musis dodat:
- [ ] Potvrzeni ze mas nainstalovane: gcloud, docker, firebase CLI, wrangler
- [ ] Vystup prikazu `gcloud config list` (abych vedel ze jsi spravne prihlaseny)

---

## CAST 3: Supabase — databaze (BEZ file storage)

> **DULEZITE ZMENA:** Supabase pouzivame POUZE pro databazi (PostgreSQL).
> Binarni soubory (3D modely, gcode, PDF, branding) jdou do Cloudflare R2.
> Supabase Storage buckety (`models`, `documents`) se NEPOUZIVAJI pro produkci.

Uz mame Supabase nastavene v projektu (25 tabulek, StorageAdapter, migracni runner).
Potrebuji od tebe jen pristupove udaje aby je backend (Cloud Run) mohl pouzit.

### Co musis zjistit:

1. **Jdi na https://supabase.com/dashboard**
2. **Otevri svuj projekt**
3. **Jdi do Settings > API** a zkopiruj tyto 3 veci:

### Informace ktere mi musis dodat:
- [ ] **Supabase Project URL** — vypada takto: `https://xxxxxxxxxxxxx.supabase.co`
- [ ] **Supabase Anon Key** (verejny klic) — dlouhy retezec zacinajici `eyJ...`
- [ ] **Supabase Service Role Key** (tajny klic, pro backend) — dalsi `eyJ...`

> POZOR: Service Role Key je TAJNY. Nikdy ho nedavej do frontendu ani do gitu.
> Tento klic se nastavi jako environment variable v Cloud Run.

4. **Over ze mas tyto TABULKY v Supabase** (uz by meli existovat z Phase 4):
   - [ ] Tabulka `orders` (objednavky)
   - [ ] Tabulka `order_items` (modely v objednavkach)
   - [ ] Tabulka `documents` (reference na soubory — soubory samotne jsou v R2)

> **Poznamka:** Storage buckety v Supabase (`models`, `documents`) uz NEPOUZIVAME
> pro produkcni soubory. Metadata o souborech zustavaji v Supabase tabulkach,
> ale samotne binarni soubory se ukladaji do Cloudflare R2.

### Kde to najdes:
- Project URL + keys: `Supabase Dashboard > Settings > API`
- Tabulky: `Supabase Dashboard > Table Editor`

### Co uz mame v kodu (nemusis nic delat):
- Supabase klient: `src/lib/supabase/client.js`
- StorageAdapter: `src/lib/supabase/storageAdapter.js` (bude aktualizovany pro R2)
- Feature flags: `src/lib/supabase/featureFlags.js`
- Migracni runner: `src/lib/supabase/migrationRunner.js` (19 migraci)
- Realtime hook: `src/hooks/useSupabaseRealtime.js`
- Schema SQL: `supabase/schema.sql` (25 tabulek)

---

## CAST 3B: Cloudflare R2 — file storage

### Co je R2?
Cloudflare R2 je S3-kompatibilni object storage s **nulovym egress poplatkem**.
Pro 3D tiskovou sluzbu je idealni — zakaznici stahujou soubory (gcode, PDF) a egress je zdarma.

### Free tier:
- 10 GB uloziste
- 1 milion Class A operaci (PUT/POST) za mesic
- 10 milionu Class B operaci (GET) za mesic
- **0 Kc za egress** (stahovani)

### Co musis udelat:

1. **Vytvor Cloudflare ucet**
   - Jdi na: https://dash.cloudflare.com/sign-up
   - Registruj se (zdarma, nepotrebujes domenu)

2. **Aktivuj R2**
   - V Cloudflare dashboardu klikni na **R2 Object Storage** v levem menu
   - Klikni **Enable R2** (muzes potrebovat pridat platebni metodu, ale free tier je zdarma)

3. **Vytvor buckety**
   - Vytvor 3 buckety (pres dashboard nebo Wrangler CLI):
     ```
     wrangler r2 bucket create modelpricer-models
     wrangler r2 bucket create modelpricer-documents
     wrangler r2 bucket create modelpricer-assets
     ```

   | Bucket | Obsah | Pristup |
   |--------|-------|---------|
   | `modelpricer-models` | Nahrane 3D modely (STL, 3MF, OBJ) | Privatni (signed URLs) |
   | `modelpricer-documents` | Generovane gcode, PDF faktury | Privatni (signed URLs) |
   | `modelpricer-assets` | Branding assety (loga, obrázky) | Verejny (public read) |

4. **Vytvor R2 API token**
   - Jdi do: `Cloudflare Dashboard > R2 > Manage R2 API Tokens`
   - Klikni **Create API token**
   - Permissions: **Object Read & Write**
   - Specify bucket(s): vsechny 3 buckety vyse
   - Zapamatuj si:
     - **Access Key ID** (neco jako `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
     - **Secret Access Key** (tajny, jako u AWS S3)
     - **Account ID** (v URL Cloudflare dashboardu)

### Informace ktere mi musis dodat:
- [ ] **Cloudflare Account ID** (z dashboardu URL)
- [ ] **R2 Access Key ID**
- [ ] **R2 Secret Access Key** (TAJNE — do `.env`, ne do gitu)
- [ ] **R2 Endpoint URL** — `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- [ ] Potvrzeni ze buckety existuji (Y/N): ___

> POZOR: R2 Secret Access Key je TAJNY. Uloz ho do `backend/.env`.
> V Cloud Run se nastavi jako environment variable.

### Jak bude R2 pouzivany v kodu:
```javascript
// backend-local/src/storage/r2Client.js
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Upload souboru
await r2.send(new PutObjectCommand({
  Bucket: 'modelpricer-models',
  Key: `${tenantId}/${orderId}/${filename}`,
  Body: fileBuffer,
  ContentType: 'model/stl',
}));

// Signed URL pro download (platnost 1 hodina)
const url = await getSignedUrl(r2, new GetObjectCommand({
  Bucket: 'modelpricer-documents',
  Key: `${tenantId}/${orderId}/output.gcode`,
}), { expiresIn: 3600 });
```

### npm packages pro R2:
```
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## CAST 4: Firebase Hosting — propojeni s Cloud Run

### Co musis udelat:

1. **Zjisti svuj Firebase projekt**
   - Jdi na: https://console.firebase.google.com/
   - Otevri svuj projekt
   - DULEZITE: Firebase projekt MUSI byt STEJNY jako Google Cloud projekt
     (Firebase pouziva Google Cloud pod kapotou)

2. **Inicializuj Firebase v projektu** (pokud jeste nemas)
   ```
   cd tvuj-projekt
   firebase init hosting
   ```
   - Vyber svuj projekt
   - Public directory: `dist` (Vite build output)
   - Single-page app: Yes
   - GitHub deploys: No (zatim)

3. **Over ze mas firebase.json**
   - Mel by existovat v rootu projektu

### Informace ktere mi musis dodat:
- [ ] **Firebase Project ID** (melo by byt stejne jako Google Cloud Project ID)
- [ ] Potvrzeni ze mas `firebase.json` v rootu projektu
- [ ] Aktualni obsah `firebase.json` (posli mi ho)

### Jak bude firebase.json vypadat (udelam za tebe):
```json
{
  "hosting": {
    "public": "dist",
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
        "function": {
          "functionId": "api",
          "region": "europe-west1"
        }
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Poradi je dulezite — `/api/slice/**` jde na Cloud Run, vsechno ostatni `/api/**` na Cloud Functions.

---

## CAST 5: PrusaSlicer — profily a konfigurace

Backend bude pouzivat PrusaSlicer CLI. Potrebuji vedet jake tiskarny a profily pouzivas.

### Co musis udelat:

1. **Otevri PrusaSlicer na svem pocitaci**

2. **Exportuj sve tiskove profily**
   - Jdi do: File > Export > Export Config...
   - Uloz jako `.ini` soubor
   - Udelej to pro KAZDY profil ktery pouzivas
   - Napr.:
     - `PLA_02mm_SPEED.ini`
     - `PLA_015mm_QUALITY.ini`
     - `PETG_02mm_NORMAL.ini`

3. **Zjisti cestu k PrusaSlicer na svem PC** (pro lokalni testovani)
   - Obvykle: `C:\Program Files\Prusa3D\PrusaSlicer\prusa-slicer-console.exe`
   - Over ze existuje

### Informace ktere mi musis dodat:
- [ ] **Vsechny exportovane .ini profily** — posli mi je nebo dej do slozky v projektu
- [ ] **Seznam tiskaren** ktere pouzivas (napr. Prusa MK3S+, Prusa MINI, ...)
- [ ] **Seznam materialu** (PLA, PETG, ASA, ...)
- [ ] **Seznam kvalit** (0.1mm, 0.15mm, 0.2mm, 0.3mm, ...)
- [ ] Chces aby si zakaznik mohl vybrat tiskarnu/material/kvalitu? Nebo to ma byt fixni?

---

## CAST 6: Bezpecnost a pristup

### Co musis rozhodnout:

1. **Kdo muze slicovat?**
   - [ ] Kdokoliv (bez prihlaseni) — jednodussi
   - [ ] Pouze prihlaseni uzivatele — bezpecnejsi
   - [ ] Pouze zakaznici s objednavkou

2. **Limity**
   - [ ] Maximalni velikost souboru pro upload (doporucuji 100 MB)
   - [ ] Maximalni pocet modelu na jednu objednavku
   - [ ] Jak dlouho uchovavat nahrane soubory (napr. 24 hodin, 7 dni, ...)

3. **CORS — jake domeny povolil**
   - [ ] Tvoje produkcni domena (napr. `https://modelpricer.web.app`)
   - [ ] Mas vlastni domenu? Jaka?

### Informace ktere mi musis dodat:
- [ ] Odpovedi na vsechny otazky vyse

---

## CAST 7: Co presne ma backend delat — seznam funkci

Potvrd nebo uprav tento seznam. Pro kazdou funkci rekni Y (ano) nebo N (ne):

### Slicing (Cloud Run):
- [ ] Upload STL/3MF/OBJ souboru
- [ ] Slicovani pres PrusaSlicer s vybranym profilem
- [ ] Vraceni metrik (cas tisku, spoteba filamentu, vaha)
- [ ] Stahovani vygenerovaneho gcode

### Objednavky (Cloud Functions + Supabase):
- [ ] Vytvoreni objednavky (ulozeni do Supabase tabulky `orders`)
- [ ] Zobrazeni seznamu objednavek (admin)
- [ ] Zmena stavu objednavky (nova, v tisku, odeslana, dokoncena)

### Modely a soubory (Cloud Functions + Cloudflare R2):
- [ ] Ulozeni modelu po objednavce (do R2 bucket `modelpricer-models`)
- [ ] Ulozeni gcode po slicovani (do R2 bucket `modelpricer-documents`)
- [ ] Generovani signed URLs pro bezpecne stahovani
- [ ] Mazani starych souboru po X dnech (R2 lifecycle rules)

### Admin (Cloud Functions + Supabase):
- [ ] API pro spravu materialu
- [ ] API pro spravu ceniku
- [ ] API pro spravu presets
- [ ] Statistiky (pocet objednavek, trzby)

### Email (Cloud Functions + Resend):
- [ ] Potvrzeni objednavky zakaznikovi
- [ ] Notifikace pri zmene stavu objednavky
- [ ] Email pro admina o nove objednavce
- [ ] Sablony emailu (HTML) s branding tenantu

### PDF faktury (Cloud Functions + pdfmake):
- [ ] Generovani PDF faktury pri vytvoreni objednavky
- [ ] QR platba kod na fakture (cesky format pro bankovni prevod)
- [ ] Ulozeni PDF do R2 (bucket `modelpricer-documents`)
- [ ] Zaslani PDF jako priloha emailu pres Resend

### Monitoring (Sentry):
- [ ] Frontend error tracking (`@sentry/react`)
- [ ] Backend error tracking (`@sentry/node`)
- [ ] Performance monitoring (response times, slow queries)
- [ ] Alerty pri P0 chybach (email/Slack)

### Budouci funkce:
- [ ] Webhook notifikace
- [ ] Platebni brana (Stripe — pres Stripe MCP)

---

## CAST 7B: Email — Resend setup

### Co je Resend?
Moderni emailova sluzba od tvurcu react-email. Jednoduche API, dobry free tier.

### Free tier:
- 3 000 emailu za mesic
- 1 vlastni domena
- 100 emailu/den

### Co musis udelat:

1. **Vytvor Resend ucet**
   - Jdi na: https://resend.com/signup
   - Registruj se (zdarma)

2. **Vytvor API klic**
   - V dashboardu: `API Keys > Create API Key`
   - Zapamatuj si **API Key** (zacina `re_...`)

3. **Nastav vlastni domenu** (volitelne, ale doporucene)
   - V dashboardu: `Domains > Add Domain`
   - Pridej DNS zaznamy (DKIM, SPF) u sveho registratora
   - Bez vlastni domeny se emaily posilaji z `onboarding@resend.dev` (jen pro testovani)

### Informace ktere mi musis dodat:
- [ ] **Resend API Key** (`re_...`) — TAJNE, do `.env`
- [ ] **Odesilaci domena** (napr. `noreply@modelpricer.cz`) nebo pouzit Resend default?
- [ ] **Chces vlastni domenu pro emaily?** (Y/N)

### Jak bude Resend pouzivany v kodu:
```javascript
// backend-local/src/services/emailService.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Odeslani emailu
await resend.emails.send({
  from: 'ModelPricer <noreply@modelpricer.cz>',
  to: [customer.email],
  subject: 'Potvrzeni objednavky #12345',
  html: renderOrderConfirmation(order),
  attachments: [
    { filename: 'faktura.pdf', content: pdfBuffer },
  ],
});
```

### npm packages:
```
npm install resend
```

---

## CAST 7C: PDF faktury — pdfmake + QR platba

### Co je pdfmake?
Knihovna pro generovani PDF v Node.js. Zadne externi zavislosti, funguje v pameti.

### Co je QR platba?
Cesky standard pro platbu pres QR kod na fakture. Zakaznik naskenuje QR kod bankovou aplikaci
a predvyplni se mu ucet, castka, variabilni symbol.

### npm packages:
```
npm install pdfmake qrcode
```

> Alternativa pro QR platbu: `@tedyno/cz-qr-payment` — generuje SPD format pro ceske banky.
> Vybrat podle toho ktery package je lepe udrzovany.

### Jak bude PDF generovani fungovat:
```javascript
// backend-local/src/services/pdfService.js
import PdfPrinter from 'pdfmake';
import QRCode from 'qrcode';

async function generateInvoice(order, tenant) {
  // 1. Vygeneruj QR kod pro platbu (SPD format)
  const spdString = `SPD*1.0*ACC:${tenant.bankAccount}*AM:${order.totalPrice}*CC:CZK*VS:${order.id}*MSG:Objednavka ${order.id}`;
  const qrDataUrl = await QRCode.toDataURL(spdString);

  // 2. Vygeneruj PDF pres pdfmake
  const docDefinition = {
    content: [
      { text: 'FAKTURA', style: 'header' },
      { text: `Cislo: ${order.invoiceNumber}` },
      // ... tabulka polozek, ceny, QR kod
      { image: qrDataUrl, width: 120 },
    ],
  };

  // 3. Vrat PDF jako Buffer
  return createPdfBuffer(docDefinition);
}
```

---

## CAST 7D: Monitoring — Sentry setup

### Co je Sentry?
Monitoring platforma pro sledovani chyb a vykonnosti aplikace.

### Free tier:
- 5 000 chyb za mesic
- 10 000 performance transakci
- 1 GB dat
- 1 clen tymu

### Co musis udelat:

1. **Vytvor Sentry ucet**
   - Jdi na: https://sentry.io/signup/
   - Registruj se (zdarma)

2. **Vytvor projekt**
   - Vytvor 2 projekty:
     - `modelpricer-frontend` (platforma: React)
     - `modelpricer-backend` (platforma: Node.js)

3. **Zkopiruj DSN**
   - Pro kazdy projekt jdi do: `Settings > Projects > [projekt] > Client Keys (DSN)`
   - DSN vypada takto: `https://xxxx@xxx.ingest.sentry.io/xxxx`

### Informace ktere mi musis dodat:
- [ ] **Sentry Frontend DSN** — verejny (muze byt ve frontendu)
- [ ] **Sentry Backend DSN** — do `.env`

### Jak bude Sentry pouzivany v kodu:

**Frontend (`src/main.jsx`):**
```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1, // 10% performance sampling
});
```

**Backend (`backend-local/src/app.js`):**
```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
});

// Error handler (na konci middleware chainu)
app.use(Sentry.Handlers.errorHandler());
```

### npm packages:
```
# Frontend
npm install @sentry/react

# Backend
npm install @sentry/node
```

---

## CAST 8: Domenove nastaveni

### Co musis rozhodnout:

1. **Mas vlastni domenu?** (napr. modelpricer.cz)
   - [ ] Ano — jaka: _______________
   - [ ] Ne — budu pouzivat `projekt.web.app` (Firebase default)

2. **Pokud mas vlastni domenu:**
   - [ ] Kde je registrovana? (Wedos, Forpsi, Cloudflare, ...)
   - [ ] Muzes menit DNS zaznamy?

### Proc je to dulezite:
- Firebase Hosting automaticky dava SSL (HTTPS)
- Cloud Run ma vlastni URL (napr. `slicer-xxx-ew.a.run.app`)
- Firebase proxy (firebase.json) to propoji pod jednu domenu

---

## CAST 9: CI/CD — GitHub Actions

### Free tier:
- 2 000 minut za mesic (Linux runners)
- Automaticky build + deploy pri push do `main`

### Jak bude CI/CD fungovat:

```
push to main
    |
    v
GitHub Actions workflow (.github/workflows/deploy.yml)
    |
    +-- 1. npm ci && npm run build     (frontend build)
    +-- 2. npm run test                (unit testy)
    +-- 3. firebase deploy --only hosting  (frontend deploy)
    +-- 4. docker build + push         (slicer image)
    +-- 5. gcloud run deploy           (slicer deploy)
```

### Co musis udelat:
1. **Uloz secrety do GitHub repository settings:**
   - `Settings > Secrets and variables > Actions > New repository secret`
   - Secrety:
     - `GCP_PROJECT_ID`
     - `GCP_SA_KEY` (Service Account JSON — pro gcloud auth)
     - `FIREBASE_TOKEN` (z `firebase login:ci`)
     - `R2_ACCESS_KEY_ID`
     - `R2_SECRET_ACCESS_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `RESEND_API_KEY`
     - `SENTRY_DSN`

2. **Workflow soubor** — udelam za tebe: `.github/workflows/deploy.yml`

### Informace ktere mi musis dodat:
- [ ] Potvrzeni ze mas GitHub repo (Y/N)
- [ ] Nazev GitHub repo: _______________
- [ ] Chces automaticky deploy pri push do main? (Y/N)

---

## CAST 10: Testovani a deploy — postup

Az mi dodas vsechny informace vyse, implementace probehne v techto krocich:

### Krok 1: Lokalni vyvoj
- Napisu backend kod (Express.js + PrusaSlicer wrapper)
- Napojim R2 klient pro file storage
- Napojim Resend pro emaily
- Napojim pdfmake pro faktury
- Napojim Sentry pro monitoring
- Otestujes lokalne na svem PC s Docker Desktop
- Over ze slicing funguje

### Krok 2: Deploy Cloud Run (slicer)
- Buildneme Docker image s PrusaSlicer
- Pushneme do Google Artifact Registry
- Deployujeme na Cloud Run
- Otestujeme ze slicing API funguje

### Krok 3: Deploy Cloud Functions (API)
- Napisu jednoduche API funkce (CRUD pro objednavky, admin, email, PDF)
- Deployujeme pres Firebase CLI
- Otestujeme ze API funguje

### Krok 4: Propojeni s Firebase Hosting
- Upravime firebase.json (proxy pravidla)
- `/api/slice/**` --> Cloud Run
- `/api/**` --> Cloud Functions
- Deployujeme frontend
- Otestujeme end-to-end

### Krok 5: Propojeni s Supabase + R2
- Cloud Run (slicer) pouzije Service Role Key pro pristup k Supabase DB
- Po slicovani ulozi gcode do Cloudflare R2 (bucket `modelpricer-documents`)
- Ulozi metriky do databaze (tabulky `orders`, `order_items`)
- Metadata souboru v Supabase, binarni data v R2
- Frontend cte data pres aktualizovany StorageAdapter

### Krok 6: Email + PDF
- Integrace Resend pro transakcni emaily
- pdfmake sablona pro faktury s QR platbou
- Automaticky email pri vytvoreni/zmene objednavky

### Krok 7: Monitoring + CI/CD
- Sentry init ve frontendu i backendu
- GitHub Actions workflow pro automaticky deploy
- Rate limiting (ochrana pred zneuzitim)
- Automaticke cisteni starych souboru (R2 lifecycle rules)
- Zprisneni Supabase RLS na JWT autentizaci

---

## SOUHRN — vsechny informace ktere od tebe potrebuji

Nez zacnu implementovat, posli mi tyto informace (zkopiruj a vyplni):

```
=== GOOGLE CLOUD ===
Project ID: _______________
Region (doporucuji europe-west1): _______________

=== SUPABASE (uz mame, jen potrebuji klice — POUZE DATABAZE) ===
Project URL: https://_____________.supabase.co
Anon Key: eyJ_______________
Service Role Key: eyJ_______________
Potvrzeni ze tabulky existuji (Y/N): ___

=== CLOUDFLARE R2 (novy — file storage) ===
Cloudflare Account ID: _______________
R2 Access Key ID: _______________
R2 Secret Access Key: _______________  (TAJNE — do .env)
R2 Endpoint URL: https://_____________.r2.cloudflarestorage.com
Buckety vytvoreny (Y/N): ___

=== FIREBASE ===
Project ID: _______________
Produkcni URL: https://_____________.web.app
Vlastni domena (pokud mas): _______________
Mas firebase.json? (Y/N): ___

=== PRUSASLICER ===
Pouzivane tiskarny: _______________
Pouzivane materialy: _______________
Pouzivane kvality (layer height): _______________
Exportovane profily (.ini): dodane do slozky _______________

=== BEZPECNOST ===
Kdo muze slicovat: kdokoliv / prihlaseni / s objednavkou
Max velikost souboru: ___ MB
Max modelu na objednavku: ___
Jak dlouho uchovavat soubory: ___ dni
CORS domeny: _______________

=== RESEND (email) ===
Resend API Key: re_______________ (TAJNE — do .env)
Odesilaci email: noreply@_______________
Vlastni domena pro emaily (Y/N): ___

=== SENTRY (monitoring) ===
Frontend DSN: https://___@___.ingest.sentry.io/___
Backend DSN: https://___@___.ingest.sentry.io/___

=== GITHUB (CI/CD) ===
GitHub repo nazev: _______________
Automaticky deploy pri push do main (Y/N): ___

=== FUNKCE (Y/N ke kazdemu bodu v casti 7) ===
Upload: ___
Slicovani: ___
Metriky: ___
Gcode download: ___
Objednavky CRUD: ___
Admin API: ___
Statistiky: ___
Email — potvrzeni objednavky: ___
Email — zmena stavu: ___
Email — notifikace admin: ___
PDF faktura: ___
QR platba na fakture: ___
Sentry frontend: ___
Sentry backend: ___
GitHub Actions CI/CD: ___
```

> DULEZITE: Service Role Key, R2 Secret Access Key, Resend API Key a dalsi tajne klice
> mi NEPOSSILEJ primo do chatu. Misto toho je uloz do souboru `backend/.env`
> ktery pridame do `.gitignore`.

---

## PREHLED NPM PACKAGES (nove)

| Package | Ucel | Kam |
|---------|------|-----|
| `@aws-sdk/client-s3` | R2 upload/download (S3 API) | backend |
| `@aws-sdk/s3-request-presigner` | Signed URLs pro R2 | backend |
| `resend` | Transakcni emaily | backend |
| `pdfmake` | Generovani PDF faktur | backend |
| `qrcode` | QR kod pro platbu na fakture | backend |
| `@sentry/react` | Frontend error tracking | frontend |
| `@sentry/node` | Backend error tracking | backend |

---

## PREHLED MCP SERVERU

| MCP server | Ucel | Kdy pouzit |
|------------|------|------------|
| **Cloudflare Bindings MCP** | Sprava R2 bucketu, debug storage | R2 setup + debugging |
| **Google Cloud Run MCP** | Deploy/manage Cloud Run services | Deployment |
| **Stripe MCP** (`@stripe/mcp`) | Stripe produkty, ceny, webhooky | Platebni integrace |
| **Sentry MCP** | Prohlizeni chyb, nastaveni alertu | Monitoring setup |

---

*Posledni aktualizace: 2026-03-19*
