# V3-S11: Chat a komentare k objednavkam

> **Priorita:** P2 | **Obtiznost:** High | **Vlna:** 3
> **Zavislosti:** S01 (Bug Fixes), S02 (Kontaktni formular), S07 (Emailove notifikace), S14 (Kanban)
> **Odhadovany rozsah:** ~45-60 souboru (novy storage helper, chat engine, admin komponenty, zakaznicky interface, WebSocket infrastruktura, sablony zprav)

---

## A. KONTEXT

### A1. Ucel a cil

Chat a komentarovy system resi komunikaci v kontextu objednavek na dvou urovnich:

1. **Interni komentare (Admin only)** — komunikace mezi cleny tymu ohledne konkretni objednavky. Zakaznik tyto komentare nevidi. Funkce: pridavani poznamek, @zminky kolegu s notifikaci, pripinani dulezitych komentaru, prilohy (screenshoty, dokumenty), soft delete, formatovani textu.

2. **Chat se zakaznikem** — oboustranana komunikace mezi adminem a zakaznikem v kontextu objednavky. Zakaznik pristupuje pres odkaz v emailu (`/order/{id}/chat?token=xyz`) nebo pres zakaznicky portal (S12). Funkce: real-time zpravy, prilohy, sablony rychlych odpovedi, read receipts, email notifikace.

3. **Unified timeline** — chronologicka casova osa vsech udalosti objednavky: statusy, zpravy, interni poznamky, zmeny. S filtry podle typu.

**Business value:**
- Snizeni poctu emailu a telefonnich hovoru o 50-70% — vse na jednom miste
- Rychlejsi reseni problemu — kontext objednavky je primo vedle chatu
- Interni komentare zamezuji ztrate informaci (zadne "to mi rikal kolega")
- Sablony odovedi zkracuji response time o 60%
- Audit trail — historie vsech interakci je zachovana
- Profesionalni dojem pro zakaznika — modern chat misto emailu

### A2. Priorita, obtiznost, vlna

**Priorita P2** — komunikace je dulezita ale ModelPricer muze fungovat s emailem v rane fazi. Pro produkni nasazeni s vice zakazniky je chat system nezbytny.

**Obtiznost High** — tato sekce je techicky nejnarocnejsi v cele vlne 3. Duvody:
- **WebSocket infrastruktura** — real-time komunikace vyzaduje WebSocket server (Socket.io), ktert je zcela nova komponenta v projektu
- **Zakaznicky pristup** — verejne dostupny chat endpoint vyzaduje bezpecnostni token system
- **Prilohy** — file upload v kontextu chatu (ruzne od 3D modelu upload)
- **Notifikace** — email notifikace pri nove zprave, badge s neprectenymi, @zminky
- **Sablony** — CRUD pro sablony s promennymi ({order_number}, {customer_name}, atd.)
- **Offline handling** — zpravy kdyz je zakaznik offline, polling fallback

**Vlna 3** — zavisi na objednavkovem systemu (S02), emailovych notifikacich (S07) a admin infrastructure. Chat je nadstavba nad objednavkami.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred S11:**
- **S01 (Bug Fixes)** — stabilni zaklad
- **S02 (Kontaktni formular)** — zakladni email komunikace
- **S07 (Emailove notifikace)** — notifikacni infrastructure (Nodemailer, React Email)
- **S14 (Kanban)** — orders UI kde se chat zobrazuje

**Sekce ktere zavisi na S11:**
- **S12 (Zakaznicky portal)** — zakaznik pristupuje k chatu pres portal
- **S13 (Generovani dokumentu)** — export chatu jako soucest objednavkove dokumentace

**Obousmerne zavislosti:**
- **S10 (Kupony)** — admin muze v chatu zaslat kupon zakaznikovi

### A4. Soucasny stav v codebase

**Co uz existuje:**
- Orders storage: `src/utils/adminOrdersStorage.js` — orders maji pole `notes: []` a `activity: []`, ktere jsou zakladni formou komentaru/timeline
- Orders admin: `src/pages/admin/AdminOrders.jsx` — existujici admin stranka objednavek (misto pro chat panel)
- Auth context: `src/context/AuthContext.jsx` — Firebase auth (admin autentizace)
- Email config: zatim zadny emailovy system, ale planovany v S07
- WebSocket: zadna WebSocket infrastruktura
- File upload: `src/pages/model-upload/components/FileUploadZone.jsx` — existujici upload komponenta (3D modely), muze slouzit jako inspirace

