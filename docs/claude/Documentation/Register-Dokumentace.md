# Register -- Dokumentace

> Registracni stranka ModelPricer platformy (Auth Sprint 1). Jednokrokovy formular pro vytvoreni uctu
> bez vyberem role. Podpora email/heslo a Google Sign-Up pres Firebase Auth.

---

## 1. Prehled

| Polozka | Hodnota |
|---------|---------|
| **URL** | `/register` |
| **Route** | `src/Routes.jsx` radek 75 — `<Route path="/register" element={<Register />} />` |
| **Entrypoint** | `src/pages/register/index.jsx` |
| **Typ** | Verejna stranka (bez autentizace) |
| **Header/Footer** | Ano — renderuje se v hlavnim layout wrapperu s `<Header />` a `<Footer />` |

### Funkcni prehled (Auth Sprint 1)

Stranka implementuje 1-krokovy registracni formular (bez role selection):

1. **Registracni formular**: Uzivatel vyplni osobni udaje (jmeno, prijmeni, email, heslo) a klikne "Vytvorit ucet"
2. **Google Sign-Up**: Alternativne se muze registrovat pres Google Sign-In (primo bez role selection)

Po uspesnem odeslani se uzivatel registruje pres Firebase Auth, jeho profil se ulozi do Firestore kolekce `users`, a nasleduje redirect na `/admin`.

> **Change v Auth Sprint 1:** Role selection (Customer / Provider) byla odstranena. Role je nyn urcena pres backend logiku nebo admin.

---

## 2. Technologie a jazyk

| Technologie | Pouziti |
|-------------|---------|
| **React 19** | Funkcionalni komponenty s hooks |
| **react-hook-form** | Formularovy state management (v `RegistrationForm`) |
| **zod** + `@hookform/resolvers/zod` | Schema validace formulare |
| **Firebase Auth** | `createUserWithEmailAndPassword` pro registraci |
| **Firebase Firestore** | `setDoc` pro ulozeni uzivatelskeho profilu do kolekce `users` |
| **react-i18next** | Preklady v `index.jsx` (registerPage.*) i `RegistrationForm` (registrationForm.*) |
| **react-router-dom** | `useNavigate` pro redirect, `Link` pro navigaci na login/terms/privacy |
| **lucide-react** | Ikony pres wrapper `AppIcon` (User, Printer, Check, Lock, Building, FileText, Eye, EyeOff) |
| **Forge Design Tokens** | Vizualni theme pres CSS custom properties |

### Jazykove poznamky

- `index.jsx` pouziva `react-i18next` (`useTranslation()`) pro nadpis a podnadpis stranky
- `RegistrationForm.jsx` pouziva `react-i18next` (`useTranslation()`) pro formularove texty
- Obe komponenty sdili stejnou i18n instanci s fallbackem na `cs`

---

## 3. Architektura souboru

```
src/pages/register/
  index.jsx                         -- Hlavni stranka (jednoduchy wrapper)
  components/
    RegistrationForm.jsx            -- Registracni formular (react-hook-form + zod + Firebase)
    GoogleSignUpButton.jsx          -- Google Sign-Up tlacitko (Auth Sprint 1)
```

**Vypnuto v Auth Sprint 1:**
- RoleSelectionCard.jsx — role selection je vypnuta
- ProgressSteps.jsx — 2-krokovy wizard je zmenena na 1-krok
- LanguageToggle.jsx — vypnuta

### Velikosti souboru (priblizne)

| Soubor | Radky | Popis |
|--------|-------|-------|
| `src/pages/register/index.jsx` | 64 | Orchestrator, layout, redirect na /admin (Auth Sprint 1 — jednoduseny) |
| `src/pages/register/components/RegistrationForm.jsx` | 341 | Formular, validace, useAuth() + Google Sign-In, renderovaci helpery |
| `src/components/ui/GoogleSignInButton.jsx` | 70 | Google Sign-In tlacitko (sdilena komponenta, shared folder) |
| `RoleSelectionCard.jsx` | — | **SMAZAN** v Auth Sprint 1 |
| `ProgressSteps.jsx` | — | **SMAZAN** v Auth Sprint 1 |
| `LanguageToggle.jsx` | — | **SMAZAN** v Auth Sprint 1 |

