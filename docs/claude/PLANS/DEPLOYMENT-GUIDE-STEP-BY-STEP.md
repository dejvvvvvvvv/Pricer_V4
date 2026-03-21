# Průvodce nasazením BETA verze ModelPricer — krok za krokem

**Datum:** 2026-03-19
**Verze:** 1.0
**Pro koho:** Majitel 3D tiskové firmy (ne-technický uživatel)

---

## Přehled

Tento průvodce tě provede kompletním nasazením aplikace ModelPricer do produkčního prostředí.

**Co budeš potřebovat:**
- Přibližně 2-3 hodiny času (může být rozloženo do více dní)
- Platební kartu (pro registrace na free tier služeb — skutečné účtování začne až při překročení limitů)
- Přístup k emailu
- Počítač s Windows 10/11

**Co na konci budeš mít:**
- Funkční aplikaci na vlastní doméně
- Backend server na Google Cloud Run
- Úložiště souborů na Cloudflare R2
- Platby přes Stripe
- Automatické emaily přes Resend
- Monitoring chyb přes Sentry

**Kolik to stojí (měsíčně při malém provozu):**
| Služba | Free tier | Odhadovaná cena po free tier |
|--------|-----------|------------------------------|
| Google Cloud Run | $300 kredit na 90 dní | ~$5-15/měsíc |
| Firebase Hosting | 10 GB přenos/měsíc zdarma | $0 (pro BETA stačí) |
| Cloudflare R2 | 10 GB zdarma | ~$0.015/GB navíc |
| Supabase | 500 MB databáze zdarma | $0 (pro BETA stačí) |
| Stripe | 0 Kč fixní poplatek | 1.4% + 6 Kč za transakci |
| Resend | 3000 emailů/měsíc zdarma | $0 (pro BETA stačí) |
| Sentry | 5000 chyb/měsíc zdarma | $0 (pro BETA stačí) |

**Celkem pro BETA: přibližně 0 Kč** (díky free tierům a Google Cloud kreditu).

---

## Předpoklady — co už máš

Tento průvodce předpokládá, že následující služby už máš nastavené z předchozí práce na projektu:

- **Firebase projekt** — přihlášení uživatelů (Firebase Auth)
- **Supabase projekt** — databáze (25 tabulek s RLS politikami)
- **Node.js** nainstalovaný na počítači (verze 18 nebo novější)
- **Git** nainstalovaný na počítači
- **Zdrojový kód projektu** stažený na disku

Pokud nemáš Firebase nebo Supabase, vrať se nejdřív k jejich nastavení.

---

## Krok 1: Vytvoření účtů a získání API klíčů (30 minut)

> V tomto kroku si založíš účty na všech potřebných službách a zapíšeš si klíče.
> Doporučení: Otevři si Poznámkový blok a ukládej si tam všechny klíče průběžně.

---

### 1.1 Google Cloud (pro backend server)

Google Cloud bude hostovat tvůj backend server — to je ta část, která zpracovává 3D modely v PrusaSliceru.

1. Otevři prohlížeč a jdi na **https://console.cloud.google.com/**
2. Přihlaš se svým Google účtem (gmail)
3. Pokud jsi tu poprvé, klikni na **"Začít zdarma"** (nebo "Try for free")
   - Dostaneš **$300 kredit na 90 dní** — to pokryje celou betu
   - Budeš muset zadat platební kartu, ale **nebude ti nic strženo** dokud kredit nevyčerpáš
4. Po přihlášení klikni nahoře na **"Select a project"** (výběr projektu) → **"New Project"**
5. Zadej název: `modelpricer`
6. Klikni **"Create"** (vytvořit)
7. **Zapiš si Project ID** — najdeš ho v horní liště vedle názvu projektu. Vypadá například takto: `modelpricer-123456`. Toto budeme potřebovat později.
8. Ujisti se, že máš povolený billing:
   - V levém menu klikni na **"Billing"** (fakturace)
   - Měl by tam být billing account propojený s tvou kartou
   - Pokud ne, klikni "Link a billing account"

Teď je potřeba povolit tři API služby, které budeme používat:

9. V levém menu klikni na **"APIs & Services"** → **"Enable APIs"**
10. V horním vyhledávacím poli vyhledej a postupně povol tyto tři služby (u každé klikni "Enable"):
    - **Cloud Run Admin API** — server pro backend
    - **Artifact Registry API** — úložiště Docker obrazů
    - **Cloud Build API** — sestavení aplikace

> **Poznámka:** Povolení API může trvat 1-2 minuty u každé služby. Počkej, než se zobrazí zelená fajfka.

---

### 1.2 Cloudflare R2 (pro úložiště souborů)

Cloudflare R2 je úložiště, kam se budou ukládat nahrané 3D modely, vygenerované G-code soubory a obrázky.

1. Otevři **https://dash.cloudflare.com/sign-up**
2. Zaregistruj se (email + heslo) — je to **zdarma**
3. Po přihlášení klikni v levém menu na **"R2 Object Storage"**
4. Pokud R2 ještě nemáš aktivované, klikni **"Purchase R2 Plan"** (nebo "Activate R2")
   - Zvolíš free tier — **10 GB zdarma**, žádné platby
   - Budeš muset zadat platební údaje (ale neúčtuje se nic v rámci free tier)
