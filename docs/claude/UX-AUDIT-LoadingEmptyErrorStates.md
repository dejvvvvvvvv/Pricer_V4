# UX Audit: Loading / Empty / Error States — Admin Pages
**Date:** 2026-03-13
**Scope:** AdminAnalytics, AdminEmails, AdminShipping, AdminSettings
**Status:** Research only (no changes)

---

## Summary

Audit of 4 major admin pages for missing or incomplete loading/empty/error state UX patterns. Findings show **inconsistent patterns** across pages:

- **AdminAnalytics:** No loading skeleton shown during initial data load
- **AdminEmails:** Loading spinner present (✓), but no empty state for templates/log
- **AdminShipping:** Loading skeleton for config (✓), no empty state for methods
- **AdminSettings:** No loading state, but no empty state needed (always has defaults)

---

## Detailed Findings

### 1. AdminAnalytics.jsx
**File:** `/src/pages/admin/AdminAnalytics.jsx` (2,300+ lines)

**Loading State:**
- ❌ **MISSING** — No skeleton/spinner shown while data loads
- Component does NOT have a loading state hook (no `const [loading, setLoading]`)
- Data loads synchronously from `getAnalyticsSessions()`, `computeOverview()`, `loadOrders()`
- Risk: If data load becomes async, UI will render stale/empty data with no loading feedback

**Empty State:**
- ⚠️ **PARTIAL** — MiniSeriesTable has empty row fallback:
  ```jsx
  {safeSeries.length === 0 ? (
    <tr><td colSpan={2} className="aa-muted">{noDataText || 'No data'}</td></tr>
  ) : (...)}
  ```
- But main chart areas (AnalyticsCharts) and tab panels do NOT check for empty data
- Missing: "No analytics data yet" messaging when no orders exist

**Error State:**
- ❌ **MISSING** — No try-catch or error boundary
- If `getAnalyticsSessions()` throws, entire page crashes

**Recommendations:**
1. Add loading state hook + skeleton during data load (even though currently sync)
2. Add empty state for when `overview.total_orders === 0`
3. Add error boundary or try-catch in useEffect
4. Show spinner in AnalyticsCharts component while computing

---

### 2. AdminEmails.jsx
**File:** `/src/pages/admin/AdminEmails.jsx` (1,600+ lines)

**Loading State:**
- ✓ **PRESENT** — Shows loading spinner at lines 338–348:
  ```jsx
  if (loading) {
    return (
      <div className="ae-page">
        <div className="ae-card">
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="Loader2" size={18} className="ae-spin" />
            <span>{cs ? 'Nacitam...' : 'Loading...'}</span>
          </div>
        </div>
      </div>
    );
  }
  ```
- Triggered during `useEffect` → `loadEmailConfigV1()`, `loadEmailTemplates()`, etc.

**Empty State:**
- ❌ **MISSING** — Log Tab:
  - No "No emails sent yet" message when `emailLog.length === 0`
  - Table just renders empty `<tbody>`

- ❌ **MISSING** — Template List (sidebar):
  - Always shows templates (seeded with defaults), but no fallback UI

- ❌ **MISSING** — Auto-send Rules Tab:
  - If `autoSendRules.length === 0`, no messaging that rules can be added

**Error State:**
- ⚠️ **PARTIAL** — useEffect catch at lines 133–136:
  ```jsx
  } catch (e) {
    debug('[AdminEmails] Failed to init', e);
    setLoading(false);
    setBanner({ type: 'error', text: csRef.current ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.' });
  }
  ```
- Shows error banner, but page still renders normally (safe fallback)

**Recommendations:**
1. Add "No emails sent yet" empty state in Log tab when `emailLog.length === 0`
2. Add "No auto-send rules configured" empty state when `autoSendRules.length === 0`
3. Consider disabling "Test Email" button if no provider configured

---

### 3. AdminShipping.jsx
**File:** `/src/pages/admin/AdminShipping.jsx` (1,400+ lines)

