# Testing -- Dokumentace

> Unit testy pro ModelPricer / Pricer V3. 336 testu pres 7 testovych souboru.
> Vitest s jsdom prostredim, v8 coverage provider.

---

## 1. Prehled

Projekt pouziva **Vitest** jako testovaci framework. Testy pokryvaji klicove subsystemy:

- **Pricing Engine** — kalkulace cen, pipeline kroky, edge cases
- **Storage Helpery** — tenant-scoped localStorage operace, normalizace, migrace
- **Supabase Storage Adapter** — read/write/readList/appendLog, feature flag mody
- **Shopify integrace** — cart client (Storefront API), cart mapper (quote-to-cart)
- **Utility funkce** — generateId, debug logger

**Celkovy pocet testu:** 336

---

## 2. Technologie

| Technologie | Verze | Ucel |
|-------------|-------|------|
| Vitest | (devDependency) | Testovaci framework (Vite-native) |
| jsdom | (Vitest built-in) | DOM emulace pro browser API (localStorage, crypto) |
| v8 | (Vitest coverage provider) | Code coverage |

---

## 3. Konfigurace

### 3.1 vitest.config.mjs

**Cesta:** `Model_Pricer-V2-main/vitest.config.mjs`

```javascript
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/**/__tests__/**',
        'node_modules/**',
      ],
    },
  },
});
```

| Vlastnost | Hodnota | Popis |
|-----------|---------|-------|
| `globals` | `true` | `describe`, `it`, `expect`, `vi` dostupne bez importu |
| `environment` | `jsdom` | Simulovany DOM (localStorage, window, document) |
| `include` | `src/**/*.test.{js,jsx}` | Hledani testovych souboru |
| `coverage.provider` | `v8` | Nativni V8 coverage (rychlejsi nez Istanbul) |
| `coverage.reporter` | `text`, `html`, `lcov` | Konzolovy, HTML a LCOV reporty |
| `resolve.alias.@` | `./src` | Stejna `@/` aliasova resoluce jako v hlavnim Vite configu |

### 3.2 NPM skripty

| Skript | Prikaz | Ucel |
|--------|--------|------|
| `npm test` | `vitest run` | Spusti vsechny testy jednorazove |
| `npm run test:watch` | `vitest` | Watch mode — automaticky re-run pri zmene souboru |
| `npm run test:coverage` | `vitest run --coverage` | Testy + coverage report (text + HTML + LCOV) |

---

## 4. Testove soubory

### 4.1 Prehled

| # | Soubor | Pocet testu | Testovany modul |
|---|--------|-------------|-----------------|
| 1 | `src/lib/pricing/__tests__/pricingEngineV3.test.js` | 86 | Pricing Engine V3 pipeline |
| 2 | `src/utils/__tests__/adminTenantStorage.test.js` | 58 | Centralni tenant storage API |
| 3 | `src/lib/supabase/__tests__/storageAdapter.test.js` | 77 | Supabase storage adapter |
| 4 | `src/lib/shopify/__tests__/shopifyCartClient.test.js` | 58 | Shopify Storefront API klient |
| 5 | `src/lib/shopify/__tests__/shopifyCartMapper.test.js` | 35 | Quote-to-cart mapovani |
| 6 | `src/utils/__tests__/generateId.test.js` | 14 | ID generovani utility |
| 7 | `src/lib/__tests__/debug.test.js` | 8 | Debug logger |
| | **Celkem** | **336** | |

### 4.2 Absolutni cesty

```
Model_Pricer-V2-main/src/lib/pricing/__tests__/pricingEngineV3.test.js
Model_Pricer-V2-main/src/utils/__tests__/adminTenantStorage.test.js
Model_Pricer-V2-main/src/lib/supabase/__tests__/storageAdapter.test.js
Model_Pricer-V2-main/src/lib/shopify/__tests__/shopifyCartClient.test.js
Model_Pricer-V2-main/src/lib/shopify/__tests__/shopifyCartMapper.test.js
Model_Pricer-V2-main/src/utils/__tests__/generateId.test.js
Model_Pricer-V2-main/src/lib/__tests__/debug.test.js
```

