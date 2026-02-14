# Backend Presets & Storage — Dokumentace

> Persistence vrstva pro presets (PrusaSlicer INI profily) a file storage (objednavky, modely,
> gcode) na backendu. File-system based, tenant-scoped, s bezpecnostni vrstvou proti path
> traversal.

---

## 1. Prehled

Backend-local obsahuje dve nezavisle persistence domeny:

1. **Presets Store** (`presetsStore.js`) — CRUD operace nad PrusaSlicer INI konfiguracnimi
   profily. Kazdy tenant ma vlastni sadu presetu ulozenu ve `WORKSPACE_ROOT/presets/{tenantId}/`.
   State se uchovava v `presets.json`, samotne INI soubory v podslozce `files/`.

2. **Storage Service** (`storage/`) — file management pro objednavky, modely, gcode a dalsi
   soubory. Kazdy tenant ma vlastni adresar ve `STORAGE_ROOT/{tenantId}/`. Podporuje
   prochazeni (browse), upload, download, soft delete (trash), obnovu, vyhledavani,
   presun, prejmenovani, ZIP export a statistiky.

**Klicove charakteristiky:**
- **Tenant izolace** — kazda operace je scopovana na tenantId, zadne sdileni dat mezi tenanty
- **Path traversal ochrana** — vsechny vstupy jsou sanitizovany, `../`, null bytes a absolutni cesty blokovany
- **File-system based** — zadna databaze, pouze JSON + INI soubory na disku
- **Graceful error handling** — chybejici soubory/adresare nevyvolaji crash, vraci prazdne vysledky
- **Lock-free design** — zadne file locking, spoliha na single-process model Node.js

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Runtime | Node.js 18+ ESM (`"type": "module"` v package.json) |
| Framework | Express 4.19 |
| Jazyk | JavaScript (ESM, import/export) |
| File I/O | `node:fs/promises` (async), `node:fs` (createReadStream) |
| Hashing | `node:crypto` (SHA256) |
| Upload handling | `multer` 1.4.5 (memory storage pro presets, disk storage pro modely) |
| ZIP | `archiver` 7.0 (optional dependency, dynamicky importovany) |
| ID generace | `nanoid` 5.x (preset ID: `p_{16 znaku}`) |
| Cesty | `node:path` (`path.join`, `path.resolve` — cross-platform) |

### Proc nepouziva databazi

Aktualni architektura je optimalizovana pro lokalni vyvojovy server (`backend-local`).
Produkcni migrace na Firestore/PostgreSQL/SQLite je planovana, ale zatim neimplementovana.
Soubory `presetsStore.js` a `storage/storageService.js` jsou prime kandidaty na extrakci
do repository pattern.

---

## 3. Architektura souboru (~1057 r.)

```
backend-local/
  src/
    presetsStore.js             # 172 r. — Presets CRUD (state JSON + INI soubory)
    index.js                    # 484 r. — Express app, API routing, preset endpointy
    util/
      fsSafe.js                 #  21 r. — Utility: ensureDir, fileExists, toAbs
    storage/
      storageRouter.js          # 426 r. — Express Router pro /api/storage/* endpointy
      storageService.js         # 552 r. — Business logika: browse, trash, search, move, stats
      metadataBuilder.js        #  61 r. — Buildery pro order-meta, file-manifest, pricing-snapshot
      checksumUtil.js           #  22 r. — SHA256 hashing (file + buffer)
```

### Fyzicka storage struktura na disku

```
WORKSPACE_ROOT/                         # env: SLICER_WORKSPACE_ROOT (default: C:\modelpricer\tmp)
  presets/
    {tenantId}/                         # napr. "demo-tenant"
      presets.json                      # State soubor: { presets: [...], defaultPresetId: "..." }
      files/
        p_{nanoid16}.ini                # PrusaSlicer konfigurace pro kazdy preset

  job-{nanoid10}/                       # Slicer job adresare (docasne)
    input/                              # Uploadovane modely (.stl, .obj, .3mf)
    output/                             # Vygenerovany gcode + metriky

STORAGE_ROOT/                           # env: STORAGE_ROOT (default: backend-local/storage/)
  {tenantId}/
    Orders/
      #{orderNumber}__{shortUUID}/
        models/                         # Kopirovane STL/OBJ/3MF soubory
        gcode/                          # Kopirovany G-code z slicer jobu
        presets/                        # Kopirovane INI presets pouzite pri slicovani
        meta/
          order-meta.json               # Zakaznicke info, status, flags
          file-manifest.json            # Seznam souboru s SHA256 checksums
          pricing-snapshot.json         # Cenovy snapshot v okamziku objednavky
    CompanyLibrary/                     # Upload oblast pro firemni soubory
    .trash/                             # Soft-deleted polozky (encodovane nazvy)
    .tmp/                               # Multer docasne soubory
```

