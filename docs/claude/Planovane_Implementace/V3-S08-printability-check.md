# V3-S08: Kontrola tisknutelnosti a mesh analyza

> **Priorita:** P2 | **Obtiznost:** Vysoka | **Vlna:** 3
> **Zavislosti:** S01 (Bug Fixes), S03 (Multi-format files), slicer integrace (backend-local)
> **Odhadovany rozsah:** Velky (15-25 souboru, 7-10 dni)

---

## A. KONTEXT

### A1. Ucel a cil

Kontrola tisknutelnosti (printability check) je automaticka analyza nahranEho 3D modelu,
ktera zjisti potencialni problemy pred tiskem: neuzavreny mesh, tenke steny, prekroceni
tiskoveho objemu, pocet oddelenych dilu, previsy vyzadujici supporty, a dalsi DFM
(Design for Manufacturing) zpetnou vazbu.

Toto je technicky nejnarocnejsi sekce — vyzaduje analyzu 3D geometrie na backendu (nebo ve WASM
na frontendu). Konkurencni sluzby jako Layers.app nabizeji printability check, zakaznici
z for silne zadaji DFM zpetnou vazbu.

**Business value:**
- Snizeni poctu neuspesnych tisku — zakaznik opravI problemy pred objednanim
- Profesionalni dojem — DFM zpetna vazba zvysuje duveru v sluzbu
- Snizeni support nakladu — mene dotazu typu "proc se muj model nevytiskl?"
- Automaticke filtrovani neprintovatelnych modelu — setri cas operatoru
- Vizualizace problemovych oblasti v 3D prohlizeci — zakaznik vidi kde je problem
- Upsell prilezitost — doporucit silnejsi material pro tenke steny

**Co tato sekce resi:**
1. Backend mesh analyza (watertight, wall thickness, bounding box, part count, volume)
2. Automaticka detekce jednotek a nabidka scale
3. DFM zpetna vazba (previsy, tenke vycnelky, velke plochy, male diry, ostre rohy)
4. Vizualizace v 3D prohlizeci (barevne zvyrazneni problemovych oblasti)
5. Admin konfigurace parametru tiskArny (max rozmery, min tloustka sten)

### A2. Priorita, obtiznost, vlna

**Priorita P2** — pokrocila funkcionalita, neni potreba pro zakladni objednavani.
Zakaznici mohou objednat i bez DFM zpetne vazby.

**Obtiznost Vysoka** — vyzaduje:
- 3D geometricka analyza na backendu (Python trimesh nebo WASM manifold-3d)
- Asynchronni zpracovani (analyza trva sekundy-minuty)
- WebSocket/polling pro notifikaci o dokonceni analyzy
- Vizualizace v Three.js prohlizeci (shader pro zvyrazneni)
- Mnoho edge cases (ruzne formaty, broken meshes, velke soubory)

**Vlna 3** — zavisi na S03 (Multi-format files) pro podporu vsech formatu.
Zakladni kontroly (watertight, bounding box) lze implementovat drive.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred touto sekci:**
- S01 (Bug Fixes) — stabilni 3D viewer
- Slicer integrace (backend-local) — uz existuje

**Silne doporucene:**
- S03 (Multi-format files) — pro analyzu 3MF, STEP formatu

**Tato sekce je zavislost pro:**
- S15 (Rozsirene cenotvorby) — DFM score muze ovlivnit cenu
- Zadna sekce na teto primo nezavisi (je to "nice-to-have" feature)

**Paralelni implementace mozna s:**
- S10 (Kupony), S11 (Chat), S13 (Dokumenty) — nezavisle subsystemy

### A4. Soucasny stav v codebase

**Slicer integrace — `src/services/slicerApi.js`:**
- Endpoint: `POST /api/slice` — posila STL/OBJ na backend
- Vraci: `{ metrics: { estimatedTimeSeconds, filamentGrams }, modelInfo: { sizeMm: {x,y,z}, volumeMm3 } }`
- Backend: `backend-local/` — Express + PrusaSlicer CLI
- **Nevrac ziadnu analyzu printability** — jen metriky pro cenotvorbu

**Slicing API client — `src/lib/slicingApiClient.js`:**
- Demo estimat pokud backend neni dostupny
- Zahrnuje: cas, material, rozmery

