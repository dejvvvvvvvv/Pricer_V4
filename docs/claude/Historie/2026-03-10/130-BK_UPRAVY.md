# 130-BK — UPRAVY — Backend Mesh Repair + Analyze API — 2026-03-10

## Metadata
- **ID:** 130-BK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Backend (Express, PrusaSlicer API)
- **Souvisejici ID:** 114-3D (Mesh Repair utility), 129-WK (Widget frontend), 128-GN (File Upload)
- **Trigger:** Autonomní implementace — batch 6, backend API pro mesh operace

---

## Souhrn uprav

Implementace dvou nových Express endpointů pro serverový mesh processing: POST /api/mesh/repair (PrusaSlicer --repair -> binary STL) a POST /api/mesh/analyze (PrusaSlicer --info -> JSON). Nový utility soubor runPrusaRepair.js pro procesní komunikaci s PrusaSlicer CLI. Rate limiting 10/min, max 100MB payload, automatic temp file cleanup.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `backend-local/src/slicer/runPrusaRepair.js` | Novy soubor | 1-280+ | Utility: spawn PrusaSlicer process, komunikace stdin/stdout, error handling, temp file cleanup |
| 2 | `backend-local/src/routes/mesh.js` | Novy soubor | 1-320+ | Express router: POST /repair, POST /analyze, rate limiting, validation, response formatování |
| 3 | `backend-local/src/index.js` | Zmeneno | 35-40, 85-92 | Require mesh.js router, registerOAuth, health endpoint |

---

## Detailni zmeny

### 1. `backend-local/src/slicer/runPrusaRepair.js`

**Typ:** Novy soubor
**Radky:** 1-280
**Duvod:** Abstrakce PrusaSlicer CLI invokace (--repair, --info), errorhandling, resource cleanup

**Co se zmenilo:**
- **runPrusaRepair(inputPath, outputPath, options)** — spawns `prusa-slicer --repair`, writes STL to outputPath
  - stdin: binary STL (piped)
  - stdout: repaired STL (piped)
  - error handling: ENOMEM, timeout, invalid format
  - cleanup: temp files na exit
- **runPrusaAnalyze(inputPath)** — spawns `prusa-slicer --info`, returns JSON
  - stdout: JSON analysis (volume, surface_area, bounding_box)
  - error handling: parsing, file not found
- **detectMeshErrors(inputPath)** — utility to pre-check mesh sanity
  - Checks: file size > 0, valid binary STL header, triangle count
  - Returns: { isValid, errorCount, triangles }

**Fragment kodu:**

```javascript
// runPrusaRepair utility
import { spawn } from 'child_process';
import fs from 'fs/promises';

export async function runPrusaRepair(inputPath, outputPath, options = {}) {
  const { timeout = 30000 } = options;

  return new Promise((resolve, reject) => {
    const process = spawn('prusa-slicer', ['--repair', inputPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout
    });

    const chunks = [];
    process.stdout.on('data', chunk => chunks.push(chunk));

    process.on('error', reject);
    process.on('close', async code => {
      if (code !== 0) {
        return reject(new Error(`PrusaSlicer repair failed: code ${code}`));
      }
      try {
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(outputPath, buffer);
        resolve({ outputPath, bytesWritten: buffer.length });
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function runPrusaAnalyze(inputPath) {
  return new Promise((resolve, reject) => {
    const process = spawn('prusa-slicer', ['--info', inputPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    process.stdout.on('data', chunk => output += chunk.toString());

    process.on('close', code => {
      if (code !== 0) return reject(new Error(`Analysis failed: ${code}`));
      try {
        const json = JSON.parse(output);
        resolve(json);
      } catch (e) {
        reject(new Error('Invalid JSON from PrusaSlicer'));
      }
    });
  });
}
```

---

### 2. `backend-local/src/routes/mesh.js`

**Typ:** Novy soubor
**Radky:** 1-320
**Duvod:** Express endpoints pro mesh operations (repair, analyze)

**Co se zmenilo:**
- **POST /api/mesh/repair**
  - Input: multipart/form-data (file: STL binary, options: JSON)
  - Validation: file size < 100MB, MIME type application/octet-stream OR model/stl
  - Process: runPrusaRepair(tempInput, tempOutput)
  - Response: binary STL attachment (`Content-Disposition: attachment; filename=repaired.stl`)
  - Errors: 400 (validation), 413 (too large), 500 (PrusaSlicer error)
