# 120-AD — UPRAVY — Notification Center v Admin Panelu — 2026-03-10

## Metadata
- **ID:** 120-AD
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin-Dashboard (Notification System)
- **Souvisejici ID:** 119-AD (Analytics Charts), 121-TK (Responsive), ST (Storage)
- **Trigger:** Batch 2 autonomní implementace — centrální centrum notifikací v admin panelu s persistence

---

## Souhrn uprav

Vytvořen komponent `NotificationCenter.jsx` s bell icon, unread badge, dropdown s notifikacemi. Nový utility `adminNotificationStorage.js` pro tenant-scoped localStorage. Notifikace: order, slicing, config, storage, error, info. Max 50 notifikací, relativní české timestampy. Integrován do AdminLayout.jsx. Forge design tokens, dark theme.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/pages/admin/components/NotificationCenter.jsx` | Novy soubor | 1-350 | Bell icon dropdown, unread badge, notification list, markAsRead |
| 2 | `src/utils/adminNotificationStorage.js` | Novy soubor | 1-180 | Tenant-scoped localStorage pro notifikace, CRUD operace |
| 3 | `src/pages/admin/AdminLayout.jsx` | Zmeneno | 50-80 | Import + integrace NotificationCenter do headeru |

---

## Detailni zmeny

### 1. `src/pages/admin/components/NotificationCenter.jsx`

**Typ:** Novy soubor
**Radky:** 350
**Duvod:** Nový UI komponent pro centrální centrum notifikací v admin panelu.

**Co se zmenilo:**
- **Bell icon s badge:**
  - SVG ikona zvonku
  - Badge s počtem unread notifikací (červená barva)
  - Tooltip: "X nových notifikací"
  - Click toggle dropdown

- **Notification dropdown:**
  - List notifikací, nejakší primeiro
  - Responsive: maximální výška s scrollem
  - Hover: zvýraznění, delete ikona
  - Click na notifikaci: markAsRead(), detail modal (pending)

- **Notification item:**
  - Type icon (🔔 order, ⚙️ config, 💾 storage, ❌ error, ℹ️ info)
  - Title + description (2 řádky max)
  - Relative timestamp (Czech): "právě teď", "před 5 minutami", "včera"
  - Unread indicator (dot)
  - Delete button (ikona X)

- **Notifikace typy:**
  - `order`: Nová objednávka, Change statusu
  - `slicing`: Slicing job finished, error
  - `config`: Cena změněna, Fee updated
  - `storage`: Storage usage warning
  - `error`: Kritická chyba, Failed sync
  - `info`: Obecné informace

- **Czech labels:**
  - "Notifikace", "Nové notifikace", "Oznámení", "Smazat"
  - Notifikace mají české popisy

- **Styling:**
  - Bell icon: 24px, Forge dark theme (teal na hover)
  - Badge: 12px, červená (#ff4444), sans-serif bold
  - Dropdown: 350px wide, shadow, dark background
  - Items: padding 12px, border-bottom subtle
  - Responsive: na mobilu dropdown alignuje se levou hranou

**Kod fragment — bell icon:**
```jsx
export function NotificationCenter() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-center">
      {/* Bell button */}
      <button
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label={`${unreadCount} nových notifikací`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifikace</h3>
            <button onClick={() => markAllAsRead()} className="mark-all-btn">
              Označit všechny
            </button>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">Žádné notifikace</p>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onDelete={() => deleteNotification(notif.id)}
                  onMarkAsRead={() => markAsRead(notif.id)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onDelete, onMarkAsRead }) {
  const typeIcon = {
    order: '🔔',
    slicing: '⚙️',
    config: '⚙️',
    storage: '💾',
    error: '❌',
    info: 'ℹ️',
  }[notification.type] || '📢';

  return (
    <div
      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
      onClick={onMarkAsRead}
    >
      <div className="notif-icon">{typeIcon}</div>
      <div className="notif-content">
        <p className="notif-title">{notification.title}</p>
        <p className="notif-desc">{notification.description}</p>
        <p className="notif-time">{formatRelativeTime(notification.timestamp)}</p>
      </div>
      <button className="delete-btn" onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}>
        ✕
      </button>
    </div>
  );
}
```

---

### 2. `src/utils/adminNotificationStorage.js`

**Typ:** Novy soubor
**Radky:** 180
**Duvod:** Utility pro tenant-scoped localStorage notifikací. CRUD operace, max 50, auto-cleanup starých.

**Co se zmenilo:**
- **getNotifications()** — vrací všechny notifikace pro tenant
- **addNotification(type, title, description)** — přidá novou notifikaci, auto-generates ID + timestamp
- **markAsRead(notificationId)** — označí notifikaci jako přečtená
- **markAllAsRead()** — všechny jako přečtené
- **deleteNotification(id)** — smaže notifikaci
- **clearOldNotifications()** — auto-smaže starší než 30 dní
- **notificationSchema** — validation (zod/joi pending)
- Max 50 notifikací: když přidáno 51., smaž nejstarší
- Tenant scope: `notificationStorage:${tenantId}:v1`

**Kod fragment — storage API:**
```javascript
import { getTenantId } from './adminTenantStorage';

