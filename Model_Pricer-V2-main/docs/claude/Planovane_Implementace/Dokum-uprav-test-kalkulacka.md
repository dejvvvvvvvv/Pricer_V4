# Dokumentace uprav test-kalkulacky

> Kazda zmena v `/src/pages/test-kalkulacka/*` MUSI byt zaznamenana zde.
> Format: soubor, co se zmenilo, proc, datum.

---

## Phase 1 (S01 + S02 + S05)

### S01 - Bug Fixes & Reactive Pricing

| # | Soubor | Zmena | Duvod |
|---|--------|-------|-------|
| 1 | `index.jsx` | Pridana auto-rekalkulace pres `useDebouncedRecalculation` hook | Bug 1: zmena konfigurace nespoustela novy slicing |
| 2 | `index.jsx` | `selectedPresetId` zmeneno na `selectedPresetIds` (per-model objekt) | Bug 2: preset byl sdileny pro vsechny modely |
| 3 | `index.jsx` | Preset loading extrahovan do `loadPresets()`, pridano retry | Bug 3: presety se nacitaly jen jednou, bez retry |
| 4 | `components/PrintConfiguration.jsx` | NaN/null safety guardy na vsechny numericke displeje v results | Bug 4: NaN ve vysledcich slicingu |
| 5 | `hooks/useDebouncedRecalculation.js` | Novy soubor - debounced recalculation hook | Podpora pro Bug 1 |

### S02 - Contact Form & Checkout

| # | Soubor | Zmena | Duvod |
|---|--------|-------|-------|
| 6 | `index.jsx` | Stepper rozsiren z 3 na 5 kroku (Checkout + Confirmation) | Novy checkout flow |
| 7 | `components/CheckoutForm.jsx` | Novy soubor - kontaktni formular | S02 checkout |
| 8 | `components/OrderConfirmation.jsx` | Novy soubor - potvrzeni objednavky | S02 checkout |
| 9 | `schemas/checkoutSchema.js` | Novy soubor - Zod validacni schema | S02 checkout |

### S05 - Volume Discounts

| # | Soubor | Zmena | Duvod |
|---|--------|-------|-------|
| 10 | `components/PricingCalculator.jsx` | Zobrazeni volume discount radku v breakdown + dev breakdown | S05 volume discounts display |

---

## Widget-kalkulacka Sync (STEP 4)

> Zmeny portovane z test-kalkulacky do widget-kalkulacky.

| # | Soubor | Zmena | Duvod |
|---|--------|-------|-------|
| W1 | `widget-kalkulacka/index.jsx` | `selectedPresetId` -> `selectedPresetIds` (per-model) | Bug 2 port |
| W2 | `widget-kalkulacka/index.jsx` | `loadPresets()` extrahovan jako callable + retry | Bug 3 port |
| W3 | `widget-kalkulacka/index.jsx` | `BUILDER_MOCK` zmenen z useMemo na useRef (stabilni ref) | White screen fix |
| W4 | `widget-kalkulacka/index.jsx` | CSS vars useEffect - lokalni promenna pro containerRef | White screen fix |
| W5 | `widget-kalkulacka/index.jsx` | Null guard pro `displaySelected` pred PrintConfiguration renderem | White screen fix |
| W6 | `widget-kalkulacka/components/PrintConfiguration.jsx` | NaN safety guardy (safeN helper) v results display | Bug 4 port |
| W7 | `widget-kalkulacka/components/PrintConfiguration.jsx` | Retry button v preset error banneru | Bug 3 port |
| W8 | `widget-kalkulacka/components/PricingCalculator.jsx` | Volume discount display radek | S05 port |
| W9 | `admin/builder/BuilderPage.jsx` | ErrorBoundary okolo WidgetKalkulacka | White screen fix |

### Neportovane zmeny (zamerne)
- **S02 Checkout flow** — widget je embedovany, nema vlastni checkout
- **Bug 1 Auto-recalc** — widget ma jiny flow, auto-recalc hook nedelegovan (nizka priorita pro widget)
