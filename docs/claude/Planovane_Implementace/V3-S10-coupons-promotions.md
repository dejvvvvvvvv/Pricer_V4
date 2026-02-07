# V3-S10: Slevove kupony a promo akce

> **Priorita:** P2 | **Obtiznost:** Medium | **Vlna:** 3
> **Zavislosti:** S01 (Bug Fixes), S05 (Mnozstevni slevy), S09 (Express Pricing)
> **Odhadovany rozsah:** ~40-55 souboru (novy storage helper, admin stranky, widget komponenty, validacni engine, analytika)

---

## A. KONTEXT

### A1. Ucel a cil

Kuponovy a promo system je zakladni marketingovy nastroj pro kazdou e-commerce platformu. Pro ModelPricer to znamena:

1. **Slevove kupony** — admin vytvori kupon s kodem (napr. LETO2025), nastavi typ slevy (procentualni, fixni, doprava zdarma, post-processing zdarma), platnost, limity pouziti a podminky aplikace. Zakaznik zada kod v kalkulacce a okamzite vidi slevou upravenou cenu.

2. **Promo akce** — casove omezene slevy ktere se aplikuji automaticky bez kodu. Typy: flash sale (casove okno), sezonni akce (delsi obdobi), bundlove akce (kombinace materialu/technologii). Banner s odpoctem v kalkulacce.

3. **Analytika kuponu** — dashboard s metrikami: celkovy pocet pouziti, celkova hodnota slev, konverzni rate, nejuspesnejsi kupony, ROI analyza.

**Business value:**
- Zvyseni konverzniho pomeru o 15-25% diky cilenym slevam
- Akvizice novych zakazniku (first-order kupony)
- Retence — vernostni kupony pro opakujici se zakazniky
- Sezonni kampane (Black Friday, Vanoce) generuji az 40% rocniho revenue
- Data-driven marketing — analyza ktere kupony funguji

### A2. Priorita, obtiznost, vlna

**Priorita P2** — kupony jsou standardni e-commerce feature, ale ModelPricer muze fungovat i bez nich v rane fazi. Pro produkni nasazeni jsou vsak nezbytne (zakaznici je ocekavaji).

**Obtiznost Medium** — kuponovy system ma hodne business pravidel (validace, limity, kombinovatelnost), ale kazde pravidlo je samo o sobe jednoduche. Slozitost je v kumulaci pravidel a edge casech (co kdyz dva kupony koliduji?). Promo akce pridavaji casovou dimenzi (automaticka aktivace/deaktivace).

**Vlna 3** — zavisi na hotovem pricing engine (S01, S05) a express pricing (S09), protoze kupony musi pocitat se vsemi polozkami v cene vcetne express priplatku. Take zavisi na zaklade objednavkoveho systemu.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred S10:**
- **S01 (Bug Fixes)** — stabilni pricing engine V3
- **S05 (Mnozstevni slevy)** — zakladni sleva logika v engine
- **S09 (Express Pricing)** — express priplatek musi existovat pred kalkulaci slevy

**Sekce ktere zavisi na S10:**
- **S12 (Zakaznicky portal)** — zobrazeni kuponu v zakaznickem uctu
- **S13 (Generovani dokumentu)** — faktura musi zobrazit slevovou polozku
- **S19 (CRM/Marketing/Analytika)** — kuponova analytika jako zdroj dat

**Obousmerne zavislosti:**
- **S11 (Chat)** — admin muze zakaznikovi v chatu poslat kupon

### A4. Soucasny stav v codebase

**Co uz existuje:**
- Pricing engine V3: `src/lib/pricing/pricingEngineV3.js` — ma `simple.discount` pole (negativni fees) ale neni to kuponovy system
- Admin Fees storage: `src/utils/adminFeesStorage.js` — muze slouzit jako vzor pro kupon storage
- Orders storage: `src/utils/adminOrdersStorage.js` — objednavky nemaji kupon snapshot
- Admin Analytics: `src/pages/admin/AdminAnalytics.jsx` — existuje zakladni analytics stranka
- Analytics storage: `src/utils/adminAnalyticsStorage.js` — zakladni analyticky helper
- Tenant storage: `src/utils/adminTenantStorage.js` — entrypoint pro vsechny namespace
- PricingCalculator: `src/pages/test-kalkulacka/components/PricingCalculator.jsx` — rozpis ceny (misto pro kuponovou radku)

