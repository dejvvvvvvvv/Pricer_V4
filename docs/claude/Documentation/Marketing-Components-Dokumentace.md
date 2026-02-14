# Marketing Components -- Dokumentace

> 24 marketing komponent: Accordion, FaqTabs, GlobalMap, GlossaryTerm, ImageReveal, ImageRipple,
> InteractiveWorldMap, LogoMarquee, MeshGradient, MotionNumber, PricingPlanCard, Reveal, Sparkles,
> SpotlightCard, SupportHoverCards, Tabs + Forge varianty (ForgeFaqAccordion, ForgeHeroUnderline,
> ForgePricingCard, ForgePrinterSVG, ForgeSquiggle, ForgeSectionLabel, ForgeNumberedCard, ForgeStatCard).

---

## 1. Prehled

Marketing komponenty jsou vizualni stavebni bloky pouzivane na verejnych strankach
(Home `/`, Pricing `/pricing`, Support `/support`). Zahrnuji dve skupiny:

1. **`src/components/marketing/`** (16 souboru) -- obecne, Tailwind-based komponenty.
2. **`src/components/ui/forge/Forge*.jsx`** (8 marketing-relevantnich souboru) -- Forge design
   system varianty pouzivane primo na public strankach. Pouzivaji CSS custom properties
   (`--forge-*`) misto Tailwind trid.

Obecna zasada: marketing komponenty jsou **prezentacni** (stateless nebo s minimalnim localnim
stavem). Nepristupuji k tenant storage ani pricing engine. Data prijimaji pres props nebo
pres `useLanguage()` z LanguageContext.

### Co NEPATRI do marketing komponent

- Base UI primitivy (`Button`, `Input`, `ForgeButton`, `ForgeCard` atd.)
- Admin-only komponenty
- Kalkulacka/upload flow komponenty

---

## 2. Technologie

| Technologie       | Verze    | Pouziti                                      |
|-------------------|----------|----------------------------------------------|
| React             | 19       | JSX, hooks (useState, useId, useMemo, useRef, useEffect) |
| framer-motion     | latest   | AnimatePresence, motion, useInView, useMotionValue, animate |
| react-router-dom  | v6+      | Link (v PricingPlanCard, SupportHoverCards)   |
| Tailwind CSS      | 3.x      | Utility tridy v marketing/ komponentach       |
| CSS Custom Props  | --       | `--forge-*` tokeny v Forge komponentach       |
| cn() utility      | --       | `src/utils/cn.js` (clsx + twMerge)            |
| AppIcon           | --       | Lucide-based icon wrapper (`src/components/AppIcon.jsx`) |

### Zavislostni poznamka

- **framer-motion** je pouzivan v 9 z 16 marketing komponent a ve 0 z 8 Forge marketing
  komponent (Forge preferuje ciste CSS animace).
- **Tooltip** z `src/components/ui/tooltip.jsx` je pouzivan pouze v `GlossaryTerm`.

---

## 3. Architektura souboru

```
src/components/
  marketing/                         # 16 souboru
    Accordion.jsx                    # FAQ rozbalovaci panel (single-open)
    FaqTabs.jsx                      # FAQ s kategoriemi (Tabs + Accordion)
    GlobalMap.jsx                    # Staticka SVG mapa s mesty (CSS hover)
    GlobalMap.css                    # Styly pro GlobalMap
    GlossaryTerm.jsx                # Inline tooltip pro FAQ termin
    ImageReveal.jsx                  # Before/after slider
    ImageRipple.jsx                  # Hover radial glow efekt na obrazku
    InteractiveWorldMap.jsx          # Interaktivni mapa s piny (framer-motion)
    LogoMarquee.jsx                  # Nekonecny horizontalni scroll
    MeshGradient.jsx                 # Animovane pozadi (blob gradient)
    MotionNumber.jsx                 # Animovane cislo pri vstupu do viewportu
    PricingPlanCard.jsx              # Cenova karta (Tailwind varianta)
    Reveal.jsx                       # Scroll-in fade+translate wrapper
    Sparkles.jsx                     # Dekorativni jiskry overlay
    SpotlightCard.jsx                # Karta s radialnim glow na hover
    SupportHoverCards.jsx            # Grid support odkazu s ikonami
    Tabs.jsx                         # Pristupne taby (keyboard navigace)

  ui/forge/                          # Forge varianty pouzivane na public strankach
    ForgeFaqAccordion.jsx            # FAQ accordion (Forge theme, CSS animace)
    ForgeHeroUnderline.jsx           # Animovany SVG podtrzeni pro hero
    ForgePricingCard.jsx             # Cenova karta (Forge token theme)
    ForgePrinterSVG.jsx              # Animovana izometricka 3D tiskarna
    ForgeSquiggle.jsx                # Dekorativni vlnovka SVG
    ForgeSectionLabel.jsx            # Uppercase label sekce (tech font)
    ForgeNumberedCard.jsx            # Cislovana feature karta
    ForgeStatCard.jsx                # Stat karta s delta badge
```

