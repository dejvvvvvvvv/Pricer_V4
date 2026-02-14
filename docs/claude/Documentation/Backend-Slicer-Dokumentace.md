# Backend Slicer -- Dokumentace

> PrusaSlicer CLI integrace -- safe spawn, timeouts, parsing, preset/ini flow

---

## 1. Prehled

Backend slicer je sada cistych utility modulu v `backend-local/src/slicer/` ktere zapouzdrujici
interakci s PrusaSlicer CLI. Umoznuji:

1. **Slicovani 3D modelu** -- spawn `prusa-slicer-console.exe --export-gcode` s INI profilem
2. **Extrakce model info** -- spawn `prusa-slicer-console.exe --info` pro bounding box, objem, manifold check
3. **Parsing G-code** -- extrakce metrik (cas tisku, spotreba filamentu v gramech i mm) z vygenerovaneho G-code
4. **Parsing model info** -- prevod key=value stdout na strukturovany objekt

Moduly jsou volany z `index.js` (Express route handler `/api/slice` a `/api/health/prusa`),
ale samy o sobe **nemaji zadnou zavislost na Express** (zadny req/res/next).

**Celkovy rozsah:** 4 soubory, 356 radku kodu.

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Runtime | Node.js 18+ ESM (`import`/`export`) |
| Child process | `node:child_process` — `spawn()` s `shell: false` |
| Path | `node:path` — join pro output G-code cestu |
| Regex engine | Nativni JS RegExp — parsing G-code komentaru a stdout |
| Externi zavislosti | **Zadne** — ciste Node.js built-in moduly |
| Slicer binary | PrusaSlicer portable (`prusa-slicer-console.exe`) |

---

## 3. Architektura souboru (4 soubory, 356 radku)

```
backend-local/src/slicer/
  |-- runPrusaSlicer.js   (56 r.)  -- spawn PrusaSlicer --export-gcode, timeout, mereni casu
  |-- runPrusaInfo.js     (42 r.)  -- spawn PrusaSlicer --info, timeout
  |-- parseGcode.js       (179 r.) -- regex parsing G-code komentaru (cas, filament g/mm)
  |-- parseModelInfo.js   (79 r.)  -- parsing stdout z --info (size, bbox, volume, manifold)
```

### Rozdeleni zodpovednosti

| Soubor | Zodpovednost | Typ |
|--------|-------------|-----|
| `runPrusaSlicer.js` | Spawn CLI pro slicing, timeout management, mereni doby behu | I/O (spawn) |
| `runPrusaInfo.js` | Spawn CLI pro --info rezim, timeout management | I/O (spawn) |
| `parseGcode.js` | Regex extrakce metrik z G-code textu | Pure function |
| `parseModelInfo.js` | Parsing key=value radku z --info stdout | Pure function |

---

## 4. Import graf

```
index.js (Express route handlers)
  |-- import { runPrusaSlicer } from "./slicer/runPrusaSlicer.js"
  |-- import { parseGcodeMetrics } from "./slicer/parseGcode.js"
  |-- import { runPrusaInfo } from "./slicer/runPrusaInfo.js"
  |-- import { parseModelInfo } from "./slicer/parseModelInfo.js"

runPrusaSlicer.js
  |-- import { spawn } from "node:child_process"
  |-- import path from "node:path"

runPrusaInfo.js
  |-- import { spawn } from "node:child_process"

parseGcode.js
  |-- (zadne importy -- cisty regex modul)

parseModelInfo.js
  |-- (zadne importy -- cisty parsing modul)
```

**Klicove poznamky:**
- Slicer moduly se navzajem **neimportuji** -- kazdy je zcela nezavisly.
- Parsing moduly (`parseGcode.js`, `parseModelInfo.js`) nemaji **zadne** importy -- jsou to pure functions.
- Orchestrace probiha vyhradne v `index.js` (route handler `/api/slice`).

---

## 6. Datovy model (slicer job, results, preset)

### 6.1 Slicer Job (kontext v route handleru)

```
jobId:         string     -- "job-{nanoid(10)}"  napr. "job-a1b2c3d4e5"
jobDir:        string     -- "{WORKSPACE_ROOT}/{jobId}"
jobInputDir:   string     -- "{jobDir}/input"      (nahrane soubory)
jobOutputDir:  string     -- "{jobDir}/output"     (out.gcode)
```

### 6.2 runPrusaSlicer -- vstup a vystup

