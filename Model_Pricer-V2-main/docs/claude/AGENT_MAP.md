# Agent Map — ModelPricer / Pricer V3 (Scope & Ownership)

Tento dokument říká „kdo vlastní které části repa“, aby se agenti nepřetahovali o stejné soubory.
Zároveň u každého agenta uvádí **jazyk** a **kdy ho volat**.

> Zdroje stacku: repo `package.json`, `backend-local/package.json` (ESM), `functions/index.js` (JS).

---

## Tier 0 — Orchestrátor

### mp-orchestrator
- **Jazyk:** žádné kódování primárně; plánování, delegace, integrace.
- **Volat když:** potřebuješ rozdělit práci, merge plán, nebo hrozí konflikt souborů.
- **Scope:** read-only napříč repem + plánování (nemá dělat velké implementace).
- **Output:** P0/P1/P2, přiřazení agentů, merge pořadí, test checklist.
- **Handoff na plánovací systém:** Pro komplexní úkoly (více subsystémů) deleguje na `mp-plan-manager`.

---

## Tier 0.5 — Plánovací Agenti

> Pro komplexní úkoly před implementací. Detaily: `docs/claude/PLANNING_SYSTEM.md`

### mp-plan-manager
- **Model:** opus-4.5
- **Jazyk:** plánování, koordinace (žádná implementace).
- **Volat když:** komplexní feature zasahující více subsystémů; potřeba koordinovaného plánu.
- **Scope:** koordinace plánovacích agentů, syntéza plánů.
- **Output:** finální plán s kroky, soubory, riziky, test checklistem.

### mp-plan-frontend
- **Model:** sonnet
- **Jazyk:** plánování FE architektury (žádná implementace).
- **Volat když:** plánování UI komponent, routing, state managementu.
- **Scope:** read-only `/src/pages/**`, `/src/components/**`, `/src/Routes.jsx`.
- **Output:** FE plán (komponenty, routing, API požadavky).

### mp-plan-backend
- **Model:** sonnet
- **Jazyk:** plánování BE architektury (žádná implementace).
- **Volat když:** plánování API endpointů, data flow, integrací.
- **Scope:** read-only `/backend-local/**`, storage schema.
- **Output:** BE plán (endpointy, request/response, error handling).

### mp-plan-ux
- **Model:** sonnet
- **Jazyk:** plánování UX (žádná implementace).
- **Volat když:** plánování user flows, interakcí, stavů obrazovek.
- **Scope:** read-only UI stránky.
- **Output:** UX plán (flows, states, feedback).
- **Pravidlo:** Anti-AI-generic — žádné dekorativní prvky bez účelu.

### mp-plan-critic
- **Model:** opus-4.5
- **Jazyk:** kritická revize (žádná implementace).
- **Volat když:** POVINNÉ pro změny >3 souborů nebo více subsystémů.
- **Scope:** read-only finální plán.
- **Output:** P0/P1/P2 issues s konkrétními řešeními.
- **Perspektivy:** nový uživatel, admin 3D print firmy, koncový zákazník (widget).

### mp-oss-scout
- **Model:** sonnet
- **Jazyk:** OSS vyhledávání (žádná implementace).
- **MCP:** context7, brave-search (s povinným logováním).
- **Volat když:** potřeba nové knihovny; ověření licence existující závislosti.
- **Scope:** web search + licence kontrola.
- **Output:** OSS report s doporučením a licenční kontrolou.
- **BLOCK:** GPL, AGPL, CC-BY-NC, Unlicensed = automatický BLOCK.

---

## Tier 1 — Implementační specialisté

### mp-frontend-react
- **Jazyk:** JavaScript + JSX (React/Vite).
- **Volat když:** public stránky, routing, UI komponenty mimo admin.
- **Scope:**
  - `/src/pages/*` (mimo `/src/pages/admin`)
  - `/src/components/ui/*`
  - `/src/components/marketing/*`
  - `/src/Routes.jsx`, `/src/App.jsx`
- **Out of scope:** `/backend-local`, `/functions`, admin stránky.

### mp-admin-ui
- **Jazyk:** JavaScript + JSX.
- **Volat když:** `/admin/*` UI, tabulky, formuláře, ukládání do storage helperů.
- **Scope:** `/src/pages/admin/*`, `/src/components/ui/*`, související `/src/utils/*`.
- **Out of scope:** kalkulačka/widget pages (pokud není výslovně).

