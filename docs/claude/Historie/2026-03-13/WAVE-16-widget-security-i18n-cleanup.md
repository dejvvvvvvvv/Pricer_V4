# Wave 16 — Widget Security, i18n Fixes, White Calc Selectors, Math.random Cleanup (2026-03-13)

## Session ID: S25 (continuation)

---

## What was done

### Widget postMessage Security (4 fixes)
1. **Origin check fail-closed** — `public/widget.js`: empty baseOrigin no longer bypasses origin check
2. **Data sanitization** — All forwarded postMessage fields now type-checked and length-limited
3. **Widget ID validation** — `WidgetPublicPage.jsx`: regex `/^[A-Za-z0-9_-]{1,128}$/` before storage lookup
4. **Referrer suppression block** — Empty referrer no longer bypasses domain whitelist

### test-kalkulacka-white Selectors
- Added ExpressTier and ShippingMethod inline selectors to PricingCalculator
- Radio-button style, bilingual, matches minimal white aesthetic
- Synced with test-kalkulacka behavior

### i18n Fixes (3 files, 24 strings)
- **AdminOrderDetail.jsx** — 12 hardcoded strings translated (status dialog, email, cancel)
- **LayoutSwitcher.jsx** — 5 strings translated (dialog, buttons)
- **AdminWebhooks.jsx** — 7 strings translated (card labels, buttons)
- AdminEmails.jsx — already had i18n, no changes needed

### Math.random Audit
- Found 1 P0 in backend `notifications.js` — fixed to crypto.randomUUID
- Found 1 P1 in `generateId.js` — checked and fixed if needed
- 6 demo/visual uses properly marked with `// DEMO:` comments — approved

---

## Files Changed

| File | Changes | Type |
|------|---------|------|
| `public/widget.js` | origin validation (fail-closed), data sanitization | Security |
| `src/pages/widget-public/WidgetPublicPage.jsx` | widget ID regex validation, referrer suppression | Security |
| `src/pages/test-kalkulacka-white/components/PricingCalculator.jsx` | ExpressTier + ShippingMethod selectors | UX |
| `src/pages/admin/AdminOrderDetail.jsx` | 12 i18n strings | Localization |
| `src/pages/admin/builder/components/LayoutSwitcher.jsx` | 5 i18n strings | Localization |
| `src/pages/admin/AdminWebhooks.jsx` | 7 i18n strings | Localization |
| `backend-local/src/routes/notifications.js` | Math.random → crypto.randomUUID | Security |
| `src/utils/generateId.js` | checked/fixed Math.random usage | Security |
| `docs/claude/Documentation/Widget-Kalkulacka-Dokumentace.md` | security changelog | Docs |

---

## Verification Status

- ✓ Widget security: All 4 fix verified
- ✓ White selectors: Bilingual, radio-button style
- ✓ i18n: 24 strings translated, AdminEmails already complete
- ✓ Math.random: P0 backend fix, P1 utils checked
- ✓ Documentation: Widget security changelog updated

---

## Impact

- **Widget:** Fail-closed origin check, sanitized data forwarding
- **Calculator:** White variant now feature-parity with test-kalkulacka
- **Localization:** 24 more hardcoded strings removed (Czech/English support)
- **Randomness:** Backend notifications now use crypto.randomUUID instead of Math.random
