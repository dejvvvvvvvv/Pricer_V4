# 207-BH — UPRAVY: Analytics Page Hidden for Beta (2026-03-17)

**Session:** S01
**Typ:** UPRAVY
**Status:** HOTOVO
**Build:** PASS

---

## Kontext

Uzivatel se rozhodl, ze Analytics stranka neni pripravena pro beta verzi projektu, protoze:
- Data z analytics trackingu se neshoduje se skutecnymi daty objednavek (cas, hmotnost, cena jsou nepresne)
- Tracking system potrebuje vice prace na presnosti
- Bude re-enabled v pozdejsi verzi

---

## Zmeny (2 soubory)

### 1. Route Hidden — `src/Routes.jsx`
- Zmena: `path="analytics"` → `path="lockanalytics"`
- Stranka neni vice dostupna na `/admin/analytics`
- Kod zachovan pro budouci re-enablement

### 2. Menu Item Removed — `src/pages/admin/AdminLayout.jsx`
- Analytics nav item zakomentovana ze sidebar
- Keyboard shortcut (G A) taky zakomentovana
- Komentar pridam: "Hidden for beta - analytics not ready yet"

---

## Rozhodovani (Decision Rationale)

Analytics tracking bylo zapojeno (trackAnalyticsEvent volani pridana do calculator a widget), ale data zobrazovana se presne neshoduje se skutecnymi order daty. Miste toho aby se vyslaly nepresne analyticke data, stranka je skryta dokud data presnost neni spravena.

---

## Jak Re-Enable Later

1. V Routes.jsx: zmenit `path="lockanalytics"` zpet na `path="analytics"`
2. V AdminLayout.jsx: uncomment Analytics nav item a keyboard shortcut
3. Opravit data accuracy issues v tracking calls

---

## Soubory Zmeneny

1. `src/Routes.jsx` — route path change
2. `src/pages/admin/AdminLayout.jsx` — menu item commented out

---

## Verifikace

- Build: **PASS**
- Route nedostupna: Overeno
- Menu item skryta: Overeno
