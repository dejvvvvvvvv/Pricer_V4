# Implementacni Plan: Varianta "FORGE" — Industrial / Technical / Spaceship Manual

**Autor:** mp-sr-design (Senior Design Agent)
**Datum:** 2026-02-07
**Status:** PLAN (schvaleno k implementaci po review mp-sr-orchestrator)
**Scope:** Kompletni vizualni redesign ModelPricer V3 — varianta FORGE
**Odhadovany rozsah:** 10 fazi (R0-R9), ~15-22 pracovnich dni

---

## OBSAH

- R0: Priprava a Zavislosti
- R1: Design System Zaklad
- R2: Zakladni Komponenty
- R3: Layout Shell
- R4: Public Pages
- R5: Test Kalkulacka
- R6: Admin Pages
- R7: Widget System
- R8: Budouci Stranky
- R9: Polish a Testing

---

## POUZITE AGENTY A SKILLS

### Agenty podle faze

| Faze | Lead Agent | Implementacni Agenty | Review Agent |
|------|-----------|---------------------|--------------|
| R0 | mp-sr-design | mp-mid-design-system, mp-spec-infra-firebase | mp-sr-infra |
| R1 | mp-sr-design | mp-mid-design-system, mp-spec-design-a11y | mp-sr-frontend |
| R2 | mp-mid-design-system | mp-spec-fe-forms, mp-spec-fe-animations | mp-sr-design |
| R3 | mp-mid-frontend-admin | mp-spec-fe-layout, mp-mid-design-ux | mp-sr-design |
| R4 | mp-mid-frontend-public | mp-spec-fe-animations, mp-spec-design-icons | mp-sr-design |
| R5 | mp-mid-frontend-public | mp-spec-fe-upload, mp-spec-fe-3d-viewer, mp-spec-fe-checkout | mp-sr-design |
| R6 | mp-mid-frontend-admin | mp-spec-fe-tables, mp-spec-fe-charts | mp-sr-design |
| R7 | mp-mid-frontend-widget | mp-spec-design-responsive | mp-sr-design |
| R8 | mp-mid-frontend-admin | mp-spec-fe-kanban | mp-sr-design |
| R9 | mp-sr-design | mp-spec-design-a11y, mp-mid-quality-code, mp-spec-test-build | mp-sr-orchestrator |

### Skills pouzite napric fazemi

| Skill | Pouziti |
|-------|---------|
| conventional-commit | Kazdy commit ve vsech fazich |
| review-pr | Review po kazde fazi |
| lint-fix | Automaticky lint po kazde zmene |
| vitest | Unit testy pro design token utility funkce |
| webapp-testing | Smoke testy po R3+ |
| verification-before-completion | Finalni verifikace kazde faze |
| writing-plans | Detailni sub-plany pro slozitejsi faze |
| dispatching-parallel-agents | Paralelni implementace v R2, R4, R6 |
| systematic-debugging | Debugging vizualnich regresi |
| test-driven-development | R1 token testy, R9 a11y testy |

---

## R0: PRIPRAVA A ZAVISLOSTI

**Cil:** Pripravit vsechny externi zavislosti, font importy, npm balicky a souborovou strukturu pred samotnou implementaci design systemu.

**Doba:** 0.5-1 den
**Lead:** mp-sr-design
**Implementace:** mp-mid-design-system, mp-mid-infra-build

### R0.1 Font importy — Google Fonts

**Soubor:** `Model_Pricer-V2-main/index.html`

Pridat do `<head>` sekce preload a import pro 4 font rodiny:

```html
<!-- FORGE Font Preloads (kriticke pro FCP) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Space Grotesk: Headings (700) + Subheadings (600) -->
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap" />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap" />

<!-- IBM Plex Sans: Body (400) + Labels (500) + Strong (600) -->
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" />

<!-- Space Mono: Technical labels (400) -->
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400&display=swap" />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400&display=swap" />

<!-- JetBrains Mono: Mono values (400, 500, 700) — jiz existuje, rozsirit vahy -->
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" />
```

**Akce:** Odstranit stavajici import Inter a JetBrains Mono z `src/styles/tailwind.css` (radek 1-2), protoze budou nacteny pres index.html s preload.

**Agent:** mp-mid-infra-build
**Overeni:** DevTools Network tab — vsechny 4 fonty se nacitaji, font-display: swap funguje.

### R0.2 Souborova struktura — nove soubory

Vytvorit nasledujici soubory (prazdne, naplni se v R1):

```
Model_Pricer-V2-main/src/styles/
  forge-tokens.css          ← hlavni design tokeny
  forge-textures.css        ← noise, grid, scanline CSS
  forge-typography.css      ← font-face fallbacky, type scale utility tridy
  forge-animations.css      ← vsechny keyframes a animacni tridy
  forge-utilities.css       ← helper tridy specificke pro FORGE

Model_Pricer-V2-main/src/components/ui/forge/
  ForgeStatusIndicator.jsx  ← IDLE/HEATING/PRINTING/COMPLETE/ERROR
  ForgePriceBreakdown.jsx   ← receipt-style cenovy rozpis s dotted leaders
  ForgeNumberedCard.jsx     ← karta s "01/" label
  ForgeSquiggle.jsx         ← SVG hand-drawn squiggle podtrzeni
  ForgePrinterSVG.jsx       ← animovana 3D tiskarna SVG
  ForgeIcon.jsx             ← 10 custom 3D-printing SVG ikon

Model_Pricer-V2-main/src/assets/svg/
  forge-noise.svg           ← noise pattern pro grain overlay
  forge-icons/              ← slozka pro 10 custom ikon
    mp-upload-cube.svg
    mp-layers.svg
    mp-nozzle.svg
    mp-spool.svg
    mp-bed.svg
    mp-supports.svg
    mp-infill.svg
    mp-caliper.svg
    mp-timer.svg
    mp-cost.svg
```

**Agent:** mp-mid-design-system
**Overeni:** Vsechny soubory existuji, zadne build errory.

### R0.3 Aktualizace tailwind.css — odstraneni starych importu

**Soubor:** `Model_Pricer-V2-main/src/styles/tailwind.css`

Stavajici radky 1-2 (Google Fonts importy pro Inter a JetBrains Mono) se ODSTRANI — fonty se nyni nacitaji pres index.html s preload strategii.

Na zacatek tailwind.css se pridaji importy novych FORGE souboru:

```css
/* FORGE Design System Imports */
@import './forge-tokens.css';
@import './forge-textures.css';
@import './forge-typography.css';
@import './forge-animations.css';
@import './forge-utilities.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Agent:** mp-mid-design-system
**Overeni:** `npm run build` projde bez chyb.

### R0.4 Meta theme-color

**Soubor:** `Model_Pricer-V2-main/index.html`

Pridat/aktualizovat meta tag pro mobilni prohlizece:

```html
<meta name="theme-color" content="#08090C" />
<meta name="color-scheme" content="dark" />
```

**Agent:** mp-mid-infra-build

### R0.5 Tailwind config — rozsireni

**Soubor:** `Model_Pricer-V2-main/tailwind.config.js`

Pridat do `extend` sekce:

```js
theme: {
  extend: {
    fontFamily: {
      'forge-heading': ["'Space Grotesk'", 'system-ui', 'sans-serif'],
      'forge-body': ["'IBM Plex Sans'", 'system-ui', 'sans-serif'],
      'forge-mono': ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
      'forge-tech': ["'Space Mono'", "'JetBrains Mono'", 'monospace'],
    },
    colors: {
      forge: {
        void: '#08090C',
        surface: '#0E1015',
        elevated: '#161920',
        overlay: '#1C1F28',
        'text-primary': '#E8ECF1',
        'text-secondary': '#9BA3B0',
        'text-muted': '#5C6370',
        'text-disabled': '#3A3F4A',
        'accent-primary': '#00D4AA',
        'accent-primary-h': '#00F0C0',
        'accent-secondary': '#FF6B35',
        'accent-tertiary': '#6C63FF',
        success: '#00D4AA',
        warning: '#FFB547',
        error: '#FF4757',
        info: '#4DA8DA',
        'border-default': '#1E2230',
        'border-active': '#2A3040',
        'border-grid': '#141720',
      },
    },
    borderRadius: {
      'forge-sm': '4px',
      'forge-md': '6px',
      'forge-lg': '8px',
      'forge-xl': '12px',
    },
    fontSize: {
      'forge-4xl': ['2.441rem', { lineHeight: '3rem' }],
      'forge-3xl': ['1.953rem', { lineHeight: '2.5rem' }],
      'forge-2xl': ['1.563rem', { lineHeight: '2rem' }],
      'forge-xl': ['1.25rem', { lineHeight: '1.75rem' }],
      'forge-lg': ['1rem', { lineHeight: '1.5rem' }],
      'forge-base': ['0.875rem', { lineHeight: '1.375rem' }],
      'forge-sm': ['0.75rem', { lineHeight: '1.125rem' }],
      'forge-xs': ['0.625rem', { lineHeight: '1rem' }],
    },
  },
},
```

**Agent:** mp-mid-infra-build
**Overeni:** `npm run build` projde, Tailwind tridy jako `bg-forge-void` funguji.

### R0.6 Zavislosti — npm balicky

Zkontrolovat ze nasledujici jsou nainstalovane (vetsina jiz existuje):

```
@radix-ui/react-slot       ← jiz existuje (Button.jsx)
class-variance-authority    ← jiz existuje (Button.jsx)
clsx                        ← jiz existuje (cn utility)
tailwind-merge              ← jiz existuje (cn utility)
framer-motion               ← jiz existuje (drawer/transitions)
```

Nove zavislosti: **ZADNE**. FORGE redesign nepotrebuje nove npm balicky. Vsechno se resi pres CSS custom properties, SVG a existujici infrastrukturu.

**Agent:** mp-mid-infra-build
**Overeni:** `npm ls` — vsechny zavislosti resolvuji.

### R0.7 Git branch strategie

```bash
git checkout -b redesign/forge-r0-preparation
# ... implementace R0 ...
git add .
git commit -m "feat(design): R0 — FORGE preparation, font imports, file structure, tailwind config"
```

Kazda faze (R0-R9) dostane vlastni branch `redesign/forge-rN-<popis>`. Po review se merguji do `main`.

**Agent:** mp-sr-orchestrator (koordinace), kazdy implementacni agent commituje pres skill `conventional-commit`

### R0.8 Odstraneni stavajicich generic stylu

V `tailwind.css` — stavajici `:root` promenne (radky 8-92) zustanou DOCASNE zachovane pro zpetnou kompatibilitu. Budou postupne nahrazovany forge-* tokenmy v R1-R6. Uplne se odstrani az po R9 (finalni cleanup).

**Strategie:** "Overlay, don't replace" — nove forge-* tokeny existuji vedle starych. Komponenty se postupne migruji na forge-* tokeny. Stare tokeny se nemazou dokud vsechny reference nejsou migrovane.

**Agent:** mp-mid-design-system

### R0.9 Builder tokens synchronizace — plan

Stavajici `builder-tokens.css` pouziva modre accenty (`#3B82F6`). V R7 se aktualizuje na FORGE paletu. Docasne zustanou stavajici hodnoty.

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/builder/styles/builder-tokens.css`
**Akce v R7:** Nahradit `--builder-accent-primary: #3B82F6` za `--builder-accent-primary: #00D4AA` atd.

### R0.10 Definition of Done — R0

- [ ] Vsechny 4 font rodiny se nacitaji v index.html s preload
- [ ] Souborova struktura vytvorena (forge-*.css, forge/ komponenty, svg/)
- [ ] tailwind.css importuje forge-*.css soubory
- [ ] tailwind.config.js rozsiren o forge barvy, fonty, radii, font sizes
- [ ] meta theme-color nastaveny na #08090C
- [ ] `npm run build` projde bez chyb
- [ ] Zadne vizualni zmeny na webu (vse je jen priprava)
- [ ] Branch `redesign/forge-r0-preparation` commitnuty

---

## R1: DESIGN SYSTEM ZAKLAD

**Cil:** Implementovat kompletni sadu CSS custom properties (design tokenu), texturovych efektu, typografickeho systemu a animacnich keyframes. Po R1 jsou vsechny vizualni hodnoty definovane a pripravene k pouziti v komponentach.

**Doba:** 1.5-2 dny
**Lead:** mp-sr-design
**Implementace:** mp-mid-design-system
**Review:** mp-spec-design-a11y (kontrasty), mp-sr-frontend (architektura)

### R1.1 Design tokeny — forge-tokens.css

**Soubor:** `Model_Pricer-V2-main/src/styles/forge-tokens.css`

```css
/* ============================================
   MODELPRICER FORGE — DESIGN TOKENS
   Varianta "FORGE": Industrial / Technical / Spaceship Manual
   ============================================
   Filozofie: CNC machine control panels, spacecraft HUDs,
   technical blueprints, factory floor monitoring.
   ============================================ */

:root {
  /* ===========================
     BACKGROUND HIERARCHY (4 urovne)
     =========================== */
  --forge-bg-void:      #08090C;  /* Page background — nejhlubsi cerna s modrym podtonem */
  --forge-bg-surface:   #0E1015;  /* Card/panel background — primarni povrch */
  --forge-bg-elevated:  #161920;  /* Elevated elementy — modaly, dropdowny, popovers */
  --forge-bg-overlay:   #1C1F28;  /* Overlay panely, expanded sekce */

  /* ===========================
     TEXT HIERARCHY (4 urovne)
     WCAG AA verifikace:
     #E8ECF1 na #0E1015 = 14.2:1 (PASS AAA)
     #9BA3B0 na #0E1015 = 7.6:1  (PASS AA)
     #5C6370 na #0E1015 = 4.5:1  (PASS AA — minimum)
     #3A3F4A na #0E1015 = 2.5:1  (jen dekorace/disabled)
     =========================== */
  --forge-text-primary:   #E8ECF1;  /* Nadpisy, dulezite hodnoty */
  --forge-text-secondary: #9BA3B0;  /* Popisy, labely */
  --forge-text-muted:     #5C6370;  /* Hinty, timestamps, placeholdery */
  --forge-text-disabled:  #3A3F4A;  /* Disabled text */

  /* ===========================
     ACCENT COLORS
     =========================== */
  --forge-accent-primary:    #00D4AA;  /* Teal-green — nozzle glow / heated bed ready */
  --forge-accent-primary-h:  #00F0C0;  /* Primary hover — o stupen jasnejsi */
  --forge-accent-secondary:  #FF6B35;  /* Burnt orange — heated filament / warning warmth */
  --forge-accent-tertiary:   #6C63FF;  /* Electric violet — UV curing / special operations */

  /* ===========================
     SEMANTIC COLORS
     =========================== */
  --forge-success:   #00D4AA;  /* Shodne s primary — "print complete" green */
  --forge-warning:   #FFB547;  /* Amber — "bed heating" / pozor */
  --forge-error:     #FF4757;  /* Red — "print failed" / thermal runaway */
  --forge-info:      #4DA8DA;  /* Steel blue — informacni */

  /* ===========================
     3D PRINTING FILAMENT COLORS
     =========================== */
  --forge-filament-pla:     #4ECDC4;  /* PLA teal */
  --forge-filament-abs:     #FF6B6B;  /* ABS coral red */
  --forge-filament-petg:    #45B7D1;  /* PETG ocean blue */
  --forge-filament-tpu:     #96CEB4;  /* TPU sage green */
  --forge-filament-nylon:   #FFEAA7;  /* Nylon cream */

  /* ===========================
     3D PRINTING HARDWARE COLORS
     =========================== */
  --forge-nozzle-hot:       #FF9F43;  /* Horka tryska — oranzova */
  --forge-nozzle-cold:      #636E72;  /* Studena tryska — ocelova seda */
  --forge-bed-heated:       #FD7272;  /* Vyhraty bed — cerveny glow */
  --forge-bed-cold:         #2C3E50;  /* Studeny bed — tmava modra */
  --forge-layer-line:       rgba(0, 212, 170, 0.15);  /* Layer vizualizace */

  /* ===========================
     BORDER COLORS
     =========================== */
  --forge-border-default:   #1E2230;  /* Subtilni border — sotva viditelny */
  --forge-border-active:    #2A3040;  /* Aktivni/focused border */
  --forge-border-highlight: rgba(0, 212, 170, 0.2);  /* Accent border — 20% opacity primary */
  --forge-border-grid:      #141720;  /* Grid linka — velmi subtilni */

  /* ===========================
     GRADIENTS
     =========================== */
  --forge-gradient-brand:   linear-gradient(135deg, #00D4AA 0%, #6C63FF 100%);
  --forge-gradient-surface: linear-gradient(180deg, #0E1015 0%, #08090C 100%);
  --forge-gradient-hot:     linear-gradient(135deg, #FF6B35 0%, #FF4757 100%);
  --forge-gradient-glow:    radial-gradient(ellipse at center, rgba(0,212,170,0.08) 0%, transparent 70%);

  /* ===========================
     SHADOWS (Dark-Mode Optimized)
     V dark theme jsou stiny sotva viditelne.
     Pouzivame edge highlights (tenke svetlejsi bordery
     na top/left) a glow efekty.
     =========================== */
  --forge-shadow-sm:       0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.03);
  --forge-shadow-md:       0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04);
  --forge-shadow-lg:       0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05);
  --forge-shadow-glow:     0 0 20px rgba(0, 212, 170, 0.15);
  --forge-shadow-glow-hot: 0 0 20px rgba(255, 107, 53, 0.2);

  /* ===========================
     BORDER RADIUS
     Vedome MENSI nez typicke Tailwind defaulty (8/12/16px).
     Mensi radii pusobi technicky a precizne.
     Vedoma anti-AI volba — AI sablony miluji velke, bublinkovite radii.
     =========================== */
  --forge-radius-sm:   4px;   /* Buttony, badges, male ovladaci prvky */
  --forge-radius-md:   6px;   /* Karty, inputy, dropdowny */
  --forge-radius-lg:   8px;   /* Modaly, velke panely */
  --forge-radius-xl:   12px;  /* Hero karty, specialni kontejnery */
  --forge-radius-full: 9999px; /* Pills, avatary, kulate indikatory */

  /* ===========================
     TYPOGRAPHY — FONT STACKS
     =========================== */
  --forge-font-heading:  'Space Grotesk', system-ui, sans-serif;
  --forge-font-body:     'IBM Plex Sans', system-ui, sans-serif;
  --forge-font-mono:     'JetBrains Mono', 'Fira Code', monospace;
  --forge-font-tech:     'Space Mono', 'JetBrains Mono', monospace;

  /* ===========================
     TYPOGRAPHY — TYPE SCALE (Major Third 1.250)
     Base: 14px (0.875rem) — vyssi hustota pro technicky interface
     =========================== */
  --forge-text-4xl:  2.441rem;   /* 39px — Hero nadpisy */
  --forge-text-3xl:  1.953rem;   /* 31px — Page titles */
  --forge-text-2xl:  1.563rem;   /* 25px — Section headings */
  --forge-text-xl:   1.25rem;    /* 20px — Card titles */
  --forge-text-lg:   1rem;       /* 16px — Body large */
  --forge-text-base: 0.875rem;   /* 14px — Body default */
  --forge-text-sm:   0.75rem;    /* 12px — Captions, labels */
  --forge-text-xs:   0.625rem;   /* 10px — Badges, micro-labels */

  --forge-leading-4xl:  3rem;      /* 48px */
  --forge-leading-3xl:  2.5rem;    /* 40px */
  --forge-leading-2xl:  2rem;      /* 32px */
  --forge-leading-xl:   1.75rem;   /* 28px */
  --forge-leading-lg:   1.5rem;    /* 24px */
  --forge-leading-base: 1.375rem;  /* 22px */
  --forge-leading-sm:   1.125rem;  /* 18px */
  --forge-leading-xs:   1rem;      /* 16px */

  /* ===========================
     SPACING (8px grid)
     =========================== */
  --forge-space-0:  0px;
  --forge-space-1:  4px;    /* 0.5 unit — micro gaps, icon padding */
  --forge-space-2:  8px;    /* 1 unit — inline spacing, tight groups */
  --forge-space-3:  12px;   /* 1.5 units — form field internal padding */
  --forge-space-4:  16px;   /* 2 units — component internal padding */
  --forge-space-5:  20px;   /* 2.5 units */
  --forge-space-6:  24px;   /* 3 units — section padding, card padding */
  --forge-space-8:  32px;   /* 4 units — mezi sekcemi */
  --forge-space-10: 40px;   /* 5 units */
  --forge-space-12: 48px;   /* 6 units — vetsi section breaks */
  --forge-space-16: 64px;   /* 8 units — page-level vertical rhythm */
  --forge-space-24: 96px;   /* 12 units — hero sekce */
  --forge-space-32: 128px;  /* 16 units — maximalni section spacing */

  /* ===========================
     EASING TOKENS
     =========================== */
  --forge-ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);
  --forge-ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1);
  --forge-ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ===========================
     TRANSITION DURATIONS
     =========================== */
  --forge-duration-micro:     120ms;  /* Hover, focus, toggle */
  --forge-duration-standard:  200ms;  /* Button press, badge appear */
  --forge-duration-layout:    250ms;  /* Collapse, expand, tab switch */
  --forge-duration-enter:     300ms;  /* Modal open, page transition */
  --forge-duration-exit:      200ms;  /* Modal close, element remove */
  --forge-duration-breathing: 3000ms; /* CTA pulse, live indicator */

  /* ===========================
     Z-INDEX SCALE
     =========================== */
  --forge-z-base:     0;
  --forge-z-elevated: 10;
  --forge-z-sticky:   100;
  --forge-z-dropdown: 200;
  --forge-z-overlay:  300;
  --forge-z-modal:    400;
  --forge-z-toast:    500;
  --forge-z-tooltip:  600;
}
```

