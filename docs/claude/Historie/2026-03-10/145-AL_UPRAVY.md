# 145-AL — UPRAVY — Admin Layout & Sidebar — 2026-03-10

## Metadata
- **ID:** 145-AL
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin Layout (Sidebar, Navigation, Groups, Search)
- **Souvisejici ID:** 146 (Confetti animation)
- **Trigger:** Implementace batch 11 — vylepšení navigace a UX v admin panelu

---

## Souhrn uprav

Vylepšen admin sidebar s collapsible funkcionalitou, skupinami navigačních položek, vyhledáváním a ikonkovým režimem. Přidány klávesové zkratky (Ctrl+B pro toggle), localStorage persistence, aktivní route indikátor (teal), tooltips pro collapsed stav a responsivní design.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/components/AdminLayout.jsx` | Zmeneno | 1-280 | Nový sidebar system s collapse, groups, search, shortcuts, localStorage |
| 2 | `src/components/AdminLayout.css` | Zmeneno | 1-350 | Styly pro sidebar (260px/64px modes), animations, tooltips, dark theme |
| 3 | `src/lib/navigationGroups.js` | Nový soubor | 1-85 | Definice 4 skupin: Hlavní, Produkty, Design, Systém |
| 4 | `.claude/skills/admin-sidebar/SKILL.md` | Nový soubor | - | Skill dokumentace pro sidebar manipulaci |

---

## Detailni zmeny

### 1. `src/components/AdminLayout.jsx`

**Typ:** Zmeneno (major refactor + feature expansion)
**Radky:** 1-280
**Duvod:** Implementace collapsible sidebar s groupami, searchem, keyboard shortcuty a localStorage persistence

**Co se zmenilo:**
- Přidán `useSidebarState` hook - třístav: full, collapsed, hidden (Ctrl+B toggle)
- Přidán `useKeyboardShortcut` pro Ctrl+B listener
- Implementovány 4 navigační skupiny: Hlavní (5 items), Produkty (4), Design (2), Systém (7)
- Přidána search funkcionalita (case-insensitive, live filtrování)
- Collapsible groups s chevron animací (150ms transition)
- localStorage persistence (`adminSidebarState`, `sidebarCollapsed`)
- Aktivní route teal indicator (border-left 3px)
- Icon-only mode (64px) s tooltips na hover
- Responsive breakpoint (768px hide sidebar na mobile)

**Pred:**
```jsx
// Statické menu bez grouping, search, collapse
<nav className="admin-sidebar">
  <Link to="/admin/dashboard">Dashboard</Link>
  <Link to="/admin/pricing">Pricing</Link>
  {/* ... */}
</nav>
```

**Po:**
```jsx
// Dynamické groupy, search, collapse, shortcuts
<nav className="admin-sidebar" data-state={sidebarState}>
  <SearchInput onChange={handleSearch} />
  {navigationGroups.map(group => (
    <SidebarGroup key={group.id} group={group} isOpen={expandedGroups[group.id]} />
  ))}
</nav>
```

---

### 2. `src/components/AdminLayout.css`

**Typ:** Zmeneno
**Radky:** 1-350
**Duvod:** Styly pro nový sidebar design

**Co se zmenilo:**
- `.admin-sidebar[data-state="full"]` - 260px width, detailní text
- `.admin-sidebar[data-state="collapsed"]` - 64px width, only icons
- `.sidebar-group` - collapsible container (max-height transition)
- `.sidebar-item` - active state s teal `border-left: 3px`
- `.sidebar-group__header` - chevron animace (rotate 180° open/close)
- `.sidebar-item--icon-only` - tooltip na hover (position absolute)
- Tooltip opacity transition (0s → 1s delay 500ms)
- Dark theme colors: `--forge-bg-secondary`, `--forge-text-muted`
- Responsive: `@media (max-width: 768px)` - hide sidebar

---

### 3. `src/lib/navigationGroups.js` (Nový soubor)

**Typ:** Nový soubor
**Radky:** 1-85
**Duvod:** Centralizace navigační struktury pro snadnější údržbu

**Co se zmenilo:**
- Exportuje `navigationGroups` array s 4 skupinami
- Každá skupipa má `id`, `label`, `icon`, `items[]`
- Každý item má `label`, `path`, `icon`, `badge?`
- Skupiny:
  - Hlavní: Dashboard, Orders, Analytics, Team, Widgets
  - Produkty: Pricing, Parameters, Presets, Materials
  - Design: Branding, Integrations, Shipping
  - Systém: Settings, Migration, Health, Model Storage

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminLayout (parent), všechny admin stránky (child routes)
- **Breaking changes:** Ne, sidebar je wrapper
- **Nove zavislosti:** `navigationGroups` z `lib/navigationGroups.js`
- **Rizika:** localStorage persistence na starších prohlížečích (IE11), tooltips overflow na malých displejích

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Ctrl+B toggle, search v navigaci, group collapse/expand, active route highlight, responsive testování
- **Poznamky:** Widget sidebar je oddělen (viz batch 12)

---
