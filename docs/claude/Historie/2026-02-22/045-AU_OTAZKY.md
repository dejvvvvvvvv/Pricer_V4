# 045-AU — OTAZKY A ODPOVEDI — Auth Implementation — 2026-02-22

## Metadata
- **ID:** 045-AU
- **Session:** S01
- **Datum:** 2026-02-22
- **Oblast:** Auth/Autentizace — Sprint 1 Auth Foundation
- **Souvisejici ID:** 043-AU (KONVERZACE), 044-AU (UPRAVY), 046-AU (DENNI-PREHLED)

---

## Kontext

Implementace Sprint 1 Auth Foundation byla zacinajici faze autentizacniho systemu. Pred samotnou implementaci Claude klada 5 kritickych otazek na uzivateIe aby objasnilo design decisions. Nasledujici Q&A zachycuje tyto rozhodnuti a jejich dopad na architektura.

---

## Otazky a odpovedi

### Q1: Email vs. Phone registrace

- **Ptal se:** Claude
- **Otazka:** Mame podporovat registraci pres email, telefon, nebo obe? Telefon je slozitejsi (SMS verification, international formatting), email je jednoduche a standard.
- **Odpoved:** Uzivatel — Email pouze. Phone neni potreba na teto fazi.
- **Rozhodnuti:** Registrace a login pouzivaji jen email. Telefon je vyrazen z scope.
- **Dopad:** RegistrationForm schema je jednoduchy (email + password), bez tel fields. Backend nema SMS verification.

---

### Q2: Redirect po loginu

- **Ptal se:** Claude
- **Otazka:** Po uspesnem loginu, kam by se uzivatel mel presmerovat? `/admin` (vychozi admin dashboard), `/account` (user profil), nebo puvodne pozadovana stranka?
- **Odpoved:** Uzivatel — Presmerovat na `/admin`. Fallback na puvodni stranku pokud byla ulozena.
- **Rozhodnuti:** Login form → /admin redirect. PrivateRoute zachovava puvodniURL v localStorage jako fallback.
- **Dopad:** PrivateRoute ma redirect logiku, LoginForm volá navigate("/admin").

---

### Q3: Role-based registrace a login

- **Ptal se:** Claude
- **Otazka:** Mel by login/register mít role selection (customer vs. host vs. admin)? Nebo by role byla spravovana v admin panelu jako separate proces?
- **Odpoved:** Uzivatel — Smazat role selection. Kdo se zaregistruje, je automaticky "customer". Role muze upravit jen admin v AdminTeam stranke.
- **Rozhodnuti:** Registrace nemá role selector. Role je vychozi "customer" a delas se pres AdminTeam.
- **Dopad:** RoleSelectionCard komponenta SMAZANA. RegistrationForm je jednoduchy (bez role fields).

---

### Q4: Google Sign-In (OAuth)

- **Ptal se:** Claude
- **Otazka:** Mel by login mít Google Sign-In tlacitko? Firebase podporuje signInWithPopup. Je to dulezite?
- **Odpoved:** Uzivatel — ANO, pridat Google Sign-In. Lidé to cekaji.
- **Rozhodnuti:** Pridat GoogleSignInButton komponenta na login i register stranky.
- **Dopad:** 85 radku GoogleSignInButton komponenty vytvoreno. LoginForm ma "nebo" divider a Google button.

---

### Q5: Duplicitni useAuth hook

- **Ptal se:** Claude
- **Otazka:** V codebase existuje `src/hooks/useAuth.js` - to je stara verze, nikam se neimportuje. Smazat?
- **Odpoved:** Uzivatel — ANO, smazat. Stara zbytecna verze.
- **Rozhodnuti:** Smazat `src/hooks/useAuth.js`.
- **Dopad:** `useAuth()` je nyni jen z AuthContext (jeden zdroj pravdy).

---

### Q6: Auth provider architektura

- **Ptal se:** Claude
- **Otazka:** AuthContext by mel byt provider-agnostic (Firebase, Supabase, Auth0, ...) pro budouci flexibility. Jak to nejlepe udelat?
- **Odpoved:** Uzivatel — Vytvorit provider-agnostic AuthContext (jen interface), implementace v `src/providers/Firebase|Supabase|...AuthProvider.jsx`. Vybir provideru pres env promenna.
- **Rozhodnuti:** ActiveAuthProvider switch v `src/providers/index.jsx` dle VITE_AUTH_PROVIDER env. FirebaseAuthProvider implementuje Firebase specifika.
- **Dopad:** 3 nove soubory: FirebaseAuthProvider, SupabaseAuthProvider (stub), providers/index.jsx. AuthContext je jen interface.

