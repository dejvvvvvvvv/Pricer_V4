# Lib & Utilities -- Dokumentace

> Pomocne knihovny: utils, pricingService, slicingApiClient, cn, ini parser

---

## 1. Prehled

Slozky `src/lib/` a `src/utils/` obsahuji sdilene pomocne moduly pouzivane napric celou aplikaci ModelPricer V3. Kazdy modul ma uzky, jasne definovany ucel:

| Modul | Cesta | Ucel |
|-------|-------|------|
| `utils.js` | `src/lib/utils.js` | Re-export `cn` pro shadcn-style UI komponenty |
| `pricingService.js` | `src/lib/pricingService.js` | Vypocet ceny pro verejnou kalkulacku (demo + V3 pipeline) |
| `slicingApiClient.js` | `src/lib/slicingApiClient.js` | API klient pro backend slicing (PrusaSlicer), s demo fallbackem |
| `cn.js` | `src/utils/cn.js` | CSS class merge utility (clsx + tailwind-merge) |
| `ini.js` | `src/utils/ini.js` | Minimalni .ini parser pro import PrusaSlicer presetu |

Tyto moduly NEJSOU React komponenty -- jsou to ciste JavaScript utility funkce bez side-effectu (s vyjimkou `slicingApiClient.js` ktery provadi HTTP requesty).

---

## 2. Technologie

| Technologie | Verze/Pouziti | Kde |
|-------------|---------------|-----|
| JavaScript (ES Modules) | `import`/`export` syntax | Vsechny moduly |
| clsx | Knihovna pro podminene CSS tridy | `cn.js` |
| tailwind-merge | Inteligentni merge Tailwind trid | `cn.js` |
| Fetch API | Nativni browser API pro HTTP | `slicingApiClient.js` |
| FormData | Nativni browser API pro multipart upload | `slicingApiClient.js` |
| JSDoc | Typove anotace bez TypeScript | `pricingService.js`, `slicingApiClient.js` |

**Runtime prostredi:** Vsechny moduly bezi v browseru (Vite dev server nebo production build). Zadny z nich neni urcen pro Node.js/backend.

---

## 3. Architektura souboru

```
src/
  lib/
    utils.js                 # Re-export cn (shadcn compatibility layer)
    pricingService.js        # Cenovy kalkulator (base -> fees -> markup -> minima -> rounding)
    slicingApiClient.js      # HTTP klient pro /api/slice + demo fallback
    pricing/                 # (mimo scope tohoto dokumentu)
      pricingEngineV3.js
    supabase/                # (mimo scope tohoto dokumentu)
      ...
  utils/
    cn.js                    # clsx + twMerge wrapper
    ini.js                   # .ini parser pro PrusaSlicer presety
  config/
    api.js                   # API_BASE_URL konstanta (pouziva slicingApiClient)
```

### Velikost souboru

| Soubor | Radky | Exportovane funkce |
|--------|-------|--------------------|
| `src/lib/utils.js` | 6 | 1 (re-export) |
| `src/lib/pricingService.js` | 236 | 5 |
| `src/lib/slicingApiClient.js` | 109 | 1 |
| `src/utils/cn.js` | 6 | 1 |
| `src/utils/ini.js` | 42 | 2 |

---

## 4. Import graf

### 4.1 Interni zavislosti

```
src/lib/utils.js
  <- importuje: src/utils/cn.js (re-export cn)

src/lib/pricingService.js
  <- importuje: src/utils/adminPricingStorage.js
     (loadPricingConfigV3, normalizePricingConfigV3, normalizeMaterialKey)

src/lib/slicingApiClient.js
  <- importuje: src/config/api.js (API_BASE_URL)

src/utils/cn.js
  <- importuje: clsx (npm balicek)
  <- importuje: tailwind-merge (npm balicek)

src/utils/ini.js
  <- importuje: nic (zadne zavislosti)
```

### 4.2 Kdo importuje tyto moduly (spotrebitele)

