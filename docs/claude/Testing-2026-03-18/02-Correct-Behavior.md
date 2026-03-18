# Testovani 2026-03-18 — Spravne Chovani

**Datum:** 2026-03-18
**Soubor:** 02-Correct-Behavior.md

Zaznamenavej zde vse co funguje spravne. Tento dokument slouzi jako reference pro budouci
regresni testovani — vic co je zde zaznamenano, tim snazsi je odhalit regresi pri pristi zmene.

---

## Legenda — Stav

| Stav | Vyznam |
|------|--------|
| OK | Funguje spravne, bez vyhrad |
| Castecne | Funguje, ale s malymi nepresnostmi nebo omezenimi |
| Neovereno | Stranka nebyla v teto session testovana |

---

## Verejne stranky

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| P01 — Homepage | `/` | | Neovereno | |
| P02 — Pricing | `/pricing` | | Neovereno | |
| P03 — Support | `/support` | | Neovereno | |
| P04 — Model Upload | `/model-upload` | | Neovereno | |
| P05 — 404 | `/neexistujici` | | Neovereno | |

---

## Auth stranky

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| P06 — Login | `/login` | | Neovereno | |
| P07 — Register | `/register` | | Neovereno | |
| P08 — Forgot Password | `/forgot-password` | | Neovereno | |

---

## Kalkulacky

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 1: upload souboru | Neovereno | |
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 2: volba parametru | Neovereno | |
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 3: naceneni | Neovereno | |
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 4: checkout formular | Neovereno | |
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 5: potvrzeni objednavky | Neovereno | |
| P10 — Widget | `/w/:id` | Zobrazeni widgetu | Neovereno | |
| P10 — Widget | `/w/:id` | Cena se vypocita | Neovereno | |

---

## Admin stranky

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| A01 — Dashboard | `/admin` | | Neovereno | |
| A02 — Orders | `/admin/orders` | Zobrazeni seznamu | Neovereno | |
| A02 — Orders | `/admin/orders` | Filtrovani | Neovereno | |
| A02 — Orders | `/admin/orders` | Export | Neovereno | |
| A03 — Order Detail | `/admin/orders/:id` | Zakladni data | Neovereno | |
| A03 — Order Detail | `/admin/orders/:id` | Zalozky (taby) | Neovereno | |
| A04 — Analytics | `/admin/analytics` | Grafy | Neovereno | |
| A05 — Pricing | `/admin/pricing` | Nacitani cen | Neovereno | |
| A05 — Pricing | `/admin/pricing` | Ukladani cen | Neovereno | |
| A06 — Fees | `/admin/fees` | | Neovereno | |
| A07 — Parameters | `/admin/parameters` | | Neovereno | |
| A08 — Presets | `/admin/presets` | | Neovereno | |
| A09 — Branding | `/admin/branding` | | Neovereno | |
| A10 — Widget | `/admin/widget` | | Neovereno | |
| A11 — Team | `/admin/team` | | Neovereno | |
| A12 — Customers | `/admin/customers` | | Neovereno | |
| A13 — Integrations | `/admin/integrations` | | Neovereno | |
| A14 — Coupons | `/admin/coupons` | | Neovereno | |
| A15 — Shipping | `/admin/shipping` | | Neovereno | |
| A16 — Print Queue | `/admin/print-queue` | | Neovereno | |
| A17 — System Health | `/admin/system-health` | | Neovereno | |
| A18 — Webhooks | `/admin/webhooks` | | Neovereno | |
| A19 — Activity Log | `/admin/activity-log` | | Neovereno | |
| A20 — Settings | `/admin/settings` | | Neovereno | |
| A21 — Emails | `/admin/emails` | | Neovereno | |
| A22 — Account | `/admin/account` | | Neovereno | |

---

## Globalni prvky

| Prvek | Kde | Stav | Poznamky |
|-------|-----|------|----------|
| Navigace — Header | Verejne stranky | Neovereno | |
| Navigace — Footer | Verejne stranky | Neovereno | |
| Admin Sidebar | Admin stranky | Neovereno | |
| Admin — Command Palette | Admin (Cmd+K) | Neovereno | |
| Admin — Theme toggle | Admin (dark/light) | Neovereno | |
| Admin — Notification center | Admin | Neovereno | |
| i18n — prepinac jazyka CZ/EN | Vsude | Neovereno | |
| Toast notifikace | Vsude | Neovereno | |
| Offline banner | Vsude | Neovereno | |
| PWA install banner | Chrome | Neovereno | |

---

*Soubor vytvoren: 2026-03-18*
