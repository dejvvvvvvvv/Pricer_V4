# 115-GN — PLAN — Dalších 10+ Implementací Test-Kalkulacky a Administrace — 2026-03-10

## Metadata
- **ID:** 115-GN
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** General Planning (Multi-Feature Roadmap)
- **Souvisejici ID:** 113-GN (iniciační plán), 114-3D_UPRAVY (3 dokončené features)
- **Trigger:** Post-Implementation Roadmap — plánování dalších 10+ vylepšení na základě autonomní session

---

## Tema planu

Soubor 10+ features pro rozšíření test-kalkulacky a administračního panelu. Zaměření na UX vylepšení, pokročilé nástroje pro uživatele a analytics pro admin.

---

## Priorita a scope

### P0 (Kritické — vzít do dalšího sprintu)
1. **Drag & Drop reorder souborů** — přetahování pořadí nahraných modelů
2. **Model rozměry overlay** — zobrazení rozměrů přímo v 3D vieweru
3. **Responsive kalkulačka** — mobile-optimized layout

### P1 (Vysoká priorita — 3-4 týdny)
4. **Pokročilý ceník breakdown** — vizuální breakdown ceny (pie/bar chart)
5. **Keyboard shortcuts** — klávesové zkratky (Enter=slice, Esc=cancel, atd.)
6. **Dark/Light theme toggle** — přepínání motivu v kalkulačce
7. **Auto-save konfigurace** — automatické ukládání nastavení tisku

### P2 (Střední — lze paralelizovat)
8. **Model comparison** — porovnání dvou modelů vedle sebe
9. **Print time estimation vizualizace** — progress bar s odhadem po vrstvách
10. **Batch export** — hromadný export nabídek (CSV/PDF)

### P3 (Nižší — budoucí)
11. **Admin Dashboard grafy** — vylepšení analytics (objednávky, tržby)
12. **Notification center** — centrální centrum notifikací
13. **Model thumbnails cache** — generování a cachování náhledů

---

## Detailny popis kazdé implementace

### 1. Drag & Drop Reorder Souborů

**Priorita:** P0
**Uroven: 6h (spec agent + 2h test)**

**Popis:**
Uživatelé mohou přetahovat pořadí nahraných souborů v multi-file upload seznamu. Vizuální feedback (shadow, opacity change), smooth animation, persistence v session storage.

**Komponenty:**
- `FileUploadList.jsx` — nový nebo update existujícího
- `useSortableFiles.js` — custom hook s drag state
- Integrace s react-beautiful-dnd (či vlastní řešení)

**Výstupy:**
- Reordered file array → passed to pricing engine
- Session persistence: `localStorage.files_order`

**Rizika:** Browser drag API compatibility, mobile touch handling

---

### 2. Model Rozměry Overlay

**Priorita:** P0
**Uroven: 4h (spec agent + 1h test)**

**Popis:**
Zobrazení bounding box rozměrů modelu (width × height × depth) přímo v 3D vieweru. Overlay s editable inputy (pro scale adjustment). Sync s pricing engine (volume recalc).

**Komponenty:**
- `ModelDimensionsOverlay.jsx` — nový UI widget
- Integrace do `ModelViewer.jsx` (both tabs)
- Hook: `useBoundingBox()` — compute z geometry

**Výstupy:**
- Display: 250.5 × 210.0 × 50.3 mm
- Editable: scale factor, manual override
- Callback: `onDimensionsChange(newDims)` → pricing engine

**Rizika:** Precision issues (floating point), geometry corner cases

---

### 3. Responsive Kalkulačka

**Priorita:** P0
**Uroven: 8h (mid agent + 3h test)**

**Popis:**
Kompletní mobile-optimized redesign test-kalkulacky. Fluid layout (flexbox), touch-friendly buttons (48px+), collapsible sections, vertical step progression na mobilu vs. horizontal na desktopu.

**Komponenty:**
- Redesign `index.jsx` layout (grid → flexbox)
- Mobile nav: bottom tab bar (Steps 1-5)
- Collapsible "Advanced Options"
- Touch-friendly file upload (drag & drop support)
- Responsive ModelViewer (full width na mobile)
- CSS media queries: `@media (max-width: 768px)` breakpoints

**Výstupy:**
- Mobile-first CSS refactor (src/pages/test-kalkulacka/styles.css)
- Touch event handlers (optional: Hammerjs)
- Viewport meta tags (already set?)
- A11y: touch target sizing

**Rizika:** Layout shift bugs, performance on low-end devices

---

### 4. Pokročilý Ceník Breakdown

**Priorita:** P1
**Uroven: 6h (spec agent + 2h test)**

**Popis:**
Vizuální breakdown ceny po komponentách (material cost, time cost, fees, tax, discount) jako pie chart či horizontální bar chart. Click na segment → detail layer (marginální náklady, atd.).

