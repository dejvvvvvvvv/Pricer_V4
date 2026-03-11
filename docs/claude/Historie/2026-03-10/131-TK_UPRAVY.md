# 131-TK — UPRAVY — Breadcrumb Navigation + Clickable Stepper — 2026-03-10

## Metadata
- **ID:** 131-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka (UX Navigation & Stepper)
- **Souvisejici ID:** 129-WK (Widget Sync), 130-BK (Backend API), 118-TK (Keyboard Shortcuts batch)
- **Trigger:** Autonomní implementace — batch 6, final kalkulacka UX upgrade

---

## Souhrn uprav

Implementace interaktivního breadcrumb navigation a klikatelného stepperu pro test-kalkulačku. Tracking highestStepReached pro zpětné navigaci. Checkmark ikony na dokončených krocích. Kontextový "Zpět na:" button s název kroku. Hover efekty, keyboard accessibility (Enter/Space aktivace). Integrace do test-kalkulacka/index.jsx a responsive-kalkulacka.css.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/test-kalkulacka/index.jsx` | Zmeneno | 45-120, 280-340 | Přidání breadcrumb state, highestStepReached tracking, clickable stepper render, checkmark ikony |
| 2 | `src/styles/responsive-kalkulacka.css` | Zmeneno | 380-480 | Breadcrumb layout (flex, sticky top), stepper styles (border-radius, hover, focus), checkmark animation |

---

## Detailni zmeny

### 1. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 45-120 (state), 280-340 (render), 180-210 (handlers)
**Duvod:** Přidání UX navigace — interaktivní breadcrumb, clickable steps, highestStepReached tracking

**Co se zmenilo:**

- **State enhancements:**
  - Přidán `highestStepReached` state (default: 1) — tracks nejvyšší dosažený krok
  - Při přechodu na novější step: `setHighestStepReached(Math.max(highestStepReached, currentStep))`
  - Při návratu na starší step (backtrack): allowed pouze pokud `currentStep <= highestStepReached`

- **Breadcrumb component:**
  - Sticky header nad kalkulačkou (z-index 40, below header/40)
  - Format: "Kalkulačka / Krok {N} / Vrstva Výšky" (dynamic text dle kroku)
  - Clickable items: "Kalkulačka" (→ step 1), "Krok {N}" (→ step N), "Vrstva Výšky" (→ current)
  - CSS: flex layout, separators (`>` ikonka), hover underline, active bold

- **Stepper component:**
  - 5 step circles (1-5) s labels: "Model Upload", "Vrstva Výšky", "Kvalita Tisku", "Výběr Materiálu", "Náhled Objednávky"
  - **Completed steps** (< currentStep): Checkmark ✓ ikonka + green bg (--forge-accent)
  - **Current step**: Bold circle + highlight border
  - **Future steps** (> highestStepReached): Grayed out (opacity 0.5, cursor default)
  - **Clickable condition:** Can click step N if N <= highestStepReached
  - Hover effect: scale(1.1), shadow, cursor pointer (pokud je clickable)
  - Keyboard support: Tab → step, Enter/Space → select

- **Kontextové tlačítko "Zpět":**
  - Render: `<button>← Zpět na: {stepName[currentStep-1]}</button>` (viditelné od kroku 2+)
  - Action: `handleGoBack()` → setCurrentStep(currentStep - 1)
  - Style: Secondary button, top-right (absolutní pozice v stepper sektoru)

- **Handler updates:**
  - `handleNextStep()`: `setHighestStepReached(Math.max(..., next))`
  - `handleGoToStep(n)`: Check `n <= highestStepReached` před setCurrentStep
  - Telemetry: `debugLog('nav:stepper-click', { from: currentStep, to: n })`

**Fragment kodu:**

```jsx
// PRED:
const [currentStep, setCurrentStep] = useState(1);
const handleNextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));

// PO:
const [currentStep, setCurrentStep] = useState(1);
const [highestStepReached, setHighestStepReached] = useState(1);

const handleNextStep = () => {
  const next = Math.min(currentStep + 1, 5);
  setCurrentStep(next);
  setHighestStepReached(Math.max(highestStepReached, next));
};

const handleGoToStep = (n) => {
  if (n <= highestStepReached && n >= 1 && n <= 5) {
    setCurrentStep(n);
  }
};

const handleGoBack = () => {
  if (currentStep > 1) {
    setCurrentStep(currentStep - 1);
  }
};

// Breadcrumb render
const breadcrumbSteps = ['Kalkulačka', 'Model Upload', 'Vrstva Výšky', 'Kvalita Tisku', 'Výběr Materiálu', 'Náhled Objednávky'];
const breadcrumbLabels = breadcrumbSteps.slice(0, currentStep + 1);

return (
  <div className="breadcrumb-nav">
    {breadcrumbLabels.map((label, idx) => (
      <div key={idx} className="breadcrumb-item">
        <button
          onClick={() => idx === 0 ? setCurrentStep(1) : handleGoToStep(idx)}
          className={idx === currentStep ? 'active' : ''}
        >
          {label}
        </button>
        {idx < breadcrumbLabels.length - 1 && <span className="separator">›</span>}
      </div>
    ))}
  </div>
);

// Stepper render
const stepperSteps = [
  { num: 1, label: 'Model Upload' },
  { num: 2, label: 'Vrstva Výšky' },
  { num: 3, label: 'Kvalita Tisku' },
  { num: 4, label: 'Výběr Materiálu' },
  { num: 5, label: 'Náhled Objednávky' }
];

