# V3-S00b: Prurezove strategie a cross-cutting concerns

> **Generovano:** 2026-02-06
> **Aktualizovano:** 2026-02-06
> **Typ dokumentu:** Prurezovy strategicky plan (pokryva vsech 7 implementacnich fazi)
> **Souvisejici:** `V3-S00-index-a-zavislosti.md` (master index), `CLAUDE.md` (sekce 2 — invarianty)
> **Ucel:** Definovat strategie pro problemy ktere se netykaji jedne konkretni sekce,
>   ale prochazi napric vsemi fazemi. Kazda strategie ma konkretni doporuceni,
>   implementacni kroky, a per-faze checklisty.

---

## Obsah

1. [localStorage limit a budouci migrace](#1-localstorage-limit-a-budouci-migrace)
2. [Widget backward compatibility a verzovani](#2-widget-backward-compatibility-a-verzovani)
3. [Feature flag system](#3-feature-flag-system)
4. [Error monitoring](#4-error-monitoring)
5. [Bundle size budget per faze](#5-bundle-size-budget-per-faze)
6. [Pricing engine debugger / breakdown display](#6-pricing-engine-debugger--breakdown-display)
7. [Automated testing milestones per faze](#7-automated-testing-milestones-per-faze)
8. [Git branching strategie](#8-git-branching-strategie)
9. [Admin UI navigace — evoluce pres faze](#9-admin-ui-navigace--evoluce-pres-faze)
10. [Bezpecnostni checklist per faze](#10-bezpecnostni-checklist-per-faze)

---

## 1. localStorage limit a budouci migrace

### 1.1 Popis problemu

localStorage ma limit **5 MB** na vetsine prohlizecu (Chrome, Firefox, Edge). Nekteri mobilni
prohlizece maji limit jeste nizsi (2.5 MB na starsich iOS Safari). Cely ModelPricer uklada
data pres `adminTenantStorage.js` do localStorage s prefixem `modelpricer:{tenantId}:{namespace}`.

Aktualni stav:
- **9 existujicich namespaces:** `pricing:v3`, `fees:v3`, `branding`, `widget`, `orders`,
  `analytics`, `team`, `audit`, `dashboard`
- **18 planovanych novych namespaces** (viz S00 sekce 6)
- **Celkem po F7:** 27 namespaces — REALNE riziko prelezeni limitu

### 1.2 Kategorizace namespaces podle rustu dat

#### Staticke namespaces (velikost se nemeni s poctem objednavek)

| Namespace | Typicka velikost | Faze | Poznamka |
|-----------|-----------------|------|----------|
| `pricing:v3` | 2-8 KB | F1 | Materialy, kvality, presety |
| `fees:v3` | 1-5 KB | F1 | Priplatky, kategorie |
| `branding` | 1-3 KB | — | Logo URL, barvy, fonty |
| `widget` | 1-2 KB | — | Widget konfigurace |
| `dashboard` | 0.5-1 KB | — | Dashboard layout |
| `team` | 0.5-2 KB | — | Role, opravneni |
| `shipping:v1` | 1-3 KB | F2 | Dopravni metody |
| `postprocessing:v1` | 1-3 KB | F2 | Post-processing sluzby |
| `express:v1` | 0.5-2 KB | F2 | Express urovne |
| `kanban:v1` | 0.5-1 KB | F3 | Sloupce, stavy |
| `email:v1` | 5-15 KB | F3 | Sablony emailu (10 sablon, HTML) |
| `coupons:v1` | 2-10 KB | F3 | Kupony (definice, pravidla) |
| `pricing-methods:v1` | 1-3 KB | F4 | Konfigurace metod |
| `documents:v1` | 3-10 KB | F5 | PDF sablony |
| `localization:v1` | 10-50 KB | F6 | Preklady (5 jazyku, ~360 klicu) |
| `tax:v1` | 1-3 KB | F6 | Danove sazby |
| `technologies:v1` | 3-10 KB | F7 | Tiskove technologie konfig |
| `onboarding:v1` | 0.5-1 KB | F7 | Stav onboardingu |
| `feature-flags:v1` | 0.5-1 KB | F1+ | Feature flagy (viz sekce 3) |

**Odhad pro staticke namespaces: 35-135 KB** — bezpecne.

#### Rostouci namespaces (velikost roste s poctem zaznamu)

| Namespace | Rust | Odhad per zaznam | Riziko | Faze |
|-----------|------|-------------------|--------|------|
| `orders` | **Linearni** s poctem objednavek | ~2-5 KB/obj | **VYSOKE** po 500+ obj | F1 |
| `audit` | **Linearni** s kazdou akci | ~0.3-1 KB/zaznam | **VELMI VYSOKE** | — |
| `analytics` | **Linearni** s daty | ~0.5-2 KB/den | **STREDNI** | — |
| `email:v1` (log cast) | **Linearni** s odeslanymi emaily | ~0.5-1 KB/email | **VYSOKE** po 1000+ | F3 |
| `chat:v1` | **Linearni** se zpravami | ~0.3-0.5 KB/zprava | **VYSOKE** | F5 |
| `customers:v1` | **Linearni** se zakazniky | ~1-2 KB/zakaznik | **STREDNI** | F5 |
| `marketing:v1` | **Linearni** s kampanemi | ~1-3 KB/kampan | **NIZKE** | F6 |
| `api-keys:v1` | **Pomale** (malo klicu) | ~0.5 KB/klic | **NIZKE** | F6 |
| `ecommerce:v1` | **Pomale** (malo integraci) | ~1 KB/integrace | **NIZKE** | F7 |

**Kriticke odhady:**
- 500 objednavek * 3 KB = **1.5 MB** (orders)
- 5000 audit zaznamu * 0.5 KB = **2.5 MB** (audit)
- 2000 emailu * 0.7 KB = **1.4 MB** (email log)
- 1000 chat zprav * 0.4 KB = **0.4 MB** (chat)

**CELKEM po roce provozu: potencialne 5+ MB = PRELEZI LIMIT**

### 1.3 Monitoring velikosti

#### Helper funkce pro mereni

```javascript
// Pridat do adminTenantStorage.js

/**
 * Zmeri velikost vsech localStorage dat pro daneho tenanta.
 * @returns {{ totalBytes: number, namespaces: Record<string, number>, percentUsed: number }}
 */
export function measureStorageUsage() {
  const tenantId = getTenantId();
  const prefix = `modelpricer:${tenantId}:`;
  const namespaces = {};
  let totalBytes = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      const ns = key.replace(prefix, '');
      const value = localStorage.getItem(key) || '';
      const bytes = new Blob([key + value]).size;
      namespaces[ns] = bytes;
      totalBytes += bytes;
    }
  }

  // Odhad celkoveho localStorage (5 MB = 5242880 bytes)
  const allStorageBytes = new Blob(
    Object.keys(localStorage).map(k => k + localStorage.getItem(k))
  ).size;

  return {
    totalBytes,
    allStorageBytes,
    namespaces,
    percentUsed: Math.round((allStorageBytes / 5242880) * 100),
  };
}
```

#### Admin dashboard widget (Faze 1+)

V admin dashboardu zobrazit jednoduchy ukazatel:
- **Zelena (< 50%):** OK
- **Oranzova (50-80%):** Varovani, doporucit procisneni
- **Cervena (> 80%):** Kriticke, nabidnout export + smazani starych dat

### 1.4 Strategie procisneni (per namespace)

| Namespace | Strategie | Implementovat v |
|-----------|-----------|-----------------|
| `orders` | Archivace — objednavky starsi 6 mesicu exportovat do JSON, smazat z localStorage | F3 (Kanban) |
| `audit` | Rotace — udrzovat max 1000 zaznamu, starsi mazat | F1 (ihned) |
| `email:v1` (log) | Rotace — max 500 zaznamu logu, starsi mazat | F3 (S07) |
| `chat:v1` | Paginace — ukladat jen poslednich 100 zprav per objednavka, zbytek lazy-load | F5 (S11) |
| `analytics` | Agregace — po mesici agregovat denny data do mesicnich sumarizaci | F6 (S19) |
| `customers:v1` | Limit — max 500 zakazniku v localStorage, zbytek pres API | F5 (S12) |

### 1.5 Budouci migrace na IndexedDB

Pokud localStorage limit zacne byt realny problem (> 60% pouzito), migrace na IndexedDB:

**Priorita migrace (co presouvat prvni):**
1. `orders` — nejvetsi, nejvice roste
2. `audit` — druhy nejvetsi
3. `email:v1` (log cast) — treti
4. `chat:v1` — ctvrty

**Migracni vzor:**
```javascript
// Krok 1: Pridej wrapper ktery cte z obou
async function readNamespace(ns) {
  // Nejdriv zkus IndexedDB
  const idbData = await readFromIndexedDB(ns);
  if (idbData) return idbData;
  // Fallback na localStorage
  return readTenantJson(ns);
}

// Krok 2: Zapis novy data jen do IndexedDB
// Krok 3: Jednorazova migrace existujicich localStorage dat do IndexedDB
// Krok 4: Smazani localStorage kopie
```

**Casovy odhad migrace:** F5-F6 (kdyz se zacne pracovat se zakazniky a chat)

### 1.6 Per-faze checklist

| Faze | Akce |
|------|------|
| F1 | Implementovat `measureStorageUsage()`, pridat audit log rotaci (max 1000) |
| F2 | Monitorovat po pridani 3 novych namespaces |
| F3 | Implementovat rotaci email logu (500), archivaci starych objednavek (6 mesicu) |
| F4 | Bez novych rostoucich namespaces — jen monitoring |
| F5 | **KRITICKA FAZE** — customers + chat mohou vybuchnout. Implementovat IndexedDB wrapper pokud usage > 50% |
| F6 | Localization muze byt velky (50 KB prekladu) — zvazit external JSON misto localStorage |
| F7 | Finalni audit vsech namespaces, cisticka starych dat, nastaveni retention policies |

---

## 2. Widget backward compatibility a verzovani

### 2.1 Popis problemu

ModelPricer widget je **embedovany v externim webu zakaznika** pres `<iframe>` + `postMessage`.
Soubor `public/widget.js` injektuje iframe a komunikuje s nim. Kdyz aktualizujeme widget
na serveru, vsechny existujici embedovane instance se aktualizuji AUTOMATICKY (protoze iframe
nacita z naseho serveru).

Ale **postMessage protokol** je kontrakt:
- Hostitelsky web posila zpravy widgetu (napr. init, zmena jazyka)
- Widget posila zpravy hostiteli (napr. cena se zmenila, objednavka odeslana)

Pokud zmenime format zprav, stary hostitelsky web to nerozeznava = **BREAK**.

### 2.2 Verzovaci schema

```
postMessage format:
{
  version: "3.{faze}.{minor}",
  type: "{message_type}",
  payload: { ... },
  timestamp: Date.now()
}
```

Priklady verzi:
- `3.1.0` — Faze 1 zaklad (checkout, pricing)
- `3.2.0` — Faze 2 (post-processing, express, doprava)
- `3.2.1` — Faze 2 minor oprava
- `3.3.0` — Faze 3 (kupony v checkoutu)
- ...az `3.7.0` — Faze 7

### 2.3 Pravidla backward compatibility

#### Zlata pravidla

1. **Widget MUSI ignorovat nezname zpravy** — `if (!KNOWN_TYPES.includes(msg.type)) return;`
2. **Nikdy neodstranuj existujici pole z payload** — jen pridavej nova
3. **Nikdy nemen semantiku existujiciho `type`** — pokud chces jiny behavior, pridej novy type
4. **Vsechny nove polozky v payload MUSI byt optional** — stary kod nesmr crashnout protoze tam neni nove pole
5. **Deprecated typy oznamuj min 1 fazi predem** — log `console.warn()` pred odstranenim

#### Graceful degradation pattern

```javascript
// widget.js — handler pro prichozi zpravy
window.addEventListener('message', (event) => {
  const { version, type, payload } = event.data || {};

  // Ignoruj zpravy bez verze nebo neznameho typu
  if (!version || !type) return;
  if (!SUPPORTED_MESSAGE_TYPES.includes(type)) {
    console.debug(`[ModelPricer Widget] Ignoring unknown message type: ${type}`);
    return;
  }

  // Backward compat: pokud chybi nova pole, pouzij defaults
  const safePayload = {
    currency: 'CZK',           // default od F1
    language: 'cs',            // default od F1
    expressLevel: 'standard',  // pridano v F2, default pro F1 klienty
    couponCode: null,          // pridano v F3, default pro stare verze
    ...payload,
  };

  handleMessage(type, safePayload, version);
});
```

### 2.4 Katalog postMessage typu per faze

#### Faze 1 — Zakladni komunikace

| Smer | Type | Payload | Popis |
|------|------|---------|-------|
| Host -> Widget | `init` | `{ tenantId, config?, language?, currency? }` | Inicializace widgetu |
| Host -> Widget | `set-config` | `{ materials?, qualities?, presets? }` | Prepsat konfiguraci |
| Widget -> Host | `ready` | `{ version }` | Widget je nacteny |
| Widget -> Host | `price-updated` | `{ totalPrice, currency, breakdown }` | Cena se zmenila |
| Widget -> Host | `order-submitted` | `{ orderId, customer, items, total }` | Objednavka odeslana |
| Widget -> Host | `error` | `{ code, message }` | Chyba |
| Widget -> Host | `resize` | `{ height }` | Widget chce zmenit vysku iframe |

#### Faze 2 — Rozsireny pricing

| Smer | Type | Payload (nova pole) | Popis |
|------|------|---------------------|-------|
| Widget -> Host | `price-updated` | `+ postProcessing, expressLevel, shippingCost` | Rozsireny breakdown |
| Host -> Widget | `set-express` | `{ level: 'standard'|'express'|'rush' }` | Vnutit express uroven |
| Widget -> Host | `shipping-selected` | `{ method, cost, estimatedDays }` | Vyber dopravy |

#### Faze 3 — Marketing

| Smer | Type | Payload (nova pole) | Popis |
|------|------|---------------------|-------|
| Host -> Widget | `apply-coupon` | `{ code }` | Aplikovat kupon externem |
| Widget -> Host | `coupon-applied` | `{ code, discount, valid }` | Vysledek aplikace kuponu |
| Widget -> Host | `price-updated` | `+ couponDiscount` | Sleva v breakdown |

#### Faze 5 — Zakaznicke funkce

| Smer | Type | Payload | Popis |
|------|------|---------|-------|
| Widget -> Host | `auth-required` | `{ reason }` | Widget potrebuje prihlaseni |
| Widget -> Host | `user-authenticated` | `{ userId, email }` | Uzivatel se prihlasil |
| Host -> Widget | `set-user` | `{ token }` | Predani auth tokenu |

#### Faze 6 — Platforma

| Smer | Type | Payload | Popis |
|------|------|---------|-------|
| Host -> Widget | `set-language` | `{ language, currency }` | Zmena jazyka za behu |
| Widget -> Host | `language-changed` | `{ language, currency }` | Potvrzeni zmeny |

#### Faze 7 — Enterprise

| Smer | Type | Payload | Popis |
|------|------|---------|-------|
| Host -> Widget | `set-technology` | `{ technology }` | Prepnout technologii tisku |
| Widget -> Host | `technology-changed` | `{ technology, availableMaterials }` | Technologie zmenena |

### 2.5 Changelog a breaking changes

Pravidlo: **Nikdy nedavej breaking change bez major verze a 1 faze varovani.**

Pokud je breaking change nevyhnutelny:
1. V aktualni fazi: pridej novy type (napr. `price-updated-v2`), stary oznam deprecated
2. V nasledujici fazi: stary type loguje `console.warn` ale stale funguje
3. V dalsi fazi: stary type odstranit

### 2.6 Testovani backward compat

Po kazde fazi: spustit test suite ktery:
1. Posle zpravy ve formatu predchozi faze → widget MUSI odpovedet
2. Posle zpravy s neznamym typem → widget NESMI crashnout
3. Posle zpravy bez verze → widget NESMI crashnout
4. Posle zpravy s chybejicimi novymi poli → widget pouzije defaults

---

## 3. Feature flag system

### 3.1 Popis a zduvodneni

ModelPricer je prilis maly pro externi feature flag sluzby (LaunchDarkly, Flagsmith).
Potrebujeme vlastni jednoduchy system ktery:
- Umozni admin zapnout/vypnout features
- Propaguje flagy do widgetu
- Je tenant-scoped
- Nema runtime zavislosti

### 3.2 Storage schema

**Namespace:** `feature-flags:v1`
**Storage helper:** rozsireni `adminTenantStorage.js` (ne novy soubor)

```javascript
// Datovy model v localStorage
{
  "flags": {
    "volume-discounts": { "enabled": true, "since": "2026-02-10" },
    "post-processing": { "enabled": false, "since": null },
    "express-pricing": { "enabled": false, "since": null },
    "coupon-system": { "enabled": false, "since": null },
    "email-notifications": { "enabled": false, "since": null },
    "kanban-board": { "enabled": false, "since": null },
    "customer-portal": { "enabled": false, "since": null },
    "chat-system": { "enabled": false, "since": null },
    "pdf-documents": { "enabled": false, "since": null },
    "multi-language": { "enabled": false, "since": null },
    "public-api": { "enabled": false, "since": null }
  },
  "updatedAt": "2026-02-10T12:00:00.000Z"
}
```

### 3.3 Helper funkce

```javascript
// featureFlags.js — novy soubor v src/utils/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NAMESPACE = 'feature-flags:v1';

const DEFAULT_FLAGS = {
  'volume-discounts': false,
  'post-processing': false,
  'express-pricing': false,
  'coupon-system': false,
  'email-notifications': false,
  'kanban-board': false,
  'customer-portal': false,
  'chat-system': false,
  'pdf-documents': false,
  'multi-language': false,
  'public-api': false,
  'printability-check': false,
  'multi-format': false,
  'extended-pricing': false,
  'crm-analytics': false,
  'tax-system': false,
  'multi-technology': false,
  'ecommerce-plugins': false,
  'onboarding-wizard': false,
};

/**
 * Zjisti zda je feature povolena.
 * Pokud flag neexistuje, vrati false (bezpecny default).
 */
export function isFeatureEnabled(flagName) {
  const config = readTenantJson(NAMESPACE) || { flags: {} };
  const flag = config.flags?.[flagName];
  return flag?.enabled === true;
}

/**
 * Nastavi feature flag.
 */
export function setFeatureFlag(flagName, enabled) {
  const config = readTenantJson(NAMESPACE) || { flags: {} };
  config.flags = config.flags || {};
  config.flags[flagName] = {
    enabled: Boolean(enabled),
    since: enabled ? new Date().toISOString() : null,
  };
  config.updatedAt = new Date().toISOString();
  writeTenantJson(NAMESPACE, config);
}

/**
 * Vrati vsechny flagy (pro admin UI).
 */
export function getAllFeatureFlags() {
  const config = readTenantJson(NAMESPACE) || { flags: {} };
  // Merge s defaults — aby nove flagy mely default false
  const merged = { ...DEFAULT_FLAGS };
  for (const [key, val] of Object.entries(config.flags || {})) {
    merged[key] = val?.enabled === true;
  }
  return merged;
}

/**
 * Vrati flagy pro widget (jen enabled flagy jako pole stringu).
 * Pouzivane pro postMessage init.
 */
export function getEnabledFlagsForWidget() {
  const all = getAllFeatureFlags();
  return Object.entries(all)
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
}
```

### 3.4 Pouziti v kodu

#### V React komponentach

```jsx
import { isFeatureEnabled } from '../utils/featureFlags';

function CheckoutPage() {
  const hasCoupons = isFeatureEnabled('coupon-system');

  return (
    <div>
      {/* ... */}
      {hasCoupons && <CouponInput />}
    </div>
  );
}
```

#### V pricing engine

```javascript
// pricingEngineV3.js — v calculateOrderQuote()
import { isFeatureEnabled } from '../../utils/featureFlags';

// V pipeline:
if (isFeatureEnabled('volume-discounts') && quantity > 1) {
  // aplikuj mnozstevni slevu
}
if (isFeatureEnabled('post-processing') && postProcessingSelections.length > 0) {
  // aplikuj post-processing fee
}
```

#### Widget propagace

```javascript
// Pri inicializaci widgetu (postMessage)
{
  version: "3.1.0",
  type: "init-response",
  payload: {
    tenantId: "...",
    config: { ... },
    enabledFeatures: getEnabledFlagsForWidget(),
    // Widget pouziva enabledFeatures pro zobrazeni/skryti sekci
  }
}
```

### 3.5 Admin UI

Jednoduchy toggle list v **Admin > Nastaveni > Feature Flags**:
- Seznam vsech flagu s toggle switchem
- Kazdy flag ma popis co dela
- Varování u flagu ktere maji zavislosti (napr. "coupon-system vyzaduje zapnuty checkout")
- Neimplementovane flagy (z budoucich fazi) jsou zobrazeny jako "Coming soon" a disabled

### 3.6 Per-faze seznam novych feature flagu

| Faze | Nove flagy | Automaticky zapnute? |
|------|-----------|---------------------|
| F1 | `volume-discounts` | Ano (po implementaci S05) |
| F2 | `post-processing`, `express-pricing` | Ne (admin musi zapnout) |
| F3 | `coupon-system`, `email-notifications`, `kanban-board` | `email-notifications` ano, zbytek ne |
| F4 | `multi-format`, `printability-check`, `extended-pricing` | `multi-format` ano, zbytek ne |
| F5 | `pdf-documents`, `customer-portal`, `chat-system` | `pdf-documents` ano, zbytek ne |
| F6 | `multi-language`, `public-api`, `crm-analytics`, `tax-system` | Vsechno ne |
| F7 | `multi-technology`, `ecommerce-plugins`, `onboarding-wizard` | `onboarding-wizard` ano |

### 3.7 Implementacni plan

- **F1:** Vytvorit `featureFlags.js`, pridat do admin nastaveni (zakladni toggle list)
- **F2:** Pripojit flagy do pricing engine pipeline
- **F3:** Propagace flagu do widgetu pres postMessage init
- **F4+:** Dalsí flagy jen pridavat do `DEFAULT_FLAGS` a vyuzivat v kodu

---

## 4. Error monitoring

### 4.1 Popis problemu

Aktualne v ModelPriceru neexistuje zadny centralizovany error monitoring. Pokud na produkci
dojde k chybe, admin se to dozvi az kdyz si zakaznik stezuje. To je neakceptovatelne
uz od Faze 2 (kdyz zacnou chodit realne objednavky).

### 4.2 Frontend error handling

#### Global error handler (implementovat v F1)

```javascript
// src/utils/errorMonitor.js

const ERROR_LOG_KEY = 'modelpricer:error-log';
const MAX_ERRORS = 100; // rotace

/**
 * Zaznamena chybu do localStorage a (budouci) external service.
 */
function logError(error, context = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    message: error.message || String(error),
    stack: error.stack?.substring(0, 500),
    url: window.location.href,
    userAgent: navigator.userAgent,
    context,
  };

  // localStorage log (rotace)
  try {
    const log = JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || '[]');
    log.push(entry);
    if (log.length > MAX_ERRORS) log.splice(0, log.length - MAX_ERRORS);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(log));
  } catch (e) {
    // localStorage plny nebo nedostupny — tichy fail
  }

  // Console pro development
  console.error('[ModelPricer Error]', entry);

  // Budouci: odeslat na Sentry / vlastni endpoint
  // sendToErrorService(entry);
}

/**
 * Inicializace globalnich error handleru.
 * Volat jednou v main.jsx / App.jsx.
 */
export function initErrorMonitoring() {
  // Nezachycene JS chyby
  window.onerror = (message, source, lineno, colno, error) => {
    logError(error || new Error(message), {
      source,
      lineno,
      colno,
      type: 'uncaught',
    });
  };

  // Nezachycene Promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason || new Error('Unhandled rejection'), {
      type: 'unhandled-rejection',
    });
  });
}

export { logError };
```

#### React Error Boundary (implementovat v F1)

```jsx
// src/components/ErrorBoundary.jsx

import React from 'react';
import { logError } from '../utils/errorMonitor';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, {
      type: 'react-boundary',
      componentStack: errorInfo.componentStack?.substring(0, 500),
      boundary: this.props.name || 'unnamed',
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <h3>Neco se pokazilo</h3>
          <p>Zkuste obnovit stranku. Pokud problem pretrva, kontaktujte podporu.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Zkusit znovu
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

#### Kde umistit Error Boundaries

```
<ErrorBoundary name="app-root">        // Cela aplikace
  <ErrorBoundary name="admin-panel">   // Admin panel
    <AdminLayout />
  </ErrorBoundary>
  <ErrorBoundary name="calculator">    // Kalkulacka
    <TestKalkulacka />
  </ErrorBoundary>
  <ErrorBoundary name="widget">        // Widget
    <WidgetEmbed />
  </ErrorBoundary>
</ErrorBoundary>
```

### 4.3 Backend error handling

Express error middleware (pro budouci backend v F3+):

```javascript
// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  // Log
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    status: statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Budouci: Sentry
  // Sentry.captureException(err);

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message,
      code: err.code || 'UNKNOWN',
    },
  });
}
```

### 4.4 Doporuceni pro externi sluzby

| Sluzba | Cena | Limit free tier | Doporuceni |
|--------|------|-----------------|------------|
| **Sentry** | Free tier | 5000 events/mesic | **DOPORUCENO od F3** |
| LogRocket | Free tier | 1000 sessions/mesic | Nice-to-have od F5 |
| Vlastni logger | Zdarma | Neomezene | Zakladni reseni od F1 |

**Plan:**
- **F1-F2:** Vlastni `errorMonitor.js` (localStorage + console)
- **F3:** Integrace Sentry free tier (pred prvnimi realnymi objednavkami)
- **F5:** Zvazit LogRocket pro session replay (debugging UX problemu)

### 4.5 Admin error dashboard

Od Faze 3 zobrazit v admin dashboardu:
- Pocet chyb za poslednich 24 hodin
- Top 5 nejcastejsich chyb
- Trend (rust/pokles oproti minulemu tydnu)
- Odkaz na Sentry (pokud integrovan)

### 4.6 Per-faze checklist

| Faze | Akce |
|------|------|
| F1 | Implementovat `errorMonitor.js`, `ErrorBoundary.jsx`, `initErrorMonitoring()` v App.jsx |
| F2 | Error handling v pricing engine (zachytit a logovat chyby v pipeline) |
| F3 | **Integrace Sentry** (pred realnymi objednavkami!), error dashboard v adminu |
| F4 | Error handling pro file parsery (OBJ, 3MF, STEP — ruzne chybove stavy) |
| F5 | Error handling pro auth (failed login, expired session, CSRF) |
| F6 | API error responses (standardni format, error kody), rate limiting errors |
| F7 | Full monitoring stack, alerting (email pri > 10 chybach/hodinu) |

---

## 5. Bundle size budget per faze

### 5.1 Zduvodneni

Kazda faze pridava novy kod, komponenty, a potencialne knihovny. Bez budgetu
bundle nekontrolovane roste a zakaznik ma pomalou kalkulacku. Widget MUSI byt
maximalne rychly (embedovany v cizim webu).

### 5.2 Budget tabulka

| Faze | Max gzip velikost (JS) | Klicove pridane knihovny | Poznamka |
|------|----------------------|--------------------------|----------|
| **F1** | **250 KB** | — (zadne nove) | Zaklad — optimalizovat existujici |
| **F2** | **280 KB** | — (zadne nove) | Jen logika fees/shipping |
| **F3** | **310 KB** | `@dnd-kit/core` (~15 KB gzip) | Kanban board |
| **F4** | **350 KB** | Three.js loadery (~30 KB gzip) | OBJ/3MF/STEP loadery |
| **F5** | **380 KB** | `@react-pdf/renderer` (~25 KB gzip) | PDF generovani |
| **F6** | **420 KB** | `i18next` (~10 KB gzip), `swagger-ui` (~40 KB, lazy) | Lokalizace, API docs |
| **F7** | **500 KB** | Shopify/WooCommerce SDK (lazy) | Enterprise integrace |

### 5.3 Pravidla pro dodrzeni budgetu

#### Code splitting povinnosti

1. **Vsechny admin stranky:** `React.lazy()` + `Suspense`
   ```jsx
   const AdminFees = React.lazy(() => import('./pages/admin/AdminFees'));
   const AdminKanban = React.lazy(() => import('./pages/admin/AdminKanban'));
   ```

2. **Heavy knihovny:** Lazy import vzdy
   ```javascript
   // Three.js loadery — jen kdyz je potreba
   const loadOBJLoader = () => import('three/addons/loaders/OBJLoader');
   const load3MFLoader = () => import('three/addons/loaders/3MFLoader');

   // @react-pdf/renderer — jen pri generovani PDF
   const loadPDFRenderer = () => import('@react-pdf/renderer');

   // @dnd-kit — jen na Kanban strance
   const loadDndKit = () => import('@dnd-kit/core');
   ```

3. **STEP konverze: NIKDY v klientskem bundlu**
   - OpenCASCADE / occt-import-js je 2+ MB — to v bundlu byt NESMI
   - Vzdy backend-only (Node.js nebo Python microservice)

4. **Swagger UI: Lazy a jen na admin API strance**
   - swagger-ui-react je ~40 KB gzip
   - Nacist az kdyz admin otevre Developer portal

### 5.4 Monitoring bundle size

#### Vite konfigurace

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-three': ['three'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
          'vendor-pdf': ['@react-pdf/renderer'],
          'admin': [
            './src/pages/admin/AdminFees.jsx',
            './src/pages/admin/AdminPresets.jsx',
            // ...dalsí admin stranky
          ],
        },
      },
    },
  },
});
```

#### CI check (GitHub Actions)

```yaml
# .github/workflows/bundle-check.yml
- name: Check bundle size
  run: |
    npm run build
    # Kontrola gzip velikosti
    MAIN_SIZE=$(gzip -c dist/assets/index-*.js | wc -c)
    MAX_SIZE=524288  # 512 KB = bezpecnostni strop
    if [ $MAIN_SIZE -gt $MAX_SIZE ]; then
      echo "Bundle size $MAIN_SIZE exceeds limit $MAX_SIZE"
      exit 1
    fi
```

#### Vizualizace

Po kazdem buildu spustit:
```bash
npx vite-bundle-visualizer
```
Vytvori HTML report s vizualizaci co zabira kolik v bundlu.

### 5.5 Per-faze checklist

| Faze | Akce |
|------|------|
| F1 | Zmeret baseline bundle size, nastavit `React.lazy()` pro vsechny admin stranky |
| F2 | Overit ze nove fees/shipping logika nepridala vic nez 30 KB gzip |
| F3 | `@dnd-kit` lazy load, overit budget 310 KB |
| F4 | Three.js loadery lazy, STEP konverze JEN backend, overit budget 350 KB |
| F5 | `@react-pdf` lazy, auth knihovny (pokud nejake), overit budget 380 KB |
| F6 | `i18next` v hlavnim bundlu (maly), `swagger-ui` lazy, overit budget 420 KB |
| F7 | E-commerce SDK lazy, finalni audit, overit budget 500 KB |

---

## 6. Pricing engine debugger / breakdown display

### 6.1 Popis problemu

Pricing pipeline se s kazdou fazi stava slozitejsim:
- F1: 6 kroku (metrics -> base -> fees -> markup -> minima -> rounding)
- F2: 9 kroku (+ post-processing, express, shipping)
- F3: 10 kroku (+ coupon)
- F4: 11 kroku (+ strategy select)
- F6: 12 kroku (+ tax)
- F7: 13 kroku (+ technology select)

Admin **MUSI** vedet proc je cena takova jaka je. Jinak nemuze efektivne
troubleshootovat reklamace zakazniku ani ladit cenovou politiku.

### 6.2 Soucasny stav

V `pricingEngineV3.js` uz existuje zakladni breakdown objekt:
```javascript
// calculateOrderQuote() vraci:
{
  totalPrice: 1234.56,
  breakdown: {
    basePrice: 800.00,
    fees: [...],
    markup: 100.00,
    // ... ale neni kompletni
  }
}
```

### 6.3 Cilovy breakdown format

```javascript
// Kompletni breakdown objekt (po F7)
{
  pipeline: [
    { step: 'technology_select', label: 'Technologie', value: 'FDM', note: 'Zvolena technologie' },
    { step: 'strategy_select', label: 'Metoda cenotvorby', value: 'slicer', note: 'Dle materialu PLA' },
    { step: 'model_metrics', label: 'Metriky modelu', value: null, details: {
      volume_cm3: 12.5, surface_cm2: 89.3, bbox: '50x30x20mm', triangles: 15000
    }},
    { step: 'base_price', label: 'Zakladni cena', value: 450.00, formula: '12.5cm3 * 36 Kc/cm3' },
    { step: 'fees', label: 'Priplatky', value: 150.00, details: [
      { name: 'Setup fee', amount: 50.00 },
      { name: 'Maly model priplatek', amount: 100.00, reason: 'volume < 5cm3' },
    ]},
    { step: 'post_processing', label: 'Post-processing', value: 200.00, details: [
      { name: 'Bruseni', amount: 120.00 },
      { name: 'Lakovani', amount: 80.00 },
    ]},
    { step: 'express', label: 'Express dodani', value: 150.00, level: 'rush', formula: '1.5x prirazka' },
    { step: 'coupon', label: 'Slevovy kupon', value: -142.50, code: 'LETO2026', discount: '15%' },
    { step: 'volume_discount', label: 'Mnozstevni sleva', value: -80.75, tier: '6-20ks = -10%' },
    { step: 'markup', label: 'Marze', value: 77.68, percent: 10 },
    { step: 'minima', label: 'Minimalni cena', value: 0, note: 'Nad minimem (min: 200 Kc)' },
    { step: 'rounding', label: 'Zaokrouhleni', value: -0.43, method: 'ceil_10' },
    { step: 'shipping', label: 'Doprava', value: 89.00, method: 'PPL', estimatedDays: 3 },
    { step: 'tax', label: 'DPH 21%', value: 197.22 },
  ],
  subtotal: 805.00,  // pred dopravou a DPH
  shipping: 89.00,
  tax: 197.22,
  total: 1091.22,
  currency: 'CZK',
  calculatedAt: '2026-02-10T12:00:00.000Z',
}
```

### 6.4 Admin UI — breakdown zobrazeni

#### Tabulkovy format

V admin panelu (objednavky detail nebo testovaci kalkulacka) zobrazit tabulku:

```
| Krok                | Castka    | Detail                          |
|---------------------|-----------|---------------------------------|
| Zakladni cena       | 450.00 Kc | 12.5cm3 * 36 Kc/cm3           |
| Priplatky           | +150.00   | Setup fee (50) + Maly model (100) |
| Post-processing     | +200.00   | Bruseni (120) + Lakovani (80)  |
| Express (rush)      | +150.00   | 1.5x prirazka                  |
| Kupon LETO2026      | -142.50   | 15% sleva                      |
| Mnozstevni sleva    | -80.75    | 6-20ks tier = -10%             |
| Marze 10%           | +77.68    |                                 |
| Zaokrouhleni        | -0.43     | Nahoru na desitky              |
| ─────────────────── | ───────── | ─────────────────────────────── |
| Mezicastka          | 805.00 Kc |                                 |
| Doprava (PPL)       | +89.00    | 3 prac. dny                    |
| DPH 21%             | +197.22   |                                 |
| ═══════════════════ | ═════════ | ═══════════════════════════════ |
| CELKEM              | 1091.22 Kc|                                 |
```

#### Explain mode

V admin testovaci kalkulacce pridat toggle "Zobrazit detailni vypocet":
- Kdyz zapnuty: po kazdem prepoctu zobrazit breakdown tabulku
- Uzitecne pro ladeni cenotvorby pred nasazenim
- NENI viditelny zakaznikum (jen admin)

### 6.5 Per-faze implementace breakdown

| Faze | Nova pole v breakdown | Akce |
|------|----------------------|------|
| F1 | `base_price`, `fees`, `markup`, `minima`, `rounding`, `volume_discount` | Zakladni breakdown + admin UI zobrazeni |
| F2 | `post_processing`, `express`, `shipping` | Rozsireni breakdown |
| F3 | `coupon` | Pridani kuponove slevy do breakdown |
| F4 | `strategy_select`, `model_metrics` (rozsireni) | Vizualizace zvolene metody |
| F5 | — (zadne cenove zmeny) | — |
| F6 | `tax` | DPH kalkulace v breakdown |
| F7 | `technology_select` | Technologie v breakdown |

---

## 7. Automated testing milestones per faze

### 7.1 Filozofie testovani

- **Unit testy:** Cista business logika (pricing, fees, validace) — rychle, izolovane
- **Integration testy:** Komunikace mezi moduly (storage -> engine -> UI)
- **E2E testy:** Cely user flow v prohlizeci (Playwright nebo Cypress)
- **Testovaci framework:** Vitest (pro unit/integration), Playwright (pro E2E)

### 7.2 Faze 1 — Zaklad

| Typ | Co testovat | Soubory | Priorita |
|-----|-------------|---------|----------|
| Unit | `calculateOrderQuote()` — spravny vypocet pro ruzne vstupy | `pricingEngineV3.test.js` | P0 |
| Unit | `loadPricingConfigV3()` — spravne nacitani konfigurace | `adminPricingStorage.test.js` | P0 |
| Unit | `loadFeesConfigV3()` — spravne aplikovani fees | `adminFeesStorage.test.js` | P0 |
| Unit | Volume discount logika | `volumeDiscount.test.js` | P1 |
| Unit | `measureStorageUsage()` — spravne mereni | `storageMonitor.test.js` | P2 |
| Unit | `isFeatureEnabled()` — feature flagy | `featureFlags.test.js` | P2 |

**Minimalni pokryti po F1:** 80% pricing engine, 70% storage helpery

### 7.3 Faze 2 — Fees pipeline

| Typ | Co testovat | Soubory | Priorita |
|-----|-------------|---------|----------|
| Unit | Post-processing fee kalkulace | `postProcessing.test.js` | P0 |
| Unit | Express pricing logika (standard/express/rush) | `expressPricing.test.js` | P0 |
| Unit | Shipping cost kalkulace (vaha, zoner, free shipping) | `shippingCalc.test.js` | P0 |
| Integration | Kompletni pipeline: base + fees + post-proc + express + shipping | `fullPipeline.test.js` | P1 |

**Minimalni pokryti po F2:** 85% pricing engine, 80% fees

### 7.4 Faze 3 — E2E checkout

| Typ | Co testovat | Priorita |
|-----|-------------|----------|
| Unit | Coupon validation (expiration, min amount, max uses) | P0 |
| Unit | Kanban state transitions (valid moves, invalid moves) | P1 |
| Unit | Email template rendering (promenne nahrazeni) | P1 |
| **E2E** | **Kompletni checkout flow:** upload STL -> konfigurace -> vidim cenu -> vyplnim formular -> odeslam objednavku -> vidim potvrzeni | **P0** |
| **E2E** | Coupon flow: zadam kod -> vidim slevu -> slevu v souhrnu -> v objednavce | P1 |
| **E2E** | Kanban: presunu objednavku mezi stavy, overim zmenu | P2 |

**Toto je PRVNI faze s E2E testy — nejdulezitejsi milestone!**

### 7.5 Faze 4 — File parsery

| Typ | Co testovat | Priorita |
|-----|-------------|----------|
| Unit | OBJ parser — spravne nacteni vertices, faces | P0 |
| Unit | 3MF parser — ZIP extraction, XML parsing | P0 |
| Unit | STEP konverze — API call, timeout handling | P0 |
| Unit | Printability check — watertight, min thickness, bbox | P0 |
| Unit | Pricing strategy selection (per material) | P1 |
| Integration | Upload file -> parse -> metrics -> price | P1 |

### 7.6 Faze 5 — Auth a zakaznicke funkce

| Typ | Co testovat | Priorita |
|-----|-------------|----------|
| Unit | Password hashing (argon2 nebo bcrypt) | P0 |
| Unit | Session token generation a validace | P0 |
| Unit | PDF template rendering | P1 |
| **E2E** | **Auth flow:** registrace -> potvrzovaci email -> login -> dashboard -> historie objednavek | **P0** |
| E2E | PDF: vygenerovat fakturu, overit obsah | P1 |
| **Security** | **Brute force test:** 10x spatne heslo -> lockout | **P0** |
| Security | IDOR test: uzivatel A nemuze videt objednavky uzivatele B | P0 |
| Security | Session fixation test | P1 |

### 7.7 Faze 6 — API a integrace

| Typ | Co testovat | Priorita |
|-----|-------------|----------|
| **API Integration** | **Vsech 23 API endpointu:** correct response, error cases, auth | **P0** |
| API Integration | Rate limiting: 101. request za minutu -> 429 | P0 |
| API Integration | API key management: create, revoke, expired key | P0 |
| Unit | i18n: vsechny klice existuji ve vsech jazycich | P1 |
| Unit | DPH kalkulace: CZ 21%, DE 19%, VIES validace | P1 |
| Security | OWASP API Top 10 scan | P0 |

### 7.8 Faze 7 — Full regression

| Typ | Co testovat | Priorita |
|-----|-------------|----------|
| Unit | Multi-technology pricing (FDM, SLA, SLS, CNC) | P0 |
| Integration | Shopify webhook sync test | P1 |
| Integration | WooCommerce product sync test | P1 |
| **E2E** | **Full regression suite** — vsechny predchozi E2E testy + | **P0** |
| E2E | Onboarding wizard: novy admin projde 5 kroky | P1 |
| Performance | Load test: 100 soucasnych cenových kalkulaci | P2 |

### 7.9 CI/CD workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx vitest run --coverage
      - name: Check coverage thresholds
        run: |
          # Per-faze thresholds se zvysuji
          # F1: 60%, F3: 70%, F5: 75%, F7: 80%
          npx vitest run --coverage --coverage.thresholds.lines=60

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - name: Check bundle size
        run: |
          SIZE=$(du -sb dist/assets/*.js | awk '{sum+=$1} END{print sum}')
          echo "Total JS: $SIZE bytes"
          # Limit 600 KB nekomprimovane (cca 200 KB gzip)
```

### 7.10 Testovaci pyramida — cilovY pomer

```
         /\
        /  \  E2E testy: 10-15% (pomale, drahe, ale kriticke)
       /    \
      /------\  Integration testy: 20-25%
     /        \
    /----------\  Unit testy: 60-70% (rychle, izolovane, hodne)
   /____________\
```

---

## 8. Git branching strategie

### 8.1 Hlavni branche

```
main          Produkce. Firebase hosting deploy. Pouze merge z develop nebo hotfix.
              NIKDY primo commitovat na main.
              Chraneny branch: vyzaduje PR + review.

develop       Integracni branch. Merge z feature branchi.
              Sem se merguje po dokonceni kazde sekce.
              Automaticky deploy na staging (Firebase preview channel).

feature/*     Per-sekce feature branche (viz 8.2).
              Zije maximalne dobu jedne sekce (1-2 tydny).
              Po merge do develop se smaze.

hotfix/*      Urgentni opravy na produkci.
              Vychazi z main, merguje se do main I develop.
```

### 8.2 Feature branch pojmenovani

Format: `feature/S{NN}-{slug}`

| Faze | Branch | Popis |
|------|--------|-------|
| F1 | `feature/S01-reactive-pricing` | Bug fixes, auto-prepocet |
| F1 | `feature/S02-checkout-form` | Kontaktni formular a checkout |
| F1 | `feature/S05-volume-discounts` | Mnozstevni slevy |
| F2 | `feature/S06-post-processing` | Post-processing fees |
| F2 | `feature/S09-express-pricing` | Express pricing a upselly |
| F2 | `feature/S04-shipping` | Doprava a dodaci lhuty |
| F3 | `feature/S14-kanban` | Kanban board |
| F3 | `feature/S07-email-notifications` | Emailove notifikace |
| F3 | `feature/S10-coupons` | Kupony a promo akce |
| F4 | `feature/S03-multi-format` | Multi-format 3D soubory |
| F4 | `feature/S08-printability` | Printability check |
| F4 | `feature/S15-pricing-methods` | Rozsirene metody cenotvorby |
| F5 | `feature/S13-pdf-documents` | Generovani PDF |
| F5 | `feature/S12-customer-portal` | Zakaznicky portal |
| F5 | `feature/S11-chat` | Chat a komentare |
| F6 | `feature/S16-i18n` | Multijazynost |
| F6 | `feature/S20-public-api` | Public API |
| F6 | `feature/S19-crm-marketing` | CRM a analytika |
| F6 | `feature/S21-security-tax` | Bezpecnost a dane |
| F7 | `feature/S18-multi-technology` | Vice technologii |
| F7 | `feature/S17-ecommerce-plugins` | E-commerce pluginy |
| F7 | `feature/S22-onboarding` | Onboarding a tutorialy |

### 8.3 Hotfix branche

Format: `hotfix/S{NN}-{popis}`

Priklad: `hotfix/S01-pricing-nan-fix`

Workflow:
1. Vytvorit z `main`
2. Opravit bug
3. PR do `main` (urgentni review)
4. Po merge do `main`: **TAKE** merge do `develop` (aby se oprava nedztratila)
5. Tag: `v3.{faze}.{patch}` (napr. `v3.1.1`)

### 8.4 Tagovani a release

Po kazde fazi:
1. Merge `develop` -> `main` (PR s review)
2. Tag na `main`: `v3.{faze}.0`
3. Firebase deploy na produkci
4. Release notes na GitHubu

Tagy:
```
v3.1.0  — Faze 1 hotova (zakladni prototyp)
v3.2.0  — Faze 2 hotova (kompletni ceny)
v3.3.0  — Faze 3 hotova (sprava + komunikace)
v3.4.0  — Faze 4 hotova (pokrocila kalkulacka)
v3.5.0  — Faze 5 hotova (zakaznicke funkce)
v3.6.0  — Faze 6 hotova (platforma)
v3.7.0  — Faze 7 hotova (enterprise + finalizace)
```

### 8.5 Merge pravidla

| Z -> Do | Kdo schvaluje | CI musi projit? | Squash merge? |
|---------|--------------|-----------------|---------------|
| `feature/*` -> `develop` | 1 reviewer | Ano (unit + lint) | Ano (1 commit per sekce) |
| `develop` -> `main` | 2 revieweri | Ano (unit + E2E + bundle) | Ne (zachovat historii) |
| `hotfix/*` -> `main` | 1 reviewer | Ano (unit) | Ano |

### 8.6 Pravidla pro commit messages

Format: Conventional Commits

```
feat(S01): pridani auto-prepoctu cen pri zmene parametru
fix(S02): oprava NaN v souhrnu objednavky
refactor(pricing): extrakce volume discount do samostatne funkce
test(S01): unit testy pro calculateOrderQuote()
docs(S00): aktualizace indexu zavislosti
chore: aktualizace dependencies
```

Prefix podle sekce: `feat(S{NN}):`, `fix(S{NN}):`, `test(S{NN}):` atd.

---

## 9. Admin UI navigace — evoluce pres faze

### 9.1 Aktualni stav admin menu

Existujici admin stranky (pred V3):
- Dashboard (`/admin/dashboard`)
- Pricing / Cenotvorba (`/admin/pricing`)
- Fees / Priplatky (`/admin/fees`)
- Presets / Presety (`/admin/presets`)
- Branding (`/admin/branding`)
- Widget (`/admin/widget`)
- Orders / Objednavky (`/admin/orders`)
- Team / Pristup (`/admin/team`)
- Analytics (`/admin/analytics`)

### 9.2 Evoluce menu per faze

#### Faze 1 — Zadne nove stranky

```
Admin Menu (po F1):
├── Dashboard
├── Cenotvorba           (existujici — drobne upravy)
│   └── Mnozstevni slevy (novy tab v Cenotvorba)
├── Priplatky            (existujici)
├── Presety              (existujici)
├── Branding             (existujici)
├── Widget               (existujici)
├── Objednavky           (existujici — kontaktni formular data)
├── Team                 (existujici)
├── Analytics            (existujici)
└── Nastaveni
    └── Feature Flags    (NOVE — jednoduchy toggle list)
```

**Zmeny:** Pridani "Feature Flags" do nastaveni, tab "Mnozstevni slevy" v Cenotvorba.

#### Faze 2 — Doprava a Express

```
Admin Menu (po F2):
├── Dashboard
├── Cenotvorba
│   ├── Zakladni ceny
│   ├── Mnozstevni slevy
│   └── Post-processing    (NOVE — konfigurace sluzeb po tisku)
├── Priplatky
├── Presety
├── Doprava                (NOVE — dopravni metody, free shipping prah)
├── Express dodani         (NOVE — standard/express/rush konfigurace)
├── Branding
├── Widget
├── Objednavky
├── Team
├── Analytics
└── Nastaveni
    └── Feature Flags
```

**Nove stranky:** `/admin/shipping`, `/admin/express`
**Nove taby:** Post-processing v Cenotvorba

#### Faze 3 — Sprava a komunikace

```
Admin Menu (po F3):
├── Dashboard
├── Cenotvorba
│   ├── Zakladni ceny
│   ├── Mnozstevni slevy
│   └── Post-processing
├── Priplatky
├── Presety
├── Doprava
├── Express dodani
├── Kupony                 (NOVE — slevove kody, pravidla, statistiky)
├── Branding
├── Widget
├── Objednavky
│   ├── Tabulka            (existujici)
│   └── Kanban             (NOVE — drag-and-drop vizualni sprava)
├── Emaily                 (NOVE)
│   ├── Sablony            (10 emailovych sablon)
│   ├── Nastaveni SMTP     (provider konfigurace)
│   └── Log odeslani       (historie odeslanych emailu)
├── Team
├── Analytics
└── Nastaveni
    └── Feature Flags
```

**Nove stranky:** `/admin/coupons`, `/admin/emails`, `/admin/orders/kanban`
**Zmeny:** Objednavky ziskavaji sub-navigaci (Tabulka / Kanban)

#### Faze 4 — Zadne nove stranky

```
Admin Menu (po F4): Stejny jako F3, ale zmeny UVNITR existujicich stranek:
- Cenotvorba: novy tab "Metody cenotvorby" (slicer/volume/bbox per material)
- Widget: podpora novych formatu (OBJ, 3MF, STEP) v konfiguraci
- Objednavky detail: zobrazeni printability reportu
```

**Zadne nove hlavni polozky v menu.** Zmeny jsou uvnitr existujicich stranek.

#### Faze 5 — Zakaznicke funkce

```
Admin Menu (po F5):
├── Dashboard
├── Cenotvorba
│   ├── Zakladni ceny
│   ├── Mnozstevni slevy
│   ├── Post-processing
│   └── Metody cenotvorby
├── Priplatky
├── Presety
├── Doprava
├── Express dodani
├── Kupony
├── Dokumenty              (NOVE — sablony faktur, nabidek, dodacich listu)
├── Branding
├── Widget
├── Objednavky
│   ├── Tabulka
│   ├── Kanban
│   └── Chat               (NOVE — zpravy a komentare u objednavek)
├── Zakaznici              (NOVE — seznam zakazniku, detail, sprava uctu)
├── Emaily
│   ├── Sablony
│   ├── Nastaveni SMTP
│   └── Log odeslani
├── Team
├── Analytics
└── Nastaveni
    └── Feature Flags
```

**Nove stranky:** `/admin/documents`, `/admin/customers`, chat v objednavkach
**Zmeny:** Objednavky detail ziskava chat tab

#### Faze 6 — Platforma

```
Admin Menu (po F6):
├── Dashboard
├── Cenotvorba
│   ├── Zakladni ceny
│   ├── Mnozstevni slevy
│   ├── Post-processing
│   └── Metody cenotvorby
├── Priplatky
├── Presety
├── Doprava
├── Express dodani
├── Kupony
├── Dokumenty
├── Branding
├── Widget
├── Objednavky (Tabulka / Kanban / Chat)
├── Zakaznici
├── Lokalizace             (NOVE)
│   ├── Jazyky             (cs, en, de, sk, pl)
│   ├── Meny               (CZK, EUR, USD, GBP, PLN)
│   └── Preklady           (editor prekladu)
├── API                    (NOVE)
│   ├── API klice          (generovani, revokace)
│   ├── Webhooky           (konfigurace)
│   └── Dokumentace        (Swagger UI)
├── CRM & Marketing        (NOVE)
│   ├── Segmentace         (zakaznicke skupiny, tagging)
│   ├── Kampane            (email kampane)
│   └── Analytika          (obrat, konverze, top zakaznici)
├── Bezpecnost             (NOVE)
│   ├── Dane (DPH/VAT)     (sazby, VIES validace)
│   ├── GDPR               (export dat, smazani, retence)
│   ├── Audit log          (historie vsech akci)
│   └── Security nastaveni (HSTS, CSP, CORS)
├── Emaily
├── Team
├── Analytics
└── Nastaveni
    └── Feature Flags
```

**Nove stranky:** `/admin/localization`, `/admin/api`, `/admin/crm`, `/admin/security`
**Toto je NEJVETSI narust menu — 4 nove hlavni sekce.**

#### Faze 7 — Enterprise a finalizace

```
Admin Menu (po F7 — FINALNI):
├── Dashboard (s onboarding widget pro nove adminy)
├── Cenotvorba
│   ├── Zakladni ceny
│   ├── Mnozstevni slevy
│   ├── Post-processing
│   ├── Metody cenotvorby
│   └── Technologie        (NOVE — FDM, SLA, SLS, CNC konfigurace)
├── Priplatky
├── Presety
├── Doprava
├── Express dodani
├── Kupony
├── Dokumenty
├── Branding
├── Widget
├── Objednavky (Tabulka / Kanban / Chat)
├── Zakaznici
├── Lokalizace (Jazyky / Meny / Preklady)
├── API (Klice / Webhooky / Dokumentace)
├── CRM & Marketing (Segmentace / Kampane / Analytika)
├── Integrace              (NOVE)
│   ├── Shopify            (konfigurace, sync status)
│   └── WooCommerce        (konfigurace, sync status)
├── Bezpecnost (Dane / GDPR / Audit / Security)
├── Emaily
├── Team
├── Analytics
└── Nastaveni
    ├── Feature Flags
    └── Onboarding          (NOVE — reset onboardingu, nastaveni tutorialu)
```

**Nove stranky:** `/admin/technologies`, `/admin/integrations`, onboarding nastaveni

### 9.3 Menu grouping strategie

Od Faze 6 je menu prilis dlouhe — seskupit do skupin:

```
PRODEJ
  ├── Cenotvorba
  ├── Priplatky
  ├── Presety
  ├── Kupony
  └── Doprava / Express

OBJEDNAVKY
  ├── Objednavky (Tabulka / Kanban)
  ├── Zakaznici
  └── Dokumenty

KOMUNIKACE
  ├── Emaily
  └── CRM & Marketing

KONFIGURACE
  ├── Branding
  ├── Widget
  ├── Lokalizace
  └── Technologie / Integrace

SYSTEM
  ├── Team
  ├── API
  ├── Bezpecnost
  ├── Analytics
  └── Nastaveni
```

Toto seskupeni implementovat v **F6** (kdyz je menu uz rozsahle).

### 9.4 Routes.jsx zmeny per faze

| Faze | Nove routy | Lazy loaded? |
|------|-----------|-------------|
| F1 | — (zadne) | — |
| F2 | `/admin/shipping`, `/admin/express` | Ano |
| F3 | `/admin/coupons`, `/admin/emails`, `/admin/orders/kanban` | Ano |
| F4 | — (zmeny uvnitr existujicich) | — |
| F5 | `/admin/documents`, `/admin/customers` | Ano |
| F6 | `/admin/localization`, `/admin/api`, `/admin/crm`, `/admin/security` | Ano |
| F7 | `/admin/technologies`, `/admin/integrations` | Ano |

**Celkem:** 13 novych route pres 7 fazi. VSECHNY `React.lazy()`.

---

## 10. Bezpecnostni checklist per faze

### 10.1 Filozofie

Bezpecnost neni jednorazovy ukol — musi se resit v KAZDE fazi. Kazda faze
prinasi nove attack surface a novy typ dat. Tento checklist definuje co
musi projit security review PRED deploy na produkci.

### 10.2 Faze 1 — Zakladni input validace

| # | Kontrola | Detail | Status |
|---|----------|--------|--------|
| 1.1 | **XSS v formulari** | Vsechny user inputy v checkout formulari musi byt escapovane. React defaultne escapuje, ale `dangerouslySetInnerHTML` NIKDY nepouzivat s user daty. | [ ] |
| 1.2 | **CSRF ochrana** | Pokud se pouziva POST endpoint, overit ze ma CSRF token nebo same-site cookie. V soucasnosti localStorage — neni to kriticke, ale pripravit se. | [ ] |
| 1.3 | **Input validace — formular** | Email regex, telefon format, jmeno max delka, PSC format. Validace na KLIENTU i na "backendu" (v localStorage save logice). | [ ] |
| 1.4 | **localStorage injection** | Overit ze `readTenantJson()` nemuze byt zneuzit pokud nekdo rucne zmeni localStorage v devtools. Parsing errors musi byt zachyceny. | [ ] |
| 1.5 | **postMessage origin check** | Widget musi overit `event.origin` v `message` event handleru. Jinak muze libovolna stranka posilat zpravy nasemu widgetu. | [ ] |
| 1.6 | **Pricing manipulation** | Overit ze zakaznik nemuze zmenit cenu na klientu (napr. v devtools). Konecna cena se MUSI prepocitat na "serveru" (v nasem pripade v pricing engine, ne v UI state). | [ ] |

### 10.3 Faze 2 — File upload

| # | Kontrola | Detail | Status |
|---|----------|--------|--------|
| 2.1 | **MIME type validace** | Overit MIME type uploadu (ne jen priponu!). Povolene: `model/stl`, `application/sla`, `model/obj`, `model/3mf`, `model/step`. | [ ] |
| 2.2 | **File size limit** | Max velikost souboru: 50 MB pro STL, 100 MB pro STEP. Kontrola na klientu I backendu. | [ ] |
| 2.3 | **Zip bomb prevence** | 3MF je ZIP archiv — overit ze po rozbaleni neni nesmiselne velky (ratio check: rozbaleny < 10x komprimovany). | [ ] |
| 2.4 | **Path traversal** | Pokud 3MF obsahuje relativni cesty (`../../../etc/passwd`), odmitni soubor. Whitelist povolenych cest v archivu. | [ ] |
| 2.5 | **DoS pres slicing** | PrusaSlicer muze bezet neomezene dlouho na slozitem modelu. Nastavit timeout (max 60s), memory limit. | [ ] |

### 10.4 Faze 3 — Rate limiting a komunikace

| # | Kontrola | Detail | Status |
|---|----------|--------|--------|
| 3.1 | **Rate limiting objednavek** | Max 5 objednavek za minutu z jedne IP/session. Zabranit spamovani objednavkami. | [ ] |
| 3.2 | **Email injection** | Emailove sablony nesmi umoznit injection do hlavicek (To, CC, BCC). Admin-defined promenne escapovat. | [ ] |
| 3.3 | **SMTP credentials** | SMTP hesla v localStorage MUSI byt sifrovane (alespon base64 + obfuskace, idealne AES s per-tenant klicem). NIKDY plaintext. | [ ] |
| 3.4 | **Coupon brute force** | Max 10 pokusu o zadani kuponu za minutu. Zabranit brute-force hadani kodu. | [ ] |
| 3.5 | **Kanban state manipulation** | Overit ze state transition je validni (napr. z "Nova" nelze skocit na "Hotova"). Definovat povolene prechody. | [ ] |
| 3.6 | **Email log — osobni udaje** | Email log obsahuje adresy zakazniku — overit ze je pristupny JEN adminovi, ne pres widget/public API. | [ ] |

### 10.5 Faze 4 — File format injection

| # | Kontrola | Detail | Status |
|---|----------|--------|--------|
| 4.1 | **SVG XSS** | Pokud se SVG pouziva (napr. jako thumbnail), overit ze neobsahuje `<script>` tagy nebo `onload` atributy. Sanitizovat SVG pred zobrazenim. | [ ] |
| 4.2 | **STEP parsing overflow** | STEP/IGES soubory mohou obsahovat malforrmovana data. OpenCASCADE parser musi bezet v sandboxu s memory limitem. | [ ] |
| 4.3 | **OBJ injection** | OBJ soubory mohou obsahovat `mtllib` direktivu pro nacitani externich souboru. Ignorovat vsechny externi reference. | [ ] |
| 4.4 | **3MF XML entity expansion** | XML v 3MF muze obsahovat entity expansion attack (Billion Laughs). Pouzit XML parser s limitem na entity expansion depth. | [ ] |
| 4.5 | **Mesh metrics manipulation** | Overit ze klient nemuze podvrhnout metriky modelu (volume, surface area). Metriky se MUSI pocitat na backendu/v nasem kodu, ne prijmat z klienta. | [ ] |

### 10.6 Faze 5 — Autentizace (KRITICKA FAZE)

| # | Kontrola | Detail | Priorita |
|---|----------|--------|----------|
| 5.1 | **Password hashing** | Argon2id (preferovane) nebo bcrypt s cost factor >= 12. NIKDY MD5/SHA1/SHA256 bez salt. | **P0** |
| 5.2 | **Brute force ochrana** | Po 5 neuspesnych pokusech: 15 min lockout. Po 10: trvalý lockout az do admin odemceni. Log vsech pokusu. | **P0** |
| 5.3 | **Session management** | Secure, HttpOnly, SameSite=Strict cookies. Session expiration: 24h (konfigurovatelne). Logout = invalidace session na serveru. | **P0** |
| 5.4 | **IDOR prevence** | Kazdy API endpoint ktery vraci data uzivatele MUSI overit ze `requestingUserId === resourceOwnerId`. Zadne sekvencni ID — pouzit UUID. | **P0** |
| 5.5 | **Registration spam** | Rate limit na registrace: max 3 za hodinu z jedne IP. CAPTCHA nebo email verifikace. | P1 |
| 5.6 | **Password reset flow** | Token s expiraci (1 hodina), jednorazovy (po pouziti invalidovat), nepredvidatelny (crypto random). | **P0** |
| 5.7 | **OAuth state parameter** | Pri Google OAuth overit `state` parameter proti CSRF. | P1 |
| 5.8 | **Magic link bezpecnost** | Token jen jednorazovy, expirace 15 min, vazany na email+IP. | P1 |
| 5.9 | **Token-based pristup (chat)** | Zakaznicky chat token: kratka expirace (1h), vazany na objednavku, ne na uzivatele. Zabranit horizontalnimu pristupu. | P1 |
| 5.10 | **PDF pristup** | Generovane PDF (faktury) MUSI byt pristupne jen vlastnikovi objednavky a adminovi. Zadne verejne URL. | P1 |

**DOPORUCENI:** Pred zahajenim F5 provest security review designu autentizace
s externistou (nebo alespon s Claude Code Security agentem `mp-sr-security`).

### 10.7 Faze 6 — API bezpecnost (KRITICKA)

| # | Kontrola | Detail | Priorita |
|---|----------|--------|----------|
| 6.1 | **API key management** | Klice s prefixem `mp_live_` / `mp_test_`. Hashovane v storage (SHA256). Zobrazit jen jednou pri vytvoreni. Podpora revokace. | **P0** |
| 6.2 | **Rate limiting** | Per-key rate limit: 100 req/min (konfigurovatelne). Response header: `X-RateLimit-Remaining`. 429 odpoved s `Retry-After`. | **P0** |
| 6.3 | **Input validace (API)** | Vsechny API endpointy: validace schematu (joi/zod), max payload size (1 MB), content-type check. | **P0** |
| 6.4 | **OWASP API Top 10** | Projit vsech 10 bodu: Broken Object-Level Auth, Broken Auth, Excessive Data Exposure, Lack of Resources & Rate Limiting, Broken Function-Level Auth, Mass Assignment, Security Misconfiguration, Injection, Improper Assets Management, Insufficient Logging. | **P0** |
| 6.5 | **Webhook signature** | Vsechny webhooky podepsane HMAC-SHA256. Prijemce musi overit podpis. | P1 |
| 6.6 | **CORS** | API: `Access-Control-Allow-Origin` pouze pro registrovane domeny tenanta. NIKDY `*`. | P1 |
| 6.7 | **API response filtering** | NIKDY nevracet interní data (napr. hesla, API klice, interní ID). Definovat response DTO pro kazdy endpoint. | **P0** |
| 6.8 | **GDPR data export** | Export endpointy musi byt rate-limited a autentifikovane. Export vsech dat uzivatele v JSON/CSV. Smazani uctu musi byt ireverzibilni. | P1 |
| 6.9 | **DPH/VAT validace** | VIES API volani: cache vysledky (24h), fallback pri nedostupnosti, neprijmout neplatne VAT. | P1 |
| 6.10 | **Sandbox izolace** | API sandbox prostredi MUSI byt uplne oddelene od produkce. Zadne sdilene klice, data, nebo namespaces. | P1 |

### 10.8 Faze 7 — Multi-tenant a compliance

| # | Kontrola | Detail | Status |
|---|----------|--------|--------|
| 7.1 | **Multi-tenant izolace** | Tenant A NESMI videt data tenanta B. Kazdy localStorage klic ma prefix `modelpricer:{tenantId}:`. Overit ze ZADNY kod neobchazi tenant prefix. | [ ] |
| 7.2 | **GDPR compliance** | Pravo na pristup (export), pravo na vymazani (smazani uctu + dat), pravo na prenositelnost (export ve strojove citelnem formatu), retencni politiky (automaticke smazani po X mesicich). | [ ] |
| 7.3 | **Audit logging** | KAZDA zmena konfigurace, kazdy pristup k datum zakazniku, kazda zmena opravneni MUSI byt zalogovan s casem, uzivatelem, a IP. | [ ] |
| 7.4 | **E-commerce plugin security** | Shopify/WooCommerce OAuth tokeny: ulozene sifrovane, automaticka obnova pred expiraci, revokace pri odpojeni. | [ ] |
| 7.5 | **Content Security Policy** | CSP header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.*`. Zadne `unsafe-eval`. | [ ] |
| 7.6 | **HSTS** | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` | [ ] |
| 7.7 | **Dependency audit** | `npm audit` MUSI projit bez critical vulnerabilities pred kazdym deploy. Automaticky check v CI. | [ ] |
| 7.8 | **Secret management** | ZADNE tajne klice v kodu, localStorage, nebo Git historii. Pouzit environment variables a/nebo secret manager (Firebase config). | [ ] |

### 10.9 Security review proces

#### Pred kazdou fazi

1. **Threat model** — identifikovat nove attack surface (co se pridava?)
2. **Design review** — architekt (`mp-sr-security`) review navrhu pred implementaci
3. **Code review** — security-focused review vsech novych endpointu a formularu
4. **Testovani** — security testy (viz sekce 7), penetracni testy (F5, F6)
5. **Dokumentace** — zdokumentovat security rozhodnuti a zname rizika

#### Po kazde fazi

1. Projit checklist dane faze — vsechny body MUSI byt [ X ]
2. `npm audit` — zadne critical vulnerabilities
3. Staticka analyza (eslint-plugin-security)
4. Manualni kontrola — neni v kodu zadne hardcoded tajemstvi?

---

## Souhrn — Kdy co implementovat (master timeline)

```
FAZE 1:
  [x] localStorage monitoring helper (measureStorageUsage)
  [x] Audit log rotace (max 1000 zaznamu)
  [x] Feature flags system (featureFlags.js + admin UI)
  [x] Error monitoring zaklad (errorMonitor.js + ErrorBoundary)
  [x] Baseline bundle size mereni
  [x] React.lazy() pro vsechny admin stranky
  [x] Zakladni pricing breakdown v admin UI
  [x] Unit testy pricing engine (80% coverage)
  [x] Git branching setup (main + develop + feature/S01-*)
  [x] Security: input validace, postMessage origin, pricing manipulation check

FAZE 2:
  [x] Monitorovat localStorage po pridani 3 novych namespaces
  [x] postMessage: nove typy (shipping-selected, set-express)
  [x] Nove feature flagy: post-processing, express-pricing
  [x] Error handling v pricing pipeline
  [x] Bundle check: max 280 KB gzip
  [x] Breakdown: + post-processing, express, shipping
  [x] Unit testy fees pipeline (85% coverage)
  [x] Security: file upload validace, MIME, zip bomb

FAZE 3:
  [x] localStorage rotace: email log (500), archivace objednavek (6 mesicu)
  [x] postMessage: coupon-applied, apply-coupon
  [x] Nove feature flagy: coupon-system, email-notifications, kanban-board
  [x] **SENTRY INTEGRACE** (pred realnymi objednavkami!)
  [x] Bundle check: max 310 KB gzip (@dnd-kit lazy)
  [x] Breakdown: + coupon
  [x] **PRVNI E2E TESTY** (checkout flow)
  [x] Admin menu: + Kupony, Emaily, Kanban
  [x] Security: rate limiting, email injection, SMTP credentials

FAZE 4:
  [x] localStorage: bez novych rostoucich namespaces — jen monitoring
  [x] Widget: podpora novych formatu (informacni, ne breakujici)
  [x] Nove feature flagy: multi-format, printability-check, extended-pricing
  [x] Error handling pro file parsery
  [x] Bundle check: max 350 KB gzip (Three.js loadery lazy, STEP backend-only!)
  [x] Breakdown: + strategy_select, rozsirene model_metrics
  [x] Unit testy file parsery + printability
  [x] Security: SVG XSS, STEP parsing, OBJ injection, 3MF XXE

FAZE 5:
  [x] **KRITICKA localStorage FAZE** — customers + chat. IndexedDB wrapper pokud > 50%
  [x] postMessage: auth-required, user-authenticated, set-user
  [x] Nove feature flagy: customer-portal, chat-system, pdf-documents
  [x] Error handling auth (failed login, expired session)
  [x] Bundle check: max 380 KB gzip (@react-pdf lazy)
  [x] E2E testy: auth flow (registrace -> login -> dashboard)
  [x] Admin menu: + Dokumenty, Zakaznici, Chat v objednavkach
  [x] **SECURITY REVIEW PRED IMPLEMENTACI** — autentizace je kriticka

FAZE 6:
  [x] localStorage: localization muze byt velky — zvazit external JSON
  [x] postMessage: set-language, language-changed
  [x] Nove feature flagy: multi-language, public-api, crm-analytics, tax-system
  [x] API error responses (standardni format)
  [x] Bundle check: max 420 KB gzip (swagger-ui lazy)
  [x] Breakdown: + tax
  [x] API integration testy (vsech 23 endpointu)
  [x] Admin menu: + Lokalizace, API, CRM, Bezpecnost (NEJVETSI narust!)
  [x] Menu grouping implementace
  [x] **OWASP API Top 10 audit**

FAZE 7:
  [x] Finalni localStorage audit, retention policies, cisticka
  [x] postMessage: set-technology, technology-changed
  [x] Nove feature flagy: multi-technology, ecommerce-plugins, onboarding-wizard
  [x] Full monitoring stack, alerting
  [x] Bundle check: max 500 KB gzip (e-commerce SDK lazy)
  [x] Breakdown: + technology_select
  [x] **FULL REGRESSION SUITE** — vsechny testy projdou
  [x] Admin menu: finalni podoba (25+ stranek)
  [x] Multi-tenant izolace audit, GDPR compliance, dependency audit
  [x] Performance test: 100 soucasnych kalkulaci
```

---

## Reference

- **Master index:** `V3-S00-index-a-zavislosti.md`
- **Per-sekce plany:** `V3-S{NN}-*.md` (22 dokumentu)
- **CLAUDE.md:** Sekce 2 (Invarianty), Sekce 18 (Quality gates), Sekce 19 (Security)
- **Agent hierarchie:** `docs/claude/AGENT_MAP.md`
- **Klicovi agenti pro prurezy:**
  - `mp-sr-security` — bezpecnostni review vsech fazi
  - `mp-mid-quality-code` — code review gate
  - `mp-spec-test-e2e` — E2E testy
  - `mp-mid-infra-build` — bundle size, CI/CD
  - `mp-mid-storage-tenant` — localStorage management
  - `mp-mid-frontend-widget` — widget backward compat

---

**KONEC DOKUMENTU — 10 prurezovych strategii pro 7 implementacnich fazi**
