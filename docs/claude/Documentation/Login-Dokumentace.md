# Login — Dokumentace

> Prihlasovaci stranka ModelPricer aplikace (Auth Sprint 1). Umoznuje uzivateli prihlasit se pomoci emailu/hesla nebo Google Sign-In pres Firebase Authentication. Po uspesnem prihlaseni presmeruje na `/admin`.

---

## 1. Prehled

- **URL:** `/login`
- **Route definice:** `src/Routes.jsx` — `<Route path="/login" element={<Login />} />`
- **Umisteni v layout:** Verejny endpoint, bez PrivateRoute guardu
- **Redirect logika:** Po uspesnem prihlaseni → `/admin` (vsichni uzivatele, bez role-based routing)

---

## 2. Technologie a jazyk

| Kategorie | Technologie | Verze/Detail |
|-----------|-------------|--------------|
| Framework | React | 19 |
| Bundler | Vite | port 4028 |
| Routing | React Router | v6 (`useNavigate`, `useLocation`, `Navigate`) |
| Formulare | react-hook-form | `useForm`, `register`, `handleSubmit`, `formState` |
| Validace | Zod | `zodResolver` + vlastni schema `createLoginSchema` |
| Autentifikace | Firebase Auth | `signInWithEmailAndPassword` |
| Databaze | Firebase Firestore | `doc`, `getDoc` — cteni uzivatelskeho profilu a role |
| Preklady | react-i18next | `useTranslation` hook, klice v `loginForm.*` |
| Ikony | Lucide React | pres wrapper `AppIcon` (`AlertCircle`) |
| UI komponenty | ForgeButton | `variant="primary"` pro submit tlacitko |
| Stylizace | Inline styly + Forge CSS tokeny | Zadne CSS soubory, zadny Tailwind |

---

## 3. Architektura souboru

```
src/pages/login/
  index.jsx                    # Vstupni bod stranky
  components/
    LoginForm.jsx              # AKTIVNI — hlavni formular, email/heslo + Google Sign-In

src/components/ui/
  GoogleSignInButton.jsx       # AKTIVNI — Google Sign-In tlacitko (Auth Sprint 1, sdilena komponenta)
```

**Auth Sprint 1:** Aktualne jsou pouzivany:
- `LoginForm.jsx` — email/heslo prihlaseni s `useAuth().login()` + Firebase JWT handling
- `GoogleSignInButton.jsx` — Google Sign-In integrovan pres Firebase Auth

**Odstraneno v Auth Sprint 1:**
- `LoginHeader.jsx`, `LoginActions.jsx`, `SocialLogin.jsx`, `LanguageToggle.jsx` — nebyly pouzivane, byly odstraneny nebo vypnute

---

## 4. Import graf

### index.jsx (vstupni bod)

```
index.jsx
  ├── react
  ├── react-router-dom ──> useLocation, Navigate
  ├── react-i18next ──> useTranslation
  ├── ../../context/AuthContext ──> useAuth
  └── ./components/LoginForm ──> LoginForm
```

**Poznamka:** GoogleSignInButton je importovan do LoginForm (ne primo do index.jsx).

### LoginForm.jsx (email/heslo prihlaseni)

```
LoginForm.jsx
  ├── react
  ├── react-router-dom ──> useNavigate
  ├── react-hook-form ──> useForm
  ├── @hookform/resolvers/zod ──> zodResolver
  ├── zod ──> z
  ├── @/context/AuthContext ──> useAuth (login method)
  ├── @/components/ui/forge/ForgeButton
  ├── @/components/AppIcon ──> Icon
  └── react-i18next ──> useTranslation
```

### GoogleSignInButton.jsx (Google Sign-In)

```
GoogleSignInButton.jsx
  ├── react
  ├── @/context/AuthContext ──> useAuth (loginWithGoogle method)
  ├── @/components/ui/forge/ForgeButton
  └── @/components/AppIcon ──> Icon
```

### Nepouzivane komponenty — importy

