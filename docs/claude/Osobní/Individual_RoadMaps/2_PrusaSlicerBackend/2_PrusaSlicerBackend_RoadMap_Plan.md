# 2. PrusaSlicer Backend integrace — Detailni RoadMap Plan

> **Stav:** 85% hotovo | **Priorita:** KRITICKA
> **Zavislosti na jine sekce:** ZADNE (je zakladem)
> **Kdo na nem zavisi:** Kalkulacka (#1), Cloud Run (#26), Presety (#6)

---

## Prehled

Node.js Express server ktery prijima 3D modely a spousti PrusaSlicer CLI pro slicovani. Extrahuje cas tisku, hmotnost materialu, pocet vrstev a dalsi metriky z G-code vystupu.

**Hlavni adresar:** `backend-local/`
**Port:** 3001 (Vite proxy `/api` -> localhost:3001)

---

## Co je HOTOVO (done)

### Express server (95%)
- [x] Node.js Express server na portu 3001
- [x] Vite proxy konfigurace v `vite.config.mjs`
- [x] Health check endpoint (`/api/health`)
- [x] CORS nastaveni
- [x] Stabilni provoz

### CLI spawn a G-code parsing (92%)
- [x] Spawn `prusaslicer-console.exe` s parametry
- [x] Parsovani G-code vystupu:
  - [x] Cas tisku (estimated_time)
  - [x] Hmotnost materialu (filament_used_g)
  - [x] Pocet vrstev (total_layers)
  - [x] Rozmery modelu (bounding box)
  - [x] Objem modelu
- [x] Docasne soubory — vytvoreni a cleanup

### Preset management (80%)
- [x] Upload INI souboru pres API
- [x] Ulozeni presetu na disk
- [x] Vyber presetu pri slicovani
- [x] Default preset fallback
- [x] Seznam presetu endpoint

### Error handling zaklad (55%)
- [x] Zakladni `slicerErrorClassifier` — klasifikace chyb
- [x] Timeout pro slicovani (existuje)
- [x] Retry logika na frontendu

---

## Co CHYBI / je potreba dodelat

### Faze 1: Error handling vylepseni (Priorita: STREDNI)

#### Ukol 1.1: Konfigurovatelny timeout
- **Soubory:** `backend-local/` (server soubory)
- **Co udelat:**
  - [ ] Pridat admin konfigurace pro timeout (defaultne 120s)
  - [ ] Nacitat timeout z admin storage (pres API nebo env variable)
  - [ ] Ruzny timeout pro ruzne velikosti modelu (maly model 30s, velky 300s)
- **? OTAZKA:** Ma se timeout nacitat z admin panelu (tenant storage) nebo z env variable?

#### Ukol 1.2: Lepsi chybove zpravy
- **Co udelat:**
  - [ ] Klasifikace specifickych chyb:
    - Model prilis velky -> "Model exceeds maximum size"
    - Nevalidni geometrie -> "Model has invalid geometry, try repairing"
    - Chybejici material -> "Selected material not found in preset"
    - Timeout -> "Slicing took too long, try simplifying the model"
    - PrusaSlicer not found -> "PrusaSlicer not installed or path incorrect"
  - [ ] Chybove zpravy v CS/EN (pres frontend i18n)
  - [ ] Logovani chyb s detaily (model velikost, preset, parametry)

#### Ukol 1.3: Retry logika na backendu
- **Co udelat:**
  - [ ] Automaticky retry pri timeout (1x)
  - [ ] Retry s nizeisim rozlisenim pri selhani
  - [ ] Queue system pro vice soucasnych pozadavku (rate limiting)

### Faze 2: Bezpecnostni vylepseni (Priorita: VYSOKA pro produkci)

#### Ukol 2.1: Input validace
- **Co udelat:**
  - [ ] Validace uploadovaneho souboru — overit ze je to skutecny STL/OBJ/3MF
  - [ ] Maximalni velikost souboru (napr. 100 MB)
  - [ ] Sanitizace nazvu souboru (path traversal prevence)
  - [ ] Rate limiting per IP / per tenant
  - [ ] Overeni Content-Type headeru

#### Ukol 2.2: API autentizace (viz sekce #20)
- **Co udelat:**
  - [ ] Pridat middleware pro overeni Firebase Auth tokenu
  - [ ] Pridat tenant ID z tokenu do kazdeho requestu
  - [ ] Odmitnout neautorizovane pozadavky
- **Zavislost:** Auth (#20)

### Faze 3: Priprava na Cloud Run migraci (viz sekce #26)

#### Ukol 3.1: Abstrakce platform-specifickych casti
- **Co udelat:**
  - [ ] Oddelit PrusaSlicer path detekci (Windows vs Linux)
  - [ ] Konfigurovat cestu k PrusaSlicer pres env variable
  - [ ] Overit ze temp soubory pouzivaji `/tmp` (Cloud Run requirement)
  - [ ] Pridat graceful shutdown handling
- **Zavislost:** Cloud Run (#26) — tato faze je priprava

---

## Implementacni poradi

1. **Faze 1** (Error handling) — 3-5 hodin
2. **Faze 2** (Bezpecnost) — 4-6 hodin, idealne pred spustenim do produkce
3. **Faze 3** (Cloud Run prep) — 2-3 hodiny, pred Cloud Run migraci

**Celkem pro Beta:** ~3-5 hodin (Faze 1)

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| PrusaSlicer neni na serveru | N/A lokalne, vysoka v cloud | Kriticky | Dockerfile s instalaci (viz #26) |
| Velke modely zpusobi timeout | Stredni | Stredni | Konfigurovatelny timeout |
| Path traversal pres filenames | Nizka | Vysoky | Faze 2.1 validace |
| Neautorizovany pristup k API | Vysoka (aktualne) | Vysoky | Faze 2.2 auth |

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `backend-local/` (vice souboru) | Error handling, validace | Stredni |
| `vite.config.mjs` | Bez zmeny | - |

---

## Kriticke doplnky (z review)

> Nasledujici sekce doplnuji mezery identifikovane pri code review existujici implementace.
> Kazda sekce obsahuje konkretni detaily, presne cesty a implementacni vodici linie.

---

### R1: Kompletni mapa backend souboru s popisem

Aktualni stav backend-local adresare (bez node_modules):

| Soubor (relativne k `backend-local/`) | Ucel | Stav |
|----------------------------------------|------|------|
| `package.json` | Deps: express, cors, dotenv, multer, archiver, nanoid | Hotovo |
| `src/index.js` | **Hlavni Express server** — routes, middleware, slice endpoint, health check, presets API | Hotovo (395 radku) |
| `src/slicer/runPrusaSlicer.js` | Spawn PrusaSlicer pro slicing (`--export-gcode`) | Hotovo (57 radku) |
| `src/slicer/runPrusaInfo.js` | Spawn PrusaSlicer pro model info (`--info`) | Hotovo (43 radku) |
| `src/slicer/parseGcode.js` | Parsovani G-code komentaru pro metriky | Hotovo (180 radku) |
| `src/slicer/parseModelInfo.js` | Parsovani `--info` vystupu (size, volume, manifold) | Hotovo (80 radku) |
| `src/util/findSlicer.js` | Auto-detection PrusaSlicer binary (BFS v `tools/prusaslicer/`) | Hotovo (36 radku) |
| `src/util/fsSafe.js` | Helpery: `ensureDir`, `fileExists`, `toAbs` | Hotovo (21 radku) |
| `src/presetsStore.js` | Preset CRUD — per-tenant INI soubory na disku | Hotovo (172 radku) |
| `src/storage/storageRouter.js` | Express Router pro `/api/storage/*` (order files, browse, download, ZIP) | Hotovo (426 radku) |
| `src/storage/storageService.js` | Business logika pro file storage (folders, trash, search) | Hotovo |
| `src/storage/checksumUtil.js` | MD5/SHA checksum pro soubory | Hotovo |
| `src/storage/metadataBuilder.js` | Metadata JSON builder pro order folders | Hotovo |
| `src/email/emailService.js` | Email service (SMTP/provider abstraction) | Hotovo |
| `src/email/emailProvider.js` | Email provider implementation | Hotovo |
| `src/email/templateRenderer.js` | HTML email template rendering | Hotovo |
| `src/email/templates/index.js` | Email template definitions | Hotovo |
| `src/email/triggers.js` | Event-based email triggers | Hotovo |
| `src/routes/emailRoutes.js` | Express routes pro `/api/email/*` | Hotovo |

**Frontend klient (mimo backend-local):**

| Soubor | Ucel |
|--------|------|
| `src/services/slicerApi.js` | Frontend fetch klient pro `POST /api/slice` (FormData, timeout, abort) |
| `src/utils/slicerErrorClassifier.js` | Regex-based klasifikace slicer chyb do user-friendly kategorii (13 patternu) |

**CHYBI — soubory k vytvoreni:**

| Soubor (navrzeny) | Ucel | Priorita |
|--------------------|------|----------|
| `src/middleware/authMiddleware.js` | Firebase Auth token overeni | P0 pro produkci |
| `src/middleware/rateLimiter.js` | Per-tenant / per-IP rate limiting | P1 |
| `src/middleware/inputValidator.js` | Magic-byte validace uploadovanych souboru | P0 |
| `src/slicer/slicerQueue.js` | Job queue pro concurrent slicing | P1 |
| `src/util/processCleanup.js` | Zombie process detection a kill | P1 |

---

### R2: PrusaSlicer CLI prikazy — uplna reference

Aktualne pouzivane prikazy v kodu:

#### Slicing mode (v `runPrusaSlicer.js`)
```bash
prusa-slicer-console.exe --export-gcode -o <outDir>/out.gcode <modelPath> --load <iniPath>
```

**Argumenty jako array (NIKDY string concat!):**
```js
const args = [
  "--export-gcode",    // Rezim exportu G-code
  "-o", outGcodePath,  // Vystupni soubor (absolutni cesta)
  modelPath,           // Vstupni 3D model (absolutni cesta)
  "--load", iniPath    // Profil/preset INI soubor
];
spawn(slicerCmd, args, { shell: false, cwd: outDir, windowsHide: true });
```

#### Info mode (v `runPrusaInfo.js`)
```bash
prusa-slicer-console.exe --info <modelPath>
```

**Argumenty:**
```js
const args = ["--info", modelPath];
spawn(slicerCmd, args, { shell: false, windowsHide: true });
```

#### Health check (v `index.js`, funkce `runSimple`)
```bash
prusa-slicer-console.exe --help
```
Pouziva se `--help` misto `--version` protoze nektere portable buildy nepodporuji `--version`.

#### Dalsi uzitecne CLI flagy (zatim NEPOUZITE, ale relevantni pro budoucnost):

| Flag | Popis | Pouziti |
|------|-------|---------|
| `--export-stl` | Export opraveneho STL | Mesh repair pipeline |
| `--export-3mf` | Export do 3MF formatu | Archivace |
| `--scale <factor>` | Zmena meritka modelu | Auto-scale kdyz je model prilis maly/velky |
| `--center <x,y>` | Centrovani na bed | Auto-center pred slicingem |
| `--rotate <angle>` | Rotace modelu | Orientace optimalizace |
| `--loglevel <0-5>` | Uroven logovani | Debug (0=quiet, 5=trace) |
| `--merge` | Merge vice modelu | Multi-model slicing |
| `--dont-arrange` | Preskocit auto-arrange | Kdyz uz je pozice nastavena |
| `--print-profile <name>` | Vyber profilu podle jmena | Alternativa k `--load` |
| `--material-profile <name>` | Vyber materialu | Pres jmeno, ne INI |
| `--printer-profile <name>` | Vyber tiskarny | Pres jmeno, ne INI |

**Bezpecnostni pravidla pro CLI volani:**
1. `shell: false` VZDY explicitne (i kdyz je default pro spawn)
2. Argumenty VZDY jako pole stringu, nikdy interpolace do stringu
3. Vstupni cesty validovat pred predanim do args (viz R6)
4. `windowsHide: true` aby se nezobrazovalo okno na Windows

---

### R3: G-code parsing — detailni reference komentarovych radku a regex patternu

PrusaSlicer vlozi metriky jako komentare (zacinajici `;`) do generovaneho G-code.
Parser (`parseGcode.js`) skenuje prvnich 20 000 a poslednich 20 000 radku.

#### Parsovane metriky a jejich zdrojove radky v G-code:

**1) Cas tisku (`estimatedTimeSeconds`)**

Zdrojove radky v G-code:
```gcode
; estimated printing time (normal mode) = 1h 2m 3s
; estimated printing time (silent mode) = 00:12:34
; printing time = 12m 34s
;TIME:1234
```

Regex patterny (v poradi priority):
```js
// Cura-style (sekundy primo)
/^\s*;\s*TIME\s*:\s*(\d+)\s*$/im

// PrusaSlicer-style (textovy format)
/(?:estimated\s+printing\s+time|printing\s+time)(?:\s*\([^\)]*\))?\s*(?:=|:)\s*([^\n\r;]+)/i
```

Parsovani casoveho formatu (`timeToSeconds`):
- `HH:MM:SS` nebo `MM:SS` (colon format)
- `1d 2h 3m 4s` (tokenovy format, i bez mezer: `1h02m03s`)

**2) Spotreba filamentu v gramech (`filamentGrams`)**

Zdrojove radky:
```gcode
; filament used [g] = 12.34
; filament used [g] = 12.34, 0.00
; total filament used [g] = 12.34
; filament used = 1234.5 mm (12.34 g)
```

Regex patterny:
```js
// Explicitni [g] radek (preferovany, sumuje vice extruderu)
/(?:total\s+)?filament\s+used\s*\[g\]\s*(?:=|:)\s*([^\n\r;]+)/i

// Inline v zavorkach
/filament\s+used\s*=\s*[^\n\r;]*\(\s*([0-9]+(?:[\.,][0-9]+)?)\s*g\s*\)/i
```

**3) Spotreba filamentu v milimetrech (`filamentMm`)**

Zdrojove radky:
```gcode
; filament used [mm] = 1234.5
; filament used [mm] = 1234.5, 0.0
; total filament used [mm] = 1234.5
; filament used = 1234.5 mm (12.34 g)
```

Regex patterny:
```js
// Explicitni [mm] radek
/(?:total\s+)?filament\s+used\s*\[mm\]\s*(?:=|:)\s*([^\n\r;]+)/i

// Inline mm
/filament\s+used\s*=\s*([0-9]+(?:[\.,][0-9]+)?)\s*mm\b/i
```

**CHYBEJICI metriky — k doplneni:**

| Metrika | G-code radek | Regex (navrzeny) | Priorita |
|---------|-------------|-------------------|----------|
| `layerCount` | `; total layers count = 42` | `/total\s+layers?\s+count\s*=\s*(\d+)/i` | P0 |
| `filamentCost` | `; filament cost = 1.23` | `/filament\s+cost\s*=\s*([0-9.]+)/i` | P2 |
| `totalFilamentCm3` | `; filament used [cm3] = 12.34` | `/filament\s+used\s*\[cm3?\]\s*=\s*([0-9.,\s]+)/i` | P2 |
| `nozzleDiameter` | `; nozzle_diameter = 0.4` | `/nozzle_diameter\s*=\s*([0-9.]+)/i` | P1 (pro pricing) |
| `layerHeight` | `; layer_height = 0.2` | `/layer_height\s*=\s*([0-9.]+)/i` | P1 (pro pricing) |
| `fillDensity` | `; fill_density = 20%` | `/fill_density\s*=\s*([0-9.]+)/i` | P1 (pro pricing) |
| `filamentType` | `; filament_type = PLA` | `/filament_type\s*=\s*(\S+)/i` | P1 (pro material matching) |

**KRITICKE:** `layerCount` by mel byt parsovany ale aktualne NENI — roadmap rika ze je hotovy (v sekci "Co je HOTOVO"), ale `parseGcode.js` ho neextrahuje. Toto je nesoulad.

---

### R4: Model info parsing — `--info` vystup reference

Vystup `prusa-slicer-console.exe --info model.stl` ma format `key = value` po radcich:

```
size_x = 20.000000
size_y = 15.000000
size_z = 30.000000
min_x = -10.000000
min_y = -7.500000
min_z = 0.000000
max_x = 10.000000
max_y = 7.500000
max_z = 30.000000
number_of_facets = 12834
number_of_parts = 1
volume = 4523.456789
manifold = yes
```

Parsovane hodnoty (`parseModelInfo.js`):
- `sizeMm` — `{ x, y, z }` z `size_x/y/z`
- `bboxMm` — `{ min: {x,y,z}, max: {x,y,z} }` z `min_x/y/z`, `max_x/y/z`
- `volumeMm3` — z `volume` (v mm3, NE cm3 — konverze: `volumeMm3 / 1000`)
- `facets` — z `number_of_facets`
- `parts` — z `number_of_parts`
- `manifold` — z `manifold` (yes/no -> boolean)

**Vystupni API format (z `/api/slice` response):**
```json
{
  "modelInfo": {
    "raw": { "size_x": 20.0, "size_y": 15.0, ... },
    "sizeMm": { "x": 20.0, "y": 15.0, "z": 30.0 },
    "bboxMm": { "min": { "x": -10, ... }, "max": { "x": 10, ... } },
    "volumeMm3": 4523.46,
    "facets": 12834,
    "parts": 1,
    "manifold": true
  }
}
```

**UPOZORNENI:** Pokud `--info` selze (nekompletni mesh, corrupted soubor), slicing pokracuje bez modelInfo. Chyba je ulozena v `modelInfoError` poli odpovedi.

---

### R5: Pameti a CPU benchmarky — odhady a mereni

#### Ocekavana spotreba prostredku per slice operace

| Velikost modelu (STL) | RAM PrusaSlicer | CPU peak | Cas (odhad) | Poznamka |
|------------------------|-----------------|----------|-------------|----------|
| < 5 MB (jednoduchy model) | 200-400 MB | 100% 1 jadro | 5-30s | Typicky zakaznik |
| 5-25 MB (stredne slozity) | 400-800 MB | 100% 1 jadro | 30-120s | Detailni model |
| 25-100 MB (slozity model) | 800 MB - 2 GB | 100% 1 jadro | 2-8 min | Potreba vyssiho timeout |
| 100-250 MB (velmi slozity) | 2-4 GB | 100% 1-2 jadra | 5-15+ min | Hrozba OOM na 4GB serverech |

**Dulezite poznamky:**
- PrusaSlicer je **single-threaded** pro vetsinu operaci (slicing je sekvencni per-layer)
- RAM spotreba je **nepredikovatelna** — zavisi na geometricke slozitosti, ne jen velikosti souboru
- Maly STL (1 MB) s miliony trojuhelniku muze spotrebovat vice RAM nez velky jednoduchy model
- `--info` mode spotrebuje minimalni RAM (< 100 MB) — jen nacte mesh, nepocita toolpath

**Mereni v produkcnim prostredi:**
```bash
# Linux — mereni pameti pro konkretni slicing job
/usr/bin/time -v prusa-slicer --export-gcode -o out.gcode model.stl --load profile.ini
# -> "Maximum resident set size" = peak RAM v KB

# Windows — pres PowerShell (priblizne)
Measure-Command { Start-Process -Wait "prusa-slicer-console.exe" -ArgumentList "--export-gcode","-o","out.gcode","model.stl","--load","profile.ini" }
```

**Doporucene limity pro server:**
- **Minimalne 4 GB RAM** pro single-job instanci
- **Doporuceno 8 GB RAM** pokud bezi 2+ joby soucasne
- **CPU:** 2+ jadra (1 pro slicer, 1 pro Node.js + OS)
- **Disk:** Minimalne 2 GB volneho mista v WORKSPACE_ROOT (G-code muze mit 50-200 MB)

**AKCE:**
- [ ] Implementovat `process.memoryUsage()` monitoring v Node.js procesu
- [ ] Pridat RSS monitoring spawned PrusaSlicer procesu (pres `/proc/<pid>/status` na Linuxu)
- [ ] Odmitat uploady > 100 MB pokud je dostupna RAM < 2 GB
- [ ] Logovat `durationMs` + peak RAM pro kazdy job (uz logujeme durationMs)

---

### R6: Strategie soubieneho slicovani (Concurrent Slicing)

#### Aktualni stav
Backend zpracovava pozadavky **seriove** — Express handler spusti PrusaSlicer a ceka na vysledek.
Pokud prijdou 3 pozadavky soucasne, kazdy spusti vlastni PrusaSlicer proces.
**Zadna fronta, zadny limit, zadna koordinace.**

#### Navrzena architektura: Job Queue s limitem

```
Request 1 ─┐
Request 2 ──┤──> [Job Queue] ──> [Worker Pool (max N)] ──> PrusaSlicer spawn
Request 3 ─┘        │
                     │ over-limit -> HTTP 429 nebo cekani
```

**Implementacni plan (`src/slicer/slicerQueue.js`):**

```js
// Navrhova struktura
class SlicerQueue {
  constructor({ maxConcurrent = 2, maxQueued = 10, jobTimeoutMs = 300_000 }) {
    this.maxConcurrent = maxConcurrent;  // Max soucasnych PrusaSlicer procesu
    this.maxQueued = maxQueued;          // Max jobu ve fronte
    this.running = new Map();            // jobId -> { child, startedAt, timeoutTimer }
    this.queue = [];                     // Cekajici joby
  }

  async enqueue(jobParams) { /* ... */ }  // Vrati Promise<result>
  getStatus() { /* ... */ }               // Pro health check
}
```

**Konfigurace (env variables):**

| Variable | Default | Popis |
|----------|---------|-------|
| `SLICER_MAX_CONCURRENT` | `2` | Max soucasnych PrusaSlicer procesu |
| `SLICER_MAX_QUEUED` | `10` | Max jobu cekajicich ve fronte |
| `SLICER_JOB_TIMEOUT_MS` | `300000` | Timeout per job (5 min) |

**Rozhodovaci tabulka — Queue vs Parallel:**

| Prostredi | Max concurrent | Duvod |
|-----------|---------------|-------|
| Lokalni dev (8 GB RAM) | 2 | Kazdy slicer 0.5-2 GB RAM |
| Cloud Run (2 GB instance) | 1 | Nedostatek RAM pro 2 soucasne |
| Cloud Run (4 GB instance) | 2 | Dostatecna RAM pro 2 jednoduche |
| Dedicated server (16 GB) | 4 | Dostatek prostredku |

**Over-limit chovani:**
- Fronta plna -> HTTP 429 `{ error: "QUEUE_FULL", position: null, retryAfterMs: 30000 }`
- Job ve fronte -> HTTP 202 `{ jobId: "...", position: 3, estimatedWaitMs: 60000 }`
- Job hotovy -> HTTP 200 s vysledkem (jako nyni)

**AKCE:**
- [ ] Vytvorit `src/slicer/slicerQueue.js` s maxConcurrent/maxQueued konfiguraci
- [ ] Integrovat queue do `POST /api/slice` v `index.js`
- [ ] Pridat `GET /api/queue/status` endpoint (pozice ve fronte, running count)
- [ ] Pridat env variables pro konfiguraci

---

### R7: Validace formatu souboru — magic bytes a strukturalni kontrola

#### Aktualni stav
Soubory jsou validovany pouze podle **pripony** (`.stl`, `.obj`, `.3mf`, `.amf`, `.ini`).
To znamena, ze utocnik muze prejmenovat libovolny soubor na `.stl` a backend ho preda PrusaSliceru.

#### Navrzena validace magic bytes

**Implementace (`src/middleware/inputValidator.js`):**

| Format | Magic bytes / Struktura | Jak overit |
|--------|------------------------|------------|
| **STL Binary** | Prvnich 80 byte = header (libovolny), byte 80-83 = uint32LE pocet trojuhelniku, celkova velikost = 84 + (pocet * 50) byte | Precti prvnich 84 byte, spocitej ocekavanou velikost, porovnej s `file.size` |
| **STL ASCII** | Zacina `solid ` (prvnich 6 byte = `736F6C696420`). Obsahuje `facet normal`, `endfacet`, `endsolid` | Precti prvnich 1024 byte, zkontroluj `solid` na zacatku + alespon jedno `facet` |
| **OBJ** | Textovy format, radky zacinaji `v `, `vn `, `vt `, `f ` | Precti prvnich 4096 byte, hledej alespon `v ` (vertex) a `f ` (face) |
| **3MF** | ZIP archiv (magic bytes `504B0304` = PK), obsahuje `[Content_Types].xml` a `3D/3dmodel.model` | Zkontroluj ZIP magic + pokus o rozbaleni `[Content_Types].xml` |
| **AMF** | XML format (zacina `<?xml` nebo `<amf`), nebo komprimovany ZIP s AMF XML uvnitr | Zkontroluj XML/ZIP magic, hledej `<amf` element |

**Priklad validace STL binary:**
```js
function validateStlBinary(buffer) {
  if (buffer.length < 84) return { valid: false, reason: "Too small for STL binary" };

  const facetCount = buffer.readUInt32LE(80);
  const expectedSize = 84 + (facetCount * 50);

  // Tolerance +-1 byte (nekteri exporteri pridavaji padding)
  if (Math.abs(buffer.length - expectedSize) > 1) {
    return { valid: false, reason: `STL size mismatch: expected ${expectedSize}, got ${buffer.length}` };
  }

  if (facetCount === 0) return { valid: false, reason: "STL has 0 facets" };
  if (facetCount > 50_000_000) return { valid: false, reason: "STL has too many facets (>50M)" };

  return { valid: true, facetCount };
}
```

**Priklad validace STL ASCII vs binary rozliseni:**
```js
function detectStlType(buffer) {
  // STL ASCII zacina "solid " (ale pozor: nekteri exporteri zacinaji "solid" bez mezery)
  const head = buffer.slice(0, 80).toString("ascii");
  if (head.startsWith("solid")) {
    // Jeste overit ze to neni binary s "solid" v headeru
    // Binary header muze nahodou obsahovat "solid"
    // Heuristika: pokud prvnich 1000 byte obsahuje "facet normal" -> ASCII
    const preview = buffer.slice(0, Math.min(buffer.length, 4096)).toString("ascii");
    if (/facet\s+normal/i.test(preview)) return "ascii";
  }
  return "binary";
}
```

**Validacni pipeline (povinne poradi):**
1. Zkontroluj priponu (whitelist: `.stl`, `.obj`, `.3mf`, `.amf`)
2. Zkontroluj Content-Type header (volitelne, browsers jsou nespolehlivy)
3. Precti prvnich N byte (magic bytes)
4. Pokud STL: rozlis ASCII vs binary, validuj strukturu
5. Pokud 3MF/AMF: over ZIP integrity
6. Zkontroluj maximalni pocet facets/vertices (ochrana proti OOM)
7. Az potom predej PrusaSliceru

**AKCE:**
- [ ] Vytvorit `src/middleware/inputValidator.js` s magic byte validaci
- [ ] Pridat max facet count limit (konfigurovatelny, default 10M)
- [ ] Pridat null byte detekci v cestach (`\0` = path traversal)
- [ ] Integrovat do multer `fileFilter` v `index.js`

---

### R8: Health check endpoint — co vsechno reportovat

#### Aktualni stav

`GET /api/health` vraci:
```json
{ "ok": true, "service": "modelpricer-backend-local", "port": 3001, "workspaceRoot": "...", "time": "..." }
```

`GET /api/health/prusa` vraci:
```json
{ "ok": true, "slicerCmd": "...", "checkMethod": "--help", "exitCode": 0, "stdout": "...", "stderr": "..." }
```

**Nema informace o:** verzi PrusaSliceru, dostupnem disku, pameti, fronte, posledni chybe.

#### Navrzeny rozsireny health check

**`GET /api/health` (rozsireny):**
```json
{
  "ok": true,
  "service": "modelpricer-backend-local",
  "version": "0.1.2",
  "port": 3001,
  "uptime_seconds": 86400,
  "time": "2026-02-18T12:00:00Z",

  "system": {
    "platform": "win32",
    "arch": "x64",
    "node_version": "v20.11.0",
    "total_memory_mb": 16384,
    "free_memory_mb": 8192,
    "cpu_count": 8,
    "load_average_1m": 1.5
  },

  "disk": {
    "workspace_root": "C:\\modelpricer\\tmp",
    "workspace_free_mb": 45000,
    "workspace_used_mb": 2300,
    "warning": null
  },

  "slicer": {
    "found": true,
    "path": "C:\\tools\\prusaslicer\\prusa-slicer-console.exe",
    "version": "2.7.4+win64",
    "last_health_check": "2026-02-18T11:55:00Z"
  },

  "queue": {
    "running_jobs": 1,
    "queued_jobs": 3,
    "max_concurrent": 2,
    "max_queued": 10,
    "total_completed": 1523,
    "total_failed": 12,
    "avg_duration_ms": 45000
  },

  "last_error": {
    "time": "2026-02-18T11:30:00Z",
    "category": "TIMEOUT",
    "message": "PrusaSlicer timed out after 300000ms",
    "job_id": "job-abc123"
  }
}
```

**Implementacni kroky:**
```js
// Disk space (cross-platform)
import { statfs } from "node:fs/promises"; // Node.js 18.15+
const stats = await statfs(WORKSPACE_ROOT);
const freeBytes = stats.bavail * stats.bsize;
const freeMb = Math.round(freeBytes / (1024 * 1024));

// PrusaSlicer verze (parsovat z --help vystupu)
// Typicky radek: "PrusaSlicer-2.7.4+win64 based on Slic3r"
const versionMatch = stdout.match(/PrusaSlicer[- ]?([0-9][^\s]*)/i);
const version = versionMatch ? versionMatch[1] : "unknown";

// System info
import os from "node:os";
const systemInfo = {
  platform: process.platform,
  arch: process.arch,
  node_version: process.version,
  total_memory_mb: Math.round(os.totalmem() / (1024 * 1024)),
  free_memory_mb: Math.round(os.freemem() / (1024 * 1024)),
  cpu_count: os.cpus().length,
  load_average_1m: os.loadavg()[0]
};
```

**Disk space varovani (prahy):**
| Stav | Free disk | Akce |
|------|-----------|------|
| OK | > 2 GB | Normalni provoz |
| WARNING | 500 MB - 2 GB | Log warning, alert admin |
| CRITICAL | < 500 MB | Odmitnout nove slicing joby, alert |
| EMERGENCY | < 100 MB | Spustit emergency cleanup starych jobu |

**AKCE:**
- [ ] Rozsirit `GET /api/health` o system/disk/queue info
- [ ] Parsovat PrusaSlicer verzi z `--help` vystupu (cache na 1 hodinu)
- [ ] Pridat disk space monitoring s prahy (warn/critical/emergency)
- [ ] Pridat `GET /api/health/detailed` s plnym statusem (pro monitoring systemy)
- [ ] Pridat metriky: total_completed, total_failed, avg_duration (in-memory counter)

---

### R9: Error recovery patterny — zombie procesy a partial cleanup

#### Aktualni stav
- Timeout zabije PrusaSlicer pres `child.kill()` (= SIGTERM na Linuxu, TerminateProcess na Windows)
- **Zadny** follow-up `SIGKILL` pokud proces neodpovi na SIGTERM
- **Zadny** cleanup partial G-code po timeout/selhani
- **Zadna** detekce zombie procesu po restartu serveru
- Temp job adresare zustavaji na disku bez casoveho limitu

#### Navrzene patterny

**1) SIGTERM -> SIGKILL eskalace (v `runPrusaSlicer.js` a `runPrusaInfo.js`)**

