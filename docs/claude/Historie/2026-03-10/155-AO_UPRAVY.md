# 155-AO — UPRAVY — Batch 16: Admin Order Detail Page — 2026-03-10

## Metadata
- **ID:** 155-AO
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin-Orders
- **Souvisejici ID:** 154 (Onboarding Tour), 156 (Admin Customers), 101 (Admin Orders fixes)
- **Trigger:** Autonomní implementace — Batch 16 z planu 115-151

---

## Souhrn uprav

Implementace detailní stránky pro jednotlivou objednávku v Admin sekci. Nová komponenta AdminOrderDetail.jsx s kompletním přehledem: vertikální status timeline, tabulka položek s cenami, pricing breakdown, customer info, editovatelné poznámky, activity log a akce (změna stavu, tisk souhrnu, zrušení objednávky).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminOrderDetail.jsx | Novy soubor | 1-580 | Detail stránka objednávky se status timeline, items, pricing, customer info, notes, activity log |
| 2 | src/pages/admin/AdminOrders.jsx | Zmeneno | 120-145 | Přidání onClick handleru na řádky tabulky → otevření modal s AdminOrderDetail |
| 3 | src/components/ui/forge/OrderDetailModal.jsx | Novy soubor | 1-95 | Modal wrapper pro AdminOrderDetail s close button a full-screen layout |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminOrderDetail.jsx`

**Typ:** Nový soubor
**Radky:** 1-580
**Duvod:** Poskytnutí kompletního přehledu jednotlivé objednávky s možností editace a akcí.

**Co se zmenilo:**
- Props: `orderId` (z URL param nebo modal), `onClose` callback
- useEffect fetch: GET `/api/orders/:orderId` → populace state
- Vertikální status timeline: 6 stavů (pending/processing/printing/completed/shipped/cancelled), ikony (Zásuvka/Tiskárna/Kontrola/Checkmark/Truck/X)
- Items tabulka: product name, quantity, unit price, total, filament color
- Pricing breakdown: material cost, labor, tax, shipping, discount, total — kartou (Forge design)
- Customer info: jméno, email, adresa (z orders_customers join)
- Editable notes: textarea s Save button, validace, toast feedback
- Activity log: tabulka s timestamp, action, user, details (GET `/api/orders/:orderId/activity`)
- Akce tlačítka: "Změnit stav" (dropdown), "Tisk souhrnu" (window.print), "Zrušit objednávku" (confirm dialog, soft delete)
- CSS: responsive grid pro desktop/tablet/mobile, sticky headers na tabulkách

---

### 2. `src/pages/admin/AdminOrders.jsx`

**Typ:** Zmeneno
**Radky:** 120-145
**Duvod:** Přidání interaktivity — klik na řádek otevře detail.

**Co se zmenilo:**
- Import: `import OrderDetailModal from '@/components/ui/forge/OrderDetailModal'`
- State: `const [selectedOrderId, setSelectedOrderId] = useState(null)`
- onClick na `<tr key={order.id} onClick={() => setSelectedOrderId(order.id)}>` (cursor: pointer)
- Render modalu: `{selectedOrderId && <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />}`

---

### 3. `src/components/ui/forge/OrderDetailModal.jsx`

**Typ:** Nový soubor
**Radky:** 1-95
**Duvod:** Modální wrapper pro AdminOrderDetail s konsistentním UI a close logikou.

**Co se zmenilo:**
- Backdrop: `fixed inset-0 bg-black bg-opacity-50 z-40` (click close)
- Modal panel: `bg-white dark:bg-slate-900 max-w-4xl max-h-90vh overflow-y-auto`
- Close button: X ikona top-right
- Render: `<AdminOrderDetail orderId={orderId} onClose={onClose} />`
- Accessibility: role="dialog", aria-modal="true", aria-labelledby="order-detail-title"

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminOrders (tabulka linkuje na detail), Backend (Order GET endpoint)
- **Breaking changes:** Ne — nová funkčnost
- **Nove zavislosti:** Žádné (interní komponenty + Forge design)
- **Rizika:** Backend endpoint `/api/orders/:orderId` musí vrátit customer data + activity log — pokud chybí, pokazí se zobrazení

---

## Testovani

- **Build:** npm run build — (pending)
- **Manual test:** (pending) —
  - [ ] Klik na řádek v AdminOrders otevře modal
  - [ ] Detail zobrazí správná data (customer, items, pricing)
  - [ ] Status timeline zobrazí aktuální stav zeleně
  - [ ] Edit notes → Save → GET `/api/orders/:id/update` — toast success
  - [ ] Změnit stav dropdown → POST `/api/orders/:id/status` — reload activity log
  - [ ] Tisk tlačítko → window.print s dobrou formatting
  - [ ] Zrušit objednávku → confirm dialog → PATCH `/api/orders/:id` (soft delete)
- **Poznamky:** Chyba: Layout v modalu není responsive na iPhone (max-width breakpoint). Oprava: media query pro max-w-full na mobile.

---
