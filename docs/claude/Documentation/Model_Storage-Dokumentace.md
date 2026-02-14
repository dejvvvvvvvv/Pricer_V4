# Model Storage — Dokumentace

> Admin stranka pro prochazeni a spravu souboru objednavek, 3D modelu a firemni knihovny.

---

## 1. Prehled

Model Storage je Drive-like rozhrani v admin panelu (`/admin/model-storage`), ktere umoznuje:

- Prochazeni struktury slozek (Orders, CompanyLibrary, Trash)
- Nahled souboru (metadata + 3D preview pro STL/OBJ/3MF)
- Upload souboru do Company Library
- Vyhledavani souboru
- Stazeni souboru / ZIP export
- Soft delete (presun do kose) a obnoveni
- Vytvoreni a prejmenovani slozek
- Multi-select pro hromadne akce

---

## 2. Architektura

### 2.1 Frontend

```
src/pages/admin/AdminModelStorage.jsx        — Hlavni stranka
src/pages/admin/components/storage/
  FolderTreePanel.jsx    — Levy panel: strom slozek
  FileListPanel.jsx      — Stredni panel: tabulka souboru
  PreviewPanel.jsx       — Pravy panel: metadata + 3D nahled
  BreadcrumbBar.jsx      — Drobeckova navigace
  FileToolbar.jsx        — Horni lista (search, upload, nova slozka, refresh)
src/hooks/useStorageBrowser.js               — State management hook
src/services/storageApi.js                   — API klient (fetch wrapper)
```

### 2.2 Backend

```
backend-local/src/storage/
  storageRouter.js       — Express Router (/api/storage/*)
  storageService.js      — Business logika (browse, create, trash, search, stats)
  checksumUtil.js        — SHA256 helper (Node crypto)
  metadataBuilder.js     — Generovani order-meta.json, file-manifest.json, pricing-snapshot.json
```

### 2.3 Diskova struktura

```
backend-local/storage/
  {tenantId}/
    Orders/
      #000001__abc12345/       — Slozka objednavky
        models/                — Uploadovane 3D modely (STL, OBJ, 3MF)
        gcode/                 — Vygenerovany G-code ze sliceru
        presets/               — Snapshot tiskoveho presetu (.ini)
        meta/
          order-meta.json      — Kompletni data objednavky
          file-manifest.json   — Seznam souboru + SHA256 checksums
          pricing-snapshot.json — Zmrazena cenova konfigurace
    CompanyLibrary/             — Vlastni soubory admina
      Prototypes/
      Fixtures/
    .trash/                     — Soft-deleted soubory
```

---

## 3. API Endpointy

Vsechny endpointy vyzaduji header `x-tenant-id` pro tenant izolaci.

### 3.1 Prochazeni

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| `GET` | `/api/storage/browse?path=<cesta>` | Seznam slozek a souboru |
| `GET` | `/api/storage/search?q=<dotaz>` | Vyhledavani souboru (case-insensitive substring) |
| `GET` | `/api/storage/stats` | Statistiky (pocty souboru, slozek, velikost, pocet objednavek) |

### 3.2 Soubory

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| `GET` | `/api/storage/file?path=<cesta>` | Stazeni souboru (attachment) |
| `GET` | `/api/storage/file/preview?path=<cesta>` | Nahled souboru (inline) |
| `POST` | `/api/storage/zip` | ZIP export vybranych souboru. Body: `{ paths: [...] }` |

### 3.3 Sprava

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| `POST` | `/api/storage/folder` | Vytvoreni slozky. Body: `{ path }` |
| `POST` | `/api/storage/rename` | Prejmenovani. Body: `{ path, newName }` |
| `POST` | `/api/storage/move` | Presun. Body: `{ path, destination }` |
| `POST` | `/api/storage/upload` | Upload do Company Library. Multipart: `files[]` + `targetPath` |
| `DELETE` | `/api/storage/file` | Soft delete (presun do .trash/). Body: `{ path }` |
| `POST` | `/api/storage/restore` | Obnoveni z kose. Body: `{ trashPath }` |

### 3.4 Objednavky

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| `POST` | `/api/storage/orders` | Vytvoreni slozky objednavky. Multipart: `orderData` (JSON) + `models[]` (soubory) |

---

## 4. Spusteni backendu

Backend musi bezet aby Model Storage fungoval:

```bash
cd backend-local
npm install          # pouze poprve (nainstaluje archiver atd.)
node src/index.js    # spusti na portu 3001
```

