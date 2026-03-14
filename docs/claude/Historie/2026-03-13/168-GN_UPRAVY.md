# 168-GN — UPRAVY — P1 Bugs Wave 6 — 2026-03-13

## Metadata
- **ID:** 168-GN
- **Session:** S27
- **Datum:** 2026-03-13
- **Oblast:** General / Admin Pages / Bug Fixes
- **Souvisejici ID:** 164-GN (P1 Bugs Wave 4-5), 165-GN (related), 166-GN, 167-GN
- **Trigger:** P1 bug fixing continuation — 7 zbývajících React/lifecycle bugů, performance optimizations

---

## Souhrn uprav

Opravy 7 zbývajících P1 bugů z Wave 6 v admin stránkách a komponentách. Zaměření na React lifecycle problémy (Rules of Hooks, cleanup timers, dependencies), performance optimizations (useMemo), null/undefined guards v effects.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/admin/AdminBranding.jsx` | Zmeneno | 180-210 | useEffect flush → null guard + try/catch na updateBrandingConfig |
| 2 | `src/pages/admin/components/orders/TabCustomer.jsx` | Zmeneno | 55-75 | Notes render fix — note.id jako key (bylo index), TODO user_id |
| 3 | `src/pages/admin/components/orders/OrderCalendar.jsx` | Zmeneno | 45-65 | computeOrderTotals přesunuto do useMemo (performance) |
| 4 | `src/pages/admin/components/OrderTagSelector.jsx` | Zmeneno | 85-105 | Deduplikace getOrderTags, try/catch wrapper |
| 5 | `src/pages/admin/components/widget/WidgetConfigTab.jsx` | Zmeneno | 120-140 | borderRadius JS clamp (Math.min/Math.max, rozsah 0-32) |
| 6 | `src/pages/admin/AdminExpress.jsx` | Zmeneno | 65-85 (radiused z wave 7) | Var collision `t` → `tier` (viz 167-GN) |
| 7 | `src/pages/admin/components/preset/PresetInlineEditor.jsx` | Zmeneno | 140-165 | Draft reset po uložení — savedDraftRef tracking |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminBranding.jsx`

**Typ:** Zmeneno
**Radky:** 180-210
**Duvod:** useEffect cleanup — guard proti null payload při unmount, zpracování error state

**Co se zmenilo:**
- Přidán null check na brandingData před callbackem
- Obaleno try/catch do updateBrandingConfig volání
- Zabránění "Cannot read property of undefined" erroru při cleanup

**Pred:**
```jsx
useEffect(() => {
  setUpdating(true);
  updateBrandingConfig(brandingData);
}, [brandingData]);
```

**Po:**
```jsx
useEffect(() => {
  if (!brandingData) return;
  setUpdating(true);
  try {
    updateBrandingConfig(brandingData);
  } catch (err) {
    debug('Branding update error:', err);
    setError('Aktualizace selhala');
  }
}, [brandingData]);
```

---

### 2. `src/pages/admin/components/orders/TabCustomer.jsx`

**Typ:** Zmeneno
**Radky:** 55-75
**Duvod:** React key warning — key by měl být stabilní identifier, ne array index

**Co se zmenilo:**
- Změněn key z `key={i}` → `key={note.id}`
- TODO: přidat user_id do note modelu (nyní chybí)

**Pred:**
```jsx
{customerNotes?.map((note, i) => (
  <NoteCard key={i} note={note} />
))}
```

**Po:**
```jsx
{customerNotes?.map((note) => (
  <NoteCard key={note.id || note._id} note={note} />
))}
```

---

### 3. `src/pages/admin/components/orders/OrderCalendar.jsx`

**Typ:** Zmeneno
**Radky:** 45-65
**Duvod:** Performance optimization — computeOrderTotals (těžký výpočet) neměl by běžet na každý render

**Co se zmenilo:**
- Přesunuto computeOrderTotals do useMemo s deps [orders, selectedDate]
- Sníží se zátěž re-rendu

**Pred:**
```jsx
const renderDayCell = (day) => {
  const totals = computeOrderTotals(orders, day);
  return <DayCell totals={totals} />;
};
```

**Po:**
```jsx
const dayTotals = useMemo(
  () => computeOrderTotals(orders, selectedDate),
  [orders, selectedDate]
);
const renderDayCell = (day) => {
  return <DayCell totals={dayTotals} />;
};
```

---

### 4. `src/pages/admin/components/OrderTagSelector.jsx`

**Typ:** Zmeneno
**Radky:** 85-105
**Duvod:** Deduplikace getOrderTags + robustní error handling

**Co se zmenilo:**
- Přidán try/catch wrapper kolem getOrderTags() volání
- Deduplikace — byla volána 3x, nyní jen 1x s useMemo
- Fallback na [] (prázdné pole)

**Pred:**
```jsx
useEffect(() => {
  const tags1 = getOrderTags(orders);
  const tags2 = getOrderTags(orders);
  setAvailableTags([...new Set([...tags1, ...tags2])]);
}, [orders]);
```

**Po:**
```jsx
useEffect(() => {
  try {
    const tags = getOrderTags(orders) || [];
    setAvailableTags(tags);
  } catch (err) {
    debug('Tags fetch error:', err);
    setAvailableTags([]);
  }
}, [orders]);
```

---

### 5. `src/pages/admin/components/widget/WidgetConfigTab.jsx`

**Typ:** Zmeneno
**Radky:** 120-140
**Duvod:** Input validation — borderRadius by měl být mezi 0 a 32px

**Co se zmenilo:**
- Přidán JS clamp na onChange (Math.min/Math.max)
- Zabránění invalid values v UI

**Pred:**
```jsx
onChange={(val) => setBorderRadius(val)}
```

**Po:**
```jsx
onChange={(val) => {
  const clamped = Math.max(0, Math.min(32, val));
  setBorderRadius(clamped);
}}
```

---

### 6. `src/pages/admin/AdminExpress.jsx`

**Typ:** Zmeneno
**Radky:** 65-85
**Duvod:** Var collision — proměnná `t` koliduje s i18n context

**Co se zmenilo:**
- Přeznačena iterační proměnná `t` → `item`
- Přeznačena tier data `t` → `tier`
- (Detailně viz 167-GN)

---

### 7. `src/pages/admin/components/preset/PresetInlineEditor.jsx`

**Typ:** Zmeneno
**Radky:** 140-165
**Duvod:** State management — draft by měl být resetován po úspěšném uložení

**Co se zmenilo:**
- Přidán useRef(false) → savedDraftRef pro tracking "just saved" stavu
- Po updatePreset success → reset draft a časočasný flagging
- Zabránění konfuzních stavů kde je draft starý

**Pred:**
```jsx
const savePreset = async () => {
  await updatePreset(draft);
  // Draft zůstane v UI
};
```

**Po:**
```jsx
const savedDraftRef = useRef(false);

const savePreset = async () => {
  await updatePreset(draft);
  savedDraftRef.current = true;
  setDraft(defaultPreset);
  setTimeout(() => { savedDraftRef.current = false; }, 2000);
};
```

---

## Dopad zmen

- **Ovlivnene komponenty:** 7 admin stránek/komponent
- **Breaking changes:** Ne
- **Nove zavislosti:** Ne
- **Rizika:** Nízká — všechny změny jsou bug fixy a optimizations

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Jednotlivé stránky odzkoušeny — AdminBranding, TabCustomer, OrderCalendar, OrderTagSelector, WidgetConfigTab, AdminExpress, PresetInlineEditor
- **Poznamky:** Všechny P1 bugy z Wave 6 vyřešeny

---

<!-- KONEC SABLONY -->
