# KD-7 + KD-8 — Preview API a Verzovani

> **Zdroj:** Extrahovano z `3_PricingEngineV3_RoadMap_Plan.md` sekce KD-7, KD-8
> **Ucel:** Admin preview wrapper + verzovaci strategie pro objednavky
> **Odhad:** 6 hodin (KD-7: 3h + KD-8: 3h)
> **Zavislosti:** KD-2 (signatury), KD-6 (determinismus)
> **Priorita:** STREDNI

---

## KD-7: Pricing Preview API pro admin sandbox

### Problem
`AdminPricing.jsx` (tab 5) primo importuje `calculateOrderQuote` a vola ho s mock daty.
Neni definovany jasny "preview mode" kontrakt — admin mohou zadat neuplne vstupy.

### Reseni: Wrapper funkce

**Novy soubor:** `src/lib/pricing/pricingPreview.js`

```javascript
import { calculateOrderQuote } from './pricingEngineV3.js';

// Mock file builder — vytvori objekt kompatibilni s engine vstupem
export function buildMockFile({
  filamentGrams = 50,
  estimatedTimeSeconds = 7200,
  volumeMm3 = 15000,
  surfaceMm2 = 8000,
  name = 'preview-model.stl'
} = {}) {
  return {
    id: `preview-${Date.now()}`,
    name,
    status: 'done',
    result: {
      metrics: { estimatedTimeSeconds, filamentGrams },
      modelInfo: { volumeMm3, sizeMm: { x: 50, y: 50, z: 50 }, surfaceMm2 }
    }
  };
}

// Preview wrapper — zjednodusene API pro admin
export function calculatePricingPreview({
  mockFiles,        // Array z buildMockFile()
  printConfigs,     // Record<fileId, {material, quality, quantity}>
  pricingConfig,    // PricingConfigV3
  feesConfig,       // {fees: [...]}
  feeSelections,    // volitelne
}) {
  return calculateOrderQuote({
    uploadedFiles: mockFiles,
    printConfigs,
    pricingConfig,
    feesConfig,
    feeSelections,
    // Express, shipping, coupon se v preview nepouzivaji (nebo volitelne)
  });
}
```

### Akce:
- [ ] Vytvorit `pricingPreview.js` s `buildMockFile` a `calculatePricingPreview`
- [ ] Refaktorovat `AdminPricing.jsx` tab 5 aby pouzival wrapper misto primeho importu
- [ ] Pridat moznost zapnout express/shipping/coupon v preview (volitelne)

---

## KD-8: Verzovaci strategie

### Scenare ktere resi:
1. Zakaznik vidi 500 Kc, objedna. Admin mezitim zmeni fees. → Ma platit 500 nebo nova cena?
2. Zakaznik se vrati po 2 dnech s odkazem na nabidku. → Ma stat porad 500?

### Ukol KD-8.1: Quote snapshot pri objednavce

**Princip:** V okamziku objednavky se ulozi kompletni `OrderQuoteResult`.

**Co udelat:**
- [ ] Pri vytvoreni objednavky ulozit celý `calculateOrderQuote` vystup do objednavky
- [ ] Objednavka ma field `pricingSnapshot: OrderQuoteResult`
- [ ] Tato cena se pouzije pro platbu
- [ ] V admin orders zobrazit "cena v okamziku objednavky" i "aktualni cena" (pro porovnani)

**Poznamka:** Implementace zavisi na tom jak funguje order system — viz otazka #7 v `CO_POTREBUJI_OD_UZIVATELE.md`.

### Ukol KD-8.2: Config versioning (odlozeno na Supabase)

V localStorage fazi nema smysl — pockat na Supabase kde je audit log prirozeny.

### Ukol KD-8.3: Pipeline verze identifikator

**Co udelat:**
- [ ] Pridat konstantu `ENGINE_VERSION = 'v3.1.0'` do enginu
- [ ] Pridat `engineVersion` field do navratoveho objektu
- [ ] Pri breaking change inkrementovat
- [ ] Objednavky ukladaji `engineVersion` pro audit trail

**Implementace:**
```javascript
// Na zacatku pricingEngineV3.js:
export const ENGINE_VERSION = 'v3.1.0';

// V calculateOrderQuote navratovem objektu:
return {
  ...existujici,
  engineVersion: ENGINE_VERSION,
};
```

**Odhad:** 15 minut
