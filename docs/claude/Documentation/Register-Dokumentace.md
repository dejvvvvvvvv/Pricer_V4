# Register -- Dokumentace

> Registracni stranka ModelPricer platformy. Dvou-krokovy wizard pro vytvoreni uctu
> s vyberem role (Customer / Provider) a registracnim formularem napojenym na Firebase Auth.

---

## 1. Prehled

| Polozka | Hodnota |
|---------|---------|
| **URL** | `/register` |
| **Route** | `src/Routes.jsx` radek 75 — `<Route path="/register" element={<Register />} />` |
| **Entrypoint** | `src/pages/register/index.jsx` |
| **Typ** | Verejna stranka (bez autentizace) |
| **Header/Footer** | Ano — renderuje se v hlavnim layout wrapperu s `<Header />` a `<Footer />` |

### Funkcni prehled

Stranka implementuje 2-krokovy registracni flow:

1. **Krok 1 — Vyber role**: Uzivatel zvoli mezi "Customer" (zakaznik) a "Provider" (host/provozovatel tiskarny).
2. **Krok 2 — Registracni formular**: Podle zvolene role se zobrazi formular s osobnimi udaji, heslem, a pro roli "host" i firemnimi udaji a adresou.

Po uspesnem odeslani se uzivatel registruje pres Firebase Auth, jeho profil se ulozi do Firestore kolekce `users`, a nasleduje redirect na `/host-dashboard` nebo `/customer-dashboard`.

> **POZOR:** Stepper vizualne zobrazuje 3 kroky (Role, Details, Verify), ale krok 3 (Verification / overeni emailu) neni implementovan. Po odeslani formulare v kroku 2 dochazi k primu navigate bez overeni.

---

## 2. Technologie a jazyk

| Technologie | Pouziti |
|-------------|---------|
| **React 19** | Funkcionalni komponenty s hooks |
| **react-hook-form** | Formularovy state management (v `RegistrationForm`) |
| **zod** + `@hookform/resolvers/zod` | Schema validace formulare |
| **Firebase Auth** | `createUserWithEmailAndPassword` pro registraci |
| **Firebase Firestore** | `setDoc` pro ulozeni uzivatelskeho profilu do kolekce `users` |
| **react-i18next** | Preklady v `RegistrationForm` (ale NE v `index.jsx` — viz sekce 11) |
| **react-router-dom** | `useNavigate` pro redirect, `Link` pro navigaci na login/terms/privacy |
| **lucide-react** | Ikony pres wrapper `AppIcon` (User, Printer, Check, Lock, Building, FileText, Eye, EyeOff) |
| **Forge Design Tokens** | Vizualni theme pres CSS custom properties |

### Jazykove poznamky

- `RegistrationForm.jsx` pouziva `react-i18next` (`useTranslation()`)
- `index.jsx` ma VLASTNI jazykovy state (`currentLanguage`) ulozeny v localStorage pod klicem `language`
- Tyto dva systemy NEJSOU propojeny (viz sekce 11 — Zname omezeni)

---

## 3. Architektura souboru

```
src/pages/register/
  index.jsx                         -- Hlavni stranka (orchestrator, stepper, layout)
  components/
    RoleSelectionCard.jsx           -- Karta pro vyber role (Customer/Provider)
    RegistrationForm.jsx            -- Registracni formular (react-hook-form + zod + Firebase)
    ProgressSteps.jsx               -- Vizualni stepper (3 kroky, cislovane kolecka)
    LanguageToggle.jsx              -- Prepinac jazyku CZ/EN (vlastni, ne globalni)
```

### Velikosti souboru (priblizne)

| Soubor | Radky | Popis |
|--------|-------|-------|
| `index.jsx` | 201 | Orchestrator, layout, step navigace, role definice |
| `RegistrationForm.jsx` | 356 | Formular, validace, Firebase submit, renderovaci helpery |
| `RoleSelectionCard.jsx` | 114 | Karta s ikonou, popisem, benefity, selection indicator |
| `ProgressSteps.jsx` | 98 | Stepper s kolecky, caram a popisky |
| `LanguageToggle.jsx` | 38 | Dva tlacitka CZ/EN |

---

## 4. Import graf