**`cn` (pres `src/lib/utils.js`):**
- `src/components/ui/label.jsx` -- `import { cn } from "@/lib/utils"`

**`cn` (pres `src/utils/cn.js` primo):**
- `src/components/ui/Button.jsx`
- `src/components/ui/Card.jsx`
- `src/components/ui/Checkbox.jsx`
- `src/components/ui/ColorPicker.jsx`
- `src/components/ui/Container.jsx`
- `src/components/ui/Dialog.jsx`
- `src/components/ui/Input.jsx`
- `src/components/ui/Select.jsx`
- `src/components/ui/Slider.jsx`
- `src/components/ui/tooltip.jsx`
- `src/components/marketing/Accordion.jsx`
- `src/components/marketing/FaqTabs.jsx`
- `src/components/marketing/GlossaryTerm.jsx`
- `src/components/marketing/ImageReveal.jsx`
- `src/components/marketing/ImageRipple.jsx`
- `src/components/marketing/LogoMarquee.jsx`
- `src/components/marketing/PricingPlanCard.jsx`
- `src/components/marketing/Sparkles.jsx`
- `src/components/marketing/SpotlightCard.jsx`
- `src/components/marketing/SupportHoverCards.jsx`
- `src/components/marketing/Tabs.jsx`

**`pricingService.js` (exportovane funkce):**
- Aktualne neni primo importovan zadnou komponentou (funkce `calculatePrice`, `formatPrice`, `formatTime`, `getMaterialPricePerGram`, `normalizeMaterialKey` jsou pouzivany neprime pres `pricingEngineV3.js` a admin stranky)
- Soubory ktere pouzivaji funkce z tohoto modulu nebo ekvivalentni:
  - `src/lib/pricing/pricingEngineV3.js`
  - `src/pages/admin/AdminOrders.jsx`
  - `src/pages/admin/AdminDashboard.jsx`
  - `src/pages/admin/AdminBranding.jsx`
  - `src/pages/admin/components/orders/TabItemsFiles.jsx`
  - `src/contexts/LanguageContext.jsx`

**`slicingApiClient.js`:**
- Aktualne neni primo importovan zadnou komponentou. Kalkulacky pouzivaji `sliceModelLocal` z `src/services/slicerApi.js` (odlisny modul).

**`ini.js`:**
- Aktualne neni primo importovan zadnou komponentou (pripraven pro budouci PrusaSlicer preset import).

---

## 8. Kazdy modul -- detailni popis

---

### 8.1 `src/lib/utils.js`

**Ucel:** Compatibility layer pro shadcn-style UI komponenty ktere ocekavaji `cn` na ceste `@/lib/utils`. Modul sam neobsahuje logiku -- pouze re-exportuje `cn` z `src/utils/cn.js`.

#### Exportovane funkce

| Export | Typ | Popis |
|--------|-----|-------|
| `cn` | named re-export | Re-export z `../utils/cn` |

#### Pouziti

```js
// shadcn-style import (napr. label.jsx)
import { cn } from "@/lib/utils";
```

#### Poznamky

- Existuje POUZE kvuli konvenci shadcn/ui kde komponenty ocekavaji `cn` na `@/lib/utils`.
- Veskera logika je v `src/utils/cn.js`.

---

### 8.2 `src/lib/pricingService.js`

**Ucel:** Hlavni cenovy kalkulator pro verejnou kalkulacku. Implementuje kompletni pricing pipeline:

```
base (material + cas) -> fees (post-processing + express) -> markup -> minima -> rounding
```

Cte konfiguraci z tenant-scoped storage pres `adminPricingStorage.js`.

#### Interni (neexportovane) funkce

**`clampMin0(value)`**
- **Parametry:** `value` {any} -- hodnota k validaci
- **Return:** {number} -- cislo >= 0, nebo 0 pokud neni validni
- **Popis:** Konvertuje na cislo, vraci 0 pro nevalidni/negativni hodnoty.

