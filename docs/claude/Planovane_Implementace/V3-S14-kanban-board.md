# V3-S14: Vizualni Pipeline Objednavek (Kanban Board)

> **Priorita:** P1 | **Obtiznost:** Stredni | **Vlna:** 2
> **Zavislosti:** S01 (bug fixes), S02 (checkout/objednavky)
> **Odhadovany rozsah:** Stredni (~25-40 souboru, 2000-3500 radku)

---

## A. KONTEXT

### A1. Ucel a cil

Sekce S14 pridava alternativni zobrazeni objednavek v admin panelu —
vizualni Kanban board s drag-and-drop prechody mezi stavy. Stavajici
`AdminOrders.jsx` zobrazuje objednavky v tabulce. Kanban board umozni:

1. **Vizualni prehled pipeline** — okamzite videt kolik objednavek je v kazdem stavu
2. **Drag-and-drop zmena stavu** — intuitivni presun karty = zmena stavu objednavky
3. **WIP limity** — vizualni varovani pri pretizeni urciteho stavu
4. **Filtrovani a vyhledavani** — hledani objednavek pres vsechny sloupce
5. **Automaticke triggery** — pri presunu spustit email (S07), generovat dokument (S13)

**Business value:**
- 3D tiskove firmy zpracovavaji desitky objednavek denne — Kanban board
  poskytuje okamzity prehled o stavu cele vyroby
- Snizeni chybovosti — vizualni indikace pretizeni a WIP limitu
- Zvyseni produktivity — drag-and-drop je rychlejsi nez klikani na dropdown
- Konkurencni vyhoda — Layers.app a AutoQuote3D Kanban board nemaji

### A2. Priorita, obtiznost, vlna

**Priorita P1:** Kanban board je klicovy pro kazdodenni operativu 3D tiskove
firmy. Bez nej admin musi klikat na kazdy radek tabulky a menit stav rucne.

**Obtiznost Stredni:** Hlavni slozitost:
- Drag-and-drop knihovna (@dnd-kit) — integrace s React
- Validace prechodu mezi stavy (ne kazdy presun je validni)
- Responzivita — horizontalni scroll na mobilech
- Performance — virtualizace pri velkym poctu karet
- Real-time aktualizace (volitelne, pres WebSocket)

**Vlna 2:** Kanban je rozsirenim existujicich objednavek (S02). Nevyzaduje
pokrocile features z Vlny 3/4, pouze funkcni objednavky.

### A3. Zavislosti na jinych sekcich

**MUSI byt hotove pred S14:**
| Sekce | Duvod |
|-------|-------|
| S01 (Bug Fixes) | Zakladni stabilita aplikace |
| S02 (Checkout) | Datovy model objednavek musi existovat |

**DOPORUCENE pred S14:**
| Sekce | Duvod |
|-------|-------|
| S07 (Emaily) | Email notifikace pri zmene stavu |

**Na S14 ZAVISI:**
| Sekce | Duvod |
|-------|-------|
| S13 (Dokumenty) | Trigger generovani dokumentu pri presunu karty |
| S11 (Chat) | Zobrazeni poslednich komentaru na karte |

**Standalone aspekt:** S14 primarne zavisi jen na existujicim datovem modelu
objednavek (`adminOrdersStorage.js`), ktery jiz existuje. Neni potreba cekat
na backend.

### A4. Soucasny stav v codebase

**Co uz existuje:**
- `src/utils/adminOrdersStorage.js` — kompletni datovy model objednavek
  - `ORDER_STATUSES = ['NEW','REVIEW','APPROVED','PRINTING','POSTPROCESS','READY','SHIPPED','DONE','CANCELED']`
  - `loadOrders()`, `saveOrders()`, `appendOrderActivity()`
  - `computeOrderTotals()` — cenove vypocty
- `src/pages/admin/AdminOrders.jsx` — funkcni tabulkove zobrazeni
  - Filtry (status, material, preset, datum, zakaznik)
  - Detail objednavky (sub-route)
  - Zmena stavu pres dropdown
  - Audit log, poznamky, flags
- `src/pages/admin/AdminLayout.jsx` — admin navigace (sidebar)

**Co chybi:**
- Kanban view komponent — NEEXISTUJE
- Toggle Table/Kanban — NEEXISTUJE
- Drag-and-drop knihovna — NENI v package.json
- WIP limity konfigurace — NEEXISTUJE
- Validace prechodu mezi stavy — castecne (jen v UI)
- `src/utils/adminKanbanStorage.js` — NEEXISTUJE (namespace `kanban:v1`)

