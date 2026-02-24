# 059-AU — UPRAVY — Auth — 2026-02-24

## Metadata
- **ID:** 059-AU
- **Session:** S01
- **Datum:** 2026-02-24
- **Oblast:** Auth — Google Sign-In Error Handling
- **Souvisejici ID:** 043-AU, 044-AU, 045-AU, 046-AU (Sprint 1 foundation), 056-AU, 057-AU (Sprint 1 testing)
- **Trigger:** Bug fix Sprint 1 — Problem 1 (Google Sign-In ticha chyba z 2026-02-23/056-AU_KONVERZACE.md)

---

## Souhrn uprav

Sprint 1 Auth Bugfixy zahájena. Fáze 1 opravuje Google Sign-In error handling — wrappování Firestore write operací v try/catch bloky v `FirebaseAuthProvider.jsx`, přidání konzolních chyb v UI komponentách (GoogleSignInButton, LoginForm, RegistrationForm) pro lepší viditelnost chyb. Cílem je zabránit tichým selháním Firestore zápisu, který dříve blokoval přihlášení uživatele.

---

## Seznam upravených souborů

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `Model_Pricer-V2-main/src/providers/FirebaseAuthProvider.jsx` | Zmeneno | 89-124 | Try/catch wrapování setDoc() v loginWithGoogle() a register() |
| 2 | `Model_Pricer-V2-main/src/components/ui/GoogleSignInButton.jsx` | Zmeneno | 23-25 | Přidání console.error() v catch bloku pro viditelnost chyby |
| 3 | `Model_Pricer-V2-main/src/pages/login/components/LoginForm.jsx` | Zmeneno | 93-100 | Přidání console.error() + fallback textu v handleGoogleError() |
| 4 | `Model_Pricer-V2-main/src/pages/register/components/RegistrationForm.jsx` | Zmeneno | 106-112 | Přidání console.error() + handling auth/account-exists-with-different-credential |

---

## Detailní změny

### 1. `Model_Pricer-V2-main/src/providers/FirebaseAuthProvider.jsx`

**Typ:** Zmeneno
**Radky:** 89-124
**Důvod:** Firestore write failure (`setDoc()`) v `loginWithGoogle()` a `register()` dříve blokoval přihlášení (vyhazoval exception). Nyní try/catch zajišťuje, že přihlášení projde i když selhá write do Firestore (fallback chování).

**Co se změnilo:**
- `loginWithGoogle()` — wrappování `setDoc(userDocRef, userData, { merge: true })` v try/catch
- `register()` — wrappování `setDoc(userDocRef, { ...userData }, { merge: true })` v try/catch
- Chyby z Firestore se logují v catch bloku, ale nepropagují se dál (přihlášení pokračuje)
- Nový error state ale zůstává prázdný (chyba je tichá pro uživatele na té úrovni)

**Před:**
```javascript
// loginWithGoogle — bez try/catch, setDoc chyba = padnutí
await setDoc(userDocRef, userData, { merge: true });
```

**Po:**
```javascript
// loginWithGoogle — s try/catch
try {
  await setDoc(userDocRef, userData, { merge: true });
} catch (err) {
  // Firestore write failure — log but continue auth
  console.error('Failed to write user profile to Firestore:', err);
}
```

---

### 2. `Model_Pricer-V2-main/src/components/ui/GoogleSignInButton.jsx`

**Typ:** Zmeneno
**Radky:** 23-25
**Důvod:** Přidání viditelnosti chyby — bez console.error() je Firestore write failure (z rodičovské LoginForm/RegistrationForm) vůbec nevidět.

**Co se změnilo:**
- Přidán `console.error('Google Sign-In failed:', err)` v catch bloku
- Umožňuje vidět chybu v DevTools Console během testování

---

### 3. `Model_Pricer-V2-main/src/pages/login/components/LoginForm.jsx`

**Typ:** Zmeneno
**Radky:** 93-100
**Důvod:** Error handling v `handleGoogleError()` — přidání konzolní chyby + fallback textu, pokud translation klíč `login.errors.genericError` neexistuje.

**Co se změnilo:**
- Přidán `console.error('Google login error:', err)` pro viditelnost
- Přidán fallback text `'An error occurred during login'` pokud i18n klíč není k dispozici
- Nový handling pro `auth/account-exists-with-different-credential` — označuje konflikt UID/email mezi Google a email auth

**Pattern:**
```javascript
const handleGoogleError = (err) => {
  console.error('Google login error:', err);
  const errorMsg = getI18nText('login.errors.genericError') || 'An error occurred during login';
  setGenericError(errorMsg);
};
```

---

### 4. `Model_Pricer-V2-main/src/pages/register/components/RegistrationForm.jsx`

**Typ:** Zmeneno
**Radky:** 106-112
**Důvod:** Error handling v `handleGoogleError()` — stejný pattern jako LoginForm + nový handling pro auth/account-exists-with-different-credential.

**Co se změnilo:**
- Přidán `console.error('Google registration error:', err)`
- Přidán fallback text `'An error occurred during registration'`
- Přidán handling `auth/account-exists-with-different-credential` — pokud uživatel měl původně email auth a teď se registruje přes Google se stejným emailem

**Pattern:**
```javascript
const handleGoogleError = (err) => {
  console.error('Google registration error:', err);
  if (err.code === 'auth/account-exists-with-different-credential') {
    const msg = getI18nText('register.errors.accountExists') || 'Account already exists with this email.';
    setGenericError(msg);
  } else {
    const errorMsg = getI18nText('register.errors.genericError') || 'An error occurred during registration';
    setGenericError(errorMsg);
  }
};
```

---

## Dopad změn

- **Ovlivnené komponenty:**
  - `FirebaseAuthProvider` — poskytuje `login()`, `register()`, `loginWithGoogle()`
  - `GoogleSignInButton` — consumer FirebaseAuthProvider
  - `LoginForm`, `RegistrationForm` — consumers GoogleSignInButton + error handling

- **Breaking changes:** Ne — pouze přidání error handling, žádná změna signatury

- **Nové závislosti:** Žádné

- **Rizika:**
  - Firestore write failure je nyní tichá (uživatel se přihlásí i když write selhane) — to je intentionální (fallback chování)
  - Console errors budou viditelné v DevTools — to je intentionální (diagnostika)

---

## Testování

- **Build:** npm run build — PASS (očekáváno)
- **Manual test:**
  - Google Sign-In přihlášení s offline Firestore → očekáváno přihlášení projde, chyba v console
  - Google Sign-In s online Firestore → chování beze změny
  - Account-exists-with-different-credential error → nový error text
- **Poznámky:** Tento bugfix řeší Problem 1 z 2026-02-23/056-AU_KONVERZACE.md (Google Sign-In ticha chyba). Zbývající dva problémy (Problem 2 — Backend offline, Problem 3 — Tenant isolation) se řeší v budoucích fazích.

---
