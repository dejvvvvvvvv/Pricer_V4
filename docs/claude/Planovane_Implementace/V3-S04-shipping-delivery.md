# V3-S04: Doprava a dodaci lhuty

> **Priorita:** P1 | **Obtiznost:** Stredni | **Vlna:** 3
> **Zavislosti:** S01 (fungujici ceny), S02 (checkout flow)
> **Odhadovany rozsah:** ~2500 radku (frontend), ~500 radku (admin), ~400 radku (storage)

---

## A. KONTEXT

### A1. Ucel a cil

Sekce S04 resi pridani systemu dopravy a dodacich lhut do kalkulacky. Zakaznik
aktualne **nevidi cenu dopravy ani odhadovany cas doruceni**, coz je pro dokonceni
objednavky zasadni informace. Bez dopravy je celkova cena nekompletni a zakaznik
nema realistickou predstavu o vysledne castce.

Co S04 pridava:
1. **Admin nastaveni dopravnich metod a cen** — nova stranka Admin > Doprava
2. **Vyber dopravy v kalkulacce** — radio buttony/karty v checkout kroku
3. **Integrace s celkovou cenou** — doprava se pricte k souctu
4. **Odhadovana dodaci lhuta** — kalkulace vyroby + dopravy + buffer
5. **Specialni typ "Osobni odber"** — nulova cena, adresa vydejniho mista
6. **Pravidla "doprava zdarma"** — nad urcitou castku objednavky

**Business value:** Doprava je castou rozhodovaci bariérou. Zakaznik, ktery vidi
jen cenu tisku ale ne celkovou cenu vcetne dopravy, casto opusti objednavku.
"Doprava zdarma od X Kc" je jeden z nejucinnejsich e-commerce incentivou —
motivuje zakazniky ke zvyseni hodnoty objednavky.

### A2. Priorita, obtiznost, vlna

- **P1** — dulezite pro kompletni objednavkovy flow, ale az po S01 (ceny) a S02 (checkout).
- **Obtiznost: Stredni** — prevazne CRUD operace v admin panelu a zobrazeni
  ve widgetu. Slozitejsi je kalkulace hmotnostnich pasem a dodaci lhuta.
- **Vlna 3** — musi nasledovat po S02 (checkout), protoze doprava se
  zobrazuje v checkout kroku (krok 3 "Kontrola a objednavka").

### A3. Zavislosti na jinych sekcich

| Smer | Sekce | Typ zavislosti |
|------|-------|----------------|
| **S04 zavisi na S01** | Bug fixes | Fungujici celkova cena pro "doprava zdarma od X" |
| **S04 zavisi na S02** | Checkout | Checkout krok, kde se doprava zobrazuje |
| **S04 obohacuje S02** | Checkout | Pridava radek "Doprava" do shrnuti objednavky |
| **S09 rozsiruje S04** | Express pricing | Express doprava jako upsell |
| **S16 rozsiruje S04** | Multi-currency | Cena dopravy v ruznych menach |
| **S17 vyuziva S04** | E-commerce pluginy | Sync dopravnich metod s WooCommerce/Shopify |

### A4. Soucasny stav v codebase

**Existujici soubory relevantni pro S04:**

| Soubor | Umisteni | Stav |
|--------|----------|------|
| Hlavni kalkulacka | `src/pages/test-kalkulacka/index.jsx` | Kroky 1-3, doprava neni |
| Checkout step | S02 vytvori `CheckoutStep.jsx` | Sem se prida sekce dopravy |
| Pricing engine | `src/lib/pricing/pricingEngineV3.js` | `calculateOrderQuote()` — nema doprava field |
| Orders storage | `src/utils/adminOrdersStorage.js` | Orders nemaji shipping field |
| Admin Layout | `src/pages/admin/AdminLayout.jsx` | Menu navigace — pridat "Doprava" |
| Routes | `src/Routes.jsx` | Pridat route `/admin/shipping` |
| Tenant storage | `src/utils/adminTenantStorage.js` | readTenantJson/writeTenantJson |
| Admin Fees | `src/pages/admin/AdminFees.jsx` | Vzor pro admin CRUD stranku |
| Admin Pricing | `src/pages/admin/AdminPricing.jsx` | Vzor pro admin konfiguraci |

**Co uz existuje:**
- Kompletni pricing pipeline v `pricingEngineV3.js`
- Admin panel s navigaci a CRUD vzory (Fees, Pricing, Presets)
- Tenant-scoped storage vzor (`readTenantJson`, `writeTenantJson`)
- Checkout flow z S02 (po jeho implementaci)
- Order schema v `adminOrdersStorage.js` s totals

**Co chybi:**
- Namespace `shipping:v1` pro dopravni metody
- Admin stranka `/admin/shipping`
- Route v `Routes.jsx`
- Menu polozka v `AdminLayout.jsx`
- `adminShippingStorage.js` helper
- Shipping selector komponent ve widgetu
- Integrace dopravy do celkove ceny
- Dodaci lhuta kalkulace