**Co chybi:**
- Zadny `adminChatStorage.js` — neni chat namespace
- Zadna WebSocket infrastruktura (Socket.io server)
- Zadny chat UI (ani admin, ani zakaznicky)
- Zadne sablony zprav
- Zadny token system pro zakaznicky pristup
- Zadne notifikace pri novych zpravach
- Zadna @zminky logika
- Zadna unified timeline komponenta

### A5. Referencni zdroje a konkurence

**OSS knihovny (z doporuceni):**
- **Chatwoot** (21k+ stars) — self-hosted customer engagement platform, kompletni reseni. Moznost integrace pres iframe/API misto vlastni implementace.
- **Socket.io** (61k+ stars) — real-time WebSocket komunikace. De facto standard.
- **Liveblocks** (3k+ stars) — real-time collaboration (overkill pro chat, ale inspirace)
- **TipTap** (27k+ stars) — rich text editor pro komentare, @zminky
- **Plate** (6k+ stars) — headless rich text editor

**Doporuceni:** Pro MVP Varianty A: **polling** (ne WebSocket) pro jednoduchost. Pro produkci: **Socket.io** pro real-time.

**Konkurencni reseni:**
- **Shopify** — interni poznamky k objednavkam + Shopify Inbox pro chat se zakaznikem
- **WooCommerce** — poznamky k objednavkam (bez real-time chatu)
- **Xometry** — messaging system integrovaný v objednavkovem portalu
- **Treatstock** — zakladni messaging se seller

**Best practices:**
- Chat a interni poznamky VZDY v oddelenych tabech (ne michane) — zabrani nahodnemu odeslani interni poznamky zakaznikovi
- Read receipts (preceteno/nepreceteno) — zakaznik vi ze si admin zpravu prectrl
- Typing indicator — zakaznik vi ze admin pise
- Sablony s promennymi — usetri cas a zaruci konzistentni komunikaci
- Email fallback — pokud zakaznik neni online, zpravu odeslat emailem

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `chat:v1`
**Klic:** `modelpricer:${tenantId}:chat:v1`