5. Klikni **"Create bucket"** (vytvořit úložiště)
   - Název: `modelpricer-files`
   - Lokace: **Automatic** (nebo Europe pokud je na výběr)
   - Klikni **"Create bucket"**
6. Teď potřebuješ API klíče pro přístup k R2:
   - Jdi do **R2 Overview** (přehled)
   - V pravém horním rohu klikni **"Manage R2 API Tokens"**
   - Klikni **"Create API Token"**
   - Permissions: **Object Read & Write**
   - Specify bucket(s): zaškrtni **"Apply to specific buckets only"** → vyber `modelpricer-files`
   - TTL: nech **"Forever"** (navždy)
   - Klikni **"Create API Token"**
7. **DŮLEŽITÉ — zapiš si hned tyto 3 údaje** (zobrazí se jen jednou!):
   - **Access Key ID** — vypadá jako: `abc123def456...`
   - **Secret Access Key** — vypadá jako: `xyz789...` (delší řetězec)
8. **Account ID** najdeš v pravém sloupci na hlavní stránce R2 (nebo v URL prohlížeče: `dash.cloudflare.com/<tvoje-account-id>/r2`)

**Zapiš si do poznámek:**
```
Cloudflare R2:
  Account ID:        _______________
  Access Key ID:     _______________
  Secret Access Key: _______________
  Bucket:            modelpricer-files
```

---

### 1.3 Stripe (pro platby)

Stripe je platební brána — zákazníci přes ni budou platit kartou.

1. Otevři **https://dashboard.stripe.com/register**
2. Zaregistruj se — vyber **"Czech Republic"** jako zemi
3. Po přihlášení budeš automaticky v **Test Mode** (testovací režim)
   - To je správně — pro betu chceš nejdřív testovat
   - V testovacím režimu se žádné skutečné peníze neúčtují
4. V levém menu klikni na **"Developers"** (vývojáři)
5. Klikni na **"API keys"** (API klíče)
6. Uvidíš dva klíče:
   - **Publishable key** — začíná `pk_test_...` (veřejný, bezpečný pro frontend)
   - **Secret key** — klikni "Reveal test key" → začíná `sk_test_...` (tajný, jen pro backend)

**Zapiš si do poznámek:**
```
Stripe:
  Publishable key: pk_test_______________
  Secret key:      sk_test_______________
```

> **Stripe Webhook Secret** nastavíme později v Kroku 7 (až budeme mít URL backendu).

---

### 1.4 Resend (pro automatické emaily)

Resend bude odesílat automatické emaily — potvrzení objednávky, změna stavu objednávky apod.

1. Otevři **https://resend.com/signup**
2. Zaregistruj se (email nebo GitHub účet) — **zdarma, 3000 emailů/měsíc**
3. Po přihlášení jdi do **"API Keys"** (v levém menu)
4. Klikni **"Create API Key"**
   - Název: `modelpricer-production`
   - Permission: **Full access**
   - Klikni **"Add"**
5. **Zapiš si API key** (zobrazí se jen jednou!) — začíná `re_...`

**Ověření domény (volitelné, ale doporučené pro produkci):**

Pokud chceš, aby emaily chodily z tvé vlastní domény (např. `noreply@tvojefirma.cz` místo `onboarding@resend.dev`):

6. Jdi do **"Domains"** (domény) v levém menu
7. Klikni **"Add Domain"**
8. Zadej svou doménu (např. `tvojefirma.cz`)
9. Resend ti ukáže DNS záznamy, které je potřeba přidat k tvé doméně
   - Typicky 3 TXT záznamy
   - Přidej je u svého poskytovatele domény (Wedos, ACTIVE24, Forpsi apod.)
   - Ověření trvá obvykle 5-30 minut

> Pro začátek (beta testování) stačí používat výchozí Resend doménu — emaily budou chodit, jen budou mít adresu odesílatele `onboarding@resend.dev`.

**Zapiš si do poznámek:**
```
Resend:
  API Key:    re_______________
  Email from: noreply@tvojefirma.cz (nebo onboarding@resend.dev pro začátek)
```

---

### 1.5 Sentry (pro monitoring chyb)

Sentry automaticky zachytává chyby v aplikaci — uvidíš, když něco nefunguje, i bez toho, aby ti to zákazník nahlásil.

1. Otevři **https://sentry.io/signup/**
2. Zaregistruj se — vyber **Developer plan** (zdarma, 5000 chyb/měsíc)
3. Po přihlášení vytvoř první projekt:
   - Klikni **"Create Project"**
   - Platform: vyber **"Node.js"**
   - Název: `modelpricer-backend`
   - Klikni **"Create Project"**
   - Na následující stránce uvidíš **DSN** — vypadá jako `https://abc123@o456.ingest.sentry.io/789`
   - **Zapiš si ho**
4. Vytvoř druhý projekt pro frontend:
   - Jdi do **Settings** → **Projects** → **"Create Project"**
   - Platform: vyber **"React"**
   - Název: `modelpricer-frontend`
   - Klikni **"Create Project"**
   - Opět zapiš DSN

**Zapiš si do poznámek:**
```
Sentry:
  Backend DSN:  https://___@___.ingest.sentry.io/___
  Frontend DSN: https://___@___.ingest.sentry.io/___
```

