# AdminPresets — Dokumentace

> Admin stranka pro spravu tiskovych presetu (.ini souboru). Podporuje backend CRUD
> s offline fallbackem do localStorage, per-material prirazeni presetu, print parameter
> overrides a nastaveni vychoziho presetu pro PrusaSlicer CLI.

---

## 1. Prehled

AdminPresets (`/admin/presets`) je admin stranka pro spravu PrusaSlicer preset souboru.
Presety jsou `.ini` konfiguracni soubory ktere definuji tiskove parametry (layer height,
infill, teploty, rychlost, supporty atd.) pouzivane pri slicovani na backendu.

Hlavni funkce:

- **Upload presetu** — nahrani `.ini` souboru (max 5 MB) s metadaty (nazev, poradi, material, widget viditelnost)
- **Inline editace** — zmena nazvu, poradi, materialu a widget viditelnosti primo v tabulce
- **ForgeDialog editace** — rozsireny dialog s print parameter overrides (10 parametru)
- **Vychozi preset** — nastaveni jednoho presetu jako default pro slicovani
- **Smazani** — s konfirmacnim modalem pro vychozi preset (automaticky fallback na dalsi)
- **Offline mode** — plna funkcionalita i bez backendu (zmeny se ukladaji do localStorage)
- **Material linking** — prirazeni presetu ke konkretnimu materialu z pricing konfigurace
- **Backend sync** — cache posledniho server stavu do localStorage pro offline prohlizeni

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | CSS-in-JS (template literal `css` na konci souboru), Forge design tokeny |
| Routing | React Router v6 (`/admin/presets` route) |
| i18n | Interni `pickLang(language, cs, en)` s `useLanguage()` hookem |
| Ikony | lucide-react pres `AppIcon` wrapper (RefreshCcw, WifiOff, Upload, Save, Star, Trash2, Loader2, XCircle, CheckCircle, X) |
| Backend API | `presetsApi.js` — REST klient pres Vite proxy (`/api` -> `http://127.0.0.1:3001`) |
| Storage | Tenant-scoped localStorage pres `adminTenantStorage.js` (namespace `presets:v1`) |
| UI komponenty | ForgeDialog, ForgeCheckbox (z `components/ui/forge/`) |

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminPresets.jsx              — Jediny soubor, 1164 radku, export default AdminPresets

src/services/
  presetsApi.js                 — API klient pro presets backend (180 radku)
    - getTenantId()             — Tenant ID z localStorage
    - apiFetch(path, options)   — Fetch wrapper s x-tenant-id headerem
    - listPresets()             — GET /api/presets
    - uploadPreset(file, meta)  — POST /api/presets (multipart FormData)
    - patchPreset(id, patch)    — PATCH /api/presets/:id
    - deletePreset(id)          — DELETE /api/presets/:id
    - setDefaultPreset(id)      — POST /api/presets/:id/default
    - fetchWidgetPresets()      — GET /api/widget/presets

src/utils/
  adminTenantStorage.js         — Tenant-scoped localStorage helper (sync + async Supabase)
  adminPricingStorage.js        — Pricing config (loadPricingConfigV3) — pouzivano pro materials list
