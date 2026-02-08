# Design Preview Prompts — ModelPricer V3 Homepage

> **Ucel:** Tri komplexni prompty pro generovani vizualnich nahledu (mockupu) Home stranky.
> **Pouziti:** Vlozit prompt do AI image generatoru (Midjourney, DALL-E 3, Ideogram, Flux apod.)
> **Datum:** 2026-02-08

---

## Spolecny kontext pro vsechny tri varianty

**Co je ModelPricer:** SaaS webova aplikace pro automatickou kalkulaci cen 3D tisku. Uzivatele nahravaji 3D modely (STL/OBJ/3MF), nastavi material a parametry tisku, a dostanou okamzitou cenovou nabidku. Aplikace ma verejny web (landing page, kalkulacka, pricing), admin panel (sprava cen, objednavek) a embeddable widget pro e-shopy.

**Homepage struktura (spolecna vsem variantam):**
1. Navigation bar (logo "ModelPricer" + menu linky: Home, Demo, Pricing, Support + CTA button)
2. Hero sekce (hlavni nadpis + podnadpis + CTA button + vizualni prvek)
3. Features sekce (3-4 feature karty s ikonami)
4. How it works / Social proof sekce
5. Pricing sekce (3 cenove plany)
6. Footer

**Spolecna pravidla:**
- TMAVY theme (tmave pozadi, svetly text) — NE svetly/bily web
- Monospace font pro technicke udaje (ceny, rozmery)
- 3D tiskova tematika (tryska, filament, vrstvy, tiskarny)
- Moderni, profesionalni, NE genericke AI vypadani
- Desktop viewport (1440x900 nebo 1920x1080)
- Web screenshot styl — realisticky UI mockup, ne ilustrace

---

## PROMPT 1: Varianta "PREMIUM" (Design Studio)