**Relevantni existujici soubory:**
```
src/utils/adminOrdersStorage.js    — datovy model objednavek
src/pages/admin/AdminOrders.jsx     — tabulkove zobrazeni objednavek
src/pages/admin/AdminLayout.jsx     — admin navigace
src/components/ui/Button.jsx        — zakladni UI tlacitko
src/components/ui/Input.jsx         — zakladni UI input
src/components/ui/Select.jsx        — zakladni UI select
```

### A5. Referencni zdroje a konkurence

**Doporucene OSS knihovny:**

| Knihovna | GitHub | Hvezdy | Popis | Licence | Status |
|----------|--------|--------|-------|---------|--------|
| **@dnd-kit/core** | clauderic/dnd-kit | 13k+ | Moderni drag & drop pro React | MIT | Aktivni |
| **@dnd-kit/sortable** | clauderic/dnd-kit | — | Sortable addon pro dnd-kit | MIT | Aktivni |
| **react-beautiful-dnd** | atlassian/react-beautiful-dnd | 33k+ | Atlassian DnD | Apache-2.0 | Maintenance |
| **@atlaskit/pragmatic-drag-and-drop** | atlassian | — | Novy Atlassian DnD | Apache-2.0 | Aktivni |
| **react-trello** | rcdexta/react-trello | 2.2k | Pluggable Kanban | MIT | Nizka aktivita |
| **react-kanban** | asseinfo/react-kanban | 652 | Jednoduchy Kanban | MIT | Nizka aktivita |
| **Shadcn Kanban** | Georgegriff/react-dnd-kit-tailwind-shadcn-ui | 808 | DnD-kit + Tailwind + Shadcn | MIT | Aktivni |
| **react-window** | bvaughn/react-window | 16k+ | Virtualizace seznamu | MIT | Stabilni |

**Doporuceni pro ModelPricer:**
- **Primarne:** `@dnd-kit/core` + `@dnd-kit/sortable` — moderni, lehky, dobre typovany
- **Proc NE react-beautiful-dnd:** Maintenance mode, neni aktivne vyvijena
- **Proc NE react-trello:** Prilis opinionated, tezko customizovat styl
- **Virtualizace:** `react-window` pro velke pocty karet (>100)

**Konkurencni reseni:**
- Trello — klasicky Kanban s drag-and-drop (reference UX)
- Linear — moderni Kanban s rychlymi klávesovymi zkratkami
- Notion Kanban — jednoduche, integrovane do workspace

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `kanban:v1`
**Storage klic:** `modelpricer:${tenantId}:kanban:v1`

```json
{
  "schema_version": 1,
  "view_mode": "kanban",
  "settings": {
    "visible_statuses": ["NEW","REVIEW","APPROVED","PRINTING","POSTPROCESS","READY","SHIPPED","DONE"],
    "hidden_statuses": ["CANCELED"],
    "hide_completed": false,
    "wip_limits": {
      "NEW": 0,
      "REVIEW": 5,
      "APPROVED": 10,
      "PRINTING": 8,
      "POSTPROCESS": 5,
      "READY": 0,
      "SHIPPED": 0,
      "DONE": 0,
      "CANCELED": 0
    },
    "card_display": {
      "show_thumbnail": true,
      "show_customer": true,
      "show_price": true,
      "show_date": true,
      "show_material_tag": true,
      "show_priority_tag": true,
      "show_model_count": true,
      "compact_mode": false
    },
    "auto_triggers": {
      "email_on_status_change": true,
      "document_on_status": {
        "APPROVED": "ORDER_CONFIRMATION",
        "SHIPPED": "INVOICE"
      }
    },
    "transition_rules": {
      "DONE_to_NEW": false,
      "DONE_to_REVIEW": false,
      "CANCELED_to_any": false,
      "require_tracking_for_SHIPPED": true,
      "require_reason_for_CANCELED": true
    },
    "column_colors": {
      "NEW": "#3B82F6",
      "REVIEW": "#F59E0B",
      "APPROVED": "#10B981",
      "PRINTING": "#8B5CF6",
      "POSTPROCESS": "#EC4899",
      "READY": "#06B6D4",
      "SHIPPED": "#6366F1",
      "DONE": "#22C55E",
      "CANCELED": "#EF4444"
    }
  },
  "filters": {
    "material": null,
    "preset": null,
    "customer": null,
    "date_from": null,
    "date_to": null,
    "priority": null,
    "search": ""
  },
  "sort_within_column": "created_at_desc",
  "updated_at": "2026-02-06T10:00:00Z"
}
```

