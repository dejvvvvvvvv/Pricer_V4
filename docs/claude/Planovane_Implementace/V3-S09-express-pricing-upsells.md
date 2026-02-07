# V3-S09: Expresni cenotvorba a upselly

> **Priorita:** P1 | **Obtiznost:** Medium | **Vlna:** 2
> **Zavislosti:** S01 (Bug Fixes), S05 (Mnozstevni slevy), S06 (Post-processing)
> **Odhadovany rozsah:** ~25-35 souboru (novy storage helper, admin stranka, widget komponenty, pricing engine rozsireni)

---

## A. KONTEXT

### A1. Ucel a cil

Expresni cenotvorba a upsell system resi dva zakladni business cile:

1. **Expresni dodani** — umoznit zakaznikum zvolit rychlejsi zpracovani objednavky za priplatek. Typicke urovne jsou Standard (bez priplatku, 5-7 dni), Express (+25%, 2-3 dny) a Rush (+50%, 24 hodin). Admin si muze definovat vlastni urovne, menit prirpatek (procenta, fixa, kombinace), dobu zpracovani a ikonu.

2. **Upsell system pri checkout** — kontextualni doporuceni behem checkout procesu, ktera zvysuji hodnotu objednavky. Napr. nabidka post-processingu zakaznikovi, ktery si ho nezvolil, nebo upgrade materialu.

**Business value:**
- Zvyseni prumerne hodnoty objednavky (AOV) o 15-30% diky upsellum
- Monetizace urgentnosti — expresni pripliatky jsou vysoko-margove
- Transparentni komunikace terminovych moznosti posiluje duveru zakazniku
- Flexibilita pro 3D-tiskove firmy — kazdy tenant si nastavi vlastni urovne

### A2. Priorita, obtiznost, vlna

**Priorita P1** — expresni dodani je standardni ocekavani zakazniku v e-commerce. Bez nej je ModelPricer nekompletni pro produkni pouziti. Upselly zvysuji revenue bez extra nakladu na akvizici.

**Obtiznost Medium** — vetsi cast je konfiguracni logika (CRUD expresnich urovni) a UI. Slozitejsi je integrace do pricing engine pipeline, kde se musi expresni priplatek spravne zaradit do kalkulace (po zakladni cene, pred dopravou). Upsell logika vyzaduje kontextualni hodnoceni (jake upselly zobrazit na zaklade stavu objednavky).

**Vlna 2** — zavisi na hotovem pricing engine (S01, S05) a post-processing konfiguraci (S06), protoze upsell system navrhuje post-processing doplnky. Express pricing se primo napojuje na pricing engine pipeline.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred S09:**
- **S01 (Bug Fixes & Reaktivita)** — pricing engine V3 musi byt stabilni, reaktivni prepocet ceny
- **S05 (Mnozstevni slevy)** — zakladni discount pipeline v pricing engine
- **S06 (Post-processing)** — konfigurace post-processingu (upselly navrhuj post-processing polozky)

**Sekce ktere zavisi na S09:**
- **S10 (Kupony)** — kuponovy system musi pocitat s express priplatky v zakladni cene
- **S13 (Generovani dokumentu)** — faktura musi zobrazovat expresni priplatek jako samostatnou polozku
- **S14 (Kanban)** — expresni objednavky maji vizualni tag (cerveny) na kanban karte

### A4. Soucasny stav v codebase

**Co uz existuje:**
- Pricing engine V3: `src/lib/pricing/pricingEngineV3.js` — pipeline base -> fees -> markup -> minima -> rounding. Expresni priplatek se musi zaradit jako novy krok.
- Admin Pricing storage: `src/utils/adminPricingStorage.js` — namespace `pricing:v3`, load/save s normalizaci
- Admin Fees storage: `src/utils/adminFeesStorage.js` — namespace `fees:v3`, pouziva se jako vzor
- Tenant storage entrypoint: `src/utils/adminTenantStorage.js` — `getTenantId()`, `readTenantJson()`, `writeTenantJson()`
- Orders storage: `src/utils/adminOrdersStorage.js` — namespace `orders:v1`, seed orders
- Routes: `src/Routes.jsx` — admin routes pod `/admin`
- Admin layout: `src/pages/admin/AdminLayout.jsx` — sidebar navigace
- UI komponenty: `src/components/ui/` — Button, Card, Input, Select, Slider, Checkbox, label, tooltip