---

## 4. Import graf

### Pouziti na public strankach

```
Home (src/pages/home/index.jsx)
  +-- Reveal                    (marketing)
  +-- ForgeSquiggle              (forge)
  +-- ForgeHeroUnderline         (forge)
  +-- ForgePrinterSVG            (forge)
  +-- ForgeNumberedCard          (forge)
  +-- ForgeSectionLabel          (forge)
  +-- ForgePricingCard           (forge)
  +-- ForgeFaqAccordion          (forge)
  +-- ForgeStatusIndicator       (forge, base UI)

Pricing (src/pages/pricing/index.jsx)
  +-- Reveal                    (marketing)
  +-- ForgeSquiggle              (forge) **[POZOR: importovan ale nepouzit v JSX]**
  +-- ForgeSectionLabel          (forge)
  +-- ForgePricingCard           (forge)
  +-- ForgeFaqAccordion          (forge)

Support (src/pages/support/index.jsx)
  +-- Reveal                    (marketing)
  +-- ForgeSquiggle              (forge)
  +-- ForgeSectionLabel          (forge)
  +-- ForgeFaqAccordion          (forge)
```

### Interni zavislosti marketing komponent

```
FaqTabs
  +-- Accordion
  +-- Tabs
  +-- GlossaryTerm

Accordion --> AppIcon, cn()
GlossaryTerm --> AppIcon, cn(), Tooltip (ui)
PricingPlanCard --> AppIcon, Button (ui), cn()
SupportHoverCards --> AppIcon, Button (ui), cn()

ForgePricingCard --> ForgeButton (forge base)
```

### Aktualne nepouzite marketing komponenty (na public strankach)

Nasledujici komponenty z `src/components/marketing/` nejsou aktualne importovany
na zadne public strance (`home`, `pricing`, `support`):

- `FaqTabs` -- puvodni Tailwind FAQ system, nahrazen `ForgeFaqAccordion`
- `GlobalMap` + `GlobalMap.css` -- staticka SVG mapa
- `GlossaryTerm` -- pouze interni import v `FaqTabs`
- `ImageReveal` -- before/after slider
- `ImageRipple` -- hover glow efekt
- `InteractiveWorldMap` -- interaktivni mapa s piny
- `LogoMarquee` -- marquee scroll
- `MeshGradient` -- animovane pozadi
- `MotionNumber` -- animovane cislo
- `PricingPlanCard` -- Tailwind cenova karta (nahrazena `ForgePricingCard`)
- `Sparkles` -- jiskry overlay
- `SpotlightCard` -- spotlight hover efekt
- `SupportHoverCards` -- support grid
- `Tabs` -- pouze interni import v `FaqTabs`

**Pouzivane komponenty:** `Reveal` (vsechny 3 stranky) + 7 Forge komponent (viz import graf vyse).

---

## 5. Design (animace, vizualni efekty)

### 5.1 Animacni systemy

Projekt pouziva **dva oddelene animacni systemy**:

#### A) framer-motion animace (marketing/ komponenty)

| Komponenta        | Typ animace                        | Trigger           |
|-------------------|------------------------------------|--------------------|
| Accordion         | height + opacity (AnimatePresence) | Click (open/close) |
| InteractiveWorldMap | opacity + y + scale (tooltip)    | Hover              |
| MeshGradient      | x/y pohyb blobu                    | Infinite loop      |
| MotionNumber      | numericka animace 0 -> value       | IntersectionObserver (once) |
| PricingPlanCard   | whileHover y:-4                    | Hover              |
| Reveal            | opacity + y (whileInView)          | Scroll into view (once) |
| SupportHoverCards | whileHover y:-2, whileTap scale    | Hover/tap          |

