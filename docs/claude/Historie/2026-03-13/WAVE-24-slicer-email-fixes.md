# Wave 24 — Slicer Hardening, Email System Fixes (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### Slicer Error Classifier (2 fixes)
1. **Timeout detection** — Added check for `error.killed`, `error.signal === "SIGKILL"/"SIGTERM"` (Node's child_process timeout kills don't set message string)
2. **Unsupported format** — Added `MP_UNSUPPORTED_FORMAT` pattern for "Unsupported file format" / "Unknown file extension"

### Slicer Cache (2 fixes)
1. **Eviction policy** — Changed from `createdAt` to `lastAccessedAt` (LRU instead of FIFO)
2. **Stats accuracy** — `_cleanup()` now increments eviction counter for expired entries

### Email System (2 fixes)
1. **Sanitizer consistency** — AdminEmails save now uses `sanitizeHtmlAllowBasic` (DOM-based) instead of `sanitizeTemplateHtml` (regex-based)
2. **Unified send log** — AdminOrderDetail now writes to both per-order log (emailSendLog.js) AND unified log (adminEmailStorage.js)

## Files Changed
- `backend-local/src/slicer/slicerErrorClassifier.js` — timeout + format detection
- `backend-local/src/slicer/slicerCache.js` — LRU eviction + stats
- `src/pages/admin/AdminEmails.jsx` — sanitizer swap
- `src/pages/admin/AdminOrderDetail.jsx` — dual log write
