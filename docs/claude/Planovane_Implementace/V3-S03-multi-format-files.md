# V3-S03: Podpora vice formatu souboru

> **Priorita:** P1 | **Obtiznost:** Vysoka | **Vlna:** 2-3
> **Zavislosti:** S01 (per-model konfigurace)
> **Odhadovany rozsah:** ~2000 radku (frontend), ~1500 radku (backend konverzni pipeline)

---

## A. KONTEXT

### A1. Ucel a cil

Sekce S03 resi rozsireni podporovanych 3D formatu v kalkulacce. Aktualne kalkulacka
prijima pouze **.stl** soubory (a castecne .obj v accept atributu), coz je vyrazne
omezujici — konkurence podporuje .obj, .step/.stp, .3mf a dalsi. Zejmena **.step**
format je silne vyzadovan inzenyry a prumyslovymi zakazniky, protoze je to standardni
CAD vymenny format.

Co S03 pridava:
1. **Podpora .3mf** — nativni format pro 3D tisk, PrusaSlicer ho primo podporuje
2. **Podpora .obj** — bezny mesh format, siroka podpora
3. **Podpora .step/.stp** — CAD format, vyzaduje konverzni pipeline na mesh
4. **Validacni pipeline** — kontrola integrity, extrakce metadat, konverze
5. **Aktualizace 3D prohlizecu** — nove loadery pro Three.js

**Business value:** Podpora STEP formatu otevira dvere prumyslovym zakaznikum (B2B),
kteri pracuji v CAD systemech (SolidWorks, Fusion 360, FreeCAD). .3mf je moderni
standard pro 3D tisk s barvami, materialem a metadaty uvnitr souboru. Bez techto
formatu se produkt omezuje jen na hobby komunitu.

### A2. Priorita, obtiznost, vlna

- **P1** — dulezite pro konkurenceschopnost, ale S01 a S02 maji vyssi prioritu
  (zakladni funkcionalita).
- **Obtiznost: Vysoka** — zejmena STEP konverze je narocna. OpenCASCADE je velky
  (WASM ~20MB), konverze muze trvat desitky sekund. Backend pipeline je slozity.
- **Vlna 2-3** — .3mf a .obj ve vlne 2 (jednoduche), .step ve vlne 3 (slozite).

### A3. Zavislosti na jinych sekcich

| Smer | Sekce | Typ zavislosti |
|------|-------|----------------|
| **S03 zavisi na S01** | Bug fixes | Per-model konfigurace (bod 1.2) |
| **S03 castecne na S02** | Checkout | Upload validace pred odeslanim objednavky |
| **S08 rozsiruje S03** | Printability check | Mesh validace a opravy |
| **S03 obohacuje S04** | Doprava | Presnejsi hmotnost z 3MF metadat |

### A4. Soucasny stav v codebase

**Existujici soubory relevantni pro S03:**

| Soubor | Umisteni | Stav |
|--------|----------|------|
| File upload zone (kalkulacka) | `src/pages/test-kalkulacka/components/FileUploadZone.jsx` | Accept: `.stl`, `.obj`; maxSize: 50MB |
| File upload zone (model-upload) | `src/pages/model-upload/components/FileUploadZone.jsx` | Accept: `.stl`, `.obj`; maxSize: 50MB |
| Model viewer (kalkulacka) | `src/pages/test-kalkulacka/components/ModelViewer.jsx` | Pouziva `STLLoader` z Three.js |
| Model viewer (model-upload) | `src/pages/model-upload/components/ModelViewer.jsx` | Pouziva `STLLoader` z Three.js |
| Slicer API | `src/services/slicerApi.js` | `sliceModelLocal()` — posila soubor na backend |
| Pricing engine | `src/lib/pricing/pricingEngineV3.js` | Nezavisle na formatu souboru |
| Geom estimate (kalkulacka) | `src/pages/test-kalkulacka/utils/geomEstimate.js` | Client-side odhad geometrie z STL |
| Geom estimate (model-upload) | `src/pages/model-upload/utils/geomEstimate.js` | Client-side odhad geometrie z STL |