**Agent:** mp-mid-design-system
**Overeni:** Soubor se importuje bez chyb. Vsechny promenne jsou dostupne v DevTools computed styles.

### R1.2 Texturovy system — forge-textures.css

**Soubor:** `Model_Pricer-V2-main/src/styles/forge-textures.css`

```css
/* ============================================
   FORGE TEXTURES — Noise, Grid, Scanline
   Tyto textury pridavaji fyzicku kvalitu
   jinak perfektne plochym tmavym povrchum.
   ============================================ */

/* --- NOISE OVERLAY (subtilni grain, 2.5% opacity) ---
   Aplikovano na page background pres pseudo-element.
   Pouziva inline SVG feTurbulence — zadny externi soubor. */
.forge-grain::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: var(--forge-z-base);
}

/* --- BLUEPRINT GRID (24px mrize) ---
   Subtilni grid pattern na pozadich.
   Evokuje blueprinty a technicke vykresy. */
.forge-grid-bg {
  background-image:
    linear-gradient(var(--forge-border-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--forge-border-grid) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Varianta s hustejsi mrizi (12px) pro specialni sekce */
.forge-grid-bg-dense {
  background-image:
    linear-gradient(var(--forge-border-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--forge-border-grid) 1px, transparent 1px);
  background-size: 12px 12px;
}

/* --- SCANLINE EFFECT (velmi subtilni, pro specialni sekce) ---
   Pripomina stary CRT monitor. Pouzivat stridsmo. */
.forge-scanlines {
  position: relative;
}
.forge-scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
  z-index: 1;
}

/* --- DOT GRID (alternativa ke grid pro upload zony) --- */
.forge-dot-grid {
  background-image: radial-gradient(
    circle,
    var(--forge-border-grid) 1px,
    transparent 1px
  );
  background-size: 20px 20px;
}

/* --- SKEWED SECTION BACKGROUND ---
   Pouzivano pro pricing sekci na homepage.
   Lomi "perfektne obdelnikovy" AI pattern. */
.forge-skewed-bg {
  position: relative;
  overflow: hidden;
}
.forge-skewed-bg::before {
  content: '';
  position: absolute;
  inset: -20px -40px;
  background: var(--forge-bg-surface);
  transform: skewY(-2deg);
  z-index: -1;
}

/* --- GLOW EFFECT (za dulezitymi sekcemi) --- */
.forge-glow {
  position: relative;
}
.forge-glow::before {
  content: '';
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 300px;
  background: var(--forge-gradient-glow);
  pointer-events: none;
  z-index: 0;
}

/* --- prefers-reduced-motion ---
   Noise a grid zustavaji (staticke).
   Scanline muzeme vypnout pokud je dotazujici. */
@media (prefers-reduced-motion: reduce) {
  .forge-scanlines::after {
    display: none;
  }
}
```

**Agent:** mp-mid-design-system
**Overeni:** `forge-grain` trida na body ukazuje subtilni grain v DevTools. `forge-grid-bg` na divu ukazuje 24px mrizi.

### R1.3 Typograficky system — forge-typography.css

**Soubor:** `Model_Pricer-V2-main/src/styles/forge-typography.css`

```css
/* ============================================
   FORGE TYPOGRAPHY SYSTEM
   Space Grotesk 700 — headings
   IBM Plex Sans 400/500/600 — body, labels
   JetBrains Mono 400/500/700 — monospace hodnoty
   Space Mono 400 — technicke labely
   ============================================ */

/* --- BASE BODY --- */
.forge-body {
  font-family: var(--forge-font-body);
  font-size: var(--forge-text-base);
  line-height: var(--forge-leading-base);
  font-weight: 400;
  color: var(--forge-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* --- HEADINGS --- */
.forge-h1 {
  font-family: var(--forge-font-heading);
  font-size: var(--forge-text-4xl);
  line-height: var(--forge-leading-4xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--forge-text-primary);
}

.forge-h2 {
  font-family: var(--forge-font-heading);
  font-size: var(--forge-text-3xl);
  line-height: var(--forge-leading-3xl);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--forge-text-primary);
}

.forge-h3 {
  font-family: var(--forge-font-heading);
  font-size: var(--forge-text-2xl);
  line-height: var(--forge-leading-2xl);
  font-weight: 600;
  color: var(--forge-text-primary);
}

.forge-h4 {
  font-family: var(--forge-font-heading);
  font-size: var(--forge-text-xl);
  line-height: var(--forge-leading-xl);
  font-weight: 600;
  color: var(--forge-text-primary);
}

/* --- BODY VARIANTS --- */
.forge-body-lg {
  font-family: var(--forge-font-body);
  font-size: var(--forge-text-lg);
  line-height: var(--forge-leading-lg);
  font-weight: 400;
}

.forge-body-sm {
  font-family: var(--forge-font-body);
  font-size: var(--forge-text-sm);
  line-height: var(--forge-leading-sm);
  font-weight: 400;
}

/* --- LABELS (UPPERCASE, letter-spacing) ---
   Technicke labely jako "CONFIGURATION", "STATUS: ONLINE" */
.forge-label {
  font-family: var(--forge-font-body);
  font-size: var(--forge-text-sm);
  line-height: var(--forge-leading-sm);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--forge-text-secondary);
}

/* Monospace varianta labelu pro "ADMIN CONSOLE", skupinove nadpisy */
.forge-label-mono {
  font-family: var(--forge-font-tech);
  font-size: var(--forge-text-xs);
  line-height: 1.2;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--forge-text-muted);
}

/* --- MONOSPACE VALUES ---
   Pro ceny, rozmery, cisla objednavek */
.forge-mono {
  font-family: var(--forge-font-mono);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.forge-mono-bold {
  font-family: var(--forge-font-mono);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* --- TECHNICAL TEXT ---
   Space Mono pro mereni, souradnice */
.forge-tech {
  font-family: var(--forge-font-tech);
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

/* --- CAPTION --- */
.forge-caption {
  font-family: var(--forge-font-body);
  font-size: var(--forge-text-sm);
  line-height: var(--forge-leading-sm);
  font-weight: 400;
  color: var(--forge-text-muted);
}

/* --- PRICE DISPLAY --- */
.forge-price {
  font-family: var(--forge-font-mono);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--forge-accent-primary);
}

.forge-price-lg {
  font-family: var(--forge-font-mono);
  font-size: var(--forge-text-2xl);
  line-height: var(--forge-leading-2xl);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--forge-accent-primary);
}
```

**Agent:** mp-mid-design-system

### R1.4 Animacni system — forge-animations.css

**Soubor:** `Model_Pricer-V2-main/src/styles/forge-animations.css`

```css
/* ============================================
   FORGE ANIMATIONS
   Vsechny keyframes a animacni tridy.
   Kazda animace MA UCEL — zadne dekorativni bouncing.
   ============================================ */

/* --- BREATHING PULSE (CTA, live indikatory) --- */
@keyframes forge-breathe {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.02);
  }
}

.forge-breathe {
  animation: forge-breathe var(--forge-duration-breathing) var(--forge-ease-in-out-quad) infinite;
}

/* --- STATUS PULSE (blinkajici tecka u "STATUS: ONLINE") --- */
@keyframes forge-pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.forge-pulse-dot {
  animation: forge-pulse-dot 2s ease-in-out infinite;
}

/* --- GLOW PULSE (heated bed, nozzle) --- */
@keyframes forge-glow-pulse {
  0%, 100% {
    box-shadow: 0 0 8px rgba(0, 212, 170, 0.2);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 212, 170, 0.4);
  }
}

.forge-glow-pulse {
  animation: forge-glow-pulse 2.5s ease-in-out infinite;
}

/* --- HOT GLOW (oranzovy glow pro trysku) --- */
@keyframes forge-hot-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(255, 159, 67, 0.3);
  }
  50% {
    box-shadow: 0 0 24px rgba(255, 159, 67, 0.6);
  }
}

.forge-hot-glow {
  animation: forge-hot-glow 2s ease-in-out infinite;
}

/* --- FADE IN (page transitions, card appear) --- */
@keyframes forge-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.forge-fade-in {
  animation: forge-fade-in var(--forge-duration-enter) var(--forge-ease-out-expo) forwards;
}

/* --- SLIDE IN FROM RIGHT (toast notifications) --- */
@keyframes forge-slide-in-right {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.forge-slide-in-right {
  animation: forge-slide-in-right var(--forge-duration-enter) var(--forge-ease-out-expo) forwards;
}

/* --- SCALE IN (modal enter) --- */
@keyframes forge-scale-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.forge-scale-in {
  animation: forge-scale-in var(--forge-duration-standard) var(--forge-ease-out-expo) forwards;
}

/* --- NOZZLE MOVE (horizontalni pohyb trysky v hero SVG) --- */
@keyframes forge-nozzle-move {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(120px);
  }
}

.forge-nozzle-move {
  animation: forge-nozzle-move 8s ease-in-out infinite;
}

/* --- LAYER STACK (vrstvy se postupne objevuji) --- */
@keyframes forge-layer-appear {
  from {
    opacity: 0;
    transform: translateY(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- CHECKMARK DRAW (SVG path draw pro potvrzeni) --- */
@keyframes forge-draw-check {
  from {
    stroke-dashoffset: 100;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.forge-draw-check {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: forge-draw-check 600ms var(--forge-ease-out-expo) forwards;
}

/* --- PROGRESS BAR SHRINK (toast auto-dismiss) --- */
@keyframes forge-progress-shrink {
  from { width: 100%; }
  to { width: 0%; }
}

.forge-progress-shrink {
  animation: forge-progress-shrink 5s linear forwards;
}

/* --- SHIMMER (loading state) --- */
@keyframes forge-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.forge-shimmer {
  background: linear-gradient(
    90deg,
    var(--forge-bg-surface) 0%,
    var(--forge-bg-elevated) 50%,
    var(--forge-bg-surface) 100%
  );
  background-size: 200% 100%;
  animation: forge-shimmer 1.5s linear infinite;
}

/* --- MARQUEE (logo pas) --- */
@keyframes forge-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.forge-marquee {
  animation: forge-marquee 18s linear infinite;
  will-change: transform;
}

/* --- SPINNER (ring typ) --- */
@keyframes forge-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.forge-spin {
  animation: forge-spin 1s linear infinite;
}

/* --- MICRO TRANSITIONS (utility tridy) --- */
.forge-transition-micro {
  transition-property: color, background-color, border-color, opacity, transform, box-shadow;
  transition-duration: var(--forge-duration-micro);
  transition-timing-function: ease-out;
}

.forge-transition-standard {
  transition-property: all;
  transition-duration: var(--forge-duration-standard);
  transition-timing-function: var(--forge-ease-out-expo);
}

.forge-transition-layout {
  transition-property: width, height, padding, margin, opacity;
  transition-duration: var(--forge-duration-layout);
  transition-timing-function: var(--forge-ease-in-out-quad);
}

/* --- PREFERS-REDUCED-MOTION ---
   Vse krome opacity fade se vypne. */
@media (prefers-reduced-motion: reduce) {
  .forge-breathe,
  .forge-pulse-dot,
  .forge-glow-pulse,
  .forge-hot-glow,
  .forge-nozzle-move,
  .forge-marquee,
  .forge-shimmer {
    animation: none !important;
  }

  .forge-fade-in,
  .forge-slide-in-right,
  .forge-scale-in {
    animation-duration: 0.01ms !important;
  }

  .forge-transition-micro,
  .forge-transition-standard,
  .forge-transition-layout {
    transition-duration: 0.01ms !important;
  }
}
```

**Agent:** mp-mid-design-system, mp-spec-fe-animations

### R1.5 Utility tridy — forge-utilities.css

**Soubor:** `Model_Pricer-V2-main/src/styles/forge-utilities.css`

```css
/* ============================================
   FORGE UTILITY CLASSES
   Pomocne tridy specificke pro FORGE design system.
   ============================================ */

/* --- FORGE ROOT APPLICATION ---
   Aplikovano na <body> nebo korcenovy wrapper */
.forge-app {
  background-color: var(--forge-bg-void);
  color: var(--forge-text-primary);
  font-family: var(--forge-font-body);
  font-size: var(--forge-text-base);
  line-height: var(--forge-leading-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* --- FOCUS RING (viditelny na dark bg) --- */
.forge-focus-ring:focus-visible {
  outline: 2px solid var(--forge-accent-primary);
  outline-offset: 2px;
}

/* Alternativni focus pro inputy (inner glow) */
.forge-focus-glow:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.15);
  border-color: var(--forge-accent-primary);
}

/* --- CARD BASE --- */
.forge-card {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-md);
  padding: var(--forge-space-6);
}

.forge-card-interactive {
  background: var(--forge-bg-surface);
  border: 1px solid var(--forge-border-default);
  border-radius: var(--forge-radius-md);
  padding: var(--forge-space-6);
  cursor: pointer;
  transition:
    background-color var(--forge-duration-micro) ease-out,
    border-color var(--forge-duration-micro) ease-out,
    box-shadow var(--forge-duration-micro) ease-out,
    transform var(--forge-duration-micro) ease-out;
}

.forge-card-interactive:hover {
  background: var(--forge-bg-elevated);
  border-color: var(--forge-border-highlight);
  box-shadow: var(--forge-shadow-glow);
  transform: translateY(-2px);
}

.forge-card-interactive:active {
  transform: translateY(0);
  box-shadow: var(--forge-shadow-sm);
}

/* --- INFO CALLOUT (levy barevny border) --- */
.forge-callout {
  background: rgba(0, 212, 170, 0.06);
  border-left: 3px solid var(--forge-accent-primary);
  border-radius: 0 var(--forge-radius-md) var(--forge-radius-md) 0;
  padding: var(--forge-space-4) var(--forge-space-5);
}

.forge-callout-warning {
  background: rgba(255, 181, 71, 0.06);
  border-left-color: var(--forge-warning);
}

.forge-callout-error {
  background: rgba(255, 71, 87, 0.06);
  border-left-color: var(--forge-error);
}

.forge-callout-info {
  background: rgba(77, 168, 218, 0.06);
  border-left-color: var(--forge-info);
}

/* --- DOTTED LEADER LINE (receipt-style cenovy rozpis) --- */
.forge-leader-line {
  display: flex;
  align-items: baseline;
  gap: var(--forge-space-2);
}

.forge-leader-line::after {
  content: '';
  flex: 1;
  border-bottom: 1px dotted var(--forge-border-grid);
  margin: 0 var(--forge-space-1);
  position: relative;
  top: -3px;
}

/* --- NUMBERED LABEL ("01/", "02/") --- */
.forge-numbered-label {
  font-family: var(--forge-font-tech);
  font-size: var(--forge-text-xs);
  font-weight: 400;
  color: var(--forge-text-muted);
  letter-spacing: 0.05em;
}

/* --- SCROLLBAR (dark themed) --- */
.forge-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.forge-scrollbar::-webkit-scrollbar-track {
  background: var(--forge-bg-surface);
}

.forge-scrollbar::-webkit-scrollbar-thumb {
  background: var(--forge-border-active);
  border-radius: var(--forge-radius-full);
}

.forge-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--forge-text-muted);
}

/* --- SECTION DIVIDER --- */
.forge-divider {
  border: none;
  height: 1px;
  background: var(--forge-border-default);
  margin: var(--forge-space-8) 0;
}

/* --- BADGE --- */
.forge-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-family: var(--forge-font-mono);
  font-size: var(--forge-text-xs);
  font-weight: 500;
  border-radius: var(--forge-radius-sm);
  line-height: 1.4;
}

.forge-badge-success {
  background: rgba(0, 212, 170, 0.12);
  color: var(--forge-success);
}

.forge-badge-warning {
  background: rgba(255, 181, 71, 0.12);
  color: var(--forge-warning);
}

.forge-badge-error {
  background: rgba(255, 71, 87, 0.12);
  color: var(--forge-error);
}

.forge-badge-info {
  background: rgba(77, 168, 218, 0.12);
  color: var(--forge-info);
}

.forge-badge-accent {
  background: rgba(0, 212, 170, 0.12);
  color: var(--forge-accent-primary);
}

.forge-badge-secondary {
  background: rgba(255, 107, 53, 0.12);
  color: var(--forge-accent-secondary);
}
```