**Poznamka:** Samotna data objednavek ziji v `orders:v1` — Kanban jen meni
`status` pole na objednavce pres existujici `saveOrders()`.

### B2. API kontrakty (endpointy)

**Aktualni stav: Pouze frontend (localStorage)**

Pro budouci backend:

```
GET    /api/orders?view=kanban
  Response: { columns: { NEW: [...], REVIEW: [...], ... } }

PUT    /api/orders/:id/status
  Body: { status: "PRINTING", reason?: "...", tracking_number?: "..." }
  Response: { order, triggered_actions: ["email_sent", "document_generated"] }

GET    /api/kanban/settings
  Response: { settings }

PUT    /api/kanban/settings
  Body: { settings }
  Response: { settings }

POST   /api/kanban/bulk-move
  Body: { order_ids: [...], target_status: "APPROVED" }
  Response: { updated: [...], errors: [...] }
```

**Frontend-only API (soucasna implementace):**
```javascript
// Presun objednavky = update stavu v localStorage
import { loadOrders, saveOrders, appendOrderActivity } from './adminOrdersStorage';

export function moveOrderToStatus(orderId, newStatus, metadata = {}) {
  const orders = loadOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error('Order not found');

  const oldStatus = order.status;
  order.status = newStatus;
  order.updated_at = new Date().toISOString();
  saveOrders(orders);

  appendOrderActivity(orderId, {
    type: 'STATUS_CHANGE',
    from: oldStatus,
    to: newStatus,
    ...metadata,
    timestamp: new Date().toISOString()
  });

  return { order, oldStatus, newStatus };
}
```

### B3. Komponentni strom (React)

```
AdminOrders (existujici stranka /admin/orders)
├── ViewToggle
│   ├── TableViewButton (existujici)
│   └── KanbanViewButton (NOVY)
├── SharedFilterBar (extrakce z existujicich filtru)
│   ├── MaterialFilter
│   ├── PresetFilter
│   ├── CustomerSearch
│   ├── DateRangeFilter
│   ├── PriorityFilter
│   └── SearchInput
├── [if view === 'table'] OrdersTable (existujici)
│   └── ... (stavajici implementace)
└── [if view === 'kanban'] KanbanBoard (NOVY)
    ├── DndContext (z @dnd-kit/core)
    │   ├── KanbanColumn (pro kazdy status)
    │   │   ├── ColumnHeader
    │   │   │   ├── StatusLabel
    │   │   │   ├── OrderCount
    │   │   │   ├── WipIndicator
    │   │   │   └── ColumnMenu (hide/show, WIP limit)
    │   │   ├── SortableContext (z @dnd-kit/sortable)
    │   │   │   └── KanbanCard (pro kazdou objednavku)
    │   │   │       ├── CardHeader
    │   │   │       │   ├── OrderNumber
    │   │   │       │   └── PriorityBadge
    │   │   │       ├── CardBody
    │   │   │       │   ├── CustomerName
    │   │   │       │   ├── ModelCount
    │   │   │       │   ├── TotalPrice
    │   │   │       │   └── Thumbnail (volitelne)
    │   │   │       ├── CardFooter
    │   │   │       │   ├── CreatedDate
    │   │   │       │   └── MaterialTags
    │   │   │       └── DragHandle
    │   │   └── DropPlaceholder
    │   └── DragOverlay (preview pri tazeni)
    └── KanbanSettings (modal/sidebar)
        ├── VisibleColumnsConfig
        ├── WipLimitsConfig
        ├── CardDisplayConfig
        ├── TransitionRulesConfig
        └── ColumnColorsConfig

TransitionModal (zobrazeny pri specifickych presunech)
├── CancelReasonModal (pri presunu do CANCELED)
│   ├── ReasonTextarea
│   └── ConfirmButton
├── TrackingNumberModal (pri presunu do SHIPPED)
│   ├── TrackingInput
│   ├── CarrierSelect
│   └── ConfirmButton
└── ConfirmStatusChangeModal (pri neobvyklem presunu)
    ├── WarningMessage
    └── ConfirmButton
```

### B4. Tenant storage namespace

**Helper soubor:** `src/utils/adminKanbanStorage.js`

