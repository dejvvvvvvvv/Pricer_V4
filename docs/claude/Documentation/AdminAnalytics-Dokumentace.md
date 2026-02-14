# AdminAnalytics — Dokumentace

> Admin stranka pro zobrazeni analytickych dat widgetu: kalkulace, objednavky, konverzni miry,
> ztracene sessions, top materialy/presety/poplatky a CSV export. Pouziva Forge dark theme
> s inline `<style>` blokem. Data pochazi z localStorage pres `adminAnalyticsStorage.js`.

---

## 1. Prehled

AdminAnalytics (`/admin/analytics`) je analyticka stranka v admin panelu. Obsahuje 5 tabu:

1. **Overview** — souhrnne metriky (6 stat karet), denni serie (kalkulace/den, objednavky/den), top materialy, presety a poplatky
2. **Calculations** — tabulka vsech kalkulacnich sessions s vyhledavanim a filtrem "jen neuspesne"
3. **Orders** — odhadovane trzby, pocet objednavek, prumerna hodnota objednavky + informacni poznamka o Variante A
4. **Lost** — ztracene kalkulace (PRICE_SHOWN bez konverze starsi nez 30 min), tabulka s drop-off informacemi
5. **Exports** — CSV export (calculations / lost / overview) se zapisem do audit logu

Stranka je plne lokalizovana (CS/EN) pres inline `useMemo` slovnik s ternary operatorem `language === 'cs'`.

Pri prvnim renderovani se vola `ensureDemoAnalyticsSeeded()` — pokud v localStorage nejsou zadna analytics data, automaticky se naseeduje 21 dnu demo dat (4 sessions/den, 22% konverze).

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | Inline `<style>` blok s CSS custom properties (Forge tokeny) — BEZ Tailwind, BEZ externiho CSS souboru |
| Routing | React Router v6 (`/admin/analytics` vnorena route pod AdminLayout) |
| i18n | `useLanguage()` hook z `LanguageContext.jsx`, inline slovnik v `useMemo` |
| Ikony | Zadne (stranka nepouziva lucide-react ani jine ikony) |
| Animace | Zadne (stranka nema animace) |

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminAnalytics.jsx             — Jediny soubor, 702 radku, export default AdminAnalytics
```

Stranka nema vlastni slozku `components/`. Vsechny pomocne komponenty jsou definovany
jako lokalni funkce ve stejnem souboru:

| Komponenta | Radky | Popis |
|------------|-------|-------|
| `isoDaysAgo(days)` | 16-21 | Helper — vrati ISO string pro zacatek dne X dni zpet |
| `isoNowEnd()` | 23-27 | Helper — vrati ISO string pro konec dnesniho dne (23:59:59.999) |
| `formatDateTime(iso)` | 29-36 | Helper — konvertuje ISO na `toLocaleString()` |
| `formatNumber(n, digits)` | 38-44 | Helper — formatuje cislo s `toLocaleString()`, null/NaN → `'-'` |
| `downloadTextFile({filename, content, mime})` | 46-56 | Helper — vytvori Blob, spusti download pres docasny `<a>` element |
| `TabButton` | 58-68 | UI — tab button s CSS tridou `mp-tab` / `mp-tab.active` |
| `StatCard` | 70-78 | UI — karta se statistikou (title, value, sub) |
| `MiniSeriesTable` | 80-109 | UI — tabulka s 2 sloupci (datum, pocet) pro denni serie |
| `AdminAnalytics` | 111-701 | Hlavni komponenta — export default |

### Storage soubor

```
src/utils/adminAnalyticsStorage.js   — CRUD pro analytics (localStorage), 446 radku
```

### Forge UI zavislosti

```
src/components/ui/forge/
  ForgeCheckbox.jsx              — Animovany checkbox (pouzit ve filterbaru Calculations tabu)
  ForgeDialog.jsx                — Modalni dialog (pouzit pro Session detail)
