# Frontend Infrastruktura — ModelPricer V3

> Kompletni mapa vsech stranek, komponent a UI struktur.
> Tento dokument slouzi jako blueprint pro implementaci frontend shellu.

---

## 1. PREHLED STRANEK

### 1.1 Existujici stranky (23)

| # | Nazev | Route | Layout | Stav |
|---|-------|-------|--------|------|
| 1 | Home | `/` | Full-width marketing | Hotovo |
| 2 | Login | `/login` | Centrovany formular | Hotovo |
| 3 | Register | `/register` | Centrovany + kroky | Hotovo |
| 4 | Pricing | `/pricing` | Full-width sekce | Hotovo |
| 5 | Support | `/support` | Full-width | Hotovo |
| 6 | Account | `/account` | Content page | Hotovo |
| 7 | Model Upload | `/model-upload` | Full-width wizard | Hotovo |
| 8 | Test Kalkulacka | `/test-kalkulacka` | 5-step wizard | Hotovo |
| 9 | Widget Kalkulacka | `/widget-kalkulacka` | Embeddable widget | Hotovo |
| 10 | Admin Dashboard | `/admin` | Admin sidebar | Hotovo |
| 11 | Admin Branding | `/admin/branding` | Admin sidebar | Hotovo |
| 12 | Admin Pricing | `/admin/pricing` | Admin sidebar | Hotovo |
| 13 | Admin Fees | `/admin/fees` | Admin sidebar | Hotovo |
| 14 | Admin Parameters | `/admin/parameters/*` | Admin sidebar | Hotovo |
| 15 | Admin Presets | `/admin/presets/*` | Admin sidebar | Hotovo |
| 16 | Admin Orders | `/admin/orders` | Admin sidebar | Hotovo |
| 17 | Admin Widget | `/admin/widget` | Admin sidebar | Hotovo |
| 18 | Admin Analytics | `/admin/analytics` | Admin sidebar | Hotovo |
| 19 | Admin Team | `/admin/team` | Admin sidebar | Hotovo |
| 20 | Widget Builder | `/admin/widget/builder/:id` | Fullscreen editor | Hotovo |
| 21 | Widget Public | `/w/:publicWidgetId` | Standalone embed | Hotovo |
| 22 | Invite Accept | `/invite/accept` | Centrovana stranka | Hotovo |
| 23 | 404 Not Found | `*` | Centrovana stranka | Hotovo |

### 1.2 Planovane nove stranky (12)

| # | Nazev | Route | Layout | Faze | Priorita |
|---|-------|-------|--------|------|----------|
| 24 | Shipping Admin | `/admin/shipping` | Admin sidebar | F2 | P1 |
| 25 | Coupons & Promotions | `/admin/promotions` | Admin sidebar | F3 | P2 |
| 26 | Email Templates | `/admin/emails` | Admin sidebar | F3 | P2 |
| 27 | Orders Kanban | `/admin/orders/kanban` | Admin sidebar (wide) | F3 | P2 |
| 28 | PDF Document Templates | `/admin/documents` | Admin sidebar | F5 | P3 |
| 29 | Customer Portal | `/admin/customers` | Admin sidebar | F5 | P3 |
| 30 | Localization Settings | `/admin/localization` | Admin sidebar | F6 | P3 |
| 31 | API Developer Portal | `/admin/api` | Admin sidebar | F6 | P3 |
| 32 | CRM & Marketing | `/admin/crm` | Admin sidebar | F6 | P3 |
| 33 | Security & Compliance | `/admin/security` | Admin sidebar | F6 | P3 |
| 34 | Technologies/Printers | `/admin/technologies` | Admin sidebar | F7 | P4 |
| 35 | E-commerce Integrations | `/admin/integrations` | Admin sidebar | F7 | P4 |

---

## 2. DETAILNI POPIS KAZDE STRANKY

### 2.1 HOME (`/`)

**Layout:** Full-width, vertikalni sekce, bez sidebaru
**Soubor:** `src/pages/home/index.jsx`

**Sekce (shora dolu):**

1. **Hero sekce**
   - Velky nadpis (h1)
   - Podnadpis (p)
   - CTA tlacitko "Zacit zdarma" / "Vyzkousejte demo"
   - Vizualni prvek: 3D model animace nebo ilustrace
   - Pozadi: gradient nebo pattern

2. **Feature grid**
   - 3-4 karty v gridu
   - Kazda karta: ikona + nadpis + kratky popis
   - Featurae: Rychla kalkulace, Presne ceny, Widget pro web, Multi-format podpora

3. **Jak to funguje (How it works)**
   - 3-krokovy vizualni pruvod
   - Krok 1: Nahrajte 3D model (ikona upload)
   - Krok 2: Nastavte parametry tisku (ikona nastaveni)
   - Krok 3: Ziskejte okamzitou cenu (ikona penize)
   - Spojovaci linka nebo sipky mezi kroky

4. **Logo marquee**
   - Horizontalni bezici pas s logy partneru/technologii
   - Logotypy: PrusaSlicer, Bambu Lab, Creality, Prusa Research, atd.

5. **Cenove plany**
   - Prepinac mesicni/rocni
   - 3 cenove karty: Free / Pro / Enterprise
   - Kazda karta: nazev, cena, feature list, CTA tlacitko
   - Prostredni karta zvyraznena (featured/recommended)

6. **FAQ sekce**
   - Rozklikavaci otazky a odpovedi (Accordion)
   - 5-8 nejcastejsich otazek

7. **Finalni CTA**
   - Velky text "Pripraveni na presne kalkulace?"
   - CTA tlacitko
   - Gradient nebo specialni pozadi

8. **Footer**

**Pouzite komponenty:**
- Header, Footer, Button, Card
- SpotlightCard, LogoMarquee, Accordion, FaqTabs
- MeshGradient, Reveal, MotionNumber
- BackgroundPattern, WelcomeHeader

