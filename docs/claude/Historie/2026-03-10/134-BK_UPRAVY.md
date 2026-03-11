# 134-BK — UPRAVY — Backend — 2026-03-10

## Metadata
- **ID:** 134-BK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Backend
- **Souvisejici ID:** 115 (Roadmap plán s touto feature), 132 (Batch 6 session), 130 (Mesh API)
- **Trigger:** Batch 7 autonomní implementace — Backend Slicing Job Queue dle roadmapu

---

## Souhrn uprav

Implementace asynchronního job queue systému pro PrusaSlicer slicing operace. SlicingQueue class (EventEmitter) spravuje max 2 concurrent slicing jobů s max 50 queued čekajícími. Podpora progress tracking z PrusaSlicer stderr, cancellation, auto-cleanup po 1 hodině. REST API: POST/GET/DELETE /api/slice/queue endpoints.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `backend-local/src/jobs/slicingQueue.js` | Nový soubor | N/A | SlicingQueue class, EventEmitter, job lifecycle management |
| 2 | `backend-local/src/index.js` | Zmeneno | +50 | Integrace slicingQueue instance, /api/slice/queue endpoints |

---

## Detailni zmeny

### 1. `backend-local/src/jobs/slicingQueue.js`

**Typ:** Nový soubor
**Radky:** N/A
**Duvod:** Separace concerns — queue logic oddělen od express routeru, reusable pro testy a další endpointy

**Co se zmenilo:**
- Nový `SlicingQueue` class, extends EventEmitter
- Constructor: maxConcurrent=2, maxQueued=50, jobsMap={}, activeJobs=[], queueJobs=[]
- Metody:
  - `submit(fileId, stlPath, options)` — vytvoří job, vrátí jobId, emit 'job:queued'
  - `start()` — internal, spouští queue processing
  - `_processNext()` — dequeue a spusť, emit 'job:started'
  - `cancel(jobId)` — kill proces, cleanup, emit 'job:cancelled'
  - `get(jobId)` — vrátí job status/progress
  - `list()` — vrátí všechny jobs s statusem
- Progress tracking: parsování PrusaSlicer stderr pro progress % a ETA
- Auto-cleanup: setTimeout na 1 hodinu, remove job z jobsMap
- FIFO ordering: Queue.shift() pro next job
- States: queued, processing, completed, failed, cancelled

---

### 2. `backend-local/src/index.js`

**Typ:** Zmeneno
**Radky:** +50 (přibližně bottom part, nový endpoint)
**Duvod:** Expose slicingQueue API pro frontend

**Co se zmenilo:**
- Import: `import SlicingQueue from './jobs/slicingQueue.js'`
- Instance creation: `const slicingQueue = new SlicingQueue()`
- Nový endpoint `POST /api/slice/queue` — submit job
  - Body: { fileId, stlPath, nozzleTemp, bedTemp, ... }
  - Response: { jobId, status: 'queued' }
  - Error: 400 pokud queue full
- Nový endpoint `GET /api/slice/queue/:jobId` — get job status
  - Response: { jobId, status, progress, eta, completedAt, ... }
  - Error: 404 pokud job neexistuje
- Nový endpoint `DELETE /api/slice/queue/:jobId` — cancel job
  - Response: { success: true, jobId }
  - Error: 400 pokud job už completed/failed
- Logging: console.log při submit, complete, cancel (lze upgrade na Winston)

---

## Dopad zmen

- **Ovlivnene komponenty:** Frontend slicing UI (kterýkoliv component který zavolá POST /api/slice/queue)
- **Breaking changes:** Ne — nový feature, žádný breaking change
- **Nove zavislosti:** Node.js built-in EventEmitter (žádný npm install)
- **Rizika:**
  - PrusaSlicer stderr parsing je heuristický — nemusí fungovat na všech verzích
  - Auto-cleanup po 1h může mazat long-running jobů (lze udělat configurabilní)
  - Rate limiting není implementován — frontend by měl mít guards

---

## Testovani

- **Build:** Očekáváno PASS (nový soubor + espresso integrace do index.js)
- **Manual test:**
  - POST /api/slice/queue vrátí { jobId, status: 'queued' }
  - GET /api/slice/queue/:jobId vrátí aktuální status + progress
  - DELETE /api/slice/queue/:jobId vrátí success
  - Queue respektuje max 2 concurrent + max 50 queued
  - Po 1h job se auto-cleanup (lze ověřit s mock clock v testu)

---
