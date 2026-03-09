# MASTER-HISTORIE — ModelPricer Historie

**Centralny index** vsech zaznamu. Index je setrideny podle data a ID.

---

## 2026-02-24

### S01: Sprint 1 Auth Bugfixy — FINAL

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **001-AU** | 2026-02-24 | UPRAVY | AU | Sprint 1 Auth Bugfixy FINAL — 3 bugy opraveny | 11 | Bug 1: Google Sign-In error handling; Bug 2a: Auth headery v service souborech; Bug 2b: Backend .env |
| **002-AU** | 2026-02-24 | UPRAVY | AU | Sprint 1 Auth Bugfixy Faze 5 — Backend .env + Dokumentace | 4 | .env: FIREBASE_PROJECT_ID; Docs: Login, Register, Backend-Server aktualizovany |

### S03: Sprint 2 Faze 2-3-5 — Kontrolni Kroky + Profile + Company Tab

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **045-FE** | 2026-02-24 | FAZE2 | FE | Sprint 2 Faze 2 — Kontrolni kroky + Build verify | 0 | Build PASS (56.8s), Chrome offline, pripravenost na Fazi 3 |
| **046-AC** | 2026-02-24 | UPRAVY | AC | Sprint 2 Faze 3 — Profile Tab s Realnym Daty | 1 | useAuth() + useNotification(); validace firstName, lastName, phone; Email readOnly; Save button s loading |
| **047-AC** | 2026-02-24 | UPRAVY | AC | Sprint 2 Faze 5 — Company Tab s Realnym Ulozenim Dat | 2 | adminCompanyStorage.js (novy), namespace company:v1; Validace ICO/DIC/PSC/companyName; Country select; Save+Cancel handlery s toast |
| **048-AC** | 2026-02-24 | UPRAVY | AC | Sprint 2 Faze 7+9 — Security (changePassword) + Billing (subscription+i18n+a11y) | 10 | FirebaseAuthProvider.changePassword, Security tab s reauth a error mapping, Billing tab s planConfig, ARIA opravy, React.memo extract |
| **049-AC** | 2026-02-24 | FINALIZACE | AC | **Sprint 2 KOMPLETNE HOTOVO** — 5 ukolu implementovano, 10 souboru zmen | **10** | **Sprint 2 Summary:** Toast system (S2.1) + Profile tab realdata (S2.2) + Company storage (S2.3) + Security changePassword (S2.4) + Billing subscription (S2.5); Build PASS (43s); MEMORY+Docs aktualizovany; 3 Middle agenti + 1 Specific |

---

## 2026-02-25

### S01: Per-User Tenant Izolace — Faze 1+3+5 (Core + Auth + Cleanup)

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **050-ST** | 2026-02-25 | UPRAVY | ST | Per-User Tenant Izolace — Core storage + Auth binding + Hardcoded cleanup | 15 | Faze 1: setTenantId/clearTenantId; Faze 3: Firebase profil + auth state; Faze 5: 13 hardcoded cleanup; Build PASS |

---

## 2026-02-26

### S03: Widget Builder + Forge Design System Testovani

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **089-WB** | 2026-02-26 | TESTY | WB | Widget Builder + Forge Design — Browser Testing | 0 | 14 testu PASS (5 straniek + 9 visual checks); Build PASS 3023 modules; Teal #00D4AA, Space Grotesk, IBM Plex Sans; P1 Embed tab dual-mode fixed; P2 Builder route auth open |

---

## 2026-03-05

### S01: Orders Page Bug Fixes

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **091-BU** | 2026-03-05 | UPRAVY | BU | Orders Page Fixes — Ceny + Rozmery + Layout | 2 | Bug 1: File ID typ mismatch (Number vs String); Bug 2: dimensions_xyz chybelo v slicer_snapshot; Bug 3: Textarea + button layout bez flex |

---

## 2026-02-27

### S01: MCP Server Research & Installation + Vercel Migration Planning

| ID | Datum | Typ | Zkratka | Nazev | Soubory | Pozn. |
|----|-------|-----|---------|-------|---------|-------|
| **090-MC** | 2026-02-27 | UPRAVY | MC | MCP Server Installation (P0+P1: Firebase, GitHub, Stripe, Sentry, Vercel) | 2 | Vyzkum 5 agentu paralelne; P0 instalace (Firebase, GitHub, Stripe); P1 instalace (Sentry, Vercel); Detailni Vercel analyza (pricing, features, migrace); GitHub PAT token; Follow-up: Ubuntu backend, Cloud Run vs Fly.io, API proxy, timeline |
| **091-VM** | 2026-02-27 | KONVERZACE | VM | Vercel Migration Plan — Cast 1 + Cast 2 (User Q&A + Simple Explanations) | 2 | Backend na Ubuntu (zdarma, SSH limit), Cloud Run vs Fly.io (srovnani), API Proxy (jednoduche vysvetleni VITE_API_URL), 4-faze plan (30+30+60+30 min). Rozhodnuti: Ubuntu + Vercel + VITE_API_URL. Ulozeni: Plan (PLANS/), Historia (090-MCP-KONVERZACE-CAST2.md) |

