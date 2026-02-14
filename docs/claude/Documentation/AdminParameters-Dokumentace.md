# AdminParameters — Dokumentace

> Admin stranka pro spravu PrusaSlicer parametru: katalogova knihovna s aktivitou a default hodnotami,
> konfigurace viditelnosti parametru ve widgetu, KPI prehled a pripravena zalozka pro validacni pravidla.
> Pouziva 4 vnorene sub-routes (overview, library, widget, validation) s draft/persisted datovym modelem.

---

## 1. Prehled

AdminParameters (`/admin/parameters`) je admin stranka pro konfiguraci PrusaSlicer parametru.
Organizovana do 4 zalozek s vnorenym routingem:

1. **Overview** — KPI karty (aktivni, zmenene, viditelne ve widgetu, presety) + activity log
2. **Widget parametry** — konfigurace viditelnosti, labelu, help textu, input typu a povolenych hodnot pro zakaznicky widget
3. **Knihovna Parametru** — katalog vsech PrusaSlicer FFF parametru s filtry, bulk akcemi, per-parametr kartami pro aktivitu a default override
4. **Validace** — architektonicky placeholder pro budouci validacni pravidla (neimplementovano)

Stranka pracuje s draft/persisted patternem — zmeny se akumuluji v draftu a ukladaji
tlacitkem "Ulozit zmeny". Badge v hlavicce ukazuje pocet neulozenych zmen.

Celkovy rozsah: **2530 radku** v jednom souboru (`AdminParameters.jsx`).

