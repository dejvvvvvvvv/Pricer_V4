# Wave 30 — Order Tracking, Backend Health, Widget Builder (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### Order Tracking + Confirmation (5 fixes)
1. **Canceled order explanation** — Added red card with XCircle icon when order is canceled
2. **Shipping method capitalization** — Raw string now capitalized
3. **Hidden input cleanup** — Removed inert `<input type="hidden">` with no name
4. **Track order link** — OrderConfirmation now has "Track Your Order" button navigating to `/track?id=ORDER_ID`
5. **Print confirmation** — Added print button with `@media print` styles hiding nav/actions

### Backend Health (3 fixes)
1. **GET /api/health** — Added rssMB, uptimeHuman, cache/queue summary
2. **GET /api/health/prusa** — Wrapped response in `{ok, data: {...}}` format. Added 503 for non-zero exit.
3. **API docs** — Updated `/api/health/prusa` example to match new format

### Widget Builder (2 critical fixes)
1. **Embed code generation** — Card quick-copy was generating raw `<iframe>` instead of `data-modelpricer-widget` + script tag. Widget.js integration completely broken.
2. **Embed preview sandbox** — Missing `allow-same-origin` meant localStorage blocked in preview iframe. Widget couldn't load config.

## Files Changed
- `src/pages/test-kalkulacka/components/OrderConfirmation.jsx` — track link, print, actions
- `src/pages/order-tracking/index.jsx` — canceled card, shipping capitalize, hidden input
- `backend-local/src/util/health.js` — new file or enriched getHealthStatus
- `backend-local/src/index.js` — health/prusa response format
- `backend-local/src/routes/apiDocs.js` — updated example
- `src/pages/admin/AdminWidget.jsx` — embed code fix
- `src/pages/admin/components/WidgetEmbedTab.jsx` — sandbox fix

## Build Status
- `npm run build` — PASS (45.26s)
- Warnings: PieChart + STLLoader chunks > 2MB (expected)

## Notes
- Wave 30 focused on critical user-facing flows (order confirmation, tracking, health monitoring)
- Widget builder embed code fix unblocks third-party integrations
- Backend health endpoints now provide actionable system data for monitoring dashboards
