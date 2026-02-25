# Account Page — Dokumentace

> **Stranka:** `/account` (chranena pres `PrivateRoute`)
> **Hlavni soubor:** `src/pages/account/index.jsx` (~1376 radku)
> **Posledni aktualizace:** 2026-02-24 (Sprint 2 — plne funkcni ucet)

---

## 1. Prehled

Stranka "Nastaveni uctu" obsahuje 4 zalozky (taby):

| Tab | ID | Ikona | Stav (Sprint 2) |
|-----|----|-------|------------------|
| Profil | `profile` | User | FUNKCNI — real Firebase Auth data, validace, save pres updateProfile() |
| Firma | `company` | Building2 | FUNKCNI — tenant-scoped storage (company:v1), validace, Save/Cancel |
| Zabezpeceni | `security` | Shield | FUNKCNI — real changePassword() pres Firebase, Google-only detekce |
| Fakturace | `billing` | CreditCard | CASTECNE — cte plan z subscription:v1, empty states pro faktury/platby |

---

## 2. Architektura a zavislosti

### 2.1 Importy

```
react (useState, useEffect, useCallback, useMemo)
framer-motion (motion, AnimatePresence)
AppIcon (lucide ikony)
LanguageContext (useLanguage — CZ/EN)
AuthContext (useAuth — currentUser, updateProfile, changePassword)
NotificationContext (useNotification — showSuccess, showError)
adminCompanyStorage (readCompanyData, writeCompanyData)
adminTenantStorage (readTenantJson — pro subscription:v1)
```

### 2.2 Nove soubory (Sprint 2)

| Soubor | Ucel |
|--------|------|
| `src/contexts/NotificationContext.jsx` | NotificationProvider + useNotification hook |
| `src/components/ui/forge/ToastContainer.jsx` | Renderovani toast notifikaci z NotificationContext |
| `src/utils/adminCompanyStorage.js` | Tenant-scoped read/write pro company:v1 namespace |

### 2.3 Modifikovane soubory (Sprint 2)

| Soubor | Zmena |
|--------|-------|
| `src/App.jsx` | Obaleni `<NotificationProvider>` + `<ToastContainer />` |
| `src/providers/FirebaseAuthProvider.jsx` | Pridana metoda `changePassword(currentPassword, newPassword)` |

---

## 3. Design System

- **Forge inline styles** — zadny Tailwind, vsechny styly jsou JS objekty s CSS variables
- Karta: `forgeCardStyles` (bg-surface, border-default, radius-md)
- Input: `forgeInputStyles` / `forgeInputWithIconStyles` (bg-elevated, 40px vyska)
- Tlacitka: `forgePrimaryBtn` (accent-primary), `forgeOutlineBtn`, `forgeDangerOutlineBtn`, `forgeGhostBtn`
- Password strength: 4 urovne s Forge semantickymi barvami (`--forge-error`, `--forge-warning`, `--forge-info`, `--forge-success`)

---

## 4. Accessibility (ARIA)

Sprint 2 pridal kompletni ARIA atributy na tab navigaci:

```jsx
<div role="tablist" aria-label={t['account.title']}>
  <button
    role="tab"
    id="tab-{id}"
    aria-selected={isActive}
    aria-controls="tabpanel-{id}"
  />
</div>

<div
  role="tabpanel"
  id="tabpanel-{activeTab}"
  aria-labelledby="tab-{activeTab}"
  tabIndex={0}
/>
```

ToastContainer pouziva `aria-live="polite"` pro screen reader oznameni.

---

## 5. Performance optimalizace

- **FormInput** — extrahovan do module scope, obalen `React.memo`, ma `displayName`
- **Card** — extrahovan do module scope, obalen `React.memo`, ma `displayName`
- **Vyhoda:** obe komponenty se nere-renderuji pri zmene stavu rodice pokud se nemeni jejich props

---

## 6. Profil Tab (detail)

### 6.1 Datovy tok

1. `currentUser` z `useAuth()` — Firebase Auth objekt
2. `useEffect` synchronizuje `profileData` state z `currentUser` pri mountu/zmene
3. Uzivatel edituje lokalni `profileData` state
4. Pri "Ulozit zmeny" → `validateProfile()` → `updateProfile()` (async, Firebase)
5. Toast notifikace misto `alert()`

