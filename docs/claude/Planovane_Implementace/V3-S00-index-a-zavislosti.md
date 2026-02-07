# V3-S00: Master Index — Implementacni Plany ModelPricer V3

> **Generovano:** 2026-02-06
> **Aktualizovano:** 2026-02-06 (nove 7-fazove rozlozeni + infrastrukturni rozhodnuti)
> **Zdroj:** `docs/claude/V3 - Komplexni Implementacni Plan - Admin sekce.md`
> **Pocet sekci:** 22 implementacnich planu (S01-S22) + 2 prurezove dokumenty
> **Pocet fazi:** 7 (nahrazuje puvodnich 5 vln)
> **Format souboru:** `V3-S{NN}-{english-slug}.md`
> **Umisteni:** `docs/claude/Planovane_Implementace/`

---

## 0. Prurezove dokumenty a infrastrukturni rozhodnuti

### Doprovodne dokumenty (POVINNE CIST pred implementaci)

| Soubor | Obsah | Kdy cist |
|--------|-------|----------|
| **`V3-S00b-prurezy-a-strategie.md`** | Feature flagy, bundle budget, error monitoring, widget verzovani, testing milestones, security checklist, git branching | Pred kazdou fazi |
| **`V3-S00c-database-migration-supabase.md`** | localStorage → Supabase migrace, PostgreSQL schema, auth, file storage, Ubuntu server deploy, PrusaSlicer Linux | Pred Fazi 1 (priprava) |

### Klicova infrastrukturni rozhodnuti

| Rozhodnuti | Volba | Duvod |
|------------|-------|-------|
| **Databaze** | **Supabase** (PostgreSQL) | Relacni data, $25/mesic flat, built-in auth, self-hosting moznost |
| **Hosting** | **Firebase** (zachovat) | Uz existujici projekt, free tier staci |
| **Backend server** | **Ubuntu server** (od Faze 4) | Node.js + PrusaSlicer Linux (Flatpak + xvfb) |
| **Auth** | **Supabase Auth** | Built-in, 50K MAU free, email+Google+magic link |
| **File storage** | **Supabase Storage** | 1 GB free, tenant-scoped buckety |
| **Realtime** | **Supabase Realtime** | Postgres Changes pro chat (S11), kanban (S14) |
| **localStorage** | **Zachovat pro config** | Staticka data (branding, widget config) zustanou v localStorage |
| **PrusaSlicer** | **Linux Flatpak + xvfb** | CLI flagy identicke s Windows, headless pres virtual framebuffer |

### Cenovy odhad

| Obdobi | Supabase | Firebase | Server | Celkem |
|--------|----------|----------|--------|--------|
| Prototyp (0-100 uzivatelu) | $0 (free) | $0 (free) | $0 (lokalni vyvoj) | **$0/mesic** |
| MVP (100-1000 uzivatelu) | $25 (Pro) | $0 (free) | elektrina | **~$25/mesic** |
| Produkt (1000+ uzivatelu) | $25 (Pro) | $0 (free) | elektrina | **~$25/mesic** |
| Self-hosted (volitelne) | $0 (Docker) | $0 (free) | elektrina | **~$0/mesic** |

---

## 1. Prehled vsech sekci (serazeno podle faze implementace)

### Rychly prehled — co je kde

| Faze | Sekce | Nazev | Obtiznost | Zamereni |
|------|-------|-------|-----------|----------|
| **1** | S01 | Opravy bugu a reaktivni cenotvorba | Stredni | Zaklad |
| **1** | S02 | Kontaktni formular a checkout | Stredni | Zaklad |
| **1** | S05 | Mnozstevni slevy | Nizka | Zaklad |
| **2** | S06 | Post-processing | Nizka | Kalkulacka |
| **2** | S09 | Express pricing a upselly | Stredni | Kalkulacka |
| **2** | S04 | Doprava a dodaci lhuty | Stredni | Kalkulacka |
| **3** | S14 | Kanban board | Stredni | Sprava |
| **3** | S07 | Emailove notifikace | Vysoka | Komunikace |
| **3** | S10 | Kupony a promo akce | Stredni | Marketing |
| **4** | S03 | Multi-format 3D soubory | Vysoka | Kalkulacka+ |
| **4** | S08 | Printability check a mesh analyza | Vysoka | Kalkulacka+ |
| **4** | S15 | Rozsirene metody cenotvorby | Stredni | Kalkulacka+ |
| **5** | S13 | Generovani dokumentu (PDF) | Stredni | Zakaznik |
| **5** | S12 | Zakaznicky portal (autentizace) | Vysoka | Zakaznik |
| **5** | S11 | Chat a komentare | Vysoka | Zakaznik |
| **6** | S16 | Multijazynost a multimenovost | Vysoka | Platforma |
| **6** | S20 | Public API a Developer portal | Vysoka | Platforma |
| **6** | S19 | CRM, Marketing a Analytika | Vysoka | Platforma |
| **6** | S21 | Bezpecnost, Dane a Enterprise | Vysoka | Platforma |
| **7** | S18 | Pokrocile funkce (vice technologii) | Velmi vysoka | Enterprise |
| **7** | S17 | E-commerce pluginy (Shopify, WooCommerce) | Vysoka | Enterprise |
| **7** | S22 | Onboarding a Tutorialy | Nizka | Finalizace |

---

## 2. Implementacni faze — detailni popis

> **Filosofie rozlozeni:**
> Poradi je navrzeno pro **prototyp-first pristup**. Nejdriv zprovoznit zakladni
> user flow (zakaznik nahraje model → vidi cenu → objedna), pak postupne pridavat
> features ktere zvysuji hodnotu. Slozite platformove a enterprise veci az nakonec,
> protoze zatim se dela prototyp a ne finalni produkt.
>
> **Klicova pravidla:**
> 1. Kazda faze MUSI byt kompletni pred zahajenim dalsi
> 2. V ramci faze se sekce implementuji v uvedenem poradi (shora dolu)
> 3. Paralelni prace je mozna POUZE u sekci oznacenych "paralelizovatelne"
> 4. Po kazde fazi nasleduje testovaci a stabilizacni obdobi

---

### FAZE 1 — Zaklad (funkcni prototyp)

```
CILE:  Opravit existujici bugy, zprovoznit objednavkovy flow,
       zakladni cenove mechanismy.
STAV:  Bez teto faze NEFUNGUJE NIC dalsiho.
SCOPE: 3 sekce (S01, S02, S05)
```

| Poradi | Sekce | Nazev | Obtiznost | Novy namespace |
|--------|-------|-------|-----------|----------------|
| 1.1 | **S01** | Opravy bugu a reaktivni cenotvorba | Stredni | — (existujici) |
| 1.2 | **S02** | Kontaktni formular a checkout | Stredni | `form:v1` |
| 1.3 | **S05** | Mnozstevni slevy a cenova degrese | Nizka | — (rozsireni `pricing:v3`) |

**Detailni popis kazde sekce:**

#### 1.1 — S01: Opravy bugu a reaktivni cenotvorba
- **Co resi:** Automaticky prepocet cen pri zmene parametru (material, kvalita, mnozstvi),
  oprava stavu kdy zakaznik musi rucne klikat "Prepocitat". Per-model preset konfigurace.