**Komponenty:**
- `PriceBreakdownChart.jsx` — nový (uses Recharts či Chart.js)
- Integrace do Step 4 (Cena) v test-kalkulačce
- Hook: `usePriceBreakdown()` — extract z pricing engine

**Výstupy:**
- Chart: SVG/Canvas (responsive)
- Legend: interactive (toggle segments)
- Detail layer: "Material: CZK 450 (45%), Time: CZK 300 (30%), Fees: CZK 150 (15%), Tax: CZK 100 (10%)"
- Export: chart image (PNG)

**Rizika:** Chart library bundle size, accessibility (chart description)

---

### 5. Keyboard Shortcuts

**Priorita:** P1
**Uroven: 4h (spec agent + 1h test)**

**Popis:**
Global keyboard shortcuts: Enter (slice/calculate), Esc (reset), Ctrl+S (save config), Ctrl+E (export), Ctrl+? (help/shortcuts list). Accessibility: visible shortcut hints in UI.

**Komponenty:**
- Hook: `useKeyboardShortcut()` (already exists? verify)
- Global shortcut handler (App.jsx level)
- Shortcut dialog: `ShortcutsHelp.jsx`
- Hint badges na tlačítkách (hidden by default, toggle via ?)

**Výstupy:**
- Shortcut map: global registry
- Dialog: list s klávesami + descriptions
- Toast: "Shortcut executed: [action]" (optional)

**Rizika:** Conflict s browser shortcuts (F12, Ctrl+Shift+I), IME composing

---

### 6. Dark/Light Theme Toggle

**Priorita:** P1
**Uroven: 5h (spec agent + 1.5h test)**

**Popis:**
Přepínání mezi tmavým a světlým motivem v test-kalkulačce. Persisted v localStorage/Supabase. Dynamická CSS (CSS variables override). Compatible s Forge design tokens.

**Komponenty:**
- `ThemeContext.jsx` — nový context (či extend existujícího LanguageContext)
- `useTheme()` hook
- Toggle button (header či settings)
- CSS overrides (light theme: inverzní --forge-bg-*, colors)
- Integration: App.jsx, all pages

**Výstupy:**
- CSS variables runtime override (data-theme="light|dark")
- Persisted: `localStorage.user:theme`
- System preference detection (prefers-color-scheme)
- Forge compatibility: light tokens pre-defined (optional: vs tailwind)

**Rizika:** CSS variable browser support (IE edge case, likely minimal), flash on page load

---

### 7. Auto-Save Konfigurace

**Priorita:** P1
**Uroven: 5h (spec agent + 1.5h test)**

**Popis:**
Automatické ukládání nastavení tisku (material, support, infill, temperature) při každé změně. Debounced (500ms). Toast: "Konfigurace uložena" (muted, corner). Load from session na start.

**Komponenty:**
- Hook: `useAutoSave()` — generický auto-save wrapper
- Integration: material select, support toggle, infill slider, temp input
- Storage: `modelConfig:v1` key (adminTenantStorage)
- Debounce: 500ms, avoid flicker

**Výstupy:**
- Form state synced to storage
- Load on component mount
- Toast feedback (optional, muted)
- Export config as JSON/preset

**Rizika:** Race conditions (rapid changes), quota exceeded (localStorage), stale data sync

---

### 8. Model Comparison

**Priorita:** P2
**Uroven: 8h (mid agent + 2h test)**

**Popis:**
Dual viewer: porovnání dvou modelů vedle sebe. Synchronized orbit controls. Overlay stats (side-by-side dimensions, volume, price). Slider toggle (100% | 50%-50% | 100%).

**Komponenty:**
- `DualModelViewer.jsx` — nový (2× ModelViewer)
- `ComparisonStats.jsx` — side-by-side table (dims, volume, cost)
- `useSharedOrbitControl()` — sync controls
- Optional: slider for 50%-50% split view

**Výstupy:**
- Route: `/test-kalkulacka?compare=true&file1=id1&file2=id2`
- Sync: rotation, zoom, pan
- Stats: dynamic update per config change
- Export: comparison report (PDF, side-by-side screenshots)

**Rizika:** Performance (2× WebGL contexts), touch sync complexity

---

### 9. Print Time Estimation Vizualizace

**Priorita:** P2
**Uroven: 6h (spec agent + 1.5h test)**

**Popis:**
Vizuální progress bar s odhadem doby tisku po vrstvách. Hover detail: "Layer 25/100, 45 min elapsed, 78 min remaining, temp 220°C". Animovaný progress (linear vs. curve fitting).

**Komponenty:**
- `PrintTimeEstimationBar.jsx` — nový
- Integration do Step 3 či 4 (estimate display)
- Hover detail layer
- Optional: time-lapse animation (show layer-by-layer)