### 6.2 Pole

| Pole | Zdroj | Editovatelne | Validace |
|------|-------|-------------|----------|
| firstName | currentUser.firstName / displayName split | ANO | Povinne (nesmí byt prazdne) |
| lastName | currentUser.lastName / displayName split | ANO | Povinne (nesmí byt prazdne) |
| email | currentUser.email | NE (readOnly) | — (poznamka: "zmena pres Firebase konzoli") |
| phone | currentUser.phone | ANO | Volitelne, ale pokud vyplneno: regex `[+\d\s\-()]*` |

### 6.3 Validace

- `validateProfile()` — vraci objekt `{ field: errorMsg }` nebo prazdny objekt
- Per-field errory se zobrazuji pod inputem (cerveny text, 11px)
- Chyby se mazou pri zmene prislusneho pole

### 6.4 Tlacitka

- **Zrusit** — resetuje profileData na currentUser hodnoty, maze validationErrors
- **Ulozit zmeny** — async, loading spinner, disabled behem ukladani

### 6.5 Opravene bugy (Sprint 1 → Sprint 2)

- **FIXED:** Mock data nahrazena realnym Firebase Auth obsahem
- **FIXED:** `alert()` notifikace nahrazeny toast systemem
- **FIXED:** Chybejici validace — nyni povinne jmeno/prijmeni + phone format

---

## 7. Firma Tab (detail)

### 7.1 Datovy tok

1. `readCompanyData()` pri inicializaci state (useState s lazy init)
2. Uzivatel edituje lokalni `companyData` state
3. Pri "Ulozit zmeny" → `validateCompany()` → `writeCompanyData()` (sync, localStorage)
4. Toast notifikace

### 7.2 Storage

- **Namespace:** `company:v1`
- **Helper:** `src/utils/adminCompanyStorage.js`
- **Klic:** `modelpricer:${tenantId}:company:v1`
- **Default shape:**
  ```json
  {
    "companyName": "",
    "ico": "",
    "dic": "",
    "address": "",
    "city": "",
    "zip": "",
    "country": "CZ"
  }
  ```

### 7.3 Pole a validace

| Pole | Validace |
|------|----------|
| companyName | Volitelne, ale pokud vyplneno min 2 znaky |
| ico (ICO) | Volitelne, ale pokud vyplneno presne 8 cislic (`/^\d{8}$/`) |
| dic (DIC) | Volitelne, ale pokud vyplneno 2 velka pismena + 8-10 cislic (`/^[A-Z]{2}\d{8,10}$/`) |
| address | Bez validace |
| city | Bez validace |
| zip (PSC) | Volitelne, ale pokud vyplneno format `110 00` nebo `11000` (`/^\d{3}\s?\d{2}$/`) |
| country | Select: CZ, SK, PL, DE, AT |

### 7.4 Rozlozeni

Dva sloupce (Card grid):
- **Zakladni udaje** — companyName, ICO/DIC (grid 2 col)
- **Adresa** — address, city/zip (grid 2 col), country (select)
- Tlacitka Save/Cancel na plnou sirku pod kartami

### 7.5 Tlacitka

- **Zrusit** — `handleCancelCompany()` — znovu nacte data z localStorage pres `readCompanyData()`
- **Ulozit zmeny** — `handleSaveCompany()` — validuje, zapise, toast

---

## 8. Zabezpeceni Tab (detail)

### 8.1 Zmena hesla

**Google-only ucty:**
- Detekce pres `currentUser?.authProvider === 'google'`
- Zobrazi info box (modry, Info ikona) s vysvetlenim ze heslo spravuje Google
- Formular zmeny hesla se NEZOBRAZUJE

**Email/password ucty:**
- 3 pole: soucasne heslo, nove heslo, potvrzeni noveho hesla
- Password strength indicator (animovany progress bar):
  - Slabe (25%) — `--forge-error` (cervena)
  - Stredni (50%) — `--forge-warning` (oranzova)
  - Dobre (75%) — `--forge-info` (modra)
  - Silne (100%) — `--forge-success` (zelena)
