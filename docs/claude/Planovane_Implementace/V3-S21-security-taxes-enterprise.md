# V3-S21: Security, Dane a Enterprise

> **Priorita:** P2 | **Obtiznost:** High | **Vlna:** 4
> **Zavislosti:** S1 (bug fixes), S2 (objednavky), S12 (autentizace), S13 (dokumenty/faktury)
> **Odhadovany rozsah:** ~35 souboru, 4500+ radku kodu, 3-4 tydny

---

## A. KONTEXT

### A1. Ucel a cil

Sekce 21 zastresi tri klicove oblasti pro enterprise-ready produkt:

1. **Danovy management (DPH/VAT)** — sprava danovych sazeb, reverse charge pro B2B
   v EU, fakturacni udaje firmy, VIES API integrace pro validaci DIC
2. **Kreditovy system** — zakaznici si predplati kredit a objednavaji z zustatku
   (vhodne pro opakovane B2B zakazniky)
3. **Bezpecnost a enterprise standardy** — GDPR compliance, custom domeny pro widget,
   sifrovani, audit logging, SLA, disaster recovery, budouci certifikace (SOC 2, ISO 27001)

**Business value:**
- DPH management je NUTNOST pro prodej v EU — bez nej nelze legalne prodavat
- Reverse charge snizuje danove zatez pro B2B zakazniky z jine EU zeme
- Kreditovy system zvysuje retenci a prumernou hodnotu zakaznika (CLV)
- GDPR compliance je legalni povinnost pro zpracovani osobnich udaju v EU
- Custom domeny zvysuji profesionalitu a duveryhodnost (zakaznik nema iframe)
- SLA a bezpecnostni certifikace jsou vstupni pozadavek pro enterprise zakazniky
- Audit logging je nutny pro compliance a debugging

**Klicove deliverables:**
1. Admin stranka pro spravu danovych sazeb (DPH/VAT)
2. VIES API integrace pro validaci EU DIC
3. Reverse charge logika v pricing engine
4. Fakturacni udaje firmy v admin nastaveni
5. Kreditovy system (zustatek, dobijeni, platba, historie)
6. Custom domeny pro widget (DNS verifikace, SSL)
7. GDPR nastroje (export dat, smazani uctu, anonymizace)
8. Audit logging system
9. SLA monitoring a status page
10. Bezpecnostni hardening (HSTS, CSP, CORS, rate limiting na auth)

### A2. Priorita, obtiznost, vlna

**Priorita P2:** Produkt funguje i bez dani (zakaznik si je spocita sam), ale pro
profesionalni pouziti (B2B, EU prodej) je DPH management nezbytny. Enterprise
features (SSO, audit, SLA) jsou potrebne pro velke zakazniky.