```json
{
  "schema_version": 1,
  "comments": {
    "ORD-001200": [
      {
        "id": "comment_uuid_1",
        "order_id": "ORD-001200",
        "user_id": "admin_jan",
        "user_name": "Jan Novak",
        "comment_type": "internal",
        "content": "Zakaznik zada expresni dodani - potvrzeno telefonicky. Prislibeno dodani do 17.01.",
        "attachments": [],
        "is_pinned": true,
        "mentions": [],
        "created_at": "2025-01-15T10:30:00Z",
        "updated_at": "2025-01-15T10:30:00Z",
        "deleted_at": null
      }
    ]
  },
  "messages": {
    "ORD-001200": [
      {
        "id": "msg_uuid_1",
        "order_id": "ORD-001200",
        "sender_type": "customer",
        "sender_id": null,
        "sender_name": "Jan Novak",
        "sender_email": "jan@example.cz",
        "content": "Dobry den, chtel bych se zeptat na termin dodani.",
        "attachments": [],
        "is_read": true,
        "read_at": "2025-01-14T09:22:00Z",
        "created_at": "2025-01-14T09:15:00Z"
      },
      {
        "id": "msg_uuid_2",
        "order_id": "ORD-001200",
        "sender_type": "admin",
        "sender_id": "admin_jan",
        "sender_name": "Jan Novak (Admin)",
        "sender_email": null,
        "content": "Dobry den, vase objednavka bude odeslana zitra. Predpokladane doruceni je 17.01.",
        "attachments": [],
        "is_read": true,
        "read_at": "2025-01-14T09:25:00Z",
        "created_at": "2025-01-14T09:22:00Z"
      }
    ]
  },
  "templates": [
    {
      "id": "tmpl_uuid_1",
      "name": "Potvrzeni objednavky",
      "content": "Dobry den,\n\nvase objednavka #{order_number} byla prijata a zpracovava se.\n\nS pozdravem,\n{admin_name}",
      "variables": ["order_number", "admin_name"],
      "category": "status",
      "sort_order": 0,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "tmpl_uuid_2",
      "name": "Informace o odeslani",
      "content": "Dobry den,\n\nvase objednavka #{order_number} byla prave odeslana.\n\nSledovaci cislo: {tracking_number}\nDopravce: {carrier_name}\n\nS pozdravem,\n{admin_name}",
      "variables": ["order_number", "tracking_number", "carrier_name", "admin_name"],
      "category": "shipping",
      "sort_order": 1,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "tmpl_uuid_3",
      "name": "Zadost o upresneni",
      "content": "Dobry den,\n\nk vasi objednavce #{order_number} bychom potrebovali upresnit nasledujici:\n\n{custom_text}\n\nDekujeme za spolupaci,\n{admin_name}",
      "variables": ["order_number", "custom_text", "admin_name"],
      "category": "inquiry",
      "sort_order": 2,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "tmpl_uuid_4",
      "name": "Problem s modelem",
      "content": "Dobry den,\n\npri kontrole vaseho modelu v objednavce #{order_number} jsme zjistili nasledujici problem:\n\n{problem_description}\n\nProsim kontaktujte nas pro dalsi postup.\n\nS pozdravem,\n{admin_name}",
      "variables": ["order_number", "problem_description", "admin_name"],
      "category": "problem",
      "sort_order": 3,
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "tmpl_uuid_5",
      "name": "Dotaz na zmenu materialu",
      "content": "Dobry den,\n\nk vasi objednavce #{order_number} bychom chteli navrhnout zmenu materialu z {current_material} na {suggested_material}, ktery nabizi lepsi vlastnosti pro vas model.\n\nCena se zmeni o {price_difference}.\n\nChteli byste provest tuto zmenu?\n\nS pozdravem,\n{admin_name}",
      "variables": ["order_number", "current_material", "suggested_material", "price_difference", "admin_name"],
      "category": "material",
      "sort_order": 4,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "access_tokens": {
    "ORD-001200": {
      "token": "abc123xyz789",
      "customer_email": "jan@example.cz",
      "created_at": "2025-01-13T18:00:00Z",
      "expires_at": "2025-02-13T18:00:00Z"
    }
  },
  "notification_settings": {
    "admin_email_on_new_message": true,
    "admin_email_frequency": "immediate",
    "customer_email_on_reply": true,
    "show_unread_badge": true,
    "default_response_time_text": "Obvykle odpovidame do 2 hodin"
  },
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**comment_type varianty:**
- `"internal"` — viditelne jen pro admin tym
- `"customer"` — viditelne i pro zakaznika (pouzivano jen v specialnich pripadech)

**sender_type varianty:**
- `"admin"` — odeslano adminem/operatorem
- `"customer"` — odeslano zakaznikem
- `"system"` — automaticka zprava (napr. zmena statusu)

**Attachment schema:**
```json
{
  "id": "att_uuid_1",
  "filename": "screenshot.png",
  "size": 245000,
  "mime_type": "image/png",
  "url": "data:image/png;base64,...",
  "uploaded_at": "2025-01-14T09:20:00Z"
}
```

Pozn: Pro Variantu A (localStorage demo) se prilohy ukladaji jako base64 data URI. Pro produkci se musi pouzit cloud storage (Firebase Storage, S3).

### B2. API kontrakty (endpointy)

Pro budouci backend:

```
# Admin - Interni komentare
GET    /api/admin/orders/:id/comments          -> seznam komentaru
POST   /api/admin/orders/:id/comments          -> pridani komentare
PUT    /api/admin/orders/:id/comments/:cid      -> editace komentare
DELETE /api/admin/orders/:id/comments/:cid      -> smazani (soft delete)
PATCH  /api/admin/orders/:id/comments/:cid/pin  -> pripnout/odepnout

# Admin - Chat se zakaznikem
GET    /api/admin/orders/:id/messages           -> historie zprav
POST   /api/admin/orders/:id/messages           -> odeslani zpravy
PATCH  /api/admin/orders/:id/messages/read      -> oznacit jako prectene

# Admin - Sablony
GET    /api/admin/chat/templates                -> seznam sablon
POST   /api/admin/chat/templates                -> vytvoreni sablony
PUT    /api/admin/chat/templates/:id            -> uprava sablony
DELETE /api/admin/chat/templates/:id            -> smazani sablony

# Admin - Notifikace
GET    /api/admin/chat/unread-count             -> pocet neprectenych
GET    /api/admin/chat/notifications             -> seznam notifikaci

# Public - Zakaznicky chat
GET    /api/public/orders/:id/messages?token=X  -> historie zprav (zakaznik)
POST   /api/public/orders/:id/messages?token=X  -> odeslani zpravy (zakaznik)