---

## 4. Import graf

```
index.js
  |-- presetsStore.js                   # createPresetFromIni, deletePreset, listPresets, ...
  |-- storage/storageRouter.js          # Express Router (mounted na /api/storage)
  |     |-- storage/storageService.js   # createOrderFolder, browseFolder, softDelete, ...
  |           |-- storage/checksumUtil.js    # sha256File, sha256Buffer
  |           |-- storage/metadataBuilder.js # buildOrderMeta, buildFileManifest, buildPricingSnapshot
  |-- util/fsSafe.js                    # ensureDir, fileExists, toAbs
  |-- slicer/runPrusaSlicer.js          # (pouziva getIniPathForPreset z presetsStore)
  |-- slicer/parseGcode.js
  |-- slicer/runPrusaInfo.js
  |-- slicer/parseModelInfo.js
  |-- util/findSlicer.js
```

**Poznamka:** `presetsStore.js` a `storage/` modul jsou vzajemne nezavisle. Jediny spojovaci
bod je `index.js`, ktery pouziva oba systemy. Slicer endpoint v `index.js` pouziva
`getIniPathForPreset()` a `readPresetsState()` pro nalezeni INI souboru presetu.

---

## 6. Datovy model (preset schema, storage paths)

### 6.1 Preset schema (presets.json)

```json
{
  "presets": [
    {
      "id": "p_abc123def456ghij",
      "name": "PLA Standard 0.2mm",
      "order": 10,
      "visibleInWidget": true,
      "material_key": "pla_basic",
      "print_overrides": {
        "infill_percentage": 20,
        "layer_height": 0.2
      },
      "createdAt": "2026-02-13T10:00:00.000Z",
      "updatedAt": "2026-02-13T10:00:00.000Z"
    }
  ],
  "defaultPresetId": "p_abc123def456ghij"
}
```

**Pole:**

| Pole | Typ | Povinne | Popis |
|------|-----|---------|-------|
| `id` | `string` | ANO | Unikatni ID, format `p_{nanoid(16)}` |
| `name` | `string` | ANO | Zobrazovaci nazev (default: "Preset") |
| `order` | `number` | NE | Razeni (0 = default). Vyssi = vyssi priorita |
| `visibleInWidget` | `boolean` | NE | Viditelnost ve verejnem widgetu |
| `material_key` | `string\|null` | NE | Prirazeny material (napr. "pla_basic") |
| `print_overrides` | `object` | NE | Override parametry pro PrusaSlicer |
| `createdAt` | `string` | NE | ISO 8601 timestamp vytvoreni |
| `updatedAt` | `string` | NE | ISO 8601 timestamp posledni zmeny |
| `defaultPresetId` | `string\|null` | — | ID defaultniho presetu (root level pole) |

### 6.2 Normalizace (`normalizeState`)

Funkce `normalizeState()` (radky 154-171 v `presetsStore.js`) zajistuje konzistenci dat pri
cteni. Filtruje presety bez `id`, vynucuje spravne typy a defaultuje chybejici pole. Tato
funkce se vola jak pri cteni (`readPresetsState`), tak pri zapisu (`writePresetsState`).

**Validacni pravidla:**
- `id` — musi byt non-empty string (presety bez id se zahodi)
- `name` — default "Preset" pokud chybi
- `order` — musi byt `Number.isFinite`, jinak 0
- `visibleInWidget` — Boolean coerce
- `material_key` — string nebo null
- `print_overrides` — musi byt non-array object, jinak `{}`

### 6.3 Order metadata schema

**order-meta.json** (generovano `buildOrderMeta`):
```json
{
  "version": 1,
  "orderNumber": "ORD-001",
  "orderFolderId": "uuid-v4",
  "createdAt": "2026-02-13T10:00:00.000Z",
  "customer": { "name": "...", "email": "..." },
  "shippingAddress": { "street": "...", "city": "..." },
  "status": "NEW",
  "modelCount": 2,
  "notes": [],
  "flags": []
}
```

