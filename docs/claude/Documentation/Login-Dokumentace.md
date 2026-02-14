# Login — Dokumentace

> Prihlasovaci stranka ModelPricer aplikace. Umoznuje uzivateli prihlasit se pomoci emailu a hesla pres Firebase Authentication. Po uspesnem prihlaseni presmeruje uzivatele na dashboard podle jeho role (customer/host).

---

## 1. Prehled

- **URL:** `/login`
- **Route definice:** `src/Routes.jsx:74` — `<Route path="/login" element={<Login />} />`
- **Umisteni v layout:** Uvnitr hlavniho layoutu s `<Header />` a `<Footer />`
- **Redirect logika:** Pokud je uzivatel jiz prihlasen, `index.jsx` ho presmeruje na `location.state?.from?.pathname` nebo `/customer-dashboard` (avsak tato logika je aktualne mrtvy kod — viz sekce 17)

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
  index.jsx                    # Vstupni bod stranky (30 radku)
  components/
    LoginForm.jsx              # AKTIVNI — hlavni formular (202 radku)
    LoginHeader.jsx            # NEAKTIVNI — logo + "Welcome Back" (71 radku)
    LoginActions.jsx           # NEAKTIVNI — forgot password, register, demo credentials (118 radku)
    SocialLogin.jsx            # NEAKTIVNI — Google/Facebook/Apple tlacitka (80 radku)
    LanguageToggle.jsx         # NEAKTIVNI — prepinac CS/EN (56 radku)
```

**DULEZITE:** Z peti subkomponent je aktualne pouzivana POUZE `LoginForm.jsx`. Ostatni 4 komponenty (`LoginHeader`, `LoginActions`, `SocialLogin`, `LanguageToggle`) jsou definovane, exportovane, ale NIKDE importovane ani renderovane. Jsou to "orphan" komponenty — pripravene pro budouci pouziti, ale momentalne mrtvy kod.

---

## 4. Import graf

### index.jsx (vstupni bod)

```
index.jsx
  ├── react
  ├── firebase/auth ──> signInWithEmailAndPassword  [MRTVY KOD — nepouziva se]
  ├── ../../firebase ──> auth                        [MRTVY KOD — nepouziva se]
  ├── react-router-dom ──> useLocation, useNavigate, Navigate
  ├── ../../context/AuthContext ──> useAuth
  └── ./components/LoginForm ──> LoginForm
```

### LoginForm.jsx (hlavni formular)

```
LoginForm.jsx
  ├── react
  ├── react-router-dom ──> useNavigate
  ├── react-hook-form ──> useForm
  ├── @hookform/resolvers/zod ──> zodResolver
  ├── zod ──> z
  ├── firebase/auth ──> signInWithEmailAndPassword
  ├── firebase/firestore ──> doc, getDoc
  ├── @/firebase ──> auth, db
  ├── @/components/ui/forge/ForgeButton
  ├── @/components/AppIcon ──> Icon
  └── react-i18next ──> useTranslation
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
- Pouziva `--forge-font-body` pro vsechny texty formulare (labely, inputy, errory, checkbox) — spravne, formular neni heading ani tech label
- Pouziva Forge tokenove barvy konzistentne
- ForgeButton `variant="primary"` pro hlavni akci
- Tmave pozadi, svetly text — odpovida Forge dark theme

**Potencialni problemy:**
- Zadne pouziti `--forge-font-heading` nikde v LoginForm — nadpis/header formulare chybi (LoginHeader ktery by ho mel existuje, ale neni pouzivan)
- `labelStyle` pouziva `fontFamily: 'var(--forge-font-body)'` s `textTransform: 'uppercase'` a `letterSpacing: '0.05em'` — toto vizualne pripomina `--forge-font-tech` styl ale pouziva body font. Nekonzistentni s LoginActions/SocialLogin ktere pouzivaji `--forge-font-tech` pro stejny uppercase styl

---

## 8. UI komponenty — detailni popis

### 8.1 Login (index.jsx) — Vstupni kontejner

**Funkce:**
1. Kontroluje stav prihlaseni pres `useAuth()` — `currentUser` a `loading`
2. Pokud je uzivatel jiz prihlasen (`!loading && currentUser`), presmeruje na `from` cestu nebo `/customer-dashboard`
3. Definuje `handleLogin` callback (ktery je IGNOROVAN — viz sekce 17)
4. Renderuje `<LoginForm handleLogin={handleLogin} />`

**Props predavane do LoginForm:**
- `handleLogin` — async funkce prijimajici `{ email, password }` — **IGNOROVANA** komponentou

### 8.2 LoginForm.jsx — Hlavni prihlasovaci formular

**Formularova pole:**

| Pole | Typ | Validace | Default |
|------|-----|----------|---------|
| email | `<input type="email">` | Zod: `z.string().email()` | `""` |
| password | `<input type="password">` | Zod: `z.string().min(1)` | `""` |
| rememberMe | `<input type="checkbox">` | Zod: `z.boolean().optional()` | `false` |

