# 263-AP — UPRAVY — AdminPricing Volume Discount Inputs Fix — 2026-03-23

## Metadata
- **ID:** 263-AP
- **Session:** S01
- **Datum:** 2026-03-23
- **Oblast:** AdminPricing (Admin stranka)
- **Souvisejici ID:** 262-FD (ForgeDialog focus bug kterypatril pritomny fix), 248 (AdminPricing.jsx session 2026-03-21 Widget Builder), 107-110 (AdminPricing zmeny, code quality sprint)
- **Trigger:** Bug report: Ve volume discount inputech (minimalni mnozstvi, cena) se nedalo smazat cislice — zustala nula nebo se input zasekl pri mazani desatinnych cisel

---

## Souhrn uprav

Opraveny volume discount minimalni mnozstvi a cena inputy v AdminPricing.jsx. Zmeny z HTML5 `type="number"` na `type="text" inputMode="numeric"` | `"decimal"` s vlastnimi `parseIntInput` + `parseDecimal` handlama v onChange a onBlur. Toto je spravny vzor pro numeric inputy kterym je potreba dovolit smazani bez "0" fallback bug.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminPricing.jsx | Zmeneno | 1350-1380 (volume discount min_qty input), 1390-1420 (volume discount value input), CSS selector update pro NumberStepper | Dva inputy: min_qty ze `type="number"` na `type="text" inputMode="numeric"` s `parseIntInput`; value ze `type="number"` na `type="text" inputMode="decimal"` s `parseDecimal` |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminPricing.jsx` — Volume Discount Inputs

**Typ:** Zmeneno (zmena input typu + handlery)
**Radky:** 1350-1380 (min_qty), 1390-1420 (value), CSS selector update
**Duvod:** HTML5 `type="number"` inputy maji intern logiku ktera zavisl fokus na spinner buttony a nedovoluje "smazat vychozi nulu". Spravny pattern pro numeric inputy s vlastni logikou: `type="text"` + `inputMode` + vlastni parser/formatter v onChange+onBlur.

**Co se zmenilo:**

#### Volume Discount Minimum Quantity Input (min_qty)
- Zmena z `type="number"` na `type="text"`
- Pridan `inputMode="numeric"` pro mobilni klávesnicu s cisly
- onChange handler: `parseIntInput(e.target.value)` — zmena stringu na integer, zvládá mazani az na prazdny string
- onBlur handler: `finalizeDecimal(...)` — ensure valid integer (nula, nebo cislo z textového stringu)
- Pred: `<input type="number" value={...} onChange={(e) => ...} />`
- Po: `<input type="text" inputMode="numeric" value={...} onChange={(e) => setMinQty(parseIntInput(e.target.value))} onBlur={(e) => setMinQty(finalizeDecimal(e.target.value, 0))} />`

#### Volume Discount Value/Price Input (value)
- Zmena z `type="number"` na `type="text"`
- Pridan `inputMode="decimal"` pro mobilni klávesnicu s desatinnou carkou
- onChange handler: `parseDecimal(e.target.value)` — zmena stringu na decimal, zvládá: "2.", "2.1", mazani, atd.
- onBlur handler: `finalizeDecimal(...)` — ensure valid decimal (zacina na 0 nebo cislo, max 2 des. mista)
- Pred: `<input type="number" step="0.01" value={...} onChange={(e) => ...} />`
- Po: `<input type="text" inputMode="decimal" value={...} onChange={(e) => setVolumeValue(parseDecimal(e.target.value))} onBlur={(e) => setVolumeValue(finalizeDecimal(e.target.value, 2))} />`

#### CSS Selector Update
- NumberStepper komponenta byla pouzivana pres CSS selector `input[type="number"]`
- Zmena: `input.numeric-input[type="text"], input[type="number"]` — zachycuje oba typy nebo inline class `numeric-input` na input
- Alternativne: Pridan `data-numeric="true"` attribute na text inputy a `input[data-numeric="true"]`

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminPricing.jsx, zaroven ovlivneno renderovani tabulky s volume discounty (v step 2)
- **Breaking changes:** Ne — input value structure zustava stejne (integer/decimal), zmena je jen UI typ
- **Nove zavislosti:** Ne — `parseIntInput` a `finalizeDecimal` jsou jiz importovany z `src/utils/formatters.js` (session 2026-03-18)
- **Rizika:** Minimalni — text inputy jsou zvladnuty, mobile se veda `inputMode` atributem, nazvy funkci jsou jasne

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Vyzkouseno mazani cisel v obou inputech — bez "0 fallback", bez focus-skip (vzhledem k oprave ForgeDialog.jsx)
- **Poznamky:** Vzdy kdyz pouzivas numeric inputy s vlastni validaci, pouzij `type="text" inputMode="numeric|decimal"` miste `type="number"`. Typ "number" ma vnitrni logiku ktera narazi na situace jako mazani nuly, focus na spinner, atd.

---

## Poznamka: Pattern pro numeric inputy

```jsx
// SPRAVNY PATTERN:
<input
  type="text"
  inputMode="numeric"  // nebo "decimal"
  value={value}
  onChange={(e) => setValue(parseDecimal(e.target.value))}  // Live parse
  onBlur={(e) => setValue(finalizeDecimal(e.target.value, 2))}  // Final cleanup
/>

// NESPRAVNY PATTERN:
<input
  type="number"  // Nema vlastni logiku, hard to customize
  value={value}
  onChange={(e) => setValue(Number(e.target.value))}  // Nema validation
/>
```

---

<!-- KONEC ZAZNAMU 263-AP_UPRAVY.md -->