**Obtiznost High:** Vysoka slozitost z duvodu:
- Danove zakony se lisi po zemich a casto se meni
- VIES API byva nespolehlivy (timeouty, vypadky) — nutny fallback
- Kreditovy system musi byt 100% konzistentni (financni operace)
- GDPR implementace je pravne slozita (prava subjektu, retencni politiky)
- Custom domeny vyzaduji DNS management a automaticky SSL (Let's Encrypt)
- Audit logging nesmi byt zmenitelny (append-only, integrity)
- Kazda chyba v bezpecnosti je potencialne katastrofalni

**Vlna 4:** Zavisi na hotovem auth systemu (S12), objednavkach (S2) a generovani
dokumentu (S13 — pro faktury s DPH). Bezpecnostni vrstvy jsou "posledni lesteni"
pred enterprise nasazenim.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred S21:**
- **S1** (Bug Fixes) — stabilni zaklad
- **S2** (Objednavky) — order model pro kreditove platby a DPH na fakturach
- **S12** (Autentizace) — user/tenant system pro RBAC a audit logging
- **S13** (Generovani dokumentu) — faktury s DPH, reverse charge texty

**Sekce ktere zavisi na S21:**
- **S20** (Public API) — API auth, rate limiting, security standardy
- **S17** (E-commerce) — DPH integrace s WooCommerce/Shopify

**Casti S21 ktere mohou bezet paralelne:**
- DPH management a kreditovy system nemaji vzajemnou zavislost
- GDPR nastroje a custom domeny mohou bezet soucasne
- Audit logging je nezavisly na danovych features

### A4. Soucasny stav v codebase

**Co uz existuje:**
- Pricing engine: `/src/lib/pricing/pricingEngineV3.js` — pipeline `base -> fees -> markup -> minima -> rounding`
  ale NEOBSAHUJE dane/DPH (ceny jsou bez dane)
- Tenant storage: `/src/utils/adminTenantStorage.js` — `getTenantId()`, CRUD helpery
- Admin pricing: `/src/utils/adminPricingStorage.js` — namespace `pricing:v3`
- Orders storage: `/src/utils/adminOrdersStorage.js`
- Audit log: `/src/utils/adminAuditLogStorage.js` — zakladni audit log helper (existuje!)
- Auth context: `/src/context/AuthContext.jsx`
- Admin layout: `/src/pages/admin/AdminLayout.jsx` — sidebar navigace (10 polozek)
- Routes: `/src/Routes.jsx` — admin routes pod `/admin/*`
- Branding/widget: `/src/utils/adminBrandingWidgetStorage.js`
- Widget theme: `/src/utils/widgetThemeStorage.js`

**Co chybi (nutne vytvorit):**
- Storage helper: `/src/utils/adminTaxStorage.js` (namespace `tax:v1`)
- Storage helper: `/src/utils/adminCreditStorage.js` (namespace `credits:v1`)
- Storage helper: `/src/utils/adminCustomDomainStorage.js` (namespace `custom-domains:v1`)
- Storage helper: `/src/utils/adminGdprStorage.js` (namespace `gdpr:v1`)
- Admin stranky: `AdminTaxSettings.jsx`, `AdminCredits.jsx`, `AdminCustomDomain.jsx`, `AdminGdpr.jsx`
- VIES API integrace (backend endpoint)
- Pricing engine rozsireni o DPH kalkulaci
- Kreditovy system (backend logika + admin UI + zakaznicky portal)
- GDPR nastroje (data export, account deletion, anonymizace)
- Custom domain management (DNS check, SSL provisioning)

### A5. Referencni zdroje a konkurence

**Doporucene OSS knihovny (ze zdrojoveho dokumentu):**

| Knihovna | Stars | Ucel |
|----------|-------|------|
| **Casbin** (node-casbin) | 2.7k | RBAC/ABAC autorizace |
| **CASL** | 6k+ | Isomorphic authorization |
| **AccessControl** | 2k+ | Role-based access control |
| **argon2** | - | Password hashing (doporuceny) |
| **bcrypt** | - | Password hashing (klasicky) |
| **jose** | - | JWT/JWE/JWS |
| **zxcvbn** | - | Password strength meter |
| **helmet** | 10k+ | Security headers |
| **csurf** | - | CSRF protection |
| **Avalara SDK** | - | Enterprise tax calculation API |
| **TaxJar API** | - | Sales tax API |

**Doporuceny stack:** `CASL` pro autorizaci + `argon2` + `helmet`

**Konkurence:**
- **Stripe Tax** — automaticka DPH kalkulace, ale placena (0.5% z transakce)
- **Avalara** — enterprise tax compliance, drahy ale kompletni
- **AutoQuote3D** — zadne danove features, zadna GDPR podpora
- **Shapeways** — zakladni DPH, ale jen pro USA/EU

**VIES API:**
- Endpoint: `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/{countryCode}/vat/{vatNumber}`
- Bezplatne, ale nespolehlivy (timeouty 10-30s, obcasne vypadky)
- Nutny cache + fallback (rucni zadani)

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

#### Namespace: `tax:v1` (adminTaxStorage.js)

**localStorage schema pro dane:**
```json
{
  "schema_version": 1,
  "settings": {
    "prices_include_tax": true,
    "display_price_with_tax": true,
    "display_price_without_tax": false,
    "display_both": false,
    "enable_reverse_charge": true,
    "default_tax_rate_id": "tr_basic"
  },
  "tax_rates": [
    {
      "id": "tr_basic",
      "name": "Zakladni sazba",
      "rate": 21.00,
      "is_default": true,
      "applies_to": ["PRODUCTS", "SERVICES", "SHIPPING"],
      "is_active": true,
      "country_code": "CZ"
    },
    {
      "id": "tr_reduced",
      "name": "Snizena sazba",
      "rate": 15.00,
      "is_default": false,
      "applies_to": ["SERVICES"],
      "is_active": true,
      "country_code": "CZ"
    }
  ],
  "company_info": {
    "name": "",
    "ico": "",
    "dic": "",
    "address": {
      "street": "",
      "city": "",
      "postal_code": "",
      "country": "CZ"
    },
    "bank_account": "",
    "iban": "",
    "swift": ""
  },
  "vies_cache": {},
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**localStorage klic:** `modelpricer:${tenantId}:tax:v1`

#### Namespace: `credits:v1` (adminCreditStorage.js)

```json
{
  "schema_version": 1,
  "settings": {
    "enabled": false,
    "min_topup_amount": 500,
    "bonus_tiers": [
      { "min_amount": 1000, "bonus_amount": 50 },
      { "min_amount": 2000, "bonus_amount": 150 },
      { "min_amount": 5000, "bonus_amount": 500 }
    ],
    "expiration_days": null,
    "currency": "CZK"
  },
  "balances": {
    "cust_abc123": {
      "customer_id": "cust_abc123",
      "balance": 1500.00,
      "updated_at": "2024-01-16T08:00:00Z"
    }
  },
  "transactions": [
    {
      "id": "ct_uuid",
      "customer_id": "cust_abc123",
      "type": "TOPUP",
      "amount": 1000.00,
      "balance_after": 1500.00,
      "order_id": null,
      "payment_id": "pi_stripe_xxx",
      "description": "Dobiti kreditu",
      "created_by": null,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**localStorage klic:** `modelpricer:${tenantId}:credits:v1`

#### Namespace: `custom-domains:v1` (adminCustomDomainStorage.js)

```json
{
  "schema_version": 1,
  "domains": [
    {
      "id": "cd_uuid",
      "domain": "kalkulacka.mojefirma.cz",
      "widget_id": "wid_abc",
      "status": "pending_dns",
      "dns_verified_at": null,
      "ssl_issued_at": null,
      "ssl_expires_at": null,
      "error_message": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**localStorage klic:** `modelpricer:${tenantId}:custom-domains:v1`

#### Budouci databazovy model (PostgreSQL):

```sql
-- Danove sazby
CREATE TABLE tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  applies_to VARCHAR(50)[] DEFAULT '{PRODUCTS}',
  is_active BOOLEAN DEFAULT true,
  country_code VARCHAR(2) DEFAULT 'CZ',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tax_rates_tenant ON tax_rates(tenant_id);

-- Danove nastaveni tenanta
CREATE TABLE tenant_tax_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
  prices_include_tax BOOLEAN DEFAULT true,
  display_price_with_tax BOOLEAN DEFAULT true,
  display_price_without_tax BOOLEAN DEFAULT false,
  enable_reverse_charge BOOLEAN DEFAULT true,
  company_name VARCHAR(255),
  company_ico VARCHAR(20),
  company_dic VARCHAR(20),
  company_address JSONB,
  bank_account VARCHAR(50),
  iban VARCHAR(50),
  swift VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Kreditove zustatky
CREATE TABLE customer_credit_balances (
  customer_id UUID PRIMARY KEY REFERENCES customers(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_balances_tenant ON customer_credit_balances(tenant_id);

-- Kreditove transakce
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  type VARCHAR(50) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  order_id UUID REFERENCES orders(id),
  payment_id VARCHAR(100),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_tx_customer ON credit_transactions(customer_id, created_at);

-- Custom domeny
CREATE TABLE custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  widget_id UUID REFERENCES widgets(id),
  domain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending_dns',
  dns_verified_at TIMESTAMP,
  ssl_issued_at TIMESTAMP,
  ssl_expires_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX idx_custom_domains_tenant ON custom_domains(tenant_id);

-- Audit log (append-only)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- GDPR data requests
CREATE TABLE gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### B2. API kontrakty (endpointy)

**Admin API (interni, session-based auth):**

| Method | Endpoint | Popis |
|--------|----------|-------|
| GET | /api/admin/tax/settings | Nacist danove nastaveni |
| PUT | /api/admin/tax/settings | Ulozit danove nastaveni |
| GET | /api/admin/tax/rates | Seznam danovych sazeb |
| POST | /api/admin/tax/rates | Vytvorit novou sazbu |
| PUT | /api/admin/tax/rates/{id} | Upravit sazbu |
| DELETE | /api/admin/tax/rates/{id} | Smazat sazbu |
| POST | /api/admin/tax/validate-vat | Validovat DIC pres VIES |
| GET | /api/admin/credits/settings | Nastaveni kreditoveho systemu |
| PUT | /api/admin/credits/settings | Ulozit nastaveni |
| GET | /api/admin/credits/balances | Seznam zustatku zakazniku |
| POST | /api/admin/credits/adjust | Manualni uprava zustatku |
| GET | /api/admin/credits/transactions | Historie transakci |
| GET | /api/admin/custom-domains | Seznam custom domen |
| POST | /api/admin/custom-domains | Pridat custom domenu |
| POST | /api/admin/custom-domains/{id}/verify | Overit DNS |
| DELETE | /api/admin/custom-domains/{id} | Smazat domenu |
| GET | /api/admin/gdpr/requests | GDPR pozadavky |
| POST | /api/admin/gdpr/export/{customerId} | Export dat zakaznika |
| POST | /api/admin/gdpr/delete/{customerId} | Smazat data zakaznika |
| GET | /api/admin/audit-log | Audit log s filtraci |

**VIES API proxy:**
```
POST /api/admin/tax/validate-vat
Body: { "country_code": "DE", "vat_number": "123456789" }
Response: {
  "valid": true,
  "name": "Company GmbH",
  "address": "Berlin, Germany",
  "cached": false
}
```

### B3. Komponentni strom (React)

**Admin Tax Settings (/admin/settings/tax):**
```
AdminTaxSettings
  ├── TaxSettingsGeneral
  │   ├── DefaultTaxRateSelector (dropdown)
  │   ├── PriceIncludesTaxToggle
  │   ├── DisplayModeSelector (s DPH / bez DPH / obe)
  │   └── ReverseChargeToggle
  ├── TaxRatesTable
  │   ├── TaxRateRow (nazev, sazba, applies_to, akce)
  │   ├── AddTaxRateModal
  │   │   ├── RateNameInput
  │   │   ├── RateValueInput (%)
  │   │   ├── AppliesToSelector (checkboxy: Produkty, Sluzby, Doprava)
  │   │   └── CountryCodeSelect
  │   └── EditTaxRateModal
  ├── CompanyInfoForm
  │   ├── CompanyNameInput
  │   ├── IcoInput
  │   ├── DicInput + ViesValidateButton
  │   ├── AddressFields (street, city, postal_code, country)
  │   ├── BankAccountInput
  │   ├── IbanInput
  │   └── SwiftInput
  └── VatValidationResult (zeleny/cerveny badge)
```

**Admin Credits (/admin/settings/credits):**
```
AdminCredits
  ├── CreditSettingsPanel
  │   ├── EnableCreditsToggle
  │   ├── MinTopupInput
  │   ├── BonusTiersEditor
  │   │   └── BonusTierRow (min_amount, bonus_amount, +/-)
  │   └── ExpirationDaysInput
  ├── CreditBalancesTable
  │   ├── CreditBalanceRow (zakaznik, zustatek, posledni transakce)
  │   └── AdjustCreditModal (castka +/-, duvod, notifikovat email)
  └── CreditTransactionsLog
      ├── TransactionFilters (zakaznik, typ, datum)
      ├── TransactionRow (datum, typ, castka, zustatek_po, popis)
      └── ExportCsvButton
```

**Admin Custom Domain (/admin/widget/custom-domain):**
```
AdminCustomDomain
  ├── DomainList
  │   └── DomainRow (domena, status badge, akce)
  ├── AddDomainModal
  │   ├── DomainInput (validace formatu)
  │   ├── WidgetSelector (ktery widget pripojit)
  │   └── DnsInstructions (CNAME instrukce)
  ├── VerifyDnsButton
  └── DomainStatusTimeline (pending -> dns_verified -> ssl_active -> active)
```

**Admin GDPR (/admin/settings/gdpr):**
```
AdminGdpr
  ├── GdprOverview (pocet pozadavku, posledni akce)
  ├── CustomerDataExport
  │   ├── CustomerSelector
  │   └── ExportButton (JSON/CSV)
  ├── CustomerDataDeletion
  │   ├── CustomerSelector
  │   ├── DeletionPreview (co bude smazano)
  │   └── ConfirmDeleteButton (2-step potvrzeni)
  ├── RetentionPolicySettings
  │   ├── AutoDeleteInactiveToggle
  │   ├── InactivityPeriodInput (mesice)
  │   └── AnonymizationPreferences
  └── GdprRequestsLog
      └── RequestRow (datum, zakaznik, typ, status)
```

### B4. Tenant storage namespace

| Oblast | Namespace | Helper soubor | Pattern |
|--------|-----------|---------------|---------|
| Dane | `tax:v1` | `adminTaxStorage.js` | `modelpricer:${tenantId}:tax:v1` |
| Kredity | `credits:v1` | `adminCreditStorage.js` | `modelpricer:${tenantId}:credits:v1` |
| Custom domeny | `custom-domains:v1` | `adminCustomDomainStorage.js` | `modelpricer:${tenantId}:custom-domains:v1` |
| GDPR | `gdpr:v1` | `adminGdprStorage.js` | `modelpricer:${tenantId}:gdpr:v1` |
| Audit log | `audit-log:v1` | `adminAuditLogStorage.js` (existuje!) | `modelpricer:${tenantId}:audit-log:v1` |

**Exporty adminTaxStorage.js:**
```javascript
export function loadTaxConfig()              // nacte cely config
export function saveTaxConfig(config)         // ulozi config
export function getTaxRates()                 // vrati pole sazeb
export function addTaxRate(rate)              // prida novou sazbu
export function updateTaxRate(id, updates)    // aktualizuje sazbu
export function deleteTaxRate(id)             // smaze sazbu
export function getDefaultTaxRate()           // vrati default sazbu
export function getCompanyInfo()              // fakturacni udaje
export function saveCompanyInfo(info)         // ulozi udaje
export function calculateTax(amount, rateId)  // vypocet dane z castky
export function getCachedViesResult(dic)      // cache VIES vysledku
export function cacheViesResult(dic, result)  // ulozi VIES vysledek
export function getDefaultTaxConfig()         // defaultni konfigurace
```

### B5. Widget integrace (postMessage)

**DPH zobrazeni ve widgetu:**
Widget musi cist danove nastaveni z tenant storage a zobrazovat ceny podle konfigurace:

```json
{
  "type": "MODELPRICER_PRICE_UPDATE",
  "payload": {
    "price_without_tax": 1000.00,
    "tax_rate": 21.00,
    "tax_amount": 210.00,
    "price_with_tax": 1210.00,
    "display_mode": "both",
    "currency": "CZK",
    "reverse_charge": false
  }
}
```

**Reverse charge ve widgetu:**
- Pokud zakaznik zada platne EU DIC (jina zeme nez tenant), widget zobrazi cenu bez DPH
- PostMessage: `{ type: "MODELPRICER_REVERSE_CHARGE_APPLIED", payload: { dic: "DE123...", valid: true } }`

**Kreditovy system ve widgetu:**
- Pokud zakaznik ma kredit > 0, v checkout kroku zobrazit moznost platby kreditem
- PostMessage: `{ type: "MODELPRICER_CREDIT_PAYMENT", payload: { amount: 700, balance_remaining: 800 } }`

### B6. Pricing engine integrace

**Rozsireni pricingEngineV3.js o DPH:**

Aktualne pricing engine vraci ceny BEZ dane. Dane se pricitaji AZ na konci pipeline:

```
base -> fees -> markup -> minima -> rounding -> [NOVY KROK] -> tax
```

**Nova funkce v pricingEngineV3.js:**
```javascript
function applyTax(total, taxConfig) {
  if (!taxConfig || !taxConfig.enabled) return { total, tax: 0, totalWithTax: total };

  const rate = taxConfig.default_rate || 0;
  const reverseCharge = taxConfig.reverse_charge_applied || false;

  if (reverseCharge) {
    return { total, tax: 0, totalWithTax: total, reverse_charge: true };
  }

  if (taxConfig.prices_include_tax) {
    // Ceny uz obsahuji dan — extrahovat
    const taxAmount = total - (total / (1 + rate / 100));
    const priceWithoutTax = total - taxAmount;
    return { total: priceWithoutTax, tax: taxAmount, totalWithTax: total };
  } else {
    // Ceny jsou bez dane — pricit
    const taxAmount = (total * rate) / 100;
    return { total, tax: taxAmount, totalWithTax: total + taxAmount };
  }
}
```

**Kreditovy system — integrace s orders:**
```javascript
// V checkout flow:
if (paymentMethod === 'credit') {
  const balance = getCreditBalance(customerId);
  if (balance >= orderTotal) {
    chargeCredit(customerId, orderTotal, orderId);
    // balance -= orderTotal
  } else {
    // nedostatecny kredit -> error nebo kombinovana platba
  }
}
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-security` | Celkovy security review, architektura | Vsechny security soubory | P0 |
| `mp-mid-security-app` | GDPR implementace, audit logging | `/src/utils/adminGdprStorage.js`, GDPR komponenty | P0 |
| `mp-spec-security-gdpr` | GDPR specificka logika (export, delete, anonymize) | GDPR utiliry a komponenty | P0 |
| `mp-spec-security-auth` | Auth hardening (brute-force, lockout) | Auth middleware | P0 |
| `mp-mid-pricing-engine` | DPH integrace do pricing pipeline | `/src/lib/pricing/pricingEngineV3.js` | P1 |
| `mp-spec-pricing-tax` | Danove kalkulace, VIES integrace | `/src/utils/adminTaxStorage.js`, VIES proxy | P1 |
| `mp-spec-pricing-currency` | Multi-currency DPH (budouci) | Utility funkce | P2 |
| `mp-mid-frontend-admin` | Admin stranky pro dane, kredity, GDPR | `/src/pages/admin/AdminTax*.jsx` | P1 |
| `mp-spec-fe-forms` | Formulare (company info, tax rates, credit adjust) | Modaly a formulare | P1 |
| `mp-mid-storage-tenant` | Storage helpery (tax, credits, custom-domains, gdpr) | `/src/utils/admin*Storage.js` | P0 |
| `mp-mid-backend-services` | VIES proxy, credit transactions, domain verify | Backend service soubory | P1 |
| `mp-spec-be-webhooks` | Webhook eventy pro kredit a objednavky | Webhook service | P2 |
| `mp-mid-infra-build` | Custom domain DNS/SSL management | Infra scripty | P2 |
| `mp-spec-design-a11y` | Accessibility audit novych stranek | Vse nove | P1 |
| `mp-spec-test-build` | Build verifikace | Build pipeline | P0 |
| `mp-spec-fe-routing` | Nove routes v Routes.jsx a AdminLayout | `/src/Routes.jsx`, `AdminLayout.jsx` | P0 |
| `mp-sr-docs` | Dokumentace pro enterprise zakazniky | `/docs/` | P2 |

### C2. Implementacni kroky (poradi)

**Faze 1: Dane / DPH (tyden 1)**
1. **Vytvorit `adminTaxStorage.js`** (namespace `tax:v1`)
   - Schema, defaults, CRUD pro tax rates, company info
   - Zavislosti: zadne
2. **Admin stranka `AdminTaxSettings.jsx`**
   - General settings, tax rates table, company info form
   - Zavislosti: 1
3. **VIES API proxy endpoint** (backend)
   - `POST /api/admin/tax/validate-vat`
   - Cache vysledku (7 dni), graceful timeout (5s)
   - Zavislosti: zadne (paralelne s 1, 2)
4. **DPH integrace do pricing engine**
   - Nova funkce `applyTax()` na konci pipeline
   - Rozsireni `calculateOrderQuote()` vystupu o `tax` objekt
   - Zavislosti: 1 (tax config)
5. **DPH zobrazeni ve widgetu**
   - Cteni tax config z tenant storage
   - Zobrazeni ceny s/bez DPH podle nastaveni
   - Zavislosti: 4

Kroky 1, 3 mohou bezet paralelne. Krok 2 zavisi na 1. Kroky 4, 5 zavisi na 1.

**Faze 2: Kreditovy system (tyden 2)**
6. **Vytvorit `adminCreditStorage.js`** (namespace `credits:v1`)
   - Balances, transactions, CRUD
   - Zavislosti: zadne
7. **Admin stranka `AdminCredits.jsx`**
   - Settings panel, balances table, transactions log, adjust modal
   - Zavislosti: 6
8. **Backend kreditove operace**
   - Topup, charge, refund, manual adjust — atomicke operace
   - Zavislosti: 6
9. **Checkout integrace** (platba kreditem ve widgetu/kalkulacce)
   - Zavislosti: 6, 8

Kroky 6, 7 mohou bezet soucasne (7 ceka na 6 pro napojeni).

**Faze 3: Bezpecnost a GDPR (tyden 3)**
10. **Rozsireni audit logu** (uz existuje `adminAuditLogStorage.js`)
    - Pridani detailnich eventu pro vsechny nove operace
    - Append-only integrity (hash chain)
    - Zavislosti: zadne
11. **GDPR nastroje** (data export, account deletion, anonymizace)
    - `adminGdprStorage.js` + Admin UI `AdminGdpr.jsx`
    - Zavislosti: 10 (audit log pro GDPR akce)
12. **Security hardening**
    - HSTS, CSP, CORS konfigurace
    - Auth rate limiting, account lockout
    - Zavislosti: zadne (paralelne)
13. **Custom domeny**
    - `adminCustomDomainStorage.js` + Admin UI
    - DNS verifikace endpoint + SSL provisioning
    - Zavislosti: zadne (paralelne)

Kroky 10, 12, 13 mohou bezet plne paralelne.

**Faze 4: Integrace a testovani (tyden 4)**
14. **Routes a navigace** (Routes.jsx, AdminLayout.jsx)
    - Nove admin routes pro /admin/settings/tax, /admin/settings/credits, atd.
    - Zavislosti: 2, 7, 11, 13
15. **Faktury s DPH** (napojeni na S13)
    - Company info na fakturu, reverse charge text
    - Zavislosti: 1, 4 + S13
16. **Integration testy**
    - Zavislosti: vsechny predchozi
17. **Security audit**
    - Zavislosti: vsechny predchozi

### C3. Kriticke rozhodovaci body

1. **VIES API spolehlivost**
   - VIES byva casto nedostupny. Reseni:
   - a) Cache validnich vysledku na 7 dni
   - b) Manual override (admin muze rucne overit DIC)
   - c) Graceful degradation (pokud VIES neodpovi do 5s, zobrazit warning, ne error)

2. **Kreditovy system — atomicita**
   - localStorage nema transakce. Reseni:
   - a) Optimistic locking (version counter)
   - b) Pri concurrent access: read-modify-write s retry
   - c) V budoucnu: presun na PostgreSQL s real transakcemi

