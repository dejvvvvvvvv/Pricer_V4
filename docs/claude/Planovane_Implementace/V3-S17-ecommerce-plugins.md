# V3-S17: E-commerce Pluginy a Integrace

> **Priorita:** P3 | **Obtiznost:** High | **Vlna:** 4
> **Zavislosti:** S01 (bug fixes), S02 (objednavky), S11 (widget embed), S20 (public API)
> **Odhadovany rozsah:** ~40-60 souboru, 3-4 tydny prace (2 vyvojari)

---

## A. KONTEXT

### A1. Ucel a cil

ModelPricer aktualne nabizi pouze jeden zpusob integrace — iframe embed s auto-resize skriptem
a domain whitelist. To je nedostatecne pro zakazniky, kteri provozuji e-shopy na platformach
jako Shopify nebo WooCommerce. Tito zakaznici ocekavaji nativni plugin, ktery:

- Se nainstaluje jednim klikem z marketplace dane platformy
- Nabizi vizualni konfiguraci primo v admin rozhrani e-shopu
- Podporuje nativni checkout flow (pridani do kosiku, platba pres standardni brany)
- Synchronizuje objednavky zpet do ModelPricer admin panelu

**Business value:**
- Snizeni bariery vstupu pro e-commerce zakazniky (nejvetsi segment)
- Konkurencni vyhoda — AutoQuote3D jiz nabizi one-line install pro Shopify a WordPress
- Zvyseni retence — hlubsi integrace = obtiznejsi migrace
- Otevreni distribucniho kanalu pres Shopify App Store a WordPress Plugin Repository
- Potencialni upsell na premium plany pro pokrocile integrace (checkout, sync)

### A2. Priorita, obtiznost, vlna

**Priorita P3:** Neni kriticka pro MVP, ale je strategicky dulezita pro rust. E-commerce
integrace jsou casto rozhodujici faktor pri vyberu SaaS reseni pro 3D tiskove firmy.

**Obtiznost High:**
- Kazda platforma (Shopify, WooCommerce) ma vlastni API, ekosystem a review proces
- Shopify vyzaduje App Bridge, OAuth flow a Shopify Partner registraci
- WooCommerce vyzaduje PHP plugin s Gutenberg blokem a shortcode podporou
- Checkout integrace vyzaduje API endpointy na strane ModelPricer (zavislost na S20)
- Testovani na ruznych verzich WordPress/WooCommerce/Shopify themes

**Vlna 4:** Vyzaduje stabilni widget (S11), funkcni objednavkovy system (S02) a idealne
Public API (S20). Nema smysl budovat pluginy pokud zakladni funkcnost neni spolehlivy.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove PRED S17:**
- **S01** (Bug Fixes) — stabilni zakladni funkcnost
- **S02** (Kontaktni formular & Objednavky) — funkcni objednavkovy flow
- **S11** (Widget Builder) — konfigurovatelny widget s embed kodem
- **S07** (Emailove notifikace) — pro potvrzeni objednavek z e-shopu

**Silne doporuceno:**
- **S20** (Public API) — pro checkout integraci a synchronizaci objednavek
- **S12** (Zakaznicky portal) — pro autentizaci zakazniku z e-shopu
- **S16** (Multi-language) — pro lokalizovane pluginy

**Zavisi na S17:**
- **S19** (CRM/Marketing) — e-commerce data obohacuji CRM a analytiku
- **S22** (Onboarding) — onboarding flow pro novou integraci

### A4. Soucasny stav v codebase

**Co uz existuje:**

1. **Widget embed system:**
   - `src/pages/widget/WidgetEmbed.jsx` — iframe runtime route (`/widget/embed/:publicId`)
   - `src/pages/widget/WidgetPreview.jsx` — nahled widgetu v admin panelu
   - PostMessage komunikace pro auto-resize (typ `MODELPRICER_WIDGET_HEIGHT`)
   - Domain whitelist konfigurace v branding storage