**Vstupni parametry:**
```typescript
{
  slicerCmd:  string   // absolutni cesta k prusa-slicer-console.exe
  modelPath:  string   // cesta k nahranemu 3D souboru (.stl/.obj/.3mf/.amf)
  iniPath:    string   // cesta k INI profilu (preset nebo uploadovany)
  outDir:     string   // adresar pro out.gcode
  timeoutMs?: number   // timeout v ms (default 300000 = 5 min)
}
```

**Navratova hodnota:**
```typescript
{
  exitCode:      number    // exit code procesu (0 = success)
  stdout:        string    // stdout slicer procesu
  stderr:        string    // stderr slicer procesu
  outGcodePath:  string    // absolutni cesta k vygenerovanemu out.gcode
  durationMs:    number    // doba behu sliceru v ms
}
```

### 6.3 runPrusaInfo -- vstup a vystup

**Vstupni parametry:**
```typescript
{
  slicerCmd:  string   // absolutni cesta k prusa-slicer-console.exe
  modelPath:  string   // cesta k 3D modelu
  timeoutMs?: number   // timeout v ms (default 20000 = 20 s)
}
```

**Navratova hodnota:**
```typescript
{
  exitCode:  number   // exit code procesu
  stdout:    string   // stdout s key=value radky
  stderr:    string   // stderr
}
```

### 6.4 parseGcodeMetrics -- vystup

```typescript
{
  estimatedTimeSeconds:  number | null   // odhadovany cas tisku v sekundach
  filamentGrams:         number | null   // spotreba filamentu v gramech
  filamentMm:            number | null   // spotreba filamentu v mm
}
```

### 6.5 parseModelInfo -- vystup

```typescript
{
  raw:        Record<string, number | string>   // vsechny key=value pary
  sizeMm?:    { x: number, y: number, z: number }   // rozmery modelu
  bboxMm?:    { min: {x,y,z}, max: {x,y,z} }        // bounding box
  volumeMm3?: number                                  // objem v mm3
  facets?:    number                                  // pocet facets (trojuhelniku)
  parts?:     number                                  // pocet casti
  manifold?:  boolean                                 // je model manifold (vodotesny)?
}
```

**Poznamka:** Volitelne fieldy (`sizeMm`, `bboxMm`, atd.) jsou z vystupu **smazany** pokud
nemaji kompletni data (napr. chybi osa z). Field `raw` je vzdy pritomen a obsahuje
vsechny naparsovane pary.

### 6.6 INI preset resolution (z index.js)

INI soubor se vybira v poradi priority:
1. **Uploadovany INI** -- primo v multipart requestu (field `ini`)
2. **Explicitni presetId** -- `req.body.presetId` -> lookup pres `getIniPathForPreset()`
3. **Tenant default preset** -- `readPresetsState()` -> `state.defaultPresetId` -> lookup
4. **ENV fallback** -- `process.env.PRUSA_DEFAULT_INI`
5. **Chyba 400** -- pokud zadna z variant nenajde INI

---

## 7. API (vnitrni, volano z index.js)

### 7.1 Exportovane funkce

| Modul | Exportovana funkce | Signatura |
|-------|-------------------|-----------|
| `runPrusaSlicer.js` | `runPrusaSlicer` | `async ({ slicerCmd, modelPath, iniPath, outDir, timeoutMs? }) => Result` |
| `runPrusaInfo.js` | `runPrusaInfo` | `async ({ slicerCmd, modelPath, timeoutMs? }) => Result` |
| `parseGcode.js` | `parseGcodeMetrics` | `(gcodeText: string) => Metrics` |
| `parseModelInfo.js` | `parseModelInfo` | `(stdout: string) => ModelInfo` |

### 7.2 Jak jsou volany z index.js

**`/api/health/prusa` (GET):**
- Vola `resolveSlicerCmd()` pro nalezeni binary
- Spousti `runSimple(slicerCmd, ["--help"], 15000)` (ne slicer modul, ale lokalni helper)
- Vraci stav slicer binary (nalezena, exit code, stdout/stderr)

**`/api/slice` (POST, multipart):**
1. `resolveSlicerCmd()` -- najde slicer binary
2. INI resolution (viz sekce 6.6)
3. `runPrusaInfo({ slicerCmd, modelPath, timeoutMs: 20000 })` -- volitelne, pro model dimensions
4. `parseModelInfo(infoRun.stdout)` -- pokud --info uspesne
5. `runPrusaSlicer({ slicerCmd, modelPath, iniPath, outDir, timeoutMs: 300000 })` -- hlavni slicing
6. `parseGcodeMetrics(gcodeText)` -- extrakce metrik z vygenerovaneho G-code
7. Odpoved s `metrics`, `modelInfo`, `durationMs`, `jobId`