Vite dev server automaticky proxuje `/api/*` na `http://127.0.0.1:3001` (viz `vite.config.mjs`).

### Environment promenne (volitelne)

| Promenna | Default | Popis |
|----------|---------|-------|
| `PORT` | `3001` | Port backendu |
| `STORAGE_ROOT` | `backend-local/storage` | Koren pro uloziste souboru |
| `SLICER_WORKSPACE_ROOT` | `C:\modelpricer\tmp` (Win) / `/tmp/modelpricer` (Linux) | Pracovni adresar sliceru |
| `WORKSPACE_ROOT` | `C:\modelpricer\tmp` (Win) | Pracovni adresar pro slicer joby |

---

## 5. UI komponenty

### 5.1 FolderTreePanel (levy panel, 240px)

- Strom slozek s expand/collapse animaci
- Tri top-level polozky: Orders, CompanyLibrary, Trash
- Lazy loading podslozek (dotazuje se API az po rozkliknuti)
- Ikonky: ShoppingCart (Orders), Library (CompanyLibrary), Trash2 (Trash)
- Top-level polozky maji vzdy viditelnou sipku (alwaysExpandable)

### 5.2 FileListPanel (stredni panel, flex)

- Tabulka souboru s razenim dle: Name, Size, Modified, Type
- Slozky vzdy prvni (pred soubory)
- Checkbox pro multi-select (Shift+Click, Ctrl+Click)
- Klik na slozku = navigace dovnitr
- Prave tlacitko mysi = kontextove menu

### 5.3 PreviewPanel (pravy panel, 320px, toggle)

- Zobrazuje metadata vybraneho souboru (velikost, datum, typ, cesta)
- 3D nahled pro STL/OBJ/3MF soubory (Three.js)
- Akce: Stahnout, Smazat
- Skryvatelny pres tlacitko "Preview" v headeru

### 5.4 BreadcrumbBar

- Drobeckova navigace: Root > Orders > #000001__abc12345 > models
- Klik na segment = navigace na danou uroven

### 5.5 FileToolbar

- Vyhledavaci pole (debounced, vola GET /api/storage/search)
- Upload tlacitko (react-dropzone)
- Nova slozka tlacitko (prompt pro nazev)
- Refresh tlacitko
- Bulk akce kdyz jsou vybrane soubory: Stahnout, Smazat

---

## 6. Deep Linking

Model Storage podporuje URL parametr `?path=<cesta>` pro prime otevreni slozky:

```
/admin/model-storage?path=Orders/#000001__abc12345/models
```

Tato funkce je vyuzivana z OrderDetailModal — tlacitko "Open folder" naviguje na prislusnou slozku objednavky.

---

## 7. Bezpecnost

### 7.1 Path traversal ochrana

- Vsechny klientske cesty prochazi `sanitizePath()` — blokuje `..`, absolutni cesty, null byty
- `assertWithinRoot()` — overuje ze vysledna cesta je uvnitr tenant rootu
- Zadne symlinky, zadne shell expanze

### 7.2 Tenant izolace

- Kazdy tenant ma vlastni adresar: `{STORAGE_ROOT}/{tenantId}/`
- Tenant ID se cte z headeru `x-tenant-id`
- Soubory jednoho tenanta nejsou pristupne jinemu

### 7.3 Upload limity

- Maximalni velikost souboru: 250 MB
- Povolene formaty pro objednavky: `.stl`, `.obj`, `.3mf`, `.amf`, `.step`, `.stp`
- Company Library: bez omezeni formatu
- Nazvy souboru sanitizovany: `[^a-zA-Z0-9._-]` → `_`

---

## 8. Trash (kos)

- Soft delete: soubor se presune do `.trash/` s encodovanym nazvem
- Format trash nazvu: `{ISO timestamp}___{encoded_original_path}`
- Path separatory `/` se nahrazuji `___`
- Obnoveni dekoduje puvodni cestu a vytvori chybejici rodicovske slozky
- Trash se v normalnim browse nezobrazuje (filtrovany v `browseFolder`)

---

## 9. Zname omezeni

- **Zadny grid view** — pouze tabulkovy (list) rezim
- **Zadny drag & drop** pro presun souboru (pouze pro upload)
- **Zadne RBAC** — vsichni admin uzivatele maji plny pristup
- **Zadne quotas** — bez limitu na velikost uloziste
- **Zadna retencni politika** — automaticke mazani neni implementovano
- **Vyhledavani pouze dle nazvu** — ne fulltext v obsahu souboru
- **ZIP** vyzaduje balicek `archiver` (npm install v backend-local)
