# 20. Auth a bezpecnost — Detailni RoadMap Plan

> **Stav:** 🟠 15% hotovo | **Priorita:** VYSOKA
> **Zavislosti na jine sekce:** ZADNE (zakladni prerekvizita)
> **Kdo na nem zavisi:** VSECHNY admin stranky, API, Tenant izolace, Team (#23), RBAC, Supabase RLS (#27)

---

## Prehled

Autentizacni a autorizacni system projektu. Firebase Auth je nasazen, ale PrivateRoute je ZAKOMENTOVANY — admin panel je aktualne verejne pristupny bez prihlaseni. Backend nema zadnou autentizaci.

**Klicove soubory:**
- `src/contexts/AuthContext.jsx` — React context s Firebase Auth
- `src/hooks/useAuth.js` (nebo v AuthContext)
- `src/components/PrivateRoute.jsx` — route guard (ZAKOMENTOVANY v Routes.jsx)
- `src/Routes.jsx` — kde je PrivateRoute zakomentovany
- `src/pages/login/` — login stranka
- `src/pages/register/` — registrace
- `backend-local/` — BEZ auth middleware

---

## Co je HOTOVO (✅)

### Firebase Auth zaklad (65%)
- [x] Firebase projekt nastaven
- [x] `AuthContext` s Firebase Auth provider
- [x] `useAuth()` hook — pristup k user objektu, login, logout, register
- [x] Login stranka (email + heslo)
- [x] Register stranka
- [x] `PrivateRoute` komponenta existuje (ale je zakomentovana!)
- [x] Forge dark theme na login/register

---

## Co CHYBI / je potreba dodelat

### Faze 1: Zapnout PrivateRoute (Priorita: KRITICKA) ⚡

#### Ukol 1.1: Odkomentovat PrivateRoute v Routes.jsx
- **Soubor:** `src/Routes.jsx`
- **Co udelat:**
  - [ ] Najit zakomentovane `<PrivateRoute>` wrappery kolem admin routes
  - [ ] Odkomentovat je
  - [ ] Overit ze PrivateRoute redirectne na /login pokud uzivatel neni prihlasen
  - [ ] Otestovat ze po prihlaseni se uzivatel dostane zpet na admin
  - [ ] Overit ze verejne routes (home, pricing, support, calculator, widget) ZUSTAVI verejne
- **Ocekavany rozsah:** 5-10 radku zmeny
- **DULEZITE:** Toto je JEDNORADKOVA zmena s OBROVSKYM dopadem na bezpecnost

#### Ukol 1.2: Overit redirect flow
- **Co udelat:**
  - [ ] Neprihlasen → pristup k /admin/* → redirect na /login
  - [ ] Po prihlaseni → redirect zpet na puvodni admin URL
  - [ ] Prihlasen → pristup k /login → redirect na /admin/dashboard
  - [ ] Logout → redirect na /login

### Faze 2: API autentizace (Priorita: VYSOKA)

#### Ukol 2.1: Firebase Admin SDK na backendu
- **Soubor:** `backend-local/` (novy middleware soubor)
- **Co udelat:**
  - [ ] Instalovat `firebase-admin` npm balicek
  - [ ] Inicializovat Firebase Admin s service account (env variable)
  - [ ] Vytvorit auth middleware:
    ```javascript
    // middleware/auth.js
    const admin = require('firebase-admin');

    async function authMiddleware(req, res, next) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing auth token' });
      }
      try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        req.tenantId = decoded.uid; // nebo custom claim
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid auth token' });
      }
    }
    ```
  - [ ] Aplikovat middleware na vsechny `/api/*` endpointy (krome /api/health)
- **Poznamka:** Na Cloud Run/Cloud Functions bude stejna logika

#### Ukol 2.2: Pridani Authorization headeru na frontendu
- **Soubor:** Fetch/API utility (nebo kazdy API call)
- **Co udelat:**
  - [ ] Vytvorit `apiClient` utility ktery automaticky pridava token:
    ```javascript
    import { getAuth } from 'firebase/auth';

    async function apiCall(url, options = {}) {
      const user = getAuth().currentUser;
      if (user) {
        const token = await user.getIdToken();
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      return fetch(url, options);
    }
    ```
  - [ ] Nahradit vsechny primo `fetch('/api/...')` za `apiCall('/api/...')`
- **Ocekavany rozsah:** 1 novy soubor + upravy v kazdem API volani

### Faze 3: Tenant izolace (Priorita: VYSOKA)

#### Ukol 3.1: Dynamicky tenant ID z auth
- **Co udelat:**
  - [ ] Tenant ID = Firebase Auth UID (nejjednodussi varianta)
  - [ ] NEBO: Custom claim `tenantId` v Firebase Auth tokenu (flexibilnejsi — vice uzivatelu muze patrit ke stejnemu tenantu)
  - [ ] Nastavit `getTenantId()` v `adminTenantStorage.js` aby vracel tenant z auth misto hardcoded hodnoty
- **? OTAZKA:** Ma tenant ID byt Firebase UID (1 uzivatel = 1 tenant) nebo custom claim (vice uzivatelu v jednom tenantu)?
  - Pro Beta: UID staci (1 uzivatel = 1 firma)
  - Pro budoucnost: custom claim (team management)

#### Ukol 3.2: Storage migrace na novy tenant ID
- **Co udelat:**
  - [ ] Aktualni data v localStorage jsou pod `modelpricer:test-customer-1:*`
  - [ ] Po prihlaseni prvniho uzivatele: migracni skript ktery prekopiruje data z `test-customer-1` na novy tenant ID
  - [ ] Jednorazova migrace s potvrzenim
- **DULEZITE:** Bez migrace by firma ztratila vsechna nastaveni!

#### Ukol 3.3: Backend tenant kontrola
- **Co udelat:**
  - [ ] Kazdy API endpoint pouziva `req.tenantId` (z auth middleware)
  - [ ] Data se filtruje/uklada pod tenant klicem
  - [ ] Supabase RLS pouziva tenant z JWT (viz #27)

### Faze 4: RBAC — zakladni role (Priorita: STREDNI)

#### Ukol 4.1: Jednoduchy role system
- **Co udelat:**
  - [ ] Firebase Auth custom claims: `role: 'owner' | 'editor' | 'viewer'`
  - [ ] Owner — plny pristup
  - [ ] Editor — muze menit konfigurace ale ne team/billing
  - [ ] Viewer — jen cteni
  - [ ] Nastavovani roli pres Cloud Functions (bezpecne, ne z frontendu)

#### Ukol 4.2: Frontend role checks
- **Co udelat:**
  - [ ] `useAuth()` hook vraci i `role`
  - [ ] Komponenta `<RequireRole role="owner">` — skryje obsah pro nizsi role
  - [ ] Disabled stavy pro editacni prvky u viewer role
  - [ ] Menu filtr — viewer nevidi Team, Billing

#### Ukol 4.3: Backend role checks
- **Co udelat:**
  - [ ] Middleware `requireRole('owner')` pro citlive endpointy
  - [ ] Stripe/billing endpointy — jen owner
  - [ ] Team management — jen owner
  - [ ] Konfigurace (pricing, fees atd.) — owner + editor
  - [ ] Cteni dat — vsechny role

### Faze 5: Security hardening (Priorita: VYSOKA pro produkci)

#### Ukol 5.1: CORS zprisneni
- **Co udelat:**
  - [ ] Backend CORS — jen povolene originy (ne `*`)
  - [ ] Seznam originu: localhost (dev), Firebase domain, custom domain
  - [ ] Dynamicky CORS z env variables

#### Ukol 5.2: Security headers
- **Co udelat:**
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options (krome widget route)
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Strict-Transport-Security (HSTS)

#### Ukol 5.3: Rate limiting
- **Co udelat:**
  - [ ] Rate limiting na API endpointy
  - [ ] Zvlast pro slicing (narocny) — napr. 10 req/min
  - [ ] Zvlast pro CRUD — napr. 100 req/min
  - [ ] IP-based + tenant-based limiting

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 1: Zapnout PrivateRoute | 1h | Zadne | KRITICKA |
| 2 | Faze 2: API auth | 4-6h | Firebase Admin SDK | VYSOKA |
| 3 | Faze 3: Tenant izolace | 3-5h | Faze 2 | VYSOKA |
| 4 | Faze 4: RBAC | 4-6h | Faze 2, 3 | STREDNI |
| 5 | Faze 5: Security | 3-4h | Faze 2 | VYSOKA (prod) |

**Celkem pro Beta:** ~12-22 hodin
**Minimalne pro Beta:** Faze 1 + 2 + 3 = ~8-12 hodin

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| PrivateRoute rozbije existujici flow | Nizka | Vysoky | Testovat vsechny routes |
| Ztrata dat pri tenant migraci | Stredni | Kriticky | Backup pred migraci |
| Token expiruje a API zacne failovat | Stredni | Stredni | Auto-refresh tokenu v apiClient |
| RBAC prilis komplexni | Stredni | Nizky | Pro Beta jen owner/viewer |

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/Routes.jsx` | Odkomentovat PrivateRoute | Maly |
| `backend-local/middleware/auth.js` | NOVY — auth middleware | Stredni |
| `src/utils/apiClient.js` | NOVY — auth fetch wrapper | Maly |
| `src/utils/adminTenantStorage.js` | Dynamicky tenant z auth | Stredni |
| `src/contexts/AuthContext.jsx` | Pridani role | Maly |
| `backend-local/` vsechny endpointy | Pridani auth middleware | Stredni |

---

## Kriticke doplnky (z review)

### Session management
- [ ] Token refresh — Firebase ID tokeny expirujou po 1 hodine → automaticky refresh
- [ ] `apiClient` musi volat `user.getIdToken(true)` pro force refresh kdyz dostane 401
- [ ] Logout ze vsech zarizeni (Firebase revoke refresh tokens)
- [ ] Session timeout — po 30min neaktivity odhlasit

### Password policy
- [ ] Minimalni delka hesla (8+ znaku)
- [ ] Firebase Auth uz ma zakladni pravidla, ale muzeme pridat vlastni
- [ ] "Zapomenute heslo" flow — overit ze funguje

### Migrace dat — detailnejsi plan
- [ ] PRED zapnutim PrivateRoute: udelat backup localStorage dat
- [ ] Migracni skript:
  1. Uzivatel se popre prihlasi
  2. System detekuje `test-customer-1` data v localStorage
  3. Nabidne migraci: "Nalezena existujici data, chcete je prevzit?"
  4. Po potvrzeni: prekopiruje data pod novy tenant key (Firebase UID)
  5. Stara data nesmaze (jen oznaci jako migrovana)
- [ ] Edge case: co kdyz se dva uzivatele prihlasi na stejnem pocitaci? (localStorage je sdileny)
  - Reseni: localStorage je per-device, kazdy tenant vidi jen sva data pres `getTenantId()`

### Verejne vs. privatni routes — presna mapa
- [ ] VEREJNE (bez auth):
  - `/` (home), `/pricing`, `/support`, `/login`, `/register`
  - `/calculator` (demo — ale s omezenimi?)
  - `/w/:publicWidgetId` (widget — musi zustat verejny!)
  - `/model-upload` (upload stranka)
- [ ] PRIVATNI (vyzaduji auth):
  - `/admin/*` — vsechny admin stranky
  - `/account` — uzivatelsky ucet
  - `/admin/migration` — migracni nastroj
- [ ] SEMI-PRIVATNI (otazka):
  - `/calculator` — je demo kalkulacka verejna nebo vyzaduje prihlaseni?
  - **? OTAZKA:** Ma byt test-kalkulacka verejna (pro demo) nebo privatni (jen pro prihlasene)?

---

## Poznamky

- **KRITICKE:** Admin je aktualne VEREJNY — kdokoli muze pristupovat k `/admin/*` bez prihlaseni
- **KRITICKE:** API je aktualne BEZ auth — kdokoli muze volat vsechny endpointy
- **DULEZITE:** Faze 1 (PrivateRoute) je JEDNORADKOVA zmena — udelat HNED
- **DULEZITE:** Migrace dat z `test-customer-1` na novy tenant ID musi byt jednorazova a bezpecna
- **? OTAZKA:** Tenant ID = Firebase UID nebo custom claim? (Pro Beta staci UID)
- **? OTAZKA:** Ma byt test-kalkulacka verejna (pro demo) nebo privatni?
