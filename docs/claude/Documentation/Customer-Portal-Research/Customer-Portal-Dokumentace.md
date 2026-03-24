# Customer Portal — Dokumentace

Verze: 1.0
Datum: 2026-03-22
Obsah: Komplexni popis architekury, komponent, API a bezpecnosti Customer Portal (platforma pro konecne zakazniky 3D tiskaru).

---

## 1. Prehled

### 1.1 Co je Customer Portal

Customer Portal (`/portal/*`) je verejna, chranena cast aplikace ModelPricer ktera slouzi **koncovym zakazinikum** (ne admin uzivatelum). Portal umoznuje zakaznikum:

- **Prihlaseni a registraci** — vytvoreni uctu, nastaveni profilu
- **Spravovani objednavek** — seznam objednavek, detail objednavky, sledovani stavu, kopirovanis predchozich objednavek
- **Knihovnu modelu** — nahrani a uchovani 3D modelu, tagem, organizace
- **Sabe nastaveni (presets)** — ulozeni oblibene kalkulace pro rychle vytvoreni obdobnych objednavek
- **Upravu profilu** — zmena osobnich udaju, jazyka, adresy
- **Support** — kontaktovani podpory, FAQ, zpracovani stiznosti

### 1.2 Proc existuje

**Retence zakazniku:** Zakaznici se vracejiz s vecsi pravdepodobnosti kdyz maji vlastni portal.

**Self-service:** Minimalizace supportnich dotazu — zakaznici videli sami obsah svych objednavek, stav tiskuatd.

**Integrace s novou kalkulackou:** Portal je centrem pro spravovani a sledovani zakaznikova vzorku parametru a historickych objednavek.

**Budouci rozlozeni:** Zaklad pro Phase 2 (3D nahled, team accounts) a Phase 3 (loyalty program, API, webhooks).

### 1.3 Kdo ho pouziva

- **Koncovi zakaznici** — pracovnici 3D tiskoven, manazeri projektu
- **Verejna dostupnost** — registrace bez omezeni (bezpecnost pres tenantId izolace)
- **Opomenout:** Admin uzivatele nemohou pristupovat k customer portalu (redirect na /admin)

---

## 2. Architektura

### 2.1 Struktura zlozek

```
src/
├── pages/portal/                          # Frontend portal stranky
│   ├── CustomerPortalLayout.jsx           # Souprava layout s navigationm (608 lines)
│   ├── CustomerLogin.jsx                  # Prihlasovaci formular (603 lines)
│   ├── CustomerRegister.jsx               # Registracni formular (755 lines)
│   ├── CustomerDashboard.jsx              # Uvodni stranka (594 lines)
│   ├── CustomerOrders.jsx                 # Seznam objednavek (617 lines)
│   ├── CustomerOrderDetail.jsx            # Detail objednavky (788 lines)
│   ├── CustomerModels.jsx                 # Knihovna modelu (666 lines)
│   ├── CustomerPresets.jsx                # Ulozena nastaveni (1249 lines)
│   ├── CustomerProfile.jsx                # Profil zakaznika (646 lines)
│   └── CustomerSupport.jsx                # Support a kontakt (589 lines)
│
├── context/
│   └── CustomerContext.jsx                # State management pro portal (458 lines)
│
├── components/
│   └── CustomerPrivateRoute.jsx           # Protected route wrapper (186 lines)
│
├── services/
│   └── customerApi.js                     # API service layer (278 lines)
│
└── utils/
    └── customerStorage.js                 # Client-side cache (279 lines)

backend-local/src/
├── customerStore.js                       # Backend data store (873 lines)
├── routes/
│   └── customerPortal.js                  # API routes (719 lines)
└── customers/                             # JSON persistence per tenant
    ├── {tenantId}.json
    ├── ...
```

### 2.2 Systemy a technologie

| Komponenta | Technologie | Popis |
|------------|-------------|-------|
| **Frontend** | React 18, React Router 6 | SPA s lazy-loading stranky |
| **State Management** | useContext, useReducer | Lokalni state portal (profile, orders) |
| **Client Cache** | localStorage + TTL | Offline resilience, rychlejsi renderovani |
| **HTTP Client** | axios (apiClient) | Normalizovane error handling |
| **Backend Storage** | JSON (per-tenant) | Jednoduche, tenant-isolated datove uloziste |
| **Backend API** | Express, middleware (auth, validate, rateLimit) | RESTful endpointy |
| **i18n** | react-i18next | Ceska a anglicka lokalizace |
| **Forms** | react-hook-form + zod | Validace formularu |
| **UI Components** | Forge Design System | Konzistentni vzhled s admin panelem |
| **Auth** | Firebase Auth (vlastni) | Customer role oddelena od admin role |

### 2.3 Auth flow

```
Login/Register (bez auth) → Firebase auth → Token vygenerovan
                                  ↓
                          Portal loaded
                                  ↓
                 CustomerPrivateRoute overit token
                                  ↓
                   currentUser.role = "customer"?
                          YES ↓ NO
                              ↓
                    Redirect /portal/login
                                  ↓
                      CustomerProvider
                   (initnulizuje customer context)
                                  ↓
                  Pristup k portal routam
                   (/portal/* protected)
```