- **Proc prvni:** Je to zaklad — bez spravne fungujici kalkulacky nema smysl nic dalsiho.
- **Zavislosti:** ZADNE — ciste opravy existujiciho kodu.
- **Hlavni soubory:** `src/lib/pricing/pricingEngineV3.js`, `src/pages/test-kalkulacka/index.jsx`
- **Klicovi agenti:** `mp-mid-frontend-public`, `mp-spec-be-slicer`, `mp-mid-pricing-engine`

#### 1.2 — S02: Kontaktni formular a dokonceni objednavky
- **Co resi:** Zakaznik vyplni kontaktni udaje, vidi souhrn objednavky, odesle objednavku.
  Potvrzovaci stranka s rekapitulaci. Zakladni objednavkovy flow.
- **Proc druhy:** Bez checkout flow neni mozne objednat — zakladni konverze.
- **Zavislosti:** S01 (spravne ceny pro souhrn objednavky).
- **Hlavni soubory:** `src/pages/test-kalkulacka/` (novy krok), `src/utils/adminOrdersStorage.js`
- **Klicovi agenti:** `mp-spec-fe-forms`, `mp-spec-fe-checkout`, `mp-mid-backend-api`

#### 1.3 — S05: Mnozstevni slevy a cenova degrese
- **Co resi:** Cenove tabulky podle mnozstvi (napr. 1-5 ks = zakladni cena, 6-20 ks = -10%,
  21+ ks = -20%). Konfigurace v admin panelu.
- **Proc ve Fazi 1:** Nizka obtiznost, velky business value, minimalni zasah do pricing engine.
- **Zavislosti:** S01 (pricing engine musi fungovat spravne).
- **Hlavni soubory:** `src/lib/pricing/pricingEngineV3.js` (novy krok v pipeline)
- **Klicovi agenti:** `mp-mid-pricing-engine`, `mp-mid-frontend-admin`

**Paralelizace ve Fazi 1:**
- S01 musi byt prvni (zaklad)
- S02 a S05 jsou na sobe nezavisle — MOHOU se delat paralelne po dokonceni S01

**Co musi fungovat po Fazi 1:**
- [x] Kalkulacka automaticky prepocitava ceny pri zmene parametru
- [x] Zakaznik muze vyplnit formular a odeslat objednavku
- [x] Mnozstevni slevy se spravne aplikuji v cene
- [x] Admin muze nastavit cenove tabulky pro mnozstvi

---

### FAZE 2 — Rozsireni kalkulacky (kompletni cenovy flow)

```
CILE:  Kalkulacka umi vic — post-processing, express dodani, doprava.
       Zakaznik vidi kompletni cenu vcetne vsech slozek.
STAV:  Zakladni prototyp funguje, ted se doplnuji cenove vrstvy.
SCOPE: 3 sekce (S06, S09, S04)
```

| Poradi | Sekce | Nazev | Obtiznost | Novy namespace |
|--------|-------|-------|-----------|----------------|
| 2.1 | **S06** | Post-processing (bruseni, lakovani, lesteni) | Nizka | `postprocessing:v1` |
| 2.2 | **S09** | Express pricing a upselly | Stredni | `express:v1` |
| 2.3 | **S04** | Doprava a dodaci lhuty | Stredni | `shipping:v1` |

**Detailni popis kazde sekce:**

#### 2.1 — S06: Post-processing
- **Co resi:** Zakaznik si muze pridat sluzby po tisku — bruseni, lakovani, lesteni,
  koating, odstranovani podpor. Kazda sluzba ma svou cenu a vliv na dobu dodani.
- **Proc prvni ve Fazi 2:** Nejnizsi obtiznost — rozsiruje existujici fees system,
  nepotrebuje novou infrastrukturu. Pridava fee kategorii "POST_PROCESSING" do `fees:v3`.
- **Zavislosti:** S01 (fees system musi fungovat).
- **Sdilena logika s S09:** Oba rozsiruj fees — implementuj S06 prvni, S09 znovupouzije pattern.
- **Klicovi agenti:** `mp-spec-pricing-fees`, `mp-mid-frontend-public`, `mp-mid-frontend-admin`

#### 2.2 — S09: Express pricing a upselly
- **Co resi:** Expresni dodani (Standard/Express/Rush) s ruznou cenou a dobou.
  Upsell system v checkoutu (nabidky na vylepseni — lepsi material, post-processing, express).
- **Proc druhy:** Stredni obtiznost, navazuje na S06 (oba jsou fee kategorie).
  Novy krok v pricing engine pipeline: `base → fees → express → markup → minima → rounding`.
- **Zavislosti:** S06 (sdilena fee logika), S02 (checkout pro upselly).
- **Klicovi agenti:** `mp-spec-pricing-fees`, `mp-spec-fe-checkout`, `mp-mid-pricing-engine`

#### 2.3 — S04: Doprava a dodaci lhuty
- **Co resi:** Konfigurace dopravnich metod v adminu (nazev, cena, doba, vaha limit),
  vyber dopravy v kalkulacce, free shipping od urcite castky, odhad dodani.
- **Proc posledni ve Fazi 2:** Kompletuje objednavkovy flow — zakaznik ted vidi
  celkovou cenu vcetne dopravy. Potrebuje S02 (checkout) a S09 (express pro dobu dodani).
- **Zavislosti:** S02 (checkout flow pro vyber dopravy).
- **Klicovi agenti:** `mp-spec-pricing-shipping`, `mp-mid-frontend-admin`, `mp-spec-fe-checkout`

**Paralelizace ve Fazi 2:**
- S06 musi byt prvni (zaklada fee pattern)
- S09 zavisi na S06
- S04 zavisi na S02 (z Faze 1), ale je nezavisly na S06/S09 — MUZE se delat paralelne s S09

**Co musi fungovat po Fazi 2:**
- [x] Zakaznik vidi a vybira post-processing sluzby s cenami
- [x] Zakaznik vybira uroven dodani (standard/express/rush) s cenou
- [x] Zakaznik vybira dopravu s cenou a odhadem dodani
- [x] Celkova cena zahrnuje: zaklad + fees + post-processing + express + doprava
- [x] Admin konfiguruje vsechny tyto polozky v admin panelu

---

### FAZE 3 — Sprava objednavek a komunikace

```
CILE:  Objednavky uz chodi — ted je potreba je efektivne spravovat,
       komunikovat se zakaznikem, a pridat marketingove nastroje.
STAV:  Kompletni objednavkovy flow funguje, ted se resi "co po objednani".
SCOPE: 3 sekce (S14, S07, S10)
```

| Poradi | Sekce | Nazev | Obtiznost | Novy namespace |
|--------|-------|-------|-----------|----------------|
| 3.1 | **S14** | Kanban board (vizualni sprava objednavek) | Stredni | `kanban:v1` |
| 3.2 | **S07** | Emailove notifikace | Vysoka | `email:v1` |
| 3.3 | **S10** | Slevove kupony a promo akce | Stredni | `coupons:v1` |

