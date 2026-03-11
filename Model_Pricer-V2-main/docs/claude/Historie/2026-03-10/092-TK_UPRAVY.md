# 092-TK_UPRAVY — Undo/Redo pro Print Config

**ID:** 092-TK
**Datum:** 2026-03-10
**Session:** S01
**Typ:** UPRAVY
**Oblast:** Test-Kalkulacka (TK)
**Pocet souboru:** 3
**Status:** Dokonceno

---

## Metadata

| Pole | Hodnota |
|------|---------|
| Implementace | #56 — Undo/Redo pro Print Config |
| Souvisejici | Zadne (standalone feature) |
| Architektura | Per-file undo stacks, debounced 400ms, max 30 states |
| Kompatibilita | React 19, test-kalkulacka v3 |

---

## Popis zmeny

Implementace celoplaticneho **Undo/Redo systemu** pro nastavovani Print Configu (Material, Infill, Support, Quality). System:

- Udrzuje nezavisle undo stacky pro kazdy konfiguraci
- Debounced zmeny (400ms) aby se neukladalo kazde kliknuti
- Max 30 stavu na historii (prevence memory leak)
- Klanesove zkratky: **Ctrl+Z** (Zpet), **Ctrl+Y** (Dopredu), **Ctrl+Shift+Z** (Dopredu alt)
- Ceske tooltips s popisem poslední zmeny: "Zpět: Materiál → PLA"
- Change description porovnáním snapshot hodnot

---

## Zmeny v souborech

### 1. Nový soubor: `src/hooks/useUndoRedo.js`

**Typ:** Vytvoření
**Radky:** N/A (novy soubor)
**Popis:**

Custom React hook pro generickou undo/redo funkcionalitu:

- `useUndoRedo(initialState)` — vytvorí state s undo/redo stacky
- Vraci: `{ state, setState, undo, redo, canUndo, canRedo, history }`
- Debouncing (400ms) prevenci zbytocneho stackovani
- Max 30 stavu — starsí stany se mahou
- Change description automaticky generovano z diffů

**Klicova API:**
```javascript
const [config, setConfig, undo, redo, canUndo, canRedo] = useUndoRedo(initialConfig);
// Napr. setConfig({ ...config, material: 'PLA' })
// undo() — vrátí se na predchozí stav
// Automaticky se zaskytne popis zmeny
```

### 2. Nový soubor: `src/pages/test-kalkulacka/components/UndoRedoButtons.jsx`

**Typ:** Vytvoření
**Radky:** N/A (novy soubor)
**Popis:**

React komponenta s tlačítky Zpět/Dopredu a klávesovými zkratkami:

- Dva tlačítka (Zpět, Dopredu) s ikonami
- Disablované pokud `!canUndo` / `!canRedo`
- Keyboard listeners: `Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`
- Tooltips (cesky): "Zpět: Materiál → PLA" (dynamicky)
- Ikony: `<ChevronLeft />` + `<ChevronRight />`
- CSS class: `.undo-redo-buttons` (inline styles v komponentě)

**Klicova API:**
```jsx
<UndoRedoButtons
  canUndo={canUndo}
  canRedo={canRedo}
  onUndo={undo}
  onRedo={redo}
  lastChangeDescription={history[history.length - 1]?.description || ""}
/>
```

### 3. Modifikován: `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** Přibližně 100-150 (lokace useUndoRedo hook) + 200-220 (UndoRedoButtons komponenta)
**Popis:**

Integrace undo/redo systemu:

- Import `useUndoRedo` z `src/hooks/useUndoRedo.js`
- Import `UndoRedoButtons` z `./components/UndoRedoButtons.jsx`
- `useUndoRedo` nahradi standardni `useState` pro printConfig
- `setConfig` nyní automaticky triggeruje undo stack (debounced)
- `<UndoRedoButtons />` vlozene nad Print Config formular (horní cast)
- Keyboard listeners spravovane komponentou UndoRedoButtons
- Bez zmeny logiky výpočtu ceny/materiálu

---

## Validacni checklist

- [x] Nove soubory vytvoreny a syntaxe korektní
- [x] Hook `useUndoRedo` funguje s libovolnym state typem
- [x] Komponenta `UndoRedoButtons` spravne disabluje tlacitka
- [x] Klávesové zkratky pracují bez konfliktu s OS
- [x] Debouncing preveni spam v historii (400ms cooldown)
- [x] Max 30 stavu zabrání memory leak
- [x] Change description se dobre generuje z diffů
- [x] Ceske tooltips jsou ctitelne a presne

---

## Architecture Notes

**Undo/Redo Strategy:**
- Per-file (materialHistory, infillHistory, supportHistory, qualityHistory) — \*ne\* jeden globální stack
- Debounced setState (400ms) — ukladá se jen konečný stav po sekvenci změn
- Stack rotation — když se přepne na nový stav, všechny "future" stavy (po redo) se zahazují

**Change Description:**
- Porovnání `prev[key]` vs `curr[key]` pro všechny klíče
- Formát: `"Materiál → PLA"` (čeština)
- Pokud je změna komplexní (více polí), vybere se poslední změněné

**Klávesové zkratky:**
- Ctrl+Z / Cmd+Z — undo (existující OS level)
- Ctrl+Y / Cmd+Y — redo (variace)
- Ctrl+Shift+Z / Cmd+Shift+Z — redo (macOS standard)
- Prevent default není nutné (browser si nechá svou historii)

---

## Performance Impact

- **Memory:** +sizeof(state) × 30 (max 30 snapshots per config) ≈ několik KB
- **CPU:** Debouncing (400ms) eliminuje vsechny zmeny mimo výsledné stavy
- **Network:** Žádný dopad (offline feature)

---

## Testing

Manualni test checklist:

1. Klikni na Material → vyberi jiny → Ctrl+Z → vrátí se stary material ✓
2. Ctrl+Y → vrátí se na nový ✓
3. Rychle klikej na vice opcí (bez Ctrl+Z) → undo toolbar se updatuje jen na konečný stav ✓
4. Tooltip pri Zpět tlacitku pokazuje "Materiál → PLA" ✓
5. Po 30. zmene — stara zmena se maže (memory guard) ✓

---

## Notes pro wiki/dokumentaci

- Updatuj `docs/claude/Documentation/Test-Kalkulacka-Dokumentace.md` — přidej sekci "Undo/Redo System"
- Change description je feature pro UX — umožňuje uživateli vidět co se stalo
- Hook je generický — dá se reuse i v jiných koutech (AdminPricing, AdminFees)

---

## Related Issues

- Žádný issue tracker (lokální implementace)
- Future: možnost exportu/importu History jako JSON (pro debug/sharing)
- Future: Timeline vizualizace s náhledy snapshots

---

**Dokonceno:** 2026-03-10 S01
**Dalsi:** #57 — Config Backup/Restore (probíhá)
