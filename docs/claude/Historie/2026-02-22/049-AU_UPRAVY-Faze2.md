# 049-AU — UPRAVY — Auth Sprint 1 Faze 2 (Routes + Login + Register) — 2026-02-22

## Metadata
- **ID:** 049-AU
- **Session:** S01
- **Datum:** 2026-02-22
- **Oblast:** Auth — Sprint 1 Faze 2
- **Souvisejici ID:** 043-AU, 044-AU, 048-AU, 050-AU, 051-AU
- **Trigger:** Implementace planu Sprint 1 — kroky 2.1-2.5

---

## Souhrn uprav

Faze 2 Auth Sprint 1 aktivovala ochranu rout pomoci `PrivateRoute` pro `/account` a celou
`/admin/*` hierarchii (drive bylo zakomentovano nebo chybelo). Zjednodusila login stranku na
miniaturni orchestrator (17 radku) s redirect logikou pres `useAuth()`. Login formular byl
prepsany na `useAuth().login()` misto primo Firebase volani, s pridam Google Sign-In tlacitkem.

Registrace byla kompletne prepracovana z puvodniho 3-krokoveho wizardu (~202 radku index + vice
komponent) na jednoduchy 1-krokovy formular (64 radku index + 341 radku formular). Smazany tri
nepotrebne komponenty: `RoleSelectionCard.jsx`, `ProgressSteps.jsx`, `LanguageToggle.jsx`.

Vytvorena nova sdilena komponenta `GoogleSignInButton.jsx` pouzivana v obou formularich
(login i registrace).

---

## Seznam upravenych souboru

| Soubor | Radky | Typ zmeny | Popis |
|--------|-------|-----------|-------|
| `src/Routes.jsx` | 129 | UPRAVA | PrivateRoute wrapping pro /account a /admin/* |
| `src/components/PrivateRoute.jsx` | 39 | UPRAVA | Forge styling misto Tailwind, spinner animace |
| `src/pages/login/index.jsx` | 17 | PREPIS | Miniaturni orchestrator s useAuth() redirect logikou |
| `src/pages/login/components/LoginForm.jsx` | 243 | PREPIS | useAuth().login(), Google Sign-In, Forge styling |
| `src/pages/register/index.jsx` | 64 | PREPIS | 1-krokovy layout misto 3-krokoveho wizardu |
| `src/pages/register/components/RegistrationForm.jsx` | 341 | PREPIS | bez role volby, useAuth().register(), Google Sign-Up |
| `src/components/ui/GoogleSignInButton.jsx` | 69 | NOVA KOMPONENTA | Sdilena Google OAuth tlacitko |
| `src/pages/register/components/RoleSelectionCard.jsx` | — | SMAZANO | Nahrazeno 1-krokovou registraci |
| `src/pages/register/components/ProgressSteps.jsx` | — | SMAZANO | Wizard progress indikator nepotrebny |
| `src/pages/register/components/LanguageToggle.jsx` | — | SMAZANO | Nebylo pouzivano |

---

## Detailni zmeny

### 1. `src/Routes.jsx` (129 radku)

Klicova zmena: aktivovani `<PrivateRoute />` jako wrapper element pro chranene routy.

**Chranene routy (obaleny `<Route element={<PrivateRoute />}>`):**

```jsx
{/* Chranena route /account */}
<Route element={<PrivateRoute />}>
  <Route path="/account" element={<AccountPage />} />
</Route>

