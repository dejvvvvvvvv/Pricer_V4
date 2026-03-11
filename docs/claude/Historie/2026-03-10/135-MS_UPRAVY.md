# 135-MS — UPRAVY — Model-Storage — 2026-03-10

## Metadata
- **ID:** 135-MS
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Model-Storage
- **Souvisejici ID:** 115 (Roadmap plán s touto feature), 132 (Batch 6 session)
- **Trigger:** Batch 8 autonomní implementace — Gallery view s list/grid toggle dle roadmapu

---

## Souhrn uprav

Implementace list/grid toggle view pro Admin Model Storage s responsive CSS grid layoutem, image thumbnails, type badges, a sessionStorage persistence. Přidány akce v grid view (checkboxes, hover actions, sort bar).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/pages/admin/AdminModelStorage.jsx` | Zmeneno | 1-80 | Přidání state pro viewMode, toggle button, conditional rendering list/grid |
| 2 | `src/components/FileListPanel.jsx` | Zmeneno | 1-100 | Grid view layout, responsive CSS grid, hover overlay, checkbox handling |
| 3 | `src/components/FileToolbar.jsx` | Zmeneno | 50-80 | View mode toggle button (list/grid icons), sessionStorage persistence |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminModelStorage.jsx`

**Typ:** Zmeneno
**Radky:** 1-80
**Duvod:** Přidání view mode managementu (list vs grid) a UI controlu

**Co se zmenilo:**
- Nový state: `const [viewMode, setViewMode] = useState('list')` (ze sessionStorage fallback)
- useEffect na mount: obnoví viewMode z sessionStorage('adminViewMode')
- Funkce toggleViewMode(): přepne list ↔ grid, uloží do sessionStorage
- Conditional render: `{viewMode === 'list' ? <FileListPanel /> : <FileGridPanel />}`
- FileToolbar prop: `onViewModeChange={toggleViewMode}` + `viewMode={viewMode}`

---

### 2. `src/components/FileListPanel.jsx`

**Typ:** Zmeneno
**Radky:** 1-100
**Duvod:** Transformace na list i grid view — přidání CSS grid pro grid mode

**Co se zmenilo:**
- Struktura: oddělení logiky pro grid mode (nový CSS grid layout místo flex/table)
- Grid mode CSS: `display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;`
- Nový FileGridItem komponenta pro grid view:
  - Image thumbnail přes getPreviewUrl() (PNG/JPG)
  - Cube icon pro 3D soubory (STL/OBJ)
  - TypeBadge (barevný dle typu: STL=blue, OBJ=green, PNG=yellow, JPG=orange)
  - Checkbox overlay (top-left, opacity 0 → 1 na hover)
  - Název souboru pod thumbnail (max-width s ellipsis)
  - Hover actions: Edit, Delete, Download (3 ikony v overlay)
- List mode: zachová stávající tabulkový layout
- Sort bar: možnost filtrovat/třídit (stejná logika jako list)
- Responsive: `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))` na mobile

---

### 3. `src/components/FileToolbar.jsx`

**Typ:** Zmeneno
**Radky:** 50-80
**Duvod:** Přidání view mode toggle button

**Co se zmenilo:**
- Nový toggle button v toolbaru: List Icon (☰) + Grid Icon (⊞)
- Button text: "List" / "Grid" + ikona
- onClick handler: `onViewModeChange()`
- SessionStorage integration: `sessionStorage.setItem('adminViewMode', newMode)`
- CSS: Forge Design button styling, hover state
- Aria-label: "Switch to grid view" / "Switch to list view"

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminModelStorage (parent), FileListPanel, FileToolbar, FileGridItem (nová)
- **Breaking changes:** Ne — existující list view zachován, pouze přidán grid view
- **Nove zavislosti:** Žádné (pure React, CSS Grid)
- **Rizika:** SessionStorage persistence — nutno testovat cross-browser localStorage kompatibilitu

---

## Testovani

- **Build:** Očekáváno PASS (import souboru, CSS)
- **Manual test:**
  - Toggle button funguje a přepíná list ↔ grid
  - Grid layout se zobrazuje správně (3 sloupce desktop, 2 tablet, 1 mobile)
  - Thumbnail se načítají (fallback na default ikona)
  - Checkboxes se zvolí/odvolí v obou views
  - ViewMode se uloží do sessionStorage a obnoví po reload
  - Hover actions jsou viditelné a kliknutelné

---