```
LoginHeader.jsx
  ├── react-router-dom ──> Link
  └── ../../../components/AppIcon ──> Icon (Layers3)

LoginActions.jsx
  ├── react-router-dom ──> Link
  ├── ../../../components/ui/forge/ForgeButton
  └── ../../../components/AppIcon ──> Icon (HelpCircle, Info)

SocialLogin.jsx
  ├── ../../../components/ui/forge/ForgeButton  [importovano, ale nepouzito]
  └── ../../../components/AppIcon ──> Icon (Chrome, Facebook, Apple)

LanguageToggle.jsx
  └── ../../../components/AppIcon ──> Icon (Globe)
```

---

## 5. Design a vizual

### 5.0 Page wrapper (index.jsx)

Login stranka pouziva plnohodnotny Forge page wrapper shodny s Register strankou:

| Vrstva | Styl | Ucel |
|--------|------|------|
| **Page wrapper** | `minHeight: 100vh`, `backgroundColor: var(--forge-bg-void)`, `color: var(--forge-text-primary)` | Tmave pozadi pres celou stranku |
| **Container** | `maxWidth: 520px`, `margin: 0 auto`, `padding: 48px 24px` | Centrovany obsah, spacing od headeru/footeru |
| **Heading sekce** | `textAlign: center`, `marginBottom: 32px` | Nadpis + podnadpis stranky |
| **H1 nadpis** | `fontFamily: var(--forge-font-heading)`, `fontSize: var(--forge-text-3xl)`, `fontWeight: 700` | "Prihlaste se" (lokalizovano) |
| **Podnadpis** | `fontFamily: var(--forge-font-body)`, `fontSize: var(--forge-text-base)`, `color: var(--forge-text-muted)` | "Spravujte sve 3D tiskove projekty" (lokalizovano) |
| **Card wrapper** | `backgroundColor: var(--forge-bg-surface)`, `border: 1px solid var(--forge-border-default)`, `borderRadius: var(--forge-radius-lg)`, `padding: 32px` | Vizualni ohraniceni formulare |

Inline styly (zadny Tailwind). Styly jsou definovany jako konstanty mimo komponentu (pageStyle, containerStyle, cardStyle).

### 5.1 Forge tokeny pouzite v LoginForm

| Token | Pouziti | Misto |
|-------|---------|-------|
| `--forge-bg-elevated` | Pozadi inputu, error box | inputStyle, serverError box |
| `--forge-border-default` | Ramecek inputu (default stav) | inputStyle, onBlur |
| `--forge-radius-sm` | Zaobleni inputu, error boxu | inputStyle, serverError |
| `--forge-text-primary` | Barva textu v inputu | inputStyle |
| `--forge-font-body` | Font inputu, labelu, error zprav, checkbox | inputStyle, labelStyle, errorStyle |
| `--forge-text-secondary` | Barva labelu | labelStyle |
| `--forge-text-muted` | Barva checkbox textu | rememberMe label |
| `--forge-error` (`#FF4757`) | Barva chyb, error border | errorStyle, input borderColor |
| `--forge-accent-primary` | Focus ring, focus border | handleInputFocus |
| `--forge-accent-primary` rgba | Focus box-shadow | `rgba(0,212,170,0.15)` |

### 5.2 Layout

- **Formular:** `max-width: 448px`, centrovany (`margin: 0 auto`)
- **Gap:** 20px mezi formularovymi poli
- **Input vyska:** 44px (fixni)
- **Submit tlacitko:** plna sirka (`width: 100%`), vyska 44px
- **Label styl:** 12px, uppercase, letter-spacing 0.05em, font-weight 500
- **Error styl:** 11px, cervena (`--forge-error`), margin-top 4px
- **Server error box:** padding 12px, cervene pozadi `rgba(255, 71, 87, 0.06)`, cerveny border `rgba(255, 71, 87, 0.2)`

### 5.3 Vizualni stavy inputu

| Stav | Border | Box-shadow |
|------|--------|------------|
| Default | `--forge-border-default` (`#1E2230`) | none |
| Focus | `--forge-accent-primary` (`#00D4AA`) | `0 0 0 2px rgba(0,212,170,0.15)` |
| Error | `--forge-error` (`#FF4757`) | none |
| Disabled | (zachova aktualni) | (zachova aktualni) |

### 5.4 Forge compliance