**file-manifest.json** (generovano `buildFileManifest`):
```json
{
  "version": 1,
  "generatedAt": "2026-02-13T10:00:00.000Z",
  "totalFiles": 4,
  "totalSizeBytes": 5242880,
  "files": [
    {
      "type": "model",
      "filename": "part_A.stl",
      "sha256": "a1b2c3...",
      "sizeBytes": 1048576
    }
  ]
}
```

**pricing-snapshot.json** (generovano `buildPricingSnapshot`):
```json
{
  "version": 1,
  "snapshotAt": "2026-02-13T10:00:00.000Z",
  "totals": { "grandTotal": 499, "currency": "CZK" },
  "models": [
    {
      "id": "model-1",
      "filename": "part_A.stl",
      "quantity": 2,
      "material": "PLA",
      "priceBreakdown": { "base": 200, "fees": 99 },
      "slicerData": { "printTimeMinutes": 45 }
    }
  ]
}
```

### 6.4 Tenant ID sanitizace

Funkce `sanitizeTenantId(v)` (radek 149-152 v `presetsStore.js`):
- Orizne whitespace
- Default: `"demo-tenant"` pokud prazdne
- Nahradi vsechny znaky mimo `a-zA-Z0-9._-` podtrzitkem `_`
- Pouziva se v presetsStore pro konstrukci cest

Analogicky v storage routeru: `getTenantId(req)` (radek 37-39 v `storageRouter.js`)
cte `x-tenant-id` header s fallback na `"demo-tenant"`.

---

## 7. API (CRUD operace)

### 7.1 Presets API

Vsechny preset endpointy jsou definovany primo v `index.js` (ne v routeru). Tenant ID
se cte z headeru `x-tenant-id`.

| Metoda | Endpoint | Popis | Request | Response |
|--------|----------|-------|---------|----------|
| `GET` | `/api/presets` | Seznam vsech presetu + default | — | `{ ok, data: { presets, defaultPresetId } }` |
| `POST` | `/api/presets` | Vytvoreni noveho presetu | multipart: `file` (.ini), `name`, `order`, `visibleInWidget` | `{ ok, data: state }` |
| `PATCH` | `/api/presets/:id` | Uprava metadat presetu | JSON body: `{ name?, order?, visibleInWidget?, material_key?, print_overrides? }` | `{ ok, data: state }` |
| `POST` | `/api/presets/:id/default` | Nastaveni defaultniho presetu | — | `{ ok, data: state }` |
| `DELETE` | `/api/presets/:id` | Smazani presetu + INI souboru | — | `{ ok, data: state }` |
| `GET` | `/api/widget/presets` | Widgetovy endoint — jen `visibleInWidget` presety | — | `{ presets, defaultPresetId }` |

**Poznamka k response formatu:** Vsechny preset endpointy vraci cely aktualizovany state
(`{ presets: [...], defaultPresetId }`) v `data`, ne jen zmeneny preset. Frontend tak muze
kompletne nahradit svuj lokalni stav jednim volanim.

### 7.2 Storage API

Vsechny storage endpointy jsou pod `/api/storage/*` (Express Router v `storageRouter.js`).

| Metoda | Endpoint | Popis | Request | Response |
|--------|----------|-------|---------|----------|
| `POST` | `/api/storage/orders` | Vytvoreni order slozky s modely | multipart: `models[]` (max 20), `orderData` (JSON string) | `{ ok, data: { orderFolderId, storagePath, files, timestamp } }` |
| `GET` | `/api/storage/browse` | Prochazeni adresare | query: `path` | `{ ok, data: { path, items } }` |
| `GET` | `/api/storage/file` | Stazeni souboru (attachment) | query: `path` | binary stream s Content-Disposition: attachment |
| `GET` | `/api/storage/file/preview` | Nahled souboru (inline) | query: `path` | binary stream s Content-Disposition: inline |
| `POST` | `/api/storage/zip` | ZIP export vice souboru/slozek | JSON body: `{ paths: [...] }` | binary ZIP stream |
| `POST` | `/api/storage/upload` | Upload do CompanyLibrary | multipart: `files[]` (max 10), `targetPath` | `{ ok, data: { uploaded } }` |
| `DELETE` | `/api/storage/file` | Soft delete (presun do .trash) | JSON body: `{ path }` | `{ ok, data: { trashPath } }` |
| `POST` | `/api/storage/restore` | Obnova z kose | JSON body: `{ trashPath }` | `{ ok, data: { restoredPath } }` |
| `GET` | `/api/storage/search` | Vyhledavani souboru | query: `q` | `{ ok, data: [...results] }` |
| `POST` | `/api/storage/folder` | Vytvoreni slozky | JSON body: `{ path }` | `{ ok, data: { path } }` |
| `GET` | `/api/storage/stats` | Statistiky storage | — | `{ ok, data: { totalFiles, totalFolders, totalSizeBytes, orderCount } }` |
| `POST` | `/api/storage/rename` | Prejmenovani souboru/slozky | JSON body: `{ path, newName }` | `{ ok, data: { newPath } }` |
| `POST` | `/api/storage/move` | Presun souboru/slozky | JSON body: `{ path, destination }` | `{ ok, data: { newPath } }` |