### 7.3 Lokalni helpery v index.js (ne soucasti slicer modulu)

| Helper | Popis |
|--------|-------|
| `resolveSlicerCmd()` | ENV `PRUSA_SLICER_CMD` -> `findPrusaSlicerConsole(projectRoot)` (BFS v `tools/prusaslicer/`) |
| `createJobMiddleware` | Vytvori `jobId`, `jobDir`, `jobInputDir`, `jobOutputDir` |
| `createUploader()` | Multer konfigurace -- povolene typy: `.stl`, `.obj`, `.3mf`, `.amf`, `.ini`; limit 250 MB |
| `runSimple()` | Minimalni spawn runner pro health check (`--help`) s 15s timeoutem |
| `findPrusaSlicerConsole()` | BFS hledani `prusa-slicer-console.exe` v `tools/prusaslicer/` (max depth 6) |

---

## 9. Data flow (upload -> spawn -> parse -> respond)

```
Klient (FE)
   |
   | POST /api/slice (multipart: model + ini/presetId)
   v
createJobMiddleware
   |-- vytvori jobId = "job-{nanoid(10)}"
   |-- vytvori {WORKSPACE_ROOT}/{jobId}/input/
   |-- vytvori {WORKSPACE_ROOT}/{jobId}/output/
   v
createUploader (multer)
   |-- ulozi model do {jobDir}/input/{safeName}
   |-- ulozi ini do {jobDir}/input/{safeName} (pokud uploadovano)
   v
Route handler
   |
   |-- 1. resolveSlicerCmd()
   |       ENV PRUSA_SLICER_CMD || BFS v tools/prusaslicer/
   |
   |-- 2. INI resolution
   |       uploadovany ini > explicitni presetId > tenant default > ENV fallback
   |
   |-- 3. runPrusaInfo({ slicerCmd, modelPath, timeoutMs: 20000 })
   |       spawn: prusa-slicer-console.exe --info model.stl
   |       |-- stdout -> prusa_info_stdout.log
   |       |-- stderr -> prusa_info_stderr.log
   |       v
   |       parseModelInfo(stdout) -> { sizeMm, bboxMm, volumeMm3, facets, manifold }
   |
   |-- 4. runPrusaSlicer({ slicerCmd, modelPath, iniPath, outDir, timeoutMs: 300000 })
   |       spawn: prusa-slicer-console.exe --export-gcode -o out.gcode model.stl --load profile.ini
   |       |-- cwd = outDir
   |       |-- stdout -> prusa_stdout.log
   |       |-- stderr -> prusa_stderr.log
   |       v
   |       exitCode !== 0 -> HTTP 500 s chybou
   |       out.gcode neexistuje -> HTTP 500 s chybou
   |
   |-- 5. fs.readFile(out.gcode) -> gcodeText
   |       parseGcodeMetrics(gcodeText)
   |       -> { estimatedTimeSeconds, filamentGrams, filamentMm }
   |
   v
HTTP 200 JSON response
   {
     success: true,
     jobId, jobDir, outGcodePath,
     durationMs,              // doba slicovani
     slicerCmd,               // pouzita cesta k binary
     iniUsed,                 // pouzity INI soubor
     usedPreset,              // presetId (pokud pouzit)
     modelUsed,               // originalname uploadovaneho souboru
     modelInfo,               // z --info (nebo null)
     modelInfoError,          // chyba z --info (pokud nastala)
     metrics                  // z parseGcodeMetrics
   }
```

---

## 10. Error handling (timeouts, non-zero exit, stderr parsing)

### 10.1 Timeout management

Oba spawn moduly pouzivaji stejny pattern `spawnWithTimeout`:

```javascript
const timer = setTimeout(() => {
  try { child.kill(); } catch { /* ignore */ }
  reject(new Error(`PrusaSlicer timed out after ${timeoutMs}ms`));
}, timeoutMs);
```

| Operace | Default timeout | Konfigurovatelny |
|---------|----------------|-----------------|
| `runPrusaSlicer` (slicing) | 300 000 ms (5 min) | Ano, parametr `timeoutMs` |
| `runPrusaInfo` (--info) | 20 000 ms (20 s) | Ano, parametr `timeoutMs` |
| Health check (`runSimple`) | 15 000 ms (15 s) | Hardcoded v index.js |