# WebSocket events (Socket.io)
# Server -> Client:
  'chat:message'         -> nova zprava
  'chat:typing'          -> typing indicator
  'chat:read'            -> read receipt
  'chat:notification'    -> nova notifikace

# Client -> Server:
  'chat:send'            -> odeslat zpravu
  'chat:typing_start'    -> zacal psat
  'chat:typing_stop'     -> prestal psat
  'chat:mark_read'       -> oznacit jako prectene
```

### B3. Komponentni strom (React)

```
Admin:
src/pages/admin/
  components/chat/
    OrderComments.jsx                 -- interni komentare panel
    OrderCommentItem.jsx              -- jeden komentar (s pin, edit, delete)
    OrderCommentEditor.jsx            -- textarea s formatting a @zminky
    OrderChat.jsx                     -- chat se zakaznikem panel
    OrderChatMessage.jsx              -- jedna zprava (bubble layout)
    OrderChatInput.jsx                -- input s prilohou a sablonami
    ChatTemplateSelector.jsx          -- dropdown se sablonami
    ChatTemplateEditor.jsx            -- formular pro editaci sablony
    ChatTemplateList.jsx              -- admin sprava sablon
    UnreadBadge.jsx                   -- badge s poctem neprectenych
    MentionAutocomplete.jsx           -- @zminky autocomplete
    TypingIndicator.jsx               -- "Jan pise..."
    UnifiedTimeline.jsx               -- casova osa vsech udalosti
    TimelineEntry.jsx                 -- jedna udalost v timeline
    TimelineFilter.jsx                -- filtry (vse, zpravy, poznamky, statusy)
    AttachmentUpload.jsx              -- upload priloh v chatu
    AttachmentPreview.jsx             -- nahled prilohy

Zakaznicky interface:
src/pages/order-chat/
  OrderChatPublic.jsx                 -- verejna stranka pro zakaznicky chat
  components/
    CustomerChatWindow.jsx            -- chat okno pro zakaznika
    CustomerChatMessage.jsx           -- zprava (zakaznicke UI)
    CustomerChatInput.jsx             -- input pro zakaznika
    CustomerChatHeader.jsx            -- hlavicka s cislem objednavky
    ResponseTimeInfo.jsx              -- "Obvykle odpovidame do 2 hodin"

Admin nastaveni:
src/pages/admin/
  components/chat/
    ChatNotificationSettings.jsx      -- nastaveni notifikaci
    ChatSettings.jsx                  -- hlavni nastaveni chatu
```

### B4. Tenant storage namespace

- **Namespace:** `chat:v1`
- **Helper:** `src/utils/adminChatStorage.js` (novy soubor)

**Public API helperu:**
```javascript
// Interni komentare
export function loadComments(orderId)
export function addComment(orderId, commentData)
export function updateComment(orderId, commentId, updates)
export function deleteComment(orderId, commentId)
export function togglePinComment(orderId, commentId)

// Chat zpravy
export function loadMessages(orderId)
export function sendMessage(orderId, messageData)
export function markMessagesAsRead(orderId)
export function getUnreadCount()
export function getUnreadCountForOrder(orderId)

// Sablony
export function loadTemplates()
export function saveTemplate(templateData)
export function deleteTemplate(templateId)
export function renderTemplate(templateId, variables)

// Access tokeny
export function generateAccessToken(orderId, customerEmail)
export function validateAccessToken(orderId, token)
export function revokeAccessToken(orderId)

// Unified timeline
export function getOrderTimeline(orderId)

// Notifikace
export function loadNotificationSettings()
export function saveNotificationSettings(settings)

// Normalizace
export function normalizeComment(input)
export function normalizeMessage(input)
export function normalizeTemplate(input)

// Default config
export function getDefaultChatConfig()
export function loadChatConfig()
export function saveChatConfig(config)
```

### B5. Widget integrace (postMessage)

Chat v widgetu neni typicky use case (widget je kalkulacka, ne objednavkovy system). Ale pokud zakaznik provede objednavku pres widget:

```javascript
// Widget -> Parent (zakaznik chce chatovat)
window.parent.postMessage({
  type: 'MODELPRICER_OPEN_CHAT',
  payload: {
    order_id: 'ORD-001200',
    customer_email: 'jan@example.cz'
  }
}, '*');

