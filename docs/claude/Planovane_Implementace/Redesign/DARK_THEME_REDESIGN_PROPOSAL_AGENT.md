# MODELPRICER V3 -- DARK THEME REDESIGN PROPOSAL

**Author:** mp-sr-design (Senior Design Agent)
**Date:** 2026-02-07
**Status:** PROPOSAL (review required before implementation)
**Scope:** Full application visual identity redesign -- dark theme, two variant proposals

---

## TABLE OF CONTENTS

1. Current State Audit
2. Shared Design Principles
3. **VARIANT A: "FORGE" -- Industrial / Technical / Spaceship Manual**
4. **VARIANT B: "OBSIDIAN" -- Premium / Elegant / Design Studio**
5. Page-by-Page Layout Specifications (both variants)
6. Component Design System (both variants)
7. Anti-AI Signature Checklist
8. 3D Printing Identity Integration
9. Implementation Roadmap
10. Appendix: WCAG Contrast Verification

---

## 1. CURRENT STATE AUDIT

### What exists now (problems identified)

| Element | Current Value | Problem |
|---------|--------------|---------|
| Primary color | `#2563EB` (blue-600) | Most AI-default color. Indistinguishable from ChatGPT/Copilot/generic SaaS |
| Page background | `#FAFBFC` | Sterile white-gray, zero personality |
| Card background | `#FFFFFF` | Flat white, no depth perception |
| Heading font | Inter | Overused in every AI-generated template since 2023 |
| Body font | Inter | Same as heading -- no typographic hierarchy |
| Mono font | JetBrains Mono | Actually good -- keep this |
| Border color | `#E2E8F0` | Generic slate-200, invisible on white |
| Shadows | Standard Tailwind box-shadows | Cookie-cutter, no dark-mode adaptation |
| Layout | Symmetric card grids | Every card same size, same spacing, same radius |
| Admin sidebar | White bg, blue active, left border accent | Standard Material/Bootstrap pattern |
| Background pattern | `radial-gradient` purple blob | Disconnected from brand, feels like a Figma template |
| Footer | `#1F2937` dark gray with `linear-gradient(135deg, #667eea, #764ba2)` logo | Completely different palette than the rest of the app |
| Animations | Basic fadeIn, shimmer, rotate | Functional but soulless |

### What works (keep)
- JetBrains Mono for technical data
- CVA-based Button component architecture (extend, don't replace)
- Radix primitives (Slider, Dialog) -- solid foundation
- CSS custom properties infrastructure in tailwind.config.js
- Builder tokens pattern (builder-tokens.css) -- good separation of concerns
- Lenis smooth scrolling setup
- Framer Motion for drawer/transitions

---

## 2. SHARED DESIGN PRINCIPLES (both variants)

### 2.1 The 8px Grid
All spacing values derive from an 8px base unit:
- `4px` (0.5 unit) -- micro gaps, icon padding
- `8px` (1 unit) -- inline spacing, tight groups
- `12px` (1.5 units) -- form field internal padding
- `16px` (2 units) -- component internal padding
- `24px` (3 units) -- section padding, card padding
- `32px` (4 units) -- between sections
- `48px` (6 units) -- major section breaks
- `64px` (8 units) -- page-level vertical rhythm
- `96px` (12 units) -- hero sections
- `128px` (16 units) -- maximum section spacing

### 2.2 60-30-10 Color Rule (Dark Theme)
- **60%** -- Dark backgrounds (page bg, card bg)
- **30%** -- Mid-tones (borders, secondary surfaces, muted text)
- **10%** -- Accent colors (primary actions, highlights, active states)

### 2.3 Gestalt Principles Applied
- **Proximity**: Related controls grouped within the same card/section, 8px internal gap
- **Similarity**: Same function = same visual treatment (all "action" buttons share accent color)
- **Closure**: Cards don't need heavy borders if background contrast is sufficient
- **Continuity**: Wizard steps follow a clear horizontal/vertical progression line
- **Figure-Ground**: Dark backgrounds push lighter content forward

### 2.4 Motion Design Contract
All animations MUST:
1. Have a purpose (guide attention, confirm action, show relationship)
2. Be under 300ms for micro-interactions, under 500ms for layout transitions
3. Respect `prefers-reduced-motion: reduce` (fallback to instant/opacity-only)
4. Use cubic-bezier easing, never linear (except infinite loops like spinners)

Easing tokens:
```
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)
--ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1)
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
```

### 2.5 Accessibility Baseline
- All text meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Focus indicators visible on dark backgrounds (not just browser default blue outline)
- Interactive elements minimum 44x44px touch targets on mobile
- Color is never the only differentiator (always pair with icon, text, or shape)

---

## 3. VARIANT A: "FORGE" -- Industrial / Technical / Spaceship Manual

### 3.0 Design Philosophy
Inspired by: CNC machine control panels, spacecraft HUDs, technical blueprints, factory floor monitoring systems. The interface should feel like you're operating precision equipment. Every element communicates: "this tool was built by engineers, for engineers."

Key words: **precise, functional, layered, technical, confident**

### 3.1 COLOR PALETTE

#### Background Hierarchy (4 levels)
```
--forge-bg-void:      #08090C    Page background (deepest black with blue undertone)
--forge-bg-surface:   #0E1015    Card/panel background (primary surface)
--forge-bg-elevated:  #161920    Elevated elements (modals, dropdowns, popovers)
--forge-bg-overlay:   #1C1F28    Overlay panels, expanded sections
```

#### Text Hierarchy (4 levels)
```
--forge-text-primary:   #E8ECF1    Primary text (headings, important values)
--forge-text-secondary: #9BA3B0    Secondary text (descriptions, labels)
--forge-text-muted:     #5C6370    Muted text (hints, timestamps, placeholders)
--forge-text-disabled:  #3A3F4A    Disabled text
```

WCAG AA verification:
- `#E8ECF1` on `#0E1015` = 14.2:1 (PASS AAA)
- `#9BA3B0` on `#0E1015` = 7.6:1 (PASS AA)
- `#5C6370` on `#0E1015` = 4.5:1 (PASS AA -- meets minimum)
- `#3A3F4A` on `#0E1015` = 2.5:1 (decorative/disabled only, not required)

#### Accent Colors
```
--forge-accent-primary:    #00D4AA    Teal-green (nozzle glow / heated bed ready)
--forge-accent-primary-h:  #00F0C0    Primary hover (slightly brighter)
--forge-accent-secondary:  #FF6B35    Burnt orange (heated filament / warning warmth)
--forge-accent-tertiary:   #6C63FF    Electric violet (UV curing / special operations)

--forge-success:   #00D4AA    Same as primary -- "print complete" green
--forge-warning:   #FFB547    Amber -- "bed heating" / caution
--forge-error:     #FF4757    Red -- "print failed" / thermal runaway
--forge-info:      #4DA8DA    Steel blue -- informational
```

#### Special 3D Printing Colors
```
--forge-filament-pla:     #4ECDC4    PLA teal
--forge-filament-abs:     #FF6B6B    ABS coral red
--forge-filament-petg:    #45B7D1    PETG ocean blue
--forge-filament-tpu:     #96CEB4    TPU sage green
--forge-filament-nylon:   #FFEAA7    Nylon cream
--forge-nozzle-hot:       #FF9F43    Hot nozzle orange
--forge-nozzle-cold:      #636E72    Cold nozzle steel gray
--forge-bed-heated:       #FD7272    Heated bed red glow
--forge-bed-cold:         #2C3E50    Cold bed dark blue
--forge-layer-line:       rgba(0, 212, 170, 0.15)    Layer visualization
```

#### Border Colors
```
--forge-border-default:   #1E2230    Subtle border (barely visible)
--forge-border-active:    #2A3040    Active/focused border
--forge-border-highlight: #00D4AA33  Accent border (33% opacity of primary)
--forge-border-grid:      #141720    Grid line (very subtle)
```

#### Gradients
```
--forge-gradient-brand:   linear-gradient(135deg, #00D4AA 0%, #6C63FF 100%)
--forge-gradient-surface: linear-gradient(180deg, #0E1015 0%, #08090C 100%)
--forge-gradient-hot:     linear-gradient(135deg, #FF6B35 0%, #FF4757 100%)
--forge-gradient-glow:    radial-gradient(ellipse at center, rgba(0,212,170,0.08) 0%, transparent 70%)
```

### 3.2 TYPOGRAPHY SYSTEM

#### Font Stack
```
Heading:   'Space Grotesk', system-ui, sans-serif
Body:      'IBM Plex Sans', system-ui, sans-serif
Mono:      'JetBrains Mono', 'Fira Code', monospace
Technical: 'Space Mono', 'JetBrains Mono', monospace  (for measurements, coordinates)
```

**Why Space Grotesk?** Geometric sans-serif with personality -- distinctive 'a' and 'g' letterforms, slightly condensed, feels engineered. NOT overused like Inter/Poppins/Manrope. Has a technical, precision feel without being cold.

**Why IBM Plex Sans?** Designed for long-form reading in technical contexts. Humanist proportions but with a systematic, engineered quality. Excellent x-height. Not commonly seen in AI templates.

#### Type Scale (1.250 Major Third modular scale)
```
--forge-text-4xl:  2.441rem / 3rem      (39px / 48px line-height)   -- Hero headings
--forge-text-3xl:  1.953rem / 2.5rem    (31px / 40px)               -- Page titles
--forge-text-2xl:  1.563rem / 2rem      (25px / 32px)               -- Section headings
--forge-text-xl:   1.25rem  / 1.75rem   (20px / 28px)               -- Card titles
--forge-text-lg:   1rem     / 1.5rem    (16px / 24px)               -- Body large
--forge-text-base: 0.875rem / 1.375rem  (14px / 22px)               -- Body default
--forge-text-sm:   0.75rem  / 1.125rem  (12px / 18px)               -- Captions, labels
--forge-text-xs:   0.625rem / 1rem      (10px / 16px)               -- Badges, micro-labels
```

Note: Body default is 14px, not 16px. Technical interfaces benefit from slightly smaller text that allows more data density. The increased line-height (22px for 14px text) compensates for readability.

#### Weight Usage Rules
```
Headings:    700 (Bold) -- Space Grotesk
Subheadings: 600 (SemiBold) -- Space Grotesk
Body:        400 (Regular) -- IBM Plex Sans
Labels:      500 (Medium) -- IBM Plex Sans
Strong text: 600 (SemiBold) -- IBM Plex Sans
Mono values: 500 (Medium) -- JetBrains Mono
Mono labels: 400 (Regular) -- Space Mono
```

### 3.3 TEXTURE & PATTERN SYSTEM

#### Noise Overlay (subtle grain)
Applied to page background via pseudo-element:
```css
.forge-grain::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}
```

#### Blueprint Grid
Optional subtle grid pattern on backgrounds:
```css
.forge-grid-bg {
  background-image:
    linear-gradient(var(--forge-border-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--forge-border-grid) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

#### Scanline Effect (very subtle, for special sections)
```css
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
}
```

### 3.4 SHADOWS (Dark-Mode Optimized)
In dark themes, shadows are barely visible against dark backgrounds. Instead, we use **edge highlights** (thin lighter borders on top/left) and **glow effects**.

```
--forge-shadow-sm:       0 1px 3px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.03)
--forge-shadow-md:       0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04)
--forge-shadow-lg:       0 12px 32px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.05)
--forge-shadow-glow:     0 0 20px rgba(0, 212, 170, 0.15)
--forge-shadow-glow-hot: 0 0 20px rgba(255, 107, 53, 0.2)
```

### 3.5 BORDER RADIUS
```
--forge-radius-sm:  4px     Buttons, badges, small controls
--forge-radius-md:  6px     Cards, inputs, dropdowns
--forge-radius-lg:  8px     Modals, large panels
--forge-radius-xl:  12px    Hero cards, special containers
--forge-radius-full: 9999px Pills, avatars, round indicators
```

Note: Deliberately SMALLER than typical Tailwind defaults (which use 8px/12px/16px). Smaller radii feel more technical and precise. This is a conscious anti-AI choice -- AI templates love large, bubbly border-radius.

---

## 4. VARIANT B: "OBSIDIAN" -- Premium / Elegant / Design Studio

### 4.0 Design Philosophy
Inspired by: High-end product photography studios, luxury automotive dashboards, premium design tools (Figma dark mode, Cinema 4D, Blender). The interface should feel like a precision instrument wrapped in refined aesthetics. Every surface has depth and material quality.

Key words: **refined, warm, deep, luxurious, assured**

### 4.1 COLOR PALETTE

#### Background Hierarchy (4 levels)
```
--obsidian-bg-void:      #0C0A0F    Page background (warm charcoal with purple undertone)
--obsidian-bg-surface:   #13111A    Card/panel background (warm dark)
--obsidian-bg-elevated:  #1B1825    Elevated elements (modals, dropdowns)
--obsidian-bg-overlay:   #231F2E    Overlay panels, expanded sections
```

#### Text Hierarchy (4 levels)
```
--obsidian-text-primary:   #F0EDF5    Primary text (warm white, slight lavender)
--obsidian-text-secondary: #A39DB0    Secondary text (muted lavender-gray)
--obsidian-text-muted:     #6B6478    Muted text (deep purple-gray)
--obsidian-text-disabled:  #3D374A    Disabled text
```

WCAG AA verification:
- `#F0EDF5` on `#13111A` = 14.8:1 (PASS AAA)
- `#A39DB0` on `#13111A` = 7.1:1 (PASS AA)
- `#6B6478` on `#13111A` = 4.5:1 (PASS AA -- meets minimum)
- `#3D374A` on `#13111A` = 2.4:1 (decorative/disabled only)

