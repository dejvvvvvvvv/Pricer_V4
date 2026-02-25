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

## Navi & Links

- **ID-REGISTRY:** `docs/claude/Historie/ID-REGISTRY.md` — seznam zkratek + globalni pocitadlo
- **SABLONY:** `docs/claude/Historie/SABLONY/` — 4 sablony pro nove zaznamy
- **Denni slozky:** `docs/claude/Historie/{YYYY-MM-DD}/` — jednotlive zaznamy (UPRAVY.md, KONVERZACE.md, atd.)

---

## Popis zaznamu

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

---
