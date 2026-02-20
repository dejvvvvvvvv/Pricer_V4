# Funkcni Test Report: Model Storage

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Model Storage — sprava souboru objednavek, modelu, GCode, presets, company library |
| **Route** | `/admin/model-storage` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 029-MS |
| **Screenshot slozka** | Fotky_ModelStorage-029-MS |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | 3-sloupcovy: strom vlevo, obsah uprostred, preview vpravo |
| 1.3 | Dark theme konzistence | OK | Forge dark |

---

## 2. Funkcni testy — Hlavicka a navigace

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Info | "Model Storage — Browse and manage order files, models, and company library" | OK |
| 2.2 | "Preview" tlacitko | Toggle | Zelene tlacitko v pravem hornim rohu | OK |
| 2.3 | Storage strom | Navigace | 3 sekce: Orders, Company Library, Trash | OK |
| 2.4 | Breadcrumb | Navigace | Home > Orders > #ORD-... — funkcni breadcrumb | OK |
| 2.5 | Search bar | Vyhledavani | "Search files..." — placeholder pritomny | OK |
| 2.6 | Refresh ikona | Obnoveni | Pritomna vedle search baru | OK |

---

## 2b. Root Level — slozky

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.7 | CompanyLibrary | Slozka | FOLDER typ | OK |
| 2.8 | Orders | Slozka | FOLDER typ | OK |
| 2.9 | Tabulka sloupce | Info | NAME, SIZE, MODIFIED, TYPE | OK |
| 2.10 | Preview panel | Prazdny | "Select a file to preview" s ikonou oka | OK |

---

## 2c. Orders slozka

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.11 | Objednavka 1 | Slozka | "#ORD-202602131931-3291__1f130ce7" — FOLDER | OK |
| 2.12 | Order ID format | Spravny | #ORD-{YYYYMMDDHHMI}-{XXXX}__{hash} | OK |

---

## 2d. Detail objednavky — 4 podslozky

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.13 | gcode | Slozka | FOLDER — GCode soubory z PrusaSliceru | OK |
| 2.14 | meta | Slozka | FOLDER — metadata (order-meta, file-manifest, pricing-snapshot) | OK |
| 2.15 | models | Slozka | FOLDER — puvodni STL/3MF soubory | OK |
| 2.16 | presets | Slozka | FOLDER — PrusaSlicer preset .ini soubory | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Jen 1 objednavka v storage — ostatni demo objednavky nemaji soubory | Ocekavane (jen realna objednavka ma soubory) |
| 2 | INFO | Company Library je prazdna | Pridat demo soubory nebo funkci pro upload |
| 3 | INFO | Trash je prazdny | OK |
| 4 | P2 | Route `/model-storage` (bez admin prefix) vraci 404 — jen `/admin/model-storage` funguje | Pridat fallback route nebo redirect |

---

## 4. Pozitivni nalezy

- **Hlavicka:** "Model Storage" s podtitulem "Browse and manage order files, models, and company library", zeleny "Preview" tlacitko v pravem hornim rohu
- **3-sloupcovy file manager layout:** STORAGE strom vlevo (tmave pozadi, odsazena hierarchie), obsah uprostred (tabulka s NAME/SIZE/MODIFIED/TYPE), preview panel vpravo ("Select a file to preview" s ikonou oka)
- **STORAGE strom:** 3 hlavni sekce s ikonami — Orders (kosik), Company Library (sloupcovy graf), Trash (kos) — kazda rozbalovaci se sipkou
- **Stredni panel:** Home breadcrumb (domecek ikona), "Search files..." search bar s lupou + refresh ikona, tabulka se zelenymi sortovacimi hlavickami (NAME zelene = razeni aktivni)
- **Root level slozky:** CompanyLibrary (FOLDER typ, slozka ikona) a Orders (FOLDER typ) — SIZE a MODIFIED prazdne ("—")
- **Breadcrumb navigace** — Home ikona klikatelna pro navigaci zpet
- **Preview panel** — prazdny stav s ikonou oka a "Select a file to preview" textem
- **Order ID format** v nazvu slozky: #ORD-{YYYYMMDDHHMI}-{XXXX}__{hash}
- **Sidebar:** standardni admin navigace, Model Storage neni primo v sidebar (pristup pres URL)

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Model Storage: 3-sloupcovy file manager, strom, obsah, preview | `Fotky_ModelStorage-029-MS/ModelStorage-029-MS.png` |
| 2 | Root level — CompanyLibrary + Orders | ss_4037g299s |
| 3 | Orders slozka — 1 objednavka | ss_5785pqfzm |
| 4 | Detail objednavky — gcode, meta, models, presets | ss_0146kex0k |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Preview content (VYSOKA priorita)
- [ ] STL 3D preview v preview panelu (Three.js)
- [ ] JSON/text preview pro meta soubory
- [ ] GCode line preview s nahledy vrstev

### Faze 2: Company Library (STREDNI priorita)
- [ ] Upload funkcionalita do Company Library
- [ ] Drag-and-drop souboru mezi slozkami
- [ ] Batch operations (smazat, stahnout, presunout)

### Faze 3: Supabase Storage (NIZKA priorita)
- [ ] Migrace z localStorage na Supabase Storage buckety
- [ ] CDN URL pro soubory misto base64

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Cistu file manager layout, 3 sloupce |
| Funkcnost | 4/5 | Funkcni navigace, objednavkova struktura, search |
| UX/pouzitelnost | 4/5 | Intuitivni, breadcrumb, preview panel |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **18/20** | Solidni file manager, Company Library a preview content TODO |

---

> Vygenerovano: 2026-02-20, Test session: S01
