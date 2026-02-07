# V3-S16: Multijazynost a Multimenovost

> **Priorita:** P2 | **Obtiznost:** Vysoka | **Vlna:** 4
> **Zavislosti:** S01, S02, S07, S12, S13, S14, S15
> **Odhadovany rozsah:** Velky (~50-70 souboru, 4000-6000 radku)

---

## A. KONTEXT

### A1. Ucel a cil

Sekce S16 implementuje kompletni internacionalizaci (i18n) a podporu vice men
v ModelPricer. Soucasny stav je omezeny na:
- Cesky jazyk v admin panelu (cs) s jednoduchym prepinacim cs/en
- Pevne hardcoded "Kc" formatovani v celé aplikaci
- Zadna podpora vice men pro zakazniky

**Cilovy stav:**

1. **Multijazynost (i18n)**
   - Plne prekladove soubory pro cs, en, de, sk, pl (5 jazyku)
   - Dynamicky prepinac jazyka ve widgetu i adminu
   - Admin muze customizovat preklady (override texty)
   - Admin muze pridat novy jazyk (upload JSON)
   - Widget respektuje jazyk zakaznika (auto-detect z prohlizece)

2. **Multimenovost (multi-currency)**
   - Admin nastavi hlavni menu (CZK, EUR, USD, ...)
   - Admin povoli dalsi meny pro widget (zakaznik si vybere)
   - Kurzovy prepocet — manualni (admin zada kurz) nebo automaticky (API)
   - Spravne formatovani cen dle locale (1 234,56 Kc vs EUR1,234.56)
   - Objednavka se vzdy uklada v hlavni mene (ucetni konzistence)

**Business value:**
- Cesky 3D tiskovy e-shop muze obsluhovat nemecke a polske zakazniky
- Spravne formatovani cen zvysuje duveru zakazniku (+12% conversion dle studii)
- Zakonny pozadavek pro EU obchod — ceny v mene zakaznika
- Snadna expanze na nove trhy bez nutnosti menit kod

### A2. Priorita, obtiznost, vlna

**Priorita P2:** Soucasny cs/en prepinac staci pro cesky trh. Plna i18n je
potreba az pri expanzi do zahranici.

**Obtiznost Vysoka:** Toto je prurezcova zmena dotykajici se KAZDE textove
komponenty v aplikaci:
- Nahradit vsechny hardcoded texty prekladovymi klici
- Implementovat currency formatting pipeline
- Resit RTL layout (arabstina — budouci)
- Resit pluralizaci (1 model, 2-4 modely, 5+ modelu)
- Resit datum/cas formatovani dle locale
- Admin UI pro spravu prekladu a men
- Widget config propagace (jazyk + mena pres postMessage)

**Vlna 4:** Vyzaduje stabilni widget, admin, pricing engine. Dotyka se skoro
vsech casti aplikace — proto az v pozdni vlne.

### A3. Zavislosti na jinych sekcich

**MUSI byt hotove pred S16:**
| Sekce | Duvod |
|-------|-------|
| S01 (Bug Fixes) | Stabilni zaklad |
| S02 (Checkout) | Kontaktni formular s i18n |

**DOPORUCENE pred S16:**
| Sekce | Duvod |
|-------|-------|
| S07 (Emaily) | Emaily v jazyce zakaznika |
| S12 (Portal) | Portal v jazyce zakaznika |
| S13 (Dokumenty) | Faktury v jazyce zakaznika |
| S14 (Kanban) | Admin UI preklady |
| S15 (Pricing methods) | Nazvy metod v i18n |

**Na S16 ZAVISI:**
| Sekce | Duvod |
|-------|-------|
| S17 (Ecommerce) | Pluginy v jazyce zakaznika |
| S22 (Onboarding) | Onboarding v jazyce admina |

### A4. Soucasny stav v codebase

**Co uz existuje:**
- `src/i18n.js` — i18next inicializace s jednim jazykem (cs)
  - Pouziva `i18next`, `react-i18next`, `i18next-browser-languagedetector`
  - Nacita z `src/locales/cs/translation.json`
- `src/locales/cs/translation.json` — preklady pro registraci a login
  - Obsahuje ~60 klicu, ale POUZE pro registracni a login formulare
  - CHYBI: admin, widget, pricing, objednavky, home page
- `src/contexts/LanguageContext.jsx` — jednoduchy cs/en context
  - `useLanguage()` hook — vraci `{ language, setLanguage, toggleLanguage, t }`
  - `t(key)` — lookup v hardcoded `translations` objektu
  - Obsahuje ~200 klicu pro admin, home, pricing, support stranky
  - **DVA paralelni systemy:** i18next (`src/i18n.js`) + LanguageContext
- `src/pages/login/components/LanguageToggle.jsx` — prepinac cs/en

**Co chybi:**
- Jednotny prekladovy system (aktualne dva paralelni)
- Prekladove soubory pro en, de, sk, pl
- Admin UI pro spravu prekladu
- Currency formatting system
- Admin UI pro spravu men a kurzu
- Automaticky kurzovy prepocet (API)
- Widget propagace jazyka a meny
- `src/utils/adminLocalizationStorage.js` — NEEXISTUJE (namespace `localization:v1`)

**Relevantni existujici soubory:**
```
src/i18n.js                                    — i18next setup (cs only)
src/locales/cs/translation.json                — i18next preklady (registrace/login)
src/contexts/LanguageContext.jsx                — LanguageContext s hardcoded preklady
src/pages/login/components/LanguageToggle.jsx   — cs/en prepinac
src/pages/admin/AdminOrders.jsx                 — formatMoney() hardcoded "Kc"
src/pages/admin/AdminPricing.jsx                — hardcoded "Kc"
src/pages/admin/AdminFees.jsx                   — hardcoded "Kc"
src/lib/pricing/pricingEngineV3.js              — vracti cisla (bez formatovani)
```

### A5. Referencni zdroje a konkurence

**Doporucene OSS knihovny (ze zdrojoveho dokumentu):**