```
index.jsx
  |-- RoleSelectionCard       <-- ./components/RoleSelectionCard
  |-- RegistrationForm        <-- ./components/RegistrationForm
  |-- LanguageToggle          <-- ./components/LanguageToggle
  |-- ProgressSteps           <-- ./components/ProgressSteps
  |-- ForgeButton             <-- ../../components/ui/forge/ForgeButton
  |-- Icon (AppIcon)          <-- ../../components/AppIcon

RoleSelectionCard.jsx
  |-- Icon (AppIcon)          <-- ../../../components/AppIcon

RegistrationForm.jsx
  |-- Link, useNavigate       <-- react-router-dom
  |-- useForm                 <-- react-hook-form
  |-- zodResolver             <-- @hookform/resolvers/zod
  |-- z                       <-- zod
  |-- createUserWithEmailAndPassword <-- firebase/auth
  |-- doc, setDoc             <-- firebase/firestore
  |-- auth, db                <-- @/firebase
  |-- ForgeButton             <-- @/components/ui/forge/ForgeButton
  |-- Icon (AppIcon)          <-- @/components/AppIcon
  |-- useTranslation          <-- react-i18next

ProgressSteps.jsx
  |-- Icon (AppIcon)          <-- ../../../components/AppIcon

LanguageToggle.jsx
  |-- ForgeButton             <-- ../../../components/ui/forge/ForgeButton  (IMPORTOVAN ale NEPOUZIT)
```

> **Poznamka:** `LanguageToggle.jsx` importuje `ForgeButton` ale nepouziva jej — tlacitka jsou nativni `<button>` elementy.

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

**Hlavni orchestrator stranky.**

| Props | Zadne (top-level page) |
|-------|------------------------|

| State | Typ | Vychozi | Popis |
|-------|-----|---------|-------|
| `currentLanguage` | string | `'cs'` | Aktualni jazyk (cs/en) — ulozeny v localStorage |
| `currentStep` | number | `1` | Aktualni krok wizardu (1 = role, 2 = form) |
| `selectedRole` | string | `''` | Zvolena role ('customer' / 'host' / '') |

**Definice kroku (steps):**
```js
[
  { id: 'role', title: 'Role', description: 'Select role' },
  { id: 'details', title: 'Details', description: 'Personal info' },
  { id: 'verification', title: 'Verify', description: 'E-mail' }
]
```

**Definice roli (roleOptions):**

| Role | Title | Icon | Popis |
|------|-------|------|-------|
| `customer` | Customer | User | Zakaznik hledajici 3D tisk |
| `host` | Provider | Printer | Provozovatel 3D tiskarny |

Kazda role ma 4 benefity zobrazene v karte.

### 8.2 RoleSelectionCard

**Vizualni karta pro vyber role.**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| `role` | string | ano | Identifikator role ('customer'/'host') |
| `isSelected` | boolean | ano | Zda je karta vybrana |
| `onSelect` | function | ano | Callback pri kliknuti, obdrzi `role` |
| `title` | string | ano | Nazev role |
| `description` | string | ano | Popis role |
| `benefits` | string[] | ne | Seznam vyhod (zobrazeny s check ikonami) |
| `icon` | string | ano | Nazev Lucide ikony |

**Vizualni stavy:**
- **Default**: `--forge-bg-elevated`, `--forge-border-default` border
- **Hover**: `rgba(0,212,170,0.4)` border, `--forge-bg-surface` pozadi
- **Selected**: `--forge-accent-primary` border, `rgba(0,212,170,0.06)` pozadi, zeleny checkmark

**Selection indicator**: Kruhy v pravem hornim rohu — prazdny kruh kdyz neselected, plny zeleny s Check ikonou kdyz selected.

### 8.3 ProgressSteps

**Vizualni stepper s kolecky a spojovacimi carami.**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| `currentStep` | number | ano | Aktualni krok (1-indexed) |
| `totalSteps` | number | ano | Celkovy pocet kroku (NEPOUZITO v implementaci) |
| `steps` | array | ano | Pole objektu `{ id, title, description }` |

**Vizualni stavy kroku:**
- **Completed** (stepNumber < currentStep): Zeleny plny kruh s Check ikonou, zelena spojovaci cara
- **Active** (stepNumber === currentStep): Zeleny obrys s prusvitnym pozadim, zeleny text titulku
- **Inactive** (stepNumber > currentStep): Sedy obrys, sedy text

> **Poznamka:** Prop `totalSteps` je predavan ale nikde v komponente se nepouziva. Pocet kroku se urcuje z `steps.length`.

### 8.4 LanguageToggle

**Prepinac jazyku CZ/EN.**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| `currentLanguage` | string | ano | Aktualni kod jazyka ('cs'/'en') |
| `onLanguageChange` | function | ano | Callback s novym kodem jazyka |

**Poznamka:** Importuje `ForgeButton` ale pouziva nativni `<button>` — zbytecny import.

### 8.5 RegistrationForm

**Hlavni registracni formular s Firebase integraci.**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| `selectedRole` | string | ano | Zvolena role ('customer'/'host') — ovlivnuje validacni schema a viditelna pole |

