# Backend Server -- Dokumentace

> Express.js backend pro ModelPricer -- slicer API, email, presets, file storage, upload.
> Verze: 0.1.2 | Port: 3001 | Runtime: Node.js 18+ ESM

---

## 1. Prehled

Backend server je lokalni Express.js aplikace ktera poskytuje REST API pro:

- **PrusaSlicer integrace** -- upload 3D modelu, slicovani, extrakce metrik z G-code
- **Sprava presetu** -- CRUD operace nad tiskovymi profily (INI soubory)
- **File storage** -- sprava objednavkovych slozek, browsing, download, ZIP export, trash
- **Email sluzby** -- sablony, nahled, odesilani emailu (routes existuji ale NEJSOU pripojeny)
- **Health check** -- stav serveru a PrusaSliceru

**Vychozi port:** `3001` (konfigurovatelny pres `PORT` env var)
**Vite proxy:** Frontend na portu 4028 proxuje `/api` -> `localhost:3001`

### Souhrn endpointu

| Oblast | Pocet endpointu | Prefix |
|--------|-----------------|--------|
| Health | 2 | `/api/health` |
| Presets | 6 | `/api/presets`, `/api/widget/presets` |
| Slice | 1 | `/api/slice` |
| Storage | 11 | `/api/storage` |
| Email | 4 | `/api/email` (NEPRIPOJENO) |
| **Celkem** | **24** | |

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Runtime | Node.js 18+ |
| Moduly | ESM (`"type": "module"` v package.json) |
| Framework | Express 4.19.2 |
| Upload | multer 1.4.5-lts.1 |
| CORS | cors 2.8.5 |
| Env vars | dotenv 16.4.5 |
| ID generace | nanoid 5.0.7 |
| ZIP export | archiver 7.0.0 |

### package.json skripty

```
"dev":   "node src/index.js"
"start": "node src/index.js"
```

Zadny build krok, zadny TypeScript, zadny bundler. Server se spousti primo z ESM zdrojaku.

---

## 3. Architektura souboru

```
backend-local/
  package.json
  src/
    index.js                  -- Hlavni Express server (484 radku)
                                 Middleware chain, inline route handlery, helpers
    presetsStore.js           -- Preset CRUD logika (file-system JSON store)
    routes/
      emailRoutes.js          -- Email API router (NEPRIPOJEN v index.js!)
    slicer/
      runPrusaSlicer.js       -- Spawn PrusaSlicer CLI pro slicovani
      runPrusaInfo.js          -- Spawn PrusaSlicer --info pro rozmery modelu
      parseGcode.js           -- Extrakce metrik z G-code textu
      parseModelInfo.js       -- Parsovani stdout z PrusaSlicer --info
    storage/
      storageRouter.js        -- Express Router pro /api/storage/* (11 endpointu)
      storageService.js       -- Business logika: browse, trash, search, move, stats
      checksumUtil.js          -- SHA-256 hash souboru
      metadataBuilder.js       -- Generovani order-meta, manifest, pricing snapshot
    util/
      fsSafe.js               -- ensureDir, fileExists, toAbs helpery
      findSlicer.js           -- Auto-detekce PrusaSlicer v tools/prusaslicer
    email/
      emailService.js         -- Odesilani emailu pres providery
      emailProvider.js         -- Abstrakce email provideru
      templateRenderer.js     -- Renderovani email sablon
      templates/
        index.js              -- Registry email sablon
      triggers.js             -- Email trigger definice
```

---

## 4. Import graf

