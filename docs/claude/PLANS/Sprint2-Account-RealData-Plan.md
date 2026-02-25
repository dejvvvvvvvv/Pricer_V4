# Sprint 2 — Ucet s realnymi daty — Implementacni plan

> **Datum:** 2026-02-24
> **Sprint:** Auth Sprint 2
> **Scope:** Account page — nahrazeni mockovanych dat realnymi + notifikacni system
> **Zavislosti:** Sprint 1 (HOTOVO s bugfixy)

---

## Celkovy scope

| # | Ukol | Popis |
|---|------|-------|
| S2.1 | Toast/Notification system | NotificationContext + ToastContainer + integrace ForgeToast |
| S2.2 | Profile tab — realna data | useAuth() napojeni, load/save profilu z Firebase |
| S2.3 | Company tab — storage | Novy namespace `company:v1`, tenant-scoped ulozeni firemnich udaju |
| S2.4 | Security tab — zmena hesla | Realna zmena hesla pres Firebase, reautentikace, validace |
| S2.5 | Billing/Plan tab + i18n + cleanup | Realna data tarifu, centralizace prekladu, a11y opravy |

---

## Faze 1 — Toast/Notification System (S2.1)

### Popis
Vytvoreni globalniho notifikacniho systemu postavenem na existujicim ForgeToast komponentu.

### Co se vytvori
1. `src/contexts/NotificationContext.jsx` — Context + Provider + useNotification hook
2. `src/components/ui/forge/ToastContainer.jsx` — Kontejner pro renderovani toastu (fixed position, stacking)
3. Integrace do `App.jsx` nebo hlavniho layoutu

### Rozlozeni agentu pro Fazi 1

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| mp-mid-frontend-public | Vytvoreni NotificationContext + ToastContainer | Hlavni |
| mp-mid-design-system | Review ForgeToast kompatibility, design tokens | Ano (s frontend) |

### Acceptance Criteria
- [ ] `useNotification()` hook vraci `{ showSuccess, showError, showWarning, showInfo }`
- [ ] Toast se zobrazi v pravem hornim rohu, stackuji se
- [ ] Auto-dismiss po 5s, manual dismiss
- [ ] Forge design system tokeny

---

## Faze 2 — Kontrolni kroky po Fazi 1

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type
general-purpose). Agent ulozi vsechny zmeny z Faze 1: vytvoreni NotificationContext,
ToastContainer, integrace do App. POCKAM az agent kompletne dokonci ukladani — zadna
dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 1 v prohlizeci pomoci
mcp__claude-in-chrome nastroju. Konkretne otestuju:
- Toast se zobrazi po zavolani useNotification().showSuccess()
- Toast zmizi po 5s automaticky
- Stacking vice toastu najednou
- Manual dismiss tlacitkem X
Ulozim snimky obrazovky a zapisu poznatky do docs/claude/Research/Sprint2/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi
POUZE vysledky testovani z Kroku 2 — snimky, poznatky, nalezene bugy. POCKAM az agent
kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Provedu `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze.
Az po compactu pokracuji na Fazi 3.

---

## Faze 3 — Profile Tab — Realna data (S2.2)

### Popis
Napojeni Profile tabu na realna data z Firebase Auth + Firestore.

### Co se zmeni
1. `src/pages/account/index.jsx` — import useAuth(), nahrazeni mocku, save handler
2. `src/providers/FirebaseAuthProvider.jsx` — pridani updateEmail pokud chybi
3. Validace: email format, phone format
4. Loading/saving stavy na tlacitcich
5. Nahrazeni alert() za useNotification()

### Rozlozeni agentu pro Fazi 3

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| mp-mid-frontend-admin | Uprava account/index.jsx — profile tab napojeni | Hlavni |
| mp-spec-be-auth | Review/uprava FirebaseAuthProvider pro updateEmail | Ano |

### Acceptance Criteria
- [ ] Po prihlaseni se zobrazi realne jmeno, email z Firebase
- [ ] Ulozeni profilu zapise do Firestore
- [ ] Toast misto alert()
- [ ] Loading stav na Save tlacitku
- [ ] Validace emailu a telefonu

---

## Faze 4 — Kontrolni kroky po Fazi 3

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type
general-purpose). Agent ulozi vsechny zmeny z Faze 3: profile tab napojeni, useAuth
integrace, validace, toast nahrazeni. POCKAM az agent kompletne dokonci ukladani —
zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju zmeny v prohlizeci:
- Prihlaseni → /account → Profile tab ukazuje realna data
- Zmena jmena → Save → toast "Ulozeno" → refresh zachova zmenu
- Nevalidni email → validacni chyba
- Loading stav na Save tlacitku
Ulozim snimky do docs/claude/Research/Sprint2/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie`. Ulozi vysledky testovani. POCKAM na dokonceni.