---

## 5. Detaily testovych souboru

### 5.1 pricingEngineV3.test.js (86 testu)

**Testovany modul:** `src/lib/pricing/pricingEngineV3.js`

**Pokryte oblasti:**
- Zakladni cenovy vypocet (weight * price_per_gram)
- MODEL fees (flat, per_gram, per_minute, percent, per_cm3, per_cm2, per_piece)
- Markup (percent, fixed, mixed)
- Volume discounts (per_model, per_order, prahovani)
- Minimum price enforcement (per model, per order)
- Rounding (ceil, floor, round, smart rounding)
- ORDER fees (per-objednavka poplatky)
- Edge cases (nulova vaha, nulovy cas, prazdna konfigurace)
- Breakdown pole (spravne kroky a poradi)

**Mock strategie:** Zadne externi mocky — pricing engine je cista funkce bez side effects.

### 5.2 adminTenantStorage.test.js (58 testu)

**Testovany modul:** `src/utils/adminTenantStorage.js`

**Pokryte oblasti:**
- `getTenantId()` — cteni z localStorage, fallback na 'demo-tenant'
- `readTenantJson()` — cteni, JSON parse, fallback pri chybe
- `writeTenantJson()` — zapis, normalizace klice
- `appendTenantLog()` — pridani zaznamu, maxItems oriznutni
- Async API (`readTenantJsonAsync`, `writeTenantJsonAsync`)
- Supabase dual-write chovani (fire-and-forget)
- Edge cases (prazdny storage, nevalidni JSON, chybejici tenant ID)

**Mock strategie:** `localStorage` je mockovan pres jsdom. Supabase moduly jsou mockovany pres `vi.mock()`.

### 5.3 storageAdapter.test.js (77 testu)

**Testovany modul:** `src/lib/supabase/storageAdapter.js`

**Pokryte oblasti:**
- `read()` — cteni z Supabase dle namespace/tenantId
- `write()` — zapis (upsert) do Supabase
- `readList()` — nacteni vsech zaznamu pro tenant
- `appendLog()` — append do log tabulek (audit, analytics)
- NAMESPACE_TABLE_MAP resoluce
- Feature flag mody (localStorage, supabase, dual-write)
- Chybove stavy (Supabase nedostupne, network error)
- Fallback chovani

**Mock strategie:** Supabase klient (`@supabase/supabase-js`) je mockovan. `featureFlags` modul je mockovan pro simulaci ruznych modu.

### 5.4 shopifyCartClient.test.js (58 testu)

**Testovany modul:** `src/lib/shopify/shopifyCartClient.js`

**Pokryte oblasti:**
- `createCart()` — Storefront API GraphQL cartCreate
- Cart Permalink generovani (URL redirect, zero API calls)
- Autentikace (Storefront Access Token header)
- Chybove stavy (network error, GraphQL errors, nevalidni odpoved)
- Input validace (chybejici shop_domain, chybejici token)

**Mock strategie:** `fetch` je globalne mockovan pres `vi.fn()`. Zadna sitova komunikace.

### 5.5 shopifyCartMapper.test.js (35 testu)

**Testovany modul:** `src/lib/shopify/shopifyCartMapper.js`

**Pokryte oblasti:**
- Quote-to-cart transformace (modelova data → Shopify line items)
- Mapping modes: `per_variant` vs `universal`
- Fee handling: `included_in_price`, `line_property`, `separate_variant`
- Properties mapping (rozmery, material, kvalita)
- Edge cases (prazdny quote, chybejici variant ID)

**Mock strategie:** Zadne externi mocky — mapper je cista funkce.

### 5.6 generateId.test.js (14 testu)

**Testovany modul:** `src/utils/generateId.js`