**Responsivita:**
- Hero: text + vizual vedle sebe → pod sebe na mobilu
- Feature grid: 3-4 sloupce → 2 → 1
- Cenove karty: 3 vedle sebe → stack na mobilu
- Logo marquee: jedna rada, mensi loga

---

### 2.2 LOGIN (`/login`)

**Layout:** Centrovany formular, moznost split-screen
**Soubor:** `src/pages/login/index.jsx`

**Sekce:**

1. **Logo + nazev aplikace** (centrovane nahore)
2. **Login formular**
   - Email input (type="email", required)
   - Heslo input (type="password", required, show/hide toggle)
   - "Zapamatovat si me" checkbox
   - Submit tlacitko "Prihlasit se"
3. **Social login**
   - Oddelovac "nebo"
   - Google tlacitko
   - GitHub tlacitko (volitelne)
4. **Pomocne linky**
   - "Zapomenute heslo?" link
   - "Nemante ucet? Registrujte se" link
5. **Prepinac jazyka** (CS/EN)

**Komponenty:** LoginHeader, LoginForm, LoginActions, SocialLogin, LanguageToggle, Input, Button, Checkbox

**Responsivita:** Vzdy centrovany, max-width 420px

---

### 2.3 REGISTER (`/register`)

**Layout:** Centrovany formular s progress steps
**Soubor:** `src/pages/register/index.jsx`

**Sekce:**

1. **Progress steps** (3 kroky)
   - Krok 1: Osobni udaje
   - Krok 2: Vyber role
   - Krok 3: Nastaveni firmy

2. **Registracni formular (krok 1)**
   - Jmeno input
   - Prijmeni input
   - Email input
   - Heslo input (s indikaterem sily)
   - Potvrzeni hesla input

3. **Vyber role (krok 2)**
   - Radio karty: Owner / Admin / Team Member
   - Kazda karta: ikona + nazev + popis role

4. **Nastaveni firmy (krok 3)**
   - Nazev firmy input
   - Logo upload (drag & drop mini zona)
   - Web URL input (volitelne)

5. **Submit** — "Dokoncit registraci"
6. **Link na login** — "Uz mate ucet?"

**Komponenty:** RegistrationForm, ProgressSteps, RoleSelectionCard, LanguageToggle, Input, Button, FileUploadZone (mini)

---

### 2.4 TEST KALKULACKA (`/test-kalkulacka`)

**Layout:** 5-step wizard se stepperem
**Soubor:** `src/pages/test-kalkulacka/index.jsx` (800+ radku)

**Stepper (5 kroku):**
```
[1. Upload] → [2. Konfigurace] → [3. Cena] → [4. Objednavka] → [5. Potvrzeni]
```

#### Krok 1: Upload souboru

