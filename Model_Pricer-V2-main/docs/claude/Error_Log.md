# Error Log — FORGE Redesign (2026-02-09)

## Issues Found & Fixed

### 1. Garbled text on Home page feature cards
- **Location:** `src/pages/home/index.jsx` lines 244, 260, 275
- **Problem:** Feature card descriptions contained nonsensical AI-generated text:
  - Card 01: "Volume-based calculations to aviation 3D-printing and volume its own hanovation..."
  - Card 02: "Printing require models to upload models invvasanute eatoms in 3D-printing carriers."
  - Card 03: "Spool 3D-printing themed SVG filament enquires 3D-printing filament."
- **Fix:** Replaced with proper CZ/EN translated text via LanguageContext keys `home.forge.feature1/2/3`

### 2. Placeholder pricing plan features
- **Location:** `src/pages/home/index.jsx` lines 27-62
- **Problem:** All plan features showed "IBM Plex Sans 14px" (font spec used as placeholder)
- **Fix:** Replaced with real features via translation keys (1 widget, 100 calcs/mo, etc.)

### 3. Footer links were plain text, not navigable
- **Location:** `src/pages/home/index.jsx` lines 470-483
- **Problem:** Footer items ['UPPERCASE', 'PRICING', 'SUPPORT'] were `<span>` elements with no routing
- **Fix:** Changed to `<Link>` components with proper routes (/, /pricing, /support)

### 4. Design system inconsistency (3 themes across 3 pages)
- **Problem:**
  - Home: Forge dark theme (correct)
  - Pricing: shadcn/ui light theme (Container, Button, TooltipProvider, PricingPlanCard, etc.)
  - Support: Custom purple gradient with inline `<style>` CSS
- **Fix:** Rewrote both Pricing and Support pages to use Forge dark theme with shared components

### 5. Support page used inline CSS block
- **Location:** `src/pages/support/index.jsx` lines 239-442
- **Problem:** ~200 lines of `<style>{...}</style>` inline CSS with purple gradient (#667eea, #764ba2)
- **Fix:** Removed all inline CSS, using Forge CSS variables and Tailwind classes

## Build Status
- `npm run build` — PASS (0 errors)
- Chunk size warning (pre-existing) — index-*.js > 4MB