Aktualni kod:
```js
const timer = setTimeout(() => {
  try { child.kill(); } catch {}  // Jen SIGTERM, zadny SIGKILL
  reject(new Error("PrusaSlicer timed out..."));
}, timeoutMs);
```

Navrzeny kod:
```js
const timer = setTimeout(() => {
  try {
    child.kill("SIGTERM");  // Prvne mekce zastaveni

    // Po 5 sekundach SIGKILL pokud stale bezi
    setTimeout(() => {
      try {
        if (!child.killed) {
          child.kill("SIGKILL");
          console.warn(`[slicer] Force-killed PrusaSlicer PID=${child.pid} after SIGTERM+5s`);
        }
      } catch {}
    }, 5000);
  } catch {}
  reject(new Error(`PrusaSlicer timed out after ${timeoutMs}ms`));
}, timeoutMs);
```

**2) Partial G-code cleanup po selhani**

Pokud PrusaSlicer spadne nebo je killed uprostred slicingu, muze zustat neuplny `out.gcode`.
Tento soubor nema smysl uchovavat a zabira misto.

```js
// V POST /api/slice error handleru (index.js)
catch (e) {
  // Cleanup partial output
  try {
    const partialGcode = path.join(req.jobOutputDir, "out.gcode");
    await fs.unlink(partialGcode).catch(() => {});
  } catch {}

  res.status(500).json({ ... });
}
```