### 2.4 Data flow — Load profilu a objednavek

```
useCustomer() v komponentě
         ↓
CustomerContext.useEffect (auth zmena)
         ↓
customerApi.fetchCustomerProfile() → apiClient → GET /api/customer/profile
         ↓
Backend: requireAuth + requireTenant middleware → customerId z JWT
         ↓
customerStore.getCustomerProfile(workspaceRoot, tenantId, customerId)
         ↓
Vraci { ok: true, data: profile }
         ↓
CustomerContext state update → komponenta re-render
         ↓
customerStorage.writeCustomerCache() — cache do localStorage s TTL
```

---

## 3. Routing

### 3.1 Verejne routy (bez ochran)

| Route | Komponenta | Obsah |
|-------|-----------|-------|
| `/portal/login` | CustomerLogin | Prihlasovaci formular (email + heslo, Google Sign-In) |
| `/portal/register` | CustomerRegister | Registracni formular s validaci emailu a hesla |

### 3.2 Chranene routy (vykazuji CustomerPrivateRoute)

Vsechny cesty zacinama `/portal/` (bez login/register) jsou chranene:

| Route | Komponenta | Obsah |
|-------|-----------|-------|
| `/portal` | CustomerPortalLayout + CustomerDashboard | Uvodni stranka — welcome, statistiky, posledni objednavky |
| `/portal/orders` | CustomerOrders | Seznam vsech objednavek s filtrem a paginaci |
| `/portal/orders/:id` | CustomerOrderDetail | Detail jedne objednavky — polozky, ceny, stav |
| `/portal/models` | CustomerModels | Knihovna natikrehovanych modelu — upload, tagem, smazani |
| `/portal/presets` | CustomerPresets | Ulozena nastaveni kalkulace — ulozeni, editace, aplikace |
| `/portal/profile` | CustomerProfile | Profil zakaznika — jmeno, telefon, jazyk, adresy |
| `/portal/support` | CustomerSupport | Support — FAQ, kontakt, nahlaseni problemu |

### 3.3 Routy v Routes.jsx

```javascript
// src/Routes.jsx

// Lazy loading
const CustomerPortalLayout = React.lazy(() => import('./pages/portal/CustomerPortalLayout'));
const CustomerDashboard = React.lazy(() => import('./pages/portal/CustomerDashboard'));
const CustomerOrders = React.lazy(() => import('./pages/portal/CustomerOrders'));
// ... dalsi

// V hlavnim routeru
<Route path="/portal/login" element={<Suspense><CustomerLogin /></Suspense>} />
<Route path="/portal/register" element={<Suspense><CustomerRegister /></Suspense>} />

// Protected (v CustomerPrivateRoute)
<Route path="/portal" element={<ErrorBoundary><CustomerPrivateRoute /></ErrorBoundary>}>
  <Route index element={<Suspense><CustomerDashboard /></Suspense>} />
  <Route path="orders" element={<Suspense><CustomerOrders /></Suspense>} />
  <Route path="orders/:id" element={<Suspense><CustomerOrderDetail /></Suspense>} />
  <Route path="models" element={<Suspense><CustomerModels /></Suspense>} />
  <Route path="presets" element={<Suspense><CustomerPresets /></Suspense>} />
  <Route path="profile" element={<Suspense><CustomerProfile /></Suspense>} />
  <Route path="support" element={<Suspense><CustomerSupport /></Suspense>} />
</Route>
```

---

## 4. Komponenty

### 4.1 Layout

#### **CustomerPortalLayout.jsx** (608 lines)

Matka layout pro cely portal — navigacni menu, header, footer, suspense fallback.

**Zodpovednosti:**
- Render hlavniho navigation (stranky, profil, logout)
- Header s logem a breadcrumbs
- Sidebar (mobilni collapsible)
- Footer s copyrighty a linky
- Outlet pro vnorene routy

**Props:** Nema (use useCustomer, useAuth internim)

**State:**
- `sidebarOpen` — mobilni menu toggle
- `currentPage` — aktivni stranka

**Dulezite:**
- Responsive layout — desktop (sidebar vlevo) vs mobile (hamburgr menu)
- Forge design system CSS variabli

---

### 4.2 Autentizace

#### **CustomerLogin.jsx** (603 lines)

Prihlasovaci formular — email + heslo nebo Google Sign-In.

**Zodpovednosti:**
- Formular se validaci (zod schema)
- Firebase auth integraci (signInWithEmail + Google)
- Error handling — neplatny email, spathe heslo, 2FA
- Redirect na /portal po uspesnem login

**Props:** Nema

**State:**
- `formState` z useForm (email, password)
- `error` — chybova zprava
- `isLoading` — loading state beh sign-in

**Dulezite:**
- Validation schema: email regex, heslo >6 znaku
- Google Sign-In button — openID Connect
- Zapomenute heslo — link na reset
- Redirect pred login (z query state)

---

#### **CustomerRegister.jsx** (755 lines)

Registracni formular — jmeno, email, heslo, potvrzeni.