```javascript
// adminKanbanStorage.js
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_KANBAN = 'kanban:v1';
const SCHEMA_VERSION = 1;

export function loadKanbanSettings() {
  const data = readTenantJson(NS_KANBAN, null);
  if (!data) return getDefaultKanbanSettings();
  return migrateSchema(data);
}

export function saveKanbanSettings(settings) {
  const data = {
    schema_version: SCHEMA_VERSION,
    ...settings,
    updated_at: new Date().toISOString(),
  };
  writeTenantJson(NS_KANBAN, data);
}

export function loadViewMode() {
  const data = readTenantJson(NS_KANBAN, {});
  return data.view_mode || 'table';
}

export function saveViewMode(mode) {
  const data = readTenantJson(NS_KANBAN, {});
  data.view_mode = mode;
  data.updated_at = new Date().toISOString();
  writeTenantJson(NS_KANBAN, data);
}

export function isTransitionAllowed(fromStatus, toStatus, rules) {
  const key = `${fromStatus}_to_${toStatus}`;
  if (rules[key] === false) return false;
  if (rules[`${fromStatus}_to_any`] === false) return false;
  return true;
}

export function getDefaultKanbanSettings() {
  return {
    schema_version: SCHEMA_VERSION,
    view_mode: 'table',
    settings: {
      visible_statuses: ['NEW','REVIEW','APPROVED','PRINTING','POSTPROCESS','READY','SHIPPED','DONE'],
      hidden_statuses: ['CANCELED'],
      hide_completed: false,
      wip_limits: Object.fromEntries(
        ['NEW','REVIEW','APPROVED','PRINTING','POSTPROCESS','READY','SHIPPED','DONE','CANCELED'].map(s => [s, 0])
      ),
      card_display: {
        show_thumbnail: true,
        show_customer: true,
        show_price: true,
        show_date: true,
        show_material_tag: true,
        show_priority_tag: true,
        show_model_count: true,
        compact_mode: false,
      },
      transition_rules: {
        DONE_to_NEW: false,
        DONE_to_REVIEW: false,
        CANCELED_to_any: false,
        require_tracking_for_SHIPPED: true,
        require_reason_for_CANCELED: true,
      },
      column_colors: {
        NEW: '#3B82F6',
        REVIEW: '#F59E0B',
        APPROVED: '#10B981',
        PRINTING: '#8B5CF6',
        POSTPROCESS: '#EC4899',
        READY: '#06B6D4',
        SHIPPED: '#6366F1',
        DONE: '#22C55E',
        CANCELED: '#EF4444',
      }
    },
    filters: { material: null, preset: null, customer: null, date_from: null, date_to: null, search: '' },
    sort_within_column: 'created_at_desc',
    updated_at: new Date().toISOString(),
  };
}
```

### B5. Widget integrace (postMessage)

Kanban board je ciste admin-side feature. Minimalni propagace do widgetu:

```javascript
// Pri zmene stavu objednavky z Kanbanu — informovat widget zakaznika
// (pokud je otevren ve vedlejsim tabu a je prihlaseny zakaznik)
{
  type: 'MODELPRICER_ORDER_STATUS_CHANGE',
  payload: {
    order_id: 'ord_xyz789',
    new_status: 'PRINTING',
    status_label: 'Tiskne se',
    timestamp: '2026-02-06T10:00:00Z'
  }
}
```

Tato zprava umozni widgetu/portalu zobrazit real-time aktualizaci stavu
objednavky bez nutnosti refreshe.

### B6. Pricing engine integrace

Kanban board **nepouziva** pricing engine primo. Cenova data jsou jiz
vypoctena a ulozena v objednavce (snapshoty).

**Neprime napojeni:**
- Karta zobrazuje `order.computed.grand_total` — celkovou cenu
- Pri prechodu do stavu "APPROVED" muze triggernout re-price
  (volitelne, pokud se od vytvoreni zmenil cenik)
- Material tag na karte cte z `order.models[].material_snapshot`

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-spec-fe-kanban` | Kanban board komponent, DnD logika | `src/pages/admin/components/KanbanBoard.jsx` | P0 |
| `mp-mid-frontend-admin` | Integrace do AdminOrders, ViewToggle | `src/pages/admin/AdminOrders.jsx` | P0 |
| `mp-mid-storage-tenant` | Kanban storage helper | `src/utils/adminKanbanStorage.js` | P0 |
| `mp-spec-fe-tables` | Extrakce sdilenych filtru | `src/pages/admin/components/OrderFilters.jsx` | P1 |
| `mp-mid-design-system` | KanbanCard design, barvy, animace | Komponenty v `src/pages/admin/components/` | P1 |
| `mp-spec-fe-animations` | Drag-and-drop animace, hover efekty | CSS/Framer Motion | P2 |
| `mp-spec-be-websocket` | Real-time aktualizace (budouci) | — | P3 |
| `mp-sr-frontend` | Review — architektura, performance | — | P1 |
| `mp-mid-quality-code` | Code review + build kontrola | — | P1 |

### C2. Implementacni kroky (poradi)

**Faze 1: Zaklad — storage a knihovny (sekvencni)**
```
Krok 1: [mp-mid-storage-tenant] Vytvorit adminKanbanStorage.js
        - Schema, defaults, CRUD pro Kanban nastaveni
        - Validace prechodu mezi stavy
        Soubor: src/utils/adminKanbanStorage.js