**Spravne:**
- Page wrapper pouziva `--forge-bg-void` pro tmave pozadi cele stranky
- Card wrapper pouziva `--forge-bg-surface`, `--forge-border-default`, `--forge-radius-lg`
- H1 nadpis pouziva `--forge-font-heading` a `--forge-text-3xl` — spravne dle konvence (text-lg+ = heading font)
- Podnadpis pouziva `--forge-font-body` a `--forge-text-muted`
- Pouziva `--forge-font-body` pro vsechny texty formulare (labely, inputy, errory, checkbox)
- Pouziva Forge tokenove barvy konzistentne
- ForgeButton `variant="primary"` pro hlavni akci
- Tmave pozadi, svetly text — odpovida Forge dark theme
- Design konzistentni s Register strankou (identicka page struktura)

---

## 8. UI komponenty — detailni popis

### 8.1 Login (index.jsx) — Page wrapper + vstupni kontejner

**Funkce:**
1. Kontroluje stav prihlaseni pres `useAuth()` — `currentUser` a `loading`
2. Pokud je uzivatel jiz prihlasen a neni loading, presmeruje na `/admin`
3. Pokud neni prihlasen, renderuje page wrapper s headingem a card wrapperem kolem LoginForm

**Page struktura:**
```
<div pageStyle>           // 100vh, bg-void
  <div containerStyle>    // max-width 520px, centered, padding 48px 24px
    <div heading>         // centered, margin-bottom 32px
      <h1>                // forge-font-heading, text-3xl, "Prihlaste se"
      <p>                 // forge-font-body, text-muted, "Spravujte sve 3D tiskove projekty"
    </div>
    <div cardStyle>       // bg-surface, border, radius-lg, padding 32px
      <LoginForm />
    </div>
  </div>
</div>
```

**i18n:** Nadpis a podnadpis lokalizovany pres `useTranslation()`:
- `loginPage.title` — fallback "Prihlaste se"
- `loginPage.subtitle` — fallback "Spravujte sve 3D tiskove projekty"

**Login flow:**
- Bez autentizace → zobrazit login formular + Google button
- Pri loading → zobrazit loading state
- Po uspesnem loginu → navigate `/admin`

### 8.2 LoginForm.jsx — Email/heslo prihlaseni

**Formularova pole:**

| Pole | Typ | Validace | Default |
|------|-----|----------|---------|
| email | `<input type="email">` | Zod: `z.string().email()` | `""` |
| password | `<input type="password">` | Zod: `z.string().min(1)` | `""` |

**Submit flow (Auth Sprint 1):**
1. `handleSubmit(onSubmit)` — react-hook-form validace pres Zod schema
2. `useAuth().login(email, password)` — zahrnuje Firebase Auth + JWT token handling
3. Automaticky: `navigate('/admin')` pres AuthContext redirect
4. Chyby: zobrazeny pres `setError()` + error box s serverError zprávou

**Stav formulare:**
- `isSubmitting` — z react-hook-form, disabluje inputy a meni text tlacitka
- `errors` — per-field validacni chyby + `root.serverError` pro Firebase chyby

### 8.3 GoogleSignInButton.jsx — Google Sign-In (NEW v Auth Sprint 1)

**Tlacitko pro prihlaseni pres Google:**
- Klikne na tlacitko → zapada `useAuth().loginWithGoogle()`
- Firebase Auth + Google Sign-In popup
- Po uspesnem prihlaseni → navigate `/admin`
- Chyby jsou logovane a zobrazeny uzivateli

### 8.4 LoginHeader.jsx (VYPNUTO v Auth Sprint 1)

**Ucel:** Zobrazi logo ModelPricer (ikona Layers3 + nazev + "3D PRINT PRICING") a uvitaci text "Welcome Back" / "Sign in to continue".

**Stav:** Vypnuto, neni pouzivano

### 8.5 LoginActions.jsx (VYPNUTO v Auth Sprint 1)

**Ucel:** Doplnkove akce pod formularem — "Zapomenuji heslo?", divider, "Vytvorit novy ucet", demo credentials.

