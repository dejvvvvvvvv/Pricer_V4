# 181-AU — UPRAVY — Auth (Supabase Auth Migrace) — 2026-03-15

## Metadata
- **ID:** 181-AU
- **Session:** S01
- **Datum:** 2026-03-15
- **Oblast:** Auth (Supabase Auth Migrace)
- **Souvisejici ID:** 180-AU, 048-AU, 091-SB
- **Trigger:** Implementace Supabase Auth migrace podle planu `docs/claude/PLANS/supabase-auth-migration.md` — Faze 1-5

---

## Souhrn uprav

Kompletni implementace Supabase Auth migrace v 5 fazich: novy auth client, prepsany SupabaseAuthProvider (ze stubu na 216 radku), prepnuti providera, backend dual JWT validace (Supabase first + Firebase fallback), tenant ID z app_metadata, a GoogleSignInButton disabled stav pro Supabase mod. Celkem 1 novy soubor, 5 upravenych souboru.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/lib/supabase/authClient.js | Novy soubor | 1-30 | Separatni Supabase client pro auth bez accessToken callbacku |
| 2 | src/providers/SupabaseAuthProvider.jsx | Prepsano | 1-216 | Z 29-radkoveho stubu na plnou implementaci s 12 metodami |
| 3 | src/providers/index.jsx | Zmeneno | importy + branch | Pridana `supabase` branch do podminky, odkomentovan import |
| 4 | backend-local/src/middleware/auth.js | Zmeneno | middleware | Pridana verifySupabaseToken() + dual validace |
| 5 | backend-local/.env.example | Zmeneno | env vars | Pridan SUPABASE_JWT_SECRET placeholder |
| 6 | src/components/ui/GoogleSignInButton.jsx | Zmeneno | render | Detekce auth providera, disabled stav s tooltipem |

---

## Detailni zmeny

### 1. `src/lib/supabase/authClient.js`

**Typ:** Novy soubor
**Radky:** 1-30
**Duvod:** Hlavni `client.js` pouziva `accessToken` callback pro Firebase bridge, ktery blokuje `supabase.auth.*` metody. Auth potrebuje vlastni client bez tohoto callbacku.

**Co se zmenilo:**
- Novy Supabase client s `persistSession: true` a `autoRefreshToken: true`
- Bez `accessToken` callbacku — supabase.auth.signInWithPassword/signUp funguji spravne
- Export `supabaseAuth` pro pouziti v SupabaseAuthProvider
- Graceful null export pokud VITE_SUPABASE_URL/KEY chybi

---

### 2. `src/providers/SupabaseAuthProvider.jsx`

**Typ:** Prepsano (rewrite)
**Radky:** 1-216 (z puvodniho 29-radkoveho stubu)
**Duvod:** Stub provider mel jen placeholder — nyni plna implementace pro Supabase Auth

**Co se zmenilo:**
- **12 metod:** login, register, logout, getToken, refreshToken, resetPassword, updateProfile, changePassword, loginWithGoogle (throw placeholder)
- **mapSupabaseUser()** — mapovani Supabase user objektu na format AuthContextu (uid, email, displayName, role, tenantId z app_metadata)
- **onAuthStateChange** listener pro real-time auth state (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
- **window.__authGetToken / __authRefreshToken** — globalni funkce pro apiClient interceptory
- **Graceful degradation** pokud `supabaseAuth` je null (vrati loading=false, user=null)
- **Register:** po signUp nastavuje tenant_id v app_metadata na user.id
- **Pred:** 29-radkovy stub vracejici prazdny AuthContext
- **Po:** 216-radkova plna implementace se vsemi auth metodami

```jsx
// PRED (stub):
export default function SupabaseAuthProvider({ children }) {
  const value = { user: null, loading: false, /* ... placeholder */ };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PO (klicova cast):
const mapSupabaseUser = (supaUser) => ({
  uid: supaUser.id,
  email: supaUser.email,
  displayName: supaUser.user_metadata?.display_name || supaUser.email,
  role: supaUser.app_metadata?.role || 'user',
  tenantId: supaUser.app_metadata?.tenant_id || supaUser.id,
  // ...
});
```

---

### 3. `src/providers/index.jsx`

**Typ:** Zmeneno
**Radky:** importy + podminka
**Duvod:** Prepnuti na SupabaseAuthProvider kdyz VITE_AUTH_PROVIDER=supabase

**Co se zmenilo:**
- Odkomentovan import `SupabaseAuthProvider`
- Pridana `supabase` branch do podminky: `VITE_AUTH_PROVIDER === 'supabase' ? SupabaseAuthProvider : FirebaseAuthProvider`
- Pred: jen FirebaseAuthProvider
- Po: VITE_AUTH_PROVIDER ridi vyber providera

---

### 4. `backend-local/src/middleware/auth.js`

**Typ:** Zmeneno
**Radky:** middleware funkce
**Duvod:** Backend musi akceptovat JWT tokeny z obou provideru (Supabase i Firebase)

**Co se zmenilo:**
- **Nova funkce `verifySupabaseToken()`** — HS256 verifikace, kontrola `iss` contains 'supabase'
- **Dual validace:** Supabase first (synchronni, rychlejsi) -> Firebase fallback (async)
- Tenant ID cteni z `app_metadata.tenant_id` v Supabase JWT claims
- `jsonwebtoken` jiz byl v zavislostech (^9.0.3) — zadna nova instalace

---

### 5. `backend-local/.env.example`

**Typ:** Zmeneno
**Radky:** env vars
**Duvod:** Dokumentace nove env promenne pro Supabase JWT validaci

**Co se zmenilo:**
- Pridan `SUPABASE_JWT_SECRET=` placeholder s dokumentacnim komentarem
- Navod na ziskani JWT secret ze Supabase dashboardu

---

### 6. `src/components/ui/GoogleSignInButton.jsx`

**Typ:** Zmeneno
**Radky:** render logika
**Duvod:** Google OAuth neni zatim implementovano pro Supabase — tlacitko musi byt disabled

**Co se zmenilo:**
- Detekce auth providera z `import.meta.env.VITE_AUTH_PROVIDER`
- Pro Supabase mod: tlacitko disabled s opacity-50 a `cursor-not-allowed`
- Tooltip "Google sign-in will be available soon" pro Supabase mod
- Pro Firebase mod: beze zmeny

---

## Dopad zmen

- **Ovlivnene komponenty:** AuthContext, vsechny stranky pouzivajici useAuth(), backend middleware, apiClient interceptory
- **Breaking changes:** Ne — prepnuti je rizeno env promennou VITE_AUTH_PROVIDER (default zustava 'firebase')
- **Nove zavislosti:** Zadne (jsonwebtoken jiz existoval)
- **Rizika:** Google OAuth neni k dispozici pri VITE_AUTH_PROVIDER=supabase (planovano na pozdeji)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Build prochazi bez chyb, novy provider se aktivuje pouze s VITE_AUTH_PROVIDER=supabase
- **Poznamky:** Browser testovani login/register flow s Supabase providerem zatim neprovedeno (vyzaduje SUPABASE_JWT_SECRET v .env)

---
