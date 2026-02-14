# Firebase — Dokumentace

> Firebase hosting, Firestore rules a Cloud Functions konfigurace pro ModelPricer / Pricer V3.

---

## 1. Prehled

ModelPricer pouziva Firebase jako primarni cloudovou platformu pro:

- **Firebase Hosting** — staticke hostovani SPA (Vite build output)
- **Firebase Authentication** — email/password autentizace uzivatelu
- **Cloud Firestore** — NoSQL databaze pro uzivatelske profily a data
- **Firebase Storage** — ukladani souboru (3D modely, dokumenty)
- **Firebase Analytics** — volitelny tracking pouziti (pokud prohlizec podporuje)
- **Cloud Functions** — serverless funkce (aktualne 1: revokace tokenu)

Firebase projekt: `model-pricer` (viz `.firebaserc`).

---

## 2. Technologie

| Technologie | Verze | Ucel |
|-------------|-------|------|
| `firebase` (JS SDK) | ^12.7.0 | Klientsky SDK (Auth, Firestore, Storage, Analytics) |
| `firebase-admin` | ^12.6.0 | Admin SDK pro Cloud Functions (server-side) |
| `firebase-functions` | ^6.0.1 | Cloud Functions runtime |
| `firebase-functions-test` | ^3.1.0 | Testovaci framework pro Cloud Functions |
| Node.js (functions) | 22 | Runtime pro Cloud Functions |
| Firestore Rules | v2 | Bezpecnostni pravidla |

Frontend pouziva Vite s `import.meta.env` pro env promenne (prefix `VITE_`).

---

## 3. Architektura souboru

```
Model_Pricer-V2-main/
  .firebaserc                      # Projekt aliasy (default: model-pricer)
  firebase.json                    # Hlavni konfigurace (hosting + firestore + functions)
  firestore.rules                  # Bezpecnostni pravidla pro Firestore
  firestore.indexes.json           # Firestore indexy (aktualne prazdne)
  .env.local                       # Env promenne s Firebase credentials (NENI v gitu)
  .gitignore                       # Ignoruje .env* soubory

  src/
    firebase.js                    # Inicializace Firebase app + exporty (auth, db, storage, analytics)
    context/
      AuthContext.jsx              # React context pro auth stav (onAuthStateChanged + Firestore profil)
    hooks/
      useAuth.js                   # Alternativni hook pro auth stav (zjednoduseny, bez Firestore)
    components/ui/
      Header.jsx                   # Pouziva signOut z firebase/auth
    pages/
      login/
        index.jsx                  # signInWithEmailAndPassword
        components/
          LoginForm.jsx            # signInWithEmailAndPassword + cteni profilu z Firestore
      register/
        components/
          RegistrationForm.jsx     # createUserWithEmailAndPassword + zapis profilu do Firestore
      account/
        components/
          AccountOverviewCard.jsx  # sendEmailVerification + httpsCallable (revokeUserTokens)

  functions/
    index.js                       # Cloud Functions — revokeUserTokens (callable)
    .eslintrc.js                   # ESLint konfigurace pro functions (google style)
    package.json                   # Zavislosti pro Cloud Functions
```

---

## 8. Konfigurace — detailni popis kazdeho souboru

### 8.1 `.firebaserc`

Mapuje projekt aliasy na Firebase projekty.

- **default:** `model-pricer`
- **targets:** prazdne (zadne multi-site hosting targety)
- **etags:** prazdne

### 8.2 `firebase.json`

Hlavni konfiguracni soubor s tremi sekcemi:

**Hosting:**
- `public: "build"` — servrovana slozka je Vite build output (`build/`)
- `ignore` — vylucuje `firebase.json`, dotfiles (`.`), `node_modules`
- `rewrites` — vsechny URL (`**`) presmerovany na `/index.html` (SPA fallback pro React Router)

**Firestore:**
- `database: "(default)"` — pouziva defaultni Firestore databazi
- `location: "nam5"` — multi-region US (United States)
- `rules: "firestore.rules"` — cesta k bezpecnostnim pravidlum
- `indexes: "firestore.indexes.json"` — cesta k indexum (aktualne prazdne)

**Functions:**
- `source: "functions"` — zdrojova slozka
- `codebase: "default"` — identifikator codebase
- `ignore` — vylucuje node_modules, .git, debug logy, .local soubory
- `predeploy` — pred deployem spusti `npm run lint` v adresari functions

### 8.3 `firestore.rules`

Bezpecnostni pravidla pro Firestore (rules_version 2). Detailni rozbor viz sekce 14.

### 8.4 `firestore.indexes.json`

Prazdne — zadne vlastni slozene indexy. Firestore automaticky vytvari single-field indexy.

### 8.5 `src/firebase.js` — Inicializace klienta

Centralni entrypoint pro Firebase SDK na frontendu. Exportuje:

