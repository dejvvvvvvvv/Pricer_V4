# ModelPricer V3 — Master Prehled Testovani

**Datum testovani:** 2026-03-18
**Provedl:** Claude Code
**Dev URL:** http://localhost:4028
**Verze projektu:** V3 (VariantaA, A–F Integrated)

---

## Metodologie

Rucni vizualni testovani v prohlizeci (Chrome). Kazda stranka je testovana jednotlive.
Pro kazdy nalez se zapisuje ID, stranka, zavaznost a popis do prislusneho souboru.

### Kategorie zavaznosti

| Uroven | Popis |
|--------|-------|
| P0 | Crash, bila obrazovka, blokuje pouzivani |
| P1 | Dulezita funkcionalita nefunguje spravne |
| P2 | Mensi problemy, workaround existuje |
| P3 | Drobnosti, kosmetika, dobre mit |

### Testovaci soubory

| Soubor | Obsah |
|--------|-------|
| `01-Errors-And-Bugs.md` | Vsechny chyby a bugy (funkce, crash, console) |
| `02-Correct-Behavior.md` | Co funguje spravne |
| `03-Design-Audit.md` | Problemy s designem a vizualem |
| `04-Translation-Audit.md` | Chyby prekladu / chybejici texty |
| `05-Cross-Function-Tests.md` | Propojeni mezi strankami (admin → kalkulacka) |
| `06-Console-Errors.md` | Chyby v browser konzoli |

---

## Seznam stranek ke testovani

| ID | Stranka | URL | Status | Poznamky |
|----|---------|-----|--------|----------|
| P01 | Homepage | `/` | Nezahajeno | |
| P02 | Pricing page | `/pricing` | Nezahajeno | |
| P03 | Support page | `/support` | Nezahajeno | |
| P04 | Model Upload (public) | `/model-upload` | Nezahajeno | |
| P05 | 404 stranka | `/neexistujici-route` | Nezahajeno | |
| P06 | Login / Auth | `/login` | Nezahajeno | |
| P07 | Register | `/register` | Nezahajeno | |
| P08 | Forgot Password | `/forgot-password` | Nezahajeno | |
| P09 | Test Kalkulacka | `/test-kalkulacka` | Nezahajeno | |
| P10 | Widget Kalkulacka | `/w/:id` | Nezahajeno | |
| A01 | Admin — Dashboard | `/admin` | Nezahajeno | |
| A02 | Admin — Orders | `/admin/orders` | Nezahajeno | |
| A03 | Admin — Order Detail | `/admin/orders/:id` | Nezahajeno | |
| A04 | Admin — Analytics | `/admin/analytics` | Nezahajeno | |
| A05 | Admin — Pricing | `/admin/pricing` | Nezahajeno | |
| A06 | Admin — Fees | `/admin/fees` | Nezahajeno | |
| A07 | Admin — Parameters | `/admin/parameters` | Nezahajeno | |
| A08 | Admin — Presets | `/admin/presets` | Nezahajeno | |
| A09 | Admin — Branding | `/admin/branding` | Nezahajeno | |
| A10 | Admin — Widget | `/admin/widget` | Nezahajeno | |
| A11 | Admin — Team | `/admin/team` | Nezahajeno | |
| A12 | Admin — Customers | `/admin/customers` | Nezahajeno | |
| A13 | Admin — Integrations | `/admin/integrations` | Nezahajeno | |
| A14 | Admin — Coupons | `/admin/coupons` | Nezahajeno | |
| A15 | Admin — Shipping | `/admin/shipping` | Nezahajeno | |
| A16 | Admin — Print Queue | `/admin/print-queue` | Nezahajeno | |
| A17 | Admin — System Health | `/admin/system-health` | Nezahajeno | |
| A18 | Admin — Webhooks | `/admin/webhooks` | Nezahajeno | |
| A19 | Admin — Activity Log | `/admin/activity-log` | Nezahajeno | |
| A20 | Admin — Settings | `/admin/settings` | Nezahajeno | |
| A21 | Admin — Emails | `/admin/emails` | Nezahajeno | |
| A22 | Admin — Account | `/admin/account` | Nezahajeno | |

**Celkem stranek:** 31

---

## Souhrn nalezu

> Tato sekce se vyplni po dokonceni testovani.

### Bugy a chyby

| Zavaznost | Pocet | Reseno | Zbyva |
|-----------|-------|--------|-------|
| P0 — Kriticke | — | — | — |
| P1 — Vyznamne | — | — | — |
| P2 — Mensi | — | — | — |
| P3 — Drobnosti | — | — | — |
| **Celkem** | — | — | — |

### Problemy s designem

| Typ | Pocet |
|-----|-------|
| Barva / Kontrast | — |
| Pismo / Typografie | — |
| Layout / Zarovnani | — |
| Konzistentnost | — |
| Responzivita | — |
| **Celkem** | — |

### Problemy s prekladem

| Jazyk | Chybejici | Spatny preklad | Hardcoded | Celkem |
|-------|-----------|----------------|-----------|--------|
| CZ | — | — | — | — |
| EN | — | — | — | — |

### Funkcionalni problemy

| Kategorie | Pocet |
|-----------|-------|
| Formular / validace | — |
| Navigace / routing | — |
| Data / storage | — |
| Upload / soubory | — |
| Modal / overlay | — |
| **Celkem** | — |

---

## Postup testovani

```
[ ] P01 — Homepage
[ ] P02 — Pricing page
[ ] P03 — Support page
[ ] P04 — Model Upload
[ ] P05 — 404
[ ] P06 — Login
[ ] P07 — Register
[ ] P08 — Forgot Password
[ ] P09 — Test Kalkulacka (plny tok)
[ ] P10 — Widget Kalkulacka
[ ] A01 — Admin Dashboard
[ ] A02 — Admin Orders
[ ] A03 — Admin Order Detail
[ ] A04 — Admin Analytics
[ ] A05 — Admin Pricing
[ ] A06 — Admin Fees
[ ] A07 — Admin Parameters
[ ] A08 — Admin Presets
[ ] A09 — Admin Branding
[ ] A10 — Admin Widget
[ ] A11 — Admin Team
[ ] A12 — Admin Customers
[ ] A13 — Admin Integrations
[ ] A14 — Admin Coupons
[ ] A15 — Admin Shipping
[ ] A16 — Admin Print Queue
[ ] A17 — Admin System Health
[ ] A18 — Admin Webhooks
[ ] A19 — Admin Activity Log
[ ] A20 — Admin Settings
[ ] A21 — Admin Emails
[ ] A22 — Admin Account
[ ] 05 — Cross-function testy (po dokonceni vsech stranek)
```

---

*Dokument vytvoreno: 2026-03-18*
