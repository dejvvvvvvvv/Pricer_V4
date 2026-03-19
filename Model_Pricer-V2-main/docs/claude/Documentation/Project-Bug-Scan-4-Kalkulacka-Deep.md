# Project Bug Scan #4 — Kalkulačky Deep Scan

**Datum:** 2026-03-18
**Průzkum:** 4. scan (test-kalkulačka + widget-kalkulačka deep dive)

---

## P0 nálezy (3)

### P0-1. Icon import nekonzistence (AppIcon vs ui/Icon)
- **Soubory:** widget/PricingCalculator.jsx:3, test/PricingCalculator.jsx:4, PricingHistory.jsx:2, VolumeDiscountChart.jsx:3
- **Popis:** Některé importují z ui/Icon, jiné z AppIcon — různé API, riziko white screen
- **Opraveno:** [ ]

### P0-2. Widget: chybí defaultPreset přiřazení při uploadu
- **Soubor:** widget/index.jsx:733-746
- **Popis:** Nový model nemá preset → slicing může selhat
- **Opraveno:** [ ]

### P0-3. Widget: handleConfigChange nepouští auto-recalc
- **Soubor:** widget/index.jsx:450-454
- **Popis:** Test-kalkulačka má auto-recalc, widget NE — divergence
- **Opraveno:** [ ]

---

## P1 nálezy (11)

### P1-1. Widget: masivní hardcoded CZ texty bez i18n
### P1-2. Widget FileUploadZone: fiktivní 2s progress delay
### P1-3. Widget FileUploadZone: dead MoreHorizontal button
### P1-4. Widget FileUploadZone: status vždy "Hotovo"
### P1-5. Widget: "Přejít k objednávce" bez disabled
### P1-6. CheckoutForm: 2-col grid bez responsive
### P1-7. CheckoutForm: country jako free-text Input
### P1-8. Widget: cancelledRef race condition v loadPresets
### P1-9. Widget: aria-live na špatném elementu
### P1-10. Test-kalkulačka: handleRetryModel bez slicingToasts
### P1-11. Widget PricingCalculator: quote blokován pro partial batch

---

## P2 nálezy (8)

### P2-1. useCountUp edge case target=0
### P2-2. Widget StyleableWrapper hardcoded barvy
### P2-3. Test-kalkulačka Shopify checkout EN texty
### P2-4. Widget SlicingProgressInline hardcoded activeIdx
### P2-5. Widget FileUploadZone chybí aria-label
### P2-6. Test-kalkulačka "Automaticky ulozeno" bez i18n
### P2-7. Widget SW useCallback remount issue
### P2-8. Widget getTargetOrigin fallback

---

## Statistika
- P0: 3
- P1: 11
- P2: 8
