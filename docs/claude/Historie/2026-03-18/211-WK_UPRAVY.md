# 211-WK — UPRAVY — Widget-Kalkulacka — 2026-03-18

## Metadata
- **ID:** 211-WK
- **Session:** S01
- **Datum:** 2026-03-18
- **Oblast:** Widget-Kalkulacka
- **Souvisejici ID:** 129-WK, 102-PY, 103-PY
- **Trigger:** Uzivatelsky pozadavek — implementace checkout flow ve widget-kalkulacce + pricing layout fix (inline styles misto Tailwind)

---

## Souhrn uprav

Implementace kompletniho checkout flow ve widget-kalkulacce (kroky 4 a 5: objednavka a potvrzeni) vcetne 5-krokoveho stepperu. Soucasne kompletni prepis PricingCalculator z Tailwind classes na inline styles (widget bezi v iframe kde Tailwind neni dostupny). CheckoutForm a OrderConfirmation jsou importovany z test-kalkulacky (single source of truth, bez duplikace).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/widget-kalkulacka/index.jsx | Zmeneno | cele soubor | Checkout flow: step 4 (CheckoutForm), step 5 (OrderConfirmation), postMessage, Shopify mode |
| 2 | src/pages/widget-kalkulacka/components/PricingCalculator.jsx | Zmeneno | cele soubor | Kompletni layout fix — vsechny Tailwind classes nahrazeny inline styles |
| 3 | src/pages/widget-kalkulacka/components/WidgetStepper.jsx | Zmeneno | cele soubor | Podpora 5 kroku, Lucide ikony, responzivni layout |

---

## Detailni zmeny

### 1. `src/pages/widget-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** cele soubor (rozsahle zmeny)
**Duvod:** Widget-kalkulacka nemela checkout flow — zakaznik mohl jen videt cenu, ale ne objednat

**Co se zmenilo:**
- Import CheckoutForm a OrderConfirmation z test-kalkulacky (sdilene komponenty)
- totalSteps={5} pro WidgetStepper
- Novy state: lastOrderResult
- handleCheckoutComplete callback s postMessage MODELPRICER_ORDER_CREATED
- handleStartNewOrder callback (reset state na zacatek)
- "Prejit k objednavce" tlacitko v step 3 (jen non-Shopify mode)
- CheckoutForm renderovani ve step 4
- OrderConfirmation renderovani ve step 5
- ShopifyCartButton jen v Shopify mode
- DEFAULT_ELEMENT_ORDER rozsiren o checkout + confirmation
- ELEMENT_ZONES rozsireny

---

### 2. `src/pages/widget-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno
**Radky:** cele soubor (kompletni prepis stylu)
**Duvod:** Widget v iframe nema pristup k Tailwind — vsechny utility classes nefungovaly

**Co se zmenilo:**
- MiniRow komponenta prepsana z Tailwind na inline styles
- Zarovnani cen s font-variant-numeric: tabular-nums
- Format: kladne bez znamenka, zaporne zelene s "-", prirazky s "+"
- Celkem sekce: 28px heading font
- Breakdown: 13px muted color
- Doprava/Rychlost karty: inline styles misto Tailwind
- Rozpis objednavky: inline styles
- VSECHNY Tailwind classes nahrazeny inline styles

---

### 3. `src/pages/widget-kalkulacka/components/WidgetStepper.jsx`

**Typ:** Zmeneno
**Radky:** cele soubor
**Duvod:** Stepper podporoval jen 3 kroky, nyni potrebuje 5 pro checkout flow

**Co se zmenilo:**
- Default totalSteps=5
- STEPS_5: Upload, Konfigurace, Prehled ceny, Objednavka, Potvrzeni
- Lucide ikony per step
- Responzivni: 28px krouzky, kratke labely pro 5-step
- Pod 500px jen ikony
- Pod 360px "Krok X z 5"
- CSS vars (--widget-accent, --forge-accent)

---

## Dopad zmen

- **Ovlivnene komponenty:** Widget-kalkulacka (cely checkout flow), WidgetStepper, PricingCalculator
- **Breaking changes:** Ano — CLAUDE.md pravidlo "Widget nema checkout" prepsano na zadost uzivatele
- **Nove zavislosti:** CheckoutForm a OrderConfirmation importovany z test-kalkulacky (uz existuji)
- **Rizika:** forge-tokens.css a LanguageContext musi byt dostupne ve widgetu (overeno — widget je route v hlavni app)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Checkout flow ve widgetu (step 4 formular, step 5 potvrzeni), pricing layout zarovnani, responzivni stepper
- **Poznamky:** PostMessage MODELPRICER_ORDER_CREATED odesilano pri uspesnem checkoutu pro integraci s hostitelskou strankou

---

<!-- KONEC ZAZNAMU -->
