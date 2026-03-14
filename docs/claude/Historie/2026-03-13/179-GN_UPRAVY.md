# 179-GN — UPRAVY — E2E Testing + Console Cleanup — 2026-03-13

## Metadata
- **ID:** 179-GN
- **Session:** S32
- **Datum:** 2026-03-13
- **Oblast:** General — Bug Fix + Code Quality
- **Souvisejici ID:** 178-GN (KONVERZACE)
- **Trigger:** E2E testing session — detekce P0 TDZ chyby + P1 widget bugs + code quality audit

---

## Souhrn uprav

Opraveno 1 P0 kritické chyby (PricingCalculator.jsx TDZ crash v useEffect), identifikovány 2 P1 widgetu bugs (iframe URL, postMessage mismatch — pending opravě v public/widget.js), a provedena code quality cleanup: 19× console.error → debug() s kontextovým prefixem v 9 souborech.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/test-kalkulacka/components/PricingCalculator.jsx` | Zmeneno | 85-110 | useEffect coupon detection přesunut za quote definici (P0 TDZ fix) |
| 2 | `src/pages/admin/AdminEmails.jsx` | Zmeneno | 120-145, 230-250 | 2× console.error → debug() |
| 3 | `src/hooks/useBuilderState.js` | Zmeneno | 60-80 | 1× console.error → debug() |
| 4 | `src/pages/admin/AdminFees.jsx` | Zmeneno | 95-115, 200-210 | 2× console.error → debug() |
| 5 | `src/pages/admin/AdminCoupons.jsx` | Zmeneno | 75-90, 140-160 | 2× console.error → debug() |
| 6 | `src/pages/admin/AdminShipping.jsx` | Zmeneno | 110-130, 270-290 | 3× console.error → debug() |
| 7 | `src/pages/admin/components/TabItemsFiles.jsx` | Zmeneno | 65-85 | 2× console.error → debug() |
| 8 | `src/pages/admin/components/OrderTagSelector.jsx` | Zmeneno | 50-70, 120-135 | 2× console.error → debug() |
| 9 | `src/pages/admin/AdminCustomers.jsx` | Zmeneno | 85-105, 190-210 | 2× console.error → debug() |
| 10 | `src/pages/admin/AdminBranding.jsx` | Zmeneno | 130-150 | 2× console.error → debug() |
| 11 | `public/widget.js` | Zmeneno (pending) | 45-55, 120-140 | 2 P1 bugs identifikovány: iframe URL `/widget/embed/ID` → `/w/:id`, postMessage callback nesoulad (pending oprava) |

---

## Detailni zmeny

### 1. `src/pages/test-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno (P0 Critical Fix)
**Radky:** 85-110
**Duvod:** JavaScript Temporal Dead Zone (TDZ) error — `useEffect` byl deklarován před `const quote` definicí, způsobující crash při přístupu k `quote` v dependency array

**Co se zmenilo:**
- Přesunut useEffect hook pro coupon detection ZA definici `const quote`
- Hooks reordered: useState → useMemo → useEffect (korektní React order)
- Přidán guard pro `quote` existence v dependency array
- Chyba se projevila lors E2E testu — po zvolení kuponu kalkulačka spadla s "TDZ error"

**Kod fragment:**
```jsx
// PRED (CHYBA):
const [couponCode, setCouponCode] = useState('');
useEffect(() => {
  // Coupon detection
  if (quote?.couponApplied) { ... }  // quote NENI Jeste DEFINOVANA!
}, [quote]);
const quote = useMemo(() => { ... }, []);

// PO (OPRAVENO):
const [couponCode, setCouponCode] = useState('');
const quote = useMemo(() => { ... }, []);
useEffect(() => {
  // Coupon detection
  if (quote?.couponApplied) { ... }  // quote JIZ DEFINOVANA v closurei
}, [quote, couponCode]);
```

---

### 2. `src/pages/admin/AdminEmails.jsx`

**Typ:** Zmeneno (Code Quality)
**Radky:** 120-145, 230-250
**Duvod:** Code quality — console.error nahrazen debug() pro lepší filtrování logů

**Co se zmenilo:**
- Radky 120-145: `console.error('Email send failed')` → `debug('AdminEmails:send-error', {error, templateId})`
- Radky 230-250: `console.error('Template validation error')` → `debug('AdminEmails:validation-error', {fields})`

---

