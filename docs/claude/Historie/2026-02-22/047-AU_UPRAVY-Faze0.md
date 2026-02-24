# 047-AU — UPRAVY — Auth Sprint 1 Faze 0 (Priprava a Setup) — 2026-02-22

## Metadata
- **ID:** 047-AU
- **Session:** S01
- **Datum:** 2026-02-22
- **Oblast:** Auth — Sprint 1 Faze 0
- **Souvisejici ID:** 043-AU, 044-AU, 045-AU, 046-AU, 048-AU, 049-AU, 050-AU, 051-AU
- **Trigger:** Implementace planu Sprint 1 Auth Foundation (docs/claude/Research/Auth/04-Implementation-Plan.md)

---

## Souhrn uprav

Faze 0 pripravila prostredi pro implementaci auth systemu: vytvoreni adresarovych struktur
(`src/providers/`, `docs/claude/Research/Auth/Sprint1/`), instalace firebase-admin do backend
package.json, overeni existence backend middleware adresare a overeni Firebase frontend
konfigurace v `src/firebase.js`.

Zadne zmeny v aplikacni logice — ista priprava prostredku pro Faze 1-4.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | `src/providers/` | Novy adresar | Adresar pro auth providery — FirebaseAuthProvider, SupabaseAuthProvider, index.jsx |
| 2 | `docs/claude/Research/Auth/Sprint1/` | Novy adresar | Vystupni slozka pro testovaci reporty a screenshoty z kazde faze Sprint 1 |
| 3 | `backend-local/src/middleware/` | Overeni existence | Overeno — adresar existuje a obsahuje auth.js + tenant.js |
| 4 | `backend-local/package.json` | Zmeneno | Pridana zavislost `firebase-admin: ^13.6.1` |

---

## Detailni zmeny

### 1. `src/providers/` (NOVY ADRESAR)

**Typ:** Novy adresar (pripraveny pro Faze 1-2)
**Absolutni cesta:** `Model_Pricer-V2-main/src/providers/`
**Duvod:** Provider-agnostic auth architektura — FirebaseAuthProvider a SupabaseAuthProvider
budou v tomto adresari. Smer architektury: AuthContext je jen createContext, implementace
je separovana do provideru.

**Soubory vytvorene v ramci Sprint 1 (Faze 1-2) v tomto adresari:**

| Soubor | Pocet radku | Ucel |
|--------|-------------|------|
| `FirebaseAuthProvider.jsx` | 188 radku | Firebase implementace auth kontraktu (login, register, Google, getToken, ...) |
| `SupabaseAuthProvider.jsx` | 29 radku | Stub pro budouci Supabase implementaci — vsechny metody throwuji |
| `index.jsx` | 18 radku | Aktivni provider switch podle `VITE_AUTH_PROVIDER` env promenne |

**Klic z `index.jsx` (provider switch logika):**
```jsx
export function ActiveAuthProvider({ children }) {
  const provider = import.meta.env.VITE_AUTH_PROVIDER || 'firebase';

  if (provider === 'firebase') {
    return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
  }

  // Future: uncomment when Supabase auth is implemented
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}
```
- Default: `firebase` (kdyz VITE_AUTH_PROVIDER neni nastaven)
- Supabase vetev zakomentovana — bude aktivovana ve Sprint 4

**FirebaseAuthProvider exportovane metody (kontrakt AuthContext):**
- `currentUser` — stav (null nebo Firebase User + Firestore data merged)
- `loading` — boolean pro spinner
- `error` — posledni auth chyba
- `login(email, password)` — signInWithEmailAndPassword
- `loginWithGoogle()` — signInWithPopup + prvni-login Firestore profil
- `register(email, password, metadata)` — createUserWithEmailAndPassword + Firestore profil
- `logout()` — signOut
- `getToken()` — auth.currentUser.getIdToken()
- `refreshToken()` — auth.currentUser.getIdToken(true)
- `resetPassword(email)` — sendPasswordResetEmail
- `updateProfile(data)` — Firebase Auth + Firestore merge

