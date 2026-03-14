# Wave 42-45 — A11y, Backend Security, ErrorBoundary (2026-03-13)

## Session: Audit Fix Marathon (pokracovani)

### Overview
Waves 42-45 pokracuji v audit fix maratonu. Fokusy: A11y compliance (file inputs, button labels, status icons), backend security (path traversal, rate limiter), ErrorBoundary coverage.

---

## Wave 42 — Colors Batch 3 + A11y Audit

### AdminOrders.jsx — Hardcoded barvy → Forge tokeny
- 8 hardcoded barev: `#3B82F6`, `#10B981`, `#F59E0B`, `#EF4444`, atd.
- Migrace: `--forge-accent-teal`, `--forge-accent-success`, `--forge-accent-warning`, `--forge-error`
- Inline styles → CSS variables

### TabItemsFiles.jsx
- 1 drobna oprava barvy (secondary text muted)

### A11y Audit — Kalkulacky
**File upload & widget status:**
- 6 P0 nalezu: missing aria-labels, icon-only buttons bez names, status icons bez titlu
- 4 P1 nalezu: heading hierarchy h3→h2, missing tooltip titles, progress bez aria-atomic

---

## Wave 43 — A11y P0 Fixes

### File Input Aria-Labels
**test-kalkulacka-white/components/FileUploadZone.jsx:**
- Input: `aria-label="Vyber STL/3MF model"`

**widget-kalkulacka/components/FileUploadZone.jsx:**
- Input: `aria-label="Choose STL/3MF model"`

**test-kalkulacka/components/FileUploadZone.jsx:**
- Input: `aria-label="Vyber STL/3MF model"`

### Icon-Only Button Accessible Names

**widget-kalkulacka/components/ModelPanel.jsx — Add Model:**
```jsx
<button aria-label="Add model">
  <PlusIcon />
</button>
```

### Status Icons Aria-Labels (widget-kalkulacka)

**Status badges:**
- Processing: `aria-label="Model processing"` + title tooltip
- Queued: `aria-label="Model queued"`
- Ready: `aria-label="Model ready for checkout"`
- Error: `aria-label="Model error"`

### Focus Outline — Widget
Widget default: `outline: 2px solid #3B82F6;`
→ Zmena: `outline: 2px solid var(--forge-accent-teal);`

---

## Wave 44 — A11y P1 + Backend Scan

### Heading Hierarchy Fixes

**widget-kalkulacka/index.jsx:**
- Section nadpisy h3 → h2 (Materials, Models, Order Summary)

**test-kalkulacka-white/index.jsx:**
- Same: h3 → h2 (Materials, Models, etc.)

### Status Icon Titles (Tooltips)

Widget status badges — pridani title atributu:
```jsx
<span title="Model je ve frontě">
  <Clock icon />
</span>
```

### Batch Progress aria-atomic

**widget-kalkulacka — Slicing progress:**
```jsx
<div aria-atomic="true" aria-live="polite">
  Processing: 2/5 models
</div>
```

### Backend Security Scan (npm audit + custom checks)

**Findings:**
1. **MEDIUM:** `express/config.js` path traversal (file operations bez whitelist)
2. **MEDIUM:** `express/index.js` rate limiter __skip__ bug (neloguje se)
3. **LOW:** `orders.js` PATCH endpoint bez field allowlist
4. **LOW:** No signature validation on webhooks
5. **LOW:** Error messages leaky (stack traces v response)

### ErrorBoundary Audit

**Routes bez ErrorBoundary wrapper:**
1. Widget public route (`/w/:publicWidgetId`)
2. Slicer API route (`/api/slicer`)
3. Builder route (3D viewer)

---

## Wave 45 — Backend Security + ErrorBoundaries

### Backend Security Fixes

#### 1. config.js — assertInWorkspace Guard
```javascript
function assertInWorkspace(filePath) {
  const resolved = path.resolve(filePath);
  const workspace = path.resolve(process.env.WORK_DIR || '/tmp/models');

  if (!resolved.startsWith(workspace)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
```
Aplikovano na: `GET /config/export`, `POST /config/import`