```
index.js
  |-- express, cors, dotenv, multer, nanoid
  |-- node:path, node:os, node:fs/promises, node:url
  |
  |-- util/fsSafe.js            (ensureDir, fileExists)
  |-- util/findSlicer.js        (findPrusaSlicerConsole)
  |
  |-- slicer/runPrusaSlicer.js  (runPrusaSlicer)
  |-- slicer/parseGcode.js      (parseGcodeMetrics)
  |-- slicer/runPrusaInfo.js    (runPrusaInfo)
  |-- slicer/parseModelInfo.js  (parseModelInfo)
  |
  |-- presetsStore.js           (createPresetFromIni, deletePreset,
  |                              getIniPathForPreset, listPresets,
  |                              readPresetsState, setDefaultPreset,
  |                              updatePresetMeta)
  |
  |-- storage/storageRouter.js  (mountovan jako /api/storage)
       |-- storage/storageService.js
       |    |-- storage/checksumUtil.js
       |    |-- storage/metadataBuilder.js
       |-- multer, archiver (dynamic import)

routes/emailRoutes.js           (NEPRIPOJEN -- existuje ale neni importovan v index.js)
  |-- email/emailService.js
  |-- email/templateRenderer.js
```

---

## 7. API Endpointy

### 7.1 Health Check

#### `GET /api/health`
Zakladni health check serveru.

**Request:** zadne parametry
**Response (200):**
```json
{
  "ok": true,
  "service": "modelpricer-backend-local",
  "port": 3001,
  "workspaceRoot": "C:\\modelpricer\\tmp",
  "projectRoot": "...",
  "backendRoot": "...",
  "time": "2026-02-13T10:00:00.000Z"
}
```

> POZOR: Vraceni `workspaceRoot`, `projectRoot`, `backendRoot` je bezpecnostni riziko
> v produkci -- odhaluje interni cesty serveru. Viz sekce 14 a 17.

---

#### `GET /api/health/prusa`
Overeni dostupnosti PrusaSlicer CLI.

**Request:** zadne parametry
**Response (200):**
```json
{
  "ok": true,
  "slicerCmd": "C:\\tools\\prusaslicer\\prusa-slicer-console.exe",
  "checkMethod": "--help",
  "exitCode": 0,
  "stdout": "...(max 2000 chars)...",
  "stderr": "..."
}
```
**Response (500):** PrusaSlicer nenalezen nebo nefunkcni.

---

### 7.2 Presets API

#### `GET /api/presets`
Seznam vsech presetu pro tenanta.

**Headers:** `x-tenant-id` (volitelny, fallback `"demo-tenant"`)
**Response (200):**
```json
{
  "ok": true,
  "data": {
    "presets": [
      {
        "id": "p_abc123...",
        "name": "PLA Standard",
        "order": 10,
        "visibleInWidget": true,
        "material_key": "pla",
        "print_overrides": {},
        "createdAt": "2026-02-13T...",
        "updatedAt": "2026-02-13T..."
      }
    ],
    "defaultPresetId": "p_abc123..."
  }
}
```

---

#### `POST /api/presets`
Vytvoreni noveho presetu z INI souboru.

**Content-Type:** `multipart/form-data`
**Body fields:**
| Field | Typ | Povinny | Popis |
|-------|-----|---------|-------|
| `file` | File (.ini) | ANO | PrusaSlicer profil (max 5 MB) |
| `name` | string | NE | Nazev presetu (default: "Preset") |
| `order` | number | NE | Razeni (default: 0) |
| `visibleInWidget` | boolean | NE | Viditelnost ve widgetu |

**Response (200):** `{ ok: true, data: { presets: [...], defaultPresetId: "..." } }`
**Response (400):** Chybejici soubor
**Response (500):** Chyba pri ukladani

---

#### `PATCH /api/presets/:id`
Aktualizace metadat presetu.

**Body (JSON):**
```json
{
  "name": "Novy nazev",
  "order": 5,
  "visibleInWidget": true,
  "material_key": "pla",
  "print_overrides": { "infill": 20 }
}
```
**Response (200):** `{ ok: true, data: { presets: [...], defaultPresetId: "..." } }`
**Response (404):** Preset nenalezen

---

#### `POST /api/presets/:id/default`
Nastaveni presetu jako vychozi.

**Response (200):** `{ ok: true, data: { presets: [...], defaultPresetId: "p_..." } }`
**Response (404):** Preset nenalezen

---

#### `DELETE /api/presets/:id`
Smazani presetu (vcetne INI souboru).

