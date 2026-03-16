# 180-AU — KONVERZACE — Auth (Supabase Auth Migrace) — 2026-03-15

## Metadata
- **ID:** 180-AU
- **Session:** S01
- **Datum:** 2026-03-15
- **Oblast:** Auth (Supabase Auth Migrace)
- **Souvisejici ID:** 181-AU, 043-AU, 044-AU, 048-AU, 091-SB, 095-SB

---

## Tema session

Implementace Supabase Auth migrace podle planu v `docs/claude/PLANS/supabase-auth-migration.md`. Migrace Firebase Auth na Supabase Auth v 5 fazich — SupabaseAuthProvider, prepnuti providera, backend dual JWT validace, tenant ID v Supabase, Login/Register UI update. Google OAuth vynechano (bude pozdeji), bez migrace uzivatelu.

---

## Prubeh konverzace

### [1] Uzivatel
> Pozadavek na implementaci Supabase Auth migrace podle planu v `docs/claude/PLANS/supabase-auth-migration.md`. Migrace Firebase Auth na Supabase Auth, Google OAuth vynechano (bude pozdeji), bez migrace uzivatelu.

### [1] Claude
**Shrnuti odpovedi:**
- Analyzoval plan migrace a rozdelil implementaci do 5 fazi
- Faze 1: Novy `authClient.js` + prepsani `SupabaseAuthProvider.jsx` (ze stubu na plnou implementaci)
- Faze 2: Prepnuti v `providers/index.jsx` na `supabase` branch
- Faze 3: Dual JWT validace v backendu (Supabase first, Firebase fallback)
- Faze 4: Tenant ID cteni z `app_metadata.tenant_id` v JWT claims
- Faze 5: GoogleSignInButton disabled stav pro Supabase mod

**Akce provedene:**
- Vytvoril `src/lib/supabase/authClient.js` — separatni Supabase client pro auth
- Prepsal `src/providers/SupabaseAuthProvider.jsx` z 29 radku na 216 radku
- Upravil `src/providers/index.jsx` — pridana `supabase` branch
- Upravil `backend-local/src/middleware/auth.js` — dual JWT validace
- Upravil `backend-local/.env.example` — SUPABASE_JWT_SECRET placeholder
- Upravil `src/components/ui/GoogleSignInButton.jsx` — disabled pro Supabase

**Soubory zminene:**
- `docs/claude/PLANS/supabase-auth-migration.md`
- `src/lib/supabase/authClient.js`
- `src/lib/supabase/client.js`
- `src/providers/SupabaseAuthProvider.jsx`
- `src/providers/index.jsx`
- `backend-local/src/middleware/auth.js`
- `backend-local/.env.example`
- `src/components/ui/GoogleSignInButton.jsx`

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Separatni Supabase client pro auth (authClient.js) | Hlavni client.js pouziva accessToken callback ktery blokuje supabase.auth.* metody | Claude |
| 2 | Dual JWT validace v backendu — Supabase first, Firebase fallback | Supabase je synchronni (rychlejsi), Firebase async fallback pro zpetnou kompatibilitu | Claude |
| 3 | Google OAuth vynechano | Throw placeholder v loginWithGoogle, tlacitko disabled s tooltipem | Uzivatel + Claude |
| 4 | Bez migrace existujicich uzivatelu | Cista migrace — novi uzivatele pres Supabase, stari zustavaji na Firebase | Uzivatel |

---

## Otevrene otazky

- [ ] Google OAuth implementace pro Supabase (planovano na pozdeji)
- [ ] Migrace existujicich Firebase uzivatelu do Supabase (mimo scope)
- [ ] Testovani login/register flow v browseru s VITE_AUTH_PROVIDER=supabase

---

## Navaznost

- **Predchozi:** 095-SB (Supabase migrace sprint), 048-AU (SupabaseAuthProvider stub)
- **Nasledujici:** zatim zadny

---
