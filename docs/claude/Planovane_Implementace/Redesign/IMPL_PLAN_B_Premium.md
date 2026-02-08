# Implementacni Plan: Varianta B "PREMIUM / DESIGN STUDIO"

> **Verze:** 1.0
> **Datum:** 2026-02-07
> **Autor:** mp-sr-frontend (Senior Frontend Agent)
> **Filozofie:** High-end designove studio. Elegantni, minimalisticke, sofistikovane.
> **Inspirace:** Apple produktove stranky, Linear, Vercel, Raycast.
> **Stav:** PLAN — Ceka na schvaleni orchestratorem pred implementaci.

---

## Obsah

- R0: Priprava & Zavislosti
- R1: Design System Zaklad
- R2: Zakladni Komponenty (15+)
- R3: Layout Shell (Header, Footer, Sidebar)
- R4: Public Pages (Home, Login, Register, Pricing, Support, 404)
- R5: Test Kalkulacka (5-step wizard)
- R6: Admin Pages (Dashboard, Pricing, Fees, Orders, ...)
- R7: Widget System (Widget Kalkulacka, Builder, Embed)
- R8: Budouci Stranky (12 planovanych stranek)
- R9: Polish & Testing (Anti-AI audit, animace, a11y, performance)

---

## Globalni designove konstanty (reference pro vsechny faze)

### Barvy
```
Primary Accent:    #F59E0B (Warm Amber)
Primary Hover:     #D97706
Primary Subtle:    rgba(245,158,11,0.10)
Secondary Accent:  #8B5CF6 (Cool Violet)
Secondary Hover:   #7C3AED
Secondary Subtle:  rgba(139,92,246,0.10)
Success:           #22C55E
Warning:           #EAB308
Error:             #EF4444
Link:              #60A5FA

Base (bg):         #09090B (zinc-950)
Surface:           #18181B (zinc-900)
Elevated:          #27272A (zinc-800)
Overlay:           #3F3F46 (zinc-700)

Text Primary:      #FAFAFA (zinc-50)
Text Secondary:    #A1A1AA (zinc-400)
Text Muted:        #71717A (zinc-500)
Text Disabled:     #52525B (zinc-600)
```

### Fonty
```
Heading:  Instrument Serif 400 (Google Fonts) — SERIF, anti-AI differentiator
Body:     Satoshi 400/500 (Fontshare, free)
Mono:     Geist Mono 400/500 (Vercel/npm)
Label:    Satoshi 500, 12px, normal case (NE uppercase)
```

### Border Radius
```
Button:      12px
Input:       12px
Card:        16px
Modal:       20px
Badge:       999px (pill)
Upload zone: 20px
Dropdown:    12px
```

### Shadows (misto borderu na kartach)
```
Level 0: none
Level 1: 0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)
Level 2: 0 8px 32px rgba(0,0,0,0.4)
Level 3: 0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)
Level 4: 0 24px 64px rgba(0,0,0,0.6)
Glow Amber:  0 0 24px rgba(245,158,11,0.25)
Glow Violet: 0 0 24px rgba(139,92,246,0.25)
```

### Animace
```
Spring easing:  cubic-bezier(0.16, 1, 0.3, 1)   — iOS/Apple styl
Micro:          150ms cubic-bezier(0.4, 0, 0.2, 1)
Standard:       250ms cubic-bezier(0.4, 0, 0.2, 1)
Spring:         300ms cubic-bezier(0.16, 1, 0.3, 1)
Enter:          400ms cubic-bezier(0.16, 1, 0.3, 1)
Exit:           250ms cubic-bezier(0.4, 0, 1, 1)
Breathing:      4000ms ease-in-out
```

### Spacing
```
Card padding:    24px
Section gap:     96px
Input height:    48px (md), 40px (sm), 56px (lg)
Button height:   44px (md), 36px (sm), 52px (lg)
Header height:   64px
Sidebar width:   220px
Page padding:    40px horizontal, 56px vertical (desktop)
```

---

# R0: Priprava & Zavislosti

## R0.1 Prehled

Faze R0 pripravi projekt na redesign Varianty B "Premium / Design Studio". Zahrnuje import
fontu (Instrument Serif, Satoshi, Geist Mono), vytvoreni CSS custom properties souboru,
konfiguraci Vite pro nove assety, a zavedeni zakladni adresarove struktury pro premium
design tokens. Zadna vizualni zmena na webu — jen infrastrukturni priprava.

## R0.2 Vedouci agent

`mp-mid-infra-build` — vlastni Vite konfiguraci, build pipeline, font loading strategii.

## R0.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Architekturalni review, schvaleni font-loading strategie |
| `mp-mid-design-system` | Definice design tokenu, CSS custom properties |
| `mp-spec-infra-deps` | Instalace npm balicku (geist font) |
| `mp-spec-research-web` | Overeni Fontshare licencnich podminek pro Satoshi |
| `mp-spec-design-a11y` | Validace font-size/kontrast splneni WCAG AA |

## R0.4 Skills

| Skill | Pouziti |
|-------|---------|
| `dependency-updater` | Overeni kompatibility novych zavislosti |
| `lint-fix` | Fixovani lint chyb po zmenach v CSS/config |
| `secret-scanner` | Kontrola ze font API klice nejsou v kodu |
| `review-pr` | Review vsech zmen pred mergem |

## R0.5 Ukoly

### R0.5.1 Import Instrument Serif z Google Fonts

Instrument Serif je serif font od Google Fonts pouzivany pro vsechny headings (h1-h4).
AI nikdy nepouziva serif fonty pro nadpisy — toto je klicovy anti-AI diferenciator.

**Kroky:**
1. Pridat `<link>` tag do `index.html` pro preload a import:
   ```html
   <!-- Instrument Serif — Premium heading font (serif, anti-AI) -->
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
   <link
     rel="stylesheet"
     href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
   />
   ```
2. Font pouziva pouze regular (400) a italic — bold NENI potreba protoze serif
   font neni typicky boldovany pro headings v premium designu.
3. `display=swap` zajisti ze text je okamzite viditelny s fallbackem behem nacitani.

### R0.5.2 Import Satoshi z Fontshare

Satoshi je bezplatny sans-serif font od Fontshare (Indian Type Foundry). Pouziva se
jako body font, labely, tlacitka — vsude krome headingu a technickych udaju.

**Kroky:**
1. Pridat CSS import do `src/styles/index.css`:
   ```css
   /* Satoshi — Premium body font (Fontshare, free for commercial use) */
   @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap');
   ```
2. Alternativne: stahnout Satoshi WOFF2 soubory a hostovat lokalne pro lepsi
   performance a nezavislost na externim CDN:
   ```
   src/assets/fonts/Satoshi-Regular.woff2
   src/assets/fonts/Satoshi-Medium.woff2
   src/assets/fonts/Satoshi-Bold.woff2
   ```
   S @font-face deklaraci:
   ```css
   @font-face {
     font-family: 'Satoshi';
     src: url('/assets/fonts/Satoshi-Regular.woff2') format('woff2');
     font-weight: 400;
     font-style: normal;
     font-display: swap;
   }
   @font-face {
     font-family: 'Satoshi';
     src: url('/assets/fonts/Satoshi-Medium.woff2') format('woff2');
     font-weight: 500;
     font-style: normal;
     font-display: swap;
   }
   @font-face {
     font-family: 'Satoshi';
     src: url('/assets/fonts/Satoshi-Bold.woff2') format('woff2');
     font-weight: 700;
     font-style: normal;
     font-display: swap;
   }
   ```
3. Preferovana varianta: **lokalni hosting** (WOFF2) — eliminuje zavislost na
   Fontshare CDN, lepsi TTFB, plna kontrola nad cache headers.

### R0.5.3 Import Geist Mono z Vercel

Geist Mono je monospace font od Vercelu pouzivany pro ceny, technicke udaje,
cisla objednavek a vsechny numericke hodnoty.

**Kroky:**
1. Instalace npm balicku:
   ```bash
   npm install geist
   ```
2. Import v `src/styles/index.css`:
   ```css
   /* Geist Mono — Technical/price font (Vercel, MIT license) */
   @import 'geist/font/mono';
   ```
3. Alternativne pouzit primo WOFF2 z npm modulu v @font-face pokud Vite
   neresolvuje import spravne.

### R0.5.4 Vytvoreni premium-tokens.css

Centralni soubor se vsemi CSS custom properties pro Variantu B. Tento soubor bude
importovan v `src/styles/index.css` a bude jediny zdroj pravdy pro vsechny
designove hodnoty.

**Soubor:** `src/styles/premium-tokens.css`

```css
/* ============================================
   MODELPRICER V3 — VARIANTA B "PREMIUM / DESIGN STUDIO"
   Design Tokens (CSS Custom Properties)
   ============================================
   Filozofie: High-end design studio, Apple, Linear, Vercel, Raycast.
   Klicove odlisnosti od Var. A:
   - Serif heading font (Instrument Serif) — AI nikdy nepouziva serif headings
   - Shadow-only karty BEZ borderu
   - Velke border-radius (12-20px)
   - Vetsi inputy (48px) a velkorysejsi spacing
   - Spring animace (cubic-bezier(0.16,1,0.3,1))
   - Normal case labely (ne UPPERCASE)
   - Tmavy text na svetlem accent buttonu (Apple styl)
   ============================================ */

:root {
  /* === Barvy: Pozadi (zinc scale, 4 urovne) === */
  --color-base: #09090B;
  --color-surface: #18181B;
  --color-elevated: #27272A;
  --color-overlay: #3F3F46;

  /* === Barvy: Text (4 urovne) === */
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A1A1AA;
  --color-text-muted: #71717A;
  --color-text-disabled: #52525B;

  /* === Barvy: Akcentove === */
  --color-amber: #F59E0B;
  --color-amber-hover: #D97706;
  --color-amber-subtle: rgba(245, 158, 11, 0.10);
  --color-violet: #8B5CF6;
  --color-violet-hover: #7C3AED;
  --color-violet-subtle: rgba(139, 92, 246, 0.10);
  --color-success: #22C55E;
  --color-warning: #EAB308;
  --color-error: #EF4444;
  --color-link: #60A5FA;

  /* === Barvy: Specialni (3D tisk materialy) === */
  --color-pla-warm: #F5A623;
  --color-petg-cool: #6366F1;
  --color-asa-silver: #94A3B8;
  --color-nylon-pearl: #F1F5F9;
  --color-carbon-black: #1E1E1E;
  --color-rose-gold: #E8A87C;

  /* === Barvy: Bordery a oddeleni === */
  --color-divider: #27272A;
  --color-active-indicator: #F59E0B;
  --color-focus-ring: rgba(245, 158, 11, 0.20);
  --color-input-border: #27272A;
  --color-input-focus-border: #F59E0B;

  /* === Gradienty === */
  --gradient-warm-glow: linear-gradient(135deg, #F59E0B 0%, #8B5CF6 100%);
  --gradient-surface-depth: linear-gradient(135deg, #18181B 0%, #27272A 100%);
  --gradient-ambient-light: radial-gradient(ellipse at top, #27272A 0%, #09090B 70%);
  --gradient-golden-hour: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);

  /* === Typografie: Font family === */
  --font-heading: 'Instrument Serif', Georgia, 'Times New Roman', serif;
  --font-body: 'Satoshi', 'General Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Geist Mono', 'SF Mono', 'JetBrains Mono', 'Fira Code', monospace;
  --font-label: var(--font-body);

  /* === Typografie: Velikosti === */
  --text-h1: 48px;
  --text-h2: 36px;
  --text-h3: 24px;
  --text-h4: 20px;
  --text-body: 16px;
  --text-body-sm: 14px;
  --text-body-xs: 12px;
  --text-label: 12px;
  --text-price: 20px;
  --text-price-lg: 36px;
  --text-tech: 14px;
  --text-button: 15px;

  /* === Typografie: Line-height === */
  --lh-h1: 1.15;
  --lh-h2: 1.2;
  --lh-h3: 1.3;
  --lh-h4: 1.35;
  --lh-body: 1.7;
  --lh-body-sm: 1.6;
  --lh-body-xs: 1.5;
  --lh-label: 1.3;

  /* === Typografie: Letter-spacing === */
  --ls-h1: -0.03em;
  --ls-h2: -0.02em;
  --ls-h3: -0.01em;
  --ls-label: 0.02em;

  /* === Spacing === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 56px;
  --space-10: 72px;
  --space-11: 96px;
  --space-12: 120px;

  /* === Border Radius === */
  --radius-button: 12px;
  --radius-input: 12px;
  --radius-card: 16px;
  --radius-modal: 20px;
  --radius-badge: 999px;
  --radius-upload: 20px;
  --radius-dropdown: 12px;
  --radius-avatar: 999px;

  /* === Shadows === */
  --shadow-level-0: none;
  --shadow-level-1: 0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-level-2: 0 8px 32px rgba(0,0,0,0.4);
  --shadow-level-3: 0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3);
  --shadow-level-4: 0 24px 64px rgba(0,0,0,0.6);
  --shadow-glow-amber: 0 0 24px rgba(245,158,11,0.25);
  --shadow-glow-violet: 0 0 24px rgba(139,92,246,0.25);

  /* === Animace === */
  --ease-micro: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --duration-micro: 150ms;
  --duration-standard: 250ms;
  --duration-spring: 300ms;
  --duration-enter: 400ms;
  --duration-exit: 250ms;
  --duration-breathing: 4000ms;

  /* === Layout === */
  --header-height: 64px;
  --sidebar-width: 220px;
  --page-padding-x: 40px;
  --page-padding-y: 56px;
  --page-padding-x-mobile: 20px;
  --page-padding-y-mobile: 32px;
  --card-padding: 24px;
  --card-gap: 20px;
  --section-gap: 96px;
  --input-height-sm: 40px;
  --input-height-md: 48px;
  --input-height-lg: 56px;
  --button-height-sm: 36px;
  --button-height-md: 44px;
  --button-height-lg: 52px;
}

/* === Reduced Motion === */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### R0.5.5 Aktualizace index.css

Upravit `src/styles/index.css` aby importoval premium tokeny a nastavil globalni
typografii.

**Zmeny:**
```css
/* Premium design tokens */
@import './premium-tokens.css';

/* Fonts */
@import 'geist/font/mono';
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap');

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-body);
  background-color: var(--color-base);
  color: var(--color-text-primary);
  font-size: var(--text-body);
  line-height: var(--lh-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: 400;
  color: var(--color-text-primary);
}

h1 {
  font-size: var(--text-h1);
  line-height: var(--lh-h1);
  letter-spacing: var(--ls-h1);
}

h2 {
  font-size: var(--text-h2);
  line-height: var(--lh-h2);
  letter-spacing: var(--ls-h2);
}

h3 {
  font-size: var(--text-h3);
  line-height: var(--lh-h3);
  letter-spacing: var(--ls-h3);
}

h4 {
  font-size: var(--text-h4);
  line-height: var(--lh-h4);
}

code, pre, .mono {
  font-family: var(--font-mono);
}
```

### R0.5.6 Aktualizace index.html

Pridat preconnect a font import tagy do `<head>` sekce.

**Soubor:** `index.html`

```html
<head>
  <!-- Existujici meta tagy ... -->

  <!-- Premium Font Preconnects -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preconnect" href="https://api.fontshare.com" crossorigin />

  <!-- Instrument Serif (headings — serif, anti-AI) -->
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
  />

  <!-- Existujici skripty ... -->
</head>
```

### R0.5.7 Vytvoreni adresarove struktury

```
src/
  assets/
    fonts/
      Satoshi-Regular.woff2
      Satoshi-Medium.woff2
      Satoshi-Bold.woff2
  styles/
    premium-tokens.css          ← NOVY (design tokens)
    premium-animations.css      ← NOVY (keyframes a animace, R1)
    premium-utilities.css       ← NOVY (utility tridy, R1)
    index.css                   ← UPRAVENY (importy, globalni typografie)
    tailwind.css                ← EXISTUJICI (beze zmen v R0)
```

### R0.5.8 Vite konfigurace — font loading

Overit ze Vite spravne zpracovava WOFF2 soubory v `src/assets/fonts/`:

**Soubor:** `vite.config.mjs`

Neni potreba menit — Vite nativne podporuje WOFF2 jako static assety.
Overit ze `assetsInclude` neblokuje fonty. Pokud by doslo k problemu,
pridat explicitne:
```js
export default defineConfig({
  assetsInclude: ['**/*.woff2'],
  // ...
});
```

## R0.6 Code Examples

### Priklad: Overeni ze fonty funguji (diagnosticky snippet)

```jsx
// src/components/__dev__/FontTest.jsx — DOCASNY, smazat po R0 verifikaci
export default function FontTest() {
  return (
    <div style={{ padding: '40px', background: '#09090B', color: '#FAFAFA' }}>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '48px' }}>
        Instrument Serif Heading
      </h1>
      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: '36px' }}>
        Instrument Serif Italic Subheading
      </h2>
      <p style={{ fontFamily: "'Satoshi', sans-serif", fontSize: '16px', lineHeight: 1.7 }}>
        Satoshi body text. Toto je hlavni textovy font pro vsechny obsahove oblasti.
        Premium, citelny, moderni. Pouziva se pro odstavce, popisy, labely, tlacitka.
      </p>
      <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '20px', color: '#F59E0B' }}>
        1 234,56 Kc — Geist Mono price
      </p>
      <p style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 500, fontSize: '12px', color: '#A1A1AA', letterSpacing: '0.02em' }}>
        Normal case label (Satoshi 500, 12px) — NE uppercase
      </p>
    </div>
  );
}
```

### Priklad: Premium token pouziti v komponente

```jsx
// Ukazka jak pouzit CSS custom properties v inline stylu
function PremiumCard({ children, title }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--card-padding)',
      boxShadow: 'var(--shadow-level-1)',
      /* ZADNY border — oddeleni je kontrastem + shadow */
    }}>
      <h3 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-h3)',
        lineHeight: 'var(--lh-h3)',
        letterSpacing: 'var(--ls-h3)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--space-4)',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