---

### 1.6 Shrnutí — seznam všech klíčů

Po dokončení kroku 1 bys měl mít v poznámkách tyto údaje:

```
=== MOJE KLÍČE (NIKDY NESDÍLEJ!) ===

Google Cloud:
  Project ID: _______________

Cloudflare R2:
  Account ID:        _______________
  Access Key ID:     _______________
  Secret Access Key: _______________
  Bucket:            modelpricer-files

Stripe:
  Publishable key:   pk_test_______________
  Secret key:        sk_test_______________

Resend:
  API Key:           re_______________

Sentry:
  Backend DSN:       https://_______________
  Frontend DSN:      https://_______________

Firebase (máš z dřívějška):
  Project ID:        _______________
  API Key:           _______________
  Auth Domain:       _______________

Supabase (máš z dřívějška):
  URL:               https://___.supabase.co
  Anon Key:          _______________
  JWT Secret:        _______________
  Service Role Key:  _______________
```

> **BEZPEČNOSTNÍ UPOZORNĚNÍ:** Tyto klíče NIKDY neposílej emailem, nechat na veřejně dostupném místě, ani nepřidávej do Gitu. Ideálně si je ulož do bezpečného správce hesel (Bitwarden, 1Password apod.).

---

## Krok 2: Instalace nástrojů na počítač (20 minut)

> V tomto kroku nainstaluješ nástroje potřebné pro nasazení. Pokud už některé máš, přeskoč je.

---

### 2.1 Google Cloud CLI (gcloud)

Toto je příkazový řádek pro komunikaci s Google Cloud.

1. Otevři **https://cloud.google.com/sdk/docs/install** (nebo hledej "Install Google Cloud CLI")
2. V sekci **"Windows"** stáhni instalátor (tlačítko "Google Cloud CLI installer")
3. Spusť stažený soubor a projdi instalací (nech všechno výchozí)
4. Na konci instalace se automaticky otevře terminál a spustí se `gcloud init`
5. Postupuj podle pokynů:
   - Přihlaš se Google účtem (otevře se prohlížeč)
   - Vyber svůj projekt (`modelpricer` nebo jak jsi ho pojmenoval)
   - Region vyber: `europe-west1` (Belgie — nejblíž k ČR)
6. Ověř, že to funguje — otevři **PowerShell** nebo **Git Bash** a napiš:
   ```
   gcloud config list
   ```
   Měl bys vidět svůj projekt a účet.

---

### 2.2 Docker Desktop

Docker je program, který zabalí tvůj backend do "kontejneru" — něco jako virtuální počítač, který pak poběží na Google Cloud.

1. Otevři **https://www.docker.com/products/docker-desktop/**
2. Klikni **"Download for Windows"**
3. Spusť instalátor
   - Zaškrtni **"Use WSL 2 instead of Hyper-V"** (pokud je na výběr)
   - Dokončení instalace
4. **RESTARTUJ POČÍTAČ** (Docker to vyžaduje)
5. Po restartu se Docker Desktop automaticky spustí (ikona velryby v systémové liště)
6. Ověř v terminálu:
   ```
   docker --version
   ```
   Mělo by se zobrazit něco jako: `Docker version 27.x.x`

> **Poznámka:** Pokud se zobrazí chyba o WSL2, otevři PowerShell jako administrátor a spusť: `wsl --install`. Pak znovu restartuj počítač.

---

### 2.3 Firebase CLI

Firebase CLI potřebuješ pro nasazení frontendu (webové stránky).

1. Otevři terminál (PowerShell, Git Bash nebo Command Prompt)
2. Spusť:
   ```
   npm install -g firebase-tools
   ```
3. Ověř instalaci:
   ```
   firebase --version
   ```
   Mělo by se zobrazit číslo verze (např. `13.x.x`)
4. Přihlaš se:
   ```
   firebase login
   ```
   Otevře se prohlížeč — přihlaš se stejným Google účtem jako ve Firebase Console.

---

## Krok 3: Konfigurace projektu (20 minut)

> V tomto kroku nastavíš konfigurační soubory, aby aplikace věděla, kam se připojit.

---

### 3.1 Konfigurace backendu (.env soubor)

Backend potřebuje vědět klíče ke všem službám. Tyto údaje se ukládají do souboru `.env`, který NIKDY nesmí být v Gitu.

1. Otevři složku projektu v Průzkumníku souborů
2. Přejdi do: `Model_Pricer-V2-main/backend-local/`
3. Najdi soubor **`.env.example`** — to je šablona
4. Zkopíruj ho a přejmenuj kopii na **`.env`** (pozor — soubor začíná tečkou!)
   - Ve Windows: Pravý klik → Kopírovat → Vložit → Přejmenovat na `.env`
   - Pokud Windows nedovolí pojmenovat soubor jen `.env`, otevři PowerShell a napiš:
     ```
     copy ".env.example" ".env"
     ```
5. Otevři nový soubor `.env` v textovém editoru (Poznámkový blok, VS Code, Notepad++)
6. Vyplň hodnoty z kroku 1. Výsledný soubor by měl vypadat přibližně takto:

```env
# =============================================================================
# Server
# =============================================================================
PORT=3001
NODE_ENV=development

# =============================================================================
# PrusaSlicer (lokální vývoj na Windows)
# =============================================================================
# Nech prázdné — backend ho najde automaticky ve složce tools/prusaslicer/
PRUSA_SLICER_CMD=
SLICER_WORKSPACE_ROOT=C:\modelpricer\tmp

# =============================================================================
# Firebase Auth
# =============================================================================
FIREBASE_PROJECT_ID=tvuj-firebase-project-id

# =============================================================================
# Supabase
# =============================================================================
SUPABASE_URL=https://tvoje-id.supabase.co
SUPABASE_JWT_SECRET=tvuj-supabase-jwt-secret

# =============================================================================
# Povolené domény pro CORS (pro lokální vývoj)
# =============================================================================
CORS_ORIGINS=http://localhost:4028,http://127.0.0.1:4028

# =============================================================================
# Cloudflare R2 (úložiště souborů)
# =============================================================================
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=tvoje-cloudflare-account-id
R2_ACCESS_KEY_ID=tvuj-r2-access-key
R2_ACCESS_KEY_SECRET=tvuj-r2-secret-key
R2_BUCKET_NAME=modelpricer-files

# =============================================================================
# Email (Resend)
# =============================================================================
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_tvuj-api-key
EMAIL_FROM=noreply@tvojefirma.cz

# =============================================================================
# Stripe platby
# =============================================================================
STRIPE_SECRET_KEY=sk_test_tvuj-secret-key
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLIC_KEY=pk_test_tvuj-publishable-key

# =============================================================================
# Sentry monitoring
# =============================================================================
SENTRY_DSN=https://tvuj-backend-dsn@sentry.io/cislo

# =============================================================================
# Fakturační údaje (budou na fakturách)
# =============================================================================
INVOICE_COMPANY_NAME=Název Tvé Firmy s.r.o.
INVOICE_COMPANY_ADDRESS=Ulice 123, 110 00 Praha
INVOICE_COMPANY_ICO=12345678
INVOICE_COMPANY_DIC=CZ12345678
INVOICE_BANK_ACCOUNT=123456789/0100
INVOICE_BANK_IBAN=CZ1234567890123456789012
INVOICE_VAT_PAYER=false
```

> **Tip:** `INVOICE_VAT_PAYER=false` nastav pokud NEJSI plátce DPH. Pokud jsi plátce DPH, nastav na `true` a vyplň `INVOICE_COMPANY_DIC`.

---

### 3.2 Konfigurace frontendu (.env.local soubor)

Frontend (webová stránka, kterou vidí zákazník) také potřebuje pár údajů.

1. Přejdi do: `Model_Pricer-V2-main/`
2. Najdi soubor **`.env.example`** — to je šablona
3. Zkopíruj ho a přejmenuj kopii na **`.env.local`**
4. Otevři `.env.local` v textovém editoru a vyplň:

```env
# =============================================================================
# Firebase (tyto údaje máš z Firebase Console)
# =============================================================================
VITE_FIREBASE_API_KEY=tvuj-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=tvuj-projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tvuj-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=tvuj-projekt.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Analytics (volitelné, nech prázdné pokud nepoužíváš)
VITE_FIREBASE_MEASUREMENT_ID=

# =============================================================================
# Supabase
# =============================================================================
VITE_SUPABASE_URL=https://tvoje-id.supabase.co
VITE_SUPABASE_ANON_KEY=tvuj-supabase-anon-key

# =============================================================================
# Auth provider
# =============================================================================
VITE_AUTH_PROVIDER=firebase

# =============================================================================
# API URL
# =============================================================================
# Pro lokální vývoj nech PRÁZDNÉ (Vite proxy to vyřeší automaticky)
# Pro produkci sem později dáš URL Cloud Run serveru
VITE_API_BASE_URL=

# =============================================================================
# Stripe (veřejný klíč — bezpečné pro frontend)
# =============================================================================
VITE_STRIPE_PUBLIC_KEY=pk_test_tvuj-publishable-key

# =============================================================================
# Sentry monitoring (volitelné)
# =============================================================================
VITE_SENTRY_DSN=https://tvuj-frontend-dsn@sentry.io/cislo
VITE_APP_VERSION=1.0.0

# =============================================================================
# App URL (pro OAuth redirect)
# =============================================================================
VITE_APP_URL=http://localhost:4028
```

---

### 3.3 Instalace NPM balíčků (závislostí)

Některé služby vyžadují dodatečné knihovny.

1. Otevři terminál (Git Bash nebo PowerShell)
2. Přejdi do složky backendu a nainstaluj nové balíčky:
   ```bash
   cd Model_Pricer-V2-main/backend-local
   npm install
   ```
3. Vrať se zpět a nainstaluj frontend balíčky:
   ```bash
   cd ..
   npm install
   ```

> Pokud se při `npm install` zobrazí varování (warnings), je to normální. Důležité je, že se nezobrazí žádné **errors** (chyby).

---

### 3.4 Vytvoření pracovní složky pro PrusaSlicer

Backend potřebuje složku, kam bude ukládat dočasné soubory při zpracování 3D modelů.

