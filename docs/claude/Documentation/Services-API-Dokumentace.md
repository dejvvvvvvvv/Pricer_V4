# Services & API Klienty -- Dokumentace

> 3 frontend API service moduly: `presetsApi`, `slicerApi`, `storageApi`.
> Vsechny komunikuji s backend-local (Express na portu 3001) pres Vite dev proxy `/api -> http://127.0.0.1:3001`.

---

## 1. Prehled

ModelPricer frontend pouziva tri dedicatedne API klientske moduly umistene v `src/services/`:

| Service | Soubor | Ucel | Pocet exportu |
|---------|--------|------|---------------|
| **presetsApi** | `src/services/presetsApi.js` | CRUD operace nad slicer presety, widget preset listing | 7 (+ 2 interni helpery) |
| **slicerApi** | `src/services/slicerApi.js` | Upload 3D modelu a spusteni slicingu pres PrusaSlicer CLI | 1 |
| **storageApi** | `src/services/storageApi.js` | Sprava souboru: objednavky, browse, download, upload, trash, ZIP | 13 |

**Spolecne rysy:**
- Vsechny pouzivaji nativni `fetch` API (zadny axios)
- Vsechny posilaji `x-tenant-id` header pro multi-tenant izolaci
- Vsechny komunikuji pres relativni URL `/api/*` (Vite proxy v dev modu)
- Zadny z nich nepouziva retry logiku (single attempt)

---

## 2. Technologie

### 2.1 HTTP klient

Vsechny tri service moduly pouzivaji **nativni `fetch` API** (browser built-in). Zadna externi zavislost typu axios/ky/got neni potreba.

### 2.2 Error handling pattern

Kazdy service ma odlisny pristup k error handlingu:

| Service | Pattern | Vraci | Throws? |
|---------|---------|-------|---------|
| **presetsApi** | Result object | `{ ok: true, data }` nebo `{ ok: false, errorCode, message }` | Ne (nikdy nehrozi) |
| **slicerApi** | Throw on error | Raw JSON z backendu | Ano (Error pri selhani) |
| **storageApi** | Throw on error | Rozbaleny `data` z `{ ok: true, data }` | Ano (Error pri selhani) |

**Dulezity rozdil:** `presetsApi` nikdy nevyhodi vyjimku -- vzdy vraci Result objekt s `ok: true/false`. Ostatni dva servicy vyhazuji Error pri jakemkoli selhani.

### 2.3 Serialization

- **JSON body**: `JSON.stringify()` + `Content-Type: application/json` (automaticky v presetsApi pres apiFetch)
- **Multipart**: `FormData` API pro file upload (presetsApi upload, slicerApi slice, storageApi orders/upload)
- **Query params**: `URLSearchParams` pro GET requesty (storageApi browse/download/search)

---

## 3. Architektura souboru

```
src/services/
  presetsApi.js     180 radku — Preset CRUD + widget listing
  slicerApi.js       99 radku — Model slicing
  storageApi.js     236 radku — File management (orders, browse, trash, ZIP)
```

### Vnitrni struktura kazdeho souboru

**presetsApi.js:**
```
getTenantId()          — tenant ID z localStorage (vlastni kopie)
tryJson()              — safe JSON.parse helper (interni)
apiFetch()             — centralni fetch wrapper s tenant header + error normalizace
listPresets()          — GET /api/presets
uploadPreset()         — POST /api/presets (multipart)
patchPreset()          — PATCH /api/presets/:id
deletePreset()         — DELETE /api/presets/:id
setDefaultPreset()     — POST /api/presets/:id/default
fetchWidgetPresets()   — GET /api/widget/presets
```

**slicerApi.js:**
```
tryJson()              — safe JSON.parse helper (interni)
sliceModelLocal()      — POST /api/slice (multipart + AbortController timeout)
```

