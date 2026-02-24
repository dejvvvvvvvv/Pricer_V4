# CLAUDE.md — ModelPricer / Pricer V3 (Compact)

> **Kompletni verze:** `Model_Pricer-V2-main/CLAUDE.md` (660 radku, 20 sekci).
> Toto je zkracena verze pro rychle nahrani na zacatku konverzace.

---

## Pravidla pro planovani a implementaci (P0)

**Pri KAZDEM planovani a implementaci MUSI byt dodrzeny tyto dva soubory:**

1. **`docs/claude/Pravidla/Hlavní_Pozadavky.md`** — hlavni pozadavky: maximalni vyuziti agentu, vytvareni novych agentu, format otazek, kontrolni seznam pro plan
2. **`docs/claude/Pravidla/4kroky.md`** — 4 povinne kontrolni kroky jako SAMOSTATNA faze po kazde implementacni fazi (historie → testovani → historie → compact)

**Klicove:** Plan MUSI stridat pracovni a kontrolni faze. Kontrolni faze (4 kroky) je VZDY samostatna — neni soucasti implementacni faze.

---

## Povinne dotazovani pred planovanim (Anti-Hallucination Gate)

**VZDY se zeptej uzivatele pred dokoncenim planu.** Toto je P0 pravidlo pro prevenci halucinaci a spatnych predpokladu.

### Pravidla
1. **Minimalne 3 otazky** pred finalizaci jakehokoliv planu — i kdyz se ti zda zadani jasne.
2. **Ptej se na vse nejiste** — pokud si nejsi 100% jisty nejakym rozhodnutim, architekturou, scopem, pozadovanym chovanim, UI/UX detailem nebo jakoukoli jinou veci — ZEPTEJ SE.
3. **Navrhuj lepsi alternativy** — pokud vidis lepsi pristup nez co uzivatel specifikoval, predloz ho jako otazku s vysvetlenim proc by mohl byt lepsi. Uzivatel se muze rozhodnout.
4. **Vice otazek je OK** — 3 je minimum, ale pokud je task komplexni nebo nejasny, ptej se kolikkrat je treba. Radsi vic otazek nez spatne predpoklady.
5. **Nedelej predpoklady o veci kterou muzes overit** — kdyz muzes precist soubor, podivat se na existujici kod nebo se zeptat uzivatele, udelej to misto hadani.

### Typicke oblasti pro dotazy
- Presny scope zmeny (co je IN, co je OUT)
- UI/UX chovani (jak to ma vypadat, kam to patri, jake stavy)
- Kompatibilita s existujicimi systemy (narusi to neco?)
- Uzivatelske preference (styl, pojmenovani, struktura)
- Edge cases a error handling

### Proc
LLM modely (vcetne me) maji tendenci halucinovat kdyz nemaji dostatek informaci. Misto vymysleni odpovedi je VZDY lepsi se zeptat. Spatny predpoklad propagovany do implementace stoji mnohonasobne vic casu nez 1 otazka navic.

> **Kompletni verze s detailnimi priklady:** viz `Model_Pricer-V2-main/CLAUDE.md` sekce 20.

---

## Historie — Automaticke ukladani konverzaci a uprav (P0)

> **KRITICKE PRAVIDLO:** Pred KAZDOU situaci kdy se muze ztratit kontext konverzace MUSI byt historie ulozena.
> Bez ulozene historie se ztraci: co uzivatel psal, jake rozhodnuti padla, proc se neco udelalo, jake soubory se menily.

### Kdy POVINNE spustit (P0 — BEZODKLADNE)

| Trigger | Proc |
|---------|------|
| **Pred auto-compaction konverzace** | Compaction smaze detaily — uloz PRED nim |
| **Pred dodanim/spustenim planu** | Implementace planu casto zacina `/clear` — uloz PRED dodanim planu + PATH k planu |
| **Pred `/clear` konverzace** | Clear maze vsechno — uloz PRED nim |
| **Pri kazdem checkpointu (CP1/CP2/CP3)** | Prirozeny breakpoint pro ulozeni |
| **Pred koncem session** | Finalni souhrn prace |

### Kdy DOPORUCENE spustit

| Trigger | Proc |
|---------|------|
| Na zacatku session | Zaznamena co se bude delat |
| Po velkem rozhodnuti | Zachyti kontext rozhodnuti ktery se jinak ztrati |
| Na rucni trigger `/history` | Uzivatel chce explicitne ulozit |

### Co ulozit navic pri planu
- **PATH k souboru planu** (napr. `docs/claude/PLANS/nazev-planu.md`)
- **Strucne shrnuti planu** (co se bude implementovat, jake soubory)
- **Rozhodnuti z diskuze** pred planem (otazky uzivatele, odpovedi, volby)

### Jak spustit
1. Zkompiluj kontext: konverzace (plny text uziv.), upravy (soubory + radky), otazky/odpovedi, rozhodnuti
2. Spust Task agenta (`general-purpose`, model `haiku`) s instrukcemi z `.claude/agents/mp-spec-docs-historie.md`
3. Agent zapise soubory do `docs/claude/Historie/{YYYY-MM-DD}/` podle sablon
4. Aktualizuje `MASTER-HISTORIE.md` + `ID-REGISTRY.md`