2. **Storage helpery:**
   - `src/utils/adminTenantStorage.js` — tenant-scoped localStorage (entrypoint)
   - `src/utils/adminBrandingWidgetStorage.js` — widget konfigurace a builder data
   - `src/utils/adminOrdersStorage.js` — objednavky s namespace `orders:v1`

3. **Pricing engine:**
   - `src/lib/pricing/pricingEngineV3.js` — kompletni cenovy engine
   - Pipeline: base (material + cas) -> fees -> markup -> minima -> rounding

4. **Routes:**
   - `src/Routes.jsx` — vsechny routy vcetne `/widget/embed/:publicId`

**Co CHYBI:**
- Zadny WordPress/WooCommerce plugin
- Zadna Shopify app
- Zadne npm balicky (`@modelpricer/react`, `@modelpricer/vue`)
- Zadny embed.js skript pro custom integrace
- Zadne API endpointy pro checkout/sync (zavislost na S20)
- Zadna dokumentace pro integratory
- Zadny webhook system

### A5. Referencni zdroje a konkurence

**Doporucene OSS knihovny:**

| Knihovna | Ucel | Licence |
|----------|------|---------|
| `@shopify/shopify-api` | Oficialni Shopify API klient | MIT |
| `@shopify/app-bridge-react` | React bridge pro embedded Shopify apps | MIT |
| `shopify-buy` (js-buy-sdk) | Storefront API klient | MIT |
| `@woocommerce/woocommerce-rest-api` | Oficialni WooCommerce REST API | MIT |
| `Medusa.js` | Headless commerce alternativa (self-hosted) | MIT |
| `Vendure` | GraphQL-first headless commerce | MIT |

**Konkurence:**
- **AutoQuote3D** — one-line install pro Shopify, WordPress, Webflow
- **Craftcloud** — Shopify app + WooCommerce plugin
- **3DPriceCalc** — standalone embed s limitovanou e-commerce integraci

**Best practices:**
- Shopify: App Block (Online Store 2.0) > ScriptTag (deprecated)
- WordPress: Gutenberg block > shortcode (moderni pristup)
- Obe platformy: OAuth > API key pro bezpecnejsi autentizaci
- Verze embed.js: CDN s verzovanim (`/v1/embed.js`, `/v2/embed.js`)

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `modelpricer:${tenantId}:ecommerce:v1`

```json
{
  "integrations": [
    {
      "id": "int_abc123",
      "platform": "shopify",
      "status": "active",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z",
      "config": {
        "shop_domain": "myshop.myshopify.com",
        "api_key": "encrypted:...",
        "widget_instance_id": "w_xyz",
        "auto_sync_orders": true,
        "product_type": "3d-print-service",
        "checkout_mode": "redirect"
      },
      "stats": {
        "orders_synced": 42,
        "last_sync_at": "2026-01-15T09:30:00Z"
      }
    },
    {
      "id": "int_def456",
      "platform": "woocommerce",
      "status": "active",
      "config": {
        "site_url": "https://myshop.com",
        "consumer_key": "encrypted:...",
        "consumer_secret": "encrypted:...",
        "widget_instance_id": "w_xyz",
        "auto_create_product": true,
        "checkout_mode": "woo_cart"
      }
    }
  ],
  "webhooks": [
    {
      "id": "wh_001",
      "integration_id": "int_abc123",
      "event": "order.created",
      "url": "https://myshop.com/webhooks/modelpricer",
      "secret": "encrypted:...",
      "active": true,
      "last_triggered_at": null,
      "failure_count": 0
    }
  ],
  "embed_configs": [
    {
      "id": "emb_001",
      "type": "js_sdk",
      "platform": "custom",
      "widget_instance_id": "w_xyz",
      "allowed_domains": ["myshop.com", "staging.myshop.com"],
      "config": {
        "theme": "light",
        "lang": "cs",
        "show_branding": true,
        "callback_url": "https://myshop.com/order-callback"
      }
    }
  ]
}
```