**storageApi.js:**
```
tenantHeaders()        — helper pro x-tenant-id header (interni)
handleResponse()       — centralni response parser s error handling (interni)
saveOrderFiles()       — POST /api/storage/orders (multipart)
browseFolder()         — GET /api/storage/browse
downloadFile()         — GET /api/storage/file (blob)
getPreviewUrl()        — URL builder (synchronni)
getDownloadUrl()       — URL builder (synchronni)
searchFiles()          — GET /api/storage/search
createZip()            — POST /api/storage/zip (blob + auto-download)
uploadFiles()          — POST /api/storage/upload (multipart)
deleteFile()           — DELETE /api/storage/file
restoreFile()          — POST /api/storage/restore
createFolder()         — POST /api/storage/folder
renameItem()           — POST /api/storage/rename
moveItem()             — POST /api/storage/move
getStats()             — GET /api/storage/stats
```

---

## 4. Import graf

### 4.1 Externi zavislosti (importy zevnitr services)

| Service | Importuje z | Co |
|---------|-------------|----|
| **presetsApi** | *(zadny externi import)* | Ma vlastni `getTenantId()` kopii |
| **slicerApi** | `../utils/adminTenantStorage` | `getTenantId` |
| **storageApi** | `../utils/adminTenantStorage` | `getTenantId` |

**Poznamka k getTenantId duplicite:** `presetsApi.js` ma vlastni implementaci `getTenantId()` ktera cte `localStorage.getItem('modelpricer:tenant_id')` -- je to KOPIE logiky z `adminTenantStorage.js`. Ostatni dva servicy importuji sdilenou verzi z `adminTenantStorage`. Viz sekce 17 (Zname omezeni).

### 4.2 Kdo importuje services (consumers)

**presetsApi.js — 4 consumeri:**
| Consumer | Importovane funkce |
|----------|--------------------|
| `src/pages/admin/AdminPresets.jsx` | `deletePreset, listPresets, patchPreset, setDefaultPreset, uploadPreset` |
| `src/pages/test-kalkulacka/index.jsx` | `fetchWidgetPresets` |
| `src/pages/test-kalkulacka-white/index.jsx` | `fetchWidgetPresets` |
| `src/pages/widget-kalkulacka/index.jsx` | `fetchWidgetPresets` |

**slicerApi.js — 3 consumeri:**
| Consumer | Importovane funkce |
|----------|--------------------|
| `src/pages/test-kalkulacka/index.jsx` | `sliceModelLocal` |
| `src/pages/test-kalkulacka-white/index.jsx` | `sliceModelLocal` |
| `src/pages/widget-kalkulacka/index.jsx` | `sliceModelLocal` |

**storageApi.js — 6 consumeru:**
| Consumer | Importovane funkce |
|----------|--------------------|
| `src/hooks/useStorageBrowser.js` | `browseFolder, searchFiles, deleteFile, restoreFile, createFolder, renameItem, uploadFiles` |
| `src/pages/admin/AdminModelStorage.jsx` | `downloadFile, createZip, getDownloadUrl` |
| `src/pages/admin/components/storage/PreviewPanel.jsx` | `getPreviewUrl, getDownloadUrl` |
| `src/pages/admin/components/storage/FolderTreePanel.jsx` | `browseFolder` |
| `src/pages/admin/components/orders/TabItemsFiles.jsx` | `getDownloadUrl, createZip` |
| `src/pages/test-kalkulacka/components/CheckoutForm.jsx` | `saveOrderFiles` |

---

## 7. API -- Detailni popis kazdeho service

### 7.1 presetsApi.js

Centralni API klient pro Presets modul. Pouziva vlastni `apiFetch()` wrapper ktery:
- Pridava `x-tenant-id` header
- Nastavuje `Accept: application/json`
- Automaticky nastavuje `Content-Type: application/json` pro string body
- Normalizuje error odpovedi z backendu (podporuje `{ok:false}`, `{success:false}`, i HTTP error bez struktury)
- Nikdy nevyhodi vyjimku -- vzdy vraci `ApiResult` objekt

#### Typy

