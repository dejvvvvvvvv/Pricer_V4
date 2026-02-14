# Home — Dokumentace

> Hlavni verejne pristupna stranka ModelPricer. Marketing landing page s hero sekci,
> trust strip marquee, popisem produktu, krokovym "How it works", features gridem,
> cenovymi plany a FAQ. Pouziva Forge dark theme design system.

---

## 1. Prehled

Home stranka (`/`) je prvni bod kontaktu se zakaznikem. Obsahuje 7 vizualnich sekci:

1. **Hero** — hlavni nadpis, podnapis, 2 CTA tlacitka, animovany 3D printer SVG
2. **Trust Strip** — horizontalni marquee s 10 technologickymi labely (PrusaSlicer CLI, White-label, Multi-tenant, atd.)
3. **What We Do (About)** — popis produktu + 3 stat karty (8s, 60%, 24/7)
4. **How It Works** — 4 cislovane kroky (upload -> slicing -> kalkulace -> nabidka)
5. **Capabilities** — 2x2 grid s 4 feature kartami (Pricing Engine, Multi-Format Upload, White-label Widget, Analytics Dashboard)
6. **Pricing Plans** — 3 cenove plany (Starter/Professional/Enterprise) s ForgePricingCard
7. **FAQ** — 3 otazky s accordion komponentou + odkaz na /support

Stranka NEMA vlastni subkomponenty (zadna slozka `components/`). Veskera logika i renderovani
je v jednom souboru `index.jsx` (434 radku).

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | Forge design tokeny (CSS vars) + Tailwind utility classes + inline styles |
| Animace | Framer Motion (Reveal), CSS keyframes (marquee, printer SVG, underline) |
| Routing | React Router v6 (`/` route) |
| i18n | `useLanguage()` hook z `LanguageContext.jsx` |
| Ikony | lucide-react (Terminal, Palette, Users, DollarSign, Settings, Ruler, ShoppingCart, Store, ShoppingBag, Code) |

---

## 3. Architektura souboru

```
src/pages/home/
  index.jsx                 — Jediny soubor, 434 radku, export default Home
```

Stranka nema vlastni CSS, styles ani subkomponenty. Vsechny vizualni prvky pochazi
z Forge design system komponent a Forge CSS souboru.

### Forge CSS soubory (pouzivane Home strankou)

```
src/styles/
  forge-tokens.css          — CSS custom properties (barvy, fonty, spacing, radii)
  forge-typography.css      — .forge-h1, .forge-h2, .forge-h4, .forge-body, .forge-body-lg, .forge-label, .forge-mono-bold, atd.
  forge-animations.css      — .forge-marquee, .forge-pulse-dot, .forge-hot-glow, .forge-transition-micro, hero underline keyframes, printer keyframes
  forge-utilities.css       — .forge-card-interactive, .forge-numbered-label, .forge-focus-ring, .forge-badge
  forge-textures.css        — .forge-grain, .forge-grid-bg, .forge-skewed-bg
```

---

## 4. Import graf

### 4.1 Co Home importuje

| Import | Zdroj | Typ |
|--------|-------|-----|
| `React` | `react` | Knihovna |
| `useLanguage` | `../../contexts/LanguageContext` | Hook (named) |
| `Terminal, Palette, Users, DollarSign, Settings, Ruler, ShoppingCart, Store, ShoppingBag, Code` | `lucide-react` | Ikony (named) |
| `Reveal` | `../../components/marketing/Reveal` | Animacni wrapper (default) |
| `ForgeStatusIndicator` | `../../components/ui/forge/ForgeStatusIndicator` | Komponenta (default) |
| `ForgeSquiggle` | `../../components/ui/forge/ForgeSquiggle` | SVG dekorace (default) |
| `ForgeHeroUnderline` | `../../components/ui/forge/ForgeHeroUnderline` | SVG dekorace (default) |
| `ForgePrinterSVG` | `../../components/ui/forge/ForgePrinterSVG` | SVG animace (default) |
| `ForgeNumberedCard` | `../../components/ui/forge/ForgeNumberedCard` | Karta s cislem (default) |
| `ForgeButton` | `../../components/ui/forge/ForgeButton` | Tlacitko/Link (default) |
| `ForgeSectionLabel` | `../../components/ui/forge/ForgeSectionLabel` | Section label (default) |
| `ForgePricingCard` | `../../components/ui/forge/ForgePricingCard` | Cenova karta (default) |
| `ForgeFaqAccordion` | `../../components/ui/forge/ForgeFaqAccordion` | FAQ accordion (default) |