### 7.3 Doplnkove endpointy

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| `GET` | `/api/health` | Healthcheck — port, workspace, cas |
| `GET` | `/api/health/prusa` | PrusaSlicer healthcheck |
| `POST` | `/api/slice` | Slicovani modelu (pouziva presety) |

---

## 9. Data flow

### 9.1 Preset lifecycle

```
[Frontend AdminPresets]
     |
     | POST /api/presets  (multipart: .ini file + metadata)
     v
[index.js] getTenantIdFromReq(req) --> tenantId
     |
     | createPresetFromIni(WORKSPACE_ROOT, tenantId, buffer, meta)
     v
[presetsStore.js]
     |-- ensureTenantPresetDirs()          --> mkdir -p presets/{tenantId}/files/
     |-- readPresetsState()                --> JSON.parse(presets.json) | { presets:[], defaultPresetId:null }
     |-- id = meta.id || `p_${nanoid(16)}`
     |-- fs.writeFile(files/{id}.ini)      --> INI na disk
     |-- state.presets = [...filtered, preset]
     |-- if (!defaultPresetId) set default
     |-- writePresetsState()               --> JSON.stringify --> presets.json
     v
Response: { ok: true, data: updatedState }
```

### 9.2 Slicer INI resolution (pri /api/slice)

```
POST /api/slice (model + optional presetId)
     |
     |-- 1) Explicit presetId z request body?
     |       --> getIniPathForPreset(WS, tenant, presetId)
     |       --> pokud existuje INI soubor: pouzij
     |
     |-- 2) Tenant default preset?
     |       --> readPresetsState() --> state.defaultPresetId
     |       --> getIniPathForPreset(WS, tenant, defaultPresetId)
     |       --> pokud existuje INI soubor: pouzij
     |
     |-- 3) Env DEFAULT_INI?
     |       --> PRUSA_DEFAULT_INI z .env
     |
     |-- 4) Zadny INI nalezen --> 400 error
     v
runPrusaSlicer({ modelPath, iniPath, outDir })
```

### 9.3 Order folder creation

```
POST /api/storage/orders (multipart: models[] + orderData JSON)
     |
     v
[storageRouter.js]
     |-- getTenantId(req) --> tenantId z x-tenant-id header
     |-- getStorageRoot() --> STORAGE_ROOT env | backend-local/storage/
     |-- JSON.parse(req.body.orderData)
     v
[storageService.js] createOrderFolder({ storageRoot, tenantId, orderData, modelFiles })
     |
     |-- orderFolderId = orderData.orderFolderId || crypto.randomUUID()
     |-- folderName = `#{orderNumber}__${shortId}`
     |-- assertWithinRoot(orderDir, tenantRoot)
     |
     |-- mkdir: models/, gcode/, presets/, meta/
     |
     |-- Pro kazdy model file:
     |     |-- sanitize filename (replace non-alphanum)
     |     |-- copyFile(multer_temp --> models/{safeName})
     |     |-- sha256File(dest) --> checksum
     |     |-- push to manifestFiles
     |
     |-- Pro kazdy modelMapping entry:
     |     |-- Kopirovani gcode z slicer jobu (pokud existuje)
     |     |-- Kopirovani preset .ini (pokud existuje)
     |
     |-- Metadata write:
     |     |-- buildOrderMeta(orderData) --> meta/order-meta.json
     |     |-- buildFileManifest(files) --> meta/file-manifest.json
     |     |-- buildPricingSnapshot(orderData) --> meta/pricing-snapshot.json
     |
     v
