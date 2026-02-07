# V3-S12: Zakaznicky portal

> **Priorita:** P2 | **Obtiznost:** High | **Vlna:** 3
> **Zavislosti:** S01 (Bug Fixes), S02 (Kontaktni formular), S07 (Emailove notifikace), S11 (Chat), S21 (Security)
> **Odhadovany rozsah:** ~55-75 souboru (auth system, customer storage, portal stranky, self-service funkce, bezpecnostni vrstva)

---

## A. KONTEXT

### A1. Ucel a cil

Zakaznicky portal je self-service rozhrani pro zakazniky 3D tiskovych firem. Umoznuje registraci, prihlaseni, spravu objednavek, komunikaci a opakovane objednavky bez nutnosti kontaktovat admina.

**Klicove funkce:**
1. **Autentizace** — registrace emailem + heslem, social login (Google), magic link (prihlaseni bez hesla), email verifikace, zapomenute heslo
2. **Dashboard zakaznika** — prehled aktivnich objednavek, celkove statistiky, rychle akce
3. **Seznam objednavek** — filtrovatelny seznam s vizualnim stavem, progress bar, detail objednavky
4. **Detail objednavky** — polozky, cenovy rozpis, stav, adresy, tlacitka (chat, faktura, opakovat)
5. **Knihovna modelu** — ulozene 3D modely pro opakovanou objednavku
6. **Sprava adres** — CRUD fakturacnich a dodacich adres
7. **Nastaveni uctu** — profil, zmena hesla, jazykove preference, newsletter
8. **Faktury a dokumenty** — stazeni faktur, dodacich listu, potvrzeni

**Business value:**
- Snizeni support zateze o 40-60% — zakaznici si pomuazou sami
- Zvyseni repeat purchase rate o 25-35% — jednoduche opakovanepobjednavky
- Profesionalni image — moderni portal zvysuje duveru
- Data pro CRM — registrovani zakaznici = moznost cileneho marketingu
- Automatizace — zakaznicky portal eliminuje manualni administrativu

### A2. Priorita, obtiznost, vlna

**Priorita P2** — pro MVP ModelPriceru portal neni nutny (objednavky jdou pres formular). Pro produkni nasazeni s opakujicimi se zakazniky je ale kriticaly.

**Obtiznost High** — toto je SECURITY-CRITICAL sekce. Duvody:
- **Autentizace** — hesla, tokeny, session management, email verifikace, password reset — kazda chyba je bezpecnostni incident
- **Autorizace** — zakaznik smi videt JEN SVE objednavky, ne cizi. Tenant izolace musi byt bulletproof
- **Hesla** — hashing (argon2/bcrypt), strength validation (zxcvbn), brute-force protection
- **Social login** — OAuth 2.0 flow s Google (Firebase Auth uz existuje)
- **Magic link** — jednorazove tokeny, expirace, revokovani
- **GDPR** — pravo na smazani uctu, export dat, souhlas s zpracovanim

**Vlna 3** — zavisi na objednavkovem systemu, emailove infrastrukture, chatu. Je to "zastresujici" feature ktera propojuje vsechny zakaznicke aspekty.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred S12:**
- **S01 (Bug Fixes)** — stabilni zaklad
- **S02 (Kontaktni formular)** — zakladni objednavkovy flow
- **S07 (Emailove notifikace)** — emaily pro registraci, reset hesla, verifikace
- **S11 (Chat)** — zakaznicky chat pristupny pres portal
- **S21 (Security)** — RBAC/ABAC framework, bezpecnostni standardy

**Sekce ktere zavisi na S12:**
- **S10 (Kupony)** — kupony vazane na zakaznicky ucet
- **S17 (E-commerce pluginy)** — customer sync s WooCommerce/Shopify
- **S19 (CRM/Marketing)** — zakaznickak data pro segmentaci

**Obousmerne zavislosti:**
- **S11 (Chat)** — zakaznik pristupuje k chatu pres portal NEBO pres token link

### A4. Soucasny stav v codebase

**Co uz existuje:**
- Auth context: `src/context/AuthContext.jsx` — Firebase Auth (onAuthStateChanged, Firestore profil). Toto je ADMIN auth, ne zakaznicky.
- Login stranka: `src/pages/login/index.jsx` — prihlaseni pro adminy (Firebase)
- Register stranka: `src/pages/register/index.jsx` — registrace pro adminy
- Account stranka: `src/pages/account/index.jsx` — zakladni account stranka (zatim skoro prazdna)
- AccountOverviewCard: `src/pages/account/components/AccountOverviewCard.jsx` — prehledova karta
- PrivateRoute: `src/components/PrivateRoute.jsx` — route guard (docasne vypnuty)
- Routes.jsx: `src/Routes.jsx` — `/account` route existuje (ale je nezrazena)
- Orders storage: `src/utils/adminOrdersStorage.js` — orders maji `customer_snapshot` pole

**Co chybi:**
- Zadny `adminCustomersStorage.js` — neni customers namespace
- Zadny zakaznicky auth system (oddeleny od admin auth)
- Zadny zakaznicky dashboard, objednavky, modely, adresy
- Zadny password reset flow
- Zadny email verifikacni flow
- Zadny social login (Google OAuth)
- Zadny magic link system
- Zadna knihovna modelu
- Zadna sprava adres
- Zadny GDPR compliance (smazani uctu, export dat)

