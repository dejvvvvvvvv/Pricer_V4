# 048-AU — UPRAVY — Auth Sprint 1 Faze 1 (Auth Foundation) — 2026-02-22

## Metadata
- **ID:** 048-AU
- **Session:** S01
- **Datum:** 2026-02-22
- **Oblast:** Auth — Sprint 1 Faze 1 (Auth Foundation)
- **Souvisejici ID:** 043-AU, 044-AU, 045-AU, 047-AU, 049-AU, 050-AU, 051-AU
- **Trigger:** Implementace planu Sprint 1 — kroky 1.1 az 1.6

---

## Souhrn uprav

Faze 1 "Auth Foundation" vytvorila kompletni zaklad provider-agnosticke auth architektury pro ModelPricer.

Klicove architekturni rozhodnuti: AuthContext byl zredukovan na ciste abstraktni kontrakt (createContext +
useAuth hook, 11 radku). Veskera Firebase logika byla presunuta do samostatneho FirebaseAuthProvider
(189 radku). Vzor umoznuje budouci migraci na SupabaseAuthProvider bez zmeny konzumentskych komponent.

Provider-switching je resen pres `providers/index.jsx` ktery cte `VITE_AUTH_PROVIDER` env promennou a
vraci prislusny provider. Duplicitni `src/hooks/useAuth.js` byl smazan. Header.jsx byl prepojen na
`useAuth()` z AuthContext (misto primy Firebase imports).

---

## Seznam upravenych souboru

| Soubor | Operace | Radky | Popis zmeny |
|--------|---------|-------|-------------|
| `src/context/AuthContext.jsx` | UPRAVEN (prepsan) | 11 | Odstranen Firebase, jen createContext + useAuth hook |
| `src/providers/FirebaseAuthProvider.jsx` | VYTVORENY | 189 | Vsechny auth funkce (login, Google, register, logout, token, profile) |
| `src/providers/SupabaseAuthProvider.jsx` | VYTVORENY | 30 | Stub pro budouci implementaci Sprint 4 |
| `src/providers/index.jsx` | VYTVORENY | 19 | Provider switch pres VITE_AUTH_PROVIDER env |
| `src/index.jsx` | UPRAVEN | 19 | Import `ActiveAuthProvider` misto stareho `AuthProvider` |
| `src/components/ui/Header.jsx` | UPRAVEN | 462 | `useAuth()` misto primo Firebase signOut, destrukturace `{ currentUser, logout }` |
| `src/hooks/useAuth.js` | SMAZAN | — | Duplicitni hook — smazan, konsolidovan do AuthContext.jsx |

---

## Detailni zmeny

### 1. `src/context/AuthContext.jsx` — PRED / PO

**PRED (puvodni stav, ~41 radku):**
- Obsahoval Firebase imports (`onAuthStateChanged`, `signInWithEmailAndPassword`, atd.)
- Definoval `AuthContext`, `AuthProvider` komponentu s veskera logiku
- Exportoval `useAuth()` hook
- Spravoval `currentUser` state, `loading` state
- Obsahoval Firebase-specificke volani primo v kontextu

**PO (novy stav, 11 radku):**
```jsx
import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export default AuthContext;
```

- Zadne Firebase imports
- Zadny state, zadne side effects
- Pouze `createContext(null)` + `useAuth()` hook s error guardem
- Default export: `AuthContext` (pro providers)
- Named export: `useAuth` (pro konzumenty)

---

### 2. `src/providers/FirebaseAuthProvider.jsx` — NOVY SOUBOR (189 radku)

**Imports (radky 1-14):**
- React: `useState`, `useEffect`, `useCallback`, `useRef`
- Firebase Auth: `onAuthStateChanged`, `signInWithEmailAndPassword`, `signInWithPopup`, `GoogleAuthProvider`, `createUserWithEmailAndPassword`, `signOut`, `sendPasswordResetEmail`, `updateProfile as firebaseUpdateProfile`
- Firebase Firestore: `doc`, `getDoc`, `setDoc`
- Lokalni: `auth`, `db` z `../firebase`
- Lokalni: `AuthContext` z `../context/AuthContext`

**State (radky 19-22):**
- `currentUser` — aktualni uzivatel (null = neprihlaseny)
- `loading` — true dokud Firebase nenacte auth stav
- `error` — posledni chyba
- `mountedRef` — useRef pro memory leak prevenci

**useEffect 1 — onAuthStateChanged listener (radky 24-52):**
- Spousti `onAuthStateChanged(auth, callback)`
- Pri prihlaseni: nacte Firestore profil z kolekce `users/{uid}`, mergnuje s Firebase user objektem
- `mountedRef.current` check pred `setCurrentUser` (prevence memory leak)
- Cleanup: `mountedRef.current = false` + `unsubscribe()`

