# 02 — Vyzkum: PrivateRoutes & Auth Architecture

> **Datum:** 2026-02-20
> **Faze:** 2 ze 4 (Auth Research)
> **Ucel:** Zjistit jak spravne implementovat provider-agnosticky auth system s PrivateRoutes

---

## 1. Frontend: PrivateRoute & Route Protection

### 1.1 React Router v6+ — Kanonicky Outlet Pattern

React Router v6 zrusil stary `<PrivateRoute component={X}>` pristup. `<Routes>` traversuje jen prime `<Route>` deti — custom wrapper okolo `<Route>` by byl ignorovan.

**Spravny vzor (layout routes s Outlet):**

```jsx
// PrivateRoute.jsx — layout route
export default function PrivateRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;  // KRITICKE: zabrani flash-of-login
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
```

**Pouziti v Routes.jsx:**
```jsx
<Route element={<PrivateRoute />}>
  <Route path="/account" element={<AccountPage />} />
</Route>
```

**Nas aktualni stav:** PrivateRoute.jsx ma SPRAVNY pattern, jen je ZAKOMENTOVANY v Routes.jsx. Staci odkomentovat.

### 1.2 Loading Guard — Prevence Flash of Unauthenticated Content

BEZ loading guardu: pri page refresh je auth state `null` po ~100-300ms (nez Firebase/Supabase rozresi) → okamzity redirect na /login → spatny UX.

```jsx
// SPATNE — zpusobi flash
if (!currentUser) return <Navigate to="/login" />;

// SPRAVNE — pocka na rozreseni
if (loading) return <Spinner />;
if (!currentUser) return <Navigate to="/login" state={{ from: location }} />;
return <Outlet />;
```

### 1.3 Redirect po loginu (state.from pattern)

```jsx
// Login.jsx — cteni state.from po uspesnem loginu
const { state } = useLocation();
const navigate = useNavigate();

const handleLogin = async (credentials) => {
  await login(credentials);
  navigate(state?.from?.pathname || '/admin', { replace: true });
};
```

**Nas aktualni stav:** Login/index.jsx uz ma `from = location.state?.from?.pathname || '/customer-dashboard'` — staci zmenit default na `/admin`.

### 1.4 Vnorena ochrana rout (Admin Routes)

```jsx
// Approach: Nested guards
<Route element={<PrivateRoute />}>
  <Route path="/account" element={<AccountPage />} />
</Route>

<Route element={<PrivateRoute />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="pricing" element={<AdminPricing />} />
    {/* ... dalsi admin routy */}
  </Route>
</Route>
```

Pro budoucnost (role-based):
```jsx
function RoleRoute({ allowedRoles }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!allowedRoles.includes(currentUser.role || 'user')) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
```

### 1.5 Kategorizace rout

| Typ | Routy | Ochrana |
|-----|-------|---------|
| **Public** | `/`, `/pricing`, `/support`, `/login`, `/register`, `/w/:id` | Zadna |
| **Protected** | `/account`, `/test-kalkulacka`, `/test-kalkulacka-white` | PrivateRoute |
| **Admin** | `/admin/*` (vsechny admin routy) | PrivateRoute (budoucne AdminRoute s role) |
| **Semi-public** | `/w/:publicWidgetId` | Bez auth, ale tenant-scoped dle konfigurace |

---

## 2. Provider-Agnosticky AuthProvider

### 2.1 AuthProvider kontrakt (interface)

```typescript
interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  role?: string;           // 'user' | 'admin' — pro budouci role-based routing
  tenantId?: string;       // pro vazbu na tenant
  metadata?: Record<string, unknown>;
}

interface AuthContextValue {
  // Stav
  currentUser: AuthUser | null;
  loading: boolean;
  error: string | null;

  // Akce
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, metadata?: object) => Promise<void>;
  getToken: () => Promise<string | null>;
  refreshToken: () => Promise<string | null>;

  // Reset
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}
```

### 2.2 Abstraktni kontext (nezavisle na provideru)

```jsx
// context/AuthContext.jsx — NOVY, provider-agnosticky
const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export { AuthContext };
```

### 2.3 Firebase implementace

