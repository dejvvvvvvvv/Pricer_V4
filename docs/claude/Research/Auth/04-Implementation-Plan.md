# 04 — Implementacni Plan: Auth System pro ModelPricer

> **Datum:** 2026-02-20
> **Faze:** 4 ze 4 (Auth Research)
> **Ucel:** Detailni plan implementace robustniho auth systemu na zaklade vyzkumu z Fazi 1-3
> **Vstupni dokumenty:**
> - `01-Account-Section-Pages.md` — vyzkum Account sekce
> - `02-PrivateRoutes-Auth-Architecture.md` — vyzkum auth architektury
> - `03-Security-Mistakes-Checklist.md` — bezpecnostni checklist

---

## 1. Architektura — Prehled

### 1.1 Cilovy stav

```
┌─────────────────────────────────────────────────────────────┐
│  React App (Vite, port 4028)                                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  <ActiveAuthProvider>                                  │  │
│  │   env: VITE_AUTH_PROVIDER = 'firebase' | 'supabase'    │  │
│  │                                                        │  │
│  │   Kontrakt (useAuth()):                                │  │
│  │   - currentUser, loading, error                        │  │
│  │   - login(), logout(), register()                      │  │
│  │   - getToken(), refreshToken()                         │  │
│  │   - resetPassword(), updateProfile()                   │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  <BrowserRouter>                                 │  │  │
│  │  │                                                  │  │  │
│  │  │  PUBLIC (bez ochrany):                           │  │  │
│  │  │    /            → Home                           │  │  │
│  │  │    /login       → Login (zjednoduseny)           │  │  │
│  │  │    /register    → Register (bez role wizardu)    │  │  │
│  │  │    /pricing     → Pricing                        │  │  │
│  │  │    /support     → Support                        │  │  │
│  │  │    /w/:id       → WidgetPublicPage               │  │  │
│  │  │                                                  │  │  │
│  │  │  PROTECTED (<PrivateRoute>):                     │  │  │
│  │  │    /account     → AccountPage (4 taby, real data)│  │  │
│  │  │    /test-kalkulacka → TestKalkulacka             │  │  │
│  │  │                                                  │  │  │
│  │  │  ADMIN (<PrivateRoute>):                         │  │  │
│  │  │    /admin/*     → AdminLayout → Outlet           │  │  │
│  │  │                                                  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  apiClient (axios):                                          │
│   request:  Bearer token z getToken()                        │
│   response: 401 → refreshToken() → retry                    │
└──────────────────────────────────────────────────────┬───────┘
                                                       │
                                                  /api (proxy)
                                                       │
┌──────────────────────────────────────────────────────▼───────┐
│  Express Backend (port 3001)                                  │
│                                                              │
│  app.use(cors({origin: ALLOWLIST}))   ← PRED auth           │
│  app.get('/api/health', minimalHealth) ← verejny            │
│                                                              │
│  app.use('/api', requireAuth)         ← multi-provider       │
│  app.use('/api', requireTenant)       ← tenantId z JWT       │
│                                                              │
│  /api/presets    → requireAuth + requireTenant               │
│  /api/slice      → requireAuth + requireTenant + sliceLimiter│
│  /api/storage/*  → requireAuth + requireTenant               │
│  /api/user/*     → requireAuth (profil, heslo)               │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Klicova rozhodnuti

| Rozhodnuti | Volba | Duvod |
|-----------|-------|-------|
| Auth provider | Firebase (aktualne) → Supabase (budouci) | Jiz mame Firebase, Supabase plan existuje |
| Provider abstrakce | ANO — agnosticky AuthContext | Umozni prepnuti za 1 den |
| Token storage | Firebase SDK handles (localStorage) | Akceptovatelne pro BETA + CSP header |
| Route ochrana | Outlet pattern (uz mame) | React Router v6 standard |
| Tenant izolace | JWT-derived tenantId | Eliminuje header spoofing |
| Role system | Jeden typ (admin) pro ted | Zjednoduseni dle pozadavku |
| Login/Register | Jednoduchy formular bez wizardu | Dle pozadavku |
| Account sekce | 4 taby (Profile, Company, Security, Billing) | Industry standard (viz Phase 1) |

---

## 2. Implementacni kroky — Poradi

### Sprint 1: Auth Foundation (P0 — KRITICKE)

#### Step 1.1: Provider-agnosticky AuthContext
**Soubory:**
- `src/context/AuthContext.jsx` → PREDELAT na abstraktni kontext (jen createContext + useAuth hook)
- `src/providers/FirebaseAuthProvider.jsx` → NOVY — Firebase implementace kontraktu
- `src/providers/SupabaseAuthProvider.jsx` → NOVY — pripravena Supabase implementace (stub)
- `src/providers/index.js` → NOVY — export ActiveAuthProvider dle env

**Kontrakt:**
```javascript
// Vsechny providery musi implementovat:
{
  currentUser: { id, email, displayName, role, tenantId, metadata } | null,
  loading: boolean,
  error: string | null,
  login: (email, password) => Promise<void>,
  logout: () => Promise<void>,
  register: (email, password, metadata?) => Promise<void>,
  getToken: () => Promise<string | null>,
  refreshToken: () => Promise<string | null>,
  resetPassword: (email) => Promise<void>,
  updateProfile: (data) => Promise<void>,
}
```

**Zavislosti:** Zadne (prvni krok)

#### Step 1.2: Aktivovat PrivateRoute v Routes.jsx
**Soubory:**
- `src/Routes.jsx` → Odkomentovat PrivateRoute, obalit `/account` a `/admin/*`

**Zmeny:**
```jsx
// PRED:
{/* <Route element={<PrivateRoute />}> */}
  <Route path="/account" element={<AccountPage />} />
{/* </Route> */}

