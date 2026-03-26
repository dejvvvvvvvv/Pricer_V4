# 268-GN — UPRAVY — General (BK + TK + AO + MS) — 2026-03-24

## Metadata
- **ID:** 268-GN
- **Session:** S01
- **Datum:** 2026-03-24
- **Oblast:** General (Backend Storage + Test-Kalkulacka + Admin Orders + Model Storage)
- **Souvisejici ID:** 264, 265, 266, 267 (predchozi Batch 1-4)
- **Trigger:** Batch 5 z Error LOGu — Preset storage/display, Trash management, Orders delete lock, Review Batch 1-4

---

## Souhrn uprav

Batch 5 implementace ctyr hlavnich tasku: oprava preset storage a zobrazeni v objednavkach, kompletni trash management system (auto-cleanup 20 dni, vysypani kose, per-item mazani), blokovani mazani v Orders/ slozce, a review Batch 1-4 (0 P0, 1 P1 false alarm, 3 P2 minor).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | backend-local/src/storage/storageService.js | Zmeneno | Oprava .ini cesty, deduplikace pres Set, 3 trash funkce |
| 2 | backend-local/src/storage/storageRouter.js | Zmeneno | 3 nove trash endpointy |
| 3 | src/pages/test-kalkulacka/components/CheckoutForm.jsx | Zmeneno | preset_snapshot s kazdym modelem |
| 4 | src/pages/test-kalkulacka/index.jsx | Zmeneno | Predani availablePresets a selectedPresetIds |
| 5 | src/pages/admin/AdminOrderDetail.jsx | Zmeneno | Presety v headeru + per-model sloupec, Orders delete lock |
| 6 | src/utils/storageApi.js | Zmeneno | Trash API funkce (listTrash, emptyTrash, permanentDelete) |
| 7 | src/hooks/useStorageBrowser.js | Zmeneno | Trash state + akce integrace |
| 8 | src/pages/admin/AdminModelStorage.jsx | Zmeneno | Trash UI panel, Orders delete lock |
| 9 | src/components/storage/FileToolbar.jsx | Zmeneno | Trash + delete lock tlacitka |
| 10 | src/components/storage/FileListPanel.jsx | Zmeneno | Trash items zobrazeni, delete lock |
| 11 | src/components/storage/PreviewPanel.jsx | Zmeneno | Orders delete lock indikator |

---

## Detailni zmeny

### 1. `backend-local/src/storage/storageService.js`

**Typ:** Zmeneno
**Duvod:** Task 4.1 Preset Storage Fix + Task 4.5 Trash Management

**Co se zmenilo:**
- Opravena cesta k .ini souborumu pri ukladani presetu
- Deduplikace pres Set pri cteni preset souboru (zabranut duplicitnim zaznamum)
- 3 nove funkce pro trash: moveToTrash(), listTrash(), permanentDelete()
- Auto-cleanup: soubory starsi 20 dni automaticky smazany

---

### 2. `backend-local/src/storage/storageRouter.js`

**Typ:** Zmeneno
**Duvod:** Task 4.5 Trash Management endpointy

**Co se zmenilo:**
- GET /api/storage/trash — seznam souboru v kosi
- DELETE /api/storage/trash — vysypat cely kos
- DELETE /api/storage/trash/:id — permanentne smazat konkretni polozku

---

### 3. `src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**Typ:** Zmeneno
**Duvod:** Task 4.2 Preset Display v objednavce

**Co se zmenilo:**
- Pridani preset_snapshot k datum kazdeho modelu v objednavce
- Preset informace se ukladaji spolecne s order daty

---

### 4. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Duvod:** Task 4.1+4.2 Preset predani do CheckoutForm

**Co se zmenilo:**
- Predani availablePresets a selectedPresetIds jako props do checkout komponenty

---

### 5. `src/pages/admin/AdminOrderDetail.jsx`

**Typ:** Zmeneno
**Duvod:** Task 4.2 Preset Display + Task 4.6 Orders Delete Lock

**Co se zmenilo:**
- Presety zobrazeny v headeru objednavky
- Per-model sloupec s nazvem pouziteho presetu
- ShieldAlert ikona s "Mazani zakazano" pro Orders/ slozku

---

### 6-8. Storage UI soubory (storageApi, useStorageBrowser, AdminModelStorage)

**Typ:** Zmeneno
**Duvod:** Task 4.5 Trash Management + Task 4.6 Orders Delete Lock

**Co se zmenilo:**
- storageApi.js: Nove API funkce listTrash, emptyTrash, permanentDelete
- useStorageBrowser.js: Trash state management, akce pro presun do kose a obnoveni
- AdminModelStorage.jsx: Trash panel v UI, "Vysypat kos" tlacitko, Orders/ blokovani mazani

---

### 9-11. Storage komponenty (FileToolbar, FileListPanel, PreviewPanel)

**Typ:** Zmeneno
**Duvod:** Task 4.5 Trash + Task 4.6 Orders Delete Lock

**Co se zmenilo:**
- FileToolbar.jsx: Tlacitko "Presunout do kose" misto prime mazani, delete lock pro Orders/
- FileListPanel.jsx: Zobrazeni trash polozek s datem smazani, blokovani mazani v Orders/
- PreviewPanel.jsx: ShieldAlert ikona s popiskem "Mazani zakazano" kdyz je soubor v Orders/

---

## Review Batch 1-4

- **0 P0** — zadne kriticke problemy
- **1 P1** (false alarm) — CheckoutForm preset handling je spravne implementovan
- **3 P2** (minor) — drobne stylisticke pripominky bez dopadu na funkcionalitu

---

## Dopad zmen

- **Ovlivnene komponenty:** StorageService (backend), CheckoutForm, AdminOrderDetail, AdminModelStorage, FileToolbar, FileListPanel, PreviewPanel
- **Breaking changes:** Ne — nove funkce jsou aditivni
- **Nove zavislosti:** Zadne
- **Rizika:** Trash auto-cleanup (20 dni) by melo byt overeno v produkci

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Preset storage, trash management, Orders delete lock
- **Poznamky:** Batch 5 kompletni, Review Batch 1-4 OK

---
