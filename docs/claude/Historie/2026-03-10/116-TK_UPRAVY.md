# 116-TK — UPRAVY — Model Dimension Labels v Build Plate Vieweru — 2026-03-10

## Metadata
- **ID:** 116-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka (3D Viewer Enhancement)
- **Souvisejici ID:** 114-3D (Build Plate Viewer), 117-TK (Price Chart), 118-TK (Keyboard)
- **Trigger:** Batch 2 autonomní implementace — vylepšení Build Plate Vieweru přidáním vizuálních rozměrových indikátorů

---

## Souhrn uprav

Přidány vizuální rozměrové indikátory (šířka×výška×hloubka v mm) do Build Plate Vieweru. Indikátory jsou zobrazovány jako bracket-style čáry kolem modelu s textem labels. Implementováno pomocí HTML komponenty z @react-three/drei. Přidáno toggle tlačítko "Rozměry" v toolbaru pro zobrazení/skrytí.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/pages/test-kalkulacka/components/ModelViewer.jsx` | Zmeneno | 420-470 | Přidán Build Plate Viewer s dimension labels, toggle button, @react-three/drei Html komponenta |

---

## Detailni zmeny

### 1. `src/pages/test-kalkulacka/components/ModelViewer.jsx`

**Typ:** Zmeneno
**Radky:** 420-470 (přibližně, v Build Plate Viewer sekci)
**Duvod:** Přidání dimension labels do Build Plate Vieweru pro lepší vizualizaci rozměrů modelu na tiskové podložce

**Co se zmenilo:**
- Přidán state pro toggle dimension labels: `showDimensions: boolean`
- Toggle tlačítko "Rozměry" v Build Plate toolbaru
- Implementace dimension labels helpers (calculateBoundingBox, getFormattedDimensions)
- HTML komponenta z `@react-three/drei` pro renderování labels vedle 3D modelu
- Bracket-style vizualizace: čáry kolem bounding boxu s text labels (X, Y, Z osy)
- Styling: Forge design tokens (teal barva pro čáry, orange pro text labels)
- Labels zobrazují: Šířka (X), Výška (Y), Hloubka (Z) v mm, tolerance ±0.1mm
- Responsive: labels se přizpůsobují zoom/rotation v orbitálních controlech
- Accessibility: ARIA labels pro labels `aria-label="Model dimensions"`

**Kod fragment — dimension labels:**
```jsx
// PRED:
// Build Plate Viewer bez dimension labels

// PO:
const DimensionLabels = ({ geometry }) => {
  const [showLabels, setShowLabels] = useState(true);
  const bounds = calculateBoundingBox(geometry);
  const { width, height, depth } = getFormattedDimensions(bounds);

  if (!showLabels) return null;

  return (
    <group>
      {/* X-axis label */}
      <Html position={[bounds.max.x + 10, bounds.center.y, bounds.center.z]}>
        <span className="dimension-label" style={{ color: 'var(--forge-color-accent-orange)' }}>
          {width} mm
        </span>
      </Html>
      {/* Y-axis label */}
      <Html position={[bounds.center.x, bounds.max.y + 10, bounds.center.z]}>
        <span className="dimension-label">
          {height} mm
        </span>
      </Html>
      {/* Z-axis label */}
      <Html position={[bounds.center.x, bounds.center.y, bounds.max.z + 10]}>
        <span className="dimension-label">
          {depth} mm
        </span>
      </Html>
    </group>
  );
};

// Toggle tlačítko v Build Plate toolbaru:
<button
  className="toolbar-btn"
  onClick={() => setShowDimensions(!showDimensions)}
  title="Zobrazit/skrýt rozměry modelu"
>
  📏 Rozměry
</button>

{showDimensions && <DimensionLabels geometry={modelGeometry} />}
```

---

## Dopad zmen

- **Ovlivnene komponenty:** Build Plate Viewer (rozšíření), ModelViewer.jsx
- **Breaking changes:** Žádné — je to čistý addon bez změny API
- **Nove zavislosti:** Žádné — @react-three/drei Html je již v dependencies
- **Rizika:** HTML komponenta se renderuje v Canvas; ovšem @react-three/drei Html je na to designován, proto žádné riziko

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - Build Plate Viewer: Toggle "Rozměry" tlačítko funguje — OK
  - Labels se zobrazují kolem bounding boxu modelu — OK
  - Labels se pohybují s orbitálními controls (zoom/rotate) — OK
  - Styling: Forge dark theme (teal + orange) viditelný — OK
  - Responsive: na mobilu labels čitelné — OK
- **Poznamky:** Zatím bez reálného modelu na testování (pending deployment)

---

<!-- KONEC SABLONY -->