**Vizualni struktura:**
```
┌─────────────────────────────────────────┐
│           Stepper (5 kroku)             │
├─────────────────────────────────────────┤
│                                         │
│    ┌───────────────────────────────┐    │
│    │                               │    │
│    │     [Upload ikona]            │    │
│    │                               │    │
│    │  Pretahnete soubor sem        │    │
│    │  nebo kliknete pro vyber      │    │
│    │                               │    │
│    │  .STL .3MF .OBJ .STEP        │    │
│    │  Max 100MB                    │    │
│    └───────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Komponenty:** FileUploadZone (drag & drop, progress bar, format validace, error hlasky)

#### Krok 2: 3D nahled + Print konfigurace

**Vizualni struktura:**
```
┌─────────────────────────────────────────┐
│           Stepper (5 kroku)             │
├──────────────────┬──────────────────────┤
│                  │                      │
│   3D Model       │  Print konfigurace   │
│   Viewer         │                      │
│                  │  Material: [select]  │
│   [Three.js      │  Barva:    [paleta]  │
│    canvas]       │  Kvalita:  [select]  │
│                  │  Infill:   [slider]  │
│                  │  Mnozstvi: [input]   │
│                  │                      │
│                  │  ┌─────┬─────┬─────┐ │
│   [Rotate][Zoom] │  │Basic│Middl│ Pro │ │
│   [Reset][Full]  │  │     │     │     │ │
│                  │  └─────┴─────┴─────┘ │
│                  │                      │
│                  │  [Vypocitat cenu →]  │
└──────────────────┴──────────────────────┘
```

**Komponenty:**
- ModelViewer (Three.js canvas, STLLoader/OBJLoader/3MFLoader, OrbitControls, ambient+directional light)
- PrintConfiguration:
  - Material Select (dropdown s barevnym indicatorem)
  - Color Select (barevne terky/swatche)
  - Quality Select (dropdown: 0.1mm, 0.15mm, 0.2mm, 0.3mm)
  - Infill Slider (0-100%, kroky po 5%)
  - Quantity Input (number, min 1)
  - PresetCards (radio-style horizontalni karty: Basic/Middle/Pro)
- GenerateButton (s loading stavem)

#### Krok 3: Cenovy prehled

**Vizualni struktura:**
```
┌─────────────────────────────────────────┐
│           Stepper (5 kroku)             │
├─────────────────────────────────────────┤
│                                         │
│   Model: cube.stl                       │
│   Material: PLA Oranzova                │
│   Kvalita: 0.2mm | Infill: 20%         │
│   Mnozstvi: 3 ks                        │
│                                         │
│   ─────────────────────────────────     │
│   Zakladni cena         150.00 Kc      │
│   + Povinny poplatok     25.00 Kc      │
│   + Barevny priplatek    10.00 Kc      │
│   - Volume sleva (-10%)  -18.50 Kc     │ ← zeleny badge
│   + Markup (15%)         24.98 Kc      │
│   ─────────────────────────────────     │
│   CELKEM                191.48 Kc      │ ← velke cislo
│                                         │
│   [▼ Detailni rozpis kalkulace]         │ ← collapsible
│                                         │
│   [← Zpet]      [Pokracovat k checkout →]│
└─────────────────────────────────────────┘
```

**Komponenty:**
- PricingCalculator:
  - Cenove radky (label + castka)
  - Fee radky (MODEL fees, ORDER fees)
  - DiscountBadge ("-10%" zeleny badge)
  - VolumeDiscountHint ("Objednejte 5+ a usetrete 5%!")
  - Breakdown collapsible (detailni kalkulace)
  - Total radek (zvyrazneny)
- Button (Zpet, Pokracovat)

#### Krok 4: Checkout formular

**Vizualni struktura:**
```
┌─────────────────────────────────────────────┐
│              Stepper (5 kroku)               │
├──────────────────────┬──────────────────────┤
│                      │                      │
│  Shrnuti objednavky  │  Kontaktni formular  │
│                      │                      │
│  ┌──────────────┐    │  Jmeno*: [_______]   │
│  │ cube.stl     │    │  Prijmeni*: [____]   │
│  │ PLA, 3ks     │    │  Email*: [_______]   │
│  │ 150.00 Kc    │    │  Telefon: [______]   │
│  └──────────────┘    │                      │
│                      │  ── Dodaci adresa ── │
│  Mezisouce: 150 Kc   │  Ulice*: [________]  │
│  Poplatky:  +35 Kc   │  Mesto*: [________]  │
│  Sleva:     -18 Kc   │  PSC*:   [_______]   │
│  Markup:    +25 Kc    │  Stat:   [select]    │
│  ──────────────────   │                      │
│  CELKEM: 192 Kc      │  [x] Stejna fakturacni│
│                      │                      │
│                      │  Poznamka: [textarea] │
│                      │  (234/1000 znaku)     │
│                      │                      │
│                      │  [x] Souhlas GDPR*   │
│                      │                      │
│                      │  [Odeslat objednavku]│
└──────────────────────┴──────────────────────┘
```

**Komponenty:**
- OrderSummary:
  - OrderSummaryModelRow (nazev, material, qty, cena)
  - OrderSummaryPricing (mezisouc, poplatky, sleva, markup, celkem)
  - OrderSummaryServices (doplnkove sluzby)
- ContactForm (react-hook-form + zod):
  - FormField (text, email, tel — reusable)
  - AddressGroup (ulice, mesto, PSC, stat)
  - GdprCheckbox (povinny, s linkem na privacy policy)
  - OrderNote (textarea s pocitadlem znaku, max 1000)
  - SubmitButton (s loading stavem)

#### Krok 5: Potvrzeni objednavky

**Vizualni struktura:**
```
┌─────────────────────────────────────────┐
│           Stepper (5 kroku) ✓           │
├─────────────────────────────────────────┤
│                                         │
│              ✓ (zelena fajfka)          │
│                                         │
│     Dekujeme za objednavku!             │
│                                         │
│     Cislo objednavky: #MP-2024-0042     │
│     Odhadovany cas: 3-5 pracovnich dni  │
│                                         │
│     ┌──────────────────────────────┐    │
│     │ Shrnuti objednavky           │    │
│     │ cube.stl, PLA, 3ks = 192 Kc │    │
│     │ Kontakt: jan@example.com     │    │
│     └──────────────────────────────┘    │
│                                         │
│     Potvrzeni bylo odeslano na email    │
│                                         │
│     [Nova objednavka] [Zpet na uvod]   │
└─────────────────────────────────────────┘
```

**Komponenty:** OrderConfirmation (cislo, shrnuti, kontakt, CTA tlacitka)

---

### 2.5 WIDGET KALKULACKA (`/widget-kalkulacka`)

**Layout:** Stejna 5-step struktura jako test-kalkulacka, s upravami:
**Soubor:** `src/pages/widget-kalkulacka/index.jsx`

**Rozdily od test-kalkulacky:**
- Bez checkout kroku (konci cenou) — 3 nebo 4 kroky
- Theme CSS promenne (56 vlastnosti) z widget builderu
- Builder mode (postMessage komunikace s builder iframe)
- Vlastni header (WidgetHeader — logo, nadpis, tagline)
- Vlastni stepper (WidgetStepper — vizualne propojeny s theme)
- Vlastni footer (WidgetFooter — powered by, linky)
- Skeleton loading (WidgetSkeleton — pri nacitani konfigurace)

**Specificke komponenty:**
- WidgetHeader: logo (konfigurovatelne), nazev, tagline
- WidgetStepper: kroky se selection, tema barvy
- WidgetFooter: "Powered by ModelPricer" + custom linky
- WidgetSkeleton: shimmer nacitani pro vsechny sekce

**Theme integrace:**
- 56 CSS promennych injektovanych pres `themeToCssVars()`
- Kategorie: Header, Upload, Stepper, Config, Fees, Summary, CTA, Footer, Typography, Effects, Loading, Text

---

### 2.6 ADMIN LAYOUT

**Layout:** Sidebar (240px) + hlavni obsah
**Soubor:** `src/pages/admin/AdminLayout.jsx`

**Vizualni struktura:**
```
┌────────────┬───────────────────────────────────┐
│            │                                   │
│  SIDEBAR   │         HLAVNI OBSAH              │
│  (240px)   │         (<Outlet />)              │
│            │                                   │
│  Logo      │                                   │
│  ────────  │                                   │
│            │                                   │
│  HLAVNI    │                                   │
│  Dashboard │                                   │
│  Branding  │                                   │
│            │                                   │
│  CENY      │                                   │
│  Pricing   │                                   │
│  Fees      │                                   │
│  Presets   │                                   │
│  Parameters│                                   │
│            │                                   │
│  PROVOZ    │                                   │
│  Orders    │                                   │
│  Widget    │                                   │
│  Analytics │                                   │
│  Team      │                                   │
│            │                                   │
│  ────────  │                                   │
│  User info │                                   │
│  Logout    │                                   │
└────────────┴───────────────────────────────────┘
```

**Sidebar navigacni skupiny (stavajici + budouci):**
```
HLAVNI
  - Dashboard
  - Branding