**`roundToStep(value, step, mode)`**
- **Parametry:**
  - `value` {number} -- vstupni cislo
  - `step` {number} -- krok zaokrouhleni (napr. 1, 5, 10)
  - `mode` {string} -- `'up'` pro ceil, cokoliv jineho pro round
- **Return:** {number} -- zaokrouhlena hodnota
- **Popis:** Zaokrouhli na nejblizsi nasobek `step`. Pokud step <= 0, vraci puvodni hodnotu.

**`resolvePricingConfigV3(overrides)`**
- **Parametry:** `overrides` {Object|undefined} -- volitelny pricing config (V3 nebo legacy format)
- **Return:** {Object} -- normalizovany PricingConfigV3 objekt
- **Popis:** Pokud jsou predany overrides, normalizuje je. Jinak nacte config z tenant storage.

#### Exportovane funkce

**`normalizeMaterialKey(input)`**
- **Parametry:** `input` {string} -- nazev materialu (napr. `"PLA"`, `"PETG Black"`)
- **Return:** {string} -- normalizovany klic (napr. `"pla"`, `"petg_black"`)
- **Popis:** Deleguje na `normalizeMaterialKeyStorage` z `adminPricingStorage.js`. Sjednocuje format materialu pro matching.

**`getMaterialPricePerGram(pricingConfig, materialKey)`**
- **Parametry:**
  - `pricingConfig` {Object} -- PricingConfigV3 objekt
  - `materialKey` {string} -- klic materialu (napr. `"pla"`, `"abs"`)
- **Return:** {number} -- cena za gram (>= 0)
- **Popis:** Hleda cenu v tomto poradi (fallback chain):
  1. `pricingConfig.materials[].price_per_gram` (V3 preferred)
  2. `pricingConfig.materialPrices` map (legacy kompatibilita)
  3. `DEFAULT_MATERIAL_PRICES` hardcoded fallback
- **Default material prices:** pla=0.5, abs=0.8, petg=0.6, tpu=1.2, wood=1.5, carbon=2.0

**`calculatePrice(config, overrides)`**
- **Parametry:**
  - `config` {PricingConfig} -- vstupni konfigurace:
    - `material` {string} -- klic materialu
    - `materialGrams` {number} -- hmotnost v gramech
    - `printTimeSeconds` {number} -- cas tisku v sekundach
    - `quantity` {number} -- pocet kusu (min 1)
    - `expressDelivery` {boolean} -- express prirazka (+50%)
    - `postProcessing` {string[]} -- pole ID post-processingu
  - `overrides` {Object} [volitelny] -- PricingConfigV3 nebo legacy config
- **Return:** {PricingResult} objekt:
  - `total` {number} -- finalni celkova cena
  - `breakdown` {Object[]} -- pole `{ label, amount }` pro rozpis
  - `min_price_per_model_applied` {boolean} -- zda bylo aplikovano minimum za model
  - `min_order_total_applied` {boolean} -- zda bylo aplikovano minimum objednavky
- **Popis:** Kompletni pricing pipeline v poradi:
  1. **BASE** -- material cost (grams * price_per_gram) + time cost (hours * rate_per_hour, s minimum_billed_minutes)
  2. **FEES** -- post-processing (sanding=50, painting=100, assembly=150, drilling=80) + express (+50% ze subtotalu)
  3. **MARKUP** -- flat/percent/min_flat podle `pricingConfig.markup`
  4. **MINIMA** -- minimum_price_per_model, pak minimum_order_total
  5. **ROUNDING** -- step zaokrouhleni (smart_rounding na total, nebo per-model)

**`formatPrice(amount)`**
- **Parametry:** `amount` {number} -- castka
- **Return:** {string} -- formatovana cena (napr. `"150 Kc"`)
- **Popis:** Zaokrouhli na cele cislo a prida suffix " Kc".

**`formatTime(seconds)`**
- **Parametry:** `seconds` {number} -- cas v sekundach
- **Return:** {string} -- formatovany cas (napr. `"2h 30min"` nebo `"45 min"`)
- **Popis:** Konvertuje sekundy na hodiny a minuty. Pokud je 0 hodin, zobrazuje jen minuty.

