# 050-AU — UPRAVY — Auth Sprint 1 Faze 3 (Backend Auth + apiClient) — 2026-02-22

## Metadata
- **ID:** 050-AU
- **Session:** S01
- **Datum:** 2026-02-22
- **Oblast:** Auth — Sprint 1 Faze 3
- **Souvisejici ID:** 043-AU, 044-AU, 049-AU, 051-AU
- **Trigger:** Implementace planu Sprint 1 — kroky 3.1-3.6

---

## Souhrn uprav

Faze 3 implementovala backend autentizaci a frontend API klienta:

- **Firebase Admin SDK** inicializovan jako singleton na backendu — overuje Firebase JWT tokeny
- **requireAuth middleware** — vyzaduje platny Bearer token v hlavicce Authorization, nastavuje `req.user`
- **optionalAuth middleware** — propusti i neautentizovane pozadavky, `req.user` = null pokud chybi token
- **requireTenant middleware** — extrahuje `tenant_id` z JWT claims nebo z hlavicky `x-tenant-id` (fallback pro zpetnou kompatibilitu), nastavuje `req.tenantId`
- **Chranene endpointy:** `/api/presets`, `/api/slice`, `/api/storage` — vsechny vyzaduji `requireAuth + requireTenant`
- **Health endpoint ocisten** — `GET /api/health` neodhaluje zadne filesystem cesty, vraci jen `ok`, `service`, `time`
- **apiClient** (`src/lib/apiClient.js`) — axios instance s `baseURL: '/api'`, automaticky pripojuje Bearer token pres `window.__authGetToken`, 401 retry logika pres `window.__authRefreshToken`
- **FirebaseAuthProvider** — doplnen o `window.__authGetToken` a `window.__authRefreshToken` pro propojeni s apiClientem bez circular dependencies

---

## Seznam upravenych souboru

| Soubor | Typ zmeny | Radky | Poznamka |
|--------|-----------|-------|----------|
| `backend-local/src/firebaseAdmin.js` | NOVY | 27 | Singleton Firebase Admin init, 3 rezimy (prod/dev/fallback) |
| `backend-local/src/middleware/auth.js` | NOVY | 51 | requireAuth + optionalAuth middleware |
| `backend-local/src/middleware/tenant.js` | NOVY | 25 | requireTenant z JWT claims nebo hlavicky |
| `backend-local/src/index.js` | UPRAVA | 407 celkem | Import auth/tenant, middleware na 3 route prefixech, health endpoint ocisten |
| `src/lib/apiClient.js` | NOVY | 47 | axios s auth interceptory, window refs |
| `src/providers/FirebaseAuthProvider.jsx` | UPRAVA | 189 celkem | Pridany window.__authGetToken + window.__authRefreshToken (radky 55-73) |

---

## Detailni zmeny

### 1. `backend-local/src/firebaseAdmin.js` (novy, 27 radku)

Singleton inicializace Firebase Admin SDK. Spousti se jednou pri startu serveru diky podminceemu `if (!admin.apps.length)`.

**Tri rezimy inicializace:**
1. **Produkce** (`GOOGLE_APPLICATION_CREDENTIALS` nastaven): pouziva `applicationDefault()` — cte service account JSON z cesty v env promenne
2. **Development** (nastaven `FIREBASE_PROJECT_ID` nebo `VITE_FIREBASE_PROJECT_ID`): inicializuje pouze s `projectId` — postaci pro `verifyIdToken()` s realnym Firebase projektem nebo emulátorem
3. **Fallback** (nic neni nastaveno): vyvola `console.warn` a inicializuje bez parametru — auth middleware bude odmitat vsechny tokeny

**Exporty:**
- `adminAuth` — `admin.auth()` instance pouzivana middleware soubory
- `default` — cely admin objekt

**Klicovy pattern — env promenne:**
```js
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
```
Cte oba (backend-local `.env` i frontend `.env`) pro maximalni flexibilitu ve vyvoji.

---

### 2. `backend-local/src/middleware/auth.js` (novy, 51 radku)

Dva Express middleware pro autentizaci.

#### `requireAuth(req, res, next)` — radky 7-29
Vyzaduje platny Firebase ID token.

**Flow:**
1. Zkontroluje `Authorization` hlavicku — musi zacinat `"Bearer "`
2. Pokud chybi nebo nema spravny format → `401` s `errorCode: 'AUTH_MISSING_TOKEN'`
3. Extrahuje token: `authHeader.split('Bearer ')[1]`
4. Vola `adminAuth.verifyIdToken(token)` — async Firebase Admin call
5. Pokud platny → `req.user = decoded` (obsahuje `uid`, `email`, `name`, `picture`, atd.) a zavola `next()`
6. Pokud neplatny nebo expiroval → `401` s `errorCode: 'AUTH_INVALID_TOKEN'`

**Error response format:**
```json
{
  "ok": false,
  "errorCode": "AUTH_MISSING_TOKEN",
  "message": "Missing auth token"
}
```
nebo
```json
{
  "ok": false,
  "errorCode": "AUTH_INVALID_TOKEN",
  "message": "Invalid or expired token"
}
```

