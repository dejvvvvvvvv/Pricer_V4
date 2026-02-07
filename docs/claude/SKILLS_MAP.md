# SKILLS_MAP.md — Mapa skills pro Claude Code (ModelPricer / Pricer V3)

> **Zdroj pravdy** pro nainstalovane a doporucene skills. Odkazovano z `CLAUDE.md` sekce 4.
> Posledni aktualizace: 2026-02-06

---

## 1) Nainstalovane skills (25 skills)

### 1.1 P0 — Core Development (4 skills)

| Skill | Popis | Zdroj | Datum instalace | Stav |
|-------|-------|-------|-----------------|------|
| `conventional-commit` | Git commit s konvencnim formatem | marcelorodrigo/agent-skills | 2026-02-06 | Aktivni |
| `review-pr` | Automaticka code review PR | mblode/agent-skills | 2026-02-06 | Aktivni |
| `lint-fix` | Automaticky lint a format opravy | metta-ai/tribal-village | 2026-02-06 | Aktivni |
| `secret-scanner` | Detekce leaku secrets v kodu | curiouslearner/devkit | 2026-02-06 | Aktivni |

| `security-testing` | OWASP security testing (SAST/DAST/SCA) | aj-geddes/useful-ai-prompts | 2026-02-06 | Aktivni |

### 1.2 P1 — Testing & Quality (3 skills)

| Skill | Popis | Zdroj | Datum instalace | Stav |
|-------|-------|-------|-----------------|------|
| `webapp-testing` | Testovani webovych aplikaci | anthropics/skills (oficial) | 2026-02-06 | Aktivni |
| `vitest` | Vitest test runner integrace | antfu/skills | 2026-02-06 | Aktivni |
| `dependency-updater` | Aktualizace zavislosti | softaworks/agent-toolkit | 2026-02-06 | Aktivni |

### 1.3 P1 — Git & i18n (3 skills)

| Skill | Popis | Zdroj | Datum instalace | Stav |
|-------|-------|-------|-----------------|------|
| `git-commit` | Git commit s kontextem | github/awesome-copilot | 2026-02-06 | Aktivni |
| `translate` | Preklad textu CZ<->EN | tuesd4y/agent-skills | 2026-02-06 | Aktivni |
| `find-skills` | Vyhledava a instaluje dalsi skills | Built-in | — | Aktivni |

### 1.4 Obra Superpowers (14 skills)

| Skill | Popis | Zdroj | Datum instalace | Stav |
|-------|-------|-------|-----------------|------|
| `brainstorming` | Strukturovany brainstorming | obra/superpowers | 2026-02-06 | Aktivni |
| `dispatching-parallel-agents` | Paralelni spousteni sub-agentu | obra/superpowers | 2026-02-06 | Aktivni |
| `executing-plans` | Exekuce strukturovanych planu | obra/superpowers | 2026-02-06 | Aktivni |
| `finishing-a-development-branch` | Finalizace dev branche | obra/superpowers | 2026-02-06 | Aktivni |
| `receiving-code-review` | Zpracovani code review feedbacku | obra/superpowers | 2026-02-06 | Aktivni |
| `requesting-code-review` | Zadani o code review | obra/superpowers | 2026-02-06 | Aktivni |
| `subagent-driven-development` | Vyvoj rizeny sub-agenty | obra/superpowers | 2026-02-06 | Aktivni |
| `systematic-debugging` | Systematicky debugging | obra/superpowers | 2026-02-06 | Aktivni |
| `test-driven-development` | TDD workflow | obra/superpowers | 2026-02-06 | Aktivni |
| `using-git-worktrees` | Git worktrees management | obra/superpowers | 2026-02-06 | Aktivni |
| `using-superpowers` | Meta-skill pro pouzivani superpowers | obra/superpowers | 2026-02-06 | Aktivni |
| `verification-before-completion` | Verifikace pred dokoncenim ukolu | obra/superpowers | 2026-02-06 | Aktivni |
| `writing-plans` | Psani implementacnich planu | obra/superpowers | 2026-02-06 | Aktivni |
| `writing-skills` | Tvorba novych skills | obra/superpowers | 2026-02-06 | Aktivni |

---