```

---

## 4. Import graf

### 4.1 Co AdminAnalytics importuje

| Import | Zdroj | Typ |
|--------|-------|-----|
| `React, useEffect, useMemo, useState` | `react` | Knihovna |
| `ForgeCheckbox` | `../../components/ui/forge/ForgeCheckbox` | Komponenta (default) |
| `ForgeDialog` | `../../components/ui/forge/ForgeDialog` | Komponenta (default) |
| `clearAnalyticsAll` | `../../utils/adminAnalyticsStorage` | Funkce (named) |
| `computeOverview` | `../../utils/adminAnalyticsStorage` | Funkce (named) |
| `ensureDemoAnalyticsSeeded` | `../../utils/adminAnalyticsStorage` | Funkce (named) |
| `filterSessionsByRange` | `../../utils/adminAnalyticsStorage` | Funkce (named) |
| `findLostSessions` | `../../utils/adminAnalyticsStorage` | Funkce (named) |
| `generateCsv` | `../../utils/adminAnalyticsStorage` | Funkce (named) |
| `getAnalyticsSessions` | `../../utils/adminAnalyticsStorage` | Funkce (named) |
| `logExportToAudit` | `../../utils/adminAnalyticsStorage` | Funkce (named) |
| `useLanguage` | `../../contexts/LanguageContext` | Hook (named) |

**Celkem: 4 React API, 2 Forge komponenty, 7 storage funkci, 1 i18n hook.**

### 4.2 Co importuje AdminAnalytics

| Soubor | Jak |
|--------|-----|
| `src/Routes.jsx:28` | `import AdminAnalytics from './pages/admin/AdminAnalytics'` — mapovano na route `/admin/analytics` (radek 106) |
| `src/pages/admin/AdminLayout.jsx:34` | Definice sidebar linku `{ path: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' }` |

AdminAnalytics je importovan primo (ne lazy-loaded). Je soucasti hlavniho bundlu.

---

## 5. Design a vizual

### 5.1 Styling pristup

AdminAnalytics pouziva **inline `<style>` blok** na konci JSX (radky 642-698). Vsechny CSS tridy
maji prefix `mp-` (napr. `mp-card`, `mp-table`, `mp-tab`, `mp-pill`, `mp-stat`).
Zadny externi CSS soubor, zadny Tailwind.

CSS tridy referencuji Forge tokeny pres `var(--forge-*)`:

**Pozadi:**
| Token | Pouziti |
|-------|---------|
| `--forge-bg-void` | Hlavni pozadi stranky `.mp-admin-analytics` |
| `--forge-bg-surface` | Karty `.mp-card` |
| `--forge-bg-elevated` | Inputy, selecty, buttony, JSON pre blok |
| `--forge-bg-overlay` | Button hover stav |

**Text:**
| Token | Pouziti |
|-------|---------|
| `--forge-text-primary` | Nadpisy, stat values, inputy, JSON klice-hodnoty v dialogu |
| `--forge-text-secondary` | Podnapis, tabulka bunky, export poznamka |
| `--forge-text-muted` | Section labely, stat titulky, tabulka headery, hinty, pills |

**Akcenty:**
| Token | Pouziti |
|-------|---------|
| `--forge-accent-primary` | Aktivni tab pozadi, timeline dot, link hover glow, focus border |
| `--forge-success` | `.mp-pill.ok` text barva |
| `--forge-warning` | `.mp-pill.warn` text barva |

**Fonty:**
| Token | Pouziti |
|-------|---------|
| `--forge-font-heading` | Hlavni nadpis `.mp-title` |
| `--forge-font-tech` | Label, stat-title, stat-sub, card-title, tab button, table th, pill, key-value key, timeline event type |
| `--forge-font-mono` | Stat values `.mp-stat-value`, JSON blok `.mp-json` |

**Radii a shadows:**
| Token | Pouziti |
|-------|---------|
| `--forge-radius-md` | Inputy, selecty, buttony, linky, pill-ne |
| `--forge-radius-xl` | Karty |
| `--forge-radius-lg` | JSON pre blok v dialogu |
| `--forge-shadow-sm` | Karty |

### 5.2 Layout

**Header (`.mp-head`):** `display: flex; justify-content: space-between` — nadpis vlevo, akce (obdobi, tlacitka) vpravo. Flex-wrap pro uzsi viewporty.

**Taby (`.mp-tabs`):** `display: flex; gap: 8px` — horizontalni radek pill-shaped tabu.

**Gridy:**
| CSS trida | Sloupce | Pouziti |
|-----------|---------|---------|
| `.mp-grid` | `repeat(6, minmax(0,1fr))` | Overview stat karty (6 karet v rade) |
| `.mp-grid-3` | `repeat(3, minmax(0,1fr))` | Orders stat karty (3 karty v rade) |
| `.mp-two` | `repeat(2, minmax(0,1fr))` | Denni serie tabulky (calcs/day, orders/day) |
| `.mp-three` | `repeat(3, minmax(0,1fr))` | Top tabulky (materials, presets, fees) |
| `.mp-detail-grid` | `380px 1fr` | Session detail dialog (summary vlevo, timeline vpravo) |

**Responsivita:**
| Breakpoint | Zmena |
|------------|-------|
| `max-width: 1100px` | `.mp-grid` → 2 sloupce, `.mp-two` a `.mp-three` → 1 sloupec |
| `max-width: 900px` | `.mp-detail-grid` → 1 sloupec |

**Tabulky (`.mp-table`):** Full-width, border-collapse, `overflow: auto` wrapper. Headery: uppercase, letter-spacing, `--forge-font-tech`, 11px. Bunky: 13px, `--forge-text-secondary`.

### 5.3 Pill badges

| Trida | Styl | Pouziti |
|-------|------|---------|
| `.mp-pill` | Sedy border, neutral text | Vychozi (nekonstrovano / neutral status) |
| `.mp-pill.ok` | Teal border+bg (rgba(0,212,170,...)), `--forge-success` text | Konvertovano = YES, status = success |
| `.mp-pill.warn` | Oranzovy border+bg (rgba(255,181,71,...)), `--forge-warning` text | Status = failed |

### 5.4 Session detail dialog

ForgeDialog s `maxWidth="1000px"`. Obsahuje:
- **Session ID** — sedy text nahore
- **Summary karta** — key-value grid (140px klic, 1fr hodnota): last event, material, preset, price, print time, weight, converted, status
- **Timeline karta** — vertikalni casova osa s teal dots, event type (bold tech font), timestamp, metadata jako JSON pre blok

---

## 8. UI komponenty — detailni popis

### 8.1 AdminAnalytics (hlavni komponenta)

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/pages/admin/AdminAnalytics.jsx` |
| **Radky** | 702 |
| **Export** | `export default function AdminAnalytics` |
| **Props** | Zadne |
| **Hooks** | `useLanguage()`, `useState` (7x), `useEffect` (2x), `useMemo` (6x) |

### 8.2 State management

| State | Typ | Default | Popis |
|-------|-----|---------|-------|
| `tab` | string | `'overview'` | Aktivni tab (overview/calculations/orders/lost/exports) |
| `range` | string | `'30'` | Zvolene obdobi (7/30/90/custom) |
| `fromISO` | string | `isoDaysAgo(30)` | Zacatek rozsahu v ISO formatu |
| `toISO` | string | `isoNowEnd()` | Konec rozsahu v ISO formatu |
| `refreshKey` | number | `0` | Inkrementuje se pro vynuceni prepoctu useMemo |
| `onlyFailed` | boolean | `false` | Filtr "jen neuspesne" v Calculations tabu |
| `q` | string | `''` | Vyhledavaci retezec v Calculations tabu |
| `selectedSessionId` | string/null | `null` | ID session pro detail dialog |
| `exportType` | string | `'calculations'` | Typ CSV exportu (calculations/lost/overview) |

### 8.3 Derived data (useMemo)

| Promenna | Zavislosti | Popis |
|----------|------------|-------|
| `ui` | `[cs]` | Inline lokalizacni slovnik (80+ klicu CS/EN) |
| `sessions` | `[fromISO, toISO, refreshKey]` | Vsechny sessions ve zvolenem obdobi, serazene od nejnovejsich |
| `overview` | `[fromISO, toISO, refreshKey]` | Agregovana data (metriky, serie, top) z `computeOverview()` |
| `calculations` | `[sessions, onlyFailed, q]` | Filtrovane sessions pro Calculations tab (has_price_shown + search + failed filter) |
| `lost` | `[fromISO, toISO, refreshKey]` | Ztracene sessions z `findLostSessions()` |
| `selectedSession` | `[selectedSessionId, sessions]` | Objekt session pro detail dialog |

### 8.4 Effects

| useEffect | Zavislosti | Popis |
|-----------|------------|-------|
| `ensureDemoAnalyticsSeeded()` | `[]` | Jednorazove naseedovani demo dat pri mount |
| Range update | `[range]` | Aktualizuje `fromISO`/`toISO` kdyz se zmeni obdobi (7/30/90) |

### 8.5 Akce (handlery)

| Handler | Popis |
|---------|-------|
| `forceRefresh()` | Inkrementuje `refreshKey` → prepocitaji se vsechny useMemo |
| `handleClear()` | `window.confirm()` → `clearAnalyticsAll()` → reset selectedSessionId → refresh |
| `handleExport()` | `generateCsv()` → `logExportToAudit()` → `downloadTextFile()` → refresh |

### 8.6 Pouzite Forge komponenty

#### ForgeCheckbox
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeCheckbox.jsx` |
| **Props** | `checked`, `onChange`, `disabled?`, `label?`, `size?`, `style?` |
| **Pouziti** | Calculations tab — filtr "Jen neuspesne" / "Only failed" |

#### ForgeDialog
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeDialog.jsx` |
| **Props** | `open`, `onClose`, `title`, `children`, `footer?`, `maxWidth?` |
| **Pouziti** | Session detail modal, `maxWidth="1000px"` |

### 8.7 Lokalni pomocne komponenty

#### TabButton
| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `active: boolean`, `onClick: function`, `children: ReactNode` |
| **Chovani** | `<button>` s CSS tridou `mp-tab`, pridava `active` tridu kdyz `active=true` |
| **Vizual** | Pill-shaped, forge-font-tech 13px, teal pozadi v aktivnim stavu |

#### StatCard
| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `title: string`, `value: string`, `sub?: string` |
| **Chovani** | Karta s uppercase titulkem (11px tech), velkym cislem (22px mono) a volitelnym sub textem |
| **Vizual** | `mp-card mp-stat`, forge-bg-surface s border |

#### MiniSeriesTable
| Vlastnost | Hodnota |
|-----------|---------|
| **Props** | `title`, `series: Array<{date, value}>`, `headerDate?`, `headerCount?`, `noDataText?` |
| **Chovani** | Karta s nadpisem a 2-sloupcovou tabulkou. Safe fallback na prazdne pole. |
| **Vizual** | `mp-card` s `mp-table` uvnitr |

---

## 9. State management a data flow

```
LanguageContext.Provider (App-level)
  |
  v
AdminAnalytics
  |-- useLanguage() → { language } → cs flag → ui slovnik (useMemo)
  |
  |-- useEffect[] → ensureDemoAnalyticsSeeded()
  |       → localStorage: modelpricer:demo-tenant:analytics:events
  |
  |-- useState: tab, range, fromISO, toISO, refreshKey, onlyFailed, q, selectedSessionId, exportType
  |
  |-- useMemo: sessions ← getAnalyticsSessions() + filterSessionsByRange()
  |-- useMemo: overview ← computeOverview()
  |-- useMemo: calculations ← sessions.filter(has_price_shown + q + onlyFailed)
  |-- useMemo: lost ← findLostSessions()
  |-- useMemo: selectedSession ← sessions.find(selectedSessionId)
  |
  |-- handleExport() → generateCsv() + logExportToAudit() + downloadTextFile()
  |       → localStorage: read analytics events
  |       → localStorage: append audit entry (pres adminAuditLogStorage)
  |       → browser: Blob download
  |
  |-- handleClear() → clearAnalyticsAll()
  |       → localStorage: removeItem analytics events
  |
  v
Forge komponenty (ForgeCheckbox, ForgeDialog) — props-driven
```

### Data flow storage helperu

AdminAnalytics **cte** analytics data synchronne z localStorage pres tyto funkce:

| Funkce | Navratovy typ | Popis |
|--------|---------------|-------|
| `getAnalyticsSessions()` | `Session[]` | Nacte eventy z localStorage, postavi sessions pomoci `buildSessionsFromEvents()` |
| `filterSessionsByRange(sessions, {fromISO, toISO})` | `Session[]` | Filtruje sessions podle casoveho rozsahu |
| `computeOverview({fromISO, toISO})` | `{metrics, series, top}` | Agreguje metriky, denni serie a top breakdowny |
| `findLostSessions({fromISO, toISO, olderThanMinutes})` | `Session[]` | Najde sessions s PRICE_SHOWN ale bez konverze, starsi nez X minut |
| `generateCsv({type, fromISO, toISO})` | `string` | Vygeneruje CSV obsah (viz sekce 17 — bug) |

AdminAnalytics **zapisuje** do localStorage pouze pres:

| Funkce | Popis |
|--------|-------|
| `ensureDemoAnalyticsSeeded()` | Naseeduje demo data pokud jeste neexistuji |
| `clearAnalyticsAll()` | Smaze vsechna analytics data |
| `logExportToAudit()` | Zapise zaznam do audit logu (pres `adminAuditLogStorage.appendAuditEntry()`) |

### Storage klic

```
modelpricer:demo-tenant:analytics:events
```

Poznamka: Tenant ID je hardcoded jako `demo-tenant` v `adminAnalyticsStorage.js` (radek 10).
Toto nerespektuje `getTenantId()` z `adminTenantStorage.js`.

---

## 11. Preklady (i18n)

### 11.1 Pristup k lokalizaci

AdminAnalytics **nepouziva** `t()` prekladovou funkci z `useLanguage()`.
Misto toho pouziva vlastni inline slovnik definovany v `useMemo` (radky 115-202):

```javascript
const { language } = useLanguage();
const cs = language === 'cs';

const ui = useMemo(() => ({
  title: cs ? 'Analytika' : 'Analytics',
  subtitle: cs ? 'Prehled toho, co se deje ve widgetu.' : 'Overview of widget activity.',
  // ... 80+ klicu
}), [cs]);
```

Tento pristup obchazi centralni prekladovy slovnik v `LanguageContext.jsx`.
Vsechny texty jsou definovany lokalne a nejsou znovupouzitelne.

### 11.2 Pokryti lokalizace

Vsechny user-facing texty na strance jsou lokalizovane (CS/EN):
- Nadpisy a podnapis
- Vsechny tab labely
- Stat card titulky
- Tabulkove headery
- Filtrovaci labely a placeholdery
- Export labely a poznamky
- Dialog labely
- Confirm dialog text
- Hint texty
- Informacni poznamka o Variante A (Orders tab)

### 11.3 Hardcoded texty (bez prekladu)

| Text | Radek | Jazyk | Poznamka |
|------|-------|-------|----------|
| `'Preset'` | 157 | EN only | Label v lokalizacnim slovniku — stejna hodnota pro CS i EN |
| `'Status'` | 162 | EN only | Label v lokalizacnim slovniku — stejna hodnota pro CS i EN |
| `'PRICE_SHOWN'` | 347 | EN (technicke) | Sub text stat karty |
| `'ORDER_CREATED / ADD_TO_CART'` | 348 | EN (technicke) | Sub text stat karty |
| `'Fee'` | 421 | EN only | Table header v Top Fees tabulce |
| `'YES' / 'NO'` | 490-491 | EN only | Pill badge text pro converted stav |
| `'unknown'` | 483 | EN only | Fallback pro chybejici filename |
| `'Kc'` | 354, 488, 511, 513, 608 | Hardcoded mena | Nereaguje na jazyk — vzdy "Kc" i v EN verzi |
| `'min'` | 486 | EN | Jednotka casu — stejna pro CS i EN |
| `'g'` | 487 | EN | Jednotka hmotnosti — stejna pro CS i EN |

### 11.4 Poznamka k mene

Mena je vsude hardcoded jako `Kc` (ceska koruna). V anglicke verzi by se ocekavalo `$` nebo
dynamicke cteni z pricing konfigurace. Viz take `currency` pole v session summary ktere vrati
`CZK` — ale UI to ignoruje a pouziva vzdy `Kc`.

---

## 16. Souvisejici dokumenty

| Dokument | Cesta |
|----------|-------|
| AdminAnalytics storage | `src/utils/adminAnalyticsStorage.js` |
| Audit Log storage | `src/utils/adminAuditLogStorage.js` |
| ForgeCheckbox | `src/components/ui/forge/ForgeCheckbox.jsx` |
| ForgeDialog | `src/components/ui/forge/ForgeDialog.jsx` |
| LanguageContext | `src/contexts/LanguageContext.jsx` |
| Routes | `src/Routes.jsx` (radek 28 import, radek 106 route) |
| AdminLayout | `src/pages/admin/AdminLayout.jsx` (radek 34 sidebar) |
| Supabase storageAdapter | `src/lib/supabase/storageAdapter.js` (referencovan v analytics storage) |
| Supabase featureFlags | `src/lib/supabase/featureFlags.js` (referencovan v analytics storage) |
| Design Error Log | `docs/claude/Design-Error_LOG.md` |
| MEMORY.md | `.claude/projects/.../memory/MEMORY.md` |

---

## 17. Zname omezeni

### 17.1 BUG — generateCsv vrati string, ale handleExport ocekava objekt

Na radku 274 v AdminAnalytics.jsx:
```javascript
const { filename, csv } = generateCsv({ type: exportType, fromISO, toISO });
```

Funkce `generateCsv` v `adminAnalyticsStorage.js` (radek 314-371) vraci **plain string** (CSV obsah).
Destructuring `{ filename, csv }` ze stringu zpusobi ze obe promenne budou `undefined`.
Nasledne `downloadTextFile({ filename: undefined, content: undefined, ... })` vytvori prazdny
soubor s nazvem `undefined`.

**Dopad:** CSV export generuje prazdny soubor s nazvem "undefined" misto ocekavaneho CSV.

**Oprava:** Bud upravit `generateCsv` aby vracela `{ filename, csv }` objekt,
nebo upravit `handleExport` aby pracoval s plain stringem a sam sestavil filename.

### 17.2 Hardcoded tenant ID v analytics storage

`adminAnalyticsStorage.js` pouziva `DEFAULT_TENANT_ID = 'demo-tenant'` a prefix
`modelpricer:demo-tenant:analytics` hardcoded (radek 9-10). Nerespektuje `getTenantId()`
z `adminTenantStorage.js`.

Toto porusuje invariant #3 z CLAUDE.md: "Tenant-scoped storage — zadny hardcode tenantId/customerId."

### 17.3 Hardcoded mena "Kc"

Mena je vsude hardcoded jako `Kc` — na 5 mistech v JSX (radky 354, 488, 511, 513, 608).
Nereaguje na jazyk ani na `currency` pole ktere session summary obsahuje.
V anglicke verzi by melo zobrazovat `$` nebo cist z pricing konfigurace.

### 17.4 Inline lokalizace misto centralniho slovniku

Preklady jsou definovane v inline `useMemo` slovniku (80+ klicu) misto pouziti `t()` funkce
z `LanguageContext.jsx`. Toto ztezuje:
- Centralni spravu prekladu
- Konzistenci textu napric strankami
- Budouci pridani dalsich jazyku

### 17.5 Zadna paginace v tabulkach

Tabulky Calculations a Lost zobrazuji VSECHNY sessions bez paginace.
Pri 21 dnech demo dat (4 sessions/den) je to ~84 radku, coz je jeste akceptabilni.
V produkcnim prostredi s realnym provozem muze byt stovky/tisice radku.

### 17.6 Zadne sortovani tabulek

Tabulky nepodporuji sortovani kliknutim na hlavicku sloupce.
Sessions jsou pevne razene od nejnovejsich (radek 235, 254).

### 17.7 Absence aria-label na interaktivnich prvcich

- Tab buttony nemaji `role="tab"`, wrapper nema `role="tablist"`
- Detail button v tabulce je `<button class="mp-link">` bez `aria-label`
- Range select nema propojeny label pres `htmlFor`/`id`

### 17.8 Absence loading stavu

Data se nacitaji synchronne z localStorage, takze neni loading stav.
Pri budouci migraci na Supabase (async cteni) bude nutne pridat loading/error stav.

### 17.9 "Overview" export typ neni implementovan

V export selectu je moznost "Shrnuti prehledu" / "Overview summary" (`exportType: 'overview'`),
ale `generateCsv` nema handler pro typ `'overview'` — spadne do default vetve ktera
vrati `['message', 'unknown export type']`.

### 17.10 Jeden soubor (702 radku)

Cela stranka vcetne 5 tabu, session detail dialogu, inline CSS a lokalizace je v jednom souboru.
Taby by mohly byt extrahovany do samostatnych komponent pro lepsi udrzitelnost.
