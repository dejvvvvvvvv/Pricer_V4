# ClaudeMigrace.md — Kompletni seznam znovupouzitelnych assetu pro novy projekt

> **Zdrojovy projekt:** ModelPricer / Pricer V3
> **Absolutni root:** `C:\Users\Kuňákovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\`
> **Datum:** 2026-02-28

---

## 1. HISTORIE SYSTEM (auto-ukladani konverzaci a uprav)

### Co to je
Strukturovany system pro automaticke zaznamenavani konverzaci, technickych uprav, otazek/odpovedi a dennich prehledu. Kazdy zaznam ma unikatni ID, pouziva sablony a je indexovany v centralnim registru. Chroni pred ztratou kontextu pri compaction konverzace.

### Jak to funguje
1. Claude zkompiluje kontext (konverzace, upravy, otazky)
2. Spusti Task agenta (haiku, general-purpose) s instrukcemi z historie agenta
3. Agent zapise soubory do denni slozky podle sablon
4. Aktualizuje MASTER-HISTORIE.md a ID-REGISTRY.md

### Triggery (kdy se uklada)
- **P0 (povinne):** Pred compaction konverzace, pred `/clear`, pred dodanim planu, pri CP1/CP2/CP3
- **Doporucene:** Zacatek session, konec session, po velkem rozhodnuti
- **Rucni:** Skill `/history` nebo "uloz historii"

### Soubory ke kopirovani

| Soubor | Relativni cesta | Co to je |
|--------|----------------|----------|
| MASTER-HISTORIE.md | `docs/claude/Historie/MASTER-HISTORIE.md` | Centralni index vsech zaznamu (tabulka datum/ID/tema) — 136 radku |
| ID-REGISTRY.md | `docs/claude/Historie/ID-REGISTRY.md` | Globalni pocitadlo ID + 40+ zkratek pro oblasti — 243 radku |
| SABLONA-KONVERZACE.md | `docs/claude/Historie/SABLONY/SABLONA-KONVERZACE.md` | Sablona pro zaznam konverzaci (uzivatel+Claude pary) — 88 radku |
| SABLONA-UPRAVY.md | `docs/claude/Historie/SABLONY/SABLONA-UPRAVY.md` | Sablona pro technicke zmeny (soubory, radky, before/after) — 103 radku |
| SABLONA-OTAZKY.md | `docs/claude/Historie/SABLONY/SABLONA-OTAZKY.md` | Sablona pro Q&A a rozhodnuti — 73 radku |
| SABLONA-DENNI-PREHLED.md | `docs/claude/Historie/SABLONY/SABLONA-DENNI-PREHLED.md` | Sablona pro denni souhrn (sessions, statistiky) — 69 radku |
| SABLONA-FAZE.md | `docs/claude/Historie/SABLONY/SABLONA-FAZE.md` | Sablona pro dokumentaci jednotlivych fazi planu — 266 radku |
| SABLONA-TESTY.md | `docs/claude/Historie/SABLONY/SABLONA-TESTY.md` | Sablona pro browser/automatizovane testy — 109 radku |
| Historie agent | `.claude/agents/mp-spec-docs-historie.md` | Agent definice (haiku, 12 sekci, 299 radku) — instrukce jak zapisovat |
| History skill | `.agents/skills/history/SKILL.md` | Skill `/history` pro rucni trigger — 148 radku |

### ID system
- Format: `{NNN}-{ZK}` — 3-ciselne pocitadlo + 2-znakova zkratka oblasti
- Session format: `S{NN}` — cislovano v ramci dne
- 6 typu zaznamu: KONVERZACE, UPRAVY, OTAZKY, FAZE, DENNI-PREHLED, TESTY

### Jak nasadit v novem projektu
1. Zkopiruj `docs/claude/Historie/SABLONY/` (6 sablon)
2. Zkopiruj a vycisti `MASTER-HISTORIE.md` (smazat stare zaznamy, nechat strukturu)
3. Zkopiruj a vycisti `ID-REGISTRY.md` (resetovat pocitadlo na 001, upravit zkratky pro novy projekt)
4. Zkopiruj `.claude/agents/mp-spec-docs-historie.md`
5. Zkopiruj `.agents/skills/history/SKILL.md`
6. Pridej pravidlo do CLAUDE.md noveho projektu (viz sekce 10 nize)

---

## 2. AGENT SYSTEM (107 agentu, 3 urovne, 13 domen)

### Co to je
Hierarchicky system specializovanych agentu rozdelennych do 3 urovni (Senior/Middle/Specific) a 13 domen. Kazdy agent ma definici v .md souboru s instrukcemi, scopem, modelem a pravidly.

### Jak to funguje
- **Senior (sr):** Opus model, architektura + review + delegace (13 agentu)
- **Middle (mid):** Sonnet model, 2-4 podoblasti (18 agentu)
- **Specific (spec):** Haiku/Sonnet, 1 uzka vec (76 agentu)
- **Eskalace:** spec → mid → sr → orchestrator
- **Pojmenovani:** `mp-{tier}-{domain}-{specialization}`

### Soubory ke kopirovani

#### Hlavni registry
| Soubor | Relativni cesta | Co to je |
|--------|----------------|----------|
| AGENT_MAP.md | `docs/claude/AGENT_MAP.md` | Kompletni mapa 107 agentu — 469 radku, 13 domen, hot spots, vlastnictvi souboru |

#### Senior agenti (13) — `.claude/agents/`
| Agent | Soubor | Ucel |
|-------|--------|------|
| mp-sr-orchestrator | `mp-sr-orchestrator.md` | Tier0 orchestrator, delegace prace, konflikt management |
| mp-sr-frontend | `mp-sr-frontend.md` | Frontend architektura, React, Vite, patterns |
| mp-sr-backend | `mp-sr-backend.md` | Backend architektura, Node.js, Express, Firebase |
| mp-sr-pricing | `mp-sr-pricing.md` | Pricing strategie, deterministicky pipeline |
| mp-sr-storage | `mp-sr-storage.md` | Data persistence, tenant izolace |
| mp-sr-security | `mp-sr-security.md` | Threat modeling, OWASP Top 10 |
| mp-sr-quality | `mp-sr-quality.md` | Testing strategie, code review standardy |
| mp-sr-infra | `mp-sr-infra.md` | CI/CD architektura, deployment |
| mp-sr-design | `mp-sr-design.md` | Design system, vizualni konzistence |
| mp-sr-i18n | `mp-sr-i18n.md` | Lokalizace, preklady |
| mp-sr-3d | `mp-sr-3d.md` | 3D workflow, mesh analyza |
| mp-sr-ecommerce | `mp-sr-ecommerce.md` | E-commerce integrace |
| mp-sr-docs | `mp-sr-docs.md` | Dokumentacni strategie |

#### Middle agenti (18) — `.claude/agents/`
| Agent | Soubor | Ucel |
|-------|--------|------|
| mp-mid-frontend-public | `mp-mid-frontend-public.md` | Verejne stranky, kalkulacka |
| mp-mid-frontend-admin | `mp-mid-frontend-admin.md` | Admin panel UI/UX |
| mp-mid-frontend-widget | `mp-mid-frontend-widget.md` | Widget, embed, postMessage |
| mp-mid-design-system | `mp-mid-design-system.md` | UI tokeny, komponenty |
| mp-mid-design-ux | `mp-mid-design-ux.md` | User flows, interakce |
| mp-mid-backend-api | `mp-mid-backend-api.md` | REST API, validace |
| mp-mid-backend-services | `mp-mid-backend-services.md` | Business logic services |
| mp-mid-backend-data | `mp-mid-backend-data.md` | Data layer, DB modely |
| mp-mid-pricing-engine | `mp-mid-pricing-engine.md` | Pricing pipeline |
| mp-mid-pricing-discounts | `mp-mid-pricing-discounts.md` | Slevy, kupony |
| mp-mid-storage-tenant | `mp-mid-storage-tenant.md` | Tenant localStorage |
| mp-mid-storage-db | `mp-mid-storage-db.md` | PostgreSQL, schema |
| mp-mid-security-app | `mp-mid-security-app.md` | XSS, CSRF, injection |
| mp-mid-security-infra | `mp-mid-security-infra.md` | CORS, headers, rate limiting |
| mp-mid-quality-code | `mp-mid-quality-code.md` | Code review, lint |
| mp-mid-quality-test | `mp-mid-quality-test.md` | Testing strategie, coverage |
| mp-mid-infra-build | `mp-mid-infra-build.md` | Vite config, build |
| mp-mid-infra-deploy | `mp-mid-infra-deploy.md` | Deploy, CI/CD |

#### Specific agenti (76) — `.claude/agents/`
Kompletni seznam ve 13 domenach:

**Frontend (12):** `mp-spec-fe-layout`, `mp-spec-fe-forms`, `mp-spec-fe-3d-viewer`, `mp-spec-fe-state`, `mp-spec-fe-animations`, `mp-spec-fe-tables`, `mp-spec-fe-charts`, `mp-spec-fe-kanban`, `mp-spec-fe-upload`, `mp-spec-fe-checkout`, `mp-spec-fe-notifications`, `mp-spec-fe-routing`

**Design (5):** `mp-spec-design-responsive`, `mp-spec-design-a11y`, `mp-spec-design-user-friendly`, `mp-spec-design-onboarding`, `mp-spec-design-icons`

**Backend (8):** `mp-spec-be-slicer`, `mp-spec-be-upload`, `mp-spec-be-email`, `mp-spec-be-auth`, `mp-spec-be-queue`, `mp-spec-be-websocket`, `mp-spec-be-pdf`, `mp-spec-be-webhooks`

**Pricing (6):** `mp-spec-pricing-fees`, `mp-spec-pricing-shipping`, `mp-spec-pricing-tax`, `mp-spec-pricing-currency`, `mp-spec-pricing-coupons`, `mp-spec-pricing-methods`

**Storage (4):** `mp-spec-storage-tenant-id`, `mp-spec-storage-migration`, `mp-spec-storage-cache`, `mp-spec-storage-branding`

**Security (5):** `mp-spec-security-api-keys`, `mp-spec-security-upload`, `mp-spec-security-auth`, `mp-spec-security-injection`, `mp-spec-security-gdpr`

**Testing (6):** `mp-spec-test-unit`, `mp-spec-test-e2e`, `mp-spec-test-api`, `mp-spec-test-visual`, `mp-spec-test-build`, `mp-spec-test-browser`

**Infra (4):** `mp-spec-infra-docker`, `mp-spec-infra-firebase`, `mp-spec-infra-deps`, `mp-spec-infra-monitoring`

**i18n (3):** `mp-spec-i18n-translations`, `mp-spec-i18n-currency`, `mp-spec-i18n-dates`

**3D (3):** `mp-spec-3d-viewer`, `mp-spec-3d-analysis`, `mp-spec-3d-conversion`

**E-commerce (9):** `mp-spec-ecom-shopify`, `mp-spec-ecom-shopify-storefront`, `mp-spec-fe-shopify-cart`, `mp-spec-ecom-product-mapping`, `mp-spec-fe-admin-integrations`, `mp-spec-ecom-embed-bridge`, `mp-spec-ecom-woo`, `mp-spec-ecom-payments`, `mp-spec-ecom-api`

**Planning (6):** `mp-spec-plan-manager`, `mp-spec-plan-frontend`, `mp-spec-plan-backend`, `mp-spec-plan-ux`, `mp-spec-plan-critic`, `mp-spec-plan-product`

**Docs & Research (5):** `mp-spec-docs-api`, `mp-spec-docs-dev`, `mp-spec-docs-historie`, `mp-spec-research-web`, `mp-spec-research-oss`

#### Sablony pro vytvareni novych agentu (18)
Ulozeny v `docs/claude/backup-old-agents/templates/`:

| Sablona | Soubor | Pouziti |
|---------|--------|---------|
| UI/UX Designer | `templates/ui-ux-designer.md` | Design agenti |
| Frontend Developer | `templates/frontend-developer.md` | FE agenti |
| Backend Architect | `templates/backend-architect.md` | BE agenti |
| Code Reviewer | `templates/code-reviewer.md` | Quality agenti |
| Test Engineer | `templates/test-engineer.md` | Testing agenti |
| Security Auditor | `templates/security-auditor.md` | Security agenti |
| Performance Profiler | `templates/performance-profiler.md` | Perf agenti |
| Technical Writer | `templates/technical-writer.md` | Docs agenti |
| Web Accessibility Checker | `templates/web-accessibility-checker.md` | A11y agenti |
| React Performance Optimizer | `templates/react-performance-optimizer.md` | React perf |
| Architect Review | `templates/architect-review.md` | Arch review |
| API Documenter | `templates/api-documenter.md` | API docs |
| Dependency Manager | `templates/dependency-manager.md` | Deps management |
| Database Architect | `templates/database-architect.md` | DB design |
| JavaScript Pro | `templates/javascript-pro.md` | JS expertise |
| DevOps Engineer | `templates/devops-engineer.md` | CI/CD, infra |
| API Security Audit | `templates/api-security-audit.md` | API security |
| Debugger | `templates/debugger.md` | Debugging |

### Ktere agenty pouzit v novem projektu
**Vzdy relevantni (genericke):**
- Orchestrator (`mp-sr-orchestrator`)
- Frontend (`mp-sr-frontend`, `mp-mid-frontend-*`)
- Backend (`mp-sr-backend`, `mp-mid-backend-*`)
- Security (`mp-sr-security`, `mp-mid-security-*`, `mp-spec-security-*`)
- Quality (`mp-sr-quality`, `mp-mid-quality-*`, `mp-spec-test-*`)
- Infra (`mp-sr-infra`, `mp-mid-infra-*`)
- Design (`mp-sr-design`, `mp-mid-design-*`, `mp-spec-design-*`)
- Planning (`mp-spec-plan-*`)
- Docs (`mp-sr-docs`, `mp-spec-docs-*`, `mp-spec-research-*`)
- Historie (`mp-spec-docs-historie`)

**Projekt-specificke (upravit nebo vynechat):**
- Pricing agenti — specificke pro ModelPricer
- 3D agenti — specificke pro 3D tisk
- E-commerce agenti — specificke pro Shopify/WooCommerce
- Storage tenant agenti — zavisi na architekture noveho projektu

---

## 3. SKILLS (29 nainstalovanych)

### Co to je
Skills jsou instrukcni soubory (SKILL.md) ktere rozsiruji schopnosti Claude o specializovane workflow. Spousti se pres `/nazev-skillu` nebo automaticky.

### Soubory ke kopirovani

#### P0 Skills — Povinne pro kazdy projekt
| Skill | Cesta | Prikaz | Popis |
|-------|-------|--------|-------|
| conventional-commit | `.agents/skills/conventional-commit/SKILL.md` | `/conventional-commit` | Conventional commit messages (type/scope/body) |
| review-pr | `.agents/skills/review-pr/SKILL.md` | `/review-pr` | Automaticky code review PR/diffu |
| lint-fix | `.agents/skills/lint-fix/SKILL.md` | `/lint-fix` | Autofix lint chyb + report |
| secret-scanner | `.agents/skills/secret-scanner/SKILL.md` | `/secret-scanner` | Detekce secrets v kodu |
| security-testing | `.agents/skills/security-testing/SKILL.md` | `/security-testing` | OWASP security testing (SAST/DAST) |

#### P1 Skills — Doporucene
| Skill | Cesta | Prikaz | Popis |
|-------|-------|--------|-------|
| webapp-testing | `.agents/skills/webapp-testing/SKILL.md` | `/webapp-testing` | Playwright browser testy (Anthropic official) |
| vitest | `.agents/skills/vitest/SKILL.md` | `/vitest` | Vitest unit testing framework |
| dependency-updater | `.agents/skills/dependency-updater/SKILL.md` | `/dependency-updater` | Smart aktualizace deps (Node/Python/Go/Rust) |
| git-commit | `.agents/skills/git-commit/SKILL.md` | `/git-commit` | Inteligentni git commit s analyzi zmen |
| translate | `.agents/skills/translate/SKILL.md` | `/translate` | Preklad XLF souboru |
| find-skills | `.agents/skills/find-skills/SKILL.md` | `/find-skills` | Vyhledavani a instalace novych skills |

#### Obra Superpowers — Workflow skills (14)
| Skill | Cesta | Prikaz | Popis |
|-------|-------|--------|-------|
| brainstorming | `.agents/skills/brainstorming/SKILL.md` | `/brainstorming` | Strukturovany brainstorm pred implementaci |
| dispatching-parallel-agents | `.agents/skills/dispatching-parallel-agents/SKILL.md` | `/dispatching-parallel-agents` | Paralelni spousteni nezavislych tasku |
| executing-plans | `.agents/skills/executing-plans/SKILL.md` | `/executing-plans` | Exekuce planu s checkpointy |
| finishing-a-development-branch | `.agents/skills/finishing-a-development-branch/SKILL.md` | `/finishing-a-development-branch` | Dokonceni prace — merge/PR/cleanup |
| receiving-code-review | `.agents/skills/receiving-code-review/SKILL.md` | `/receiving-code-review` | Zpracovani code review feedbacku |
| requesting-code-review | `.agents/skills/requesting-code-review/SKILL.md` | `/requesting-code-review` | Vyslani prace na review |
| subagent-driven-development | `.agents/skills/subagent-driven-development/SKILL.md` | `/subagent-driven-development` | Implementace pres subagenty s review |
| systematic-debugging | `.agents/skills/systematic-debugging/SKILL.md` | `/systematic-debugging` | 4-fazovy debugging (root cause, hypothesis, test) |
| test-driven-development | `.agents/skills/test-driven-development/SKILL.md` | `/test-driven-development` | TDD cyklus: RED → GREEN → REFACTOR |
| using-git-worktrees | `.agents/skills/using-git-worktrees/SKILL.md` | `/using-git-worktrees` | Izolace prace v git worktrees |
| using-superpowers | `.agents/skills/using-superpowers/SKILL.md` | `/using-superpowers` | Meta-skill pro discovery dalsich skills |
| verification-before-completion | `.agents/skills/verification-before-completion/SKILL.md` | `/verification-before-completion` | Verifikace pred tvrzenim ze je hotovo |
| writing-plans | `.agents/skills/writing-plans/SKILL.md` | `/writing-plans` | Psani implementacnich planu |
| writing-skills | `.agents/skills/writing-skills/SKILL.md` | `/writing-skills` | Tvorba novych skills (TDD pristup) |

#### Projekt-specificke skills (4)
| Skill | Cesta | Prikaz | Popis |
|-------|-------|--------|-------|
| history | `.agents/skills/history/SKILL.md` | `/history` | Auto-save konverzaci (REUSABLE — viz sekce 1) |
| shopify-storefront-setup | `.agents/skills/shopify-storefront-setup/SKILL.md` | `/shopify-storefront-setup` | Shopify Storefront API bootstrap |
| ecommerce-security-checklist | `.agents/skills/ecommerce-security-checklist/SKILL.md` | `/ecommerce-security-checklist` | E-commerce security audit |
| webhook-handler-patterns | `.agents/skills/webhook-handler-patterns/SKILL.md` | `/webhook-handler-patterns` | Webhook receiver patterns |

#### Skills registry
| Soubor | Cesta | Popis |
|--------|-------|-------|
| SKILLS_MAP.md | `docs/claude/SKILLS_MAP.md` | Hlavni registr vsech 29 skills — 233 radku |

### Jak nasadit v novem projektu
1. Zkopiruj `.agents/skills/` (cela slozka) do noveho projektu
2. Vytvor symlinky z `.claude/skills/` na `.agents/skills/` (nebo zkopiruj)
3. Zkopiruj a uprav `docs/claude/SKILLS_MAP.md`
4. Odeber projekt-specificke skills (shopify, ecommerce) pokud neni potreba

---

## 4. MCP SERVERY (konfigurace externich nastroju)

### Co to je
MCP (Model Context Protocol) servery poskytují Claude pristup k externim sluzbam — databaze, vyhledavani, browser automatizace, deployment atd.

### Aktivni servery (10)

| Server | Typ | K cemu slouzi | Konfigurace |
|--------|-----|--------------|-------------|
| **Supabase** | Plugin | Pristup k DB, migrace, SQL dotazy, tabulky, edge functions | `.claude/settings.json` (enabledPlugins) |
| **Context7** | HTTP | Aktualni dokumentace jakekoli knihovny/frameworku | `.mcp.json` nebo settings |
| **Brave Search** | stdio | Webove vyhledavani (web, news, video, image) | `.mcp.json` |
| **idea-reality** | stdio | Kontrola duplicitnich napadu | `.mcp.json` |
| **Claude in Chrome** | Extension | Browser automatizace (klikani, formulare, screenshoty) | Chrome extension |
| **Firebase** | stdio/OAuth | Auth users, Firestore CRUD, security rules validace | `.claude/settings.local.json` |
| **GitHub** | stdio/OAuth | PRs, issues, code review, search | `.claude/settings.local.json` |
| **Stripe** | HTTP/OAuth | Zakaznici, produkty, ceny, subscriptions, faktury | `.claude/settings.local.json` |
| **Sentry** | HTTP/OAuth | Error monitoring, root cause analyza, stack traces | `.claude/settings.local.json` |
| **Vercel** | HTTP/OAuth | Deployment, build logy, runtime logy, domeny | `.claude/settings.local.json` |

### Soubory ke kopirovani

| Soubor | Relativni cesta | Co to je |
|--------|----------------|----------|
| MCP config | `.mcp.json` | Definice MCP serveru (OBSAHUJE TOKENY — nikdy necommitovat!) |
| MCP setup guide | `docs/claude/MCP_SETUP_VSCODE.md` | Navod na nastaveni MCP v VS Code |
| Settings local | `.claude/settings.local.json` | Permissions + MCP server enablement (OBSAHUJE TOKENY!) |
| Settings | `.claude/settings.json` | Pluginy (frontend-design, playground) |

### Struktura `.mcp.json` (bez secrets)
```json
{
  "mcpServers": {
    "idea-reality": { "type": "stdio", "command": "uvx", "args": ["idea-reality-mcp"] }
  }
}
```

### Struktura `.claude/settings.local.json` (bez secrets)
```json
{
  "allow": [
    "Bash(*)", "Edit(*)", "Write(*)", "WebFetch(*)", "WebSearch",
    "mcp__context7__*",
    "mcp__brave-search__*",
    "mcp__claude-in-chrome__*",
    "mcp__firebase__*",
    "mcp__github__*",
    "mcp__stripe__*",
    "mcp__plugin_supabase_supabase__*"
  ],
  "enableAllProjectMcpServers": true,
  "enabledMcpjsonServers": ["idea-reality", "firebase", "github", "stripe", "sentry", "vercel"]
}
```

### Ktere MCP servery pouzit v novem projektu
**Univerzalni (vzdy):** Context7, Brave Search, Claude in Chrome, GitHub
**Podle potreby:** Supabase (pokud DB), Firebase (pokud auth), Stripe (pokud platby), Vercel (pokud deploy), Sentry (pokud monitoring)

---

## 5. PRAVIDLA (rules pro planovani a implementaci)

### Co to je
Dva klicove soubory ktere definuji JAK pracovat — povinne pro kazde planovani a implementaci.

### Soubory ke kopirovani

| Soubor | Relativni cesta | Radku | Co to je |
|--------|----------------|-------|----------|
| Hlavni Pozadavky | `docs/claude/Pravidla/Hlavni_Pozadavky.md` | ~97 | Pravidla: max vyuziti agentu, vytvareni novych agentu, min 3 otazky pred planem, kontrolni seznam |
| 4 Kroky | `docs/claude/Pravidla/4kroky.md` | ~131 | 4 povinne kontrolni kroky po kazde implementacni fazi: historie → test → historie → compact |

### Hlavni Pozadavky — obsah
1. **Maximalni vyuziti agentu** — tabulka distribuce agentu pro kazdou fazi prace
2. **Vytvareni novych agentu** — pri planovani se musi vytvorit agenti, ihned dokumentovat
3. **Otazky pred planovanim** — minimum 3 otazky ve dvouvrstvem formatu (jednoduchy + technicky)
4. **Kontrolni seznam pro plan** — checklist pred dodanim planu

### 4 Kroky — obsah
1. **Struktura fazi** — strida se pracovni + kontrolni faze (vysvetleni proc)
2. **4 kontrolni kroky:**
   - Krok 1: Uloz historii (pred testovanim)
   - Krok 2: Otestuj na webu (Chrome/Playwright)
   - Krok 3: Uloz historii (po testovani)
   - Krok 4: Compact kontext
3. **Format kontrolni faze v planu** — presny format s prikladem
4. **Proc tento format** — prevence preskoceni kroku

### Reusabilita
OBA soubory jsou **plne znovupouzitelne** — obsahuji genericke procesy aplikovatelne na jakykoliv projekt. Staci upravit nazvy domen/oblasti.

---

## 6. CLAUDE.md (hlavni instrukcni soubor)

### Co to je
Master instrukcni soubor ktery Claude nacita na zacatku kazde konverzace. Definuje invarianty, workflow, pravidla, cesty a standardy.

### Soubory ke kopirovani

| Soubor | Relativni cesta | Radku | Co to je |
|--------|----------------|-------|----------|
| Compact CLAUDE.md | `CLAUDE.md` (root) | ~278 | Zkracena verze pro rychle nahrani — klicova pravidla, cesty, invarianty |
| Full CLAUDE.md | `Model_Pricer-V2-main/CLAUDE.md` | ~660 | Kompletni verze, 20 sekci (0-19) |

### Klicove sekce (reusable)
- **Sekce 0:** Agent-first filozofie a hlavni workflow
- **Sekce 2:** Invarianty (6 zakladnich pravidel)
- **Sekce 3:** Agent system (hierarchie, domeny, handoff format, hot spot koordinace)
- **Sekce 4:** Skills, hooks, MCP, security scan pravidla
- **Sekce 6:** Workflow CP1/CP2/CP3 (checkpoint system)
- **Sekce 17.5:** Historie system detaily
- **Sekce 19:** Prompt Injection Prevention (P0 security)
- **Sekce 20:** Anti-hallucination gate (povinne otazky)

### Jak nasadit v novem projektu
1. Zkopiruj `CLAUDE.md` do rootu noveho projektu
2. Uprav projekt-specificke casti (cesty, nazvy stranok, tech stack)
3. Zachovej genericke sekce (invarianty, workflow, security, agent system, historie)

---

## 7. DOKUMENTACNI SYSTEM

### Co to je
Strukturovany system 45+ dokumentacnich souboru pokryvajicich kazdu stranku, komponentu a system v projektu.

### Soubory ke kopirovani (struktura)

| Soubor | Relativni cesta | Co to je |
|--------|----------------|----------|
| Master index | `docs/claude/Documentation/00-MASTER-Dokumentace.md` | Centralni rozcestnik vsech dokumentaci — 1900+ radku |

### Struktura dokumentacni slozky
```
docs/claude/Documentation/
  00-MASTER-Dokumentace.md     — Index
  Account-Dokumentace.md       — Account page
  Routing-Dokumentace.md       — Router
  Pricing-Engine-Dokumentace.md — Pricing
  Storage-Utilities-Dokumentace.md — Storage
  Forge-Design-System-Dokumentace.md — Design system
  Supabase-Dokumentace.md      — Supabase
  Build-Config-Dokumentace.md  — Build/Vite
  LanguageContext-Dokumentace.md — i18n
  Widget-Kalkulacka-Dokumentace.md — Widget
  Test-Kalkulacka-Dokumentace.md — Test calculator
  ... (45+ souboru celkem)
