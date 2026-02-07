# V3-S06: Post-processing (nasledne zpracovani)

> **Priorita:** P1 | **Obtiznost:** Nizka | **Vlna:** 2
> **Zavislosti:** S01 (Bug Fixes), fees:v3 namespace (existuje), S04 (Doprava — dodaci lhuty)
> **Odhadovany rozsah:** Stredni (10-14 souboru, 3-4 dny)

---

## A. KONTEXT

### A1. Ucel a cil

Post-processing (nasledne zpracovani) zahrnuje operace provedene na 3D tistene dily po samotnem
tisku: brouseni, lesteni, barveni, lakovani, odstraneni supportu a dalsi povrchove upravy.
Toto je standardni nabidka 3D tiskovych sluzeb, kterou napr. SeekMake nabizi komplexne,
zatimco ModelPricer ji zcela postrada.

**Business value:**
- Zvyseni prumerneho objemu objednavky pridanim sluzeb s vyssi marzi
- Kompletnejsi nabidka sluzeb — zakaznik nemusi hledat post-processing jinde
- Profesionalni dojem — zakaznik vidi celou cestu od tisku k hotovemu vyrobku
- Transparentni vliv na dodaci lhutu — zakaznik vidi kolik dnu navic post-processing pridava

**Co tato sekce resi:**
1. Rozsireni stavajiciho fee systemu o kategorii POST_PROCESSING
2. Nove atributy pro fees: ikona, popis pro zakazniky, cas zpracovani (dny), ukazkovy obrazek
3. Dedikovana UI sekce v kalkulacce pro vyber post-processingu (karty/dlazdice)
4. Dynamicka aktualizace dodaci lhuty pri vyberu post-processingu

### A2. Priorita, obtiznost, vlna

**Priorita P1** — dulezita pro business model (vyssi AOV), ale neni blocker pro zakladni
funkcnost kalkulacky.

**Obtiznost Nizka** — vyuziva existujici fee system (adminFeesStorage.js, pricingEngineV3.js).
Staci pridat kategorii a rozsirit UI. Zadna nova business logika v engine.

**Vlna 2** — zavisi na S04 (Doprava) pro zobrazeni vlivu na dodaci lhutu.
Ciste cenove aspekty lze implementovat drive.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred touto sekci:**
- S01 (Bug Fixes) — zakladni stabilita
- Fees system (existuje — `adminFeesStorage.js` + `pricingEngineV3.js`)

**Silne doporucene (ale ne blocker pro cenu):**
- S04 (Doprava) — pro zobrazeni vlivu na dodaci lhutu

**Tato sekce je zavislost pro:**
- S07 (Emaily) — status ORDER_POSTPROCESS posila email o probihajicim post-processingu
- S14 (Kanban) — Kanban board ma sloupec "Postprocess"

**Paralelni implementace mozna s:**
- S05 (Volume Discounts) — nezavisly subsystem
- S09 (Express Pricing) — nezavisly subsystem

### A4. Soucasny stav v codebase

**Fees storage — `src/utils/adminFeesStorage.js`:**
- Namespace: `modelpricer:${tenantId}:fees:v3`
- Schema version 3
- Kazda fee ma: `id, name, active, type, value, scope, charge_basis, required, selectable, selected_by_default, apply_to_selected_models_enabled, category, description, conditions`
- Pole `category` UZ EXISTUJE (radek 167) — pouziva se jako prazdny string
- Pole `description` UZ EXISTUJE (radek 168) — kratky popis

**Chybejici pole pro post-processing:**
- `icon` — ikona sluzby
- `processing_days` — pocet dni zpracovani
- `image_url` — URL ukazkoveho obrazku
- `customer_description` — delsi popis pro zakazniky (200 znaku)

**Admin Fees UI — `src/pages/admin/AdminFees.jsx`:**
- 2-column layout (List + Editor)
- Podporuje typy: flat, per_gram, per_minute, percent, per_cm3, per_cm2, per_piece
- Podporuje scope: MODEL, ORDER
- Podporuje conditions (podminky aplikace)
- **NEMA** dropdown pro kategorii — category se nezozbrazuje v UI
- **NEMA** ikonu, processing_days, image

