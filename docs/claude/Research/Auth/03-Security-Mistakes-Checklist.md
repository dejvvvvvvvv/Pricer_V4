# 03 — Vyzkum: Security Mistakes & Checklist

> **Datum:** 2026-02-20
> **Faze:** 3 ze 4 (Auth Research)
> **Ucel:** Zjistit jake chyby se nejcasteji delaji pri implementaci auth a jak se jim vyhnout

---

## 1. Top 20 nejcastejsich auth chyb

### CRITICAL (okamzite opravit pred jakymkoli nasazenim)

#### #1 — x-tenant-id header spoofing
**Nase:**  `backend-local/src/index.js:80-83` — `getTenantIdFromReq()` cte z headeru, fallback na `"demo-tenant"`.
**Riziko:** Kdokoli posle `curl -H "x-tenant-id: cizi-tenant"` a pristupuje k cizim datum.
**Prevence:** TenantId POUZE z overeneho JWT tokenu, nikdy z headeru.
**OWASP:** A01 Broken Access Control

#### #2 — Zadny auth middleware na backendu
**Nase:** Vsechny endpointy (`/api/presets`, `/api/slice`, `/api/storage/*`) jsou otevrene BEZ autentizace.
**Riziko:** Kdokoli muze pristupovat ke vsem API endpointum.
**Prevence:** Globalni `requireAuth` middleware pred vsemi chraneymi routami.
**OWASP:** A01 Broken Access Control

#### #3 — Admin panel bez autentizace
**Nase:** `Routes.jsx:86-89` — PrivateRoute ZAKOMENTOVANY. `/admin/*` routy nemaji zadnou ochranu.
**Riziko:** Kdokoli muze pristupovat k admin panelu, menit ceny, nastaveni, data.
**Prevence:** Odkomentovat PrivateRoute, obalit `/admin/*` routy.
**OWASP:** A07 Auth Failures

#### #4 — Client-side role checks bez backend overeni
**Nase:** Zadne role kontroly na backendu, vsechny admin operace jsou otevrene.
**Riziko:** Utocnik s DevTools nebo `fetch()` obchazi jakoukoli FE kontrolu.
**Prevence:** Kazdy admin endpoint MUSI overovat roli z JWT na backendu.
**OWASP:** A01 Broken Access Control

### HIGH (opravit pred BETA launchem)

#### #5 — Flash of unauthenticated content
**Nase:** Pri page refresh je auth state null po ~100-300ms → klientsky flash admin obsahu.
**Riziko:** Skripty v tom okne vidi admin data; spatny UX (blik loginu).
**Prevence:** Loading guard v PrivateRoute (uz mame, staci aktivovat).
**OWASP:** A07 Auth Failures

#### #6 — Auth tokeny v localStorage
**Nase:** Firebase SDK uklada tokeny do localStorage (default `browserLocalPersistence`).
**Riziko:** Jakekoliv XSS (zranitelna npm knihovna, CDN, `dangerouslySetInnerHTML`) precte tokeny.
**Prevence:** Access token v pameti (React state), refresh token v httpOnly cookie. Minimalne: CSP header.
**OWASP:** A02 Cryptographic Failures

#### #7 — Zadny rate limiting
**Nase:** Zadny rate limiting na zadnem endpointu, vcetne budoucich login/register.
**Riziko:** Brute-force na hesla, credential stuffing, DoS na `/api/slice` (CPU-narocny).
**Prevence:** `express-rate-limit` — 5 pokusu/10min pro login, 100 req/min pro API, 10/min pro slice.
**OWASP:** A07 Auth Failures

#### #8 — CORS misconfiguration
**Nase:** `backend-local/src/index.js:56-63` — podporuje `CORS_ORIGINS=*`, `!origin` = true pro curl.
**Riziko:** V produkci s `*` muze jakykoliv web delat authenticated requesty.
**Prevence:** Explicitni allowlist originu, ZADNE `*` v produkci.
**OWASP:** A05 Security Misconfiguration

#### #9 — JWT algorithm nebyl validovan
**Riziko:** `alg:none` utok, algorithm confusion (RS256 public key jako HS256 secret).
**Prevence:** Hardcoded `algorithms: ['RS256']` pri verify, nikdy nechavat token urcovat algoritmus.
**CVE reference:** CVE-2023-48223, CVE-2024-37568, CVE-2024-54150
**OWASP:** A02 Cryptographic Failures

