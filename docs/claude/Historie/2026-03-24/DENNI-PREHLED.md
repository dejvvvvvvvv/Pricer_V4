# DENNI PREHLED — 2026-03-24

## Sessions

| Session | Tema | Hlavni ukoly |
|---------|------|-------------|
| S01 | Batch 1 Bug Fixes z Error LOGu | PDF download fix, z-index fix, odstraneni Firma z order preview a checkout |
| S01 | Batch 2 Bug Fixes z Error LOGu | Invoice fee calculation fix, status sipky + unlock transitions |
| S01 | Batch 3 Bug Fixes z Error LOGu | Preset editing zjednoduseni + save/load fix, Wizard fees V3 fix, Wizard modal portal fix |
| S01 | Batch 4 Bug Fixes z Error LOGu | INI File Viewer modal, INI Upload styling, Meta folder removal |
| S01 | Batch 5 Bug Fixes z Error LOGu | Preset storage + display fix, Trash management, Orders delete lock, Review Batch 1-4 |
| S01 | Batch 6 Bug Fixes z Error LOGu | 3D Model Preview v Admin Storage (StorageModelViewer.jsx + PreviewPanel lazy import) |

---

## Vsechny soubory historie pro tento den

| ID | Oblast | Typ | Popis | Cesta |
|----|--------|-----|-------|-------|
| 264-GN | General (AO + CO) | UPRAVY | Batch 1: PDF download, z-index, Firma removal (4 tasky, 3 soubory) | 264-GN_UPRAVY.md |
| 265-GN | General (AO + FE) | UPRAVY | Batch 2: Invoice fee calc fix, status sipky + unlock transitions (3 tasky, 3 soubory) | 265-GN_UPRAVY.md |
| 266-GN | General (AX + GN + DS) | UPRAVY | Batch 3: Preset editing + save/load fix, Wizard fees V3 + modal portal (4 tasky, 5 souboru) | 266-GN_UPRAVY.md |
| 267-GN | General (AX + BK) | UPRAVY | Batch 4: INI Viewer modal, INI Upload styling, Meta folder removal (3 tasky, 2 soubory) | 267-GN_UPRAVY.md |
| 268-GN | General (BK + TK + AO + MS) | UPRAVY | Batch 5: Preset storage/display, Trash management, Orders delete lock (4 tasky, ~11 souboru) | 268-GN_UPRAVY.md |
| 269-GN | General (MS + 3D) | UPRAVY | Batch 6: 3D Model Preview (StorageModelViewer + PreviewPanel lazy import, 1 novy + 1 upraveny soubor) | 269-GN_UPRAVY.md |

---

## Souhrn dne

### Co se povedlo
- 4 tasky z Error LOGu implementovany a build PASS (Batch 1)
- PDF stahovani faktury funguje pres html2pdf.js s fallbackem
- Z-index fix pro sticky status card
- Odstraneni duplicitniho pole Firma z dvou mist (order preview + checkout form)
- Invoice faktura nyni zobrazuje vsechny poplatky (fees, express, markup, volume discount, coupon, rounding) (Batch 2)
- Status navigace sipkami + odemceni vsech prechodu stavu (Batch 2)
- Preset editor zjednodusen na 4 pole, opraveno ztraceni material_key (Batch 3)
- Onboarding Wizard fees opraveny na V3 schema + modal createPortal fix (Batch 3)
- INI File Viewer modal se syntax highlightingem ([section] teal bold, komentare italic) (Batch 4)
- INI Upload drop-zone s drag&drop a zobrazenim vybraneho souboru (Batch 4)
- Odstranen nepouzivany meta/ folder z order storage (Batch 4)
- 3D Model Preview v Admin Storage — Three.js viewer (STL/OBJ/3MF), lazy load, teal material (Batch 6)
- Preset storage oprava (.ini cesta, deduplikace) + zobrazeni v objednavkach (Batch 5)
- Trash management system (auto-cleanup 20 dni, vysypani kose, per-item delete) (Batch 5)
- Orders/ delete lock — blokovani mazani ve vsech storage kontextech (Batch 5)
- Review Batch 1-4: 0 P0, 1 P1 (false alarm), 3 P2 minor (Batch 5)

### Problemy a prekazky
- Zadne — vsechny tasky prosly hladce

### Klicova rozhodnuti dne
| # | Rozhodnuti | Kontext |
|---|-----------|---------|
| 1 | html2pdf.js s dynamickym importem + fallback | Zachovava funkcionalitu i pri selhani knihovny |
| 2 | Firma input odstranen jen z kontaktni sekce, toggle "Na firmu" zustan | Firemni udaje nejsou ztraceny, jen nejsou v zakladnim formulari |

---

## Otevrene ukoly (do dalsiho dne)

- [x] Batch 2 z Error LOGu — hotovo
- [x] Batch 3 z Error LOGu — hotovo
- [x] Batch 4 z Error LOGu — hotovo
- [x] Batch 5 z Error LOGu — hotovo
- [x] Batch 6 z Error LOGu — hotovo
- [ ] Overeni html2pdf.js v produkci (ruzne prohlizece)
- [ ] Overeni trash auto-cleanup (20 dni) v produkci

---

## Statistiky dne

- **Pocet sessions:** 1
- **Pocet zaznamu historie:** 6
- **Pocet upravenych souboru (v kodu):** ~25 (11 z Batch 1-3 + 2 z Batch 4 + ~11 z Batch 5 + 1 z Batch 6)
- **Pocet novych souboru (v kodu):** 1 (StorageModelViewer.jsx)
- **Hlavni oblasti:** AO, CO, CF, FE, AX, GN, BK, MS, TK, 3D
