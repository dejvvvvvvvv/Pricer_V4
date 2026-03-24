# 262-FD — UPRAVY — ForgeDialog Focus Bug Fix — 2026-03-23

## Metadata
- **ID:** 262-FD
- **Session:** S01
- **Datum:** 2026-03-23
- **Oblast:** ForgeDialog (UI komponenta)
- **Souvisejici ID:** 261 (Customer Portal A11y Fixes, která azonámila problem), 248 (AdminPricing.jsx, kterou bug ovlivnoval)
- **Trigger:** Bug report: Pri mazani desatinnych cisel v admin strankach (input musel mit textovy handler s parseDecimal) se focus skakoval z inputu na X button dialogu, coz znemoznilo dalsi editaci

---

## Souhrn uprav

Opravena focus-stealing bug v ForgeDialog.jsx, kdy se handleKeyDown callback zaviselo na closure `[onClose]` a zpusobovalo nepotrebne re-render efektu. Toto zpusobovalo stav, kdy se focus krutil z inputu na close button. Ukazana strategie: `useRef` pro onClose callback + `useCallback([], [])` pro stabilni handler.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/components/ui/forge/ForgeDialog.jsx | Zmeneno | 1-150 (cely soubor — refaktor handleKeyDown + effect dependency) | Focus-stealing bug fix: useRef onClose + useCallback bez zavislosti + effect jen na [open] |

---

## Detailni zmeny

### 1. `src/components/ui/forge/ForgeDialog.jsx`

**Typ:** Zmeneno (refaktor event handler + effect dependencies)
**Radky:** 1-150 (cely soubor)
**Duvod:** Focus se krutil z inputu na dialog close button pri kazdem kazdenem renderu. Problem byl v `useEffect` ktere se spoustelo pri zmene `onClose`, cimz se handleKeyDown znovu vytvaril a focus se znovu attachoval na button. Reseni: stabilizace handleKeyDown callback a efektu.

**Co se zmenilo:**
- Pridan `onCloseRef = useRef(onClose)` a `useEffect` pro sync refu pri zmene `onClose`
- `handleKeyDown` zmenen z inline arrow function na `useCallback(fn, [])` — stabilni reference, ne zavislost na `[onClose]`
- `useEffect` ktery registruje handleKeyDown event listener nyní ma zavislost `[open]` — spusti se jen pri zmene open/close, ne pri kazdem renderu
- Uvnitr handleKeyDown se pouziva `onCloseRef.current()` miste `onClose` z closure

**Pred:**
```jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();  // Closure na onClose
    }
  };
  if (open) document.addEventListener('keydown', handleKeyDown);
  return () => {
    if (open) document.removeEventListener('keydown', handleKeyDown);
  };
}, [open, onClose]);  // onClose v zavislosti — re-render handleKeyDown pri kazde zmene!
```

**Po:**
```jsx
const onCloseRef = useRef(onClose);

useEffect(() => {
  onCloseRef.current = onClose;  // Sync ref
}, [onClose]);

const handleKeyDown = useCallback((e) => {
  if (e.key === 'Escape') {
    onCloseRef.current();  // Cti z refu, neni closure zavislost
  }
}, []);  // Prazdne zavislosti — stabilni reference

useEffect(() => {
  if (open) {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }
}, [open, handleKeyDown]);  // handleKeyDown je stabilni kvuli useCallback([])
```

---

## Dopad zmen

- **Ovlivnene komponenty:** Kazda komponenta ktera pouziva ForgeDialog (AdminPricing, AdminFees, AdminBranding, AdminWidget, AdminOrders, AdminTeam, AdminPresets, AdminParameters, AdminExpress, AdminShipping, AdminPayments, AdminMigration)
- **Breaking changes:** Ne — API ForgeDialog zustava stejne, zmena je pouze vnitrni (refaktor efektů)
- **Nove zavislosti:** Ne
- **Rizika:** Neni znamo — zmena by mela pouze zamezit nechotenym re-renderu a focus kradi, ne zavest nova rizika

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** 3 agenti potvrdili ze focus problem neni vic — admin stranky s numeric inputy pracuji spravne bez focus skipnuti na X button
- **Poznamky:** Focus-stealing se deje vzdy pri re-renderu v zavislosti na `[onClose]`. Pokud by `onClose` callback zmensil v sobe (treba prislo jine ID dialogu), efekt by se znovu spustil a handleKeyDown by se znovu zaregistroval. Toto je obvykla JavaScript closure past pri event listenerech.

---

## Poznamka pro budouci

Pokud se v budoucnu pridavaji dalsi event listenery do ForgeDialog, pouzij VZDY pattern `useRef + useCallback([], [])` pro callbacky aby se zabranilo focus-stealing a nechotenym re-renderu. Nezavisej closury na props/state zmen.

---

<!-- KONEC ZAZNAMU 262-FD_UPRAVY.md -->