**Celkem: 1 hook, 10 ikon, 8 Forge komponent, 1 marketing komponenta.**

### 4.2 Co importuje Home

| Soubor | Jak |
|--------|-----|
| `src/Routes.jsx` | `import Home from './pages/home'` — namapovano na route `/` |

Home je importovan primo (ne lazy-loaded). Je soucasti hlavniho bundlu.

---

## 5. Design a vizual

### 5.1 Forge tokeny pouzivane na Home strance

**Pozadi:**
| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `--forge-bg-void` | `#08090C` | Hlavni pozadi stranky (forgePageStyles) |
| `--forge-bg-surface` | `#0E1015` | About sekce, Capabilities sekce, pricing karty, FAQ hover |
| `--forge-bg-elevated` | `#161920` | Stat karty, card hover stav |
| `--forge-bg-overlay` | `#1C1F28` | (nepouzito primo) |

**Text:**
| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `--forge-text-primary` | `#E8ECF1` | Hlavni text, nadpisy |
| `--forge-text-secondary` | `#9BA3B0` | Popisky, trust items, feature descriptions |
| `--forge-text-muted` | `#7A8291` | Section labely, numbered labels, ghost button |

**Akcenty:**
| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `--forge-accent-primary` | `#00D4AA` | CTA tlacitko, stat cisla, printer SVG vrstvy, hero underline |
| `--forge-accent-primary-h` | `#00F0C0` | Primary button hover |
| `--forge-accent-primary-medium` | `#00A88A` | Stat karty cisla (fallback) |
| `--forge-accent-secondary` | `#FF6B35` | FAQ accordion open stav (ikona +) |

**Fonty:**
| Token | Font | Pouziti na Home |
|-------|------|-----------------|
| `--forge-font-heading` | Space Grotesk | forge-h1, forge-h2, forge-h4, CTA tlacitka, trust strip label, recommended badge |
| `--forge-font-body` | IBM Plex Sans | forge-body, forge-body-lg, trust items, stat labely, feature descriptions |
| `--forge-font-tech` | Space Mono | Section labely (ForgeSectionLabel), numbered labels, status indicator, pricing period |
| `--forge-font-mono` | JetBrains Mono | Stat cisla (forge-mono-bold), cenove cisla, printer SVG texty |

**Borders:**
| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `--forge-border-default` | `#1E2230` | Trust strip separatory, stat karty, FAQ radky, section separatory |
| `--forge-border-highlight` | `rgba(0,212,170,0.2)` | Card hover stav |
| `--forge-border-grid` | `#141720` | Hero grid-bg textura |

### 5.2 Layout

**Kontejner:** `max-w-7xl mx-auto px-6 lg:px-8` (pouzito konzistentne ve vsech sekcich)

| Sekce | Layout | Breakpoints |
|-------|--------|-------------|
| Hero | `grid grid-cols-1 lg:grid-cols-[55%_45%]` | 1 sloupec na mobile, 55/45 split na lg+ |
| Trust Strip | `flex` marquee, `overflow: hidden` | Horizontalni scroll na vsech velikostech |
| About / Stats | `grid grid-cols-1 sm:grid-cols-3` | 1 sloupec -> 3 sloupce na sm+ |
| How It Works | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | 1 -> 2 -> 4 sloupce |
| Capabilities | `grid grid-cols-1 md:grid-cols-2` | 1 -> 2 sloupce na md+ |
| Pricing | `grid grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto` | 1 -> 3 sloupce, centrovano |
| FAQ | `max-w-2xl mx-auto` | Centrovany uzky sloupec |

**Vertikalni spacing:** `py-20 lg:py-24` pro vetsinu sekci (konzistentni).

**Hero vyska:** `minHeight: '90vh'` s `display: flex; alignItems: center`.

**Vizualni striedani pozadi:**
- Hero: `--forge-bg-void` + `forge-grid-bg` textura
- Trust Strip: `--forge-bg-void` s border-top/bottom
- About: `--forge-bg-surface` (tmavsi)
- How It Works: `--forge-bg-void`
- Capabilities: `--forge-bg-surface`
- Pricing: `forge-skewed-bg` pseudo-element (`--forge-bg-surface` skewed -2deg)
- FAQ: `--forge-bg-void`