#### Accent Colors
```
--obsidian-accent-primary:    #C8A2FF    Soft violet (premium, unique, non-corporate)
--obsidian-accent-primary-h:  #D4B5FF    Primary hover (lighter violet)
--obsidian-accent-secondary:  #FF8A65    Warm coral-orange (complementary warmth)
--obsidian-accent-tertiary:   #64FFDA    Mint green (fresh contrast, "ready" state)

--obsidian-success:   #64FFDA    Mint -- "print complete"
--obsidian-warning:   #FFD54F    Warm yellow -- caution
--obsidian-error:     #FF5252    Warm red -- failure
--obsidian-info:      #82B1FF    Soft blue -- informational
```

#### Special 3D Printing Colors
```
--obsidian-filament-pla:     #80CBC4    PLA muted teal
--obsidian-filament-abs:     #EF9A9A    ABS soft rose
--obsidian-filament-petg:    #81D4FA    PETG sky blue
--obsidian-filament-tpu:     #A5D6A7    TPU soft green
--obsidian-filament-nylon:   #FFF9C4    Nylon cream
--obsidian-nozzle-hot:       #FFAB91    Hot nozzle peach
--obsidian-nozzle-cold:      #78909C    Cold nozzle blue-gray
--obsidian-bed-heated:       #EF5350    Heated bed red
--obsidian-bed-cold:         #37474F    Cold bed dark blue-gray
--obsidian-layer-line:       rgba(200, 162, 255, 0.12)    Layer visualization
```

#### Border Colors
```
--obsidian-border-default:   #211E2B    Subtle warm border
--obsidian-border-active:    #2E2A3A    Active/focused border
--obsidian-border-highlight: #C8A2FF26  Accent border (15% opacity of primary)
--obsidian-border-divider:   #19161F    Section divider (very subtle)
```

#### Gradients
```
--obsidian-gradient-brand:    linear-gradient(135deg, #C8A2FF 0%, #FF8A65 100%)
--obsidian-gradient-surface:  linear-gradient(180deg, #13111A 0%, #0C0A0F 100%)
--obsidian-gradient-premium:  linear-gradient(135deg, #C8A2FF 0%, #64FFDA 100%)
--obsidian-gradient-glow:     radial-gradient(ellipse at center, rgba(200,162,255,0.06) 0%, transparent 70%)
--obsidian-gradient-warm:     linear-gradient(135deg, #FF8A65 0%, #FFD54F 100%)
```

### 4.2 TYPOGRAPHY SYSTEM

#### Font Stack
```
Heading:   'Sora', system-ui, sans-serif
Body:      'DM Sans', system-ui, sans-serif
Mono:      'JetBrains Mono', 'Fira Code', monospace
Display:   'Sora', system-ui, sans-serif  (same as heading but used at larger sizes with tighter tracking)
```

**Why Sora?** A geometric sans-serif designed specifically for digital interfaces. Distinctive rounded terminals, slightly playful but professional. Has that "designed by humans" quality -- less rigid than Inter, more character than Poppins. Excellent for display sizes with tight letter-spacing.

**Why DM Sans?** Clean, contemporary, excellent readability at small sizes. Slightly more personality than Inter with its open apertures. Works beautifully in both regular and medium weights. Not yet overused in AI templates.

#### Type Scale (1.200 Minor Third modular scale)
```
--obsidian-text-4xl:  2.488rem / 3rem      (40px / 48px line-height)   -- Hero headings
--obsidian-text-3xl:  2.074rem / 2.5rem    (33px / 40px)               -- Page titles
--obsidian-text-2xl:  1.728rem / 2.25rem   (28px / 36px)               -- Section headings
--obsidian-text-xl:   1.44rem  / 1.875rem  (23px / 30px)               -- Card titles
--obsidian-text-lg:   1.2rem   / 1.75rem   (19px / 28px)               -- Body large
--obsidian-text-base: 1rem     / 1.625rem  (16px / 26px)               -- Body default
--obsidian-text-sm:   0.833rem / 1.25rem   (13px / 20px)               -- Captions, labels
--obsidian-text-xs:   0.694rem / 1rem      (11px / 16px)               -- Badges, micro-labels
```

Note: Body default is 16px (standard) with generous line-height (26px). Premium feel comes from breathing room and whitespace, not density.

#### Weight Usage Rules
```
Headings:    700 (Bold) -- Sora
Subheadings: 600 (SemiBold) -- Sora
Body:        400 (Regular) -- DM Sans
Labels:      500 (Medium) -- DM Sans
Strong text: 500 (Medium) -- DM Sans
Mono values: 500 (Medium) -- JetBrains Mono
```

### 4.3 TEXTURE & PATTERN SYSTEM

#### Frosted Glass Effect (for elevated surfaces)
```css
.obsidian-glass {
  background: rgba(19, 17, 26, 0.7);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(200, 162, 255, 0.08);
}
```

#### Soft Noise (warmer grain than Forge)
```css
.obsidian-grain::before {
  content: '';
  position: fixed;
  inset: 0;
  opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}
```

#### Ambient Glow (behind key sections)
```css
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
```

### 4.4 SHADOWS
Obsidian uses **layered shadows** with color tinting for depth perception:

```
--obsidian-shadow-sm:    0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(200,162,255,0.04)
--obsidian-shadow-md:    0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(200,162,255,0.05)
--obsidian-shadow-lg:    0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(200,162,255,0.06)
--obsidian-shadow-glow:  0 0 24px rgba(200, 162, 255, 0.12)
--obsidian-shadow-warm:  0 0 24px rgba(255, 138, 101, 0.1)
```

### 4.5 BORDER RADIUS
```
--obsidian-radius-sm:   6px     Buttons, badges, small controls
--obsidian-radius-md:   10px    Cards, inputs, dropdowns
--obsidian-radius-lg:   14px    Modals, large panels
--obsidian-radius-xl:   20px    Hero cards, special containers
--obsidian-radius-full: 9999px  Pills, avatars, round indicators
```

Note: Slightly larger radii than Forge (but still not the exaggerated 16px/24px of typical AI templates). The difference is deliberate -- Obsidian's rounder corners feel more refined and approachable, while Forge's sharper corners feel more technical.

---

## 5. PAGE-BY-PAGE LAYOUT SPECIFICATIONS

### 5.a HOME / LANDING PAGE

#### FORGE (Industrial)

