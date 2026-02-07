# V3-S01: Opravy bugu a reaktivni cenotvorba

> **Priorita:** P0 | **Obtiznost:** Stredni | **Vlna:** 1
> **Zavislosti:** Zadne (zakladni sekce, musi byt hotova jako prvni)
> **Odhadovany rozsah:** ~2500 radku zmen (frontend), ~200 radku (admin)

---

## A. KONTEXT

### A1. Ucel a cil

Sekce S01 resi okamzite opravy existujicich bugu a nefunkcnich prvku v zakaznicke kalkulacce
(test-kalkulacka a model-upload). Jednoduche oduvodneni: **pokud zakladni flow nefunguje
spravne, zadna dalsi feature nema smysl**.

Konkretne se jedna o 4 problemy:
1. **Cena se neprepocitava automaticky** pri zmene parametru (material, barva, mnozstvi,
   infill, kvalita, preset, sluzby). Zakaznik musi rucne klikat "Spocitat cenu".
2. **Preset slicovani je globalni** — vsechny modely sdileji jeden preset. Zakaznik
   nemuze nastavit ruzne presety pro ruzne modely.
3. **Rychle predvolby (Basic/Middle/Pro)** jsou nefunkcni — tlacitka nic nedelaji,
   nejsou napojene na skutecne presety z admin panelu.
4. **Sekce "Vysledky slicingu"** na spodku kalkulacky zobrazuje NaN hodnoty a je
   redundantni (informace jsou uz v panelu modelu vpravo).

Business value: Bez techto oprav je produkt pouzitelny jen pro demo, nikoliv pro
realne zakazniky. Kazdy z techto bugu snizuje duveru zakaznika v kalkulacku.

### A2. Priorita, obtiznost, vlna

- **P0** — bez techto oprav je core flow rozbitý. Zadna dalsi sekce (S02-S04) na ne
  nemuze stavet.
- **Obtiznost: Stredni** — vetsi cast je frontend refaktoring (useEffect/debounce),
  zmena datoveho modelu (per-model preset), a odstraneni nefunkcni sekce. Backend
  uz endpointy pro prepocet ceny ma.
- **Vlna 1** — prvni, co se musi implementovat. Vsechny dalsi sekce (kontaktni formular,
  nove formaty, doprava) predpokladaji fungujici cenu a per-model konfiguraci.

### A3. Zavislosti na jinych sekcich

| Smer | Sekce | Typ zavislosti |
|------|-------|----------------|
| **Tato sekce NEZAVISI** na zadne jine | - | - |
| **S02 zavisi na S01** | Kontaktni formular | Potrebuje fungujici cenu pro shrnuti objednavky |
| **S03 zavisi castecne na S01** | Nove formaty | Pouziva per-model konfiguraci z bodu 1.2 |
| **S04 zavisi na S01** | Doprava | Potrebuje spravny celkovy soucet pro "doprava zdarma od X Kc" |

### A4. Soucasny stav v codebase

**Existujici soubory relevantni pro S01:**

| Soubor | Umisteni | Stav |
|--------|----------|------|
| Hlavni kalkulacka | `src/pages/test-kalkulacka/index.jsx` | Funguje, ale preset je globalni, neni auto-prepocet |
| Print konfigurace | `src/pages/test-kalkulacka/components/PrintConfiguration.jsx` | Ma config state, ale zmena netriggeruje prepocet |
| Pricing calculator | `src/pages/test-kalkulacka/components/PricingCalculator.jsx` | Zobrazuje cenu, ale neposlouchá zmeny parametru |
| Model viewer | `src/pages/test-kalkulacka/components/ModelViewer.jsx` | Zobrazuje STL, info o modelu |
| File upload zone | `src/pages/test-kalkulacka/components/FileUploadZone.jsx` | Upload .stl/.obj, simulovany progress |
| Generate button | `src/pages/test-kalkulacka/components/GenerateButton.jsx` | Tlacitko pro manualni slice/prepocet |
| Pricing engine V3 | `src/lib/pricing/pricingEngineV3.js` | Kompletni engine, `calculateOrderQuote()` |
| Pricing storage | `src/utils/adminPricingStorage.js` | `loadPricingConfigV3()`, namespace `pricing:v3` |
| Fees storage | `src/utils/adminFeesStorage.js` | `loadFeesConfigV3()`, namespace `fees:v3` |
| Tenant storage | `src/utils/adminTenantStorage.js` | `readTenantJson()`, `writeTenantJson()`, `getTenantId()` |
| Presets API | `src/services/presetsApi.js` | `fetchWidgetPresets()`, `listPresets()` |
| Slicer API | `src/services/slicerApi.js` | `sliceModelLocal()` |
| Model upload page | `src/pages/model-upload/index.jsx` | Alternativni upload flow |
| Admin Presets | `src/pages/admin/AdminPresets.jsx` | CRUD presetu, viditelnost ve widgetu |
| Admin Fees | `src/pages/admin/AdminFees.jsx` | Sprava poplatku, scope MODEL/ORDER |