```

## R0.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `index.html` | EDIT — pridat font preconnects a Instrument Serif link | `mp-mid-infra-build` |
| `src/styles/index.css` | EDIT — pridat importy, globalni typografie | `mp-mid-design-system` |
| `src/styles/premium-tokens.css` | NOVY — vsechny design tokens | `mp-mid-design-system` |
| `src/assets/fonts/Satoshi-Regular.woff2` | NOVY — font soubor | `mp-mid-infra-build` |
| `src/assets/fonts/Satoshi-Medium.woff2` | NOVY — font soubor | `mp-mid-infra-build` |
| `src/assets/fonts/Satoshi-Bold.woff2` | NOVY — font soubor | `mp-mid-infra-build` |
| `vite.config.mjs` | REVIEW — overit asset handling | `mp-mid-infra-build` |
| `package.json` | EDIT — pridat `geist` dependency | `mp-spec-infra-deps` |

## R0.8 Acceptance Criteria

- [ ] Instrument Serif se nacita a renderuje korektne pro h1-h4 elementy
- [ ] Instrument Serif italic funguje pro slogany a citace
- [ ] Satoshi 400/500/700 se nacita z lokalniho WOFF2 nebo Fontshare CDN
- [ ] Geist Mono se nacita pro cenove a technicke elementy
- [ ] `premium-tokens.css` existuje a obsahuje vsech 80+ tokenu
- [ ] Vsechny CSS custom properties jsou pristupne pres `var(--nazev)` v komponentach
- [ ] `npm run build` prochazi bez chyb
- [ ] Font loading neblokuje prvni vykresleni (font-display: swap)
- [ ] Lighthouse performance score neklesne pod 85
- [ ] Zadna vizualni zmena na existujicim webu (tokeny jsou zatim nepouzite)
- [ ] WOFF2 soubory maji dohromady < 150kB

## R0.9 Eskalacni cesta

1. Problem s Fontshare licenci → `mp-spec-research-web` overi podminky, eskalace na `mp-sr-frontend`
2. Vite neresolvi Geist import → `mp-mid-infra-build` pouzije alternativni WOFF2 import
3. Font loading zpusobuje CLS (Cumulative Layout Shift) → `mp-sr-frontend` rozhodne o preload strategii
4. Bundle size naroste o > 200kB kvuli fontum → `mp-mid-infra-build` optimalizuje subset

## R0.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| Zadna predchozi faze | — | R0 je startovni bod |
| R1 zavisi na R0 | Blocking | R0 musi byt hotova pred R1 |
| Google Fonts CDN | External | Instrument Serif (fallback: Georgia) |
| Fontshare CDN nebo lokalni WOFF2 | External | Satoshi (fallback: system sans-serif) |
| npm `geist` package | External | Geist Mono (fallback: monospace) |

---

# R1: Design System Zaklad

## R1.1 Prehled

Faze R1 vytvori zakladni designovy system pro Variantu B. Definuje globalni CSS tridy,
animacni keyframes, utility tridy, a zakladni vizualni jazyk. Po R1 bude mozne pouzivat
premium design system v libovolne komponente pres CSS tridy a custom properties
z R0. Tato faze STALE nemeni existujici komponenty — pouze vytvari novy CSS a utility vrstvy.

Klicove odlisnosti od Varianty A v teto fazi:
- Karty pouzivaji SHADOW misto borderu pro oddeleni od pozadi
- Vsechny radii jsou 12-20px (ne 6-8px jako Var. A)
- Spring animace (cubic-bezier(0.16,1,0.3,1)) misto kratsich, preciznejsich
- Normal case labely s Satoshi 500 (ne UPPERCASE s letter-spacing)
- Radial gradient ambient efekty misto blueprint grid patternu

## R1.2 Vedouci agent

`mp-mid-design-system` — vlastni vsechny UI tokeny, CSS utility tridy, animacni system.

## R1.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Review CSS architektury, rozhodnuti o naming konvenci |
| `mp-sr-design` | UX validace animacnich timingu a vizualniho jazyka |
| `mp-spec-fe-animations` | Implementace keyframes a spring animaci |
| `mp-spec-design-a11y` | Overeni prefers-reduced-motion a kontrastu |
| `mp-mid-quality-code` | Review CSS kodu, naming konzistence |

## R1.4 Skills

| Skill | Pouziti |
|-------|---------|
| `lint-fix` | CSS lint po vytvoreni novych souboru |
| `review-pr` | Review CSS architektury |
| `verification-before-completion` | Overeni vsech keyframes a utility trid |

## R1.5 Ukoly

### R1.5.1 Vytvoreni premium-animations.css

Centralni soubor se vsemi keyframe animacemi pro premium design. Vsechny animace
pouzivaji spring easing `cubic-bezier(0.16,1,0.3,1)` pro iOS/Apple dojem.

**Soubor:** `src/styles/premium-animations.css`

```css
/* ============================================
   PREMIUM ANIMATIONS — Varianta B
   Spring-based, iOS/Apple styl animace
   Easing: cubic-bezier(0.16, 1, 0.3, 1)
   ============================================ */

/* --- Page Enter --- */
@keyframes premium-page-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Card Hover Lift --- */
@keyframes premium-card-lift {
  from {
    transform: translateY(0);
    box-shadow: var(--shadow-level-1);
  }
  to {
    transform: translateY(-2px);
    box-shadow: var(--shadow-level-2);
  }
}

/* --- Modal Enter (scale up + fade) --- */
@keyframes premium-modal-enter {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* --- Modal Exit --- */
@keyframes premium-modal-exit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.97);
  }
}

/* --- Button Press --- */
@keyframes premium-button-press {
  0% { transform: scale(1); }
  50% { transform: scale(0.97); }
  100% { transform: scale(1); }
}

/* --- Breathing (CTA pulse) --- */
@keyframes premium-breathing {
  0%, 100% {
    box-shadow: var(--shadow-glow-amber);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 32px rgba(245, 158, 11, 0.35);
    transform: scale(1.01);
  }
}

/* --- Fade In Stagger (pro feature cards) --- */
@keyframes premium-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Success Checkmark (SVG draw-in) --- */
@keyframes premium-check-draw {
  from {
    stroke-dashoffset: 100;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* --- Number Count Up (flip effect) --- */
@keyframes premium-number-flip {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- Toast Enter (slide from right) --- */
@keyframes premium-toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* --- Toast Exit --- */
@keyframes premium-toast-exit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(20px);
  }
}

/* --- Sidebar Item Slide Right (hover) --- */
@keyframes premium-slide-right {
  from { transform: translateX(0); }
  to { transform: translateX(4px); }
}

/* --- Hero Ambient Pulse --- */
@keyframes premium-ambient-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

/* --- Shimmer Loading --- */
@keyframes premium-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* --- Drag Card Rotation --- */
@keyframes premium-drag-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(2deg); }
}