**Co chybi:**
- Zadny `adminExpressStorage.js` — neni express namespace
- Zadna admin stranka pro spravu expresnich urovni
- Zadna integrace v pricing engine pro express priplatky
- Zadne UI v kalkulacce pro vyber rychlosti zpracovani
- Zadny upsell system (ani admin konfigurace, ani widget zobrazeni)
- Orders nemaji snapshot expresni urovne

### A5. Referencni zdroje a konkurence

**OSS knihovny (z doporuceni):**
- **json-rules-engine** (2.5k+ stars) — pravidlovy engine pro pricing rules, muze se pouzit pro upsell podminky
- Jinak vlastni implementace — express pricing je dostatecne specificke

**Konkurencni reseni:**
- **Shapeways** — nabizi Standard, Express, Rush s % priplatkym
- **Xometry** — dynamicke expresni ceny na zaklade kapacity
- **Hubs/Protolabs** — fixni prirplatek + dynamicke terminy
- **Treatstock** — bez express moznosti (konkurencni vyhoda pro ModelPricer)

**Best practices:**
- Express urovne vzdy zobrazovat jako karty vedle sebe (ne dropdown) — zvysuje konverzi
- Zobrazovat absolutni castku priplatku (ne jen %) — zakaznik chce videt presnou cenu
- Zobrazovat odhadovany termin doruceni — nejdulezitejsi informace pro rozhodnuti
- Upselly nesmejj byt vtiravi — max 2-3 relevatni nabidky

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `express:v1`
**Klic:** `modelpricer:${tenantId}:express:v1`

```json
{
  "schema_version": 1,
  "tiers": [
    {
      "id": "tier_standard",
      "name": "Standard",
      "description": "Bezna doba zpracovani",
      "surcharge_type": "none",
      "surcharge_percent": 0,
      "surcharge_fixed": 0,
      "surcharge_min": null,
      "surcharge_max": null,
      "processing_days_min": 5,
      "processing_days_max": 7,
      "icon": "package",
      "sort_order": 0,
      "is_default": true,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "tier_express",
      "name": "Express",
      "description": "Rychlejsi zpracovani vasi objednavky",
      "surcharge_type": "percent",
      "surcharge_percent": 25,
      "surcharge_fixed": 0,
      "surcharge_min": 50,
      "surcharge_max": 2000,
      "processing_days_min": 2,
      "processing_days_max": 3,
      "icon": "zap",
      "sort_order": 1,
      "is_default": false,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "tier_rush",
      "name": "Rush",
      "description": "Prioritni zpracovani do 24 hodin",
      "surcharge_type": "percent",
      "surcharge_percent": 50,
      "surcharge_fixed": 0,
      "surcharge_min": 100,
      "surcharge_max": 5000,
      "processing_days_min": 0,
      "processing_days_max": 1,
      "icon": "rocket",
      "sort_order": 2,
      "is_default": false,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "upsells": {
    "enabled": true,
    "max_displayed": 3,
    "rules": [
      {
        "id": "upsell_postprocess",
        "type": "post_processing",
        "trigger": "no_postprocess_selected",
        "title": "Vylepsete svuj vytisk",
        "description": "Pridejte povrchovou upravu pro profesionalni vysledek",
        "priority": 1,
        "is_active": true
      },
      {
        "id": "upsell_express",
        "type": "express_upgrade",
        "trigger": "standard_selected",
        "title": "Potrebujete to driv?",
        "description": "Upgradujte na Express doruceni",
        "priority": 2,
        "is_active": true
      },
      {
        "id": "upsell_material",
        "type": "material_upgrade",
        "trigger": "basic_material_selected",
        "title": "Odolnejsi material",
        "description": "PETG nabizi lepsi mechanicke vlastnosti nez PLA",
        "priority": 3,
        "is_active": true
      }
    ]
  },
  "settings": {
    "show_estimated_delivery": true,
    "exclude_weekends": true,
    "exclude_holidays": false,
    "business_hours_start": "08:00",
    "business_hours_end": "16:00",
    "cutoff_time": "14:00"
  },
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Express tier surcharge_type varianty:**
- `"none"` — bez priplatku (Standard)
- `"percent"` — % z ceny objednavky pred dopravou
- `"fixed"` — fixni castka
- `"combined"` — procenta s min/max (napr. 25% ale min 50 Kc, max 2000 Kc)

### B2. API kontrakty (endpointy)

Pro Variantu A (localStorage demo) se nepouzivaji REST endpointy. Vsechno se resi pres storage helpery. Pro budouci backend:

```
GET    /api/admin/express/tiers         -> seznam vsech urovni
POST   /api/admin/express/tiers         -> vytvoreni nove urovne
PUT    /api/admin/express/tiers/:id     -> uprava urovne
DELETE /api/admin/express/tiers/:id     -> smazani urovne
PATCH  /api/admin/express/tiers/reorder -> zmena poradi

