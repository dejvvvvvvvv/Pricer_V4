# i18n Audit Report — Missing Translations

**Date:** 2026-03-13
**Scope:** Full codebase search for hardcoded Czech/English strings in JSX files
**Focus Areas:** Admin pages, Calculator components, Recent updates

---

## Summary

Found **14 hardcoded user-visible strings** across 7 files that should be translated. Most are in:
- `AdminOrderDetail.jsx` (4 findings)
- `AdminEmails.jsx` (4 findings)
- `LayoutSwitcher.jsx` (3 findings)
- `AdminWebhooks.jsx`, `CommandPalette.jsx`, `PricingShareMenu.jsx`, `OrderExportActions.jsx` (1 each)

---

## Critical Findings (Missing Translations)

### 1. **AdminOrderDetail.jsx** (4 findings)

| Line | Hardcoded String | Context | Severity |
|------|------------------|---------|----------|
| 287 | `Zrusit` | Cancel button in note modal | HIGH |
| 296 | `Potvrdit zmenu` | Confirm button in note modal | HIGH |
| 1754 | `Odeslat email` | Title attribute on email button | HIGH |
| 1755 | `Odeslat email` | Button label for email menu | HIGH |
| 2697 | `Zrusit` | Cancel button in email preview modal | HIGH |
| 2699 | `Odeslat (simulovano)` | Send button in email preview | HIGH |

**Files affected:**
- `/Model_Pricer-V2-main/src/pages/admin/AdminOrderDetail.jsx` (lines 287, 296, 1754, 1755, 2697, 2699)

---

### 2. **LayoutSwitcher.jsx** (3 findings)

| Line | Hardcoded String | Context | Severity |
|------|------------------|---------|----------|
| 82 | `Prepnout rozlozeni? Toto prepise vase aktualni usporadani prvku.` | Confirmation dialog text | HIGH |
| 85 | `Zrusit` | Cancel button | HIGH |
| 86 | `Prepnout` | Confirm button | HIGH |

**Files affected:**
- `/Model_Pricer-V2-main/src/pages/admin/builder/components/LayoutSwitcher.jsx` (lines 82, 85, 86)

---

### 3. **AdminEmails.jsx** (4 findings)

| Line | Hardcoded String | Context | Severity |
|------|------------------|---------|----------|
| 481 | `Odeslat testovaci email` | Title attribute | HIGH |
| 764 | `Testovaci email` | Section heading | MEDIUM |
| 766 | `Odeslat testovaci email pro overeni nastaveni.` | Description text | MEDIUM |
| 791 | `Odesilam...` / `Odeslat test` | Button label (ternary) | HIGH |
| 929 | `Odeslat pri zmene na:` | Label for auto-send rule | MEDIUM |

**Files affected:**
- `/Model_Pricer-V2-main/src/pages/admin/AdminEmails.jsx` (lines 481, 764, 766, 791, 929)

---

### 4. **CommandPalette.jsx** (1 finding)

| Line | Hardcoded String | Context | Severity |
|------|------------------|---------|----------|
| 184 | `Prepnout motiv` | Command palette item label | MEDIUM |

**Note:** Line 184 also has hardcoded Czech in description: `Svetly / tmavy rezim`

**Files affected:**
- `/Model_Pricer-V2-main/src/pages/admin/components/CommandPalette.jsx` (line 184)

---

### 5. **AdminWebhooks.jsx** (1 finding)

| Line | Hardcoded String | Context | Severity |
|------|------------------|---------|----------|
| 591 | `Odeslat testovaci udalost` | Title attribute on test button | HIGH |

**Files affected:**
- `/Model_Pricer-V2-main/src/pages/admin/AdminWebhooks.jsx` (line 591)

---

### 6. **OrderExportActions.jsx** (1 finding)

| Line | Hardcoded String | Context | Severity |
|------|------------------|---------|----------|
| 975 | `Hromadny email — ${count} objednavek` | Modal title (hardcoded prefix) | HIGH |
| 976 | `Odeslat (${selectedOrders...})` | Confirmation button text | HIGH |

**Files affected:**
- `/Model_Pricer-V2-main/src/pages/admin/components/OrderExportActions.jsx` (lines 975, 976)

---

### 7. **PricingShareMenu.jsx** (1 finding)

| Line | Hardcoded String | Context | Severity |
|------|------------------|---------|----------|
| 421 | `Odeslat emailem` | Menu item label | MEDIUM |

**Files affected:**
- `/Model_Pricer-V2-main/src/pages/test-kalkulacka/components/PricingShareMenu.jsx` (line 421)

---

## Context: Existing Translation Keys (Already in LanguageContext)

For reference, these keys **already exist** in LanguageContext.jsx:

- `'calc.checkout.submit': 'Odeslat objednavku'` (line 548)
- `'calc.checkout.submitting': 'Odesílám...'` (line 549)
- `'lang.switch': 'Prepnout jazyk'` (line 714)

This confirms the pattern: UI strings **should** be in the translation dictionary, not hardcoded.

---

## Recommendations

### Priority 1 (Critical) — Fix these immediately
All HIGH severity items in:
- AdminOrderDetail.jsx (cancel/confirm buttons, email labels)
- LayoutSwitcher.jsx (dialog text and buttons)
- AdminEmails.jsx (test button and status label)
- AdminWebhooks.jsx (test button title)
- OrderExportActions.jsx (batch email dialog)

### Priority 2 (Should fix) — MEDIUM severity
- AdminEmails.jsx section headings
- CommandPalette.jsx descriptions
- PricingShareMenu.jsx menu items

### Implementation Steps

1. **Add missing keys to LanguageContext.jsx** Czech and English translations
2. **Replace hardcoded strings** with `t()` calls or ternary language checks
3. **Follow existing patterns:**
   - Use `{ language === 'cs' ? 'Czech text' : 'English text' }` for conditional rendering
   - Or use `t('key.name')` with translations defined in LanguageContext
4. **Test both language modes** (CS and EN) in affected components

---

## Files to Update (Prioritized)

1. `/Model_Pricer-V2-main/src/pages/admin/AdminOrderDetail.jsx` (6 strings)
2. `/Model_Pricer-V2-main/src/pages/admin/AdminEmails.jsx` (5 strings)
3. `/Model_Pricer-V2-main/src/pages/admin/builder/components/LayoutSwitcher.jsx` (3 strings)
4. `/Model_Pricer-V2-main/src/pages/admin/components/OrderExportActions.jsx` (2 strings)
5. `/Model_Pricer-V2-main/src/pages/admin/components/CommandPalette.jsx` (1-2 strings)
6. `/Model_Pricer-V2-main/src/pages/admin/AdminWebhooks.jsx` (1 string)
7. `/Model_Pricer-V2-main/src/pages/test-kalkulacka/components/PricingShareMenu.jsx` (1 string)

---

## Additional Notes

- No hardcoded strings found in public pages (home, pricing, support)
- Widget kalkulacka (`test-kalkulacka-white`) uses proper i18n patterns
- Order tracking page uses ternary language checks correctly
- Support page uses proper conditional rendering

**Status:** Audit complete. Ready for translation sprint.