```

### Forge CSS pouzivane AdminPresets

Stranka definuje vlastni CSS primo v souboru (template literal `css`, radky 1073-1163).
Pouziva Forge design tokeny pres CSS custom properties:

```
--forge-text-primary, --forge-text-secondary, --forge-text-muted
--forge-bg-surface, --forge-bg-elevated, --forge-bg-void
--forge-border-default
--forge-accent-primary, --forge-success, --forge-error
--forge-radius-md
--forge-font-tech
```

---

## 4. Import graf

### 4.1 Co AdminPresets importuje

| Import | Zdroj | Typ |
|--------|-------|-----|
| `React, useEffect, useMemo, useRef, useState` | `react` | Knihovna |
| `Icon` | `../../components/AppIcon` | Ikona wrapper (default) |
| `ForgeDialog` | `../../components/ui/forge/ForgeDialog` | Modal dialog (default) |
| `ForgeCheckbox` | `../../components/ui/forge/ForgeCheckbox` | Checkbox (default) |
| `useLanguage` | `../../contexts/LanguageContext` | Hook (named) |
| `readTenantJson, writeTenantJson` | `../../utils/adminTenantStorage` | Storage helpery (named) |
| `loadPricingConfigV3` | `../../utils/adminPricingStorage` | Pricing loader (named) |
| `deletePreset, listPresets, patchPreset, setDefaultPreset, uploadPreset` | `../../services/presetsApi` | API funkce (named) |

### 4.2 Kdo importuje AdminPresets

| Soubor | Jak |
|--------|-----|
| `src/Routes.jsx` | `<Route path="/admin/presets" element={<AdminPresets />} />` (lazy/direct) |
| `src/pages/admin/AdminLayout.jsx` | Navigacni odkaz v admin sidebar |

---

## 5. Data model

### 5.1 Preset objekt (normalizovany)

Funkce `normalizePreset(raw)` prevadi ruzne backend formaty na jednotny tvar:

```javascript
{
  id: "preset-abc123",           // String, unikatni identifikator
  name: "PLA Standard",          // String, nazev presetu (z raw.name || raw.title || raw.id)
  order: 10,                     // Number, poradi/priorita (z raw.order || raw.priority || raw.sort)
  visibleInWidget: true,         // Boolean, viditelnost ve verejnem widgetu
  createdAt: "2026-02-13T...",   // String, ISO datum vytvoreni
  updatedAt: "2026-02-13T...",   // String, ISO datum posledni zmeny
  sizeBytes: 1234,               // Number|null, velikost .ini souboru
  material_key: "pla",           // String|null, klic prirazeneho materialu
  print_overrides: {             // Object, prepsani tiskovych parametru
    layer_height: 0.2,
    infill_sparse_density: 20,
    fill_pattern: "gyroid",
    support_material: false,
    // ... dalsi (viz 5.3)
  }
}
```

### 5.2 localStorage format (namespace `presets:v1`)

```javascript
// Klic: modelpricer:<tenantId>:presets:v1
{
  presets: [ /* pole normalizovanych preset objektu */ ],
  defaultPresetId: "preset-abc123" | null
}
```

Funkce `readLocalFallback()` rozpoznava 3 formaty legacy dat:
- Pole primo: `[preset1, preset2]`
- Objekt s `presets`: `{ presets: [...] }`
- Objekt s `items`: `{ items: [...] }`

### 5.3 Print Override Fields (PRINT_OVERRIDE_FIELDS)

10 prepsatelnych tiskovych parametru definovanych v konstantnim poli:

| Klic | Typ | Krok | Popis (CZ) | Popis (EN) |
|------|-----|------|-------------|-------------|
| `layer_height` | number | 0.01 | Vyska vrstvy (mm) | Layer height (mm) |
| `perimeters` | number | 1 | Pocet perimetru | Perimeters |
| `infill_sparse_density` | number | 1 | Infill (%) | Infill (%) |
| `fill_pattern` | select | — | Vzor vyplne | Fill pattern |
| `support_material` | boolean | — | Supporty | Supports |
| `support_material_threshold` | number | 1 | Uhel pro supporty | Support threshold |
| `first_layer_height` | number | 0.01 | Prvni vrstva (mm) | First layer height (mm) |
| `temperature` | number | 1 | Teplota trysky (C) | Nozzle temperature (C) |
| `bed_temperature` | number | 1 | Teplota podlozky (C) | Bed temperature (C) |
| `max_print_speed` | number | 1 | Max rychlost (mm/s) | Max print speed (mm/s) |

Dostupne fill patterny: `rectilinear`, `grid`, `triangles`, `stars`, `cubic`, `gyroid`,
`honeycomb`, `line`, `concentric`, `hilbertcurve`, `archimedeanchords`, `octagramspiral`.

### 5.4 Vychozi preset logika

- Jeden preset muze byt nastaven jako "vychozi" (`defaultPresetId`)
- Pri smazani vychoziho presetu se automaticky zvoli novy vychozi:
  - Razeni presetu podle `order` (sestupne), pak `name` (abecedne)
  - Prvni v serazenem seznamu se stane novym vychozim
  - Pokud zadny preset nezustane, `defaultPresetId = null` (pouziji se default parametry z Admin/parameters)

---

## 6. Klicova logika

### 6.1 Online/Offline rezim

AdminPresets pracuje ve dvou rezimech:

**Online mode (backend dostupny):**
1. `load()` vola `listPresets()` (GET /api/presets)
2. Odpoved se normalizuje a ulozi do state
3. Cache se zapise do localStorage (`writeLocalFallback`)
4. CRUD operace (upload, patch, delete, setDefault) volaji backend API
5. Po kazde uspesne operaci se znovu nacte kompletni stav z backendu

**Offline mode (backend nedostupny):**
1. `load()` detekuje chybu z `listPresets()` (`res.ok === false`)
2. Nacte posledni znamou cache z localStorage (`readLocalFallback`)
3. Zobrazi offline banner s chybovou zpravou
4. Vsechny CRUD operace pracuji lokalne:
   - Upload vytvori lokalni preset s ID `local-{timestamp}-{random}`
   - Patch aktualizuje state primo
   - Delete filtruje state
   - SetDefault aktualizuje `defaultPresetId` state
5. Zmeny se prubezne ukladaji do localStorage (useEffect s `writeLocalFallback`)

### 6.2 Upload flow

```
1. Uzivatel vybere .ini soubor (max 5 MB)
2. Jmeno se automaticky predvyplni z nazvu souboru (bez .ini pripony)
3. Volitelne: poradi, material, widget viditelnost
4. Klik "Nahrat preset":
   a) Online: uploadPreset(file, meta) -> POST /api/presets (multipart)
      -> load() znovu nacte stav z backendu
   b) Offline: vytvori lokalni preset objekt s unikatnim ID
      -> prida do state -> automaticky se ulozi do localStorage