**Co uz existuje:**
- `calculateOrderQuote()` v `pricingEngineV3.js` — kompletni pricing pipeline
- `printConfigs` state v `test-kalkulacka/index.jsx` — per-model configs (dict by fileId)
- `selectedPresetId` state — ale globalni, ne per-model
- `availablePresets` a `defaultPresetId` — nactene z backendu
- `feeSelections` — selectable fees state

**Co chybi:**
- Auto-recalculation pri zmene parametru (useEffect + debounce)
- Per-model preset_id v `printConfigs`
- Funkcionalni napojeni "Rychle predvolby" karet na presety
- Moznost nastavit popis/ikonu/poradi presetu v admin panelu
- Odstraneni sekce "Vysledky slicingu"

### A5. Referencni zdroje a konkurence

**OSS knihovny doporucene pro S01:**

| Knihovna | Ucel | Github hvezdy |
|----------|------|---------------|
| **Zustand** (zustand) | Globalni state management pro reaktivni ceny | 48k+ |
| **Jotai** (pmndrs/jotai) | Atomic per-model state | 18k+ |
| **@preact/signals-react** | Ultra-rychle reaktivni signaly | 4k+ |
| **Immer** (immerjs/immer) | Immutable state updates | 27k+ |

**Doporuceni:** Zustand pro globalni stav kalkulacky + Jotai pro per-model state.

**Alternativni pristup (lehci):** Pouzit existujici React useState + useEffect + debounce
bez pridani novych knihoven. Pro MVP staci `lodash.debounce` nebo vlastni hook `useDebounce`.

**Konkurence — jak to resi ostatni:**
- AutoQuote3D: Auto-prepocet s 300ms debounce, per-model konfigurace
- Craftcloud: Okamzita cena pri zmene parametru, loading skeleton
- Xometry: Instant pricing s visual invalidation (seda cena = neaktualni)

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Per-model print config (rozsireni stavajiciho `printConfigs`):**

```json
{
  "file-123": {
    "material": "pla",
    "color": "white",
    "quality": "standard",
    "infill": 20,
    "quantity": 1,
    "supports": false,
    "presetId": "preset_abc",
    "postProcessing": []
  },
  "file-456": {
    "material": "abs",
    "color": "black",
    "quality": "fine",
    "infill": 40,
    "quantity": 3,
    "supports": true,
    "presetId": "preset_xyz",
    "postProcessing": ["sanding"]
  }
}
```

**Rozsireni admin preset schema (namespace `presets:v1`):**

```json
{
  "presets": [
    {
      "id": "preset_abc",
      "name": "Basic",
      "description_widget": "Rychly tisk, nizka kvalita",
      "sort_order": 1,
      "icon": "Zap",
      "visibleInWidget": true,
      "is_default_selected": true
    }
  ],
  "defaultPresetId": "preset_abc",
  "_schema_version": 2
}
```

**Novy klic v preset objektu:**
- `description_widget` (string, max 100 znaku) — kratky popis zobrazeny na karte ve widgetu
- `sort_order` (number) — poradi zobrazeni karet ve widgetu
- `icon` (string, optional) — nazev Lucide ikony pro kartu (napr. "Zap", "Star", "Shield")

