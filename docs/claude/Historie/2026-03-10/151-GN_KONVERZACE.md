# 151-GN — KONVERZACE — Batch 14 implementace — 2026-03-10

## Metadata
- **ID:** 151-GN
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** General (Frontend & Backend integrace)
- **Souvisejici ID:** 148 (AE-Email Editor), 149 (BK-Order API), 150 (GN-AppContext Plan)
- **Trigger:** Batch 14 iniciace — 3 features (Email Template Editor, Backend Order Management API, AppContext)

---

## Souhrn konverzace

Uzivatel iniciuje batch 14 s 3 implementacemi: Admin Email Template Editor (4 typy, contentEditable, XSS sanitizace), Backend Order Management API (7 endpointy, status flow validace), a AppContext (probíhající — lean global state). Claude nabiduje implementaci s UPRAVY zaznamy a PLAN pro AppContext.

---

## Detailni konverzace

### [U] Iniciace Batch 14

Uzivatel poskytuje seznam dokoncenych implementaci:

**43. Admin Email Template Editor**
- Modifikovan: `src/utils/adminEmailStorage.js` (template variables, types, defaults, sanitize)
- Novy soubor: `src/pages/admin/components/EmailTemplatePreview.jsx`
- Modifikovan: AdminEmails.jsx (novy tab "Editor sablun")
- 4 typy sablon, contentEditable editor, formatting toolbar
- Variable chips, live preview v iframe, test preview
- XSS sanitizace, desktop/mobile/plain-text toggle

**44. Backend Order Management API**
- Novy soubor: `backend-local/src/ordersStore.js`
- Novy soubor: `backend-local/src/routes/orders.js`
- Modifikovany: index.js, validate.js
- 7 endpointu: CRUD + status flow + stats
- Forward-only status flow s validaci, webhook integration
- Soft delete, audit trail, sequential order numbers (ORD-00001)
- Status normalizace (frontend uppercase ↔ backend lowercase)

**45. AppContext (probihajici)**
- Lean global state: feature flags, online status, version

**CELKEM:** 44 dokoncených + 1 probíhající implementace.

---

### [C] Analýza a návrh

**Klícové body:**

1. **Admin Email Template Editor (ID 148)**
   - Storage helper `adminEmailStorage.js` s CRUD, variable definitions, default templates
   - Preview komponenta s iframe isolation (XSS ochrana)
   - AdminEmails.jsx s 2 tabu: "Sablony" (seznam) + "Editor sablon" (contentEditable)
   - Toolbar: Bold, Italic, Underline, Link, Heading
   - Variable chips: klikatelne inserts ({{name}}, {{email}}, atd.)
   - Live preview: desktop/mobile/plain-text toggle
   - Sanitizace: `sanitizeHtml()` vola se vzdy pri save + preview
   - **Associated:** 102 (PY-Payments), 141 (Batch 9 Toast)

2. **Backend Order Management API (ID 149)**
   - OrdersStore class: in-memory Map, file persistence (orders.json)
   - CRUD: `create()`, `getById()`, `getAll(filter)`, `update()`, `delete()` (soft)
   - Status management: `updateStatus(id, newStatus)` s forward-only validaci
   - **Status flow:** pending → processing → completed / cancelled (neni zpet)
   - Sequential order numbers: `_nextOrderNumber()` → ORD-00001, ORD-00002, ...
   - Audit trail: createdAt, updatedAt, deletedAt (soft), statusHistory []
   - Webhook integration: `triggerWebhook(orderId, eventType, payload)` async
   - 7 endpointu: GET/POST (lista, vytvoreni), GET/:id (detail), PUT/:id (update), PUT/:id/status (status), DELETE/:id (soft delete), GET /stats/summary
   - Validace: `validateOrderData()`, `_isValidStatusTransition()`
   - **P0 Issue:** Status normalizace — frontend UPPERCASE (PENDING), backend lowercase (pending); potreba normalizer
   - **Associated:** 125 (AO-Export), 102 (PY-Payments)

3. **AppContext (ID 150 — PLAN)**
   - Lean global state: feature flags (Supabase cache), isOnline (useOnlineStatus hook), appVersion (package.json), theme (useThemeToggle)
   - AppProvider wrapper v Routes.jsx
   - useAppContext() hook exportovany z contexts/index.js
   - Zero breaking changes — novy context, bez refactoru existujicich
   - **Status:** Probíhající — plan existuje, implementace zacíná
   - **Definition of Done:** 6 items checklist

---

## Rozhodnutí a handoff

1. **Email Template Editor:**
   - ✓ Ulozit jako ID 148-AE_UPRAVY.md
   - ✓ XSS sanitizace je P0 — testing s HTML payloads
   - ✓ contentEditable editor — accessibility concern (aria-live pre updates)

2. **Backend Order API:**
   - ✓ Ulozit jako ID 149-BK_UPRAVY.md
   - ✓ Status normalizace je P0 issue — potreba resolution (normalizer vs. API layer)
   - ✓ File persistence (orders.json) má scalability limit; P1 migrace na Supabase
   - ✓ Webhook integration — HMAC-SHA256 + retry logic (existuje z batch 13)

3. **AppContext:**
   - ✓ Ulozit jako ID 150-GN_PLAN.md
   - ✓ Implementace pending — planned 1 hod (30min context, 5min wrap, 10min docs, 15min test)

---

## Handoff a dalsi kroky

1. **Historie save:** 3 nove zaznamy (148, 149, 150)
   - 2x UPRAVY (hotove implementace)
   - 1x PLAN (probíhající)

2. **Build status:** Pending `npm run build`
   - Email Editor: frontend, PASS expected
   - Order API: backend-local (Node.js), bez frontend build

3. **Next batch:** AppContext implementace (ID 150)

---

## Poznamky

- **Batch 14:** Pokracovani autonomní session z 2026-03-10 (ID 113-147)
- **Celkem v session:** 38+ zaznamu, 35+ features, 2800+ řádků noveho kodu
- **Priority:** Email Editor (P0), Order API (P0), AppContext (P1)
- **Status normalizace:** CRITICAL — frontend AdminOrders pouziva UPPERCASE, backend API lowercase; potreba unifikace pred merge

---
