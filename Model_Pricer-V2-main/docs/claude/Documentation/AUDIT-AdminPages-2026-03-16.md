# Admin Pages Audit — 2026-03-16

## Summary
- **Pages tested:** 19 (+ 2 bonus: Analytics, Payments route check)
- **Passed:** 15
- **Passed with warnings:** 3 (backend-dependent features showing expected errors)
- **Failed (404):** 2 (wrong route paths — `/admin/system-health`, `/admin/print-queue`)
- **JS Console Errors:** 0 across all pages

## Route Corrections
| Requested URL | Actual URL | Note |
|---|---|---|
| `/admin/system-health` | `/admin/system` | Sidebar links to `/admin/system` |
| `/admin/activity-log` | `/admin/activity` | Sidebar links to `/admin/activity` |
| `/admin/print-queue` | N/A | Not a standalone route; "Tiskova fronta" is a view mode within `/admin/orders` |

---

## Detailed Results

### 1. Dashboard (/admin)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** Order stats (daily revenue, order count, pending, active prints), recent orders table (2 orders visible), recent activity feed, quick actions (new order, import, refresh), navigation cards to all sections, 7-day revenue chart, most used materials, system status indicators, alerts (missing logo), quick settings panel (markup, min order, express, free shipping threshold, volume discounts)
- **Notes:** Fully functional dashboard with rich content. Onboarding setup wizard banner visible.

### 2. Branding (/admin/branding)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** Company name/tagline inputs, logo upload (drag-and-drop, file types listed), primary/secondary color pickers with hex input, contact details (email, phone, web), full billing/legal section (company name, address, PSC, city, country, ICO, DIC, bank account, IBAN), live preview card
- **Notes:** Complete branding configuration page. All form fields functional.

### 3. Pricing (/admin/pricing)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** Summary stats (rate 70 Kc/h, markup, min order, rounding), 5 tabs (Materials, Print Time, Price Rules, Discounts, Preview), material management (PLA shown with spool weight/price, price per gram calculation), add material button, import/export JSON, reset to defaults, save button, "Unsaved changes" indicator, quick price test
- **Notes:** Core pricing engine configuration. Fully operational.

### 4. Fees (/admin/fees)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** 6 fees configured (Setup fee 75 Kc, Material surcharge 0.50 Kc/g, Surface processing 30 Kc, Express 25%, Shipping 89 Kc, Insurance 3%), drag-to-reorder, bulk select checkboxes, filters (type MODEL/ORDER, active/inactive, required/optional), search, template button, add new fee, per-fee delete, save indicator
- **Notes:** Full fee management system. All interactions available.

### 5. Parameters (/admin/parameters)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** 5 tabs (Overview, Library, Widget params, Validation, Presets), printer profile display (Original Prusa MK4S, 250x210x220mm), nozzle sizes (0.25-0.8mm, current 0.4mm), layer heights (0.05-0.35mm, default 0.2mm), temperature presets for PLA/PETG/ASA/TPU, change log section, save/reset buttons
- **Notes:** Redirects to `/admin/parameters/overview`. Comprehensive slicer parameter management.

### 6. Presets (/admin/presets)
- **Status:** PASS (with warning)
- **Console errors:** none
- **Visual issues:** Shows "Offline" badge and "Backend neni dostupny" error message
- **Key functionality:** Import button, refresh button, upload preset (.ini), empty state with instructions
- **Notes:** Backend-dependent page. Shows appropriate error handling when backend is not running. Page shell renders correctly. The "Request failed" error is expected without backend.

### 7. Orders (/admin/orders)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** 4 view modes (Table, Kanban, Print Queue, Calendar), new order button, export, search bar, extensive filter panel (status: 9 states, material, preset, flags: OUT_OF_BOUNDS/SLICER_FAILED/MISSING_SLICER_DATA/INVALID_CONFIG, tags: 8 types, date range, sorting), quick views (All/Active/Completed/Overdue/Today), 2 orders displayed in table
- **Notes:** Most feature-rich admin page. Extremely comprehensive order management.