**Pricing calculation cache (session-only, ne v localStorage):**

```json
{
  "lastQuote": { /* vysledek calculateOrderQuote() */ },
  "isCalculating": false,
  "lastCalculatedAt": "2026-02-06T10:30:00Z",
  "invalidated": false
}
```

### B2. API kontrakty (endpointy)

**Stavajici endpointy (bez zmen):**

```
POST /api/slice
  Request: { file: File, presetId: string }
  Response: { metrics: { estimatedTimeSeconds, filamentGrams, ... }, modelInfo: { volumeMm3, sizeMm, surfaceMm2 } }

GET /api/presets
  Response: { presets: [...], defaultPresetId: string }
```

**Zmena v slice endpointu — per-model preset:**

```
POST /api/slice
  Request (zmena): {
    file: File,
    presetId: string     // drive globalni, nyni per-model
  }
  Response: beze zmeny
```

**Novy endpoint (nebo rozsireni stavajiciho):**

```
PATCH /api/presets/:id
  Request: {
    description_widget?: string,
    sort_order?: number,
    icon?: string
  }
  Response: { preset: { ...updated } }
```

### B3. Komponentni strom (React)

```
TestKalkulacka (index.jsx)
|-- FileUploadZone
|-- ModelViewer
|   |-- Model (STL renderer)
|   +-- ModelInfo
|-- PrintConfiguration
|   |-- PresetCards         << NOVY: nahrazuje dropdown
|   |   +-- PresetCard      << NOVY: jednotliva karta presetu
|   |-- MaterialSelect
|   |-- ColorPicker
|   |-- QualitySelect
|   |-- InfillSlider
|   |-- QuantityInput
|   |-- SupportsCheckbox
|   +-- PostProcessingOptions
|-- PricingCalculator
|   |-- PriceSummary
|   |-- PriceBreakdown
|   |-- FeesList
|   +-- LoadingOverlay      << NOVY: skeleton/spinner pri prepoctu
|-- GenerateButton
+-- [SMAZANO: SlicingResults]   << bod 1.4
```

**Novy hook `useDebouncedRecalculation`:**

```jsx
// src/pages/test-kalkulacka/hooks/useDebouncedRecalculation.js
import { useEffect, useRef, useCallback } from 'react';

export function useDebouncedRecalculation({
  printConfigs,
  uploadedFiles,
  pricingConfig,
  feesConfig,
  feeSelections,
  onQuoteReady,
  debounceMs = 600,
}) {
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  const recalculate = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    // Synchronni vypocet (pricingEngineV3 je client-side)
    const quote = calculateOrderQuote({
      uploadedFiles,
      printConfigs,
      pricingConfig,
      feesConfig,
      feeSelections,
    });
    onQuoteReady(quote);
  }, [uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(recalculate, debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [recalculate, debounceMs]);

  return { recalculate };
}
```

### B4. Tenant storage namespace

| Namespace | Helper | Pouziti v S01 |
|-----------|--------|---------------|
| `pricing:v3` | `adminPricingStorage.js` | Cteni pricing configu pro prepocet ceny |
| `fees:v3` | `adminFeesStorage.js` | Cteni fees configu pro prepocet ceny |
| `presets:v1` | `adminTenantStorage.js` | Cteni/zapis presetu s novymi poli |
| `orders:v1` | `adminOrdersStorage.js` | Nepouzito v S01 |

Vsechny namespaces pouzivaji vzor `modelpricer:${tenantId}:${namespace}`.

### B5. Widget integrace (postMessage)

**Stavajici postMessage zpravy (bez zmen):**

```js
// Widget -> Parent
{ type: 'MODEL_PRICER_RESIZE', height: number }
{ type: 'MODEL_PRICER_QUOTE_READY', quote: object }

// Parent -> Widget
{ type: 'MODEL_PRICER_CONFIG', config: object }
```

**Nove zpravy pro S01:**