#### #10 — Open redirect po loginu
**Nase:** Login pouziva `state.from` (bezpecne v React Router state), ale `searchParams.get('returnUrl')` by bylo zranitelne.
**Riziko:** Phishing — utocnik posle link `yourapp.com/login?returnUrl=evil.com`, po loginu se user presmeruje na evil.
**Prevence:** Validovat redirect URL — povolovat jen same-origin redirecty.
**OWASP:** A01 Broken Access Control

#### #11 — Session invalidation pri zmene hesla
**Riziko:** Po zmene hesla zustava stary token platny az do expirace. Utocnik s ukradenym tokenem ma pristup dal.
**Prevence:** Firebase: `admin.auth().revokeRefreshTokens(uid)`, Supabase: `signOut({ scope: 'global' })`.
**OWASP:** A07 Auth Failures

#### #12 — XSS pres dangerouslySetInnerHTML
**Riziko:** User-controlled data (branding, model names, objednavky) renderovane pres `dangerouslySetInnerHTML` = token theft.
**Prevence:** Nepouzivat `dangerouslySetInnerHTML` s user daty. Pokud nutne: DOMPurify. CSP header.
**OWASP:** A03 Injection

#### #13 — IDOR — zadna kontrola vlastnictvi
**Riziko:** Autentikovany user meni ID v requestu a pristupuje k datum jineho tenanta.
**Prevence:** Vsechny DB dotazy MUSI obsahovat tenantId jako soucast WHERE clausule.
**OWASP:** A01 Broken Access Control

#### #14 — Tokeny v URL parametrech
**Riziko:** Tokeny v URL se logi do browser history, server access logu, Referer headeru.
**Prevence:** Tokeny POUZE v Authorization header. Pro email linky: kratka expirace + single-use.
**OWASP:** A02 Cryptographic Failures

### MEDIUM (opravit v prvnim mesici po launchi)

#### #15 — Session fixation
**Riziko:** Utocnik nastavi znamou session pred loginem obeti.
**Prevence:** Po uspesnem loginu vzdy vygenerovat NOVY session/token. Firebase/Supabase to delaji automaticky.
**OWASP:** A07 Auth Failures

#### #16 — Expirace tokenu nekontrolovana na klientu
**Riziko:** User vidi confusing 401 errory misto clean re-auth promptu.
**Prevence:** Kontrolovat exp pred requestem, transparentni token refresh, clean UX.
**OWASP:** A07 Auth Failures

#### #17 — CSRF pri pouziti cookies
**Riziko:** Pokud pouzivame httpOnly cookie pro auth, externí web muze delat state-changing requesty.
**Prevence:** `SameSite=Strict` na cookie, validace Origin headeru na strane serveru.
**OWASP:** A01 Broken Access Control

#### #18 — Citliva data v health endpointu
**Nase:** `/api/health` vraci `workspaceRoot`, `projectRoot`, `backendRoot` — odhaluje filesystem.
**Prevence:** Public health jen `{ ok: true }`, detaily za autentizaci.
**OWASP:** A05 Security Misconfiguration

#### #19 — PostMessage bez origin validace (widget)
**Riziko:** Zly web posle craftovane postMessage do widget iframe → triggerne akce.
**Prevence:** Vzdy validovat `event.origin` proti whitelistu.
**OWASP:** A01 Broken Access Control

#### #20 — Invite/reset tokeny nejsou single-use
**Nase:** `/invite/accept` route je public, validace tokenu neni viditelna.
**Prevence:** `crypto.randomBytes(32)`, hash v DB, expirace 1h, single-use flag.
**OWASP:** A07 Auth Failures

---

## 2. Supabase-specificke bezpecnostni chyby

