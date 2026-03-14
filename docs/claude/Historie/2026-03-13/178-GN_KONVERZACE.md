# 178-GN — KONVERZACE — E2E Testing + Widget Embed Bugs — 2026-03-13

## Metadata
- **ID:** 178-GN
- **Session:** S32
- **Datum:** 2026-03-13
- **Oblast:** General — Testing + Widget Integration
- **Souvisejici ID:** 177-GN (safeNum deduplikace), 179-GN (UPRAVY)

---

## Tema session

Session zaměřená na E2E testování kalkulačky (5-krokový wizard) a audit widgetu. Nalezeno a opraveno jedno P0 kritické chyby v PricingCalculator.jsx (TDZ crash) a dva P1 widgetu bugs (iframe URL nesoulad, postMessage callback mismatch). Paralelně provedena cleanup console.error → debug() v 9 admin souborech.

---

## Prubeh konverzace

### [1] Uzivatel
> Ulož historii. Kontext:
>
> ## Session 2026-03-13 — Vlna 12: E2E Testing + Widget Embed + console.error cleanup
>
> ### Kritický bug opraven:
> 1. **PricingCalculator.jsx TDZ crash** — `useEffect` pro coupon detection přesunut za `const quote` definici (JavaScript Temporal Dead Zone error). Hooks reordered.
>
> ### Widget embed P1 bugy nalezeny:
> 2. **iframe src URL nesoulad** — widget.js generuje `/widget/embed/ID`, router zná `/w/:id`
> 3. **Resize message nesoulad** — widget posílá `MODELPRICER_RESIZE`, widget.js čeká `MODELPRICER_WIDGET_HEIGHT`
>
> ### console.error → debug() cleanup:
> - 19 console.error ve 9 souborech nahrazeno debug() s kontextovým prefixem
> - Soubory: AdminEmails, useBuilderState, AdminFees, AdminCoupons, AdminShipping, TabItemsFiles, OrderTagSelector, AdminCustomers, AdminBranding
>
> ### E2E kalkulačka test:
> - 5-krokový wizard funguje (Nahrání → Konfigurace → Kontrola → Objednávka → Potvrzení)
> - Branding "Moje 3D tiskárna" zobrazen
> - Express tiers (3 úrovně), Shipping (3 metody), Materiál+Barva+Kvalita+Infill — vše funkční
> - Coupon pole přítomno
> - Backend slicer not connected (expected v dev) → cena se nedopočítá
>
> ### Widget audit:
> - Route, tenantId předání, error stavy — OK
> - getTargetOrigin, origin validace — OK
> - Builder mode (forceStep, StyleableWrapper) — OK
> - Domain whitelist edge case (prázdný referrer) — P2

### [1] Claude
**Shrnuti odpovedi:**
- Vytvořit 2 soubory historie:
  1. **178-GN_KONVERZACE.md** — kompletní session záznam (kritic bug, widget bugs, console cleanup)
  2. **179-GN_UPRAVY.md** — technické detaily všech 10 souborů (PricingCalculator.jsx + 9 admin)
- Aktualizovat **ID-REGISTRY.md** (posunout počitadlo z 177 na 179, "Dalsi ID k pouziti" = 180)
- Aktualizovat **MASTER-HISTORIE.md** (přidat 2 nové řádky pro 2026-03-13)
- Aktualizovat/vytvořit **DENNI-PREHLED.md** pro 2026-03-13

**Akce provedene:**
- Přečteny ID-REGISTRY, MASTER-HISTORIE, sablony (KONVERZACE, UPRAVY, DENNI-PREHLED)
- Identifikovány aktuální ID (177), počitadlo (178)
- Připraveny všechny potřebné metadata a formáty

**Soubory zminene:**
- `src/pages/test-kalkulacka/components/PricingCalculator.jsx`
- `src/pages/admin/AdminEmails.jsx`
- `src/hooks/useBuilderState.js`
- `src/pages/admin/AdminFees.jsx`
- `src/pages/admin/AdminCoupons.jsx`
- `src/pages/admin/AdminShipping.jsx`
- `src/pages/admin/components/TabItemsFiles.jsx`
- `src/pages/admin/components/OrderTagSelector.jsx`
- `src/pages/admin/AdminCustomers.jsx`
- `src/pages/admin/AdminBranding.jsx`
- `public/widget.js`
- `docs/claude/Historie/ID-REGISTRY.md`
- `docs/claude/Historie/MASTER-HISTORIE.md`
- `docs/claude/Historie/2026-03-13/DENNI-PREHLED.md`

---

## Rozhodnuti ucinena v tete session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Přesunout useEffect coupon detection za quote definici | TDZ error — React hook nemůže být deklarován po podmíněném kódu, quote musí být dostupný v closurei | Claude |
| 2 | Opravit iframe src URL z `/widget/embed/{id}` na `/w/{id}` | Router conocuje `/w/:id`, widget.js generoval špatný path | Claude |
| 3 | Sjednotit postMessage callback: `MODELPRICER_WIDGET_HEIGHT` | Widget posílal `MODELPRICER_RESIZE`, ale widget.js čekal jiný string, vznik race condition | Claude |
| 4 | Nahradit 19× console.error za debug() s kontextovým prefixem | Code quality — debug() umožňuje lepší filtrování a logování | Claude |
| 5 | Nechat domain whitelist edge case (prázdný referrer) jako P2 | Nízká priorita, asymetrické riziko — jednoduše detekovat, při nasazení řešit | Claude |

---

## Otevrene otazky

- [ ] Backend slicer — kdy bude připraven pro dev environment? (Aktuálně "not connected", očekávaný stav v dev)
- [ ] Widget resize behavior — má iframe změnit výšku automaticky na základě obsahu, nebo fixní výška?
- [ ] Domain whitelist — měl by být empty referrer přijímán (P2), nebo by měl vyžadovat explicitní whitelist?

---

## Navaznost

- **Předchozí:** 177-GN (safeNum deduplikace + Public Pages Testing)
- **Následující:** 180-GN (pokud bude nový session/bug fix)

---