```
Create a highly detailed, pixel-perfect UI design mockup screenshot of a dark-themed SaaS landing page for "ModelPricer" — a 3D printing pricing calculator web application. This is the "PREMIUM / Design Studio" variant inspired by Apple product pages, Linear app, Vercel dashboard, and Raycast. Desktop viewport 1440x900.

OVERALL AESTHETIC: Elegant, minimalistic, sophisticated, high-end design studio feel. Very generous whitespace and padding. Refined and calm — the opposite of cluttered or busy. Think luxury brand meets developer tool. NO generic AI-generated website look — this must feel hand-crafted and distinctive.

COLOR PALETTE (exact values, strictly follow):
- Page background: #09090B (near-black, neutral zinc-950 tone, NO blue tint)
- Card surfaces: #18181B (zinc-900, slightly lighter than background)
- Elevated elements: #27272A (zinc-800)
- Primary accent: #F59E0B (warm amber/gold — used for CTA buttons, highlights, active states)
- Secondary accent: #8B5CF6 (cool violet/purple — used sparingly for badges, secondary highlights)
- Primary text: #FAFAFA (zinc-50, near-white)
- Secondary text: #A1A1AA (zinc-400, muted gray)
- Muted text: #71717A (zinc-500, very subdued)
- Success indicators: #22C55E (green)

TYPOGRAPHY (critical differentiator — NO sans-serif headings):
- ALL headings (h1, h2, section titles): Serif font similar to "Instrument Serif" — elegant, thin, roman weight 400. This is the KEY anti-AI differentiator. Serif headings on a dark tech website are extremely rare and distinctive.
- Body text, labels, descriptions: Clean geometric sans-serif similar to "Satoshi" or "General Sans" (weight 400-500, NOT Inter, NOT system font)
- Technical values (prices, dimensions): Monospace font similar to "Geist Mono" — used for "$49/mo", "192,48 Kc", dimensions etc.

NAVIGATION BAR (top, 64px height):
- Background: #09090B (same as page, no visible border, subtle separation through spacing)
- Left: Logo mark (small abstract geometric icon, amber colored) + "ModelPricer" in sans-serif weight 600, #FAFAFA, 16px
- Center/Right: Navigation links "Home", "Demo", "Pricing", "Support" in sans-serif 14px, #A1A1AA, generous 32px gaps between items
- Far right: "Get started" button — amber (#F59E0B) background, dark text (#09090B), 12px border-radius, 40px height, subtle amber glow shadow (0 0 24px rgba(245,158,11,0.15))

HERO SECTION (centered layout, generous vertical spacing):
- Layout: CENTERED — everything centered horizontally, stacked vertically. NOT a two-column split layout.
- Top padding: 120px from navigation (lots of breathing room)
- Headline: SERIF FONT, 48px, weight 400, #FAFAFA, centered, max-width 600px. Text reads: "Precision pricing for 3D printing." — elegant, calm, single line or two lines max
- Subheadline: Sans-serif 18px, #71717A (muted), centered, max-width 480px, line-height 1.6. Text reads: "Automate your quotes with accuracy down to the cent."
- CTA button: Centered below subheadline, 40px margin-top. Amber (#F59E0B) background, dark text, 52px height (large), 12px radius, text "Get started" in sans-serif 500. The button has a subtle pulsing amber glow effect (breathing animation shadow).
- Below CTA: Small 3D model visualization (approximately 280x280px), centered, showing a simple geometric 3D printed object (like a small gear or bracket) rendered in silver/gray tones (#A1A1AA) on the dark background, with subtle ambient lighting. Gentle slow rotation feel.
- Bottom padding: 72px
- Background effect: Very subtle radial gradient emanating from top-center — from #27272A to #09090B, creating a soft ambient light behind the hero text. NO harsh gradients, NO colorful blobs.

FEATURES SECTION (below hero):
- Section title: Serif font, 32px, #FAFAFA, centered: "Why ModelPricer"
- Layout: 2x2 grid of cards, max-width 800px, centered, 20px gap
- Each card: Background #18181B, NO visible border, 16px border-radius, 32px padding, subtle shadow (0 2px 8px rgba(0,0,0,0.3))
- Card hover state (show one card slightly elevated): translateY(-2px), deeper shadow
- Card icon: 24px, amber (#F59E0B) colored, inside a 36px circle with rgba(245,158,11,0.10) background
- Card title: Sans-serif 500, 18px, #FAFAFA
- Card description: Sans-serif 400, 14px, #71717A, 2-3 lines
- Feature topics: "Instant Pricing", "Widget Embed", "Multi-Format Upload", "Volume Discounts"
- Stagger animation feel — cards slightly offset as if appearing one by one

HOW IT WORKS SECTION:
- 3 steps arranged horizontally
- Large serif italic numerals "1", "2", "3" in amber (#F59E0B) at 15-20% opacity as background decoration behind each step
- Step title: Sans-serif 500, 20px, #FAFAFA
- Step description: Sans-serif 400, 14px, #71717A
- Thin horizontal connecting line between steps: #27272A, 1px
- Steps: "Upload your model" → "Configure parameters" → "Get instant quote"

PRICING SECTION:
- 3 pricing cards side by side
- Middle card is "featured" — has a thin amber (#F59E0B) top border and a small amber pill badge "Recommended"
- Prices in monospace font: "$0", "$49", "$199" — large (36px), #FAFAFA
- Monthly/yearly toggle: Pill-shaped toggle with amber active indicator
- Feature list: Small green (#22C55E) checkmarks, sans-serif 14px #A1A1AA
- Cards: #18181B background, 16px radius, no border (except featured), shadow level 1

FOOTER:
- Minimal, #09090B background, thin #27272A top border
- Logo + copyright left, navigation links right, all in #71717A, 13px

CRITICAL ANTI-AI REQUIREMENTS:
- Serif headings are MANDATORY — this is what makes it NOT look AI-generated
- Very generous whitespace everywhere — premium feel
- NO blue (#2563EB) anywhere — amber and violet only
- NO symmetric/grid perfection — slight asymmetries in spacing feel intentional
- Cards have NO visible borders, only shadows — soft, premium feel
- Overall mood: calm, confident, luxurious, like browsing an Apple product page at night

Render as: A realistic high-fidelity web browser screenshot, desktop viewport, Chrome or Safari frame optional. Photorealistic UI mockup quality. Dark theme throughout.
```

---

## PROMPT 2: Varianta "FORGE" (Industrial / Technical)