| # | Chyba | Severity | Prevence |
|---|-------|----------|----------|
| S1 | RLS vypnute (default v Supabase) | CRITICAL | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` na KAZDE tabulce |
| S2 | `user_metadata` v RLS policies | HIGH | Pouzivat `app_metadata` (jen server muze nastavit) |
| S3 | `service_role` key ve frontend kodu | CRITICAL | NIKDY v `VITE_*` env, jen server-side |
| S4 | Anon key s RLS vypleym | CRITICAL | Anon key je verejny, BEZ RLS = plny pristup |
| S5 | `supabase.auth.updateUser()` eskalace | HIGH | User muze menit `user_metadata` → nepouzivat pro role |

**Real-world pripad:** Moltbook (2026) — 1.5M API klicu leaknuto kvuli vypnutemu RLS. CVE-2025-48757 postihla 170+ Lovable-generovanych aplikaci.

---

## 3. Firebase-specificke bezpecnostni chyby

| # | Chyba | Severity | Prevence |
|---|-------|----------|----------|
| F1 | `.read: true, .write: true` pravidla | CRITICAL | Security Rules per-tenant s `auth.uid` |
| F2 | Custom claims nastavovane z klienta | HIGH | Jen pres Admin SDK (server-side) |
| F3 | `apiKey` zamena za secret | INFORMACNI | Firebase apiKey je VEREJNY, bezpecnost je v Rules |
| F4 | Neovereni `emailVerified` | MEDIUM | Kontrolovat `emailVerified` pred povolenim pristupu |

**Real-world pripad:** Vyzkumnici nasli 19.8M leaked secrets z Firebase misconfigurations.

---

## 4. Code Review Checklist pro auth kod

### Pri kazdem PR dotykajicim se auth:

| # | Kontrola | Severity |
|---|----------|----------|
| 1 | Zadne `localStorage`/`sessionStorage` pro auth tokeny | HIGH |
| 2 | JWT `algorithms` je hardcoded, ne z tokenu | CRITICAL |
| 3 | Kazda Supabase tabulka ma RLS enabled | CRITICAL |
| 4 | `user_metadata` neni v RLS policies | HIGH |
| 5 | TenantId z JWT, ne z request body/headeru | CRITICAL |
| 6 | CORS origin je explicitni allowlist | HIGH |
| 7 | Rate limiting na login/register/reset | HIGH |
| 8 | Auth middleware PRED route handlery v Express | HIGH |
| 9 | Password reset tokeny: `crypto.randomBytes(32)` | HIGH |
| 10 | Reset tokeny: expirace <= 60 minut | HIGH |
| 11 | `service_role` neni v zadnem `VITE_*` env | CRITICAL |
| 12 | Vsechny sessions invalidovany pri zmene hesla | HIGH |
| 13 | Chybove hlasky neprozrazuji existenci uzivatele | MEDIUM |
| 14 | `Host:` header neni pouzit pro konstrukci email URL | MEDIUM |
| 15 | `SameSite=Strict` na session cookies | MEDIUM |
| 16 | Zadne debug endpointy pristupne v produkci | MEDIUM |
| 17 | Supabase `service_role` jen v server-side kodu | CRITICAL |

---

## 5. Specificka rizika pro nas projekt (co uz ted delame spatne)

### CRITICAL — okamzite pred jakoukoli produkci

| # | Problem | Kde v kodu | Jak opravit |
|---|---------|-----------|-------------|
| 1 | **x-tenant-id spoofing** | `backend-local/src/index.js:80-83` | TenantId z JWT |
| 2 | **Zadny auth middleware** | `backend-local/src/index.js` — vsechny routy | Pridat globalní `requireAuth` |
| 3 | **Admin bez ochrany** | `Routes.jsx:86-89, 95-126` | Odkomentovat PrivateRoute |
| 4 | **Health endpoint odhaluje cesty** | `backend-local/src/index.js:66-76` | Odstranit filesystem paths |

### HIGH — pred BETA

| # | Problem | Kde v kodu | Jak opravit |
|---|---------|-----------|-------------|
| 5 | **CORS `*` podpora** | `backend-local/src/index.js:58` | Explicitni allowlist |
| 6 | **Zadny rate limiting** | Cely backend | `express-rate-limit` |
| 7 | **alert() v Account page** | `src/pages/account/index.jsx:201-212` | Toast system |
| 8 | **Mock data v Account** | `src/pages/account/index.jsx:172-184` | Real auth data |
| 9 | **Register 3-step wizard s rolemi** | `src/pages/register/index.jsx` | Zjednodusit na 1 formular |
| 10 | **Login redirect na /customer-dashboard** | `src/pages/login/index.jsx:12` | Zmenit na /admin |

---

## 6. Token storage — podrobne srovnani

### localStorage
- **Pro:** Jednoduche, prežije page refresh, funguje cross-tab
- **Proti:** JAKEKOLIV XSS precte tokeny. Firebase default — vyssi riziko.
- **Verdikt:** Prijatelne pro interni nastroje, NEBEZPECNE pro multi-tenant SaaS v produkci

### sessionStorage
- **Pro:** Automaticky se maze pri zavreni tabu
- **Proti:** Stejne XSS riziko jako localStorage. Nefunguje cross-tab.
- **Verdikt:** Lepsi nez localStorage, ale stale zranitelne

### httpOnly cookie
- **Pro:** JavaScript NEMUZE precist. Automaticky odesilane prohlizecem.
- **Proti:** Vyzaduje CSRF ochranu (SameSite pomaha). Vyzaduje backend endpoint pro set/refresh.
- **Verdikt:** **NEJBEZPECNEJSI** pro refresh tokeny v produkci

### Memory (React state / ref)
- **Pro:** Neni pristupne z XSS (neni v storage). Neni v DOM.
- **Proti:** Ztrata pri page refresh — nutny refresh token mechanismus.
- **Verdikt:** **NEJBEZPECNEJSI** pro access tokeny. S httpOnly refresh tokenem = idealni kombinace.

### DOPORUCENI PRO NAS PROJEKT
```
Access token:  Memory (React state) — krat-lived, 15 min
Refresh token: httpOnly cookie (SameSite=Strict, Secure, path=/auth/refresh)
"Remember me":  httpOnly cookie maxAge=7d vs session cookie (bez maxAge)
```

Firebase/Supabase SDK: handluji tokeny samy — pro volani na NAS backend pripojit token pres axios interceptor.

---

## 7. Penetracni testovaci checklist

### Pred kazdym releasem:

**Auth bypass testy:**
- [ ] JWT s `alg:none` → musi byt odmitnut
- [ ] JWT s tampered payload (zmena role/tenantId) → odmitnut
- [ ] Expirovan JWT → odmitnut
- [ ] Request bez Authorization headeru na chraneny endpoint → 401
- [ ] Request s platnym tokenem na cizi tenant data → 404 (ne 403 — neprozrazovat existenci)

**IDOR testy:**
- [ ] Autentizovat jako Tenant A, zkusit pristup k resource ID Tenanta B → 404
- [ ] Zmenit tenantId v request body → ignorovat, pouzit JWT tenantId
- [ ] Enumerace sekvencnich ID → pouzivat UUID v4 (ne v1 timestamp)

**Brute force testy:**
- [ ] 20+ login pokusu za 30s → rate limit po 5-10 pokusech
- [ ] Password reset brute force → rate limit + long token
- [ ] API endpoint flooding → rate limit

**CORS testy:**
- [ ] Request s `Origin: https://evil.com` → response NEMA `Access-Control-Allow-Origin: evil.com`