**Pricing engine — `src/lib/pricing/pricingEngineV3.js`:**
- Fee system uz je plne implementovany (scope MODEL/ORDER, conditions, targets)
- Engine nepotrebuje zmenu — post-processing fees jsou jen fees s kategorii
- Jedina zmena: propagace `processing_days` do vysledku pro UI

**Orders storage — `src/utils/adminOrdersStorage.js`:**
- `ORDER_STATUSES` obsahuje `'POSTPROCESS'` (radek 23) — uz existuje
- Objednavky uz maji stav POSTPROCESS v pipeline

**Kalkulacka — `src/pages/test-kalkulacka/components/PricingCalculator.jsx`:**
- Zobrazuje fees jako radky v rozpisu
- Nema dedikovanou sekci pro post-processing

### A5. Referencni zdroje a konkurence

**OSS knihovny:** Zadne externi knihovny potreba — cista UI + data konfigurace.

**Konkurencni reseni:**
- **SeekMake:** Komplexni post-processing menu s fotografiemi vysledku, cenami a casem
- **Xometry:** Finishing options (bead blasting, anodizing, painting) jako checkboxy s cenami
- **Craftcloud:** Surface finishing selection s vizualnimi kartami

**Doporuceni z implementacniho planu:**
- Reseni A (Rozsireni stavajicich Fees) — DOPORUCENO
- Pridat ke stavajicimu fee systemu novy typ/kategorii "POST_PROCESSING"
- Post-processing fees se v kalkulacce zobrazuji v dedikovane sekci
- Setri cas implementace a vyuziva existujici logiku cenotvorby

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Rozsireni fee objektu v fees:v3:**

```json
{
  "schema_version": 3,
  "fees": [
    {
      "id": "fee_pp_001",
      "name": "Brouseni",
      "active": true,
      "type": "flat",
      "value": 150,
      "scope": "MODEL",
      "charge_basis": "PER_PIECE",
      "required": false,
      "selectable": true,
      "selected_by_default": false,
      "apply_to_selected_models_enabled": false,
      "category": "POST_PROCESSING",
      "description": "Rucni brouseni povrchu pro hladky finalni vysledek",
      "conditions": [],

      "icon": "sand-paper",
      "customer_description": "Rucni brouseni povrchu pro hladky finalni vysledek. Odstranicme viditelne vrstvy tisku.",
      "processing_days": 2,
      "image_url": null
    },
    {
      "id": "fee_pp_002",
      "name": "Lesteni",
      "active": true,
      "type": "flat",
      "value": 200,
      "scope": "MODEL",
      "charge_basis": "PER_PIECE",
      "required": false,
      "selectable": true,
      "selected_by_default": false,
      "apply_to_selected_models_enabled": false,
      "category": "POST_PROCESSING",
      "description": "Lesteni ABS/PETG dilu chemickym nebo mechanickym procesem",
      "conditions": [],
      "icon": "sparkles",
      "customer_description": "Lesteni pro zrcadlovy efekt. Chemicke lesteni pro ABS, mechanicke pro ostatni.",
      "processing_days": 3,
      "image_url": null
    }
  ],
  "updated_at": "2026-02-06T12:00:00Z"
}
```

**Nova pole ve fee objektu:**

| Pole | Typ | Default | Popis |
|------|-----|---------|-------|
| `icon` | string | `""` | Nazev ikony z AppIcon sady (lucide-react) |
| `customer_description` | string | `""` | Delsi popis pro zakazniky, max 200 znaku |
| `processing_days` | number | `0` | Pocet dni navic k dodaci lhute |
| `image_url` | string\|null | `null` | URL ukazkoveho obrazku (volitelny) |

**Kategorie fee:**

| Hodnota | Popis | Kde se zobrazuje |
|---------|-------|-----------------|
| `""` (prazdny) | Bezna fee/priplatek | Sekce "Dodatecne sluzby" |
| `"POST_PROCESSING"` | Post-processing sluzba | Dedikovana sekce "Povrchova uprava" |
| `"EXPRESS"` (budouci S09) | Expresni priplatek | Sekce "Rychlost zpracovani" |

