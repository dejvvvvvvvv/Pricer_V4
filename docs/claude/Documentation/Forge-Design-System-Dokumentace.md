# Forge Design System -- Dokumentace

> 26 Forge UI komponent + 7 CSS souboru: tokeny, typografie, textury, animace, utility tridy.
> Tmave industrialni tema pro ModelPricer. Vsechny tridy opt-in pres `.forge-*` prefix.

---

## 1. Prehled

Forge Design System je vizualni zaklad aplikace ModelPricer. Tema je temne, industrialni/technicke,
inspirovane 3D tiskem. System se sklada z:

- **CSS tokenu** (custom properties na `:root`) pro barvy, typografii, spacing, stiny, radii, animace
- **7 CSS souboru** s utility tridami a animacemi
- **26 JSX komponent** v `src/components/ui/forge/` (+ 1 backup soubor)
- **Inline styles** s referencemi na `--forge-*` CSS custom properties (ne Tailwind pro Forge komponenty)

**Klicove principy:**
- Zadna genericka modra — primarni akcent je teal (#00D4AA), sekundarni orange (#FF6B35)
- WCAG AA minimalne 4.5:1 kontrastni pomer pro text
- `--forge-font-heading` (Space Grotesk) pro nadpisy text-lg a vetsi
- `--forge-font-tech` (Space Mono) POUZE pro ceny, kody, 12px labely, rozmery
- Vsechny Forge tridy jsou opt-in (`forge-*` prefix) — zadne globalni side effects

---

## 2. Technologie

| Oblast | Technologie |
|--------|-------------|
| Framework | React 18+ (JSX) |
| Styling Forge | CSS custom properties (`--forge-*`), inline styles v komponentach |
| Styling General | Tailwind CSS (admin, kalkulacka), CSS-in-JS (inline) |
| Fonty | Space Grotesk, IBM Plex Sans, JetBrains Mono, Space Mono, Inter |
| Font loading | Google Fonts CDN (`tailwind.css` import) |
| Animace | CSS `@keyframes` (forge-animations.css), CSS transitions |
| Routing | React Router (`Link` v ForgeButton) |
| Pristupnost | ARIA atributy, `prefers-reduced-motion` respektovano |
| Build | Vite |

---

## 3. Architektura souboru

### 3.1 CSS soubory (7)

| Soubor | Cesta | Ucel | Pocet trid/promennych |
|--------|-------|------|-----------------------|
| `forge-tokens.css` | `src/styles/forge-tokens.css` | Vsechny CSS custom properties (barvy, typografie, radii, stiny, motion) | ~45 promennych |
| `forge-typography.css` | `src/styles/forge-typography.css` | Heading, body, label, mono, tech, price tridy | 10 trid |
| `forge-textures.css` | `src/styles/forge-textures.css` | Film grain overlay, blueprint grid, skewed pozadi | 3 tridy |
| `forge-animations.css` | `src/styles/forge-animations.css` | Keyframe animace + `prefers-reduced-motion` | 17 keyframes, 11 trid |
| `forge-utilities.css` | `src/styles/forge-utilities.css` | Focus ring, card, badge, leader line, callout, price-lg | 12 trid |
| `tailwind.css` | `src/styles/tailwind.css` | Tailwind base/components/utilities + Forge CSS importy + font CDN | Entrypoint |
| `index.css` | `src/styles/index.css` | Globalni reset (overflow, box-sizing, smooth scroll, Lenis) | Zakladni reset |

**Import poradi v `tailwind.css`:**
```
Google Fonts CDN (Inter, JetBrains Mono)
forge-tokens.css
forge-textures.css
forge-typography.css
forge-animations.css
forge-utilities.css
@tailwind base / components / utilities
```

### 3.2 Forge komponenty (26 aktivnich + 1 backup)

Vsechny v: `src/components/ui/forge/`

| # | Soubor | Kategorie |
|---|--------|-----------|
| 1 | `ForgeButton.jsx` | Formularove / interaktivni |
| 2 | `ForgeCard.jsx` | Layout / kontejner |
| 3 | `ForgeCheckbox.jsx` | Formularove |
| 4 | `ForgeColorPicker.jsx` | Formularove / admin |
| 5 | `ForgeDialog.jsx` | Overlay / modal |
| 6 | `ForgeFaqAccordion.jsx` | Obsahove / interaktivni |
| 7 | `ForgeHeroUnderline.jsx` | Dekorativni SVG |
| 8 | `ForgeInput.jsx` | Formularove |
| 9 | `ForgeNumberedCard.jsx` | Layout / marketing |
| 10 | `ForgePageHeader.jsx` | Layout / admin |
| 11 | `ForgePriceBreakdown.jsx` | Obsahove / pricing |
| 12 | `ForgePricingCard.jsx` | Obsahove / marketing |
| 13 | `ForgePrinterSVG.jsx` | Dekorativni SVG / animace |
| 14 | `ForgeProgressBar.jsx` | Feedback / stav |
| 15 | `ForgeSectionLabel.jsx` | Typograficky / marketing |
| 16 | `ForgeSelect.jsx` | Formularove |
| 17 | `ForgeSlider.jsx` | Formularove |
| 18 | `ForgeSquiggle.jsx` | Dekorativni SVG |
| 19 | `ForgeStatCard.jsx` | Obsahove / admin dashboard |
| 20 | `ForgeStatusBadge.jsx` | Feedback / stav |
| 21 | `ForgeStatusIndicator.jsx` | Feedback / stav |
| 22 | `ForgeTable.jsx` | Datove / admin |
| 23 | `ForgeTabs.jsx` | Navigacni |
| 24 | `ForgeToast.jsx` | Feedback / notifikace |
| 25 | `ForgeToggle.jsx` | Formularove |
| -- | `ForgePrinterSVG.backup.jsx` | Backup (nepouzivat) |

---

## 4. Import graf

### 4.1 Vnitrni zavislosti (Forge -> Forge)

Jedina vnitrni zavislost:
```
ForgePricingCard -> ForgeButton
```

Vsechny ostatni Forge komponenty jsou plne nezavisle (zero inter-component dependencies).

### 4.2 Externi pouziti (stranky importujici Forge komponenty)

| Komponenta | Pocet importu | Kde se pouziva |
|------------|---------------|----------------|
| `ForgeButton` | 12 | home, pricing, support, login, register, NotFound, InviteAccept |
| `ForgeCheckbox` | 13 | admin (Dashboard, Pricing, Presets, Fees, Parameters, Branding, Analytics, Orders, Express, Emails, Coupons, Shipping), Widget tabs, test-kalkulacka |
| `ForgeDialog` | 4 | admin (Pricing, Fees, Presets, Analytics) |
| `ForgeFaqAccordion` | 3 | home, pricing, support |
| `ForgeSectionLabel` | 3 | home, pricing, support |
| `ForgePricingCard` | 2 | home, pricing |
| `ForgeSquiggle` | 3 | home, pricing (neuzivany import!), support |
| `ForgeStatusIndicator` | 1 | home |
| `ForgeHeroUnderline` | 1 | home |
| `ForgePrinterSVG` | 1 | home |
| `ForgeNumberedCard` | 1 | home |

Nasledujici komponenty NEMAJI zatim zadny externi import (pripravene pro budouci pouziti):
`ForgeCard`, `ForgeColorPicker`, `ForgeInput`, `ForgePageHeader`, `ForgePriceBreakdown`,
`ForgeProgressBar`, `ForgeSelect`, `ForgeSlider`, `ForgeStatCard`, `ForgeStatusBadge`,
`ForgeTable`, `ForgeTabs`, `ForgeToast`, `ForgeToggle`

---

## 5. Design a vizual

### 5.1 Vsechny CSS tokeny/promenne

Definovane v `src/styles/forge-tokens.css` na `:root`:

#### Pozadi (Background)

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-bg-void` | `#08090C` | Nejtmavsi pozadi (page background) |
| `--forge-bg-surface` | `#0E1015` | Karta, panel, sekce |
| `--forge-bg-elevated` | `#161920` | Zvyrazneny panel, hover stav karty |
| `--forge-bg-overlay` | `#1C1F28` | Modalove pozadi, vrstvy nad surface |

#### Text

| Token | Hodnota | Kontrast na void | Ucel |
|-------|---------|-------------------|------|
| `--forge-text-primary` | `#E8ECF1` | ~15.5:1 | Primarni text, nadpisy, hodnoty |
| `--forge-text-secondary` | `#9BA3B0` | ~8.3:1 | Sekundarni text, popisy, feature listy |
| `--forge-text-muted` | `#7A8291` | ~4.7:1 (WCAG AA) | Tlumeny text, labely, placeholder |
| `--forge-text-decorative` | `#5C6370` | ~2.8:1 | POUZE dekorativni prvky (NE pro text!) |
| `--forge-text-disabled` | `#3A3F4A` | ~1.7:1 | Disabled stavy |

#### Accenty

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-accent-primary` | `#00D4AA` | Primarni teal akcent (CTA, hover, checkmarks, progress) |
| `--forge-accent-primary-h` | `#00F0C0` | Svetlejsi teal pro hover stav |
| `--forge-accent-primary-strong` | `#00D4AA` | Silna varianta (aktualne = primary) |
| `--forge-accent-primary-medium` | `#00A88A` | Stredni intenzita |
| `--forge-accent-primary-subtle` | `rgba(0,212,170,0.15)` | Jemne pozadi, ghost efekty |
| `--forge-accent-primary-ghost` | `rgba(0,212,170,0.06)` | Nejjemnejsi hint |
| `--forge-accent-secondary` | `#FF6B35` | Orange akcent (sekundarni CTA, FAQ rotace) |
| `--forge-accent-tertiary` | `#6C63FF` | Fialovy akcent (gradient endpoint) |

#### Semanticke barvy

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-success` | `#00D4AA` | Uspech (= primarni akcent) |
| `--forge-warning` | `#FFB547` | Varovani |
| `--forge-error` | `#FF4757` | Chyba |
| `--forge-info` | `#4DA8DA` | Informace |

#### Borders

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-border-default` | `#1E2230` | Standardni border karet a inputu |
| `--forge-border-active` | `#2A3040` | Aktivni/hover border, toggle track |
| `--forge-border-highlight` | `rgba(0,212,170,0.2)` | Zvyrazneny border (hover karta) |
| `--forge-border-grid` | `#141720` | Blueprint grid pozadi |

#### Gradienty

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-gradient-brand` | `linear-gradient(135deg, #00D4AA 0%, #6C63FF 100%)` | Brandovy gradient (teal -> fialova) |
| `--forge-gradient-glow` | `radial-gradient(ellipse at center, rgba(0,212,170,0.08) 0%, transparent 70%)` | Jemna aura/glow |

#### Stiny (Shadows)

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-shadow-sm` | `0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)` | Maly stin |
| `--forge-shadow-md` | `0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)` | Stredni stin (toast) |
| `--forge-shadow-lg` | `0 12px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)` | Velky stin (dialog) |
| `--forge-shadow-glow` | `0 0 20px rgba(0,212,170,0.15)` | Teal glow efekt (hover karta, button) |

#### Radii

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-radius-sm` | `4px` | Buttony, inputy, badge |
| `--forge-radius-md` | `6px` | Karty, toasty, tabulky |
| `--forge-radius-lg` | `8px` | Dialog kontejner |
| `--forge-radius-xl` | `12px` | Velke panely |