**Chovani pri timeoutu:**
1. `child.kill()` -- signal SIGTERM (na Windows TerminateProcess)
2. Promise se **rejectne** s Error -- `"PrusaSlicer timed out after Xms"`
3. Route handler chyti exception a vraci HTTP 500

### 10.2 Non-zero exit code

Route handler kontroluje `run.exitCode !== 0`:

```javascript
if (run.exitCode !== 0) {
  return res.status(500).json({
    success: false,
    error: "PrusaSlicer returned non-zero exit code.",
    exitCode: run.exitCode,
    jobId, jobDir,
    stderr: run.stderr.slice(0, 5000)  // truncated
  });
}
```

### 10.3 Missing output file

Po uspesnem exit code se jeste overuje existence `out.gcode`:

```javascript
if (!(await fileExists(run.outGcodePath))) {
  return res.status(500).json({
    success: false,
    error: "out.gcode was not produced.",
    ...
  });
}
```

### 10.4 Spawn error (binary nenalezena)

`child.on("error")` handler -- typicky `ENOENT` pokud binary neexistuje:

```javascript
child.on("error", (err) => {
  clearTimeout(timer);
  reject(err);
});
```

### 10.5 Stderr/stdout persistance

Vsechny stdout/stderr vystupy se zapisuji do job adresare pro debugovani:
- `prusa_info_stdout.log` / `prusa_info_stderr.log` (z --info)
- `prusa_stdout.log` / `prusa_stderr.log` (z --export-gcode)

Zapis pouziva `.catch(() => {})` -- chyba pri zapisu logu neprerusi hlavni flow.

### 10.6 Parsing robustnost

Parsing funkce **nikdy nehazi vyjimky** -- pri nerozpoznanem formatu vraci `null`:
- `parseEstimatedTimeSeconds()` -> `null`
- `parseFilamentGrams()` -> `null`
- `parseFilamentMm()` -> `null`
- `parseModelInfo()` -> objekt s chybejicimi fieldy (smazany pres `delete`)

---

## 13. Performance (concurrent jobs, timeouts)

### 13.1 Concurrency model

- **Zadne omezeni** na pocet soucasnych slicer jobu.
- Kazdy request vytvori nezavisly job directory (`job-{nanoid}`).
- PrusaSlicer se spousti jako **separatni proces** (`spawn`).
- Node.js event loop neni blokovany (async/await + spawn).

**Riziko:** Neomezena concurrency muze vycerpat:
- RAM (PrusaSlicer typicky 200-800 MB na job)
- CPU (slicing je CPU-intensive)
- Disk (kazdy job generuje G-code, potencialne stovky MB)

### 13.2 Casova narocnost

| Operace | Typicky cas | Max timeout |
|---------|-------------|-------------|
| `--info` (model metadata) | 1-5 s | 20 s |
| `--export-gcode` (slicing) | 10 s - 5 min | 5 min |
| G-code parsing | < 100 ms | N/A (sync) |
| Model info parsing | < 1 ms | N/A (sync) |

### 13.3 G-code scanning strategie

`parseGcodeMetrics` skenuje **prvnich 20 000 radku** (HEAD) a **poslednich 20 000 radku** (TAIL)
misto celeho souboru. G-code muze mit miliony radku -- toto je kompromis mezi pokrytim a rychlosti.

```javascript
const HEAD_LINES = 20000;
const TAIL_LINES = 20000;
const head = lines.slice(0, HEAD_LINES).join("\n");
const tail = lines.length > TAIL_LINES
  ? lines.slice(Math.max(0, lines.length - TAIL_LINES)).join("\n")
  : "";
```

PrusaSlicer typicky pise summary komentare na **zacatek** G-code souboru, ale nekdy mohou byt
posunute hluboko kvuli rozsahlym config key hlavickam.

### 13.4 Cleanup

Job adresare se po zpracovani **nemazu** -- zustavaji na disku. Cleanup je zodpovednost
externi logiky nebo manualni udrzby (v `WORKSPACE_ROOT`).

---

## 14. Bezpecnost (path traversal, command injection)

### 14.1 Command injection prevence

- `spawn()` pouziva `shell: false` -- argumenty se **neinterpretovane** shellem.
- Zadna string interpolace do prikazu (argumenty jako pole).
- `windowsHide: true` -- skryje konzolove okno na Windows.

```javascript
const child = spawn(cmd, args, { ...options, shell: false });
```