### A5. Referencni zdroje a konkurence

**OSS knihovny (z doporuceni):**
- **Auth.js (NextAuth)** (24k+ stars) — kompletni auth pro Next.js. Pro nas projekt relevantni jako reference design, ne prime pouziti (mame React SPA, ne Next.js)
- **Lucia Auth** (9k+ stars) — lightweight auth library. Vhodna pro custom reseni
- **Keycloak** (23k+ stars) — enterprise SSO. Overkill pro MVP, ale reference pro budoucnost
- **Supabase Auth** — built-in s Supabase. Relevantni pokud se presune na Supabase backend
- **argon2** — password hashing (doporuceno pred bcrypt)
- **jose** — JWT/JWE/JWS tokeny
- **zxcvbn** (Dropbox) — password strength estimation
- **CASL** (6k+ stars) — isomorphic authorization library

**Doporuceni pro Variantu A:** Pouzit **Firebase Auth** ktery uz v projektu existuje. Rozrezit na dve auth domeny: admin (existujici) a customer (novy). Pro produkci zvazit Auth.js nebo Lucia.

**Konkurencni reseni:**
- **Shopify** — kompletni zakaznicky portal s objednavkami, adresami, wishlistem
- **WooCommerce** — My Account stranka s objednavkami, adresami, stazenimi
- **Xometry** — zakaznicky portal s RFQ, objednavkami, modely, fakturami
- **Hubs/Protolabs** — portal s instant quotingem, objednavkami, tracking

**Best practices:**
- Registrace co nejjednodussi (email + heslo, ne 10 poli) — dalsi info vyplnit pozdeji
- Social login (Google) zvysuje konverzi registrace o 20-30%
- Magic link jako alternativa k heslu — jednodussi pro zakazniky
- Email verifikace PRED jakoukoli akci (ne az po tydennu)
- Password strength meter realtimove (ne az pri submit)
- "Objednat znovu" tlacitko je #1 feature pro repeat customers

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `customers:v1`
**Klic:** `modelpricer:${tenantId}:customers:v1`

```json
{
  "schema_version": 1,
  "customers": [
    {
      "id": "cust_uuid_1",
      "email": "jan.novak@example.cz",
      "password_hash": "$argon2id$v=19$m=65536...",
      "first_name": "Jan",
      "last_name": "Novak",
      "company_name": "",
      "phone": "+420 777 111 222",
      "tax_id": "",
      "vat_id": "",
      "preferred_language": "cs",
      "preferred_currency": "CZK",
      "email_verified": true,
      "email_verified_at": "2025-01-14T10:00:00Z",
      "auth_provider": "email",
      "google_id": null,
      "last_login_at": "2025-01-15T08:00:00Z",
      "login_count": 12,
      "newsletter_subscribed": true,
      "gdpr_consent_at": "2025-01-13T18:00:00Z",
      "created_at": "2025-01-13T18:00:00Z",
      "updated_at": "2025-01-15T08:00:00Z"
    }
  ],
  "addresses": [
    {
      "id": "addr_uuid_1",
      "customer_id": "cust_uuid_1",
      "address_type": "shipping",
      "is_default": true,
      "company_name": "",
      "first_name": "Jan",
      "last_name": "Novak",
      "street": "Ulice 123",
      "city": "Praha",
      "postal_code": "11000",
      "country_code": "CZ",
      "phone": "+420 777 111 222",
      "created_at": "2025-01-13T18:05:00Z"
    },
    {
      "id": "addr_uuid_2",
      "customer_id": "cust_uuid_1",
      "address_type": "billing",
      "is_default": true,
      "company_name": "",
      "first_name": "Jan",
      "last_name": "Novak",
      "street": "Ulice 123",
      "city": "Praha",
      "postal_code": "11000",
      "country_code": "CZ",
      "phone": "+420 777 111 222",
      "created_at": "2025-01-13T18:05:00Z"
    }
  ],
  "saved_models": [
    {
      "id": "model_uuid_1",
      "customer_id": "cust_uuid_1",
      "filename": "benchy.stl",
      "display_name": "Benchy",
      "file_size": 845000,
      "file_hash": "sha256:abc123...",
      "storage_ref": "customers/cust_uuid_1/models/benchy.stl",
      "thumbnail_url": null,
      "last_ordered_at": "2025-01-15T10:00:00Z",
      "order_count": 3,
      "tags": ["test", "benchmark"],
      "created_at": "2025-01-13T18:10:00Z"
    }
  ],
  "sessions": [
    {
      "id": "sess_uuid_1",
      "customer_id": "cust_uuid_1",
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-01-15T08:00:00Z",
      "expires_at": "2025-01-22T08:00:00Z",
      "last_activity_at": "2025-01-15T08:45:00Z"
    }
  ],
  "verification_tokens": {
    "cust_uuid_1": {
      "email_verify": {
        "token": "verify_abc123",
        "expires_at": "2025-01-14T18:00:00Z"
      },
      "password_reset": null,
      "magic_link": null
    }
  },
  "settings": {
    "registration_enabled": true,
    "social_login_enabled": true,
    "magic_link_enabled": true,
    "email_verification_required": true,
    "password_min_length": 8,
    "password_require_uppercase": true,
    "password_require_number": true,
    "password_require_special": false,
    "session_duration_days": 7,
    "max_login_attempts": 5,
    "lockout_duration_minutes": 15,
    "max_addresses_per_customer": 10,
    "max_saved_models": 50,
    "allow_account_deletion": true
  },
  "updated_at": "2025-01-15T08:00:00Z"
}
```