#### Typografie -- Font Stacks

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-font-heading` | `'Space Grotesk', system-ui, sans-serif` | Nadpisy (h1-h4, dialog title, button text, plan name, total label) |
| `--forge-font-body` | `'IBM Plex Sans', system-ui, sans-serif` | Telo textu, popisy, formularove labely |
| `--forge-font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | Monospace hodnoty (ceny, delta, badge, tabularna cisla) |
| `--forge-font-tech` | `'Space Mono', 'JetBrains Mono', monospace` | Tech labely (section markers, breadcrumb, status, numbered labels) |

#### Typografie -- Scale (minor-third)

| Token | Hodnota | Ekvivalent |
|-------|---------|------------|
| `--forge-text-4xl` | `2.441rem` | ~39px |
| `--forge-text-3xl` | `1.953rem` | ~31px |
| `--forge-text-2xl` | `1.563rem` | ~25px |
| `--forge-text-xl` | `1.25rem` | ~20px |
| `--forge-text-lg` | `1rem` | 16px |
| `--forge-text-base` | `0.875rem` | 14px |
| `--forge-text-sm` | `0.75rem` | 12px |
| `--forge-text-xs` | `0.625rem` | 10px |

#### Motion

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Rychle zpomalujici easing |
| `--forge-duration-micro` | `120ms` | Mikro-interakce (hover, focus) |
| `--forge-duration-breathing` | `3000ms` | Dychaci animace |