GET    /api/admin/express/upsells       -> seznam upsell pravidel
POST   /api/admin/express/upsells       -> vytvoreni pravidla
PUT    /api/admin/express/upsells/:id   -> uprava pravidla
DELETE /api/admin/express/upsells/:id   -> smazani pravidla

GET    /api/admin/express/settings      -> nastaveni (business hours, cutoff)
PUT    /api/admin/express/settings      -> ulozeni nastaveni

# Public (widget) endpoint
GET    /api/public/express/tiers?tenantId=X -> aktivni urovne pro zakaznika
POST   /api/public/express/calculate    -> vypocet priplatku
```

**Request format — calculate:**
```json
{
  "tier_id": "tier_express",
  "order_subtotal": 650,
  "tenant_id": "demo-tenant"
}
```

**Response format — calculate:**
```json
{
  "tier_id": "tier_express",
  "surcharge_amount": 162.50,
  "delivery_estimate": {
    "min_date": "2025-01-22",
    "max_date": "2025-01-24",
    "business_days_min": 2,
    "business_days_max": 3
  }
}
```

### B3. Komponentni strom (React)

```
Admin:
src/pages/admin/
  AdminExpress.jsx                    -- hlavni admin stranka
  components/express/
    ExpressTierList.jsx               -- tabulka/grid urovni
    ExpressTierEditor.jsx             -- formular pro vytvoreni/editaci urovne
    ExpressTierCard.jsx               -- karta jedne urovne (preview)
    UpsellRuleList.jsx                -- seznam upsell pravidel
    UpsellRuleEditor.jsx              -- formular pro upsell pravidlo
    ExpressSettingsForm.jsx           -- nastaveni (business hours, cutoff)
    ExpressPreview.jsx                -- live nahled jak to vidi zakaznik

Widget/Kalkulacka:
src/pages/test-kalkulacka/components/
  ExpressTierSelector.jsx             -- karty pro vyber urovne (Standard/Express/Rush)
  ExpressSurchargeRow.jsx             -- radek v rozpisu ceny "Expresni priplatek: +X Kc"
  DeliveryEstimate.jsx                -- "Odhadovane doruceni: 22.-24. ledna 2025"
  UpsellPanel.jsx                     -- panel s upsell nabidkami pri checkout
  UpsellCard.jsx                      -- jedna upsell nabidka

Widget (embedovatelny):
src/pages/widget-kalkulacka/components/
  (kopie Express* komponent pro widget context)
