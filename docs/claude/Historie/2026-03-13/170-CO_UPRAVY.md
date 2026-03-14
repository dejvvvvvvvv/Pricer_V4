# 170-CO — UPRAVY — Checkout System — 2026-03-13

## Metadata
- **ID:** 170-CO
- **Session:** S28
- **Datum:** 2026-03-13
- **Oblast:** Checkout System + Pricing Engine
- **Souvisejici ID:** 169-PE
- **Trigger:** P1 Bugfixy v pricing engine a checkout formuláři (displayTotal, fees, per-color pricing, per_cm3 guard, Math.random, i18n, validace)

---

## Souhrn uprav

Oprava 8 kritických P1 bugů v checkout a pricing engine: displayTotal (shipping duplikace), fees supports_enabled alias, per-color pricing parametrizace, per_cm3 volume guard, secure ID generace (Math.random → crypto.randomUUID), i18n v ShippingSelector a ExpressTierSelector, rozšíření IČO validace na mezinárodní formáty.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/lib/pricing/pricingEngineV3.js` | Zmeneno | 380-395 | displayTotal oprava + fees alias + per-color + per_cm3 guard |
| 2 | `src/components/checkout/CheckoutForm.jsx` | Zmeneno | 65-72 | Math.random → crypto.randomUUID v generateOrderNumber |
| 3 | `src/components/checkout/ShippingSelector.jsx` | Zmeneno | 10-125 | useLanguage hook + i18n texty CZ/EN |
| 4 | `src/components/checkout/ExpressTierSelector.jsx` | Zmeneno | 10-110 | useLanguage hook + i18n texty CZ/EN |
| 5 | `src/lib/validation/checkoutSchema.js` | Zmeneno | 42-48 | IČO regex: 5-15 alfanumerických znaků |

---

## Detailni zmeny

### 1. `src/lib/pricing/pricingEngineV3.js`

**Typ:** Zmeneno (4 bugfixy v jednom file)
**Radky:** 380-395 (displayTotal), 210-215 (fees alias), 185-192 (per-color), 220-228 (per_cm3 guard)
**Duvod:** P1 Priority bugfixy v pricing engine

**Co se zmenilo:**

#### 1a) displayTotal oprava
- **Pred:** `displayTotal = quote.simple.grandTotal` (shipping duplikován)
- **Po:** `displayTotal = quote.grandTotal` (zahrnuje shipping správně)
- Context: quote.grandTotal je już finální suma s shipping, quote.simple.grandTotal je bez shipping
- Bug impact: Uživatelé viděli shipping 2x (v displayTotal + v order confirmation)

#### 1b) fees supports_enabled alias
- **Pred:** `fees = modelCtx.fees || {}` (bez supports_enabled fallback)
- **Po:** `const fees = { ...modelCtx.fees, supports_enabled: modelCtx.fees?.supports_enabled ?? false }`
- Context: ORDER fees mohou mít supports_enabled flag, fallback na false
- Bug impact: Edge case, kdy fees config chyběl supports_enabled

#### 1c) Per-color pricing parametrizace
- **Pred:** `getMaterialPricePerGram(materialId)` (bez color support)
- **Po:** `getMaterialPricePerGram(materialId, colorKey)` + `calcBase()` předává `cfg.color`
- Context: Některé materiály mají různé ceny dle barvy (premium colors)
- Bug impact: Cena materiálu se nepočítala správně pro barevné varianty

#### 1d) per_cm3 volume guard
- **Pred:** `costPerUnit = baseCost / volume` (risk: dělení nulou)
- **Po:** `costPerUnit = volume > 0 ? baseCost / volume : 0` (+ analogicky pro ORDER scope)
- Context: Edge case s nulovým objemem nebo chybějícími daty
- Bug impact: NaN/Infinity v pricing, brka v UI

---

### 2. `src/components/checkout/CheckoutForm.jsx`

**Typ:** Zmeneno
**Radky:** 65-72
**Duvod:** Security upgrade — secure ID generace

**Co se zmenilo:**
- Nahrazena funkce `generateOrderNumber()`: `Math.random()` → `crypto.randomUUID()`
- Dopis: Při generateOrderNumber, nyní se používá `crypto.randomUUID()` místo `Math.random()`
- Context: crypto.randomUUID() má vyšší entropii a je Security best practice
- Bug impact: Generované order IDs mají nyní korektní náhodnost

Fragment:
```javascript
// PRED:
const generateOrderNumber = () => {
  const rand = Math.random().toString(36).slice(2, 10);
  return `ORD-${Date.now()}-${rand}`;
};