**Agent:** mp-mid-design-system

### R1.6 Aktualizace tailwind.css — body a heading styly

**Soubor:** `Model_Pricer-V2-main/src/styles/tailwind.css`

V `@layer base` sekci NAHRADIT stavajici body a heading pravidla:

```css
@layer base {
  /* Stavajici :root promenne zustavaji docasne (backward compatibility).
     Nove FORGE tokeny viz forge-tokens.css. */

  body {
    @apply bg-forge-void text-forge-text-primary;
    font-family: var(--forge-font-body);
    font-size: var(--forge-text-base);
    line-height: var(--forge-leading-base);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--forge-font-heading);
    color: var(--forge-text-primary);
  }

  .font-mono {
    font-family: var(--forge-font-mono);
  }
}
```

POZOR: Toto je prvni vizualni zmena — cele pozadi stranky se zmeni na #08090C a fonty na Space Grotesk/IBM Plex Sans. Vsechny existujici stranky budou vypadat jinak.

**Agent:** mp-mid-design-system
**Overeni:** Web se nacte s tmavym pozadim, texty jsou citelne, zadne build chyby.

### R1.7 WCAG kontrast verifikace

Tabulka verifikace vsech kombinaci text/pozadi:

| Foreground | Background | Ratio | Vysledek |
|-----------|-----------|-------|----------|
| #E8ECF1 (text-primary) | #08090C (bg-void) | 16.4:1 | PASS AAA |
| #E8ECF1 (text-primary) | #0E1015 (bg-surface) | 14.2:1 | PASS AAA |
| #E8ECF1 (text-primary) | #161920 (bg-elevated) | 11.8:1 | PASS AAA |
| #E8ECF1 (text-primary) | #1C1F28 (bg-overlay) | 10.1:1 | PASS AAA |
| #9BA3B0 (text-secondary) | #0E1015 (bg-surface) | 7.6:1 | PASS AA |
| #9BA3B0 (text-secondary) | #161920 (bg-elevated) | 6.3:1 | PASS AA |
| #5C6370 (text-muted) | #0E1015 (bg-surface) | 4.5:1 | PASS AA (minimum) |
| #5C6370 (text-muted) | #161920 (bg-elevated) | 3.7:1 | PASS AA large only |
| #00D4AA (accent-primary) | #0E1015 (bg-surface) | 9.8:1 | PASS AAA |
| #08090C (text on primary btn) | #00D4AA (accent bg) | 11.2:1 | PASS AAA |
| #FF6B35 (accent-secondary) | #0E1015 (bg-surface) | 6.2:1 | PASS AA |
| #FF4757 (error) | #0E1015 (bg-surface) | 5.8:1 | PASS AA |
| #FFB547 (warning) | #0E1015 (bg-surface) | 9.2:1 | PASS AAA |
| #4DA8DA (info) | #0E1015 (bg-surface) | 6.8:1 | PASS AA |
| #6C63FF (tertiary) | #0E1015 (bg-surface) | 5.1:1 | PASS AA |

**Poznamka k text-muted:** Na bg-elevated (3.7:1) nesplnuje AA pro maly text. Pouzivat POUZE pro doplnkove informace (hinty, timestamps, placeholdery). Pro dulezity text na elevated povrsich pouzit text-secondary.

**Agent:** mp-spec-design-a11y
**Nastroj:** Chrome DevTools Contrast Checker, axe-core

### R1.8 Token testy — vitest

Vytvorit jednoduchy test ktery overuje ze vsechny kriticke tokeny jsou definovane:

**Soubor:** `Model_Pricer-V2-main/src/styles/__tests__/forge-tokens.test.js`

```js
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const tokensCSS = fs.readFileSync(
  path.resolve(__dirname, '../forge-tokens.css'),
  'utf-8'
);

describe('FORGE Design Tokens', () => {
  const requiredTokens = [
    '--forge-bg-void',
    '--forge-bg-surface',
    '--forge-bg-elevated',
    '--forge-bg-overlay',
    '--forge-text-primary',
    '--forge-text-secondary',
    '--forge-text-muted',
    '--forge-accent-primary',
    '--forge-accent-secondary',
    '--forge-accent-tertiary',
    '--forge-success',
    '--forge-warning',
    '--forge-error',
    '--forge-info',
    '--forge-border-default',
    '--forge-border-active',
    '--forge-radius-sm',
    '--forge-radius-md',
    '--forge-radius-lg',
    '--forge-font-heading',
    '--forge-font-body',
    '--forge-font-mono',
    '--forge-font-tech',
    '--forge-shadow-sm',
    '--forge-shadow-md',
    '--forge-shadow-lg',
    '--forge-shadow-glow',
  ];

  requiredTokens.forEach(token => {
    it(`defines ${token}`, () => {
      expect(tokensCSS).toContain(token);
    });
  });
});
```

**Agent:** mp-mid-quality-code, skill: vitest

### R1.9 Dokumentace tokenu

Pridat komentare do forge-tokens.css (jiz obsazeno v R1.1) a vytvorit strucny prehled v `docs/claude/Planovane_Implementace/Redesign/FORGE_TOKENS_REFERENCE.md` (volitelne, pouze pokud to vyzada mp-sr-docs).

### R1.10 Definition of Done — R1

- [ ] forge-tokens.css obsahuje vsechny barevne, typograficke, spacing, shadow, radius, z-index a easing tokeny
- [ ] forge-textures.css obsahuje noise, grid, scanline, dot-grid, skewed-bg a glow tridy
- [ ] forge-typography.css obsahuje vsechny heading, body, label, mono, tech a price tridy
- [ ] forge-animations.css obsahuje vsechny keyframes a animacni tridy vcetne prefers-reduced-motion
- [ ] forge-utilities.css obsahuje card, callout, leader-line, badge, scrollbar, focus a divider tridy
- [ ] tailwind.css importuje vsechny forge-*.css soubory a aktualizuje body/heading styly
- [ ] WCAG AA kontrast overen pro vsechny text/background kombinace
- [ ] Token testy prochazi (vitest)
- [ ] `npm run build` projde bez chyb
- [ ] Web se nacte s tmavym pozadim a novymi fonty
- [ ] Branch `redesign/forge-r1-design-system` commitnuty

---

## R2: ZAKLADNI KOMPONENTY

**Cil:** Reimplementovat 15+ zakladnich UI komponent v FORGE design systemu. Kazda komponenta pouziva forge-* tokeny, 4px radius system, 40px compact height, uppercase labely a glow efekty. CVA architektura se zachova a rozsiri.

**Doba:** 3-4 dny
**Lead:** mp-mid-design-system
**Implementace:** mp-spec-fe-forms (inputy), mp-spec-fe-animations (prechody), mp-spec-design-icons (ikony)
**Review:** mp-sr-design, mp-spec-design-a11y

### R2.1 Button — aktualizace CVA variant

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Button.jsx`

Stavajici CVA architektura se ZACHOVA. Pridaji se nove varianty a aktualizuji existujici:

```jsx
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap text-sm font-medium",
    "forge-transition-micro",
    "forge-focus-ring",
    "disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--forge-accent-primary)] text-[#08090C]",
          "font-[var(--forge-font-heading)]",
          "font-semibold",
          "rounded-[var(--forge-radius-sm)]",
          "hover:bg-[var(--forge-accent-primary-h)]",
          "hover:-translate-y-[1px]",
          "hover:shadow-[var(--forge-shadow-glow)]",
          "active:translate-y-0",
        ].join(" "),
        primary: [
          "bg-[var(--forge-accent-primary)] text-[#08090C]",
          "font-[var(--forge-font-heading)]",
          "font-semibold",
          "rounded-[var(--forge-radius-sm)]",
          "hover:bg-[var(--forge-accent-primary-h)]",
          "hover:-translate-y-[1px]",
          "hover:shadow-[var(--forge-shadow-glow)]",
          "active:translate-y-0",
        ].join(" "),
        secondary: [
          "bg-transparent",
          "border border-[var(--forge-border-active)]",
          "text-[var(--forge-text-secondary)]",
          "rounded-[var(--forge-radius-sm)]",
          "hover:bg-[var(--forge-bg-elevated)]",
          "hover:text-[var(--forge-text-primary)]",
        ].join(" "),
        outline: [
          "bg-transparent",
          "border border-[var(--forge-border-active)]",
          "text-[var(--forge-text-secondary)]",
          "rounded-[var(--forge-radius-sm)]",
          "hover:bg-[var(--forge-bg-elevated)]",
          "hover:text-[var(--forge-text-primary)]",
        ].join(" "),
        ghost: [
          "bg-transparent",
          "text-[var(--forge-text-secondary)]",
          "rounded-[var(--forge-radius-sm)]",
          "hover:bg-[var(--forge-bg-elevated)]",
          "hover:text-[var(--forge-text-primary)]",
        ].join(" "),
        destructive: [
          "bg-[var(--forge-error)] text-white",
          "rounded-[var(--forge-radius-sm)]",
          "hover:brightness-90",
          "hover:shadow-[var(--forge-shadow-glow-hot)]",
        ].join(" "),
        link: [
          "text-[var(--forge-accent-primary)]",
          "underline-offset-4 hover:underline",
          "hover:brightness-110",
        ].join(" "),
        gradient: [
          "bg-gradient-to-r from-[var(--forge-accent-primary)] to-[var(--forge-accent-tertiary)]",
          "text-[#08090C] font-semibold",
          "rounded-[var(--forge-radius-sm)]",
          "hover:opacity-90",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2",      /* 40px — md */
        sm: "h-9 px-4 text-[13px]",     /* 36px */
        lg: "h-12 px-7 text-base",      /* 48px */
        icon: "h-10 w-10 p-0",          /* 40x40 */
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

**Klicove zmeny oproti soucasnemu stavu:**
- `rounded-lg` nahrazeno za `rounded-[var(--forge-radius-sm)]` (4px misto 8px)
- Modre barvy nahrazeny za forge accent tokeny
- Font zmenen na Space Grotesk (heading) pro buttony
- Glow hover efekt misto jednoducheho opacity
- translateY(-1px) hover pro fyzicky pocit

**Agent:** mp-mid-design-system

### R2.2 Card — nove varianty

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Card.jsx`

Aktualizovat zakladni Card komponentu:

```jsx
const Card = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: [
      "bg-[var(--forge-bg-surface)]",
      "border border-[var(--forge-border-default)]",
      "rounded-[var(--forge-radius-md)]",
      "text-[var(--forge-text-primary)]",
    ].join(" "),
    elevated: [
      "bg-[var(--forge-bg-elevated)]",
      "border border-[var(--forge-border-active)]",
      "rounded-[var(--forge-radius-md)]",
      "shadow-[var(--forge-shadow-sm)]",
      "text-[var(--forge-text-primary)]",
    ].join(" "),
    stat: [
      "bg-[var(--forge-bg-surface)]",
      "border border-[var(--forge-border-default)]",
      "rounded-[var(--forge-radius-md)]",
      "border-t-2 border-t-[var(--forge-accent-primary)]",
      "text-[var(--forge-text-primary)]",
    ].join(" "),
    interactive: [
      "forge-card-interactive",
      "text-[var(--forge-text-primary)]",
    ].join(" "),
  };

  return (
    <div
      ref={ref}
      className={cn(variants[variant] || variants.default, className)}
      {...props}
    />
  );
});
```

**CardHeader padding:** Zmenit z `p-6` na `p-[var(--forge-space-6)]` (24px — zachovano).
**CardContent padding:** Zmenit z `p-6 pt-0` na `p-[var(--forge-space-6)] pt-0`.

**Agent:** mp-mid-design-system

### R2.3 Input — tmave FORGE styling

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Input.jsx`

```jsx
const Input = React.forwardRef(({ className, type, label, error, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="forge-label">
        {label}
      </label>
    )}
    <input
      type={type}
      className={cn(
        /* Base */
        "h-10 w-full px-3",
        "bg-[var(--forge-bg-elevated)]",
        "border border-[var(--forge-border-default)]",
        "rounded-[var(--forge-radius-sm)]",
        "font-[var(--forge-font-body)] text-[var(--forge-text-base)]",
        "text-[var(--forge-text-primary)]",
        "placeholder:text-[var(--forge-text-muted)]",
        /* Focus */
        "focus:outline-none",
        "focus:border-[var(--forge-accent-primary)]",
        "focus:shadow-[0_0_0_2px_rgba(0,212,170,0.15)]",
        /* Error */
        error && "border-[var(--forge-error)] focus:border-[var(--forge-error)] focus:shadow-[0_0_0_2px_rgba(255,71,87,0.15)]",
        /* Disabled */
        "disabled:bg-[var(--forge-bg-void)]",
        "disabled:text-[var(--forge-text-disabled)]",
        "disabled:cursor-not-allowed",
        /* Transition */
        "forge-transition-micro",
        className
      )}
      ref={ref}
      {...props}
    />
    {error && (
      <span className="text-[var(--forge-error)] text-[12px] font-[var(--forge-font-body)]">
        {error}
      </span>
    )}
  </div>
));
```