### mp-widget-embed
- **Jazyk:** JavaScript + JSX + browser postMessage.
- **Volat když:** embed (iframe), domain whitelist, postMessage protokol, veřejná route widgetu.
- **Scope:** widget/public pages + embed snippet + bezpečnostní kontroly origin/referrer.
- **Pozn.:** koordinuj s mp-admin-ui (protože embed snippet se často generuje v adminu).

### mp-pricing-engine
- **Jazyk:** JavaScript (lib/service).
- **Volat když:** výpočet ceny, rounding, minima, markup, breakdown, NaN/0 bugy.
- **Scope:** `/src/lib/pricing/*`, `/src/lib/pricingService.js` (pokud existuje).
- **Out of scope:** UI redesign.

### mp-fees-engine
- **Jazyk:** JavaScript.
- **Volat když:** fees/conditions, scope MODEL/ORDER, percent/per_minute/per_gram, negativní slevy.
- **Scope:** `/src/utils/adminFeesStorage.js`, `/src/pages/admin/AdminFees*`, fees část engine.
- **Output navíc:** tabulka context keys (fee conditions).

### mp-storage-tenant
- **Jazyk:** JavaScript.
- **Volat když:** tenantId, migrace legacy localStorage klíčů, sjednocení helperů.
- **Scope:** `/src/utils/adminTenantStorage.js` + všechny `admin*Storage.js`.
- **Output:** migration notes + idempotence.

### mp-backend-node
- **Jazyk:** Node.js JavaScript (ESM).
- **Volat když:** `/backend-local` endpoints, upload handling, request validation, error handling.
- **Scope:** `/backend-local/**`.
- **Out of scope:** frontend UI.

### mp-slicer-integration
- **Jazyk:** Node.js JavaScript (ESM) + CLI orchestrace.
- **Volat když:** PrusaSlicer CLI, ini/presets, parsování outputu, timeouts, fallback.
- **Scope:** primárně `/backend-local/**`; sekundárně admin/presets import jen když nutné.

---

## Tier 2 — Kvalita

### mp-code-reviewer (read-only)
- **Volat když:** po větší změně; hledá P0 bugy a regresní rizika.
- **Scope:** read-only napříč repem.

### mp-security-reviewer (read-only)
- **Volat když:** widget embed, upload, postMessage, whitelist, secrets.
- **Scope:** read-only.

### mp-test-runner
- **Volat když:** po změnách; spustí `npm run build`, případně backend start.
- **Scope:** Bash + čtení logů.

### mp-e2e-playwright
- **Volat když:** UI flow regresy; pokud používáš Playwright MCP nebo lokální Playwright.

---

## Tier 2.5 — Browser Testing

### mp-browser-test-planner
- **Model:** Sonnet (haiku tier - pouze plánování)
- **Jazyk:** Markdown (generuje testovací instrukce)
- **Volat když:** PO KAŽDÉ změně která se dá otestovat v prohlížeči (UI, routing, pricing display, widget)
- **Scope:** Read-only + zápis do `/Browser_Testy/*.md`
- **Output:** Extrémně detailní testovací plány pro Claude Browser Extension
- **Detailní instrukce:** viz `docs/claude/BROWSER_TEST_PLANNER_AGENT.md`
- **KRITICKÉ:** Agent NEPROVÁDÍ testy! Pouze generuje textové instrukce které se zkopírují do Claude Browser Extension v Chrome.

---

## Tier 3 — Produkt & údržba

### mp-docs-writer
- **Jazyk:** Markdown.
- **Volat když:** nové subsystémy (widget, embed protokol), onboarding, troubleshooting.

### mp-i18n
- **Jazyk:** JS/JSX.
- **Volat když:** mix CZ/EN textů, sjednocení `useLanguage()`.

### mp-dependency-maintainer
- **Jazyk:** npm tooling.
- **Volat když:** npm install/build problémy, audit, minor/patch upgrady.

### mp-mcp-manager
- **Volat když:** MCP připojení, oprávnění, troubleshooting, bezpečnostní nastavení.

---

## Poznámka k překryvům (P0)
- `mp-admin-ui` vs `mp-widget-embed`: soubor `AdminWidget.jsx` často obsahuje embed snippet. Orchestrátor musí určit, kdo ho mění.
- `mp-fees-engine` vs `mp-pricing-engine`: změny v engine pipeline musí být koordinované (fees → markup → minima → rounding).