**Migrace:** Nova pole jsou optional — chybejici pole se normalizuji na default hodnoty.
Stavajici fees se kategorie `""` (bezne fees) — zadna zmena chovani.

### B2. API kontrakty (endpointy)

V soucasne fazi je fee system ciste na frontendu (localStorage). Pro budouci backend:

```
GET    /api/v1/tenant/:tenantId/fees
Response: { fees: [...], updated_at: "..." }
// fees nyni obsahuji post-processing pole (icon, customer_description, processing_days, image_url)

GET    /api/v1/tenant/:tenantId/fees?category=POST_PROCESSING
Response: { fees: [...filtrované] }

POST   /api/v1/tenant/:tenantId/fees/:feeId/image
Body:  multipart/form-data { image: File }
Response: { url: "https://..." }
```

### B3. Komponentni strom (React)

```
AdminFees.jsx
├── FeeListPanel (existujici — pridat filter dle kategorie)
│   ├── CategoryFilter (NOVY — "Vsechny" | "Priplatky" | "Post-processing")
│   └── FeeListItem (existujici)
│       └── CategoryBadge (NOVY — vizualni badge s kategorii)
├── FeeEditorPanel (existujici — rozsirit)
│   ├── BasicFields (existujici: name, type, value, scope, ...)
│   ├── CategorySelector (NOVY)
│   │   └── Dropdown: "" | "POST_PROCESSING" | "EXPRESS"
│   ├── PostProcessingFields (NOVY — podminkove zobrazeni)
│   │   ├── IconSelector (vyber z preddefinovanych ikon)
│   │   ├── CustomerDescriptionTextarea (max 200 znaku)
│   │   ├── ProcessingDaysInput (number)
│   │   └── ImageUpload (volitelny — URL nebo upload)
│   └── ConditionsEditor (existujici)

PrintConfiguration.jsx (kalkulacka)
├── ... existujici sekce
└── PostProcessingSection (NOVY)
    ├── SectionHeader ("Povrchova uprava")
    └── PostProcessingCardGrid
        └── PostProcessingCard (pro kazdou PP sluzbu)
            ├── IconDisplay
            ├── ServiceName
            ├── ShortDescription
            ├── PriceDisplay
            ├── ProcessingDaysInfo ("+2 dny")
            └── SelectToggle (checkbox/switch)

PricingCalculator.jsx (cenovy souhrn)
├── ... existujici radky
├── PostProcessingSubtotal (NOVY radek)
│   └── DetailExpander (seznam vybranych sluzeb)
└── DeliveryTimeEstimate (NOVY)
    └── Text: "Odhadovane doruceni: X dni (+Y dni post-processing)"
```

### B4. Tenant storage namespace

- **Namespace:** `fees:v3` (EXISTUJICI)
- **Helper:** `adminFeesStorage.js` — `loadFeesConfigV3()` / `saveFeesConfigV3()`
- Post-processing fees jsou SOUCASTI stavajiciho pole `fees[]`
- Rozliseni pres pole `category: "POST_PROCESSING"`
- **Zadny novy namespace** — rozsireni stavajiciho

### B5. Widget integrace (postMessage)

Widget dostava fees config pres postMessage. Rozsireni:

```javascript
// Widget init message — BEZ ZMENY formatu
{
  type: 'MODELPRICER_CONFIG',
  payload: {
    feesConfig: {
      fees: [
        // existujici fees
        { id: 'fee_1', name: 'Manipulacni poplatek', category: '', ... },
        // post-processing fees
        { id: 'fee_pp_1', name: 'Brouseni', category: 'POST_PROCESSING',
          icon: 'sand-paper', customer_description: '...', processing_days: 2, ... }
      ]
    }
  }
}
```

Widget na strane klienta filtruje:
```javascript
const regularFees = fees.filter(f => f.category !== 'POST_PROCESSING');
const postProcessingFees = fees.filter(f => f.category === 'POST_PROCESSING');
```