| State | Typ | Vychozi | Popis |
|-------|-----|---------|-------|
| `showPassword` | boolean | `false` | Zobrazeni/skryti hesla |
| `showConfirmPassword` | boolean | `false` | Zobrazeni/skryti potvrzeni hesla |

**Formularove sekce:**

1. **Osobni udaje** (vzdy): firstName*, lastName*, email*, phone
2. **Zabezpeceni** (vzdy): password* (min 6 znaku), confirmPassword* (musi se shodovat)
3. **Informace o podnikani** (jen host): companyName, businessId, city*, postalCode*, address*
4. **Pravni souhlasy** (vzdy): agreeTerms* (s linky na /terms a /privacy), agreeMarketing, confirmEquipment* (jen host)

> `*` = povinne pole

**Validacni schema (zod):**

Schema se dynamicky vytvari pres `createRegistrationSchema(t, role)`:
- Zakladni schema: jmeno, prijmeni, email, heslo, confirmPassword, agreeTerms
- Pro roli `host`: rozsireno o city, postalCode, address (vsechny povinne) a confirmEquipment (povinny boolean)
- Refine: `password === confirmPassword`

**Helper funkce pro renderovani:**
- `renderInput(name, label, type, placeholder, required)` — genericky textovy input
- `renderPasswordInput(name, label, show, setShow, placeholder)` — input s toggle Eye/EyeOff ikonou
- `renderCheckbox(name, label, required)` — checkbox s labelem

---

## 9. State management a data flow

### 9.1 Data flow diagram

```
Register (index.jsx)
  |
  |-- [currentLanguage] ----> LanguageToggle (zobrazuje, meni pres callback)
  |                     \---> localStorage('language') [ODDELENY od react-i18next]
  |
  |-- [currentStep] --------> ProgressSteps (zobrazuje vizualni stav)
  |                     \---> Podminene renderovani (step 1 / step 2)
  |
  |-- [selectedRole] -------> RoleSelectionCard.isSelected (vizualni highlight)
  |                     \---> handleNextStep (blokuje pokud prazdny)
  |                     \---> RegistrationForm.selectedRole (validace, dalsi pole, submit data)
  |
  RegistrationForm (vlastni state)
    |
    |-- react-hook-form ----- formData (rizen useForm hookem)
    |                    \--- errors (validacni chyby)
    |                    \--- isSubmitting (loading stav)
    |
    |-- Firebase Auth -------> createUserWithEmailAndPassword
    |-- Firestore -----------> setDoc(doc(db, "users", uid), userData)
    |-- useNavigate ---------> redirect na /host-dashboard nebo /customer-dashboard
```

### 9.2 Registracni submit flow

1. Uzivatel vyplni formular a klikne "Vytvorit ucet"
2. `react-hook-form` provede zod validaci
3. Pokud validace projde → `onSubmit(data)` se zavola
4. `createUserWithEmailAndPassword(auth, email, password)` — vytvori Firebase Auth ucet
5. Sestavi `userData` objekt (vcetne adresy pro host roli)
6. `setDoc(doc(db, "users", user.uid), userData)` — ulozi profil do Firestore
7. `navigate('/host-dashboard')` nebo `navigate('/customer-dashboard')`
8. Pri chybe: nastaveni error messages pres `setError()`

### 9.3 Firestore datova struktura (kolekce `users`)

```js
{
  uid: string,           // Firebase Auth UID
  firstName: string,
  lastName: string,
  email: string,
  phone: string,         // volitelne, default ''
  role: 'customer' | 'host',
  createdAt: Date,       // new Date() — POZOR: ne serverTimestamp()
  // jen pro host:
  companyName?: string,
  businessId?: string,
  address?: {
    city: string,
    postalCode: string,
    street: string,       // pozor: pole se jmenuje 'address' ve formulari ale 'street' v DB
  }
}
```

> **Poznamka:** `createdAt` pouziva `new Date()` (klientsky cas) misto `serverTimestamp()`. V produkcnim
> prostredi by se mel pouzit Firebase `serverTimestamp()` pro spolehlivy timestamp.

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
| city (host) | `min(1)` | "Mesto je povinne." |
| postalCode (host) | `min(1)` | "PSC je povinne." |
| address (host) | `min(1)` | "Adresa je povinna." |
| confirmEquipment (host) | refine (=== true) | "Musite potvrdit vlastnictvi zarizeni." |

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
| `index.jsx` | **ZADNY** | Vsechny texty hardcoded v anglictine |
| `RegistrationForm.jsx` | `react-i18next` | Plne prelozeno do CS |
| `RoleSelectionCard.jsx` | **ZADNY** | Texty prijaty pres props z index.jsx (anglicky) |
| `ProgressSteps.jsx` | **ZADNY** | Texty prijaty pres props z index.jsx (anglicky) |
| `LanguageToggle.jsx` | **ZADNY** | Jen labely "CZ"/"EN" (neprelozitelne) |