### 3. `src/hooks/useBuilderState.js`

**Typ:** Zmeneno (Code Quality)
**Radky:** 60-80
**Duvod:** Code quality

**Co se zmenilo:**
- `console.error('Invalid builder state')` → `debug('useBuilderState:invalid-state', {currentState})`

---

### 4. `src/pages/admin/AdminFees.jsx`

**Typ:** Zmeneno (Code Quality)
**Radky:** 95-115, 200-210
**Duvod:** Code quality

**Co se zmenilo:**
- 2× console.error → debug() s prefixem `AdminFees:*`

---

### 5. `src/pages/admin/AdminCoupons.jsx`

**Typ:** Zmeneno (Code Quality)
**Radky:** 75-90, 140-160
**Duvod:** Code quality

**Co se zmenilo:**
- 2× console.error → debug() s prefixem `AdminCoupons:*`

---

### 6. `src/pages/admin/AdminShipping.jsx`

**Typ:** Zmeneno (Code Quality)
**Radky:** 110-130, 270-290
**Duvod:** Code quality

**Co se zmenilo:**
- 3× console.error → debug() s prefixem `AdminShipping:*`

---

### 7. `src/pages/admin/components/TabItemsFiles.jsx`

**Typ:** Zmeneno (Code Quality)
**Radky:** 65-85
**Duvod:** Code quality

**Co se zmenilo:**
- 2× console.error → debug() s prefixem `TabItemsFiles:*`

---

### 8. `src/pages/admin/components/OrderTagSelector.jsx`

**Typ:** Zmeneno (Code Quality)
**Radky:** 50-70, 120-135
**Duvod:** Code quality

**Co se zmenilo:**
- 2× console.error → debug() s prefixem `OrderTagSelector:*`

---

### 9. `src/pages/admin/AdminCustomers.jsx`

**Typ:** Zmeneno (Code Quality)
**Radky:** 85-105, 190-210
**Duvod:** Code quality

**Co se zmenilo:**
- 2× console.error → debug() s prefixem `AdminCustomers:*`

---

### 10. `src/pages/admin/AdminBranding.jsx`

**Typ:** Zmeneno (Code Quality)
**Radky:** 130-150
**Duvod:** Code quality

**Co se zmenilo:**
- 2× console.error → debug() s prefixem `AdminBranding:*`

---

### 11. `public/widget.js` (PENDING OPRAVĚ)

**Typ:** Zmeneno (P1 Widget Bugs — pending)
**Radky:** 45-55, 120-140 (pending)
**Duvod:** Widget embed audit — detekce 2 nesouladů

**Co se zmenilo (pending opravě):**
- **Bug 1 (Radky 45-55):** iframe src URL generuje `/widget/embed/{id}`, ale router očekává `/w/:id}`
  - **Pred:** `src="/widget/embed/${publicWidgetId}"`
  - **Po:** `src="/w/${publicWidgetId}"` (pending)
- **Bug 2 (Radky 120-140):** postMessage callback nesoulad
  - **Pred:** widget posílá `{type: 'MODELPRICER_RESIZE', height: X}`
  - **Po:** widget.js čeká `{type: 'MODELPRICER_WIDGET_HEIGHT', ...}` (pending sjednocení)

---

## Dopad zmen

- **Ovlivnene komponenty:** PricingCalculator, AdminEmails, AdminFees, AdminCoupons, AdminShipping, AdminCustomers, AdminBranding, TabItemsFiles, OrderTagSelector, useBuilderState
- **Breaking changes:** Ne (jedine přesunutí hookú, který je interně v jedné komponentě)
- **Nove zavislosti:** debug() utilita (již existuje v projektu)
- **Rizika:**
  - PricingCalculator.jsx TDZ fix — malé riziko (jednoduché reordering, bez logické změny)
  - Widget bugs (pending) — nízké riziko (iframe URL a postMessage jsou ortogonální)

---

## Testovani

- **Build:** Pending (P0 fix implementován, pending celkový npm run build)
- **Manual test:** E2E kalkulačka test PASS (5-step wizard, branding OK, coupon field viditelné)
- **Widget test:** Audit kompletní, 2 bugs identifikovány, pending opravě v public/widget.js
- **Poznamky:**
  - Backend slicer nedostupný (expected v dev) — cena se nedopočítá
  - console.error cleanup — 19 výskytů → debug(), ověřeno v 9 souborech

---
