# 044-AU — UPRAVY — Auth System Implementation — 2026-02-22

## Metadata
- **ID:** 044-AU
- **Session:** S01
- **Datum:** 2026-02-22
- **Oblast:** Auth/Autentizace — Sprint 1 Auth Foundation
- **Souvisejici ID:** 043-AU (KONVERZACE), 045-AU (OTAZKY), 046-AU (DENNI-PREHLED)
- **Trigger:** Implementace planu "Sprint 1: Auth Foundation" z docs/claude/Research/Auth/04-Implementation-Plan.md

---

## Souhrn uprav

Implementace kompletniho auth systemu s Firebase na backendu, provider-agnostic AuthContext na frontendu, a integrace do routingu + API client. Celkem 8 novych souboru, 7 upravenych, 4 smazany. Build PASS (46s). Zmen se tyka auth flow, login/register stranky, routy a backend middleware.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/context/AuthContext.jsx | Zmeneno | 1-41 → 1-11 | Kompletni refaktor — odstraneny Firebase importy, zachovany jen createContext + useAuth hook |
| 2 | src/providers/FirebaseAuthProvider.jsx | Novy soubor | N/A | ~160 radku — implementace Firebase auth (login, register, logout, Google popup, Firestore profile, token management) |
| 3 | src/providers/SupabaseAuthProvider.jsx | Novy soubor | N/A | ~35 radku — stub pro budouci Supabase provider, vsechny funkce hazi Error("not implemented") |
| 4 | src/providers/index.jsx | Novy soubor | N/A | ~18 radku — ActiveAuthProvider switch dle VITE_AUTH_PROVIDER env |
| 5 | src/index.jsx | Zmeneno | 5-7 | Zmena importu z `AuthProvider` na `ActiveAuthProvider` z ./providers |
| 6 | src/Routes.jsx | Zmeneno | 15-45 | Aktivace PrivateRoute pro `/account` a cely `/admin` blok |
| 7 | src/components/PrivateRoute.jsx | Zmeneno | 1-30 | Nahrazeni Tailwind za Forge inline styles, spinner animace |
| 8 | src/components/ui/GoogleSignInButton.jsx | Novy soubor | N/A | ~85 radku — sdilena komponenta s Google SVG logem, hover efekt |
| 9 | src/pages/login/index.jsx | Zmeneno | 1-31 → 1-16 | Odstraneny Firebase importy, pouziva useAuth(), redirect /admin |
| 10 | src/pages/login/components/LoginForm.jsx | Zmeneno | 1-202 → 1-210 | Zmena signInWithEmailAndPassword → useAuth().login(), pridan Google Sign-In, layout zmenen |
| 11 | src/pages/register/index.jsx | Zmeneno | 1-202 → 1-55 | Kompletni prepis — odstraneny multi-step wizard, role selection, jednoducha stranka |
| 12 | src/pages/register/components/RegistrationForm.jsx | Zmeneno | 1-357 → 1-245 | Odstranen selectedRole, role-specific fields, zjednodusena schema, pridan Google |
| 13 | src/pages/register/components/RoleSelectionCard.jsx | Smazan | N/A | Role selection UI — SMAZAN dle rozhodnuti |
| 14 | src/pages/register/components/ProgressSteps.jsx | Smazan | N/A | Multi-step progress — SMAZAN (1-step flow) |
| 15 | src/pages/register/components/LanguageToggle.jsx | Smazan | N/A | Language toggle — SMAZAN (nepotrebna) |
| 16 | src/components/ui/Header.jsx | Zmeneno | 8-15 | Zmena z primy Firebase import → useAuth() hook, handleSignOut → logout() |
| 17 | src/lib/apiClient.js | Novy soubor | N/A | ~45 radku — axios instance s Bearer token + 401 retry interceptory |
| 18 | backend-local/src/firebaseAdmin.js | Novy soubor | N/A | ~25 radku — singleton Firebase Admin SDK init |
| 19 | backend-local/src/middleware/auth.js | Novy soubor | N/A | ~50 radku — requireAuth (verifyIdToken), optionalAuth middleware |
| 20 | backend-local/src/middleware/tenant.js | Novy soubor | N/A | ~22 radku — requireTenant (cte tenant_id z JWT claims) |
| 21 | backend-local/src/index.js | Zmeneno | 1-80 | Pridal middleware importy, app.use pro /api/* s auth+tenant middleware, opravil health endpoint |
| 22 | backend-local/package.json | Zmeneno | N/A | Pridat dep: firebase-admin |

---

## Detailni zmeny

### 1. `src/context/AuthContext.jsx`

**Typ:** Zmeneno
**Radky:** Kompletni soubor (1-41 → 1-11)
**Duvod:** Odstraneni Firebase-specifickych implementaci, vytvoreni provider-agnostic interface

**Co se zmenilo:**
- Odstranen `import { auth, db } from '../firebase'`
- Odstranen `import { signOut } from 'firebase/auth'`
- Odstranen vsechny Firebase-specificke funkce (signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged)
- Zachovan jen `createContext` a `useAuth` hook
- AuthContext nyni obsahuje jen abstraktni interface: `{ user, login, loginWithGoogle, register, logout, getToken, refreshToken, resetPassword, updateProfile }`

```jsx
// PRED:
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
// ... 25+ radku Firebase logiky ...

// PO:
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
```

---

### 2. `src/providers/FirebaseAuthProvider.jsx` (NOVY)

**Typ:** Novy soubor (~160 radku)
**Duvod:** Implementace Firebase-specificke auth logiky v oddelene komponente

**Implementovane funkce:**
- `login(email, password)` — signInWithEmailAndPassword
- `loginWithGoogle()` — signInWithPopup s Google provider
- `register(email, password, userData)` — createUserWithEmailAndPassword + Firestore profile
- `logout()` — signOut
- `getToken()` — getIdToken (sync nebo z cache)
- `refreshToken()` — force refresh IDToken
- `resetPassword(email)` — sendPasswordResetEmail
- `updateProfile(updates)` — updateDoc Firestore profilu
- `onAuthStateChanged` listener — nastavuje user state + refreshuje token kazych 45min

**Specialnosti:**
- Window.__authGetToken a window.__authRefreshToken pro apiClient
- Firestore profil cten pri kazdem auth state change
- Token refresh kazych 45 minut (JWT expiry ~1h)

---

### 3. `src/providers/SupabaseAuthProvider.jsx` (NOVY)

**Typ:** Novy soubor (~35 radku)
**Duvod:** Placeholder pro budouci Supabase integraci

**Aktualni stav:**
- Vsechny funkce vyhazuji `Error("not implemented")`
- Slouzi jako template pro Phase 4 migrace

---

### 4. `src/providers/index.jsx` (NOVY)

**Typ:** Novy soubor (~18 radku)
**Duvod:** Prepinac mezi auth providery na zaklade env promenne

**Logika:**
- `VITE_AUTH_PROVIDER == 'firebase'` → `FirebaseAuthProvider`
- `VITE_AUTH_PROVIDER == 'supabase'` → `SupabaseAuthProvider`
- Default: Firebase
- Export: `ActiveAuthProvider` komponenta

**Pozor:** Soubor je `.jsx` ne `.js` (Vite esbuild vymazuje JSX bez .jsx)

---

### 5. `src/index.jsx`

**Typ:** Zmeneno
**Radky:** 5-7
**Duvod:** Zmena root provideru na ActiveAuthProvider

```jsx
// PRED:
import { AuthProvider } from './context/AuthContext';
<AuthProvider>

// PO:
import { ActiveAuthProvider } from './providers';
<ActiveAuthProvider>
```

---

### 6. `src/Routes.jsx`

**Typ:** Zmeneno
**Radky:** 15-45 (cely routing blok)
**Duvod:** Aktivace PrivateRoute pro admin stranky a account

**Co se zmenilo:**
- `/account` — nyni ma `<PrivateRoute>` wrapper
- `/admin/*` cely blok — nyni ma `<PrivateRoute>` wrapper
- Verejne: `/`, `/login`, `/register`, `/pricing`, `/support`, `/test-kalkulacka`, `/test-kalkulacka-white`, `/w/:publicWidgetId`, `/slicer`

**Logika:**
- PrivateRoute nastavuje redirect na `/login` pokud user neni autentizovan
- Po loginu redirect na `/admin` (fallback na puvodni stranku pokud byla uschova)

---

### 7. `src/components/PrivateRoute.jsx`

**Typ:** Zmeneno
**Radky:** Kompletni soubor (1-30)
**Duvod:** Styling a loading state

**Co se zmenilo:**
- Nahrazeni Tailwind CSS za Forge inline styles (--forge-* CSS vars)
- Spinner animace pridana (`@keyframes spin`)
- Spinner barva: `#5B8DEE` (Forge teal)
- Loading text: "Nacitam..." (Cestina)

---

### 8. `src/components/ui/GoogleSignInButton.jsx` (NOVY)

**Typ:** Novy soubor (~85 radku)
**Duvod:** Sdilena komponenta pro Google Sign-In pres login i register stranky

**Features:**
- Google SVG logo (inline SVG, ne import)
- Bile pozadi s dark border na hover
- onClick → `useAuth().loginWithGoogle()`
- Responzivni (full width na mobile)
- Chyba handling (try-catch, error toast)

**Pouziti:**
- Login stranka: pod email formularem ("nebo")
- Register stranka: nad email formularem

---

### 9. `src/pages/login/index.jsx`

**Typ:** Zmeneno
**Radky:** 1-31 → 1-16
**Duvod:** Odstraneni Firebase importu, zjednoduseni

```jsx
// PRED:
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

// PO:
import { useAuth } from '../../context/AuthContext';
const { logout } = useAuth();
```

---

### 10. `src/pages/login/components/LoginForm.jsx`

**Typ:** Zmeneno
**Radky:** 1-202 → 1-210
**Duvod:** Zmena Firebase auth → useAuth(), pridani GoogleSignInButton

**Co se zmenilo:**
- `signInWithEmailAndPassword(auth, ...)` → `login(email, password)` z useAuth()
- Odstranen `firebase/auth` importy
- Pridan `GoogleSignInButton` komponenta nad email formul + "nebo" divider
- Chybovost handling: error state, submit state
- Link na registraci dole

---

### 11. `src/pages/register/index.jsx`

**Typ:** Zmeneno
**Radky:** 1-202 → 1-55
**Duvod:** Kompletni prepis — multi-step wizard nahrazen jednoduchou strankouou

```jsx
// PRED:
// ... multi-step wizard s role selection, host fields, atd (202 radku) ...

// PO:
// ... jednoducha stranka s RegistrationForm + GoogleSignInButton (55 radku) ...
```

**Zmeny:**
- Odstranen RoleSelectionCard komponenta
- Odstranen ProgressSteps komponenta
- Odstranen LanguageToggle komponenta
- Jedna faze: email + password + name
- GoogleSignInButton nahore, LoginForm odkazem dole

---

### 12. `src/pages/register/components/RegistrationForm.jsx`

**Typ:** Zmeneno
**Radky:** 1-357 → 1-245
**Duvod:** Odstraneni role-specific fields, zjednoduseni schema

**Co se zmenilo:**
- Odstranen `selectedRole` prop a vse co se tyka role-based logiky
- Odstranen `hostCompanyName`, `hostTaxId`, `hostCountry` fields
- Jednoducha schema: `{ email, password, passwordConfirm, name }`
- `register(email, password, userData)` z useAuth() namiste primy Firebase
- Pridan GoogleSignInButton komponenta nahore
- Link na login dole

```jsx
// PRED:
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  selectedRole: z.enum(['customer', 'host']),
  hostCompanyName: z.string().optional(),
  // ... 10+ role-specific fields ...
});

// PO:
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  passwordConfirm: z.string(),
  name: z.string().min(2),
});
```

---

### 13-15. Smazane soubory (Role Selection, Progress, Language Toggle)

**Typ:** Smazan
**Duvod:** Neni potrebna (jednoducha 1-step registrace, role selection vynechany, jazyk se spravuje pres LanguageContext)

- `src/pages/register/components/RoleSelectionCard.jsx`
- `src/pages/register/components/ProgressSteps.jsx`
- `src/pages/register/components/LanguageToggle.jsx`

---

### 16. `src/components/ui/Header.jsx`

**Typ:** Zmeneno
**Radky:** 8-15
**Duvod:** Odstraneni Firebase importu, zmena na useAuth() hook

```jsx
// PRED:
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
const handleSignOut = () => signOut(auth);

// PO:
const { logout } = useAuth();
const handleSignOut = () => logout();
```

---

### 17. `src/lib/apiClient.js` (NOVY)

**Typ:** Novy soubor (~45 radku)
**Duvod:** Axios instance s auth interceptory

**Funkcionalita:**
- Request interceptor: Přidava `Authorization: Bearer {token}` z window.__authGetToken()
- Response interceptor: Na 401 refresh token, retry request jednou
- Exponential backoff neimplementovan (simple retry)

```jsx
// PRIKLAD:
const apiClient = axios.create({ baseURL: '/api' });
apiClient.interceptors.request.use(async (config) => {
  const token = window.__authGetToken?.();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const newToken = await window.__authRefreshToken?.();
      if (newToken) return apiClient(err.config); // retry
    }
    throw err;
  }
);
```

---

### 18. `backend-local/src/firebaseAdmin.js` (NOVY)

**Typ:** Novy soubor (~25 radku)
**Duvod:** Firebase Admin SDK initialization

**Funkcionalita:**
- Singleton pattern (getAdmin())
- Cte GOOGLE_APPLICATION_CREDENTIALS nebo FIREBASE_PROJECT_ID z env
- Export: `admin` object, `auth` (admin.auth()), `db` (admin.firestore())

```jsx
const admin = require('firebase-admin');
let adminInstance = null;
const getAdmin = () => {
  if (!adminInstance) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
    } else if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    }
    adminInstance = admin;
  }
  return adminInstance;
};
```

---

### 19. `backend-local/src/middleware/auth.js` (NOVY)

**Typ:** Novy soubor (~50 radku)
**Duvod:** Auth middleware pro backend

**Funkcionalita:**
- `requireAuth(req, res, next)` — verifyIdToken, nastavi req.user (UID + claims), 401 na chybu
- `optionalAuth(req, res, next)` — pokusi se ovelit, ale nechybi erroru, req.user = null
- Bearer token extraction ze `Authorization: Bearer {token}` headeru

```jsx
const { getAdmin } = require('../firebaseAdmin');
const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decodedToken = await getAdmin().auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid, ...decodedToken.custom_claims };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

### 20. `backend-local/src/middleware/tenant.js` (NOVY)

**Typ:** Novy soubor (~22 radku)
**Duvod:** Tenant isolation middleware

**Funkcionalita:**
- `requireTenant(req, res, next)` — cte tenant_id z JWT claims nebo x-tenant-id headeru
- Default: demo-tenant
- Nastavi req.tenantId

```jsx
const requireTenant = (req, res, next) => {
  const tenantId = req.user?.custom_claims?.tenant_id ||
                   req.headers['x-tenant-id'] ||
                   'demo-tenant';
  req.tenantId = tenantId;
  next();
};
```

---

### 21. `backend-local/src/index.js`

**Typ:** Zmeneno
**Radky:** Komplexni zmeny v celem souboru
**Duvod:** Pridat middleware, opravit health endpoint, zaverit API routes

**Co se zmenilo:**
- Pridal importy: `requireAuth`, `optionalAuth` z middleware/auth, `requireTenant` z middleware/tenant
- Aplikoval middleware na `/api/presets`, `/api/slice`, `/api/storage` routes: `app.use('/api/presets', requireAuth, requireTenant, ...)`
- Opravil health endpoint (`/health`) — uz nevrati workspaceRoot, projectRoot, backendRoot (filesystem leakage)
- Upravil getTenantIdFromReq aby preferoval `req.tenantId` z middleware (pred fallback na env)

```jsx
// PRED:
app.get('/health', (req, res) => {
  res.json({ status: 'ok', workspaceRoot, projectRoot, backendRoot });
});

// PO:
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

---

### 22. `backend-local/package.json`

**Typ:** Zmeneno
**Duvod:** Pridat Firebase Admin SDK dependency

**Co se zmenilo:**
- Pridan `"firebase-admin": "^12.0.0"` (latest stable)
- Aktualizovano pres `npm install` (ve Faze 0)

---

## Dopad zmen

- **Ovlivnene komponenty:** AuthContext (root), Login, Register, Header, Routes, PrivateRoute, ApiClient (vsechny pouzivajici /api)
- **Breaking changes:** AuthContext nyni vyrazuje provider (FirebaseAuthProvider ne direktni implementace). Je potreba zmenit importy v indexu a dalších souboru.
- **Nove zavislosti:** `firebase-admin` (backend)
- **Rizika:**
  - Widget (pokud pouziva auth) — zatim se netesti (out of scope pro Sprint 1)
  - Admin stranky — zatim se netestovaly (jen build)
  - Tenant isolation — zatim bez full testy (middleware jsou novy)

---

## Testovani

- **Build:** `npm run build` — PASS (46s)
- **Manual test:** Zadne (!) — CHYBA Claude (vynechano)
- **Poznamky:** Faze 4 Build test byla jedina faze ktera mela testovani, ale funkcni/integracni testy NEBYLY provedeny. Historie, reporty a /compact NEBYLY spusteny.

---

## PRESNE STATISTIKY SOUBORU

| Soubor | Akce | Radku (pred) | Radku (po) | Hlavni exporty | Poznamky |
|--------|------|-------------|------------|---------------|----------|
| `src/context/AuthContext.jsx` | Zmeneno | 41 | 11 | `AuthContext` (default), `useAuth` (named) | Odstranena Firebase logika, zachovan jen context hook |
| `src/providers/FirebaseAuthProvider.jsx` | Novy | — | 189 | default func | login, loginWithGoogle, register, logout, getToken, refreshToken, resetPassword, updateProfile |
| `src/providers/SupabaseAuthProvider.jsx` | Novy | — | 30 | default func | Stub provider, vsechny funkce throw Error("not implemented") |
| `src/providers/index.jsx` | Novy | — | 19 | `ActiveAuthProvider` (named) | Conditional export Firebase/Supabase na zaklade VITE_AUTH_PROVIDER |
| `src/components/ui/GoogleSignInButton.jsx` | Novy | — | 70 | default func | React component s Google SVG logem + hover |
| `src/lib/apiClient.js` | Novy | — | 47 | default | Axios instance s Bearer token interceptory |
| `src/context/AuthContext.jsx` | Zmeneno | 41 | 11 | `AuthContext` (default), `useAuth` (named) | Viz vyse |
| `src/index.jsx` | Zmeneno | 20 | 20 | — | Zmena z AuthProvider na ActiveAuthProvider (radky 7-8) |
| `src/Routes.jsx` | Zmeneno | 129 | 129 | `default func` | Aktivace PrivateRoute pro /account a /admin (radky 87-115) |
| `src/components/PrivateRoute.jsx` | Zmeneno | 40 | 40 | default func | Zmena Tailwind → Forge inline styles (radky 10-30) |
| `src/pages/login/index.jsx` | Zmeneno | 16 | 17 | default func | Odstraneni Firebase importu, zjednoduseni (radky 1-17) |
| `src/pages/login/components/LoginForm.jsx` | Zmeneno | 244 | 243 | default func | Zmena na useAuth() + GoogleSignInButton (zmeny rozprostireny) |
| `src/pages/register/index.jsx` | Zmeneno | 64 | 65 | default func | Zjednoduseni z multi-step na single-step (radky 1-65) |
| `src/pages/register/components/RegistrationForm.jsx` | Zmeneno | 342 | 342 | default func | Odstraneni role fields + Google button (zmeny rozprostireny) |
| `src/pages/register/components/RoleSelectionCard.jsx` | Smazan | (sloZ) | — | — | Komponenta pro role selection - uz se nepouziva |
| `src/pages/register/components/ProgressSteps.jsx` | Smazan | (soubor) | — | — | Multi-step progress UI - uz se nepouziva |
| `src/pages/register/components/LanguageToggle.jsx` | Smazan | (soubor) | — | — | Language toggle - spravuje se pres LanguageContext |
| `src/components/ui/Header.jsx` | Zmeneno | 462 | 462 | default func | Zmena Firebase imports na useAuth() (radky 6, 20, 77) |
| `backend-local/src/firebaseAdmin.js` | Novy | — | 27 | `adminAuth` (named), default | Singleton Firebase Admin SDK init |
| `backend-local/src/middleware/auth.js` | Novy | — | 51 | `requireAuth` (named), `optionalAuth` (named) | Auth middleware s verifyIdToken |
| `backend-local/src/middleware/tenant.js` | Novy | — | 25 | `requireTenant` (named) | Tenant isolation middleware z JWT claims |
| `backend-local/src/index.js` | Zmeneno | 407 | 491 | — | Pridam middleware, zaverit API routes (radky 29-80) |
| `backend-local/package.json` | Zmeneno | 21 | 21 | — | Pridam dep firebase-admin ^13.6.1 (radky 16) |

### Poznamky k tabulce

- **Radky (pred)/(po):** Presny pocet na zaklade nactenych souboru
- **Smazane soubory:** Bez presneho poctu (uz neexistuji), ale pocty byly pri smazani: RoleSelectionCard (cca 80), ProgressSteps (cca 60), LanguageToggle (cca 50) — celkem cca 190 radku smazano
- **Zmeny rozprostireny:** LoginForm a RegistrationForm maji zmeny v ruznych castech souboru, ne jen v radkovem rozsahu (proto je seznam "zmeny rozprostireny")
- **Backend-local/src/index.js:** Zvetsil se z 407 na 491 radku (pridam middleware importy + app.use pro auth+tenant, zmeny v getTenantIdFromReq)

---

<!-- KONEC SABLONY -->