**Detailni popis kazde sekce:**

#### 3.1 — S14: Kanban board
- **Co resi:** Vizualni drag-and-drop sprava objednavek ve sloupcich podle stavu
  (Nova, V priprave, Tisk, Post-processing, QC, Odeslana, Hotova, Zrusena).
  Alternativni zobrazeni k existujici tabulce v AdminOrders.
- **Proc prvni ve Fazi 3:** Stredni obtiznost, obrovska hodnota pro admina —
  okamzite videt co je v jakem stavu, presunout objednavku tahem.
- **Zavislosti:** S02 (objednavky musi existovat).
- **Klicovi agenti:** `mp-spec-fe-kanban`, `mp-mid-frontend-admin`
- **Knihovny:** `@dnd-kit/core` + `@dnd-kit/sortable` (ne react-beautiful-dnd — deprecated)

#### 3.2 — S07: Emailove notifikace
- **Co resi:** Automaticke emaily zakaznikovi pri zmene stavu objednavky.
  10 sablon (potvrzeni objednavky, v priprave, odeslano, doruceno...).
  Admin konfigurace: SMTP/API provider, sablony s promennymi, branding.
  Email log s historii odeslani.
- **Proc druhy:** Vysoka obtiznost (externi zavislost na email provideru),
  ale kriticke pro profesionalitu — zakaznik MUSI dostat email po objednani.
- **Zavislosti:** S02 (objednavky), S04 (dopravni info pro emaily).
- **POZOR:** Nova admin stranka `/admin/emails` se 3 taby (Sablony, Nastaveni, Log).
- **Klicovi agenti:** `mp-spec-be-email`, `mp-mid-backend-api`, `mp-mid-frontend-admin`

#### 3.3 — S10: Kupony a promo akce
- **Co resi:** Slevovy system s kody (napr. LETO2026 = -15%), pravidla pouziti
  (min. castka, max. pouziti, platnost, kategorie), hromadne generovani kodu,
  flash sales s odpoctem, analyticka statistika kuponu.
- **Proc treti:** Stredni obtiznost, velky marketingovy value.
  Novy krok v pricing engine: `base → fees → express → COUPON → markup → minima → rounding`.
- **Zavislosti:** S02 (checkout pro zadani kodu), S05 (pricing pipeline).
- **Klicovi agenti:** `mp-spec-pricing-coupons`, `mp-mid-pricing-discounts`, `mp-mid-frontend-admin`

**Paralelizace ve Fazi 3:**
- S14 je nezavisly na S07 a S10 — MUZE se delat paralelne
- S07 a S10 jsou na sobe nezavisle — MOHOU se delat paralelne
- V praxi: S14 + S07 paralelne, pak S10 (nebo vsechny tri paralelne pokud jsou kapacity)

**Co musi fungovat po Fazi 3:**
- [x] Admin vidi objednavky na Kanban boardu a pretahuje je mezi stavy
- [x] Zakaznik dostava emaily pri kazde zmene stavu objednavky
- [x] Admin konfiguruje emailove sablony, SMTP, branding
- [x] Zakaznik zadava slevovy kod v checkoutu a vidi slevu
- [x] Admin vytvari kupony, nastavuje pravidla, vidi statistiky pouziti

---

### FAZE 4 — Pokrocila kalkulacka (vice formatu, kvalita, presnost)

```
CILE:  Kalkulacka se stava profesionalni — podporuje vic 3D formatu,
       kontroluje kvalitu modelu, nabizi vic metod cenotvorby.
STAV:  Zakladni i rozsireny flow funguje, ted se zlepsuje "vstup a presnost".
SCOPE: 3 sekce (S03, S08, S15)
```

| Poradi | Sekce | Nazev | Obtiznost | Novy namespace |
|--------|-------|-------|-----------|----------------|
| 4.1 | **S03** | Multi-format 3D soubory (OBJ, 3MF, STEP) | Vysoka | — |
| 4.2 | **S08** | Printability check a mesh analyza | Vysoka | — (transientni data) |
| 4.3 | **S15** | Rozsirene metody cenotvorby | Stredni | `pricing-methods:v1` |

**Detailni popis kazde sekce:**

#### 4.1 — S03: Multi-format 3D soubory
- **Co resi:** Podpora OBJ, 3MF a STEP/STP formatu (nyni jen STL).
  Validacni pipeline pro kazdy format, 3D viewer update (Three.js loadery),
  backend konverze STEP → STL pro slicing.
- **Proc prvni ve Fazi 4:** Otevreni kalkulacky pro vic zakazniku (ne kazdy ma STL).
  STEP je standard v prumyslu — bez nej ztracis velkou skupinu zakazniku.
- **Zavislosti:** S01 (slicer integrace funguje).
- **POZOR:** STEP konverze je vypocetne narocna — muze vyzadovat Python backend (OpenCASCADE).
- **Klicovi agenti:** `mp-spec-fe-upload`, `mp-spec-3d-viewer`, `mp-spec-be-slicer`, `mp-spec-be-upload`

#### 4.2 — S08: Printability check a mesh analyza
- **Co resi:** Automaticka kontrola modelu po nahrani — vodotesnost (watertight),
  minimalni tloustka sten, bounding box vs. printer volume, detekce previslu,
  DFM (Design for Manufacturing) tipy, vizualizace problemu v 3D vieweru.
- **Proc druhy:** Navazuje na S03 (potrebuje parsovane formaty). Snizuje pocet
  vadnych objednavek — obrovsky value pro provozovatele tiskarny.
- **Zavislosti:** S03 (multi-format podpora), S01 (slicer pro `--check-model`).
- **Klicovi agenti:** `mp-spec-3d-analysis`, `mp-spec-be-slicer`, `mp-spec-3d-viewer`

#### 4.3 — S15: Rozsirene metody cenotvorby
- **Co resi:** Vedle slicer-based ceny i dalsi metody: volume-based, bounding-box,
  surface-area, weight-only, time-only, hybrid. Strategy pattern v pricing engine.
  Per-material metoda (napr. resin = volume, FDM = slicer, CNC = bounding-box).
- **Proc treti:** Stredni obtiznost ale hlubsi zmena v pricing engine.
  Vyuziva `getModelMetrics()` ktery uz existuje — neni potreba nova geometrie.
- **Zavislosti:** S01 (pricing engine zaklad).
- **Klicovi agenti:** `mp-mid-pricing-engine`, `mp-sr-pricing`

**Paralelizace ve Fazi 4:**
- S03 musi byt pred S08 (S08 potrebuje parsovane formaty)
- S15 je nezavisly na S03/S08 — MUZE se delat paralelne s S03
- Doporuceno: S03 + S15 paralelne, pak S08

**Co musi fungovat po Fazi 4:**
- [x] Zakaznik nahraje OBJ, 3MF a STEP soubory (ne jen STL)
- [x] Po nahrani se automaticky kontroluje kvalita modelu
- [x] Zakaznik vidi DFM tipy a vizualizaci problemu v 3D vieweru
- [x] Admin vybira metodu cenotvorby per material (slicer, volume, bbox...)
- [x] Pricing engine pouziva vybranou metodu pro vypocet ceny