**3) Startup zombie cleanup**

Pri startu serveru zkontrolovat jestli nezustaly PrusaSlicer procesy z predchoziho behu:

```js
// V index.js pri startu
async function cleanupOrphanedSlicerProcesses() {
  // Jen na Linuxu — na Windows je TerminateProcess synchronni
  if (process.platform === "win32") return;

  const { execSync } = await import("node:child_process");
  try {
    const output = execSync("pgrep -f prusa-slicer", { encoding: "utf8" });
    const pids = output.trim().split("\n").filter(Boolean);
    for (const pid of pids) {
      console.warn(`[startup] Found orphaned PrusaSlicer PID=${pid}, killing...`);
      try { process.kill(Number(pid), "SIGKILL"); } catch {}
    }
  } catch {
    // pgrep returns non-zero if no processes found — to je OK
  }
}
```

**4) Stale job directory cleanup (TTL)**

Job adresare v WORKSPACE_ROOT aktualne nemaji expiraci. Na produkcnim serveru se budou hromadit.

```js
// Periodicka cleanup (kazde 4 hodiny)
const JOB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hodin

async function cleanupStaleJobs() {
  const entries = await fs.readdir(WORKSPACE_ROOT, { withFileTypes: true });
  const now = Date.now();

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("job-")) continue;
    const jobDir = path.join(WORKSPACE_ROOT, entry.name);
    try {
      const stat = await fs.stat(jobDir);
      if (now - stat.mtimeMs > JOB_TTL_MS) {
        await fs.rm(jobDir, { recursive: true, force: true });
        console.log(`[cleanup] Removed stale job dir: ${entry.name}`);
      }
    } catch {}
  }
}

// Spousteni pri startu + interval
cleanupStaleJobs();
setInterval(cleanupStaleJobs, 4 * 60 * 60 * 1000);
```

