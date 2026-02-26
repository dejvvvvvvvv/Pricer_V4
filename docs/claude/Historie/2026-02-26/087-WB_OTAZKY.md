# 087-WB — OTAZKY A ODPOVEDI — Widget Builder Critical Issues — 2026-02-26

## Metadata
- **ID:** 087-WB
- **Session:** S01
- **Datum:** 2026-02-26
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 085-WB (KONVERZACE), 086-WB (UPRAVY)

---

## Kontext

During comprehensive widget builder codebase analysis, 5 parallel research agents discovered 21 distinct issues across security, UX, design system, and storage areas. This document captures key questions that emerged during analysis and the decisions made to prioritize and structure the improvement plan.

---

## Otazky a odpovedi

### Q1: Why is postMessage protocol broken between widget.js and iframe?

- **Ptal se:** Claude (design review)
- **Otazka:** widget.js sends `MODELPRICER_RESIZE` message type but WidgetEmbed.jsx/widget-kalkulacka listen for `MODELPRICER_WIDGET_HEIGHT`. Why the mismatch and which is correct?
- **Odpoved:** Message type mismatch appears to be a refactor artifact. WidgetEmbed.jsx was updated to use new name but widget.js (public embed script) was not updated. This causes height negotiation to fail silently on all embedded widgets.
- **Rozhodnuti:** Wire message types are wrong in widget.js. Wave 1 fix: update widget.js to use `MODELPRICER_WIDGET_HEIGHT` and export message type constants to single source of truth.
- **Dopad:** Without this fix, public widgets cannot dynamically resize to fit content — users see partial or broken layouts. This is P0 severity because it breaks core functionality.

---

### Q2: Which route is correct for widget embedding — /widget/embed/ or /w/?

- **Ptal se:** Claude (deployment check)
- **Otazka:** widget.js tries to load iframe from `/widget/embed/` but Routes.jsx defines public widget route as `/w/:publicWidgetId`. Which is the source of truth?
- **Odpoved:** Routes.jsx is the source of truth (defines all routes). widget.js is outdated. The `/w/` route was added during Shopify integration but widget.js was not updated. This means ALL public widgets return 404 on production.
- **Rozhodnuti:** Fix widget.js to use `/w/` route. Add integration test to prevent route divergence. Wave 1 fix.
- **Dopad:** This is showstopper bug — entire public embedding feature is broken. Every customer widget URL will fail.

---

### Q3: Is the wildcard postMessage origin validation truly a security issue?

- **Ptal se:** Claude (security review)
- **Otazka:** WidgetEmbed.jsx uses `window.parent.postMessage(..., '*')` which accepts messages from ANY origin. Is this actually exploitable or just overly permissive?
- **Odpoved:** Yes, this is exploitable. Any malicious site can inject iframe with widget and send forged messages to steal data, modify pricing, or hijack checkout. Even if widget data is public, attacker can trigger unintended actions. This violates postMessage security best practices.
- **Rozhodnuti:** Whitelist origin to specific domains. For public widgets: validate against domain whitelist stored in widget config. For admin widgets: validate against admin domain. Wave 1 critical fix.
- **Dopad:** This is P0 security vulnerability — anyone can forge postMessage commands to modify widget behavior or extract sensitive data.

---

### Q4: Are missing function exports the root cause of "widget builder white screen" bugs?

- **Ptal se:** Claude (code archaeology)
- **Otazka:** WidgetPublicPage imports `getWidgetByIdOrPublicId` from AdminWidget but this function is never exported. How is the code even running?
- **Odpoved:** Either: (1) function is being inlined/bundled differently than expected, (2) code path is not executed in current test scenarios, or (3) there's a wrapper function we missed. Need to check if WidgetPublicPage is even being used. If not exported, bundler should error at build time.
- **Rozhodnuti:** Export missing functions explicitly from AdminWidget. Add build check to verify exports. This is P0 blocker because dynamic widget loading cannot work without it. Wave 1 fix.
- **Dopad:** If WidgetPublicPage is active, this causes runtime error. If inactive, this is latent bug waiting to happen. Either way, P0 priority.

---

### Q5: Does the cross-tenant pricing leak represent actual data exposure?

- **Ptal se:** Claude (storage audit)
- **Otazka:** adminBrandingWidgetStorage reads widget config by ID but doesn't validate tenantId. Could one tenant enumerate another tenant's widgets by guessing IDs?
- **Odpoved:** Yes, potential exposure. If widget IDs are sequential or predictable, attacker can loop through IDs to find widgets from other tenants and read their pricing, configuration, and branding. This is especially problematic for sensitive industries (manufacturing, where pricing is competitive).
- **Rozhodnuti:** Add tenant validation to all storage reads. Ensure IDs are UUIDs, not sequential numbers. Add audit logging. Wave 1 fix.
- **Dopad:** P0 security issue — data confidentiality breach possible. Affects pricing confidentiality and competitive advantage.

---

### Q6: Why are there two separate theme storage systems?

- **Ptal se:** Claude (data model review)
- **Otazka:** adminBrandingWidgetStorage.js has theme methods AND widgetThemeStorage.js exists separately. Which is authoritative? Are they ever out of sync?
- **Odpoved:** Appears to be accidental duplication from two refactors. Original: single storage, First refactor: split branding/theme, Second refactor: extracted theme to own module. Neither was fully decommissioned. Both are active and can diverge.
- **Rozhodnuti:** Consolidate into single namespace in Wave 3 (storage polish). Short-term: document that widgetThemeStorage is preferred, deprecate theme methods in adminBrandingWidgetStorage. Document data model clearly.
- **Dopad:** Confusing for future devs. Creates potential for sync bugs. Not immediate but P2 priority for architecture clarity.