**Poznamky:**
- Odkaz na `/forgot-password` — tato routa NEEXISTUJE v Routes.jsx
- Tlacitko "Vytvorit novy ucet" pouziva `window.location.href = '/register'` misto React Router `navigate` — zpusobi plny page reload
- Demo credentials (hardcoded): customer@communprinting.cz/customer123, host@communprinting.cz/host123, admin@communprinting.cz/admin123
- Mix ceskych a anglickych textu ("Zapomenuji heslo?", "Nemate ucet?", "Demo credentials")

### 8.5 SocialLogin.jsx (NEAKTIVNI)

**Ucel:** Tlacitka pro prihlaseni pres Google, Facebook, Apple.

**Poznamky:**
- `handleSocialLogin` jen loguje do konzole — ZADNA realna implementace
- Importuje `ForgeButton` ale NEPOUZIVA ho — pouziva vlastni `<button>` elementy
- Texty v cestine ("nebo se prihlaste pomoci", "Pokracovat s")

### 8.6 LanguageToggle.jsx (NEAKTIVNI)

**Ucel:** Prepinac jazyka CS/EN v pravem hornim rohu.

**Poznamky:**
- Absolutni pozicovani (`position: absolute, top: 16px, right: 16px`) — vyzaduje relativni parent kontejner
- Pouziva `localStorage.getItem('language')` primo — ne pres tenant storage helpery
- `window.location?.reload()` — tvrdy reload stranky pri zmene jazyka (misto i18n API)
- Nezavisle na `useLanguage()` kontextu ani na `react-i18next` — oddelena implementace

---

## 9. State management a data flow

### 9.1 Stavovy diagram

```
[Stranka se nacte]
    │
    ▼
[useAuth() kontrola]──── currentUser existuje ───> <Navigate to={'/admin'} />
    │
    (loading || !currentUser)
    │
    ▼
[LoginForm renderovan]
    │
    ├─ Email/heslo prihlaseni
    │   ├─ [Uzivatel vyplni email + heslo]
    │   │   ├─ [Submit] ──> [Zod validace] ──── CHYBA ───> field-level errors
    │   │   │                   (OK) ▼
    │   │   │              [useAuth().login()]
    │   │   │                   ├── CHYBA ───> setError('root.serverError', ...) ──> zobrazit error box
    │   │   │                   └── OK ───> navigate('/admin')
    │   │
    └─ Google Sign-In
        └─ [Google tlacitko] ──> [useAuth().loginWithGoogle()]
                                    ├── CHYBA ───> setError('root.serverError', ...) ──> zobrazit error box
                                    └── OK ───> navigate('/admin')
```

### 9.2 State prehled

| Stav | Zdroj | Typ | Popis |
|------|-------|-----|-------|
| `currentUser` | AuthContext | Context | Firebase user objekt + Firestore data |
| `loading` | AuthContext | Context | `true` dokud se nerozhodne auth stav |
| `errors` | react-hook-form | Formular | Validacni chyby per-field |
| `errors.root.serverError` | react-hook-form | Formular | Server/Firebase chyba |
| `isSubmitting` | react-hook-form | Formular | `true` behem async submit |

### 9.3 Externi zavislosti (runtime)

| Sluzba | Ucel | Fail scenario |
|--------|------|---------------|
| Firebase Auth | Prihlaseni (email/heslo + Google Sign-In) | `auth/invalid-credential`, `auth/too-many-requests`, `auth/popup-closed-by-user` |
| AuthContext | Auth stav (currentUser, loading, login, loginWithGoogle metody) | Pokud neni `AuthProvider` v stromu → throw Error |
| Backend (dle configs) | JWT validace, volitelna autentifikace | Pokud nefunguje, AuthContext vraci chybu |

---

## 10. Error handling

### 10.1 Validacni chyby (Zod)

| Pole | Podminka | Zprava (CS) |
|------|----------|-------------|
| email | Prazdny nebo neplatny format | "Neplatny format emailu." |
| password | Prazdne | "Heslo je povinne." |

Chyby se zobrazuji primo pod prislusnym inputem ve stylu `errorStyle` (11px, `--forge-error`).

### 10.2 Firebase chyby