**Session testy:**
- [ ] Login → capture token → logout → stary token → odmitnut
- [ ] Login → zmena hesla → stary token → odmitnut
- [ ] Session pred loginem → po loginu NOVY token

---

## 8. Monitoring & Alerting (pro produkci)

| Alert | Threshold | Severity | Reakce |
|-------|-----------|----------|--------|
| Neuspesne loginy per IP | >10/5min | HIGH | Blokovat IP |
| Neuspesne loginy per ucet | >5 po sobe | HIGH | Zamknout ucet |
| Login z nove zeme | 1 event | MEDIUM | Email uzivateli |
| Password reset spike | >50/hodinu | HIGH | Alert on-call |
| JWT validation failures | >100/5min | CRITICAL | Mozny token forging |
| Cross-tenant pristup pokus | 1 event | CRITICAL | Okamzite vysetrovani |
| `service_role` usage z browser IP | 1 event | CRITICAL | Rotovat klic okamzite |

---

*Dokument vytvoren: 2026-02-20*
*Zdroje: OWASP Top 10 (2021), PortSwigger JWT Academy, HackerOne IDOR reports, CVE-2023-48223, CVE-2024-37568, CVE-2025-48757, Moltbook breach, Firebase 19.8M secrets leak, Okta/Cloudflare/Snowflake/Dropbox breaches 2024*