```javascript
/** @typedef {{ ok: true, data: any }} ApiOk */
/** @typedef {{ ok: false, errorCode: string, message: string, status?: number, details?: any }} ApiErr */
/** @typedef {ApiOk | ApiErr} ApiResult */
```

#### getTenantId()

```
Export: named
Signature: getTenantId() => string
```

Cte tenant ID z `localStorage.getItem('modelpricer:tenant_id')`. Fallback na `'demo-tenant'`. Obalen v try/catch pro SSR scenare kde localStorage neni dostupny.

#### apiFetch(path, options?)

```
Export: named
Signature: apiFetch(path: string, options?: RequestInit) => Promise<ApiResult>
```

Centralni fetch wrapper. Pridava `x-tenant-id` header a normalizuje odpovedi do `ApiResult` formatu.

**Error normalizace (v poraddi priority):**
1. Backend vraci `{ ok: false, errorCode, message }` -- pouzije se primo
2. HTTP status != 200-299 -- vytvori se `{ ok: false, errorCode: "HTTP_{status}" }`
3. Backend vraci `{ success: false }` -- konvertuje na `{ ok: false }`
4. Network error (fetch selze) -- `{ ok: false, errorCode: "NETWORK_ERROR" }`

**Uspech:**
1. Backend vraci `{ ok: true, data: ... }` -- vrati se `{ ok: true, data: json.data }`
2. Jina JSON odpoved -- vrati se `{ ok: true, data: celaCelaOdpoved }`
3. Non-JSON odpoved -- vrati se `{ ok: true, data: text }`

#### listPresets()

```
Export: named
Signature: listPresets() => Promise<ApiResult>
Endpoint: GET /api/presets
Backend handler: index.js radek 103
```

Vrati vsechny presety pro aktualniho tenanta.

**Response (ok: true):**
```json
{
  "ok": true,
  "data": {
    "presets": [
      {
        "id": "abc123",
        "name": "PLA Standard",
        "order": 1,
        "visibleInWidget": true,
        "createdAt": "2026-01-15T10:30:00Z"
      }
    ],
    "defaultPresetId": "abc123"
  }
}
```

#### uploadPreset(file, meta?)

```
Export: named
Signature: uploadPreset(file: File, meta?: { name?: string, order?: number, visibleInWidget?: boolean }) => Promise<ApiResult>
Endpoint: POST /api/presets (multipart/form-data)
Backend handler: index.js radek 113
```

Nahraje INI soubor jako novy preset. Field name je `"file"`.

**Validace na klientovi:**
- `file` musi byt instance `File` -- jinak vraci `{ ok: false, errorCode: "MP_BAD_REQUEST" }` bez HTTP pozadavku

**Request (FormData):**
| Field | Typ | Povinne | Popis |
|-------|-----|---------|-------|
| `file` | File | Ano | INI soubor (max 5MB na backendu) |
| `name` | string | Ne | Display name presetu |
| `order` | number | Ne | Poradi pro zobrazeni |
| `visibleInWidget` | "true"/"false" | Ne | Viditelnost ve widgetu |

#### patchPreset(id, patch)

```
Export: named
Signature: patchPreset(id: string, patch: { name?: string, order?: number, visibleInWidget?: boolean }) => Promise<ApiResult>
Endpoint: PATCH /api/presets/:id
Backend handler: index.js radek 133
```

Aktualizuje metadata presetu. ID je URL-encoded v ceste.

**Validace na klientovi:**
- `id` musi byt truthy -- jinak vraci `{ ok: false, errorCode: "MP_BAD_REQUEST" }` bez HTTP pozadavku

#### deletePreset(id)

```
Export: named
Signature: deletePreset(id: string) => Promise<ApiResult>
Endpoint: DELETE /api/presets/:id
Backend handler: index.js radek 161
```

Smaze preset vcetne INI souboru na disku.

#### setDefaultPreset(id)

