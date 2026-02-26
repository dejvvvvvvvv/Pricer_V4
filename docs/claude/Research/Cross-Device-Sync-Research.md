# Cross-Device Data Synchronization Research

> **Datum:** 2026-02-26
> **Kontext:** ModelPricer V3 — migrace z localStorage na Supabase cloud DB
> **Stack:** React 19 + Vite, Supabase (Postgres + Realtime), localStorage fallback
> **Zdroje:** Context7 (Supabase docs, React docs), Brave Search (5 queries)

---

## Obsah

1. [Offline-First Patterns](#1-offline-first-patterns)
2. [Conflict Resolution](#2-conflict-resolution)
3. [Supabase Realtime](#3-supabase-realtime)
4. [Optimistic Updates](#4-optimistic-updates)
5. [Cache Invalidation](#5-cache-invalidation)
6. [Migration Strategies](#6-migration-strategies)
7. [Doporuceni pro ModelPricer](#7-doporuceni-pro-modelpricer)

---

## 1. Offline-First Patterns

### 1.1 Zakladni principy

Offline-first architektura predpoklada, ze sit neni spolehlivy zdroj. Aplikace funguje
primarne s lokalni kopii dat a synchronizuje se, kdyz je sit dostupna.

Tri zakladni strategie:

| Strategie | Popis | Vhodnost |
|-----------|-------|----------|
| **Cache-First** | Cteni z lokalni cache, pozadi sync | Caste cteni, ridke zapisy |
| **Network-First** | Pokus o sit, fallback na cache | Kriticka data, caste zapisy |
| **Stale-While-Revalidate** | Okamzite lokalni, pak pozadi refresh | UI responsivita |

Zdroj: https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/

### 1.2 Online/Offline detekce

```javascript
// Zakladni detekce
const isOnline = navigator.onLine;

// Event listenery pro zmeny stavu
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// Pokrocilejsi — skutecny network check
async function checkConnectivity() {
  try {
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-store'
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

**Poznamka:** `navigator.onLine` vraci `false` jen kdyz je zarizeni zcela offline.
Muze vratit `true` i pri nestabilnim pripojeni. Pro spolehlivou detekci je treba
aktivni ping na server (napr. health endpoint).

### 1.3 Offline Queue Pattern

Kdyz je aplikace offline, zapisy se ukladaji do fronty a odeslou se po obnoveni
pripojeni:

```javascript
// Priklad offline queue
class OfflineQueue {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  }

  enqueue(operation) {
    this.queue.push({
      ...operation,
      timestamp: Date.now(),
      id: crypto.randomUUID()
    });
    localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
  }

  async flush() {
    const pending = [...this.queue];
    for (const op of pending) {
      try {
        await this.execute(op);
        this.queue = this.queue.filter(q => q.id !== op.id);
        localStorage.setItem('offlineQueue', JSON.stringify(this.queue));
      } catch (err) {
        console.warn('[OfflineQueue] Failed to flush:', op.id, err);
        break; // Stop at first failure, retry later
      }
    }
  }

  async execute(operation) {
    // Deleguje na spravny storage adapter
    const { type, namespace, data, tenantId } = operation;
    switch (type) {
      case 'write':
        return storageAdapter.write(namespace, tenantId, null, data);
      case 'delete':
        return storageAdapter.supabase.delete(table, data.id);
    }
  }
}
```

### 1.4 Relevance pro ModelPricer

Nas soucasny pristup (localStorage jako primarni, Supabase fire-and-forget) je
de facto offline-first. Hlavni vylepaseni by bylo:

- **Offline queue** pro zapisy ktere selhaly pri fire-and-forget
- **Connectivity detection** pro UI indikaci (online/offline badge)
- **Retry logika** s exponential backoff

---

## 2. Conflict Resolution

### 2.1 Prehled strategii

| Strategie | Slozitost | Ztrata dat | Vhodnost |
|-----------|-----------|------------|----------|
| **Last-Write-Wins (LWW)** | Nizka | Mozna | Admin config, single-user |
| **First-Write-Wins** | Nizka | Mozna | Imutabilni data (logy) |
| **Server-Wins** | Nizka | Mozna | Autoritativni server |
| **Client-Wins** | Nizka | Mozna | Offline-first |
| **Merge (field-level)** | Stredni | Minimalni | Strukturovana data |
| **CRDT** | Vysoka | Zadna | Kolaborativni editace |
| **Manual Resolution** | UI naroky | Zadna | Kriticka business data |

Zdroj: https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade-offs-practical-guide-feb-19-2026/

### 2.2 Last-Write-Wins (LWW)

Nejjednodussi strategie — posledni zapis (podle timestampu) vyhrava.

```javascript
// Supabase upsert s updated_at = prirozeny LWW
const { error } = await supabase
  .from('pricing_configs')
  .upsert(
    {
      tenant_id: tenantId,
      namespace: 'pricing:v3',
      data: newConfig,
      updated_at: new Date().toISOString() // LWW timestamp
    },
    { onConflict: 'tenant_id,namespace' }
  );
```

**Vyhody:** Jednoducha implementace, Supabase upsert to dela nativne.
**Nevyhody:** Tichy prepis dat druheho uzivatele. Bez notifikace o konfliktu.

### 2.3 Field-Level Merge

Slouceni na urovni jednotlivych poli — pokud dva uzivatele meni ruzna pole,
obe zmeny se zachovaji:

```javascript
function fieldLevelMerge(serverData, clientData, baseData) {
  const merged = { ...serverData };

  for (const key of Object.keys(clientData)) {
    // Klient menil toto pole (rozdil od base)
    if (JSON.stringify(clientData[key]) !== JSON.stringify(baseData[key])) {
      // Server take menil toto pole — skutecny konflikt
      if (JSON.stringify(serverData[key]) !== JSON.stringify(baseData[key])) {
        // Oba menili stejne pole — LWW nebo manual resolution
        merged[key] = clientData[key]; // client-wins fallback
        merged._conflicts = merged._conflicts || [];
        merged._conflicts.push(key);
      } else {
        // Jen klient menil — pouzij klientovu verzi
        merged[key] = clientData[key];
      }
    }
  }

  return merged;
}
```

### 2.4 CRDT (Conflict-Free Replicated Data Types)

CRDT garantuji, ze divergentni kopie dat se daji vzdy slouit bez konfliktu.
Kazda operace je komutativni a idempotentni.

**Typy CRDT:**
- **G-Counter** — grow-only counter (pocitadla, analyticke metriky)
- **PN-Counter** — increment/decrement counter
- **LWW-Register** — single value s timestampem
- **OR-Set** — add/remove set (observeble remove)
- **Sequence CRDT** — pro text/listy (YATA, Logoot)

Zdroj: https://velt.dev/blog/crdt-implementation-guide-conflict-free-apps

**Knihovny pro JS:**
- **Yjs** — production-ready CRDT framework (MIT, 17k+ stars)
- **Automerge** — CRDT library od Ink & Switch (MIT)
- **VLCN (cr-sqlite)** — CRDT nad SQLite

**Relevance pro ModelPricer:** CRDT je overkill pro admin konfiguraci.
Nase data (pricing config, fees, branding) jsou single-tenant admin editace.
LWW s `updated_at` timestampem je dostacujici.

### 2.5 Doporucena strategie pro ModelPricer

**LWW s version check** — jednodussi nez CRDT, ale s detekcemi konfliktu:

```javascript
async function writeWithConflictCheck(namespace, tenantId, newData, expectedVersion) {
  // 1. Precti aktualni verzi ze serveru
  const { data: current } = await supabase
    .from(getTable(namespace))
    .select('updated_at, data')
    .eq('tenant_id', tenantId)
    .eq('namespace', namespace)
    .single();

  // 2. Porovnej verze
  if (current && current.updated_at !== expectedVersion) {
    // Konflikt! Data se zmenila od posledniho cteni
    return {
      conflict: true,
      serverData: current.data,
      serverVersion: current.updated_at
    };
  }

  // 3. Zapis (LWW)
  const { error } = await supabase
    .from(getTable(namespace))
    .upsert({
      tenant_id: tenantId,
      namespace,
      data: newData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id,namespace' });

  return { conflict: false, error };
}
```

---

## 3. Supabase Realtime

### 3.1 Tri typy Realtime kanalu

Supabase Realtime nabizi tri mechanismy:

| Typ | Ucel | Latence | Pouziti |
|-----|------|---------|---------|
| **Postgres Changes (CDC)** | Reakce na DB zmeny | ~100-500ms | Sync UI s DB |
| **Broadcast** | P2P zpravy pres kanal | ~50-100ms | Chat, notifikace |
| **Presence** | Sledovani pripojenych klientu | ~100ms | "kdo je online" |

Zdroj: Context7 — /supabase/supabase-js (Realtime docs)

### 3.2 Postgres Changes — zakladni pouziti

```javascript
// Prihlaseni k odeberu zmen na tabulce pricing_configs pro konkretniho tenanta
const channel = supabase
  .channel('pricing-sync')
  .on(
    'postgres_changes',
    {
      event: '*',           // INSERT, UPDATE, DELETE, nebo *
      schema: 'public',
      table: 'pricing_configs',
      filter: `tenant_id=eq.${tenantId}`
    },
    (payload) => {
      console.log('Change type:', payload.eventType);
      console.log('New data:', payload.new);
      console.log('Old data:', payload.old);

      // Aktualizuj lokalni stav
      if (payload.eventType === 'UPDATE') {
        updateLocalState(payload.new.data);
      }
    }
  )
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('Listening for pricing changes');
    }
    if (err) {
      console.error('Subscription error:', err.message);
    }
  });

// Cleanup pri unmount
return () => {
  supabase.removeChannel(channel);
};
```

### 3.3 Multi-table subscriptions

```javascript
// Vice tabulek na jednom kanalu
const syncChannel = supabase
  .channel(`tenant-sync-${tenantId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'pricing_configs',
      filter: `tenant_id=eq.${tenantId}` },
    (payload) => handlePricingChange(payload))
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'fees',
      filter: `tenant_id=eq.${tenantId}` },
    (payload) => handleFeesChange(payload))
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'orders',
      filter: `tenant_id=eq.${tenantId}` },
    (payload) => handleNewOrder(payload))
  .subscribe();
```

### 3.4 Broadcast pro notifikace

```javascript
// Admin posle notifikaci ostatnim pripoyenym admin uzivatulum
const notifyChannel = supabase.channel(`admin-notify-${tenantId}`);

// Odeslani
await notifyChannel.send({
  type: 'broadcast',
  event: 'config-updated',
  payload: { namespace: 'pricing:v3', updatedBy: currentUser.email }
});

// Prijem
notifyChannel
  .on('broadcast', { event: 'config-updated' }, (msg) => {
    showToast(`${msg.payload.updatedBy} updated ${msg.payload.namespace}`);
  })
  .subscribe();
```

### 3.5 Reconnect a offline handling

Supabase Realtime automaticky se pokusi o reconnect pri ztrate spojeni.
Kanal projde stavy: `SUBSCRIBED` -> `CHANNEL_ERROR` -> `CLOSED` -> znovu `SUBSCRIBED`.

**Dulezite:** Po reconnectu klient NEDOSTANE zmeny ktere probehjly behem offline periody.
Je nutne provest full refresh dat po reconnectu.

```javascript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    // Po reconnectu — refresh data z DB
    refetchAllData();
  }
  if (status === 'CHANNEL_ERROR') {
    console.warn('Realtime connection lost, will retry...');
    setConnectionStatus('reconnecting');
  }
  if (status === 'CLOSED') {
    setConnectionStatus('offline');
  }
});
```

Zdroj: https://github.com/supabase/realtime-js/issues/463,
       https://supabase.com/docs/guides/realtime/troubleshooting

### 3.6 React Hook pro Realtime

```javascript
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * Hook pro Supabase Realtime subscription.
 * Automaticky subscribuje pri mount a unsubscribuje pri unmount.
 */
export function useSupabaseRealtime(channelName, subscriptions, onReconnect) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!supabase || !channelName) return;

    let channel = supabase.channel(channelName);

    // Pridej vsechny subscriptions
    for (const sub of subscriptions) {
      channel = channel.on(
        'postgres_changes',
        {
          event: sub.event || '*',
          schema: sub.schema || 'public',
          table: sub.table,
          filter: sub.filter
        },
        sub.handler
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && onReconnect) {
        onReconnect();
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [channelName]); // Intentionally stable deps

  return channelRef;
}
```

---

## 4. Optimistic Updates

### 4.1 React 19 useOptimistic

React 19 prinasi nativni `useOptimistic` hook pro optimisticke aktualizace UI:

```javascript
import { useOptimistic, startTransition } from 'react';

function PricingEditor({ currentConfig }) {
  const [optimisticConfig, setOptimisticConfig] = useOptimistic(currentConfig);

  async function handleSave(newConfig) {
    startTransition(async () => {
      // 1. Okamzite aktualizuj UI (optimisticky)
      setOptimisticConfig(newConfig);

      // 2. Asynchronne uloz na server
      try {
        const savedConfig = await savePricingConfig(newConfig);
        // 3. Po uspechu — React automaticky reconciluje
        startTransition(() => {
          updateRealState(savedConfig);
        });
      } catch (err) {
        // 4. Pri chybe — optimisticky stav se automaticky revrtne
        showError('Failed to save pricing configuration');
      }
    });
  }

  return <ConfigForm config={optimisticConfig} onSave={handleSave} />;
}
```

Zdroj: Context7 — React docs (useOptimistic reference)

**Dulezite pravidlo:** `setOptimistic` MUSI byt volan uvnitr `startTransition`
nebo uvnitr Action prop. Jinak se optimisticky stav okamzite revrtne.

### 4.2 Manualni optimistic update pattern

Pro React < 19 nebo pro slozitejsi scenare:

```javascript
function useOptimisticMutation(initialData) {
  const [data, setData] = useState(initialData);
  const [pendingOps, setPendingOps] = useState([]);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (newData, saveFn) => {
    const opId = crypto.randomUUID();
    const previousData = data;

    // Optimistic update
    setData(newData);
    setPendingOps(prev => [...prev, opId]);
    setError(null);

    try {
      const serverData = await saveFn(newData);
      setData(serverData); // Reconcile with server response
    } catch (err) {
      // Rollback
      setData(previousData);
      setError(err.message);
    } finally {
      setPendingOps(prev => prev.filter(id => id !== opId));
    }
  }, [data]);

  return {
    data,
    mutate,
    isPending: pendingOps.length > 0,
    error
  };
}
```

### 4.3 Optimistic + Realtime kombinace

Kdyz prijde realtime update ze serveru, musime rozlisit jestli je to
nase vlastni zmena (kterou uz mame optimisticky) nebo zmena od jineho uzivatele:

```javascript
function useSyncedState(namespace, tenantId, fallback) {
  const [data, setData] = useState(fallback);
  const [isPending, setIsPending] = useState(false);
  const pendingWriteRef = useRef(null);

  // Realtime subscription
  useSupabaseRealtime(
    `sync-${namespace}-${tenantId}`,
    [{
      table: getTableForNamespace(namespace),
      filter: `tenant_id=eq.${tenantId}`,
      event: 'UPDATE',
      handler: (payload) => {
        // Ignoruj vlastni pending zapisy
        if (pendingWriteRef.current) {
          pendingWriteRef.current = null;
          return;
        }
        // Externi zmena — aktualizuj stav
        setData(payload.new.data);
      }
    }],
    // onReconnect — refetch
    () => refetch()
  );

  const write = useCallback(async (newData) => {
    setData(newData); // Optimistic
    setIsPending(true);
    pendingWriteRef.current = true;

    try {
      await storageAdapter.write(namespace, tenantId, buildKey(tenantId, namespace), newData);
    } catch (err) {
      // Rollback — refetch from server
      await refetch();
    } finally {
      setIsPending(false);
    }
  }, [namespace, tenantId]);

  return { data, write, isPending };
}
```

---

## 5. Cache Invalidation

### 5.1 Strategie invalidace

| Strategie | Popis | Kdy pouzit |
|-----------|-------|------------|
| **Time-based (TTL)** | Cache expiruje po casovem limitu | Mene kriticka data |
| **Event-based** | Invalidace pri zmene (realtime) | Kriticka data, multi-user |
| **Manual** | Explicitni invalidace pri zapisu | Jednoduche single-user |
| **Stale-While-Revalidate** | Pouzij cache, pozadi refresh | UI responsivita |

### 5.2 TanStack Query + Supabase Realtime

Doporuceny pattern kombinuje TanStack Query (React Query) pro caching
s Supabase Realtime pro invalidaci:

```javascript
import { useQuery, useQueryClient } from '@tanstack/react-query';

function usePricingConfig(tenantId) {
  const queryClient = useQueryClient();

  // Data fetching s cache
  const query = useQuery({
    queryKey: ['pricing', tenantId],
    queryFn: () => storageAdapter.read('pricing:v3', tenantId, buildKey(tenantId, 'pricing:v3'), null),
    staleTime: 5 * 60 * 1000, // 5 minut
  });

  // Realtime invalidace
  useEffect(() => {
    const channel = supabase
      .channel(`pricing-invalidate-${tenantId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pricing_configs',
          filter: `tenant_id=eq.${tenantId}` },
        () => {
          // Invaliduj cache — TanStack Query automaticky refetchne
          queryClient.invalidateQueries({ queryKey: ['pricing', tenantId] });
        })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tenantId, queryClient]);

  return query;
}
```

Zdroj: https://makerkit.dev/blog/saas/supabase-react-query

**Vyhody tohoto pristupu:**
- TanStack Query resi caching, loading states, error handling, retry
- Supabase Realtime zajisti ze cache je vzdy aktualni
- Zadna manualni cache logika

**Poznamka:** Pro ModelPricer je TanStack Query nova zavislost. Alternativne
lze pouzit jednoduchy vlastni hook (viz sekce 4.3) bez dalsi knihovny.

### 5.3 Jednoducha cache bez TanStack Query

```javascript
// In-memory cache s TTL
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minut

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(key) {
  cache.delete(key);
}

// Pouziti v storage adapteru
async function readWithCache(namespace, tenantId, lsKey, fallback) {
  const cacheKey = `${namespace}:${tenantId}`;
  const cached = getCached(cacheKey);
  if (cached !== null) return cached;

  const data = await storageAdapter.read(namespace, tenantId, lsKey, fallback);
  setCache(cacheKey, data);
  return data;
}
```

---

## 6. Migration Strategies

### 6.1 Faze migrace z localStorage na cloud

ModelPricer uz implementuje dual-write strategii (viz `featureFlags.js`).
Kompletni migracni cesta:

```
Faze 0: localStorage only (soucasny stav — default)
   |
   v
Faze 1: dual-write (write both, read Supabase first)
   |   - Zapisy jdou do OBOU ulozist
   |   - Cteni preferuje Supabase, fallback na localStorage
   |   - Data se postupne plni v Supabase
   |
   v
Faze 2: Migrace existujicich dat
   |   - migrationRunner.js cte localStorage a upsertuje do Supabase
   |   - Kazdy namespace zvlast s dry-run moznosti
   |   - Backup pred migraci
   |
   v
Faze 3: supabase-only (cteni i zapis jen Supabase)
   |   - localStorage uz neni zdrojem pravdy
   |   - Ponechat jako offline cache (read fallback)
   |
   v
Faze 4: Cleanup
       - Smazani starych localStorage klicu
       - Odstraneni dual-write kodu
```

### 6.2 Dual-Write — jak to funguje v ModelPricer

Nas soucasny `storageAdapter.js` a `featureFlags.js` uz implementuji
tri mody per-namespace:

```
localStorage:  LS --read/write--> App
dual-write:    LS --write--> App <--write--> Supabase
                              ^--read-- Supabase (primary) -> LS (fallback)
supabase:      App <--read/write--> Supabase
```

**Soucasne omezeni:**
- Sync API (`writeTenantJson`) vzdy pise do localStorage i v supabase modu
- Supabase write je fire-and-forget — zadny retry pri selhani
- Zadna offline queue — pri selhani Supabase se zapis ztrati
- Zadna detekce konfliktu — posledni zapis vyhrava

### 6.3 Doporucena vylepseni pro robustni migraci

1. **Offline queue** — ulozit neuspesne Supabase zapisy a retry po reconnectu
2. **Version tracking** — `updated_at` timestamp pro detekci konfliktu
3. **Migration validation** — po migraci namespace porovnat data v LS vs Supabase
4. **Rollback capability** — moznost prepnout zpet na localStorage pri problemech
5. **Telemetrie** — pocitadla uspesnych/neuspesnych Supabase operaci

### 6.4 PowerSync alternativa

PowerSync (https://www.powersync.com/) je dedickovany offline-first sync engine
pro Supabase ktery resi:
- Automaticka offline queue
- Bidirectional sync
- Conflict resolution (configurable)
- SQLite na klientu jako lokalni DB

**Vyhody:** Robustni offline-first bez vlastniho kodu.
**Nevyhody:** Nova zavislost, komplexita, cena (SaaS).
**Doporuceni:** Pro ModelPricer je to overkill v soucasne fazi. Nas dual-write
pristup s offline queue je dostacujici pro admin-only editace.

Zdroj: https://www.powersync.com/blog/bringing-offline-first-to-supabase

### 6.5 Data validation po migraci

```javascript
async function validateMigration(namespace, tenantId) {
  const lsKey = `modelpricer:${tenantId}:${namespace}`;
  const lsData = JSON.parse(localStorage.getItem(lsKey) || 'null');

  const { data: sbData } = await supabase
    .from(getTableForNamespace(namespace))
    .select('data')
    .eq('tenant_id', tenantId)
    .eq('namespace', namespace)
    .single();

  const match = JSON.stringify(lsData) === JSON.stringify(sbData?.data);

  return {
    namespace,
    localStorage: !!lsData,
    supabase: !!sbData,
    match,
    lsSize: JSON.stringify(lsData)?.length || 0,
    sbSize: JSON.stringify(sbData?.data)?.length || 0
  };
}
```

---

## 7. Doporuceni pro ModelPricer

### 7.1 Priority implementace

| Priorita | Co | Proc | Narocnost |
|----------|----|------|-----------|
| **P1** | Offline queue pro fire-and-forget zapisy | Prevence ztraty dat pri nestabilni siti | Nizka |
| **P1** | Conflict detection (version check) | Prevence ticheho prepisu v multi-user admin | Stredni |
| **P2** | Supabase Realtime subscription hook | Live sync mezi admin sessions | Stredni |
| **P2** | Connectivity indicator v UI | Uzivatel vi ze je offline | Nizka |
| **P3** | TanStack Query integrace | Robustni cache + loading states | Vysoka |
| **P3** | Field-level merge pro config | Zachovani obou editaci pri konfliktu | Vysoka |

### 7.2 Architekturalni doporuceni

1. **Ponechat localStorage jako offline cache** — i po plne migraci na Supabase
   localStorage slouzi jako rychla cache a offline fallback. Nemenit soucasny
   sync API (`readTenantJson`/`writeTenantJson`) — je to nas bezpecnostni net.

2. **LWW s detekcemi konfliktu** — pro admin konfiguraci je LWW dostacujici.
   Pridej `updated_at` version check pred zapisem. Pokud detekce konfliktu,
   zobraz uzivateli dialog s moznosti "pouzit moji verzi" / "pouzit serverovou" /
   "slouit".

3. **Realtime jen pro kriticke namespace** — nesubscribovat vse. Doporucene:
   - `orders:v1` — nova objednavka = okamzita notifikace
   - `pricing:v3` — zmena cen = dulezite pro synchronizaci
   - `fees:v3` — zmena poplatku
   Ostatni namespace (branding, dashboard config) nepotrebuji realtime.

4. **Retry strategie pro Supabase zapisy:**
   ```
   1. pokus: okamzity
   2. pokus: po 1 sekunde
   3. pokus: po 5 sekundach
   4. pokus: po 30 sekundach
   5. pokus: ulozit do offline queue, retry pri reconnectu
   ```

5. **Nepridavat TanStack Query ted** — soucasny stack (React state + storage
   helpery) je funkeni. TanStack Query by vyzadoval refactor vsech data-loading
   patternu. Radeji vylepasit existujici hooks (`useStorageQuery`, `useStorageMutation`)
   o cache a retry logiku.

### 7.3 Soubory k uprave (pri implementaci)

| Soubor | Zmena |
|--------|-------|
| `src/lib/supabase/storageAdapter.js` | Pridat retry logiku, offline queue |
| `src/lib/supabase/featureFlags.js` | Beze zmeny — dobre navrzeno |
| `src/utils/adminTenantStorage.js` | Pridat version check do `writeTenantJson` |
| `src/hooks/useStorageQuery.js` (novy/existujici) | Pridat cache TTL |
| `src/hooks/useSupabaseRealtime.js` (novy/existujici) | Realtime hook viz sekce 3.6 |
| `src/components/ui/ConnectivityIndicator.jsx` (novy) | Online/offline badge |

### 7.4 Co NEDELAT

- **Nepouzivat CRDT** — overkill pro nas use case (admin config, ne kolaborativni editace)
- **Nepridavat PowerSync** — dalsi SaaS zavislost, nas dual-write staci
- **Neodstranovat localStorage** — vzdy ponechat jako fallback
- **Nesubscribovat vsechny tabulky** — Supabase Realtime ma limity
  (default 100 concurrent connections na projekt)
- **Neresit offline-first pro widget** — widget je read-only,
  nepotrebuje offline zapis

---

## Zdroje a reference

### Context7 (oficialni dokumentace)
- Supabase JS Client — Realtime subscriptions, Postgres CDC, Upsert operations
- React docs — useOptimistic hook, startTransition, useEffect cleanup

### Brave Search
- Offline-first frontend apps in 2025 (LogRocket)
  https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/
- Local-first software (Ink & Switch)
  https://www.inkandswitch.com/essay/local-first/
- CRDT Implementation Guide (Velt)
  https://velt.dev/blog/crdt-implementation-guide-conflict-free-apps
- Offline sync conflict resolution patterns (Sachith)
  https://www.sachith.co.uk/offline-sync-conflict-resolution-patterns-architecture-trade-offs-practical-guide-feb-19-2026/
- How to Use Supabase with TanStack Query (Makerkit)
  https://makerkit.dev/blog/saas/supabase-react-query
- PowerSync: Bringing Offline-First To Supabase
  https://www.powersync.com/blog/bringing-offline-first-to-supabase
- CRDT dictionary field guide (Ian Duncan)
  https://www.iankduncan.com/engineering/2025-11-27-crdt-dictionary/
- Supabase offline discussion
  https://github.com/orgs/supabase/discussions/357
- Supabase Realtime reconnect issue
  https://github.com/supabase/realtime-js/issues/463
- Online Database Migration by Dual-Write (Google Cloud)
  https://medium.com/google-cloud/online-database-migration-by-dual-write-this-is-not-for-everyone-cb4307118f4b
