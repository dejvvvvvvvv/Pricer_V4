# Wave 15 — E2E Flow Audit, Pricing Engine Hardening, UX Improvements (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### E2E Admin→Calculator Flow Audit
- Verified all 6 config flows (Pricing, Fees, Express, Shipping, Coupons, Branding) across 3 calculators
- **All flows correct** in test-kalkulacka and widget-kalkulacka
- **test-kalkulacka-white gaps found:** missing onExpressTierChange, onShippingMethodChange, onApplyCoupon, onRemoveCoupon props
- Branding key schema inconsistency noted (cosmetic, non-breaking)

### Pricing Engine Hardening (3 bugs fixed)
1. **Negative model subtotal** — `modelTotalsById[id]` now clamped to `Math.max(0, ...)` preventing negative fees from propagating
2. **Express surcharge cap** — Percent surcharge capped at 10,000% (100x multiplier) to prevent astronomical values
3. **Volume discount savings guard** — Added `Math.max(0, ...)` on percent-mode savings computation

### UX Improvements (3 items)
1. **Smooth scroll to pricing results** — Fixed `pricingResultsRef` not attached to DOM (was silently broken)
2. **404 page** — Added subtitle, "Try one of these pages" hint, Admin Panel link
3. **Login page** — Added loading skeleton while auth state resolves

### test-kalkulacka-white Props Fix
- Added missing onExpressTierChange, onShippingMethodChange, onApplyCoupon, onRemoveCoupon props

## Files Changed
- `src/lib/pricing/pricingEngineV3.js` — 3 safety guards
- `src/pages/test-kalkulacka/index.jsx` — pricingResultsRef attached
- `src/pages/test-kalkulacka-white/index.jsx` — missing props added
- `src/pages/NotFound.jsx` — UX improvements
- `src/pages/login/index.jsx` — loading skeleton

## Build Status
✓ Build PASSED (2026-03-13 13:XX UTC) — 1 warning (chunk size), non-blocking