**Výstupy:**
- Progress bar: 0-100%, color coded (green → yellow → orange → red per progress)
- Tooltip: detailed layer stats
- Animation: smooth linear (or curve-fitted per gcode complexity)

**Rizika:** Estimation accuracy (depends on slicer), large model performance

---

### 10. Batch Export

**Priorita:** P2
**Uroven: 7h (spec agent + 2h test)**

**Popis:**
Hromadný export cenových nabídek pro více modelů najednou. Formáty: CSV (tabulka), PDF (multipage, branded). Include: model name, dimensions, time, cost, tax, total.

**Komponenty:**
- `BatchExportModal.jsx` — nový
- `exportToCSV()`, `exportToPDF()` utilities
- Checkbox selection (multiple files)
- Template options (minimal/detailed)

**Výstupy:**
- CSV: columns (name, dims, time, material_cost, labor_cost, total_price, tax, final_price)
- PDF: branded header (logo, tenant name), one quote per page, footer (date, signature space)
- File: `quotes_2026-03-10.csv` či `.pdf`

**Rizika:** PDF generation library (pdfkit? html2pdf?), large batch performance

---

### 11. Admin Dashboard Grafy

**Priorita:** P3
**Uroven: 8h (mid agent + 2h test)**

**Popis:**
Vylepšení AdminDashboard s reálnými grafy: objednávky za měsíc (bar), tržby trend (line), top materiály (pie), customer acquisition (curve). Data z Supabase/Firebase.

**Komponenty:**
- `OrdersChart.jsx`, `RevenueChart.jsx`, `MaterialsChart.jsx`, `AcquisitionChart.jsx`
- Hook: `useAdminAnalytics()` — query Supabase
- Recharts integration (či alternative)
- Time range selector (last 7/30/90 days)

**Výstupy:**
- 4 charts, responsive
- Real-time updates (WebSocket či polling)
- Export: PNG (chart image)

**Rizika:** Data volume (large order count), query performance, chart library size

---

### 12. Notification Center

**Priorita:** P3
**Uroven: 6h (spec agent + 1.5h test)**

**Popis:**
Centrální centrum notifikací v admin panelu. Inbox: order updates, payment notifications, system alerts. Grouped by date/type. Mark as read, delete, reply (modal).

**Komponenty:**
- `NotificationCenter.jsx` — nový (modal/drawer)
- `NotificationList.jsx`, `NotificationDetail.jsx`
- Integration: AdminLayout (header icon + badge count)
- Hook: `useNotifications()` — Supabase subscriptions

**Výstupy:**
- Drawer/modal with notification list
- Grouping: date/type
- Actions: mark read, delete, reply (order-specific)
- Badge: unread count

**Rizika:** Real-time sync complexity, quota on subscriptions

---

### 13. Model Thumbnails Cache

**Priorita:** P3
**Uroven: 7h (mid agent + 2h test)**

**Popis:**
Generování a cachování thumbnail náhledů modelů (300×300px, JPG/WebP). Auto-generate on upload, cache v lokálním storage/IndexedDB či Supabase. Lazy-load v seznamech (e.g., AdminOrders models column).

**Komponenty:**
- Utility: `generateThumbnail(geometry)` — Three.js render to canvas → blob
- Hook: `useThumbnailCache()` — manage cache
- Integration: FileUploadList, AdminOrders, model lists
- Storage: IndexedDB (namespace: `thumbnails`) či Supabase bucket

**Výstupy:**
- Thumbnail blob: 300×300px JPG (~50-100KB)
- Cache key: `thumb_{fileId}_300.jpg`
- Fallback: placeholder svg if generation fails

**Rizika:** IndexedDB quota (50MB+ per origin), thumbnail quality variability

---

## Plán implementace (fáze)

### Fáze 1: P0 Features (1-2 týdny)
- 1. Drag & Drop Reorder
- 2. Model Rozměry
- 3. Responsive Kalkulačka
- **Checkpoint:** Browser test, build PASS, dokumentace

### Fáze 2: P1 Features (2-3 týdny)
- 4. Pokročilý Ceník
- 5. Keyboard Shortcuts
- 6. Dark/Light Theme
- 7. Auto-Save Config
- **Checkpoint:** Unit testy, integration testy, build PASS

### Fáze 3: P2 Features (2 týdny)
- 8. Model Comparison
- 9. Print Time Viz
- 10. Batch Export
- **Checkpoint:** E2E testy, performance profiling

### Fáze 4: P3 Features (1-2 týdny — paralelně s Fází 2-3)
- 11. Admin Grafy
- 12. Notification Center
- 13. Thumbnail Cache
- **Checkpoint:** Build PASS, dokumentace, release ready

---

