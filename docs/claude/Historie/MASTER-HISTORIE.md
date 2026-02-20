# MASTER HISTORIE — ModelPricer V3

> Centralni rozcestnik vsech zaznamu historie projektu.
> Kazdy radek odkazuje na konkretni soubor s detailni historii.

---

## Jak cist tento soubor

- **ID:** Globalni poradove cislo + zkratka oblasti (viz `ID-REGISTRY.md`)
- **Session:** Oznaceni session v ramci dne (S01, S02, ...)
- **Typ:** KONVERZACE / UPRAVY / OTAZKY / DENNI-PREHLED
- **Souvisejici:** ID jinych souboru ktere s timto souvisi
- **Cesta:** Relativni cesta od `docs/claude/Historie/`

---

## Statistiky

- **Celkem zaznamu:** 18
- **Prvni zaznam:** 001-GN (2026-02-19)
- **Posledni zaznam:** 038-GN (2026-02-20)

---

## Zaznamy

<!-- VKLADEJ NOVE ZAZNAMY NA KONEC TABULKY PRO DANY DEN -->
<!-- Novy den vzdy zacni novym headingem ### YYYY-MM-DD -->

### 2026-02-19

| ID | Session | Oblast | Typ | Popis | Souvisejici | Cesta |
|----|---------|--------|-----|-------|-------------|-------|
| 001-GN | S01 | General | KONVERZACE | Navrh a implementace Historie systemu — 5 zprav, diskuze triggery/format/ID/jazyk | 002-GN, 003-GN | 2026-02-19/001-GN_KONVERZACE.md |
| 002-GN | S01 | General | UPRAVY | 8 novych + 5 upravenych souboru (agent, skill, sablony, ID-REGISTRY, oba CLAUDE.md) | 001-GN, 003-GN | 2026-02-19/002-GN_UPRAVY.md |
| 003-GN | S01 | General | OTAZKY | 7 Q&A — triggery, uroven detailu, ID system, jazyk, preklepy, plan trigger | 001-GN, 002-GN | 2026-02-19/003-GN_OTAZKY.md |
| 004-GN | S01 | General | DENNI-PREHLED | Souhrn dne — Historie system od nuly, 13 souboru, S01 | 001-GN, 002-GN, 003-GN | 2026-02-19/DENNI-PREHLED.md |
| 007-GN | S03 | General | KONVERZACE | RoadMap Cloud Run/Supabase/Domain + Order processing research | 008-GN | 2026-02-19/007-GN_KONVERZACE.md |
| 008-GN | S03 | General | UPRAVY | RoadMap.md — 16 editu (Cloud Run, Supabase, Domain, Stripe doporuceni) | 007-GN | 2026-02-19/008-GN_UPRAVY.md |
| 009-PE | S03 | Pricing-Engine | KONVERZACE | Pricing Engine V3 roadmap analyza — 88% hotovo, expressSurcharge, KD ukoly, 8 podslouboru | 010-PE, 011-PE | 2026-02-19/009-PE_KONVERZACE.md |
| 010-PE | S03 | Pricing-Engine | UPRAVY | 9 novych dokumentacnich souboru v 3_PricingEngineV3/ — rozdeleni 590-radkoveho roadmapu | 009-PE, 011-PE | 2026-02-19/010-PE_UPRAVY.md |
| 011-PE | S03 | Pricing-Engine | OTAZKY | 7 Q&A — expressSurcharge, KD, scope, testy, currency, objednavky | 009-PE, 010-PE | 2026-02-19/011-PE_OTAZKY.md |

---

### 2026-02-20

| ID | Session | Oblast | Typ | Popis | Souvisejici | Cesta |
|----|---------|--------|-----|-------|-------------|-------|
| 032-GN | S01-S03 | General | KONVERZACE | Funkcni testovani 20 stranek — Chrome MCP, screenshoty, reporty 012-031, score 350/400 | 033-GN | 2026-02-20/032-GN_KONVERZACE.md |
| 033-GN | S01-S03 | General | UPRAVY | 22 novych souboru (20 reportu + sablona + master), 20 screenshot slozek, 2 upravene soubory | 032-GN | 2026-02-20/033-GN_UPRAVY.md |
| 034-GN | S01 | General | UPRAVY | Faze 1 oprava screenshotu — 5 novych PNG (Playwright), 5 vylepseni funkcnich testu (012-016) | 032-GN, 033-GN | 2026-02-20/034-GN_UPRAVY-Faze1-Screenshoty.md |
| 035-GN | S01 | General | UPRAVY | Faze 2 oprava screenshotu — 5 novych PNG (Playwright), 5 vylepseni funkcnich testu (017-021) | 032-GN, 033-GN, 034-GN | 2026-02-20/035-GN_UPRAVY-Faze2-Screenshoty.md |
| 036-GN | S01 | General | UPRAVY | Faze 3 screenshoty: Team, Express, Shipping, Coupons, Emails + vylepseni 5 reportu | 032-GN, 033-GN, 035-GN | 2026-02-20/036-GN_UPRAVY-Faze3-Screenshoty.md |
| 037-GN | S01 | General | UPRAVY | Faze 4 screenshoty: Migration, Integrations, Model Storage, Login, Account + vylepseni 5 reportu | `2026-02-20/037-GN_UPRAVY-Faze4-Screenshoty.md` |
| 038-GN | S01 | General | DENNI-PREHLED | Denni prehled: 20 screenshotu, 20 reportu vylepseno, 4 faze dokonceny | `2026-02-20/038-GN_DENNI-PREHLED.md` |

---

**Posledni aktualizace:** 2026-02-20 (S01) — Faze 4 + denni prehled (037-GN, 038-GN)
