# DENNI PREHLED — 2026-03-25

## Souhrn dne

| Cas | Aktivita | Vysledek |
|-----|----------|----------|
| S01 | Auto-Orient STL Pipeline — plna integrace lay-flat rotace do slicingu | 1 novy + 4 upravene soubory |

---

## Klicove zmeny

- **Auto-Orient STL Pipeline:** Quaternion rotace z ModelVieweru se nyni aplikuje na STL soubor pred slicovanim v PrusaSliceru (drive jen vizualni)
- **Novy soubor:** `backend-local/src/util/stlTransform.js` — zero-dependency STL transformacni utilita (~200ms pro 200MB)
- **Backend:** Oba slicer endpointy (`/api/slice` sync + queue) podporuji quaternion s fallbackem
- **Frontend:** Per-model quaternion state v kalkulacce, `onOrientChange` prop v ModelVieweru

---

## Rozhodnuti

- PrusaSlicer CLI rotace nevhodna (Euler only, no drop-to-bed) -> custom binary parser
- Zero-dependency pristup (ciste Node.js Buffer operace)
- Graceful degradation — pokud transformace selze, pouzije se puvodni STL

---

## Statistiky

| Metrika | Hodnota |
|---------|---------|
| Nove soubory | 1 |
| Upravene soubory | 4 |
| Historie zaznamy | 270-3D |