// PO:
<Route element={<PrivateRoute />}>
  <Route path="/account" element={<AccountPage />} />
  <Route path="/test-kalkulacka" element={<TestKalkulacka />} />
  <Route path="/test-kalkulacka-white" element={<TestKalkulackaWhite />} />
</Route>

<Route element={<PrivateRoute />}>
  <Route path="/admin" element={<AdminLayout />}>
    {/* vsechny admin subrouty */}
  </Route>
</Route>
```

**Zavislosti:** Step 1.1 (AuthContext musi fungovat)

#### Step 1.3: Zjednodusit Login stranku
**Soubory:**
- `src/pages/login/index.jsx` → Pouzit `useAuth().login()` misto primo Firebase
- `src/pages/login/components/LoginForm.jsx` → Upravit redirect na `/admin`

**Zmeny:**
- Pouzit `useAuth().login(email, password)` misto `signInWithEmailAndPassword`
- Default redirect: `/admin` (ne `/customer-dashboard`)
- Pridat error handling s toast (ne console.error)

**Zavislosti:** Step 1.1

#### Step 1.4: Zjednodusit Register stranku
**Soubory:**
- `src/pages/register/index.jsx` → PREPSAT — jednoduchy 1-step formular
- `src/pages/register/components/RegistrationForm.jsx` → UPRAVIT — bez role fields
- Smazat/archivovat: `RoleSelectionCard.jsx`, `ProgressSteps.jsx` (nepotrebne)

**Zmeny:**
- Smazat role selection (step 1)
- Smazat verification step (step 3) — email verifikaci resit automaticky
- Pole: email, heslo, potvrzeni hesla, jmeno, prijmeni
- Pouzit `useAuth().register(email, password, { displayName })`

**Zavislosti:** Step 1.1

#### Step 1.5: Backend auth middleware
**Soubory:**
- `backend-local/src/middleware/auth.js` → NOVY — multi-provider requireAuth
- `backend-local/src/middleware/tenant.js` → NOVY — tenantId z JWT
- `backend-local/src/index.js` → Pridat middleware pred routy

**Zmeny:**
```javascript
// index.js — PRED vsemi chraneymi routami
import { requireAuth } from './middleware/auth.js';
import { requireTenant } from './middleware/tenant.js';