3. **Custom domeny — SSL provisioning**
   - Varianta A: Let's Encrypt s automatickou obnovou (Caddy)
   - Varianta B: Cloudflare for SaaS (jednodussi ale zavislost)
   - Doporuceni: Caddy pro self-hosted, Cloudflare pro production

4. **GDPR — anonymizace vs. smazani**
   - Objednavky nelze uplne smazat (ucetni predpisy)
   - Reseni: anonymizace osobnich udaju, zachovani financnich dat
   - Napr.: jmeno -> "DELETED", email -> hash, adresa -> smazana

5. **Audit log — integrita**
   - Varianta A: hash chain (kazdy zaznam obsahuje hash predchoziho)
   - Varianta B: append-only s digitanim podpisem
   - Doporuceni: Varianta A pro localStorage, migrace na B pri PostgreSQL

### C4. Testovaci strategie

**Unit testy:**
- DPH kalkulace (zakladni sazba, snizena, reverse charge, obe zobrazeni)
- VIES validace (platne DIC, neplatne, timeout, cache)
- Kreditove operace (topup, charge, refund, nedostatecny zustatek)
- Tax rate CRUD (vytvoreni, update, smazani, default)
- GDPR export (format, kompletnost dat)
- Audit log (append, integrity, filtering)

**Integration testy:**
- DPH -> faktura flow (nastaveni dane -> objednavka -> faktura s DPH)
- Reverse charge flow (zadani DIC -> VIES validace -> cena bez DPH)
- Kredit flow (dobiti -> objednavka -> odecteni -> zustatek)
- Custom domain flow (pridani -> DNS check -> SSL -> active)
- GDPR flow (request -> export/delete -> verifikace)