### B6. Pricing engine integrace

**Pricing engine NEPOTREBUJE ZMENU** pro zakladni cenovou logiku.
Post-processing fees jsou fees jako kazde jine — engine je uz zpracovava.

**Jedina zmena:** Propagace `processing_days` do vysledku quote pro UI:

```javascript
// V calculateOrderQuote() — pridani do vysledku
const totalProcessingDays = fees
  .filter(f => f.category === 'POST_PROCESSING' && f.applied)
  .reduce((sum, f) => sum + safeNum(f.processing_days, 0), 0);

return {
  ...existujiciVysledek,
  post_processing: {
    services: appliedPostProcessingFees,
    total_processing_days: totalProcessingDays,
    total_cost: appliedPostProcessingFees.reduce((s, f) => s + f.amount, 0)
  }
};
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-mid-pricing-discounts` | Rozsireni normalizeFee() o nova pole | `src/utils/adminFeesStorage.js` | P0 |
| `mp-mid-frontend-admin` | Category filter + PostProcessingFields v AdminFees | `src/pages/admin/AdminFees.jsx` | P0 |
| `mp-spec-fe-forms` | IconSelector, ImageUpload, CustomerDescription | nove komponenty | P1 |
| `mp-mid-frontend-public` | PostProcessingSection v kalkulacce | `src/pages/test-kalkulacka/components/PrintConfiguration.jsx` | P0 |
| `mp-spec-fe-layout` | PostProcessingCard design (karty/dlazdice) | nove komponenty | P1 |
| `mp-mid-pricing-engine` | Propagace processing_days do vysledku | `src/lib/pricing/pricingEngineV3.js` | P1 |
| `mp-mid-frontend-widget` | Widget filtrovani a zobrazeni PP fees | `src/pages/widget/WidgetEmbed.jsx` | P2 |
| `mp-sr-design` | Design PostProcessingCard (vizualni navrh) | - | P1 |
| `mp-spec-test-build` | Testy normalizace + build test | testy | P0 |
| `mp-sr-i18n` | Prekladove klice CZ/EN | `src/locales/` | P1 |

### C2. Implementacni kroky (poradi)

**Krok 1: Storage rozsireni (zaklad)**
- Pridat nova pole do `normalizeFee()` v `adminFeesStorage.js`:
  - `icon: String(f.icon || '').trim() || ''`
  - `customer_description: String(f.customer_description || '').trim().slice(0, 200) || ''`
  - `processing_days: Math.max(0, safeNum(f.processing_days, 0))`
  - `image_url: typeof f.image_url === 'string' ? f.image_url.trim() : null`
- Zajistit zpetnou kompatibilitu — chybejici pole maji default hodnoty

**Krok 2: Admin Fees UI — Category (paralelni s krokem 3)**
- Pridat `CategorySelector` dropdown do fee editoru
- Moznosti: `""` = Priplatek, `"POST_PROCESSING"` = Post-processing
- Pridat `CategoryFilter` do fee seznamu
- Pridat vizualni badge s kategorii u kazde fee v seznamu

**Krok 3: Admin Fees UI — Post-processing pole (paralelni s krokem 2)**
- Podminkove zobrazeni novych poli kdyz category = POST_PROCESSING:
  - `IconSelector` — vyber z preddefinovane sady ikon (lucide-react)
  - `CustomerDescriptionTextarea` — max 200 znaku, pocitadlo znaku
  - `ProcessingDaysInput` — number input, min 0
  - `ImageUpload` — URL vstup (budouci: file upload)

**Krok 4: Kalkulacka — PostProcessingSection**
- Nova sekce v `PrintConfiguration.jsx` pod stavajicimi moznostmi
- Filtrovat fees dle `category === 'POST_PROCESSING'`
- Zobrazit jako karty/dlazdice s: ikona, nazev, popis, cena, cas, toggle
- Propagovat vyber do `feeSelections`