1. Vytvoř složku `C:\modelpricer\tmp`:
   - Otevři Průzkumník souborů
   - Jdi na disk `C:\`
   - Vytvoř složku `modelpricer`
   - Uvnitř ní vytvoř složku `tmp`

Nebo v terminálu:
```bash
mkdir -p /c/modelpricer/tmp
```

---

## Krok 4: Lokální testování (15 minut)

> Než nasadíš aplikaci na internet, ověř, že lokálně na tvém počítači vše funguje.

---

### 4.1 Spuštění backendu

1. Otevři terminál
2. Přejdi do složky backendu:
   ```bash
   cd Model_Pricer-V2-main/backend-local
   ```
3. Spusť backend:
   ```bash
   npm start
   ```
4. Měl bys vidět výpis podobný tomuto:
   ```
   ModelPricer Backend v0.1.2
   Environment: development
   Port: 3001
   PrusaSlicer: FOUND (v2.9.4)
   Server is running on http://localhost:3001
   ```
5. **Nech terminál otevřený** — backend musí běžet

> Pokud vidíš chybu **"PrusaSlicer: NOT FOUND"**, je to v pořádku pro základní testování — kalkulačka bez sliceru zobrazí chybovou hlášku, ale zbytek aplikace bude fungovat.

---

### 4.2 Spuštění frontendu

1. Otevři **nový terminál** (nech ten s backendem běžet)
2. Přejdi do hlavní složky projektu:
   ```bash
   cd Model_Pricer-V2-main
   ```
3. Spusť frontend:
   ```bash
   npm run dev
   ```
4. Měl bys vidět:
   ```
   VITE v5.0.0 ready in XXX ms
   Local:   http://localhost:4028/
   ```
5. Otevři prohlížeč a jdi na **http://localhost:4028**

---

### 4.3 Co ověřit

Projdi tento kontrolní seznam:

- [ ] **Hlavní stránka** se načítá (http://localhost:4028)
- [ ] **Přihlášení** funguje (můžeš se přihlásit přes Google nebo email)
- [ ] **Admin panel** je přístupný po přihlášení (http://localhost:4028/admin)
- [ ] **Kalkulačka** se zobrazuje (http://localhost:4028/test-kalkulacka)
- [ ] **Upload souboru** — zkus nahrát malý STL soubor do kalkulačky
- [ ] **Health check backendu** — otevři http://localhost:4028/api/health a ověř, že vidíš JSON s `"ok": true`

Pokud vše funguje, pokračuj na krok 5. Pokud něco nefunguje, zkontroluj:
- Běží backend i frontend? (dva terminály)
- Jsou v `.env` a `.env.local` správné klíče?
- Nejsou v terminálu červené chybové hlášky?

---

## Krok 5: Nasazení backendu na Google Cloud Run (30 minut)

> Toto je nejdůležitější krok — tvůj backend poběží na internetu na serverech Google.

---

### 5.1 Příprava

1. Ujisti se, že **Docker Desktop běží** (ikona velryby v systémové liště)
2. Otevři terminál a ověř přihlášení do Google Cloud:
   ```bash
   gcloud auth list
   ```
   Měl bys vidět svůj email s hvězdičkou (aktivní účet).

3. Ověř, že máš správný projekt:
   ```bash
   gcloud config get-value project
   ```
   Měl bys vidět ID svého projektu (např. `modelpricer-123456`).

---

### 5.2 Nastavení proměnných

V terminálu nastav tyto proměnné (nahraď `tvuj-project-id` skutečným Project ID z kroku 1.1):

**V Git Bash:**
```bash
export GCP_PROJECT_ID="tvuj-project-id"
export GCP_REGION="europe-west1"
```

**V PowerShell:**
```powershell
$env:GCP_PROJECT_ID = "tvuj-project-id"
$env:GCP_REGION = "europe-west1"
```

---

### 5.3 Spuštění deploy skriptu

1. Přejdi do kořenové složky projektu (nadřazená složka nad `Model_Pricer-V2-main`)
2. Spusť deploy skript:
   ```bash
   bash scripts/deploy-cloudrun.sh
   ```

Skript automaticky udělá toto:
- Vytvoří Artifact Registry repository (úložiště pro Docker obrazy)
- Nastaví Docker autentizaci
- Sestaví Docker obraz z tvého backendu
- Nahraje obraz do Artifact Registry
- Nasadí obraz na Cloud Run

**Toto může trvat 5-10 minut** (zejména sestavení Docker obrazu poprvé).

3. Na konci uvidíš výpis:
   ```
   === Deploy complete ===
   Service URL: https://modelpricer-api-abc123-ew.a.run.app
   Health check: https://modelpricer-api-abc123-ew.a.run.app/api/health
   ```

4. **Zapiš si Service URL** — to je adresa tvého backendu na internetu.

---

### 5.4 Nastavení tajných proměnných na Cloud Run

Cloud Run potřebuje znát všechny klíče, které máš v `.env` souboru. Tyto se nastavují jako environment variables přímo na Cloud Run (nikdy se neukládají do kódu).

V terminálu spusť tento příkaz (nahraď hodnoty svými skutečnými klíči):

```bash
gcloud run services update modelpricer-api \
  --region europe-west1 \
  --set-env-vars "\
NODE_ENV=production,\
PORT=8080,\
FIREBASE_PROJECT_ID=tvuj-firebase-project-id,\
SUPABASE_URL=https://tvoje-id.supabase.co,\
SUPABASE_JWT_SECRET=tvuj-supabase-jwt-secret,\
STORAGE_PROVIDER=r2,\
R2_ACCOUNT_ID=tvoje-cloudflare-account-id,\
R2_ACCESS_KEY_ID=tvuj-r2-access-key,\
R2_ACCESS_KEY_SECRET=tvuj-r2-secret-key,\
R2_BUCKET_NAME=modelpricer-files,\
EMAIL_PROVIDER=resend,\
RESEND_API_KEY=re_tvuj-api-key,\
EMAIL_FROM=noreply@tvojefirma.cz,\
STRIPE_SECRET_KEY=sk_test_tvuj-secret-key,\
STRIPE_PUBLIC_KEY=pk_test_tvuj-publishable-key,\
SENTRY_DSN=https://tvuj-backend-dsn@sentry.io/cislo,\
CORS_ORIGINS=https://tvuj-firebase-projekt.web.app,\
INVOICE_COMPANY_NAME=Nazev Firmy,\
INVOICE_COMPANY_ICO=12345678,\
SLICER_WORKSPACE_ROOT=/tmp/modelpricer\
"
```

> **Pozor:** V hodnotách proměnných NESMÍ být čárky (Cloud Run je používá jako oddělovač). Pokud má tvůj název firmy čárku, nahraď ji mezerou.

> **Tip:** Tento příkaz můžeš upravit a spustit znovu kdykoliv, když potřebuješ změnit nějakou hodnotu.

---

### 5.5 Ověření backendu

Otevři prohlížeč a jdi na: `https://tvuj-service-url/api/health`

