# 226-AD — UPRAVY — Admin-Dashboard (Vlna 10) — 2026-03-19

## Metadata
- **ID:** 226-AD
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** Admin-Dashboard (Setup Wizard)
- **Souvisejici ID:** 225-GN (Vlna 9 build verify), 222-GN (Vlna 6 AdminPayments Stripe), 223-GN (Vlna 7 BETA Checklist)
- **Trigger:** Vlna 10 BETA infrastruktura — Setup Wizard pro admin dashboard aby uzivatel vedel co jeste musi nastavit

---

## Souhrn uprav

Admin Setup Wizard je nova komponenta SetupProgress v AdminDashboard, ktera zobrazuje progress bar s 5 sluzbami (Firebase, Supabase, Stripe, Resend, Sentry) a klikatelnymi kroky. Kazdy krok ukazuje status (nastaveno/nenastaveno) a po kliknuti presmeruje na relevantni admin stranku. Pouziva Forge design system.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminDashboard.jsx | Zmeneno | nova komponenta | SetupProgress komponenta (progress bar, 5 sluzeb, klikatelne kroky, Forge design) |
| 2 | src/contexts/LanguageContext.jsx | Zmeneno | i18n sekce | 8 novych i18n klicu (admin.dashboard.setup*) |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminDashboard.jsx`

**Typ:** Zmeneno
**Radky:** nova komponenta v ramci souboru
**Duvod:** Uzivatel potrebuje videt co jeste musi nastavit pro BETA provoz

**Co se zmenilo:**
- Nova SetupProgress komponenta v AdminDashboard
- Progress bar ukazujici celkovy stav nastaveni (0-100%)
- 5 sluzeb: Firebase Auth, Supabase DB, Stripe Payments, Resend Email, Sentry Monitoring
- Kazdy krok zobrazuje: ikona, nazev sluzby, status (zelena fajfka / oranzovy vykricnik)
- Klikatelne kroky — presmeruje na relevantni admin stranku (Settings, Payments, Emails, System Health)
- Forge design system — forge-card, forge-progress, forge-badge
- Krok je oznacen jako hotovy na zaklade existence API klice v .env / tenant konfiguraci

---

### 2. `src/contexts/LanguageContext.jsx`

**Typ:** Zmeneno
**Radky:** i18n sekce
**Duvod:** Ceske a anglicke preklady pro Setup Wizard

**Co se zmenilo:**
- 8 novych i18n klicu s prefixem admin.dashboard.setup
- Klice: nadpis, popis, nazvy 5 sluzeb, statusy (configured/not_configured), progress label
- CZ: "Stav nastaveni", "Firebase Auth", "Nastaveno", "Ceka na nastaveni" atd.
- EN: "Setup Status", "Firebase Auth", "Configured", "Not configured" atd.

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminDashboard (nova sekce)
- **Breaking changes:** Ne — additivni zmena
- **Nove zavislosti:** Zadne
- **Rizika:** Setup detekce zavisi na dostupnosti .env promennych a tenant konfigurace

---

## Testovani

- **Build:** npm run build — PASS (soucasti finalni Vlna 9 verifikace)
- **Manual test:** Vizualni kontrola AdminDashboard s novou sekci
- **Poznamky:** Setup detekce muze vyzadovat ladeni po nasazeni do produkce

---