### 14.2 Filename sanitizace

Multer `filename` callback sanitizuje nazvy uploadovanych souboru:

```javascript
filename: (_req, file, cb) => {
  const safe = file.originalname.replace(/[^a-zA-Z0-9\._-]/g, "_");
  cb(null, safe);
}
```

Odstranuje vsechny znaky krome alfanumerickych, tecky, podtrzitka a pomlcky.

### 14.3 File type filter

Upload akceptuje pouze povolene pripony:
- `.stl`, `.obj`, `.3mf`, `.amf` (3D modely)
- `.ini` (slicer profily)

### 14.4 Upload size limit

Max velikost souboru: **250 MB** (`250 * 1024 * 1024` bytes).

### 14.5 Zname bezpecnostni omezeni

| Riziko | Status | Popis |
|--------|--------|-------|
| Path traversal v `presetId` | **Neosetren v slicer modulu** | `presetId` se pouziva pro `getIniPathForPreset()` -- sanitizace je zodpovednost `presetsStore.js` |
| Slicer binary path | **Duveryhodny** | Z ENV nebo auto-detect v `tools/` -- ne od uzivatele |
| Neomezena concurrency | **Nereseno** | Zadny rate limiting na `/api/slice` |
| Job cleanup | **Nereseno** | Soubory zustavaji na disku bez expirace |
| WORKSPACE_ROOT | **ENV** | Default `C:\modelpricer\tmp` (Windows) nebo `os.tmpdir()/modelpricer` |

---

## 17. Zname omezeni

### 17.1 Funkcni omezeni

1. **Pouze PrusaSlicer** -- kod je specificky pro PrusaSlicer CLI format (argumenty, stdout format, G-code komentare). Jine slicery (Cura, OrcaSlicer) nejsou podporovany (krome zakladniho Cura `TIME` tagu).

2. **Windows-first auto-detect** -- `findPrusaSlicerConsole()` hleda `prusa-slicer-console.exe`. Na Linuxu/macOS je nutne nastavit `PRUSA_SLICER_CMD` rucne.

3. **Zadne fronty** -- joby se spousti okamzite bez queue systemu. Pri vysokem zatizeni muze dojit k vypadkum pameti nebo CPU.

4. **Zadna job persistence** -- job metadata se neukadaji do databaze. Po restartu serveru se ztraci prehled o probihajicich jobech.

5. **Synchronni G-code cteni** -- `fs.readFile(outGcodePath, "utf8")` nacte cely G-code do pameti. Pro velke modely muze G-code mit stovky MB.

### 17.2 Parsing omezeni

1. **Cas tisku** -- podporovany formaty:
   - PrusaSlicer: `; estimated printing time (normal mode) = 1h 2m 3s`
   - PrusaSlicer: `; estimated printing time (silent mode) = 00:12:34`
   - PrusaSlicer: `; printing time = 12m 34s`
   - Cura: `;TIME:1234` (sekundy)
   - **Nepodporovany:** jine slicery/formaty

2. **Filament** -- extrahuje gramy i mm, ale **pouze pro prvni extruder** v pripade multi-extruder sumace (pouziva `sumNumbersFromText` ktery sectne vsechny hodnoty).

3. **Model info** -- zavisi na formatu stdout z `--info`. Pokud PrusaSlicer zmeni format vystupu, parsing se rozbije.

4. **HEAD/TAIL scan** -- pokud se summary komentar nachazi mezi radky 20001 a (total - 20000), parsing ho mine.

### 17.3 Provozni omezeni

1. **SIGTERM na Windows** -- `child.kill()` na Windows pouziva `TerminateProcess`, nikoliv graceful shutdown. PrusaSlicer muze zanechat docasne soubory.

2. **Duplicitni spawnWithTimeout** -- funkce `spawnWithTimeout` je implementovana **dvakrat** (v `runPrusaSlicer.js` i `runPrusaInfo.js`). Neni sdilena, coz zvysuje udrzbu.

3. **Zadne logovani** -- slicer moduly nemaji zadny logging framework. Diagnostika je mozna pouze pres stderr/stdout soubory v job adresari.

4. **Exit code z close eventu** -- `runPrusaInfo` pouziva `code ?? 0` (fallback na 0 pri null), zatimco `runPrusaSlicer` pouziva `code` primo (muze byt null). Nekonzistentni chovani.

---

*Posledni aktualizace: 2026-02-13*
*Agent: mp-mid-services-logic (Backend Slicer dokumentace)*