#### 3D-print specificke

| Token | Hodnota | Ucel |
|-------|---------|------|
| `--forge-nozzle-hot` | `#FF9F43` | Barva horke trysky |
| `--forge-bed-heated` | `#FD7272` | Barva vyhrivane podlozky |

### 5.2 Font system (heading vs tech)

**KRITICKE PRAVIDLO:**

| Font | Token | Kdy pouzit | Kdy NEPOUZIVAT |
|------|-------|------------|-----------------|
| Space Grotesk | `--forge-font-heading` | Nadpisy (h1-h4), dialog title, button text, plan names, total labels, vsechno `text-lg` (16px) a vetsi | Pro 12px labely, kody, cisla |
| IBM Plex Sans | `--forge-font-body` | Body text, popisy, feature listy, formularove labely, toast zpravy | Pro nadpisy, tech labely |
| JetBrains Mono | `--forge-font-mono` | Ceny, hodnoty, delta badge, tabularna cisla, monospace displej | Pro body text nebo nadpisy |
| Space Mono | `--forge-font-tech` | Section markers (01/, 02/), breadcrumb, status labels, 10-12px uppercase labely | Pro nadpisy vetsi nez 12px |

**Tridy v `forge-typography.css`:**

| Trida | Font | Velikost | Vaha | Pouziti |
|-------|------|----------|------|---------|
| `.forge-h1` | heading | 2.441rem | 700 | Hlavni nadpis stranky |
| `.forge-h2` | heading | 1.953rem | 700 | Sekcni nadpis |
| `.forge-h3` | heading | 1.563rem | 600 | Pod-sekcni nadpis |
| `.forge-h4` | heading | 1.25rem | 600 | Nadpis karty |
| `.forge-body` | body | 0.875rem | 400 | Standardni text |
| `.forge-body-lg` | body | 1rem | 400 | Zvetseny body text |
| `.forge-label` | body | 0.75rem | 500 | Uppercase label (secondary barva) |
| `.forge-label-mono` | tech | 0.625rem | 400 | Uppercase tech label (muted barva) |
| `.forge-mono` | mono | - | 500 | Monospace s tabular nums |
| `.forge-mono-bold` | mono | - | 700 | Tucny monospace |
| `.forge-tech` | tech | - | 400 | Tech font s tabular nums |
| `.forge-price` | mono | - | 700 | Cena s accent barvou |

### 5.3 Color system (paleta)

Forge paleta se deli na 5 vrstev:

```
VRSTVA 1 — Pozadi (tmave, linearne odstupnovane):
  void (#08090C) -> surface (#0E1015) -> elevated (#161920) -> overlay (#1C1F28)

VRSTVA 2 — Text (5 urovni s klesajicim kontrastem):
  primary (#E8ECF1, 15.5:1) -> secondary (#9BA3B0, 8.3:1) -> muted (#7A8291, 4.7:1)
  -> decorative (#5C6370, 2.8:1 -- NE pro text!) -> disabled (#3A3F4A)

VRSTVA 3 — Akcenty (zadna modra!):
  Teal (#00D4AA) — primarni akcent
  Orange (#FF6B35) — sekundarni akcent
  Fialova (#6C63FF) — tercialni (gradient)

VRSTVA 4 — Semanticke:
  Success (#00D4AA) | Warning (#FFB547) | Error (#FF4757) | Info (#4DA8DA)

VRSTVA 5 — Borders a stiny:
  Jemne, temne bordery (#1E2230, #2A3040)
  Glow efekty pres rgba(0,212,170,x)
```

**Anti-AI design checklist:**
- Zadna genericka modra (#2563EB pouzita jen v Tailwind admin kontextu, NE ve Forge)
- Teal + Orange akcentova dvojice
- Cislovane sekce s tech fontem
- Version badge
- 55/45 hero rozlozeni
- Industrialni grain textura

### 5.4 Spacing system

Forge nepouziva formalizovany spacing scale token. Spacing je definovan primo v komponentach:

| Kontext | Typicka hodnota | Kde |
|---------|-----------------|-----|
| Padding karty | `24px` | ForgeCard, ForgePriceBreakdown, ForgeStatCard |
| Padding dialog header | `20px 24px` | ForgeDialog |
| Padding dialog body | `24px` | ForgeDialog |
| Padding dialog footer | `16px 24px` | ForgeDialog |
| Padding tabulkova bunka | `12px 16px` | ForgeTable |
| Padding toast obsah | `12px 16px` | ForgeToast |
| Gap mezi labely | `4-8px` | ForgeInput, ForgeSelect, ForgeSlider |
| Gap v accordion | `8px paddingLeft` | ForgeFaqAccordion |
| Card-interactive hover lift | `-2px translateY` | forge-utilities.css |
| Button hover lift | `-1px translateY` | ForgeButton primary |

---

## 8. Komponenty -- tabulka VSECH 26 komponent

### ForgeButton

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeButton.jsx` |
| **Popis** | Forge-themed button s primary/outline/ghost variantami. Podporuje routing pres `to` prop (renderuje Link) |
| **Export** | `default` |
| **Ref forwarding** | Ne |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `variant` | `'primary' \| 'outline' \| 'ghost'` | `'primary'` | Vizualni varianta |
| `to` | `string` | - | React Router cesta (renderuje `<Link>` misto `<button>`) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Velikost (h-9/h-11/h-12) |
| `children` | `ReactNode` | - | Obsah buttonu |
| `className` | `string` | `''` | Dalsi CSS tridy |
| `onClick` | `Function` | - | Click handler (ignorovan pri `to`) |
| `fullWidth` | `boolean` | `false` | `w-full` |
| `...props` | - | - | Propspreading na element |

**Hover chovani:**
- primary: svetlejsi teal pozadi, translateY(-1px), glow shadow
- outline: elevated pozadi, primary text barva
- ghost: teal text barva

---

### ForgeCard

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeCard.jsx` |
| **Popis** | Karta wrapper s default/elevated/interactive variantami. Inline styles s `--forge-*` |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `variant` | `'default' \| 'elevated' \| 'interactive'` | `'default'` | Vizualni varianta |
| `children` | `ReactNode` | - | Obsah karty |
| `className` | `string` | `''` | Dalsi CSS tridy |
| `onClick` | `Function` | - | Click handler |
| `style` | `object` | - | Dalsi inline styly |

**Interactive varianta:** cursor pointer, hover = elevated bg + teal border highlight + glow shadow + translateY(-2px)

---

### ForgeCheckbox

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeCheckbox.jsx` |
| **Popis** | Animovany checkbox s checkmark draw animaci a scale pop. Pouziva `useId()` pro pristupne label propojeni |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `checked` | `boolean` | - | Stav checkboxu |
| `onChange` | `Function` | - | Nativni event handler |
| `disabled` | `boolean` | - | Disabled stav (opacity 0.4, cursor not-allowed) |
| `label` | `string` | - | Textovy label |
| `size` | `number` | `20` | Velikost boxu v px |
| `style` | `object` | - | Extra wrapper styly |

**Animace:** SVG stroke-dashoffset pro checkmark draw (280ms), CSS pop keyframe (350ms)

---

### ForgeColorPicker

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeColorPicker.jsx` |
| **Popis** | Color picker s 16-swatch grid a hex input. 32x32px swatche, ARIA radiogroup |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `colors` | `string[]` | 16 predefinovanych hex | Pole hex barev |
| `value` | `string` | `''` | Aktualni barva (hex) |
| `onChange` | `Function` | - | Callback s novou hex hodnotou |
| `label` | `string` | - | Label nad swatchi |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Validace:** Hex input validuje na blur (#XXX nebo #XXXXXX), pri nevalidni hodnote reverts

---

### ForgeDialog

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeDialog.jsx` |
| **Popis** | Modalni dialog s tmavym overlay, header s close button, scrollable body, volitelny footer. Escape zavira, overlay klik zavira |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `open` | `boolean` | - | Viditelnost dialogu |
| `onClose` | `Function` | - | Close callback |
| `title` | `string` | - | Nadpis v headeru |
| `children` | `ReactNode` | - | Body obsah |
| `footer` | `ReactNode` | - | Footer obsah (typicky akci buttony) |
| `maxWidth` | `string` | `'540px'` | Max sirka kontejneru |

**Pristupnost:** `role="dialog"`, `aria-modal="true"`, `aria-label={title}`, Escape key listener
**Scroll:** Vlastni smooth scroll s rAF a exponencialnim ease-out, `overscroll-behavior: contain`
**Side effects:** `document.body.style.overflow = 'hidden'` pri otevreni

---

### ForgeFaqAccordion

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeFaqAccordion.jsx` |
| **Popis** | FAQ accordion s flexibilnimi klici (`question/answer`, `q/a`, `title/content`). Plus ikona rotujici na kriz |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `items` | `Array<{question,answer} \| {q,a} \| {title,content}>` | `[]` | Pole FAQ polozek |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Animace:** max-height transition (250ms), plus ikona rotuje 45deg (= kriz) v otevrene stavu
**Ikona:** Otevrena = orange (`--forge-accent-secondary`), zavrena = teal (`--forge-accent-primary`)
**Pristupnost:** `aria-expanded` na toggle button

---

### ForgeHeroUnderline

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeHeroUnderline.jsx` |
| **Popis** | 3-vrstva animovany podtrzeni pro hero nadpis. SVG s draw-in animaci |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `className` | `string` | `''` | Dalsi CSS tridy |

**SVG:** viewBox `0 0 280 16`, 3 vrstvy stroke s rostouci opacitou (0.35, 0.55, 0.85)
**Animace:** `forge-underline-draw` s staggered delays (200ms, 400ms, 600ms)
**Pristupnost:** `aria-hidden="true"` (dekorativni)

---

### ForgeInput

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeInput.jsx` |
| **Popis** | Text input s label a error zobrazenim. Dark elevated pozadi, teal focus ring |
| **Export** | `default` (s `forwardRef`) |
| **Ref forwarding** | Ano |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `label` | `string` | - | Label nad inputem |
| `error` | `string` | - | Chybova zprava pod inputem |
| `className` | `string` | `''` | Dalsi CSS tridy |
| `type` | `string` | `'text'` | HTML input type |
| `...props` | - | - | Propspreading na `<input>` |

**Focus:** Teal border + `0 0 0 2px rgba(0,212,170,0.15)` glow. Error: cerveny border + cerveny glow

---

### ForgeNumberedCard

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeNumberedCard.jsx` |
| **Popis** | Marketingova karta s cislem (01/, 02/), ikonou, nadpisem, popisem a hover sipkou |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `number` | `string` | - | Cislo sekce (napr. "01") |
| `icon` | `ReactNode` | - | Ikona (SVG) |
| `title` | `string` | - | Nadpis karty |
| `description` | `string` | - | Popisny text |
| `className` | `string` | `''` | Dalsi CSS tridy |

**POZNAMKA:** Vzdy pouziva `.forge-card-interactive` (cursor pointer, hover). Viz Design-Error_LOG.md — pokud karta neni klikatelna, melo by se pouzit `.forge-card` misto toho.

---

### ForgePageHeader

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgePageHeader.jsx` |
| **Popis** | Admin page header s breadcrumb (Space Mono uppercase) a akci tlacitky |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `title` | `string` | - | Nadpis stranky (h1) |
| `breadcrumb` | `string` | - | Breadcrumb text (napr. "ADMIN / PRICING") |
| `actions` | `ReactNode` | - | Pravo-zarovnane akci elementy |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Semantika:** Renderuje `<h1>` pro title (spravna heading hierarchie)

---

### ForgePriceBreakdown

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgePriceBreakdown.jsx` |
| **Popis** | "Receipt-style" cenovy rozpis s teckovany leader lines, subtotal/discount/tax/total sekcemi |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `items` | `Array<{label, value}>` | `[]` | Radkove polozky |
| `subtotal` | `{label, value}` | - | Mezisouc |
| `discount` | `{label, value} \| null` | `null` | Sleva (zelena barva) |
| `tax` | `{label, value} \| null` | `null` | Dan (muted barva) |
| `total` | `{label, value}` | - | Celkem (velky font, teal border-top) |
| `perUnit` | `string \| null` | `null` | Per-unit cena pod celkem |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Header:** Hardcoded "COST ANALYSIS" v tech fontu (10px, uppercase)

---

### ForgePricingCard

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgePricingCard.jsx` |
| **Popis** | Cenovy plan karta s recommended badge, feature listem a CTA buttonem |
| **Export** | `default` |
| **Zavislosti** | `ForgeButton` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `name` | `string` | - | Nazev planu (forge-label styl) |
| `price` | `string \| null` | - | Cena (null = zobrazuje period jako jediny text) |
| `period` | `string` | - | Obdobi / popisek pod cenou |
| `features` | `string[]` | `[]` | Seznam features s teal checkmarks |
| `ctaText` | `string` | - | Text CTA buttonu |
| `ctaTo` | `string` | - | Odkaz CTA buttonu |
| `recommended` | `boolean` | `false` | Zvyraznena karta s teal borderem a glow |
| `className` | `string` | `''` | Dalsi CSS tridy |

**POZNAMKA:** "Recommended" badge text je hardcoded anglicky. Viz Design-Error_LOG.md.

---

### ForgePrinterSVG

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgePrinterSVG.jsx` |
| **Popis** | Izometricka 3D tiskarna s 18s animacnim cyklem: stavba vrstev -> READY -> fade out -> loop |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `className` | `string` | `''` | Dalsi CSS tridy |

**SVG:** 480x450 viewport, 8 izometrickych vrstev, LCD displej (PRINTING/READY), nozzle s glow, spiralni filament
**Animace:** Pure CSS — per-layer keyframes, 18s cyklus, nozzle hot glow, spiral flow
**Pristupnost:** `aria-hidden="true"` (dekorativni)

---

### ForgeProgressBar

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeProgressBar.jsx` |
| **Popis** | Progress indikator — linearni nebo kruhovy. Teal fill, optional label a hodnota |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `value` | `number` | `0` | 0-100 |
| `type` | `'linear' \| 'circular'` | `'linear'` | Typ zobrazeni |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Velikost (linear: 3/4/6px vyska; circular: 48/64/96px) |
| `label` | `string` | - | Label nad barem |
| `showValue` | `boolean` | `true` | Zobrazit procentualni hodnotu |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Circular:** SVG kruh s stroke-dashoffset, hodnota centrovana

---

### ForgeSectionLabel

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeSectionLabel.jsx` |
| **Popis** | Maly uppercase label pro section markers (ABOUT, PROCESS, PLANS, FAQ) |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `text` | `string` | - | Text labelu |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Font:** `--forge-font-tech`, `--forge-text-xs` (10px), `letter-spacing: 0.1em`, `--forge-text-muted`

---

### ForgeSelect

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeSelect.jsx` |
| **Popis** | Select dropdown stylizovany jako ForgeInput. Custom SVG sipka, teal focus ring |
| **Export** | `default` (s `forwardRef`) |
| **Ref forwarding** | Ano |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `label` | `string` | - | Label nad selectem |
| `error` | `string` | - | Chybova zprava |
| `options` | `Array<{value, label}>` | `[]` | Moznosti selectu |
| `className` | `string` | `''` | Dalsi CSS tridy |
| `disabled` | `boolean` | - | Disabled stav (opacity 0.5) |
| `...props` | - | - | Propspreading na `<select>` |

**Custom arrow:** Inline SVG chevron pres `backgroundImage`

---

### ForgeSlider

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeSlider.jsx` |
| **Popis** | Range slider s teal filled trackem a 16px kruhovym thumbem |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `min` | `number` | `0` | Minimum |
| `max` | `number` | `100` | Maximum |
| `step` | `number` | `1` | Krok |
| `value` | `number` | `0` | Aktualni hodnota |
| `onChange` | `Function` | - | Callback s novou hodnotou (number) |
| `label` | `string` | - | Label |
| `showValue` | `boolean` | `false` | Zobrazit aktualni hodnotu |
| `disabled` | `boolean` | `false` | Disabled stav |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Pristupnost:** `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
**Thumb styling:** Injektovany `<style>` tag pro pseudo-elementy (`::-webkit-slider-thumb`, `::-moz-range-thumb`)

---

### ForgeSquiggle

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeSquiggle.jsx` |
| **Popis** | Dekorativni vlnovka SVG s turbulence displacement filtrem |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `className` | `string` | `''` | Dalsi CSS tridy |
| `color` | `string` | `'var(--forge-accent-primary)'` | Barva cary |

**SVG:** viewBox `0 0 200 12`, feTurbulence + feDisplacementMap pro hand-drawn efekt
**Pristupnost:** `aria-hidden="true"` (dekorativni)

---

### ForgeStatCard

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeStatCard.jsx` |
| **Popis** | Dashboard stat karta s hornim barevnym borderem, monospace hodnotou a volitelnym delta badge |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `label` | `string` | - | Label (Space Mono 10px uppercase) |
| `value` | `string \| number` | - | Hlavni hodnota (JetBrains Mono 700, text-3xl) |
| `delta` | `string \| number` | - | Zmena (napr. "+12.5%") |
| `deltaType` | `'positive' \| 'negative' \| 'neutral'` | `'positive'` | Barva delta badge |
| `accentColor` | `string` | `'var(--forge-accent-primary)'` | Barva horniho borderu |
| `children` | `ReactNode` | - | Extra obsah (sparkline apod.) |

---

### ForgeStatusBadge

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeStatusBadge.jsx` |
| **Popis** | Kompaktni inline pill badge pro tabulky a seznamy. 11px JetBrains Mono |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `status` | `'active' \| 'pending' \| 'error' \| 'inactive'` | `'active'` | Barva/varianta |
| `children` | `ReactNode` | - | Text badge |

**Barvy:** active=teal, pending=zluta, error=cervena, inactive=muted

---

### ForgeStatusIndicator

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeStatusIndicator.jsx` |
| **Popis** | Stavovy indikator s pulsujicim teckou, "STATUS:" labelem a stavovym textem |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `status` | `'idle' \| 'heating' \| 'printing' \| 'complete' \| 'error'` | `'printing'` | Stav |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Konfigurace:** IDLE=#5C6370, HEATING=#FFB547, PRINTING=#00D4AA, COMPLETE=#00D4AA, ERROR=#FF4757
**Animace:** `.forge-pulse-dot` na stavovem bodu

---

### ForgeTable

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeTable.jsx` |
| **Popis** | Datova tabulka s alternujicimi radky, hover stavy a volitelnym row click |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `columns` | `Array<{key, label, align?, width?, render?}>` | `[]` | Definice sloupcu |
| `data` | `Array<object>` | `[]` | Data radku |
| `onRowClick` | `Function` | - | `(row, index) => void` |
| `emptyMessage` | `string` | `'No data available.'` | Text pro prazdny stav |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Alternujici radky:** sudy=surface, lichy=void, hover=elevated
**Header:** Space Mono 11px uppercase, muted barva
**Body:** IBM Plex Sans 13px, secondary barva
**Responsive:** Horizontalni scroll wrapper

---

### ForgeTabs

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeTabs.jsx` |
| **Popis** | Horizontalni tab navigace se spodnim borderem. Aktivni tab ma teal underline |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `tabs` | `Array<string \| {key, label}>` | `[]` | Tab polozky |
| `activeTab` | `string` | - | Key/label aktivniho tabu |
| `onTabChange` | `Function` | - | `(key) => void` |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Font:** `--forge-font-tech`, 13px
**Barvy:** aktivni=teal + teal border-bottom, hover=secondary, default=muted

---

### ForgeToast

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeToast.jsx` |
| **Popis** | Toast notifikace s levym barevnym borderem, auto-dismiss progress barem a close buttonem |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Typ (barva leveho borderu a progress baru) |
| `title` | `string` | - | Tucny nadpis |
| `message` | `string` | - | Popisny text |
| `onDismiss` | `Function` | - | Dismiss callback |
| `duration` | `number` | `5000` | Auto-dismiss v ms (0 = vypnuto) |

**Progress bar:** rAF-driven ubyvajici bar na spodku
**Pristupnost:** `role="alert"`, close button s `aria-label="Dismiss notification"`
**Barvy:** info=#4DA8DA, success=#00D4AA, warning=#FFB547, error=#FF4757

---

### ForgeToggle

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeToggle.jsx` |
| **Popis** | Toggle switch (44x22px track, 16px thumb). ARIA role=switch |
| **Export** | `default` |

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `checked` | `boolean` | `false` | Stav |
| `onChange` | `Function` | - | Callback s novou boolean hodnotou |
| `label` | `string` | - | Textovy label |
| `disabled` | `boolean` | `false` | Disabled stav |
| `className` | `string` | `''` | Dalsi CSS tridy |

**Pristupnost:** `role="switch"`, `aria-checked`, `aria-label`, keyboard support (Space, Enter)
**Thumb barvy:** checked=white, unchecked=muted. Track: checked=teal, unchecked=border-active

---

## 12. Pristupnost (WCAG kontrasty)

### 12.1 Textove kontrasty na `--forge-bg-void` (#08090C)

| Token | Hex | Kontrast | WCAG AA (4.5:1) | WCAG AAA (7:1) | Pouziti |
|-------|-----|----------|-----------------|----------------|---------|
| `--forge-text-primary` | #E8ECF1 | ~15.5:1 | SPLNENO | SPLNENO | Nadpisy, hlavni text |
| `--forge-text-secondary` | #9BA3B0 | ~8.3:1 | SPLNENO | SPLNENO | Sekundarni text |
| `--forge-text-muted` | #7A8291 | ~4.7:1 | SPLNENO | Ne | Labely, placeholders |
| `--forge-text-decorative` | #5C6370 | ~2.8:1 | NESPLNENO | Ne | Jen dekorace, NE pro cteny text! |
| `--forge-text-disabled` | #3A3F4A | ~1.7:1 | NESPLNENO | Ne | Disabled (ocekavane) |
| `--forge-accent-primary` | #00D4AA | ~9.6:1 | SPLNENO | SPLNENO | Teal akcent text |

### 12.2 Kontrasty na `--forge-bg-surface` (#0E1015)

| Token | Hex | Kontrast | WCAG AA |
|-------|-----|----------|---------|
| `--forge-text-primary` | #E8ECF1 | ~14.2:1 | SPLNENO |
| `--forge-text-secondary` | #9BA3B0 | ~7.6:1 | SPLNENO |
| `--forge-text-muted` | #7A8291 | ~4.3:1 | TESNE (moze selhat u mensich fontu) |

### 12.3 Button kontrasty

| Varianta | Text | Pozadi | Kontrast | WCAG AA |
|----------|------|--------|----------|---------|
| Primary | #08090C (void) | #00D4AA (teal) | ~9.6:1 | SPLNENO |
| Outline | #9BA3B0 (secondary) | transparent/void | ~8.3:1 | SPLNENO |
| Ghost | #7A8291 (muted) | transparent/void | ~4.7:1 | SPLNENO |

### 12.4 Pristupnostni features v komponentach

| Komponenta | Feature |
|------------|---------|
| ForgeCheckbox | `useId()` pro unikatni label-input propojeni, animated checkmark |
| ForgeColorPicker | `role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-label` na swatchich |
| ForgeDialog | `role="dialog"`, `aria-modal`, `aria-label`, Escape close, overlay click close |
| ForgeFaqAccordion | `aria-expanded` na toggle button |
| ForgeHeroUnderline | `aria-hidden="true"` |
| ForgePrinterSVG | `aria-hidden="true"` |
| ForgeSlider | `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` |
| ForgeSquiggle | `aria-hidden="true"` |
| ForgeToast | `role="alert"`, `aria-label` na close button |
| ForgeToggle | `role="switch"`, `aria-checked`, `aria-label`, keyboard (Space/Enter) |

### 12.5 prefers-reduced-motion

V `forge-animations.css` je blok `@media (prefers-reduced-motion: reduce)` ktery vypina:
- forge-breathe, forge-pulse-dot, forge-nozzle-move, forge-hot-glow
- forge-marquee, forge-draw-check, forge-slide-in-right, forge-spin
- forge-underline-stroke animace (okamzite nastavuje stroke-dashoffset: 0)
- Vsechny 3D printer SVG animace (pres `svg[viewBox="0 0 480 450"] *`)

---

## 17. Zname omezeni

### 17.1 Duplicitni definice `.forge-mono-bold`

Trida `.forge-mono-bold` je definovana ve dvou souborech:
- `forge-typography.css:90` — bez `color`
- `forge-utilities.css:118` — s `color: var(--forge-text-primary)`

Zavisi na CSS cascade poradi ktery styl vyhrava. Dokumentovano v Design-Error_LOG.md.

### 17.2 ForgeNumberedCard vzdy interactive

`ForgeNumberedCard` pouziva `.forge-card-interactive` bez ohledu na to zda ma `to`/`onClick` prop.
Karty vypadaji klikatelne (cursor pointer, hover sipka) i kdyz nikam nevedou.

### 17.3 ForgePricingCard hardcoded "Recommended"

Badge text "Recommended" je hardcoded anglicky bez moznosti prekladu pres prop nebo i18n.

### 17.4 ForgePriceBreakdown hardcoded "COST ANALYSIS"

Header text "COST ANALYSIS" je hardcoded anglicky.

### 17.5 ForgeTable hardcoded "No data available."

Empty state zprava `"No data available."` je anglicky (ale konfigurovatelna pres prop `emptyMessage`).

### 17.6 ForgeInput a ForgeSelect label bez htmlFor/id

`ForgeInput` a `ForgeSelect` pouzivaji label obalujici pattern (label + input v jednom divu),
ale label neni explicitne propojen pres `htmlFor`/`id`. Funkci to neomezuje protoze label je
sousedni element, ale neni to idealni pro vsechny screen readery.

### 17.7 14 nepouzivanych komponent

Nasledujici komponenty jsou definovany ale zatim nejsou importovany v zadne strance:
ForgeCard, ForgeColorPicker, ForgeInput, ForgePageHeader, ForgePriceBreakdown,
ForgeProgressBar, ForgeSelect, ForgeSlider, ForgeStatCard, ForgeStatusBadge,
ForgeTable, ForgeTabs, ForgeToast, ForgeToggle.

Jsou pripraveny pro admin redesign a widget builder.

### 17.8 Spacing neni tokenizovany

Na rozdil od barev a typografie nema Forge system formalni spacing tokeny
(`--forge-space-*`). Spacing je definovan ad-hoc primo v komponentach (typicky 8, 12, 16, 20, 24px).

### 17.9 Inline styles vs CSS tridy

Forge komponenty pouzivaji prevazne inline styles s `--forge-*` referencemi misto CSS trid.
To znemoznuje globalni override pres CSS specificity a ztezuje theming.
Vyjimky pouzivajici CSS tridy: ForgeNumberedCard, ForgeStatusIndicator.

### 17.10 ForgeSlider injektuje globalni `<style>` tag

`ForgeSlider` pri prvnim renderovani injektuje `<style>` tag do `<head>` pro
pseudo-element styling (`::-webkit-slider-thumb`). Tag neni odstranen pri unmount.

---

## Appendix: CSS tridy — rychly prehled

### forge-typography.css
`.forge-h1` `.forge-h2` `.forge-h3` `.forge-h4` `.forge-body` `.forge-body-lg`
`.forge-label` `.forge-label-mono` `.forge-mono` `.forge-mono-bold` `.forge-tech` `.forge-price`

### forge-textures.css
`.forge-grain` `.forge-grid-bg` `.forge-skewed-bg`

### forge-utilities.css
`.forge-focus-ring` `.forge-card` `.forge-card-interactive` `.forge-numbered-label`
`.forge-badge` `.forge-badge-success` `.forge-badge-accent` `.forge-leader-line`
`.forge-callout-warning` `.forge-mono-bold` (duplicita!) `.forge-price-lg`

### forge-animations.css
`.forge-breathe` `.forge-pulse-dot` `.forge-nozzle-move` `.forge-hot-glow`
`.forge-marquee` `.forge-draw-check` `.forge-slide-in-right` `.forge-progress-shrink`
`.forge-shimmer` `.forge-spin` `.forge-transition-micro`
`.forge-underline-stroke` `.forge-underline-stroke-1` `.forge-underline-stroke-2` `.forge-underline-stroke-3`