### A5. Referencni zdroje a konkurence

**OSS knihovny doporucene pro S04:**

| Knihovna | Ucel | Poznamka |
|----------|------|----------|
| **Karrio** (karrioapi/karrio) | Self-hosted multi-carrier API | 1.2k+ hvezd, shipping rates, labels, tracking |
| **PurplShip OSS** (purplship) | Open-source multi-carrier API | Alternativa ke Karrio |
| **Vendure** (vendure-ecommerce) | Headless commerce s shipping | 5.5k+ hvezd, inspirace pro model |
| **Medusa** (medusajs/medusa) | Headless commerce s shipping | 25k+ hvezd, fulfillment providers |
| **node-shipping-ups** | UPS API klient | Pro budouci integraci s realnymi dopravci |

**Doporuceni pro MVP:** Vlastni implementace — admin rucne nastavi dopravni
metody a ceny. Integrace s realnym API dopravcu (Zasilkovna, PPL, DPD)
az v pozdejsi fazi.

**Konkurence:**
- Xometry: Fixni dopravni sazby podle zeme, "Free shipping" nad $50
- Craftcloud: Kalkulovana doprava podle hmotnosti a destinace
- AutoQuote3D: Vyber z vice dopravcu, real-time ceny
- i.materialise: Fixni doprava + expresni varianta (2x cena)

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Shipping config (novy namespace `shipping:v1`):**

```json
{
  "_schema_version": 1,
  "_updated_at": "2026-02-06T12:00:00Z",

  "methods": [
    {
      "id": "ship_001",
      "name_cs": "Ceska posta — Balik do ruky",
      "name_en": "Czech Post — Home delivery",
      "description_cs": "Doruceni na adresu do 2-5 pracovnich dnu",
      "description_en": "Home delivery in 2-5 business days",
      "price_type": "FIXED",
      "fixed_price": 99,
      "weight_tiers": null,
      "free_above_total": 1000,
      "estimated_days_min": 2,
      "estimated_days_max": 5,
      "is_active": true,
      "visible_in_widget": true,
      "sort_order": 1,
      "icon_url": null,
      "icon_name": "Truck",
      "type": "delivery",
      "created_at": "2026-02-06T10:00:00Z",
      "updated_at": "2026-02-06T10:00:00Z"
    },
    {
      "id": "ship_002",
      "name_cs": "Zasilkovna",
      "name_en": "Zasilkovna (Pickup point)",
      "description_cs": "Vyzvednete na pobocce Zasilkovny",
      "description_en": "Pick up at Zasilkovna location",
      "price_type": "FIXED",
      "fixed_price": 69,
      "weight_tiers": null,
      "free_above_total": 1500,
      "estimated_days_min": 1,
      "estimated_days_max": 3,
      "is_active": true,
      "visible_in_widget": true,
      "sort_order": 2,
      "icon_url": null,
      "icon_name": "Package",
      "type": "pickup_point",
      "created_at": "2026-02-06T10:00:00Z",
      "updated_at": "2026-02-06T10:00:00Z"
    },
    {
      "id": "ship_003",
      "name_cs": "PPL",
      "name_en": "PPL Courier",
      "description_cs": "Kuryerni doruceni PPL",
      "description_en": "PPL courier delivery",
      "price_type": "WEIGHT_BASED",
      "fixed_price": null,
      "weight_tiers": [
        { "from_g": 0, "to_g": 500, "price": 79 },
        { "from_g": 501, "to_g": 2000, "price": 99 },
        { "from_g": 2001, "to_g": 5000, "price": 129 },
        { "from_g": 5001, "to_g": 30000, "price": 169 }
      ],
      "free_above_total": null,
      "estimated_days_min": 1,
      "estimated_days_max": 2,
      "is_active": true,
      "visible_in_widget": true,
      "sort_order": 3,
      "icon_url": null,
      "icon_name": "Zap",
      "type": "delivery",
      "created_at": "2026-02-06T10:00:00Z",
      "updated_at": "2026-02-06T10:00:00Z"
    },
    {
      "id": "ship_004",
      "name_cs": "Osobni odber",
      "name_en": "Personal pickup",
      "description_cs": "Vyzvednete v nasi dilne",
      "description_en": "Pick up at our workshop",
      "price_type": "FIXED",
      "fixed_price": 0,
      "weight_tiers": null,
      "free_above_total": null,
      "estimated_days_min": 0,
      "estimated_days_max": 0,
      "is_active": true,
      "visible_in_widget": true,
      "sort_order": 4,
      "icon_url": null,
      "icon_name": "MapPin",
      "type": "personal_pickup",
      "pickup_address": {
        "street": "Delnická 12",
        "city": "Praha 7",
        "zip": "17000"
      },
      "opening_hours": "Po-Pa 9:00-17:00"
    }
  ],

  "settings": {
    "production_buffer_days": 2,
    "show_delivery_estimate": true,
    "show_free_shipping_progress": true,
    "free_shipping_message_cs": "Doprava zdarma od {amount} Kc",
    "free_shipping_message_en": "Free shipping from {amount} CZK"
  }
}
```