**Zodpovednosti:**
- Formular se validaci (zod)
- Firebase createUserWithEmailAndPassword
- Overeni dostupnosti emailu (backend check)
- Vytvoreni inicialniho profilu v customerStore
- Automaticky login po registraci

**Props:** Nema

**State:**
- `formState` (firstName, lastName, email, password, passwordConfirm)
- `error` — selhani registrace
- `isLoading` — loading state

**Dulezite:**
- Heslo-confirmation — musi se shodovat
- Email validation — asynchronni check na backendu
- Terms & conditions — checkbox
- Captcha (opcjonalne pro budoucnost)

---

### 4.3 Aplikacni stranky

#### **CustomerDashboard.jsx** (594 lines)

Uvodni stranka portalu — welcome, statistiky, posledni objednavky, rychle akce.

**Zodpovednosti:**
- Nacteni profilu a poslednih objednavek (5 nejnovejsich)
- Zobrazeni statistik (total orders, total spent, saved models, active orders)
- Rychle akce — nova objednavka, upload modelu, kontakt support
- Skeleton loading — beh nacteni dat

**Props:** Nema

**State:**
- `stats` — stats data (useCustomer)
- `recentOrders` — seznam posledni 5 objednavek
- `loading` — loading state

**Dulezite:**
- Stats karty — ForgeStatCard komponenty
- Empty state — kdyz nema objednavky
- Responsive — mobile optimizovano
- i18n — vsechny labely preloziatelne

---

#### **CustomerOrders.jsx** (617 lines)

Seznam vsech objednavek s filtrem a paginaci.

**Zodpovednosti:**
- Nacteni seznamu objednavek (get /api/customer/orders)
- Filtr: status (NEW, CONFIRMED, IN_PRODUCTION, SHIPPED, DELIVERED, CANCELED)
- Paginace — default 10/stranu
- Sorting — podle data, ceny
- Klik na objednavku → detail

**Props:** Nema

**State:**
- `orders` — seznam objednavek
- `filter` — { status?, dateFrom?, dateTo?, page }
- `total` — celkovy pocet objednavek
- `loading` — nacteni stavu

**Dulezite:**
- ForgeStatusBadge — barva podle stavu
- Empty state — zadne objednavky
- Responsive table / card list (mobile)

---

#### **CustomerOrderDetail.jsx** (788 lines)

Detail jedne objednavky — polozky, ceny, stavova timeline, reorder button.

**Zodpovednosti:**
- Nacteni detailu objednavky (get /api/customer/orders/:id)
- Zobrazeni:
  - Zakladni info (ID, datum, stav)
  - Polozky (modely, tiskare parametry, ceny)
  - Komentare/poznamky
  - Stavova timeline — NEW → CONFIRMED → PRODUCTION → SHIPPED → DELIVERED
  - Total cena, DPH, sleva
- Akce: Download invoice, reorder, kontakt support

**Props:**
- `orderId` z useParams

**State:**
- `order` — full order object
- `loading`, `error`

**Dulezite:**
- Timeline — vizualni reprezentace stavu
- Stav je read-only pro zakaznika
- Invoice — PDF ke stazeni
- Reorder button — zkopiruje polozky do nove objednavky

---

#### **CustomerModels.jsx** (666 lines)

Knihovna natikrehovanych 3D modelu zakaznika.

**Zodpovednosti:**
- Nacteni seznamu modelu (get /api/customer/models)
- Upload modelu (POST /api/customer/models s multipart)
- Prirazeni tagu, popisu
- Smazani modelu (delete /api/customer/models/:id)
- Pouziti modelu — zacit novou objednavku s timto modelem

**Props:** Nema

**State:**
- `models` — seznam modelu
- `uploadProgress` — % progress behem nahravani
- `error` — error message

**Dulezite:**
- Drag-and-drop upload pro mobilitu
- Supportovane formaty: STL, 3MF, OBJ, STEP, STP
- Velka omezeni — max 50 MB na model
- Preview — ulozeni thumbnaileku
- Tagem — max 20 tagu na model

---

#### **CustomerPresets.jsx** (1249 lines)

Ulozena nastaveni kalkulace — ulozeni oblibene kalkulace pro snadne kopirovanis.

**Zodpovednosti:**
- Nacteni seznamu presets (get /api/customer/presets)
- Vytvoreni noveho presetu (save aktualni kalkulace)
- Editace presetu (rename, update parametry)
- Smazani presetu
- Aplikace presetu — nacist nastaveni do kalkulacky
- Export/import JSON

**Props:** Nema

**State:**
- `presets` — seznam ulozeneho nastaveni
- `selectedPreset` — aktualne vybrane
- `editMode` — edit nebo view
- `error`, `loading`

**Dulezite:**
- Preset schema — ulozeni vsech parametru kalkulacky
- Kategorisovani — pojmenovani presets
- Filtrovani — hledani podle nazvu
- Preview — zobrazeni parametru bez editace
- Cloud sync — sync s backendem (ne jen local)

---

#### **CustomerProfile.jsx** (646 lines)

Profil zakaznika — osobni udaje, adresy, nastaven jazyka.

**Zodpovednosti:**
- Nacteni profilu (get /api/customer/profile)
- Editace profilu (PATCH /api/customer/profile)
- Sprava adres (seznam, pridani, editace, smazani)
- Nastaven jazykoveho preference
- Zmena hesla (odkaz na Firebase)
- Smazani uctu (warning dialog)