**3D Viewer — `src/pages/test-kalkulacka/components/ModelViewer.jsx`:**
- Three.js based 3D prohlizec
- Zozbrazuje STL model s osvetlenim a rotaci
- **NEMA** DFM vizualizacni rezim (barevne zvyrazneni)

**Geometry estimate — `src/pages/test-kalkulacka/utils/geomEstimate.js`:**
- Klientska analyza STL souboru
- Extrahovany objem (volumeMm3) a povrch (surfaceMm2) z triangl meshe
- Zakladni bounding box
- **NEMA** watertight check, wall thickness, part count

**Backend — `backend-local/`:**
- Express server, PrusaSlicer CLI
- **NEMA** Python analyzu (trimesh)
- **NEMA** mesh validation endpoint

### A5. Referencni zdroje a konkurence

**OSS knihovny (z doporuceni):**

| Knihovna | Popis | Pouziti |
|----------|-------|---------|
| **Kiri:Moto** (GridSpace) | Browser-based slicing, 2k+ stars | Mesh repair, slicing |
| **Mesh:Tool** (GridSpace) | Mesh repair/editing | Oprava broken meshes |
| **manifold-3d** | WASM mesh validation, 1k+ stars | Watertight check, boolean ops |
| **meshoptimizer** | Mesh optimization, 5k+ stars | Decimation, simplification |
| **three-mesh-bvh** | BVH acceleration, 2.4k+ stars | Ray casting pro wall thickness |
| **trimesh** (Python) | Python mesh library, 3k+ stars | Kompletni analyza na backendu |
| **admesh** (C) | STL analyza a oprava | Leightweight alternativa |

**Doporuceni:** `trimesh` (Python) pro backend analyzu + `manifold-3d` (WASM) pro klientskou validaci

**Konkurencni reseni:**
- **Layers.app:** Printability check s tabulkou vysledku, barevna vizualizace
- **Xometry:** Instant DFM feedback s doporucenImI
- **3D Hubs (Protolabs):** Wall thickness analyza, overhang detection
- **Shapeways:** Automatic printability check s barevnou mapou

**PrusaSlicer CLI:**
- Flag `--check-model` pro zakladni kontrolu (neni plne DFM)
- Vraci warnings o broken mesh, overhangs (jen zakladni)

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Analyza se NEUKLADA do localStorage** — je transientni (per-session, per-upload).
Vysledek analyzy se uklada do stavu uploadovaneho souboru (in-memory).

**Analyza result schema:**
```json
{
  "analysis_version": 1,
  "status": "completed",
  "analyzed_at": "2026-02-06T12:00:00Z",
  "duration_ms": 2500,

  "basic_metrics": {
    "volume_mm3": 12500.5,
    "surface_area_mm2": 8750.3,
    "bounding_box_mm": { "x": 45.2, "y": 30.1, "z": 20.0 },
    "triangle_count": 15420,
    "body_count": 1,
    "weight_estimate_g": 15.0
  },

  "printability": {
    "overall_score": "OK",
    "checks": [
      {
        "id": "mesh_integrity",
        "name": "Mesh integrita",
        "status": "OK",
        "severity": "none",
        "message": "Model je v poradku — mesh je uzavreny.",
        "details": {
          "is_watertight": true,
          "is_winding_consistent": true,
          "euler_number": 2,
          "open_edges": 0,
          "inverted_normals": 0
        }
      },
      {
        "id": "wall_thickness",
        "name": "Tloustka sten",
        "status": "WARNING",
        "severity": "medium",
        "message": "Nektere steny jsou tensi nez 0.6mm — mohou byt krehke.",
        "details": {
          "min_thickness_mm": 0.6,
          "recommended_min_mm": 0.8,
          "thin_areas_count": 3
        }
      },
      {
        "id": "bounding_box",
        "name": "Rozmery vs tiskovy objem",
        "status": "OK",
        "severity": "none",
        "message": "Model se vejde do tiskoveho objemu.",
        "details": {
          "model_size_mm": { "x": 45.2, "y": 30.1, "z": 20.0 },
          "printer_max_mm": { "x": 250, "y": 210, "z": 210 },
          "fits": true,
          "utilization_percent": { "x": 18.1, "y": 14.3, "z": 9.5 }
        }
      },
      {
        "id": "part_count",
        "name": "Pocet dilu",
        "status": "INFO",
        "severity": "none",
        "message": "Soubor obsahuje 1 dil.",
        "details": { "count": 1 }
      },
      {
        "id": "overhangs",
        "name": "Previsy (supporty)",
        "status": "WARNING",
        "severity": "low",
        "message": "Model obsahuje previsy >45 stupnu. Supporty doporuceny.",
        "details": {
          "overhang_area_mm2": 120.5,
          "overhang_percent": 1.4,
          "max_overhang_angle": 72
        }
      }
    ]
  },

  "dfm_tips": [
    {
      "id": "orientation",
      "category": "Orientace",
      "message": "Model obsahuje previsy vyzadujici podpory. Zvazete otoceni modelu.",
      "severity": "low",
      "actionable": true
    },
    {
      "id": "thin_features",
      "category": "Tenke casti",
      "message": "Nektere detaily jsou tensi nez 1mm. Mohou byt krehke po vytisteni.",
      "severity": "medium",
      "actionable": false
    }
  ],

  "unit_detection": {
    "detected_unit": "mm",
    "confidence": "high",
    "suggestion": null
  }
}
```