### Krok 4 — Compact kontextu
Provedu `/compact`. Az po nem pokracuji na Fazi 5.

---

## Faze 5 — Company Tab — Storage (S2.3)

### Popis
Ulozeni firemnich dat do tenant-scoped localStorage (+ async Supabase).

### Co se vytvori/zmeni
1. `src/utils/adminCompanyStorage.js` — NOVY helper pro namespace `company:v1`
2. `src/pages/account/index.jsx` — Company tab napojeni na storage
3. Validace: ICO (8 cislic), DIC (CZ + 8-10 cislic), PSC (5 cislic)

### Rozlozeni agentu pro Fazi 5

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| mp-mid-storage-tenant | Vytvoreni adminCompanyStorage helper | Hlavni |
| mp-mid-frontend-admin | Napojeni Company tabu na storage | Po storage |

### Acceptance Criteria
- [ ] Ulozeni firemnich dat persist po refreshi
- [ ] ICO/DIC/PSC validace s chybovymi hlaskami
- [ ] Toast po ulozeni
- [ ] Tenant-scoped (klice s tenantId)

---

## Faze 6 — Kontrolni kroky po Fazi 5

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie`. Ulozi zmeny z Faze 5: company storage helper,
company tab napojeni, validace. POCKAM na dokonceni.

### Krok 2 — Testovani na webu
- Company tab → vyplneni ICO, DIC, adresy → Save → refresh → data zachovana
- Nevalidni ICO (ne 8 cislic) → chybova hlaska
- Toast po uspesnem ulozeni
Snimky do docs/claude/Research/Sprint2/.

### Krok 3 — Ulozeni historie (po testovani)
Spustim agenta, ulozi vysledky testovani. POCKAM.

### Krok 4 — Compact kontextu
`/compact` → pokracuji na Fazi 7.

---

## Faze 7 — Security Tab — Zmena hesla (S2.4)

### Popis
Realna zmena hesla pres Firebase Auth s reautentikaci.

### Co se zmeni
1. `src/providers/FirebaseAuthProvider.jsx` — pridani `changePassword(currentPassword, newPassword)` funkce
2. `src/pages/account/index.jsx` — Security tab napojeni
3. Reautentikace pred zmenou hesla (Firebase vyzaduje)
4. Validace: min 8 znaku, sila hesla enforcement
5. Error handling: spatne stare heslo, slabe heslo

### Rozlozeni agentu pro Fazi 7

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| mp-spec-be-auth | changePassword funkce v FirebaseAuthProvider | Hlavni |
| mp-mid-frontend-admin | Security tab napojeni + UX | Po auth |

### Acceptance Criteria
- [ ] Zadani stareho hesla → noveho → potvrzeni → zmena probehne
- [ ] Spatne stare heslo → error toast
- [ ] Slabe heslo → nedovoli odeslat (enforced strength)
- [ ] Po uspesne zmene → success toast + reset poli

---

## Faze 8 — Kontrolni kroky po Fazi 7

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie`. Ulozi zmeny z Faze 7: changePassword funkce,
security tab napojeni, reautentikace flow. POCKAM na dokonceni.

### Krok 2 — Testovani na webu
- Security tab → zmena hesla → success toast
- Spatne stare heslo → error toast
- Slabe nove heslo → validacni blokace
Snimky do docs/claude/Research/Sprint2/.

### Krok 3 — Ulozeni historie (po testovani)
Spustim agenta, ulozi vysledky. POCKAM.

### Krok 4 — Compact kontextu
`/compact` → pokracuji na Fazi 9.

