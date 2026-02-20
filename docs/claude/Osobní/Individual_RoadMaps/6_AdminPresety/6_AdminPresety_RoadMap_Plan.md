# 6. Admin — Presety — Detailni RoadMap Plan

> **Stav:** 🟢 82% hotovo | **Priorita:** VYSOKA
> **Zavislosti na jine sekce:** Admin Pricing (#4) — materialy pro linking
> **Kdo na nem zavisi:** Kalkulacka (#1), PrusaSlicer Backend (#2)

---

## Prehled

Admin stranka pro spravu PrusaSlicer presetu (.INI souboru). Firma nahraje sve INI presety z PrusaSliceru, priradi je k materialum a nastavi default preset pro slicovani.

**Hlavni soubor:** `src/pages/admin/AdminPresets.jsx`
**Storage:** `src/utils/adminPresetsStorage.js`
**Backend:** `backend-local/` — preset upload a sprava pres API

---

## Co je HOTOVO (✅)

### INI Upload a sprava (88%)
- [x] Upload .INI souboru z PrusaSliceru
- [x] Parsovani INI obsahu
- [x] CRUD presetu (pridani, editace, smazani)
- [x] Default preset nastaveni (ktery se pouzije kdyz neni specifikovan)
- [x] Offline rezim — zobrazeni ulozenych presetu i bez backendu
- [x] Persist do tenant storage

### Material Linking (75%)
- [x] Zakladni prirazeni presetu ke konkretnim materialum
- [x] Automaticky vyber presetu podle materialu v kalkulacce

---

## Co CHYBI / je potreba dodelat

### Faze 1: Vylepseni material linkingu (Priorita: STREDNI)

#### Ukol 1.1: Validace linked materialu
- **Soubor:** `src/pages/admin/AdminPresets.jsx`
- **Co udelat:**
  - [ ] Overit ze linked material existuje v AdminPricing konfiguraci
  - [ ] Zobrazit varovani pokud linked material byl smazan
  - [ ] Automaticky odebrat neplatne linky pri otevreni
- **Ocekavany rozsah:** 20-30 radku kodu

#### Ukol 1.2: Lepsi UI pro prirazovani
- **Co udelat:**
  - [ ] Multi-select dropdown pro vyber materialu (misto jednotliveho)
  - [ ] Vizualni mapa: ktery preset → ktere materialy
  - [ ] Quick-assign — rychle prirazeni presetu ke vsem materialum stejneho typu
- **Ocekavany rozsah:** 50-80 radku kodu

### Faze 2: Pokrocilejsi INI validace (Priorita: NIZKA)

#### Ukol 2.1: Validace INI obsahu
- **Soubor:** `src/pages/admin/AdminPresets.jsx` + backend
- **Co udelat:**
  - [ ] Overit ze INI obsahuje povinne sekce (print_settings, filament_settings)
  - [ ] Varovat pri chybejicich klicovych parametrech
  - [ ] Zobrazit prehled parametru v INI souboru pred ulozenim
  - [ ] Detekce duplikatu (stejny obsah, jiny nazev)
- **Poznamka:** Toto je "nice to have" — PrusaSlicer sam zvaliduje preset pri slicovani

### Faze 3: i18n doplneni (Priorita: NIZKA)

#### Ukol 3.1: Prelozit chybejici texty
- **Co udelat:**
  - [ ] Audit hardcoded textu
  - [ ] Pridat chybejici klice do LanguageContext
- **Ocekavany rozsah:** 5-10 textu

---

## Implementacni poradi

1. **Faze 1** (Material linking) — 2-3 hodiny
2. **Faze 2** (INI validace) — post-Beta
3. **Faze 3** (i18n) — 1 hodina

**Celkem pro Beta:** ~3-4 hodiny

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/admin/AdminPresets.jsx` | UI vylepseni | Maly-Stredni |
| `src/contexts/LanguageContext.jsx` | Nove klice | Maly |

---

## Poznamky

- Presety jsou **kriticke pro kvalitu slicovani** — spatny preset = spatny vypocet ceny
- Offline rezim je skvely — umoznuje pracovat i kdyz backend neni dostupny
- **TIP:** INI soubory z PrusaSliceru jsou textove, snadno parsovatelne

---

## Kriticke doplnky (z review)

### INI soubor struktura (PrusaSlicer specifika)
- [ ] PrusaSlicer INI soubory maji 3 typy:
  - **Print settings** (`[print:...]`) — vrstvy, infill, rychlost, podpery
  - **Filament settings** (`[filament:...]`) — teplota, material, retrakce
  - **Printer settings** (`[printer:...]`) — rozliseni, extruder, bed size
- [ ] Pro slicovani jsou potreba VSECHNY 3 typy — upozornit firmu pokud nahraje jen 1
- [ ] Klicove parametry pro cenotvorbu z INI:
  - `layer_height` — ovlivnuje cas tisku
  - `fill_density` — ovlivnuje spotrebu materialu
  - `support_material` — pridava cas a material
  - `perimeters` — pocet obvodovych steni
- [ ] Verze kompatibilita: PrusaSlicer 2.7.x vs 2.8.x INI format — overit zpetnou kompatibilitu

### Preset cloning a versioning (post-Beta)
- [ ] Moznost klonovat existujici preset a upravit
- [ ] Version history presetu (co se zmenilo)
- [ ] Rollback na predchozi verzi presetu
