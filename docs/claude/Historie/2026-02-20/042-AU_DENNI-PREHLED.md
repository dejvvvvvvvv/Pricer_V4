# Denni Prehled — Auth Research Complete (042-AU)

**Datum:** 2026-02-20
**Session:** S02 (continuation of auth research session)
**Typ:** DENNI-PREHLED (daily overview)
**Autori:** Claude Haiku 4.5 + Agents (mp-spec-infra-auth-research, mp-mid-infra-auth-arch, mp-mid-security-auth)
**Status:** COMPLETE — Vsechny 4 faze Auth Research dokonceny

---

## Souhrn

Byla dokoncena komplexni multifazova autentizacni studie pro ModelPricer V3. Vytvoreny 4 klicove dokumenty (celkem ~1 483 radku) pokryvajici:

1. **Account Section Research** — analyza 15+ SaaS + 3D print platform
2. **Architektura PrivateRoute** — provider-agnostic design, React Router v6 pattern
3. **Security Checklist** — top 20 auth chyb s severity rating
4. **Implementation Plan** — 4-sprint detailni roadmap (11 souboru + 8 modifikaci)

---

## Faze 1: Account Section Pages Research

**Soubor:** `docs/claude/Research/Auth/01-Account-Section-Pages.md` (~320 radku)

**Obsah:**
- Analyza 15+ SaaS platform (Stripe, GitHub, Linear, Slack atd.)
- Analyza 3 3D print platform (Shapeways, Sculpteo, Xometry)
- Zjisteni: Standardizovana 4-tab struktura
  - **Profile:** Jmeno, email, avatar, jazyk, theme, timezone
  - **Company:** Nazev, adresa, IČ/DIČ, kontakt
  - **Security:** Heslo, 2FA, sessions, aktivity log
  - **Billing:** Platebni metoda, invoices, subscriptions

**Prioritizace:**
- **P0:** Profile (email, heslo, avatar)
- **P1:** Security (2FA, sessions), Billing (Stripe integrace)
- **P2:** Company data, Language/Theme preference

**Konkluze:** Nase 4-tab struktura je optimalnim standardem.

---

## Faze 2: PrivateRoute & Auth Architecture Research

**Soubor:** `docs/claude/Research/Auth/02-PrivateRoutes-Auth-Architecture.md` (~350 radku)

**Obsah:**

### Provider-Agnostic Architecture
```
AuthContext (Firebase impl)
    ↓
    └─ Sync API: getCurrentUser(), getToken(), ...
    └─ Async API: register(), login(), logout(), refreshToken(), ...
    └─ Type: TypeScript interfaces (User, AuthError, AuthState)
```

### React Router v6 Pattern
```
<PrivateRoute>
    <Outlet context={{ user, token }} />
</PrivateRoute>
```

### Backend Middleware
```
POST /api/auth/validate-token
→ JWT verify → extractTenantId → req.tenant = tenantId
→ Downstream endpoints maji req.tenant (tenant isolation)
```

### Token Management
- **BETA:** localStorage (CSP headers mitigation)
- **POST-BETA:** IndexedDB pro tokens
- **Refresh:** Auto-refresh pred expiraci (5 minut before exp)
- **Sign-out:** Token smazani z client + backend revoke

**Klicove rozhodnuti:**
- Firebase pro BETA, abstrakce pro future Supabase
- Jedna user role (bez customer/host diferenciace)
- Tenant isolation na backend skrz token claims

---

## Faze 3: Security Mistakes Checklist

**Soubor:** `docs/claude/Research/Auth/03-Security-Mistakes-Checklist.md` (~286 radku)

**Top 20 Chyb:**

| # | Chyba | Severity | Nase Riziko | Mitigation |
|---|-------|----------|------------|-----------|
| 1 | Token v URL | CRITICAL | HIGH | Vzdy request body/header |
| 2 | No CSRF token | CRITICAL | MEDIUM | SameSite cookie + CSRF header |
| 3 | Weak password rules | HIGH | MEDIUM | Min 12 chars, special chars |
| 4 | No rate limiting | CRITICAL | HIGH | Backend rate limit (10 req/min/IP) |
| 5 | Logging user data | CRITICAL | HIGH | Hashed pwd logs, no PII v logs |
| 6 | Multi-tab sync missing | HIGH | MEDIUM | Storage event listener sync |
| 7 | No session invalidation | MEDIUM | LOW | Logout invaliduje na backend |
| 8 | CORS too permissive | HIGH | MEDIUM | Domain whitelist + credentials: include |
| 9 | SQLi possibility | CRITICAL | LOW | Parameterized queries |
| 10 | Token expiry too long | MEDIUM | MEDIUM | 1h access + 7d refresh |