---

### FAZE 5 — Zakaznicke funkce (ucty, dokumenty, chat)

```
CILE:  Zakaznik dostava vlastni ucet, muze si stahnout dokumenty,
       komunikovat s adminem. Prechod od anonymniho prototypu k systemu.
STAV:  Produkt je funkcni a profesionalni, ted se pridava "zakaznicka vrstva".
SCOPE: 3 sekce (S13, S12, S11)
```

| Poradi | Sekce | Nazev | Obtiznost | Novy namespace |
|--------|-------|-------|-----------|----------------|
| 5.1 | **S13** | Generovani dokumentu (PDF) | Stredni | `documents:v1` |
| 5.2 | **S12** | Zakaznicky portal (autentizace) | Vysoka | `customers:v1` |
| 5.3 | **S11** | Chat a komentare k objednavkam | Vysoka | `chat:v1` |

**Detailni popis kazde sekce:**

#### 5.1 — S13: Generovani dokumentu (PDF)
- **Co resi:** Automaticke generovani PDF dokumentu — faktury, nabidky, dodaci listy,
  potvrzeni objednavky, dobropisy. Sablony s promennymi, sekvencni cislovani,
  QR platebni kody (SPAYD pro cesky trh), export a tisk.
- **Proc prvni ve Fazi 5:** Stredni obtiznost (jednodussi nez portal/chat),
  velky business value — profesionalni dokumenty zvysuji duveryhodnost.
- **Zavislosti:** S02 (objednavky pro data), S07 (email pro automaticke odeslani PDF).
- **Klicovi agenti:** `mp-spec-be-pdf`, `mp-mid-frontend-admin`, `mp-mid-storage-tenant`
- **Knihovny:** `@react-pdf/renderer` (client-side) nebo `jsPDF` (lightweight)

#### 5.2 — S12: Zakaznicky portal (autentizace)
- **Co resi:** Registrace a prihlaseni zakazniku (email+heslo, Google OAuth, magic link),
  dashboard s prehledem objednavek, historie objednavek s filtry, znovu-objednani,
  knihovna 3D modelu, sprava adres (fakturacni + dodaci), nastaveni uctu.
- **Proc druhy:** Vysoka obtiznost a SECURITY-KRITICKA sekce — autentizace musi byt
  bulletproof. Ale az ted ma smysl — existuje dost features aby portal mel hodnotu.
- **Zavislosti:** S02 (objednavky), S07 (emaily pro registraci/reset hesla).
- **BEZPECNOST:** Brute-force ochrana, session management, IDOR prevence, argon2 hesla.
- **Klicovi agenti:** `mp-spec-be-auth`, `mp-spec-security-auth`, `mp-sr-security`

#### 5.3 — S11: Chat a komentare k objednavkam
- **Co resi:** Interni komentare (jen admin — pinning, @mentions, prilohy),
  zakaznicky chat (sablony, promenne, potvrzeni precteni), sjednoceny timeline
  (statusy + zpravy + poznamky), token-based pristup pro zakazniky.
- **Proc treti:** Vysoka obtiznost (WebSocket/polling), az po portalu — zakaznik
  se musi prihlasit aby chatoval.
- **Zavislosti:** S12 (zakaznicky portal pro prihlaseni), S02 (objednavky).
- **Klicovi agenti:** `mp-spec-be-websocket`, `mp-spec-fe-notifications`, `mp-mid-backend-services`

**Paralelizace ve Fazi 5:**
- S13 je nezavisly na S12/S11 — MUZE se delat paralelne s S12
- S11 zavisi na S12 (zakaznicky portal pro auth)
- Doporuceno: S13 + S12 paralelne, pak S11

**Co musi fungovat po Fazi 5:**
- [x] System automaticky generuje PDF faktury, nabidky, dodaci listy
- [x] Zakaznik se registruje, prihlasuje, vidi historii objednavek
- [x] Zakaznik muze znovu-objednat, spravovat adresy, ukladat modely
- [x] Admin i zakaznik mohou komunikovat pres chat u objednavky
- [x] Admin vidi interni poznamky, zakaznik vidi jen verejne zpravy

---

### FAZE 6 — Platforma a integrace (rozsireni na vic trhu)

```
CILE:  System se stava platformou — multijazynost, API pro externi systemy,
       CRM pro spravu zakazniku, bezpecnostni a danovy compliance.
STAV:  Produkt je plne funkcni, ted se pripravuje na skalovani a integrace.
SCOPE: 4 sekce (S16, S20, S19, S21)
```

| Poradi | Sekce | Nazev | Obtiznost | Novy namespace |
|--------|-------|-------|-----------|----------------|
| 6.1 | **S16** | Multijazynost a multimenovost | Vysoka | `localization:v1` |
| 6.2 | **S20** | Public API a Developer portal | Vysoka | `api-keys:v1` |
| 6.3 | **S19** | CRM, Marketing a Analytika | Vysoka | `marketing:v1` |
| 6.4 | **S21** | Bezpecnost, Dane a Enterprise | Vysoka | `tax:v1` |

**Detailni popis kazde sekce:**

#### 6.1 — S16: Multijazynost a multimenovost
- **Co resi:** Plna i18n podpora (cs, en, de, sk, pl), dynamicke prepinani jazyka,
  vice men (CZK, EUR, USD, GBP, PLN) s kurzovym prepoctem,
  sjednoceni dvou paralelnich i18n systemu (i18next + LanguageContext).
- **Proc prvni ve Fazi 6:** Zaklad pro rozsireni na zahranicni trhy.
  ~360 hardcoded textu k nahrazeni, ale nutne pro jakoukoliv integraci.
- **Zavislosti:** Vsechny admin stranky by idealne mely existovat (aby se prelozily).
- **POZOR:** Sjednoceni i18next + LanguageContext je kriticka migrace.
- **Klicovi agenti:** `mp-sr-i18n`, `mp-spec-i18n-translations`, `mp-mid-frontend-widget`

#### 6.2 — S20: Public API a Developer portal
- **Co resi:** REST API pro externi systemy (23 endpointu — modely, cenove nabidky,
  objednavky, materialy, presety, doprava, zakaznici, webhooky).
  API key management, rate limiting, OpenAPI/Swagger dokumentace, sandbox.
- **Proc druhy:** Umoznuje externi integrace — az kdyz je co exponovat.
  SECURITY-KRITICKE — rate limiting, auth, input validace musi byt bulletproof.
- **Zavislosti:** S12 (zakaznici pro API), S07 (webhooky pro notifikace).
- **Klicovi agenti:** `mp-mid-backend-api`, `mp-spec-security-api-keys`, `mp-spec-docs-api`

#### 6.3 — S19: CRM, Marketing a Analytika
- **Co resi:** Zakaznicka databaze s tagging/segmentaci (VIP, Recurring, Inactive),
  sledovani opustenych kosiku, emailove kampane a marketing automatizace,
  analyticky dashboard (obrat, konverze, oblibene materialy, top zakaznici).