**Rozsireni order schema (v `orders:v1`):**

```json
{
  "shipping": {
    "method_id": "ship_002",
    "method_name": "Zasilkovna",
    "price": 69,
    "is_free": false,
    "estimated_delivery": {
      "from": "2026-02-10",
      "to": "2026-02-12"
    }
  },
  "pricing_snapshot": {
    "total": 519,
    "subtotal_before_shipping": 450,
    "shipping": 69,
    "currency": "CZK"
  }
}
```

### B2. API kontrakty (endpointy)

**Novy endpoint — seznam dopravnich metod (pro widget):**

```
GET /api/shipping/methods
  Query params: ?order_total=450&weight_g=25
  Response (200): {
    methods: [
      {
        id: "ship_001",
        name: "Ceska posta",
        description: "Doruceni do 2-5 dnu",
        price: 99,
        is_free: false,
        free_above: 1000,
        remaining_for_free: 551,
        estimated_days: { min: 2, max: 5 },
        icon: "Truck",
        type: "delivery"
      },
      {
        id: "ship_004",
        name: "Osobni odber",
        description: "Vyzvednete v nasi dilne",
        price: 0,
        is_free: true,
        pickup_address: { street: "...", city: "...", zip: "..." },
        opening_hours: "Po-Pa 9:00-17:00",
        type: "personal_pickup"
      }
    ]
  }
```

**Admin CRUD endpointy:**

```
GET    /api/admin/shipping/methods         -> seznam vsech metod
POST   /api/admin/shipping/methods         -> vytvorit novou
PUT    /api/admin/shipping/methods/:id     -> aktualizovat
DELETE /api/admin/shipping/methods/:id     -> smazat
PATCH  /api/admin/shipping/methods/:id/toggle  -> aktivovat/deaktivovat
PUT    /api/admin/shipping/settings        -> aktualizovat nastaveni
```

### B3. Komponentni strom (React)

**Admin panel:**

```
AdminLayout
+-- AdminShipping                              << NOVA STRANKA
    |-- ShippingMethodsList
    |   +-- ShippingMethodRow
    |       |-- MethodStatusToggle
    |       |-- MethodEditButton
    |       +-- MethodDeleteButton
    |-- ShippingMethodEditor                   << MODAL nebo PANEL
    |   |-- BasicInfoSection
    |   |   |-- NameInput (cs/en)
    |   |   |-- DescriptionInput (cs/en)
    |   |   +-- TypeSelect (delivery/pickup_point/personal_pickup)
    |   |-- PricingSection
    |   |   |-- PriceTypeRadio (FIXED / WEIGHT_BASED)
    |   |   |-- FixedPriceInput
    |   |   |-- WeightTiersEditor              << NOVY: tabulka hmotnostnich pasem
    |   |   |   +-- WeightTierRow
    |   |   +-- FreeAboveInput
    |   |-- DeliverySection
    |   |   |-- EstimatedDaysInputs (min / max)
    |   |   +-- PersonalPickupFields (adresa, oteviraci doba)
    |   |-- DisplaySection
    |   |   |-- IconSelect (Lucide ikony)
    |   |   |-- SortOrderInput
    |   |   +-- VisibleInWidgetToggle
    |   +-- SaveButton
    +-- ShippingSettings
        |-- ProductionBufferInput
        |-- ShowEstimateToggle
        |-- ShowFreeShippingProgressToggle
        +-- FreeShippingMessageInput
```

**Widget (checkout krok):**

```
CheckoutStep (z S02)
|-- OrderSummary
|-- ShippingSelector                           << NOVY
|   |-- ShippingMethodCard
|   |   |-- MethodIcon
|   |   |-- MethodName
|   |   |-- MethodPrice (nebo "Zdarma")
|   |   |-- MethodEstimate ("2-5 prac. dnu")
|   |   +-- PersonalPickupInfo (adresa, hodiny)
|   |-- FreeShippingProgress                   << NOVY
|   |   +-- ProgressBar
|   +-- DeliveryEstimate                       << NOVY
|       +-- EstimateDateRange
|-- ContactForm (z S02)
|-- OrderNote (z S02)
+-- SubmitButton (z S02)
```

### B4. Tenant storage namespace

| Namespace | Helper | Pouziti v S04 |
|-----------|--------|---------------|
| `shipping:v1` | Novy `adminShippingStorage.js` | CRUD dopravnich metod + nastaveni |
| `orders:v1` | `adminOrdersStorage.js` | Rozsireni o shipping pole |
| `pricing:v3` | `adminPricingStorage.js` | Cteni pro "doprava zdarma od" porovnani |

**Novy storage helper: `src/utils/adminShippingStorage.js`**

