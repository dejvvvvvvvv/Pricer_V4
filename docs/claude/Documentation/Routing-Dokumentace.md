# Routing -- Dokumentace

> React Router konfigurace -- vsechny routy, lazy loading, route guards, nested routes, 404 handling.
> **HOT SPOT soubor:** `src/Routes.jsx` -- vlastnik `mp-spec-fe-routing`, zmeny MUSI informovat `mp-mid-frontend-admin` a `mp-mid-frontend-widget`.

---

## 1. Prehled

| Kategorie | Pocet rout | Poznamka |
|-----------|-----------|----------|
| **Public** | 8 | Home, pricing, support, login, register, kalkulacky, invite |
| **Admin (nested)** | 15 | Vsechny pod `/admin`, AdminLayout wrapper |
| **Widget** | 1 | `/w/:publicWidgetId` -- embeddable, bez Header/Footer |
| **Fullscreen** | 2 | `/slicer`, `/admin/widget/builder/:id` -- bez layout wrapperu |
| **Redirect** | 1 | `/model-upload` → `/test-kalkulacka-white` |
| **404 Catch-all** | 1 | `*` → NotFound |
| **Celkem** | **28** | vcetne redirectu a 404 |

### Architekturalni rozdeleni

Routy jsou rozdeleny do **tri vrstev** podle layoutu:

1. **Bare routes** (radky 47-63 v Routes.jsx) -- bez Header/Footer/SmoothScroll
   - Widget public page (`/w/:publicWidgetId`)
   - Slicer page (`/slicer`) -- lazy-loaded
   - Widget Builder (`/admin/widget/builder/:id`) -- fullscreen

2. **Main app routes** (radky 64-124) -- s Header + Footer + SmoothScroll + ScrollToTop
   - Verejne stranky
   - Auth stranky (login, register)
   - Account (docasne bez PrivateRoute guardu)
   - Admin panel (nested routes)

3. **Admin nested routes** (radky 94-115) -- AdminLayout s bockym menu (Outlet)

---

## 2. Technologie a jazyk

| Technologie | Verze/Typ | Pouziti |
|-------------|-----------|---------|
| **React Router** | v6+ (BrowserRouter) | Hlavni routing |
| **React.lazy** | built-in | Lazy loading 7 admin stranek + Slicer |
| **Suspense** | built-in | Fallback pro lazy-loaded komponenty |
| **Lenis** | smooth scroll | SmoothScroll wrapper (premium smooth scrolling) |
| **Firebase Auth** | onAuthStateChanged | PrivateRoute guard (AuthContext) |

### React Router importy

```jsx
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
```

> Poznamka: `Routes` z react-router-dom je prejmenovana na `RouterRoutes` kvuli konfliktu s default exportem `Routes` funkce.

---

## 3. Architektura souboru

```
src/
  Routes.jsx                          ← HOT SPOT -- hlavni routing konfigurace
  App.jsx                             ← Jednoduchy wrapper, vraci <Routes />
  index.jsx                           ← Entry point, renderuje <App /> do #root
  components/
    PrivateRoute.jsx                  ← Route guard (Firebase auth)
    ScrollToTop.jsx                   ← Scroll reset pri zmene pathname
    SmoothScroll.jsx                  ← Lenis smooth scroll wrapper
    ui/
      Header.jsx                      ← Hlavni header (Forge dark theme)
      Footer.jsx                      ← Hlavni footer (Forge dark theme)
  pages/
    home/index.jsx                    ← /
    pricing/index.jsx                 ← /pricing
    support/index.jsx                 ← /support
    login/index.jsx                   ← /login
    register/index.jsx                ← /register
    account/index.jsx                 ← /account
    test-kalkulacka/index.jsx         ← /test-kalkulacka
    test-kalkulacka-white/index.jsx   ← /test-kalkulacka-white
    slicer/index.jsx                  ← /slicer (lazy)
    NotFound.jsx                      ← 404 catch-all
    InviteAccept.jsx                  ← /invite/accept
    widget-public/WidgetPublicPage.jsx ← /w/:publicWidgetId
    admin/
      AdminLayout.jsx                 ← Layout wrapper pro /admin/*
      AdminDashboard.jsx              ← /admin (index)
      AdminBranding.jsx               ← /admin/branding
      AdminPricing.jsx                ← /admin/pricing
      AdminFees.jsx                   ← /admin/fees
      AdminParameters.jsx             ← /admin/parameters/*
      AdminPresets.jsx                ← /admin/presets/*
      AdminOrders.jsx                 ← /admin/orders/*
      AdminWidget.jsx                 ← /admin/widget
      AdminWidgetBuilder.jsx          ← /admin/widget/builder/:id (fullscreen)
      AdminAnalytics.jsx              ← /admin/analytics
      AdminTeamAccess.jsx             ← /admin/team
      AdminExpress.jsx                ← /admin/express (lazy)
      AdminShipping.jsx               ← /admin/shipping (lazy)
      AdminEmails.jsx                 ← /admin/emails (lazy)
      AdminCoupons.jsx                ← /admin/coupons (lazy)
      AdminMigration.jsx              ← /admin/migration (lazy)
      AdminModelStorage.jsx           ← /admin/model-storage (lazy)
  context/
    AuthContext.jsx                    ← Firebase auth provider (currentUser, loading)
  contexts/
    LanguageContext.jsx                ← CS/EN prekladovy slovnik
```

