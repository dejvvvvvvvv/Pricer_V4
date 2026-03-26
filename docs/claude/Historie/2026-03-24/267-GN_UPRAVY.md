# 267-GN — UPRAVY — General (AX + BK) — 2026-03-24

## Metadata
- **ID:** 267-GN
- **Session:** S01
- **Datum:** 2026-03-24
- **Oblast:** General (Admin Presets + Backend Storage)
- **Souvisejici ID:** 264, 265, 266 (predchozi Batch 1-3)
- **Trigger:** Batch 4 z Error LOGu — INI Viewer, INI Upload styling, meta folder removal

---

## Souhrn uprav

Batch 4 implementace tri tasku: INI File Viewer modal pro zobrazeni obsahu preset INI souboru se syntax highlightingem, vylepseni INI upload zony s drag&drop a zobrazenim souboru, a odstraneni nepouzivaneho meta/ folderu z order storage struktury.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | src/pages/admin/AdminPresets.jsx | Zmeneno | INI Viewer modal + INI Upload drop-zone styling |
| 2 | backend-local/src/storage/storageService.js | Zmeneno | Zakomentovany meta importy, odstranen meta/ z createOrderFolder |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminPresets.jsx`

**Typ:** Zmeneno
**Duvod:** Task 5.3 — INI File Viewer Modal + Task 5.4 — INI Upload Styling

**Co se zmenilo:**
- **Task 5.3 — INI Viewer Modal:**
  - Pridano tlacitko "Zobrazit INI" s FileText ikonou u kazdeho presetu
  - Modal s max-height 70vh, overflow-y auto, scroll lock na body
  - Syntax highlighting: [section] headers teal bold, komentare (#) italic seda
  - Zavreni pres Escape klavesa + klik na backdrop
- **Task 5.4 — INI Upload Styling:**
  - Drop-zone s UploadCloud ikonou a drag&drop support (onDragOver/onDrop handlery)
  - Zobrazeni vybraneho souboru: nazev, velikost, FileCheck ikona
  - Forge design tokens pouzity pro konzistentni styling

---

### 2. `backend-local/src/storage/storageService.js`

**Typ:** Zmeneno
**Duvod:** Task 4.3 — Remove Meta Folder z order storage

**Co se zmenilo:**
- Zakomentovany importy z metadataBuilder.js (order-meta, file-manifest, pricing-snapshot)
- Odstranen meta/ adresar z createOrderFolder funkce
- Odstranen zapis meta souboru (order-meta.json, file-manifest.json, pricing-snapshot.json)
- Meta folder se jiz nevytvari pri nove objednavce

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminPresets (UI), storageService (backend order creation)
- **Breaking changes:** Ne — meta soubory nebyly cteny nikde v UI
- **Nove zavislosti:** Zadne
- **Rizika:** Minimalni — meta folder nebyl vyuzivan

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** INI viewer modal, drag&drop upload, order creation bez meta/
- **Poznamky:** Batch 4 kompletni

---
