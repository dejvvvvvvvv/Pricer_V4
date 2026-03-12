# ID-REGISTRY — ModelPricer Historie

**Posledni pouzite ID:** 159
**Dalsi ID k pouziti:** 160
**Poslední aktualizace:** 2026-03-12

---

## Zkratky (2-znakove kody)

| Zkratka | Oblast | Pocet |
|---------|--------|-------|
| AU | Auth (login, register, Google Sign-In, token handling) | 2 |
| AC | Account (profil, company, team, settings) | 4 |
| PR | Pricing Engine (cenovka, volume discounts, fees) | 0 |
| ST | Storage (tenant storage, Supabase, migration) | 1 |
| WG | Widget Builder (widget.js, postMessage, embed) | 0 |
| WB | Widget Builder Testing (browser testing, design verification) | 1 |
| KA | Kalkulacka (test-kalkulacka, checkbox, recalc) | 0 |
| DN | Dokumentace (docs, markdown, typo fixy) | 0 |
| BU | Bug fixes (libovolne) | 1 |
| RS | Research / Investigation | 0 |
| FG | Forge Design System (CSS, theme, tokens) | 0 |
| SH | Shopify integrace (storefront, cart) | 0 |
| SB | Supabase (migrace, schema, policies) | 0 |
| AD | Admin (stranky, formulare, UI) | 0 |
| MC | MCP Servers (Firebase, GitHub, Stripe, Sentry, Vercel) | 1 |

---

## Zaznamy po poradi

| ID | Datum | Oblast | Nazev | Pocet zmen |
|----|-------|--------|-------|-----------|
| 001-AU | 2026-02-24 | Auth | Sprint 1 Auth Bugfixy FINAL — 3 bugy opraveny | 11 |
| 002-AU | 2026-02-24 | Auth | Sprint 1 Auth Bugfixy Faze 5 — Backend .env + Dokumentace | 4 |
| 045-FE | 2026-02-24 | Frontend | Sprint 2 Faze 2 — Kontrolni kroky + Build verify | 0 |
| 046-AC | 2026-02-24 | Account | Sprint 2 Faze 3 — Profile Tab s Realnym Daty | 1 |
| 047-AC | 2026-02-24 | Account | Sprint 2 Faze 5 — Company Tab s Realnym Ulozenim Dat | 2 |
| 048-AC | 2026-02-24 | Account | Sprint 2 Faze 7+9 — Security (changePassword) + Billing (subscription + i18n + a11y) | 10 |
| 049-AC | 2026-02-24 | Account | Sprint 2 KOMPLETNE HOTOVO — 5 ukolu, 10 souboru, build PASS | 10 |
| **050-ST** | 2026-02-25 | Storage | **Per-User Tenant Izolace — Core + Auth + Hardcoded cleanup** | **15** |
| **089-WB** | 2026-02-26 | Testing | **Widget Builder + Forge Design — Browser Testing** | **0** |
| **090-MC** | 2026-02-27 | MCP Servers | **MCP Server Installation (P0+P1: Firebase, GitHub, Stripe, Sentry, Vercel)** | **2** |
| **091-BU** | 2026-03-05 | Bug fixes | **Orders Page Fixes — Ceny + Rozmery + Layout** | **2** |
| **092-TK** | 2026-03-10 | Test-Kalkulacka | **Undo/Redo pro Print Config** | **3** |

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