**useEffect 2 — window token helpers (radky 55-73):**
- Vystavuje `window.__authGetToken` a `window.__authRefreshToken` pro `apiClient.js` interceptory
- Reseni circular dependency: apiClient nemuze importovat AuthContext primo
- Cleanup: `delete window.__authGetToken` + `delete window.__authRefreshToken`

**Implementovane auth funkce (vsechny `useCallback`):**

| Funkce | Radky | Popis |
|--------|-------|-------|
| `login(email, password)` | 75-79 | `signInWithEmailAndPassword`, vraci `credential.user` |
| `loginWithGoogle()` | 81-101 | `signInWithPopup` s `GoogleAuthProvider`, auto-vytvoreni Firestore profilu pro noveho Google uzivatele |
| `register(email, password, metadata)` | 103-124 | `createUserWithEmailAndPassword`, volitelny `displayName` update, vytvoreni Firestore profilu s `firstName`, `lastName`, `authProvider: 'email'` |
| `logout()` | 126-129 | `signOut(auth)`, explicitne `setCurrentUser(null)` |
| `getToken()` | 131-136 | `auth.currentUser.getIdToken()` — bez force refresh |
| `refreshToken()` | 138-143 | `auth.currentUser.getIdToken(true)` — s force refresh |
| `resetPassword(email)` | 145-147 | `sendPasswordResetEmail(auth, email)` |
| `updateProfile(data)` | 149-171 | Aktualizuje Firebase Auth profile (displayName, photoURL) + Firestore dokument (`merge: true`), refreshuje lokalni `currentUser` state |

**Context value objekt (radky 173-185):**
```
{ currentUser, loading, error, login, loginWithGoogle, register,
  logout, getToken, refreshToken, resetPassword, updateProfile }
```

**Render (radek 187-188):**
```jsx
return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
```

**Architekturalni vzory:**
- Vsechny async funkce jsou `useCallback` (stabilni reference, zadne zbytecne re-rendery)
- `mountedRef` pattern pro bezpecne async operace
- `window.__auth*` bridges pro token passing bez circular deps
- Firestore profil se lazy-vytvori pri prvnim Google loginu (idempotentni check `snap?.exists()`)
- `photoURL` se neuklada do Firestore (jen Firebase Auth) — komentovano v kodu

---

### 3. `src/providers/SupabaseAuthProvider.jsx` — NOVY SOUBOR (30 radku)

**Ucel:** Stub/placeholder pro Sprint 4 (Supabase auth migrace).

**Vzor:** Implementuje stejny kontrakt jako `FirebaseAuthProvider`.

**Implementace:**
- `notImplemented(name)` — factory funkce vracejici closure ktera haze `Error('Supabase auth not implemented yet: ${name}')`
- Vsechny funkce (`login`, `loginWithGoogle`, `register`, `logout`, `getToken`, `refreshToken`, `resetPassword`, `updateProfile`) = `notImplemented(...)`
- `currentUser: null`, `loading: false`, `error: new Error('Supabase auth not implemented yet')`
- Render: `<AuthContext.Provider value={value}>{children}</AuthContext.Provider>`

---

### 4. `src/providers/index.jsx` — NOVY SOUBOR (19 radku)

**Ucel:** Provider switching na zaklade env promenne.

**Logika:**
```jsx
export function ActiveAuthProvider({ children }) {
  const provider = import.meta.env.VITE_AUTH_PROVIDER || 'firebase';

  if (provider === 'firebase') {
    return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
  }

  // Supabase vetev zakomentovana (Sprint 4):
  // if (provider === 'supabase') { ... }

  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>; // fallback
}
```

**Imports:**
- `FirebaseAuthProvider` — aktivni (named import)
- `SupabaseAuthProvider` — zakomentovany (pripraven pro Sprint 4)

**Dulezita past:** Soubor je `.jsx` (ne `.js`) — Vite esbuild neparsuje JSX v `.js` souborech. Tato past je zdokumentovana v MEMORY.md.

---

### 5. `src/index.jsx` — UPRAVEN (19 radku)

**Zmena importu:**
- PRED: `import { AuthProvider } from './context/AuthContext';` (nebo podobne)
- PO: `import { ActiveAuthProvider } from './providers';`

**Render tree:**
```jsx
root.render(
  <LanguageProvider>
    <ActiveAuthProvider>
      <App />
    </ActiveAuthProvider>
  </LanguageProvider>
);
```

Ostatni importy nezmeneny: `i18n`, `React`, `createRoot`, `App`, `tailwind.css`, `index.css`, `LanguageProvider`.

---

### 6. `src/components/ui/Header.jsx` — UPRAVEN (462 radku)

**Klicova zmena — auth import a pouziti (radky 6, 20):**

