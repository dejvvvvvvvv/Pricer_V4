# Funkcni Test Report: Admin Orders (Objednavky)

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Orders — seznam objednavek, filtry, Kanban, detail objednavky, export |
| **Route** | `/admin/orders` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 018-AO |
| **Screenshot slozka** | Fotky_AdminOrders-018-AO |
| **Stav** | FUNKCNI (s demo daty) |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | 32 objednavek zobrazeno |
| 1.2 | Layout je spravny | OK | Search, filtry, tabulka, paginace |
| 1.3 | Dark theme konzistence | OK | Forge dark, zelene status tagy |
| 1.4 | Subtitle | OK | "Rychly prehled objednavek, filtru a audit logu. (Demo Varianta A)" |

---

## 2. Funkcni testy — Seznam objednavek

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Search bar | Vyhledavani | "Hledat: order ID, soubor, jmeno, email..." — placeholder pritomny | OK |
| 2.2 | STATUS filtry | Filtrace dle stavu | 10 statusu: NOVA, KONTROLA, SCHVALENO, TISKNE SE, POSTPROCESS, PRIPRAVENO, ODESLANO, HOTOVO, ZRUSENO | OK |
| 2.3 | MATERIAL filtry | Filtrace dle materialu | 3 materialy: ABS, PETG, PLA | OK |
| 2.4 | PRESET filtry | Filtrace dle presetu | 3 presety: BASIC, DETAIL, STANDARD | OK |
| 2.5 | FLAGS filtry | Filtrace dle flagu | 4 flagy: OUT_OF_BOUNDS, SLICER_FAILED, MISSING_SLICER_DATA, INVALID_CONFIG | OK |
| 2.6 | Datumovy rozsah | OD-DO filtry | dd.mm.rrrr date pickery pritomne | OK |
| 2.7 | Razeni | Dropdown | "Nejnovejsi" — aktivni razeni | OK |
| 2.8 | Pocet zobrazenych | Counter | "Zobrazeno: 32" | OK |
| 2.9 | Reset filtru | Tlacitko | "Reset filtru" pritomne | OK |
| 2.10 | Table/Kanban toggle | View prepinac | 2 ikony (Table aktivni zelena, Kanban) | OK |
| 2.11 | Export CSV | Tlacitko | "Export CSV" — pritomne | OK |
| 2.12 | Kanban prepnuti | Klik na Kanban ikonu | **Neprepnulo se** — view zustala na Table | FAIL |

---

## 2b. Tabulka objednavek

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.13 | Sloupce tabulky | Vsechny informace | ORDER ID, CREATED, CUSTOMER, MODELS/PCS, MATERIAL(S), PRINT TIME, WEIGHT, TOTAL, STATUS, FLAGS, Open | OK |
| 2.14 | Paginace | Strankovani | "Strana 1 / 3" s "Predchozi" a "Dalsi" — 3 stranky, funguje | OK |
| 2.15 | Realisticka demo data | Ruzne statusy a zakaznici | Ruzne: NOVA, KONTROLA, SCHVALENO, TISKNE SE, POSTPROCESS, PRIPRAVENO, ODESLANO, HOTOVO — realisticke jmena (Firma ABC s.r.o., Petr Svoboda, Eva Dvorakova) | OK |
| 2.16 | Ceny | Spravne zobrazeni | Od 0.00 Kc az po 6883.70 Kc — zelene cisla | OK |
| 2.17 | Materialy v objednavkach | Vice materialu | ABS, PLA, PETG a kombinace (PETG+PLA+ABS) | OK |
| 2.18 | Cas tisku | Zobrazeni | Od 0 min po 25h 50m — formatovano lidsky | OK |
| 2.19 | Hmotnost | Zobrazeni | Od 0g po 565.85g | OK |

---

## 2c. Order Detail Modal

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.20 | Modal otevreni | Klik na "Open" | Modal se otevrel s ID objednavky a NEW tagem | OK |
| 2.21 | 3 taby | Customer, Shipping, Items + Files | Vsechny 3 taby pritomne a prepinatelne | OK |
| 2.22 | Status badge | Zeleny NEW tag | Zobrazen vedle ID objednavky | OK |
| 2.23 | Status change ikona | Zmena statusu | Zelena check ikona vedle status badge | OK |

---

## 2d. Order Detail — Tab Customer

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.24 | NAME | Jmeno zakaznika | "12" (testovaci) — s copy ikonou | OK |
| 2.25 | EMAIL | Email zakaznika | "david.kunak@seznam.cz" — s copy ikonou | OK |
| 2.26 | PHONE | Telefon | "123456789" — s copy ikonou | OK |
| 2.27 | COMPANY | Firma | "fsffsdf" (testovaci) — s copy ikonou | OK |
| 2.28 | INTERNAL NOTES | Poznamky | Textarea "Add a note..." s "Save" tlacitkem | OK |
| 2.29 | ACTIVITY | Audit log | 2 zaznamy: "13. 02. 19:31 CREATED -> NEW", "13. 02. 19:31 FILES_SAVED" | OK |

---

## 2e. Order Detail — Tab Shipping

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.30 | Dorucovaci adresa | Adresni blok | "sfddfsd, sfsdfsef, 22525, Ceska republika" | OK |
| 2.31 | SHIPPING LABEL PREVIEW | Nahled stitku | Dashed border box s: jmeno, firma, ulice, PSC mesto, zeme, telefon | OK |

---