#### `optionalAuth(req, res, next)` — radky 35-50
Neautentizovane pozadavky propusti s `req.user = null`.

**Flow:**
1. Zkontroluje `Authorization` hlavicku
2. Pokud chybi → `req.user = null`, zavola `next()`
3. Pokud je Bearer token → pokusi se o `verifyIdToken()`
4. Uspech → `req.user = decoded`
5. Selhani (expiroval atd.) → `req.user = null` (nevraci 401!)
6. V kazdem pripade zavola `next()`

Pouziti: endpointy ktere fungují pro oba — prihlasene i anonymni uzivatele.

---

### 3. `backend-local/src/middleware/tenant.js` (novy, 25 radku)

Extrahuje tenant ID pro downstream route handlery. Vyzaduje aby `requireAuth` bezelo jako predchozi middleware (nastavuje `req.user`).

**Priorita zdroju tenant ID:**
1. `req.user?.tenant_id` — custom claim v JWT tokenu (standard)
2. `req.user?.tenantId` — alternativni nazev custom claim (varianta)
3. `req.headers['x-tenant-id']` — HTTP hlavicka (fallback, zpetna kompatibilita pri prechodu)

**Dev fallback:** Pokud zadny zdroj neposkytne tenant_id → `req.tenantId = 'demo-tenant'`

Toto nezakaze pristup, jen nahradi ID — pouzitelne pri lokálním vývoji bez plného nastaveni JWT claims.

**Downstream pouziti:** `getTenantIdFromReq(req)` v `index.js` cte `req.tenantId` nastaveny timto middleware:
```js
function getTenantIdFromReq(req) {
  if (req.tenantId) return req.tenantId;
  const fromHeader = String(req.headers["x-tenant-id"] || "").trim();
  return fromHeader || "demo-tenant";
}
```

---

### 4. `backend-local/src/index.js` — auth integrace (klicove zmeny)

#### Nove importy (radky 29-30):
```js
import { requireAuth, optionalAuth } from "./middleware/auth.js";
import { requireTenant } from "./middleware/tenant.js";
```

#### Chranene route prefixe (radky 76-80):
```js
// ===== Auth middleware for protected routes =====
// Apply requireAuth + requireTenant to all /api/presets, /api/slice, /api/storage
app.use("/api/presets", requireAuth, requireTenant);
app.use("/api/slice", requireAuth, requireTenant);
app.use("/api/storage", requireAuth, requireTenant);
```

`app.use()` s prefixem aplikuje middleware na VSECHNY HTTP metody a podpaths dane route. Tedy:
- `GET /api/presets` → chraneno
- `POST /api/presets` → chraneno
- `PATCH /api/presets/:id` → chraneno
- `POST /api/presets/:id/default` → chraneno
- `DELETE /api/presets/:id` → chraneno
- `POST /api/slice` → chraneno
- `app.use("/api/storage", storageRouter)` → vsechny storage endpointy chraneny

#### Nechranene endpointy (bez auth):
- `GET /api/health` (radky 68-74) — verejny health check, vraci pouze `{ ok, service, time }`
- `GET /api/widget/presets` (radky 183-195) — verejny endpoint pro widget (neautentizovany)
- `GET /api/health/prusa` (radky 197-230) — slicer health check

#### Health endpoint PRED/PO (ocisteni):

**Pred (hazelo filesystem cesty):**
Endpoint obsahoval informace o WORKSPACE_ROOT, absolutnich cestach na serveru — bezpecnostni problem.

**Po (ocisteni, radky 68-74):**
```js
app.get("/api/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "modelpricer-backend-local",
    time: new Date().toISOString(),
  });
});
```
Zadne filesystem cesty, zadne env promenne v odpovedi.

---

### 5. `src/lib/apiClient.js` (novy, 47 radku)

Axios instance pro vsechny autentizovane API volani z frontendu.

**Zakladni konfigurace:**
```js
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
});
```
`baseURL: '/api'` funguje spolu s Vite proxy (`/api` → `http://127.0.0.1:3001`).

#### Request interceptor (radky 9-21) — prirazeni tokenu:
```js
apiClient.interceptors.request.use(async (config) => {
  if (window.__authGetToken) {
    try {
      const token = await window.__authGetToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Token fetch failed — continue without auth
    }
  }
  return config;
});
```

**Klicove vlastnosti:**
- Kontroluje existenci `window.__authGetToken` pred volanim — bezpecne kdyz provider neni mountnut
- Try/catch — selhani pri ziskani tokenu neblokuje request (request odejde bez tokenu)
- Token se pripoji jako `Authorization: Bearer <token>` hlavicka

#### Response interceptor (radky 24-44) — 401 retry:
```js
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      if (window.__authRefreshToken) {
        try {
          const newToken = await window.__authRefreshToken();
          if (newToken) {
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(error.config);
          }
        } catch {
          // Refresh failed — let error propagate
        }
      }
    }
    return Promise.reject(error);
  }
);
```

