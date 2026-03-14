# 164-GN — KONVERZACE — P1 Bugs & Data Flow Fixes (Vlny 4-5) — 2026-03-13

## Metadata
- **ID:** 164-GN
- **Session:** S26
- **Datum:** 2026-03-13
- **Oblast:** General (Multioborové bugfixy + data flow)
- **Souvisejici ID:** 162 (Wave 3 Security), 163 (Wave 3 UPRAVY)
- **Trigger:** Pokračování P1 fixes session, vlny 4-5 implementace (bugy Reactu, race conditions, tenant integration, branding)

---

## Tema session

Session zabývající se P1-priority bugfixy (14 React Rules of Hooks, race conditions, event listener cleanup) a data flow sjednocením admin → kalkulačka → widget. Fokus na stabilizaci komponent po Wave 3 security fixech a unifikaci coupon/shipping/express storage mezi vrstvami.

---

## Prubeh konverzace

### [1] Uzivatel
> Ulož historii. Kontext:
>
> ## Session 2026-03-13 — P1 Bugs + Data Flow Fixes (Vlna 4-5)
>
> ### Vlna 4 — P1 Bug fixes:
> 1. AdminDashboard.jsx — Date(0) fallback → Date.now()
> 2. CommandPalette.jsx — useAuth() Rules of Hooks fix (přesunut z try/catch na top-level), globalIndex → useMemo
> 3. PrintQueue.jsx — duplikátní activity log odstraněn, interval neběží s prázdnou frontou
> 4. AdminFees.jsx — bulkDuplicate vkládá ZA originál (splice), dirty memo oprava (savedSnapshot normalizován)
> 5. OrderExportActions.jsx — guards pro prázdné stavy, TODO komentáře pro simulace
> 6. AdminOrders.jsx — setPage deps fix (primitivní hodnoty místo objektů), date filter off-by-one (T23:59:59.999), bulk status change funkcionální setState
> 7. AdminEmails.jsx — race condition fix (sync content PŘED přepnutím šablony)
> 8. AdminPricing.jsx — auto-save po unmount (isMounted guard)
> 9. KanbanCard.jsx — Rules of Hooks fix (hooks před early return)
> 10. AdminIntegrations.jsx — debounce 300ms na updateField save
> 11. OnboardingWizard.jsx — 3 timer refs + cleanup
> 12. AdminSettings.jsx — savedTimerRef + cleanup
> 13. AdminActivityLog.jsx — timer cleanup + prevIdsRef limit 1000
> 14. AdminOrderDetail.jsx — blobUrl revokeObjectURL cleanup
>
> ### Vlna 5 — Data Flow admin→kalkulačka→widget:
> 15. Coupon storage sjednocení — adminCouponsStorage.js (starý) → re-export z adminCouponStorage.js (nový). 4 soubory přesměrovány na autoritativní verzi.
> 16. Widget tenantId — loadCouponsConfigV1, loadExpressConfigV1, loadShippingConfigV1 nyní přijímají tenantIdOverride. Widget předává tenantId.
> 17. getTargetOrigin() — fallback '*' → window.location.origin (bezpečnost)
> 18. Branding v test-kalkulačce — přidáno čtení brandingu (getBranding), live reload, UI zobrazení loga/názvu/tagline
>
> ### Soubory změněné (vlna 4-5):
> AdminDashboard.jsx, CommandPalette.jsx, PrintQueue.jsx, AdminFees.jsx, OrderExportActions.jsx, AdminOrders.jsx, AdminEmails.jsx, AdminPricing.jsx, KanbanCard.jsx, AdminIntegrations.jsx, OnboardingWizard.jsx, AdminSettings.jsx, AdminActivityLog.jsx, AdminOrderDetail.jsx, adminCouponsStorage.js, adminCouponStorage.js, adminExpressStorage.js, adminShippingStorage.js, widget-kalkulacka/index.jsx, test-kalkulacka/index.jsx, Test-Kalkulacka-Dokumentace.md

### [1] Claude
**Shrnuti odpovedi:**
- Vlna 4 (14 P1 bugfixy React + lifecycle): Rules of Hooks (CommandPalette, KanbanCard), race conditions (AdminEmails), event listener cleanup (4 komponenty), deps fixes (AdminOrders, OnboardingWizard)
- Vlna 5 (4 data flow fixes): Storage sjednocení (coupon duplikát→re-export), widget tenantId propagace, origin security, branding v kalkuračce live reload
- Celkem 18 upravenych souboru, fokus na stabilizaci po Wave 3 security fixech
- Záznam ulozit jako 164-GN (KONVERZACE) + 165-GN (UPRAVY)

**Soubory zminene:**
- 14 admin/util komponent (bugfixy)
- 4 storage soubory (sjednocení)
- 2 kalkulačka + widget (branding/tenantId)
- 1 dokumentace (test-kalkulacka update)

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Vlna 4 (React) + Vlna 5 (data flow) jako jeden zaznam | Logicky blízko, oba P1, optimalizace historie | Claude |
| 2 | Coupon storage re-export (ne merge) | Zachovat kompatibilitu, minimální risk, 4 importy jednoduše redirectovány | Claude |
| 3 | Widget tenantId jako prop + override v storage | Bezpečnost (tenant isolation), elastičnost (re-use storage v público kontextu) | Claude |
| 4 | BuildPlate branding source: getBranding + live reload | UI konsistentnost s AdminBranding, dynamic update bez page reload | Claude |

---

## Navaznost

- **Predchozi:** 163-SEC (Wave 3 Security UPRAVY) — navázáno bezprostředně
- **Nasledujici:** Zatím žádný — S26 je poslední v 2026-03-13

---

<!-- KONEC SABLONY -->