```js
// Widget -> Parent (pri auto-prepoctu)
{
  type: 'MODEL_PRICER_PRICE_UPDATED',
  total: number,
  currency: string,
  modelCount: number,
  isCalculating: boolean
}

// Widget -> Parent (pri zmene presetu)
{
  type: 'MODEL_PRICER_PRESET_CHANGED',
  modelId: string,
  presetId: string,
  presetName: string
}
```

### B6. Pricing engine integrace

`pricingEngineV3.js` se v S01 **nemeni**. Engine uz ma kompletni pipeline:

```
calcBase() -> feeTypeUnitAmount() -> MODEL fees -> percent fees
  -> ORDER fees -> markup -> min order total -> rounding -> total
```

**Jak S01 integruje s enginem:**

1. **Auto-recalculation (bod 1.1):** Pri kazde zmene parametru se zavola
   `calculateOrderQuote()` s aktualizovanymi `printConfigs`. Engine je
   synchronni (client-side), takze debounce staci 300-600ms.

2. **Per-model preset (bod 1.2):** `presetId` v `printConfigs[modelId]`
   ovlivnuje slicovaci API call (ne primo pricing engine). Po slicovani
   se metriky (cas, material, objem) aktualizuji v `uploadedFiles[].result`,
   coz triggerne auto-recalculation.

3. **Rychle predvolby (bod 1.3):** Kliknuti na kartu presetu zmeni
   `printConfigs[modelId].presetId` a spusti re-slice + auto-recalculation.

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-frontend` | Review architektura, schvaleni navrhu | - | P0 |
| `mp-mid-frontend-public` | Hlavni implementace bodu 1.1, 1.2, 1.4 | `test-kalkulacka/index.jsx`, `PrintConfiguration.jsx`, `PricingCalculator.jsx` | P0 |
| `mp-spec-fe-state` | Hook `useDebouncedRecalculation`, per-model state refaktoring | `hooks/useDebouncedRecalculation.js`, `index.jsx` | P0 |
| `mp-spec-fe-forms` | Novy `PresetCards` komponent | `components/PresetCards.jsx` | P1 |
| `mp-mid-frontend-admin` | Admin Presets rozsireni (description, icon, sort_order) | `AdminPresets.jsx` | P1 |
| `mp-spec-fe-animations` | Loading overlay/skeleton pri prepoctu | `components/LoadingOverlay.jsx` | P2 |
| `mp-mid-frontend-widget` | PostMessage integrace, widget embed aktualizace | `WidgetEmbed.jsx`, `WidgetPreview.jsx` | P2 |
| `mp-mid-pricing-engine` | Review, ze engine neni treba menit | `pricingEngineV3.js` | P1 |
| `mp-spec-be-slicer` | Per-model preset v slice API | `slicerApi.js`, backend endpoint | P1 |
| `mp-sr-quality` | Celkovy review po implementaci | - | P0 |
| `mp-spec-test-unit` | Unit testy pro `useDebouncedRecalculation` | `__tests__/` | P1 |
| `mp-spec-test-e2e` | E2E test auto-recalculation flow | `e2e/` | P2 |
| `mp-spec-design-responsive` | Responsive preset cards na mobilech | CSS | P2 |
| `mp-spec-design-a11y` | Keyboard navigace preset karet, ARIA labels | JSX | P2 |

### C2. Implementacni kroky (poradi)

```
KROK 1: [PARALELNE] Priprava
  1a. mp-spec-fe-state: Vytvorit hook useDebouncedRecalculation
  1b. mp-spec-fe-forms: Vytvorit komponent PresetCards + PresetCard
  1c. mp-mid-frontend-admin: Pridat nova pole do AdminPresets (description_widget, sort_order, icon)

KROK 2: [SEKVENCNE po 1a] Auto-recalculation (bod 1.1)
  2a. mp-mid-frontend-public: Integrace hooku do test-kalkulacka/index.jsx
  2b. mp-mid-frontend-public: Pridat loading overlay do PricingCalculator
  2c. mp-mid-frontend-public: Blokace tlacitka "Prejit k vyberu tiskarny" behem prepoctu
  2d. mp-mid-frontend-public: AbortController pro zruseni predchozich requestu

