# 146-GN — UPRAVY — Confetti Animation & Webhook Notifications — 2026-03-10

## Metadata
- **ID:** 146-GN
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Frontend Animation, Backend Webhooks
- **Souvisejici ID:** 145 (Admin Sidebar)
- **Trigger:** Implementace batch 11-12 — oslava objednávky a webhook notifikace

---

## Souhrn uprav

Přidána konfetová animace na OrderConfirmation stránce (canvas-based, 150 částic, 3s duration) s fyzikálním modelováním (gravitace, vítr, rotace, wobble) a volitelným zvukovým efektem. Na backendu implementován webhook systém s HMAC-SHA256 podpisy, exponential backoff retry logikou (3 retries), 6 event typy a CRUD endpoints pro webhook správu.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/lib/confetti.js` | Nový soubor | 1-280 | Canvas-based konfeta s fyzikální simulací |
| 2 | `src/pages/OrderConfirmation.jsx` | Zmeneno | 42-89 | Integrace konfety + Web Audio success zvuk |
| 3 | `backend-local/src/services/webhookService.js` | Nový soubor | 1-320 | HMAC, retry logic, 6 event typů |
| 4 | `backend-local/src/routes/webhooks.js` | Nový soubor | 1-280 | CRUD endpoints + test endpoint |
| 5 | `backend-local/src/index.js` | Zmeneno | 145-152 | Register webhooks router |

---

## Detailni zmeny

### 1. `src/lib/confetti.js` (Nový soubor)

**Typ:** Nový soubor
**Radky:** 1-280
**Duvod:** Centralizace konfety animace pro znovupoužitelnost

**Co se zmenilo:**
- Exportuje `createConfetti(canvas, options)` funkci
- Canvas 2D context, 150 částic (randomní polohy, barvy, velikosti)
- Fyzika: gravity (0.15), wind (0.05), rotation, wobble (sine wave)
- Barvy z Forge palety: teal, orange, purple, gold, pink
- Duration: 3000ms, frame-based animace (requestAnimationFrame)
- prefers-reduced-motion respekt (skipped animace)
- Exportuje také `playSuccessSound()` - Web Audio API (2 tóny: 800Hz 200ms + 600Hz 150ms)

**Pred:**
```
// Bez animace, jen OrderConfirmation text
<div className="order-success">
  <h1>Objednávka potvrzena!</h1>
</div>
```

**Po:**
```jsx
// S konfetou + zvukem
useEffect(() => {
  const canvas = canvasRef.current;
  createConfetti(canvas);
  playSuccessSound();
}, []);
```

---

### 2. `src/pages/OrderConfirmation.jsx`

**Typ:** Zmeneno
**Radky:** 42-89
**Duvod:** Integrace konfety + zvukový efekt

**Co se zmenilo:**
- Přidán `<canvas ref={canvasRef} className="confetti-canvas" />`
- Přidán `useEffect` hook s `createConfetti()` voláním
- Přidán `useRef` pro canvas
- Import `{ createConfetti, playSuccessSound }` z `src/lib/confetti.js`
- Canvas CSS: `position: fixed, top: 0, left: 0, width: 100vw, height: 100vh, pointer-events: none`
- Zvuk volán v samém useEffect (po konfetě)

---

### 3. `backend-local/src/services/webhookService.js` (Nový soubor)

**Typ:** Nový soubor
**Radky:** 1-320
**Duvod:** Centralizace webhook logiky (podpisování, retries, dispatch)

**Co se zmenilo:**
- Exportuje `WebhookService` class
- `constructor(supabaseClient)` - inicializace
- `registerEvent(eventType, payload, tenantId)` - dispatch webhook
  - Hledá všechny webhooks pro tenant na daný event
  - Vytvoří HMAC-SHA256 podpis (`crypto.createHmac('sha256', secret)`)
  - Pošle POST request na webhook URL
  - Retry logic: 3 pokusy, exponential backoff (1s → 2s → 4s)
  - 10s timeout na request
  - Fire-and-forget (log errors, don't throw)
- 6 event typů: `order.created`, `order.updated`, `order.completed`, `order.failed`, `slice.started`, `slice.completed`
- Uživatel vidí `X-Webhook-Signature` header na svém serveru

---

### 4. `backend-local/src/routes/webhooks.js` (Nový soubor)

**Typ:** Nový soubor
**Radky:** 1-280
**Duvod:** CRUD a test endpoints pro webhook správu

**Co se zmenilo:**
- Exportuje `router` (Express Router)
- Endpoints:
  - `GET /api/webhooks` - seznam všech webhooks pro tenant
  - `POST /api/webhooks` - vytvoření nového webhooku (validace URL, event types)
  - `PUT /api/webhooks/:id` - aktualizace (URL, event types, active flag)
  - `DELETE /api/webhooks/:id` - smazání
  - `POST /api/webhooks/test` - test webhook (zavolá webhookService.registerEvent s dummy datama)
  - `POST /api/webhooks/:id/test` - test konkrétního webhooku (zobrazí response)
- Validace: URL musí být https, event types z whitelist
- Rate limiting: 10/min na `/api/webhooks/test`

---

### 5. `backend-local/src/index.js`

**Typ:** Zmeneno
**Radky:** 145-152
**Duvod:** Registrace webhooks routeru

**Co se zmenilo:**
- Import `webhooksRouter` z `./routes/webhooks.js`
- `app.use('/api', webhooksRouter)` (po existujících routerech)
- Webhook service inicializace: `const webhookService = new WebhookService(supabaseClient)`

---

## Dopad zmen

- **Ovlivnene komponenty:** OrderConfirmation.jsx, backend webhook delivery
- **Breaking changes:** Ne, webhook endpoints jsou new
- **Nove zavislosti:** `crypto` (Node.js builtin), žádné npm balíčky
- **Rizika:** Canvas support starších prohlížečů (IE9), Web Audio API compatibilita

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** OrderConfirmation - konfeta + zvuk, webhook POST testy (200 OK, HMAC verify), retry simulation (500 error → backoff)
- **Poznamky:** Webhook secret klíč musí být generován a uložen v Supabase; user-provided secret není bezpečný

---
