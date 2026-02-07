# Redesign Varianta A: "INDUSTRIAL / COMMAND CENTER"

> Kompletni designova specifikace pro industrialni/technickou variantu.
> Filozofie: Ridici panel 3D tiskove farmy. Precizni, technicky, jako cockpit.
> Inspirace: SpaceX ridici centra, PrusaSlicer UI, terminaly, blueprint vykresy.

---

## 1. BAREVNA PALETA

### 1.1 Pozadi (4 urovne elevation)

| Uroven | Nazev | HEX | RGB | Pouziti |
|--------|-------|-----|-----|---------|
| 0 | Base | `#08090C` | 8, 9, 12 | Pozadi stranky, sidebar bg |
| 1 | Surface | `#0F1117` | 15, 17, 23 | Karty, panely, content area |
| 2 | Elevated | `#181B23` | 24, 27, 35 | Modaly, dropdowny, hover bg |
| 3 | Overlay | `#1E222D` | 30, 34, 45 | Aktivni prvky, selected state |

### 1.2 Text (4 urovne)

| Uroven | HEX | RGB | Kontrast na Surface | Pouziti |
|--------|-----|-----|---------------------|---------|
| Primary | `#E8ECF4` | 232, 236, 244 | 14.2:1 | Hlavni text, nadpisy, ceny |
| Secondary | `#8B95A8` | 139, 149, 168 | 6.8:1 | Podnadpisy, popisky, meta |
| Muted | `#505A6E` | 80, 90, 110 | 3.9:1 | Placeholdery, disabled text |
| Disabled | `#353D4F` | 53, 61, 79 | 2.4:1 | Neaktivni prvky, bordery |

### 1.3 Akcentove barvy

| Nazev | HEX | RGB | Pouziti |
|-------|-----|-----|---------|
| Nozzle Orange (Primary) | `#FF6B35` | 255, 107, 53 | CTA, hlavni akce, aktivni stavy |
| Nozzle Orange Hover | `#E85A28` | 232, 90, 40 | Hover stav primary |
| Nozzle Orange Subtle | `rgba(255,107,53,0.12)` | — | Jemne pozadi, focus ring |
| Filament Teal (Secondary) | `#00D4AA` | 0, 212, 170 | Sekundarni akce, uspech, aktivni |
| Filament Teal Hover | `#00B894` | 0, 184, 148 | Hover stav secondary |
| Filament Teal Subtle | `rgba(0,212,170,0.12)` | — | Jemne pozadi |
| Heat Yellow (Warning) | `#FFB830` | 255, 184, 48 | Varovani, pozor |
| Stop Red (Error) | `#FF4757` | 255, 71, 87 | Chyby, smazani, destructive |
| Blueprint Blue (Info) | `#4A9EFF` | 74, 158, 255 | Informacni, linky, hovery |

### 1.4 Specialni barvy (3D tisk inspirace)

| Nazev | HEX | Inspirace |
|-------|-----|-----------|
| PLA Orange | `#FF8C42` | Prusa oranzovy filament |
| PETG Blue | `#3498DB` | Modry PETG filament |
| ASA Gray | `#7F8C8D` | Sedy ASA material |
| Nylon White | `#DFE6E9` | Bily nylonovy filament |
| ABS Black | `#2D3436` | Cerny ABS material |
| TPU Flex Red | `#E74C3C` | Cerveny flexibilni TPU |
| Build Plate | `#2D3436` | Tmava tiskova podlozka |

### 1.5 Gradienty

```
Nozzle Glow:    linear-gradient(135deg, #FF6B35 0%, #FF4757 100%)
Cool Tech:      linear-gradient(135deg, #00D4AA 0%, #4A9EFF 100%)
Depth:          linear-gradient(180deg, #08090C 0%, #0F1117 100%)
Ambient:        radial-gradient(ellipse at center, #181B23 0%, #08090C 70%)
```

### 1.6 Bordery a oddeleni

| Prvek | Barva | Sirka |
|-------|-------|-------|
| Card border | `#1E222D` | 1px solid |
| Divider (horizontal) | `#1E222D` | 1px solid |
| Active border | `#FF6B35` | 2-3px solid |
| Focus ring | `rgba(255,107,53,0.25)` | 0 0 0 3px |
| Table border | `#1E222D` | 1px solid (bottom only) |
| Input border | `#353D4F` | 1px solid |
| Input focus border | `#FF6B35` | 1px solid |

---

## 2. TYPOGRAFIE

### 2.1 Font stack

| Role | Font | Fallback | Import |
|------|------|----------|--------|
| Heading | **JetBrains Mono** | 'Courier New', monospace | Google Fonts |
| Body | **Inter** | -apple-system, sans-serif | Google Fonts |
| Technical | **JetBrains Mono** | 'Courier New', monospace | (sdileny s heading) |
| Label | **Inter** | -apple-system, sans-serif | (sdileny s body) |

### 2.2 Velikostni skala

