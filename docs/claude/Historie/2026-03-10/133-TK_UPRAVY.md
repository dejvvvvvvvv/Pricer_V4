# 133-TK — UPRAVY — Test-Kalkulacka — 2026-03-10

## Metadata
- **ID:** 133-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka
- **Souvisejici ID:** 115 (Roadmap plán s touto feature), 132 (Batch 6 session)
- **Trigger:** Batch 7 autonomní implementace — Dark/Light theme toggle dle roadmapu

---

## Souhrn uprav

Implementace dark/light theme toggle pro test-kalkulačku s localStorage persistence a respektováním prefers-color-scheme. Theme je scoped pomocí data-theme="light" atributu a obsahu 300ms transitions pro hladký přechod.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/hooks/useThemeToggle.js` | Nový soubor | N/A | Hook pro správu theme stavu s localStorage |
| 2 | `src/styles/light-theme-kalkulacka.css` | Nový soubor | N/A | CSS proměnné pro light theme (přepisy dark defaults) |
| 3 | `src/pages/test-kalkulacka/index.jsx` | Zmeneno | 1-50 | Integrace useThemeToggle hook, Sun/Moon toggle button, data-theme scoping |

---

## Detailni zmeny

### 1. `src/hooks/useThemeToggle.js`

**Typ:** Nový soubor
**Radky:** N/A
**Duvod:** Centralizace theme management logiky — localStorage persistence, prefers-color-scheme fallback, hydration guard

**Co se zmenilo:**
- Nový React hook s state pro theme (light/dark)
- useEffect na mount: přečte localStorage, fallback na prefers-color-scheme, nastaví html.dataset.theme
- Funkce toggleTheme(): změní state, uloží do localStorage
- SSR-safe: kontroluje typeof window před localStorage přístupem

---

### 2. `src/styles/light-theme-kalkulacka.css`

**Typ:** Nový soubor
**Radky:** N/A
**Duvod:** Light theme specifické barvy a přepisy dark defaults — CSS selector `[data-theme="light"]`

**Co se zmenilo:**
- Nový CSS soubor se scoped selektorem `[data-theme="light"]`
- Přepisy CSS proměnných: --forge-bg → lightgray, --forge-text → dark, --forge-accent → light-teal
- Light mode pro 3D viewer background: white místo dark gray
- Transition efekt: `transition: background-color 0.3s, color 0.3s`

---

### 3. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 1-50 (přibližně top part)
**Duvod:** Integrace useThemeToggle hook a UI button pro toggle

**Co se zmenilo:**
- Import: `import useThemeToggle from '@/hooks/useThemeToggle'`
- Hook call v komponentě: `const { theme, toggleTheme } = useThemeToggle()`
- Nový HTML button v header/toolbar: Sun/Moon icon, onClick={toggleTheme}
- Button styling: Forge UI design, aria-label="Toggle dark/light theme"
- Light theme CSS import: `import '@/styles/light-theme-kalkulacka.css'`
- data-theme scope se aplikuje na root container kalkulačky

---

## Dopad zmen

- **Ovlivnene komponenty:** PricingCalculator, BuildPlateViewer (background adaptace), 3D viewer komponenty
- **Breaking changes:** Ne — úplně nový feature, žádný breaking change
- **Nove zavislosti:** Žádné (pure React hooks, CSS variables)
- **Rizika:** Minimální — localStorage fallback na systém prefers-color-scheme, SSR-safe guard

---

## Testovani

- **Build:** Očekáváno PASS (nové soubory + CSS imports)
- **Manual test:**
  - Toggle button funguje a změní data-theme="light"
  - Theme přetrvá po reload (localStorage)
  - prefers-color-scheme se respektuje na prvním load
  - 3D viewer background se adaptuje podle theme
  - 300ms transition hladký

---
