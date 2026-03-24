# ID-REGISTRY — ModelPricer Historie

**Posledni pouzite ID:** 259
**Dalsi ID k pouziti:** 260
**Poslední aktualizace:** 2026-03-22 (Session S01 — Customer Portal Phase 2 Bug Fixes, 259-CP)

---

## Zkratky (2-znakove kody)

| Zkratka | Oblast | Pocet |
|---------|--------|-------|
| AU | Auth (login, register, Google Sign-In, token handling) | 2 |
| AC | Account (profil, company, team, settings) | 4 |
| PR | Pricing Engine (cenovka, volume discounts, fees) | 0 |
| PF | Portal Fix (createPortal opravy modalu/overlayu) | 1 |
| ST | Storage (tenant storage, Supabase, migration) | 1 |
| WG | Widget Builder (widget.js, postMessage, embed) | 0 |
| WB | Widget Builder Testing (browser testing, design verification) | 1 |
| KA | Kalkulacka (test-kalkulacka, checkbox, recalc) | 0 |
| DN | Dokumentace (docs, markdown, typo fixy) | 0 |
| BU | Bug fixes (libovolne) | 3 |
| RS | Research / Investigation | 0 |
| FG | Forge Design System (CSS, theme, tokens) | 0 |
| SH | Shopify integrace (storefront, cart) | 0 |
| SB | Supabase (migrace, schema, policies) | 0 |
| AD | Admin (stranky, formulare, UI) | 0 |
| AN | Analytics (admin analytics, grafy, reporty) | 3 |
| MC | MCP Servers (Firebase, GitHub, Stripe, Sentry, Vercel) | 1 |
| SP | Support (public support page, FAQ, troubleshooting) | 1 |
| CP | Customer Portal (portal features, user data, orders) | 1 |

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
| **055-SP** | 2026-03-14 | Support | **Support Page + Security + Tenant Isolation P0 fixy** | **10** |
| **200-PF** | 2026-03-15 | Portal Fix | **Vlna 3: createPortal opravy vsech modalu/overlayu (24 souboru, ~45 prvku)** | **24** |
| **201-BU** | 2026-03-15 | Bug fixes | **Bug analyza post-Auth migrace — KONVERZACE (5 bugu, 3x P0, 2x P1)** | **0** |
| **202-BU** | 2026-03-15 | Bug fixes | **Bug analyza post-Auth migrace — UPRAVY (1 opraven, 4 cekaji)** | **1** |
| **203-AN** | 2026-03-15 | Analytics | **Admin Analytics analyza a planovani — prechod na realna data** | **0** |
| **204-AN** | 2026-03-15 | Analytics | **Finalizace Analytics planu — Q&A, 6 otazek, rozhodnuti** | **0** |
| **205-AN** | 2026-03-15 | Analytics | **Admin Analytics Q&A — otazky a odpovedi k planu** | **0** |
| **206-AN** | 2026-03-16 | Analytics | **Analytics Bug Fixes Round 2 — weight_grams, granularity, widget tenantId** | **5** |
| **259-CP** | 2026-03-22 | Customer Portal | **Phase 2 Bug-Fix Implementation — 6 backend endpointy, response shape normalizace, frontend integration** | **8** |

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