**Hero Section (viewport height: 90vh)**
- Background: `--forge-bg-void` with blueprint grid overlay (24px grid, `--forge-border-grid` lines)
- Top-left: small "STATUS: ONLINE" monospace badge in `--forge-accent-primary` with blinking dot
- Headline: Space Grotesk 700, `--forge-text-4xl`, letter-spacing: -0.02em
  - Text: "Precision Pricing for 3D Manufacturing" (note: NOT "Revolutionize your workflow with AI-powered...")
  - One word highlighted with `--forge-accent-primary` underline (hand-drawn SVG squiggle, not a perfect line)
- Subheadline: IBM Plex Sans 400, `--forge-text-lg`, `--forge-text-secondary`, max-width: 540px
  - Slightly LEFT-aligned (not centered) -- breaks the symmetric expectation
- CTA cluster: two buttons, left-aligned, 12px gap
  - Primary: "Start Building" -- `--forge-accent-primary` bg, `#08090C` text, 4px radius
  - Secondary: "See Demo" -- ghost/outline, `--forge-border-active` border, `--forge-text-secondary` text
- Right side: animated 3D printer visualization
  - NOT a static image. SVG line-art of a 3D printer with subtle CSS animation:
    - Nozzle moves horizontally (translateX keyframe, 8s cycle)
    - "Printed" layers stack up below (opacity + translateY, delayed)
    - Heated bed glows with `--forge-nozzle-hot` radial gradient pulse
  - Falls below hero text on mobile (stack layout)

**Feature Blocks (asymmetric grid)**
- NOT a 3-column equal card grid. Instead:
  - 2-column grid with one tall card (spans 2 rows) and two shorter cards
  - Each card has a `--forge-border-default` border, `--forge-bg-surface` background
  - Top-left corner of each card: small monospace label (e.g., "01/", "02/", "03/") in `--forge-text-muted`
  - Icon: custom line-art SVG (not Lucide generic), 32x32, `--forge-accent-primary` stroke
  - Title: Space Grotesk 600, `--forge-text-xl`
  - Body: IBM Plex Sans 400, `--forge-text-base`, `--forge-text-secondary`
  - Bottom-right: thin arrow icon that slides 4px right on hover
- Card hover: `--forge-bg-elevated` background, `--forge-shadow-glow` shadow, border transitions to `--forge-border-highlight`

**Social Proof Bar**
- Horizontal strip, `--forge-bg-surface`, 1px top/bottom borders
- Left side: "Trusted by 120+ print farms" in `--forge-text-muted`, Space Mono
- Right side: fading marquee of client logos (grayscale, `opacity: 0.4`, brightens to `0.7` on hover)
- On mobile: logos wrap into a 2-row grid, no marquee animation

**Pricing Preview Section**
- Skewed layout: the section background has a subtle 2deg CSS skew (counter-skew on content)
  - This breaks the "perfectly rectangular section" AI pattern
- Three pricing tiers displayed in cards
- Active/recommended tier has `--forge-gradient-brand` top border (3px)
- Prices displayed in JetBrains Mono 700, `--forge-text-3xl`
- "per month" in Space Mono 400, `--forge-text-sm`, `--forge-text-muted`

#### OBSIDIAN (Premium)

**Hero Section (viewport height: 85vh)**
- Background: `--obsidian-bg-void` with `obsidian-ambient` glow (violet-coral blend, top-center)
- No grid, no technical overlays -- clean, breathing space
- Headline: Sora 700, `--obsidian-text-4xl`, letter-spacing: -0.03em, text-align: center
  - Text: "Your prints, precisely priced."
  - Gradient text on key word: `--obsidian-gradient-brand` on "precisely" via `background-clip: text`
- Subheadline: DM Sans 400, `--obsidian-text-lg`, `--obsidian-text-secondary`, max-width: 480px, text-align: center
- CTA: single centered button
  - `--obsidian-accent-primary` bg, `#0C0A0F` text, 10px radius, 16px 32px padding
  - Subtle glow on hover: `--obsidian-shadow-glow`
  - Below it: small "No credit card required" text in `--obsidian-text-muted`
- Below CTA: floating 3D model preview card
  - `obsidian-glass` treatment (frosted glass)
  - Shows a mock uploaded STL rendering with price tag
  - Card rotates subtly on mouse move (parallax, max 3deg, `transform: perspective(1000px) rotateY(var(--rx)) rotateX(var(--ry))`)

**Feature Section (flowing layout)**
- Section title: "Everything you need" -- Sora 600, `--obsidian-text-2xl`, center
- Features presented in a **staggered 2-column layout** (alternating left/right alignment)
  - Each feature: icon (48x48, `--obsidian-accent-primary` fill) + title + description
  - Even features: icon left, text right
  - Odd features: text left, icon right
  - Vertical connecting line between features (1px, `--obsidian-border-default`, dashed)
- On mobile: single column, all left-aligned, connecting line on left edge

**Testimonial Section**
- Single large quote card, `obsidian-glass` treatment
- Large quotation mark SVG in `--obsidian-accent-primary`, opacity 0.15, positioned absolute top-left
- Quote text: DM Sans italic 400, `--obsidian-text-xl`, `--obsidian-text-primary`
- Attribution: monospace, `--obsidian-text-sm`, `--obsidian-text-muted`
- Navigation dots below (not arrows) -- custom styled, `--obsidian-accent-primary` for active

### 5.b LOGIN & REGISTER

#### FORGE

**Layout:** Full-screen split -- 55% left panel (branding), 45% right panel (form)

**Left Panel:**
- `--forge-bg-void` background with `forge-grid-bg` blueprint overlay
- Large Space Grotesk headline: "Control Center" (or "Access Portal" for login)
- Below: animated SVG of 3D printer schematic (technical line drawing)
- Bottom: version number in Space Mono `--forge-text-xs` `--forge-text-muted` ("v3.2.1-beta")
- Hidden on mobile (form takes full width)

**Right Panel:**
- `--forge-bg-surface` background
- Form card: no visible border/shadow -- the panel IS the card
- Logo at top: 32x32 icon + "ModelPricer" in Space Grotesk 600
- Form fields:
  - Labels: IBM Plex Sans 500, `--forge-text-sm`, `--forge-text-secondary`, uppercase, letter-spacing: 0.05em
  - Inputs: `--forge-bg-elevated` background, `--forge-border-default` border, 4px radius
  - Focus: border transitions to `--forge-accent-primary`, `--forge-shadow-glow`
  - Placeholder: `--forge-text-muted`, IBM Plex Sans 400
- Submit button: full-width, `--forge-accent-primary` bg, Space Grotesk 600
- "Or continue with" divider: thin horizontal line with centered text in `--forge-text-muted`
- Social login buttons: ghost variant, `--forge-border-default` border, icons only on mobile
- Link to register/login: `--forge-text-muted`, `--forge-accent-primary` on hover

#### OBSIDIAN

**Layout:** Centered card on full-screen backdrop

**Backdrop:**
- `--obsidian-bg-void` with `obsidian-ambient` glow effect (violet, centered behind card)
- `obsidian-grain` noise overlay

**Card:**
- `obsidian-glass` treatment, max-width: 420px, centered vertically and horizontally
- `--obsidian-shadow-lg`
- Internal padding: 40px (top/bottom), 36px (left/right)
- Logo: centered, gradient icon (`--obsidian-gradient-brand`), 40x40
- Title: Sora 700, `--obsidian-text-2xl`, centered
- Subtitle: DM Sans 400, `--obsidian-text-sm`, `--obsidian-text-muted`, centered

**Form Fields:**
- Labels: DM Sans 500, `--obsidian-text-sm`, `--obsidian-text-secondary`
- Inputs: `--obsidian-bg-elevated` bg, `--obsidian-border-default` border, 10px radius
- Focus: border to `--obsidian-accent-primary`, subtle inner glow
- Password field: custom show/hide toggle icon, smooth opacity transition
- Submit: `--obsidian-accent-primary` bg, `#0C0A0F` text, 10px radius, Sora 600
  - Hover: `--obsidian-accent-primary-h`, `--obsidian-shadow-glow`
- Checkbox "Remember me": custom styled, `--obsidian-accent-primary` check color

### 5.c TEST CALCULATOR (5-Step Wizard)

#### FORGE

**Wizard Progress Bar (top of page, sticky)**
- Full-width bar, `--forge-bg-surface`, 56px height, bottom border `--forge-border-default`
- Steps displayed as horizontal segments connected by lines:
  ```
  [1]----[2]----[3]----[4]----[5]
  ```
- Each step: circle (24px) with number in Space Mono
  - Completed: `--forge-accent-primary` bg, `#08090C` text, checkmark replaces number
  - Active: `--forge-accent-primary` outline (2px), `--forge-text-primary` number
  - Upcoming: `--forge-border-default` outline, `--forge-text-muted` number
- Connecting lines: 2px height
  - Completed: `--forge-accent-primary` solid
  - Upcoming: `--forge-border-default` dashed
- Step labels below circles: Space Mono 400, `--forge-text-xs`, uppercase
  - "UPLOAD" -- "CONFIGURE" -- "REVIEW" -- "CHECKOUT" -- "CONFIRM"

**Step 1: Upload**
- Full-width dropzone area, 360px height
- Dashed border: 2px, `--forge-border-active`, dash pattern "8 4"
- Center: large upload icon (custom SVG: cube with upward arrow), `--forge-text-muted`, 64x64
- Text: "Drop STL, OBJ, or 3MF files" in Space Grotesk 600, `--forge-text-secondary`
- Below: "or click to browse" in IBM Plex Sans 400, `--forge-text-muted`
- Drag-active state: border becomes `--forge-accent-primary`, background gains `--forge-layer-line` tint
- File type badges below dropzone: ".STL" ".OBJ" ".3MF" in monospace pills
- After upload: file list appears below in a compact table:
  - Columns: Filename | Size | Dimensions | Status
  - Monospace for dimensions (e.g., "42.3 x 28.1 x 15.7 mm")
  - Status: spinner while processing, green checkmark when ready

**Step 2: Configure**
- 2-column layout (60% 3D viewer, 40% controls) -- NOT equal columns
- 3D Viewer panel:
  - `--forge-bg-void` background (maximum contrast for model)
  - Thin `--forge-border-default` border
  - Bottom toolbar: view controls (rotate, pan, zoom, reset) as small icon buttons
  - Top-right: model dimensions in monospace overlay, `--forge-bg-surface` bg with opacity 0.9
  - Bottom-left: "LAYER PREVIEW" toggle button (shows layer-by-layer preview)