Měl bys vidět JSON odpověď s `"ok": true`. Pokud vidíš chybu, podívej se do logů:

```bash
gcloud run services logs read modelpricer-api --region europe-west1 --limit 50
```

---

## Krok 6: Nasazení frontendu na Firebase Hosting (15 minut)

> Frontend (webová stránka) bude hostovaný na Firebase Hosting — je to zdarma a velmi rychlé.

---

### 6.1 Aktualizace frontend konfigurace pro produkci

Před nasazením musíš frontendovému `.env.local` říct, kde je tvůj backend:

1. Otevři `Model_Pricer-V2-main/.env.local`
2. Najdi řádek `VITE_API_BASE_URL=` a doplň URL tvého Cloud Run serveru:
   ```
   VITE_API_BASE_URL=https://modelpricer-api-abc123-ew.a.run.app
   ```
3. Aktualizuj `VITE_APP_URL`:
   ```
   VITE_APP_URL=https://tvuj-firebase-projekt.web.app
   ```
4. Ulož soubor

---

### 6.2 Oprava firebase.json (důležité!)

Soubor `firebase.json` obsahuje jednu nesrovnalost, kterou je potřeba opravit. Vite build vytváří výstup do složky `build`, ale `firebase.json` odkazuje na `dist`.

1. Otevři `Model_Pricer-V2-main/firebase.json`
2. Na řádku 3 změň:
   ```json
   "public": "dist",
   ```
   na:
   ```json
   "public": "build",
   ```
3. Ulož soubor

---

### 6.3 Build a deploy

1. Otevři terminál a přejdi do složky projektu:
   ```bash
   cd Model_Pricer-V2-main
   ```

2. Sestav produkční verzi frontendu:
   ```bash
   npm run build
   ```
   Toto vytvoří optimalizovanou verzi aplikace ve složce `build/`.
   Měl bys vidět výpis bez chyb, na konci něco jako:
   ```
   vite v5.0.0 building for production...
   dist rendered in X.XXs
   ```

3. Nasaď na Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
   Na konci uvidíš:
   ```
   Hosting URL: https://tvuj-firebase-projekt.web.app
   ```

4. **Zapiš si Hosting URL** — to je adresa tvé aplikace na internetu!

---

### 6.4 Ověření frontendu

Otevři prohlížeč a jdi na `https://tvuj-firebase-projekt.web.app`. Měla by se načíst tvá aplikace ModelPricer.

---

## Krok 7: Nastavení Stripe Webhooks (10 minut)

> Webhooks jsou způsob, jak Stripe informuje tvou aplikaci o platbách. Bez nich se objednávka nepotvrdí po zaplacení.

1. Otevři **https://dashboard.stripe.com/webhooks** (v Test Mode)
2. Klikni **"Add endpoint"** (přidat endpoint)
3. **Endpoint URL:** zadej adresu tvého backendu + cesta pro webhook:
   ```
   https://modelpricer-api-abc123-ew.a.run.app/api/payments/webhook
   ```
   (nahraď `modelpricer-api-abc123-ew.a.run.app` skutečnou URL z kroku 5.3)

4. **Select events to listen to** (vyber události):
   Klikni **"Select events"** a zaškrtni tyto tři události:
   - `checkout.session.completed` — zákazník dokončil platbu
   - `payment_intent.succeeded` — platba byla úspěšně přijata
   - `payment_intent.payment_failed` — platba selhala

5. Klikni **"Add endpoint"** (přidat endpoint)

6. Na stránce nového endpointu klikni na **"Reveal"** vedle **"Signing secret"**
   - Zapiš si tento klíč — začíná `whsec_...`