---

## Navi & Links

- **ID-REGISTRY:** `docs/claude/Historie/ID-REGISTRY.md` — seznam zkratek + globalni pocitadlo
- **SABLONY:** `docs/claude/Historie/SABLONY/` — 4 sablony pro nove zaznamy
- **Denni slozky:** `docs/claude/Historie/{YYYY-MM-DD}/` — jednotlive zaznamy (UPRAVY.md, KONVERZACE.md, atd.)

---

## Popis zaznamu

**090-MC — MCP Server Installation (P0+P1)** (2 soubory zmen)

- **P0 Instalace (3 servery):**
  - Firebase: stdio, `npx firebase-tools` (--only firestore,auth) — Firestore Admin API + Auth token verification
  - GitHub: stdio, `npx @modelcontextprotocol/server-github` (PAT token) — Repository management, issues, PRs
  - Stripe: HTTP OAuth, `https://mcp.stripe.com` — Payment processing, customer management

- **P1 Instalace (2 servery):**
  - Sentry: HTTP OAuth, `https://mcp.sentry.dev/mcp` — Error monitoring, releases, performance tracking
  - Vercel: HTTP OAuth, `https://mcp.vercel.com` — Deployment automation, environment variables, analytics

- **P2 Deferred (2 servery):**
  - Cloudflare: Edge computing, DDoS protection
  - Docker: Containerization

- **Zmeny:**
  - `.mcp.json` — pridano 5 novych MCP serveru (stdio/HTTP OAuth)
  - `.claude/settings.local.json` — pridany wildcard permissions a enabledMcpjsonServers seznam
  - `MEMORY.md` — dokumentace MCP serveru

- **GitHub Account:** Osobni account uzivatele (Hobby plan compatible), PAT token ulozeno bezpecne
- **Vercel Account:** Zatim nema — vytvori si, kdyz bude chtit migrovat frontend
- **Backend Architecture:** Frontend na Vercel (serverless), Backend na Cloud Run/Fly.io (containerized)

- **Research:** 5 paralelních agentu provedu kapsmle research; výsledky zakomponovány do P0/P1 vyberu
- **Follow-up otazky:** Ubuntu server, Cloud Run vs Fly.io, API proxy, Vercel migration timeline

**001-AU — Sprint 1 Auth Bugfixy FINAL** (11 souboru)

- **Bug 1:** Google Sign-In error handling — try/catch kolem setDoc() v loginWithGoogle() a register(), console.error
- **Bug 2a:** Auth headery v service souborech (presetsApi, slicerApi, storageApi) — auth token pres window.__authGetToken()
- **Bug 2b:** Backend .env — pridano FIREBASE_PROJECT_ID
- **Dokumentace:** Login, Register, Backend-Server aktualizovany

**002-AU — Sprint 1 Auth Bugfixy Faze 5** (4 soubory)

- **Backend config:** `.env` — pridano `FIREBASE_PROJECT_ID=model-pricer` pro Admin SDK token verifikaci
- **Dokumentace Login:** Aktualizovano — zmeny Google error handling + auth header
- **Dokumentace Register:** Aktualizovano — zmeny Google error handling + auth header
- **Dokumentace Backend:** Aktualizovano — nova env promenna v tabulce
- **Kontext:** Faze 5 doplnila backend config a dokumentaci pro kompletni auth system

**046-AC — Sprint 2 Faze 3** (1 soubor)

- **Profile tab realtime:** useAuth() pro current user data, useNotification() pro toast
- **Validace:** firstName, lastName, phone s minimalnimi pozadavky
- **Email field:** readOnly (pripojen k Firebase auth, nemeni se zde)
- **Kontext:** Faze 3 oddelila profile data od ostatnich (company, team budou v Fazi 5/6)

**047-AC — Sprint 2 Faze 5** (2 soubory)

- **Novy storage helper:** `adminCompanyStorage.js` — namespace `company:v1` s funkcemi getDefaultCompanyData(), readCompanyData(), writeCompanyData()
- **Company tab napojeni:** Lazy init companyData z readCompanyData(), state companyData + companyValidation + companySaving
- **Validacni pravidla:** ICO presne 8 cislic, DIC CC+8-10 cislic, PSC 5 cislic, companyName min 2 znaky
- **Country select:** Bilingualni labels (CZ/SK/PL/DE/AT) s value kody
- **Handlery:** handleSaveCompany (try/catch + writeCompanyData + toast), handleCancelCompany (revert na ulozena data)
- **Save button:** Disabled pri loading, spinner zobrazen
- **Kontext:** Faze 5 doplnila Company tab do Account stranky s realnym tenant-scoped ulozenim

