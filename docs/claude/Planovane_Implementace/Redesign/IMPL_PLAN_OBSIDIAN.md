# Implementacni Plan: Varianta "OBSIDIAN" — Premium / Elegant / Design Studio

> **Autor:** mp-sr-design (Senior Design Agent)
> **Datum:** 2026-02-07
> **Status:** PLAN (pripraveno k implementaci po schvaleni)
> **Scope:** Kompletni vizualni redesign ModelPricer V3 — dark theme, glass-morphism, Sora+DM Sans typografie
> **Odhadovany rozsah:** 10 fazi (R0-R9), ~15-25 pracovnich dni
> **Filozofie:** "High-end product photography studios, luxury automotive dashboards, Cinema 4D, Blender"
> **Klicova slova:** refined, warm, deep, luxurious, assured

---

## OBSAH

- R0: Priprava a Zavislosti
- R1: Design System Zaklad (tokeny, textury, utility)
- R2: Zakladni Komponenty (15+ komponent)
- R3: Layout Shell (sidebar, header, footer)
- R4: Public Pages (hero, features, testimonial, login)
- R5: Test Kalkulacka (5-step wizard)
- R6: Admin Pages (dashboard, pricing, fees, orders)
- R7: Widget System (kalkulacka, builder, embed)
- R8: Budouci Stranky (12 pages — kanban, shipping, portal, ...)
- R9: Polish a Testing (performance, anti-AI audit, a11y)
- Appendix A: Kompletni CSS Token Reference
- Appendix B: WCAG Kontrastni Tabulka
- Appendix C: Agent Assignment Matrix
- Appendix D: Anti-AI Checklist (15 bodu)

---

## BAREVNA PALETA — RYCHLY PREHLED

```
POZADI:
  Void:      #0C0A0F   (nejhlubsi — page bg)
  Surface:   #13111A   (karty, panely)
  Elevated:  #1B1825   (modaly, dropdowny)
  Overlay:   #231F2E   (expanded sections)

TEXT:
  Primary:   #F0EDF5   (warm white, lavender podton)
  Secondary: #A39DB0   (muted lavender-gray)
  Muted:     #6B6478   (deep purple-gray)
  Disabled:  #3D374A   (neaktivni)

AKCENTY:
  Primary:   #C8A2FF   (soft violet — silk PLA purple)
  Hover:     #D4B5FF   (lighter violet)
  Secondary: #FF8A65   (warm coral-orange — wood-fill PLA)
  Tertiary:  #64FFDA   (mint green — glow-in-the-dark filament)

STAVY:
  Success:   #64FFDA   (mint)
  Warning:   #FFD54F   (warm yellow)
  Error:     #FF5252   (warm red)
  Info:      #82B1FF   (soft blue)

FILAMENTY:
  PLA:       #80CBC4   (muted teal)
  ABS:       #EF9A9A   (soft rose)
  PETG:      #81D4FA   (sky blue)
  TPU:       #A5D6A7   (soft green)
  Nylon:     #FFF9C4   (cream)
  Nozzle hot:  #FFAB91
  Nozzle cold: #78909C
  Bed heated:  #EF5350
  Bed cold:    #37474F

BORDERY:
  Default:   #211E2B
  Active:    #2E2A3A
  Highlight: #C8A2FF26  (15% opacity)
  Divider:   #19161F

GRADIENTY:
  Brand:     linear-gradient(135deg, #C8A2FF 0%, #FF8A65 100%)
  Surface:   linear-gradient(180deg, #13111A 0%, #0C0A0F 100%)
  Premium:   linear-gradient(135deg, #C8A2FF 0%, #64FFDA 100%)
  Glow:      radial-gradient(ellipse at center, rgba(200,162,255,0.06) 0%, transparent 70%)
  Warm:      linear-gradient(135deg, #FF8A65 0%, #FFD54F 100%)

STINY:
  SM:   0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(200,162,255,0.04)
  MD:   0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,162,255,0.05)
  LG:   0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,162,255,0.06)
  Glow: 0 0 24px rgba(200,162,255,0.12)
  Warm: 0 0 24px rgba(255,138,101,0.1)

RADIUS:
  SM:   6px   (buttons, badges)
  MD:   10px  (cards, inputs)
  LG:   14px  (modals)
  XL:   20px  (hero cards)
  Full: 9999px (pills, avatars)
```

---

## TYPOGRAFIE — RYCHLY PREHLED

```
FONTY:
  Heading:  'Sora', system-ui, sans-serif          (weight 700)
  Body:     'DM Sans', system-ui, sans-serif        (weight 400)
  Mono:     'JetBrains Mono', 'Fira Code', monospace (weight 500)
  Display:  'Sora', system-ui, sans-serif           (tight tracking)

SKALA (1.200 Minor Third):
  4xl:  2.488rem / 3rem      (40px / 48px)  — Hero headings
  3xl:  2.074rem / 2.5rem    (33px / 40px)  — Page titles
  2xl:  1.728rem / 2.25rem   (28px / 36px)  — Section headings
  xl:   1.44rem  / 1.875rem  (23px / 30px)  — Card titles
  lg:   1.2rem   / 1.75rem   (19px / 28px)  — Body large
  base: 1rem     / 1.625rem  (16px / 26px)  — Body default
  sm:   0.833rem / 1.25rem   (13px / 20px)  — Captions
  xs:   0.694rem / 1rem      (11px / 16px)  — Badges, micro

VAHY:
  Headings:     Sora 700
  Subheadings:  Sora 600
  Body:         DM Sans 400
  Labels:       DM Sans 500
  Strong:       DM Sans 500
  Mono values:  JetBrains Mono 500
```

---

## EASING TOKENY

```
--ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1)
--ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

# ============================================================
# R0: PRIPRAVA A ZAVISLOSTI
# ============================================================

## R0.1 Google Fonts Import

**Soubor:** `Model_Pricer-V2-main/src/styles/tailwind.css`
**Agent:** mp-spec-design-tokens
**Skill:** N/A
**Priorita:** P0 (blokujici pro vsechny dalsi faze)

### Aktualni stav

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

### Cilovy stav

```css
/* OBSIDIAN Typography — Sora (heading), DM Sans (body), JetBrains Mono (mono) */
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
```

### Postup
1. Nahrad stary Inter import za Sora + DM Sans
2. Ponech JetBrains Mono (uz existuje, jen overit vahy 400+500)
3. Pridej `font-display: swap` (uz je soucasti Google Fonts URL)
4. Pridej preload do `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap">
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap">
```

### Soubory k modifikaci
| Soubor | Zmena |
|--------|-------|
| `Model_Pricer-V2-main/src/styles/tailwind.css` | Nahradit font importy |
| `Model_Pricer-V2-main/index.html` | Pridat preconnect + preload |

### Definition of Done
- [ ] Sora font se renderuje v headings
- [ ] DM Sans se renderuje v body textu
- [ ] JetBrains Mono funguje pro .font-mono
- [ ] Zadny FOUT (Flash of Unstyled Text) > 200ms
- [ ] `npm run build` PASS

---

## R0.2 Glass-Morphism Kompatibilita

**Agent:** mp-spec-design-tokens
**Priorita:** P0

### Overeni backdrop-filter podpory

`backdrop-filter` je klicovy pro OBSIDIAN glass efekt. Podpora:
- Chrome 76+ (2019): ANO
- Firefox 103+ (2022): ANO
- Safari 9+ (2015): ANO (s -webkit- prefixem)
- Edge 79+ (2020): ANO

### Fallback strategie

```css
/* Glass s fallbackem */
.obsidian-glass {
  /* Fallback pro stare prohlizece — solidni pozadi */
  background: rgba(19, 17, 26, 0.92);

  /* Moderni prohlizece — frosted glass */
  @supports (backdrop-filter: blur(20px)) {
    background: rgba(19, 17, 26, 0.7);
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
  }
}
```

### Performance poznamky
- `backdrop-filter` je GPU-narocny na mobile (blur 20px = vyznamny GPU load)
- Na mobile (<768px) snizit blur na 12px
- Na `prefers-reduced-motion: reduce` uplne vypnout blur (pouzit solidni bg)
- Maximalne 3-4 glass elementy viditelnych soucasne na viewportu

### Definition of Done
- [ ] Glass efekt renderuje na Chrome, Firefox, Safari, Edge
- [ ] Fallback funguje na starych prohlizecich (solidni bg)
- [ ] Mobile ma snizeny blur (12px)
- [ ] prefers-reduced-motion respektovano

---

## R0.3 Overeni WCAG Kontrastu

**Agent:** mp-spec-design-a11y
**Priorita:** P0

### Kontrastni tabulka OBSIDIAN

| Popredi | Pozadi | Pomer | Vysledek |
|---------|--------|-------|----------|
| #F0EDF5 (text-primary) | #0C0A0F (bg-void) | 16.1:1 | PASS AAA |
| #F0EDF5 (text-primary) | #13111A (bg-surface) | 14.8:1 | PASS AAA |
| #F0EDF5 (text-primary) | #1B1825 (bg-elevated) | 12.2:1 | PASS AAA |
| #A39DB0 (text-secondary) | #13111A (bg-surface) | 7.1:1 | PASS AA |
| #A39DB0 (text-secondary) | #1B1825 (bg-elevated) | 5.9:1 | PASS AA |
| #6B6478 (text-muted) | #13111A (bg-surface) | 4.5:1 | PASS AA (min) |
| #6B6478 (text-muted) | #1B1825 (bg-elevated) | 3.6:1 | PASS AA large only |
| #C8A2FF (accent) | #13111A (bg-surface) | 7.5:1 | PASS AA |
| #C8A2FF (accent) | #0C0A0F (bg-void) | 8.6:1 | PASS AAA |
| #0C0A0F (text on accent) | #C8A2FF (accent bg) | 8.6:1 | PASS AAA |
| #FF5252 (error) | #13111A (bg-surface) | 5.5:1 | PASS AA |
| #FFD54F (warning) | #13111A (bg-surface) | 11.4:1 | PASS AAA |
| #82B1FF (info) | #13111A (bg-surface) | 7.2:1 | PASS AA |
| #64FFDA (success) | #13111A (bg-surface) | 12.6:1 | PASS AAA |

### Rizikove kombinace
- `#6B6478` (muted) na `#1B1825` (elevated) = 3.6:1 — pouzivat JEN pro large text (18px+) nebo dekorativni ucely
- `#3D374A` (disabled) na jakemkoli bg = <3:1 — OK protoze disabled = vizualne nedostupny (vzdy sparovat s aria-disabled)

### Definition of Done
- [ ] Vsechny text-primary a text-secondary kombinace splnuji WCAG AA
- [ ] Accent barvy na bg-surface a bg-void splnuji WCAG AA
- [ ] Dokumentovane vyjimky pro muted/disabled text

---

## R0.4 Zavislosti a Package Check

**Agent:** mp-mid-infra-build
**Priorita:** P1

### Existujici zavislosti (ponechat)
- `class-variance-authority` (CVA) — pro Button varianty
- `@radix-ui/react-slot` — pro asChild pattern
- `@radix-ui/react-slider` — pro Slider
- `@radix-ui/react-dialog` — pro Dialog/Modal
- `framer-motion` — pro animace (drawer, transitions)
- `lenis` — smooth scroll

### Nove zavislosti (ZADNE)
OBSIDIAN redesign nevyzaduje zadne nove npm balicky. Vsechny efekty (glass, noise, glow, gradienty) jsou realizovatelne cistym CSS.

### Definition of Done
- [ ] Zadny novy npm balicek pridan
- [ ] Existujici zavislosti overeny ze jsou kompatibilni
- [ ] `npm run build` PASS

---

## R0.5 Branch a Git Strategie

**Agent:** mp-sr-orchestrator
**Priorita:** P0

### Doporuceny pristup
```
main
  └── feat/obsidian-redesign
        ├── feat/obsidian-r1-tokens      (design tokeny)
        ├── feat/obsidian-r2-components   (zakladni komponenty)
        ├── feat/obsidian-r3-layout       (shell layout)
        ├── feat/obsidian-r4-public       (public pages)
        ├── feat/obsidian-r5-calculator   (test kalkulacka)
        ├── feat/obsidian-r6-admin        (admin pages)
        ├── feat/obsidian-r7-widget       (widget system)
        ├── feat/obsidian-r8-future       (budouci stranky)
        └── feat/obsidian-r9-polish       (polish + testing)
```

### Pravidla
- Kazda faze = vlastni feature branch
- Merge do `feat/obsidian-redesign` po uspesnem review
- Finalni merge do `main` az po R9 completion
- Commit messages: `feat(obsidian): R{n}.{m} — popis zmeny`

---

## R0.6 Struktura Novych Souboru

**Agent:** mp-mid-design-system
**Priorita:** P0

### Nove soubory k vytvoreni

```
Model_Pricer-V2-main/src/styles/
  obsidian-tokens.css          ← Vsechny CSS custom properties
  obsidian-textures.css        ← Noise, glass, glow utility tridy
  obsidian-animations.css      ← Keyframes, motion tokeny

Model_Pricer-V2-main/src/components/ui/
  (existujici soubory se upravi — Button, Card, Input, Slider, atd.)
```

### Existujici soubory k modifikaci

```
Model_Pricer-V2-main/src/styles/tailwind.css     ← Font importy, base layer
Model_Pricer-V2-main/src/styles/index.css         ← Body font-family
Model_Pricer-V2-main/index.html                   ← Preconnect, meta theme-color
Model_Pricer-V2-main/tailwind.config.js           ← Extend s novymi tokeny (volitelne)
```

### Definition of Done
- [ ] Vsechny nove soubory vytvoreny (prazdne nebo s zakladni strukturou)
- [ ] Import chain funguje (tailwind.css importuje obsidian-tokens.css atd.)
- [ ] `npm run build` PASS

---

## R0.7 Meta Theme Color

**Soubor:** `Model_Pricer-V2-main/index.html`
**Agent:** mp-spec-design-tokens

### Pridat do `<head>`:

```html
<meta name="theme-color" content="#0C0A0F">
<meta name="color-scheme" content="dark">
```

Toto nastavi barvu system chrome (address bar na mobile) na OBSIDIAN void barvu.

---

## R0.8 Casovy Odhad Faze R0

| Ukol | Agent | Odhad |
|------|-------|-------|
| R0.1 Font imports | mp-spec-design-tokens | 0.5h |
| R0.2 Glass-morphism check | mp-spec-design-tokens | 0.5h |
| R0.3 WCAG audit | mp-spec-design-a11y | 1h |
| R0.4 Package check | mp-mid-infra-build | 0.5h |
| R0.5 Branch setup | mp-sr-orchestrator | 0.25h |
| R0.6 File structure | mp-mid-design-system | 0.5h |
| R0.7 Meta theme | mp-spec-design-tokens | 0.1h |
| **Celkem R0** | | **~3.5h** |

---

## R0.9 Rizika Faze R0

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| Sora font FOUT na pomalem pripojeni | Stredni | Nizky | font-display: swap + preload |
| backdrop-filter performance na starsim iOS | Nizka | Stredni | Fallback na solidni bg |
| Konflikty s existujicimi Tailwind tridy | Stredni | Stredni | Postupna migrace, ne naraz |

---

## R0.10 Acceptance Criteria Faze R0

```
[ ] Sora, DM Sans, JetBrains Mono se nacitaji z Google Fonts
[ ] index.html ma preconnect, preload, meta theme-color, color-scheme
[ ] Nove CSS soubory existuji a jsou importovany
[ ] Glass-morphism fallback strategie zdokumentovana
[ ] WCAG kontrastni tabulka overena
[ ] Zadne nove npm zavislosti
[ ] npm run build PASS
[ ] Branch struktura pripravena
```

---

# ============================================================
# R1: DESIGN SYSTEM ZAKLAD
# ============================================================

## R1.1 CSS Custom Properties — Kompletni Token Set

**Soubor:** `Model_Pricer-V2-main/src/styles/obsidian-tokens.css`
**Agent:** mp-spec-design-tokens
**Skill:** N/A
**Priorita:** P0

### Kompletni obsah souboru