**Response (200):** `{ ok: true, data: { presets: [...], defaultPresetId: "..." } }`
**Response (404):** Preset nenalezen
**Response (500):** Chyba pri mazani

---

#### `GET /api/widget/presets`
Verejny seznam presetu pro widget (filtrovane pole, jen `visibleInWidget === true`).

**Headers:** `x-tenant-id` (volitelny)
**Response (200):**
```json
{
  "presets": [
    { "id": "...", "name": "...", "order": 10, "visibleInWidget": true, ... }
  ],
  "defaultPresetId": "p_..."
}
```

> POZOR: Tento endpoint NEMA standardni `{ ok: true, data: ... }` format.
> Vraci primo `{ presets, defaultPresetId }`. Nekonzistence s ostatnimi endpointy.

---

### 7.3 Slice API

#### `POST /api/slice`
Upload 3D modelu, slicovani pres PrusaSlicer, vraceni metrik.

**Content-Type:** `multipart/form-data`
**Body fields:**
| Field | Typ | Povinny | Popis |
|-------|-----|---------|-------|
| `model` | File | ANO | 3D model (.stl, .obj, .3mf, .amf), max 250 MB |
| `ini` | File (.ini) | NE | PrusaSlicer profil |
| `presetId` | string | NE | ID presetu (alternativa k `ini` souboru) |

**INI resolve priorita:**
1. Nahrana `ini` soubor (explicitni)
2. `presetId` z body (preset z tenant store)
3. Tenant default preset (`defaultPresetId` z presets.json)
4. `PRUSA_DEFAULT_INI` env var

**Response (200):**
```json
{
  "success": true,
  "jobId": "job-AbCdEfGhIj",
  "jobDir": "C:\\modelpricer\\tmp\\job-AbCdEfGhIj",
  "outGcodePath": "...",
  "durationMs": 12345,
  "slicerCmd": "...",
  "iniUsed": "...",
  "usedPreset": "p_...",
  "modelUsed": "model.stl",
  "modelInfo": {
    "boundingBox": { "x": 50, "y": 30, "z": 20 },
    "volume": 15000
  },
  "modelInfoError": null,
  "metrics": {
    "filamentUsedMm": 1234.5,
    "filamentUsedG": 3.7,
    "estimatedTime": "1h 23m",
    "layerHeight": 0.2
  }
}
```

> POZOR: Tento endpoint pouziva `success` misto `ok` v response.
> Nekonzistence se standardnim formatem `{ ok: true/false }`.

**Response (400):** Chybejici model nebo INI
**Response (500):** PrusaSlicer chyba nebo interni chyba

---

### 7.4 Storage API (mountovano pres storageRouter)

Vsechny endpointy maji prefix `/api/storage`.
Vsechny pouzivaji `x-tenant-id` header pro tenant izolaci.
Response format: `{ ok: true, data: {...} }` / `{ ok: false, errorCode: "MP_...", message: "..." }`

#### `POST /api/storage/orders`
Vytvoreni slozky objednavky s modely, G-code, presetem a metadaty.

**Content-Type:** `multipart/form-data`
**Body fields:**
| Field | Typ | Povinny | Popis |
|-------|-----|---------|-------|
| `models` | File[] | NE | 3D modely (max 20 souboru, max 250 MB/soubor) |
| `orderData` | string (JSON) | ANO | JSON objekt s informacemi o objednavce |

Podporovane formaty: .stl, .obj, .3mf, .amf, .step, .stp

**Vytvorena struktura:**
```
Orders/
  #<orderNumber>__<shortId>/
    models/        -- 3D modely
    gcode/         -- G-code soubory (kopirovane ze slicer workspace)
    presets/       -- INI profily
    meta/
      order-meta.json
      file-manifest.json
      pricing-snapshot.json
```

---

#### `GET /api/storage/browse`
Prohlizeni obsahu slozky.

**Query params:** `path` (relativni cesta, default: root)
**Specialni path:** `.trash` nebo `Trash` -- prohlizeni kosse

---

#### `GET /api/storage/file`
Download souboru (Content-Disposition: attachment).

