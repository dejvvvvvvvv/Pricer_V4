# 040-AU — UPRAVY — Auth Phase 2 Research — 2026-02-20

## Metadata
- **ID:** 040-AU
- **Session:** S01
- **Datum:** 2026-02-20
- **Oblast:** Auth — Phase 2 Research
- **Souvisejici ID:** 039-AU (Phase 1)
- **Trigger:** Pokracovani 4-fazoveho Auth Research planu — Phase 2 detailn

---

## Souhrn uprav

Phase 2 pokracovani Auth Research projektu se zamerenim na architekturu PrivateRoute patternu, provider-agnosticke rozhrani, backend middleware a token management. Vytvorena nove dokumentacni struktura v `docs/claude/Research/Auth/02-...md` obsahujici detailni analyzu reaktivniho routingu, autentizace a migraci tenantId z HTTP headeru na JWT claims.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | docs/claude/Research/Auth/02-PrivateRoutes-Auth-Architecture.md | Novy soubor | 1-350+ | Nova dokumentace Phase 2: PrivateRoute pattern, AuthProvider interface, backend middleware, tenant isolation, token management |

---

## Detailni zmeny

### 1. `docs/claude/Research/Auth/02-PrivateRoutes-Auth-Architecture.md`

**Typ:** Novy soubor
**Radky:** Cely soubor (350+ radku)
**Duvod:** Dokumentace Phase 2 Auth Research — siroky pregled architekturniho patternu pro autentizaci v React + Backend

**Co se zmenilo:**

Novy soubor s 5 hlavnimi sekcemi:

1. **PrivateRoute + Outlet Pattern (React Router v6+)**
   - Vysvětleni Outlet-based layout pattern (uz spravne v PrivateRoute.jsx)
   - Loading guard s Context-based detection (auth?.user || isLoading)
   - Conditional redirect na /login s pamatovanou pozici (state.from)

2. **Provider-Agnostic AuthContext Design**
   - Nove rozhrani AuthProvider s metodami: login, logout, getToken, refreshToken
   - Pluggable implementace pro Firebase, Supabase, vlastni backend
   - Context struktura: { user, isLoading, error, provider_name }
   - Integrujici adapter pattern pro swap mezi poskytovateli

3. **Firebase + Supabase Implementation**
   - Firebase (ID token, refresh token, automatic refresh)
   - Supabase (JWT session, MFA, real-time presence)
   - Srovnani: expiraci, refresh strategie, security modely

4. **Multi-Provider Backend Middleware (Express)**
   - Middleware detekuje Firebase/Supabase/JWT pouze z header: `Authorization: Bearer <token>`
   - Overuje issuer claim v JWT pro identifikaci poskytovatele
   - Migruje tenant identifikaci z `x-tenant-id` header na JWT-derived `tenantId`
   - Podporuje prechodne dualni rezim (header + JWT) pro backward compatibility

5. **Token Management + Session Sync**
   - Srovnani token storage: localStorage (XSS risk) vs httpOnly cookie (CSRF risk) vs memory (session loss)
   - BroadcastChannel API pro multi-tab sync (sync logout, refresh token share)
   - Idle timeout strategie + backend session store
   - Refretch interval pro expirujici tokeny

**Architekturni diagram:**
- Ukazan celkovy flow: React app → AuthContext → Firebase/Supabase → Backend middleware → Tenant storage

**Klicove rozhodnuti:**
- Zachovat Outlet pattern (jiz spravny)
- Provider-agnostic AuthContext abstrakce umoznuje budouci swap (Firebase <-> Supabase)
- Tenant isolation: JWT claims > HTTP header pro skalabilitu
- BroadcastChannel pro multi-tab sync (weby se dnes ocekava cross-tab consistency)

---

## Dopad zmen

- **Ovlivnene komponenty:** PrivateRoute.jsx, potencionalni novy AuthProvider.jsx (budoucnost)
- **Breaking changes:** Ne (dokumentace jen, zadna zmena kodu)
- **Nove zavislosti:** Zadne v teto fazi
- **Rizika:** Zadna — dokumentace sluzí jako blueprint pro budouci implementaci

---

## Testovani

- **Build:** N/A (dokumentace)
- **Manual test:** N/A
- **Poznamky:** Soubor je dokumentacni — sluzí jako referencia pro Phase 3-4 implementaci

---