// Verejne routy (BEZ auth)
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Chranene routy (S auth + tenant)
app.use("/api/presets", requireAuth, requireTenant);
app.use("/api/slice", requireAuth, requireTenant);
app.use("/api/storage", requireAuth, requireTenant);
```

**Zavislosti:** Zadne (backend je nezavisly)

#### Step 1.6: apiClient s auth interceptory
**Soubory:**
- `src/lib/apiClient.js` → NOVY — axios instance s Bearer token a 401 retry

**Zmeny:**
- Request interceptor: pridat `Authorization: Bearer ${token}` z `getToken()`
- Response interceptor: na 401 zavolat `refreshToken()` a retry
- Fail queue pro soucastne requesty behem refreshe

**Zavislosti:** Step 1.1

---

### Sprint 2: Account Page — Real Data (P0)

#### Step 2.1: Tab Profil — napojit na auth data
**Soubory:**
- `src/pages/account/index.jsx` → Nahradit mock data za `useAuth().currentUser`

**Zmeny:**
- Ziskat `currentUser` z `useAuth()`
- `profileData` inicializovat z `currentUser` (ne hardcoded Jan Novak)
- Save → volat `useAuth().updateProfile(data)` + backend endpoint
- Nahradit `alert()` za toast system

#### Step 2.2: Tab Firma — napojit na storage
**Soubory:**
- `src/pages/account/index.jsx` → Company tab cte/pise pres storage helper
- `src/utils/adminCompanyStorage.js` → NOVY (nebo rozsirit existujici)

**Zmeny:**
- Company data ulozit do tenant-scoped localStorage (namespace `company:v1`)
- Save → pise pres storage helper
- Load → cte pres storage helper pri mount

#### Step 2.3: Tab Zabezpeceni — zmena hesla
**Soubory:**
- `src/pages/account/index.jsx` → Security tab — real password change

**Zmeny:**
- Password change → `useAuth().updatePassword()` nebo Firebase reauthenticate + updatePassword
- Nahradit `alert()` za toast
- Zachovat strength meter (uz funguje)
- 2FA: pro BETA zobrazit "Coming soon" placeholder

#### Step 2.4: Tab Predplatne — zobrazeni planu
**Soubory:**
- `src/pages/account/index.jsx` → Billing tab — zobrazit aktualni plan

**Zmeny:**
- Pro BETA: zobrazit aktualni plan (Starter/Professional/Enterprise) z tenant configu
- Tlacitko "Zmenit tarif" → link na /pricing stranku
- Platebni metody a faktury → "Coming soon" placeholder pro BETA
- Zruseni → contact support CTA

#### Step 2.5: Toast system
**Soubory:**
- `src/components/ui/Toast.jsx` → NOVY — forge-styled toast/snackbar
- `src/hooks/useToast.js` → NOVY — hook pro zobrazeni toastu

**Zmeny:**
- Forge dark theme styling
- Auto-dismiss po 3-5s
- Success (zelena) / Error (cervena) / Warning (oranzova) / Info (modra)
- Nahradit vsechny `alert()` v Account page

---

### Sprint 3: Security Hardening (P1)

#### Step 3.1: Rate limiting na backendu
**Soubory:**
- `backend-local/src/middleware/rateLimiter.js` → NOVY
- `backend-local/package.json` → Pridat `express-rate-limit`
- `backend-local/src/index.js` → Pridat limitery na endpointy

**Konfigurace:**
- Login: 5 pokusu / 10 min
- API: 100 req / min
- Slice: 10 req / min (CPU-narocny)

#### Step 3.2: CORS hardening
**Soubory:**
- `backend-local/src/index.js` → Explicitni origin allowlist

**Zmeny:**
- Smazat `if (corsOrigins.includes("*"))` vetev
- Explicitni Set originu (ne array s `*`)
- V produkci: jen HTTPS domeny

#### Step 3.3: Health endpoint — odstranit citlive info
**Soubory:**
- `backend-local/src/index.js:66-76` → Minimal health

**Zmeny:**
```javascript
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});
```

#### Step 3.4: Multi-tab sync (BroadcastChannel)
**Soubory:**
- `src/providers/FirebaseAuthProvider.jsx` → Pridat BroadcastChannel listener
- `src/providers/SupabaseAuthProvider.jsx` → Pridat BroadcastChannel listener

**Zmeny:**
- Pri logout: broadcast `{ type: 'LOGOUT' }` do vsech tabu
- Pri primu: nastavit `currentUser = null` v ostatnich tabach

#### Step 3.5: Idle timeout
**Soubory:**
- `src/hooks/useIdleTimeout.js` → NOVY — 30min idle = logout
- `src/App.jsx` nebo top-level → Pouzit hook

---

### Sprint 4: Post-BETA Vylepseni (P2)

#### Step 4.1: 2FA setup (TOTP)
- Krokovy wizard v Security tabu (QR → verifikace → recovery kody)
- Vyzaduje backend endpoint pro generovani TOTP secret + overeni kodu

#### Step 4.2: Aktivni sessions
- Backend: session tracking (Redis nebo in-memory Map pro dev)
- Frontend: tabulka v Security tabu (zarizeni, IP, posledni aktivita)
- Akce: "Odhlasit toto zarizeni", "Odhlasit vsechna zarizeni"

#### Step 4.3: Platebni integrace (Stripe)
- Billing tab: real platebni metody, faktury, plan zmeny
- Backend: Stripe webhook handler

#### Step 4.4: Role-based access (budouci)
- AdminRoute s role kontrolou
- Backend requireRole middleware
- User → Tenant → Role mapovani v DB

---

## 3. Seznam souboru — kompletni

### Nove soubory (vytvorit)

| Soubor | Ucel | Sprint |
|--------|------|--------|
| `src/context/AuthContext.jsx` | Abstraktni auth kontext (PREDELAT) | S1 |
| `src/providers/FirebaseAuthProvider.jsx` | Firebase implementace | S1 |
| `src/providers/SupabaseAuthProvider.jsx` | Supabase implementace (stub) | S1 |
| `src/providers/index.js` | Provider selector dle env | S1 |
| `src/lib/apiClient.js` | Axios s auth interceptory | S1 |
| `src/components/ui/Toast.jsx` | Toast/snackbar komponenta | S2 |
| `src/hooks/useToast.js` | Toast hook | S2 |
| `src/hooks/useIdleTimeout.js` | Idle timeout hook | S3 |
| `backend-local/src/middleware/auth.js` | Multi-provider auth middleware | S1 |
| `backend-local/src/middleware/tenant.js` | Tenant z JWT middleware | S1 |
| `backend-local/src/middleware/rateLimiter.js` | Rate limiting | S3 |

### Existujici soubory (upravit)

| Soubor | Co zmenit | Sprint |
|--------|----------|--------|
| `src/Routes.jsx` | Odkomentovat PrivateRoute, obalit admin routy | S1 |
| `src/pages/login/index.jsx` | Pouzit useAuth().login(), zmenit default redirect | S1 |
| `src/pages/login/components/LoginForm.jsx` | Redirect logika | S1 |
| `src/pages/register/index.jsx` | Zjednodusit na 1-step formular | S1 |
| `src/pages/register/components/RegistrationForm.jsx` | Odstranit role pole | S1 |
| `src/pages/account/index.jsx` | Real data misto mocku, toast misto alert | S2 |
| `backend-local/src/index.js` | Pridat auth middleware, opravit CORS, opravit health | S1+S3 |
| `backend-local/package.json` | Pridat firebase-admin, express-rate-limit | S1+S3 |

### Soubory k archivaci/smazani

| Soubor | Duvod |
|--------|-------|
| `src/pages/register/components/RoleSelectionCard.jsx` | Zadne role → nepotrebne |
| `src/pages/register/components/ProgressSteps.jsx` | 1-step formular → nepotrebne |

---

## 4. Zavislosti mezi kroky

```
Sprint 1 (Auth Foundation):
  Step 1.1 (AuthContext)  ← zadna zavislost (prvni)
       │
       ├── Step 1.2 (PrivateRoute) ← zavisi na 1.1
       ├── Step 1.3 (Login)        ← zavisi na 1.1
       ├── Step 1.4 (Register)     ← zavisi na 1.1
       └── Step 1.6 (apiClient)    ← zavisi na 1.1

  Step 1.5 (Backend middleware) ← nezavisly, paralelizovatelny