**Co chybi:**
- Zadny `adminCouponsStorage.js` — neni coupons namespace
- Zadna admin stranka pro spravu kuponu a promo akci
- Zadny kuponovy validacni engine
- Zadne UI pro zadavani kuponovych kodu v kalkulacce
- Zadny promo banner system
- Zadna kuponova analytika
- Orders nemaji coupon_snapshot

### A5. Referencni zdroje a konkurence

**OSS knihovny (z doporuceni):**
- **Voucherify** — ma open-source cast, inspirace pro API design
- **Medusa Discounts** — built-in discount system v Medusa.js (headless commerce)
- Jinak vlastni implementace — kuponovy system je prilis specificky pro obecnou knihovnu

**Konkurencni reseni:**
- **Shopify** — plnohodnotny kuponovy system s auto-apply, kombinaci, segmentaci
- **WooCommerce** — kupony s podminkami (min. objednavka, specificke produkty)
- **Xometry** — zadny verejny kuponovy system (B2B)
- **Printful** — jednoduche % kupony

**Best practices:**
- Kuponovy kod musi byt case-insensitive (LETO2025 = leto2025)
- Validace musi byt real-time (ne az pri submit objednavky)
- Zobrazit presnou castku slevy (ne jen %), vcetne vysvetleni pokud kupon nelze pouzit
- Auto-apply promo akce se nesmejj kumulovat s kupony pokud to admin nepovolil
- Countdown timer pro flash sale zvysuje urgenci (ale nesmejj byt fake)

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `coupons:v1`
**Klic:** `modelpricer:${tenantId}:coupons:v1`

```json
{
  "schema_version": 1,
  "coupons": [
    {
      "id": "coupon_uuid_1",
      "code": "LETO2025",
      "name": "Letni sleva 2025",
      "description": "20% sleva na vsechny materialy",
      "discount_type": "percentage",
      "discount_value": 20,
      "minimum_order_value": 1000,
      "maximum_discount": 500,
      "usage_limit_total": 100,
      "usage_limit_per_customer": 1,
      "usage_count": 0,
      "valid_from": "2025-06-01T00:00:00Z",
      "valid_until": "2025-06-30T23:59:59Z",
      "is_active": true,
      "applies_to": "all",
      "applicable_items": [],
      "excluded_items": [],
      "first_order_only": false,
      "combinable": false,
      "created_by": "admin",
      "created_at": "2025-05-15T10:00:00Z",
      "updated_at": "2025-05-15T10:00:00Z"
    }
  ],
  "coupon_usages": [
    {
      "id": "usage_uuid_1",
      "coupon_id": "coupon_uuid_1",
      "order_id": "ORD-001200",
      "customer_email": "jan@example.cz",
      "customer_id": null,
      "discount_applied": 490,
      "used_at": "2025-06-15T14:30:00Z"
    }
  ],
  "promotions": [
    {
      "id": "promo_uuid_1",
      "name": "Flash Sale - Patek",
      "description": "15% sleva na vsechny materialy",
      "promotion_type": "flash_sale",
      "discount_type": "percentage",
      "discount_value": 15,
      "conditions": {
        "time_window": { "start": "14:00", "end": "16:00" },
        "days_of_week": [5],
        "min_order_value": 0
      },
      "applies_to": {
        "scope": "all",
        "material_ids": [],
        "technology_ids": []
      },
      "priority": 10,
      "stackable": false,
      "valid_from": "2025-06-01T00:00:00Z",
      "valid_until": "2025-08-31T23:59:59Z",
      "is_active": true,
      "display_banner": true,
      "banner_text": "FLASH SALE! 15% sleva na vsechny materialy",
      "banner_color": "#FF6B00",
      "created_at": "2025-05-20T09:00:00Z"
    }
  ],
  "settings": {
    "allow_multiple_coupons": false,
    "coupon_input_position": "checkout",
    "auto_apply_promotions": true,
    "show_promo_banners": true,
    "coupon_code_format": "UPPERCASE",
    "auto_generate_prefix": "MP",
    "auto_generate_length": 8
  },
  "updated_at": "2025-05-20T09:00:00Z"
}
```