5. Reset upload formulare
```

### 6.3 Inline editace a dirty tracking

Kazdy preset ma v `edits` state objekt s aktualnimi hodnotami:

```javascript
edits[presetId] = {
  name: "PLA Standard",
  order: 10,
  visibleInWidget: true,
  material_key: "pla"
}
```

Funkce `isDirty(id)` porovnava `edits[id]` s puvodnim presetem a detekuje zmeny v:
- `name` (string trim porovnani)
- `order` (numericke porovnani)
- `visibleInWidget` (boolean porovnani)
- `material_key` (string porovnani)

Tlacitko "Ulozit zmeny" je aktivni jen kdyz `isDirty(id) === true`.

### 6.4 ForgeDialog editace (detailni editor)

Kliknutim na radek v tabulce se otevre ForgeDialog s:
- **Sekce 1: Metadata** — nazev, poradi, material select, widget checkbox
- **Sekce 2: Print parameter overrides** — 10 poli z PRINT_OVERRIDE_FIELDS

Draft stav (`presetDraft`) se udrzuje nezavisle od inline editu.
Pri ulozeni dialogu se draft synchronizuje zpet do `edits` state a pak se
vola standardni save mechanismus (online: PATCH API, offline: lokalni update).

### 6.5 Material linking

Presety mohou byt prirazeny ke konkretnimu materialu:

1. Pri `load()` se nacte pricing konfigurace pres `loadPricingConfigV3()`
2. Z materialu se filtruji jen `enabled` s `key` a `name`
3. Material se zobrazuje v select elementu (upload form + tabulka + dialog)
4. Hodnota `material_key` se uklada jako soucasti preset metadata
5. Pokud material neni prirazen (`null`), preset plati pro vsechny materialy

### 6.6 Smazani vychoziho presetu

Specialni flow pro smazani presetu oznaceneho jako vychozi:

```
1. Klik "Smazat" na vychozi preset
2. Otevre se konfirmacni modal (ForgeDialog-like custom modal)
3. Informace: "Po smazani se vychozi preset prepne na preset s nejvyssi prioritou"
4. Potvrzeni -> runDelete():
   a) Online: DELETE /api/presets/:id
      -> backend vraci newDefaultId a index presetu
      -> load() znovu nacte stav
   b) Offline:
      -> filtruje preset ze state
      -> sort zbylych presetu dle order (sestupne) + name
      -> prvni se stane novym vychozim