## 2f. Order Detail — Tab Items + Files

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.32 | Model tabulka | Seznam polozek | 2 modely: cilinder_for_magnet_v2.stl (PLA, 1ks, 1h 8m, 2.28g, 0.00 Kc) a small-leg.stl (PLA, 1ks, 2h 13m, 4.96g, 0.00 Kc) | OK |
| 2.33 | Download ikona | Stazeni modelu | Zelena download ikona u kazdeho modelu | OK |
| 2.34 | STORAGE badge | Stav uloziste | "READY" zeleny badge | OK |
| 2.35 | Open Folder | Tlacitko | Pritomne | OK |
| 2.36 | Download ZIP | Tlacitko | Zelene tlacitko "Download ZIP" | OK |
| 2.37 | FILE MANIFEST | Seznam vsech souboru | **7 souboru:** 2x MODEL (.stl, 71.6 KB + 60.3 KB), 2x GCODE (.gcode, 3.1 MB + 3.7 MB), 3x META (.json: order-meta, file-manifest, pricing-snapshot) | OK |
| 2.38 | Typ souboru tagy | Barevne rozliseni | MODEL (zeleny), GCODE (zeleny), META (modry) tagy | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | P2 | **Kanban view se neprepina** — klik na druhou ikonu nema efekt, zustava Table view | Overit event handler na Kanban toggle |
| 2 | P2 | Prvni objednavka (realna) ma testovaci data: jmeno "12", firma "fsffsdf", adresa "sfddfsd" | Neovlivnuje funkcnost, jen demo |
| 3 | P2 | Ceny u realne objednavky jsou 0.00 Kc — pricing engine nepocital (pravdepodobne slicer data chybela) | Overit propojeni kalkulacka -> objednavka |
| 4 | INFO | Kanban board (dle roadmapu 75% hotov) nelze overit vizualne | Nutny debug Kanban prepinace |
| 5 | INFO | Export CSV netestovan (nechteme generovat soubory pri testovani) | Manualni test |

---

## 4. Pozitivni nalezy

- **32 demo objednavek** s realistickymi daty — ruzne statusy, zakaznici, materialy, casy
- **Rozsahly filtr system** — 10 statusu, 3 materialy, 3 presety, 4 flagy, datumovy rozsah, razeni
- **3 stranky paginace** — dobre pro velke objemy
- **Order Detail Modal** je propracovany — 3 taby (Customer, Shipping, Items + Files)
- **File Manifest** ukazuje kompletni strukturu: MODEL + GCODE + META soubory s velikostmi
- **STORAGE: READY** badge — jasna indikace ze soubory jsou pripraveny
- **Download ZIP** a **Open Folder** — uzitecne pro spravu souboru
- **Activity audit log** — zaznamenava CREATED->NEW a FILES_SAVED udalosti
- **SHIPPING LABEL PREVIEW** — vizualni nahled dorucovacich stitku
- **Copy ikony** u zakaznickych udaju — rychle kopirovani do schranky
- **Internal Notes** — textarea pro interni poznamky k objednavce
- **Barevne status tagy** — NOVA (zelena), SCHVALENO (zelena), POSTPROCESS (zelena), HOTOVO (zelena), ODESLANO (zelena), PRIPRAVENO (zelena)
- **Flags system** — OUT_OF_BOUNDS, SLICER_FAILED, MISSING_SLICER_DATA, INVALID_CONFIG

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Orders tabulka, filtry, 28 objednavek, paginace, export | `Fotky_AdminOrders-018-AO/AdminOrders-018-AO.png` |
| 2 | Table view — search, filtry, prvni objednavka | ss_8177j3krh |
| 3 | Table view — scroll dolu, objednavky + paginace 1/3 | ss_60720scmb |
| 4 | Kanban toggle pokus (view se neprepnula) | ss_8140lp0np |
| 5 | Order Detail — Customer tab (jmeno, email, poznamky, activity) | ss_5880uk5w1 |
| 6 | Order Detail — Shipping tab (adresa + label preview) | ss_2232fldso |
| 7 | Order Detail — Items + Files tab (modely, GCODE, manifest) | ss_0070e98zs |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Kriticke opravy (VYSOKA priorita)
- [ ] **P2:** Opravit Kanban view prepinani — event handler nereaguje
- [ ] Overit pricing propojeni (0.00 Kc u realne objednavky)

### Faze 2: Dle roadmapu (VYSOKA priorita)
- [ ] Supabase jako datovy zdroj (ukol 1.1)
- [ ] Order numbering system (ukol 1.2 — ORD-2026-XXXXX format)
- [ ] Status machine validator (KD4 — povolene prechody)
- [ ] Backend order processing pipeline (ukol 2.1)

### Faze 3: Rozsireni
- [ ] Rozsireny CSV export (per-item detail)
- [ ] PDF export pro ucetnictvi
- [ ] Print queue management
- [ ] Komunikace se zakaznikem z detailu

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 4/5 | Propracovany filtr system, status tagy, file manifest |
| Funkcnost | 4/5 | Table view, detail modal s 3 taby, paginace — Kanban neprepina |
| UX/pouzitelnost | 4/5 | Intuitivni, copy ikony, shipping label preview |
| Stabilita | 4/5 | Bez specificke chyby krome Kanban toggle |
| **Celkem** | **16/20** | Solidni zaklad, Kanban a pricing propojeni je nutne opravit |

---

> Vygenerovano: 2026-02-20, Test session: S01
