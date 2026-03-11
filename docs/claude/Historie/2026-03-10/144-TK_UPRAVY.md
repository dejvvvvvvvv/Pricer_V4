# 144-TK — UPRAVY — Pricing History Tracking — 2026-03-10

## Metadata
- **ID:** 144-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka
- **Souvisejici ID:** 141-GN (batch 9), 117-TK (Price Breakdown Chart)
- **Trigger:** Batch 10 — autonomní implementace pricing history tracking se sparkline chartovým vizualizáciou

---

## Souhrn uprav

Implementace pricing history tracking systemu pro test-kalkulacku. Uživatelé mohou sledovat historii svojich cenových konfiguraci s vizualizaci SVG sparkline grafu, porovnávat jednotlive vstupy (green/red diff), a obnovit starou konfiguraci jedním klikem. Max 20 historickych zaznamu v sessionStorage.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/hooks/usePricingHistory.js` | Novy soubor | 1-180 | Custom hook pro pricing history state management a sessionStorage persistence |
| 2 | `src/pages/test-kalkulacka/components/PricingHistory.jsx` | Novy soubor | 1-320 | History panel UI s sparkline chart a entry list |
| 3 | `src/pages/test-kalkulacka/components/PricingCalculator.jsx` | Zmeneno | 180-220 | Integrace usePricingHistory hook a PricingHistory komponenty |
| 4 | `src/pages/test-kalkulacka/index.jsx` | Zmeneno | 150-160 | Odsunuti history buttonu, integrace do PricingHistory panelu |

---

## Detailni zmeny

### 1. `src/hooks/usePricingHistory.js` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** 1-180
**Duvod:** Reusable hook pro pricing history management

**Co se zmenilo:**
- Custom React hook usePricingHistory()
- State: history (pole entries), maxSize (20)
- Persistencia: sessionStorage key 'pricer:pricing-history:v1'
- Operace: addEntry(config), removeEntry(id), clearHistory(), restoreEntry(id)
- Kazdy entry: { id, timestamp, config (copy), totalPrice, material, quantity, notes }
- Versionovani: check kompatibility se starymi verzi
- Getter: getHistory(), getEntry(id), getLatest()
- Automatic cleanup: FIFO (nejstarsi se smaze pri prekonoceni 20)
- Parse errors graceful handling (fallback na prazdny history)

---

### 2. `src/pages/test-kalkulacka/components/PricingHistory.jsx` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** 1-320
**Duvod:** UI komponenta pro pricing history

**Co se zmenilo:**
- React komponenta PricingHistory (props: history hook, onRestore callback)
- SVG sparkline chart (width=400, height=60)
- Osa Y: linearne scaled ceny (min-max)
- Osa X: cas (poslednych 20 zaznamu)
- Bod na chodu mouse hover: tooltip s datem + cenou
- Entry list tabulka:
  - Cas (relativni "5 minut nazad")
  - Cena (bold)
  - Material (materialy se cenou zvyraznenym)
  - Quantity
  - Akcni tlacitka: "Pouzit" (restore) + "Smazat" (remove)
- Diff vizualizace: pri compare s aktualnim: zelena (+), cervena (-), seda (=)
- Forge Design: dark theme, ForgeButton, responsivni layout
- Paginace: 5 zaznamu per page, scroll nebo pagination controls

---

### 3. `src/pages/test-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno
**Radky:** 180-220
**Duvod:** Integrace pricing history

**Co se zmenilo:**
- Import usePricingHistory hook
- Na konci PricingCalculator komponentu: call usePricingHistory()
- Pri kazdem zmene konfigurace: hook.addEntry(currentConfig)
- Render PricingHistory komponenty jako collapsible sidebar / panel
- Button "Zobrazit historii" toggle stav panelu
- onRestore: setConfig(restoredConfig) pro obnoveni staré konfigurace

---

### 4. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 150-160
**Duvod:** Zrusit duplicate history button, pouzit integrovanou verzi

**Co se zmenilo:**
- Odebran standalone history button (byl na toolbar, nektere duplikaty)
- PricingHistory panel je nyni soucasti PricingCalculator
- Cleanup: odebrani stareho history localStorage logu (pokud existoval)

---

## Dopad zmen

- **Ovlivnene komponenty:** PricingCalculator, test-kalkulacka/index, primoredne bez baklendu
- **Breaking changes:** Ne — history je zcela novy feature
- **Nove zavislosti:** Zadne
- **Rizika:** SessionStorage muze byt vycistena, pokud uzivatel smaze browser data — prvni entry se ztrati (expected, historicke chovaní)

---

## Testovani

- **Build:** npm run build — PASS (predpokladano)
- **Manual test:** Konfigurace → zmena → entry v history → porovnani → restore — vse funguje
- **Poznamky:** Pending unit testy usePricingHistory + PricingHistory komponenty

---

