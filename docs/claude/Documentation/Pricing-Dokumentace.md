# Pricing — Dokumentace

> Verejna stranka s ceniky, porovnanim planu, KPI statistikami, FAQ a CTA sekcemi.
> Pouziva Forge dark theme. Stranka je plne bilingvalni (CS/EN).

---

## 1. Prehled

| Polozka | Hodnota |
|---------|---------|
| **Nazev** | Pricing |
| **URL routa** | `/pricing` |
| **Soubor** | `src/pages/pricing/index.jsx` |
| **Registrace v routeru** | `src/Routes.jsx:82` — `<Route path="/pricing" element={<Pricing />} />` |
| **Typ stranky** | Verejna (public), marketing/cenova |
| **Hlavni funkce** | Zobrazeni 3 cenovych planu (Starter/Professional/Enterprise), KPI statistiky, FAQ s kategoriemi, CTA sekce |

### Cenova struktura

| Plan | CZ cena | EN cena | Doporuceny |
|------|---------|---------|------------|
| Starter | 499 Kc | $20 | Ne |
| Professional | 1 999 Kc | $80 | Ano |
| Enterprise | Na miru | Custom | Ne |

---

## 2. Technologie a jazyk

| Vlastnost | Hodnota |
|-----------|---------|
| **Jazyk** | JavaScript + JSX |
| **Framework** | React 19 |
| **Build** | Vite |
| **Styling** | Forge CSS tokeny (inline styles) + Tailwind utility classes |
| **State** | `useState` (lokalni — activeTab pro FAQ) |
| **i18n** | `useLanguage()` z `LanguageContext.jsx` |
| **Animace** | `framer-motion` (pres Reveal wrapper) |
| **Pocet radku** | 355 (hlavni soubor) |
| **Pocet radku (vsechny deps)** | ~934 (hlavni + 6 subkomponent + data) |

---

## 3. Architektura souboru

### 3.1 Hlavni soubor

```
src/pages/pricing/index.jsx (355 radku)
```

Stranka nema vlastni podslozku `components/` — vsechny subkomponenty jsou zdilene Forge UI komponenty.

### 3.2 Pouzite subkomponenty

| Komponenta | Soubor | Radky | Ucel |
|------------|--------|-------|------|
| `Reveal` | `src/components/marketing/Reveal.jsx` | 19 | Scroll-in animace (framer-motion) |
| `ForgeSquiggle` | `src/components/ui/forge/ForgeSquiggle.jsx` | 29 | Dekorativni SVG vlnovka (importovana, ale **nepouzita** na strance) |
| `ForgeButton` | `src/components/ui/forge/ForgeButton.jsx` | 108 | CTA tlacitko s variantami primary/outline/ghost |
| `ForgeSectionLabel` | `src/components/ui/forge/ForgeSectionLabel.jsx` | 23 | Uppercase mono label ("PLANS", "FAQ") |
| `ForgePricingCard` | `src/components/ui/forge/ForgePricingCard.jsx` | 124 | Karta cenoveho planu |
| `ForgeFaqAccordion` | `src/components/ui/forge/ForgeFaqAccordion.jsx` | 83 | Rozklikavaci FAQ accordion |

### 3.3 Datove zdroje

| Zdroj | Soubor | Ucel |
|-------|--------|------|
| `getFaqCategories()` | `src/data/faq.js` (193 radku) | 4 FAQ kategorie, kazda s 3 otazkami (CS+EN) |
| `useLanguage()` | `src/contexts/LanguageContext.jsx` | Prekladove klice `pricing.*` |

---

## 4. Import graf

### 4.1 Co Pricing importuje

```
pricing/index.jsx
  |-- react (useState)
  |-- ../../contexts/LanguageContext (useLanguage)
  |-- ../../components/marketing/Reveal
  |-- ../../components/ui/forge/ForgeSquiggle       [!] importovan ale NEPOUZIT
  |-- ../../components/ui/forge/ForgeButton
  |-- ../../components/ui/forge/ForgeSectionLabel
  |-- ../../components/ui/forge/ForgePricingCard
  |-- ../../components/ui/forge/ForgeFaqAccordion
  |-- ../../data/faq (getFaqCategories)
```

