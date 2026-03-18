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
| P01 | Homepage | `/` | Dokonceno | 7 bugu, 3 designove problemy. Konzole cista. |
| P02 | Pricing page | `/pricing` | Dokonceno | 6 bugu (vcetne globalnich). Konzole cista. |
| P03 | Support page | `/support` | Probiha | Castecny test — 2 bugy (globalni). Konzole neoverena. |
| P04 | Model Upload (public) | `/model-upload` | Dokonceno | 5 bugu (vcetne globalnich). Konzole cista. |
| P05 | Order Tracking | `/track` | Dokonceno | 4 bugy. Konzole cista. |
| P06 | 404 stranka | `/some-nonexistent-page` | Dokonceno | 2 bugy (globalni). Konzole cista. |
| P07 | Login / Auth | `/login` | Dokonceno (redirect only) | Prihlaseny uzivatel presmerovan na /admin. Formular netestovan. |
| P08 | Register | `/register` | Dokonceno (redirect only) | Prihlaseny uzivatel presmerovan na /admin. Formular netestovan. |
| P09 | Forgot Password | `/forgot-password` | Nezahajeno | |
| P10 | Test Kalkulacka | `/test-kalkulacka` | Nezahajeno | |
| P11 | Widget Kalkulacka | `/w/:id` | Nezahajeno | |
| P-Account | Account stranka | `/account` | Dokonceno | 8 bugu. Konzole cista. |
| P-Invite | Invite Accept | `/invite/accept` | Dokonceno | 2 bugy. Konzole cista. |
| A01 | Admin — Dashboard | `/admin` | Dokonceno | 2 bugy (BUG-044 P0 modal pod viewport, BUG-045 P1 analytics 404). Konzole cista. |
| A02 | Admin — Orders | `/admin/orders` | Dokonceno | 2 bugy (BUG-052 P2 hlavicky tabulky neprelozeny CZ, BUG-053 P3 blizka tlacitka). Konzole cista. |
| A03 | Admin — Order Detail | `/admin/orders/:id` | Dokonceno | Testovano jako soucast A02. Taby, status update, export — vse funkcni. |
| A04 | Admin — Analytics | `/admin/analytics` | Nezahajeno | Nedostupna — viz BUG-045 |
| A05 | Admin — Pricing | `/admin/pricing` | Dokonceno | 3 bugy (BUG-046 P1 delete nefunkcni, BUG-047 P2 slug gen, BUG-048 P2 validation). Konzole cista. |
| A06 | Admin — Fees | `/admin/fees` | Dokonceno | 3 bugy (BUG-037 zaporny input, BUG-038 Supabase RLS P1, BUG-039 i18n). Konzole: 1 Supabase RLS error. |
| A07 | Admin — Parameters | `/admin/parameters` | Dokonceno | 4 bugy + 1 console (BUG-040 Validation tab, BUG-041 Widget Reset, BUG-042 tichy zahoz, BUG-043 pocitadlo). |
| A08 | Admin — Presets | `/admin/presets` | Dokonceno | 2 bugy (BUG-049 P1 template hodnoty prazdne, BUG-050 P2 delete dialog mimo viewport). Konzole cista. |
| A09 | Admin — Branding | `/admin/branding` | Nezahajeno | |
| A10 | Admin — Widget | `/admin/widget` | Nezahajeno | |
| A11 | Admin — Team | `/admin/team` | Nezahajeno | |
| A12 | Admin — Customers | `/admin/customers` | Dokonceno | 0 bugu — nejlepe otestovana stranka, nulova chybovost. Konzole cista. |
| A13 | Admin — Integrations | `/admin/integrations` | Nezahajeno | |
| A14 | Admin — Coupons | `/admin/coupons` | Dokonceno | 1 bug (BUG-051 P3 native select UX). Konzole cista. |
| A-Express | Admin — Express Delivery | `/admin/express` | Dokonceno | 0 bugu. Konzole cista. Stranka plne funkcni. |
| A15 | Admin — Shipping | `/admin/shipping` | Dokonceno | 0 bugu. Konzole cista. |
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
| P0 — Kriticke | 1 | 0 | 1 |
| P1 — Vyznamne | 26 | 0 | 26 |
| P2 — Mensi | 23 | 0 | 23 |
| P3 — Drobnosti | 11 | 0 | 11 |
| **Celkem** | 61 | 0 | 61 |

> Poznamka: Testovani probiha. Otestovany stranky: P01, P02, P03 (castecne), P04, P05 (Order Tracking), P06 (404), P07 (Login — redirect), P08 (Register — redirect), P-Account, P-Invite, A01 (Dashboard), A02+A03 (Orders + Order Detail), A05 (Pricing), A06 (Fees), A07 (Parameters), A08 (Presets), A12 (Customers), A14 (Coupons), A-Express (Express Delivery), A15 (Shipping).
> Globalni bugy (jeden problem, zaznamenan vicekrat): /privacy + /terms → 404 (BUG-003/004/011/012/014/015/019/020/026), "Upload Model" button neprelozeno (BUG-016/024), Footer "Home" neprelozeno (BUG-018/025).
> Unikatni problemy (bez globalnich duplicit): ~43 (+3 novych z A14/Coupons BUG-051, A02/Orders BUG-052/053 v teto davce). A12/Customers, A-Express a A15/Shipping jsou zero-bug stranky.