**Query params:** `path` (povinny)
**MIME typy:** automaticka detekce (.stl, .obj, .3mf, .json, .png, .jpg, .pdf, .zip, ...)

---

#### `GET /api/storage/file/preview`
Nahled souboru inline (Content-Disposition: inline).

**Query params:** `path` (povinny)

---

#### `POST /api/storage/zip`
ZIP export vice souboru/slozek.

**Body (JSON):** `{ paths: ["Orders/...", "CompanyLibrary/..."] }`
**Response:** Primo ZIP stream (Content-Type: application/zip)
**Zavislost:** archiver package (dynamic import)

---

#### `POST /api/storage/upload`
Upload souboru do Company Library.

**Content-Type:** `multipart/form-data`
**Body fields:**
| Field | Typ | Povinny | Popis |
|-------|-----|---------|-------|
| `files` | File[] | ANO | Max 10 souboru, max 250 MB/soubor |
| `targetPath` | string | NE | Cilova slozka (default: "CompanyLibrary") |

---

#### `DELETE /api/storage/file`
Soft delete -- presun do `.trash/` slozky.

**Body (JSON):** `{ path: "Orders/..." }`

---

#### `POST /api/storage/restore`
Obnoveni souboru z kosse.

**Body (JSON):** `{ trashPath: "<timestamp>___<encoded_path>" }`

---

#### `GET /api/storage/search`
Vyhledavani souboru podle nazvu (case-insensitive substring match).

**Query params:** `q` (vyhledavaci dotaz)
**Limit:** max 50 vysledku

---

#### `POST /api/storage/folder`
Vytvoreni nove slozky.

**Body (JSON):** `{ path: "CompanyLibrary/nova-slozka" }`

---

#### `GET /api/storage/stats`
Statistiky uloziste tenanta.

**Response (200):**
```json
{
  "ok": true,
  "data": {
    "totalFiles": 42,
    "totalFolders": 8,
    "totalSizeBytes": 125000000,
    "orderCount": 5
  }
}
```

---

#### `POST /api/storage/rename`
Prejmenovat soubor nebo slozku.

**Body (JSON):** `{ path: "Orders/...", newName: "novy-nazev.stl" }`

---

#### `POST /api/storage/move`
Presun souboru/slozky do jine lokace.

**Body (JSON):** `{ path: "Orders/.../model.stl", destination: "CompanyLibrary" }`

---

### 7.5 Email API (NEPRIPOJENO)

Router existuje v `src/routes/emailRoutes.js` ale NENI importovan ani mountovan v `index.js`.
Tyto endpointy jsou nedostupne dokud se nepripoji.

#### `GET /api/email/templates` -- seznam sablon
#### `POST /api/email/preview` -- nahled sablony
#### `POST /api/email/send` -- odeslani emailu
#### `GET /api/email/log` -- log odeslanych emailu

---

## 9. Middleware chain

Middleware se aplikuje v nasledujicim poradi (shora dolu v `index.js`):

```
1. express.json({ limit: "2mb" })     -- Parsovani JSON body
2. cors({...})                         -- CORS s dynamickou origin validaci
3. [route-specific multer]             -- Upload middleware (jen pro urcite endpointy)
4. [route handlery]                    -- Logika endpointu
5. Error handler                       -- Globalni catch-all (radek 392-394)
```

### 9.1 CORS konfigurace

```javascript
const corsOriginsRaw = (process.env.CORS_ORIGINS || "").trim();
const corsOrigins = corsOriginsRaw
  ? corsOriginsRaw.split(",").map(s => s.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];
```

- **Bez env var:** povoleny 3 lokalni originy (5173, 3000)
- **S env var:** comma-separated list (napr. `CORS_ORIGINS=https://app.modelpricer.com,https://widget.modelpricer.com`)
- **Wildcard:** `CORS_ORIGINS=*` povoli vsechny originy
- **Bez originu** (curl/Postman): povoleno (`!origin => cb(null, true)`)
- **Credentials:** `credentials: true` -- povolene cookies

