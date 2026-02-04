# Agent Map — ModelPricer / Pricer V3 (Kompletni reference)

> **Posledni aktualizace:** 2026-02-02
> **Pocet agentu:** 32
> **Umisteni agentnich souboru:** `/.claude/agents/mp-*.md`

Tento dokument je **jediny zdroj pravdy** o vsech subagenteh v projektu ModelPricer / Pricer V3.
U kazdeho agenta je uveden jeho ucel, kdyz ho pouzit, jake soubory vlastni, na koho navazuje a jake ma omezeni.

---

## Obsah

1. [Prehled Tier struktury](#prehled-tier-struktury)
2. [Tier 0 — Orchestrator](#tier-0--orchestrator)
3. [Tier 0.5 — Planovaci agenti](#tier-05--planovaci-agenti)
4. [Tier 1 — Implementacni specialiste](#tier-1--implementacni-specialiste)
5. [Tier 1.5 — Specifikace a architektura](#tier-15--specifikace-a-architektura)
6. [Tier 2 — Kvalita a review](#tier-2--kvalita-a-review)
7. [Tier 2.5 — Browser testing](#tier-25--browser-testing)
8. [Tier 3 — Podpora a udrzba](#tier-3--podpora-a-udrzba)
9. [Souhrnna tabulka vsech agentu](#souhrnna-tabulka-vsech-agentu)
10. [Hot Spots — sdilene soubory a rizika](#hot-spots--sdilene-soubory-a-rizika)
11. [MCP Policy souhrn](#mcp-policy-souhrn)
12. [Doporuceny workflow](#doporuceny-workflow)

---

## Prehled Tier struktury

```
Tier 0    — Orchestrator (1 agent)
Tier 0.5  — Planovaci agenti (6 agentu)
Tier 1    — Implementacni specialiste (8 agentu)
Tier 1.5  — Specifikace a architektura (2 agenti)
Tier 2    — Kvalita a review (4 agenti)
Tier 2.5  — Browser testing (1 agent)
Tier 3    — Podpora a udrzba (10 agentu)
```

Celkem: **32 agentu**

---

## Tier 0 — Orchestrator

### mp-orchestrator

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Hlavni orchestrator — rozdeluje praci, ridi konflikty v hot spotech, urcuje merge poradi, definuje test checklist |
| **Model** | opus-4.5 |
| **Barva** | `#7C3AED` (fialova) |
| **Nastroje** | Read, Glob, Grep, Write, Edit, Bash |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Ukol zasahuje vice subsystemu (admin + pricing + backend)
- Hrozi konflikty ve sdilenych souborech (hot spots)
- Je potreba definovat merge poradi a test checklist
- Je potreba handoff a single-owner pravidla

**Kdy NEpouzit:**
- Izolovana zmena v jednom modulu (posli primo specialistovi)
- Hluboka implementace (orchestrator dela max koordinaci a integraci)

**Vlastnene cesty:**
- Koordinace napric repem (read-only)
- Minimalni integracni zmeny v `src/App.jsx`, `src/Routes.jsx` (jen kdyz nutne)
- Agent a Claude dokumentace: `docs/claude/*`, `CLAUDE.md`

**Handoff na planovaci system:** Pro komplexni ukoly (vice subsystemu) deleguje na `mp-plan-manager`.

**Rozhodovaci matice:**

| Situace | Akce orchestratora |
|---------|---------------------|
| Jednoducha zmena (1-2 soubory) | Primo implementer |
| Stredni zmena (3-5 souboru, 1 subsystem) | Volitelne planovac |
| Komplexni zmena (vice subsystemu) | **-> mp-plan-manager** |
| Nejasne pozadavky | **-> mp-plan-manager** pro analyzu |

---

## Tier 0.5 — Planovaci agenti

> Planovaci agenti **nesmejou implementovat** — pouze planuji. Info dostavaji pres Context Briefs (max 500 slov).
> Podrobnosti: `docs/claude/PLANNING_SYSTEM.md`

---

### mp-plan-manager

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Hlavni koordinator planovaciho systemu — prijima pozadavky, vytvari Context Briefs, syntetizuje plany |
| **Model** | opus-4.5 |
| **Barva** | `#6366F1` (indigo) |
| **Nastroje** | Read, Glob, Grep, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Velka feature zasahujici vice subsystemu (FE + BE + UX)
- Komplexni zmena vyzadujici koordinaci vice planovaci
- Potreba konzistentniho planu pred implementaci

**Kdy NEpouzit:**
- Jednoducha zmena v 1-2 souborech
- Ciste dokumentacni zmeny
- Bugfix s jasnou pricinou

**Workflow:**
1. Analyza pozadavku — rozbor scope, identifikace subsystemu
2. Rozhodnuti o planovacich — kteri specialiste jsou potreba
3. Vytvoreni Context Briefs — max 500 slov na planovace
4. Sber navrhu od specializovanych planovacu
5. Synteza — slouceni navrhu, vyreseni konfliktu
6. Kriticka revize — predani `mp-plan-critic` (pokud >3 soubory)
7. Finalizace — predani finalniho planu orchestratorovi

**Vola:** `mp-plan-frontend`, `mp-plan-backend`, `mp-plan-ux`, `mp-plan-critic`, `mp-oss-scout`
**Predava vysledek:** `mp-orchestrator`

---

### mp-plan-frontend

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Frontend planovac — UI architektura, komponenty, routing, API kontrakty z pohledu FE |
| **Model** | sonnet |
| **Barva** | `#10B981` (zelena) |
| **Nastroje** | Read, Glob, Grep |
| **permissionMode** | bypassPermissions |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Planovani novych UI komponent nebo stranek
- Zmeny v routing strukture
- Nove admin/widget features z pohledu FE
- Specifikace FE casti API kontraktu

**Read-only scope:** `/src/pages/**`, `/src/components/**`, `/src/Routes.jsx`, `/src/utils/admin*Storage.js`

**Vystup:** Tabulka komponent, routing plan, state management navrh, API pozadavky z FE pohledu, rizika (P0/P1/P2)

**Handoff na implementaci:** `mp-frontend-react`, `mp-admin-ui`, `mp-widget-embed`

---

### mp-plan-backend

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Backend planovac — API endpointy, data flow, integrace (PrusaSlicer, storage), error handling |
| **Model** | sonnet |
| **Barva** | `#3B82F6` (modra) |
| **Nastroje** | Read, Glob, Grep |
| **permissionMode** | bypassPermissions |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Planovani novych API endpointu
- Zmeny v data flow (upload -> slicer -> response)
- Integrace s externimi sluzbami
- Storage schema zmeny

**Read-only scope:** `/backend-local/src/**`, `/src/utils/admin*Storage.js`, `/functions/**`

**Vystup:** Tabulka API endpointu (Method, Path, Request, Response, Auth), data flow diagram, storage schema, error handling plan, rizika

**Handoff na implementaci:** `mp-backend-node`, `mp-slicer-integration`, `mp-storage-tenant`

---

### mp-plan-ux

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | UX planovac — user flows, interakce, design patterns, anti-AI-generic standardy |
| **Model** | sonnet |
| **Barva** | `#EC4899` (ruzova) |
| **Nastroje** | Read, Glob, Grep |
| **permissionMode** | bypassPermissions |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Planovani novych user flows
- Definice interakcnich vzoru
- Navrh onboarding / empty states
- Specifikace loading / error / success stavu

**Anti-AI-generic pravidla (kriticka):**
- ZAKAZANO: dekorativni stat karty, dashboardy bez ucelu, modaly pro jednoduche akce, animace pro efekt
- POVINNE: kazdy UI prvek ma meritelny ucel, jasne CTA, feedback na kazdou akci, destruktivni akce chraneny

**Vystup:** User personas, user flow (happy + error paths), stavy obrazovek (empty/loading/success/error), interakce, mikro-UX pravidla, anti-AI-generic checklist

**Handoff na implementaci:** `mp-admin-ui`, `mp-frontend-react`, `mp-widget-embed`

---

### mp-plan-critic

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Kriticky agent — kontroluje plan z pohledu zakaznika, identifikuje user-unfriendly aspekty |
| **Model** | opus-4.5 |
| **Barva** | `#F59E0B` (oranzova) |
| **Nastroje** | Read, Glob, Grep |
| **permissionMode** | bypassPermissions |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- **POVINNE** pro zmeny >3 souboru
- **POVINNE** pro zmeny zasahujici vice subsystemu
- Review finalniho planu pred implementaci

**Perspektivy kontroly:**
1. **Novy uzivatel** — Je jasne co aplikace dela? Existuje onboarding?
2. **Admin 3D print firmy** — Jsou caste akce rychle dostupne? Je workflow efektivni?
3. **Koncovy zakaznik (widget)** — Je widget intuitivni? Funguje na mobilech?

**Checklist:** Intuitivnost, stavy, chyby, feedback, pristupnost, edge cases

**Priority definice:**
- **P0 MUST-FIX** — chybi kriticky loading/error state, destruktivni akce bez confirmu, slepa ulicka
- **P1 SHOULD-FIX** — matouci UX ale funkcni, chybejici feedback
- **P2 NICE-TO-HAVE** — UX vylepseni, performance, polish

**ZAKAZANO:** navrhovani kompletniho redesignu, kritika bez konkretniho reseni, blokovani planu bez P0 issues

---

### mp-oss-scout

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Open Source Scout — vyhledava kvalitni OSS knihovny, kontroluje licence, hodnoti kvalitu |
| **Model** | sonnet |
| **Barva** | `#8B5CF6` (fialova) |
| **Nastroje** | Read, Glob, Grep, Write |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: ANO (s povinnym logovanim) |

**Kdy pouzit:**
- Potreba najit knihovnu pro specificky ucel
- Overeni licence existujici zavislosti
- Porovnani alternativ

**Licencni matice (POVINNA KONTROLA):**

| Status | Licence |
|--------|---------|
| SAFE | MIT, Apache-2.0, BSD-2/3-Clause, ISC |
| CAUTION | MPL-2.0, LGPL-2.1, LGPL-3.0 |
| **BLOCK** | **GPL-2.0, GPL-3.0, AGPL-3.0, CC-BY-NC-\*, Proprietary, Unlicensed** |

**Kvalitativni kriteria:**
- GitHub stars > 500 (idealne > 1000)
- Posledni commit < 6 mesicu
- Issue response time < 1 tyden
- Dokumentace existuje a je aktualni
- Zadne zname CVE

**Brave usage:** Kazdy Brave dotaz MUSI byt zalogovan do `/docs/claude/BRAVE_USAGE_LOG.md`

---

## Tier 1 — Implementacni specialiste

> Implementacni agenti **pisou kod**. Kazdy vlastni konkretni casti repozitare a nesmi sahat mimo svuj scope bez koordinace.

---

### mp-frontend-react

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Verejny frontend + kalkulacka (mimo admin). React/Vite JS+JSX |
| **Model** | opus-4.5 |
| **Barva** | `#22C55E` (zelena) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Public stranky: `/src/pages/home`, `/src/pages/pricing`, `/src/pages/support`
- Kalkulacka: `/src/pages/model-upload/**`, `/src/pages/test-kalkulacka/**`
- Routing: `src/App.jsx`, `src/Routes.jsx` (jen pro verejne casti)

**Vlastnene cesty:**
- `src/pages/home/**`, `src/pages/pricing/**`, `src/pages/support/**`
- `src/pages/model-upload/**`, `src/pages/test-kalkulacka/**`
- `src/pages/login/**`, `src/pages/register/**`, `src/pages/account/**`
- `src/App.jsx`, `src/Routes.jsx` (pouze kdyz nutne)

**Out of scope:** admin UI, pricing algoritmy, storage migrace, backend

**Zavislosti:** `mp-design-system` (UI primitives), `mp-pricing-engine` (vypocet), `mp-storage-tenant` (schema), `mp-backend-node` (API)

---

### mp-admin-ui

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Admin panel UI/UX implementer. Formulare, tabulky, validace, mikro-UX, storage helper usage |
| **Model** | opus-4.5 |
| **Barva** | `#F97316` (oranzova) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- `src/pages/admin/*` — Dashboard, Branding, Pricing, Fees, Parameters, Presets, Orders, Analytics, Team, Widget
- Mikro-UX: disabled states, inline errors, help texty

**Vlastnene cesty (konkretni soubory):**
- `src/pages/admin/AdminLayout.jsx`
- `src/pages/admin/AdminDashboard.jsx`
- `src/pages/admin/AdminBranding.jsx`
- `src/pages/admin/AdminPricing.jsx`
- `src/pages/admin/AdminFees.jsx` (UI cast)
- `src/pages/admin/AdminParameters.jsx`
- `src/pages/admin/AdminPresets.jsx`
- `src/pages/admin/AdminOrders.jsx`
- `src/pages/admin/AdminAnalytics.jsx`
- `src/pages/admin/AdminTeamAccess.jsx`
- `src/pages/admin/AdminWidget.jsx` (UI cast; protokol je mp-widget-embed)

**Out of scope:** zmeny tenantId/key schema, postMessage/origin logika, backend

**Hot spot:** `AdminWidget.jsx` — layout/UI = mp-admin-ui, protokol/snippet = mp-widget-embed

---

### mp-widget-embed

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Widget embed (iframe) + postMessage protokol + whitelist origin. Verejna routa /widget |
| **Model** | opus-4.5 |
| **Barva** | `#EC4899` (ruzova) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- `src/pages/widget/**` (embed/preview)
- postMessage protokol host <-> iframe
- Origin whitelist + bezpecnostni validace
- Embed snippet v adminu

**Vlastnene cesty:**
- `src/pages/widget/WidgetEmbed.jsx`
- `src/pages/widget/WidgetPreview.jsx`
- `src/pages/admin/AdminWidget.jsx` (protokol/snippet cast)
- `docs/claude/WIDGET_EMBED_PROTOCOL.md`

**Bezpecnostni pravidla (P0):**
- Zadny `*` origin — vzdy validuj `event.origin`
- Novy message typ musi byt verzovany / backward compatible
- Security review pres `mp-security-reviewer`

---

### mp-pricing-engine

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Pricing engine owner — determinismus, pipeline base->fees->markup->minima->rounding + breakdown |
| **Model** | opus-4.5 |
| **Barva** | `#EAB308` (zluta) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- NaN/0/rounding/minima/markup bugy
- Zmeny pipeline poradi
- Sjednoceni vypoctu (jeden zdroj pravdy)

**Vlastnene cesty:**
- `src/lib/pricing/pricingEngineV3.js` (SINGLE OWNER pro markup/minima/rounding sekci)
- `src/lib/pricingService.js`

**Pipeline (povinne poradi):** `base -> fees -> markup -> minima -> rounding`

**Invarianty:**
- Determinismus — stejne vstupy = stejne vystupy
- Breakdown bez NaN/undefined
- UI nesmi duplikovat pricing konstanty

---

### mp-fees-engine

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Fees/discounts/conditions (MODEL vs ORDER) + selekce/povinne/hidden; canonical context keys; negativni slevy |
| **Model** | opus-4.5 |
| **Barva** | `#FB7185` (cervena/ruzova) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Poplatky se neaplikuji / aplikuji spatne
- Conditions nefunguji (napr. `material == ABS`)
- Potreba sjednotit context keys
- Reseni selekce: required vs selectable vs hidden fees
- Zlepseni breakdown fees (debug)

**Vlastnene cesty:**
- `src/lib/pricing/pricingEngineV3.js` (FEES SEKCE — conditions, model context, fee loops)
- `src/utils/adminFeesStorage.js`
- `src/pages/admin/AdminFees.jsx` (schema/fields cast)

**P0 fee typy:** `flat`, `per_gram`, `per_minute`, `percent`, `per_cm3`, `per_cm2`, `per_piece`

**P0 canonical context keys:**
- `material_key` (+ alias `material`)
- `quality_preset`
- `supports_enabled` (+ alias `support_enabled`)
- `infill_percent`
- `filamentGrams`, `billedMinutes`, `estimatedTimeSeconds`
- `volumeCm3`, `surfaceCm2`, `sizeMm.{x,y,z}`

**Hot spot:** `pricingEngineV3.js` — sdileny s `mp-pricing-engine`. Fees sekce = mp-fees-engine, markup/minima/rounding = mp-pricing-engine.

---

### mp-storage-tenant

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Tenant-scoped storage (localStorage) jako jediny zdroj pravdy pro Admin config; migrace legacy klicu; idempotence |
| **Model** | opus-4.5 |
| **Barva** | `#16A34A` (zelena) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Cteni/zapis do localStorage bez tenant prefixu
- Sjednoceni nazvu namespace klicu
- Migrace legacy dat na V3 schema
- Bug "menim v adminu, ale kalkulacka nevidi"
- Non-browser context guardy (`typeof window`)

**Vlastnene cesty (vsechny storage helpery):**
- `src/utils/adminTenantStorage.js` (ENTRYPOINT — `getTenantId()`, `readTenantJson()`, `writeTenantJson()`)
- `src/utils/adminPricingStorage.js`
- `src/utils/adminFeesStorage.js`
- `src/utils/adminBrandingWidgetStorage.js`
- `src/utils/adminOrdersStorage.js`
- `src/utils/adminAnalyticsStorage.js`
- `src/utils/adminDashboardStorage.js`
- `src/utils/adminTeamAccessStorage.js`
- `src/utils/adminAuditLogStorage.js`

**Konvence klicu:** `modelpricer:{tenantId}:{namespace}` (napr. `pricing:v3`, `fees:v3`)

**Migrace pravidla:**
- Spousti se JEN kdyz canonical V3 klic chybi
- Legacy klice pouze cti; nemaze automaticky
- Idempotentni — opakovane nacteni nemeni data

---

### mp-backend-node

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Backend-local (Node.js ESM + Express) — API kontrakty, upload handling, validace, error handling, CORS |
| **Model** | opus-4.5 |
| **Barva** | `#0B5FFF` (modra) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Pridavas/upravujes endpointy v `backend-local`
- CORS pravidla
- Request validace + limity
- Jednotny error handling
- Tenant identifikace na backendu

**Vlastnene cesty:**
- `/backend-local/src/index.js` — Express app, middleware, endpointy
- `/backend-local/src/presetsStore.js` — tenant-scoped preset storage
- `/backend-local/src/util/fsSafe.js` — bezpecne FS helpery

**Error format:** `{ error: string, details?: object }`, error kody ve tvaru `MP_*`

**Hot spot:** `/backend-local/src/index.js` — routing + upload + slicer call se zde potkava. Single-owner je mp-backend-node; slicer cast koordinuje mp-slicer-integration.

---

### mp-slicer-integration

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | PrusaSlicer CLI integrace — safe spawn, timeouts, parsing metrik, preset/ini flow, edge-cases Win/Linux |
| **Model** | opus-4.5 |
| **Barva** | `#00B3A4` (teal) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: ANO (jen pro specificke PrusaSlicer CLI edge-cases) |

**Kdy pouzit:**
- `PRUSA_SLICER_CMD` / autodetekce sliceru
- `runPrusaSlicer()` (spawn/exec), args, cleanup, timeouts
- Parsovani vysledku (G-code, stdout/stderr), extrakce casu/materialu
- Workflow ini/presetu
- Endpoint `/api/health/prusa`

**Vlastnene cesty:**
- `/backend-local/src/slicer/runPrusaSlicer.js`
- `/backend-local/src/slicer/parseGcode.js`
- `/backend-local/src/slicer/parseModelInfo.js`
- `/backend-local/src/slicer/runPrusaInfo.js`
- `/backend-local/src/util/findSlicer.js`

**Bezpecnost:** Zadne shell injection; nepouzivat `exec` se stringem; pouzivat safe args array.

**Brave:** Povolen JEN pro specificke PrusaSlicer CLI edge-cases (max 1-2 dotazy) s povinnym logovanim.

---

### mp-design-system

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Design System owner — UI tokens, komponenty v /src/components/ui, konzistence admin+public, anti-AI-generic |
| **Model** | opus-4.5 |
| **Barva** | `#0F766E` (teal-tmava) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Sjednoceni vzhledu (spacing, radius, typografie, stiny, border, focus states)
- Nova/uprava shared komponenty (Button, Card, Input, Select, Modal, Tabs, Tooltip, Table)
- Odstraneni inline stylu / "one-off" UI
- Zavedeni tokenu (barvy, radius, elevation, typography scale, z-index)
- Konzistence mezi public a admin layoutem

**Vlastnene cesty (EXKLUZIVNI):**
- `/src/components/ui/**`
- `/src/styles/**`
- `/tailwind.config.js`
- `/postcss.config.js`

**Anti-AI-generic mise:** unikatni, konzistentni, profesionalni SaaS feel — zadne sablonove ikony-karty, zadne random gradienty.

**Pravidlo:** Pokud nekdo potrebuje zmenit UI komponentu, musi popsat duvod a navrhnout minimal diff. DS rozhodne o implementaci.

---

## Tier 1.5 — Specifikace a architektura

> Tyto agenti **neimplementuji** — definuji "co" a "jak" pred samotnou praci.

---

### mp-product-spec

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Produktovy specifikator — preklada vagne pozadavky do presnych specifikaci (acceptance criteria, edge cases, scope locks) |
| **Model** | sonnet |
| **Barva** | `#0EA5E9` (svetle modra) |
| **Nastroje** | Read, Glob, Grep, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Chybi acceptance criteria / edge cases / error stavy
- Rozhodovani mezi variantami — jasna volba + duvody
- Potreba zafixovat "co je hotovo" pred implementaci
- Zadani se dotyka bezpecnosti (embed/upload) a musi byt explicitni pravidla

**Vlastnene cesty:** `docs/claude/*` (feature specs, acceptance checklists)

**Vystup:** Cil (1 veta), OUT OF SCOPE, user stories, happy/error path, edge cases, acceptance checklist, test checklist, handoff

---

### mp-architect

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Architekt — technicky plan, boundaries, kontrakty, data flow, migracni strategie |
| **Model** | opus-4.5 |
| **Barva** | `#1D4ED8` (tmave modra) |
| **Nastroje** | Read, Glob, Grep, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Novy subsystem nebo velka zmena rozhrani (frontend <-> backend <-> storage)
- Migracni strategie (legacy storage -> nova verze)
- Definice kontraktu (API payloady, storage keys, pipeline order)

**Vlastnene cesty:** `docs/claude/*` (arch notes, migrations)

**Vystup:** As-is diagram, to-be diagram, migration plan (idempotentni), rizika + mitigace, handoff na agenty

---

## Tier 2 — Kvalita a review

> Kvalitni agenti jsou primarne **read-only** a slouzi jako gatekeepery pred mergem.

---

### mp-code-reviewer

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Read-only senior code review — kvalita, korektnost, regrese, minimal-change disciplina |
| **Model** | sonnet |
| **Barva** | `#94A3B8` (seda) |
| **Nastroje** | Read, Glob, Grep |
| **permissionMode** | plan (READ-ONLY) |
| **MCP** | Context7: ANO (stridme), Brave: NE |

**Kdy pouzit:**
- Po zmenach ve frontendu/adminu/engine/backendu, tesne pred merge
- Vite resolve chyby, bila obrazovka, rozbite routy
- Rozdilne vysledky ceny mezi UI a enginem
- Podezreni na regresi v tenant-scoped storage

**Co hleda:**
- **P0:** white-screen, runtime vyjimky, rozbite importy/routy, NaN/0 v pricingu
- **P1:** rizikove zmeny, spatne importy, side effects
- **P2:** code quality, dead code

**Vystup:** Report s P0/P1/P2 — kazdy bod obsahuje: soubor + misto, navrh minimalni zmeny, test checklist

---

### mp-security-reviewer

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Read-only AppSec review — upload, embed/postMessage, CORS, secrets, supply-chain, multi-tenant boundaries |
| **Model** | opus-4.5 |
| **Barva** | `#DC2626` (cervena) |
| **Nastroje** | Read, Glob, Grep |
| **permissionMode** | plan (READ-ONLY) |
| **MCP** | Context7: ANO (stridme), Brave: NE |

**Kdy pouzit:**
- Po zmenach v upload/embed/postMessage/CORS
- Pred vydanim
- Podezreni na: upload bypass, XSS pres widget, data leak mezi tenanty, CORS misconfig

**Checklist scan:**
- **Upload:** size/type limits, filename sanitization, storage path, cleanup, timeouts
- **API:** input validation, error leakage, rate limiting, CORS scope
- **postMessage:** `event.origin` kontrola, whitelist, message schema, replay
- **XSS:** dangerouslySetInnerHTML, unescaped HTML, user-controlled strings
- **Secrets:** .env unik, hardcoded keys, logging citlivych dat
- **Multi-tenant:** tenant_id zdroj pravdy, zadne fallbacky, zadne globalni klice

**Vystup:** Risk Register s P0/P1/P2 — evidence, exploit sketch, mitigation, jak otestovat

---

### mp-test-runner

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Build/test gatekeeper — spousti definovane skripty a opravuje build-breaking chyby s minimalnim dopadem |
| **Model** | sonnet |
| **Barva** | `#06B6D4` (cyan) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO (stridme), Brave: NE |

**Kdy pouzit:**
- Po implementacni praci jako dalsi krok pred review
- `npm run build` pada
- `/functions` lint pada
- backend-local nejde spustit

**Workflow (poradi):**
1. **Preflight** — zkontroluj skripty (root, functions, backend-local)
2. **Install** — `npm install` (root, functions, backend-local dle potreby)
3. **Build gate (P0)** — `npm run build`; oprav minimal diff, opakuj dokud projde
4. **Functions lint (P1)** — `npm --prefix functions run lint`
5. **Backend smoke (P2)** — `npm --prefix backend-local run dev`, over start
6. **Smoke checklist** — 5-8 kroku co kliknout

**Pravidlo:** Neprepisuj logiku implementera — oprav jen minimal build-break (import/path/typo/guard).

---

### mp-e2e-playwright

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | E2E QA agent — Playwright smoke/regression suite, stabilni selektory, reprodukovatelne reporty |
| **Model** | sonnet |
| **Barva** | `#9333EA` (fialova) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO (stridme), Brave: NE |

**Kdy pouzit:**
- Po zmenach ktere mohou rozbit user flow (routy, admin, upload, widget)
- Pred release (smoke suite)
- Po "risk" zmenach (rozsirena suite)

**Vlastnene cesty:**
- `/e2e/**` nebo `/tests/e2e/**`
- `/playwright.config.*`
- Sekundarne: pridani `data-testid` do UI komponent (minimalni)

**Smoke suite (minimalni sada):**
- Nacteni `/` (home)
- Nacteni `/pricing`
- Otevreni `/model-upload`
- Otevreni `/admin`

**Preferovane selektory:** `data-testid`, role/label selektory, stabilni texty (ne krehke CSS selektory)

---

## Tier 2.5 — Browser testing

### mp-browser-test-planner

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Generator detailnich testovacich planu pro Claude Browser Extension |
| **Model** | haiku |
| **Barva** | `#10B981` (zelena) |
| **Nastroje** | Read, Glob, Grep, Write |
| **permissionMode** | plan |
| **MCP** | Zadne |

**KRITICKE:** Tento agent **NIKDY NEPROVADI TESTY!** Pouze generuje textove instrukce ve formatu `.md` ktere se pote zkopiruj do Claude Browser Extension v Chrome.

**Kdy pouzit:**
- Po dokonceni implementace nove UI komponenty
- Po oprave chyby ve frontendu
- Po zmene existujici stranky
- Po jakekoli vizualni zmene testovatelne v prohlizeci

**Vlastnene cesty:** `/Browser_Testy/**` (vsechny testovaci plany)

**Vystup format:** `BROWSER_TEST_[DATUM]_[KRATKY_NAZEV].md`

**Uroven detailu (P0 pravidlo):**
- Kazdy krok je atomicky (jedna akce = jeden krok)
- Vsechny elementy jednoznacne identifikovatelne (pozice, barva, text, ikona, typ)
- Presne hodnoty k vyplneni
- Specifikovano kdyz cekat
- Instrukce co delat pri chybe

**Podrobne instrukce:** `docs/claude/BROWSER_TEST_PLANNER_AGENT.md`

---

## Tier 3 — Podpora a udrzba

---

### mp-docs-writer

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Dokumentace a onboarding — widget/admin/integrace, troubleshooting, interni Claude Code docs |
| **Model** | sonnet |
| **Barva** | `#0EA5E9` (svetle modra) |
| **Nastroje** | Read, Glob, Grep, Write, Edit |
| **permissionMode** | plan |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Widget/embed integrace docs, admin nastaveni docs
- Backend-local endpoint popisy
- Lokalni dev setup docs
- "Jak to funguje" popisy flow
- Troubleshooting (white screen, importy, storage issues)
- Interni Claude Code docs (agent mapy, playbook, logy)

**Vlastnene cesty (single-owner):** `/docs/**`, `/README.md`, `/CHANGES.md`, `/docs/claude/**`

**Pravidla:**
- Docs musi byt pravdive a overitelne (oprene o realne soubory)
- Pokud docs tvrdi neco co nesedi s realitou: napise **DOC GAP** + doporuceny handoff

---

### mp-i18n

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | CZ/EN i18n — sjednoceni useLanguage(), doplneni prekladu, odstraneni hardcoded textu |
| **Model** | sonnet |
| **Barva** | `#A21CAF` (fialova) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Mix CZ/EN "natvrdo" a cast pres `t()`
- Pribyla nova UI sekce bez prekladu
- Sjednoceni labelu v adminu
- Audit chybejicich klicu

**Vlastnene cesty (single-owner):**
- `/src/contexts/LanguageContext.jsx`
- Vsechny prekladove klice

**Konvence klicu:** `sekce.podsekce.label` (napr. `admin.fees.title`). Duplicitni klice zakazany.

**Hot file:** `LanguageContext.jsx` je single-owner — jen mp-i18n ho upravuje v ramci i18n prace.

---

### mp-dependency-maintainer

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Zavislosti a build prostredi — audit, reprodukce npm/Vite chyb, minimal patch updates |
| **Model** | sonnet |
| **Barva** | `#6B7280` (seda) |
| **Nastroje** | Read, Glob, Grep, Bash |
| **permissionMode** | plan |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- `npm install` selhava (peer dependency konflikty, ERESOLVE)
- Vite pada na chybejicich modulech
- ESM/CJS problem
- Node verze nekonzistence
- Dependency audit

**Vlastnene cesty:**
- `/package.json`, `/.npmrc`, `/vite.config.mjs`
- `/postcss.config.js`, `/tailwind.config.js`, `/jsconfig.json`
- `/backend-local/package.json`, `/functions/package.json`
- Lockfiles

**Preferovane poradi fixu:**
1. Opravit import/alias/config (bez dependency zmen)
2. Doplnit missing dependency (patch/minor)
3. Drobny upgrade jedne dependency (bez major bumpu)

---

### mp-mcp-manager

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | MCP setup a troubleshooting — Context7-first, Brave-min + logging pravidla, bezpecnost a stabilita |
| **Model** | opus-4.5 |
| **Barva** | `#8B5CF6` (fialova) |
| **Nastroje** | Read, Glob, Grep, Bash |
| **permissionMode** | plan |
| **MCP** | Context7: ANO, Brave: ANO (jen pro MCP troubleshooting) |

**Kdy pouzit:**
- `claude mcp list` ukazuje "No MCP servers" nebo "disconnected"
- Nastaveni MCP (Docker, lokalni process, port mapping)
- Reseni `.mcp.json`, `.env.mcp*` a propagace promennych
- Zavedeni pravidel "Context7 first" + "Brave minimal"
- Konflikty MCP konfigurace (globalni vs repo)

**Vlastnene cesty (single-owner):** `/.mcp.json`, `/.env.mcp`, `/.env.mcp.example`, `/.claude/**` (MCP cast)

**Bezpecnost:** Nikdy nevypisovat secrets do chatu; sdilet jen nazvy promennych a maskovane hodnoty.

---

### mp-context7-docs

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Context7 docs retrieval — vytahuje up-to-date dokumentaci a doporucene patterns, bez implementace |
| **Model** | sonnet |
| **Barva** | `#64748B` (seda) |
| **Nastroje** | Read, Glob, Grep |
| **permissionMode** | plan (READ-ONLY) |
| **MCP** | Context7: ANO (JEDINY zdroj), Brave: NE |

**Kdy pouzit:**
- Implementer si neni jisty spravnym pouzitim knihovny (Express, multer, cors, Node spawn)
- Overeni specifickych API detailu
- Porovnani "spravny pattern" vs "co mame v repu"
- Varianty reseni + tradeoffs pro orchestratora

**Vystup:** 3 casti: (1) doporuceny pattern, (2) pitfall list, (3) mini snippet (max 30-50 radku)

---

### mp-devops-ci

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | CI/CD a DevOps hygien — navrh build/test/lint workflow, Node verze, cache, Firebase deploy guardrails |
| **Model** | sonnet |
| **Barva** | `#F59E0B` (oranzova) |
| **Nastroje** | Read, Glob, Grep, Bash |
| **permissionMode** | plan |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Navrh GitHub Actions workflow
- Build je "flaky" — cache/locking strategie
- Sjednoceni Node verzi
- Firebase deploy guardrails

**Vlastnene cesty:** `/.github/workflows/*`, `/firebase.json`, `/.firebaserc`, `/.nvmrc`, `/.node-version`

---

### mp-performance

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Performance specialist (frontend-first) — profiling, bundle/route budgets, runtime UX smoothness |
| **Model** | sonnet |
| **Barva** | `#22C55E` (zelena) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | acceptEdits |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- UI "cuka" / pomale renderovani
- Zbytecne re-rendery, memory leak, performance regrese
- Lazy-loading, bundle size, obrazkove optimalizace, virtualizace

**Vlastnene cesty:**
- `/src/lib/performance/**`, `/src/utils/performance/**`
- `/src/hooks/usePerformance*.js`

**Pravidlo evidence-first:** Musi mit PRED/PO mereni. Zadna "optimalizace" bez dukazu.

---

### mp-researcher-web

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Web research agent — Context7-first, Brave minimal + povinny log. Dodava citace a doporuceni |
| **Model** | opus-4.5 |
| **Barva** | `#F97316` (oranzova) |
| **Nastroje** | Read, Glob, Grep, Bash, Write, Edit |
| **permissionMode** | plan |
| **MCP** | Context7: ANO (first), Brave: ANO (minimalizovat) |

**Kdy pouzit:**
- Aktualni info ktere se meni v case (Claude Code/MCP, security doporuceni)
- Porovnani nastroju, UX vzoru, integraci
- Prehled "jak to delaji ostatni" + odkazy

**Vlastnene cesty (single-owner):** `/docs/claude/BRAVE_USAGE_LOG.md`

**Brave pravidla:**
- Brave dotazy povolene JEN pokud informace je casove citliva / nejde ziskat z repo + Context7
- Kazdy Brave dotaz musi byt zalogovan do `BRAVE_USAGE_LOG.md`
- Brave je povolen JEN pro tohoto agenta (ostatni deleguji pres nej)

---

### mp-a11y

| Vlastnost | Hodnota |
|-----------|---------|
| **Popis** | Accessibility (WCAG) auditor — keyboard nav, focus order, aria/labels, contrast, motion |
| **Model** | sonnet |
| **Barva** | `#10B981` (zelena) |
| **Nastroje** | Read, Glob, Grep, Bash |
| **permissionMode** | plan (audit/report) |
| **MCP** | Context7: ANO, Brave: NE |

**Kdy pouzit:**
- Po zmene UI komponent, formularu, navigace, modalu
- Uzivatel hlasi problem s klavesnici
- Pred releasem: a11y smoke
- Zavadeni novych UI patternu (tabs, accordions, dialogs)

**Audit oblasti:**
1. **Keyboard-first** — tab order, viditelny focus, ovladani bez mysi
2. **Semantics & labels** — input label/aria-label, button name, role u custom prvku
3. **State announcements** — aria-live, role=alert, disabled stavy
4. **Contrast & motion** — kontrast textu, `prefers-reduced-motion`

**Vystup:** P0/P1/P2 report — severity, kde, proc, jak otestovat, jak opravit (snippet)

**Handoff patchu:** `mp-design-system` (shared UI), `mp-admin-ui` (admin), `mp-frontend-react` (public)

---

## Souhrnna tabulka vsech agentu

| # | Agent | Tier | Model | Nastroje | MCP Brave | permissionMode | Implementuje? |
|---|-------|------|-------|----------|-----------|----------------|---------------|
| 1 | mp-orchestrator | 0 | opus-4.5 | R,G,Gr,W,E,B | NE | acceptEdits | Minimalne (integ.) |
| 2 | mp-plan-manager | 0.5 | opus-4.5 | R,G,Gr,W,E | NE | acceptEdits | NE |
| 3 | mp-plan-frontend | 0.5 | sonnet | R,G,Gr | NE | bypass | NE |
| 4 | mp-plan-backend | 0.5 | sonnet | R,G,Gr | NE | bypass | NE |
| 5 | mp-plan-ux | 0.5 | sonnet | R,G,Gr | NE | bypass | NE |
| 6 | mp-plan-critic | 0.5 | opus-4.5 | R,G,Gr | NE | bypass | NE |
| 7 | mp-oss-scout | 0.5 | sonnet | R,G,Gr,W | ANO (log) | acceptEdits | NE |
| 8 | mp-frontend-react | 1 | opus-4.5 | R,G,Gr,B,W,E | NE | acceptEdits | ANO |
| 9 | mp-admin-ui | 1 | opus-4.5 | R,G,Gr,B,W,E | NE | acceptEdits | ANO |
| 10 | mp-widget-embed | 1 | opus-4.5 | R,G,Gr,B,W,E | NE | acceptEdits | ANO |
| 11 | mp-pricing-engine | 1 | opus-4.5 | R,G,Gr,B,W,E | NE | acceptEdits | ANO |
| 12 | mp-fees-engine | 1 | opus-4.5 | R,G,Gr,B,W,E | NE | acceptEdits | ANO |
| 13 | mp-storage-tenant | 1 | opus-4.5 | R,G,Gr,B,W,E | NE | acceptEdits | ANO |
| 14 | mp-backend-node | 1 | opus-4.5 | R,G,Gr,B,W,E | NE | acceptEdits | ANO |
| 15 | mp-slicer-integration | 1 | opus-4.5 | R,G,Gr,B,W,E | ANO (edge) | acceptEdits | ANO |
| 16 | mp-design-system | 1 | opus-4.5 | R,G,Gr,B,W,E | NE | acceptEdits | ANO |
| 17 | mp-product-spec | 1.5 | sonnet | R,G,Gr,W,E | NE | acceptEdits | NE |
| 18 | mp-architect | 1.5 | opus-4.5 | R,G,Gr,W,E | NE | acceptEdits | NE |
| 19 | mp-code-reviewer | 2 | sonnet | R,G,Gr | NE | plan (RO) | NE |
| 20 | mp-security-reviewer | 2 | opus-4.5 | R,G,Gr | NE | plan (RO) | NE |
| 21 | mp-test-runner | 2 | sonnet | R,G,Gr,B,W,E | NE | acceptEdits | Min. (fixy) |
| 22 | mp-e2e-playwright | 2 | sonnet | R,G,Gr,B,W,E | NE | acceptEdits | ANO (testy) |
| 23 | mp-browser-test-planner | 2.5 | haiku | R,G,Gr,W | NE | plan | NE |
| 24 | mp-docs-writer | 3 | sonnet | R,G,Gr,W,E | NE | plan | NE (docs) |
| 25 | mp-i18n | 3 | sonnet | R,G,Gr,B,W,E | NE | acceptEdits | ANO (texty) |
| 26 | mp-dependency-maintainer | 3 | sonnet | R,G,Gr,B | NE | plan | NE |
| 27 | mp-mcp-manager | 3 | opus-4.5 | R,G,Gr,B | ANO (MCP) | plan | NE |
| 28 | mp-context7-docs | 3 | sonnet | R,G,Gr | NE | plan (RO) | NE |
| 29 | mp-devops-ci | 3 | sonnet | R,G,Gr,B | NE | plan | NE |
| 30 | mp-performance | 3 | sonnet | R,G,Gr,B,W,E | NE | acceptEdits | ANO (perf) |
| 31 | mp-researcher-web | 3 | opus-4.5 | R,G,Gr,B,W,E | ANO (min) | plan | NE |
| 32 | mp-a11y | 3 | sonnet | R,G,Gr,B | NE | plan | NE |

> **Legenda nastroju:** R=Read, G=Glob, Gr=Grep, B=Bash, W=Write, E=Edit

---

## Hot Spots — sdilene soubory a rizika

Tyto soubory jsou nejcastejsi zdroje konfliktu. VZDY musi byt urcen single-owner.

| Soubor | Primarni owner | Sekundarni (koordinace) | Riziko |
|--------|---------------|------------------------|--------|
| `src/lib/pricing/pricingEngineV3.js` | `mp-pricing-engine` (markup/minima/rounding) + `mp-fees-engine` (fees sekce) | Oba musi koordinovat | Sdileny soubor — P0 |
| `src/pages/admin/AdminWidget.jsx` | `mp-admin-ui` (layout/UI) + `mp-widget-embed` (protokol/snippet) | Orchestrator rozhoduje | Dual ownership — P1 |
| `src/utils/adminTenantStorage.js` | `mp-storage-tenant` | `mp-admin-ui` (cteni) | Single entrypoint — P0 |
| `src/utils/admin*Storage.js` | `mp-storage-tenant` | `mp-admin-ui`, `mp-fees-engine` | Schema zmeny — P1 |
| `/backend-local/src/index.js` | `mp-backend-node` | `mp-slicer-integration` | Routing + upload + slicer — P1 |
| `src/components/ui/**` | `mp-design-system` (EXKLUZIVNI) | Ostatni pres handoff | Vizualni konzistence — P1 |
| `src/Routes.jsx` | `mp-frontend-react` | `mp-admin-ui`, `mp-widget-embed` | Routing integrity — P0 |
| `src/contexts/LanguageContext.jsx` | `mp-i18n` (EXKLUZIVNI) | Ostatni pres handoff | i18n konzistence — P1 |
| `/backend-local/profiles/default.ini` | `mp-slicer-integration` | - | Ovlivnuje metriky — P1 |

---

## MCP Policy souhrn

| Pristup | Agenti |
|---------|--------|
| **Brave POVOLENY** (s povinnym logovanim) | `mp-researcher-web`, `mp-oss-scout`, `mp-slicer-integration` (omezeně), `mp-mcp-manager` (jen MCP) |
| **Context7 ONLY (bez Brave)** | Vsechni ostatni (28 agentu) |
| **Zadne MCP** | `mp-browser-test-planner` |

**Pravidla:**
1. **Context7-first** — vzdy zkus Context7 pred Brave
2. **Brave minimal** — co nejmene dotazu, jen kdyz nutne
3. **Povinny log** — kazdy Brave dotaz musi byt zalogovan do `/docs/claude/BRAVE_USAGE_LOG.md`
4. **Brave delegace** — agenti bez Brave deleguji na `mp-researcher-web`
5. **Zadne secrets** — nikdy neposilej API klice do MCP dotazu

---

## Doporuceny workflow

### Standardni implementacni cyklus

```
1. mp-orchestrator         — rozdeleni ukolu, urceni scope a agentu
2. mp-product-spec         — acceptance criteria (pokud chybi)
3. mp-plan-manager         — planovani (pro komplexni ukoly)
   ├── mp-plan-frontend
   ├── mp-plan-backend
   ├── mp-plan-ux
   └── mp-plan-critic      — POVINNE pro >3 souboru
4. Implementacni agenti    — paralelne (podle scope)
   ├── mp-frontend-react   — public stranky
   ├── mp-admin-ui         — admin panel
   ├── mp-widget-embed     — widget/embed
   ├── mp-pricing-engine   — cenova kalkulace
   ├── mp-fees-engine      — poplatky/slevy
   ├── mp-storage-tenant   — tenant storage
   ├── mp-backend-node     — API endpointy
   ├── mp-slicer-integration — PrusaSlicer
   └── mp-design-system    — sdilene UI komponenty
5. mp-code-reviewer        — code review (P0/P1/P2)
6. mp-security-reviewer    — security review (pokud embed/upload/CORS)
7. mp-test-runner          — build gate (npm run build)
8. mp-e2e-playwright       — E2E testy (pokud UI flow)
9. mp-browser-test-planner — manual test plan pro Chrome extension
```

### Rozhodovaci matice (velikost zmeny)

| Velikost | Planovani | Implementace | Review |
|----------|-----------|--------------|--------|
| Mala (1 soubor) | Primo implementer | 1 agent | Volitelne |
| Stredni (2-5 souboru) | 1 planovac + critic | 1-2 agenti | Code review |
| Velka (vice subsystemu) | Vsichni planovaci | 2-4 agenti | Code + Security review |
| Knihovna | mp-oss-scout | - | Licencni kontrola |

---

## Souvisejici dokumentace

- **CLAUDE.md** — hlavni provozni manual (root: `Model_Pricer-V2-main/CLAUDE.md`)
- **AGENT_PLAYBOOK.md** — prakticke zasady z praxe (`docs/claude/AGENT_PLAYBOOK.md`)
- **PLANNING_SYSTEM.md** — detaily planovaciho systemu (`docs/claude/PLANNING_SYSTEM.md`)
- **BROWSER_TEST_PLANNER_AGENT.md** — detailni instrukce pro browser testy (`docs/claude/BROWSER_TEST_PLANNER_AGENT.md`)
- **BRAVE_USAGE_LOG.md** — log pouziti Brave Search (`docs/claude/BRAVE_USAGE_LOG.md`)
- **MCP_SETUP_VSCODE.md** — navod na MCP nastaveni (`docs/claude/MCP_SETUP_VSCODE.md`)
