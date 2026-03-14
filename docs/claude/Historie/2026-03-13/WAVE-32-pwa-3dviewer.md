# Wave 32 — PWA Fixes, 3D Viewer Performance (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### PWA (3 fixes)
1. **Manifest icon maskable** — icon-192.svg purpose changed to "any maskable" for Android adaptive icons
2. **SW update flow** — Added controllerchange listener for page reload on SW update + visibilitychange check for background tab updates
3. **Stale public/index.html** — Cleaned up CRA artifact with broken %PUBLIC_URL% tokens and missing logo192.png

### 3D Model Viewer (1 performance fix)
- **autoRotate causing 60fps loop** — ModelCanvas had autoRotate on OrbitControls without frameloop="demand", consuming GPU continuously. Fixed: added frameloop="demand", removed autoRotate. Model still fully interactive via pointer events.

## Files Changed
- `public/manifest.json` — maskable icon purpose
- `src/lib/swRegister.js` — SW update reload + visibility check
- `public/index.html` — cleaned CRA artifact
- `src/pages/test-kalkulacka/components/ModelViewer.jsx` — demand rendering