| Nazev | Velikost | Line-height | Letter-spacing | Pouziti |
|-------|----------|-------------|----------------|---------|
| h1 | 36px (2.25rem) | 1.2 (43px) | -0.02em | Page titles |
| h2 | 28px (1.75rem) | 1.25 (35px) | -0.01em | Section headings |
| h3 | 22px (1.375rem) | 1.3 (29px) | 0 | Card headings, subsections |
| h4 | 18px (1.125rem) | 1.35 (24px) | 0 | Small headings |
| body | 15px (0.938rem) | 1.6 (24px) | 0 | Hlavni text |
| body-sm | 13px (0.813rem) | 1.5 (20px) | 0 | Maly text, meta |
| body-xs | 11px (0.688rem) | 1.45 (16px) | 0 | Mini text, timestamps |
| label | 11px (0.688rem) | 1.2 (13px) | 0.08em | Labels (UPPERCASE) |
| price | 18px (1.125rem) | 1.2 | -0.01em | Ceny (monospace) |
| price-lg | 28px (1.75rem) | 1.1 | -0.02em | Celkova cena (monospace) |
| tech | 13px (0.813rem) | 1.4 | 0 | Technicke udaje (monospace) |
| code | 14px (0.875rem) | 1.5 | 0 | Kod, G-code (monospace) |

### 2.3 Pravidla pouziti

- **Headings (h1-h4):** JetBrains Mono 700, barva `#E8ECF4`
- **Body text:** Inter 400, barva `#E8ECF4` (primary) nebo `#8B95A8` (secondary)
- **Labels:** Inter 600, 11px, UPPERCASE, letter-spacing 0.08em, barva `#8B95A8`
- **Ceny:** JetBrains Mono 700, barva `#E8ECF4` nebo `#FF6B35` (total)
- **Technicke udaje:** JetBrains Mono 400, barva `#8B95A8`
- **Linky:** Inter 500, barva `#4A9EFF`, underline on hover
- **Tlacitka:** Inter 500, 14-15px

---

## 3. SPACING SYSTEM

### 3.1 Zakladni hodnoty

| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `space-1` | 4px | Micro gaps, icon-text |
| `space-2` | 8px | Tight padding, small gaps |
| `space-3` | 12px | Input padding vertical |
| `space-4` | 16px | Card padding internal |
| `space-5` | 18px | Non-standard gap (anti-AI) |
| `space-6` | 22px | Section gap small |
| `space-7` | 28px | Card padding generous |
| `space-8` | 32px | Section padding |
| `space-9` | 44px | Large section gap |
| `space-10` | 56px | Page section separator |
| `space-11` | 72px | Hero padding |
| `space-12` | 88px | Extra large hero padding |

### 3.2 Specificke spacing pravidla

- **Page padding (desktop):** 32px horizontal, 44px vertical
- **Page padding (mobile):** 16px horizontal, 28px vertical
- **Card padding:** 22px (ne 24px — anti-AI!)
- **Card gap:** 18px (ne 16px — anti-AI!)
- **Section gap:** 72px (velkorysé)
- **Input height:** 40px (md), 32px (sm), 48px (lg)
- **Button height:** 40px (md), 32px (sm), 48px (lg)
- **Sidebar width:** 240px (expanded), 64px (collapsed)
- **Header height:** 56px
- **Topbar height (builder):** 56px

---

## 4. BORDER RADIUS

| Prvek | Radius | Pouziti |
|-------|--------|---------|
| Button | 6px | Vsechny tlacitka |
| Input | 6px | Vsechny inputy |
| Card | 8px | Karty, kontejnery |
| Modal | 12px | Dialogy, modaly |
| Badge | 4px | Status badges |
| Pill | 999px | Tags, pills |
| Upload zone | 12px | Drag & drop zona |
| Avatar | 999px (circle) | Uzivatelske avatary |

---

## 5. STINY A ELEVATION

| Uroven | Shadow | Pouziti |
|--------|--------|---------|
| Level 0 | none | Zakladni prvky |
| Level 1 | `0 1px 3px rgba(0,0,0,0.3)` | Karty |
| Level 2 | `0 4px 12px rgba(0,0,0,0.4)` | Hover karty, dropdown |
| Level 3 | `0 8px 24px rgba(0,0,0,0.5)` | Modaly |
| Level 4 | `0 16px 48px rgba(0,0,0,0.6)` | Overlay dialogy |
| Glow (orange) | `0 0 20px rgba(255,107,53,0.3)` | CTA highlight |
| Glow (teal) | `0 0 20px rgba(0,212,170,0.3)` | Success highlight |

---

## 6. LAYOUT KAZDE STRANKY

### 6.1 HEADER (globalni)

```
┌──────────────────────────────────────────────────────┐
│ [MODEL.PRICER]         [Home][Demo][Pricing][Support]│
│                                          [CS|EN] [👤]│
└──────────────────────────────────────────────────────┘
```