{/* Chranene admin routy */}
<Route element={<PrivateRoute />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    <Route path="branding" element={<AdminBranding />} />
    <Route path="pricing" element={<AdminPricing />} />
    <Route path="fees" element={<AdminFees />} />
    <Route path="parameters/*" element={<AdminParameters />} />
    <Route path="presets/*" element={<AdminPresets />} />
    <Route path="orders/*" element={<AdminOrders />} />
    <Route path="model-storage" element={<Suspense ...><AdminModelStorage /></Suspense>} />
    <Route path="widget" element={<AdminWidget />} />
    <Route path="analytics" element={<AdminAnalytics />} />
    <Route path="team" element={<AdminTeamAccess />} />
    <Route path="express" element={<Suspense ...><AdminExpress /></Suspense>} />
    <Route path="shipping" element={<Suspense ...><AdminShipping /></Suspense>} />
    <Route path="emails" element={<Suspense ...><AdminEmails /></Suspense>} />
    <Route path="coupons" element={<Suspense ...><AdminCoupons /></Suspense>} />
    <Route path="migration" element={<Suspense ...><AdminMigration /></Suspense>} />
    <Route path="integrations" element={<Suspense ...><AdminIntegrations /></Suspense>} />
  </Route>
</Route>
```

**Verejne routy (BEZ PrivateRoute):**
- `/w/:publicWidgetId` — widget embed (zadny Header/Footer)
- `/slicer` — fullscreen (zadny Header/Footer)
- `/admin/widget/builder/:id` — widget builder (zadny sidebar/Header/Footer)
- `/login`, `/register` — auth stranky
- `/` — Home
- `/model-upload` → redirect na `/test-kalkulacka-white`
- `/test-kalkulacka`, `/test-kalkulacka-white`
- `/pricing`, `/support`
- `/invite/accept` — verejne pozvani (demo)

**Import PrivateRoute:** radek 13 — `import PrivateRoute from './components/PrivateRoute';`

---

### 2. `src/components/PrivateRoute.jsx` (39 radku)

Cte `currentUser` a `loading` z `useAuth()` hooku. Tri stavy:

**Loading state** (Forge inline styles, spinner animace):
```jsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '96px 0',
  color: 'var(--forge-text-muted, #7A8291)',
  fontFamily: 'var(--forge-font-heading)',
  fontSize: '14px',
}}>
  <div style={{
    width: '20px', height: '20px',
    border: '2px solid var(--forge-border-default, #2A2F3A)',
    borderTop: '2px solid var(--forge-accent-primary, #00D4AA)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: '12px',
  }} />
  Loading...
</div>
```

**Neprihlaseny stav:** `<Navigate to="/login" replace state={{ from: location }} />`
- Pouziva `useLocation()` pro ulozeni puvodni cesty (redirect zpet po prihlaseni)

**Prihlaseny stav:** `<Outlet />` — renderuje vnorene routy

**Klicovy import:** `useAuth` z `'../context/AuthContext'`

---

### 3. `src/pages/login/index.jsx` (17 radku)

Miniaturni orchestrator — zadna UI logika, jen redirect:

```jsx
export default function Login() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  // Jiz prihlaseny — redirect
  if (!loading && currentUser) {
    return <Navigate to={from} replace />;
  }

  return <LoginForm redirectTo={from} />;
}
```

Chovani:
- Uz prihlaseny uzivatel → redirect na `from` (puvodni cesta pred presmerovanim) nebo `/admin`
- Neprihlaseny → render `<LoginForm redirectTo={from} />`

---

### 4. `src/pages/login/components/LoginForm.jsx` (243 radku)

**Zod schema** (radky 12-16):
```js
const createLoginSchema = (t) => z.object({
  email: z.string().email(t('loginForm.emailInvalid')),
  password: z.string().min(1, t('loginForm.passwordRequired')),
  rememberMe: z.boolean().optional(),
});
```

**Pole formulare:**
- `email` — text input, validace email format
- `password` — password input, min 1 znak
- `rememberMe` — checkbox (optional)

**Auth integrace** (radky 54, 67-87):
```js
const { login } = useAuth();

const onSubmit = async (data) => {
  try {
    await login(data.email, data.password);
    navigate(redirectTo, { replace: true });
  } catch (error) {
    // error handling per Firebase error codes
  }
};
```

**Error handling** — Firebase error kody:
- `auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password` → `invalidCredentials` i18n klic
- `auth/too-many-requests` → `tooManyRequests` i18n klic
- ostatni → `genericError` + `console.error`
- Chyby zobrazeny pres `setError('root.serverError', ...)` s AlertCircle ikonou

**Google Sign-In integrace** (radky 89-100, 213-219):
```jsx
const handleGoogleSuccess = () => navigate(redirectTo, { replace: true });

const handleGoogleError = (err) => {
  if (err?.code === 'auth/popup-closed-by-user') return; // ticha ignorace
  const msg = err?.code === 'auth/account-exists-with-different-credential'
    ? t('loginForm.accountExistsWithDifferentCredential', '...')
    : t('loginForm.genericError');
  setError('root.serverError', { type: 'manual', message: msg });
};

// V JSX:
<GoogleSignInButton
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  label={t('loginForm.signInWithGoogle', 'Sign in with Google')}
  disabled={isSubmitting}
