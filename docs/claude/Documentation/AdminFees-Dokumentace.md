# AdminFees — Dokumentace

> Admin stranka pro konfiguraci poplatku a slev (fees/discounts). Podporuje MODEL vs ORDER scope,
> typed podminky (AND logika), negativni hodnoty jako slevy, 5-tabovy modal editor s live
> simulatorem a hromadne operace nad fees.

---

## 1. Prehled

AdminFees (`/admin/fees`) je jedina admin stranka pro spravu fee konfigurace. Poskytuje:

- **Fees seznam** — full-width list s filtry (scope, active, required), fulltext vyhledavanim a bulk akcemi
- **ForgeDialog modal editor** — 5-tabovy editor (Basics, Calculation, Widget, Conditions, Preview)
- **Typed conditions** — AND logika s podporou bool/numeric/enum/string klicu a operatoru
- **Fee simulator** — live preview vysledku s kontextovymi parametry (material, gramy, cas, objem, atd.)
- **Negativni slevy** — fee value muze byt zaporna, coz funguje jako sleva
- **MODEL vs ORDER scope** — fee muze byt per-model (opakuje se pro kazdy model) nebo per-order (jednou za objednavku)
- **Charge basis** — PER_PIECE (nasobi quantity) vs PER_FILE (jednou za soubor)
- **Widget viditelnost** — required/selectable/selected_by_default/apply-to-selected-models

Celkovy rozsah: ~2418 radku v jednom souboru vcetne inline `<style>` bloku.

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | Forge design tokeny (CSS vars) + inline `<style>` blok (~890 radku CSS) |
| Routing | React Router v6 (`/admin/fees` route) |
| i18n | `useLanguage()` hook z `LanguageContext.jsx` (CS/EN) |
| UI komponenty | `ForgeDialog`, `ForgeCheckbox`, `Icon` (AppIcon) |
| Storage | `adminFeesStorage.js` (namespace `fees:v3`, tenant-scoped localStorage) |
| Data zdroj | `loadFeesConfigV3()` + `loadPricingConfigV3()` (pro materialy) |

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminFees.jsx               — Jediny soubor, ~2418 radku, export default AdminFees
```

Stranka NEMA vlastni subkomponenty (zadna slozka `components/fees/`). Veskera logika, renderovani i CSS
jsou v jednom souboru.

### Externi zavislosti (importy)

```
src/components/AppIcon.jsx                     — Ikony (lucide-react wrapper)
src/components/ui/forge/ForgeDialog.jsx        — Modalni dialog
src/components/ui/forge/ForgeCheckbox.jsx      — Checkbox s labelem
src/contexts/LanguageContext.jsx                — i18n hook (useLanguage)
src/utils/adminFeesStorage.js                  — CRUD pro fees (loadFeesConfigV3, saveFeesConfigV3, normalizeFeesConfigV3)
src/utils/adminPricingStorage.js               — Cteni pricing konfigurace (loadPricingConfigV3 — pro materialy)
```

---

## 4. Data model

### 4.1 Fee objekt (normalizovany)

Kazdy fee je normalizovan funkci `normalizeFeeUi()` pred pouzitim v UI:

```javascript
{
  id: "fee-550e8400-...",           // Unikatni ID (crypto.randomUUID nebo fallback)
  name: "Postprocessing",           // Nazev fee (povinne, nesmi byt prazdny)
  active: true,                     // Aktivni/neaktivni

  type: "flat",                     // Typ vypoctu (viz 4.2)
  value: 50.00,                     // Hodnota (MUZE BYT ZAPORNA = sleva)

  scope: "MODEL",                   // MODEL (per-model) | ORDER (per-order)
  charge_basis: "PER_FILE",         // PER_PIECE (nasobi quantity) | PER_FILE (1x za soubor)

  required: false,                  // Povinny = vzdy zahrnuty
  selectable: true,                 // Volitelny = checkbox ve widgetu
  selected_by_default: false,       // Defaultne zaskrtnuty
  apply_to_selected_models_enabled: false,  // Apply pouze na vybrane modely

  category: "finishing",            // Volitelna kategorie
  description: "Povrchova uprava",  // Volitelny popis

  conditions: [                     // AND podminky (vsechny musi platit)
    { key: "material", op: "eq", value: "PLA" },
    { key: "filamentGrams", op: "gte", value: 100 },
  ],
}
```

### 4.2 Fee types (typy vypoctu)

| Type | Popis CS | Popis EN | Jednotka |
|------|----------|----------|----------|
| `flat` | Fixni castka | Flat | CZK |
| `per_gram` | Podle hmotnosti | Per gram | CZK/g |
| `per_minute` | Podle casu | Per minute | CZK/min |
| `percent` | Procento | Percent | % |
| `per_cm3` | Podle objemu | Per volume | CZK/cm3 |
| `per_cm2` | Podle povrchu | Per surface | CZK/cm2 |
| `per_piece` | Za kus | Per piece | CZK/kus |

### 4.3 Scope a charge_basis pravidla

```
Scope = ORDER  =>  charge_basis je VZDY PER_FILE (1x za objednavku)
Type = percent =>  charge_basis je VZDY PER_FILE (procento se aplikuje na base castku)
Type = per_piece + bez explicitniho charge_basis => default PER_PIECE