**discount_type varianty:**
- `"percentage"` — % z ceny, s volitelnym maximum_discount
- `"fixed_amount"` — fixni castka (v mene obchodu)
- `"free_shipping"` — doprava zdarma
- `"free_postprocessing"` — post-processing zdarma

**applies_to varianty:**
- `"all"` — vsechny polozky
- `"specific_materials"` — jen vybrane materialy (applicable_items = material IDs)
- `"specific_technologies"` — jen vybrane technologie
- `"specific_categories"` — jen vybrane kategorie

**promotion_type varianty:**
- `"flash_sale"` — casove okno (napr. Happy Hours 14:00-16:00)
- `"time_based"` — sezonni akce (delsi obdobi, napr. cely cerven)
- `"quantity_based"` — sleva pri objednani X kusu
- `"bundle"` — sleva pri kombinaci materialu/technologii

### B2. API kontrakty (endpointy)

Pro Variantu A (localStorage demo) se nepouzivaji REST endpointy. Pro budouci backend:

```
# Admin - Kupony
GET    /api/admin/coupons                   -> seznam vsech kuponu
POST   /api/admin/coupons                   -> vytvoreni kuponu
PUT    /api/admin/coupons/:id               -> uprava kuponu
DELETE /api/admin/coupons/:id               -> smazani kuponu
POST   /api/admin/coupons/generate-batch    -> hromadne generovani
GET    /api/admin/coupons/:id/usages        -> historie pouziti kuponu
GET    /api/admin/coupons/export            -> export (CSV/Excel)

# Admin - Promo akce
GET    /api/admin/promotions                -> seznam vsech akci
POST   /api/admin/promotions                -> vytvoreni akce
PUT    /api/admin/promotions/:id            -> uprava akce
DELETE /api/admin/promotions/:id            -> smazani akce

# Admin - Analytika
GET    /api/admin/coupons/analytics         -> dashboard data
GET    /api/admin/coupons/analytics/export  -> export reportu

# Public (widget) - Validace kuponu
POST   /api/public/coupons/validate         -> validace kodu
POST   /api/public/coupons/apply            -> aplikace na objednavku

# Public (widget) - Aktivni promo akce
GET    /api/public/promotions/active        -> aktivni promo akce
```

**POST /api/public/coupons/validate — Request:**
```json
{
  "code": "LETO2025",
  "cart_total": 2450,
  "customer_email": "jan@example.cz",
  "items": [
    { "material_id": "pla", "technology": "fdm", "price": 1200 },
    { "material_id": "pla", "technology": "fdm", "price": 1250 }
  ]
}
```

**Response (success):**
```json
{
  "valid": true,
  "coupon": {
    "code": "LETO2025",
    "discount_type": "percentage",
    "discount_value": 20,
    "maximum_discount": 500
  },
  "discount_amount": 490,
  "message": "Sleva 20% uplatnena (max. 500 Kc)"
}
```

**Response (error):**
```json
{
  "valid": false,
  "error_code": "MINIMUM_NOT_MET",
  "message": "Minimalni hodnota objednavky je 1000 Kc"
}
```

**Chybove kody:**
- `INVALID_CODE` — neplatny kod
- `EXPIRED` — kupon vyprsel
- `NOT_YET_VALID` — kupon jeste neni platny
- `USAGE_LIMIT_REACHED` — vycerpan celkovy limit
- `CUSTOMER_LIMIT_REACHED` — zakaznik uz kupon vyuzil
- `MINIMUM_NOT_MET` — nedosazena minimalni hodnota
- `NOT_APPLICABLE` — nelze aplikovat na polozky v kosiku
- `FIRST_ORDER_ONLY` — pouze pro prvni objednavku
- `NOT_COMBINABLE` — nelze kombinovat s jinym kuponem

### B3. Komponentni strom (React)