```
Export: named
Signature: setDefaultPreset(id: string) => Promise<ApiResult>
Endpoint: POST /api/presets/:id/default
Backend handler: index.js radek 147
```

Nastavi preset jako default pro slicing (pouzije se kdyz request na /api/slice neobsahuje presetId).

#### fetchWidgetPresets()

```
Export: named
Signature: fetchWidgetPresets() => Promise<ApiResult>
Endpoint: GET /api/widget/presets
Backend handler: index.js radek 176
```

Vrati presety filtrovane pro widget (jen ty s `visibleInWidget: true`), serazene podle `order` desc.

**Response (ok: true):**
```json
{
  "ok": true,
  "data": {
    "presets": [...],
    "defaultPresetId": "abc123"
  }
}
```

**Poznamka:** Tento endpoint ma odlisny response format nez ostatni -- backend vraci primo `{ presets, defaultPresetId }` BEZ obalovaci `{ ok: true, data }` struktury. `apiFetch` to zpracuje jako "jina JSON odpoved" a vraci `{ ok: true, data: { presets, defaultPresetId } }`.

---

### 7.2 slicerApi.js

Jednoduchy service pro odeslani 3D modelu na backend ke slicovani. Na rozdil od presetsApi **vyhazuje Error** pri jakemkoli selhani.

#### Typy

```javascript
/** @typedef {{
 *  jobId?: string,
 *  jobDir?: string,
 *  outGcodePath?: string,
 *  metrics?: {
 *    estimatedTimeSeconds?: number,
 *    filamentGrams?: number,
 *    filamentMm?: number,
 *  },
 *  modelInfo?: {
 *    sizeMm?: { x?: number, y?: number, z?: number },
 *    volumeMm3?: number,
 *  },
 *  ok?: boolean,
 *  success?: boolean,
 *  error?: string,
 *  message?: string,
 * }} SliceResponse */
```

#### sliceModelLocal(modelFile, opts?)

```
Export: named
Signature: sliceModelLocal(modelFile: File, opts?: { timeoutMs?: number, presetId?: string | null, tenantId?: string }) => Promise<SliceResponse>
Endpoint: POST /api/slice (multipart/form-data)
Backend handler: index.js radek 232
```

Odesle 3D model (STL/OBJ/3MF) na backend pro slicovani pres PrusaSlicer CLI.

**Parametry:**

| Parametr | Typ | Default | Popis |
|----------|-----|---------|-------|
| `modelFile` | File | *(povinne)* | 3D model soubor |
| `opts.timeoutMs` | number | `120000` (2 min) | Timeout pro AbortController |
| `opts.presetId` | string/null | `null` | ID presetu k pouziti |
| `opts.tenantId` | string | z `getTenantId()` | Override tenant ID |

**Request (FormData):**
| Field | Typ | Povinne | Popis |
|-------|-----|---------|-------|
| `model` | File | Ano | 3D model soubor (max 250MB) |
| `presetId` | string | Ne | ID presetu; pokud chybi, backend pouzije default |

**Headers:**
- `x-tenant-id`: tenant identifikator

**Response (success):**
```json
{
  "success": true,
  "jobId": "job-abc1234567",
  "jobDir": "C:\\modelpricer\\tmp\\job-abc1234567",
  "outGcodePath": "...",
  "durationMs": 12345,
  "slicerCmd": "...",
  "iniUsed": "...",
  "usedPreset": "preset-id-or-null",
  "modelUsed": "model.stl",
  "modelInfo": {
    "sizeMm": { "x": 50, "y": 30, "z": 20 },
    "volumeMm3": 1234.56
  },
  "metrics": {
    "estimatedTimeSeconds": 3600,
    "filamentGrams": 15.2,
    "filamentMm": 5100
  }
}
```

**Error handling:**
| Situace | Chovani |
|---------|---------|
| `modelFile` neni File | `throw new Error('sliceModelLocal: modelFile must be a File')` |
| AbortController timeout | `throw new Error('Request timeout after {timeoutMs} ms')` |
| HTTP status != ok | `throw new Error('Backend error ({status}): {message}')` |
| Non-JSON response | `throw new Error('Backend returned non-JSON response')` |
| Network error | Nativni fetch Error (neprepsan) |