```js
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_SHIPPING = 'shipping:v1';

export function loadShippingConfig() {
  return readTenantJson(NS_SHIPPING, getDefaultShippingConfig());
}

export function saveShippingConfig(config) {
  const normalized = normalizeShippingConfig(config);
  writeTenantJson(NS_SHIPPING, {
    ...normalized,
    _updated_at: new Date().toISOString(),
  });
  return normalized;
}

export function getDefaultShippingConfig() {
  return {
    _schema_version: 1,
    methods: [],
    settings: {
      production_buffer_days: 2,
      show_delivery_estimate: true,
      show_free_shipping_progress: true,
      free_shipping_message_cs: 'Doprava zdarma od {amount} Kc',
      free_shipping_message_en: 'Free shipping from {amount} CZK',
    },
  };
}

export function calculateShippingPrice(method, orderTotal, totalWeightG) {
  if (!method || !method.is_active) return null;

  // Free shipping check
  if (method.free_above_total && orderTotal >= method.free_above_total) {
    return { price: 0, is_free: true, reason: 'free_above_total' };
  }

  if (method.price_type === 'FIXED') {
    return { price: method.fixed_price || 0, is_free: false };
  }

  if (method.price_type === 'WEIGHT_BASED' && Array.isArray(method.weight_tiers)) {
    const tier = method.weight_tiers.find(
      (t) => totalWeightG >= t.from_g && totalWeightG <= t.to_g
    );
    if (tier) {
      return { price: tier.price, is_free: false, tier };
    }
    // Above max tier
    const maxTier = method.weight_tiers[method.weight_tiers.length - 1];
    return { price: maxTier?.price || 0, is_free: false, tier: maxTier };
  }

  return { price: 0, is_free: false };
}

export function calculateDeliveryEstimate(method, settings, totalPrintTimeMinutes) {
  const bufferDays = settings?.production_buffer_days || 0;
  const printDays = Math.ceil(totalPrintTimeMinutes / (8 * 60)); // 8h pracovni den
  const productionDays = printDays + bufferDays;

  const deliveryMin = method?.estimated_days_min || 0;
  const deliveryMax = method?.estimated_days_max || 0;

  const totalMin = productionDays + deliveryMin;
  const totalMax = productionDays + deliveryMax;

  // Kalkulace data (preskocit vikendy)
  const fromDate = addBusinessDays(new Date(), totalMin);
  const toDate = addBusinessDays(new Date(), totalMax);

  return {
    production_days: productionDays,
    delivery_days_min: deliveryMin,
    delivery_days_max: deliveryMax,
    total_days_min: totalMin,
    total_days_max: totalMax,
    from_date: fromDate.toISOString().split('T')[0],
    to_date: toDate.toISOString().split('T')[0],
  };
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) remaining--;
  }
  return result;
}
```

### B5. Widget integrace (postMessage)

**Nove postMessage zpravy:**

```js
// Widget -> Parent (doprava vybrana)
{
  type: 'MODEL_PRICER_SHIPPING_SELECTED',
  methodId: string,
  methodName: string,
  shippingPrice: number,
  isFree: boolean,
  estimatedDelivery: {
    fromDate: string,
    toDate: string,
    totalDaysMin: number,
    totalDaysMax: number
  }
}

// Widget -> Parent (celkova cena aktualizovana vcetne dopravy)
{
  type: 'MODEL_PRICER_TOTAL_WITH_SHIPPING',
  subtotal: number,
  shipping: number,
  total: number,
  currency: string
}
```

### B6. Pricing engine integrace

**Pricing engine (`pricingEngineV3.js`) se v S04 primo nemeni.**

Doprava je kalkulovana **mimo** pricing engine, protoze:
1. Engine pocita cenu tisku (material + cas + fees + markup)
2. Doprava je pridana nad vysledek engine

```
calculateOrderQuote() -> subtotal (450 Kc)
                         |
                         v
calculateShippingPrice(method, subtotal, weight) -> shipping (99 Kc)
                         |
                         v
total = subtotal + shipping = 549 Kc
```

**Prenos dat do pricing pipeline:**

```js
// V CheckoutStep.jsx
const quote = calculateOrderQuote({ ... });
const subtotal = quote.total;

const shippingResult = calculateShippingPrice(
  selectedMethod,
  subtotal,
  totalWeightG   // soucet filamentGrams vsech modelu * quantity
);

const totalWithShipping = subtotal + shippingResult.price;

// Zobrazeni
<OrderSummaryPricing
  subtotal={subtotal}
  shipping={shippingResult.price}
  shippingIsFree={shippingResult.is_free}
  total={totalWithShipping}
/>
```

**Hmotnost pro weight-based dopravu:**

