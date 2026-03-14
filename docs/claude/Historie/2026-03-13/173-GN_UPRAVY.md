# 173-GN — UPRAVY — Browser Testing + Widget-Kalkulačka Sync — 2026-03-13

## Metadata
- **ID:** 173-GN
- **Session:** S29
- **Datum:** 2026-03-13
- **Oblast:** General / Widget-Kalkulačka Sync
- **Souvisejici ID:** 172-GN (KONVERZACE), 170 (Checkout Fixes), 129 (Widget Sync iniciace)
- **Trigger:** Vlna 9 browser testing + widget sync verification

---

## Souhrn uprav

Synchronizace widget-kalkulačky se zbytkem systému a oprava runtime bugu v AdminCustomers (round2 reference). 20 stránek otestováno (18 admin + 2 kalkulačky), 19/20 PASS. Widget nyní správně:
- Zobrazuje grandTotal místo simple.grandTotal (checkout shipping fix)
- Načítá branding informace s live reload
- Podporuje per-color ceny a kupon storage
- Nemá LanguageContext (záměrný — embedded bez provideru)

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/admin/AdminCustomers.jsx` | Zmeneno | 145-155 | Lokální definice round2 (po chybějícím importu z formatters) — bug fix |
| 2 | `src/pages/widget-kalkulacka/index.jsx` | Zmeneno | 12-18 | Import getBranding, storage listener v useEffect — branding pro widget |
| 3 | `src/pages/widget-kalkulacka/components/PricingCalculator.jsx` | Zmeneno | 78-85 | Oprava displayTotal: quote.simple.grandTotal → quote.grandTotal (shipping sync) |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminCustomers.jsx`

**Typ:** Zmeneno
**Radky:** 145-155
**Duvod:** Oprava runtime chyby — `round2 is not defined`. Po refaktorování importu z centralizované `formatters.js` chyběla lokální fallback definice.

**Co se zmenilo:**
- Přidána lokální helper funkce `round2(num)` pro zaokrouhlování na 2 desetinná místa
- Užívá se v `renderCustomerStats()` pro zobrazení cen (Total Revenue, Avg Order Value)
- Fallback do budoucí centralizace — pokud budou všechny komponenty importovat z `formatters.js`, může se smazat

**Pred:** Runtime error "round2 is not defined" při renderování AdminCustomers
**Po:** Komponenta renderuje bez chyby, ceny správně zaokrouhleny na 2 místa

---

### 2. `src/pages/widget-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 12-18
**Duvod:** Synchronizace widget-kalkulačky s branding systémem. Widget nyní dynamicky aktualizuje barvy a metadata z tenant storage.

**Co se zmenilo:**
- Import `getBranding(tenantId)` z `src/utils/adminBrandingStorage.js`
- Přidán `useEffect` s dependency na tenantId — naslouchá změnám branding konfigu (listener pattern)
- State `widgetBranding` se předává do `<WidgetHeader>` komponenty jako props
- CSS variable `--widget-primary-color` se dynamicky aplikuje na `<div className="widget-root">`

**Pred:** Widget měl hardcoded barvy, branding se nemenil bez reloadu
**Po:** Widget reaguje v reálném čase na změny branding konfigu v admin panelu

```jsx
// PRED:
const widgetBranding = { primaryColor: '#0066CC' }; // hardcoded

// PO:
const [widgetBranding, setWidgetBranding] = useState({});
useEffect(() => {
  const branding = getBranding(tenantId);
  setWidgetBranding(branding);
  // Listen for storage changes
  window.addEventListener('storage', handleBrandingChange);
  return () => window.removeEventListener('storage', handleBrandingChange);
}, [tenantId]);
```

---

### 3. `src/pages/widget-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno
**Radky:** 78-85
**Duvod:** Synchronizace s S28 checkout fixem (wave 8). Widget nyní používá správný field pro celkovou cenu s přepočtem dopravy.

**Co se zmenilo:**
- Oprava displayTotal: `quote.simple.grandTotal` → `quote.grandTotal`
- Problém: `simple` variant ceny ignoruje přiřazenou dopravu, což vedlo k neshodě s checkout formulářem
- GrandTotal včetně dopravy, poplatků a slev — správně se zobrazuje v kalkulačce i widget previewu

**Pred:** Widget ukazoval nižší cenu (bez shipping fee) — neshodný s checkout formulářem
**Po:** Widget a checkout formulář ukazují stejnou cenu s dopravou zahrnutou

```jsx
// PRED:
const displayTotal = quote.simple.grandTotal; // bez shipping

// PO:
const displayTotal = quote.grandTotal; // s shipping
```

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminCustomers (runtime fix), WidgetCalculator (branding sync), CheckoutForm (parity s widget displayTotal)
- **Breaking changes:** Ne — jedná se o synchronizace a bugfixy bez API změn
- **Nove zavislosti:** Výsledek přidaného importu `getBranding()` — bez nových npm balíčků
- **Rizika:**
  - AdminShipping ukazuje pomalé první načtení (skeleton race condition) — P2 task
  - round2 duplikáce v AdminCustomers vs. centrální formatters.js (dlouhodobá optimizace)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** 20 stránek testováno v Chrome:
  - 18 admin stránek — 18/18 PASS (bez console errors)
  - 2 kalkulačky (test-kalkulacka + widget preview) — 1/2 PASS (widget displayTotal opraveno)
  - Supabase fallback warnings (očekávané v dev — localStorage fallback funguje)
  - AdminShipping pomalé načtení (skeleton race condition — není regrese)
- **Poznamky:**
  - Widget nyní synchronizován se S28 checkout fixem (displayTotal shipping)
  - Branding live reload v widget-kalkulačce ověřeno (getBranding listener)
  - round2 runtime error vyřešen — otevřeno: dlouhodobá refaktorizace na centrální formatters.js

---