Krok 2: Instalace @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities
        Prikaz: npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Faze 2: Zakladni Kanban (sekvencni)**
```
Krok 3: [mp-spec-fe-kanban] KanbanBoard — zakladni layout
        - Sloupce pro kazdy status
        - Staticky rendering karet (bez DnD)
        Soubor: src/pages/admin/components/KanbanBoard.jsx

Krok 4: [mp-spec-fe-kanban] KanbanCard — design karty
        - Cislo objednavky, zakaznik, cena, datum, tagy
        Soubor: src/pages/admin/components/KanbanCard.jsx

Krok 5: [mp-spec-fe-kanban] KanbanColumn — sloupec s headerem
        - Nazev stavu, pocet objednavek, WIP indikator, barva
        Soubor: src/pages/admin/components/KanbanColumn.jsx
```

**Faze 3: Drag-and-drop (sekvencni, po Fazi 2)**
```
Krok 6: [mp-spec-fe-kanban] DnD integrace
        - DndContext wrapping
        - useDraggable pro karty, useDroppable pro sloupce
        - onDragEnd handler — update stavu objednavky
        Soubor: src/pages/admin/components/KanbanBoard.jsx (update)

Krok 7: [mp-spec-fe-kanban] DragOverlay
        - Preview karty pri tazeni
        - Vizualni indikace kam lze dropnout
        Soubor: src/pages/admin/components/KanbanDragOverlay.jsx

Krok 8: [mp-spec-fe-kanban] Validace prechodu
        - Kontrola ze presun je povoleny (transition_rules)
        - Toast pri nevalidnim presunu
        Soubor: src/pages/admin/components/KanbanBoard.jsx (update)
```

**Faze 4: Admin integrace (paralelne s Fazi 3)**
```
Krok 9: [mp-mid-frontend-admin] ViewToggle v AdminOrders
        - Prepinac Table | Kanban v hlavicce
        - Perzistence vybraneho view v kanban:v1 storage
        Soubor: src/pages/admin/AdminOrders.jsx (update)

Krok 10: [mp-spec-fe-tables] Extrakce sdilenych filtru
         - Vytahnout filtry z AdminOrders do samostatne komponenty
         - Sdileni mezi Table a Kanban view
         Soubor: src/pages/admin/components/OrderFilters.jsx
```

**Faze 5: Pokrocile features (paralelne)**
```
Krok 11a: [mp-spec-fe-kanban] Modaly pro specialni prechody
          - CancelReasonModal, TrackingNumberModal
          Soubory: src/pages/admin/components/TransitionModals.jsx

Krok 11b: [mp-spec-fe-kanban] KanbanSettings panel
          - WIP limity, viditelne sloupce, card display
          Soubor: src/pages/admin/components/KanbanSettings.jsx

Krok 11c: [mp-spec-fe-kanban] Vyhledavani a filtrovani na boardu
          - Real-time filtrace karet pres vsechny sloupce
          Soubor: src/pages/admin/components/KanbanBoard.jsx (update)
```

**Faze 6: Optimalizace a polish**
```
Krok 12: [mp-spec-fe-animations] Animace pri DnD
         - Smooth presun karty, spring animace
         - Hover efekty na sloupcich (highlight pri dragover)

Krok 13: [mp-mid-quality-code] Code review + testy

Krok 14: [mp-sr-frontend] Performance review
         - Virtualizace karet (react-window) pro >100 objednavek
         - Memoizace vypoctu (useMemo)
```

### C3. Kriticke rozhodovaci body

1. **@dnd-kit vs react-beautiful-dnd vs Pragmatic DnD?**
   - Rozhodnuti: `@dnd-kit/core` + `@dnd-kit/sortable`
   - Duvod: Aktivne vyvijena, moderni API, lehka (15KB gzip),
     dobre typovana, podporuje touch, accessibility out-of-box
   - react-beautiful-dnd je v maintenance mode (deprecated)

