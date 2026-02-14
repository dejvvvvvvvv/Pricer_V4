# Custom Hooks — Dokumentace

> 5 custom React hooku v `src/hooks/`: useAuth, useStorageQuery, useStorageMutation,
> useSupabaseRealtime, useStorageBrowser. Pokryvaji autentizaci, async tenant-scoped
> data (read/write), realtime subscriptions a file management browser.

---

## 1. Prehled

ModelPricer V3 pouziva 5 custom hooku rozdelenych do 3 vrstev:

| Hook | Vrstva | Ucel | Radku |
|------|--------|------|-------|
| `useAuth` | Autentizace | Firebase auth state listener | 17 |
| `useStorageQuery` | Data (read) | Async cteni tenant-scoped dat s cache | 118 |
| `useStorageMutation` | Data (write) | Async zapis tenant-scoped dat s invalidaci cache | 116 |
| `useSupabaseRealtime` | Data (realtime) | Supabase Postgres Changes subscription | 100 |
| `useStorageBrowser` | UI/Files | Stav file manageru (navigace, CRUD, search, selekce) | 164 |

**Poznamka k useAuth:** V projektu existuji DVE implementace useAuth:
1. `src/hooks/useAuth.js` — standalone hook, primo pouziva Firebase `onAuthStateChanged`
2. `src/context/AuthContext.jsx` — context-based, obohacuje user o Firestore profil data

Aktivne pouzivana verze je **context-based** (`src/context/AuthContext.jsx`). Tu importuji
`PrivateRoute.jsx` a `login/index.jsx`. Standalone verze v `src/hooks/useAuth.js` je
legacy/alternativni implementace ktera se aktualne nepouziva v zadne komponente mimo vlastni soubor.

---

## 2. Technologie

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite 6+ |
| Jazyk | JavaScript + JSX |
| Auth provider | Firebase Auth (`firebase/auth`) |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js` |
| Storage abstrakce | StorageAdapter (`src/lib/supabase/storageAdapter.js`) |
| Feature flags | Per-namespace `localStorage`/`supabase`/`dual-write` (`src/lib/supabase/featureFlags.js`) |
| Backend API | Express na `localhost:3001` (proxy `/api` pres Vite) |
| State pattern | `useState` + `useCallback` + `useRef` (mountedRef anti-leak pattern) |

---

## 3. Architektura souboru

```
src/hooks/
  useAuth.js                  — 17 radku, standalone Firebase auth hook (legacy)
  useStorageQuery.js          — 118 radku, async read + in-memory cache + refetch
  useStorageMutation.js       — 116 radku, async write + cache invalidace + callbacks
  useSupabaseRealtime.js      — 100 radku, Postgres Changes subscription
  useStorageBrowser.js        — 164 radku, file browser stav (CRUD, navigace, search)

src/context/
  AuthContext.jsx             — 41 radku, AuthProvider + useAuth (aktivni verze)

src/lib/supabase/
  client.js                   — 65 radku, singleton Supabase klient
  storageAdapter.js           — 348 radku, abstrakce localStorage + Supabase
  featureFlags.js             — 138 radku, per-namespace storage mode flags

src/utils/
  adminTenantStorage.js       — 148 radku, tenant-scoped storage entrypoint (sync + async API)