5. Toast zprava informuje o novem vychozim presetu (nebo ze zadny nezustal)
```

---

## 8. Spusteni a predpoklady

### 8.1 Frontend

```bash
npm run dev    # spusti Vite na portu 4028
```

Admin Presets je dostupny na `http://localhost:4028/admin/presets`.

### 8.2 Backend (pro plnou funkcionalitu)

```bash
cd backend-local
npm install
node src/index.js    # spusti na portu 3001
```

Vite proxy preposila `/api/*` na `http://127.0.0.1:3001`.

### 8.3 Offline rezim

Bez backendu stranka automaticky prejde do offline rezimu:
- Zobrazi cerveny "Offline" badge a varovny banner
- Vsechny operace se ukladaji lokalne do `modelpricer:<tenantId>:presets:v1`
- Po restartu backendu kliknuti na "Obnovit" prepne zpet do online modu

---

## 9. Preklady (i18n)

AdminPresets pouziva interni `pickLang()` funkci misto globalniho `t()` z LanguageContext.
Vsechny texty jsou definovany v `strings` useMemo bloku (radky 94-170).

### Klicove preklady

| Klic | CZ | EN |
|------|----|----|
| title | Presety | Presets |
| subtitle | Sprava presetu (.ini) ulozenych na serveru... | Manage server-stored presets (.ini)... |
| uploadPreset | Nahrat preset | Upload preset |
| saveChanges | Ulozit zmeny | Save changes |
| setAsDefault | Nastavit jako vychozi | Set as default |
| delete | Smazat | Delete |
| visibleInWidget | Viditelny ve widgetu | Visible in widget |
| offlineBanner | Offline rezim: Backend neni dostupny... | Offline mode: Backend is unreachable... |
| materialLabel | Material | Material |
| allMaterials | Vsechny materialy | All materials |
| dialogTitle | Editace presetu | Edit preset |
| sectionMeta | Metadata | Metadata |
| sectionOverrides | Prepsani tiskovych parametru | Print parameter overrides |

Print override fields maji vlastni dvojjazycne labely definovane primo v `PRINT_OVERRIDE_FIELDS`.

---

## 10. Zname omezeni

- **Offline presety se nesyncuji zpet** — presety vytvorene v offline rezimu (ID `local-*`) se pri obnoveni spojeni automaticky neposillaji na backend
- **Bez souboroveho obsahu offline** — v offline rezimu se .ini soubor neukada (lokalni preset ma jen metadata, ne obsah souboru)
- **Print overrides jen v dialogu** — overrides se editujui pouze v ForgeDialog, ne v inline tabulce
- **Bez validace .ini formatu** — frontend nevaliduje obsah .ini souboru (ponechano na backendu)
- **Max 5 MB** — omezeni velikosti je jen ve frontendu (hintMax5mb), backend muze mit jiny limit
- **Bez drag & drop** — presety nelze prerazovat pretazenim, poradi se nastavuje ciselne
- **Bez hromadnych operaci** — neni mozne smazat/editovat vice presetu najednou
- **Material list zavisly na pricing config** — dostupne materialy pro linking se nacitaji z `loadPricingConfigV3()`, pokud pricing config neni inicializovany, material select bude prazdny
- **Toast casovac** — toast zpravy zmizi po 2.6 sekundach bez moznosti prodlouzeni

---

## 11. Backend API endpointy

