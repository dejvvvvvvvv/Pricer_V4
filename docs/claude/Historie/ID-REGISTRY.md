# ID-REGISTRY — Registr zkratek a pocitadlo historie

> Tento soubor je JEDINY zdroj pravdy pro ID system historie.
> Kazdy historie-agent MUSI precist tento soubor pred vytvorenim novych zaznamu.

---

## Aktualni pocitadlo

**Posledni pouzite ID:** 080
**Dalsi ID k pouziti:** 081

---

## Format ID

```
{NNN}-{ZK}
```

- **NNN** = 3-mistne cislo s nulami (001, 002, ..., 999)
- **ZK** = 2-znakova zkratka oblasti (viz tabulka nize)
- Cislo je **globalni** — kazdy novy zaznam dostane dalsi cislo v rade (bez ohledu na oblast)
- Priklad: `001-TK`, `002-AD`, `003-TK` (TK ma 001 a 003, AD ma 002)

---

## Session format

```
S{NN}
```

- Kazdy novy chat/terminalni okno = nova session
- Cislovano v ramci dne: S01, S02, S03, ...
- Pokud nevime poradi, pouzij S01

---

## Registr zkratek

### Admin stranky
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| AD | Admin-Dashboard | src/pages/admin/AdminDashboard.jsx |
| AP | Admin-Pricing | src/pages/admin/AdminPricing.jsx |
| AF | Admin-Fees | src/pages/admin/AdminFees.jsx |
| AB | Admin-Branding | src/pages/admin/AdminBranding.jsx |
| AI | Admin-Integrations | src/pages/admin/AdminIntegrations.jsx |
| AO | Admin-Orders | src/pages/admin/AdminOrders.jsx |
| AA | Admin-Analytics | src/pages/admin/AdminAnalytics.jsx |
| AT | Admin-Team | src/pages/admin/AdminTeam.jsx |
| AW | Admin-Widget | src/pages/admin/AdminWidget.jsx |
| AM | Admin-Migration | src/pages/admin/AdminMigration.jsx |
| AS | Admin-Settings | src/pages/admin/ (obecne nastaveni) |
| AX | Admin-Presets | src/pages/admin/AdminPresets.jsx |
| AR | Admin-Parameters | src/pages/admin/AdminParameters.jsx |
| AE | Admin-Express | src/pages/admin/AdminExpress.jsx |
| DP | Doprava-Shipping | src/pages/admin/AdminShipping.jsx |

### Kalkulacky a widgety
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| TK | Test-Kalkulacka | src/pages/test-kalkulacka/ |
| WK | Widget-Kalkulacka | src/pages/widget-kalkulacka/ |
| WB | Widget-Builder | src/pages/admin/AdminWidget.jsx (builder cast) |

### Verejne stranky
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| HP | Home-Page | src/pages/home/ |
| PP | Pricing-Page | src/pages/pricing/ |
| SP | Support-Page | src/pages/support/ |
| MU | Model-Upload | src/pages/model-upload/ |
| MS | Model-Storage | src/pages/model-storage/ |
| LG | Login-Page | src/pages/login/ |

### Systemy a engine
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| PE | Pricing-Engine | src/lib/pricing/pricingEngineV3.js |
| ST | Storage | src/utils/adminTenantStorage.js + helpery |
| SB | Supabase | src/lib/supabase/ |
| SH | Shopify | src/lib/shopify/ |
| AU | Auth | docs/claude/Research/Auth/ |
| RT | Routing | src/Routes.jsx |
| LC | LanguageContext | src/contexts/LanguageContext.jsx |
| BK | Backend | backend-local/ |

### UI a design
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| DS | Design-System | src/forge-tokens.css + src/components/ui/ |
| HD | Header | src/components/Header.jsx |
| FT | Footer | src/components/Footer.jsx |
| UI | UI-Components | src/components/ui/ |

### Infrastruktura a meta
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| CF | Config | vite.config.mjs, package.json |
| SC | Security | bezpecnostni audit/review |
| TS | Tests | testy, vitest |
| DC | Documentation | docs/claude/Documentation/ |
| AG | Agents | .claude/agents/ |
| SK | Skills | .agents/skills/ |
| GN | General | viceoborove, obecne |
| 3D | 3D-Models | 3D viewer, mesh analyza |

### Business logika
| Zkratka | Oblast | Cesta |
|---------|--------|-------|
| KS | Kupony-Slevy | kuponovy/slevovy system |
| VD | Volume-Discounts | mnozstevni slevy |
| CO | Checkout | checkout flow |
| FE | Fees | poplatky (MODEL + ORDER) |

---

## Pravidla pro nove zkratky

1. **Max 2 znaky** (velka pismena nebo cislice)
2. **Unikatni** v ramci celeho registru
3. **Intuitivne rozpoznatelne** — prvni pismena klicovych slov
4. **Pred pouzitim zapsat** do teto tabulky — NIKDY nepouzivej neregistrovanou zkratku
5. Pokud oblast neexistuje, pouzij `GN` (General) a nasledne pridej novou zkratku