```
Create a highly detailed, pixel-perfect UI design mockup screenshot of a dark-themed SaaS landing page for "ModelPricer" — a 3D printing pricing calculator web application. This is the "FORGE / Industrial" variant inspired by SpaceX mission control, PrusaSlicer UI, engineering blueprint software, and terminal/CLI interfaces. Desktop viewport 1440x900.

OVERALL AESTHETIC: Technical, precise, industrial, like a cockpit control panel or a factory monitoring dashboard. Think command center meets engineering workstation. Strong 3D printing industry identity. Blueprint-style backgrounds, monospace technical labels, thin 1px borders, UPPERCASE micro-labels. The design should feel like operating professional machinery — NOT a generic marketing website. NO generic AI look.

COLOR PALETTE (exact values, strictly follow):
- Page background: #08090C (near-black with very slight cool/blue undertone — like looking inside a dark printer enclosure)
- Surface panels: #0E1015 (slightly elevated dark surface)
- Elevated elements: #161920 (panels, cards)
- Overlay: #1C1F28 (expanded sections)
- Primary accent: #00D4AA (bright teal/mint green — like glowing filament or status LED)
- Secondary accent: #FF6B35 (nozzle orange — warm, industrial, like heated extruder tip)
- Tertiary accent: #6C63FF (electric indigo — used very sparingly for special highlights)
- Primary text: #E8ECF1 (cool near-white, slightly blue-tinted)
- Secondary text: #9BA3B0 (cool muted gray)
- Muted text: #5C6370 (subdued)
- Borders: #1E2230 (very subtle, thin)
- Active borders: #2A3040
- Grid lines: #141720 (ultra subtle)
- Status "nozzle hot": #FF6B35 with glow
- Status "heated bed": #EF5350

TYPOGRAPHY (industrial, technical, geometric):
- Headings: Geometric sans-serif similar to "Space Grotesk" — weight 700, strong, squared letterforms, technical feel. NOT serif, NOT rounded.
- Body text: Clean humanist sans-serif similar to "IBM Plex Sans" — weight 400-500, readable, professional
- Technical labels: Monospace similar to "Space Mono" — UPPERCASE, 10-11px, letter-spacing 0.08em, used for status badges and micro-labels
- Numeric values: Monospace similar to "JetBrains Mono" — weight 500-700, used for prices, dimensions, percentages

BACKGROUND TEXTURE (critical differentiator):
- The entire page has a very subtle blueprint-style dot grid pattern — evenly spaced dots (#141720, 1px) every 24px, covering the entire background. This gives it an engineering drawing / graph paper feel.
- Additionally, a very faint film grain/noise texture overlay at 3-5% opacity across the page — adds tactile, analog quality
- These textures are ultra-subtle but visible on close inspection

NAVIGATION BAR (top, 56px height, compact and technical):
- Background: #08090C with thin 1px bottom border #1E2230
- Left: Brackets-style logo "[ MODEL.PRICER ]" in monospace font, #E8ECF1, with teal dot separator, weight 700
- Navigation links: "Home", "Demo", "Pricing", "Support" — monospace UPPERCASE 11px, letter-spacing 0.06em, #5C6370, hover turns #00D4AA
- Far right: "START BUILDING" button — teal (#00D4AA) outlined (1px border, transparent bg), monospace UPPERCASE 11px, 36px height, 6px border-radius. On hover: filled teal bg with dark text.
- Also far right: Small "v3.2" version tag in monospace 10px, #5C6370

HERO SECTION (LEFT-ALIGNED — critical: NOT centered):
- Layout: ASYMMETRIC two-column grid — 55% left (text) / 45% right (visual). Text is LEFT-ALIGNED, not centered. This breaks the typical AI "centered hero" pattern.
- Min-height: 90vh
- Background: Blueprint dot grid visible, with the grid pattern slightly more prominent in this section

LEFT SIDE (text content):
- Top: Small status badge "STATUS: PRINTING" — monospace 10px UPPERCASE, letter-spacing 0.08em, teal (#00D4AA) text, with a tiny pulsing teal dot indicator, border 1px #2A3040, 4px radius, padding 4px 12px
- Headline: "Precision Pricing for 3D" on first line, "Manufacturing" on second line — geometric sans-serif (Space Grotesk-like) 700, 39px, #E8ECF1, left-aligned, max-width 540px. Under the word "Manufacturing" there is a hand-drawn wavy SVG underline (squiggle) in teal (#00D4AA), 2.5px stroke, organic and imperfect — like someone drew it by hand. This squiggle is a KEY anti-AI element.
- Subheadline: "Automated quoting for FDM, SLA, and SLS print farms. Upload models, configure parameters, get instant pricing." — IBM Plex Sans-like 400, 16px, #9BA3B0, left-aligned, max-width 480px, margin-top 24px
- Two CTA buttons side by side (left-aligned, 12px gap):
  - Primary: "Start Building" — teal (#00D4AA) background, dark (#08090C) text, monospace 600, 44px height, 6px radius
  - Secondary: "See Demo" — transparent background, 1px #2A3040 border, #9BA3B0 text, monospace 500, 44px height, 6px radius

RIGHT SIDE (animated 3D printer illustration):
- A detailed SVG-style illustration of a 3D printer (Prusa-style FDM printer):
  - Rectangular frame with thin #2A3040 strokes
  - Two vertical guide rails on left and right
  - A horizontal X-axis carriage bar across the top portion
  - A nozzle/hotend pointing down from the carriage — the nozzle tip glows warm orange (#FF6B35) with a soft glow effect
  - A build plate at the bottom with subtle grid lines
  - On the build plate: partially printed layers (8 rectangular layers stacking up, colored in teal #00D4AA with increasing opacity from bottom 15% to top 75%)
  - A small display panel on the printer frame showing "READY" in monospace teal text
  - The overall style is TECHNICAL LINE ART — not photorealistic, not cartoon. Like an engineering diagram or SVG schematic.
- Visible only on desktop, hidden placeholder on mobile

FEATURES SECTION:
- Section intro: Small teal UPPERCASE label "CAPABILITIES" in monospace 10px, letter-spacing 0.1em
- ASYMMETRIC grid (NOT 3 equal columns): 2fr + 1fr layout — one large card spanning 2 rows on the left, two smaller cards stacked on the right
- Each card: Background #0E1015, 1px border #1E2230, 8px border-radius, 24px padding
- "01/" numbered label: Top-left of card, monospace 12px, #5C6370, the "/" slash is in teal (#00D4AA) — like "01/", "02/", "03/"
- Custom 3D-printing themed SVG icons: Caliper (for precision), Layers (for printing), Spool (for filament) — line-art style, 32px, teal stroke
- Card title: Space Grotesk-like 600, 18px, #E8ECF1
- Card description: IBM Plex Sans-like 400, 14px, #9BA3B0
- Bottom-right of each card: Small arrow icon → that slides 4px right on hover
- One card (the large one) shows topic: "Precision Pricing Engine" with longer description about volume-based calculations and receipt-style breakdowns

PRICING SECTION (with skewed background — unique element):
- The entire pricing section has a SKEWED background — the background panel is rotated -2 degrees CSS, while the content inside is counter-rotated to stay straight. This breaks rectangular AI patterns.
- Section background: #0E1015
- Title: "Pricing Plans" — Space Grotesk-like 700, centered, 25px
- 3 pricing cards in a row, equal width
- Cards: #161920 background, 1px #1E2230 border, 8px radius
- Recommended card: Has a 3px top border with a gradient from teal (#00D4AA) to orange (#FF6B35)
- Plan names: UPPERCASE monospace labels 10px — "STARTER", "PRO", "ENTERPRISE"
- Prices: JetBrains Mono-like 700, 31px — "$0", "$49", "$199"
- "per month" label: monospace 12px, #5C6370
- Feature list: Teal checkmarks, IBM Plex Sans-like 14px, #9BA3B0
- CTA buttons: Primary (teal) on recommended, outlined on others

SOCIAL PROOF MARQUEE (between features and pricing):
- Thin horizontal strip with 1px top and bottom borders #1E2230
- Left side: "Trusted by 120+ print farms" in monospace 11px UPPERCASE, #5C6370
- Right side: Scrolling marquee of company logos (placeholder gray rectangles) in grayscale, 40% opacity, hover 70%

FOOTER:
- #08090C background, 1px top border #1E2230
- Compact, technical, monospace micro-text
- Left: "[MODEL.PRICER]" logo in monospace + version number
- Right: Links in UPPERCASE monospace 10px, #5C6370

CRITICAL ANTI-AI REQUIREMENTS:
- LEFT-ALIGNED hero text (NOT centered) — this alone breaks 90% of AI templates
- Hand-drawn squiggle underline SVG under "Manufacturing" — organic, imperfect, human
- Blueprint dot grid background — visible, subtle, industrial
- Asymmetric card grid (2fr/1fr) — NOT 3 equal columns
- Skewed pricing section background (-2deg)
- UPPERCASE monospace micro-labels with letter-spacing
- "01/" numbered card labels
- Technical line-art 3D printer SVG illustration (not photo, not generic icon)
- Film grain noise overlay
- Overall mood: precision, control, engineering, like operating factory equipment

Render as: A realistic high-fidelity web browser screenshot, desktop viewport 1440x900, Chrome frame optional. Photorealistic UI mockup quality. Dark theme throughout.
```