### 4.2 Co importuje Pricing

```
src/Routes.jsx:10  -->  import Pricing from './pages/pricing'
src/Routes.jsx:82  -->  <Route path="/pricing" element={<Pricing />} />
```

Pricing stranka nema zadne props — vsechna data jsou lokalni (plans, kpis) nebo z contextu (language, t).

---

## 5. Design a vizual

### 5.1 Forge tokeny pouzite na strance

#### Barvy

| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `--forge-bg-void` | `#08090C` | Hlavni pozadi stranky |
| `--forge-bg-surface` | `#0E1015` | KPI karty, plan cards, annual banner, final CTA, FAQ hover |
| `--forge-text-primary` | `#E8ECF1` | Hlavni text, nadpisy, KPI title |
| `--forge-text-secondary` | `#9BA3B0` | Podnadpisy, plan features, FAQ odpovedi |
| `--forge-text-muted` | `#7A8291` | KPI popisy, period text v plan cards |
| `--forge-accent-primary` | `#00D4AA` | KPI hodnoty, checkmark ikony, doporuceny plan border, CTA glow |
| `--forge-accent-secondary` | `#FF6B35` | FAQ otevira ikona (aktivni stav) |
| `--forge-border-default` | `#1E2230` | Ohraniceni karet, FAQ oddelovace |
| `--forge-border-active` | `#2A3040` | Aktivni FAQ tab border, outline button border |

#### Typography

| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `--forge-font-heading` | Space Grotesk | H1, H2, H3, KPI titulky, FAQ tab buttons, annual banner title, plan names |
| `--forge-font-body` | IBM Plex Sans | Hlavni body text stranky, plan features |
| `--forge-font-mono` | JetBrains Mono | KPI hodnoty (8s, 60%, 24/7), ceny v plan cards |
| `--forge-font-tech` | Space Mono | Section labels (PLANS, FAQ), period text v plan cards |

#### Rozmery a radius

| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `--forge-radius-md` | `6px` | KPI karty, plan cards, annual banner, CTA box |
| `--forge-radius-sm` | `4px` | FAQ tab buttony, ForgeButton |

#### CSS utility classes

| Trida | Definovana v | Ucel |
|-------|-------------|------|
| `.forge-grain` | `forge-textures.css` | Film-grain overlay (fixed, opacity 0.025) |
| `.forge-grid-bg` | `forge-textures.css` | Blueprint mriezka 24x24px na hero sekci |
| `.forge-skewed-bg` | `forge-textures.css` | Sikmé pozadi (skewY -2deg) pro Plans sekci |
| `.forge-h1` | `forge-typography.css` | Heading 1 (Space Grotesk, 2.441rem, 700) |
| `.forge-h2` | `forge-typography.css` | Heading 2 (Space Grotesk, 1.953rem, 700) |
| `.forge-h3` | `forge-typography.css` | Heading 3 (Space Grotesk, 1.563rem, 600) |
| `.forge-body-lg` | `forge-typography.css` | Vetsi body text (IBM Plex Sans, 1rem) |
| `.forge-label` | `forge-typography.css` | Uppercase label (IBM Plex Sans, 0.75rem, 500) |
| `.forge-mono-bold` | `forge-typography.css` / `forge-utilities.css` | Monospace tucne (JetBrains Mono, 700) |
| `.forge-transition-micro` | `forge-animations.css` | Prechod `all 120ms ease-out` |

### 5.2 Layout

Stranka je rozdelena do 4 hlavnich sekci:

```
+================================================+
|  HERO SECTION                                  |
|  forge-grid-bg + radial glow overlay           |
|  H1 + subtitle + 3x KPI karty (sm:grid-cols-3)|
|  py-20 lg:py-28, max-w-7xl                    |
+================================================+
|  PLANS SECTION                                 |
|  forge-skewed-bg (sikmé pozadi)                |
|  Section label "PLANS" + H2 + subtitle         |
|  3x PricingCard (md:grid-cols-3, max-w-4xl)   |
|  Annual discount banner                        |
|  py-20 lg:py-24, max-w-7xl                    |
+================================================+
|  FAQ SECTION                                   |
|  id="faq"                                      |
|  Section label "FAQ" + H2 + subtitle           |
|  12-col grid: 4-col tabs+CTA | 8-col accordion|
|  py-20 lg:py-24, max-w-7xl                    |
+================================================+
|  FINAL CTA                                     |
|  Accent border box s glow                      |
|  H3 + popis | 2 buttony (primary + outline)    |
|  py-16, max-w-7xl                              |
+================================================+
|  FOOTER (sdileny Footer.jsx — neni v scope)    |
+================================================+
```

**Breakpointy:**
- Mobilni: 1 sloupec pro KPI i Plans, FAQ vertikalne
- `sm:` (640px+): KPI grid 3 sloupce, annual banner side-by-side
- `md:` (768px+): Plans grid 3 sloupce
- `lg:` (1024px+): Vetsi padding (py-28), FAQ 12-col grid (4+8)

### 5.3 Animace

| Animace | Knihovna | Ucel |
|---------|---------|------|
| `Reveal` | framer-motion | Scroll-in fade+translate (opacity 0->1, y 12->0) |
| `forge-transition-micro` | CSS | Hover prechody na FAQ tab buttons |
| FAQ accordion max-height | CSS transition | Rozbaleni/sbaleni FAQ (250ms ease) |
| ForgeButton hover | JS inline | translateY(-1px), glow shadow pro primary; bg change pro outline |

**Reveal staggering:**
- Hero: title `delay=0`, KPI karty `delay=0.05`
- Plans: nadpis `delay=0`, karty `delay=0/0.05/0.10`, annual banner `delay=0.15`
- FAQ: nadpis + tabs `delay=0/0.02`
- Final CTA: `delay=0`

### 5.4 Forge compliance check