#### B) CSS animace (Forge komponenty + tailwind.css)

| Animace                     | Soubor                  | Delka cyklu | Popis                          |
|-----------------------------|-------------------------|-------------|--------------------------------|
| `forge-breathe`             | forge-animations.css    | 3s          | Subtle scale + opacity pulse   |
| `forge-pulse-dot`           | forge-animations.css    | 2s          | Status indicator blink         |
| `forge-hot-glow`            | forge-animations.css    | 2s          | Nozzle glow pulsace            |
| `forge-underline-draw`      | forge-animations.css    | 700ms       | SVG stroke draw-in (3 vrstvy)  |
| `forge-spiral-flow`         | forge-animations.css    | 1.8s        | Filament tok animace           |
| `forge-spiral-fade`         | forge-animations.css    | 18s         | Filament viditelnost v cyklu   |
| `forge-display-printing`    | forge-animations.css    | 18s         | LCD "PRINTING" text cyklus     |
| `forge-display-ready`       | forge-animations.css    | 18s         | LCD "READY" text cyklus        |
| `forge-teal-aura`           | forge-animations.css    | 18s         | Teal glow za tiskovymi vrstvami |
| `fp-layer-{0..7}`           | ForgePrinterSVG.jsx     | 18s         | Inline keyframes pro 8 vrstev  |
| `mpSparkle`                 | tailwind.css            | variabilni  | Scale + opacity jiskra         |
| `mpMarquee`                 | tailwind.css            | 18s         | Horizontalni scroll            |

### 5.2 Vizualni efekty

| Efekt               | Komponenta       | Technika                                        |
|----------------------|------------------|-------------------------------------------------|
| Cursor spotlight     | SpotlightCard    | radial-gradient sledujici kurzor (onMouseMove)   |
| Cursor ripple        | ImageRipple      | radial-gradient s bily overlay (onMouseMove)     |
| Before/after slider  | ImageReveal      | input[range] nad dvema vrstvami obsahu           |
| Mesh gradient        | MeshGradient     | 4 animovane blur bloby + vignette gradient       |
| Sparkle particles    | Sparkles         | CSS animace na nahodnych pozicich                |
| Infinite scroll      | LogoMarquee      | Zdvojeny obsah + CSS translateX(-50%)            |
| SVG draw-in          | ForgeHeroUnderline | stroke-dasharray/dashoffset animace (3 vrstvy)  |
| Isometric 3D print   | ForgePrinterSVG  | 18s cyklus: build vrstev -> "READY" -> fade      |
| SVG roughen filter   | ForgeSquiggle    | feTurbulence + feDisplacementMap na SVG stroke   |
| Hover pin tooltip    | GlobalMap        | CSS :hover display toggle + fadein keyframes     |
| Motion pin tooltip   | InteractiveWorldMap | framer-motion AnimatePresence na hover        |
| Animated numbers     | MotionNumber     | framer-motion animate() na useMotionValue        |

### 5.3 ForgePrinterSVG -- detailni animacni cyklus (18s)

```
0s ........... 0.5s    1.2s    1.9s  ..................... 15s    16s    18s
|              |       |       |                           |      |      |
| IDLE         | Layer 1| L2   | L3 ... L8                | READY| FADE | LOOP
|              |       |       |  LCD: "PRINTING"          | LCD: "READY"|
|              |       |       |  Spiral filament visible   |      |      |
|              |       |       |  Teal aura growing         |      |      |
```