### 5.3 Animace

| Animace | Typ | Kde | Popis |
|---------|-----|-----|-------|
| `Reveal` | Framer Motion | Vsechny sekce | Fade-in + translateY(12px) pri scrollu do viewport, `once: true` |
| `forge-marquee` | CSS keyframe | Trust Strip | `translateX(0) -> translateX(-50%)`, 25s linear infinite |
| `forge-grid-bg` | CSS background | Hero | Blueprint grid pattern 24x24px |
| `forge-grain` | CSS `::before` | Cela stranka | Film grain overlay, opacity 0.025 |
| `ForgePrinterSVG` | CSS keyframes | Hero (desktop) | 18s cyklus: build layers -> READY -> fade -> loop |
| `ForgeHeroUnderline` | CSS keyframe | Hero nadpis | 3-layer draw-in animace (200ms, 400ms, 600ms stagger) |
| `forge-pulse-dot` | CSS keyframe | Status indicator | 2s pulz opacity 1 -> 0.3 |
| `forge-hot-glow` | CSS keyframe | Printer nozzle | Drop-shadow glow pulsing |
| Trust item hover | Inline JS | Trust Strip items | Opacity 0.6 -> 0.9 pri hover |

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` v `forge-animations.css`
vypina vsechny forge animace (marquee, pulse, underline, printer SVG).

### 5.4 Forge compliance

| Pravidlo | Stav | Poznamka |
|----------|------|---------|
| `forge-font-heading` pro nadpisy lg+ | OK | forge-h1, forge-h2, forge-h4 pouzivaji Space Grotesk |
| `forge-font-tech` jen pro 12px labely/ceny | OK | Jen ForgeSectionLabel, numbered-label, status indicator, pricing period |
| Zadna genericka modra | OK | Zadny #3B82F6 ani podobne |
| WCAG AA kontrast 4.5:1 | VAROVANI | Viz sekce 17 — trust strip items maji opacity 0.6 |
| Teal + orange akcenty | OK | `--forge-accent-primary` (#00D4AA) + `--forge-accent-secondary` (#FF6B35) |
| 55/45 hero split | OK | `lg:grid-cols-[55%_45%]` |
| Cislovane sekce | OK | How It Works (01-04), Capabilities (01-04) |
| Version badge | OK via ForgeStatusIndicator | `STATUS: PRINTING` badge v hero |

---

## 6. Datovy model

Home stranka nema vlastni datovy model ani stav v localStorage/backendu. Vsechna data
jsou definovana primo v komponente jako konstanty:

### 6.1 trustItems (pole 10 polozek)

```javascript
{ label: string, icon: LucideIcon }
```

Labely jsou hardcoded v anglictine (PrusaSlicer CLI, White-label widget, Multi-tenant, atd.).
Ikony pochazi z `lucide-react`.

### 6.2 plans (pole 3 polozek)

```javascript
{
  name: string,          // 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  price: string,         // '499 Kc' / '$20' (dle jazyka)
  period: string,        // t('home.forge.plans.period') — 'mesicne'/'per month'
  ctaText: string,       // Lokalizovany CTA text
  ctaTo: string,         // '/register' nebo '/support'
  recommended: boolean,  // true pro PROFESSIONAL
  features: string[],    // 3-4 prelozene features
}
```

**Cenova struktura (potvrzena uzivatelem):**
| Plan | CZ | EN |
|------|----|----|
| Starter | 499 Kc | $20 |
| Professional | 1 999 Kc | $80 |
| Enterprise | Na miru | Custom |

### 6.3 faqItems (pole 3 polozek)

```javascript
{ question: string, answer: string }
```

Vsechny texty pres `t()` prekladovou funkci.

### 6.4 howItWorksSteps (pole 4 polozek)

```javascript
{ number: string, title: string, desc: string }
```

Cisla: '01', '02', '03', '04'. Texty pres `t()`.

---

## 8. UI komponenty — detailni popis

### 8.1 Home (hlavni komponenta)

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/pages/home/index.jsx` |
| **Radky** | 434 |
| **Export** | `export default Home` |
| **Props** | Zadne |
| **State** | Zadny vlastni state (bezstavova komponenta) |
| **useEffect** | Zadny |
| **Hooks** | `useLanguage()` — vraci `{ t, language }` |

### 8.2 Pouzite Forge komponenty