### Klicove soubory
| Soubor | Ucel |
|--------|------|
| `docs/claude/Historie/MASTER-HISTORIE.md` | Centralni index — kde co najit |
| `docs/claude/Historie/ID-REGISTRY.md` | Zkratky (40+) + globalni pocitadlo |
| `docs/claude/Historie/SABLONY/` | 4 sablony: KONVERZACE, UPRAVY, OTAZKY, DENNI-PREHLED |
| `.claude/agents/mp-spec-docs-historie.md` | Agent definice (haiku, 12 sekci) |
| `.agents/skills/history/SKILL.md` | Skill `/history` pro rucni trigger |

> **Kompletni popis:** viz `Model_Pricer-V2-main/CLAUDE.md` sekce 17.5

---

## Projekt

SaaS pro 3D-tiskove firmy: zakaznik nahra model -> vybere parametry -> backend (PrusaSlicer) vrati cas+material -> vypocita se cena -> embedovatelny widget + "add to cart" integrace.

---

## Invarianty (VZDY dodrzovat)

1. **Scope je zakon** — nemen nic mimo zadani.
2. **Bez plosneho refactoru** — zadne hromadne prejmenovani, reformat, "cleanup cele slozky".
3. **Tenant-scoped storage** — vzdy pres `getTenantId()` z `adminTenantStorage.js`, zadny hardcode.
4. **Jeden zdroj pravdy** — pricing/fees/branding cti pres tenant storage helpery (ne konstanty v UI).
5. **Build stabilita** — minimalizuj riziko "white screen": importy, exporty, routy.
6. **Kdyz neco nejasne** — zvol nejlepsi predpoklad, oznac `Assumption:`.

---

## DOKUMENTACE — POVINNA po kazde zmene

### Slozka dokumentace
`docs/claude/Documentation/` — obsahuje 45+ dokumentacnich souboru pro vsechny stranky, komponenty a systemy.

### Pravidla
- **Po KAZDE uprave** souboru/stranky/komponenty **MUSI** byt aktualizovana odpovidajici dokumentace v `docs/claude/Documentation/`.
- Pokud neexistuje dokumentace pro upravenou cast — vytvor novou.
- Hlavni rozcestnik: `docs/claude/Documentation/00-MASTER-Dokumentace.md`.
- Dokumentaci pis v cestine.

### Klicove dokumentacni soubory
| Oblast | Soubor |
|--------|--------|
| Routing | `Routing-Dokumentace.md` |
| Pricing Engine | `Pricing-Engine-Dokumentace.md` |
| Storage | `Storage-Utilities-Dokumentace.md` |
| Forge Design | `Forge-Design-System-Dokumentace.md` |
| Supabase | `Supabase-Dokumentace.md` |
| Build/Vite | `Build-Config-Dokumentace.md` |
| i18n | `LanguageContext-Dokumentace.md` |
| Widget | `Widget-Kalkulacka-Dokumentace.md` |
| Test kalkulacka | `Test-Kalkulacka-Dokumentace.md` |

---

## Specialni pravidla: test-kalkulacka a widget

### test-kalkulacka
- Zmeny v `/src/pages/test-kalkulacka/*` jsou POVOLENY, ale MUSI byt zdokumentovany v `docs/claude/Documentation/Test-Kalkulacka-Dokumentace.md`.
- Po zmenach test-kalkulacky aktualizuj widget-kalkulacku aby odpovidal (pokud je relevatni).

### Widget
- Widget je duplikat (`/src/pages/widget-kalkulacka/*`) + verejna route `/w/:publicWidgetId`.
- Bezpecnost P0: domain whitelist + postMessage origin validace.
- Widget nema checkout flow (neportuj S02). Widget pouziva theme CSS vars, ne Tailwind.

---

## Mapa repa (klicove cesty)

| Co | Cesta |
|----|-------|
| Router | `src/Routes.jsx` |
| Vite config | `vite.config.mjs` (port 4028, alias `@` -> `src/`) |
| Public stranky | `src/pages/home`, `pricing`, `support`, `model-upload` |
| Demo kalkulacka | `src/pages/test-kalkulacka` |
| Admin stranky | `src/pages/admin/*` (Dashboard, Branding, Pricing, Fees, Parameters, Presets, Orders, Analytics, Team, Widget) |
| Pricing engine | `src/lib/pricing/pricingEngineV3.js` |
| Storage entrypoint | `src/utils/adminTenantStorage.js` |
| UI komponenty | `src/components/ui/*` |
| Backend (dev) | `backend-local/` (Express, port 3001, Vite proxy `/api`) |
| Forge tokeny | `src/forge-tokens.css` |
| Dokumentace | `docs/claude/Documentation/` |

---

## Storage standards