Klicove body:
- 8 vrstev s cube-bezier bounce efektem (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- Kazda vrstva ma unikatni inline `@keyframes` generovane v JSX
- Procentualni labely (10%-80%) se zobrazuji vedle vrstev
- LCD displej prepina mezi "PRINTING" a "READY"
- Nozzle glow (`forge-hot-glow`) je neustale aktivni

---

## 8. Komponenty -- tabulka

### 8.1 Marketing komponenty (`src/components/marketing/`)

| # | Komponenta | Popis | Props |
|---|-----------|-------|-------|
| 1 | **Accordion** | Single-open FAQ accordion s framer-motion animaci | `items: [{id, title, content}]`, `defaultOpenId?`, `className?`, `itemClassName?` |
| 2 | **FaqTabs** | FAQ seskupene do kategorii (Tabs + Accordion), podpora glossare | `categories: [{id, label, items}]`, `defaultCategoryId?`, `glossary?`, `className?`, `tabsAriaLabel?`, `showCategoryMeta?` |
| 3 | **GlobalMap** | Staticka SVG mapa sveta s mesty (CSS hover tooltip) | zadne props |
| 4 | **GlossaryTerm** | Inline termin s tooltip vysvetlenim | `termKey`, `glossary`, `className?`, `showIcon?` |
| 5 | **ImageReveal** | Before/after reveal slider (16:9 aspect ratio) | `before` (ReactNode), `after` (ReactNode), `className?`, `initial?` (0-1, default 0.55) |
| 6 | **ImageRipple** | Hover radial glow overlay nad libovolnym obsahem | `className?`, `children` |
| 7 | **InteractiveWorldMap** | Interaktivni mapa s 9 animovanymi piny | zadne props (lokace hardcoded) |
| 8 | **LogoMarquee** | Nekonecny horizontalni scroll s labely | `items: string[]`, `className?` |
| 9 | **MeshGradient** | Dekorativni animovane pozadi (4 blur bloby) | zadne props |
| 10 | **MotionNumber** | Cislo animovane od 0 do `value` pri scrollu do view | `value`, `decimals?`, `duration?`, `delay?`, `prefix?`, `suffix?`, `className?`, `format?` |
| 11 | **PricingPlanCard** | Cenova karta s features a CTA | `name`, `description`, `price`, `currency`, `period`, `features: string[]`, `highlighted?`, `badgeText?`, `ctaText`, `ctaTo?`, `className?` |
| 12 | **Reveal** | Scroll-in fade+translate animation wrapper | `children`, `delay?`, `className?` |
| 13 | **Sparkles** | Dekorativni jiskry overlay (CSS animace) | `className?`, `count?` (default 8) |
| 14 | **SpotlightCard** | Karta s radialnim cursor-following glow | `className?`, `children` |
| 15 | **SupportHoverCards** | Grid 2x2 support odkazu (docs, video, chat, email) | `language` ("cs"/"en"), `className?` |
| 16 | **Tabs** | Pristupny tablist s keyboard navigaci | `tabs: [{id, label}]`, `value`, `onValueChange`, `ariaLabel?`, `className?`, `tabClassName?` |

### 8.2 Forge marketing komponenty (`src/components/ui/forge/`)

| # | Komponenta | Popis | Props |
|---|-----------|-------|-------|
| 17 | **ForgeFaqAccordion** | FAQ accordion s Forge theme (CSS max-height animace) | `items: [{question/q/title, answer/a/content, id?}]`, `className?` |
| 18 | **ForgeHeroUnderline** | Animovany trojvrstvovy SVG podtrzeni | `className?` |
| 19 | **ForgePricingCard** | Cenova karta s Forge tokeny a glow efektem | `name`, `price`, `period`, `features: string[]`, `ctaText`, `ctaTo?`, `recommended?`, `className?` |
| 20 | **ForgePrinterSVG** | Izometricka 3D tiskarna s 18s animacnim cyklem | `className?` |
| 21 | **ForgeSquiggle** | Dekorativni vlnovka s SVG roughen filtrem | `className?`, `color?` (CSS value, default `--forge-accent-primary`) |
| 22 | **ForgeSectionLabel** | Uppercase section marker v tech fontu | `text`, `className?` |
| 23 | **ForgeNumberedCard** | Feature karta s monospace cislovanim a hover sipkou | `number`, `icon?` (ReactNode), `title`, `description`, `className?` |
| 24 | **ForgeStatCard** | Stat karta s colored border, delta badge a sloty | `label`, `value`, `delta?`, `deltaType?`, `accentColor?`, `children?` |

---

## 11. Preklady (i18n)

### Soucasny stav

Marketing komponenty **nepouzivaji** `useLanguage()` primo. Namisto toho:

1. **Stranky** (`home/index.jsx`, `pricing/index.jsx`, `support/index.jsx`) volaji
   `const { t, language } = useLanguage()` a predavaji prelozene texty jako props.
2. **SupportHoverCards** -- jedina marketing komponenta ktera resi jazyk, prijima `language`
   prop a ma dve inline sady textu (CS/EN). **Nepouziva `useLanguage()`** ani prekladove
   klice -- texty jsou hardcoded primo v komponente.
3. **ForgePricingCard** -- badge text "Recommended" je hardcoded anglicky.
4. **InteractiveWorldMap** -- tooltip texty "users" jsou anglicky.
5. **GlobalMap** -- nazvy mest (New York, London, Prague...) jsou v anglictine.

### Problematicke oblasti

| Komponenta          | Problem                                              | Dopad    |
|---------------------|------------------------------------------------------|----------|
| SupportHoverCards   | Inline CS/EN texty misto `useLanguage()` + klice     | Stredni  |
| ForgePricingCard    | "Recommended" hardcoded                              | Nizky    |
| InteractiveWorldMap | "users" label hardcoded EN                           | Nizky    |
| GlobalMap           | Mesto labely bez prekladu                             | Zanedatelny |
| ForgeFaqAccordion   | Neprijima jazyk -- texty musi prijit v props          | OK (by design) |

### Doporuceni

- Vsechny texty v marketing komponentach by mely prichazet **pres props** (ne pres
  interni `useLanguage()`). Komponenty zustanou jazykove agnosticke.
- Vyjimka: `SupportHoverCards` by se mela refaktorovat tak, aby texty prichazely
  jako props (pole karet) namisto interniho CS/EN switche.

---

## 12. Pristupnost

### Co je implementovano dobre

| Komponenta     | A11y feature                                                |
|----------------|-------------------------------------------------------------|
| Accordion      | `aria-expanded`, `aria-controls`, `role="region"`, `aria-labelledby`, `useId()` pro unikatni ID |
| Tabs           | `role="tablist"`, `role="tab"`, `aria-selected`, `tabIndex` roving, `ArrowLeft/Right/Home/End` keyboard |
| ForgeFaqAccordion | `aria-expanded` na tlacitku                              |
| ImageReveal    | `<label>` pro range input, `sr-only` class, `useId()`      |
| Sparkles       | `aria-hidden` na kontejneru                                 |
| MeshGradient   | `aria-hidden` na kontejneru                                 |
| SpotlightCard  | `aria-hidden` na glow overlay                               |
| ImageRipple    | `aria-hidden` na overlay i border glow                      |
| ForgeHeroUnderline | `aria-hidden="true"` na SVG                             |
| ForgeSquiggle  | `aria-hidden="true"` na SVG                                 |
| ForgePrinterSVG | `aria-hidden="true"` na SVG                                |
| GlossaryTerm   | focus-visible ring, keyboard accessible button              |
| InteractiveWorldMap | `aria-label` na pin buttonech                           |

### Chybejici nebo nedostatecne

| Komponenta          | Nedostatek                                            | Priorita |
|---------------------|-------------------------------------------------------|----------|
| ForgeFaqAccordion   | Chybi `aria-controls`, `role="region"`, unikatni ID   | P1       |
| ForgeFaqAccordion   | Chybi keyboard podpora (Enter/Space funguje nativne, ale ArrowUp/Down ne) | P2 |
| InteractiveWorldMap | Pin buttony nemaji viditelny focus ring                | P1       |
| InteractiveWorldMap | Tooltip se nezobrazi pri keyboard focus (jen hover)    | P1       |
| GlobalMap           | Mesta nemaji keyboard pristup (div, ne button)         | P2       |
| GlobalMap           | Chybi `aria-label` na SVG mape                        | P2       |
| LogoMarquee         | Chybi `aria-hidden` (dekorativni obsah, neprenasi info) | P2     |
| PricingPlanCard     | Feature list pouziva index jako key (nestabilni)       | P2       |
| SupportHoverCards   | OK (link/button focus funguje)                         | --       |

### prefers-reduced-motion

- **forge-animations.css**: Vsechny forge animace jsou disablovany v `@media (prefers-reduced-motion: reduce)`. ForgePrinterSVG ma selector `svg[viewBox="0 0 480 450"] * { animation: none !important; }`.
- **tailwind.css**: `mp-sparkle` a `mp-marquee` jsou disablovany.
- **framer-motion**: Neni explicitne osetreno -- framer-motion automaticky respektuje `prefers-reduced-motion` (od verze 6+) pokud neni overridnuto.

---

## 13. Performance (animace, lazy loading)

### Animacni zatez

| Riziko | Komponenta          | Pricina                                            |
|--------|---------------------|----------------------------------------------------|
| VYSOKE | ForgePrinterSVG     | 8 inline keyframes, 6+ soubeznych CSS animaci, SVG redraw |
| STREDNI | MeshGradient       | 4 animovane blur bloby (GPU compositing)            |
| STREDNI | InteractiveWorldMap | 9 ping animaci + AnimatePresence tooltipy           |
| NIZKE  | Reveal              | IntersectionObserver, `once: true` (jedno spusteni) |
| NIZKE  | MotionNumber        | Jedno spusteni pri vstupu do viewportu              |
| NIZKE  | Accordion           | AnimatePresence jen pri interakci                   |

### Doporuceni pro optimalizaci

1. **ForgePrinterSVG** -- zvazit `will-change: transform, opacity` na layer groups,
   nebo prehodit na requestAnimationFrame pro plynulejsi 18s cyklus.
2. **MeshGradient** -- blur bloby jsou GPU-narocne. Na slabsich zarizeni muze
   zpusobit jank. Zvazit `will-change: transform` nebo `contain: paint`.
3. **ImageRipple / SpotlightCard** -- `onMouseMove` updatuje state pri kazdem pohybu
   mysi. Na mobilech neni problem (neni mousemove), ale na desktopu muze byt 60+
   setState/s. Zvazit throttle nebo `useRef` + CSS custom property.
4. **LogoMarquee** -- pouziva `will-change: transform` (spravne).
5. **Sparkles** -- `useMemo` na nahodne pozice, zadny re-render po mountu.

### Lazy loading

- **Zadna** z marketing komponent neni lazy-loaded. Vsechny se importuji staticky
  na urovni stranky.
- **Doporuceni:** Pro `ForgePrinterSVG` (nejvetsi SVG, 279 radku JSX) a
  `InteractiveWorldMap` (121 radku) zvazit `React.lazy()` + `Suspense` s fallbackem.

---

## 17. Zname omezeni

### 17.1 Duplikace: Accordion vs ForgeFaqAccordion

Existuji dve verze FAQ accordion:
- `marketing/Accordion` -- Tailwind, framer-motion, plna accessibility
- `forge/ForgeFaqAccordion` -- Forge tokeny, CSS max-height, castecna accessibility

**Aktualne pouzivana:** ForgeFaqAccordion (na vsech 3 public strankach).
**Problem:** ForgeFaqAccordion ma horsi accessibility (chybi `aria-controls`, `role="region"`).
Bylo by idealni spojit logiku z `Accordion` do Forge verze.

### 17.2 Duplikace: PricingPlanCard vs ForgePricingCard

Dve verze cenove karty:
- `marketing/PricingPlanCard` -- Tailwind, vice props (currency, description, badgeText)
- `forge/ForgePricingCard` -- Forge tokeny, mene props, hardcoded "Recommended"

**Aktualne pouzivana:** ForgePricingCard. PricingPlanCard je dead code.

### 17.3 Duplikace: FaqTabs (neaktivni) vs primo ForgeFaqAccordion

`FaqTabs` kompozitne pouziva `Accordion`, `Tabs` a `GlossaryTerm`, ale neni
importovan na zadne strance. Byl nahrazen primym volanim `ForgeFaqAccordion`.

### 17.4 GlobalMap vs InteractiveWorldMap

Dve verze mapy sveta:
- `GlobalMap` -- staticka, CSS hover, jednoduche SVG kontury, 6 mest
- `InteractiveWorldMap` -- interaktivni piny, framer-motion tooltipy, 9 lokaci, detailnejsi mapa

Ani jedna neni aktualne pouzivana na public strankach.

### 17.5 Nepouzite marketing komponenty

Z 16 souboru v `src/components/marketing/` je na verejnych strankach pouzivana
**pouze 1 komponenta** (`Reveal`). Zbylych 15 jsou bud:
- Nahrazene Forge variantami (Accordion, PricingPlanCard, Tabs)
- Dosud neintegrovane (GlobalMap, InteractiveWorldMap, MeshGradient, Sparkles, atd.)
- Interni helpery (GlossaryTerm, Tabs -- pouzivane jen v FaqTabs)

### 17.6 ForgePrinterSVG inline keyframes

ForgePrinterSVG generuje 8 `@keyframes` bloku primo v `<style>` elementu uvnitr SVG.
Pokud by se na strance vyskytlo vice instanci teto komponenty, doslo by ke kolizi
nazvu keyframes (`fp-layer-0` az `fp-layer-7` jsou globalni).

### 17.7 Hardcoded lokace v InteractiveWorldMap

Pole `locations` (9 mest s koordinaty, poctem uzivatelu a vlajkami) je hardcoded
primo v souboru. Neni konfigurovatelne pres props ani tenant storage.

### 17.8 SupportHoverCards -- inline prelozene texty

Komponenta obsahuje dva plne sady textu (CS/EN) jako lokalni pole. Pri pridani
dalsiho jazyka by bylo nutne rozsirit switch uvnitr komponenty. Spravne by mela
prijimat texty jako props.

### 17.9 ForgeSquiggle -- globalni SVG filter ID

SVG filter `id="squiggle-roughen"` je globalni. Vice instanci ForgeSquiggle
na jedne strance by sdilelo stejny filter (coz aktualne neni problem, ale mohlo
by byt v budoucnu).

### 17.10 Dead import na Pricing strance

`src/pages/pricing/index.jsx` radek 4: `import ForgeSquiggle from '...'` --
komponenta je importovana ale nikde v JSX nepouzita. Viz Design-Error_LOG.

---

## Soubory zahrnuty v teto dokumentaci

Kompletni seznam vsech analyzovanych souboru (absolutni cesty):

**Marketing komponenty:**
- `Model_Pricer-V2-main/src/components/marketing/Accordion.jsx`
- `Model_Pricer-V2-main/src/components/marketing/FaqTabs.jsx`
- `Model_Pricer-V2-main/src/components/marketing/GlobalMap.jsx`
- `Model_Pricer-V2-main/src/components/marketing/GlobalMap.css`
- `Model_Pricer-V2-main/src/components/marketing/GlossaryTerm.jsx`
- `Model_Pricer-V2-main/src/components/marketing/ImageReveal.jsx`
- `Model_Pricer-V2-main/src/components/marketing/ImageRipple.jsx`
- `Model_Pricer-V2-main/src/components/marketing/InteractiveWorldMap.jsx`
- `Model_Pricer-V2-main/src/components/marketing/LogoMarquee.jsx`
- `Model_Pricer-V2-main/src/components/marketing/MeshGradient.jsx`
- `Model_Pricer-V2-main/src/components/marketing/MotionNumber.jsx`
- `Model_Pricer-V2-main/src/components/marketing/PricingPlanCard.jsx`
- `Model_Pricer-V2-main/src/components/marketing/Reveal.jsx`
- `Model_Pricer-V2-main/src/components/marketing/Sparkles.jsx`
- `Model_Pricer-V2-main/src/components/marketing/SpotlightCard.jsx`
- `Model_Pricer-V2-main/src/components/marketing/SupportHoverCards.jsx`
- `Model_Pricer-V2-main/src/components/marketing/Tabs.jsx`

**Forge marketing komponenty:**
- `Model_Pricer-V2-main/src/components/ui/forge/ForgeFaqAccordion.jsx`
- `Model_Pricer-V2-main/src/components/ui/forge/ForgeHeroUnderline.jsx`
- `Model_Pricer-V2-main/src/components/ui/forge/ForgePricingCard.jsx`
- `Model_Pricer-V2-main/src/components/ui/forge/ForgePrinterSVG.jsx`
- `Model_Pricer-V2-main/src/components/ui/forge/ForgeSquiggle.jsx`
- `Model_Pricer-V2-main/src/components/ui/forge/ForgeSectionLabel.jsx`
- `Model_Pricer-V2-main/src/components/ui/forge/ForgeNumberedCard.jsx`
- `Model_Pricer-V2-main/src/components/ui/forge/ForgeStatCard.jsx`

**CSS animace:**
- `Model_Pricer-V2-main/src/styles/forge-animations.css`
- `Model_Pricer-V2-main/src/styles/tailwind.css` (radky 211-243)

**Stranky (konzumenti):**
- `Model_Pricer-V2-main/src/pages/home/index.jsx`
- `Model_Pricer-V2-main/src/pages/pricing/index.jsx`
- `Model_Pricer-V2-main/src/pages/support/index.jsx`
