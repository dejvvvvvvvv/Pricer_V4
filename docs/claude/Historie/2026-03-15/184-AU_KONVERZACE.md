# 184-AU — KONVERZACE — Auth Security Review — 2026-03-15

## Metadata
- **ID:** 184-AU
- **Session:** S03
- **Datum:** 2026-03-15
- **Oblast:** Auth / Security
- **Souvisejici ID:** 180-AU, 181-AU, 182-AU, 183-AU, 185-AU

---

## Tema session

Security review Supabase Auth migrace. Agent mp-mid-security-app provedl dukladny audit implementace z S01/S02 a nalezl 2 P0 + 4 P1 + 3 P2 bezpecnostnich nalezu. Vsechny P0 a vetisna P1/P2 opraveny v teto session.

---

## Prubeh konverzace

### [1] Uzivatel
> Uloz historii pro session 2026-03-15 — Security opravy Supabase Auth migrace.
>
> Co se stalo:
> Po implementaci Supabase Auth migrace probehl dukladny security review (agent mp-mid-security-app). Nalezeno 2 P0 + 4 P1 + 3 P2 nalezu. Vsechny P0 a vetsina P1/P2 opraveny.
>
> Opravene nalezy:
>
> F01 [P0] — Auth bypass via cross-provider token confusion
> - Soubor: backend-local/src/middleware/auth.js
> - Oprava: Strict issuer validace, audience `authenticated`, logging selhani
> - Odstranena loose `includes('supabase')` kontrola
>
> F02 [P0] — Password change bez re-autentizace
> - Soubor: src/providers/SupabaseAuthProvider.jsx
> - Oprava: Pridana signInWithPassword() re-autentizace pred updateUser({password})
>
> F04 [P1] — Health endpoint leaks server internals
> - Soubor: backend-local/src/index.js
> - Oprava: Unauthenticated /api/health vraci jen status + uptime, detaily jen v authenticated /api/health/detailed
>
> F05 [P1] — Lokalni getTenantId() header fallback bypass
> - Soubory: storageRouter.js, mesh.js
> - Oprava: Odstranen x-tenant-id header fallback
>
> F06 [P1] — persistSession security comment
> - Soubor: src/lib/supabase/authClient.js
> - Oprava: Dokumentacni komentar o XSS trade-off
>
> F08 [P2] — resetPassword redirect URL
> - Soubor: src/providers/SupabaseAuthProvider.jsx
> - Oprava: Preferuje VITE_APP_URL env promennou
>
> F09 [P2] — apiClient tenant header confusion
> - Soubor: src/lib/apiClient.js
> - Oprava: x-tenant-id header se posila POUZE pro unauthenticated requesty
>
> Neresene nalezy (nizke riziko):
> - F03 [P1] — window.__authGetToken pattern (sdilene s Firebase, architekturalni zmena pro budouci sprint)

### [1] Claude
**Shrnuti odpovedi:**
- Zpracoval kompletni security review kontext
- Vytvoril historicke zaznamy pro Session S03
- 2 P0 nalezy opraveny (auth bypass, password change bez re-auth)
- 4 P1 nalezy: 3 opraveny, 1 odlozen (F03 — architekturalni zmena)
- 2 P2 nalezy opraveny (redirect URL, tenant header)
- Celkem 7 souboru upraveno

**Soubory zminene:**
- `backend-local/src/middleware/auth.js`
- `src/providers/SupabaseAuthProvider.jsx`
- `backend-local/src/index.js`
- `backend-local/src/storage/storageRouter.js`
- `backend-local/src/routes/mesh.js`
- `src/lib/supabase/authClient.js`
- `src/lib/apiClient.js`

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Strict issuer validace pro Supabase JWT | Loose `includes('supabase')` umoznovala token confusion attack | Claude (security agent) |
| 2 | Re-autentizace pred zmenou hesla | Bez re-auth by utocnik s pristupem k session mohl zmenit heslo bez znalosti aktualniho | Claude (security agent) |
| 3 | Health endpoint split na public/detailed | Unauthenticated endpoint leakoval server internals (verze, memory, env) | Claude (security agent) |
| 4 | Odstraneni x-tenant-id header fallbacku | Header mohl byt spoofovan — v produkci tenant MUSI pochazet z JWT | Claude (security agent) |
| 5 | F03 odlozeno na budouci sprint | window.__authGetToken je sdileny pattern s Firebase, zmena by vyzadovala architekturalni refaktor | Uzivatel |

---

## Otevrene otazky

- [ ] F03 [P1] — window.__authGetToken pattern refaktor (planovano na budouci sprint)
- [ ] Google OAuth pro Supabase provider (z S01)
- [ ] Migrace existujicich Firebase uzivatelu

---

## Navaznost

- **Predchozi:** 182-AU (Auth Bugfix session S02), 183-AU (Auth Bugfix upravy S02)
- **Nasledujici:** zatim zadny

---