```
Admin:
src/pages/admin/
  AdminCoupons.jsx                       -- hlavni admin stranka (taby: Kupony | Promo | Analytika)
  components/coupons/
    CouponList.jsx                       -- tabulka kuponu s filtry a vyhledavanim
    CouponEditor.jsx                     -- formular vytvoreni/editace kuponu
    CouponDetail.jsx                     -- detail kuponu s historiou pouziti
    CouponBatchGenerator.jsx             -- hromadne generovani kuponu
    CouponStatusBadge.jsx                -- badge: aktivni/neaktivni/expirovany/vycerpany
    PromotionList.jsx                    -- seznam promo akci
    PromotionEditor.jsx                  -- formular vytvoreni/editace promo akce
    PromotionTimePicker.jsx              -- vyber casoveho okna (pro flash sale)
    PromotionBannerPreview.jsx           -- nahled promo banneru
    CouponAnalyticsDashboard.jsx         -- dashboard s grafy
    CouponUsageChart.jsx                 -- graf pouziti v case
    CouponROITable.jsx                   -- tabulka ROI analyzy
    CouponExportDialog.jsx               -- dialog pro export CSV/Excel/PDF

Widget/Kalkulacka:
src/pages/test-kalkulacka/components/
  CouponInput.jsx                        -- input pro zadani kuponu + "Uplatnit" tlacitko
  CouponAppliedBadge.jsx                 -- badge "Kupon LETO2025 uplatnen" + Odstranit
  CouponDiscountRow.jsx                  -- radek v rozpisu ceny: "Sleva (LETO2025): -490 Kc"
  PromoBanner.jsx                        -- banner aktivni promo akce s countdown
  PromoCountdown.jsx                     -- odpocet casovace (HH:MM:SS)
  PromoPriceDisplay.jsx                  -- zobrazeni puvodni/zlevnene ceny
```

### B4. Tenant storage namespace

- **Namespace:** `coupons:v1`
- **Helper:** `src/utils/adminCouponsStorage.js` (novy soubor)
- **Pattern:** stejna konvence jako `adminFeesStorage.js` a `adminExpressStorage.js`

**Public API helperu:**
```javascript
// Kupony CRUD
export function loadCouponsConfig()           // nacte cely config vcetne promo
export function saveCouponsConfig(config)      // ulozi normalizovany config
export function getDefaultCouponsConfig()      // vychozi prazdna konfigurace

// Kupony - specificke operace
export function createCoupon(couponData)       // vytvoreni noveho kuponu
export function updateCoupon(id, updates)      // uprava kuponu
export function deleteCoupon(id)               // smazani kuponu
export function toggleCouponActive(id)         // toggle aktivni stav
export function duplicateCoupon(id)            // duplikace kuponu
export function generateBatchCoupons(template, count, prefix)  // hromadne generovani

// Validace
export function validateCoupon(code, cartContext) // validace kuponu vuci podmminkam
export function applyCoupon(code, orderId)        // zaznamenani pouziti

// Promo akce
export function getActivePromotions()             // aktivni promo akce (pro widget)
export function calculatePromoDiscount(promo, cartTotal) // vypocet promo slevy

// Analytika
export function getCouponAnalytics(dateRange)     // dashboard data
export function exportCouponUsages(format)        // export

// Normalizace
export function normalizeCoupon(input)            // normalizace jednoho kuponu
export function normalizePromotion(input)         // normalizace jedne promo akce
```

### B5. Widget integrace (postMessage)

```javascript
// Widget -> Parent (kupon aplikovan)
window.parent.postMessage({
  type: 'MODELPRICER_COUPON_APPLIED',
  payload: {
    code: 'LETO2025',
    discount_type: 'percentage',
    discount_amount: 490,
    message: 'Sleva 20% uplatnena'
  }
}, '*');

// Widget -> Parent (kupon odstranen)
window.parent.postMessage({
  type: 'MODELPRICER_COUPON_REMOVED',
  payload: { code: 'LETO2025' }
}, '*');

// Widget -> Parent (promo akce aktivni)
window.parent.postMessage({
  type: 'MODELPRICER_PROMO_ACTIVE',
  payload: {
    promo_id: 'promo_uuid_1',
    discount_type: 'percentage',
    discount_value: 15,
    banner_text: 'FLASH SALE! 15% sleva',
    ends_at: '2025-06-15T16:00:00Z'
  }
}, '*');
```

### B6. Pricing engine integrace

Kuponova sleva se zaradi do pricing engine pipeline za express a pred markup:

```
base -> fees -> express -> COUPON/PROMO -> markup -> minima -> rounding
```

**Integrace do `calculateOrderQuote()`:**