// Parent -> Widget (nova zprava od admina — notifikace)
widget.contentWindow.postMessage({
  type: 'MODELPRICER_NEW_MESSAGE',
  payload: {
    order_id: 'ORD-001200',
    message_preview: 'Vase objednavka byla odeslana...',
    unread_count: 1
  }
}, widgetOrigin);
```

### B6. Pricing engine integrace

Chat system **primo neinteraguje** s pricing engine. Neprime interakce:
- Admin muze v chatu navrhnout zmenu materialu/parametru — ale samotna zmena se provadi v orders/pricing systemu
- Admin muze v chatu zaslat kuponovy kod — ale aplikace kuponu je v S10
- Unified timeline zobrazuje cenove zmeny — cte z orders activity log

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-mid-storage-tenant` | Vytvoreni `adminChatStorage.js` | `src/utils/adminChatStorage.js` | P0 |
| `mp-spec-be-websocket` | WebSocket infrastruktura (Socket.io) | `backend-local/ws/chatServer.js` | P1 (pro prod) |
| `mp-mid-frontend-admin` | Integrrace chatu do AdminOrders detail | `src/pages/admin/AdminOrders.jsx`, order detail | P0 |
| `mp-spec-fe-forms` | OrderCommentEditor, ChatTemplateEditor | `src/pages/admin/components/chat/OrderCommentEditor.jsx` | P1 |
| `mp-spec-fe-kanban` | UnifiedTimeline komponenta | `src/pages/admin/components/chat/UnifiedTimeline.jsx` | P1 |
| `mp-mid-frontend-widget` | CustomerChatWindow (zakaznicky interface) | `src/pages/order-chat/OrderChatPublic.jsx` | P1 |
| `mp-spec-fe-notifications` | UnreadBadge, notifikacni logika | `src/pages/admin/components/chat/UnreadBadge.jsx` | P1 |
| `mp-spec-be-email` | Email notifikace pri novych zpravach | `backend-local/services/chatNotifier.js` | P2 |
| `mp-spec-fe-upload` | AttachmentUpload/Preview v chatu | `src/pages/admin/components/chat/AttachmentUpload.jsx` | P2 |
| `mp-spec-fe-routing` | Pridani `/order/:id/chat` route | `src/Routes.jsx` | P0 |
| `mp-spec-security-auth` | Token system pro zakaznicky pristup | `src/utils/adminChatStorage.js` (access_tokens) | P0 |
| `mp-mid-quality-code` | Code review | * | P0 (gate) |
| `mp-spec-test-unit` | Unit testy storage, token validace | `src/__tests__/` | P1 |
| `mp-spec-test-e2e` | E2E testy chat flow | `tests/e2e/` | P2 |

### C2. Implementacni kroky (poradi)