**Co uz existuje:**
- `useDropzone` z `react-dropzone` pro drag-and-drop upload
- Three.js je jiz dependency (`@react-three/fiber`, `@react-three/drei`)
- `STLLoader` z `three/examples/jsm/loaders/STLLoader`
- Client-side geometrie vypocet (bounding box, volume, surface area) z STL parsovani
- Backend slicovaci pipeline (PrusaSlicer) — prijima STL, vraci metriky

**Co chybi:**
- Accept atribut pro .3mf, .step, .stp
- Three.js `OBJLoader`, `3MFLoader` — nejsou importovane
- Backend konverzni pipeline pro STEP -> STL/OBJ
- Backend validace novych formatu
- Client-side parsovani .3mf a .obj pro geometrii
- WASM modul (opencascade.js) pro STEP v browseru (nebo backend konverze)
- Error handling pro nevalidni soubory novych formatu

### A5. Referencni zdroje a konkurence

**OSS knihovny doporucene pro S03:**

| Knihovna | Ucel | Poznamka |
|----------|------|----------|
| **Three.js STLLoader** | Jiz pouzivane | Stabilni, nativni |
| **Three.js OBJLoader** | .obj loading v browseru | `three/examples/jsm/loaders/OBJLoader` |
| **Three.js 3MFLoader** | .3mf loading v browseru | `three/examples/jsm/loaders/3MFLoader` |
| **usco-3mf-parser** (npm) | Lightweight 3MF parser | Browser + Node, cistsi API nez Three.js 3MFLoader |
| **three-mf** (npm) | TypeScript-first 3MF | Alternativa k usco |
| **opencascade.js** (ocjs.org) | WASM port OpenCASCADE | STEP/IGES konverze v browseru, ~20MB WASM |
| **Online-3D-Viewer** (kovacsv) | Multi-format viewer | 2k+ hvezd, inspirace pro implementaci |
| **model-viewer** (Google) | Web component pro 3D | 6.5k+ hvezd, neumi STEP |

**Doporuceni:**
- .obj: `Three.js OBJLoader` (jiz v dependencies)
- .3mf: `Three.js 3MFLoader` + `usco-3mf-parser` pro parsovani metadat
- .step: Backend konverze pres OpenCASCADE (C++ library na serveru) nebo
  FreeCAD Python API. Klient zobrazuje konvertovany STL/OBJ.

**Konkurence:**
- AutoQuote3D: Podporuje STL, OBJ, 3MF, STEP; limit 150MB; STEP konverze ~30s
- Xometry: Podporuje 15+ formatu vcetne STEP, IGES, Parasolid
- Craftcloud: STL, OBJ, 3MF; STEP jen pres konvertory treti strany
- i.materialise: STL, OBJ, 3MF, VRML, X3D; STEP ne

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Rozsireni file objektu v `uploadedFiles` state:**

```json
{
  "id": "file-123",
  "name": "part_v2.step",
  "size": 2500000,
  "type": "application/octet-stream",
  "originalFormat": "step",
  "file": "[File object]",
  "uploadedAt": "2026-02-06T14:30:00Z",

  "conversionStatus": "completed",
  "convertedFile": {
    "format": "stl",
    "url": "blob:...",
    "size": 1800000
  },

  "validation": {
    "valid": true,
    "format_detected": "step",
    "is_manifold": true,
    "triangle_count": 25000,
    "has_errors": false,
    "errors": [],
    "warnings": ["Model contains thin walls (< 0.5mm)"]
  },

  "metadata": {
    "bounding_box": { "x": 50.2, "y": 30.1, "z": 15.8 },
    "volume_mm3": 12500,
    "surface_mm2": 8900,
    "triangle_count": 25000,
    "unit": "mm"
  },

  "status": "completed",
  "result": {
    "metrics": { "estimatedTimeSeconds": 3600, "filamentGrams": 25 },
    "modelInfo": { "volumeMm3": 12500, "sizeMm": { "x": 50.2, "y": 30.1, "z": 15.8 } }
  }
}
```