| Knihovna | GitHub | Hvezdy | Popis | Licence |
|----------|--------|--------|-------|---------|
| **i18next** | i18next/i18next | 7.5k+ | Nejpopularnejsi i18n framework | MIT |
| **react-i18next** | i18next/react-i18next | 9k+ | React binding pro i18next | MIT |
| **next-intl** | amannn/next-intl | 2k+ | i18n pro Next.js | MIT |
| **react-intl** | formatjs/formatjs | 14k+ | Format.js pro React | BSD-3 |
| **Lingui** | lingui/js-lingui | 4k+ | Moderni i18n s extrakci | MIT |
| **dinero.js** | dinerojs/dinero.js | 6k+ | Immutable currency library | MIT |
| **currency.js** | scurker/currency.js | 3k+ | Lehka currency library | MIT |

**Doporuceni pro ModelPricer:**
- **i18n:** Rozsirit existujici `i18next` + `react-i18next` (uz je v projektu)
  - Eliminovat duplicitni LanguageContext — presunout vsechny preklady do i18next
- **Currency:** `Intl.NumberFormat` (nativni) + vlastni konverzni vrstva
  - dinero.js je overkill pro nase potreby (jde o formatovani, ne o financni operace)

**Konkurencni reseni:**
- **Layers.app** — 3 jazyky (en, de, fr), 5 men
- **AutoQuote3D** — 2 jazyky (en, de), 3 meny
- **Craftcloud3D** — 10+ jazyku, 8 men, automaticke kurzy

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `localization:v1`
**Storage klic:** `modelpricer:${tenantId}:localization:v1`

```json
{
  "schema_version": 1,
  "language": {
    "default_locale": "cs",
    "available_locales": ["cs", "en", "de", "sk", "pl"],
    "show_language_switcher": true,
    "switcher_position": "header",
    "auto_detect_browser_locale": true,
    "custom_overrides": {
      "cs": {
        "checkout.submit": "Odeslat poptavku",
        "pricing.total": "Celkova cena"
      },
      "en": {
        "checkout.submit": "Submit quote request"
      }
    },
    "custom_locales": {}
  },
  "currency": {
    "primary_currency": "CZK",
    "available_currencies": ["CZK", "EUR", "USD"],
    "show_currency_switcher": true,
    "exchange_rates": {
      "EUR": {
        "rate": 0.0400,
        "source": "manual",
        "updated_at": "2026-02-06T10:00:00Z"
      },
      "USD": {
        "rate": 0.0435,
        "source": "manual",
        "updated_at": "2026-02-06T10:00:00Z"
      }
    },
    "auto_update_rates": false,
    "rates_api_url": "https://api.exchangerate-api.com/v4/latest/CZK",
    "rates_update_frequency": "daily",
    "display_options": {
      "show_original_price": true,
      "original_price_format": "parentheses",
      "decimal_places": 2
    }
  },
  "formatting": {
    "date_format_override": null,
    "number_format_override": null,
    "timezone": "Europe/Prague"
  },
  "updated_at": "2026-02-06T10:00:00Z"
}
```

**Prekladove soubory (staticky v codebase):**
```
src/locales/
  cs/translation.json   — cestina (vychozi, ~500+ klicu)
  en/translation.json   — anglictina
  de/translation.json   — nemcina
  sk/translation.json   — slovenstina
  pl/translation.json   — polstina
```

**Tenant custom overrides (v localStorage):**
- Adminem prepsane texty se ukladaji v `localization:v1` -> `language.custom_overrides`
- Merguji se nad statickymi preklady pri nacteni

### B2. API kontrakty (endpointy)

**Frontend-only (localStorage):**

```javascript
// adminLocalizationStorage.js
export function loadLocalizationConfig() { ... }
export function saveLocalizationConfig(config) { ... }
export function getActiveLocale() { ... }
export function getActiveCurrency() { ... }
export function convertPrice(amount, fromCurrency, toCurrency) { ... }
export function formatPrice(amount, currency, locale) { ... }
export function getCustomOverrides(locale) { ... }
export function saveCustomOverride(locale, key, value) { ... }
```

**Budouci backend endpointy:**
```
GET    /api/localization/config
  Response: { language, currency, formatting }

PUT    /api/localization/config
  Body: { language, currency, formatting }
  Response: { config }

GET    /api/localization/translations/:locale
  Response: { translations: { "key": "value", ... } }

PUT    /api/localization/translations/:locale
  Body: { overrides: { "key": "new value" } }
  Response: { translations }

POST   /api/localization/translations/:locale/import
  Body: multipart/form-data (JSON file)
  Response: { imported_count, conflicts }

GET    /api/localization/translations/:locale/export
  Response: application/json (download)

GET    /api/localization/exchange-rates
  Response: { rates: { EUR: 0.040, USD: 0.0435 }, updated_at }

POST   /api/localization/exchange-rates/refresh
  Response: { rates, source, updated_at }
```

### B3. Komponentni strom (React)