---

## Typy souboru historie

| Typ | Popis | Suffix v nazvu souboru |
|-----|-------|----------------------|
| KONVERZACE | Uzivatelovy zpravy + Claude odpovedi | _KONVERZACE.md |
| UPRAVY | Technicke zmeny v souborech | _UPRAVY.md |
| OTAZKY | Otazky a odpovedi, rozhodnuti | _OTAZKY.md |
| FAZE | Individualni faze vicefazoveho planu/sprintu | _FAZE-{N}-{Nazev}.md |
| DENNI-PREHLED | Souhrn celeho dne | DENNI-PREHLED.md |

---

---

## Pouzita ID (Funkcni Testy — 012 az 031)

| ID | Zkratka | Oblast | Score | Datum |
|----|---------|--------|-------|-------|
| 012 | TK | Test-Kalkulacka | 14/20 | 2026-02-20 |
| 013 | AD | Admin-Dashboard | 17/20 | 2026-02-20 |
| 014 | AP | Admin-Pricing | 18/20 | 2026-02-20 |
| 015 | AF | Admin-Fees | 16/20 | 2026-02-20 |
| 016 | AX | Admin-Presets | 17/20 | 2026-02-20 |
| 017 | AR | Admin-Parameters | 19/20 | 2026-02-20 |
| 018 | AO | Admin-Orders | 16/20 | 2026-02-20 |
| 019 | AB | Admin-Branding | 19/20 | 2026-02-20 |
| 020 | AW | Admin-Widget | 20/20 | 2026-02-20 |
| 021 | AA | Admin-Analytics | 17/20 | 2026-02-20 |
| 022 | AT | Admin-Team | 17/20 | 2026-02-20 |
| 023 | AE | Admin-Express | 20/20 | 2026-02-20 |
| 024 | DP | Doprava-Shipping | 20/20 | 2026-02-20 |
| 025 | KS | Kupony-Slevy | 19/20 | 2026-02-20 |
| 026 | GN | Admin-Emails | 17/20 | 2026-02-20 |
| 027 | AM | Admin-Migration | 20/20 | 2026-02-20 |
| 028 | AI | Admin-Integrations | 16/20 | 2026-02-20 |
| 029 | MS | Model-Storage | 18/20 | 2026-02-20 |
| 030 | LG | Login-Page | 14/20 | 2026-02-20 |
| 031 | GN | Account-Page | 16/20 | 2026-02-20 |

**Celkem: 350/400 (prumer 17.5/20)**

### Historie zaznamy (032-046)