#### Konstanty (interni)

| Konstanta | Typ | Hodnota | Popis |
|-----------|-----|---------|-------|
| `DEFAULT_MATERIAL_PRICES` | Object | `{pla:0.5, abs:0.8, petg:0.6, tpu:1.2, wood:1.5, carbon:2.0}` | Fallback ceny za gram |
| `DEFAULT_RATE_PER_HOUR` | number | `100` | Fallback hodinova sazba |
| `POST_PROCESSING_PRICES` | Object | `{sanding:50, painting:100, assembly:150, drilling:80}` | Hardcoded post-processing ceny |

---

### 8.3 `src/lib/slicingApiClient.js`

**Ucel:** API klient pro backend slicing endpoint (PrusaSlicer na serveru). V demo rezimu (Varianta A) automaticky padne zpet na lokalni odhad pokud backend neni dostupny.

#### Interni (neexportovane) funkce

**`clamp(n, min, max)`**
- **Parametry:** `n` {number}, `min` {number}, `max` {number}
- **Return:** {number} -- hodnota v rozmezi [min, max]
- **Popis:** Standardni clamp. Pro ne-finite `n` vraci `min`.

**`demoEstimate(file, cfg)`**
- **Parametry:**
  - `file` {File} -- nahravany soubor (pouziva se `file.size`)
  - `cfg` {SlicingConfig} -- konfigurace sliceru
- **Return:** {SlicingResult} -- deterministicky odhad
- **Popis:** Lokalni (bez backendu) odhad casu a materialu na zaklade:
  - Velikost souboru v MB (zakladni koeficienty: 30min + 90min/MB, 10g + 35g/MB)
  - Infill faktor (0.6 az 1.5 pro 0-100% infill)
  - Quality faktor (draft=0.75, standard=1.0, fine=1.35, ultra=1.7, nozzle_08=0.75, nozzle_06=0.9, nozzle_04=1.0)
  - Supports prirazka (+15% cas, +10% material)
  - Limity: cas 10min-24h, material 1-5000g
  - Vzdy vraci `message: 'DEMO estimate (backend not reachable)'`

#### Exportovane funkce

**`sliceModel(file, config)`**
- **Parametry:**
  - `file` {File} -- 3D model soubor (STL, OBJ, 3MF, ...)
  - `config` {SlicingConfig} -- konfigurace:
    - `quality` {string} -- `'nozzle_08'|'nozzle_06'|'nozzle_04'|'draft'|'standard'|'fine'|'ultra'`
    - `infill` {number} -- procento vyplne (0-100)
    - `material` {string} -- `'pla'|'abs'|'petg'|'tpu'|'wood'|'carbon'`
    - `supports` {boolean} -- zda pouzit podpory
- **Return:** {Promise\<SlicingResult\>} -- objekt:
  - `time` {number} -- cas tisku v sekundach
  - `material` {number} -- spotreba materialu v gramech
  - `layers` {number} [volitelny] -- pocet vrstev
  - `success` {boolean} -- zda se slicing povedl
  - `message` {string} [volitelny] -- informacni zprava
- **Popis:** Odesle model na `POST {API_BASE_URL}/api/slice` jako multipart form data. Pokud backend odpovist chybou nebo neni dostupny, automaticky vraci `demoEstimate()`.
- **HTTP metoda:** POST
- **Content-Type:** multipart/form-data (automaticky pres FormData)
- **Endpoint:** `{API_BASE_URL}/api/slice` (aktualne `http://192.168.1.213:3001/api/slice`)

#### Zavislosti

| Import | Zdroj | Popis |
|--------|-------|-------|
| `API_BASE_URL` | `src/config/api.js` | Bazova URL backendu (aktualne `http://192.168.1.213:3001`) |

---

### 8.4 `src/utils/cn.js`

**Ucel:** CSS class name merge utility. Kombinuje `clsx` (podminene tridy) s `twMerge` (inteligentni Tailwind merge ktery resi konflikty jako `p-2 p-4` -> `p-4`).

