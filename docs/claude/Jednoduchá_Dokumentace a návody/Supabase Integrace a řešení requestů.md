# Supabase — Jak to funguje a jak se resi requesty

> Jednoduchy popis pro pochopeni. Zadne zbytecne detaily.

---

## Co je Supabase?

Supabase je databaze v cloudu (PostgreSQL) + uloziste souboru (Storage).
Nemas zadny vlastni databazovy server — Supabase se o vsechno stara.
Tvuj frontend (React app) primo komunikuje se Supabase pres JavaScript SDK.

---

## Co uz mame nastavene v projektu

### Databaze — 25 tabulek

Uz mame vytvorenych 25 tabulek v Supabase. Nejdulezitejsi:

| Tabulka | K cemu slouzi |
|---------|---------------|
| `tenants` | Firmy (multi-tenancy zaklad) |
| `pricing_configs` | Cenova konfigurace (materialy, sazby) |
| `orders` | Objednavky |
| `order_items` | Modely v ramci objednavky |
| `materials` | Materialy (PLA, PETG, ABS...) |
| `customers` | Zakaznici |
| `audit_log` | Log vsech akci |

Kompletni seznam: viz `docs/claude/Documentation/Supabase-Dokumentace.md`

### Storage — 3 buckety (uloziste souboru)

| Bucket | K cemu | Pristup |
|--------|--------|---------|
| `models` | 3D modely (.stl, .3mf, .obj) | Privatni |
| `documents` | PDF, faktury | Privatni |
| `branding` | Loga firem | Verejne cteni |

### Pripojeni v kodu

Supabase klient je v `src/lib/supabase/client.js`. Potrebuje 2 env vars:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Pokud tyto promenne chybi, **vsechno automaticky pada na localStorage** (zadny crash).

### StorageAdapter — "prevodnik" mezi localStorage a Supabase

Soubor: `src/lib/supabase/storageAdapter.js`

Tohle je klicovy soubor. Vsechny data operace v projektu jdou pres nej.
On rozhoduje odkud cist a kam psat podle feature flags:

```
Rezim "localStorage" --> cte/pise jen do localStorage (puvodni chovani)
Rezim "supabase"     --> cte/pise jen do Supabase
Rezim "dual-write"   --> pise do OBOU, cte z Supabase (s fallbackem na localStorage)
```

**Aktualni stav:** Vsechny namespaces jsou v rezimu `localStorage` (default).
Migrace na Supabase je pripravena ale jeste nebyla spustena na ostro.

### Realtime hook — useSupabaseRealtime

Soubor: `src/hooks/useSupabaseRealtime.js`

Uz mame pripravenou funkci pro realtime poslouchani zmen. Pouzije se takto:

```jsx
useSupabaseRealtime('orders', {
  filter: 'tenant_id=eq.xxx',
  onInsert: (novaObjednavka) => { /* nova objednavka prisla */ },
  onUpdate: (upravena) => { /* objednavka se zmenila */ },
  onDelete: (smazana) => { /* objednavka smazana */ },
});
```

Zatim se v projektu NEPOUZIVA — je pripraveny pro budouci pouziti.

---

## Jak se resi requesty na Supabase?

### 3 zpusoby jak ziskat data

#### Zpusob 1: "Nacti pri otevreni stranky" (pouzivame TED)

```
Admin otevre stranku "Objednavky"
  |
  └─> 1 request na Supabase: "dej mi vsechny objednavky"
  └─> Supabase vrati data
  └─> Stranka je zobrazena

  ... admin kouka, pracuje ...
  (ZADNE dalsi requesty)

  Admin klikne "Obnovit" nebo prejde na jinou stranku a zpet
  |
  └─> 1 dalsi request
```

**Kolik requestu:** 1 pri otevreni stranky. Pak 0.
**Nevyhoda:** Pokud nekdo jiny prida objednavku, admin to neuvidi dokud neobnovi.

#### Zpusob 2: "Ptej se kazdu minutu" (polling) — NEPOUZIVAME

```
Kazdych 30 sekund: "jsou nova data?" --> request --> odpoved
                   "jsou nova data?" --> request --> odpoved
                   ... porad dokola ...
```

**Problem:** Spousta zbytecnych requestu i kdyz se nic nezmenilo.
Za 8 hodin = 960 requestu.

#### Zpusob 3: "Supabase mi rekne kdyz se neco zmeni" (realtime) — PRIPRAVENO

```
Admin otevre stranku
  |
  └─> 1 request (nacti data)
  └─> Otevre se "trubka" (WebSocket) mezi browserem a Supabase

  ... ticho, zadne requesty ...

  Nekdo jiny vytvori objednavku
  |
  Supabase SAM posle zpravu: "Hej, nova objednavka!"
  |
  └─> Stranka se automaticky aktualizuje

  ... ticho, zadne requesty ...
```