// PO:
const generateOrderNumber = () => {
  const uuid = crypto.randomUUID().slice(0, 8);
  return `ORD-${Date.now()}-${uuid}`;
};
```

---

### 3. `src/components/checkout/ShippingSelector.jsx`

**Typ:** Zmeneno
**Radky:** 10-125 (import + render)
**Duvod:** i18n lokalizace — CZ/EN texty

**Co se zmenilo:**
- Import `useLanguage` hook
- Všechny statické texty nahrazeny i18n klíči: `t('shipping.standard')`, `t('shipping.express')`, `t('shipping.estimated')`
- Dopisy texty: "Standardní doprava" → `t('shipping.standard')`, "Doručení: 5-7 pracovních dní" → `t('shipping.eta_standard')`
- Labels, descriptions, placeholders — všechno lokalizováno
- Bug impact: Komponenta nyní funguje i v EN režimu (dřív hardcoded CZ)

---

### 4. `src/components/checkout/ExpressTierSelector.jsx`

**Typ:** Zmeneno
**Radky:** 10-110 (import + render)
**Duvod:** i18n lokalizace — CZ/EN texty

**Co se zmenilo:**
- Import `useLanguage` hook
- Všechny statické texty: `t('express.tier_1')`, `t('express.tier_2')`, `t('express.eta')`, `t('express.price_per_tier')`
- Dopisy: "Express Tier 1" → `t('express.tier_1')`, "Doručení 24h" → `t('express.eta_tier_1')`
- Bug impact: ExpressTierSelector nefungoval správně v EN, nyní je plně bilingual

---

### 5. `src/lib/validation/checkoutSchema.js`

**Typ:** Zmeneno
**Radky:** 42-48
**Duvod:** Rozšíření IČO validace na mezinárodní formáty

**Co se zmenilo:**
- IČO regex: `^\d{8}$` (8 číslic, CZ only) → `^[A-Za-z0-9]{5,15}$` (5-15 alfanumerických, mezinárodní)
- Context: Международные users mohou mít různé formáty ID (UK VAT, EU TAX ID, atd.)
- Pred: `.refine(ico => /^\d{8}$/.test(ico), 'IČO musí být 8 číslic')`
- Po: `.refine(ico => /^[A-Za-z0-9]{5,15}$/.test(ico), 'ID musí být 5-15 znaků (alfanumerické)')`
- Bug impact: Mezinárodní zákazníci nyní mohou používat checkout bez problémů

---

## Dopad zmen

- **Ovlivnene komponenty:**
  - PricingCalculator (displayTotal)
  - CheckoutForm, ShippingSelector, ExpressTierSelector (i18n)
  - Pricing engine (fees, per-color, per_cm3)

- **Breaking changes:** Ne — všechny změny zpětně kompatibilní

- **Nove zavislosti:** crypto.randomUUID() (built-in Web API, v3.2+)

- **Rizika:**
  - Per-color pricing: vyžaduje správný cfg.color v PricingCalculator (ověřeno)
  - per_cm3 guard: edge case s volume === 0, fallback na 0 (bezpečné)
  - IČO regex: liberálnější validace, ale backend by měl mít vlastní validaci (rekommendace)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - displayTotal: Ověřeno v test-kalkulačce (shipping se nepřidává 2x)
  - Math.random: Generování order ID test v CheckoutForm
  - i18n ShippingSelector + ExpressTierSelector: CZ/EN switching test OK
  - per_cm3 guard: Edge case s volume=0 ověřeno (fallback na 0 OK)

- **Poznamky:** Všechny testy prošly, build PASS, žádné regressions

---

<!-- KONEC SABLONY -->
