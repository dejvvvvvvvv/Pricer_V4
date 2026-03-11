# 149-BK — UPRAVY — Backend Order Management API — 2026-03-10

## Metadata
- **ID:** 149-BK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Backend Order Management
- **Souvisejici ID:** 102 (PY-Payments), 103 (PY-Payments), 125 (AO-Order Export)
- **Trigger:** Implementace 44. features — Backend Order Management API s 7 endpointy, status flow validaci, audit trail, soft delete, webhook integrace

---

## Souhrn uprav

Implementovana nova backend infrastruktura pro správu objednavek: ordersStore.js (in-memory datovy sklad s file persistence), orders.js router (7 endpointy), status flow s validaci (forward-only), webhook integration, audit trail a soft delete. Poradi objednavek sekvencni (ORD-00001, ORD-00002, ...).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `backend-local/src/ordersStore.js` | Novy soubor | — | In-memory order store s file persistence a audit trail |
| 2 | `backend-local/src/routes/orders.js` | Novy soubor | — | 7 REST endpointu (CRUD, status, stats) |
| 3 | `backend-local/src/index.js` | Zmeneno | 15-25 | Registrace orders.js routeru |
| 4 | `backend-local/src/middleware/validate.js` | Zmeneno | 30-60 | Nova validace pro order status, webhook payloady |

---

## Detailni zmeny

### 1. `backend-local/src/ordersStore.js` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** —
**Duvod:** Centralizovany in-memory store pro objednavky s persistencí na disk

**Co se zmenilo:**
- Novy class `OrdersStore` s privátnim `orders` map
- CRUD: `create(orderData)`, `getById(id)`, getAll(filter)`, `update(id, updates)`, `delete(id)` (soft delete, `deletedAt` flag)
- Status management: `updateStatus(id, newStatus)` s validaci forward-only flow (pending → processing → completed / cancelled; neni mozne jit zpet)
- Sequential order numbers: automaticky `ORD-00001`, `ORD-00002`, ... (getter `_nextOrderNumber()`)
- Audit trail: kazdy order ma `createdAt`, `updatedAt`, `deletedAt` (soft), `statusHistory` (pole s {status, timestamp, reason})
- File persistence: `_loadFromFile()` pri init, `_saveToFile()` pri kazde zmene
- Webhook integration: pole `webhooks` per order, `triggerWebhook(orderId, eventType, payload)` (async)
- Cache invalidation: metoda `clearCache()`
- Validace: `_validateOrderData(data)` — kontrola required poli (model_id, customer_email, atd.)

**Kod (fragment — klicova struktura):**
```js
class OrdersStore {
  constructor(filePath = './orders.json') {
    this.filePath = filePath;
    this.orders = new Map();
    this._loadFromFile();
  }

