# Security Assessment -- Supabase Migrace Sprint (2026-02-26)

> Bezpecnostni audit provedeny v ramci Supabase migracniho sprintu.
> Zamereni: RLS policies, storage buckety, auth architektura, tenant izolace.

---

## 1. Souhrn

| Priorita | Pocet | Popis |
|----------|-------|-------|
| **P0 (kriticke)** | 4 | Okamzite resit pred produkcnim nasazenim |
| **P1 (vysoke)** | 4 | Resit v dalsim sprintu |
| **P2 (stredni)** | 3 | Resit pred GA (general availability) |

**Celkem:** 11 bezpecnostnich nalezu

**Stav projektu:** Demo/development faze. Vsechny P0 nalezy jsou vedomou soucasti
demostriacni architektury a MUSI byt opraveny pred jakoukoli produkcni expozici.

---

## 2. P0 -- Kriticke nalezy (okamzite resit)

### P0-1: RLS policies permisivni (anon pristup ke vsem datum)

**Soubor:** `supabase/schema.sql`

**Popis:** Vsech 25 tabulek ma RLS policies povolujici neomezeny SELECT/INSERT/UPDATE/DELETE
pro `anon` roli. Libovolny klient s anon klicem muze cist a modifikovat data
jakehokoliv tenanta.

**Priklad:**
```sql
CREATE POLICY "pricing_configs_select_anon" ON pricing_configs
  FOR SELECT USING (true);
```

**Dopad:** Zadna realna tenant izolace na DB urovni. Data jednoho tenanta mohou byt
prectena nebo modifikovana jinym tenantem.

**Reseni:** Nahradit permisivni policies za tenant-scoped policies s JWT claims:
```sql
CREATE POLICY "pricing_configs_tenant_select" ON pricing_configs
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

**Planovany soubor:** `supabase/rls-policies-production.sql`

---

### P0-2: Storage buckety otevrene (anon pristup ke vsem souborun)

**Soubor:** `supabase/storage-policies.sql`

**Popis:** Vsechny 3 storage buckety (`models`, `documents`, `branding`) maji
permisivni policies. Klient muze stahnout/nahrat/smazat libovolny soubor
v libovolnem bucketu.

**Dopad:** 3D modely zakazniku (potencialne obchodni tajemstvi) jsou pristupne komukoliv.

**Reseni:** Path-based RLS s tenant prefixem:
```sql
CREATE POLICY "models_tenant_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'models'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );
```

**Nutne zmeny:**
- Reorganizace storage paths: `{tenant_id}/{filename}`
- Update upload logiky na frontendu
- Migrace existujicich souboru pod tenant prefix

---

### P0-3: Auth mismatch (Firebase Auth vs Supabase RLS)

**Popis:** Projekt pouziva Firebase Auth pro prihlaseni, ale Supabase RLS ocekava
Supabase JWT s custom claims. Bez auth bridge neni mozne implementovat
tenant-scoped RLS.

**Dopad:** I po vytvoreni production RLS policies by dotazy selhaly, protoze klient
nema platny Supabase JWT.

**Stav:** IMPLEMENTED (2026-02-27)

**Reseni:**
- `tenantRegistration.js` vytvoren pro auto-registraci Firebase useru jako Supabase tenantu
- `ensureTenantInSupabase()` integrovano do FirebaseAuthProvider.jsx na 4 mistech:
  1. Po Firebase login (Google Sign-In)
  2. Po Firebase register (Sign-Up)
  3. Na ladicim endpointu /api/auth/ensure-tenant (admin)
  4. Na health endpointu (fallback check)
- Supabase client pouziva `accessToken` callback ktery predava Firebase JWT
- Implementace: Supabase Third-Party Auth s Firebase JWT jako source of truth
- Zbyva: Registrace Firebase projektu v Supabase Dashboard (Third-Party Auth konfigurace)

**Detaily:** viz `docs/claude/Research/Firebase-Supabase-Auth-Integration-Research.md`

---

### P0-4: Header spoofing (x-tenant-id)

**Soubor:** `supabase/schema.sql` (funkce `get_request_tenant_id()`)

**Popis:** SQL funkce `get_request_tenant_id()` cte tenant_id z HTTP headeru
`x-tenant-id`. Header je trivialne zfalsovateny klientem.

**Implementace:**
```sql
CREATE OR REPLACE FUNCTION get_request_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-tenant-id',
    'demo-tenant'  -- <-- hardcoded fallback!
  );