**Migrace:**
- V1: zakladni integracni schema (Shopify, WooCommerce, custom embed)
- V2: pridani webhook systemu a order sync stavu
- Pri migraci zachovat zpetnou kompatibilitu s existujicim widget embed

### B2. API kontrakty (endpointy)

**ModelPricer API (zavislost na S20):**

```
# E-commerce integrace
POST   /api/v1/integrations              # Vytvoreni nove integrace
GET    /api/v1/integrations              # Seznam integraci tenanta
GET    /api/v1/integrations/:id          # Detail integrace
PATCH  /api/v1/integrations/:id          # Aktualizace konfigurace
DELETE /api/v1/integrations/:id          # Smazani integrace

# Shopify specificky
POST   /api/v1/integrations/shopify/auth      # OAuth callback
POST   /api/v1/integrations/shopify/install   # App install webhook
POST   /api/v1/integrations/shopify/uninstall # App uninstall webhook

# WooCommerce specificky
POST   /api/v1/integrations/woocommerce/verify  # Overeni pripojeni

# Order sync
POST   /api/v1/orders/from-widget        # Widget odesle objednavku
GET    /api/v1/orders/:id/status          # Stav objednavky pro e-shop
POST   /api/v1/webhooks/test             # Test webhook doruceni

# Embed SDK
GET    /api/v1/embed/config/:publicId     # Konfigurace pro embed.js
```

**Request/Response priklady:**

```json
// POST /api/v1/orders/from-widget
// Request:
{
  "widget_id": "w_xyz",
  "platform": "shopify",
  "platform_order_id": "shopify_order_12345",
  "customer": {
    "email": "jan@example.com",
    "name": "Jan Novak"
  },
  "items": [
    {
      "model_file_url": "https://cdn.../model.stl",
      "model_name": "bracket_v2.stl",
      "material": "pla",
      "quality": "normal",
      "quantity": 3,
      "unit_price": 150.00,
      "total_price": 450.00,
      "config_snapshot": { ... }
    }
  ],
  "total": 450.00,
  "currency": "CZK"
}

// Response (201):
{
  "order_id": "ord_abc123",
  "status": "NEW",
  "created_at": "2026-01-15T10:00:00Z"
}
```

**Error kody:**
- `400` — Neplatny request (chybejici povinne pole)
- `401` — Neplatny API klic / OAuth token
- `403` — Pristup odepren (domain whitelist, tenant mismatch)
- `404` — Integrace/objednavka nenalezena
- `409` — Duplicitni objednavka (idempotency)
- `429` — Rate limit prekrocen
- `500` — Interni chyba serveru

### B3. Komponentni strom (React)

```
Admin UI (uvnitr AdminLayout):
  AdminIntegrations/
    IntegrationsPage.jsx              # Hlavni stranka /admin/integrations
      IntegrationsList.jsx            # Seznam existujicich integraci
        IntegrationCard.jsx           # Karta jedne integrace (stav, sync stats)
      AddIntegrationDialog.jsx        # Modal pro pridani nove integrace
        PlatformSelector.jsx          # Vyber platformy (Shopify/WooCommerce/Custom)
      IntegrationDetail.jsx           # Detail integrace
        ShopifyConfigPanel.jsx        # Shopify-specificke nastaveni
        WooCommerceConfigPanel.jsx    # WooCommerce-specificke nastaveni
        CustomEmbedConfigPanel.jsx    # Custom JS embed nastaveni
        WebhookManager.jsx           # Sprava webhooku
          WebhookRow.jsx             # Jeden webhook (URL, secret, stav, test button)
        SyncHistory.jsx              # Historie synchronizace objednavek
        EmbedCodeGenerator.jsx       # Generator embed kodu (HTML, React, Vue)
          CodePreview.jsx            # Syntax-highlighted nahled kodu

Widget SDK (externi npm balicky):
  @modelpricer/embed                   # Vanilla JS embed skript
    embed.js                           # Hlavni entry point (CDN)
    auto-resize.js                     # PostMessage auto-resize handler
    types.d.ts                         # TypeScript definice
  @modelpricer/react                   # React wrapper
    ModelPricerWidget.tsx              # React komponenta
    useModelPricer.ts                  # Hook pro programaticky pristup
  @modelpricer/vue                     # Vue wrapper
    ModelPricerWidget.vue              # Vue komponenta
```