**Specifikace:**
- **Vyska:** 56px
- **Pozadi:** `#0F1117` (Surface)
- **Spodni border:** 1px solid `#1E222D`
- **Logo:** "MODEL" v `#E8ECF4` + "." v `#FF6B35` + "PRICER" v `#E8ECF4`, JetBrains Mono 700, 18px
- **Nav linky:** Inter 400, 14px, `#8B95A8`, spacing 28px
- **Aktivni link:** `#E8ECF4`, 2px bottom border `#FF6B35`
- **Hover link:** `#E8ECF4`, transition 150ms
- **Jazyk prepinac:** "CS" | "EN", monospace 12px, `#505A6E`, aktivni `#E8ECF4`
- **User menu:** Avatar kruh 32px, dropdown na klik
- **Position:** sticky top 0, z-index 1000
- **Mobile (< 768px):** Logo vlevo, hamburger ikona vpravo (3 thin linky, 18px). Klik → fullscreen overlay `#08090C` s velkymi nav linky (24px, centrovane).

### 6.2 FOOTER (globalni)

```
┌──────────────────────────────────────────────────────┐
│  MODEL.PRICER          PRODUKT    PODPORA    LEGAL   │
│                        Demo       Kontakt    Podminky│
│  Precizni kalkulace    Cenik      FAQ        Soukromi│
│  pro 3D tisk.          API        Docs               │
│                                                       │
│ ─────────────────────────────────────────────────── │
│  v2.1.0                                    2024-2026 │
└──────────────────────────────────────────────────────┘
```

**Specifikace:**
- **Pozadi:** `#08090C` (Base — temnější nez content)
- **Horni border:** 1px solid `#1E222D`
- **Padding:** 56px top, 28px bottom
- **Logo:** Stejna jako header, ale 16px
- **Sloupce:** 4-sloupcovy grid na desktopu, 2 na tabletu, 1 na mobilu
- **Linky:** Inter 400, 13px, `#505A6E`, hover `#8B95A8`
- **Nadpisy sloupcu:** Inter 600, 11px, UPPERCASE, `#8B95A8`, letter-spacing 0.08em
- **Spodni cast:** 1px horna linka `#1E222D`, verze v monospace `#353D4F` 11px, copyright `#505A6E`

### 6.3 ADMIN SIDEBAR

```
┌────────────────┐
│ [MP Logo]      │
│ Firma ABC      │
│ ────────────── │
│                │
│ HLAVNI         │
│ ▌ Dashboard    │ ← aktivni (oranzovy levy border)
│   Branding     │
│                │
│ CENY           │
│   Pricing      │
│   Fees         │
│   Presets      │
│   Parameters   │
│                │
│ PROVOZ         │
│   Orders       │
│   Widget       │
│   Analytics    │
│   Team         │
│                │
│                │
│                │
│ ────────────── │
│ 👤 Jan Novak   │
│    Odhlasit    │
│ [◀ Collapse]   │
└────────────────┘
```

**Specifikace:**
- **Sirka:** 240px (expanded), 64px (collapsed — jen ikony)
- **Pozadi:** `#0B0E14` (o stupen tmavsi nez content `#0F1117`)
- **Pravy border:** 1px solid `#1E222D`
- **Logo area:** Padding 22px, logo + tenant nazev (Inter 500, 14px, `#E8ECF4`)
- **Skupina label:** Inter 600, 11px, UPPERCASE, `#505A6E`, letter-spacing 0.08em, padding-left 18px, margin-top 22px
- **Nav item:** Flex row, 40px vyska, padding 0 18px, gap 12px (ikona + text)
  - Text: Inter 400, 14px, `#8B95A8`
  - Ikona: 18px, `#505A6E`
  - Hover: bg `#181B23`, text `#E8ECF4`, ikona `#8B95A8`, transition 150ms
  - Aktivni: levy border 3px `#FF6B35`, bg `rgba(255,107,53,0.08)`, text `#E8ECF4`, ikona `#FF6B35`
- **Oddeleni skupin:** 1px linka `#1E222D`, margin 12px vertical
- **Spodni cast:** Fixed bottom, padding 18px
  - User info: avatar 28px + jmeno + role (Inter 400, 12px, `#505A6E`)
  - Logout: text link, `#505A6E`, hover `#FF4757`
  - Collapse button: ikona sipka, `#505A6E`, hover `#8B95A8`
- **Collapse animace:** Width 240px → 64px, 250ms cubic-bezier. Text fade out 120ms. Ikony zustanou centrovane.
- **Mobile (< 768px):** Overlay drawer zleva, 280px sirka, `#0B0E14` bg, overlay `rgba(0,0,0,0.5)` na pozadi. Slide-in 250ms.

### 6.4 HOME PAGE

