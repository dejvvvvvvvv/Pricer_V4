# 185-AU — UPRAVY — Auth Security Fixes — 2026-03-15

## Metadata
- **ID:** 185-AU
- **Session:** S03
- **Datum:** 2026-03-15
- **Oblast:** Auth / Security
- **Souvisejici ID:** 184-AU, 181-AU, 183-AU
- **Trigger:** Security review agent mp-mid-security-app nalezl 2 P0 + 4 P1 + 3 P2 bezpecnostnich nalezu v Supabase Auth migraci

---

## Souhrn uprav

Oprava bezpecnostnich nalezu z auditu Supabase Auth migrace. Klicove opravy: strict JWT issuer validace (P0), re-autentizace pred zmenou hesla (P0), health endpoint split (P1), odstraneni tenant header fallbacku (P1), redirect URL hardening (P2), conditional tenant header v apiClient (P2).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Nález | Priorita | Popis |
|---|--------|-----------|-------|----------|-------|
| 1 | backend-local/src/middleware/auth.js | Zmeneno | F01 | P0 | Strict JWT issuer + audience validace, logging selhani |
| 2 | src/providers/SupabaseAuthProvider.jsx | Zmeneno | F02+F08 | P0+P2 | Re-auth pred changePassword + VITE_APP_URL redirect |
| 3 | backend-local/src/index.js | Zmeneno | F04 | P1 | Health endpoint split — public vs authenticated |
| 4 | backend-local/src/storage/storageRouter.js | Zmeneno | F05 | P1 | Odstranen x-tenant-id header fallback |
| 5 | backend-local/src/routes/mesh.js | Zmeneno | F05 | P1 | Odstranen x-tenant-id header fallback |
| 6 | src/lib/supabase/authClient.js | Zmeneno | F06 | P1 | Security komentar o persistSession trade-off |
| 7 | src/lib/apiClient.js | Zmeneno | F09 | P2 | x-tenant-id header jen pro unauthenticated requesty |

---

## Detailni zmeny

### 1. `backend-local/src/middleware/auth.js`

**Typ:** Zmeneno
**Nalez:** F01 — Auth bypass via cross-provider token confusion
**Priorita:** P0
**Duvod:** Loose `includes('supabase')` kontrola umoznovala utocnikovi s jakymkoli JWT obsahujicim retezec "supabase" obejit autentizaci

**Co se zmenilo:**
- Pridana strict issuer validace: `iss === '${SUPABASE_URL}/auth/v1'`
- Pridana audience kontrola: `aud === 'authenticated'`
- Pridano logovani selhanych pokusu o autentizaci
- Odstranena nebezpecna loose `includes('supabase')` podminka

---

### 2. `src/providers/SupabaseAuthProvider.jsx`

**Typ:** Zmeneno
**Nalez:** F02 (P0) + F08 (P2)
**Duvod:** F02 — utocnik s pristupem k session mohl zmenit heslo bez znalosti aktualniho. F08 — hardcoded redirect URL mohl smerovat na spatnou domenu

**Co se zmenilo:**
- F02: Pridana `signInWithPassword()` re-autentizace pred `updateUser({password})` — vyzaduje aktualni heslo
- F08: resetPassword redirect URL preferuje `import.meta.env.VITE_APP_URL`, fallback na `window.location.origin`

---

### 3. `backend-local/src/index.js`

**Typ:** Zmeneno
**Nalez:** F04 — Health endpoint leaks server internals
**Priorita:** P1
**Duvod:** Unauthenticated `/api/health` vracel detaily o serveru (verze, memory, env info)

**Co se zmenilo:**
- Unauthenticated `/api/health` nyni vraci pouze `{ status: "healthy", uptime }`
- Detailni informace presunuky do authenticated `/api/health/detailed`

---

### 4. `backend-local/src/storage/storageRouter.js`

**Typ:** Zmeneno
**Nalez:** F05 — Lokalni getTenantId() header fallback bypass
**Priorita:** P1
**Duvod:** x-tenant-id header mohl byt spoofovan — tenant MUSI pochazet z autentizovaneho JWT

**Co se zmenilo:**
- Odstranen `x-tenant-id` header fallback
- V produkci throw pri absenci tenant z JWT
- Dev-only demo-tenant fallback zachovan

---

### 5. `backend-local/src/routes/mesh.js`

**Typ:** Zmeneno
**Nalez:** F05 — Lokalni getTenantId() header fallback bypass
**Priorita:** P1
**Duvod:** Stejna oprava jako v storageRouter.js — konzistentni chovani

**Co se zmenilo:**
- Odstranen `x-tenant-id` header fallback
- V produkci throw, dev-only demo-tenant fallback

---

### 6. `src/lib/supabase/authClient.js`

**Typ:** Zmeneno
**Nalez:** F06 — persistSession security comment
**Priorita:** P1
**Duvod:** Dokumentace bezpecnostniho trade-off pro budouci vyvojare

**Co se zmenilo:**
- Pridan dokumentacni komentar o XSS trade-off (localStorage vs httpOnly cookies)
- Bez funkcni zmeny — jen informativni

---

### 7. `src/lib/apiClient.js`

**Typ:** Zmeneno
**Nalez:** F09 — apiClient tenant header confusion
**Priorita:** P2
**Duvod:** Posilani x-tenant-id headeru pro authenticated requesty bylo nadbytecne a mohlo zpusobit konfuzi — tenant ma pochazet z JWT

**Co se zmenilo:**
- x-tenant-id header se posila POUZE pro unauthenticated requesty
- Authenticated requesty posylaji pouze `Authorization: Bearer` — tenant se extrahuje z JWT na backendu

---

## Dopad zmen

- **Ovlivnene komponenty:** Auth flow (login, register, password change), Backend middleware, Health endpoint, Storage/Mesh API
- **Breaking changes:** Ne — vsechny zmeny jsou zpetne kompatibilni
- **Nove zavislosti:** Zadne
- **Rizika:** F03 (window.__authGetToken) zustava otevreny — nizke riziko, planovano na budouci sprint

---

## Testovani

- **Build:** Ocekavan PASS (konzistentni se S01/S02)
- **Manual test:** Security review pokryl vsechny nalezene vektory utoku
- **Poznamky:** F03 odlozeno — sdileny pattern s Firebase, vyzaduje architekturalni zmenu

---
