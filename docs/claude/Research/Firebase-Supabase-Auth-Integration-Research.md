# Firebase Auth + Supabase RLS Integration Research

> **Datum:** 2026-02-26
> **Kontext:** ModelPricer V3 — migrace na Supabase s existujicim Firebase Auth
> **Zdroje:** Context7 (Supabase docs, Firebase docs), Brave Search (4 dotazy)

---

## Obsah

1. [Prehled pristupu](#1-prehled-pristupu)
2. [Approach A: Firebase JWT primo v Supabase (DOPORUCENO)](#2-approach-a-firebase-jwt-primo-v-supabase)
3. [Approach B: Migrace na Supabase Auth](#3-approach-b-migrace-na-supabase-auth)
4. [Approach C: Service Role Key + Header-Based Isolation](#4-approach-c-service-role-key--header-based-isolation)
5. [Approach D: Koexistence Firebase + Supabase Auth](#5-approach-d-koexistence-firebase--supabase-auth)
6. [Multi-Tenant RLS Patterns](#6-multi-tenant-rls-patterns)
7. [Doporuceni pro ModelPricer](#7-doporuceni-pro-modelpricer)
8. [Zdroje a citace](#8-zdroje-a-citace)

---

## 1. Prehled pristupu

| Pristup | Slozitost | Bezpecnost | Free Tier | Doporuceni |
|---------|-----------|------------|-----------|------------|
| **A: Firebase JWT primo** | Stredni | Vysoka | ANO | **DOPORUCENO** |
| **B: Migrace na Supabase Auth** | Vysoka | Vysoka | ANO | Dlouhodobe idealni |
| **C: Service Role + Headers** | Nizka | RIZIKOVA | ANO | Jen pro backend |
| **D: Koexistence** | Velmi vysoka | Stredni | ANO | Prechodne obdobi |

---

## 2. Approach A: Firebase JWT primo v Supabase

### Jak to funguje

Supabase od roku 2024 oficialne podporuje **Third-Party Auth** integraci vcetne Firebase.
Firebase JWT tokeny jsou primo akceptovany Supabase API — neni treba je vymenit za Supabase JWT.

> "Third-party auth support means that when you add a new integration with one of these providers,
> the API will trust JWTs issued by the provider similar to how it trusts JWTs issued by Supabase Auth."
> — [Supabase Docs: Third-party auth](https://supabase.com/docs/guides/auth/third-party/overview)

### Krok 1: Registrace Firebase projektu v Supabase

V Supabase Dashboard:
- `Authentication` > `Third-party auth` > `Add integration` > `Firebase`
- Zadat Firebase **Project ID** (z Firebase Console > Settings > General)

### Krok 2: Prirazeni `role: 'authenticated'` custom claim v Firebase

Supabase RLS pouziva Postgres role `authenticated`. Firebase JWT musi obsahovat tento claim.

**Varianta 2a: Firebase Cloud Function (onCreate)**

```javascript
// Firebase Cloud Function (Node.js)
const functions = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

exports.processSignUp = functions.auth.user().onCreate(async (user) => {
  try {
    await getAuth().setCustomUserClaims(user.uid, {
      role: 'authenticated',
      // DULEZITE: tenant_id pro multi-tenant izolaci
      tenant_id: 'default_tenant'  // nastavit podle registracni logiky
    });
  } catch (error) {
    console.error('Error setting custom claims:', error);
  }
});
```

**Varianta 2b: Backend endpoint (pro existujici uzivatele)**

```javascript
// backend-local/src/routes/auth.js
import { getAuth } from 'firebase-admin/auth';

// Endpoint pro nastaveni claims existujicim uzivatelum
router.post('/api/auth/set-claims', requireAuth, async (req, res) => {
  const { uid } = req.user;
  const tenantId = req.tenantId; // z requireTenant middleware

  await getAuth().setCustomUserClaims(uid, {
    role: 'authenticated',
    tenant_id: tenantId
  });

  res.json({ success: true, message: 'Claims updated. Re-login required.' });
});
```

**Varianta 2c: Migracni skript (jednorázové nastaveni pro vsechny uzivatele)**

```javascript
// scripts/set-firebase-claims.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: cert('./service-account.json') });

async function setClaimsForAllUsers() {
  let nextPageToken;
  do {
    const listResult = await getAuth().listUsers(1000, nextPageToken);
    for (const user of listResult.users) {
      const existingClaims = user.customClaims || {};
      if (!existingClaims.role) {
        await getAuth().setCustomUserClaims(user.uid, {
          ...existingClaims,
          role: 'authenticated',
          tenant_id: existingClaims.tenant_id || user.uid // fallback na uid
        });
        console.log(`Set claims for ${user.uid}`);
      }
    }
    nextPageToken = listResult.pageToken;
  } while (nextPageToken);
}

setClaimsForAllUsers();
```

### Krok 3: Inicializace Supabase klienta s Firebase JWT

```javascript
// src/lib/supabase/client.js
import { createClient } from '@supabase/supabase-js';
import { getAuth } from 'firebase/auth';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    accessToken: async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return null;

      // Firebase automaticky refreshuje expired tokeny
      const token = await user.getIdToken();
      return token;
    }
  }
);

export default supabase;
```

**DULEZITE:** Parametr `accessToken` je novinka v `@supabase/supabase-js` v2.x.
Nahrazuje starsi pattern s `global.headers.Authorization`.

### Krok 4: Restriktivni RLS politika (bezpecnostni guard)

```sql
-- POVINNE: Omezit pristup jen na vase Firebase projekty
-- Aplikovat na KAZDU tabulku v public schema
CREATE POLICY "Restrict to project Firebase and Supabase Auth"
  ON table_name
  AS RESTRICTIVE
  TO authenticated
  USING (
    (auth.jwt()->>'iss' = 'https://<supabase-project-ref>.supabase.co/auth/v1')
    OR
    (
      auth.jwt()->>'iss' = 'https://securetoken.google.com/<firebase-project-id>'
      AND
      auth.jwt()->>'aud' = '<firebase-project-id>'
    )
  );
```

> **KRITICKE:** Bez teto politiky muze jakykoli Firebase projekt pristupovat k vasi databazi!
> Na hosted Supabase jsou nezaregistrovane Firebase projekty automaticky blokovany,
> ale pri self-hostingu je toto VASE zodpovednost.
> — [Supabase Docs: Firebase Auth](https://supabase.com/docs/guides/auth/third-party/firebase-auth)

### Krok 5: Multi-tenant RLS s tenant_id z Firebase JWT

```sql
-- Tenant izolace pres custom claim z Firebase JWT
CREATE POLICY "Tenant isolation"
  ON orders
  AS RESTRICTIVE
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->'claims'->>'tenant_id')
  );
```

Poznamka: Presna cesta k `tenant_id` v JWT zavisi na tom, kde Firebase ulozi custom claims.
Firebase custom claims jsou na top-level JWT payload, takze:

```sql
-- Firebase custom claims jsou primo v JWT payload
CREATE POLICY "Tenant isolation via Firebase custom claim"
  ON orders
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')
  );
```

### Pros

- **Oficialne podporovano** Supabase (ne hack/workaround)
- **Zadna zmena auth flow** — uzivatele se prihlasi pres Firebase jako drive
- **Firebase JWT je automaticky verifikovany** Supabase API
- **Funguje s free tier** Supabase (Third-party Auth je free feature)
- **RLS funguje plne** — `auth.jwt()`, `auth.uid()` jsou dostupne
- **Realtime + Storage + API** — vsechno funguje s Firebase JWT

### Cons

- **Custom claims musi byt nastaveny** na kazdem Firebase uzivateli (`role: 'authenticated'`)
- **Existujici uzivatele** potrebuji migracni skript pro claims
- **Token refresh** — Firebase tokeny vyprsi po 1 hodine, ale Firebase SDK je automaticky obnovuje
- **Custom claims limit** — Firebase ma 1000 byte limit na custom claims payload
- **Debug slozitejsi** — dva auth systemy = dva zdroje potencialnich problemu

### Bezpecnostni implikace

- **VYSOKA bezpecnost** — JWT je verifikovany na strane Supabase
- **Restriktivni politika je POVINNE** — bez ni muze cizi Firebase projekt pristupovat k datum
- **Custom claims jsou v JWT** — nemohou byt modifikovany klientem (jen serverem pres Admin SDK)
- **`auth.uid()`** vraci Firebase UID (field `sub` z JWT)

---

## 3. Approach B: Migrace na Supabase Auth

### Jak to funguje

Kompletni nahrazeni Firebase Auth za Supabase Auth. Supabase ma vlastni auth system
s email/password, OAuth (Google, GitHub, atd.), magic links, phone OTP.

### Migracni postup

Supabase poskytuje oficialni migracni nastroje:

> "There are two parts to the migration process: firestoreusers2json exports users from an
> existing Firebase project to a .json file on your local system. import_users imports users
> from a saved .json file into your Supabase project."
> — [Supabase Docs: Migrate from Firebase Auth](https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth)

```bash
# 1. Export uzivatelu z Firebase
npx supabase-migration firebase export --project-id <firebase-project-id>
# Vytvori users.json

# 2. Import do Supabase
npx supabase-migration import --supabase-url <url> --supabase-key <service-role-key>
```

**UPOZORNENI:** Uzivatele dostanou NOVE UUID v Supabase. Firebase UID se neprenesou jako primarni ID.

### Nastaveni tenant_id v Supabase Auth

**Varianta: raw_app_meta_data**

```sql
-- Nastaveni tenant_id pro uzivatele pres Supabase Admin API
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"tenant_id": "tenant_123"}'::jsonb
WHERE id = 'user-uuid';
```

```javascript
// Nebo pres Supabase Admin API (service_role key)
const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
  userId,
  {
    app_metadata: { tenant_id: 'tenant_123' }
  }
);
```

**RLS politika pro Supabase Auth s app_metadata:**

```sql
CREATE POLICY "Tenant isolation via app_metadata"
  ON orders
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->'app_metadata'->>'tenant_id')
  );
```

### Custom Access Token Hook (pridani claims do JWT)

```sql
-- Supabase Auth Hook — prida tenant_id z tabulky do JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_tenant_id text;
BEGIN
  -- Nacti tenant_id z user_tenants tabulky
  SELECT t.tenant_id INTO user_tenant_id
  FROM public.user_tenants t
  WHERE t.user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Opravneni pro auth admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

### Pros

- **Jeden auth system** — jednodussi architektura
- **Nativni RLS integrace** — `auth.uid()`, `auth.jwt()` funguje bez konfigurace
- **Supabase Auth hooks** — moznost customizovat JWT claims primo v databazi
- **app_metadata** — bezpecne ulozeni tenant_id (klient nemuze menit)
- **Magic links, Phone OTP** — dalsi auth metody zdarma
- **Lepsi debug** — vsechno v jednom dashboardu

### Cons

- **VELKA migrace** — vsichni uzivatele musi byt premigrovani
- **NOVE UUID** — existujici data referencujici Firebase UID musi byt premapovana
- **Google OAuth re-setup** — novy OAuth flow pres Supabase
- **Password hash incompatibilita** — Firebase pouziva scrypt, Supabase bcrypt
  - Uzivatele s heslem MUSI resetovat heslo po migraci
- **Downtime/disruption** — uzivatele se musi znovu prihlasit
- **Breaking changes** — vsechny frontend auth calls musi byt prepsany
- **Firebase Auth dependencies** — `apiClient.js`, `FirebaseAuthProvider.jsx` musi byt nahrazeny

### Bezpecnostni implikace

- **VYSOKA bezpecnost** — nativni integrace, zadne gaps
- **app_metadata** nelze menit z klienta (jen server/admin)
- **RLS je first-class citizen** v Supabase Auth

### Odhad narocnosti pro ModelPricer

- **Frontend:** Prepsani `FirebaseAuthProvider.jsx` na `SupabaseAuthProvider.jsx` (stub uz existuje)
- **Backend:** Nahrazeni Firebase Admin middleware za Supabase JWT verifikaci
- **Data:** Premapovani vsech `user_id` referencI z Firebase UID na Supabase UUID
- **Cas:** ~2-3 sprinty (vcetne testovani a migrace uzivatelu)

---

## 4. Approach C: Service Role Key + Header-Based Isolation

### Jak to funguje

Backend pouziva `service_role` key (ktery bypasuje RLS), a rucne nastavuje
tenant kontext pres Postgres `set_config()` / `current_setting()`.

### Implementace

**Backend middleware:**

```javascript
// backend-local/src/middleware/supabaseTenant.js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function supabaseTenantMiddleware(req, res, next) {
  const tenantId = req.tenantId; // z existujiciho requireTenant middleware

  // Nastaveni tenant kontextu pro RLS
  // POZOR: service_role BYPASUJE RLS!
  // Musime pouzit RPC call pro nastaveni session variable
  const { error } = await supabaseAdmin.rpc('set_tenant_context', {
    p_tenant_id: tenantId
  });

  if (error) {
    return res.status(500).json({ error: 'Failed to set tenant context' });
  }

  req.supabase = supabaseAdmin;
  next();
}
```

**SQL funkce pro nastaveni kontextu:**

```sql
-- Funkce pro nastaveni tenant kontextu v Postgres session
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.tenant_id', p_tenant_id, true);
  -- 'true' = local (jen pro aktualni transakci)
END;
$$;

-- RLS politika pouzivajici session variable
CREATE POLICY "Tenant isolation via session variable"
  ON orders
  TO authenticated
  USING (
    tenant_id = current_setting('app.tenant_id', true)
  );
```

**PROBLEM:** `service_role` key **VZDY bypasuje RLS**. To znamena, ze RLS politiky se neuplatni!

> "A Supabase client with the Authorization header set to the service role API key will
> ALWAYS bypass RLS."
> — [Supabase Docs: Troubleshooting](https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z)

### Alternativa: Pouziti anon key + custom header

```javascript
// Backend: vytvorit klienta s anon key + custom JWT
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        // Nastavit custom header pro tenant
        'x-tenant-id': tenantId
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
```

**PROBLEM:** Custom headers NEJSOU dostupne v RLS politikach primo.
Museli byste pouzit PostgREST `current_setting('request.header.x-tenant-id')`,
ale to funguje jen s PostgREST, ne primo v Postgres.

### Pros

- **Nejjednodussi implementace** — zadne zmeny v auth flow
- **Firebase Auth zustavaji** beze zmeny
- **Backend kontroluje pristup** — jasna hranice

### Cons

- **KRITICKE BEZPECNOSTNI RIZIKO** — service_role bypasuje RLS
  - Jakykoli bug v backend kodu = pristup ke vsem datum vsech tenantu
  - RLS neni druha uroven obrany, je UPLNE obejita
- **Neni tenant izolace na DB urovni** — izolace je jen v aplikacnim kodu
- **Single point of failure** — backend middleware je jedina ochrana
- **PostgREST zavislost** — custom headers funguju jen pres PostgREST API, ne primo v SQL
- **NEDOPORUCENO pro produkci** — porušuje princip defense-in-depth

### Bezpecnostni implikace

- **NIZKA bezpecnost** — ekvivalent "trust the application code"
- **Zadna DB-level izolace** — SQL injection v backendu = full data leak
- **Service role key exposure** = pristup ke vsemu
- **Audit trail slabsi** — Supabase neloguje tenant kontext z headers

### Kdy je akceptovatelne

- **Jen pro backend-to-backend operace** kde frontend nema primy pristup k Supabase
- **Migracni skripty** kde service_role je nezbytny
- **Admin operace** (bulk import, reporting) kde RLS neni potreba

---

## 5. Approach D: Koexistence Firebase + Supabase Auth

### Jak to funguje

Oba auth systemy bezi soucasne. Novi uzivatele se registruji pres Supabase Auth,
existujici zustavaji na Firebase. Postupna migrace.

### Implementace

**Dual Auth Provider:**

```javascript
// src/providers/DualAuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';

const AuthContext = createContext(null);

export function DualAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authSource, setAuthSource] = useState(null); // 'firebase' | 'supabase'

  const firebaseAuth = getAuth();
  const supabase = createClient(/* ... */);

  useEffect(() => {
    // Listen na Firebase auth
    const unsubFirebase = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (fbUser && !user) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          source: 'firebase'
        });
        setAuthSource('firebase');
      }
    });

    // Listen na Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && !user) {
          setUser({
            uid: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.full_name,
            source: 'supabase'
          });
          setAuthSource('supabase');
        }
      }
    );

    return () => {
      unsubFirebase();
      subscription.unsubscribe();
    };
  }, []);

  // Supabase klient s dynamickym JWT
  const supabaseWithAuth = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      accessToken: async () => {
        if (authSource === 'firebase') {
          return await firebaseAuth.currentUser?.getIdToken();
        }
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || null;
      }
    }
  );

  return (
    <AuthContext.Provider value={{ user, authSource, supabase: supabaseWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**RLS politika pro oba auth systemy:**

```sql
-- Politika akceptujici oba JWT issuery
CREATE POLICY "Dual auth tenant isolation"
  ON orders
  AS RESTRICTIVE
  TO authenticated
  USING (
    -- Supabase Auth: tenant_id z app_metadata
    (
      auth.jwt()->>'iss' = 'https://<project-ref>.supabase.co/auth/v1'
      AND tenant_id = (auth.jwt()->'app_metadata'->>'tenant_id')
    )
    OR
    -- Firebase Auth: tenant_id z custom claims
    (
      auth.jwt()->>'iss' = 'https://securetoken.google.com/<firebase-project-id>'
      AND auth.jwt()->>'aud' = '<firebase-project-id>'
      AND tenant_id = (auth.jwt()->>'tenant_id')
    )
  );
```

**Migracni endpoint:**

```javascript
// Backend: migrace uzivatele z Firebase na Supabase
router.post('/api/auth/migrate-to-supabase', requireAuth, async (req, res) => {
  const firebaseUser = req.user; // z Firebase middleware

  // Vytvorit uzivatele v Supabase
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: firebaseUser.email,
    email_confirm: true,
    app_metadata: {
      tenant_id: req.tenantId,
      firebase_uid: firebaseUser.uid, // zachovat referenci
      migrated_at: new Date().toISOString()
    }
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Premapovat data z Firebase UID na Supabase UUID
  await supabaseAdmin
    .from('user_id_mapping')
    .insert({
      firebase_uid: firebaseUser.uid,
      supabase_uuid: data.user.id,
      tenant_id: req.tenantId
    });

  res.json({ success: true, newUserId: data.user.id });
});
```

### Pros

- **Zero downtime migrace** — zadny "big bang" switch
- **Postupna migrace** — uzivatele mohou byt migrovani po skupinach
- **Fallback** — pokud Supabase Auth nefunguje, Firebase stale funguje
- **Testovani** — novy auth muze byt testovan na podmnozine uzivatelu

### Cons

- **EXTREMNI slozitost** — dva auth systemy = dvojnasobna udrzba
- **Dual RLS politiky** — kazda tabulka potrebuje politiky pro oba JWT formaty
- **ID mapping** — Firebase UID vs Supabase UUID musi byt mapovany
- **Session management** — dva ruzne session mechanismy
- **Race conditions** — co kdyz uzivatel je prihlaseny v obou systemech?
- **Debugging nightmare** — "ktery auth system zpusobil problem?"
- **Casove omezeny** — musi byt docasne reseni s jasnym deadline

### Bezpecnostni implikace

- **STREDNI bezpecnost** — oba systemy mohou mit vlastni zranitelnosti
- **Vetsi attack surface** — dva auth systemy = dva potencialni vektory utoku
- **JWT validace** — musi byt spravna pro OBA formaty JWT

---

## 6. Multi-Tenant RLS Patterns

### Pattern 1: Tenant ID v JWT claims (DOPORUCENO)

```sql
-- Nejcistsi a nejbezpecnejsi pattern
CREATE POLICY "tenant_isolation_orders"
  ON orders
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')
  );
```

**Vyhoda:** Tenant ID je v tokenu, neni treba zadny DB lookup.
**Nevyhoda:** Zmena tenantu vyzaduje novy JWT (re-login nebo token refresh).

### Pattern 2: Tenant lookup z DB

```sql
-- Tenant ID z tabulky user_tenants
CREATE POLICY "tenant_isolation_via_lookup"
  ON orders
  TO authenticated
  USING (
    tenant_id IN (
      SELECT ut.tenant_id
      FROM user_tenants ut
      WHERE ut.user_id = auth.uid()
    )
  );
```

**Vyhoda:** Dynamicke — zmena tenantu bez re-loginu.
**Nevyhoda:** Extra DB query na KAZDY request (performance).
**Optimalizace:** Pouzit `security_barrier` view nebo funkci.

### Pattern 3: Kombinovany (JWT + fallback lookup)

```sql
CREATE POLICY "tenant_isolation_hybrid"
  ON orders
  TO authenticated
  USING (
    tenant_id = COALESCE(
      (auth.jwt()->>'tenant_id'),
      (SELECT ut.tenant_id FROM user_tenants ut WHERE ut.user_id = auth.uid() LIMIT 1)
    )
  );
```

### Best Practices pro Multi-Tenant RLS

1. **VZDY pouzivejte `AS RESTRICTIVE`** pro tenant izolacni politiky
   - Restriktivni politiky se ANDuji (vsechny musi projit)
   - Permisivni politiky se ORuji (staci jedna)
   - Tenant izolace MUSI byt restriktivni

2. **Nezapominejte na INSERT/UPDATE/DELETE** — `USING` je pro SELECT, `WITH CHECK` pro INSERT/UPDATE

```sql
CREATE POLICY "tenant_insert"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')
  );

CREATE POLICY "tenant_select"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')
  );

CREATE POLICY "tenant_update"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')
  )
  WITH CHECK (
    tenant_id = (auth.jwt()->>'tenant_id')
  );

CREATE POLICY "tenant_delete"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (auth.jwt()->>'tenant_id')
  );
```

3. **Indexy na tenant_id** — KRITICKE pro performance

```sql
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_tenant_user ON orders(tenant_id, user_id);
```

4. **Default tenant_id na INSERT** (prevence zapomenuti)

```sql
ALTER TABLE orders
  ALTER COLUMN tenant_id
  SET DEFAULT (auth.jwt()->>'tenant_id');
```

---

## 7. Doporuceni pro ModelPricer

### Doporuceny pristup: **A (Firebase JWT primo) → B (migrace na Supabase Auth)**

**Faze 1 (Sprint 3-4): Approach A — Firebase JWT v Supabase**

1. Zaregistrovat Firebase projekt v Supabase Dashboard (Third-party Auth)
2. Nastavit `role: 'authenticated'` + `tenant_id` custom claims vsem uzivatelum
3. Upravit `src/lib/supabase/client.js` — pridat `accessToken` callback
4. Napsat restriktivni RLS politiky na vsechny tabulky
5. Testovat RLS izolaci s ruznymu tenanty

**Proc:** Minimalni zmeny v existujicim kodu. Firebase Auth zustava, Supabase funguje s RLS.

**Faze 2 (Sprint 5+): Volitelna migrace na Supabase Auth**

1. Aktivovat existujici `SupabaseAuthProvider.jsx` stub
2. Migrace uzivatelu pres oficialni nastroje
3. Premapovani dat (Firebase UID → Supabase UUID)
4. Prepnuti auth provideru (`VITE_AUTH_PROVIDER=supabase`)

**Proc:** Dlouhodobe jednodussi architektura. Ale NENI nutne pro funkcni RLS.

### Co se MUSI zmenit v ModelPricer (Faze 1)

| Soubor | Zmena |
|--------|-------|
| `src/lib/supabase/client.js` | Pridat `accessToken` callback s Firebase JWT |
| `supabase/schema.sql` | Pridat restriktivni RLS politiky (issuer check) |
| `supabase/schema.sql` | Pridat tenant izolacni RLS politiky |
| Backend Cloud Function | `role: 'authenticated'` + `tenant_id` claim |
| Migracni skript | Nastavit claims existujicim uzivatelum |

### Co se NEMENI (Faze 1)

- `src/providers/FirebaseAuthProvider.jsx` — beze zmeny
- `src/context/AuthContext.jsx` — beze zmeny
- `backend-local/src/middleware/auth.js` — beze zmeny
- Frontend login/register flow — beze zmeny
- `src/utils/adminTenantStorage.js` — beze zmeny (storage adapter handluje Supabase)

---

## 8. Zdroje a citace

### Oficialni dokumentace (Context7)

1. **Supabase: Third-party Auth — Firebase**
   https://supabase.com/docs/guides/auth/third-party/firebase-auth
   - Kompletni guide pro Firebase JWT integraci
   - Restriktivni RLS politiky pro bezpecnost
   - Cloud Function pro nastaveni custom claims

2. **Supabase: Third-party Auth — Overview**
   https://supabase.com/docs/guides/auth/third-party/overview
   - Jak Supabase API trustuje third-party JWT

3. **Supabase: Custom Claims and RBAC**
   https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/custom-claims-and-role-based-access-control-rbac.mdx
   - Custom Access Token Hook pro pridani claims do JWT
   - `authorize()` funkce pro RLS

4. **Supabase: Token Security and RLS**
   https://supabase.com/docs/guides/auth/oauth-server/token-security
   - Pouziti `auth.jwt()` v RLS politikach

5. **Firebase: Custom Claims**
   https://firebase.google.com/docs/auth/admin/custom-claims
   - `setCustomUserClaims()` API reference
   - 1000 byte limit na claims

6. **Supabase: Migrate from Firebase Auth**
   https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth
   - Oficialni migracni nastroje

### Web zdroje (Brave Search)

7. **supabase-js PR #1004: Third-party auth support**
   https://github.com/supabase/supabase-js/pull/1004
   - Implementace `accessToken` parametru v `createClient`

8. **Queen Raae: JWT Exchange Pattern**
   https://queen.raae.codes/2025-05-01-supabase-exchange/
   - Alternativni pattern: exchange JWT za Supabase JWT

9. **Supabase Discussion #1148: Custom claims for multi tenancy**
   https://github.com/orgs/supabase/discussions/1148
   - Komunitni diskuze o multi-tenant claims

10. **DesignRevision: Supabase RLS Complete Guide (2026)**
    https://designrevision.com/blog/supabase-row-level-security
    - Komprehensivni guide vcetne multi-tenant patternu

11. **Authgear: Connect Supabase with any Auth Provider**
    https://www.authgear.com/post/supabase-any-auth-provider
    - Pattern pro mint Supabase-signed JWT z externiho provideru

---

> **Poznamka:** Tento research document je urcen pro implementacni agenty.
> Architektonicke rozhodnuti (ktery pristup zvolit) musi byt eskalovano na senior agenta.