**Retry logika:**
1. Zachyti HTTP 401 odpoved
2. Zkontroluje `_retry` flag — zabraní nekonecne smycce
3. Nastavi `_retry = true` — retry se provede max 1x
4. Zavola `window.__authRefreshToken()` — vynuti refresh tokenu u Firebase
5. Pokud refresh uspeje — prepise Authorization hlavicku a opakuje puvodni request
6. Pokud refresh selze — propaguje puvodni chybu

**Proc `window.__` refs misto primoho importu:**
Vyresuje circular dependencies. `apiClient.js` nemusi importovat `FirebaseAuthProvider` ani `AuthContext` — pouziva window globaly jako "bridge".

---

### 6. `src/providers/FirebaseAuthProvider.jsx` — window refs (radky 54-73)

Pridany `useEffect` ktery exponuje token funkce na `window` pro apiClient:

```js
// Expose getToken/refreshToken on window for apiClient interceptors
useEffect(() => {
  window.__authGetToken = async () => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  };
  window.__authRefreshToken = async () => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken(true); // true = force refresh
    }
    return null;
  };

  return () => {
    delete window.__authGetToken;
    delete window.__authRefreshToken;
  };
}, []);
```

**Klicove detaily:**
- `getIdToken()` — vraci aktualni ID token (pouzije cache pokud jeste plati)
- `getIdToken(true)` — vynutí refresh od Firebase serveru (pouzito pri 401 retry)
- Cleanup funkce `delete window.__authGetToken` — ocisti pri unmount provideru
- Dependency array `[]` — efekt se spusti jen jednou pri mount

**Dualita implementace:** Provider ma take `getToken` a `refreshToken` jako useCallback hooks (radky 131-143) ktere jsou exponovany pres `AuthContext.value`. `window.__` verze existuji *navic* kvuli apiClientu ktery nema pristup k React contextu.

---

## Dopad zmen

### Endpointy nyni chranene (vyzaduji Bearer token)

| Method | Endpoint | Middleware |
|--------|----------|-----------|
| GET | `/api/presets` | requireAuth + requireTenant |
| POST | `/api/presets` | requireAuth + requireTenant |
| PATCH | `/api/presets/:id` | requireAuth + requireTenant |
| POST | `/api/presets/:id/default` | requireAuth + requireTenant |
| DELETE | `/api/presets/:id` | requireAuth + requireTenant |
| POST | `/api/slice` | requireAuth + requireTenant |
| GET/POST/PUT | `/api/storage/*` | requireAuth + requireTenant |

### Endpointy stale verejne (bez auth)

| Method | Endpoint | Poznamka |
|--------|----------|---------|
| GET | `/api/health` | Health check — ocisten od cest |
| GET | `/api/widget/presets` | Widget potrebuje verejny pristup |
| GET | `/api/health/prusa` | Slicer diagnostika |

### Error kody pro 401 odpovedi

| Situace | HTTP Status | errorCode |
|---------|-------------|-----------|
| Chybi Authorization hlavicka | 401 | `AUTH_MISSING_TOKEN` |
| Token nema "Bearer " prefix | 401 | `AUTH_MISSING_TOKEN` |
| Token expiroval | 401 | `AUTH_INVALID_TOKEN` |
| Token ma spatny podpis | 401 | `AUTH_INVALID_TOKEN` |
| Token patri jinemu projektu | 401 | `AUTH_INVALID_TOKEN` |

### Token refresh flow (apiClient)

```
Frontend request
  → request interceptor → getIdToken() → pripoji Bearer token
  → backend → requireAuth → verifyIdToken()
    → Pokud OK: req.user nastaven, next()
    → Pokud 401: response interceptor
        → getIdToken(true) — force refresh
        → retry puvodni request s novym tokenem
        → Pokud retry selze: propaguje chybu
```

### Rizika

- **Existujici volani `/api/presets` bez tokenu** — pokud nektera cast kodu stale volá API primo (ne pres apiClient), zacnou dostavat 401. Je treba pouzivat `apiClient` vsude kde se volaji chranene endpointy.
- **Widget presety** — `/api/widget/presets` je zamerně nechraneny, widget nema auth. Toto je spravne chovani.
- **Dev fallback tenant** — pokud JWT nema `tenant_id` claim, pouzije se `'demo-tenant'`. V produkci je treba nastavit custom claims v Firebase.
- **GOOGLE_APPLICATION_CREDENTIALS** — v produkci MUSI byt nastaven, jinak backend odmita vsechny tokeny.

---

## Testovani

- **Build:** PASS (`npm run build`)
- **Manual test — health endpoint:** `GET /api/health` vraci `{ ok: true, service, time }` bez cest
- **Manual test — rejection bez tokenu:** `GET /api/presets` bez Authorization → 401 `AUTH_MISSING_TOKEN`
- **Manual test — rejection s bad tokenem:** `GET /api/presets` s `Authorization: Bearer badtoken` → 401 `AUTH_INVALID_TOKEN`
- **Manual test — login + API flow:** Prihlas se → pouzij apiClient → token se automaticky pripoji → backend akceptuje
- **Manual test — widget presets:** `GET /api/widget/presets` bez tokenu → 200 OK (verejny endpoint)