PER_PIECE = value * units * quantity
PER_FILE  = value * units * 1
```

### 4.4 Required/selectable/selected_by_default pravidla

```
required = true  =>  selectable = false, selected_by_default = true (vzdy zahrnuty)
required = false =>  selectable muze byt true/false
selectable = false + required = false  =>  selected_by_default = false (skryty)
```

### 4.5 Condition keys (podminky)

| Key | Typ | Operatory | Popis |
|-----|-----|-----------|-------|
| `material` | enum/string | eq, neq | Material (select z pricing konfigurace) |
| `supports_enabled` | bool | eq | Supporty zapnuty (true/false) |
| `infill_percent` | numeric | gt, lt, eq, gte, lte | Hustota vyplne (%) |
| `quality_preset` | enum | eq | Kvalitni preset (draft, standard, fine, ultra) |
| `filamentGrams` | numeric | gt, lt, eq, gte, lte | Hmotnost filamentu (g) |
| `estimatedTimeSeconds` | numeric | gt, lt, eq, gte, lte | Odhadovany cas tisku (s) |
| `volumeCm3` | numeric | gt, lt, eq, gte, lte | Objem modelu (cm3) |
| `surfaceCm2` | numeric | gt, lt, eq, gte, lte | Povrch modelu (cm2) |

Podminky pouzivaji AND logiku — vsechny musi byt splneny aby fee matchnul.

### 4.6 Storage format

Fees se ukladaji pres `adminFeesStorage.js` do tenant-scoped localStorage:

```javascript
// Klic: modelpricer:${tenantId}:fees:v3
{
  schema_version: 3,
  fees: [ /* pole normalizovanych fee objektu */ ],
  updated_at: "2026-02-13T12:00:00.000Z"
}
```

---

## 5. Klicove funkce a logika

### 5.1 Helper funkce (mimo komponentu)

| Funkce | Radek | Ucel |
|--------|-------|------|
| `safeNum(v, fallback)` | 79 | Bezpecna konverze na cislo, NaN vraci fallback |
| `clampMin1(v)` | 84 | Floor + minimum 1 (pro quantity) |
| `deepClone(obj)` | 89 | JSON parse/stringify klon |
| `createId(prefix)` | 93 | UUID generator (crypto.randomUUID nebo Date.now fallback) |
| `normalizeFeeUi(fee, idx)` | 100 | Hlavni normalizacni funkce — vynuti defaulty, scope pravidla, required pravidla, conditions |
| `mapLegacyOp(opRaw)` | 171 | Mapovani legacy operatoru na kanonicky format (equals->eq, !=->neq, atd.) |
| `formatMoneyCzk(n)` | 198 | Formatovani na "X.XX Kc" |
| `formatFeeValueForList(fee)` | 203 | Format pro list — percent zobrazi "%", ostatni "Kc" |
| `labelFor(list, value, cs)` | 209 | Lookup label v option listu podle hodnoty a jazyka |
| `evaluateCondition(cond, ctx)` | 215 | Vyhodnoceni jedne podminky proti kontextu (vraci {ok, details}) |
| `simulateFeeAmount(fee, ctx)` | 255 | Simulace castky fee pro dany kontext |

### 5.2 normalizeFeeUi — klicova funkce

Tato funkce je "single source of truth" pro normalizaci fee dat v UI. Vola se:

1. Pri nacitani fees ze storage
2. Pri filtrovani a zobrazovani v seznamu
3. Pri otevreni editoru (draft)
4. Pri kazdem updatu draftu
5. Pri ukladani zpet do listu

**Invarianty ktere vynucuje:**
- Neznamy type => fallback `flat`
- ORDER scope => charge_basis vzdy `PER_FILE`
- percent type => charge_basis vzdy `PER_FILE`
- required => selectable=false, selected_by_default=true
- !selectable + !required => selected_by_default=false
- Legacy key `support_enabled` => `supports_enabled`
- Legacy operatory (equals, !=, >=) => kanonicky format (eq, neq, gte)

### 5.3 evaluateCondition — vyhodnoceni podminek

```
Bool klice:   want === got  (eq operator, hodnoty normalizovane na true/false)
Numeric klice: gt, lt, eq, gte, lte — standardni porovnani
Enum/string:   eq, neq, contains — case-insensitive
```

### 5.4 simulateFeeAmount — vypocet castky

```
percent:   base * (value / 100)
per_gram:  value * filamentGrams * multiplier
per_minute: value * (estimatedTimeSeconds / 60) * multiplier
per_cm3:   value * volumeCm3 * multiplier
per_cm2:   value * surfaceCm2 * multiplier
per_piece: value * 1 * multiplier
flat:      value * 1 * multiplier

