# 00 — MASTER Implementacni Poradi a Zavislosti

> Tento soubor definuje PORADI implementace vsech 28 sekci na zaklade zavislosti.
> Posledni aktualizace: 2026-02-18

---

## Mapa vsech RoadMap souboru

Kazdy RoadMap ma vlastni slozku pro budouci rozsireni (poznamky, sub-plany, assety).

| # | Nazev | Soubor |
|---|-------|--------|
| 1 | Kalkulacka | [1_Kalkulacka_RoadMap_Plan](./1_Kalkulacka/1_Kalkulacka_RoadMap_Plan.md) |
| 2 | PrusaSlicer Backend | [2_PrusaSlicerBackend_RoadMap_Plan](./2_PrusaSlicerBackend/2_PrusaSlicerBackend_RoadMap_Plan.md) |
| 3 | Pricing Engine V3 | [3_PricingEngineV3_RoadMap_Plan](./3_PricingEngineV3/3_PricingEngineV3_RoadMap_Plan.md) |
| 4 | Admin Materialy / Cenotvorba | [4_AdminMaterialyCenotvorba_RoadMap_Plan](./4_AdminMaterialyCenotvorba/4_AdminMaterialyCenotvorba_RoadMap_Plan.md) |
| 5 | Admin Poplatky / Fees | [5_AdminPoplatkyFees_RoadMap_Plan](./5_AdminPoplatkyFees/5_AdminPoplatkyFees_RoadMap_Plan.md) |
| 6 | Admin Presety | [6_AdminPresety_RoadMap_Plan](./6_AdminPresety/6_AdminPresety_RoadMap_Plan.md) |
| 7 | Admin Objednavky | [7_AdminObjednavky_RoadMap_Plan](./7_AdminObjednavky/7_AdminObjednavky_RoadMap_Plan.md) |
| 8 | Stripe Platby | [8_StripePlatby_RoadMap_Plan](./8_StripePlatby/8_StripePlatby_RoadMap_Plan.md) |
| 9 | Fakturace | [9_Fakturace_RoadMap_Plan](./9_Fakturace/9_Fakturace_RoadMap_Plan.md) |
| 10 | Admin Parameters | [10_AdminParameters_RoadMap_Plan](./10_AdminParameters/10_AdminParameters_RoadMap_Plan.md) |
| 11 | Widget & Embed | [11_WidgetEmbed_RoadMap_Plan](./11_WidgetEmbed/11_WidgetEmbed_RoadMap_Plan.md) |
| 12 | Widget Builder | [12_WidgetBuilder_RoadMap_Plan](./12_WidgetBuilder/12_WidgetBuilder_RoadMap_Plan.md) |
| 13 | Admin Branding | [13_AdminBranding_RoadMap_Plan](./13_AdminBranding/13_AdminBranding_RoadMap_Plan.md) |
| 14 | Model Storage | [14_ModelStorage_RoadMap_Plan](./14_ModelStorage/14_ModelStorage_RoadMap_Plan.md) |
| 15 | Admin Dashboard | [15_AdminDashboard_RoadMap_Plan](./15_AdminDashboard/15_AdminDashboard_RoadMap_Plan.md) |
| 16 | Doprava | [16_Doprava_RoadMap_Plan](./16_Doprava/16_Doprava_RoadMap_Plan.md) |
| 17 | Express Delivery | [17_ExpressDelivery_RoadMap_Plan](./17_ExpressDelivery/17_ExpressDelivery_RoadMap_Plan.md) |
| 18 | Kupony & Slevy | [18_KuponySlevy_RoadMap_Plan](./18_KuponySlevy/18_KuponySlevy_RoadMap_Plan.md) |
| 19 | i18n Lokalizace | [19_i18n_Lokalizace_RoadMap_Plan](./19_i18n_Lokalizace/19_i18n_Lokalizace_RoadMap_Plan.md) |
| 20 | Auth & Bezpecnost | [20_AuthBezpecnost_RoadMap_Plan](./20_AuthBezpecnost/20_AuthBezpecnost_RoadMap_Plan.md) |
| 21 | Admin Analytika | [21_AdminAnalytika_RoadMap_Plan](./21_AdminAnalytika/21_AdminAnalytika_RoadMap_Plan.md) |
| 22 | Admin Emaily | [22_AdminEmaily_RoadMap_Plan](./22_AdminEmaily/22_AdminEmaily_RoadMap_Plan.md) |
| 23 | Admin Team | [23_AdminTeam_RoadMap_Plan](./23_AdminTeam/23_AdminTeam_RoadMap_Plan.md) |
| 24 | Verejne Stranky | [24_VerejneStranky_RoadMap_Plan](./24_VerejneStranky/24_VerejneStranky_RoadMap_Plan.md) |
| 25 | Ucet Uzivatele | [25_UcetUzivatele_RoadMap_Plan](./25_UcetUzivatele/25_UcetUzivatele_RoadMap_Plan.md) |
| 26 | Cloud Run | [26_CloudRun_RoadMap_Plan](./26_CloudRun/26_CloudRun_RoadMap_Plan.md) |
| 27 | Supabase | [27_Supabase_RoadMap_Plan](./27_Supabase/27_Supabase_RoadMap_Plan.md) |
| 28 | Vlastni Domena | [28_VlastniDomena_RoadMap_Plan](./28_VlastniDomena/28_VlastniDomena_RoadMap_Plan.md) |

