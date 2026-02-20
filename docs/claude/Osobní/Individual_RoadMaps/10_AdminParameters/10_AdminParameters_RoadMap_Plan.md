# 10. Admin — Parameters (PrusaSlicer) — Detailni RoadMap Plan

> **Stav:** 🟢 82% hotovo | **Priorita:** VYSOKA
> **Zavislosti na jine sekce:** ZADNE
> **Kdo na nem zavisi:** Presety (#6), PrusaSlicer Backend (#2)

---

## Prehled

Admin stranka zobrazujici kompletni katalog PrusaSlicer parametru (6272 radku dat). Slouzi jako reference pro firmu ktera chce pochopit co jednotlive parametry delaji.

**Hlavni soubor:** `src/pages/admin/AdminParameters.jsx`

---

## Co je HOTOVO (✅)

### Parameter Catalog (90%)
- [x] 6272 radku parametru
- [x] Vsechny PrusaSlicer parametry zobrazeny
- [x] Vyhledavani v parametrech
- [x] Filtrovani podle kategorii
- [x] Kategorizace parametru (print, filament, printer)
- [x] Zobrazeni hodnot a popisu

### Editace a filtrovani (75%)
- [x] Zakladni editace parametru
- [x] Kategorizace

---

## Co CHYBI / je potreba dodelat

### Faze 1: Pokrocile typy parametru (Priorita: NIZKA)

#### Ukol 1.1: Pokrocile editacni typy
- **Soubor:** `src/pages/admin/AdminParameters.jsx`
- **Co udelat:**
  - [ ] Dropdown select pro parametry s enum hodnotami
  - [ ] Range slider pro numericke parametry s min/max
  - [ ] Boolean toggle pro true/false parametry
  - [ ] Textove pole s validaci pro stringove parametry
- **Poznamka:** Pro Beta NENI nutne — firma typicky needituje parametry primo

### Faze 2: i18n (Priorita: NIZKA)

#### Ukol 2.1: Prelozit UI texty
- **Co udelat:**
  - [ ] Audit a prelozit hardcoded texty
  - [ ] Popisy parametru nechat anglicky (jsou z PrusaSliceru)

---

## Implementacni poradi

Obe faze jsou **NIZKE PRIORITY** a mohou byt post-Beta.

**Celkem pro Beta:** ~0 hodin (uz je to dost dobre)

---

## Poznamky

- Tato sekce je prakticky HOTOVA pro Beta
- Editace parametru je riskantni — spatne nastaveni muze zpusobit chyby sliceru
- Referencni katalog je uzitecnejsi nez editace

---

## Kriticke doplnky (z review)

### Parameter kategorii (PrusaSlicer 2.7.x)
- [ ] **Print Settings** (~120 parametru): layer_height, perimeters, fill_density, fill_pattern, support_material, brim, skirt, speed_*, travel_speed
- [ ] **Filament Settings** (~60 parametru): temperature, bed_temperature, cooling, fan_*, filament_type, filament_density, filament_cost
- [ ] **Printer Settings** (~80 parametru): bed_shape, max_print_height, nozzle_diameter, retract_*, gcode_flavor
- [ ] Celkem ~260 unikatnich parametru (6272 radku vcetne popisu a hodnot)

### Pouziti parametru v projektu
- [ ] Parametry se primo NEEDITUJI v admin — jsou referencni
- [ ] Firma pouziva PrusaSlicer na svem PC → exportuje INI → nahraje pres AdminPresets
- [ ] Katalog slouzi jako dokumentace "co ktery parametr znamena"
- [ ] Moznost vyhledavani je klicova (firma hleda konkretni parametr)
