# AdminLayout -- Dokumentace

> Layout wrapper pro admin panel s sidebar navigaci a content oblasti. Renderuje sidebar (desktop/tablet) nebo drawer (mobil) a deleguje obsah na child routes pres `<Outlet />`.

---

## 1. Prehled

AdminLayout je korenova layout komponenta pro vsechny admin stranky (`/admin/*`). Poskytuje:

- **Sidebar navigaci** se 3 skupinami a 16 polozkami
- **Responsive chovani** -- plny sidebar (desktop), collapsed sidebar (tablet), hamburger drawer (mobil)
- **Smooth scroll** v sidebar pres vlastni requestAnimationFrame animaci
- **Aktivni route zvyrazneni** s left-border accent a background highlight
- **Footer oblast** se status indikatorem a odkazem zpet na verejnou cast

AdminLayout je pouzit v `Routes.jsx` jako parent route element pro vsech 15 admin subroutes. Child stranky se renderuji do `<Outlet />` v hlavni content oblasti.

**Soubor:** `src/pages/admin/AdminLayout.jsx` (482 radku)
**Route:** `/admin` (parent pro vsechny admin subroutes)

---

## 2. Technologie a jazyk

| Technologie | Pouziti |
|-------------|---------|
| React 19 | Funkcni komponenta s hooks |
| react-router-dom v6 | `Link`, `Outlet`, `useLocation` |
| lucide-react | Ikony pres `AppIcon` wrapper |
| LanguageContext | `useLanguage()` -- pouzit jen pro `t('nav.home')` v footer linku |
| CSS-in-JS | Vsechny styly inline pres `style={{}}` objekty |
| Forge tokens | CSS custom properties (`--forge-*`) z `forge-tokens.css` |