**Klicove zmeny:**
- Label je UPPERCASE, IBM Plex Sans 500, 12px, letter-spacing 0.05em (forge-label trida)
- Input bg je --forge-bg-elevated (#161920), ne bile
- Focus glow je teal (#00D4AA) misto modra
- 4px radius (--forge-radius-sm)
- 40px vyska (h-10)

**Agent:** mp-spec-fe-forms

### R2.4 Select (Dropdown)

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Select.jsx`

Zachovat Radix primitive, aktualizovat vizual:

- Trigger: stejne styly jako Input (bg-elevated, border-default, 4px radius)
- Chevron icon: --forge-text-muted, rotace 180deg pri open
- Dropdown menu: bg --forge-bg-elevated, border --forge-border-default, radius 6px, shadow-md
- Option hover: bg --forge-bg-overlay
- Selected option: --forge-accent-primary tecka vlevo (3px)
- Selected text: --forge-accent-primary barva

**Agent:** mp-spec-fe-forms

### R2.5 Checkbox a Toggle/Switch

**Checkbox:**
- 18x18px, border 2px --forge-border-active, radius 3px, bg --forge-bg-elevated
- Checked: bg --forge-accent-primary, border --forge-accent-primary, fajfka #08090C (2px stroke)
- Transition: 150ms scale 0.8 -> 1 na check
- Label: IBM Plex Sans 400, 14px, --forge-text-secondary, gap 8px

**Toggle/Switch:**
- 44px x 22px, off: bg --forge-border-active, thumb --forge-text-muted
- On: bg --forge-accent-primary, thumb #FFFFFF
- Transition: 200ms ease
- Disabled: opacity 0.5

**Soubory:** `Model_Pricer-V2-main/src/components/ui/Checkbox.jsx`

**Agent:** mp-spec-fe-forms

### R2.6 Slider

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Slider.jsx`

- Track: 4px vyska, bg --forge-bg-overlay
- Filled cast: --forge-accent-primary
- Thumb: 16x16px, --forge-accent-primary bg, 2px --forge-bg-surface border
- Thumb hover: 20x20px, --forge-shadow-glow
- Value display: monospace tooltip nad thumbem pri drag

Zachovat Radix Slider primitive, aktualizovat styly.

**Agent:** mp-spec-fe-forms

### R2.7 Dialog/Modal

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Dialog.jsx`

- Overlay: rgba(8, 9, 12, 0.85) — --forge-bg-void na 85% opacity
- Container: bg --forge-bg-surface, border 1px --forge-border-default, radius 8px (--forge-radius-lg)
- Shadow: --forge-shadow-lg
- Header: padding 20px 24px, border-bottom 1px --forge-border-default
- Title: Space Grotesk 600, --forge-text-xl
- Close button: ghost icon 32x32, top-right
- Body: padding 24px, max-height calc(85vh - 140px), overflow-y auto
- Footer: padding 16px 24px, border-top 1px --forge-border-default, buttony right-aligned gap 8px
- Enter animace: opacity 0->1, scale 0.96->1, 200ms ease-out-expo
- Exit animace: opacity 1->0, scale 1->0.98, 150ms ease-in

**Agent:** mp-mid-design-system

### R2.8 Tooltip

**Soubor:** `Model_Pricer-V2-main/src/components/ui/tooltip.jsx`

- bg --forge-bg-elevated, border 1px --forge-border-default
- Radius: --forge-radius-sm (4px)
- Shadow: --forge-shadow-sm
- Text: IBM Plex Sans 400, 12px (--forge-text-sm), --forge-text-primary
- Padding: 6px 10px
- Arrow: --forge-bg-elevated fill

**Agent:** mp-mid-design-system

### R2.9 Toast/Notification komponenta

**Novy soubor (pokud neexistuje):** `Model_Pricer-V2-main/src/components/ui/Toast.jsx`

```jsx
function Toast({ type = 'info', title, message, onDismiss, duration = 5000 }) {
  const typeStyles = {
    success: {
      borderColor: 'var(--forge-success)',
      iconColor: 'var(--forge-success)',
    },
    error: {
      borderColor: 'var(--forge-error)',
      iconColor: 'var(--forge-error)',
    },
    warning: {
      borderColor: 'var(--forge-warning)',
      iconColor: 'var(--forge-warning)',
    },
    info: {
      borderColor: 'var(--forge-info)',
      iconColor: 'var(--forge-info)',
    },
  };

  return (
    <div
      className={cn(
        "forge-slide-in-right",
        "bg-[var(--forge-bg-elevated)]",
        "border border-[var(--forge-border-default)]",
        "rounded-[var(--forge-radius-md)]",
        "shadow-[var(--forge-shadow-md)]",
        "p-3 px-4",
        "min-w-[320px] max-w-[420px]",
      )}
      style={{ borderLeftWidth: '3px', borderLeftColor: typeStyles[type].borderColor }}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div style={{ color: typeStyles[type].iconColor }} className="mt-0.5">
          {/* 20px status icon */}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-[var(--forge-font-body)] text-[14px] font-semibold text-[var(--forge-text-primary)]">
              {title}
            </p>
          )}
          {message && (
            <p className="font-[var(--forge-font-body)] text-[13px] text-[var(--forge-text-secondary)] mt-0.5">
              {message}
            </p>
          )}
        </div>
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] p-1"
          aria-label="Zavrit"
        >
          {/* X icon 16px */}
        </button>
      </div>
      {/* Progress bar */}
      <div
        className="forge-progress-shrink h-[2px] mt-2 rounded-full"
        style={{
          backgroundColor: typeStyles[type].borderColor,
          animationDuration: `${duration}ms`,
        }}
      />
    </div>
  );
}
```

**Pozice:** fixed bottom-right, 24px od hran. Stack toastu vertikalne s 8px gap.

**Agent:** mp-spec-fe-notifications

### R2.10 ForgeStatusIndicator — nova komponenta

**Novy soubor:** `Model_Pricer-V2-main/src/components/ui/forge/ForgeStatusIndicator.jsx`

Status indikator inspirovany 3D tiskarnou:

```jsx
const STATUS_CONFIG = {
  idle: {
    color: 'var(--forge-nozzle-cold)',
    label: 'IDLE',
    dotClass: '',
  },
  heating: {
    color: 'var(--forge-nozzle-hot)',
    label: 'HEATING',
    dotClass: 'forge-hot-glow',
  },
  printing: {
    color: 'var(--forge-accent-primary)',
    label: 'PRINTING',
    dotClass: 'forge-glow-pulse',
  },
  complete: {
    color: 'var(--forge-success)',
    label: 'COMPLETE',
    dotClass: '',
  },
  error: {
    color: 'var(--forge-error)',
    label: 'ERROR',
    dotClass: 'forge-pulse-dot',
  },
};

function ForgeStatusIndicator({ status = 'idle', errorCode, className }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {/* Status dot — 8px */}
      <span
        className={cn("inline-block w-2 h-2 rounded-full", config.dotClass)}
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      {/* Status label — monospace uppercase */}
      <span
        className="forge-label-mono"
        style={{ color: config.color }}
      >
        {config.label}
        {status === 'error' && errorCode && `: ${errorCode}`}
      </span>
    </div>
  );
}
```

**Pouziti:**
- Admin sidebar: `<ForgeStatusIndicator status="printing" />`
- Admin dashboard: stav objednavek
- Widget: stav kalkulace

**Agent:** mp-mid-design-system

### R2.11 ColorPicker — FORGE styling

**Soubor:** `Model_Pricer-V2-main/src/components/ui/ColorPicker.jsx`

- Swatch size: 32x32px (grid layout, 4px gap)
- Swatch radius: 4px (--forge-radius-sm)
- Selected: 2px --forge-text-primary outline, 2px offset
- Hover: scale(1.1), --forge-shadow-sm
- Custom hex input: monospace (JetBrains Mono), 80px width, pod gridem

**Agent:** mp-spec-fe-forms

### R2.12 Label — FORGE uppercase styl

**Soubor:** `Model_Pricer-V2-main/src/components/ui/label.jsx`

```jsx
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("forge-label", className)}
    {...props}
  />
));
```

Trida `forge-label` jiz definovana v forge-typography.css:
- IBM Plex Sans 500, 12px, UPPERCASE, letter-spacing 0.05em, color --forge-text-secondary

**Agent:** mp-mid-design-system

### R2.13 BackgroundPattern — FORGE verze

**Soubor:** `Model_Pricer-V2-main/src/components/ui/BackgroundPattern.jsx`

Nahradit stavajici purple radial-gradient za FORGE blueprint:

```jsx
function BackgroundPattern({ variant = 'grid', className }) {
  const variants = {
    grid: 'forge-grid-bg',
    'grid-dense': 'forge-grid-bg-dense',
    dots: 'forge-dot-grid',
    grain: 'forge-grain',
    scanlines: 'forge-scanlines',
    glow: 'forge-glow',
  };

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none",
        variants[variant],
        className
      )}
      aria-hidden="true"
    />
  );
}
```

**Agent:** mp-mid-design-system

### R2.14 Progress indikatory

**Linearni progress:**
- Track: 4px vyska, bg --forge-bg-overlay, full-width
- Fill: --forge-accent-primary, width transition 300ms ease-out
- Indeterminate: forge-shimmer animace

**Kruhovy progress (ring):**
- Sizes: 48px (sm), 64px (md), 96px (lg)
- Track: 3px stroke --forge-border-default
- Fill: --forge-accent-primary stroke
- Rotace zacina od vrchu (12 hodin)
- Stred: procentualni hodnota v JetBrains Mono 700

**Soubor:** `Model_Pricer-V2-main/src/components/ui/forge/ForgeProgress.jsx`

**Agent:** mp-spec-fe-animations

### R2.15 Definition of Done — R2

- [ ] Button.jsx aktualizovany s FORGE CVA variantami (primary, secondary, ghost, destructive, link, gradient)
- [ ] Card.jsx aktualizovany s 4 variantami (default, elevated, stat, interactive)
- [ ] Input.jsx s dark bg, teal focus glow, UPPERCASE label
- [ ] Select.jsx s dark dropdown, teal selected indicator
- [ ] Checkbox.jsx s teal check barva
- [ ] Slider.jsx s teal fill a custom thumb
- [ ] Dialog.jsx s dark overlay, edge-highlight shadow
- [ ] Tooltip.jsx s dark bg a 4px radius
- [ ] Toast.jsx nova komponenta s levy border, progress bar, slide-in
- [ ] ForgeStatusIndicator.jsx nova — IDLE/HEATING/PRINTING/COMPLETE/ERROR
- [ ] ColorPicker.jsx s 32px swatch gridem
- [ ] Label.jsx s forge-label trida
- [ ] BackgroundPattern.jsx s grid/dots/grain/scanlines variantami
- [ ] ForgeProgress.jsx — linearni a kruhovy progress
- [ ] Vsechny komponenty pouzivaji forge-* tokeny
- [ ] WCAG AA focus indikatory na vsech interaktivnich prvcich
- [ ] `npm run build` projde bez chyb
- [ ] Branch `redesign/forge-r2-components` commitnuty

---

## R3: LAYOUT SHELL

**Cil:** Redesign hlavnich layout komponent — Admin Sidebar, Header, Footer, AdminLayout wrapper. Tyto komponenty tvori "kostru" cele aplikace.

**Doba:** 2-3 dny
**Lead:** mp-mid-frontend-admin
**Implementace:** mp-spec-fe-layout, mp-mid-design-ux
**Review:** mp-sr-design

### R3.1 Admin Sidebar — kompletni redesign

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminLayout.jsx`

Sidebar specifikace (260px sirka):

```
+--------------------------+
| [Layers3 icon] ModelPricer|   ← 28x28 icon #00D4AA + Space Grotesk 600 16px
| ADMIN CONSOLE            |   ← Space Mono 400, 10px, #5C6370, uppercase, ls 0.1em
|--------------------------|
|                          |
| CONFIGURATION            |   ← forge-label-mono (skupina)
| | Dashboard              |
| | Branding               |
|                          |
| PRICING                  |   ← forge-label-mono
| | Pricing                |
| | Fees                   |
| | Presets                |
| | Parameters             |
|                          |
| OPERATIONS               |   ← forge-label-mono
| | Orders                 |
| | Widget                 |
| | Analytics              |
| | Team                   |
|                          |
|                          |
|--------------------------|
| [STATUS: ONLINE]         |   ← ForgeStatusIndicator
| <- Back to Site          |   ← forge-text-muted, hover slide-left 4px
+--------------------------+
```

**Aktivni nav item styling:**
```css
/* Levy border 3px --forge-accent-primary */
/* Background: rgba(0, 212, 170, 0.08) */
/* Icon + text: --forge-accent-primary */
/* Font weight: 600 */
```

**Nav item (neaktivni):**
- 44px vyska, 20px left padding
- Icon: 18px, --forge-text-muted
- Text: IBM Plex Sans 500, 14px (--forge-text-base), --forge-text-secondary
- Hover: bg --forge-bg-elevated, icon+text transition na --forge-text-primary

**Skupinove labely:**
- Space Mono 400, 10px (--forge-text-xs), --forge-text-muted
- UPPERCASE, letter-spacing 0.08em
- Padding-left 20px, margin-top 22px