**Loading State:**
- ✓ **PRESENT** — Loading handled at lines 56–81:
  ```jsx
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;
    try {
      const cfg = loadShippingConfigV1();
      if (!isMounted) return;
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      if (cfg.methods?.length) setSelectedMethodId(cfg.methods[0].id);
      setLoading(false);
    } catch (e) {
      ...
      setLoading(false);
    }
  ```
- However, skeleton is NOT shown during loading (just synchronous, similar to Analytics)
- Recommend: Check if page imports `SkeletonCard` or `SkeletonTable` — it does import them at line 17, but never uses them

**Empty State:**
- ❌ **MISSING** — If `config.methods.length === 0`:
  - Page renders empty method list with no "Add your first shipping method" guidance
  - Left sidebar shows empty, right panel shows nothing

- ❌ **MISSING** — If no method selected:
  - Right panel should show "Select a method to edit" instead of blank space

**Error State:**
- ✓ **PRESENT** — Error banner at lines 73–77:
  ```jsx
  catch (e) {
    debug('[AdminShipping] Failed to init', e);
    if (!isMounted) return;
    setBanner({ type: 'error', text: cs ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.' });
    setLoading(false);
  }
  ```
- Shows banner but page still renders (safe)

**Recommendations:**
1. Show skeleton/placeholder card while loading (even though sync now)
2. Add empty state: "No shipping methods. Add your first method" with CTA button
3. Show "Select a method to edit" placeholder in right panel when `selectedMethod === null`
4. Actually use imported `SkeletonCard` / `SkeletonTable` during loading

---

### 4. AdminSettings.jsx
**File:** `/src/pages/admin/AdminSettings.jsx` (606 lines)

**Loading State:**
- ⚠️ **NOT NEEDED** — Settings are loaded synchronously on mount:
  ```jsx
  const [settings, setSettings] = useState(() => loadSettings());
  ```
- No async API call, so no loading state needed
- Acceptable pattern for local storage

**Empty State:**
- ⚠️ **NOT NEEDED** — Settings always have defaults:
  ```jsx
  function getDefaultSettings() {
    return {
      currency: 'CZK',
      language: 'cs',
      timezone: 'Europe/Prague',
      // ... 15+ fields
    };
  }
  ```
- No scenario where settings are "empty"
- Acceptable pattern

**Error State:**
- ⚠️ **NOT FULLY COVERED** — `handleSave()` at lines 187–193 has no error handling:
  ```jsx
  const handleSave = useCallback(() => {
    saveSettings(settings);  // ← could throw, no try-catch
    setDirty(false);
    setSaved(true);
    // ...
  }, [settings]);
  ```
- If `saveSettings()` fails, user sees no feedback

**Recommendations:**
1. Add try-catch around `saveSettings()` in `handleSave()` with error toast
2. Add try-catch around other data mutation functions (`handleClearOrders`, etc.)
3. Consider adding a "Saved" toast for user feedback (already done for factory reset)

---

## Cross-Page Patterns

| Page | Loading | Empty | Error |
|------|---------|-------|-------|
| **AdminAnalytics** | ❌ Missing | ⚠️ Partial | ❌ Missing |
| **AdminEmails** | ✓ Present | ❌ Missing | ⚠️ Partial |
| **AdminShipping** | ⚠️ Not shown | ❌ Missing | ✓ Present |
| **AdminSettings** | ✓ Not needed | ✓ Not needed | ❌ Missing |

---

## Micro-UX Patterns in Use

### Loading Skeletons
- **Imported:** `SkeletonCard`, `SkeletonTable` from `src/components/ui/forge/ForgeSkeleton`
- **Usage:** AdminShipping imports but doesn't use them
- **Recommendation:** Create standard skeleton for admin pages (card-based, table-based, placeholder text)

### Empty States
- **Pattern:** None standardized in codebase
- **Recommendation:** Create `EmptyState` component with:
  - Icon
  - Title (cs/en)
  - Description
  - Optional CTA button
  - Centered, ~200px height

### Error States
- **Pattern:** Banner at top with icon + text
- **Style:** `{type: 'error', text: 'message'}`
- **Usage:** AdminEmails, AdminShipping
- **Improvement:** Add icon, make dismissible, auto-hide after 5s

