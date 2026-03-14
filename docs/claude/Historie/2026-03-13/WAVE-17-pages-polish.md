# Wave 17 — Page Polish: Parameters, Upload, Public Pages (2026-03-13)

## Session ID: S25 (continuation)

## What was done

### AdminParameters.jsx (2 fixes)
1. StepperInput manual typing now clamps to min/max (was bypassing bounds)
2. Widget override inputs — added HTML min/max attributes, fixed empty string → undefined handling

### Model Upload Page (2 fixes + CSS)
1. Added retry button for failed uploads (handleRetryFile callback)
2. Added focus-visible outline on dropzone for accessibility
3. Fixed ~230 lines of missing CSS (.mu-file-item, .mu-filelist, .mu-badge, .mu-btn, .mu-format-card, etc.)

### Home Page
- Fixed unused translation key (home.hero.note now used)
- Fixed Czech diacritics in hardcoded string

### Pricing Page
- Added ARIA tab pattern to FAQ section (role=tablist, role=tab, aria-selected, aria-controls, role=tabpanel)

### Support Page (6 fixes)
1. Fixed 9 Czech strings missing diacritics (Jmeno→Jméno, Predmet→Předmět, etc.)
2. Added form submit feedback (success/error status messages with ARIA roles)
3. Changed search input type="text" → type="search" with aria-label
4. Made Email Support card a real <a href="mailto:..."> link
5. Added "brzy/soon" badges to unimplemented features (Documentation, Video Tutorials)
6. Fixed Live Chat card — shows actual business hours instead of misleading "instant" copy

### Backend
- notifications.js: Math.random → crypto.randomUUID for test IDs
- generateId.js: Already correct (crypto.randomUUID), no changes needed

## Files Changed
- `src/pages/admin/AdminParameters.jsx` — input validation
- `src/pages/model-upload/index.jsx` — retry button
- `src/pages/model-upload/ModelUpload.css` — missing CSS blocks
- `src/pages/home/index.jsx` — i18n, diacritics
- `src/pages/pricing/index.jsx` — ARIA tabs
- `src/pages/support/index.jsx` — diacritics, feedback, a11y, dead links
- `backend-local/src/routes/notifications.js` — crypto.randomUUID

## Issues Fixed
- Input validation security (stepper bounds)
- Accessibility: focus-visible, ARIA tabs, form feedback
- i18n: Missing diacritics, unused translation keys
- UX: Retry button, broken mailto links, misleading copy
- Backend: Secure random ID generation

## Quality Gates
- [x] npm run build — PASS
- [x] No console errors
- [x] i18n keys validated
- [x] ARIA patterns added where needed
- [x] CSS completed (ModelUpload.css)
