# 270-3D — Auto-Orient STL Pipeline — UPRAVY

## Metadata

| Pole | Hodnota |
|------|---------|
| **ID** | 270-3D |
| **Datum** | 2026-03-25 |
| **Session** | S01 |
| **Typ** | UPRAVY |
| **Zkratka** | 3D |
| **Oblast** | 3D & Mesh / Backend / Kalkulacka |
| **Trigger** | manual |
| **Souvisejici** | 264-269 (session 2026-03-24) |

---

## Souhrn

Implementace Auto-Orient STL Pipeline — plna integrace lay-flat rotace do slicingu. Drive funkce "Auto polozeni" v kalkulacce byla jen vizualni (quaternion se nikam neposilal). Nyni se rotace aplikuje na STL soubor PRED slicovanim v PrusaSliceru.

**Research:** PrusaSlicer CLI rotace nevhodna (Euler only, no drop-to-bed), custom binary parser nejrychlejsi (~200ms pro 200MB STL).

---

## Nove soubory (1)

### `backend-local/src/util/stlTransform.js` — STL transformacni utilita

| Pole | Hodnota |
|------|---------|
| **Typ** | Pridano (novy soubor) |
| **Popis** | Zero-dependency STL transformacni utilita pro aplikaci quaternion rotace na STL soubory |

**Funkce:**
- `applyQuaternionToSTL()` — in-place rotace binary STL (quaternion -> 3x3 matice)
- `applyQuaternionToSTLAscii()` — ASCII STL rotace + konverze na binary
- `detectSTLFormat()` — detekce binary/ASCII formatu
- `dropToPlate()` — posun modelu na Z=0 (tiskova plocha)
- `transformSTLFile()` — orchestrace: cteni -> detekce -> rotace -> drop -> zapis `_oriented.stl`

---

## Upravene soubory (4)

### 1. `backend-local/src/index.js` — Slicer pipeline integrace

| Pole | Hodnota |
|------|---------|
| **Typ** | Zmeneno |
| **Popis** | Integrace quaternion transformace do slicer pipeline (oba endpointy) |

**Zmeny:**
- `parseQuaternion()` — parsovani + validace quaternion z request body
- `applyQuaternionTransform()` — volani transformSTLFile s fallbackem (pokud selze, pouzije se puvodni STL)
- `cleanupTransformedFile()` — cleanup temp souboru (`_oriented.stl`) v finally bloku
- Oba endpointy (`/api/slice` sync + queue) podporuji quaternion
- Response obsahuje `rotationApplied: true/false`

### 2. `src/pages/test-kalkulacka/components/ModelViewer.jsx` — Novy prop onOrientChange

| Pole | Hodnota |
|------|---------|
| **Typ** | Zmeneno |
| **Popis** | Pridani callbacku pro predani quaternion dat do rodicovskeho komponentu |

**Zmeny:**
- Novy prop `onOrientChange`
- Auto-orient klik -> `onOrientChange({ x, y, z, w })` — posila quaternion nahoru
- Reset -> `onOrientChange({ x: 0, y: 0, z: 0, w: 1 })` — identity quaternion

### 3. `src/services/slicerApi.js` — Quaternion v FormData

| Pole | Hodnota |
|------|---------|
| **Typ** | Zmeneno |
| **Popis** | Pridani quaternion parametru do slicer API volani |

**Zmeny:**
- `sliceModelLocal` prijima `opts.quaternion`
- Pridava `quaternion_x/y/z/w` do FormData (pokud neni identita `{0,0,0,1}`)

### 4. `src/pages/test-kalkulacka/index.jsx` — Per-model quaternion state

| Pole | Hodnota |
|------|---------|
| **Typ** | Zmeneno |
| **Popis** | Sprava quaternion stavu pro kazdy model zvlast a predani do slicingu |

**Zmeny:**
- `orientQuaternions` state objekt (klice = model ID, hodnoty = quaternion)
- `handleOrientChange` callback — aktualizuje quaternion pro konkretni model
- Quaternion predavan do vsech 4 mist kde se vola slicing

---

## Architektura

```
ModelViewer (auto-orient klik)
    |
    v
onOrientChange({ x, y, z, w })
    |
    v
test-kalkulacka/index.jsx (orientQuaternions state)
    |
    v
slicerApi.sliceModelLocal(file, opts: { quaternion })
    |
    v
FormData: quaternion_x, quaternion_y, quaternion_z, quaternion_w
    |
    v
backend /api/slice endpoint
    |
    v
parseQuaternion() -> applyQuaternionTransform() -> stlTransform.transformSTLFile()
    |
    v
_oriented.stl -> PrusaSlicer -> cleanup
```

---

## Technicke poznamky

- **Zero-dependency:** stlTransform.js nepouziva zadne externi knihovny — ciste Node.js Buffer operace
- **Performance:** ~200ms pro 200MB STL soubor (binary parser)
- **Fallback:** Pokud transformace selze, pouzije se puvodni STL (graceful degradation)
- **Cleanup:** Temp soubory `_oriented.stl` se mazou v finally bloku
- **ASCII podpora:** ASCII STL se nejprve konvertuje na binary, pak se rotuje
- **Drop-to-plate:** Po rotaci se model automaticky posune na Z=0 (tiskova plocha)