| Error code | Zprava (CS) | Poznamka |
|------------|-------------|----------|
| `auth/invalid-credential` | "Neplatna kombinace emailu a hesla." | |
| `auth/user-not-found` | "Neplatna kombinace emailu a hesla." | Stejna zprava jako invalid-credential |
| `auth/wrong-password` | "Neplatna kombinace emailu a hesla." | Stejna zprava — security best practice |
| `auth/too-many-requests` | "Prilis mnoho pokusu o prihlaseni. Zkuste to prosim pozdeji." | Firebase rate limiting |
| (jiny) | "Chyba pri prihlasovani. Zkuste to znovu." | Genericka zprava + `console.error` |

Server chyby se zobrazuji v cervenem boxu s ikonou `AlertCircle` pres `errors.root.serverError`.

### 10.3 Backend chyby

Po uspesnem prihlaseni v AuthContext se mohou vyskytnout chyby pri nacitani JWT tokenu nebo dalsiho backendu nastaveni. Tyto se zpracovavaji v `AuthContext` a prepisuji se jako server chyby v LoginForm.

### 10.4 Mezery v error handling

- `rememberMe` checkbox se nikde nepouziva v logice — hodnota se sice uklada do form data ale `signInWithEmailAndPassword` ji ignoruje. Firebase Auth persistence je nastavena globalne na `browserLocalPersistence` v `firebase.js:42`.
- `getDoc` muze selhat (sitova chyba, permissions) — neni osetreno try/catch specificky, spadne do hlavniho catch bloku ktery zobrazi genericku hlasku
- Chybi loading state na urovni stranky (kdyz `AuthContext.loading === true`, nic se nerenderuje — potencialni flash)

---

## 11. Preklady (i18n)

### 11.1 Pouzity system

`index.jsx` i `LoginForm.jsx` pouzivaji `react-i18next` pres hook `useTranslation()`. Prekladove klice jsou v `src/locales/cs/translation.json` pod namespace `loginPage` (stranka) a `loginForm` (formular).

### 11.2 Prekladove klice — stranka (index.jsx)

| Klic | CS fallback |
|------|-------------|
| `loginPage.title` | "Prihlaste se" |
| `loginPage.subtitle` | "Spravujte sve 3D tiskove projekty" |

### 11.3 Prekladove klice — formular (LoginForm.jsx)

| Klic | CS hodnota |
|------|-----------|
| `loginForm.emailLabel` | "E-mailova adresa" |
| `loginForm.emailInvalid` | "Neplatny format emailu." |
| `loginForm.passwordLabel` | "Heslo" |
| `loginForm.passwordRequired` | "Heslo je povinne." |
| `loginForm.passwordPlaceholder` | "Zadejte heslo" |
| `loginForm.rememberMeLabel` | "Zapamatovat si me" |
| `loginForm.loginButton` | "Prihlasit se" |
| `loginForm.loggingIn` | "Prihlasovani..." |
| `loginForm.genericError` | "Chyba pri prihlasovani. Zkuste to znovu." |
| `loginForm.invalidCredentials` | "Neplatna kombinace emailu a hesla." |
| `loginForm.tooManyRequests` | "Prilis mnoho pokusu o prihlaseni. Zkuste to prosim pozdeji." |

### 11.4 Chybejici preklady (EN)

Existuje POUZE cesky preklad (`src/locales/cs/translation.json`). Anglicky preklad (`src/locales/en/`) NEEXISTUJE. Soubor `i18n.js` definuje `fallbackLng: "cs"` a nacita pouze `translationCS`.

### 11.5 Neprekladane texty

Nasledujici texty v LoginForm.jsx jsou hardcoded a nepouzivaji i18n:
- Placeholder emailu: `"vas@email.cz"` (radek 125)

Neaktivni komponenty obsahuji mnoho hardcoded textu (viz sekce 8.3-8.6).

---

## 12. Pristupnost (keyboard, ARIA, focus management)

### 12.1 Co funguje

- **Nativni HTML form:** `<form onSubmit={...}>` — Enter key odeslani funguje
- **Nativni inputy:** `<input type="email">`, `<input type="password">`, `<input type="checkbox">` — spravne HTML5 typy
- **Label elementy:** Existuji `<label>` pro email a password — ALE nejsou propojeny pres `htmlFor`/`id` atributy! Label pro checkbox obaluje input (`<label>...<input type="checkbox"/>...</label>`) — toto funguje.
- **Disabled state:** Vsechny inputy a submit tlacitko se disabluji behem odeslani (`disabled={isSubmitting}`)
- **Error zpravy:** Zobrazuji se vizualne, ale nejsou propojene pres `aria-describedby`