2. **Kanban jako nova stranka nebo tab v AdminOrders?**
   - Rozhodnuti: Tab/toggle v existujici AdminOrders strance
   - Duvod: Sdileni filtru, konzistentni URL (/admin/orders)
   - ViewToggle prepina mezi `OrdersTable` a `KanbanBoard`

3. **Jak resit razeni karet v ramci sloupce?**
   - Rozhodnuti: Defaultne dle data vytvoreni (nejnovejsi nahore)
   - Volitelne: Dle ceny, dle priority, dle zakaznika
   - Drag-and-drop v ramci sloupce: Manualni razeni (optional)

4. **Responzivita na mobilech?**
   - Rozhodnuti: Horizontalni scroll kontejner s snap-to-column
   - Na malych obrazovkach (<768px): Zobrazit jen 1-2 sloupce
   - Alternative: Kompaktni seznam misto kanban boardu

5. **Virtualizace karet?**
   - Rozhodnuti: Implementovat ve Fazi 6 pouze pokud je >100 karet
   - Knihovna: react-window s custom VariableSizeList
   - Trigger: Merime performance v dev tools, pokud jank > 16ms

### C4. Testovaci strategie

**Unit testy:**
- `adminKanbanStorage.test.js` — nastaveni, migrace, validace prechodu
- `isTransitionAllowed.test.js` — vsechny kombinace stavu
- `moveOrderToStatus.test.js` — update stavu, audit log

**Integracni testy:**
- Drag karty z "NEW" do "REVIEW" → order.status === "REVIEW"
- Drag do "CANCELED" → zobrazi CancelReasonModal
- Drag do "SHIPPED" → zobrazi TrackingNumberModal
- WIP limit prekrocen → sloupec ma cerveny border
- Filtrace → karty v boardu odpovida filtrum

**E2E testy (Playwright):**
```
1. Otevri /admin/orders
2. Klikni na Kanban toggle
3. Videt vsechny sloupce s kartami
4. Drag kartu z "Nova" do "Kontrola"
5. Overit ze karta je v novem sloupci
6. Overit ze audit log zaznamenal zmenu
7. Prepnout zpet na Table → overit stav v tabulce
```

**Accessibility testy:**
- Keyboard DnD: Space pro zvedeni, sipky pro presun, Enter pro polozeni
- Screen reader: Oznami "Objednavka ORD-000001 presunuta do Kontrola"
- Focus management: Po dropu focus zustane na karte

### C5. Migrace existujicich dat

**Migrace z V0 (zadna kanban data):**
- Pri prvnim prepnuti na Kanban se vytvori defaultni nastaveni v `kanban:v1`
- Objednavky zustaji v `orders:v1` — Kanban jen cte a meni `status`
- Zadna migrace objednavkovych dat neni potreba

**ViewMode persistence:**
- Default view = Table (zachovat stavajici chovani)
- Po prepnuti na Kanban se ulozi do `kanban:v1` jako `view_mode: "kanban"`
- Pri dalsim otevreni AdminOrders se nacte ulozeny view mode

---

## D. KVALITA

### D1. Security review body

- **Drag-and-drop manipulace:** Validovat stav na urovni storage, ne jen UI
  - Utocnik nemusi pouzit DnD — muze volat `moveOrderToStatus()` primo
  - Validace prechodu MUSI byt v storage helperu, ne jen v UI
- **Hromadny presun:** Overit ze uzivatel ma opravneni menit vsechny objednavky
  (relevantni az s multi-user — S12)
- **Rate limiting:** Zabranit rapidnimu presunu (100 karet za sekundu)
  — debounce save operace (300ms)
- **Audit log:** Kazda zmena stavu MUSI byt zaznamenana v activity logu
  vcetne casoveho razitka, puvodniho a noveho stavu

### D2. Performance budget

| Operace | Budget | Metrika |
|---------|--------|---------|
| Initial render (50 objednavek) | < 200ms | Time to interactive |
| Initial render (200 objednavek) | < 500ms | Time to interactive |
| Drag start (pick up card) | < 50ms | Input latency |
| Drag move (presun nad sloupce) | < 16ms/frame | Frame time (60fps) |
| Drop (ulozeni zmeny) | < 100ms | Time to persist |
| Filtrace (50 objednavek) | < 50ms | Filter response time |
| Bundle size @dnd-kit | < 20KB gzip | Bundle impact |
| Rerender pri zmene 1 karty | Pouze 1 karta + 2 sloupce | React profiler |

### D3. Accessibility pozadavky