**Poznamka k window.__auth:** FirebaseAuthProvider take expozuje `window.__authGetToken` a
`window.__authRefreshToken` pro apiClient interceptory (reseni circular dependency —
apiClient nema primy import FirebaseAuthProvider).

---

### 2. `docs/claude/Research/Auth/Sprint1/` (NOVY ADRESAR)

**Typ:** Novy adresar
**Absolutni cesta v git root:** `Model_Pricer-V2-main/docs/claude/Research/Auth/Sprint1/`
**Stav overeni:** Adresar EXISTUJE (`docs/claude/Research/Auth/` existuje, `Sprint1/` uvnitr)
**Duvod:** Cilova slozka pro vystup z funkcnich testu kazde faze Sprint 1:
- Screenshoty z Chrome MCP (login flow, register, Google Sign-In, private routes)
- Testovaci reporty per-faze
- Playwright test output (kdyz bude implementovano)

**Aktualni stav:** Prazdny adresar — testy NEBYLY provedeny v ramci Sprint 1
(viz Problem sekce v 046-AU — kriticka vada: testovani bylo vynechano).

---

### 3. `backend-local/src/middleware/` (OVERENI EXISTENCE)

**Typ:** Overeni — ZMENENO (v ramci Faze 2-3 Sprint 1, ne Faze 0)
**Absolutni cesta:** `Model_Pricer-V2-main/backend-local/src/middleware/`
**Stav overeni:** Adresar EXISTUJE a obsahuje:
- `auth.js` — requireAuth + optionalAuth middleware
- `tenant.js` — requireTenant middleware

**Obsah `auth.js` (klic funkce):**
```javascript
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      errorCode: 'AUTH_MISSING_TOKEN',
      message: 'Missing auth token',
    });
  }
  const token = authHeader.split('Bearer ')[1];
  const decoded = await adminAuth.verifyIdToken(token);
  req.user = decoded; // { uid, email, name, picture, ... }
  next();
}
```
- Exportuje: `requireAuth` (striktni), `optionalAuth` (mekky — req.user = null kdyz neni token)
- Pouziva `adminAuth` z `../firebaseAdmin.js`

**Obsah `tenant.js` (klic funkce):**
```javascript
export function requireTenant(req, res, next) {
  const tenantFromToken = req.user?.tenant_id || req.user?.tenantId;
  const tenantFromHeader = String(req.headers['x-tenant-id'] || '').trim();
  const tenantId = tenantFromToken || tenantFromHeader;
  req.tenantId = tenantId || 'demo-tenant'; // fallback pro dev
  next();
}
```
- Primarne cte `tenant_id` z JWT custom claims (nastavi se v Firebase Admin pri pristup-kontrole)
- Fallback: header `x-tenant-id` (zpetna kompatibilita pri prechodu)
- Dev fallback: `'demo-tenant'` kdyz neni zadny tenant

---

### 4. `backend-local/package.json` (ZMENENO)

**Typ:** Upraveno — pridana zavislost
**Absolutni cesta:** `Model_Pricer-V2-main/backend-local/package.json`

**Pred zmenou (dependencies sekce):**
```json
{
  "archiver": "^7.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "multer": "^1.4.5-lts.1",
  "nanoid": "^5.0.7"
}
```

**Po zmene (aktualni stav — overeno ctenim souboru):**
```json
{
  "archiver": "^7.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "firebase-admin": "^13.6.1",
  "multer": "^1.4.5-lts.1",
  "nanoid": "^5.0.7"
}
```

**Pridano:** `"firebase-admin": "^13.6.1"`

**Proc firebase-admin:**
- Frontend pouziva Firebase JS SDK (klientska strana)
- Backend MUSI pouzivat firebase-admin (serverova strana) pro verifikaci JWT tokenu
- `adminAuth.verifyIdToken(token)` — kryptograficky overuje ze token byl vydany Firebase pro
  tento projekt (ne jen "decoduje" JWT, ale overuje podpis vuci Firebase verejnym klicum)