- **Proc treti:** Navazuje na S12 (zakaznici musi existovat) a S10 (kupony pro kampane).
- **Zavislosti:** S12 (zakaznicky portal), S07 (emaily), S10 (kupony).
- **Klicovi agenti:** `mp-mid-frontend-admin`, `mp-spec-fe-charts`, `mp-mid-storage-tenant`

#### 6.4 — S21: Bezpecnost, Dane a Enterprise
- **Co resi:** GDPR compliance (export dat, smazani uctu, anonymizace, retencni politiky),
  DPH/VAT kalkulace (VIES API pro EU validaci, reverse charge pro B2B),
  kreditni system (predplaceny zustatek), security hardening (HSTS, CSP, CORS),
  audit logging, SLA monitoring.
- **Proc posledni ve Fazi 6:** Obaluje cely system bezpecnostni a compliance vrstvou.
  Nema smysl delat driv — je potreba vedet co se zabezpecuje.
- **Zavislosti:** S12 (ucty pro GDPR), S20 (API pro security).
- **Klicovi agenti:** `mp-sr-security`, `mp-spec-security-gdpr`, `mp-spec-pricing-tax`

**Paralelizace ve Fazi 6:**
- S16 je nezavisly na ostatnich — MUZE se delat paralelne s S20
- S20 muze byt paralelne s S16
- S19 zavisi na S12 (z Faze 5) — muze byt paralelne s S16/S20
- S21 by mel byt posledni (obaluje vse)
- Doporuceno: S16 + S20 + S19 paralelne, pak S21

**Co musi fungovat po Fazi 6:**
- [x] Widget a admin panel jsou dostupne v 5 jazycich a 6 menach
- [x] Externi systemy mohou pouzivat REST API s API klici
- [x] Developer portal s dokumentaci a sandbox prostredim
- [x] CRM dashboard s prehledem zakazniku, segmentaci, kampanemi
- [x] System je GDPR compliant (export, smazani, audit log)
- [x] DPH se automaticky pocita a validuje

---

### FAZE 7 — Enterprise a finalizace (posledni)

```
CILE:  Podpora vice tiskovych technologii, e-commerce integrace,
       onboarding pro nove uzivatele.
STAV:  Produkt je kompletni platforma, ted se pridavaji enterprise features
       a pripravuje se na onboarding novych zakazniku.
SCOPE: 3 sekce (S18, S17, S22)
POZOR: Tyto sekce jsou bud MASIVNE slozite (S18), nebo zavisi na VSEM
       predchozim (S17, S22). Delej je az kdyz je vse ostatni stabilni.
```

| Poradi | Sekce | Nazev | Obtiznost | Novy namespace |
|--------|-------|-------|-----------|----------------|
| 7.1 | **S18** | Vice technologii (SLA, SLS, CNC...) | Velmi vysoka | `technologies:v1` |
| 7.2 | **S17** | E-commerce pluginy (Shopify, WooCommerce) | Vysoka | `ecommerce:v1` |
| 7.3 | **S22** | Onboarding a Tutorialy | Nizka | `onboarding:v1` |

**Detailni popis kazde sekce:**

#### 7.1 — S18: Pokrocile funkce (vice technologii)
- **Co resi:** Podpora vice tiskovych technologii vedle FDM — SLA (resin), SLS (powder),
  MJF (multi jet fusion), CNC (subtraktivni). Kazda technologie ma jiny cenovy model,
  jine parametry, jiny slicer. Model versioning, supply chain management.
- **Proc ve Fazi 7:** **NEJSLOZITEJSI SEKCE V CELEM PROJEKTU.**
  Fundamentalni architekturalni zmena — pricing engine je nyni single-technology (FDM).
  Strategy pattern refactoring `calculateOrderQuote()` pro multi-tech.
  Nedelej dokud neni VSECHNO ostatni stabilni a otestovane.
- **Zavislosti:** Prakticky vsechny predchozi faze, zejmena S15 (pricing methods).
- **RIZIKO:** Muze rozbít existujici pricing pipeline pokud se spatne implementuje.
- **Klicovi agenti:** `mp-sr-pricing`, `mp-sr-backend`, `mp-mid-pricing-engine`

#### 7.2 — S17: E-commerce pluginy
- **Co resi:** WordPress/WooCommerce plugin, Shopify app, custom JS embed SDK.
  OAuth autentizace, webhook synchronizace objednavek, product sync.
- **Proc ve Fazi 7:** Prototyp NEPOTREBUJE pluginy — to je az pro hotovy produkt.
  Slozite kvuli platform-specifickym API (Shopify Admin API, WooCommerce REST API).
  Navic zavisi na S16 (multijazynost) a S20 (public API).
- **Zavislosti:** S16 (i18n), S20 (API), prakticky vsechny predchozi faze.
- **Klicovi agenti:** `mp-spec-ecom-shopify`, `mp-spec-ecom-woo`, `mp-sr-ecommerce`

#### 7.3 — S22: Onboarding a Tutorialy
- **Co resi:** 5-krokovy onboarding wizard pro nove adminy, kontextove tooltips
  u kazdeho duleziteho pole, video tutorialy (8 videii po 3-7 min),
  template gallery (prednastavene konfigurace), help widget, knowledge base.
- **Proc UPLNE POSLEDNI:** Tutorialy a onboarding se pisou az kdyz **VSE existuje**.
  Jinak pises navody na neco co se jeste zmeni. Taky ma nejnizsi obtiznost —
  je to "lesk" na hotovy produkt.
- **Zavislosti:** Vsechny predchozi faze (onboarding prochazi vsechny admin stranky).
- **Klicovi agenti:** `mp-spec-design-onboarding`, `mp-mid-design-ux`, `mp-sr-docs`

**Paralelizace ve Fazi 7:**
- S18 musi byt prvni (fundamentalni zmena, ostatni musi vedet jake rozhrani dostanou)
- S17 muze byt paralelne s S18 (jine tymy, jine cesty)
- S22 az uplne nakonec — po vsem ostatnim

**Co musi fungovat po Fazi 7:**
- [x] Admin vybira technologii tisku (FDM, SLA, SLS, CNC) s ruznym pricing modelem
- [x] Shopify a WooCommerce pluginy synchronizuji produkty a objednavky
- [x] Novy admin projde 5-krokovym onboardingem a je schopen pouzivat system
- [x] Kontextove tooltips a help widget jsou k dispozici vsude

---

## 3. Graf zavislosti mezi sekcemi (aktualizovany)