### Bootstrap retezec

```
index.html
  └→ src/index.jsx
       ├→ i18n (init)
       ├→ LanguageProvider (CS/EN kontext)
       │   └→ AuthProvider (Firebase auth kontext)
       │       └→ App.jsx
       │           └→ Routes.jsx  ← TADY se definuji vsechny routy
       ├→ tailwind.css
       └→ index.css
```

---

## 4. Import graf (vsechny lazy imports)

### Eagerly-loaded importy (v bundle okamzite)

| Import | Z cesty | Pouziti |
|--------|---------|---------|
| `Header` | `./components/ui/Header` | Hlavni header |
| `Footer` | `./components/ui/Footer` | Hlavni footer |
| `SmoothScroll` | `./components/SmoothScroll` | Lenis smooth scroll |
| `ScrollToTop` | `./components/ScrollToTop` | Auto-scroll na vrch |
| `Home` | `./pages/home` | Homepage |
| `TestKalkulacka` | `./pages/test-kalkulacka` | Demo kalkulacka |
| `TestKalkulackaWhite` | `./pages/test-kalkulacka-white` | White-label kalkulacka |
| `Pricing` | `./pages/pricing` | Cenova stranka |
| `Support` | `./pages/support` | Podpora |
| `AccountPage` | `./pages/account` | Ucet uzivatele |
| `PrivateRoute` | `./components/PrivateRoute` | Auth guard |
| `NotFound` | `./pages/NotFound` | 404 stranka |
| `Login` | `./pages/login` | Prihlaseni |
| `Register` | `./pages/register` | Registrace |
| `AdminLayout` | `./pages/admin/AdminLayout` | Admin layout wrapper |
| `AdminDashboard` | `./pages/admin/AdminDashboard` | Admin dashboard |
| `AdminBranding` | `./pages/admin/AdminBranding` | Admin branding |
| `AdminPricing` | `./pages/admin/AdminPricing` | Admin pricing (2500+ radku) |
| `AdminFees` | `./pages/admin/AdminFees` | Admin fees |
| `AdminParameters` | `./pages/admin/AdminParameters` | Admin parametry |
| `AdminPresets` | `./pages/admin/AdminPresets` | Admin presety |
| `AdminOrders` | `./pages/admin/AdminOrders` | Admin objednavky |
| `AdminWidget` | `./pages/admin/AdminWidget` | Admin widget |
| `AdminWidgetBuilder` | `./pages/admin/AdminWidgetBuilder` | Widget builder (fullscreen) |
| `AdminTeamAccess` | `./pages/admin/AdminTeamAccess` | Admin tymy |
| `AdminAnalytics` | `./pages/admin/AdminAnalytics` | Admin analytika |
| `InviteAccept` | `./pages/InviteAccept` | Prizvanka |
| `WidgetPublicPage` | `./pages/widget-public/WidgetPublicPage` | Verejna widget stranka |

### Lazy-loaded importy (React.lazy, separatni chunks)