**Admin konfigurace tiskarny (v pricing:v3):**
```json
{
  "printer_config": {
    "max_build_volume_mm": { "x": 250, "y": 210, "z": 210 },
    "min_wall_thickness_mm": 0.8,
    "nozzle_diameter_mm": 0.4,
    "printability_check_enabled": true,
    "dfm_tips_enabled": true,
    "auto_unit_detection_enabled": true
  }
}
```

**Klic:** `modelpricer:${tenantId}:pricing:v3` — rozsireni existujiciho namespace

### B2. API kontrakty (endpointy)

**Nove backend endpointy:**

```
# Printability analyza (asynchronni)
POST   /api/v1/analyze
Body:   multipart/form-data { model: File }
Response: { job_id: "analyze_123", status: "queued" }

# Stav analyzy (polling)
GET    /api/v1/analyze/:jobId
Response (pending):   { status: "processing", progress: 45 }
Response (complete):  { status: "completed", result: { ...analysis } }
Response (error):     { status: "error", error: "Invalid mesh format" }

# Rychla analyza (synchronni, jen zakladni kontroly)
POST   /api/v1/analyze/quick
Body:   multipart/form-data { model: File }
Response: { result: { basic_metrics, printability: { checks: [mesh_integrity, bounding_box] } } }

# Admin konfigurace tiskarny
GET    /api/v1/printer-config
Response: { max_build_volume_mm, min_wall_thickness_mm, ... }

PUT    /api/v1/printer-config
Body:   { max_build_volume_mm: { x: 250, y: 210, z: 210 }, ... }
Response: { ...saved }

# DFM vizualizace (vrati mesh data s problemovymi oblastmi)
GET    /api/v1/analyze/:jobId/visualization
Response: {
  problem_areas: [
    { type: "thin_wall", vertices: [...], faces: [...], color: "#FF0000" },
    { type: "overhang", vertices: [...], faces: [...], color: "#FFAA00" }
  ]
}
```

**Error kody:**
- `400` — neplatny format souboru
- `413` — soubor prilis velky (max 100MB)
- `422` — mesh neni zpracovatelny
- `429` — rate limit (max 10 analyz/minutu)
- `504` — timeout analyzy (max 120s)

### B3. Komponentni strom (React)