**Sekce 1: Hero**
```
┌──────────────────────────────────────────────────────┐
│                                                       │
│        ╔══════════════════╗                           │
│        ║  Grid pattern bg  ║                          │
│        ╚══════════════════╝                           │
│                                                       │
│   Presne kalkulace              [3D Model]            │
│   pro 3D tisk.                  [Pomalu rotuje]       │
│                                  [Three.js]           │
│   Automatizujte cenove                                │
│   nabidky s presnosti                                 │
│   na halire.                                          │
│                                                       │
│   [Zacit zdarma →]                                   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

- **Pozadi:** `#08090C` s SVG grid patternem (tenke linky `#1E222D`, 40px spacing — blueprint efekt)
- **Layout:** Asymetricky — text 55% vlevo, 3D model 45% vpravo
- **Nadpis:** JetBrains Mono 700, 36px, `#E8ECF4`
- **Podnadpis:** Inter 400, 18px, `#8B95A8`, max-width 480px
- **CTA:** Primary button s glow efektem (`box-shadow: 0 0 20px rgba(255,107,53,0.3)`)
- **3D model:** Pomala Y rotace (10s cyklus), ambient + directional light, wireframe moznost
- **Padding:** 88px vertical
- **Mobile:** Text nad modelem, centrovane, model mensi (250px)

**Sekce 2: Features**
```
┌──────────────────────────────────────────────────────┐
│                                                       │
│   ┌─────────────────────┐  ┌───────────┐ ┌─────────┐│
│   │                     │  │           │ │         ││
│   │  [Ikona]            │  │  [Ikona]  │ │ [Ikona] ││
│   │  Presna kalkulace   │  │  Widget   │ │ Multi-  ││
│   │                     │  │  embed    │ │ format  ││
│   │  Popis...           │  │           │ │         ││
│   │                     │  │  Popis... │ │ Popis...││
│   └─────────────────────┘  └───────────┘ └─────────┘│
│                                                       │
└──────────────────────────────────────────────────────┘
```

- **Layout:** Asymetricky grid — 1 velka karta (span 2 cols) + 2 male karty
- **Karta:** bg `#0F1117`, border 1px `#1E222D`, border-radius 8px, padding 28px
- **Hover:** border zmeni na `#00D4AA`, transition 200ms
- **Ikona:** Custom SVG, 32px, `#FF6B35`
- **Nadpis:** JetBrains Mono 600, 18px, `#E8ECF4`
- **Popis:** Inter 400, 14px, `#8B95A8`

**Sekce 3: Jak to funguje**
```
   [1]──────────[2]──────────[3]
   Upload       Nastaveni     Cena
```

- **Layout:** 3 kroky horizontalne s spojovaci linkou (thin 1px dashed `#353D4F`)
- **Cisla:** JetBrains Mono 700, 28px, `#FF6B35`, v kruhu s borderem
- **Text:** Nadpis mono 16px + popis Inter 13px
- **Pozadi:** Subtle blueprint grid pattern
- **Mobile:** Vertikalni s vertikalni linkou

**Sekce 4: Logo Marquee**
- Bezici pas logy, opacity 0.4, hover opacity 0.7
- Pozadi: transparent, jen 1px horni a spodni border `#1E222D`
- Rychlost: 18s infinite linear

**Sekce 5: Cenove plany**
- 3 karty, prostredni featured (border `#FF6B35`, badge "Doporuceno")
- Ceny: JetBrains Mono 700, 28px
- Features: Inter 400, 14px, checkmarky v `#00D4AA`
- Toggle mesicni/rocni: pill prepinac s `#FF6B35` aktivnim

**Sekce 6: FAQ**
- Accordion prvky, thin bottom border
- Otazka: Inter 500, 16px, `#E8ECF4`
- Odpoved: Inter 400, 14px, `#8B95A8`
- Ikona +/- : monospace, `#FF6B35`

**Sekce 7: CTA**
- Gradient pozadi: `linear-gradient(135deg, #FF6B35 0%, #FF4757 100%)` s noise 3%
- Velky text: JetBrains Mono 700, 28px, `#FFFFFF`
- Tlacitko: bile, `#08090C` text

### 6.5 LOGIN PAGE

- **Layout:** Split-screen — levy panel (3D model ambient animace, bg `#08090C`), pravy panel (formular, bg `#0F1117`)
- **Levy panel (55%):** Pomaly rotujici 3D model, jemne osvetleni, wireframe efekt. Dole: "MODEL.PRICER" logo.
- **Pravy panel (45%):** Centrovany formular
  - Nadpis: "Prihlaseni" JetBrains Mono 700, 24px
  - Email input (40px, bg `#08090C`, border `#353D4F`)
  - Heslo input (40px, bg `#08090C`, border `#353D4F`, show/hide toggle)
  - Checkbox "Zapamatovat" (sm)
  - CTA tlacitko "Prihlasit se" (48px, full-width, `#FF6B35`)
  - Divider "nebo" (linka + text)
  - Social buttony (Google, GitHub) — outline styl
  - Linky: "Zapomenute heslo?" , "Registrace"
- **Mobile:** Jen pravy panel na plnou sirku, 3D model skryty

### 6.6 TEST KALKULACKA

**Stepper:**
```
  (1)────(2)────(3)────(4)────(5)
  ✓       ●      ○      ○      ○
Upload  Config  Cena  Checkout Hotovo
```

