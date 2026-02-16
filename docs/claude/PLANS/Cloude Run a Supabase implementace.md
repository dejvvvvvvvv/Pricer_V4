# Cloud Run + Supabase — Kompletni implementacni plan

> Tento dokument obsahuje VSECHNY kroky ktere musis udelat, informace ktere musis dodat,
> a nastaveni ktere musis provest, aby backend fungoval pres Cloud Run + Supabase.
>
> Supabase uz mame v projektu nastavene (25 tabulek, 3 buckety, StorageAdapter, migracni runner).
> Firestore NEPOUZIVAME — Supabase je lepsi volba protoze uz ho mame a Cloud Run funguje s obojim stejne.

---

## ARCHITEKTURA

```
Firebase Hosting (frontend — staticky React build)
    |
    |-- /api/slice/**  --> Cloud Run "slicer" (4 CPU, 2 GB, PrusaSlicer)
    |-- /api/**        --> Cloud Functions (0.17 CPU, 256 MB, levne)
    |
    +-- Supabase (databaze + storage) <-- UZ MAME NASTAVENE
```

- **Cloud Run "slicer"** = POUZE slicovani modelu (drahy, silny kontejner)
- **Cloud Functions** = vsechno ostatni — objednavky, admin CRUD, upload (levny)
- **Supabase** = databaze (PostgreSQL, 25 tabulek) + file storage (modely, gcode)

### Proc dva backendy?

| Operace | Kam jde | Proc |
|---------|---------|------|
| Slicovani modelu | Cloud Run (4 CPU) | PrusaSlicer je narocny na CPU |
| Ulozeni objednavky | Cloud Functions (0.17 CPU) | Jednoduche, nepotrebuje vykon |
| Cteni dat z admin | Cloud Functions | Jednoduche |
| Upload souboru | Cloud Functions | Soubor jde do Supabase Storage |

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

### Informace ktere mi musis dodat:
- [ ] Potvrzeni ze mas nainstalovane: gcloud, docker, firebase CLI
- [ ] Vystup prikazu `gcloud config list` (abych vedel ze jsi spravne prihlaseny)

---

## CAST 3: Supabase — informace ktere potrebuji

Uz mame Supabase nastavene v projektu (25 tabulek, 3 storage buckety, StorageAdapter).
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

4. **Over ze mas tyto veci v Supabase** (uz by meli existovat z Phase 4):
   - [ ] Tabulka `orders` (objednavky)
   - [ ] Tabulka `order_items` (modely v objednavkach)
   - [ ] Tabulka `documents` (reference na soubory)
   - [ ] Storage bucket `models` (privatni, pro 3D soubory)
   - [ ] Storage bucket `documents` (privatni, pro gcode/PDF)

### Kde to najdes:
- Project URL + keys: `Supabase Dashboard > Settings > API`
- Tabulky: `Supabase Dashboard > Table Editor`
- Storage buckety: `Supabase Dashboard > Storage`

### Co uz mame v kodu (nemusis nic delat):
- Supabase klient: `src/lib/supabase/client.js`
- StorageAdapter: `src/lib/supabase/storageAdapter.js`
- Feature flags: `src/lib/supabase/featureFlags.js`
- Migracni runner: `src/lib/supabase/migrationRunner.js` (19 migraci)
- Realtime hook: `src/hooks/useSupabaseRealtime.js`
- Schema SQL: `supabase/schema.sql` (25 tabulek)

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
- [ ] Email notifikace pri zmene stavu (pozdeji?)

### Modely a soubory (Supabase Storage):
- [ ] Ulozeni modelu po objednavce (do bucket `models`)
- [ ] Ulozeni gcode po slicovani (do bucket `documents`)
- [ ] Mazani starych souboru po X dnech

### Admin (Cloud Functions + Supabase):
- [ ] API pro spravu materialu
- [ ] API pro spravu ceniku
- [ ] API pro spravu presets
- [ ] Statistiky (pocet objednavek, trzby)

### Budouci funkce:
- [ ] Automaticky email zakaznikovi
- [ ] Webhook notifikace
- [ ] Platebni brana (Stripe/GoPay)

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

## CAST 9: Testovani a deploy — postup

Az mi dodas vsechny informace vyse, implementace probehne v techto krocich:

### Krok 1: Lokalni vyvoj
- Napisu backend kod (Express.js + PrusaSlicer wrapper)
- Otestujes lokalne na svem PC s Docker Desktop
- Over ze slicing funguje

### Krok 2: Deploy Cloud Run (slicer)
- Buildneme Docker image s PrusaSlicer
- Pushneme do Google Artifact Registry
- Deployujeme na Cloud Run
- Otestujeme ze slicing API funguje

### Krok 3: Deploy Cloud Functions (API)
- Napisu jednoduche API funkce (CRUD pro objednavky, admin, atd.)
- Deployujeme pres Firebase CLI
- Otestujeme ze API funguje

### Krok 4: Propojeni s Firebase Hosting
- Upravime firebase.json (proxy pravidla)
- `/api/slice/**` --> Cloud Run
- `/api/**` --> Cloud Functions
- Deployujeme frontend
- Otestujeme end-to-end

### Krok 5: Propojeni s Supabase
- Cloud Run (slicer) pouzije Service Role Key pro pristup k Supabase
- Po slicovani ulozi gcode do Supabase Storage (bucket `documents`)
- Ulozi metriky do databaze (tabulky `orders`, `order_items`)
- Frontend cte data pres stavajici StorageAdapter

### Krok 6: Produkcni nastaveni
- Rate limiting (ochrana pred zneuzitim)
- Monitoring (logy, alerty v Google Cloud Console)
- Automaticke cisteni starych souboru
- Zprisneni Supabase RLS na JWT autentizaci

---

## SOUHRN — vsechny informace ktere od tebe potrebuji

Nez zacnu implementovat, posli mi tyto informace (zkopiruj a vyplni):

```
=== GOOGLE CLOUD ===
Project ID: _______________
Region (doporucuji europe-west1): _______________

=== SUPABASE (uz mame, jen potrebuji klice) ===
Project URL: https://_____________.supabase.co
Anon Key: eyJ_______________
Service Role Key: eyJ_______________
Potvrzeni ze tabulky existuji (Y/N): ___

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

=== FUNKCE (Y/N ke kazdemu bodu v casti 7) ===
Upload: ___
Slicovani: ___
Metriky: ___
Gcode download: ___
Objednavky CRUD: ___
Email notifikace: ___
Admin API: ___
Statistiky: ___
```

> DULEZITE: Service Role Key a dalsi tajne klice mi NEPOSSILEJ primo do chatu.
> Misto toho je uloz do souboru `backend/.env` ktery pridame do `.gitignore`.

---

*Posledni aktualizace: 2026-02-14*