### 11.2 Hardcoded texty v index.jsx (anglicky)

```
- "Create Account"
- "Join the 3D printing platform"
- "Select Your Role"
- "How do you want to use the platform?"
- "Continue"
- "Registration Details"
- "Registering as Provider/Customer"
- "Back"
- Step titles: "Role", "Details", "Verify"
- Step descriptions: "Select role", "Personal info", "E-mail"
- Role titles: "Customer", "Provider"
- Role descriptions (cele vety v anglictine)
- Role benefits (4 polozky na roli, v anglictine)
```

### 11.3 react-i18next konfigurace

- Konfiguracni soubor: `src/i18n.js`
- Nactene jazyky: **pouze CS** (cesky)
- Fallback jazyk: `cs`
- EN preklady: **NEEXISTUJI** (zadny soubor `src/locales/en/translation.json`)

### 11.4 Kriticky problem: Dva nezavisle jazykove systemy

`index.jsx` pouziva vlastni `currentLanguage` state s `localStorage('language')` a `LanguageToggle`
komponentu pro vizualni prepinani. `RegistrationForm.jsx` pouziva `react-i18next` (`useTranslation()`).

**Dusledek:** Prepnuti jazyka pres `LanguageToggle` v hlavicce stranky zmeni `currentLanguage` state
a ulozi do localStorage, ale **NEZMENI** jazyk v `react-i18next`. Formular zustane vzdy v cestine
(fallback `cs`), bez ohledu na vybranou hodnotu v toggle.

> Projekt globalne pouziva `useLanguage()` z `LanguageContext.jsx` pro preklady na ostatnich strankach.
> Register stranka nepouziva ani jeden z techto globalnich systemu pro `index.jsx` texty.

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

## 17. Zname omezeni

### 17.1 Kriticke

1. **Dva nezavisle jazykove systemy**: `index.jsx` pouziva vlastni localStorage `language` +
   `LanguageToggle`, zatimco `RegistrationForm` pouziva `react-i18next`. Prepnuti jazyka v toggle
   neovlivni preklad formulare. Formular je vzdy v CS (protoze EN preklady neexistuji).

2. **Krok 3 (Verify) neexistuje**: Stepper zobrazuje 3 kroky, ale krok 3 neni implementovan.
   Po odeslani formulare v kroku 2 se rovnou naviguje. Zadna email verifikace.

3. **Hardcoded anglicke texty**: Vsechny texty v `index.jsx` (nadpisy, popisky, role, benefity,
   step titulky) jsou hardcoded v anglictine. Na ceske verzi webu to je nevhodne.

4. **Chybejici EN preklady**: `i18n.js` nactita pouze CS preklady. EN soubor neexistuje.
   Prepnuti na EN v `LanguageToggle` nema zadny efekt na `react-i18next`.

### 17.2 Stredni

5. **Firestore rollback chybi**: Pokud `setDoc` selze po uspesnem `createUserWithEmailAndPassword`,
   uzivatel ma Auth ucet bez profilu v databazi.

6. **`createdAt: new Date()`**: Pouziva klientsky cas misto Firebase `serverTimestamp()`.

7. **`totalSteps` prop nepouzit**: `ProgressSteps` prijima `totalSteps` ale nikde ho nepouziva.

8. **Zbytecny import**: `LanguageToggle.jsx` importuje `ForgeButton` ale nepouziva ho.

9. **Pristupnost RoleSelectionCard**: `<div onClick>` bez `role="button"`, `tabIndex={0}`,
   a `onKeyDown` handleru — karty nejsou pristupne klavesnici.

### 17.3 Nizke

10. **Inline rgba hodnoty**: Nekterazem hardcoded `rgba(0,212,170,...)` hodnoty, ktere maji
    ekvivalent v Forge tokenech (`--forge-accent-primary-subtle`, `--forge-accent-primary-ghost`).

11. **Navigace na neexistujici routes**: Po registraci naviguje na `/host-dashboard` nebo
    `/customer-dashboard` — tyto routes nejsou definovane v `Routes.jsx`, coz vede na 404/NotFound.

12. **Console.error s plnym error objektem**: `console.error("Firebase registration error:", error)`
    muze v produkci odhalit citlive informace.

---

*Posledni aktualizace: 2026-02-13*
*Autor: mp-mid-frontend-public (dokumentacni task)*