- Spojovaci linka: 2px, `#353D4F` (neaktivni), `#00D4AA` (dokonceny)
- Kolecka: 28px, border 2px
  - Dokonceny: bg `#00D4AA`, border `#00D4AA`, fajfka bila
  - Aktivni: bg transparent, border `#FF6B35`, cislo `#FF6B35`
  - Budouci: bg transparent, border `#353D4F`, cislo `#505A6E`
- Text: Inter 500, 12px, UPPERCASE, barva odpovida stavu
- Mobile: Jen cisla bez textu, mensi (24px)

**Upload zona:**
- Pozadi: `#0B0E14` s jemnym dot grid patternem
- Border: 2px dashed `#353D4F`, radius 12px
- Ikona: Upload sipka v `#FF6B35`, 48px, pulsujici animace (breathing 3s)
- Text: "Pretahnete 3D model nebo kliknete" Inter 400, 16px, `#8B95A8`
- Podporovane formaty: badge radka dole — `.STL` `.3MF` `.OBJ` `.STEP` v monospace 11px, bg `#181B23`, radius 4px
- Drag-over stav: border solid `#FF6B35`, bg `rgba(255,107,53,0.05)`, glow
- Uspesny upload: Zelena fajfka, nazev souboru, velikost v monospace

**3D Viewer:**
- Pozadi: `#08090C` s radialnim gradientem (center `#0F1117`)
- Border: 1px `#1E222D`, radius 8px
- Ovladaci panel: Absolutne poziciovany dole, bg `rgba(15,17,23,0.85)` s backdrop-blur 8px, radius 6px, padding 8px
  - Ikony: Rotate, Zoom, Reset, Wireframe toggle, Fullscreen — `#505A6E`, hover `#E8ECF4`
- Loading: Wireframe outline se postupne vykresluje (stroke-dasharray animace)
- Model: Ambient light 0.4, directional light 0.8, mesh material `#8B95A8`

**Print konfigurace:**
- Card bg `#0F1117`, border 1px `#1E222D`, radius 8px, padding 22px
- Kazdy input v sekci s label nahore (UPPERCASE, 11px, `#8B95A8`)
- Material select: Barevny dot indicator (12px kruh) vedel nazvu materialu
- Color swatche: Grid 6x4, 28px kruhy, selected = oranzovy ring
- Infill slider: Draha `#353D4F`, vyplnena `#FF6B35`, thumb 16px kruh
- Quantity: Number input, + a - tlacitka po stranach
- Preset karty (horizontal row):
  ```
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ ⚡ Basic  │ │ ★ Middle │ │ 🛡 Pro   │
  │ 0.3mm    │ │ 0.2mm    │ │ 0.1mm    │
  │ 15% inf  │ │ 20% inf  │ │ 30% inf  │
  └──────────┘ └──────────┘ └──────────┘
  ```
  - Radio styl: selected = border `#FF6B35`, bg `rgba(255,107,53,0.08)`
  - Neselected: border `#353D4F`, bg transparent
  - Ikona: monospace symbol, 18px, barva odpovida stavu

**Cenovy prehled:**
- Cenove radky: flex between, label Inter 400 14px `#8B95A8`, castka JetBrains Mono 500 14px `#E8ECF4`
- Fee radky: stejne, ale castka muze byt `#FF6B35` (navyse) nebo `#00D4AA` (sleva)
- Discount badge: bg `rgba(0,212,170,0.12)`, text `#00D4AA`, border-radius 4px, padding 2px 8px, font 12px mono
- Separator: 1px dashed `#353D4F`
- Total radek: JetBrains Mono 700, 22px, `#FF6B35`
- Breakdown toggle: "Detailni rozpis ▼" — Inter 400, 13px, `#4A9EFF`, klik expand

**Checkout (2 sloupce):**
- Levy: OrderSummary — card bg `#0F1117`, border, sticky top 80px
- Pravy: ContactForm — inputy pod sebou, card bg `#0F1117`
- Mobile: Summary nad formularem (ne sticky)

**Potvrzeni:**
- Centrovana karta, bg `#0F1117`, max-width 560px
- Zelena fajfka: `#00D4AA`, 64px, kruh s borderem
- Nadpis: JetBrains Mono 600, 22px
- Cislo objednavky: monospace, `#FF6B35`
- Shrnuti: mensi karta vevnitr
- CTA tlacitka: 2 v radku (primary + ghost)

### 6.7 ADMIN DASHBOARD