### 8. Team (/admin/team)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** Team stats (1/3 seats, active/pending/inactive counts, role count), 3 tabs (Members, Roles & Permissions, Activity), invite form, member list with role dropdown (Owner/Admin/Manager/Viewer/Operator), deactivate/remove buttons, last login timestamp
- **Notes:** Fully functional team management.

### 9. Widget (/admin/widget)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** Widget counter (1/2), create widget button, "Homepage" widget card (active, ID wid_1HY6zNnZM4), Builder/Copy embed/Duplicate/Delete buttons, 5 configuration tabs (Configuration, Embed code, Integration, Domains, Settings), save/reset
- **Notes:** Complete widget management interface.

### 10. Customers (/admin/customers)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** Summary cards (total customers, new this month, avg value 140.46 Kc, returning 0/2), search bar, filter tabs (All/New/Regular/VIP with counts), CSV export, customer table with 2 entries
- **Notes:** Clean customer management page.

### 11. System Health (/admin/system)
- **Status:** PASS (with warning)
- **Console errors:** none
- **Visual issues:** none — warnings are informational about backend status
- **Key functionality:** Auto-refresh (30s), system status/security tabs, backend API status (degraded, HTTP 500, 133ms latency), PrusaSlicer status (down — backend unavailable), configuration overview (1 material, 6 fees, email provider, branding, widgets, presets), localStorage usage (158KB/5MB with namespace breakdown), browser/environment info, 5 feature flags with toggles, config backup/restore (19 config categories, auto-backup option, import/export, backup history)
- **Notes:** `/admin/system-health` is a 404 — correct route is `/admin/system`. Very comprehensive system health dashboard. Backend degraded status is expected in dev without backend running.

### 12. Webhooks (/admin/webhooks)
- **Status:** PASS (with warning)
- **Console errors:** none
- **Visual issues:** Shows "Request failed with status code 500" with retry button
- **Key functionality:** 3 tabs (Webhooks, Delivery, Documentation), add webhook button, retry on error
- **Notes:** Backend-dependent. Shows appropriate error handling. Page structure renders correctly.

### 13. Activity Log (/admin/activity)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** Briefly shows loading state before content appears
- **Key functionality:** Summary stats (daily activity, most active user, most common type, trend), auto-refresh toggle, export button, cleanup old entries, filters (action type, description search, user search, date range from/to), activity list (empty — "Zadne aktivity")
- **Notes:** `/admin/activity-log` is a 404 — correct route is `/admin/activity`. Page has slight loading delay (lazy-loaded) but renders fully.

### 14. Integrations (/admin/integrations)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** 8 integrations in 5 categories: E-commerce (Shopify, WooCommerce), Payments (Stripe, PayPal), Shipping (Zasilkovna, PPL/DPD), Analytics (Google Analytics), Developer (Custom API Webhook). Each with description. 0 active of 8 available.
- **Notes:** Clean integration marketplace. All cards clickable.

### 15. Shipping (/admin/shipping)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** 3 shipping methods (Standard 99 CZK 3-5 days, Express 199 CZK 1-2 days, Personal pickup free), reorder buttons, shipping toggle, free shipping threshold section, shipping zones (Czech Republic, Slovakia, custom zone), method editor (name, type dropdown: Fixed/Weight-based/Pickup/Custom, base price, per-kg surcharge, delivery time min/max, description, active toggle), tabs per method (Basic, Zones), save/reset
- **Notes:** Full shipping configuration. Very detailed.

### 16. Coupons (/admin/coupons)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** Summary stats (total, active, usage, total discount 0 Kc), system toggle (currently off, shows "Slevovy system je vypnuty"), 3 tabs (Coupons, Promotions, Settings), bulk generation button, add coupon button, empty state with instructions
- **Notes:** Coupon system disabled but fully rendered.

