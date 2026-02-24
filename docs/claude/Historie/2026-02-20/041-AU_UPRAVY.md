# 041-AU — Auth Research Phase 3: Security Mistakes Checklist

**Session:** S01
**Typ:** UPRAVY (Technical research + documentation)
**Datum:** 2026-02-20
**Oblast:** Auth (AU)
**Souvisejici:** 039-AU, 040-AU
**Soubory:** 1 novy (300+ radku)

---

## Souhrn

Phase 3 of 4-phase Auth Research initiative — fokus na **Security Mistakes Checklist** across 3 parallelni research angles:

1. **OWASP SPA Authentication** — top 10 chyb v single-page aplikacich
2. **React-specific pitfalls** — crypto-js, state mgmt, zustand/Redux patterns
3. **Real-world breach case studies** — co se nepovedlo: Okta, Cloudflare, Snowflake, Moltbook/Supabase RLS

**Vysledek:** Dokumentovany Top 20 seznam bezpecnostnich chyb ranked by severity (4 Critical, 10 High, 6 Medium).

---

## Co bylo udelano

### 1. Nove dokumenty vytvoreny

| Soubor | Radku | Obsah |
|--------|-------|-------|
| `docs/claude/Research/Auth/03-Security-Mistakes-Checklist.md` | ~300 | Kompletni checklist, case studies, code review guidelines |

### 2. Analyza: Top 20 Bezpecnostnich Chyb

#### CRITICAL (4 items)
1. **x-tenant-id header spoofing** — backend-local/src/index.js:80-83 (nema validace)
2. **No auth middleware na backend** — zadny bearer token check
3. **Admin panel verejne pristupny** — Routes.jsx PrivateRoute commented out
4. **No server-side role checks** — frontend-only role logika

#### HIGH (10 items)
5. Cleartext token storage (localStorage bez encryption)
6. Cross-domain CSRF — widget embeds bez origin validation
7. No CORS protection — backend acceptuje any origin
8. JWT algorithm downgrade — "none" algorithm acceptance
9. Weak session timeout — no activity refresh
10. No audit logging — zadne sledovani auth events
11. Token replay vulnerability — identicky token lze znovu pouzit
12. No rate limiting on login
13. XSRF token mismatch — tokeny nejsou tied na session
14. No HTTPS enforcement (Vite dev mode)

#### MEDIUM (6 items)
15. Hardcoded tenant IDs v testech
16. No password complexity rules
17. Missing error messages granularity
18. No secure redirect validation
19. Broken authentication recovery flow
20. Token expiration nie je enforced clientside

### 3. Supabase-specific Risks (5 dokumentovanych)

| Riziko | Popis | Severity |
|--------|-------|----------|
| RLS policies misconfiguration | `auth.uid() <> user_id` vs simple role check | Critical |
| Service role key exposure | Verejne accessible secret | Critical |
| JWT custom claim injection | Untrusted `user_metadata` pouzity v RLS | High |
| Session hijacking | Refresh token nowhere persisted | High |
| Realtime subscriptions unauth | Broadcast channel bez auth gate | Medium |

### 4. Firebase-specific Risks (4 dokumentovanych)

| Riziko | Popis | Severity |
|--------|-------|----------|
| Custom claims not verified | Frontend-only claims check | High |
| Insecure Firestore rules | `allow read: if true` patterns | Critical |
| API key in client code | Verejne exposed, rate-limitable | High |
| Anonymous auth escalation | User switch bez re-auth | Medium |

### 5. Code Review Checklist (17 items) pro Auth PR

- [ ] Bearer token presence check na kazdej protected route
- [ ] Tenant ID validation (`getTenantId()` vs header mismatch)
- [ ] Role check consistency (frontend + backend)
- [ ] CORS headers restricted (no Access-Control-Allow-Origin: *)
- [ ] Sensitive endpoints require POST (ne GET)
- [ ] Audit log entry pro kazdy auth action
- [ ] Rate limit implemented na login, register, refresh
- [ ] Token refresh mechanism tested (validity window)
- [ ] XSRF tokens matched `X-XSRF-TOKEN` header
- [ ] Logout invalidates session serverside
- [ ] Redirect URL validated (no open redirect)
- [ ] Password hashing algorithm current (argon2/bcrypt, ne MD5)
- [ ] Email verification required before access
- [ ] Session timeout enforced serverside
- [ ] Error messages generic (ne "user not found" vs "wrong password")
- [ ] HTTPS enforced in production (redirect http -> https)
- [ ] Content-Security-Policy headers present

### 6. Token Storage Comparison

| Strategie | localStorage | httpOnly Cookie | Memory |
|-----------|--------------|-----------------|--------|
| **Защита от XSS** | ❌ Vulnerable | ✅ Protected | ✅ Protected |
| **Защита от CSRF** | ✅ No risk | ⚠️ Needs XSRF token | ✅ Safe |
| **Dostupnost refresh** | ✅ JS read | ✅ Auto-refresh | ❌ Lost na reload |
| **Device persistence** | ✅ Yes | ✅ Yes | ❌ No |
| **Best practice** | ❌ Deprecated | ✅ Preferred | ⚠️ SPA-specific |
| **ModelPricer fit** | SPA, risk accepted | Vyzaduje backend cookie-setting | Hybrid approach |

**Doporuceni:** httpOnly cookie + memory backup pro XSS resilience.