**Timeout mechanismus:**
- Pouziva `AbortController` s `setTimeout`
- Default 120 sekund, konfigurovatelny pres `opts.timeoutMs`
- `AbortError` je normalizovany na citelnou zpravu
- `clearTimeout` v `finally` bloku (spravny cleanup)

---

### 7.3 storageApi.js

Nejrozsahlejsi service pro spravu souboru na backend-local filesystem. Pokryva CRUD operace nad soubory, slozkami, objednavkami, trash a ZIP export.

**Spolecna infra:**
- `BASE = "/api/storage"` — prefix vsech endpointu
- `tenantHeaders()` — vraci `{ "x-tenant-id": getTenantId() }`
- `handleResponse(res)` — centralni response parser:
  1. Overuje `Content-Type: application/json`
  2. Parsuje JSON
  3. Kontroluje `res.ok` a `data.ok`
  4. Vraci rozbaleny `data.data` (ne celou obalku)
  5. Vyhazuje Error s citelnou zpravou pri selhani

#### saveOrderFiles(orderData, modelFiles)

```
Export: named
Signature: saveOrderFiles(orderData: object, modelFiles: File[]) => Promise<{ orderFolderId, storagePath, files, timestamp }>
Endpoint: POST /api/storage/orders (multipart/form-data)
Backend handler: storageRouter.js radek 75
```

Ulozi objednavkove soubory vcetne 3D modelu do tenant-scoped slozky.

**Request (FormData):**
| Field | Typ | Povinne | Popis |
|-------|-----|---------|-------|
| `orderData` | string (JSON) | Ano | Serializovany order objekt |
| `models` | File[] | Ne | Pole 3D modelu (max 20 souboru, 250MB/ks) |

#### browseFolder(folderPath?)

```
Export: named
Signature: browseFolder(folderPath?: string) => Promise<{ path, items }>
Endpoint: GET /api/storage/browse?path={folderPath}
Backend handler: storageRouter.js radek 108
```

Vrati obsah slozky. Specialni cesty `.trash` a `Trash` vraci obsah kose.

#### downloadFile(filePath)

```
Export: named
Signature: downloadFile(filePath: string) => Promise<string>
Endpoint: GET /api/storage/file?path={filePath}
Backend handler: storageRouter.js radek 130
```

Stahne soubor jako blob a vytvori Object URL (`URL.createObjectURL`). Volajici kod zodpovida za `URL.revokeObjectURL()` po pouziti.

**POZOR:** Neprochazi pres `handleResponse()` -- manualni error handling primo v metode.

#### getPreviewUrl(filePath)

```
Export: named
Signature: getPreviewUrl(filePath: string) => string
Synchronni (zadny fetch)
```

Vrati URL pro inline preview souboru: `/api/storage/file/preview?path={filePath}`.

#### getDownloadUrl(filePath)

```
Export: named
Signature: getDownloadUrl(filePath: string) => string
Synchronni (zadny fetch)
```

Vrati URL pro download souboru: `/api/storage/file?path={filePath}`.

#### searchFiles(query)

```
Export: named
Signature: searchFiles(query: string) => Promise<Array>
Endpoint: GET /api/storage/search?q={query}
Backend handler: storageRouter.js radek 338
```

Fulltextove hledani souboru podle nazvu v ramci tenant storage.

#### createZip(paths)

```
Export: named
Signature: createZip(paths: string[]) => Promise<void>
Endpoint: POST /api/storage/zip
Backend handler: storageRouter.js radek 213
```

Vytvori ZIP archiv z vybranych cest a automaticky spusti stahovani v prohlizeci. Vytvori docasny `<a>` element, klikne na nej a po stazeni uklidi DOM + revokuje Object URL.