**auth_provider varianty:**
- `"email"` — registrace emailem + heslem
- `"google"` — Google OAuth
- `"magic_link"` — prihlaseni pres magic link (bez hesla)

**address_type varianty:**
- `"shipping"` — dodaci adresa
- `"billing"` — fakturacni adresa

**DULEZITA POZNAMKA pro Variantu A:**
Password hashing (`argon2`) neni mozny v client-side JavaScriptu bezpecnym zpusobem. Pro Variantu A (localStorage demo) se pouzije zjednodusena verze:
- Hesla se hashuji pomoci SHA-256 (WebCrypto API) + salt
- V produkci se MUSI pouzit argon2 na serveru
- localStorage NENI bezpecne uloziste pro hesla — toto je pouze demo

### B2. API kontrakty (endpointy)

Pro budouci backend:

```
# Auth
POST   /api/auth/register                -> registrace
POST   /api/auth/login                   -> prihlaseni
POST   /api/auth/logout                  -> odhlaseni
POST   /api/auth/forgot-password         -> zapomenute heslo (posle email)
POST   /api/auth/reset-password          -> reset hesla (s tokenem)
POST   /api/auth/verify-email            -> verifikace emailu
POST   /api/auth/magic-link              -> odeslani magic linku
POST   /api/auth/magic-link/verify       -> overeni magic linku
POST   /api/auth/google                  -> Google OAuth callback
GET    /api/auth/me                      -> aktualni uzivatel (session check)

# Customer profil
GET    /api/customer/profile              -> profil zakaznika
PUT    /api/customer/profile              -> uprava profilu
PUT    /api/customer/password             -> zmena hesla
DELETE /api/customer/account              -> smazani uctu (GDPR)
GET    /api/customer/export               -> export dat (GDPR)

# Adresy
GET    /api/customer/addresses            -> seznam adres
POST   /api/customer/addresses            -> pridani adresy
PUT    /api/customer/addresses/:id        -> uprava adresy
DELETE /api/customer/addresses/:id        -> smazani adresy

# Objednavky
GET    /api/customer/orders               -> seznam objednavek
GET    /api/customer/orders/:id           -> detail objednavky
POST   /api/customer/orders/:id/reorder   -> opakovat objednavku

# Modely
GET    /api/customer/models               -> knihovna modelu
POST   /api/customer/models               -> ulozeni modelu
DELETE /api/customer/models/:id           -> smazani modelu
PUT    /api/customer/models/:id           -> uprava (display_name, tags)

# Dokumenty
GET    /api/customer/orders/:id/invoice   -> stazeni faktury (PDF)
GET    /api/customer/orders/:id/receipt   -> stazeni potvrzeni
```

**POST /api/auth/register — Request:**
```json
{
  "email": "jan@example.cz",
  "password": "SecurePass123",
  "first_name": "Jan",
  "last_name": "Novak",
  "newsletter": true,
  "gdpr_consent": true
}
```

**Response (success):**
```json
{
  "success": true,
  "customer_id": "cust_uuid_1",
  "message": "Registrace uspesna. Overovaci email odeslan.",
  "requires_verification": true
}
```

**POST /api/auth/login — Request:**
```json
{
  "email": "jan@example.cz",
  "password": "SecurePass123"
}
```

**Response (success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "customer": {
    "id": "cust_uuid_1",
    "email": "jan@example.cz",
    "first_name": "Jan",
    "last_name": "Novak"
  },
  "expires_at": "2025-01-22T08:00:00Z"
}
```

**Error responses:**
- 400: `INVALID_CREDENTIALS` — nespravny email nebo heslo
- 400: `EMAIL_NOT_VERIFIED` — email neni overeny
- 429: `TOO_MANY_ATTEMPTS` — prilis mnoho pokusu (lockout)
- 400: `ACCOUNT_LOCKED` — ucet zamcen
- 400: `EMAIL_ALREADY_EXISTS` — email uz je registrovany

### B3. Komponentni strom (React)

```
Auth stranky:
src/pages/customer-auth/
  CustomerLogin.jsx                      -- prihlaseni zakaznika
  CustomerRegister.jsx                   -- registrace zakaznika
  CustomerForgotPassword.jsx             -- zapomenute heslo
  CustomerResetPassword.jsx              -- reset hesla (s tokenem)
  CustomerVerifyEmail.jsx                -- verifikace emailu
  CustomerMagicLink.jsx                  -- magic link prihlaseni
  components/
    PasswordStrengthMeter.jsx            -- real-time sila hesla (zxcvbn)
    SocialLoginButton.jsx                -- Google login tlacitko
    AuthLayout.jsx                       -- layout pro auth stranky (logo, background)
    TermsCheckbox.jsx                    -- souhlas s podminkami