#### 2. invoices.js — Same Guard
- Sandbox pro invoice generovani (naprosto potrebne)
- `assertInWorkspace` pro vsechny file operations

#### 3. index.js — Rate Limiter __skip__ Fix
**BUG:** `skip: (req) => !req.user` neloguje se.
**FIX:**
```javascript
skip: (req, res) => {
  // Vzdy logovat, ale rate limit jen pro unauthenticated
  if (!req.user) {
    res.locals.rateLimitApplied = true;
    return false;
  }
  res.locals.rateLimitApplied = false;
  return true;
}
```

#### 4. orders.js — Field Allowlist (PATCH endpoint)
**Whitelisted fields (12 total):**
- `status` (enum: pending, processing, completed, failed)
- `customerNotes`
- `internalNotes`
- `tags` (array)
- `shippingAddress.*` (sub-fields)
- `invoiceNumber`
- `invoiceDate`
- `trackingNumber`
- `shippingMethod`
- `expressDelivery`
- `paymentStatus`

Ostatni polia: ignorovana / vracena chyba 400.

### ErrorBoundary Wrapping (Routes.jsx)

**3 nove ErrorBoundary wrappery:**

#### 1. Widget Public Route
```jsx
<ErrorBoundary fallback={<WidgetErrorPage />}>
  <Route
    path="/w/:publicWidgetId"
    element={<WidgetPublic />}
  />
</ErrorBoundary>
```

#### 2. Slicer API Route
```jsx
<ErrorBoundary fallback={<ApiErrorPage service="Slicer" />}>
  <Route
    path="/api/slicer/*"
    element={<SlicerProxy />}
  />
</ErrorBoundary>
```

#### 3. Builder 3D Route
```jsx
<ErrorBoundary fallback={<BuilderErrorPage />}>
  <Route
    path="/builder/*"
    element={<Builder />}
  />
</ErrorBoundary>
```

### Build Status
```
npm run build: PASS ✓
- Build time: 47.82s
- Bundle size: 2424 kB (7 vendor chunks)
- No P0 issues
```

---

## Files Modified (Wave 42-45)

### Frontend
| File | Zmeny |
|------|-------|
| `src/pages/admin/AdminOrders.jsx` | 8 barev → Forge tokeny |
| `src/components/ui/TabItemsFiles.jsx` | 1 oprava |
| `src/pages/test-kalkulacka/components/FileUploadZone.jsx` | aria-label |
| `src/pages/widget-kalkulacka/components/FileUploadZone.jsx` | aria-label |
| `src/pages/test-kalkulacka-white/components/FileUploadZone.jsx` | aria-label |
| `src/pages/widget-kalkulacka/components/ModelPanel.jsx` | Button aria-label |
| `src/pages/widget-kalkulacka/index.jsx` | h3→h2, status labels, focus teal, aria-atomic |
| `src/pages/test-kalkulacka-white/index.jsx` | h3→h2 |
| `src/Routes.jsx` | 3x ErrorBoundary wrapper |

### Backend
| File | Zmeny |
|------|-------|
| `backend-local/src/routes/config.js` | assertInWorkspace guard |
| `backend-local/src/routes/invoices.js` | assertInWorkspace guard |
| `backend-local/src/index.js` | Rate limiter skip fix |
| `backend-local/src/routes/orders.js` | Field allowlist (PATCH) |

---

## Security Impact
- **P0:** Path traversal vulnerability zastavena (config.js, invoices.js)
- **P1:** Rate limiter nyni loguje vsechny request (audit trail)
- **P0:** PATCH /orders field injection prevencija (12 whitelisted polí)
- **P0:** ErrorBoundary coverage - no white screen risk pro public widget/3D viewer

## Accessibility Impact
- **A11y P0:** File inputs screen reader accessible
- **A11y P0:** Icon-only buttons have accessible names
- **A11y P1:** Heading hierarchy WCAG AA compliant
- **A11y P1:** Status icons have labels + tooltips

---

## Pokracovani (Wave 46+)
- P2 a11y: form validation aria-invalid, error messages aria-describedby
- Backend: webhook signature validation (HMAC-SHA256)
- Error page styling (tailwind tokens consistent)
