# RoadMap — ModelPricer / FORGE

> Posledni aktualizace: 2026-02-17

---

> **DULEZITE — K PROZKOUMANI:**
> Reklamace a vraceni penez — je potreba prozkoumat:
> 1. Reklamace meho produktu (kalkulacky) — jak resit vraceni penez zakaznikum (firmam) kteri si zaplati predplatne
> 2. Reklamace objednavek pres firmy — objednavka jde pres kalkulacku ale zodpovednost za kvalitu tisku, dodani atd. nese firma, ne my
> 3. Podminky sluzby (ToS) — jake pravni podminky musime mit aby z reklamaci nevznikly problemy
> Toto je nutne vyresit pred verejnym spustenim aby nevznikly pravni problemy.

---

## 1. Legenda stavu

| Indikator | Stav | Popis |
|-----------|------|-------|
| 🔴 | Neimplementovano (0%) | Funkce neexistuje, jen planovana |
| 🟠 | Zaklad (1-25%) | Existuje UI/kostra ale nefunkcni |
| 🟡 | Rozpracovano (26-60%) | Castecne funkcni, chybi klicove casti |
| 🟢 | Skoro hotovo (61-90%) | Funguje, potrebuje doladeni/opravy |
| ✅ | Hotovo pro Beta (91-100%) | Funkcni, pripraveno k testovani |

---

## 2. Hruba RoadMap

| # | Funkce | Stav | Priorita |
|---|--------|------|----------|
| 1 | Kalkulacka (end-to-end flow) | 🟡 | KRITICKA |
| 2 | PrusaSlicer Backend integrace | 🟢 | KRITICKA |
| 3 | Pricing Engine V3 | 🟢 | KRITICKA |
| 4 | Admin — Materialy a cenotvorba | 🟢 | KRITICKA |
| 5 | Admin — Poplatky (Fees) | 🟢 | KRITICKA |
| 6 | Admin — Presety | 🟢 | VYSOKA |
| 7 | Admin — Objednavky (Orders) | 🟡 | VYSOKA |
| 8 | Stripe platebni integrace | 🔴 | VYSOKA |
| 9 | Fakturace (zobrazeni platebnich udaju + VS) | 🔴 | VYSOKA |
| 10 | Admin — Parameters (PrusaSlicer) | 🟢 | VYSOKA |
| 11 | Widget & Embed system | 🟡 | VYSOKA |
| 12 | Widget Builder (zakladni verze pro Beta) | 🟡 | STREDNI |
| 13 | Admin — Branding | 🟢 | STREDNI |
| 14 | Model Storage (souborovy manazer) | 🟡 | STREDNI |
| 15 | Admin — Dashboard | 🟡 | STREDNI |
| 16 | Doprava a shipping | 🟡 | STREDNI |
| 17 | Express delivery | 🟡 | STREDNI |
| 18 | Kupony a slevy | 🟡 | STREDNI |
| 19 | i18n (CZ/EN lokalizace) | 🟡 | STREDNI |
| 20 | Auth a bezpecnost | 🟠 | VYSOKA |
| 21 | Admin — Analytika | 🟡 | NIZKA |
| 22 | Admin — Emaily/notifikace | 🟠 | STREDNI |
| 23 | Admin — Team Access | 🟡 | NIZKA |
| 24 | Verejne stranky (Home, Pricing, Support) | 🟢 | NIZKA |
| 25 | Ucet uzivatele (Account) | 🟡 | NIZKA |
| 26 | Cloud Run — PrusaSlicer backend (Docker kontejner) | 🔴 | KRITICKA |
| 27 | Supabase — plne propojeni databaze + storage | 🟠 | KRITICKA |
| 28 | Vlastni domena (modelpricer.com / .cz) | 🔴 | VYSOKA |

---

## 3. Detailni RoadMap (Tree)

### 1. 🟡 Kalkulacka (end-to-end flow)
  - 🟢 Upload modelu (STL/OBJ) — funguje drag&drop, multi-file
    - ✅ Drag & drop
    - ✅ Multi-file upload
    - 🟡 3MF podpora v dropzone — aktualne jen pres tlacitko, chybi v dropzone accept
  - 🟢 3D Model Viewer — STL funguje, OBJ nema preview
    - ✅ STL nahled s rotaci/zoomem
    - 🟡 OBJ preview — soubor se nahraje ale nema 3D nahled
    - 🟡 Surface area vypocet — funguje jen pro STL (clientModelInfo)
  - 🟢 Print konfigurace — material, barva, kvalita, infill, presety, fees
    - ✅ Material vyber z admin konfigurace
    - ✅ Barva z materialu
    - ✅ Kvalita (standard/high atd.)
    - ✅ Infill slider
    - ✅ Podpora/supports toggle
    - ✅ Preset vyber (per-model)
    - ✅ Fee selekce v UI
  - 🟢 Slicovani pres backend — funguje, retry, fallback bez presetu
    - ✅ Slice jednoho modelu
    - ✅ Slice vsech modelu (batch)
    - ✅ Reslice failed
    - ✅ Auto-recalc pri zmene konfigurace (debounced)
  - 🟢 Pricing calculator — zobrazeni cen, breakdown, volume discounts
    - ✅ Per-model cena
    - ✅ Order total
    - ✅ Fee breakdown
    - ✅ Volume discount zobrazeni
  - 🟢 Checkout form — react-hook-form + zod, uklada do localStorage + backend
    - ✅ Formular s validaci (jmeno, email, telefon, adresa)
    - ✅ Poznamky k objednavce
    - ✅ Ulozeni objednavky do localStorage
    - 🔴 Stripe platba — NEEXISTUJE
    - 🔴 Fakturacni udaje firmy — NEEXISTUJE
  - 🟡 Shipping/Express/Coupons integrace do flow
    - 🟢 Komponenty existuji (ShippingSelector, ExpressTierSelector, CouponInput)
    - 🟢 State management pripraveny v index.jsx (configs nacteny)
    - 🔴 Komponenty NEJSOU renderovany v UI — existuji ale nikde se nezobrazuji v kalkulacce
  - 🟢 Shopify rezim — alternativni checkout pres ShopifyCartButton
  - 🟡 5-step wizard stepper — funguje ale neni plne responsivni
  - 🟠 Tenant ID — hardcoded `test-customer-1` v nekterych castech

