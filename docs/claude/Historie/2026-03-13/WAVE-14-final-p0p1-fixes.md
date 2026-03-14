# Wave 14 — Final P0/P1 Fixes from Re-Audit (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### P0 Fix
1. **TabItemsFiles.jsx** — Path traversal in download: Added inline path sanitization (strips `..`, `.`, null bytes, backslashes) before `downloadFile()`. Defense-in-depth — storageApi already sanitizes internally.

### P1 Fixes
2. **AdminPresets.jsx** — Share string prototype pollution: Added `SAFE_PRINT_OVERRIDE_KEYS` whitelist (13 keys) + `sanitizePrintOverrides()` function stripping `__proto__`/`constructor`/`prototype`. Applied to `parseShareString`.

3. **AdminPricing.jsx** — Numeric bounds in JSON import: Added `MAX_NUMERIC_BOUND=999999` + `clampBounded()`. Applied to all numeric fields in tenant_pricing rules and material properties (price_per_gram, density, temperatures, speeds, etc.)

4. **ConfigBackupRestore.jsx** — Legacy localStorage sanitization: Added `stripDangerousKeys()` before legacy `localStorage.setItem`. Direct write kept for backwards compatibility (different key format).

5. **OnboardingWizard.jsx** — Already fixed (timer refs + cleanup useEffect already present from previous wave).

## Files Changed
- `src/pages/admin/components/orders/TabItemsFiles.jsx` — path sanitization
- `src/pages/admin/AdminPresets.jsx` — share string whitelist
- `src/pages/admin/AdminPricing.jsx` — numeric bounds clamping
- `src/pages/admin/components/ConfigBackupRestore.jsx` — legacy write sanitization

## Audit Status After Wave 14
- **15/15 TOP P0** — ALL fixed or addressed
- **P1 remaining** — ~0 known unfixed
- **P2 backlog** — minor items only (architectural limitations like client-only role enforcement)
