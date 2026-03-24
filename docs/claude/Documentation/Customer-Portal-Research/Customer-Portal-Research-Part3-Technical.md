# Customer Portal Research - Part 3: Technicka Architektura, Bezpecnost a Retence

> **Datum:** 2026-03-22
> **Kontext:** ModelPricer — SaaS pro 3D-tiskove firmy
> **Ucel:** Hloubkovy vyzkum technickych vzoru, bezpecnostnich best practices a retencnich strategii pro zakaznicky portal

---

## Obsah

1. [Technicka Architektura](#1-technicka-architektura)
   1.1 [Architekturni vzory (SPA, Micro-frontends)](#11-architekturni-vzory)
   1.2 [State Management pro zakaznicka data](#12-state-management)
   1.3 [API Design pro customer portal endpointy](#13-api-design)
   1.4 [Real-time funkce (WebSocket, SSE, Supabase Realtime)](#14-real-time-funkce)
   1.5 [Sprava souboru a 3D modelu](#15-sprava-souboru-a-3d-modelu)
   1.6 [Caching strategie](#16-caching-strategie)
   1.7 [Paginace a infinite scroll](#17-paginace-a-infinite-scroll)

2. [Bezpecnostni Best Practices](#2-bezpecnostni-best-practices)
   2.1 [Autentizacni flow (JWT, sessions, refresh tokeny)](#21-autentizacni-flow)
   2.2 [Autorizacni vzory (RBAC)](#22-autorizacni-vzory-rbac)
   2.3 [Datova izolace (RLS, tenant isolation)](#23-datova-izolace)
   2.4 [CSRF/XSS ochrana](#24-csrfxss-ochrana)
   2.5 [Bezpecnost uploadu 3D souboru](#25-bezpecnost-uploadu-3d-souboru)
   2.6 [PCI Compliance a zpracovani plateb](#26-pci-compliance)
   2.7 [GDPR compliance](#27-gdpr-compliance)
   2.8 [Account recovery a password reset](#28-account-recovery)
   2.9 [Rate limiting](#29-rate-limiting)
   2.10 [Session management](#210-session-management)

3. [Customer Retention Features](#3-customer-retention-features)
   3.1 [Loyalty programy a odmeny](#31-loyalty-programy)
   3.2 [Personalizace a doporuceni](#32-personalizace)
   3.3 [Emailove notifikace](#33-emailove-notifikace)
   3.4 [Abandoned cart recovery](#34-abandoned-cart)
   3.5 [Referral programy](#35-referral-programy)
   3.6 [Feedback a review systemy](#36-feedback-a-review)
   3.7 [Usage analytika pro zakazniky](#37-usage-analytika)
   3.8 [Bulk objednavky](#38-bulk-objednavky)
   3.9 [Team/organizacni ucty](#39-teamorganizacni-ucty)

4. [Performance a Skalovatelsnost](#4-performance-a-skalovatelsnost)
   4.1 [Lazy loading pro knihovny modelu](#41-lazy-loading)
   4.2 [Optimalizace obrazku a thumbnails](#42-optimalizace-obrazku)
   4.3 [Database indexing strategie](#43-database-indexing)
   4.4 [CDN pro staticke assety](#44-cdn-strategie)

5. [Pristupnost (WCAG 2.1 AA)](#5-pristupnost-wcag-21-aa)
   5.1 [Klavesnicova navigace](#51-klavesnicova-navigace)
   5.2 [Screen reader podpora](#52-screen-reader-podpora)
   5.3 [Barevny kontrast](#53-barevny-kontrast)
   5.4 [Focus management v multi-step flows](#54-focus-management)

---

## 1. Technicka Architektura

### 1.1 Architekturni vzory

#### SPA (Single Page Application) — Doporuceno pro ModelPricer

Pro SaaS produkt velikosti ModelPriceru je **SPA architektura s React** optimalni volba. Micro-frontends se vyplati az pri 5+ tymu pracujicich na jednom produktu.

**Proc SPA:**
- Jeden tym/maly tym — zadna rezije micro-frontend orchestrace
- Rychly vyvoj s React + Vite
- Code splitting pres React.lazy() + Suspense staci pro performance
- Sdileny state (auth, tenant, jazyk) je jednodussi v jednom SPA

**Architektura pro customer portal v ramci existujiciho SPA:**

```
src/
  pages/
    portal/                        # Customer Portal root
      PortalLayout.jsx             # Layout s portal navigaci
      PortalDashboard.jsx          # Prehled zakaznika
      PortalOrders.jsx             # Seznam objednavek
      PortalOrderDetail.jsx        # Detail objednavky
      PortalModels.jsx             # Knihovna modelu
      PortalModelDetail.jsx        # Detail modelu
      PortalProfile.jsx            # Profil zakaznika
      PortalNotifications.jsx      # Notifikace
      PortalBilling.jsx            # Fakturace
      components/                  # Portal-specificke komponenty
        OrderCard.jsx
        ModelThumbnail.jsx
        StatusTimeline.jsx
        QuickReorder.jsx
      hooks/                       # Portal-specificke hooky
        usePortalOrders.js
        usePortalModels.js
        usePortalNotifications.js
```

**Route struktura:**

```jsx
// src/Routes.jsx — pridani portal rout
import { lazy, Suspense } from 'react';

const PortalLayout = lazy(() => import('@/pages/portal/PortalLayout'));
const PortalDashboard = lazy(() => import('@/pages/portal/PortalDashboard'));
const PortalOrders = lazy(() => import('@/pages/portal/PortalOrders'));
const PortalOrderDetail = lazy(() => import('@/pages/portal/PortalOrderDetail'));
const PortalModels = lazy(() => import('@/pages/portal/PortalModels'));
const PortalProfile = lazy(() => import('@/pages/portal/PortalProfile'));

// V route konfiguraci:
{
  path: '/portal',
  element: (
    <PrivateRoute>
      <Suspense fallback={<PortalSkeleton />}>
        <PortalLayout />
      </Suspense>
    </PrivateRoute>
  ),
  children: [
    { index: true, element: <PortalDashboard /> },
    { path: 'orders', element: <PortalOrders /> },
    { path: 'orders/:orderId', element: <PortalOrderDetail /> },
    { path: 'models', element: <PortalModels /> },
    { path: 'models/:modelId', element: <PortalModelDetail /> },
    { path: 'profile', element: <PortalProfile /> },
    { path: 'billing', element: <PortalBilling /> },
    { path: 'notifications', element: <PortalNotifications /> },
  ],
}
```

**Kdy zvazit micro-frontends:**
- Kdyz ma portal vlastni release cyklus nezavisly na admin casti
- Kdyz roste tym na 5+ vyvojaru pracujicich paralelne
- V tom pripade: Module Federation (Webpack 5) nebo single-spa framework
- React 19+ nativne podporuje Server Components, ktere mohou micro-frontends castecne nahradit

---

### 1.2 State Management

#### Doporucena strategie pro ModelPricer: TanStack Query + Zustand

Na zaklade vyzkumu a aktualniho stavu ekosystemu (2025/2026) je optimalni kombinace:

| Typ stavu | Reseni | Duvod |
|-----------|--------|-------|
| **Server state** (objednavky, modely, pricing) | TanStack Query (React Query) | Automaticky cache, refetch, deduplication, pagination |
| **Client state** (UI stav, filtry, formulare) | Zustand | Lehky, zadny boilerplate, skvely DevTools |
| **Auth/tenant kontext** | React Context | Uz existuje v projektu (AuthContext) |
| **Formularovy stav** | React Hook Form | Uz pouzivano v projektu |

**TanStack Query — zakladni setup pro portal:**

```jsx
// src/pages/portal/hooks/usePortalOrders.js
import { useQuery, useInfiniteQuery, useMutation, useQueryClient }
  from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

// Zakladni query s cachovanim
export function usePortalOrders(filters = {}) {
  return useQuery({
    queryKey: ['portal', 'orders', filters],
    queryFn: () => apiClient.get('/api/portal/orders', { params: filters }),
    staleTime: 30 * 1000,         // 30s — data jsou "fresh"
    gcTime: 5 * 60 * 1000,        // 5 min — cache garbage collection
    refetchOnWindowFocus: true,    // Refetch pri navratu na tab
    placeholderData: (prev) => prev, // Zachovej predchozi data pri filtrech
  });
}

// Infinite scroll pro seznam objednavek
export function usePortalOrdersInfinite(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['portal', 'orders', 'infinite', filters],
    queryFn: ({ pageParam = null }) =>
      apiClient.get('/api/portal/orders', {
        params: { ...filters, cursor: pageParam, limit: 20 },
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  });
}

// Mutace — zruseni objednavky
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) =>
      apiClient.post(`/api/portal/orders/${orderId}/cancel`),
    onSuccess: (_, orderId) => {
      // Invaliduj cache objednavek
      queryClient.invalidateQueries({ queryKey: ['portal', 'orders'] });
      // Optimisticka aktualizace detailu
      queryClient.setQueryData(
        ['portal', 'orders', orderId],
        (old) => old ? { ...old, status: 'cancelled' } : old
      );
    },
  });
}
```

**Zustand — UI stav portalu:**

```js
// src/pages/portal/stores/usePortalUIStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePortalUIStore = create(
  persist(
    (set) => ({
      // Filtry objednavek
      orderFilters: {
        status: 'all',
        dateRange: 'last30',
        sortBy: 'createdAt',
        sortDir: 'desc',
      },
      setOrderFilters: (filters) =>
        set((state) => ({
          orderFilters: { ...state.orderFilters, ...filters },
        })),

      // Zobrazeni modelu (grid vs list)
      modelViewMode: 'grid',
      setModelViewMode: (mode) => set({ modelViewMode: mode }),

      // Sidebar stav
      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // Notifikacni preference
      notificationPrefs: {
        email: true,
        browser: true,
        orderUpdates: true,
        promotions: false,
      },
      setNotificationPrefs: (prefs) =>
        set((s) => ({
          notificationPrefs: { ...s.notificationPrefs, ...prefs },
        })),
    }),
    {
      name: 'portal-ui-preferences',
      partialize: (state) => ({
        orderFilters: state.orderFilters,
        modelViewMode: state.modelViewMode,
        sidebarCollapsed: state.sidebarCollapsed,
        notificationPrefs: state.notificationPrefs,
      }),
    }
  )
);
```

**Proc NE Redux:**
- Prilis velky boilerplate pro projekt teto velikosti
- TanStack Query pokryva 80%+ server state managementu
- Zustand je lehci alternativa pro zbytek (~2kB vs Redux 42kB+)
- Redux Toolkit je overkill pokud neni potreba strict middleware pipeline

---

### 1.3 API Design pro Customer Portal Endpointy

#### RESTful API konvence

```
Zakladni prefix: /api/portal/

Autentizace:
  POST   /api/auth/login
  POST   /api/auth/logout
  POST   /api/auth/refresh
  POST   /api/auth/forgot-password
  POST   /api/auth/reset-password

Profil:
  GET    /api/portal/profile
  PATCH  /api/portal/profile
  PUT    /api/portal/profile/avatar
  DELETE /api/portal/profile/avatar
  PUT    /api/portal/profile/password
  GET    /api/portal/profile/sessions        # Aktivni sessions
  DELETE /api/portal/profile/sessions/:id     # Odpojeni session

Objednavky:
  GET    /api/portal/orders                   # Seznam (paginovany)
  GET    /api/portal/orders/:id               # Detail
  POST   /api/portal/orders                   # Nova objednavka
  POST   /api/portal/orders/:id/cancel        # Zruseni
  POST   /api/portal/orders/:id/reorder       # Opakovat objednavku
  GET    /api/portal/orders/:id/tracking      # Sledovani
  GET    /api/portal/orders/:id/invoice        # Faktura (PDF)

Modely:
  GET    /api/portal/models                   # Seznam modelu zakaznika
  GET    /api/portal/models/:id               # Detail modelu
  POST   /api/portal/models                   # Upload noveho modelu
  DELETE /api/portal/models/:id               # Smazani modelu
  PATCH  /api/portal/models/:id               # Aktualizace metadat
  GET    /api/portal/models/:id/thumbnail     # Thumbnail
  POST   /api/portal/models/:id/analyze       # Spustit analyzu (slicer)

Notifikace:
  GET    /api/portal/notifications             # Seznam notifikaci
  PATCH  /api/portal/notifications/:id/read    # Oznacit jako prectene
  POST   /api/portal/notifications/read-all    # Oznacit vse
  GET    /api/portal/notifications/preferences # Preference
  PUT    /api/portal/notifications/preferences # Aktualizace preferenci

Fakturace:
  GET    /api/portal/billing/invoices          # Seznam faktur
  GET    /api/portal/billing/invoices/:id/pdf  # Stazeni PDF
  GET    /api/portal/billing/payment-methods   # Platebni metody
  POST   /api/portal/billing/payment-methods   # Pridat metodu

Ceny/Kalkulace:
  POST   /api/portal/calculate                 # Cenova kalkulace
  GET    /api/portal/materials                 # Dostupne materialy
  GET    /api/portal/presets                   # Tiskove presety
```

#### Response format — standardizovany:

```json
// Uspesna odpoved
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 147,
    "nextCursor": "eyJpZCI6MjB9",
    "hasMore": true
  }
}

// Chybova odpoved
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Objednavka s timto ID nebyla nalezena",
    "details": null
  }
}

// Validacni chyba
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Neplatna vstupni data",
    "details": {
      "fields": {
        "email": "Neplatny format emailu",
        "phone": "Telefonni cislo musi obsahovat predvolbu"
      }
    }
  }
}
```

#### Cursor-based pagination (doporuceno pro objednavky):

```js
// backend-local/src/routes/portalRoutes.js
router.get('/orders', requireAuth, async (req, res) => {
  const { cursor, limit = 20, status, dateFrom, dateTo, sortBy = 'created_at' } = req.query;
  const customerId = req.user.id;

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('customer_id', customerId)
    .order(sortBy, { ascending: false })
    .limit(parseInt(limit) + 1); // +1 pro detekci dalsi stranky

  if (cursor) {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
    query = query.lt('created_at', decoded.created_at);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);

  const { data, error, count } = await query;

  if (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'DB_ERROR', message: error.message },
    });
  }

  const hasMore = data.length > parseInt(limit);
  const items = hasMore ? data.slice(0, -1) : data;
  const nextCursor = hasMore
    ? Buffer.from(JSON.stringify({
        created_at: items[items.length - 1].created_at,
        id: items[items.length - 1].id,
      })).toString('base64')
    : null;

  res.json({
    success: true,
    data: items,
    meta: { total: count, limit: parseInt(limit), nextCursor, hasMore },
  });
});
```

---

### 1.4 Real-time Funkce (WebSocket, Supabase Realtime)

#### Supabase Realtime — optimalni pro ModelPricer

Protoze ModelPricer jiz pouziva Supabase, je **Supabase Realtime** nejlepsi volba pro real-time funkce. Neni potreba provozovat vlastni WebSocket server.

**Klicove real-time scenare:**

| Scenar | Typ | Priorita |
|--------|-----|----------|
| Stav objednavky se zmeni | Postgres Changes | P0 |
| Nova notifikace | Postgres Changes | P0 |
| Tisk modelu dokoncen | Postgres Changes | P1 |
| Uzivatel online status | Presence | P2 |
| Live chat podpora | Broadcast | P2 |

**Implementace — useOrderRealtime hook:**

```jsx
// src/pages/portal/hooks/useOrderRealtime.js
import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useNotificationContext } from '@/contexts/NotificationContext';

export function useOrderRealtime(customerId) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationContext();

  const handleOrderChange = useCallback((payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'UPDATE') {
      // Aktualizuj cache objednavek
      queryClient.invalidateQueries({ queryKey: ['portal', 'orders'] });

      // Aktualizuj detail konkretni objednavky
      queryClient.setQueryData(
        ['portal', 'orders', newRecord.id],
        (old) => old ? { ...old, ...newRecord } : newRecord
      );

      // Zobraz toast notifikaci pri zmene stavu
      if (oldRecord.status !== newRecord.status) {
        const statusMessages = {
          processing: 'Vase objednavka se zacala zpracovavat',
          printing: 'Tisk vaseho modelu prave zacal',
          quality_check: 'Model prosel kontrolou kvality',
          shipped: 'Vase objednavka byla odeslana!',
          delivered: 'Objednavka byla dorucena',
          cancelled: 'Objednavka byla zrusena',
        };

        addNotification({
          type: newRecord.status === 'cancelled' ? 'warning' : 'success',
          title: `Objednavka #${newRecord.order_number}`,
          message: statusMessages[newRecord.status]
            || `Stav zmenen na: ${newRecord.status}`,
        });
      }
    }
  }, [queryClient, addNotification]);

  useEffect(() => {
    if (!customerId) return;

    const channel = supabase
      .channel(`portal-orders-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${customerId}`,
        },
        handleOrderChange
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Subscribed to order changes');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error:', err?.message);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customerId, handleOrderChange]);
}

// Pouziti v PortalLayout:
function PortalLayout() {
  const { user } = useAuth();
  useOrderRealtime(user?.id);

  return <Outlet />;
}
```

**Notifikacni realtime kanal:**

```jsx
// src/pages/portal/hooks/useNotificationRealtime.js
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useNotificationRealtime(userId) {
  const queryClient = useQueryClient();
  const audioRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Priprav zvukovou notifikaci
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.3;

    const channel = supabase
      .channel(`portal-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Invaliduj notifikacni cache
          queryClient.invalidateQueries({
            queryKey: ['portal', 'notifications'],
          });

          // Invaliduj pocet neprectenych
          queryClient.invalidateQueries({
            queryKey: ['portal', 'notifications', 'unread-count'],
          });

          // Browser notifikace (pokud povoleno)
          if (Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/icons/notification-icon.png',
            });
          }

          // Zvukovy signal
          audioRef.current?.play().catch(() => {});
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, queryClient]);
}
```

**Alternativa — Server-Sent Events (SSE):**
Pokud by bylo potreba odlehcit Supabase Realtime (limity na Free planu), SSE je jednoduchy fallback:

```js
// backend-local/src/routes/portalSSE.js
router.get('/portal/events', requireAuth, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Nginx
  });

  const userId = req.user.id;
  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Heartbeat kazdych 30s
  const heartbeat = setInterval(
    () => sendEvent('ping', { ts: Date.now() }),
    30000
  );

  // Registruj klienta do event bus
  eventBus.subscribe(userId, sendEvent);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventBus.unsubscribe(userId, sendEvent);
  });
});
```

---

### 1.5 Sprava Souboru a 3D Modelu

#### Architektura pro model management

```
Upload Flow:
  1. Klient vybere soubor (STL/3MF/OBJ)
  2. Client-side validace (velikost, typ, zakladni hlavicka)
  3. Presigned URL z backendu (Cloudflare R2)
  4. Direct upload na R2 (obchazi backend — sni zatez)
  5. Backend webhook/callback — server-side validace
  6. Generovani thumbnails (async worker)
  7. Analyza modelu (PrusaSlicer — async)
  8. Aktualizace DB zaznamu se stavem

Uloziste:
  R2 bucket/
    models/
      {tenant_id}/
        {customer_id}/
          {model_id}/
            original.stl          # Originalni soubor
            thumbnail-sm.webp     # 200x200
            thumbnail-md.webp     # 400x400
            thumbnail-lg.webp     # 800x800
            analysis.json         # Vysledky sliceru
            metadata.json         # Uzivatelska metadata
```

**Presigned URL upload:**

```js
// backend-local/src/routes/portalModels.js
router.post('/models/upload-url', requireAuth, async (req, res) => {
  const { filename, contentType, fileSize } = req.body;
  const customerId = req.user.id;
  const tenantId = req.tenantId;

  // Validace
  const allowedExtensions = ['.stl', '.3mf', '.obj', '.step', '.stp'];
  const maxFileSize = 100 * 1024 * 1024; // 100 MB

  const ext = path.extname(filename).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: `Nepodporovany typ souboru: ${ext}`,
      },
    });
  }

  if (fileSize > maxFileSize) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'Soubor je prilis velky (max 100 MB)',
      },
    });
  }

  // Generuj unikatni model ID
  const modelId = crypto.randomUUID();
  const key = `models/${tenantId}/${customerId}/${modelId}/original${ext}`;

  // Presigned URL pro R2
  const presignedUrl = await storageProvider.getPresignedUploadUrl(key, {
    expiresIn: 3600,
    contentType: contentType || 'application/octet-stream',
    maxContentLength: maxFileSize,
  });

  // Vytvor DB zaznam ve stavu "uploading"
  await supabase.from('models').insert({
    id: modelId,
    tenant_id: tenantId,
    customer_id: customerId,
    filename: filename,
    file_size: fileSize,
    file_type: ext.replace('.', ''),
    storage_key: key,
    status: 'uploading',
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    data: { modelId, uploadUrl: presignedUrl, key },
  });
});

// Callback po uploadu
router.post('/models/:modelId/upload-complete', requireAuth, async (req, res) => {
  const { modelId } = req.params;
  const customerId = req.user.id;

  // Over ze model patri zakaznikovi
  const { data: model } = await supabase
    .from('models')
    .select('*')
    .eq('id', modelId)
    .eq('customer_id', customerId)
    .single();

  if (!model) {
    return res.status(404).json({
      success: false,
      error: { code: 'MODEL_NOT_FOUND' },
    });
  }

  // Spust async zpracovani
  await supabase
    .from('models')
    .update({ status: 'processing' })
    .eq('id', modelId);

  // Enqueue thumbnail generovani + analyzu
  await jobQueue.add('process-model', {
    modelId,
    tenantId: model.tenant_id,
    storageKey: model.storage_key,
    fileType: model.file_type,
  });

  res.json({ success: true, data: { status: 'processing' } });
});
```

**Metadata schema pro modely:**

```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,           -- stl, 3mf, obj
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploading',
  -- Analyza
  volume_cm3 DECIMAL(12,4),
  surface_area_cm2 DECIMAL(12,4),
  dimensions_mm JSONB,               -- {x, y, z}
  triangle_count INTEGER,
  is_manifold BOOLEAN,
  -- Thumbnails
  thumbnail_sm TEXT,                  -- URL
  thumbnail_md TEXT,
  thumbnail_lg TEXT,
  -- Metadata
  name TEXT,                          -- Uzivatelsky nazev
  description TEXT,
  tags TEXT[],                        -- PostgreSQL array
  material_preference TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- RLS politiky
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_own_models" ON models
  FOR ALL USING (
    customer_id = auth.uid()
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  );
```

---

### 1.6 Caching Strategie

#### Multi-urovnova cache architektura

```
Vrstva 1: Browser Cache (HTTP headers)
  - Staticke assety (JS, CSS, obrazky): Cache-Control: public, max-age=31536000, immutable
  - Thumbnails: Cache-Control: public, max-age=86400, s-maxage=604800
  - API odpovedi: Cache-Control: private, no-cache (server validace)

Vrstva 2: CDN Cache (Cloudflare)
  - Staticke assety: Edge cache 1 rok
  - Thumbnails: Edge cache 7 dni
  - API: Bypass (Cloudflare Workers pro specificke endpointy)

Vrstva 3: Application Cache (TanStack Query)
  - staleTime: Jak dlouho jsou data "fresh" (neprobehne refetch)
  - gcTime: Jak dlouho zustanou v pameti po unmount

Vrstva 4: Server Cache (optional — Redis)
  - Session data
  - Rate limiting counters
  - Casto pristupovana konfigurace (pricing, materials)
```

**TanStack Query cache konfigurace pro portal:**

```jsx
// src/pages/portal/config/queryConfig.js
export const portalQueryDefaults = {
  // Objednavky — casta zmena, kratsi cache
  orders: {
    staleTime: 30 * 1000,     // 30s
    gcTime: 5 * 60 * 1000,    // 5 min
    refetchOnWindowFocus: true,
    retry: 2,
  },

  // Modely — meni se mene casto
  models: {
    staleTime: 2 * 60 * 1000,  // 2 min
    gcTime: 10 * 60 * 1000,    // 10 min
    refetchOnWindowFocus: false,
  },

  // Profil — skoro se nemeni
  profile: {
    staleTime: 5 * 60 * 1000,  // 5 min
    gcTime: 30 * 60 * 1000,    // 30 min
    refetchOnWindowFocus: false,
  },

  // Materialy, presety — staticka data
  materials: {
    staleTime: 15 * 60 * 1000, // 15 min
    gcTime: 60 * 60 * 1000,    // 1 hodina
    refetchOnWindowFocus: false,
  },

  // Notifikace — aktualni
  notifications: {
    staleTime: 10 * 1000,      // 10s
    gcTime: 5 * 60 * 1000,     // 5 min
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // Poll kazdou minutu (fallback pro realtime)
  },
};
```

**HTTP Cache headers na backendu:**

```js
// backend-local/src/middleware/cacheHeaders.js
export function cacheHeaders(type) {
  return (req, res, next) => {
    switch (type) {
      case 'static':
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        break;
      case 'thumbnail':
        res.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        res.set('Vary', 'Accept');
        break;
      case 'api-private':
        res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        break;
      case 'api-short':
        res.set('Cache-Control', 'private, max-age=60');
        break;
      default:
        res.set('Cache-Control', 'no-store');
    }
    next();
  };
}

// Pouziti:
router.get('/materials', cacheHeaders('api-short'), getMaterials);
router.get('/orders', cacheHeaders('api-private'), getOrders);
```

---

### 1.7 Paginace a Infinite Scroll

#### Cursor-based vs Offset-based Pagination

| Aspekt | Cursor-based | Offset-based |
|--------|-------------|--------------|
| **Konzistence** | Odolna vuci insert/delete | Muze preskocit/duplikovat polozky |
| **Vykonnost** | O(1) — pouziva index | O(n) — OFFSET scanuje radky |
| **Infinite scroll** | Idealni | Mozne, ale problematicke |
| **"Skoc na stranku X"** | Nemozne | Snadne |
| **Doporuceni** | Objednavky, notifikace | Admin tabulky s pevnymi strankami |

**Frontend implementace — Infinite Scroll s TanStack Query + Virtual:**

```jsx
// src/pages/portal/components/OrderList.jsx
import { useRef, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInView } from 'react-intersection-observer';
import { apiClient } from '@/services/apiClient';
import { OrderCard } from './OrderCard';
import { usePortalUIStore } from '../stores/usePortalUIStore';

export function OrderList() {
  const { orderFilters } = usePortalUIStore();
  const parentRef = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['portal', 'orders', 'infinite', orderFilters],
    queryFn: ({ pageParam = null }) =>
      apiClient.get('/api/portal/orders', {
        params: {
          ...orderFilters,
          cursor: pageParam,
          limit: 20,
        },
      }),
    getNextPageParam: (lastPage) => lastPage.meta?.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  // Srovnej vsechny stranky do jednoho pole
  const allOrders = data?.pages.flatMap((page) => page.data) ?? [];

  // Virtualizer — renderuje jen viditelne polozky
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allOrders.length + 1 : allOrders.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Odhadovana vyska OrderCard
    overscan: 5,
  });

  // Intersection Observer pro nacitani dalsi stranky
  const { ref: loadMoreRef } = useInView({
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  if (isLoading) return <OrderListSkeleton />;
  if (isError) return <ErrorState message={error.message} />;
  if (allOrders.length === 0) return <EmptyState type="orders" />;

  return (
    <div
      ref={parentRef}
      className="portal-order-list"
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= allOrders.length;
          const order = allOrders[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div ref={loadMoreRef} className="portal-load-more">
                  {isFetchingNextPage ? <Spinner size="sm" /> : 'Nacist dalsi...'}
                </div>
              ) : (
                <OrderCard order={order} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 2. Bezpecnostni Best Practices

### 2.1 Autentizacni Flow (JWT, Refresh Tokeny)

#### Doporucena architektura pro ModelPricer

ModelPricer jiz pouziva Firebase Auth + Supabase bridge. Pro customer portal je doporuceno:

**Token strategie:**

```
Access Token (JWT):
  - Zivotnost: 15 minut
  - Ulozeni: In-memory (JavaScript promenna)
  - Obsah: userId, tenantId, role, email
  - NIKDY v localStorage (XSS zranitelnost)

Refresh Token:
  - Zivotnost: 7 dni (14 dni s "remember me")
  - Ulozeni: HttpOnly, Secure, SameSite=Strict cookie
  - Rotace: Novy refresh token pri kazdem pouziti
  - Detekce: Reuse detection (pokud je pouzit stary token, revokuj vsechny)
```

**Implementace — Auth interceptor s silent refresh:**

```js
// src/services/apiClient.js — vylepseny pro portal
import axios from 'axios';

let accessToken = null;
let refreshPromise = null;

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // Posila cookies (refresh token)
});

// Request interceptor — pridej access token
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — auto-refresh pri 401
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Pokud je 401 a jeste jsme nezkouesli refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Deduplikace — kdyz uz probiha refresh, cekej na nej
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const newToken = await refreshPromise;
        accessToken = newToken;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh selhal — odhlasit uzivatele
        accessToken = null;
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

async function refreshAccessToken() {
  const response = await axios.post('/api/auth/refresh', null, {
    withCredentials: true,
  });
  return response.data.accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

export { apiClient };
```

**Backend — refresh endpoint s rotaci:**

```js
// backend-local/src/routes/authRoutes.js
router.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_REFRESH_TOKEN', message: 'Prihlaste se znovu' },
    });
  }

  try {
    // Over refresh token v DB
    const { data: tokenRecord } = await supabase
      .from('refresh_tokens')
      .select('*')
      .eq('token_hash', hashToken(refreshToken))
      .eq('revoked', false)
      .single();

    if (!tokenRecord) {
      // REUSE DETECTION — nekdo pouzil stary token!
      // Revokuj VSECHNY tokeny tohoto uzivatele
      const decoded = verifyRefreshToken(refreshToken, { ignoreExpiration: true });
      if (decoded?.userId) {
        await supabase
          .from('refresh_tokens')
          .update({ revoked: true, revoked_reason: 'reuse_detected' })
          .eq('user_id', decoded.userId);

        console.warn(
          `[Security] Refresh token reuse detected for user ${decoded.userId}`
        );
      }

      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REUSE',
          message: 'Bezpecnostni problem — prihlaste se znovu',
        },
      });
    }

    // Over expiraci
    if (new Date(tokenRecord.expires_at) < new Date()) {
      await supabase
        .from('refresh_tokens')
        .update({ revoked: true, revoked_reason: 'expired' })
        .eq('id', tokenRecord.id);

      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Session vyprsela' },
      });
    }

    // Revokuj stary refresh token
    await supabase
      .from('refresh_tokens')
      .update({ revoked: true, revoked_reason: 'rotated' })
      .eq('id', tokenRecord.id);

    // Vygeneruj novy par tokenu
    const newAccessToken = generateAccessToken({
      userId: tokenRecord.user_id,
      tenantId: tokenRecord.tenant_id,
      role: tokenRecord.role,
    });

    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await supabase.from('refresh_tokens').insert({
      user_id: tokenRecord.user_id,
      tenant_id: tokenRecord.tenant_id,
      role: tokenRecord.role,
      token_hash: hashToken(newRefreshToken),
      expires_at: expiresAt.toISOString(),
      user_agent: req.get('user-agent'),
      ip_address: req.ip,
    });

    // Nastav novy refresh token jako cookie
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REFRESH_FAILED', message: 'Chyba pri obnove session' },
    });
  }
});
```

---

### 2.2 Autorizacni Vzory (RBAC)

#### Role schema pro customer portal

```
Role hierarchie:
  portal_admin     — Spravce firmy (vsechny objednavky, tymy, fakturace)
  portal_manager   — Manager (vsechny objednavky, bez fakturace)
  portal_user      — Bezny zakaznik (jen sve objednavky)
  portal_viewer    — Jen cteni (napr. externi auditor)
```

**RBAC middleware:**

```js
// backend-local/src/middleware/portalAuth.js

// Permission mapa
const PERMISSIONS = {
  portal_admin: [
    'orders:read', 'orders:write', 'orders:cancel',
    'models:read', 'models:write', 'models:delete',
    'billing:read', 'billing:write',
    'team:read', 'team:write',
    'profile:read', 'profile:write',
  ],
  portal_manager: [
    'orders:read', 'orders:write', 'orders:cancel',
    'models:read', 'models:write', 'models:delete',
    'team:read',
    'profile:read', 'profile:write',
  ],
  portal_user: [
    'orders:read', 'orders:write',
    'models:read', 'models:write', 'models:delete',
    'profile:read', 'profile:write',
  ],
  portal_viewer: [
    'orders:read',
    'models:read',
    'profile:read',
  ],
};

export function requirePermission(...permissions) {
  return (req, res, next) => {
    const userRole = req.user?.portalRole || 'portal_user';
    const userPermissions = PERMISSIONS[userRole] || [];

    const hasAll = permissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Nemate opravneni k teto akci',
          required: permissions,
        },
      });
    }

    next();
  };
}

// Pouziti:
router.delete('/orders/:id', requireAuth, requirePermission('orders:cancel'), cancelOrder);
router.get('/billing/invoices', requireAuth, requirePermission('billing:read'), getInvoices);
```

**React hook pro role:**

```jsx
// src/pages/portal/hooks/usePortalPermissions.js
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function usePortalPermissions() {
  const { user } = useAuth();

  return useMemo(() => {
    const role = user?.portalRole || 'portal_user';
    const perms = PERMISSIONS[role] || [];

    return {
      role,
      can: (permission) => perms.includes(permission),
      canAny: (...permissions) => permissions.some((p) => perms.includes(p)),
      canAll: (...permissions) => permissions.every((p) => perms.includes(p)),
      isAdmin: role === 'portal_admin',
      isManager: role === 'portal_admin' || role === 'portal_manager',
    };
  }, [user?.portalRole]);
}

// Pouziti v komponentach:
function OrderActions({ order }) {
  const { can } = usePortalPermissions();
  return (
    <div>
      {can('orders:cancel') && order.status === 'pending' && (
        <Button onClick={() => cancelOrder(order.id)}>Zrusit objednavku</Button>
      )}
      {can('orders:write') && (
        <Button onClick={() => reorder(order.id)}>Objednat znovu</Button>
      )}
    </div>
  );
}
```

---

### 2.3 Datova Izolace (RLS, Tenant Isolation)

#### Supabase RLS politiky pro customer portal

**Klicovy princip:** Zakaznik NIKDY nesmi videt data jineho zakaznika. Toto je vynuceno na urovni databaze pomoci RLS, ne jen v aplikaci.

```sql
-- Zakladni RLS pro objednavky
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Zakaznik vidi jen sve objednavky ve svem tenantu
CREATE POLICY "portal_orders_select" ON orders
  FOR SELECT USING (
    customer_id = auth.uid()
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  );

-- Zakaznik muze vytvaret objednavky jen pro sebe
CREATE POLICY "portal_orders_insert" ON orders
  FOR INSERT WITH CHECK (
    customer_id = auth.uid()
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  );

-- Zakaznik muze aktualizovat jen sve objednavky (omezene sloupce)
CREATE POLICY "portal_orders_update" ON orders
  FOR UPDATE USING (
    customer_id = auth.uid()
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND status IN ('pending', 'draft')
  );

-- Admin tenanta vidi vsechny objednavky v tenantu
CREATE POLICY "admin_orders_all" ON orders
  FOR ALL USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

**Backend — dvojita validace (belt-and-suspenders):**

```js
// I kdyz RLS chrani data na DB urovni, pridejme validaci i na API urovni
router.get('/orders/:orderId', requireAuth, async (req, res) => {
  const { orderId } = req.params;
  const customerId = req.user.id;
  const tenantId = req.tenantId;

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('customer_id', customerId)    // Belt
    .eq('tenant_id', tenantId)        // Suspenders
    .single();

  if (!order) {
    // Nerikame "forbidden" — utocnik by vedel ze order existuje
    return res.status(404).json({
      success: false,
      error: { code: 'ORDER_NOT_FOUND', message: 'Objednavka nenalezena' },
    });
  }

  res.json({ success: true, data: order });
});
```

---

### 2.4 CSRF/XSS Ochrana

#### XSS prevence

```js
// 1. Content Security Policy (CSP) — backend middleware
// backend-local/src/middleware/securityHeaders.js
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        (req, res) => `'nonce-${res.locals.cspNonce}'`,
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', '*.cloudflare.com', '*.supabase.co'],
      connectSrc: [
        "'self'",
        '*.supabase.co',
        'wss://*.supabase.co',
        'https://*.stripe.com',
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],       // Ochrana proti clickjacking
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// 2. CSP nonce generovani
export function generateCspNonce(req, res, next) {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
}
```

**React — DOMPurify pro uzivatelsky obsah:**

```jsx
// src/utils/sanitize.js
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
}

// V komponentech — NIKDY nepouzivat dangerouslySetInnerHTML primo
function ModelDescription({ html }) {
  const clean = sanitizeHtml(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

#### CSRF ochrana

```js
// backend-local/src/middleware/csrf.js
import { doubleCsrf } from 'csrf-csrf';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});

// Aplikuj na state-changing endpointy
app.use('/api/portal', doubleCsrfProtection);

// Endpoint pro ziskani CSRF tokenu
app.get('/api/csrf-token', (req, res) => {
  res.json({ token: generateToken(req, res) });
});
```

---

### 2.5 Bezpecnost Uploadu 3D Souboru

#### Bezpecnostni vrstvy pro upload

STL, 3MF a OBJ soubory jsou primarne datove formaty (souradnice a plochy) a nemohou obsahovat spustitelny kod. Ale stale existuji rizika:

**Rizika a mitigace:**

| Riziko | Mitigace |
|--------|----------|
| Velky soubor (DoS) | Max 100 MB, kontrola pred uploadem |
| Neplatny soubor (crash parseru) | Validace hlavicky + struktury na serveru |
| Soubor s jinou priponou | Magic bytes validace (ne jen pripona) |
| ZIP bomba (3MF je ZIP) | Limit dekomprimovane velikosti |
| Path traversal v 3MF (ZIP) | Sanitize cest pri extrakci |
| Steganografie v STL | Log + audit, ale neni realne riziko pro SaaS |
| Pretizeni uloziste | Per-tenant kvoty |

```js
// backend-local/src/validation/modelValidator.js

// Magic bytes pro 3D formaty
const FILE_SIGNATURES = {
  stl_binary: Buffer.from([0x80, 0x00]),
  stl_ascii: Buffer.from('solid'),
  three_mf: Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP (3MF je ZIP)
  obj: null,  // OBJ je ciste textovy — nema magic bytes
};

export async function validateModelFile(filePath, expectedType) {
  const stats = await fs.stat(filePath);

  // 1. Kontrola velikosti
  if (stats.size > 100 * 1024 * 1024) {
    throw new ValidationError('FILE_TOO_LARGE', 'Soubor presahuje 100 MB');
  }

  if (stats.size < 100) {
    throw new ValidationError('FILE_TOO_SMALL', 'Soubor je prilis maly');
  }

  // 2. Magic bytes validace
  const headerBuffer = Buffer.alloc(84);
  const fd = await fs.open(filePath, 'r');
  await fd.read(headerBuffer, 0, 84, 0);
  await fd.close();

  if (expectedType === 'stl') {
    return validateSTL(filePath, headerBuffer, stats.size);
  } else if (expectedType === '3mf') {
    return validate3MF(filePath, headerBuffer, stats.size);
  } else if (expectedType === 'obj') {
    return validateOBJ(filePath, stats.size);
  }

  throw new ValidationError('UNSUPPORTED_TYPE', `Nepodporovany typ: ${expectedType}`);
}

function validateSTL(filePath, header, fileSize) {
  const headerStr = header.toString('ascii', 0, 5);

  if (headerStr === 'solid') {
    return { format: 'stl-ascii', valid: true };
  }

  // Binary STL — hlavicka 80 bytes + 4 bytes (pocet trianglu)
  const triangleCount = header.readUInt32LE(80);
  const expectedSize = 84 + (triangleCount * 50);

  if (Math.abs(fileSize - expectedSize) > 10) {
    throw new ValidationError(
      'INVALID_STL',
      `STL ma neocekavanou velikost. Ocekavano: ~${expectedSize}B, skutecnost: ${fileSize}B`
    );
  }

  return { format: 'stl-binary', triangleCount, valid: true };
}

async function validate3MF(filePath, header, fileSize) {
  // 3MF je ZIP — over ZIP hlavicku
  if (!header.slice(0, 4).equals(FILE_SIGNATURES.three_mf)) {
    throw new ValidationError('INVALID_3MF', '3MF nema platnou ZIP hlavicku');
  }

  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();

  let totalUncompressed = 0;
  const MAX_UNCOMPRESSED = 500 * 1024 * 1024;
  const MAX_RATIO = 100;

  for (const entry of entries) {
    // Path traversal ochrana
    if (entry.entryName.includes('..') || entry.entryName.startsWith('/')) {
      throw new ValidationError('PATH_TRAVERSAL', 'Podezrely nazev souboru v archivu');
    }

    totalUncompressed += entry.header.size;
    const ratio = entry.header.size / (entry.header.compressedSize || 1);

    if (ratio > MAX_RATIO) {
      throw new ValidationError('ZIP_BOMB', 'Podezrele velky kompresni pomer');
    }

    if (totalUncompressed > MAX_UNCOMPRESSED) {
      throw new ValidationError('ARCHIVE_TOO_LARGE', 'Dekomprimovany obsah presahuje limit');
    }
  }

  // 3MF musi obsahovat [Content_Types].xml
  const contentTypes = entries.find((e) => e.entryName === '[Content_Types].xml');
  if (!contentTypes) {
    throw new ValidationError('INVALID_3MF', '3MF neobsahuje [Content_Types].xml');
  }

  return { format: '3mf', entryCount: entries.length, valid: true };
}
```

**Per-tenant kvoty:**

```js
// backend-local/src/middleware/storageQuota.js
export async function checkStorageQuota(req, res, next) {
  const tenantId = req.tenantId;
  const customerId = req.user.id;

  const { data } = await supabase
    .from('models')
    .select('file_size')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .is('deleted_at', null);

  const totalUsed = data?.reduce((sum, m) => sum + (m.file_size || 0), 0) || 0;
  const quotaLimit = 1024 * 1024 * 1024; // 1 GB per zakaznik

  if (totalUsed + parseInt(req.body.fileSize || 0) > quotaLimit) {
    return res.status(413).json({
      success: false,
      error: {
        code: 'STORAGE_QUOTA_EXCEEDED',
        message: `Dosazeno limitu uloziste. Pouzito: ${formatBytes(totalUsed)}, limit: ${formatBytes(quotaLimit)}`,
      },
    });
  }

  req.storageUsed = totalUsed;
  req.storageQuota = quotaLimit;
  next();
}
```

---

### 2.6 PCI Compliance

#### Stripe integrace — SAQ A compliance

ModelPricer pouziva Stripe, coz vyrazne zjednodusuje PCI compliance. Pri pouziti Stripe Elements nebo Checkout:

**Klicova pravidla:**

1. **NIKDY neprijimejte data karty na svem serveru** — pouzijte Stripe Elements
2. **Stripe Elements** hostuje pole pro cislo karty v iframe z `js.stripe.com`
3. Server zpracovava jen `PaymentIntent` ID — nikdy cislo karty
4. Pro SAQ A staci: pouzit Stripe JS/Elements + vyplnit SAQ A self-assessment

**Implementace — Stripe Elements v portalu:**

```jsx
// src/pages/portal/components/PaymentForm.jsx
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ orderId, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Ziskej PaymentIntent z backendu
      const { clientSecret } = await apiClient.post(
        '/api/portal/payments/create-intent',
        { orderId, amount }
      );

      // 2. Potvrdit platbu pres Stripe (data karty jdou primo na Stripe)
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        navigate(`/portal/orders/${orderId}?payment=success`);
      }
    } catch (err) {
      setError('Doslo k chybe pri zpracovani platby');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: 'var(--forge-text-primary)',
              '::placeholder': { color: 'var(--forge-text-muted)' },
            },
          },
          hidePostalCode: true,
        }}
      />
      {error && <div className="payment-error" role="alert">{error}</div>}
      <button type="submit" disabled={!stripe || isProcessing}>
        {isProcessing ? 'Zpracovavam...' : `Zaplatit ${formatCurrency(amount)}`}
      </button>
    </form>
  );
}

export function PaymentSection({ orderId, amount }) {
  return (
    <Elements stripe={stripePromise} options={{ locale: 'cs' }}>
      <CheckoutForm orderId={orderId} amount={amount} />
    </Elements>
  );
}
```

---

### 2.7 GDPR Compliance

#### Povinnosti pro ModelPricer (EU zakaznici)

| Pozadavek | Implementace | Status |
|-----------|-------------|--------|
| **Souhlas se zpracovanim** | Checkbox pri registraci, zaznam v DB | Nutne |
| **Pravo na pristup** | Export dat zakaznika (JSON/CSV) | Nutne |
| **Pravo na opravu** | Editace profilu | Existuje |
| **Pravo na vymazani** | Account deletion flow | Nutne |
| **Pravo na prenositelnost** | Export ve strojove citelnem formatu | Nutne |
| **Souhlas s cookies** | Cookie banner | Nutne |
| **Privacy Policy** | Stranka s informacemi | Nutne |
| **DPA** | Pro Supabase, Stripe, R2 | Nutne |

**Implementace — data export a smazani:**

```js
// backend-local/src/routes/portalGDPR.js

// Export vsech dat zakaznika (GDPR Art. 20)
router.get('/portal/gdpr/export', requireAuth, async (req, res) => {
  const customerId = req.user.id;
  const tenantId = req.tenantId;

  const [profile, orders, models, notifications, invoices] = await Promise.all([
    supabase.from('users').select('*').eq('id', customerId).single(),
    supabase.from('orders').select('*').eq('customer_id', customerId).eq('tenant_id', tenantId),
    supabase.from('models').select('*').eq('customer_id', customerId).eq('tenant_id', tenantId),
    supabase.from('notifications').select('*').eq('user_id', customerId),
    supabase.from('invoices').select('*').eq('customer_id', customerId),
  ]);

  const exportData = {
    exportDate: new Date().toISOString(),
    profile: sanitizeProfile(profile.data),
    orders: orders.data || [],
    models: (models.data || []).map((m) => ({ ...m, storage_key: undefined })),
    notifications: notifications.data || [],
    invoices: invoices.data || [],
  };

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: customerId,
    tenant_id: tenantId,
    action: 'gdpr_data_export',
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
  });

  res.setHeader('Content-Disposition', 'attachment; filename="my-data-export.json"');
  res.json(exportData);
});

// Smazani uctu (GDPR Art. 17)
router.post('/portal/gdpr/delete-account', requireAuth, async (req, res) => {
  const { confirmPassword, reason } = req.body;
  const customerId = req.user.id;
  const tenantId = req.tenantId;

  const isValid = await verifyPassword(customerId, confirmPassword);
  if (!isValid) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_PASSWORD', message: 'Neplatne heslo' },
    });
  }

  // Kontrola aktivnich objednavek
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('customer_id', customerId)
    .in('status', ['pending', 'processing', 'printing', 'shipped']);

  if (activeOrders?.length > 0) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'ACTIVE_ORDERS',
        message: `Mate ${activeOrders.length} aktivnich objednavek. Smazte ucet az po dokonceni.`,
      },
    });
  }

  // Soft delete — 30 dni grace period
  await supabase.from('users').update({
    status: 'deletion_pending',
    deletion_requested_at: new Date().toISOString(),
    deletion_reason: reason,
    email: `deleted_${customerId}@anonymized.local`,
    full_name: 'Smazany uzivatel',
    phone: null,
    avatar_url: null,
  }).eq('id', customerId);

  // Revokuj vsechny sessions
  await supabase
    .from('refresh_tokens')
    .update({ revoked: true, revoked_reason: 'account_deletion' })
    .eq('user_id', customerId);

  // Naplanova finalni smazani za 30 dni
  await jobQueue.add('gdpr-final-delete',
    { customerId, tenantId },
    { delay: 30 * 24 * 60 * 60 * 1000 }
  );

  res.clearCookie('refresh_token');
  res.json({
    success: true,
    data: {
      message: 'Ucet bude smazan za 30 dni. Do te doby lze smazani zrusit.',
      deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});
```

---

### 2.8 Account Recovery a Password Reset

```js
// backend-local/src/routes/authRoutes.js

// Zadost o reset hesla
router.post('/auth/forgot-password',
  rateLimiter({ max: 3, window: 15 * 60 }),
  async (req, res) => {
    const { email } = req.body;

    // VZDY vrac uspech — nesmime prozradit zda email existuje
    res.json({
      success: true,
      data: { message: 'Pokud ucet s timto emailem existuje, poslali jsme instrukce.' },
    });

    // Async — nevyvolava zpozdeni v odpovedi
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) return;

    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hodina

    await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token_hash: hashToken(token),
      expires_at: expiresAt.toISOString(),
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });

    await emailService.send({
      to: user.email,
      template: 'password-reset',
      data: {
        name: user.full_name,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${token}`,
        expiresIn: '1 hodinu',
        ip: req.ip,
      },
    });
  }
);

// Provedeni resetu
router.post('/auth/reset-password',
  rateLimiter({ max: 5, window: 15 * 60 }),
  async (req, res) => {
    const { token, newPassword } = req.body;

    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', details: passwordErrors },
      });
    }

    const { data: tokenRecord } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', hashToken(token))
      .eq('used', false)
      .single();

    if (!tokenRecord || new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Odkaz vyprel nebo je neplatny' },
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', tokenRecord.user_id);

    await supabase
      .from('password_reset_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', tokenRecord.id);

    // Revokuj vsechny sessions (bezpecnost)
    await supabase
      .from('refresh_tokens')
      .update({ revoked: true, revoked_reason: 'password_reset' })
      .eq('user_id', tokenRecord.user_id);

    res.json({
      success: true,
      data: { message: 'Heslo zmeneno. Prihlaste se novym heslem.' },
    });
  }
);
```

---

### 2.9 Rate Limiting

#### Vrstevnaty rate limiting pro portal

```js
// backend-local/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// Zakladni API limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 minuta
  max: 100,                // 100 requestu za minutu
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Prilis mnoho pozadavku.' },
  },
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Prihlaseni — prisne omezeni
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minut
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Prilis mnoho pokusu. Zkuste za 15 minut.',
    },
  },
  keyGenerator: (req) => req.body?.email || req.ip,
});

// Upload — omezeny pocet uploadu
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hodina
  max: 20,
  message: {
    success: false,
    error: { code: 'UPLOAD_RATE_LIMITED', message: 'Limit: 20 uploadu/hod.' },
  },
  keyGenerator: (req) => `upload:${req.user?.id}`,
});

// Aplikace:
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 3 }));
app.use('/api/portal/models/upload', uploadLimiter);
```

---

### 2.10 Session Management

#### Session politiky

```js
const SESSION_CONFIG = {
  idleTimeout: {
    portal: 30 * 60 * 1000,      // 30 min pro zakazniky
    admin: 15 * 60 * 1000,       // 15 min pro adminy
  },
  absoluteTimeout: {
    portal: 24 * 60 * 60 * 1000, // 24 hodin
    admin: 8 * 60 * 60 * 1000,   // 8 hodin
  },
  maxConcurrentSessions: {
    portal_user: 3,
    portal_admin: 2,
  },
};
```

**Frontend — idle detection:**

```js
// src/hooks/useIdleTimeout.js
import { useEffect, useRef, useCallback } from 'react';

export function useIdleTimeout(timeout, onIdle) {
  const timerRef = useRef(null);
  const warningRef = useRef(null);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(warningRef.current);

    // Varovani 2 minuty pred timeout
    warningRef.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('session:idle-warning', {
        detail: { remainingMs: 120000 },
      }));
    }, timeout - 120000);

    timerRef.current = setTimeout(onIdle, timeout);
  }, [timeout, onIdle]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timerRef.current);
      clearTimeout(warningRef.current);
    };
  }, [resetTimer]);
}
```

**Concurrent session management:**

```js
// backend-local/src/middleware/sessionManager.js
export async function enforceSessionLimit(userId, role) {
  const maxSessions = SESSION_CONFIG.maxConcurrentSessions[role] || 3;

  const { data: activeSessions } = await supabase
    .from('refresh_tokens')
    .select('id, created_at, user_agent, ip_address')
    .eq('user_id', userId)
    .eq('revoked', false)
    .order('created_at', { ascending: false });

  if (activeSessions && activeSessions.length >= maxSessions) {
    const toRevoke = activeSessions.slice(maxSessions - 1);
    const revokeIds = toRevoke.map((s) => s.id);

    await supabase
      .from('refresh_tokens')
      .update({ revoked: true, revoked_reason: 'max_sessions_exceeded' })
      .in('id', revokeIds);
  }
}
```

---

## 3. Customer Retention Features

### 3.1 Loyalty Programy a Odmeny

#### Bodovy system pro 3D tisk SaaS

```
Bodovy system:
  1 CZK utracena = 1 bod
  100 bodu = 1 CZK sleva

  Bonusove body:
  - Prvni objednavka: +500 bodu
  - Doporuceni pritel: +1000 bodu (oba)
  - Hodnoceni objednavky: +100 bodu
  - Nahrani 10+ modelu: +200 bodu
  - Mesicni aktivita: +50 bodu

Urovne:
  Bronze: 0-4999 bodu (1x body)
  Silver: 5000-19999 bodu (1.5x body + prednostni podpora)
  Gold: 20000-49999 bodu (2x body + 5% sleva + prioritni tisk)
  Platinum: 50000+ bodu (3x body + 10% sleva + free shipping)
```

**Database schema:**

```sql
CREATE TABLE loyalty_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  total_points INTEGER DEFAULT 0,
  available_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  tier_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, tenant_id)
);

CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES loyalty_accounts(id),
  type TEXT NOT NULL,            -- 'earn', 'redeem', 'expire', 'bonus'
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT,            -- 'order', 'referral', 'review', 'bonus'
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automaticky prepocet urovne
CREATE OR REPLACE FUNCTION update_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tier = CASE
    WHEN NEW.total_points >= 50000 THEN 'platinum'
    WHEN NEW.total_points >= 20000 THEN 'gold'
    WHEN NEW.total_points >= 5000 THEN 'silver'
    ELSE 'bronze'
  END;
  IF NEW.tier <> OLD.tier THEN
    NEW.tier_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER loyalty_tier_trigger
  BEFORE UPDATE ON loyalty_accounts
  FOR EACH ROW EXECUTE FUNCTION update_loyalty_tier();
```

---

### 3.2 Personalizace a Doporuceni

#### Doporuceni materialu a reorders

```js
// backend-local/src/services/recommendationService.js
export async function getPersonalizedRecommendations(customerId, tenantId) {
  const { data: orderHistory } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('customer_id', customerId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Nejcasteji pouzivane materialy
  const materialFrequency = {};
  orderHistory?.forEach((order) => {
    order.order_items?.forEach((item) => {
      materialFrequency[item.material] = (materialFrequency[item.material] || 0) + 1;
    });
  });

  const topMaterials = Object.entries(materialFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([material]) => material);

  // Doporucene k objednavce znovu (> 30 dni, dorucene)
  const reorderCandidates = orderHistory
    ?.filter((o) => {
      const daysSince = (Date.now() - new Date(o.created_at)) / (1000 * 60 * 60 * 24);
      return daysSince > 30 && o.status === 'delivered';
    })
    .slice(0, 5);

  return {
    topMaterials,
    reorderSuggestions: reorderCandidates,
    personalizedTips: generateTips(orderHistory, topMaterials),
  };
}

function generateTips(orderHistory, topMaterials) {
  const tips = [];
  const avgVolume = orderHistory?.reduce((sum, o) =>
    sum + (o.order_items?.reduce((s, i) => s + (i.volume_cm3 || 0), 0) || 0),
    0
  ) / (orderHistory?.length || 1);

  if (avgVolume > 100) {
    tips.push({
      type: 'cost_saving',
      message: 'U vetsich modelu doporucujeme PLA pro zaklad a PETG pro funkcni dily.',
    });
  }

  if (topMaterials.includes('ABS')) {
    tips.push({
      type: 'material_suggestion',
      message: 'ASA nabizi podobne vlastnosti jako ABS, ale je odolnejsi vuci UV.',
    });
  }

  return tips;
}
```

---

### 3.3 Emailove Notifikace

#### Emailovy flow pro objednavky

```
Trigger emailu:
  1. Objednavka prijata          -> Potvrzeni + souhrn
  2. Platba zpracovana           -> Potvrzeni platby
  3. Tisk zahajen                -> Info s odhadem dokonceni
  4. Kontrola kvality            -> Info (optional s fotkou)
  5. Odeslano                    -> Tracking cislo + link
  6. Doruceno                    -> Prosba o hodnoceni
  7. 7 dni po doruceni           -> Follow-up + kupon
  8. 30 dni neaktivita           -> "Chybite nam" + nabidka
  9. 90 dni neaktivita           -> Vyraznejsi nabidka

Retention emaily:
  - Nove materialy/technologie    -> Informativni s CTA
  - Cenove zmeny (slevy)          -> Urgence + personalizace
  - Narozeniny zakaznika          -> Kupon jako darek
  - Vyrocie prvni objednavky      -> Shrnuti + specialni nabidka
```

---

### 3.4 Abandoned Cart Recovery

#### Strategie pro 3D tisk SaaS

V kontextu 3D tisku "abandoned cart" znamena:
- Zakaznik nahral model, ale neobjednal
- Zakaznik pridal do kosiku, ale nedokoncil checkout
- Zakaznik zacal kalkulaci, ale neodesla

```js
// backend-local/src/jobs/abandonedCartJob.js

export async function checkAbandonedCarts() {
  // 1. Nahrany model bez objednavky (>24h)
  const { data: unorderedModels } = await supabase
    .from('models')
    .select('*, users!inner(email, full_name, notification_prefs)')
    .eq('status', 'analyzed')
    .is('order_id', null)
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .gt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  for (const model of unorderedModels || []) {
    const { data: sent } = await supabase
      .from('email_log')
      .select('id')
      .eq('user_id', model.customer_id)
      .eq('template', 'abandoned_model')
      .eq('reference_id', model.id)
      .single();

    if (!sent && model.users.notification_prefs?.email !== false) {
      await emailService.send({
        to: model.users.email,
        template: 'abandoned_model',
        data: {
          name: model.users.full_name,
          modelName: model.filename,
          calculatorUrl: `${FRONTEND_URL}/portal/models/${model.id}?action=order`,
        },
      });
    }
  }

  // 2. Nedokonceny checkout — 3-krokova sekvence:
  //    1h:  "Zapomnel jste neco?"
  //    24h: + 5% sleva
  //    72h: + 10% sleva (posledni sance)
}
```

---

### 3.5 Referral Programy

```
Doporucaci program:
  - Zakaznik sdili unikatni referral link
  - Novy zakaznik se registruje a provede prvni objednavku
  - Odmeny:
    - Doporucujici: 200 CZK kredit + 1000 loyalty bodu
    - Novy zakaznik: 15% sleva na prvni objednavku
  - Omezeni:
    - Max 10 referrals/mesic
    - Minimalni objednavka: 500 CZK
    - Referral link platny 90 dni
```

```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referee_id UUID REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',     -- pending, registered, completed, expired
  reward_given BOOLEAN DEFAULT false,
  first_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '90 days'
);
```

---

### 3.6 Feedback a Review Systemy

```jsx
// src/pages/portal/components/OrderReview.jsx
function OrderReview({ orderId }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const submitReview = useMutation({
    mutationFn: (data) => apiClient.post(`/api/portal/orders/${orderId}/review`, data),
    onSuccess: () => toast.success('Dekujeme za hodnoceni! (+100 bodu)'),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      submitReview.mutate({ rating, text: reviewText });
    }}>
      <h3>Jak jste spokojeni s objednavkou?</h3>

      <div role="radiogroup" aria-label="Hodnoceni">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} z 5 hvezd`}
            onClick={() => setRating(star)}
          >
            {star <= rating ? '\u2605' : '\u2606'}
          </button>
        ))}
      </div>

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Podelte se o zkusenost (nepovinne)..."
        maxLength={1000}
        aria-label="Text recenze"
      />

      <button type="submit" disabled={rating === 0 || submitReview.isPending}>
        {submitReview.isPending ? 'Odesilam...' : 'Odeslat hodnoceni (+100 bodu)'}
      </button>
    </form>
  );
}
```

---

### 3.7 Usage Analytika pro Zakazniky

```jsx
// src/pages/portal/components/CustomerInsights.jsx
function CustomerInsights() {
  const { data: insights } = useQuery({
    queryKey: ['portal', 'insights'],
    queryFn: () => apiClient.get('/api/portal/insights'),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <div className="customer-insights">
      <h2>Vase statistiky</h2>
      <div className="insight-grid">
        <InsightCard label="Celkem objednavek" value={insights?.totalOrders} />
        <InsightCard label="Celkem utraceno" value={formatCurrency(insights?.totalSpent)} />
        <InsightCard label="Prumerny cas doruceni" value={`${insights?.avgDeliveryDays} dni`} />
        <InsightCard label="Nejpouzivanejsi material" value={insights?.topMaterial} />
      </div>
      <SpendingChart data={insights?.monthlySpending} />
      <MaterialPieChart data={insights?.materialDistribution} />
    </div>
  );
}
```

---

### 3.8 Bulk Objednavky

```
Bulk ordering flow:
  1. Zakaznik nahra vice modelu najednou (drag & drop)
  2. System analyzuje kazdy model paralelne
  3. Tabulka: model | material | kvalita | kusov | cena
  4. Moznost zmeny parametru pro vsechny najednou
  5. Skupinova sleva pri vice nez 10 kusech

Volume slevy:
  1-9 kusu:    0%
  10-49 kusu:  5%
  50-99 kusu:  10%
  100+ kusu:   15% (nebo individualni cena)
```

---

### 3.9 Team/Organizacni Ucty

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  billing_email TEXT,
  tax_id TEXT,              -- ICO
  vat_id TEXT,              -- DIC
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- RLS: clen organizace vidi objednavky celeho tymu
CREATE POLICY "org_members_see_org_orders" ON orders
  FOR SELECT USING (
    customer_id IN (
      SELECT om.user_id FROM organization_members om
      WHERE om.organization_id IN (
        SELECT om2.organization_id FROM organization_members om2
        WHERE om2.user_id = auth.uid()
      )
    )
    AND tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID
  );
```

---

## 4. Performance a Skalovatelsnost

### 4.1 Lazy Loading pro Knihovny Modelu

```jsx
// src/pages/portal/PortalModels.jsx
import { lazy, Suspense, useState } from 'react';

// Lazy load 3D viewer — velky bundle (three.js)
const ModelViewer3D = lazy(() => import(
  /* webpackChunkName: "model-viewer" */
  '@/components/ModelViewer3D'
));

function PortalModels() {
  const [selectedModel, setSelectedModel] = useState(null);

  return (
    <div className="portal-models">
      <ModelGrid onSelect={setSelectedModel} />

      {selectedModel && (
        <Suspense fallback={<ModelViewerSkeleton />}>
          <ModelViewer3D
            modelUrl={selectedModel.downloadUrl}
            format={selectedModel.file_type}
          />
        </Suspense>
      )}
    </div>
  );
}
```

**Image lazy loading s LQIP (Low Quality Image Placeholder):**

```jsx
// src/pages/portal/components/ModelThumbnail.jsx
export function ModelThumbnail({ src, blurSrc, alt, width, height }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className="model-thumbnail" style={{ width, height }}>
      <img
        src={blurSrc || 'data:image/svg+xml,...'}
        alt=""
        className={`thumbnail-blur ${isLoaded ? 'hidden' : ''}`}
        style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
        aria-hidden="true"
      />
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`thumbnail-full ${isLoaded ? 'loaded' : ''}`}
        />
      )}
    </div>
  );
}
```

---

### 4.2 Optimalizace Obrazku a Thumbnails

#### Cloudflare R2 + Image Resizing pipeline

```
Upload -> R2 original -> Cloudflare Worker -> transformace -> CDN cache

URL schema:
  /cdn-cgi/image/width=200,height=200,format=webp,quality=80/models/{tenant}/{model}/thumbnail.png

Varianty:
  sm: 200x200, quality=70, format=webp  (~5-15 kB)
  md: 400x400, quality=80, format=webp  (~15-40 kB)
  lg: 800x800, quality=85, format=webp  (~40-100 kB)
```

**Backend thumbnail generovani:**

```js
// backend-local/src/jobs/generateThumbnails.js
import sharp from 'sharp';

export async function generateModelThumbnails(modelId, originalKey) {
  const originalBuffer = await storageProvider.getFile(originalKey);

  const renderBuffer = await renderModelToImage(originalBuffer, {
    width: 800, height: 800, background: '#f5f5f5', cameraAngle: 'isometric',
  });

  const sizes = [
    { name: 'sm', width: 200, height: 200, quality: 70 },
    { name: 'md', width: 400, height: 400, quality: 80 },
    { name: 'lg', width: 800, height: 800, quality: 85 },
  ];

  const basePath = originalKey.replace(/\/original\.\w+$/, '');

  for (const size of sizes) {
    const resized = await sharp(renderBuffer)
      .resize(size.width, size.height, { fit: 'contain', background: '#f5f5f5' })
      .webp({ quality: size.quality })
      .toBuffer();

    const key = `${basePath}/thumbnail-${size.name}.webp`;
    await storageProvider.putFile(key, resized, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=604800',
    });

    await supabase
      .from('models')
      .update({ [`thumbnail_${size.name}`]: key })
      .eq('id', modelId);
  }
}
```

---

### 4.3 Database Indexing Strategie

#### Optimalni indexy pro portal queries

```sql
-- OBJEDNAVKY
CREATE INDEX idx_orders_customer_tenant_created
  ON orders (customer_id, tenant_id, created_at DESC);

CREATE INDEX idx_orders_customer_status
  ON orders (customer_id, status, created_at DESC);

-- Fulltextove vyhledavani
CREATE INDEX idx_orders_search
  ON orders USING GIN (
    to_tsvector('simple', coalesce(order_number, '') || ' ' || coalesce(notes, ''))
  );

-- MODELY
CREATE INDEX idx_models_customer_tenant
  ON models (customer_id, tenant_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_models_tags
  ON models USING GIN (tags);

CREATE INDEX idx_models_name_trgm
  ON models USING GIN (name gin_trgm_ops);

-- NOTIFIKACE
CREATE INDEX idx_notifications_user_unread
  ON notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

-- LOYALTY
CREATE INDEX idx_loyalty_tx_account
  ON loyalty_transactions (account_id, created_at DESC);

-- REFRESH TOKENS
CREATE INDEX idx_refresh_tokens_active
  ON refresh_tokens (user_id, created_at DESC)
  WHERE revoked = false;
```

**Monitoring query performance:**

```sql
-- Najdi pomale queries
SELECT query, calls, mean_exec_time, total_exec_time, rows
FROM pg_stat_statements
WHERE query LIKE '%orders%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Zkontroluj vyuziti indexu
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

---

### 4.4 CDN Strategie

```
Cloudflare CDN konfigurace:

Static assets (JS, CSS, fonty):
  Cache-Control: public, max-age=31536000, immutable
  CDN TTL: 1 rok
  Versioning: Vite content hash

Model thumbnails:
  Cache-Control: public, max-age=86400, s-maxage=604800
  CDN TTL: 7 dni (CDN), 1 den (browser)

API responses:
  Cache-Control: private, no-store
  CDN: Bypass (/api/* -> Cache Level: Bypass)

Widget (embedovany):
  Cache-Control: public, max-age=3600
  CDN TTL: 1 hodina
  CORS: Whitelistovane domeny
```

---

## 5. Pristupnost (WCAG 2.1 AA)

### 5.1 Klavesnicova Navigace

#### Zakladni pozadavky (WCAG 2.1.1, 2.1.2)

```jsx
// Skip-to-content link (WCAG 2.4.1)
function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute', left: '-9999px', top: 'auto',
        width: '1px', height: '1px', overflow: 'hidden',
      }}
      onFocus={(e) => {
        e.target.style.cssText = `
          position: fixed; top: 10px; left: 10px; z-index: 9999;
          padding: 12px 24px; background: var(--forge-bg-primary);
          color: var(--forge-text-primary); border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          width: auto; height: auto; overflow: visible;
        `;
      }}
      onBlur={(e) => {
        e.target.style.cssText = `
          position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;
        `;
      }}
    >
      Preskocit na hlavni obsah
    </a>
  );
}

// Keyboard trap prevention — Modal (WCAG 2.1.2)
function PortalModal({ isOpen, onClose, title, children }) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      const firstFocusable = modalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    } else {
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div ref={modalRef} className="modal-content">
        <h2>{title}</h2>
        {children}
        <button onClick={onClose} aria-label="Zavrit dialog">Zavrit</button>
      </div>
    </div>
  );
}
```

---

### 5.2 Screen Reader Podpora

```jsx
// Order status — pristupny pro screen readery
function OrderStatusTimeline({ status, steps }) {
  return (
    <div role="list" aria-label="Prubehy stavu objednavky">
      {steps.map((step, index) => {
        const isComplete = steps.indexOf(status) >= index;
        const isCurrent = steps[index] === status;

        return (
          <div key={step} role="listitem" aria-current={isCurrent ? 'step' : undefined}>
            <span className={`status-dot ${isComplete ? 'complete' : 'pending'}`} aria-hidden="true" />
            <span className="status-label">{getStatusLabel(step)}</span>
            <span className="sr-only">
              {isComplete ? ' - Dokonceno' : isCurrent ? ' - Aktualni krok' : ' - Ceka na zpracovani'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Live region pro notifikace (WCAG 4.1.3)
function NotificationLiveRegion() {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const handler = (e) => {
      setAnnouncement(e.detail.message);
      setTimeout(() => setAnnouncement(''), 5000);
    };
    window.addEventListener('portal:notification', handler);
    return () => window.removeEventListener('portal:notification', handler);
  }, []);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
}

// Pristupna tabulka objednavek
function OrdersTable({ orders }) {
  return (
    <table aria-label="Seznam objednavek">
      <caption className="sr-only">
        Zobrazeno {orders.length} objednavek serazenych od nejnovejsi
      </caption>
      <thead>
        <tr>
          <th scope="col">Cislo objednavky</th>
          <th scope="col">Datum</th>
          <th scope="col">Stav</th>
          <th scope="col">Castka</th>
          <th scope="col"><span className="sr-only">Akce</span></th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <th scope="row">#{order.order_number}</th>
            <td><time dateTime={order.created_at}>{formatDate(order.created_at)}</time></td>
            <td><OrderStatusBadge status={order.status} /></td>
            <td>{formatCurrency(order.total_price)}</td>
            <td>
              <Link
                to={`/portal/orders/${order.id}`}
                aria-label={`Detail objednavky ${order.order_number}`}
              >
                Detail
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### 5.3 Barevny Kontrast

```css
/* Minimalni kontrastni pomery (WCAG 2.1 AA):
   - Normalni text (< 18pt): 4.5:1
   - Velky text (>= 18pt bold nebo >= 24pt): 3:1
   - UI komponenty a graficke elementy: 3:1
   - Focus indikatory: 3:1 vuci okolnimu pozadi
*/

/* Forge tokeny jiz splnuji WCAG AA: */
:root {
  --forge-text-primary: #E8E9EB;     /* na #1a1a2e = 13.2:1 */
  --forge-text-secondary: #B0B7C3;   /* na #1a1a2e = 8.4:1 */
  --forge-text-muted: #7A8291;       /* na #1a1a2e = 4.5:1 (AA minimum) */
  --forge-focus-ring: 0 0 0 2px #0d9488, 0 0 0 4px rgba(13, 148, 136, 0.3);
}

/* Focus visible indikator (WCAG 2.4.7 + 2.4.11) */
*:focus-visible {
  outline: 2px solid var(--forge-accent-teal);
  outline-offset: 2px;
  border-radius: 2px;
}

/* High contrast mode podpora */
@media (forced-colors: active) {
  .status-badge { border: 2px solid currentColor; }
  .button-primary { border: 2px solid ButtonText; }
}

/* Reduced motion (WCAG 2.3.3) */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 5.4 Focus Management v Multi-step Flows

```jsx
// src/pages/portal/components/MultiStepOrder.jsx
function MultiStepOrder() {
  const [currentStep, setCurrentStep] = useState(0);
  const stepRefs = useRef([]);
  const announceRef = useRef(null);

  const steps = [
    { id: 'upload', label: 'Nahrat model', component: UploadStep },
    { id: 'parameters', label: 'Parametry tisku', component: ParametersStep },
    { id: 'review', label: 'Kontrola', component: ReviewStep },
    { id: 'payment', label: 'Platba', component: PaymentStep },
  ];

  // Pri zmene kroku — presun focus na nadpis kroku
  useEffect(() => {
    stepRefs.current[currentStep]?.focus();
    if (announceRef.current) {
      announceRef.current.textContent =
        `Krok ${currentStep + 1} z ${steps.length}: ${steps[currentStep].label}`;
    }
  }, [currentStep]);

  const goToStep = (index) => {
    if (index >= 0 && index < steps.length) setCurrentStep(index);
  };

  const CurrentComponent = steps[currentStep].component;

  return (
    <div className="multi-step-order">
      <div ref={announceRef} role="status" aria-live="assertive" className="sr-only" />

      <nav aria-label="Kroky objednavky">
        <ol className="step-indicators">
          {steps.map((step, index) => (
            <li key={step.id} className={`step ${index === currentStep ? 'active' : ''}`}>
              <button
                onClick={() => index < currentStep ? goToStep(index) : null}
                disabled={index > currentStep}
                aria-current={index === currentStep ? 'step' : undefined}
                aria-label={`${step.label}${index < currentStep ? ' (dokonceno)' : ''}`}
              >
                <span aria-hidden="true">{index < currentStep ? '\u2713' : index + 1}</span>
                <span>{step.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="step-content">
        <h2 ref={(el) => (stepRefs.current[currentStep] = el)} tabIndex={-1}>
          {steps[currentStep].label}
        </h2>
        <CurrentComponent
          onNext={() => goToStep(currentStep + 1)}
          onPrev={() => goToStep(currentStep - 1)}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
        />
      </div>

      <div role="navigation" aria-label="Navigace kroky">
        {currentStep > 0 && <button onClick={() => goToStep(currentStep - 1)}>Zpet</button>}
        {currentStep < steps.length - 1 && (
          <button onClick={() => goToStep(currentStep + 1)}>Dalsi krok</button>
        )}
        {currentStep === steps.length - 1 && (
          <button onClick={handleSubmitOrder}>Odeslat objednavku</button>
        )}
      </div>
    </div>
  );
}

// Error summary — pristupny (WCAG 3.3.1)
function FormErrorSummary({ errors }) {
  const summaryRef = useRef(null);

  useEffect(() => {
    if (errors.length > 0) summaryRef.current?.focus();
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div ref={summaryRef} role="alert" tabIndex={-1} className="error-summary"
         aria-label={`${errors.length} chyb ve formulari`}>
      <h3>Prosim opravte nasledujici chyby:</h3>
      <ul>
        {errors.map((error, i) => (
          <li key={i}><a href={`#${error.fieldId}`}>{error.message}</a></li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Shrnuti a Doporuceni pro ModelPricer

### Prioritni implementace

| Priorita | Oblast | Doporuceni |
|----------|--------|------------|
| **P0** | Autentizace | JWT s refresh token rotaci, HttpOnly cookies |
| **P0** | Datova izolace | Supabase RLS + backend validace (belt-and-suspenders) |
| **P0** | PCI Compliance | Stripe Elements, SAQ A |
| **P0** | Rate limiting | express-rate-limit na vsechny endpointy |
| **P1** | State management | TanStack Query + Zustand |
| **P1** | Real-time | Supabase Realtime pro order tracking |
| **P1** | GDPR | Data export, account deletion, cookie consent |
| **P1** | Pristupnost | Keyboard nav, screen reader, focus management |
| **P2** | Caching | TanStack Query cache + CDN |
| **P2** | File management | Presigned uploads, thumbnail pipeline |
| **P2** | Retention | Email flows, abandoned cart |
| **P3** | Loyalty | Bodovy system, tiered rewards |
| **P3** | Referrals | Doporucaci program |
| **P3** | Team ucty | Organizacni ucty s RBAC |

### Technologicky stack pro portal (doporuceny)

```
Frontend:
  - React (existujici) + React Router
  - TanStack Query (server state)
  - Zustand (client state)
  - Forge Design System (existujici)

Backend:
  - Express (existujici)
  - Supabase (DB + RLS + Realtime)
  - Cloudflare R2 (storage) + CDN
  - Stripe (platby)
  - Resend (emaily)

Bezpecnost:
  - JWT + refresh token rotace
  - Supabase RLS pro datovou izolaci
  - helmet.js + CSP headers
  - express-rate-limit
  - DOMPurify pro XSS prevenci

Performance:
  - Code splitting (React.lazy)
  - TanStack Virtual (virtualizovane seznamy)
  - Cloudflare Image Resizing
  - Cursor-based pagination
```

---

> **Zdroje vyzkumu:** Auth0, OWASP Cheat Sheets, Stripe docs, Supabase docs, TanStack docs,
> Cloudflare docs, WCAG 2.2 specifikace, Brave Web Search (2026-03-22)