```
┌────────────────────────────────────────────────────┐
│  Dobry den, Jane!                    Dnesni datum  │
├────────────┬────────────┬────────────┬─────────────┤
│ OBJEDNAVKY │   OBRAT    │  WIDGETY   │  ZAKAZNICI  │
│    12      │  45 230 Kc │     3      │     28      │
│   +23% ↑   │  +15% ↑    │     --     │    +8% ↑    │
│ ▁▂▃▅▇▆▄▃▂ │ ▁▁▂▃▄▅▆▇▇█│            │ ▁▂▂▃▃▄▅▅▆▇│
├────────────┴────────────┴────────────┴─────────────┤
│                                                     │
│  [Objednavky ▼]                    [7d|30d|90d|1y] │
│                                                     │
│   █                                                 │
│   █  █                                    █         │
│   █  █  █     █                    █  █   █         │
│   █  █  █  █  █  █     █  █  █  █  █  █   █  █     │
│  ─────────────────────────────────────────────────  │
│  Po Ut St Ct Pa So Ne Po Ut St Ct Pa So Ne         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  POSLEDNI OBJEDNAVKY                   [Vsechny →] │
│  # | Datum     | Zakaznik        | Castka | Status │
│  ──────────────────────────────────────────────── │
│  42| 07.02.2026| Jan Novak       | 192 Kc | ● Nova │
│  41| 06.02.2026| Eva Svobodova   | 450 Kc | ● Hot. │
│  40| 05.02.2026| Petr Dvorak     | 89 Kc  | ● Odesl│
├─────────────────────────────────────────────────────┤
│  RYCHLE AKCE                                        │
│  [+ Widget]    [Upravit ceny]    [Analytika]       │
└─────────────────────────────────────────────────────┘
```

**Stat karty:**
- bg `#0F1117`, border 1px `#1E222D`, radius 8px, padding 22px
- Label: UPPERCASE 11px, `#505A6E`
- Cislo: JetBrains Mono 700, 28px, `#E8ECF4`
- Trend: 13px, `#00D4AA` (pozitivni) nebo `#FF4757` (negativni), s sipkou
- Sparkline: 40px vyska, jemna cara v `#353D4F`, dole v karte
- Hover: border `#1E222D` → `#353D4F`

**Graf:**
- bg `#0F1117`, border, padding 22px
- Cara/sloupce: `#FF6B35` primary, `#00D4AA` secondary
- Grid: tenke linky `#1E222D`
- Osy: monospace 11px, `#505A6E`
- Tooltip: bg `#181B23`, border `#353D4F`, shadow level 2

**Tabulka:**
- Header: UPPERCASE 11px, `#505A6E`, bg `#0B0E14`, padding 12px 18px
- Radky: alternating `#0F1117` / `#0B0E14`, padding 12px 18px, hover `#181B23`
- Status badge: rounded pill, 11px
  - Nova: bg `rgba(255,107,53,0.12)`, text `#FF6B35`
  - Zpracovava: bg `rgba(74,158,255,0.12)`, text `#4A9EFF`
  - Hotovo: bg `rgba(0,212,170,0.12)`, text `#00D4AA`
  - Odeslano: bg `rgba(139,149,168,0.12)`, text `#8B95A8`

### 6.8 ADMIN PRICING (detailni)

**Tab navigace:**
- Horizontal tabs, bg transparent
- Tab item: Inter 500, 14px, `#505A6E`, padding 12px 18px
- Aktivni: `#E8ECF4`, bottom border 2px `#FF6B35`
- Hover: `#8B95A8`

**Material tabulka:**
- Radek: barevny dot (12px kruh, barva materialu) | Nazev | Cena/g (monospace) | Hustota (monospace) | Barvy count | Edit + Delete ikony
- Edit ikona: `#505A6E`, hover `#4A9EFF`
- Delete ikona: `#505A6E`, hover `#FF4757`

**Material editor modal:**
- bg `#181B23`, border 1px `#353D4F`, radius 12px
- Overlay: `rgba(0,0,0,0.6)` s backdrop-blur 4px
- Nadpis: JetBrains Mono 600, 20px
- Inputy: vertikalne pod sebou, 44px vyska
- Save button: Primary `#FF6B35`
- Cancel: Ghost button

**Volume discounts:**
- Toggle: custom switch, 44px x 22px, on=`#FF6B35`, off=`#353D4F`
- Mode select: 2 radio buttony inline
- Tier tabulka: editable inputy v radcich
  - Add tier: ghost button "+ Pridat tier"
  - Remove: X ikona, `#505A6E`, hover `#FF4757`
- Preview: bg `#0B0E14`, border, monospace ceny

### 6.9 WIDGET BUILDER

Zachovat stavajici tmave tema, aktualizovat barvy:
- TopBar bg: `#0B0E14` → `#08090C`
- Panel bg: `#0F1117`
- Accenty: `#3B82F6` → `#FF6B35`
- Success: `#10B981` → `#00D4AA`
- Text primary: `#F1F5F9` → `#E8ECF4`
- Text secondary: `#94A3B8` → `#8B95A8`
- Selection outline: `#3B82F6` → `#FF6B35`

### 6.10 BUDOUCI: KANBAN BOARD