Response: { orderFolderId, storagePath, files, timestamp }
```

### 9.4 Trash (soft delete / restore)

```
DELETE /api/storage/file  { path: "Orders/#001__abc/models/part.stl" }
     |
     v
softDelete(storageRoot, tenantId, relPath)
     |-- sanitizePath(relPath)
     |-- resolveTenantPath() --> absolutni cesta
     |-- trashDir = {tenantRoot}/.trash/
     |-- trashName = `{ISO_timestamp}___Orders___#001__abc___models___part.stl`
     |                 (lomitka nahrazena za ___)
     |-- fs.rename(sourcePath, trashDest)
     v
{ trashPath: trashName }

POST /api/storage/restore  { trashPath: "2026-02-13T10-00-00-000Z___Orders___..." }
     |
     v
restoreFromTrash(storageRoot, tenantId, trashName)
     |-- split("___") --> [timestamp, ...encodedPath]
     |-- originalRelPath = encodedPath.join("/")
     |-- mkdir parent dir (pokud smazano)
     |-- fs.rename(trashPath, restoreDest)
     v
{ restoredPath: originalRelPath }
```

---

## 10. Error handling

### 10.1 Chybove kody (error codes)

Vsechny endpointy pouzivaji jednotny format `{ ok: false, errorCode, message }`.

**Presets error codes:**

| Code | HTTP | Pricina |
|------|------|---------|
| `MP_PRESETS_LIST_FAILED` | 500 | Chyba pri cteni presets.json |
| `MP_BAD_REQUEST` | 400 | Chybejici povinne pole (file, preset id) |
| `MP_PRESET_UPLOAD_FAILED` | 500 | Chyba pri zapisu INI / state |
| `MP_PRESET_PATCH_FAILED` | 500 | Chyba pri aktualizaci metadat |
| `MP_NOT_FOUND` | 404 | Preset s danym ID neexistuje |
| `MP_PRESET_DEFAULT_FAILED` | 500 | Chyba pri nastaveni defaultu |
| `MP_PRESET_DELETE_FAILED` | 500 | Chyba pri mazani |

**Storage error codes:**

| Code | HTTP | Pricina |
|------|------|---------|
| `MP_PATH_TRAVERSAL` | 403 | Detekovany pokus o path traversal (`..`, null byte, absolutni cesta) |
| `MP_BAD_REQUEST` | 400 | Chybejici parametr nebo pokus stahnout adresar |
| `MP_NOT_FOUND` | 404 | Soubor/slozka neexistuje (ENOENT) |
| `MP_STORAGE_ORDER_FAILED` | 500 | Chyba pri vytvareni order slozky |
| `MP_BROWSE_FAILED` | 500 | Chyba pri prochazeni adresare |
| `MP_DOWNLOAD_FAILED` | 500 | Chyba pri stahovani souboru |
| `MP_PREVIEW_FAILED` | 500 | Chyba pri nahledu souboru |
| `MP_ZIP_UNAVAILABLE` | 500 | `archiver` package neni nainstalovany |
| `MP_ZIP_FAILED` | 500 | Chyba pri tvorbe ZIP archivu |
| `MP_UPLOAD_FAILED` | 500 | Chyba pri uploadu do CompanyLibrary |
| `MP_DELETE_FAILED` | 500 | Chyba pri soft delete |
| `MP_RESTORE_FAILED` | 500 | Chyba pri obnove z kose |
| `MP_SEARCH_FAILED` | 500 | Chyba pri vyhledavani |
| `MP_FOLDER_FAILED` | 500 | Chyba pri vytvareni slozky |
| `MP_STATS_FAILED` | 500 | Chyba pri zjistovani statistik |
| `MP_RENAME_FAILED` | 500 | Chyba pri prejmenovani |
| `MP_MOVE_FAILED` | 500 | Chyba pri presunu |

### 10.2 Graceful degradace

**presetsStore.js:**
- `readPresetsState()` — pokud `presets.json` neexistuje nebo je nevalidni JSON, vraci
  `{ presets: [], defaultPresetId: null }` (radky 29-36, `catch` blok)
- `getIniPathForPreset()` — pokud INI soubor neexistuje, vraci prazdny string `""` (ne error)
- `deletePreset()` — pokud INI soubor neexistuje pri mazani, tichy catch (radek 133)
- `normalizeState()` — filtruje presety s prazdnym `id`, defaultuje chybejici pole

**storageService.js:**
- `browseFolder()` — ENOENT vraci `{ path, items: [] }` misto erroru
- `searchFiles()` — chyba pri `readdir` v podceste tichy skip (`catch { return }`)
- `getStats()` — chyba pri `stat` souboru tichy skip, orderCount fallback na 0
- `createOrderFolder()` — gcode/preset kopirovani je v try/catch, failure neni kriticka

### 10.3 Multer error handling

**Preset upload** (`index.js` radky 93-101):
- Limit: 5 MB na soubor
- File filter: pouze `.ini` soubory
- Memory storage (buffer v RAM)

**Storage order upload** (`storageRouter.js` radky 55-64):
- Limit: 250 MB na soubor
- Max 20 souboru v jednom requestu
- File filter: `.stl`, `.obj`, `.3mf`, `.amf`, `.step`, `.stp`
- Disk storage do `.tmp/`, po zpracovani cleanup

**Library upload** (`storageRouter.js` radky 68-71):
- Limit: 250 MB na soubor
- Max 10 souboru
- Bez file type filtru (libovolne soubory)

---

## 14. Bezpecnost (tenant izolace, path traversal)

### 14.1 Tenant izolace

- Kazda operace zacina extrakcnim `getTenantId(req)` / `getTenantIdFromReq(req)`
  z headeru `x-tenant-id`
- Tenant ID se sanitizuje: `sanitizeTenantId()` nahrazuje nebezpecne znaky podtrzitkem,
  default `"demo-tenant"`
- Vsechny cesty jsou konstruovany pres `path.join(root, tenantId, ...)` — tenant nemuze
  pristoupit k datum jineho tenanta

**Varovani:** Aktualne neexistuje autentizace ani autorizace headeru `x-tenant-id`. Jakykoliv
klient muze nastavit libovolny tenant. Toto je akceptovatelne pro lokalni dev server, ale
NESMI se nasadit do produkce bez auth vrstvy.

### 14.2 Path traversal ochrana

Tri urovne ochrany v `storageService.js`:

1. **`sanitizePath(relPath)`** (radky 32-48):
   - Blokuje null bytes (`\0`)
   - Normalizuje separatory (`\` na `/`)
   - Blokuje absolutni cesty
   - Blokuje `..` segmenty v ceste
   - Vraci sanitizovany relativni string

2. **`assertWithinRoot(resolvedPath, allowedRoot)`** (radky 19-25):
   - `path.resolve()` obe cesty
   - Overuje ze resolved cesta zacina na `allowedRoot + path.sep` (nebo je shodna)
   - Haze error s `code: "PATH_TRAVERSAL"` pokud ne

3. **`resolveTenantPath(storageRoot, tenantId, relPath)`** (radky 57-63):
   - Kombinuje oba predchozi: sanitize + assert
   - Vytvari absolutni cestu v ramci tenant rootu

**Filename sanitizace:**
- Upload model files: `file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")` (radek 108 storageService, radek 276 storageRouter)
- Zachovava priponu, ale nahradi specialni znaky podtrzitkem