KROK 3: [SEKVENCNE po 1b, 2a] Per-model preset (bod 1.2)
  3a. mp-mid-frontend-public: Presunout presetId do printConfigs[modelId]
  3b. mp-mid-frontend-public: Zmena UI — konfigurace se meni podle vybraneho modelu
  3c. mp-spec-be-slicer: Upravit slice API pro per-model preset
  3d. mp-mid-frontend-public: Zobrazeni nazvu presetu v rozpisu objednavky

KROK 4: [SEKVENCNE po 3a] Rychle predvolby (bod 1.3)
  4a. mp-spec-fe-forms: Napojit PresetCards na realne presety z API
  4b. mp-mid-frontend-public: Odstranit stary dropdown "Preset pro slicovani"
  4c. mp-spec-fe-forms: Selected state, hover efekt, responsive layout
  4d. mp-mid-frontend-public: Kliknuti na kartu triggerne re-slice + auto-recalc

KROK 5: [NEZAVISLE, kdykoli] Odstraneni vysledku slicingu (bod 1.4)
  5a. mp-mid-frontend-public: Najit a smazat sekci "Vysledky slicingu"
  5b. mp-mid-frontend-public: Overit ze smazani nezlomi zadnou logiku

KROK 6: [PO VSEM] Quality gates
  6a. mp-sr-quality: Code review
  6b. mp-spec-test-unit: Unit testy
  6c. mp-spec-test-e2e: E2E testy
  6d. mp-spec-test-build: Build test (npm run build)