---

## Faze 9 — Billing/Plan + i18n + a11y + Cleanup (S2.5)

### Popis
Dokonceni Sprint 2: billing tab realna data, centralizace prekladu, a11y opravy, dokumentace.

### Co se zmeni
1. `src/pages/account/index.jsx` — billing tab cte tarif z tenant storage
2. `src/contexts/LanguageContext.jsx` — presun account prekladu do centralniho slovniku
3. `src/pages/account/index.jsx` — ARIA role opravy (tablist, tab, tabpanel)
4. Extrakce FormInput a Card mimo hlavni komponent (performance)
5. `docs/claude/Documentation/Account-Dokumentace.md` — aktualizace

### Rozlozeni agentu pro Fazi 9

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| mp-mid-frontend-admin | Billing tab, a11y opravy, component extraction | Hlavni |
| mp-sr-i18n | Centralizace prekladu do LanguageContext | Ano |
| mp-spec-docs-dev | Aktualizace Account-Dokumentace.md | Po implementaci |

### Acceptance Criteria
- [ ] Billing tab ukazuje tarif z konfigu (ne hardcoded)
- [ ] Vsechny preklady v LanguageContext (ne inline)
- [ ] ARIA roles na tab navigaci
- [ ] FormInput/Card extrahovany jako samostatne komponenty
- [ ] Dokumentace aktualizovana

---

## Faze 10 — Kontrolni kroky po Fazi 9

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie`. Ulozi zmeny z Faze 9: billing, i18n, a11y,
dokumentace. POCKAM na dokonceni.

### Krok 2 — Testovani na webu
- Billing tab → spravny tarif
- Prepnuti jazyka CS/EN → vsechny texty prekladeny
- Tab navigace → ARIA roles v DevTools
- Vsechny 4 taby fungujici po zmenach
Snimky do docs/claude/Research/Sprint2/.

### Krok 3 — Ulozeni historie (po testovani)
Spustim agenta, ulozi vysledky. POCKAM.

### Krok 4 — Compact kontextu
`/compact` → pokracuji na Fazi 11.

---

## Faze 11 — Build + Final QA

### Co se udela
1. `npm run build` — musi PASS
2. Smoke test vsech 4 tabu
3. Oprava pripadnych build chyb
4. Final review

### Rozlozeni agentu pro Fazi 11

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| mp-mid-infra-build | npm run build + fix | Hlavni |
| mp-mid-quality-code | Code review zmen | Ano |

---

## Faze 12 — Finalni kontrolni kroky

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie`. Ulozi finalni stav: build vysledek, vsechny
zmeny sprintu. POCKAM na dokonceni.

### Krok 2 — Testovani na webu (finalni smoke test)
- Vsechny 4 taby v Account page
- Toast notifikace fungujici
- Prihlaseni → ucet → zmena dat → ulozeni → refresh → overeni
Snimky do docs/claude/Research/Sprint2/.

### Krok 3 — Ulozeni historie (po testovani)
Finalni historie zapis. POCKAM na dokonceni.

### Krok 4 — Compact + Commit
Compact + priprava na commit (pokud uzivatel schvali).

---

## Out of Scope (NERESIT v Sprint 2)

- [ ] 2FA (Sprint 4)
- [ ] Active sessions management (Sprint 4)
- [ ] Stripe platby (Faze 2 RoadMap)
- [ ] Tenant izolace (Faze 3 RoadMap, F3.4)
- [ ] Role a opravneni (Faze 3 RoadMap, F3.5)
- [ ] Download PDF faktur (pozdeji)
- [ ] Payment methods CRUD (pozdeji)

---

## Rizika

| # | Riziko | Mitigace |
|---|--------|----------|
| R1 | Firebase reautentikace muze selhat pri Google uctech | Detekce auth provideru, ruzny flow |
| R2 | Build break pri novych importech | npm run build po kazde fazi |
| R3 | i18n preklady nekompletni | Paralelni agent pro i18n |
| R4 | ForgeToast styling nekonzistentni | Review design system agentem |

---

**Plan vytvoren:** 2026-02-24
**Odhadovany pocet fazi:** 12 (6 pracovnich + 6 kontrolnich)
