# Wave 25 — Kanban, Presets, Print Queue Improvements (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### Kanban Board (3 fixes)
1. **Loading skeleton** — Added isLoading prop with shimmer-animated 5-column skeleton
2. **React.memo** — Wrapped KanbanCard + KanbanColumn in memo (prevented full re-render on every drag event)
3. **Keyboard focus** — Added focus-visible ring on kanban cards. Module-level style constants.

### AdminPresets (2 bug fixes)
1. **Share string whitelist** — Fixed SAFE_PRINT_OVERRIDE_KEYS using wrong key names (generic 'infill' vs actual 'infill_sparse_density'). All imports via share were arriving with empty print_overrides.
2. **Delete confirmation** — Non-default presets could be deleted without confirmation dialog. Now always shows modal.

### Print Queue (3 improvements)
1. **Auto-refresh optimization** — Interval only active when jobs are printing/paused (was running for queued-only)
2. **"No estimated time" hint** — Orange warning when estimatedTimeMin is 0
3. **"Move to top" button** — Queued items can be moved to top of queue

## Files Changed
- `src/pages/admin/components/kanban/KanbanCard.jsx` — memo, styles, focus ring
- `src/pages/admin/components/kanban/KanbanColumn.jsx` — memo, styles
- `src/pages/admin/components/kanban/KanbanBoard.jsx` — isLoading skeleton
- `src/pages/admin/AdminPresets.jsx` — share whitelist fix, delete confirmation
- `src/pages/admin/components/orders/PrintQueue.jsx` — refresh, hint, move-to-top