```jsx
// providers/FirebaseAuthProvider.jsx
export function FirebaseAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user ? normalizeFirebaseUser(user) : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    setError(null);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const getToken = async () => auth.currentUser?.getIdToken() ?? null;
  const refreshToken = async () => auth.currentUser?.getIdToken(true) ?? null;

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, login, logout, getToken, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

function normalizeFirebaseUser(fbUser) {
  return {
    id: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    role: fbUser.customClaims?.role || 'user',
    metadata: { emailVerified: fbUser.emailVerified },
  };
}
```

### 2.4 Supabase implementace (budouci)

```jsx
// providers/SupabaseAuthProvider.jsx
export function SupabaseAuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session ? normalizeSupabaseUser(session.user) : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session ? normalizeSupabaseUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => await supabase.auth.signOut();
  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 2.5 Prepinani provideru (env variable)

```jsx
// App.jsx
const AUTH_PROVIDER = import.meta.env.VITE_AUTH_PROVIDER || 'firebase';

const providers = {
  firebase: FirebaseAuthProvider,
  supabase: SupabaseAuthProvider,
};
const ActiveAuthProvider = providers[AUTH_PROVIDER] || FirebaseAuthProvider;

export default function App() {
  return (
    <ActiveAuthProvider>
      <Routes />
    </ActiveAuthProvider>
  );
}
```

**Klic:** Vsechny consuming komponenty (`useAuth()`) zustavaji BEZE ZMENY pri prepnuti providera.

---

## 3. Backend: Auth Middleware (Express)

### 3.1 Multi-provider middleware (strategie pattern)

```javascript
// middleware/auth.js
function detectProvider(token) {
  const decoded = jwt.decode(token, { complete: true });
  const iss = decoded?.payload?.iss;
  if (iss?.includes('securetoken.google.com')) return 'firebase';
  if (iss?.includes('supabase.co')) return 'supabase';
  return 'generic';
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token' });
  }
  const token = authHeader.split('Bearer ')[1];
  const provider = detectProvider(token);

  try {
    if (provider === 'firebase') {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = { id: decoded.uid, email: decoded.email, provider: 'firebase' };
    } else if (provider === 'supabase') {
      const { payload } = await jwtVerify(token, SUPABASE_JWKS);
      req.user = { id: payload.sub, email: payload.email, provider: 'supabase' };
    } else {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      req.user = { id: decoded.sub, email: decoded.email, provider: 'generic' };
    }
    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError' || err.code === 'auth/id-token-expired';
    return res.status(isExpired ? 401 : 403).json({
      error: isExpired ? 'TokenExpired' : 'Forbidden'
    });
  }
}
```

### 3.2 Optional auth (routes co fungujou s i bez auth)

```javascript
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    req.user = null;
  }
  next();
}
```

### 3.3 Status kody

| Kod | Kdy pouzit |
|-----|-----------|
| `401 Unauthorized` | Zadne credentials (chybi token) |
| `403 Forbidden` | Credentials existuji ale jsou neplatne/nedostatecne |

### 3.4 Rate limiting pro auth endpointy

```javascript
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,     // 10 minut
  max: 5,                        // 5 pokusu za okno
  skipSuccessfulRequests: true,  // jen neuspesne pokusy
  message: { error: 'TooManyRequests', message: 'Prilis mnoho pokusu. Zkuste za 10 minut.' },
});