multiplier = (scope=MODEL && charge_basis=PER_PIECE) ? quantity : 1
```

Specialni pripad: pokud `apply_to_selected_models_enabled=true` a `ctx.modelSelected=false`, vraci 0.

---

## 6. State management

### 6.1 useState hooks

| State | Typ | Default | Ucel |
|-------|-----|---------|------|
| `loading` | boolean | true | Inicializacni spinner |
| `saving` | boolean | false | Ukladani probehne |
| `fees` | array | [] | Hlavni seznam fees |
| `selectedIds` | array | [] | Bulk selekce (ID pole) |
| `search` | string | '' | Fulltext filtr |
| `filterScope` | string | 'ALL' | Filtr scope (ALL/MODEL/ORDER) |
| `filterActive` | string | 'ALL' | Filtr stavu (ALL/ACTIVE/INACTIVE) |
| `filterRequired` | string | 'ALL' | Filtr widget (ALL/REQUIRED/OPTIONAL) |
| `banner` | object/null | null | Notifikacni banner {type, text} |
| `savedSnapshot` | string | '' | JSON snapshot ulozeneho stavu (pro dirty detekci) |
| `editingFeeId` | string/null | null | ID aktualne editovaneho fee |
| `feeDraft` | object/null | null | Klon editovaneho fee (draft) |
| `activeTab` | string | 'basics' | Aktivni tab v dialogu |
| `materials` | array | [] | Materialy z pricing konfigurace |
| `sim` | object | {...} | Simulator context (material, supports, infill, atd.) |

### 6.2 useMemo hooks

| Memo | Ucel |
|------|------|
| `dirty` | Porovnani aktualniho stavu s ulozenym snapshotem |
| `selectedSet` | Set z selectedIds pro O(1) lookup |
| `filteredFees` | Filtrovanovy a normalizovany seznam pro zobrazeni |
| `validation` | Globalni validace vsech fees (errors pole) |
| `ui` | Prekladove texty (CS/EN) — cachovane dle jazyka |
| `materialOptions` | Enabled materialy pro select v podminkach |
| `draftValid` | Validace aktualnich draft dat (name, value, conditions) |
| `simResult` | Vysledek simulace (match, results, amount, note) |

### 6.3 Data flow

```
Init:
  loadFeesConfigV3() -> normalize -> setFees + setSavedSnapshot
  loadPricingConfigV3() -> filter enabled -> setMaterials

Edit flow:
  openFeeDialog(id) -> deepClone + normalizeFeeUi -> setFeeDraft + setEditingFeeId
  updateFeeDraft(patch) -> normalizeFeeUi({...prev, ...patch}) -> setFeeDraft
  saveFeeDialog() -> merge draft zpet do fees listu -> closeFeeDialog

Save flow:
  handleSave() -> validation check -> normalizeFeesConfigV3 -> saveFeesConfigV3 -> update snapshot