**Krok 5: Cenovy souhrn — processing_days**
- Aktualizovat `PricingCalculator.jsx` — zobrazit vliv na dodaci lhutu
- Text: "Vybrana povrchova uprava prodlouzi dodani o X dni."
- Radek v rozpisu pro post-processing subtotal

**Krok 6: Widget integrace**
- Widget filtruje fees dle kategorie a zobrazuje PP sekci

**Krok 7: Testy a build**
- Unit testy normalizace novych poli
- Build test
- Smoke test: pridani PP fee v adminu → zobrazeni v kalkulacce

**Paralelizovatelnost:** Kroky 2+3 paralelne. Krok 4 az po 1. Kroky 4+5 paralelne.

### C3. Kriticke rozhodovaci body

1. **Reseni A (rozsireni Fees) vs Reseni B (nova entita)?**
   - Rozhodnuti: **Reseni A** — rozsireni stavajicich fees
   - Duvod: Mensi naklady, vyuziti existujici logiky (conditions, scope, targets)
   - Riziko: Fee editor se stava slozitejsim (vice podminkových poli)

2. **Jak resit ikony?**
   - Rozhodnuti: Vyber z preddefinovane sady (lucide-react ikony pouzivane v projektu)
   - Alternativa: Upload vlastnich ikon — slozitejsi, zatim neni treba

3. **Kam umistit PP sekci v kalkulacce?**
   - Rozhodnuti: Pod sekci "Dodatecne sluzby" nebo MISTO ni
   - "Dodatecne sluzby" presmenovat na "Priplatky" a PP mit jako separatni sekci

4. **Jak pocitat celkovou dodaci lhutu?**
   - Rozhodnuti: Secist processing_days vsech vybranych PP sluzeb
   - Post-processing probiha SEKVENCNE (brouseni → lesteni → barveni)
   - Alternativa: Paralelni (max processing_days) — admin by musel nastavit

### C4. Testovaci strategie

**Unit testy:**
- `normalizeFee()` — nova pole (icon, customer_description, processing_days, image_url)
- Zpetna kompatibilita — fee bez novych poli se normalizuje spravne
- Filtrovani dle kategorie

**Edge cases:**
- customer_description delsi nez 200 znaku — oriznout
- processing_days zaporne cislo — clamp na 0
- image_url nevalidni URL — ponechat jako string (validace v UI)
- Category neznama hodnota — normalizovat na prazdny string

**E2E testy:**
- Admin vytvori PP fee → zobrazi se v kalkulacce v PP sekci
- Zakaznik vybere PP sluzbu → cena se aktualizuje → dodaci lhuta se aktualizuje
- Zruseni PP sluzby → cena a lhuta zpet

### C5. Migrace existujicich dat

**Zpetna kompatibilita:** Nova pole jsou optional. Existujici fees se normalizuji s defaulty:
- `icon: ""`
- `customer_description: ""`
- `processing_days: 0`
- `image_url: null`

Existujici fees maji `category: ""` — budou se zobrazovat v sekci "Priplatky" (bez zmeny).

**Zadna destruktivni migrace.**

---

## D. KVALITA

### D1. Security review body

- **Input validace:**
  - `customer_description`: max 200 znaku, strip HTML tags
  - `image_url`: validace URL formatu, whitelist domen (nebo jen localhost/CDN)
  - `processing_days`: integer >= 0, max 30
  - `icon`: whitelist nazvu ikon (prevence injection pres icon name)
- **XSS prevence:** `customer_description` se renderuje pres React (auto-escaping)
- **Image upload (budouci):** Validace MIME type, max velikost 2MB, resize
- **Tenant isolation:** Data v `modelpricer:${tenantId}:fees:v3`

### D2. Performance budget

- **Render time:** PostProcessingCard grid (max 10 sluzeb): < 16ms
- **Bundle size:** Zadna nova zavislost — +~3KB minified (komponenty)
- **Image loading:** Lazy loading pro ukazkove obrazky (intersection observer)
- **Memory:** Zanedbalny prirustek

### D3. Accessibility pozadavky