### B4. Tenant storage namespace

**Primarni namespace:** `ecommerce:v1`
**Helper:** Novy soubor `src/utils/adminEcommerceStorage.js`

```javascript
// src/utils/adminEcommerceStorage.js
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS = 'ecommerce:v1';

export function getEcommerceConfig() {
  return readTenantJson(NS, { integrations: [], webhooks: [], embed_configs: [] });
}

export function saveEcommerceConfig(config) {
  writeTenantJson(NS, config);
}

export function getIntegrations() {
  const cfg = getEcommerceConfig();
  return cfg.integrations || [];
}

export function addIntegration(integration) {
  const cfg = getEcommerceConfig();
  cfg.integrations = [...(cfg.integrations || []), integration];
  saveEcommerceConfig(cfg);
  return integration;
}

export function updateIntegration(id, updates) {
  const cfg = getEcommerceConfig();
  cfg.integrations = (cfg.integrations || []).map(i =>
    i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
  );
  saveEcommerceConfig(cfg);
}

export function removeIntegration(id) {
  const cfg = getEcommerceConfig();
  cfg.integrations = (cfg.integrations || []).filter(i => i.id !== id);
  cfg.webhooks = (cfg.webhooks || []).filter(w => w.integration_id !== id);
  saveEcommerceConfig(cfg);
}
```

### B5. Widget integrace (postMessage)

**Stavajici zpravy:**
- `MODELPRICER_WIDGET_HEIGHT` — widget oznamuje svou vysku pro auto-resize

**Nove zpravy pro e-commerce integraci:**

```javascript
// Widget -> Parent (e-shop):
{
  type: 'MODELPRICER_ORDER_SUBMITTED',
  publicId: 'w_xyz',
  order: {
    items: [...],
    total: 450.00,
    currency: 'CZK',
    customer: { email: '...', name: '...' }
  }
}

{
  type: 'MODELPRICER_PRICE_CALCULATED',
  publicId: 'w_xyz',
  price: {
    total: 150.00,
    currency: 'CZK',
    breakdown: { material: 80, time: 50, fees: 20 }
  }
}

{
  type: 'MODELPRICER_ADD_TO_CART',
  publicId: 'w_xyz',
  item: {
    name: 'bracket_v2.stl',
    price: 150.00,
    quantity: 3,
    material: 'PLA',
    config_snapshot: { ... }
  }
}

// Parent (e-shop) -> Widget:
{
  type: 'MODELPRICER_SET_CONFIG',
  config: {
    lang: 'cs',
    theme: 'dark',
    currency: 'CZK'
  }
}

{
  type: 'MODELPRICER_SET_CUSTOMER',
  customer: {
    email: 'jan@example.com',
    name: 'Jan Novak'
  }
}
```

**Origin validace (P0 security):**
```javascript
// V embed.js a WidgetEmbed.jsx:
window.addEventListener('message', (event) => {
  // Overit origin proti domain whitelist
  const allowedOrigins = widget.config.allowed_domains || [];
  if (!allowedOrigins.some(d => event.origin.includes(d))) {
    console.warn('[ModelPricer] Blocked message from unauthorized origin:', event.origin);
    return;
  }
  // Zpracovat zpravu...
});
```

### B6. Pricing engine integrace

S17 PRIMO neprisahuje do `pricingEngineV3.js`. Pricing engine zustava beze zmeny.
E-commerce integrace vyuziva pricing engine **neprimo** pres widget:

1. Zakaznik na e-shopu otevre widget (iframe)
2. Widget nacte pricing config z tenant storage
3. Widget spusti `calculateOrderQuote()` z `pricingEngineV3.js`
4. Vysledna cena se posle zpet do e-shopu pres `postMessage`

**Budouci rozsirreni (S20):**
- API endpoint `/api/v1/quotes` bude volat `calculateOrderQuote()` server-side
- E-shop plugin muze volat API primo (bez iframe) pro server-side pricing

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-ecommerce` | Architektura, review celku, koordinace | Vsechny v scope | P0 |
| `mp-spec-ecom-shopify` | Shopify App (Liquid, App Bridge, OAuth) | `/plugins/shopify/*` | P1 |
| `mp-spec-ecom-woo` | WooCommerce plugin (PHP, Gutenberg) | `/plugins/woocommerce/*` | P1 |
| `mp-spec-ecom-api` | API endpointy pro sync, webhooks | `backend-local/routes/ecommerce.js` | P1 |
| `mp-mid-frontend-admin` | Admin UI (IntegrationsPage) | `src/pages/admin/AdminIntegrations.jsx` | P2 |
| `mp-spec-fe-forms` | Konfiguracni formulare | `*ConfigPanel.jsx`, `AddIntegrationDialog.jsx` | P2 |
| `mp-mid-frontend-widget` | PostMessage rozsireni, embed.js | `src/pages/widget/*`, `public/embed.js` | P1 |
| `mp-mid-storage-tenant` | Ecommerce storage helper | `src/utils/adminEcommerceStorage.js` | P1 |
| `mp-mid-security-app` | Origin validace, OAuth flow review | Security review vsech integraci | P0 |
| `mp-spec-security-gdpr` | GDPR compliance pro zakaznicka data z e-shopu | Datove toky | P1 |
| `mp-sr-docs` | Integracni dokumentace | `docs/integration/*` | P2 |
| `mp-spec-fe-routing` | Nove routy v Routes.jsx | `src/Routes.jsx` | P1 |

### C2. Implementacni kroky (poradi)

**Faze 1: Zaklad (tyden 1)**

1. **[PARALELNI]** Vytvorit `src/utils/adminEcommerceStorage.js` — storage helper
2. **[PARALELNI]** Rozsirit postMessage API v `src/pages/widget/WidgetEmbed.jsx`
   - Pridat `MODELPRICER_ORDER_SUBMITTED`, `MODELPRICER_ADD_TO_CART`
   - Pridat origin validaci proti domain whitelist
3. **[SEKVENCNI po 1]** Vytvorit `src/pages/admin/AdminIntegrations.jsx`
   - Zakladni UI: seznam integraci, pridani nove
4. **[SEKVENCNI po 3]** Pridat route `/admin/integrations` do `src/Routes.jsx`
5. **[SEKVENCNI po 3]** Pridat polozku do admin navigace v `src/pages/admin/AdminLayout.jsx`

**Faze 2: Embed SDK (tyden 1-2)**

6. **[PARALELNI]** Vytvorit `public/embed.js` — vanilla JS embed skript
   - Auto-detekce widget containeru (`<div data-modelpricer-widget="...">`)
   - Automaticke vytvoreni iframe
   - PostMessage bridge pro auto-resize
   - Callback API (`onPriceCalculated`, `onOrderSubmitted`, `onAddToCart`)
7. **[PARALELNI]** Vytvorit `EmbedCodeGenerator.jsx` — generator embed kodu v admin UI
   - HTML snippet, React snippet, Vue snippet
   - Kopirovani do schranky

**Faze 3: WordPress/WooCommerce (tyden 2-3)**

8. **[PARALELNI]** Vytvorit WordPress plugin `plugins/woocommerce/modelpricer-calculator/`
   - `modelpricer-calculator.php` — hlavni plugin soubor
   - Shortcode `[modelpricer]` s parametry (widget_id, width, height, lang)
   - Settings page v WP admin (Settings > ModelPricer)
   - Gutenberg block "ModelPricer Calculator"
9. **[SEKVENCNI po 8]** WooCommerce integrace
   - Custom product type "3D Print Service"
   - Add-to-cart hook pres postMessage bridge
   - Order sync zpet do ModelPricer

**Faze 4: Shopify (tyden 2-3)**

10. **[PARALELNI]** Vytvorit Shopify app `plugins/shopify/`
    - App Bridge setup + embedded app architektura
    - Theme App Extension (App Block pro Online Store 2.0)
    - Liquid template `blocks/modelpricer-calculator.liquid`
    - OAuth flow pro propojeni uctu
11. **[SEKVENCNI po 10]** Shopify checkout integrace
    - Draft Orders API pro pridani do kosiku
    - Webhook handlery (orders/create, app/uninstalled)

**Faze 5: Dokumentace a testovani (tyden 3-4)**

12. **[PARALELNI]** Integracni dokumentace
    - Getting Started guide
    - WordPress plugin manual
    - Shopify app manual
    - Custom embed guide (HTML, React, Vue, Angular)
    - API reference (odkaz na S20)
    - Webhook reference
13. **[PARALELNI]** Testovani
    - Unit testy pro storage helper a embed SDK
    - E2E testy: WordPress shortcode, Shopify App Block
    - Security testy: origin validace, XSS, CSRF

### C3. Kriticke rozhodovaci body

1. **Checkout mode:** Redirect vs. in-widget checkout?
   - **Doporuceni:** Redirect na e-shop checkout (jednodussi, vyuziva existujici platebni brany)
   - Widget pocita cenu -> postMessage ADD_TO_CART -> e-shop prida do kosiku -> standardni checkout

2. **Shopify distribuce:** Public App Store vs. Unlisted (Custom)?
   - **Doporuceni:** Zacit jako Custom app (rychlejsi approval), pote public listing
   - Public listing vyzaduje Shopify review proces (2-4 tydny)

3. **WordPress distribuce:** WordPress.org repo vs. stahovani z MP admin?
   - **Doporuceni:** Oboje — wordpress.org pro organicky reach, stahovani pro kontrolu

4. **SDK vs. jen iframe:** Vydavat npm balicky (@modelpricer/react)?
   - **Doporuceni:** Ano, ale az ve Fazi 2. MVP = embed.js + iframe. SDK pozdeji.

### C4. Testovaci strategie

**Unit testy:**
- `adminEcommerceStorage.js` — CRUD operace, migrace
- `embed.js` — auto-detection, iframe creation, postMessage handling
- PostMessage origin validace

**Integracni testy:**
- WordPress shortcode rendering (PHPUnit)
- Shopify App Block rendering (Shopify CLI test)
- PostMessage bridge (Widget <-> Parent page)
- Order sync flow (Widget -> API -> Admin Orders)

**E2E testy:**
- WordPress: nainstalovat plugin -> nastavit -> vlozit shortcode -> overit iframe
- Shopify: nainstalovat app -> pridat block -> overit iframe v theme preview
- Custom embed: vlozit embed.js na stranku -> overit auto-resize a callbacks

**Security testy:**
- Origin spoofing (pokus o postMessage z nepovolene domeny)
- XSS pres widget parametry (lang, theme injection)
- CSRF pri OAuth callback (Shopify state parameter)
- API key leakage v client-side kodu

### C5. Migrace existujicich dat

**Zadna migrace neni potreba** — S17 zavadi novou funkcnost, ktera nema predchozi data.

Jedina migrace se tyka **widget embed:**
- Existujici `WidgetEmbed.jsx` bude rozsiren o nove postMessage typy
- Zpetna kompatibilita: stavajici `MODELPRICER_WIDGET_HEIGHT` zprava zustava beze zmeny
- Nove zpravy (`ORDER_SUBMITTED`, `ADD_TO_CART`) jsou aditivni

---

## D. KVALITA

### D1. Security review body

**P0 — Kriticke:**
- **Origin validace** v postMessage handleru — MUSI overovat event.origin proti whitelist
  - Aktualne `WidgetEmbed.jsx` pouziva `'*'` jako target origin — MUSI se zmenit na
    konkretni origin e-shopu
- **OAuth flow** (Shopify) — state parameter pro CSRF ochranu, HTTPS only
- **API klice** — nesmi byt viditelne v client-side kodu (embed.js)
  - Pouzit `publicId` widgetu misto API klice pro identifikaci
- **Webhook secret** — HMAC-SHA256 overeni podpisu kazdeho webhooku
- **Input sanitizace** — vsechny parametry z e-shopu (product name, customer data) musi
  byt sanitizovany pred ulozenim

**P1 — Dulezite:**
- **Rate limiting** na API endpointy (zvlast `/api/v1/orders/from-widget`)
- **Domain whitelist enforcement** — embed.js nesmi fungovat na nepovolenych domenach
- **CSP hlavicky** — Content-Security-Policy pro iframe embedding
- **Encryption at rest** pro API klice a tokeny v localStorage (Variant A) / DB (Variant B)

### D2. Performance budget

| Metrika | Cil | Jak merit |
|---------|-----|-----------|
| `embed.js` velikost | < 5 KB gzipped | Webpack analyzer |
| Iframe load time | < 2s na 3G | Lighthouse |
| PostMessage latence | < 50ms | Performance.now() |
| Shopify App Block render | < 1s | Shopify Partner Dashboard metriky |
| WordPress shortcode render | < 100ms server-side | PHP profiler |

**embed.js optimalizace:**
- Zadne zavislosti (vanilla JS)
- Lazy load iframe az kdyz je v viewport (IntersectionObserver)
- Preconnect na `app.modelpricer.com` pro rychlejsi iframe load

### D3. Accessibility pozadavky

- **Iframe title:** `<iframe title="ModelPricer 3D Print Calculator" ...>`
- **Keyboard navigace:** Widget musi byt plne ovladatelny klavesnici
- **Screen reader:** `aria-label` na embed containeru
- **Focus management:** Pri otevreni modalniho dialogu v widget focus trap
- **Color contrast:** Min 4.5:1 pro text, 3:1 pro large text (WCAG AA)
- **Reduced motion:** Respektovat `prefers-reduced-motion`

### D4. Error handling a edge cases

**Embed.js:**
- Widget container neexistuje -> log warning, skip
- publicId neplatne -> zobrazit chybovou zpravu v kontejneru
- Iframe failed to load (CSP blokuje) -> fallback text s odkazem na prime URL
- PostMessage timeout -> retry 3x, pak log error

**Shopify App:**
- OAuth token expired -> redirect na re-auth
- Shop uninstalled -> cleanup webhook handler
- Theme nema App Block podporu -> fallback na ScriptTag

**WooCommerce Plugin:**
- WordPress verze < 5.8 (bez Gutenberg) -> fallback na shortcode only
- WooCommerce neni aktivni -> skryt WooCommerce-specificke nastaveni
- API klic neplatny -> admin notice s instrukcemi

**Obecne:**
- Network chyba pri sync objednavky -> retry s exponencialnim backoff
- Webhook delivery failed -> retry 3x, pak mark as failed, admin notifikace

### D5. i18n pozadavky

**Embed SDK:**
- `lang` parametr v embed kodu (`data-lang="cs"`)
- Podpora jazyku: cs, en, de, sk (dle S16)
- Fallback: en

**WordPress Plugin:**
- `.pot` soubor pro preklady (standard WordPress i18n)
- Admin stranky v jazyce WordPress instalace
- Widget v jazyce dle parametru nebo WP locale

**Shopify App:**
- Shopify App Extensions pouzivaji vlastni i18n system
- Admin UI v jazyce Shopify merchant uctu
- App Block label translations

**Texty k prelozeni (~40 retezcu):**
- Admin UI: nazvy integraci, statusy, chybove hlasky
- Embed.js: error messages, loading text
- WordPress: plugin description, settings labels
- Shopify: app listing, block labels

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

```javascript
// Feature flags v tenant storage
{
  "features": {
    "ecommerce_integrations": false,     // P0: zakladni integrace
    "shopify_app": false,                 // P1: Shopify
    "woocommerce_plugin": false,          // P1: WooCommerce
    "checkout_integration": false,        // P2: checkout flow (vyzaduje S20)
    "embed_sdk_npm": false,               // P3: npm balicky
    "webhook_system": false               // P2: webhook doruceni
  }
}
```

**Rollout plan:**
1. **Alpha (tyden 3):** Interni testovani embed.js + admin UI
2. **Beta (tyden 4):** 3-5 zakazniku testuje WooCommerce plugin
3. **Public (tyden 5-6):** WooCommerce plugin na wordpress.org
4. **Shopify (tyden 6-8):** Shopify app review + listing

### E2. Admin UI zmeny

**Nova stranka:** `/admin/integrations` — Admin > Integrace

**Navigace (AdminLayout.jsx):**
- Pridat polozku "Integrace" s ikonou (Plug, Link, nebo Globe)
- Umisteni: za "Widget Builder", pred "Analytics"

**Obsah stranky:**
1. **Prehled:** Pocet aktivnich integraci, posledni sync
2. **Seznam integraci:** Karty s platformou, stavem, akcemi
3. **Pridani nove:** Button -> modal s vyberem platformy
4. **Embed kody:** Tab s generovanymi embed kody pro ruzne platformy

### E3. Widget zmeny

**WidgetEmbed.jsx:**
- Novy `useEffect` pro registraci postMessage listeneru (prichozi zpravy z parent)
- Nove `postMessage` odesilatele pro ORDER_SUBMITTED, ADD_TO_CART, PRICE_CALCULATED
- Origin validace na prichozich zpravach

**embed.js (novy soubor):**
- Self-contained skript (< 5KB gzipped)
- Auto-detection: `document.querySelectorAll('[data-modelpricer-widget]')`
- Lazy iframe creation
- PostMessage bridge s typed API

### E4. Dokumentace pro uzivatele

**Struktura dokumentace (`docs/integration/`):**

1. `getting-started.md` — Co je ModelPricer, jak ziskat Widget ID a API klic
2. `embed-html.md` — Zakladni iframe embed
3. `embed-js-sdk.md` — Pouziti embed.js s callbacks
4. `wordpress.md` — Instalace a konfigurace WP pluginu
5. `woocommerce.md` — WooCommerce integrace s checkout flow
6. `shopify.md` — Shopify app instalace a konfigurace
7. `react.md` — @modelpricer/react npm balicek
8. `vue.md` — @modelpricer/vue npm balicek
9. `webhooks.md` — Dostupne webhooky, formaty, overeni podpisu
10. `troubleshooting.md` — FAQ a reseni beznych problemu

**Format:** MDX + staticke stranky (Docusaurus nebo VitePress), alternativne GitBook

### E5. Metriky uspechu (KPI)

| KPI | Cil (3 mesice) | Jak merit |
|-----|----------------|-----------|
| Pocet aktivnich integraci | 50+ | Admin analytics storage |
| WordPress plugin instalaci | 100+ | wordpress.org stats |
| Shopify app instalaci | 30+ | Shopify Partner Dashboard |
| Objednavky pres e-commerce | 20% vsech objednavek | Order source tracking |
| Embed.js loadovani | 1000+ denni | CDN analytics |
| Prumerny cas instalace | < 15 minut | Onboarding tracking |
| Chybovost webhook doruceni | < 1% | Webhook delivery logs |
| NPS integracni zkusenost | > 40 | Post-install survey |