```
FAZE 1 ─────────────────────────────────────────────────────────────
  S01 (Bug Fixes) ──────────────────────────────> [ZAKLAD PRO VSE]
    │
    ├── S02 (Checkout) ─┐
    │                   ├──> [Faze 1 HOTOVA — funkcni prototyp]
    └── S05 (Slevy) ────┘

FAZE 2 ─────────────────────────────────────────────────────────────
  S06 (Post-processing)
    │
    └── S09 (Express) ──┐
                        ├──> [Faze 2 HOTOVA — kompletni ceny]
  S04 (Doprava) ────────┘
    │ (zavisi na S02)

FAZE 3 ─────────────────────────────────────────────────────────────
  S14 (Kanban) ─────────┐
                        │
  S07 (Emaily) ─────────┼──> [Faze 3 HOTOVA — sprava + komunikace]
    │ (zavisi na S04)   │
                        │
  S10 (Kupony) ─────────┘
    │ (zavisi na S02, S05)

FAZE 4 ─────────────────────────────────────────────────────────────
  S03 (Multi-format) ──> S08 (Printability) ──┐
                                              ├> [Faze 4 HOTOVA]
  S15 (Pricing methods) ─────────────────────┘

FAZE 5 ─────────────────────────────────────────────────────────────
  S13 (Dokumenty PDF) ──┐
                        │
  S12 (Portal) ──> S11 (Chat) ──> [Faze 5 HOTOVA — zakaznicke funkce]
    │ (zavisi na S07)

FAZE 6 ─────────────────────────────────────────────────────────────
  S16 (i18n) ───────────┐
                        │
  S20 (Public API) ─────┼──> S21 (Security) ──> [Faze 6 HOTOVA]
                        │
  S19 (CRM) ───────────┘
    │ (zavisi na S12, S07, S10)

FAZE 7 ─────────────────────────────────────────────────────────────
  S18 (Vice technologii) ──> S17 (Pluginy) ──> S22 (Onboarding)
    │ (zavisi na S15)         │ (zavisi        │ (zavisi na
                              │  na S16, S20)  │  VSEM)
                              │                │
                              └────────────────┴──> [PROJEKT HOTOVY]
```

---

## 4. Kompletni poradi implementace (linearni pohled)

Pro jednoznacnost — toto je presne poradi ve kterem se sekce implementuji.
Cislo pred sekcemi znaci absolutni poradi (1 = prvni, 22 = posledni).

| # | Faze | Sekce | Nazev | Obtiznost | Muze paralelne s |
|---|------|-------|-------|-----------|-------------------|
| 1 | F1 | **S01** | Bug fixes a reaktivni cenotvorba | Stredni | — (prvni) |
| 2 | F1 | **S02** | Kontaktni formular a checkout | Stredni | S05 |
| 3 | F1 | **S05** | Mnozstevni slevy | Nizka | S02 |
| 4 | F2 | **S06** | Post-processing | Nizka | — |
| 5 | F2 | **S09** | Express pricing a upselly | Stredni | S04 |
| 6 | F2 | **S04** | Doprava a dodaci lhuty | Stredni | S09 |
| 7 | F3 | **S14** | Kanban board | Stredni | S07, S10 |
| 8 | F3 | **S07** | Emailove notifikace | Vysoka | S14, S10 |
| 9 | F3 | **S10** | Kupony a promo akce | Stredni | S14, S07 |
| 10 | F4 | **S03** | Multi-format 3D soubory | Vysoka | S15 |
| 11 | F4 | **S15** | Rozsirene metody cenotvorby | Stredni | S03 |
| 12 | F4 | **S08** | Printability check | Vysoka | — (po S03) |
| 13 | F5 | **S13** | Generovani dokumentu (PDF) | Stredni | S12 |
| 14 | F5 | **S12** | Zakaznicky portal | Vysoka | S13 |
| 15 | F5 | **S11** | Chat a komentare | Vysoka | — (po S12) |
| 16 | F6 | **S16** | Multijazynost | Vysoka | S20, S19 |
| 17 | F6 | **S20** | Public API | Vysoka | S16, S19 |
| 18 | F6 | **S19** | CRM, Marketing | Vysoka | S16, S20 |
| 19 | F6 | **S21** | Bezpecnost, Dane | Vysoka | — (po S16-S20) |
| 20 | F7 | **S18** | Vice technologii | Velmi vysoka | S17 |
| 21 | F7 | **S17** | E-commerce pluginy | Vysoka | S18 |
| 22 | F7 | **S22** | Onboarding a Tutorialy | Nizka | — (posledni) |

---

## 5. Pricing engine pipeline — evoluce pres faze

Pricing engine (`pricingEngineV3.js`) se postupne rozsiruje o nove kroky.
Kazda faze pridava novou vrstvu do pipeline:

```
FAZE 1 (zaklad):
  model_metrics → base_price → fees → markup → minima → rounding = CENA

FAZE 1 + S05 (mnozstevni slevy):
  model_metrics → base_price → fees → VOLUME_DISCOUNT → markup → minima → rounding

FAZE 2 + S06/S09 (post-processing + express):
  model_metrics → base_price → fees → POST_PROCESSING → EXPRESS → volume_discount → markup → minima → rounding

FAZE 2 + S04 (doprava):
  ... → rounding = subtotal → SHIPPING = CELKOVA_CENA

FAZE 3 + S10 (kupony):
  ... → express → COUPON_DISCOUNT → volume_discount → markup → minima → rounding → shipping

FAZE 4 + S15 (rozsirene metody):
  STRATEGY_SELECT → model_metrics → base_price(strategy) → fees → ... → shipping

FAZE 6 + S21 (dane):
  ... → rounding → shipping → TAX = FINALNI_CENA

FAZE 7 + S18 (vice technologii):
  TECHNOLOGY_SELECT → STRATEGY_SELECT → model_metrics → base_price(tech+strategy) → ...
```

---

## 6. Tenant Storage Namespace Registry

### Existujici namespaces (uz v codebase)

| Namespace | Storage helper | Pouzivaji | Faze |
|-----------|---------------|-----------|------|
| `pricing:v3` | `adminPricingStorage.js` | Cenotvorba, materialy, kvality | F1 |
| `fees:v3` | `adminFeesStorage.js` | Priplatky (surchargey) | F1 |
| `branding` | `adminBrandingWidgetStorage.js` | Logo, barvy, fonty | — |
| `widget` | `widgetThemeStorage.js` | Widget konfigurace | — |
| `orders` | `adminOrdersStorage.js` | Objednavky | F1 |
| `analytics` | `adminAnalyticsStorage.js` | Analytika | — |
| `team` | `adminTeamAccessStorage.js` | Pristupova prava | — |
| `audit` | `adminAuditLogStorage.js` | Audit log | — |
| `dashboard` | `adminDashboardStorage.js` | Dashboard | — |

### Nove namespaces (planovane, serazene podle faze)