---

## PROMPT 3: Varianta "OBSIDIAN" (Premium Elegant + Glass-morphism)

```
Create a highly detailed, pixel-perfect UI design mockup screenshot of a dark-themed SaaS landing page for "ModelPricer" — a 3D printing pricing calculator web application. This is the "OBSIDIAN" variant — a luxury, refined, warm dark theme with glass-morphism effects, inspired by Cinema 4D, Blender UI, luxury automotive dashboards, and high-end product photography studios. Desktop viewport 1440x900.

OVERALL AESTHETIC: Refined, warm, deep, luxurious, assured. Like a premium automotive interior at night — warm ambient lighting, deep shadows, glass reflections. The color palette leans warm with purple/violet and coral/orange accents creating a sunset-like warmth on a deep void background. Glass-morphism (frosted glass) cards are the signature element. NO cold/clinical feel. NO generic AI website look. Keywords: obsidian stone, polished glass, warm glow, silk.

COLOR PALETTE (exact values, strictly follow):
- Void (deepest background): #0C0A0F (very dark with warm purple undertone — NOT pure black, NOT blue-tinted)
- Surface (cards, panels): #13111A (warm dark surface with lavender undertone)
- Elevated (modals, dropdowns): #1B1825 (lighter warm dark)
- Overlay (expanded sections): #231F2E (visible warm dark)
- Primary text: #F0EDF5 (warm white with lavender undertone — NOT cold pure white)
- Secondary text: #A39DB0 (muted lavender-gray)
- Muted text: #6B6478 (deep purple-gray)
- Primary accent: #C8A2FF (soft violet/purple — like silk PLA purple filament, the SIGNATURE color)
- Primary accent hover: #D4B5FF (lighter violet)
- Secondary accent: #FF8A65 (warm coral-orange — like wood-fill PLA)
- Tertiary accent: #64FFDA (mint green — like glow-in-the-dark filament, used for success states)
- Error: #FF5252 (warm red)
- Warning: #FFD54F (warm yellow)
- Info: #82B1FF (soft blue)
- Borders: #211E2B (very subtle warm dark)
- Active borders: #2E2A3A
- Highlight border: rgba(200,162,255,0.15) — 15% violet glow

GRADIENTS (signature elements):
- Brand gradient: Linear gradient 135deg from #C8A2FF (violet) to #FF8A65 (coral) — used on the keyword "precisely" in the headline and on premium badges
- Premium gradient: Linear gradient 135deg from #C8A2FF (violet) to #64FFDA (mint) — used sparingly for special elements
- Ambient glow: Large radial gradient centered behind hero — elliptical, from rgba(200,162,255,0.06) at center to transparent at edges. Additional warm radial from rgba(255,138,101,0.04). Creates a soft, barely-visible atmospheric halo.
- Surface gradient: Linear 180deg from #13111A to #0C0A0F on card backgrounds

GLASS-MORPHISM (signature card treatment):
- Cards use frosted glass effect: Background rgba(19,17,26,0.7) with backdrop-blur(16px)
- 1px border rgba(200,162,255,0.08) — very faint violet tinted border
- Subtle inner glow / reflection on top edge
- This glass effect is visible especially on the floating hero card and testimonial card

TYPOGRAPHY:
- Headings: Geometric sans-serif similar to "Sora" — weight 700, tight tracking (-0.03em), modern, slightly futuristic but warm. NOT serif, NOT rounded.
- Body text: Geometric sans-serif similar to "DM Sans" — weight 400, clean, friendly, good readability
- Monospace: Similar to "JetBrains Mono" — weight 500, used for prices, dimensions, technical values
- Display text: Same as heading font but with tighter tracking for hero-sized text

TYPE SCALE (Minor Third 1.200):
- Hero headline: 40px / 48px line-height, Sora-like 700, -0.03em tracking
- Section headings: 28px, Sora-like 600
- Card titles: 23px, Sora-like 600
- Body: 16px / 26px line-height, DM Sans-like 400
- Captions: 13px, DM Sans-like 400
- Badges/micro: 11px, DM Sans-like 500

NAVIGATION BAR (top, 64px height):
- Background: transparent, blending into the void, NO visible bottom border (just spacing separation)
- Left: Small geometric logo icon (could be abstract cube/prism shape, gradient violet-to-coral) + "ModelPricer" in heading font weight 600, 16px, #F0EDF5
- Center-right: Navigation links "Home", "Demo", "Pricing", "Support" — DM Sans-like 14px, #A39DB0, 28px gaps
- Far right: "Get started" CTA button — primary violet (#C8A2FF) background, dark void text (#0C0A0F), 10px radius, 40px height. Subtle violet glow shadow: 0 0 24px rgba(200,162,255,0.12)

HERO SECTION (CENTERED layout, atmospheric):
- Layout: CENTERED — everything stacked vertically and centered. NOT split layout.
- Min-height: 85vh
- Background: The void #0C0A0F with a large, soft, elliptical ambient glow behind the entire section — a mix of violet (rgba(200,162,255,0.06)) and warm coral (rgba(255,138,101,0.04)) radial gradients overlapping. Creates a soft "warm light in darkness" atmosphere. Very subtle — NOT a harsh colorful background.

- Headline: Sora-like 700, 40px, #F0EDF5, centered, max-width 600px, tight tracking -0.03em. Text reads: 'Your prints, precisely priced.' — The word "precisely" has the BRAND GRADIENT applied as text fill (background-clip: text) — it shimmers from violet #C8A2FF to coral #FF8A65. This gradient keyword is a KEY visual element.
- Subheadline: DM Sans-like 400, 19px, #A39DB0 (secondary text), centered, max-width 480px, margin-top 20px. Text reads: "Upload your 3D model, configure parameters, get an instant quote. No guesswork, no spreadsheets."
- CTA area: Centered, margin-top 32px
  - Primary button: "Get started" — violet (#C8A2FF) background, dark text (#0C0A0F), 10px radius, 48px height, DM Sans-like 500. Subtle violet glow.
  - Below button: "No credit card required" — muted text 13px #6B6478
- FLOATING PARALLAX CARD (KEY signature element, below CTA, margin-top 64px):
  - A glass-morphism card (380px wide, frosted glass effect: backdrop-blur, semi-transparent #13111A bg, faint violet border)
  - The card appears to FLOAT with a slight 3D perspective tilt — as if it's a physical card hovering above the surface, slightly rotated (about 2-3 degrees on X and Y axis) creating a parallax depth effect
  - Shadow: Deep shadow 0 16px 40px rgba(0,0,0,0.5) + faint violet glow 0 0 24px rgba(200,162,255,0.06) on the border
  - Card content:
    - Top area: Dark rectangle (#0C0A0F) placeholder for "3D Model Preview" with muted text "[3D Model Preview]" in center — 200px height, 10px radius
    - Bottom area: A row with "Estimated price" label in muted 13px left-aligned, and a price "192,48 Kc" in JetBrains Mono-like 500, 20px, violet (#C8A2FF) color. On the right side: A small pill badge "PLA · Standard" in mint (#64FFDA) text on dark background, 9999px radius
  - The card has rounded corners (20px) and looks like a premium physical object floating in space
  - 20px border-radius, 24px padding

FEATURES SECTION (Staggered 2-column layout):
- Section title: "Everything you need" — Sora-like 600, 28px, centered, #F0EDF5, margin-bottom 64px
- Layout: STAGGERED alternating 2-column — feature items alternate left and right of a vertical center line
- A thin vertical DASHED line (1px, #211E2B) runs down the center connecting all features
- 4 features, alternating sides:
  1. Left side: Icon (24px, violet #C8A2FF, in a 48px rounded square with rgba(200,162,255,0.08) bg) + Title "Multi-Format Upload" (Sora-like 600, 23px, #F0EDF5) + Description "STL, OBJ, 3MF..." (DM Sans-like 400, 16px, #A39DB0)
  2. Right side: Same structure, "Precise Configuration"
  3. Left side: "Instant Pricing"
  4. Right side: "Embeddable Widget"
- Each feature block has a fade-up animation stagger feel — items appear sequentially with slight delay
- Max-width 900px, centered on page

TESTIMONIAL SECTION (glass card):
- Background: Subtle ambient glow (violet), very soft
- Centered glass-morphism quote card (max-width 640px):
  - Frosted glass treatment, 20px radius, 40px padding
  - Large SVG quotation mark in top-left: violet #C8A2FF at 15% opacity, 48px size
  - Quote text: DM Sans-like ITALIC 400, 23px, #F0EDF5, left-padded 16px. Text: "ModelPricer cut our quoting time from 30 minutes to 30 seconds."
  - Attribution: JetBrains Mono-like 500, 13px, #6B6478: "— Jan Novak, PrintFarm.cz"
- Below card: 3 navigation dots centered — active dot is violet and wider (24px), inactive dots are #2E2A3A circles (8px)

FOOTER:
- Background: #0C0A0F, thin top border #211E2B
- Logo left, navigation links right
- All text in #6B6478, 13px
- Very minimal, understated

CRITICAL ANTI-AI REQUIREMENTS:
- GRADIENT TEXT on "precisely" keyword — violet-to-coral gradient applied to text. This is the hero's visual anchor.
- FLOATING PARALLAX CARD with glass-morphism — must look like it hovers in 3D space with perspective tilt. This is NOT a flat card sitting on the page.
- Glass-morphism treatment (frosted glass, backdrop blur, semi-transparent backgrounds) on key cards — especially the floating hero card and testimonial quote card
- Warm purple/violet color temperature throughout — NOT cold blue, NOT neutral gray. The whole page should feel WARM despite being dark.
- Ambient glow effects — soft violet and coral radial gradients behind sections, barely visible but creating atmospheric depth
- Staggered feature layout with dashed center line — NOT a simple card grid
- Deep shadows with faint colored glow (violet tint in shadow edges)
- Film grain/noise texture at 2-3% opacity across the page for analog warmth
- Overall mood: luxury, warmth, depth, like polished obsidian stone catching warm light. Cinema 4D render quality.
- The page must feel like a premium automotive dashboard at night — ambient warm lighting, deep blacks, glass reflections

Render as: A realistic high-fidelity web browser screenshot, desktop viewport 1440x900, Chrome or Safari frame optional. Photorealistic UI mockup quality. Dark theme throughout. The highest quality rendering possible — this should look like a real Figma export or Dribbble shot.
```