app.post('/auth/login', authLimiter, login);
app.post('/auth/register', authLimiter, register);
```

---

## 4. Tenant Izolace pres Auth (ne headery)

### 4.1 Aktualni stav — NEBEZPECNY

```javascript
// backend-local/src/index.js:80-83 — PODVRZITELNE
function getTenantIdFromReq(req) {
  const fromHeader = String(req.headers["x-tenant-id"] || "").trim();
  return fromHeader || "demo-tenant";
}
```

**Problem:** Kdokoli muze poslat `x-tenant-id: cizi-tenant` a pristupovat k cizim datum.

### 4.2 Cilovy stav — tenantId z JWT

```javascript
// middleware/tenant.js
async function requireTenant(req, res, next) {
  // Primarni zdroj: z overeneho JWT payload
  let tenantId = req.user?.tenantId;

  // Prechodne obdobi: fallback na header s warningem
  if (!tenantId && req.headers['x-tenant-id']) {
    tenantId = req.headers['x-tenant-id'];
    console.warn(`[DEPRECATED] x-tenant-id header pouzit z ${req.ip}`);

    // Bezpecnostni guard: pokud user JE autentizovany, over shodu
    if (req.user?.tenantId && req.user.tenantId !== tenantId) {
      return res.status(403).json({ error: 'TenantMismatch' });
    }
  }

  if (!tenantId) {
    return res.status(400).json({ error: 'TenantRequired' });
  }

  req.tenantId = tenantId;
  next();
}
```

### 4.3 User-Tenant mapovani (budouci)

```sql
CREATE TABLE user_tenant_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  role       TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, tenant_id)
);
```

### 4.4 Migracni strategie (header → auth)

1. **Krok 1:** Pridat auth middleware VEDLE existujiciho header-based systemu
2. **Krok 2:** Prechodne obdobi — preferovat JWT, fallback na header s deprecation logem
3. **Krok 3:** Odebrat header fallback, vyzadovat auth vsude
4. **Krok 4:** Smazat `getTenantIdFromReq` z backendu

---

## 5. Token Management

### 5.1 Storage — kde ulozit tokeny

| Uloziste | XSS riziko | CSRF riziko | Persistence | Doporuceni |
|----------|-----------|------------|-------------|------------|
| `localStorage` | VYSOKE (skript precte) | Zadne | Do smazani | Interni nastroje, dev |
| `sessionStorage` | VYSOKE (jen tab) | Zadne | Do zavreni tabu | Kratke sessions |
| `httpOnly cookie` | ZADNE (JS neprecte) | Stredni (SameSite) | Konfigurovatelne | **Produkcni tokeny** |
| Memory (React state) | ZADNE | Zadne | Page reload = logout | **Access tokeny** |

**OWASP doporuceni:** Refresh token v httpOnly cookie, access token v pameti.

**Pro nas projekt (Firebase/Supabase):** Obe SDK handluji tokeny SAMY (localStorage/IndexedDB). Pro volani na NAS backend pripojime token v Authorization header pres interceptor.

### 5.2 Token refresh strategie

Firebase i Supabase refreshuji tokeny automaticky internte. Axios interceptor potrebujeme JEN pro volani na nas vlastni backend:

```javascript
// lib/apiClient.js
const apiClient = axios.create({ baseURL: '/api' });

// Pripojit token ke kazdemu requestu
apiClient.interceptors.request.use(async (config) => {
  const { getToken } = useAuth(); // nebo reference na auth provider
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — refresh a retry
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status !== 401 || error.config._retry) {
      return Promise.reject(error);
    }
    error.config._retry = true;
    const { refreshToken } = useAuth();
    const newToken = await refreshToken();
    error.config.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(error.config);
  }
);
```

---

## 6. Session Management

### 6.1 Multi-tab synchronizace

```jsx
// V AuthProvider — sync logout napric taby
useEffect(() => {
  const channel = new BroadcastChannel('auth_channel');
  channel.addEventListener('message', (event) => {
    if (event.data.type === 'LOGOUT') setCurrentUser(null);
    if (event.data.type === 'LOGIN') window.location.reload();
  });
  return () => channel.close();
}, []);

// Po logout
const logout = async () => {
  await authProvider.logout();
  setCurrentUser(null);
  new BroadcastChannel('auth_channel').postMessage({ type: 'LOGOUT' });
};
```

### 6.2 Idle timeout

```jsx
// hooks/useIdleTimeout.js
const IDLE_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minut