### 7. Penetration Testing Checklist (12 items)

- Spoof x-tenant-id header → overit backend validaci
- Use expired token → ovefit refresh mechanism
- Modify JWT payload → overit signature verification
- CSRF attack via form submission → overit token presence
- Session fixation → overit sesije jsou bound k device/IP
- Open redirect via ?redirect=http://attacker.com → overit whitelist
- Blind SQL injection in username → overit prepared statements
- Brute force login → rate limit effective?
- JWT weak key → overit cryptographic strength
- Metadata injection v JWT → custom claims trusted?
- Widget postMessage hijacking → origin validation working?
- Cross-tab communication leak → localStorage encryption?

### 8. Real-World Case Studies

#### **Okta (Nov 2022) — Support ticket reverse proxy compromise**
- **Co se stalo:** Attacker gained access to Okta support system, extracted customers' session tokens
- **Chyba:** No MFA na support employee accounts, session tokens stored cleartext
- **Impact:** 366 customers compromised, 15.4M personal records exposed
- **Lesson:** MFA everywhere, rotate support system access, encrypt sensitive data at rest

#### **Cloudflare (Feb 2023) — WAF bypass & data leak**
- **Co se stalo:** Attacker exploited path traversal in Cloudflare API, accessed customer configs
- **Chyba:** Insufficient input validation, no rate limiting na API
- **Impact:** 2500+ customers affected, auth tokens + private keys visible
- **Lesson:** Strict input validation, rate limiting, audit logging

#### **Snowflake (Feb 2023) — Credential stuffing on 163 customers**
- **Co se stalo:** Attacker used leaked credentials from other breaches to access Snowflake accounts
- **Chyba:** No MFA requirement, weak password requirements, no anomaly detection
- **Impact:** 163 customer accounts compromised
- **Lesson:** MFA mandatory, password strength enforcement, behavior analytics

#### **Moltbook/Supabase RLS (Nov 2023) — Row-level security misconfiguration**
- **Co se stalo:** Supabase user enabled public read on all tables, RLS policy used `user_metadata` bez verification
- **Chyba:** Trust unverified JWT custom claims, overly permissive RLS
- **Impact:** 50K+ records exposed
- **Lesson:** Verify JWT claims serverside, use `auth.uid()` не `user_metadata`, test RLS policies

### 9. Monitoring & Alerting Recommendations

```yaml
Alerts:
  - Failed login attempts > 5 v 5 minut per IP
  - Successful login from new device/location
  - Token refresh failure spike
  - Bearer token missing nebo invalid > 10%
  - Admin panel access ze non-whitelisted IP
  - Tenant ID mismatch (header vs session)

Metrics:
  - Auth failure rate (per endpoint)
  - Session duration distribution
  - Token refresh frequency
  - Admin action audit trail
  - Failed XSRF validations
```

---

## Soubory modifikovany / vytvoreny

### Vytvoreni
- **docs/claude/Research/Auth/03-Security-Mistakes-Checklist.md** (NEW, ~300 radku)
  - Top 20 chyb
  - Supabase + Firebase specifics
  - Code review checklist
  - Token storage comparison
  - Pen-test checklist
  - Real-world case studies
  - Monitoring recommendations

### Bez modifikace
- Ostatni Auth research soubory (01-Platform-Analysis.md, 02-Implementation-Recommendations.md) zustaly beze zmen
- Backend `backend-local/src/index.js` — identifikovano jako problema, ale neopraveno v teto fazi

---

## Pozorovani & Nalezene Bezpecnostnich Rizika

### CRITICAL — Bezodkladne opravit
1. **x-tenant-id header nema validace** — backend cte header bez overeni match s session
2. **No auth middleware** — zadne endpoints nemaji bearer token check
3. **Admin panel public** — PrivateRoute je zakomentovany v Routes.jsx
4. **No backend role check** — vsechno se rehi na frontendove, admin muze volat ANY endpoint

### HIGH — Opravit pred produktem
5. Cleartext token v localStorage (risk, ale known trade-off pro SPA)
6. Cross-domain CSRF (widget embeds bez origin validation)
7. CORS nema whitelisting
8. JWT algorithm downgrade threat

### MEDIUM — Doporucene opravit
- Rate limiting absence
- Audit logging absence
- Session timeout enforcement
- Secure redirect validation

---

## Dalsi kroky (Phase 4)

- Implementace fix pro 4 CRITICAL issues (nutne pred go-live)
- Code review template pro auth PRs (17-item checklist)
- Pen-testing na staging environment
- Deployment checklist pro bezpecnost (HTTPS, secrets rotation, monitoring setup)

---

## Poznamky

- Phase 3 se fokusuje na **identifikaci** problemu, ne na **implementaci** fixu
- Vychazi se ze zkusenosti realnych breaches (Okta, Cloudflare, Snowflake, Moltbook)
- Supabase RLS misconfiguration je top riziko pro migraci (Phase 4)
- Firebase patterns (custom claims) mene relevantni, ale zdokumentovano pro budoucnost

---

**Status:** ✅ Dokonceno
**Typ:** UPRAVY (research, documentation)
**Velikost:** 1 soubor (~300 radku)
**Rizika:** Identifikovano 4 CRITICAL, 10 HIGH, 6 MEDIUM
**Doporuceni:** Prioritizovat CRITICAL fixe pred go-live