PRED:
```jsx
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
// ... v handleSignOut:
await signOut(auth);
```

PO:
```jsx
import { useAuth } from '../../context/AuthContext';
// ... v komponent:
const { currentUser, logout } = useAuth();
// ... v handleSignOut:
await logout();
```

**handleSignOut funkce (radky 75-82):**
```jsx
async function handleSignOut() {
  try {
    await logout();
    window.location.href = '/login';
  } catch (e) {
    console.error('Sign out failed:', e);
  }
}
```

**isLoggedIn (radek 84):**
```jsx
const isLoggedIn = !!currentUser;
```

Zbytek Header.jsx (navigation, mobile drawer, language switcher, user menu dropdown, Logo komponenta)
nebyl menen — pouze auth-relevantni cast.

---

### 7. `src/hooks/useAuth.js` — SMAZAN

**Overeno:** Soubor neexistuje (Glob vraci prazdny vysledek).

**Duvod smazani:** Duplicitni definice `useAuth()` hooku. Po prepisu `AuthContext.jsx` je hook
definovan primo tam (named export `useAuth`). Duplicita by mohla zpusobit: import confusion,
ruzne instance contextua, nekonzistentni chovani.

---

## Dopad zmen

### Ovlivnene komponenty (konzumenti useAuth)
Vsechny komponenty ktere pouzivaji `useAuth()` jsou automaticky kompatibilni — kontrakt (shape value objektu)
zustavil stejny. Zadne breaking changes v API.

Hlavni konzumenti `useAuth()`:
- `src/components/ui/Header.jsx` — upraveno primo v teto fazi
- `src/pages/admin/*` — vsechny admin stranky (skrze PrivateRoute)
- `src/pages/login/` — login stranka
- `src/pages/register/` — register stranka
- `src/pages/account/` — account stranka

### Breaking changes v importech
- **SMAZANO:** `src/hooks/useAuth.js` — pokud nekdo importoval z teto cesty, dostal by build error.
  Spravna cesta: `import { useAuth } from '@/context/AuthContext'` nebo `'../../context/AuthContext'`.
- **SMAZANO:** `AuthProvider` pojmenovany export z AuthContext — nahrazen `ActiveAuthProvider` z providers/index.jsx.
  Jedine pouziti bylo v `src/index.jsx` — opraveno.

### Nove zavislosti
- Zadne nove npm balicky — Firebase SDK byl jiz nainstalovan.
- `src/providers/` — nova slozka s 3 soubory.

### Env promenne
- `VITE_AUTH_PROVIDER` — nova env promenna. Pokud neni nastavena, fallback na `'firebase'`.
  Hodnoty: `'firebase'` (aktivni) | `'supabase'` (Sprint 4, stub).

---

## Testovani

- **Build:** PASS (po oprave `.js` -> `.jsx` pro `providers/index.jsx` v Fazi 4 — Vite esbuild chyba)
- **Dev server:** Spusten bez chyb
- **Login flow:** Firebase email/password login funguje pres novy FirebaseAuthProvider
- **Google Sign-In:** loginWithGoogle() funguje, Firestore profil se vytvori pri prvnim prihlaseni
- **Logout:** Header.jsx `handleSignOut()` vola `logout()` z useAuth, redirect na `/login`
- **PrivateRoute:** `/account` a `/admin/*` spravne chrani pres `currentUser` check
- **useAuth error guard:** `throw new Error('useAuth must be used within <AuthProvider>')` funguje kdyz hook pouzit mimo provider tree

---

## Poznamky a pasti

1. **`.jsx` extension pro providers/index.jsx** — Vite esbuild neparsuje JSX v `.js` souborech.
   Soubor MUSI byt `.jsx`. Tato past byla objevena pri Fazi 4 a je zdokumentovana v MEMORY.md.

2. **`window.__authGetToken` / `window.__authRefreshToken`** — Nestandartni vzor ale nutny pro
   `src/lib/apiClient.js` interceptory bez circular dependency. FirebaseAuthProvider je jediny
   kdo tyto properties nastavuje a cistuje (cleanup v useEffect return).

3. **`mountedRef` v FirebaseAuthProvider** — Nutny pro prevenci "Can't perform a React state update
   on an unmounted component" pri async Firestore operacich. Pattern pouzit i v `useStorageMutation`
   (zdokumentovano v MEMORY.md jako obecna pasta).

4. **Firestore profil merge** — `updateProfile` pouziva `setDoc(..., { merge: true })` takze
   neprepisuje cela existujici data, jen merguje zmenena pole.

5. **`photoURL` pouze v Firebase Auth** — Pri `updateProfile` se `photoURL` aktualizuje jen
   v Firebase Auth, ne v Firestore. Komentovano primo v kodu (`delete firestoreData.photoURL`).