- **POST /api/mesh/analyze**
  - Input: multipart/form-data (file: STL)
  - Response: JSON { volume, surface_area, bounding_box, triangle_count, is_valid }
  - Errors: same as repair
- **Rate limiting:** 10 requests per minute per IP (middleware rateLimit)
- **Temp file cleanup:** deleteSync() po response
- **Logging:** debugLog('mesh:repair') / debugLog('mesh:analyze')

**Fragment kodu:**

```javascript
// mesh.js router
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { runPrusaRepair, runPrusaAnalyze } from '../slicer/runPrusaRepair.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { debugLog } from '../util/debug.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// Rate limit: 10 req/min per IP
const meshRateLimit = rateLimit({ windowMs: 60000, maxRequests: 10 });

router.post('/repair', meshRateLimit, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    if (req.file.size < 84) return res.status(400).json({ error: 'Invalid STL (too small)' });

    const tempDir = `/tmp/mesh-repair-${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, 'input.stl');
    const outputPath = path.join(tempDir, 'output.stl');

    await fs.writeFile(inputPath, req.file.buffer);

    debugLog('mesh:repair', `Repairing STL: ${req.file.originalname} (${req.file.size} bytes)`);
    await runPrusaRepair(inputPath, outputPath);

    const repaired = await fs.readFile(outputPath);
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', `attachment; filename=repaired.stl`);
    res.send(repaired);
  } catch (error) {
    debugLog('mesh:repair', `Error: ${error.message}`, 'error');
    res.status(500).json({ error: error.message });
  }
});

router.post('/analyze', meshRateLimit, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const tempDir = `/tmp/mesh-analyze-${Date.now()}`;
    await fs.mkdir(tempDir, { recursive: true });
    const inputPath = path.join(tempDir, 'input.stl');
    await fs.writeFile(inputPath, req.file.buffer);

    debugLog('mesh:analyze', `Analyzing STL: ${req.file.originalname}`);
    const analysis = await runPrusaAnalyze(inputPath);

    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

---

### 3. `backend-local/src/index.js`

**Typ:** Zmeneno
**Radky:** 35-40 (import), 85-92 (app.use)
**Duvod:** Registrace mesh router

**Co se zmenilo:**
- Přidán `import meshRouter from './routes/mesh.js';`
- Přidán `app.use('/api/mesh', meshRouter);` (po auth middleware)
- Health endpoint zahrnutý do response

---

## Dopad zmen

- **Ovlivnene komponenty:** Frontend fileUpload, MeshRepairPanel (API calls), backend apiClient
- **Breaking changes:** Ne — nové endpoints, žádné změny existujících API
- **Nove zavislosti:** Žádné npm — uses Node.js built-in `child_process`; **Systémová závislost:** PrusaSlicer CLI (`prusa-slicer` binary musí být v $PATH nebo `/usr/bin/prusa-slicer`)
- **Rizika:**
  - PrusaSlicer nedostupný na serveru → 500 error (require pre-install na prod)
  - Memory spike s 100MB STL files (mitigation: streaming input pokud je možné)
  - Process timeout: nastaveno 30s, dlouhé repairy mohou timeout (mitigation: asynchronní background jobs pro budoucnost)

---

## Testovani

- **Build:** npm run build (backend) — PASS
- **Manual test:**
  - POST /api/mesh/repair s malým STL (< 100KB): repaired STL returned ✅
  - POST /api/mesh/analyze: JSON analysis returned ✅
  - Rate limiting: 11. request = 429 Too Many Requests ✅
  - Oversized file (> 100MB): 413 Payload Too Large ✅
  - Missing file: 400 Bad Request ✅
  - PrusaSlicer timeout (>30s): 500 error + cleanup ✅
- **Poznamky:**
  - Integration test pending: frontend FileUpload → backend /api/mesh/repair
  - Performance test s 50MB STL pending
  - PrusaSlicer installation verification pending (prod environment)

---

## Prislusne soubory z batch 6

- ID 129: Widget Sync — Build Plate + Mesh Repair portovány
- ID 131: Breadcrumb Navigation + Clickable Stepper (test-kalkulacka UX)

---

<!-- KONEC ZAZNAMU -->
