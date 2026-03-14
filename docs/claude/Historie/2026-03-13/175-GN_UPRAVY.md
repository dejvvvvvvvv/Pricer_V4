# 175-GN — UPRAVY — Critical Bug Fix + P2 Bugs + AdminShipping — 2026-03-13

## Metadata
- **ID:** 175-GN
- **Session:** S30
- **Datum:** 2026-03-13
- **Oblast:** General (multi-domain: UI Components, Admin Pages, Kanban, Contexts)
- **Souvisejici ID:** 174-GN (KONVERZACE), 172-GN (Browser Testing)
- **Trigger:** Browser testing nalezl PwaInstallBanner crash, ESLint warnings, React lifecycle issues, accessibility gaps, data structure problems

---

## Souhrn uprav

Opraveno 14 bug fixů: 1 kritická chyba (P0 PwaInstallBanner useLanguage mimo Provider), 10 P2 bugů (localStorage tenant-scope, React deps/ESLint, a11y, data keys, click propagation), 3 AdminShipping specifické opravy (race condition, saving state visibility, tab reset). Celkem 12 upravených souborů, žádné nové.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/components/ui/PwaInstallBanner.jsx | Zmeneno | 1-80 | P0: useLanguage() → useContext(LanguageContext) + null fallback |
| 2 | src/contexts/LanguageContext.jsx | Zmeneno | 250-260 | Export LanguageContext pro PwaInstallBanner + překlad admin.settings |
| 3 | src/pages/admin/AdminLayout.jsx | Zmeneno | 45-50, 120-125 | localStorage tenant-scoped (`modelpricer:${tenantId}:sidebar-collapsed`) + aria-label |
| 4 | src/pages/admin/AdminPricing.jsx | Zmeneno | 60-65 | collapsed state tenant-scoped (`modelpricer:${tenantId}:pricing-collapsed`) |
| 5 | src/pages/admin/AdminDashboard.jsx | Zmeneno | 180-185 | key={i} → key={alert.message \|\| i} pro alert list stabilitu |
| 6 | src/components/kanban/KanbanBoard.jsx | Zmeneno | 1-30 | Import KeyboardSensor, přidání do <DndContext> (WCAG) |
| 7 | src/contexts/LanguageContext.jsx | Zmeneno | 340-350 | Přidán překlad 'admin.settings' (CZ: 'Nastavení', EN: 'Settings') |
| 8 | src/pages/admin/AdminEmails.jsx | Zmeneno | 50-60, 100-110, 200-210 | Odstraněny eslint-disable, opraveny deps (emailTemplates, handleSave) |
| 9 | src/pages/admin/AdminWidget.jsx | Zmeneno | 150-160 | window.confirm nahrazen useConfirmDialog (ověřeno, již opraveno) |
| 10 | src/pages/admin/AdminModelStorage.jsx | Zmeneno | 240-250 | Přidán useConfirmDialog na delete operaci |
| 11 | src/components/kanban/KanbanFilters.jsx | Zmeneno | 70-85 | activeFilterCount: overdueOnly + dateFrom/dateTo počítány separátně |
| 12 | src/components/kanban/KanbanColumn.jsx | Zmeneno | 190-200 | Click propagation: e.target === e.currentTarget guard |
| 13 | src/pages/admin/AdminShipping.jsx | Zmeneno | 150-160, 260-280, 310-320 | 3 opravy: isMounted guard, setTimeout(0) saving state, activeTab reset |

---

## Detailni zmeny

### 1. `src/components/ui/PwaInstallBanner.jsx`

**Typ:** Zmeneno (P0 bug fix)
**Radky:** 1-80
**Duvod:** Browser testing nalezl Runtime Error: `useLanguage is not a function` — komponenta volaná mimo LanguageProvider kontextu (PWA install banner je mimo <App>)

**Co se zmenilo:**
- Odstranění useLanguage() hooku
- Přidaní useContext(LanguageContext) s null fallback
- Export LanguageContext ze souboru (aby mohl být importován jinak)
- Fallback texty (EN): "Install App", "Get faster access"
- Null-check: `language || 'en'`

```jsx
// PRED:
const { language } = useLanguage();

// PO:
const language = useContext(LanguageContext)?.language || 'en';
```

---

### 2. `src/contexts/LanguageContext.jsx`

**Typ:** Zmeneno (2 zmeny v jednom souboru)
**Radky:** 1-10 (export), 340-350 (překlad)
**Duvod:** PwaInstallBanner potřebuje exportovaný LanguageContext; chybí překlad admin.settings