### 9.2 Body parser

- `express.json({ limit: "2mb" })` -- globalne pro vsechny endpointy
- Bez `express.urlencoded()` -- formularova data se neparseuji (upload jde pres multer)

### 9.3 Upload middleware (multer)

Existuji 3 nezavisle multer instance:

| Instance | Pouziti | Storage | Max velikost | Filtry |
|----------|---------|---------|--------------|--------|
| `presetUpload` | `POST /api/presets` | memoryStorage | 5 MB | jen .ini |
| `createUploader()` | `POST /api/slice` | diskStorage (jobInputDir) | 250 MB | .stl, .obj, .3mf, .amf, .ini |
| `orderUpload` | `POST /api/storage/orders` | diskStorage (.tmp) | 250 MB | .stl, .obj, .3mf, .amf, .step, .stp |
| `libraryUpload` | `POST /api/storage/upload` | diskStorage (.tmp) | 250 MB | zadny filtr (libovolny typ!) |

### 9.4 Tenant ID extrakce

Funkce `getTenantIdFromReq(req)` (radek 80-83 v index.js):
- Cte header `x-tenant-id`
- Fallback: `"demo-tenant"`
- StorageRouter ma vlastni identickou implementaci (`getTenantId`)
- Sanitizace tenantId probiha az v `presetsStore.js` (`sanitizeTenantId`) -- nahrazuje nepovolene znaky za `_`

### 9.5 Job middleware (pro /api/slice)

`createJobMiddleware` (radek 411-421):
1. Generuje unikatni `jobId` pomoci `nanoid(10)` (format: `job-XxXxXxXxXx`)
2. Nastavi `req.jobId`, `req.jobDir`, `req.jobInputDir`, `req.jobOutputDir`
3. Vytvori adresarovou strukturu pres `ensureDir`

---

## 10. Error handling

### 10.1 Route-level error handling

Vsechny route handlery pouzivaji try/catch blok. Error format:

```javascript
function fail(res, status, errorCode, message, details) {
  return res.status(status).json({ ok: false, errorCode, message, details });
}
```

### 10.2 Error codes

| Error Code | HTTP | Pouziti |
|------------|------|---------|
| `MP_BAD_REQUEST` | 400 | Chybejici povinne pole |
| `MP_NOT_FOUND` | 404 | Preset/soubor nenalezen |
| `MP_PATH_TRAVERSAL` | 403 | Path traversal pokus (storage) |
| `MP_PRESETS_LIST_FAILED` | 500 | Chyba pri cteni presetu |
| `MP_PRESET_UPLOAD_FAILED` | 500 | Chyba pri uploadu presetu |
| `MP_PRESET_PATCH_FAILED` | 500 | Chyba pri aktualizaci presetu |
| `MP_PRESET_DEFAULT_FAILED` | 500 | Chyba pri nastaveni defaultu |
| `MP_PRESET_DELETE_FAILED` | 500 | Chyba pri mazani presetu |
| `MP_STORAGE_ORDER_FAILED` | 500 | Chyba pri vytvareni order slozky |
| `MP_BROWSE_FAILED` | 500 | Chyba pri prohlizeni slozek |
| `MP_DOWNLOAD_FAILED` | 500 | Chyba pri stahovani |
| `MP_PREVIEW_FAILED` | 500 | Chyba pri nahledu |
| `MP_ZIP_FAILED` | 500 | Chyba pri ZIP exportu |
| `MP_ZIP_UNAVAILABLE` | 500 | archiver package neni nainstalovan |
| `MP_UPLOAD_FAILED` | 500 | Chyba pri uploadu do knihovny |
| `MP_DELETE_FAILED` | 500 | Chyba pri soft delete |
| `MP_RESTORE_FAILED` | 500 | Chyba pri obnoveni z kosse |
| `MP_SEARCH_FAILED` | 500 | Chyba pri vyhledavani |
| `MP_FOLDER_FAILED` | 500 | Chyba pri vytvareni slozky |
| `MP_STATS_FAILED` | 500 | Chyba pri ziskavani statistik |
| `MP_RENAME_FAILED` | 500 | Chyba pri prejmenovani |
| `MP_MOVE_FAILED` | 500 | Chyba pri presunu |