**4 CRITICAL Issues v nasem codebase:**
- `test-kalkulacka` pouziva hardcoded tenant ID (neni auth)
- `AdminPricing` ma admin-scoped localStorage bez validation
- `LanguageContext` nema CSRF protection
- Widget builder ma open widget whitelist (soucasne feature flag — OK pro BETA)

**Supabase-specifika:**
- RLS policies MUSI odpovedat tenant ID
- JWT custom claims (app_metadata.tenant_id)
- Storage bucket policies per tenant

**Code Review Checklist:**
- [ ] Bezne zadny token v URL
- [ ] CSRF token na change-password/email forms
- [ ] Hesla minimalne 12 znaku + special chars
- [ ] Rate limiting na /api/auth/* (10 req/min/IP)
- [ ] Logout invaliduje JWT na backend
- [ ] Multi-tab sync pres storage event listener
- [ ] Error messages nejsou leaky (ne "user not found" vs "wrong password")
- [ ] Tokens refreshovany automaticky
- [ ] 2FA recovery codes ulozeny securely
- [ ] Audit log pro sensitive actions (password change, 2FA disable, email change)
- [ ] CORS domain whitelist (ne "*")
- [ ] Session invalidation na settings change
- [ ] Idle timeout (30 min default)
- [ ] Password history (min 5 poslednich)
- [ ] Bruteforce protection (lockout po 5 failed attempts)
- [ ] Email verification pro nove registry
- [ ] Suspicious login notification
- [ ] Test pro token expiry handling

---

## Faze 4: Implementation Plan

**Soubor:** `docs/claude/Research/Auth/04-Implementation-Plan.md` (~527 radku)

**4-Sprint Roadmap:**

### Sprint 1: Auth Foundation (6 kroku, ~5 dnu)
1. `AuthContext.jsx` + `useAuth` hook (Firebase impl)
2. `PrivateRoute.jsx` (React Router v6 Outlet pattern)
3. `Login.jsx`, `Register.jsx` — 1-step forms (zkodusit magic link)
4. Backend `POST /api/auth/validate-token` middleware
5. `apiClient.js` — auto-token injection v headers
6. `LoginPage` integrate do `src/pages/login/`

**Soubory:** 6 novu (AuthContext, useAuth, PrivateRoute, Login, Register, middleware) + 3 upravy (apiClient, Routes, app layout)

### Sprint 2: Account Page Real Data (5 kroku, ~4 dny)
1. `AccountPage.jsx` s 4-tab Outlet pattern
2. `ProfileTab.jsx` — GET/POST `/api/account/profile` (avatar, jazyk, timezone)
3. `CompanyTab.jsx` — GET/POST `/api/account/company`
4. `SecurityTab.jsx` — GET `/api/account/sessions`, POST `/api/account/logout-session`
5. `BillingTab.jsx` — GET `/api/billing/invoices`, `stripe-redirect` pro card change

**Novy files:** 5 (TabComponents) + 4 API endpoints + `useToast` hook

### Sprint 3: Security Hardening (5 kroku, ~3 dny)
1. Backend rate limiting middleware (`express-rate-limit`)
2. CORS + CSP headers nastaveni
3. `/api/health` endpoint (pro frontend monitoring)
4. Multi-tab logout sync (`storage` event listener)
5. Idle timeout `useIdleTimer` hook (30 min default)

**Novy files:** 3 utilities + 1 hook

### Sprint 4: Post-BETA Features (4 kroky, ~7 dnu)
1. **2FA:** TOTP + recovery codes (Firebase extension)
2. **Sessions management:** List + terminate z AccountPage
3. **Stripe integration:** Card + subscription management
4. **Roles + Permissions:** Team admin vs member (pro future)

**Scope:** Jsou to placeholdery v Phase 1, fully implementovano az po BETA

---

## Key Decisions

| Rozhodnuti | Hodnota | Duvod |
|-----------|---------|-------|
| **Auth Provider** | Firebase (BETA) | Speed + managed service, abstrakce pro Supabase |
| **User Roles** | One type (smazte customer/host) | Simplifikace — BETA focus |
| **Login Flow** | 1-step form | UX: 3x kratsi nez wizard |
| **Token Storage** | localStorage (BETA) | CSP headers mitigation, future: IndexedDB |
| **Token Lifetime** | 1h access + 7d refresh | Standard: short-lived + long-lived refresh |
| **Rate Limiting** | 10 req/min per IP | Brute-force protection |
| **Idle Timeout** | 30 min default | WCAG + security best practice |
| **Multi-tab Sync** | Storage event listener | Native browser, no external deps |
| **2FA** | Placeholder for Sprint 4 | Firebase Extensions, post-BETA |

---

## Impact Analysis

### Nove Soubory (11)
```
src/
  contexts/AuthContext.jsx
  hooks/useAuth.js
  hooks/useIdleTimer.js
  hooks/useToast.js
  components/PrivateRoute.jsx
  pages/login/Login.jsx
  pages/login/Register.jsx
  pages/account/AccountPage.jsx
  pages/account/ProfileTab.jsx
  pages/account/CompanyTab.jsx
  pages/account/SecurityTab.jsx

backend-local/
  middleware/authMiddleware.js
```

### Upravene Soubory (8)
```
src/
  Routes.jsx (+ PrivateRoute wrapper, + /login, /account cesty)
  utils/apiClient.js (+ auto-token injection)
  App.jsx (+ AuthProvider wrapper)
  forge-tokens.css (+ new token vars)

backend-local/
  server.js (+ authMiddleware na /api/*)
  routes/auth.js (novy: POST /auth/validate-token)
  routes/account.js (novy: CRUD account data)
  routes/billing.js (novy: GET invoices, Stripe redirect)
```

### Kompatibilita
- **test-kalkulacka:** Zustane funkci, ale bude "public" (bez auth)
- **widget:** Zustane public, partner auth oddelen
- **admin:** Chranen PrivateRoute + JWT validation
- **pricing-engine:** Beze zmeny (tenant scope pres request context)

---

## Rizika a Mitigation

| Riziko | Severity | Mitigation |
|--------|----------|-----------|
| Firebase outage | MEDIUM | Local fallback mode (offline mode) |
| Token expiry handling | MEDIUM | Auto-refresh před exp. + graceful fallback |
| CORS misconfiguration | HIGH | Whitelist only known domains |
| Weak password | LOW | Enforce 12 chars + special chars |
| Leaked JWT v logs | CRITICAL | Sanitize logs, no token printing |

---

## Session Timeline

| Time | Activity | Output |
|------|----------|--------|
| 08:00 | Phase 1 start — Platform research briefing | Outline structure |
| 10:30 | Phase 1 complete — 15+ SaaS + 3 3D print analysis | 01-Account-Section-Pages.md |
| 12:00 | Phase 2 start — Auth architecture patterns | Outline v2 |
| 15:00 | Phase 2 complete — PrivateRoute + provider-agnostic design | 02-PrivateRoutes-Auth-Architecture.md |
| 16:30 | Phase 3 start — Security research (Top 20 bugs) | Bug list outline |
| 18:00 | Phase 3 complete — Security mistakes + CRITICAL analysis | 03-Security-Mistakes-Checklist.md |
| 19:00 | Phase 4 start — Implementation planning | 4-sprint roadmap |
| 23:00 | Phase 4 complete — Fully detailed sprint plan | 04-Implementation-Plan.md |

**Celkovy cas:** ~15 hodin parallelne (3 agenti)

---

## Soubory v docs/claude/Research/Auth/

1. `01-Account-Section-Pages.md` — ~320 radku
2. `02-PrivateRoutes-Auth-Architecture.md` — ~350 radku
3. `03-Security-Mistakes-Checklist.md` — ~286 radku
4. `04-Implementation-Plan.md` — ~527 radku

**Celkem:** 1 483 radku kvalitniho research dokumentu

---

## Dulezita Rozhodnuti pro Implementaci

### Firebase pro BETA
- Managed service, zero security setup
- Built-in token management
- Easy 2FA extension
- Post-BETA: Abstrakce AuthContext dovoluje swap na Supabase bez zmeny UI

### Provider-Agnostic AuthContext
```typescript
interface AuthContext {
  user: User | null
  token: string | null
  isLoading: boolean
  error: AuthError | null

  // Sync API (Firebase)
  getCurrentUser(): User | null
  getToken(): string | null

  // Async API (deleguje na provider)
  register(email, password): Promise<void>
  login(email, password): Promise<void>
  logout(): Promise<void>
  refreshToken(): Promise<string>
}
```

### Tenant Isolation
- JWT `sub` claim = user ID
- JWT `custom:tenant_id` = tenant ID
- Backend middleware extracts tenant z tokenu → req.tenant
- Vsechny dotazy filtrovany pres tenant_id (RLS v DB)

---

## Nasledujici Kroky

1. **Review** — Security a Architecture PR na implementaci
2. **Sprint 1 Implementation** — 5 dnu na Auth Foundation
3. **BETA Testing** — Real user feedback na login/account flows
4. **Sprint 2-4** — Post-BETA enhancements (2FA, billing, roles)

---

## Klicove Kontakty a Vlastnici

| Oblast | Vlastnik | Agent |
|--------|----------|-------|
| Auth Architecture | - | mp-spec-infra-auth-research |
| PrivateRoute Pattern | - | mp-mid-infra-auth-arch |
| Security Review | - | mp-mid-security-auth |
| Implementation (Sprint 1) | - | mp-spec-fe-auth-forms |

---

**Posledni aktualizace:** 2026-02-20 23:59
**Status:** COMPLETE — Vsechny 4 faze, 1 483 radku, hotovo pro implementaci
