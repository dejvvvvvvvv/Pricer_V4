# Aktivace Dual-Write — Krok po Kroku

> **Datum:** 2026-02-27
> **Cas:** ~20 minut
> **Riziko:** Nizke (vsechno je vratitelne)
> **Stav RLS:** Uz nasazeno (102 politik, aplikovano pres MCP 2026-02-27)

---

## Co udelat pred zacatkem

Ujisti se ze mas:
- Bezici dev server (`npm run dev` na portu 4028)
- Bezici backend (`npm run dev` v `backend-local/` na portu 3001)
- Otevrenou konzoli prohlizece (F12)

---

## CAST A — Firebase registrace v Supabase (jednorazove)

Toto propoji Firebase prihlaseni s Supabase databazi.

### Krok A1: Otevri Supabase Dashboard

1. Jdi na **https://supabase.com/dashboard**
2. Vyber projekt **Model Pricer**

### Krok A2: Najdi nastaveni autentizace

1. V levem menu klikni na **Authentication**
2. Klikni na **Sign In / Up** (nebo **Providers**)
3. Hledej sekci **Third-party auth** (nebo **Third Party Auth**)

### Krok A3: Pridej Firebase

1. Klikni na **Add provider** nebo **Enable**
2. Vyber **Firebase**
3. Vyplni:
   - **Firebase Project ID:** `model-pricer`
     (najdes v Firebase Console > Project Settings > General)
4. Uloz / **Save**

### Jak overit ze to funguje

- V sekci Third-party auth uvidis Firebase jako **Enabled**
- Zelena znacka nebo zapnuty toggle

---

## CAST B — Overeni ze vsechno funguje

### Krok B1: Otevri aplikaci

1. Otevri prohlizec na **http://localhost:4028**
2. Otevri DevTools (F12) > tab **Console**
3. Otevri DevTools > tab **Network**

### Krok B2: Prihlac se

1. Klikni na **Prihlasit se** (Login)
2. Prihlac se pres Google nebo email/heslo
3. Pocakej na presmerovani do admin casti

### Krok B3: Over ze auth bridge funguje

1. V DevTools > **Network** tab
2. Hledej request na adresu obsahujici `set-claims` nebo `auth/claims`
3. Klikni na nej a zkontroluj:
   - **Status:** 200
   - **Response** by mela obsahovat `tenant_id` a `role: "authenticated"`
4. Pokud zadny takovy request nevidis:
   - Otevri novou kartu a jdi na: `http://localhost:3001/api/auth/claims`
   - Melo by to vratit JSON s informacemi o tvojem uzivateli

### Krok B4: Over tenant ID

1. V DevTools > **Console** napis:
   ```
   localStorage.getItem('modelpricer:tenant_id')
   ```
2. Melo by to vratit tvuj tenant slug, napr. `"demo-tenant"`
3. Pokud vraci `null` — neni nastaven tenant, neco je spatne s prihlasenim

---

## CAST C — Stranka migrace

### Krok C1: Otevri migraci

1. Jdi na **http://localhost:4028/admin/migration**
2. Mela by se zobrazit stranka s nazvem typu "Storage Migration" nebo "Supabase Migration"

### Krok C2: Over pripojeni k Supabase

1. Najdi sekci **Connection Status** (nebo podobnou)
2. Ma ukazovat:
   - **Zeleny** indikator = Supabase je pripojeny = OK
   - **Cerveny** indikator = problem
3. Pokud cerveny:
   - Over ze mas soubor `.env.local` v rootu projektu s:
     ```
     VITE_SUPABASE_URL=https://mywfgjoaigtzzxksbqzz.supabase.co
     VITE_SUPABASE_ANON_KEY=tvuj_anon_klic
     ```
   - Restartuj dev server (`Ctrl+C` a znovu `npm run dev`)

### Krok C3: Stahni zalohu

1. Najdi tlacitko **"Download Backup"** (nebo "Stahnout zalohu")
2. Klikni na nej
3. Stahne se JSON soubor — uloz ho na bezpecne misto
4. Toto je tvoje pojistka — pokud se neco pokazi, data se daji obnovit

### Krok C4: Spust Dry Run (zkouska nanecisto)

1. Najdi tlacitko **"Dry Run"** (zkouska bez zapisu)
2. Klikni na nej
3. Sleduj progress bar — projde 19 namespace
4. Zkontroluj vysledek:
   - **Errors musi byt 0** — pokud je jakakoli chyba, ZASTAV a nechej me to vyresit
   - **Migrated** = kolik namespace ma data
   - **Skipped** = namespace bez dat (to je normalni)

---

## CAST D — Zapnuti Dual-Write

Dual-write znamena: aplikace bude zapisovat do localStorage (jako dosud) **A ZAROVEN** do Supabase. Nic se neztrati, nic se nerozbije.

### Krok D1: Zapni dual-write

1. Na strance `/admin/migration` najdi sekci **"Storage Mode per Namespace"**
2. Klikni na tlacitko **"Enable Dual-Write (all)"** (melo by byt oranzove)
3. Vsechny namespace se zmeni na oranzovy badge `dual-write`

### Krok D2: Over ze to funguje

1. Otevri **DevTools > Network** tab
2. Filtruj na `supabase` (napis do filtru "supabase")
3. Jdi do **Admin > Pricing** (`/admin/pricing`)
4. Uprav jakoukoli hodnotu (napr. cenu materialu) a **uloz**
5. V Network tabu by se mel objevit request na `supabase.co`:
   - Typ: POST nebo PATCH
   - Status: **200** nebo **201**