**POZOR:** Neprochazi pres `handleResponse()` -- manualni blob handling.

**Request (JSON):**
```json
{ "paths": ["Orders/ORD-001/model.stl", "CompanyLibrary/test.obj"] }
```

#### uploadFiles(files, targetPath?)

```
Export: named
Signature: uploadFiles(files: File[], targetPath?: string) => Promise<{ uploaded: Array }>
Endpoint: POST /api/storage/upload (multipart/form-data)
Backend handler: storageRouter.js radek 264
Default targetPath: "CompanyLibrary"
```

Nahraje soubory do Company Library nebo specifikovane cilove slozky.

**Request (FormData):**
| Field | Typ | Povinne | Popis |
|-------|-----|---------|-------|
| `targetPath` | string | Ne | Cilova slozka (default: "CompanyLibrary") |
| `files` | File[] | Ano | Soubory k nahrání (max 10 na request, 250MB/ks) |

#### deleteFile(filePath)

```
Export: named
Signature: deleteFile(filePath: string) => Promise<{ trashPath }>
Endpoint: DELETE /api/storage/file
Backend handler: storageRouter.js radek 300
```

Soft-delete: presune soubor/slozku do `.trash` slozky (neodstrani permanentne).

**Request (JSON):**
```json
{ "path": "CompanyLibrary/model.stl" }
```

#### restoreFile(trashPath)

```
Export: named
Signature: restoreFile(trashPath: string) => Promise<{ restoredPath }>
Endpoint: POST /api/storage/restore
Backend handler: storageRouter.js radek 319
```

Obnovi soubor z kose zpet na puvodni misto.

**Request (JSON):**
```json
{ "trashPath": "model.stl__1707123456789" }
```

#### createFolder(folderPath)

```
Export: named
Signature: createFolder(folderPath: string) => Promise<{ path }>
Endpoint: POST /api/storage/folder
Backend handler: storageRouter.js radek 355
```

Vytvori novou slozku.

**Request (JSON):**
```json
{ "path": "CompanyLibrary/SubFolder" }
```

#### renameItem(filePath, newName)

```
Export: named
Signature: renameItem(filePath: string, newName: string) => Promise<{ newPath }>
Endpoint: POST /api/storage/rename
Backend handler: storageRouter.js radek 387
```

Prejmenovava soubor nebo slozku.

**Request (JSON):**
```json
{ "path": "CompanyLibrary/old-name.stl", "newName": "new-name.stl" }
```

#### moveItem(filePath, destination)

```
Export: named
Signature: moveItem(filePath: string, destination: string) => Promise<{ newPath }>
Endpoint: POST /api/storage/move
Backend handler: storageRouter.js radek 407
```

Presune soubor nebo slozku do jine slozky.

**Request (JSON):**
```json
{ "path": "Orders/model.stl", "destination": "CompanyLibrary" }
```

#### getStats()

```
Export: named
Signature: getStats() => Promise<{ totalFiles, totalFolders, totalSizeBytes, orderCount }>
Endpoint: GET /api/storage/stats
Backend handler: storageRouter.js radek 373
```

Vrati statistiky storage pro aktualniho tenanta.

---

## 10. Error handling

### 10.1 presetsApi -- Result pattern (bezpecny)

`apiFetch()` **nikdy nevyhodi vyjimku**. Vsechny chyby jsou zachyceny a vraceny jako `{ ok: false, ... }`:

| Situace | errorCode | message |
|---------|-----------|---------|
| Backend vraci `{ ok: false }` | z backendu | z backendu |
| HTTP 4xx/5xx | `HTTP_{status}` nebo z backendu | z backendu nebo "Request failed" |
| Backend vraci `{ success: false }` | `API_ERROR` | z backendu |
| Network error (unreachable) | `NETWORK_ERROR` | "Network error: backend unreachable" |
| Klientska validace (chybi file/id) | `MP_BAD_REQUEST` | Specificka zprava |