**Submit flow:**
1. `handleSubmit(onSubmit)` — react-hook-form validace pres Zod schema
2. `signInWithEmailAndPassword(auth, data.email, data.password)` — Firebase Auth
3. `getDoc(doc(db, 'users', user.uid))` — nacteni role z Firestore
4. Redirect podle role:
   - `role === 'host'` -> `/host-dashboard`
   - jinak -> `/customer-dashboard`
5. Pokud Firestore dokument neexistuje -> fallback na `/customer-dashboard`

**Stav formulare:**
- `isSubmitting` — z react-hook-form, disabluje inputy a meni text tlacitka
- `errors` — per-field validacni chyby + `root.serverError` pro Firebase chyby

### 8.3 LoginHeader.jsx (NEAKTIVNI)

**Ucel:** Zobrazi logo ModelPricer (ikona Layers3 + nazev + "3D PRINT PRICING") a uvitaci text "Welcome Back" / "Sign in to continue".

**Poznamky:**
- Obsahuje hardcoded anglicke texty ("Welcome Back", "Sign in to continue", "3D PRINT PRICING") — nepreklada pres i18n
- Link na `/` (homepage) pres logo

### 8.4 LoginActions.jsx (NEAKTIVNI)

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
[useAuth() kontrola]──── currentUser existuje ───> <Navigate to={from} />
    │
    (loading || !currentUser)
    │
    ▼
[LoginForm renderovan]
    │
    ▼
[Uzivatel vyplni email + heslo]
    │
    ▼
[Submit]
    │
    ▼
[Zod validace]──── CHYBA ───> Zobrazi field-level errors
    │
    (OK)
    │
    ▼
[signInWithEmailAndPassword]──── CHYBA ───> setError('root.serverError', ...)
    │
    (OK)
    │
    ▼
[getDoc(users/{uid})]──── dokument neexistuje ───> navigate('/customer-dashboard')
    │
    (existuje)
    │
    ▼
[Cti role z Firestore]
    │
    ├── role === 'host' ───> navigate('/host-dashboard')
    └── else ──────────────> navigate('/customer-dashboard')
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
| Firebase Auth | Prihlaseni | `auth/invalid-credential`, `auth/too-many-requests` |
| Firebase Firestore | Cteni user role | Fallback na `/customer-dashboard` pokud dokument neexistuje |
| AuthContext | Auth stav | Pokud neni `AuthProvider` v stromu → throw Error |

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

### 10.3 Firestore chyby

Pokud `getDoc` selze nebo uzivatelsky dokument neexistuje:
- `console.error("User document not found in Firestore!")`
- Fallback redirect na `/customer-dashboard`
- Zadna vizualni chybova zprava pro uzivatele

### 10.4 Mezery v error handling

- `rememberMe` checkbox se nikde nepouziva v logice — hodnota se sice uklada do form data ale `signInWithEmailAndPassword` ji ignoruje. Firebase Auth persistence je nastavena globalne na `browserLocalPersistence` v `firebase.js:42`.
- `getDoc` muze selhat (sitova chyba, permissions) — neni osetreno try/catch specificky, spadne do hlavniho catch bloku ktery zobrazi genericku hlasku
- Chybi loading state na urovni stranky (kdyz `AuthContext.loading === true`, nic se nerenderuje — potencialni flash)

---

## 11. Preklady (i18n)

### 11.1 Pouzity system

`LoginForm.jsx` pouziva `react-i18next` pres hook `useTranslation()`. Prekladove klice jsou v `src/locales/cs/translation.json` pod namespace `loginForm`.

### 11.2 Prekladove klice

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

### 11.3 Chybejici preklady (EN)

Existuje POUZE cesky preklad (`src/locales/cs/translation.json`). Anglicky preklad (`src/locales/en/`) NEEXISTUJE. Soubor `i18n.js` definuje `fallbackLng: "cs"` a nacita pouze `translationCS`.

### 11.4 Neprekladane texty

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
3. Po prihlaseni se cte role z Firestore (`users/{uid}`) — toto je potencialni bezpecnostni bod (viz nize)

### 14.3 Bezpecnostni poznamky

| Oblast | Hodnoceni | Detail |
|--------|-----------|--------|
| Error zpravy | OK | Stejne zpravy pro `invalid-credential`, `user-not-found`, `wrong-password` — neodhaluje zda email existuje |
| Rate limiting | OK | Firebase `auth/too-many-requests` je zpracovan a zobrazen uzivateli |
| Password visibility | OK | `type="password"` — neni show/hide toggle (bezpecnejsi) |
| Demo credentials v kodu | RIZIKO | `LoginActions.jsx` obsahuje hardcoded demo ucty s hesly (customer123, host123, admin123) — i kdyz je komponenta neaktivni, je v kodu |
| rememberMe nefunkcni | INFO | Checkbox existuje ale nema zadny efekt — Firebase persistence je vzdy `browserLocalPersistence` |
| Firestore role fetch | INFO | Uzivatelska role se cte na klientovi po prihlaseni — samotna autorizace MUSI byt osetrena na backendu/Firestore Security Rules, ne jen na FE redirect |
| Console logging | INFO | `console.error` pro Firebase chyby a chybejici Firestore dokument — v produkci by melo byt potlaceno |