## Závislosti a ordem

```
Fáze 1 (P0)
  ├─ 1. Drag & Drop (standalone)
  ├─ 2. Model Rozměry (independent)
  └─ 3. Responsive (cross-cutting) ← musí se dělat poslední v Fázi 1

Fáze 2 (P1)
  ├─ 4. Pokročilý Ceník (standalone)
  ├─ 5. Keyboard Shortcuts (global, nezávislé)
  ├─ 6. Dark/Light Theme (global, cross-cutting)
  └─ 7. Auto-Save (standalone)

Fáze 3 (P2)
  ├─ 8. Model Comparison (uses ModelViewer)
  ├─ 9. Print Time Viz (uses pricing engine)
  └─ 10. Batch Export (uses pricing engine + export utils)

Fáze 4 (P3) — paralelizovatelné
  ├─ 11. Admin Grafy (Supabase queries)
  ├─ 12. Notification Center (Supabase subscriptions)
  └─ 13. Thumbnail Cache (IndexedDB)
```

---

## Přiřazení agentů (doporučeno)

| Feature | Agent | Trvání | Notes |
|---------|-------|--------|-------|
| 1. Drag & Drop | `mp-spec-frontend-dnd` (haiku) | 6h | DND library selection |
| 2. Model Rozměry | `mp-spec-3d-viewer` (haiku) | 4h | Geometry math |
| 3. Responsive | `mp-mid-frontend-responsive` (sonnet) | 8h | Cross-feature coordination |
| 4. Pricing Chart | `mp-spec-frontend-charting` (haiku) | 6h | Recharts integration |
| 5. Keyboard | `mp-spec-frontend-ux` (haiku) | 4h | Accessibility |
| 6. Theme | `mp-spec-frontend-theming` (haiku) | 5h | CSS vars, context |
| 7. Auto-Save | `mp-spec-storage-persistence` (haiku) | 5h | Storage utils |
| 8. Comparison | `mp-mid-frontend-viewer` (sonnet) | 8h | Dual context sync |
| 9. Print Time | `mp-spec-frontend-ux` (haiku) | 6h | Animation, tooltips |
| 10. Batch Export | `mp-spec-ecommerce-export` (haiku) | 7h | PDF/CSV libs |
| 11. Admin Grafy | `mp-mid-admin-analytics` (sonnet) | 8h | Supabase queries + charting |
| 12. Notifications | `mp-mid-admin-notifications` (sonnet) | 6h | Real-time subscriptions |
| 13. Thumbnails | `mp-spec-storage-cache` (haiku) | 7h | IndexedDB, Three.js render |

**Celkem:** ~87 hodin (11 haiku agenti, 4 sonnet agenti)
**Paralelizace:** 3-4 agenti zároveň → ~25-30 hodin kalendarního času

---

## Dokumentace (postupná)

Po každé Fázi se vytvoří/aktualizují:
- `docs/claude/Documentation/Test-Kalkulacka-Dokumentace.md` (Fáze 1, 2)
- `docs/claude/Documentation/Admin-Dashboard-Dokumentace.md` (Fáze 4)
- Nové: `docs/claude/Documentation/Keyboard-Shortcuts.md` (Fáze 2)
- Nové: `docs/claude/Documentation/Theme-System.md` (Fáze 2)
- Nové: `docs/claude/Documentation/Model-Comparison.md` (Fáze 3)
- Historie záznamy po každé Fázi (CP1/CP2/CP3 compliance)

---

## Risk Register

| Risk | Pravděpodobnost | Dopad | Mitigation |
|------|-----------------|-------|-----------|
| Responsive design narušení (desktop) | Střední | Vysoký | Comprehensive visual regression testing |
| DND library API churn | Nízká | Střední | Abstraction layer (custom hook) |
| Chart performance (large datasets) | Střední | Střední | Lazy rendering, virtual scrolling |
| Theme persistence bugs | Nízká | Nízký | Unit + E2E testy, manual smoke |
| Real-time notification latency | Střední | Nízký | Queue + debounce (user acceptable) |
| IndexedDB quota exceeded | Nízká | Nízký | Quota check + user warning |

---

## Definition of Done (per Fáze)

- [ ] Všechny features Fáze implementovány
- [ ] `npm run build` → PASS
- [ ] Unit testy (vitest) → 80%+ pokrytí
- [ ] Browser/smoke testy → OK (Chrome, Firefox, Safari, mobile)
- [ ] Dokumentace aktualizována
- [ ] Historie uložena (CP1/CP2/CP3)
- [ ] Code review done (senior agent review či manual)
- [ ] Performance benchmark (if applicable)
- [ ] A11y check (WCAG AA)
- [ ] Git commit + PR (if applicable)

---

<!-- KONEC SABLONY — PLAN DOKONČEN -->