```js
// Celkova hmotnost objednavky (ze vsech modelu)
const totalWeightG = quote.models.reduce((sum, model) => {
  return sum + (model.base.filamentGrams * model.quantity);
}, 0);
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-frontend` | Review architektura, schvaleni navrhu dopravy | - | P0 |
| `mp-sr-pricing` | Review cenoveho modelu dopravy | - | P1 |
| `mp-mid-frontend-admin` | Admin stranka /admin/shipping | `AdminShipping.jsx` | P0 |
| `mp-mid-frontend-public` | ShippingSelector ve widgetu, integrace do CheckoutStep | `ShippingSelector.jsx`, `CheckoutStep.jsx` | P0 |
| `mp-spec-fe-forms` | ShippingMethodEditor formular, WeightTiersEditor | `ShippingMethodEditor.jsx` | P0 |
| `mp-spec-fe-tables` | ShippingMethodsList, radkovani, razeni | `ShippingMethodsList.jsx` | P1 |
| `mp-spec-fe-checkout` | FreeShippingProgress bar, DeliveryEstimate | `FreeShippingProgress.jsx`, `DeliveryEstimate.jsx` | P1 |
| `mp-mid-storage-tenant` | `adminShippingStorage.js` | `src/utils/adminShippingStorage.js` | P0 |
| `mp-spec-storage-migration` | Rozsireni orders schema o shipping pole | `adminOrdersStorage.js` | P1 |
| `mp-spec-pricing-shipping` | `calculateShippingPrice()`, `calculateDeliveryEstimate()` | `adminShippingStorage.js` | P0 |
| `mp-spec-pricing-tax` | DPH na dopravu (pokud relevantni) | - | P2 |
| `mp-spec-fe-routing` | Route `/admin/shipping` v Routes.jsx | `Routes.jsx` | P0 |
| `mp-spec-fe-layout` | Menu polozka "Doprava" v AdminLayout.jsx | `AdminLayout.jsx` | P0 |
| `mp-spec-design-responsive` | Responsive shipping karty na mobilech | CSS | P2 |
| `mp-spec-design-a11y` | A11y shipping selector (radiogroup, keyboard) | ARIA | P2 |
| `mp-spec-design-user-friendly` | UX: free shipping progress, motivacni text | - | P1 |
| `mp-spec-i18n-translations` | CZ/EN preklady pro dopravu | i18n JSON | P1 |
| `mp-sr-quality` | Code review po implementaci | - | P0 |
| `mp-spec-test-unit` | Unit testy storage, cenovy model, delivery estimate | `__tests__/` | P1 |
| `mp-spec-test-e2e` | E2E test shipping flow | `e2e/` | P2 |

### C2. Implementacni kroky (poradi)

```
KROK 1: [PARALELNE] Priprava
  1a. mp-mid-storage-tenant: Vytvorit adminShippingStorage.js (CRUD, helpers)
  1b. mp-spec-pricing-shipping: Implementovat calculateShippingPrice + calculateDeliveryEstimate
  1c. mp-spec-fe-routing: Pridat route /admin/shipping do Routes.jsx
  1d. mp-spec-fe-layout: Pridat "Doprava" do navItems v AdminLayout.jsx
  1e. mp-spec-i18n-translations: Pripravit prekladove klice

KROK 2: [SEKVENCNE po 1] Admin stranka
  2a. mp-mid-frontend-admin: Vytvorit AdminShipping.jsx — hlavni stranka
  2b. mp-spec-fe-tables: ShippingMethodsList — tabulka metod (drag-sort, toggle, delete)
  2c. mp-spec-fe-forms: ShippingMethodEditor — formular pro editaci metody
  2d. mp-spec-fe-forms: WeightTiersEditor — tabulka hmotnostnich pasem
  2e. mp-mid-frontend-admin: ShippingSettings — production buffer, messages
  2f. mp-mid-frontend-admin: Default demo data (Ceska posta, Zasilkovna, Osobni odber)

KROK 3: [SEKVENCNE po 2, S02] Widget integrace
  3a. mp-mid-frontend-public: Vytvorit ShippingSelector komponent
  3b. mp-mid-frontend-public: ShippingMethodCard (radio button s detaily)
  3c. mp-spec-fe-checkout: FreeShippingProgress bar ("Jeste 551 Kc do dopravy zdarma!")
  3d. mp-spec-fe-checkout: DeliveryEstimate ("Odhadovane doruceni: 10.2.2026 - 12.2.2026")
  3e. mp-mid-frontend-public: Integrace do CheckoutStep.jsx (mezi OrderSummary a ContactForm)
  3f. mp-mid-frontend-public: Aktualizace celkove ceny o dopravu

KROK 4: [SEKVENCNE po 3] Order integrace
  4a. mp-spec-storage-migration: Pridat shipping pole do order schema
  4b. mp-mid-frontend-admin: Zobrazit dopravu v Admin > Orders > Detail
  4c. mp-mid-frontend-public: Ulozit shipping info pri odeslani objednavky

KROK 5: [PO VSEM] Quality gates
  5a. mp-sr-quality: Code review
  5b. mp-spec-test-unit: Unit testy
  5c. mp-spec-test-e2e: E2E testy
  5d. mp-spec-test-build: Build test
```