### 10.3 Globalni error handler

```javascript
app.use((err, _req, res, _next) => {
  res.status(500).json({ success: false, error: String(err?.message || err) });
});
```

> POZOR: Globalni handler pouziva `success` misto `ok` a `error` misto `errorCode` + `message`.
> Nekonzistence se standardnim formatem.

### 10.4 Chybejici error handling

- Zadny `asyncHandler` wrapper -- kazdy route handler musi mit vlastni try/catch
- Multer errory (napr. prekroceni velikosti) mohou propadnout do globalniho handleru bez spravneho error code
- Unhandled promise rejection na top-level `await ensureDir(WORKSPACE_ROOT)` (radek 230) -- pokud selze, server se nespusti bez jasne chybove hlasky

---

## 13. Performance

### 13.1 Timeouty

| Operace | Timeout | Konfigurovatelny |
|---------|---------|------------------|
| PrusaSlicer slicing | 300 000 ms (5 min) | NE (hardcoded) |
| PrusaSlicer --info | 20 000 ms (20 s) | NE (hardcoded) |
| PrusaSlicer --help (health) | 15 000 ms (15 s) | NE (hardcoded) |
| Express request | bez limitu | NE (zadne nastaveni) |

### 13.2 Upload limity

| Kontext | Limit | Konfigurovatelny |
|---------|-------|------------------|
| JSON body | 2 MB | NE (hardcoded) |
| Preset INI upload | 5 MB | NE (hardcoded) |
| Model upload (slice) | 250 MB | NE (hardcoded) |
| Storage order models | 250 MB / soubor, max 20 souboru | NE (hardcoded) |
| Storage library upload | 250 MB / soubor, max 10 souboru | NE (hardcoded) |

### 13.3 Disk usage

- Slicer joby se ukladaji do `WORKSPACE_ROOT` a NEMAJI automaticky cleanup
- Kazdy job vytvari `input/` a `output/` podslozky s modelem a G-code
- PrusaSlicer stderr/stdout se persistuje jako `.log` soubory v job adresari
- Storage data tenanta se ukladaji do `STORAGE_ROOT/<tenantId>/`
- Soft-deleted soubory zustavaji v `.trash/` bez TTL

### 13.4 Pameti

- Preset INI soubory se nacitaji do pameti (memoryStorage) -- max 5 MB
- G-code se cte cely do pameti pro parsovani metrik (`fs.readFile` radek 363)
- Archiver streamuje ZIP primo do response (neprzitezuje pamet)

---

## 14. Bezpecnost

### 14.1 CORS

- Dynamicka origin validace s whitelist pristupem
- Bez originu (curl/Postman/server-to-server) je VZDY povoleno -- `!origin => true`
- `credentials: true` umoznuje cookies
- CORS chyby se propagovaji do globalniho error handleru

### 14.2 Tenant izolace

- Vsechny endpointy ctou `x-tenant-id` header
- Fallback na `"demo-tenant"` pokud header chybi
- **Zadna autentizace** -- kdokoliv muze nastavit libovolny `x-tenant-id`
- `presetsStore.js` sanitizuje tenantId: `s.replace(/[^a-zA-Z0-9._-]/g, "_")`
- Storage service pouziva `resolveTenantPath` ktera overuje ze cesta je uvnitr tenant rootu

### 14.3 Path traversal ochrana (Storage)

Trouvrstva ochrana v `storageService.js`:

1. **`sanitizePath(relPath)`** -- blokuje null byty, absolutni cesty, `..` segmenty
2. **`resolveTenantPath(storageRoot, tenantId, relPath)`** -- resolvuje cestu a overuje pres assertWithinRoot
3. **`assertWithinRoot(resolvedPath, allowedRoot)`** -- finalni kontrola ze cesta je uvnitr povoleneho rootu

Vsechny storage endpointy zachytavaji `PATH_TRAVERSAL` error code a vraci 403.