---

## Dependency Graf (zjednoduseny)

```
Vrstva 0 (ZADNE zavislosti — zaklad):
  #3  Pricing Engine V3
  #4  Admin Materialy
  #5  Admin Fees
  #6  Admin Presety
  #10 Admin Parameters
  #24 Verejne stranky
  #19 i18n (horizontalni)

Vrstva 1 (zavisi jen na Vrstve 0):
  #2  PrusaSlicer Backend
  #13 Admin Branding
  #16 Doprava (admin hotova, integrace → #1)
  #17 Express (admin hotova, integrace → #1)
  #18 Kupony (admin hotova, integrace → #1)
  #12 Widget Builder

Vrstva 2 (zavisi na Vrstve 0+1):
  #1  Kalkulacka — shipping/express/coupons integrace
  #20 Auth a bezpecnost
  #27 Supabase — zakladni propojeni
  #11 Widget & Embed

Vrstva 3 (zavisi na Vrstve 2):
  #9  Fakturace
  #7  Admin Objednavky — Supabase + processing
  #26 Cloud Run — Docker deploy
  #22 Admin Emaily — backend odesilani

Vrstva 4 (zavisi na Vrstve 3):
  #8  Stripe platby
  #14 Model Storage — cloud
  #28 Vlastni domena

Vrstva 5 (zavisi na Vrstve 4):
  #15 Admin Dashboard — realna data
  #21 Admin Analytika — tracking
  #23 Admin Team — realna auth
  #25 Ucet uzivatele — Stripe billing
```

---

## Doporucene implementacni poradi (po sprintech)

### Sprint 1: Zaklady a integrace komponent (~15-20h)
**Cil:** Zapojit existujici komponenty, opravit tenant, aktivovat auth

| # | Sekce | Klicovy ukol | Hodiny | RoadMap |
|---|-------|-------------|--------|---------|
| 20.1 | Auth — PrivateRoute | Odkomentovat v Routes.jsx | 1h | [→ detail](./20_AuthBezpecnost/20_AuthBezpecnost_RoadMap_Plan.md) |
| 1.3 | Kalkulacka — Shipping/Express/Coupons | Renderovat komponenty v UI | 4-6h | [→ detail](./1_Kalkulacka/1_Kalkulacka_RoadMap_Plan.md) |
| 1.5 | Kalkulacka — Tenant izolace | Odstranit hardcoded IDs | 2-3h | [→ detail](./1_Kalkulacka/1_Kalkulacka_RoadMap_Plan.md) |
| 13.1 | Branding — hardcoded ID | Dynamicky customerId | 1h | [→ detail](./13_AdminBranding/13_AdminBranding_RoadMap_Plan.md) |
| 3.1 | Pricing Engine — overeni | Audit express/shipping/coupon | 2-4h | [→ detail](./3_PricingEngineV3/3_PricingEngineV3_RoadMap_Plan.md) |
| 11.1 | Widget — portovat zmeny | Shipping/Express/Coupons | 3-4h | [→ detail](./11_WidgetEmbed/11_WidgetEmbed_RoadMap_Plan.md) |