#### Exportovane funkce

**`cn(...inputs)`**
- **Parametry:** `...inputs` {any[]} -- libovolny pocet argumentu kompatibilnich s clsx (stringy, objekty, pole, undefined, null, boolean)
- **Return:** {string} -- vysledny CSS class string s vyresenymi Tailwind konflikty
- **Popis:** Ekvivalent `twMerge(clsx(inputs))`. Pouziti:

```js
cn('p-2 text-red', isActive && 'bg-blue', { 'hidden': !visible })
// => "p-2 text-red bg-blue" (pokud isActive=true, visible=true)
```

#### Zavislosti

| Import | Zdroj | Popis |
|--------|-------|-------|
| `clsx` | npm balicek `clsx` | Podminene spojovani CSS trid |
| `twMerge` | npm balicek `tailwind-merge` | Inteligentni merge Tailwind trid |

#### Poznamky

- Toto je NEJPOUZIVANEJSI utility v celem projektu (22+ importu v UI a marketing komponentach).
- Import cesty se lisi: nektere komponenty pouzivaji `@/lib/utils` (pres re-export), jine `../../utils/cn` (primo), jine `@/utils/cn` (alias). Vsechny vedou ke stejne funkci.

---

### 8.5 `src/utils/ini.js`

**Ucel:** Minimalni parser pro `.ini` soubory pouzivane PrusaSlicerem. Podporuje format `key = value` se sekcemi `[...]` a komentari `;` nebo `#`.

#### Exportovane funkce

**`parseIniToKeyValue(text)`**
- **Parametry:** `text` {string|null|undefined} -- obsah .ini souboru
- **Return:** {Object} -- plochy objekt `{ key: valueString, ... }`
- **Popis:** Parsuje radek po radku:
  - Ignoruje prazdne radky
  - Ignoruje komentare (zacinajici `;` nebo `#`)
  - Ignoruje sekce (`[sekce]`) -- nezanoruje, ploche key-value
  - Extrahuje `key = value` (vse pred prvnim `=` je klic, vse za nim je hodnota)
  - Klice i hodnoty jsou trimovane
  - Prazdne klice jsou ignorovany

```js
parseIniToKeyValue(`
[print:0.15mm QUALITY]
; layer height
layer_height = 0.15
infill_sparse_density = 20
support_material = 1
`)
// => { layer_height: "0.15", infill_sparse_density: "20", support_material: "1" }
```

**`coerceIniValue(valueRaw, dataType)`**
- **Parametry:**
  - `valueRaw` {string|null|undefined} -- surova hodnota z .ini
  - `dataType` {string} -- cilovy typ: `'boolean'`, `'number'`, nebo cokoliv jineho (= string)
- **Return:** {boolean|number|string|null|undefined} -- pretypovana hodnota
- **Popis:** Konvertuje retezec na spravny JS typ:
  - `'boolean'`: `"1"` a `"true"` -> `true`, `"0"` a `"false"` -> `false`, ostatni -> `Boolean(v)`
  - `'number'`: pokud je vysledek `Number.isFinite`, vraci cislo; jinak puvodni string
  - default: vraci trimovany string
  - Pro `null`/`undefined` vstup vraci puvodni hodnotu beze zmeny

```js
coerceIniValue("1", "boolean")     // => true
coerceIniValue("0.15", "number")   // => 0.15
coerceIniValue("abc", "number")    // => "abc" (neni validni cislo)
coerceIniValue("hello", "string")  // => "hello"
coerceIniValue(null, "number")     // => null
```

#### Poznamky

- Parser je zamerne minimalisticky -- nepodporuje multiline hodnoty, escape sekvence, ani vnorene sekce.
- Sekce `[...]` jsou ignorovany (nevytvari se hierarchie) -- vsechny klice jsou v jednom plosnem objektu.
- Pokud .ini soubor obsahuje duplicitni klice (i v ruznych sekcich), posledni hodnota vyhraje.

---

## 17. Zname omezeni

### 17.1 pricingService.js

