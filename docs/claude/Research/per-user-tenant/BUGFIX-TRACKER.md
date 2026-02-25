# Per-User Tenant Izolace — Bug Tracker

> Dokument pro sledovani vsech nalezenych chyb a jejich stavu.
> Tento soubor MUSI prezit compact konverzace.

## Implementace (Faze 1+3+5) — DONE

15 souboru upraveno, build PASS. Detaily v Historie 076-ST, 077-ST, 078-ST.

---

## P0 chyby — VSECHNY OPRAVENE ✓

| # | Problem | Soubor | Status |
|---|---------|--------|--------|
| P0-1 | setTenantId nevaliduje vstup (null/undefined) | adminTenantStorage.js | FIXED |
| P0-2 | login() nevola setTenantId — race condition | FirebaseAuthProvider.jsx | FIXED |
| P0-3 | logout() maze tenant PRED signOut — data corruption | FirebaseAuthProvider.jsx | FIXED |
| P0-4 | Hardcoded email david-kunak — extrahovat do konstanty | FirebaseAuthProvider.jsx | FIXED |
| P0-5 | Module-scope getTenantId() ve Widget — stale tenant | WidgetPreview.jsx, WidgetEmbed.jsx | FIXED |
| P0-6 | AdminDashboard primy localStorage s legacy keys | AdminDashboard.jsx | FIXED |

Detaily v Historie 079-ST, 080-ST.

---

## P1 chyby — VSECHNY OPRAVENE ✓

| # | Problem | Soubor | Status |
|---|---------|--------|--------|
| P1-1 | Async API (readTenantJsonAsync atd.) chybi tenantIdOverride | adminTenantStorage.js | FIXED |
| P1-2 | getTenantId() v hot loop seedAnalyticsDemo (900x) | adminAnalyticsStorage.js | FIXED |
| P1-3 | Zastaraly komentar "prefer test-customer-1" | adminFeesStorage.js | FIXED |
| P1-4 | Race condition onAuthStateChanged vs getRedirectResult | FirebaseAuthProvider.jsx | FIXED |
| P1-5 | Dead re-export getTenantId v presetsApi.js | presetsApi.js | FIXED |
| P1-6 | AdminBranding useEffect chybi customerId v deps | AdminBranding.jsx | FIXED |
| P1-7 | AdminDashboard useMemo chybi BRANDING_TENANT_ID v deps | AdminDashboard.jsx | FIXED |

---

## P2 chyby — VSECHNY OPRAVENE ✓

| # | Problem | Soubor | Status |
|---|---------|--------|--------|
| P2-1 | setTenantId/clearTenantId — console.debug log pro debugging | adminTenantStorage.js | FIXED |
| P2-2 | buildSessionsFromEvents — cache getTenantId() v loop | adminAnalyticsStorage.js | FIXED |
| P2-3 | AdminDashboard — konsolidace getTenantId() | AdminDashboard.jsx | FIXED (uz v P0) |
| P2-4 | adminAuditLogStorage + adminTeamAccessStorage — canUseLocalStorage guard | adminAuditLogStorage.js, adminTeamAccessStorage.js | FIXED |
| P2-5 | adminBrandingWidgetStorage — nekonzistentni pattern | adminBrandingWidgetStorage.js | SKIP (designove rozhodnuti, ne bug) |

Detaily v Historie 084-ST.

---

## Mimo scope (future work)

| # | Problem | Poznamka |
|---|---------|---------|
| F-1 | 4 nezavisle implementace tenant header injection (apiClient, presetsApi, storageApi, slicerApi) | Konsolidace az pri refaktoru API vrstvy |
| F-2 | Backend tenant spoofing — x-tenant-id header neni validovan proti auth tokenu | Potreba Firebase custom claims nebo Firestore lookup na backendu |
| F-3 | Widget public route bez prihlaseni — getTenantId() vrati demo-tenant | Widget by mel resolvovat tenant z publicId URL, ne z localStorage |
| F-4 | Test-kalkulacka override — loadPricingConfigV3/loadFeesConfigV3 nemaji tenantIdOverride | Potreba pridani parametru do tech funkci |
| F-5 | onTenantChange event — umoznit komponentam reagovat na zmenu tenanta | Custom event nebo React context |

---

## Upravene soubory — kompletni seznam

1. `src/utils/adminTenantStorage.js`
2. `src/providers/FirebaseAuthProvider.jsx`
3. `src/lib/apiClient.js`
4. `src/services/presetsApi.js`
5. `src/utils/adminAnalyticsStorage.js`
6. `src/pages/admin/AdminDashboard.jsx`
7. `src/pages/admin/AdminBranding.jsx`
8. `src/pages/widget/WidgetPreview.jsx`
9. `src/pages/widget/WidgetEmbed.jsx`
10. `src/pages/test-kalkulacka/components/CheckoutForm.jsx`
11. `src/pages/test-kalkulacka-white/components/CheckoutForm.jsx`
12. `src/utils/adminOrdersStorage.js`
13. `src/hooks/useSupabaseRealtime.js`
14. `src/utils/adminFeesStorage.js`
15. `src/utils/adminPricingStorage.js`
16. `src/utils/adminAuditLogStorage.js`
17. `src/utils/adminTeamAccessStorage.js`

---

## Stav Historie zaznamu

| ID | Obsah | Typ |
|----|-------|-----|
| 076-ST | Implementace Faze 1+3+5 (15 souboru) | KONVERZACE |
| 077-ST | Detailni zmeny implementace | UPRAVY |
| 078-ST | Rozhodnuti z planu | OTAZKY |
| 079-ST | P0 code review + opravy konverzace | KONVERZACE |
| 080-ST | P0 opravy detaily (6 souboru) | UPRAVY |
| 081-GN | P1 opravy konverzace | KONVERZACE |
| 082-ST | P1 opravy detaily (7 souboru) | UPRAVY |
| 084-ST | P2 opravy detaily (4 soubory) | UPRAVY |

## VSECHNY OPRAVITELNE CHYBY OPRAVENE — HOTOVO

Build: npm run build PASS
Celkem upravenych souboru: 17
Zbyvaji jen "future work" polozky (F-1 az F-5) ktere jsou mimo scope.