**Jazyk komponent:** JavaScript + JSX (zadny TypeScript)
**Stav:** Lokalni `useState` -- zadny externi state management, zadne storage helpery

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminLayout.jsx          <-- TENTO SOUBOR (layout wrapper)
  AdminDashboard.jsx       <-- /admin (index)
  AdminBranding.jsx        <-- /admin/branding
  AdminPricing.jsx         <-- /admin/pricing
  AdminFees.jsx            <-- /admin/fees
  AdminParameters.jsx      <-- /admin/parameters/*
  AdminPresets.jsx         <-- /admin/presets/*
  AdminOrders.jsx          <-- /admin/orders/*
  AdminWidget.jsx          <-- /admin/widget
  AdminWidgetBuilder.jsx   <-- /admin/widget/builder/:id (MIMO AdminLayout!)
  AdminAnalytics.jsx       <-- /admin/analytics
  AdminTeamAccess.jsx      <-- /admin/team
  AdminExpress.jsx         <-- /admin/express (lazy)
  AdminShipping.jsx        <-- /admin/shipping (lazy)
  AdminEmails.jsx          <-- /admin/emails (lazy)
  AdminCoupons.jsx         <-- /admin/coupons (lazy)
  AdminMigration.jsx       <-- /admin/migration (lazy)
  AdminModelStorage.jsx    <-- /admin/model-storage (lazy)
```

**Dulezite:** `AdminWidgetBuilder` je registrovan jako top-level route v Routes.jsx (`/admin/widget/builder/:id`) a NERENDUJE se uvnitr AdminLayout -- bezi fullscreen bez sidebar.

---

## 4. Import graf

```
AdminLayout.jsx
  |-- react (useState, useEffect, useCallback, useRef)
  |-- react-router-dom (Link, Outlet, useLocation)
  |-- ../../components/AppIcon (Icon)
  |-- ../../contexts/LanguageContext (useLanguage)
```

### Kdo importuje AdminLayout

| Soubor | Popis |
|--------|-------|
| `src/Routes.jsx:17` | Import a pouziti jako `<Route path="/admin" element={<AdminLayout />}>` |
| `src/components/ui/Footer.jsx:17-21` | Nemaporuje AdminLayout primo, ale **replikuje** jeho sidebar sirku pro spravny `marginLeft` offset |

### Kontext v Routes.jsx

AdminLayout je vnoren pod "Main app with Header/Footer" blok (Routes.jsx:64-124). To znamena ze admin stranky maji:
1. **Public Header** (nad admin obsahem)
2. **AdminLayout sidebar** (vlevo)
3. **Public Footer** (pod admin obsahem, s marginLeft offset)

---

## 5. Design a vizual (Forge compliance, sidebar, responsive)

### 5.1 Forge token pouziti

AdminLayout pouziva nasledujici Forge tokeny (vsechny z `src/styles/forge-tokens.css`):

| Token | Hodnota | Pouziti v AdminLayout |
|-------|---------|-----------------------|
| `--forge-bg-void` | `#08090C` | Hlavni pozadi (main content oblast) |
| `--forge-bg-surface` | `#0E1015` | Sidebar pozadi |
| `--forge-bg-elevated` | `#161920` | Hover stav nav items, collapse button |
| `--forge-border-default` | `#1E2230` | Oddelovace (sidebar border, group dividers, footer border) |
| `--forge-accent-primary` | `#00D4AA` | Aktivni nav item text, left border, logo ikona |
| `--forge-text-primary` | `#E8ECF1` | Heading text ("ModelPricer"), hover stav |
| `--forge-text-secondary` | `#9BA3B0` | Neaktivni nav items |
| `--forge-text-muted` | `#7A8291` | Skupinove labely, footer link, "ADMIN CONSOLE" label |
| `--forge-success` | `#00D4AA` | Status indikator "ONLINE" (zelena tecka + text) |
| `--forge-shadow-lg` | box-shadow | Mobile drawer stinove |
| `--forge-radius-sm` | border-radius | Collapsed nav item border-radius |
| `--forge-font-heading` | font-family | "ModelPricer" nadpis, mobile top bar "Admin Console" |
| `--forge-font-body` | font-family | Nav item labely, footer link |
| `--forge-font-tech` | font-family | "ADMIN CONSOLE" label, skupinove nadpisy, status text |

### 5.2 Barevna schema aktivniho nav itemu

```
Aktivni:
  - color: var(--forge-accent-primary)     -- teal text
  - backgroundColor: rgba(0, 212, 170, 0.08)  -- jemny teal pozadi
  - borderLeft: 3px solid var(--forge-accent-primary)  -- teal levy border
  - fontWeight: 600

Neaktivni:
  - color: var(--forge-text-secondary)     -- sedy text
  - backgroundColor: transparent
  - borderLeft: 3px solid transparent
  - fontWeight: 500

Hover (neaktivni):
  - backgroundColor: var(--forge-bg-elevated)  -- tmavsi sedy
  - color: var(--forge-text-primary)           -- svetlejsi text
```

### 5.3 Sidebar rozmery

| Stav | Sirka | Podminka |
|------|-------|----------|
| Expanded (desktop) | **260px** | `windowWidth >= 1200` |
| Collapsed (tablet) | **64px** | `768 <= windowWidth < 1200` |
| Hidden (mobil) | **0px** | `windowWidth < 768` |
| Mobile drawer | **280px** | otevreny hamburger menu |

### 5.4 Animace

| Animace | Typ | Parametry |
|---------|-----|-----------|
| Sidebar collapse/expand | CSS transition | `width 250ms cubic-bezier(0.16, 1, 0.3, 1)` |
| Content margin | CSS transition | `margin-left 250ms cubic-bezier(0.16, 1, 0.3, 1)` |
| Mobile drawer slide-in | CSS @keyframes | `forge-slide-in-left` -- `translateX(-100%)` na `translateX(0)`, 250ms |
| Nav item hover | CSS transition | `all 150ms ease-out` |
| Back link hover | CSS transition | `translateX(-4px)` efekt na hover |
| Sidebar smooth scroll | JS requestAnimationFrame | Exponencialni ease-out (`diff * 0.18` per frame) |

---

## 6. Navigacni struktura (ADMIN_NAV)

Navigace je definovana jako konstantni pole `ADMIN_NAV` na radcich 7-39 -- mimo komponentu, nereaktivni.

### Skupina CONFIGURATION (2 polozky)

| Path | Label | Icon | Poznamka |
|------|-------|------|----------|
| `/admin` | Dashboard | LayoutDashboard | `exact: true` -- jen presna shoda |
| `/admin/branding` | Branding | Palette | |

### Skupina PRICING (7 polozek)

| Path | Label | Icon | Poznamka |
|------|-------|------|----------|
| `/admin/pricing` | Pricing | Calculator | |
| `/admin/fees` | Fees | Receipt | |
| `/admin/presets` | Presets | Sliders | |
| `/admin/parameters` | Parameters | Settings2 | Subroutes (`/*`) handlovane uvnitr |
| `/admin/express` | Express | Zap | Lazy loaded |
| `/admin/shipping` | Shipping | Truck | Lazy loaded |
| `/admin/coupons` | Coupons | Tag | Lazy loaded |

### Skupina OPERATIONS (7 polozek)

| Path | Label | Icon | Poznamka |
|------|-------|------|----------|
| `/admin/orders` | Orders | ShoppingCart | Subroutes (`/*`) handlovane uvnitr |
| `/admin/model-storage` | Model Storage | HardDrive | Lazy loaded |
| `/admin/widget` | Widget | Code2 | Builder ma vlastni fullscreen route |
| `/admin/emails` | Emails | Mail | Lazy loaded |
| `/admin/analytics` | Analytics | BarChart3 | |
| `/admin/team` | Team | Users | |
| `/admin/migration` | Migration | Database | Lazy loaded |

**Celkem:** 3 skupiny, 16 navigacnich polozek.

---

## 8. UI komponenty

### 8.1 Sidebar (desktop/tablet)

- **Pozice:** `position: fixed`, `top: 0`, `left: 0`, `bottom: 0`, `zIndex: 40`
- **Struktura:** Header (logo + nazev) | Nav (scrollovatelna oblast) | Footer (status + back link)
- **Scroll:** Vlastni smooth scroll implementace pres `useEffect` s `requestAnimationFrame` (radky 53-98)
  - Wheel eventy na sidebar se `preventDefault()` a `stopPropagation()` -- uplne izolovany scroll
  - Exponencialni ease-out animace (`diff * 0.18` per frame, zastavuje se pri `Math.abs(diff) < 0.5`)
  - Podporuje `deltaMode` 0 (pixely), 1 (radky -- nasobeno 40), 2 (stranky -- nasobeno clientHeight)
- **Collapsed stav:** Ikony centered, labely skryte, skupinove nadpisy nahrazeny horizontalnim oddelovacem
- **Nav item:** `<Link>` s ikonou a labelem, `title` tooltip v collapsed stavu

### 8.2 Mobile drawer

- **Trigger:** Hamburger button v mobile top baru
- **Overlay:** `rgba(8, 9, 12, 0.5)` backdrop, kliknuti zavre drawer
- **Panel:** 280px siroky, slide-in animace zleva, `boxShadow: var(--forge-shadow-lg)`
- **Obsah:** Stejny `renderSidebarContent(false)` jako expanded sidebar
- **Body scroll lock:** `document.body.style.overflow = 'hidden'` kdyz je drawer otevreny (s restore pri zavreni)
- **zIndex:** 1000 (nad vsim)

### 8.3 Mobile top bar

- **Zobrazeni:** Pouze na mobilu (`windowWidth < 768`)
- **Pozice:** `position: sticky`, `top: 0`, `zIndex: 30`
- **Obsah:** Hamburger button (vlevo) | "Admin Console" text (stred) | Home ikona link (vpravo)
- **Pozadi:** `var(--forge-bg-surface)` s bottom borderem

### 8.4 Collapse toggle button (tablet)

- **Zobrazeni:** Pouze na tabletu (`768 <= windowWidth < 1200`)
- **Pozice:** `position: fixed`, na prave hrane sidebaru (`left: sidebarWidth - 12`), vertikalne centrovany
- **Vizual:** Kruhove tlacitko 24x24px, `ChevronRight` nebo `ChevronLeft` ikona
- **zIndex:** 50

### 8.5 Content oblast

- **marginLeft:** Dynamicky podle sidebar stavu (0 na mobilu, 64px collapsed, 260px expanded)
- **Padding:** Responsivni -- 16px (mobil), 24px (tablet), 32px (desktop)
- **Obsah:** `<Outlet />` -- child route se zde renderuje

---

## 9. State management

### 9.1 Lokalni stav

| State | Typ | Default | Ucel |
|-------|-----|---------|------|
| `sidebarCollapsed` | boolean | `false` | Sidebar expanded/collapsed (desktop/tablet) |
| `mobileDrawerOpen` | boolean | `false` | Mobile drawer viditelnost |
| `windowWidth` | number | `window.innerWidth` | Aktualni sirka okna pro responsive breakpointy |

### 9.2 Ref

| Ref | Ucel |
|-----|------|
| `sidebarRef` | Reference na desktop sidebar `<aside>` pro scroll containment |

### 9.3 Derived stav

| Hodnota | Vypocet | Pouziti |
|---------|---------|---------|
| `isMobile` | `windowWidth < 768` | Prepinani desktop sidebar vs mobile drawer |
| `sidebarWidth` | `sidebarCollapsed ? 64 : 260` | CSS width a marginLeft |
| `isActive(path, exact)` | `useCallback` -- porovnani s `location.pathname` | Zvyrazneni aktivni polozky |

### 9.4 Efekty (useEffect)

| Efekt | Zavislosti | Ucel |
|-------|-----------|------|
| Smooth scroll (radky 53-98) | `[]` | Registrace wheel event listeneru na sidebar |
| Resize listener (radky 100-104) | `[]` | Sledovani sirky okna |
| Auto-collapse (radky 107-113) | `[windowWidth]` | Automaticke colapsovani sidebaru na tabletu |
| Close on route change (radky 116-118) | `[location.pathname]` | Zavreni mobile draweru pri navigaci |
| Body scroll lock (radky 121-126) | `[mobileDrawerOpen]` | Zamceni scrollu body kdyz je drawer otevreny |

### 9.5 Route matching logika

Funkce `isActive(path, exact)` (radek 128-133):
- **Exact match:** Pokud `exact === true` NEBO `path === '/admin'` -- pouzije se `===` porovnani
- **Prefix match:** Jinak se pouzije `startsWith(path)` -- tj. `/admin/orders/123` matchne `/admin/orders`
- Dashboard (`/admin`) ma implicitni exact match aby nebyl zvyrazneny na vsech admin strankach

---

## 11. Preklady (i18n)

AdminLayout importuje `useLanguage()` z LanguageContext ale pouziva ho **minimalne**:

| Misto | Text | Prelozeno? |
|-------|------|------------|
| Sidebar header | "ModelPricer" | Ne -- hardcoded |
| Sidebar header | "ADMIN CONSOLE" | Ne -- hardcoded |
| Nav group labels | "CONFIGURATION", "PRICING", "OPERATIONS" | Ne -- hardcoded |
| Nav item labels | "Dashboard", "Branding", "Pricing", ... | Ne -- hardcoded anglicky |
| Status indikator | "STATUS: ONLINE" | Ne -- hardcoded |
| Footer link | `t('nav.home')` | **Ano** -- jediny prelozeny text |
| Mobile top bar | "Admin Console" | Ne -- hardcoded |
| Aria labels | "Open navigation", "Expand/Collapse sidebar" | Ne -- hardcoded anglicky |

**Zaver:** Z 20+ user-facing textu je prelozeny pouze 1. Cely admin panel ma navigaci v anglictine bez ohledu na jazykove nastaveni uzivatele.

---

## 12. Pristupnost

### Co je implementovano

| Prvek | Stav | Detail |
|-------|------|--------|
| `aria-label` na hamburger buttonu | Ano | `"Open navigation"` |
| `aria-label` na collapse buttonu | Ano | Dynamicky `"Expand sidebar"` / `"Collapse sidebar"` |
| `title` tooltip na collapsed nav items | Ano | Zobrazuje label pri hoveru |
| `<Link>` pro navigaci | Ano | Semanticky spravne nastavy `<a>` elementy |
| `<nav>` element | Ano | Navigacni oblast ma semanticky spravny tag |
| Body scroll lock | Ano | Prevence nechteneho scrollu pozadi pri otevrenem draweru |

### Co chybi

| Problem | Popis |
|---------|-------|
| `aria-label` na `<nav>` | Chybi `aria-label="Admin navigation"` pro odliseni od hlavni navigace v Header |
| `role="navigation"` landmark | `<nav>` je implicitne navigation landmark, ale chybi `aria-label` pro rozliseni vice navigation landmarku na strance (Header nav + Admin nav) |
| `aria-current="page"` | Aktivni nav item nema `aria-current="page"` -- screen reader nevi ktera polozka je aktualni |
| Mobile drawer focus trap | Po otevreni draweru neni focus zachycen uvnitr -- uzivatel muze tabbovat ven do obsahu za overlayem |
| Escape key handler | Mobile drawer se nezavre na Escape klavesu |
| `aria-expanded` na hamburger | Chybi `aria-expanded={mobileDrawerOpen}` pro oznameni stavu draweru |
| `aria-hidden` na overlay backdrop | Backdrop `<div>` neni oznacen jako dekorativni |
| Skupinove nadpisy | Skupiny (CONFIGURATION, PRICING, OPERATIONS) nemaji `role="group"` ani `aria-labelledby` |

---

## 13. Performance

### Lazy loading children

AdminLayout sam o sobe **neni** lazy loaded -- je importovan primo v Routes.jsx. Nasledujici child stranky jsou lazy loaded pres `React.lazy()`:

| Stranka | Import |
|---------|--------|
| AdminExpress | `React.lazy(() => import('./pages/admin/AdminExpress'))` |
| AdminShipping | `React.lazy(() => import('./pages/admin/AdminShipping'))` |
| AdminEmails | `React.lazy(() => import('./pages/admin/AdminEmails'))` |
| AdminCoupons | `React.lazy(() => import('./pages/admin/AdminCoupons'))` |
| AdminMigration | `React.lazy(() => import('./pages/admin/AdminMigration'))` |
| AdminModelStorage | `React.lazy(() => import('./pages/admin/AdminModelStorage'))` |

Kazdy lazy-loaded child je obalen `<Suspense fallback={<div style={{padding:'32px'}}>Loading...</div>}>`.

**Ne-lazy stranky** (primo importovane v Routes.jsx):
AdminDashboard, AdminBranding, AdminPricing, AdminFees, AdminParameters, AdminPresets, AdminOrders, AdminWidget, AdminAnalytics, AdminTeamAccess

### Render performance

- **ADMIN_NAV** je definovano jako modul-level konstanta -- nevytvari se znovu pri kazdem renderu
- **`isActive`** je obaleno v `useCallback` se zavislosti na `location.pathname`
- **`renderNavItem`** a **`renderSidebarContent`** jsou definovane jako lokalni funkce uvnitr komponenty -- vytvari se znovu pri kazdem renderu (potencialni optimalizace pres useMemo/useCallback)
- **Resize listener** aktualizuje `windowWidth` pri kazde zmene -- zpusobi re-render cele komponenty
- **Smooth scroll** pouziva `requestAnimationFrame` s cleanup -- nezpusobuje memory leaky

---

## 16. Souvisejici dokumenty

| Dokument | Cesta | Relevance |
|----------|-------|-----------|
| Orders Dokumentace | `docs/claude/Documentation/Orders-Dokumentace.md` | Admin Orders stranka renderovana v AdminLayout |
| Model Storage Dokumentace | `docs/claude/Documentation/Model_Storage-Dokumentace.md` | AdminModelStorage renderovana v AdminLayout |
| CLAUDE.md sekce 5 | `Model_Pricer-V2-main/CLAUDE.md` | Mapa admin routes a souboru |
| Forge Redesign Plan | `docs/claude/PLANS/Redesign-Bugfix-Plan-2026-02-10.md` | Forge design system pouzity v AdminLayout |
| AGENT_MAP | `docs/claude/AGENT_MAP.md` | `mp-mid-frontend-admin` vlastni admin stranky |

---

## 17. Zname omezeni

### 17.1 Admin uvnitr public Header + Footer

AdminLayout je vnoren pod "Main app with Header/Footer" blok v Routes.jsx (radek 94). To znamena ze admin stranky zobrazuji:
- **Public Header** nad admin obsahem (se vsemi public navigacnimi odkazy)
- **Public Footer** pod admin obsahem (Footer explicitne replikuje sidebar sirku pro marginLeft offset)

Dulsledek: Admin ma vizualne dva navigacni systemy -- public header s odkazy na Home/Pricing/Support a admin sidebar. Pro profesionalni admin panel by melo byt zajisteno, ze admin route blok bude mimo Header/Footer wrapper, podobne jako `AdminWidgetBuilder` ktery je registrovan jako top-level route.

### 17.2 Admin routes bez autentizace

Admin panel neni chranen zadnym `<PrivateRoute />` wrapperem. Kdokoliv muze pristoupit na `/admin` bez prihlaseni. V Routes.jsx je PrivateRoute zakomentovany i pro `/account` (komentar: "DOCASNE VYPNUTO PRO VYVOJ").

### 17.3 Navigacni labely hardcoded anglicky

Vsechny nav item labely, skupinove nadpisy a staticke texty ("Admin Console", "STATUS: ONLINE", "ADMIN CONSOLE", "ModelPricer") jsou hardcoded anglicky. Pouze `t('nav.home')` v footer linku je prelozeny. Uzivatel s ceskou jazykovou preferenci vidi ceske verejne stranky ale anglicky admin panel.

### 17.4 Inline styly misto CSS trid

Vsechny styly v AdminLayout jsou inline (`style={{}}` objekty). To znamena:
- Zadna moznost overridu pres CSS specificitu
- Hover stavy reseny pres `onMouseEnter`/`onMouseLeave` JS handlery (ne CSS `:hover`)
- Duplicitni style objekty se vytvari pri kazdem renderu (napr. nav item styly pro kazdy z 16 itemu)
- Nelze pouzit media queries primo (responsivita resena pres JS `windowWidth` state)

### 17.5 Footer link duplikace

Footer oblast sidebaru obsahuje "STATUS: ONLINE" indikator ktery je staticky -- nereflektuje zadny skutecny stav (API health, Supabase spojeni, atd.). Vzdy ukazuje zeleny indikator bez ohledu na skutecny stav.

### 17.6 Mobile drawer bez focus trap a Escape handleru

Mobile overlay drawer nema:
- Focus trap (uzivatel muze tabbovat za overlay)
- Escape key handler (klavesa Escape drawer nezavre)
- `aria-expanded` na trigger buttonu

### 17.7 renderNavItem a renderSidebarContent se re-vytvarej

Funkce `renderNavItem` a `renderSidebarContent` jsou definovane uvnitr komponenty jako obycejne funkce (ne `useCallback`). Pri kazdem renderu se vytvareji nova instance. Vzhledem k tomu ze AdminLayout se re-renderuje pri kazde zmene `windowWidth` (resize), muze to vest k zbytecnym re-renderum child elementu.

### 17.8 Smooth scroll `querySelector('nav')` pri kazdem frame

Smooth scroll animace (radek 61-62, 78-79) volaji `el.querySelector('nav')` pri kazdem animacnim frame a pri kazdem wheel eventu. Caching reference na nav element by zlepsil performance.

---

## Appendix: Vizualni schema

```
+------------------------------------------------------------------+
|  [Public Header - visible in admin]                              |
+------------------------------------------------------------------+
|              |                                                    |
|  SIDEBAR     |  MAIN CONTENT                                     |
|  (fixed)     |  (margin-left: sidebarWidth)                      |
|              |                                                    |
|  [Logo]      |  +----------------------------------------------+ |
|  ModelPricer |  |  <Outlet />                                   | |
|  ADMIN       |  |  (child admin page renders here)              | |
|  CONSOLE     |  |                                               | |
|              |  |  Padding:                                     | |
|  ----        |  |    Mobile: 16px                               | |
|  CONFIGUR.   |  |    Tablet: 24px                               | |
|  Dashboard   |  |    Desktop: 32px                              | |
|  Branding    |  |                                               | |
|              |  +----------------------------------------------+ |
|  ----        |                                                    |
|  PRICING     |                                                    |
|  Pricing     |                                                    |
|  Fees        |                                                    |
|  Presets     |                                                    |
|  Parameters  |                                                    |
|  Express     |                                                    |
|  Shipping    |                                                    |
|  Coupons     |                                                    |
|              |                                                    |
|  ----        |                                                    |
|  OPERATIONS  |                                                    |
|  Orders      |                                                    |
|  Model Stor. |                                                    |
|  Widget      |                                                    |
|  Emails      |                                                    |
|  Analytics   |                                                    |
|  Team        |                                                    |
|  Migration   |                                                    |
|              |                                                    |
|  ----        |                                                    |
|  * ONLINE    |                                                    |
|  <- Home     |                                                    |
+--------------+----------------------------------------------------+
|  [Public Footer - visible in admin, with marginLeft offset]      |
+------------------------------------------------------------------+
```

```
MOBILE:
+----------------------------+
| [=]  Admin Console   [Home]|  <-- sticky top bar
+----------------------------+
|                            |
|  <Outlet />               |
|  (child admin page)       |
|  padding: 16px            |
|                            |
+----------------------------+

Drawer (overlay, z-index 1000):
+-------------------+--------+
| SIDEBAR 280px     | Overlay|
| (same as desktop  | click  |
|  expanded content)| closes |
+-------------------+--------+
```