### Sprint 2: Auth a Supabase (~12-18h)
**Cil:** Plna autentizace, Supabase jako datovy zdroj

| # | Sekce | Klicovy ukol | Hodiny | RoadMap |
|---|-------|-------------|--------|---------|
| 20.2 | Auth — API auth | Firebase Admin SDK, middleware | 4-6h | [→ detail](./20_AuthBezpecnost/20_AuthBezpecnost_RoadMap_Plan.md) |
| 20.3 | Auth — Tenant izolace | Dynamicky tenant z auth | 3-5h | [→ detail](./20_AuthBezpecnost/20_AuthBezpecnost_RoadMap_Plan.md) |
| 27.1 | Supabase — overeni instance | Setup, schema, test | 2-3h | [→ detail](./27_Supabase/27_Supabase_RoadMap_Plan.md) |
| 27.2 | Supabase — feature flags | Postupne prepinani | 4-6h | [→ detail](./27_Supabase/27_Supabase_RoadMap_Plan.md) |

### Sprint 3: Backend a platby (~18-27h)
**Cil:** Cloud Run deploy, Stripe, Fakturace

| # | Sekce | Klicovy ukol | Hodiny | RoadMap |
|---|-------|-------------|--------|---------|
| 26.1 | Cloud Run — Docker | Dockerfile + deploy | 6-10h | [→ detail](./26_CloudRun/26_CloudRun_RoadMap_Plan.md) |
| 26.3 | Cloud Functions — CRUD | Migrace endpointu | 6-10h | [→ detail](./26_CloudRun/26_CloudRun_RoadMap_Plan.md) |
| 9 | Fakturace | Admin UI + zobrazeni | 6-8h | [→ detail](./9_Fakturace/9_Fakturace_RoadMap_Plan.md) |

### Sprint 4: Stripe a Emaily (~18-27h)
**Cil:** Platby kartou, transakcni emaily

| # | Sekce | Klicovy ukol | Hodiny | RoadMap |
|---|-------|-------------|--------|---------|
| 8 | Stripe | Payment Intents + Elements + Webhooks | 18-27h | [→ detail](./8_StripePlatby/8_StripePlatby_RoadMap_Plan.md) |
| 22 | Emaily | Resend + sablony + trigger system | 10-15h | [→ detail](./22_AdminEmaily/22_AdminEmaily_RoadMap_Plan.md) |

### Sprint 5: Orders a Model Storage (~10-15h)
**Cil:** Plny order processing

| # | Sekce | Klicovy ukol | Hodiny | RoadMap |
|---|-------|-------------|--------|---------|
| 7 | Orders — processing | Backend pipeline, Supabase | 8-12h | [→ detail](./7_AdminObjednavky/7_AdminObjednavky_RoadMap_Plan.md) |
| 14 | Model Storage — objednavky | Automaticke ukladani | 3-5h | [→ detail](./14_ModelStorage/14_ModelStorage_RoadMap_Plan.md) |

### Sprint 6: Doladeni a launch prep (~15-25h)
**Cil:** Dashboard, domena, i18n, testovani

| # | Sekce | Klicovy ukol | Hodiny | RoadMap |
|---|-------|-------------|--------|---------|
| 15 | Dashboard — realna data | Metriky z Orders | 3-5h | [→ detail](./15_AdminDashboard/15_AdminDashboard_RoadMap_Plan.md) |
| 19 | i18n — preklady | Doplnit chybejici | 6-10h | [→ detail](./19_i18n_Lokalizace/19_i18n_Lokalizace_RoadMap_Plan.md) |
| 28 | Domena | Registrace + DNS | 3-4h | [→ detail](./28_VlastniDomena/28_VlastniDomena_RoadMap_Plan.md) |
| 1.1-1.2 | Kalkulacka — Upload/Viewer | 3MF, OBJ preview | 4-5h | [→ detail](./1_Kalkulacka/1_Kalkulacka_RoadMap_Plan.md) |