Datovy zdroj: `PRUSA_PARAMETER_CATALOG` (6272 radku, 100+ parametru) z `prusaParameterCatalog.js`.

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | Forge design tokeny (CSS custom properties) + inline `<style>` bloky v kazde komponente |
| Routing | React Router v6 — vnorene `<Routes>` uvnitr stranky (4 sub-routes) |
| i18n | `useLanguage()` hook z `LanguageContext.jsx` — inline CS/EN ternary |
| Ikony | lucide-react pres `AppIcon` wrapper (Search, X, SearchX, Save, RotateCcw, BarChart3, SlidersHorizontal, List, ShieldCheck, Layers, CheckCircle, Edit, Eye, History, Info, AlertTriangle, Construction) |
| Storage | `readTenantJson`, `writeTenantJson`, `appendTenantLog` z `adminTenantStorage.js` |
| UI | `ForgeCheckbox` z `components/ui/forge/ForgeCheckbox` |

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminParameters.jsx          — 2530 radku, export default AdminParameters
```

Stranka NEMA vlastni slozku `components/`. Vsechny subkomponenty (LibraryPage, WidgetPage,
OverviewPage, ValidationPage, ParamRow, WidgetRow, KpiCard, GradientToggle, Toggle, Badge,
ConfirmModal, Hint) jsou definovany jako interni funkce v jednom souboru.

### Externi datove zdroje

```
src/data/prusaParameterCatalog.js   — PRUSA_PARAMETER_CATALOG (6272 radku, 100+ parametru)
src/utils/adminTenantStorage.js     — readTenantJson, writeTenantJson, appendTenantLog
```

---

## 4. Import graf

### 4.1 Co AdminParameters importuje

| Import | Zdroj | Typ |
|--------|-------|-----|
| `React, useEffect, useMemo, useRef, useState` | `react` | Hooks |
| `Navigate, Route, Routes, useLocation, useNavigate` | `react-router-dom` | Routing |
| `Icon` | `../../components/AppIcon` | Ikona wrapper (default) |
| `ForgeCheckbox` | `../../components/ui/forge/ForgeCheckbox` | UI komponenta (default) |
| `useLanguage` | `../../contexts/LanguageContext` | Hook (named) |
| `PRUSA_PARAMETER_CATALOG` | `../../data/prusaParameterCatalog` | Data (named) |
| `appendTenantLog, readTenantJson, writeTenantJson` | `../../utils/adminTenantStorage` | Storage helpery (named) |

**Celkem: 6 React hooks, 3 router utility, 1 ikona wrapper, 1 UI komponenta, 1 i18n hook, 1 datovy katalog, 3 storage helpery.**

### 4.2 Co importuje AdminParameters

| Soubor | Jak |
|--------|-----|
| `src/Routes.jsx:22` | `import AdminParameters from './pages/admin/AdminParameters'` |
| `src/Routes.jsx:100` | `<Route path="parameters/*" element={<AdminParameters />} />` |

AdminParameters je importovan primo (ne lazy-loaded). Vnoreny routing pouziva wildcard `parameters/*`.

---

## 5. Design a vizual

### 5.1 Forge tokeny pouzivane na strance

**Pozadi:**

| Token | Pouziti |
|-------|---------|
| `--forge-bg-void` | Hlavni pozadi (pres AdminLayout) |
| `--forge-bg-surface` | Karty, filtrovaci panel, group cards, activity rows, KPI |
| `--forge-bg-elevated` | Inputy, selecty, group header, chip default, badges |
| `--forge-bg-overlay` | Focus-within search, hover stavy, badge muted |

**Text:**

| Token | Pouziti |
|-------|---------|
| `--forge-text-primary` | Nadpisy, hodnoty, param label, toggle title |
| `--forge-text-secondary` | Subtitle, chip text, activity text, widget row |
| `--forge-text-muted` | Search placeholder, group hints, ikony, meta, tech labely |
| `--forge-text-disabled` | Badge muted, separator |

**Akcenty:**

| Token | Pouziti |
|-------|---------|
| `--forge-accent-primary` | Primary button, toggle ON stav, activni chip, filter count, changed badge |
| `--forge-accent-primary-h` | Primary button hover |
| `--forge-error` | Toggle OFF gradient, danger buttony, error texty, clear filter |
| `--forge-warning` | Inactive badge, warning banner v WidgetRow |
| `--forge-success` | Badge green (ulozeno) |
| `--forge-info` | Validation banner |

**Fonty:**

| Token | Pouziti |
|-------|---------|
| `--forge-font-heading` | h1, section titly, group titly, validation title |
| `--forge-font-tech` | Filtrovaci labely, KPI title, tab navigace, badge |
| `--forge-font-mono` | Parametr key, filter count, activity timestamp, inputy, KPI value |

**Borders & Shadows:**

| Token | Pouziti |
|-------|---------|
| `--forge-border-default` | Vsechny karty, inputy, separatory, dividers |
| `--forge-border-active` | Hover stavy, dashed empty state |
| `--forge-radius-xl` | Karty, panely, bannery |
| `--forge-radius-lg` | Buttony, inputy, badges |
| `--forge-radius-md` | Filtrovaci selecty, code badges |
| `--forge-shadow-sm` | Karty, KPI, group cards |
| `--forge-shadow-lg` | Modal overlay |

### 5.2 Layout

**Kontejner:** `max-width: 1100px` (omezeno primo na `.admin-parameters`)

| Oblast | Layout | Breakpoints |
|--------|--------|-------------|
| Page header | `flex, justify-content: space-between` | Na <700px: `flex-direction: column` |
| Tab navigace | `flex, gap: 10px, flex-wrap` | Na <700px: `margin-left: 0` pro tabs-right |
| KPI grid (Overview) | `grid-template-columns: repeat(4, 1fr)` | <1100px: 2 sloupce, <700px: 1 sloupec |
| Activity rows (Overview) | `grid-template-columns: 180px 1fr` | <700px: 1 sloupec |
| Param rows (Library) | `grid-template-columns: repeat(3, 1fr)` | <1200px: 2 sloupce, <720px: 1 sloupec |
| Widget body | `grid-template-columns: 1fr 1fr` | <1000px: 1 sloupec |
| Widget advanced | `grid-template-columns: 1fr 1fr 2fr` | <1000px: 1 sloupec |
| Filter panel | `flex-direction: column, gap: 12px` | <768px: search row se stackuje |

### 5.3 Interni komponenty s inline styly

Kazda interni komponenta (`GradientToggle`, `Toggle`, `Badge`, `ConfirmModal`, `Hint`, `ParamRow`,
`WidgetRow`, `KpiCard`, `LibraryPage`, `WidgetPage`, `OverviewPage`, `ValidationPage`)
ma vlastni `<style>` blok s CSS deklaracemi. Tridy NEJSOU scoped (plain CSS selektory).

### 5.4 GradientToggle vizual

Toggle switch s CSS gradient pozadim:
- **OFF stav:** gradient `var(--forge-error)` -> `#c0392b` (cervena)
- **ON stav:** gradient `var(--forge-accent-primary)` -> `#00a886` (teal)
- **Knob:** `var(--forge-text-primary)` s border a shadow, `translateX(20px)` pri checked
- **Focus ring:** `outline: 2px solid var(--forge-accent-primary), offset 2px`
- **Disabled:** `opacity: 0.5, cursor: not-allowed`

---

## 8. UI komponenty — detailni popis

### 8.1 AdminParameters (hlavni komponenta)

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/pages/admin/AdminParameters.jsx` |
| **Radky** | 2530 |
| **Export** | `export default AdminParameters` |
| **Props** | Zadne |
| **State** | `persisted` (ulozeny stav), `draft` (editovany stav), `saveStatus`, `confirmResetAllOpen` |
| **Hooks** | `useLanguage()`, `useLocation()`, `useNavigate()`, `useMemo()`, `useState()`, `useEffect()` |
| **Routing** | Vnorene `<Routes>` s 4 sub-routes + index redirect |

### 8.2 Interni subkomponenty

#### GradientToggle (radek 169-234)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `checked: boolean`, `onChange: (boolean) => void`, `disabled?: boolean` |
| **Chovani** | Custom toggle switch s gradient pozadim. Skryty native checkbox, vizualni track + knob. |
| **Pouziti** | V `Toggle` komponente, ktera obaluje GradientToggle + label + hint. |

#### Toggle (radek 236-281)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `checked`, `onChange`, `disabled?`, `label?`, `hint?`, `rightSlot?` |
| **Chovani** | Wrapper kolem GradientToggle s textovym labelem a napovdou. rightSlot umoznuje vlozit dalsi element vpravo od titulku. |
| **Pouziti** | ParamRow (active_for_slicing), WidgetRow (visible_in_widget), WidgetPage (enable_widget_overrides) |

#### Badge (radek 283-308)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `children: ReactNode`, `tone?: 'gray'|'blue'|'amber'|'red'|'green'` |
| **Chovani** | Pill badge s barvou podle tone. Pouziva `--forge-font-tech` pro text. |
| **Pouziti** | Page header (save status), group header (pocet parametru), WidgetRow (viditelnost status) |

#### ConfirmModal (radek 310-397)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `open`, `title`, `description?`, `confirmText?`, `cancelText?`, `danger?`, `onConfirm`, `onCancel` |
| **Chovani** | Modalni dialog s backdrop overlay. Blokuje scroll (`document.body.style.overflow = 'hidden'`). Zachytava wheel eventy na overlay. |
| **Pouziti** | Reset parametru (hlavni), bulk akce v LibraryPage (reset group, enable/disable all) |

#### Hint (radek 399-419)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `children: ReactNode` |
| **Chovani** | Informacni box s Info ikonou. |
| **Pouziti** | LibraryPage — napoveda o vyzamu checkboxu |

#### ParamRow (radek 1022-1372)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `def`, `row`, `selected`, `onToggleSelected`, `onChange`, `language` |
| **Chovani** | Karta parametru s: checkbox pro selekci, label + key + badges (dataType, changed/default, inactive), toggle pro active_for_slicing, value input (dle dataType: select/number/textarea), reset tlacitko. |
| **Value input varianty** | `boolean` -> select true/false, `enum` -> select z options, `number` -> number input, `string/gcode` -> textarea |
| **Visual stavy** | `has-error` (cerveny border + shadow), `is-default` (CSS trida na inputu kdyz neni override) |

#### KpiCard (radek 1529-1580)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `title: string`, `value: number`, `icon: string` |
| **Chovani** | Mala karta s ikonou (40x40 kruh), uppercase labelem (forge-font-tech) a velkym cislem (forge-font-mono, 22px). |
| **Pouziti** | OverviewPage — 4 KPI karty |

#### WidgetRow (radek 1758-2073)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `language`, `def`, `libraryRow`, `widgetRow`, `enabled`, `onChange` |
| **Chovani** | Karta pro konfiguraci jednoho parametru ve widgetu: toggle viditelnosti, widget label a help text inputy, input type select, read-only select, povolene hodnoty (min/max/step pro number, checkbox grid pro enum). Varuje kdyz parametr je neaktivni pro slicovani. |
| **Disabled logika** | Disabled pokud: `enable_widget_overrides` je false NEBO parametr je `inactive_for_slicing` |

### 8.3 Subpages

#### OverviewPage (radek 1374-1527)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `language`, `draft` |
| **State** | Zadny vlastni (computed z draft a storage) |
| **Chovani** | 4 KPI karty (aktivni parametry, zmenene, viditelne ve widgetu, presety) + activity log (posledni zmeny z localStorage). |
| **Storage cteni** | `readTenantJson('presets:v1', [])`, `readTenantJson('parameters:activity:v1', [])` |
| **Activity zobrazeni** | Max 8 poslednich zaznamu, kazdy s datem a sumarizaci. Detaily max 5 polozek s code formatatem klicu. |

#### LibraryPage (radek 434-1020)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `language`, `defsByKey`, `draft`, `persisted`, `onPatchDraft`, `onResetGroup`, `onResetAll`, `onEnableGroup`, `onDisableGroup`, `saveDisabled`, `onSave` |
| **State** | `search`, `group`, `onlyActive`, `onlyInactive`, `onlyChanged`, `typeFilter`, `levelFilter`, `confirm` |
| **Chovani** | Filtrovaci panel + parametrove karty seskupene podle group. Bulk akce pro skupinu (enable/disable all, reset group, reset all). |
| **Filtry** | Textove hledani (nazev/klic), skupina (select), datovy typ (number/boolean/enum/string), uroven (basic/mid/pro), chip filtry (aktivni/neaktivni/zmenene), clear all |
| **Razeni** | Podle skupiny (abecedne), pak podle labelu v ramci skupiny |
| **Layout** | Parametry v 3-sloupcovem gridu, seskupene do group-card |

#### WidgetPage (radek 1582-1756)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `language`, `draft`, `onPatchDraft` |
| **State** | `search`, `group`, `onlyActive`, `onlyVisible` |
| **Chovani** | Master toggle "Povolit zakaznikovi menit parametry ve widgetu" + seznam WidgetRow karet s filtry. |
| **Filtry** | Textove hledani, skupina (select), chip filtry (jen aktivni pro slicovani, jen viditelne ve widgetu) |

#### ValidationPage (radek 2075-2146)

| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `language` |
| **State** | Zadny |
| **Chovani** | Placeholder s informacnim bannerem a priklady budoucich validacnich pravidel. |
| **Priklady pravidel** | `layer_height <= 0.75 * nozzle_diameter`, `fill_density` 0..100, `perimeters >= 1`, podminene skryvani support parametru |

---

## 9. State management a data flow

### 9.1 Draft/Persisted pattern

AdminParameters pouziva **optimisticky draft pattern:**

```
1. Inicializace: persisted = loadPersisted(language)
                 draft = deepClone(persisted)

2. Uzivatel meni parametry -> onPatchDraft() -> aktualizuje draft
   - dirtyCount = computeDiffCount(draft, persisted)
   - Badge ukazuje "Neulozene zmeny (X)"

3. Save: writeTenantJson('parameters:v1', draft)
         appendTenantLog('parameters:activity:v1', changeLog)
         persisted = draft (synchronizace)

4. Reset: draft = buildDefaultState(language)  // katalogove defaulty
```

### 9.2 Datovy model (localStorage)

**Namespace:** `parameters:v1`

```javascript
{
  enable_widget_overrides: true,       // Master toggle pro widget parametry

  parameters: {
    "fill_density": {
      active_for_slicing: true,        // Pouzit parametr v konfiguraci
      default_value_override: null,    // null = pouzit katalogovy default
    },
    "layer_height": {
      active_for_slicing: true,
      default_value_override: 0.2,     // Admin override hodnoty
    },
    // ... pro kazdy parametr z PRUSA_PARAMETER_CATALOG
  },

  widget: {
    "fill_density": {
      visible_in_widget: false,        // Zobrazit zakaznikovi
      widget_label: "Hustota vyplne",  // Label ve widgetu
      widget_help: "...",              // Help text
      input_type: "auto",             // auto|slider|select|toggle|text
      allowed_values_override: null,   // null = pouzit katalogove
      locked_readonly: false,          // Read-only ve widgetu
    },
    // ... pro kazdy parametr
  },

  updated_at: "2026-02-13T12:00:00.000Z",
  updated_by: "admin",
}
```

**Activity log namespace:** `parameters:activity:v1`

```javascript
[
  {
    at: "2026-02-13T12:00:00.000Z",
    summary: "Saved parameters (3 changes)",
    details: [
      { key: "fill_density", field: "active_for_slicing", from: false, to: true },
      { key: "layer_height", field: "default_value_override", from: null, to: 0.2 },
      { key: "fill_density", field: "widget", from: "...", to: "..." },
    ],
  },
  // max 100 zaznamu (appendTenantLog limit)
]
```

**Presets namespace (jen cteni):** `presets:v1` — pole presetu, OverviewPage cte `.length` pro KPI.

### 9.3 Forward-compatible merge

Pri nacteni z localStorage se ukladata data merguji pres katalog:

```
1. buildDefaultState(language) -> zakladni stav z PRUSA_PARAMETER_CATALOG
2. Pokud existuji persisted data -> merguj pres zakladni stav
3. Nove parametry v katalogu dostanou defaulty
4. Stare parametry bez katalogoveho zaznamu se ignoruji (continue)
```

Toto zajistuje ze aktualizace katalogu neposkodi ulozena data.

### 9.4 Save validace

Pred ulozenim se validuji:
- **Number parametry:** `Number.isFinite(value)`, `value >= def.min`, `value <= def.max`
- **Enum parametry:** hodnota musi byt v `def.options`
- Pokud validace selze, Save tlacitko je disabled

### 9.5 Language change handling

Pri zmene jazyka (`useEffect [language]`):
1. Znovu nacte persisted z localStorage
2. Draft zachova aktualni hodnoty ale doplni nove katalogove klice
3. Widget labely/help se NEprepisuji (uzivatel je mohl zmenit)

### 9.6 Data flow diagram

```
PRUSA_PARAMETER_CATALOG (staticka data)
  |
  v
buildDefaultState(language) ---------> loadPersisted() ----> readTenantJson('parameters:v1')
  |                                          |
  v                                          v
persisted (state) <--- merge --- localStorage data
  |
  v (deepClone)
draft (state) <--- onPatchDraft() <--- LibraryPage / WidgetPage / hlavni UI
  |
  v (handleSave)
writeTenantJson('parameters:v1', draft) ---> localStorage
appendTenantLog('parameters:activity:v1')
```

---

## 11. Preklady (i18n)

### 11.1 Pristup k lokalizaci

Stranka NEPOUZIVA `t()` prekladovou funkci. Misto toho pouziva primo:

```javascript
language === 'cs' ? 'Cesky text' : 'English text'
```

Toto je konzistentni v cele komponente — vsechny texty pouzivaji inline ternary.

### 11.2 Prehled lokalizovanych textu

**Hlavicka:**
- Subtitle: "Sprava parametru pro PrusaSlicer..." / "Manage PrusaSlicer parameters..."
- Save status badge: "Neulozene zmeny" / "Unsaved changes", "Ulozeno" / "Saved"
- Buttony: "Reset", "Ulozit zmeny" / "Save changes"

**Tab navigace:**
- "Overview" (CS/EN stejne)
- "Widget parametry" / "Widget"
- "Knihovna Parametru" / "Parameter Library"
- "Validace" / "Validation"
- "Presety" / "Presets"

**LibraryPage:**
- Search: "Hledat podle nazvu nebo klice..." / "Search by name or key..."
- Selekty: "Skupina"/"Group", "Datovy typ"/"Data type", "Uroven"/"Level"
- Chipy: "Aktivni"/"Active", "Neaktivni"/"Inactive", "Zmenene"/"Changed"
- Bulk akce: "Enable all", "Disable all", "Reset group", "Reset all" (CS/EN)
- Confirm modaly: cesky/anglicky dle jazyka

**WidgetPage:**
- Master toggle: "Povolit zakaznikovi menit parametry ve widgetu" / "Allow customers to change parameters in widget"
- Chipy: "Jen aktivni pro slicovani" / "Active for slicing only"
- Labels: "Widget label", "Help text", "Input typ"/"Input type", "Read-only"

**OverviewPage:**
- KPI: "Aktivni parametry"/"Active parameters", "Zmenene parametry"/"Changed parameters", "Viditelne ve widgetu"/"Visible in widget", "Presetu"/"Presets"
- "Posledni zmeny"/"Recent changes", "Zatim zadne zmeny."/"No changes yet."

**ValidationPage:**
- Banner o pripravene architekture
- "Priklady pravidel (budouci)" / "Example rules (future)"

### 11.3 Hardcoded texty (bez prekladu)

| Text | Misto | Jazyk |
|------|-------|-------|
| `"Parameters"` (h1 nadpis) | radek 2336 | EN only |
| Parametr labely z katalogu | prusaParameterCatalog.js | CS/EN (dle def.label) |
| `"Enable all"`, `"Disable all"` | radek 623-624 | EN only (CS i EN verze jsou stejne "Enable all") |
| `"Widget label"`, `"Help text"` | radek 1812, 1820 | EN only (CS i EN verze jsou stejne) |
| `"Read-only"` | radek 1847 | EN only |
| Bulk akce confirm texty | radky 622-632 | Obsahuji ceske znaky (zarky, haczky) |

---

## 15. Vnoreny routing

### 15.1 Route mapa

| Sub-route | Komponenta | Popis |
|-----------|------------|-------|
| `/admin/parameters` (index) | `<Navigate to="overview" replace />` | Redirect na overview |
| `/admin/parameters/overview` | `<OverviewPage>` | KPI + activity log |
| `/admin/parameters/widget` | `<WidgetPage>` | Widget konfigurace |
| `/admin/parameters/library` | `<LibraryPage>` | Katalogova knihovna |
| `/admin/parameters/validation` | `<ValidationPage>` | Placeholder |
| `/admin/parameters/*` (catch-all) | `<Navigate to="overview" replace />` | Fallback redirect |

### 15.2 Tab navigace

Tab navigace je implementovana jako pole buttonu s `onClick={() => navigate(path)}`.
Aktivni tab se urcuje porovnanim `location.pathname` s tab path.

Link na Presety (`/admin/presets`) je oddeleny vpravo (`.tabs-right { margin-left: auto }`)
jako externi odkaz mimo vnoreny routing.

---

## 16. Souvisejici dokumenty

| Dokument | Cesta |
|----------|-------|
| PrusaSlicer Parameter Catalog | `src/data/prusaParameterCatalog.js` |
| Tenant Storage Helpery | `src/utils/adminTenantStorage.js` |
| Routes (registrace stranky) | `src/Routes.jsx` (radek 22, 100) |
| ForgeCheckbox | `src/components/ui/forge/ForgeCheckbox.jsx` |
| AppIcon | `src/components/AppIcon.jsx` |
| LanguageContext | `src/contexts/LanguageContext.jsx` |
| AdminPresets (propojena stranka) | `src/pages/admin/AdminPresets.jsx` |
| Forge Tokens CSS | `src/styles/forge-tokens.css` |
| Design Error Log | `docs/claude/Design-Error_LOG.md` |

---

## 17. Zname omezeni

### 17.1 Jeden soubor (2530 radku)

Cela stranka vcetne 12+ internich komponent je v jednom souboru. Rozdeleni do
`components/parameters/` slozky by zlepsilo udrzitelnost a umoznilo sdileni
(napr. GradientToggle, ConfirmModal, Badge jsou obecne pouzitelne).

### 17.2 Nescopovane CSS tridy

Vsechny `<style>` bloky pouzivaji plain CSS selektory (`.row`, `.title`, `.badge`, `.btn`, atd.).
Tyto genericke nazvy se mohou stribat mezi komponentami (napr. `.badge` je definovana
v Badge i v ParamRow s ruznou vizualni podobou). Na strance to funguje diky kaskade,
ale pri pouziti komponent mimo kontext mohou nastat konflikty.

### 17.3 Nadpis "Parameters" jen anglicky

Hlavni nadpis `<h1>Parameters</h1>` na radku 2336 je hardcoded v anglictine bez CS prekladu.
Mel by pouzivat ternary pro cesky ekvivalent "Parametry".

### 17.4 Nekoncistentni pouziti diakritiky v inline CS textech

Ceske texty v inline ternary obsahuji ceskou diakritiku (hacky, carky):
`'Správa parametrů'`, `'Neuložené změny'`, `'Vrátit na výchozí'`, atd.
Toto je spravne pro user-facing texty, ale nekonzistentni s nekterymi jinymi admin strankami
kde se diakritika v UI textech nepouziva.

### 17.5 "Enable all" / "Disable all" bez ceske varianty

Bulk akce tlacitka na radcich 623-627 maji CS i EN verzi nastavenu na stejny anglicky text:
```javascript
language === 'cs' ? 'Enable all' : 'Enable all'
```
Ceska varianta by mela byt "Zapnout vse" / "Vypnout vse".

### 17.6 ConfirmModal bez Escape key handleru

ConfirmModal (radek 310-397) se zavre pouze kliknutim na "Cancel" nebo "Confirm".
Chybi Escape key handler pro zavreni modalu, coz je nekonzistentni s WAI-ARIA Dialog patternem.

### 17.7 ConfirmModal bez click-outside zavreni

Kliknuti na backdrop overlay nezavre modal. Ocekavane chovani je zavreni pri kliknu
mimo modalni okno.

### 17.8 ParamRow props nesoulad

ParamRow definuje props `selected` a `onToggleSelected` (radek 1022), ale LibraryPage
tyto props nepredava (predava `onChange` misto `onToggleSelected`). ForgeCheckbox
v ParamRow pouziva `selected` a `onToggleSelected` — ktere jsou `undefined`, takze
checkbox nefunguje (nekontrolovany stav).

### 17.9 ValidationPage je prazdny placeholder

Zalozka "Validace" neobsahuje zadnou funkcionalitu — jen informacni banner a priklady
budoucich pravidel. Ceka na implementaci validacniho enginu.

### 17.10 DeepClone pouziva JSON.parse/JSON.stringify

Utility `deepClone()` pouziva `JSON.parse(JSON.stringify(obj))` coz:
- Ztraci `undefined` hodnoty (konvertuji se na `null` v polich, vynechaji v objektech)
- Nefunguje s Date, RegExp, Map, Set, Function, Symbol
- Pro tento use case je to dostatecne (jen primitivy a plain objects), ale neni to idealni.

### 17.11 Celostrankov CSS redefiniuce select/input

LibraryPage a WidgetPage definuji globalni `select {}` a `input, select {}` styly
ve svych `<style>` blocich. Tyto mohou ovlivnit jine inputy na strance pokud by se
komponenty kombinovaly.

### 17.12 Widget allowed_values_override nullable semantika

`allowed_values_override: null` znamena "pouzit katalogove povolene hodnoty".
Toto je dokumentovano v komentari ale neni explicitne vyrazeno v UI. Uzivatel nemusi
vedet ze "prazdne" pole = katalogovy default.