```
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│    NOVA    │ V PRIPRAVE │  TISKNE SE │   HOTOVO   │  ODESLANO  │
│    (3)     │    (2)     │    (1)     │    (4)     │    (2)     │
│ ─────────  │ ─────────  │ ─────────  │ ─────────  │ ─────────  │
│ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │
│ │#MP-042 │ │ │#MP-039 │ │ │#MP-038 │ │ │#MP-035 │ │ │#MP-030 │ │
│ │J.Novak │ │ │E.Svob. │ │ │P.Dvora │ │ │A.Kral │ │ │M.Cerny │ │
│ │192 Kc  │ │ │450 Kc  │ │ │89 Kc   │ │ │310 Kc  │ │ │520 Kc  │ │
│ │2h ago  │ │ │1d ago  │ │ │3h ago  │ │ │2d ago  │ │ │5d ago  │ │
│ └────────┘ │ └────────┘ │ └────────┘ │ └────────┘ │ └────────┘ │
│ ┌────────┐ │ ┌────────┐ │            │ ┌────────┐ │ ┌────────┐ │
│ │#MP-041 │ │ │#MP-037 │ │            │ │#MP-034 │ │ │#MP-028 │ │
│ │...     │ │ │...     │ │            │ │...     │ │ │...     │ │
│ └────────┘ │ └────────┘ │            │ └────────┘ │ └────────┘ │
└────────────┴────────────┴────────────┴────────────┴────────────┘
```

- **Sloupce:** bg `#0B0E14`, border 1px `#1E222D`, radius 8px, min-width 240px
- **Header:** Label UPPERCASE 11px + count badge, barva per status:
  - Nova: `#FF6B35`, V priprave: `#4A9EFF`, Tiskne se: `#FFB830`, Hotovo: `#00D4AA`, Odeslano: `#8B95A8`
- **Karty:** bg `#0F1117`, border 1px `#1E222D`, radius 6px, padding 14px
  - Cislo: monospace 12px, `#E8ECF4`
  - Zakaznik: Inter 400, 13px, `#8B95A8`
  - Castka: monospace 14px, `#E8ECF4`
  - Cas: Inter 400, 11px, `#505A6E`
- **Drag:** Ghost 50% opacity, drop zona highlight `rgba(255,107,53,0.08)` border
- **Horizontal scroll:** Na mobilech scroll horizontalne

---

## 7. KOMPONENTY — DETAILNI SPECIFIKACE

### 7.1 Button

| Varianta | Pozadi | Text | Border | Hover |
|----------|--------|------|--------|-------|
| Primary | `#FF6B35` | `#FFFFFF` | none | bg `#E85A28`, glow |
| Secondary | transparent | `#E8ECF4` | 1px `#505A6E` | border `#00D4AA` |
| Ghost | transparent | `#8B95A8` | none | text `#E8ECF4`, bg `#181B23` |
| Destructive | transparent | `#FF4757` | 1px `#FF4757` | bg `#FF4757`, text `#FFF` |
| Link | transparent | `#4A9EFF` | none | underline |

**Velikosti:**

| Size | Vyska | Padding H | Font | Radius |
|------|-------|-----------|------|--------|
| sm | 32px | 12px | 13px | 6px |
| md | 40px | 18px | 14px | 6px |
| lg | 48px | 24px | 15px | 6px |
| icon | 40px | 0 (square) | — | 6px |

**Stavy:**
- **Disabled:** opacity 0.5, cursor not-allowed
- **Loading:** spinner (rotujici `⟳` nebo SVG) nahrazuje text, sirka zachovana
- **Focus:** ring `0 0 0 3px rgba(255,107,53,0.25)`

### 7.2 Card

| Varianta | Pozadi | Border | Shadow | Radius |
|----------|--------|--------|--------|--------|
| Default | `#0F1117` | 1px `#1E222D` | none | 8px |
| Elevated | `#181B23` | 1px `#353D4F` | level 1 | 8px |
| Interactive | `#0F1117` | 1px `#1E222D` | none | 8px |
| Stat | `#0F1117` | 1px `#1E222D` | none | 8px |

**Interactive hover:** border `#505A6E`, bg `#181B23`, transition 200ms
**Stat card:** velke cislo monospace + trend + sparkline

### 7.3 Input

- **Pozadi:** `#08090C`
- **Border:** 1px `#353D4F`
- **Radius:** 6px
- **Vyska:** 40px (md), 32px (sm), 48px (lg)
- **Padding:** 12px horizontal
- **Text:** Inter 400, 15px, `#E8ECF4`
- **Placeholder:** `#505A6E`
- **Focus:** border `#FF6B35`, ring `0 0 0 3px rgba(255,107,53,0.15)`
- **Error:** border `#FF4757`, error message Inter 400, 12px, `#FF4757` pod inputem
- **Disabled:** bg `#0B0E14`, text `#353D4F`, cursor not-allowed
- **Label:** nad inputem, Inter 600, 11px, UPPERCASE, `#8B95A8`, letter-spacing 0.08em, margin-bottom 6px

### 7.4 Select (Dropdown)

- Stejna zakladni styly jako Input
- Dropdown menu: bg `#181B23`, border 1px `#353D4F`, radius 8px, shadow level 2
- Option: padding 10px 14px, hover bg `#1E222D`, selected bg `rgba(255,107,53,0.08)` + text `#FF6B35`
- Arrow ikona: chevron down, `#505A6E`, rotate 180deg pri open

### 7.5 Toggle/Switch