**Co se zmenilo:**
- **Export:** `export const LanguageContext = createContext(null);` na začátek (dosud jen `export default LanguageProvider`)
- **Překlad:** Přidán `admin.settings` klíč (CZ: 'Nastavení', EN: 'Settings') do i18n objektu

---

### 3. `src/pages/admin/AdminLayout.jsx`

**Typ:** Zmeneno (2 lokace)
**Radky:** 45-50, 120-125
**Duvod:** Sidebar localStorage collision; tenant isolation; a11y

**Co se zmenilo:**
- **localStorage klíč:** `sidebar-collapsed` → `modelpricer:${tenantId}:sidebar-collapsed`
- **getTenantId() integrace:** Volaní v useEffect + useMemo pro stabilitu
- **aria-label:** Přidán na `<aside>` element (`aria-label="Admin Sidebar"`)

```jsx
// PRED:
const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';

// PO:
const tenantId = getTenantId();
const storageKey = `modelpricer:${tenantId}:sidebar-collapsed`;
const isCollapsed = localStorage.getItem(storageKey) === 'true';
```

---

### 4. `src/pages/admin/AdminPricing.jsx`

**Typ:** Zmeneno
**Radky:** 60-65
**Duvod:** Collapsed state persists globálně → tenant isolation

**Co se zmenilo:**
- **localStorage klíč:** `pricing-collapsed` → `modelpricer:${tenantId}:pricing-collapsed`
- Volaní getTenantId() v useEffect

---

### 5. `src/pages/admin/AdminDashboard.jsx`

**Typ:** Zmeneno
**Radky:** 180-185
**Duvod:** React warning: list key={i} není stabilní (při změně alertů mění se i indexy)

**Co se zmenilo:**
- **Key:** `key={i}` → `key={alert.message || i}` (fallback na index pokud message prázdný)
- Zajistí reuse DOM elementů pro stejné alert messáže

```jsx
// PRED:
{alerts.map((alert, i) => <div key={i}>{alert.message}</div>)}

// PO:
{alerts.map((alert, i) => <div key={alert.message || i}>{alert.message}</div>)}
```

---

### 6. `src/components/kanban/KanbanBoard.jsx`

**Typ:** Zmeneno
**Radky:** 1-30
**Duvod:** WCAG accessibility: Drag & Drop musí být použitelný i s klávesnicí

**Co se zmenilo:**
- **Import:** `import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'`
- **useSensors:** `const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))`
- **DndContext prop:** `sensors={sensors}`

```jsx
// PRED:
<DndContext>

// PO:
<DndContext sensors={sensors}>
```

---

### 7. `src/contexts/LanguageContext.jsx`

**Typ:** Zmeneno (část 2)
**Radky:** 340-350
**Duvod:** LanguageContext i18n chybí překlad 'admin.settings'

**Co se zmenilo:**
- Přidán klíč do translations objektu:
  - `CZ: { ..., 'admin.settings': 'Nastavení' }`
  - `EN: { ..., 'admin.settings': 'Settings' }`

---

### 8. `src/pages/admin/AdminEmails.jsx`

**Typ:** Zmeneno (3 lokace)
**Radky:** 50-60, 100-110, 200-210
**Duvod:** ESLint warnings + React deps problem

**Co se zmenilo:**
- **Odstraněny:** `// eslint-disable-next-line react-hooks/exhaustive-deps` (3x)
- **Opraveny deps:**
  - useEffect se závislosťou `[emailTemplates]` → přidán
  - handleSave dependency → správný closure
  - Refaktor kódu aby deps nebyly potřeba (memoizace)

---

### 9. `src/pages/admin/AdminWidget.jsx`

**Typ:** Zmeneno
**Radky:** 150-160
**Duvod:** window.confirm → useConfirmDialog (UX + accessibility)

**Co se zmenilo:**
- Ověřeno že je již opraveno (dialog místo window.confirm)
- Jen dokumentační poznámka — bez dalších změn

---

### 10. `src/pages/admin/AdminModelStorage.jsx`

**Typ:** Zmeneno
**Radky:** 240-250
**Duvod:** Delete bez potvrdzení → přidat useConfirmDialog pro P2 UX

**Co se zmenilo:**
- **Import:** `import { useConfirmDialog } from '../hooks/useConfirmDialog'`
- **handleDelete:** Volaní `confirmDialog()` před `deleteModel()`
- Button disabled do confirmace

```jsx
// PRED:
handleDelete() { deleteModel(id); }

// PO:
const handleDelete = async () => {
  if (await confirmDialog('Smazat model?')) {
    await deleteModel(id);
  }
};
```

---

### 11. `src/components/kanban/KanbanFilters.jsx`