**5) Graceful shutdown**

```js
// V index.js
const server = app.listen(PORT, () => { ... });

async function gracefulShutdown(signal) {
  console.log(`[shutdown] Received ${signal}, gracefully shutting down...`);

  // 1. Prestani prijimat nove requesty
  server.close();

  // 2. Pockej na dobihajici joby (max 30s)
  // slicerQueue.drain(30000);

  // 3. Kill vsechny zbyvajici slicer procesy
  // slicerQueue.killAll();

  // 4. Exit
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

**AKCE:**
- [ ] Implementovat SIGTERM -> SIGKILL (5s) eskalaci v obou spawn helperech
- [ ] Pridat partial G-code cleanup v error handleru `/api/slice`
- [ ] Pridat startup cleanup starych job directories (TTL 24h)
- [ ] Pridat graceful shutdown handler (SIGTERM/SIGINT)
- [ ] Pridat orphaned process detection pri startu (Linux only)
- [ ] Logovat PID kazdeho spawnoveho PrusaSlicer procesu

---

### R10: Slicer auto-detection — rozsireni `findSlicer.js`

#### Aktualni stav
`findSlicer.js` hleda **pouze** v `<projectRoot>/tools/prusaslicer/` pomoci BFS (max depth 6).
Alternativne se pouziva env variable `PRUSA_SLICER_CMD`.

**Nepokryva:** system-wide instalace na Windows/Linux/macOS.

#### Navrzene rozsireni — platform-specific cesty

```js
const KNOWN_PATHS = {
  win32: [
    // Standard instalace
    "C:\\Program Files\\Prusa3D\\PrusaSlicer\\prusa-slicer-console.exe",
    "C:\\Program Files (x86)\\Prusa3D\\PrusaSlicer\\prusa-slicer-console.exe",
    // Chocolatey
    "C:\\ProgramData\\chocolatey\\bin\\prusa-slicer-console.exe",
    // Portable (v project root)
    // -> uz pokryto aktualni BFS logikou
  ],
  linux: [
    "/usr/bin/prusa-slicer",
    "/usr/local/bin/prusa-slicer",
    "/usr/bin/prusaslicer",
    "/snap/bin/prusa-slicer",
    // AppImage (typicky v home)
    // -> dynamicky: `${os.homedir()}/PrusaSlicer*.AppImage`
  ],
  darwin: [
    "/Applications/PrusaSlicer.app/Contents/MacOS/PrusaSlicer",
    "/Applications/Original Prusa Drivers/PrusaSlicer.app/Contents/MacOS/PrusaSlicer",
  ]
};
```

**Prioritni poradi hledani:**
1. `PRUSA_SLICER_CMD` env variable (explicitni, nejvyssi priorita)
2. `<projectRoot>/tools/prusaslicer/` (portable, aktualni logika)
3. Platform-specific znamy cesty (nove)
4. `which prusa-slicer` / `where prusa-slicer-console.exe` (PATH lookup, posledni moznost)

**Caching:** Nalezena cesta by mela byt cachovana v pameti (aktualne neni — kazdy request hleda znovu).

```js
let _cachedSlicerPath = null;
let _cachedAt = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hodina

