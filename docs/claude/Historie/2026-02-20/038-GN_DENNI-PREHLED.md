# 038-GN — DENNI PREHLED: 2026-02-20

| Pole | Hodnota |
|------|---------|
| ID | 038-GN |
| Typ | DENNI-PREHLED |
| Datum | 2026-02-20 |
| Session | S01 |

## Souhrn dne

Dnes bylo dokonceno 4-fazove scannovani 20 admin stranek ModelPriceru:
- **20 screenshotu** ulozeno jako PNG soubory do Fotky_* slozek
- **20 funkcnich testu** vylepseno — kazdy dostal PNG referenci, rozsirene pozitivni nalezy, sekce 6 (Doporuceni pro RoadMap) kde chybela
- **4 historie zaznamy** ulozeny (034-GN, 035-GN, 036-GN, 037-GN)
- Nastroj: Playwright (chromium, full-page, wait-for-timeout 3000ms)
- Plan: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md

## Faze

| Faze | Stranky | Screenshot IDs | Historie ID |
|------|---------|---------------|-------------|
| 1 | Kalkulacka, Dashboard, Pricing, Fees, Presets | 012-TK az 016-AX | 034-GN |
| 2 | Parameters, Orders, Branding, Widget, Analytics | 017-AR az 021-AA | 035-GN |
| 3 | Team, Express, Shipping, Coupons, Emails | 022-AT az 026-GN | 036-GN |
| 4 | Migration, Integrations, Model Storage, Login, Account | 027-AM az 031-GN | 037-GN |

## Celkove hodnoceni stranek (z reportu)

| Stranka | Score | Stav |
|---------|-------|------|
| Test Kalkulacka (012-TK) | 18/20 | Funkcni |
| Admin Dashboard (013-AD) | 18/20 | Funkcni |
| Admin Pricing (014-AP) | 18/20 | Funkcni |
| Admin Fees (015-AF) | 17/20 | Funkcni |
| Admin Presets (016-AX) | 19/20 | Funkcni |
| Admin Parameters (017-AR) | 19/20 | Funkcni |
| Admin Orders (018-AO) | 16/20 | Kanban neprepina |
| Admin Branding (019-AB) | 19/20 | Funkcni |
| Admin Widget (020-AW) | 20/20 | Vynikajici |
| Admin Analytics (021-AA) | 17/20 | Demo data |
| Admin Team (022-AT) | 17/20 | Funkcni |
| Admin Express (023-AE) | 20/20 | Vynikajici |
| Admin Shipping (024-DP) | 20/20 | Vynikajici |
| Admin Coupons (025-KS) | 19/20 | Funkcni |
| Admin Emails (026-GN) | 17/20 | UI hotovo |
| Admin Migration (027-AM) | 20/20 | Vynikajici |
| Admin Integrations (028-AI) | 16/20 | Zaklad |
| Model Storage (029-MS) | 18/20 | Funkcni |
| Login (030-LG) | 14/20 | Zaklad |
| Account (031-GN) | 16/20 | Zaklad |
| **PRUMER** | **17.9/20** | |
