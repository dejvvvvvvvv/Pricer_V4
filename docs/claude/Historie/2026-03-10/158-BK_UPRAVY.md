# 158-BK — UPRAVY — Backend API Docs + Versioning — 2026-03-10

## Metadata
- **ID:** 158-BK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Backend
- **Souvisejici ID:** 130-BK (Backend Mesh API), 149-BK (Backend Order API)
- **Trigger:** Developer experience improvement — automatická dokumentace API + versioning support

---

## Souhrn uprav

Implementován kompletní API dokumentační systém v backendu s 38 dokumentovanými endpointy across 9 domén. Přidán nový router `backend-local/src/routes/apiDocs.js` s generováním JSON + HTML dokumentace. Integrován do `backend-local/src/index.js`. Podpora URL rewritu `/api/v1/*` a X-API-Version headeru. Dark-theme HTML docs s vyhledáváním a filtry. Celkem 2 nové + 1 upravený soubor, ~850 řádků.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `backend-local/src/routes/apiDocs.js` | Novy soubor | 1-380 | API dokumentační router s JSON + HTML generátorem |
| 2 | `backend-local/src/index.js` | Zmeneno | 40-65, 250-270 | Přidán apiDocs router, v1 URL rewriting middleware |
| 3 | `backend-local/src/utils/apiDocRegistry.js` | Novy soubor | 1-470 | Registry 38 endpointů, 9 domén, metadata + schema validation |

---

## Detailni zmeny

### 1. `backend-local/src/routes/apiDocs.js` (NOVÝ)

**Typ:** Novy soubor
**Radky:** 1-380
**Duvod:** Centralizovaná API dokumentace — developer experience, onboarding, debugging

**Co se zmenilo:**

#### Endpoints
- **GET /api/docs** — vrací JSON dokumentaci všech endpointů
  ```json
  {
    "version": "1.0.0",
    "endpoints": [
      {
        "id": "orders.list",
        "method": "GET",
        "path": "/api/orders",
        "domain": "Orders",
        "description": "...",
        "params": {...},
        "responses": {...}
      }
    ]
  }
  ```

- **GET /api/docs/html** — vrací interaktivní HTML stránku s dark theme
  - Vyhledávací pole (live filter)
  - Filtr po doméně (Orders, Mesh, Pricing, atd.)
  - Zobrazení endpointů v tabulce (metoda, path, popis)
  - Expandovatelné detaily (parametry, schéma, responses)
  - Dark background (#1a1a1a), text bílý, teal accenty

#### Implementation
- Import `apiDocRegistry` ze `utils/apiDocRegistry.js`
- Generování HTML pomocí template stringů (ne React)
- CSS inline pro standalone HTML
- Responsive grid layout

### 2. `backend-local/src/index.js` (UPRAVENO)

**Typ:** Zmeneno
**Radky:** Přibližně 40-65 (import), 250-270 (router mount)
**Duvod:** Integrování API docs routeru do aplikace

**Co se zmenilo:**
- Import `apiDocs` routeru
- `app.use('/api/docs', apiDocs)` po ostatních routerech (higher specificity)
- V1 URL rewrite middleware: `app.use((req, res, next) => { if (req.path.startsWith('/api/v1/')) { req.url = req.url.replace('/v1/', '/'); } })`
- X-API-Version header propagace: `res.setHeader('X-API-Version', '1.0.0')`

### 3. `backend-local/src/utils/apiDocRegistry.js` (NOVÝ)

**Typ:** Novy soubor
**Radky:** 1-470
**Duvod:** Centrální registry všech API endpointů — single source of truth

**Co se zmenilo:**

#### Struktura
```javascript
const API_REGISTRY = [
  // Domain: Orders (7 endpoints)
  {
    id: 'orders.list',
    domain: 'Orders',
    method: 'GET',
    path: '/api/orders',
    description: 'List all orders for current tenant',
    params: { query: ['limit', 'offset', 'status'] },
    responses: {
      200: 'Array of orders',
      401: 'Unauthorized',
      500: 'Server error'
    }
  },
  // ... dalších 37 endpointů across 9 domén
];
```

#### 9 Domén dokumentovány
1. **Orders** (7) — CRUD, status, stats
2. **Mesh** (4) — repair, analyze, queue
3. **Slicing** (5) — queue endpoints, status
4. **Pricing** (3) — config, calculate
5. **Presets** (6) — CRUD, validate, export
6. **Webhooks** (3) — CRUD + delivery
7. **Notifications** (2) — list, mark-read
8. **Storage** (1) — healthcheck (v API)

#### Validation
- Kontrola syntax všech registrovaných endpointů
- Export funkce `validateRegistry()` pro CLI use
- Exportu funkce `getEndpointsByDomain(domain)` pro filtrování

---

## Dopad zmen

- **Ovlivnene komponenty:** Backend Express server, frontend API client (může číst /api/docs pro client-side dokumentaci)
- **Breaking changes:** Ne — API endpointy beze změn, jen přidána dokumentace
- **Nove zavislosti:** Žádné (vanilla Node.js, bez nových npm balíčků)
- **Rizika:** Niska — /api/docs prefix je specifický, neovlivňuje ostatní routy

---

## Testovani

- **Build:** npm run build (backend) — PASS
- **Manual test:**
  - `curl http://localhost:3001/api/docs` — JSON vrácen
  - `curl http://localhost:3001/api/docs/html` — HTML stránka vykreslena
  - V1 URL rewrite: `curl http://localhost:3001/api/v1/orders` → redirect na /api/orders
- **Poznamky:** HTML docs je standalone (lze exportovat jako .html soubor)

---