```

### Jak nasadit v novem projektu
1. Vytvor `docs/claude/Documentation/`
2. Zkopiruj `00-MASTER-Dokumentace.md` jako sablonu (smazat obsah, nechat strukturu)
3. Pro kazdou stranku/komponentu vytvor `{Nazev}-Dokumentace.md`
4. Pridej pravidlo do CLAUDE.md: "Po KAZDE uprave aktualizuj dokumentaci"

---

## 8. MEMORY SYSTEM

### Co to je
Persistentni pamet Claude mezi konverzacemi. MEMORY.md se automaticky nacita pri kazde konverzaci a obsahuje klicove informace o projektu.

### Kde je ulozena
```
{USER_HOME}\.claude\projects\{PROJECT_HASH}\memory\MEMORY.md
```
Pro tento projekt:
```
C:\Users\Kunakovi\.claude\projects\C--Users-Ku--kovi-Downloads-Model-Pricer-V2-main-VariantaA-A-to-F-Integrated\memory\MEMORY.md
```

### Struktura MEMORY.md (sablona pro novy projekt)
```markdown
# MEMORY.md — {Nazev Projektu}

## MCP Servery (aktivni)
- seznam serveru s typem a ucelem

## Klicove cesty
- CLAUDE.md, AGENT_MAP, SKILLS_MAP, Historie, Docs