### 14.4 Input validace

| Oblast | Stav |
|--------|------|
| Presets: povinne `file` pole | ANO (kontrola `req.file?.buffer`) |
| Presets: INI typ souboru | ANO (multer fileFilter) |
| Slice: povinny `model` soubor | ANO (kontrola `req.files?.model?.[0]`) |
| Slice: povolene typy souboru | ANO (multer fileFilter: .stl, .obj, .3mf, .amf, .ini) |
| Storage: path sanitizace | ANO (sanitizePath + assertWithinRoot) |
| Storage: newName validace | ANO (blokuje /, \\, ..) |
| JSON body validace | CASTECNA -- presetsStore normalizuje vstupy, ale bez schema validace |
| Velikosti souboru | ANO (multer limits) |
| PresetId / povinne params | ANO (kontrola prazdneho stringu) |

### 14.5 Bezpecnostni problemy

**KRITICKE:**
1. **Zadna autentizace** -- vsechny endpointy jsou verejne pristupne
2. **Tenant spoofing** -- kdokoliv muze nastavit `x-tenant-id` na libovolneho tenanta
3. **Health endpoint lekuje interni cesty** -- `/api/health` vraci `workspaceRoot`, `projectRoot`, `backendRoot`

**VYSOKE:**
4. **Library upload bez file type filtru** -- `libraryUpload` v storageRouter nema fileFilter, povoluje libovolny typ souboru vcetne .exe, .sh, .bat
5. **Filename sanitizace pomoci regex** -- `file.originalname.replace(/[^a-zA-Z0-9\._-]/g, "_")` muze zpusobit kolize nazvu
6. **Chybejici rate limiting** -- zadna ochrana proti brute-force nebo DoS

**STREDNI:**
7. **Slicer timeout neni konfigurovatelny** -- 5 minut je vysoke, utocnik muze zahltit server velkymi modely
8. **Zadny cleanup slicer jobu** -- disk se muze zaplnit
9. **Email routes existuji ale nejsou pripojeny** -- pokud by se pripojily bez auth, umozni to odesilani emailu komukoliv

---

## 15. Konfigurace (env vars)

### 15.1 Env promenne