---

## 16. Souvisejici dokumenty

| Dokument/Soubor | Vztah k Login |
|-----------------|---------------|
| `src/context/AuthContext.jsx` | Poskytuje `useAuth()` — `currentUser`, `loading` |
| `src/firebase.js` | Firebase app inicializace, export `auth`, `db` |
| `src/locales/cs/translation.json` | Prekladove klice `loginForm.*` |
| `src/i18n.js` | Konfigurace react-i18next (pouze CS jazyk) |
| `src/Routes.jsx:74` | Route `/login` definice |
| `src/components/ui/forge/ForgeButton.jsx` | Submit tlacitko |
| `src/components/AppIcon.jsx` | Lucide ikony (AlertCircle) |
| `src/styles/forge-tokens.css` | Forge design tokeny |
| `src/pages/register/` | Registracni stranka (odkaz z LoginActions) |
| `src/components/PrivateRoute.jsx` | Chranene routy (redirect na login) |

---

## 17. Zname omezeni

### 17.1 BUG: Mrtvy kod v index.jsx — handleLogin prop ignorovana

**Kde:** `src/pages/login/index.jsx:19-27` a `index.jsx:29`

**Popis:** `index.jsx` definuje funkci `handleLogin` ktera vola `signInWithEmailAndPassword` a predava ji jako prop do `<LoginForm handleLogin={handleLogin} />`. Avsak `LoginForm.jsx` je definovan jako `const LoginForm = ()` — bez akceptovani props. LoginForm ma svoji vlastni kompletni auth logiku vcetne `signInWithEmailAndPassword`, cteni role z Firestore a navigace.

**Dusledek:**
- `handleLogin` v `index.jsx` je mrtvy kod (nikdy se nevola)
- Redirect logika v `index.jsx` (`from` z location state) se nikdy nepouzije
- `signInWithEmailAndPassword` import v `index.jsx` je zbytecny
- Duplicitni Firebase import (`../../firebase` v index.jsx + `@/firebase` v LoginForm.jsx)

**Dopad:** Funkcne zadny (LoginForm funguje spravne). Ale kod je matouci a obsahuje duplicitni importy.

### 17.2 BUG: Redirect logika se lisi mezi soubory

**Kde:** `index.jsx:12` vs `LoginForm.jsx:79-83`

**Popis:**
- `index.jsx` presmerovava na `location.state?.from?.pathname || '/customer-dashboard'` (podpora "redirect back to original page")
- `LoginForm.jsx` presmerovava na zakladne Firestore role: `/host-dashboard` nebo `/customer-dashboard`

Protoze se pouziva jen `LoginForm.jsx` logika, funkce "redirect back to page where user was before login" NEFUNGUJE.

### 17.3 Orphan komponenty

4 z 5 subkomponent jsou pripravene ale nepouzivane:
- `LoginHeader.jsx` — logo + uvitani
- `LoginActions.jsx` — forgot password + register + demo credentials
- `SocialLogin.jsx` — socialni prihlaseni (jen placeholder, zadna implementace)
- `LanguageToggle.jsx` — prepinac jazyka

### 17.4 rememberMe checkbox nema efekt

Checkbox "Zapamatovat si me" se renderuje a jeho hodnota se uklada do form dat, ale nikde se nevyuziva. Firebase Auth je globalne nastaven na `browserLocalPersistence` (session vzdy prezije) bez ohledu na checkbox.

### 17.5 Chybejici routa /forgot-password

`LoginActions.jsx:31` odkazuje na `/forgot-password`, ale tato routa neni definovana v `Routes.jsx`. Pokud by se LoginActions aktivovala, odkaz by vedl na 404.

### 17.6 SocialLogin je jen placeholder

`SocialLogin.jsx` definuje tlacitka pro Google, Facebook, Apple ale `handleSocialLogin` jen loguje do konzole. Firebase Social Auth neni implementovan.

### 17.7 Neni EN preklad

`i18n.js` nacita pouze cesky preklad. Pokud by byl jazyk nastaven na EN, vsechny klice by se zobrazily jako cesky fallback (diky `fallbackLng: "cs"`).

### 17.8 Chybejici loading state na urovni stranky

Kdyz `AuthContext.loading === true`, `index.jsx` nevrati nic (ani loading spinner) — `LoginForm` se renderuje, ale `useAuth` nemusi byt jeste resolved. Nicmene LoginForm pouziva vlastni auth logiku nezavislou na AuthContext, takze prakticky to nezpusobuje problemy.

### 17.9 Pristupnost — labels nepropojene s inputy

Viz sekce 12.2. Hlavni problem: `<label>` elementy nejsou propojene pres `htmlFor`/`id`.