```
FAZE 1 — Storage + zaklad (sekvencni)
  1.1 [mp-mid-storage-tenant] adminChatStorage.js
      - CRUD pro komentare a zpravy
      - Sablony s promennymi
      - Access token generovani/validace
      - Seed data: 2 demo konverzace, 5 sablon
      Zavislost: zadna

  1.2 [mp-spec-security-auth] Token system
      - generateAccessToken: crypto.randomUUID + expiration
      - validateAccessToken: kontrola existence + expirace
      - Token v URL: /order/{id}/chat?token=xyz
      Zavislost: 1.1

FAZE 2 — Admin UI (paralelne po Fazi 1)
  2.1 [mp-spec-fe-routing] Routing
      - /admin/orders/:id → order detail s chat panelem (existujici stranka, novy panel)
      - /order/:id/chat?token=X → zakaznicky chat (nova verejna stranka)
      - /admin/settings/chat-templates → sprava sablon
      Zavislost: zadna

  2.2 [mp-mid-frontend-admin] OrderComments panel
      - Seznam komentaru s pinned nahoze
      - Pridani noveho komentare
      - Editace/smazani vlastnich komentaru
      - @zminky (zaklad — autocomplete z team list)
      Zavislost: 1.1, 2.1

  2.3 [mp-mid-frontend-admin] OrderChat panel
      - Chat bubble layout (zakaznik vlevo, admin vpravo)
      - Input s prilohou a sablonami
      - Read receipts (indikator precteni)
      - Typing indicator (pro MVP: polling, pro prod: WebSocket)
      Zavislost: 1.1, 2.1

  2.4 [mp-spec-fe-forms] ChatTemplateSelector + ChatTemplateEditor
      - Dropdown se sablonami v chat input
      - Sablona se vyplni promennymi z objednavky
      - CRUD sprava sablon v admin nastaveni
      Zavislost: 2.3

  2.5 [mp-spec-fe-kanban] UnifiedTimeline
      - Chronologicka casova osa: zpravy + komentare + statusy + cenove zmeny
      - Filtry: vse / zpravy / poznamky / statusy
      - Barevne rozliseni typu udalosti
      Zavislost: 2.2, 2.3

  2.6 [mp-spec-fe-notifications] UnreadBadge
      - Badge na sidebar polozce "Objednavky" s celkovym poctem neprectenych
      - Badge na jednotlive objednavce v seznamu
      - Auto-refresh (polling kazdych 30s)
      Zavislost: 1.1

FAZE 3 — Zakaznicky interface (po Fazi 2)
  3.1 [mp-mid-frontend-widget] OrderChatPublic.jsx
      - Verejna stranka /order/:id/chat?token=X
      - Token validace pri nacteni
      - Chat okno (jednodussi nez admin — bez sablon, bez interni poznamky)
      - ResponseTimeInfo: "Obvykle odpovidame do 2 hodin"
      Zavislost: 1.2, 2.3

  3.2 [mp-spec-fe-upload] AttachmentUpload/Preview
      - Drag & drop / tlacitko pro prilohu
      - Limit: max 5 priloh, max 10MB na prilohu
      - Podporovane formaty: png, jpg, gif, pdf, stl, obj
      - Preview: obrazky inline, ostatni jako ikona + nazev
      Zavislost: 3.1

FAZE 4 — Notifikace + WebSocket (po Fazi 3)
  4.1 [mp-spec-be-email] Email notifikace
      - Admin dostane email pri nove zprave od zakaznika
      - Zakaznik dostane email pri nove zprave od admina
      - Konfigurovatelne: ihned / souhrn (denni)
      - Sablon emailu pomoci React Email
      Zavislost: S07 (email infrastructure)

  4.2 [mp-spec-be-websocket] WebSocket server (pro produkci)
      - Socket.io server na backend-local
      - Room per order: `order:ORD-001200`
      - Events: message, typing, read
      - Fallback na polling pro Variantu A
      Zavislost: 4.1

FAZE 5 — Quality gates
  5.1 [mp-mid-quality-code] Code review
  5.2 [mp-spec-test-unit] Unit testy
  5.3 [mp-spec-test-build] Build verification
  5.4 [mp-spec-test-e2e] E2E testy
```

### C3. Kriticke rozhodovaci body

1. **Polling vs WebSocket pro Variantu A?** Rozhodnuti: **Polling** pro MVP (Varianta A). WebSocket az pro produkci. Duvod: localStorage neni sdileny mezi taby v realtime — polling je jednoduchy a dostatecny pro demo. Polling interval: 10s pro aktivni chat, 60s pro background.

2. **Kam ulozit prilohy?** Rozhodnuti: Pro Variantu A: **base64 v localStorage** (jednoduche, ale limit ~5MB). Pro produkci: Firebase Storage / S3.
   - **Varovani:** Base64 v localStorage je silne limitovani. Zavest limit: max 3 prilohy na komentar, max 500KB na prilohu, jen obrazky (png/jpg).

3. **Jak resit @zminky?** Rozhodnuti: Jednoduchy regex `@username` v textu + lookup v team listu. Pro MVP bez TipTap (jen textarea). TipTap az pokud bude rich text formatovani pozadovano.

4. **Token expiration?** Rozhodnuti: 30 dni od vytvoreni objednavky. Po expiaci zakaznik musi pozadat o novy (pres email link). Moznost revokovani tokenem adminem.

5. **Kde zobrazit chat v admin UI?** Moznosti:
   - a) Pravy panel v order detail (vedle obsahu objednavky)
   - b) Spodni sekce pod objednavkou
   - c) Samostatna stranka /admin/orders/:id/chat
   - **Rozhodnuti: varianta a)** — pravy panel s prepinacimi taby "Interni poznamky" / "Chat" / "Timeline"

### C4. Testovaci strategie

**Unit testy (adminChatStorage.test.js):**
- CRUD pro komentare (add, update, delete, pin)
- CRUD pro zpravy (send, mark read)
- Token generovani a validace
- Token expirace (mock Date)
- Sablona rendering s promennymi
- Unread count kalkulace
- Edge cases: prazdny content, prilis dlouhy content, neexistujici order_id

**Unit testy (chatNotifier.test.js):**
- Email notifikace format
- Notifikace podminky (immediate vs summary)
- @zminky detekce a notifikace