- **Keyboard DnD (WCAG 2.1 Level AA):**
  - `Tab` pro navigaci mezi kartami
  - `Space` / `Enter` pro zvedeni karty
  - `Arrow Left/Right` pro presun mezi sloupci
  - `Arrow Up/Down` pro presun v ramci sloupce
  - `Escape` pro zruseni presunu
- **Screen reader:**
  - `role="list"` pro sloupec, `role="listitem"` pro kartu
  - `aria-label` na kazdem sloupci: "Sloupec Nova, 5 objednavek"
  - Live region pro oznameni presunu: "Objednavka ORD-000001 presunuta z Nova do Kontrola"
  - `aria-grabbed` / `aria-dropeffect` pro DnD stavy
- **Vizualni:**
  - WIP varovani: Cerveny border + ikona, ne jen barva (pro barvoslepy)
  - Dostatecny kontrast barev sloupcu: minimalne 3:1 pro non-text elementy
  - Focus ring na kartach pri keyboard navigaci

### D4. Error handling a edge cases

| Edge case | Reseni |
|-----------|--------|
| Presun do stavu se dosazenym WIP limitem | Povolit, ale zobrazit varovani toast |
| Nevalidni presun (DONE -> NEW) | Animovat zpet, zobrazit toast s vysvetlenim |
| Presun do CANCELED bez duvodu | Zobrazit CancelReasonModal, presun se nedokonci bez vyplneni |
| Presun do SHIPPED bez tracking cisla | Zobrazit TrackingNumberModal |
| Drag and drop na mobilu (touch) | @dnd-kit podporuje touch nativne |
| Soucastne editovani dvema uzivateli | Bez WebSocket: Last-write-wins (localStorage) |
| Prazdny sloupec | Zobrazit placeholder "Zadne objednavky" s drop zonou |
| Velky pocet karet (>200) | Virtualizace pres react-window |
| Pomaly network (budouci backend) | Optimistic update + rollback pri chybe |
| Uzky viewport (<640px) | Horizontalni scroll s padding, snap-to-column |

### D5. i18n pozadavky

**Prekladove klice pro Kanban:**
```json
{
  "kanban": {
    "view_toggle_table": "Tabulka",
    "view_toggle_kanban": "Kanban",
    "settings": "Nastaveni boardu",
    "hide_completed": "Skryt dokoncene",
    "wip_limit": "WIP limit",
    "wip_exceeded": "WIP limit prekrocen ({count}/{limit})",
    "no_orders": "Zadne objednavky v tomto stavu",
    "drag_hint": "Pretahnete kartu pro zmenu stavu",
    "moved_to": "Objednavka {number} presunuta do {status}",
    "invalid_transition": "Nelze presunout z {from} do {to}",
    "cancel_reason_title": "Duvod zruseni",
    "cancel_reason_placeholder": "Zadejte duvod zruseni objednavky...",
    "tracking_title": "Tracking cislo",
    "tracking_placeholder": "Zadejte cislo zasilky...",
    "carrier": "Prepravce",
    "compact_mode": "Kompaktni rezim",
    "show_thumbnail": "Zobrazit miniatury",
    "card_count": "{count} objednavek",
    "total_value": "Celkova hodnota: {value}"
  }
}
```

**Nazvy stavu (uz existuji v `adminOrdersStorage.js`):**
- `getStatusLabel(status)` — vraci lokalizovany nazev stavu

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flag:** `kanban_enabled` — default `true` (protoze je to rozsireni
existujici stranky, ne nova feature)

**Postupne nasazeni:**
1. **Alpha:** Zakladni Kanban board s drag-and-drop (bez WIP, bez modalu)
2. **Beta:** WIP limity, transition modaly, nastaveni boardu
3. **GA:** Kompletni feature set vcetne filtrace a virtualizace

**Rollback plan:**
- ViewToggle zachovava Table view jako default
- Pokud Kanban zpusobi problemy, staci prepnout na Table
- Kanban storage (`kanban:v1`) je oddeleny od objednavek (`orders:v1`)

### E2. Admin UI zmeny

**Zmeny v existujicich admin strankach:**

1. **AdminOrders.jsx** — hlavni zmeny:
   - Pridat `ViewToggle` komponent v hlavicce (Table | Kanban)
   - Podmineeny rendering: `{viewMode === 'kanban' ? <KanbanBoard /> : <OrdersTable />}`
   - Extrahovat filtry do sdilene komponenty `OrderFilters`

2. **AdminLayout.jsx** — minimalni zmeny:
   - Navigacni odkaz "Objednavky" zustava stejny (/admin/orders)
   - Volitelne: pridat badge s poctem novych objednavek