**E2E testy:**
- Admin: nastaveni DPH sazby -> widget zobrazi cenu s DPH
- Admin: vytvoreni danove sazby -> pouziti v objednavce
- Admin: manualni uprava kreditu -> zakaznik vidi novy zustatek
- Admin: pridani custom domeny -> DNS instrukce -> verifikace

**Nastroje:** Vitest (unit), Playwright (E2E), manual security audit

### C5. Migrace existujicich dat

**DPH:** Zadna migrace — novy subsystem. Defaultni nastaveni:
- Zakladni sazba 21% (CZ), prices_include_tax: true
- Reverse charge: enabled (ale neaplikuje se dokud zakaznik nezada DIC)

**Kredity:** Zadna migrace — novy subsystem. Defaultni: vypnuto.

**Audit log:** `adminAuditLogStorage.js` uz existuje. Migrace:
- Kontrola schema verze, pridani novych event typu
- Stare zaznamy zustanou kompatibilni

**Pricing engine:** Zpetna kompatibilita — `calculateOrderQuote()` vraci stejny vysledek
kdyz neni `taxConfig` poskytnuta. Nova `tax` property je optional.

---

## D. KVALITA

### D1. Security review body

**P0 — Kriticke:**
- [ ] API klice nikdy v plaintextu v logech (redakce)
- [ ] VIES API proxy nesmi byt zneuzitelny jako open proxy
- [ ] Kreditove operace musi byt atomicke (zadny double-spend)
- [ ] GDPR smazani je nevratne — 2-step potvrzeni + audit log
- [ ] Audit log je append-only (nesmi byt editovatelny)
- [ ] Custom domain DNS verifikace musi zabranit domain takeover
- [ ] Company DIC nesmi byt lognuto v plaintext (PII)
- [ ] Reverse charge logika musi byt spravna (legalni dopad!)
- [ ] HSTS hlavicky na vsech admin strankach
- [ ] CSP hlavicky (zabraneni XSS)
- [ ] CORS whitelist (jen povolene domeny)
- [ ] Rate limiting na VIES API proxy (zabraneni zneuziti)
- [ ] Tenant izolace — zakaznik nevi o datech jinych tenantu