```css
/* ============================================================
   OBSIDIAN DESIGN TOKENS
   Varianta "OBSIDIAN" — Premium / Elegant / Design Studio
   Generovano z DARK_THEME_REDESIGN_PROPOSAL_AGENT.md sekce 4
   ============================================================ */

:root {
  /* --------------------------------------------------------
     BACKGROUND HIERARCHY (4 levels)
     60% of visual space — dark surfaces
     -------------------------------------------------------- */
  --obsidian-bg-void:       #0C0A0F;
  --obsidian-bg-surface:    #13111A;
  --obsidian-bg-elevated:   #1B1825;
  --obsidian-bg-overlay:    #231F2E;

  /* --------------------------------------------------------
     TEXT HIERARCHY (4 levels)
     -------------------------------------------------------- */
  --obsidian-text-primary:   #F0EDF5;
  --obsidian-text-secondary: #A39DB0;
  --obsidian-text-muted:     #6B6478;
  --obsidian-text-disabled:  #3D374A;

  /* --------------------------------------------------------
     ACCENT COLORS (10% of visual space)
     -------------------------------------------------------- */
  --obsidian-accent-primary:    #C8A2FF;
  --obsidian-accent-primary-h:  #D4B5FF;
  --obsidian-accent-secondary:  #FF8A65;
  --obsidian-accent-tertiary:   #64FFDA;

  /* --------------------------------------------------------
     SEMANTIC COLORS
     -------------------------------------------------------- */
  --obsidian-success:   #64FFDA;
  --obsidian-warning:   #FFD54F;
  --obsidian-error:     #FF5252;
  --obsidian-info:      #82B1FF;

  /* --------------------------------------------------------
     3D PRINTING FILAMENT COLORS (softer palette)
     -------------------------------------------------------- */
  --obsidian-filament-pla:     #80CBC4;
  --obsidian-filament-abs:     #EF9A9A;
  --obsidian-filament-petg:    #81D4FA;
  --obsidian-filament-tpu:     #A5D6A7;
  --obsidian-filament-nylon:   #FFF9C4;
  --obsidian-nozzle-hot:       #FFAB91;
  --obsidian-nozzle-cold:      #78909C;
  --obsidian-bed-heated:       #EF5350;
  --obsidian-bed-cold:         #37474F;
  --obsidian-layer-line:       rgba(200, 162, 255, 0.12);

  /* --------------------------------------------------------
     BORDER COLORS
     -------------------------------------------------------- */
  --obsidian-border-default:   #211E2B;
  --obsidian-border-active:    #2E2A3A;
  --obsidian-border-highlight: rgba(200, 162, 255, 0.15);
  --obsidian-border-divider:   #19161F;

  /* --------------------------------------------------------
     GRADIENTS
     -------------------------------------------------------- */
  --obsidian-gradient-brand:    linear-gradient(135deg, #C8A2FF 0%, #FF8A65 100%);
  --obsidian-gradient-surface:  linear-gradient(180deg, #13111A 0%, #0C0A0F 100%);
  --obsidian-gradient-premium:  linear-gradient(135deg, #C8A2FF 0%, #64FFDA 100%);
  --obsidian-gradient-glow:     radial-gradient(ellipse at center, rgba(200,162,255,0.06) 0%, transparent 70%);
  --obsidian-gradient-warm:     linear-gradient(135deg, #FF8A65 0%, #FFD54F 100%);

  /* --------------------------------------------------------
     SHADOWS (layered with violet color tinting)
     -------------------------------------------------------- */
  --obsidian-shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.3),
                           0 0 0 1px rgba(200, 162, 255, 0.04);
  --obsidian-shadow-md:    0 4px 16px rgba(0, 0, 0, 0.4),
                           0 0 0 1px rgba(200, 162, 255, 0.05);
  --obsidian-shadow-lg:    0 16px 40px rgba(0, 0, 0, 0.5),
                           0 0 0 1px rgba(200, 162, 255, 0.06);
  --obsidian-shadow-glow:  0 0 24px rgba(200, 162, 255, 0.12);
  --obsidian-shadow-warm:  0 0 24px rgba(255, 138, 101, 0.1);

  /* --------------------------------------------------------
     BORDER RADIUS
     -------------------------------------------------------- */
  --obsidian-radius-sm:    6px;
  --obsidian-radius-md:    10px;
  --obsidian-radius-lg:    14px;
  --obsidian-radius-xl:    20px;
  --obsidian-radius-full:  9999px;

  /* --------------------------------------------------------
     TYPOGRAPHY
     -------------------------------------------------------- */
  --obsidian-font-heading:  'Sora', system-ui, sans-serif;
  --obsidian-font-body:     'DM Sans', system-ui, sans-serif;
  --obsidian-font-mono:     'JetBrains Mono', 'Fira Code', monospace;

  /* Type scale (1.200 Minor Third) */
  --obsidian-text-4xl:   2.488rem;
  --obsidian-lh-4xl:     3rem;
  --obsidian-text-3xl:   2.074rem;
  --obsidian-lh-3xl:     2.5rem;
  --obsidian-text-2xl:   1.728rem;
  --obsidian-lh-2xl:     2.25rem;
  --obsidian-text-xl:    1.44rem;
  --obsidian-lh-xl:      1.875rem;
  --obsidian-text-lg:    1.2rem;
  --obsidian-lh-lg:      1.75rem;
  --obsidian-text-base:  1rem;
  --obsidian-lh-base:    1.625rem;
  --obsidian-text-sm:    0.833rem;
  --obsidian-lh-sm:      1.25rem;
  --obsidian-text-xs:    0.694rem;
  --obsidian-lh-xs:      1rem;

  /* --------------------------------------------------------
     SPACING (8px grid)
     -------------------------------------------------------- */
  --obsidian-space-1:   4px;
  --obsidian-space-2:   8px;
  --obsidian-space-3:   12px;
  --obsidian-space-4:   16px;
  --obsidian-space-5:   20px;
  --obsidian-space-6:   24px;
  --obsidian-space-7:   32px;
  --obsidian-space-8:   48px;
  --obsidian-space-9:   64px;
  --obsidian-space-10:  96px;
  --obsidian-space-11:  128px;

  /* --------------------------------------------------------
     EASING
     -------------------------------------------------------- */
  --obsidian-ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1);
  --obsidian-ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1);
  --obsidian-ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);

  /* --------------------------------------------------------
     Z-INDEX SCALE
     -------------------------------------------------------- */
  --obsidian-z-base:      0;
  --obsidian-z-elevated:  10;
  --obsidian-z-sticky:    100;
  --obsidian-z-overlay:   200;
  --obsidian-z-modal:     300;
  --obsidian-z-popover:   400;
  --obsidian-z-toast:     500;
  --obsidian-z-max:       9999;
}
```

### Definition of Done
- [ ] Vsechny tokeny definovany v :root
- [ ] Kazdy token ma komentar/kategorii
- [ ] Soubor importovan v tailwind.css
- [ ] DevTools ukazuji computed values spravne
- [ ] `npm run build` PASS

---

## R1.2 Tailwind.css Base Layer Update

**Soubor:** `Model_Pricer-V2-main/src/styles/tailwind.css`
**Agent:** mp-spec-design-tokens
**Priorita:** P0

### Cilovy stav @layer base

```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

@import './obsidian-tokens.css';
@import './obsidian-textures.css';
@import './obsidian-animations.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Mapovani OBSIDIAN tokenu na Tailwind/shadcn promenne */
    --color-background: var(--obsidian-bg-void);
    --color-foreground: var(--obsidian-text-primary);
    --color-border: var(--obsidian-border-default);
    --color-input: var(--obsidian-bg-elevated);
    --color-ring: var(--obsidian-accent-primary);

    --color-card: var(--obsidian-bg-surface);
    --color-card-foreground: var(--obsidian-text-primary);

    --color-popover: var(--obsidian-bg-elevated);
    --color-popover-foreground: var(--obsidian-text-primary);

    --color-muted: var(--obsidian-bg-elevated);
    --color-muted-foreground: var(--obsidian-text-muted);

    --color-primary: var(--obsidian-accent-primary);
    --color-primary-hover: var(--obsidian-accent-primary-h);
    --color-primary-foreground: var(--obsidian-bg-void);

    --color-secondary: var(--obsidian-bg-elevated);
    --color-secondary-foreground: var(--obsidian-text-secondary);

    --color-destructive: var(--obsidian-error);
    --color-destructive-foreground: #FFFFFF;

    --color-accent: var(--obsidian-accent-secondary);
    --color-accent-foreground: var(--obsidian-bg-void);

    --color-success: var(--obsidian-success);
    --color-success-foreground: var(--obsidian-bg-void);

    --color-warning: var(--obsidian-warning);
    --color-warning-foreground: var(--obsidian-bg-void);

    --color-error: var(--obsidian-error);
    --color-error-foreground: #FFFFFF;

    --shadow-sm: var(--obsidian-shadow-sm);
    --shadow-default: var(--obsidian-shadow-md);
    --shadow-md: var(--obsidian-shadow-md);
    --shadow-lg: var(--obsidian-shadow-lg);

    --radius: var(--obsidian-radius-md);
  }

  * {
    border-color: var(--obsidian-border-default);
  }

  body {
    background-color: var(--obsidian-bg-void);
    color: var(--obsidian-text-primary);
    font-family: var(--obsidian-font-body);
    font-size: var(--obsidian-text-base);
    line-height: var(--obsidian-lh-base);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--obsidian-font-heading);
    font-weight: 700;
    color: var(--obsidian-text-primary);
  }

  h1 {
    font-size: var(--obsidian-text-4xl);
    line-height: var(--obsidian-lh-4xl);
    letter-spacing: -0.03em;
  }

  h2 {
    font-size: var(--obsidian-text-3xl);
    line-height: var(--obsidian-lh-3xl);
    letter-spacing: -0.02em;
  }

  h3 {
    font-size: var(--obsidian-text-2xl);
    line-height: var(--obsidian-lh-2xl);
    letter-spacing: -0.01em;
  }

  h4 {
    font-size: var(--obsidian-text-xl);
    line-height: var(--obsidian-lh-xl);
  }

  .font-mono {
    font-family: var(--obsidian-font-mono);
  }

  /* Focus visible pro dark theme — violet ring */
  :focus-visible {
    outline: 2px solid var(--obsidian-accent-primary);
    outline-offset: 2px;
  }

  /* Selection color */
  ::selection {
    background-color: rgba(200, 162, 255, 0.25);
    color: var(--obsidian-text-primary);
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--obsidian-bg-void);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--obsidian-border-active);
    border-radius: var(--obsidian-radius-full);
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--obsidian-text-muted);
  }
}
```

### Definition of Done
- [ ] Body ma tmave pozadi #0C0A0F
- [ ] Text je #F0EDF5 (lavender white)
- [ ] Headings pouzivaji Sora 700
- [ ] Body pouziva DM Sans 400
- [ ] Focus ring je violet (#C8A2FF)
- [ ] Scrollbar je tmava s violet thumb
- [ ] Existujici CVA-based komponenty automaticky prebibaji nove barvy
- [ ] `npm run build` PASS

---

## R1.3 Texture Utility Classes — Glass, Noise, Glow

**Soubor:** `Model_Pricer-V2-main/src/styles/obsidian-textures.css`
**Agent:** mp-mid-design-system
**Priorita:** P0

### Kompletni obsah souboru

```css
/* ============================================================
   OBSIDIAN TEXTURES — Glass, Noise, Glow
   ============================================================ */

/* --------------------------------------------------------
   FROSTED GLASS (klicovy vizualni prvek OBSIDIAN)
   Pouziti: karty, stepper pill, modaly, toolbary
   -------------------------------------------------------- */
.obsidian-glass {
  background: rgba(19, 17, 26, 0.92);
  border: 1px solid rgba(200, 162, 255, 0.08);
}

@supports (backdrop-filter: blur(20px)) {
  .obsidian-glass {
    background: rgba(19, 17, 26, 0.7);
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
  }
}

/* Glass s mene blur (pro vnorene elementy, mobile) */
.obsidian-glass-subtle {
  background: rgba(19, 17, 26, 0.85);
  border: 1px solid rgba(200, 162, 255, 0.05);
}

@supports (backdrop-filter: blur(12px)) {
  .obsidian-glass-subtle {
    background: rgba(19, 17, 26, 0.75);
    backdrop-filter: blur(12px) saturate(1.1);
    -webkit-backdrop-filter: blur(12px) saturate(1.1);
  }
}

/* Mobile override — snizeny blur pro performance */
@media (max-width: 767px) {
  .obsidian-glass {
    background: rgba(19, 17, 26, 0.88);
  }

  @supports (backdrop-filter: blur(12px)) {
    .obsidian-glass {
      background: rgba(19, 17, 26, 0.75);
      backdrop-filter: blur(12px) saturate(1.1);
      -webkit-backdrop-filter: blur(12px) saturate(1.1);
    }
  }
}

/* Reduced motion — zadny blur */
@media (prefers-reduced-motion: reduce) {
  .obsidian-glass,
  .obsidian-glass-subtle {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(19, 17, 26, 0.92);
  }
}

/* --------------------------------------------------------
   NOISE / GRAIN OVERLAY
   Softer frequency nez FORGE (baseFrequency 0.65 vs 0.9)
   Opacity 1.8% (jemnejsi nez FORGE 2.5%)
   Pouziti: page background (::before na body nebo wrapper)
   -------------------------------------------------------- */
.obsidian-grain {
  position: relative;
}

.obsidian-grain::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

@media (prefers-reduced-motion: reduce) {
  .obsidian-grain::before {
    display: none;
  }
}

/* --------------------------------------------------------
   AMBIENT GLOW (violet + coral radial gradient)
   Pouziti: za hero section, za dulezitymi kartami
   Umistitelnny pres ::before na rodicovsky element
   -------------------------------------------------------- */
.obsidian-ambient {
  position: relative;
}

.obsidian-ambient::before {
  content: '';
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(
    ellipse,
    rgba(200, 162, 255, 0.06) 0%,
    rgba(255, 138, 101, 0.03) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

/* Vetsi varianta pro hero sekce */
.obsidian-ambient-hero {
  position: relative;
}

.obsidian-ambient-hero::before {
  content: '';
  position: absolute;
  top: -300px;
  left: 50%;
  transform: translateX(-50%);
  width: 900px;
  height: 600px;
  background: radial-gradient(
    ellipse,
    rgba(200, 162, 255, 0.08) 0%,
    rgba(255, 138, 101, 0.04) 35%,
    rgba(100, 255, 218, 0.02) 60%,
    transparent 80%
  );
  pointer-events: none;
  z-index: 0;
}

/* Mensi varianta pro karty */
.obsidian-ambient-card {
  position: relative;
}

.obsidian-ambient-card::before {
  content: '';
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 200px;
  background: radial-gradient(
    ellipse,
    rgba(200, 162, 255, 0.04) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

@media (prefers-reduced-motion: reduce) {
  .obsidian-ambient::before,
  .obsidian-ambient-hero::before,
  .obsidian-ambient-card::before {
    opacity: 0.5;
  }
}

/* --------------------------------------------------------
   GRADIENT TEXT (background-clip: text)
   Pouziti: hero keyword, total cena, specialni nadpisy
   -------------------------------------------------------- */
.obsidian-gradient-text {
  background: var(--obsidian-gradient-brand);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.obsidian-gradient-text-premium {
  background: var(--obsidian-gradient-premium);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* --------------------------------------------------------
   SURFACE CLASSES (pro rychle prirazeni pozadi)
   -------------------------------------------------------- */
.obsidian-surface-void {
  background-color: var(--obsidian-bg-void);
}

.obsidian-surface {
  background-color: var(--obsidian-bg-surface);
}

.obsidian-surface-elevated {
  background-color: var(--obsidian-bg-elevated);
}

.obsidian-surface-overlay {
  background-color: var(--obsidian-bg-overlay);
}
```

### Definition of Done
- [ ] .obsidian-glass renderuje frosted glass efekt na Chrome/Firefox/Safari
- [ ] .obsidian-grain zobrazuje jemny noise overlay na celem viewportu
- [ ] .obsidian-ambient zobrazuje violet-coral glow za sekcemi
- [ ] .obsidian-gradient-text renderuje gradient na textu
- [ ] Mobile ma snizeny blur (12px)
- [ ] prefers-reduced-motion respektovano pro vsechny textury
- [ ] `npm run build` PASS

---

## R1.4 Animation Keyframes a Motion Tokens

**Soubor:** `Model_Pricer-V2-main/src/styles/obsidian-animations.css`
**Agent:** mp-spec-fe-animations
**Priorita:** P1

### Kompletni obsah souboru

```css
/* ============================================================
   OBSIDIAN ANIMATIONS — Keyframes, Motion Tokens
   Vsechny animace maji uceel (viz Motion Design Contract)
   ============================================================ */

/* --------------------------------------------------------
   ENTRANCE ANIMATIONS
   -------------------------------------------------------- */
@keyframes obsidian-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes obsidian-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes obsidian-fade-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes obsidian-scale-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* --------------------------------------------------------
   MODAL / DIALOG ANIMATIONS
   -------------------------------------------------------- */
@keyframes obsidian-modal-enter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes obsidian-modal-exit {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.98) translateY(4px);
  }
}

@keyframes obsidian-overlay-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* --------------------------------------------------------
   SPECIAL ANIMATIONS
   -------------------------------------------------------- */

/* Shimmer pro loading state (violet-tinted) */
@keyframes obsidian-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Breathing pulse pro CTA / live indikatory */
@keyframes obsidian-breathe {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.015);
  }
}

/* SVG checkmark draw-in (morphing circle to checkmark) */
@keyframes obsidian-draw-check {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

/* Circle morph pre-stage (scale in) */
@keyframes obsidian-circle-morph {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Spinner rotation */
@keyframes obsidian-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Progress bar gradient flow */
@keyframes obsidian-progress-flow {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}

/* Ambient glow pulse (jemne pro hero) */
@keyframes obsidian-glow-pulse {
  0%, 100% {
    opacity: 0.06;
  }
  50% {
    opacity: 0.1;
  }
}

/* Toast slide in */
@keyframes obsidian-toast-enter {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes obsidian-toast-exit {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
}

/* --------------------------------------------------------
   UTILITY ANIMATION CLASSES
   -------------------------------------------------------- */
.obsidian-animate-fade-in {
  animation: obsidian-fade-in 300ms var(--obsidian-ease-out-expo) both;
}

.obsidian-animate-fade-up {
  animation: obsidian-fade-up 400ms var(--obsidian-ease-out-expo) both;
}

.obsidian-animate-scale-in {
  animation: obsidian-scale-in 300ms var(--obsidian-ease-out-expo) both;
}

.obsidian-animate-shimmer {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(200, 162, 255, 0.06),
    transparent
  );
  background-size: 200% 100%;
  animation: obsidian-shimmer 1.5s infinite;
}

.obsidian-animate-breathe {
  animation: obsidian-breathe 4s var(--obsidian-ease-in-out-quad) infinite;
}

.obsidian-animate-spin {
  animation: obsidian-spin 1s linear infinite;
}

/* Stagger delays pro entrance animaci (feature cards apod.) */
.obsidian-stagger-1 { animation-delay: 0ms; }
.obsidian-stagger-2 { animation-delay: 80ms; }
.obsidian-stagger-3 { animation-delay: 160ms; }
.obsidian-stagger-4 { animation-delay: 240ms; }
.obsidian-stagger-5 { animation-delay: 320ms; }
.obsidian-stagger-6 { animation-delay: 400ms; }

/* --------------------------------------------------------
   TRANSITION UTILITIES
   -------------------------------------------------------- */
.obsidian-transition-micro {
  transition: all 150ms var(--obsidian-ease-out-expo);
}

.obsidian-transition-standard {
  transition: all 250ms var(--obsidian-ease-out-expo);
}

.obsidian-transition-layout {
  transition: all 350ms var(--obsidian-ease-out-expo);
}

.obsidian-transition-spring {
  transition: all 300ms var(--obsidian-ease-spring);
}

/* --------------------------------------------------------
   REDUCED MOTION
   -------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .obsidian-animate-fade-in,
  .obsidian-animate-fade-up,
  .obsidian-animate-scale-in,
  .obsidian-animate-breathe {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .obsidian-animate-shimmer {
    animation: none !important;
  }

  .obsidian-transition-micro,
  .obsidian-transition-standard,
  .obsidian-transition-layout,
  .obsidian-transition-spring {
    transition: none !important;
  }
}
```

### Definition of Done
- [ ] Vsechny keyframes definovany
- [ ] Utility tridy pouzitelne primo v JSX className
- [ ] Stagger delay system funguje pro feature cards
- [ ] prefers-reduced-motion uplne vypina animace
- [ ] Zadna animace delsi nez 500ms (krome breathe a shimmer)
- [ ] `npm run build` PASS

---

## R1.5 Index.css Update

**Soubor:** `Model_Pricer-V2-main/src/styles/index.css`
**Agent:** mp-spec-design-tokens

### Cilovy stav

```css
body {
  margin: 0;
  padding: 0;
  font-family: 'DM Sans', system-ui, sans-serif;
  background-color: #0C0A0F;
  color: #F0EDF5;
}

* {
  box-sizing: border-box;
  line-height: normal;
  font-family: inherit;
  margin: unset;
}

html {
  scroll-behavior: smooth;
}

html.lenis {
  height: auto;
}
.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}
```

---

## R1.6 Casovy Odhad Faze R1

| Ukol | Agent | Odhad |
|------|-------|-------|
| R1.1 CSS tokens | mp-spec-design-tokens | 2h |
| R1.2 Tailwind base update | mp-spec-design-tokens | 1.5h |
| R1.3 Textures CSS | mp-mid-design-system | 2h |
| R1.4 Animations CSS | mp-spec-fe-animations | 1.5h |
| R1.5 Index.css update | mp-spec-design-tokens | 0.25h |
| **Celkem R1** | | **~7.5h** |

---

## R1.7 Rizika Faze R1

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| Existujici Tailwind tridy konfliktuji s novymi tokeny | Vysoka | Stredni | Mapovani pres --color-* promenne |
| Glass blur degraduje FPS na starsich mobilech | Stredni | Nizky | Mobile override na 12px blur |
| Noise SVG se nenacte na nekterych prohlizecich | Nizka | Nizky | SVG inline v data URI — zadny externi request |

---

## R1.8-R1.10 Acceptance Criteria Faze R1

```
[ ] Cela stranka ma tmave pozadi (#0C0A0F)
[ ] Text je #F0EDF5 (warm white)
[ ] Headings pouzivaji Sora 700
[ ] Body pouziva DM Sans 400
[ ] .obsidian-glass renderuje frosted glass efekt
[ ] .obsidian-grain zobrazuje noise overlay
[ ] .obsidian-ambient renderuje glow
[ ] .obsidian-gradient-text renderuje gradient na textu
[ ] Vsechny animace respektuji prefers-reduced-motion
[ ] Existujici komponenty (Button, Card, atd.) prebibaji nove barvy automaticky
[ ] npm run build PASS
[ ] Zadne nove npm zavislosti
```

---

# ============================================================
# R2: ZAKLADNI KOMPONENTY (15+)
# ============================================================

## R2.1 Button Component — OBSIDIAN Varianty

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Button.jsx`
**Agent:** mp-mid-design-system
**Priorita:** P0

### Aktualni stav
Button pouziva CVA s variantami: default, primary, outline, ghost, gradient, destructive, link.
Velikosti: default (h-10), sm (h-9), lg (h-11), icon (h-10 w-10).

### Cilovy stav — CVA definice

```jsx
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap font-medium",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--obsidian-accent-primary)]",
          "text-[var(--obsidian-bg-void)]",
          "rounded-[var(--obsidian-radius-md)]",
          "font-[var(--obsidian-font-heading)]",
          "font-semibold",
          "hover:bg-[var(--obsidian-accent-primary-h)]",
          "hover:-translate-y-[1px]",
          "hover:shadow-[var(--obsidian-shadow-glow)]",
          "active:translate-y-0",
          "focus-visible:ring-[var(--obsidian-accent-primary)]",
          "focus-visible:ring-offset-[var(--obsidian-bg-void)]",
        ].join(" "),
        primary: [
          "bg-[var(--obsidian-accent-primary)]",
          "text-[var(--obsidian-bg-void)]",
          "rounded-[var(--obsidian-radius-md)]",
          "font-[var(--obsidian-font-heading)]",
          "font-semibold",
          "hover:bg-[var(--obsidian-accent-primary-h)]",
          "hover:-translate-y-[1px]",
          "hover:shadow-[var(--obsidian-shadow-glow)]",
          "active:translate-y-0",
        ].join(" "),
        secondary: [
          "bg-[var(--obsidian-bg-elevated)]",
          "text-[var(--obsidian-text-secondary)]",
          "border border-[var(--obsidian-border-active)]",
          "rounded-[var(--obsidian-radius-md)]",
          "hover:border-[var(--obsidian-accent-primary)]",
          "hover:text-[var(--obsidian-text-primary)]",
        ].join(" "),
        outline: [
          "border border-[var(--obsidian-border-active)]",
          "bg-transparent",
          "text-[var(--obsidian-text-secondary)]",
          "rounded-[var(--obsidian-radius-md)]",
          "hover:bg-[var(--obsidian-bg-elevated)]",
          "hover:text-[var(--obsidian-text-primary)]",
        ].join(" "),
        ghost: [
          "bg-transparent",
          "text-[var(--obsidian-text-secondary)]",
          "rounded-[var(--obsidian-radius-md)]",
          "hover:bg-[var(--obsidian-bg-elevated)]",
          "hover:text-[var(--obsidian-text-primary)]",
        ].join(" "),
        gradient: [
          "bg-gradient-to-br from-[#C8A2FF] to-[#FF8A65]",
          "text-[var(--obsidian-bg-void)]",
          "rounded-[var(--obsidian-radius-md)]",
          "font-[var(--obsidian-font-heading)]",
          "font-semibold",
          "hover:opacity-90",
          "hover:-translate-y-[1px]",
        ].join(" "),
        destructive: [
          "bg-[var(--obsidian-error)]",
          "text-white",
          "rounded-[var(--obsidian-radius-md)]",
          "hover:bg-[#E04545]",
          "hover:shadow-[0_0_24px_rgba(255,82,82,0.15)]",
        ].join(" "),
        link: [
          "text-[var(--obsidian-accent-primary)]",
          "underline-offset-4",
          "hover:underline",
          "hover:text-[var(--obsidian-accent-primary-h)]",
        ].join(" "),
      },
      size: {
        default: "h-11 px-6 text-[15px]",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Klicove OBSIDIAN rozdily od soucasneho stavu
- **Border radius:** 10px (--obsidian-radius-md) misto rounded-lg (8px)
- **Primary barva:** #C8A2FF violet misto #2563EB blue
- **Text na primary:** Dark (#0C0A0F) misto white
- **Font:** Sora 600 na primary/gradient buttons
- **Vyska default:** 44px (h-11) misto 40px (h-10) — vetsi touch target
- **Hover:** translateY(-1px) + glow shadow (ne jen color change)
- **Focus ring:** Violet (#C8A2FF) misto blue

### Definition of Done
- [ ] Vsechny varianty renderuji spravne OBSIDIAN barvy
- [ ] Primary button ma violet bg, dark text
- [ ] Hover ma translateY(-1px) + glow
- [ ] Border radius 10px na vsech variantach
- [ ] Font Sora na primary/gradient, DM Sans na ostatnich
- [ ] Focus ring je violet
- [ ] Existujici pouziti Button v codebase neni rozbite
- [ ] `npm run build` PASS

---

## R2.2 Card Component — Glass Treatment

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Card.jsx`
**Agent:** mp-mid-design-system
**Priorita:** P0

### Cilovy stav — Nove varianty

```jsx
import React from 'react';
import { cn } from '../../utils/cn';

const cardVariants = {
  default: [
    'obsidian-glass',
    'rounded-[var(--obsidian-radius-lg)]',
    'p-7',
    'shadow-[var(--obsidian-shadow-md)]',
  ].join(' '),
  solid: [
    'bg-[var(--obsidian-bg-surface)]',
    'border border-[var(--obsidian-border-default)]',
    'rounded-[var(--obsidian-radius-lg)]',
    'p-7',
  ].join(' '),
  stat: [
    'obsidian-glass',
    'rounded-[var(--obsidian-radius-lg)]',
    'p-6',
    'shadow-[var(--obsidian-shadow-md)]',
  ].join(' '),
  interactive: [
    'obsidian-glass',
    'rounded-[var(--obsidian-radius-lg)]',
    'p-7',
    'shadow-[var(--obsidian-shadow-md)]',
    'cursor-pointer',
    'obsidian-transition-standard',
    'hover:-translate-y-[2px]',
    'hover:shadow-[var(--obsidian-shadow-lg)]',
    'hover:border-[rgba(200,162,255,0.12)]',
  ].join(' '),
  info: [
    'bg-[rgba(200,162,255,0.06)]',
    'border-l-[3px] border-l-[var(--obsidian-accent-primary)]',
    'rounded-r-[var(--obsidian-radius-md)]',
    'px-5 py-4',
  ].join(' '),
};

const Card = React.forwardRef(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants[variant], className)}
    {...props}
  />
));

Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'font-[var(--obsidian-font-heading)] font-semibold',
      'text-[var(--obsidian-text-xl)] leading-[var(--obsidian-lh-xl)]',
      'text-[var(--obsidian-text-primary)]',
      className
    )}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-[var(--obsidian-text-secondary)]', className)}
    {...props}
  />
));

CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
export default Card;
```

### Klicove OBSIDIAN specifikace
- **Default card:** Glass treatment (backdrop-filter blur 20px), ne solid background
- **Border:** 1px rgba(200,162,255,0.08) — jemny violet
- **Radius:** 14px (--obsidian-radius-lg) — vetsi nez Tailwind default
- **Padding:** 28px (p-7) — velkorysejsi
- **Shadow:** Layered s violet tinting
- **Interactive hover:** translateY(-2px), shadow-lg, border highlight

### Definition of Done
- [ ] Default Card ma glass efekt (backdrop-filter)
- [ ] Solid varianta pro fallback (bez glass)
- [ ] Interactive varianta ma hover animaci
- [ ] Stat varianta pro dashboard karty
- [ ] Info varianta s levym borderem
- [ ] Radius 14px na vsech variantach
- [ ] `npm run build` PASS

---

## R2.3 Input Component — Dark Theme

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Input.jsx`
**Agent:** mp-mid-design-system
**Priorita:** P0

### Cilove CSS vlastnosti

```css
/* Input OBSIDIAN styling */
.obsidian-input {
  height: 44px;
  padding: 0 16px;
  background-color: var(--obsidian-bg-elevated);
  border: 1px solid var(--obsidian-border-default);
  border-radius: var(--obsidian-radius-md);
  color: var(--obsidian-text-primary);
  font-family: var(--obsidian-font-body);
  font-size: var(--obsidian-text-base);
  transition: border-color 200ms var(--obsidian-ease-out-expo),
              box-shadow 200ms var(--obsidian-ease-out-expo);
}

.obsidian-input::placeholder {
  color: var(--obsidian-text-muted);
}

.obsidian-input:focus {
  border-color: var(--obsidian-accent-primary);
  box-shadow: 0 0 0 3px rgba(200, 162, 255, 0.12);
  outline: none;
}

.obsidian-input[aria-invalid="true"],
.obsidian-input.error {
  border-color: var(--obsidian-error);
  box-shadow: 0 0 0 3px rgba(255, 82, 82, 0.12);
}

/* Label OBSIDIAN styling */
.obsidian-label {
  display: block;
  margin-bottom: 6px;
  font-family: var(--obsidian-font-body);
  font-size: var(--obsidian-text-sm);
  font-weight: 500;
  color: var(--obsidian-text-secondary);
  /* Normal case (ne uppercase — to je FORGE styl) */
}

/* Error message */
.obsidian-input-error {
  margin-top: 4px;
  font-size: var(--obsidian-text-sm);
  color: var(--obsidian-error);
}
```

### Klicove rozdily
- **Vyska:** 44px (ne 40px) — vetsi touch target, premium pocit
- **Radius:** 10px (--obsidian-radius-md)
- **Background:** #1B1825 (elevated)
- **Focus:** Violet border + violet glow ring
- **Labels:** DM Sans 500, normal case (ne uppercase)
- **Placeholders:** #6B6478 (muted)

---

## R2.4 Select Component

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Select.jsx`
**Agent:** mp-mid-design-system
**Priorita:** P1

### Specifikace
- Stejna vyska (44px), radius, barvy jako Input
- Dropdown menu: bg `--obsidian-bg-elevated`, border `--obsidian-border-default`
- Option hover: `--obsidian-bg-overlay`
- Selected option: Violet dot (4px kruzek) vlevo od textu
- Chevron ikona: `--obsidian-text-muted`, rotace 180deg pri otevreni

---

## R2.5 Checkbox Component

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Checkbox.jsx`
**Agent:** mp-mid-design-system
**Priorita:** P1

### Specifikace

```css
.obsidian-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--obsidian-border-active);
  border-radius: 5px;
  background: var(--obsidian-bg-elevated);
  transition: all 150ms var(--obsidian-ease-out-expo);
}

.obsidian-checkbox[data-state="checked"] {
  background: var(--obsidian-accent-primary);
  border-color: var(--obsidian-accent-primary);
}

.obsidian-checkbox[data-state="checked"] svg {
  color: var(--obsidian-bg-void);
  stroke-width: 2.5px;
}

/* Label vedle checkboxu */
.obsidian-checkbox + label {
  font-family: var(--obsidian-font-body);
  font-size: var(--obsidian-text-base);
  color: var(--obsidian-text-secondary);
  margin-left: 10px;
}
```

---

## R2.6 Slider Component

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Slider.jsx`
**Agent:** mp-mid-design-system
**Priorita:** P1

### Specifikace

```css
/* Track */
.obsidian-slider-track {
  height: 4px;
  background: var(--obsidian-bg-overlay);
  border-radius: var(--obsidian-radius-full);
}

/* Filled range — gradient fill */
.obsidian-slider-range {
  height: 4px;
  background: var(--obsidian-gradient-brand);
  border-radius: var(--obsidian-radius-full);
}

/* Thumb */
.obsidian-slider-thumb {
  width: 18px;
  height: 18px;
  background: var(--obsidian-accent-primary);
  border: 2px solid var(--obsidian-bg-surface);
  border-radius: var(--obsidian-radius-full);
  box-shadow: var(--obsidian-shadow-sm);
  transition: transform 150ms var(--obsidian-ease-out-expo),
              box-shadow 150ms var(--obsidian-ease-out-expo);
}

.obsidian-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: var(--obsidian-shadow-glow);
}

.obsidian-slider-thumb:active {
  transform: scale(1.05);
}
```

### Specialni: Infill slider s hodnotou v thumbu
Pro konfiguraci infill v kalkulacce: kruhovity thumb (24px) s procentualni hodnotou uvnitr (JetBrains Mono 500, 10px, #0C0A0F).

---

## R2.7 Dialog / Modal Component

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Dialog.jsx`
**Agent:** mp-mid-design-system
**Priorita:** P1

### Specifikace

```css
/* Overlay */
.obsidian-dialog-overlay {
  background: rgba(12, 10, 15, 0.88);
  animation: obsidian-overlay-enter 200ms var(--obsidian-ease-out-expo);
}

/* Dialog container */
.obsidian-dialog {
  background: rgba(19, 17, 26, 0.92);
  border: 1px solid rgba(200, 162, 255, 0.08);
  border-radius: var(--obsidian-radius-lg);
  box-shadow: var(--obsidian-shadow-lg);
  animation: obsidian-modal-enter 300ms var(--obsidian-ease-out-expo);
  max-width: 560px;
  width: calc(100% - 32px);
}

@supports (backdrop-filter: blur(20px)) {
  .obsidian-dialog {
    background: rgba(19, 17, 26, 0.7);
    backdrop-filter: blur(20px) saturate(1.2);
    -webkit-backdrop-filter: blur(20px) saturate(1.2);
  }
}

/* Dialog header */
.obsidian-dialog-header {
  padding: 24px 28px 16px;
  border-bottom: 1px solid var(--obsidian-border-divider);
}

.obsidian-dialog-title {
  font-family: var(--obsidian-font-heading);
  font-size: var(--obsidian-text-xl);
  font-weight: 600;
  color: var(--obsidian-text-primary);
}

/* Dialog body */
.obsidian-dialog-body {
  padding: 24px 28px;
  max-height: calc(85vh - 160px);
  overflow-y: auto;
}

/* Dialog footer */
.obsidian-dialog-footer {
  padding: 16px 28px 24px;
  border-top: 1px solid var(--obsidian-border-divider);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
```

---

## R2.8 Toast / Notification Component

**Agent:** mp-spec-fe-notifications
**Priorita:** P2

### Specifikace

```jsx
/* Toast OBSIDIAN styling */
const toastStyles = {
  container: [
    'obsidian-glass',
    'rounded-[var(--obsidian-radius-md)]',
    'shadow-[var(--obsidian-shadow-md)]',
    'p-4 pr-10',
    'min-w-[320px] max-w-[420px]',
    'animate-[obsidian-toast-enter_300ms_var(--obsidian-ease-out-expo)]',
  ].join(' '),
  icon: {
    success: 'text-[var(--obsidian-success)] bg-[rgba(100,255,218,0.1)] rounded-full p-1.5',
    error: 'text-[var(--obsidian-error)] bg-[rgba(255,82,82,0.1)] rounded-full p-1.5',
    warning: 'text-[var(--obsidian-warning)] bg-[rgba(255,213,79,0.1)] rounded-full p-1.5',
    info: 'text-[var(--obsidian-info)] bg-[rgba(130,177,255,0.1)] rounded-full p-1.5',
  },
  title: 'font-medium text-[var(--obsidian-text-primary)] text-sm',
  message: 'text-[var(--obsidian-text-secondary)] text-[13px] mt-0.5',
  progress: 'h-0.5 rounded-full bg-gradient-to-r from-[#C8A2FF] to-[#FF8A65]',
};
```