Vstupni parametry:
```javascript
calculateOrderQuote({
  // ... existujici
  couponCode,          // NOVE — aktivni kupon kod (nebo null)
  couponsConfig,       // NOVE — konfigurace kuponu a promo akci
  customerEmail,       // NOVE — email zakaznika (pro per-customer limity)
})
```

Vystup:
```javascript
return {
  // ... existujici
  coupon: {
    applied: true,
    code: 'LETO2025',
    discount_type: 'percentage',
    discount_value: 20,
    discount_amount: 490,
    maximum_discount: 500,
    message: 'Sleva 20% uplatnena (max. 500 Kc)'
  },
  promo: {
    applied: true,
    promo_id: 'promo_uuid_1',
    discount_type: 'percentage',
    discount_value: 15,
    discount_amount: 180,
    banner_text: 'FLASH SALE! 15% sleva'
  },
  totals: {
    // ... existujici
    couponDiscount: -490,
    promoDiscount: -180,
    subtotalAfterDiscounts: subtotalAfterExpress - 490 - 180,
  },
};
```

**Validacni engine (funkce `validateCouponForCart`):**
```javascript
function validateCouponForCart(coupon, cartContext, couponsConfig) {
  // 1. Overit ze kupon existuje a je aktivni
  // 2. Overit platnost (valid_from, valid_until)
  // 3. Overit celkovy limit pouziti
  // 4. Overit per-customer limit
  // 5. Overit minimalni hodnotu objednavky
  // 6. Overit applicable items (materialy, technologie)
  // 7. Overit first_order_only
  // 8. Overit combinable (pokud uz je jiny kupon)
  // Vratit { valid: true/false, error_code, message, discount_amount }
}
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-mid-storage-tenant` | Vytvoreni `adminCouponsStorage.js` | `src/utils/adminCouponsStorage.js` | P0 |
| `mp-mid-pricing-discounts` | Kupon validacni engine + pricing integrace | `src/lib/pricing/couponEngine.js`, `pricingEngineV3.js` | P0 |
| `mp-mid-frontend-admin` | Admin stranka Kupony (layout, routing, taby) | `src/pages/admin/AdminCoupons.jsx`, `src/Routes.jsx` | P0 |
| `mp-spec-fe-forms` | CouponEditor, PromotionEditor formulare | `src/pages/admin/components/coupons/CouponEditor.jsx`, `PromotionEditor.jsx` | P1 |
| `mp-spec-fe-tables` | CouponList, PromotionList tabulky | `src/pages/admin/components/coupons/CouponList.jsx`, `PromotionList.jsx` | P1 |
| `mp-spec-fe-charts` | CouponAnalyticsDashboard, CouponUsageChart | `src/pages/admin/components/coupons/CouponAnalyticsDashboard.jsx` | P2 |
| `mp-mid-frontend-widget` | CouponInput, CouponAppliedBadge v kalkulacce | `src/pages/test-kalkulacka/components/CouponInput.jsx` | P1 |
| `mp-spec-fe-checkout` | PromoBanner, PromoCountdown | `src/pages/test-kalkulacka/components/PromoBanner.jsx` | P1 |
| `mp-spec-pricing-coupons` | Logika pro batch generovani, export | `src/utils/adminCouponsStorage.js` | P1 |
| `mp-spec-fe-routing` | Pridani `/admin/coupons` route | `src/Routes.jsx` | P0 |
| `mp-mid-quality-code` | Code review | * | P0 (gate) |
| `mp-spec-test-unit` | Unit testy validace, storage, pricing | `src/__tests__/` | P1 |
| `mp-spec-test-e2e` | E2E testy admin + widget flow | `tests/e2e/` | P2 |

### C2. Implementacni kroky (poradi)