**P1 — Dulezite:**
- [ ] Password strength meter (zxcvbn) pri registraci
- [ ] Account lockout po 5 neuspesnych prihlaseni (15 min cooldown)
- [ ] Session timeout (1h inactivity)
- [ ] Audit log retence (min. 2 roky pro ucetni udaje)
- [ ] GDPR retencni politiky (konfigurovatelne per tenant)
- [ ] Webhook secret rotace

### D2. Performance budget

| Metrika | Target | Mereni |
|---------|--------|--------|
| Tax calculation | < 5ms | pricingEngineV3 benchmark |
| VIES API response | < 5s (s cache: < 50ms) | Backend log |
| Credit balance check | < 10ms | Storage read benchmark |
| Audit log write | < 20ms | Storage write benchmark |
| GDPR data export (100 objednavek) | < 5s | Backend benchmark |
| Custom domain DNS check | < 10s | Network timeout |
| Admin Tax page load | < 2s | Lighthouse |
| Admin Credits page load | < 2s | Lighthouse |
| Admin GDPR page load | < 2s | Lighthouse |

### D3. Accessibility pozadavky

**Vsechny nove admin stranky:**
- WCAG 2.1 AA compliant
- Form labels propojene s inputy (htmlFor/id)
- Error messages ohlasene screen readeru (aria-live)
- Tabulky s proper th/scope
- Keyboard navigace v tabulkach a modalech
- Color contrast minimalne 4.5:1
- Focus management pri otevreni/zavreni modalu
- Destruktivni akce (smazani) maji jasne varovani