```

### C3. Kriticke rozhodovaci body

**RB1: Zustand vs. plain React state?**
- **Moznost A (doporucena pro MVP):** Zustavit u `useState` + custom hook `useDebouncedRecalculation`.
  Vyhodou je nulova nova zavislost. Pricing engine je synchronni, takze staci debounce.
- **Moznost B (pro budoucnost):** Zavest Zustand store. Lepsi pro vice klientu (widget, admin preview).
  Ale zvysuje slozitost a rozsah S01.
- **Doporuceni:** Moznost A pro S01, Zustand v pozdejsi sekci (S09+).

**RB2: Debounce cas — 300ms vs. 600ms vs. 800ms?**
- Slider vyzaduje delsi debounce (uzivatel taha), text inputy kratsi.
- **Doporuceni:** 500ms jako default, 800ms pro slider infill.

**RB3: Preset karty — horizontalni vs. grid layout?**
- Horizontalni: lepsi pro 2-4 presety, ale problematicke pri 5+
- Grid: lepsi skalovani, ale zabere vice mista
- **Doporuceni:** Horizontalni pro <= 4, grid pro 5+. CSS flexbox s `flex-wrap`.

**RB4: Re-slice pri zmene presetu — okamzity vs. lazy?**
- Okamzity: lepsi UX (zakaznik vidi aktualizovane metriky hned)
- Lazy: rychlejsi, ale zakaznik vidi stara data
- **Doporuceni:** Okamzity re-slice s loading indikaci.

### C4. Testovaci strategie

**Unit testy:**
- `useDebouncedRecalculation` — overit debounce logiku, abort, callback
- `PresetCards` — render, klik, selected state, prazdny stav
- `printConfigs` per-model — overit ze zmena jednoho modelu neovlivni druhy

**E2E testy (Playwright/Cypress):**
- Nahrat 2 modely
- Zmenit material u jednoho → cena se aktualizuje do 1s
- Zmenit preset u druheho → re-slice, nova cena
- Overit ze cena prvniho modelu se nezmenila
- Zmenit mnozstvi psanim → debounce, nova celkova cena
- Overit loading skeleton behem prepoctu

**Manualni testy:**
- Edge case: upload 5+ modelu, rychle prepinani mezi nimi
- Edge case: zmena parametru behem probihajiciho slicovani
- Edge case: admin nema zadne presety → sekce se nezobrazi
- Edge case: jen 1 preset → automaticky vyber bez karet
- Mobile: presety na malych obrazovkach

### C5. Migrace existujicich dat

**Presety (namespace `presets:v1`):**
- Stavajici presety nemaji pole `description_widget`, `sort_order`, `icon`.
- Migrace: pri cteni presetu pridat defaulty: `description_widget: ''`, `sort_order: 0`, `icon: null`.
- Zpetna kompatibilita: engine/kalkulacka ignoruji nove pole pokud chybi.

**Print configs:**
- Stavajici `printConfigs` nemaji `presetId` per model.
- Migrace: pri prvnim nacteni pridat `presetId: defaultPresetId` kazdemu modelu.
- Session-only data (ne v localStorage), takze migrace je trivialni.

---

## D. KVALITA

### D1. Security review body

| Oblast | Riziko | Opatreni |
|--------|--------|----------|
| **XSS** | Preset nazvy/popisy z admin panelu renderovane ve widgetu | Escapovani pres React JSX (defaultni), zadne `dangerouslySetInnerHTML` |
| **Input injection** | Uzivatel zadava mnozstvi, material | Vsechny vstupy sanitizovany pres `safeNum()` a `normStrLower()` v pricing engine |
| **AbortController** | Memory leak pri rychlych zmenach | Cleanup v useEffect return, abort predchozich requestu |
| **localStorage overflow** | Velke mnozstvi presetu | Presety ctene z API, ne z localStorage (localStorage je fallback) |
| **Prototype pollution** | JSON.parse preset dat | `normalizePricingConfigEngineShape()` validuje vsechny vstupy |

### D2. Performance budget

| Metrika | Budget | Strategie |
|---------|--------|-----------|
| **Debounce latence** | < 600ms od zmeny do prepoctu | `useDebouncedRecalculation` s 500ms timer |
| **Render time (prepocet)** | < 50ms | `calculateOrderQuote()` je O(n*m) kde n=modely, m=fees, typicky < 10ms |
| **Bundle size (nove)** | < 5kB gzipped | Zadna nova knihovna, jen custom hooks a komponenty |
| **Re-render count** | Max 2 re-rendery na zmenu | `React.memo` na `PresetCard`, `PriceBreakdown` |
| **Memory** | < 1MB pro 20 modelu | Print configs a quote v RAM, zadny velky cache |

### D3. Accessibility pozadavky

| Pozadavek | Implementace |
|-----------|-------------|
| **Keyboard navigace** | Preset karty: Tab pro focus, Enter/Space pro vyber, Arrow keys pro prepinani |
| **Screen readers** | `role="radiogroup"` na PresetCards container, `role="radio"` na kazde karte, `aria-checked` |
| **Loading stav** | `aria-busy="true"` na cenovem panelu behem prepoctu, `aria-live="polite"` pro aktualizaci ceny |
| **Kontrast** | Selected karta: min 4.5:1 kontrast pro text, 3:1 pro border |
| **Focus visible** | Viditelny focus ring na preset kartach |

### D4. Error handling a edge cases

| Stav | Reseni |
|------|--------|
| Zadne presety z API | Sekce PresetCards se nezobrazuje, pouzije se default config |
| Jen 1 preset | Automaticky vyber, karty se nezobrazi (nebo jedna neaktivni karta) |
| Slice API timeout | Zobrazit chybovou hlasku "Prepocet se nezdaril", zachovat posledni platnou cenu |
| NaN z pricing engine | `safeNum()` ve vsech vypoctech, fallback 0 |
| Uzivatel zada mnozstvi 0 | `Math.max(1, ...)` v `calcBase()` |
| Uzivatel zada mnozstvi 999999 | Validace max 1000 kusu na frontend |
| Rychle prepinani modelu | Debounce + AbortController, zadna race condition |
| Admin zmeni presety behem zakaznikovy session | `storage` event listener reloadne presety |
| Preset smazan v adminu behem session | Fallback na default preset, upozorneni "Preset neni dostupny" |

### D5. i18n pozadavky

**Nove prekladove klice (CZ/EN):**

```json
{
  "widget.presets.title": "Rychle predvolby / Quick presets",
  "widget.presets.selected": "Vybrano / Selected",
  "widget.price.calculating": "Pocitam cenu... / Calculating price...",
  "widget.price.outdated": "Cena neaktualni / Price outdated",
  "widget.price.recalculate": "Prepocitat cenu / Recalculate price",
  "widget.preset.default": "Vychozi / Default",
  "widget.preset.unavailable": "Preset neni dostupny / Preset unavailable",
  "admin.presets.descriptionWidget": "Popis pro widget / Widget description",
  "admin.presets.sortOrder": "Poradi zobrazeni / Display order",
  "admin.presets.icon": "Ikona / Icon"
}
```

Formatovani cisel: `Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' })` —
jiz pouzivane v `PricingCalculator.jsx`.