---

## 4. Import graf (Auth Sprint 1 — zjednoduseno)

```
index.jsx
  |-- useAuth()               <-- @/context/AuthContext
  |-- Navigate                <-- react-router-dom
  |-- useTranslation          <-- react-i18next
  |-- RegistrationForm        <-- ./components/RegistrationForm

RegistrationForm.jsx
  |-- useNavigate             <-- react-router-dom
  |-- useForm                 <-- react-hook-form
  |-- zodResolver             <-- @hookform/resolvers/zod
  |-- z                       <-- zod
  |-- useAuth()               <-- @/context/AuthContext
  |-- ForgeButton             <-- @/components/ui/forge/ForgeButton
  |-- GoogleSignInButton      <-- @/components/ui/GoogleSignInButton
  |-- Icon (AppIcon)          <-- @/components/AppIcon
  |-- useTranslation          <-- react-i18next
```

> **Auth Sprint 1 zmena:** RoleSelectionCard, ProgressSteps, LanguageToggle byly SMAZANY. GoogleSignInButton je nova sdilena komponenta v src/components/ui/.

---

## 5. Design a vizual

### 5.1 Forge Token compliance

Stranka konzistentne pouziva Forge design tokens pres inline styly (zadne CSS soubory, zadne Tailwind tridy v register komponentach).

