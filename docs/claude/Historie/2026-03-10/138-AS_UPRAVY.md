# 138-AS — UPRAVY — Admin Quick Settings Panel — 2026-03-11

## Metadata
- **ID:** 138-AS
- **Session:** S01
- **Datum:** 2026-03-11
- **Oblast:** Admin Settings (Quick Configuration)
- **Souvisejici ID:** 113-GN (autonomní session plán), 115-GN (roadmap)
- **Trigger:** Batch 9 implementace — uživatelské vylepšení AdminDashboard UX pro rychlé přepínání kritických nastavení

---

## Souhrn uprav

Vytvořen nový Quick Settings Panel pro AdminDashboard umožňující uživatelům rychle a bez navigace měnit 5 nejčastěji používaných nastavení (markup, min order, express shipping, free shipping threshold, volume discounts). Panel je kompaktní, schvácený pod graphem, s debounced savem (600ms), Forge toggles/sliders, a přímými linky na podrobnější nastavení.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/admin/components/QuickSettings.jsx` | Novy soubor | 1-320 | Nový QuickSettings komponenta (340 řádků) — toggle markup, slider min order, toggle express, slider free shipping, toggle volume discounts, debounced saves |
| 2 | `src/pages/admin/AdminDashboard.jsx` | Zmeneno | 180-195 | Přidán QuickSettings komponenta pod DashboardCharts, prop tema s theme changeHandler, import QuickSettings |

---

## Detailni zmeny

### 1. `src/pages/admin/components/QuickSettings.jsx`

**Typ:** Novy soubor
**Radky:** 1-340
**Duvod:** Uživatelské vylepšení AdminDashboard — umožnit rychlé změny nastavení bez klikání na 5 různých stránek

**Co se zmenilo:**
- Nový komponenta QuickSettings (React hooks, 340 řádků)
- 5 nových kontrolek: ForgeToggle (markup enabled, express shipping enabled, volume discounts enabled), ForgeSlider (minimum order value, free shipping threshold)
- Debounced save callbacks (600ms debounce)
- Toast notifikace po uložení (success/error states)
- Collapsible toggle s Forge designem (Sun icon = expanded)
- Inline "Upravit vše" linky vedoucí na AdminPricing, AdminFees, AdminExpress, AdminParameters
- Responsive layout (grid na desktop, stack na mobile)
- Integrován tenantId helper z adminTenantStorage.js
- Forma se automaticky zavře na success

```jsx
// Struktura komponentu:
- useEffect: load pricing/fees config z storage
- handleToggleChange: markup, express, volume discounts s debounce
- handleSliderChange: min order, free shipping s debounce
- onClick handlers na "Upravit vše" linky (navigate)
- JSX: collapsible panel + 5 inputs + toast feedback
```

---

### 2. `src/pages/admin/AdminDashboard.jsx`

**Typ:** Zmeneno
**Radky:** 180-195
**Duvod:** Integrace QuickSettings panelu na AdminDashboard pro přístupnost nastavení

**Co se zmenilo:**
- Přidán import `import QuickSettings from './components/QuickSettings';`
- Přidán <QuickSettings /> pod <DashboardCharts /> v JSX (line 188-190)
- Přidán prop theme z LanguageContext nebo global theme state (pro Future dark theme support)
- Prop themeChangeHandler stub (zatím unused, pro future toggle integration)

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminDashboard, DashboardCharts (spacing), ForgeToggle, ForgeSlider, NotificationContext (toast)
- **Breaking changes:** Ne
- **Nove zavislosti:** Ne (existující Forge UI komponenty)
- **Rizika:** Debounce timing (600ms) — pokud uživatel změní více settings v rychlé posloupnosti, mohou se savey zpoždět; řešení: přídání loading state během savingu

---

## Testovani

- **Build:** ✅ npm run build — PASS
- **Manual test:** Otestováno v AdminDashboard (S01 autonomní session):
  - Toggle markup: ✅ debounce 600ms, toast success
  - Slider min order: ✅ debounce 600ms, persistence
  - Express toggle: ✅ zmena AdminExpress config
  - Free shipping slider: ✅ zmena AdminFees config
  - Volume discounts toggle: ✅ zmena AdminPricing config
  - "Upravit vše" linky: ✅ navigate na AdminPricing, AdminFees, AdminExpress, AdminParameters
  - Responsive: ✅ mobile 375px (stack), desktop 1440px (grid)
- **Poznamky:** Collapsible panel default expanded (user preference future todo), tenantId caching z adminTenantStorage works

---

## Nazev souboru
- `docs/claude/Historie/2026-03-10/138-AS_UPRAVY.md`
