# ID-REGISTRY — ModelPricer Historie

**Globalni pocitadlo:** 044 (incrementovano po kazdem zaznamu)

---

## Zkratky (2-znakove kody)

| Zkratka | Oblast | Pocet |
|---------|--------|-------|
| AU | Auth (login, register, Google Sign-In, token handling) | 2 |
| PR | Pricing Engine (cenovka, volume discounts, fees) | 0 |
| ST | Storage (tenant storage, Supabase, migration) | 0 |
| WG | Widget Builder (widget.js, postMessage, embed) | 0 |
| KA | Kalkulacka (test-kalkulacka, checkbox, recalc) | 0 |
| DN | Dokumentace (docs, markdown, typo fixy) | 0 |
| BU | Bug fixes (libovolne) | 0 |
| RS | Research / Investigation | 0 |
| FG | Forge Design System (CSS, theme, tokens) | 0 |
| SH | Shopify integrace (storefront, cart) | 0 |
| SB | Supabase (migrace, schema, policies) | 0 |
| AD | Admin (stranky, formulare, UI) | 0 |

---

## Zaznamy po poradi

| ID | Datum | Oblast | Nazev | Pocet zmen |
|----|-------|--------|-------|-----------|
| 001-AU | 2026-02-24 | Auth | Sprint 1 Auth Bugfixy FINAL — 3 bugy opraveny | 11 |
| 002-AU | 2026-02-24 | Auth | Sprint 1 Auth Bugfixy Faze 5 — Backend .env + Dokumentace | 4 |

---

## Session format

- **Session ID:** `S{NN}` — pocitano v ramci dne (01, 02, 03, ...)
- **Zapis:** `{NNN}-{ZK}` — globalni pocitadlo + zkratka (napr. `001-AU`, `042-PR`)

---

## Sablony umisteni

Sablony jsou v `docs/claude/Historie/SABLONY/`:
- `KONVERZACE.md` — plny text uzivatelskych zprav + otazek
- `UPRAVY.md` — seznam souboru + radky + popis zmen
- `OTAZKY.md` — Q&A format — polozkys textem otazky a odpovedi
- `DENNI-PREHLED.md` — shrnuty prehled dne (4-6 radku)