CENY
  - Pricing
  - Fees
  - Presets
  - Parameters
  - Shipping*         (F2)
  - Promotions*       (F3)

PROVOZ
  - Orders
  - Orders Kanban*    (F3)
  - Customers*        (F5)

NASTROJE
  - Widget (config)
  - Widget Builder
  - Email Templates*  (F3)
  - Documents (PDF)*  (F5)

ANALYTIKA
  - Analytics
  - CRM*              (F6)

NASTAVENI
  - Team
  - Localization*     (F6)
  - API Portal*       (F6)
  - Security*         (F6)
  - Technologies*     (F7)
  - Integrations*     (F7)

(* = planovane)
```

---

### 2.7 ADMIN DASHBOARD (`/admin`)

**Soubor:** `src/pages/admin/AdminDashboard.jsx`

**Sekce:**

1. **Uvitaci karta**
   - "Dobry den, [jmeno]!"
   - Dnesni datum
   - Rychly prehled stavu

2. **Stat karty (4 v radku)**
   ```
   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
   │ Objednavky │ │   Obrat    │ │  Widgety   │ │ Zakaznici  │
   │    12      │ │  45,230 Kc │ │     3      │ │    28      │
   │   +23%     │ │   +15%     │ │    --      │ │   +8%      │
   └────────────┘ └────────────┘ └────────────┘ └────────────┘
   ```

3. **Graf: Objednavky za 30 dni**
   - Line/bar chart (Recharts)
   - Prepinac: Objednavky / Obrat / Kalkulace

4. **Posledni objednavky (tabulka)**
   - Sloupce: # | Zakaznik | Castka | Status | Datum
   - 5-10 poslednich radku
   - Status badge (Nova, Zpracovava se, Hotovo, Odeslano)

5. **Rychle akce**
   - Vytvorit widget
   - Upravit ceny
   - Zobrazit analytiku

---

### 2.8 ADMIN PRICING (`/admin/pricing`)

**Soubor:** `src/pages/admin/AdminPricing.jsx` (2500+ radku)

**Tab navigace:**
```
[Material] [Kvalita] [Casova cena] [Markup] [Minima] [Zaokrouhlovani] [Volume discounts]
```

**Tab: Material**
- Material tabulka (CRUD):
  - Sloupce: Barva dot | Nazev | Cena/g | Hustota | Barvy | Akce
  - Pridani materialu (modal nebo inline)
  - Editace materialu (modal)
  - Smazani s potvrzenim
  - Barevne terky v radku materialu

**Tab: Kvalita**
- Quality tabulka: Nazev vrstvy | Vyska (mm) | Rychlost | Popis

**Tab: Casova cena**
- Input: Cena za hodinu tisku (Kc/h)
- Toggle: Pouzit casovou cenu

**Tab: Markup**
- Typ markup: Procento / Fixni castka / Obe
- Procento input (%)
- Fixni castka input (Kc)

**Tab: Minima**
- Minimalni cena objednavky input (Kc)
- Minimalni cena modelu input (Kc)

**Tab: Zaokrouhlovani**
- Zaokrouhlovaci metoda: Nahoru / Dolu / Matematicke
- Na kolik desetinnych mist: 0 / 1 / 2
- Zaokrouhlit na: 1 / 5 / 10

**Tab: Volume discounts**
- Toggle: Zapnout/Vypnout
- Mode: Procento / Fixni cena za kus
- Scope: Per-model / Per-order
- Tier editor tabulka:
  ```
  ┌────────────┬────────────┬─────────────┬────────┐
  │ Min mnozstvi│ Max mnozstvi│ Sleva (%)   │ Akce   │
  ├────────────┼────────────┼─────────────┼────────┤
  │ 1          │ 4          │ 0%          │ [x]    │
  │ 5          │ 9          │ 5%          │ [x]    │
  │ 10         │ 24         │ 10%         │ [x]    │
  │ 25         │ --         │ 15%         │ [x]    │
  └────────────┴────────────┴─────────────┴────────┘
  [+ Pridat tier]
  ```
- Preview tabulka (priklad kalkulace pro 1, 5, 10, 25, 50 ks)

---

### 2.9 ADMIN FEES (`/admin/fees`)

**Soubor:** `src/pages/admin/AdminFees.jsx`

**Sekce:**

1. **MODEL fees** (aplikovane per model)
   - Tabulka: Nazev | Typ (fixni/procento) | Castka | Povinny | Viditelny | Akce
   - Pridani (modal)
   - Editace (modal)

2. **ORDER fees** (aplikovane per objednavka)
   - Stejna tabulka jako MODEL fees
   - Oddelena sekce

**Fee editor modal:**
- Nazev (CS/EN)
- Typ: Fixni castka / Procento ze zakladu
- Castka / Procento input
- Povinny toggle
- Viditelny toggle (zobrazit zakaznikovi?)
- Popis (volitelne)

---

### 2.10 ADMIN ORDERS (`/admin/orders`)

**Soubor:** `src/pages/admin/AdminOrders.jsx`

**Sekce:**

1. **Filtry**
   - Status dropdown (Vse, Nova, Zpracovava se, Hotovo, Odeslano, Doruceno)
   - Datum od-do (date picker)
   - Vyhledavani (text input — cislo objednavky, email zakaznika)
   - Prepinac zobrazeni: Tabulka / Kanban (budouci)

2. **Objednavky tabulka**
   - Sloupce: # | Datum | Zakaznik | Email | Castka | Status | Akce
   - Sortovatelne sloupce (klikem na header)
   - Pagination (10/25/50 na stranku)
   - Status badge (barevne kodovane)

3. **Detail objednavky** (modal nebo podstranka)
   - Zakaznicke udaje
   - Model(y) s parametry
   - Cenovy rozpis
   - Status timeline
   - Poznamky

---

### 2.11 ADMIN WIDGET (`/admin/widget`)

**Soubor:** `src/pages/admin/AdminWidget.jsx`

**4 taby:**

1. **Konfigurace** (WidgetConfigTab)
   - Seznam vytvorenych widgetu (karty)
   - Vytvoreni noveho widgetu (+ tlacitko)
   - Nazev, popis, aktivni toggle

2. **Nastaveni** (WidgetSettingsTab)
   - Pokrocile nastaveni: max soubor, povolene formaty, jazyk, mena

3. **Domeny** (WidgetDomainsTab)
   - Whitelist domen (tabulka s pridavanim/odebiram)
   - Domena input + pridat tlacitko
   - "Povolit vsechny domeny" toggle (pro testovani)

4. **Embed kod** (WidgetEmbedTab)
   - Kopirovatelny HTML/JS snippet
   - Iframe varianta
   - Script tag varianta
   - Nahled: widget ID, URL

---

### 2.12 WIDGET BUILDER (`/admin/widget/builder/:id`)

**Layout:** Fullscreen, 3 panely, VZDY tmavy theme
**Soubor:** `src/pages/admin/builder/BuilderPage.jsx`

**Vizualni struktura:**
```
┌───────────────────────────────────────────────────────┐
│  TOPBAR (56px)                                        │
│  [Logo] [Widget name]  [Undo][Redo]  [📱📲🖥]  [Save] │
├──────────────┬────────────────────────────────────────┤
│              │                                        │
│  LEFT PANEL  │         RIGHT PANEL                    │
│  (35%)       │         (65%)                          │
│              │                                        │
│  [Elements]  │    ┌────────────────────────┐          │
│  [Style]     │    │                        │          │
│  [Global]    │    │   DEVICE PREVIEW       │          │
│              │    │   FRAME                │          │
│  ─────────   │    │                        │          │
│              │    │   (iframe s widget-    │          │
│  Property    │    │    kalkulackou)        │          │
│  editors:    │    │                        │          │
│              │    │                        │          │
│  Color: [🎨] │    │                        │          │
│  Size:  [12] │    │                        │          │
│  Font:  [...] │   │                        │          │
│  Show:  [✓]  │    └────────────────────────┘          │
│              │                                        │
└──────────────┴────────────────────────────────────────┘
```

**Left panel taby:**
- **Elements:** Seznam editovatelnych prvku (header, upload zone, stepper, config, fees, summary, CTA, footer). Klikem na prvek → zobrazi jeho properties.
- **Style:** Property editory pro vybrany prvek (TextPropertyEditor, NumberPropertyEditor, BooleanPropertyEditor, ColorPropertyEditor, SelectPropertyEditor)
- **Global:** Celkove nastaveni (font family, global padding, card shadow, theme preset selector)

**Right panel:**
- DevicePreviewFrame: iframe s widget-kalkulackou
- Device switcher: Desktop (100%) / Tablet (768px) / Mobile (375px)
- Klikatelne prvky: selection outline modra, hover outline polopruhledna modra

**Dalsi komponenty:**
- QuickThemeDropdown: prednastavene theme presety
- BuilderColorPicker: barevny vybirac s eyedropper
- OnboardingOverlay: pruvode pro prvni pouziti (5 kroku)
- useBuilderState hook: stav builderu (vybrany prvek, tema, undo/redo)
- useElementSelection hook: kliknuti na prvky v iframe
- useUndoRedo hook: Ctrl+Z / Ctrl+Y

---

### 2.13 ADMIN ANALYTICS (`/admin/analytics`)

**Soubor:** `src/pages/admin/AdminAnalytics.jsx`

**Sekce:**

1. **KPI karty (4 v radku)**
   - Konverzni pomer (kalkulace → objednavka)
   - Prumerny obrat na objednavku
   - Celkovy pocet kalkulaci
   - Pocet novych zakazniku

2. **Hlavni graf** (Recharts)
   - Prepinac: Objednavky / Prijmy / Kalkulace
   - Casovy rozsah: 7 dni / 30 dni / 90 dni / Rok
   - Line chart nebo bar chart

3. **Top materialy tabulka**
   - Material | Pocet pouziti | Podil (%)

4. **Top zakaznici tabulka**
   - Zakaznik | Pocet objednavek | Celkova utrata

---

### 2.14-2.25 PLANOVANE STRANKY (kratky popis)

#### 2.14 SHIPPING ADMIN (`/admin/shipping`) — F2
- Shipping metody CRUD tabulka
- Method editor modal (nazev CS/EN, typ ceny, fixed/weight-based, free threshold, delivery days, ikona)
- Weight-based tier editor
- Personal pickup sekce (adresa, oteviraci hodiny)
- Globalni nastaveni

#### 2.15 COUPONS (`/admin/promotions`) — F3
- Kupony CRUD tabulka (kod, typ, castka, platnost, pouziti, status)
- Kupon editor modal
- Statistiky pouziti
- Filtr aktivni/neaktivni

#### 2.16 EMAIL TEMPLATES (`/admin/emails`) — F3
- Seznam sablonu (karty nebo tabulka)
- WYSIWYG editor sablony
- Preview desktop/mobile
- Promenne inserter sidebar
- Testovaci odeslani

#### 2.17 ORDERS KANBAN (`/admin/orders/kanban`) — F3
- Horizontalni kanban board
- Sloupce: Nova | V priprave | Tiskne se | Hotovo | Odeslano | Doruceno
- KanbanCard: cislo, zakaznik, castka, cas, priority
- Drag & drop
- Filtry, quick actions

#### 2.18 PDF TEMPLATES (`/admin/documents`) — F5
- Seznam sablonu (Cenova nabidka, Faktura, Dodaci list)
- HTML-based editor
- Preview s mock daty
- Branding injection (logo, barvy)

#### 2.19 CUSTOMER PORTAL (`/admin/customers`) — F5
- Zakaznici tabulka (jmeno, email, objednavky, utrata)
- Detail zakaznika (kontakt, historie, graf utraty, poznamky)
- Segmentace (VIP, novy, neaktivni)

#### 2.20 LOCALIZATION (`/admin/localization`) — F6
- Jazyky tabulka (CS, EN, DE, ...)
- Key-value prekladovy editor
- Import/Export JSON
- Auto-translate navrhy

#### 2.21 API PORTAL (`/admin/api`) — F6
- API klice sprava (generovani, mazani, regenerace)
- Interaktivni endpoint dokumentace
- Webhook konfigurace (URL, events, secret, retry)
- Usage statistiky (grafy)

#### 2.22 CRM & MARKETING (`/admin/crm`) — F6
- Zakaznicke segmenty (tabulka + editor pravidel)
- Email kampane (seznam, editor, statistiky)
- Automatizace (trigger → akce workflow editor)

#### 2.23 SECURITY (`/admin/security`) — F6
- 2FA nastaveni (toggle, QR kod, backup kody)
- Login historie (tabulka: cas, IP, lokace, status)
- IP whitelist (tabulka)
- Audit log (timeline vsech akci)

#### 2.24 TECHNOLOGIES/PRINTERS (`/admin/technologies`) — F7
- Tiskarny CRUD tabulka (nazev, typ, materialy, stav)
- Printer detail (specifikace, kalibrace historie)
- Material-printer kompatibilita matice
- PrusaSlicer profily sprava

#### 2.25 E-COMMERCE INTEGRATIONS (`/admin/integrations`) — F7
- Dostupne integrace karty (Shopify, WooCommerce, Custom API)
- Setup wizard per integraci
- Sync status dashboard
- Webhook logy tabulka

---

## 3. KOMPLETNI SEZNAM KOMPONENT

### 3.1 Existujici UI komponenty (16)

| Komponenta | Soubor | Popis | Varianty |
|-----------|--------|-------|----------|
| Button | `components/ui/Button.jsx` | CVA tlacitko | default, primary, outline, ghost, gradient, destructive, link; sm/md/lg/icon |
| Card | `components/ui/Card.jsx` | Karta obalka | - |
| Input | `components/ui/Input.jsx` | Formularovy input | text, email, tel, number, password |
| Label | `components/ui/label.jsx` | Label k inputu | - |
| Select | `components/ui/Select.jsx` | Dropdown vyber | Radix-based |
| Checkbox | `components/ui/Checkbox.jsx` | Checkbox | Radix-based |
| Slider | `components/ui/Slider.jsx` | Range slider | Radix-based |
| Dialog | `components/ui/Dialog.jsx` | Modal dialog | Radix-based |
| Container | `components/ui/Container.jsx` | Layout obalka | - |
| Header | `components/ui/Header.jsx` | Hlavni navigace | Desktop/mobile, user menu, lang toggle |
| Footer | `components/ui/Footer.jsx` | Paticka | 3-4 sloupce |
| WelcomeHeader | `components/ui/WelcomeHeader.jsx` | Hero header | - |
| Icon | `components/ui/Icon.jsx` | Ikona wrapper | AppIcon |
| ColorPicker | `components/ui/ColorPicker.jsx` | Vybirac barev | react-colorful |
| Tooltip | `components/ui/tooltip.jsx` | Tooltip | Radix-based |
| BackgroundPattern | `components/ui/BackgroundPattern.jsx` | SVG pozadi | - |

### 3.2 Existujici marketing komponenty (14)

| Komponenta | Popis |
|-----------|-------|
| Sparkles | Trpytky animace |
| MotionNumber | Animovane cislo (countup) |
| LogoMarquee | Bezici pas logy |
| SpotlightCard | Karta s spotlight hover |
| ImageRipple | Obrazek s ripple efektem |
| ImageReveal | Obrazek s reveal animaci |
| InteractiveWorldMap | Interaktivni mapa |
| GlobalMap | Globalni mapa |
| Accordion | Rozklikavaci sekce |
| FaqTabs | FAQ s taby |
| Tabs | Genericke taby |
| GlossaryTerm | Slovnikovy termin tooltip |
| Reveal | Scroll reveal animace |
| MeshGradient | Animovany gradient pozadi |

### 3.3 Existujici kalkulacka komponenty (8)

| Komponenta | Soubor | Popis |
|-----------|--------|-------|
| FileUploadZone | `test-kalkulacka/components/FileUploadZone.jsx` | Drag & drop upload zona |
| ModelViewer | `test-kalkulacka/components/ModelViewer.jsx` | Three.js 3D nahled |
| PrintConfiguration | `test-kalkulacka/components/PrintConfiguration.jsx` | Konfigurace tisku |
| PricingCalculator | `test-kalkulacka/components/PricingCalculator.jsx` | Cenovy prehled |
| GenerateButton | `test-kalkulacka/components/GenerateButton.jsx` | Tlacitko kalkulace |
| ErrorBoundary | `test-kalkulacka/components/ErrorBoundary.jsx` | Error boundary |
| CheckoutForm | `test-kalkulacka/components/CheckoutForm.jsx` | Checkout formular (NOVY) |
| OrderConfirmation | `test-kalkulacka/components/OrderConfirmation.jsx` | Potvrzeni (NOVY) |

### 3.4 Existujici widget komponenty (4)

| Komponenta | Popis |
|-----------|-------|
| WidgetHeader | Widget hlavicka (logo, nazev, tagline) |
| WidgetStepper | Widget stepper (kroky, barvy z theme) |
| WidgetFooter | Widget paticka (powered by) |
| WidgetSkeleton | Widget skeleton loading |

### 3.5 Existujici builder komponenty (12+)

| Komponenta | Popis |
|-----------|-------|
| BuilderTopBar | Horni lista (logo, akce, device) |
| BuilderLeftPanel | Levy panel (taby, editory) |
| BuilderRightPanel | Pravy panel (preview) |
| DevicePreviewFrame | Iframe s device rameckem |
| QuickThemeDropdown | Prednastavena temata |
| BuilderColorPicker | Barevny vybirac |
| OnboardingOverlay | Pruvode prvnim pouzitim |
| ElementsTab | Tab s elementy |
| StyleTab | Tab se styly |
| GlobalTab | Tab s global nastavenimi |
| TextPropertyEditor | Editor textovych properties |
| NumberPropertyEditor | Editor ciselnych properties |
| BooleanPropertyEditor | Editor boolean properties |
| ColorPropertyEditor | Editor barevnych properties |
| SelectPropertyEditor | Editor select properties |

### 3.6 NOVE POTREBNE komponenty (30+)

| Komponenta | Faze | Popis | Pouziti na strankach |
|-----------|------|-------|---------------------|
| **Shipping** | | | |
| ShippingSelector | F2 | Vyber dopravy (radio karty) | Test kalkulacka, Widget |
| ShippingMethodCard | F2 | Karta metody dopravy | ShippingSelector |
| FreeShippingProgress | F2 | Progress bar k free shipping | Test kalkulacka, Widget |
| DeliveryEstimate | F2 | Odhad doruceni (datumovy rozsah) | Test kalkulacka |
| WeightTierEditor | F2 | Editor vahovych pasmek | Admin Shipping |
| **Coupons** | | | |
| CouponInput | F3 | Input pro promo kod | Test kalkulacka, Widget |
| CouponBadge | F3 | Badge aplikovaneho kuponu | PricingCalculator |
| CouponEditor | F3 | Editor kuponu (modal) | Admin Promotions |
| **Kanban** | | | |
| KanbanBoard | F3 | Kanban deska | Admin Orders Kanban |
| KanbanColumn | F3 | Sloupec kanban desky | KanbanBoard |
| KanbanCard | F3 | Karta v kanban sloupci | KanbanColumn |
| KanbanFilters | F3 | Filtry pro kanban | Admin Orders Kanban |
| **Email** | | | |
| EmailTemplateEditor | F3 | WYSIWYG editor sablony | Admin Emails |
| EmailPreview | F3 | Preview sablony (desktop/mobile) | Admin Emails |
| EmailVariableInserter | F3 | Vkladani promennych | EmailTemplateEditor |
| **3D Formaty** | | | |
| FormatBadge | F2 | Badge s detekovanym formatem | FileUploadZone |
| ConversionStatus | F2 | Status konverze STEP→STL | FileUploadZone |
| ValidationBadge | F2 | Badge validity souboru | FileUploadZone |
| FormatInfoTooltip | F2 | Info o podporovanych formatech | FileUploadZone |
| **Volume Discounts** | | | |
| VolumeDiscountsSection | F1 | Sekce v AdminPricing | Admin Pricing |
| VolumeDiscountTiersTable | F1 | Tabulka tier editoru | VolumeDiscountsSection |
| VolumeDiscountPreview | F1 | Preview kalkulace | VolumeDiscountsSection |
| DiscountBadge | F1 | Badge slevy ("-10%") | PricingCalculator |
| VolumeDiscountHint | F1 | Hint "Objednejte 5+ a usetrete" | PrintConfiguration |
| DiscountTiersPopover | F1 | Popover s vsemi tiery | PricingCalculator |
| **Customers** | | | |
| CustomerList | F5 | Seznam zakazniku (tabulka) | Admin Customers |
| CustomerDetail | F5 | Detail zakaznika | Admin Customers |
| CustomerOrderHistory | F5 | Historie objednavek | CustomerDetail |
| **API** | | | |
| APIKeyManager | F6 | Sprava API klicu | Admin API |
| WebhookConfig | F6 | Konfigurace webhooku | Admin API |
| EndpointDocs | F6 | Dokumentace endpointu | Admin API |
| **Technology** | | | |
| TechnologyCard | F7 | Karta technologie/tiskarny | Admin Technologies |
| PrinterConfig | F7 | Konfigurace tiskarny | Admin Technologies |
| MaterialCompatMatrix | F7 | Material-printer matice | Admin Technologies |
| **Integration** | | | |
| IntegrationCard | F7 | Karta integrace | Admin Integrations |
| IntegrationWizard | F7 | Setup wizard integrace | Admin Integrations |
| SyncStatusDashboard | F7 | Status synchronizace | Admin Integrations |

---

## 4. KOMPONENTNI HIERARCHIE

```
App
├── Header (globalni, skryty na /w/*, /admin/widget/builder/*)
├── Routes
│   ├── Public pages
│   │   ├── Home
│   │   │   ├── WelcomeHeader → Button
│   │   │   ├── SpotlightCard[] → Icon
│   │   │   ├── LogoMarquee
│   │   │   ├── Card[] (pricing) → Button
│   │   │   ├── FaqTabs → Accordion
│   │   │   └── MeshGradient
│   │   ├── Login
│   │   │   ├── Input[] (email, password)
│   │   │   ├── Checkbox (remember)
│   │   │   ├── Button (submit)
│   │   │   └── Button[] (social login)
│   │   ├── Register
│   │   │   ├── ProgressSteps
│   │   │   ├── Input[] (name, email, password)
│   │   │   ├── RoleSelectionCard[]
│   │   │   └── Button (submit)
│   │   ├── TestKalkulacka
│   │   │   ├── Stepper
│   │   │   ├── FileUploadZone → FormatBadge, ValidationBadge
│   │   │   ├── ModelViewer (Three.js)
│   │   │   ├── PrintConfiguration
│   │   │   │   ├── Select (material, quality)
│   │   │   │   ├── ColorSwatches
│   │   │   │   ├── Slider (infill)
│   │   │   │   ├── Input (quantity)
│   │   │   │   ├── PresetCards
│   │   │   │   └── VolumeDiscountHint
│   │   │   ├── GenerateButton
│   │   │   ├── PricingCalculator
│   │   │   │   ├── PriceRow[] (zaklad, fees, markup)
│   │   │   │   ├── DiscountBadge
│   │   │   │   ├── DiscountTiersPopover
│   │   │   │   └── Total
│   │   │   ├── ShippingSelector (F2)
│   │   │   │   ├── ShippingMethodCard[]
│   │   │   │   ├── FreeShippingProgress
│   │   │   │   └── DeliveryEstimate
│   │   │   ├── CouponInput (F3)
│   │   │   ├── CheckoutForm
│   │   │   │   ├── OrderSummary
│   │   │   │   │   ├── OrderSummaryModelRow[]
│   │   │   │   │   └── OrderSummaryPricing
│   │   │   │   ├── ContactForm
│   │   │   │   │   ├── FormField[] (name, email, phone)
│   │   │   │   │   ├── AddressGroup (shipping)
│   │   │   │   │   ├── AddressGroup (billing, toggle)
│   │   │   │   │   ├── OrderNote (textarea + counter)
│   │   │   │   │   └── GdprCheckbox
│   │   │   │   └── SubmitButton
│   │   │   └── OrderConfirmation
│   │   └── ...other public pages
│   │
│   ├── Admin (AdminLayout → Sidebar + Outlet)
│   │   ├── AdminDashboard
│   │   │   ├── StatCard[] (4x)
│   │   │   ├── Chart (Recharts)
│   │   │   ├── DataTable (orders)
│   │   │   └── Button[] (quick actions)
│   │   ├── AdminPricing
│   │   │   ├── Tabs
│   │   │   ├── DataTable (materials) → Dialog (editor)
│   │   │   ├── Input[] (markup, minima, rounding)
│   │   │   ├── VolumeDiscountsSection
│   │   │   │   ├── Toggle
│   │   │   │   ├── Select (mode, scope)
│   │   │   │   ├── VolumeDiscountTiersTable → Input[]
│   │   │   │   └── VolumeDiscountPreview
│   │   │   └── Button (save)
│   │   ├── AdminFees
│   │   │   ├── DataTable (model fees) → Dialog (editor)
│   │   │   └── DataTable (order fees) → Dialog (editor)
│   │   ├── AdminOrders
│   │   │   ├── Filters (Select, Input, DatePicker)
│   │   │   ├── DataTable → StatusBadge
│   │   │   └── Dialog (order detail)
│   │   ├── AdminShipping (F2)
│   │   │   ├── DataTable (methods) → Dialog (editor)
│   │   │   ├── WeightTierEditor
│   │   │   └── PersonalPickup section
│   │   ├── AdminPromotions (F3)
│   │   │   ├── DataTable (coupons) → Dialog (editor)
│   │   │   └── UsageStats
│   │   ├── AdminEmails (F3)
│   │   │   ├── TemplateList (cards)
│   │   │   ├── EmailTemplateEditor → EmailVariableInserter
│   │   │   └── EmailPreview
│   │   ├── AdminOrdersKanban (F3)
│   │   │   ├── KanbanFilters
│   │   │   └── KanbanBoard → KanbanColumn[] → KanbanCard[]
│   │   └── ...dalsi admin pages
│   │
│   ├── Widget Builder (/admin/widget/builder/:id)
│   │   ├── BuilderTopBar → Button[], DeviceSwitcher
│   │   ├── BuilderLeftPanel
│   │   │   ├── ElementsTab → ElementList
│   │   │   ├── StyleTab → PropertyEditor[]
│   │   │   └── GlobalTab → PropertyEditor[]
│   │   └── BuilderRightPanel → DevicePreviewFrame (iframe)
│   │
│   └── Widget Public (/w/:publicWidgetId)
│       └── WidgetKalkulacka
│           ├── WidgetHeader
│           ├── WidgetStepper
│           ├── FileUploadZone
│           ├── ModelViewer
│           ├── PrintConfiguration
│           ├── PricingCalculator
│           ├── WidgetFooter
│           └── WidgetSkeleton (loading)
│
└── Footer (globalni, skryty na /w/*, /admin/widget/builder/*)
```

---

## 5. LAYOUT TYPY

### 5.1 Full-width Marketing
- Header (fixni nahore)
- Hlavni obsah (plna sirka, sekce pod sebou)
- Footer
- Pouziti: Home, Pricing, Support

### 5.2 Centrovany Formular
- Header (fixni nahore)
- Centrovany box (max-width 420-480px)
- Volitelne: split-screen s vizualem
- Footer
- Pouziti: Login, Register, Invite Accept

### 5.3 Admin Sidebar
- Header (skryty nebo minimalni)
- Sidebar (240px levy, collapsible na 64px)
- Hlavni obsah (zbytek sirky, padding 24-32px)
- Bez footeru
- Pouziti: Vsechny /admin/* stranky

### 5.4 5-Step Wizard
- Header (fixni nahore)
- Stepper (horizontalni, pod headerem)
- Obsah kroku (centrovany, max-width 960-1200px)
- Footer (skryty nebo minimalni)
- Pouziti: Test kalkulacka, Widget kalkulacka

### 5.5 Fullscreen Editor
- Vlastni topbar (56px)
- Levy panel (35%)
- Pravy panel (65%)
- Bez header/footer
- Pouziti: Widget Builder

### 5.6 Standalone Embed
- Zadny header/footer
- Plna sirka iframe kontejneru
- Theme CSS promenne z host stranky
- Pouziti: Widget Public (/w/:id)

---

## 6. RESPONSIVNI BREAKPOINTY

| Breakpoint | Sirka | Pouziti |
|-----------|-------|---------|
| `sm` | >= 640px | Mobilni landscape |
| `md` | >= 768px | Tablet |
| `lg` | >= 1024px | Desktop |
| `xl` | >= 1280px | Velky desktop |
| `2xl` | >= 1536px | Ultra-wide |

**Klicove responsivni zmeny:**
- **< 768px:** Sidebar → overlay drawer, 2-sloupcove layouty → 1 sloupec, stepper horizontalni → vertikalni
- **< 1024px:** Admin obsah plna sirka, builder panely → taby
- **>= 1024px:** Plne layouty