- Nema pristup k user heslu — jen verifikace tokenu

**Pouziti firebase-admin v projektu (`backend-local/src/firebaseAdmin.js`):**
```javascript
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Produkce: pouzij service account JSON
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else if (projectId) {
    // Dev: jen project ID (staci pro verifyIdToken)
    admin.initializeApp({ projectId });
  } else {
    // Fallback: init bez konfigu — middleware bude zamitat vsechny tokeny
    console.warn('[firebaseAdmin] No GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID set...');
    admin.initializeApp();
  }
}

export const adminAuth = admin.auth();
export default admin;
```

**Pozadovane ENV promenne po teto zmene:**
- Dev: `FIREBASE_PROJECT_ID` v `backend-local/.env` (nebo `VITE_FIREBASE_PROJECT_ID`)
- Produkce: `GOOGLE_APPLICATION_CREDENTIALS` pointing na service account JSON soubor

---

## Firebase frontend konfigurace (overeni)

**Soubor:** `src/firebase.js`

**Overeno — exportuje:**
- `auth` — Firebase Auth instance (`getAuth(app)` + `browserLocalPersistence`)
- `db` — Firestore instance (`getFirestore(app)`)
- `storage` — Firebase Storage instance (`getStorage(app)`)
- `analyticsPromise` — lazy analytics (browser-only, graceful fallback)

**Validace ENV promennych pri startu:**
```javascript
const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];
const missing = required.filter((k) => !env[k]);
if (missing.length) {
  throw new Error(`[Firebase] Missing env vars: ${missing.join(", ")}`);
}
```
- Pokud chybi jakakoli z 6 povinnych promennych — app okamzite vyhodi Error (fail-fast)
- `VITE_FIREBASE_MEASUREMENT_ID` je volitelna (Analytics)

**Persistence:** `browserLocalPersistence` — uzivatel zustava prihlaseny po zavreni browseru.

---

## Dopad zmen

- **Ovlivnene komponenty:** Zadne — Faze 0 je ista prava pripravna faze
- **Breaking changes:** Ne
- **Nove zavislosti:** `firebase-admin: ^13.6.1` v `backend-local/`
- **Novy frontend dep:** Zadny (firebase-admin je pouze backend)
- **Vyzadovane ENV zmeny:**
  - Backend: `FIREBASE_PROJECT_ID` v `backend-local/.env` (pro dev)
  - Backend: `GOOGLE_APPLICATION_CREDENTIALS` (pro produkci — az bude nasazeno)
- **Rizika:** Zadna — jen adresarova struktura a backend zavislost

---

## Testovani

- **Frontend build:** PASS (npm run build — verifikace v ramci celeho Sprint 1, 46 sekund)
- **Backend npm install:** Spusten pro instalaci `firebase-admin` do `backend-local/node_modules/`
- **Smoke test Faze 0:** N/A — pripravna faze, zadna funkcionalita ke testovani
- **Integracni testy:** NEBYLY provedeny (otevreny ukol z 046-AU)

---

## Poznamky

- `docs/claude/Research/Auth/Sprint1/` adresar existuje jen v `Model_Pricer-V2-main/` podstrome
  git repa — ne v git rootu `Model_Pricer-V2-main_VariantaA_A_to_F_Integrated/docs/claude/Research/`
  (kde je jen `Historie/`). Overeno: spravna umisteni je v repu.
- Firebase Admin verze `^13.6.1` je major-semver 13 — dusledkem je pouziti ESM importu
  (`import admin from 'firebase-admin'`), coz je konzistentni s `"type": "module"` v
  `backend-local/package.json`.
- `src/context/AuthContext.jsx` existoval pred Fazi 0 — refaktorovano v ramci Faze 1
  na "jen createContext + useAuth hook" (12 radku). Viz 044-AU_UPRAVY.md pro detaily.