**Pouziti v consumeru:**
```javascript
const result = await listPresets();
if (!result.ok) {
  console.error(result.errorCode, result.message);
  return;
}
// result.data je k dispozici
```

### 10.2 slicerApi -- Throw pattern

`sliceModelLocal()` **vyhodi Error** pri kazdem selhani:

| Situace | Error message |
|---------|---------------|
| file neni File instance | `sliceModelLocal: modelFile must be a File` |
| AbortController timeout | `Request timeout after {timeoutMs} ms` |
| HTTP error | `Backend error ({status}): {message}` (orez na 500 znaku) |
| Non-JSON response | `Backend returned non-JSON response` |
| Network error | Nativni fetch error (neprepsan) |

**Pouziti v consumeru:**
```javascript
try {
  const result = await sliceModelLocal(file, { timeoutMs: 120000 });
  // result.metrics, result.modelInfo ...
} catch (err) {
  console.error(err.message);
}
```

### 10.3 storageApi -- Throw pattern

`handleResponse()` **vyhodi Error** pri non-OK odpovedi:

| Situace | Error message |
|---------|---------------|
| Response neni JSON (404 stranky) | `Storage backend not found. Is the backend server running on port 3001?` |
| Response neni JSON (jiny status) | `Unexpected response ({status}). Backend may not be running.` |
| `res.ok === false` nebo `data.ok === false` | `{data.message}` nebo `{data.errorCode}` nebo `HTTP {status}` |
| Network error | Nativni fetch error |

### 10.4 Retry logika

**ZADNA z techto services nepouziva retry.** Kazdy request je single-attempt. Retry logiku musi resit consumer (volajici komponenta/hook).

### 10.5 Timeout

| Service | Timeout | Mechanismus |
|---------|---------|-------------|
| **presetsApi** | Zadny | -- |
| **slicerApi** | 120s (default, konfigurovatelny) | `AbortController` + `setTimeout` |
| **storageApi** | Zadny | -- |

---

## 14. Bezpecnost

### 14.1 CORS

**Vite dev proxy** (`vite.config.mjs` radky 42-55):
- Proxy `/api` -> `http://127.0.0.1:3001`
- Stripuje `Origin` header z proxied requestu (`proxyReq.removeHeader('origin')`)
- Takze backend vidi request jako same-origin

**Backend CORS konfigurace** (`index.js` radky 49-64):
- Default allowed origins: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`
- Konfigurovatelne pres `CORS_ORIGINS` env var (comma-separated list)
- Wildcard `*` je podporovana (povoluje vsechny originy)
- Requesty bez Origin (curl, Postman, server-to-server) jsou povoleny
- `credentials: true` je nastaven

**Dulezite:** V produkcnim prostredi (bez Vite proxy) MUSI byt `CORS_ORIGINS` spravne nastaven pro domenu widgetu.

### 14.2 Auth headers

**Jediny autentizacni/authorizacni mechanismus je `x-tenant-id` header.**

| Service | Jak ziskava tenant ID |
|---------|----------------------|
| **presetsApi** | Vlastni `getTenantId()` — cte `localStorage.getItem('modelpricer:tenant_id')`, fallback `'demo-tenant'` |
| **slicerApi** | Import `getTenantId` z `../utils/adminTenantStorage` + moznost override pres `opts.tenantId` |
| **storageApi** | Import `getTenantId` z `../utils/adminTenantStorage` |

**POZOR:** `x-tenant-id` neni kryptograficky overovany na backendu. Backend provadi pouze string extrakci z headeru a pouziva ho jako namespace pro filesystem operace. Neni zde zadna JWT/session validace.

### 14.3 Path traversal ochrana (pouze storageApi)

Backend `storageRouter.js` pouziva:
- `sanitizePath()` — cisti relativni cesty
- `assertWithinRoot()` — validuje ze vysledna absolutni cesta je uvnitr tenant root
- Error code `PATH_TRAVERSAL` (HTTP 403) pri pokusu o pristup mimo tenant slozku

### 14.4 File type validace

| Endpoint | Povolene typy | Max velikost |
|----------|---------------|-------------|
| POST /api/presets | `.ini` | 5 MB |
| POST /api/slice (model) | `.stl`, `.obj`, `.3mf`, `.amf`, `.ini` | 250 MB |
| POST /api/storage/orders | `.stl`, `.obj`, `.3mf`, `.amf`, `.step`, `.stp` | 250 MB |
| POST /api/storage/upload | Vsechny typy | 250 MB |

### 14.5 COOP/COEP hlavicky

Vite dev server nastavuje (`vite.config.mjs` radky 56-59):
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
Tyto hlavicky omezuji cross-origin pristup a jsou potrebne pro `SharedArrayBuffer` (pouzivano v 3D vieweru).

---

## 17. Zname omezeni

### 17.1 getTenantId duplicita

`presetsApi.js` ma vlastni kopii funkce `getTenantId()` (radky 11-18) misto importu ze sdileneho `adminTenantStorage.js`. Komentar na radku 12 (`// Keep consistent with /src/utils/adminTenantStorage.js`) naznacuje ze jde o vedomou duplicitu. Hrozba: kdyz se zmeni logika v jednom miste, druhe zustane neaktualizovane.