Portal stranky:
src/pages/customer-portal/
  CustomerLayout.jsx                     -- layout s navigaci (sidebar/top)
  CustomerDashboard.jsx                  -- hlavni prehled (/portal)
  CustomerOrders.jsx                     -- seznam objednavek (/portal/orders)
  CustomerOrderDetail.jsx                -- detail objednavky (/portal/orders/:id)
  CustomerModels.jsx                     -- knihovna modelu (/portal/models)
  CustomerAddresses.jsx                  -- sprava adres (/portal/addresses)
  CustomerSettings.jsx                   -- nastaveni uctu (/portal/settings)
  CustomerDocuments.jsx                  -- faktury a dokumenty (/portal/documents)
  components/
    CustomerNavigation.jsx               -- sidebar/top navigace
    DashboardStats.jsx                   -- stat karty (objednavky, aktivni, celkem)
    ActiveOrdersWidget.jsx               -- widget aktivnich objednavek
    QuickActions.jsx                     -- rychle akce (nova objednavka, podpora)
    OrderCard.jsx                        -- karta objednavky v seznamu
    OrderStatusProgress.jsx              -- progress bar stavu objednavky
    OrderItemRow.jsx                     -- radek polozky v detailu objednavky
    OrderPriceSummary.jsx                -- cenovy souhrn objednavky
    OrderAddresses.jsx                   -- dodaci a fakturacni adresa
    OrderActions.jsx                     -- akce (chat, faktura, objednat znovu)
    ModelCard.jsx                        -- karta modelu v knihovne
    ModelUploadButton.jsx                -- upload noveho modelu do knihovny
    AddressCard.jsx                      -- karta adresy
    AddressEditor.jsx                    -- formular pro adresu
    ProfileForm.jsx                      -- formular profilu
    ChangePasswordForm.jsx               -- formular zmeny hesla
    AccountDeletionDialog.jsx            -- dialog pro smazani uctu (GDPR)
    DataExportButton.jsx                 -- tlacitko pro export dat (GDPR)
    NotificationPreferences.jsx          -- nastaveni notifikaci

Guard:
src/components/
  CustomerPrivateRoute.jsx               -- route guard pro zakaznicke stranky
  CustomerAuthProvider.jsx               -- context provider pro zakaznicky auth (oddeleny od admin)
```

### B4. Tenant storage namespace

- **Namespace:** `customers:v1`
- **Helper:** `src/utils/adminCustomersStorage.js` (novy soubor)

**Public API helperu:**
```javascript
// Auth
export function registerCustomer(registrationData)
export function loginCustomer(email, password)
export function logoutCustomer(sessionId)
export function verifyEmail(token)
export function requestPasswordReset(email)
export function resetPassword(token, newPassword)
export function generateMagicLink(email)
export function verifyMagicLink(token)
export function loginWithGoogle(googleProfile)

// Session management
export function createSession(customerId)
export function validateSession(token)
export function refreshSession(token)
export function invalidateSession(sessionId)
export function invalidateAllSessions(customerId)

// Customer CRUD
export function loadCustomer(customerId)
export function updateCustomerProfile(customerId, updates)
export function changePassword(customerId, oldPassword, newPassword)
export function deleteCustomerAccount(customerId)   // GDPR
export function exportCustomerData(customerId)       // GDPR

// Adresy
export function loadAddresses(customerId)
export function saveAddress(customerId, addressData)
export function deleteAddress(customerId, addressId)
export function setDefaultAddress(customerId, addressId, addressType)

// Modely
export function loadSavedModels(customerId)
export function saveModel(customerId, modelData)
export function deleteModel(customerId, modelId)
export function updateModelMeta(customerId, modelId, updates)

// Objednavky (read-only pro zakaznika)
export function loadCustomerOrders(customerId)
export function loadCustomerOrderDetail(customerId, orderId)
export function reorderFromOrder(customerId, orderId)

// Admin pohled na zakazniky
export function loadAllCustomers()
export function getCustomerStats()

// Normalizace
export function normalizeCustomer(input)
export function normalizeAddress(input)
export function normalizeSavedModel(input)

// Default config
export function getDefaultCustomersConfig()
export function loadCustomersConfig()
export function saveCustomersConfig(config)

// Password utilities
export function hashPassword(password)
export function verifyPassword(password, hash)
export function generateToken(purpose, expirationMinutes)
export function validateToken(token, purpose)
export function evaluatePasswordStrength(password)
```

### B5. Widget integrace (postMessage)

Portal neni primo soucast widgetu (kalkulacky). Ale propojeni existuje:

```javascript
// Kalkulacka -> Portal (zakaznik se chce prihlasit)
window.parent.postMessage({
  type: 'MODELPRICER_AUTH_REQUIRED',
  payload: { return_url: '/test-kalkulacka', context: 'checkout' }
}, '*');

// Portal -> Kalkulacka (zakaznik prihlasen — autofill kontaktnich udaju)
widget.contentWindow.postMessage({
  type: 'MODELPRICER_CUSTOMER_AUTHENTICATED',
  payload: {
    customer_id: 'cust_uuid_1',
    email: 'jan@example.cz',
    first_name: 'Jan',
    last_name: 'Novak',
    default_shipping_address: { ... },
    default_billing_address: { ... }
  }
}, widgetOrigin);