```
ModelViewer.jsx (existujici — rozsirit)
├── ThreeScene (existujici)
│   ├── ModelMesh (existujici)
│   └── DfmOverlay (NOVY — vizualizace problemovych oblasti)
│       ├── ThinWallHighlight (cervena)
│       ├── OverhangHighlight (oranzova)
│       └── Legend (vysvetleni barev)
├── ViewerControls (existujici)
│   └── DfmToggleButton (NOVY — "Zobrazit DFM")
└── AnalysisPanel (NOVY)

PrintConfiguration.jsx (kalkulacka)
├── ... existujici sekce
└── PrintabilityPanel (NOVY)
    ├── PanelHeader ("Kontrola tisknutelnosti")
    ├── OverallScore (OK/WARNING/ERROR badge)
    ├── CheckList
    │   ├── CheckItem (pro kazdy check)
    │   │   ├── StatusIcon (zelena/zluta/cervena)
    │   │   ├── CheckName
    │   │   ├── CheckMessage
    │   │   └── ExpandButton → CheckDetails
    │   └── [loading state: spinner]
    ├── DfmTipsSection ("Tipy pro lepsi tisk")
    │   ├── TipItem
    │   │   ├── TipIcon
    │   │   ├── TipCategory
    │   │   └── TipMessage
    │   └── Disclaimer ("Tyto tipy jsou orientacni.")
    └── ShowDetailsButton → FullAnalysisModal

UnitDetectionDialog (NOVY — modal)
├── Header ("Neobvykle rozmery modelu")
├── CurrentDimensions ("Rozmery: 0.5 x 0.5 x 1.0")
├── UnitOptions
│   ├── RadioOption ("Milimetry — ponechat")
│   ├── RadioOption ("Palce — prepocitat na 12.7 x 12.7 x 25.4 mm")
│   └── RadioOption ("Centimetry — prepocitat na 5 x 5 x 10 mm")
├── PreviewDimensions (po vyberu)
└── ConfirmButton

AdminPricing.jsx (rozsireni)
└── PrinterConfigSection (NOVY)
    ├── BuildVolume (X, Y, Z inputs v mm)
    ├── MinWallThickness (number input)
    ├── NozzleDiameter (number input)
    ├── PrintabilityCheckToggle
    ├── DfmTipsToggle
    └── AutoUnitDetectionToggle
```

### B4. Tenant storage namespace

- **Analyza:** In-memory (transientni per-upload), NEUKLADA se do localStorage
- **Printer config:** V ramci `pricing:v3` namespace (existujici) — nove pole `printer_config`
- **Helper:** Rozsireni `adminPricingStorage.js` o `normalizePrinterConfig()`

### B5. Widget integrace (postMessage)

Widget dostava printer config pro bounding box check:

```javascript
// Widget config
{
  type: 'MODELPRICER_CONFIG',
  payload: {
    pricingConfig: {
      // ... existujici
      printer_config: {
        max_build_volume_mm: { x: 250, y: 210, z: 210 },
        printability_check_enabled: true
      }
    }
  }
}

// Analyza result (po uploadu ve widgetu)
{
  type: 'MODELPRICER_ANALYSIS',
  payload: {
    file_id: 'file_123',
    analysis: { ...printability result }
  }
}
```

### B6. Pricing engine integrace

**Pricing engine NEPOTREBUJE ZMENU pro zakladni printability check.**

Budouci integrace (S15 Rozsirene cenotvorby):
- DFM score muze ovlivnit cenu (prirazkY za slozitejsi modely)
- Wall thickness warning muze vyvolat "krehky material" prirazku
- Overhang area muze ovlivnit support cost estimate