### 11.1 Prehled

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/presets` | Seznam vsech presetu |
| POST | `/api/presets` | Upload noveho presetu (multipart) |
| PATCH | `/api/presets/:id` | Aktualizace metadata presetu |
| DELETE | `/api/presets/:id` | Smazani presetu |
| POST | `/api/presets/:id/default` | Nastaveni vychoziho presetu |
| GET | `/api/widget/presets` | Presety pro verejny widget (filtrovany pohled) |

### 11.2 Spolecne hlavicky

Vsechny requesty automaticky pridavaji:
- `x-tenant-id: <tenantId>` — tenant identifikace
- `Accept: application/json`
- `Content-Type: application/json` — pro JSON body (ne pro multipart)

### 11.3 Odpovedi

Strukturovany format:

```javascript
// Uspech
{ ok: true, data: { presets: [...], defaultPresetId: "..." } }

// Chyba
{ ok: false, errorCode: "API_ERROR", message: "...", status: 400, details: {...} }
```

Klient `apiFetch()` normalizuje i alternativni formaty:
- `{ success: false, error: "..." }` -> `{ ok: false, ... }`
- HTTP error bez JSON -> `{ ok: false, errorCode: "HTTP_404", ... }`
- Network error -> `{ ok: false, errorCode: "NETWORK_ERROR", message: "Backend unreachable" }`

### 11.4 Upload (multipart)

```javascript
const form = new FormData();
form.append('file', file);                           // File objekt (.ini)
form.append('name', 'PLA Standard');                 // Volitelny nazev
form.append('order', '10');                          // Poradi (string)
form.append('visibleInWidget', 'true');              // Widget viditelnost (string "true"/"false")
```

Poznamka: `material_key` a `print_overrides` se v aktualnim multipart uploadu NEPOSILAJI.
Tyto hodnoty se nastavuji naslednym PATCH volanim.

---

## 15. Storage architektura

### 15.1 Tenant izolace

Presety se ukladaji pod tenant-scoped klicem:

```
modelpricer:<tenantId>:presets:v1
```

Klic se vytvari pres `readTenantJson(LOCAL_FALLBACK_NAMESPACE, [])` a
`writeTenantJson(LOCAL_FALLBACK_NAMESPACE, {...})` z `adminTenantStorage.js`.

### 15.2 Supabase integrace

`adminTenantStorage.js` automaticky kontroluje feature flags:
- `localStorage` mode (default) — jen localStorage
- `dual-write` mode — localStorage + Supabase fire-and-forget
- `supabase` mode — Supabase jako primarni zdroj, localStorage jako sync backup

AdminPresets pouziva sync API (`readTenantJson`/`writeTenantJson`), takze:
- Cteni je vzdy z localStorage (sync, rychle)
- Zapis jde do localStorage + Supabase fire-and-forget (pokud je rezim dual-write/supabase)

### 15.3 Idempotence zapisu

`writeLocalFallback()` se vola:
1. Po kazdem uspesnem `load()` z backendu — cache server stavu
2. V useEffect pri offline zmene — perzistence lokalnich zmen
3. Zapisuje se vzdy cely stav (`{ presets, defaultPresetId }`)

Funkce `writeTenantJson` provadi `JSON.stringify` pri kazdem volani,
takze identicka data generuji identicky retezec (implicitni idempotence).

### 15.4 Legacy format migrace

`readLocalFallback()` podporuje 3 formaty:
1. **Pole** — `[preset1, preset2]` (stary format bez defaultPresetId)
2. **Objekt s `presets`** — `{ presets: [...], defaultPresetId: "..." }` (aktualni format)
3. **Objekt s `items`** — `{ items: [...] }` (alternativni backend format)

Pro `defaultPresetId` kontroluje:
1. `raw.defaultPresetId` (string) na top-level objektu
2. `is_default_selected` property na jednotlivych presetech (legacy flag)

---

## 16. UI prvky a design

### 16.1 Layout

- **Header** — nadpis "Presety" s online/offline statusem + refresh tlacitko
- **Offline banner** — cerveny box s ikonou WifiOff a popisem (zobrazeny jen v offline rezimu)
- **Upload card** — 6-sloupcovy grid s upload formularem
- **Tabulka presetu** — sortovana dle order (sestupne), pak name (abecedne)
- **ForgeDialog** — editacni dialog s 2 sekcemi (Metadata + Print overrides)
- **Delete modal** — konfirmacni dialog pro smazani vychoziho presetu
- **Toast** — fixed position (right bottom), 2.6s auto-dismiss

### 16.2 Tabulka

| Sloupec | Sirka | Obsah |
|---------|-------|-------|
| Nazev | auto | Editovatelny input + badges (Default/Visible/Material) + ID |
| Poradi | 120px | Number input |
| Material | 160px | Select dropdown (All / konkretni material) |
| Widget | 160px | ForgeCheckbox (true/false) |
| Akce | 300px | 3 tlacitka: Ulozit / Nastavit jako vychozi / Smazat |

### 16.3 Badges

| Badge | Barva | Kdy se zobrazuje |
|-------|-------|------------------|
| Vychozi (Default) | green | Preset je nastaveny jako vychozi |
| Viditelny (Visible) | blue | `visibleInWidget === true` |
| Material name | blue | `material_key !== null` (zobrazuje nazev materialu) |

### 16.4 Status indikator

| Stav | Barva tecky | Text |
|------|-------------|------|
| Online | zelena (`--forge-success`) | "Online" |
| Offline | cervena (`--forge-error`) | "Offline" |

### 16.5 Responsive design

Upload grid prechazi na 1 sloupec pod 980px (`@media (max-width: 980px)`).
Tabulka ma horizontalni scroll (`overflow: auto` na `.tableWrap`).

---

## 17. State management

### 17.1 Hlavni state

| State | Typ | Popis |
|-------|-----|-------|
| `loading` | boolean | Indikator nacitani |
| `offlineMode` | boolean | Offline rezim aktivni |
| `backendError` | string | Chybova zprava z backendu |
| `presets` | array | Seznam normalizovanych presetu |
| `defaultPresetId` | string/null | ID vychoziho presetu |
| `availableMaterials` | array | Materialy z pricing config |
| `toast` | object/null | Aktualni toast zprava `{ kind, msg }` |

### 17.2 Upload state

| State | Typ | Popis |
|-------|-----|-------|
| `uploadFile` | File/null | Vybrany .ini soubor |
| `uploadName` | string | Nazev presetu |
| `uploadOrder` | number | Poradi |
| `uploadVisibleInWidget` | boolean | Widget viditelnost |
| `uploadMaterialKey` | string/null | Prirazeny material |
| `uploading` | boolean | Upload probiha |

### 17.3 Edit state

| State | Typ | Popis |
|-------|-----|-------|
| `edits` | object | Mapa `{ [presetId]: { name, order, visibleInWidget, material_key } }` |
| `savingById` | object | Mapa `{ [presetId]: boolean }` — ulozeni probiha |
| `defaultingById` | object | Mapa `{ [presetId]: boolean }` — nastavovani default probiha |
| `deletingById` | object | Mapa `{ [presetId]: boolean }` — mazani probiha |

### 17.4 Dialog state

| State | Typ | Popis |
|-------|-----|-------|
| `editingPresetId` | string/null | ID presetu v dialogu |
| `presetDraft` | object/null | Draft `{ name, order, visibleInWidget, material_key, print_overrides }` |

### 17.5 Delete modal state

| State | Typ | Popis |
|-------|-----|-------|
| `deleteModal` | object | `{ open: boolean, presetId: string/null }` |

### 17.6 useEffect hooks

| useEffect | Zavislosti | Ucel |
|-----------|-----------|------|
| `load()` | `[]` (mount) | Pocatecni nacteni presetu z backendu |
| Sync edits | `[presets]` | Synchronizace edits state s novym seznamem presetu |
| Offline persist | `[offlineMode, loading, presets, defaultPresetId]` | Ulozeni zmen do localStorage v offline rezimu |
| Toast cleanup | `[]` (mount) | Cisteni timeout timeru pri unmount |
| Modal scroll | `[deleteModal.open]` | Zamezeni scrollovani body pri otevrenem modalu |