**048-AC — Sprint 2 Faze 7+9** (10 souboru)

- **Security Tab (Faze 7):** changePassword() z FirebaseAuthProvider s reauthentikaci; Google-only detekce; per-field validace (sila hesla >=75%, shoda); Firebase error mapping (wrong-password, invalid-credential, weak-password, requires-recent-login, too-many-requests); Toast feedback
- **Billing Tab (Faze 9):** subscriptionData z readTenantJson('subscription:v1'); planConfig s cenami (Starter 499Kc/$20, Professional 1999Kc/$80, Enterprise custom); Empty states pro invoices/payments
- **ARIA opravy:** role=tablist, role=tab, aria-selected, role=tabpanel, aria-labelledby; zcela WCAG AA
- **React.memo extraction:** FormInput a Card komponenty na module scope s React.memo (optimalizace renderu)
- **Nove preklady:** billing.plan.active, billing.plan.custom, billing.payment.none, billing.history.none
- **Novy Toast system:** NotificationContext + ToastContainer (Framer Motion AnimatePresence); integrovan do App.jsx
- **Backend storage:** adminCompanyStorage.js (novy); NotificationContext, ToastContainer (nove casti)
- **Build:** PASS (43s)
- **Kontext:** Faze 7+9 uzavira Sprint 2 finalizaci; vsechny 5 S2 ukoly (S2.1-S2.5) jsou DONE; zbyva jen dokumentace a commit

**049-AC — Sprint 2 KOMPLETNE HOTOVO** (10 souboru zmen)

- **Sprint 2 Summary:** Kompletni realizace 5 ukolu:
  - S2.1 (Toast system): NotificationContext + ToastContainer v App.jsx
  - S2.2 (Profile tab): useAuth() + validace firstName/lastName/phone; readOnly email; Save s toastem
  - S2.3 (Company tab): adminCompanyStorage.js (novy, namespace company:v1); ICO/DIC/PSC/country validace; Save+Cancel
  - S2.4 (Security tab): FirebaseAuthProvider.changePassword() s reauth; Google-only detekce; error mapping; toast
  - S2.5 (Billing tab): readTenantJson('subscription:v1'); planConfig s 3 plans; ARIA role=tab/tablist/tabpanel; React.memo; i18n
- **Soubory:** Vytvoreno 3 (NotificationContext, ToastContainer, adminCompanyStorage), Zmeno 7 (App, FirebaseAuthProvider, account/index, LanguageContext, dokumentace, plan, MEMORY)
- **Build:** PASS (43s) — finalni verificace
- **Dokumentace:** Account-Dokumentace.md (16 sekci), Sprint-Plan-Auth.md aktualizovan, MEMORY.md aktualizovano
- **Agenti:** mp-mid-frontend-public (Toast), mp-mid-frontend-admin (4 fase), mp-spec-docs-dev (docs), mp-spec-docs-historie (5x save)
- **Historia:** Ulozena v 2 krocich (KONVERZACE.md + UPRAVY.md pro plny kontext)
- **Kontext:** Sprint 2 je 100% HOTOV; pripravenost na Sprint 3 (Team Access nebo jiny feature); vsechna teach zmen je dukumentovano

**091-BU — Orders Page Fixes** (2 soubory zmen)

- **Bug 1 (Ceny 0.00 Kč):** File ID je `number` (Date.now() + Math.random()), ale pricing engine ho konvertuje na `string`. Porovnani `m.id === f.id` vzdy selhalo. Oprava: `String(m.id) === String(f.id)` na radku 268 v CheckoutForm.jsx.
- **Bug 2 (Rozmery xx mm):** Rozměry jsou v `file.result?.modelInfo?.sizeMm`, ne v `metrics`. Přidán `dimensions_xyz` do `slicer_snapshot` na řádcích 290-293 CheckoutForm.jsx.
- **Bug 3 (Layout Poznámky):** Textarea + button bez správného flex layoutu. Opraveno: flex column kontejner s gap:8px a button alignSelf:flex-start na řádcích 1070-1075 AdminOrders.jsx.
- **Existence dat:** Staré objednávky zůstávají nezměněny (uložená data). Nové objednávky budou mít správné ceny a rozměry.
- **Build:** PASS ✓
- **Kontext:** Jednoduchý bug fix session — 2 soubory, 3 kritické opravy, nula refactoringu.

---