// Kalkulacka -> Portal (model ulozen do knihovny)
window.parent.postMessage({
  type: 'MODELPRICER_SAVE_MODEL',
  payload: {
    filename: 'benchy.stl',
    file_data: '...',
    customer_id: 'cust_uuid_1'
  }
}, '*');
```

### B6. Pricing engine integrace

Zakaznicky portal **primo neinteraguje** s pricing engine. Neprime interakce:
- **Opakovat objednavku:** Portal nacte konfiguraci z puvodni objednavky a preda ji kalkulacce (pres URL params nebo state)
- **Zakaznicky kupony:** Portal muze zobrazit dostupne kupony pro zakaznika (S10)
- **Cenova historie:** Portal muze zobrazit cenovy vyvoj objednavek zakaznika (cte z orders)

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-mid-storage-tenant` | `adminCustomersStorage.js` — zakaznicky storage | `src/utils/adminCustomersStorage.js` | P0 |
| `mp-sr-security` | **SECURITY REVIEW** — architektura auth systemu | — (review dokument) | P0 |
| `mp-spec-security-auth` | Auth logika — register, login, token management | `src/utils/adminCustomersStorage.js` (auth cast) | P0 |
| `mp-spec-security-gdpr` | GDPR compliance — smazani uctu, export dat | `src/utils/adminCustomersStorage.js` (gdpr cast) | P1 |
| `mp-mid-frontend-admin` | Admin pohled na zakazniky | `src/pages/admin/AdminCustomers.jsx` | P1 |
| `mp-mid-frontend-public` | Portal layout + routing | `src/pages/customer-portal/CustomerLayout.jsx` | P0 |
| `mp-spec-fe-forms` | Registrace, login, profil, adresa formulare | `src/pages/customer-auth/*.jsx`, `src/pages/customer-portal/components/*.jsx` | P0 |
| `mp-spec-fe-tables` | Seznam objednavek, seznam adres | `src/pages/customer-portal/CustomerOrders.jsx` | P1 |
| `mp-spec-fe-routing` | Portal routes (/portal/*, /auth/*) | `src/Routes.jsx` | P0 |
| `mp-spec-fe-state` | CustomerAuthProvider context | `src/components/CustomerAuthProvider.jsx` | P0 |
| `mp-spec-fe-checkout` | Reorder logika | `src/pages/customer-portal/components/OrderActions.jsx` | P2 |
| `mp-spec-fe-upload` | Model upload do knihovny | `src/pages/customer-portal/components/ModelUploadButton.jsx` | P2 |
| `mp-mid-security-app` | Security audit celeho portalu | * | P0 (gate) |
| `mp-mid-quality-code` | Code review | * | P0 (gate) |
| `mp-spec-test-unit` | Unit testy auth, storage | `src/__tests__/` | P0 |
| `mp-spec-test-e2e` | E2E testy registrace, login, portal flow | `tests/e2e/` | P1 |

### C2. Implementacni kroky (poradi)

```
FAZE 0 — Security design review (POVINNE pred implementaci)
  0.1 [mp-sr-security] Architekturalni review auth systemu
      - Rozhodnuti: Firebase Auth vs vlastni auth
      - Token format a expirace
      - Password policy
      - Session management strategie
      - GDPR plan
      BLOCKING — nic dalsiho nezacina dokud toto neni schvaleno

FAZE 1 — Auth zaklad (sekvencni)
  1.1 [mp-mid-storage-tenant] adminCustomersStorage.js
      - Schema normalizace, default config
      - CRUD pro zakazniky, adresy, modely
      - Seed data: 3 demo zakazniky s adresami a objednavkami
      Zavislost: 0.1

  1.2 [mp-spec-security-auth] Auth logika
      - registerCustomer: email validace, password hash, verifikacni token
      - loginCustomer: credential check, session vytvoreni, lockout logika
      - Password utilities: hash, verify, strength
      - Token utilities: generate, validate, expire
      - Session management: create, validate, refresh, invalidate
      Zavislost: 1.1

  1.3 [mp-spec-fe-state] CustomerAuthProvider
      - React context pro zakaznicky auth (oddeleny od admin AuthContext)
      - useCustomerAuth() hook
      - Session persistence (localStorage token)
      - Auto-logout pri expiraci
      Zavislost: 1.2

FAZE 2 — Auth UI (paralelne po Fazi 1)
  2.1 [mp-spec-fe-routing] Portal routes
      - /auth/login, /auth/register, /auth/forgot-password, /auth/reset-password/:token
      - /auth/verify-email/:token, /auth/magic-link/:token
      - /portal, /portal/orders, /portal/orders/:id, /portal/models
      - /portal/addresses, /portal/settings, /portal/documents
      - CustomerPrivateRoute guard
      Zavislost: 1.3

  2.2 [mp-spec-fe-forms] CustomerRegister.jsx
      - Email + heslo + jmeno
      - PasswordStrengthMeter (real-time)
      - TermsCheckbox (GDPR souhlas)
      - SocialLoginButton (Google)
      - Email verifikace flow
      Zavislost: 1.2, 2.1

  2.3 [mp-spec-fe-forms] CustomerLogin.jsx
      - Email + heslo
      - "Zapomli jste heslo?" link
      - "Prihlasit se pres Google" tlacitko
      - "Magic link" alternativa
      - Lockout informace
      Zavislost: 1.2, 2.1

  2.4 [mp-spec-fe-forms] CustomerForgotPassword + CustomerResetPassword
      - Email input -> odesle token emailem
      - Token link -> novy heslo formular
      Zavislost: 1.2, 2.1

FAZE 3 — Portal UI (paralelne po Fazi 2)
  3.1 [mp-mid-frontend-public] CustomerLayout.jsx
      - Sidebar/top navigace
      - Responsivni layout
      - Zakaznikuv header (jmeno, avatar, odhlaseni)
      Zavislost: 1.3, 2.1

  3.2 [mp-mid-frontend-public] CustomerDashboard.jsx
      - Stat karty: objednavky, aktivni, celkem
      - Widget aktivnich objednavek
      - Rychle akce
      Zavislost: 3.1

  3.3 [mp-spec-fe-tables] CustomerOrders.jsx
      - Filtrovatelny seznam objednavek
      - OrderCard s progress barem
      - Pagination
      Zavislost: 3.1

  3.4 [mp-spec-fe-tables] CustomerOrderDetail.jsx
      - Polozky s thumbnaily
      - Cenovy rozpis
      - Stav (progress bar)
      - Adresy
      - Akce: Chat, Faktura, Objednat znovu
      Zavislost: 3.3

  3.5 [mp-spec-fe-forms] CustomerAddresses.jsx
      - Seznam adres (karty)
      - AddressEditor (formular)
      - Default address oznaceni
      Zavislost: 3.1

  3.6 [mp-spec-fe-forms] CustomerSettings.jsx
      - ProfileForm (jmeno, email, telefon, firma)
      - ChangePasswordForm
      - NotificationPreferences
      - AccountDeletionDialog (GDPR)
      - DataExportButton (GDPR)
      Zavislost: 3.1

  3.7 [mp-spec-fe-upload] CustomerModels.jsx
      - Grid/list modelu
      - Upload noveho modelu
      - Smazani, prejmenovani, tagging
      Zavislost: 3.1

FAZE 4 — Admin pohled + GDPR (po Fazi 3)
  4.1 [mp-mid-frontend-admin] AdminCustomers.jsx
      - Seznam vsech zakazniku (tabulka)
      - Detail zakaznika (objednavky, komunikace, statistiky)
      - Akce: deaktivovat ucet, resetovat heslo
      Zavislost: 1.1

  4.2 [mp-spec-security-gdpr] GDPR compliance
      - Smazani uctu: anonymizace dat, zachovani fakturacnich udaju (zakonna povinnost)
      - Export dat: JSON format vsech zakaznikovych dat
      - Souhlas management: zaznam gdpr_consent_at
      Zavislost: 1.1

FAZE 5 — Quality gates
  5.1 [mp-sr-security] FINALNI security audit
  5.2 [mp-mid-security-app] Penetration testing (manual)
  5.3 [mp-mid-quality-code] Code review
  5.4 [mp-spec-test-unit] Unit testy (auth, storage, GDPR)
  5.5 [mp-spec-test-e2e] E2E testy (registrace, login, portal flow)
  5.6 [mp-spec-test-build] Build verification
```

### C3. Kriticke rozhodovaci body

1. **Firebase Auth vs vlastni auth?** Moznosti:
   - a) Firebase Auth pro zakazniky (jako pro adminy) — jednodussi, bezpecnejsi
   - b) Vlastni auth v localStorage — flexibilni, ale bezpecnostne rizikove
   - **Rozhodnuti: varianta a) pro produkci, varianta b) pro demo (Varianta A)**
   - Pro Variantu A: zjednoduseny auth v localStorage s SHA-256 hash (DEMO ONLY varovanim)

2. **Spolecny nebo oddeleny auth context?** Rozhodnuti: **ODDELENY**. CustomerAuthProvider je oddeleny od admin AuthContext. Duvody: ruzne role, ruzna session expirace, ruzna data.

3. **Jak propojit zakazniky s objednavkami?** Rozhodnuti: Match pres email. Existujici objednavky v `orders:v1` maji `customer_snapshot.email` — pri registraci se automaticky propoji s timto emailem.

4. **Knihovna modelu — kde ulozit soubory?** Pro Variantu A: reference na soubor (ne soubor samotny — localStorage limit). Pro produkci: Firebase Storage / S3.

5. **GDPR smazani uctu — co s objednavkami?** Rozhodnuti: Objednavky zustavaji (zakonna povinnost ucetnictvi 10 let) ale zakaznicke udaje se anonymizuji: email = "deleted_user_{id}@anon", jmeno = "Smazany zakaznik", adresa = null.

6. **Magic link expirace?** Rozhodnuti: 15 minut. Jednorazovy. Po pouziti se automaticky zneplatni.

### C4. Testovaci strategie

**Unit testy (KRITICKE — auth testy):**
- `customerAuth.test.js`:
  - Registrace: validni data, duplicitni email, slabe heslo, chybejici GDPR souhlas
  - Login: spravne credentials, nespravne credentials, nezverifikovany email, zamceny ucet
  - Lockout: 5 neuspesnych pokusu -> zamceni na 15 min
  - Password: hash/verify, strength evaluation, zmena hesla
  - Token: generovani, validace, expirace, revokace
  - Session: vytvoreni, validace, refresh, invalidace, auto-expire
  - Magic link: generovani, overeni, expirace, single-use
  - GDPR: smazani uctu (data anonymizovana, objednavky zachovany), export dat

**Unit testy (adminCustomersStorage.test.js):**
- CRUD zakazniky, adresy, modely
- Normalizace vstupu
- Edge cases: prazdny email, prilis dlouhe jmeno, nevalidni country_code
- Propojeni zakazniku s objednavkami pres email

**E2E testy:**
- Registrace -> email verifikace -> prihlaseni -> dashboard
- Login -> zobrazeni objednavek -> detail objednavky
- Login -> sprava adres -> pridani/editace/smazani
- Login -> nastaveni -> zmena hesla -> re-login s novym heslem
- Login -> smazani uctu -> potvrzeni -> presmerovani na login
- Neuspesny login (5x) -> lockout -> po 15 min unlock
- Zapomenute heslo -> email -> reset -> login s novym heslem
- Google login -> automaticka registrace -> dashboard

**Security testy (POVINNE):**
- Brute-force login protection
- Token tampering (zmeneny token neni validni)
- Session hijacking (cizi session neni validni)
- IDOR (zakaznik nemuze pristupit k cizi objednavce)
- XSS v profile/adrresach
- CSRF ochrana na vsech POST endpointech
- Password neni v plain textu v storage

### C5. Migrace existujicich dat

**Migrace existujicich objednavek:**
Existujici objednavky v `orders:v1` maji `customer_snapshot` s emailem. Pri registraci zakaznika:

```javascript
function linkExistingOrdersToCustomer(customerId, email) {
  const orders = loadOrders();
  const customerOrders = orders.filter(
    o => o.customer_snapshot?.email?.toLowerCase() === email.toLowerCase()
  );

  // Pridat customer_id do objednavek
  for (const order of customerOrders) {
    order.customer_id = customerId;
  }

  if (customerOrders.length > 0) {
    saveOrders(orders);
  }

  return customerOrders.length;
}
```

**Zpetna kompatibilita:**
- Objednavky bez `customer_id` stale funguji (anonymni objednavky)
- Admin pohled na objednavky se nemeni
- Novy sloupec "Zakaznik" v admin orders tabulce (link na profil pokud registrovan)

---

## D. KVALITA

### D1. Security review body

**KRITICKE — toto je nejdulezitejsi security sekce v celem projektu:**

- **Password hashing:**
  - Produkce: argon2id s doporucenymi parametry (m=65536, t=3, p=4)
  - Varianta A: SHA-256 + random salt (WebCrypto API) — DEMO ONLY
  - Nikdy: MD5, SHA-1, plain text, bcrypt s nizky cost factor

- **Session management:**
  - Token: JWT s HS256 (secret v env var, ne v kodu)
  - Expirace: 7 dni (default), konfigurovatelne adminem
  - Refresh: sliding window (kazdou aktivitou se prodluzuje)
  - Invalidace: logout, zmena hesla, smazani uctu
  - Storage: httpOnly cookie (produkce), localStorage (Varianta A demo)

- **Brute-force ochrana:**
  - Max 5 pokusu za 15 minut na email
  - Progresivni delay: 1s, 2s, 4s, 8s, 16s
  - Lockout na 15 minut po 5 neuspesnych pokusech
  - Email notifikace pri 3+ neuspesnych pokusech

- **Email verifikace:**
  - Token: crypto.randomUUID()
  - Expirace: 24 hodin
  - Single-use (po overeni se zneplatni)
  - Re-send: max 3x za hodinu (rate limit)

- **Password reset:**
  - Token: crypto.randomUUID()
  - Expirace: 1 hodina
  - Single-use
  - Invaliduje vsechny existujici sessions

- **Magic link:**
  - Token: crypto.randomUUID()
  - Expirace: 15 minut
  - Single-use
  - Novy login invaliduje stary magic link

- **IDOR (Insecure Direct Object Reference):**
  - Vsechny endpointy musi overovat ze `customer_id` odpovida session
  - Zakaznik nesmi pristupovat k cizim objednavkam/adresam/modelum
  - Priklad: `GET /api/customer/orders/:orderId` musi overit ze order patri zakaznikovi

- **Input validace:**
  - Email: RFC 5322 format + DNS MX record check (produkce)
  - Heslo: min 8 znaku, alespon 1 velke pismeno, 1 cislo
  - Jmeno: max 100 znaku, bez HTML taqu
  - Telefon: international format (+420...)
  - Adresa: povinne pole (ulice, mesto, PSC, zeme)

- **GDPR compliance:**
  - Pravo na pristup: export vsech dat v JSON
  - Pravo na vymaz: anonymizace + smazani nefakturacnich dat
  - Pravo na prenositelnost: export ve strojove citelnem formatu
  - Souhlas: explicitni checkbox pri registraci
  - Data retention: automaticke smazani neaktivnich uctu po 2 letech

### D2. Performance budget

- **Login:** < 200ms (hash verify + session create)
- **Registration:** < 500ms (hash + token generate + email send)
- **Dashboard load:** < 300ms (customer data + recent orders)
- **Orders list:** < 200ms pro 100 objednavek (pagination)
- **Order detail:** < 100ms (single order lookup)
- **Address CRUD:** < 50ms
- **Model library:** < 200ms pro 50 modelu (bez file dat)
- **Session validate:** < 10ms (token check)
- **Password strength:** < 50ms (zxcvbn)

### D3. Accessibility pozadavky

- **Auth formulare:**
  - Vsechny inputy s `label` a `aria-required`
  - Password field s toggle visibility (oko ikona)
  - Error messages s `aria-describedby` a `role="alert"`
  - Focus management: po chybe focus na prvni chybny input
  - Tab order: logicky (email -> heslo -> submit)

- **Portal navigace:**
  - Skip-to-content link
  - Sidebar s `nav` elementem a `aria-current="page"`
  - Responsivni: hamburger menu s `aria-expanded`

- **Order status:**
  - Progress bar s `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
  - Barevne stavy + text (ne jen barva)

- **Formulare (adresy, profil):**
  - `autocomplete` atributy (name, email, tel, street-address, postal-code, country)
  - `inputmode` pro telefon a PSC

### D4. Error handling a edge cases

- **Registrace s existujicim emailem:** "Tento email je jiz registrovan. Chcete se prihlasit?"
- **Slabe heslo:** Real-time feedback s konkretnimi navrhy (ne "slabe heslo" ale "pridejte velke pismeno")
- **Email verifikace expirovana:** "Overovaci odkaz vyprsel. Odeslat novy?" s tlacitkem
- **Nespravne heslo (5x):** "Ucet docasne zamcen. Zkuste to za 15 minut nebo pouzijte 'Zapomenute heslo'."
- **Session expired:** Tiche presmerovani na login s return_url
- **Offline stav:** Portal stranky musi fungovat alespon pro cteni (cached data)
- **Prazdny ucet:** Dashboard zobrazi onboarding message misto prazdneho obsahu
- **Neexistujici objednavka:** 404 stranka s odkazem zpet na seznam
- **Google login fail:** Fallback na email registraci s vysvetlenim
- **GDPR smazani:** Druhy potvrzovaci dialog s textem "Tato akce je nevratna"

### D5. i18n pozadavky

- Vsechny texty i18n-ready (cs.json, en.json)
- Formular labels a placeholder lokalizovane
- Error messages lokalizovane (cele vety, ne skladane)
- Datumove a casove formaty podle locale
- Mena podle zakaznikovy preference (`preferred_currency`)
- Telefonni format podle zeme (international)
- Adresni format podle zeme (CZ: ulice, mesto, PSC vs US: street, city, state, ZIP)
- GDPR texty v jazyce zakaznika

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

```javascript
const FEATURE_FLAGS = {
  customer_portal_enabled: true,       // celkovy toggle
  registration_enabled: true,          // registrace
  social_login_enabled: false,         // Google OAuth (off pro MVP)
  magic_link_enabled: false,           // magic link (off pro MVP)
  model_library_enabled: true,         // knihovna modelu
  reorder_enabled: true,               // opakovat objednavku
  account_deletion_enabled: true,      // GDPR smazani
  data_export_enabled: true,           // GDPR export
  admin_customer_view_enabled: true,   // admin pohled na zakazniky
};
```

**Postupne nasazeni:**
1. **Faze A:** Auth zaklad — registrace email+heslo, login, email verifikace
2. **Faze B:** Portal zaklad — dashboard, objednavky, adresy, nastaveni
3. **Faze C:** Knihovna modelu + Opakovat objednavku
4. **Faze D:** Social login (Google) + Magic link
5. **Faze E:** Admin pohled na zakazniky + GDPR compliance
6. **Faze F:** Security audit + penetration testing

### E2. Admin UI zmeny

- **Nova polozka v sidebar:** "Zakaznici" (ikona: Users) — pod "Objednavky"
- **AdminCustomers.jsx:** Seznam zakazniku s detailem
- **AdminOrders.jsx:** Novy sloupec "Zakaznik" s odkazem na profil
- **AdminDashboard.jsx:** Widget "Novi zakaznici tento tyden" + "Registrovani vs neregistrovani"
- **Admin nastaveni:** Sekce "Zakaznicky portal" — registrace on/off, social login, password policy

### E3. Widget zmeny

- **Kalkulacka:** Volitelne "Prihlaste se" tlacitko pro auto-fill kontaktnich udaju
- **Checkout:** Pokud je zakaznik prihlasen, prepopulovat adresy a kontaktni udaje
- **Po objednavce:** "Vytvorte si ucet pro sledovani objednavky" CTA

### E4. Dokumentace pro uzivatele

- **Zakaznicky guide:** "Jak se registrovat" — krok za krokem
- **Zakaznicky guide:** "Jak sledovat objednavku" — portal navigace
- **Zakaznicky guide:** "Jak objednat znovu" — reorder flow
- **Admin guide:** "Jak spravovat zakazniky" — admin pohled
- **Admin guide:** "Jak nastavit zakaznicky portal" — settings, password policy
- **Legal:** "Zasady ochrany osobnich udaju" — GDPR text
- **Legal:** "Obchodni podminky" — terms of service

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Registration rate | > 30% zakazniku se registruje | registrations / unique_customers |
| Login frequency | > 2x mesicne | avg_logins_per_month / registered_customers |
| Portal engagement | > 50% registrovanych pouzije portal mesicne | active_portal_users / registered_customers |
| Repeat order rate | > 25% objednavek od registrovanych | repeat_orders / total_orders_from_registered |
| Reorder conversion | > 15% kliknuti na "Objednat znovu" -> objednavka | reorders / reorder_clicks |
| Self-service rate | > 40% dotazu vyreseno pres portal (ne email/telefon) | portal_resolutions / total_support_contacts |
| Auth security | 0 bezpecnostnich incidentu | security_audit_findings |
| GDPR compliance | 100% zadosti splneno do 30 dni | gdpr_requests_on_time / gdpr_requests_total |
| Model library usage | > 20% registrovanych ulozi model | customers_with_saved_models / registered_customers |
| Google login adoption | > 30% registraci pres Google | google_registrations / total_registrations |