**Nove komponenty:**
```
src/pages/admin/components/KanbanBoard.jsx      — hlavni Kanban komponenta
src/pages/admin/components/KanbanColumn.jsx      — sloupec boardu
src/pages/admin/components/KanbanCard.jsx        — karta objednavky
src/pages/admin/components/KanbanDragOverlay.jsx — preview pri tazeni
src/pages/admin/components/KanbanSettings.jsx    — nastaveni boardu
src/pages/admin/components/TransitionModals.jsx  — modaly pro prechody
src/pages/admin/components/OrderFilters.jsx      — sdilene filtry
src/pages/admin/components/ViewToggle.jsx        — prepinac Table/Kanban
```

### E3. Widget zmeny

**Zadne prime zmeny widgetu.** Kanban je ciste admin-side feature.

Neprime zmeny (budouci):
- Pokud zakaznik ma portal (S12), zobrazi se mu aktualni stav objednavky
  ktery admin zmenil pres Kanban
- Real-time update stavu pres postMessage (viz B5)

### E4. Dokumentace pro uzivatele

**In-app tooltips:**
- "Prepnete na Kanban zobrazeni pro vizualni prehled o stavu objednavek"
- "Pretahnete kartu do jineho sloupce pro zmenu stavu objednavky"
- "Nastavte WIP limity pro kontrolu pretizeni jednotlivych fazi vyroby"

**Keyboard shortcuts (zobrazene v napovede):**
- `K` — prepnout na Kanban view
- `T` — prepnout na Table view
- `F` — focus na vyhledavani
- `S` — otevrit nastaveni boardu

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Adoption rate (% adminu pouzivajicich Kanban) | > 40% do 30 dni | View mode v storage |
| Pocet drag-and-drop presunu / den | > 5 presunu / aktivni admin | Event tracking |
| Cas na zmenu stavu (Kanban vs Table) | 50% redukce | Porovnani casu |
| Chybovost presunu (invalid transitions) | < 5% | Error tracking |
| Performance (FCP Kanban view) | < 200ms | Web Vitals |
| Pouzivani WIP limitu | > 20% tenantu | Settings tracking |
| Spokojenost (NPS delta) | +5 bodu | Uzivatelske pruzkumy |

---

## F. REFERENCNI SNIPPETY

### F1. Zakladni DnD setup s @dnd-kit

```jsx
// src/pages/admin/components/KanbanBoard.jsx
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ORDER_STATUSES } from '../../../utils/adminOrdersStorage';
import { isTransitionAllowed, loadKanbanSettings } from '../../../utils/adminKanbanStorage';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

export default function KanbanBoard({ orders, onStatusChange, filters }) {
  const [activeCard, setActiveCard] = useState(null);
  const settings = loadKanbanSettings();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Rozdelit objednavky do sloupcu dle statusu
  const columns = useMemo(() => {
    const cols = {};
    for (const status of ORDER_STATUSES) {
      cols[status] = orders.filter(o => o.status === status);
    }
    return cols;
  }, [orders]);

  function handleDragStart(event) {
    const order = orders.find(o => o.id === event.active.id);
    setActiveCard(order);
  }

  function handleDragEnd(event) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id;
    const targetStatus = over.id; // ID sloupce = status
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === targetStatus) return;

    if (!isTransitionAllowed(order.status, targetStatus, settings.settings.transition_rules)) {
      toast.error(`Nelze presunout z ${order.status} do ${targetStatus}`);
      return;
    }

    onStatusChange(orderId, targetStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        {settings.settings.visible_statuses.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            orders={columns[status] || []}
            wipLimit={settings.settings.wip_limits[status]}
            color={settings.settings.column_colors[status]}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard ? <KanbanCard order={activeCard} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### F2. Priklad KanbanCard

```jsx
// src/pages/admin/components/KanbanCard.jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function KanbanCard({ order, isDragOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragOverlay ? 'kanban-card-overlay' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <span className="order-number">{order.number}</span>
        {order.is_express && <span className="badge badge-red">Express</span>}
      </div>
      <div className="kanban-card-body">
        <div className="customer">{order.customer?.name}</div>
        <div className="details">
          <span>{order.models?.length || 0} modelu</span>
          <span>{formatMoney(order.computed?.grand_total)}</span>
        </div>
      </div>
      <div className="kanban-card-footer">
        <span className="date">{formatDate(order.created_at)}</span>
        <div className="tags">
          {extractMaterialTags(order).map(tag => (
            <span key={tag} className="material-tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
```