7. **Aktualizuj proměnnou na Cloud Run:**
   ```bash
   gcloud run services update modelpricer-api \
     --region europe-west1 \
     --update-env-vars "STRIPE_WEBHOOK_SECRET=whsec_tvuj-webhook-secret"
   ```

8. Také aktualizuj lokální `backend-local/.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_tvuj-webhook-secret
   ```

---

## Krok 8: Nastavení vlastní domény (volitelné, 15 minut)

> Pokud chceš, aby aplikace byla na tvé vlastní doméně (např. `app.tvojefirma.cz`) místo `tvuj-projekt.web.app`.

### 8.1 Přidání domény do Firebase Hosting

1. Otevři **Firebase Console** (https://console.firebase.google.com/)
2. Vyber svůj projekt
3. Jdi do **Hosting** v levém menu
4. Klikni **"Add custom domain"** (přidat vlastní doménu)
5. Zadej doménu: `app.tvojefirma.cz` (nebo jinou subdoménu)
6. Firebase ti ukáže DNS záznamy, které potřebuješ přidat:
   - Typicky CNAME záznam směřující na `tvuj-projekt.web.app`
7. Přidej tyto záznamy u svého poskytovatele domény
8. Počkej na ověření (může trvat až 24 hodin, obvykle 1-2 hodiny)

### 8.2 Aktualizace CORS po přidání domény

Po přidání vlastní domény musíš aktualizovat CORS na backendu, aby přijímal požadavky z nové domény:

```bash
gcloud run services update modelpricer-api \
  --region europe-west1 \
  --update-env-vars "CORS_ORIGINS=https://tvuj-firebase-projekt.web.app,https://app.tvojefirma.cz"
```

---

## Krok 9: Finální ověření (15 minut)

> Projdi celý flow jako zákazník a ověř, že vše funguje.

### 9.1 Kontrolní seznam

Otevři svou aplikaci v prohlížeči a projdi tyto body:

**Základní funkčnost:**
- [ ] Hlavní stránka se načítá (žádná bílá obrazovka)
- [ ] Přihlášení funguje (Google Sign-In nebo email)
- [ ] Po přihlášení se zobrazí admin panel
- [ ] Odhlášení funguje

**Admin panel:**
- [ ] Dashboard se zobrazuje se správnými daty
- [ ] Nastavení ceníku (Pricing) funguje — můžeš měnit ceny
- [ ] Nastavení poplatků (Fees) funguje
- [ ] Nastavení branding (logo, barvy) funguje

**Kalkulačka (hlavní funkce):**
- [ ] Kalkulačka se načítá (http://tvuj-web/test-kalkulacka)
- [ ] Můžeš nahrát STL soubor (3D model)
- [ ] Po nahrání se zobrazí náhled modelu
- [ ] Kalkulačka spočítá cenu (může trvat 10-30 sekund)
- [ ] Můžeš změnit materiál, množství a další parametry
- [ ] Cena se přepočítá

**Objednávka (end-to-end test):**
- [ ] Můžeš vytvořit objednávku z kalkulačky
- [ ] Stripe platební formulář se zobrazí
- [ ] Testovací platba projde (použij kartu `4242 4242 4242 4242`, datum v budoucnosti, libovolné CVC)
- [ ] Objednávka se objeví v admin panelu
- [ ] Email s potvrzením přijde

**Monitoring:**
- [ ] Health check backendu vrací `ok: true` (https://tvuj-cloud-run-url/api/health)
- [ ] V Sentry dashboardu se zobrazují žádné kritické chyby

### 9.2 Testovací Stripe karty

Pro testování plateb v Test Mode používej tyto karty:

| Číslo karty | Výsledek |
|-------------|----------|
| `4242 4242 4242 4242` | Platba úspěšná |
| `4000 0000 0000 0002` | Platba zamítnuta |
| `4000 0000 0000 3220` | Vyžaduje 3D Secure |

- Datum expirace: jakékoliv budoucí datum (např. `12/30`)
- CVC: jakékoliv 3 číslice (např. `123`)

---

## Krok 10: Přechod na ostré Stripe platby (až budeš připraven)

> Tento krok proveď až když je vše otestované a jsi připraven přijímat skutečné platby.

1. V Stripe Dashboard přepni z **Test mode** na **Live mode** (přepínač vpravo nahoře)
2. Dokonči **aktivaci účtu** (ověření identity, bankovní účet) — Stripe tě provede procesem
3. V Live mode jdi do **Developers** → **API keys**:
   - Zapiš si **live publishable key** (`pk_live_...`)
   - Zapiš si **live secret key** (`sk_live_...`)
4. Vytvoř nový webhook endpoint (stejný URL jako v kroku 7, ale v Live mode):
   - Zapiš si nový **webhook signing secret** (`whsec_...`)
5. Aktualizuj klíče na Cloud Run:
   ```bash
   gcloud run services update modelpricer-api \
     --region europe-west1 \
     --update-env-vars "\
   STRIPE_SECRET_KEY=sk_live_tvuj-live-key,\
   STRIPE_PUBLIC_KEY=pk_live_tvuj-live-key,\
   STRIPE_WEBHOOK_SECRET=whsec_tvuj-live-webhook-secret\
   "
   ```
6. Aktualizuj frontend `.env.local`:
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_live_tvuj-live-key
   ```
7. Znovu sestav a nasaď frontend:
   ```bash
   cd Model_Pricer-V2-main
   npm run build
   firebase deploy --only hosting
   ```

---

## Řešení problémů

### Bílá obrazovka po načtení
- Otevři DevTools (F12) → záložka Console → podívej se na první chybu
- Nejčastější příčina: chybějící nebo špatné `VITE_FIREBASE_*` proměnné v `.env.local`
- Řešení: zkontroluj `.env.local` a znovu spusť `npm run build` + `firebase deploy --only hosting`

### Backend vrací 500 nebo nereaguje
- Zkontroluj logy:
  ```bash
  gcloud run services logs read modelpricer-api --region europe-west1 --limit 50
  ```
- Nejčastější příčina: chybějící env proměnné na Cloud Run
- Řešení: zkontroluj a doplň chybějící proměnné příkazem z kroku 5.4

### Upload souboru nefunguje
- Zkontroluj, že `STORAGE_PROVIDER=r2` je nastavený na Cloud Run
- Zkontroluj, že R2 klíče (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_ACCESS_KEY_SECRET`) jsou správné
- Zkontroluj, že bucket `modelpricer-files` existuje v Cloudflare R2

### Emaily nechodí
- Zkontroluj, že `EMAIL_PROVIDER=resend` je nastavený na Cloud Run
- Zkontroluj, že `RESEND_API_KEY` je správný
- Pokud používáš vlastní doménu, zkontroluj, že je ověřená v Resend dashboardu
- Pro testování: zkontroluj Resend dashboard → "Emails" pro historii odeslaných emailů

### Stripe platba nefunguje
- Zkontroluj, že jsi v **Test mode** (přepínač v Stripe Dashboard)
- Zkontroluj, že `STRIPE_SECRET_KEY` na Cloud Run začíná `sk_test_` (ne `sk_live_`)
- Zkontroluj, že webhook endpoint je správně nastavený a aktivní
- V Stripe Dashboard → Developers → Webhooks → tvůj endpoint → "Recent events" pro historii webhooků

### PrusaSlicer nefunguje na Cloud Run
- PrusaSlicer zatím **není součástí Docker obrazu** (viz TODO v Dockerfile)
- Pro betu: kalkulačka funguje s lokálním PrusaSlicerem nebo s mock daty
- Řešení pro produkci: je třeba přidat PrusaSlicer do Docker obrazu (vyžaduje technickou pomoc)

### Jak aktualizovat aplikaci (deploy nové verze)
Když uděláš změny v kódu, nasadíš novou verzi takto:

**Backend:**
```bash
export GCP_PROJECT_ID="tvuj-project-id"
bash scripts/deploy-cloudrun.sh
```

**Frontend:**
```bash
cd Model_Pricer-V2-main
npm run build
firebase deploy --only hosting
```

---

## Užitečné příkazy na jedno místo

```bash
# === LOKÁLNÍ VÝVOJ ===
cd Model_Pricer-V2-main/backend-local && npm start    # Spustit backend
cd Model_Pricer-V2-main && npm run dev                 # Spustit frontend
cd Model_Pricer-V2-main && npm run build               # Sestavit frontend

# === GOOGLE CLOUD ===
gcloud auth login                                      # Přihlásit se
gcloud config set project tvuj-project-id              # Nastavit projekt
gcloud run services logs read modelpricer-api \
  --region europe-west1 --limit 50                     # Zobrazit logy backendu
gcloud run services describe modelpricer-api \
  --region europe-west1                                # Zobrazit info o službě

# === FIREBASE ===
firebase login                                         # Přihlásit se
firebase deploy --only hosting                         # Nasadit frontend

# === DOCKER ===
docker --version                                       # Ověřit instalaci
docker ps                                              # Zobrazit běžící kontejnery
```

---

## Přehled architektury (co kde běží)

```
Zákazník (prohlížeč)
    |
    |--- FRONTEND (Firebase Hosting)
    |    https://tvuj-projekt.web.app
    |    - React aplikace (kalkulačka, objednávky)
    |    - Připojení k Firebase Auth (přihlášení)
    |
    |--- BACKEND (Google Cloud Run)
    |    https://modelpricer-api-xxx.a.run.app
    |    - Express server (Node.js)
    |    - PrusaSlicer (zpracování 3D modelů)
    |    - Objednávky, faktury, emaily
    |
    |--- DATABÁZE (Supabase)
    |    https://xxx.supabase.co
    |    - PostgreSQL (25 tabulek)
    |    - Konfigurace, objednávky, uživatelé
    |
    |--- SOUBORY (Cloudflare R2)
    |    - 3D modely (STL, 3MF, OBJ)
    |    - Vygenerované G-code soubory
    |    - Branding (loga, obrázky)
    |
    |--- PLATBY (Stripe)
    |    - Kartové platby
    |    - Webhooks pro potvrzení
    |
    |--- EMAILY (Resend)
    |    - Potvrzení objednávky
    |    - Změna stavu objednávky
    |
    |--- MONITORING (Sentry)
         - Automatické hlášení chyb
         - Frontend i backend
```

---

**Hotovo!** Pokud jsi prošel všechny kroky, tvá aplikace ModelPricer by měla běžet na internetu a být připravená pro beta testování. Pokud narazíš na problém, který není v sekci "Řešení problémů", kontaktuj vývojáře.