  create(orderData) {
    const validationError = this._validateOrderData(orderData);
    if (validationError) throw new Error(validationError);

    const orderId = this._nextOrderNumber();
    const order = {
      id: orderId,
      ...orderData,
      status: 'pending',
      statusHistory: [{ status: 'pending', timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      webhooks: [],
    };
    this.orders.set(orderId, order);
    this._saveToFile();
    return order;
  }

  updateStatus(id, newStatus) {
    const order = this.orders.get(id);
    if (!order) throw new Error(`Order ${id} not found`);
    if (!this._isValidStatusTransition(order.status, newStatus)) {
      throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
    }
    order.status = newStatus;
    order.statusHistory.push({ status: newStatus, timestamp: Date.now() });
    order.updatedAt = Date.now();
    this._saveToFile();
    this._triggerWebhooks(id, 'order.status_changed', { newStatus });
    return order;
  }

  delete(id) {
    const order = this.orders.get(id);
    if (!order) throw new Error(`Order ${id} not found`);
    order.deletedAt = Date.now();
    order.status = 'cancelled';
    this._saveToFile();
    return order;
  }
}

export const ordersStore = new OrdersStore();
```

---

### 2. `backend-local/src/routes/orders.js` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** —
**Duvod:** REST API endpointy pro order management

**Co se zmenilo:**
- 7 endpointu:
  1. `GET /api/orders` — seznam vsech objednavek (filtry: status, customer_email, dateRange), pagination, sorting
  2. `POST /api/orders` — vytvoreni nove objednavky, validace (webhook payload format)
  3. `GET /api/orders/:id` — detail objednavky (vcetne statusHistory)
  4. `PUT /api/orders/:id` — aktualizace objednavky (update pole krome id, createdAt)
  5. `PUT /api/orders/:id/status` — zmena statusu (s validaci forward-only flow)
  6. `DELETE /api/orders/:id` — soft delete (nastavit deletedAt + cancelled status)
  7. `GET /api/orders/stats/summary` — statistiky (pocet orders per status, avg price, total revenue)
- Error handling: try/catch s `res.status(400/404/500)` responses
- Rate limiting: mozne integrace s existujicim rate limiter (pending)
- Logging: request logger middleware (pending)
- Status normalizace: frontend posilá UPPERCASE (PENDING, PROCESSING, COMPLETED), backend normalizuje na lowercase (pending, processing, completed) — vice viz Poznamky

**Kod (fragment — endpoints):**
```js
import express from 'express';
import { ordersStore } from '../ordersStore.js';

const router = express.Router();

router.get('/orders', (req, res) => {
  try {
    const { status, customer_email, limit = 50, offset = 0 } = req.query;
    const filter = {};
    if (status) filter.status = status.toLowerCase();
    if (customer_email) filter.customer_email = customer_email;

    const orders = ordersStore.getAll(filter);
    const paginated = orders.slice(offset, offset + limit);

    res.json({ orders: paginated, total: orders.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', (req, res) => {
  try {
    const order = ordersStore.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/orders/:id/status', (req, res) => {
  try {
    const { newStatus } = req.body;
    const order = ordersStore.updateStatus(req.params.id, newStatus.toLowerCase());
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ... dalsi endpointy
```

---

### 3. `backend-local/src/index.js` (ZMENENO)

**Typ:** Zmeneno
**Radky:** 15-25
**Duvod:** Registrace noveho orders routeru

**Co se zmenilo:**
- Import: `import ordersRouter from './routes/orders.js'`
- Registrace: `app.use('/api', ordersRouter)`

---

### 4. `backend-local/src/middleware/validate.js` (ZMENENO)

**Typ:** Zmeneno
**Radky:** 30-60
**Duvod:** Pridani validace pro order-specific payloady

**Co se zmenilo:**
- Nova validacni fce: `validateOrderPayload(data)` — kontrola model_id (UUID), customer_email (format), order_date (ISO 8601), status (pending/processing/completed/cancelled)
- Middleware: `validateOrder` — detekt order endpoints a validuj payload
- Integruj do `app.use(validateOrder)` v index.js

---

## Dopad zmen

- **Ovlivnene komponenty:** Frontend AdminOrders (mozne zmeny API integrace — normalizace status uppercase ↔ lowercase)
- **Breaking changes:** Ano — status API posilá lowercase, frontend detekuje UPPERCASE z Supabase; potreba unifikace v AdminOrders storage helper nebo Order status normalizer
- **Nove zavislosti:** zadne (pouzivam fs, express, Date.now())
- **Rizika:**
  - File persistence `/orders.json` muze byt vytizen pri vysokem poctu operaci (100+ orders/sec); mozna potreba migrace na Supabase
  - Status normalizace UPPERCASE (frontend) ↔ lowercase (backend) — potreba konsistentniho handleru

---

## Testovani

- **Build:** npm run build — pending (backend-local je Node.js, ne frontend build)
- **Manual test:**
  - POST /api/orders (vytvorit objednavku)
  - GET /api/orders (seznam)
  - PUT /api/orders/:id/status (zmena na processing → completed)
  - PUT /api/orders/:id/status (invalid transition — try processing → pending, ocat error)
  - DELETE /api/orders/:id (soft delete, overit deletedAt flag)
  - GET /api/orders/stats/summary (statistiky)
- **Poznamky:** Status normalizace je P0 — frontend AdminOrders pouziva UPPERCASE, backend API lowercase; potreba decision: normalizer v AdminOrdersStorage nebo API layer?

---
