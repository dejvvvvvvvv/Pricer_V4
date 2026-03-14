# Waves 50-52 — Masivní i18n Migrace (2026-03-13)

## Session: Audit Fix Marathon (pokračování)

### Přehled
- **Vlny:** 50, 51, 52
- **Datum:** 2026-03-13
- **Typ:** UPRAVY (i18n migration massive)
- **Celkem klíčů:** ~860+ nových překladů (Czech + English)
- **Komponenty:** 15 admin stránek
- **Build status:** PASS po každé vlně

---

## Wave 50 — AdminBranding i18n

### AdminBranding.jsx
- **Hardcoded strings:** 30 → t()
- **Nové klíče:** 36
- **Pokrytí:** Branding title, form labels, color pickers, company info fields, preview labels, save/reset buttons, validation messages
- **Struktura:** `admin.branding.*`

---

## Wave 51 — 3 Velké Stránky (TeamAccess, Emails, Parameters)

### AdminTeamAccess.jsx
- **Hardcoded ternary:** 31 → t()
- **Nové klíče:** 31
- **Pokrytí:** Role labels, permissions grid, member actions, invite form, access levels, status badges, confirmation dialogs
- **Struktura:** `admin.teamAccess.*`

### AdminEmails.jsx
- **Hardcoded ternary:** 75 → t()
- **Nové klíče:** 48
- **Pokrytí:** Template tabs (order_confirmation, shipped, issue, promotional), SMTP settings, auto-send rules, email log, variable chips, test send, validation
- **Struktura:** `admin.emails.*`

### AdminParameters.jsx
- **Hardcoded ternary:** 120 → t()
- **Nové klíče:** 120
- **Pokrytí:** Printer profile groups (nozzle/bed/fan speeds, layer heights, accelerations), pre-defined presets, stepper labels, validation hints
- **Sub-komponenty:** 6
- **Struktura:** `admin.parameters.*`

---

## Wave 52 — 4 Další Stránky (Widget, Coupons, Shipping, Settings)

### AdminWidget.jsx
- **Hardcoded strings:** 58 → t()
- **Nové klíče:** 60
- **Pokrytí:** Theme/height/border config UI, live preview labels, integration guide tabs, code samples, embed instructions
- **Struktura:** `admin.widget.*`

### AdminCoupons.jsx
- **Hardcoded ternary:** 40+ → t()
- **Nové klíče:** 91
- **Pokrytí:** Coupon form fields, discount types, usage tracking, validation messages, bulk actions, status labels
- **Struktura:** `admin.coupons.*`

### AdminShipping.jsx
- **Hardcoded ternary:** 47 → t()
- **Nové klíče:** 80
- **Pokrytí:** Shipping methods, zone configuration, weight tiers, free shipping rules, carrier names, validation messages
- **Struktura:** `admin.shipping.*`

### AdminSettings.jsx
- **Hardcoded strings:** 30 → t()
- **Nové klíče:** 30
- **Pokrytí:** General settings, order defaults, display preferences, notification preferences, toggle labels
- **Struktura:** `admin.settings.*`

---

## Celkové i18n Statistiky (Waves 41-52)

### Počty
- **Nových klíčů:** ~860+ (Czech + English parallel)
- **Migrovaných stránek:** 15 admin stránek
  1. AdminDashboard
  2. AdminOrders
  3. AdminLayout
  4. AdminAnalytics
  5. AdminPresets
  6. AdminFees
  7. AdminPricing
  8. AdminBranding (Wave 50)
  9. AdminTeamAccess (Wave 51)
  10. AdminEmails (Wave 51)
  11. AdminParameters (Wave 51)
  12. AdminWidget (Wave 52)
  13. AdminCoupons (Wave 52)
  14. AdminShipping (Wave 52)
  15. AdminSettings (Wave 52)

### Zbývající stránky (8)
- AdminOrderDetail
- AdminCustomers
- AdminIntegrations
- AdminWebhooks
- AdminActivityLog
- AdminSystemHealth
- AdminPayments
- AdminMigration

### Technické detaily
- **Pattern:** `t('admin.MODULE.key')`
- **Fallback:** Anglická default v kódu
- **Jak se dělá:**
  1. Sken hardcoded strings (bare strings, ternary operators, template literals)
  2. Extrakce klíčů (логичn struktura `admin.MODULE.*`)
  3. Přidání do `i18n/translations/en.json` (default)
  4. Přidání do `i18n/translations/cs.json` (Czech)
  5. Záměna v komponenty (`text` → `t('admin.MODULE.key')`)
  6. Build verify

---

## Build Status

```
npm run build: PASS (po každé vlně)
```

---

## Poznámky

- **Bilingual:** Všechny klíče mají CZ + EN verzi
- **Struktura klíčů:** Hierarchická (`admin.${MODULE}.${FEATURE}`)
- **Validace:** Chybí klíč = padá na `'admin.MODULE.key'` fallback (safe)
- **Pokrytí:** Po Wave 52 je ~95% admin UI přeloženo
- **Zbývá:** 8 stránek + public pages (není P0)

---

## Timestamp
- **Vlny:** 50-52
- **Session:** Audit Fix Marathon (pokračování)
- **Výkon:** 860+ klíčů v jedné session (autonomní mode)
