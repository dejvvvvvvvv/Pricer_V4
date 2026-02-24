# MASTER HISTORIE — ModelPricer V3

> Centralni rozcestnik vsech zaznamu historie projektu.
> Kazdy radek odkazuje na konkretni soubor s detailni historii.

---

## Jak cist tento soubor

- **ID:** Globalni poradove cislo + zkratka oblasti (viz `ID-REGISTRY.md`)
- **Session:** Oznaceni session v ramci dne (S01, S02, ...)
- **Typ:** KONVERZACE / UPRAVY / OTAZKY / DENNI-PREHLED
- **Souvisejici:** ID jinych souboru ktere s timto souvisi
- **Cesta:** Relativni cesta od `docs/claude/Historie/`

---

## Statistiky

- **Celkem zaznamu:** 42
- **Prvni zaznam:** 001-GN (2026-02-19)
- **Posledni zaznam:** 064-BK (2026-02-24)

---

## Zaznamy

<!-- VKLADEJ NOVE ZAZNAMY NA KONEC TABULKY PRO DANY DEN -->
<!-- Novy den vzdy zacni novym headingem ### YYYY-MM-DD -->

### 2026-02-19

| ID | Session | Oblast | Typ | Popis | Souvisejici | Cesta |
|----|---------|--------|-----|-------|-------------|-------|
| 001-GN | S01 | General | KONVERZACE | Navrh a implementace Historie systemu — 5 zprav, diskuze triggery/format/ID/jazyk | 002-GN, 003-GN | 2026-02-19/001-GN_KONVERZACE.md |
| 002-GN | S01 | General | UPRAVY | 8 novych + 5 upravenych souboru (agent, skill, sablony, ID-REGISTRY, oba CLAUDE.md) | 001-GN, 003-GN | 2026-02-19/002-GN_UPRAVY.md |
| 003-GN | S01 | General | OTAZKY | 7 Q&A — triggery, uroven detailu, ID system, jazyk, preklepy, plan trigger | 001-GN, 002-GN | 2026-02-19/003-GN_OTAZKY.md |
| 004-GN | S01 | General | DENNI-PREHLED | Souhrn dne — Historie system od nuly, 13 souboru, S01 | 001-GN, 002-GN, 003-GN | 2026-02-19/DENNI-PREHLED.md |
| 007-GN | S03 | General | KONVERZACE | RoadMap Cloud Run/Supabase/Domain + Order processing research | 008-GN | 2026-02-19/007-GN_KONVERZACE.md |
| 008-GN | S03 | General | UPRAVY | RoadMap.md — 16 editu (Cloud Run, Supabase, Domain, Stripe doporuceni) | 007-GN | 2026-02-19/008-GN_UPRAVY.md |
| 009-PE | S03 | Pricing-Engine | KONVERZACE | Pricing Engine V3 roadmap analyza — 88% hotovo, expressSurcharge, KD ukoly, 8 podslouboru | 010-PE, 011-PE | 2026-02-19/009-PE_KONVERZACE.md |
| 010-PE | S03 | Pricing-Engine | UPRAVY | 9 novych dokumentacnich souboru v 3_PricingEngineV3/ — rozdeleni 590-radkoveho roadmapu | 009-PE, 011-PE | 2026-02-19/010-PE_UPRAVY.md |
| 011-PE | S03 | Pricing-Engine | OTAZKY | 7 Q&A — expressSurcharge, KD, scope, testy, currency, objednavky | 009-PE, 010-PE | 2026-02-19/011-PE_OTAZKY.md |

---

### 2026-02-22