| Token | Pouziti |
|-------|---------|
| `--forge-bg-void` | Pozadi cele stranky (`minHeight: 100vh`) |
| `--forge-bg-surface` | Hlavni karta (card background) |
| `--forge-bg-elevated` | Input fieldy, neaktivni role karty, neaktivni stepper kolecka |
| `--forge-accent-primary` (#00D4AA) | Aktivni border, selected indikator, checkbox accent, focus ring, linky |
| `--forge-border-default` | Karta border, input border, neaktivni stepper |
| `--forge-text-primary` | Nadpisy, input text |
| `--forge-text-muted` | Popisy, labely, benefits text |
| `--forge-text-disabled` | Neaktivni stepper cisla, neaktivni check ikony |
| `--forge-error` (#FF4757) | Error messages, input border pri chybe |
| `--forge-radius-sm/md/lg` | Zaobleni inputu, karet, hlavni karty |
| `--forge-font-heading` | H1, H2, H3 nadpisy (Space Grotesk) |
| `--forge-font-body` | Body text, popisy, labely (IBM Plex Sans) |
| `--forge-font-tech` | Section headingy ve formulari (Space Mono) — viz poznamka nize |
| `--forge-font-mono` | Cisla stepper kroku (JetBrains Mono) |

### 5.2 Font token poznamka

`sectionHeadingStyle` v `RegistrationForm.jsx` pouziva `--forge-font-tech` pro `<h3>` elementy
(napr. "Osobni udaje", "Zabezpeceni", "Informace o podnikani"). Tyto jsou 12px uppercase labely,
coz dle konvence odpovida `forge-font-tech` pouziti. Semanticky jsou vsak `<h3>` tagy,
coz muze byt matouci — zvazit zmenu na `<div role="heading" aria-level="3">` nebo pouziti
`forge-font-heading` s malou velikosti.

### 5.3 Layout

- **Kontejner**: `maxWidth: 800px`, vycentrovany, `padding: 48px 24px`
- **Role karty**: CSS Grid `repeat(auto-fit, minmax(280px, 1fr))` — 2 sloupce na desktopu, 1 na mobilu
- **Formular**: Flexbox column s `gap: 24px` mezi sekcemi
- **Input grid**: Jmeno/Prijmeni a Mesto/PSC v `1fr 1fr` gridu

### 5.4 Hardcoded barvy (mimo tokeny)

| Barva | Kde | Popis |
|-------|-----|-------|
| `#08090C` | RoleSelectionCard:38, :61, ForgeButton | Tmava barva textu na primary akcent (checkmark, selected icon) |
| `rgba(0, 212, 170, 0.06)` | RoleSelectionCard:10 | Ghost tint pro selected kartu |
| `rgba(0, 212, 170, 0.4)` | RoleSelectionCard:48 | Hover border pro neselected kartu |
| `rgba(0, 212, 170, 0.1)` | ProgressSteps:30, LanguageToggle:21 | Aktivni stepper bg, aktivni jazyk bg |
| `rgba(0,212,170,0.15)` | RegistrationForm:166 | Focus box-shadow |

> Tyto `rgba` hodnoty vychazi z `--forge-accent-primary` (#00D4AA) ale nejsou definovane jako tokeny.
> Pro konzistenci by se mely pouzit existujici tokeny: `--forge-accent-primary-subtle` (0.15)
> a `--forge-accent-primary-ghost` (0.06).

---

## 8. UI komponenty

### 8.1 Register (index.jsx)

**Hlavni wrapper stranky (Auth Sprint 1 — zjednoduseno).**

**Novy flow:**
1. Zobrazi `RegistrationForm` + `GoogleSignUpButton`
2. Zadne role selection, zadny stepper
3. Po uspesnem odeslani — navigate `/admin`

### 8.2 RegistrationForm

**Jednoduchy registracni formular s Firebase integraci (Auth Sprint 1).**

| State | Typ | Vychozi | Popis |
|-------|-----|---------|-------|
| `showPassword` | boolean | `false` | Zobrazeni/skryti hesla |
| `showConfirmPassword` | boolean | `false` | Zobrazeni/skryti potvrzeni hesla |

**Formularove pole (bez role selection):**

1. firstName* (povinne)
2. lastName* (povinne)
3. email* (povinne)
4. password* (min 6 znaku)
5. confirmPassword* (musi se shodovat s password)
6. agreeTerms* (souhlas s podminama)

> `*` = povinne pole

**Auth Sprint 1 zmeny:**
- Role-specific pole (companyName, businessId, city, address) byla ODSTRANENA
- Formular je nyn univerzalni bez ohledu na roli
- Pole jako phone, agreeMarketing, confirmEquipment byla ODSTRANENA

**Validacni schema (zod - Auth Sprint 1 zjednoduseno):**

Schema je jednoduche bez role-specific polí:
- firstName: `min(1)` — "Jmeno je povinne."
- lastName: `min(1)` — "Prijmeni je povinne."
- email: `email()` — "Neplatny format emailu."
- password: `min(6)` — "Heslo musi mit alespon 6 znaku."
- confirmPassword: refine (`password === confirmPassword`) — "Hesla se neshoduji."
- agreeTerms: refine (`=== true`) — "Musite souhlasit s podminkami."

**Helper funkce pro renderovani:**
- `renderInput(name, label, type, placeholder, required)` — genericky textovy input
- `renderPasswordInput(name, label, show, setShow, placeholder)` — input s toggle Eye/EyeOff ikonou
- `renderCheckbox(name, label, required)` — checkbox s labelem

### 8.3 GoogleSignInButton.jsx (NEW v Auth Sprint 1 — sdilena komponenta)

**Tlacitko pro prihlaseni / registraci pres Google:**
- Umisteni: `src/components/ui/GoogleSignInButton.jsx` (sdilena komponenta)
- Pouziti: Login i Register stranky
- Klikne na tlacitko — zavola `useAuth().loginWithGoogle()`
- Firebase Auth + Google Sign-In popup (okno)
- Po uspesnem prihlaseni — navigate `/admin`
- Props: `onSuccess` (callback), `onError` (error handler), `label` (button text), `disabled`
- Google SVG logo inline
- Chyby jsou logovane a zobrazeny uzivateli pres callback

---

## 9. State management a data flow

### 9.1 Data flow diagram (Auth Sprint 1)

```
Register (index.jsx)
  |
  |-- RegistrationForm + GoogleSignUpButton
  |
  RegistrationForm
    |
    |-- react-hook-form ----- formData
    |                    \--- errors (validacni chyby)
    |                    \--- isSubmitting (loading stav)
    |
    |-- useAuth() -----------> register(email, password, userData)
    |-- Firebase Auth -------> createUserWithEmailAndPassword
    |-- Firestore -----------> setDoc(doc(db, "users", uid), userData)
    |-- useNavigate ---------> redirect na /admin
  |
  GoogleSignUpButton
    |
    |-- useAuth() -----------> signUpWithGoogle()
    |-- Firebase Auth -------> signInWithPopup (Google)
    |-- useNavigate ---------> redirect na /admin
```

### 9.2 Registracni submit flow (Auth Sprint 1)

1. Uzivatel vyplni formular a klikne "Vytvorit ucet"
2. `react-hook-form` provede zod validaci
3. Pokud validace projde — `onSubmit(data)` se zavola
4. `useAuth().register(email, password, userData)` — vytvori Firebase Auth ucet + Firestore profil
5. Firestore profil obsahuje: `displayName`, `firstName`, `lastName` (bez role-specific poli)
6. `navigate('/admin', { replace: true })` — redirect na admin dashboard
7. Pri chybe: nastaveni error messages pres `setError()`, zvlast pro email-already-in-use

### 9.3 Firestore datova struktura (kolekce `users`) — Auth Sprint 1

```js
{
  uid: string,           // Firebase Auth UID
  displayName: string,   // `${firstName} ${lastName}`
  firstName: string,
  lastName: string,
  email: string
  // Auth Sprint 1: role-specific pole ODSTRANIENA
  // - role ('customer' | 'host') — neni ukladano
  // - companyName, businessId, address — ODSTRANIENA
  // - phone — ODSTRANIENA
  // - createdAt — NENI ukladano
}
```

> **Auth Sprint 1 zmeny:** Role selection byla vypnuta. Firestore profil uz neuchovava `role`, `companyName`, `businessId`, `address`, `phone`.
> Tyto pole byla ODSTRANENA dle zadani.
> Role bude spravovana pres backend logiku nebo admin.
> Poznamka: `createdAt` a dalsi pole mohou byt pridana v budoucnosti pokud bude potreba.

---

## 10. Error handling

### 10.1 Validacni chyby (klientske)

Vsechny validacni chyby jsou reseny pres `zod` schema + `react-hook-form`:

| Pole | Pravidlo | Chybova hlaska (CS) |
|------|----------|---------------------|
| firstName | `min(1)` | "Jmeno je povinne." |
| lastName | `min(1)` | "Prijmeni je povinne." |
| email | `email()` | "Neplatny format emailu." |
| password | `min(6)` | "Heslo musi mit alespon 6 znaku." |
| confirmPassword | refine (=== password) | "Hesla se neshoduji." |
| agreeTerms | refine (=== true) | "Musite souhlasit s podminkami." |

> **Auth Sprint 1:** Role-specific pole (city, postalCode, address, confirmEquipment) byla ODSTRANENA

### 10.2 Serverove chyby (Firebase)

| Error code | Zpracovani | Zobrazeni |
|------------|------------|-----------|
| `auth/email-already-in-use` | `setError('email', ...)` | Chyba u email inputu |
| Ostatni chyby | `setError('root.serverError', ...)` | Cerveny text nad formularem |

### 10.3 Chybejici error handling

- **Firestore write failure**: Pokud `setDoc` selze po uspesnem vytvoreni Auth uctu, uzivatel ma ucet
  ale zadny profil v databazi. Neni implementovan rollback ani retry.
- **Network errors**: Zadna specificka detekce offline stavu.
- **Rate limiting**: Firebase Auth ma built-in rate limiting, ale UI neinformuje uzivatele.

---

## 11. Preklady (i18n)

### 11.1 Stav prekladu

| Komponenta | i18n system | Stav |
|------------|-------------|------|
| `index.jsx` | `react-i18next` | Lokalizovano (registerPage.title, registerPage.subtitle) |
| `RegistrationForm.jsx` | `react-i18next` | Plne prelozeno do CS |
| `RoleSelectionCard.jsx` | **ZADNY** | Texty prijaty pres props z index.jsx (anglicky) |
| `ProgressSteps.jsx` | **ZADNY** | Texty prijaty pres props z index.jsx (anglicky) |
| `LanguageToggle.jsx` | **ZADNY** | Jen labely "CZ"/"EN" (neprelozitelne) |

### 11.2 Prekladove klice v index.jsx

| Klic | CS fallback |
|------|-------------|
| `registerPage.title` | "Vytvorte si ucet" |
| `registerPage.subtitle` | "Pripojte se k platforme pro 3D tisk" |

> **Zmena 2026-02-23:** Hardcoded anglicke texty ("Create Account", "Join the 3D printing platform") nahrazeny lokalizovanymi klici pres `useTranslation()`.

### 11.3 react-i18next konfigurace

- Konfiguracni soubor: `src/i18n.js`
- Nactene jazyky: **pouze CS** (cesky)
- Fallback jazyk: `cs`
- EN preklady: **NEEXISTUJI** (zadny soubor `src/locales/en/translation.json`)

### 11.4 Jazykovy system

`index.jsx` i `RegistrationForm.jsx` pouzivaji `react-i18next` (`useTranslation()`).
Oba systemy sdili stejnou instanci i18n s fallbackem na `cs`.

> **Zmena 2026-02-23:** Puvodne index.jsx mel vlastni `currentLanguage` state s `localStorage('language')`. Toto bylo odstraneno v Auth Sprint 1 (zjednoduseni) a nahrazeno `useTranslation()`.

---

## 12. Pristupnost

### 12.1 Pozitivni aspekty

- Formularove inputy maji `<label>` elementy (pres `renderInput` a `renderPasswordInput`)
- Checkboxy maji wrapping `<label>` s textem
- Error messages jsou vizualne odlisene (cervena barva)
- Disabled state pri `isSubmitting` na vsech inputech a buttonu
- Password toggle ma `type="button"` (nepodmiti formular)

### 12.2 Problemy

| Problem | Kde | Zavaznost |
|---------|-----|-----------|
| **`<div onClick>` bez `role`/`tabIndex`/`onKeyDown`** | `RoleSelectionCard.jsx:43` | Vysoka — karta neni dostupna klavesnici |
| **Chybejici `htmlFor`/`id` asociace** | Vsechny inputy — `<label>` a `<input>` nejsou propojeny pres `htmlFor`/`id` | Stredni — screen reader nemuze asociovat label s inputem (s vyjimkou wrapping `<label>` u checkboxu) |
| **Error messages bez `aria-live`** | `RegistrationForm.jsx` vsechny error divy | Stredni — screen reader nehlasi chyby automaticky |
| **Error messages bez `role="alert"`** | Server error i field errors | Stredni |
| **Chybejici `aria-describedby`** | Inputy nemaji odkaz na svuj error message | Stredni |
| **Chybejici `aria-invalid`** | Inputy pri chybe nemaji `aria-invalid="true"` | Stredni |
| **Chybejici `aria-required`** | Povinna pole nemaji `aria-required="true"` | Nizka |
| **LanguageToggle bez `aria-pressed`** | Tlacitka prepinace jazyka | Nizka |
| **Stepper bez `aria-current="step"`** | ProgressSteps aktivni krok | Nizka |

---

## 14. Bezpecnost

### 14.1 Input validace

- **Klientska validace**: zod schema — email format, min delka hesla (6 znaku), povinnost poli
- **Serverova validace**: Firebase Auth vlastni pravidla (email format, heslo min 6 znaku, uniqueness)
- **XSS ochrana**: React automaticky escapuje vsechny renderovane stringy
- **CSRF**: Nerelevantni — Firebase Auth SDK pouziva vlastni token management

### 14.2 Hesla

- Minimalni delka: **6 znaku** (Firebase Auth minimum)
- Zadne dalsi pozadavky (velka/mala pismena, cisla, specialni znaky)
- Show/hide toggle pro heslo i potvrzeni

### 14.3 Registracni flow bezpecnost

| Aspekt | Stav | Poznamka |
|--------|------|----------|
| Email verifikace | **NENI** | Firebase Auth podporuje `sendEmailVerification()` ale neni implementovano |
| Rate limiting | Firebase built-in | Neni UI feedback |
| CAPTCHA | **NENI** | Zadna ochrana proti bot registracim |
| Auth rollback | **NENI** | Pokud Firestore write selze, Auth ucet zustane bez profilu |
| Password strength meter | **NENI** | Jen minimalni delka 6 znaku |
| Sensitive data v URL | OK | Zadna citliva data v URL parametrech |

### 14.4 Firebase bezpecnost

- Auth a Firestore instance importovany z centralni konfigurace `@/firebase`
- Firebase config nacitany z `VITE_FIREBASE_*` env variables
- Auth persistence: `browserLocalPersistence` (token v localStorage)
- Firestore document ID = `user.uid` (auth-driven, ne user-supplied)

### 14.5 Upozorneni

- `console.error("Firebase registration error:", error)` na radku 160 — loguje plny error objekt
  vcetne potencialne citlivych informaci do konzole prohlizece. V produkci by se melo logovat
  jen na server (Sentry, apod.) bez expose do klienta.

---

## 16. Souvisejici dokumenty

| Dokument | Cesta | Popis |
|----------|-------|-------|
| CLAUDE.md | `Model_Pricer-V2-main/CLAUDE.md` | Hlavni operacni manual |
| MEMORY.md | `.claude/projects/.../memory/MEMORY.md` | Projektove pasti a konvence |
| Routes.jsx | `src/Routes.jsx` | Routing — radek 75 definuje `/register` |
| Login stranka | `src/pages/login/` | Prihlaseni (navazujici flow) |
| Firebase config | `src/firebase.js` | Firebase inicializace, auth, db export |
| i18n config | `src/i18n.js` | react-i18next setup (jen CS) |
| CS preklady | `src/locales/cs/translation.json` | Ceske preklady — klic `registrationForm` |
| Forge tokens | `src/styles/forge-tokens.css` | Design tokeny |
| ForgeButton | `src/components/ui/forge/ForgeButton.jsx` | Sdileny button komponent |
| AppIcon | `src/components/AppIcon.jsx` | Lucide ikony wrapper |

---

## 17. Zname omezeni (STAV Po Auth Sprint 1)

### 17.1 VYRESENO v Auth Sprint 1

1. **Dvou-krokovy wizard s role selection** — VYRESENO: Zjednosuseno na 1-krok bez role selection
2. **Krok 3 (Verify) neexistuje** — VYRESENO: Stepper byl vypnut, zadne email verification (vzdy by byla nutna)
3. **Hardcoded anglicke texty v index.jsx** — VYRESENO: index.jsx je nyn jednoduchy wrapper bez orkestraci
4. **Orphan komponenty** — VYRESENO: RoleSelectionCard, ProgressSteps, LanguageToggle vypnute

### 17.2 Zustale existujici omezeni

- **Neni EN preklad** — `i18n.js` nacita pouze CS. Pokud by uzivatel prepnul na EN, jebi fallback na CS.
- **Pristupnost — labels nepropojene s inputy** — `<label>` elementy nemaji `htmlFor`/`id`. Nutna oprava.
- **Pristupnost — error messages bez aria-live** — Server error message nema `role="alert"` ani `aria-live="assertive"`.

### 17.3 Future improvements (Roadmap)

- [ ] Email verification after registration
- [ ] Password strength meter
- [ ] Captcha ochrana (anti-bot registration)
- [ ] EN translation completion
- [ ] Accessibility audit + fixes (aria-describedby, aria-invalid, etc.)

---

*Posledni aktualizace: 2026-02-24 (Sprint 1 Auth Bugfixy)*

### Zmeny 2026-02-24:
- **FirebaseAuthProvider.jsx:** `register()` — `setDoc()` obaleno try/catch. Pokud Firestore zapis selze, registrace pokracuje (nezablokuje vytvoreni uctu).
- **RegistrationForm.jsx:** `handleGoogleError()` — pridan `console.error('Google registration error:', err)`, pridano `auth/account-exists-with-different-credential` handling (sjednocene s LoginForm pattern).
- **GoogleSignInButton.jsx:** Pridan `console.error` v catch bloku.

### Zmeny 2026-02-23:
- Lokalizace textu v index.jsx pres useTranslation
