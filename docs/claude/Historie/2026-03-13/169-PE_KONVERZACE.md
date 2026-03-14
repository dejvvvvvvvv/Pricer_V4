# 169-PE — KONVERZACE — Pricing Engine & Checkout Fixes — 2026-03-13

## Metadata
- **ID:** 169-PE
- **Session:** S28
- **Datum:** 2026-03-13
- **Oblast:** Pricing Engine + Checkout System
- **Souvisejici ID:** 170-CO

---

## Tema session

Vlna 8: Opravy kritických P1 bugů v pricing engine (displayTotal, fees, per-color pricing, per_cm3 guard) a checkout formuláře (Math.random, i18n, validace).

---

## Prubeh konverzace

### [1] Uzivatel
> Vlna 8 — Pricing Engine P1 bugy:
> 1. displayTotal oprava — quote.simple.grandTotal → quote.grandTotal (zahrnuje shipping)
> 2. ORDER fees supports_enabled — přidán alias v modelCtxById
> 3. Per-color ceny — getMaterialPricePerGram rozšířena o colorKey parametr, calcBase předává cfg.color
> 4. per_cm3 guard — guard na nulový volume (MODEL i ORDER scope)
>
> Vlna 8 — Checkout fixes:
> 5. Math.random → crypto.randomUUID v generateOrderNumber
> 6. ShippingSelector i18n — useLanguage hook, všechny texty přeloženy CZ/EN
> 7. ExpressTierSelector i18n — useLanguage hook, všechny texty přeloženy CZ/EN
> 8. checkoutSchema IČO — regex rozšířen na alfanumerický 5-15 znaků (mezinárodní)

### [1] Claude
**Shrnuti odpovedi:**
- Potvrzení všech 8 bugfixů (P1 priorita)
- displayTotal oprava: quote.grandTotal už zahrnuje shipping, stará logika duplikovala shipping
- fees supports_enabled: alias v modelCtxById zvyšuje robustnost fallback chain
- Per-color pricing: getMaterialPricePerGram teď parametrizovatelná, calcBase() předává cfg.color
- per_cm3 guard: ochrana před dělením nulou v počítačích volume
- Math.random → crypto.randomUUID: zvýšení bezpečnosti (ID generace)
- i18n v ShippingSelector + ExpressTierSelector: useLanguage hook, všechny texty CZ/EN
- checkoutSchema IČO regex: rozšíření 8 znaků → 5-15 alfanumerických (mezinárodní soulad)

**Akce provedene:**
- Oprava pricingEngineV3.js (displayTotal, fees supports_enabled, per-color pricing, per_cm3 guard)
- Oprava CheckoutForm.js (Math.random → crypto.randomUUID)
- i18n ShippingSelector.jsx (useLanguage hook)
- i18n ExpressTierSelector.jsx (useLanguage hook)
- Aktualizace checkoutSchema.js (IČO regex)

**Soubory zminene:**
- `src/lib/pricing/pricingEngineV3.js`
- `src/components/checkout/CheckoutForm.jsx`
- `src/components/checkout/ShippingSelector.jsx`
- `src/components/checkout/ExpressTierSelector.jsx`
- `src/lib/validation/checkoutSchema.js`

---

### [2] Uzivatel
> Research — 3D Print Kalkulačky:
> - Analyzováno 6 konkurenčních služeb (Prusa, MakerShop, 3D HQ, OmniCalc, 3D Orders, Reddit community)
> - Naše competitive advantages: cloud slicing, multi-model, widget embed, checkout flow, volume discounts
> - Inspirace: educational tooltips, PDF quote branding, material library export

### [2] Claude
**Shrnuti odpovedi:**
- Competitive analysis: 6 služeb analyzováno
- Klíčové konkurenční výhody: cloud slicing, multi-model support, widget embedability, integrovaný checkout, volume discounts
- Inspirace z konkurence: educational tooltips, PDF quote s brandingem, material library export
- Doporučení: prioritizovat tooltips v kalkulačce (user education) a PDF branding pro upsell
- Poznámka: Research archivován pro budoucí product roadmap

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | displayTotal oprava: quote.grandTotal místo quote.simple.grandTotal | Shipping je součást grandTotal, duplikace byla bug | Claude |
| 2 | fees supports_enabled alias přidán | Robustnější fallback chain, snižuje chyby | Claude |
| 3 | Per-color ceny: getMaterialPricePerGram(colorKey) | Podpora variant cen dle barvy materiálu | Claude |
| 4 | per_cm3 guard: volume === 0 check | Prevence dělení nulou v edge cases | Claude |
| 5 | Math.random → crypto.randomUUID | Security best practice, lepší entropie | Claude |
| 6 | ShippingSelector i18n | User experience, CZ/EN texty | Claude |
| 7 | ExpressTierSelector i18n | User experience, CZ/EN texty | Claude |
| 8 | IČO regex: 5-15 alfanumerických znaků | Mezinárodní soulad (ne jen CZ 8 číslic) | Claude |

---

## Otevrene otazky

- [ ] PDF quote branding — bude součástí budoucího sprintu (research archivován)
- [ ] Educational tooltips — priorita pro UX improvement v další vlně

---

## Navaznost

- **Predchozi:** 168-GN (P1 Bugs Wave 6 + Utilities Wave 7)
- **Nasledujici:** 170-CO (Checkout UPRAVY detail)

---

<!-- KONEC SABLONY -->