**Admin upload config (rozsireni `widget` namespace):**

```json
{
  "upload": {
    "allowed_formats": ["stl", "obj", "3mf", "step", "stp"],
    "max_file_size_mb": 100,
    "max_files_per_order": 20,
    "step_conversion_enabled": true,
    "auto_repair_mesh": false,
    "show_validation_warnings": true
  }
}
```

### B2. API kontrakty (endpointy)

**Existujici endpoint (uprava):**

```
POST /api/slice
  Request: {
    file: File,           // Nyni akceptuje .stl, .obj, .3mf, .step, .stp
    presetId: string
  }
  Response (beze zmeny): {
    metrics: { estimatedTimeSeconds, filamentGrams },
    modelInfo: { volumeMm3, sizeMm, surfaceMm2 }
  }
```

**Novy endpoint — validace souboru:**

```
POST /api/files/validate
  Request: { file: File }
  Response (200): {
    valid: boolean,
    format_detected: "stl" | "obj" | "3mf" | "step",
    is_manifold: boolean,
    triangle_count: number,
    bounding_box: { x: number, y: number, z: number },
    volume_mm3: number,
    surface_mm2: number,
    errors: string[],
    warnings: string[]
  }
  Errors:
    400: { error: "INVALID_FILE", message: "File is corrupted or unsupported" }
    413: { error: "FILE_TOO_LARGE", max_size_mb: 100 }
    415: { error: "UNSUPPORTED_FORMAT", allowed: ["stl", "obj", "3mf", "step"] }
```

**Novy endpoint — konverze STEP -> STL:**

```
POST /api/files/convert
  Request: { file: File, target_format: "stl" | "obj" }
  Response (200): {
    converted_file_url: string,
    original_format: "step",
    target_format: "stl",
    conversion_time_ms: number,
    metadata: { volume_mm3: number, surface_mm2: number, triangle_count: number }
  }
  Response (202 — async): {
    job_id: string,
    status: "processing",
    estimated_time_seconds: 30
  }
  Errors:
    400: { error: "CONVERSION_FAILED", message: "Invalid STEP geometry" }
    504: { error: "CONVERSION_TIMEOUT", message: "Conversion exceeded time limit" }
```

**Novy endpoint — status konverze (pro async):**

```
GET /api/files/convert/:jobId
  Response: {
    status: "processing" | "completed" | "failed",
    progress_percent: number,
    converted_file_url?: string,
    error?: string
  }
```

### B3. Komponentni strom (React)

```
TestKalkulacka (index.jsx)
|-- FileUploadZone (upraveny)
|   |-- DropzoneArea               // accept: .stl, .obj, .3mf, .step, .stp
|   |-- FileList
|   |   +-- FileListItem
|   |       |-- FormatBadge        << NOVY: zobrazuje format souboru (STL/OBJ/3MF/STEP)
|   |       |-- ConversionStatus   << NOVY: "Konvertuji..." pro STEP
|   |       +-- ValidationBadge    << NOVY: zeleny/cerveny indikator validity
|   +-- FormatInfoTooltip          << NOVY: info o podporovanych formatech
|-- ModelViewer (upraveny)
|   |-- STLModel                   // stavajici
|   |-- OBJModel                   << NOVY: OBJLoader
|   |-- ThreeMFModel               << NOVY: 3MFLoader
|   +-- ConvertedModel             << NOVY: zobrazuje konvertovany STL z STEP
|-- PrintConfiguration
+-- PricingCalculator
```

**Novy hook `useFileLoader`:**