export function useIdleTimeout(onIdle) {
  const timer = useRef(null);
  const resetTimer = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(onIdle, IDLE_TIMEOUT);
  }, [onIdle]);

  useEffect(() => {
    IDLE_EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(timer.current);
      IDLE_EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer));
    };
  }, [resetTimer]);
}
```

### 6.3 Session tracking na backendu

Pro funkci "Aktivni zarizeni" v Account/Security tabu:

```javascript
// lib/sessionStore.js — Redis pro prod, Map pro dev
const SessionStore = {
  createSession(userId, deviceId, data),
  touchSession(userId, deviceId),        // update lastSeen
  listSessions(userId),                   // pro UI "Active Sessions"
  revokeSession(userId, deviceId),        // odhlasit 1 zarizeni
  revokeAllSessions(userId),              // "Odhlasit vsechna zarizeni"
  revokeOtherSessions(userId, current),   // "Odhlasit ostatni"
};
```

---

## 7. Provider Abstrakce — Jak prepnout za 1 den

### 7.1 Architektura (diagram)

```
┌─────────────────────────────────────────────────────────┐
│  React App                                               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  <ActiveAuthProvider>                              │  │
│  │   (FirebaseAuthProvider | SupabaseAuthProvider)     │  │
│  │                                                    │  │
│  │  Kontrakt:                                         │  │
│  │   currentUser, loading, error                      │  │
│  │   login(), logout(), getToken(), refreshToken()    │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  <BrowserRouter>                             │  │  │
│  │  │                                              │  │  │
│  │  │  Public: /, /login, /register, /pricing      │  │  │
│  │  │                                              │  │  │
│  │  │  <PrivateRoute>  ← loading → Spinner         │  │  │
│  │  │    /account  → AccountPage                   │  │  │
│  │  │                                              │  │  │
│  │  │  <PrivateRoute>  ← budoucne AdminRoute       │  │  │
│  │  │    /admin/*  → AdminLayout → Outlet          │  │  │
│  │  │                                              │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  apiClient (axios)                                       │
│   request:  attach token z getToken()                    │
│   response: 401 → refreshToken() → retry                │
└─────────────────────────────────────────────────────────┘

Backend (Express):
┌─────────────────────────────────────────────────────────┐
│  app.use(cors())     ← PRED auth (OPTIONS nema token)   │
│  app.use(requireAuth)  ← multi-provider detection       │
│  app.use(requireTenant) ← tenantId z JWT, ne header     │
│                                                          │
│  Routes:                                                 │
│  /auth/login     → authLimiter → login                   │
│  /auth/register  → authLimiter → register                │
│  /auth/refresh   → refreshLimiter → refresh              │
│  /api/*          → requireAuth → requireTenant → ...     │
│  /admin/*        → requireAuth → requireRole('admin')    │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Soubory k vytvoreni/uprave

| Soubor | Akce | Priorita |
|--------|------|----------|
| `src/context/AuthContext.jsx` | Refaktorovat na abstraktni kontext | P0 |
| `src/providers/FirebaseAuthProvider.jsx` | NOVY — Firebase implementace kontraktu | P0 |
| `src/providers/SupabaseAuthProvider.jsx` | NOVY — Supabase implementace (pripraveno) | P1 |
| `src/components/PrivateRoute.jsx` | Beze zmeny (uz je spravne) | — |
| `src/Routes.jsx` | Odkomentovat PrivateRoute, pridat admin wrapping | P0 |
| `src/pages/login/index.jsx` | Pouzit `useAuth().login()` misto primo Firebase | P0 |
| `src/pages/register/index.jsx` | Zjednodusit na 1 formular, pouzit `useAuth().register()` | P0 |
| `src/lib/apiClient.js` | NOVY — axios instance s auth interceptory | P0 |
| `src/hooks/useIdleTimeout.js` | NOVY — idle timeout hook | P1 |
| `backend-local/src/middleware/auth.js` | NOVY — multi-provider auth middleware | P0 |
| `backend-local/src/middleware/tenant.js` | NOVY — tenant z JWT (ne header) | P0 |
| `backend-local/src/middleware/rateLimiter.js` | NOVY — rate limiting pro auth | P1 |

### 7.3 Poradi implementace

```
1. Abstraktni AuthContext + FirebaseAuthProvider     (FE — zaklad)
2. Odkomentovat PrivateRoute v Routes.jsx            (FE — route ochrana)
3. Zjednodusit Login/Register                        (FE — UX)
4. Backend auth middleware (requireAuth)              (BE — zaklad)
5. Backend tenant middleware (requireTenant z JWT)    (BE — izolace)
6. apiClient s interceptory                          (FE → BE propojeni)
7. Multi-tab sync (BroadcastChannel)                 (FE — UX)
8. Idle timeout                                      (FE — bezpecnost)
9. Session tracking na backendu                      (BE — pro Active Sessions UI)
10. Rate limiting                                    (BE — bezpecnost)
```

---

*Dokument vytvoren: 2026-02-20*
*Zdroje: Context7 (React Router v6/v7), web research (NextAuth, Lucia, Auth.js, OWASP), analýza existujiciho kodu*