/>
```

**Layout struktura:**
1. Email input
2. Password input
3. RememberMe checkbox
4. Server error alert box (podmíneny render)
5. Submit tlacitko (ForgeButton primary)
6. Divider "or"
7. GoogleSignInButton
8. Register link (odkaz na `/register`)

**Styling:** vse inline Forge CSS vars, `--forge-bg-elevated`, `--forge-border-default`, `--forge-accent-primary` (#00D4AA), focus border + box-shadow animace 120ms

---

### 5. `src/pages/register/index.jsx` (64 radku)

Jednoduchy layout wrapper — zadny wizard, zadny multi-step state:

```jsx
const Register = () => {
  const { currentUser, loading } = useAuth();

  if (!loading && currentUser) {
    return <Navigate to="/admin" replace />;
  }

  // pageStyle: min-height 100vh, forge-bg-void
  // containerStyle: maxWidth 520px, margin 0 auto, padding 48px 24px
  // cardStyle: forge-bg-surface, border, forge-radius-lg, padding 32px

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1>Create Account</h1>   {/* forge-font-heading, forge-text-3xl */}
          <p>Join the 3D printing platform</p>  {/* forge-text-muted */}
        </div>
        <div style={cardStyle}>
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
};
```

Jiz prihlaseny → redirect na `/admin` (ne na `from`, na rozdil od Login).

---

### 6. `src/pages/register/components/RegistrationForm.jsx` (341 radku)

**Zod schema** (radky 12-24):
```js
const createRegistrationSchema = (t) => z.object({
  firstName: z.string().min(1, t('registrationForm.firstNameRequired')),
  lastName: z.string().min(1, t('registrationForm.lastNameRequired')),
  email: z.string().email(t('registrationForm.emailInvalid')),
  password: z.string().min(6, t('registrationForm.passwordMinLength')),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: t('registrationForm.agreeTermsRequired'),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: t('registrationForm.passwordsDoNotMatch'),
  path: ['confirmPassword'],
});
```

**Pole formulare** (bez role — klicova zmena oproti puvodni verzi):
- `firstName` — text, min 1 znak
- `lastName` — text, min 1 znak
- `email` — email format validace
- `password` — min 6 znaku, toggle viditelnosti (Eye/EyeOff ikona)
- `confirmPassword` — must match password, toggle viditelnosti
- `agreeTerms` — boolean checkbox, must be true

**Auth integrace** (radky 62, 82-99):
```js
const { register: authRegister } = useAuth();

const onSubmit = async (data) => {
  await authRegister(data.email, data.password, {
    displayName: `${data.firstName} ${data.lastName}`,
    firstName: data.firstName,
    lastName: data.lastName,
  });
  navigate('/admin', { replace: true });
};
```

**Error handling:**
- `auth/email-already-in-use` → `setError('email', ...)` — chyba na email poli primo
- ostatni → `setError('root.serverError', ...)` + `console.error`

**Google Sign-Up integrace** (radky 102-112, 127-132):
```jsx
// Top of form (pred email formularem)
<GoogleSignInButton
  onSuccess={handleGoogleSuccess}  // navigate('/admin', { replace: true })
  onError={handleGoogleError}      // setError('root.serverError') (ignoruje popup-closed-by-user)
  label={t('registrationForm.signUpWithGoogle', 'Sign up with Google')}
  disabled={isSubmitting}
/>
```

**Layout struktura:**
1. GoogleSignInButton (nahore)
2. Divider "or with email"
3. Server error alert box (podmíneny render)
4. firstName + lastName (grid 1fr 1fr)
5. Email input
6. Password + toggle
7. Confirm Password + toggle
8. Terms & Privacy checkbox (odkaz na /terms, /privacy)
9. Submit tlacitko (ForgeButton primary, height 48px)
10. Login link (odkaz na `/login`)

**Stavy:** `showPassword`, `showConfirmPassword` (useState) pro password visibility toggle

---

### 7. `src/components/ui/GoogleSignInButton.jsx` (69 radku) — NOVA KOMPONENTA

**Props:**
```ts
interface GoogleSignInButtonProps {
  onSuccess?: (user) => void;  // callback po uspesnem Google prihlaseni
  onError?: (err) => void;     // callback pri chybe
  label?: string;              // text tlacitka (default: 'Sign in with Google')
  disabled?: boolean;          // externi disable (napr. kdyz je form submitting)
}
```

**Interni state:** `loading: boolean` (useState)

**Auth volani:**
```js
const { loginWithGoogle } = useAuth();