Sprint 2 (Account Page):
  Step 2.5 (Toast system) ← zadna zavislost
  Step 2.1 (Profil)       ← zavisi na 1.1 + 2.5
  Step 2.2 (Firma)        ← zavisi na 2.5
  Step 2.3 (Security)     ← zavisi na 1.1 + 2.5
  Step 2.4 (Billing)      ← zavisi na 2.5

Sprint 3 (Security):
  Vsechny kroky jsou nezavisle a paralelizovatelne
```

---

## 5. Bezpecnostni checklist aplikovany na plan

### Z Phase 3 — kontrola ze plan adresuje vsechny CRITICAL/HIGH issues:

| # | Issue | Adresovano v | Status |
|---|-------|-------------|--------|
| 1 | x-tenant-id spoofing | Step 1.5 (backend tenant middleware) | ANO |
| 2 | Zadny auth middleware | Step 1.5 (backend auth middleware) | ANO |
| 3 | Admin bez ochrany | Step 1.2 (PrivateRoute aktivace) | ANO |
| 4 | Client-side role checks only | Step 1.5 (backend requireAuth) | ANO |
| 5 | Flash of unauth content | Step 1.2 (loading guard uz existuje) | ANO |
| 6 | Tokeny v localStorage | Akceptovano pro BETA + CSP (Step S3) | CASTECNE |
| 7 | Zadny rate limiting | Step 3.1 | ANO |
| 8 | CORS misconfiguration | Step 3.2 | ANO |
| 9 | JWT alg validation | Step 1.5 (algorithms: ['RS256'] v middleware) | ANO |
| 10 | Open redirect | Step 1.3 (validace returnUrl) | ANO |
| 11 | Session invalidation | Step 2.3 (password change → revokeRefreshTokens) | ANO |
| 12 | XSS/dangerouslySetInnerHTML | Audit pri code review | MANUALNI |
| 13 | IDOR | Step 1.5 (tenant middleware → composite keys) | ANO |
| 14 | Health endpoint info leak | Step 3.3 | ANO |

**Neadresovano (akceptovane riziko pro BETA):**
- Plny httpOnly cookie pattern (vyzaduje BFF — overkill pro BETA)
- 2FA (P2 — Sprint 4)
- Session tracking (P2 — Sprint 4)
- Token blacklisting (P2 — Redis dependency)

---

## 6. Testovaci strategie

### Unit testy
- `AuthContext` — mock provider, test loading/error/success states
- `PrivateRoute` — test redirect kdyz !user, test Outlet kdyz user
- `requireAuth` middleware — test s platnym/neplatnym/expired JWT
- `requireTenant` middleware — test s JWT tenantId vs header fallback

### Integracni testy
- Login flow: formular → Firebase → redirect na /admin
- Register flow: formular → Firebase → redirect na /login
- Protected route: neprihlaseny → redirect na /login → login → redirect zpet
- Account page: editace profilu → save → overit persistence

### Security testy (z Phase 3 checklist)
- JWT alg:none → odmitnut
- Tampered JWT payload → odmitnut
- Expired JWT → 401
- Cross-tenant pristup → 404
- Brute force login → rate limit po 5 pokusech
- CORS evil origin → odmitnut

### Smoke test
- [ ] `/` → Home se zobrazi
- [ ] `/admin` → redirect na `/login`
- [ ] Login → redirect na `/admin`
- [ ] `/account` → 4 taby se zobrazi, real data
- [ ] Logout → redirect na `/login`
- [ ] Backend `/api/presets` bez tokenu → 401
- [ ] Backend `/api/presets` s tokenem → 200
- [ ] `npm run build` → PASS

---

## 7. Casovy odhad (orientacni)

| Sprint | Obsah | Odhad |
|--------|-------|-------|
| **S1** | Auth Foundation (6 kroku) | 1-2 session |
| **S2** | Account Page real data (5 kroku) | 1 session |
| **S3** | Security Hardening (5 kroku) | 1 session |
| **S4** | Post-BETA (4 kroku) | 2-3 session |

**Celkem pro BETA-ready auth:** ~3-4 session (S1-S3)

---

## 8. Rizika a mitigace

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| Firebase SDK breaking change pri refactoru AuthContext | Stredni | Vysoka | Test suite pro auth flow |
| White screen po aktivaci PrivateRoute | Vysoka | Vysoka | Testovat na localhostu pred deployem |
| Backend auth middleware blokuje legitimni requesty | Stredni | Vysoka | Optional auth na public endpointech |
| Register zjednoduseni rozbije existujici uzivatele | Nizka | Nizka | Zadni existujici uzivatele (pre-BETA) |
| CORS zmeny rozbiji widget embed | Stredni | Stredni | Pridat widget origin do allowlistu |
| Token refresh race condition | Nizka | Stredni | Fail queue v apiClient interceptoru |

---

## 9. Dokumentace k aktualizaci po implementaci

| Dokumentace | Co aktualizovat |
|-------------|----------------|
| `docs/claude/Documentation/Routing-Dokumentace.md` | Nove protected routy |
| `docs/claude/Documentation/Storage-Utilities-Dokumentace.md` | Novy company storage |
| `docs/claude/Documentation/Test-Kalkulacka-Dokumentace.md` | Auth requirement |
| `docs/claude/Documentation/Widget-Kalkulacka-Dokumentace.md` | CORS zmeny |
| `docs/claude/Documentation/Build-Config-Dokumentace.md` | VITE_AUTH_PROVIDER env |
| `MEMORY.md` | Auth architektura, nove soubory |

---

## 10. Verifikace — Checklist po dokonceni

Po implementaci vsech sprintu (S1-S3) musi platit:

- [ ] **Provider-agnosticky AuthContext** funguje s Firebase
- [ ] **PrivateRoute** chrani `/account`, `/admin/*`, `/test-kalkulacka*`
- [ ] **Login** pouziva `useAuth().login()`, redirectuje na `/admin`
- [ ] **Register** je jednoduchy 1-step formular bez role vyberu
- [ ] **Account page** zobrazuje real data (ne mock "Jan Novak")
- [ ] **Account: Security tab** umoznuje zmenu hesla s real Firebase
- [ ] **Backend** ma `requireAuth` middleware na vsech chranench endpointech
- [ ] **Backend** extrahuje tenantId z JWT (ne z x-tenant-id headeru)
- [ ] **Rate limiting** funguje na login a slice endpointech
- [ ] **CORS** ma explicitni allowlist (zadne `*`)
- [ ] **Health endpoint** neodhaluje filesystem cesty
- [ ] **Toast system** nahrazuje vsechny `alert()` v Account page
- [ ] **npm run build** projde bez chyb
- [ ] **Smoke test** projde (vsechny body v sekci 6)
- [ ] **Dokumentace** aktualizovana

---

*Dokument vytvoren: 2026-02-20*
*Zalozeno na vyzkumu z Fazi 1-3 (15+ SaaS/3D platform, OWASP Top 10, 20+ bezpecnostnich checklist bodu, real-world breach case studies)*