**Pokryte oblasti:**
- Generovani UUID kdyz je `crypto.randomUUID` dostupne
- Fallback na `Date.now + Math.random` kdyz `crypto` neni dostupne
- Prefix pridavani (`generateId('order')` → `order_xxx`)
- Unikatnost generovanych ID

**Mock strategie:** `crypto.randomUUID` je mockovan/odmockovan pro testovani fallbacku.

### 5.7 debug.test.js (8 testu)

**Testovany modul:** `src/lib/debug.js`

**Pokryte oblasti:**
- Logovani v DEV modu (`import.meta.env.DEV === true`)
- Ticho v produkcnim modu (`import.meta.env.DEV === false`)
- Predavani argumentu do `console.log`

**Mock strategie:** `console.log` je mockovan. `import.meta.env.DEV` je mockovan pres Vitest env.

---

## 6. Mock strategie — souhrn

| Typ mocku | Pouziti | Priklad |
|-----------|---------|---------|
| `vi.mock()` | Cely modul | Supabase klient, featureFlags |
| `vi.fn()` | Jednotliva funkce | `fetch`, `console.log` |
| `vi.spyOn()` | Sledovani volani | `localStorage.getItem` |
| jsdom built-in | DOM API | `localStorage`, `window`, `document` |
| Zadny mock (cista funkce) | Pure funkce bez side effects | pricingEngineV3, shopifyCartMapper |

---

## 7. Spousteni testu

### 7.1 Vsechny testy

```bash
cd Model_Pricer-V2-main
npm test
```

### 7.2 Watch mode (pro vyvoj)

```bash
npm run test:watch
```

### 7.3 Coverage report

```bash
npm run test:coverage
```

Vytvori:
- **Konzolovy vystup** — tabulka s pokrytim per soubor
- **HTML report** — `coverage/index.html` (otevritelny v prohlizeci)
- **LCOV** — `coverage/lcov.info` (pro CI/CD integrace)

### 7.4 Konkretni testovy soubor

```bash
npx vitest run src/lib/pricing/__tests__/pricingEngineV3.test.js
```

---

## 8. Adresarova struktura testu

```
Model_Pricer-V2-main/
  vitest.config.mjs                                    — Vitest konfigurace
  src/
    lib/
      __tests__/
        debug.test.js                                  — debug logger (8 testu)
      pricing/
        __tests__/
          pricingEngineV3.test.js                      — pricing engine (86 testu)
      shopify/
        __tests__/
          shopifyCartClient.test.js                    — Shopify cart client (58 testu)
          shopifyCartMapper.test.js                    — Shopify cart mapper (35 testu)
      supabase/
        __tests__/
          storageAdapter.test.js                       — storage adapter (77 testu)
    utils/
      __tests__/
        adminTenantStorage.test.js                     — tenant storage (58 testu)
        generateId.test.js                             — ID generator (14 testu)
```

**Konvence:** Testy jsou umisteny v `__tests__/` podslozce vedlejsi testovanemu modulu.

---

## 9. Zname omezeni

### 9.1 Zadne integracni testy

Vsechny testy jsou unit testy. Neexistuji integracni testy ktere by testovaly interakci mezi subsystemy (napr. pricing engine + storage + UI).

### 9.2 Zadne E2E testy

Projekt nema Playwright/Cypress E2E testy. Testovani v prohlizeci je manualni (viz 4 kontrolni kroky v `docs/claude/Pravidla/4kroky.md`).

### 9.3 Frontend komponenty nejsou testovany

React komponenty (stranky, admin panel, kalkulacky) nemaji unit testy. Pouze "cista logika" moduly jsou pokryty.

### 9.4 Backend neni testovan

`backend-local/` (Express server, slicer integrace) nema zadne testy.

---

## 10. Changelog

| Datum | Zmena |
|-------|-------|
| 2026-03-10 | Prvni verze dokumentace. 336 testu ve 7 souborech. |

---

> **Vlastnik:** `mp-sr-quality` / `mp-spec-test-unit`
> **Posledni aktualizace:** 2026-03-10