```
FAZE 1 — Zaklad (storage + validacni engine)
  1.1 [mp-mid-storage-tenant] adminCouponsStorage.js
      - CRUD operace pro kupony a promo akce
      - Normalizace, default config
      - Seed: 2 demo kupony (DEMO10 = 10%, WELCOME = 15% first order)
      Zavislost: zadna

  1.2 [mp-mid-pricing-discounts] couponEngine.js
      - validateCouponForCart() — vsechny validacni kroky
      - calculateCouponDiscount() — vypocet castky slevy
      - calculatePromoDiscount() — vypocet promo slevy
      - getActivePromotions() — aktivni promo akce v danem case
      Zavislost: 1.1

  1.3 [mp-mid-pricing-engine] Integrace do pricingEngineV3.js
      - Pridat couponCode, couponsConfig, customerEmail parametry
      - Zaradit coupon/promo do pipeline
      - Pridat coupon/promo info do vystupu
      Zavislost: 1.2

FAZE 2 — Admin UI
  2.1 [mp-spec-fe-routing] /admin/coupons route
      Zavislost: zadna

  2.2 [mp-mid-frontend-admin] AdminCoupons.jsx
      - 3 taby: Kupony | Promo akce | Analytika
      - Napojeni na adminCouponsStorage
      Zavislost: 1.1, 2.1

  2.3 [mp-spec-fe-forms] CouponEditor.jsx
      - Formular: kod, nazev, popis, typ slevy, hodnota, limity, platnost, applies_to
      - Auto-generate kodu
      - Validace vsech poli
      Zavislost: 2.2

  2.4 [mp-spec-fe-tables] CouponList.jsx
      - Tabulka s filtry (status, typ, datum)
      - Vyhledavani podle kodu/nazvu
      - Akce: Upravit, Duplikovat, Deaktivovat, Smazat
      - Status badge (aktivni/neaktivni/expirovany/vycerpany)
      Zavislost: 2.2

  2.5 [mp-spec-fe-forms] PromotionEditor.jsx
      - Typ akce, casove okno, discount, applies_to, banner konfigurace
      Zavislost: 2.2

  2.6 [mp-spec-fe-tables] PromotionList.jsx
      - Tabulka promo akci s vizualni indikaci stavu
      Zavislost: 2.2

  2.7 [mp-spec-fe-forms] CouponBatchGenerator.jsx
      - Prefix, pocet, sablona, generovani, export CSV
      Zavislost: 2.2

FAZE 3 — Widget/Kalkulacka
  3.1 [mp-mid-frontend-widget] CouponInput.jsx
      - Input pole + "Uplatnit" tlacitko
      - Real-time validace (po submit)
      - Chybove hlasky (presne, uzivatelsky privetivy)
      Zavislost: 1.2

  3.2 [mp-mid-frontend-widget] CouponAppliedBadge.jsx + CouponDiscountRow.jsx
      - Badge s kodem a slevou
      - Radek v rozpisu ceny
      Zavislost: 3.1

  3.3 [mp-spec-fe-checkout] PromoBanner.jsx + PromoCountdown.jsx
      - Banner aktivni akce
      - Countdown timer (pro flash sale)
      - Auto-refresh pri vyprseni
      Zavislost: 1.2

  3.4 [mp-spec-fe-checkout] PromoPriceDisplay.jsx
      - Puvodni cena (preskrtnuta) + zlevnena cena
      Zavislost: 3.3

FAZE 4 — Analytika
  4.1 [mp-spec-fe-charts] CouponAnalyticsDashboard.jsx
      - Metriky: celkove pouziti, celkova sleva, prumerna sleva, conversion rate
      - Graf pouziti v case (denni/tydenni/mesicni)
      Zavislost: 1.1

  4.2 [mp-spec-fe-tables] CouponROITable.jsx + CouponExportDialog.jsx
      - ROI analyza per kupon
      - Export CSV/Excel
      Zavislost: 4.1

FAZE 5 — Quality gates
  5.1 [mp-mid-quality-code] Code review
  5.2 [mp-spec-test-unit] Unit testy
  5.3 [mp-spec-test-build] Build verification
  5.4 [mp-spec-test-e2e] E2E testy
```

### C3. Kriticke rozhodovaci body

1. **Kde pocitat kupon — client nebo server?** Pro Variantu A (localStorage): client-side. Pro backend: server-side (bezpecne). Rozhodnuti: client-side s pripravenym rozhranim pro server validaci.

2. **Mohou se kupony kombinovat s promo akcemi?** Rozhodnuti: DEFAULT ne. Admin muze explicitne povolit (`combinable: true` na kuponu a `stackable: true` na promo akci). Pokud neni kombinovatelne, kupon ma prednost (zakaznik aktivne zadal).

3. **Poradi aplikace vice slev?** Rozhodnuti:
   - Nejdriv promo akce (automaticke, nizsi priorita)
   - Potom kupon (explicitni, vyssi priorita)
   - Pokud nejsou kombinovatelne, pouzij tu s vetsi slevou