### C3. Kriticke rozhodovaci body

**RB1: Doprava v pricing engine vs. mimo engine?**
- **Mimo engine (doporuceno):** Doprava je odlisna od materialu/casu/fees.
  Ma vlastni logiku (hmotnostni pasma, free shipping). Pridani do engine by
  ho zbytecne zkomplikovalo.
- **V engine:** Konzistentnejsi, vsechno v jednom miste. Ale engine je
  uz slozity a doprava je konceptualne jiny typ nakladu.
- **Doporuceni:** Mimo engine. `calculateShippingPrice()` je samostatna funkce.

**RB2: Hmotnostni pasma vs. jen fixni cena?**
- **Jen fixni (jednodussi):** Kazda metoda ma jednu cenu. Rychle k implementaci.
- **Fixni + hmotnostni (doporuceno):** Vice flexibility pro firmy se zakazkami
  ruznych velikosti. PPL/DPD realne ucetuji podle hmotnosti.
- **Doporuceni:** Oba typy — admin vybere FIXED nebo WEIGHT_BASED.

**RB3: Realne API dopravcu vs. manualni konfigurace?**
- **Manualni (doporuceno pro MVP):** Admin rucne nastavi metody a ceny.
  Jednoduche, bez externiho API. Vetsina malych 3D tisk firem ma
  smluvni ceny s dopravcem.
- **Realne API:** Zasilkovna API, PPL API — real-time ceny. Slozitejsi,
  vyzaduje API klice, variabilni ceny.
- **Doporuceni:** Manualni pro MVP. API integrace jako S17+.

**RB4: Osobni odber — jednoduchy vs. multi-location?**
- **Jednoduchy (doporuceno pro MVP):** Jedna adresa, oteviraci doba.
- **Multi-location:** Vice vydejen (pobocky, Zasilkovna points).
  Slozitejsi UX (mapa, vyhledavani).
- **Doporuceni:** Jednoduchy pro MVP, multi-location jako budouci rozsireni.

**RB5: Dodaci lhuta — pracovni dny vs. kalendarni?**
- **Pracovni dny (doporuceno):** Realisticke pro B2B i B2C.
  Preskakovani vikendu v kalkulaci.
- **Kalendarni:** Jednodussi, ale zavadejici (zakaznik ceka o vikendy).
- **Doporuceni:** Pracovni dny. Funkce `addBusinessDays()`.

### C4. Testovaci strategie

**Unit testy:**
- `calculateShippingPrice()`: fixni cena, hmotnostni pasma, free shipping
- `calculateDeliveryEstimate()`: production buffer, pracovni dny, vikendy
- `addBusinessDays()`: edge cases (patek -> pondeli, svatky)
- `adminShippingStorage.js`: load/save, normalizace, defaults
- `ShippingMethodEditor`: render, validace, save

**E2E testy:**
- Admin: vytvorit dopravni metodu, nastavit cenu, ulozit
- Admin: aktivovat/deaktivovat metodu
- Admin: hmotnostni pasma — pridat, editovat, smazat
- Widget: zobrazeni dopravnich metod, vyber
- Widget: "Doprava zdarma od 1000 Kc" — pod limitem, nad limitem
- Widget: celkova cena = subtotal + doprava
- Widget: dodaci lhuta se meni s dopravni metodou
- Widget: osobni odber — adresa a oteviraci doba zobrazeny

**Manualni testy:**
- Zadne dopravni metody → sekce se nezobrazuje
- Vsechny metody deaktivovane → sekce se nezobrazuje
- 1 metoda → automaticky vybrana, bez radio buttonu
- Zmena objednavky (pridani modelu) → aktualizace ceny dopravy (hmotnost)
- "Doprava zdarma" → pridani modelu az se prekroci limit
- Osobni odber → adresa se zobrazuje, cena 0
- Mobile: karty pod sebou, citelne na malych obrazovkach

### C5. Migrace existujicich dat

**Shipping (namespace `shipping:v1`):**
- Novy namespace, zadna migrace.
- Defaultni konfigurace je prazdny seznam metod.
- Admin musi rucne pridat dopravni metody.
- Mozne: pridat demo data (Ceska posta, Zasilkovna, Osobni odber) jako onboarding.

**Orders (namespace `orders:v1`):**
- Stavajici objednavky nemaji `shipping` pole.
- Migrace: pri cteni objednavky, pokud chybi `shipping`, nastavit `null`.
- Nove objednavky maji `shipping` objekt (nebo null pokud doprava neni nastavena).
- Zpetna kompatibilita: `computeOrderTotals()` prida shipping k totalu jen pokud existuje.

---

## D. KVALITA

### D1. Security review body

