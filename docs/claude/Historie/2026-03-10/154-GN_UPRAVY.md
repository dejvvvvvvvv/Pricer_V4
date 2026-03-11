# 154-GN — UPRAVY — Batch 16: Onboarding Tour Guide — 2026-03-10

## Metadata
- **ID:** 154-GN
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka / UI
- **Souvisejici ID:** 113 (plan), 155 (Admin Order Detail), 156 (Admin Customers)
- **Trigger:** Autonomní implementace — Batch 16 z planu 115-151

---

## Souhrn uprav

Implementace interaktivního onboarding tour guide pro test-kalkulačku. Nový systém s 7-krokovou procházkou (upload → viewer → config → generate → pricing → mesh repair → done), SVG mask spotlight efekt, auto-positioning tooltip a možnost výprasku "Nespouštět znovu" pro vrátit se ke standardnímu UI. Data-tour atributy pro bodování komponent, restart z klávesových zkratek.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/hooks/useOnboardingTour.js | Novy soubor | 1-280 | Hook pro správu onboarding stavu (7 kroků, localStorage, tour logika) |
| 2 | src/pages/test-kalkulacka/components/OnboardingTour.jsx | Novy soubor | 1-420 | Komponenta s SVG mask spotlight, tooltip, buttons (Next/Skip/Restart) |
| 3 | src/pages/test-kalkulacka/index.jsx | Zmeneno | 45-62, 180-195 | Integrace useOnboardingTour, data-tour atributy na 6 hlavních sekcích, tour state prop do OnboardingTour |
| 4 | src/pages/test-kalkulacka/components/KeyboardShortcutsHelp.jsx | Zmeneno | 85-92 | Přidání "?" + "Restart onboarding" v seznamu zkratek |

---

## Detailni zmeny

### 1. `src/hooks/useOnboardingTour.js`

**Typ:** Nový soubor
**Radky:** 1-280
**Duvod:** Centralizovaná logika pro správu onboarding tour — tracking kroku, localStorage persistance, restart logika.

**Co se zmenilo:**
- Nový hook vrací: `{ tourActive, currentStep, steps, completeTour, skipTour, restartTour }`
- Definovány 4 steps: upload, viewer (Build Plate Viewer), config, generate, pricing, mesh repair, done
- localStorage key: `modelpricer:${tenantId}:onboarding:tour-completed`
- Auto-increment currentStep v useEffect
- Podmíny pro aktivaci: !tourCompleted && tourActive
- Reset: currentStep = 0 při restartTour

---

### 2. `src/pages/test-kalkulacka/components/OnboardingTour.jsx`

**Typ:** Nový soubor
**Radky:** 1-420
**Duvod:** Vykreslovací komponenta s efekty a interaktivitou pro tour UI.

**Co se zmenilo:**
- SVG mask `<circle cx={x} cy={y} r={radius} />` pro spotlight efekt na aktuální elementu
- Tooltip s auto-positioning (top/bottom/left/right logika dle viewport)
- Tlačítka: "Další" (skip je zmrazeno), "Přeskočit tour", "Restart onboarding"
- Konfetti animace na last step (completion)
- CSS: animation-delay pro fade-in tooltip, z-index 10000 pro mask
- Accessibility: role="dialog", aria-label, focusable buttons

**Pred/Po:**
- Pred: Nebylo žádné onboarding, nový uživatel zmatený UI
- Po: 7-kroková procházka s vizuálními hinty, textovými popisy, možnost restartu

---

### 3. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 45-62, 180-195
**Duvod:** Integrace onboarding tour komponenty a označení cílových elementů.

**Co se zmenilo:**
- Import: `import { useOnboardingTour } from '@/hooks/useOnboardingTour'`
- Hook call: `const { tourActive, currentStep, steps, ... } = useOnboardingTour()`
- Data-tour atributy na 6 sekcích:
  - `data-tour-step="upload"` na FileUploadZone
  - `data-tour-step="viewer"` na ModelViewer
  - `data-tour-step="config"` na PrintConfig
  - `data-tour-step="generate"` na GenerateButton
  - `data-tour-step="pricing"` na PricingCalculator
  - `data-tour-step="mesh-repair"` na MeshRepairPanel
- Render OnboardingTour komponenty v JSX s tour state
- CSS: opacity-50 na ostatní elementy když tourActive

---

### 4. `src/pages/test-kalkulacka/components/KeyboardShortcutsHelp.jsx`

**Typ:** Zmeneno
**Radky:** 85-92
**Duvod:** Přidání klávesové zkratky pro restart onboarding.

**Co se zmenilo:**
- Nová zkratka: "?" + "Shift+?" → "Otevřít nápovědu / Restartovat onboarding"
- handleRestartOnboarding callback -> restartTour z useOnboardingTour
- Volání v KbHelpDisplay modalu

---

## Dopad zmen

- **Ovlivnene komponenty:** test-kalkulacka (index, KeyboardShortcutsHelp), UI layer (OnboardingTour overlay)
- **Breaking changes:** Ne — opt-in feature přes localStorage flag
- **Nove zavislosti:** Žádné (interní hooks/komponenty)
- **Rizika:** SVG mask nekompatibilní s IE11 (ok, EOL browser)

---

## Testovani

- **Build:** npm run build — (pending)
- **Manual test:** (pending) —
  - [ ] Nový uživatel bez localStorage → spustí se tour automaticky
  - [ ] 7 kroků procházejí správně
  - [ ] Restart tlačítko resetuje na krok 0
  - [ ] Skip tour → tourActive = false, localStorage flag set
  - [ ] Shift+? → restartuje tour
- **Poznamky:** Spotlight efekt závisí na getBoundingClientRect() — může být offset na scrollu, je potřeba update v scroll handleru

---
