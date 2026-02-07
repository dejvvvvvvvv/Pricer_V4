# Redesign Varianta B: "PREMIUM / DESIGN STUDIO"

> Kompletni designova specifikace pro premium/elegantni variantu.
> Filozofie: High-end designove studio. Elegantni, minimalisticke, sofistikovane.
> Inspirace: Apple produktove stranky, Linear, Vercel, Raycast.

---

## 1. BAREVNA PALETA

### 1.1 Pozadi (4 urovne elevation)

| Uroven | Nazev | HEX | RGB | Pouziti |
|--------|-------|-----|-----|---------|
| 0 | Base | `#09090B` | 9, 9, 11 | Pozadi stranky (zinc-950) |
| 1 | Surface | `#18181B` | 24, 24, 27 | Karty, panely (zinc-900) |
| 2 | Elevated | `#27272A` | 39, 39, 42 | Modaly, dropdowny (zinc-800) |
| 3 | Overlay | `#3F3F46` | 63, 63, 70 | Hover stavy (zinc-700) |

> Poznamka: Na rozdil od Varianty A, ktera ma modravy podton (#08090C), Varianta B pouziva ciste neutralni zinc skalu — teplejsi, sofistikovanejsi dojem.

### 1.2 Text (4 urovne)

| Uroven | HEX | RGB | Kontrast na Surface | Pouziti |
|--------|-----|-----|---------------------|---------|
| Primary | `#FAFAFA` | 250, 250, 250 | 15.4:1 | Hlavni text, nadpisy (zinc-50) |
| Secondary | `#A1A1AA` | 161, 161, 170 | 7.1:1 | Podnadpisy, meta (zinc-400) |
| Muted | `#71717A` | 113, 113, 122 | 4.5:1 | Placeholdery (zinc-500) |
| Disabled | `#52525B` | 82, 82, 91 | 3.2:1 | Neaktivni (zinc-600) |

### 1.3 Akcentove barvy

| Nazev | HEX | RGB | Pouziti |
|-------|-----|-----|---------|
| Warm Amber (Primary) | `#F59E0B` | 245, 158, 11 | CTA, hlavni akce, zvyrazneni |
| Warm Amber Hover | `#D97706` | 217, 119, 6 | Hover stav |
| Warm Amber Subtle | `rgba(245,158,11,0.10)` | — | Jemne pozadi, badges |
| Cool Violet (Secondary) | `#8B5CF6` | 139, 92, 246 | Sekundarni akce, kreativni prvky |
| Cool Violet Hover | `#7C3AED` | 124, 58, 237 | Hover stav |
| Cool Violet Subtle | `rgba(139,92,246,0.10)` | — | Jemne pozadi |
| Success Green | `#22C55E` | 34, 197, 94 | Uspech, potvrzeni |
| Warning Yellow | `#EAB308` | 234, 179, 8 | Varovani |
| Error Red | `#EF4444` | 239, 68, 68 | Chyby, destructive |
| Link Blue | `#60A5FA` | 96, 165, 250 | Linky, info (blue-400) |

### 1.4 Specialni barvy (3D tisk, jemnejsi)

| Nazev | HEX | Inspirace |
|-------|-----|-----------|
| Warm PLA | `#F5A623` | Oranzovy filament, teplejsi ton |
| Cool PETG | `#6366F1` | Indigovy filament, premium |
| Silver ASA | `#94A3B8` | Stribrny/sedy material |
| Pearl White | `#F1F5F9` | Perlove bily nylon |
| Carbon Black | `#1E1E1E` | Carbon filament |
| Rose Gold | `#E8A87C` | Specialni filament barva |

### 1.5 Gradienty

```
Warm Glow:      linear-gradient(135deg, #F59E0B 0%, #8B5CF6 100%)
Surface Depth:  linear-gradient(135deg, #18181B 0%, #27272A 100%)
Ambient Light:  radial-gradient(ellipse at top, #27272A 0%, #09090B 70%)
Golden Hour:    linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)
```

### 1.6 Bordery a oddeleni

| Prvek | Barva | Sirka |
|-------|-------|-------|
| Card border | none (oddeleni kontrastem) | — |
| Divider | `#27272A` | 1px solid |
| Active indicator | `#F59E0B` | 2px solid |
| Focus ring | `rgba(245,158,11,0.20)` | 0 0 0 3px |
| Table divider | `#27272A` | 1px solid (bottom) |
| Input border | `#27272A` | 1px solid |
| Input focus border | `#F59E0B` | 1px solid |

> Klicovy rozdil od Var. A: Karty NEMAJI viditelny border — oddeleni je jen kontrastem pozadi (Surface na Base). Cistejsi, premium look.

---

## 2. TYPOGRAFIE

### 2.1 Font stack

| Role | Font | Fallback | Zdroj |
|------|------|----------|-------|
| Heading | **Instrument Serif** | Georgia, 'Times New Roman', serif | Google Fonts |
| Body | **Satoshi** | 'General Sans', -apple-system, sans-serif | Fontshare (free) |
| Technical | **Geist Mono** | 'SF Mono', 'JetBrains Mono', monospace | Vercel/npm |
| Label | **Satoshi** | -apple-system, sans-serif | (sdileny s body) |

> Klicovy rozdil: Serif heading font. AI NIKDY nepouziva serif fonty pro headings — toto je okamzite odlisujici faktor. Instrument Serif je elegantni, citelny a moderni.

### 2.2 Velikostni skala

| Nazev | Velikost | Line-height | Letter-spacing | Pouziti |
|-------|----------|-------------|----------------|---------|
| h1 | 48px (3rem) | 1.15 (55px) | -0.03em | Page titles (velke, serif, drama) |
| h2 | 36px (2.25rem) | 1.2 (43px) | -0.02em | Section headings |
| h3 | 24px (1.5rem) | 1.3 (31px) | -0.01em | Card headings |
| h4 | 20px (1.25rem) | 1.35 (27px) | 0 | Small headings |
| body | 16px (1rem) | 1.7 (27px) | 0 | Hlavni text (velkorysejsi line-height) |
| body-sm | 14px (0.875rem) | 1.6 (22px) | 0 | Sekundarni text |
| body-xs | 12px (0.75rem) | 1.5 (18px) | 0 | Meta, timestamps |
| label | 12px (0.75rem) | 1.3 (16px) | 0.02em | Labels (normal case, ne uppercase) |
| price | 20px (1.25rem) | 1.2 | -0.01em | Ceny (mono) |
| price-lg | 36px (2.25rem) | 1.1 | -0.02em | Celkova cena (mono, serif hybrid) |
| tech | 14px (0.875rem) | 1.4 | 0 | Technicke udaje (mono) |

### 2.3 Pravidla pouziti

- **Headings (h1-h4):** Instrument Serif 400 (regular — serif nepotrebuje bold), barva `#FAFAFA`
- **Heading italic:** Pro specialni zvyrazneni — Instrument Serif italic. Napr. slogany, citace zakazniku.
- **Body text:** Satoshi 400, barva `#FAFAFA` nebo `#A1A1AA`
- **Labels:** Satoshi 500, 12px, normal case (NE uppercase — to je Var. A styl), barva `#A1A1AA`
- **Ceny:** Geist Mono 500, barva `#FAFAFA` nebo `#F59E0B` (total)
- **Technicke udaje:** Geist Mono 400, barva `#A1A1AA`
- **Linky:** Satoshi 500, barva `#60A5FA`, underline on hover (ne vzdy)
- **Tlacitka:** Satoshi 500, 15px

---

## 3. SPACING SYSTEM

### 3.1 Zakladni hodnoty

| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `space-1` | 4px | Micro gaps |
| `space-2` | 8px | Tight padding |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Standard gap |
| `space-5` | 20px | Input padding |
| `space-6` | 24px | Card padding |
| `space-7` | 32px | Section padding |
| `space-8` | 40px | Large section gap |
| `space-9` | 56px | Page section separator |
| `space-10` | 72px | Hero padding |
| `space-11` | 96px | Extra large spacing |
| `space-12` | 120px | Maximum hero padding |

> Celkove velkorysejsi spacing nez Var. A — premium dojem vyzaduje vice "dychu" v layoutu.

### 3.2 Specificke pravidla

- **Page padding (desktop):** 40px horizontal, 56px vertical
- **Page padding (mobile):** 20px horizontal, 32px vertical
- **Card padding:** 24px (standard premium)
- **Card gap:** 20px
- **Section gap:** 96px (velice velkorysé)
- **Input height:** 48px (md — vetsi nez Var. A!), 40px (sm), 56px (lg)
- **Button height:** 44px (md), 36px (sm), 52px (lg)
- **Sidebar width:** 220px (uzsi, vzdusnejsi)
- **Header height:** 64px (vyssi nez Var. A — vice prestige)

---

## 4. BORDER RADIUS

| Prvek | Radius | Rozdil od Var. A |
|-------|--------|-----------------|
| Button | 12px | +6px (rounded) |
| Input | 12px | +6px |
| Card | 16px | +8px (vyrazne rounded) |
| Modal | 20px | +8px |
| Badge | 999px (pill vzdy) | Vzdy pill |
| Upload zone | 20px | +8px |
| Avatar | 999px | Stejny |
| Dropdown | 12px | +4px |

> Velke border-radius = premium dojem. Apple, Linear, Vercel vsichni pouzivaji 12-20px radius.

---

## 5. STINY A ELEVATION

| Uroven | Shadow | Pouziti |
|--------|--------|---------|
| Level 0 | none | Zakladni prvky |
| Level 1 | `0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` | Karty (default) |
| Level 2 | `0 8px 32px rgba(0,0,0,0.4)` | Hover karty |
| Level 3 | `0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)` | Modaly |
| Level 4 | `0 24px 64px rgba(0,0,0,0.6)` | Overlay |
| Glow (amber) | `0 0 24px rgba(245,158,11,0.25)` | CTA highlight |
| Glow (violet) | `0 0 24px rgba(139,92,246,0.25)` | Sekundarni highlight |

> Var. B pouziva stiny MISTO borderu na kartach — mekci, premium look.

---

## 6. LAYOUT KAZDE STRANKY

### 6.1 HEADER

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   ModelPricer       Home  Demo  Pricing  Support  [CS|EN] [👤] │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Specifikace:**
- **Vyska:** 64px (vyssi = premium)
- **Pozadi:** transparent (pri scrollu → `rgba(24,24,27,0.80)` s `backdrop-filter: blur(12px)`)
- **Logo:** "Model" v Instrument Serif italic `#FAFAFA` + "Pricer" v Satoshi 500 `#FAFAFA`. Nebo: serif "M" v `#F59E0B` + "odelPricer" v Satoshi.
- **Nav linky:** Satoshi 400, 15px, `#71717A`, spacing 32px
- **Aktivni link:** `#FAFAFA`, amber podtrzeni (2px, animovane zleva doprava)
- **Hover link:** `#A1A1AA`, transition 200ms
- **Position:** fixed top 0, z-index 1000
- **Transition:** bg color 300ms pri scrollu (transparent → blur)
- **Mobile:** Logo vlevo, hamburger vpravo (2 thin linky, 16px spacing). Menu → slide-down panel s blur pozadim.

### 6.2 FOOTER

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│     Product          Support         Legal             │
│     Demo             Contact         Terms             │
│     Pricing          FAQ             Privacy           │
│     API Docs         Community                         │
│                                                        │
│  ─────────────────────────────────────────────────     │
│                                                        │
│     ModelPricer                       Prague, CZ       │
│     Precision pricing                 2024-2026        │
│     for 3D printing.                                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

- **Pozadi:** `#09090B` (stejna jako page — splyne)
- **Horni border:** 1px `#27272A`
- **Padding:** 72px top, 40px bottom (hodne prostoru)
- **Nadpisy sloupcu:** Satoshi 500, 14px, `#FAFAFA`
- **Linky:** Satoshi 400, 14px, `#71717A`, hover `#A1A1AA`
- **Spodni cast:** Serif italic "ModelPricer" + tagline v `#52525B`, 14px
- **Mobile:** 2 sloupce, potom 1 sloupec

### 6.3 ADMIN SIDEBAR

```
┌─────────────────┐
│                  │
│  ModelPricer     │
│  Firma ABC      │
│                  │
│  ─────────────  │
│                  │
│  Overview        │
│  ▌Dashboard      │ ← amber levy border
│  Branding        │
│                  │
│  Pricing         │
│  Configuration   │
│  Fees            │
│  Presets         │
│                  │
│  Operations      │
│  Orders          │
│  Widget          │
│  Analytics       │
│  Team            │
│                  │
│                  │
│  ─────────────  │
│  Jan Novak       │
│  admin           │
│  Sign out        │
│                  │
└─────────────────┘
```

- **Sirka:** 220px (uzsi nez Var. A — vice vzdusna)
- **Pozadi:** `#09090B` (stejna jako page bg — nepusobi jako "oddeleny panel" ale jako soucast)
- **Pravy border:** 1px `#27272A`
- **Logo area:** Padding 24px, serif italic "ModelPricer" 16px, tenant nazev Satoshi 400 13px `#71717A`
- **Skupina label:** Serif italic, 12px, `#F59E0B` (amber — premium!), margin-top 28px
- **Nav item:** 44px vyska, padding 0 20px, gap 12px
  - Text: Satoshi 400, 15px, `#71717A`
  - Ikona: 18px, `#52525B`
  - Hover: text `#FAFAFA`, transition 200ms
  - Aktivni: levy border 2px `#F59E0B`, text `#FAFAFA`, bg `rgba(245,158,11,0.05)`
- **Spodni cast:** Satoshi 400, 13px, jmeno `#A1A1AA`, role `#52525B`, sign out `#71717A` hover `#EF4444`

### 6.4 HOME PAGE

**Sekce 1: Hero**
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│            Precision pricing                           │
│            for 3D printing.                            │
│                                                        │
│            Automate your quotes with                   │
│            accuracy down to the cent.                  │
│                                                        │
│                 [Get started]                          │
│                                                        │
│            ┌──────────────────────┐                    │
│            │                      │                    │
│            │   [3D model subtle]  │                    │
│            │                      │                    │
│            └──────────────────────┘                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

- **Pozadi:** `#09090B` s radialnim gradientem nahore (`#27272A` → `#09090B`)
- **Layout:** Centrovany — text uprostred, model pod nim (ne vedle)
- **Nadpis:** Instrument Serif 400, 48px (desktop) / 36px (mobile), `#FAFAFA`, text-align center
- **Podnadpis:** Satoshi 400, 18px, `#71717A`, max-width 480px, centrovany
- **CTA:** Amber button, centrovany, 52px vyska, radius 12px
- **3D model:** Male (max 320px), pod textem, jemna rotace, ambient light
- **Padding:** 120px top (hodne!), 72px bottom
- **Celkovy dojem:** Hodne prazdneho mista, zen, focus na zprave

**Sekce 2: Features**
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│     ┌──────────────┐    ┌──────────────┐              │
│     │ [ikona]      │    │ [ikona]      │              │
│     │ Accurate     │    │ Embeddable   │              │
│     │ Pricing      │    │ Widget       │              │
│     │              │    │              │              │
│     │ Description  │    │ Description  │              │
│     │ text here... │    │ text here... │              │
│     └──────────────┘    └──────────────┘              │
│                                                        │
│     ┌──────────────┐    ┌──────────────┐              │
│     │ [ikona]      │    │ [ikona]      │              │
│     │ Multi-format │    │ Analytics    │              │
│     │ Support      │    │ Dashboard    │              │
│     │              │    │              │              │
│     └──────────────┘    └──────────────┘              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

- **Layout:** Rovny 2x2 grid, max-width 800px, centrovany
- **Karta:** bg `#18181B`, BEZ borderu, radius 16px, padding 32px, shadow level 1
- **Hover:** translateY(-2px), shadow level 2, transition 300ms spring
- **Ikona:** 24px, `#F59E0B`, v kruhu s amber subtle bg (32px kruh)
- **Nadpis:** Satoshi 500, 18px, `#FAFAFA`, margin-top 16px
- **Popis:** Satoshi 400, 14px, `#71717A`, margin-top 8px

**Sekce 3: How it works**
- 3 kroky, ale vizualizovane elegantneji:
  - Cisla: Instrument Serif italic, 64px, `#F59E0B`, opacity 0.2 jako pozadi za textem
  - Nadpis: Satoshi 500, 20px
  - Popis: Satoshi 400, 14px, `#71717A`
  - Spojeni: Thin horizontal linka `#27272A`
- **Mobile:** Vertikalni s vertikalni linkou

**Sekce 4: Social proof**
- Serif italic "Trusted by 200+ 3D printing businesses" v `#71717A`, centrovane
- Logo radka pod tim, opacity 0.3, hover 0.6

**Sekce 5: Pricing**
- 3 karty, prostredni featured (border `#F59E0B`, badge "Recommended" pill amber)
- Ceny: Geist Mono 500, 36px
- Mesicni/rocni toggle: pill s amber aktivnim
- Features: checkmarky v `#22C55E`

**Sekce 6: CTA**
- Jednoduche: Serif italic velky text (36px) centrovany
- Amber button pod nim
- Pozadi: radial gradient (center `#27272A`)

### 6.5 LOGIN

- **Layout:** Centrovany card na plne strance
- **Card:** bg `#18181B`, BEZ borderu, radius 20px, shadow level 2, max-width 400px, padding 40px
- **Pozadi stranky:** `#09090B` s radialnim gradientem (center `#18181B` — ambient efekt za cardem)
- **Nadpis:** Instrument Serif 400, 28px, "Welcome back"
- **Podnadpis:** Satoshi 400, 14px, `#71717A`, "Sign in to your account"
- **Inputs:** 48px vyska, radius 12px, bg `#09090B`, border `#27272A`
- **CTA:** Full-width, amber, 48px, radius 12px
- **Social:** Ikony v kruzich, border `#27272A`, 48px, spacing 12px
- **Divider:** "or" text uprostred linky `#27272A`

### 6.6 TEST KALKULACKA

**Stepper:**
- Cisla v kruzich (32px), serif font
- Aktivni: filled amber, bily text
- Dokonceny: filled `#22C55E`, bila fajfka
- Budouci: border `#3F3F46`, text `#52525B`
- Spojovaci linka: 2px, `#27272A` (neaktivni), `#22C55E` (dokonceny)
- Labels: Satoshi 400, 13px

**Upload zona:**
- Border: 2px dashed `#3F3F46`, radius 20px
- Pozadi: `#09090B`
- Ikona: Upload, 40px, `#F59E0B`
- Text: Serif italic "Drop your 3D model here" 18px, `#71717A`
- Pod tim: Satoshi 400, 13px, "or click to browse"
- Format badges: pills, bg `#27272A`, text `#A1A1AA`, 12px
- Drag-over: border solid `#F59E0B`, bg `rgba(245,158,11,0.04)`

**3D Viewer:**
- Radius 16px, overflow hidden
- Pozadi: radial-gradient center lighter
- Controls: Floating pill bar ve spodni casti, bg `rgba(24,24,27,0.85)` s blur, radius 999px, padding 8px 16px
- Ikony controls: 16px, `#71717A`, hover `#FAFAFA`

**Config panel:**
- Card bg `#18181B`, radius 16px, padding 24px, NO border
- Select: 48px, radius 12px, custom dropdown
- Slider: draha `#3F3F46`, vyplnena `#F59E0B`, thumb 18px kruh s white border
- Preset karty: Rounded 12px, padding 16px 20px
  - Selected: bg `rgba(245,158,11,0.08)`, ring 2px `#F59E0B`
  - Neselected: bg `#27272A`, hover bg `#3F3F46`

**Cenovy prehled:**
- Serif cena velka (Instrument Serif, 36px, `#F59E0B`)
- Radky: Satoshi 400 14px label, Geist Mono 400 14px castka
- Discount: Green pill badge
- Separator: 1px `#27272A`
- Breakdown: collapsible s animaci

**Checkout:**
- 2 sloupce, formular s velkymi inputy (48px), prostorny padding
- Summary card sticky, radius 16px
- Submit: Full-width amber, 52px, serif text "Place order"

**Potvrzeni:**
- Velka zelena fajfka (animated draw-in SVG)
- Serif nadpis "Thank you!"
- Cislo objednavky: Geist Mono, `#F59E0B`
- Shrnuti v jemne karte

### 6.7 ADMIN DASHBOARD

**Stat karty:**
- bg `#18181B`, radius 16px, padding 24px, NO border, shadow level 1
- Cislo: Instrument Serif 400, 36px, `#FAFAFA`
- Trend: Satoshi 400, 13px, `#22C55E` (pozitivni) / `#EF4444` (negativni)
- Label: Satoshi 400, 13px, `#71717A`
- Sparkline: Mini gradient chart v pozadi karty (amber subtle)
- Hover: translateY(-2px), shadow level 2

**Graf:**
- Cisty line chart, amber cara, jemny gradient fill pod carou
- Pozadi: `#18181B`, radius 16px
- Grid: `#27272A`, jemne
- Osy: Geist Mono 11px, `#52525B`
- Tooltip: bg `#27272A`, radius 12px, shadow

**Tabulka:**
- Velke radky: 56px vyska, padding 16px 20px
- Bez zebra stripes — jen bottom border `#27272A`
- Hover: bg `#27272A`
- Header: Satoshi 500, 12px, `#52525B`
- Status pills: rounded 999px, padding 4px 12px, font 12px Satoshi 500

### 6.8 ADMIN PRICING

**Tab navigace:**
- Underline styl (ne background)
- Satoshi 500, 15px, `#71717A`
- Aktivni: `#FAFAFA`, amber underline 2px
- Gap: 32px

**Material tabulka:**
- Velke radky s barevnym dot indicatorem (14px kruh)
- Nazev: Satoshi 500 15px
- Cena: Geist Mono 400 15px
- Edit/Delete: Ghost ikony, hover amber/red

**Editor modal:**
- Velky radius 20px, bg `#27272A`, shadow level 3
- Overlay: `rgba(0,0,0,0.6)` s blur 8px
- Inputy: 48px vyska, prostorne
- Buttons: amber primary + ghost cancel

### 6.9 BUDOUCI: KANBAN

- Sloupce: radius 16px header, bg `#18181B`
- Karty: radius 12px, bg `#27272A`, shadow level 1, padding 16px
- Drag: rotace 2deg pri presunu (spring efekt)
- Status colors v header: amber (nova), blue (v procesu), green (hotovo)
- Hover karta: translateY(-1px), shadow level 2

---

## 7. KOMPONENTY

### 7.1 Button

| Varianta | Pozadi | Text | Border | Hover | Radius |
|----------|--------|------|--------|-------|--------|
| Primary | `#F59E0B` | `#09090B` (tmavy!) | none | `#D97706` + glow | 12px |
| Secondary | `#27272A` | `#FAFAFA` | none | `#3F3F46` | 12px |
| Ghost | transparent | `#A1A1AA` | none | text `#FAFAFA`, bg `rgba(255,255,255,0.05)` | 12px |
| Outline | transparent | `#A1A1AA` | 1px `#3F3F46` | border `#F59E0B`, text `#F59E0B` | 12px |
| Destructive | transparent | `#EF4444` | 1px `#EF4444` | bg `#EF4444`, text `#FFF` | 12px |

> Rozdil: Primary button ma TMAVY TEXT na svetlem pozadi — toto je Apple/premium styl.

**Velikosti:**

| Size | Vyska | Padding H | Font | Font Weight |
|------|-------|-----------|------|-------------|
| sm | 36px | 16px | 14px | 500 |
| md | 44px | 20px | 15px | 500 |
| lg | 52px | 28px | 16px | 500 |
| icon | 44px | 0 | — | — |

### 7.2 Card

- **Pozadi:** `#18181B`
- **Border:** NONE (oddeleni kontrastem + shadow)
- **Radius:** 16px
- **Shadow:** level 1 (default)
- **Padding:** 24px
- **Hover (interactive):** translateY(-2px), shadow level 2, transition 300ms spring

### 7.3 Input

- **Pozadi:** `#09090B`
- **Border:** 1px `#27272A`
- **Radius:** 12px
- **Vyska:** 48px (md — vetsi!), 40px (sm), 56px (lg)
- **Padding:** 16px horizontal
- **Text:** Satoshi 400, 16px, `#FAFAFA`
- **Placeholder:** `#52525B`
- **Focus:** border `#F59E0B`, ring `0 0 0 3px rgba(245,158,11,0.15)`
- **Error:** border `#EF4444`, Satoshi 400 13px `#EF4444`
- **Label:** Satoshi 500, 14px, normal case, `#A1A1AA`, margin-bottom 8px

### 7.4 Toggle/Switch

- **Sirka:** 48px, **Vyska:** 24px (vetsi)
- **Off:** bg `#3F3F46`, thumb `#A1A1AA`
- **On:** bg `#F59E0B`, thumb `#FFFFFF`
- **Transition:** 250ms spring
- **Thumb:** 20px, shadow

### 7.5 Toast

- **Radius:** 16px
- **Pozadi:** `#27272A`
- **Shadow:** level 2
- **Padding:** 16px 20px
- **Bez leveho borderu** (rozdil od Var. A) — ikona per typ staci
- **Ikona:** 20px, barva per typ, v kruhu s subtle bg
- **Auto-dismiss:** 5s, fade-out 250ms

### 7.6 Modal

- **Overlay:** `rgba(0,0,0,0.6)`, backdrop-blur 8px
- **Dialog:** bg `#27272A`, border none, radius 20px, shadow level 3
- **Max-width:** 440px (sm), 600px (md), 800px (lg)
- **Padding:** 32px
- **Header:** Instrument Serif 400, 24px
- **Animace:** Enter: scale 0.97→1.0 + opacity 0→1, 400ms spring. Exit: 250ms.

### 7.7 Badge

- Vsechny PILL styl (radius 999px)
- Padding: 4px 12px
- Font: Satoshi 500, 12px
- Barvy: stejne jako Var. A ale s violet navic

| Varianta | Pozadi | Text |
|----------|--------|------|
| Default | `rgba(161,161,170,0.10)` | `#A1A1AA` |
| Amber | `rgba(245,158,11,0.10)` | `#F59E0B` |
| Violet | `rgba(139,92,246,0.10)` | `#8B5CF6` |
| Green | `rgba(34,197,94,0.10)` | `#22C55E` |
| Red | `rgba(239,68,68,0.10)` | `#EF4444` |
| Blue | `rgba(96,165,250,0.10)` | `#60A5FA` |

---

## 8. ANIMACE

### 8.1 Timing

| Nazev | Trvani | Easing | Poznamka |
|-------|--------|--------|---------|
| micro | 150ms | cubic-bezier(0.4,0,0.2,1) | Hover, focus |
| standard | 250ms | cubic-bezier(0.4,0,0.2,1) | Button, badge |
| spring | 300ms | cubic-bezier(0.16,1,0.3,1) | Card hover, modal — "bounce" efekt |
| enter | 400ms | cubic-bezier(0.16,1,0.3,1) | Page enter, modal open |
| exit | 250ms | cubic-bezier(0.4,0,1,1) | Modal close |
| breathing | 4000ms | ease-in-out | CTA pulse (delsi, jemnejsi) |
| loader | 1500ms | linear | Shimmer |

> Spring easing `cubic-bezier(0.16,1,0.3,1)` — to je iOS/Apple styl. Mekky, elegantni, s jemnym "odrazem".

### 8.2 Specificke animace

- **Page transition:** Fade + translateY(12px→0), 400ms spring
- **Card hover:** translateY(-2px) + shadow level 1→2, 300ms spring
- **Modal enter:** Scale 0.97→1.0, 400ms spring (mekci nez Var. A)
- **Button press:** Scale 0.97 (200ms), release scale 1.0 (300ms spring)
- **Stepper transition:** Fade + slide, 300ms
- **Number countup:** 1000ms spring
- **Drag card:** Rotace 2deg, shadow grow, 150ms
- **Sidebar item hover:** Text color fade, 200ms

### 8.3 Specialni efekty

- **Hero ambient:** Radial gradient pulsuje jemne (opacity 0.3→0.5→0.3, 6s)
- **Feature cards:** Stagger animace pri prvnim zobrazeni (100ms delay per card)
- **Success check:** SVG path draw-in animace (stroke-dashoffset 0→1, 600ms)
- **Toast stack:** Nove toasty posouvaji stare dolu s animaci

---

## 9. POROVNANI KLICOVYCH ROZDILU OD VARIANTY A

| Aspekt | Var. A: Industrial | Var. B: Premium |
|--------|-------------------|-----------------|
| Heading font | JetBrains Mono (monospace) | Instrument Serif (serif) |
| Labels | UPPERCASE 11px + spacing | Normal case 12px |
| Card border | 1px solid visible | Bez borderu (jen shadow) |
| Border radius | 6-8px (ostra) | 12-20px (rounded) |
| Input height | 40px | 48px (vetsi) |
| Button text | Bily na barve | TMAVY na barve |
| Spacing | Kompaktni | Velkorysé |
| Animace | Kratsi, precizni | Delsi, spring-like |
| Sidebar labels | Uppercase, sedy | Serif italic, amber |
| Hero layout | Asymetricky (text vlevo) | Centrovany (zen) |
| Patterns | Blueprint grid, dots | Radial gradient, ambient |
| Celkovy pocit | Cockpit, kontrola | Galerie, elegance |