| Oblast | Riziko | Opatreni |
|--------|--------|----------|
| **Price manipulation** | Zakaznik manipuluje cenu dopravy v request | Server-side kalkulace, ne duvera client datam |
| **Free shipping bypass** | Zakaznik posle falesny orderTotal | Rekalkulace na backendu z aktualnich dat |
| **XSS v nazvech metod** | Admin zada `<script>` do nazvu | React JSX escapovani, sanitizace admin inputu |
| **IDOR** | Pristup k dopravnim metodam jineho tenanta | Tenant-scoped storage, kontrola tenantId |
| **Rate limiting** | Hromadne dotazy na shipping methods | Rate limit na API endpoint |
| **DoS pres weight tiers** | Tisice hmotnostnich pasem | Limit max 50 pasem na metodu |

### D2. Performance budget

| Metrika | Budget | Strategie |
|---------|--------|-----------|
| **Load shipping methods** | < 50ms | localStorage cteni, maly JSON |
| **Calculate shipping price** | < 5ms | Jednoducha logika, linearni hledani v tierech |
| **Calculate delivery estimate** | < 5ms | Aritmetika, addBusinessDays |
| **Admin page render** | < 200ms | Max 20 metod, jednoduchy list |
| **Bundle size (nove)** | < 5kB gzipped | Zadna nova knihovna |
| **Widget shipping selector** | < 100ms render | Max 10 metod, jednoduche karty |

### D3. Accessibility pozadavky

| Pozadavek | Implementace |
|-----------|-------------|
| **Shipping selector** | `role="radiogroup"` s `aria-label="Zpusob doruceni"` |
| **Shipping card** | `role="radio"`, `aria-checked`, `tabIndex` |
| **Keyboard** | Arrow keys pro prepinani, Enter/Space pro vyber |
| **Screen readers** | "Ceska posta, 99 korun, doruceni za 2 az 5 pracovnich dnu" |
| **Free shipping** | `aria-live="polite"` pro "Doprava zdarma!" notifikaci |
| **Progress bar** | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| **Personal pickup** | Adresa jako `<address>` element |
| **Kontrast** | Cena dopravy: min 4.5:1, "Zdarma" badge: zelena na bilem |

### D4. Error handling a edge cases

| Stav | Reseni |
|------|--------|
| Zadne dopravni metody | Sekce se nezobrazuje, objednavka bez dopravy |
| Vsechny metody neaktivni | Sekce se nezobrazuje |
| Hmotnost nad max tier | Pouzit posledni (nejvyssi) tier |
| Hmotnost 0g (zadne metriky) | Pouzit nejnizsi tier nebo fixni cenu |
| Free shipping presne na limitu | Doprava zdarma (>=, ne jen >) |
| Zmena objednavky po vyberu dopravy | Rekalkulace ceny dopravy |
| Admin smaze metodu behem session | Zobrazit "Zvolena doprava neni dostupna", preset fallback |
| Extremne vysoka hmotnost (100kg+) | Zobrazit "Kontaktujte nas pro individualni nabidku" |
| Personal pickup — admin nezadal adresu | Zobrazit jen nazev bez adresy |
| Vice metod se stejnym sort_order | Razeni podle id jako tiebreaker |
| Delivery estimate pres svátky | MVP: ignorovat svatky. Budoucnost: svátkový kalendar. |

### D5. i18n pozadavky

**Nove prekladove klice (CZ/EN):**

```json
{
  "shipping.title": "Zpusob doruceni / Delivery method",
  "shipping.free": "Zdarma / Free",
  "shipping.freeAbove": "Zdarma od {amount} Kc / Free from {amount} CZK",
  "shipping.remaining": "Jeste {amount} Kc do dopravy zdarma / {amount} CZK more for free shipping",
  "shipping.estimatedDays": "{min}-{max} pracovnich dnu / {min}-{max} business days",
  "shipping.estimatedDate": "Odhadovane doruceni: {from} - {to} / Estimated delivery: {from} - {to}",
  "shipping.personalPickup": "Osobni odber / Personal pickup",
  "shipping.pickupAddress": "Adresa: {address} / Address: {address}",
  "shipping.openingHours": "Oteviraci doba: {hours} / Opening hours: {hours}",
  "shipping.priceLabel": "Doprava / Shipping",
  "shipping.noMethods": "Doprava neni k dispozici / Shipping not available",
  "shipping.weightBased": "Cena podle hmotnosti / Price by weight",
  "shipping.selectMethod": "Vyberte zpusob doruceni / Select delivery method",
  "shipping.productionTime": "Doba vyroby: ~{days} prac. dnu / Production time: ~{days} bus. days",
  "admin.shipping.title": "Doprava / Shipping",
  "admin.shipping.addMethod": "Pridat metodu / Add method",
  "admin.shipping.editMethod": "Upravit metodu / Edit method",
  "admin.shipping.deleteConfirm": "Opravdu smazat? / Really delete?",
  "admin.shipping.priceType": "Typ ceny / Price type",
  "admin.shipping.fixed": "Fixni castka / Fixed amount",
  "admin.shipping.weightBased": "Podle hmotnosti / By weight",
  "admin.shipping.weightTier": "Hmotnostni pasmo / Weight tier",
  "admin.shipping.fromG": "Od (g) / From (g)",
  "admin.shipping.toG": "Do (g) / To (g)",
  "admin.shipping.buffer": "Vyrobni buffer (dny) / Production buffer (days)",
  "admin.shipping.settings": "Nastaveni / Settings"
}
```