**Props:** Nema

**State:**
- `profile` — customer profile data
- `addresses` — seznam adres (shipping, billing)
- `formState` z useForm
- `editMode` — edit nebo view
- `error`, `success`

**Dulezite:**
- Validation adresy — PSC, mesto, ulice
- Fyzicka smazani uctu — warning + smazani vsech dat
- Dvoustupnova overovani zmeny emailu (stara adresa + nova adresa)

---

#### **CustomerSupport.jsx** (589 lines)

Support a kontakt — FAQ, formular na zpravu, status support ticketu.

**Zodpovednosti:**
- FAQ secti — caste otazky (clanky)
- Kontaktni formular — zprava, priorita, priloha
- Tracking support ticketu — seznam mych ticketu
- Live chat (opcjonalne) — integraci se Zendeskem

**Props:** Nema

**State:**
- `faqs` — seznam FAQ clanku
- `ticket` — aktualny ticket form state
- `myTickets` — seznam mych ticketu
- `loading`

**Dulezite:**
- i18n FAQ — CZ a EN verze
- Rate limiting — max 5 tickets za den
- Autoreply email
- Escalation — vyrieseni do 24h

---

### 4.4 Infrastruktura

#### **CustomerContext.jsx** (458 lines)

State management pro cely portal — profil, objednavky, modely, notifikace.

**Popis:**
Globalni context poskytujici Customer data a akce pro cely portal. Postaveno na
top useAuth (Firebase) ale s customer-specifickymi daty.

**Provided values:**
```javascript
{
  customerProfile,        // { id, email, firstName, lastName, phone, ... }
  loading,                // boolean — nacteni profilu
  error,                  // error message nebo null

  // Orders
  orders,                 // [ { id, date, status, total, ... } ]
  ordersLoading,
  ordersError,
  refreshOrders,          // async fn — reload orders

  // Models
  models,                 // [ { id, filename, format, fileSize, ... } ]
  modelsLoading,
  saveModel,              // async fn(modelData) — ulozit model
  deleteModel,            // async fn(modelId) — smazat model

  // Presets
  presets,                // [ { id, name, config, ... } ]
  savePreset,             // async fn(presetData)
  deletePreset,           // async fn(presetId)

  // Notifications
  notifications,          // [ { id, type, message, read, ... } ]
  unreadCount,            // number
  markNotificationRead,   // async fn(notifId)
  markAllRead,            // async fn()

  // Addresses
  addresses,              // [ { id, type, street, ... } ]
  saveAddress,            // async fn(addressData)
  deleteAddress,          // async fn(addressId)
}
```

**Internal state:**
- `customerProfile` — from API
- `cachedProfile` — localStorage cache s TTL (10 min)
- `orders` — paginated list
- `models`, `presets`, `notifications` — lists
- `refetchIntervals` — timery pro polling

**Polling:**
- Notifikace — polling kazde 60s (NOTIFICATION_POLL_INTERVAL)
- Order status — polling kazde 5 min kdyz je objednavka IN_PRODUCTION

**Cache:**
- Profile — 10 min TTL
- Orders, Models — 2 min TTL
- Notifications — 1 min (ceste aktualizovano)

**Error handling:**
- Network error → error message do UI
- 401/403 — logout a redirect na /portal/login
- 400 — validation error zprava
- 500 — retry po 5s nebo "kontakt support"

**Mount/Cleanup:**
- Mount: nacist profil, setup polling
- Unmount: stop polling, save cache

---

#### **CustomerPrivateRoute.jsx** (186 lines)

Wrapper pro chranene routy `/portal/*` — overeni auth a role.

**Zodpovednosti:**
- Check `currentUser` z useAuth
- Pokud neni prihlaseny → redirect `/portal/login`
- Pokud je admin → show "access denied" + link na /admin
- Pokud je customer → allow access, render <Outlet />

**Flow:**
```
Loading? → show spinner
Not authenticated? → redirect /portal/login
Admin account? → show access denied page
Customer? → render child routes
```

**Props:** Nema (nested route)

**State:** Nema (Pure wrapper, vykristalizovane z useAuth)

---

#### **customerApi.js** (278 lines)

API service layer — wrapper okolo apiClient (axios) s normalizovanym error handling.

**Architektura:**
```javascript
// Vsechny volani vracejiy { data, error } envelope
async function safeCall(apiCall) {
  try {
    const response = await apiCall();
    return { data: response.data?.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// Kazdou API operaci wrappuje safeCall
export async function fetchCustomerProfile() {
  return safeCall(() => apiClient.get('/customer/profile'));
}
```

**Provided functions:**

