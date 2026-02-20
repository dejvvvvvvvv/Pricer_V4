# MASTER Souhrn — Funkcni Testy ModelPricer V3

| Parametr | Hodnota |
|----------|---------|
| **Datum** | 2026-02-20 |
| **Pocet reportu** | 20 |
| **ID rozsah** | 012-TK az 031-GN |
| **Celkove skore** | 350/400 (prumer 17.5/20) |

---

## Prehled vsech reportu

| # | ID | Oblast | Route | Score | Stav |
|---|-----|--------|-------|-------|------|
| 1 | 012-TK | Test-Kalkulacka | `/test` | 14/20 | FUNKCNI (step 1 only) |
| 2 | 013-AD | Admin Dashboard | `/admin/dashboard` | 17/20 | FUNKCNI (mock data) |
| 3 | 014-AP | Admin Pricing | `/admin/pricing` | 18/20 | FUNKCNI |
| 4 | 015-AF | Admin Fees | `/admin/fees` | 16/20 | FUNKCNI |
| 5 | 016-AX | Admin Presets | `/admin/presets` | 17/20 | FUNKCNI |
| 6 | 017-AR | Admin Parameters | `/admin/parameters` | 19/20 | FUNKCNI |
| 7 | 018-AO | Admin Orders | `/admin/orders` | 16/20 | FUNKCNI |
| 8 | 019-AB | Admin Branding | `/admin/branding` | 19/20 | FUNKCNI |
| 9 | 020-AW | Admin Widget | `/admin/widget` | 20/20 | FUNKCNI |
| 10 | 021-AA | Admin Analytics | `/admin/analytics` | 17/20 | FUNKCNI (mock data) |
| 11 | 022-AT | Admin Team | `/admin/team` | 17/20 | FUNKCNI (demo) |
| 12 | 023-AE | Admin Express | `/admin/express` | 20/20 | FUNKCNI |
| 13 | 024-DP | Admin Shipping | `/admin/shipping` | 20/20 | FUNKCNI |
| 14 | 025-KS | Admin Coupons | `/admin/coupons` | 19/20 | FUNKCNI |
| 15 | 026-GN | Admin Emails | `/admin/emails` | 17/20 | FUNKCNI (UI only) |
| 16 | 027-AM | Admin Migration | `/admin/migration` | 20/20 | FUNKCNI |
| 17 | 028-AI | Admin Integrations | `/admin/integrations` | 16/20 | FUNKCNI (Shopify OFF) |
| 18 | 029-MS | Model Storage | `/admin/model-storage` | 18/20 | FUNKCNI |
| 19 | 030-LG | Login | `/login` | 14/20 | FUNKCNI (demo auth) |
| 20 | 031-GN | Account | `/account` | 16/20 | FUNKCNI (demo data) |

---

## Distribuce skore

| Skore | Stranky |
|-------|---------|
| **20/20** | Widget (020), Express (023), Shipping (024), Migration (027) |
| **19/20** | Parameters (017), Branding (019), Coupons (025) |
| **18/20** | Pricing (014), Model Storage (029) |
| **17/20** | Dashboard (013), Presets (016), Analytics (021), Team (022), Emails (026) |
| **16/20** | Fees (015), Orders (018), Integrations (028), Account (031) |
| **14/20** | Kalkulacka (012), Login (030) |

---

## Top 4 stranky (20/20)

1. **Admin Widget (020-AW)** — Plne funkcni widget builder, nahled, embed kod, vykreslovani
2. **Admin Express (023-AE)** — 3 urovne doruceni, zakaznicke nahled karty, upsell nastaveni
3. **Admin Shipping (024-DP)** — 2 metody doruceni, detail konfigurace, free shipping threshold
4. **Admin Migration (027-AM)** — 19 data sources, Supabase connected, bezpecny workflow

## Nejnizsi 2 stranky (14/20)

1. **Login (030-LG)** — Spatne viditelne tlacitko, chybi forgot password + registrace, demo auth
2. **Kalkulacka (012-TK)** — Jen Step 1 testovatelny bez manualnho upload souboru

---

## Slozky BEZ funkcniho testu (duvod)

