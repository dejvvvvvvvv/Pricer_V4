# Wave 22 — Accessibility Fixes, Table Pagination, Color Tokens (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### Accessibility P0 Fixes

1. **Focus-visible CSS** — Updated token color from `--forge-accent-primary` to `--forge-accent-teal` in 3 rule blocks in `src/styles/index.css`
2. **Space key on role="button"** — Fixed 6 instances in `AdminDashboard.jsx` (Enter + Space + preventDefault)
3. **prefers-reduced-motion** — Added global `@media (prefers-reduced-motion: reduce)` rule forcing near-zero animation/transition duration
4. **Tab ARIA** — `BuilderLeftPanel.jsx`: added `role="tablist"`, `aria-controls`, `id` attributes. `AdminWidget.jsx` already correct.

### Color Token Migration (7 replacements)

- `#ffaa00` → `var(--forge-warning)` in `AdminPricing.jsx` (4 instances)
- `#ff4444` → `var(--forge-error)` in `AdminPricing.jsx` (3 instances)
- `#999` → `var(--forge-text-muted)` in `EmailTemplatePreview.jsx`
- `#9ca3af` → `var(--forge-text-secondary)` in `OrderExportActions.jsx` (3 instances)

### Table Improvements

- **AdminOrders** — Hide pagination when `pageCount ≤ 1`
- **AdminCustomers** — Added pagination (25/page) with page reset on filter/sort

## Files Changed

| File | Changes |
|------|---------|
| `src/styles/index.css` | focus-visible tokens, prefers-reduced-motion |
| `src/pages/admin/AdminDashboard.jsx` | Space key handlers (6 instances) |
| `src/pages/admin/AdminPricing.jsx` | 7 color token replacements |
| `src/pages/admin/AdminOrders.jsx` | pagination visibility |
| `src/pages/admin/AdminCustomers.jsx` | added pagination |
| `src/pages/admin/components/EmailTemplatePreview.jsx` | color token |
| `src/pages/admin/components/OrderExportActions.jsx` | color tokens (3) |
| `src/pages/admin/builder/components/BuilderLeftPanel.jsx` | tab ARIA |

## Build Status

✓ **PASS** — `npm run build` completed successfully in 1m
- Minor warning: Firebase dynamically/statically imported (expected, no issue)
- Chunk size warning for Three.js libraries (expected for 3D models)