| Namespace | Faze | Sekce | Ucel | Helper (novy) |
|-----------|------|-------|------|---------------|
| `form:v1` | F1 | S02 | Checkout formular konfig | rozsireni existujiciho |
| `shipping:v1` | F2 | S04 | Dopravni metody | `adminShippingStorage.js` |
| `postprocessing:v1` | F2 | S06 | Post-processing kategorie | rozsireni `adminFeesStorage.js` |
| `express:v1` | F2 | S09 | Expresni urovne | `adminExpressStorage.js` |
| `kanban:v1` | F3 | S14 | Kanban konfigurace | `adminKanbanStorage.js` |
| `email:v1` | F3 | S07 | Emailove sablony, konfig | `adminEmailStorage.js` |
| `coupons:v1` | F3 | S10 | Kupony a promo akce | `adminCouponsStorage.js` |
| `pricing-methods:v1` | F4 | S15 | Rozsirene metody cen | rozsireni `adminPricingStorage.js` |
| `documents:v1` | F5 | S13 | Sablony dokumentu | `adminDocumentsStorage.js` |
| `customers:v1` | F5 | S12, S19 | Zakaznicka databaze | `adminCustomersStorage.js` |
| `chat:v1` | F5 | S11 | Chat sablony, konfig | `adminChatStorage.js` |
| `localization:v1` | F6 | S16 | Jazyky, meny, preklady | `adminLocalizationStorage.js` |
| `api-keys:v1` | F6 | S20 | API klice, rate limits | `adminApiKeysStorage.js` |
| `marketing:v1` | F6 | S19 | Kampane, segmentace | `adminMarketingStorage.js` |
| `tax:v1` | F6 | S21 | Dane, DPH, fakturace | `adminTaxStorage.js` |
| `technologies:v1` | F7 | S18 | Tiskove technologie | `adminTechnologyStorage.js` |
| `ecommerce:v1` | F7 | S17 | Integrace konfig | `adminEcommerceStorage.js` |
| `onboarding:v1` | F7 | S22 | Stav onboardingu | `adminOnboardingStorage.js` |

**Vzor klice:** `modelpricer:${tenantId}:${namespace}`
**Entrypoint:** Vzdy pres `getTenantId()` z `adminTenantStorage.js`

---

## 7. Agent Load Matrix — kteri agenti budou nejvice vyuziti

### Senior agenti (architektura + review)

| Agent | Faze zapojeni | Primarni sekce | Vytizeni |
|-------|--------------|----------------|----------|
| `mp-sr-orchestrator` | F1-F7 | Vsechny (koordinace) | Velmi vysoke |
| `mp-sr-frontend` | F1-F7 | Vsechny FE zmeny | Velmi vysoke |
| `mp-sr-backend` | F2-F7 | Vsechny BE zmeny | Velmi vysoke |
| `mp-sr-pricing` | F1, F2, F3, F4, F7 | S01, S05, S09, S10, S15, S18 | Vysoke |
| `mp-sr-storage` | F1-F7 | Vsechny s novymi namespaces | Vysoke |
| `mp-sr-security` | F5, F6 | S12, S20, S21 | Stredni |
| `mp-sr-i18n` | F6 | S16 | Nizke |
| `mp-sr-3d` | F4 | S03, S08 | Nizke |

### Middle agenti (implementace)

| Agent | Faze | Primarni sekce |
|-------|------|---------------|
| `mp-mid-frontend-public` | F1, F4 | S01, S03, S08 (kalkulacka) |
| `mp-mid-frontend-admin` | F2-F7 | S04, S06, S07, S10, S14, S19, S22 (admin panel) |
| `mp-mid-frontend-widget` | F1, F2, F6 | S01, S02, S05, S09, S16 (widget) |
| `mp-mid-backend-api` | F1-F6 | S02, S04, S07, S10, S20 (REST API) |
| `mp-mid-backend-services` | F3-F5 | S07, S08, S11, S13 (services) |
| `mp-mid-pricing-engine` | F1, F2, F4, F7 | S05, S09, S15, S18 (pricing) |
| `mp-mid-pricing-discounts` | F3 | S10 (kupony) |
| `mp-mid-storage-tenant` | F1-F7 | Vsechny s novymi namespaces |
| `mp-mid-design-system` | F1-F7 | Vsechny (UI konzistence) |
| `mp-mid-quality-code` | F1-F7 | Vsechny (review gate) |
| `mp-mid-security-app` | F5, F6 | S12, S20, S21 |

### Specific agenti (uzke ukoly)

| Agent | Faze | Primarni sekce | Co dela |
|-------|------|---------------|---------|
| `mp-spec-fe-forms` | F1 | S02, S10, S12 | Formularove komponenty |
| `mp-spec-fe-upload` | F4 | S03 | Upload 3D souboru |
| `mp-spec-fe-3d-viewer` | F4 | S03, S08 | 3D prohlizec |
| `mp-spec-fe-tables` | F2, F3 | S04, S07, S14, S19 | Tabulkove komponenty |
| `mp-spec-fe-charts` | F6 | S19 | Grafy a vizualizace |
| `mp-spec-fe-kanban` | F3 | S14 | Kanban DnD board |
| `mp-spec-fe-checkout` | F1, F2 | S02, S04, S09 | Checkout flow |
| `mp-spec-fe-notifications` | F3, F5 | S07, S11 | Notifikacni UI |
| `mp-spec-be-slicer` | F1, F4 | S01, S03, S08 | PrusaSlicer CLI |
| `mp-spec-be-upload` | F4 | S03 | Backend upload/konverze |
| `mp-spec-be-email` | F3 | S07 | Email service |
| `mp-spec-be-auth` | F5, F6 | S12, S20 | Autentizace |
| `mp-spec-be-pdf` | F5 | S13 | PDF generovani |
| `mp-spec-be-websocket` | F5 | S11, S14 | WebSocket/polling |
| `mp-spec-pricing-fees` | F2 | S06, S09 | Fee kategorie |
| `mp-spec-pricing-shipping` | F2 | S04 | Dopravni ceny |
| `mp-spec-pricing-coupons` | F3 | S10 | Slevove kody |
| `mp-spec-pricing-tax` | F6 | S21 | DPH/VAT |
| `mp-spec-storage-migration` | F1-F7 | Vsechny | Migrace dat |
| `mp-spec-i18n-translations` | F6 | S16 | Prekladove JSON |
| `mp-spec-3d-viewer` | F4 | S03, S08 | Three.js viewer |
| `mp-spec-3d-analysis` | F4 | S08 | Mesh analyza |
| `mp-spec-ecom-shopify` | F7 | S17 | Shopify app |
| `mp-spec-ecom-woo` | F7 | S17 | WooCommerce plugin |
| `mp-spec-security-auth` | F5, F6 | S12, S20 | Security auth |
| `mp-spec-security-gdpr` | F6 | S21 | GDPR compliance |
| `mp-spec-test-e2e` | F1-F7 | Vsechny | E2E testy |

---

## 8. Spolecna sablona pro vsechny plan soubory

Kazdy soubor `V3-S{NN}-*.md` pouziva tuto strukturu:

```
# V3-S{NN}: {Nazev Sekce}

> **Priorita:** P{X} | **Obtiznost:** {level} | **Faze:** {N}
> **Zavislosti:** {list}

## A. KONTEXT
  A1. Ucel a cil
  A2. Priorita, obtiznost, faze (puvodni vlna)
  A3. Zavislosti na jinych sekcich
  A4. Soucasny stav v codebase
  A5. Referencni zdroje a konkurence

## B. ARCHITEKTURA
  B1. Datovy model / storage schema
  B2. API kontrakty (endpointy)
  B3. Komponentni strom (React)
  B4. Tenant storage namespace
  B5. Widget integrace (postMessage)
  B6. Pricing engine integrace

## C. IMPLEMENTACE
  C1. Agent assignments (kdo co dela)
  C2. Implementacni kroky (poradi)
  C3. Kriticke rozhodovaci body
  C4. Testovaci strategie
  C5. Migrace existujicich dat

## D. KVALITA
  D1. Security review body
  D2. Performance budget
  D3. Accessibility pozadavky
  D4. Error handling a edge cases
  D5. i18n pozadavky

## E. ROLLOUT
  E1. Feature flagy a postupne nasazeni
  E2. Admin UI zmeny
  E3. Widget zmeny
  E4. Dokumentace pro uzivatele
  E5. Metriky uspechu (KPI)
```