src/services/
  storageApi.js               — 236 radku, fetch wrapper pro /api/storage/* endpointy
```

### Rozdeleni zodpovednosti

| Soubor | Zodpovednost |
|--------|-------------|
| `useAuth.js` (hooks) | Primo sleduje Firebase `onAuthStateChanged`, vraci `{ user }` |
| `AuthContext.jsx` | Context provider + useAuth; obohacuje user o Firestore data, vraci `{ currentUser, loading }` |
| `useStorageQuery.js` | Cte data pres `readTenantJsonAsync()`, spravuje in-memory cache, transformace |
| `useStorageMutation.js` | Zapisuje data pres `writeTenantJsonAsync()`, invaliduje query cache |
| `useSupabaseRealtime.js` | Subscriptne na Supabase realtime channel, volá callbacky pri INSERT/UPDATE/DELETE |
| `useStorageBrowser.js` | Kompletni stav file manageru, deleguje CRUD na `storageApi.js` |
| `adminTenantStorage.js` | Entrypoint pro tenant-scoped read/write; sync (localStorage) + async (StorageAdapter) |
| `storageAdapter.js` | Rozhoduje zda cist/psat localStorage, Supabase nebo oba (dual-write) |
| `featureFlags.js` | Per-namespace konfigurace storage modu (ulozena v localStorage) |
| `storageApi.js` | Fetch wrapper pro backend `/api/storage/*` endpointy (browse, upload, delete, ...) |

---

## 4. Import graf

```
useAuth.js (hooks)
  <- firebase/auth (onAuthStateChanged)
  <- @/firebase (auth instance)

AuthContext.jsx
  <- firebase/auth (onAuthStateChanged)
  <- ../firebase (auth, db)
  <- firebase/firestore (doc, getDoc)
  -> exportuje: AuthProvider, useAuth

useStorageQuery.js
  <- adminTenantStorage.js (readTenantJsonAsync, getTenantId)
  -> pouziva: storageAdapter.read() [neprime, pres adminTenantStorage]
  -> exportuje: useStorageQuery, invalidateStorageQuery, clearStorageQueryCache

useStorageMutation.js
  <- adminTenantStorage.js (writeTenantJsonAsync)
  <- useStorageQuery.js (invalidateStorageQuery)
  -> pouziva: storageAdapter.write() [neprime, pres adminTenantStorage]
  -> exportuje: useStorageMutation

useSupabaseRealtime.js
  <- lib/supabase/client.js (supabase, isSupabaseAvailable)
  -> primo pouziva Supabase JS klient (channel, subscribe)
  -> exportuje: useSupabaseRealtime

useStorageBrowser.js
  <- services/storageApi.js (browseFolder, searchFiles, deleteFile, restoreFile,
                              createFolder, renameItem, uploadFiles)
  -> exportuje: useStorageBrowser (default)
```

### Zavislostnni retezec (data hooks)

```
UI komponenta
  |
  v
useStorageQuery / useStorageMutation
  |
  v
adminTenantStorage.js (readTenantJsonAsync / writeTenantJsonAsync)
  |
  v
storageAdapter.js (read / write)
  |
  +---> featureFlags.js (getStorageMode)
  |         |
  |         v
  |     'localStorage' | 'supabase' | 'dual-write'
  |
  +---> localStorage (primo)
  +---> Supabase client (primo)
```

---

## 5. useAuth (hooks verze) — detailni popis

**Soubor:** `src/hooks/useAuth.js` (17 radku)
**Status:** Legacy/alternativni — aktivne se NEPOUZIVA. Viz AuthContext.jsx nize.
**Export:** named `useAuth`

### Signatura

```js
export function useAuth()
```

### Parametry

Zadne.

### Return value

| Klic | Typ | Popis |
|------|-----|-------|
| `user` | `FirebaseUser \| null` | Aktualni Firebase user objekt, nebo `null` pokud neprihlaseny |

### Interni logika

1. Inicializuje `user` state na `null`
2. V `useEffect` registruje `onAuthStateChanged(auth, callback)`
3. Callback nastavi `setUser(currentUser)`
4. Cleanup funkce v useEffect vola `unsubscribe()` (odregistrace listeneru)

### Rozdil oproti AuthContext verzi

| Vlastnost | hooks/useAuth.js | context/AuthContext.jsx |
|-----------|-----------------|----------------------|
| Pattern | Standalone hook | Context Provider + hook |
| Loading state | Nema | Ma `loading` boolean |
| Firestore profil | Necte | Dotahuje data z `users` kolekce |
| Return | `{ user }` | `{ currentUser, loading }` |
| Error handling | Zadne | try/finally v callbacku |
| Pouzivany | NE (0 importu) | ANO (PrivateRoute, Login page) |

---

## 6. useAuth (AuthContext verze) — detailni popis

**Soubor:** `src/context/AuthContext.jsx` (41 radku)
**Status:** AKTIVNI — primarni useAuth hook v projektu
**Exporty:** named `AuthProvider`, named `useAuth`

### Signatura

```js
// Provider
export function AuthProvider({ children })

// Hook
export function useAuth()
```

### Return value (hook)

| Klic | Typ | Popis |
|------|-----|-------|
| `currentUser` | `FirebaseUser & FirestoreProfile \| null` | Obohaceny user objekt nebo null |
| `loading` | `boolean` | `true` dokud se neresi auth state; po prvnim callbacku `false` |

### Interni logika

1. `AuthProvider` vytvori `AuthContext` s `currentUser` a `loading`
2. `useEffect` registruje `onAuthStateChanged(auth, callback)`
3. Callback je **async** — po ziskani Firebase usera dotahne Firestore profil z kolekce `users`
4. Merguje Firebase user + Firestore data pres spread: `{ ...user, ...snap.data() }`
5. `finally` blok zajisti ze `loading = false` i pri chybe
6. `useAuth()` hook vyzaduje `<AuthProvider>` wrapper — jinak vyhodi Error

### Pouziti v komponentach

- `src/components/PrivateRoute.jsx` — route guard, presmeruje na `/login` pokud `!currentUser`
- `src/pages/login/index.jsx` — zobrazuje login formular

---

## 7. useStorageQuery — detailni popis

**Soubor:** `src/hooks/useStorageQuery.js` (118 radku)
**Export:** named `useStorageQuery` + default, plus utility funkce

### Signatura

```js
export function useStorageQuery(namespace, fallback, options = {})
```

### Parametry

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `namespace` | `string` | ANO | Storage namespace, napr. `'pricing:v3'`, `'fees:v3'`, `'orders:v1'` |
| `fallback` | `any` | ANO | Defaultni hodnota pokud data neexistuji |
| `options.enabled` | `boolean` | NE (default `true`) | Pokud `false`, hook nefetchuje data |
| `options.staleTime` | `number` | NE (default `30000`) | Doba platnosti cache v milisekundach (30s) |
| `options.transform` | `Function` | NE (default `null`) | Transformacni funkce aplikovana na raw data |

### Return value

| Klic | Typ | Popis |
|------|-----|-------|
| `data` | `any` | Nactena data (nebo fallback/cached), po transform pokud je definovan |
| `loading` | `boolean` | `true` behem async fetche |
| `error` | `Error \| null` | Chybovy objekt pokud fetch selhal |
| `refetch` | `() => Promise` | Rucni invalidace cache + re-fetch |

### Interni logika

1. **In-memory cache** — globalni `Map` (`queryCache`) s klici `${tenantId}:${namespace}`
2. **Lazy init state** — `useState(() => ...)` zkusi vratit cached data synchronne (instant render)
3. **Ref pattern** — `fallbackRef` a `transformRef` pro stabilni reference (zamezuji infinite re-fetch pri inline objektech)
4. **fetchIdRef** — race condition ochrana; kazdy fetch dostane inkrement ID, update probehne jen pokud ID odpovida
5. **mountedRef** — anti memory-leak; `useEffect` cleanup nastavi `mountedRef.current = false`
6. **Cache invalidace** — `refetch()` smaze cache pro dany namespace a znovu zavola `fetchData()`
7. **Delegace** — vola `readTenantJsonAsync(namespace, fallback)` ktery deleguje na StorageAdapter

### Exportovane utility funkce

```js
// Invaliduje cache pro konkretni namespace (volej po mutaci)
export function invalidateStorageQuery(namespace)

// Vymaze celou query cache (napr. pri logout)
export function clearStorageQueryCache()
```

### Cache strategie

```
1. Komponenta se mountne
2. useState lazy init: je v queryCache platny zaznam? (timestamp < staleTime)
   ANO -> pouzij cached data, fetchData() bezhal na pozadi (revalidace)
   NE  -> pouzij fallback
3. fetchData() zavola readTenantJsonAsync()
4. Vysledek se ulozi do queryCache s aktualnim timestamp
5. Pokud se namespace zmeni, useCallback vytvori novy fetchData, useEffect ho zavola
6. refetch() smaze cache a vynuti novy fetch
```

---

## 8. useStorageMutation — detailni popis

**Soubor:** `src/hooks/useStorageMutation.js` (116 radku)
**Export:** named `useStorageMutation` + default

### Signatura

```js
export function useStorageMutation(namespace, options = {})
```

### Parametry

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `namespace` | `string` | ANO | Storage namespace, napr. `'pricing:v3'` |
| `options.onSuccess` | `Function` | NE | Callback po uspesnem zapisu, `(value) => void` |
| `options.onError` | `Function` | NE | Callback pri chybe, `(error) => void` |
| `options.onSettled` | `Function` | NE | Callback po dokonceni (success i error), `(value, error) => void` |
| `options.mutationFn` | `Function` | NE | Custom mutacni funkce (prepise defaultni `writeTenantJsonAsync`) |

### Return value

| Klic | Typ | Popis |
|------|-----|-------|
| `mutate` | `(value) => void` | Fire-and-forget zapis; nema return value |
| `mutateAsync` | `(value) => Promise` | Async zapis; vraci Promise s hodnotou nebo vyhodi Error |
| `loading` | `boolean` | `true` behem zapisu |
| `error` | `Error \| null` | Posledni chybovy objekt |
| `reset` | `() => void` | Resetuje `error` a `loading` na vychozi hodnoty |

### Interni logika

1. **mountedRef pattern** — `useEffect` s cleanup funkci (`mountedRef.current = false` pri unmount)
2. **mutate()** — fire-and-forget:
   a. Nastavi `loading = true`, `error = null`
   b. Zavola `mutationFn(value)` nebo `writeTenantJsonAsync(namespace, value)`
   c. Po uspesnem zapisu: `invalidateStorageQuery(namespace)` (smaze cache)
   d. Pokud `mountedRef.current`: aktualizuje state, zavola `onSuccess`, `onSettled`
   e. Pri chybe: analogicky, ale s `onError`
3. **mutateAsync()** — stejna logika jako `mutate`, ale vraci Promise a pri chybe vyhodi Error (throw)
4. **Cache invalidace** — po kazdem uspesnem zapisu automaticky invaliduje query cache pro dany namespace

### Rozdil mutate vs mutateAsync

| Vlastnost | `mutate(value)` | `mutateAsync(value)` |
|-----------|-----------------|---------------------|
| Return | `void` (nic) | `Promise<value>` |
| Chyba | Zpracovana vnitrne + `onError` callback | Vyhozena jako rejection (catch externally) |
| Pouziti | UI callbacky (onClick) | Sekvencni operace (await) |

---

## 9. useSupabaseRealtime — detailni popis

**Soubor:** `src/hooks/useSupabaseRealtime.js` (100 radku)
**Export:** named `useSupabaseRealtime` + default

### Signatura

```js
export function useSupabaseRealtime(table, options = {})
```

### Parametry

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `table` | `string` | ANO | Supabase tabulka, napr. `'orders'` |
| `options.filter` | `string` | NE | Postgres filter, napr. `'tenant_id=eq.demo-tenant-uuid'` |
| `options.schema` | `string` | NE (default `'public'`) | Database schema |
| `options.onInsert` | `Function` | NE | Callback pri INSERT: `(newRecord, payload) => void` |
| `options.onUpdate` | `Function` | NE | Callback pri UPDATE: `(newRecord, oldRecord, payload) => void` |
| `options.onDelete` | `Function` | NE | Callback pri DELETE: `(oldRecord, payload) => void` |
| `options.onAny` | `Function` | NE | Callback pri jakemkoliv eventu: `({ type, new, old, payload }) => void` |
| `options.enabled` | `boolean` | NE (default `true`) | Pokud `false` nebo Supabase neni dostupny, hook nesubscribuje |

### Return value

Hook nic nevraci (void). Pouziva se ciste pro side-effecty (subscripce).

### Interni logika

1. **Callback refs** — `onInsertRef`, `onUpdateRef`, `onDeleteRef`, `onAnyRef` zamezuji
   zbytecnemu re-subscribe kdyz caller preda non-memoized funkce (bezna React chyba)
2. **Guard clause** — pokud `!enabled || !isSupabaseAvailable() || !supabase`, useEffect skip
3. **Channel name** — `realtime:${table}:${filter || 'all'}` (unikatni per tabulka+filter)
4. **Subscription** — `supabase.channel(name).on('postgres_changes', config, callback).subscribe()`
5. **Event routing** — payload.eventType se switchuje na INSERT/UPDATE/DELETE a vola prislusny ref callback
6. **Cleanup** — `supabase.removeChannel(channelRef.current)` pri unmount nebo zmene dependencies
7. **Dependencies** — useEffect reaguje na `[table, filter, schema, enabled]`

### Predpoklady

- Supabase Realtime musi byt povoleny na dane tabulce (replication)
- Supabase klient musi byt nakonfigurovany (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`)
- Pokud Supabase neni dostupny, hook nic nedela (graceful degradation)

---

## 10. useStorageBrowser — detailni popis

**Soubor:** `src/hooks/useStorageBrowser.js` (164 radku)
**Export:** default `useStorageBrowser`

### Signatura

```js
export default function useStorageBrowser(initialPath = '')
```

### Parametry

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `initialPath` | `string` | NE (default `''`) | Pocatecni cesta pri mount (prazdny string = root) |

### Return value

| Klic | Typ | Popis |
|------|-----|-------|
| `currentPath` | `string` | Aktualni cesta v file systemu |
| `items` | `Array` | Pole polozek aktualni slozky (nebo vysledky hledani) |
| `loading` | `boolean` | `true` behem async operace |
| `error` | `string \| null` | Chybova zprava |
| `selection` | `Set<string>` | Mnozina vybranych cest |
| `searchQuery` | `string` | Aktualni vyhledavaci dotaz |
| `isSearching` | `boolean` | `true` pokud jsou zobrazeny vysledky hledani |
| `viewMode` | `'list' \| 'grid'` | Rezim zobrazeni |
| `navigateTo` | `(path) => void` | Navigace do slozky |
| `navigateUp` | `() => void` | Navigace o uroven vyse |
| `refresh` | `() => void` | Obnovi obsah aktualni slozky |
| `loadFolder` | `(path) => Promise` | Nacte obsah dane slozky |
| `doSearch` | `(query) => Promise` | Spusti vyhledavani souboru |
| `toggleSelection` | `(path, shiftKey, ctrlKey) => void` | Prepne vyber polozky (s Ctrl/Shift podporou) |
| `clearSelection` | `() => void` | Vymaze vyber |
| `setViewMode` | `(mode) => void` | Nastavi rezim zobrazeni |
| `doDelete` | `(path) => Promise` | Soft-delete souboru (presun do kose) |
| `doRestore` | `(trashPath) => Promise` | Obnoveni souboru z kose |
| `doCreateFolder` | `(name) => Promise` | Vytvoreni nove slozky v aktualni ceste |
| `doRename` | `(path, newName) => Promise` | Prejmenovani souboru/slozky |
| `doUpload` | `(files) => Promise` | Nahrani souboru do aktualni slozky |
| `setError` | `(msg) => void` | Manualni nastaveni chyby (pro externi kod) |

### Interni logika

1. **State management** — 7 useState: currentPath, items, loading, error, selection, searchQuery, searchResults, viewMode
2. **loadFolder()** — volá `browseFolder(folderPath)` z `storageApi.js`, resetuje selekci a search
3. **navigateUp()** — parsuje currentPath, odebere posledni segment, zavola `loadFolder()`
4. **doSearch()** — pokud prazdny query, vymaze search results; jinak vola `searchFiles(query)`
5. **items return** — vraci `searchResults || items` (search ma prioritu nad folder view)
6. **toggleSelection()** — Ctrl/Shift modifikatory: s modifikatorem toggle jednotlivych polozek; bez modifikatoru exclusive select
7. **doUpload()** — defaultni targetPath je `currentPath || 'CompanyLibrary'`
8. **Auto-refresh** — vsechny CRUD operace (delete, restore, createFolder, rename, upload) volaji `refresh()` po uspesnem dokonceni

### Pouziti v komponentach

- `src/pages/admin/AdminModelStorage.jsx` — jediny konzument; kompletni file manager UI

---

## 11. Data flow

### Read flow (useStorageQuery)

```
Komponenta vola useStorageQuery('pricing:v3', defaultPricing)
  |
  v
1. Lazy init: zkus queryCache.get('demo-tenant:pricing:v3')
   |-- platny cache? -> vrat cached data, pokracuj fetchem na pozadi
   |-- neplatny/chybi? -> vrat fallback
  |
  v
2. fetchData() zavola readTenantJsonAsync('pricing:v3', fallback)
  |
  v
3. adminTenantStorage.readTenantJsonAsync()
   -> storageAdapter.read(namespace, tenantId, lsKey, fallback)
  |
  v
4. storageAdapter cte featureFlags:
   |-- 'localStorage' -> cte z window.localStorage
   |-- 'supabase'     -> cte z Supabase tabulky (pricing_configs)
   |-- 'dual-write'   -> cte z Supabase, fallback na localStorage
  |
  v
5. Data se ulozi do queryCache + nastavi do state
6. Komponenta se re-renderne s novymi daty
```

### Write flow (useStorageMutation)

```
Komponenta vola mutate(newPricingConfig)
  |
  v
1. loading = true, error = null
  |
  v
2. writeTenantJsonAsync('pricing:v3', newPricingConfig)
   -> storageAdapter.write(namespace, tenantId, lsKey, value)
  |
  v
3. storageAdapter podle featureFlags:
   |-- 'localStorage' -> pise jen do localStorage
   |-- 'supabase'     -> pise jen do Supabase
   |-- 'dual-write'   -> pise do OBOU
  |
  v
4. invalidateStorageQuery('pricing:v3')
   -> smaze queryCache pro tento namespace
  |
  v
5. onSuccess callback (napr. refetch na useStorageQuery)
6. loading = false
```

### Realtime flow (useSupabaseRealtime)

```
Komponenta pouziva useSupabaseRealtime('orders', { onInsert: refetch })
  |
  v
1. useEffect vytvori Supabase channel 'realtime:orders:all'
  |
  v
2. Channel subscribne na postgres_changes (event: '*')
  |
  v
3. Supabase server posle event kdyz se zmeni radek v tabulce 'orders'
  |
  v
4. Callback v hooku routuje event podle eventType:
   |-- INSERT -> onInsertRef.current(newRecord, payload)
   |-- UPDATE -> onUpdateRef.current(newRecord, oldRecord, payload)
   |-- DELETE -> onDeleteRef.current(oldRecord, payload)
  |
  v
5. Typicky callback: zavolej refetch() na useStorageQuery
```

### File browser flow (useStorageBrowser)

```
AdminModelStorage pouziva useStorageBrowser()
  |
  v
1. Uzivatel klikne na slozku -> navigateTo(path) -> loadFolder(path)
  |
  v
2. loadFolder() -> browseFolder(path) [HTTP GET /api/storage/browse?path=...]
  |
  v
3. Backend (Express) vraci { items: [...] }
  |
  v
4. items state se aktualizuje, loading = false
  |
  v
5. CRUD operace (delete, upload, rename, ...) -> fetch na /api/storage/*
   -> po uspesnem dokonceni -> refresh() -> loadFolder(currentPath)
```

---

## 12. Error handling

### useAuth (hooks verze)

- **Zadny error handling.** Firebase `onAuthStateChanged` nevyhazuje chyby (je to listener).
  Pokud Firebase neni dostupny, `user` zustane `null`.

### useAuth (AuthContext verze)

- **try/finally pattern.** Firestore `getDoc` muze selhat — `.catch(() => null)` zajisti ze
  i bez Firestore dat se user nastavi (jen bez profilu).
- `loading` je vzdy nastaveno na `false` v `finally` bloku — zadny "nekonecny loading" stav.

### useStorageQuery

- **error state** — pokud `readTenantJsonAsync` vyhodi error, nastavi se `error` a `loading = false`
- **console.warn** — chyba se loguje do konzole s `[useStorageQuery]` prefixem
- **Race condition guard** — pokud error prijde od stareho fetche (`fetchId !== fetchIdRef.current`),
  je ignorovan (nezaktualizuje state)
- **mountedRef guard** — pokud komponenta unmountla, error se ignoruje (bez setState na unmounted)

### useStorageMutation

- **error state** — pri chybe se nastavi `error`, `loading = false`
- **onError callback** — caller muze reagovat na chybu (napr. toast)
- **onSettled callback** — vola se vzdy (pri success i error)
- **mutateAsync** — navic vyhodi error jako rejection (volajici kod muze pouzit try/catch)
- **mountedRef guard** — stejna ochrana jako useStorageQuery

### useSupabaseRealtime

- **Graceful degradation** — pokud Supabase neni dostupny (`!isSupabaseAvailable()`), hook nic nedela
- **Zadny error state** — hook neexportuje error; chyby v subscription se projevuji ticho
  (Supabase JS klient ma vlastni retry logiku)

### useStorageBrowser

- **error state** — string zprava (`e.message`), nastavena pri selhani jakekoli operace
- **Zadny mountedRef** — hook nepouziva anti-leak pattern (viz sekce 13)
- **Auto-clear** — `loadFolder()` pri kazdem volani resetuje error na null

---

## 13. Performance

### In-memory cache (useStorageQuery)

- **queryCache** — globalni `Map` sdilena mezi vsemi instancemi hooku
- **staleTime** — defaultne 30s; data starsi nez staleTime se re-fetchnou
- **Lazy init** — `useState(() => ...)` vyuziva synchronni cache pro okamzity render bez blikani
- **Cache key** — `${tenantId}:${namespace}` (tenant-scoped)
- **Velikost** — cache nema limit na pocet zaznamu; v praxi max desitky namespace

### mountedRef pattern (KRITICKE)

**useStorageQuery a useStorageMutation** pouzivaji `mountedRef` pro prevenci memory leaku:

```js
const mountedRef = useRef(true);

useEffect(() => {
  mountedRef.current = true;
  // ... fetch/mutace ...
  return () => { mountedRef.current = false; };
}, [...]);
```

Toto zajistuje ze `setState` se NEVOLA po unmountnuti komponenty.

**DULEZITE:** useStorageMutation MUSI mit `useEffect` s cleanup funkci ktera nastavi
`mountedRef.current = false`. Bez tohoto cleanup by doslo k memory leaku — async operace
(writeTenantJsonAsync) by po unmount komponenty volala `setLoading`, `setError` atd.
na neexistujici komponentu.

Aktualni implementace tuto podmunku SPLNUJE (radky 40-43 v useStorageMutation.js):

```js
useEffect(() => {
  mountedRef.current = true;
  return () => { mountedRef.current = false; };
}, []);
```

### fetchIdRef pattern (useStorageQuery)

- Kazdy fetch inkrementuje `fetchIdRef.current`
- Pred state update se overuje `fetchId === fetchIdRef.current`
- Zamezuje race condition pri rychle zmene `namespace` parametru

### Callback refs (useSupabaseRealtime)

- Callbacky (`onInsert`, `onUpdate`, `onDelete`, `onAny`) jsou ulozeny v refs
- Zmena callbacku nevytvori novy channel (zamezeni "channel churn")
- Channel se re-subscribe jen pri zmene `[table, filter, schema, enabled]`

### Fallback/transform refs (useStorageQuery)

- `fallbackRef` a `transformRef` zamezuji infinite re-fetch loop
- Bez nich by inline `useStorageQuery('x', {})` zpusoboval nekonecny cyklus
  (kazdy render = novy objekt `{}` = novy useCallback = novy useEffect)

### useStorageBrowser — bez mountedRef

- `useStorageBrowser` NEPOUZIVA mountedRef pattern
- Vsechny async operace (loadFolder, doSearch, doDelete, ...) volaji setState po await
- V praxi je to akceptovatelne protoze hook se pouziva jen v AdminModelStorage
  ktery se nemountuje/unmountuje casto (stabilni admin routa)
- **Potencialni problem:** rychle navigace pryc z `/admin/storage` behem async operace
  by mohla zpusobit React warning "setState on unmounted component"

---

## 14. Typicke pouziti

### useStorageQuery + useStorageMutation (planovane)

```jsx
function AdminPricingPage() {
  const { data: pricing, loading, error, refetch } = useStorageQuery(
    'pricing:v3',
    { materials: [], currency: 'CZK' },
    { staleTime: 60000 }
  );

  const { mutate, loading: saving } = useStorageMutation('pricing:v3', {
    onSuccess: () => {
      refetch(); // re-fetch po zapisu
      toast.success('Ulozeno');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => mutate(pricing);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  return <PricingEditor data={pricing} onSave={handleSave} saving={saving} />;
}
```

### useSupabaseRealtime (planovane)

```jsx
function AdminOrdersList() {
  const { data: orders, refetch } = useStorageQuery('orders:v1', []);

  useSupabaseRealtime('orders', {
    filter: `tenant_id=eq.${getTenantId()}`,
    onInsert: () => refetch(),
    onUpdate: () => refetch(),
    onDelete: () => refetch(),
  });

  return <OrdersTable orders={orders} />;
}
```

### useStorageBrowser (aktivni)

```jsx
function AdminModelStorage() {
  const browser = useStorageBrowser();

  useEffect(() => { browser.loadFolder(''); }, []);

  return (
    <div>
      <Breadcrumb path={browser.currentPath} onNavigate={browser.navigateTo} />
      <FileList
        items={browser.items}
        loading={browser.loading}
        selection={browser.selection}
        onSelect={browser.toggleSelection}
        onOpen={browser.navigateTo}
      />
      <UploadZone onUpload={browser.doUpload} />
    </div>
  );
}
```

---

## 15. Konzumenti (kdo pouziva ktere hooky)

| Hook | Soubor konzumenta | Import zdroj |
|------|--------------------|--------------|
| `useAuth` (context) | `src/components/PrivateRoute.jsx` | `../context/AuthContext` |
| `useAuth` (context) | `src/pages/login/index.jsx` | `../context/AuthContext` |
| `useAuth` (hooks) | — zatim nikdo — | `../hooks/useAuth` |
| `useStorageQuery` | — zatim nikdo (ready for Phase 4 Step 8+) — | `../hooks/useStorageQuery` |
| `useStorageMutation` | — zatim nikdo (ready for Phase 4 Step 8+) — | `../hooks/useStorageMutation` |
| `useSupabaseRealtime` | — zatim nikdo (ready for Phase 4 Step 8+) — | `../hooks/useSupabaseRealtime` |
| `useStorageBrowser` | `src/pages/admin/AdminModelStorage.jsx` | `../../hooks/useStorageBrowser` |
| `invalidateStorageQuery` | `src/hooks/useStorageMutation.js` | `./useStorageQuery` |

**Poznamka:** useStorageQuery, useStorageMutation a useSupabaseRealtime byly vytvoreny jako soucast
Phase 4 (Supabase migrace). Jsou pripraveny k pouziti ale admin stranky zatim pouzivaji sync API
(`readTenantJson`/`writeTenantJson`). Postupna migrace na async hooky je planovana.

---

## 16. Namespace-to-table mapovani

Pro referenci — useStorageQuery a useStorageMutation pracuji s namespace,
ktery se mapuje na Supabase tabulku pres `NAMESPACE_TABLE_MAP` v storageAdapter.js:

| Namespace | Supabase tabulka |
|-----------|-----------------|
| `pricing:v3` | `pricing_configs` |
| `fees:v3` | `fees` |
| `orders:v1` | `orders` |
| `orders:activity:v1` | `order_activity` |
| `shipping:v1` | `shipping_methods` |
| `coupons:v1` | `coupons` |
| `express:v1` | `express_tiers` |
| `form:v1` | `form_configs` |
| `email:v1` | `email_templates` |
| `kanban:v1` | `kanban_configs` |
| `dashboard:v1` | `dashboard_configs` |
| `dashboard:v2` | `dashboard_configs` |
| `audit_log` | `audit_log` |
| `analytics:events` | `analytics_events` |
| `team_users` | `team_members` |
| `team_invites` | `team_members` |
| `branding` | `branding` |
| `widgets` | `widget_configs` |
| `plan_features` | `tenants` |
| `widget_theme` | `widget_configs` |

---

## 17. Zname omezeni

### O1: Duplicitni useAuth implementace
- **Problem:** Dve useAuth — `src/hooks/useAuth.js` (standalone) a `src/context/AuthContext.jsx` (context-based)
- **Riziko:** Zmateni pri importu; standalone verze nema loading state ani Firestore profil
- **Doporuceni:** Smazat `src/hooks/useAuth.js` nebo ho predelat na re-export z AuthContext

### O2: useStorageBrowser nema mountedRef
- **Problem:** Async operace (loadFolder, doSearch, ...) mohou volat setState po unmount
- **Riziko:** React warning v konzoli pri rychle navigaci z admin storage stranky
- **Doporuceni:** Pridat mountedRef pattern stejne jako v useStorageQuery/useStorageMutation

### O3: queryCache nema limit na velikost
- **Problem:** queryCache je globalni Map bez eviction strategie
- **Riziko:** Minimalni v praxi (max ~20 namespace); teoreticky pri dlouho bezici aplikaci
- **Doporuceni:** Pro produkci zvazit LRU cache nebo maxItems limit

### O4: queryCache neni tenant-aware pri zmene tenanta
- **Problem:** Pokud uzivatel zmeni tenant_id (napr. v admin), cache muze obsahovat data z predchoziho tenanta
- **Riziko:** Zobrazeni dat jineho tenanta
- **Doporuceni:** Volat `clearStorageQueryCache()` pri zmene tenanta

### O5: useStorageMutation callback dependencies
- **Problem:** `useCallback` pro `mutate` a `mutateAsync` ma v dependencies `onSuccess`, `onError`, `onSettled`
- **Riziko:** Pokud caller preda non-memoized callbacky, `mutate` reference se meni kazdy render
  (ale samotna mutace funguje spravne — jen zbytecne re-created funkce)
- **Doporuceni:** Pouzit ref pattern pro callbacky (stejne jako v useSupabaseRealtime)

### O6: useSupabaseRealtime neexportuje connection status
- **Problem:** Hook nevraci informaci o tom zda je subscription aktivni, connected nebo v chybe
- **Riziko:** UI nemuze zobrazit stav real-time pripojeni (napr. "Offline" badge)
- **Doporuceni:** Pridat return `{ status: 'connected' | 'disconnected' | 'error' }`

### O7: Async hooky zatim nepouzivane v produkci
- **Problem:** useStorageQuery, useStorageMutation a useSupabaseRealtime nemaji zadne konzumenty
- **Riziko:** Mozne skryte bugy odhalene az pri realnem pouziti
- **Doporuceni:** Postupna migrace admin stranek na async hooky s dukladnym testovanim

### O8: useStorageBrowser default upload cesta
- **Problem:** `doUpload()` pouziva `currentPath || 'CompanyLibrary'` jako default
- **Riziko:** Hardcoded fallback 'CompanyLibrary' — pokud se zmeni struktura, upload jde na spatne misto
- **Doporuceni:** Konfigurovatelny default pres parametr hooku

---

## 18. Souhrnna tabulka API

| Hook | Input | Output (klicove) | Side effects |
|------|-------|-------------------|-------------|
| useAuth (hooks) | — | `{ user }` | Firebase listener |
| useAuth (context) | — | `{ currentUser, loading }` | Firebase listener + Firestore read |
| useStorageQuery | namespace, fallback, options | `{ data, loading, error, refetch }` | Async fetch + cache |
| useStorageMutation | namespace, options | `{ mutate, mutateAsync, loading, error, reset }` | Async write + cache invalidace |
| useSupabaseRealtime | table, options | void | Supabase channel subscription |
| useStorageBrowser | initialPath | 20+ properties (state + actions) | HTTP requesty na /api/storage |