| Promenna | Dynamicky import | Phase |
|----------|-----------------|-------|
| `AdminExpress` | `import('./pages/admin/AdminExpress')` | Phase 2+3 |
| `AdminShipping` | `import('./pages/admin/AdminShipping')` | Phase 2+3 |
| `AdminEmails` | `import('./pages/admin/AdminEmails')` | Phase 2+3 |
| `AdminCoupons` | `import('./pages/admin/AdminCoupons')` | Phase 2+3 |
| `AdminMigration` | `import('./pages/admin/AdminMigration')` | Phase 4 |
| `SlicerPage` | `import('./pages/slicer')` | Slicer |
| `AdminModelStorage` | `import('./pages/admin/AdminModelStorage')` | Storage |

**Celkem:** 7 lazy-loaded komponent, 27 eagerly-loaded komponent.

---

## 8. Routy -- tabulka VSECH rout

### 8.1 Bare routes (bez Header/Footer)

| # | Path | Komponenta | Guard | Lazy? | Poznamka |
|---|------|-----------|-------|-------|----------|
| 1 | `/w/:publicWidgetId` | `WidgetPublicPage` | Zadny | Ne | Embeddable widget, domain whitelist v komponente |
| 2 | `/slicer` | `SlicerPage` | Zadny | **Ano** | Fullscreen, vlastni dark Suspense fallback |
| 3 | `/admin/widget/builder/:id` | `AdminWidgetBuilder` | Zadny | Ne | Fullscreen widget builder |

### 8.2 Main app routes (s Header/Footer)

| # | Path | Komponenta | Guard | Lazy? | Poznamka |
|---|------|-----------|-------|-------|----------|
| 4 | `/` | `Home` | Zadny | Ne | Homepage |
| 5 | `/login` | `Login` | Zadny | Ne | Prihlaseni |
| 6 | `/register` | `Register` | Zadny | Ne | Registrace |
| 7 | `/model-upload` | `Navigate` → `/test-kalkulacka-white` | Zadny | Ne | Redirect (replace) |
| 8 | `/test-kalkulacka` | `TestKalkulacka` | Zadny | Ne | Demo kalkulacka (5-step wizard) |
| 9 | `/test-kalkulacka-white` | `TestKalkulackaWhite` | Zadny | Ne | White-label verze kalkulacky |
| 10 | `/pricing` | `Pricing` | Zadny | Ne | Cenova stranka |
| 11 | `/support` | `Support` | Zadny | Ne | Stranka podpory |
| 12 | `/account` | `AccountPage` | **Docasne vypnuto** | Ne | PrivateRoute zakomentovan |
| 13 | `/invite/accept` | `InviteAccept` | Zadny | Ne | Prijeti team pozvanky (demo) |
| 14 | `*` | `NotFound` | Zadny | Ne | 404 catch-all |

### 8.3 Admin nested routes (pod `/admin`, s AdminLayout)

| # | Path | Komponenta | Guard | Lazy? | Subroutes? |
|---|------|-----------|-------|-------|------------|
| 15 | `/admin` (index) | `AdminDashboard` | Zadny | Ne | Ne |
| 16 | `/admin/branding` | `AdminBranding` | Zadny | Ne | Ne |
| 17 | `/admin/pricing` | `AdminPricing` | Zadny | Ne | Ne |
| 18 | `/admin/fees` | `AdminFees` | Zadny | Ne | Ne |
| 19 | `/admin/parameters/*` | `AdminParameters` | Zadny | Ne | **Ano** -- interni subrouting |
| 20 | `/admin/presets/*` | `AdminPresets` | Zadny | Ne | **Ano** -- interni subrouting |
| 21 | `/admin/orders/*` | `AdminOrders` | Zadny | Ne | **Ano** -- interni subrouting |
| 22 | `/admin/model-storage` | `AdminModelStorage` | Zadny | **Ano** | Ne |
| 23 | `/admin/widget` | `AdminWidget` | Zadny | Ne | Ne |
| 24 | `/admin/analytics` | `AdminAnalytics` | Zadny | Ne | Ne |
| 25 | `/admin/team` | `AdminTeamAccess` | Zadny | Ne | Ne |
| 26 | `/admin/express` | `AdminExpress` | Zadny | **Ano** | Ne |
| 27 | `/admin/shipping` | `AdminShipping` | Zadny | **Ano** | Ne |
| 28 | `/admin/emails` | `AdminEmails` | Zadny | **Ano** | Ne |
| 29 | `/admin/coupons` | `AdminCoupons` | Zadny | **Ano** | Ne |
| 30 | `/admin/migration` | `AdminMigration` | Zadny | **Ano** | Ne |