#### Reveal
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/marketing/Reveal.jsx` |
| **Props** | `children`, `delay?: number` (default 0), `className?: string` |
| **Chovani** | Framer Motion wrapper. `initial={{ opacity: 0, y: 12 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `once: true`, viewport margin `-15% 0px` |
| **Pouziti na Home** | Obaluje kazdou sekci a jeji casti pro staggered scroll-in animaci |

#### ForgeStatusIndicator
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeStatusIndicator.jsx` |
| **Props** | `status?: 'idle'|'heating'|'printing'|'complete'|'error'` (default `'printing'`), `className?: string` |
| **Chovani** | Zobrazi teckovany status badge s barvou podle stavu. Pouziva `forge-font-tech` pro label. |
| **Pouziti na Home** | V hero sekci s `status="printing"` — zobrazi "STATUS: PRINTING" s teal pulsujici teckou |

#### ForgeHeroUnderline
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeHeroUnderline.jsx` |
| **Props** | `className?: string` |
| **Chovani** | 3-vrstva SVG underline s draw-in animaci (staggered 200/400/600ms). Barva `--forge-accent-primary`. `aria-hidden="true"`. |
| **Pouziti na Home** | Pod hero nadpisem jako dekorativni podtrzeni |

#### ForgePrinterSVG
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgePrinterSVG.jsx` |
| **Props** | `className?: string` |
| **Chovani** | Isometricka 3D tiskarna s 18s animacnim cyklem: build 8 vrstev -> "READY" pauza -> fade -> loop. Pure CSS animace, zadne JS timery. |
| **Pouziti na Home** | V hero sekci, pravem sloupci. `hidden lg:flex` — skryto na mobile. ViewBox 480x450, max-w 480px. |

#### ForgeNumberedCard
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeNumberedCard.jsx` |
| **Props** | `number: string`, `icon?: ReactNode`, `title: string`, `description: string`, `className?: string` |
| **Chovani** | Karta s cislem (napr. "01/"), volitelnou ikonou, nadpisem (forge-h4) a popisem. Hover stav pres `.forge-card-interactive` (translateY -2px, glow shadow, border highlight). |
| **Pouziti na Home** | How It Works (4 karty, bez ikon), Capabilities (4 karty, s inline SVG ikonami) |

#### ForgeButton
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeButton.jsx` |
| **Props** | `variant?: 'primary'|'outline'|'ghost'`, `to?: string` (Link route), `size?: 'sm'|'md'|'lg'`, `children`, `className?: string`, `onClick?: function`, `fullWidth?: boolean` |
| **Chovani** | Pokud `to` je definovano, renderuje `<Link>`. Jinak `<button>`. Hover pres inline JS event handlers. Primary: teal bg, dark text. Outline: transparent bg, border. Ghost: no border, muted text. |
| **Pouziti na Home** | Hero (primary `/register`, outline `/test-kalkulacka`), FAQ (ghost `/support`), pricing karty (primary/outline) |

#### ForgeSectionLabel
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeSectionLabel.jsx` |
| **Props** | `text: string`, `className?: string` |
| **Chovani** | Maly uppercase label ve `forge-font-tech`, velikost `--forge-text-xs`, barva `--forge-text-muted`. |
| **Pouziti na Home** | Nad kazdou sekci: "O NAS" / "POSTUP" / "FUNKCE" / "PLANY" / "FAQ" |

#### ForgePricingCard
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgePricingCard.jsx` |
| **Props** | `name: string`, `price: string`, `period: string`, `features: string[]`, `ctaText: string`, `ctaTo: string`, `recommended?: boolean`, `className?: string` |
| **Chovani** | Cenova karta s nazvem planu (forge-label), cenou (forge-mono-bold 3xl), features s checkmark ikonami a CTA tlacitkem (ForgeButton). Recommended varianta: accent border + glow + "Recommended" badge. |
| **Pouziti na Home** | 3 karty v Pricing sekci (Starter, Professional s recommended=true, Enterprise) |

#### ForgeFaqAccordion
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeFaqAccordion.jsx` |
| **Props** | `items: Array<{question, answer} | {q, a} | {title, content}>`, `className?: string` |
| **Chovani** | Accordion s `useState(isOpen)` pro kazdy radek. Toggle pres klik na button. Animace max-height 0->500px, 250ms ease. Ikona "+" rotuje 45 stupnu pri otevreni. `aria-expanded` atribut. |
| **Pouziti na Home** | FAQ sekce s 3 otazkami. Otazky pres `t()` klice. |

#### ForgeSquiggle
| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/forge/ForgeSquiggle.jsx` |
| **Props** | `className?: string`, `color?: string` (default `var(--forge-accent-primary)`) |
| **Chovani** | Dekorativni SVG vlnovka s feTurbulence filtrem pro organicky efekt. `aria-hidden="true"`. |
| **Pouziti na Home** | Pod nadpisem "How It Works" sekce jako dekorativni podtrzeni |

---

## 9. State management a data flow

Home stranka je **plne bezstavova**. Nema zadny vlastni `useState` ani `useEffect`.

**Jediny hook:** `useLanguage()` — poskytuje:
- `t(key)` — prekladova funkce, vraci string pro aktualni jazyk, fallback na klic
- `language` — aktualni jazyk (`'cs'` nebo `'en'`)

**Data flow:**
```
LanguageContext.Provider (App-level)
  |
  v
Home komponenta
  |-- t() pro vsechny texty
  |-- language pro primo prepinanou cenu/CTA
  |       (plans.price, plans.ctaText, trust strip text, Enterprise period)
  |
  v
Forge komponenty (props-driven, zadny vlastni external state)
```

**Zadna API volani.** Zadny localStorage. Zadny backend. Vsechna data jsou staticka,
definovana inline v komponente.

---

## 11. Preklady (i18n)

### 11.1 Pouzite prekladove klice

**Hero sekce:**
- `home.hero.title` — Hlavni nadpis
- `home.hero.subtitle` — Podnapis
- `home.hero.cta.primary` — CTA "Vyzkouset zdarma" / "Try for Free"
- `home.hero.cta.secondary` — CTA "Podivat se na demo" / "View Demo"

**Section labels:**
- `home.section.about` — "O NAS" / "ABOUT"
- `home.section.process` — "POSTUP" / "PROCESS"
- `home.section.capabilities` — "FUNKCE" / "CAPABILITIES"
- `home.section.plans` — "PLANY" / "PLANS"

**What We Do:**
- `home.whatWeDo.title`, `home.whatWeDo.p1`, `home.whatWeDo.p2`
- `home.whatWeDo.stat1`, `home.whatWeDo.stat2`, `home.whatWeDo.stat3`

**How It Works:**
- `home.howItWorks.title`
- `home.howItWorks.step1.title`, `home.howItWorks.step1.desc`
- `home.howItWorks.step2.title`, `home.howItWorks.step2.desc`
- `home.howItWorks.step3.title`, `home.howItWorks.step3.desc`
- `home.howItWorks.step4.title`, `home.howItWorks.step4.desc`

**Capabilities:**
- `home.forge.feature1.title`, `home.forge.feature1.desc`
- `home.forge.feature2.title`, `home.forge.feature2.desc`
- `home.forge.feature3.title`, `home.forge.feature3.desc`
- `home.forge.feature4.title`, `home.forge.feature4.desc`

**Pricing:**
- `home.forge.plans.title`, `home.forge.plans.period`
- `home.forge.plans.starter.f1`, `f2`, `f3`
- `home.forge.plans.pro.f1`, `f2`, `f3`, `f4`
- `home.forge.plans.enterprise.f1`, `f2`, `f3`, `f4`

**FAQ:**
- `home.faq.title`
- `home.faq.q1`, `home.faq.a1`
- `home.faq.q2`, `home.faq.a2`
- `home.faq.q3`, `home.faq.a3`
- `home.faq.more`

### 11.2 Hardcoded texty (bez t())

| Text | Radek | Jazyk | Typ |
|------|-------|-------|-----|
| Trust strip: "Pouziva 120+ tiskovych farem" / "Trusted by 120+ print farms" | 175 | CS/EN inline ternary | Hardcoded |
| Trust item labels: "PrusaSlicer CLI", "White-label widget", "Multi-tenant", atd. | 29-39 | EN only | Hardcoded (technicky nazvy) |
| Plans price: "499 Kc" / "$20", "1 999 Kc" / "$80", "Na miru" / "Custom" | 46-73 | CS/EN inline ternary | Hardcoded |
| Plans ctaText: "Vyzkouset Starter" / "Try Starter", atd. | 48-75 | CS/EN inline ternary | Hardcoded |
| Plans period (Enterprise): prazdny string | 74 | — | Hardcoded (prazdne) |
| Plan names: "STARTER", "PROFESSIONAL", "ENTERPRISE" | 46,57,72 | EN only | Hardcoded |
| ForgePricingCard: "Recommended" badge | ForgePricingCard.jsx:41 | EN only | Hardcoded |
| FAQ section label: "FAQ" | 411 | EN only | Hardcoded |
| Stat values: "8s", "60%", "24/7" | 242-244 | univerzalni | Hardcoded (cisla) |

**Poznamka:** Nektere hardcoded texty jsou zamerne (technicke nazvy, cisla, plan names jako branding).
Problematicke jsou "Recommended" badge, trust strip popisek a FAQ label — ty by mely pouzivat `t()`.

### 11.3 Nepouzite klice definovane v LanguageContext

Nasledujici klice jsou definovane v `LanguageContext.jsx` ale NEPOUZIVANE na Home strance:
- `home.hero.note` — puvodni podnapis (nahrazen `home.hero.subtitle`)
- `home.trust.main`, `home.trust.sub`, `home.trust.label` — puvodni trust sekce texty
- `home.how.*` — puvodni "How" kroky (nahrazeny `home.howItWorks.*`)
- `home.features.*` — puvodni features (nahrazeny `home.forge.feature*`)
- `home.demo.*` — demo sekce (sekce odebrana z Home)
- `home.pricing.*` — puvodni pricing texty (nahrazeny `home.forge.plans.*`)
- `home.audience.*` — audience sekce (sekce odebrana z Home)
- `home.forge.plans.pro.cta`, `home.forge.plans.enterprise.cta` — CTA texty (nahrazeny inline ternary)

Tyto klice jsou pozustatky starsich verzi designu a zabirayi misto v prekladovem slovniku.

---

## 12. Pristupnost

### 12.1 Pozitivni

| Aspekt | Implementace |
|--------|-------------|
| Semanticke HTML | Kazda sekce je `<section>`, nadpisy `<h1>`/`<h2>`/`<h3>`, seznam `<ul>`/`<li>` |
| aria-hidden na dekoraci | `ForgeHeroUnderline`, `ForgePrinterSVG`, `ForgeSquiggle` maji `aria-hidden="true"` |
| aria-expanded | FAQ accordion button ma `aria-expanded={isOpen}` |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` vypina vsechny Forge animace |
| Keyboard navigace | FAQ accordion je `<button>` (focusable), CTA jsou `<Link>` (focusable) |

### 12.2 Problemy

| Problem | Detail | Zavaznost |
|---------|--------|-----------|
| Trust strip marquee | Nepretrzita animace bez pause-on-hover/focus. Nekteri uzivatele nemohou precist obsah. `prefers-reduced-motion` ji vypne, ale pak je obsah staticky overflow hidden. | P2 |
| Trust strip items | `onMouseEnter`/`onMouseLeave` pro opacity zmenu neni dostupne klavesnici. Polozky nejsou focusable. | P3 |
| Hero printer SVG | Skryty na mobile (`hidden lg:flex`). Na desktopu neni alternativni text (jen `aria-hidden`). | P3 (dekorace) |
| Stat karty | Cisla `8s`, `60%`, `24/7` nemaji `role="img"` ani `aria-label` pro screen readery. | P3 |
| ForgeNumberedCard hover arrow | Sipka je ciste vizualni, ale karta neni `<a>` ani `<button>` — hover efekt naznacut interaktivitu ktera neexistuje. | P2 |

---

## 13. Performance

### 13.1 Pozitivni

| Aspekt | Detail |
|--------|--------|
| Zadna API volani | Stranka je plne staticka, zadne useEffect, zadne fetch |
| Reveal `once: true` | IntersectionObserver se odpoji po prvnim zobrazeni |
| SVG inline | Printer SVG je inline, zadne externi obrazky k nacitani |
| CSS animace | Printer animace + marquee jsou CSS-only (GPU akcelerovane) |

### 13.2 Rizika

| Riziko | Detail |
|--------|--------|
| Non-lazy import | Home je importovana primo v Routes.jsx (ne lazy). Jako landing page je to spravne, ale vsechny Forge komponenty jsou v bundlu. |
| Framer Motion | Reveal pouziva framer-motion — celou knihovnu pro jednoduchou fade-in animaci. Mohla by byt nahrazena CSS `@keyframes` + IntersectionObserver. |
| Trust strip duplikace | `[...trustItems, ...trustItems]` — pole je duplikovano pro nekonecny marquee efekt. 20 DOM elementu misto 10. |
| ForgePrinterSVG slozitost | 278 radku SVG s per-layer CSS keyframes generovanymi v JSX. Neni kriticke, ale pridava k DOM slozitosti. |

---

## 14. Bezpecnost

Home stranka nema bezpecnostni rizika:
- Zadne uzivatelske vstupy
- Zadne API volani
- Zadne localStorage operace
- Zadne dynamicke URL parametry
- Vsechny `to` props na ForgeButton jsou staticke routy (`/register`, `/test-kalkulacka`, `/support`)
- Zadne `dangerouslySetInnerHTML`

---

## 16. Souvisejici dokumenty

| Dokument | Cesta |
|----------|-------|
| Forge Redesign Bugfix Plan | `docs/claude/PLANS/Redesign-Bugfix-Plan-2026-02-10.md` |
| Error Log (FORGE Redesign) | `docs/claude/Error_Log.md` (sekce FORGE Redesign) |
| Design Error Log | `docs/claude/Design-Error_LOG.md` |
| MEMORY.md (FORGE sekce) | `.claude/projects/.../memory/MEMORY.md` (sekce FORGE Redesign) |
| Forge Tokens CSS | `src/styles/forge-tokens.css` |
| Forge Typography CSS | `src/styles/forge-typography.css` |
| Forge Animations CSS | `src/styles/forge-animations.css` |
| Forge Textures CSS | `src/styles/forge-textures.css` |
| Forge Utilities CSS | `src/styles/forge-utilities.css` |
| LanguageContext | `src/contexts/LanguageContext.jsx` |
| Routes | `src/Routes.jsx` |

---

## 17. Zname omezeni

### 17.1 Hardcoded texty

Trust strip label (`radek 175: "Pouziva 120+ tiskovych farem"`) a dalsi texty
(viz sekce 11.2) pouzivaji `language === 'cs' ? ... : ...` misto `t()`.
Tohle ztezuje budouci pridani dalsich jazyku.

### 17.2 "Recommended" badge v ForgePricingCard

Text "Recommended" na radku 41 v `ForgePricingCard.jsx` je hardcoded v anglictine.
Neni prelozeny pro CS verzi. Mel by pouzivat `t('home.forge.plans.recommended')`.

### 17.3 Nepouzivane prekladove klice

V `LanguageContext.jsx` zustava cca 30+ `home.*` klicu ktere se uz nepouzivaji
(viz sekce 11.3). Zabirayi misto a mohou zmast vyvojare.

### 17.4 ForgeNumberedCard hover v Capabilities

Karty v Capabilities sekci maji `.forge-card-interactive` styl (hover glow, translateY,
cursor pointer, hover arrow), ale nejsou klikatelne. Naznacuji interaktivitu
ktera neexistuje.

### 17.5 Trust strip pristupnost

Marquee animace bezi nepretrzite bez moznosti pozastaveni. Na mobile se obsah
nestiha precist. `prefers-reduced-motion` animaci vypne, ale obsah je pak
orezany pres `overflow: hidden`.

### 17.6 FAQ omezeny pocet otazek

Na Home strance jsou jen 3 FAQ otazky. V LanguageContext existuji jen tyto 3 klice
(`home.faq.q1/a1` az `q3/a3`). CTA "Zobrazit vsechny otazky" smeruje na `/support`,
kde mohou byt dalsi.

### 17.7 Pricing bez tabulkove kompareability

Cenove plany nemaji srovnavaci tabulku (feature matrix). Zakaznik musi cist
3 karty zvlast a porovnavat sam. U Enterprise chybi cena (zamerne — "Na miru").

### 17.8 Jeden soubor (434 radku)

Cela stranka je v jednom souboru bez subkomponent. Sekce (Hero, Trust Strip, About,
How It Works, Capabilities, Pricing, FAQ) by mohly byt extrahovany do
samostatnych komponent pro lepsi udrzitelnost.

### 17.9 Inline SVG ikony v Capabilities

Capabilities sekce ma 4 inline SVG ikony (po 5-8 radku kazda) primo v JSX.
Mohly by byt extrahovany do komponent nebo nahrazeny lucide-react ikonami.