- **Sirka:** 44px, **Vyska:** 22px
- **Off:** bg `#353D4F`, thumb `#8B95A8`
- **On:** bg `#FF6B35`, thumb `#FFFFFF`
- **Transition:** 200ms ease
- **Disabled:** opacity 0.5

### 7.6 Toast/Notification

- **Pozice:** Top-right, 18px od hrany
- **Pozadi:** `#181B23`
- **Border:** 1px `#353D4F`
- **Radius:** 8px
- **Shadow:** level 2
- **Levy border:** 3px, barva per typ
  - Success: `#00D4AA`
  - Error: `#FF4757`
  - Warning: `#FFB830`
  - Info: `#4A9EFF`
- **Ikona:** 18px, barva per typ
- **Text:** Inter 400, 14px, `#E8ECF4`
- **Popis:** Inter 400, 13px, `#8B95A8`
- **Dismiss:** X ikona, `#505A6E`, hover `#8B95A8`
- **Auto-dismiss:** 5s s progress bar (thin 2px, barva per typ, animace zleva doprava)
- **Animace:** Slide-in zprava 300ms, fade-out 200ms

### 7.7 Modal/Dialog

- **Overlay:** `rgba(0,0,0,0.6)`, backdrop-filter blur 4px
- **Dialog:** bg `#181B23`, border 1px `#353D4F`, radius 12px, shadow level 3
- **Max-width:** 480px (sm), 640px (md), 860px (lg)
- **Padding:** 28px
- **Header:** JetBrains Mono 600, 20px, `#E8ECF4`, margin-bottom 18px
- **Footer:** flex end, gap 12px, margin-top 28px
- **Close:** X ikona top-right, `#505A6E`, hover `#E8ECF4`
- **Animace:** Enter: scale 0.95→1.0 + opacity 0→1, 200ms. Exit: scale 1.0→0.95 + opacity 1→0, 150ms.

### 7.8 Badge

| Varianta | Pozadi | Text |
|----------|--------|------|
| Default | `rgba(139,149,168,0.12)` | `#8B95A8` |
| Orange | `rgba(255,107,53,0.12)` | `#FF6B35` |
| Teal | `rgba(0,212,170,0.12)` | `#00D4AA` |
| Red | `rgba(255,71,87,0.12)` | `#FF4757` |
| Blue | `rgba(74,158,255,0.12)` | `#4A9EFF` |
| Yellow | `rgba(255,184,48,0.12)` | `#FFB830` |

- **Radius:** 4px (rectangular) nebo 999px (pill)
- **Padding:** 2px 8px
- **Font:** Inter 500, 11px (nebo mono pro technicke)

---

## 8. ANIMACE A PRECHODY

### 8.1 Timing

| Nazev | Trvani | Easing | Pouziti |
|-------|--------|--------|---------|
| micro | 120ms | ease-out | Hover, focus, toggle, icon rotation |
| standard | 200ms | cubic-bezier(0.4,0,0.2,1) | Button press, badge appear |
| layout | 250ms | cubic-bezier(0.4,0,0.2,1) | Collapse, expand, tab switch |
| enter | 300ms | cubic-bezier(0,0,0.2,1) | Modal open, page transition |
| exit | 200ms | cubic-bezier(0.4,0,1,1) | Modal close, element remove |
| breathing | 3000ms | ease-in-out | CTA pulse, live indicator |
| loader | 1500ms | linear | Shimmer, spinner, progress ring |

### 8.2 Specificke animace

- **Hero 3D model:** `rotate(0, 1, 0)` — 10s linear infinite, pause on hover
- **Stat number countup:** 800ms ease-out, trigger on viewport enter (IntersectionObserver)
- **Sidebar collapse:** width 250ms, text opacity 120ms (out faster), icons reposition 250ms
- **Drag & drop ghost:** opacity 0.5, scale 1.02, pointer-events none
- **Price flip:** translateY -20→0 + opacity 0→1, 300ms, trigger on value change
- **Upload progress:** width 0→100%, linear, foreground `#FF6B35`
- **Toast enter:** translateX(100%)→0, 300ms
- **Toast exit:** opacity 1→0 + translateX 0→20px, 200ms
- **Page transition:** opacity 0→1 + translateY(8px→0), 300ms

### 8.3 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. BACKGROUND PATTERNS

### 9.1 Blueprint Grid
```svg
<pattern width="40" height="40">
  <line x1="0" y1="0" x2="40" y2="0" stroke="#1E222D" stroke-width="0.5"/>
  <line x1="0" y1="0" x2="0" y2="40" stroke="#1E222D" stroke-width="0.5"/>
</pattern>
```
Pouziti: Hero pozadi, admin content area

### 9.2 Dot Grid
```svg
<pattern width="20" height="20">
  <circle cx="1" cy="1" r="0.5" fill="#1E222D"/>
</pattern>
```
Pouziti: Upload zona pozadi, sidebar prazdny prostor

### 9.3 Noise Overlay
- CSS: `background-image: url(noise.svg)`, opacity 0.02-0.03
- Pouziti: Karty, hero pozadi, gradient overlay