- **`auth`** — Firebase Auth instance s `browserLocalPersistence` (session prezije reload)
- **`db`** — Firestore instance
- **`storage`** — Firebase Storage instance
- **`analyticsPromise`** — lazy inicializace Analytics (pouze v prohlizeci, pokud je podporovano)

**Env promenne (povinne):**

| Promenna | Ucel |
|----------|------|
| `VITE_FIREBASE_API_KEY` | API klic projektu |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domena (typicky `model-pricer.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Project ID (`model-pricer`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | (volitelna) Google Analytics measurement ID |

Pokud chybi nektera povinna promenna, `firebase.js` vyhrodi `Error` s vysvetlenim.

Inicializace pouziva `getApps().length` guard — pokud jiz Firebase app existuje (napr. HMR), nepokusi se ji inicializovat znovu.

### 8.6 `src/context/AuthContext.jsx` — Auth Provider

React Context ktery:
1. Nasloucha `onAuthStateChanged` na Firebase Auth
2. Po prihlaseni dotahne uzivatelsky profil z Firestore kolekce `users/{uid}`
3. Slouci Firebase Auth objekt s Firestore profilem (`{ ...user, ...snap.data() }`)
4. Poskytuje `currentUser` a `loading` stav

Pouziti: obaluje celou aplikaci, pristupny pres `useAuth()` z `AuthContext.jsx`.

### 8.7 `src/hooks/useAuth.js` — Alternativni auth hook

Zjednoduseny hook ktery pouze nasloucha `onAuthStateChanged` **bez** cteni Firestore profilu. Vraci `{ user }`.

> Poznamka: V projektu existuji DVA `useAuth` — jeden v `context/AuthContext.jsx` (s Firestore profilem) a druhy v `hooks/useAuth.js` (bez). Importujici soubory pouzivaji oba (viz sekce 17 — Zname omezeni).

### 8.8 `functions/index.js` — Cloud Functions

Jedina Cloud Function: **`revokeUserTokens`** (callable).

- **Typ:** `https.onCall` (Firebase Callable Function)
- **Autentizace:** Vyzaduje `context.auth.uid` (prihlaseny uzivatel)
- **Autorizace:** Uzivatel muze revokovat pouze vlastni tokeny (`uid === context.auth.uid`)
- **Logika:** Vola `admin.auth().revokeRefreshTokens(uid)` — zneplatni vsechny refresh tokeny
- **Omezeni:** Existujici ID token zustava validni do expirace (~1 hodina)
- **Chyby:** Vraci `HttpsError` s kody `unauthenticated`, `permission-denied`, `internal`

### 8.9 `functions/.eslintrc.js`

ESLint konfigurace pro Cloud Functions:
- Zakladni: `eslint:recommended` + `google` (Google style)
- Pravidla: double quotes, prefer-arrow-callback, zakaz globalnich `name`/`length`
- Override pro `*.spec.*` soubory (Mocha prostredi)

### 8.10 `functions/package.json`

- **Node engine:** 22
- **Skripty:** lint, serve (emulatory), shell, deploy, logs
- **Prod deps:** firebase-admin ^12.6.0, firebase-functions ^6.0.1
- **Dev deps:** eslint ^8.15.0, eslint-config-google ^0.14.0, firebase-functions-test ^3.1.0

---

## 14. Bezpecnost (Firestore rules, hosting)

### 14.1 Firestore Security Rules

Aktualni pravidla (`firestore.rules`, rules_version 2):

**Kolekce `/users/{userId}`:**
- `create` — povolen pro prihlaseneho uzivatele (`request.auth != null`)
- `read` — povolen pro VSECHNY (`if true`) — verejne cteni uzivatelskych profilu
- `write` — povolen pouze vlastnikovi (`request.auth.uid == userId`)
- `delete` — povolen pouze vlastnikovi (`request.auth.uid == userId`)

**Vsechny ostatni kolekce (`/{document=**}`):**
- `read, write` — povoleny pro prihlaseneho uzivatele (`request.auth != null`)

### 14.2 Bezpecnostni poznamky k Firestore rules

| Problem | Severity | Popis |
|---------|----------|-------|
| Verejne cteni `/users` | P1 | Kdokoli (i neprihlaseny) muze cist profily vsech uzivatelu. V produkcnim prostredi by melo byt omezeno. |
| Siroky wildcard `/{document=**}` | P1 | Kazdy prihlaseny uzivatel muze cist A zapisovat do libovolne kolekce. Chybi tenant-level izolace. |
| Zadna validace dat | P2 | Rules nevaliduji strukturu zapisovanych dat (napr. povinne fieldy, typy). |
| Zadne rate limiting | P2 | Firestore rules nepodporuji rate limiting — nutno resit na urovni Cloud Functions nebo App Check. |

### 14.3 Hosting bezpecnost

- SPA rewrite (`** -> /index.html`) — standardni pattern, bezpecne
- Build output (`build/`) neobsahuje zdrojovy kod ani env promenne (Vite je inlinuje pouze do bundlu)
- `.env*` soubory jsou v `.gitignore` — nehroze commit credentials

### 14.4 Cloud Functions bezpecnost

- `revokeUserTokens` — spravne overuje autentizaci i autorizaci (uzivatel muze revokovat jen sebe)
- Admin SDK (`firebase-admin`) se inicializuje bez explicitnich credentials — pouziva ADC (Application Default Credentials) v Firebase prostredi

### 14.5 Klientska bezpecnost

- Firebase config (API klic atd.) je verejny — to je ocekavane (klient ho musi znat)
- Autentizace pouziva `browserLocalPersistence` — session prezije refresh, ale ne incognito/private okno
- `getApps()` guard brani duplicitni inicializaci pri HMR

---

## 15. Konfigurace

### 15.1 Lokalni vyvoj

1. Vytvorit `.env.local` v `Model_Pricer-V2-main/` s VITE_FIREBASE_* promenymi
2. `npm run dev` — Vite dev server na portu 4028

### 15.2 Firebase emulatory

```bash
cd functions
npm run serve   # firebase emulators:start --only functions
```

### 15.3 Deploy

```bash
# Hosting (frontend)
firebase deploy --only hosting

# Firestore rules
firebase deploy --only firestore:rules

# Cloud Functions
firebase deploy --only functions
# (spusti predeploy lint automaticky)

# Vse najednou
firebase deploy
```

### 15.4 Uzitecne prikazy

```bash
firebase functions:log          # Logy Cloud Functions
firebase functions:shell        # Interaktivni shell pro testovani functions
firebase hosting:channel:deploy preview   # Preview channel pro testovani
```

### 15.5 Firestore lokace

Databaze je v `nam5` (multi-region United States). Toto nelze zmenit po vytvoreni — migrace by vyzadovala novy projekt.

---

## 17. Zname omezeni

### 17.1 Duplicitni useAuth

V projektu existuji DVA `useAuth`:

| Soubor | Co dela |
|--------|---------|
| `src/context/AuthContext.jsx` | `useAuth()` — vraci `{ currentUser, loading }`, cteni profilu z Firestore |
| `src/hooks/useAuth.js` | `useAuth()` — vraci `{ user }`, pouze Firebase Auth stav |

Importujici komponenty musi byt opatrne s cestou importu. Hrozba: import spatneho `useAuth` zpusobi chybejici `loading` stav nebo chybejici Firestore profil.

### 17.2 Firestore rules — prilis siroky pristup

Wildcard pravidlo `/{document=**}` umoznuje kazdemu prihlasenenmu uzivateli cist a zapisovat do jakekoli kolekce. Pro multi-tenant architekturu je toto nedostatecne — data jednoho tenanta mohou byt ctena/menena jinym tenantem.

### 17.3 Verejne cteni uzivatelskych profilu

Pravidlo `allow read: if true` na kolekci `/users/{userId}` umoznuje cteni profilu bez autentizace. V produkci by melo byt omezeno minimalne na prihlasene uzivatele.

### 17.4 Jedina Cloud Function

Projekt ma pouze jednu Cloud Function (`revokeUserTokens`). Vsechna ostatni logika (pricing, slicer, objednavky) bezi bud na frontendu nebo v `backend-local` (Express). Cloud Functions nejsou vyuzity pro backend logiku.

### 17.5 Chybejici Firestore indexy

`firestore.indexes.json` je prazdny — zadne slozene indexy. Pokud budou pridany slozitejsi dotazy (napr. kde + orderBy na ruznych fieldech), budou indexy potreba.

### 17.6 Analytics zavislost na podpore prohlizece

`analyticsPromise` se inicializuje pouze pokud prohlizec podporuje Google Analytics (`isSupported()`). V prohlizecich s blokovacimi rozsirenimi (ad-blockery) nebude Analytics fungovat. Chybejici Analytics nema vliv na funkcionalitu aplikace.

### 17.7 Token expirace po revokaci

Po zavolani `revokeUserTokens` zustava existujici ID token validni az ~1 hodinu (standardni Firebase chovani). Okamzite odhlaseni by vyzadovalo implementaci server-side session validace.

### 17.8 Chybejici App Check

Projekt nepouziva Firebase App Check — API volani mohou prichazet z libovolneho klienta (ne jen z autorizovane aplikace). Pro produkci se doporucuje implementovat App Check.

### 17.9 Supabase paralelni migrace

Projekt soucasne migruje na Supabase (viz Phase 4 v MEMORY.md). Firebase a Supabase tak aktualne koexistuji — Firebase pro auth a hosting, Supabase pro strukturovana data a storage. Dlouhodobe je plan presunout vice logiky na Supabase.