```jsx
// src/pages/test-kalkulacka/hooks/useFileLoader.js
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';

export function useFileLoader(file) {
  const [geometry, setGeometry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!file?.file) return;
    setLoading(true);

    const format = detectFormat(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let geom;
        if (format === 'stl') {
          geom = new STLLoader().parse(event.target.result);
        } else if (format === 'obj') {
          geom = new OBJLoader().parse(event.target.result);
        } else if (format === '3mf') {
          geom = new ThreeMFLoader().parse(event.target.result);
        } else if (format === 'step' || format === 'stp') {
          // STEP nelze parsovat client-side; cekame na backend konverzi
          setLoading(false);
          return;
        }
        setGeometry(geom);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    };

    if (format === 'obj') {
      reader.readAsText(file.file);
    } else {
      reader.readAsArrayBuffer(file.file);
    }
  }, [file]);

  return { geometry, loading, error };
}

function detectFormat(filename) {
  const ext = (filename || '').split('.').pop().toLowerCase();
  if (ext === 'stl') return 'stl';
  if (ext === 'obj') return 'obj';
  if (ext === '3mf') return '3mf';
  if (ext === 'step' || ext === 'stp') return 'step';
  return 'unknown';
}
```

### B4. Tenant storage namespace

| Namespace | Helper | Pouziti v S03 |
|-----------|--------|---------------|
| `widget` | `adminBrandingWidgetStorage.js` | Upload config (allowed_formats, max_size) |
| `pricing:v3` | `adminPricingStorage.js` | Beze zmen, pricing engine format-agnostic |
| `fees:v3` | `adminFeesStorage.js` | Beze zmen |

### B5. Widget integrace (postMessage)

**Nove postMessage zpravy:**

```js
// Widget -> Parent (konverze souboru)
{
  type: 'MODEL_PRICER_FILE_CONVERSION',
  fileId: string,
  originalFormat: string,
  status: 'processing' | 'completed' | 'failed',
  conversionTimeMs: number
}

// Widget -> Parent (validace souboru)
{
  type: 'MODEL_PRICER_FILE_VALIDATED',
  fileId: string,
  format: string,
  valid: boolean,
  errors: string[],
  warnings: string[]
}
```

### B6. Pricing engine integrace

**Pricing engine je format-agnostic.** Nepracuje s formaty souboru, pouze
s metrikami (cas, material, objem, povrch). Takze:

- .stl metriky: jiz funguji (backend PrusaSlicer)
- .obj metriky: PrusaSlicer umi OBJ, takze metriky budou z backendu
- .3mf metriky: PrusaSlicer nativne podporuje 3MF, dokonce lepe nez STL
  (3MF muze obsahovat informace o materialu, barve, atd.)
- .step metriky: Po konverzi na STL/OBJ backend posle konvertovany soubor
  do PrusaSliceru, ktery vrati metriky

```
STEP soubor -> /api/files/convert -> STL -> /api/slice -> metriky
                                                         |
                                                         v
                                                  calculateOrderQuote()
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-3d` | Architektura konverzniho pipeline, review | - | P0 |
| `mp-sr-frontend` | Review frontend integrace | - | P1 |
| `mp-spec-3d-viewer` | Integrace OBJLoader, 3MFLoader do ModelViewer | `ModelViewer.jsx` (oba) | P0 |
| `mp-spec-3d-conversion` | Backend STEP->STL konverze (OpenCASCADE/FreeCAD) | Backend service | P0 |
| `mp-spec-3d-analysis` | Client-side parsovani geometrie pro nove formaty | `geomEstimate.js` (oba) | P1 |
| `mp-mid-frontend-public` | Upload zone rozsireni, format badge, conversion status | `FileUploadZone.jsx` (oba) | P0 |
| `mp-spec-fe-upload` | Drag-and-drop aktualizace, accept atribut, validace UI | `FileUploadZone.jsx` | P0 |
| `mp-spec-be-upload` | Backend validacni pipeline, MIME type check | Backend endpoint | P0 |
| `mp-spec-be-slicer` | Rozsireni slice pipeline pro nove formaty | Backend slicer service | P0 |
| `mp-mid-frontend-admin` | Admin upload config (formats, max size) | Admin UI | P2 |
| `mp-spec-security-upload` | Upload security: file type spoofing, magic bytes, zip bombs (3MF) | - | P0 |
| `mp-sr-quality` | Code review | - | P0 |
| `mp-spec-test-unit` | Unit testy parsovani, validace | `__tests__/` | P1 |
| `mp-spec-test-e2e` | E2E testy upload kazdeho formatu | `e2e/` | P2 |
| `mp-spec-infra-deps` | Pridani Three.js loader dependencies, opencascade.js | `package.json` | P1 |