**E2E testy:**
- Admin: pridani interni poznamky, overeni zobrazeni
- Admin: odeslani zpravy zakaznikovi, overeni v chatu
- Zakaznik: pristup pres token link, odeslani zpravy
- Zakaznik: neplatny token — zobrazeni chyby
- Admin: pouziti sablony, overeni vyplneni promennych
- Admin: @zminka kolegy, overeni notifikace
- Timeline: overeni chronologickeho poradi vsech typu udalosti

**Edge cases:**
- Velmi dlouha zprava (>5000 znaku — orezat?)
- Zprava s XSS pokusem (`<script>alert('xss')</script>`)
- Priloha s nebezpecnym MIME typem
- Soucasne odeslani zpravy admin + zakaznik
- Token revokace — zakaznik se pokusi pouzit revokovany token
- Prazdna objednavka (zadne modely) — chat stale funguje
- 1000+ zprav v jedne konverzaci (performance test)

### C5. Migrace existujicich dat

**Castecna migrace z orders:v1:**
Existujici objednavky maji pole `notes: []` a `activity: []`. Pri prvnim otevreni chatu pro objednavku:

```javascript
function migrateOrderNotesToChat(orderId) {
  const orders = loadOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  // Migrace notes -> comments
  const existingComments = loadComments(orderId);
  if (existingComments.length > 0) return; // uz migrovano

  for (const note of (order.notes || [])) {
    addComment(orderId, {
      user_id: note.user_id || 'system',
      user_name: note.user_name || 'System',
      comment_type: 'internal',
      content: note.text || note.content || '',
      created_at: note.timestamp || note.created_at,
    });
  }
}
```

**Zpetna kompatibilita:**
- Existujici orders `notes[]` zustavaji nezmenene (nepresouvas, kopirujeme)
- Nove komentare se ukladaji jen do `chat:v1` namespace
- `activity[]` v orders se stale pouziva pro status zmeny (unified timeline cte z obou zdroju)

---

## D. KVALITA

### D1. Security review body

- **KRITICKE — Token system:** Access token pro zakaznicky chat musi byt:
  - Cryptographically secure (`crypto.randomUUID()`)
  - Time-limited (max 30 dni)
  - Per-order (jeden token = jedna objednavka)
  - Revokovatelny adminem
  - Nesmejj umoznit pristup k jinym objednavkam

- **XSS prevence:** Veskery user-generated content (zpravy, komentare) musi byt escaped pred renderem. Pouzit `textContent` nebo React auto-escape (ne `dangerouslySetInnerHTML`).

- **CSRF ochrana:** POST endpointy pro chat musi overovat origin/referer

- **File upload security:**
  - Whitelist MIME typu (image/png, image/jpeg, image/gif, application/pdf)
  - Max velikost souboru: 10MB (produkce), 500KB (Varianta A)
  - Kontrola magic bytes (ne jen MIME type z Content-Type)
  - Prilohy nikdy neexekuovat server-side

- **Rate limiting:**
  - Max 30 zprav za minutu (anti-spam)
  - Max 5 priloh na zpravu
  - Max 100 zprav za hodinu na objednavku

- **Tenant izolace:** Chat data jsou scoped na tenant a objednavku

- **@zminky:** Overit ze zmineeny uzivatel patri ke stejnemu tenantu

### D2. Performance budget

- **Chat load (historiene zpravy):** < 100ms pro 100 zprav
- **Zprava send:** < 50ms (localStorage write)
- **Polling interval:** 10s aktivni chat, 60s background
- **Timeline render:** < 200ms pro 200 udalosti
- **UnreadBadge update:** < 20ms (count z indexu)
- **Template rendering:** < 5ms (string replace)
- **Attachment upload (base64):** < 500ms pro 500KB obrazek
- **Memory:** Chat panel max 10MB pamet (virtualizovat seznam zprav pokud >100)

### D3. Accessibility pozadavky

- **Chat messages:** `role="log"` pro oblast zprav, `aria-live="polite"` pro nove zpravy
- **Chat input:** `aria-label="Napiste zpravu"`, `aria-describedby` pro charakter limit
- **UnreadBadge:** `aria-label="X neprectenych zprav"` (ne jen cislo)
- **Timeline:** `role="list"` pro timeline, kazda udalost `role="listitem"`
- **Attachment upload:** `aria-label` na tlacitku, progress bar pro upload
- **@zminky autocomplete:** `role="listbox"` s `aria-expanded`, keyboard navigace
- **Keyboard shortcuts:** Enter = odeslat, Shift+Enter = novy radek, Escape = zavrit sablony
- **Focus management:** Po odeslani zpravy focus zpet na input