/* --- Spinner --- */
@keyframes premium-spinner {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### R1.5.2 Vytvoreni premium-utilities.css

Utility CSS tridy ktere mapuji na design tokeny. Umoznuji rychle aplikovani premium
stylu v libovolne komponente bez psani inline stylu.

**Soubor:** `src/styles/premium-utilities.css`

```css
/* ============================================
   PREMIUM UTILITIES — Varianta B
   Reusable CSS classes mapped to design tokens
   ============================================ */

/* === Typography === */

.premium-h1 {
  font-family: var(--font-heading);
  font-size: var(--text-h1);
  line-height: var(--lh-h1);
  letter-spacing: var(--ls-h1);
  font-weight: 400;
  color: var(--color-text-primary);
}

.premium-h2 {
  font-family: var(--font-heading);
  font-size: var(--text-h2);
  line-height: var(--lh-h2);
  letter-spacing: var(--ls-h2);
  font-weight: 400;
  color: var(--color-text-primary);
}

.premium-h3 {
  font-family: var(--font-heading);
  font-size: var(--text-h3);
  line-height: var(--lh-h3);
  letter-spacing: var(--ls-h3);
  font-weight: 400;
  color: var(--color-text-primary);
}

.premium-h4 {
  font-family: var(--font-heading);
  font-size: var(--text-h4);
  line-height: var(--lh-h4);
  font-weight: 400;
  color: var(--color-text-primary);
}

.premium-heading-italic {
  font-family: var(--font-heading);
  font-style: italic;
  font-weight: 400;
}

.premium-body {
  font-family: var(--font-body);
  font-size: var(--text-body);
  line-height: var(--lh-body);
  font-weight: 400;
  color: var(--color-text-primary);
}

.premium-body-sm {
  font-family: var(--font-body);
  font-size: var(--text-body-sm);
  line-height: var(--lh-body-sm);
  font-weight: 400;
  color: var(--color-text-secondary);
}

.premium-body-xs {
  font-family: var(--font-body);
  font-size: var(--text-body-xs);
  line-height: var(--lh-body-xs);
  font-weight: 400;
  color: var(--color-text-muted);
}

.premium-label {
  font-family: var(--font-body);
  font-size: var(--text-label);
  line-height: var(--lh-label);
  font-weight: 500;
  letter-spacing: var(--ls-label);
  color: var(--color-text-secondary);
  /* DULEZITE: Normal case — NE text-transform: uppercase (to je Var. A) */
}

.premium-price {
  font-family: var(--font-mono);
  font-size: var(--text-price);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

.premium-price-lg {
  font-family: var(--font-mono);
  font-size: var(--text-price-lg);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--color-amber);
}

.premium-tech {
  font-family: var(--font-mono);
  font-size: var(--text-tech);
  font-weight: 400;
  line-height: 1.4;
  color: var(--color-text-secondary);
}

/* === Surfaces === */

.premium-bg-base {
  background-color: var(--color-base);
}

.premium-bg-surface {
  background-color: var(--color-surface);
}

.premium-bg-elevated {
  background-color: var(--color-elevated);
}

/* === Cards (shadow-only, NO border) === */

.premium-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-card);
  padding: var(--card-padding);
  box-shadow: var(--shadow-level-1);
  border: none;
  transition: transform var(--duration-spring) var(--ease-spring),
              box-shadow var(--duration-spring) var(--ease-spring);
}

.premium-card-interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-level-2);
}

.premium-card-elevated {
  background-color: var(--color-elevated);
  border-radius: var(--radius-card);
  padding: var(--card-padding);
  box-shadow: var(--shadow-level-2);
  border: none;
}

/* === Animations === */

.premium-animate-page-enter {
  animation: premium-page-enter var(--duration-enter) var(--ease-spring) both;
}

.premium-animate-modal-enter {
  animation: premium-modal-enter var(--duration-enter) var(--ease-spring) both;
}

.premium-animate-modal-exit {
  animation: premium-modal-exit var(--duration-exit) var(--ease-exit) both;
}

.premium-animate-fade-in-up {
  animation: premium-fade-in-up var(--duration-enter) var(--ease-spring) both;
}

.premium-animate-breathing {
  animation: premium-breathing var(--duration-breathing) ease-in-out infinite;
}

.premium-animate-shimmer {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-elevated) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: premium-shimmer 1500ms linear infinite;
}

.premium-animate-toast-enter {
  animation: premium-toast-enter var(--duration-spring) var(--ease-spring) both;
}

.premium-animate-toast-exit {
  animation: premium-toast-exit var(--duration-exit) var(--ease-exit) both;
}

/* Stagger children (pro feature card gridy) */
.premium-stagger > *:nth-child(1) { animation-delay: 0ms; }
.premium-stagger > *:nth-child(2) { animation-delay: 100ms; }
.premium-stagger > *:nth-child(3) { animation-delay: 200ms; }
.premium-stagger > *:nth-child(4) { animation-delay: 300ms; }
.premium-stagger > *:nth-child(5) { animation-delay: 400ms; }
.premium-stagger > *:nth-child(6) { animation-delay: 500ms; }

/* === Hover Effects (spring-based) === */

.premium-hover-lift {
  transition: transform var(--duration-spring) var(--ease-spring),
              box-shadow var(--duration-spring) var(--ease-spring);
}
.premium-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-level-2);
}

.premium-hover-glow-amber {
  transition: box-shadow var(--duration-spring) var(--ease-spring);
}
.premium-hover-glow-amber:hover {
  box-shadow: var(--shadow-glow-amber);
}

.premium-hover-glow-violet {
  transition: box-shadow var(--duration-spring) var(--ease-spring);
}
.premium-hover-glow-violet:hover {
  box-shadow: var(--shadow-glow-violet);
}

/* === Focus States === */

.premium-focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

/* === Ambient Background Effects === */

.premium-ambient-glow {
  position: relative;
}
.premium-ambient-glow::before {
  content: '';
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 40%;
  background: radial-gradient(
    ellipse at center,
    rgba(245, 158, 11, 0.08) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

.premium-ambient-page {
  background: var(--color-base);
  background-image: var(--gradient-ambient-light);
  background-attachment: fixed;
}

/* === Dividers === */

.premium-divider {
  height: 1px;
  background-color: var(--color-divider);
  border: none;
  margin: var(--space-6) 0;
}

.premium-divider-vertical {
  width: 1px;
  background-color: var(--color-divider);
  border: none;
  align-self: stretch;
}

/* === Scrollbar (dark, thin) === */

.premium-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.premium-scrollbar::-webkit-scrollbar-track {
  background: var(--color-base);
}

.premium-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-overlay);
  border-radius: var(--radius-badge);
}

.premium-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
```

### R1.5.3 Vytvoreni premium-backgrounds.css

Specialni pozadi efekty pro premium design — radial gradienty, ambient glow,
jemne patterny (NE blueprint grid — to je Var. A).

**Soubor:** `src/styles/premium-backgrounds.css`

```css
/* ============================================
   PREMIUM BACKGROUNDS — Varianta B
   Radial gradients, ambient glow, subtle patterns
   (NE blueprint grid ani dot grid — to je Var. A Industrial)
   ============================================ */

/* --- Hero ambient background --- */
.premium-bg-hero {
  background-color: var(--color-base);
  background-image: radial-gradient(
    ellipse at top center,
    var(--color-elevated) 0%,
    var(--color-base) 70%
  );
}

/* --- Login ambient glow za cardem --- */
.premium-bg-login {
  background-color: var(--color-base);
  background-image: radial-gradient(
    circle at center,
    var(--color-surface) 0%,
    var(--color-base) 60%
  );
}

/* --- CTA sekce radial gradient --- */
.premium-bg-cta {
  background-color: var(--color-base);
  background-image: radial-gradient(
    circle at center,
    var(--color-elevated) 0%,
    var(--color-base) 70%
  );
}

/* --- 3D Viewer ambient pozadi --- */
.premium-bg-viewer {
  background-color: var(--color-base);
  background-image: radial-gradient(
    circle at center,
    var(--color-surface) 0%,
    var(--color-base) 80%
  );
}

/* --- Floating amber accent dot (dekorativni) --- */
.premium-accent-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-badge);
  background-color: var(--color-amber);
  display: inline-block;
}

/* --- Jemny noise overlay (2% opacity) --- */
.premium-noise-overlay {
  position: relative;
}
.premium-noise-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}
```

### R1.5.4 Import novych CSS souboru do index.css

Aktualizovat `src/styles/index.css` aby importoval vsechny nove soubory:

```css
/* Premium Design System — Varianta B */
@import './premium-tokens.css';
@import './premium-animations.css';
@import './premium-utilities.css';
@import './premium-backgrounds.css';
```

### R1.5.5 Vytvoreni useSpringAnimation custom hooku

React hook pro snadne pridani spring animaci na libovolny element.
Pouziva IntersectionObserver pro trigger-on-visible pattern.

```jsx
// src/hooks/useSpringAnimation.js
import { useEffect, useRef, useState } from 'react';

/**
 * Hook pro spring-based animace triggrovane pri prvnim zobrazeni.
 * Pouziva IntersectionObserver — animace se spusti kdyz element vstoupi do viewportu.
 *
 * @param {Object} options
 * @param {string} options.animationClass - CSS trida k pridani (napr. 'premium-animate-fade-in-up')
 * @param {number} options.delay - Delay v ms pred spustenim (default 0)
 * @param {number} options.threshold - IntersectionObserver threshold (default 0.1)
 * @param {boolean} options.once - Animovat jen jednou (default true)
 * @returns {{ ref, isVisible }}
 */
export function useSpringAnimation({
  animationClass = 'premium-animate-fade-in-up',
  delay = 0,
  threshold = 0.1,
  once = true,
} = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, threshold, once]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isVisible) {
      element.classList.add(animationClass);
    } else {
      element.classList.remove(animationClass);
    }
  }, [isVisible, animationClass]);

  return { ref, isVisible };
}
```

### R1.5.6 Vytvoreni useScrollHeader custom hooku

Hook pro blur header efekt — header je transparentni na vrchu stranky a pri
scrollu prechazi na blur pozadi. Toto je typicky premium/Apple pattern.

```jsx
// src/hooks/useScrollHeader.js
import { useEffect, useState } from 'react';

/**
 * Hook pro sledovani scroll pozice a aplikaci blur efektu na header.
 * Vraci `isScrolled` boolean — true kdyz user scrollnul vice nez threshold.
 *
 * Premium pattern: transparentni header → blur bg pri scrollu.
 *
 * @param {number} threshold - Pocet px scrollu pred aktivaci (default 20)
 * @returns {{ isScrolled: boolean }}
 */
export function useScrollHeader(threshold = 20) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > threshold);
    }

    // Kontrola initialniho stavu (pro reload uprostred stranky)
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { isScrolled };
}
```

### R1.5.7 Vytvoreni useReducedMotion custom hooku

Hook pro detekci `prefers-reduced-motion` — vsechny animace MUSI respektovat
toto nastaveni pro pristupnost.

```jsx
// src/hooks/useReducedMotion.js
import { useEffect, useState } from 'react';

/**
 * Hook pro detekci prefers-reduced-motion.
 * Pokud uzivatel preferuje redukovane pohyby, animace se preskoce.
 *
 * @returns {boolean} true pokud uzivatel preferuje redukovane pohyby
 */
export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);

    function onChange(event) {
      setPrefersReduced(event.matches);
    }

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return prefersReduced;
}
```

## R1.6 Code Examples

### Priklad: Spring animace na karte s IntersectionObserver

```jsx
import { useSpringAnimation } from '@/hooks/useSpringAnimation';

function FeatureCard({ icon, title, description, index }) {
  const { ref, isVisible } = useSpringAnimation({
    animationClass: 'premium-animate-fade-in-up',
    delay: index * 100, // stagger 100ms per karta
    threshold: 0.2,
  });

  return (
    <div
      ref={ref}
      className="premium-card premium-card-interactive"
      style={{
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-badge)',
        backgroundColor: 'var(--color-amber-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <h3 className="premium-h4" style={{ marginTop: 'var(--space-4)' }}>
        {title}
      </h3>
      <p className="premium-body-sm" style={{ marginTop: 'var(--space-2)' }}>
        {description}
      </p>
    </div>
  );
}
```

### Priklad: Blur header s useScrollHeader

```jsx
import { useScrollHeader } from '@/hooks/useScrollHeader';

function PremiumHeader() {
  const { isScrolled } = useScrollHeader(20);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--header-height)',
      zIndex: 1000,
      backgroundColor: isScrolled
        ? 'rgba(24, 24, 27, 0.80)'
        : 'transparent',
      backdropFilter: isScrolled ? 'blur(12px)' : 'none',
      WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
      transition: 'background-color 300ms var(--ease-standard), backdrop-filter 300ms var(--ease-standard)',
      borderBottom: isScrolled ? '1px solid var(--color-divider)' : '1px solid transparent',
    }}>
      {/* Header obsah */}
    </header>
  );
}
```

### Priklad: Premium label (normal case, NE uppercase)

```jsx
// SPRAVNE pro Var. B:
<span className="premium-label">Material type</span>

// SPATNE pro Var. B (toto je Var. A Industrial styl):
// <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
//   MATERIAL TYPE
// </span>
```

## R1.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `src/styles/premium-animations.css` | NOVY — vsechny keyframe animace | `mp-spec-fe-animations` |
| `src/styles/premium-utilities.css` | NOVY — utility CSS tridy | `mp-mid-design-system` |
| `src/styles/premium-backgrounds.css` | NOVY — ambient pozadi efekty | `mp-mid-design-system` |
| `src/styles/index.css` | EDIT — pridat importy novych CSS | `mp-mid-design-system` |
| `src/hooks/useSpringAnimation.js` | NOVY — spring animace hook | `mp-spec-fe-animations` |
| `src/hooks/useScrollHeader.js` | NOVY — blur header hook | `mp-spec-fe-animations` |
| `src/hooks/useReducedMotion.js` | NOVY — reduced motion hook | `mp-spec-design-a11y` |

## R1.8 Acceptance Criteria

- [ ] Vsechny keyframe animace definovane a funkcni v premium-animations.css
- [ ] Utility tridy (premium-h1 az premium-tech, premium-card, premium-label) pouzitelne
- [ ] Spring easing `cubic-bezier(0.16,1,0.3,1)` pouzity konzistentne ve vsech spring animacich
- [ ] `prefers-reduced-motion: reduce` disabluje vsechny animace
- [ ] useSpringAnimation hook funguje s IntersectionObserver
- [ ] useScrollHeader hook spravne detekuje scroll a vraci isScrolled
- [ ] useReducedMotion hook reaguje na zmenu system preference
- [ ] Zadna vizualni zmena na existujicim webu (utility tridy jsou jen pridane, nepouzite)
- [ ] CSS selektory nemaji konflikty s existujicimi Tailwind tridami
- [ ] `npm run build` prochazi bez chyb
- [ ] Celkova velikost novych CSS souboru < 15kB (pred gzip)

## R1.9 Eskalacni cesta

1. CSS specificity konflikty s Tailwind → `mp-sr-frontend` rozhodne o naming konvenci (prefix `premium-`)
2. IntersectionObserver nefunguje v starsich prohlizecich → `mp-spec-design-a11y` pridaj fallback
3. Animace zpusobuji jank na mobilech → `mp-spec-fe-animations` optimalizuje (will-change, transform-only)
4. Naming konflikt s existujicimi CSS tridami → `mp-mid-design-system` prejmenuje

## R1.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0 (fonts + tokens) | Blocking | R1 pouziva tokeny z R0 |
| R2 zavisi na R1 | Blocking | R2 pouziva utility tridy a animace z R1 |
| Zadna externi nova zavislost | — | Vsechno je vanilla CSS + React hooks |

---

# R2: Zakladni Komponenty (15+)

## R2.1 Prehled

Faze R2 implementuje 15+ zakladnich UI komponent v premium designu. Kazda komponenta
pouziva CSS custom properties z R0 a utility tridy z R1. Komponenty nahrazuji
existujici UI prvky v `src/components/ui/` — zachovavaji stejne API (props) ale
meni vizualni styl na premium. Klicove zmeny oproti soucasnemu stavu:

- **Button:** Vetsi border-radius (12px), tmavy text na amber pozadi, spring press efekt
- **Card:** Zadny border, shadow-only, vetsi radius (16px), spring hover lift
- **Input:** Vetsi vyska (48px), vetsi radius (12px), amber focus ring
- **Select:** Custom dropdown s 12px radius, 48px vyska
- **Modal/Dialog:** Velky radius (20px), scale spring animace, blur overlay
- **Badge:** Vzdy pill (999px radius), vcetne violet varianty
- **Toast:** Bez leveho borderu (rozdil od Var. A), ikona v kruhu per typ
- **Label:** Normal case, Satoshi 500, 12px (ne UPPERCASE 11px)
- **Slider:** Amber draha, 18px thumb s bilym borderem
- **Toggle:** Vetsi (48x24px), amber on, spring animace
- **Checkbox:** Rounded 6px, amber fill, animated checkmark
- **Tooltip:** Elevated bg, 12px radius, shadow level 2
- **Skeleton/Shimmer:** Premium shimmer animace
- **BackgroundPattern:** Radial gradient ambient (ne blueprint/dots)
- **Container:** Max-width s center alignment, generous padding

## R2.2 Vedouci agent

`mp-mid-design-system` — vlastni vsechny UI komponenty v `src/components/ui/`.

## R2.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Review komponentniho API, React patterns |
| `mp-sr-design` | Vizualni review kazde komponenty |
| `mp-spec-fe-forms` | Input, Select, Checkbox, Slider integrace |
| `mp-spec-fe-animations` | Spring animace na Button, Card, Modal, Toast |
| `mp-spec-design-a11y` | ARIA atributy, keyboard navigace, kontrast |
| `mp-mid-quality-code` | Code review, prop types konzistence |

## R2.4 Skills

| Skill | Pouziti |
|-------|---------|
| `review-pr` | Review kazde komponenty pred mergem |
| `lint-fix` | Auto-fix po zmenach |
| `vitest` | Unit testy pro kriticke komponenty (Button, Input) |
| `verification-before-completion` | Overeni vsech 15 komponent |

## R2.5 Ukoly

### R2.5.1 Button — Premium varianta

Kompletni prestavba Button komponenty na premium styl. Zachovat existujici API
(variant, size, asChild, fullWidth, loading, iconName, icon, iconPosition).

**Klicove zmeny:**
- border-radius: 12px (z 8px/rounded-lg)
- Primary: amber pozadi `#F59E0B`, TMAVY text `#09090B` (Apple styl)
- Hover: `#D97706` + glow efekt
- Press: scale(0.97) → scale(1) spring animace
- Vetsi velikosti: sm=36px, md=44px, lg=52px
- Font: Satoshi 500, 15px

```jsx
// src/components/ui/Button.jsx — PREMIUM varianta
// Zmeny oproti soucasnosti:
// 1. Border radius 12px misto rounded-lg (8px)
// 2. Primary varianta: amber bg + DARK text (ne white text)
// 3. Vetsi velikosti (sm=36px, md=44px, lg=52px)
// 4. Spring press animace
// 5. Focus ring v amber misto generic ring

const premiumButtonStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: 'var(--text-button)',
    borderRadius: 'var(--radius-button)', /* 12px */
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--duration-standard) var(--ease-standard)',
    outline: 'none',
  },
  variants: {
    primary: {
      backgroundColor: 'var(--color-amber)',
      color: 'var(--color-base)', /* TMAVY text na svetlem pozadi — Apple styl */
      /* hover: bg var(--color-amber-hover), shadow var(--shadow-glow-amber) */
    },
    secondary: {
      backgroundColor: 'var(--color-elevated)',
      color: 'var(--color-text-primary)',
      /* hover: bg var(--color-overlay) */
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      /* hover: color var(--color-text-primary), bg rgba(255,255,255,0.05) */
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-overlay)',
      /* hover: border var(--color-amber), color var(--color-amber) */
    },
    destructive: {
      backgroundColor: 'transparent',
      color: 'var(--color-error)',
      border: '1px solid var(--color-error)',
      /* hover: bg var(--color-error), color white */
    },
  },
  sizes: {
    sm: { height: '36px', padding: '0 16px', fontSize: '14px' },
    md: { height: '44px', padding: '0 20px', fontSize: '15px' },
    lg: { height: '52px', padding: '0 28px', fontSize: '16px' },
    icon: { height: '44px', width: '44px', padding: '0' },
  },
};
```

### R2.5.2 Card — Shadow-only, bez borderu

Kompletni prestavba Card compound komponenty. ZADNY border — oddeleni je
kontrastem pozadi (Surface `#18181B` na Base `#09090B`) + shadow.

```jsx
// src/components/ui/Card.jsx — PREMIUM varianta
// Klicove zmeny:
// 1. border: NONE (smazat border-border)
// 2. shadow-level-1 jako default
// 3. radius 16px misto rounded-xl (12px)
// 4. Hover na interaktivnich: translateY(-2px) + shadow-level-2, spring easing
// 5. Padding 24px misto p-6 (24px — stejna hodnota ale konzistentne pres token)

const Card = React.forwardRef(({ className, interactive, ...props }, ref) => (
  <div
    ref={ref}
    style={{
      backgroundColor: 'var(--color-surface)',
      borderRadius: 'var(--radius-card)', /* 16px */
      boxShadow: 'var(--shadow-level-1)',
      border: 'none', /* PREMIUM: zadny border */
      transition: interactive
        ? 'transform var(--duration-spring) var(--ease-spring), box-shadow var(--duration-spring) var(--ease-spring)'
        : 'none',
    }}
    className={className}
    {...props}
  />
));

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: 'var(--card-padding)', /* 24px */
    }}
    className={className}
    {...props}
  />
));

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    style={{
      fontFamily: 'var(--font-heading)', /* Instrument Serif */
      fontSize: 'var(--text-h3)', /* 24px */
      lineHeight: 'var(--lh-h3)',
      letterSpacing: 'var(--ls-h3)',
      fontWeight: 400,
      color: 'var(--color-text-primary)',
    }}
    className={className}
    {...props}
  />
));
```

### R2.5.3 Input — Vetsi, premium

Vetsi inputy (48px), vetsi radius (12px), amber focus.

```jsx
// src/components/ui/Input.jsx — PREMIUM varianta
// Zmeny:
// 1. Vyska 48px (md) misto 40px
// 2. Radius 12px misto 6px/rounded-md
// 3. Focus: amber border + amber ring
// 4. Background: var(--color-base) (#09090B)
// 5. Border: 1px solid var(--color-input-border) (#27272A)
// 6. Padding: 16px horizontal (vetsi)
// 7. Label: Satoshi 500, 14px, normal case, var(--color-text-secondary)

const premiumInputStyles = {
  wrapper: {
    width: '100%',
  },
  label: {
    display: 'block',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    marginBottom: '8px',
    /* Normal case — NE text-transform: uppercase */
  },
  input: {
    width: '100%',
    height: 'var(--input-height-md)', /* 48px */
    padding: '0 16px',
    backgroundColor: 'var(--color-base)',
    border: '1px solid var(--color-input-border)',
    borderRadius: 'var(--radius-input)', /* 12px */
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-body)', /* 16px */
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color var(--duration-micro) var(--ease-micro), box-shadow var(--duration-micro) var(--ease-micro)',
  },
  inputFocus: {
    borderColor: 'var(--color-input-focus-border)', /* #F59E0B */
    boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.15)',
  },
  inputError: {
    borderColor: 'var(--color-error)',
  },
  placeholder: {
    color: 'var(--color-text-disabled)', /* #52525B */
  },
  errorMessage: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    color: 'var(--color-error)',
    marginTop: '6px',
  },
};
```

### R2.5.4 Select — Custom dropdown

Custom select dropdown s premium stylem.

```jsx
// Specifikace pro Select komponentu:
// - Stejna zakladni styly jako Input (48px, 12px radius, amber focus)
// - Dropdown: bg var(--color-elevated), radius 12px, shadow level 2
// - Option: padding 10px 16px, hover bg var(--color-overlay)
// - Selected option: bg var(--color-amber-subtle), color var(--color-amber)
// - Arrow ikona: chevron-down, var(--color-text-muted), rotate 180deg pri otevreni
// - Animace open: scale(0.97) -> scale(1) + fade, 250ms spring
// - Max-height: 300px, scrollable
```

### R2.5.5 Dialog/Modal — Velky radius, spring animace

```jsx
// src/components/ui/Dialog.jsx — PREMIUM varianta
// Zmeny:
// 1. Radius 20px misto 12px
// 2. Bg var(--color-elevated) (#27272A), border NONE
// 3. Shadow level 3
// 4. Overlay: rgba(0,0,0,0.6), backdrop-blur 8px
// 5. Enter: scale(0.97)->1.0, 400ms spring
// 6. Exit: 250ms ease
// 7. Header: Instrument Serif 400, 24px
// 8. Padding 32px (vetsi)

const premiumDialogStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 1100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: 'var(--color-elevated)',
    borderRadius: 'var(--radius-modal)', /* 20px */
    boxShadow: 'var(--shadow-level-3)',
    border: 'none',
    padding: '32px',
    maxWidth: '440px', /* sm */
    width: '90%',
    animation: 'premium-modal-enter var(--duration-enter) var(--ease-spring) both',
  },
  header: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--text-h3)', /* 24px */
    fontWeight: 400,
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--space-5)', /* 20px */
  },
};
```

### R2.5.6 Badge — Pill vzdy, s violet variantou

```jsx
// Vsechny badges jsou PILL (radius 999px)
// Varianty: default, amber, violet, green, red, blue
const premiumBadgeStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 'var(--radius-badge)', /* 999px */
    padding: '4px 12px',
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: 1,
  },
  variants: {
    default: { background: 'rgba(161,161,170,0.10)', color: '#A1A1AA' },
    amber:   { background: 'rgba(245,158,11,0.10)',  color: '#F59E0B' },
    violet:  { background: 'rgba(139,92,246,0.10)',   color: '#8B5CF6' },
    green:   { background: 'rgba(34,197,94,0.10)',    color: '#22C55E' },
    red:     { background: 'rgba(239,68,68,0.10)',    color: '#EF4444' },
    blue:    { background: 'rgba(96,165,250,0.10)',   color: '#60A5FA' },
  },
};
```

### R2.5.7 Toast — Bez leveho borderu, ikona v kruhu

```jsx
// Rozdil od Var. A: ZADNY levy border
// Misto toho: ikona v kruhu s subtle bg per typ
const premiumToastStyles = {
  container: {
    backgroundColor: 'var(--color-elevated)',
    borderRadius: 'var(--radius-card)', /* 16px */
    boxShadow: 'var(--shadow-level-2)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    border: 'none', /* ZADNY levy border */
    animation: 'premium-toast-enter var(--duration-spring) var(--ease-spring) both',
    maxWidth: '400px',
  },
  iconCircle: {
    width: '32px',
    height: '32px',
    borderRadius: 'var(--radius-badge)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    /* bg a color per typ — success/error/warning/info */
  },
  /* Auto-dismiss: 5s, fade-out 250ms */
};
```

### R2.5.8 Label — Normal case, Satoshi 500

```jsx
// src/components/ui/label.jsx — PREMIUM varianta
// KRITICKA ZMENA: Normal case (ne UPPERCASE — to je Var. A Industrial)
const premiumLabelStyles = {
  fontFamily: 'var(--font-body)', /* Satoshi */
  fontSize: 'var(--text-label)', /* 12px */
  lineHeight: 'var(--lh-label)', /* 1.3 */
  fontWeight: 500,
  letterSpacing: 'var(--ls-label)', /* 0.02em */
  color: 'var(--color-text-secondary)', /* #A1A1AA */
  /* textTransform: 'none' — EXPLICITNE zadne uppercase */
};
```

### R2.5.9 Slider — Amber draha, vetsi thumb

```jsx
// Slider specifikace:
// - Track: bg var(--color-overlay) (#3F3F46), height 4px, radius 999px
// - Filled track: bg var(--color-amber) (#F59E0B)
// - Thumb: 18px circle, bg white, border 2px solid var(--color-amber)
// - Thumb shadow: 0 2px 4px rgba(0,0,0,0.3)
// - Hover thumb: scale(1.1), transition 150ms spring
// - Active thumb: scale(0.95)
// - Value label: Geist Mono, 14px, above thumb (tooltip style)
```

### R2.5.10 Toggle/Switch — Vetsi, amber on, spring

```jsx
// Toggle specifikace:
// - Sirka: 48px, Vyska: 24px (vetsi nez Var. A 44x22)
// - Off: bg var(--color-overlay) (#3F3F46), thumb var(--color-text-secondary) (#A1A1AA)
// - On: bg var(--color-amber) (#F59E0B), thumb white
// - Transition: 250ms spring easing
// - Thumb: 20px, box-shadow: 0 1px 3px rgba(0,0,0,0.3)
// - Disabled: opacity 0.5, cursor not-allowed
```

### R2.5.11 Checkbox — Rounded, amber fill

```jsx
// Checkbox specifikace:
// - Size: 20px x 20px
// - Unchecked: border 2px solid var(--color-overlay), bg transparent, radius 6px
// - Checked: bg var(--color-amber), border var(--color-amber), radius 6px
// - Checkmark: white SVG, animated stroke-dashoffset draw-in
// - Focus: amber ring 3px
// - Hover unchecked: border var(--color-text-muted)
```

### R2.5.12 Tooltip — Elevated bg, premium radius

```jsx
// Tooltip specifikace:
// - Bg: var(--color-elevated) (#27272A)
// - Radius: 12px
// - Shadow: level 2
// - Padding: 8px 12px
// - Text: Satoshi 400, 13px, var(--color-text-primary)
// - Arrow: 6px triangle, same bg color
// - Enter: fade + translateY(-4px), 200ms spring
// - Exit: 150ms
// - Delay: 500ms pred zobrazenim
```

### R2.5.13 Skeleton/Shimmer — Premium shimmer

```jsx
// Skeleton specifikace:
// - Bg: var(--color-surface) s premium shimmer gradientem
// - Radius: odpovidajici nahrazovanemu elementu
// - Animace: premium-shimmer 1500ms linear infinite
// - Gradient: surface -> elevated -> surface (jemny svetelny sweep)
function PremiumSkeleton({ width, height, radius = 'var(--radius-card)' }) {
  return (
    <div
      className="premium-animate-shimmer"
      style={{
        width,
        height,
        borderRadius: radius,
      }}
    />
  );
}
```

### R2.5.14 BackgroundPattern — Radial ambient

```jsx
// Nahrazuje blueprint grid (Var. A) za radial gradient ambient efekty
// src/components/ui/BackgroundPattern.jsx — PREMIUM varianta
function PremiumBackgroundPattern({ variant = 'ambient' }) {
  const patterns = {
    ambient: 'premium-bg-hero',       /* radial gradient nahore */
    login: 'premium-bg-login',         /* radial gradient ve stredu */
    cta: 'premium-bg-cta',             /* radial gradient ve stredu */
    viewer: 'premium-bg-viewer',       /* radial gradient pro 3D viewer */
  };
  return (
    <div
      className={patterns[variant] || patterns.ambient}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
```

### R2.5.15 Container — Generous padding

```jsx
// src/components/ui/Container.jsx — PREMIUM varianta
// Vetsi max-width a padding nez soucasnost
function PremiumContainer({ children, size = 'default', className }) {
  const maxWidths = {
    narrow: '720px',
    default: '1080px',
    wide: '1280px',
    full: '100%',
  };
  return (
    <div
      className={className}
      style={{
        maxWidth: maxWidths[size],
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: 'var(--page-padding-x)',
        paddingRight: 'var(--page-padding-x)',
      }}
    >
      {children}
    </div>
  );
}
```

## R2.6 Code Examples

### Kompletni priklad: Premium Button komponenta

```jsx
import React from 'react';

const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled = false,
  fullWidth = false,
  iconName,
  icon,
  iconPosition = 'left',
  className = '',
  style = {},
  ...props
}, ref) => {

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-amber)',
      color: 'var(--color-base)', /* TMAVY text — Apple styl */
    },
    secondary: {
      backgroundColor: 'var(--color-elevated)',
      color: 'var(--color-text-primary)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid var(--color-overlay)',
    },
    destructive: {
      backgroundColor: 'transparent',
      color: 'var(--color-error)',
      border: '1px solid var(--color-error)',
    },
  };

  const sizeStyles = {
    sm: { height: 'var(--button-height-sm)', padding: '0 16px', fontSize: '14px' },
    md: { height: 'var(--button-height-md)', padding: '0 20px', fontSize: '15px' },
    lg: { height: 'var(--button-height-lg)', padding: '0 28px', fontSize: '16px' },
    icon: { height: 'var(--button-height-md)', width: 'var(--button-height-md)', padding: '0' },
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    borderRadius: 'var(--radius-button)', /* 12px */
    border: 'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all var(--duration-standard) var(--ease-standard)',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  return (
    <button
      ref={ref}
      style={baseStyle}
      disabled={disabled || loading}
      className={`premium-focus-ring ${className}`}
      {...props}
    >
      {loading && <span className="premium-spinner" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
```

## R2.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `src/components/ui/Button.jsx` | EDIT — premium styly | `mp-mid-design-system` |
| `src/components/ui/Card.jsx` | EDIT — shadow-only, bez borderu | `mp-mid-design-system` |
| `src/components/ui/Input.jsx` | EDIT — 48px, 12px radius, amber focus | `mp-spec-fe-forms` |
| `src/components/ui/Select.jsx` | EDIT — premium dropdown | `mp-spec-fe-forms` |
| `src/components/ui/Dialog.jsx` | EDIT — 20px radius, spring animace | `mp-mid-design-system` |
| `src/components/ui/Slider.jsx` | EDIT — amber draha, 18px thumb | `mp-spec-fe-forms` |
| `src/components/ui/Checkbox.jsx` | EDIT — rounded, amber fill | `mp-spec-fe-forms` |
| `src/components/ui/label.jsx` | EDIT — normal case, Satoshi 500 | `mp-mid-design-system` |
| `src/components/ui/tooltip.jsx` | EDIT — elevated bg, 12px radius | `mp-mid-design-system` |
| `src/components/ui/BackgroundPattern.jsx` | EDIT — radial ambient | `mp-mid-design-system` |
| `src/components/ui/Container.jsx` | EDIT — generous padding | `mp-mid-design-system` |
| `src/components/ui/ColorPicker.jsx` | EDIT — premium styly | `mp-spec-fe-forms` |
| `src/components/ui/WelcomeHeader.jsx` | EDIT — Instrument Serif | `mp-mid-design-system` |

## R2.8 Acceptance Criteria

- [ ] Vsech 15+ komponent implementovano s premium styly
- [ ] Button: amber bg + tmavy text na primary, 12px radius, 44px md vyska
- [ ] Card: zadny border, shadow-only, 16px radius, spring hover lift
- [ ] Input: 48px vyska, 12px radius, amber focus ring
- [ ] Dialog: 20px radius, spring scale animace, blur overlay 8px
- [ ] Badge: vsechny varianty pill (999px), vcetne violet
- [ ] Toast: bez leveho borderu, ikona v kruhu per typ
- [ ] Label: normal case (NE uppercase), Satoshi 500, 12px
- [ ] Vsechny komponenty respektuji prefers-reduced-motion
- [ ] Vsechny komponenty maji ARIA atributy pro a11y
- [ ] Keyboard navigace funguje na vsech interaktivnich prvcich
- [ ] Existujici stranky se nerozpadnou (zachovano API komponent)
- [ ] `npm run build` prochazi bez chyb
- [ ] Bundle size navyseni max +20kB

## R2.9 Eskalacni cesta

1. Zmena API komponenty rozbije existujici stranku → `mp-sr-frontend` rozhodne o zpetne kompatibilite
2. Tailwind tridy konfliktuji s inline premium styly → `mp-mid-design-system` prioritizuje
3. Framer Motion animace nespolupracuji s CSS animacemi → `mp-spec-fe-animations` sjednocuje
4. A11y audit fail → `mp-spec-design-a11y` opravy, eskalace na `mp-sr-design`

## R2.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0 + R1 | Blocking | Tokeny + utility tridy musi existovat |
| R3 zavisi na R2 | Blocking | Layout pouziva komponenty z R2 |
| Existujici stranky | Non-blocking | Musi zacit fungovat hned po R2 (zpetna kompatibilita) |

---

# R3: Layout Shell (Header, Footer, Sidebar)

## R3.1 Prehled

Faze R3 implementuje tri hlavni layout komponenty v premium designu:

1. **Header** — Vyssi (64px), transparentni s blur efektem pri scrollu, serif italic logo,
   jemnejsi navigace, elegant mobile drawer
2. **Footer** — Splyne s page bg (#09090B), serif italic branding, velkorysejsi padding (72px top)
3. **Admin Sidebar** — Uzsi (220px), serif italic skupinove labely v amber, jemnejsi navigace,
   bg stejna jako page (#09090B — ne oddeleny panel)

Klicove premium odlisnosti od soucasneho stavu:
- Header je FIXED (ne sticky) a TRANSPARENTNI na vrchu, pri scrollu backdrop-blur
- Logo pouziva Instrument Serif italic pro "Model" + Satoshi 500 pro "Pricer"
- Sidebar skupinove labely jsou v Instrument Serif italic + amber barve (ne UPPERCASE sedy)
- Footer obsahuje serif italic tagline

## R3.2 Vedouci agent

`mp-spec-fe-layout` — specializovany agent pro layout komponenty.

## R3.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Review layout architektury, rozhodnuti o fixed vs sticky header |
| `mp-mid-frontend-admin` | Sidebar integrace s admin pages |
| `mp-mid-frontend-public` | Header/Footer integrace s public pages |
| `mp-spec-fe-animations` | Blur header scroll animace, mobile drawer spring |
| `mp-spec-design-responsive` | Responsive breakpointy, mobile layout |
| `mp-spec-design-a11y` | Skip links, landmark roles, focus management |

## R3.4 Skills

| Skill | Pouziti |
|-------|---------|
| `review-pr` | Review layout zmen |
| `lint-fix` | Auto-fix |
| `webapp-testing` | Smoke test layout na vsech strankach |

## R3.5 Ukoly

### R3.5.1 Header — Premium varianta

Kompletni prestavba Header komponenty. Zachovat existujici funkcionalitu
(navigace, jazykovy prepinac, user menu, mobile drawer) ale zmenit vizual.

**Specifikace:**
- **Vyska:** 64px (z 56px/h-16)
- **Pozice:** fixed top 0, z-index 1000
- **Background:** transparentni → blur pri scrollu
  - Na vrchu: `background: transparent`
  - Po scrollu (>20px): `background: rgba(24,24,27,0.80)` + `backdrop-filter: blur(12px)`
  - Transition: 300ms ease
- **Logo:**
  - "Model" — Instrument Serif italic, 18px, `#FAFAFA`
  - "Pricer" — Satoshi 500, 18px, `#FAFAFA`
  - Alternativne: serif "M" v amber `#F59E0B` + "odelPricer" v Satoshi
- **Nav linky:**
  - Font: Satoshi 400, 15px
  - Default: `#71717A` (muted)
  - Hover: `#A1A1AA`, transition 200ms
  - Active: `#FAFAFA`, 2px bottom amber podtrzeni (animovane zleva doprava)
  - Spacing: 32px mezi linky
- **Mobile hamburger:**
  - 2 thin linky (ne 3), 16px spacing mezi nimi
  - Slide-down panel s blur pozadim (ne drawer zprava)
  - Nebo zachovat drawer ale s premium styly

```jsx
// src/components/ui/Header.jsx — PREMIUM klicove zmeny

import { useScrollHeader } from '@/hooks/useScrollHeader';

function PremiumHeader() {
  const { isScrolled } = useScrollHeader(20);

  // Header wrapper style
  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 'var(--header-height)', /* 64px */
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 'var(--space-7)', /* 32px */
    paddingRight: 'var(--space-7)',
    backgroundColor: isScrolled ? 'rgba(24, 24, 27, 0.80)' : 'transparent',
    backdropFilter: isScrolled ? 'blur(12px)' : 'none',
    WebkitBackdropFilter: isScrolled ? 'blur(12px)' : 'none',
    borderBottom: isScrolled
      ? '1px solid var(--color-divider)'
      : '1px solid transparent',
    transition: 'background-color 300ms ease, backdrop-filter 300ms ease, border-color 300ms ease',
  };

  // Logo: Serif italic "Model" + Sans "Pricer"
  const logoStyle = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    textDecoration: 'none',
  };

  return (
    <header style={headerStyle}>
      <a href="/" style={logoStyle}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontStyle: 'italic',
          fontSize: '18px',
          color: 'var(--color-text-primary)',
        }}>
          Model
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          fontSize: '18px',
          color: 'var(--color-text-primary)',
        }}>
          Pricer
        </span>
      </a>

      {/* Nav, Language, User — zachovat logiku z existujiciho Header.jsx */}
    </header>
  );
}
```

### R3.5.2 Footer — Premium varianta

**Specifikace:**
- **Background:** `#09090B` (stejna jako page — splyne)
- **Horni border:** 1px `#27272A`
- **Padding:** 72px top, 40px bottom
- **Layout:** 3 sloupce (Product, Support, Legal) + spodni branding
- **Nadpisy sloupcu:** Satoshi 500, 14px, `#FAFAFA`
- **Linky:** Satoshi 400, 14px, `#71717A`, hover `#A1A1AA`
- **Spodni branding:**
  - Serif italic "ModelPricer" v `#52525B`, 14px
  - Tagline: "Precision pricing for 3D printing." v `#52525B`
  - Location: "Prague, CZ" vpravo
  - Rok: "2024-2026"
- **Mobile:** 2 sloupce → 1 sloupec

```jsx
// src/components/ui/Footer.jsx — PREMIUM specifikace
const premiumFooterStyles = {
  wrapper: {
    backgroundColor: 'var(--color-base)', /* #09090B — splyne s page */
    borderTop: '1px solid var(--color-divider)',
    paddingTop: 'var(--space-10)', /* 72px */
    paddingBottom: 'var(--space-8)', /* 40px */
    paddingLeft: 'var(--page-padding-x)',
    paddingRight: 'var(--page-padding-x)',
  },
  columnTitle: {
    fontFamily: 'var(--font-body)', /* Satoshi */
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
    marginBottom: 'var(--space-4)', /* 16px */
  },
  link: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 400,
    color: 'var(--color-text-muted)', /* #71717A */
    textDecoration: 'none',
    transition: 'color 200ms ease',
    /* hover: color var(--color-text-secondary) #A1A1AA */
  },
  branding: {
    fontFamily: 'var(--font-heading)', /* Instrument Serif */
    fontStyle: 'italic',
    fontSize: '14px',
    color: 'var(--color-text-disabled)', /* #52525B */
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--color-divider)',
    margin: 'var(--space-8) 0 var(--space-6) 0', /* 40px top, 24px bottom */
  },
};
```

### R3.5.3 Admin Sidebar — Premium varianta

**Specifikace:**
- **Sirka:** 220px (z 240px)
- **Background:** `#09090B` (stejna jako page — ne oddeleny panel)
- **Pravy border:** 1px `#27272A`
- **Logo area:**
  - Padding 24px
  - Serif italic "ModelPricer" 16px, `#FAFAFA`
  - Tenant nazev: Satoshi 400, 13px, `#71717A`
- **Skupinove labely:**
  - **Instrument Serif italic**, 12px, `#F59E0B` (amber) — PREMIUM KLICOVY PRVEK
  - margin-top 28px
  - Toto je velky vizualni diferenciator — serif italic labely v amber
- **Nav item:**
  - Vyska 44px, padding 0 20px, gap 12px
  - Text: Satoshi 400, 15px, `#71717A`
  - Ikona: 18px, `#52525B`
  - Hover: text `#FAFAFA`, transition 200ms
  - Active: levy border 2px `#F59E0B`, text `#FAFAFA`, bg `rgba(245,158,11,0.05)`
- **Spodni user:**
  - Jmeno: Satoshi 400, 13px, `#A1A1AA`
  - Role: `#52525B`
  - Sign out: `#71717A`, hover `#EF4444`

```jsx
// src/pages/admin/AdminLayout.jsx — Sidebar premium zmeny

// Skupinovy label — SERIF ITALIC v AMBER
function SidebarGroupLabel({ children }) {
  return (
    <span style={{
      fontFamily: 'var(--font-heading)', /* Instrument Serif */
      fontStyle: 'italic',
      fontSize: '12px',
      color: 'var(--color-amber)', /* #F59E0B — amber premium! */
      paddingLeft: '20px',
      marginTop: '28px',
      marginBottom: '8px',
      display: 'block',
      /* NE text-transform: uppercase — to je Var. A */
    }}>
      {children}
    </span>
  );
}

// Nav item
function SidebarNavItem({ icon, label, path, isActive }) {
  return (
    <a
      href={path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        height: '44px',
        padding: '0 20px',
        fontFamily: 'var(--font-body)',
        fontSize: '15px',
        fontWeight: 400,
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        backgroundColor: isActive ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--color-amber)' : '2px solid transparent',
        textDecoration: 'none',
        transition: 'all 200ms ease',
      }}
    >
      <span style={{
        color: isActive ? 'var(--color-amber)' : 'var(--color-text-disabled)',
        fontSize: '18px',
      }}>
        {icon}
      </span>
      <span>{label}</span>
    </a>
  );
}

// Sidebar layout
const premiumSidebarStyles = {
  sidebar: {
    width: 'var(--sidebar-width)', /* 220px */
    backgroundColor: 'var(--color-base)', /* #09090B — stejna jako page */
    borderRight: '1px solid var(--color-divider)',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 900,
  },
  logoArea: {
    padding: '24px 20px',
    borderBottom: '1px solid var(--color-divider)',
  },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontStyle: 'italic',
    fontSize: '16px',
    color: 'var(--color-text-primary)',
  },
  tenantName: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    paddingTop: '8px',
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid var(--color-divider)',
  },
};
```

### R3.5.4 Admin Content Area

Oblast vedle sidebaru pro admin obsah.

```jsx
// Admin content wrapper
const premiumAdminContentStyles = {
  marginLeft: 'var(--sidebar-width)', /* 220px */
  minHeight: '100vh',
  backgroundColor: 'var(--color-base)',
  padding: 'var(--space-8) var(--page-padding-x)', /* 40px 40px */
};
```

### R3.5.5 Responsive breakpointy

```css
/* Premium responsive breakpoints */
/* Mobile: < 768px — single column, hidden sidebar, hamburger menu */
/* Tablet: 768px - 1024px — 2 columns, collapsible sidebar */
/* Desktop: > 1024px — full layout, visible sidebar */

@media (max-width: 767px) {
  :root {
    --page-padding-x: var(--page-padding-x-mobile); /* 20px */
    --page-padding-y: var(--page-padding-y-mobile); /* 32px */
    --text-h1: 36px;
    --text-h2: 28px;
    --text-h3: 20px;
    --section-gap: 56px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  :root {
    --page-padding-x: 32px;
    --text-h1: 42px;
    --section-gap: 72px;
  }
}
```

## R3.6 Code Examples

### Kompletni priklad: Premium Logo komponenta

```jsx
function PremiumLogo({ size = 'default' }) {
  const sizes = {
    small: { heading: '14px', body: '14px' },
    default: { heading: '18px', body: '18px' },
    large: { heading: '24px', body: '24px' },
  };

  return (
    <a href="/" style={{
      display: 'inline-flex',
      alignItems: 'baseline',
      gap: '2px',
      textDecoration: 'none',
    }}>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontStyle: 'italic',
        fontSize: sizes[size].heading,
        color: 'var(--color-text-primary)',
      }}>
        Model
      </span>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        fontSize: sizes[size].body,
        color: 'var(--color-text-primary)',
      }}>
        Pricer
      </span>
    </a>
  );
}
```

### Kompletni priklad: Mobile Menu (slide-down s blur)

```jsx
function PremiumMobileMenu({ isOpen, onClose, navItems }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
    }}>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      />
      {/* Panel — slide down from top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '24px',
        borderBottom: '1px solid var(--color-divider)',
        animation: 'premium-page-enter 300ms var(--ease-spring) both',
      }}>
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 0',
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              fontWeight: 400,
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--color-divider)',
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
```

## R3.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `src/components/ui/Header.jsx` | EDIT — kompletni premium prestavba | `mp-spec-fe-layout` |
| `src/components/ui/Footer.jsx` | EDIT — premium styly, serif branding | `mp-spec-fe-layout` |
| `src/pages/admin/AdminLayout.jsx` | EDIT — premium sidebar (220px, serif labels) | `mp-mid-frontend-admin` |
| `src/styles/premium-tokens.css` | EDIT — responsive breakpoint overrides | `mp-mid-design-system` |
| `src/hooks/useScrollHeader.js` | POUZIT — pro blur header efekt | `mp-spec-fe-layout` |

## R3.8 Acceptance Criteria

- [ ] Header: 64px vyska, fixed, transparentni -> blur pri scrollu
- [ ] Header: logo v Instrument Serif italic "Model" + Satoshi "Pricer"
- [ ] Header: nav linky v Satoshi 400 15px, active = amber podtrzeni
- [ ] Header: mobile menu funguje (slide-down nebo drawer s blur)
- [ ] Footer: splyne s page bg (#09090B), serif italic branding
- [ ] Footer: 72px top padding, 3 sloupce na desktopu
- [ ] Sidebar: 220px, bg #09090B (stejna jako page)
- [ ] Sidebar: skupinove labely v Instrument Serif italic, amber (#F59E0B)
- [ ] Sidebar: active nav item ma levy amber border a jemne amber bg
- [ ] Sidebar: nav items maji 44px vysku, Satoshi 400 15px
- [ ] Responsive: header/footer/sidebar funguje na mobile (< 768px)
- [ ] Skip link na zacatku stranky pro a11y
- [ ] ARIA landmarks: `<header role="banner">`, `<nav>`, `<main>`, `<footer>`
- [ ] `npm run build` prochazi bez chyb

## R3.9 Eskalacni cesta

1. Fixed header zpusobuje layout shift na nekterych strankach → `mp-sr-frontend` rozhodne o fallbacku
2. Blur efekt nefunguje v Safari → `mp-spec-design-responsive` pridaj -webkit- prefix
3. Sidebar 220px je prilis uzka pro dlouhe texty → `mp-mid-frontend-admin` upravi text truncation
4. Mobile drawer koliduje s existujicim Framer Motion kodem → `mp-spec-fe-animations` sjednocuje

## R3.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0 + R1 + R2 | Blocking | Layout pouziva tokeny, utility, komponenty |
| R4 zavisi na R3 | Blocking | Public pages pouzivaji Header + Footer |
| R6 zavisi na R3 | Blocking | Admin pages pouzivaji Sidebar |
| `src/Routes.jsx` | HOT SPOT | Header/Footer integrace — informovat `mp-spec-fe-routing` |

---

# R4: Public Pages

## R4.1 Prehled

Faze R4 aplikuje premium design na vsechny verejne stranky: Home, Login, Register,
Pricing, Support a 404. Kazda stranka dostane premium vizualni jazyk — serif headingy,
centrovane zen layouty, ambient glow efekty, velkorysejsi spacing a sofistikovanejsi
barevnou paletu. Home page je klicova — centrovany hero s Instrument Serif nadpisem,
ambient radial gradient pozadi, 3D model pod textem (ne vedle), a minimalisticke
feature karty.

## R4.2 Vedouci agent

`mp-mid-frontend-public` — vlastni vsechny verejne stranky.

## R4.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Architekturalni review, lazy loading strategie |
| `mp-sr-design` | UX review kazde stranky, vizualni konzistence |
| `mp-spec-fe-animations` | Stagger animace, ambient pulse, hero efekty |
| `mp-spec-fe-3d-viewer` | 3D model na hero (jemna rotace, ambient light) |
| `mp-spec-design-responsive` | Mobile layout kazde stranky |
| `mp-spec-design-a11y` | Kontrast, heading hierarchy, form labels |
| `mp-spec-design-onboarding` | Registration wizard UX |
| `mp-mid-design-ux` | Flow review pro login/register |

## R4.4 Skills

| Skill | Pouziti |
|-------|---------|
| `review-pr` | Review kazde stranky |
| `lint-fix` | Auto-fix |
| `webapp-testing` | Smoke test vsech public routes |
| `verification-before-completion` | Overeni vsech stranek |

## R4.5 Ukoly

### R4.5.1 Home Page — Premium varianta

**Hero sekce:**
- Layout: CENTROVANY — text uprostred, model POD nim (ne vedle — to je Var. A)
- Pozadi: `#09090B` s radialnim gradientem nahore (`#27272A` -> `#09090B`) — ambient
- Nadpis: Instrument Serif 400, 48px desktop / 36px mobile, `#FAFAFA`, text-align center
  - Priklad: "Precision pricing for 3D printing."
- Podnadpis: Satoshi 400, 18px, `#71717A`, max-width 480px, centrovany
- CTA: Amber button, centrovany, 52px vyska (lg), radius 12px
  - Text: "Get started" v Satoshi 500 — TMAVY text na amber pozadi
  - Glow: `0 0 24px rgba(245,158,11,0.25)` ambient
  - Breathing animace: jemny pulse 4s infinite
- 3D model: Male (max 320px), pod textem, centrovany
  - Jemna Y rotace (10s cyklus)
  - Ambient light 0.4, directional 0.6
  - Mesh material: `#A1A1AA` (sestribrny)
- Padding: 120px top (hodne prazdneho mista), 72px bottom
- Celkovy dojem: hodne dychu, zen, focus na zprave

```jsx
// Home Hero — Premium varianta (centrovany layout)
function PremiumHero() {
  return (
    <section className="premium-bg-hero" style={{
      paddingTop: '120px',
      paddingBottom: '72px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      position: 'relative',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'var(--text-h1)', /* 48px */
        lineHeight: 'var(--lh-h1)',
        letterSpacing: 'var(--ls-h1)',
        fontWeight: 400,
        color: 'var(--color-text-primary)',
        maxWidth: '600px',
      }}>
        Precision pricing for 3D printing.
      </h1>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '18px',
        color: 'var(--color-text-muted)',
        maxWidth: '480px',
        marginTop: 'var(--space-5)',
        lineHeight: 1.6,
      }}>
        Automate your quotes with accuracy down to the cent.
      </p>

      <button className="premium-animate-breathing" style={{
        marginTop: 'var(--space-8)', /* 40px */
        height: 'var(--button-height-lg)', /* 52px */
        padding: '0 28px',
        backgroundColor: 'var(--color-amber)',
        color: 'var(--color-base)', /* TMAVY text */
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        fontSize: '16px',
        borderRadius: 'var(--radius-button)', /* 12px */
        border: 'none',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-glow-amber)',
      }}>
        Get started
      </button>

      {/* 3D Model — centrovany pod textem */}
      <div style={{
        marginTop: 'var(--space-9)', /* 56px */
        maxWidth: '320px',
        width: '100%',
        aspectRatio: '1',
      }}>
        {/* Three.js viewer — ambient light, slow Y rotation */}
      </div>
    </section>
  );
}
```

**Features sekce:**
- Layout: 2x2 grid, max-width 800px, centrovany
- Karta: bg `#18181B`, BEZ borderu, radius 16px, padding 32px, shadow level 1
- Hover: translateY(-2px), shadow level 2, 300ms spring
- Ikona: 24px v amber, v kruhu s amber subtle bg (32px kruh)
- Nadpis: Satoshi 500, 18px, `#FAFAFA`
- Popis: Satoshi 400, 14px, `#71717A`
- Stagger animace: 100ms delay per karta pri prvnim zobrazeni

**How it works sekce:**
- 3 kroky elegantne vizualizovane
- Cisla: Instrument Serif italic, 64px, `#F59E0B`, opacity 0.2 jako pozadi za textem
- Nadpis: Satoshi 500, 20px
- Popis: Satoshi 400, 14px, `#71717A`
- Spojeni: thin horizontal linka `#27272A`

**Social proof:**
- Serif italic "Trusted by 200+ 3D printing businesses" v `#71717A`, centrovane
- Logo radka: opacity 0.3, hover 0.6, smooth transition

**Pricing sekce:**
- 3 karty, prostredni featured (border `#F59E0B`, badge "Recommended" pill amber)
- Ceny: Geist Mono 500, 36px
- Toggle mesicni/rocni: pill s amber aktivnim
- Features: checkmarky v `#22C55E`

**CTA sekce:**
- Serif italic velky text (36px), centrovany
- Amber button pod nim
- Pozadi: radial gradient (center `#27272A`)

### R4.5.2 Login Page — Premium varianta

- Layout: Centrovany card na plne strance (ne split-screen jako Var. A)
- Card: bg `#18181B`, BEZ borderu, radius 20px, shadow level 2, max-width 400px, padding 40px
- Pozadi: `#09090B` s radialnim gradientem (center `#18181B` — ambient efekt za cardem)
- Nadpis: Instrument Serif 400, 28px, "Welcome back"
- Podnadpis: Satoshi 400, 14px, `#71717A`
- Inputy: 48px vyska, 12px radius, bg `#09090B`, border `#27272A`
- CTA: Full-width amber, 48px, radius 12px, tmavy text
- Social: Ikony v kruzich 48px, border `#27272A`, spacing 12px
- Divider: "or" text uprostred linky `#27272A`

```jsx
function PremiumLogin() {
  return (
    <div className="premium-bg-login" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div className="premium-animate-page-enter" style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-modal)', /* 20px */
        boxShadow: 'var(--shadow-level-2)',
        border: 'none',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '28px',
          fontWeight: 400,
          color: 'var(--color-text-primary)',
          marginBottom: '8px',
        }}>
          Welcome back
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-7)', /* 32px */
        }}>
          Sign in to your account
        </p>

        {/* Form fields with premium Input components */}
        {/* Social login icons */}
        {/* Amber CTA button */}
      </div>
    </div>
  );
}
```

### R4.5.3 Register Page — Premium varianta

- Podobna struktura jako login ale s vice kroky
- Progress steps: cisla v kruzich 32px, serif font
- Active krok: filled amber, bily text
- Dokonceny: filled `#22C55E`, fajfka
- Budouci: border `#3F3F46`, text `#52525B`
- Role selection: velke karty s ikonami, radius 16px, shadow-only

### R4.5.4 Pricing Page — Premium varianta

- 3 cenove karty, centrovane
- Featured karta (prostredni): border 1px `#F59E0B`, badge "Recommended" amber pill
- Ceny: Geist Mono 500, 36px, `#FAFAFA`
- Mesicni/rocni toggle: pill prepinac, aktivni = amber
- Feature list: Satoshi 400, 14px, checkmarky `#22C55E`
- CTA na kazde karte: amber primary na featured, ghost na ostatnich

### R4.5.5 Support Page — Premium varianta

- FAQ: Accordion s serif italic otazkami
- Kontakt: jednoduchy formular v premium stylu (48px inputy)
- Support hover karty: radius 16px, shadow-only, amber ikony

### R4.5.6 404 Page — Premium varianta

- Centrovana stranka, serif italic "404" v 96px, `#F59E0B`, opacity 0.3
- Pod cislem: Instrument Serif "Page not found" 36px
- Podnadpis: Satoshi 400, `#71717A`
- CTA: amber button "Go home"

## R4.6 Code Examples

### Priklad: Feature Card s stagger animaci

```jsx
import { useSpringAnimation } from '@/hooks/useSpringAnimation';

const features = [
  { icon: 'Target', title: 'Accurate Pricing', desc: 'Calculate costs based on real material usage and machine time.' },
  { icon: 'Code', title: 'Embeddable Widget', desc: 'Add instant quoting to your website with a single embed code.' },
  { icon: 'FileBox', title: 'Multi-format Support', desc: 'Accept STL, 3MF, OBJ and STEP files from your customers.' },
  { icon: 'BarChart3', title: 'Analytics Dashboard', desc: 'Track orders, revenue, and customer behavior in real time.' },
];

function PremiumFeatures() {
  return (
    <section style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: 'var(--section-gap) var(--page-padding-x)',
    }}>
      <div className="premium-stagger" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--card-gap)', /* 20px */
      }}>
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, index }) {
  const { ref } = useSpringAnimation({
    animationClass: 'premium-animate-fade-in-up',
    delay: index * 100,
  });

  return (
    <div ref={ref} className="premium-card premium-card-interactive" style={{
      padding: '32px',
      opacity: 0, /* initial — animace nastavi na 1 */
    }}>
      {/* Amber icon circle */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: 'var(--radius-badge)',
        backgroundColor: 'var(--color-amber-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-amber)',
      }}>
        {/* <Icon name={icon} size={18} /> */}
      </div>

      <h3 style={{
        fontFamily: 'var(--font-body)',
        fontSize: '18px',
        fontWeight: 500,
        color: 'var(--color-text-primary)',
        marginTop: 'var(--space-4)',
      }}>
        {title}
      </h3>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--color-text-muted)',
        marginTop: 'var(--space-2)',
        lineHeight: 'var(--lh-body-sm)',
      }}>
        {desc}
      </p>
    </div>
  );
}
```

### Priklad: "How it works" s serif cislami jako pozadim

```jsx
function PremiumHowItWorks() {
  const steps = [
    { num: '1', title: 'Upload', desc: 'Drop your 3D model — we handle STL, 3MF, OBJ.' },
    { num: '2', title: 'Configure', desc: 'Choose material, quality and quantity.' },
    { num: '3', title: 'Get Price', desc: 'Instant, accurate quote ready to share.' },
  ];

  return (
    <section style={{
      padding: 'var(--section-gap) var(--page-padding-x)',
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-8)', /* 40px */
      }}>
        {steps.map((s, i) => (
          <div key={s.num} style={{
            flex: 1,
            position: 'relative',
            padding: 'var(--space-6)', /* 24px */
          }}>
            {/* Velke cislo v pozadi */}
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontStyle: 'italic',
              fontSize: '64px',
              color: 'var(--color-amber)',
              opacity: 0.15,
              position: 'absolute',
              top: '-10px',
              left: '0',
              lineHeight: 1,
              zIndex: 0,
            }}>
              {s.num}
            </span>

            <h3 style={{
              fontFamily: 'var(--font-body)',
              fontSize: '20px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              position: 'relative',
              zIndex: 1,
            }}>
              {s.title}
            </h3>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              marginTop: 'var(--space-2)',
              position: 'relative',
              zIndex: 1,
            }}>
              {s.desc}
            </p>

            {/* Spojovaci linka (krome posledniho) */}
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '-20px',
                width: '40px',
                height: '1px',
                backgroundColor: 'var(--color-divider)',
              }} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

## R4.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `src/pages/home/index.jsx` | EDIT — kompletni premium prestavba | `mp-mid-frontend-public` |
| `src/pages/login/index.jsx` | EDIT — centrovany card layout | `mp-mid-frontend-public` |
| `src/pages/login/components/LoginForm.jsx` | EDIT — premium inputy/CTA | `mp-spec-fe-forms` |
| `src/pages/login/components/LoginHeader.jsx` | EDIT — serif nadpis | `mp-mid-frontend-public` |
| `src/pages/login/components/SocialLogin.jsx` | EDIT — ikony v kruzich | `mp-mid-frontend-public` |
| `src/pages/login/components/LoginActions.jsx` | EDIT — amber CTA | `mp-mid-frontend-public` |
| `src/pages/register/index.jsx` | EDIT — premium register flow | `mp-mid-frontend-public` |
| `src/pages/register/components/RegistrationForm.jsx` | EDIT — premium inputy | `mp-spec-fe-forms` |
| `src/pages/register/components/ProgressSteps.jsx` | EDIT — serif cisla, amber active | `mp-mid-frontend-public` |
| `src/pages/register/components/RoleSelectionCard.jsx` | EDIT — shadow-only karty | `mp-mid-frontend-public` |
| `src/pages/pricing/index.jsx` | EDIT — premium cenove karty | `mp-mid-frontend-public` |
| `src/pages/support/index.jsx` | EDIT — premium FAQ accordion | `mp-mid-frontend-public` |
| `src/pages/NotFound.jsx` | EDIT — premium 404 | `mp-mid-frontend-public` |
| `src/components/marketing/SpotlightCard.jsx` | EDIT — premium hover efekt | `mp-spec-fe-animations` |
| `src/components/marketing/PricingPlanCard.jsx` | EDIT — premium cenova karta | `mp-mid-frontend-public` |
| `src/components/marketing/Accordion.jsx` | EDIT — serif italic otazky | `mp-mid-frontend-public` |

## R4.8 Acceptance Criteria

- [ ] Home hero: centrovany layout, serif nadpis, ambient glow pozadi
- [ ] Home hero: amber CTA s breathing animaci a glow efektem
- [ ] Home features: 2x2 grid, shadow-only karty, stagger animace
- [ ] Home how-it-works: serif cisla jako pozadi (opacity 0.15)
- [ ] Login: centrovany card s ambient glow za nim, 20px radius
- [ ] Register: serif cisla v progress steps, amber active
- [ ] Pricing: 3 karty, featured = amber border + pill badge
- [ ] Support: serif italic FAQ otazky, premium accordion
- [ ] 404: serif italic "404" v 96px amber
- [ ] Vsechny stranky maji page-enter animaci (fade + translateY)
- [ ] Vsechny stranky jsou responsive (mobile < 768px)
- [ ] WCAG AA kontrast splnen na vsech textech
- [ ] `npm run build` prochazi bez chyb

## R4.9 Eskalacni cesta

1. 3D model na hero je prilis tezky pro mobile → `mp-spec-3d-viewer` optimalizuje mesh/LOD
2. Ambient gradient neni viditelny na nekterych monitorech → `mp-sr-design` upravi intenzitu
3. Font fallback zpusobuje layout shift pri nacitani → `mp-mid-infra-build` pridaj font preload
4. Home page bundle prilis velky → `mp-sr-frontend` rozhodne o lazy loading 3D vieweru

## R4.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0 + R1 + R2 + R3 | Blocking | Stranky pouzivaji vsechny predchozi vrstvy |
| R5 je nezavisla na R4 | Parallel | Muze jit paralelne (jina stranka) |
| Three.js | External | 3D model na hero (existujici zavislost) |

---

# R5: Test Kalkulacka (5-step wizard)

## R5.1 Prehled

Faze R5 aplikuje premium design na test-kalkulacku — hlavni 5-krokovy wizard
pro kalkulaci cen 3D tisku. Toto je nejdulezitejsi uzivatelsky flow v aplikaci
a musi byt vizualne bezchybny. Premium zmeny zahrnuji vetsi inputy (48px),
serif step labely, glass-like viewer controls, elegantni cenovy prehled se serif
cenami, a luxusni checkout flow.

Klicove premium elementy v kalkulacce:
- Stepper: serif cisla v kruzich (32px), amber active, green complete
- Upload zona: serif italic "Drop your 3D model here", 20px radius
- 3D Viewer: floating pill control bar s blur, radius 999px
- Config: velke selecty/slidery (48px), amber presets
- Cenovy prehled: Instrument Serif velka cena (36px, amber), Geist Mono castky
- Checkout: prostorny 2-sloupec, serif "Place order", 52px submit
- Potvrzeni: animated SVG checkmark, serif "Thank you!"

## R5.2 Vedouci agent

`mp-mid-frontend-public` — vlastni test-kalkulacku (verejny flow).

## R5.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Review wizard architektury, state management |
| `mp-spec-fe-forms` | Vsechny formulare (config, checkout) |
| `mp-spec-fe-upload` | Upload zona, drag&drop, file preview |
| `mp-spec-fe-3d-viewer` | 3D viewer s premium controls |
| `mp-spec-fe-checkout` | Checkout flow, order summary |
| `mp-spec-fe-animations` | Stepper transitions, price flip, success checkmark |
| `mp-mid-pricing-engine` | Cenovy prehled, volume discounts display |
| `mp-spec-design-a11y` | Formular labels, error states, focus management |

## R5.4 Skills

| Skill | Pouziti |
|-------|---------|
| `review-pr` | Review kazdeho kroku |
| `vitest` | Unit testy pro cenove vypocty |
| `webapp-testing` | E2E test celeho 5-step flow |
| `verification-before-completion` | Overeni vsech 5 kroku |

## R5.5 Ukoly

### R5.5.1 Stepper — Premium varianta

```jsx
// Premium stepper specifikace:
// - Cisla v kruzich: 32px diameter (vetsi nez soucasnych 28px)
// - Font cisla: Instrument Serif 400 (serif — anti-AI)
// - Active krok: filled amber #F59E0B, text white
// - Dokonceny: filled #22C55E, bila fajfka SVG
// - Budouci: border #3F3F46 (2px), text #52525B
// - Spojovaci linka: 2px, #27272A (neaktivni), #22C55E (dokonceny), #F59E0B (aktivni)
// - Labels pod kruhy: Satoshi 400, 13px
// - Transition mezi kroky: fade + slide 300ms spring
// - Mobile: jen cisla bez textu, mensi kruhy (28px)

function PremiumStepper({ currentStep, steps }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0',
      padding: 'var(--space-7) 0', /* 32px vertical */
    }}>
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        const isFuture = i > currentStep;

        return (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}>
              {/* Circle */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-badge)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isCompleted ? 'var(--color-success)'
                  : isActive ? 'var(--color-amber)'
                  : 'transparent',
                border: isFuture ? '2px solid var(--color-overlay)' : 'none',
                transition: 'all var(--duration-spring) var(--ease-spring)',
              }}>
                {isCompleted ? (
                  /* Bila fajfka SVG */
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-heading)', /* Instrument Serif */
                    fontSize: '14px',
                    color: isActive ? 'white'
                      : isFuture ? 'var(--color-text-disabled)'
                      : 'var(--color-text-primary)',
                  }}>
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Label (hidden on mobile) */}
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: isActive ? 'var(--color-text-primary)'
                  : 'var(--color-text-muted)',
              }}>
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div style={{
                flex: 1,
                height: '2px',
                maxWidth: '80px',
                backgroundColor: isCompleted
                  ? 'var(--color-success)'
                  : 'var(--color-divider)',
                margin: '0 8px',
                marginBottom: '28px', /* offset pro label */
                transition: 'background-color var(--duration-spring) var(--ease-spring)',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
```

### R5.5.2 Upload Zona — Premium varianta

```jsx
// Upload zona specifikace:
// - Border: 2px dashed #3F3F46, radius 20px
// - Background: #09090B
// - Ikona: upload arrow, 40px, amber #F59E0B
// - Text: Serif italic "Drop your 3D model here" 18px, #71717A
// - Pod tim: Satoshi 400, 13px, "or click to browse" #52525B
// - Format badges: pills, bg #27272A, text #A1A1AA, 12px
// - Drag-over: border solid #F59E0B, bg rgba(245,158,11,0.04)
// - Hover: border #52525B (z #3F3F46), transition 200ms

function PremiumUploadZone({ onFileDrop, isDragOver }) {
  return (
    <div style={{
      border: isDragOver
        ? '2px solid var(--color-amber)'
        : '2px dashed var(--color-overlay)', /* #3F3F46 */
      borderRadius: 'var(--radius-upload)', /* 20px */
      backgroundColor: isDragOver
        ? 'rgba(245, 158, 11, 0.04)'
        : 'var(--color-base)',
      padding: 'var(--space-12) var(--space-8)', /* 120px 40px */
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-4)',
      cursor: 'pointer',
      transition: 'all var(--duration-standard) var(--ease-standard)',
    }}>
      {/* Upload ikona */}
      <div style={{ color: 'var(--color-amber)', fontSize: '40px' }}>
        {/* Upload arrow icon */}
      </div>

      {/* Serif italic text */}
      <p style={{
        fontFamily: 'var(--font-heading)',
        fontStyle: 'italic',
        fontSize: '18px',
        color: 'var(--color-text-muted)',
      }}>
        Drop your 3D model here
      </p>

      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--color-text-disabled)',
      }}>
        or click to browse
      </p>

      {/* Format badges */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        {['.STL', '.3MF', '.OBJ', '.STEP'].map(fmt => (
          <span key={fmt} style={{
            backgroundColor: 'var(--color-elevated)',
            color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-badge)',
            padding: '4px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
          }}>
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### R5.5.3 3D Viewer Controls — Floating pill bar s blur

```jsx
// 3D Viewer control bar specifikace:
// - Pozice: absolutne dole ve vieweru, centrovana
// - Shape: pill (radius 999px), padding 8px 16px
// - Background: rgba(24,24,27,0.85) s backdrop-blur 12px
// - Controls: Rotate, Zoom, Reset, Wireframe, Fullscreen
// - Ikony: 16px, #71717A, hover #FAFAFA, transition 200ms
// - Shadow: level 2

const viewerControlStyles = {
  position: 'absolute',
  bottom: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: 'rgba(24, 24, 27, 0.85)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: 'var(--radius-badge)', /* 999px — pill */
  padding: '8px 16px',
  boxShadow: 'var(--shadow-level-2)',
};
```

### R5.5.4 Config Panel — Premium inputy a slidery

```jsx
// Config panel specifikace:
// - Card: bg #18181B, radius 16px, padding 24px, NO border
// - Select: 48px vyska, 12px radius, custom dropdown
// - Slider: draha #3F3F46, vyplnena #F59E0B, thumb 18px s white border
// - Preset karty: 12px radius, padding 16px 20px
//   - Selected: bg rgba(245,158,11,0.08), ring 2px #F59E0B
//   - Neselected: bg #27272A, hover bg #3F3F46
// - Labels: Satoshi 500, 14px, normal case
// - Section titles: Satoshi 500, 16px, #FAFAFA

function PremiumPresetCard({ name, specs, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: isSelected
          ? 'rgba(245, 158, 11, 0.08)'
          : 'var(--color-elevated)',
        border: isSelected
          ? '2px solid var(--color-amber)'
          : '2px solid transparent',
        borderRadius: 'var(--radius-input)', /* 12px */
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all var(--duration-standard) var(--ease-standard)',
        textAlign: 'left',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '15px',
        fontWeight: 500,
        color: isSelected ? 'var(--color-amber)' : 'var(--color-text-primary)',
      }}>
        {name}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        color: 'var(--color-text-muted)',
        display: 'block',
        marginTop: '4px',
      }}>
        {specs}
      </span>
    </button>
  );
}
```

### R5.5.5 Cenovy Prehled — Serif cena, Geist Mono castky

```jsx
// Cenovy prehled specifikace:
// - Velka cena: Instrument Serif 400, 36px, amber #F59E0B
// - Radky: label Satoshi 400 14px, castka Geist Mono 400 14px
// - Discount: green pill badge
// - Separator: 1px #27272A
// - Breakdown: collapsible s animaci
// - Total radek: serif, 24px, amber

function PremiumPriceSummary({ items, total, discount }) {
  return (
    <div className="premium-card" style={{ padding: 'var(--card-padding)' }}>
      {/* Velka celkova cena navrchu */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <span style={{
          fontFamily: 'var(--font-heading)', /* Instrument Serif */
          fontSize: 'var(--text-price-lg)', /* 36px */
          color: 'var(--color-amber)',
          lineHeight: 1.1,
        }}>
          {total}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--color-text-muted)',
          marginLeft: '4px',
        }}>
          Kc
        </span>
      </div>

      {/* Separator */}
      <div className="premium-divider" />

      {/* Polozky */}
      {items.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
          }}>
            {item.label}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', /* Geist Mono */
            fontSize: '14px',
            color: 'var(--color-text-primary)',
          }}>
            {item.amount}
          </span>
        </div>
      ))}

      {/* Discount badge */}
      {discount && (
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'rgba(34, 197, 94, 0.10)',
          color: 'var(--color-success)',
          borderRadius: 'var(--radius-badge)',
          padding: '4px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          fontWeight: 500,
          marginTop: '8px',
        }}>
          -{discount}%
        </div>
      )}
    </div>
  );
}
```

### R5.5.6 Checkout — Prostorny 2-sloupec, serif "Place order"

```jsx
// Checkout specifikace:
// - 2 sloupce: formular (60%) + summary sticky (40%)
// - Formular: velke inputy 48px, prostorny padding, serif section headers
// - Summary: premium card, sticky top 80px (pod headerem 64px + 16px gap)
// - Submit: full-width amber, 52px (lg), serif text "Place order"
// - Mobile: summary nad formularem (ne sticky)

const premiumCheckoutSubmitStyle = {
  width: '100%',
  height: 'var(--button-height-lg)', /* 52px */
  backgroundColor: 'var(--color-amber)',
  color: 'var(--color-base)', /* TMAVY text */
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '16px',
  borderRadius: 'var(--radius-button)', /* 12px */
  border: 'none',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-glow-amber)',
  marginTop: 'var(--space-7)', /* 32px */
};
```

### R5.5.7 Potvrzeni — Animated checkmark, serif "Thank you!"

```jsx
// Potvrzeni specifikace:
// - Centrovana karta, max-width 480px
// - Zelena fajfka: animated SVG draw-in (stroke-dashoffset), 64px
// - Nadpis: Instrument Serif 400, 28px, "Thank you!"
// - Cislo objednavky: Geist Mono, amber #F59E0B
// - Shrnuti: mensi card uvnitr
// - CTA: 2 buttony (primary "View order" + ghost "Continue shopping")

function PremiumOrderConfirmation({ orderNumber }) {
  return (
    <div className="premium-animate-page-enter" style={{
      maxWidth: '480px',
      margin: '0 auto',
      textAlign: 'center',
      padding: 'var(--space-11) var(--space-6)',
    }}>
      {/* Animated checkmark */}
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ margin: '0 auto' }}>
        <circle cx="32" cy="32" r="30" fill="none" stroke="var(--color-success)" strokeWidth="2" />
        <path
          d="M20 32L28 40L44 24"
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 40,
            strokeDashoffset: 0,
            animation: 'premium-check-draw 600ms var(--ease-spring) both',
          }}
        />
      </svg>

      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '28px',
        fontWeight: 400,
        color: 'var(--color-text-primary)',
        marginTop: 'var(--space-6)',
      }}>
        Thank you!
      </h1>

      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '16px',
        color: 'var(--color-amber)',
        marginTop: 'var(--space-3)',
      }}>
        #{orderNumber}
      </p>
    </div>
  );
}
```

## R5.6 Code Examples

Viz ukoly R5.5.1 az R5.5.7 — kazdy obsahuje detailni code example.

## R5.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `src/pages/test-kalkulacka/index.jsx` | EDIT — premium wrapper, stepper, flow | `mp-mid-frontend-public` |
| `src/pages/test-kalkulacka/components/FileUploadZone.jsx` | EDIT — premium upload zona | `mp-spec-fe-upload` |
| `src/pages/test-kalkulacka/components/ModelViewer.jsx` | EDIT — floating pill controls | `mp-spec-fe-3d-viewer` |
| `src/pages/test-kalkulacka/components/GenerateButton.jsx` | EDIT — amber, premium | `mp-mid-frontend-public` |
| `src/pages/test-kalkulacka/components/GenerateButton.module.css` | EDIT — premium styly | `mp-mid-frontend-public` |
| `src/pages/test-kalkulacka/components/ErrorBoundary.jsx` | EDIT — premium error stav | `mp-mid-frontend-public` |
| `src/pages/model-upload/components/FileUploadZone.jsx` | EDIT — premium upload | `mp-spec-fe-upload` |
| `src/pages/model-upload/components/ModelViewer.jsx` | EDIT — premium viewer | `mp-spec-fe-3d-viewer` |
| `src/pages/model-upload/components/PrintConfiguration.jsx` | EDIT — premium config | `mp-spec-fe-forms` |
| `src/pages/model-upload/components/PricingCalculator.jsx` | EDIT — premium cenovy prehled | `mp-mid-pricing-engine` |

## R5.8 Acceptance Criteria

- [ ] Stepper: serif cisla (32px kruhy), amber active, green complete
- [ ] Upload zona: serif italic text, 20px radius, amber drag-over
- [ ] 3D Viewer: floating pill control bar s blur, 999px radius
- [ ] Config: 48px selecty, amber slider, amber preset selection
- [ ] Cenovy prehled: serif cena 36px v amber, Geist Mono castky
- [ ] Checkout: 2-sloupec, sticky summary, 52px amber submit
- [ ] Potvrzeni: animated SVG checkmark, serif "Thank you!", mono order number v amber
- [ ] Vsechny prechody mezi kroky maji spring animaci
- [ ] Formular validace funguje s premium error stavy
- [ ] Mobile: single column, summary pred formularem
- [ ] A11y: form labels, error announcements, focus management
- [ ] `npm run build` prochazi bez chyb

## R5.9 Eskalacni cesta

1. test-kalkulacka/index.jsx (800+ radku) je prilis velka pro jednu editaci → rozdelit na mensi casti
2. 3D viewer pill bar koliduje s existujicim control panelem → `mp-spec-fe-3d-viewer` sjednocuje
3. Cenovy prehled neodpovida pricingEngineV3 vystupu → `mp-mid-pricing-engine` upravi mapping
4. Checkout formular nevaliduje → `mp-spec-fe-checkout` implementuje react-hook-form + zod

## R5.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0 + R1 + R2 | Blocking | Tokeny, utility, komponenty |
| R3 (Header) | Blocking | Header nad kalkulackou |
| pricingEngineV3.js | Data | Cenovy prehled cte z pricing engine |
| Three.js | External | 3D viewer (existujici) |
| react-hook-form + zod | External | Checkout formulare (Phase 1 S02) |

---

# R6: Admin Pages

## R6.1 Prehled

Faze R6 aplikuje premium design na vsechny admin stranky: Dashboard, Pricing,
Fees, Parameters, Presets, Orders, Analytics, Team Access, Branding a Widget.
Admin stranky musi byt vizualne konzistentni se sidebar z R3 — serif italic
skupinove labely v amber, shadow-only karty, velke radky v tabulkach (56px),
bez zebra stripes (jen bottom border), a velkorysejsi spacing.

Klicove premium admin prvky:
- Stat karty: serif cisla (Instrument Serif 400, 36px), sparkline v pozadi
- Tabulky: velke radky 56px, bez zebra stripes, jen bottom border #27272A
- Tab navigace: underline styl, amber aktivni, Satoshi 500
- Modaly: 20px radius, serif nadpisy, spring animace
- Section headings: serif italic labely v amber (konzistentni se sidebar)

## R6.2 Vedouci agent

`mp-mid-frontend-admin` — vlastni vsechny admin stranky.

## R6.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Review admin architektury |
| `mp-spec-fe-tables` | Premium tabulky (velke radky, status pills) |
| `mp-spec-fe-charts` | Premium grafy (amber cara, gradient fill) |
| `mp-spec-fe-forms` | Admin formulare (material editor, fee editor) |
| `mp-spec-fe-kanban` | Kanban board (budouci, R8) |
| `mp-mid-pricing-engine` | Pricing data integrace |
| `mp-mid-pricing-discounts` | Volume discounts UI |
| `mp-spec-design-a11y` | Admin a11y (tabulky, formulare) |

## R6.4 Skills

| Skill | Pouziti |
|-------|---------|
| `review-pr` | Review kazde admin stranky |
| `lint-fix` | Auto-fix |
| `vitest` | Unit testy pro admin logiku |

## R6.5 Ukoly

### R6.5.1 Admin Dashboard — Premium varianta

**Stat karty:**
- bg `#18181B`, radius 16px, padding 24px, NO border, shadow level 1
- Cislo: Instrument Serif 400, 36px, `#FAFAFA`
- Trend: Satoshi 400, 13px, `#22C55E` (pozitivni) / `#EF4444` (negativni)
- Label: Satoshi 400, 13px, `#71717A`
- Sparkline: mini gradient chart v pozadi karty (amber subtle)
- Hover: translateY(-2px), shadow level 2, 300ms spring

```jsx
function PremiumStatCard({ label, value, trend, trendDirection, sparklineData }) {
  return (
    <div className="premium-card premium-card-interactive" style={{
      padding: 'var(--card-padding)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Sparkline v pozadi */}
      {sparklineData && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          opacity: 0.15,
          /* SVG sparkline s amber gradientem */
        }} />
      )}

      {/* Label */}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--color-text-muted)', /* #71717A */
        /* Normal case — NE uppercase */
      }}>
        {label}
      </span>

      {/* Velke cislo — SERIF */}
      <div style={{
        fontFamily: 'var(--font-heading)', /* Instrument Serif */
        fontSize: '36px',
        fontWeight: 400,
        color: 'var(--color-text-primary)',
        lineHeight: 1.1,
        marginTop: '8px',
      }}>
        {value}
      </div>

      {/* Trend */}
      {trend && (
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: trendDirection === 'up' ? 'var(--color-success)' : 'var(--color-error)',
          marginTop: '8px',
          display: 'inline-block',
        }}>
          {trendDirection === 'up' ? '+' : ''}{trend}
        </span>
      )}
    </div>
  );
}
```

**Graf:**
- bg `#18181B`, radius 16px, NO border
- Cara: amber `#F59E0B`, jemny gradient fill pod carou
- Grid: `#27272A`, jemne
- Osy: Geist Mono 11px, `#52525B`
- Tooltip: bg `#27272A`, radius 12px, shadow level 2

**Tabulka posledni objednavky:**
- Velke radky: 56px vyska (z ~44px), padding 16px 20px
- Bez zebra stripes — jen bottom border `#27272A`
- Hover: bg `#27272A`
- Header: Satoshi 500, 12px, `#52525B` (normal case, NE uppercase)
- Status pills: rounded 999px, padding 4px 12px, Satoshi 500 12px

```jsx
// Premium tabulka specifikace
const premiumTableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text-disabled)', /* #52525B */
    textAlign: 'left',
    padding: '12px 20px',
    borderBottom: '1px solid var(--color-divider)',
    /* Normal case — NE text-transform: uppercase */
  },
  td: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--color-text-primary)',
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-divider)',
    height: '56px',
    verticalAlign: 'middle',
  },
  rowHover: {
    backgroundColor: 'var(--color-elevated)', /* #27272A */
    transition: 'background-color 150ms ease',
  },
  /* Zadne zebra stripes — cistsi premium look */
};
```

### R6.5.2 Admin Pricing — Premium varianta

**Tab navigace:**
- Underline styl (ne background)
- Satoshi 500, 15px, `#71717A` (inactive)
- Active: `#FAFAFA`, amber underline 2px
- Gap: 32px mezi taby

```jsx
function PremiumTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: '32px',
      borderBottom: '1px solid var(--color-divider)',
      marginBottom: 'var(--space-7)', /* 32px */
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            fontWeight: 500,
            color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === tab.id
              ? '2px solid var(--color-amber)'
              : '2px solid transparent',
            padding: '12px 0',
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

**Material tabulka:**
- Velke radky s barevnym dot indicatorem (14px kruh)
- Nazev: Satoshi 500 15px
- Cena: Geist Mono 400 15px
- Edit/Delete: ghost ikony, hover amber/red

**Editor modal:**
- Radius 20px, bg `#27272A`, shadow level 3
- Overlay: rgba(0,0,0,0.6), backdrop-blur 8px
- Inputy: 48px vyska
- Header: Instrument Serif 400, 24px
- Save: amber primary, Cancel: ghost

**Volume discounts:**
- Toggle: 48x24px, amber on, spring animace
- Tier tabulka: editable inputy v radcich, 48px vyska
- Add tier: ghost button s + ikonou
- Preview: bg `#09090B`, mono ceny v amber

### R6.5.3 Admin Fees — Premium varianta

- Stejna tabulka struktura jako Pricing
- Fee radky s typovym badge (percentage/fixed) v pill stylu
- Edit modal s premium inputy

### R6.5.4 Admin Orders — Premium varianta

- Filtry: pill buttony, aktivni = amber bg
- Tabulka: 56px radky, status pills per stav
- Detail modal: serif nadpis, timeline na leve strane

### R6.5.5 Admin Analytics — Premium varianta

- Grafy: amber hlavni cara, violet sekundarni
- Period selector: pill prepinac (7d / 30d / 90d / 1y)
- Stat karty: serif cisla, trend badges

### R6.5.6 Admin Branding — Premium varianta

- Color picker: s amber focus ring
- Preview: live nahled loga/barev
- Upload logo zona: premium styl (20px radius, dashed border)

### R6.5.7 Admin Team Access — Premium varianta

- User karty: avatar + jmeno + role badge (pill)
- Invite formular: premium inputy, amber CTA
- Role selector: custom radio karty

### R6.5.8 Admin Presets — Premium varianta

- Preset karty: shadow-only, 16px radius
- Selected: amber ring
- Edit inline nebo modal

### R6.5.9 Admin Parameters — Premium varianta

- Key-value editor: 2-column layout
- Input groups s premium labels (normal case)

### R6.5.10 Admin Widget — Premium varianta

- Widget konfigurace: premium inputy/selecty
- Live preview iframe
- Embed code: Geist Mono, bg `#09090B`, radius 12px

## R6.6 Code Examples

### Priklad: Premium Admin Page wrapper

```jsx
function PremiumAdminPage({ title, subtitle, children, actions }) {
  return (
    <div className="premium-animate-page-enter" style={{
      padding: 'var(--space-8) 0', /* 40px vertical */
    }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 'var(--space-8)',
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', /* Instrument Serif */
            fontSize: 'var(--text-h2)', /* 36px */
            fontWeight: 400,
            color: 'var(--color-text-primary)',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              marginTop: '6px',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>}
      </div>

      {children}
    </div>
  );
}
```

### Priklad: Premium Section s serif italic labelem

```jsx
// Konzistentni se sidebar skupinovymi labely
function PremiumSection({ label, children }) {
  return (
    <section style={{ marginBottom: 'var(--space-9)' }}>
      <span style={{
        fontFamily: 'var(--font-heading)', /* Instrument Serif */
        fontStyle: 'italic',
        fontSize: '14px',
        color: 'var(--color-amber)', /* #F59E0B — amber premium */
        display: 'block',
        marginBottom: 'var(--space-5)', /* 20px */
      }}>
        {label}
      </span>
      {children}
    </section>
  );
}
```

## R6.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `src/pages/admin/AdminDashboard.jsx` | EDIT — premium stat karty, tabulka, graf | `mp-mid-frontend-admin` |
| `src/pages/admin/AdminPricing.jsx` | EDIT — premium taby, tabulky, modaly | `mp-mid-frontend-admin` |
| `src/pages/admin/AdminFees.jsx` | EDIT — premium fee tabulka | `mp-mid-frontend-admin` |
| `src/pages/admin/AdminOrders.jsx` | EDIT — premium order tabulka, filtry | `mp-mid-frontend-admin` |
| `src/pages/admin/AdminAnalytics.jsx` | EDIT — premium grafy, stat karty | `mp-spec-fe-charts` |
| `src/pages/admin/AdminBranding.jsx` | EDIT — premium branding editor | `mp-mid-frontend-admin` |
| `src/pages/admin/AdminTeamAccess.jsx` | EDIT — premium team karty | `mp-mid-frontend-admin` |
| `src/pages/admin/AdminPresets.jsx` | EDIT — premium preset karty | `mp-mid-frontend-admin` |
| `src/pages/admin/AdminParameters.jsx` | EDIT — premium parameter editor | `mp-mid-frontend-admin` |
| `src/pages/admin/AdminLayout.jsx` | JIZ UPRAVENO v R3 | — |

## R6.8 Acceptance Criteria

- [ ] Dashboard stat karty: serif cisla 36px, sparkline v pozadi, spring hover
- [ ] Dashboard tabulka: 56px radky, zadne zebra stripes, bottom border only
- [ ] Pricing taby: underline styl, amber aktivni, 32px gap
- [ ] Pricing tabulka: 14px material dot, Geist Mono ceny
- [ ] Pricing modal: 20px radius, serif nadpis, 48px inputy, spring animace
- [ ] Volume discounts: amber toggle, editable tier radky
- [ ] Orders: status pills (amber/blue/green/gray), 56px radky
- [ ] Analytics: amber hlavni graf, violet sekundarni
- [ ] Vsechny admin stranky maji page-enter animaci
- [ ] Section labely: serif italic v amber (konzistentni se sidebar)
- [ ] Tab headers: normal case (ne UPPERCASE), Satoshi 500
- [ ] `npm run build` prochazi bez chyb

## R6.9 Eskalacni cesta

1. AdminPricing.jsx (2500+ radku) je prilis velka → rozdelit na sub-komponenty
2. Tabulky nereaguji dobre na mobile → `mp-spec-design-responsive` pridej horizontal scroll
3. Graf library neodpovida premium barvam → `mp-spec-fe-charts` customizuje theme
4. Volume discount UI nesedi s pricing engine → `mp-mid-pricing-engine` upravi API

## R6.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0 + R1 + R2 + R3 | Blocking | Tokeny, komponenty, sidebar |
| R4 je nezavisla | Parallel | Jine stranky |
| pricingEngineV3.js | Data | Pricing data |
| adminPricingStorage.js | Data | Persistovana data |
| adminFeesStorage.js | Data | Fees data |

---

# R7: Widget System

## R7.1 Prehled

Faze R7 aplikuje premium design na widget system: Widget Kalkulacka (verejne embedovana),
Widget Builder (admin nastroj) a Widget Embed/Preview stranky. Widget musi byt
vizualne konzistentni s premium designem ale zaroven lehci a kompaktnejsi protoze
bezi v iframe na cizich webech.

Klicove premium widget elementy:
- Mekci estetika — vetsi radii, jemnejsi stiny
- Amber akcenty misto puvodnich modrych (#3B82F6 → #F59E0B)
- Satoshi body font, Geist Mono pro ceny
- Vetsi inputy (48px) ale kompaktnejsi spacing (widget ma omezeny prostor)
- Builder: amber accenty, serif italic section labely

## R7.2 Vedouci agent

`mp-mid-frontend-widget` — vlastni widget kalkulacku a embed logiku.

## R7.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Widget architektura, iframe security |
| `mp-mid-frontend-admin` | Widget Builder integrace (sdileny hot spot) |
| `mp-spec-fe-upload` | Widget upload zona |
| `mp-spec-fe-3d-viewer` | Widget 3D viewer (lehci verze) |
| `mp-mid-security-app` | iframe postMessage origin validace |
| `mp-spec-design-responsive` | Widget responsive (widget ma fixni sirku) |

## R7.4 Skills

| Skill | Pouziti |
|-------|---------|
| `review-pr` | Review widget zmen |
| `security-testing` | postMessage origin validace |
| `webapp-testing` | Widget embed test |

## R7.5 Ukoly

### R7.5.1 Widget Kalkulacka — Premium varianta

Widget kalkulacka bezi v iframe na cizich webech. Musi pouzivat CSS custom properties
(ne Tailwind!) a byt vizualne konzistentni s premium designem.

**Zmeny oproti soucasnemu stavu:**
- Vsechny #3B82F6 (blue) → #F59E0B (amber)
- Vsechny #10B981 (green) → #22C55E (zachovat ale upresnit)
- Border radius: 6-8px → 12-16px
- Input height: 40px → 48px
- Shadow misto borderu na kartach
- Font: Satoshi body, Geist Mono ceny
- Upload zona: serif italic text, 20px radius
- Cenovy prehled: serif velka cena, amber

```jsx
// Widget premium token overrides
// builder-tokens.css zmeny:
const widgetPremiumTokenOverrides = {
  '--builder-accent-primary': '#F59E0B',     /* amber misto blue */
  '--builder-accent-hover': '#D97706',
  '--builder-accent-success': '#22C55E',
  '--builder-accent-error': '#EF4444',
  '--builder-selection-outline': '#F59E0B',   /* amber selection */
  '--builder-hover-outline': 'rgba(245, 158, 11, 0.5)',
  '--builder-active-overlay': 'rgba(245, 158, 11, 0.12)',
  '--builder-radius-sm': '8px',               /* vetsi */
  '--builder-radius-md': '12px',
  '--builder-radius-lg': '16px',
  '--builder-font-heading': "'Instrument Serif', Georgia, serif",
  '--builder-font-body': "'Satoshi', sans-serif",
  '--builder-font-code': "'Geist Mono', monospace",
};
```

### R7.5.2 Widget Builder — Premium varianta

Widget Builder je admin nastroj pro vizualni konfiguraci widgetu. Pouziva vlastni
dark theme tokeny (builder-tokens.css).

**Zmeny:**
- Accenty: #3B82F6 → #F59E0B (amber)
- Success: #10B981 → #22C55E
- Selection outline: blue → amber
- Font heading: DM Sans → Instrument Serif (pro section labely)
- Border radius: vetsi (sm=8px, md=12px, lg=16px)
- Section labely v levem panelu: serif italic, amber (konzistentni se sidebar)

### R7.5.3 Widget Preview/Embed — Premium varianta

- Preview iframe: radius 16px, shadow level 2
- Embed code box: Geist Mono, bg `#09090B`, radius 12px, amber copy button
- Device preview frame: premium stiny, vetsi radius

### R7.5.4 Builder Token CSS aktualizace

**Soubor:** `src/pages/admin/builder/styles/builder-tokens.css`

```css
/* Zmeny v builder-tokens.css pro Premium variantu: */
:root {
  /* Accent colors: blue → amber */
  --builder-accent-primary: #F59E0B;
  --builder-accent-hover: #D97706;

  /* Selection: blue → amber */
  --builder-selection-outline: #F59E0B;
  --builder-hover-outline: rgba(245, 158, 11, 0.5);
  --builder-active-overlay: rgba(245, 158, 11, 0.12);

  /* Typography: pridat serif heading */
  --builder-font-heading: 'Instrument Serif', Georgia, serif;
  --builder-font-body: 'Satoshi', system-ui, sans-serif;
  --builder-font-code: 'Geist Mono', monospace;

  /* Border radius: vetsi */
  --builder-radius-sm: 8px;
  --builder-radius-md: 12px;
  --builder-radius-lg: 16px;
}

/* Onboarding pulse: blue → amber */
@keyframes onboardingPulse {
  0%, 100% {
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(245, 158, 11, 0.02);
  }
  50% {
    border-color: rgba(245, 158, 11, 0.6);
    background: rgba(245, 158, 11, 0.06);
  }
}
```

## R7.6 Code Examples

### Priklad: Widget upload zona (kompaktnejsi premium)

```jsx
function WidgetPremiumUpload({ onFileDrop }) {
  return (
    <div style={{
      border: '2px dashed var(--color-overlay)',
      borderRadius: '16px', /* mensi nez plna kalkulacka ale stale rounded */
      backgroundColor: 'var(--color-base)',
      padding: '40px 24px', /* kompaktnejsi nez 120px */
      textAlign: 'center',
      cursor: 'pointer',
    }}>
      <div style={{ color: 'var(--color-amber)', fontSize: '32px', marginBottom: '12px' }}>
        {/* Upload icon */}
      </div>
      <p style={{
        fontFamily: 'var(--font-heading)',
        fontStyle: 'italic',
        fontSize: '16px',
        color: 'var(--color-text-muted)',
      }}>
        Drop your model
      </p>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '12px',
        color: 'var(--color-text-disabled)',
        marginTop: '4px',
      }}>
        STL, 3MF, OBJ
      </p>
    </div>
  );
}
```

## R7.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `src/pages/widget-kalkulacka/components/FileUploadZone.jsx` | EDIT — premium upload | `mp-mid-frontend-widget` |
| `src/pages/widget-kalkulacka/components/ModelViewer.jsx` | EDIT — premium viewer | `mp-mid-frontend-widget` |
| `src/pages/widget-kalkulacka/components/GenerateButton.jsx` | EDIT — amber button | `mp-mid-frontend-widget` |
| `src/pages/widget-kalkulacka/components/GenerateButton.module.css` | EDIT — amber styly | `mp-mid-frontend-widget` |
| `src/pages/widget-kalkulacka/components/ErrorBoundary.jsx` | EDIT — premium error | `mp-mid-frontend-widget` |
| `src/pages/widget/WidgetEmbed.jsx` | EDIT — premium embed | `mp-mid-frontend-widget` |
| `src/pages/widget/WidgetPreview.jsx` | EDIT — premium preview | `mp-mid-frontend-widget` |
| `src/pages/admin/AdminWidgetBuilder.jsx` | EDIT — amber akcenty | HOT SPOT (admin+widget) |
| `src/pages/admin/builder/styles/builder-tokens.css` | EDIT — premium tokeny | `mp-mid-frontend-widget` |
| `src/pages/admin/builder/components/BuilderLeftPanel.jsx` | EDIT — serif section labely | `mp-mid-frontend-widget` |
| `src/pages/admin/builder/components/BuilderRightPanel.jsx` | EDIT — premium preview | `mp-mid-frontend-widget` |
| `src/pages/admin/builder/components/DevicePreviewFrame.jsx` | EDIT — premium stiny | `mp-mid-frontend-widget` |
| `src/pages/admin/builder/components/tabs/StyleTab.jsx` | EDIT — amber inputs | `mp-mid-frontend-widget` |
| `src/pages/admin/builder/components/tabs/ElementsTab.jsx` | EDIT — premium list | `mp-mid-frontend-widget` |

## R7.8 Acceptance Criteria

- [ ] Widget: vsechny blue (#3B82F6) nahrazeny amber (#F59E0B)
- [ ] Widget: border radius zvetseny na 12-16px
- [ ] Widget: input height 48px
- [ ] Widget: shadow misto borderu na kartach
- [ ] Widget: serif italic upload text
- [ ] Builder: amber akcenty, serif italic section labely
- [ ] Builder: onboarding pulse v amber (ne blue)
- [ ] Builder: builder-tokens.css aktualizovany
- [ ] Embed code: Geist Mono, amber copy button
- [ ] Widget white screen bug neregresoval (useMemo/useRef pattern)
- [ ] postMessage origin validace stale funguje
- [ ] `npm run build` prochazi bez chyb

## R7.9 Eskalacni cesta

1. AdminWidgetBuilder.jsx je HOT SPOT (sdileny admin+widget) → `mp-sr-orchestrator` rozhodne
2. Widget CSS konfliktuji s hostitelskym webem → `mp-mid-security-app` overuje izolaci
3. Builder white screen regrese → `mp-mid-frontend-widget` opravy (useRef pattern z MEMORY.md)
4. Font loading v iframe → widget musi mit vlastni font import (ne dedeni z parent)

## R7.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0 + R1 + R2 | Blocking | Tokeny, utility, komponenty |
| R3 (sidebar) | Soft | Builder pouziva admin layout |
| R6 (admin) | Soft | Builder je admin stranka |
| Widget iframe izolace | Architecture | CSS custom properties musi byt v iframe scope |

---

# R8: Budouci Stranky (12 planovanych)

## R8.1 Prehled

Faze R8 pripravi premium designove specifikace pro 12 budoucich stranek ktere
budou implementovany v dalsich fazich projektu. Kazda stranka dostane detailni
vizualni specifikaci v premium stylu aby byla konzistentni s existujicimi
strankami. R8 NEimplementuje tyto stranky — pouze definuje jejich design.

12 budoucich stranek:
1. **Kanban Board** — order management s drag-and-drop
2. **Customer Portal** — zakaznicky ucet, historie objednavek
3. **API Documentation** — interaktivni API docs
4. **Onboarding Wizard** — prvni nastaveni uctu
5. **Notifications Center** — centrum notifikaci
6. **Invoice Generator** — PDF fakturni system
7. **Material Library** — katalog materialu s 3D previews
8. **Comparison Page** — porovnani cenovych planu
9. **Blog/Knowledge Base** — clanky a navody
10. **Integrations Page** — Shopify, WooCommerce, API
11. **Account Settings** — uzivatelske nastaveni
12. **Admin Reports** — exportovatelne reporty

## R8.2 Vedouci agent

`mp-sr-design` — vlastni designove specifikace vsech budoucich stranek.

## R8.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Review architekturalni proveditelnosti |
| `mp-mid-design-ux` | UX flow pro kazdy screen |
| `mp-spec-plan-ux` | Planovani UX patternu |
| `mp-spec-plan-frontend` | Technicka proveditelnost |
| `mp-spec-design-user-friendly` | Uzivatelska pristupnost navrhu |
| `mp-spec-plan-product` | Produktova prioritizace |

## R8.4 Skills

| Skill | Pouziti |
|-------|---------|
| `brainstorming` | Generovani navrhu pro kazdu stranku |
| `writing-plans` | Strukturovane specifikace |
| `review-pr` | Review specifikaci |

## R8.5 Ukoly

### R8.5.1 Kanban Board — Premium specifikace

- Sloupce: radius 16px header, bg `#18181B`, NO border
- Karty: radius 12px, bg `#27272A`, shadow level 1, padding 16px
- Drag: rotace 2deg pri presunu (spring efekt), shadow grow
- Status barvy v header:
  - Nova: amber `#F59E0B`
  - V procesu: link blue `#60A5FA`
  - Hotovo: success `#22C55E`
  - Odeslano: secondary `#A1A1AA`
- Hover karta: translateY(-1px), shadow level 2, 300ms spring
- Karta obsah:
  - Cislo: Geist Mono 12px, `#FAFAFA`
  - Zakaznik: Satoshi 400, 13px, `#A1A1AA`
  - Castka: Geist Mono 14px, `#FAFAFA`
  - Cas: Satoshi 400, 11px, `#52525B`
- Drop zone highlight: `rgba(245, 158, 11, 0.08)` border amber

### R8.5.2 Customer Portal — Premium specifikace

- Hero: serif italic "Your orders" 36px
- Order karty: shadow-only, radius 16px, timeline na leve strane
- Status: amber/green/blue pill badges
- Ceny: Geist Mono, amber total
- Re-order button: amber primary

### R8.5.3 API Documentation — Premium specifikace

- Split layout: navigace vlevo (220px), obsah vpravo
- Navigace: Satoshi 500, serif italic skupinove labely v amber
- Code bloky: Geist Mono, bg `#09090B`, radius 12px
- Endpoint badges: GET=green pill, POST=amber pill, DELETE=red pill
- Try-it panel: bg `#18181B`, radius 16px, premium inputy

### R8.5.4 Onboarding Wizard — Premium specifikace

- 4-krokovy flow: Welcome → Business Info → First Material → First Widget
- Centrovany layout (jako login)
- Serif italic nadpisy pro kazdy krok
- Progress: thin horizontal bar, amber filled
- Ilustrace: jemne, minimalisticke (ne stock)

### R8.5.5 Notifications Center — Premium specifikace

- Dropdown z headeru: bg `#27272A`, radius 16px, shadow level 3
- Notifikace: padding 16px, bottom border `#3F3F46`
- Unread: jemny amber dot (6px) vlevo
- Typy: ikona v kruhu per typ (order=amber, system=violet, alert=red)
- Casovy udaj: Geist Mono 11px, `#52525B`

### R8.5.6 Invoice Generator — Premium specifikace

- Preview: A4 pomer, bile pozadi s premium typografii
- Logo: tenant branding
- Tabulka polozek: serif column headings, mono ceny
- Total: velky, serif, amber
- Download button: amber primary, PDF ikona

### R8.5.7 Material Library — Premium specifikace

- Grid karet: 3 sloupce, radius 16px, shadow-only
- Kazda karta: barevny swatch (kruh 48px), nazev (Satoshi 500), cena (mono)
- Filter: pill buttony per kategorie (PLA, PETG, ASA, ...)
- Detail modal: 3D material preview, technicke specifikace v mono

### R8.5.8 Comparison Page — Premium specifikace

- 3 sloupce tabulka, featured sloupec = amber horni border
- Row labels: Satoshi 500, 14px
- Hodnoty: checkmarky `#22C55E`, krizky `#EF4444`
- Ceny: serif, velke (36px), amber na featured

### R8.5.9 Blog/Knowledge Base — Premium specifikace

- Article list: velke karty s nahledy, serif nadpisy
- Article detail: centrovany text (max-width 680px), serif h1/h2
- Code snippety: Geist Mono, bg `#09090B`, radius 12px
- Table of contents: sticky sidebar, amber active

### R8.5.10 Integrations Page — Premium specifikace

- Integration karty: logo + nazev + popis
- Status: "Connected" green pill, "Available" default pill
- Setup modal: step-by-step s premium stepper
- API key display: Geist Mono, masked, copy button amber

### R8.5.11 Account Settings — Premium specifikace

- Tab navigace (underline styl, amber active)
- Profile: avatar upload (kruh 96px), premium inputy
- Security: password change, 2FA toggle (amber)
- Billing: invoice historia, plan display
- Danger zone: red border section, destructive buttony

### R8.5.12 Admin Reports — Premium specifikace

- Date range picker: premium, amber selected range
- Export buttony: CSV, PDF, Excel — ghost style
- Tabulka: velke radky, mono cisla, sortable columns
- Grafy: amber/violet, gradient fill

## R8.6 Code Examples

### Priklad: Kanban karta (budouci implementace)

```jsx
function PremiumKanbanCard({ order }) {
  return (
    <div style={{
      backgroundColor: 'var(--color-elevated)', /* #27272A */
      borderRadius: 'var(--radius-input)', /* 12px */
      padding: 'var(--space-4)', /* 16px */
      boxShadow: 'var(--shadow-level-1)',
      border: 'none',
      cursor: 'grab',
      transition: 'all var(--duration-spring) var(--ease-spring)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--color-text-primary)',
      }}>
        #{order.number}
      </div>
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: '13px',
        color: 'var(--color-text-secondary)',
        marginTop: '4px',
      }}>
        {order.customer}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          color: 'var(--color-text-primary)',
        }}>
          {order.amount}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          color: 'var(--color-text-disabled)',
        }}>
          {order.timeAgo}
        </span>
      </div>
    </div>
  );
}
```

### Priklad: API Docs endpoint badge

```jsx
function EndpointBadge({ method }) {
  const colors = {
    GET: { bg: 'rgba(34, 197, 94, 0.10)', color: '#22C55E' },
    POST: { bg: 'rgba(245, 158, 11, 0.10)', color: '#F59E0B' },
    PUT: { bg: 'rgba(96, 165, 250, 0.10)', color: '#60A5FA' },
    DELETE: { bg: 'rgba(239, 68, 68, 0.10)', color: '#EF4444' },
  };
  const c = colors[method] || colors.GET;

  return (
    <span style={{
      backgroundColor: c.bg,
      color: c.color,
      borderRadius: 'var(--radius-badge)',
      padding: '2px 8px',
      fontFamily: 'var(--font-mono)',
      fontSize: '11px',
      fontWeight: 500,
    }}>
      {method}
    </span>
  );
}
```

## R8.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| `docs/claude/Planovane_Implementace/Redesign/FUTURE_PAGES_B_Premium.md` | NOVY — specifikace | `mp-sr-design` |
| Zadne zdrojove soubory | — | R8 je jen specifikace, ne implementace |

## R8.8 Acceptance Criteria

- [ ] Vsech 12 stranek ma detailni vizualni specifikaci
- [ ] Kazda specifikace obsahuje: layout, barvy, typografii, spacing, animace
- [ ] Specifikace jsou konzistentni s premium design systemem (R0-R2)
- [ ] Specifikace pouzivaji spravne design tokeny (var(--nazev))
- [ ] Kazda stranka ma mobilni layout variantu
- [ ] Specifikace reviewed by `mp-sr-design` a `mp-sr-frontend`

## R8.9 Eskalacni cesta

1. Produktova prioritizace 12 stranek → `mp-spec-plan-product` urcuje poradi
2. Technicka neproveditelnost navrhu → `mp-sr-frontend` navrhne alternativu
3. UX flow nesedi s existujicimi patterns → `mp-mid-design-ux` upravi

## R8.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0-R7 | Reference | Specifikace referencuji existujici design system |
| Budouci implementace | Output | R8 specifikace jsou vstupem pro budouci faze |
| Zadna blocking zavislost | — | R8 muze jit paralelne s R6/R7 |

---

# R9: Polish & Testing

## R9.1 Prehled

Finalni faze R9 zajistuje kvalitu a konzistenci celeho premium redesignu.
Zahrnuje anti-AI design audit, spring animace review, pristupnost (a11y),
performance audit, cross-browser testovani, a finalni vizualni kontrolu.

Klicove oblasti:
- **Anti-AI Audit:** Overeni ze design nesplnuje zadny z 25 "AI design" patternu
- **Spring Animation Review:** Overeni ze vsechny animace pouzivaji spring easing
- **Accessibility (a11y):** WCAG AA kontrast, keyboard navigace, ARIA, focus management
- **Performance:** Bundle size < 200kB gzip main chunk, LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Cross-browser:** Chrome, Firefox, Safari, Edge + iOS Safari, Chrome Android
- **Visual Consistency:** Overeni ze vsechny stranky pouzivaji stejna tokeny

## R9.2 Vedouci agent

`mp-sr-quality` — vlastni finalni kvalitni review.

## R9.3 Spolupracujici agenti

| Agent | Role |
|-------|------|
| `mp-sr-frontend` | Finalni architekturalni review |
| `mp-sr-design` | Vizualni konzistence audit |
| `mp-mid-quality-code` | Code quality review |
| `mp-mid-quality-test` | Test coverage review |
| `mp-spec-test-visual` | Visual regression testy |
| `mp-spec-test-e2e` | End-to-end testy |
| `mp-spec-test-build` | Build verification |
| `mp-spec-test-browser` | Cross-browser testy |
| `mp-spec-design-a11y` | Accessibility audit |
| `mp-spec-fe-animations` | Animace review |
| `mp-mid-infra-build` | Performance audit, bundle analysis |

## R9.4 Skills

| Skill | Pouziti |
|-------|---------|
| `review-pr` | Finalni review |
| `lint-fix` | Posledni lint fixes |
| `vitest` | Unit testy pro komponenty |
| `webapp-testing` | E2E testy |
| `security-testing` | Security review |
| `verification-before-completion` | Finalni overeni |

## R9.5 Ukoly

### R9.5.1 Anti-AI Design Audit

Projit vsech 25 principu z `ANTI_AI_DESIGN_PRINCIPLES.md` a overit ze
premium design nesplnuje zadny "AI-generovany" pattern.

**Checklist:**
- [ ] Primarni barva NENI genericka modra (#2563EB, #3B82F6) — pouzivame amber #F59E0B
- [ ] Heading font NENI Inter/Poppins — pouzivame Instrument Serif (SERIF!)
- [ ] Labely NEMAJI defaultni uppercase styl — normal case, Satoshi 500
- [ ] Karty NEMAJI genericke bile pozadi — shadow-only na #18181B
- [ ] Gradient NENI blue-purple — pouzivame amber-violet a amber-red
- [ ] Hero layout JE zajimave (centrovany zen, ne generic split)
- [ ] Spacing NENI striktne z 4px gridu — premium pouziva 24px card padding, 96px sections
- [ ] Animace MAJI uceel (spring hover = feedback, breathing CTA = attention)
- [ ] Prazdne stavy MAJI kontext (ne generic "No data found")
- [ ] Dark theme JE zaklad (ne bile pozadi)
- [ ] Monospace POUZITO pro ceny a technicke udaje (Geist Mono)
- [ ] Aspon 1 serif element na kazde strance (heading nebo slogan)
- [ ] Border-radius NENI defaultnich 8px — pouzivame 12-20px
- [ ] Hover efekty JSOU zajimave (spring lift, glow, ne jen opacity)
- [ ] Pozadi MA texturu/gradient (ambient glow, ne sterilni jednobarevne)

### R9.5.2 Spring Animation Audit

Overit ze VSECHNY animace pouzivaji spravny easing a timing.

**Checklist:**
- [ ] Card hover: `cubic-bezier(0.16, 1, 0.3, 1)` 300ms
- [ ] Modal enter: `cubic-bezier(0.16, 1, 0.3, 1)` 400ms
- [ ] Button press: scale(0.97) 200ms → scale(1) 300ms spring
- [ ] Page enter: fade + translateY(12px) 400ms spring
- [ ] Toast enter: translateX(100%→0) 300ms spring
- [ ] Stepper transition: fade + slide 300ms spring
- [ ] Price change: flip animace 300ms spring
- [ ] Sidebar hover: color transition 200ms ease
- [ ] Header scroll: bg transition 300ms ease
- [ ] CTA breathing: 4000ms ease-in-out infinite

### R9.5.3 Accessibility Audit (WCAG AA)

**Kontrast check:**
- [ ] `#FAFAFA` na `#18181B` (Surface) = 15.4:1 — PASS (AA minimum 4.5:1)
- [ ] `#A1A1AA` na `#18181B` = 7.1:1 — PASS
- [ ] `#71717A` na `#18181B` = 4.5:1 — PASS (hrani)
- [ ] `#52525B` na `#18181B` = 3.2:1 — FAIL pro body text, OK pro decorative
- [ ] `#F59E0B` na `#09090B` = 8.4:1 — PASS
- [ ] `#09090B` na `#F59E0B` (button text) = 8.4:1 — PASS

**Keyboard navigace:**
- [ ] Tab order je logicky na vsech strankach
- [ ] Focus ring je viditelny (amber 3px ring)
- [ ] Skip link funguje
- [ ] Modaly zachycuji focus (focus trap)
- [ ] Escape zavre modaly a dropdowny
- [ ] Enter/Space aktivuje buttony a toggley

**ARIA:**
- [ ] Vsechny formulare maji `<label>` propojene s `<input>`
- [ ] Chybove hlasky maji `aria-live="polite"`
- [ ] Modaly maji `role="dialog"`, `aria-modal="true"`
- [ ] Navigace ma `<nav>` element s `aria-label`
- [ ] Tabulky maji `<th>` s `scope`
- [ ] Ikony maji `aria-hidden="true"` nebo `aria-label`

**Screen reader:**
- [ ] Heading hierarchy (h1 → h2 → h3) je logicka
- [ ] Obrazky maji `alt` text
- [ ] Formulare oznamuji chyby

### R9.5.4 Performance Audit

**Bundle size:**
- [ ] Main chunk < 200kB gzipped
- [ ] Font soubory < 150kB celkem
- [ ] CSS soubory < 30kB celkem (premium tokens + animations + utilities + backgrounds)
- [ ] 3D viewer lazy loaded (ne v main bundle)

**Core Web Vitals:**
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] TTFB (Time To First Byte) < 600ms

**Optimalizace:**
- [ ] Fonty maji `font-display: swap`
- [ ] Kriticke CSS je inline (above-the-fold)
- [ ] Obrazky maji lazy loading
- [ ] 3D model ma progressive loading (wireframe → full mesh)
- [ ] CSS custom properties nepusobi layout thrashing

### R9.5.5 Cross-Browser Testovani

**Desktop:**
- [ ] Chrome 120+ — plna funkcionalita
- [ ] Firefox 120+ — plna funkcionalita
- [ ] Safari 17+ — backdrop-filter, font rendering
- [ ] Edge 120+ — plna funkcionalita

**Mobile:**
- [ ] iOS Safari 17+ — blur efekty, font rendering, touch events
- [ ] Chrome Android — plna funkcionalita
- [ ] Samsung Internet — zakladni funkcionalita

**Specificke problemy:**
- [ ] `backdrop-filter: blur()` funguje v Safari (s -webkit- prefixem)
- [ ] CSS custom properties funguji vsude
- [ ] Spring easing `cubic-bezier(0.16, 1, 0.3, 1)` funguje vsude
- [ ] `font-display: swap` funguje vsude
- [ ] IntersectionObserver funguje vsude (s polyfill pro stare prohlizece)

### R9.5.6 Visual Consistency Audit

Projit KAZDOU stranku a overit:
- [ ] Headings pouzivaji Instrument Serif 400 (ne bold, ne sans-serif)
- [ ] Body text pouziva Satoshi 400/500 (ne Inter)
- [ ] Ceny pouzivaji Geist Mono (ne Satoshi)
- [ ] Labely jsou normal case (ne UPPERCASE — to je Var. A)
- [ ] Karty NEMAJI border (jen shadow)
- [ ] Vsechny radii odpovidaji: button=12px, card=16px, modal=20px
- [ ] Vsechny inputy maji 48px vysku (md)
- [ ] Primary button ma TMAVY text na amber pozadi
- [ ] Focus ringy jsou v amber (ne generic blue)
- [ ] Sidebar skupinove labely jsou serif italic amber

### R9.5.7 Finalni cleanup

- [ ] Smazat docasne dev soubory (FontTest.jsx apod.)
- [ ] Odstranit console.log/debugovaci kod
- [ ] Overit ze zadny TODO/FIXME neni bez tracked issue
- [ ] Overit ze vsechny CSS custom properties jsou pouzite (zadne mrtve tokeny)
- [ ] Overit ze package.json nema zbytecne zavislosti

### R9.5.8 Dokumentace

- [ ] Aktualizovat REDESIGN_VARIANTA_B_Premium.md s realnymi hodnotami
- [ ] Vytvorit CHANGELOG pro redesign
- [ ] Aktualizovat MEMORY.md s nauc. patterns z redesignu
- [ ] Zaznamenat hot spots a pasti do MEMORY.md

### R9.5.9 Regression Testing

- [ ] Test kalkulacka: kompletni 5-step flow funguje (upload → config → cena → checkout → potvrzeni)
- [ ] Admin: vsechny stranky se nacitaji bez white screen
- [ ] Widget: embed funguje v iframe na externim webu
- [ ] Builder: konfigurace widgetu funguje bez white screen
- [ ] Login/Register: autentifikace funguje
- [ ] Routing: vsechny routes fungují (vcetne 404)

### R9.5.10 Sign-off

Finalni schvaleni od:
- [ ] `mp-sr-frontend` — technicke schvaleni
- [ ] `mp-sr-design` — vizualni schvaleni
- [ ] `mp-sr-quality` — kvalitni schvaleni
- [ ] `mp-sr-orchestrator` — celkove schvaleni

## R9.6 Code Examples

### Priklad: Axe accessibility audit script

```js
// scripts/a11y-audit.js — spustit po buildu
import { AxeBuilder } from '@axe-core/playwright';

async function runA11yAudit(page, route) {
  await page.goto(route);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  if (results.violations.length > 0) {
    console.error(`A11y violations on ${route}:`, results.violations);
    return false;
  }
  console.log(`${route}: PASS (${results.passes.length} checks)`);
  return true;
}
```

### Priklad: Bundle size check script

```js
// scripts/bundle-check.js
import { statSync } from 'fs';
import { glob } from 'glob';

const MAX_MAIN_CHUNK_GZIP = 200 * 1024; // 200kB

const jsFiles = glob.sync('build/assets/*.js');
const cssFiles = glob.sync('build/assets/*.css');

let totalJS = 0;
let totalCSS = 0;

jsFiles.forEach(f => { totalJS += statSync(f).size; });
cssFiles.forEach(f => { totalCSS += statSync(f).size; });

console.log(`JS total: ${(totalJS / 1024).toFixed(1)}kB`);
console.log(`CSS total: ${(totalCSS / 1024).toFixed(1)}kB`);

// Approximate gzip ratio ~0.3
const estimatedGzip = totalJS * 0.3;
if (estimatedGzip > MAX_MAIN_CHUNK_GZIP) {
  console.error(`Bundle exceeds 200kB gzip limit: ${(estimatedGzip / 1024).toFixed(1)}kB`);
  process.exit(1);
}
```

## R9.7 Soubory k modifikaci

| Soubor | Akce | Vlastnik |
|--------|------|----------|
| Vsechny soubory z R0-R7 | REVIEW | `mp-sr-quality` |
| `docs/claude/Planovane_Implementace/Redesign/REDESIGN_VARIANTA_B_Premium.md` | UPDATE | `mp-sr-docs` |
| `docs/claude/Planovane_Implementace/Redesign/ANTI_AI_DESIGN_PRINCIPLES.md` | REVIEW | `mp-sr-design` |
| `.claude/projects/.../memory/MEMORY.md` | UPDATE — nove patterns | `mp-sr-frontend` |

## R9.8 Acceptance Criteria

- [ ] Anti-AI audit: vsech 15 checklistu splneno
- [ ] Spring animace: vsech 10 animaci pouziva spravny easing
- [ ] A11y: WCAG AA splneno, zadne kriticke Axe violations
- [ ] Performance: main chunk < 200kB gzip, LCP < 2.5s, CLS < 0.1
- [ ] Cross-browser: Chrome, Firefox, Safari, Edge funguji
- [ ] Visual consistency: vsechny stranky pouzivaji stejna tokeny
- [ ] Regrese: zadny white screen, vsechny flow funguji
- [ ] Dokumentace aktualizovana
- [ ] Sign-off od 4 senior agentu
- [ ] `npm run build` prochazi bez chyb a warningss

## R9.9 Eskalacni cesta

1. Kriticka a11y violation → `mp-spec-design-a11y` opravuje, blokuje release
2. Performance budget prekrocen → `mp-mid-infra-build` optimalizuje (code splitting, tree shaking)
3. Cross-browser bug → `mp-spec-test-browser` reportuje, `mp-mid-design-system` fixuje
4. Visual inconsistence → `mp-sr-design` rozhodne, `mp-mid-design-system` opravuje

## R9.10 Zavislosti

| Zavislost | Typ | Smer |
|-----------|-----|------|
| R0-R8 | Blocking | Vse musi byt implementovano pred finalnim testem |
| Axe-core | Dev dependency | A11y audit nastroj |
| Playwright | Dev dependency | Cross-browser testovani |
| Lighthouse | External | Performance audit |

---

# Souhrn a Casova osa

## Faze a odhadovana slozitost

| Faze | Nazev | Slozitost | Odhad (cloveko-hodiny) | Paralelizovatelne s |
|------|-------|-----------|------------------------|---------------------|
| R0 | Priprava & Zavislosti | Nizka | 4-8h | — (startovni bod) |
| R1 | Design System Zaklad | Stredni | 8-16h | — (zavisi na R0) |
| R2 | Zakladni Komponenty | Vysoka | 24-40h | — (zavisi na R1) |
| R3 | Layout Shell | Stredni | 12-20h | — (zavisi na R2) |
| R4 | Public Pages | Vysoka | 24-40h | R6, R7 (paralelne) |
| R5 | Test Kalkulacka | Vysoka | 20-32h | R6, R7 (paralelne) |
| R6 | Admin Pages | Vysoka | 24-40h | R4, R5 (paralelne) |
| R7 | Widget System | Stredni | 16-24h | R4, R5, R6 (paralelne) |
| R8 | Budouci Stranky | Nizka | 8-12h | R4-R7 (paralelne) |
| R9 | Polish & Testing | Vysoka | 16-24h | — (zavisi na vsem) |

**Celkovy odhad: 156-256 cloveko-hodin**

## Kriticka cesta (blocking zavislosti)

```
R0 → R1 → R2 → R3 → R4/R5/R6/R7 (paralelne) → R9
                           ↘
                            R8 (paralelne s R4-R7)
```

## Agent delegace souhrn

| Faze | Vedouci | Klicovi spolupracovnici |
|------|---------|------------------------|
| R0 | `mp-mid-infra-build` | `mp-mid-design-system`, `mp-spec-infra-deps` |
| R1 | `mp-mid-design-system` | `mp-spec-fe-animations`, `mp-spec-design-a11y` |
| R2 | `mp-mid-design-system` | `mp-spec-fe-forms`, `mp-spec-fe-animations` |
| R3 | `mp-spec-fe-layout` | `mp-mid-frontend-admin`, `mp-spec-design-responsive` |
| R4 | `mp-mid-frontend-public` | `mp-spec-fe-3d-viewer`, `mp-spec-fe-animations` |
| R5 | `mp-mid-frontend-public` | `mp-spec-fe-forms`, `mp-spec-fe-upload`, `mp-spec-fe-checkout` |
| R6 | `mp-mid-frontend-admin` | `mp-spec-fe-tables`, `mp-spec-fe-charts` |
| R7 | `mp-mid-frontend-widget` | `mp-mid-security-app`, `mp-mid-frontend-admin` |
| R8 | `mp-sr-design` | `mp-mid-design-ux`, `mp-spec-plan-ux` |
| R9 | `mp-sr-quality` | `mp-spec-test-visual`, `mp-spec-test-e2e`, `mp-spec-design-a11y` |

## Hot Spots (konflikty pozor)

| Soubor | Vlastnik | Faze | Koordinace |
|--------|----------|------|------------|
| `src/Routes.jsx` | `mp-spec-fe-routing` | R3 | Informovat pri zmene layoutu |
| `src/pages/admin/AdminWidgetBuilder.jsx` | `mp-mid-frontend-admin` + `mp-mid-frontend-widget` | R7 | Orchestrator rozhoduje |
| `src/pages/admin/AdminLayout.jsx` | `mp-mid-frontend-admin` | R3, R6 | Sidebar zmeny v R3, obsah v R6 |
| `src/styles/index.css` | `mp-mid-design-system` | R0, R1 | Vsechny importy pres design system |
| `src/pages/test-kalkulacka/index.jsx` | `mp-mid-frontend-public` | R5 | 800+ radku, rozdelit editace |
| `src/pages/admin/AdminPricing.jsx` | `mp-mid-frontend-admin` | R6 | 2500+ radku, rozdelit editace |

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Font loading CLS | Stredni | Stredni | font-display: swap, preload |
| Bundle size narust | Stredni | Vysoky | Tree shaking, lazy loading, font subsetting |
| Tailwind konflikty s CSS properties | Nizka | Vysoky | Prefix `premium-`, CSS specificity management |
| White screen regrese | Nizka | Kriticky | Regression testy po kazde fazi |
| Cross-browser blur efekty | Stredni | Nizky | -webkit- prefix, graceful fallback |
| 3D viewer performance na mobile | Vysoka | Stredni | LOD, lazy load, disable na slabych zarizeni |

---

> **Konec planu. Tento dokument je zdroj pravdy pro redesign Varianty B "Premium / Design Studio".**
> **Pred implementaci kazde faze zkontrolujte aktualni stav predchozich fazi.**
> **Vsechny zmeny MUSI projit quality gates (sekce 18 CLAUDE.md) pred commitem.**