### Success Feedback
- **Pattern:** Toast at bottom-right
- **Usage:** AdminSettings (toastStyle at lines 139–155)
- **Improvement:** Standardize across all pages

---

## Hot Spots (Micro-UX Improvements)

### 1. Calculator Loading States
**Context:** 3D upload + slicing can take 5–10 seconds

**Current State:**
- `/src/pages/test-kalkulacka/index.jsx` (800+ lines) — check for loading states during:
  - Model upload
  - Model processing/slicing
  - Price calculation
  - Form validation

**Status:** Not scanned in this audit (out of scope)

### 2. Order List Empty States
**Context:** Admin Orders page shows orders in table/kanban

**Current State:**
- Need to verify empty state for "No orders yet"
- Need spinner while fetching order list

**Status:** Not scanned (would need to check AdminOrders.jsx)

### 3. Model Upload Progress
**Context:** Public `/model-upload` page

**Current State:**
- Need upload progress bar
- Need success state after upload
- Need error state if upload fails

**Status:** Not scanned (would need to check public pages)

---

## Recommendations (Priority Order)

### P0 — Critical UX Gaps

1. **AdminAnalytics:**
   - Add loading skeleton while data computes
   - Add empty state "No orders yet" when `total_orders === 0`
   - Wrap data loading in try-catch

2. **AdminEmails:**
   - Add empty state in Log tab when `emailLog.length === 0`
   - Add empty state in Auto-send tab when no rules
   - Disable Test Email button if provider not configured

3. **AdminShipping:**
   - Add empty state "No shipping methods" with CTA button
   - Add "Select a method to edit" placeholder in right panel
   - Use imported skeletons during loading

4. **AdminSettings:**
   - Add try-catch error handling around `saveSettings()`, data mutations
   - Show error toast if any operation fails
   - Standardize with "Changes saved" + success sound

### P1 — Consistency Improvements

1. Create standardized `<EmptyState />` component (icon + title + description + button)
2. Create standardized `<SkeletonLoader />` for admin pages (card vs table variants)
3. Standardize error/success toast styles and timing
4. Document micro-UX patterns in `docs/claude/Documentation/` (if not exists)

### P2 — Polish

1. Add loading animation to AnalyticsCharts during computation
2. Add progressive loading (show partial data while computing rest)
3. Add "Help" tooltips for empty states (e.g., "Why is Log empty?")

---

## File References

| File | Lines | Status |
|------|-------|--------|
| `src/pages/admin/AdminAnalytics.jsx` | 2,300+ | Needs loading + empty + error |
| `src/pages/admin/AdminEmails.jsx` | 1,600+ | Has loading, needs empty + error |
| `src/pages/admin/AdminShipping.jsx` | 1,400+ | Has loading, needs empty state |
| `src/pages/admin/AdminSettings.jsx` | 606 | Has save feedback, needs error handling |
| `src/components/ui/forge/ForgeSkeleton.jsx` | — | Component exists, under-used |

---

## Next Steps (For Implementation)

1. **Create design spec** for empty/error/loading states (mp-mid-design-system or mp-spec-design-a11y)
2. **Create components** (EmptyState, SkeletonLoader variants) if not exists
3. **Delegate to frontend agents:**
   - AdminAnalytics → mp-mid-frontend-admin (add loading + empty + error)
   - AdminEmails → mp-mid-frontend-admin (add empty states)
   - AdminShipping → mp-mid-frontend-admin (add empty state)
   - AdminSettings → mp-mid-frontend-admin (add error handling)
4. **Testing:** Verify each state by:
   - Blocking API calls (to see loading)
   - Clearing localStorage (to see empty)
   - Throwing errors (to see error states)

---

## Scope Note

This audit covered **loading / empty / error states only**. Not included:
- Visual design review
- Accessibility (ARIA, keyboard nav, focus states) — use mp-spec-design-a11y
- Performance optimization
- Error message copy/clarity
- Success feedback timing

For design system review, escalate to: **mp-sr-design**