```

---

## 8. UI struktura

### 8.1 Page layout

```
admin-page (max-width 1320px, forge-bg-void)
  |-- admin-header (title + subtitle + status pill + New Fee btn + Save btn)
  |-- banner (success/error notifikace, zobrazuje se podmintecne)
  |-- fees-layout (1-column grid)
       |-- fees-panel (surface s border)
            |-- panel-header
            |    |-- panel-title ("Seznam fees" + count)
            |    |-- search (fulltext)
            |    |-- filters (3 selecty: scope, active, required)
            |    |-- bulkbar (select all + bulk actions)
            |-- panel-body (scrollable, max-height calc)
                 |-- fee-list (grid)
                      |-- fee-row * N (checkbox + name + chips + value)

ForgeDialog (modal, max-width 800px)
  |-- tab-bar (5 tabu)
  |-- tab-content (podminceny dle activeTab)
  |-- footer (Cancel + Save changes)
```

### 8.2 Dialog taby (5 tabu)

| Tab | ID | Ikona | Obsah |
|-----|----|-------|-------|
| Zaklad | `basics` | Settings | name, category, description, active toggle |
| Vypocet | `calc` | Calculator | scope, type, value, charge_basis |
| Widget | `widget` | Eye | required, selectable, selected_by_default, apply-to-selected |
| Podminky | `conditions` | Filter | AND podminky s typed key/op/value editorem |
| Preview | `preview` | Play | Simulator s 11 parametry + vysledek (MATCH/NO MATCH + castka) |

### 8.3 Fee list radek

Kazdy radek zobrazuje:
- Checkbox (bulk selekce)
- Zeleny/sedy dot (active/inactive)
- Nazev (bold)
- Chipy: scope, type, required/optional, charge_basis (jen MODEL), apply-to-selected
- Hodnota (vpravo, bold, mono font)
- Discount chip (oranzdovy, pokud value < 0)
- Trash ikona

### 8.4 Bulk akce

Pri vybrani 1+ fees se zobrazi:
- Enable / Disable
- Duplicate
- Delete (s confirm dialogem)
- MODEL / ORDER segmented buttons
- Required / Optional segmented buttons

---

## 9. Preklady (i18n)

Vsechny user-facing texty jsou lokalizovane pres `useMemo` objekt `ui` s CS/EN variantami.
Preklady jsou inline (ne v LanguageContext), definovane primo v komponente.

### Priklady klicovych prekladu

| Klic | CS | EN |
|------|----|----|
| title | Fees (Poplatky) | Fees |
| subtitle | Vytvor poplatky/slevy, nastav scope... | Create fees/discounts, configure scope... |
| newFee | Novy poplatek | New fee |
| save/saved/saving | Ulozit / Ulozeno / Ukladam... | Save / Saved / Saving... |
| required | Povinny (vzdy zahrnuty) | Required (always included) |
| selectable | Volitelny (checkbox ve widgetu) | Optional (checkbox in widget) |
| discount | Sleva | Discount |
| match / noMatch | MATCH / NO MATCH | MATCH / NO MATCH |

---

## 10. Zname omezeni

- **Vsechno v jednom souboru** — ~2418 radku (JSX + CSS) bez subkomponent. Snizuje citelnost a udrzovatelnost.
- **Inline CSS** — ~890 radku CSS v `<style>` tagu na konci komponenty (ne v externim .css souboru).
- **Inline preklady** — texty nejsou v LanguageContext ale primo v `useMemo` objektu.
- **Simulator pocita jen 1 fee** — nesimuluji se interakce mezi fees (napr. percent z percent).
- **Bez drag-and-drop razeni** — fees se zobrazuji v poradi v jakem jsou v poli, bez moznosti manualne radit.
- **apply_to_selected_models** — flag se uklada, ale kalkulacka ho zatim nepouziva (pripraveno pro budouci integraci).
- **Conditions nepodporuji OR** — pouze AND logika. Pro OR je nutne vytvorit vice fees.
- **localStorage limit** — pri velkych poctech fees muze dojit localStorage kapacita (~5-10 MB).
- **Bez undo/redo** — zmeny v editoru se potvrzuji save dialogem, ale neni moznost se vratit k predchozim verzim.
- **Bez importu/exportu** — fees nelze exportovat do JSON/CSV ani importovat z externiho zdroje.

---

## 11. Navaznosti na dalsi systemy

### 11.1 Pricing engine (pricingEngineV3.js)

AdminFees konfiguruje fees ktere pricing engine nasledne pouziva pri kalkulaci ceny.
Fee objekt z `fees:v3` storage se pouziva v pipeline kroku pro fees.

Dulezite: `pricingEngineV3.js` je vlastnen agentem `mp-mid-pricing-engine` — zmeny ve fee strukture
musi byt koordinovany s timto agentem.

### 11.2 Test-kalkulacka a widget-kalkulacka

Obe kalkulacky ctou fees ze storage a zobrazuji je v PrintConfiguration komponente:
- Required fees se zobrazi vzdy (bez checkboxu)
- Selectable fees se zobrazi s checkboxem (defaultne zaskrtnuty/nezaskrtnuty dle `selected_by_default`)
- Negativni fees se zobrazi jako slevy (jiny vizualni styl)

### 11.3 AdminFeesStorage (adminFeesStorage.js)

Storage helper ktery AdminFees pouziva:

| Funkce | Ucel |
|--------|------|
| `loadFeesConfigV3()` | Nacte config z localStorage (s legacy migraci) |
| `saveFeesConfigV3(data)` | Ulozi normalizovany config do localStorage |
| `normalizeFeesConfigV3(input)` | Normalizuje vstupni data (schema_version, fees array) |
| `getDefaultFeesConfigV3()` | Vrati prazdny default config |
| `migrateLegacyFeesToV3()` | Migrace ze starsich localStorage klicu |

Namespace: `fees:v3`, tenant-scoped pres `readTenantJson` / `writeTenantJson`.

### 11.4 AdminPricingStorage

Importovano pouze pro ziskani seznamu materialu (`loadPricingConfigV3()`), ktere se pouzivaji
v condition editoru (material select) a v simulatoru.

---

## 15. MODEL vs ORDER fees — detailni vysvetleni

### 15.1 Scope: MODEL

- Fee se aplikuje **na kazdy model** v objednavce zvlast
- `charge_basis` muze byt `PER_PIECE` (nasobi quantity) nebo `PER_FILE` (1x za soubor)
- `apply_to_selected_models_enabled` — pokud je zapnuty, fee se aplikuje jen na modely ktere jsou "selected"
- Podminka `conditions` se vyhodnocuje proti parametrum konkretniho modelu

**Priklad:** Postprocessing fee 30 Kc/kus, scope=MODEL, charge_basis=PER_PIECE
- Model A (qty 3): 30 * 3 = 90 Kc
- Model B (qty 1): 30 * 1 = 30 Kc
- Celkem: 120 Kc

### 15.2 Scope: ORDER

- Fee se aplikuje **jednou za celou objednavku** (nezavisle na poctu modelu)
- `charge_basis` je VZDY `PER_FILE` (vynuceno normalizaci)
- `apply_to_selected_models_enabled` nema efekt (neni per-model)
- Podminka `conditions` se vyhodnocuje proti agregatnim parametrum objednavky

**Priklad:** Shipping fee 99 Kc, scope=ORDER
- Bez ohledu na pocet modelu: 99 Kc

### 15.3 Negativni hodnoty (slevy)

Fee value muze byt zaporne cislo. V tom pripade fee funguje jako sleva:

- `value: -50` + `type: flat` => sleva 50 Kc
- `value: -10` + `type: percent` => sleva 10 %
- `value: -2` + `type: per_gram` => sleva 2 Kc za gram

V UI se negativni fees zobrazuji s:
- Oranzdovym "Sleva"/"Discount" chipem
- Oranzdovou barvou hodnoty (accent-secondary)
- Simulator ukazuje zapornou castku s discount stylem

### 15.4 Required vs selectable vs hidden

| required | selectable | selected_by_default | Chovani ve widgetu |
|----------|------------|--------------------|--------------------|
| true | (false) | (true) | Vzdy zahrnuty, bez checkboxu |
| false | true | true | Checkbox, defaultne ON |
| false | true | false | Checkbox, defaultne OFF |
| false | false | (false) | Skryty — ani se nezobrazuje |

Poznamka: Hodnoty v zavorkach jsou vynuceny normalizaci — admin je nemuze nastavit jinak.

---

## 16. Simulator (Preview tab)

### 16.1 Vstupni parametry simulatoru

| Parametr | Default | Popis |
|----------|---------|-------|
| material | (prvni enabled material) | Vybrany material |
| supports_enabled | false | Supporty zapnuty |
| infill_percent | 20 | Hustota vyplne (%) |
| quality_preset | standard | Kvalitni preset |
| filamentGrams | 50 | Hmotnost filamentu (g) |
| estimatedTimeSeconds | 3600 | Odhadovany cas (s) |
| volumeCm3 | 0 | Objem modelu (cm3) |
| surfaceCm2 | 0 | Povrch modelu (cm2) |
| quantity | 1 | Pocet kusu (min 1) |
| percentBase | 1000 | Base castka pro percent fees (CZK) |
| modelSelected | true | Simuluje apply-to-selected flag |

### 16.2 Vysledek simulace

Simulator vraci:

1. **match** (boolean) — vsechny conditions splneny?
2. **results** (array) — detail pro kazdou podminku (ok/fail + details string)
3. **amount** (number) — vypoctena castka fee (nebo 0 pokud NO MATCH)
4. **note** (string) — technicke info (napr. "units=50 x mult=3")

### 16.3 Vizualni zobrazeni

- **MATCH pill** (zelena) nebo **NO MATCH pill** (cervena)
- **Castka** — velky cislo s mono fontem (oranzdove pokud zaporna)
- **Why sekce** — radek za radek kazda podminka s zelenym/cervenym dotem a detailem

---

## 17. Validace

### 17.1 Globalni validace (validation useMemo)

Bezi nad celym `fees` polem pred Save:

| Kontrola | Chybovy klic |
|----------|--------------|
| Prazdny nazev fee | `{ id, field: 'name' }` |
| Neplatna hodnota (NaN) | `{ id, field: 'value' }` |
| Podminka bez klice | `{ id, field: 'cond_X' }` |
| Podminka bez operatoru (krome bool) | `{ id, field: 'cond_X' }` |
| Podminka bez hodnoty (krome bool) | `{ id, field: 'cond_X' }` |

Pokud `errors.length > 0`, Save tlacitko je disabled a zobrazi se error banner.

### 17.2 Draft validace (draftValid useMemo)

Bezi nad `feeDraft` v dialogu:

- Nazev nesmi byt prazdny
- Value musi byt finite cislo
- Kazda podminka musi mit:
  - Neprazdny key
  - Operator (krome bool klicu)
  - Neprazdnou hodnotu (krome bool klicu)

Pokud draft neni validni, "Save changes" tlacitko v dialogu je disabled.

### 17.3 Input-level indikace

- Name input: cerveny border (`input-error`) pokud je prazdny
- Value input: cerveny border pokud neni finite cislo

---

## Appendix: Konstanty

### FEE_TYPES
`flat`, `per_gram`, `per_minute`, `percent`, `per_cm3`, `per_cm2`, `per_piece`

### SCOPE_OPTIONS
`MODEL`, `ORDER`

### CHARGE_BASIS_OPTIONS
`PER_PIECE`, `PER_FILE`

### QUALITY_PRESETS
`draft`, `standard`, `fine`, `ultra`

### CONDITION_KEYS
`material`, `supports_enabled`, `infill_percent`, `quality_preset`, `filamentGrams`, `estimatedTimeSeconds`, `volumeCm3`, `surfaceCm2`

### NUM_OPERATORS
`gt` (>), `lt` (<), `eq` (=), `gte` (>=), `lte` (<=)

### TEXT_OPERATORS
`eq` (=), `neq` (!=)

---

## Appendix: Legacy migrace

`adminFeesStorage.js` obsahuje `migrateLegacyFeesToV3()` ktera automaticky migruje data
ze stareho localStorage klice `modelpricer_fees_config__{customerId}` do tenant-scoped
`fees:v3` namespace. Migrace je idempotentni — bezi pouze pokud V3 klic neexistuje.

Mapovani legacy operatoru a klicu:
- `support_enabled` -> `supports_enabled`
- `equals` -> `eq`, `not_equals` -> `neq`, `>=` -> `gte`, atd.