### C2. Implementacni kroky (poradi)

```
VLNA 2A: .3mf a .obj (jednoduche formaty)

KROK 1: [PARALELNE] Priprava
  1a. mp-spec-fe-upload: Aktualizovat accept atribut v obou FileUploadZone
  1b. mp-spec-3d-viewer: Import OBJLoader a 3MFLoader z Three.js
  1c. mp-spec-be-upload: Backend validace .obj a .3mf souboru (MIME, parsovani)

KROK 2: [SEKVENCNE po 1] Frontend integrace
  2a. mp-spec-3d-viewer: Vytvorit useFileLoader hook s format detection
  2b. mp-spec-3d-viewer: OBJModel a ThreeMFModel komponenty
  2c. mp-mid-frontend-public: FormatBadge komponent (ikona + nazev formatu)
  2d. mp-spec-3d-analysis: Rozsirit geomEstimate.js pro OBJ a 3MF geometrii

KROK 3: [SEKVENCNE po 2] Backend slice pipeline
  3a. mp-spec-be-slicer: PrusaSlicer jiz umi 3MF a OBJ — overit a pridat
  3b. mp-spec-be-slicer: Aktualizovat MIME type whitelist

KROK 4: Quality gates pro vlnu 2A
  4a. Testy: upload .obj, .3mf, zobrazeni, slice, cena
  4b. Security: file type spoofing test, zip bomb test pro 3MF

---

VLNA 3: .step/.stp (slozity format)

KROK 5: [PARALELNE] Backend konverze
  5a. mp-spec-3d-conversion: Instalace OpenCASCADE na server (nebo Docker image)
  5b. mp-spec-3d-conversion: Implementace /api/files/convert endpointu
  5c. mp-spec-3d-conversion: Async zpracovani — job queue pro velke soubory

KROK 6: [SEKVENCNE po 5] Frontend integrace STEP
  6a. mp-mid-frontend-public: ConversionStatus komponent ("Konvertuji soubor...")
  6b. mp-mid-frontend-public: Zobrazeni konvertovaneho STL v ModelViewer
  6c. mp-spec-fe-upload: Aktualizace upload flow pro async konverzi
  6d. mp-spec-3d-analysis: Metadata extrakce z konvertovaneho souboru

KROK 7: [SEKVENCNE po 6] Polishing
  7a. mp-mid-frontend-admin: Admin toggle: zapnout/vypnout STEP podporu
  7b. mp-spec-be-upload: Timeout a retry pro velke STEP soubory
  7c. mp-spec-be-slicer: Pipeline: STEP -> konverze -> STL -> PrusaSlicer

KROK 8: Quality gates pro vlnu 3
  8a. Testy: upload .step, konverze, zobrazeni, slice, cena
  8b. Performance: konverzni cas pro ruzne velikosti
  8c. Security: zlomyslny STEP soubor, resource exhaustion
```

### C3. Kriticke rozhodovaci body

**RB1: STEP konverze — server-side vs. client-side (WASM)?**
- **Server-side (doporuceno):** OpenCASCADE jako C++ library na serveru.
  Spolehlivejsi, rychlejsi, neni omezena RAM/CPU browseru.
  Ale vyzaduje server infrastructure.
- **Client-side WASM:** `opencascade.js` (~20MB WASM download).
  Funguje bez serveru, ale pomale a memory-intensive.
  Limit: velke STEP soubory mohou crashnout browser.
- **Doporuceni:** Server-side. Client-side WASM jako fallback pro jednoduche soubory.

**RB2: Synchronni vs. asynchronni konverze STEP?**
- **Synchronni:** Jednodussi, ale blokuje request na desitky sekund.
- **Asynchronni (doporuceno):** Job queue (BullMQ + Redis), polling status,
  uzivatel vidi progress. Lepsi UX pro velke soubory.
