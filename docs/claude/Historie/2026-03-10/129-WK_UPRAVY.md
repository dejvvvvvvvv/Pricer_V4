# 129-WK — UPRAVY — Widget Sync — Build Plate + Mesh Repair portovány — 2026-03-10

## Metadata
- **ID:** 129-WK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Widget-Kalkulacka (Synchronizace s test-kalkulackou)
- **Souvisejici ID:** 114-3D (Build Plate + Mesh Repair source), 128-GN (File Upload), 127-TK (Print Viz batch source)
- **Trigger:** Autonomní implementace — batch 6, Widget Sync pokračování z batch 5

---

## Souhrn uprav

Portování Build Plate Vieweru a Mesh Repair do widget-kalkulacky/components/ModelViewer.jsx. Přidání builderMode prop do widget entry pointu (index.jsx) pro disable tabs v embedovaném prostředí. Synchronizace UI (tabs, buttons, colors) s tenant accent theme pomocí CSS variables.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/widget-kalkulacka/components/ModelViewer.jsx` | Zmeneno | 1-850+ | Přidány Build Plate tab + MeshRepairPanel, CSS vars pro tenant colors, builderMode prop handling |
| 2 | `src/pages/widget-kalkulacka/index.jsx` | Zmeneno | 60-80 | Přidán builderMode prop, passed to Step1/Step2, disable tabs v embed modu |

---

## Detailni zmeny

### 1. `src/pages/widget-kalkulacka/components/ModelViewer.jsx`

**Typ:** Zmeneno (major update)
**Radky:** 1-850+
**Duvod:** Portování Build Plate Viewer + Mesh Repair z test-kalkulacka pro widgetovou kalkulačku, unifikace vizuálního chování

**Co se zmenilo:**
- Přidán tab systém (Model Viewer / Build Plate / Mesh Repair) — shodný s test-kalkulackou verzí
- Build Plate tab: 250×210mm grid, orbit controls, auto-orient Fibonacci sphere, dimension labels, shadows
- Mesh Repair tab: MeshRepairPanel komponenta (analýza, oprava, auto-orient, export STL)
- **Tenant theme integraci:** CSS variables `--widget-btn-bg`, `--widget-btn-hover`, `--widget-accent-color` (fallback z tenant branding)
- **builderMode prop:** Tabs disabled (opacity 0.5, pointer-events none) když je builder=false v widgetu
- **Widget-specific modifikace:**
  - Button styly přes CSS vars místo Tailwind (`bg-[--widget-btn-bg]` → `var(--widget-btn-bg)`)
  - Barvy ikony a textu adaptují se na tenant accent (orange/teal/custom)
  - Tab switching bez refresh (useState tabIndex)
  - Error boundary kolem WebGL (fallback "Viewer Error")

**Fragment kodu:**

```jsx
// PRED: Only Model Viewer tab
<div className="canvas-container">
  <Canvas>{/* viewer */}</Canvas>
</div>

// PO: Tab system with Build Plate + Mesh Repair
const [activeTab, setActiveTab] = useState('model');
<div className="viewer-tabs">
  <button
    disabled={builderMode === false}
    onClick={() => setActiveTab('model')}
    style={{ opacity: builderMode === false ? 0.5 : 1 }}
  >
    Model Viewer
  </button>
  <button
    disabled={builderMode === false}
    onClick={() => setActiveTab('build')}
  >
    Build Plate
  </button>
  <button
    disabled={builderMode === false}
    onClick={() => setActiveTab('repair')}
  >
    Mesh Repair
  </button>
</div>

{activeTab === 'model' && <Canvas>{/* viewer */}</Canvas>}
{activeTab === 'build' && <BuildPlateViewer model={model} />}
{activeTab === 'repair' && <MeshRepairPanel model={model} />}
```

**CSS vars:**
```css
:root {
  --widget-btn-bg: var(--forge-button-bg, #f0f0f0);
  --widget-btn-hover: var(--forge-button-hover, #e0e0e0);
  --widget-accent-color: var(--forge-accent, #ff6600);
}
```

---

### 2. `src/pages/widget-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 60-80
**Duvod:** Propagace builderMode prop do komponent, control tab visibility v embedded widget

**Co se zmenilo:**
- Přidání `builderMode` prop do top-level state (default: true = All tabs enabled)
- Přidán query parameter `?builder=false` → disable tabs pro veřejný embed (bez tab switching)
- Passed `builderMode={builderMode}` do `<Step1 {...} />` a `<Step2 {...} />`
- Step2 (ModelViewer) respektuje builderMode a skrývá tab buttony

**Fragment kódu:**

```jsx
// PRED:
const [currentStep, setCurrentStep] = useState(1);
// ...
return <ModelViewer model={uploadedModel} />;

// PO:
const [currentStep, setCurrentStep] = useState(1);
const searchParams = new URLSearchParams(window.location.search);
const builderMode = searchParams.get('builder') !== 'false';

// ...
return <ModelViewer model={uploadedModel} builderMode={builderMode} />;
```

---

## Dopad zmen

- **Ovlivnene komponenty:** ModelViewer.jsx, Step2.jsx (widget), BuildPlateViewer, MeshRepairPanel
- **Breaking changes:** Ne — props jsou optional, default behavior bez zmeny
- **Nove zavislosti:** Žádné (uses existing Three.js, meshRepair.js utility)
- **Rizika:**
  - WebGL performance v embedovaném iframu (mitigation: requestAnimationFrame throttle)
  - Tenant accent colors: fallback do Forge defaults pokud nejsou dostupné
  - Builder mode: Musí se korektně propagovat z AdminWidget settings

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - Widget bez builderMode prop (default): tabs jsou viditelné ✅
  - Widget s ?builder=false: tabs disabled (opacity), non-clickable ✅
  - Build Plate grid renders s korektními dimenzemi (250×210) ✅
  - Mesh Repair panel: analyze/repair/export funkční ✅
  - Tenant colors aplikované z CSS vars ✅
- **Poznamky:**
  - Widget embedding test pending (full iframe setup s postMessage)
  - Performance test s velkými modely pending
  - Dark mode CSS vars verification pending

---

## Prislusne soubory z batch 6

- ID 130: Backend Mesh Repair + Analyze API (runPrusaRepair.js, mesh.js routes)
- ID 131: Breadcrumb Navigation + Clickable Stepper (test-kalkulacka UX upgrade)

---

<!-- KONEC ZAZNAMU -->