```

### B4. Tenant storage namespace

- **Namespace:** `express:v1`
- **Helper:** `src/utils/adminExpressStorage.js` (novy soubor)
- **Pattern:** stejna konvence jako `adminFeesStorage.js`
  - `loadExpressConfig()` — nacte z `readTenantJson('express:v1', defaultConfig)`
  - `saveExpressConfig(config)` — normalizuje a ulozi pres `writeTenantJson('express:v1', normalized)`
  - `getDefaultExpressConfig()` — vychozi 3 urovne (Standard, Express, Rush)
  - `normalizeExpressConfig(input)` — normalizace vstupnich dat
  - `normalizeExpressTier(tier)` — normalizace jedne urovne

### B5. Widget integrace (postMessage)

Express tier vyber se propaguje do widgetu pomoci postMessage:

```javascript
// Widget -> Parent (pri zmene tier)
window.parent.postMessage({
  type: 'MODELPRICER_EXPRESS_TIER_CHANGED',
  payload: {
    tier_id: 'tier_express',
    surcharge_amount: 162.50,
    delivery_estimate: { min_date: '2025-01-22', max_date: '2025-01-24' }
  }
}, '*');

// Parent -> Widget (konfigurace)
widget.contentWindow.postMessage({
  type: 'MODELPRICER_SET_EXPRESS_TIERS',
  payload: {
    tiers: [...],
    settings: {...}
  }
}, widgetOrigin);
```

**Upsell akce v widgetu:**
```javascript
// Widget -> Parent (upsell prijat)
window.parent.postMessage({
  type: 'MODELPRICER_UPSELL_ACCEPTED',
  payload: {
    upsell_id: 'upsell_postprocess',
    item_id: 'barveni',
    price_delta: 300
  }
}, '*');
```

### B6. Pricing engine integrace

Express priplatek se musi zaradit do pricing engine pipeline. Soucasny pipeline:

```
base -> fees -> markup -> minima -> rounding
```

Novy pipeline s express:

```
base -> fees -> EXPRESS -> markup -> minima -> rounding
```

**Integrace do `calculateOrderQuote()`:**

Do vstupnich parametru pridat:
```javascript
calculateOrderQuote({
  uploadedFiles,
  printConfigs,
  pricingConfig,
  feesConfig,
  feeSelections,
  expressTierId,     // NOVE — ID zvolene urovne
  expressConfig,     // NOVE — konfigurace express urovni
})
```

Do vysledku pridat:
```javascript
return {
  // ... existujici
  express: {
    tier_id: 'tier_express',
    tier_name: 'Express',
    surcharge_type: 'percent',
    surcharge_amount: 162.50,
    delivery_estimate: { min_date: '...', max_date: '...' },
  },
  totals: {
    // ... existujici
    expressSurcharge: 162.50,
    subtotalAfterExpress: subtotalBeforeMarkup + 162.50,
  },
};
```

**Vypocet priplatku (funkce `calcExpressSurcharge`):**
```javascript
function calcExpressSurcharge(tier, subtotalBeforeExpress) {
  if (!tier || tier.surcharge_type === 'none') return 0;

  let surcharge = 0;
  if (tier.surcharge_type === 'percent' || tier.surcharge_type === 'combined') {
    surcharge = (subtotalBeforeExpress * tier.surcharge_percent) / 100;
  }
  if (tier.surcharge_type === 'fixed') {
    surcharge = tier.surcharge_fixed;
  }

  // Min/max clamp (pro combined a percent)
  if (tier.surcharge_min != null && surcharge < tier.surcharge_min) {
    surcharge = tier.surcharge_min;
  }
  if (tier.surcharge_max != null && surcharge > tier.surcharge_max) {
    surcharge = tier.surcharge_max;
  }

  return Math.max(0, surcharge);
}
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-mid-storage-tenant` | Vytvoreni `adminExpressStorage.js` | `src/utils/adminExpressStorage.js` | P0 |
| `mp-mid-pricing-engine` | Integrace express priplatku do pipeline | `src/lib/pricing/pricingEngineV3.js` | P0 |
| `mp-mid-frontend-admin` | Admin stranka Express (layout, routing) | `src/pages/admin/AdminExpress.jsx`, `src/Routes.jsx` | P0 |
| `mp-spec-fe-forms` | Formulare pro tiers a upsells | `src/pages/admin/components/express/ExpressTierEditor.jsx`, `UpsellRuleEditor.jsx` | P1 |
| `mp-spec-fe-tables` | Seznam tiers a upsell pravidel | `src/pages/admin/components/express/ExpressTierList.jsx`, `UpsellRuleList.jsx` | P1 |
| `mp-mid-frontend-widget` | ExpressTierSelector v kalkulacce | `src/pages/test-kalkulacka/components/ExpressTierSelector.jsx` | P1 |
| `mp-spec-fe-checkout` | UpsellPanel a DeliveryEstimate | `src/pages/test-kalkulacka/components/UpsellPanel.jsx`, `DeliveryEstimate.jsx` | P1 |
| `mp-spec-fe-routing` | Pridani `/admin/express` route | `src/Routes.jsx` | P0 |
| `mp-spec-fe-state` | Express tier state v kalkulacce | stav v test-kalkulacka/index.jsx | P1 |
| `mp-mid-quality-code` | Code review vsech zmen | * | P0 (gate) |
| `mp-spec-test-unit` | Unit testy express storage + pricing | `src/__tests__/` | P1 |

### C2. Implementacni kroky (poradi)

```
FAZE 1 — Storage + Pricing Engine (paralelne)
  1.1 [mp-mid-storage-tenant] Vytvorit adminExpressStorage.js
      - Implementovat getDefaultExpressConfig, normalizeExpressConfig
      - Implementovat loadExpressConfig, saveExpressConfig
      - Seed data: 3 default urovne
      Zavislost: zadna

  1.2 [mp-mid-pricing-engine] Rozsirit calculateOrderQuote
      - Pridat expressTierId + expressConfig parametry
      - Implementovat calcExpressSurcharge
      - Zaradit do pipeline mezi fees a markup
      - Pridat express info do vysledku
      Zavislost: 1.1 (potrebuje schema)