### 12.2 Problemy pristupnosti

| Problem | Zavaznost | Detail |
|---------|-----------|--------|
| Labels nejsou propojene s inputy | Stredni | `<label>` elementy nemaji `htmlFor` atribut, inputy nemaji `id`. Kliknuti na label neaktivuje input. Screen reader nenapoji label s polem. |
| Chybi `aria-describedby` pro error zpravy | Stredni | Validacni chyby pod inputy nejsou propojene pres ARIA — screen reader je neprecte automaticky. |
| Chybi `aria-invalid` na inputech s chybou | Nizka | Inputy s chybou maji cerveny border ale zadny `aria-invalid="true"` atribut. |
| Chybi `role="alert"` na server error boxu | Nizka | Server error zprava se zobrazi ale nema `role="alert"` ani `aria-live="assertive"` — screen reader ji neoznami. |
| Chybi skip-to-content | Nizka | Stranka je v layout s Header/Footer, ale neni skip link na hlavni obsah. |
| Focus management po chybe | Nizka | Po neuspesnem loginu zustane focus kde byl (na submit tlacitku). Idealne by mel prejit na prvni chybny input nebo na error zpravu. |

### 12.3 Keyboard navigace

- **Tab order:** email -> password -> checkbox -> submit (spravne)
- **Focus vizual:** Custom inline focus styl (teal border + glow) — viditelny, kontrastni
- **Enter submit:** Funguje (nativni form behavior)

---

## 14. Bezpecnost (input validace, auth flow)

### 14.1 Input validace

- **Email:** Zod `z.string().email()` — validuje format pred odeslanim na server
- **Password:** Zod `z.string().min(1)` — pouze kontrola neprazdnosti (minimalni delka hesla se neresi na FE — to je spravne, Firebase ma vlastni pravidla)
- **XSS:** React escapuje vsechny hodnoty automaticky — bezpecne
- **CSRF:** Nerelevantni — komunikace je primo s Firebase Auth SDK (ne vlastni backend)

### 14.2 Auth flow

1. Autentifikace probiha pres Firebase SDK (`signInWithEmailAndPassword`) — heslo se NIKDY neposila primo na vlastni backend
2. Firebase Auth persistence: `browserLocalPersistence` (nastaveno v `firebase.js:42`) — session prezije zavreni tabu
3. Po uspesnem prihlaseni se extrahuji JWT tokeny z Firebase a skladuji se lokalne
4. Autentifikace na backendu: JWT tokeny se validuji pres `backend-local/src/middleware/auth.js` — role a autorizace se zpracovavaji pres custom claims v JWT

### 14.3 Bezpecnostni poznamky

| Oblast | Hodnoceni | Detail |
|--------|-----------|--------|
| Error zpravy | OK | Stejne zpravy pro `invalid-credential`, `user-not-found`, `wrong-password` — neodhaluje zda email existuje |
| Rate limiting | OK | Firebase `auth/too-many-requests` je zpracovan a zobrazen uzivateli |
| Password visibility | OK | `type="password"` — neni show/hide toggle (bezpecnejsi) |
| Demo credentials v kodu | INFO | `LoginActions.jsx` obsahuje hardcoded demo ucty (ale komponenta je vypnuta, neni pouzivana) |
| rememberMe checkbox | INFO | Checkbox existuje ale nema zadny efekt — Firebase persistence je vzdy `browserLocalPersistence`. Po Auth Sprint 1 je kontrola pouziti auth JWT se provadi v AuthContext. |
| Autentifikace na backendu | OK | JWT validace se resi pres `backend-local/src/middleware/auth.js` s custom claims — aplikovano na chranene routy |
| Console logging | INFO | `console.error` pro Firebase chyby — v produkci je potlaceno skrz environment configs |

---

## 15. Souvisejici dokumenty

