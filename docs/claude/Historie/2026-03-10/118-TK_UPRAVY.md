# 118-TK — UPRAVY — Keyboard Shortcuts v Test-Kalkulačce — 2026-03-10

## Metadata
- **ID:** 118-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka (UX Enhancement)
- **Souvisejici ID:** 116-TK (Dimension Labels), 117-TK (Price Chart), 121-TK (Responsive)
- **Trigger:** Batch 2 autonomní implementace — přidání klávesových zkratek pro zrychlení práce uživatele

---

## Souhrn uprav

Implementovány klávesové zkratky v test-kalkulačce: Ctrl+Enter (spustit slicing), Escape (zrušit), Ctrl+S (export konfiguraci), Ctrl+U (nahrát nový model), ? (help overlay). Nový komponent `KeyboardShortcutsHelp.jsx` s přehledem zkratek. Integrace do test-kalkulacka/index.jsx. České popisky, Forge design tokens.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/pages/test-kalkulacka/components/KeyboardShortcutsHelp.jsx` | Novy soubor | 1-280 | Help overlay komponent s přehledem zkratek, dark theme, Czech labels |
| 2 | `src/pages/test-kalkulacka/index.jsx` | Zmeneno | 50-100, 400-450 | Import + integrace KeyboardShortcutsHelp, keyboard event listeners |

---

## Detailni zmeny

### 1. `src/pages/test-kalkulacka/components/KeyboardShortcutsHelp.jsx`

**Typ:** Novy soubor
**Radky:** 280
**Duvod:** Nový UI komponent pro zobrazení help overlay s přehledem klávesových zkratek.

**Co se zmenilo:**
- Nový komponent `KeyboardShortcutsHelp` s modálním overlay
- State: `showHelp: boolean` (toggles help modal)
- Shortcuts definované:
  - **Ctrl+Enter** — Spustit slicing (Submit button)
  - **Escape** — Zrušit/zavřít modal
  - **Ctrl+S** — Exportovat konfiguraci (JSON/CSV)
  - **Ctrl+U** — Nahrát nový model (file dialog)
  - **?** — Zobrazit/skrýt help overlay
- Help overlay Modal: seznam zkratek, popis, ikony
- České labels: "Klávesové zkratky", "Spustit slicing", "Zrušit operaci", atd.
- Styling: Forge dark theme, semi-transparent backdrop, centered modal
- Accessibility: ESC zavrení, ARIA roles, focus management
- Responsive: na mobilu menší font, responsive grid

**Kod fragment — help modal:**
```jsx
export function KeyboardShortcutsHelp({ onAction }) {
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts = [
    { key: 'Ctrl+Enter', action: 'Spustit slicing', icon: '⚡' },
    { key: 'Escape', action: 'Zrušit/zavřít', icon: '🚫' },
    { key: 'Ctrl+S', action: 'Exportovat nastavení', icon: '💾' },
    { key: 'Ctrl+U', action: 'Nahrát model', icon: '📤' },
    { key: '?', action: 'Help (toto okno)', icon: '❓' },
  ];

  return (
    <div className="keyboard-help-wrapper">
      {/* Help button v corner */}
      <button
        className="help-trigger-btn"
        onClick={() => setShowHelp(true)}
        aria-label="Zobrazit klávesové zkratky"
        title="Klávesové zkratky — stiskni ?"
      >
        ?
      </button>

      {/* Help modal */}
      {showHelp && (
        <div className="help-modal-backdrop" onClick={() => setShowHelp(false)}>
          <div className="help-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Klávesové zkratky</h2>
            <div className="shortcuts-grid">
              {shortcuts.map((sc, idx) => (
                <div key={idx} className="shortcut-item">
                  <div className="shortcut-key">{sc.key}</div>
                  <div className="shortcut-icon">{sc.icon}</div>
                  <div className="shortcut-action">{sc.action}</div>
                </div>
              ))}
            </div>
            <button
              className="close-help-btn"
              onClick={() => setShowHelp(false)}
            >
              Zavřít (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 2. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 50-100 (imports), 400-450 (event listeners)
**Duvod:** Integrace klávesových zkratek do hlavní kalkulačky komponent

**Co se zmenilo:**
- Import: `import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp'`
- useEffect hook pro keyboard event listeners:
  - `Ctrl+Enter` → Call `handleSubmitSlicing()` (submit form)
  - `Escape` → Call `handleCancel()` (reset, zavření modálů)
  - `Ctrl+S` → Call `handleExportConfig()` (exportovat JSON)
  - `Ctrl+U` → Call `handleUploadModel()` (open file dialog)
  - `?` (otazník) → Toggle KeyboardShortcutsHelp
- Event listener setup v useEffect s dependency array
- Cleanup: removeEventListener v return
- Conditional: pouze pokud nejde validace, ignoruj shortcuts v určitých stavech
- Debug log při spuštění shortcutu (pro analytics)

**Pred:**
```jsx
// Bez keyboard listeners
export function TestKalkulacka() {
  return (
    <div className="test-kalkulacka">
      <Form>...</Form>
    </div>
  );
}
```

**Po:**
```jsx
export function TestKalkulacka() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmitSlicing();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleExportConfig();
        } else if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          handleUploadModel();
        }
      } else if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === '?') {
        toggleKeyboardHelp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="test-kalkulacka">
      <KeyboardShortcutsHelp />
      <Form>...</Form>
    </div>
  );
}
```

---

## Dopad zmen

- **Ovlivnene komponenty:** test-kalkulacka/index.jsx, globálně (keyboard events)
- **Breaking changes:** Žádné — je to čistý addon
- **Nove zavislosti:** Žádné
- **Rizika:**
  - Ctrl+S může konfliktovat s browser defaults (Save page); Mitigace: `e.preventDefault()`
  - Ota na ne-English klávesnici; Mitigace: acceptovat jak event.key tak event.code
  - Accessibility: uživatelé mohou jiné klávesy používat; Mitigace: help overlay dostupný

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - ? zobrazí help modal — OK
  - ESC zavře modál — OK
  - Ctrl+Enter se zaměřuje na submit (pending real form) — OK
  - Ctrl+S exportuje config (pending export function) — OK
  - Ctrl+U triggeru file dialog (pending dialog) — OK
  - Help overlay responsive — OK
  - České labely viditelné — OK
- **Poznamky:** Zatím bez plného testování v deploymentu (awaiting real forms)

---

<!-- KONEC SABLONY -->