Pouziti: `useLanguage()` hook z `LanguageContext`, funkce `t()`.

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flag `ENABLE_AUTO_RECALC`:**
- Ulozeny v `modelpricer:${tenantId}:feature_flags`
- Default: `true` (zapnuto pro vsechny)
- Admin toggle v "Admin > Widget" nebo "Admin > Obecne"
- Kdyz `false`: zachovat stare chovani s manualnim tlacitkem

**Feature flag `ENABLE_PER_MODEL_PRESET`:**
- Default: `true`
- Kdyz `false`: preset zustava globalni (zpetna kompatibilita)

**Postupne nasazeni:**
1. Merge do `develop` — interni testovani
2. Feature flag `false` na produkci — bez dopadu
3. Zapnout pro 10% tenantu — monitoring chyb
4. Zapnout pro vsechny

### E2. Admin UI zmeny

| Zmena | Stranka | Detail |
|-------|---------|--------|
| Nova pole pro presety | Admin > Presets | `description_widget`, `sort_order`, `icon` |
| Feature flag toggle | Admin > Widget | Zapnout/vypnout auto-prepocet |

**Menu navigace:** Bez zmen v `AdminLayout.jsx` — presety jsou jiz v menu.

### E3. Widget zmeny

| Zmena | Komponenta | Detail |
|-------|-----------|--------|
| Auto-recalculation | `test-kalkulacka/index.jsx` | useEffect + debounce |
| Per-model config | `PrintConfiguration.jsx` | Props zmena: `config` per selected model |
| Preset cards | `PrintConfiguration.jsx` | Nova sekce nahrazujici dropdown |
| Loading overlay | `PricingCalculator.jsx` | Skeleton/spinner behem prepoctu |
| Smazani slicing results | `index.jsx` nebo dedicovana komponenta | Kompletni odstraneni |
| PostMessage | `WidgetEmbed.jsx` | `MODEL_PRICER_PRICE_UPDATED` zprava |

### E4. Dokumentace pro uzivatele

| Dokument | Obsah |
|----------|-------|
| Admin guide: Presets | Jak nastavit popis, ikonu a poradi presetu pro widget |
| Widget changelog | "Cena se nyni prepocitava automaticky pri zmene parametru" |
| API changelog | "Slice endpoint nyni prijima presetId per model" |

### E5. Metriky uspechu (KPI)

| KPI | Cilova hodnota | Mereni |
|-----|---------------|--------|
| **Cas od zmeny parametru do zobrazeni nove ceny** | < 1s (vcetne debounce + vypocet) | Performance monitoring |
| **Pocet manualnich kliknuti na "Prepocitat"** | Pokles o 90%+ | Event tracking |
| **Chybovost NaN v cenach** | 0% | Error logging, Sentry |
| **Konverzni pomer (upload -> objednavka)** | Narust o 5-15% | Analytics |
| **Cas straveny na konfiguraci** | Pokles o 20%+ (rychlejsi preset vyber) | Session analytics |
| **Bounce rate na kalkulacce** | Pokles o 10%+ | Plausible/Umami |
| **Pocet pouziti per-model presetu** | > 30% objednavek s vice modely | Event tracking |
| **Build success rate** | 100% | CI/CD |
| **Regrese v existujicich testech** | 0 | Test suite |