### D4. Error handling a edge cases

- **Neplatny token:** Zobrazit "Pristup odepren. Kontaktujte nas pro novy pristupovy odkaz."
- **Expirovany token:** "Vas pristupovy odkaz vyprsel. Kontaktujte nas pro novy."
- **localStorage plny:** Varovat admin, starsi zpravy presunout do archivu (archivovat nejstarsi konverzace)
- **Priloha prilis velka:** "Maximalni velikost prilohy je 500KB"
- **Nepodareny upload:** Retry button, chybova hlaska
- **Offline stav:** Zpravy se frontuji lokalne a odeslou pri reconnect
- **Soucasna editace:** Last-write-wins (pro localStorage je to jedine rozumne)
- **@zminka neexistujiciho uzivatele:** Ignorovat (zobrazit jako plain text)
- **XSS v zprave:** Automaticky escaped React renderem
- **Prazdna zprava:** Disabled send button pro prazdny vstup

### D5. i18n pozadavky

- Systemove texty i18n-ready (cs.json, en.json)
- Casove razitka v lokalnim formatu (relative: "pred 5 minutami", absolutni: "15.01.2025 10:30")
- Sablony: admin je pise v jazyce targetu (neni treba prekladat)
- Chat input placeholder: "Napiste zpravu..." (lokalizovano)
- Response time text: lokalizovano
- Error messages: lokalizovano

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

```javascript
const FEATURE_FLAGS = {
  internal_comments_enabled: true,    // interni poznamky
  customer_chat_enabled: true,        // chat se zakaznikem
  chat_templates_enabled: true,       // sablony zprav
  chat_attachments_enabled: false,    // prilohy (off pro MVP)
  chat_mentions_enabled: true,        // @zminky
  unified_timeline_enabled: true,     // casova osa
  websocket_enabled: false,           // WebSocket (off pro Variantu A)
  email_notifications_enabled: false, // email notifikace (off pro Variantu A)
};
```

**Postupne nasazeni:**
1. **Faze A:** Interni komentare — admin-only poznamky k objednavkam
2. **Faze B:** Chat se zakaznikem — polling, bez priloh
3. **Faze C:** Sablony + @zminky + UnifiedTimeline
4. **Faze D:** Prilohy + email notifikace
5. **Faze E:** WebSocket real-time (produkce)

### E2. Admin UI zmeny

- **AdminOrders detail:** Novy pravy panel s taby: Poznamky | Chat | Timeline
- **Admin sidebar:** Badge s celkovym poctem neprectenych zprav na polozce "Objednavky"
- **Admin nastaveni:** Nova sekce "Sablony zprav" pod Settings
- **Admin nastaveni:** Nova sekce "Chat nastaveni" (notifikace, response time text)

### E3. Widget zmeny

- **Minimalni zmeny ve widgetu** — chat neni soucast kalkulacky
- **Potencialni budouci rozsireni:** Chat widget (floating bubble) na strankach obchodu
- **postMessage:** Notifikace o novych zpravach pro parent frame

### E4. Dokumentace pro uzivatele

- **Admin guide:** "Jak pouzivat interni poznamky" — pridavani, @zminky, pinning
- **Admin guide:** "Jak komunikovat se zakaznikem" — chat, sablony, prilohy
- **Admin guide:** "Jak spravovat sablony zprav" — vytvoreni, promenne, kategorie
- **Zakaznicky guide:** "Jak komunikovat s prodejcem" — pristup pres email link
- **FAQ:** "Jak funguje chat k objednavce?"

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Response time (admin) | < 2 hodiny prumerne | cas od zakaznikovy zpravy do admin odpovedi |
| Chat adoption | > 40% objednavek ma alespon 1 zpravu | orders_with_messages / total_orders |
| Template usage | > 50% admin zprav pomoci sablony | template_messages / total_admin_messages |
| Customer satisfaction | > 4/5 rating | volitelne hodnoceni po uzavreni chatu |
| Email reduction | > 50% snizeni emailu | porovnani pred/po nasazeni |
| Interni poznamky adoption | > 60% objednavek ma poznamku | orders_with_comments / total_orders |
| Unread zero | < 5% objednavek s neprectenou zpravou starsi 24h | monitoring |