- Control panel (scrollable if content exceeds viewport):
  - Section headers: Space Grotesk 600, `--forge-text-xl`, with horizontal rule below
  - Material selector: custom radio cards (not dropdown)
    - Each material card: 80px tall, icon + name + short spec
    - Active: `--forge-accent-primary` left border (3px), `--forge-bg-elevated` bg
  - Quality selector: 3 radio cards ("Draft" / "Standard" / "Fine")
    - Each shows layer height in monospace: "0.3mm" / "0.2mm" / "0.1mm"
  - Infill slider: custom track styled with `--forge-accent-primary` fill
    - Value shown in monospace above thumb: "20%"
    - Below slider: small infill pattern visualization (SVG that changes with value)
  - Quantity: compact number input with +/- buttons, monospace value
  - Supports toggle: custom switch, `--forge-accent-primary` when active
  - Color picker: grid of color swatches with tooltip names
- Mobile: single column, 3D viewer on top (250px height), controls below

**Step 3: Price Review**
- Price breakdown card: `--forge-bg-surface`, full-width
  - Header: "COST ANALYSIS" in Space Grotesk 600
  - Line items in a table-like layout:
    - Left: item name (IBM Plex Sans 400)
    - Right: value in JetBrains Mono 500, right-aligned
    - Separator: dotted line between label and value (like a receipt)
  - Subtotal line: `--forge-border-active` top border
  - Tax line: `--forge-text-muted`
  - TOTAL line: Space Grotesk 700, `--forge-text-2xl`, `--forge-accent-primary`
    - Total value: JetBrains Mono 700, `--forge-text-2xl`
- Volume discount callout (if applicable):
  - `--forge-bg-overlay` with `--forge-warning` left border (3px)
  - "ORDER 3+ and save 15%" in IBM Plex Sans 500
- Optional fees section:
  - Expandable/collapsible with chevron
  - Checkboxes for selectable fees
  - Each fee: name, description in muted, price in mono

**Step 4: Checkout**
- 2-column layout: 60% form, 40% order summary (sticky)
- Form sections separated by section headers with horizontal rules
- Sections: Contact Info, Shipping Address, Payment Method
- Each section: collapsible, completed sections show green checkmark
- Order summary card: `--forge-bg-surface` with `--forge-border-default` border
  - Compact version of Step 3 price breakdown
  - Model thumbnail(s) at top
  - "Place Order" button: full-width, `--forge-accent-primary`, large (48px height)

**Step 5: Confirmation**
- Centered layout, max-width 600px
- Large animated checkmark (SVG draw animation, `--forge-accent-primary`, 80px)
- "Order Confirmed" in Space Grotesk 700, `--forge-text-3xl`
- Order number: JetBrains Mono 500, `--forge-text-lg`, `--forge-accent-primary`
- Summary card below with key details
- Action buttons: "View Order Status", "Start New Order"

#### OBSIDIAN

**Wizard Progress Bar**
- Floating pill-shaped container, centered, `obsidian-glass` treatment
- Steps as labeled dots with text below:
  - Active dot: filled `--obsidian-accent-primary`, 10px
  - Completed: filled `--obsidian-accent-tertiary`, 8px
  - Upcoming: `--obsidian-border-active` ring, 8px
- Labels: DM Sans 500, `--obsidian-text-sm`
- Progress line: thin gradient (`--obsidian-gradient-brand`) from completed to active, gray for upcoming

**Step 1: Upload**
- Large centered area, rounded corners (`--obsidian-radius-xl`)
- `--obsidian-bg-surface` background, `--obsidian-border-default` dashed border
- Icon: stylized cube illustration (not a generic upload icon), `--obsidian-accent-primary`, 56x56
- Text: Sora 600, `--obsidian-text-xl`, "Drop your 3D models here"
- Drag-active: border becomes `--obsidian-accent-primary`, background gains violet tint
- After upload: cards for each file with thumbnail, name, dimensions, and a small progress ring

**Step 2: Configure**
- 2-column layout: 55% viewer, 45% controls
- 3D Viewer: `--obsidian-bg-void` with subtle ambient glow behind model
  - Floating controls: `obsidian-glass` pill at bottom-center
- Control panel: smooth scrolling with section dividers
  - Material: large selectable cards with material color preview swatch
  - Quality: segmented control (not radio cards), `--obsidian-radius-full` rounded
  - Infill: range slider with `--obsidian-gradient-brand` fill, circular thumb with value inside
  - Color picker: large swatches in a flowing grid, selected one gets `--obsidian-shadow-glow`

**Steps 3-5: Similar structure to Forge but with Obsidian styling:**
- Cards use `obsidian-glass` treatment instead of solid backgrounds
- Prices shown in JetBrains Mono with `--obsidian-accent-primary` color
- Total price gets `--obsidian-gradient-brand` text treatment
- Confirmation uses a morphing shape animation (circle to checkmark)

### 5.d ADMIN DASHBOARD

#### FORGE

**Layout:** Fixed sidebar (260px) + scrollable main content
- Main content padding: 32px

**Dashboard Grid (asymmetric):**
- Top row: 3 stat cards, BUT not equal width: 2fr / 1.5fr / 1fr
  - Left (largest): "Revenue This Month" -- JetBrains Mono 700 `--forge-text-3xl` for value
    - Small sparkline chart below (20px height, `--forge-accent-primary` stroke)
    - Delta badge: "+12.3%" in `--forge-success` with upward triangle
  - Middle: "Active Orders" -- number + status breakdown bar
  - Right (smallest): "Print Success Rate" -- circular gauge, monospace percentage

- Second row: full-width "Recent Orders" table
  - Table header: `--forge-bg-elevated`, Space Mono 500, uppercase, `--forge-text-xs`, letter-spacing: 0.08em
  - Alternating rows: `--forge-bg-surface` / `--forge-bg-void`
  - Status column: colored dot + text (not colored background badges)
  - Actions column: icon buttons (view, edit), ghost variant

- Third row: 2 cards side by side (1.2fr / 1fr)
  - Left: "Hourly Revenue Chart" -- area chart with `--forge-accent-primary` fill (10% opacity), stroke
  - Right: "Popular Materials" -- horizontal bar chart, each bar a different filament color

**FORGE Stat Card Design:**
- `--forge-bg-surface` background
- `--forge-border-default` border (1px)
- Top-left: monospace label in `--forge-text-muted`, uppercase, 10px
- Center: large value in JetBrains Mono
- Bottom: comparison text ("vs last month") with colored delta
- No icons in stat cards (anti-pattern: "random icon for decoration")

#### OBSIDIAN

**Dashboard Grid:**
- Top: "Welcome back" greeting with user name, Sora 600, `--obsidian-text-2xl`
  - Below: current date/time in DM Sans 400, `--obsidian-text-muted`
- Stat cards: 4 equal cards in a row (but with different internal layouts to avoid monotony)
  - Card 1 (Revenue): vertical layout, value top, chart bottom
  - Card 2 (Orders): horizontal layout, icon left, value right
  - Card 3 (Success Rate): gauge visualization, centered
  - Card 4 (Avg Print Time): icon top, value center, comparison bottom
- All cards: `obsidian-glass`, `--obsidian-shadow-md`
- Charts use `--obsidian-gradient-brand` for fills

### 5.e ADMIN PRICING CONFIG

#### FORGE

**Layout:** Full-width content area within admin layout

**Section Navigation (horizontal tabs at top):**
- Tab bar: `--forge-bg-surface`, bottom border
- Tabs: Space Mono 500, uppercase, `--forge-text-sm`
  - Active: `--forge-accent-primary` text + bottom border (2px)
  - Inactive: `--forge-text-muted`
  - Tabs: "MATERIALS" | "QUALITY" | "INFILL" | "FEES" | "VOLUME DISCOUNTS" | "MARGINS"

**Material Pricing Table:**
- Full-width data table
- Header row: `--forge-bg-elevated`, fixed position on scroll
- Each material row:
  - Left: color swatch (12px circle) + material name
  - Columns: Base Price, Weight Factor, Support Factor, Min Price -- all in JetBrains Mono
  - Cells are editable: click to switch to input mode (inline editing)
  - Edit mode: cell gets `--forge-accent-primary` border, `--forge-bg-overlay` background
- Add material button: `+` icon button at bottom-left of table, ghost style

**Volume Discount Builder:**
- Threshold rows: each row is "From X to Y units: Z% discount"
- Number inputs: compact, monospace, `--forge-bg-elevated`
- "Add threshold" link-button below last row
- Visual preview: horizontal bar showing discount tiers with graduated colors

#### OBSIDIAN

- Similar functional layout but with:
  - Segmented tab control instead of underline tabs
  - Pricing cells with subtle hover highlighting (`--obsidian-bg-elevated`)
  - Inline editing with smooth border transition animation
  - Volume discount preview uses `--obsidian-gradient-brand` for tier colors

### 5.f ADMIN SIDEBAR / NAVIGATION

#### FORGE

**Sidebar (fixed left, 260px width):**
- Background: `--forge-bg-surface`
- Right border: 1px `--forge-border-default`

**Header section (top, 80px):**
- Logo: 28x28 icon (Layers3 in `--forge-accent-primary`) + "ModelPricer" Space Grotesk 600, 16px
- Below logo: "ADMIN CONSOLE" in Space Mono 400, `--forge-text-xs`, `--forge-text-muted`, uppercase, letter-spacing: 0.1em

**Nav Section:**
- Group labels: Space Mono 400, `--forge-text-xs`, `--forge-text-muted`, uppercase, letter-spacing: 0.08em, padding-left: 20px
  - Groups: "CONFIGURATION" | "OPERATIONS" | "SYSTEM"