- **Doporuceni:** Asynchronni s progress indikaci.

**RB3: Ukladani konvertovanych souboru — dockasne vs. permanentne?**
- **Dockasne (doporuceno pro MVP):** Blob URL v pameti, smazat po session.
  Jednoduche, neni treba storage.
- **Permanentne:** Ulozit na server/S3. Moznost znovu zobrazit bez konverze.
  Ale vyzaduje storage management.
- **Doporuceni:** Dockasne pro MVP, permanentne pozdeji.

**RB4: 3MF parsovani — Three.js 3MFLoader vs. usco-3mf-parser?**
- Three.js 3MFLoader: Jiz v dependencies, ale ne vzdy spolehlivy.
- usco-3mf-parser: Lightweight, cistsi API, ale nova zavislost.
- **Doporuceni:** Zkusit Three.js 3MFLoader, fallback na usco pokud problemy.

**RB5: Maximalni velikost souboru — 50MB vs. 100MB vs. 150MB?**
- Aktualni: 50MB (v `FileUploadZone.jsx`)
- AutoQuote3D: 150MB
- .step soubory mohou byt velke (100MB+ pro slozite sestavy)
- **Doporuceni:** 100MB pro MVP, konfigurovatelne v admin panelu.

### C4. Testovaci strategie

**Unit testy:**
- `detectFormat()`: spravna detekce pro vsechny pripony
- `useFileLoader`: mock souboru, spravny loader pro kazdy format
- `geomEstimate.js`: bounding box, volume pro OBJ/3MF
- Backend validace: validni/nevalidni soubory kazdeho formatu
- Konverze: mock STEP soubor, overit ze vraci STL

**E2E testy:**
- Upload .obj -> zobrazeni v ModelViewer -> slice -> cena
- Upload .3mf -> zobrazeni -> slice -> cena
- Upload .step -> "Konvertuji..." -> zobrazeni konvertovaneho -> slice -> cena
- Upload nevalidni .stl (corrupted) -> chybova hlaska
- Upload prilis velky soubor -> chybova hlaska "Max 100MB"
- Upload .exe prejmenovany na .stl -> detekce a odmitnutI
- Drag-and-drop vice souboru ruznych formatu najednou

**Manualni testy:**
- Testovaci sada souboru: minimalni STL (1 trojuhelnik), velky STEP (50MB),
  3MF s barvami a materialem, OBJ s texturami
- Performance: konverzni cas STEP ruznych velikosti (1MB, 10MB, 50MB)
- Browser compatibility: Chrome, Firefox, Safari (WASM podpora)
- Mobile: upload z telefonu (fotoaparat nepouzitelny, ale file picker)

### C5. Migrace existujicich dat

**Zadna migrace existujicich dat.** Stavajici STL soubory funguji beze zmen.
Nove formaty jsou aditivni — nemeni nic na existujicim chovani.

Jedina zmena: `accept` atribut v `useDropzone` se rozsiri o nove pripony.
Stavajici .stl/.obj funguji identicky.

---

## D. KVALITA

### D1. Security review body

| Oblast | Riziko | Opatreni |
|--------|--------|----------|
| **File type spoofing** | Utocnik prejmenu .exe na .stl | Magic bytes validace (prvnich N bajtu), ne jen pripona |
| **Zip bomb (3MF)** | 3MF je ZIP archiv, muze obsahovat enormni data | Limit dekompresni velikosti (10x original), timeout |
| **Path traversal** | 3MF ZIP muze obsahovat `../../etc/passwd` | Sanitizace cest v ZIP archivu |
| **STEP parser crash** | Zlomyslny STEP soubor muze crashnout OpenCASCADE | Sandbox (Docker), timeout, resource limity |
| **Memory exhaustion** | Velky model (miliony trojuhelniku) | Client: limit 2M trojuhelniku. Backend: limit 10M. |
| **XSS v nazvu souboru** | `<script>alert(1)</script>.stl` | Escapovani nazvu souboru, sanitizace |
| **DDoS konverze** | Hromadny upload STEP souboru | Rate limiting, job queue s max concurrent |
| **MIME type confusion** | `application/octet-stream` pro vsechny 3D formaty | Magic bytes + pripona validace |