> **Pozor:** Admin routy aktualne NEMAJI route guard (PrivateRoute neni pouzit). Viz sekce 14 -- Bezpecnost.

---

## 9. Data flow (route guards, PrivateRoute)

### 9.1 PrivateRoute -- implementace

**Soubor:** `src/components/PrivateRoute.jsx`

```jsx
export default function PrivateRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Nacitani...</div>;  // ceka na Firebase auth state
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;  // propusti child routes
}
```

**Jak funguje:**
1. Cte `currentUser` a `loading` z `AuthContext` (Firebase `onAuthStateChanged`)
2. Pokud `loading === true` -- zobrazi loading indikator (zabranuje flash redirectu)
3. Pokud `currentUser === null` -- redirect na `/login` s ulozenim puvodni lokace (`state.from`)
4. Pokud `currentUser` existuje -- renderuje `<Outlet />` (child routes)

### 9.2 AuthContext -- zdroj auth stavu

**Soubor:** `src/context/AuthContext.jsx`

- Pouziva Firebase `onAuthStateChanged` pro sledovani auth stavu
- Volitelne dotahuje profil z Firestore (`users/{uid}`)
- Poskytuje `currentUser` a `loading` pres React Context
- Wrappuje celou aplikaci v `index.jsx`: `<AuthProvider><App /></AuthProvider>`

### 9.3 Aktualni stav guardu

| Oblast | Guard | Status |
|--------|-------|--------|
| Public stranky | Zadny | OK -- spravne |
| `/account` | PrivateRoute | **DOCASNE VYPNUTO** (zakomentovano) |
| `/admin/*` | Zadny | **CHYBI** -- viz sekce 14 |
| `/admin/widget/builder/:id` | Zadny | **CHYBI** -- viz sekce 14 |
| `/w/:publicWidgetId` | Domain whitelist | V komponente (ne v routeru) |

### 9.4 Route hierarchy diagram

```
<BrowserRouter>
  <RouterRoutes>
    ├── /w/:publicWidgetId           → WidgetPublicPage (bare)
    ├── /slicer                      → Suspense → SlicerPage (bare, lazy)
    ├── /admin/widget/builder/:id    → AdminWidgetBuilder (bare)
    └── * (catch-all layout)
         ├── SmoothScroll
         ├── ScrollToTop
         ├── Header
         ├── <main>
         │    <RouterRoutes>         ← vnoreny RouterRoutes
         │      ├── /login           → Login
         │      ├── /register        → Register
         │      ├── /                → Home
         │      ├── /model-upload    → Navigate → /test-kalkulacka-white
         │      ├── /test-kalkulacka → TestKalkulacka
         │      ├── /test-kalkulacka-white → TestKalkulackaWhite
         │      ├── /pricing         → Pricing
         │      ├── /support         → Support
         │      ├── /account         → AccountPage (guard docasne off)
         │      ├── /invite/accept   → InviteAccept
         │      ├── /admin           → AdminLayout (Outlet)
         │      │    ├── index       → AdminDashboard
         │      │    ├── branding    → AdminBranding
         │      │    ├── pricing     → AdminPricing
         │      │    ├── fees        → AdminFees
         │      │    ├── parameters/*→ AdminParameters
         │      │    ├── presets/*   → AdminPresets
         │      │    ├── orders/*    → AdminOrders
         │      │    ├── model-storage → Suspense → AdminModelStorage (lazy)
         │      │    ├── widget      → AdminWidget
         │      │    ├── analytics   → AdminAnalytics
         │      │    ├── team        → AdminTeamAccess
         │      │    ├── express     → Suspense → AdminExpress (lazy)
         │      │    ├── shipping    → Suspense → AdminShipping (lazy)
         │      │    ├── emails      → Suspense → AdminEmails (lazy)
         │      │    ├── coupons     → Suspense → AdminCoupons (lazy)
         │      │    └── migration   → Suspense → AdminMigration (lazy)
         │      └── *               → NotFound
         └── Footer
```