---

### Q7: Should Wave 1 bugs be fixed before or after the Supabase migration?

- **Ptal se:** Uzivatel (planning)
- **Otazka:** Phase 4 (Supabase migration) is planned. Should we fix these widget storage bugs now (in localStorage) or wait and fix them in Supabase version?
- **Odpoved:** Fix NOW in localStorage. Reasons: (1) Migration is complex enough without carrying forward known bugs, (2) bugs affect immediate production (widgets broken today), (3) fixes are independent of storage layer (all are logic/validation issues), (4) easier to test if no storage layer change happening simultaneously.
- **Rozhodnuti:** Fix all P0/P1 bugs in localStorage as Wave 1-2. Supabase migration (Phase 4) happens after. Storage consolidation (Wave 3) can be done pre- or post-migration depending on timeline.
- **Dopad:** Keeps widget system stable during migration prep. Reduces risk of Supabase migration.

---

### Q8: What's the proper fix for the isValidShopifyUrl vulnerability?

- **Ptal se:** Claude (security review)
- **Otazka:** Current regex in shopifyCartMapper.js is `/^https:\/\/.*\.myshopify\.com/` which passes `//evil.com.myshopify.com` and similar tricks. What's the right validation?
- **Odpoved:** Proper fix: parse URL with URL constructor, validate hostname exactly matches pattern, no wildcards. Check: protocol is HTTPS (not //, not http), domain ends with `.myshopify.com`, no port tricks, no fragment tricks.
- **Rozhodnuti:** Replace regex with URL constructor + hostname validation. Add test cases for bypass attempts. Wave 1 fix (low effort, high security gain).
- **Dopad:** Prevents open redirect to malicious sites. Medium severity but quick fix.

---

### Q9: How should Wave 1 and Wave 2 be tested if builder changes might affect preview?

- **Ptal se:** Claude (testing strategy)
- **Otazka:** BuilderPage and widget-kalkulacka preview are coupled. If we fix builder state (Wave 1) and UI (Wave 2), how do we test without breaking each other?
- **Odpoved:** Test strategy: (1) Unit tests for useBuilderState (isolated), (2) Unit tests for storage helpers (isolated), (3) Integration test: builder → storage → preview (full flow), (4) Smoke test on actual admin page, (5) Test public widget embedding separately.
- **Rozhodnuti:** Create test plan with clear stages. Wave 1 tests (logic only), Wave 2 tests (UI + logic together), then integration test on admin. Prevents cascading failures.
- **Dopad:** Ensures Wave 1 doesn't accidentally break Wave 2 or vice versa.

---

### Q10: Should we fix all Forge design system violations in Wave 2 or patch only widget-critical ones?

- **Ptal se:** Claude (scope management)
- **Otazka:** Analysis found hardcoded colors in 3 files (AdminWidget, widget-kalkulacka, widgetThemeStorage). Should we also audit and fix other pages or stay widget-focused?
- **Odpoved:** Stay widget-focused for Wave 2. Widget is self-contained and these fixes don't spill over. Other pages can have separate design audit + fix wave later. Keeps scope tight.
- **Rozhodnuti:** Fix design violations only in widget system (AdminWidget, widget-kalkulacka, WidgetEmbed). Create separate design system audit story for other pages.
- **Dopad:** Focused, faster delivery. Prevents design audit from expanding into endless refactor.

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnuti | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | Message type protocol | Update widget.js to match WidgetEmbed.jsx message names | Leave as-is (accept broken heights) | Q1 |
| 2 | Route mismatch (/widget/embed/ vs /w/) | Fix widget.js to use /w/ | Revert WidgetEmbed.jsx route (risky) | Q2 |
| 3 | postMessage origin validation | Whitelist domains from widget config | Keep wildcard (accept security risk) | Q3 |
| 4 | Missing exports | Add explicit exports from AdminWidget | Refactor imports (larger change) | Q4 |
| 5 | Cross-tenant leak | Add tenantId validation + UUID IDs | Accept exposure (risk) | Q5 |
| 6 | Dual theme storage | Consolidate in Wave 3 (storage phase) | Deprecate one now (risky mid-migration) | Q6 |
| 7 | Timing: before or after Supabase | Fix now in localStorage, migrate after | Fix after (more complex) | Q7 |
| 8 | isValidShopifyUrl fix | URL constructor + hostname validation | Keep regex (accept bypass risk) | Q8 |
| 9 | Testing strategy | Unit → Integration → Smoke | Ad-hoc testing (miss edge cases) | Q9 |
| 10 | Design system scope | Fix widget violations only | Full codebase audit (scope creep) | Q10 |

---

## Nerozhodnute otazky

- [ ] Should public widget IDs be migrated from numeric to UUID? (breaking change consideration)
- [ ] Is there existing monitoring/alerting for postMessage failures? (observability gap)
- [ ] Who will own the 3-wave implementation and what's the timeline?
- [ ] Should admin widgets get separate iframe sandbox or remain as inline components?

---

<!-- KONEC SABLONY -->
