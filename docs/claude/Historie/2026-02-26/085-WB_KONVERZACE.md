# 085-WB — KONVERZACE — Widget Builder Complete Research — 2026-02-26

## Metadata
- **ID:** 085-WB
- **Session:** S01
- **Datum:** 2026-02-26
- **Oblast:** Widget-Builder
- **Souvisejici ID:** zadne (iniciace nove oblasti)

---

## Tema session

User requested comprehensive widget builder analysis and improvement plan. Session involved 5 parallel research agents that discovered 12,000+ lines of widget code across admin, builder, widget-kalkulacka, storage, and embed systems, identified 17 critical security and UX issues (3 P0, 7 P1, 7 P2), and established a 3-wave fix strategy starting with critical bugs.

---

## Prubeh konverzace

### [1] Uzivatel
> I need a comprehensive widget builder analysis and improvement plan. Please:
> 1. Analyze all widget-related code (admin widget page, builder, widget-kalkulacka, embed, storage)
> 2. Identify bugs, UX issues, design system violations
> 3. Find security issues
> 4. Create improvement plan with waves (fixes first, then improvements)
> 5. Use 5 parallel research agents to speed up analysis

### [1] Claude
**Shrnuti odpovedi:**
- Launched 5 parallel research agents covering: codebase exploration, UX/UI analysis, design system audit, security review, storage analysis
- Discovered 12,000+ lines of widget-related code across 9 core files
- Identified 21 distinct issues across 4 categories: bugs, security, UX, design
- Created comprehensive analysis with issue classification by priority (P0/P1/P2)
- Established 3-wave improvement strategy: critical bugs first, then design/UX, then storage polish

**Akce provedene:**
- Spawned 5 research agents in parallel (all haiku for speed)
- Analyzed 12 files totaling 12,000+ lines
- Cross-referenced issues across multiple systems
- Created priority classification matrix
- Documented all findings with file locations and line numbers

**Soubory zminene:**
- `src/pages/admin/AdminWidget.jsx`
- `src/pages/admin/builder/BuilderPage.jsx`
- `src/pages/admin/builder/hooks/useBuilderState.js`
- `src/pages/widget-kalkulacka/index.jsx`
- `src/pages/widget-public/WidgetPublicPage.jsx`
- `src/pages/widget/WidgetEmbed.jsx`
- `public/widget.js`
- `src/utils/adminBrandingWidgetStorage.js`
- `src/utils/widgetThemeStorage.js`
- `src/lib/shopify/shopifyCartMapper.js`

---

### [2] Uzivatel
> Great! Now create a detailed improvement plan that:
> 1. Prioritizes critical bugs (P0) first
> 2. Groups fixes by impact and effort
> 3. Explains why each fix matters
> 4. Includes testing strategy for each wave
> 5. Be specific about which files and lines need changes

### [2] Claude
**Shrnuti odpovedi:**
- Created detailed 3-wave improvement plan organized by priority and effort
- **Wave 1 (Critical bugs):** 6 P0 fixes including postMessage protocol mismatch, missing exports, security issues
- **Wave 2 (Design & UX):** 8 P1 fixes for Forge alignment, micro-UX, accessibility
- **Wave 3 (Storage & polish):** 7 P2 fixes for storage consistency, error handling, performance
- Documented testing strategy for each wave
- Provided specific file paths and line ranges for every fix

**Akce provedene:**
- Compiled findings from 5 research agents into priority matrix
- Cross-referenced issues for dependency order
- Estimated effort/impact for each fix
- Created detailed testing strategy
- Identified prerequisites for each wave

**Soubory zminene:**
- `Widget-Builder-Improvement-Plan.md` (created — Wave 1-3 plan)

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Fix bugs before improvements | Best practice: ensure stability first, then enhance | Claude (metodologie) |
| 2 | 3-wave strategy (Critical → Design → Storage) | Dependency order: security issues block UX work, storage issues need stable base | Claude (analyza) |
| 3 | Use parallel research agents | Speed up analysis and get comprehensive coverage of 12,000+ lines of code | Spolecne |
| 4 | Focus on postMessage protocol first | P0 security issue that breaks widget embedding — highest risk | Claude (analyza) |
| 5 | Prioritize missing exports | Without these, widget builder can't read configuration — critical blocker | Claude (analyza) |

---

## Otevrene otazky

- [ ] Kdo bude implementovat Wave 1 fixes a kdy? (kapacita)
- [ ] Jsou nektere P0 bugs castecne miti uzivatelskymi? (impact assessment)
- [ ] Mel by byt widget builder migration na nove testovaci stranku behem Wave 2?

---

## Navaznost

- **Predchozi:** 084-ST (P2 bugfixy, build PASS)
- **Nasledujici:** zatim zadny (ceka na implementaci Wave 1)

---

<!-- KONEC SABLONY -->