**Kolik requestu:** 1 pri otevreni. Pak 0.
Realtime je otevrene spojeni (jako telefonni hovor), ne opakujici se requesty.

### Jednoducha analogie

- **Zpusob 1** = Jdes ke schrance zkontrolovat postu. Nic? Prijdes zitra.
- **Zpusob 2** = Chodis ke schrance kazdych 30 sekund. Vetsinou prazdna.
- **Zpusob 3** = Postak ti zazvoni u dveri kdyz mas postu. Nemusis nikam chodit.

---

## Jak ted funguji requesty v nasem projektu

### Zapis dat (napr. ulozeni ceniku)

```
1. Admin zmeni cenu v admin panelu
2. Kod zavola writeTenantJson('pricing:v3', novaData)
3. StorageAdapter zkontroluje feature flag pro 'pricing:v3'
4. Aktualne: flag = 'localStorage' --> data se ulozi do localStorage
   (Budoucne: flag = 'supabase' --> data se ulozi do Supabase = 1 request)
```

**Aktualne requestu na Supabase:** 0 (je v rezimu localStorage)
**Po migraci:** 1 request na zapis

### Cteni dat (napr. nacist objednavky)

```
1. Admin otevre stranku Objednavky
2. Kod zavola readTenantJson('orders:v1', [])
3. StorageAdapter zkontroluje feature flag
4. Aktualne: flag = 'localStorage' --> cte z localStorage
   (Budoucne: flag = 'supabase' --> cte z Supabase = 1 request)
```

**Aktualne requestu na Supabase:** 0
**Po migraci:** 1 request na cteni

---

## Model Storage stranka — jak bude fungovat s requesty

Pro stranku Model Storage (kde firma vidi ulozene modely) doporucuji:

```
1. Otevreni stranky:
   --> 1 request: nacti seznam modelu ze Supabase

2. Realtime poslouchani (useSupabaseRealtime):
   --> 0 requestu: Supabase sam posle zmeny pres WebSocket
   --> Kdyz nekdo nahraje novy model, stranka se sama aktualizuje

3. Download modelu:
   --> 1 request: stahni soubor ze Supabase Storage

Celkem za celou session: 1 request + 0 za kazdou zmenu + 1 za kazdy download
```

Firma NEMUSI klikat "Obnovit" — data se aktualizuji sama diky realtime.

---

## Kolik stoji Supabase?

### Free tier (zdarma):

| Polozka | Limit |
|---------|-------|
| Databaze | 500 MB |
| Storage (soubory) | 1 GB |
| Bandwidth (prenos dat) | 5 GB/mesic |
| API requesty | Neomezene |
| Realtime spojeni | 200 soucasnych |

**Pro zacatek to uplne staci.** 500 MB databaze = tisice objednavek.

### Placeny plan (Pro): $25/mesic

8 GB databaze, 100 GB storage, 250 GB bandwidth.
Potrebujes az kdyz preroste free tier.

---

## Kroky pro implementaci

### Co uz mame hotove:
- [x] Supabase projekt vytvoreny
- [x] 25 tabulek v databazi (schema.sql)
- [x] 3 storage buckety (models, documents, branding)
- [x] RLS policies (demo faze)
- [x] JavaScript klient (src/lib/supabase/client.js)
- [x] StorageAdapter (src/lib/supabase/storageAdapter.js)
- [x] Feature flags system (src/lib/supabase/featureFlags.js)
- [x] Migracni runner (src/lib/supabase/migrationRunner.js) — 19 migraci
- [x] Admin migracni stranka (/admin/migration)
- [x] Realtime hook (src/hooks/useSupabaseRealtime.js)
- [x] Seed data pro demo-tenant

### Co je jeste potreba udelat:

1. **Spustit migraci localStorage --> Supabase**
   - Otevrit `/admin/migration`
   - Kliknout "Dry Run" (testovaci beh)
   - Pokud OK, kliknout "Migrovat"
   - Prepnout na dual-write nebo supabase rezim

2. **Zapojit realtime kde ma smysl**
   - Model Storage stranka — useSupabaseRealtime('orders', ...)
   - Admin objednavky — automaticka aktualizace

3. **Zprisnit RLS pro produkci**
   - Prepsat policies z `anon` na `auth.jwt()` claims
   - Implementovat JWT autentizaci

4. **Propojit s Cloud Run backendem**
   - Cloud Run (slicer) bude pouzivat Service Role Key
   - Po slicovani ulozi gcode do Supabase Storage
   - Ulozi metriky do databaze

5. **Dodat tyto informace:**
   - [ ] Supabase Project URL
   - [ ] Supabase Anon Key (do .env.local)
   - [ ] Supabase Service Role Key (do backend/.env, NIKDY do frontendu)
   - [ ] Potvrzeni ze tabulky existuji v Supabase Dashboard

---

*Posledni aktualizace: 2026-02-14*