- **Minimalni pozadovana sila:** >= "Dobre" (75%), jinak validacni chyba

### 8.2 Validace hesla

- `currentPassword` — povinne
- `newPassword` — povinne, sila >= Good (8+ znaku, velke pismeno, cislo nebo specialni znak)
- `confirmPassword` — povinne, musi se shodovat s newPassword
- Per-field errory pod kazdym inputem

### 8.3 Firebase error handling

`handleChangePassword()` mapuje Firebase error kody na srozumitelne zpravy:

| Firebase kod | CZ zprava |
|-------------|-----------|
| `auth/wrong-password`, `auth/invalid-credential` | Spatne aktualni heslo |
| `auth/weak-password` | Heslo je prilis slabe |
| `auth/requires-recent-login` | Prihlaste se znovu a zkuste to znovu |
| `auth/too-many-requests` | Prilis mnoho pokusu. Zkuste to pozdeji |
| (ostatni) | Nepodarilo se zmenit heslo / err.message |

### 8.4 Backend implementace

V `FirebaseAuthProvider.jsx`:
```js
const changePassword = async (currentPassword, newPassword) => {
  // 1. Re-authenticate pres EmailAuthProvider.credential
  await reauthenticateWithCredential(auth.currentUser, credential);
  // 2. Update password
  await updatePassword(auth.currentUser, newPassword);
};
```

### 8.5 Dalsi sekce zabezpeceni

- **2FA (Dvoufaktorove overeni)** — placeholder karta s "Zapnout 2FA" tlacitkem (zatim nefunkcni)
- **Aktivni relace** — placeholder karta s hardcoded "Windows PC - Chrome" (zatim nefunkcni)

---

## 9. Fakturace Tab (detail)

### 9.1 Datovy tok

- Cte `subscription:v1` z tenant storage pres `readTenantJson('subscription:v1')`
- Fallback na defaults: `{ plan: 'starter', status: 'active', priceMonthly: null, currency: 'CZK' }`

### 9.2 Plan konfigurace

```
Starter:      499 Kc / $20 / 18 EUR  za mesic
Professional: 1 999 Kc / $80 / 74 EUR za mesic
Enterprise:   Na miru / Custom
```

- Aktualni tarif se zobrazi v highlighted kartach s badge "AKTIVNI"
- Enterprise plan bez ceny zobrazi "Na miru" / "Custom"
- Cena se bere z `subscriptionData.priceMonthly` (pokud existuje) nebo z planConfig

### 9.3 Placeholdery (zatim nefunkcni)

- **Platebni metody** — empty state s ikonou + "Pridat platebni metodu" dashed button
- **Historie faktur** — empty state s ikonou + "Zatim zadne faktury"
- **Zmenit tarif / Zrusit predplatne** — tlacitka existuji, ale nemaji handler

---

## 10. Notification System

### 10.1 NotificationContext (`src/contexts/NotificationContext.jsx`)

- Provider: `NotificationProvider` — obaluje celou aplikaci v `App.jsx`
- Hook: `useNotification()` — vraci: `showSuccess`, `showError`, `showWarning`, `showInfo`, `dismiss`, `dismissAll`, `toasts`
- Auto-dismiss durations: success=4s, error=8s, warning=6s, info=5s
- Max 5 viditelnych toastu soucasne (FIFO — nejstarsi se zahodi)
- Counter pres `useRef` pro unikatni ID

### 10.2 ToastContainer (`src/components/ui/forge/ToastContainer.jsx`)

- Fixed position: top-right, z-index 9999, max-width 420px
- Animace: framer-motion (slide-in zprava, fade out)
- Renderuje `ForgeToast` komponentu pro kazdy toast
- `aria-live="polite"` pro pristupnost

### 10.3 Integrace

```jsx
// App.jsx
<NotificationProvider>
  <Routes />
  <ToastContainer />
</NotificationProvider>
```

Vsechny puvodni `alert()` volani na Account strance jsou nahrazeny `showSuccess(title, msg)` / `showError(title, msg)`.

---

## 11. Komponenta AccountOverviewCard