- **PostProcessingCard:** Musi byt focusable (tabIndex) a musi mit role="checkbox"
- **Toggle/switch:** ARIA label "Vybrat sluzbu: Brouseni"
- **Icon:** aria-hidden="true" (dekorativni)
- **Popis sluzby:** Accessible pres screen reader jako soucAST karty
- **Keyboard:** Enter/Space pro toggle, Tab pro navigaci mezi kartami
- **Color contrast:** Cena a popis s dostatecnym kontrastem

### D4. Error handling a edge cases

| Chybovy stav | Reseni | Fallback |
|-------------|--------|----------|
| Zadne PP fees definovane | Sekce "Povrchova uprava" se nezobrazuje | Zadna UI zmena |
| Vsechny PP fees neaktivni | Sekce se nezobrazuje | Zadna UI zmena |
| processing_days = 0 | Nezobrazovat "+0 dni" | Skryt cas info |
| image_url = null/prazdny | Zobrazit placeholder ikonu | Fallback na icon |
| customer_description prazdny | Pouzit kratky `description` | Fallback na name |
| Fee bez icon | Zobrazit defaultni ikonu (wrench/settings) | Fallback ikona |

### D5. i18n pozadavky

**Nove CZ/EN klice:**
```json
{
  "admin.fees.category": "Kategorie / Category",
  "admin.fees.category.default": "Priplatek / Surcharge",
  "admin.fees.category.post_processing": "Post-processing / Post-processing",
  "admin.fees.customer_description": "Popis pro zakazniky / Customer description",
  "admin.fees.customer_description.hint": "Max 200 znaku / Max 200 characters",
  "admin.fees.processing_days": "Cas zpracovani (dny) / Processing time (days)",
  "admin.fees.icon": "Ikona / Icon",
  "admin.fees.image": "Ukazkovy obrazek / Sample image",
  "calculator.post_processing.title": "Povrchova uprava / Surface finishing",
  "calculator.post_processing.days_added": "+{{days}} dni / +{{days}} days",
  "calculator.post_processing.delivery_note": "Vybrana povrchova uprava prodlouzi dodani o {{days}} dni. / Selected finishing extends delivery by {{days}} days.",
  "calculator.post_processing.none": "Zadna povrchova uprava / No surface finishing"
}
```

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

- **Zadny separatni feature flag** — funkce je pristupna pres kategorii fee
- Admin vytvori fee s category=POST_PROCESSING → automaticky se zobrazi v PP sekci kalkulacky
- Pokud admin nevytvori zadnou PP fee → sekce se nezobrazuje (graceful degradation)
- **Rollout:**
  1. Merge kodu
  2. Admin vytvori demo PP fees pro interni testovani
  3. Dokumentace
  4. Produkce

### E2. Admin UI zmeny

- **AdminFees.jsx** — nova pole v editoru, category filter v seznamu
- **Preddefinovane sablony:** Pri vytvoreni nove PP fee nabidnout sablony:
  - Brouseni (+150 Kc, +2 dny)
  - Lesteni (+200 Kc, +3 dny)
  - Barveni (+300 Kc, +3 dny)
  - Lakovani (+250 Kc, +2 dny)
  - Odstraneni supportu (+50 Kc, +1 den)

### E3. Widget zmeny

- Widget filtruje fees dle kategorie
- PP fees zobrazeny v dedikovane sekci
- Karty s ikonou, nazvem, popisem, cenou a casem
- Toggle pro vyber

### E4. Dokumentace pro uzivatele

- Admin guide: "Jak pridat post-processing sluzby"
- Vysvetleni rozdilu mezi beznym priplatkem a PP sluzbou
- Tipy pro nastaveni cen a casu

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| PP fee adoption (tenanty) | >40% tenantu ma >=1 PP fee | Storage analytics |
| PP vyber zakazniky | >20% objednavek ma PP sluzbu | Order data |
| Prumerny PP priplatek | >150 Kc | Order analytics |
| UX satisfaction | <3 kliky pro vyber PP | UX testing |
| Bug reports | 0 P0 | Issue tracker |