4. **Jak resit kupon exspiraci v localStorage?** Rozhodnuti: Validacni engine kontroluje `valid_until` pri kazde validaci. Expirovany kupon zustane v storage (pro analytiku) ale nelze pouzit.

5. **Batch generovani — format kodu?** Rozhodnuti: `{PREFIX}-{RANDOM}` kde RANDOM je 6-8 alfanumerickych znaku (A-Z0-9). Priklad: `LETO-A7X9K2`.

### C4. Testovaci strategie

**Unit testy (couponEngine.test.js):**
- Validace vsech error kodu (INVALID_CODE, EXPIRED, NOT_YET_VALID, atd.)
- Percentage sleva s maximum_discount
- Fixed amount sleva (nesmi byt vetsi nez objednavka)
- Free shipping logika
- Free postprocessing logika
- Per-customer limit tracking
- Kombinovatelnost kuponu + promo
- Promo akce casove okno (mock Date)
- Flash sale countdown

**Unit testy (adminCouponsStorage.test.js):**
- CRUD operace
- Normalizace vstupnich dat
- Batch generovani (unikatni kody)
- Export format
- Edge cases: prazdny kod, negativni discount_value, invalid dates

**E2E testy:**
- Admin: vytvoreni kuponu, overeni v seznamu, editace, smazani
- Admin: batch generovani 10 kuponu, overeni v seznamu
- Admin: vytvoreni flash sale promo, overeni banneru v kalkulacce
- Kalkulacka: zadani platneho kodu, overeni slevy v cene
- Kalkulacka: zadani neplatneho kodu, overeni chybove hlasky
- Kalkulacka: pouziti kuponu s min. objednavkou (pod/nad limitem)

**Edge cases:**
- Kupon s kode obsahujicim specialni znaky
- Dva zakaznici pouziji posledni dostupny kupon soucasne (race condition — pro backend)
- Promo akce s prekryvajicim se casovym oknem
- Objednavka presne na minimum_order_value
- discount_value > 100 u percentage
- Prazdny kosik s kuponem

### C5. Migrace existujicich dat

**Neni potreba migrace** — `coupons:v1` je novy namespace.

**Zpetna kompatibilita:**
- `calculateOrderQuote()` musi fungovat bez kuponovych parametru
- Existujici objednavky nemaji `coupon_snapshot` — zobrazit jako "bez kuponu"
- Analyticka data se zacnou sbirat od nasazeni (historicke nejsou k dispozici)

---

## D. KVALITA

### D1. Security review body

- **Kupon kod brute-force:** Rate limiting na validacni endpoint (max 10 pokusu/min z jedne IP)
- **Kupon kod predviddatelnost:** Auto-generovane kody musi pouzivat `crypto.randomUUID()` nebo cryptographically secure random
- **Client-side validace:** V producnim prostredi VZDY revalidovat na serveru (client je neduveryhodny)
- **XSS:** Kupon nazev, popis, banner text — escape HTML
- **Manipulace s localStorage:** V prod prostredi nesmi byt localStorage zdrojem pravdy pro kupony (uzivatele mohou localStorage upravovat)
- **Tenant izolace:** Kupony jsou scoped na tenant — nelze pouzit kupon z jineho tenantu
- **Audit trail:** Kazde pouziti kuponu logovat (kdo, kdy, kolik)

### D2. Performance budget

- **Kupon validace:** < 10ms (lookup v poli + kontrola podminek)
- **Promo akce kontrola:** < 5ms (iterace aktivnich promo akci)
- **CouponList render:** < 100ms pro 200 kuponu (virtualizovany seznam pokud >50)
- **Countdown timer:** requestAnimationFrame, ne setInterval (plynulejsi animace)
- **Analytics dashboard:** < 500ms pro vypocet z 1000 usage zaznamu
- **Batch generovani:** < 1s pro 100 kuponu

### D3. Accessibility pozadavky

- **CouponInput:** `aria-describedby` pro chybovou hlasku, `aria-invalid` pri chybe
- **CouponAppliedBadge:** `role="status"` pro screen reader oznameni
- **PromoBanner:** `role="alert"` s `aria-live="polite"` (ne assertive — neni kriticke)
- **PromoCountdown:** Screen reader cte zbyvajici cas kazdych 30 sekund (ne kazdou sekundu)
- **CouponStatusBadge:** Barevna indikace + text (ne jen barva)
- **Formulare:** Vsechny inputy maji `label`, povinne pole maji `aria-required`