FAZE 2 — Admin UI (paralelne po Fazi 1)
  2.1 [mp-spec-fe-routing] Pridat /admin/express route do Routes.jsx
      - Import AdminExpress
      - Route path="express"
      Zavislost: zadna

  2.2 [mp-mid-frontend-admin] AdminExpress.jsx hlavni stranka
      - Tab navigace: Urovne | Upselly | Nastaveni
      - Napojeni na adminExpressStorage
      Zavislost: 1.1, 2.1

  2.3 [mp-spec-fe-forms] ExpressTierEditor.jsx
      - Formular: nazev, popis, typ priplatku, hodnoty, doba zpracovani, ikona
      - Validace: surcharge_percent 0-200, processing_days >= 0
      Zavislost: 2.2

  2.4 [mp-spec-fe-tables] ExpressTierList.jsx
      - Tabulka/grid s drag-and-drop razenim
      - Akce: Upravit, Duplikovat, Smazat, Toggle aktivni
      Zavislost: 2.2

  2.5 [mp-spec-fe-forms] UpsellRuleEditor.jsx + UpsellRuleList.jsx
      - CRUD pro upsell pravidla
      Zavislost: 2.2

FAZE 3 — Widget/Kalkulacka integrace (po Fazi 1+2)
  3.1 [mp-mid-frontend-widget] ExpressTierSelector.jsx
      - Karty vedle sebe pro vyber urovne
      - Zvyrazneni vybrane karty
      - Zobrazeni absolutni ceny priplatku
      Zavislost: 1.2

  3.2 [mp-spec-fe-checkout] DeliveryEstimate.jsx
      - Vypocet a zobrazeni odhadovaneho terminu doruceni
      - Respektovani business hours a vikende
      Zavislost: 3.1

  3.3 [mp-spec-fe-checkout] UpsellPanel.jsx + UpsellCard.jsx
      - Kontextualni upsell nabidky
      - Logika: jake upselly zobrazit na zaklade aktualniho stavu
      Zavislost: 2.5, 3.1

  3.4 [mp-spec-fe-state] Integrace do kalkulacky state
      - Pridani expressTierId do stavu kalkulacky
      - Propojeni s PricingCalculator pro prepocet
      Zavislost: 3.1, 3.2