## 2) Skills k instalaci (25 skills, 8 kategorii)

> Kandidati identifikovani na zaklade potreb projektu a 22 sekci implementacniho planu.
> Priorita: **P0** = instalovat co nejdrive, **P1** = instalovat pri potrebe, **P2** = nice-to-have.
> Pred instalaci POVINNE projdi bezpecnostni checklist (sekce 3.2.1).

### 2.1 Development (7 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 1 | `commit` | Inteligentni git commit s konvencnim formatem | P0 | Sjednoceni commit formatu, rychlejsi workflow |
| 2 | `review-pr` | Automaticka code review PR | P0 | Doplnek ke code review agentum (`mp-mid-quality-code`) |
| 3 | `todo` | Sprava TODO/FIXME v kodu | P1 | Sledovani technickeho dluhu |
| 4 | `test` | Inteligentni test runner a generovani testu | P1 | Doplnek k test agentum (`mp-spec-test-unit`, `mp-spec-test-e2e`) |
| 5 | `create-file` | Sablonove vytvareni souboru dle konvenci projektu | P1 | Konzistentni novy kod |
| 6 | `refactor` | Inteligentni refaktoring s kontextem | P2 | Kvalita kodu |
| 7 | `debug` | Pokrocily debugger s root-cause analyza | P1 | Rychlejsi bug fixing |

### 2.2 Documentation (3 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 8 | `docs` | Generovani/aktualizace dokumentace | P1 | Automaticka dokumentace, doplnek k `mp-sr-docs` |
| 9 | `changelog` | Generovani changelogu z commitu | P2 | Historie zmen |
| 10 | `readme` | Generovani/aktualizace README | P2 | Onboarding |

### 2.3 Code Quality (3 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 11 | `lint-fix` | Automaticky lint a format opravy | P0 | Konzistence kodu, doplnek k `mp-mid-quality-code` |
| 12 | `type-check` | TypeScript/JSDoc type kontrola | P2 | Type safety (budouci TS migrace) |
| 13 | `dependency-check` | Kontrola zastaralych a nebezpecnych zavislosti | P1 | Bezpecnost, doplnek k `mp-spec-infra-deps` |

### 2.4 Git & Collaboration (2 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 14 | `branch` | Inteligentni sprava vevi | P2 | Git workflow |
| 15 | `merge-conflict` | Asistence pri reseni merge konfliktu | P1 | Mene chyb pri merge |

### 2.5 Security (2 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 16 | `security-scan` | Bezpecnostni sken kodu a zavislosti | P0 | OWASP prevence, doplnek k `mp-sr-security` |
| 17 | `secret-scan` | Detekce leaku secrets v kodu | P0 | API klice, hesla, doplnek k `mp-spec-security-api-keys` |

### 2.6 Performance (2 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 18 | `bundle-analyze` | Analyza bundle velikosti a optimalizace | P1 | Performance, doplnek k `mp-mid-infra-build` |
| 19 | `lighthouse` | Lighthouse audit automatizace | P2 | Web vitals |

### 2.7 Project Management (2 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 20 | `plan` | Strukturovane planovani implementace | P1 | Lepsi planovani, doplnek k `mp-spec-plan-manager` |
| 21 | `estimate` | Odhad slozitosti a rozsahu ukolu | P2 | Planovani |

### 2.8 i18n & Content (2 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 22 | `translate` | Preklad textu CZ<->EN pro i18n soubory | P1 | Lokalizace (Sekce 16), doplnek k `mp-spec-i18n-translations` |
| 23 | `copy-check` | Kontrola textu — preklepy, konzistence, ton | P2 | UI texty |

### 2.9 Database (2 skills)

| # | Skill | Popis | Priorita | Duvod |
|---|-------|-------|----------|-------|
| 24 | `prisma-gen` | Generovani Prisma schematu a migraci | P2 | DB setup (budouci Sekce 18), doplnek k `mp-mid-storage-db` |
| 25 | `sql-review` | Review SQL dotazu a optimalizace | P2 | DB performance |

### Prioritni souhrn