**Soubor:** `src/pages/account/components/AccountOverviewCard.jsx`

- Zobrazuje avatar (fotka nebo inicialka), jmeno, email, verifikacni badge
- Quick actions: "Upravit profil" (link), "Zmenit heslo" (link), "Odhlasit na vsech zarizenich" (button)
- Email verifikace: pokud neoveren → tlacitko "Poslat overovaci e-mail"
- Revoke sessions: vola Firebase Cloud Function `revokeUserTokens`
- Pouziva primo `auth.currentUser` z Firebase (ne useAuth hook) — skeleton state kdyz neni user

**Poznamka:** Tato komponenta je samostatna a NENI soucasti hlavniho tab systemu. Pouziva se jako overview karta (napr. na dashboardu).

---

## 12. Internacionalizace (i18n)

- Vsechny texty pres lokalni `t` objekt s klici `{sekce}.{pole}`
- Jazyk z `useLanguage()` hoooku — `cs` / `en`
- Validacni hlasky jsou lokalizovane (CZ i EN)
- Firebase error hlasky jsou lokalizovane
- Toast title + message jsou lokalizovane
- Celkem ~50 prekladovych klicu (radky 587-642)

---

## 13. Routing

- **Route:** `/account` (v `Routes.jsx`)
- **Ochrana:** `PrivateRoute` — vyzaduje prihlaseni
- **Export:** `export default AccountPage`
- **Hash navigace:** `AccountOverviewCard` odkazuje na `#profile` a `#security` (ale hlavni stranka zatim nereaguje na URL hash)

---

## 14. Zname omezeni a TODO

| Oblast | Popis | Priorita |
|--------|-------|----------|
| Fakturace — platebni metody | Jen placeholder, zadna integrace | P2 |
| Fakturace — historie faktur | Jen empty state | P2 |
| Fakturace — zmena tarifu | Tlacitko bez handleru | P2 |
| 2FA | Placeholder karta, nefunkcni | P2 |
| Aktivni relace | Hardcoded "Windows PC - Chrome" | P2 |
| Avatar upload | Tlacitko kamery existuje, ale nema handler | P3 |
| URL hash navigace | AccountOverviewCard odkazuje na #profile/#security ale hlavni stranka nereaguje | P3 |
| Company data — Supabase | Zatim jen localStorage, chybi fire-and-forget Supabase write | P2 |

---

## 15. Soubory a cesty

| Soubor | Radku | Ucel |
|--------|-------|------|
| `src/pages/account/index.jsx` | ~1376 | Hlavni stranka (4 taby) |
| `src/pages/account/components/AccountOverviewCard.jsx` | ~298 | Overview karta s avatarem |
| `src/contexts/NotificationContext.jsx` | ~115 | Toast notification provider |
| `src/components/ui/forge/ToastContainer.jsx` | ~57 | Toast renderer |
| `src/utils/adminCompanyStorage.js` | ~49 | Company tenant storage helper |
| `src/providers/FirebaseAuthProvider.jsx` | (zmena) | Pridana metoda changePassword |
| `src/App.jsx` | (zmena) | NotificationProvider wrapper |

---

## 16. Sprint historie

### Sprint 1 (Auth — 2026-02-22)
- Zakladni layout s 4 taby (profile, company, security, billing)
- Mock data v profilu
- Placeholder zmena hesla (alert notifikace)
- Billing s hardcoded daty

### Sprint 2 (Account — 2026-02-24)
- **Profile:** Real Firebase Auth data, validace, updateProfile(), toast notifikace
- **Company:** Tenant-scoped storage (company:v1), validace (ICO/DIC/PSC), Save/Cancel
- **Security:** Real changePassword() pres Firebase (reauth + updatePassword), Google-only detekce, password strength >= Good, per-field errors, Firebase error code handling
- **Billing:** Cte plan z subscription:v1, planConfig (Starter/Professional/Enterprise s cenami), empty states
- **Notification system:** NotificationContext + ToastContainer misto alert()
- **Accessibility:** ARIA roles (tablist, tab, tabpanel, aria-selected)
- **Performance:** FormInput a Card extrahovany do module scope s React.memo