```
App
├── I18nProvider (rozsireny i18next provider)
│   ├── CurrencyProvider (NOVY context)
│   │   └── ... vsechny stranky

AdminLocalization (nova stranka /admin/localization)
├── LocalizationHeader
│   ├── PageTitle ("Jazyky a meny")
│   └── SaveButton
├── TabNavigation (Jazyky | Meny | Formatovani)
├── [tab: Jazyky] LanguageSettings
│   ├── DefaultLocaleSelector
│   │   └── LocaleDropdown (cs, en, de, sk, pl)
│   ├── AvailableLocalesCheckboxGroup
│   │   ├── LocaleCheckbox (pro kazdy jazyk)
│   │   └── AddCustomLocaleButton
│   ├── LanguageSwitcherConfig
│   │   ├── ShowSwitcherToggle
│   │   ├── SwitcherPositionSelect (header | footer | hidden)
│   │   └── AutoDetectToggle
│   ├── TranslationOverrides
│   │   ├── LocaleTabBar (cs | en | de | ...)
│   │   ├── TranslationSearchInput
│   │   ├── TranslationTable
│   │   │   ├── TranslationRow
│   │   │   │   ├── KeyCell (readonly)
│   │   │   │   ├── DefaultValueCell (readonly, dimmed)
│   │   │   │   ├── OverrideValueInput (editable)
│   │   │   │   └── ResetButton (smazat override)
│   │   │   └── ... (pro kazdy klic)
│   │   └── Pagination
│   └── ImportExportActions
│       ├── ExportJsonButton
│       ├── ImportJsonButton (file upload)
│       └── ImportPreview (modal s konflikty)
├── [tab: Meny] CurrencySettings
│   ├── PrimaryCurrencySelector
│   │   └── CurrencyDropdown (CZK, EUR, USD, GBP, PLN, CHF)
│   ├── AvailableCurrenciesConfig
│   │   ├── CurrencyCheckboxGroup
│   │   └── ExchangeRateTable
│   │       ├── CurrencyRateRow
│   │       │   ├── CurrencyCode
│   │       │   ├── RateInput (manualni)
│   │       │   ├── SourceBadge (manual | api)
│   │       │   ├── LastUpdated
│   │       │   └── RefreshButton
│   │       └── ... (pro kazdou menu)
│   ├── AutoUpdateConfig
│   │   ├── EnableAutoUpdateToggle
│   │   ├── ApiUrlInput
│   │   ├── UpdateFrequencySelect (hourly | daily | weekly | manual)
│   │   └── TestApiButton
│   ├── CurrencySwitcherConfig
│   │   ├── ShowSwitcherToggle
│   │   └── ShowOriginalPriceToggle
│   └── CurrencyPreview
│       ├── PreviewAmountInput (napr. 1000)
│       └── PreviewResults (zobrazeni ve vsech menach)
└── [tab: Formatovani] FormattingSettings
    ├── DateFormatSelector
    ├── NumberFormatPreview
    └── TimezoneSelector

LanguageSwitcher (widget/header komponenta)
├── CurrentLocaleFlag
├── LocaleDropdown
│   ├── LocaleOption (vlajka + nazev)
│   └── ... (pro kazdy povoleny jazyk)
└── ActiveIndicator

CurrencySwitcher (widget/header komponenta)
├── CurrentCurrencyCode
├── CurrencyDropdown
│   ├── CurrencyOption (kod + symbol)
│   └── ... (pro kazdou povolenou menu)
└── ConvertedPriceHint
```

### B4. Tenant storage namespace

**Helper soubor:** `src/utils/adminLocalizationStorage.js`

```javascript
// adminLocalizationStorage.js
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_LOCALIZATION = 'localization:v1';
const SCHEMA_VERSION = 1;

// --- Core Config ---
export function loadLocalizationConfig() {
  return readTenantJson(NS_LOCALIZATION, getDefaultLocalizationConfig());
}

export function saveLocalizationConfig(config) {
  const data = { ...config, updated_at: new Date().toISOString() };
  writeTenantJson(NS_LOCALIZATION, data);
}

// --- Language ---
export function getActiveLocale() {
  const config = loadLocalizationConfig();
  if (config.language.auto_detect_browser_locale) {
    const browserLocale = navigator.language?.split('-')[0] || 'cs';
    if (config.language.available_locales.includes(browserLocale)) {
      return browserLocale;
    }
  }
  return config.language.default_locale || 'cs';
}

export function getCustomOverrides(locale) {
  const config = loadLocalizationConfig();
  return config.language?.custom_overrides?.[locale] || {};
}

export function saveCustomOverride(locale, key, value) {
  const config = loadLocalizationConfig();
  if (!config.language.custom_overrides) config.language.custom_overrides = {};
  if (!config.language.custom_overrides[locale]) config.language.custom_overrides[locale] = {};
  if (value === null || value === undefined || value === '') {
    delete config.language.custom_overrides[locale][key];
  } else {
    config.language.custom_overrides[locale][key] = value;
  }
  saveLocalizationConfig(config);
}

// --- Currency ---
export function getActiveCurrency() {
  const config = loadLocalizationConfig();
  return config.currency?.primary_currency || 'CZK';
}

export function getExchangeRate(fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return 1;
  const config = loadLocalizationConfig();
  const primary = config.currency?.primary_currency || 'CZK';

  if (fromCurrency === primary) {
    return config.currency?.exchange_rates?.[toCurrency]?.rate || 1;
  }
  if (toCurrency === primary) {
    const rate = config.currency?.exchange_rates?.[fromCurrency]?.rate;
    return rate ? (1 / rate) : 1;
  }
  // Cross-rate pres primary currency
  const fromRate = config.currency?.exchange_rates?.[fromCurrency]?.rate || 1;
  const toRate = config.currency?.exchange_rates?.[toCurrency]?.rate || 1;
  return toRate / fromRate;
}

export function convertPrice(amount, fromCurrency, toCurrency) {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

export function formatPrice(amount, currency, locale) {
  try {
    return new Intl.NumberFormat(localeToIntlLocale(locale), {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function localeToIntlLocale(locale) {
  const map = { cs: 'cs-CZ', en: 'en-US', de: 'de-DE', sk: 'sk-SK', pl: 'pl-PL' };
  return map[locale] || locale;
}

// --- Defaults ---
export function getDefaultLocalizationConfig() {
  return {
    schema_version: SCHEMA_VERSION,
    language: {
      default_locale: 'cs',
      available_locales: ['cs', 'en'],
      show_language_switcher: true,
      switcher_position: 'header',
      auto_detect_browser_locale: true,
      custom_overrides: {},
      custom_locales: {},
    },
    currency: {
      primary_currency: 'CZK',
      available_currencies: ['CZK'],
      show_currency_switcher: false,
      exchange_rates: {},
      auto_update_rates: false,
      rates_api_url: '',
      rates_update_frequency: 'daily',
      display_options: {
        show_original_price: true,
        original_price_format: 'parentheses',
        decimal_places: 2,
      },
    },
    formatting: {
      date_format_override: null,
      number_format_override: null,
      timezone: 'Europe/Prague',
    },
    updated_at: new Date().toISOString(),
  };
}
```

### B5. Widget integrace (postMessage)