**Specificke:**
- VIES validace: vysledek (valid/invalid) oznamen screen readeru
- Kreditovy zustatek: prominentni zobrazeni s aria-label
- Domain status badge: barva + text (ne jen barva — a11y)
- GDPR smazani: 2-step potvrzeni s jasnym popisem co bude smazano

### D4. Error handling a edge cases

**DPH edge cases:**
- VIES API timeout -> zobrazit warning "Nelze overit DIC. Zkuste znovu pozdeji."
- VIES API vraci invalid ale DIC je spravne (false negative) -> manual override
- Zakaznik zmeni zemi po zadani DIC -> reset reverse charge
- DPH sazba 0% (nektery stat) -> aplikovat, ale nezobrazovat "0% DPH"
- Cena 0 Kc -> DPH = 0 (ne NaN)

**Kreditove edge cases:**
- Concurrent topup + charge -> optimistic lock, retry
- Kredit expiruje behem checkout -> informovat zakaznika
- Zakaznik zkusi zaplatit kreditem ale zustatek = 0 -> blokovat, nabidnout dobiti
- Refund na objednavku placenou kreditem -> vrátit kredit, ne penize
- Manualni uprava do zaporu -> zakazat (min 0)
- Double-charge prevention -> idempotency key na kazdy charge

**GDPR edge cases:**
- Smazani zakaznika ktery ma aktivni objednavky -> anonymizovat, ne smazat objednavky
- Export dat pro zakaznika s 1000+ objednavkami -> pagination/streaming
- GDPR request behem probehajiciho exportu -> queue, ne duplikace
- Zakaznik pozada o smazani ale ma kladny kredit -> upozornit admina