| Omezeni | Popis | Dopad |
|---------|-------|-------|
| **Hardcoded post-processing ceny** | `POST_PROCESSING_PRICES` (sanding=50, painting=100, assembly=150, drilling=80) jsou konstanty v kodu, ne v tenant storage | Admin nemuze upravit post-processing ceny pres UI; zmena vyzaduje deploy |
| **Express je vzdy +50%** | Express prirazka je fixne 50% ze subtotalu | Nelze konfigurovat jiny express koeficient pres admin |
| **Mena hardcoded na Kc** | `formatPrice` vraci vzdy " Kc" suffix | Neni pripraveno pro jine meny; nutna zmena pro mezinarodni pouziti |
| **Synchronni cteni storage** | `loadPricingConfigV3()` cte localStorage synchronne | Nefunguje s async Supabase bez wrapperu; viz `writeTenantJson` backward compat |
| **Breakdown labels v cestine** | Labels jako "Material", "Cas tisku", "Dodatecne sluzby" jsou hardcoded | Chybi i18n podpora v breakdown; zobrazuji se cesky i pro EN uzivatele |

### 17.2 slicingApiClient.js

| Omezeni | Popis | Dopad |
|---------|-------|-------|
| **Demo fallback je vzdy aktivni** | Pokud backend vrati jakoukoli HTTP chybu, pouzije se demo odhad | V produkci by mohlo maskovat skutecne backend chyby |
| **API_BASE_URL hardcoded** | Aktualne `http://192.168.1.213:3001` -- LAN adresa | Neni konfigurovatelna pres env promenne; vyzaduje zmenu kodu pro jine prostredi |
| **Odhad zalozeny na velikosti souboru** | Demo estimate pouziva `file.size` jako zaklad | Korelace mezi velikosti souboru a slozitosti tisku je velmi hruba |
| **Chybi timeout** | Fetch nema nastaven timeout (AbortController) | Backend muze viset neomezene dlouho |
| **Chybi retry logika** | Jediny pokus o fetch, pak okamzity fallback na demo | Docasne sitove vypadky vedou rovnou na demo estimate |
| **Neni pouzivan nikde primo** | Kalkulacky pouzivaji `sliceModelLocal` z `src/services/slicerApi.js` | Modul je pravdepodobne deprecated/orphaned |

### 17.3 cn.js

| Omezeni | Popis | Dopad |
|---------|-------|-------|
| **Tailwind merge v non-Tailwind projektu** | Projekt pouziva custom CSS (ne Tailwind), ale `twMerge` je pritomen | Zbytecna zavislost; `twMerge` ma smysl pouze pokud se pouzivaji Tailwind utility tridy |
| **Nekonzistentni import cesty** | 3 ruzne import cesty: `@/lib/utils`, `../../utils/cn`, `@/utils/cn`, `utils/cn` | Ztezuje refactoring a grep; zadna kanonizovana cesta |

### 17.4 ini.js

| Omezeni | Popis | Dopad |
|---------|-------|-------|
| **Neni nikde pouzivan** | Zadna komponenta aktualne neimportuje tento modul | Orphaned kod; pripraven pro budouci preset import feature |
| **Plochy parsing** | Sekce `[...]` jsou ignorovany -- vsechny klice padnou do jednoho objektu | Pokud .ini soubor ma stejny klic v ruznych sekcich, dojde ke kolizi |
| **Zadna validace formatu** | Neoveruje se zda soubor je validni .ini | Nevalidni vstup nevyhodi chybu, pouze vraci prazdny nebo castecny objekt |

### 17.5 utils.js (lib)

| Omezeni | Popis | Dopad |
|---------|-------|-------|
| **Jen re-export** | Modul neobsahuje zadnou vlastni logiku | Existuje pouze pro shadcn konvenci; pridava uroven indirection |
| **Pouziva to pouze 1 komponenta** | Jen `label.jsx` importuje z `@/lib/utils` | Ostatni UI komponenty importuji `cn` primo z `utils/cn.js` |