6. V **Console** tabu nesmej byt cervene chyby s textem `[storageAdapter]`

### Co kdyz to nefunguje

- Pokud vidis chyby `permission denied` — dej mi vedet, opravim RLS
- Pokud vidis chyby `Supabase not configured` — over `.env.local` (krok C2)
- Kdykoli muzes vypnout: klikni **"Rollback to localStorage (all)"** (cervene tlacitko)

---

## CAST E — Migrace existujicich dat

Dual-write zapisuje nova data do obou systemu, ale stara data jsou jen v localStorage. Tenhle krok je zkopiruje do Supabase.

### Krok E1: Spust migraci

1. Na strance `/admin/migration`
2. Klikni **"Migrate to Supabase"** (zelene/teal tlacitko)
3. Objevi se potvrzovaci dialog — klikni **OK**
4. Sleduj progress bar (19 kroku)

### Krok E2: Zkontroluj vysledek

1. Po dokonceni se zobrazi vysledky:
   - **Errors musi byt 0**
   - **Migrated** = kolik namespace se zkopiroval
   - **Skipped** = namespace bez dat (normalni)
2. Pokud jsou chyby — zaznamenej presnou chybovou hlasku a dej mi vedet

---

## CAST F — Overeni dat v Supabase

### Krok F1: Zkontroluj v Supabase Dashboard

1. Otevri **https://supabase.com/dashboard** > projekt Model Pricer
2. Klikni na **Table Editor** v levem menu
3. Zkontroluj tyto tabulky — mely by mit data:

| Tabulka | Co tam hledat |
|---------|--------------|
| `pricing_configs` | Radek s `namespace` = `pricing:v3` |
| `fees` | Radek s `namespace` = `fees:v3` |
| `branding` | Radek s `namespace` = `branding` |
| `orders` | Objednavky (pokud jsi nejakou vytvoril) |

4. U kazdeho radku over ze `tenant_id` neni prazdne

### Krok F2: Funkcni test v aplikaci

1. Jdi na `/admin/pricing` — data se musi zobrazit spravne
2. Jdi na `/admin/fees` — poplatky se musi zobrazit
3. Jdi na `/admin/branding` — branding se musi nacist
4. Zkus neco upravit a ulozit — nesmej byt zadne chyby

---

## CAST G — Test tenant izolace (volitelne, pro zvedave)

Toto overuje ze RLS politiky funguji — ze jeden tenant nevidi data jineho.

### Krok G1: Test v Supabase SQL Editor

1. Supabase Dashboard > **SQL Editor**
2. Zadej a spust:
   ```sql
   -- Test se SPATNYM tenantem — musi vratit 0 radku
   SET LOCAL request.headers = '{"x-tenant-id":"neexistujici-tenant"}';
   SELECT count(*) FROM pricing_configs;
   ```
3. Vysledek musi byt **0**
4. Potom spust:
   ```sql
   -- Test se SPRAVNYM tenantem — musi vratit data
   SET LOCAL request.headers = '{"x-tenant-id":"demo-tenant"}';
   SELECT count(*) FROM pricing_configs;
   ```
5. Vysledek musi byt **> 0** (pokud jsi migroval data)

---

## Neco se pokazilo? Tady je zachrana

### Varianta 1: Rollback na localStorage (nejrychlejsi)

1. Jdi na `/admin/migration`
2. Klikni **"Rollback to localStorage (all)"** (cervene tlacitko)
3. Hotovo — aplikace zase pouziva jen localStorage jako predtim

### Varianta 2: Obnoveni ze zalohy (pokud se ztratila localStorage data)

1. Otevri JSON soubor ktery jsi stahl v kroku C3
2. V DevTools > Console vloz:
   ```js
   // Nahrad obsah_json obsahem stazeneho souboru
   const backup = obsah_json;
   for (const [ns, entry] of Object.entries(backup.namespaces)) {
     localStorage.setItem(entry.key, JSON.stringify(entry.data));
     console.log('Obnoveno:', entry.key);
   }
   ```
3. Refreshni stranku (F5)

### Varianta 3: Napis mi

Pokud neco nefunguje a nevis si rady — popis co vidis (chybova hlaska, co jsi klikl) a vyresime to spolecne.

---

## Kontrolni seznam — vsechno hotovo?

```
[ ] CAST A — Firebase registrovan v Supabase Dashboard
[ ] CAST B — Prihlaseni funguje, auth bridge vraci tenant_id
[ ] CAST C — Supabase pripojeny, zaloha stazena, dry-run 0 chyb
[ ] CAST D — Dual-write zapnuty, Supabase requesty viditelne v Network
[ ] CAST E — Data migrovana, 0 chyb
[ ] CAST F — Data viditelna v Supabase Dashboard, admin stranky funguji
```

Pokud je vse zastavene — **gratulace, localStorage a Supabase bezi paralelne!**

Nechej to par dnu bezet v dual-write modu. Az budes chtit prejit plne na Supabase (localStorage se prestane pouzivat), dej vedet a provedeme dalsi krok.

---

## Referencni soubory (pro me, ne pro tebe)

| Soubor | Cesta |
|--------|-------|
| Feature flags | `src/lib/supabase/featureFlags.js` |
| Storage adapter | `src/lib/supabase/storageAdapter.js` |
| Supabase client | `src/lib/supabase/client.js` |
| Migration runner | `src/lib/supabase/migrationRunner.js` |
| Admin Migration UI | `src/pages/admin/AdminMigration.jsx` |
| Tenant storage | `src/utils/adminTenantStorage.js` |
| Production RLS | `supabase/rls-policies-production.sql` |