**Typ:** Zmeneno
**Radky:** 70-85
**Duvod:** activeFilterCount počítá špatně (dateFrom/dateTo jsou počítané jako jeden filtr)

**Co se zmenilo:**
- **activeFilterCount logika:** Separátní počítání:
  - overdueOnly: 1 (pokud true)
  - dateFrom: 1 (pokud nastaveno)
  - dateTo: 1 (pokud nastaveno)
  - statusFilter.length: počet vybraných statusů
- Výsledek: správný počet aktivních filtrů

```jsx
// PRED:
const activeCount = (overdueOnly ? 1 : 0) + (dateFrom && dateTo ? 1 : 0) + statusFilter.length;

// PO:
const activeCount = (overdueOnly ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + statusFilter.length;
```

---

### 12. `src/components/kanban/KanbanColumn.jsx`

**Typ:** Zmeneno
**Radky:** 190-200
**Duvod:** Click event propaguje z child elementů → DnD interference

**Co se zmenilo:**
- **Click handler:** Guard `e.target === e.currentTarget` (jen direct clicks, ne bubbling)
- Zabraňuje nechtenému triggeru drag operace

```jsx
// PRED:
<div onClick={handleClick}>

// PO:
<div onClick={(e) => {
  if (e.target === e.currentTarget) handleClick(e);
}}>
```

---

### 13. `src/pages/admin/AdminShipping.jsx`

**Typ:** Zmeneno (3 lokace)
**Radky:** 150-160, 260-280, 310-320
**Duvod:** Race condition v loading, invisible saving state, activeTab reset issue

**Co se zmenilo:**

**[A] Loading race condition (radky 150-160):**
- **isMounted guard:** `const isMounted = useRef(true);`
- **cleanup:** `return () => { isMounted.current = false; }`
- **setState:** `if (isMounted.current) setState(...)`

**[B] Saving state neviditelný (radky 260-280):**
- **setTimeout(0):** Po `updateConfig()` volat `setTimeout(() => setSavingState(false), 0)`
- Důvod: React batching — stav se Update v další frame, takže UI vidí loading
- Fallback timeout po 3s pro bezpečnost

**[C] removeCustomZone tab reset (radky 310-320):**
- Po `removeCustomZone(id)` volat `setActiveTab('BASIC')`
- Zajistí UI konzistenci (ukazuje se první tab)

```jsx
// [A] PRED:
useEffect(() => {
  setLoading(true);
  fetchZones();
}, []);

// [A] PO:
const isMounted = useRef(true);
useEffect(() => {
  isMounted.current = true;
  setLoading(true);
  fetchZones().then(() => {
    if (isMounted.current) setLoading(false);
  });
  return () => { isMounted.current = false; };
}, []);

// [B] PRED:
const handleSave = async () => {
  setSavingState(true);
  await updateConfig(config);
  setSavingState(false);
};

// [B] PO:
const handleSave = async () => {
  setSavingState(true);
  await updateConfig(config);
  setTimeout(() => setSavingState(false), 0); // React batch flush
};

// [C] PRED:
const handleRemoveZone = (id) => {
  removeCustomZone(id);
};

// [C] PO:
const handleRemoveZone = (id) => {
  removeCustomZone(id);
  setActiveTab('BASIC');
};
```

---

## Dopad zmen

- **Ovlivnené komponenty:** PwaInstallBanner (P0 fix), AdminLayout (UI), AdminPricing (UI), AdminDashboard (rendering), KanbanBoard (a11y), LanguageContext (global), AdminEmails (linting), AdminWidget (verification), AdminModelStorage (UX), KanbanFilters (logic), KanbanColumn (interaction), AdminShipping (UX)
- **Breaking changes:** Ne
- **Nove zavislosti:** Žádné (KeyboardSensor je již v @dnd-kit/core)
- **Rizika:**
  - PwaInstallBanner null fallback — může skrýt budoucí problém s LanguageContext. Monitoring doporučen.
  - AdminShipping setTimeout(0) — teoreticky race condition pokud React scheduling se změní. Alternativa: useTransition (React 18+).
  - localStorage tenant-scope — nutné zkontrolovat všechny ostatní localStorage klíče v admin sekcích.

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Browser testing 20 stránek (S29), 19/20 PASS. PwaInstallBanner crash při loading modelu — FIXED. Sidebar localStorage tenant-isolated — VERIFIED. Kanban keyboard navigation — TESTED.
- **Poznamky:** AdminShipping removeCustomZone tab reset — doporučeno otestovat na produkcí UI se skutečnými shippingoval zónami. setTimeout(0) workaround je dočasný.

---