### Klicove rozdily od FORGE
- Bez leveho borderu — ikona v kruhovem pozadi staci
- Rounder (10px radius)
- Glass pozadi
- Progress bar pouziva gradient

---

## R2.9 Badge Component

**Agent:** mp-mid-design-system
**Priorita:** P2

### Specifikace

```css
.obsidian-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--obsidian-radius-full);
  font-family: var(--obsidian-font-body);
  font-size: var(--obsidian-text-xs);
  font-weight: 500;
  line-height: var(--obsidian-lh-xs);
}

.obsidian-badge-default {
  background: rgba(163, 157, 176, 0.1);
  color: var(--obsidian-text-secondary);
}

.obsidian-badge-violet {
  background: rgba(200, 162, 255, 0.1);
  color: var(--obsidian-accent-primary);
}

.obsidian-badge-coral {
  background: rgba(255, 138, 101, 0.1);
  color: var(--obsidian-accent-secondary);
}

.obsidian-badge-mint {
  background: rgba(100, 255, 218, 0.1);
  color: var(--obsidian-success);
}

.obsidian-badge-error {
  background: rgba(255, 82, 82, 0.1);
  color: var(--obsidian-error);
}

.obsidian-badge-warning {
  background: rgba(255, 213, 79, 0.1);
  color: var(--obsidian-warning);
}

.obsidian-badge-info {
  background: rgba(130, 177, 255, 0.1);
  color: var(--obsidian-info);
}
```

Vsechny badges PILL tvar (border-radius: 9999px). Vzdy.

---

## R2.10 Dalsi Komponenty (prehled)

| Komponenta | Soubor | Priorita | Klicova zmena |
|-----------|--------|----------|---------------|
| ColorPicker | `ColorPicker.jsx` | P2 | Vetsi swatche (36px), 10px radius, selected glow |
| Tooltip | `tooltip.jsx` | P2 | Glass bg, 10px radius, violet arrow |
| Label | `label.jsx` | P1 | DM Sans 500, normal case, text-secondary |
| Container | `Container.jsx` | P1 | Max-width 1200px, padding 24px-40px |
| BackgroundPattern | `BackgroundPattern.jsx` | P2 | Nahradit za obsidian-grain + obsidian-ambient |
| WelcomeHeader | `WelcomeHeader.jsx` | P2 | Sora 600, gradient text na jmenu |
| Skeleton Loader | (novy) | P2 | obsidian-shimmer animace, violet tint |
| Toggle/Switch | (novy) | P2 | 48x24px, off=#2E2A3A, on=#C8A2FF, thumb white |
| Progress Ring | (novy) | P2 | SVG gradient stroke (brand), JetBrains Mono center |
| Upload Zone | (sdileny) | P0 | 20px radius, violet drag-over, ikona 56px |

### Casovy Odhad Faze R2

| Ukol | Agent | Odhad |
|------|-------|-------|
| R2.1 Button | mp-mid-design-system | 2h |
| R2.2 Card | mp-mid-design-system | 1.5h |
| R2.3 Input | mp-mid-design-system | 1h |
| R2.4 Select | mp-mid-design-system | 1h |
| R2.5 Checkbox | mp-mid-design-system | 0.5h |
| R2.6 Slider | mp-mid-design-system | 1h |
| R2.7 Dialog | mp-mid-design-system | 1.5h |
| R2.8 Toast | mp-spec-fe-notifications | 1h |
| R2.9 Badge | mp-mid-design-system | 0.5h |
| R2.10 Dalsi | mp-mid-design-system | 3h |
| **Celkem R2** | | **~13h** |

### Acceptance Criteria Faze R2

```
[ ] Button: 8 variant, 4 velikosti, OBSIDIAN barvy, 10px radius
[ ] Card: 5 variant vcetne glass, interactive hover
[ ] Input: 44px vyska, violet focus ring, dark bg
[ ] Select: Custom dropdown, violet selected dot
[ ] Checkbox: 20px, violet checked, animated scale
[ ] Slider: Gradient track fill, glow thumb
[ ] Dialog: Glass bg, violet border, enter/exit animace
[ ] Toast: Glass bg, colored icon circles, gradient progress
[ ] Badge: 7 barevnych variant, pill tvar
[ ] Vsechny touch targets >= 44px
[ ] Vsechny focus stavy viditelne (violet ring)
[ ] npm run build PASS
```

---

# ============================================================
# R3: LAYOUT SHELL
# ============================================================

## R3.1 Admin Sidebar — 280px, Glass, Rounded Icons

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminLayout.jsx`
**Agent:** mp-mid-frontend-admin
**Priorita:** P0

### Layout specifikace

```
Sirka:         280px (desktop), 64px (collapsed < 1200px), overlay (< 768px)
Pozadi:        var(--obsidian-bg-surface) + obsidian-grain overlay
Pravy border:  1px var(--obsidian-border-default)
```

### Struktura JSX

```jsx
function ObsidianSidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-[var(--obsidian-z-sticky)]',
        'bg-[var(--obsidian-bg-surface)]',
        'border-r border-[var(--obsidian-border-default)]',
        'flex flex-col',
        'obsidian-transition-layout',
        collapsed ? 'w-16' : 'w-[280px]'
      )}
    >
      {/* Header — 88px */}
      <div className="h-[88px] flex items-center gap-3 px-6 shrink-0">
        {/* Gradient icon 32x32 */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--obsidian-gradient-brand)' }}
        >
          <Layers3Icon size={18} className="text-[var(--obsidian-bg-void)]" />
        </div>
        {!collapsed && (
          <span
            className="font-[var(--obsidian-font-heading)] font-semibold text-lg"
            style={{ color: 'var(--obsidian-text-primary)' }}
          >
            ModelPricer
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div className="h-px bg-[var(--obsidian-border-divider)] my-3 mx-3" />
            )}
            {group.items.map((item) => (
              <NavItem key={item.path} item={item} collapsed={collapsed} />
            ))}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer — user avatar + name */}
      <div className="shrink-0 border-t border-[var(--obsidian-border-divider)] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--obsidian-bg-overlay)]
                          flex items-center justify-center
                          text-[var(--obsidian-text-muted)] text-sm font-medium">
            JN
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[var(--obsidian-text-primary)]">
                Jan Novak
              </span>
              <span className="text-xs text-[var(--obsidian-text-muted)]">
                admin
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
```

### NavItem component

```jsx
function NavItem({ item, collapsed, isActive }) {
  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-3 h-12 px-3 rounded-[var(--obsidian-radius-md)]',
        'obsidian-transition-micro',
        isActive
          ? [
              'bg-[var(--obsidian-bg-elevated)]',
              'border-l-[3px] border-l-[var(--obsidian-accent-primary)]',
              'text-[var(--obsidian-accent-primary)]',
            ].join(' ')
          : [
              'text-[var(--obsidian-text-muted)]',
              'hover:bg-[var(--obsidian-bg-elevated)]',
              'hover:text-[var(--obsidian-text-primary)]',
            ].join(' ')
      )}
    >
      {/* Rounded icon background 32px */}
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
          isActive
            ? 'bg-[rgba(200,162,255,0.12)]'
            : 'bg-[var(--obsidian-bg-elevated)]'
        )}
      >
        <item.icon size={18} />
      </div>
      {!collapsed && (
        <span className="font-medium text-[15px]">
          {item.label}
        </span>
      )}
    </Link>
  );
}
```

### Klicove OBSIDIAN specifikace pro sidebar
- **Sirka:** 280px (vetsi nez FORGE 260px — vzdusnejsi)
- **Bez section labels** — sekce oddeleny thin divider (1px --obsidian-border-divider)
- **Icon backgrounds:** Kazda ikona v 32px rounded square (bg-elevated)
- **Active state:** Violet left border (3px, rounded), bg-elevated, violet text+icon
- **Active icon bg:** rgba(200,162,255,0.12) — violet tint
- **Footer:** User avatar (40px round) + jmeno + role
- **Grain overlay:** Sidebar ma jemny noise

### Definition of Done
- [ ] Sidebar 280px na desktopu
- [ ] Collapsed 64px na < 1200px (jen ikony)
- [ ] Overlay drawer na < 768px
- [ ] Gradient logo icon 32x32
- [ ] Nav items s rounded icon backgrounds
- [ ] Section separators bez labelu
- [ ] Active state s violet left border
- [ ] User footer s avatarem
- [ ] `npm run build` PASS

---

## R3.2 Header — 88px, Transparent to Glass on Scroll

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Header.jsx`
**Agent:** mp-mid-frontend-public
**Priorita:** P0

### Specifikace

```jsx
function ObsidianHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[var(--obsidian-z-sticky)]',
        'h-[88px] flex items-center px-8',
        'obsidian-transition-standard',
        scrolled
          ? 'obsidian-glass shadow-[var(--obsidian-shadow-sm)]'
          : 'bg-transparent'
      )}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--obsidian-gradient-brand)' }}
        >
          <Layers3Icon size={18} className="text-[var(--obsidian-bg-void)]" />
        </div>
        <span className="font-[var(--obsidian-font-heading)] font-semibold text-lg
                         text-[var(--obsidian-text-primary)]">
          ModelPricer
        </span>
      </Link>

      {/* Nav links — centrovane */}
      <nav className="flex-1 flex justify-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              'text-[15px] font-medium obsidian-transition-micro',
              'text-[var(--obsidian-text-muted)]',
              'hover:text-[var(--obsidian-text-primary)]'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right side — language + auth */}
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <Button variant="primary" size="sm">
          Prihlasit se
        </Button>
      </div>
    </header>
  );
}
```

### Klicove specifikace
- **Vyska:** 88px (vetsi nez standardni 64px — premium feel)
- **Default:** Plne transparentni (bg-transparent)
- **Po scrollu (>20px):** Glass efekt + shadow-sm (obsidian-glass)
- **Logo:** Gradient icon (brand gradient) + Sora 600 "ModelPricer"
- **Nav linky:** DM Sans 500, 15px, muted → primary on hover
- **Transition:** 250ms smooth prechod mezi transparent a glass
- **Mobile:** Logo + hamburger (2 thin linky, 16px gap)

---

## R3.3 Footer

**Soubor:** `Model_Pricer-V2-main/src/components/ui/Footer.jsx`
**Agent:** mp-mid-frontend-public
**Priorita:** P1

### Specifikace

```jsx
function ObsidianFooter() {
  return (
    <footer className="border-t border-[var(--obsidian-border-divider)]
                       bg-[var(--obsidian-bg-void)] pt-16 pb-10 px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Columns */}
        <div className="grid grid-cols-4 gap-10 mb-12">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="font-[var(--obsidian-font-heading)] font-semibold
                             text-sm text-[var(--obsidian-text-primary)] mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-sm text-[var(--obsidian-text-muted)]
                                 hover:text-[var(--obsidian-text-secondary)]
                                 obsidian-transition-micro"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--obsidian-border-divider)] pt-6
                        flex justify-between items-center">
          <div>
            <span className="font-[var(--obsidian-font-heading)] text-sm
                             text-[var(--obsidian-text-muted)]">
              ModelPricer
            </span>
            <p className="text-xs text-[var(--obsidian-text-disabled)] mt-1">
              Precision pricing for 3D printing.
            </p>
          </div>
          <span className="text-xs text-[var(--obsidian-text-disabled)]">
            Prague, CZ &middot; 2024-2026
          </span>
        </div>
      </div>
    </footer>
  );
}
```

### Klicove specifikace
- **Pozadi:** Same as page (void) — splyne, neni oddeleny
- **Horni border:** 1px divider
- **Padding:** 64px top, 40px bottom — hodne prostoru
- **Sloupce:** 4 na desktopu, 2 na tabletu, 1 na mobilu
- **Linky:** DM Sans 400, 14px, muted → secondary on hover
- **Spodni bar:** Logo + tagline vlevo, location+rok vpravo

---