END;
```

**Dopad:** Utocnik muze nastavit `x-tenant-id` na libovolny tenant a ziskat pristup
k jeho datum (i kdyby RLS policies nebyly permisivni).

**Reseni:** Odstranit tuto funkci a nahradit ji `auth.jwt() ->> 'tenant_id'` v RLS policies.
Fallback na `'demo-tenant'` MUSI byt odstranen v produkci.

---

## 3. P1 -- Vysoke nalezy (dalsi sprint)

### P1-1: Storage router bez autentizace

**Soubor:** `backend-local/src/routes/storage.js` (predpoklad)

**Popis:** Backend storage endpoint `/api/storage/*` pouziva `requireTenant` middleware,
ale tenant se resolvi z requestu (header/cookie), ne z overeneho JWT. Bez
`requireAuth` middleware je endpoint pristupny i bez prihlaseni.

**Reseni:** Pridat `requireAuth` middleware pred `requireTenant` na vsechny
storage endpointy.

---

### P1-2: Widget embed endpoint bez rate limitingu

**Popis:** Verejna widget route `/w/:publicWidgetId` nema rate limiting.
Utocnik muze opakovane volat endpoint a zpusobovat nadmernou zatez.

**Reseni:** Pridat rate limiting na widget embed endpointy (napr. `express-rate-limit`
na backend proxy).

---

### P1-3: Email routes bez CSRF ochrany

**Popis:** Email endpointy (pokud existuji) mohou byt zneuzity pro spam pokud
nemaji CSRF ochranu.

**Reseni:** Pridat CSRF token validaci nebo omezit emaily na autorizovane uzivatele.

---

### P1-4: Anon key expozice v klientu

**Popis:** Supabase anon key je verejne pristupny v klientskem bundlu (VITE_ prefix).
Anon key sam o sobe neni tajny (to je by design), ale v kombinaci s permisivnimi
RLS policies (P0-1) umoznuje neomezeny pristup.

**Reseni:** Anon key je OK v klientu AZ po implementaci production RLS policies.
Pred tim neni bezpecne mit Supabase pristupny z klienta.

---

## 4. P2 -- Stredni nalezy (pred GA)

### P2-1: demo-tenant fallback v kodu

**Soubory:** `src/lib/supabase/client.js`, `src/utils/adminTenantStorage.js`

**Popis:** Na vice mistech v kodu je hardcoded fallback `'demo-tenant'`:
- `get_request_tenant_id()` SQL funkce (viz P0-4)
- `getTenantId()` fallback v adminTenantStorage
- Seed data pro `demo-tenant`

**Dopad:** Pri chybejicim tenant kontextu data padaji do `demo-tenant` namespace,
coz muze zpusobit uniky dat mezi tenanty.

**Reseni:** V produkci nahradit fallback za explicitni error (throw) pokud tenant
neni dostupny. Demo tenant ponechat jen pro development.

---

### P2-2: Client-side feature flags

**Soubor:** `src/lib/supabase/featureFlags.js`

**Popis:** Feature flags pro Supabase/localStorage prepinani jsou ulozeny v localStorage
klienta. Uzivatel je muze manipulovat pres DevTools.

**Dopad:** Uzivatel muze prepnout mode na `supabase` bez autorizace nebo
na `localStorage` aby obchazel Supabase RLS.

**Reseni:** V produkci feature flags ridit serverove (napr. z `feature_flags` tabulky
v Supabase) a klientske flags pouzivat jen jako cache.

---

### P2-3: Path leakage v health endpointu (OPRAVENO)

**Soubor:** `backend-local/src/index.js`

**Popis:** Health endpoint `/api/health` drive odhaloval systemove cesty
(napr. `C:\Users\...`). Toto bylo opraveno v Auth Sprint 1.

**Stav:** OPRAVENO. Ponechano v assessmentu pro uplnost zaznamu.

---

## 5. Doporuceny plan reseni

### Faze 1: Auth bridge (prerekvizita pro vse ostatni)
1. Implementovat backend endpoint `/api/auth/supabase-token`
2. Frontend: ziskat Supabase JWT po Firebase login
3. Nastavit `supabase.auth.setSession()` s custom JWT

### Faze 2: Production RLS policies
1. Vytvorit `supabase/rls-policies-production.sql`
2. Testovat v staging
3. Drop stare anon policies + aplikovat nove

### Faze 3: Storage hardening
1. Reorganizovat storage paths na `{tenant_id}/` prefix
2. Aplikovat path-based storage RLS
3. Migrovat existujici soubory

### Faze 4: Cleanup
1. Odstranit `get_request_tenant_id()` funkci
2. Odstranit `demo-tenant` fallbacky (krome dev mode)
3. Server-side feature flags
4. Rate limiting na verejne endpointy

---

## 6. Souvisejici dokumenty

| Dokument | Popis |
|----------|-------|
| `docs/claude/Documentation/Supabase-Dokumentace.md` | Celkova Supabase architektura |
| `docs/claude/Research/Supabase-Tenant-Isolation-Research.md` | RLS strategie, JWT bridge |
| `docs/claude/Research/Cross-Device-Sync-Research.md` | Realtime sync, offline |
| `docs/claude/Research/Firebase-Supabase-Auth-Integration-Research.md` | Auth bridge detaily |
| `supabase/schema.sql` | Aktualni schema + anon policies |
| `supabase/storage-policies.sql` | Aktualni storage policies |

---

*Vytvoreno: 2026-02-26 | Supabase migracni sprint*