---

## 13. Performance (React.lazy, Suspense, code splitting)

### 13.1 Lazy loading strategie

Projekt pouziva `React.lazy()` pro **7 komponent** ktere nejsou potreba pri prvnim nacitani:

```jsx
// Phase 2+3: Lazy-loaded admin pages
const AdminExpress = React.lazy(() => import('./pages/admin/AdminExpress'));
const AdminShipping = React.lazy(() => import('./pages/admin/AdminShipping'));
const AdminEmails = React.lazy(() => import('./pages/admin/AdminEmails'));
const AdminCoupons = React.lazy(() => import('./pages/admin/AdminCoupons'));
const AdminMigration = React.lazy(() => import('./pages/admin/AdminMigration'));
const SlicerPage = React.lazy(() => import('./pages/slicer'));
const AdminModelStorage = React.lazy(() => import('./pages/admin/AdminModelStorage'));
```

### 13.2 Suspense fallbacky

Dva typy fallbacku:

**1. Slicer (fullscreen, Forge themed):**
```jsx
<Suspense fallback={<div style={{
  width:'100vw', height:'100vh', display:'flex',
  alignItems:'center', justifyContent:'center',
  background:'var(--forge-bg-void, #08090C)',
  color:'var(--forge-text-primary, #E8ECF1)'
}}>Loading Slicer...</div>}>
```

**2. Admin pages (minimalni, padding):**
```jsx
<Suspense fallback={<div style={{padding:'32px'}}>Loading...</div>}>
```

### 13.3 Co NENI lazy-loaded (ale mohlo by byt)

| Komponenta | Duvod proc neni lazy | Kandidat na lazy? |
|-----------|---------------------|-------------------|
| `AdminPricing` (2500+ radku) | Eagerly loaded | **Ano** -- velka komponenta |
| `AdminWidgetBuilder` | Fullscreen, eagerly loaded | **Ano** -- pouzita jen z builder route |
| `TestKalkulacka` (800+ radku) | Eagerly loaded | Mozna -- ale kriticka cesta |
| `WidgetPublicPage` | Eagerly loaded | Ne -- embeddable, musi byt rychle |
| `Home` | Eagerly loaded | Ne -- landing page, musi byt rychle |

### 13.4 Vite code splitting

Diky `React.lazy()` + Vite dynamic `import()`, kazda lazy-loaded komponenta generuje separatni chunk v build outputu. To znamena:
- Hlavni bundle neobsahuje kod 7 lazy komponent
- Chunky se stahuji az pri prvni navigaci na danou route
- Browser je cachuje pro dalsi navstevy

### 13.5 SmoothScroll a ScrollToTop

- **SmoothScroll** (`src/components/SmoothScroll.jsx`) -- pouziva knihovnu Lenis pro premium smooth scroll efekt. Inicializuje se jednou v layout wrapperu. Ma `useEffect` cleanup (destroy).
- **ScrollToTop** (`src/components/ScrollToTop.jsx`) -- pouziva `useLocation()` a scrolluje na vrch stranky pri kazde zmene `pathname`. Renderuje `null`.

---

## 14. Bezpecnost (PrivateRoute, admin guard)

### 14.1 Aktualni stav -- VAROVANI

**PrivateRoute existuje ale NENI aktivne pouzivan:**

1. **`/account` route** -- PrivateRoute guard je **zakomentovan** (radky 86-88 v Routes.jsx):
   ```jsx
   {/* chranene - DOCASNE VYPNUTO PRO VYVOJ */}
   {/* <Route element={<PrivateRoute />}> */}
     <Route path="/account" element={<AccountPage />} />
   {/* </Route> */}
   ```

2. **`/admin/*` routes** -- **ZADNY route guard**. Kdokoliv se muze dostat do admin panelu primo pres URL.

3. **`/admin/widget/builder/:id`** -- Fullscreen builder je mimo AdminLayout a nema zadny guard.

### 14.2 Widget Public Page -- domain validace

WidgetPublicPage (`/w/:publicWidgetId`) implementuje bezpecnost na urovni komponenty (ne routeru):
- `isDomainAllowedByWhitelist()` -- kontroluje zda domena volajiciho je povolena
- `postMessage` origin validace -- pro komunikaci s parentnim iframe
- `document.referrer` -- urceni target originu