## Konvence
- jazyk dokumentace, naming konvence, reference format

## Agent hierarchie
- pocet agentu, tier breakdown, domeny

## Nainstalovane skills
- P0, P1, superpowers seznam

## Hot spots
- problematicke soubory s vlastniky

## Pasti
- zname gotchas a workaroundy
```

### Jak nasadit
MEMORY.md se vytvari automaticky Claude Code v `.claude/projects/` adresari. Pro novy projekt:
1. Claude si automaticky vytvori prazdnou MEMORY.md
2. Postupne ji plni behem prace
3. Max 200 radku (zbytek se truncatuje)

---

## 9. SETTINGS A KONFIGURACE

### Soubory ke kopirovani

| Soubor | Relativni cesta | Co to je |
|--------|----------------|----------|
| Claude settings | `.claude/settings.json` | Povolene pluginy (frontend-design, playground) |
| Claude local settings | `.claude/settings.local.json` | Permissions + MCP servery (OBSAHUJE TOKENY!) |
| MCP config | `.mcp.json` | MCP server definice (OBSAHUJE TOKENY!) |
| Gitignore entries | `.gitignore` | Blokuje `.mcp.json`, citlive soubory, AI IDE nastroje |

### Dulezite .gitignore polozky pro Claude
```
.mcp.json
**/Supabase_Information*
**/supabase-credentials*
.cursor/
.windsurf/
.continue/
```

---

## 10. KOMPLETNI CHECKLIST PRO NOVY PROJEKT

### Krok 1: Zakladni struktura
```
novy-projekt/
  CLAUDE.md                          ← zkopiruj a uprav z CLAUDE.md
  .mcp.json                          ← vytvor novou s potrebnymi servery
  .gitignore                         ← pridej .mcp.json, settings.local.json
  .claude/
    settings.json                    ← pluginy
    settings.local.json              ← permissions + MCP
    agents/                          ← zkopiruj relevantni agenty
  .agents/
    skills/                          ← zkopiruj vsechny skills
  docs/
    claude/
      AGENT_MAP.md                   ← zkopiruj a uprav
      SKILLS_MAP.md                  ← zkopiruj a uprav
      Pravidla/
        Hlavni_Pozadavky.md          ← zkopiruj
        4kroky.md                    ← zkopiruj
      Historie/
        MASTER-HISTORIE.md           ← zkopiruj (prazdna verze)
        ID-REGISTRY.md               ← zkopiruj (reset na 001)
        SABLONY/                     ← zkopiruj vsech 6 sablon
      Documentation/
        00-MASTER-Dokumentace.md     ← zkopiruj (prazdna verze)