**Magic bytes reference:**
- STL (binary): zacina na `solid ` (ASCII) nebo 80-byte header (binary)
- OBJ: text file, zacina na `#` (komentar) nebo `v ` (vertex)
- 3MF: ZIP format, magic bytes `PK\x03\x04`
- STEP: zacina na `ISO-10303-21;` nebo `HEADER;`

### D2. Performance budget

| Metrika | Budget | Strategie |
|---------|--------|-----------|
| **OBJ loading (10k tris)** | < 500ms | OBJLoader je rychly, geometrie se cacheuje |
| **3MF loading (10k tris)** | < 1s | ZIP decomprese + parsovani, pouzit Worker |
| **STEP konverze (1MB)** | < 10s | Backend OpenCASCADE, async s progress |
| **STEP konverze (50MB)** | < 120s | Backend queue, timeout 2 minuty |
| **Bundle size (OBJLoader + 3MFLoader)** | ~15kB gzipped | Lazy import pres dynamic import() |
| **Bundle size (opencascade.js)** | ~20MB WASM | Nepouzivat client-side, jen backend |
| **Max triangles rendered** | 2M (client) | LOD nebo decimation pro velke modely |
| **Memory limit (browser)** | < 500MB | Geometry disposal po prepnuti modelu |

### D3. Accessibility pozadavky

| Pozadavek | Implementace |
|-----------|-------------|
| **Upload zone** | `aria-label="Oblast pro nahrani souboru"`, podporovane formaty v textu |
| **Format badge** | `aria-label="Format souboru: STEP"`, `role="status"` |
| **Conversion status** | `aria-live="polite"`, `aria-busy="true"` behem konverze |
| **Error messages** | `role="alert"` pro chyby validace souboru |
| **File list** | `role="list"`, `role="listitem"` pro kazdy soubor |
| **Keyboard** | Tab na upload zone, Enter/Space pro file picker dialog |
| **Screen readers** | Oznameni o uspesnem uploadu, konverzi, chybe |

### D4. Error handling a edge cases

| Stav | Reseni |
|------|--------|
| Nevalidni STL (poruseny mesh) | "Soubor obsahuje chyby v geometrii. Zkuste ho opravit v Meshmixeru." |
| Prazdny soubor (0 bytes) | "Soubor je prazdny." |
| Prilis velky soubor | "Maximalni velikost souboru je 100 MB." (konfigurovatelne) |
| Nepodporovany format | "Nepodporovany format. Podporujeme: STL, OBJ, 3MF, STEP." |
| STEP konverze selhala | "Konverze souboru selhala. Zkuste exportovat jako STL ve vasem CAD programu." |
| STEP konverze timeout | "Konverze trva prilis dlouho. Soubor je mozna prilis slozity." |
| 3MF s vice objekty | Rozbalit vsechny objekty jako samostatne modely |
| OBJ s MTL (materily) | MTL ignorovat pro MVP, budouci rozsireni |
| STEP s vice tely (assembly) | Konvertovat vsechna tela, uzivatel vybere |
| Network error behem uploadu | Retry tlacitko, zachovat soubor v pameti |
| Browser nepodporuje WASM | Fallback: "STEP soubory vyzaduji moderni prohlizec." |

### D5. i18n pozadavky

**Nove prekladove klice (CZ/EN):**