Formatovani dat: `Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })`

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flag `ENABLE_SHIPPING`:**
- Ulozeny v `modelpricer:${tenantId}:feature_flags`
- Default: `false` (doprava se zapne az po nastaveni metod)
- Kdyz `false`: checkout step nezobrazuje shipping selector, objednavka bez dopravy
- Kdyz `true`: shipping selector se zobrazi pokud admin ma alespon 1 aktivni metodu

**Feature flag `ENABLE_DELIVERY_ESTIMATE`:**
- Default: `true` (pokud je shipping zapnuty)
- Kdyz `false`: dodaci lhuta se nezobrazuje (jen cena)

**Feature flag `ENABLE_FREE_SHIPPING_PROGRESS`:**
- Default: `true`
- Kdyz `false`: progress bar "do dopravy zdarma" se nezobrazuje

**Postupne nasazeni:**
1. Merge admin stranky — interni testovani
2. Widget shipping selector — staging
3. Feature flag `ENABLE_SHIPPING: true` pro beta testery (10 tenantu)
4. Monitoring: conversion rate, avg order value
5. Plny rollout po 2 tydnech

### E2. Admin UI zmeny

| Zmena | Stranka | Detail |
|-------|---------|--------|
| Nova stranka "Doprava" | Admin > Shipping (`/admin/shipping`) | CRUD dopravnich metod |
| Menu polozka | AdminLayout.jsx navItems | `{ path: '/admin/shipping', label: 'Doprava', icon: 'Truck' }` |
| Route | Routes.jsx | `<Route path="shipping" element={<AdminShipping />} />` |
| Order detail | Admin > Orders > Detail | Zobrazeni dopravy, ceny, lhuty |
| Demo data | Po prvnim nacteni | Ceska posta, Zasilkovna, Osobni odber jako defaults |

**Umisteni v navigaci:** Za Fees, pred Orders.

```
AdminLayout navItems:
  Dashboard
  Branding
  Pricing
  Fees
  Shipping        << NOVY
  Parameters
  Presets
  Orders
  Analytics
  Team Access
  Widget
```

### E3. Widget zmeny

| Zmena | Komponenta | Detail |
|-------|-----------|--------|
| Shipping selector | `ShippingSelector.jsx` | Radio karty s cenami a lhutami |
| Free shipping progress | `FreeShippingProgress.jsx` | Progress bar s motivacnim textem |
| Delivery estimate | `DeliveryEstimate.jsx` | Datum rozsah doruceni |
| Celkova cena | `OrderSummaryPricing` (z S02) | Novy radek "Doprava: XX Kc" |
| Checkout integrace | `CheckoutStep.jsx` (z S02) | Shipping selector mezi summary a form |
| PostMessage | `WidgetEmbed.jsx` | `MODEL_PRICER_SHIPPING_SELECTED` zprava |

### E4. Dokumentace pro uzivatele

| Dokument | Obsah |
|----------|-------|
| Admin guide: Doprava | Jak pridat dopravni metody, nastavit ceny, hmotnostni pasma |
| Admin guide: Osobni odber | Jak nastavit adresu a oteviraci dobu |
| Admin guide: Free shipping | Jak nastavit "doprava zdarma od X Kc" |
| Widget changelog | "Zakaznici nyni mohou vybrat zpusob doruceni" |
| API docs | Novy endpoint GET /api/shipping/methods |

### E5. Metriky uspechu (KPI)

| KPI | Cilova hodnota | Mereni |
|-----|---------------|--------|
| **Pouziti shipping selectoru** | > 80% objednavek ma vybranou dopravu | Event tracking |
| **Konverzni uplift** | +5-10% (zakaznik vidi kompletni cenu) | A/B test |
| **Prumerna hodnota objednavky (AOV)** | +15% diky "free shipping" motivaci | Analytics |
| **Nejpouzivanejsi metoda** | Identifikace top 3 | Analytics |
| **Free shipping conversion** | > 30% objednavek dosahne free shipping | Analytics |
| **Osobni odber podil** | 10-20% (ocekavane pro lokalni firmy) | Analytics |
| **Delivery estimate presnost** | Zakaznicka spokojenost > 4/5 | Feedback |
| **Admin adoption** | > 70% tenantu nastavi alespon 1 metodu | Feature usage |
| **Build success** | 100% | CI/CD |
| **Regrese** | 0 | Test suite |
| **Admin UX** | Pridani metody < 2 minuty | UX testovani |
