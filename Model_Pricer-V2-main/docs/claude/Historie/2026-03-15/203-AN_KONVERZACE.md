# KONVERZACE — Admin Analytics analyza a planovani

---

## Hlavicka

**ID:** 203-AN
**Datum:** 2026-03-15
**Session:** S05
**Tema:** Admin Analytics analyza a planovani — prechod na realna data

---

## Plna konverzace

### Uzivatel (zprava 1)

> Uzivatel se ptal jak funguje Admin Analytics, jestli tam jsou demo data, a jak slozite bude prepnout na realna data. Pozadal o zkracenou formu analyzy + detailni plan do dokumentu.

### Claude (odpoved 1)

> Spustil 3 paralelni agenty pro komplexni analyzu:
>
> **Agent 1 — Frontend analyza AdminAnalytics:**
> - AdminAnalytics.jsx ma 1877 radku, 7 tabu, 6 grafu, 4 summary karty
> - DVA datove zdroje: analytics events (widget tracking) + orders (realne objednavky)
> - Demo data: funkce `ensureDemoAnalyticsSeeded()` seedne 84 fake sessions do localStorage
> - Grafy maji trojity fallback: order data -> session data -> hardcoded demo
> - Summary karty (Revenue, Orders, AOV, Conversion) JSOU realne (z orders)
> - Taby Calculations/Orders/Lost pouzivaji demo events
>
> **Agent 2 — Datove zdroje:**
> - 14 datovych zdroju v systemu, vsechny tenant-scoped
> - Hlavni: orders, analytics events, invoices, print queue, coupons
> - Vse v localStorage s `modelpricer:${tenantId}:*` klici
> - reportGenerator.js uz ma 4 typy reportu z realnych dat
>
> **Agent 3 — Architektonicky navrh:**
> - 70-80% funkcionality uz existuje
> - Slozitost: STREDNI (2-3 hodiny)
> - Chybi: orders over time chart, top customers chart, top models, granularni breakdown v kartach
> - Knihovna recharts (v2.15.2) jiz v projektu

### Uzivatel (zprava 2)

> Souhlas s pristupem. Pozadavek na zapis planu do `docs/claude/PLANS/admin-analytics-real-data.md`.

### Claude (odpoved 2)

> Plan zapsan do `docs/claude/PLANS/admin-analytics-real-data.md`.
> Demo data budou odstranena (Faze 1). Implementace v budouci session.

---

## Klicove rozhodovani

- **Rozhodnuti 1:** Demo data budou ODSTRANENA (ne jen skryta) — protoze realna data jsou dostatecna a demo data zkreslovala analytiku
- **Rozhodnuti 2:** Plan zapsan do separatniho souboru v PLANS/ — pro snadne sledovani a budouci implementaci
- **Rozhodnuti 3:** Slozitost odhadnuta na STREDNI (2-3 hodiny) — 70-80% infrastruktury jiz existuje (orders, recharts, storage helpery)

---

## Vyvody

- Admin Analytics ma solidni zaklad ale 3 ze 7 tabu pouzivaji demo data misto realnych
- Prechod na realna data je realizovatelny ve 2-3 hodinach diky existujici infrastrukture
- Plan ulozeny v `docs/claude/PLANS/admin-analytics-real-data.md`
- Implementace naplanovana na budouci session
- Klicove chybejici kusy: orders over time chart, top customers, top models, granularni karty

---