**Jazykova a menova konfigurace pro widget:**
```javascript
// Admin -> Widget: Inicializacni konfigurace
{
  type: 'MODELPRICER_CONFIG_INIT',
  payload: {
    localization: {
      default_locale: 'cs',
      available_locales: ['cs', 'en', 'de'],
      show_language_switcher: true,
      default_currency: 'CZK',
      available_currencies: ['CZK', 'EUR', 'USD'],
      show_currency_switcher: true,
      exchange_rates: { EUR: 0.040, USD: 0.0435 },
      custom_overrides: { cs: { 'checkout.submit': 'Odeslat poptavku' } }
    }
  }
}

// Widget -> Parent: Zakaznik zmenil jazyk/menu
{
  type: 'MODELPRICER_LOCALE_CHANGE',
  payload: {
    locale: 'en',
    currency: 'EUR'
  }
}

// Widget -> Admin: Objednavka s informaci o locale zakaznika
{
  type: 'MODELPRICER_ORDER_SUBMIT',
  payload: {
    order: { ... },
    customer_locale: 'en',
    customer_currency: 'EUR',
    displayed_total: { amount: 45.50, currency: 'EUR' },
    original_total: { amount: 1137.50, currency: 'CZK' }
  }
}
```

### B6. Pricing engine integrace

Pricing engine **vraci cisla bez formatovani** — formatovani je zodpovednost
UI vrstvy. S16 pridava formatovaci vrstvu NAD pricing engine:

```javascript
// Pricing engine vraci:
const result = calculatePriceV3(files, pricingConfig, feesConfig);
// result.grandTotal = 1137.50 (cislo v hlavni mene tenanta)

// UI vrstva formatuje:
const displayCurrency = customerSelectedCurrency || primaryCurrency;
const displayAmount = convertPrice(result.grandTotal, primaryCurrency, displayCurrency);
const formattedPrice = formatPrice(displayAmount, displayCurrency, customerLocale);
// formattedPrice = "EUR45.50" nebo "45,50 EUR" (dle locale)
```