### 2. 🟢 PrusaSlicer Backend integrace
  - ✅ Express server — port 3001, Vite proxy `/api`
  - ✅ CLI spawn PrusaSlicer — spousti prusaslicer-console.exe
  - ✅ G-code parsing — extrakce casu, materialu, vrstev
  - ✅ Model info extraction — rozmery, objem
  - ✅ Health check endpoint
  - ✅ Preset management pres API — nahrani INI, vyber presetu
  - 🟢 Timeout handling — existuje, ale neni konfigurovatelny z admin
  - 🟡 Error handling — zakladni klasifikace chyb, ale nektere edge cases chybi
  - 🔴 Cloud Run migrace — presun z lokalniho serveru do Docker kontejneru v cloudu (viz #26)

### 3. 🟢 Pricing Engine V3
  - ✅ Deterministicky pipeline — base -> fees -> markup -> volume discounts -> minima -> rounding
  - ✅ Material pricing (per-gram, per-unit)
  - ✅ Time pricing (per-hour)
  - ✅ Fee system — MODEL/ORDER scope, typed conditions
  - ✅ Volume discounts — tier-based, amount/quantity triggers
  - ✅ Minimum order value
  - ✅ Rounding rules
  - ✅ Markup percentage
  - 🟢 Express surcharge — implementovano v engine, ale neni integrovan do kalkulacky UI
  - 🟢 Shipping cost — implementovano v engine, ale neni integrovan do kalkulacky UI
  - 🟢 Coupon discount — implementovano v engine, ale neni integrovan do kalkulacky UI

### 4. 🟢 Admin — Materialy a cenotvorba
  - ✅ 5 tabu (Materials, Time, Rules, Discounts, Preview)
  - ✅ CRUD materialu — pridani, editace, smazani, razeni
  - ✅ Barvy per-material — globalni nebo per-barva cena za gram
  - ✅ Skupiny materialu
  - ✅ Cena za hodinu tisku
  - ✅ Markup pravidla
  - ✅ Volume discounts konfigurace — tier-based
  - ✅ Preview sandbox — testovani cen s ruznymi parametry
  - 🟢 CS/EN lokalizace — vetsina textu prelozena, par hardcoded
  - 🟡 Monoliticky soubor (3173 radku) — funkcni ale tezko udrzovatelny

### 5. 🟢 Admin — Poplatky (Fees)
  - ✅ MODEL/ORDER scope
  - ✅ Typed conditions — material, weight, volume, surface, quantity atd.
  - ✅ Simulator — testovani fee logiky
  - ✅ Negativni slevy (fee s zapornou hodnotou)
  - ✅ Selectable/required/default flagy
  - ✅ Razeni a priorita
  - 🟢 CS/EN — vetsina prelozena

### 6. 🟢 Admin — Presety
  - ✅ Upload INI souboru z PrusaSliceru
  - ✅ CRUD presetu
  - ✅ Default preset nastaveni
  - ✅ Material linking — prirazeni presetu ke konkretnim materialum
  - ✅ Offline rezim — funguje i bez backendu (zobrazeni ulozenych)
  - 🟢 Validace INI — zakladni, nekontroluje vsechny parametry

### 7. 🟡 Admin — Objednavky (Orders)
  - 🟢 Seznam objednavek — filtry, paginace, razeni
  - 🟢 Kanban board — drag&drop mezi statusy (6 sloupcu)
  - 🟢 Order detail modal — 3 taby (Customer, Shipping, Items)
  - 🟢 Status management — zmena statusu, poznamky, audit log
  - 🟡 Data zdroj — jen localStorage, zadny backend/databaze
  - 🔴 Realny order processing — objednavky se jen ukladaji, zadne zpracovani
  - 🔴 Napojeni na platebni branu — chybi Stripe/platby
  - 🔴 Email notifikace pri zmene statusu — nepripojeno
  - 📋 **Doporuceny pristup:** DIY s `stripe` + `resend` npm balicky + existujici Supabase tabulky (viz poznamka nize u #8)
  - 🔴 Supabase databaze — presun z localStorage do tabulek `orders`/`order_items` (viz #27)

### 8. 🔴 Stripe platebni integrace
  - 🔴 Stripe SDK — neni nainstalovany
  - 🔴 Stripe Connect — firma si propoji svuj ucet
  - 🔴 Payment Intent — vytvoreni platby (doporuceno misto Checkout Sessions — plna kontrola UI, dynamicke castky)
  - 🔴 Webhook handler — potvrzeni platby (Cloud Functions nebo Supabase Edge Functions)
  - 🔴 Admin konfigurace — Stripe API klice, nastaveni
  - 🔴 Checkout integrace — platba v kalkulacce
  - 📋 **Doporuceny pristup (vysledek researche):**
    - ❌ Medusa.js, Vendure, EverShop — plne ecommerce platformy jsou OVERKILL (vlastni DB, 50+ tabulek, neni pro dynamicke ceny ze sliceru)
    - ✅ DIY: `stripe` npm (Payment Intents + webhooky) + `resend` npm (emaily) + stavajici Supabase tabulky
    - 💡 Volitelne: `stripe-sync-engine` npm — auto-sync Stripe dat do PostgreSQL
    - 💡 Alternativa: Supabase Edge Functions pro webhook handling misto Cloud Functions
    - ⏱️ Odhad: 2-3 tydny (vs 3-8 tydnu pro integraci platformy)

### 9. 🔴 Fakturace (zobrazeni platebnich udaju + VS)
  - 🔴 Zobrazeni cisla uctu firmy — firma si nastavi v admin
  - 🔴 Variabilni symbol = cislo objednavky — automaticke generovani
  - 🔴 Fakturacni udaje firmy — ICO, DIC, adresa, nazev
  - 🔴 Zobrazeni v potvrzeni objednavky — zakaznik vidi kam platit
  - 🔴 Dobirka jako platebni moznost

### 10. 🟢 Admin — Parameters (PrusaSlicer)
  - ✅ Parameter catalog — 6272 radku dat, vsechny PrusaSlicer parametry
  - ✅ Vyhledavani a filtrovani parametru
  - ✅ Kategorizace parametru
  - ✅ Zobrazeni hodnot a popisu
  - 🟢 Editace parametru — zakladni, ale nektere pokrocile typy chybi

### 11. 🟡 Widget & Embed system
  - 🟢 Widget orchestrator — 907 radku, 3-step wizard (bez checkoutu)
  - 🟢 PostMessage protokol — komunikace s parent strankou
  - 🟢 Domain whitelist — bezpecnost, omezeni na povolene domeny
  - 🟢 Theme CSS vars — customizace vzhledu pres promenne
  - 🟢 Public route `/w/:publicWidgetId` — pristupny bez loginu
  - 🟡 Builder mode — existuje ale nefunguje spolehlive
  - 🔴 Shipping/Express/Coupons v widgetu — stejny problem jako v kalkulacce, komponenty existuji ale nejsou renderovany
  - 🟡 Responsivita — zakladni, ale nektere breakpointy chybi
  - 🟢 Shopify integrace — ShopifyCartButton ve widgetu

### 12. 🟡 Widget Builder (zakladni verze pro Beta)
  - 🟢 Fullscreen WYSIWYG editor — BuilderPage.jsx
  - 🟢 10 core elementu — logo, text, barvy, layout atd.
  - 🟢 Drag&drop usporadani
  - 🟢 Undo/redo
  - 🟢 Auto-save
  - 🟢 Device preview (desktop/tablet/mobile)
  - 🟡 Quick themes — preset barevna schemata, ale omezeny vyber
  - 🟡 Stabilita — useRef fix pro BUILDER_MOCK, ale stale obcasne problemy
  - 🟡 Pro Beta staci zjednodusenou verzi: logo, text, preset barvy

### 13. 🟢 Admin — Branding
  - ✅ Logo upload a nahled
  - ✅ Business name a tagline
  - ✅ Barvy (primary, secondary, background)
  - ✅ Font vyber
  - ✅ Live preview
  - ✅ Plan gating (omezeni podle planu)
  - 🟢 Corner radius a dalsi detaily
  - 🟡 Hardcoded `test-customer-1` jako customerId

### 14. 🟡 Model Storage (souborovy manazer)
  - 🟢 Drive-like rozhrani — folder tree, file list, preview
  - 🟢 Upload souboru
  - 🟢 Download souboru a ZIP
  - 🟢 Soft delete (kos)
  - 🟢 Vyhledavani
  - 🟢 Breadcrumb navigace
  - 🟡 Backend storage service — existuje ale neni napojen na cloud
  - 🟡 Napojeni na objednavky — plan je ukladat G-code a modely po dokonceni objednavky, castecne implementovano
  - 🔴 Supabase Storage — presun souboru z lokalu do Supabase bucketu (models, documents) (viz #27)

### 15. 🟡 Admin — Dashboard
  - 🟢 KPI grid — draggable karty s metrikami
  - 🟢 Drag&drop editace rozlozeni
  - 🟢 Branding tips
  - 🟢 Metric registry — 1848 radku, komplexni system
  - 🟡 Demo/mock data — vsechna data jsou demo, nejsou realna
  - 🟡 Napojeni na realna data — zavisle na Orders, Analytics, backendu
  - 🔴 Supabase agregace — realtime metriky z Supabase tabulek (viz #27)

### 16. 🟡 Doprava a shipping
  - 🟢 Admin konfigurace — AdminShipping.jsx (670 radku), plne funkcni CRUD
  - 🟢 Metody dopravy — nazev, cena, popis, razeni, active/inactive
  - 🟢 Free shipping threshold — konfigurovatelny prah
  - 🟢 ShippingSelector komponenta — existuje, progress bar k free shipping
  - 🔴 Integrace do kalkulacky UI — komponenta NENI renderovana v test-kalkulacka flow
  - 🔴 Realni dopravci (Zasilkovna, PPL, DPD atd.) — jen manualni metody
  - 🔴 Vyzvednutí na prodejne — neni implementovano

### 17. 🟡 Express delivery
  - 🟢 Admin konfigurace — AdminExpress.jsx (663 radku), plne funkcni CRUD
  - 🟢 Express tiers — nazev, surcharge (% nebo fixni), razeni
  - 🟢 ExpressTierSelector komponenta — existuje, funkcni UI
  - 🔴 Integrace do kalkulacky UI — komponenta NENI renderovana v test-kalkulacka flow
  - 🟡 Pricing engine — express surcharge vypocet existuje ale neni propojen s UI

### 18. 🟡 Kupony a slevy
  - 🟢 Admin konfigurace — AdminCoupons.jsx (989 radku), plne funkcni CRUD
  - 🟢 Typy kuponu — procento, fixni castka, free shipping
  - 🟢 CouponInput komponenta — existuje, validace, zobrazeni aplikovaneho kuponu
  - 🔴 Integrace do kalkulacky UI — komponenta NENI renderovana v test-kalkulacka flow
  - 🔴 Validace kuponu na backendu — jen klientska validace
  - 🔴 Predplacene karty / darkove poukazky — neimplementovano

### 19. 🟡 i18n (CZ/EN lokalizace)
  - 🟢 LanguageContext — 1130 radku, 462 klicu CS/EN
  - 🟢 Prepinani jazyku v UI
  - 🟢 Vetsina admin stranek — prelozeno
  - 🟡 Hodne hardcoded textu — hlavne v kalkulacce a novejsich komponentach
  - 🟡 Inline slovnik — vsechno v jednom souboru, tezko udrzovatelne
  - 🔴 Dalsi jazyky (DE, SK atd.) — jen CZ/EN

### 20. 🟠 Auth a bezpecnost
  - 🟢 Firebase Auth — existuje, login/register stranky
  - 🟢 AuthContext + useAuth hook
  - 🟢 PrivateRoute komponenta — existuje
  - 🔴 PrivateRoute je ZAKOMENTOVANY — admin je verejne pristupny
  - 🔴 API autentizace — backend nema zadnou auth, vsechny endpointy verejne
  - 🔴 Tenant izolace — hardcoded tenant ID na nekterych mistech
  - 🔴 RBAC (Role-Based Access Control) — neexistuje
  - 🟠 CORS a security headers — zakladni
  - 🔴 Supabase RLS — zprisneni Row Level Security na JWT auth z Firebase (viz #27)

### 21. 🟡 Admin — Analytika
  - 🟢 5 tabu — overview, sessions, materials, conversions, export
  - 🟢 CSV export
  - 🟢 Rozsahle filtrovani podle data
  - 🟡 Demo seed data — vsechna data jsou demo, nerealna
  - 🟡 Sber realnych dat — chybi tracking events
  - 🟡 Napojeni na realna data — zavisle na backendu
  - 🔴 Supabase tracking — ukladani analytickych eventu do Supabase (viz #27)

### 22. 🟠 Admin — Emaily/notifikace
  - 🟢 Admin UI — 3 taby (Templates, Provider, Log)
  - 🟢 Event triggers — order_confirmed, printing, shipped, completed
  - 🟢 Provider konfigurace — SMTP, Resend, SendGrid options
  - 🔴 Backend email system — NEPRIPOJEN, zadne realne SMTP
  - 🔴 Realne odesilani emailu — nefunguje
  - 🔴 Email sablony — jen zakladni subject line, zadny HTML template

### 23. 🟡 Admin — Team Access
  - 🟢 3 taby — Users, Roles, Audit
  - 🟢 UI pro spravu clenu tymu
  - 🟢 Role system — admin, editor, viewer
  - 🟢 Invite workflow — generovani invite linku
  - 🟡 Demo localStorage — NENI napojeno na realny auth
  - 🔴 Realne opravneni — zadna skutecna autorizace

### 24. 🟢 Verejne stranky (Home, Pricing, Support)
  - ✅ Home — Forge design, hero sekce, features, CTA
  - ✅ Pricing — 3 plany (Starter/Professional/Enterprise), CZ/EN
  - ✅ Support — kontaktni formular, FAQ
  - ✅ Login/Register — Firebase Auth integrace
  - ✅ Header/Footer — Forge dark theme
  - 🟢 SEO — zakladni meta tagy, ale chybi Open Graph a dalsi
  - 🟢 Responsivita — vetsinou ok, par drobnych problemu

### 25. 🟡 Ucet uzivatele (Account)
  - 🟢 Account stranka — existuje, zakladni layout
  - 🟡 Profil editace — zakladni
  - 🔴 Platebni historie — neexistuje (zavisle na Stripe)
  - 🔴 Sprava predplatneho — neexistuje
  - 🔴 Napojeni na auth — PrivateRoute zakomentovany

### 26. 🔴 Cloud Run — PrusaSlicer backend
  - 🔴 Docker image s PrusaSlicer — Dockerfile, build, push do Artifact Registry
  - 🔴 Cloud Run deploy — 4 CPU, 2 GB RAM, region europe-west1
  - 🔴 Firebase Hosting proxy — `/api/slice/**` → Cloud Run
  - 🔴 Cloud Functions pro CRUD — `/api/**` → Cloud Functions (0.17 CPU, 256 MB, levne)
  - 🔴 Supabase Service Role Key jako env variable v Cloud Run
  - 🔴 CORS a rate limiting
  - 🟢 Lokalni Express server — uz existuje (backend-local/, port 3001), slouzi jako zaklad

### 27. 🟠 Supabase — plne propojeni databaze + storage
  - 🟢 Schema (25 tabulek) — uz definovane v `supabase/schema.sql`
  - 🟢 StorageAdapter — `src/lib/supabase/storageAdapter.js` existuje
  - 🟢 Feature flags — per-namespace prepinani localStorage/supabase/dual-write
  - 🟢 Migracni runner — 19 migraci v `migrationRunner.js`
  - 🟢 Async hooks — useStorageQuery, useStorageMutation existuji
  - 🟠 Frontend Supabase klient — existuje ale default mode = localStorage
  - 🔴 Backend Supabase klient — Cloud Run/Functions potrebuji Service Role Key
  - 🔴 Prepnuti na Supabase jako primarni zdroj dat (ne jen localStorage)
  - 🔴 RLS zprisneni na JWT autentizaci
  - 🔴 Supabase Storage pro modely a G-code — buckety existuji, chybi realni upload flow z backendu
  - 🔴 Realtime — useSupabaseRealtime hook existuje ale neni aktivne pouzivan

### 28. 🔴 Vlastni domena (modelpricer.com / .cz)
  - 🔴 Registrace domeny — modelpricer.com a modelpricer.cz
  - 🔴 DNS konfigurace — propojeni s Firebase Hosting (A/CNAME zaznamy)
  - 🔴 SSL certifikat — automaticky pres Firebase Hosting
  - 🔴 CORS update — pridat novou domenu na backend
  - 🔴 Presmerovani .cz → .com (nebo naopak)

---

## 4. Rozsahla detailni RoadMap

---

### 1. 🟡 Kalkulacka (end-to-end flow) (50%)

#### 1.1 🟢 Upload modelu (75%)
**Co to dela:** Umoznuje zakaznikovi nahrat 3D modely (STL, OBJ, 3MF) pres drag&drop nebo vyber souboru.
**Aktualni stav:** Drag&drop a multi-file upload funguje pro STL a OBJ. 3MF se da nahrat pres tlacitko ale neni v dropzone accept listu.
**Jak se ma chovat:** Zakaznik pretahne nebo vybere libovolny 3D soubor (STL, OBJ, 3MF), okamzite se zobrazi v seznamu s nahledem. Podporovane formaty jasne oznaceny.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Pridat 3MF do dropzone accept filtru
- Zobrazit podporovane formaty v upload zone
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 1.2 🟢 3D Model Viewer (70%)
**Co to dela:** Zobrazuje interaktivni 3D nahled nahraneho modelu s rotaci, zoomem a surface area vypoctem.
**Aktualni stav:** STL funguje plne, OBJ se nahraje ale nema 3D preview. Surface area se pocita jen pro STL.
**Jak se ma chovat:** Kazdy nahrany model ma 3D nahled s rotaci a zoomem. Surface area se pocita pro vsechny formaty.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- OBJ preview — minimalne zakladni wireframe nebo fallback ikona
- 3MF preview
**Odhadovana prace:** Stredni
**Zavislosti:** Zadne

#### 1.3 ✅ Print konfigurace (90%)
**Co to dela:** Zakaznik vybira material, barvu, kvalitu, infill, supports a preset pro kazdy model.
**Aktualni stav:** Vsechny volby fungujou, nacitaji se z admin konfigurace, per-model presety fungujou.
**Jak se ma chovat:** Zakaznik ma prehledny vyber vsech parametru tisku, zmena parametru automaticky prepocita cenu.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:**
- Drobne UI vylepseni (tooltips u parametru)
**Odhadovana prace:** Mala
**Zavislosti:** Admin Pricing, Admin Presets

#### 1.4 ✅ Slicovani pres backend (92%)
**Co to dela:** Odesle model na backend kde PrusaSlicer vypocita cas tisku, hmotnost materialu a dalsi metriky.
**Aktualni stav:** Funguje — single slice, batch slice, reslice failed, auto-recalc s debounce, fallback bez presetu.
**Jak se ma chovat:** Po zmene parametru se model automaticky preslicuje a zobrazi aktualni data.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:**
- Nic kritického
**Odhadovana prace:** Mala
**Zavislosti:** PrusaSlicer Backend

#### 1.5 🟢 Pricing calculator zobrazeni (80%)
**Co to dela:** Zobrazuje rozpad ceny — per-model cena, fees, volume discount, order total.
**Aktualni stav:** Funguje pro zakladni flow. Zobrazi per-model i celkovou cenu s fee breakdownem.
**Jak se ma chovat:** Kompletni rozpad ceny vcetne dopravy, expressu a kuponu. Jasny souhrn co zakaznik plati.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Integrace shipping/express/coupon do souhrnu
- Lepsi vizualni odliseni slev a poplatku
**Odhadovana prace:** Stredni
**Zavislosti:** Shipping, Express, Coupons integrace

#### 1.6 🟢 Checkout form (65%)
**Co to dela:** Formular pro zadani kontaktnich udaju a dokonceni objednavky.
**Aktualni stav:** react-hook-form + zod validace, uklada do localStorage a backend. Jmeno, email, telefon, adresa, poznamky.
**Jak se ma chovat:** Kompletni checkout vcetne vyberu dopravy, platebni metody (Stripe / dobirka / prevod), fakturacnich udaju. Po odeslani email potvrzeni.
**Faze:** Skoro hotovo (formular), ale kriticke casti chybi
**Co chybi pro Beta:**
- Vyber dopravy v checkoutu
- Vyber platebni metody (Stripe, prevod, dobirka)
- Zobrazeni fakturacnich udaju firmy (cislo uctu, VS)
- Email potvrzeni po objednani
**Odhadovana prace:** Velka
**Zavislosti:** Stripe, Fakturace, Emaily, Shipping

#### 1.7 🔴 Shipping/Express/Coupons integrace do kalkulacky (10%)
**Co to dela:** Zakaznik vybira dopravu, express tier a zadava kupon primo v kalkulacce.
**Aktualni stav:** Komponenty (ShippingSelector, ExpressTierSelector, CouponInput) EXISTUJI a jsou hotove. State management je pripraveny v index.jsx (configs se nacitaji ze storage). ALE komponenty NEJSOU renderovany nikde v JSX — chybi `<ShippingSelector .../>` atd. v renderovaci casti.
**Jak se ma chovat:** V kroku 3 (kontrola a cena) zakaznik vidi vyber dopravy, moznost express delivery a pole pro kupon. Cena se dynamicky prepocita.
**Faze:** Zaklad (komponenty hotove, ale neintegrujou se do flow)
**Co chybi pro Beta:**
- Renderovat ShippingSelector, ExpressTierSelector, CouponInput v kalkulacce
- Propojit vybranou dopravu/express/kupon s pricing calculatorem
- Zobrazit tyto polozky v souhrnu ceny
**Odhadovana prace:** Stredni
**Zavislosti:** Pricing Engine (uz podporuje), Admin konfigurace (uz funguje)

#### 1.8 🟠 Tenant izolace v kalkulacce (15%)
**Co to dela:** Kalkulacka funguje pro konkretniho tenanta (firmu) — nacita jeho konfigurace.
**Aktualni stav:** Pouziva `getTenantId()` ale na nekterych mistech je hardcoded `test-customer-1`.
**Jak se ma chovat:** Kalkulacka automaticky nacita konfiguraci spravneho tenanta podle URL/session.
**Faze:** Zaklad
**Co chybi pro Beta:**
- Odstranit hardcoded tenant IDs
- Dynamicky tenant z auth/URL
**Odhadovana prace:** Stredni
**Zavislosti:** Auth

---

### 2. 🟢 PrusaSlicer Backend integrace (85%)

#### 2.1 ✅ Express server (95%)
**Co to dela:** Node.js Express server ktery prijima 3D modely a spousti PrusaSlicer.
**Aktualni stav:** Port 3001, Vite proxy `/api`, health check, stabilni.
**Jak se ma chovat:** Spolehlivy backend pro zpracovani 3D modelu.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 2.2 ✅ CLI spawn a G-code parsing (92%)
**Co to dela:** Spousti prusaslicer-console.exe s parametry a parsuje vysledny G-code pro extrakci metrik.
**Aktualni stav:** Funguje — extrakce casu, materialu, vrstev, rozmeru, objemu.
**Jak se ma chovat:** Spolehlivy parsing vsech relevantnich dat z G-codu.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 2.3 🟢 Preset management (80%)
**Co to dela:** Sprava INI souboru pro PrusaSlicer — nahrani, ulozeni, vyber pri slicovani.
**Aktualni stav:** Upload INI, CRUD, default preset, vyber presetu pri slicovani.
**Jak se ma chovat:** Spolehlivy system presetu s validaci a fallback logikou.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Pokrocilejsi validace INI souboru
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 2.4 🟡 Error handling a timeout (55%)
**Co to dela:** Zpracovava chyby slicovani a nastavuje timeouty pro dlouhe operace.
**Aktualni stav:** Zakladni klasifikace chyb pres slicerErrorClassifier, timeout existuje.
**Jak se ma chovat:** Uzivatelsky pritele chybove zpravy, konfigurovatelny timeout z admin, retry logika.
**Faze:** Rozpracovano
**Co chybi pro Beta:**
- Konfigurovatelny timeout z admin panelu
- Lepsi chybove zpravy pro specificke situace (model prilis velky, nevalidni geometrie atd.)
**Odhadovana prace:** Stredni
**Zavislosti:** Zadne

---

### 3. 🟢 Pricing Engine V3 (88%)

#### 3.1 ✅ Core pipeline (95%)
**Co to dela:** Deterministicky vypocet ceny: base -> fees -> markup -> volume discounts -> minima -> rounding.
**Aktualni stav:** 1205 radku, plne funkcni, testovany pres admin preview sandbox.
**Jak se ma chovat:** Presny a predikovatelny vypocet ceny podle vsech nakonfigurovanych pravidel.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 3.2 ✅ Material a Time pricing (95%)
**Co to dela:** Vypocet ceny na zaklade hmotnosti materialu (cena/gram) a casu tisku (cena/hodina).
**Aktualni stav:** Plne funkcni, podporuje per-barva ceny, skupiny materialu.
**Jak se ma chovat:** Presna cena podle skutecnych dat ze sliceru.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 3.3 ✅ Fee system (90%)
**Co to dela:** Aplikace poplatku podle podminek (material, hmotnost, objem, povrch atd.)
**Aktualni stav:** MODEL/ORDER scope, typed conditions, selectable/required flagy.
**Jak se ma chovat:** Flexibilni system poplatku ktery pokryje vsechny aspekty 3D tisku.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 3.4 🟢 Express/Shipping/Coupon v engine (75%)
**Co to dela:** Vypocet express prirazky, ceny dopravy a aplikace kuponu v pricing pipeline.
**Aktualni stav:** Implementovano v engine kodu ale neni plne propojeno s UI kalkulacky.
**Jak se ma chovat:** Engine prijima express tier, shipping metodu a kupon a spravne je zapocita do celkove ceny.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Overit ze engine spravne zpracovava vsechny kombinace
- Integracni testy s UI
**Odhadovana prace:** Mala
**Zavislosti:** Kalkulacka integrace (1.7)

---

### 4. 🟢 Admin — Materialy a cenotvorba (85%)

#### 4.1 ✅ CRUD materialu (92%)
**Co to dela:** Pridavani, editace a mazani materialu s barvami a cenami.
**Aktualni stav:** Plne funkcni — nazev, typ, cena za gram (globalni nebo per-barva), skupiny.
**Jak se ma chovat:** Jednoducha a prehledna sprava materialu.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 4.2 ✅ Time pricing (90%)
**Co to dela:** Nastaveni ceny za hodinu tisku.
**Aktualni stav:** Funkcni, prehledne UI.
**Jak se ma chovat:** Firma nastavi kolik stoji hodina tisku, pouzije se pri vypoctu.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 4.3 ✅ Volume discounts (88%)
**Co to dela:** Konfigurace mnozstevnich slev — tiers podle poctu kusu nebo celkove castky.
**Aktualni stav:** Tier-based system, konfigurovatelne prahy a procenta.
**Jak se ma chovat:** Firma nastavi prahy (napr. 5ks = 3%, 10ks = 6%) a engine je automaticky aplikuje.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 4.4 ✅ Preview sandbox (85%)
**Co to dela:** Testovaci prostredi kde firma muze simulovat vypocet ceny s ruznymi parametry.
**Aktualni stav:** Funkcni, umoznuje zadat testovaci data a videt vyslednou cenu.
**Jak se ma chovat:** Jednoduchy zpusob jak si firma overi ze ma ceny spravne nastavene.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Pricing Engine

---

### 5. 🟢 Admin — Poplatky (Fees) (87%)

#### 5.1 ✅ Fee CRUD a conditions (90%)
**Co to dela:** Sprava poplatku s podminkami — kdy se poplatek uplatni.
**Aktualni stav:** MODEL/ORDER scope, typed conditions (material, weight, volume, surface, quantity). CRUD plne funkcni.
**Jak se ma chovat:** Firma si nastavi poplatky pro specificke situace (napr. ABS material > 20g = +15 Kc na brousseni).
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 5.2 ✅ Simulator (85%)
**Co to dela:** Testovani fee logiky s ruznymi vstupy.
**Aktualni stav:** Funkcni, umoznuje simulovat ruze kombinace.
**Jak se ma chovat:** Firma si overi ze poplatky fungujou podle ocekavani.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

---

### 6. 🟢 Admin — Presety (82%)

#### 6.1 ✅ INI upload a sprava (88%)
**Co to dela:** Nahrani .INI souboru z PrusaSliceru a jejich sprava.
**Aktualni stav:** Upload, CRUD, default preset, material linking.
**Jak se ma chovat:** Firma nahraje sve INI presety, priradi je k materialum, nastavi default.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 6.2 🟢 Material linking (75%)
**Co to dela:** Prirazeni presetu ke konkretnim materialum (napr. jiny preset pro ABS nez PLA).
**Aktualni stav:** Zakladni linking funguje.
**Jak se ma chovat:** Automaticky se pouzije spravny preset podle vybraneho materialu.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Validace ze linked material existuje
- Lepsi UI pro prirazovani
**Odhadovana prace:** Mala
**Zavislosti:** Admin Pricing (materialy)

---

### 7. 🟡 Admin — Objednavky (Orders) (45%)

#### 7.1 🟢 Seznam a filtry (80%)
**Co to dela:** Zobrazeni vsech objednavek s filtry, paginaci a razenim.
**Aktualni stav:** Funkcni UI — filtry podle statusu, data, vyhledavani. Paginace.
**Jak se ma chovat:** Prehledny seznam vsech objednavek s rychlym filtrem.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Napojeni na realna data (ne jen localStorage)
**Odhadovana prace:** Stredni
**Zavislosti:** Backend/databaze

#### 7.2 🟢 Kanban board (75%)
**Co to dela:** Drag&drop board pro vizualni spravu statusu objednavek.
**Aktualni stav:** 6 sloupcu, drag&drop mezi statusy, persist do localStorage.
**Jak se ma chovat:** Firma pretahuje objednavky mezi statusy (nova, v tisku, odeslana atd.)
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Napojeni na realna data
**Odhadovana prace:** Stredni
**Zavislosti:** Backend/databaze

#### 7.3 🟢 Order detail modal (70%)
**Co to dela:** Detailni zobrazeni objednavky — zakaznik, doprava, polozky.
**Aktualni stav:** 3 taby, zobrazeni vsech informaci, zmena statusu, poznamky.
**Jak se ma chovat:** Kompletni prehled objednavky vcetne stahovani modelu, G-code a historii zmen.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Stazeni modelu/G-code z objednavky
- Napojeni na realna data
**Odhadovana prace:** Stredni
**Zavislosti:** Model Storage, Backend

#### 7.4 🔴 Realny order processing (0%)
**Co to dela:** Zpracovani objednavky — platba, email potvrzeni, zmena stavu.
**Aktualni stav:** Neexistuje. Objednavky se jen ukladaji do localStorage.
**Jak se ma chovat:** Po odeslani objednavky: zpracovani platby -> email potvrzeni -> objednavka se objevi v admin -> firma zpracuje -> zakaznik dostava notifikace.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Stripe integrace pro platby
- Email notifikace pri zmene statusu
- Backend processing pipeline
**Odhadovana prace:** Velka
**Zavislosti:** Stripe, Emaily, Backend

> **📋 Doporuceny pristup (vysledek researche):**
> Plne ecommerce platformy (Medusa.js, Vendure, EverShop) byly analyzovany a **ZAMITNUTY** — jsou overkill pro nas use-case.
> Duvod: dynamicke ceny z PrusaSliceru (cas tisku, hmotnost, objem) se neda namapovat na standardni produktovy katalog (SKU/varianty).
> Medusa.js (31K+ hvezd) ma vlastni DB schema (50+ tabulek) a moduly se nedaji pouzit standalone.
> Vendure ma `OrderItemPriceCalculationStrategy` pro runtime pricing, ale vyzaduje cely NestJS+GraphQL stack.
>
> **Doporucena varianta:** DIY order processing pipeline:
> 1. `stripe` npm balicek — Payment Intents (plna kontrola UI, dynamicke castky v CZK/EUR)
> 2. `resend` npm balicek — transakcni emaily (potvrzeni objednavky, zmena statusu)
> 3. Stavajici Supabase tabulky `orders` + `order_items` — zadna nova databaze
> 4. Cloud Functions NEBO Supabase Edge Functions pro Stripe webhook handler
> 5. Volitelne: `stripe-sync-engine` npm — auto-sync Stripe udalosti do PostgreSQL
>
> **Odhad prace:** 2-3 tydny (vs 3-8 tydnu pro integraci plne platformy)
> **Zavislosti:** 2-3 npm balicky (`stripe`, `resend`, volitelne `stripe-sync-engine`)

---

### 8. 🔴 Stripe platebni integrace (0%)

> **📋 Technologicke rozhodnuti (vysledek researche):**
> Pouzijeme **Payment Intents** (NE Checkout Sessions) — duvod: plna kontrola nad UI, dynamicke castky z pricing enginu, podpora CZK.
> Stripe Checkout Sessions jsou pro standardni produkty s fixni cenou — nase ceny se pocitaji za behu ze slicer dat.
> Webhook handler bude bezet na **Cloud Functions** (jednoduchy Express endpoint) nebo **Supabase Edge Functions** (Deno, bez extra serveru).
> Volitelne: `stripe-sync-engine` npm pro automaticky sync Stripe dat do nasi PostgreSQL databaze.

#### 8.1 🔴 Stripe Connect (0%)
**Co to dela:** Firma si propoji svuj Stripe ucet aby mohla prijimat platby.
**Aktualni stav:** Neexistuje.
**Jak se ma chovat:** V admin sekci firma zada Stripe API klice nebo se propoji pres OAuth. Po propojeni muze prijimat platby pres kalkulacku.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Admin UI pro Stripe konfiguraci
- Stripe Connect integrace (nebo jednoducha API key konfigurace)
- Testovaci rezim
**Odhadovana prace:** Velka
**Zavislosti:** Auth (firma musi byt prihlasena)

#### 8.2 🔴 Payment Intent a checkout (0%)
**Co to dela:** Vytvoreni platby a zpracovani v kalkulacce.
**Aktualni stav:** Neexistuje.
**Jak se ma chovat:** Zakaznik v checkoutu zvoli platbu kartou, zobrazi se Stripe platebni formular (Stripe Elements), po zaplaceni se objednavka potvrdi.
**Faze:** Neimplementovano
**Technicky pristup:**
- **Payment Intents** (NE Checkout Sessions) — dynamicke castky z pricing enginu
- Backend endpoint: `POST /api/create-payment-intent` → vrati `client_secret`
- Frontend: Stripe Elements s `client_secret` pro zobrazeni platebniho formulare
- Podpora CZK (castka v halerech, napr. 52500 = 525 Kc)
**Co chybi pro Beta:**
- `stripe` npm balicek na backendu (Cloud Functions)
- Stripe Elements / `@stripe/react-stripe-js` na frontendu
- Backend endpoint pro vytvoreni Payment Intent s metadata (order_id, model_count)
- Zpracovani uspesne/neuspesne platby
**Odhadovana prace:** Velka
**Zavislosti:** Stripe Connect (8.1), Backend (Cloud Functions)

#### 8.3 🔴 Webhook handler (0%)
**Co to dela:** Prijima notifikace od Stripe o stavu platby.
**Aktualni stav:** Neexistuje.
**Jak se ma chovat:** Po uspesne platbe Stripe posle webhook -> backend aktualizuje status objednavky v Supabase -> odesle email pres Resend.
**Faze:** Neimplementovano
**Technicky pristup:**
- Varianta A: Cloud Functions Express endpoint (`express.raw()` + `stripe.webhooks.constructEvent()`)
- Varianta B: Supabase Edge Function (Deno, `stripe.webhooks.constructEventAsync()`)
- Udalosti ke zpracovani: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- Po uspesne platbe: update `orders.status` v Supabase + email pres `resend`
**Co chybi pro Beta:**
- Webhook endpoint (Cloud Functions nebo Supabase Edge Functions)
- Zpracovani udalosti (payment_intent.succeeded, refund atd.)
- Zabezpeceni webhook signature (`STRIPE_WEBHOOK_SECRET`)
- Napojeni na Resend pro email notifikace
**Odhadovana prace:** Stredni
**Zavislosti:** Backend, Stripe Connect, Resend (emaily)

---

### 9. 🔴 Fakturace (0%)

#### 9.1 🔴 Fakturacni udaje firmy v admin (0%)
**Co to dela:** Firma si nastavi sve fakturacni udaje — cislo uctu, ICO, DIC, adresa.
**Aktualni stav:** Neexistuje.
**Jak se ma chovat:** V admin sekci firma vyplni sve fakturacni udaje ktere se zobrazi zakaznikovi pri bankovnim prevodu.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Admin stranka/sekce pro fakturacni udaje
- Ulozeni do tenant storage
**Odhadovana prace:** Stredni
**Zavislosti:** Zadne

#### 9.2 🔴 Zobrazeni v potvrzeni objednavky (0%)
**Co to dela:** Zakaznik po objednani vidi kam a jak platit (cislo uctu, VS = cislo objednavky).
**Aktualni stav:** Neexistuje.
**Jak se ma chovat:** Po dokonceni objednavky se zobrazi: cislo uctu firmy, variabilni symbol (= cislo objednavky), castka k uhrade. Firma si sama vystavi fakturu.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Generovani variabilniho symbolu
- Zobrazeni platebnich udaju v OrderConfirmation
- Odeslani emailem
**Odhadovana prace:** Stredni
**Zavislosti:** Fakturacni udaje firmy (9.1), Emaily

#### 9.3 🔴 Dobirka jako platebni moznost (0%)
**Co to dela:** Zakaznik zvoli platbu az pri prevzeti zasilky.
**Aktualni stav:** Neexistuje.
**Jak se ma chovat:** V checkoutu moznost "dobirka" — objednavka se vytvori bez platby, firma odesle s dobirkou.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Platebni metoda "dobirka" v checkoutu
- Priplatek za dobirku (konfigurovatelny v admin)
**Odhadovana prace:** Stredni
**Zavislosti:** Shipping, Checkout

---

### 10. 🟢 Admin — Parameters (PrusaSlicer) (82%)

#### 10.1 ✅ Parameter catalog (90%)
**Co to dela:** Zobrazeni vsech PrusaSlicer parametru s popisy a hodnotami.
**Aktualni stav:** 6272 radku dat, plne prohlizitelny katalog.
**Jak se ma chovat:** Referencni prehled vsech parametru pro firmu.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 10.2 🟢 Editace a filtrovani (75%)
**Co to dela:** Vyhledavani, filtrovani a editace parametru.
**Aktualni stav:** Vyhledavani a kategorizace funguje. Editace zakladni.
**Jak se ma chovat:** Rychle najiti a upravit libovolny parametr.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Pokrocile typy parametru (dropdown, range atd.)
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

---

### 11. 🟡 Widget & Embed system (50%)

#### 11.1 🟢 Widget orchestrator (75%)
**Co to dela:** 3-step wizard pro embed — upload, konfigurace, cena (bez checkoutu).
**Aktualni stav:** 907 radku, 17 komponent. Funkcni zakladni flow.
**Jak se ma chovat:** Zakaznik na e-shopu firmy pouzije widget pro naceneni modelu.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Integrace shipping/express/coupons (stejny problem jako v kalkulacce)
**Odhadovana prace:** Stredni
**Zavislosti:** Kalkulacka (1.7)

#### 11.2 🟢 PostMessage protokol (80%)
**Co to dela:** Komunikace mezi widgetem v iframe a parent strankou.
**Aktualni stav:** Definovane zpravy, origin validace, Shopify handlery.
**Jak se ma chovat:** Bezpecna obousmerna komunikace — widget posila cenu/stav, parent muze ovladat widget.
**Faze:** Skoro hotovo
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 11.3 🟢 Domain whitelist (80%)
**Co to dela:** Omezuje ze widget funguje jen na povolenych domenach.
**Aktualni stav:** Funkcni, konfigurovatelne v admin.
**Jak se ma chovat:** Widget se zobrazi jen na domenach ktere firma povolila.
**Faze:** Skoro hotovo
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 11.4 🟢 Embed script (70%)
**Co to dela:** JavaScript snippet ktery firma vlozi na svuj web pro zobrazeni widgetu.
**Aktualni stav:** `public/widget.js` existuje, postMessage handlery.
**Jak se ma chovat:** Firma zkopiruje snippet, vlozi na web, widget se automaticky zobrazi.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Dokumentace pro firmu (jak vlozit snippet)
- Testovani na ruznych webech
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

---

### 12. 🟡 Widget Builder (zakladni verze pro Beta) (45%)

#### 12.1 🟢 WYSIWYG editor (70%)
**Co to dela:** Vizualni editor pro customizaci widgetu.
**Aktualni stav:** Fullscreen editor, 10 core elementu, drag&drop, undo/redo, auto-save, device preview.
**Jak se ma chovat pro Beta:** Jednoducha verze — firma nastavi logo, texty a preset barvy.
**Faze:** Skoro hotovo (pro pokrocilou verzi), ale pro Beta staci mene
**Co chybi pro Beta:**
- Zjednodusene rozhrani (skryt pokrocile moznosti)
- Oprava stability (useMemo/useRef problemy)
**Odhadovana prace:** Stredni
**Zavislosti:** Zadne

#### 12.2 🟡 Quick themes (40%)
**Co to dela:** Preset barevna schemata pro rychle nastaveni vzhledu.
**Aktualni stav:** Existuje ale omezeny vyber.
**Jak se ma chovat:** 5-10 predpripravenych barevnych schemat (svetle, tmave, modre atd.)
**Faze:** Rozpracovano
**Co chybi pro Beta:**
- Vice preset schemat
- Napojeni na branding barvy firmy
**Odhadovana prace:** Mala
**Zavislosti:** Admin Branding

---

### 13. 🟢 Admin — Branding (80%)

#### 13.1 ✅ Zakladni branding (88%)
**Co to dela:** Firma nastavi logo, nazev, barvy, font.
**Aktualni stav:** Plne funkcni — upload loga, barvy, font, live preview, plan gating.
**Jak se ma chovat:** Firma si prizpusobi vzhled kalkulacky/widgetu svemu brandu.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:**
- Odstranit hardcoded customerId
**Odhadovana prace:** Mala
**Zavislosti:** Auth

#### 13.2 🟢 Live preview (75%)
**Co to dela:** Okamzity nahled zmen brandingu.
**Aktualni stav:** Funguje zakladni preview.
**Jak se ma chovat:** Real-time nahled jak bude kalkulacka/widget vypadat s novym brandingem.
**Faze:** Skoro hotovo
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

---

### 14. 🟡 Model Storage (souborovy manazer) (55%)

#### 14.1 🟢 Drive-like rozhrani (75%)
**Co to dela:** Spravu souboru — slozky, nahrani, stazeni, mazani, hledani.
**Aktualni stav:** Folder tree, file list, preview, upload, download, ZIP, soft delete, vyhledavani, breadcrumbs.
**Jak se ma chovat:** Firma ma prehled o vsech souborech — modely, G-code, dokumenty k objednavkam.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Napojeni na cloud storage (ne jen lokal)
**Odhadovana prace:** Stredni
**Zavislosti:** Backend/cloud

#### 14.2 🟡 Napojeni na objednavky (35%)
**Co to dela:** Po dokonceni objednavky se modely a G-code automaticky ulozi do storage.
**Aktualni stav:** Castecne implementovano — `saveOrderFiles` existuje v `storageApi`.
**Jak se ma chovat:** Po potvrzeni objednavky se automaticky vytvori slozka s cislem objednavky a ulozi se tam vsechny soubory.
**Faze:** Rozpracovano
**Co chybi pro Beta:**
- Automaticke ukladani po dokonceni objednavky
- Propojeni s Order detail modalem (stahnout soubory)
**Odhadovana prace:** Stredni
**Zavislosti:** Orders, Backend

---

### 15. 🟡 Admin — Dashboard (40%)

#### 15.1 🟢 KPI grid (70%)
**Co to dela:** Zobrazeni klicovych metrik — pocet objednavek, trzby, konverze atd.
**Aktualni stav:** Draggable karty, metric registry, konfigurovatelne.
**Jak se ma chovat:** Realny prehled o stavu firmy na jednom miste.
**Faze:** Skoro hotovo (UI), ale data jsou demo
**Co chybi pro Beta:**
- Napojeni na realna data z Orders a Analytics
**Odhadovana prace:** Stredni
**Zavislosti:** Orders, Analytics, Backend

#### 15.2 🟡 Realna data (15%)
**Co to dela:** Dashboard zobrazuje skutecna data misto demo hodnot.
**Aktualni stav:** Vsechna data jsou mock/demo.
**Jak se ma chovat:** Realtime metriky z objednavek, analytiky a systemu.
**Faze:** Zaklad
**Co chybi pro Beta:**
- Agregace dat z Orders storage
- Zakladni metriky (pocet objednavek dnes, celkove trzby atd.)
**Odhadovana prace:** Stredni
**Zavislosti:** Orders, Backend

---

### 16. 🟡 Doprava a shipping (40%)

#### 16.1 🟢 Admin konfigurace (85%)
**Co to dela:** Firma nastavi metody dopravy, ceny, prah pro free shipping.
**Aktualni stav:** AdminShipping.jsx plne funkcni — CRUD metod, razeni, active/inactive, free shipping threshold.
**Jak se ma chovat:** Firma ma kompletni kontrolu nad dopravou.
**Faze:** Hotovo pro Beta (admin cast)
**Co chybi pro Beta:** Nic (admin strana je hotova)
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 16.2 🔴 Integrace do kalkulacky (5%)
**Co to dela:** Zakaznik vybira metodu dopravy primo v kalkulacce.
**Aktualni stav:** ShippingSelector komponenta existuje a je funkcni, ale NENI renderovana v kalkulacce.
**Jak se ma chovat:** V kroku checkoutu zakaznik vidi dostupne metody dopravy, vybere jednu, cena se prepocita.
**Faze:** Neimplementovano (komponenta hotova, chybi renderovani)
**Co chybi pro Beta:**
- Renderovat ShippingSelector v kalkulacce (v checkoutu nebo v kroku 3)
- Propojit s pricing calculatorem
**Odhadovana prace:** Mala
**Zavislosti:** Kalkulacka (1.7)

#### 16.3 🔴 Realni dopravci (0%)
**Co to dela:** Integrace s realnym dopravci (Zasilkovna, PPL, DPD, Ceska posta).
**Aktualni stav:** Neexistuje. Jen manualni metody.
**Jak se ma chovat pro Beta:** Pro Beta staci manualni metody — firma si nastavi dopravce rucne. Integrace s API dopravcu je post-Beta.
**Faze:** Neimplementovano
**Co chybi pro Beta:** Nic — manualni metody staci pro Beta
**Odhadovana prace:** N/A (post-Beta)
**Zavislosti:** N/A

---

### 17. 🟡 Express delivery (40%)

#### 17.1 🟢 Admin konfigurace (85%)
**Co to dela:** Firma nastavi express tiers — nazvy, prirazky (% nebo fixni), razeni.
**Aktualni stav:** AdminExpress.jsx plne funkcni.
**Jak se ma chovat:** Firma nabizi ruze rychlosti dodani s ruznou cenou.
**Faze:** Hotovo pro Beta (admin cast)
**Co chybi pro Beta:** Nic (admin strana je hotova)
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 17.2 🔴 Integrace do kalkulacky (5%)
**Co to dela:** Zakaznik vybira rychlost dodani.
**Aktualni stav:** ExpressTierSelector komponenta existuje, ale NENI renderovana.
**Jak se ma chovat:** Zakaznik vidi moznosti (Standard / Express / Rush) s cenami, vybere jednu.
**Faze:** Neimplementovano (komponenta hotova, chybi renderovani)
**Co chybi pro Beta:**
- Renderovat ExpressTierSelector v kalkulacce
- Propojit s pricing calculatorem
**Odhadovana prace:** Mala
**Zavislosti:** Kalkulacka (1.7)

---

### 18. 🟡 Kupony a slevy (35%)

#### 18.1 🟢 Admin konfigurace (82%)
**Co to dela:** Firma vytvari kupony — procento, fixni castka, free shipping.
**Aktualni stav:** AdminCoupons.jsx plne funkcni — CRUD, typy, platnost, limitace.
**Jak se ma chovat:** Firma vytvari promocni kody pro zakazniky.
**Faze:** Hotovo pro Beta (admin cast)
**Co chybi pro Beta:** Nic kritickeho (admin strana)
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 18.2 🔴 Integrace do kalkulacky (5%)
**Co to dela:** Zakaznik zadava kuponovy kod.
**Aktualni stav:** CouponInput komponenta existuje, ale NENI renderovana.
**Jak se ma chovat:** Zakaznik zada kod, system overi platnost, aplikuje slevu do ceny.
**Faze:** Neimplementovano (komponenta hotova, chybi renderovani)
**Co chybi pro Beta:**
- Renderovat CouponInput v kalkulacce
- Propojit s pricing calculatorem
**Odhadovana prace:** Mala
**Zavislosti:** Kalkulacka (1.7)

#### 18.3 🔴 Backend validace (0%)
**Co to dela:** Overeni platnosti kuponu na serveru (ne jen v prohlizeci).
**Aktualni stav:** Jen klientska validace.
**Jak se ma chovat:** Backend overi ze kupon existuje, je platny, nebyl vyuzit vice nez povoleno.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Backend endpoint pro validaci kuponu
- Pocitadlo pouziti
**Odhadovana prace:** Stredni
**Zavislosti:** Backend

---

### 19. 🟡 i18n (CZ/EN lokalizace) (45%)

#### 19.1 🟢 LanguageContext a prepinani (70%)
**Co to dela:** Prepinani mezi cestinou a anglictinou, prekladovy slovnik.
**Aktualni stav:** 1130 radku, 462 klicu CS/EN, prepinani v UI.
**Jak se ma chovat:** Vsechny texty v aplikaci jsou prelozene do obou jazyku.
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Prelozit hardcoded texty v kalkulacce a novejsich komponentach
**Odhadovana prace:** Stredni
**Zavislosti:** Zadne

#### 19.2 🟡 Pokryti prekladu (50%)
**Co to dela:** Vsechny viditelne texty maji CS/EN preklad.
**Aktualni stav:** Vetsina admin stranek prelozena, ale kalkulacka a nektera novejsi cast ma hardcoded ceske texty.
**Jak se ma chovat:** 100% pokryti vsech viditrelnych textu.
**Faze:** Rozpracovano
**Co chybi pro Beta:**
- Projit vsechny komponenty a pridat chybejici klice
**Odhadovana prace:** Stredni
**Zavislosti:** Zadne

#### 19.3 🔴 Dalsi jazyky (0%)
**Co to dela:** Podpora dalsich jazyku (DE, SK, PL atd.).
**Aktualni stav:** Jen CZ/EN.
**Jak se ma chovat pro Beta:** Pro Beta staci CZ/EN, dalsi jazyky az pozdeji.
**Faze:** Neimplementovano
**Co chybi pro Beta:** Nic — CZ/EN staci
**Odhadovana prace:** N/A (post-Beta)
**Zavislosti:** N/A

---

### 20. 🟠 Auth a bezpecnost (15%)

#### 20.1 🟢 Firebase Auth zaklad (65%)
**Co to dela:** Prihlaseni a registrace uzivatelu.
**Aktualni stav:** Firebase Auth funguje, login/register stranky, AuthContext, useAuth hook, PrivateRoute komponenta.
**Jak se ma chovat:** Uzivatel se prihlasi a ma pristup ke svemu admin panelu.
**Faze:** Skoro hotovo (zaklad)
**Co chybi pro Beta:**
- Zapnout PrivateRoute (odkomentovat v Routes.jsx)
- Ochranit admin sekci
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 20.2 🔴 API autentizace (0%)
**Co to dela:** Backend overi ze pozadavek pochazi od prihlaseneho uzivatele.
**Aktualni stav:** Zadna auth na backendu. Vsechny endpointy verejne.
**Jak se ma chovat:** Kazdy API pozadavek obsahuje token, backend ho overi.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Firebase Admin SDK na backendu
- Middleware pro overeni tokenu
- Pridani Authorization headeru na frontendu
**Odhadovana prace:** Stredni
**Zavislosti:** Firebase Auth

#### 20.3 🔴 Tenant izolace (5%)
**Co to dela:** Kazda firma vidi jen sva data.
**Aktualni stav:** Hardcoded tenant ID na nekterych mistech.
**Jak se ma chovat:** Tenant ID se urcuje z prihlaseneho uzivatele, vsechna data jsou filtrovana.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Dynamicky tenant ID z auth
- Kontrola na vsech storage operacich
**Odhadovana prace:** Stredni
**Zavislosti:** API Auth (20.2)

#### 20.4 🔴 RBAC (0%)
**Co to dela:** Role a opravneni — admin, editor, viewer.
**Aktualni stav:** Neexistuje. Kdokoli prihlaseny ma plny pristup.
**Jak se ma chovat pro Beta:** Pro Beta staci jednoduchy system — vlastnik ma plny pristup, pozvanI clenove maji omezeny pristup.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Zakladni role system
- Kontrola opravneni v UI
**Odhadovana prace:** Stredni
**Zavislosti:** Auth (20.1, 20.2)

---

### 21. 🟡 Admin — Analytika (40%)

#### 21.1 🟢 UI a taby (75%)
**Co to dela:** Analyticke zobrazeni — overview, sessions, materials, conversions, export.
**Aktualni stav:** 5 tabu, filtry, CSV export. Plne funkcni UI.
**Jak se ma chovat:** Firma vidi real-time analytiku o pouzivani kalkulacky.
**Faze:** Skoro hotovo (UI)
**Co chybi pro Beta:**
- Nic na strane UI
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 21.2 🟡 Realna data (15%)
**Co to dela:** Sber a zobrazeni skutecnych analytickych dat.
**Aktualni stav:** Demo seed data, zadny realny tracking.
**Jak se ma chovat:** Kazda akce zakaznika v kalkulacce se zaloguje a zobrazi v analytice.
**Faze:** Zaklad
**Co chybi pro Beta:**
- Tracking events v kalkulacce (upload, slice, checkout atd.)
- Agregace dat
**Odhadovana prace:** Stredni
**Zavislosti:** Backend

---

### 22. 🟠 Admin — Emaily/notifikace (20%)

#### 22.1 🟢 Admin UI (70%)
**Co to dela:** Konfigurace email sablonu a providera.
**Aktualni stav:** 3 taby (Templates, Provider, Log), event triggers, SMTP/Resend/SendGrid konfigurace.
**Jak se ma chovat:** Firma nastavi email provider a sablony pro ruzne udalosti.
**Faze:** Skoro hotovo (UI)
**Co chybi pro Beta:** Nic na strane UI
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 22.2 🔴 Backend email system (0%)
**Co to dela:** Realne odesilani emailu.
**Aktualni stav:** Nepripojeno. Zadne SMTP/API volani.
**Jak se ma chovat:** Po potvrzeni objednavky se odesle email zakaznikovi. Pri zmene statusu dalsi email.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Backend service pro odesilani emailu
- Napojeni na SMTP/Resend/SendGrid
- HTML email sablony
- Trigger pri zmene statusu objednavky
**Odhadovana prace:** Velka
**Zavislosti:** Backend, konfigurace v admin (uz hotova)

---

### 23. 🟡 Admin — Team Access (35%)

#### 23.1 🟢 UI pro spravu tymu (70%)
**Co to dela:** Pridavani clenu, role, audit log.
**Aktualni stav:** 3 taby (Users, Roles, Audit), invite workflow, role system.
**Jak se ma chovat:** Vlastnik firmy zve dalsi cleny s ruznyma opravnenimi.
**Faze:** Skoro hotovo (UI)
**Co chybi pro Beta:**
- Nic na strane UI
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 23.2 🔴 Realna autorizace (0%)
**Co to dela:** Skutecna kontrola opravneni na zaklade roli.
**Aktualni stav:** Jen demo v localStorage, zadna skutecna auth.
**Jak se ma chovat:** Pozvanyzlen se prihlasi a vidi jen to co ma povoleno.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Napojeni na Firebase Auth
- Realne invite (email)
- Kontrola opravneni v UI a na backendu
**Odhadovana prace:** Velka
**Zavislosti:** Auth (20), Emaily (22)

---

### 24. 🟢 Verejne stranky (Home, Pricing, Support) (85%)

#### 24.1 ✅ Home stranka (90%)
**Co to dela:** Landing page s popisem produktu a CTA.
**Aktualni stav:** Forge design, hero sekce, features, CTA. Plne funkcni.
**Jak se ma chovat:** Profesionalni landing page ktera prodava produkt.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 24.2 ✅ Pricing stranka (88%)
**Co to dela:** Zobrazeni cenovych planu.
**Aktualni stav:** 3 plany (Starter 499 Kc, Professional 1999 Kc, Enterprise custom). CZ/EN.
**Jak se ma chovat:** Jasny prehled co zakaznik za co plati.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 24.3 ✅ Support stranka (85%)
**Co to dela:** Kontaktni formular a FAQ.
**Aktualni stav:** Forge design, formular, FAQ sekce.
**Jak se ma chovat:** Zakaznik najde odpovedi nebo nas kontaktuje.
**Faze:** Hotovo pro Beta
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

#### 24.4 🟢 SEO a meta tagy (60%)
**Co to dela:** Optimalizace pro vyhledavace.
**Aktualni stav:** Zakladni title a meta description. Chybi Open Graph, structured data.
**Jak se ma chovat pro Beta:** Pro Beta staci zakladni meta tagy. Plne SEO az po spusteni.
**Faze:** Rozpracovano
**Co chybi pro Beta:** Nic kritickeho
**Odhadovana prace:** N/A (post-Beta)
**Zavislosti:** N/A

---

### 25. 🟡 Ucet uzivatele (Account) (30%)

#### 25.1 🟢 Account stranka (60%)
**Co to dela:** Zobrazeni a editace uzivatelskeho profilu.
**Aktualni stav:** Existuje stranka, zakladni layout.
**Jak se ma chovat:** Uzivatel vidi a edituje sve udaje, spravuje predplatne, vidi historii plateb.
**Faze:** Rozpracovano
**Co chybi pro Beta:**
- Editace profilu
- Zobrazeni planu
**Odhadovana prace:** Stredni
**Zavislosti:** Auth

#### 25.2 🔴 Platebni historie a predplatne (0%)
**Co to dela:** Zobrazeni historie plateb a sprava predplatneho.
**Aktualni stav:** Neexistuje.
**Jak se ma chovat:** Uzivatel vidi vsechny platby, muze zmenit plan, zrusit predplatne.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Stripe Customer Portal integrace
- Historie plateb
**Odhadovana prace:** Stredni
**Zavislosti:** Stripe (8)

---

### 26. 🔴 Cloud Run — PrusaSlicer backend (0%)

#### 26.1 🔴 Docker image s PrusaSlicer (0%)
**Co to dela:** Docker kontejner obsahujici PrusaSlicer CLI pro slicovani 3D modelu v cloudu.
**Aktualni stav:** Neexistuje. Aktualne bezi lokalni Express server (backend-local/, port 3001).
**Jak se ma chovat:** Docker image s PrusaSlicer nainstalovanym, Express API pro slicing, deploy na Cloud Run (4 CPU, 2 GB RAM).
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Napsat Dockerfile s PrusaSlicer instalaci (Linux)
- Build a push do Google Artifact Registry
- Deploy na Cloud Run (region europe-west1)
- Nastavit environment variables (Supabase keys, CORS origins)
**Odhadovana prace:** Velka
**Zavislosti:** Google Cloud ucet, Docker Desktop, gcloud CLI

#### 26.2 🔴 Firebase Hosting proxy (0%)
**Co to dela:** Smeruje API pozadavky z frontendu na spravny backend.
**Aktualni stav:** Neexistuje v produkci. Lokalne pouzivame Vite proxy na port 3001.
**Jak se ma chovat:** `firebase.json` rewrite pravidla: `/api/slice/**` → Cloud Run slicer, `/api/**` → Cloud Functions CRUD, `**` → staticky frontend.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Upravit/vytvorit firebase.json s rewrite pravidly
- Deploy Firebase Hosting
**Odhadovana prace:** Stredni
**Zavislosti:** Cloud Run deploy (26.1), Firebase projekt

#### 26.3 🔴 Cloud Functions pro API (0%)
**Co to dela:** Lehky backend pro CRUD operace (objednavky, admin, upload) — oddelen od narocneho sliceru.
**Aktualni stav:** Neexistuje. Vsechna API logika je v lokalnim Express serveru.
**Jak se ma chovat:** Cloud Functions (0.17 CPU, 256 MB) pro jednoduche operace — vytvoreni objednavky, cteni admin dat, upload souboru do Supabase.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Migrace relevantich API endpointu z backend-local do Cloud Functions
- Napojeni na Supabase (Service Role Key)
- Deploy pres Firebase CLI
**Odhadovana prace:** Velka
**Zavislosti:** Supabase propojeni (27), Firebase projekt

#### 26.4 🟢 Lokalni Express server (80%)
**Co to dela:** Stavajici lokalni backend pro vyvoj a testovani.
**Aktualni stav:** Port 3001, Vite proxy, PrusaSlicer CLI spawn, health check, presety. Plne funkcni pro lokalni vyvoj.
**Jak se ma chovat:** Slouzi jako zaklad pro Cloud Run migraci. Po deployi zustanou jako dev fallback.
**Faze:** Skoro hotovo
**Co chybi pro Beta:** Nic — v produkci bude nahrazen Cloud Run
**Odhadovana prace:** Mala
**Zavislosti:** Zadne

---

### 27. 🟠 Supabase — plne propojeni (20%)

#### 27.1 🟢 Schema a tabulky (80%)
**Co to dela:** PostgreSQL databaze s 25 tabulkami pro vsechna data projektu.
**Aktualni stav:** Schema definovane v `supabase/schema.sql`, RLS pravidla, 3 storage buckety (models, documents, branding). StorageAdapter existuje.
**Jak se ma chovat:** Vsechna data (objednavky, konfigurace, soubory) ulozena v Supabase misto localStorage.
**Faze:** Skoro hotovo (schema)
**Co chybi pro Beta:**
- Overit ze vsechny tabulky existuji na Supabase instanci
- Aplikovat RLS pravidla
**Odhadovana prace:** Mala
**Zavislosti:** Supabase ucet

#### 27.2 🟢 Frontend klient a adaptery (70%)
**Co to dela:** Frontend cte a zapisuje data pres Supabase klient/StorageAdapter.
**Aktualni stav:** `src/lib/supabase/client.js`, StorageAdapter, featureFlags, migracni runner (19 migraci), async hooks (useStorageQuery, useStorageMutation). Default mode = localStorage.
**Jak se ma chovat:** Frontend pouziva Supabase jako primarni zdroj dat (s localStorage jako fallback/cache).
**Faze:** Skoro hotovo
**Co chybi pro Beta:**
- Prepnout feature flags z 'localStorage' na 'supabase' nebo 'dual-write'
- Otestovat vsechny storage helpery s realnym Supabase
- Spustit migrace pres AdminMigration UI
**Odhadovana prace:** Stredni
**Zavislosti:** Supabase ucet a klice

#### 27.3 🔴 Backend Supabase klient (0%)
**Co to dela:** Cloud Run a Cloud Functions pristupuji k Supabase pres Service Role Key.
**Aktualni stav:** Neexistuje na backendu. Pouze frontend ma Supabase klient.
**Jak se ma chovat:** Backend pouziva Supabase pro ukladani objednavek do tabulek `orders`/`order_items`, ukladani modelu a G-code do Storage bucketu.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Vytvorit backend Supabase klient s Service Role Key
- Endpoints pro zapis objednavek
- Upload souboru do Supabase Storage po slicovani
**Odhadovana prace:** Stredni
**Zavislosti:** Cloud Run (26), Supabase Service Role Key

#### 27.4 🔴 Realtime a sync (0%)
**Co to dela:** Real-time aktualizace dat mezi admin panelem a backendem.
**Aktualni stav:** Hook `useSupabaseRealtime` existuje ale neni aktivne pouzivan.
**Jak se ma chovat:** Admin vidi live aktualizace objednavek bez refreshe stranky.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Aktivovat Supabase Realtime pro tabulku `orders`
- Napojit useSupabaseRealtime v Orders admin
**Odhadovana prace:** Stredni
**Zavislosti:** Supabase propojeni (27.2, 27.3)

---

### 28. 🔴 Vlastni domena (0%)

#### 28.1 🔴 Registrace domeny (0%)
**Co to dela:** Zakoupeni domeny modelpricer.com a modelpricer.cz pro profesionalni prezentaci.
**Aktualni stav:** Neexistuje. Pouzivame Firebase default domenu (projekt.web.app).
**Jak se ma chovat:** Web pristupny na modelpricer.com (pripadne i .cz) s profesionalni URL.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Vybrat registratora (Cloudflare, Wedos, Forpsi)
- Zaregistrovat modelpricer.com a modelpricer.cz
**Odhadovana prace:** Mala
**Zavislosti:** Zadne (jen financni)

#### 28.2 🔴 DNS a Firebase propojeni (0%)
**Co to dela:** Propojeni vlastni domeny s Firebase Hosting pro automaticky SSL a routing.
**Aktualni stav:** Neexistuje.
**Jak se ma chovat:** DNS A/CNAME zaznamy ukazuji na Firebase, automaticky SSL certifikat, vsechny routes fungujou vcetne API proxy na Cloud Run.
**Faze:** Neimplementovano
**Co chybi pro Beta:**
- Pridat domenu v Firebase Hosting console
- Nastavit DNS zaznamy u registratora
- Overeni vlastnictvi domeny (TXT zaznam)
- CORS update na backendu (pridat novou domenu)
- Presmerovani .cz → .com (nebo naopak podle rozhodnuti)
**Odhadovana prace:** Mala
**Zavislosti:** Registrace domeny (28.1), Firebase Hosting, Cloud Run (26)

---

### SEZNAM POLOZEK "NUTNO DOPLNIT"

V teto RoadMap jsou nasledujici oblasti kde je potreba upresneni od vlastnika produktu:

1. **Checkout flow — presny design:** Jak presne ma vypadat checkout? Oddelene kroky (doprava -> platba -> souhrn) nebo vsechno na jedne strance?
2. **Stripe vs jine platebni brany:** Bude se pouzivat jen Stripe nebo i jine (GoPay, Comgate)?
3. **Dobirka — implementacni detail:** Jak presne dobirka funguje? Firma rucne nastavi castku k dobirce? Nebo se integruji s dopravcem?
4. **Email sablony — design:** Jak maji vypadat HTML emaily? Pouzit template engine (Handlebars, MJML)?
5. **Tenant onboarding flow:** Jak se nova firma registruje? Self-service nebo manualni schvaleni?
6. **Model Storage — cloud provider:** Kde se maji ukladat soubory? Supabase Storage, AWS S3, nebo lokalne?
7. **Dashboard — ktere metriky jsou nejdulezitejsi pro Beta?**
8. **Team Access — role pro Beta:** Staci admin/editor/viewer nebo vic moznosti?
9. **Widget Builder — scope pro Beta:** Co presne ma builder umet v Beta verzi? Jen barvy a logo nebo vic?
10. **Analytics tracking — implementace:** Kde ukladat tracking data? Supabase, vlastni backend, externi sluzba?
11. **Dobirka — priplatek:** Kolik stoji dobirka? Je to fixni nebo zalezi na dopravci?
12. **Kupony — limity pro Beta:** Jsou potreba casove omezeni, max pouziti, min hodnota objednavky?
13. **Express delivery — casove ramce:** Jak definovat "express"? Pocet dnu nebo presne hodiny?
14. **Cloud Run — Google Cloud ucet:** Mas uz Google Cloud ucet? Jaky Project ID a region (doporucuji europe-west1)?
15. **Cloud Run — PrusaSlicer profily:** Jake tiskarny, materialy a kvality pouzivas? Exportovane INI profily pro Docker image?
16. **Cloud Run — kdo muze slicovat:** Kdokoliv bez prihlaseni, nebo jen prihlaseni uzivatele?
17. **Supabase — pristupove udaje:** Mas Supabase Project URL, Anon Key a Service Role Key pripravene?
18. **Supabase — existujici tabulky:** Jsou vsechny tabulky z schema.sql vytvorene na Supabase instanci?
19. **Vlastni domena — registrator:** Kde chces registrovat domenu? (Cloudflare, Wedos, Forpsi, jiny?)
20. **Vlastni domena — presmerovani:** Ma .cz presmerovat na .com nebo naopak? Nebo obe samostatne?

---

## 5. Beta Testing Roadmap

### Co je cil Beta verze
Funkcni end-to-end produkt ktery firma muze pouzivat pro nacenovani a prijem objednavek od zakazniku. Zakaznik nahraje model -> vybere parametry -> vidi cenu -> vybere dopravu -> zaplati -> firma zpracuje objednavku.

### Co MUSI byt v Beta

- Funkcni end-to-end kalkulacka (upload -> slicer -> cena -> doprava/express/kupon -> objednavka)
- Stripe integrace (firma si propoji svuj Stripe ucet pres Admin)
- Zobrazeni platebnich udaju pro bankovni prevod (cislo uctu + VS = cislo objednavky)
- Funkcni admin panel (Pricing, Fees, Materials, Presets, Orders, Parameters)
- Widget embed (zakladni, s minimalni customizaci — logo, text, preset barvy)
- Branding (logo, barvy, nazev firmy)
- Model Storage
- Doprava a shipping integrace do kalkulacky
- Express delivery integrace do kalkulacky
- Kupony integrace do kalkulacky
- Email notifikace (alespon zakladni — potvrzeni objednavky)
- Auth (PrivateRoute zapnuty, API autentizace)
- Cloud Run backend pro PrusaSlicer slicovani (Docker kontejner v cloudu)
- Supabase jako primarni databaze a file storage (presun z localStorage)
- Vlastni domena modelpricer.com / .cz (ne Firebase default)

### Co NEMUSI byt v Beta

- Shopify/Shoptet/eshop integrace (po Beta)
- Marketplace (vzdalena budoucnost)
- Pokrocily Widget Builder (jen zakladni pro Beta)
- Pokrocila analytika (zakladni staci)
- Team Access s realnym auth (demo staci ale musi byt funkcni UI)
- Integrace s realnymi dopravci (API Zasilkovna atd.)
- Dalsi jazyky krome CZ/EN
- Plne SEO

---

### FAZE 0 — Cloud Run + Supabase + Domena (2-3 tydny)
**Cil:** Produkcni backend infrastruktura — slicovani v cloudu, databaze, vlastni domena.

| # | Ukol | Priorita | Odhad |
|---|------|----------|-------|
| F0.1 | Google Cloud ucet + projekt + billing | KRITICKA | 2h |
| F0.2 | Dockerfile s PrusaSlicer (Linux build) | KRITICKA | 12h |
| F0.3 | Deploy Docker image na Cloud Run (4 CPU, 2 GB) | KRITICKA | 4h |
| F0.4 | Firebase Hosting proxy — firebase.json rewrite pravidla | KRITICKA | 4h |
| F0.5 | Cloud Functions pro CRUD API (objednavky, admin, upload) | KRITICKA | 16h |
| F0.6 | Backend Supabase klient (Service Role Key) | KRITICKA | 6h |
| F0.7 | Prepnout frontend na Supabase (feature flags dual-write → supabase) | VYSOKA | 8h |
| F0.8 | Spustit migrace localStorage → Supabase (AdminMigration UI) | VYSOKA | 4h |
| F0.9 | Supabase Storage — upload modelu a G-code z backendu | VYSOKA | 8h |
| F0.10 | Registrace domeny modelpricer.com + .cz | VYSOKA | 2h |
| F0.11 | DNS + Firebase Hosting propojeni + SSL | VYSOKA | 4h |
| F0.12 | CORS update pro novou domenu + Cloud Run | STREDNI | 2h |
| F0.13 | End-to-end test: frontend → Cloud Run slicer → Supabase → odpoved | KRITICKA | 4h |

**Vysledek:** Backend bezi v cloudu (Cloud Run + Cloud Functions), data v Supabase, web na vlastni domene.

---

### FAZE 1 — Kriticka infrastruktura (1-2 tydny)
**Cil:** Zakladni bezpecnost a integrace komponent ktere uz existuji.

| # | Ukol | Priorita | Odhad |
|---|------|----------|-------|
| F1.1 | Zapnout PrivateRoute — odkomentovat v Routes.jsx, ochranit admin | KRITICKA | 2h |
| F1.2 | Renderovat ShippingSelector v kalkulacce (krok 3 nebo checkout) | KRITICKA | 4h |
| F1.3 | Renderovat ExpressTierSelector v kalkulacce | KRITICKA | 3h |
| F1.4 | Renderovat CouponInput v kalkulacce | KRITICKA | 3h |
| F1.5 | Propojit shipping/express/coupon s pricing calculator souhrnm | KRITICKA | 6h |
| F1.6 | Odstranit hardcoded tenant IDs (test-customer-1) | VYSOKA | 4h |
| F1.7 | Pridat 3MF do dropzone accept | STREDNI | 1h |

**Vysledek:** Kalkulacka zobrazuje dopravu, express a kupony. Admin je chraneny prihlasenim.

---

### FAZE 2 — Stripe a platby (2-3 tydny)
**Cil:** Firma muze prijimat platby od zakazniku.

| # | Ukol | Priorita | Odhad |
|---|------|----------|-------|
| F2.1 | Naintalovat @stripe/stripe-js a @stripe/react-stripe-js | KRITICKA | 1h |
| F2.2 | Admin stranka pro Stripe konfiguraci (API klice) | KRITICKA | 8h |
| F2.3 | Backend endpoint — vytvoreni Payment Intent | KRITICKA | 8h |
| F2.4 | Frontend — Stripe Elements v checkoutu | KRITICKA | 12h |
| F2.5 | Backend — webhook handler pro platebni udalosti | KRITICKA | 8h |
| F2.6 | Fakturacni udaje firmy v admin (cislo uctu, ICO, DIC) | VYSOKA | 6h |
| F2.7 | Zobrazeni platebnich udaju v OrderConfirmation (prevod/dobirka) | VYSOKA | 4h |
| F2.8 | Platebni metody v checkoutu (karta/prevod/dobirka) | VYSOKA | 6h |
| F2.9 | Generovani variabilniho symbolu | VYSOKA | 2h |

**Vysledek:** Zakaznik muze zaplatit kartou (Stripe), prevodem (zobrazi udaje) nebo dobirkou.

---

### FAZE 3 — Auth a backend bezpecnost (1-2 tydny)
**Cil:** API je zabezpecene, data jsou izolovana per-tenant.

| # | Ukol | Priorita | Odhad |
|---|------|----------|-------|
| F3.1 | Firebase Admin SDK na backendu | KRITICKA | 4h |
| F3.2 | Auth middleware pro vsechny API endpointy | KRITICKA | 6h |
| F3.3 | Authorization header na frontendu (interceptor) | KRITICKA | 4h |
| F3.4 | Tenant izolace — dynamicky tenant z auth | VYSOKA | 8h |
| F3.5 | Zakladni RBAC (admin/editor/viewer) | STREDNI | 8h |

**Vysledek:** Vsechny API endpointy jsou chranene, data jsou izolovana.

---

### FAZE 4 — Emaily a notifikace (1 tyden)
**Cil:** Zakaznik dostava email po objednani.

| # | Ukol | Priorita | Odhad |
|---|------|----------|-------|
| F4.1 | Backend email service (Resend nebo SendGrid SDK) | KRITICKA | 6h |
| F4.2 | HTML email sablona — potvrzeni objednavky | KRITICKA | 6h |
| F4.3 | Trigger — odeslani emailu po vytvoreni objednavky | KRITICKA | 4h |
| F4.4 | Trigger — email pri zmene statusu objednavky | VYSOKA | 4h |
| F4.5 | Napojeni na admin email konfiguraci | VYSOKA | 4h |

**Vysledek:** Zakaznik dostava email po objednani a pri zmene statusu.

---

### FAZE 5 — Widget, storage a ladeni (1-2 tydny)
**Cil:** Widget funguje na externich webech, soubory se ukladaji, vse funguje.

| # | Ukol | Priorita | Odhad |
|---|------|----------|-------|
| F5.1 | Widget — portovat shipping/express/coupons integrace | VYSOKA | 6h |
| F5.2 | Widget Builder — zjednodusena Beta verze (logo, barvy, text) | STREDNI | 8h |
| F5.3 | Model Storage — automaticke ukladani po objednavce | VYSOKA | 6h |
| F5.4 | Model Storage — napojeni na cloud (Supabase Storage nebo S3) | VYSOKA | 8h |
| F5.5 | Dashboard — napojeni na realna data z Orders | STREDNI | 6h |
| F5.6 | i18n — doplnit chybejici preklady v kalkulacce | STREDNI | 4h |
| F5.7 | Kupony — backend validace | STREDNI | 4h |

**Vysledek:** Kompletni produkt pripraveny pro Beta testing.

---

### FAZE 6 — QA a stabilizace (1 tyden)
**Cil:** Vse funguje spolehlive, zadne kriticke bugy.

| # | Ukol | Priorita | Odhad |
|---|------|----------|-------|
| F6.1 | End-to-end testovani celeho flow (upload -> platba -> objednavka) | KRITICKA | 8h |
| F6.2 | Testovani widgetu na externich webech (3+ ruzne weby) | VYSOKA | 4h |
| F6.3 | Oprava nalezenych bugu | KRITICKA | 16h |
| F6.4 | Performance testovani (velke modely, vice modelu) | STREDNI | 4h |
| F6.5 | Security review (auth, API, injection) | VYSOKA | 4h |
| F6.6 | npm run build — overeni ze vse projde | KRITICKA | 1h |

**Vysledek:** Stabilni Beta verze pripravena pro realne firmy.

---

### Celkovy odhad pro Beta

| Faze | Casovy odhad | Hlavni vysledek |
|------|-------------|-----------------|
| Faze 0 | 2-3 tydny | Cloud Run backend, Supabase propojeni, vlastni domena |
| Faze 1 | 1-2 tydny | Kalkulacka s dopravou/express/kupony, chraneny admin |
| Faze 2 | 2-3 tydny | Stripe platby, fakturace, platebni metody |
| Faze 3 | 1-2 tydny | Zabezpecene API, tenant izolace |
| Faze 4 | 1 tyden | Email notifikace |
| Faze 5 | 1-2 tydny | Widget, storage, ladeni |
| Faze 6 | 1 tyden | QA a stabilizace |
| **CELKEM** | **9-14 tydnu** | **Plne funkcni Beta verze s produkcnim backendem** |

> **Poznamka:** Odhady jsou pro jednoho vyvojare. Faze 0 je zakladem pro vsechno ostatni — bez produkcniho backendu a databaze nemohou fungovat platby, emaily ani realny order processing. Faze 1 muze castecne bezet paralelne s Fazi 0 (integrace komponent do UI). Faze 3-5 se daji castecne paralelizovat.

---

## 6. Budouci vize — Marketplace

### Marketplace pro 3D tisk (post-Beta, dlouhodoba vize)

Hlavni vize je pretvorit ModelPricer/FORGE na marketplace pro 3D tisk. Inspirovano modelem Uber/Bolt kde zakaznik zada objednavku a vidi nabidky od firem.

**Koncept "PickAndPrint" (pracovni nazev):**

1. **Zakaznik vybere model** — bud nahraje vlastni STL nebo vybere z databaze ready-made modelu
2. **System naceni** — podle parametru (material, kvalita, express) se vypocita cena
3. **Vyber firmy** — zakaznik vidi seznam firem ve svem okoli s cenami, hodnocenim a casem dodani (Uber styl)
4. **Alternativa: Foodora styl** — objednavka se rozesle firmam v okoli a firmy si ji samy vyberou
5. **Zpracovani a dodani** — firma vytiskne a odesle, zakaznik hodnoti

**Doplnkove casti:**
- **Databaze modelu** — Thingiverse-styl katalog s 3D nahledy, popisy a moznosti nakupu
- **Creator program** — lide nahravaji vlastni modely a dostavaji podil z kazdeho tisku/prodeje
- **Business ucty** — firmy maji vlastni dashboard s objednavkami, analytikou a vyplatami

**Casovy horizont:** Marketplace se bude resit az po uspesnem spusteni plne verze ModelPricer a ziskani stalych zakazniku (firem). Prvni krok je mit stabilni SaaS pro jednotlive firmy, teprve pak budovat marketplace okolo nej.

---

> **Tento dokument je zivy** — bude se aktualizovat s kazdou vetsi zmenou v projektu.