| Priorita | Pocet | Skills |
|----------|-------|--------|
| **P0** | 5 | `commit`, `review-pr`, `lint-fix`, `security-scan`, `secret-scan` |
| **P1** | 10 | `todo`, `test`, `create-file`, `debug`, `docs`, `dependency-check`, `merge-conflict`, `bundle-analyze`, `plan`, `translate` |
| **P2** | 10 | `refactor`, `changelog`, `readme`, `type-check`, `branch`, `lighthouse`, `estimate`, `copy-check`, `prisma-gen`, `sql-review` |

---

## 3) Instalacni guide

### 3.1 Vyhledani skills
```bash
# Pres built-in skill
/find-skills           # interaktivni hledani

# Pres CLI
npx skills find <nazev>
```

### 3.2 Instalace
```bash
npx skills add <nazev>
```

### 3.2.1 POVINNY bezpecnostni sken pred instalaci

> **Zadny skill neinstaluj bez prochazeni tohoto checklistu.** Detailni verze: `CLAUDE.md` sekce 19.3.

```
[ ] 1. ZDROJ — Over autora (stari uctu, stars, commity). Ucet < 3 mesice = VAROVANI.
[ ] 2. KOD — Precti CELY zdrojovy kod. Hledej: eval, exec, curl|bash, base64, pristup ke credentials.
[ ] 3. PROMPTY — Precti .md soubory. Hledej: "ignore instructions", "developer mode", skryte instrukce.
[ ] 4. PERMISSIONS — Over ze pozadovany pristup odpovida ucelu. Shell = VYSOKE RIZIKO.
[ ] 5. SANDBOX — Otestuj v izolaci pred ostrym nasazenim.
```

**Red flags (= NEINSTALOVAT):** `curl|bash` v setup, base64 v prompts, reference na credentials, password-protected archivy, publisher z known-bad listu (viz `CLAUDE.md` sekce 19.6).

### 3.3 Zdroje pro hledani
| Zdroj | URL | Popis |
|-------|-----|-------|
| skills.sh | https://skills.sh/ | Komunitni registr skills |
| aitmpl.com | https://www.aitmpl.com/ | Agenti, skills, hooks, MCPs, commands, settings |

### 3.4 Po instalaci
1. **Monitoruj chovani** — sleduj neocekavane sitove pozadavky, cteni souboru mimo scope. Pokud skill dela neco mimo deklarovany ucel -> okamzite odinstaluj.
2. Over funkcnost (zavolej skill v konverzaci)
3. Aktualizuj tuto tabulku (sekce 1)
4. Zaznamenej do Changelogu (sekce 5)

---

## 4) Effectiveness tracking

> Sleduj jak skills funguj v praxi. Po 5+ pouzitiech vyhodnot.

| Skill | Pouziti | Uspesnost | Poznamky |
|-------|---------|-----------|----------|
| `find-skills` | — | — | Zatim bez dat |
| `conventional-commit` | — | — | Zatim bez dat |
| `review-pr` | — | — | Zatim bez dat |
| `lint-fix` | — | — | Zatim bez dat |
| `secret-scanner` | — | — | Zatim bez dat |
| `webapp-testing` | — | — | Oficial Anthropic |
| `vitest` | — | — | Zatim bez dat |
| `translate` | — | — | Zatim bez dat |
| `dependency-updater` | — | — | Zatim bez dat |
| `git-commit` | — | — | Zatim bez dat |
| `obra/superpowers (14x)` | — | — | Zatim bez dat |

**Hodnoceni uspesnosti:**
- **Vysoka** — skill splnuje ucel, setri cas
- **Stredni** — funguje, ale vyzaduje rucni upravy
- **Nizka** — nespolehlivy, zvazit odinstalaci

---

## 5) Changelog

| Datum | Zmena |
|-------|-------|
| 2026-02-06 | Inicialni verze — find-skills jako jediny nainstalovany skill |
| 2026-02-06 | Rozsireni — 25 skills v 9 kategoriich (Development, Documentation, Code Quality, Git, Security, Performance, Project Management, i18n, Database), P0/P1/P2 priority |
| 2026-02-06 | Instalace 25 skills: 5x P0 (conventional-commit, review-pr, lint-fix, secret-scanner, security-testing), 3x P1-test (webapp-testing, vitest, dependency-updater), 3x P1-git/i18n (git-commit, translate, find-skills), 14x obra/superpowers. |