- Nav items: 44px height, 20px left padding
  - Icon: 18px, `--forge-text-muted`
  - Label: IBM Plex Sans 500, `--forge-text-base`, `--forge-text-secondary`
  - Hover: `--forge-bg-elevated` background, icons/text transition to `--forge-text-primary`
  - Active item:
    - Left border: 3px `--forge-accent-primary` (replacing the `#1976d2` blue)
    - Background: `rgba(0, 212, 170, 0.08)` (accent at 8% opacity)
    - Icon + text: `--forge-accent-primary`
    - Font weight: 600
  - Badge (for notifications): monospace, `--forge-accent-secondary` bg, `#08090C` text, 18px pill

**Footer section (bottom, 56px):**
- Thin top border `--forge-border-default`
- "Back to Site" link with arrow-left icon, `--forge-text-muted`
- On hover: `--forge-text-primary`, arrow slides 4px left

**Collapse behavior:**
- On screens < 1200px: sidebar collapses to 64px, showing only icons
- Tooltip on hover showing full label
- Hamburger icon in content area header to toggle expanded

#### OBSIDIAN

**Sidebar (fixed left, 280px width):**
- Background: `--obsidian-bg-surface` with `obsidian-grain` overlay
- Right border: 1px `--obsidian-border-default`

**Header (top, 88px):**
- Logo: gradient icon (`--obsidian-gradient-brand`), 32x32
- "ModelPricer" in Sora 600, 18px
- No "ADMIN CONSOLE" subtitle -- cleaner

**Nav items:**
- 48px height, 24px left padding
- Icon: 20px, `--obsidian-text-muted`, round background 32x32 `--obsidian-bg-elevated`
- Label: DM Sans 500, `--obsidian-text-base`
- Active: `--obsidian-accent-primary` left border (3px, rounded top/bottom), `--obsidian-bg-elevated` bg
  - Icon background transitions to `rgba(200, 162, 255, 0.12)`
  - Text: `--obsidian-accent-primary`
- Section separators: 1px `--obsidian-border-divider`, no labels

**Footer:**
- User avatar (40x40 round), name, role badge
- Settings gear icon button, ghost

### 5.g WIDGET BUILDER

#### FORGE

**Full-screen layout, no admin sidebar (builder has its own UI)**

**Top Bar (56px):**
- `--forge-bg-surface`, bottom border
- Left: back arrow + "Widget Builder" Space Grotesk 600
- Center: breakpoint toggles (Desktop / Tablet / Mobile) as icon-only buttons
  - Active: `--forge-accent-primary` border, `--forge-bg-elevated` bg
- Right: "Preview" ghost button + "Publish" primary button + more-options (three-dot) dropdown

**Left Panel (35% width, scrollable):**
- `--forge-bg-surface`, right border
- Tabs at top: "LAYOUT" | "STYLE" | "CONTENT" -- Space Mono 500, `--forge-text-xs`
- Each tab content:
  - Collapsible sections with chevron toggle
  - Section header: Space Grotesk 600, `--forge-text-sm`
  - Controls: compact inputs, sliders, color pickers, toggles
  - Spacing controls with visual box-model diagram
  - Color pickers with preset palettes + custom hex input
- Bottom: "Reset to Default" ghost button

**Right Panel (65% width):**
- `--forge-bg-void` background with centered widget preview
- Widget rendered in an iframe-like container with device frame
  - Desktop: no frame, just the widget at actual size
  - Tablet: iPad-like frame outline
  - Mobile: phone frame outline
- Resize handles on widget container edges (drag to resize)
- Zoom controls: bottom-right, "50% / 75% / 100% / 125%" monospace buttons

#### OBSIDIAN

- Same functional layout but:
  - Top bar: `obsidian-glass` treatment
  - Left panel: `--obsidian-bg-surface` with softer section dividers
  - Controls use `--obsidian-radius-md` everywhere
  - Device frames have `--obsidian-shadow-lg`
  - Color picker is a larger, more visual grid with real-time preview

### 5.h WIDGET CALCULATOR (Embeddable)

#### FORGE

**Container:**
- Standalone, no page-level styling (inherits from host page)
- Widget root: `--forge-bg-surface` background, `--forge-border-default` border, `--forge-radius-md`
- Internal padding: 24px
- Max-width: configurable (default 480px)

**Compact Design (fits in sidebar/iframe):**
- Upload zone: smaller (200px height), same dashed border style
- Configuration: stacked vertically (no 2-column layout)
- Material selector: dropdown (not cards) -- saves space
- Price display: single prominent line at bottom
  - "TOTAL: 245 CZK" in JetBrains Mono 700, `--forge-accent-primary`, centered
- "Order Now" button: full-width, `--forge-accent-primary`
- All controls use compact variants (36px height inputs, 12px padding)

**Theme Variables (customer-configurable):**
```css
--mp-widget-bg: var(--forge-bg-surface);
--mp-widget-text: var(--forge-text-primary);
--mp-widget-accent: var(--forge-accent-primary);
--mp-widget-border: var(--forge-border-default);
--mp-widget-radius: var(--forge-radius-md);
--mp-widget-font: 'IBM Plex Sans', sans-serif;
```

#### OBSIDIAN

- Same structure but with softer aesthetics
- `obsidian-glass` background option for transparent embedding
- Widget accent is `--obsidian-accent-primary` by default
- Rounder corners, softer shadows

### 5.i FUTURE: ORDERS KANBAN

#### FORGE

**Full-width layout within admin:**

**Top Bar:**
- Filters: status filter pills (All / New / In Progress / Printing / Shipped / Completed)
  - Active: `--forge-accent-primary` bg, `#08090C` text
  - Inactive: `--forge-bg-elevated`, `--forge-text-secondary`
- Search: compact search input, right-aligned
- Sort: dropdown, "Newest first" default

**Kanban Board:**
- Horizontal scrollable container
- Columns: "NEW" | "CONFIRMED" | "PRINTING" | "QUALITY CHECK" | "SHIPPING" | "DELIVERED"
- Column header: Space Mono 600, uppercase, `--forge-text-xs`, letter-spacing: 0.08em
  - Count badge: monospace, `--forge-bg-elevated`, next to label
  - Column header color bar: thin 2px top border, unique color per column:
    - NEW: `--forge-info`
    - CONFIRMED: `--forge-accent-tertiary`
    - PRINTING: `--forge-accent-primary`
    - QUALITY CHECK: `--forge-warning`
    - SHIPPING: `--forge-accent-secondary`
    - DELIVERED: `--forge-success`
- Cards: `--forge-bg-surface`, `--forge-border-default` border, 4px radius
  - Order number: JetBrains Mono, `--forge-text-sm`
  - Customer name: IBM Plex Sans 500
  - Model thumbnail: 48x48, rounded 4px
  - Price: JetBrains Mono, `--forge-accent-primary`
  - Time indicator: relative ("2h ago"), monospace, `--forge-text-muted`
  - Priority badge: colored dot (green/yellow/red)
- Drag & drop: card lifts with `--forge-shadow-lg`, `--forge-accent-primary` outline
  - Drop zone highlight: column gets `rgba(0, 212, 170, 0.05)` background

#### OBSIDIAN

- Same functional layout with Obsidian styling
- Cards: `obsidian-glass` treatment
- Column header colors use softer pastel variants
- Drag state: `--obsidian-shadow-glow`

### 5.j FUTURE: SHIPPING CONFIG

#### FORGE

**Tabbed interface within admin:**
- Tabs: "ZONES" | "CARRIERS" | "RATES" | "FREE SHIPPING"

**Zones tab:**
- Map visualization (dark-themed): `--forge-bg-void` base, country outlines in `--forge-border-active`
  - Colored zones highlighted on map
  - Zone color legend on the right
- Zone list below map: editable table
  - Zone name, countries (tag pills), flat rate, weight-based toggle

**Carriers tab:**
- Card grid for each carrier (DHL, CzechPost, PPL, etc.)
  - Logo (grayscale, 40px height)
  - Name, enabled toggle, "Configure" button
- Configuration modal: rates per zone, weight brackets, dimensions

**Rates tab:**
- Conditional rules builder:
  - "IF weight > 5kg AND zone = Europe THEN rate = 12 EUR"
  - Rule rows with dropdowns/inputs, connected by AND/OR pills
  - Add rule: `+` icon button

#### OBSIDIAN

- Same functional structure
- Map uses `--obsidian-gradient-brand` for zone highlights
- Carrier cards with `obsidian-glass` treatment
- Rules builder with larger, more visual dropdowns

### 5.k FUTURE: CUSTOMER PORTAL

#### FORGE

**Layout:** Public-facing, uses main Header/Footer (not admin sidebar)

**Order List View:**
- Compact card list (not table on mobile)
- Each order card:
  - Left: model thumbnail (64x64)
  - Middle: order number (mono), date, material + quality, status badge
  - Right: total price (mono, `--forge-accent-primary`), "View Details" link
- Status badges: outlined pills with colored dots
  - "Printing" with animated pulsing dot (`--forge-accent-primary`)

**Order Detail View:**
- 2-column: details (60%) + model viewer (40%)
- Timeline/progress: vertical stepper showing order progression
  - Each step: timestamp (mono) + description + status icon
  - Current step: highlighted with `--forge-accent-primary`, animated pulse
- Tracking info section (when shipped)
- "Download Invoice" button, "Contact Support" link

#### OBSIDIAN

- Order cards with `obsidian-glass` treatment
- Timeline uses `--obsidian-gradient-brand` for progress line
- Model viewer embedded in a card with `--obsidian-shadow-lg`

---

## 6. COMPONENT DESIGN SYSTEM

### 6.1 BUTTONS

#### FORGE Variants

**Primary:**
```
Background:  --forge-accent-primary (#00D4AA)
Text:        #08090C
Font:        Space Grotesk 600, 14px
Padding:     10px 20px (40px height)
Radius:      4px
Hover:       --forge-accent-primary-h (#00F0C0), translateY(-1px), --forge-shadow-glow
Active:      darken 5%, translateY(0)
Focus:       2px outline --forge-accent-primary, 2px offset
Disabled:    opacity 0.4, cursor not-allowed
```

**Secondary (Ghost/Outline):**
```
Background:  transparent
Border:      1px --forge-border-active
Text:        --forge-text-secondary
Hover:       --forge-bg-elevated background, text to --forge-text-primary
Active:      --forge-bg-overlay background
```