| Pravidlo | Status | Poznamka |
|----------|--------|---------|
| `forge-font-tech` jen pro ceny/kody/12px | OK | Pouzity v ForgeSectionLabel (text-xs = 0.625rem ~ 10px) a period text v ForgePricingCard (text-sm = 0.75rem ~ 12px) |
| `forge-font-heading` pro nadpisy text-lg+ | OK | H1, H2, H3, KPI titulky, FAQ tab buttons, annual banner title — vse 1rem+ |
| Zadna genericka modra | OK | Akcentni barvy: teal (#00D4AA), orange (#FF6B35) |
| WCAG AA min 4.5:1 | OK | `--forge-text-muted` (#7A8291) na `--forge-bg-void` (#08090C) = ~4.7:1 |
| Inline Forge tokeny (ne Tailwind barvy) | OK | Vsechny barvy pres CSS variables |

---

## 8. UI komponenty — detailni popis

### 8.1 Pricing (hlavni komponenta)

**Soubor:** `src/pages/pricing/index.jsx`
**Export:** `export default Pricing`

#### Props
Zadne — stranka je top-level route komponenta.

#### State

| State | Typ | Default | Ucel |
|-------|-----|---------|------|
| `activeTab` | `number` | `0` | Index aktivni FAQ kategorie |

#### Hooks

| Hook | Zdroj | Ucel |
|------|-------|------|
| `useLanguage()` | `LanguageContext` | Vraci `{ t, language }` pro preklady a jazykovou detekci |

#### Lokalni data (v tele komponenty)

| Promenna | Typ | Popis |
|----------|-----|-------|
| `faqCategories` | `Array<{id, label, items}>` | 4 FAQ kategorie z `getFaqCategories(language)` |
| `plans` | `Array<{name, price, period, ctaText, ctaTo, recommended, features}>` | 3 cenove plany |
| `kpis` | `Array<{value, title, desc}>` | 3 KPI statistiky (8s, 60%, 24/7) |

#### Sekce v renderovani

1. **Hero** — H1 nadpis, podnadpis, 3 KPI karty (grid)
2. **Plans** — Section label, H2, 3 cenove karty (ForgePricingCard), annual discount banner
3. **FAQ** — Section label, H2, levy sidebar s tab buttony + CTA, pravy panel s ForgeFaqAccordion
4. **Final CTA** — Box s accent borderem, H3, popis, 2 CTA buttony

### 8.2 ForgePricingCard

**Soubor:** `src/components/ui/forge/ForgePricingCard.jsx`
**Export:** `export default ForgePricingCard`

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `name` | `string` | — | Nazev planu (Starter/Professional/Enterprise) |
| `price` | `string` | — | Cena ("499 Kc", "$20", "Na miru") |
| `period` | `string` | — | Obdobi ("mesicne"/"monthly") |
| `features` | `string[]` | `[]` | Seznam feature textu |
| `ctaText` | `string` | — | Text CTA tlacitka |
| `ctaTo` | `string` | — | Router cil CTA tlacitka |
| `recommended` | `boolean` | `false` | Zvyraznena karta (accent border + glow + badge) |
| `className` | `string` | `''` | Dalsi CSS tridy |

#### Vizualni rozliseni

- **Recommended plan** = accent border (#00D4AA), glow box-shadow, badge "Recommended" navrchu
- **Standardni plan** = default border (#1E2230), bez glow/badge

### 8.3 ForgeFaqAccordion

**Soubor:** `src/components/ui/forge/ForgeFaqAccordion.jsx`
**Export:** `export default ForgeFaqAccordion`

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `items` | `Array<{question/q/title, answer/a/content}>` | `[]` | Pole FAQ polozek (flexibilni klice) |
| `className` | `string` | `''` | Dalsi CSS tridy |

#### Interni state (FaqRow subkomponenta)

| State | Typ | Default | Ucel |
|-------|-----|---------|------|
| `isOpen` | `boolean` | `false` | Rozbaleni/sbaleni odpovedi |

#### Chovani
- Klik na otazku togglene `isOpen`
- Animace pres CSS `max-height` prechod (0 <-> 500px, 250ms ease)
- `+` ikona se otoci o 45deg pri otevreni, meni barvu z teal na orange
- `aria-expanded` atribut na button

### 8.4 ForgeButton

**Soubor:** `src/components/ui/forge/ForgeButton.jsx`
**Export:** `export default ForgeButton`

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `variant` | `'primary' \| 'outline' \| 'ghost'` | `'primary'` | Vizualni varianta |
| `to` | `string` | — | Pokud zadano, renderuje React Router `Link` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Velikost (h-9/h-11/h-12) |
| `children` | `ReactNode` | — | Obsah tlacitka |
| `className` | `string` | `''` | Dalsi CSS tridy |
| `onClick` | `function` | — | Click handler (ignorovano kdyz `to` je zadano) |
| `fullWidth` | `boolean` | `false` | 100% sirka |

#### Pouziti na Pricing strance

| Misto | Varianta | Size | To |
|-------|----------|------|----|
| Annual banner | outline | sm | /support |
| FAQ sidebar — "Zacit zdarma" | primary | md | /register |
| FAQ sidebar — "Napsat podporu" | outline | md | /support |
| Final CTA — "Kontaktovat" | primary | lg | /support |
| Final CTA — "Vyzkouset demo" | outline | lg | /test-kalkulacka |
| Plan cards (delegovano ForgePricingCard) | primary/outline | md | /register nebo /support |

### 8.5 ForgeSectionLabel

**Soubor:** `src/components/ui/forge/ForgeSectionLabel.jsx`
**Export:** `export default ForgeSectionLabel`

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `text` | `string` | — | Text labelu (PLANS, FAQ) |
| `className` | `string` | `''` | Dalsi CSS tridy |

Renderuje `<span>` s `forge-font-tech`, `text-xs` (0.625rem), uppercase, letter-spacing 0.1em, barva `--forge-text-muted`.

### 8.6 ForgeSquiggle

**Soubor:** `src/components/ui/forge/ForgeSquiggle.jsx`
**Export:** `export default ForgeSquiggle`

**POZNAMKA:** Importovano na radku 4, ale **neni pouzito nikde v JSX**. Dead import.

### 8.7 Reveal

**Soubor:** `src/components/marketing/Reveal.jsx`
**Export:** `export default Reveal`

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `children` | `ReactNode` | — | Obsah k animovani |
| `delay` | `number` | `0` | Zpozdeni v sekundach |
| `className` | `string` | — | Dalsi CSS tridy |

Pouziva `framer-motion` `motion.div` s `whileInView` triggerem. Animace: fade-in (opacity 0->1) + slide-up (y 12->0), 500ms, ease-out. Spusti se jednou (`once: true`).

---

## 9. State management a data flow

### 9.1 Datovy tok

```
LanguageContext                   faq.js
     |                              |
     v                              v
  useLanguage() -----> Pricing <----- getFaqCategories(language)
     |  |                |
     |  |                |-- plans[] (lokalni pole, CS/EN ternary)
     |  |                |-- kpis[] (lokalni pole, CS/EN ternary)
     |  |                |
     |  t()              |-- activeTab (useState)
     |  |                      |
     v  v                      v
  [Hero]  [Plans]         [FAQ tabs] --> ForgeFaqAccordion
```

### 9.2 Stav

- **Globalni stav:** Pouze jazyk (`language`, `t`) z `LanguageContext`
- **Lokalni stav:** Pouze `activeTab` (integer index aktivni FAQ kategorie)
- **Zadny API call** — vsechna data jsou staticka/lokalni
- **Zadny effect** — stranka nema `useEffect`

### 9.3 Interakce

| Akce uzivatele | Handler | Vysledek |
|----------------|---------|----------|
| Klik na FAQ tab | `setActiveTab(i)` | Zmena zobrazene FAQ kategorie |
| Klik na FAQ otazku | `FaqRow.setIsOpen(!isOpen)` | Rozbaleni/sbaleni odpovedi |
| Klik na CTA button | React Router navigace | Presmerovani na /register, /support, /test-kalkulacka |
| Scroll | Reveal (framer-motion) | Animace vstupu sekci |

---

## 11. Preklady (i18n) — pouzite klice + hardcoded texty

### 11.1 Pouzite prekladove klice (pres `t()`)

| Klic | CS hodnota | EN hodnota |
|------|-----------|-----------|
| `pricing.hero.title` | Jednoduche a transparentni ceny | Simple and Transparent Pricing |
| `pricing.hero.subtitle` | Zacni zdarma a rozsiruj podle potreby... | Start free and scale as you grow... |
| `pricing.plan.starter` | Starter | Starter |
| `pricing.plan.professional` | Professional | Professional |
| `pricing.plan.enterprise` | Enterprise | Enterprise |
| `pricing.monthly` | mesicne | monthly |
| `pricing.custom` | Na miru | Custom |

### 11.2 Hardcoded texty (MIMO prekladovy system)

Nasledujici texty pouzivaji `language === 'cs' ? '...' : '...'` misto `t()`:

| Radek | CS text | EN text | Kategorie |
|-------|---------|---------|-----------|
| 29 | Vyzkouset Starter | Try Starter | CTA text |
| 33-46 | Feature pole Starter (5 polozek) | Feature array (5 items) | Plan features |
| 52 | Zacit s Professional | Start Professional | CTA text |
| 56-71 | Feature pole Professional (6 polozek) | Feature array (6 items) | Plan features |
| 77 | Kontaktovat nas | Contact Us | CTA text |
| 81-96 | Feature pole Enterprise (6 polozek) | Feature array (6 items) | Plan features |
| 100-110 | KPI pole (3x value+title+desc) | KPI array (3 items) | Statistiky |
| 186-187 | Plany pro kazdou tiskarnu | Plans for every shop | Sekce nadpis |
| 192-194 | Zacni zdarma a skaluj... | Start free and scale... | Sekce podnadpis |
| 234 | Rocni sleva + individualni pilot | Annual discount + pilot options | Banner nadpis |
| 237-239 | Chces delsi test...? | Need a longer test...? | Banner popis |
| 243 | Kontaktovat podporu | Contact support | Banner CTA |
| 255 | Casto kladene otazky | Frequently Asked Questions | FAQ nadpis |
| 258-260 | Kratke odpovedi na nejcastejsi... | Quick answers to the most... | FAQ popis |
| 290 | Zacit zdarma | Start free | FAQ CTA |
| 293 | Napsat podporu | Contact support | FAQ CTA |
| 327-329 | Chces plan na miru...? | Need a custom plan...? | Final CTA nadpis |
| 331-334 | Napis nam co potrebujes... | Tell us what you need... | Final CTA popis |
| 339 | Kontaktovat | Contact | Final CTA button |
| 342 | Vyzkouset demo | Try demo | Final CTA button |

**Take v ForgePricingCard.jsx:41** — text "Recommended" je hardcoded anglicky, bez prekladu.

### 11.3 FAQ texty

FAQ obsah je v `src/data/faq.js` — 4 kategorie, 12 otazek celkem. Plne lokalizovano (CS/EN) primo v datovem souboru, ne pres `t()`.

---

## 12. Pristupnost

### 12.1 Co je spravne

| Prvek | Pristupnost |
|-------|------------|
| FAQ accordion `<button>` | Ma `aria-expanded={isOpen}` |
| ForgeSquiggle SVG | Ma `aria-hidden="true"` |
| FAQ tlacitka | Nativni `<button>` s plnou sirkou, keyboard accessible |
| CTA tlacitka | React Router `<Link>` — nativne focusable |
| Barevny kontrast (text-muted) | #7A8291 na #08090C = ~4.7:1 (WCAG AA pass) |
| Barevny kontrast (text-secondary) | #9BA3B0 na #08090C = ~7.3:1 (WCAG AAA pass) |
| Barevny kontrast (text-primary) | #E8ECF1 na #08090C = ~15:1 (WCAG AAA pass) |

### 12.2 Co chybi nebo lze zlepsit

| Problem | Zavaznost | Popis |
|---------|-----------|-------|
| FAQ accordion nema `aria-controls` | Stredni | Button by mel mit `aria-controls="panel-{id}"` a panel `id="panel-{id}"` + `role="region"` |
| FAQ accordion nema keyboard `Escape` | Nizka | Zavreni rozbalene otazky pres Escape by bylo uzitecne |
| Plan cards nemaji `aria-label` | Nizka | Screen reader neziska kontext "Recommended plan" bez vizualniho badge |
| KPI karty nemaji semantiku | Nizka | Mohly by byt `<article>` nebo `role="group"` s `aria-label` |
| ForgeSquiggle — dead import | Info | Nema vliv na pristupnost, ale zbytecny import |
| Focus ring na FAQ tabs | Stredni | Chybi explicitni `:focus-visible` styl na FAQ tab buttonech |

---

## 13. Performance

### 13.1 Pozitivni

| Aspekt | Detail |
|--------|--------|
| Zadne API cally | Vsechna data jsou staticka — nulova latence |
| Zadny useEffect | Zadne vedlejsi efekty pri renderovani |
| Reveal `once: true` | Scroll animace se spusti jen jednou (ne pri kazdem scroll) |
| Reveal `viewport.margin` | `-15%` offset — animace zacne pred dosazenim viewportu |
| Tailwind purge | Nepouzite utility tridy se odstranuji pri buildu |

### 13.2 Mozna vylepseni

| Aspekt | Detail |
|--------|--------|
| Dead import (ForgeSquiggle) | Import na radku 4 neni pouzit — zbytecny bundle size (~29 radku) |
| FAQ accordion max-height 500px | Fixni max-height muze zpusobit usek u velmi dlouhych odpovedi nebo zbytecne zpozdeni u kratkych |
| Inline styles vs CSS classes | Velke mnozstvi inline stylu (kazda sekce) — mohlo by byt extrahovan do CSS trid |
| framer-motion bundle | Cela knihovna pro jednoduche fade-in animace — alternativa: CSS `@starting-style` nebo `IntersectionObserver` |

---

## 16. Souvisejici dokumenty

| Dokument | Cesta | Relevance |
|----------|-------|-----------|
| CLAUDE.md | `Model_Pricer-V2-main/CLAUDE.md` | Hlavni operacni manual projektu |
| MEMORY.md | `.claude/projects/.../memory/MEMORY.md` | Forge redesign poznamky, cenova struktura |
| Redesign Bugfix Plan | `docs/claude/PLANS/Redesign-Bugfix-Plan-2026-02-10.md` | Popis Forge redesignu vcetne Pricing |
| Error Log | `docs/claude/Error_Log.md` | Historicke bugy (#4 — design system inconsistency na Pricing) |
| Design Error Log | `docs/claude/Design-Error_LOG.md` | Design nesrovnalosti |
| FAQ data | `src/data/faq.js` | Datovy zdroj pro FAQ sekci |
| LanguageContext | `src/contexts/LanguageContext.jsx` | Prekladove klice `pricing.*` (radky 178-184, 721-728) |
| forge-tokens.css | `src/styles/forge-tokens.css` | Design tokeny (barvy, fonty, radii, stiny) |
| forge-typography.css | `src/styles/forge-typography.css` | Typograficke utility tridy |
| forge-textures.css | `src/styles/forge-textures.css` | Texturove tridy (grain, grid-bg, skewed-bg) |
| forge-animations.css | `src/styles/forge-animations.css` | Animacni tridy (transition-micro) |
| forge-utilities.css | `src/styles/forge-utilities.css` | Utility tridy (card, badge, focus-ring, mono-bold) |

---

## 17. Zname omezeni

### 17.1 Funkcni

| Omezeni | Popis | Dopad |
|---------|-------|-------|
| **Staticka data** | Cenove plany a features jsou hardcoded v komponentni — ne z admin konfigurace | Zmena cen vyzaduje editaci kodu |
| **Zadny API** | Stranka nema napojeni na pricing engine ani backend | Neni mozne dynamicky menit plany |
| **"Recommended" badge — anglicky** | Text "Recommended" v `ForgePricingCard.jsx:41` je hardcoded anglicky | V ceske verzi se zobrazi anglicky text |
| **FAQ accordion — single open** | Kazda FAQ polozka ma vlastni `isOpen` stav — neni implementovano "jen jeden otevreny" chovani | Vice otazek muze byt otevrenych soucasne (muze byt zamerne) |

### 17.2 Technicke

| Omezeni | Popis | Dopad |
|---------|-------|-------|
| **Dead import (ForgeSquiggle)** | Importovano na radku 4 ale nepouzito v JSX | Zbytecny kod v bundlu (minimalni dopad) |
| **Hardcoded texty** | Vetsina textu pouziva ternary `language === 'cs'` misto prekladoveho systemu `t()` | Obtiznejsi udrzba prekladu, nesjednoceny pristup |
| **Inline styles** | Velke mnozstvi inline stylu misto CSS trid | Horsi cacheovatelnost, opakovani kodu |
| **FAQ max-height 500px** | Fixni maximalni vyska pro accordion obsah | Delsi odpovedi by byly oriznuty |
| **Hover efekty pres JS** | ForgeButton a ForgeFaqAccordion pouzivaji `onMouseEnter/onMouseLeave` pro hover | Nefunguje na touch zarizeni, nelze stylovat pres CSS pseudo-class |

### 17.3 Design

| Omezeni | Popis |
|---------|-------|
| `forge-mono-bold` definovana 2x | V `forge-typography.css:90` i `forge-utilities.css:118` — duplicitni definice |
| Pricing nema trial/free tier | CTA texty "Zacit zdarma" nemaji odpovidajici free plan v seznamu |
| Enterprise nema konkrektni cenu | "Na miru" / "Custom" — zadna cenova indikace |
