# Wave 23 — Widget Calculator UX Improvements (2026-03-13)

## Session ID: S25 (continuation)

---

## What was done

### Widget Calculator (7 fixes)

1. **Resize message debounce** — postMessage wrapped in requestAnimationFrame (was spamming on every pixel)
2. **Missing CSS variable** — Added `--widget-btn-bg` alias in widgetThemeStorage.js
3. **Skeleton responsive** — Added @media max-width:600px single-column fallback
4. **Main layout responsive** — Removed min-h-screen, replaced Tailwind grid with scoped CSS using --widget-global-padding
5. **File rejection feedback** — Added user-facing red alert for rejected files (wrong type/size), auto-clear 6s
6. **3MF format support** — Added .3mf MIME types to dropzone accept config
7. **Error page iframe** — WidgetPublicPage error UI: min-h-screen → minHeight:200px

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/widget-kalkulacka/index.jsx` | Resize debounce (requestAnimationFrame), responsive layout grid |
| `src/pages/widget-kalkulacka/components/WidgetSkeleton.jsx` | Responsive @media max-width:600px single-column fallback |
| `src/pages/widget-kalkulacka/components/FileUploadZone.jsx` | File rejection messages, 3MF format support |
| `src/pages/widget-public/WidgetPublicPage.jsx` | Error UI iframe fix (minHeight:200px) |
| `src/utils/widgetThemeStorage.js` | Added --widget-btn-bg CSS variable alias |

---

## Impact

- **Widget responsiveness:** Now works on small screens (mobile, embedded iframes)
- **User feedback:** File rejection shows red alert instead of silent failure
- **3D file support:** .3mf files accepted alongside .stl and .obj
- **Message efficiency:** ResizeObserver no longer floods parent with messages

---

## Build Status

- `npm run build` ✓ PASS (1m 4s)
- No new warnings or errors

---

## Next Steps (Not Done)

- Widget iframe positioning on mobile (if needed)
- Widget mobile theme tweaks
- Widget accessibility audit