| Slozka | Duvod |
|--------|-------|
| 2_PrusaSlicerBackend | Backend service — zadna admin stranka |
| 3_PricingEngineV3 | Code engine — testovano pres Admin Pricing (014-AP) |
| 9_Fakturace | Neni implementovano — zadna route |
| 12_WidgetBuilder | Vylouceno uzivatelem (testovano v 020-AW) |
| 19_i18n_Lokalizace | Cross-cutting feature — zadna dedickovana stranka |
| 24_VerejneStranky | Vylouceno uzivatelem (Home, Pricing, Support) |
| 26_CloudRun | Infrastruktura — zadna UI stranka |
| 28_VlastniDomena | Neni implementovano — zadna route |

---

## Hlavni nalezene problemy (agregovane)

### P2 — Stredni zavaznost
| Oblast | Popis |
|--------|-------|
| Login (030) | "Prihlasit se" tlacitko je tmave, spatne viditelne — zmenit na teal CTA |
| Model Storage (029) | Route `/model-storage` vraci 404, jen `/admin/model-storage` funguje |

### INFO — Budouci vylepseni
| Oblast | Popis |
|--------|-------|
| Auth (030, 031) | Demo auth — nepripojeno na Supabase Auth |
| Emails (026) | Provider "Zadny (vypnuto)" — backend odesilani neni pripojeno |
| Integrations (028) | Jen Shopify, ODPOJENO — chybi WooCommerce a dalsi |
| Dashboard (013) | Mock data misto realnych |
| Analytics (021) | Demo data — potrebuje realne eventy |
| Team (022) | Demo cleni — potrebuje auth napojeni |
| Login (030) | Chybi forgot password, registrace |
| Account (031) | Chybi zmena hesla, 2FA, preferences |
| Express (023) | Chybi integrace do kalkulacky |
| Shipping (024) | Chybi integrace do kalkulacky |
| Coupons (025) | System vypnuty, prazdne seznamy |

---

## Celkove hodnoceni aplikace

| Kriteria | Prumer | Poznamka |
|----------|--------|----------|
| Vizualni kvalita | 4.4/5 | Forge dark tema konzistentni, profesionalni |
| Funkcnost | 3.8/5 | Admin UI hotove, backend integrace casto chybi |
| UX/pouzitelnost | 4.1/5 | Intuitivni, jasne stavy, ikony |
| Stabilita | 4.9/5 | Minimalni chyby, zadne pady |
| **Celkem** | **17.5/20** | Solidni admin zaklad, hlavni TODO: auth + backend |

---

## Soubory reportu

| ID | Cesta |
|----|-------|
| 012-TK | `1_Kalkulacka/FunkcniTest_Kalkulacka_012-TK.md` |
| 013-AD | `15_AdminDashboard/FunkcniTest_AdminDashboard_013-AD.md` |
| 014-AP | `4_AdminMaterialyCenotvorba/FunkcniTest_AdminPricing_014-AP.md` |
| 015-AF | `5_AdminPoplatkyFees/FunkcniTest_AdminFees_015-AF.md` |
| 016-AX | `6_AdminPresety/FunkcniTest_AdminPresety_016-AX.md` |
| 017-AR | `10_AdminParameters/FunkcniTest_AdminParameters_017-AR.md` |
| 018-AO | `7_AdminObjednavky/FunkcniTest_AdminOrders_018-AO.md` |
| 019-AB | `13_AdminBranding/FunkcniTest_AdminBranding_019-AB.md` |
| 020-AW | `11_WidgetEmbed/FunkcniTest_AdminWidget_020-AW.md` |
| 021-AA | `21_AdminAnalytika/FunkcniTest_AdminAnalytika_021-AA.md` |
| 022-AT | `23_AdminTeam/FunkcniTest_AdminTeam_022-AT.md` |
| 023-AE | `17_ExpressDelivery/FunkcniTest_AdminExpress_023-AE.md` |
| 024-DP | `16_Doprava/FunkcniTest_AdminShipping_024-DP.md` |
| 025-KS | `18_KuponySlevy/FunkcniTest_AdminCoupons_025-KS.md` |
| 026-GN | `22_AdminEmaily/FunkcniTest_AdminEmails_026-GN.md` |
| 027-AM | `27_Supabase/FunkcniTest_AdminMigration_027-AM.md` |
| 028-AI | `8_StripePlatby/FunkcniTest_AdminIntegrations_028-AI.md` |
| 029-MS | `14_ModelStorage/FunkcniTest_ModelStorage_029-MS.md` |
| 030-LG | `20_AuthBezpecnost/FunkcniTest_Login_030-LG.md` |
| 031-GN | `25_UcetUzivatele/FunkcniTest_Account_031-GN.md` |

---

> Vygenerovano: 2026-02-20, Sessions: S01-S03