| Funkce | Metoda | Endpoint | Parametry |
|--------|--------|----------|-----------|
| `fetchCustomerProfile()` | GET | `/customer/profile` | — |
| `updateCustomerProfile(data)` | PUT | `/customer/profile` | { firstName, lastName, phone, language } |
| `fetchCustomerOrders(params)` | GET | `/customer/orders` | { page, limit, status, sort } |
| `fetchCustomerOrder(id)` | GET | `/customer/orders/:id` | — |
| `reorderOrder(id)` | POST | `/customer/orders/:id/reorder` | — |
| `fetchCustomerModels()` | GET | `/customer/models` | — |
| `saveCustomerModel(data)` | POST | `/customer/models` | { filename, format, fileSize } |
| `updateCustomerModel(id, data)` | PATCH | `/customer/models/:id` | { title, tags, description } |
| `deleteCustomerModel(id)` | DELETE | `/customer/models/:id` | — |
| `fetchCustomerPresets()` | GET | `/customer/presets` | — |
| `saveCustomerPreset(data)` | POST | `/customer/presets` | { name, description, config } |
| `updateCustomerPreset(id, data)` | PATCH | `/customer/presets/:id` | { name, config } |
| `deleteCustomerPreset(id)` | DELETE | `/customer/presets/:id` | — |
| `fetchCustomerAddresses()` | GET | `/customer/addresses` | — |
| `saveCustomerAddress(data)` | POST | `/customer/addresses` | { type, street, city, zip } |
| `updateCustomerAddress(id, data)` | PATCH | `/customer/addresses/:id` | { type, street, city, zip } |
| `deleteCustomerAddress(id)` | DELETE | `/customer/addresses/:id` | — |
| `fetchCustomerNotifications()` | GET | `/customer/notifications` | { page, limit } |
| `markNotificationRead(id)` | PATCH | `/customer/notifications/:id/read` | — |
| `markAllNotificationsRead()` | POST | `/customer/notifications/read-all` | — |

**Error handling:**
- Catch network error → normalize message
- Log error v dev mode
- Return null data + error message

---

#### **customerStorage.js** (279 lines)

Client-side localStorage cache pro portal data — TTL, recently-viewed, drafts.

**Namespace:** `modelpricer:customer:{customerId}:{key}`

**Hlavni funkce:**

| Funkce | Ucel |
|--------|------|
| `getCustomerId()` | Vratit ulozene customerId nebo null |
| `setCustomerId(id)` | Ulozit customerId |
| `clearCustomerId()` | Smazat customerId z storage |
| `readCustomerCache(customerId, key)` | Nacist cached data (s TTL check) |
| `writeCustomerCache(customerId, key, data, ttl)` | Ulozit data s TTL (ms) |
| `readRecentlyViewed(customerId)` | Vratit seznam nedavno vyhledanych modelu |
| `addRecentlyViewed(customerId, model)` | Pridat model do recently-viewed (max 20) |
| `readDraft(customerId, draftKey)` | Nacist draft formulare (napr. profile edit) |
| `writeDraft(customerId, draftKey, data)` | Ulozit draft formulare |
| `clearDraft(customerId, draftKey)` | Smazat draft |
| `clearAllCustomerData(customerId)` | Smazat VSECHNO pro zakaznika (logout) |

**Cache example:**
```javascript
// Write s TTL
writeCustomerCache('cust-123', 'profile', profileObj, 600_000); // 10 min

// Read — vrati null pokud neni nebo je expired
const profile = readCustomerCache('cust-123', 'profile');
```

**Bezpecnost:**
- Nur client-side cache — NOT for sensitive data (hesla, tokeny)
- Source of truth je vzdy backend
- Cache se neodesluje nikam

---

## 5. Backend API

### 5.1 Datovy model

#### Customers

```javascript
{
  id: string,           // UUID
  customerId: string,   // uid z Firebase
  email: string,        // email
  firstName: string,    // jmeno
  lastName: string,     // prijmeni
  phone: string,        // telefon (optional)
  language: string,     // cs | en (default cs)
  avatar: string,       // avatar URL (optional)
  createdAt: ISO,       // timestamp
  updatedAt: ISO,       // timestamp
}
```

#### Orders

```javascript
{
  id: string,           // UUID
  customerId: string,   // reference na zakaznika
  number: string,       // order number (napr. ORD-2026-001)
  status: string,       // NEW | CONFIRMED | IN_PRODUCTION | SHIPPED | DELIVERED | CANCELED
  items: [              // polozky objednavky
    {
      modelId: string,
      modelFilename: string,
      quantity: number,
      parameters: { },  // kalkulacne parametry
      unitPrice: number,
      totalPrice: number,
    }
  ],
  subtotal: number,     // bez DPH
  tax: number,          // DPH (21%)
  total: number,        // s DPH
  discount: number,     // sleva (optional)
  discountReason: string,
  shippingAddress: { }, // adresa
  notes: string,        // poznamka zakaznika
  createdAt: ISO,
  updatedAt: ISO,
  estimatedDelivery: ISO,
  trackingNumber: string, // (optional, pro SHIPPED)
}
```

#### Models

```javascript
{
  id: string,           // UUID
  customerId: string,
  filename: string,     // ulozene jmeno (hash)
  originalName: string, // puvodni nazev
  format: string,       // stl | 3mf | obj | step | stp
  fileSize: number,     // bytes
  title: string,        // user-friendly nazev (optional)
  description: string,  // popis
  tags: [ string ],     // max 20
  thumbnail: string,    // URL na thumbnail
  createdAt: ISO,
  updatedAt: ISO,
  usageCount: number,   // kolikrat pouzit v objednavce
}
```