### D4. Error handling a edge cases

- **Neplatny kupon:** Zobrazit presnou chybovou hlasku (ne generickou "Neplatny kupon")
- **Expirovany kupon:** "Tento kupon vyprsel 30.6.2025"
- **Vycerpany kupon:** "Tento kupon byl jiz vycerpan"
- **Promo akce koliduje s kuponem:** Informovat zakaznika o duvodu (dialog)
- **localStorage plny:** Graceful fail — kupony funguji ale pouziti se neloguje
- **Nevalidni datum v JSON:** Fallback na aktualni cas
- **Prazdny kosik:** Kupon nelze aplikovat — "Nejdriv pridejte polozky"
- **Offline stav:** Kupony vyhodnocovat lokalne, synchronizovat pri reconnectu

### D5. i18n pozadavky

- Vsechny systmove texty i18n-ready (cs.json, en.json)
- Kupon kod je vzdy UPPERCASE (nezavisle na locale)
- Castky v lokalni mene s `Intl.NumberFormat`
- Datumy v lokalnim formatu (`dd.MM.yyyy` cs, `MM/dd/yyyy` en)
- Chybove hlasky prekladat cele (ne skladat z casti)
- Banner text je admin-definovany (neni treba prekladat, admin ho pise v jazyce targetu)

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

```javascript
const FEATURE_FLAGS = {
  coupons_enabled: true,           // celkovy toggle
  promotions_enabled: true,        // promo akce toggle
  batch_generate_enabled: true,    // hromadne generovani
  coupon_analytics_enabled: true,  // analyticka dashboard
  promo_banner_enabled: true,      // promo banner v kalkulacce
};
```

**Postupne nasazeni:**
1. **Faze A:** Kuponovy system — admin CRUD + validace + widget CouponInput
2. **Faze B:** Promo akce — admin CRUD + PromoBanner + countdown
3. **Faze C:** Batch generovani + export
4. **Faze D:** Analyticky dashboard

### E2. Admin UI zmeny

- **Nova polozka v sidebar:** "Marketing" s podpolozkama "Kupony" a "Promo akce" (ikona: Tag/Gift)
- **AdminCoupons.jsx:** 3 taby — Kupony, Promo akce, Analytika
- **AdminOrders.jsx:** Zobrazit kuponovou slevu u objednavek
- **AdminDashboard.jsx:** Widget "Aktivni kupony" a "Probihajici promo akce"

### E3. Widget zmeny

- **CouponInput:** Novy UI blok "Mate slevovy kod?" v checkout kroku
- **CouponAppliedBadge:** Badge po uspesnem uplatneni
- **CouponDiscountRow:** Novy radek v rozpisu ceny: "Sleva (KOD): -XXX Kc"
- **PromoBanner:** Stiky banner nahoze s akci a odpoctem
- **PromoPriceDisplay:** Puvodni cena preskrtnuta + nova cena zvyraznena

### E4. Dokumentace pro uzivatele

- **Admin guide:** "Jak vytvorit slevovy kupon" — krok za krokem
- **Admin guide:** "Jak nastavit promo akci" — typy, casove okna, banner
- **Admin guide:** "Hromadne generovani kuponu pro kampan" — batch, export, distribuce
- **FAQ:** "Proč mi kupon nefunguje?" — troubleshooting pro zakazniky
- **Tooltip texty:** Na kazdem poli v editorech

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Kupon usage rate | > 20% objednavek s kuponem | pouziti / celkove objednavky |
| Prumerna sleva | < 15% z objednavky | prumerna discount_amount / order_total |
| Conversion uplift | > 10% zvyseni konverze | A/B test s/bez kuponoveho systemu |
| Promo akce engagement | > 30% kliknuti na banner | banner_views / banner_clicks |
| First-order kupon conversion | > 25% novych zakazniku | first_order_coupon_used / new_customers |
| ROI kuponu | > 3x | revenue_from_coupon_orders / total_discount_given |
| Admin adoption | > 60% tenantu vytvori alespon 1 kupon | tenants_with_coupons / total_tenants |