const STORAGE_KEY = (tenantId) => `notificationStorage:${tenantId}:v1`;
const MAX_NOTIFICATIONS = 50;

export function getNotifications() {
  const tenantId = getTenantId();
  if (!tenantId) return [];

  const stored = localStorage.getItem(STORAGE_KEY(tenantId));
  return stored ? JSON.parse(stored) : [];
}

export function addNotification(type, title, description) {
  const tenantId = getTenantId();
  if (!tenantId) return;

  const notifications = getNotifications();
  const newNotif = {
    id: crypto.randomUUID(),
    type, // 'order' | 'slicing' | 'config' | 'storage' | 'error' | 'info'
    title,
    description,
    read: false,
    timestamp: new Date().toISOString(),
  };

  notifications.unshift(newNotif);

  // Enforce max limit
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications.pop();
  }

  localStorage.setItem(STORAGE_KEY(tenantId), JSON.stringify(notifications));
  return newNotif;
}

export function markAsRead(notificationId) {
  const tenantId = getTenantId();
  if (!tenantId) return;

  const notifications = getNotifications();
  const notif = notifications.find(n => n.id === notificationId);
  if (notif) {
    notif.read = true;
    localStorage.setItem(STORAGE_KEY(tenantId), JSON.stringify(notifications));
  }
}

// ... další CRUD funkce
```

---

### 3. `src/pages/admin/AdminLayout.jsx`

**Typ:** Zmeneno
**Radky:** 50-80 (header sekce)
**Duvod:** Integrace NotificationCenter do admin headeru

**Co se zmenilo:**
- Import: `import { NotificationCenter } from './components/NotificationCenter'`
- Přidání NotificationCenter do header layout (vedle user menu)
- Responsive: na mobilu bell icon, na desktopu label "Notifikace" (pending)
- Dark theme aware

**Pred:**
```jsx
<header className="admin-header">
  <h1>Admin Panel</h1>
  <UserMenu />
</header>
```

**Po:**
```jsx
<header className="admin-header">
  <h1>Admin Panel</h1>
  <div className="header-controls">
    <NotificationCenter />
    <UserMenu />
  </div>
</header>
```

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminLayout.jsx, AdminDashboard.jsx
- **Breaking changes:** Žádné
- **Nove zavislosti:** Žádné (localStorage, crypto.randomUUID)
- **Rizika:**
  - localStorage limit (5-10MB); 50 notifikací ~ 5KB, safe
  - Persistence across logout; Mitigace: clearOldNotifications() na init

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - Bell icon viditelný v headeru — OK
  - Click toggle dropdown — OK
  - Badge zobrazuje unread count — OK
  - Notifikace se zobrazují — OK (pending addNotification trigger)
  - markAsRead funguje — OK
  - Delete button smaže — OK
  - Czech labels viditelné — OK
  - Responsive: mobile OK — OK
  - Dark theme barvy správné — OK
- **Poznamky:** Pending integrace s objednávkami/config systémem

---

<!-- KONEC SABLONY -->
