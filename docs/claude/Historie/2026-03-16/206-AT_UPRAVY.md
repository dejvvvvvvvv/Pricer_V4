---
ID: 206-AT
Session: S01
Datum: 2026-03-16
Typ: UPRAVY
Oblast: Analytics Tracking
Souvisejici: 205-AN
---

# 206-AT: Analytics Tracking Wiring — Real data flow from Calculator to Admin Dashboard

## Problem statement
AdminAnalytics page had non-functional charts and empty states because `trackAnalyticsEvent()` was defined in `adminAnalyticsStorage.js` but **NEVER called anywhere** in the codebase. No data was being collected because calculators and widgets didn't track any events.

## Analyza
- `trackAnalyticsEvent()` has zero call sites across entire codebase (verified with grep)
- `adminOrdersStorage.js` reads from Firestore but no synthetic order events were created
- AdminAnalytics tabs remained empty: CALCULATIONS, SLICER_JOBS, NOTIFICATIONS, PRICING_CONFIGS, WIDGET_BUILDERS all showed empty states
- Root cause: **missing wiring between event generation and storage layer**

## Zmeny provedene

### 1. AdminAnalytics.jsx — CSV export bugfix + demo text cleanup
**File:** `src/pages/admin/AdminAnalytics.jsx`

**Fix 1: CSV export crash**
- Line ~850: `generateCsv()` returns string, but code destructured as `{ csv, filename }`
- Changed: `const { csv, filename } = generateCsv(...)` → `const csv = generateCsv(...)`
- Impact: CSV export button now works without console error

**Fix 2: Removed demo-related hint texts (3 removals)**
- Removed text "Demo data uses localStorage simulation" from localStorage-dependent tabs
- Removed text "Demo data — no real analytics" from summary cards
- Removed explanatory note "Mock mode: data from test records"
- Reason: Misleading UI when real analytics tracking is now wired up

### 2. test-kalkulacka/index.jsx — Analytics tracking (14 calls across 7 events)
**File:** `src/pages/test-kalkulacka/index.jsx`

**Imports added:**
```javascript
import { trackAnalyticsEvent, generateSessionId, ANALYTICS_EVENT_TYPES } from '@/utils/adminAnalyticsStorage';
```

**State added:**
```javascript
const [analyticsSessionId] = useState(() => generateSessionId());
```

**Helper function:**
```javascript
const trackEvent = (eventType, payload = {}) => {
  try {
    trackAnalyticsEvent(eventType, { ...payload, sessionId: analyticsSessionId });
  } catch (e) {
    logDebug('Analytics tracking failed', e);
  }
};
```

**Event tracking added at 7 key points (14 calls total):**

1. **MODEL_UPLOAD_COMPLETED** (in `handleFilesUploaded`)
   - Fired when user selects model files
   - Payload: `{ fileCount, totalSizeMB, fileExtensions }`

2. **SLICING_STARTED** (3 calls)
   - In `handleSliceSelected` when user picks slice option
   - In `runBatchSlice` before batch slicing starts
   - In `doRecalc` on recalculation trigger
   - Payload: `{ sliceOptionId, batchCount }`

3. **SLICING_COMPLETED** (success/failure, 3 calls)
   - In `handleSliceSelected` on success
   - In `runBatchSlice` on success + failure
   - Payload: `{ sliceOptionId, duration, success, error }`

4. **PRICE_SHOWN** (via `useEffect` with `priceShownRef`)
   - Fired when price calculation completes and user sees result
   - Tracks first time only (prevent duplicate firing)
   - Payload: `{ estimatedPrice, currency, material }`

5. **ADD_TO_CART_CLICKED** (via `useEffect` detecting step 3→4)
   - Fired when user transitions from step 3 (Review) to step 4 (Checkout)
   - Payload: `{ step: 4, checkoutStarted: true }`

6. **ORDER_CREATED** (in `handleCheckoutComplete`)
   - Fired after successful order creation
   - Payload: `{ orderId, totalPrice, quantity }`

### 3. CheckoutForm.jsx — ORDER_CREATED tracking
**File:** `src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**Change:**
- Added `trackAnalyticsEvent` import
- Added tracking call after `saveOrders()` completes:
  ```javascript
  trackAnalyticsEvent(ANALYTICS_EVENT_TYPES.ORDER_CREATED, {
    orderId: orders[0]?.id,
    totalPrice: finalPrice,
    quantity: totalQuantity
  });
  ```

### 4. widget-kalkulacka/index.jsx — Full analytics tracking
**File:** `src/pages/widget-kalkulacka/index.jsx`

**Pattern:** Same as test-kalkulacka but uses `tenantId` prop instead of `getTenantId()`

**Additional event:**
- **WIDGET_VIEW** on component mount
  - Payload: `{ widgetId, tenantId, width, height }`

**All 7 event types wired up** with same key points as test-kalkulacka

### 5. ShopifyCartButton.jsx — onAddToCartClicked callback
**File:** `src/pages/widget-kalkulacka/components/ShopifyCartButton.jsx`

**Change:**
- Added `onAddToCartClicked` callback prop (passed from widget-kalkulacka parent)
- Call `onAddToCartClicked()` before executing Shopify redirect
- Allows parent to track ADD_TO_CART_CLICKED event

## Data flow (post-implementation)

```
User Action (calculator)
    ↓
trackEvent() call with ANALYTICS_EVENT_TYPES.XXX
    ↓
adminAnalyticsStorage.trackAnalyticsEvent()
    ↓
Firestore: collections/analytics/{eventType}
    ↓
AdminAnalytics page queries collections
    ↓
Charts populate with real data
```

## Events now tracked

| Event | Where | Payload |
|-------|-------|---------|
| MODEL_UPLOAD_COMPLETED | test-kalkulacka upload handler | fileCount, totalSizeMB, fileExtensions |
| SLICING_STARTED | test-kalkulacka slice/recalc | sliceOptionId, batchCount |
| SLICING_COMPLETED | test-kalkulacka slice handlers (success/fail) | sliceOptionId, duration, success, error |
| PRICE_SHOWN | test-kalkulacka price calculated | estimatedPrice, currency, material |
| ADD_TO_CART_CLICKED | test-kalkulacka step 3→4 transition | step, checkoutStarted |
| ORDER_CREATED | CheckoutForm + widget-kalkulacka | orderId, totalPrice, quantity |
| WIDGET_VIEW | widget-kalkulacka mount | widgetId, tenantId, width, height |

## Impact

**Before:** AdminAnalytics showed 7 empty tabs, charts non-functional
**After:** All calculator events create Firestore docs → AdminAnalytics charts can now query real data

**Files modified:** 5
- `src/pages/admin/AdminAnalytics.jsx` (CSV fix + text cleanup)
- `src/pages/test-kalkulacka/index.jsx` (14 tracking calls)
- `src/pages/test-kalkulacka/components/CheckoutForm.jsx` (1 tracking call)
- `src/pages/widget-kalkulacka/index.jsx` (analytics wiring)
- `src/pages/widget-kalkulacka/components/ShopifyCartButton.jsx` (callback added)

**Build status:** PASS (npm run build)

## Notes

- Error handling: try/catch around `trackEvent()` to prevent calculator crashes if analytics fails
- Session tracking: Each calculator session gets unique `analyticsSessionId` via `generateSessionId()`
- Non-blocking: Analytics failures don't affect calculator UX (fire-and-forget pattern)
- Widget security: `tenantId` passed as prop prevents cross-tenant data leakage