---

### Q7: Backend middleware a token management

- **Ptal se:** Claude
- **Otazka:** Backend potrebuje verifyIdToken (ovelit Firebase tokeny) a tenant isolation. Jak best practice?
- **Odpoved:** Uzivatel — Vytvorit middleware: `requireAuth` (verifyIdToken, 401), `optionalAuth` (best-effort), `requireTenant` (tenant_id z JWT claims nebo header).
- **Rozhodnuti:** Tri middleware v `backend-local/src/middleware/`. applicovany na /api/* routes.
- **Dopad:** 50 radku auth.js + 22 radku tenant.js. Backend index.js aplikuje middleware.

---

### Q8: Window token helpers pro apiClient

- **Ptal se:** Claude
- **Otazka:** ApiClient potrebuje pristup k tokenu a refresh logice. Firebase AuthProvider ma tyto funkce. Jak je sdelit?
- **Odpoved:** Uzivatel — Nastavit `window.__authGetToken()` a `window.__authRefreshToken()` z FirebaseAuthProvider. ApiClient je pouzije v interceptorech.
- **Rozhodnuti:** FirebaseAuthProvider nastavi window helpers. ApiClient je vyuziva.
- **Dopad:** ApiClient Request interceptor cte `window.__authGetToken()`. Response interceptor vola `window.__authRefreshToken()` na 401.

---

### Q9: Firestore vs. Realtime Database

- **Ptal se:** Claude (pri implementaci)
- **Otazka:** Kde skladovat user profily — Firestore nebo Realtime Database?
- **Odpoved:** Uzivatel — Firestore (lepsi pro questo, skala, bezpecnost).
- **Rozhodnuti:** FirebaseAuthProvider cte user profily z Firestore (kolekce "users", dokument "uid").
- **Dopad:** ~20 radku v FirebaseAuthProvider: getDoc(doc(db, "users", uid)).

---

### Q10: Token refresh interval

- **Ptal se:** Claude (pri implementaci)
- **Otazka:** Jak casto refreshovat Firebase IDToken? Kazdy request? Kazdy interval?
- **Odpoved:** Uzivatel — Kazych 45 minut (Firebase IDToken vyhezi za ~1h, 45min je bezpecna marze).
- **Rozhodnuti:** FirebaseAuthProvider nastavi setInterval(() => { firebaseAuth.currentUser.getIdToken(true) }, 45*60*1000).
- **Dopad:** ~10 radku kodu, cleanup v cleanup handleru.

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnuti | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | Registracni kanal | Email pouze | Email + Phone | Q1 |
| 2 | Post-login redirect | /admin (s fallback) | /account, /customer-dashboard | Q2 |
| 3 | Role management | Automaticky "customer", sprava v AdminTeam | Role selector v registraci | Q3 |
| 4 | OAuth integration | Google Sign-In pridat | Bez OAuth, jen email/pass | Q4 |
| 5 | Duplicitni hook | Smazat useAuth.js | Zachovat (zbytecne) | Q5 |
| 6 | Provider architektura | Provider-agnostic (Firebase/Supabase/...) | Jen Firebase hardcoded | Q6 |
| 7 | Backend middleware | requireAuth + optionalAuth + requireTenant | Zedna middleware | Q7 |
| 8 | Token access | window.__authGetToken/Refresh | Jiny mechanismus | Q8 |
| 9 | Profil storage | Firestore | Realtime DB | Q9 |
| 10 | Token refresh | Kazych 45 minut | Na request, na 24h, zadny | Q10 |

---

## Nerozhodnute otazky

- [ ] Je potreba testovat Google Sign-In v Chrome MCP (mock signup flow)?
- [ ] Mel by se vytvorit Jest/Vitest testy pro FirebaseAuthProvider?
- [ ] Mel by se vytvorit E2E test v Playwright/Cypress?
- [ ] Jak se ma handleovat "remember me" checkbox na login?
- [ ] Jaky je plan pro password reset flow (forgot password)?

---

<!-- KONEC SABLONY -->