| Dokument/Soubor | Vztah k Login |
|-----------------|---------------|
| `src/context/AuthContext.jsx` | Poskytuje `useAuth()` — login, loginWithGoogle, currentUser, loading |
| `src/firebase.js` | Firebase app inicializace, export `auth` |
| `src/locales/cs/translation.json` | Prekladove klice `loginForm.*` |
| `src/i18n.js` | Konfigurace react-i18next (pouze CS jazyk) |
| `src/Routes.jsx` | Route `/login` definice |
| `src/components/ui/forge/ForgeButton.jsx` | Submit tlacitko, Google button |
| `src/components/AppIcon.jsx` | Lucide ikony (AlertCircle) |
| `src/styles/forge-tokens.css` | Forge design tokeny |
| `src/pages/register/` | Registracni stranka |
| `src/components/PrivateRoute.jsx` | Chranene routy (redirect na login) |
| `backend-local/src/middleware/auth.js` | Backend JWT validace |

---

## 16. Auth Sprint 1 — Zmeny a vylepseni

### Implementovane funkce:
1. **Email/Heslo prihlaseni** — pres `useAuth().login()` z AuthContext
2. **Google Sign-In** — novy `GoogleSignInButton` komponent
3. **Unified redirect** — vsichni uzivatele redirectani na `/admin` (bez role-based routing)
4. **JWT token handling** — automaticke nacteni a skladovani Firebase JWT tokenu
5. **Vypnute komponenty:**
   - LoginHeader, LoginActions, SocialLogin, LanguageToggle — nely pouzivane, vypnute nebo nahrazene

---

## 17. Zname omezeni (STAV Po Auth Sprint 1)

### 17.1 VYRESENO v Auth Sprint 1

1. **Mrtvy kod `handleLogin` prop** — VYRESENO: LoginForm pouziva `useAuth().login()` primo
2. **Role-based redirect na /host-dashboard vs /customer-dashboard** — VYRESENO: Vsichni na `/admin`
3. **Firestore role fetch** — VYRESENO: Role kontrola se provadi na backendu skrze JWT custom claims
4. **Orphan komponenty** — VYRESENO: LoginHeader, LoginActions, SocialLogin, LanguageToggle vypnute
5. **rememberMe checkbox** — VYRESENO: Odstranen, Firebase persistence je vzdy zapnuta

### 17.2 Zustale existujici omezeni

- **Neni EN preklad** — `i18n.js` nacita pouze CS. Pokud by uzivatel prepnul na EN, jebi fallback na CS.
- **Pristupnost — labels nepropojene s inputy** — `<label>` elementy nemaji `htmlFor`/`id`. Kliknuti na label neaktivuje input. Nutna oprava.
- **Pristupnost — error messages bez aria-describedby/aria-live** — Field errors nejsou propojene s inputy pres `aria-describedby`. Server error message nema `role="alert"` ani `aria-live="assertive"`.

### 17.3 Future improvements (Roadmap)

- [ ] Password reset flow (`/forgot-password` routa + email link)
- [ ] Two-factor authentication
- [ ] EN translation completion
- [ ] Accessibility audit + fixes (aria-describedby, aria-invalid, aria-live, label htmlFor/id)
- [ ] Loading skeleton UI pri AuthContext.loading === true

---

## 18. Posledni aktualizace

**Datum:** 2026-02-24
**Zmeny v teto verzi:** Sprint 1 Auth Bugfixy — Bug 1: Google Sign-In error handling.

### Zmeny 2026-02-24:
- **FirebaseAuthProvider.jsx:** `loginWithGoogle()` a `register()` — `setDoc()` obaleno try/catch. Pokud Firestore zapis selze, auth pokracuje (nezablokuje login/registraci).
- **GoogleSignInButton.jsx:** Pridan `console.error('Google Sign-In failed:', err)` v catch bloku pro lepsi debugovani.
- **LoginForm.jsx:** `handleGoogleError()` — pridan `console.error`, pridano `auth/account-exists-with-different-credential` handling, genericError fallback text.
- **Frontend service soubory** (`presetsApi.js`, `slicerApi.js`, `storageApi.js`): Pridany `Authorization: Bearer <token>` headery do vsech fetch volani pres `window.__authGetToken()`.

### Zmeny 2026-02-23:
- Pridani page wrapper struktury (bg-void, container, heading, card) do index.jsx. Lokalizace nadpisu a podnadpisu pres useTranslation(). Design konzistentni s Register strankou.