| Promenna | Default | Popis |
|----------|---------|-------|
| `PORT` | `3001` | Port serveru |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000` | Povolene CORS originy (comma-separated) |
| `SLICER_WORKSPACE_ROOT` | Windows: `C:\modelpricer\tmp`, Linux/Mac: `<tmpdir>/modelpricer` | Root slozka pro slicer joby a presety |
| `PRUSA_SLICER_CMD` | Auto-detect v `tools/prusaslicer` | Cesta k PrusaSlicer CLI executable |
| `PRUSA_DEFAULT_INI` | `""` | Fallback INI profil pokud neni zadny preset |
| `STORAGE_ROOT` | `backend-local/storage` | Root slozka pro file storage (objednavky, knihovna) |

### 15.2 Soubory

- `.env` -- env promenne (v `backend-local/.env`, NENI v gitu)
- `package.json` -- zavislosti a skripty

### 15.3 Auto-detect PrusaSlicer

Funkce `resolveSlicerCmd()`:
1. Zkontroluje `PRUSA_SLICER_CMD` env var
2. Pokud neni nastaven, vola `findPrusaSlicerConsole(projectRoot)` -- hleda v `<projectRoot>/tools/prusaslicer/`

---

## 17. Zname omezeni

### 17.1 Architekturalni omezeni

1. **Monoliticky index.js** -- 484 radku v jednom souboru obsahuje middleware chain, route handlery, helper funkce. Preset a Slice endpointy by mely byt v separatnich route modulech.

2. **Email routes NEPRIPOJENY** -- Router existuje v `src/routes/emailRoutes.js` s 4 endpointy ale neni importovan ani mountovan v `index.js`. Email funkcionalita je nedostupna.

3. **Nekonzistentni response format**:
   - Presets API: `{ ok: true, data: {...} }`
   - Slice API: `{ success: true, jobId: "...", metrics: {...} }` -- pouziva `success` misto `ok`
   - Widget presets: `{ presets: [...], defaultPresetId: "..." }` -- zadny obalujici `ok`/`data`
   - Globalni error handler: `{ success: false, error: "..." }` -- pouziva `success` a `error`
   - Health check: `{ ok: true, service: "...", ... }` -- bez `data` wrapperu

4. **Zadna API verzovani** -- vsechny endpointy jsou pod `/api/` bez version prefixu (napr. `/api/v1/`)

5. **Zadne testy** -- neexistuji unit testy ani integration testy pro backend

### 17.2 Runtime omezeni

6. **Zadny automaticky cleanup** -- slicer joby a trash soubory se akumuluji na disku bez TTL
7. **Vsechny timeouty hardcoded** -- nelze menit bez zmeny kodu
8. **Jednovlaknovy** -- PrusaSlicer slicing blokuje jeden Node.js worker; soucastny slicing vice modelu se serializuje na urovni OS procesu (kazdy spawn je novy proces, ale cekani na odpoved blokuje request)
9. **Zadny request timeout na Express urovni** -- velke modely mohou drzet request po dobu az 5 minut
10. **G-code se nacita cely do pameti** -- pro velke modely muze G-code mit desitky MB

### 17.3 Bezpecnostni omezeni

11. **Zadna autentizace / autorizace** -- viz sekce 14.5
12. **Tenant spoofing** -- viz sekce 14.5
13. **Health endpoint lekuje cesty** -- viz sekce 14.5
14. **Library upload bez filtru typu souboru** -- viz sekce 14.5

### 17.4 Nedokoncene veci (WIP)

15. Komentar v `presetsStore.js`: `"This is a work-in-progress store (CP2 NEDOKONCENO)"`
16. Email service system existuje ale neni zapojen
17. Chybi validace velikosti a rozlozeni 3D modelu pred slicovanim (bounding box check existuje ale nevynucuje limity)

---

## Appendix: Prehledova tabulka vsech endpointu

| # | Metoda | Cesta | Popis | Auth |
|---|--------|-------|-------|------|
| 1 | GET | `/api/health` | Server health check | NE |
| 2 | GET | `/api/health/prusa` | PrusaSlicer dostupnost | NE |
| 3 | GET | `/api/presets` | Seznam presetu | NE |
| 4 | POST | `/api/presets` | Vytvoreni presetu (INI upload) | NE |
| 5 | PATCH | `/api/presets/:id` | Update preset metadat | NE |
| 6 | POST | `/api/presets/:id/default` | Nastaveni default presetu | NE |
| 7 | DELETE | `/api/presets/:id` | Smazani presetu | NE |
| 8 | GET | `/api/widget/presets` | Widget preset list | NE |
| 9 | POST | `/api/slice` | Upload + slice model | NE |
| 10 | POST | `/api/storage/orders` | Vytvoreni order slozky | NE |
| 11 | GET | `/api/storage/browse` | Prohlizeni slozek | NE |
| 12 | GET | `/api/storage/file` | Download souboru | NE |
| 13 | GET | `/api/storage/file/preview` | Nahled souboru | NE |
| 14 | POST | `/api/storage/zip` | ZIP export | NE |
| 15 | POST | `/api/storage/upload` | Upload do knihovny | NE |
| 16 | DELETE | `/api/storage/file` | Soft delete | NE |
| 17 | POST | `/api/storage/restore` | Obnoveni z kosse | NE |
| 18 | GET | `/api/storage/search` | Vyhledavani souboru | NE |
| 19 | POST | `/api/storage/folder` | Vytvoreni slozky | NE |
| 20 | GET | `/api/storage/stats` | Statistiky uloziste | NE |
| 21 | POST | `/api/storage/rename` | Prejmenovat soubor/slozku | NE |
| 22 | POST | `/api/storage/move` | Presun souboru/slozky | NE |
| 23-26 | * | `/api/email/*` | Email sablony, nahled, odeslani, log | NEPRIPOJENO |