**Custom domain edge cases:**
- CNAME ukazuje jinam nez na modelpricer -> DNS check fail s jasnou zpravou
- SSL certifikat nelze vystavit (rate limit Let's Encrypt) -> retry za 1h
- Zakaznik zmeni DNS po overeni -> periodicka DNS revalidace (1x/den)
- 2 tenanti chteji stejnou domenu -> unique constraint, prvni registrace vyhraje

### D5. i18n pozadavky

**Admin UI stranky (dane, kredity, GDPR, custom domeny):**
- Cestina (primarni) + Anglictina
- i18n klice: `admin.tax.*`, `admin.credits.*`, `admin.gdpr.*`, `admin.customDomain.*`

**Specificke preklady:**
- Nazvy danovych sazeb (Zakladni sazba / Basic rate)
- Typy kreditovych transakci (DOBITI / TOPUP, PLATBA / CHARGE, atd.)
- GDPR prava (Pravo na pristup / Right to access, atd.)
- Domain status stavy (Ceka na DNS / Pending DNS, atd.)

**DPH zobrazeni ve widgetu:**
- "bez DPH" / "excl. VAT"
- "s DPH" / "incl. VAT"
- "Reverse charge — dan odvede odberatel" / "Reverse charge — tax paid by recipient"

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flagy:**
- `FEATURE_TAX_MANAGEMENT` — DPH/VAT system
- `FEATURE_CREDIT_SYSTEM` — Kreditovy system
- `FEATURE_CUSTOM_DOMAINS` — Custom domeny pro widget
- `FEATURE_GDPR_TOOLS` — GDPR nastroje

**Postupny rollout:**
1. **Alpha** (tyden 1-2): DPH management pro interni testovani
   - Jen admin UI, zadny vliv na widget/pricing
2. **Beta** (tyden 3): DPH integrace do pricing + widgetu
   - 5-10 tenants, manualni povoleni
   - VIES integrace v "soft" modu (warning, ne blokace)
3. **Beta 2** (tyden 4): Kreditovy system + GDPR tools
   - Omezeny pocet tenants
   - Kreditovy system v "read-only" modu (admin vidi, zakaznik ne)
4. **GA** (tyden 5+): Vsechny features verejne
   - Custom domeny: enterprise only
   - GDPR tools: vsechny tarify

### E2. Admin UI zmeny

**Nove stranky:**
- `/admin/settings/tax` — Danove nastaveni (sazby, company info, VIES)
- `/admin/settings/credits` — Kreditovy system
- `/admin/settings/gdpr` — GDPR nastroje
- `/admin/widget/custom-domain` — Custom domeny

**Zmeny v AdminLayout.jsx:**
- Pridani nav skupiny "Nastaveni" s podsekci:
  ```javascript
  { path: '/admin/settings/tax', label: t('admin.taxSettings'), icon: 'Receipt' },
  { path: '/admin/settings/credits', label: t('admin.credits'), icon: 'Wallet' },
  { path: '/admin/settings/gdpr', label: t('admin.gdpr'), icon: 'Shield' },
  ```
- Custom domain je podstranka Widget sekce (ne samostatna)

**Zmeny v Routes.jsx:**
```javascript
import AdminTaxSettings from './pages/admin/AdminTaxSettings';
import AdminCredits from './pages/admin/AdminCredits';
import AdminGdpr from './pages/admin/AdminGdpr';
import AdminCustomDomain from './pages/admin/AdminCustomDomain';

// V admin route group:
<Route path="settings/tax" element={<AdminTaxSettings />} />
<Route path="settings/credits" element={<AdminCredits />} />
<Route path="settings/gdpr" element={<AdminGdpr />} />
<Route path="widget/custom-domain" element={<AdminCustomDomain />} />
```

**Admin Dashboard widget:**
- Novy widget: "DPH prehled" (aktualni sazba, pocet objednavek s DPH)
- Novy widget: "Kreditovy prehled" (celkovy objem nevycerpanych kreditu)

### E3. Widget zmeny

**DPH zobrazeni:**
- Widget cte `tax:v1` z tenant storage
- V cenove summary pridana radka "DPH {rate}%: {amount} Kc"
- Pokud display_both: dve radky (bez DPH + s DPH)
- Pokud reverse_charge: "Reverse charge — 0% DPH"

**Kreditova platba v checkout:**
- Pokud zakaznik prihlasen a ma kredit > 0:
  - Zobrazit zustatek
  - Radio button "Zaplatit kreditem" / "Zaplatit jinak"
  - Pokud kredit nestaci: warning s odkazem na dobiti

**PostMessage zmeny:**
- `MODELPRICER_PRICE_UPDATE` — rozsireno o `tax` objekt
- `MODELPRICER_CREDIT_PAYMENT` — novy typ zpravy
- `MODELPRICER_REVERSE_CHARGE_APPLIED` — novy typ zpravy

### E4. Dokumentace pro uzivatele

**Admin panel help:**
- Tooltip "Dane" — "Nastavte DPH sazby a fakturacni udaje vasi firmy"
- Tooltip "Kredity" — "Umoznete zakaznikum predplatit kredit pro rychlejsi objednavky"
- Tooltip "GDPR" — "Spravujte prava zakazniku na pristup, export a smazani dat"
- Tooltip "Custom domena" — "Pripojte kalkulacku na vlastni domenu vasi firmy"

**Knowledge base clanky:**
- "Jak nastavit DPH sazby"
- "Co je reverse charge a kdy se pouziva"
- "Jak funguje kreditovy system"
- "Jak pridat custom domenu k widgetu"
- "GDPR — prava vasich zakazniku"

### E5. Metriky uspechu (KPI)

| KPI | Target (3 mesice) | Mereni |
|-----|-------------------|--------|
| Tenants s nastavenym DPH | 80%+ vsech aktivnich | Storage analytics |
| Spravnost DPH na fakturach | 100% | Manual audit |
| VIES validace uspesnost | > 95% | Backend logs |
| VIES cache hit rate | > 70% | Backend logs |
| Pocet aktivnich kreditovych uctu | 20+ | Storage analytics |
| Celkovy objem kreditu | 100 000+ CZK | Storage analytics |
| Kredity — pomer plateb | > 30% objednavek (u uzivatelu s kreditem) | Order analytics |
| GDPR export requests/mesic | < 5 (compliance, ne objem) | GDPR log |
| GDPR response time | < 72h (GDPR pozadavek) | GDPR log |
| Custom domen pocet | 10+ (enterprise zakaznici) | Storage analytics |
| Custom domain SSL success | > 99% | SSL monitoring |
| Audit log uptime | 100% (append-only, nesmi selhat) | System monitoring |
| Security incidents | 0 | Security audit |
| Bezpecnostni audit score | > 90/100 | External audit |
