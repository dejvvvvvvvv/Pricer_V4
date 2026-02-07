# V3-S20: Public API a Developer Portal

> **Priorita:** P2 | **Obtiznost:** High | **Vlna:** 4
> **Zavislosti:** S1 (bug fixes), S2 (objednavky), S12 (autentizace), S15 (rozsirena cenotvorba), S21 (security)
> **Odhadovany rozsah:** ~40 souboru, 5000+ radku kodu, 3-4 tydny

---

## A. KONTEXT

### A1. Ucel a cil

Sekce 20 implementuje verejne REST API pro externi integrace s ModelPricer platformou.
Cil je umoznit tretim stranam (e-shopy, mobilni aplikace, automatizovane systemy, partneri)
pristupovat k funkcionalite ModelPriceru programaticky — upload 3D modelu, kalkulace cen,
vytvareni objednavek, sprava zakazniku a webhook notifikace.

**Business value:**
- Otevreni platformy pro externi integrace zvysuje adopci a retenci
- API-first pristup umoznuje headless pouziti (zakaznik si vytvori vlastni UI)
- Developer portal snizuje barieru vstupu pro vyvojare
- Webhook system umoznuje real-time notifikace do externich systemu (ERP, CRM)
- SDK knihovny (JS, Python, PHP) zrychluj integraci a snizuj support dotazy
- Sandbox prostredi umoznuje bezpecne testovani bez rizika pro produkci
- API metriky a logy poskytuj cennou analytiku o pouziti platformy

