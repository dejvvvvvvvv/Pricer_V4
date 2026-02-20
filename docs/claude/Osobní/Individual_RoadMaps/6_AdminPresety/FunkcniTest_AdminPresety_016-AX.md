# Funkcni Test Report: Admin Presets

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Presets — sprava .ini presetu pro PrusaSlicer CLI |
| **Route** | `/admin/presets` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 016-AX |
| **Screenshot slozka** | Fotky_AdminPresety-016-AX |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Upload form nahore, tabulka presetu pod nim |
| 1.3 | Dark theme | OK | Konzistentni Forge dark |
| 1.4 | ONLINE badge | OK | Zeleny "ONLINE" badge u nadpisu — slicer backend je dostupny |

---

## 2. Funkcni testy

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a status | Presety s online indikacii | "Presety" + zeleny "ONLINE" badge | OK |
| 2.2 | Popis | Info o INI presety | "Sprava presetu (.ini) ulozenych na serveru. Presety se pouzivaji pro slicovani v PrusaSlicer CLI." | OK |
| 2.3 | Upload formular | Soubor, nazev, poradi, material | SOUBOR (.INI) file picker, NAZEV input, PORADI input (0), MATERIAL dropdown ("Vsechny materi...") | OK |
| 2.4 | "Viditelny ve widgetu" checkbox | Toggle viditelnosti | Checkbox zaskrtnuty (zeleny) | OK |
| 2.5 | "Nahrat preset" tlacitko | Upload noveho presetu | Zelene tlacitko pritomne | OK |
| 2.6 | "Obnovit" tlacitko | Refresh seznamu | Pritomne v pravem hornim rohu | OK |

---

## 2b. Seznam presetu

| # | Nazev | Poradi | Material | Widget | Stav | ID |
|---|-------|--------|----------|--------|------|-----|
| 1 | Creality K1 & K1C - PLA | 2 | Vsechny | true | Viditelny | p_TNFIhpzIkdQUSQ97 |
| 2 | test_config_V2 | 1 | Vsechny | true | Viditelny | p_NUOsJIajNxizqUyM |
| 3 | Default | 0 | Vsechny | true | Vychozi + Viditelny | p_GcV63HMs... |

---

## 2c. Akce u kazdeho presetu

| # | Akce | Popis | Stav |
|---|------|-------|------|
| 1 | Ulozit zmeny | Ulozi editace poradi/materialu | Tlacitko pritomne u kazdeho presetu |
| 2 | Nastavit jako vychozi | Zmeni vychozi preset | Tlacitko pritomne |
| 3 | Smazat | Smaze preset | Cervene tlacitko pritomne |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Testovaci nazev "test_config_V2" — neprofesionalni pro demo | Prejmenovat |
| 2 | INFO | Vsechny presety maji material "Vsechny" — zadna per-material demonstrace | Pridat preset prirazeny konkretnimu materialu |

---

## 4. Pozitivni nalezy

- **ONLINE badge** — zeleny tag s teckou vedle nadpisu "Presety" — jasna indikace ze slicer backend bezi
- **Upload formular** v tmavem radku: SOUBOR (.INI) file picker s "Choose File" buttonem, NAZEV text input, PORADI ciselny input (0), MATERIAL dropdown, "Viditelny ve widgetu" checkbox (zeleny check), zeleny "Nahrat preset" button
- **Tabulka presetu:** 5 sloupcu — NAZEV, PORADI, MATERIAL, WIDGET, AKCE — tmave pozadi s alternujicimi radky
- **3 presety zobrazeny:** Creality K1 & K1C (poradi 2), test_config_V2 (poradi 1), Default (poradi 0, "Vychozi" zeleny tag)
- **Viditelny link** u kazdeho presetu s zelenym "Viditelny" textem a ID (p_TNF..., p_NUO..., p_GcV...)
- **Per-preset akce** — "Ulozit zmeny", "Nastavit jako vychozi", "Smazat" (cervene) — vsechny na jednom radku
- **Widget viditelnost:** zelena checkbox ikona "true" u kazdeho presetu
- **"Obnovit" button** (outline) v pravem hornim rohu vedle ONLINE badge
- **Material prirazeni** — vsechny presety ukazuji "Vsechny" — per-material prirazeni je pripravene ale nepouzite
- Sidebar: Presets zvyraznen zelenou, konzistentni admin navigace

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — upload formular, 3 presety v tabulce, sidebar | `Fotky_AdminPresety-016-AX/AdminPresets-016-AX.png` |
| 2 | Presets stranka — upload form + 3 presety | ss_34299if53 |

---

## 6. Doporuceni pro RoadMap

### Vizualni vylepseni
- [ ] Prejmenovat testovaci preset "test_config_V2" na profesionalni nazev (napr. "Standard Quality")
- [ ] Pridat per-material prirazeni u aspon jednoho presetu pro demonstraci
- [ ] Pridat popis/popis ke kazdemu presetu — momentalne jen nazev a ID

### Funkcni rozsireni
- [ ] Pridat preset preview — zobrazeni klicovych parametru z .ini souboru bez nutnosti stahovani
- [ ] Pridat drag&drop razeni presetu (misto manualniho "poradi" cisla)
- [ ] Pridat "Duplikovat preset" akci
- [ ] Batch operace — smazat vice presetu najednou

### i18n
- [ ] Prelozit hardcoded texty ("Sprava presetu", "Nahrat preset", atd.) do EN

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 4/5 | Prehledne, tag system |
| Funkcnost | 4/5 | Upload, CRUD, vychozi nastaveni |
| UX/pouzitelnost | 4/5 | Jednoduche, intuitivni |
| Stabilita | 5/5 | Zadne chyby specificky pro tuto stranku |
| **Celkem** | **17/20** | Solidni implementace |

---

> Vygenerovano: 2026-02-20, Test session: S01