| ID | Zkratka | Oblast | Typ | Datum |
|----|---------|--------|-----|-------|
| 032 | GN | General | KONVERZACE — funkcni testy session | 2026-02-20 |
| 033 | GN | General | UPRAVY — 22 novych + 2 uprav souboru | 2026-02-20 |
| 034 | GN | General | UPRAVY — Faze1 Screenshoty (5 PNG + 5 MD uprav) | 2026-02-20 |
| 035 | GN | General | UPRAVY — Faze2 Screenshoty (5 PNG + 5 MD uprav, stranky 017-021) | 2026-02-20 |
| 036 | GN | general-purpose | Faze 3 screenshoty + reporty | 2026-02-20 |
| 037 | GN | general-purpose | Faze 4 screenshoty + reporty | 2026-02-20 |
| 038 | GN | general-purpose | Denni prehled 2026-02-20 | 2026-02-20 |
| 039 | AU | Auth | UPRAVY — Phase 1 Auth Research | 2026-02-20 |
| 040 | AU | Auth | UPRAVY — Phase 2 Auth Research | 2026-02-20 |
| 041 | AU | Auth | UPRAVY — Phase 3 Auth Research (Security Checklist) | 2026-02-20 |
| 042 | AU | Auth | DENNI-PREHLED — Cela Auth Research kompletni (4 faze, 1483 radku) | 2026-02-20 |
| 043 | AU | Auth | KONVERZACE — Sprint 1 implementace (retroaktivni historia save) | 2026-02-22 |
| 044 | AU | Auth | UPRAVY — Sprint 1 (8 novych + 7 upravenych + 4 smazane, build PASS) | 2026-02-22 |
| 045 | AU | Auth | OTAZKY — 10 design decisions (email, role, Google, provider, token) | 2026-02-22 |
| 046 | AU | Auth | DENNI-PREHLED — Sprint 1 Complete (1200+ radku, kriticka chyba + oprava) | 2026-02-22 |
| 047 | AU | Auth | UPRAVY — Faze 0 (Priprava: adresare, firebase-admin, Firebase config overeni) | 2026-02-22 |
| 048 | AU | Auth | UPRAVY — Faze 1 (AuthContext rewrite, FirebaseAuthProvider, SupabaseAuthProvider stub, providers/index.jsx) | 2026-02-22 |
| 049 | AU | Auth | UPRAVY — Faze 2 (PrivateRoute aktivace, Login+Google, Register 1-step, GoogleSignInButton, smazane komponenty) | 2026-02-22 |
| 050 | AU | Auth | UPRAVY — Faze 3 (Backend auth middleware, tenant middleware, firebaseAdmin.js, apiClient interceptory) | 2026-02-22 |
| 051 | AU | Auth | UPRAVY — Faze 4 (Build fix .js->.jsx, MEMORY.md, procesni chyba dokumentace) | 2026-02-22 |
| 052 | LG | Login-Page | UPRAVY — Faze 1+3 (Login page wrapper, Register i18n) | 2026-02-23 |
| 053 | LG | Login-Page | KONVERZACE — Kompletni session S01 (plan, implementace, uzivateluv feedback, retroaktivni historia save) | 2026-02-23 |
| 054 | LG | Login-Page | UPRAVY — Kompletni technicke zmeny (login/index.jsx, register/index.jsx, obe dokumentace) | 2026-02-23 |
| 055 | LG | Login-Page | OTAZKY — 6 Q&A o procesni discipline, i18n, dokumentaci, prevenci budoucích chyb | 2026-02-23 |
| 056 | AU | Auth | KONVERZACE — Sprint 1 testovani (3 problemy: Google ticha chyba, backend offline, tenant isolation) | 2026-02-23 |
| 057 | AU | Auth | UPRAVY — Firebase API key oprava + diagnoza 3 problemu (nefixnute, mimo Sprint 1 scope) | 2026-02-23 |
| 058 | GN | General | UPRAVY — 2 nove dokumentace (Sprint-Plan-Auth.md, RoadMap-Plan-BETA.md) pro osobni ucely uzivatele | 2026-02-23 |
| 059 | AU | Auth | UPRAVY — Faze 1 Google Sign-In error handling (4 soubory, try/catch setDoc, console.error, handleGoogleError pattern) | 2026-02-24 |
| 060 | AU | Auth | UPRAVY — Faze 3 Auth headery v service souborech (presetsApi, slicerApi, storageApi: JWT tokeny, async authHeaders refaktor, 12 fetch volani) | 2026-02-24 |
| 061 | AU | Auth | UPRAVY — Faze 5 Backend .env (FIREBASE_PROJECT_ID) + 3 dokumentace (Login, Register, Backend-Server) | 2026-02-24 |
| 062 | AU | Auth | KONVERZACE — Kompletni konverzace Sprint 1 bugfixy session (7 zprav, plan, chyby procesu) | 2026-02-24 |
| 063 | AU | Auth | OTAZKY — 4 Q&A (task tracking, background agenti, chybejici typy zaznamu, zakaz compactu) | 2026-02-24 |
| 064 | BK | Backend | UPRAVY — dotenv ESM import order fix (index.js: side-effect import pred firebaseAdmin) | 2026-02-24 |
| 065 | GN | General | KONVERZACE — Sprint 2 iniciace S03 (uzivatel spousti, Claude planuvi, 3 agenti explore) | 2026-02-24 |
| 066 | GN | General | UPRAVY — Sprint 2 implementacni plan (12 fazi, 5 ukolu, CP1/CP2/CP3 framework) | 2026-02-24 |
| 067 | FE | Frontend | KONVERZACE — Toast/Notification system implementace (Faze 1) | 2026-02-24 |
| 068 | FE | Frontend | UPRAVY — NotificationContext.jsx, ToastContainer.jsx, App.jsx integrace | 2026-02-24 |
| 069 | FE | Frontend | FAZE — Kontrolni kroky po Fazi 1 (build PASS, browser test preskocen) | 2026-02-24 |
| 070 | AC | Account | UPRAVY — Profile tab realna data (useAuth, updateProfile, validace, toast) | 2026-02-24 |
| 071 | AC | Account | UPRAVY — Company tab tenant storage (adminCompanyStorage.js, company:v1) | 2026-02-24 |
| 072 | AC | Account | UPRAVY — Security tab zmena hesla + Billing tab plan config | 2026-02-24 |
| 073 | AC | Account | KONVERZACE — Security+Billing implementace kontext | 2026-02-24 |
| 074 | AC | Account | KONVERZACE — Sprint 2 finalni souhrn (vsech 5 ukolu hotovo) | 2026-02-24 |
| 075 | AC | Account | UPRAVY — Sprint 2 kompletni zmeny (10 souboru, 3 nove, 7 upravenych) | 2026-02-24 |

---

**Posledni aktualizace:** 2026-02-25
**Posledni session:** S01 (2026-02-25) — Per-User Tenant Izolace + P0 Code Review (076-ST az 080-ST)