### 14.3 Trash name validace

`restoreFromTrash()` (radky 310-339) validuje trash name:
- Nesmi obsahovat `..`, `/`, `\`
- `assertWithinRoot` na trash cestu
- `assertWithinRoot` na cilovou cestu (dekodovana z trash name)

### 14.4 Rename/Move validace

- `renameItem()` — `newName` nesmi obsahovat `/`, `\`, `..`
- `moveItem()` — obe cesty (source + destination) prochazi `resolveTenantPath` + `assertWithinRoot`

### 14.5 CORS

Povolene originy (defaultne):
- `http://localhost:5173` (Vite dev)
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- Nebo vlastni pres env `CORS_ORIGINS` (comma-separated)
- `*` povoli vse

---

## 15. Konfigurace

### 15.1 Environment promenne

| Promenna | Default | Popis |
|----------|---------|-------|
| `PORT` | `3001` | Port Express serveru |
| `SLICER_WORKSPACE_ROOT` | `C:\modelpricer\tmp` (Win) / `/tmp/modelpricer` (Linux) | Root pro slicer joby a preset soubory |
| `STORAGE_ROOT` | `backend-local/storage/` | Root pro tenant file storage |
| `PRUSA_SLICER_CMD` | auto-detect | Cesta k PrusaSlicer CLI |
| `PRUSA_DEFAULT_INI` | `""` | Fallback INI profil pokud tenant nema presety |
| `CORS_ORIGINS` | `localhost:5173,localhost:3000` | Povolene CORS originy |