### Problemy s designem

| Typ | Pocet |
|-----|-------|
| Barva / Kontrast | 2 |
| Pismo / Typografie | 0 |
| Layout / Zarovnani | 0 |
| Konzistentnost | 1 |
| Responzivita | 0 |
| **Celkem** | 3 |

> Poznamka: Admin stranky Coupons, Orders, Customers — vsechny maji konzistentni Forge dark theme. Status badges v Orders jsou vizualne povedene. Customers je nejpolisovanejsi stranka celkove — zadne designove problemy.

### Problemy s prekladem

| Jazyk | Chybejici | Spatny preklad | Hardcoded | Neprevedeno | Celkem |
|-------|-----------|----------------|-----------|-------------|--------|
| CZ | 7 | 1 | 2 | 3 | 13 |
| EN | 0 | 0 | 0 | 0 | 0 |

> Nalezene i18n bugy: BUG-007 (hardcoded CZ text), BUG-009 (Recommended badge), BUG-010 (3 chybejici CZ preklady), BUG-016/024 (Upload Model button — globalni), BUG-017 (file format labely), BUG-018/025 (Footer Home — globalni), BUG-022 (EMAIL label), BUG-034 (CZ diakriticka — vice poli na Account page), BUG-036 (Invite page neprelozena), BUG-052 (Orders — hlavicky tabulky neprelozeny do CZ).
> Coupons: plna CZ pokryti, zero i18n issues. Customers: plna CZ pokryti, zero issues.

### Funkcionalni problemy

| Kategorie | Pocet |
|-----------|-------|
| Formular / validace | 2 |
| Navigace / routing | 3 |
| Data / storage | 2 |
| Upload / soubory | 0 |
| Modal / overlay | 0 |
| Tlacitka nefunkcni | 4 |
| **Celkem** | 11 |

> Routing problemy: /privacy → 404, /terms → 404, socialni ikony href="#".
> Storage problem: smiseny stav jazyka v localStorage pri reloadu; telefonni cislo se neulozi (BUG-027).
> Formular / validace: chybejici email format validace na Track page (BUG-021); form reset pri prepinani jazyka (BUG-023).
> Nefunkcni tlacitka na Account page: Enable 2FA (BUG-030), Change Plan (BUG-031), Add Payment Method (BUG-032), Cancel Subscription (BUG-033).

---

## Postup testovani

```
[x] P01 — Homepage (dokonceno — 7 bugu, 3 designove problemy, konzole cista)
[x] P02 — Pricing page (dokonceno — 6 bugu, konzole cista)
[~] P03 — Support page (castecne — 2 bugy globalni, konzole neoverena)
[x] P04 — Model Upload (dokonceno — 5 bugu, konzole cista)
[x] P05 — Order Tracking /track (dokonceno — 4 bugy, konzole cista)
[x] P06 — 404 stranka (dokonceno — 2 bugy globalni, konzole cista)
[x] P07 — Login (redirect only — formular netestovan)
[x] P08 — Register (redirect only — formular netestovan)
[x] P-Account — Account stranka /account (dokonceno — 8 bugu, konzole cista)
[x] P-Invite — Invite Accept /invite/accept (dokonceno — 2 bugy, konzole cista)
[ ] P09 — Forgot Password
[ ] P10 — Test Kalkulacka (plny tok)
[ ] P11 — Widget Kalkulacka
[x] A01 — Admin Dashboard (dokonceno — BUG-044 P0 modal, BUG-045 analytics 404, konzole cista)
[x] A02 — Admin Orders (dokonceno — BUG-052 P2 hlavicky neprelozeny CZ, BUG-053 P3 blizka tlacitka, konzole cista)
[x] A03 — Admin Order Detail (testovano jako soucast A02 — taby, status update, export funkcni)
[ ] A04 — Admin Analytics (nedostupna — BUG-045)
[x] A05 — Admin Pricing (dokonceno — BUG-046/047/048, konzole cista)
[x] A06 — Admin Fees (dokonceno — BUG-037/038/039, Supabase RLS error P1)
[x] A07 — Admin Parameters (dokonceno — BUG-040/041/042/043 + CON-001)
[x] A08 — Admin Presets (dokonceno — BUG-049 P1 template hodnoty prazdne, BUG-050 P2 delete dialog off-viewport, konzole cista)
[x] A-Express — Admin Express Delivery (dokonceno — zero bugs, konzole cista)
[ ] A09 — Admin Branding
[ ] A10 — Admin Widget
[ ] A11 — Admin Team
[x] A12 — Admin Customers (dokonceno — ZERO BUGS, nejlepe otestovana stranka, konzole cista)
[ ] A13 — Admin Integrations
[x] A14 — Admin Coupons (dokonceno — BUG-051 P3 native select, konzole cista)
[x] A15 — Admin Shipping (dokonceno — zero bugs, konzole cista)
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

*Dokument vytvoreno: 2026-03-18 | Aktualizovan: 2026-03-18 (davka 6 — A14/Coupons BUG-051, A02+A03/Orders BUG-052/053, A12/Customers zero bugs pridany)*