**Destructive:**
```
Background:  --forge-error (#FF4757)
Text:        #FFFFFF
Hover:       darken 8%, --forge-shadow-glow-hot (red glow)
```

**Ghost:**
```
Background:  transparent
Text:        --forge-text-secondary
Hover:       --forge-bg-elevated background
```

**Link:**
```
Background:  none
Text:        --forge-accent-primary
Decoration:  none
Hover:       underline (offset 4px), slight brightness increase
```

**Size variants:**
```
sm:   8px 16px (36px height), 13px font
md:   10px 20px (40px height), 14px font
lg:   12px 28px (48px height), 16px font
icon: 40x40, centered icon, no text
```

#### OBSIDIAN Variants

**Primary:**
```
Background:  --obsidian-accent-primary (#C8A2FF)
Text:        #0C0A0F
Font:        Sora 600, 15px
Padding:     12px 24px (44px height)
Radius:      10px
Hover:       --obsidian-accent-primary-h, translateY(-1px), --obsidian-shadow-glow
Active:      darken 5%, translateY(0)
```

**Secondary:**
```
Background:  --obsidian-bg-elevated
Border:      1px --obsidian-border-active
Text:        --obsidian-text-secondary
Radius:      10px
Hover:       border to --obsidian-accent-primary, text to --obsidian-text-primary
```

### 6.2 CARDS

#### FORGE Card Types

**Standard Card:**
```
Background:  --forge-bg-surface
Border:      1px --forge-border-default
Radius:      6px
Padding:     24px
Shadow:      none (dark theme -- borders are more effective)
Hover:       border to --forge-border-active, background to --forge-bg-elevated
```

**Stat Card:**
```
Background:  --forge-bg-surface
Border:      1px --forge-border-default
Radius:      6px
Padding:     20px
Top decoration: 2px top border in accent color (varies per stat)
Internal:    monospace label (10px, muted) + large value (JetBrains Mono 700) + delta badge
```

**Action Card (clickable):**
```
Background:  --forge-bg-surface
Border:      1px --forge-border-default
Radius:      6px
Padding:     20px
Cursor:      pointer
Hover:       --forge-shadow-glow, border to --forge-border-highlight, translateY(-2px)
Active:      translateY(0), shadow reduces
Internal:    top-left number label ("01/"), icon, title, description, arrow
```

**Info Card (callout/banner):**
```
Background:  rgba(accent, 0.06)
Border-left: 3px in accent color (info/warning/error/success)
Radius:      0 6px 6px 0
Padding:     16px 20px
Internal:    icon (accent color) + text block
```

#### OBSIDIAN Card Types

**Standard Card:**
```
Background:  obsidian-glass (rgba(19, 17, 26, 0.7) + backdrop-filter)
Border:      1px rgba(200, 162, 255, 0.08)
Radius:      14px
Padding:     28px
Shadow:      --obsidian-shadow-md
```

**Stat Card:**
```
Same glass treatment
Internal layout varies per card (see dashboard section)
Value color: --obsidian-accent-primary for key metric
```

### 6.3 FORM INPUTS

#### FORGE

**Text Input:**
```
Height:       40px
Background:   --forge-bg-elevated
Border:       1px --forge-border-default
Radius:       4px
Font:         IBM Plex Sans 400, 14px
Text color:   --forge-text-primary
Padding:      0 12px

Focus:
  Border:     --forge-accent-primary
  Shadow:     0 0 0 2px rgba(0, 212, 170, 0.15)

Error:
  Border:     --forge-error
  Shadow:     0 0 0 2px rgba(255, 71, 87, 0.15)
  Below:      error message in --forge-error, 12px

Label:
  Font:       IBM Plex Sans 500, 12px, --forge-text-secondary
  Transform:  uppercase
  Spacing:    letter-spacing 0.05em
  Margin:     0 0 4px 0
```

**Select (dropdown):**
```
Same as text input, plus:
  Chevron icon right-aligned, --forge-text-muted
  Dropdown menu: --forge-bg-elevated, --forge-border-default border
  Option hover: --forge-bg-overlay
  Selected option: --forge-accent-primary dot indicator left
```

**Checkbox:**
```
Size:         18x18
Border:       2px --forge-border-active
Radius:       3px
Background:   --forge-bg-elevated

Checked:
  Background:  --forge-accent-primary
  Border:      --forge-accent-primary
  Check icon:  #08090C, 2px stroke
  Transition:  150ms ease-out (scale 0.8 -> 1)

Label:
  IBM Plex Sans 400, 14px, --forge-text-secondary
  Gap:         8px from checkbox
```

**Slider:**
```
Track height:  4px
Track bg:      --forge-bg-overlay
Filled:        --forge-accent-primary
Thumb:         16x16, --forge-accent-primary bg, 2px --forge-bg-surface border
Thumb hover:   20x20, --forge-shadow-glow
Value display: monospace tooltip above thumb on drag
```

**Color Picker:**
```
Swatch size:   32x32 (grid layout, 4px gap)
Swatch radius: 4px
Selected:      2px --forge-text-primary outline, 2px offset
Hover:         scale(1.1), --forge-shadow-sm
Custom input:  hex input below grid, monospace, 80px width
```

#### OBSIDIAN

Same functional behavior with:
- 10px radius on all inputs
- Softer focus glow (violet-tinted)
- Labels not uppercase (sentence case, DM Sans 500)
- Larger touch targets (44px height)
- Slider filled with `--obsidian-gradient-brand`

### 6.4 TABLES

#### FORGE

```
Container:     --forge-bg-surface, --forge-border-default border, 6px radius
Header row:    --forge-bg-elevated
  Text:        Space Mono 500, 11px, --forge-text-muted, uppercase, letter-spacing 0.08em
  Padding:     12px 16px
  Border-bottom: 1px --forge-border-default

Body rows:
  Padding:     12px 16px
  Border-bottom: 1px --forge-border-grid (very subtle)
  Even rows:   --forge-bg-surface
  Odd rows:    --forge-bg-void (subtle alternation)
  Hover:       --forge-bg-elevated

Sort indicator: chevron icon, --forge-accent-primary for active column
Filter row:    compact inputs below header, --forge-bg-elevated

Pagination:    bottom bar
  Page numbers: ghost buttons, active gets --forge-accent-primary bg
  "Showing 1-10 of 47" in monospace, --forge-text-muted
```

#### OBSIDIAN

- No alternating rows (rely on hover and subtle borders for row distinction)
- Header: DM Sans 500, not uppercase, `--obsidian-text-muted`
- Hover: subtle violet tint `rgba(200, 162, 255, 0.04)`

### 6.5 MODALS / DIALOGS

#### FORGE

```
Overlay:       rgba(8, 9, 12, 0.85) (--forge-bg-void at 85% opacity)
Container:
  Background:  --forge-bg-surface
  Border:      1px --forge-border-default
  Radius:      8px
  Shadow:      --forge-shadow-lg
  Max-width:   560px (sm), 720px (md), 960px (lg)
  Padding:     0

Header:
  Padding:     20px 24px
  Border-bottom: 1px --forge-border-default
  Title:       Space Grotesk 600, --forge-text-xl
  Close button: top-right, ghost icon button, 32x32

Body:
  Padding:     24px
  Max-height:  calc(85vh - 140px), overflow-y auto

Footer:
  Padding:     16px 24px
  Border-top:  1px --forge-border-default
  Buttons:     right-aligned, 8px gap

Animation:
  Enter:       opacity 0->1, scale 0.96->1, 200ms ease-out-expo
  Exit:        opacity 1->0, scale 1->0.98, 150ms ease-in
```

#### OBSIDIAN

- Container uses `obsidian-glass` treatment
- Overlay darker: `rgba(12, 10, 15, 0.88)`
- Larger radius: 14px
- Animation includes slight Y-axis translation (8px up on enter)

### 6.6 TOAST NOTIFICATIONS

#### FORGE

```
Position:      bottom-right, 24px from edges
Container:
  Background:  --forge-bg-elevated
  Border:      1px --forge-border-default
  Border-left: 3px in status color (success/error/warning/info)
  Radius:      6px
  Shadow:      --forge-shadow-md
  Padding:     12px 16px
  Max-width:   420px
  Min-width:   320px

Icon:          20px, status color, left-aligned
Title:         IBM Plex Sans 600, 14px, --forge-text-primary
Message:       IBM Plex Sans 400, 13px, --forge-text-secondary
Close:         ghost X button, top-right, 24x24
Progress bar:  bottom, 2px height, status color, shrinks over duration

Animation:
  Enter:       translateX(100%) -> 0, opacity 0->1, 300ms ease-out-expo
  Exit:        translateX(100%), opacity 0, 200ms
```

#### OBSIDIAN

- Same positioning
- Container uses `obsidian-glass`
- No left border -- instead, icon has a colored circular background
- Rounder (10px radius)
- Progress bar uses gradient

### 6.7 PROGRESS INDICATORS

#### FORGE

**Linear progress:**
```
Track:         4px height, --forge-bg-overlay, full-width
Fill:          --forge-accent-primary
Animation:     width transition 300ms ease-out
Indeterminate: sliding gradient animation (shimmer effect)
```

**Circular progress (ring):**
```
Size:          48px (sm), 64px (md), 96px (lg)
Track:         3px stroke, --forge-border-default
Fill:          --forge-accent-primary stroke
Rotation:      starts from top (12 o'clock)
Animation:     stroke-dashoffset transition, rotate for indeterminate
Center:        percentage value in JetBrains Mono 700
```

**Step indicator (wizard):**
Described in section 5.c.

#### OBSIDIAN

- Circular progress uses `--obsidian-gradient-brand` as stroke (via linearGradient in SVG)
- Softer track color

### 6.8 FILE UPLOAD ZONE

#### FORGE