---

## Poznamky k pouziti

### Doporucene generatory
1. **Midjourney v6+** — nejlepsi pro UI mockupy, pouzit `--ar 16:9 --style raw --v 6`
2. **DALL-E 3** — dobra presnost textu, vhodne pro realisticky UI
3. **Ideogram 2.0** — nejlepsi pro text rendering v obrazcich
4. **Flux Pro** — vysoka kvalita, dobry pro detailni UI

### Tipy pro lepsi vysledky
- Pokud generator nezvladne cely prompt najednou, rozdelit na Hero + zbytek stranky
- Pro Midjourney pridat na konec: `--ar 16:9 --style raw --s 250 --q 2`
- Pro lepsi text rendering (nazvy, ceny) pouzit Ideogram
- Kdyz prvni pokus neni presny, zopakovat s durazem na konkretni sekci ("focus more on the hero section centered layout with serif heading")
- Pro srovnani variant generovat vsechny tri se stejnym seedem (Midjourney: `--seed 12345`)

### Co sledovat pri hodnoceni
1. **Celkovy dojem** — citi se stranka unikatne, nebo genericke AI?
2. **Barevna teplota** — Premium (neutralni zinc), Forge (chladna modra/teal), Obsidian (tepla fialova)
3. **Typography** — Premium (serif nadpisy!), Forge (uppercase monospace labels), Obsidian (gradient text)
4. **Layout** — Premium (centrovany zen), Forge (left-aligned asymetrie), Obsidian (centrovany + floating card)
5. **Textures** — Premium (ciste, minimalni), Forge (blueprint grid + grain), Obsidian (glass + ambient glow)
6. **Signature prvek** — Premium (serif font), Forge (squiggle + 3D printer SVG), Obsidian (parallax glass card)