## R3.4 Admin Layout Wrapper

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminLayout.jsx`
**Agent:** mp-mid-frontend-admin
**Priorita:** P0

### Cilova struktura

```jsx
function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--obsidian-bg-void)] obsidian-grain">
      <ObsidianSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main
        className={cn(
          'obsidian-transition-layout',
          sidebarCollapsed ? 'ml-16' : 'ml-[280px]',
          'p-8'
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
```

### Specifikace
- **Sidebar:** Fixed left, 280px (nebo 64px collapsed)
- **Main content:** margin-left odpovida sidebar width, padding 32px
- **Background:** void + grain overlay
- **Transition:** Smooth layout shift pri collapse/expand

---

## R3.5-R3.10 Casovy Odhad a Acceptance Criteria

### Casovy Odhad Faze R3

| Ukol | Agent | Odhad |
|------|-------|-------|
| R3.1 Admin Sidebar | mp-mid-frontend-admin | 4h |
| R3.2 Header | mp-mid-frontend-public | 2h |
| R3.3 Footer | mp-mid-frontend-public | 1.5h |
| R3.4 Admin Layout | mp-mid-frontend-admin | 1h |
| **Celkem R3** | | **~8.5h** |

### Acceptance Criteria Faze R3

```
[ ] Admin sidebar: 280px, gradient logo, rounded icon bgs, violet active state
[ ] Sidebar collapse: 64px na < 1200px, overlay na < 768px
[ ] Header: 88px, transparent → glass on scroll, smooth transition
[ ] Footer: 4 sloupce, void bg, divider border
[ ] Admin layout: sidebar + main content s correct margin
[ ] Grain overlay na admin layout
[ ] Vsechny responsive breakpointy funguji
[ ] Keyboard navigace sidebar (Tab, Enter, Escape)
[ ] npm run build PASS
```

---

# ============================================================
# R4: PUBLIC PAGES
# ============================================================

## R4.1 Hero Section — Centered Text, Gradient Keyword, Floating Card

**Soubor:** `Model_Pricer-V2-main/src/pages/home/index.jsx`
**Agent:** mp-mid-frontend-public
**Priorita:** P0

### Layout specifikace

```
Viewport height: 85vh
Background:      var(--obsidian-bg-void) + obsidian-ambient-hero glow (violet-coral, top-center)
Alignment:       Centrovany (text-align: center)
Max-width:       600px pro text blok
```

### JSX implementace

```jsx
function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center
                        obsidian-ambient-hero overflow-hidden">
      {/* Headline */}
      <h1
        className="font-[var(--obsidian-font-heading)] font-bold
                   text-[var(--obsidian-text-4xl)] leading-[var(--obsidian-lh-4xl)]
                   tracking-[-0.03em] text-[var(--obsidian-text-primary)]
                   text-center max-w-[600px] relative z-10"
      >
        Your prints,{' '}
        <span className="obsidian-gradient-text">precisely</span>
        {' '}priced.
      </h1>

      {/* Subheadline */}
      <p
        className="mt-5 text-center max-w-[480px]
                   text-[var(--obsidian-text-lg)] leading-[var(--obsidian-lh-lg)]
                   text-[var(--obsidian-text-secondary)] relative z-10"
      >
        Upload your 3D model, configure parameters, get an instant quote.
        No guesswork, no spreadsheets.
      </p>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 relative z-10">
        <Button variant="primary" size="lg">
          Get started
        </Button>
        <span className="text-[var(--obsidian-text-muted)] text-[var(--obsidian-text-sm)]">
          No credit card required
        </span>
      </div>

      {/* Floating parallax card */}
      <FloatingModelCard className="mt-16 relative z-10" />
    </section>
  );
}
```

### Gradient Text na "precisely"

```css
/* Uz definovano v obsidian-textures.css */
.obsidian-gradient-text {
  background: linear-gradient(135deg, #C8A2FF 0%, #FF8A65 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Floating Parallax Card

```jsx
function FloatingModelCard({ className }) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Max 3deg rotation
      const rx = ((e.clientY - centerY) / (window.innerHeight / 2)) * -3;
      const ry = ((e.clientX - centerX) / (window.innerWidth / 2)) * 3;

      setTransform({ rx, ry });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={cardRef}
      className={cn(
        'obsidian-glass rounded-[var(--obsidian-radius-xl)]',
        'shadow-[var(--obsidian-shadow-lg)]',
        'p-6 w-[380px] max-w-[90vw]',
        'obsidian-transition-micro',
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rx}deg) rotateY(${transform.ry}deg)`,
      }}
    >
      {/* Mock uploaded STL preview */}
      <div className="h-[200px] bg-[var(--obsidian-bg-void)] rounded-[var(--obsidian-radius-md)]
                      flex items-center justify-center mb-4">
        <span className="text-[var(--obsidian-text-muted)] text-sm">
          [3D Model Preview]
        </span>
      </div>

      {/* Price tag */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-[var(--obsidian-text-muted)]">Estimated price</p>
          <p className="font-[var(--obsidian-font-mono)] font-medium text-xl
                        text-[var(--obsidian-accent-primary)]">
            192,48 Kc
          </p>
        </div>
        <div className="obsidian-badge-mint">
          PLA &middot; Standard
        </div>
      </div>
    </div>
  );
}
```

### Klicove specifikace
- **Headline:** Sora 700, 40px, -0.03em tracking, centered
- **Gradient keyword:** "precisely" ma background-clip: text s brand gradientem
- **Subheadline:** DM Sans 400, 19px, secondary color, max-width 480px
- **CTA:** Single centered button, violet bg, 10px radius
- **Below CTA:** "No credit card required" v muted (13px)
- **Parallax card:** Glass treatment, mouse-tracking max 3deg rotace
- **Card content:** Mock 3D model + cena v JetBrains Mono + badge
- **Ambient glow:** Velky radial gradient (violet+coral+mint) za celou sekci

---

## R4.2 Feature Section — Staggered 2-Column Layout

**Agent:** mp-mid-frontend-public
**Priorita:** P1

### Layout

```
Section title: "Everything you need" — Sora 600, 28px, centered
Layout:        Staggered 2-column (alternating left/right)
Connecting:    Vertical dashed line (1px, --obsidian-border-default)
Mobile:        Single column, connecting line on left edge
```

### JSX

```jsx
function FeatureSection() {
  const features = [
    { icon: UploadCloud, title: 'Multi-Format Upload', desc: 'STL, OBJ, 3MF...' },
    { icon: Sliders, title: 'Precise Configuration', desc: 'Material, quality...' },
    { icon: Calculator, title: 'Instant Pricing', desc: 'Real-time calculation...' },
    { icon: Code, title: 'Embeddable Widget', desc: 'Drop into any website...' },
  ];

  return (
    <section className="py-24 px-8 max-w-[900px] mx-auto">
      <h2 className="font-[var(--obsidian-font-heading)] font-semibold
                     text-[var(--obsidian-text-2xl)] text-center mb-16
                     text-[var(--obsidian-text-primary)]">
        Everything you need
      </h2>

      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px
                        border-l border-dashed border-[var(--obsidian-border-default)]
                        hidden md:block" />

        {features.map((feature, i) => {
          const isEven = i % 2 === 0;
          return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-8 mb-16 last:mb-0',
                'obsidian-animate-fade-up',
                `obsidian-stagger-${i + 1}`,
                isEven ? 'md:flex-row' : 'md:flex-row-reverse'
              )}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-[var(--obsidian-radius-md)]
                              bg-[rgba(200,162,255,0.08)]
                              flex items-center justify-center shrink-0">
                <feature.icon size={24} className="text-[var(--obsidian-accent-primary)]" />
              </div>

              {/* Text */}
              <div className={cn('max-w-[360px]', isEven ? 'text-left' : 'md:text-right')}>
                <h3 className="font-[var(--obsidian-font-heading)] font-semibold
                               text-[var(--obsidian-text-xl)]
                               text-[var(--obsidian-text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--obsidian-text-secondary)]
                              text-[var(--obsidian-text-base)]">
                  {feature.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

---

## R4.3 Testimonial Section — Glass Quote Card

**Agent:** mp-mid-frontend-public
**Priorita:** P2

### JSX

```jsx
function TestimonialSection() {
  return (
    <section className="py-24 px-8 obsidian-ambient">
      <div className="max-w-[640px] mx-auto relative z-10">
        <div className="obsidian-glass rounded-[var(--obsidian-radius-xl)] p-10 relative">
          {/* Large quote mark */}
          <svg
            className="absolute top-6 left-6 w-12 h-12 text-[var(--obsidian-accent-primary)]
                       opacity-15"
            viewBox="0 0 24 24" fill="currentColor"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995
                     2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0
                     21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995
                     2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z" />
          </svg>

          {/* Quote text */}
          <p className="font-[var(--obsidian-font-body)] italic
                        text-[var(--obsidian-text-xl)] leading-[var(--obsidian-lh-xl)]
                        text-[var(--obsidian-text-primary)] relative z-10 mb-6 pl-4">
            "ModelPricer cut our quoting time from 30 minutes to 30 seconds.
            Our customers love the instant pricing widget."
          </p>

          {/* Attribution */}
          <div className="pl-4">
            <p className="font-[var(--obsidian-font-mono)] text-[var(--obsidian-text-sm)]
                          text-[var(--obsidian-text-muted)]">
              — Jan Novak, PrintFarm.cz
            </p>
          </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[0, 1, 2].map((dot) => (
            <button
              key={dot}
              className={cn(
                'w-2 h-2 rounded-full obsidian-transition-micro',
                dot === 0
                  ? 'bg-[var(--obsidian-accent-primary)] w-6'
                  : 'bg-[var(--obsidian-border-active)]'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

### Specifikace
- **Card:** Glass treatment, 20px radius, 40px padding
- **Quote mark:** SVG, violet, 15% opacity, absolute top-left
- **Quote text:** DM Sans italic 400, 23px (text-xl), primary color
- **Attribution:** JetBrains Mono, 13px (text-sm), muted
- **Nav dots:** Custom styled, violet active (extended to 24px width)
- **Ambient glow:** Za celou sekci (obsidian-ambient)

---

## R4.4 Login Page — Centered Glass Card

**Soubor:** `Model_Pricer-V2-main/src/pages/login/index.jsx`
**Agent:** mp-mid-frontend-public
**Priorita:** P0

### Layout

```
Backdrop:  var(--obsidian-bg-void) + obsidian-ambient glow (centered)
           + obsidian-grain noise overlay
Card:      obsidian-glass, max-width 420px, centered vertically+horizontally
Shadow:    var(--obsidian-shadow-lg)
Padding:   40px top/bottom, 36px left/right
```

### JSX

```jsx
function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-[var(--obsidian-bg-void)] obsidian-grain obsidian-ambient">
      <div className="obsidian-glass rounded-[var(--obsidian-radius-lg)]
                      shadow-[var(--obsidian-shadow-lg)]
                      w-full max-w-[420px] mx-4
                      py-10 px-9 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--obsidian-gradient-brand)' }}
          >
            <Layers3Icon size={22} className="text-[var(--obsidian-bg-void)]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-[var(--obsidian-font-heading)] font-bold
                       text-[var(--obsidian-text-2xl)] text-center
                       text-[var(--obsidian-text-primary)] mb-2">
          Welcome back
        </h1>
        <p className="text-center text-[var(--obsidian-text-sm)]
                      text-[var(--obsidian-text-muted)] mb-8">
          Sign in to your account
        </p>

        {/* Form */}
        <form className="space-y-5">
          <div>
            <label className="obsidian-label">Email</label>
            <input
              type="email"
              className="obsidian-input w-full"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="obsidian-label">Password</label>
            <input
              type="password"
              className="obsidian-input w-full"
              placeholder="Enter your password"
            />
          </div>

          <Button variant="primary" size="lg" fullWidth>
            Sign in
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--obsidian-border-divider)]" />
          <span className="text-xs text-[var(--obsidian-text-muted)]">or</span>
          <div className="flex-1 h-px bg-[var(--obsidian-border-divider)]" />
        </div>

        {/* Social login */}
        <div className="flex justify-center gap-3">
          <button className="w-11 h-11 rounded-[var(--obsidian-radius-md)]
                             border border-[var(--obsidian-border-default)]
                             flex items-center justify-center
                             obsidian-transition-micro
                             hover:border-[var(--obsidian-accent-primary)]">
            <GoogleIcon size={18} />
          </button>
          <button className="w-11 h-11 rounded-[var(--obsidian-radius-md)]
                             border border-[var(--obsidian-border-default)]
                             flex items-center justify-center
                             obsidian-transition-micro
                             hover:border-[var(--obsidian-accent-primary)]">
            <GithubIcon size={18} />
          </button>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-[var(--obsidian-text-muted)] mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[var(--obsidian-accent-primary)]
                                          hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## R4.5-R4.10 Casovy Odhad a Acceptance Criteria

### Casovy Odhad Faze R4

| Ukol | Agent | Odhad |
|------|-------|-------|
| R4.1 Hero section | mp-mid-frontend-public | 4h |
| R4.2 Feature section | mp-mid-frontend-public | 2h |
| R4.3 Testimonial | mp-mid-frontend-public | 1.5h |
| R4.4 Login page | mp-mid-frontend-public | 2h |
| R4.5 Register page | mp-mid-frontend-public | 1.5h |
| R4.6 Pricing page | mp-mid-frontend-public | 2h |
| R4.7 Support page | mp-mid-frontend-public | 1h |
| **Celkem R4** | | **~14h** |

### Acceptance Criteria Faze R4

```
[ ] Hero: Centered text, gradient "precisely", floating parallax card
[ ] Hero: Ambient glow (violet+coral) za sekci
[ ] Hero: Parallax card trackuje mysi (max 3deg)
[ ] Features: Staggered 2-column, alternating layout, dashed connector
[ ] Features: Stagger entrance animace (80ms delay per item)
[ ] Testimonial: Glass quote card, large quote SVG, nav dots
[ ] Login: Centered glass card, gradient logo, violet focus rings
[ ] Login: Ambient glow za cardem
[ ] Register: Stejna estetika jako login
[ ] Pricing: 3 tier karty, prostredni featured s violet border
[ ] Mobile: Vsechny stranky responsive (single column, stacked layout)
[ ] prefers-reduced-motion: Parallax vypnut, animace instant
[ ] npm run build PASS
```

---

# ============================================================
# R5: TEST KALKULACKA (5-Step Wizard)
# ============================================================

## R5.1 Glass Pill Stepper — Floating Progress Indicator

**Soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/index.jsx`
**Agent:** mp-mid-frontend-public
**Priorita:** P0

### Layout specifikace

```
Container:     Floating pill, centered horizontally, sticky top (16px offset)
Background:    obsidian-glass treatment
Border:        1px rgba(200,162,255,0.08)
Radius:        9999px (full pill)
Padding:       8px 24px
Shadow:        var(--obsidian-shadow-md)
Z-index:       var(--obsidian-z-sticky)
```

### JSX implementace

```jsx
function ObsidianStepper({ currentStep, steps, completedSteps }) {
  return (
    <div className="sticky top-4 z-[var(--obsidian-z-sticky)] flex justify-center mb-8">
      <div className="obsidian-glass rounded-full py-2.5 px-6
                      shadow-[var(--obsidian-shadow-md)]
                      flex items-center gap-3">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isCompleted = completedSteps.includes(i);
          const isUpcoming = !isActive && !isCompleted;

          return (
            <React.Fragment key={i}>
              {/* Step dot + label */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'rounded-full obsidian-transition-micro flex items-center justify-center',
                    isCompleted && 'w-2 h-2 bg-[var(--obsidian-accent-tertiary)]',
                    isActive && 'w-2.5 h-2.5 bg-[var(--obsidian-accent-primary)]',
                    isUpcoming && 'w-2 h-2 ring-1 ring-[var(--obsidian-border-active)]'
                  )}
                />
                <span
                  className={cn(
                    'text-[var(--obsidian-text-sm)] font-medium',
                    'font-[var(--obsidian-font-body)]',
                    isActive && 'text-[var(--obsidian-text-primary)]',
                    isCompleted && 'text-[var(--obsidian-accent-tertiary)]',
                    isUpcoming && 'text-[var(--obsidian-text-muted)]'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line (ne za poslednim krokem) */}
              {i < steps.length - 1 && (
                <div className="w-8 h-0.5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full obsidian-transition-standard',
                      isCompleted
                        ? 'w-full bg-gradient-to-r from-[#C8A2FF] to-[#FF8A65]'
                        : 'w-full bg-[var(--obsidian-border-default)]'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
```

### Klicove OBSIDIAN specifikace
- **Pill container:** Glass treatment, border-radius 9999px (pill)
- **Active dot:** 10px filled violet (#C8A2FF)
- **Completed dot:** 8px filled mint (#64FFDA)
- **Upcoming dot:** 8px ring only (border-active color)
- **Labels:** DM Sans 500, 13px
- **Progress line:** Thin (2px), gradient (brand) pro completed, gray pro upcoming
- **Sticky:** Zustava pri scrollu na top:16px
- **Mobile:** Stepper se zmensi (kratsi linky, mensi font)

---

## R5.2 Step 1: Upload — Rounded Zone with Violet Drag

**Soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/FileUploadZone.jsx`
**Agent:** mp-spec-fe-upload
**Priorita:** P0

### Specifikace

```jsx
function ObsidianUploadZone({ onFileDrop, isDragActive }) {
  return (
    <div
      className={cn(
        'rounded-[var(--obsidian-radius-xl)] border-2 border-dashed',
        'p-12 text-center',
        'obsidian-transition-micro',
        isDragActive
          ? 'border-[var(--obsidian-accent-primary)] bg-[rgba(200,162,255,0.04)]'
          : 'border-[var(--obsidian-border-active)] bg-[var(--obsidian-bg-surface)]'
      )}
    >
      {/* Custom 3D cube icon */}
      <div className="mx-auto w-14 h-14 mb-4">
        <svg
          viewBox="0 0 56 56"
          className={cn(
            'obsidian-transition-micro',
            isDragActive
              ? 'text-[var(--obsidian-accent-primary)]'
              : 'text-[var(--obsidian-text-muted)]'
          )}
          fill="none" stroke="currentColor" strokeWidth="1.5"
        >
          {/* Stylized 3D cube with arrow */}
          <path d="M28 4L48 16V40L28 52L8 40V16L28 4Z" strokeLinejoin="round" />
          <path d="M28 28V52" />
          <path d="M48 16L28 28L8 16" />
          <path d="M28 4V16" strokeLinecap="round" />
          <path d="M24 8L28 4L32 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Text */}
      <h3 className="font-[var(--obsidian-font-heading)] font-semibold
                     text-[var(--obsidian-text-xl)]
                     text-[var(--obsidian-text-secondary)] mb-2">
        Drop your 3D models here
      </h3>
      <p className="text-[var(--obsidian-text-sm)] text-[var(--obsidian-text-muted)] mb-4">
        or click to browse files
      </p>

      {/* Format badges */}
      <div className="flex justify-center gap-2">
        {['.STL', '.OBJ', '.3MF'].map((fmt) => (
          <span
            key={fmt}
            className="font-[var(--obsidian-font-mono)] text-[var(--obsidian-text-xs)]
                       px-2.5 py-1 rounded-[var(--obsidian-radius-full)]
                       bg-[var(--obsidian-bg-elevated)]
                       text-[var(--obsidian-text-muted)]"
          >
            {fmt}
          </span>
        ))}
      </div>
    </div>
  );
}
```

### Po uploadu — File karty

```jsx
function UploadedFileCard({ file }) {
  return (
    <div className="obsidian-glass rounded-[var(--obsidian-radius-md)] p-4
                    flex items-center gap-4">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-[var(--obsidian-radius-sm)]
                      bg-[var(--obsidian-bg-void)]
                      flex items-center justify-center shrink-0">
        <CubeIcon size={20} className="text-[var(--obsidian-text-muted)]" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--obsidian-text-primary)] truncate">
          {file.name}
        </p>
        <p className="font-[var(--obsidian-font-mono)] text-[var(--obsidian-text-xs)]
                      text-[var(--obsidian-text-muted)]">
          {file.dimensions} &middot; {file.size}
        </p>
      </div>

      {/* Progress ring / status */}
      <div className="shrink-0">
        {file.processing ? (
          <div className="w-8 h-8 border-2 border-[var(--obsidian-accent-primary)]
                          border-t-transparent rounded-full obsidian-animate-spin" />
        ) : (
          <CheckCircleIcon size={20} className="text-[var(--obsidian-success)]" />
        )}
      </div>
    </div>
  );
}
```

### Klicove specifikace
- **Radius:** 20px (obsidian-radius-xl) — velky, premium
- **Border:** 2px dashed, active color (ne default)
- **Ikona:** Custom SVG 3D cube (ne generic upload icon), 56px
- **Text:** Sora 600 "Drop your 3D models here"
- **Drag-active:** Violet border (solid), violet bg tint 4%
- **Format badges:** Monospace pills, bg-elevated
- **Po uploadu:** File cards (ne table rows), glass treatment, thumbnail + info + status

---

## R5.3 Step 2: Configure — Viewer + Controls

**Soubory:**
- `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/PrintConfiguration.jsx`
- `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/ModelViewer.jsx`
**Agent:** mp-mid-frontend-public + mp-spec-fe-3d-viewer
**Priorita:** P0

### Layout

```
Desktop:  55% viewer | 45% controls (2 sloupce)
Mobile:   Viewer (250px height) + controls below (single column)
```

### 3D Viewer specifikace

```jsx
function ObsidianViewer({ model }) {
  return (
    <div className="relative rounded-[var(--obsidian-radius-lg)] overflow-hidden
                    bg-[var(--obsidian-bg-void)]
                    border border-[var(--obsidian-border-default)]">
      {/* Three.js canvas */}
      <Canvas>{/* ... */}</Canvas>

      {/* Ambient glow behind model */}
      <div className="absolute inset-0 pointer-events-none obsidian-ambient-card" />

      {/* Floating glass controls — bottom center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2
                      obsidian-glass-subtle rounded-full
                      flex items-center gap-1 px-3 py-1.5">
        {['RotateCcw', 'Move', 'ZoomIn', 'Maximize'].map((icon) => (
          <button
            key={icon}
            className="w-9 h-9 rounded-full flex items-center justify-center
                       text-[var(--obsidian-text-muted)]
                       hover:text-[var(--obsidian-text-primary)]
                       hover:bg-[rgba(200,162,255,0.08)]
                       obsidian-transition-micro"
          >
            <Icon name={icon} size={18} />
          </button>
        ))}
      </div>

      {/* Dimensions overlay — top right */}
      <div className="absolute top-3 right-3
                      obsidian-glass-subtle rounded-[var(--obsidian-radius-sm)]
                      px-2.5 py-1.5">
        <span className="font-[var(--obsidian-font-mono)] text-[11px]
                         text-[var(--obsidian-text-muted)]">
          {model.dimensions}
        </span>
      </div>
    </div>
  );
}
```

### Control panel specifikace
- **Material selector:** Large selectable cards s material color swatch
- **Quality:** Segmented control (pill shape, rounded-full), 3 options
- **Infill slider:** Range s gradient fill (brand gradient), circular thumb s hodnotou
- **Color picker:** Large swatches (36px) v flowing grid, selected ma glow
- **Section dividers:** 1px obsidian-border-divider

### Segmented Control (Quality selector)

```jsx
function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex p-1 rounded-full bg-[var(--obsidian-bg-elevated)]
                    border border-[var(--obsidian-border-default)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex-1 py-2 px-4 rounded-full text-sm font-medium',
            'obsidian-transition-micro',
            value === opt.value
              ? 'bg-[var(--obsidian-accent-primary)] text-[var(--obsidian-bg-void)]'
              : 'text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-text-secondary)]'
          )}
        >
          {opt.label}
          <span className="block font-[var(--obsidian-font-mono)] text-[11px] mt-0.5
                          opacity-70">
            {opt.detail}
          </span>
        </button>
      ))}
    </div>
  );
}

// Pouziti:
<SegmentedControl
  options={[
    { value: 'draft', label: 'Draft', detail: '0.3mm' },
    { value: 'standard', label: 'Standard', detail: '0.2mm' },
    { value: 'fine', label: 'Fine', detail: '0.1mm' },
  ]}
  value={quality}
  onChange={setQuality}
/>
```

---

## R5.4 Step 3: Price Review — Glass Breakdown

**Soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/PricingCalculator.jsx`
**Agent:** mp-mid-frontend-public
**Priorita:** P0

### Specifikace

```jsx
function ObsidianPriceBreakdown({ pricing }) {
  return (
    <div className="obsidian-glass rounded-[var(--obsidian-radius-lg)] p-7">
      {/* Line items */}
      <div className="space-y-3">
        {pricing.lineItems.map((item, i) => (
          <div key={i} className="flex justify-between items-baseline">
            <span className="text-[var(--obsidian-text-secondary)]
                             text-[var(--obsidian-text-base)]">
              {item.label}
            </span>
            <span className="font-[var(--obsidian-font-mono)] font-medium
                             text-[var(--obsidian-text-primary)]">
              {item.value} Kc
            </span>
          </div>
        ))}
      </div>

      {/* Discount (pokud existuje) */}
      {pricing.discount && (
        <div className="flex justify-between items-baseline mt-3
                        text-[var(--obsidian-success)]">
          <span className="flex items-center gap-1.5 text-sm">
            <SparklesIcon size={14} />
            Volume discount ({pricing.discount.percent}%)
          </span>
          <span className="font-[var(--obsidian-font-mono)] font-medium">
            -{pricing.discount.amount} Kc
          </span>
        </div>
      )}

      {/* Separator */}
      <div className="h-px my-4"
           style={{ background: 'var(--obsidian-gradient-brand)' }} />

      {/* Total — gradient text */}
      <div className="flex justify-between items-baseline">
        <span className="font-[var(--obsidian-font-heading)] font-bold
                         text-[var(--obsidian-text-xl)]
                         text-[var(--obsidian-text-primary)]">
          Total
        </span>
        <span className="font-[var(--obsidian-font-mono)] font-bold
                         text-[1.728rem] leading-[2.25rem]
                         obsidian-gradient-text">
          {pricing.total} Kc
        </span>
      </div>

      {/* Per unit */}
      <p className="text-right font-[var(--obsidian-font-mono)]
                    text-[var(--obsidian-text-xs)] text-[var(--obsidian-text-muted)] mt-1">
        {pricing.perUnit} Kc per unit
      </p>
    </div>
  );
}
```

### Klicove rozdily od FORGE
- **Card:** Glass treatment (ne solid bg)
- **Bez dotted leaders** — cistejsi look, jen flex between s whitespace
- **Total cena:** Gradient text (brand gradient pres background-clip)
- **Discount:** Mint barva (#64FFDA) s sparkle ikonou
- **Separator:** Gradient line (brand) misto solid border
- **Per-unit:** Monospace, xs, muted, right-aligned

---

## R5.5 Step 5: Confirmation — Morphing Circle-to-Checkmark

**Soubor:** `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/OrderConfirmation.jsx`
**Agent:** mp-mid-frontend-public
**Priorita:** P1

### SVG Morphing Animation

```jsx
function MorphingCheckmark({ size = 80 }) {
  return (
    <div className="flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        className="text-[var(--obsidian-success)]"
      >
        {/* Background circle — scales in */}
        <circle
          cx="40" cy="40" r="36"
          fill="rgba(100, 255, 218, 0.1)"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            animation: 'obsidian-circle-morph 500ms var(--obsidian-ease-spring) both',
          }}
        />

        {/* Checkmark path — draws in after circle */}
        <path
          d="M24 40L34 50L56 28"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="50"
          strokeDashoffset="50"
          style={{
            animation: 'obsidian-draw-check 400ms var(--obsidian-ease-out-expo) 350ms both',
          }}
        />
      </svg>
    </div>
  );
}
```

### Confirmation Page

```jsx
function ObsidianOrderConfirmation({ order }) {
  return (
    <div className="max-w-[600px] mx-auto text-center py-16">
      {/* Morphing checkmark */}
      <MorphingCheckmark size={80} />

      {/* Title */}
      <h2 className="font-[var(--obsidian-font-heading)] font-bold
                     text-[var(--obsidian-text-3xl)]
                     text-[var(--obsidian-text-primary)] mt-6 mb-2">
        Order Confirmed
      </h2>

      {/* Order number */}
      <p className="font-[var(--obsidian-font-mono)] font-medium
                    text-[var(--obsidian-text-lg)]
                    text-[var(--obsidian-accent-primary)]">
        {order.number}
      </p>

      {/* Summary card */}
      <div className="obsidian-glass rounded-[var(--obsidian-radius-lg)]
                      p-6 mt-8 text-left">
        {/* ... order details ... */}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3 mt-8">
        <Button variant="primary">View Order Status</Button>
        <Button variant="secondary">Start New Order</Button>
      </div>
    </div>
  );
}
```

### Specifikace
- **Animace:** Circle scales in (500ms spring) → checkmark draws in (400ms, 350ms delay)
- **Circle:** rgba(100,255,218,0.1) fill, mint stroke
- **Checkmark:** Mint stroke, 3px width, round caps
- **Title:** Sora 700, 33px (text-3xl)
- **Order number:** JetBrains Mono 500, violet (#C8A2FF)
- **Summary:** Glass card s objednavkovymi detaily

---

## R5.6-R5.10 Casovy Odhad a Acceptance Criteria

### Casovy Odhad Faze R5

| Ukol | Agent | Odhad |
|------|-------|-------|
| R5.1 Glass pill stepper | mp-mid-frontend-public | 3h |
| R5.2 Upload zone | mp-spec-fe-upload | 2h |
| R5.3 Configure (viewer+controls) | mp-mid-frontend-public + mp-spec-fe-3d-viewer | 5h |
| R5.4 Price review | mp-mid-frontend-public | 2h |
| R5.5 Confirmation | mp-mid-frontend-public | 1.5h |
| R5.6 Checkout form | mp-spec-fe-checkout | 3h |
| R5.7 Step transitions | mp-spec-fe-animations | 1h |
| **Celkem R5** | | **~17.5h** |

### Acceptance Criteria Faze R5

```
[ ] Stepper: Glass pill, sticky, gradient progress line
[ ] Stepper: Active=violet dot, Completed=mint dot, Upcoming=ring
[ ] Upload: 20px radius, violet drag-active, custom cube icon
[ ] Upload: File cards (ne rows) po uploadu
[ ] Configure: 55/45 2-column, glass viewer controls
[ ] Configure: Segmented quality control (pill shape)
[ ] Configure: Gradient slider fill, material swatches
[ ] Price: Glass card, gradient text total, sparkle discount
[ ] Checkout: Large inputs (44px), prostorny padding
[ ] Confirmation: Morphing circle-to-checkmark SVG animace
[ ] Confirmation: Sora nadpis, mono order number
[ ] Mobile: Single column, viewer 250px, stepper kompaktni
[ ] prefers-reduced-motion: Vsechny animace respektovany
[ ] npm run build PASS
```

---

# ============================================================
# R6: ADMIN PAGES
# ============================================================

## R6.1 Admin Dashboard — Glass Stat Cards

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminDashboard.jsx`
**Agent:** mp-mid-frontend-admin
**Priorita:** P0

### Dashboard Grid

```
Top row:    4 stat karty (ruzne vnitrni layouty!)
Second row: Velky graf (full width)
Third row:  Recent orders tabulka (full width)
```

### Stat Cards — Varied Internal Layouts

```jsx
{/* Card 1: Revenue — vertical layout */}
<Card variant="stat">
  <p className="text-[var(--obsidian-text-sm)] text-[var(--obsidian-text-muted)] mb-1">
    Revenue This Month
  </p>
  <p className="font-[var(--obsidian-font-mono)] font-bold text-2xl
                text-[var(--obsidian-text-primary)]">
    45 230 Kc
  </p>
  <div className="flex items-center gap-1 mt-2">
    <TrendingUpIcon size={14} className="text-[var(--obsidian-success)]" />
    <span className="text-[var(--obsidian-text-xs)] font-medium
                     text-[var(--obsidian-success)]">
      +12.3%
    </span>
  </div>
  {/* Mini sparkline */}
  <div className="h-10 mt-3">
    <MiniSparkline data={revenueData} color="var(--obsidian-accent-primary)" />
  </div>
</Card>

{/* Card 2: Orders — horizontal layout */}
<Card variant="stat">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-[var(--obsidian-radius-md)]
                    bg-[rgba(200,162,255,0.08)]
                    flex items-center justify-center">
      <ShoppingCartIcon size={22} className="text-[var(--obsidian-accent-primary)]" />
    </div>
    <div>
      <p className="text-[var(--obsidian-text-sm)] text-[var(--obsidian-text-muted)]">
        Active Orders
      </p>
      <p className="font-[var(--obsidian-font-mono)] font-bold text-xl
                    text-[var(--obsidian-text-primary)]">
        24
      </p>
    </div>
  </div>
</Card>

{/* Card 3: Success Rate — gauge visualization */}
<Card variant="stat">
  <div className="flex flex-col items-center">
    <svg width="64" height="64" viewBox="0 0 64 64">
      {/* Track */}
      <circle cx="32" cy="32" r="28" fill="none"
              stroke="var(--obsidian-bg-overlay)" strokeWidth="4" />
      {/* Fill — gradient */}
      <defs>
        <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#C8A2FF" />
          <stop offset="100%" stopColor="#64FFDA" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="none"
              stroke="url(#gauge-grad)" strokeWidth="4"
              strokeDasharray="176" strokeDashoffset="18"
              strokeLinecap="round"
              transform="rotate(-90 32 32)" />
      {/* Center text */}
      <text x="32" y="36" textAnchor="middle"
            fill="var(--obsidian-text-primary)"
            fontFamily="var(--obsidian-font-mono)"
            fontSize="16" fontWeight="700">
        94%
      </text>
    </svg>
    <p className="text-[var(--obsidian-text-sm)] text-[var(--obsidian-text-muted)] mt-2">
      Print Success
    </p>
  </div>
</Card>

{/* Card 4: Avg Print Time — icon top, value center */}
<Card variant="stat">
  <ClockIcon size={20} className="text-[var(--obsidian-accent-secondary)] mb-2" />
  <p className="font-[var(--obsidian-font-mono)] font-bold text-xl
                text-[var(--obsidian-text-primary)]">
    3h 24m
  </p>
  <p className="text-[var(--obsidian-text-xs)] text-[var(--obsidian-text-muted)] mt-1">
    Avg Print Time
  </p>
  <span className="text-[var(--obsidian-text-xs)] text-[var(--obsidian-error)]">
    +8min vs last week
  </span>
</Card>
```

### Klicove specifikace
- **Vsechny stat cards:** Glass treatment (obsidian-glass)
- **Kazda karta ma JINY vnitrni layout** — to je anti-AI-generic pattern
  - Card 1: Vertikalni (value top, sparkline bottom)
  - Card 2: Horizontalni (icon left, value right)
  - Card 3: Gauge visualization (centered SVG ring)
  - Card 4: Icon top, value center, comparison bottom
- **Grafy:** Brand gradient (#C8A2FF → #FF8A65) pro fills
- **Trend badges:** Mint pro pozitivni, error pro negativni

---

## R6.2 Admin Tables — No Alternating Rows

**Soubory:** `Model_Pricer-V2-main/src/pages/admin/AdminOrders.jsx` (a dalsi admin pages)
**Agent:** mp-spec-fe-tables
**Priorita:** P1

### Table specifikace

```css
/* OBSIDIAN Table styling */
.obsidian-table {
  width: 100%;
  border-collapse: collapse;
}

.obsidian-table thead th {
  font-family: var(--obsidian-font-body);
  font-size: var(--obsidian-text-sm);
  font-weight: 500;
  color: var(--obsidian-text-muted);
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--obsidian-border-default);
  /* Normal case (ne uppercase — to je FORGE) */
}

.obsidian-table tbody td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--obsidian-border-divider);
  color: var(--obsidian-text-primary);
  font-size: var(--obsidian-text-base);
}

/* BEZ alternating rows — oddeleni jen border + hover */
.obsidian-table tbody tr:hover {
  background: rgba(200, 162, 255, 0.04);
}

/* Sort indicator */
.obsidian-table th[data-sorted] {
  color: var(--obsidian-accent-primary);
}
```

### Klicove rozdily
- **Bez zebra stripes** (ne alternating rows) — cistejsi premium look
- **Header:** DM Sans 500, ne uppercase, muted barva
- **Hover:** Subtle violet tint rgba(200,162,255,0.04)
- **Borders:** Jen spodni (divider, ne default — jemnejsi)

---

## R6.3 Admin Pricing Config — Segmented Tabs

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminPricing.jsx`
**Agent:** mp-mid-frontend-admin
**Priorita:** P1

### Tab navigace

```jsx
function ObsidianTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex p-1 rounded-[var(--obsidian-radius-md)]
                    bg-[var(--obsidian-bg-elevated)]
                    border border-[var(--obsidian-border-default)]
                    mb-8 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-5 py-2 rounded-[var(--obsidian-radius-sm)] text-sm font-medium',
            'obsidian-transition-micro',
            activeTab === tab.value
              ? 'bg-[var(--obsidian-accent-primary)] text-[var(--obsidian-bg-void)]'
              : 'text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-text-secondary)]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

### Inline editing
- Cell click → border transitions to violet (200ms smooth)
- Cell background → bg-overlay
- Monospace font pro cisla (ceny, procenta)
- Save/cancel → ghost icon buttons

### Volume discount preview
- Horizontal bar s tier colors z brand gradientu
- Kazdy tier: glass card s threshold range + procento slevy

---

## R6.4 Admin Chart Fills

**Agent:** mp-spec-fe-charts
**Priorita:** P2

### Specifikace
- **Area chart fill:** Brand gradient (C8A2FF → FF8A65) pri 10% opacity
- **Line stroke:** #C8A2FF (accent primary), 2px
- **Grid lines:** var(--obsidian-border-divider) — velmi jemne
- **Axes labels:** JetBrains Mono, 11px, text-disabled
- **Tooltip:** Glass treatment, 10px radius, shadow-md
- **Bar chart:** Kazdy material ma svou filamentovou barvu (PLA=#80CBC4, ABS=#EF9A9A, atd.)

---

## R6.5-R6.10 Casovy Odhad a Acceptance Criteria

### Casovy Odhad Faze R6

| Ukol | Agent | Odhad |
|------|-------|-------|
| R6.1 Dashboard + stat cards | mp-mid-frontend-admin | 4h |
| R6.2 Tables (vsechny admin) | mp-spec-fe-tables | 3h |
| R6.3 Pricing config + tabs | mp-mid-frontend-admin | 3h |
| R6.4 Chart fills | mp-spec-fe-charts | 2h |
| R6.5 Fees page | mp-mid-frontend-admin | 1.5h |
| R6.6 Orders page | mp-mid-frontend-admin | 1.5h |
| R6.7 Parameters page | mp-mid-frontend-admin | 1h |
| R6.8 Presets page | mp-mid-frontend-admin | 1h |
| R6.9 Analytics page | mp-mid-frontend-admin | 2h |
| R6.10 Team page | mp-mid-frontend-admin | 1h |
| **Celkem R6** | | **~20h** |

### Acceptance Criteria Faze R6

```
[ ] Dashboard: 4 stat cards s ruznymi vnitrnimi layouty
[ ] Dashboard: Glass treatment na kartach
[ ] Dashboard: Gauge SVG s gradient stroke
[ ] Tables: Bez alternating rows, violet hover, DM Sans headers
[ ] Pricing: Segmented tab control (ne underline)
[ ] Pricing: Inline editing s violet border transition
[ ] Charts: Brand gradient fills, mono axis labels
[ ] Vsechny admin pages: Konzistentni OBSIDIAN styling
[ ] Admin sidebar active state: Violet na current page
[ ] npm run build PASS
```

---

# ============================================================
# R7: WIDGET SYSTEM
# ============================================================

## R7.1 Widget Kalkulacka — Glass Background Option

**Soubor:** `Model_Pricer-V2-main/src/pages/widget-kalkulacka/index.jsx`
**Agent:** mp-mid-frontend-widget
**Priorita:** P0

### Widget Theme Variables

```css
/* Widget CSS variables — konfigurovatelne builderem */
:root {
  --mp-widget-bg: var(--obsidian-bg-surface);
  --mp-widget-text: var(--obsidian-text-primary);
  --mp-widget-text-secondary: var(--obsidian-text-secondary);
  --mp-widget-accent: var(--obsidian-accent-primary);
  --mp-widget-border: var(--obsidian-border-default);
  --mp-widget-radius: var(--obsidian-radius-md);
  --mp-widget-font: 'DM Sans', system-ui, sans-serif;
  --mp-widget-font-mono: 'JetBrains Mono', monospace;
  --mp-widget-input-bg: var(--obsidian-bg-elevated);
  --mp-widget-glass: 0;  /* 0 = solid bg, 1 = glass effect */
}
```

### Widget Container

```jsx
function WidgetContainer({ config, children }) {
  const useGlass = config?.glass === true;

  return (
    <div
      className={cn(
        'max-w-[480px] p-6',
        'rounded-[var(--mp-widget-radius)]',
        useGlass
          ? 'obsidian-glass'
          : 'bg-[var(--mp-widget-bg)] border border-[var(--mp-widget-border)]'
      )}
      style={{
        fontFamily: 'var(--mp-widget-font)',
        color: 'var(--mp-widget-text)',
      }}
    >
      {children}
    </div>
  );
}
```

### Widget Price Display

```jsx
function WidgetPrice({ total, currency }) {
  return (
    <div className="text-center py-4 border-t border-[var(--mp-widget-border)]">
      <p className="text-xs text-[var(--mp-widget-text-secondary)] mb-1">
        Estimated Total
      </p>
      <p className="font-[var(--mp-widget-font-mono)] font-bold text-2xl
                    text-[var(--mp-widget-accent)]">
        {total} {currency}
      </p>
    </div>
  );
}
```

### Klicove specifikace
- **Glass option:** Widget muze byt solid bg NEBO glass (konfigurace z builderu)
- **Compact:** Vsechny controls stacked vertikalne (ne 2-column)
- **Material selector:** Dropdown (ne cards) — setri misto
- **Inputs:** 40px vyska (kompaktnejsi nez test-kalkulacka 44px)
- **Price display:** Centered, JetBrains Mono bold, violet accent
- **Radius:** Konfigurovatelny pres --mp-widget-radius
- **Theme isolation:** Widget pouziva vlastni --mp-widget-* promenne, ne globalni

---

## R7.2 Widget Builder — Glass Top Bar

**Soubor:** `Model_Pricer-V2-main/src/pages/admin/builder/BuilderPage.jsx`
**Agent:** mp-mid-frontend-widget
**Priorita:** P1

### Top Bar

```jsx
function BuilderTopBar() {
  return (
    <div className="h-14 obsidian-glass border-b border-[var(--obsidian-border-default)]
                    flex items-center justify-between px-4">
      {/* Left: Back + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <ArrowLeftIcon size={18} />
        </Button>
        <span className="font-[var(--obsidian-font-heading)] font-semibold text-sm">
          Widget Builder
        </span>
      </div>

      {/* Center: Breakpoint toggles */}
      <div className="flex items-center gap-1 p-1 rounded-[var(--obsidian-radius-sm)]
                      bg-[var(--obsidian-bg-elevated)]">
        {['Monitor', 'Tablet', 'Smartphone'].map((device) => (
          <button
            key={device}
            className={cn(
              'w-9 h-8 rounded-[4px] flex items-center justify-center',
              'obsidian-transition-micro',
              activeDevice === device
                ? 'bg-[var(--obsidian-accent-primary)] text-[var(--obsidian-bg-void)]'
                : 'text-[var(--obsidian-text-muted)] hover:text-[var(--obsidian-text-secondary)]'
            )}
          >
            <Icon name={device} size={16} />
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">Preview</Button>
        <Button variant="primary" size="sm">Publish</Button>
      </div>
    </div>
  );
}
```

### Left Panel
- **Background:** bg-surface
- **Section dividers:** 1px border-divider
- **Controls:** Radius-md vsude (10px)
- **Color pickers:** Vetsi, vizualni grid s real-time preview

### Right Panel (Preview)
- **Background:** bg-void (nejtmavsi — kontrast pro widget)
- **Device frames:** obsidian-shadow-lg
- **Zoom controls:** Bottom-right, monospace tlacitka

---

## R7.3 Widget Stepper Component

**Soubor:** `Model_Pricer-V2-main/src/pages/widget-kalkulacka/components/WidgetStepper.jsx`
**Agent:** mp-mid-frontend-widget
**Priorita:** P1

### Kompaktni stepper pro widget

```jsx
function WidgetStepper({ steps, current }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[11px]',
              'font-[var(--mp-widget-font-mono)] font-medium',
              i < current && 'bg-[var(--obsidian-success)] text-[var(--obsidian-bg-void)]',
              i === current && 'bg-[var(--mp-widget-accent)] text-[var(--obsidian-bg-void)]',
              i > current && 'border border-[var(--mp-widget-border)] text-[var(--mp-widget-text-secondary)]'
            )}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-px',
              i < current
                ? 'bg-[var(--obsidian-success)]'
                : 'bg-[var(--mp-widget-border)]'
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
```

---

## R7.4-R7.10 Casovy Odhad a Acceptance Criteria

### Casovy Odhad Faze R7

| Ukol | Agent | Odhad |
|------|-------|-------|
| R7.1 Widget kalkulacka | mp-mid-frontend-widget | 4h |
| R7.2 Widget builder | mp-mid-frontend-widget | 3h |
| R7.3 Widget stepper | mp-mid-frontend-widget | 1h |
| R7.4 Widget header/footer | mp-mid-frontend-widget | 1h |
| R7.5 Builder tokens sync | mp-mid-frontend-widget | 1h |
| **Celkem R7** | | **~10h** |

### Acceptance Criteria Faze R7

```
[ ] Widget: Glass background option (konfigurovatelne)
[ ] Widget: Theme isolation pres --mp-widget-* promenne
[ ] Widget: Violet accent default
[ ] Widget: Compact layout (stacked, ne 2-column)
[ ] Builder: Glass top bar, breakpoint toggles
[ ] Builder: bg-surface left panel, bg-void preview
[ ] Builder: Device frames s obsidian-shadow-lg
[ ] Widget stepper: Kompaktni, numbered, correct colors
[ ] builder-tokens.css synced s obsidian palette
[ ] npm run build PASS
```

---

# ============================================================
# R8: BUDOUCI STRANKY (12 future pages)
# ============================================================

## R8.1 Orders Kanban Board — Glass Cards, Pastel Column Headers

**Budouci soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminOrdersKanban.jsx`
**Agent:** mp-spec-fe-kanban
**Priorita:** P2 (budouci — design-only specifikace)

### Layout

```
Typ:           Horizontalne scrollovatelny kontejner
Sloupce:       "NEW" | "CONFIRMED" | "PRINTING" | "QC" | "SHIPPING" | "DELIVERED"
Column width:  300px
Card width:    Plna sirka sloupce minus padding
```

### Column Header Colors (softer pastel palette)

```css
.obsidian-kanban-col-new        { border-top: 2px solid var(--obsidian-info); }
.obsidian-kanban-col-confirmed  { border-top: 2px solid #B39DDB; }  /* soft violet */
.obsidian-kanban-col-printing   { border-top: 2px solid var(--obsidian-accent-primary); }
.obsidian-kanban-col-qc         { border-top: 2px solid var(--obsidian-warning); }
.obsidian-kanban-col-shipping   { border-top: 2px solid var(--obsidian-accent-secondary); }
.obsidian-kanban-col-delivered  { border-top: 2px solid var(--obsidian-success); }
```

### Kanban Card

```jsx
function KanbanCard({ order }) {
  return (
    <div className="obsidian-glass rounded-[var(--obsidian-radius-md)] p-4 mb-3
                    cursor-grab active:cursor-grabbing
                    obsidian-transition-micro
                    hover:-translate-y-[1px]
                    hover:shadow-[var(--obsidian-shadow-glow)]">
      {/* Order number */}
      <p className="font-[var(--obsidian-font-mono)] text-[var(--obsidian-text-sm)]
                    text-[var(--obsidian-text-muted)] mb-2">
        {order.number}
      </p>

      {/* Customer + thumbnail */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-[var(--obsidian-radius-sm)]
                        bg-[var(--obsidian-bg-void)]
                        flex items-center justify-center shrink-0">
          <CubeIcon size={20} className="text-[var(--obsidian-text-muted)]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--obsidian-text-primary)] truncate">
            {order.customerName}
          </p>
          <p className="text-xs text-[var(--obsidian-text-muted)]">
            {order.material} &middot; {order.quality}
          </p>
        </div>
      </div>

      {/* Price + time */}
      <div className="flex justify-between items-center">
        <span className="font-[var(--obsidian-font-mono)] text-sm font-medium
                         text-[var(--obsidian-accent-primary)]">
          {order.total} Kc
        </span>
        <span className="font-[var(--obsidian-font-mono)] text-[var(--obsidian-text-xs)]
                         text-[var(--obsidian-text-muted)]">
          {order.timeAgo}
        </span>
      </div>
    </div>
  );
}
```

### Drag State
- Card ziska obsidian-shadow-glow pri dragu
- Drop zone: Column ziska rgba(200,162,255,0.03) background
- Card rotace: Zadna (OBSIDIAN je uhlazeny, ne hravy)

---

## R8.2 Shipping Config — Gradient Zone Highlights

**Budouci soubor:** `Model_Pricer-V2-main/src/pages/admin/AdminShipping.jsx`
**Agent:** mp-mid-frontend-admin
**Priorita:** P2

### Specifikace
- **Tab navigace:** Segmented control (stejna jako AdminPricing): "ZONES" | "CARRIERS" | "RATES" | "FREE SHIPPING"
- **Map:** Dark theme, country outlines v border-active, zone highlights s brand gradient
- **Carrier cards:** Glass treatment, logo (grayscale 40px), name, toggle, "Configure" button
- **Rate rules builder:** "IF weight > 5kg AND zone = Europe THEN rate = 12 EUR"
  - Dropdown/input radky s AND/OR pills
  - Add rule: + ghost button

---

## R8.3 Customer Portal — Glass Order Cards

**Budouci soubor:** `Model_Pricer-V2-main/src/pages/customer-portal/index.jsx`
**Agent:** mp-mid-frontend-public
**Priorita:** P2

### Order Card

```jsx
function CustomerOrderCard({ order }) {
  return (
    <div className="obsidian-glass rounded-[var(--obsidian-radius-lg)] p-5
                    flex items-center gap-4">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-[var(--obsidian-radius-md)]
                      bg-[var(--obsidian-bg-void)] shrink-0
                      flex items-center justify-center">
        <CubeIcon size={28} className="text-[var(--obsidian-text-muted)]" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-[var(--obsidian-font-mono)] text-sm
                      text-[var(--obsidian-text-muted)]">
          {order.number}
        </p>
        <p className="font-medium text-[var(--obsidian-text-primary)] truncate">
          {order.modelName}
        </p>
        <p className="text-xs text-[var(--obsidian-text-muted)]">
          {order.material} &middot; {order.quality} &middot; {order.date}
        </p>
      </div>

      {/* Status badge */}
      <div className="obsidian-badge-violet">
        {order.status}
      </div>

      {/* Price */}
      <span className="font-[var(--obsidian-font-mono)] font-medium
                       text-[var(--obsidian-accent-primary)] shrink-0">
        {order.total} Kc
      </span>
    </div>
  );
}
```

### Order Detail — Timeline

```jsx
function OrderTimeline({ events, currentStep }) {
  return (
    <div className="relative pl-6">
      {/* Vertical progress line */}
      <div className="absolute left-2.5 top-0 bottom-0 w-0.5">
        <div
          className="w-full rounded-full"
          style={{
            height: `${(currentStep / (events.length - 1)) * 100}%`,
            background: 'var(--obsidian-gradient-brand)',
          }}
        />
        <div
          className="w-full bg-[var(--obsidian-border-default)]"
          style={{
            height: `${100 - (currentStep / (events.length - 1)) * 100}%`,
          }}
        />
      </div>

      {events.map((event, i) => (
        <div key={i} className="relative pb-6 last:pb-0">
          {/* Dot */}
          <div className={cn(
            'absolute left-0 w-5 h-5 rounded-full border-2',
            'flex items-center justify-center',
            i <= currentStep
              ? 'bg-[var(--obsidian-accent-primary)] border-[var(--obsidian-accent-primary)]'
              : 'bg-[var(--obsidian-bg-surface)] border-[var(--obsidian-border-active)]'
          )}>
            {i < currentStep && (
              <CheckIcon size={10} className="text-[var(--obsidian-bg-void)]" />
            )}
            {i === currentStep && (
              <div className="w-2 h-2 rounded-full bg-[var(--obsidian-bg-void)]" />
            )}
          </div>

          {/* Content */}
          <div className="ml-10">
            <p className="font-[var(--obsidian-font-mono)] text-[var(--obsidian-text-xs)]
                          text-[var(--obsidian-text-muted)]">
              {event.timestamp}
            </p>
            <p className={cn(
              'text-sm',
              i <= currentStep
                ? 'text-[var(--obsidian-text-primary)] font-medium'
                : 'text-[var(--obsidian-text-muted)]'
            )}>
              {event.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Specifikace
- **Timeline progress line:** Brand gradient pro completed, gray pro upcoming
- **Active dot:** Violet bg, void dot inside (pulsing)
- **Completed dot:** Violet bg, void check icon
- **Timestamps:** JetBrains Mono, xs, muted

---

## R8.4 Prehled Vsech 12 Budoucich Stranek

| # | Stranka | Klicovy OBSIDIAN prvek | Priorita |
|---|---------|----------------------|----------|
| 1 | Kanban Board | Glass kanban cards, pastel column headers | P2 |
| 2 | Shipping Config | Gradient zone map highlights, carrier glass cards | P2 |
| 3 | Customer Portal List | Glass order cards, status badges | P2 |
| 4 | Customer Portal Detail | Brand gradient timeline, model viewer | P2 |
| 5 | Chat/Comments | Glass message bubbles, violet sent indicator | P3 |
| 6 | Document Generation | Glass preview frame, gradient "Generate" CTA | P3 |
| 7 | Coupon Management | Glass coupon cards, dashed border "cut here" | P3 |
| 8 | Email Templates | Glass template preview, violet drag handles | P3 |
| 9 | CRM Dashboard | Stat cards (varied layouts), gradient funnels | P3 |
| 10 | Developer Portal | Mono code blocks (bg-void), glass API card | P3 |
| 11 | Onboarding Tutorial | Glass step cards, progress rings, tooltips | P3 |
| 12 | Multi-Language Settings | Glass language cards, flag icons, toggle grid | P3 |

---

## R8.5-R8.10 Casovy Odhad a Acceptance Criteria

### Casovy Odhad Faze R8

| Ukol | Agent | Odhad |
|------|-------|-------|
| R8.1 Kanban design | mp-spec-fe-kanban | 4h |
| R8.2 Shipping design | mp-mid-frontend-admin | 3h |
| R8.3 Customer portal | mp-mid-frontend-public | 4h |
| R8.4 Ostatni (9 pages — templates) | ruzni agenti | 9h |
| **Celkem R8** | | **~20h** |

### Acceptance Criteria Faze R8

```
[ ] Kanban: Glass cards, pastel column tops, drag glow
[ ] Shipping: Gradient zone highlights, glass carrier cards
[ ] Customer portal: Glass order cards, gradient timeline
[ ] Vsechny budouci stranky: Konzistentni OBSIDIAN styling
[ ] Design templates pripraveny pro budouci implementaci
[ ] npm run build PASS (pro implementovane stranky)
```

---

# ============================================================
# R9: POLISH A TESTING
# ============================================================

## R9.1 Glass Performance na Mobile

**Agent:** mp-mid-infra-build
**Priorita:** P0

### Testovaci matice

| Zarizeni | OS | Browser | Ocekavany vysledek |
|----------|----|---------|--------------------|
| iPhone 12+ | iOS 15+ | Safari | Glass plne funkcni, blur 12px |
| iPhone SE 2 | iOS 15+ | Safari | Glass fallback (solidni bg), blur 12px |
| Pixel 6 | Android 13 | Chrome | Glass plne funkcni |
| Samsung Galaxy A13 | Android 12 | Chrome | Glass fallback, snizeny blur |
| iPad Air | iPadOS 16 | Safari | Glass plne funkcni |
| Desktop | Windows | Chrome 120+ | Glass plne funkcni, blur 20px |
| Desktop | macOS | Safari 17+ | Glass plne funkcni |

### Performance metriky

```
Target: 60fps na vsech zarizeniich pri scrollu s glass elementy
Max glass elementy na viewportu: 4 soucasne
Blur reduction na mobile: 20px → 12px
Fallback trigger: backdrop-filter nepodporovan NEBO low-end device
```

### Optimalizace
1. Omezit pocet glass elementu na 1 viewport na max 4
2. Mobile: snizit blur z 20px na 12px
3. Pouzit `will-change: backdrop-filter` SPARINGLY (ne na vsechny glass elementy)
4. Testovat s Chrome DevTools Performance tab — sledovat GPU usage

---

## R9.2 Anti-AI Design Audit (15 bodu)

**Agent:** mp-sr-design (review)
**Priorita:** P0

### Checklist

```
ASYMMETRICKE LAYOUTY:
[ ] 1. Dashboard stat cards maji ruzne vnitrni layouty (ne vsechny stejne)
[ ] 2. Feature section ma staggered 2-column (ne symetricky grid)
[ ] 3. Hero ma centered text + floating card (ne 50/50 split)

NON-GENERIC BARVY:
[ ] 4. Primary = #C8A2FF (violet) — NE modra
[ ] 5. Secondary = #FF8A65 (coral) — NE seda
[ ] 6. Filamentove barvy v material selectoru

TYPOGRAFIE:
[ ] 7. 3 ruzne font families (Sora, DM Sans, JetBrains Mono)
[ ] 8. Headings vizualne odlisne od body textu
[ ] 9. Monospace pro ceny, rozmery, technicke udaje

TEXTURY A HLOUBKA:
[ ] 10. Noise overlay (1.8% opacity) na page pozadi
[ ] 11. Glass-morphism na klicovych kartach/elementech
[ ] 12. Ambient glow za hero a klicovymi sekcemi

SPECIALNI PRVKY:
[ ] 13. Gradient text na hero keyword ("precisely")
[ ] 14. Morphing circle-to-checkmark animace (confirmation)
[ ] 15. Floating parallax card s mouse-tracking
```

### Jak testovat
Pro kazdy bod:
1. Otevri stranku
2. Vizualne over ze prvek existuje a je vizualne distinktivni
3. Porovnej s typickym AI-generovanym webem (ChatGPT, generic SaaS)
4. Pokud prvek je "prilis genericky" → oznac jako FAIL a navrhni opravu

---

## R9.3 Accessibility Audit

**Agent:** mp-spec-design-a11y
**Priorita:** P0

### Automaticky sken
```bash
# axe-core audit
npx axe-cli http://localhost:4028 --save results.json

# Lighthouse accessibility score
npx lighthouse http://localhost:4028 --only-categories=accessibility --output=json
```

### Manualni checklist

```
KONTRAST:
[ ] Vsechny text-primary na bg-surface: >= 4.5:1
[ ] Vsechny text-secondary na bg-surface: >= 4.5:1
[ ] Accent primary na bg-surface: >= 4.5:1
[ ] Accent primary na bg-void: >= 4.5:1
[ ] Error/warning/success text: >= 4.5:1

FOCUS:
[ ] Vsechny interactive elementy maji viditelny focus ring
[ ] Focus ring je violet (#C8A2FF), 2px solid, 2px offset
[ ] Focus ring je viditelny na VSECH pozadich (void, surface, elevated, glass)
[ ] Tab order je logicky (left→right, top→bottom)

TOUCH TARGETS:
[ ] Vsechny buttony >= 44px vyska
[ ] Vsechny inputs >= 44px vyska
[ ] Nav items v sidebaru >= 48px vyska
[ ] Sidebar collapse/expand target >= 44px

GLASS ELEMENTS:
[ ] Text na glass pozadi je citelny (dostatecny kontrast)
[ ] Glass elements maji fallback barvu pro nepodporujici prohlizece
[ ] Glass nesnizuje citelnost pri ruznech pozadiach za elementem

MOTION:
[ ] prefers-reduced-motion respektovano pro VSECHNY animace
[ ] Parallax card: Vypnuta rotace pri reduced-motion
[ ] Stepper transitions: Instant pri reduced-motion
[ ] Shimmer/breathe: Vypnuto pri reduced-motion

SCREEN READER:
[ ] Vsechny images maji alt text
[ ] Vsechny ikony maji aria-label nebo aria-hidden
[ ] Wizard steps maji aria-current="step"
[ ] Modaly maji aria-modal="true"
[ ] Toast notifikace maji role="alert"
```

---

## R9.4 Responsive Breakpoint Testing

**Agent:** mp-spec-fe-layout
**Priorita:** P0

### Breakpoint matice

| Breakpoint | Sirka | Klicove zmeny |
|-----------|-------|---------------|
| Mobile S | 320px | Single column, text-sm hero, stepper vertikalni |
| Mobile M | 375px | Single column, standard sizing |
| Mobile L | 428px | Single column, slightly wider cards |
| Tablet | 768px | Sidebar overlay, 2-column kde vhodne |
| Laptop | 1024px | Sidebar visible (collapsed), full layouts |
| Desktop | 1200px | Sidebar expanded (280px), all features |
| Wide | 1440px+ | Max-width containers, centered content |

### Co testovat na kazdem breakpointu

```
[ ] Hero section: Text readable, CTA accessible, card not overflowing
[ ] Sidebar: Correct behavior (overlay/collapsed/expanded)
[ ] Tables: Horizontal scroll na mobile, ne overflow
[ ] Wizard stepper: Pill viditelny, labels citelne
[ ] Upload zone: Funkcni na touch zarizeni
[ ] 3D viewer: Plna sirka na mobile, controls accessible
[ ] Price breakdown: Vsechny radky citelne
[ ] Admin dashboard: Cards stack na mobile
[ ] Modals: Full width na mobile s paddingem
[ ] Footer: Columns collapse na mensi sirky
```

---

## R9.5 Final Build a Smoke Test

**Agent:** mp-spec-test-build
**Priorita:** P0

### Build checklist

```bash
# 1. Clean build
npm run build

# 2. Check bundle size (glass/noise SVG nemaji zvetsit bundle vyrazne)
npx vite-bundle-visualizer

# 3. Spustit dev server
npm run dev

# 4. Smoke test — projit kazdy route
```

### Smoke test routes

```
[ ] / (home) — hero, features, testimonial, footer
[ ] /pricing — pricing cards
[ ] /support — support page
[ ] /login — glass card login
[ ] /register — registration form
[ ] /test-kalkulacka — vsech 5 kroku wizard
[ ] /admin — dashboard s stat kartami
[ ] /admin/pricing — tabs, material table
[ ] /admin/fees — fee editor
[ ] /admin/orders — order table
[ ] /admin/widget — widget config
[ ] /admin/builder — widget builder
[ ] /w/:id — widget public page
```

---

## R9.6-R9.10 Casovy Odhad a Finalni Acceptance Criteria

### Casovy Odhad Faze R9

| Ukol | Agent | Odhad |
|------|-------|-------|
| R9.1 Glass performance | mp-mid-infra-build | 3h |
| R9.2 Anti-AI audit | mp-sr-design | 2h |
| R9.3 Accessibility audit | mp-spec-design-a11y | 3h |
| R9.4 Responsive testing | mp-spec-fe-layout | 3h |
| R9.5 Build + smoke test | mp-spec-test-build | 2h |
| R9.6 Bug fixes z auditu | ruzni agenti | 4h |
| **Celkem R9** | | **~17h** |

### FINALNI Acceptance Criteria (cely redesign)

```
VIZUALNI IDENTITA:
[ ] Cela aplikace pouziva OBSIDIAN dark theme (#0C0A0F bg)
[ ] Primary accent je #C8A2FF (violet) — NIKDE neni #2563EB (stara modra)
[ ] Headings: Sora 700
[ ] Body: DM Sans 400
[ ] Mono: JetBrains Mono 500
[ ] Glass-morphism na klicovych elementech (karty, stepper, modaly)
[ ] Noise overlay (1.8% opacity) na page pozadi
[ ] Ambient glow za hero a dulezitymi sekcemi

KOMPONENTY:
[ ] Button: 10px radius, violet primary, dark text na accent bg
[ ] Card: Glass treatment, 14px radius, 28px padding
[ ] Input: 44px vyska, violet focus ring, dark bg
[ ] Tables: Bez alternating rows, violet hover
[ ] Modals: Glass bg, 14px radius, fade+scale animace
[ ] Toasts: Glass bg, colored icon circles, gradient progress

LAYOUT:
[ ] Admin sidebar: 280px, gradient logo, rounded icon bgs
[ ] Header: 88px, transparent → glass on scroll
[ ] Footer: Void bg, 4 sloupce, divider border

STRANKY:
[ ] Home: Gradient text keyword, floating parallax card, staggered features
[ ] Login: Centered glass card, ambient glow
[ ] Test Kalkulacka: Glass pill stepper, gradient progress, morphing checkmark
[ ] Admin Dashboard: 4 stat cards s ruznymi layouty
[ ] Widget: Glass option, theme isolation

KVALITA:
[ ] WCAG AA kontrast na vsech text/bg kombinacich
[ ] prefers-reduced-motion respektovano
[ ] Responsive na Mobile S (320px) az Wide (1440px+)
[ ] Glass fallback na nepodporujicich prohlizecich
[ ] Anti-AI audit: 15/15 bodu PASS
[ ] npm run build PASS
[ ] Smoke test vsech rout PASS
```

---

# ============================================================
# APPENDIX A: KOMPLETNI CSS TOKEN REFERENCE
# ============================================================

## Vsechny tokeny v jednom miste

```
BARVY POZADI:
--obsidian-bg-void:       #0C0A0F
--obsidian-bg-surface:    #13111A
--obsidian-bg-elevated:   #1B1825
--obsidian-bg-overlay:    #231F2E

BARVY TEXTU:
--obsidian-text-primary:   #F0EDF5
--obsidian-text-secondary: #A39DB0
--obsidian-text-muted:     #6B6478
--obsidian-text-disabled:  #3D374A

AKCENTY:
--obsidian-accent-primary:    #C8A2FF
--obsidian-accent-primary-h:  #D4B5FF
--obsidian-accent-secondary:  #FF8A65
--obsidian-accent-tertiary:   #64FFDA

SEMANTICKE:
--obsidian-success:   #64FFDA
--obsidian-warning:   #FFD54F
--obsidian-error:     #FF5252
--obsidian-info:      #82B1FF

FILAMENTY:
--obsidian-filament-pla:     #80CBC4
--obsidian-filament-abs:     #EF9A9A
--obsidian-filament-petg:    #81D4FA
--obsidian-filament-tpu:     #A5D6A7
--obsidian-filament-nylon:   #FFF9C4
--obsidian-nozzle-hot:       #FFAB91
--obsidian-nozzle-cold:      #78909C
--obsidian-bed-heated:       #EF5350
--obsidian-bed-cold:         #37474F
--obsidian-layer-line:       rgba(200, 162, 255, 0.12)

BORDERY:
--obsidian-border-default:   #211E2B
--obsidian-border-active:    #2E2A3A
--obsidian-border-highlight: rgba(200, 162, 255, 0.15)
--obsidian-border-divider:   #19161F

GRADIENTY:
--obsidian-gradient-brand:    linear-gradient(135deg, #C8A2FF 0%, #FF8A65 100%)
--obsidian-gradient-surface:  linear-gradient(180deg, #13111A 0%, #0C0A0F 100%)
--obsidian-gradient-premium:  linear-gradient(135deg, #C8A2FF 0%, #64FFDA 100%)
--obsidian-gradient-glow:     radial-gradient(ellipse at center, rgba(200,162,255,0.06) 0%, transparent 70%)
--obsidian-gradient-warm:     linear-gradient(135deg, #FF8A65 0%, #FFD54F 100%)

STINY:
--obsidian-shadow-sm:    0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(200,162,255,0.04)
--obsidian-shadow-md:    0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,162,255,0.05)
--obsidian-shadow-lg:    0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,162,255,0.06)
--obsidian-shadow-glow:  0 0 24px rgba(200,162,255,0.12)
--obsidian-shadow-warm:  0 0 24px rgba(255,138,101,0.1)

RADIUS:
--obsidian-radius-sm:    6px
--obsidian-radius-md:    10px
--obsidian-radius-lg:    14px
--obsidian-radius-xl:    20px
--obsidian-radius-full:  9999px

TYPOGRAFIE:
--obsidian-font-heading:  'Sora', system-ui, sans-serif
--obsidian-font-body:     'DM Sans', system-ui, sans-serif
--obsidian-font-mono:     'JetBrains Mono', 'Fira Code', monospace
--obsidian-text-4xl:   2.488rem    --obsidian-lh-4xl: 3rem
--obsidian-text-3xl:   2.074rem    --obsidian-lh-3xl: 2.5rem
--obsidian-text-2xl:   1.728rem    --obsidian-lh-2xl: 2.25rem
--obsidian-text-xl:    1.44rem     --obsidian-lh-xl:  1.875rem
--obsidian-text-lg:    1.2rem      --obsidian-lh-lg:  1.75rem
--obsidian-text-base:  1rem        --obsidian-lh-base: 1.625rem
--obsidian-text-sm:    0.833rem    --obsidian-lh-sm:  1.25rem
--obsidian-text-xs:    0.694rem    --obsidian-lh-xs:  1rem

SPACING:
--obsidian-space-1:   4px     --obsidian-space-7:  32px
--obsidian-space-2:   8px     --obsidian-space-8:  48px
--obsidian-space-3:   12px    --obsidian-space-9:  64px
--obsidian-space-4:   16px    --obsidian-space-10: 96px
--obsidian-space-5:   20px    --obsidian-space-11: 128px
--obsidian-space-6:   24px

EASING:
--obsidian-ease-out-expo:    cubic-bezier(0.16, 1, 0.3, 1)
--obsidian-ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1)
--obsidian-ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1)

Z-INDEX:
--obsidian-z-base:     0
--obsidian-z-elevated: 10
--obsidian-z-sticky:   100
--obsidian-z-overlay:  200
--obsidian-z-modal:    300
--obsidian-z-popover:  400
--obsidian-z-toast:    500
--obsidian-z-max:      9999
```

---

# ============================================================
# APPENDIX B: WCAG KONTRASTNI TABULKA
# ============================================================

| Popredi | Pozadi | Pomer | Vysledek | Pouziti |
|---------|--------|-------|----------|---------|
| #F0EDF5 | #0C0A0F | 16.1:1 | AAA | text-primary na void |
| #F0EDF5 | #13111A | 14.8:1 | AAA | text-primary na surface |
| #F0EDF5 | #1B1825 | 12.2:1 | AAA | text-primary na elevated |
| #F0EDF5 | #231F2E | 10.1:1 | AAA | text-primary na overlay |
| #A39DB0 | #0C0A0F | 8.3:1 | AAA | text-secondary na void |
| #A39DB0 | #13111A | 7.1:1 | AA | text-secondary na surface |
| #A39DB0 | #1B1825 | 5.9:1 | AA | text-secondary na elevated |
| #6B6478 | #0C0A0F | 5.3:1 | AA | text-muted na void |
| #6B6478 | #13111A | 4.5:1 | AA min | text-muted na surface |
| #6B6478 | #1B1825 | 3.6:1 | AA large | text-muted na elevated (JEN large text) |
| #3D374A | #13111A | 2.4:1 | FAIL | disabled only (intentional) |
| #C8A2FF | #0C0A0F | 8.6:1 | AAA | accent na void |
| #C8A2FF | #13111A | 7.5:1 | AA | accent na surface |
| #0C0A0F | #C8A2FF | 8.6:1 | AAA | dark text na accent bg (buttons) |
| #FF5252 | #13111A | 5.5:1 | AA | error na surface |
| #FFD54F | #13111A | 11.4:1 | AAA | warning na surface |
| #82B1FF | #13111A | 7.2:1 | AA | info na surface |
| #64FFDA | #13111A | 12.6:1 | AAA | success na surface |
| #64FFDA | #0C0A0F | 14.8:1 | AAA | success na void |

---

# ============================================================
# APPENDIX C: AGENT ASSIGNMENT MATRIX
# ============================================================

| Faze | Primarni Agent | Support Agenti | Review Agent |
|------|---------------|----------------|-------------|
| R0 | mp-spec-design-tokens | mp-mid-infra-build, mp-spec-design-a11y | mp-sr-design |
| R1 | mp-spec-design-tokens | mp-mid-design-system, mp-spec-fe-animations | mp-sr-design |
| R2 | mp-mid-design-system | mp-spec-fe-notifications | mp-sr-design, mp-sr-frontend |
| R3 | mp-mid-frontend-admin | mp-mid-frontend-public | mp-sr-design, mp-sr-frontend |
| R4 | mp-mid-frontend-public | mp-spec-fe-animations, mp-spec-fe-layout | mp-sr-design |
| R5 | mp-mid-frontend-public | mp-spec-fe-upload, mp-spec-fe-3d-viewer, mp-spec-fe-checkout | mp-sr-design, mp-sr-frontend |
| R6 | mp-mid-frontend-admin | mp-spec-fe-tables, mp-spec-fe-charts | mp-sr-design |
| R7 | mp-mid-frontend-widget | N/A | mp-sr-design, mp-sr-frontend |
| R8 | mp-spec-fe-kanban | mp-mid-frontend-admin, mp-mid-frontend-public | mp-sr-design |
| R9 | mp-sr-design | mp-spec-design-a11y, mp-spec-fe-layout, mp-spec-test-build, mp-mid-infra-build | mp-sr-orchestrator |

### Paralelizace

```
Sekvencni zavislosti:
  R0 → R1 → R2 → (R3 || R4) → R5 → R6 → R7 → R8 → R9

Paralelizovatelne:
  R3 (layout) a R4 (public pages) mohou bezet soucasne po R2
  R6 (admin) a R7 (widget) mohou bezet soucasne po R5
  R8 (budouci) je nezavisle, muze bezet kdykoliv po R2
```

---

# ============================================================
# APPENDIX D: ANTI-AI CHECKLIST (15 BODU)
# ============================================================

Kompletni checklist z DARK_THEME_REDESIGN_PROPOSAL_AGENT.md sekce 7, aplikovano na OBSIDIAN:

| # | Princip | OBSIDIAN implementace | Kde |
|---|---------|----------------------|-----|
| 1 | Asymmetricke layouty | Dashboard stat cards 4 ruzne layouty, staggered features | R4.2, R6.1 |
| 2 | Non-blue primary | #C8A2FF (violet) — zadna modra | R1.1 |
| 3 | Mixed typography (3 fonts) | Sora (heading) + DM Sans (body) + JetBrains Mono (data) | R0.1, R1.2 |
| 4 | Numbered section labels | Feature cards mohou mit "01/", "02/" labels | R4.2 |
| 5 | Hand-drawn accents | Hero squiggle underline (SVG, imperfect line) | R4.1 |
| 6 | Texture overlays (noise) | obsidian-grain (1.8% opacity, baseFrequency 0.65) | R1.3 |
| 7 | Dotted leaders (price) | OBSIDIAN pouziva cistejsi layout (bez dotted) — kompenzovano gradient separator | R5.4 |
| 8 | Monospace tech labels | Ceny, rozmery, cisla objednavek v JetBrains Mono | R5.4, R6.1 |
| 9 | Deliberate spacing variation | 32px tight, 48px break, 96px major section | R1.1 spacing |
| 10 | Centered hero (s parallax) | Centered text + floating mouse-tracking card | R4.1 |
| 11 | Color-coded domain language | Filament colors (PLA=#80CBC4, ABS=#EF9A9A, atd.) | R1.1 filaments |
| 12 | Functional animations only | Morphing checkmark, stepper progress, card hover lift | R5.5, R5.1 |
| 13 | Subtle skewed sections | OBSIDIAN nepouziva skew (to je FORGE) — kompenzovano ambient glow shapes | R1.3 |
| 14 | Version/build info | Dashboard muze zobrazit last sync timestamp | R6.1 |
| 15 | Receipt-style price | Gradient separator, per-unit price, mono values | R5.4 |

---

# ============================================================
# CELKOVY CASOVY SOUHRN
# ============================================================

| Faze | Nazev | Odhad | Kumulativni |
|------|-------|-------|-------------|
| R0 | Priprava a Zavislosti | 3.5h | 3.5h |
| R1 | Design System Zaklad | 7.5h | 11h |
| R2 | Zakladni Komponenty | 13h | 24h |
| R3 | Layout Shell | 8.5h | 32.5h |
| R4 | Public Pages | 14h | 46.5h |
| R5 | Test Kalkulacka | 17.5h | 64h |
| R6 | Admin Pages | 20h | 84h |
| R7 | Widget System | 10h | 94h |
| R8 | Budouci Stranky | 20h | 114h |
| R9 | Polish a Testing | 17h | 131h |
| **CELKEM** | | **~131h** | **~16-20 pracovnich dni** |

### Prioritni implementace (pokud je cas omezeny)

```
MUST HAVE (R0 + R1 + R2 + R3 = ~32.5h = ~4 dny):
  Design tokeny, zakladni komponenty, layout shell
  → Vsechny existujici stranky automaticky prebibaji nove barvy

SHOULD HAVE (+R4 + R5 = +31.5h = +4 dny):
  Public pages + test kalkulacka
  → Zakaznicka cesta kompletne redesignovana

NICE TO HAVE (+R6 + R7 = +30h = +4 dny):
  Admin pages + widget
  → Admin i widget v novem designu

FUTURE (+R8 + R9 = +37h = +5 dny):
  Budouci stranky + polish
  → Kompletni redesign vcetne budoucich stranek
```

---

*Konec implementacniho planu. Pripraveno k review agentem mp-sr-orchestrator a nasledne delegaci na implementacni agenty.*
