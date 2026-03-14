# Wave 18 — Calculator UX, Sidebar Audit, Routes Audit (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### Calculator Loading UX (2 fixes)
1. **SlicingProgressInline** — Fixed static activeStep that never advanced. Now uses timed step advancement (0→1→2) with cycling for long operations.
2. **FileUploadZone** — Reduced upload animation from 2s to 1.2s. Added phase labels ("Čtu soubor…", "Validace formátu…", "Připravuji model…", "Dokončuji…").

### Admin Sidebar Audit (3 fixes)
1. **Customers icon** — Changed from `Users` (same as Team) to `UserCircle` for visual distinction
2. **Emails permission** — Changed `requiredPermission` from `'branding'` to `'orders'` (emails relate to order communication)
3. **Health badge** — Removed dead `badge: 'health'` that was permanently 0

### Routes.jsx Audit — CLEAN
- All 34 lazy imports resolve to existing files
- No duplicate routes
- All admin routes wrapped in PrivateRoute
- 404 catch-all correctly at end
- No orphaned pages
- Consistent export patterns

## Files Changed
- `src/pages/test-kalkulacka/components/PricingCalculator.jsx` — slicing progress animation
- `src/pages/test-kalkulacka/components/FileUploadZone.jsx` — upload phase labels
- `src/pages/admin/AdminLayout.jsx` — sidebar icon, permission, badge fixes
- `docs/claude/Documentation/Test-Kalkulacka-Dokumentace.md` — updated