| ID | Session | Oblast | Typ | Popis | Souvisejici | Cesta |
|----|---------|--------|-----|-------|-------------|-------|
| 043-AU | S01 | Auth | KONVERZACE | Sprint 1 Auth Foundation — implementace 4 fazi, zadani + vysledky + uzivatelova chyba na vynechane kroky | 044-AU, 045-AU, 046-AU | 2026-02-22/043-AU_KONVERZACE.md |
| 044-AU | S01 | Auth | UPRAVY | Sprint 1 Auth Foundation — 22 zmeny (8 novych + 7 upravenych + 4 smazane soubory), providers, middleware, apiClient, build PASS | 043-AU, 045-AU, 046-AU | 2026-02-22/044-AU_UPRAVY.md |
| 045-AU | S01 | Auth | OTAZKY | Sprint 1 design decisions — 10 Q&A (email, role, Google, provider arch, token refresh, middleware) | 043-AU, 044-AU, 046-AU | 2026-02-22/045-AU_OTAZKY.md |
| 046-AU | S01 | Auth | DENNI-PREHLED | Sprint 1 Auth Foundation Complete — 1 session, 4 soubory, 1,200+ radku kodu, 300+ radku dokumentace, kriticka chyba + oprava | 043-AU, 044-AU, 045-AU | 2026-02-22/DENNI-PREHLED.md |
| 047-AU | S02 | Auth | UPRAVY | Faze 0 — Priprava: adresare (providers/, Sprint1/, middleware/), firebase-admin ^13.6.1, Firebase config overeni | 048-051-AU | 2026-02-22/047-AU_UPRAVY-Faze0.md |
| 048-AU | S02 | Auth | UPRAVY | Faze 1 — Auth Foundation: AuthContext (41->11), FirebaseAuthProvider (189), SupabaseAuthProvider (30), providers/index.jsx (19), Header.jsx useAuth, hooks/useAuth.js smazan | 047,049-051-AU | 2026-02-22/048-AU_UPRAVY-Faze1.md |
| 049-AU | S02 | Auth | UPRAVY | Faze 2 — Routes+Login+Register: PrivateRoute aktivace (18 admin rout + /account), Login s Google, Register 1-step (bez roli), GoogleSignInButton (69), 3 smazane komponenty | 047-048,050-051-AU | 2026-02-22/049-AU_UPRAVY-Faze2.md |
| 050-AU | S02 | Auth | UPRAVY | Faze 3 — Backend+apiClient: firebaseAdmin.js (27), auth.js (51), tenant.js (25), index.js middleware integrace, apiClient.js (47), window token bridges | 047-049,051-AU | 2026-02-22/050-AU_UPRAVY-Faze3.md |
| 051-AU | S02 | Auth | UPRAVY | Faze 4 — Build+Docs: .js->.jsx fix, build PASS 46s, MEMORY.md auth sekce, kriticka procesni chyba (0/24 povinnych kroku), retroaktivni oprava | 047-050-AU | 2026-02-22/051-AU_UPRAVY-Faze4.md |

---

### 2026-02-20

| ID | Session | Oblast | Typ | Popis | Souvisejici | Cesta |
|----|---------|--------|-----|-------|-------------|-------|
| 032-GN | S01-S03 | General | KONVERZACE | Funkcni testovani 20 stranek — Chrome MCP, screenshoty, reporty 012-031, score 350/400 | 033-GN | 2026-02-20/032-GN_KONVERZACE.md |
| 033-GN | S01-S03 | General | UPRAVY | 22 novych souboru (20 reportu + sablona + master), 20 screenshot slozek, 2 upravene soubory | 032-GN | 2026-02-20/033-GN_UPRAVY.md |
| 034-GN | S01 | General | UPRAVY | Faze 1 oprava screenshotu — 5 novych PNG (Playwright), 5 vylepseni funkcnich testu (012-016) | 032-GN, 033-GN | 2026-02-20/034-GN_UPRAVY-Faze1-Screenshoty.md |
| 035-GN | S01 | General | UPRAVY | Faze 2 oprava screenshotu — 5 novych PNG (Playwright), 5 vylepseni funkcnich testu (017-021) | 032-GN, 033-GN, 034-GN | 2026-02-20/035-GN_UPRAVY-Faze2-Screenshoty.md |
| 036-GN | S01 | General | UPRAVY | Faze 3 screenshoty: Team, Express, Shipping, Coupons, Emails + vylepseni 5 reportu | 032-GN, 033-GN, 035-GN | 2026-02-20/036-GN_UPRAVY-Faze3-Screenshoty.md |
| 037-GN | S01 | General | UPRAVY | Faze 4 screenshoty: Migration, Integrations, Model Storage, Login, Account + vylepseni 5 reportu | `2026-02-20/037-GN_UPRAVY-Faze4-Screenshoty.md` |
| 038-GN | S01 | General | DENNI-PREHLED | Denni prehled: 20 screenshotu, 20 reportu vylepseno, 4 faze dokonceny | `2026-02-20/038-GN_DENNI-PREHLED.md` |
| 039-AU | S01 | Auth | UPRAVY | Phase 1 Auth Research — 3 paralelni agenti, 15+ platform analysis, 4-tab struktura, P0/P1/P2 priority | 2026-02-20/039-AU_UPRAVY.md |
| 040-AU | S01 | Auth | UPRAVY | Phase 2 Auth Research — PrivateRoute pattern, provider-agnostic AuthContext, backend middleware, tenant isolation, token management | 2026-02-20/040-AU_UPRAVY.md |
| 041-AU | S01 | Auth | UPRAVY | Phase 3 Auth Research — Security Mistakes Checklist, 3 parallel agents, Top 20 bugs (4 Critical, 10 High, 6 Medium), real-world case studies | 2026-02-20/041-AU_UPRAVY.md |
| 042-AU | S02 | Auth | DENNI-PREHLED | Auth Research Complete — 4 faze (Account Pages, PrivateRoute, Security Checklist, Implementation Plan), 1 483 radku, Firebase + provider-agnostic design, 4-sprint roadmap | 2026-02-20/042-AU_DENNI-PREHLED.md |

### 2026-02-23