- **Jediny entrypoint:** `getTenantId()` z `src/utils/adminTenantStorage.js`.
- **Klice:** `modelpricer:${tenantId}:<namespace>` (napr. `pricing:v3`, `fees:v3`).
- **Zakazano:** primy `localStorage.getItem/setItem` v UI (jen pres storage helpery).

---

## Importy & Build (P0)

- Over default vs named export (casty "white screen").
- Over case-sensitivity cest (Windows projde, Linux spadne).
- Preferuj alias `@/...` pro hluboke importy.
- UI komponenty v `src/components/ui/` — nevytvarej duplicity.
- Pred commitem: `npm run build`.

---

## UI/UX standardy

- **Anti-AI-generic:** Zadne random stat karty, genericka modra, dekorace bez ucelu.
- **Forge Design System:** `forge-tokens.css` — `--forge-font-heading` pro nadpisy (text-lg+), `--forge-font-tech` jen pro 12px labels/ceny/kody.
- **Micro-UX:** loading state, success feedback, error state s konkretnim textem.
- **Destruktivni akce:** confirm dialog + disabled kdyz by rozbila stav.
- **WCAG:** `--forge-text-muted` = #7A8291 (AA), teal+orange accenty.

---

## Agent system (strucne)

> **Kompletni:** `docs/claude/AGENT_MAP.md` (101 agentu, 13 domen).

- **Senior (sr):** opus, architektura+review+delegace (13 agentu)
- **Middle (mid):** sonnet, 2-4 podoblasti (18 agentu)
- **Specific (spec):** haiku/sonnet, 1 vec (70 agentu)
- **Prefix:** `mp-{tier}-{domena}-{spec}`
- **Eskalace:** spec -> mid -> sr -> orchestrator
- Po vytvoreni agenta → aktualizuj `AGENT_MAP.md`

---

## Skills (strucne)

> **Kompletni:** `docs/claude/SKILLS_MAP.md` (25 skills).

- **P0 skills:** conventional-commit, review-pr, lint-fix, secret-scanner, security-testing
- **P1 skills:** webapp-testing, vitest, dependency-updater, git-commit, translate
- Po instalaci skillu → aktualizuj `SKILLS_MAP.md`

---

## Git pravidla

- **NIKDY nepridavej** `Co-Authored-By: Claude ...` do commit messages.
- Commit messages v anglictine, strucne, popisne.
- Necommituj citlive soubory (`.env`, `.mcp.json`, `Supabase_Information.md`).

---

## Quality Gates (pred commitem)

```
[ ] npm run build — PASS
[ ] Zadne P0 issues
[ ] Smoke test — OK
[ ] Dokumentace aktualizovana (docs/claude/Documentation/)
[ ] AGENT_MAP.md aktualni (pokud zmena agenta)
[ ] SKILLS_MAP.md aktualni (pokud zmena skillu)
[ ] MEMORY.md aktualni (pokud nove uceni)
```

---

## Debug playbook (white screen)

1. DevTools Console → najdi **prvni** error
2. Import error → over existenci souboru + velikost pismen + default/named export
3. `npm run build` — presnejsi stack
4. Route error → zkontroluj `src/Routes.jsx`

---

## Bezpecnost (P0)

- Kazda externi vec (skill, agent, MCP, hook) MUSI projit security skenem.
- **Red flags:** `curl|bash`, base64 v promptech, reference na credentials, "ignore instructions".
- **Detaily:** viz `Model_Pricer-V2-main/CLAUDE.md` sekce 19.

---

## Workflow (CP1/CP2/CP3)

1. **CP1 — Analyza:** Shrnuti, Scope, Out of scope, Seznam souboru, Rizika + **HISTORIE SAVE**
2. **CP2 — Implementace:** Male kroky, jen scope, hlidej exporty/importy + **HISTORIE SAVE**
3. **CP3 — Stabilizace:** Zadne feature creep, jen guardy/texty, `npm run build` + smoke + **HISTORIE SAVE**

---

## Reference na kompletni dokumentaci

| Tema | Kde |
|------|-----|
| Kompletni CLAUDE.md | `Model_Pricer-V2-main/CLAUDE.md` |
| Agent mapa (107 agentu) | `docs/claude/AGENT_MAP.md` |
| Skills mapa (29 skills) | `docs/claude/SKILLS_MAP.md` |
| Historie system | `docs/claude/Historie/MASTER-HISTORIE.md` |
| Planovaci system | `Model_Pricer-V2-main/CLAUDE.md` sekce 15 |
| Prompt Injection Prevention | `Model_Pricer-V2-main/CLAUDE.md` sekce 19 |
| MCP setup | `docs/claude/MCP_SETUP_VSCODE.md` |
| Phase 1 detaily | `docs/claude/Planovane_Implementace/V3-PHASE1-COMPLETE.md` |
| Supabase migrace plan | `docs/claude/Planovane_Implementace/V3-S00c-database-migration-supabase.md` |
| Forge redesign plan | `docs/claude/PLANS/Redesign-Bugfix-Plan-2026-02-10.md` |
| Dokumentace stranky | `docs/claude/Documentation/00-MASTER-Dokumentace.md` |