### 15.2 Limity

| Co | Limit | Kde |
|----|-------|-----|
| Preset INI velikost | 5 MB | `index.js:95` |
| Model file velikost | 250 MB | `storageRouter.js:57`, `index.js:444` |
| Modely na objednavku | 20 | `storageRouter.js:75` |
| Library upload max files | 10 | `storageRouter.js:264` |
| Search max results | 50 | `storageService.js:351` |
| JSON body limit | 2 MB | `index.js:46` |

### 15.3 Podporovane formaty

**Model upload (order creation):** `.stl`, `.obj`, `.3mf`, `.amf`, `.step`, `.stp`

**Preset upload:** `.ini`

**Slicer upload:** `.stl`, `.obj`, `.3mf`, `.amf`, `.ini`

**MIME type mapping (download/preview):** `.stl`, `.obj`, `.3mf`, `.gcode`, `.ini`, `.json`,
`.png`, `.jpg`, `.jpeg`, `.pdf`, `.zip`, `.txt`

---

## 17. Zname omezeni

### 17.1 Zadne atomic writes

`presetsStore.js` pouziva `fs.writeFile()` primo na cilovy soubor (radek 42). Pokud proces
spadne behem zapisu, `presets.json` muze byt prazdny nebo corrupted. Spravne reseni:
zapis do temp souboru + `fs.rename()` (atomic na stejnem filesystem).

`fsSafe.js` aktualne obsahuje pouze `ensureDir`, `fileExists` a `toAbs` — zadne atomic
write utility. Toto je budouci TODO.

### 17.2 Zadne file locking

Pokud by bezely dva instance backend procesu soucasne (napr. za load balancerem), mohou
nastat race conditions pri zapisu `presets.json`. Aktualne se spoliha na single-process
Node.js model.

### 17.3 Read-modify-write race

Vsechny CRUD operace v `presetsStore.js` ctou state, modifikuji v pameti a zapisuji zpet.
Pri rychlem poradi dvou requestu (napr. dva paralelni DELETE) muze druhy request prepsat
zmeny prvniho. Reseni: file lock nebo mutex, nebo migrace na databazi.

### 17.4 Zadne schema versioning

`presets.json` nema pole `version`. Pokud se schema zmeni, neexistuje migration mechanismus.
`normalizeState()` castecne kompenzuje (defaultuje chybejici pole), ale neni to plnohodnotna
migrace.

### 17.5 WORKSPACE_ROOT vs STORAGE_ROOT dualita

Systemy presets a storage pouzivaji ruzne rooty:
- **Presets:** `SLICER_WORKSPACE_ROOT/presets/{tenantId}/`
- **Storage:** `STORAGE_ROOT/{tenantId}/`

Toto muze byt matouci a vyzaduje to peclive nastaveni env promennych.

### 17.6 Zadna autentizace

Header `x-tenant-id` se neoveruje voci zadnemu auth systemu. Jakykoliv klient muze
pouzit libovolne tenant ID. Produkcni nasazeni vyzaduje auth middleware.

### 17.7 Trash name encoding krehkost

`softDelete` koduje cestu nahrazenim `/` za `___`. Pokud nazev souboru sam obsahuje
`___`, dekodovani v `restoreFromTrash` muze byt nekorektni (split bude mit vic casti
nez ocekavano).

### 17.8 Gcode kopirovani spoliha na slicer workspace layout

`createOrderFolder()` (radky 127-169 v `storageService.js`) predpoklada konkretni adresar
strukturu slicer jobu pro nalezeni gcode a preset souboru. Pokud se struktura slicer jobu
zmeni, kopirovani tichy selze (catch blok, ne kriticka chyba).

### 17.9 Multer temp soubory pri chybe

Pokud request selze po uploadu ale pred zpracovanim, multer temp soubory v `.tmp/` zustanou
na disku. Cleanup ve storageRouter (`fs.unlink(file.path).catch(() => {})`) se provadi
pouze v uspesne vetvi order endpointu. Ostatni endpointy (upload) mazou temp po copyFile.

### 17.10 Rekurzivni walk pro search a stats

`searchFiles()` a `getStats()` pouzivaji rekurzivni walk pres vsechny soubory tenanta.
Pro velke storage muze byt pomale. `maxResults` (default 50) limituje search, ale ne stats.