```

### Krok 2: Agenti
1. Zkopiruj `.claude/agents/` — vyber relevantni agenty
2. Prejmenovani prefixu (napr. `mp-` → `np-` pro novy projekt)
3. Uprav AGENT_MAP.md — smazat nepotrebne domeny, pridat nove
4. Zkopiruj `docs/claude/backup-old-agents/templates/` pro tvorbu novych

### Krok 3: Skills
1. Zkopiruj `.agents/skills/` (celou slozku)
2. Odeber projekt-specificke (shopify, ecommerce) pokud neni potreba
3. Aktualizuj SKILLS_MAP.md

### Krok 4: MCP Servery
1. Vytvor `.mcp.json` s potrebnymi servery
2. Nastavit tokeny/credentials
3. Vytvor `.claude/settings.local.json` s permissions

### Krok 5: Historie
1. Zkopiruj 6 sablon z `docs/claude/Historie/SABLONY/`
2. Inicializuj `MASTER-HISTORIE.md` (prazdna tabulka)
3. Inicializuj `ID-REGISTRY.md` (pocitadlo 001, nove zkratky)
4. Zkopiruj agent `mp-spec-docs-historie.md` a skill `history/SKILL.md`

### Krok 6: Pravidla do CLAUDE.md
Pridej do CLAUDE.md noveho projektu:
- Reference na `Hlavni_Pozadavky.md` a `4kroky.md`
- Anti-hallucination gate (min 3 otazky pred planem)
- Dokumentacni povinnost (aktualizuj po kazde zmene)
- Historie triggery (pred compaction, pred clear, pri CP)
- Quality gates (build, smoke test, dokumentace)
- Security pravidla (security scan externych veci)

---

## 11. ZDROJOVE ABSOLUTNI CESTY (pro kopirovani)

### Historie
```
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Historie\SABLONY\
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Historie\MASTER-HISTORIE.md
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Historie\ID-REGISTRY.md
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\.claude\agents\mp-spec-docs-historie.md
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\.agents\skills\history\SKILL.md
```

### Agenti
```
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\.claude\agents\          (107 souboru)
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\AGENT_MAP.md
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\backup-old-agents\templates\ (18 sablon)
```

### Skills
```
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\.agents\skills\          (29 skills)
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\SKILLS_MAP.md
```

### MCP & Settings
```
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\.mcp.json
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\.claude\settings.json
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\.claude\settings.local.json
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\MCP_SETUP_VSCODE.md
```

### Pravidla
```
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Pravidla\Hlavni_Pozadavky.md
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Pravidla\4kroky.md
```

### CLAUDE.md
```
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\CLAUDE.md
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\Model_Pricer-V2-main\CLAUDE.md
```

### Dokumentace
```
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Documentation\
C:\Users\Kunakovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Documentation\00-MASTER-Dokumentace.md
```

---

## 12. STATISTIKY

| Oblast | Pocet souboru | Celkem radku |
|--------|--------------|-------------|
| Historie (sablony) | 6 | 708 |
| Historie (agent + skill) | 2 | 447 |
| Agenti (aktivni) | 107 | ~15,000+ |
| Agent sablony | 18 | ~1,500+ |
| Skills | 29 | ~5,000+ |
| Pravidla | 2 | 228 |
| CLAUDE.md (oba) | 2 | ~938 |
| Dokumentace | 45+ | ~20,000+ |
| MCP/Settings | 4 | ~200 |
| **CELKEM** | **~215+** | **~44,000+** |
