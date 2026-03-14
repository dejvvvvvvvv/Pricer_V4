# Wave 28 — Payments, Migration Page Fixes (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### AdminPayments (1 fix)
- Success/reset banners now auto-dismiss after 3 seconds (were permanent)

### AdminMigration (3 fixes)
1. **Idempotency guard** — migrateLog() now checks count of existing rows before INSERT, returns 'skipped' if data exists. Prevents duplicate log entries on re-run.
2. **Rollback dialog** — Reworded to clarify it's flag-only switch (no data moved/deleted). Was misleading.
3. **Migrate dialog** — Added reminder to download backup before proceeding.

## Files Changed
- `src/pages/admin/AdminPayments.jsx` — banner auto-dismiss
- `src/lib/supabase/migrationRunner.js` — idempotency guard
- `src/pages/admin/AdminMigration.jsx` — dialog text fixes

## Summary
Minor QoL and safety improvements to Payments UI and Migration page. All changes low-risk and backward-compatible.