FAZE 4 — Quality gates
  4.1 [mp-mid-quality-code] Code review
  4.2 [mp-spec-test-unit] Unit testy
  4.3 [mp-spec-test-build] Build verification
```

### C3. Kriticke rozhodovaci body

1. **Kam zaradit express v pipeline?** Rozhodnuti: mezi fees a markup. Duvod: express priplatek je funkce zakladni ceny (vcetne fees), markup se pocita ze subtotalu vcetne expresu.

2. **Jak resit upsell triggery?** Moznosti:
   - a) Hardcoded triggery (jednoduche, pro MVP)
   - b) json-rules-engine (flexibilni, ale dalsi zavislost)
   - **Rozhodnuti: varianta a) pro MVP**, s pripravenym rozhranim pro budouci upgrade na json-rules-engine

3. **Delivery estimate — jak pocitat?** Moznosti:
   - a) Jednoduche pridani business days k dnesnimu datu
   - b) Kalendarni system s prazdninami
   - **Rozhodnuti: varianta a) pro MVP**, s `exclude_weekends: true` volbou

4. **Kde ulozit express tier v objednavce?** Rozhodnuti: pridat `express_snapshot` do orders schema s `tier_id`, `tier_name`, `surcharge_amount`, `delivery_estimate`.

### C4. Testovaci strategie

**Unit testy:**
- `adminExpressStorage.test.js` — load/save, normalizace, default config, edge cases (prazdny vstup, invalidni surcharge_type)
- `calcExpressSurcharge.test.js` — percent, fixed, combined, min/max clamp, none type, edge cases (0%, negativni vstup)
- `deliveryEstimate.test.js` — business days kalkulace, vikendy, cutoff time

**Integration testy:**
- `pricingEngineV3.express.test.js` — express priplatek v celkovem pipeline, spravne poradi (po fees, pred markup)
- Overeni ze existujici testy stale prochazi po pridani express parametru

**E2E testy:**
- Admin: vytvoreni nove urovne, editace, smazani, zmena poradi
- Kalkulacka: vyber Express, overeni prepoctu ceny, zobrazeni terminu
- Upsell: zobrazeni relevantniho upsell, prijmuti, overeni zmeny ceny

**Edge cases:**
- Express config neexistuje (fallback na Standard)
- Vsechny tiers jsou neaktivni
- surcharge_min > surcharge_max
- processing_days_min > processing_days_max
- 0 souboru v objednavce
- Velmi vysoka cena objednavky (overflow test)

### C5. Migrace existujicich dat

**Neni potreba migrace** — express:v1 je novy namespace, neexistuji legacy data.

**Zpetna kompatibilita:**
- `calculateOrderQuote()` musi fungovat bez `expressTierId` parametru (default: zadny priplatek)
- Existujici objednavky v `orders:v1` nemaji `express_snapshot` — zobrazit jako "Standard" v UI
- Novy parametr v `calculateOrderQuote` je volitelny, stare volani se nezmeni

---

## D. KVALITA

### D1. Security review body

- **Input validace:** Vsechny surcharge hodnoty musi byt non-negative, clamped. surcharge_percent max 200%.
- **Tier ID validace:** Express tier ID musi existovat v konfiguraci tenantu — nelze pouzit cizi tier.
- **XSS prevence:** Tier name a description se renderuji jako text, ne HTML.
- **Storage overflow:** Omezeni poctu tiers na 10, upsell rules na 20 (ochrana pred localStorage DoS).
- **Tenant izolace:** Express config je scoped na tenant — pouziva se `readTenantJson/writeTenantJson`.

### D2. Performance budget

- **Storage read:** loadExpressConfig < 5ms (localStorage je synchronni)
- **Surcharge kalkulace:** calcExpressSurcharge < 1ms (jednoducha matematika)
- **Delivery estimate:** < 2ms (iterace pres business days)
- **UI render:** ExpressTierSelector max 3 karty, zadny lazy load nutny
- **Celkovy dopad na calculateOrderQuote:** < 1ms navic

### D3. Accessibility pozadavky

- ExpressTierSelector: karty musi byt focusable (tabindex), vybrana karta ma `aria-selected="true"`
- Keyboard navigace: sipky vlevo/vpravo pro prepinani mezi kartami
- Screen reader: `role="radiogroup"` pro tier selector, `role="radio"` pro kazdou kartu
- Barevny kontrast: priplatek cena musi mit dostatecny kontrast (WCAG AA)
- Delivery estimate: datum v `<time>` elementu s `datetime` atributem

### D4. Error handling a edge cases

- **Zadna express config:** Fallback na jedinou uroven "Standard" bez priplatku
- **Neplatny tier_id:** Ignorovat, pouzit default tier
- **surcharge_type neznamy:** Treat jako "none" (bez priplatku)
- **Negativni surcharge_percent:** Clamp na 0
- **localStorage plny:** Graceful fail — ulozeni selze, UI zobrazi warning toast
- **Datum vypocet v jinem timezone:** Pouzivat UTC pro business logic, lokalni cas jen pro zobrazeni
- **Upsell pravidlo odkazuje na neexistujici post-processing:** Nezobrazovat (graceful skip)

### D5. i18n pozadavky

- Vsechny texty v express UI musi byt i18n-ready (klice v `cs.json` a `en.json`)
- Tier name a description jsou tenant-specific (neni treba prekladat — admin je pise sam)
- Delivery estimate: format data podle locale (`dd.MM.yyyy` pro cs, `MM/dd/yyyy` pro en)
- Mena: priplatek zobrazovat v tenant mene (CZK, EUR, ...) s `Intl.NumberFormat`
- Upsell texty: predpripravene sablony v obou jazycich, admin muze upravit

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

```javascript
// V adminExpressStorage.js
const FEATURE_FLAGS = {
  express_tiers_enabled: true,      // celkovy toggle pro express
  upsells_enabled: true,            // toggle pro upsell system
  delivery_estimate_enabled: true,  // toggle pro odhad doruceni
};
```

**Postupne nasazeni:**
1. **Faze A:** Express tiers — admin konfigurace + pricing engine integrace (bez widget UI)
2. **Faze B:** Express v kalkulacce — ExpressTierSelector + DeliveryEstimate
3. **Faze C:** Upsell system — admin konfigurace + UpsellPanel v checkout

### E2. Admin UI zmeny

- **Nova polozka v sidebar:** "Expresni dodani" (ikona: Zap/Rocket) — pod "Fees"
- **AdminExpress.jsx:** 3 taby — Urovne, Upselly, Nastaveni
- **AdminOrders.jsx:** Zobrazit express tier badge u objednavek s express/rush
- **AdminDashboard.jsx:** Metrika "Podil express objednavek" v dashboard stats

### E3. Widget zmeny

- **ExpressTierSelector:** Novy UI blok v konfiguracnim kroku kalkulacky
- **PricingCalculator:** Novy radek "Expresni priplatek" v rozpisu ceny
- **DeliveryEstimate:** Pod tier selectorem zobrazit odhadovany termin
- **UpsellPanel:** Pri checkout (krok 3) zobrazit relevatni upselly
- **postMessage:** Nova message types pro express tier zmeny

### E4. Dokumentace pro uzivatele

- **Admin guide:** "Jak nastavit expresni dodani" — krok za krokem s screenshots
- **Tooltip texty:** Na kazdem poli v ExpressTierEditor vysvetleni co pole dela
- **Onboarding:** Prvni navsteva AdminExpress zobrazi welcome dialog s vysvetlenim
- **FAQ:** "Co je expresni priplatek?" — pro zakaznikovou kalkulacku

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Podil express objednavek | > 15% ze vsech objednavek | `orders.express_snapshot.tier_id != 'standard'` |
| AOV uplift z upsells | > 10% zvyseni AOV | Porovnani AOV s/bez upsells |
| Express revenue share | > 20% celkoveho revenue z express priplatku | Suma surcharge_amount / celkovy revenue |
| Upsell conversion rate | > 8% zobrazeni -> prijmuti | Tracked events v analytics |
| Admin adoption | > 70% tenantu nakonfiguruje express | Tenants s custom express config |