Pro tuto sekci: Analyza je informacni — neovlivnuje cenu primo.

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-backend` | Architektura analytickeho pipeline | `backend-local/` | P0 |
| `mp-spec-be-slicer` | Integrace trimesh/PrusaSlicer analyzy | `backend-local/services/meshAnalyzer.js` | P0 |
| `mp-spec-3d-analysis` | Mesh analyza logika | `backend-local/services/printabilityCheck.js` | P0 |
| `mp-spec-3d-viewer` | DFM vizualizace v Three.js | `src/pages/test-kalkulacka/components/ModelViewer.jsx` | P1 |
| `mp-mid-backend-api` | REST endpointy pro analyze | `backend-local/routes/analyzeRoutes.js` | P0 |
| `mp-mid-frontend-public` | PrintabilityPanel, UnitDetectionDialog | `src/pages/test-kalkulacka/components/` | P0 |
| `mp-mid-frontend-admin` | PrinterConfigSection v AdminPricing | `src/pages/admin/AdminPricing.jsx` | P1 |
| `mp-mid-storage-tenant` | Printer config v pricing:v3 | `src/utils/adminPricingStorage.js` | P1 |
| `mp-spec-be-websocket` | WebSocket pro live analyza progress | `backend-local/services/` | P2 |
| `mp-spec-be-queue` | Job queue pro async analyzu | `backend-local/services/` | P2 |
| `mp-mid-frontend-widget` | Widget integrace analyzy | `src/pages/widget/` | P2 |
| `mp-sr-security` | Security review (upload validace) | - | P0 |
| `mp-spec-test-build` | Testy | testy | P0 |
| `mp-sr-i18n` | Prekladove klice | `src/locales/` | P1 |

### C2. Implementacni kroky (poradi)

**FAZE 1: Zakladni backend analyza (3-4 dny)**

**Krok 1.1: Mesh analyzer service**
- Vytvorit `backend-local/services/meshAnalyzer.js`
- Integrace s trimesh (Python) nebo admesh (C):
  - **Varianta A (Python):** Spousteni `python3 analyze.py <file>` jako child process
  - **Varianta B (WASM):** manifold-3d ve Node.js (mene presne ale rychlejsi)
  - **Varianta C (PrusaSlicer CLI):** `--check-model` + parsing warnings
- Doporuceni: Zacit s Variantou C (uz mame PrusaSlicer), pak Varianta A pro DFM

**Krok 1.2: Printability check logika (paralelni s 1.1)**
- Vytvorit `backend-local/services/printabilityCheck.js`
- Implementovat kontroly:
  1. Mesh integrity (watertight) — z trimesh/admesh
  2. Bounding box vs printer volume — porovnani rozmeru
  3. Part count — pocet oddelenych teles
  4. Volume a weight — zakladni metriky
- Kazda kontrola vraci: `{ id, name, status, severity, message, details }`

**Krok 1.3: REST API endpointy (po 1.1 + 1.2)**
- Vytvorit `backend-local/routes/analyzeRoutes.js`
- `POST /api/v1/analyze/quick` — synchronni zakladni analyza (<5s)
- `POST /api/v1/analyze` — async plna analyza (queued)
- `GET /api/v1/analyze/:jobId` — polling stavu
- Validace uploadu (format, velikost, MIME type)

**FAZE 2: Frontend zobrazeni (3-4 dny)**

**Krok 2.1: PrintabilityPanel komponenta**
- Nova komponenta v `src/pages/test-kalkulacka/components/`
- Zobrazuje vysledky analyzy po uploadu
- Loading state behem analyzy
- Overall score (OK/WARNING/ERROR)
- Seznam kontrol s ikonami a zpravami
- Expandovatelne detaily

**Krok 2.2: UnitDetectionDialog (paralelni s 2.1)**
- Modal pri detekci neobvyklych rozmeru
- Heuristika: bbox < 1mm → inches? bbox > 1000mm → meters?
- Radio buttony pro vyber jednotek
- Prepocet rozmeru a ceny po potvrzeni

**Krok 2.3: Admin PrinterConfig (paralelni s 2.1 + 2.2)**
- Nova sekce v AdminPricing pro konfiguraci tiskarny
- Max build volume (X, Y, Z)
- Min wall thickness
- Toggle pro printability check a DFM tips

**FAZE 3: Pokrocile funkce (2-3 dny)**

**Krok 3.1: Wall thickness analyza**
- Implementace na backendu (trimesh ray casting)
- Najit minimalni tloustku sten
- VyznaCtit oblasti s tenkysi stenami

**Krok 3.2: Overhang detection**
- Detekce previsu > konfigurovatelny uhel (default 45 stupnu)
- Vypocet plochy previsu
- Doporuceni supportu

**Krok 3.3: DFM vizualizace v 3D prohlizeci**
- DFM rezim v ModelViewer.jsx
- Barevne zvyrazneni problemovych oblasti
- Cervena = kriticke (tenke steny, broken mesh)
- Oranzova = varovani (previsy, velke plochy)
- Legenda

**FAZE 4: Polish a testy (1-2 dny)**

**Krok 4.1: DFM tips**
- Generovani tipu na zaklade vysledku analyzy
- Orientacni doporuceni
- Material doporuceni pro tenke steny

**Krok 4.2: Testy**
- Unit testy pro kazdou kontrolu
- Integration testy: upload → analyza → zobrazeni
- Testovaci STL soubory (valid, broken, too big, thin walls)
- Build test

**Paralelizovatelnost:**
- Faze 1: 1.1 + 1.2 paralelne. Pak 1.3.
- Faze 2: 2.1 + 2.2 + 2.3 vsechny paralelne.
- Faze 3: 3.1, 3.2, 3.3 cAstecne paralelne.

### C3. Kriticke rozhodovaci body

1. **Backend analyza: Python (trimesh) vs WASM (manifold-3d) vs PrusaSlicer CLI?**
   - Rozhodnuti: **PrusaSlicer CLI** pro zakladni kontroly (faze 1)
   - Pak **Python trimesh** pro pokrocile DFM (faze 3)
   - WASM jako alternativa pro frontend-only mode
   - Duvod: PrusaSlicer uz mame, trimesh je nejkomplentejsi pro analyzu

2. **Synchronni vs asynchronni analyza?**
   - Rozhodnuti: **Synchronni** pro quick check (<5s), **asynchronni** pro plnou analyzu
   - Quick check bezi pri uploadu — zakaznik vidi zakladni vysledky okamzite
   - Plna analyza (wall thickness, DFM) bezi na pozadi
   - Frontend polluje stav kazdych 2s (nebo WebSocket v budoucnu)

3. **Kde bezI analyza?**
   - Rozhodnuti: **Backend (backend-local)** — ne na frontendu
   - Duvod: trimesh/PrusaSlicer vyzaduji server-side prostredi
   - Frontend muze delat zakladni metriky (geomEstimate.js uz to umi)

4. **Jak vizualizovat DFM v Three.js?**
   - Rozhodnuti: **Overlay mesh** s barevnymi face groups
   - Backend vraci indexy problematickych faces → frontend je zvyrazni
   - Alternativa: Heatmap shader (slozitejsi ale hezci)

5. **Jak resit velke soubory (>50MB)?**
   - Rozhodnuti: **Limit 100MB**, analyza v pozadi
   - Progress bar behem uploadu a analyzy
   - Timeout 120s pro plnou analyzu

6. **Co delat s neprintovatelnym modelem?**
   - Rozhodnuti: **Warning, ne block** — zakaznik muze stale objednat
   - Admin muze nakonfigurovat: "Blokovat objednavku pri ERROR printability"
   - Default: Varovani s moznosti pokracovat

### C4. Testovaci strategie

**Unit testy:**
- Kazda printability kontrola zvlast (mesh integrity, bbox, part count, wall thickness, overhangs)
- Unit detection heuristika (mm, inches, cm, meters)
- Normalizace printer config

**Testovaci STL soubory (vytvorit testovaci sadu):**
- `test_valid.stl` — validni uzavreny mesh, bez problemu
- `test_open_edges.stl` — mesh s otevrenymi hranami
- `test_inverted_normals.stl` — obracene normaly
- `test_thin_walls.stl` — steny tensi nez 0.4mm
- `test_oversized.stl` — model vetsi nez tiskovy objem
- `test_multi_body.stl` — vice oddelenych teles
- `test_overhangs.stl` — velke previsy >60 stupnu
- `test_tiny.stl` — model <1mm (inches detection)
- `test_huge.stl` — model >1000mm (meters detection)
- `test_empty.stl` — prazdny nebo minimalní mesh

**Integration testy:**
- Upload → quick check → zobrazeni vysledku
- Upload → full analysis → polling → zobrazeni
- Admin zmeni printer config → analyza pouzije nove hodnoty

**Edge cases:**
- Soubor 0B (prazdny)
- Soubor >100MB (reject)
- Nevalidni format (ne STL/OBJ/3MF)
- Binary vs ASCII STL
- Model s 1 trojuhelnikem
- Model s 10M+ trojuhelniku (performance)
- Backend nedostupny → graceful degradation (jen klientska analyza)

**Performance testy:**
- Quick check <5s pro model 50MB
- Full analysis <120s pro model 100MB
- 3D vizualizace DFM: 60 FPS s overlay

### C5. Migrace existujicich dat

**Zadna migrace — printability je transientni analyza.**
- Vysledky se neukladaji do localStorage
- Printer config je novy blok v pricing:v3 — optional, default hodnoty

**Zpetna kompatibilita:**
- Chybejici `printer_config` v pricing:v3 → pouzij defaults (250x210x210mm)
- Chybejici analyza → sekce "Kontrola tisknutelnosti" se nezobrazuje
- Backend nedostupny → fallback na klientskou analyzu (geomEstimate.js)

---

## D. KVALITA

### D1. Security review body

- **Upload validace:**
  - MIME type: `application/sla`, `application/vnd.ms-pki.stl`, `model/stl`, `model/obj`, `model/3mf`
  - Max velikost: 100MB (konfigurovatelne)
  - Filename sanitization (path traversal prevence)
  - Temporary file cleanup po analyze (no file persistence)
- **Command injection:** PrusaSlicer CLI volani pres parametry (ne string concatenation!)
  - `execFile('prusaslicer', ['--check-model', sanitizedPath])` — NE `exec('prusaslicer ' + path)`
- **Python script injection:** Trimesh skript dostava file path jako argument
- **DoS prevence:**
  - Rate limiting: max 10 analyz/minutu/tenant
  - Timeout: 120s max na analyzu
  - Max concurrent: 3 analyzy soucasne
  - Reject soubory >100MB okamzite
- **Memory:** Analyza velkych meshu muze spotrebovat hodne pameti
  - Worker process s memory limitem
  - Graceful kill pri prekroceni limitu

### D2. Performance budget

- **Quick check:** < 5s pro 50MB soubor
- **Full analysis:** < 120s pro 100MB soubor
- **Frontend render:** PrintabilityPanel < 16ms
- **3D DFM overlay:** 60 FPS s overlay na meshu do 500K trojuhelniku
- **Bundle size:** +~5KB frontend (komponenty, bez heavy deps)
- **Backend dependencies:**
  - trimesh (Python): instalace separatne, ne v JS bundle
  - PrusaSlicer: uz existuje na backendu

### D3. Accessibility pozadavky

- **PrintabilityPanel:**
  - Semafor ikony (OK/WARNING/ERROR) musi mit textovy label (ne jen barva)
  - aria-live="polite" pro dynamicke vysledky (po dokonceni analyzy)
  - Expandovatelne detaily: aria-expanded, aria-controls
- **UnitDetectionDialog:**
  - Focus trap v modalu
  - Radio group s aria-labelledby
  - Prehledne labely pro screen reader
- **DFM vizualizace:**
  - Alternativni textovy popis problemovych oblasti
  - Legenda barev dostupna textove
  - Toggle "Zobrazit DFM" s aria-pressed
- **Color coding:**
  - Zelena (#22C55E), zluta (#EAB308), cervena (#EF4444) — s textovymi labely
  - Kontrast min 4.5:1 pro text

### D4. Error handling a edge cases

| Chybovy stav | Reseni | UI zpetna vazba |
|-------------|--------|-----------------|
| Backend nedostupny | Fallback na klientskou analyzu | "Zakladni analyza (offline mode)" |
| Analyza timeout (>120s) | Cancel job, log error | "Analyza trvala prilis dlouho" |
| Nevalidni mesh format | Reject s chybovou zpravou | "Neplatny format souboru" |
| Soubor prilis velky (>100MB) | Reject pred nahranim | "Max velikost 100MB" |
| Broken mesh (can't analyze) | Partial results + warning | "Nektere kontroly nebyly mozne" |
| PrusaSlicer crash | Catch error, log, partial | "Analyza selhala, kontaktujte podporu" |
| Python/trimesh not installed | Skip advanced checks | Jen zakladni kontroly |
| Memory limit exceeded | Kill worker, return error | "Model je prilis slozity pro analyzu" |
| Model v neobvyklych jednotkach | UnitDetectionDialog | Modal s volbou jednotek |
| Printer config chybi | Default hodnoty (250x210x210) | Zadna UI chyba |

### D5. i18n pozadavky

**Nove CZ/EN klice (vyber klicovych):**
```json
{
  "printability.title": "Kontrola tisknutelnosti / Printability Check",
  "printability.loading": "Analyzuji model... / Analyzing model...",
  "printability.score.ok": "V poradku / OK",
  "printability.score.warning": "Varovani / Warning",
  "printability.score.error": "Chyba / Error",

  "printability.check.mesh_integrity": "Mesh integrita / Mesh integrity",
  "printability.check.wall_thickness": "Tloustka sten / Wall thickness",
  "printability.check.bounding_box": "Rozmery / Dimensions",
  "printability.check.part_count": "Pocet dilu / Part count",
  "printability.check.overhangs": "Previsy / Overhangs",
  "printability.check.volume_weight": "Objem a vaha / Volume and weight",

  "printability.status.ok": "V poradku / OK",
  "printability.status.warning": "Varovani / Warning",
  "printability.status.error": "Chyba / Error",
  "printability.status.info": "Informace / Info",

  "printability.dfm.title": "Tipy pro lepsi tisk / Tips for better print",
  "printability.dfm.disclaimer": "Tyto tipy jsou orientacni. Tisk je mozny i bez uprav. / These tips are indicative. Printing is possible without changes.",
  "printability.dfm.show_areas": "Zobrazit problemove oblasti / Show problem areas",

  "printability.unit.title": "Neobvycle rozmery modelu / Unusual model dimensions",
  "printability.unit.current": "Rozmery vaseho modelu / Your model dimensions",
  "printability.unit.question": "V jakych jednotkach je vas model? / What units is your model in?",
  "printability.unit.mm": "Milimetry — ponechat / Millimeters — keep",
  "printability.unit.inches": "Palce — prepocitat / Inches — convert",
  "printability.unit.cm": "Centimetry — prepocitat / Centimeters — convert",
  "printability.unit.confirm": "Potvrdit / Confirm",

  "admin.printer.title": "Konfigurace tiskarny / Printer configuration",
  "admin.printer.build_volume": "Tiskovy objem (mm) / Build volume (mm)",
  "admin.printer.min_wall": "Min. tloustka sten (mm) / Min. wall thickness (mm)",
  "admin.printer.nozzle": "Prumer trysky (mm) / Nozzle diameter (mm)",
  "admin.printer.check_enabled": "Kontrola tisknutelnosti / Printability check",
  "admin.printer.dfm_enabled": "DFM tipy / DFM tips",
  "admin.printer.unit_detect": "Automaticka detekce jednotek / Auto unit detection"
}
```

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

- **Feature flag:** `printer_config.printability_check_enabled` v pricing:v3
- **Default:** Disabled — admin musi explicitne zapnout
- **Postupny rollout:**
  1. **Faze 1:** Zakladni kontroly (mesh integrity, bounding box) — synchronni
  2. **Faze 2:** Pokrocile kontroly (wall thickness, overhangs) — asynchronni
  3. **Faze 3:** DFM vizualizace v 3D prohlizeci
  4. **Faze 4:** Automaticka detekce jednotek

**Kazda faze je nezavisle deployovatelna.**

### E2. Admin UI zmeny

- **AdminPricing.jsx** — nova sekce "Konfigurace tiskarny" na konci stranky
- Build volume inputs (X, Y, Z v mm)
- Min wall thickness input
- Toggle pro printability check a DFM
- **Zadna nova admin stranka** — integrace do existujiciho AdminPricing

### E3. Widget zmeny

- Widget zobrazuje PrintabilityPanel po uploadu modelu
- Barevne ikony (OK/WARNING/ERROR) u kazde kontroly
- DFM tips sekce (pokud povoleny)
- UnitDetectionDialog pri neobvyklych rozmerech
- "Zobrazit DFM" button v 3D prohlizeci

### E4. Dokumentace pro uzivatele

- **Admin guide:** Jak nastavit parametry tiskarny
- **FAQ:** Co znamenaji jednotlive printability kontroly
- **Zakaznicky help:** Jak cist DFM zpetnou vazbu, jak opravit problemy
- **Developer docs:** Jak pridat novou printability kontrolu

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Printability check activation | >30% tenantu zapne | Storage analytics |
| Uspesnost analyzy | >95% souboru analyzovano bez chyby | Backend logs |
| Cas analyzy (quick) | <5s prumer | Backend metrics |
| Cas analyzy (full) | <60s prumer | Backend metrics |
| Snizeni neuspesnych tisku | -20% | Order/support data |
| DFM tips zobrazeni | >50% uploadovanych modelu | Frontend analytics |
| Unit detection accuracy | >90% spravna detekce | Manual testing |
| Zakaznicky NPS (printability) | >7/10 | Survey |
| Bug reports | 0 P0 | Issue tracker |