#### Presets

```javascript
{
  id: string,           // UUID
  customerId: string,
  name: string,         // "Mala tiskarner" nebo "Velka kvalitni"
  description: string,  // (optional)
  category: string,     // (optional) — group by type
  config: {             // ulozeni vsech parametru kalkulacky
    // struktura zavisi na kalkulacce
    // napr: { material, quality, size, infill, ... }
  },
  createdAt: ISO,
  updatedAt: ISO,
  usageCount: number,   // kolikrat pouzit
}
```

#### Addresses

```javascript
{
  id: string,           // UUID
  customerId: string,
  type: string,         // shipping | billing
  fullName: string,
  street: string,
  city: string,
  zip: string,
  country: string,      // default CZ
  phone: string,        // (optional)
  isDefault: boolean,   // defaultni adresa
  createdAt: ISO,
  updatedAt: ISO,
}
```

#### Notifications

```javascript
{
  id: string,           // UUID
  customerId: string,
  type: string,         // order_status | system | promo
  title: string,        // "Vase objednavka byla odeslana"
  message: string,      // dlouhy text
  orderId: string,      // (optional) reference na objednavku
  read: boolean,        // default false
  createdAt: ISO,
  readAt: ISO,          // (optional)
}
```

### 5.2 Persistence — customerStore.js

Backend datove uloziste — JSON soubory per tenant.

**Cesta:** `{workspaceRoot}/customers/{tenantId}.json`

**Struktura souboru:**
```json
{
  "customers": { "cust-123": {...}, ... },
  "orders": { "ord-001": {...}, ... },
  "models": { "model-abc": {...}, ... },
  "presets": { "preset-xyz": {...}, ... },
  "addresses": { "addr-001": {...}, ... },
  "notifications": { "notif-001": {...}, ... },
  "_meta": {
    "updatedAt": "2026-03-22T10:00:00Z"
  }
}
```

**Bezpecnost:**
- Path traversal ochrana — sanitizeTenantId()
- Kazda operace validuje: caller customerId == record customerId
- Zapis je atomic (lock souboru)
- Backup: snapshot pred kazdou zmenou

### 5.3 API Endpointy

Vsechny endpointy:
- Require `requireAuth` middleware — overeni JWT
- Require `requireTenant` middleware — zjisteni tenantId
- Validace inputu pomoci `validate` middleware

#### GET `/api/customer/dashboard`

**Popis:** Agregovana data pro dashboard.

**Response:**
```json
{
  "ok": true,
  "data": {
    "profile": { ... },
    "stats": {
      "totalOrders": 12,
      "totalSpent": 45000,
      "savedModels": 8,
      "activeOrders": 2
    },
    "recentOrders": [ { ... } ],
    "notifications": [ { ... } ]
  }
}
```

#### GET `/api/customer/profile`

**Popis:** Nacteni profilu aktualniho zakaznika.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "cust-123",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+420774123456",
    "language": "cs"
  }
}
```

#### PATCH `/api/customer/profile`

**Popis:** Aktualizace profilu.

**Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "language": "cs|en"
}
```

**Response:** Updated profile object

#### GET `/api/customer/orders`

**Popis:** Seznam objednavek s paginaci a filtrem.

**Query:**
```
?page=1&limit=10&status=IN_PRODUCTION&dateFrom=2026-01-01&dateTo=2026-12-31&sort=date:desc
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "items": [ { id, number, status, total, date, ... } ],
    "total": 42,
    "page": 1,
    "limit": 10
  }
}
```

#### GET `/api/customer/orders/:id`

**Popis:** Detail jedne objednavky.

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "ord-001",
    "number": "ORD-2026-001",
    "status": "SHIPPED",
    "items": [ ... ],
    "total": 15000,
    "shippingAddress": { ... },
    "trackingNumber": "DPD123456",
    "estimatedDelivery": "2026-03-28"
  }
}
```

#### POST `/api/customer/orders/:id/reorder`

**Popis:** Kopirovat objednavku — vytvorit novou objednavku s stejnymi polozkami.

**Response:**
```json
{
  "ok": true,
  "data": {
    "newOrderId": "ord-002",
    "number": "ORD-2026-002",
    "status": "NEW"
  }
}
```

#### GET `/api/customer/models`

**Popis:** Seznam modelu zakaznika.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "model-001",
      "originalName": "part.stl",
      "format": "stl",
      "fileSize": 1024000,
      "title": "My Part",
      "tags": ["metal", "small"],
      "thumbnail": "https://...",
      "usageCount": 3
    }
  ]
}
```

#### POST `/api/customer/models`

**Popis:** Nahrat novy model (multipart/form-data).

**Body:**
```
Content-Type: multipart/form-data

file: <binary STL/3MF/OBJ/STEP/STP>
title: "My Part"
description: "This is my 3D part"
tags: ["metal", "small"] (JSON array)
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "model-001",
    "filename": "abc123def.stl",
    "originalName": "part.stl"
  }
}
```

#### PATCH `/api/customer/models/:id`

**Popis:** Aktualizace metadat modelu.

**Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["tag1", "tag2"]
}
```

#### DELETE `/api/customer/models/:id`

**Popis:** Smazat model.

**Response:** `{ ok: true }`

#### GET `/api/customer/presets`

**Popis:** Seznam ulozeneho nastaveni zakaznika.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "preset-001",
      "name": "Small Quick Print",
      "description": "...",
      "config": { "material": "PLA", "quality": "draft", ... },
      "usageCount": 5
    }
  ]
}
```

#### POST `/api/customer/presets`

**Popis:** Ulozit nove nastaveni.

**Body:**
```json
{
  "name": "Small Quick Print",
  "description": "Fast prints for small parts",
  "config": { "material": "PLA", "quality": "draft", ... }
}
```

#### PATCH `/api/customer/presets/:id`

**Popis:** Aktualizovat preset.

**Body:**
```json
{
  "name": "Updated Name",
  "config": { ... }
}
```

#### DELETE `/api/customer/presets/:id`

**Popis:** Smazat preset.

#### GET `/api/customer/addresses`

**Popis:** Seznam adres zakaznika.

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "addr-001",
      "type": "shipping",
      "fullName": "John Doe",
      "street": "Ulicni 123",
      "city": "Praha",
      "zip": "13000",
      "country": "CZ",
      "isDefault": true
    }
  ]
}
```

#### POST `/api/customer/addresses`

**Popis:** Pridat novou adresu.

**Body:**
```json
{
  "type": "shipping|billing",
  "fullName": "John Doe",
  "street": "Ulicni 123",
  "city": "Praha",
  "zip": "13000",
  "country": "CZ",
  "isDefault": false
}
```

#### PATCH `/api/customer/addresses/:id`

**Popis:** Aktualizovat adresu.

#### DELETE `/api/customer/addresses/:id`

**Popis:** Smazat adresu.

#### GET `/api/customer/notifications`

**Popis:** Seznam notifikaci (paginated, 20 na stranu).

**Query:**
```
?page=1&unreadOnly=false
```

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "notif-001",
      "type": "order_status",
      "title": "Your order is being shipped",
      "message": "...",
      "read": false,
      "createdAt": "2026-03-22T10:00:00Z"
    }
  ]
}
```

#### PATCH `/api/customer/notifications/:id/read`

**Popis:** Oznacit notifikaci jako precteno.

**Response:** Updated notification

#### POST `/api/customer/notifications/read-all`

**Popis:** Oznacit VSECHNY notifikace jako precteno.

**Response:** `{ ok: true }`

---

## 6. Bezpecnost

### 6.1 Autentizace a autorizace

**Auth flow:**
1. Firebase Auth — email/heslo nebo SSO (Google)
2. JWT token — vygenerovan backendem v `AuthContext`
3. Kazdy request — `Authorization: Bearer <token>` header
4. Backend middleware `requireAuth` — overeni JWT signature + expiraci

