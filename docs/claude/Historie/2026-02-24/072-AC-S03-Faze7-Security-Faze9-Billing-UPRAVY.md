# UPRAVY — Sprint 2 Fáze 7+9 (Security & Billing)

**ID:** 048-AC
**Datum:** 2026-02-24
**Session:** S03
**Oblast:** Account (Security, Billing)
**Titulek:** Sprint 2 Fáze 7 (Security Tab s changePassword) + Fáze 9 (Billing Tab s i18n+a11y)

---

## Popis

Sprint 2 finalizace:
- **Fáze 7:** Security tab s Firebase reauthentication a changePassword funkcí (Google-only detekce, error mapping)
- **Fáze 9:** Billing tab napojený na tenant storage (subscription:v1), planConfig s cenami, ARIA opravy, nové překlady, React.memo extraction

Build PASS (43s).

---

## Soubory a změny

### 1. `src/providers/FirebaseAuthProvider.jsx`

**Řádky:** 9-11, 222-232, 246

**Změny:**
- Importy: `EmailAuthProvider`, `reauthenticateWithCredential`, `updatePassword` (Firebase Auth)
- Nová funkce `changePassword(currentPassword, newPassword)` — reauthentikace EmailAuthProvider, updatePassword
- Přidáno do context value (po stopLoading, startLoading, logout)
- Error mapping (auth/wrong-password, auth/invalid-credential, auth/weak-password, auth/requires-recent-login, auth/too-many-requests)

**Důvod:** Umožnit uživateli změnu hesla na Security tahu; reautentikace nutná pro Firebase bezpečnostní politiku.

---

### 2. `src/pages/account/index.jsx`

**Řádky:** Mnohá místa (Security tab, Billing tab, extract na module scope)

**Změny:**

#### Security Tab:
- `changePassword` z `useAuth()`
- Stavy: `passwordSaving`, `passwordErrors` (objekt s currentPassword/newPassword/confirmPassword)
- Async handler `handleChangePassword` — validace sil hesla (>= 75%), shoda confirmPassword, Firebase error mapping, toast feedback
- Google-only detekce: `authProvider === 'google' → info karta` (bez input fieldu)
- Per-field validace: `currentPassword` required, `newPassword` sila >=75%, `confirmPassword` match
- Firebase error mapování na uživatelské texty

#### Billing Tab:
- `subscriptionData` z `readTenantJson('subscription:v1')` (lazy init)
- `planConfig`: Starter 499Kč/$20, Professional 1999Kč/$80, Enterprise custom
- Dynamické zobrazení: plan name, price, bila/annual toggle (stub)
- Fake invoices a payment methods → empty states s texty
- Nové překlady: `billing.plan.active`, `billing.plan.custom`, `billing.payment.none`, `billing.history.none`

#### ARIA Opravy:
- `role="tablist"` na container
- `role="tab"` + `aria-selected` na tab tlačítka
- `role="tabpanel"` + `aria-labelledby` na obsahy

#### React.memo Extraction:
- `FormInput` komponenta na module scope (React.memo)
- `Card` a `cardVariants` na module scope (React.memo)

**Důvod:** Kompletní implementace Account stranky s realnou funkcionalitou; ARIA standardy; optimalizace React renderu.

---

### 3. `src/utils/adminCompanyStorage.js` (z Fáze 5)

**Řádky:** 1-35

**Změny:**
- Nový soubor: tenant storage helper pro namespace `company:v1`
- Funkce: `getDefaultCompanyData()`, `readCompanyData()`, `writeCompanyData()`
- Volání: `getTenantId()`, `readTenantJson()`, `writeTenantJson()`

**Důvod:** Tenant-scoped storage pro Company tab data; následuje storage patterns.

---

### 4. `src/contexts/NotificationContext.jsx` (z Fáze 1)

**Řádky:** 1-80

**Změny:**
- Nový soubor: Context pro toast notifikace
- Hook: `useNotification()` — vrací `{ show: (message, type, duration) => void }`
- Provider: `NotificationProvider` wrapper

**Důvod:** Toast feedback pro akce (save, error); není část Account page, ale globální systém.

---

### 5. `src/components/ui/forge/ToastContainer.jsx` (z Fáze 1)

**Řádky:** 1-60

**Změny:**
- Nový soubor: Toast renderer s Framer Motion AnimatePresence
- Zobrazuje toasty z NotificationContext
- CSS: pozicování top-right, fade-in/out animace

**Důvod:** Globální toast UI; není součástí Account page.

---

### 6. `src/App.jsx` (z Fáze 1)

**Řádky:** Importy + render

**Změny:**
- Import `NotificationProvider`, `ToastContainer`
- Wrap aplikace: `<NotificationProvider><App><ToastContainer /></...>`

**Důvod:** Integrační bod pro toast systém.

---

## Shrnutý seznam

- [x] FirebaseAuthProvider — changePassword funkce + error mapping
- [x] Account page — Security tab s formem a validací
- [x] Account page — Billing tab s tenantStorage napojením
- [x] Account page — ARIA opravy (role, aria-selected, aria-labelledby)
- [x] Account page — React.memo extraction (FormInput, Card)
- [x] Account page — Nové překlady (billing.*)
- [x] adminCompanyStorage — tenant storage helper
- [x] NotificationContext — Toast system
- [x] ToastContainer — Toast renderer
- [x] App.jsx — NotificationProvider + ToastContainer integraci
- [x] Build PASS

---

## Poznámky

- **Google-only detekce:** Funguje díky `firebaseAuthProvider` z LanguageContext (plní se z Firebase config, jinak='email')
- **Reauthentikace:** Firebase vyžaduje při updatePassword — EmailAuthProvider konstruktor nebere jen heslo, ale full credential objekt
- **Password sila:** >=75% Score z zxcvbn (pokud potřeba silnější, zvýšit threshold)
- **Tenant storage:** `subscription:v1` zatím fake data (null), připraveno na budoucí Supabase migraci
- **Toast:** Globální systém, není jen pro Account page — použije se i jinde
- **Dokumentace:** AccountPage-Dokumentace.md aktualizován (viz docs/claude/Documentation/)

---

## Rizika / Follow-up

- **P0:** Build musí projít
- **P1:** CSS Toast na mobilech (overflow, z-index)
- **Follow-up:** Dashboard bez Supabase zatím není, subscription:v1 je dummy
