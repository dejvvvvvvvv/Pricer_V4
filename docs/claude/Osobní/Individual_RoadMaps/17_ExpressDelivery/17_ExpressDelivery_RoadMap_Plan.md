# 17. Express Delivery — Detailni RoadMap Plan

> **Stav:** 🟡 40% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** Kalkulacka (#1) pro integraci do UI
> **Kdo na nem zavisi:** Checkout (#1.6), Pricing Engine (#3)

---

## Prehled

System pro express/zrychlenou dodavku. Admin cast (konfigurace express tiers) je HOTOVA. Chybi integrace do kalkulacky UI — stejny pattern jako u Shipping (#16).

**Admin soubor:** `src/pages/admin/AdminExpress.jsx` (~663 radku)
**Storage:** `src/utils/adminExpressStorage.js`
**UI komponenta:** `src/pages/test-kalkulacka/components/ExpressTierSelector.jsx`

---

## Co je HOTOVO (✅)

### Admin konfigurace (85%)
- [x] AdminExpress.jsx — plne funkcni stranka
- [x] CRUD express tiers (pridani, editace, smazani)
- [x] Nazev tieru (Standard, Express, Rush)
- [x] Surcharge — procentualni (+20%) NEBO fixni castka (+150 Kc)
- [x] Razeni tiers
- [x] Active/inactive toggle
- [x] Persist do tenant storage

### UI komponenta (70%)
- [x] ExpressTierSelector.jsx existuje a je funkcni
- [x] Zobrazeni dostupnych tiers s cenami
- [x] Vyber tieru

### Pricing Engine (75%)
- [x] Express surcharge vypocet v `pricingEngineV3.js`
- [x] Podpora procento i fixni castka

---

## Co CHYBI / je potreba dodelat

### Faze 1: Integrace do kalkulacky (Priorita: VYSOKA)

> **SPOLECNA FAZE s Kalkulackou (#1), Shipping (#16) a Kupony (#18)**

#### Ukol 1.1: Renderovat ExpressTierSelector v kalkulacce
- **Soubor:** `src/pages/test-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Pridat `<ExpressTierSelector ... />` v kroku 3 (vedle ShippingSelector)
  - [ ] Propsy:
    - `expressTiers` — seznam tiers z admin storage
    - `selectedTier` — aktualne vybrany tier
    - `onTierChange` — handler pro zmenu
    - `orderSubtotal` — pro vypocet surcharge
  - [ ] State pro `selectedExpressTier` — overit jestli uz existuje v index.jsx
  - [ ] Propojit s pricing engine

#### Ukol 1.2: Zobrazit express surcharge v price breakdown
- **Co udelat:**
  - [ ] Pridat radek "Express (+20%): +104 Kc" do cenoveho prehledu
  - [ ] Zobrazit nazev tieru
  - [ ] Vizualne odlisit

#### Ukol 1.3: Widget integrace
- **Soubor:** `src/pages/widget-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Stejna integrace jako v test-kalkulacce
  - [ ] CSS vars styling

### Faze 2: Delivery time odhad (Priorita: NIZKA, post-Beta)

#### Ukol 2.1: Zobrazeni odhadovaneho casu dodani
- **Co udelat:**
  - [ ] Pridat pole "delivery_days" ke kazdemu tieru v admin
  - [ ] Zobrazit v kalkulacce "Dodani do 2-3 dnu" vs "Express: zitra"
  - [ ] Vypocet odhadu vcetne vikendu
- **Poznamka:** Pro Beta neni nutne

---

## Implementacni poradi

1. **Faze 1** (Integrace) — 1-2 hodiny, SPOLECNE s #1, #16, #18
2. **Faze 2** (Delivery time) — post-Beta

**Celkem pro Beta:** ~1-2 hodiny

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/test-kalkulacka/index.jsx` | Render ExpressTierSelector | Maly |
| `src/pages/widget-kalkulacka/index.jsx` | Render ExpressTierSelector | Maly |
| Price summary komponenta | Pridat express radek | Maly |

---

## Poznamky

- Identicky pattern jako Shipping — komponenta existuje, staci zapojit
- Express surcharge uz je v pricing engine — staci propojit
- Pro Beta: Standard + Express staci (2 tiers)

---

## Kriticke doplnky (z review)

### Delivery time odhad — algoritmus
- [ ] Kazdy tier ma `delivery_days_min` a `delivery_days_max` (napr. Standard: 5-7, Express: 2-3, Rush: 1)
- [ ] Vypocet s vikendy: pricist jen pracovni dny
- [ ] Zobrazeni: "Odhadovane doruceni: 20.-22. unora 2026"
- [ ] Konfigurovatelne v admin per-tier
- [ ] Firma muze nastavit "cutoff time" — objednavky po 14:00 se pocitaji jako dalsi den

### Express surcharge — poradi v pipeline
- [ ] Pipeline: base → fees → markup → volume_discount → **express** → shipping → coupon → minima → rounding
- [ ] Express surcharge se pocita z `subtotal_after_volume_discount`:
  - Procento: `subtotal * (express_pct / 100)`
  - Fixni: `express_fixed_amount`
- [ ] Express surcharge se NEZAPOCITAVA do free shipping thresholdu
- [ ] Express surcharge se ZAPOCITAVA do coupon base (kupon muze snizit i express)