**Role system:**
- `customer` — pristup na /portal/* (protected)
- `admin` — pristup na /admin/* (protected)
- Zakazany pristup — admin na /portal, customer na /admin (redirect)

### 6.2 Tenant isolation

**Tenant scoping:**
- Kazdy zakaznik je vaza na tenant (napr. tiskarna XYZ)
- Backend middleware `requireTenant` — zjisti tenantId z JWT
- Kazdy API call — override customerId kontrola

**Bezpecnostni kontroly:**
```javascript
// Backend — customerStore.js
function getCustomerOrder(workspaceRoot, tenantId, customerId, orderId) {
  // 1. Nacist order z {tenantId}.json
  // 2. Overit: order.customerId === customerId
  // 3. Pokud je rozdil → throw error
  return order;
}
```

### 6.3 Data privacy — GDPR

**Vlastnosti:**
- Zakaznik muze exportovat SVA data (GET /api/customer/data-export)
- Zakaznik muze smazat sve konto (DELETE /api/customer/account) — smazes VSECHNY data
- Backend logovani — ne hesla, ne citlive podatky

**Implementace:**
```javascript
// Export
GET /api/customer/data-export
→ vytvorit JSON se vsemi zakaznikovymi daty
→ vratit jako download (Content-Disposition: attachment)

// Smazani
DELETE /api/customer/account?confirm=true
→ smazat z customers, orders, models, presets, addresses, notifications
→ smazat avatar a uploaded models z cloudu
→ zaslat confirmation email
→ logout zakaznika
```

### 6.4 Input validation

**Frontend:**
- zod schema (react-hook-form)
- Type checking pro objekty
- Sanitace stringu — trim, max length

**Backend:**
- Middleware `validate` — zkontrolovat query, body, params
- SQL injection protection — neni SQL, ale sanitace stringu
- Path traversal protection — sanitizeTenantId, sanitizePath

**Priklad:**
```javascript
// Backend validation schema
const schemas = {
  updateProfile: {
    body: {
      firstName: { type: "string", maxLength: 200, label: "First name" },
      lastName: { type: "string", maxLength: 200, label: "Last name" },
      phone: { type: "string", maxLength: 200, label: "Phone" },
      language: { type: "string", enum: ["cs", "en"], label: "Language" },
    },
  },
};

// Middleware
router.patch('/profile', validate(schemas.updateProfile), async (req, res) => {
  // req.body je jiz validovany
});
```

### 6.5 Rate limiting

**Implementace:**
- `rateLimit` middleware — limit reqestu na zakaznika
- Login: max 5 pokusu za 15 minut (brzdeni bruteforce)
- Upload: max 10 modelu za den
- API calls: 100 reqestu za minutu (per user)

**Priklad:**
```javascript
router.post('/register',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  async (req, res) => { ... }
);
```

### 6.6 HTTPS a tokeny

**Pravidla:**
- Vsechny API calls pres HTTPS (prod)
- JWT token ulozeny v httpOnly cookie (NO localStorage)
- CORS — origin whitelist (len domena aplikace)
- CSP headers — prevent XSS

---

## 7. I18n — Ceska a anglicka lokalizace

### 7.1 I18n knihovna

**React-i18next** s soubory v `src/locales/{cs,en}/`.

### 7.2 Portal labels

Kazda stranka pouziva useTranslation hook:

```javascript
import { useTranslation } from 'react-i18next';

export default function CustomerDashboard() {
  const { t } = useTranslation();
  return <h1>{t('customerDashboard.title', 'Dashboard')}</h1>;
}
```

### 7.3 Klucove prekladatelne oblasti

| Oblast | Klice |
|--------|-------|
| Navigace | `portal.nav.dashboard`, `portal.nav.orders`, `portal.nav.models`, ... |
| Formulare | `form.email`, `form.password`, `form.firstName`, ... |
| Stavove zpravy | `status.new`, `status.shipped`, `status.delivered`, ... |
| Error messages | `error.invalidEmail`, `error.passwordTooShort`, ... |
| Tlacitkа | `button.save`, `button.delete`, `button.download`, ... |
| Dummy texty | `empty.noOrders`, `empty.noModels`, ... |

### 7.4 Nastaveni jazyka

Backend ulozuje `language: "cs" | "en"` v customer profilu. Frontend:

```javascript
// CustomerProfile.jsx
const handleLanguageChange = async (lang) => {
  const result = await updateCustomerProfile({ language: lang });
  if (!result.error) {
    i18n.changeLanguage(lang); // Switch UI
  }
};
```

---

## 8. Budouci vylepseni (Phase 2+)

### Phase 2

- **3D Model Preview** — webove zobrazeni STL/3MF primo v prehlizeci
- **Team Accounts** — sdileni zakupniho konta mezi vice lidmi
- **Order history detail** — vice detailu o tiskari a cas tisknutis
- **Invoice PDF** — stazovani faktury

### Phase 3

- **Loyalty Program** — body za objednavky, sleva za body
- **API Access** — zakaznik muze mit API klic pro programaticky pristup
- **Webhooks** — zakaznik se registruje na webhooky (order changed, etc.)
- **Live Pricing Estimates** — real-time cenove odhady bhem kalkulace

### Infrastruktura

- **Supabase migration** — prechod z JSON na PostgreSQL (2026-Q2)
- **Cloud storage** — R2 nebo GCS pro modely a faktury
- **Email notifications** — Resend pro notifikace (Q1 2026)

---

## 9. Troubleshooting

### Problem: Login nefunguje

**Kontrola:**
1. Firebase auth nastaveno? (Config v environment)
2. JWT token je vygenerovan? (Chrome DevTools → Cookies → jwt)
3. Backend dostava token? (Check middleware logs)

### Problem: Portal nactava pomalu

**Optimizace:**
1. Lazy-loading stranky — overit ze je zapnuto v Routes.jsx
2. Cache — CustomerStorage + TTL nastaveni
3. Polling — zmensit NOTIFICATION_POLL_INTERVAL (vzor 60s)

### Problem: Data se nesynchonizuji

**Debug:**
1. Browser console — chyby v API volanich?
2. Network tab — Check GET /api/customer/... responses
3. Backend logs — error messages?
4. Smazat localStorage a refresh

### Problem: Smazani modelu nefunguje

**Kontrola:**
1. Model patri zakaznikovi? (customerId match)
2. Backend vratil error? (Check response)
3. Model se pouziva v objednavce? (Zarazeno, nelze smazat)

---

## 10. Reference

### Kode struktury
- Frontend: `/src/pages/portal/`, `/src/context/CustomerContext.jsx`, `/src/services/customerApi.js`, `/src/utils/customerStorage.js`
- Backend: `/backend-local/src/customerStore.js`, `/backend-local/src/routes/customerPortal.js`
- Routes: `/src/Routes.jsx` (liny 62-210)

### Dokumentace souvisejiciho
- **Auth System:** Account-Dokumentace.md (login, registrace, profil)
- **Backend API:** Infrastructure-Dokumentace.md (middleware, express setup)
- **Storage:** Storage-Utilities-Dokumentace.md (tenant scoping)
- **Design:** Forge-Design-System-Dokumentace.md (UI komponenty)
- **i18n:** LanguageContext-Dokumentace.md (preklad system)

### Skrty
- FD = Forge Design System
- i18n = Internationalization
- JWT = JSON Web Token
- TTL = Time To Live (cache expiration)
- CRUD = Create, Read, Update, Delete