**Dulezite pravidlo:**
- Pricing engine VZDY pocita v hlavni mene tenanta (napr. CZK)
- Konverze se dela az v UI vrstve (zobrazovaci ucel)
- Objednavka se uklada v hlavni mene (ucetni konzistence)
- Na fakture/potvrzeni se uvede obe meny (pokud admin nastavi)

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-i18n` | Architektura, sjednoceni i18n systemu | Vsechny i18n soubory | P0 |
| `mp-spec-i18n-translations` | Prekladove soubory cs, en, de, sk, pl | `src/locales/*/translation.json` | P0 |
| `mp-spec-i18n-currency` | Currency formatting, konverze | `src/utils/currencyFormatter.js` | P0 |
| `mp-spec-i18n-dates` | Datum/cas formatovani dle locale | `src/utils/dateFormatter.js` | P1 |
| `mp-mid-storage-tenant` | Localization storage helper | `src/utils/adminLocalizationStorage.js` | P0 |
| `mp-mid-frontend-admin` | Admin stranka Lokalizace | `src/pages/admin/AdminLocalization.jsx` | P1 |
| `mp-mid-frontend-widget` | Widget jazyk/mena prepinac | Widget komponenty | P1 |
| `mp-spec-fe-forms` | Translation override tabulka | Admin komponenty | P1 |
| `mp-spec-fe-routing` | Nova route /admin/localization | `src/Routes.jsx` | P0 |
| `mp-mid-design-system` | LanguageSwitcher, CurrencySwitcher UI | `src/components/ui/` | P1 |
| `mp-sr-frontend` | Review — sjednoceni dvou i18n systemu | — | P0 |
| `mp-mid-quality-code` | Code review + build | — | P1 |

### C2. Implementacni kroky (poradi)

**Faze 1: Sjednoceni i18n systemu (sekvencni — KRITICKE)**
```
Krok 1: [mp-sr-i18n + mp-sr-frontend] Audit existujicich prekladu
        - Zmapovat vsechny hardcoded texty v codebase
        - Zmapovat klice v LanguageContext.jsx vs i18next
        - Rozhodnout: Migrace vsech na i18next (eliminace LanguageContext)
        Vystup: Seznam vsech textovych retezcu k prekladani (~500+)

Krok 2: [mp-sr-i18n] Rozsireni i18n.js konfigurace
        - Pridat lazy loading prekladu (per locale)
        - Pridat namespace support (admin, widget, common)
        - Pridat custom backend pro tenant overrides
        Soubor: src/i18n.js (refaktoring)

Krok 3: [mp-spec-i18n-translations] Kompletni cs preklad
        - Presun vsech klicu z LanguageContext.jsx do src/locales/cs/
        - Pridat chybejici klice (admin, orders, pricing, fees, ...)
        Soubor: src/locales/cs/translation.json (rozsireni na ~500+ klicu)
```

**Faze 2: Prekladove soubory (paralelne)**
```
Krok 4a: [mp-spec-i18n-translations] EN preklady
         Soubor: src/locales/en/translation.json

Krok 4b: [mp-spec-i18n-translations] DE preklady
         Soubor: src/locales/de/translation.json

Krok 4c: [mp-spec-i18n-translations] SK preklady
         Soubor: src/locales/sk/translation.json

Krok 4d: [mp-spec-i18n-translations] PL preklady
         Soubor: src/locales/pl/translation.json
```

**Faze 3: Migrace komponent na i18next (paralelne, velka)**
```
Krok 5: [mp-mid-frontend-admin + vice spec agentu] Nahradit hardcoded texty

         5a: Admin stranky — AdminDashboard, AdminOrders, AdminPricing,
             AdminFees, AdminParameters, AdminPresets, AdminBranding,
             AdminAnalytics, AdminTeamAccess, AdminWidget
             (~10 souboru, ~200 nahrazeni)

         5b: Public stranky — Home, Pricing, Support
             (~3 soubory, ~50 nahrazeni)

         5c: Widget/kalkulacka — model-upload, test-kalkulacka, widget-kalkulacka
             (~6 souboru, ~80 nahrazeni)

         5d: Spolecne komponenty — Header, Footer, UI komponenty
             (~5 souboru, ~30 nahrazeni)

         5e: Eliminace LanguageContext.jsx — nahradit i18next useTranslation()
             Soubor: src/contexts/LanguageContext.jsx (smazat nebo refaktorovat)
```

**Faze 4: Currency system (paralelne s Fazi 3)**
```
Krok 6: [mp-spec-i18n-currency] CurrencyProvider + formatovaci utility
        Soubory: src/contexts/CurrencyContext.jsx, src/utils/currencyFormatter.js

Krok 7: [mp-mid-storage-tenant] adminLocalizationStorage.js
        Soubor: src/utils/adminLocalizationStorage.js

Krok 8: [mp-spec-i18n-currency] Nahrazeni hardcoded "Kc" ve vsech komponentech
        - Vsude kde je formatMoney() nebo `.toFixed(2) + " Kc"`
        - Nahradit za formatPrice() z currencyFormatter
        (~15+ souboru)
```

**Faze 5: Admin UI (po Fazi 3+4)**
```
Krok 9: [mp-spec-fe-routing] Pridat route /admin/localization
        Soubory: src/Routes.jsx, src/pages/admin/AdminLayout.jsx

Krok 10: [mp-mid-frontend-admin] AdminLocalization stranka
         - Tab: Jazyky (vyber, prepinac, overrides)
         - Tab: Meny (hlavni mena, kurzy, prepocet)
         - Tab: Formatovani (datum, cisla, timezone)
         Soubor: src/pages/admin/AdminLocalization.jsx

Krok 11: [mp-spec-fe-forms] Translation override tabulka
         - Editovatelna tabulka s klici a preklady
         - Search/filter, import/export JSON
         Soubor: src/pages/admin/components/TranslationOverrides.jsx
```

**Faze 6: Widget integrace (po Fazi 5)**
```
Krok 12: [mp-mid-frontend-widget] LanguageSwitcher ve widgetu
         - Dropdown v hlavicce widgetu
         - Propagace pres postMessage

Krok 13: [mp-mid-frontend-widget] CurrencySwitcher ve widgetu
         - Prepinac meny vedle prepinace jazyka
         - Zobrazeni cen v zvolene mene
         - Volitelne: puvodni cena v zavorkach

Krok 14: [mp-mid-quality-code] Finalni review + build
```

### C3. Kriticke rozhodovaci body

1. **Sjednotit na i18next nebo zachovat oba systemy?**
   - Rozhodnuti: Sjednotit na i18next (eliminovat LanguageContext preklady)
   - Duvod: i18next ma lazy loading, namespaces, pluralizaci, ICU format
   - LanguageContext zustane POUZE pro `language` state (bez `t()` funkce)

2. **Jak resit lazy loading prekladu?**
   - Rozhodnuti: Pouzit `i18next-http-backend` pro dynamicke nacteni
   - Default jazyk (cs) je bundled staticky (neni latence)
   - Ostatni jazyky se nacitaji az pri prepnuti
   - Bundle size: ~5KB na jazyk (gzip)

3. **Jak resit pluralizaci?**
   - Rozhodnuti: Pouzit i18next pluralization (ICU format)
   - Cesky: `{{count}} model | {{count}} modely | {{count}} modelu`
   - i18next ma built-in podporu pro slozite pluralizacni pravidla (cs, pl, sk)

4. **Exchange rate API — ktery pouzit?**
   - Rozhodnuti: Default `exchangerate-api.com` (free tier: 1500 req/mesic)
   - Admin muze zadat vlastni API URL
   - Fallback: Manualni zadani kurzu (vzdy dostupne)

5. **Jak zobrazit cenu ve dvou menach?**
   - Rozhodnuti: Primarne ve vybrane mene (velke), puvodni v zavorkach (male)
   - Priklad: "EUR45.50 (1 137,50 Kc)"
   - Konfigurovatelne adminem (zobrazit/skryt puvodni cenu)

6. **RTL podpora (arabstina, hebrejstina)?**
   - Rozhodnuti: Pripravit zaklad (dir="rtl"), ale NEimplementovat ted
   - Pridat `dir` atribut dynamicky dle jazyka
   - CSS: pouzivat logical properties (margin-inline-start misto margin-left)
   - Implementace RTL az v budouci vlne (pokud bude poptavka)

### C4. Testovaci strategie

**Unit testy:**
- `adminLocalizationStorage.test.js` — config CRUD, konverze, formatovani
- `currencyFormatter.test.js` — formatovani cen ve vsech menach a locale
- `dateFormatter.test.js` — formatovani dat ve vsech locale
- `convertPrice.test.js` — kurzovy prepocet, cross-rates

```javascript
describe('formatPrice', () => {
  test('CZK in cs locale', () => {
    expect(formatPrice(1234.56, 'CZK', 'cs')).toMatch(/1\s?234,56\s?Kc/);
  });
  test('EUR in de locale', () => {
    expect(formatPrice(1234.56, 'EUR', 'de')).toMatch(/1\.234,56\s?€/);
  });
  test('USD in en locale', () => {
    expect(formatPrice(1234.56, 'USD', 'en')).toMatch(/\$1,234\.56/);
  });
});

describe('convertPrice', () => {
  test('CZK to EUR', () => {
    // rate 0.04 = 1 CZK = 0.04 EUR
    expect(convertPrice(1000, 'CZK', 'EUR')).toBeCloseTo(40, 2);
  });
  test('same currency', () => {
    expect(convertPrice(1000, 'CZK', 'CZK')).toBe(1000);
  });
});
```

**Integracni testy:**
- Zmena jazyka v admin → vsechny texty se zmeni
- Zmena meny ve widgetu → ceny se prepocitaji
- Custom override → specificky text se prepise
- Import JSON → preklady se nacitou

**E2E testy (Playwright):**
```
1. Otevrit /admin/localization
2. Zmenit vychozi jazyk na EN
3. Overit ze admin UI je v anglictine
4. Pridat EUR jako dostupnou menu
5. Zadat kurz EUR = 0.04
6. Otevrit widget
7. Prepnout na EN a EUR
8. Overit ze ceny jsou v EUR a texty v anglictine
```

**Snapshot testy:**
- Screenshot kazde stranky v kazdem jazyce (5 jazyku * ~10 stranek)
- Porovnani formatovani cen ve vsech menach

### C5. Migrace existujicich dat

**Migrace LanguageContext -> i18next:**
1. Exportovat vsechny klice z `LanguageContext.jsx` translations objektu
2. Vlozit do `src/locales/cs/translation.json` a `src/locales/en/translation.json`
3. Nahradit `useLanguage().t(key)` za `useTranslation().t(key)` ve vsech komponentech
4. LanguageContext zachovat jen pro `language` state + `setLanguage`
   (bez `t()` funkce — ta se presune na i18next)

**Migrace hardcoded "Kc":**
```javascript
// PRED (aktualni stav):
function formatMoney(amount) {
  return `${round2(amount).toFixed(2)} Kc`;
}

// PO (po migraci):
import { formatPrice, getActiveCurrency } from '@/utils/currencyFormatter';
function formatMoney(amount) {
  return formatPrice(amount, getActiveCurrency(), getActiveLocale());
}
```

**Zpetna kompatibilita:**
- Default locale = cs, default currency = CZK
- Existujici tenanti neuvidí zadnou zmenu (dokud admin neprepne)
- LanguageContext toggle (cs/en) bude fungovat i behem migrace

---

## D. KVALITA

### D1. Security review body

- **Custom preklady (XSS):** Admin muze zadat libovolny text jako preklad.
  - MUSI se escapovat v React (defaultne ano: `{t('key')}`)
  - Nikdy nepouzivat `dangerouslySetInnerHTML` s prekladovymi klici
  - Pokud preklad obsahuje HTML: pouzit specialni bezpecny renderer
- **Exchange rate API:** URL je konfigurovatelna adminem
  - Validovat ze URL je HTTPS
  - Rate limit na API volani (max 1 za hodinu)
  - Neposilat zadna uzivatelska data na API
- **Import JSON prekladu:** Admin muze uploadovat JSON soubor
  - Validovat JSON strukturu (max hloubka 3, max 2000 klicu)
  - Validovat hodnoty (max delka 500 znaku, zadne HTML tagy)
  - Sanitizovat klice (jen alphanumericke + tecka + podtrzitko)
- **postMessage locale:** Widget prijima locale a currency pres postMessage
  - Validovat ze locale je z povolenych (available_locales)
  - Validovat ze currency je z povolenych (available_currencies)
  - Neakceptovat libovolne locale od rodicovske stranky

### D2. Performance budget

| Operace | Budget | Metrika |
|---------|--------|---------|
| i18next inicializace (default locale) | < 20ms | Init time |
| Nacteni dalsiho jazyka (lazy load) | < 200ms | Network + parse |
| Prepnuti jazyka (vsechny texty) | < 100ms | Re-render time |
| Konverze ceny (1 hodnota) | < 0.1ms | Compute time |
| formatPrice (1 hodnota) | < 0.5ms | Intl.NumberFormat |
| formatPrice (100 hodnot) | < 10ms | Batch formatting |
| Prekladovy soubor velikost (1 jazyk) | < 15KB gzip | Bundle size |
| Vsechny jazyky (lazy loaded) | < 75KB total | Bundle size |
| CurrencyProvider context update | < 5ms | React context |
| TranslationOverrides render (200 klicu) | < 100ms | Virtual table |

### D3. Accessibility pozadavky

- **Language switcher:**
  - `role="listbox"`, `aria-label="Vyber jazyka"`
  - Aktualni jazyk: `aria-selected="true"`
  - Zmena jazyka: `aria-live="polite"` region oznamit "Jazyk zmenen na English"
- **Currency switcher:**
  - `role="listbox"`, `aria-label="Vyber meny"`
  - `aria-live="polite"` pro oznameni zmeny men
- **Translation table:**
  - Editovatelne bunky: `role="textbox"`, `aria-label="Preklad pro {key}"`
  - Keyboard navigace: Tab mezi radky, Enter pro editaci
- **RTL priprava:**
  - `dir="rtl"` na root elementu pro RTL jazyky
  - CSS logical properties (inline-start misto left)
- **`lang` atribut:**
  - Nastavit `<html lang="{locale}">` pri zmene jazyka
  - Screen reader tak oznami spravnou vyslovnost

### D4. Error handling a edge cases

| Edge case | Reseni |
|-----------|--------|
| Chybejici prekladovy klic | Fallback na default locale (cs), pak na klic samotny |
| Chybejici prekladovy soubor (lazy load fail) | Fallback na default locale, toast varovani |
| Neplatny exchange rate (0 nebo zaporne) | Ignorovat, zobrazit v hlavni mene |
| Exchange rate API nedostupne | Pouzit posledni ulozeny kurz, toast varovani |
| Neznama mena | Fallback na hlavni menu tenanta |
| Neznamy locale | Fallback na default_locale |
| Import JSON s neplatnymi klici | Preskocit neplatne, zobrazit report |
| Pluralizace v jazyce bez pravidel | Fallback na anglicka pravidla (singular/plural) |
| Velmi dlouhy preklad (preteceni UI) | CSS text-overflow: ellipsis, tooltip s plnym textem |
| Zmena hlavni meny s existujicimi objednavkami | Stare objednavky zustanou v puvodni mene |
| Browser locale neodpovida zadnemu povolenemuLocale | Fallback na default_locale |
| Soucastna zmena jazyka + meny | Oba contexty se aktualizuji atomicky |

### D5. i18n pozadavky

**Meta-i18n — preklady pro i18n admin stranku:**
```json
{
  "localization": {
    "page_title": "Jazyky a meny",
    "tab_languages": "Jazyky",
    "tab_currencies": "Meny",
    "tab_formatting": "Formatovani",
    "default_locale": "Vychozi jazyk",
    "available_locales": "Dostupne jazyky",
    "show_switcher": "Zobrazit prepinac jazyka",
    "switcher_position": "Pozice prepinace",
    "auto_detect": "Automaticky detekovat jazyk prohlizece",
    "translation_overrides": "Vlastni preklady",
    "override_search": "Hledat prekladovy klic...",
    "override_key": "Klic",
    "override_default": "Vychozi hodnota",
    "override_custom": "Vlastni preklad",
    "override_reset": "Resetovat na vychozi",
    "import_json": "Importovat JSON",
    "export_json": "Exportovat JSON",
    "primary_currency": "Hlavni mena",
    "available_currencies": "Dostupne meny",
    "exchange_rate": "Kurzovy prepocet",
    "rate": "Kurz",
    "source": "Zdroj",
    "manual": "Manualni",
    "automatic": "Automaticky (API)",
    "last_updated": "Posledni aktualizace",
    "refresh_rates": "Aktualizovat kurzy",
    "show_original_price": "Zobrazit puvodni cenu",
    "currency_preview": "Nahled formatovani",
    "date_format": "Format data",
    "timezone": "Casova zona",
    "save_success": "Nastaveni lokalizace ulozeno",
    "import_success": "Importovano {count} prekladu",
    "import_conflicts": "{count} konfliktu — existujici preklady prepsany"
  }
}
```

**Podporovane locale kody a ich speciality:**
| Locale | Intl | Pluralizace | Menovy symbol | Poznamka |
|--------|------|------------|---------------|----------|
| cs | cs-CZ | 1, 2-4, 5+ | Kc (za cislem) | Cestina ma 3 formy pluralu |
| en | en-US | 1, 2+ | $ (pred cislem) | Anglictina ma 2 formy |
| de | de-DE | 1, 2+ | EUR (za cislem) | Nemcina ma 2 formy |
| sk | sk-SK | 1, 2-4, 5+ | EUR (za cislem) | Slovenstina jako cestina |
| pl | pl-PL | 1, 2-4, 5+ | zl (za cislem) | Polstina ma 3 formy |

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flagy:**
- `i18n_unified` — sjednoceny i18next system (default: false → true po migraci)
- `multi_currency_enabled` — podpora vice men (default: false)
- `admin_localization_page` — nova admin stranka (default: false → true po implementaci)
- `widget_locale_switcher` — prepinac jazyka ve widgetu (default: false)

**Postupne nasazeni:**
1. **Alpha (Faze 1-2):** Sjednoceni na i18next, kompletni cs preklad
   - Zadna viditelna zmena pro uzivatele
   - Interni migrace LanguageContext → i18next

2. **Beta (Faze 3-4):** Migrace komponent, currency formatting
   - Admin vidi /admin/localization (skryto za feature flag)
   - Widget stale jen cs/en

3. **RC (Faze 5):** Admin UI kompletni, 5 jazyku
   - Admin muze prepnout jazyk a menu
   - Widget ma prepinac jazyka

4. **GA (Faze 6):** Widget integrace, exchange rates
   - Vsechny features zapnute
   - Currency prepinac ve widgetu

### E2. Admin UI zmeny

**Nova admin stranka:**
- Route: `/admin/localization`
- Soubor: `src/pages/admin/AdminLocalization.jsx`
- Navigace: Admin menu → "Lokalizace" (ikona: Globe)
- 3 taby: Jazyky | Meny | Formatovani

**Zmeny v existujicich admin strankach:**
- `AdminLayout.jsx` — pridat navigacni odkaz na /admin/localization
- `AdminPricing.jsx` — nahradit "Kc" za formatPrice()
- `AdminFees.jsx` — nahradit "Kc" za formatPrice()
- `AdminOrders.jsx` — nahradit formatMoney() za formatPrice()
- Vsechny admin stranky — nahradit useLanguage().t() za useTranslation().t()

### E3. Widget zmeny

**Nove UI elementy:**
- `LanguageSwitcher` — dropdown s vlajkami v hlavicce widgetu
- `CurrencySwitcher` — dropdown s menami vedle jazyka
- Pozice: Hlavicka widgetu (pravo), konfigurovatelne

**Zmeny v kalkualcce:**
- Vsechny textove retezce pres `t()` (i18next)
- Vsechny ceny pres `formatPrice(amount, currency, locale)`
- Volitelne: Zobrazeni puvodni ceny v zavorkach

### E4. Dokumentace pro uzivatele

**In-app tooltips (AdminLocalization):**
- "Vychozi jazyk: Jazyk ve kterem se widget zobrazi pri prvni navsteve"
- "Automaticka detekce: Widget se zobrazi v jazyce prohlizece zakaznika (pokud je dostupny)"
- "Vlastni preklady: Prepsete vychozi texty — napr. zmente 'Odeslat objednavku' na 'Odeslat poptavku'"
- "Hlavni mena: Vsechny ceny v admin panelu se zobrazuji v teto mene"
- "Kurzy: Zadejte kurz rucne nebo nastavte automaticky prepocet z API"

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Pocet tenantu s >1 jazykem | > 30% do 90 dni | Settings tracking |
| Pocet tenantu s >1 menou | > 15% do 90 dni | Settings tracking |
| Pouziti custom overrides | > 25% tenantu | Override count |
| Widget s prepnutym jazykem (zakaznici) | > 10% sessions | Event tracking |
| Widget s prepnutou menou | > 5% sessions | Event tracking |
| Missing translation errors (produkce) | 0 | Error tracking |
| Doba nacteni dalsiho jazyka | < 200ms (p95) | Performance monitoring |
| Conversion rate (pred/po i18n) | +3% | A/B test |
| NPS pro zahranicni zakazniky | +10 bodu | Uzivatelske pruzkumy |

---

## F. REFERENCNI SNIPPETY

### F1. Rozsirena i18n.js konfigurace

```javascript
// src/i18n.js (refaktorovany)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import translationCS from './locales/cs/translation.json';

// Vychozi jazyk je bundled (zadna latence)
const bundledResources = {
  cs: { translation: translationCS },
};

i18n
  .use(HttpBackend) // Lazy loading pro ostatni jazyky
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: bundledResources,
    fallbackLng: 'cs',
    supportedLngs: ['cs', 'en', 'de', 'sk', 'pl'],
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false,
    },

    // Lazy loading konfigurace
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Detekce jazyka
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'modelpricer:locale',
    },

    // Namespaces
    ns: ['translation'],
    defaultNS: 'translation',

    // Reagovat na zmeny
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
    },
  });

// Funkce pro nacteni tenant custom overrides
export function applyTenantOverrides(locale, overrides) {
  if (!overrides || typeof overrides !== 'object') return;
  Object.entries(overrides).forEach(([key, value]) => {
    i18n.addResource(locale, 'translation', key, value);
  });
}

export default i18n;
```

### F2. CurrencyContext

```jsx
// src/contexts/CurrencyContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  getActiveCurrency,
  convertPrice as convertPriceFn,
  formatPrice as formatPriceFn,
  loadLocalizationConfig,
} from '../utils/adminLocalizationStorage';

const CurrencyContext = createContext();

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => getActiveCurrency());
  const config = useMemo(() => loadLocalizationConfig(), []);

  const convert = useCallback((amount, from, to) => {
    return convertPriceFn(amount, from || config.currency.primary_currency, to || currency);
  }, [currency, config]);

  const format = useCallback((amount, curr, locale) => {
    return formatPriceFn(amount, curr || currency, locale);
  }, [currency]);

  const formatConverted = useCallback((amount, locale) => {
    const converted = convert(amount, config.currency.primary_currency, currency);
    return format(converted, currency, locale);
  }, [currency, convert, format, config]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    primaryCurrency: config.currency.primary_currency,
    availableCurrencies: config.currency.available_currencies,
    showSwitcher: config.currency.show_currency_switcher,
    showOriginalPrice: config.currency.display_options?.show_original_price,
    convert,
    format,
    formatConverted,
  }), [currency, config, convert, format, formatConverted]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
```

### F3. Priklad pouziti v komponente

```jsx
// Priklad: PricingCalculator s i18n + currency
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';

function PricingResult({ grandTotal }) {
  const { t } = useTranslation();
  const { formatConverted, showOriginalPrice, primaryCurrency, currency, format } = useCurrency();

  return (
    <div className="pricing-result">
      <span className="label">{t('pricing.total')}</span>
      <span className="price">{formatConverted(grandTotal)}</span>
      {showOriginalPrice && currency !== primaryCurrency && (
        <span className="original-price">
          ({format(grandTotal, primaryCurrency)})
        </span>
      )}
    </div>
  );
}
```

### F4. Struktura prekladoveho souboru (cs)

```json
{
  "common": {
    "save": "Ulozit",
    "cancel": "Zrusit",
    "delete": "Smazat",
    "edit": "Upravit",
    "add": "Pridat",
    "remove": "Odebrat",
    "search": "Hledat...",
    "loading": "Nacitani...",
    "error": "Chyba",
    "success": "Uspech",
    "confirm": "Potvrdit",
    "close": "Zavrit",
    "back": "Zpet",
    "next": "Dalsi",
    "yes": "Ano",
    "no": "Ne",
    "none": "Zadne",
    "all": "Vsechny",
    "total": "Celkem",
    "items_one": "{{count}} polozka",
    "items_few": "{{count}} polozky",
    "items_many": "{{count}} polozek"
  },
  "nav": {
    "home": "Home",
    "demo": "Demo kalkulacky",
    "pricing": "Cenik",
    "support": "Podpora",
    "admin": "Admin",
    "login": "Prihlasit se",
    "register": "Zacit zdarma",
    "account": "Ucet",
    "logout": "Odhlasit se"
  },
  "admin": {
    "dashboard": "Prehled",
    "orders": "Objednavky",
    "pricing": "Cenotvorba",
    "fees": "Poplatky",
    "parameters": "Parametry",
    "presets": "Presety",
    "branding": "Branding",
    "widget": "Widget",
    "analytics": "Analytika",
    "team": "Tym",
    "localization": "Lokalizace",
    "documents": "Dokumenty"
  },
  "upload": {
    "title": "Nahrani 3D modelu",
    "subtitle": "Nahrajte sve 3D modely a nakonfigurujte parametry tisku.",
    "dropzone": "Pretahnete soubory sem nebo kliknete pro vyber",
    "supported_formats": "Podporovane formaty: .stl, .obj, .3mf, .step",
    "file_size_limit": "Maximalni velikost souboru: {{size}}MB",
    "uploading": "Nahravani...",
    "upload_complete": "Nahrani dokonceno",
    "upload_error": "Chyba pri nahravani souboru"
  },
  "configuration": {
    "material": "Material",
    "color": "Barva",
    "layer_quality": "Kvalita vrstvy",
    "infill": "Vypln",
    "supports": "Podpory",
    "quantity": "Pocet kusu"
  },
  "pricing": {
    "total": "Celkem",
    "material_cost": "Material",
    "print_time": "Cas tisku",
    "services": "Sluzby",
    "discount": "Sleva",
    "shipping": "Doprava",
    "calculate": "Spocitat cenu",
    "recalculate": "Prepocitat",
    "vat_included": "vcetne DPH",
    "vat_excluded": "bez DPH",
    "method_used": "Metoda: {{method}}",
    "estimated_price": "Odhadovana cena"
  },
  "checkout": {
    "contact_info": "Kontaktni udaje",
    "name": "Jmeno a prijmeni",
    "email": "E-mail",
    "phone": "Telefon",
    "address": "Adresa",
    "city": "Mesto",
    "zip": "PSC",
    "note": "Poznamka k objednavce",
    "submit": "Odeslat objednavku",
    "gdpr_consent": "Souhlasim se zpracovanim osobnich udaju"
  },
  "orders": {
    "number": "Cislo objednavky",
    "status": "Stav",
    "customer": "Zakaznik",
    "date": "Datum",
    "total": "Celkem",
    "models_one": "{{count}} model",
    "models_few": "{{count}} modely",
    "models_many": "{{count}} modelu",
    "status_NEW": "Nova",
    "status_REVIEW": "Kontrola",
    "status_APPROVED": "Schvaleno",
    "status_PRINTING": "Tiskne se",
    "status_POSTPROCESS": "Postprocess",
    "status_READY": "Pripraveno",
    "status_SHIPPED": "Odeslano",
    "status_DONE": "Hotovo",
    "status_CANCELED": "Zruseno"
  }
}
```
