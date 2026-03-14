# Wave 27 — AdminFees, AdminSystemHealth Fixes (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### AdminFees (2 fixes)
1. **createId fallback crash** — catch block re-called crypto.randomUUID (would throw again). Fixed to Date.now + Math.random fallback.
2. **filterRequired missing UI** — Filter state existed but no select control. Added third filter dropdown to toolbar.

### AdminSystemHealth (4 fixes)
1. **Presets count always zero** — Wrong namespace 'presets' vs correct 'presets:v1'. Fixed with shape unwrapping.
2. **Cache clear no audit log** — Added logSecurityEvent('cache_clear') after destructive action.
3. **byteSize overestimates 2x** — str.length*2 assumes UTF-16. Fixed to new Blob([str]).size for accurate UTF-8.
4. **navigator.platform deprecated** — Added navigator.userAgentData?.platform fallback.

## Files Changed
- `src/pages/admin/AdminFees.jsx` — createId fallback, filterRequired UI
- `src/pages/admin/AdminSystemHealth.jsx` — presets namespace, audit log, byteSize, platform API