**Klicove deliverables:**
1. REST API server (Express/Hono) s versionovanymi endpointy (/v1/*)
2. API key management v admin panelu (vytvoreni, revokace, scopes, IP whitelist)
3. Rate limiting a throttling
4. OpenAPI/Swagger specifikace
5. Developer portal s interaktivni dokumentaci (Redoc/Swagger UI)
6. Webhook system (registrace, delivery, retry, HMAC podpisy)
7. SDK knihovny (@modelpricer/js, modelpricer-python, modelpricer-php)
8. Sandbox prostredi (oddelene od produkce)
9. API usage analytics v admin panelu

### A2. Priorita, obtiznost, vlna

**Priorita P2:** API neni kriticke pro zakladni fungování produktu (widget a admin panel
funguji samostatne), ale je klicove pro rust a enterprise zakazniky. Bez API nelze
realizovat e-commerce integrace (S17) ani pokrocile automatizace.

**Obtiznost High:** Vysoka slozitost z duvodu:
- Nutnost navrhnout stabilni API kontrakt ktery se bude tezko menit po vydani
- Bezpecnost je kriticka — spatne zabezpecene API je vektor utoku
- Rate limiting musi byt robustni a skalovatelny
- Webhook delivery musi byt spolehlivy (retry, dead letter queue)
- Dokumentace musi byt perfektni — je to "tvare" produktu pro vyvojare
- Sandbox prostredi vyzaduje duplikaci datove vrstvy
- SDK knihovny ve 3 jazycich = trojnasobna udrzba

**Vlna 4:** Zavisi na hotovem backendu (auth, objednavky, pricing engine) a security
infrastrukture (S21). API je "posledni vrstva" ktera exponuje existujici funkcionalitu.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred S20:**
- **S1** (Bug Fixes & Reaktivita) — stabilni pricing engine je zaklad API endpointu
- **S2** (Kontaktni formular & Objednavky) — order management endpointy
- **S12** (Zakaznicky portal / Autentizace) — auth system pro API keys
- **S15** (Rozsirene cenotvorby) — kompletni pricing rules pro /quotes endpoint
- **S21** (Security) — RBAC, encryption, audit logging

**Sekce ktere zavisi na S20:**
- **S17** (E-commerce pluginy) — WooCommerce/Shopify integrace pres API
- **S19** (CRM & Analytika) — API usage data pro analytics dashboards

**Paralelne:**
- S20 a S22 (Onboarding) nemaji primou zavislost — mohou bezet paralelne

### A4. Soucasny stav v codebase

**Co uz existuje:**
- Pricing engine: `/src/lib/pricing/pricingEngineV3.js` — kompletni kalkulacni logika
  (funkce `calculateOrderQuote`, `evaluateConditions`, normalizery)
- Tenant storage: `/src/utils/adminTenantStorage.js` — `getTenantId()`, `readTenantJson()`,
  `writeTenantJson()`, `appendTenantLog()` — zakladni CRUD pro localStorage
- Storage helpery: `/src/utils/adminPricingStorage.js` (namespace `pricing:v3`),
  `/src/utils/adminFeesStorage.js` (namespace `fees:v3`),
  `/src/utils/adminOrdersStorage.js`, `/src/utils/adminBrandingWidgetStorage.js`
- Admin stranky: `/src/pages/admin/AdminPricing.jsx`, `AdminFees.jsx`, `AdminOrders.jsx`, atd.
- Routes: `/src/Routes.jsx` — vsechny admin a public routes
- Auth context: `/src/context/AuthContext.jsx`
- Config: `/src/config/api.js`

**Co chybi (nutne vytvorit):**
- Backend API server (Express/Hono s REST endpointy)
- API key management system (generovani, hashovani, validace)
- Rate limiting middleware
- OpenAPI specifikace (YAML)
- Developer portal stranka
- Webhook delivery system
- SDK knihovny
- Admin UI pro API management (`/admin/api`)
- Storage helper: `/src/utils/adminApiKeysStorage.js`

### A5. Referencni zdroje a konkurence

**Doporucene OSS knihovny (ze zdrojoveho dokumentu):**

| Knihovna | Stars | Ucel |
|----------|-------|------|
| **Swagger/OpenAPI** (swagger-ui) | 26k+ | API dokumentace standard |
| **swagger-jsdoc** | 1.7k | Generovani OpenAPI z JSDoc |
| **Redoc** | 23k+ | Alternativni API docs renderer |
| **Stoplight Elements** | 1.5k | API docs komponenty |
| **express-rate-limit** | 3k+ | Rate limiting middleware |
| **helmet** | 10k+ | Security headers |
| **Hono** | 20k+ | Ultra-fast web framework |
| **Fastify** | 32k+ | Fast Node.js framework |

**Doporuceny stack:** `OpenAPI` + `Redoc` + `express-rate-limit`

**Konkurencni reseni:**
- **Stripe API** — zlaty standard pro API design, dokumentaci i SDK
- **Twilio** — vynikajici developer experience, sandbox mode
- **AutoQuote3D** — konkurent, omezene API, zadny developer portal
- **Shapeways API** — 3D printing API reference, ale zastaraly design

**Best practices:**
- Consistentni JSON envelope (`{success, data, meta, error}`)
- Pagination pres cursor-based pristup (ne offset, ten nescale)
- Idempotency keys pro POST requesty
- Versionovani pres URL prefix (`/v1/`, `/v2/`)
- HMAC-SHA256 podpisy pro webhooky

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `api-keys:v1` (novy storage helper `adminApiKeysStorage.js`)

**localStorage schema pro API klice:**
```json
{
  "schema_version": 1,
  "keys": [
    {
      "id": "ak_uuid-v4",
      "name": "E-shop integrace",
      "prefix": "mp_live_",
      "key_hash": "sha256_hash_of_full_key",
      "key_preview": "mp_live_xxxx...xxxx",
      "type": "live",
      "scopes": ["models:read", "models:write", "quotes:read", "quotes:write"],
      "ip_whitelist": ["192.168.1.0/24"],
      "rate_limit": 100,
      "expires_at": null,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "last_used_at": "2024-01-16T08:00:00Z",
      "usage_count": 42
    }
  ],
  "webhooks": [
    {
      "id": "wh_uuid-v4",
      "url": "https://example.com/webhooks/modelpricer",
      "events": ["order.created", "order.updated", "quote.created"],
      "secret": "whsec_xxxxxxxxxxxxxxxx",
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "last_delivery_at": null,
      "failure_count": 0
    }
  ],
  "usage_logs": [],
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**localStorage klic:** `modelpricer:${tenantId}:api-keys:v1`

**Budouci databazovy model (PostgreSQL):**
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(64) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('live', 'test')),
  scopes TEXT[] NOT NULL DEFAULT '{}',
  ip_whitelist INET[],
  rate_limit INTEGER DEFAULT 100,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  usage_count BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_body JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_logs_key_created ON api_logs(api_key_id, created_at);
CREATE INDEX idx_api_logs_tenant_created ON api_logs(tenant_id, created_at);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  url VARCHAR(2000) NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret VARCHAR(64) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  failure_count INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_tenant ON webhooks(tenant_id);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempt INTEGER DEFAULT 1,
  delivered_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending'
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at);
```

### B2. API kontrakty (endpointy)

**Base URL:** `https://api.modelpricer.com/v1` (produkce)
**Sandbox URL:** `https://api.sandbox.modelpricer.com/v1`

**Autentizace:** Bearer token
```
Authorization: Bearer mp_live_xxxxxxxxxxxxxxxxxxxx
```

**Response envelope:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z",
    "pagination": {
      "cursor": "cur_xyz",
      "has_more": true,
      "total": 42
    }
  }
}
```

**Error envelope:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid file format",
    "details": {
      "field": "file",
      "allowed": [".stl", ".obj", ".3mf"]
    }
  }
}
```

**Endpointy — kompletni seznam:**

| Method | Endpoint | Popis | Scopes |
|--------|----------|-------|--------|
| POST | /models/upload | Upload 3D modelu (multipart) | models:write |
| GET | /models/{id} | Detail modelu | models:read |
| DELETE | /models/{id} | Smazani modelu | models:write |
| GET | /models/{id}/analysis | Analyza modelu (rozmery, objem) | models:read |
| POST | /quotes | Vytvoreni cenove nabidky | quotes:write |
| GET | /quotes/{id} | Detail nabidky | quotes:read |
| GET | /quotes | Seznam nabidek (s filtraci) | quotes:read |
| POST | /orders | Vytvoreni objednavky | orders:write |
| GET | /orders/{id} | Detail objednavky | orders:read |
| GET | /orders | Seznam objednavek | orders:read |
| PATCH | /orders/{id} | Aktualizace objednavky (status) | orders:write |
| GET | /materials | Seznam dostupnych materialu | models:read |
| GET | /materials/{id} | Detail materialu | models:read |
| GET | /presets | Seznam presetu | models:read |
| GET | /presets/{id} | Detail presetu | models:read |
| GET | /shipping-methods | Dopravni metody | orders:read |
| POST | /shipping/calculate | Kalkulace dopravy | orders:read |
| GET | /customers | Seznam zakazniku | customers:read |
| GET | /customers/{id} | Detail zakaznika | customers:read |
| POST | /customers | Vytvoreni zakaznika | customers:write |
| PATCH | /customers/{id} | Aktualizace zakaznika | customers:write |
| GET | /webhooks | Seznam webhooku | webhooks:manage |
| POST | /webhooks | Registrace webhooku | webhooks:manage |
| DELETE | /webhooks/{id} | Smazani webhooku | webhooks:manage |

**Rate limiting hlavicky:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312260
```

**HTTP status kody:**
- 200 — OK
- 201 — Created (POST)
- 400 — Bad Request (validacni chyba)
- 401 — Unauthorized (chybejici/neplatny API klic)
- 403 — Forbidden (nedostatecne scopes)
- 404 — Not Found
- 409 — Conflict (duplicitni resource)
- 429 — Too Many Requests (rate limit)
- 500 — Internal Server Error

**Webhook events:**
- `order.created` — nova objednavka
- `order.updated` — zmena stavu objednavky
- `order.completed` — objednavka dokoncena
- `order.cancelled` — objednavka zrusena
- `quote.created` — nova cenova nabidka
- `quote.expired` — nabidka expirovala
- `model.processed` — model zpracovan (analyza hotova)

**Webhook payload:**
```json
{
  "id": "evt_abc123",
  "type": "order.created",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "order": { ... }
  }
}
```

**Webhook HMAC overeni:**
```
X-ModelPricer-Signature: sha256=hex_encoded_hmac
```

### B3. Komponentni strom (React)

```
AdminApi (nova stranka /admin/api)
  ├── ApiOverview
  │   ├── ApiUsageChart (graf volani v case — Recharts)
  │   ├── ApiStatCards (celkova volani, chybovost, prumerna odezva)
  │   └── TopEndpointsTable
  ├── ApiKeysSection
  │   ├── ApiKeysList
  │   │   └── ApiKeyRow (nazev, typ, preview, scopes, akce)
  │   ├── CreateApiKeyModal
  │   │   ├── KeyNameInput
  │   │   ├── KeyTypeSelector (live/test)
  │   │   ├── ScopeSelector (checkboxy pro scopes)
  │   │   ├── IpWhitelistInput
  │   │   └── ExpirationPicker
  │   ├── ApiKeyDetailModal (zobrazeni noveho klice — jednorazove)
  │   └── RevokeKeyConfirm
  ├── WebhooksSection
  │   ├── WebhooksList
  │   │   └── WebhookRow (url, events, status, failure count)
  │   ├── CreateWebhookModal
  │   │   ├── WebhookUrlInput
  │   │   ├── EventSelector (checkboxy pro event typy)
  │   │   └── TestWebhookButton
  │   └── WebhookDeliveryLog
  ├── ApiDocsLink (odkaz na developer portal)
  └── SandboxToggle (prepinac live/sandbox prostredi)
```

**Developer Portal (samostatna stranka /developers):**
```
DeveloperPortal
  ├── DocsNavigation (sidebar)
  ├── GettingStartedGuide
  ├── ApiReferenceRedoc (Redoc embed)
  ├── WebhookGuide
  ├── SdkExamples
  │   ├── JavaScriptExample
  │   ├── PythonExample
  │   └── PhpExample
  ├── ChangelogPage
  └── StatusPage
```

### B4. Tenant storage namespace

**Namespace:** `api-keys:v1`
**Helper:** `/src/utils/adminApiKeysStorage.js` (novy soubor)
**Pattern:** `modelpricer:${tenantId}:api-keys:v1`

**Exporty helperu:**
```javascript
// adminApiKeysStorage.js
export function loadApiKeysConfig()       // nacte cely config (keys, webhooks, logs)
export function saveApiKeysConfig(config)  // ulozi cely config
export function createApiKey(params)       // vytvori novy klic, vrati plaintext jednorazove
export function revokeApiKey(keyId)        // deaktivuje klic
export function regenerateApiKey(keyId)    // zrusi stary, vytvori novy
export function createWebhook(params)      // registruje webhook
export function deleteWebhook(webhookId)   // smaze webhook
export function logApiUsage(entry)         // zaloguje API volani
export function getApiUsageStats(period)   // vrati agregovanou statistiku
export function getDefaultApiKeysConfig()  // defaultni prazdna konfigurace
```

### B5. Widget integrace (postMessage)

API zmeny nemaji primy dopad na widget. Widget zustava nezmeneny.

Neprimne vazby:
- Pokud externi system pres API zmeni material/preset, widget pri dalsim renderovani
  tuto zmenu reflektuje (protoze cte z tenant storage)
- Webhook `quote.created` muze byt triggerovan i z widgetu (pokud widget posle quote)

**PostMessage schema (pro budouci headless widget pres API):**
```json
{
  "type": "MODELPRICER_API_QUOTE_UPDATE",
  "payload": {
    "quote_id": "quo_xyz",
    "total": 750.00,
    "currency": "CZK"
  }
}
```

### B6. Pricing engine integrace

API endpoint `/v1/quotes` primo volá `calculateOrderQuote()` z `/src/lib/pricing/pricingEngineV3.js`.

**Flow:**
1. API prijme POST /v1/quotes s parametry (model_id, material_id, quantity, atd.)
2. Backend nacte `pricingConfig` z tenant storage (`pricing:v3`)
3. Backend nacte `feesConfig` z tenant storage (`fees:v3`)
4. Zavola `calculateOrderQuote({uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections})`
5. Vysledek transformuje do API response formatu
6. Ulozi quote do storage a vrati klientovi

**Kriticke:** API MUSI pouzivat STEJNY pricing engine jako widget — nesmime mit 2 ruzne
kalkulace. Proto pricing engine zustava v `/src/lib/pricing/pricingEngineV3.js` a backend
ho importuje primo.

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-backend` | Architektura API serveru, review endpointu | Vse v `/backend-local/` | P0 |
| `mp-mid-backend-api` | Implementace REST endpointu | `/backend-local/routes/api/v1/*.js` | P0 |
| `mp-spec-be-auth` | API key validace, scope checking | `/backend-local/middleware/apiAuth.js` | P0 |
| `mp-spec-be-webhooks` | Webhook delivery system | `/backend-local/services/webhookService.js` | P1 |
| `mp-mid-frontend-admin` | Admin UI pro API management | `/src/pages/admin/AdminApi.jsx` | P1 |
| `mp-spec-fe-forms` | Formulare pro API key vytvoreni, webhook registraci | Modaly v AdminApi | P1 |
| `mp-mid-storage-tenant` | Storage helper adminApiKeysStorage.js | `/src/utils/adminApiKeysStorage.js` | P0 |
| `mp-spec-storage-migration` | Migrace dat pri upgradu schema | Migration v storage helper | P2 |
| `mp-sr-security` | Security review celeho API | Vsechny API soubory | P0 |
| `mp-spec-security-api-keys` | Hashovani klicu, scope enforcement | Auth middleware | P0 |
| `mp-spec-security-injection` | Input validace, sanitizace | Validacni middleware | P0 |
| `mp-spec-docs-api` | OpenAPI spec, developer portal | `/docs/api/openapi.yaml`, portal stranky | P1 |
| `mp-spec-test-api` | API integration testy | `/tests/api/*.test.js` | P1 |
| `mp-mid-infra-build` | Rate limiting, caching, performance | Middleware | P1 |
| `mp-spec-fe-routing` | Nova route /admin/api v Routes.jsx | `/src/Routes.jsx` | P0 |

### C2. Implementacni kroky (poradi)

**Faze 1: Zaklady (tyden 1)**
1. **Vytvorit storage helper** `adminApiKeysStorage.js` (namespace `api-keys:v1`)
   - Zavislosti: zadne (muze bezet paralelne s 2, 3)
2. **Navrhnout OpenAPI specifikaci** (`/docs/api/openapi.yaml`)
   - Zavislosti: zadne
3. **Implementovat API auth middleware** (`/backend-local/middleware/apiAuth.js`)
   - API key validace, scope checking, tenant resoluce z klice
   - Zavislosti: 1 (storage helper)
4. **Implementovat rate limiting** (`/backend-local/middleware/rateLimit.js`)
   - express-rate-limit + custom storage adapter
   - Zavislosti: 3 (auth middleware)

**Faze 2: Endpointy (tyden 2)**
5. **Models endpointy** (POST /models/upload, GET /models/{id}, DELETE, GET analysis)
   - Zavislosti: 3, 4
6. **Quotes endpointy** (POST /quotes, GET /quotes/{id}, GET /quotes)
   - Integrace s pricingEngineV3.js
   - Zavislosti: 3, 4, 5
7. **Orders endpointy** (POST, GET, PATCH)
   - Zavislosti: 3, 4, 6
8. **Materials, Presets, Shipping endpointy** (GET only)
   - Zavislosti: 3, 4
9. **Customers endpointy** (GET, POST, PATCH)
   - Zavislosti: 3, 4

Kroky 5-9 mohou bezet paralelne (ruzni agenti).

**Faze 3: Webhooks & Admin UI (tyden 3)**
10. **Webhook system** (registrace, HMAC podpisy, delivery, retry)
    - Zavislosti: 3 (auth), 7 (orders — pro event triggering)
11. **Admin UI — ApiKeysSection** (seznam klicu, vytvoreni, revokace)
    - Zavislosti: 1 (storage helper)
12. **Admin UI — WebhooksSection** (seznam, registrace, test, delivery log)
    - Zavislosti: 1, 10
13. **Admin UI — ApiOverview** (usage chart, stat karty)
    - Zavislosti: 1

Kroky 11-13 mohou bezet paralelne.

**Faze 4: Developer Portal & SDK (tyden 4)**
14. **Developer portal stranka** (/developers)
    - Redoc embed pro interaktivni docs
    - Zavislosti: 2 (OpenAPI spec)
15. **SDK — JavaScript** (@modelpricer/js)
    - Zavislosti: 5-9 (finalni API kontrakty)
16. **SDK — Python** (modelpricer-python)
    - Zavislosti: 15 (paralelne s JS SDK design)
17. **SDK — PHP** (modelpricer/modelpricer-php)
    - Zavislosti: 15

Kroky 15-17 mohou bezet paralelne.

18. **Integration testy**
    - Zavislosti: vsechny predchozi
19. **Security audit**
    - Zavislosti: vsechny predchozi

### C3. Kriticke rozhodovaci body

1. **Express vs. Hono vs. Fastify** pro API server
   - Doporuceni: Express (uz pouzivame v backendu) + express-rate-limit
   - Pokud performance pozadavky rostou: migrace na Hono

2. **API key format a hashovani**
   - Format: `mp_{type}_{24_random_chars}` (napr. `mp_live_a1b2c3d4e5f6g7h8i9j0k1l2`)
   - Hash: SHA-256 (rychly lookup) + porovnani s ulozenyv hashem
   - Prefix `mp_live_` nebo `mp_test_` indikuje typ

3. **Cursor vs. offset pagination**
   - Doporuceni: cursor-based (skaluje lepe, konzistentni pri zmenach dat)

4. **Sandbox implementace**
   - Varianta A: uplne oddelena databaze (bezpecnejsi, ale drazsi)
   - Varianta B: flag `is_sandbox` v tabulkach (jednodussi, mensi izolace)
   - Doporuceni: Varianta B pro zacatek, migrace na A pri rust

5. **Webhook retry strategie**
   - Exponential backoff: 1min, 5min, 30min, 2h, 12h (5 pokusu)
   - Po 5 neuspesnych: webhook deaktivovan, email adminu

### C4. Testovaci strategie

**Unit testy:**
- API key generovani a hashovani
- Scope validace
- Rate limiting logika
- Webhook HMAC podpisy
- Request validace (Zod schemy)

**Integration testy:**
- Kazdy endpoint (happy path + error cases)
- Auth flow (validni klic, neplatny klic, expirovany, neaktivni)
- Rate limiting (prekroceni limitu)
- Webhook delivery (uspesny, chybny, retry)
- Pagination (cursor-based)

**E2E testy:**
- Kompletni flow: vytvor API klic -> upload model -> vytvor quote -> vytvor order
- Webhook: registrace -> trigger event -> overeni delivery
- Admin UI: vytvoreni klice, revokace, statistiky

**Nastroje:** Vitest (unit), Supertest (API integration), Playwright (E2E admin UI)

### C5. Migrace existujicich dat

**Migrace neni potreba** — S20 zavadi kompletne novy subsystem.

Pri prvnim pristupu na `/admin/api` se vytvori defaultni prazdna konfigurace:
```javascript
{
  schema_version: 1,
  keys: [],
  webhooks: [],
  usage_logs: [],
  updated_at: new Date().toISOString()
}
```

**Budouci migrace** (schema_version 1 -> 2):
- Pokud se pridaji nove scopes, existujici klice je dostanou automaticky
- Pokud se zmeni format klice, stare klice zustanou funkci (backwards compatible)

---

## D. KVALITA

### D1. Security review body

**P0 — Kriticke:**
- [ ] API klice nikdy v plaintextu v DB/storage (pouze hash + preview)
- [ ] Rate limiting na vsech endpointech (vcetne auth)
- [ ] Input validace (Zod) na vsech POST/PATCH endpointech
- [ ] SQL injection prevence (ORM/parametrizovane dotazy)
- [ ] XSS prevence v API responses (Content-Type: application/json)
- [ ] CORS konfigurace (whitelist povolene domeny)
- [ ] Helmet.js hlavicky na API serveru
- [ ] API klic se zobrazi jednorazove pri vytvoreni (pak jen hash)
- [ ] Webhook secret nikdy v response (jen pri vytvoreni)
- [ ] HMAC-SHA256 overeni webhooku (prevence spoofing)
- [ ] Scope enforcement na kazdem endpointu
- [ ] IP whitelist enforcement (pokud nastaveno)
- [ ] Tenant izolace — API klic pristupuje jen k datum sveho tenanta
- [ ] File upload validace (MIME type, velikost, rozsireni)
- [ ] No sensitive data in URL query parameters (API keys only in headers)

**P1 — Dulezite:**
- [ ] Audit log pro vsechny API operace (kdo, kdy, co)
- [ ] Brute-force ochrana na API key validaci
- [ ] Request body size limit (1MB default, 50MB pro upload)
- [ ] Timeout na API requesty (30s default)
- [ ] Redakce citlivych dat v logech (API klice, emaily)

### D2. Performance budget

| Metrika | Target | Mereni |
|---------|--------|--------|
| API response time (p50) | < 100ms | APM (Sentry/DataDog) |
| API response time (p95) | < 500ms | APM |
| API response time (p99) | < 2000ms | APM |
| File upload (50MB STL) | < 10s | Load test |
| Quote calculation | < 200ms | Unit benchmark |
| Rate limit check | < 5ms | Middleware benchmark |
| Webhook delivery | < 5s | Delivery log |
| Concurrent connections | 100+ | Load test (k6/artillery) |
| API docs page load | < 3s | Lighthouse |

### D3. Accessibility pozadavky

**Admin UI (AdminApi stranka):**
- WCAG 2.1 AA compliant
- Vsechny interaktivni prvky maji aria-label
- Keyboard navigace (Tab, Enter, Escape pro modaly)
- Screen reader kompatibilni tabulky (role, headers)
- Color contrast minimalne 4.5:1
- Focus indikatory viditelne

**Developer portal:**
- Responsivni design (mobil, tablet, desktop)
- Code examples maji syntax highlighting s dostatecnym kontrastem
- Navigace pristupna klavesnici
- Copy-to-clipboard tlacitka maji aria feedback

### D4. Error handling a edge cases

**API error handling:**
- Vsechny errory vraci JSON envelope `{success: false, error: {code, message, details}}`
- Neznamy endpoint: 404 s napovedu (napr. "Did you mean /v1/models?")
- Nevalidni JSON body: 400 s detailni chybou (radek/sloupec)
- Prilis velky upload: 413 Payload Too Large
- Server error: 500 s request_id pro debugging (bez stack trace!)
- Rate limited: 429 s Retry-After hlavickou

**Edge cases:**
- API klic expirovany behem requestu -> 401 s jasnou zpravou
- Webhook URL nedostupny -> retry s exponential backoff
- Concurrent API key revokace -> idempotentni operace
- Upload zruseny uprostred -> cleanup temp souboru
- Sandbox klic na produkci -> 401 "Sandbox key used against production"
- Prazdny API klic -> 401 (ne 400, aby se neodlisoval od neplatneho)

### D5. i18n pozadavky

**API responses:** Anglicky (API je mezinarodni interface)

**Admin UI (AdminApi):**
- Cestina (primarni) + Anglictina
- Klice v i18n souboru: `admin.api.*`
- Preklad: nazvy sekci, tlacitka, chybove hlasky, tooltipy

**Developer portal:**
- Anglicky (primarni) — vyvojari ocekavaji anglicky
- V budoucnu: cestina jako druhy jazyk

**Error messages:**
- API errory vzdy anglicky (strojove zpracovatelne kody)
- Admin UI chyby lokalizovane

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flag:** `FEATURE_PUBLIC_API` (v tenant settings)

**Postupny rollout:**
1. **Alpha** (tyden 1-2): Interni testovani, zadni externi uzivatele
   - API dostupne jen s interni test klici
   - Developer portal skryty za `/developers?beta=true`
2. **Beta** (tyden 3-4): Pozvani vyvojari (early adopters)
   - 10-20 uzivatelu, manualni registrace
   - Feedback formulare v developer portalu
   - Omezeny rate limit (50 req/min)
3. **GA** (tyden 5+): Verejne dostupne
   - Plny rate limit dle tarifu
   - SDK publikovane na npm/PyPI/Packagist
   - Changelog a status page aktivni

**Tarif-based limity:**
| Tarif | API klice | Rate limit | Webhooks | Sandbox |
|-------|-----------|------------|----------|---------|
| Free | 1 test | 10 req/min | 0 | Ano |
| Starter | 2 (1 live, 1 test) | 50 req/min | 2 | Ano |
| Professional | 5 | 100 req/min | 10 | Ano |
| Enterprise | Neomezeno | 500 req/min | Neomezeno | Ano |

### E2. Admin UI zmeny

**Nova stranka:** `/admin/api` (AdminApi.jsx)

**Zmeny v AdminLayout.jsx:**
- Pridani nove nav polozky: `{ path: '/admin/api', label: t('admin.api'), icon: 'Code2' }`
- Umisteni: za "Widget" a pred "Analytics"

**Zmeny v Routes.jsx:**
- Import: `import AdminApi from './pages/admin/AdminApi';`
- Route: `<Route path="api" element={<AdminApi />} />`
- Route: `<Route path="api/*" element={<AdminApi />} />` (pro sub-tabs)

**Admin Dashboard (AdminDashboard.jsx):**
- Novy widget: "API Usage" (posledni 7 dni, mini graf)
- Quick action: "Manage API Keys"

### E3. Widget zmeny

**Zadne prime zmeny widgetu.** Widget neni ovlivnen zavedenim API.

Neprimne: API muze menit tenant konfiguraci (materialy, ceny, presety) a widget
tyto zmeny reflektuje pri dalsim renderovani.

### E4. Dokumentace pro uzivatele

**Developer portal struktura:**
```
/developers
  /getting-started        — Quick start guide (5 min)
  /authentication         — API klice, scopes, sandbox
  /api-reference          — Interaktivni Redoc/Swagger
  /guides
    /upload-model          — Kompletni flow uploadu
    /calculate-price       — Jak vypocitat cenu
    /create-order          — Objednavkovy flow
    /webhooks              — Webhook handling guide
    /error-handling        — Error kody a best practices
    /pagination            — Cursor pagination guide
  /sdks
    /javascript            — npm install @modelpricer/js
    /python                — pip install modelpricer
    /php                   — composer require modelpricer/modelpricer-php
  /changelog               — Verze API, breaking changes
  /status                  — System status, planovana udrzba
```

**In-app help:**
- Tooltip u "API" nav polozky: "Spravujte API klice pro externi integrace"
- Empty state: "Zatim nemate zadne API klice. Vytvorte prvni klic pro pristup k API."
- Link na developer portal z kazde sekce AdminApi

### E5. Metriky uspechu (KPI)

| KPI | Target (3 mesice) | Mereni |
|-----|-------------------|--------|
| Pocet aktivnich API klicu | 50+ | Storage analytics |
| Denni API volani | 1000+ | API logs |
| Pocet webhook registraci | 20+ | Storage analytics |
| Webhook delivery success rate | > 99% | Delivery logs |
| Prumerna API response time | < 200ms | APM |
| Developer portal navstevnost | 500+ unique/mesic | Plausible/Umami |
| SDK stahnuti (npm) | 100+ download/mesic | npm stats |
| Support tickets o API | < 10/mesic | Support system |
| API chybovost (5xx) | < 0.1% | API logs |
| Time to first API call (od registrace) | < 30 min | Onboarding analytics |