| ID | Session | Oblast | Typ | Popis | Souvisejici | Cesta |
|----|---------|--------|-----|-------|-------------|-------|
| 052-LG | S01 | Login-Page | UPRAVY | Faze 1+3 — Login page wrapper (100vh bg, 520px container, heading, card), Register i18n lokalizace + vizualni test PASS (obe stranky OK, design konzistentni) | 053-LG, 054-LG, 055-LG | 2026-02-23/052-LG_UPRAVY.md |
| 053-LG | S01 | Login-Page | KONVERZACE | Session S01 kompletni — plan implementace, pracovni faze (Login, Register), uzivateluv feedback o preskoceni kontrolnich fazi, retroaktivni historia save | 052-LG, 054-LG, 055-LG | 2026-02-23/053-LG_KONVERZACE.md |
| 054-LG | S01 | Login-Page | UPRAVY | Kompletni technicke zmeny — login/index.jsx (page wrapper, Forge tokens, i18n), register/index.jsx (i18n), Login-Dokumentace.md (9 sekci), Register-Dokumentace.md (6 sekci), build PASS | 052-LG, 053-LG, 055-LG | 2026-02-23/054-LG_UPRAVY.md |
| 055-LG | S01 | Login-Page | OTAZKY | 6 Q&A — procesni chyby, struktura kontrolnich fazi, spravnost kodu, i18n klice, dokumentace, prevence budoucích chyb | 052-LG, 053-LG, 054-LG | 2026-02-23/055-LG_OTAZKY.md |
| 056-AU | S02 | Auth | KONVERZACE | Sprint 1 testovani — 3 nalezene problemy (Google ticha chyba, backend offline, per-user tenant isolation neni implementovano), Firebase API key oprava, rozhodnuti o scope Sprint 1 vs. dalsi sprinty | 055-LG, 057-AU | 2026-02-23/056-AU_KONVERZACE.md |
| 057-AU | S02 | Auth | UPRAVY | Firebase API key oprava + diagnoza 3 problemu v tabulce "Pozadovane opravy" — Problem 1 (Google), Problem 2 (Backend), Problem 3 (Tenant) — vsechny mimo Sprint 1 scope, build PASS | 056-AU | 2026-02-23/057-AU_UPRAVY.md |
| 058-GN | S02 | General | UPRAVY | Dve nove jednoduche dokumentace (Sprint-Plan-Auth.md, RoadMap-Plan-BETA.md) — netechnicke overviews Auth Sprints + RoadMap Faze pro osobni ucely uzivatele | 056-AU, 057-AU | 2026-02-23/058-GN_UPRAVY.md |

---

### 2026-02-24

| ID | Session | Oblast | Typ | Popis | Souvisejici | Cesta |
|----|---------|--------|-----|-------|-------------|-------|
| 059-AU | S01 | Auth | UPRAVY | Faze 1 — Google Sign-In error handling (4 soubory): try/catch wrapovani setDoc() v FirebaseAuthProvider, console.error() v GoogleSignInButton, handleGoogleError() v LoginForm + RegistrationForm | 043-AU, 044-AU, 056-AU, 057-AU | 2026-02-24/059-AU_UPRAVY-Faze1-GoogleSignInErrors.md |
| 060-AU | S01 | Auth | UPRAVY | Faze 3 — Auth headery v service API souborech (presetsApi, slicerApi, storageApi): Firebase JWT tokeny do Authorization headeru, refaktor storageApi z synchronniho tenantHeaders() na async authHeaders(), 12 fetch volani aktualizovano | 059-AU, 061-AU | 2026-02-24/060-AU_UPRAVY-Faze3-AuthHeadersServiceFiles.md |
| 061-AU | S01 | Auth | UPRAVY | Faze 5 — Backend .env (FIREBASE_PROJECT_ID=model-pricer) + aktualizace 3 dokumentacnich souboru (Login-Dokumentace, Register-Dokumentace, Backend-Server-Dokumentace) | 059-AU, 060-AU | 2026-02-24/061-AU_UPRAVY-Faze5-EnvDokumentace.md |
| 062-AU | S01 | Auth | KONVERZACE | Kompletni konverzace Sprint 1 bugfixy session — 7 zprav, plan od uzivatele, chyby procesu (background agenti, chybejici typy zaznamu) | 059-AU, 060-AU, 061-AU, 063-AU | 2026-02-24/062-AU_KONVERZACE.md |
| 063-AU | S01 | Auth | OTAZKY | 4 Q&A — task tracking, background agenti selhani, chybejici typy zaznamu, zakaz compactu | 059-AU, 060-AU, 061-AU, 062-AU | 2026-02-24/063-AU_OTAZKY.md |
| 064-BK | S02 | Backend | UPRAVY | dotenv ESM import order fix — side-effect import "dotenv/config" jako prvni radek, firebaseAdmin.js nyni vidi FIREBASE_PROJECT_ID | 061-AU, 059-AU, 060-AU | 2026-02-24/064-BK_UPRAVY-DotenvESMFix.md |

---

**Posledni aktualizace:** 2026-02-24 (S02) — Backend dotenv ESM fix (064-BK)
**Statistiky:** 42 zaznamu, 6 dnu (2026-02-19 az 2026-02-24)