const handleClick = async () => {
  setLoading(true);
  try {
    const user = await loginWithGoogle();
    onSuccess?.(user);
  } catch (err) {
    onError?.(err);
  } finally {
    setLoading(false);
  }
};
```

**Google SVG logo** — inline hardcoded SVG (4 path elementy, oficialni Google barvy: #EA4335, #4285F4, #FBBC05, #34A853), 18x18 px

**Styling** (vse inline):
- Bily background (#fff), 1px solid forge-border-default
- Height 44px, width 100%
- Hover: `#f8f9fa` bg + `0 1px 3px rgba(0,0,0,0.08)` box-shadow
- Disabled/loading: opacity 0.6, cursor not-allowed
- Text: `#3c4043` (Google brand color), 14px, weight 500
- Loading text: `'Loading...'`

---

### 8. Smazane soubory — overeni

**`src/pages/register/components/RoleSelectionCard.jsx`** — NEEXISTUJE (overeno)
**`src/pages/register/components/ProgressSteps.jsx`** — NEEXISTUJE (overeno)
**`src/pages/register/components/LanguageToggle.jsx`** — NEEXISTUJE (overeno)

Aktualni obsah `src/pages/register/components/` obsahuje pouze:
- `RegistrationForm.jsx`

Poznamka: `src/pages/login/components/` stale obsahuje starsi/neaktivni soubory:
`LanguageToggle.jsx`, `LoginActions.jsx`, `LoginHeader.jsx`, `SocialLogin.jsx`
Tyto soubory nejsou importovany novym `LoginForm.jsx` — jsou neaktivni ale zatim nesmazane.

---

## Dopad zmen

### Chranene stranky po Fazi 2

| Routa | Stav | Redirect pri neprihlaseni |
|-------|------|---------------------------|
| `/account` | CHRANENA | `/login` (state: from) |
| `/admin` | CHRANENA | `/login` (state: from) |
| `/admin/branding` | CHRANENA | `/login` (state: from) |
| `/admin/pricing` | CHRANENA | `/login` (state: from) |
| `/admin/fees` | CHRANENA | `/login` (state: from) |
| `/admin/parameters/*` | CHRANENA | `/login` (state: from) |
| `/admin/presets/*` | CHRANENA | `/login` (state: from) |
| `/admin/orders/*` | CHRANENA | `/login` (state: from) |
| `/admin/model-storage` | CHRANENA | `/login` (state: from) |
| `/admin/widget` | CHRANENA | `/login` (state: from) |
| `/admin/analytics` | CHRANENA | `/login` (state: from) |
| `/admin/team` | CHRANENA | `/login` (state: from) |
| `/admin/express` | CHRANENA | `/login` (state: from) |
| `/admin/shipping` | CHRANENA | `/login` (state: from) |
| `/admin/emails` | CHRANENA | `/login` (state: from) |
| `/admin/coupons` | CHRANENA | `/login` (state: from) |
| `/admin/migration` | CHRANENA | `/login` (state: from) |
| `/admin/integrations` | CHRANENA | `/login` (state: from) |

### Redirect chovani po prihlaseni

- **Login:** redirect na `location.state?.from?.pathname || '/admin'`
  - Uzivatel sel na `/admin/pricing` → redirect na `/login` → po prihlaseni → zpet na `/admin/pricing`
- **Register:** vzdy redirect na `/admin` (bez `from` pameti)

### Google Sign-In pouziti

- `GoogleSignInButton` importovana ve dvou mistech:
  - `src/pages/login/components/LoginForm.jsx` (radek 8)
  - `src/pages/register/components/RegistrationForm.jsx` (radek 8)
- Oba pouzivaji `loginWithGoogle()` z `useAuth()` — stejne Firebase volani pro login i registraci

### Smazane importy (nutno overit ze neexistuji jinam)

- `RoleSelectionCard` — importovana pouze ze stareho `register/index.jsx` (nyni prepsan)
- `ProgressSteps` — importovana pouze ze stareho `register/index.jsx` (nyni prepsan)
- `LanguageToggle` v register — importovana pouze ze stareho `register/index.jsx` (nyni prepsan)

---

## Testovani

- **Build:** PASS (`npm run build` probehl bez chyb po Fazi 2)
- **Manual test:**
  - Pristup na `/admin` bez prihlaseni → redirect na `/login` ✓
  - Pristup na `/account` bez prihlaseni → redirect na `/login` ✓
  - Login s email/heslem → redirect na `/admin` ✓
  - Login s Google → redirect na `/admin` ✓
  - Register s email/heslem → redirect na `/admin` ✓
  - Register s Google → redirect na `/admin` ✓
  - Jiz prihlaseny uzivatel navstivi `/login` → redirect na `/admin` ✓
  - Jiz prihlaseny uzivatel navstivi `/register` → redirect na `/admin` ✓
  - Loading state v PrivateRoute zobrazuje Forge spinner (teal) ✓
