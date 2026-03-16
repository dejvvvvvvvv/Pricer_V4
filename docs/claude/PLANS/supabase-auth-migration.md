# Plan: Migrace Firebase Auth → Supabase Auth

**Status:** READY TO IMPLEMENT
**Datum:** 2026-03-15

---

## Kontext

Uzivatel chce migrovat autentizaci z Firebase Auth na Supabase Auth.
- Google OAuth se zatim VYNECHAVA (bude reseno pozdeji)
- Migrace uzivatelu NENI potreba (jen 2 testovaci ucty, vytvorit znovu pres registraci)
- Architektura je uz provider-agnostic (AuthContext + ActiveAuthProvider prepinac)

## Klice (uz nastavene)

| Klic | Kde | Status |
|------|-----|--------|
| `VITE_SUPABASE_URL` | `Model_Pricer-V2-main/.env.local:9` | OK |
| `VITE_SUPABASE_ANON_KEY` | `Model_Pricer-V2-main/.env.local:10` | OK |
| `SUPABASE_SERVICE_ROLE_KEY` | `Model_Pricer-V2-main/.env.local:12` | OK |
| `SUPABASE_JWT_SECRET` | `Model_Pricer-V2-main/backend-local/.env:26` | OK |

## Existujici soubory (uz v projektu)

| Soubor | Popis |
|--------|-------|
| `src/context/AuthContext.jsx` | Provider-agnostic auth interface |
| `src/providers/FirebaseAuthProvider.jsx` | Aktualni implementace |
| `src/providers/SupabaseAuthProvider.jsx` | STUB — vsechny metody throwuji "not implemented" |
| `src/providers/index.jsx` | ActiveAuthProvider — prepinac dle `VITE_AUTH_PROVIDER` env |
| `src/lib/supabase/client.js` | Supabase client (uz inicializovany) |
| `backend-local/src/middleware/auth.js` | Firebase JWT validace (requireAuth) |
| `backend-local/src/middleware/tenant.js` | Tenant middleware (cte tenant_id z JWT) |

## Kroky implementace

### Faze 1: Frontend — SupabaseAuthProvider (HLAVNI)
Soubor: `src/providers/SupabaseAuthProvider.jsx`

Implementovat 8 metod:
1. `login(email, password)` → `supabase.auth.signInWithPassword()`
2. `loginWithGoogle()` → VYNECHAT (zatim throw "Google login bude dostupny pozdeji")
3. `register(email, password, name)` → `supabase.auth.signUp()` + ulozit profil do user_metadata
4. `logout()` → `supabase.auth.signOut()`
5. `getToken()` → `supabase.auth.getSession()` → session.access_token
6. `refreshToken()` → `supabase.auth.refreshSession()`
7. `resetPassword(email)` → `supabase.auth.resetPasswordForEmail()`
8. `updateProfile(data)` → `supabase.auth.updateUser()`

Plus:
- `onAuthStateChange` listener pro `currentUser` state
- `loading` state behem inicializace
- Mapovani Supabase user objektu na format ocekavany AuthContextem

### Faze 2: Frontend — Prepnuti providera
Soubor: `src/providers/index.jsx`
- Odkomentovat SupabaseAuthProvider import
- Pridat `supabase` branch do podmineky
- Nastavit `VITE_AUTH_PROVIDER=supabase` v `.env.local`

### Faze 3: Backend — Dual JWT validace
Soubor: `backend-local/src/middleware/auth.js`
- Pridat Supabase JWT validaci vedle Firebase
- Detekovat typ tokenu (Supabase JWT ma jiny format nez Firebase)
- Supabase: pouzit `jsonwebtoken` knihovnu s `SUPABASE_JWT_SECRET`
- Extrahovat `user_id`, `email`, `tenant_id` (z app_metadata nebo user_metadata)

### Faze 4: Backend — Tenant ID v Supabase
- Pri registraci/loginu nastavit `tenant_id` do Supabase user metadata
- Backend cte `tenant_id` z JWT claims (app_metadata.tenant_id)
- Alternativa: pouzit Supabase custom claims hook (postgres function)

### Faze 5: Login/Register UI update
- `src/pages/login/components/LoginForm.jsx` — skryt/disable Google Sign-In button (docasne)
- `src/pages/login/components/GoogleSignInButton.jsx` — pridat disabled state s tooltip "Pripravujeme"
- `src/pages/register/components/RegistrationForm.jsx` — overit ze funguje se Supabase

### Faze 6: Testovani
- Registrace noveho uctu
- Login/logout
- Reset hesla
- Token refresh
- Backend API volani s Supabase tokenem
- Tenant izolace funguje

## Dulezite poznamky
- Google OAuth VYNECHAT — bude reseno pozdeji
- Migrace uzivatelu NENI potreba — uzivatel vytvori ucty znovu
- `VITE_AUTH_PROVIDER` env promenna ridi ktery provider se pouzije
- Backend musi podporovat OBA typy tokenu behem prechodu (nebo se prepne najednou)
- Vsechny admin stranky pouzivaji `useAuth()` z AuthContext — nemeni se
- Vsechny API volani pouzivaji `apiClient` s auth interceptorem — nemeni se (jen token bude Supabase)

## Pouzij agenty
- Deleguj implementaci na agenty (mp-mid-frontend-public, mp-mid-backend-api)
- Max 3 agenty paralelne
- Po kazde fazi: build test