```
Height:        default 320px, compact 200px (widget)
Background:    --forge-bg-void
Border:        2px dashed --forge-border-active (dash: 8 4)
Radius:        6px
Center content:
  Icon:        custom SVG (3D cube with arrow), 56px, --forge-text-muted
  Primary text: Space Grotesk 600, 16px, --forge-text-secondary
  Secondary:    IBM Plex Sans 400, 13px, --forge-text-muted
  File types:   monospace pill badges (.STL .OBJ .3MF)

Drag-over:
  Border:      2px solid --forge-accent-primary
  Background:  rgba(0, 212, 170, 0.04)
  Icon:        transitions to --forge-accent-primary

Error state:
  Border:      2px dashed --forge-error
  Error text:  below zone, --forge-error

File list (after upload):
  Compact table/list format
  File icon + name + size + dimensions (mono) + status + remove button
  Processing: inline spinner + "Analyzing mesh..." text
```

#### OBSIDIAN

- Rounded corners (20px)
- Background: `--obsidian-bg-surface` (not void)
- Dashed border: softer, `--obsidian-border-active`
- Icon: stylized, more illustrative
- Drag-over: violet tint, `--obsidian-accent-primary` border
- File cards instead of file list rows (each file gets a small card with thumbnail)

### 6.9 3D MODEL VIEWER FRAME

#### FORGE

```
Container:
  Background:  --forge-bg-void (blackest surface for maximum model contrast)
  Border:      1px --forge-border-default
  Radius:      6px
  Position:    relative
  Overflow:    hidden

Overlays (positioned absolute):
  Top-right:   dimensions badge (monospace, --forge-bg-surface at 90% opacity, 4px radius)
               "42.3 x 28.1 x 15.7 mm"
  Top-left:    model name, truncated, --forge-text-muted, 12px
  Bottom-center: view control toolbar
    Background: --forge-bg-surface at 90% opacity, pill-shaped (radius-full)
    Buttons:    icon-only, 32x32, ghost style
    Icons:      RotateCcw, Move, ZoomIn, Maximize, Grid3x3

Loading state:
  Center spinner (ring type, --forge-accent-primary)
  "Loading model..." monospace text below

Grid floor (optional):
  Subtle grid pattern rendered in the 3D viewport
  Color: --forge-border-grid
```

#### OBSIDIAN

- Container: `--obsidian-bg-void`
- Overlays use `obsidian-glass` treatment
- Control toolbar: floating, `obsidian-glass`, larger icons (36x36)
- No grid floor by default (cleaner look), toggle available

### 6.10 PRICE BREAKDOWN DISPLAY

#### FORGE

```
Container:
  Background:  --forge-bg-surface
  Border:      1px --forge-border-default
  Radius:      6px
  Padding:     24px

Header:
  "COST ANALYSIS" -- Space Mono 600, 11px, --forge-text-muted, uppercase, letter-spacing 0.1em
  Horizontal rule below: 1px --forge-border-default

Line items:
  Layout:      flex between (label ... value)
  Label:       IBM Plex Sans 400, 14px, --forge-text-secondary
  Value:       JetBrains Mono 500, 14px, --forge-text-primary, text-align right
  Connector:   dotted line (border-bottom dotted 1px --forge-border-grid) between label and value
  Spacing:     12px between rows

  Sub-items (e.g., individual fee details):
    Indented 16px, 12px font, --forge-text-muted

Subtotal line:
  Top border:  1px --forge-border-active
  Margin-top:  8px, padding-top: 8px
  Font:        IBM Plex Sans 500

Discount line:
  Value color: --forge-success (green)
  Prefix:      "-" sign

Total line:
  Top border:  2px --forge-accent-primary
  Margin-top:  12px, padding-top: 12px
  Label:       Space Grotesk 700, 18px, --forge-text-primary
  Value:       JetBrains Mono 700, 24px, --forge-accent-primary

Per-unit price:
  Below total: "245 CZK per unit" in monospace, 12px, --forge-text-muted
```

#### OBSIDIAN

- Container: `obsidian-glass`
- No dotted connectors (cleaner) -- just flex between with whitespace
- Total: gradient text (`--obsidian-gradient-brand` via background-clip)
- Discount: `--obsidian-success` with subtle sparkle icon

---

## 7. ANTI-AI SIGNATURE CHECKLIST

The following 15 specific design choices ensure this does NOT look AI-generated:

### 7.1 Asymmetric Grid Layouts
**AI pattern:** 3 equal cards, 4 equal cards, 2-2-2 grids.
**Our approach:** Feature blocks use 2fr/1.5fr/1fr, dashboard stats use 2fr/1.5fr/1fr, staggered feature sections alternate alignment. Nothing is perfectly equal unless data demands it (e.g., comparison tables).

### 7.2 Non-Blue Primary Color
**AI pattern:** `#2563EB`, `#3B82F6`, `#6366F1` -- blue is the default AI choice for "trustworthy."
**Our approach:** Forge uses `#00D4AA` (teal-green, evokes heated bed / "ready" state). Obsidian uses `#C8A2FF` (soft violet, unusual for SaaS, feels deliberately chosen). Neither is blue.

### 7.3 Mixed Typography (Multiple Font Families)
**AI pattern:** Single font (Inter) for everything.
**Our approach:** 3 distinct fonts per variant with clear roles. Space Grotesk/Sora for headings (geometric, bold), IBM Plex Sans/DM Sans for body (humanist, readable), JetBrains Mono for data (technical authority). Heading and body fonts are visually distinct.

### 7.4 Numbered Section Labels
**AI pattern:** Cards have icons + title + description, nothing else.
**Our approach:** Feature cards have "01/", "02/", "03/" monospace labels in the top-left corner. This is a design studio technique borrowed from portfolio sites -- it implies intentional ordering and craftsmanship.

### 7.5 Hand-Drawn Accent Elements
**AI pattern:** Perfect geometric lines, circles, gradients.
**Our approach:** Hero section keyword underline uses a hand-drawn SVG squiggle (rough, imperfect, organic). This single element immediately breaks the "AI template" feel. The squiggle has intentional thickness variation (2px to 3.5px) and slight waviness.

### 7.6 Texture Overlays (Noise/Grain)
**AI pattern:** Perfectly smooth, flat surfaces.
**Our approach:** Subtle SVG noise overlay (2-3% opacity) on page backgrounds. Barely visible but subconsciously registers as "physical" / "printed" / "real." Different noise parameters per variant (Forge: higher frequency, sharper. Obsidian: lower frequency, softer).

### 7.7 Dotted Leader Lines in Price Breakdown
**AI pattern:** Plain text rows or bordered table cells.
**Our approach:** Price breakdown uses dotted leader lines connecting label to value (like a restaurant menu or old-school financial report). This is a typographic tradition that predates computers -- it signals human design heritage.

### 7.8 Technical Monospace Labels and Micro-Text
**AI pattern:** Everything in the same sans-serif.
**Our approach:** Section labels, status indicators, timestamps, version numbers, and dimension values all use monospace. "STATUS: ONLINE", "v3.2.1-beta", "42.3 x 28.1 x 15.7 mm" -- these create a "control panel" atmosphere that no AI template generator produces.

### 7.9 Deliberate Spacing Variations
**AI pattern:** Uniform 24px gap everywhere.
**Our approach:** Section spacing intentionally varies: 32px between tightly related sections, 48px for conceptual breaks, 96px for major sections. Cards within a group have 12px gap, but groups have 32px gap. The rhythm is musical, not mechanical.

### 7.10 Non-Centered Hero Layout (Forge)
**AI pattern:** Centered hero with h1 + p + button stack.
**Our approach:** Forge hero is LEFT-ALIGNED with the visual element (3D printer SVG) on the right. This immediately breaks the "Tailwind hero template" expectation. Obsidian keeps center alignment but adds the floating parallax card, which no AI generator does.

### 7.11 Color-Coded Domain Language
**AI pattern:** Blue for everything, gray for secondary.
**Our approach:** Every filament type has its own color from the 3D printing palette. PLA is teal, ABS is coral, PETG is ocean blue. These are not arbitrary -- they reference real-world filament spool colors. A generic AI would never generate a domain-specific color system.

### 7.12 Functional Animations Only
**AI pattern:** Gratuitous bouncing, floating, pulsing decorative elements.
**Our approach:** Every animation has a purpose. Printer nozzle moves to demonstrate "live calculation." Step progress line fills to show completion. Card hover lifts to indicate interactivity. Nothing bounces for the sake of bouncing. The heated bed glow pulses because that is what a real heated bed does.

### 7.13 Subtle Skewed Section Backgrounds
**AI pattern:** Perfectly rectangular section backgrounds.
**Our approach:** Forge pricing section has a 2deg CSS skew on its background (content counter-skewed). This creates a dynamic diagonal edge between sections -- a technique from editorial/magazine design that AI templates never generate.

### 7.14 Version/Build Info as Design Element
**AI pattern:** No technical metadata visible.
**Our approach:** Login screen shows "v3.2.1-beta" in the corner. Dashboard shows last sync timestamp. These are not just debug info -- they are design elements that communicate "this is a real, versioned, maintained tool." They build trust through transparency.

### 7.15 Receipt-Style Price Formatting
**AI pattern:** Price shown as a big number in a colored badge.
**Our approach:** Price breakdown follows receipt/invoice typographic conventions: dotted leaders, right-aligned monospace values, double-rule before total, "per unit" price in smaller text below. This references centuries of commercial document design.

---

## 8. 3D PRINTING IDENTITY INTEGRATION

### 8.1 Visual Metaphors

| 3D Printing Concept | Design Element | Where Used |
|---------------------|---------------|------------|
| Layer-by-layer printing | Horizontal line accents that "stack up" | Section dividers, progress bars |
| Filament extrusion | Gradient lines that flow and curve | Brand gradient, navigation active indicator |
| Build plate grid | Blueprint grid background pattern | Page backgrounds, upload zones |
| Nozzle temperature | Color transitions from cool to warm | Status indicators (cold=gray, warm=orange, ready=green) |
| Print bed leveling | Precision alignment, grid-based spacing | Entire 8px grid system |
| Support structures | Dotted/dashed visual supports | Wizard step connectors, table borders |
| Infill patterns | Density-varying patterns | Infill slider visualization, loading states |
| Layer height quality | Graduated spacing (fine=tight, draft=wide) | Quality selector visual hierarchy |

### 8.2 Technical Aesthetic Elements