### Post-Beta (nizka priorita)

| # | Sekce | Poznamka | RoadMap |
|---|-------|---------|---------|
| 21 | Analytika — realna data | Tracking events | [→ detail](./21_AdminAnalytika/21_AdminAnalytika_RoadMap_Plan.md) |
| 23 | Team Access — realna auth | Firebase invite | [→ detail](./23_AdminTeam/23_AdminTeam_RoadMap_Plan.md) |
| 25 | Account — platebni historie | Stripe Customer Portal | [→ detail](./25_UcetUzivatele/25_UcetUzivatele_RoadMap_Plan.md) |
| 12 | Widget Builder — pokrocile | Custom CSS, templates | [→ detail](./12_WidgetBuilder/12_WidgetBuilder_RoadMap_Plan.md) |
| 20.4 | RBAC | Role-based access | [→ detail](./20_AuthBezpecnost/20_AuthBezpecnost_RoadMap_Plan.md) |
| 27.6 | Supabase Realtime | Live orders | [→ detail](./27_Supabase/27_Supabase_RoadMap_Plan.md) |

---

## Celkovy odhad prace

| Sprint | Hodiny | Kumulativne |
|--------|--------|-------------|
| Sprint 1 | 15-20h | 15-20h |
| Sprint 2 | 12-18h | 27-38h |
| Sprint 3 | 18-27h | 45-65h |
| Sprint 4 | 18-27h | 63-92h |
| Sprint 5 | 10-15h | 73-107h |
| Sprint 6 | 15-25h | 88-132h |
| **Celkem pro Beta** | **88-132h** | |

**Realisticky odhad:** ~110 hodin prace = 14 dnu plneho nasazeni (8h/den) nebo 5-6 tydnu (4h/den)

---

## Kriticka cesta (Critical Path)

Nejdelsi retezec zavislosti ktery urcuje minimalni cas:

```
Auth (#20) → Supabase (#27) → Cloud Run (#26) → Stripe (#8) → Orders (#7)
   1h    →     6h       →      16h       →     27h      →    12h
                                                          = ~62h minimum
```

**Paralelne s Critical Path:**
- Kalkulacka integrace (#1) — muze bezet paralelne s Auth
- Emaily (#22) — muze bezet paralelne se Stripe
- Fakturace (#9) — muze bezet paralelne s Cloud Run
- i18n (#19) — muze bezet kdykoli

---

## Vizualni timeline

```
Tyden 1:  [Sprint 1: Kalkulacka + Auth zaklady]
Tyden 2:  [Sprint 2: Auth plne + Supabase]
Tyden 3:  [Sprint 3: Cloud Run + Cloud Functions]
Tyden 4:  [Sprint 4a: Stripe]
Tyden 5:  [Sprint 4b: Stripe + Emaily]
Tyden 6:  [Sprint 5: Orders + Storage]
Tyden 7:  [Sprint 6: Dashboard + i18n + Domena + Testovani]
```

---

## Struktura slozek

```
Individual_RoadMaps/
  00_MASTER_Implementacni_Poradi.md    ← tento soubor
  1_Kalkulacka/
    1_Kalkulacka_RoadMap_Plan.md
  2_PrusaSlicerBackend/
    2_PrusaSlicerBackend_RoadMap_Plan.md
  3_PricingEngineV3/
    3_PricingEngineV3_RoadMap_Plan.md
  ...
  28_VlastniDomena/
    28_VlastniDomena_RoadMap_Plan.md
```

Kazda slozka muze obsahovat dalsi soubory (poznamky, diagramy, sub-plany) souvisejici s danym tematem.

---

## Funkcni Testy (2026-02-20)

**20 funkcnich testu** — viz [MASTER_FunkcniTesty_Souhrn.md](./MASTER_FunkcniTesty_Souhrn.md)

Celkove skore: **350/400 (prumer 17.5/20)**

Top: Widget (20/20), Express (20/20), Shipping (20/20), Migration (20/20)
Nejnizsi: Login (14/20), Kalkulacka (14/20) — hlavne kvuli chybejici auth a upload omezeni