export async function findPrusaSlicerConsole(projectRoot) {
  if (_cachedSlicerPath && (Date.now() - _cachedAt < CACHE_TTL)) {
    return _cachedSlicerPath;
  }
  // ... hledaci logika ...
  _cachedSlicerPath = found;
  _cachedAt = Date.now();
  return found;
}
```

---

### R11: Chybejici testy

Aktualne neexistuji ZADNE automatizovane testy pro backend-local.

**Navrzena testovaci struktura:**

| Test soubor (navrzeny) | Co testuje | Typ |
|------------------------|------------|-----|
| `tests/parseGcode.test.js` | G-code regex parsing (vsechny formaty casu, filamentu) | Unit |
| `tests/parseModelInfo.test.js` | Model info parsing (vsechny klice, edge cases) | Unit |
| `tests/inputValidator.test.js` | Magic byte validace (STL binary/ASCII, OBJ, 3MF) | Unit |
| `tests/slicerQueue.test.js` | Queue logika (enqueue, dequeue, overflow, timeout) | Unit |
| `tests/integration/slice.test.js` | End-to-end slice s mocknutym PrusaSlicer | Integration |
| `tests/integration/presets.test.js` | Preset CRUD lifecycle | Integration |

**Priorita:** P1 — pred produkci by mely existovat alespon unit testy pro parsery.

---

## Poznamky

- **KRITICKE:** Backend je aktualne BEZ auth -- kazdy muze slicovat. Pro Beta je to OK ale pro produkci MUSI byt auth.
- **TIP:** PrusaSlicer path je na Windows typicky `C:\Program Files\Prusa3D\PrusaSlicer\prusa-slicer-console.exe`
- **TIP:** Na Linuxu (Cloud Run) je to `/usr/bin/prusaslicer` po instalaci
- **POZOR:** Cloud Run nema trvale uloziste -- temp soubory musi pouzivat `/tmp`
- **NESOULAD:** Roadmap uvadi `total_layers` parsovani jako hotove, ale `parseGcode.js` tuto metriku neextrahuje. Nutno doplnit regex pattern a pridat do vystupu `parseGcodeMetrics()`.
- **BEZPECNOST:** `findSlicer.js` aktualne nekontroluje jestli nalezeny soubor je skutecne PrusaSlicer binary (mohl by to byt libovolny executable v `tools/prusaslicer/`). Pro produkci overit checksum nebo alespon output z `--help`.