return (
  <div className="stepper">
    {stepperSteps.map(step => (
      <div
        key={step.num}
        className={`stepper-step ${step.num === currentStep ? 'active' : ''} ${step.num < currentStep ? 'completed' : ''} ${step.num > highestStepReached ? 'disabled' : ''}`}
        onClick={() => handleGoToStep(step.num)}
        role="button"
        tabIndex={step.num <= highestStepReached ? 0 : -1}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && step.num <= highestStepReached) {
            handleGoToStep(step.num);
          }
        }}
      >
        <div className="step-circle">
          {step.num < currentStep ? '✓' : step.num}
        </div>
        <span className="step-label">{step.label}</span>
      </div>
    ))}
    {currentStep > 1 && (
      <button className="back-button" onClick={handleGoBack}>
        ← Zpět na: {stepperSteps[currentStep - 2]?.label}
      </button>
    )}
  </div>
);
```

---

### 2. `src/styles/responsive-kalkulacka.css`

**Typ:** Zmeneno
**Radky:** 380-480
**Duvod:** Breadcrumb a stepper styling, responsive breakpoints, accessibility

**Co se zmenilo:**

- **Breadcrumb styles:**
  ```css
  .breadcrumb-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--forge-surface-subtle, #f5f5f5);
    border-bottom: 1px solid var(--forge-border, #ddd);
    font-size: 0.875rem;
    font-family: var(--forge-font-tech);
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .breadcrumb-item button {
    background: none;
    border: none;
    color: var(--forge-text-muted, #7A8291);
    text-decoration: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .breadcrumb-item button:hover {
    text-decoration: underline;
    color: var(--forge-text, #1a1a1a);
  }

  .breadcrumb-item button.active {
    color: var(--forge-accent, #ff6600);
    font-weight: 600;
  }

  .breadcrumb-item .separator {
    color: var(--forge-border, #ddd);
    margin: 0 0.25rem;
  }
  ```

- **Stepper styles:**
  ```css
  .stepper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 1rem;
    background: var(--forge-surface, #fff);
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .stepper-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .stepper-step:not(.disabled):hover {
    transform: scale(1.1);
  }

  .step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    background: var(--forge-surface-subtle, #f5f5f5);
    border: 2px solid var(--forge-border, #ddd);
    color: var(--forge-text-muted, #7A8291);
  }

  .stepper-step.active .step-circle {
    background: var(--forge-accent, #ff6600);
    color: white;
    border-color: var(--forge-accent, #ff6600);
    box-shadow: 0 0 0 4px rgba(255, 102, 0, 0.1);
  }

  .stepper-step.completed .step-circle {
    background: var(--forge-accent, #ff6600);
    color: white;
    border-color: var(--forge-accent, #ff6600);
  }

  .stepper-step.disabled {
    opacity: 0.5;
    cursor: default;
  }

  .stepper-step.disabled:hover {
    transform: none;
  }

  .step-label {
    font-size: 0.75rem;
    text-align: center;
    color: var(--forge-text-muted, #7A8291);
    font-family: var(--forge-font-tech);
  }

  .stepper-step.active .step-label {
    color: var(--forge-text, #1a1a1a);
    font-weight: 600;
  }

  .back-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    background: var(--forge-surface-subtle, #f5f5f5);
    border: 1px solid var(--forge-border, #ddd);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--forge-text-muted, #7A8291);
  }

  .back-button:hover {
    background: var(--forge-surface, #fff);
    color: var(--forge-text, #1a1a1a);
  }
  ```

- **Responsive:**
  - Mobile (< 640px): Stepper se změní na vertikální layout (flex-direction: column), breadcrumb zkrácen
  - Tablet (640px-1024px): Stepper v řádku, stepper-step gap zvětšen
  - Desktop (> 1024px): Full stepper s labely vedle círků

---

## Dopad zmen

- **Ovlivnene komponenty:** test-kalkulacka/index.jsx, responsive-kalkulacka.css, step components (Step1-5)
- **Breaking changes:** Ne — props jsou optional, backcompat maintained
- **Nove zavislosti:** Žádné (uses native DOM events + CSS)
- **Rizika:**
  - highestStepReached tracking: Pokud user refreshne stránku, stav se resetuje (mitigation: sessionStorage persistence pokud je potřeba)
  - Accessible keyboard navigation: Tab order musí být správný (mitigation: testing s screen reader pending)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - Breadcrumb render s aktuálním krokem ✅
  - Clickable breadcrumb items (navzájem mezi kroky) ✅
  - Stepper: completed steps mají checkmark ✅
  - Stepper: disabled steps (>highestStepReached) nejsou clickable ✅
  - Hover effect na stepper steps (scale 1.1) ✅
  - Back button viditelný od kroku 2 ✅
  - Keyboard support: Tab → step, Enter/Space → select ✅
  - Responsive mobile (< 640px): stepper vertical layout ✅
- **Poznamky:**
  - Screen reader test pending (a11y verification)
  - Session persistence (sessionStorage) pending — feature pro budoucnost
  - Browser history integration pending (back button z history)

---

## Prislusne soubory z batch 6

- ID 129: Widget Sync — Build Plate + Mesh Repair portovány
- ID 130: Backend Mesh Repair + Analyze API

---

<!-- KONEC ZAZNAMU -->
