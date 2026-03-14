# Wave 19 — Error Handling, Offline UX, Checkout Validation (2026-03-13)

> **Session ID:** S25 (continuation from Wave 18)
> **Status:** Complete
> **Total files changed:** 8
> **Type:** UPRAVY (bugfixes + UX improvements)

---

## Co se dělalo

### Error Handling Fixes (5 items)

1. **Global error handlers** — `src/index.jsx`
   - Added window-level `unhandledrejection` listener
   - Added window-level `error` listener
   - Added `ResizeObserver` error suppression (known browser limitation)
   - Prevents white screen on unhandled promise rejections or global JS errors

2. **OfflineBanner "back online" confirmation** — `src/components/ui/OfflineBanner.jsx`
   - Added green flash notification: "Připojení bylo obnoveno"
   - Display duration: 2.5 seconds
   - Shows on connectivity restoration (online → offline → online cycle)
   - Improves user confidence in network state

3. **test-kalkulacka ErrorBoundary** — `src/pages/test-kalkulacka/components/ErrorBoundary.jsx`
   - Replaced local duplicate component with re-export of shared ErrorBoundary
   - Reduces code duplication
   - Ensures consistent error UI across pages

4. **test-kalkulacka-white ErrorBoundary** — `src/pages/test-kalkulacka-white/components/ErrorBoundary.jsx`
   - Same treatment as test-kalkulacka
   - Re-export from shared component

5. **widget ErrorBoundary** — `src/pages/widget-kalkulacka/components/ErrorBoundary.jsx`
   - Replaced Tailwind CSS classes with inline Forge token styles
   - Widget cannot use Tailwind (CSS var-only design)
   - Uses `--forge-text-muted`, `--forge-color-surface`, etc.
   - Maintains visual consistency with Forge design system

---

### Checkout Form Validation (5 items)

1. **Name field empty validation** — `src/pages/test-kalkulacka/schemas/checkoutSchema.js`
   - Added `.min(1, 'Name is required')` BEFORE `.min(2, ...)`
   - Prevents misleading "too short" error on empty field
   - Shows "required" message first, then length validation

2. **Email whitespace trimming** — `src/pages/test-kalkulacka/schemas/checkoutSchema.js`
   - Added `.trim()` in Zod email chain: `z.string().trim().email()`
   - Handles accidental leading/trailing spaces
   - Prevents "invalid email" errors from whitespace

3. **Phone format validation** — `src/pages/test-kalkulacka/schemas/checkoutSchema.js`
   - Added regex refine: `^[+]?[\d\s\-().]{7,30}$`
   - Supports international format with `+` prefix
   - Allows spaces, dashes, parentheses (common formatting)
   - Min 7 digits, max 30 characters
   - Validation error: "Enter a valid phone number"

4. **Error ARIA accessibility** — `src/components/ui/Input.jsx`
   - Added `role="alert"` to error paragraph element
   - Announces validation errors to screen readers
   - Improves a11y for users with visual impairments

5. **Autofill + aria-required** — `src/pages/test-kalkulacka/components/CheckoutForm.jsx`
   - Added `aria-required="true"` on required fields
   - Added `autoComplete` tokens:
     - `email` for email field
     - `tel-national` for phone field
     - `street-address` for address field
   - Added `inputMode="email"`, `inputMode="tel"` for mobile keyboards
   - Improves form autofill accuracy + mobile UX + a11y

---

### i18n Fix (1 item)

- **LanguageContext.jsx** — `src/contexts/LanguageContext.jsx`
  - Fixed Czech typo: `'Nekter funkce'` → `'Nektere funkce'`
  - Added `onlineBanner` keys:
    - Czech: `'Připojení bylo obnoveno'` (connection restored)
    - English: `'Connection restored'`
  - Keys: `onlineBanner.connected`

---

## Soubory které se změnily

| Soubor | Změny |
|--------|-------|
| `src/index.jsx` | Global error handlers (unhandledrejection + error listeners) |
| `src/components/ui/OfflineBanner.jsx` | Back-online green flash notification |
| `src/components/ui/Input.jsx` | Error `role="alert"` for accessibility |
| `src/pages/test-kalkulacka/components/ErrorBoundary.jsx` | Re-export shared ErrorBoundary |
| `src/pages/test-kalkulacka-white/components/ErrorBoundary.jsx` | Re-export shared ErrorBoundary |
| `src/pages/widget-kalkulacka/components/ErrorBoundary.jsx` | Forge token styles (no Tailwind) |
| `src/pages/test-kalkulacka/schemas/checkoutSchema.js` | 4 validation fixes (name empty, email trim, phone format, aria) |
| `src/pages/test-kalkulacka/components/CheckoutForm.jsx` | Autofill + aria-required improvements |
| `src/contexts/LanguageContext.jsx` | Czech typo fix + onlineBanner i18n keys |

---

## Testovani

- Build: `npm run build` → PASS
- Checkout form validation: Manual entry of edge cases
  - Empty name: Shows "Name is required"
  - Email with spaces: Trimmed and validated
  - Phone formats: `+420 123 456 789`, `123-456-7890`, `(123) 456-7890` all valid
- Offline/online transition: Network toggle → green flash appears
- Error boundary: Intentional error in widget → boundary catches and displays gracefully
- Widget ErrorBoundary: Rendered with Forge tokens (no Tailwind classnames)

---

## Poznamky

### Pasti
- ResizeObserver error suppression is needed in production (not a code issue)
- Widget cannot use Tailwind — must use `--forge-*` CSS variables only
- Email `.trim()` must come BEFORE `.email()` validation

### Future considerations
- Consider adding toast notifications for other validation scenarios
- Error logging/telemetry for unhandled rejections (currently console only)
- i18n completeness audit for `onlineBanner` in other languages

---

## Klicove rozhodnuti

1. **Error suppression:** Only suppress ResizeObserver errors (known browser issue), not all errors
2. **Widget ErrorBoundary:** Use inline Forge tokens instead of Tailwind for consistency with widget constraints
3. **Validation order:** Empty check before length/format checks for better UX
4. **Phone format:** Allow spaces/dashes/parentheses (common international patterns)

---

## Reference

- Forge Design System: `src/forge-tokens.css`
- Shared ErrorBoundary: `src/components/ErrorBoundary.jsx`
- Zod validation docs: https://zod.dev
- ARIA accessibility: https://www.w3.org/WAI/tutorials/forms/