### 17.2 Nekonzistentni error handling pattern

- `presetsApi` pouziva Result pattern (`{ ok: true/false }`) -- bezpecnejsi, netreba try/catch v consumeru
- `slicerApi` a `storageApi` vyhazuji Error -- consumer MUSI mit try/catch

Tato nekonzistence znamena ze vyvojar musi pamatovat ktery service ktery pattern pouziva.

### 17.3 Zadna retry logika

Zadny ze tri services nema built-in retry. Pro nestabilni sitove prostredí (mobilni sit, widget embed na cizi strance) by melo byt retry implementovano na urovni consumeru nebo middleware.

### 17.4 Zadny timeout pro presetsApi a storageApi

Na rozdil od `slicerApi` (ktery ma `AbortController` s konfigurovatelnym timeoutem), `presetsApi` a `storageApi` nemaji zadny timeout. Request muze viset neomezenou dobu pokud server neodpovi.

### 17.5 Widget presets endpoint -- odlisny response format

`GET /api/widget/presets` vraci `{ presets, defaultPresetId }` misto standardniho `{ ok: true, data: ... }` formatu. To je zpracovano v `apiFetch()` korektne, ale je to nekonzistentni s ostatnimi endpointy.

### 17.6 createZip -- DOM manipulace

`createZip()` v `storageApi.js` primo manipuluje s DOM (vytvari `<a>` element, klikne na nej). Toto znemoznuje pouziti v non-browser prostredi (SSR, testy, Web Worker).

### 17.7 downloadFile -- memory leak riziko

`downloadFile()` vytvari Object URL pres `URL.createObjectURL()` ale nerevokuje ho. Consumer musi sam zavolat `URL.revokeObjectURL()`. Pokud se to opomene, blob zustane v pameti do zavreni stranky.

### 17.8 Slicer endpoint -- legacy response format

`POST /api/slice` pouziva `{ success: true/false }` misto moderniho `{ ok: true/false, data }` formatu ktery pouzivaji ostatni endpointy. Toto je legacy format ktery nebyl migrovany.

### 17.9 Chybejici request cancellation pro presetsApi a storageApi

Na rozdil od `slicerApi`, ktery podporuje AbortController, presetsApi a storageApi neumoznuji zruseni probihajiciho requestu. To muze zpusobit race conditions pri rychlem prepinani straneknebo opakovanem klikani.

### 17.10 Zadna request deduplication

Pokud uzivatel rychle klikne na tlacitko dvakrat, oba requesty se odeslou. Zadna z techto services nema built-in deduplication nebo debounce.

---

*Posledni aktualizace: 2026-02-13*
*Vlastnik dokumentu: mp-mid-backend-api*