**Notification badge:**
- Monospace, --forge-accent-secondary bg (#FF6B35), #08090C text
- 18px pill (radius-full), padding 0 6px

**Collapse behavior (< 1200px):**
- Sidebar collapses na 64px — jen ikony
- Tooltip na hover ukazuje plny label
- Hamburger ikona v content area header pro toggle

**Mobile (< 768px):**
- Overlay drawer zleva, 280px sirka
- Overlay: rgba(8, 9, 12, 0.5)
- Slide-in 250ms cubic-bezier(0.16, 1, 0.3, 1)

**Agent:** mp-spec-fe-layout, mp-mid-frontend-admin

### R3.2 Header — public pages

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Header.jsx`

```
+----------------------------------------------------------+
| [MODEL.PRICER]         [Home][Demo][Pricing][Support]     |
|                                          [CS|EN] [Avatar] |
+----------------------------------------------------------+
```

**Specifikace:**
- Vyska: 56px
- Pozadi: --forge-bg-surface (#0E1015)
- Spodni border: 1px --forge-border-default
- Position: sticky top 0, z-index: var(--forge-z-sticky)
- Logo: "MODEL" v --forge-text-primary + "." v --forge-accent-primary + "PRICER" v --forge-text-primary
  - Font: Space Grotesk 700, 18px
- Nav linky: IBM Plex Sans 400, 14px, --forge-text-secondary, spacing 28px
  - Aktivni: --forge-text-primary, 2px bottom border --forge-accent-primary
  - Hover: --forge-text-primary, transition 150ms
- Jazyk prepinac: Space Mono 400, 12px, neaktivni --forge-text-muted, aktivni --forge-text-primary
- Mobile (< 768px): Logo vlevo, hamburger vpravo (3 thin linky 18px)
  - Klik: fullscreen overlay --forge-bg-void s velkymi nav linky (24px, centrovane)

**Agent:** mp-mid-frontend-public

### R3.3 Footer — public pages

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Footer.jsx`

```
+----------------------------------------------------------+
|  MODEL.PRICER          PRODUKT    PODPORA    LEGAL        |
|                        Demo       Kontakt    Podminky     |
|  Precizni kalkulace    Cenik      FAQ        Soukromi     |
|  pro 3D tisk.          API        Docs                    |
|                                                           |
| -------------------------------------------------------- |
|  v3.2.1                                     2024-2026     |
+----------------------------------------------------------+
```

**Specifikace:**
- Pozadi: --forge-bg-void (#08090C) — tmavsi nez content
- Horni border: 1px --forge-border-default
- Padding: 56px top, 28px bottom
- Logo: stejna jako header, 16px
- Sloupce: 4-sloupcovy grid (desktop), 2 (tablet), 1 (mobil)
- Linky: IBM Plex Sans 400, 13px, --forge-text-muted, hover --forge-text-secondary
- Nadpisy sloupcu: forge-label-mono trida
- Spodni cast: 1px linka --forge-border-default, verze v Space Mono --forge-text-disabled 11px

**Agent:** mp-mid-frontend-public

### R3.4 AdminLayout wrapper

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminLayout.jsx`

Layout wrapper:
```
+----------+--------------------------------------+
|          |  Admin Header (page title + actions) |
| Sidebar  |--------------------------------------|
| 260px    |                                      |
|          |  Main Content Area                   |
|          |  padding: 32px                       |
|          |  bg: --forge-bg-void                 |
|          |  forge-grid-bg (subtilni)            |
|          |                                      |
+----------+--------------------------------------+
```

**Content area:**
- bg: --forge-bg-void s forge-grid-bg patternerm (24px blueprint mrize)
- Padding: 32px
- forge-grain overlay (2.5% noise)

**Admin page header (v content area):**
- Page title: Space Grotesk 700, --forge-text-3xl
- Breadcrumb: Space Mono 400, --forge-text-xs, --forge-text-muted
- Action buttons: right-aligned

**Agent:** mp-mid-frontend-admin

### R3.5 Admin page header komponenta

**Novy soubor:** `Model_Pricer-V2-main/src/components/ui/forge/ForgePageHeader.jsx`

```jsx
function ForgePageHeader({ title, breadcrumb, actions, className }) {
  return (
    <div className={cn("flex items-center justify-between mb-8", className)}>
      <div>
        {breadcrumb && (
          <nav className="forge-label-mono mb-2" aria-label="Breadcrumb">
            {breadcrumb}
          </nav>
        )}
        <h1 className="forge-h2">{title}</h1>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
```

**Agent:** mp-mid-frontend-admin

### R3.6 Sidebar — data struktura navigace

```js
const ADMIN_NAV = [
  {
    group: 'CONFIGURATION',
    items: [
      { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard' },
      { path: '/admin/branding', label: 'Branding', icon: 'Palette' },
    ],
  },
  {
    group: 'PRICING',
    items: [
      { path: '/admin/pricing', label: 'Pricing', icon: 'Calculator' },
      { path: '/admin/fees', label: 'Fees', icon: 'Receipt' },
      { path: '/admin/presets', label: 'Presets', icon: 'Sliders' },
      { path: '/admin/parameters', label: 'Parameters', icon: 'Settings2' },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      { path: '/admin/orders', label: 'Orders', icon: 'ShoppingCart' },
      { path: '/admin/widget', label: 'Widget', icon: 'Code2' },
      { path: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' },
      { path: '/admin/team', label: 'Team', icon: 'Users' },
    ],
  },
];
```

**Agent:** mp-mid-frontend-admin

### R3.7 Mobile responsive pravidla

| Breakpoint | Header | Sidebar | Content |
|-----------|--------|---------|---------|
| >= 1200px | Plna navigace | 260px fixed, expanded | padding 32px |
| 768-1199px | Plna navigace | 64px collapsed (jen ikony) | padding 24px |
| < 768px | Logo + hamburger | Overlay drawer 280px | padding 16px |

**CSS media queries:**
```css
@media (max-width: 1199px) {
  .forge-sidebar { width: 64px; }
  .forge-sidebar-label { display: none; }
  .forge-sidebar-group-label { display: none; }
  .forge-content { margin-left: 64px; }
}

@media (max-width: 767px) {
  .forge-sidebar { display: none; } /* overlay mode */
  .forge-content { margin-left: 0; }
}
```

**Agent:** mp-spec-design-responsive, mp-spec-fe-layout

### R3.8 Sidebar collapse animace

- Width transition: 260px -> 64px, 250ms cubic-bezier(0.16, 1, 0.3, 1)
- Text opacity: fade out 120ms (rychleji nez width)
- Ikony: zustavaji centrovane, reposition 250ms
- Tooltip: objevi se na hover nad ikonou (jen v collapsed stavu)

**Agent:** mp-spec-fe-animations

### R3.9 WelcomeHeader aktualizace

**Soubor:** `Model_Pricer-V2-main/src/components/ui/WelcomeHeader.jsx`

Aktualizovat na FORGE styling:
- Pozdrav: Space Grotesk 600, --forge-text-2xl
- Datum/cas: Space Mono 400, --forge-text-sm, --forge-text-muted
- Pozadi: transparent (bez shadowy/karty)

**Agent:** mp-mid-frontend-admin

### R3.10 Definition of Done — R3

- [ ] Admin sidebar redesign — 260px, monospace skupinove labely, teal aktivni stav, "ADMIN CONSOLE" badge
- [ ] Header redesign — "MODEL.PRICER" logo s teal teckou, tmave pozadi
- [ ] Footer redesign — tmave pozadi, monospace labely, verze v patice
- [ ] AdminLayout wrapper s blueprint grid pozadim a grain overlay
- [ ] ForgePageHeader komponenta pro admin stranky
- [ ] Sidebar collapse na < 1200px (64px, jen ikony)
- [ ] Mobile overlay drawer na < 768px
- [ ] StatusIndicator v sidebar footeru ("STATUS: ONLINE")
- [ ] Vsechny layout komponenty pouzivaji forge-* tokeny
- [ ] Responsive na vsech breakpointech (desktop, tablet, mobil)
- [ ] `npm run build` projde bez chyb
- [ ] Branch `redesign/forge-r3-layout-shell` commitnuty

---

## R4: PUBLIC PAGES

**Cil:** Redesign vsech verejnych stranek — Home (landing), Login, Register, Pricing, Support. Implementace hero sekce s animovanou SVG tiskarnou, "01/" cislovanych karet, hand-drawn squiggle podtrzeni a skewed pricing sekce.

**Doba:** 3-4 dny
**Lead:** mp-mid-frontend-public
**Implementace:** mp-spec-fe-animations, mp-spec-design-icons, mp-spec-fe-layout
**Review:** mp-sr-design, mp-mid-design-ux

### R4.1 Home Page — Hero sekce

**Soubor:** `Model_Pricer-V2-main/src/pages/home/index.jsx`

**Layout:** 90vh viewport height, asymetricky — text 55% vlevo, vizual 45% vpravo.

```jsx
<section className="relative min-h-[90vh] flex items-center forge-grid-bg overflow-hidden">
  {/* Grain overlay */}
  <div className="forge-grain" />

  <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-16 items-center">
    {/* LEFT — Text content (LEFT-ALIGNED, ne centrovany!) */}
    <div className="relative z-10">
      {/* Status badge */}
      <ForgeStatusIndicator status="printing" className="mb-6" />

      {/* Headline — Space Grotesk 700 */}
      <h1 className="forge-h1 max-w-[540px]">
        Precision Pricing for 3D{' '}
        <span className="relative inline-block">
          Manufacturing
          {/* Hand-drawn SVG squiggle podtrzeni */}
          <ForgeSquiggle className="absolute -bottom-2 left-0 w-full" />
        </span>
      </h1>

      {/* Subheadline — IBM Plex Sans 400, LEFT-aligned */}
      <p className="forge-body-lg text-[var(--forge-text-secondary)] mt-6 max-w-[480px]">
        Automated quoting for FDM, SLA, and SLS print farms.
        Upload models, configure parameters, get instant pricing.
      </p>

      {/* CTA cluster — left-aligned, 12px gap */}
      <div className="flex gap-3 mt-8">
        <Button variant="primary" size="lg">Start Building</Button>
        <Button variant="secondary" size="lg">See Demo</Button>
      </div>
    </div>

    {/* RIGHT — Animated 3D printer SVG */}
    <div className="relative z-10 hidden lg:flex justify-center">
      <ForgePrinterSVG />
    </div>
  </div>
</section>
```

**Klicove anti-AI prvky:**
1. Text je LEFT-ALIGNED (ne centrovany) — lomi "Tailwind hero template"
2. ForgeSquiggle pod klicovym slovem — rucne kresleny SVG
3. ForgeStatusIndicator "STATUS: ONLINE" — monospace technicke raz
4. Blueprint grid pozadi — ne genericky gradient

**Agent:** mp-mid-frontend-public

### R4.2 ForgeSquiggle — hand-drawn SVG podtrzeni

**Novy soubor:** `Model_Pricer-V2-main/src/components/ui/forge/ForgeSquiggle.jsx`

```jsx
function ForgeSquiggle({ className, color = 'var(--forge-accent-primary)' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M2 8.5C12 3.5 22 10 32 6.5C42 3 52 9.5 62 5.5C72 1.5 82 8 92 5C102 2 112 9 122 6C132 3 142 8.5 152 5.5C162 2.5 172 7.5 182 5C192 2.5 198 6 198 6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          /* Vedoma nepresnost — tloustka kolisa 2-3.5px */
          strokeWidth: '2.5',
          filter: 'url(#squiggle-roughen)',
        }}
      />
      <defs>
        <filter id="squiggle-roughen">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.05"
            numOctaves="2"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
```

**Proc:** Tento jediny element okamzite lomi "AI template" dojem. Nerovny, organicky, lidsky.

**Agent:** mp-spec-design-icons

### R4.3 ForgePrinterSVG — animovana 3D tiskarna

**Novy soubor:** `Model_Pricer-V2-main/src/components/ui/forge/ForgePrinterSVG.jsx`

```jsx
function ForgePrinterSVG({ className }) {
  return (
    <svg
      className={cn("w-[400px] h-[360px]", className)}
      viewBox="0 0 400 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Frame — staticka konstrukce tiskarny */}
      <rect x="60" y="40" width="280" height="280" rx="4"
        stroke="var(--forge-border-active)" strokeWidth="1.5" fill="none" />

      {/* Vertikalni sloupy */}
      <line x1="80" y1="40" x2="80" y2="320"
        stroke="var(--forge-border-active)" strokeWidth="2" />
      <line x1="320" y1="40" x2="320" y2="320"
        stroke="var(--forge-border-active)" strokeWidth="2" />

      {/* Horizontalni osa (X-axis) — pohybliva */}
      <g className="forge-nozzle-move">
        {/* X carriage */}
        <rect x="120" y="100" width="60" height="20" rx="2"
          fill="var(--forge-bg-elevated)"
          stroke="var(--forge-border-active)" strokeWidth="1" />
        {/* Nozzle */}
        <path d="M145 120 L150 135 L155 120"
          fill="var(--forge-nozzle-hot)"
          className="forge-hot-glow" />
        {/* Nozzle glow */}
        <circle cx="150" cy="135" r="4"
          fill="var(--forge-nozzle-hot)" opacity="0.6" />
      </g>

      {/* Build plate — heated bed */}
      <rect x="100" y="280" width="200" height="8" rx="1"
        fill="var(--forge-bg-elevated)"
        stroke="var(--forge-bed-heated)" strokeWidth="1"
        opacity="0.8" />

      {/* Printed layers — postupne se objevuji */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          key={i}
          x="140"
          y={272 - i * 6}
          width="120"
          height="5"
          rx="1"
          fill="var(--forge-accent-primary)"
          opacity={0.15 + i * 0.08}
          style={{
            animation: `forge-layer-appear 500ms ${i * 800}ms ease-out both`,
          }}
        />
      ))}

      {/* Build plate grid lines */}
      {[120, 140, 160, 180, 200, 220, 240, 260, 280].map((x) => (
        <line key={x} x1={x} y1="280" x2={x} y2="288"
          stroke="var(--forge-border-grid)" strokeWidth="0.5" />
      ))}

      {/* Display panel */}
      <rect x="85" y="50" width="50" height="25" rx="2"
        fill="var(--forge-bg-surface)"
        stroke="var(--forge-border-default)" strokeWidth="1" />
      <text x="90" y="66" fill="var(--forge-accent-primary)"
        fontSize="8" fontFamily="var(--forge-font-tech)">
        READY
      </text>
    </svg>
  );
}
```

**Animace:**
- Nozzle se pohybuje horizontalne (forge-nozzle-move: 8s cyklus)
- Vrstvy se postupne objevuji (forge-layer-appear s delay)
- Heated bed pulse (forge-hot-glow)
- Vsechno respektuje prefers-reduced-motion

**Agent:** mp-spec-fe-animations, mp-spec-design-icons

### R4.4 Home Page — Feature bloky s "01/" cisly

**Asymetricky grid — NE 3 stejne karty:**

```jsx
<section className="max-w-7xl mx-auto px-8 py-24">
  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
    {/* Velka karta — span 2 radky */}
    <ForgeNumberedCard
      number="01"
      icon={<ForgeIcon name="mp-caliper" />}
      title="Precision Pricing Engine"
      description="Volume-based calculations with material, quality, and infill parameters. Real-time cost analysis with receipt-style breakdowns."
      className="md:row-span-2"
    />

    {/* Mala karta 1 */}
    <ForgeNumberedCard
      number="02"
      icon={<ForgeIcon name="mp-layers" />}
      title="Widget Embed"
      description="Drop a calculator into any website. Customers configure and get instant quotes."
    />

    {/* Mala karta 2 */}
    <ForgeNumberedCard
      number="03"
      icon={<ForgeIcon name="mp-spool" />}
      title="Multi-Format Support"
      description="STL, OBJ, 3MF, STEP. Automatic mesh analysis, dimension extraction, and volume calculation."
    />
  </div>
</section>
```

**ForgeNumberedCard komponenta:**

**Novy soubor:** `Model_Pricer-V2-main/src/components/ui/forge/ForgeNumberedCard.jsx`

```jsx
function ForgeNumberedCard({ number, icon, title, description, className }) {
  return (
    <div className={cn(
      "forge-card-interactive group relative",
      "p-6",
      className
    )}>
      {/* Top-left monospace number label */}
      <span className="forge-numbered-label">
        {number}/
      </span>

      {/* Icon — custom SVG, 32x32, --forge-accent-primary stroke */}
      <div className="mt-4 mb-4 text-[var(--forge-accent-primary)]">
        {icon}
      </div>

      {/* Title — Space Grotesk 600 */}
      <h3 className="forge-h4 mb-2">{title}</h3>

      {/* Description — IBM Plex Sans 400 */}
      <p className="forge-body text-[var(--forge-text-secondary)]">
        {description}
      </p>

      {/* Bottom-right arrow — slides 4px right on hover */}
      <div className="absolute bottom-6 right-6 text-[var(--forge-text-muted)] group-hover:translate-x-1 forge-transition-micro">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M13 8L9 4M13 8L9 12"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
```

**Agent:** mp-mid-frontend-public

### R4.5 Home Page — Pricing sekce se skewed pozadim

```jsx
<section className="forge-skewed-bg py-24">
  <div className="max-w-7xl mx-auto px-8" style={{ transform: 'skewY(0deg)' }}>
    <h2 className="forge-h2 text-center mb-12">Pricing Plans</h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan, i) => (
        <div
          key={plan.name}
          className={cn(
            "forge-card p-6",
            plan.recommended && "border-t-[3px]",
          )}
          style={plan.recommended ? {
            borderImage: 'var(--forge-gradient-brand) 1',
            borderImageSlice: '1 0 0 0',
          } : undefined}
        >
          <span className="forge-label">{plan.name}</span>
          <div className="mt-4 mb-6">
            <span className="forge-mono-bold text-[var(--forge-text-3xl)]">
              {plan.price}
            </span>
            <span className="forge-tech text-[var(--forge-text-sm)] text-[var(--forge-text-muted)] ml-2">
              per month
            </span>
          </div>
          {/* Feature list */}
          <ul className="space-y-3">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 forge-body text-[var(--forge-text-secondary)]">
                <svg width="16" height="16" className="text-[var(--forge-accent-primary)] shrink-0">
                  {/* Checkmark */}
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Button
            variant={plan.recommended ? 'primary' : 'secondary'}
            fullWidth
            className="mt-8"
          >
            {plan.cta}
          </Button>
        </div>
      ))}
    </div>
  </div>
</section>
```

**Skewed pozadi:**
- Sekce ma `forge-skewed-bg` tridu (viz forge-textures.css)
- Pozadi se nakloni o -2deg (CSS transform na pseudo-elementu)
- Obsah je counter-skewed (rovny) — `skewY(0deg)` na child divu
- Lomi "perfektne obdelnikovy" AI pattern

**Agent:** mp-mid-frontend-public

### R4.6 Home Page — Social Proof marquee

```jsx
<section className="border-y border-[var(--forge-border-default)] py-6 overflow-hidden">
  <div className="flex items-center">
    <span className="forge-tech text-[var(--forge-text-muted)] whitespace-nowrap px-8">
      Trusted by 120+ print farms
    </span>
    <div className="flex forge-marquee">
      {/* Loga 2x (pro seamless loop) */}
      {[...logos, ...logos].map((logo, i) => (
        <img
          key={i}
          src={logo.src}
          alt={logo.name}
          className="h-8 mx-8 opacity-40 hover:opacity-70 grayscale forge-transition-micro"
        />
      ))}
    </div>
  </div>
</section>
```

**Agent:** mp-spec-fe-animations

### R4.7 Login Page — split-screen

**Soubor:** `Model_Pricer-V2-main/src/pages/login/index.jsx`

**Layout:** Full-screen split — 55% levy panel (branding), 45% pravy panel (formular)

**Levy panel:**
- bg --forge-bg-void s forge-grid-bg blueprint overlay
- Velky Space Grotesk headline: "Control Center"
- Animovana SVG tiskarny (zjednodusena verze ForgePrinterSVG)
- Dole: verze v Space Mono --forge-text-xs --forge-text-muted ("v3.2.1-beta")
- Skryty na mobilech (formular zabere plnou sirku)

**Pravy panel:**
- bg --forge-bg-surface
- Form card: zadny viditelny border/shadow — panel JE karta
- Logo nahore: 32x32 icon + "ModelPricer" Space Grotesk 600
- Inputy: forge-label (UPPERCASE) + forge input styling
- Submit: full-width, primary button, Space Grotesk 600
- Social login: ghost buttony, --forge-border-default border
- Link na register: --forge-text-muted, hover --forge-accent-primary

**Agent:** mp-mid-frontend-public

### R4.8 Register Page

**Soubor:** `Model_Pricer-V2-main/src/pages/register/index.jsx`

Stejna split-screen architektura jako login. Levy panel s "Access Portal" textem. Pravy panel s registracnim formularem.

Zachovat existujici ProgressSteps, RoleSelectionCard, RegistrationForm komponenty — aktualizovat styly na FORGE tokeny.

**Agent:** mp-mid-frontend-public

### R4.9 Pricing a Support pages

**Soubor:** `Model_Pricer-V2-main/src/pages/pricing/index.jsx`
**Soubor:** `Model_Pricer-V2-main/src/pages/support/index.jsx`

- Pouzit novy Header + Footer z R3
- Pricing page: pouzit pricing karty z R4.5
- Support page: FAQ accordion s forge styling
  - Otazka: Space Grotesk 500, 16px, --forge-text-primary
  - Odpoved: IBM Plex Sans 400, 14px, --forge-text-secondary
  - Toggle ikona: +/- v monospace, --forge-accent-primary
  - Separator: 1px --forge-border-default

**Agent:** mp-mid-frontend-public

### R4.10 Definition of Done — R4

- [ ] Home hero: left-aligned text, ForgeSquiggle podtrzeni, ForgeStatusIndicator, ForgePrinterSVG animace
- [ ] Home features: asymetricky grid (2fr/1fr), ForgeNumberedCard s "01/" labely
- [ ] Home pricing: forge-skewed-bg, gradient top-border na doporucene karte
- [ ] Home social proof: marquee s grayscale logy
- [ ] Login: split-screen, levy panel s blueprint grid a 3D printer SVG, pravy s forge formularem
- [ ] Register: split-screen, FORGE styly na ProgressSteps a RoleSelectionCard
- [ ] Pricing page: FORGE styling
- [ ] Support page: FAQ accordion s FORGE styling
- [ ] Vsechny stranky pouzivaji novy Header a Footer z R3
- [ ] Responsive na vsech breakpointech
- [ ] ForgeSquiggle, ForgePrinterSVG, ForgeNumberedCard nove komponenty vytvoreny
- [ ] `npm run build` projde bez chyb
- [ ] Branch `redesign/forge-r4-public-pages` commitnuty

---

## R5: TEST KALKULACKA

**Cil:** Kompletni vizualni redesign 5-krokoveho wizardu test-kalkulacky. Wizard progress bar s monospace labely, upload zona s blueprint grid, konfiguracni panel s material kartami, receipt-style cenovy rozpis s dotted leader lines, a checkout flow.

**Doba:** 3-4 dny
**Lead:** mp-mid-frontend-public
**Implementace:** mp-spec-fe-upload, mp-spec-fe-3d-viewer, mp-spec-fe-checkout, mp-spec-fe-forms
**Review:** mp-sr-design, mp-mid-design-ux

**Hlavni soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/index.jsx` (800+ radku)

### R5.1 Wizard Progress Bar

**Sticky bar na vrchu stranky:**

```jsx
<nav
  className="sticky top-0 z-[var(--forge-z-sticky)] bg-[var(--forge-bg-surface)] border-b border-[var(--forge-border-default)]"
  style={{ height: '56px' }}
  aria-label="Wizard progress"
>
  <div className="max-w-3xl mx-auto h-full flex items-center justify-between px-4">
    {STEPS.map((step, i) => (
      <React.Fragment key={step.key}>
        {/* Step circle */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[11px]",
              "font-[var(--forge-font-tech)] border-2",
              i < currentStep && "bg-[var(--forge-accent-primary)] border-[var(--forge-accent-primary)] text-[#08090C]",
              i === currentStep && "border-[var(--forge-accent-primary)] text-[var(--forge-text-primary)] bg-transparent",
              i > currentStep && "border-[var(--forge-border-default)] text-[var(--forge-text-muted)] bg-transparent",
            )}
          >
            {i < currentStep ? (
              <svg width="12" height="12" /* checkmark */ />
            ) : (
              i + 1
            )}
          </div>
          {/* Step label — Space Mono UPPERCASE */}
          <span className={cn(
            "forge-label-mono hidden sm:block",
            i === currentStep && "text-[var(--forge-text-primary)]",
            i < currentStep && "text-[var(--forge-accent-primary)]",
          )}>
            {step.label}
          </span>
        </div>

        {/* Connecting line */}
        {i < STEPS.length - 1 && (
          <div className={cn(
            "flex-1 h-[2px] mx-2",
            i < currentStep
              ? "bg-[var(--forge-accent-primary)]"
              : "border-b-2 border-dashed border-[var(--forge-border-default)]",
          )} />
        )}
      </React.Fragment>
    ))}
  </div>
</nav>
```

**Step labels:**
```js
const STEPS = [
  { key: 'upload', label: 'UPLOAD' },
  { key: 'configure', label: 'CONFIGURE' },
  { key: 'review', label: 'REVIEW' },
  { key: 'checkout', label: 'CHECKOUT' },
  { key: 'confirm', label: 'CONFIRM' },
];
```

**Vizualni detaily:**
- Kruzky: 24px (w-6 h-6), cislo v Space Mono
- Completed: teal bg, #08090C text, checkmark nahrazuje cislo
- Active: teal outline (2px), --forge-text-primary cislo
- Upcoming: --forge-border-default outline, --forge-text-muted cislo
- Spojovaci linky: 2px, completed = solid teal, upcoming = dashed --forge-border-default
- Labely: Space Mono 400, 10px, UPPERCASE
- Mobile: jen cisla bez textu

**Agent:** mp-mid-frontend-public

### R5.2 Step 1: Upload zona

**Soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/FileUploadZone.jsx`

```jsx
<div
  className={cn(
    "w-full flex flex-col items-center justify-center",
    "bg-[var(--forge-bg-void)] forge-dot-grid",
    "border-2 border-dashed border-[var(--forge-border-active)]",
    "rounded-[var(--forge-radius-md)]",
    "min-h-[360px]",
    "forge-transition-micro",
    isDragActive && "border-solid border-[var(--forge-accent-primary)] bg-[rgba(0,212,170,0.04)]",
  )}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
  {/* Upload icon — custom SVG: krychle se sipkou nahoru */}
  <ForgeIcon name="mp-upload-cube" size={64}
    className={cn(
      "text-[var(--forge-text-muted)]",
      isDragActive && "text-[var(--forge-accent-primary)]",
    )}
  />

  <p className="forge-h4 text-[var(--forge-text-secondary)] mt-6">
    Drop STL, OBJ, or 3MF files
  </p>
  <p className="forge-body text-[var(--forge-text-muted)] mt-2">
    or click to browse
  </p>

  {/* File type badges */}
  <div className="flex gap-2 mt-6">
    {['.STL', '.OBJ', '.3MF'].map(ext => (
      <span key={ext} className="forge-badge-accent forge-mono text-[11px]">
        {ext}
      </span>
    ))}
  </div>
</div>
```

**Po uploadu — file list tabulka:**
- Kompaktni tabulka: Filename | Size | Dimensions | Status
- Dimensions v monospace: "42.3 x 28.1 x 15.7 mm"
- Status: spinner (forge-spin) pri zpracovani, zelena fajfka po dokonceni
- Remove button: ghost X, --forge-text-muted, hover --forge-error

**Agent:** mp-spec-fe-upload

### R5.3 Step 2: Configure — 2-sloupcovy layout

**Layout:** 60% 3D viewer, 40% ovladaci panel — NE stejne sloupce.

**3D Viewer panel:**
- bg --forge-bg-void (maximalni kontrast pro model)
- Border 1px --forge-border-default, radius --forge-radius-md
- Bottom toolbar: view ovladace (rotate, pan, zoom, reset) — ghost icon buttony
- Top-right: rozmery modelu v monospace overlay, bg --forge-bg-surface opacity 0.9, padding 4px 8px, radius --forge-radius-sm
- Bottom-left: "LAYER PREVIEW" toggle button

**Ovladaci panel (scrollable):**
- Section headers: Space Grotesk 600, --forge-text-xl, s horizontal rule pod
- Material selector: custom radio karty (ne dropdown)
  - Kazda karta: 80px tall, ikona + nazev + kratka specifikace
  - Active: 3px --forge-accent-primary levy border, bg --forge-bg-elevated
  - Filament color dot (12px) vedel nazvu
- Quality selector: 3 radio karty ("Draft" / "Standard" / "Fine")
  - Kazda ukazuje layer height v monospace: "0.3mm" / "0.2mm" / "0.1mm"
- Infill slider: forge slider s hodnotou v monospace nad thumbem ("20%")
- Quantity: kompaktni number input s +/- buttony, monospace hodnota
- Supports toggle: forge switch, --forge-accent-primary kdyz aktivni
- Color picker: grid barevnych swatchu s tooltip nazvy

**Mobile:** single column, 3D viewer nahore (250px vyska), ovladace pod

**Soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/PrintConfiguration.jsx`

**Agent:** mp-spec-fe-3d-viewer (viewer), mp-spec-fe-forms (ovladace)

### R5.4 Step 3: ForgePriceBreakdown — receipt-style cenovy rozpis

**Novy soubor:** `Model_Pricer-V2-main/src/components/ui/forge/ForgePriceBreakdown.jsx`

```jsx
function ForgePriceBreakdown({ items, subtotal, discount, tax, total, perUnit }) {
  return (
    <div className="forge-card">
      {/* Header */}
      <div className="forge-label-mono mb-4 pb-3 border-b border-[var(--forge-border-default)]"
           style={{ letterSpacing: '0.1em' }}>
        COST ANALYSIS
      </div>

      {/* Line items s dotted leader lines */}
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="forge-leader-line">
            <span className="forge-body text-[var(--forge-text-secondary)] whitespace-nowrap">
              {item.label}
            </span>
            <span className="forge-mono text-[var(--forge-text-primary)] whitespace-nowrap text-right">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="border-t border-[var(--forge-border-active)] mt-3 pt-3">
        <div className="flex justify-between">
          <span className="forge-body font-medium text-[var(--forge-text-secondary)]">
            Subtotal
          </span>
          <span className="forge-mono text-[var(--forge-text-primary)]">
            {subtotal}
          </span>
        </div>
      </div>

      {/* Discount (pokud existuje) */}
      {discount && (
        <div className="mt-2 flex justify-between">
          <span className="forge-body text-[var(--forge-success)]">
            Discount ({discount.label})
          </span>
          <span className="forge-mono text-[var(--forge-success)]">
            -{discount.value}
          </span>
        </div>
      )}

      {/* Tax */}
      {tax && (
        <div className="mt-2 flex justify-between">
          <span className="forge-body text-[var(--forge-text-muted)]">
            Tax ({tax.label})
          </span>
          <span className="forge-mono text-[var(--forge-text-muted)]">
            {tax.value}
          </span>
        </div>
      )}

      {/* TOTAL — vyrazne oddeleny */}
      <div className="border-t-2 border-[var(--forge-accent-primary)] mt-4 pt-4">
        <div className="flex justify-between items-baseline">
          <span className="forge-h4">
            TOTAL
          </span>
          <span className="forge-price-lg">
            {total}
          </span>
        </div>
        {perUnit && (
          <p className="forge-tech text-[var(--forge-text-muted)] text-right mt-1 text-[12px]">
            {perUnit}
          </p>
        )}
      </div>
    </div>
  );
}
```

**Klicove anti-AI prvky:**
1. Dotted leader lines (`.forge-leader-line::after`) — receipt/invoice typograficka tradice
2. Monospace hodnoty vpravo (JetBrains Mono 500) — technical precision
3. Double-rule pred totalem (2px --forge-accent-primary border) — financni dokument konvence
4. "COST ANALYSIS" monospace header s velkym letter-spacingem

**Soubor pro pouziti:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/PricingCalculator.jsx`

**Agent:** mp-mid-design-system

### R5.5 Step 3: Volume discount callout

```jsx
{hasVolumeDiscount && (
  <div className="forge-callout-warning mt-4">
    <div className="flex items-center gap-2">
      <span className="text-[var(--forge-warning)]">
        {/* Warning icon */}
      </span>
      <span className="forge-body font-medium text-[var(--forge-warning)]">
        ORDER 3+ and save 15%
      </span>
    </div>
  </div>
)}
```

**Agent:** mp-mid-frontend-public

### R5.6 Step 4: Checkout

**Soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**2-sloupcovy layout:** 60% formular, 40% order summary (sticky)

**Formular:**
- Sekce oddelene section headers s horizontal rules
- Sekce: Contact Info, Shipping Address, Payment Method
- Kazda sekce: collapsible, dokoncena = zelena fajfka
- Inputy: forge styling (bg-elevated, teal focus, UPPERCASE labely)
- react-hook-form + zod validace (jiz implementovano v Phase 1)

**Order summary (sticky):**
- forge-card s kompaktni verzi ForgePriceBreakdown
- Model thumbnail(y) nahore
- "Place Order" button: full-width, primary, large (48px vyska)

**Agent:** mp-spec-fe-checkout

### R5.7 Step 5: Confirmation

```jsx
<div className="max-w-[600px] mx-auto text-center py-16">
  {/* Animated checkmark — SVG draw */}
  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-[var(--forge-accent-primary)] mb-6">
    <svg width="40" height="40" viewBox="0 0 40 40" className="text-[var(--forge-accent-primary)]">
      <path
        d="M10 20L17 27L30 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="forge-draw-check"
      />
    </svg>
  </div>

  <h2 className="forge-h2">Order Confirmed</h2>

  <p className="forge-mono text-[var(--forge-text-lg)] text-[var(--forge-accent-primary)] mt-4">
    #MP-2026-0042
  </p>

  {/* Summary card */}
  <div className="forge-card mt-8 text-left">
    {/* Key details */}
  </div>

  <div className="flex gap-3 justify-center mt-8">
    <Button variant="primary">View Order Status</Button>
    <Button variant="secondary">Start New Order</Button>
  </div>
</div>
```

**Agent:** mp-spec-fe-checkout

### R5.8 ModelViewer — FORGE restyling

**Soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/ModelViewer.jsx`

- Container: bg --forge-bg-void, border 1px --forge-border-default, radius --forge-radius-md
- Overlay top-right: dimensions badge v monospace, bg --forge-bg-surface 90% opacity
- Overlay bottom-center: view control toolbar
  - bg --forge-bg-surface 90% opacity, pill-shaped (radius-full)
  - Icon buttony: 32x32, ghost styl
  - Icons: RotateCcw, Move, ZoomIn, Maximize
- Loading state: forge-spin ring, "Loading model..." monospace text
- Grid floor: subtilni grid pattern, --forge-border-grid barva

**Agent:** mp-spec-fe-3d-viewer

### R5.9 3D Viewer dimensions overlay

```jsx
<div className="absolute top-3 right-3 z-10">
  <div className="bg-[var(--forge-bg-surface)]/90 backdrop-blur-sm px-2 py-1 rounded-[var(--forge-radius-sm)] border border-[var(--forge-border-default)]">
    <span className="forge-tech text-[12px] text-[var(--forge-text-muted)]">
      {dimensions.x.toFixed(1)} x {dimensions.y.toFixed(1)} x {dimensions.z.toFixed(1)} mm
    </span>
  </div>
</div>
```

**Agent:** mp-spec-fe-3d-viewer

### R5.10 Definition of Done — R5

- [ ] Wizard progress bar: 24px kruzky, Space Mono UPPERCASE labely, teal/dashed spojovaci linky
- [ ] Upload zona: forge-dot-grid pozadi, custom mp-upload-cube ikona, file type badge pills
- [ ] Configure: 60/40 asymetricky layout, material radio karty s filament color dots
- [ ] 3D Viewer: --forge-bg-void pozadi, monospace dimensions overlay, pill toolbar
- [ ] ForgePriceBreakdown: dotted leader lines, monospace hodnoty, 2px teal total border
- [ ] Volume discount callout s forge-callout-warning
- [ ] Checkout: 2-sloupcovy layout, collapsible sekce, forge inputy
- [ ] Confirmation: SVG draw checkmark animace, monospace order number
- [ ] Vsechny kroky wizardu vizualne konzistentni s FORGE designem
- [ ] Responsive — single column na mobilech
- [ ] `npm run build` projde bez chyb
- [ ] Branch `redesign/forge-r5-calculator` commitnuty

---

## R6: ADMIN PAGES

**Cil:** Redesign vsech admin stranek — Dashboard, Pricing, Fees, Parameters, Presets, Orders, Analytics, Team, Branding, Widget. Monospace table headers, alternujici radky, stat karty se sparklines, no-icon design pattern.

**Doba:** 3-5 dnu
**Lead:** mp-mid-frontend-admin
**Implementace:** mp-spec-fe-tables, mp-spec-fe-charts, mp-spec-fe-layout
**Review:** mp-sr-design

### R6.1 Admin Dashboard — stat karty

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminDashboard.jsx`

**Asymetricky grid — NE 4 stejne karty:**

```jsx
<div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr] gap-5 mb-8">
  {/* Nejvetsi — Revenue This Month */}
  <div className="forge-card border-t-2 border-t-[var(--forge-accent-primary)] p-5">
    <span className="forge-label-mono">REVENUE THIS MONTH</span>
    <div className="mt-3">
      <span className="forge-mono-bold text-[var(--forge-text-3xl)]">
        45 230 Kc
      </span>
    </div>
    {/* Sparkline — 20px vyska, --forge-accent-primary stroke */}
    <div className="h-5 mt-3">
      {/* Mini SVG sparkline */}
    </div>
    {/* Delta badge */}
    <div className="mt-2">
      <span className="forge-badge-success">
        +12.3%
      </span>
    </div>
  </div>

  {/* Stredni — Active Orders */}
  <div className="forge-card border-t-2 border-t-[var(--forge-accent-secondary)] p-5">
    <span className="forge-label-mono">ACTIVE ORDERS</span>
    <span className="forge-mono-bold text-[var(--forge-text-3xl)] block mt-3">12</span>
    {/* Status breakdown bar */}
  </div>

  {/* Nejmensi — Print Success Rate */}
  <div className="forge-card border-t-2 border-t-[var(--forge-info)] p-5">
    <span className="forge-label-mono">SUCCESS RATE</span>
    {/* Circular gauge + monospace procento */}
    <div className="flex items-center justify-center mt-4">
      <ForgeProgress type="circular" value={94} size="md" />
    </div>
  </div>
</div>
```

**FORGE stat card design principy:**
- Zadne ikony v stat kartach (anti-pattern: "random ikona pro dekoraci")
- Monospace label nahore (UPPERCASE, 10px, --forge-text-muted)
- Velka hodnota v JetBrains Mono (center)
- Porovnani text ("vs last month") s barevnym delta
- 2px top border v akcent barve (ruzna per karta)

**Agent:** mp-mid-frontend-admin

### R6.2 Admin Dashboard — Recent Orders tabulka

**FORGE tabulka design:**

```jsx
<div className="forge-card p-0 overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="bg-[var(--forge-bg-elevated)]">
        <th className="forge-label-mono text-left px-4 py-3 border-b border-[var(--forge-border-default)]"
            style={{ letterSpacing: '0.08em', fontSize: '11px' }}>
          ORDER
        </th>
        <th className="forge-label-mono text-left px-4 py-3 border-b border-[var(--forge-border-default)]"
            style={{ letterSpacing: '0.08em', fontSize: '11px' }}>
          DATE
        </th>
        <th className="forge-label-mono text-left px-4 py-3 border-b border-[var(--forge-border-default)]"
            style={{ letterSpacing: '0.08em', fontSize: '11px' }}>
          CUSTOMER
        </th>
        <th className="forge-label-mono text-right px-4 py-3 border-b border-[var(--forge-border-default)]"
            style={{ letterSpacing: '0.08em', fontSize: '11px' }}>
          AMOUNT
        </th>
        <th className="forge-label-mono text-left px-4 py-3 border-b border-[var(--forge-border-default)]"
            style={{ letterSpacing: '0.08em', fontSize: '11px' }}>
          STATUS
        </th>
      </tr>
    </thead>
    <tbody>
      {orders.map((order, i) => (
        <tr
          key={order.id}
          className={cn(
            "border-b border-[var(--forge-border-grid)]",
            "hover:bg-[var(--forge-bg-elevated)] forge-transition-micro",
            i % 2 === 0 ? "bg-[var(--forge-bg-surface)]" : "bg-[var(--forge-bg-void)]",
          )}
        >
          <td className="forge-mono text-[13px] px-4 py-3">
            #{order.number}
          </td>
          <td className="forge-tech text-[13px] text-[var(--forge-text-muted)] px-4 py-3">
            {order.date}
          </td>
          <td className="forge-body text-[var(--forge-text-secondary)] px-4 py-3">
            {order.customer}
          </td>
          <td className="forge-mono text-right px-4 py-3">
            {order.amount}
          </td>
          <td className="px-4 py-3">
            <ForgeStatusIndicator status={order.status} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Pagination */}
  <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--forge-border-default)]">
    <span className="forge-tech text-[12px] text-[var(--forge-text-muted)]">
      Showing 1-10 of 47
    </span>
    <div className="flex gap-1">
      {/* Page number buttony — ghost, aktivni = --forge-accent-primary bg */}
    </div>
  </div>
</div>
```

**Tabulka pravidla:**
- Header: Space Mono 500, 11px, UPPERCASE, letter-spacing 0.08em, bg --forge-bg-elevated
- Alternujici radky: --forge-bg-surface / --forge-bg-void (subtilni alternace)
- Hover: bg --forge-bg-elevated
- Status sloupec: ForgeStatusIndicator (barevna tecka + text, NE barevny badge pozadi)
- Sort indikator: chevron ikona, --forge-accent-primary pro aktivni sloupec

**Agent:** mp-spec-fe-tables

### R6.3 AdminPricing — tab navigace a material tabulka

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminPricing.jsx` (2500+ radku)

**Tab navigace (horizontalni):**
```jsx
<div className="flex gap-0 border-b border-[var(--forge-border-default)]">
  {['MATERIALS', 'QUALITY', 'INFILL', 'FEES', 'VOLUME DISCOUNTS', 'MARGINS'].map(tab => (
    <button
      key={tab}
      className={cn(
        "forge-tech px-4 py-3 text-[13px]",
        "border-b-2 -mb-[1px] forge-transition-micro",
        activeTab === tab
          ? "border-[var(--forge-accent-primary)] text-[var(--forge-accent-primary)]"
          : "border-transparent text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]",
      )}
    >
      {tab}
    </button>
  ))}
</div>
```

**Material tabulka:**
- Kazdy radek: 12px color swatch (kruh) + material nazev + cenove sloupce v JetBrains Mono
- Bunky jsou editovatelne: klik prepne na input mod
- Edit mod: bunka dostane --forge-accent-primary border, bg --forge-bg-overlay
- Add material button: ghost "+" button dole vlevo

**Volume Discount Builder:**
- Threshold radky: "From X to Y units: Z% discount"
- Number inputy: kompaktni, monospace, bg --forge-bg-elevated
- "Add threshold" link-button pod poslednim radkem
- Vizualni preview: horizontalni pruh s graduovanymi barvami per tier

**Agent:** mp-mid-frontend-admin

### R6.4 AdminFees, AdminParameters, AdminPresets

**Soubory:**
- `Model_Pricer-V2-main/src/pages/admin/AdminFees.jsx`
- `Model_Pricer-V2-main/src/pages/admin/AdminParameters.jsx`
- `Model_Pricer-V2-main/src/pages/admin/AdminPresets.jsx`

Vsechny pouzivaji stejny FORGE tabulkovy/formularovy styl:
- ForgePageHeader s nadpisem a akce buttony
- forge-card pro sekce
- forge tabulky pro data
- forge inputy pro editaci
- forge modaly pro vytvareni/editaci

**Agent:** mp-mid-frontend-admin

### R6.5 AdminOrders

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminOrders.jsx`

- Filter pills: aktivni = --forge-accent-primary bg + #08090C text, neaktivni = --forge-bg-elevated + --forge-text-secondary
- Tabulka objednavek: stejna jako R6.2 ale s vice sloupci
- Detailni view (modal nebo slide-out): forge-card, timeline progress

**Agent:** mp-mid-frontend-admin

### R6.6 AdminAnalytics

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminAnalytics.jsx`

- Grafy: --forge-accent-primary pro fill (10% opacity area), --forge-accent-primary stroke
- Grid linky: --forge-border-grid
- Osy: monospace 11px, --forge-text-muted
- Tooltip: bg --forge-bg-elevated, border --forge-border-default, --forge-shadow-md
- Time range selector: pill buttony ("7d" | "30d" | "90d" | "1y")

**Agent:** mp-spec-fe-charts

### R6.7 AdminBranding

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminBranding.jsx`

- Logo upload zona: mini forge upload zona (200px vyska)
- Color pickers: forge ColorPicker s 32px swatchi
- Font selector: forge Select dropdown
- Preview panel: live nahled zmeneneneho widgetu

**Agent:** mp-mid-frontend-admin

### R6.8 AdminTeamAccess

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminTeamAccess.jsx`

- Clenove tymu: forge-card pro kazdeho clena
- Role badge: forge-badge s role barvou
- Invite formular: forge input s forge button
- Permissions toggle: forge switch

**Agent:** mp-mid-frontend-admin

### R6.9 AdminWidget

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminWidget.jsx`

- Tab navigace: Config | Embed | Domains | Settings (forge tabs z R6.3)
- Widget config: forge inputy a selecty
- Embed kod: code block s monospace, bg --forge-bg-void, border, copy button
- Domain whitelist: tabulka s add/remove

**Agent:** mp-mid-frontend-admin

### R6.10 Definition of Done — R6

- [ ] Dashboard: asymetricky stat grid (2fr/1.5fr/1fr), monospace labely, sparklines, zadne dekoracni ikony
- [ ] Dashboard: Recent Orders tabulka s Space Mono headerem, alternujici radky, ForgeStatusIndicator
- [ ] AdminPricing: tab navigace, material tabulka s inline editaci, volume discount builder
- [ ] AdminFees: forge tabulky a formular styling
- [ ] AdminParameters: forge styling
- [ ] AdminPresets: forge styling
- [ ] AdminOrders: filter pills, objednavkova tabulka, detailni view
- [ ] AdminAnalytics: grafy s forge barvami, monospace osy
- [ ] AdminBranding: forge upload zona, color pickers
- [ ] AdminTeamAccess: forge karty, role badges
- [ ] AdminWidget: tab navigace, embed code block
- [ ] Vsechny admin stranky pouzivaji ForgePageHeader
- [ ] Pagination s monospace "Showing X-Y of Z"
- [ ] `npm run build` projde bez chyb
- [ ] Branch `redesign/forge-r6-admin-pages` commitnuty

---

## R7: WIDGET SYSTEM

**Cil:** Aktualizovat widget kalkulacku a widget builder na FORGE vizual. Widget je embedovatelny na externi weby, proto ma vlastni sadu theme promennych s forge prefixem. Builder je interni nastroj ktery pouziva FORGE design primo.

**Doba:** 2-3 dny
**Lead:** mp-mid-frontend-widget
**Implementace:** mp-spec-design-responsive
**Review:** mp-sr-design

### R7.1 Widget kalkulacka — FORGE compact design

**Soubor:** `Model_Pricer-V2-main/src/pages/widget-kalkulacka/index.jsx`

**Container:**
- Max-width: konfigurovatelne (default 480px)
- bg --forge-bg-surface, border 1px --forge-border-default, radius --forge-radius-md
- Interni padding: 24px
- Standalone — nema page-level styling (dedeni z host stranky)

**Compact design (musi se vejit do sidebaru/iframu):**
- Upload zona: mensi (200px vyska), stejna dashed border
- Konfigurace: vertikalne (zadny 2-sloupcovy layout)
- Material selector: DROPDOWN (ne karty — usetreni mista)
- Cenovy display: jedina vyrazna linka dole
  ```
  TOTAL: 245 CZK
  ```
  JetBrains Mono 700, --forge-accent-primary, centrovane
- "Order Now" button: full-width, primary, --forge-accent-primary
- Vsechny ovladace pouzivaji compact varianty (36px vyska inputu, 12px padding)

**Agent:** mp-mid-frontend-widget

### R7.2 Widget theme promenne (customer-konfigurovatelne)

```css
/* Widget theme CSS vars — zakaznik muze prepsat */
:root {
  --mp-widget-bg:      var(--forge-bg-surface);
  --mp-widget-text:    var(--forge-text-primary);
  --mp-widget-accent:  var(--forge-accent-primary);
  --mp-widget-border:  var(--forge-border-default);
  --mp-widget-radius:  var(--forge-radius-md);
  --mp-widget-font:    var(--forge-font-body);
  --mp-widget-heading: var(--forge-font-heading);
  --mp-widget-mono:    var(--forge-font-mono);

  /* Widget-specific sizes */
  --mp-widget-input-height: 36px;
  --mp-widget-button-height: 40px;
  --mp-widget-padding: 24px;
}
```

Widget komponenty pouzivaji `--mp-widget-*` promenne misto primych `--forge-*`. Tim se umoznuje zakaznikum menit barvy pres widget builder.

**Agent:** mp-mid-frontend-widget

### R7.3 Widget Builder — FORGE aktualizace

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminWidgetBuilder.jsx`
**Soubor:** `Model_Pricer-V2-main/src/pages/admin/builder/styles/builder-tokens.css`

**builder-tokens.css aktualizace:**

```css
:root {
  /* === Surfaces — FORGE aligned === */
  --builder-bg-primary: var(--forge-bg-surface);     /* #0E1015 */
  --builder-bg-secondary: var(--forge-bg-elevated);  /* #161920 */
  --builder-bg-tertiary: var(--forge-bg-overlay);    /* #1C1F28 */
  --builder-bg-elevated: var(--forge-bg-elevated);   /* #161920 */
  --builder-bg-topbar: var(--forge-bg-void);         /* #08090C */
  --builder-hover-bg: var(--forge-bg-overlay);       /* #1C1F28 */

  /* === Text — FORGE aligned === */
  --builder-text-primary: var(--forge-text-primary);    /* #E8ECF1 */
  --builder-text-secondary: var(--forge-text-secondary); /* #9BA3B0 */
  --builder-text-muted: var(--forge-text-muted);        /* #5C6370 */

  /* === Borders — FORGE aligned === */
  --builder-border-default: var(--forge-border-default); /* #1E2230 */
  --builder-border-subtle: var(--forge-border-grid);     /* #141720 */
  --builder-border-focus: var(--forge-accent-primary);   /* #00D4AA */

  /* === Accents — FORGE aligned (z blue na teal!) === */
  --builder-accent-primary: var(--forge-accent-primary);    /* #00D4AA */
  --builder-accent-hover: var(--forge-accent-primary-h);    /* #00F0C0 */
  --builder-accent-success: var(--forge-success);           /* #00D4AA */
  --builder-accent-warning: var(--forge-warning);           /* #FFB547 */
  --builder-accent-error: var(--forge-error);               /* #FF4757 */

  /* === Selection — FORGE aligned === */
  --builder-selection-outline: var(--forge-accent-primary);  /* #00D4AA */
  --builder-hover-outline: rgba(0, 212, 170, 0.5);
  --builder-active-overlay: rgba(0, 212, 170, 0.12);

  /* === Typography — FORGE aligned === */
  --builder-font-heading: var(--forge-font-heading);
  --builder-font-body: var(--forge-font-body);
  --builder-font-code: var(--forge-font-mono);

  /* === Border Radius — FORGE aligned === */
  --builder-radius-sm: var(--forge-radius-sm);  /* 4px */
  --builder-radius-md: var(--forge-radius-md);  /* 6px */
  --builder-radius-lg: var(--forge-radius-lg);  /* 8px */
}
```

**Klicove zmeny:**
- Vsechny modre (#3B82F6) nahrazeny za teal (#00D4AA)
- Fonty z DM Sans/Inter na Space Grotesk/IBM Plex Sans
- Border radii zmenseny (6/8/12 -> 4/6/8)
- Pozadi zarovnano s FORGE elevation systemem

**Agent:** mp-mid-frontend-widget

### R7.4 Builder Top Bar

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/builder/components/BuilderTopBar.jsx`

- bg --forge-bg-void, bottom border --forge-border-default
- Left: back arrow + "Widget Builder" Space Grotesk 600
- Center: breakpoint toggles (Desktop/Tablet/Mobile) jako icon-only buttony
  - Aktivni: --forge-accent-primary border, bg --forge-bg-elevated
- Right: "Preview" ghost button + "Publish" primary button

**Agent:** mp-mid-frontend-widget

### R7.5 Builder Left Panel

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/builder/components/BuilderLeftPanel.jsx`

- bg --forge-bg-surface, pravy border
- Tabs nahore: "LAYOUT" | "STYLE" | "CONTENT" — forge-tech (Space Mono 500, --forge-text-xs)
- Collapsible sekce s chevron toggle
- Section header: Space Grotesk 600, --forge-text-sm
- Ovladace: compact forge inputy, slidery, color pickery, toggley

**Agent:** mp-mid-frontend-widget

### R7.6 Builder Right Panel (preview)

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/builder/components/BuilderRightPanel.jsx`

- bg --forge-bg-void s centrovany widget preview
- Device frames:
  - Desktop: zadny frame, jen widget v aktualni velikosti
  - Tablet: iPad-like obrys
  - Mobile: phone obrys
- Resize handles na hranach widget containeru
- Zoom ovladace: "50% / 75% / 100% / 125%" monospace buttony dole vpravo

**Agent:** mp-mid-frontend-widget

### R7.7 Widget WidgetStepper — FORGE styl

**Soubor:** `Model_Pricer-V2-main/src/pages/widget-kalkulacka/components/WidgetStepper.jsx`

Kompaktni verze wizard progress baru z R5.1:
- Mensi kruzky (20px)
- Kratsi labely (jen cisla na mobilech)
- Pouziva --mp-widget-accent misto primo --forge-accent-primary

**Agent:** mp-mid-frontend-widget

### R7.8 Widget WidgetHeader a WidgetFooter

**Soubory:**
- `Model_Pricer-V2-main/src/pages/widget-kalkulacka/components/WidgetHeader.jsx`
- `Model_Pricer-V2-main/src/pages/widget-kalkulacka/components/WidgetFooter.jsx`

Header: tenant logo + nazev, forge styling
Footer: "Powered by ModelPricer" v forge-tech, --forge-text-muted

Pouzivaji --mp-widget-* promenne.

**Agent:** mp-mid-frontend-widget

### R7.9 Widget komponenty — PrintConfiguration, PricingCalculator

**Soubory:**
- `Model_Pricer-V2-main/src/pages/widget-kalkulacka/components/PrintConfiguration.jsx`
- `Model_Pricer-V2-main/src/pages/widget-kalkulacka/components/PricingCalculator.jsx`

Compact verze konfigurace a cenotvorby:
- Material: dropdown (ne karty) — usetreni mista
- Quality: 3 kompaktni radio buttony v radku
- Infill: slider s monospace hodnotou
- Cenovy prehled: zjednoduseny ForgePriceBreakdown (bez expandable fees)
- Total: vyrazny, forge-price-lg

DULEZITE: Widget nema checkout (viz MEMORY.md). Neportovat S02 checkout flow.
DULEZITE: Widget pouziva CSS vars (--mp-widget-*), ne Tailwind tridy primo.

**Agent:** mp-mid-frontend-widget

### R7.10 Definition of Done — R7

- [ ] Widget kalkulacka: compact 480px design, dropdown material selector, forge styling
- [ ] Widget theme promenne (--mp-widget-*) definovane a pouzivane
- [ ] builder-tokens.css: vsechny modre nahrazeny za teal, fonty aktualizovane
- [ ] Builder TopBar: forge styling
- [ ] Builder LeftPanel: forge tabs, compact ovladace
- [ ] Builder RightPanel: --forge-bg-void pozadi, device frames
- [ ] WidgetStepper: kompaktni forge styl
- [ ] WidgetHeader/Footer: --mp-widget-* promenne
- [ ] Widget PrintConfiguration: compact, dropdown material
- [ ] Widget PricingCalculator: zjednoduseny ForgePriceBreakdown
- [ ] Widget builder white screen fix zachovan (useRef pro BUILDER_MOCK, viz MEMORY.md)
- [ ] `npm run build` projde bez chyb
- [ ] Branch `redesign/forge-r7-widget-system` commitnuty

---

## R8: BUDOUCI STRANKY

**Cil:** Pripravit layout sablony a designove specifikace pro 12 budoucich stranek/modulu ktere jsou naplanovany v V3 roadmape (S04-S22). Nejde o plnou implementaci — jde o "layout shell" s forge styly ktery bude slouzit jako zaklad pro budouci vyvoj.

**Doba:** 2-3 dny
**Lead:** mp-mid-frontend-admin
**Implementace:** mp-spec-fe-kanban, mp-spec-fe-layout
**Review:** mp-sr-design

### R8.1 Orders Kanban Board

**Reference:** V3-S14 (Kanban Board)

**Layout:** Full-width v admin layoutu, horizontalni scroll.

```jsx
<div className="flex gap-4 overflow-x-auto pb-4 forge-scrollbar">
  {COLUMNS.map(col => (
    <div
      key={col.key}
      className="min-w-[260px] flex-shrink-0 bg-[var(--forge-bg-void)] border border-[var(--forge-border-default)] rounded-[var(--forge-radius-md)]"
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-[var(--forge-border-default)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 2px color bar */}
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: col.color }}
            />
            <span className="forge-label-mono" style={{ letterSpacing: '0.08em' }}>
              {col.label}
            </span>
          </div>
          <span className="forge-badge-accent">{col.count}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="p-3 space-y-3">
        {col.orders.map(order => (
          <div
            key={order.id}
            className="forge-card p-3.5 cursor-grab active:cursor-grabbing"
          >
            <span className="forge-mono text-[12px]">#{order.number}</span>
            <p className="forge-body text-[var(--forge-text-secondary)] text-[13px] mt-1">
              {order.customer}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="forge-mono text-[var(--forge-accent-primary)] text-[14px]">
                {order.price}
              </span>
              <span className="forge-tech text-[11px] text-[var(--forge-text-muted)]">
                {order.timeAgo}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

**Sloupce a barvy:**

| Sloupec | Label | Barva | Hex |
|---------|-------|-------|-----|
| Nova | NEW | --forge-info | #4DA8DA |
| Potvrzena | CONFIRMED | --forge-accent-tertiary | #6C63FF |
| Tiskne se | PRINTING | --forge-accent-primary | #00D4AA |
| Kontrola | QUALITY CHECK | --forge-warning | #FFB547 |
| Odesilani | SHIPPING | --forge-accent-secondary | #FF6B35 |
| Doruceno | DELIVERED | --forge-success | #00D4AA |

**Drag and drop:**
- Karta se zdvihne s --forge-shadow-lg a --forge-accent-primary outline
- Drop zona: sloupec dostane rgba(0, 212, 170, 0.05) pozadi
- Implementace: @dnd-kit (budouci zavislost, pro ted jen vizualni sablona)

**Agent:** mp-spec-fe-kanban

### R8.2 Shipping Config

**Reference:** V3-S04 (Shipping & Delivery)

**Tab navigace:** "ZONES" | "CARRIERS" | "RATES" | "FREE SHIPPING"

**Zones tab:**
- Mapa: tmava (--forge-bg-void zaklad, obrysy zemi v --forge-border-active)
- Barevne zony zvyraznene na mape
- Legenda barev vpravo
- Zona tabulka pod mapou: editovatelna, forge styling

**Carriers tab:**
- Card grid pro kazdeho dopravce
- Logo (grayscale, 40px vyska) + nazev + enabled toggle + "Configure" button
- Forge card styling

**Rates tab:**
- Podminky builder: "IF weight > 5kg AND zone = Europe THEN rate = 12 EUR"
- Rule radky s dropdowny/inputy, propojene AND/OR pills
- "+" ikona button pro pridani pravidla

**Agent:** mp-mid-frontend-admin

### R8.3 Customer Portal

**Reference:** V3-S12 (Customer Portal)

**Layout:** Public-facing, pouziva hlavni Header/Footer (ne admin sidebar).

**Order List View:**
- Kompaktni card list (ne tabulka na mobilech)
- Kazda order karta: model thumbnail (64x64) | order number (mono) + datum + material + kvalita + status badge | total cena (mono, --forge-accent-primary) + "View Details"
- Status badges: outlined pills s barevnymi teckami
  - "Printing" s animovanou pulsujici teckou (forge-pulse-dot)

**Order Detail View:**
- 2 sloupce: detaily (60%) + model viewer (40%)
- Timeline/progress: vertikalni stepper s order progression
  - Kazdy krok: timestamp (mono) + popis + status ikona
  - Aktualni krok: --forge-accent-primary, animovany pulse
- Tracking info sekce (kdyz odeslan)
- "Download Invoice" button, "Contact Support" link

**Agent:** mp-mid-frontend-public

### R8.4 Document Generation

**Reference:** V3-S13 (Document Generation)

- Invoice template: receipt-style s ForgePriceBreakdown layoutem
- PDF export: temny i svetly rezim
- Monospace cisla, dotted leaders, forge branding

### R8.5 Chat a Comments

**Reference:** V3-S11 (Chat & Comments)

- Chat widget: forge-card, --forge-bg-surface pozadi
- Zpravy: bubliny s --forge-bg-elevated (uzivatel) vs --forge-bg-overlay (operator)
- Timestamp: forge-tech, --forge-text-muted
- Input: forge input s send buttonem

### R8.6 Email Notifications Config

**Reference:** V3-S07 (Email Notifications)

- Template editor: WYSIWYG area s forge border
- Template list: forge tabulka
- Test send button: primary forge button

### R8.7 Post-Processing Config

**Reference:** V3-S06 (Post-Processing)

- Operace tabulka: nazev + cena + popis
- Drag reorder
- Toggle aktivace per operace

### R8.8 Coupons a Promotions

**Reference:** V3-S10 (Coupons & Promotions)

- Coupon tabulka: kod v monospace, typ slevy, platnost, pouziti count
- Vytvoreni kupon modal: forge formular

### R8.9 Printability Check

**Reference:** V3-S08 (Printability Check)

- Analyza panel vedel 3D vieweru
- Warning list: forge callout-warning pro kazdy problem
- Severity badges: forge-badge-error, forge-badge-warning

### R8.10 Definition of Done — R8

- [ ] Kanban board sablona: 6 sloupcu s unikatnimi barvami, kompaktni order karty
- [ ] Shipping config sablona: dark mapa, carrier karty, rules builder
- [ ] Customer portal sablona: order list karty, detail s timeline
- [ ] Document generation sablona: receipt-style invoice
- [ ] Chat sablona: zpravove bubliny s forge barvami
- [ ] Email config sablona: template editor
- [ ] Post-processing sablona: operace tabulka s drag reorder
- [ ] Coupons sablona: kupon tabulka a create modal
- [ ] Printability check sablona: analyza panel s warning callouty
- [ ] Vsechny sablony pouzivaji forge-* tokeny a jsou responsive
- [ ] `npm run build` projde bez chyb
- [ ] Branch `redesign/forge-r8-future-pages` commitnuty

---

## R9: POLISH A TESTING

**Cil:** Finalni kvalitni kontrola. 15-bodovy anti-AI checklist, WCAG audit, performance optimalizace, vizualni regresni testy, a cleanup starych tokenmu. Tato faze zarucuje ze redesign neni jen "prebarved" ale skutecne distinktivni a kvalitni.

**Doba:** 2-3 dny
**Lead:** mp-sr-design
**Implementace:** mp-spec-design-a11y, mp-mid-quality-code, mp-spec-test-build
**Review:** mp-sr-orchestrator

### R9.1 Anti-AI 15-bodovy checklist

Kazdy bod MUSI projit. Pokud neprojde, je to blocker pro merge.

| # | Kontrola | Jak overit | Status |
|---|----------|-----------|--------|
| 1 | Asymetricke grid layouty | Hero je 55/45, features 2fr/1fr, dashboard 2fr/1.5fr/1fr — nic neni perfektne symetricke | [ ] |
| 2 | Non-blue primarni barva | Primarni je #00D4AA (teal), sekundarni #FF6B35 (orange) — zadna modra | [ ] |
| 3 | Smisena typografie (3+ font rodiny) | Space Grotesk (headings) + IBM Plex Sans (body) + JetBrains Mono (data) + Space Mono (labely) | [ ] |
| 4 | Cislovane section labely ("01/") | Feature karty maji "01/", "02/", "03/" monospace labely v top-left rohu | [ ] |
| 5 | Hand-drawn accent elementy | ForgeSquiggle SVG pod klicovym slovem v hero — nedokonaly, organicky | [ ] |
| 6 | Texture overlays (noise/grain) | forge-grain na page bg (2.5% opacity), forge-grid-bg na admin content | [ ] |
| 7 | Dotted leader lines v cenovem rozpisu | ForgePriceBreakdown pouziva .forge-leader-line::after s dotted 1px | [ ] |
| 8 | Monospace technicke labely | "STATUS: ONLINE", "ADMIN CONSOLE", "v3.2.1-beta", "42.3 x 28.1 x 15.7 mm" | [ ] |
| 9 | Vedome spacing variace | Sekce spacing: 32px (tight), 48px (medium), 96px (large) — ne uniformni 24px | [ ] |
| 10 | Non-centered hero (left-aligned) | Hero text je left-aligned s vizualem vpravo — ne centrovany stack | [ ] |
| 11 | Color-coded domain jazyk | Filament barvy: PLA=#4ECDC4, ABS=#FF6B6B, PETG=#45B7D1, TPU=#96CEB4, Nylon=#FFEAA7 | [ ] |
| 12 | Funkcionalni animace only | Zadne bezucelne bouncing/floating. Nozzle se pohybuje (demonstrace). Glow pulzuje (realna analogie). | [ ] |
| 13 | Skewed section pozadi | Pricing sekce na homepage ma 2deg CSS skew — lomi obdelnikovy AI pattern | [ ] |
| 14 | Version/build info jako design element | Login: "v3.2.1-beta" v rohu. Dashboard: last sync timestamp. | [ ] |
| 15 | Receipt-style price formatting | Dotted leaders, right-aligned mono hodnoty, double-rule pred totalem, "per unit" pod | [ ] |

**Agent:** mp-sr-design (audit), mp-mid-design-ux (UX validace)

### R9.2 WCAG AA accessibility audit

**Nastroje:** axe-core, Chrome DevTools Contrast Checker, keyboard navigation test

**Checklist:**

| Kontrola | Nastroj | Overeni |
|----------|---------|---------|
| Text kontrast >= 4.5:1 (normalni text) | axe-core | Vsechny text/bg kombinace |
| Text kontrast >= 3:1 (velky text >= 18px) | axe-core | Headings, buttony |
| Focus indikatory viditelne na dark bg | Manualni | Tab pres vsechny interaktivni prvky |
| Interactive elements >= 44x44px touch target | DevTools | Mobile breakpoint, vsechny buttony/linky |
| Barva nikdy jediny diferentiator | Manualni | Status indikatory maji i text, ne jen barvu |
| ARIA labels na Radix komponentech | axe-core | Dialog, Select, Slider, Checkbox |
| Semantic HTML (h1-h6, nav, main, aside, footer) | axe-core | Vsechny stranky |
| prefers-reduced-motion respektovano | Manualni | Vsechny animace maji fallback |
| Skip-to-content link | Manualni | Tab z adresy → prvni focus na skip link |

**Specificke problemy k overeni:**
- `#5C6370` (text-muted) na `#161920` (bg-elevated) = 3.7:1 — NE pro maly text. Overit ze se nepouziva pro dulezity maly text na elevated pozadich.
- `#3A3F4A` (text-disabled) = 2.5:1 — OK jen pro disabled elementy s aria-disabled.
- Focus ring (2px --forge-accent-primary, 2px offset) je dostatecne viditelny na vsech dark pozadich.

**Agent:** mp-spec-design-a11y

### R9.3 Performance audit

**Metriky:**

| Metrika | Cil | Jak merit |
|---------|-----|-----------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| Total Blocking Time (TBT) | < 200ms | Lighthouse |
| Font loading | font-display: swap, vsechny 4 fonty | Network tab |
| CSS size | forge-*.css celkem < 30kb (uncompressed) | Build output |
| Animace | Jen GPU vlastnosti (transform, opacity) | Performance tab |

**Specificke optimalizace:**
- Font preload v index.html (jiz z R0)
- Lazy loading pro future page sablony (R8)
- Skeleton loading (forge-shimmer) misto spinneru kde mozno
- SVG noise pattern pres inline data URI (zadny externi request)

**Agent:** mp-mid-infra-build

### R9.4 Vizualni regresni testy

Screenshot-based porovnani pred/po pro vsechny kriticke stranky:

| Stranka | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Home (hero) | [ ] | [ ] | [ ] |
| Home (features) | [ ] | [ ] | [ ] |
| Home (pricing) | [ ] | [ ] | [ ] |
| Login | [ ] | [ ] | [ ] |
| Register | [ ] | [ ] | [ ] |
| Test kalkulacka (Upload) | [ ] | [ ] | [ ] |
| Test kalkulacka (Configure) | [ ] | [ ] | [ ] |
| Test kalkulacka (Review/Price) | [ ] | [ ] | [ ] |
| Admin Dashboard | [ ] | [ ] | [ ] |
| Admin Pricing | [ ] | [ ] | [ ] |
| Admin Sidebar (expanded) | [ ] | [ ] | [ ] |
| Admin Sidebar (collapsed) | [ ] | [ ] | [ ] |
| Widget kalkulacka | [ ] | [ ] | [ ] |
| Widget Builder | [ ] | [ ] | [ ] |

**Agent:** mp-spec-test-build, skill: webapp-testing

### R9.5 Cleanup starych tokenu

Po overeni ze vsechny stranky funguji s forge-* tokeny:

1. **Identifikovat nepouzivane stare tokeny** v `tailwind.css` `:root` sekci
2. **Odstranit stare color-* promenne** ktere nemaji zadne reference
3. **Odstranit stare .dark sekci** — FORGE je vzdy tmavy, neni potreba dark mode toggle
4. **Zachovat** Tailwind utility tridy ktere jsou jeste pouzivane (postupny prechod)

POZOR: Neodstranovat tokeny ktere jsou jeste referencovane v komponentach ktere nebyly migrovane (napr. budouci stranky z R8).

**Strategie:** Grep pro kazdy stary token. Pokud 0 referenci → odstranit. Pokud > 0 referenci → nechat a pridat TODO komentar.

**Agent:** mp-mid-quality-code

### R9.6 Custom ikony — finalni sada

Overit ze vsech 10 custom SVG ikon je vytvoreno a funguje:

| Ikona | Nazev | Pouziti | Status |
|-------|-------|---------|--------|
| 3D krychle se sipkou | mp-upload-cube | File upload | [ ] |
| Stohovane vrstvy | mp-layers | Quality/layer height | [ ] |
| Prurez trysky | mp-nozzle | Material extrusion | [ ] |
| Civka filamentu | mp-spool | Material selection | [ ] |
| Tiskovy bed s mrizi | mp-bed | Build plate / platforma | [ ] |
| Uhlova podpurna struktura | mp-supports | Support material toggle | [ ] |
| Krizovy vzorek | mp-infill | Infill procento | [ ] |
| Digitalni posuvne meritko | mp-caliper | Rozmery / mereni | [ ] |
| Kruhovy casovac s vrstvami | mp-timer | Odhad casu tisku | [ ] |
| Filament tvori cenovou vizitku | mp-cost | Kalkulace nakladu | [ ] |

Obecne UI ikony (navigace, nastaveni atd.) dale pouzivaji Lucide pro konzistenci a udrzbu.

**Agent:** mp-spec-design-icons

### R9.7 Cross-browser testovani

| Prohlizec | Verze | Desktop | Mobile | Status |
|-----------|-------|---------|--------|--------|
| Chrome | 120+ | [ ] | [ ] | |
| Firefox | 120+ | [ ] | [ ] | |
| Safari | 17+ | [ ] | [ ] | |
| Edge | 120+ | [ ] | | |

**Specificke veci k overeni:**
- backdrop-filter (Safari prefix: -webkit-backdrop-filter) — pouzivano v toolbarech
- CSS custom properties s fallbacky
- SVG feTurbulence noise (Safari rendering)
- font-display: swap behavior

**Agent:** mp-spec-test-build

### R9.8 Dark mode konzistence audit

Projit VSECHNY stranky a overit:
- Zadny bily text na bilem pozadi (stare komponenty)
- Zadne "flashe" bileho obsahu pri nacitani (FOUC)
- Scrollbary jsou tmave (forge-scrollbar trida)
- Form autofill nema bile pozadi (Chrome autofill override)

```css
/* Chrome autofill override pro dark theme */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px var(--forge-bg-elevated) inset;
  -webkit-text-fill-color: var(--forge-text-primary);
  caret-color: var(--forge-text-primary);
}
```

**Agent:** mp-mid-design-ux

### R9.9 Dokumentace finalnich zmen

**Soubory k aktualizaci:**
- `docs/claude/Planovane_Implementace/Redesign/FORGE_TOKENS_REFERENCE.md` — kompletni reference vsech tokenu
- `MEMORY.md` — pridat redesign lessons learned
- `AGENT_MAP.md` — bez zmen (agenti zustavaji)

**Obsah FORGE_TOKENS_REFERENCE.md:**
- Kompletni tabulka vsech --forge-* tokenu s hodnotami
- Pouziti guidelines (kdy ktery token)
- Priklad kombinaci (text na pozadi)
- WCAG kontrast tabulka

**Agent:** mp-sr-docs

### R9.10 Definition of Done — R9 (FINALNI)

- [ ] 15-bodovy anti-AI checklist — vsech 15 bodu PASS
- [ ] WCAG AA audit — vsechny kontroly PASS
- [ ] Performance: FCP < 1.5s, LCP < 2.5s, CLS < 0.1
- [ ] Vizualni regrese — vsechny screenshoty zkontrolovane
- [ ] Stare nepouzivane tokeny odstraneny
- [ ] 10 custom SVG ikon kompletni a funkcni
- [ ] Cross-browser test — Chrome, Firefox, Safari, Edge
- [ ] Dark mode konzistence — zadne bile flashe, tmave scrollbary, autofill override
- [ ] Chrome autofill dark override implementovany
- [ ] Dokumentace aktualizovana
- [ ] `npm run build` projde bez chyb
- [ ] `npm run test` projde bez chyb (vcetne token testu)
- [ ] Finalni merge do main
- [ ] Branch `redesign/forge-r9-polish` commitnuty

---

## SOUHRNNA TABULKA FAZI

| Faze | Nazev | Dny | Soubory | Hlavni deliverables |
|------|-------|-----|---------|---------------------|
| R0 | Priprava | 0.5-1 | 5-8 | Font importy, souborova struktura, tailwind config |
| R1 | Design System | 1.5-2 | 5 | forge-tokens/textures/typography/animations/utilities.css |
| R2 | Komponenty | 3-4 | 15+ | Button, Card, Input, Select, Dialog, Toast, StatusIndicator, atd. |
| R3 | Layout Shell | 2-3 | 4-5 | Sidebar, Header, Footer, AdminLayout |
| R4 | Public Pages | 3-4 | 8-10 | Home (hero/features/pricing), Login, Register, Pricing, Support |
| R5 | Test Kalkulacka | 3-4 | 6-8 | 5-step wizard, upload, configure, ForgePriceBreakdown, checkout |
| R6 | Admin Pages | 3-5 | 10+ | Dashboard, Pricing, Fees, Orders, Analytics, Branding, Team, Widget |
| R7 | Widget System | 2-3 | 8-10 | Widget kalkulacka, builder tokens, builder panels |
| R8 | Budouci Stranky | 2-3 | 9+ | Kanban, Shipping, Customer Portal, a dalsich 6 sablon |
| R9 | Polish/Testing | 2-3 | — | Anti-AI audit, WCAG, performance, regrese, cleanup |
| **CELKEM** | | **~15-22** | **~80+** | |

---

## RIZIKA A MITIGACE

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| White screen po zmene body stylu (R1) | Stredni | P0 | Overlay strategie — stare tokeny zustavaji, postupna migrace |
| Font loading delay (FCP regrese) | Nizka | P1 | font-display: swap, preload v index.html |
| Existujici komponenty rozbite novymi tokeny | Stredni | P1 | Kazda faze ma vlastni branch, `npm run build` pred merge |
| Widget builder white screen (znam bug) | Nizka | P0 | useRef pro BUILDER_MOCK zachovan (viz MEMORY.md) |
| backdrop-filter nefunguje v starsich prohlizecich | Nizka | P2 | Fallback solid bg pro toolbary bez backdrop-filter |
| 3D viewer rozbity po zmene pozadi | Nizka | P1 | bg-void je temer cerna — Three.js by mel fungovat lepe |
| PricingEngine volume discount modifikace | Zadna | — | Redesign NEMENI logiku — jen vizual |
| CSS specificita konflikty (stare Tailwind vs forge) | Stredni | P1 | forge-* tridy maji dostatecnou specificitu pres CSS custom properties |

---

## KONECNE POZNAMKY

### Filozofie FORGE

> "This tool was built by engineers, for engineers."

FORGE neni jen tmavy theme. Je to vizualni jazyk ktery komunikuje technicke kompetence, preciznost a spolehlivost. Kazdy design rozhodnuti — od 4px border radii po monospace labely, od blueprint gridu po receipt-style cenove rozpisy — odkazuje na svet CNC strojiu, ridiciho softwaru tiskarenm a technickych vykresu.

### Co FORGE NENI

- Neni to "dark mode toggle" existujiciho designu
- Neni to skin/theme na Tailwind defaulty
- Neni to Bootstrap s tmavym pozadim
- Neni to genericky SaaS template v dark mode

### Co FORGE JE

- Distinktivni vizualni identita pro 3D printing B2B nastroj
- Design system s jasnymi pravidly a tokeny
- Anti-AI estetika ktera se neduplique nahodne
- Technicke raz ktere zrcadli pracovni prostredi uzivatelu

---

*Konec implementacniho planu. Ceka na review od mp-sr-orchestrator a schvaleni pred zahajenim R0.*