```json
{
  "upload.formats": "Podporovane formaty: STL, OBJ, 3MF, STEP / Supported formats: STL, OBJ, 3MF, STEP",
  "upload.maxSize": "Maximalni velikost: {size} MB / Maximum size: {size} MB",
  "upload.converting": "Konvertuji soubor... / Converting file...",
  "upload.conversionProgress": "Konverze: {percent}% / Conversion: {percent}%",
  "upload.conversionDone": "Konverze dokoncena / Conversion completed",
  "upload.conversionFailed": "Konverze selhala / Conversion failed",
  "upload.validating": "Validuji soubor... / Validating file...",
  "upload.invalid": "Nevalidni soubor / Invalid file",
  "upload.formatBadge.stl": "STL mesh",
  "upload.formatBadge.obj": "OBJ mesh",
  "upload.formatBadge.3mf": "3MF (3D Manufacturing Format)",
  "upload.formatBadge.step": "STEP (CAD format)",
  "upload.error.tooLarge": "Soubor je prilis velky / File is too large",
  "upload.error.unsupported": "Nepodporovany format / Unsupported format",
  "upload.error.corrupted": "Soubor je poskozen / File is corrupted",
  "upload.error.conversionTimeout": "Konverze vyprsela / Conversion timed out",
  "upload.hint.step": "STEP soubory jsou automaticky konvertovany / STEP files are automatically converted"
}
```

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flag `ENABLE_OBJ_3MF`:**
- Default: `true` (jednoduche formaty, nizke riziko)
- Zapina .obj a .3mf podporu

**Feature flag `ENABLE_STEP_CONVERSION`:**
- Default: `false` (vysoke riziko, vyzaduje backend infrastrukturu)
- Zapina .step/.stp podporu
- Vyzaduje nakonfigurovany konverzni backend

**Postupne nasazeni:**
1. Vlna 2A: .obj + .3mf — merge, test, produkce
2. Vlna 3: .step — staging s konverznim backendem, beta testovani
3. .step produkce az po uspesnem beta testu (2-4 tydny)

### E2. Admin UI zmeny

| Zmena | Stranka | Detail |
|-------|---------|--------|
| Upload config | Admin > Widget > Upload | Povolene formaty, max velikost |
| STEP toggle | Admin > Widget > Upload | Zapnout/vypnout STEP podporu |
| Format statistiky | Admin > Analytics | Pocet uploadu podle formatu |

### E3. Widget zmeny

| Zmena | Komponenta | Detail |
|-------|-----------|--------|
| Accept atribut | `FileUploadZone.jsx` (oba) | Pridat .3mf, .step, .stp |
| Format badge | `FileUploadZone.jsx` | Vizualni indikator formatu |
| Conversion status | Novy `ConversionStatus.jsx` | "Konvertuji..." pro STEP |
| Model viewer | `ModelViewer.jsx` (oba) | OBJLoader, 3MFLoader |
| File loader hook | Novy `useFileLoader.js` | Univerzalni loader |
| PostMessage | `WidgetEmbed.jsx` | `MODEL_PRICER_FILE_CONVERSION` |

### E4. Dokumentace pro uzivatele

| Dokument | Obsah |
|----------|-------|
| Upload guide | Podporovane formaty, limity velikosti, tipy pro STEP export |
| Admin guide: Upload | Jak konfigurovat povolene formaty a limity |
| API docs | Nove endpointy /api/files/validate, /api/files/convert |
| Troubleshooting | "STEP konverze selhava" — jak exportovat kompatibilni STEP |

### E5. Metriky uspechu (KPI)

| KPI | Cilova hodnota | Mereni |
|-----|---------------|--------|
| **Upload success rate (vsechny formaty)** | > 95% | Error tracking |
| **STEP konverze success rate** | > 90% | Backend metriky |
| **Prumerny konverzni cas STEP** | < 30s | Backend metriky |
| **Podil ne-STL uploadu** | > 20% do 3 mesicu | Analytics |
| **Podil STEP uploadu** | > 10% (B2B segment) | Analytics |
| **Zakaznicky uplift (novy formaty -> objednavka)** | +10% | Conversion tracking |
| **Bundle size narust** | < 20kB gzipped (bez WASM) | Build metriky |
| **Chybovost 3MF zip bomb** | 0 uspesnych utoku | Security audit |
| **Regrese v STL flow** | 0 | Test suite |