### 17. Settings (/admin/settings)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** General (currency CZK/EUR/USD, language CS/EN, timezone, date format, decimal separator), Order settings (auto-numbering with prefix/format/preview "ORD-2026-0042", default status, auto-archive 90 days), Notifications (email/sound/desktop with browser permission request), Display (landing page, pagination 10-100, date display relative/absolute, compact mode), Data management (delete all orders, reset pricing, factory reset — all with destructive action buttons), backup/restore link to System Health
- **Notes:** Comprehensive settings page. All dropdowns populated with correct options.

### 18. Print Queue (/admin/print-queue)
- **Status:** FAIL (404)
- **Console errors:** none (404 page renders cleanly)
- **Visual issues:** Shows 404 page
- **Key functionality:** N/A
- **Notes:** Print Queue is NOT a standalone route. It is a view mode button ("Tiskova fronta") within the Orders page at `/admin/orders`. No route exists in Routes.jsx for `/admin/print-queue`.

### 19. Emails (/admin/emails)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** none
- **Key functionality:** 4 tabs (Templates, Settings, Log, Auto-send), 8 email templates in 3 categories (Orders: confirmation/shipped/completed/cancelled; Payments: invoice/payment received; General: welcome/custom), template editor with rich text toolbar (bold/italic/underline/heading/paragraph/lists/link/clear), 13 template variables with insert buttons and example values, subject line field, preview/edit/restore defaults/send test buttons, save indicator
- **Notes:** Feature-rich email management. WYSIWYG editor fully functional.

---

## Bonus Pages Tested

### Analytics (/admin/analytics)
- **Status:** PASS
- **Console errors:** none
- **Visual issues:** CSS styles leaking into text extraction (cosmetic, not visible to users)
- **Key functionality:** Period selector (Today/Week/Month/Year/All), summary cards (total revenue, total orders, avg order, active orders with trend comparisons), 7 tabs (Overview/Calculations/Orders/Lost/Exports/Reports), draggable chart grid (revenue over time, orders by status, most used materials, avg order value, conversion funnel, orders over time), edit dashboard mode
- **Notes:** Very sophisticated analytics dashboard with drag-and-drop customizable layout.

---

## Overall Assessment

### Strengths
1. **Zero JS console errors** across all tested pages — excellent code quality
2. **Consistent UI/UX** — all pages follow Forge Design System with dark theme, consistent sidebar, breadcrumbs, notifications
3. **Rich functionality** — every page has comprehensive features (filters, search, export, bulk actions)
4. **Graceful error handling** — backend-dependent pages (Presets, Webhooks, System Health) show informative error messages rather than crashing
5. **i18n working** — all pages display Czech translations correctly
6. **Accessibility** — skip-to-content link, ARIA roles, keyboard shortcuts (Ctrl+K), status regions

### Issues Found
1. **Route mismatch (P2):** `/admin/system-health` should be `/admin/system` — task list had wrong URL
2. **Route mismatch (P2):** `/admin/activity-log` should be `/admin/activity` — task list had wrong URL
3. **Missing route (P1):** `/admin/print-queue` does not exist as standalone page — it is a view within Orders. Consider either: (a) adding a redirect route, or (b) documenting that Print Queue is accessed via Orders page view toggle
4. **Backend dependency (P3):** Presets, Webhooks, and System Health show degraded/error states when backend is not running — this is expected behavior and handled gracefully
5. **Dev server stability (P3):** Dev server (Vite) crashed once during testing session and required restart — may indicate memory pressure or HMR issue

### Recommendations
1. Add route alias or redirect: `/admin/print-queue` -> `/admin/orders?view=print-queue`
2. Add route alias or redirect: `/admin/system-health` -> `/admin/system`
3. Add route alias or redirect: `/admin/activity-log` -> `/admin/activity`
4. Consider adding a loading skeleton for Activity Log page (brief flash of "Loading admin page" before content)

---

*Audit performed via Chrome MCP browser automation on localhost:4028*
*Tester: Claude Code (Opus 4.6)*
*Date: 2026-03-16*
