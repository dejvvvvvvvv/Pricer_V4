# Project Bug Scan #2A — Admin stránky

**Datum:** 2026-03-18
**Průzkum:** 2. scan, Sekce A (Admin pages)

---

## P1 nálezy

### P1-01. createStableId fallback — AdminPricing.jsx + AdminExpress.jsx
- **Soubor:** `src/pages/admin/AdminPricing.jsx:166-174`, `src/pages/admin/AdminExpress.jsx:42-44`
- **Popis:** Fallback po catch volá crypto.randomUUID() znovu — nefunkční ochrana
- **Oprava:** Změnit fallback na Date.now().toString(36) + Math.random()
- **Opraveno:** [ ]

### P1-02. Špatný kontrast teal tlačítka — AdminIntegrations.jsx
- **Soubor:** `src/pages/admin/AdminIntegrations.jsx:83`
- **Popis:** Světlý text na světlém teal pozadí, nesplňuje WCAG AA
- **Oprava:** Změnit color na var(--forge-bg-void) nebo #000
- **Opraveno:** [ ]

### P1-03. Hardcoded texty v Analytics useMemo
- **Soubor:** `src/pages/admin/AdminAnalytics.jsx:429,439`
- **Popis:** 'Preset' a 'Status' hardcoded místo t()
- **Opraveno:** [ ]

### P1-04. Missing useEffect deps — AdminModelStorage
- **Soubor:** `src/pages/admin/AdminModelStorage.jsx:63-65`
- **Popis:** loadFolder a initialPath chybí v deps array
- **Opraveno:** [ ]

### P1-05. Zkrácený label — AdminCustomers
- **Soubor:** `src/pages/admin/AdminCustomers.jsx:54`
- **Popis:** 'Pravideln' místo 'Pravidelný'
- **Opraveno:** [ ]

---

## P2 nálezy

### P2-01. Přímý localStorage — AdminPricing + AdminLayout
### P2-02. Přímý localStorage — AdminDashboard diagnostika
### P2-03. Duplikovaný kód parseDecimal/finalizeDecimal v 8 souborech
### P2-04. Hardcoded error texty — AdminBranding
### P2-05. Hardcoded placeholdery — AdminBranding
### P2-06. Hardcoded EN texty — AdminModelStorage (celý soubor bez i18n)
### P2-07. Security disclaimer komentář — AdminTeamAccess
### P2-08. Nekonzistentní i18n pattern — AdminExpress (cs?:en místo t())
### P2-09. Lokální ConfirmModal duplikát — AdminOrders
### P2-10. Hardcoded světlé barvy invoice — AdminOrderDetail
### P2-11. Lokální ConfirmModal duplikát — AdminParameters
### P2-12. Hardcoded EN texty confirm — AdminMigration
### P2-13. crypto.randomUUID bez try-catch — AdminPresets
### P2-14. Tab labels hardcoded — AdminWidget
### P2-15. FEE_CATEGORIES label pattern — AdminFees
### P2-16. Hardcoded 'cs' locale — AdminOrderDetail:67
### P2-17. IIFE místo useMemo — AdminSettings
### P2-18. Hardcoded hex barva VIP — AdminCustomers

---

## Statistika
- P1: 5 nálezů
- P2: 18 nálezů