---

## 9. Kriticke cesty a rizika (serazene podle faze)

### Vysoka rizika (mohou zastavit dalsi postup)

| Riziko | Faze | Sekce | Popis | Mitigace |
|--------|------|-------|-------|----------|
| **R1** | F7 | S18 | Fundamentalni zmena pricing engine pro multi-tech | Strategy pattern, zpetna kompatibilita, postupny rollout |
| **R2** | F5 | S12 | Autentizace je security-kriticka — spatna impl = breach | Security review PRED implementaci, penetracni testy |
| **R3** | F6 | S20 | API exponuje data externi — rate limiting, auth, validace | OWASP API Security Top 10, sandbox testovani |
| **R4** | F4 | S03 | STEP konverze je vypocetne narocna (OpenCASCADE) | Async processing, queue, timeout limity |

### Stredni rizika (mohou zpomalit postup)

| Riziko | Faze | Sekce | Popis | Mitigace |
|--------|------|-------|-------|----------|
| **R5** | F3 | S07 | Externi zavislost na email provideru, SMTP per tenant | Provider abstrakce, fallback mechanismus |
| **R6** | F3 | S14 | Drag-and-drop lib musi byt kompatibilni s React 19 | @dnd-kit (aktivne udrzovany), ne react-beautiful-dnd |
| **R7** | F6 | S16 | Sjednoceni dvou i18n systemu (i18next + LanguageContext) | Postupna migrace, zachovat zpetnou kompatibilitu |
| **R8** | F5 | S11 | WebSocket infrastruktura pro real-time chat | Zacit s pollingem, upgrade na WS az v produkci |

### Nizka rizika (minimalni dopad)

| Riziko | Faze | Sekce | Popis |
|--------|------|-------|-------|
| **R9** | F1 | S01 | Stavajici API, jen FE zmeny |
| **R10** | F1 | S05 | Rozsireni pricing engine, dobre izolovanej scope |
| **R11** | F7 | S22 | Standalone feature, zadne zavislosti na architekture |

---

## 10. Zmeny oproti puvodnimu rozlozeni (5 vln → 7 fazi)

### Hlavni rozdily

| Sekce | Puvodni vlna | Nova faze | Duvod zmeny |
|-------|-------------|-----------|-------------|
| S14 (Kanban) | Vlna 2 | **Faze 3** | Presun pozdeji — dava smysl az kdyz chodi objednavky |
| S03 (Multi-format) | Vlna 2 | **Faze 4** | STL staci pro prototyp, STEP az pozdeji |
| S06 (Post-processing) | Vlna 2 | **Faze 2** | Zachovano, ale pred S04 (logictejsi poradi fee → doprava) |
| S10 (Kupony) | Vlna 3 | **Faze 3** | Presun drive — marketingovy nastroj ma hodnotu brzy |
| S13 (Dokumenty) | Vlna 3 | **Faze 5** | Presun pozdeji — faktury az kdyz je kompletni flow |
| S22 (Onboarding) | Vlna 3 | **Faze 7** | Presun na konec — tutorialy az kdyz vse existuje |
| S08 (Printability) | Vlna 3 | **Faze 4** | Presun do skupiny s S03 (sdili 3D infrastrukturu) |
| S17 (Pluginy) | Vlna 4 | **Faze 7** | Presun na konec — prototyp nepotrebuje pluginy |

### Filosofie zmeny
- **Puvodni (5 vln):** Rozdeleni podle priority (P0 → P3)
- **Nove (7 fazi):** Rozdeleni podle **logicke navaznosti a business value pro prototyp**
  - Faze 1-3: Funkcni prototyp se spravou objednavek
  - Faze 4-5: Profesionalni produkt se zakaznickyma funkcema
  - Faze 6-7: Platforma a enterprise

---

## 11. Kompletni seznam souboru v Planovane_Implementace/

### Prurezove dokumenty
| Soubor | Radku | Popis |
|--------|-------|-------|
| `V3-S00-index-a-zavislosti.md` | ~870 | **TENTO SOUBOR** — master index |
| `V3-S00b-prurezy-a-strategie.md` | ~500 | Feature flagy, bundle budget, error monitoring, testing, security |
| `V3-S00c-database-migration-supabase.md` | ~600 | localStorage → Supabase migrace, PostgreSQL schema, deploy |

### Implementacni plany (S01-S22)
| Soubor | Faze | Radku | Popis |
|--------|------|-------|-------|
| `V3-S01-bug-fixes-reactive-pricing.md` | F1 | 600 | Bug fixes, reaktivni cenotvorba |
| `V3-S02-contact-form-checkout.md` | F1 | 851 | Kontaktni formular, checkout flow |
| `V3-S03-multi-format-files.md` | F4 | 670 | OBJ, 3MF, STEP podpora |
| `V3-S04-shipping-delivery.md` | F2 | 866 | Doprava, dodaci lhuty |
| `V3-S05-volume-discounts.md` | F1 | 558 | Mnozstevni slevy |
| `V3-S06-post-processing.md` | F2 | 524 | Post-processing sluzby |
| `V3-S07-email-notifications.md` | F3 | 737 | Emailovy system |
| `V3-S08-printability-check.md` | F4 | 756 | Mesh analyza, DFM |
| `V3-S09-express-pricing-upsells.md` | F2 | 631 | Express dodani, upselly |
| `V3-S10-coupons-promotions.md` | F3 | 733 | Kupony, promo akce |
| `V3-S11-chat-comments.md` | F5 | 751 | Chat, komentare |
| `V3-S12-customer-portal.md` | F5 | 952 | Zakaznicky portal, auth |
| `V3-S13-document-generation.md` | F5 | 907 | PDF generovani |
| `V3-S14-kanban-board.md` | F3 | 922 | Kanban board |
| `V3-S15-extended-pricing-methods.md` | F4 | 950 | Rozsirene pricing metody |
| `V3-S16-multi-language-currency.md` | F6 | 1260 | i18n, multimenovost |
| `V3-S17-ecommerce-plugins.md` | F7 | 742 | Shopify, WooCommerce |
| `V3-S18-advanced-features.md` | F7 | 1151 | Vice technologii |
| `V3-S19-crm-marketing-analytics.md` | F6 | 1287 | CRM, marketing |
| `V3-S20-public-api-developer-portal.md` | F6 | 805 | Public API |
| `V3-S21-security-taxes-enterprise.md` | F6 | 982 | Bezpecnost, dane |
| `V3-S22-onboarding-tutorials.md` | F7 | 926 | Onboarding, tutorialy |

**Celkem: ~20,000+ radku implementacnich planu**

---

**KONEC INDEXU — 22 implementacnich planu + 2 prurezove dokumenty v 7 fazich**