### 14.3 Doporuceni pro bezpecnost

| Priorita | Akce | Stav |
|----------|------|------|
| **P0** | Zapnout PrivateRoute pro `/admin/*` | Neni implementovano |
| **P0** | Zapnout PrivateRoute pro `/admin/widget/builder/:id` | Neni implementovano |
| **P1** | Odkomentovat PrivateRoute pro `/account` | Zakomentovano (dev mode) |
| **P2** | Role-based access control (admin vs user) | Neexistuje |

### 14.4 Jak by melo vypadat spravne zabezpeceni

```jsx
{/* Spravna struktura (doporuceni) */}
<Route element={<PrivateRoute />}>
  <Route path="/account" element={<AccountPage />} />
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<AdminDashboard />} />
    {/* ... dalsi admin routy ... */}
  </Route>
</Route>
```

---

## 17. Zname omezeni

### 17.1 Chybejici route guards

- Admin panel je pristupny bez autentizace (viz sekce 14).
- Account stranka nema aktivni guard (docasne vypnuto).
- Widget Builder (`/admin/widget/builder/:id`) nema zadny guard.

### 17.2 Velky eagerly-loaded bundle

- 27 z 34 komponent je eagerly-loaded, vcetne velkych stranek jako `AdminPricing` (2500+ radku) a `TestKalkulacka` (800+ radku).
- Jen 7 komponent pouziva `React.lazy()`.
- To znamena velky initial bundle size.

### 17.3 Vnoreny RouterRoutes pattern

Routes.jsx pouziva **dvakrat `<RouterRoutes>`** (vnoreny routing):
- Vnejsi `RouterRoutes` (radek 45) -- bare routes + catch-all layout
- Vnitrni `RouterRoutes` (radek 73) -- routes uvnitr layout wrapperu

Toto je funkcni ale nestandartni pattern. React Router v6 preferuje `createBrowserRouter` s data loading API. Vnoreny `RouterRoutes` neni oficilane doporucen ale funguje.

### 17.4 Subroutes v komponentach

Tri admin komponenty maji vlastni interni subrouting (`/*` wildcard):
- `AdminParameters` (`/admin/parameters/*`)
- `AdminPresets` (`/admin/presets/*`)
- `AdminOrders` (`/admin/orders/*`)

Toto znamena ze routing logika je rozdelena mezi Routes.jsx a jednotlive komponenty. Pri debugovani routingu je nutne kontrolovat oba mista.

### 17.5 Zadny Error Boundary

Routes.jsx neobsahuje `ErrorBoundary` (ani React Router `errorElement`). Pokud lazy-loaded komponenta selze pri nacitani (napr. sitova chyba), uzivatel uvidi prazdnou stranku nebo uncaught error.

Doporuceni: Pridat `errorElement` nebo React `ErrorBoundary` wrapper kolem `Suspense`.

### 17.6 Suspense fallbacky nejsou konzistentni

- Slicer ma plne stylizovany fullscreen fallback s Forge tematem.
- Admin lazy pages maji minimalni `<div style={{padding:'32px'}}>Loading...</div>`.
- Zadny fallback nepouziva spinner nebo skeleton UI.

### 17.7 Redirect /model-upload

Route `/model-upload` dela permanentni redirect (`replace`) na `/test-kalkulacka-white`. Pokud existuji externi odkazy na `/model-upload`, funguji. Ale neni jasne zda je redirect jeste potrebny -- mohl by byt v budoucnu odstranen.

### 17.8 Admin Widget Builder mimo AdminLayout

`/admin/widget/builder/:id` je umistena jako top-level bare route (bez AdminLayout, Header, Footer). To je zamerne (fullscreen builder), ale znamena ze:
- Neni pristupna z admin sidebar navigace (sidebar ji nezobrazuje)
- Navigace zpet do admin panelu musi byt implementovana uvnitr komponenty
- Nema admin route guard

---

> **Posledni aktualizace:** 2026-02-13
> **Zdrojovy soubor:** `Model_Pricer-V2-main/src/Routes.jsx` (129 radku)
> **Vlastnik:** `mp-spec-fe-routing`
