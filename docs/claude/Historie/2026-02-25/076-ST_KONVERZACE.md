# 076-ST — KONVERZACE — Storage + Tenant Izolace — 2026-02-25

## Metadata
- **ID:** 076-ST
- **Session:** S01
- **Datum:** 2026-02-25
- **Oblast:** Storage + Tenant System
- **Souvisejici ID:** 077-ST (UPRAVY), 078-ST (OTAZKY)

---

## Tema session

Implementace planu "Per-User Tenant Izolace" s cílem, aby se každý přihlášený uživatel automaticky izoloval do vlastního tenant prostoru pomocí Firebase UID. Byla provedena paralelní implementace tří klíčových fází (1, 3, 5) a build prošel úspěšně.

---

## Prubeh konverzace

### [1] Uzivatel
> Prosím, implementuj plán Per-User Tenant Izolace. Máme 8 fází, cíl je aby po přihlášení/registraci se automaticky zapsal Firebase UID jako tenant ID do localStorage, čímž se každý uživatel dostane do vlastních dat.

### [1] Claude
**Shrnutí odpovědi:**
- Přečetl jsem 15 souborů, které je třeba upravit
- Spustil jsem paralelně 7 agentů pro implementaci fází 1, 3 a 5 současně
- Fáze 1 (storage): přidán setTenantId, clearTenantId, tenantIdOverride do adminTenantStorage.js
- Fáze 3 (auth): upraven FirebaseAuthProvider pro tenant binding, přidán x-tenant-id header do apiClient
- Fáze 5 (hardcoded): opraveni 13 souborů s hardcoded tenant ID hodnotami
- npm run build — PASS

**Akce provedené:**
- Spuštěno 7 paralelních agentů (mp-mid-storage-tenant, mp-spec-auth-firebase, mp-spec-fe-apiClient a další)
- Všechny 3 fáze implementovány a ověřeny

**Soubory zmiňované:**
- `src/utils/adminTenantStorage.js` (setTenantId, clearTenantId)
- `src/providers/FirebaseAuthProvider.jsx` (tenant binding, migration)
- `src/lib/apiClient.js` (x-tenant-id header)
- `src/services/presetsApi.js` (getTenantId reexport)
- `src/utils/adminAnalyticsStorage.js` (dynamické tenant)
- `src/pages/admin/AdminDashboard.jsx` (getTenantId())
- `src/pages/admin/AdminBranding.jsx` (getTenantId())
- `src/pages/widget/WidgetPreview.jsx` (getTenantId())
- `src/pages/widget/WidgetEmbed.jsx` (getTenantId())
- `src/pages/test-kalkulacka/components/CheckoutForm.jsx` (getTenantId())
- `src/pages/test-kalkulacka-white/components/CheckoutForm.jsx` (getTenantId())
- `src/utils/adminOrdersStorage.js` (getTenantId() seed)
- `src/hooks/useSupabaseRealtime.js` (JSDoc oprava)
- `src/utils/adminFeesStorage.js` (getTenantId())
- `src/utils/adminPricingStorage.js` (legacy keys fallback)

---

## Rozhodnutí uciněná v teto session

| # | Rozhodnutí | Kontext/důvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | 1 uživatel = 1 účet (vlastní data) | Jednoduchý model, jasná izolace | Uživatel |
| 2 | tenantId = user.uid pro nové účty | Firebase UID je jedinečný, bezpečný | Claude + Uživatel |
| 3 | Starý účet david-kunak → demo-tenant | Zachování přístupu k demo datům | Claude |
| 4 | Nový uživatel má prázdný admin panel | Bez demo dat (správné chování) | Uživatel potvrdil |
| 5 | Test-kalkulacka čte data aktuálního tenanta | Bez override v tomto scope | Claude |

---

## Otevrene otazky

- [ ] Implementace override parametru v loadPricingConfigV3 pro test-kalkulacku (TODO na později)
- [ ] Synchronizace dat mezi zařízeními (až se Supabase v dalším chatu)

---

## Navaznost

- **Předchozí:** 075-AC (Sprint 2 finální souhrn, 2026-02-24)
- **Následující:** zatím žádný (čeká na další session)

---

<!-- KONEC SABLONY -->
