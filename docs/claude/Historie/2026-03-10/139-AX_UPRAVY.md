# 139-AX — UPRAVY — Backend Presets CRUD API — 2026-03-11

## Metadata
- **ID:** 139-AX
- **Session:** S01
- **Datum:** 2026-03-11
- **Oblast:** Admin Presets (Backend CRUD)
- **Souvisejici ID:** 138-AS (Quick Settings), 115-GN (roadmap)
- **Trigger:** Batch 9 implementace — vytvoření komplexního backend API pro správu tiskových preset konfigurací (temperatura, tisk speed, support, atd.)

---

## Souhrn uprav

Vytvořen nový backend router pro Presets CRUD (Create, Read, Update, Delete) s 11 endpointy, 6 default preset templates (PLA/PETG/ABS/TPU/FLEX/NYLON), validací konfigurace, a helper funkcemi pro generování INI souboru a zpětné parsování. Frontend API service rozšířen o 5 nových funkcí pro komunikaci s backendem. Presets jsou tenant-scoped.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `backend-local/src/routes/presets.js` | Novy soubor | 1-650 | Nový router s 11 CRUD endpointy, default templates, validatePresetConfig, generateIniFromConfig helpers |
| 2 | `backend-local/src/index.js` | Zmeneno | 80-95 | Refaktor inline /presets handlers → router import, app.use('/api/presets', presetsRouter) |
| 3 | `src/services/presetsApi.js` | Zmeneno | 45-125 | Přidáno 5 nových funkcí: getPresetsWithDefaults, validatePresetConfig, generateIniFromConfig, duplicatePreset, getPresetDefaults |

---

## Detailni zmeny

### 1. `backend-local/src/routes/presets.js`

**Typ:** Novy soubor
**Radky:** 1-650
**Duvod:** Centralizované spravování tiskových presetu s validation a default templates pro PUSA/PETG/ABS/TPU/FLEX/NYLON

**Co se zmenilo:**

- **11 endpointy:**
  1. `GET /api/presets` — seznam všech presetu (tenant-scoped)
  2. `GET /api/presets/defaults` — get 6 default templates s config
  3. `POST /api/presets` — vytvorit novy preset (s validation)
  4. `GET /api/presets/:id` — detail presetu
  5. `PUT /api/presets/:id` — upravit preset
  6. `DELETE /api/presets/:id` — smazat preset
  7. `POST /api/presets/:id/validate` — validovat config
  8. `POST /api/presets/:id/duplicate` — klonovat preset
  9. `POST /api/presets/:id/export-ini` — generovat INI content
  10. `POST /api/presets/batch-export` — hromadný export presetu (CSV format)
  11. `GET /api/presets/content/:id` — get generated INI jako text

- **6 default templates:**
  - PLA (Standard): temp 215°C, bedTemp 60°C, speed 50mm/s, support: tree
  - PETG: temp 245°C, bedTemp 80°C, speed 35mm/s, brim: yes
  - ABS: temp 260°C, bedTemp 100°C, speed 30mm/s, enclosure: yes
  - TPU: temp 225°C, bedTemp 65°C, speed 15mm/s, nozzle diameter 0.6mm
  - FLEX: temp 230°C, bedTemp 70°C, speed 20mm/s, z-hop: yes
  - NYLON: temp 250°C, bedTemp 80°C, speed 25mm/s, flow adjust

- **Helper funkce:**
  - `validatePresetConfig(config)` — kontrola povinných polí, rozsahu teploty (170-300°C), rychlosti (5-100mm/s)
  - `generateIniFromConfig(config)` — konverze JS objektu na INI format (Prusa-compatible)
  - `parseIniToConfig(iniContent)` — reverse engineering INI → JS object (future)

```js
// Struktura endpointu:
- requireAuth() + requireTenant() middleware
- Validation schemou (joi/zod compatible format, custom validator)
- Storage adapter pro tenant-scoped preset storage
- Error handling (400 Bad Request, 404 Not Found, 409 Conflict)
- Logging v requestLogger middleware
```

---

### 2. `backend-local/src/index.js`

**Typ:** Zmeneno
**Radky:** 80-95
**Duvod:** Refaktor — přesunout inline /presets handlers do vlastního routeru pro čistějsí strukturu

**Co se zmenilo:**
- Odebráno ~80 řádků inline /api/presets/* endpoints
- Přidán import `import presetsRouter from './routes/presets.js';`
- Přidán `app.use('/api/presets', presetsRouter);` (po auth middleware)
- Struktura: app → auth middleware → presetsRouter → controlery

---

### 3. `src/services/presetsApi.js`

**Typ:** Zmeneno
**Radky:** 45-125
**Duvod:** Rozšíření frontend API service o 5 nových helper funkcí pro komunikaci s backend presety

**Co se zmenilo:**

5 nových funkcí:
1. `getPresetsWithDefaults()` — fetch presets + fallback na defaults pokud je seznam prázdný
2. `validatePresetConfig(config)` — client-side validation před savem (duplikace server validace)
3. `generateIniFromConfig(config)` — klientský helper pro preview INI (kopie backend verze)
4. `duplicatePreset(presetId, newName)` — POST /api/presets/:id/duplicate
5. `getPresetDefaults()` — GET /api/presets/defaults

```jsx
// Funkce signatury:
export async function validatePresetConfig(config) {
  const errors = [];
  if (!config.name) errors.push('Název presetu je povinný');
  if (config.hotendTemp < 170 || config.hotendTemp > 300) errors.push('Teplota mimo rozsah 170-300°C');
  // ... dalších 8 validací
  return { valid: errors.length === 0, errors };
}
```

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminPresets.jsx (можност duplikace presets), QuickSettings.jsx (cte preset config), test-kalkulacka (cte presets pro dropdown)
- **Breaking changes:** Ne (novych endpointy, no existing endpoints změněny)
- **Nove zavislosti:** Ne (existující Express, joi/validation libs)
- **Rizika:**
  - Validace na klientovi vs. serveru (musí být synchronizovány)
  - INI generování komplikované pro edge case kombinace (řešení: unit testy)
  - Default templates mohou zastarát, pokud se změní Prusa MK3S+ konfigurace (řešení: admin override + version checking)

---

## Testovani

- **Build:** ✅ npm run build — PASS
- **Backend test (manual curl):**
  - `GET /api/presets` — 200 OK s tenant-scoped listem
  - `GET /api/presets/defaults` — 200 OK s 6 templates
  - `POST /api/presets` (create PLA custom) — 201 Created
  - `PUT /api/presets/{id}` (změna temp na 220°C) — 200 OK
  - `POST /api/presets/{id}/validate` (invalid config) — 400 Bad Request s error messages
  - `POST /api/presets/{id}/duplicate` (clone na "My PLA Custom") — 201 Created
  - `GET /api/presets/content/{id}` (INI export) — 200 OK s text/plain Content-Type
  - `DELETE /api/presets/{id}` — 204 No Content
- **Frontend test (AdminPresets.jsx):** ✅ Load defaults, create new, validate on input, duplicate dropdown, export INI preview
- **Poznamky:** Tenant isolation funguje (getTenantId() middleware), default templates immutable (kopírují se na duplicate)

---

## Nazev souboru
- `docs/claude/Historie/2026-03-10/139-AX_UPRAVY.md`