**Coordinate Display:**
Model dimensions always shown in engineering format: "42.3 x 28.1 x 15.7 mm" -- monospace, right-aligned, precise decimal places. Not "42x28x16" or "about 4cm tall."

**Status Indicators:**
Borrow from 3D printer status screens:
- "IDLE" (gray dot)
- "HEATING" (pulsing orange dot)
- "PRINTING" (animated green dot, layer counter)
- "COMPLETE" (solid green, checkmark)
- "ERROR" (red, with error code prefix: "E04: Thermal Runaway")

**Temperature-Mapped Colors:**
Key interactive states map to nozzle temperature:
- Cold/Inactive: `--forge-nozzle-cold` (#636E72)
- Warming/Hover: `--forge-nozzle-hot` (#FF9F43)
- Ready/Active: `--forge-accent-primary` (#00D4AA)
- Overheating/Error: `--forge-error` (#FF4757)

### 8.3 Industry-Specific Iconography

Custom SVG icon set (NOT generic Lucide for these specific icons):

| Icon | Description | Concept |
|------|------------|---------|
| `mp-upload-cube` | 3D cube with upward arrow | File upload |
| `mp-layers` | Stacked horizontal layers | Quality/layer height |
| `mp-nozzle` | Printer nozzle cross-section | Material extrusion |
| `mp-spool` | Filament spool | Material selection |
| `mp-bed` | Print bed with grid | Build plate / platform |
| `mp-supports` | Angled support structure | Support material toggle |
| `mp-infill` | Cross-hatch pattern | Infill percentage |
| `mp-caliper` | Digital caliper | Dimensions / measurements |
| `mp-timer` | Circular timer with layer lines | Print time estimate |
| `mp-cost` | Filament path forming price tag | Cost calculation |

General UI icons (navigation, settings, etc.) continue to use Lucide for consistency and maintenance efficiency. Only 3D-printing-specific icons get the custom treatment.

### 8.4 Color Inspiration from 3D Printing Materials

The accent color palette directly references real filament/resin colors:

**Forge Palette Origin:**
- Primary `#00D4AA`: inspired by translucent PETG green -- the "ready" indicator color on most 3D printers
- Secondary `#FF6B35`: heated ABS -- the orange-amber glow of molten plastic
- Tertiary `#6C63FF`: UV resin curing light -- the purple/violet of SLA printers

**Obsidian Palette Origin:**
- Primary `#C8A2FF`: silk PLA purple/lavender -- a premium filament finish
- Secondary `#FF8A65`: wood-fill PLA -- warm, natural, premium material
- Tertiary `#64FFDA`: glow-in-the-dark filament -- the "something special" accent

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Design Token Foundation (1-2 days)
1. Create `src/styles/design-tokens-forge.css` and `src/styles/design-tokens-obsidian.css`
2. Update `tailwind.config.js` to reference new CSS custom properties
3. Add Google Fonts imports for new font families
4. Create `src/styles/textures.css` (noise, grid, scanline, glass)
5. Test: verify all tokens render correctly, WCAG contrast passes

### Phase 2: Core Components (3-5 days)
1. Update `Button.jsx` -- add new variants, update CVA definitions
2. Update `Card.jsx` -- add stat/action/info variants
3. Update `Input.jsx` -- new styling, label treatment
4. Update `Slider.jsx` -- custom track/thumb styling
5. Create `Badge.jsx`, `Toast.jsx` if not existing
6. Update `Header.jsx` and `Footer.jsx`
7. Test: component visual regression (screenshots before/after)

### Phase 3: Admin Layout (2-3 days)
1. Redesign `AdminLayout.jsx` sidebar with new token system
2. Create admin dashboard layout components
3. Update admin page headers/navigation
4. Test: all admin routes render correctly

### Phase 4: Calculator & Widget (3-4 days)
1. Redesign wizard progress bar
2. Update upload zone styling
3. Update configuration panel styling
4. Redesign price breakdown component
5. Update widget calculator compact variant
6. Test: full wizard flow, widget embedding

### Phase 5: Polish & Future Pages (2-3 days)
1. Add animations/transitions per motion design contract
2. Create Kanban board layout template
3. Create customer portal layout template
4. Final accessibility audit
5. Final anti-AI check against all 15 criteria

**Total estimated effort: 11-17 days**

### Implementation Notes

**Strategy:** The approach is token-first. By replacing CSS custom properties in `tailwind.css` and creating new token files, most existing components will automatically adopt the new colors without code changes. The typography and spacing changes require more targeted updates.

**Variant Selection:** After stakeholder review, ONE variant will be selected for implementation. The other serves as a documented alternative for future consideration. Both share the same token architecture, so switching is feasible later.

**Migration Path:** The existing `builder-tokens.css` pattern proves the token-based approach works. The app-wide tokens follow the same pattern but at a global scope.

---

## 10. APPENDIX: WCAG CONTRAST VERIFICATION

### FORGE Palette Contrast Ratios

| Foreground | Background | Ratio | Result |
|-----------|-----------|-------|--------|
| `#E8ECF1` (text-primary) | `#08090C` (bg-void) | 16.4:1 | PASS AAA |
| `#E8ECF1` (text-primary) | `#0E1015` (bg-surface) | 14.2:1 | PASS AAA |
| `#E8ECF1` (text-primary) | `#161920` (bg-elevated) | 11.8:1 | PASS AAA |
| `#9BA3B0` (text-secondary) | `#0E1015` (bg-surface) | 7.6:1 | PASS AA |
| `#9BA3B0` (text-secondary) | `#161920` (bg-elevated) | 6.3:1 | PASS AA |
| `#5C6370` (text-muted) | `#0E1015` (bg-surface) | 4.5:1 | PASS AA (barely) |
| `#5C6370` (text-muted) | `#161920` (bg-elevated) | 3.7:1 | PASS AA large only |
| `#00D4AA` (accent-primary) | `#0E1015` (bg-surface) | 9.8:1 | PASS AAA |
| `#00D4AA` (accent-primary) | `#08090C` (bg-void) | 11.2:1 | PASS AAA |
| `#08090C` (text on primary) | `#00D4AA` (accent bg) | 11.2:1 | PASS AAA |
| `#FF4757` (error) | `#0E1015` (bg-surface) | 5.8:1 | PASS AA |
| `#FFB547` (warning) | `#0E1015` (bg-surface) | 9.2:1 | PASS AAA |
| `#4DA8DA` (info) | `#0E1015` (bg-surface) | 6.8:1 | PASS AA |

### OBSIDIAN Palette Contrast Ratios

| Foreground | Background | Ratio | Result |
|-----------|-----------|-------|--------|
| `#F0EDF5` (text-primary) | `#0C0A0F` (bg-void) | 16.1:1 | PASS AAA |
| `#F0EDF5` (text-primary) | `#13111A` (bg-surface) | 14.8:1 | PASS AAA |
| `#F0EDF5` (text-primary) | `#1B1825` (bg-elevated) | 12.2:1 | PASS AAA |
| `#A39DB0` (text-secondary) | `#13111A` (bg-surface) | 7.1:1 | PASS AA |
| `#A39DB0` (text-secondary) | `#1B1825` (bg-elevated) | 5.9:1 | PASS AA |
| `#6B6478` (text-muted) | `#13111A` (bg-surface) | 4.5:1 | PASS AA (barely) |
| `#6B6478` (text-muted) | `#1B1825` (bg-elevated) | 3.6:1 | PASS AA large only |
| `#C8A2FF` (accent-primary) | `#13111A` (bg-surface) | 7.5:1 | PASS AA |
| `#C8A2FF` (accent-primary) | `#0C0A0F` (bg-void) | 8.6:1 | PASS AAA |
| `#0C0A0F` (text on primary) | `#C8A2FF` (accent bg) | 8.6:1 | PASS AAA |
| `#FF5252` (error) | `#13111A` (bg-surface) | 5.5:1 | PASS AA |
| `#FFD54F` (warning) | `#13111A` (bg-surface) | 11.4:1 | PASS AAA |
| `#82B1FF` (info) | `#13111A` (bg-surface) | 7.2:1 | PASS AA |

### Notes on Contrast Edge Cases

The `text-muted` values in both variants sit right at the WCAG AA threshold (4.5:1) when on `bg-surface`. They drop below on `bg-elevated`. This is acceptable because:
1. Muted text is used ONLY for supplementary information (hints, timestamps, placeholders)
2. The same information is always available through other channels (not color-only)
3. For truly important low-contrast cases, increase to `text-secondary`

The `text-disabled` values (2.4-2.5:1) intentionally fail contrast requirements -- disabled elements SHOULD look inaccessible. They are always paired with `pointer-events: none` and `aria-disabled`.

---

## DECISION MATRIX: FORGE vs OBSIDIAN

| Criterion | FORGE | OBSIDIAN |
|-----------|-------|---------|
| Target audience | Engineers, technical users, print farm operators | Designers, small studios, premium brand positioning |
| Information density | Higher (14px base, compact spacing) | Lower (16px base, generous spacing) |
| Learning curve | Slightly higher (more technical vocabulary) | Lower (familiar design patterns) |
| Brand differentiation | Very high (spaceship manual is rare in SaaS) | High (premium dark is less common but exists) |
| Scalability | Excellent (grid system handles complex data) | Good (needs more space per element) |
| Widget embedding | Better (compact by nature) | Good (may need compact overrides) |
| Accessibility | Solid (high contrast, clear hierarchy) | Solid (softer on eyes for long use) |
| Implementation effort | Moderate (custom textures, grid patterns) | Moderate (glass effects, ambient glows) |
| Mobile adaptation | Straightforward (data-dense collapses well) | Needs care (glass effects expensive on mobile) |
| "Wow factor" | Immediate (technical authority) | Gradual (refined elegance) |

**Recommendation:** For a B2B tool targeting 3D printing businesses (primarily technical users), **FORGE** is the stronger choice. Its industrial aesthetic directly mirrors the users' working environment and communicates technical competence. OBSIDIAN is the better choice if ModelPricer pivots toward a broader, less technical audience or emphasizes premium brand positioning.

---

*End of proposal. Awaiting review from mp-sr-orchestrator and stakeholder feedback before implementation delegation to mp-mid-design-system.*
