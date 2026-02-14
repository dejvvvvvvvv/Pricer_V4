# Utility Components -- Dokumentace

> 10 utility komponent: ErrorBoundary, PrivateRoute, ScrollToTop, SmoothScroll, LoadingState, ErrorState, AppIcon, AppImage, FilePreview, ModelPreview.
> Posledni aktualizace: 2026-02-13

---

## Obsah

1. [Prehled](#1-prehled)
2. [Technologie](#2-technologie)
3. [Architektura souboru](#3-architektura-souboru)
4. [Import graf](#4-import-graf)
8. [Komponenty -- detailni popis](#8-komponenty----detailni-popis)
10. [Error handling](#10-error-handling)
13. [Performance](#13-performance)
14. [Bezpecnost](#14-bezpecnost)
17. [Zname omezeni](#17-zname-omezeni)

---

## 1. Prehled

Utility komponenty jsou sdilene, cross-cutting komponenty ktere nespadaji do design systemu (`components/ui/`) ani do zadne konkretni stranky. Poskytuju infrastrukturalni funkce pro celou aplikaci:

| Komponenta | Ucel | Typ | Pouziti |
|------------|------|-----|---------|
| **ErrorBoundary** | Zachyceni JS chyb v renderovacim stromu | Class component | Globalni + per-page kopie |
| **PrivateRoute** | Ochrana rout za autentizaci | Funkcionalni | Routes.jsx (aktualne zakomentovany) |
| **ScrollToTop** | Reset scroll pozice pri zmene route | Funkcionalni (null render) | Routes.jsx |
| **SmoothScroll** | Plynuly scroll pres Lenis knihovnu | Funkcionalni (null render) | Routes.jsx |
| **LoadingState** | Loading indikatory (spinner/skeleton/dots) | Funkcionalni | Supabase async stranky |
| **ErrorState** | Zobrazeni chyb s retry | Funkcionalni | Supabase async stranky |
| **AppIcon** | Dynamicky Lucide icon lookup | Funkcionalni | 70+ importu napric celym projektem |
| **AppImage** | Image s fallback na error | Funkcionalni | Nepouzivany (0 importu) |
| **FilePreview** | 3D nahled STL/GLTF/GLB souboru | Funkcionalni | Nepouzivany (0 importu) |
| **ModelPreview** | 3D nahled STL/GLTF/GLB souboru | Funkcionalni | Nepouzivany (0 importu) |

### Kategorizace podle ucelu

- **Routing infrastruktura:** ScrollToTop, SmoothScroll, PrivateRoute
- **Error handling:** ErrorBoundary, ErrorState
- **Loading UI:** LoadingState (+ InlineLoader)
- **Asset helpery:** AppIcon, AppImage
- **3D preview:** FilePreview, ModelPreview

---

## 2. Technologie

| Technologie | Verze | Pouziti v utility komponentach |
|-------------|-------|-------------------------------|
| React | 19 | Zaklad vsech komponent |
| React Router | v6+ | `useLocation`, `Navigate`, `Outlet` (PrivateRoute, ScrollToTop) |
| Lenis | latest | SmoothScroll (scroll interpolace) |
| lucide-react | latest | AppIcon (dynamicky icon lookup) |
| @react-three/fiber | latest | FilePreview, ModelPreview (3D rendering) |
| @react-three/drei | latest | FilePreview, ModelPreview (OrbitControls, Bounds, Html) |
| three | latest | FilePreview, ModelPreview (STLLoader, geometrie) |
| Firebase Auth | v9+ | AuthContext (pouzivany PrivateRoute) |

### Styling pristup

- **ErrorBoundary (globalni):** Tailwind-like utility tridy (`p-4 bg-red-100 border border-red-400`)
- **ErrorBoundary (per-page):** Forge design tokens pres inline styles (`--forge-*`)
- **LoadingState, ErrorState:** Tailwind-like utility tridy
- **FilePreview, ModelPreview:** Tailwind-like utility tridy
- **Routing komponenty:** Zadne styly (null render)

---

## 3. Architektura souboru

```
src/components/
  ErrorBoundary.jsx          -- globalni ErrorBoundary (class component)
  PrivateRoute.jsx           -- route guard pro autentizaci
  ScrollToTop.jsx            -- reset scroll pri navigaci
  SmoothScroll.jsx           -- Lenis smooth scroll wrapper
  AppIcon.jsx                -- dynamicky Lucide icon resolver
  AppImage.jsx               -- img s error fallback
  FilePreview.jsx            -- 3D model preview (Canvas + STL/GLTF)
  ModelPreview.jsx           -- 3D model preview (duplicita FilePreview)

src/components/ui/
  LoadingState.jsx           -- loading indikatory (spinner/skeleton/dots + InlineLoader)
  ErrorState.jsx             -- error zobrazeni s retry (inline/card/fullPage)
  Icon.jsx                   -- backward-compat alias na AppIcon

src/pages/test-kalkulacka/components/
  ErrorBoundary.jsx          -- per-page kopie s Forge styly + reset button

src/pages/test-kalkulacka-white/components/
  ErrorBoundary.jsx          -- per-page kopie (stejna jako test-kalkulacka)

src/pages/widget-kalkulacka/components/
  ErrorBoundary.jsx          -- per-page kopie (stejna jako test-kalkulacka)
```

### Duplicity

Projekt obsahuje **4 kopie ErrorBoundary** a **2 prakticky identicke 3D preview komponenty**:

| Duplicita | Soubory | Rozdily |
|-----------|---------|---------|
| ErrorBoundary x4 | `components/ErrorBoundary.jsx` + 3 per-page | Globalni pouziva Tailwind tridy, per-page kopie pouzivaji Forge tokeny + `onReset` prop + reset tlacitko |
| FilePreview vs ModelPreview | `components/FilePreview.jsx`, `components/ModelPreview.jsx` | Jediny rozdil: nazev exportu a `htmlFor` ID na sliderech (`light-file-preview-*` vs `light-preview-*`) |

---

## 4. Import graf

### Kde jsou utility komponenty pouzivany

```
Routes.jsx
  |-- import SmoothScroll from './components/SmoothScroll'
  |-- import ScrollToTop from './components/ScrollToTop'
  |-- import PrivateRoute from './components/PrivateRoute'  (zakomentovany v JSX)

AppIcon.jsx  (70+ importu)
  |-- pages/admin/* (15+ admin stranek)
  |-- pages/test-kalkulacka/* (8 subkomponent)
  |-- pages/test-kalkulacka-white/* (10 subkomponent)
  |-- pages/widget-kalkulacka/* (4 subkomponenty)
  |-- pages/login/components/* (5 subkomponent)
  |-- pages/register/components/* (3 subkomponenty)
  |-- components/ui/Button.jsx
  |-- components/ui/Header.jsx
  |-- components/ui/Icon.jsx (backward-compat alias)
  |-- components/marketing/* (5 komponent)

ErrorBoundary (per-page kopie, ne globalni!)
  |-- pages/test-kalkulacka/index.jsx
  |-- pages/test-kalkulacka-white/index.jsx
  |-- pages/widget-kalkulacka/index.jsx
  |-- pages/admin/builder/BuilderPage.jsx
  |-- pages/*/components/ModelViewer.jsx (3 verze)

LoadingState.jsx  -- 0 importu v aktualnim kodu
ErrorState.jsx    -- 0 importu v aktualnim kodu
AppImage.jsx      -- 0 importu v aktualnim kodu
FilePreview.jsx   -- 0 importu v aktualnim kodu
ModelPreview.jsx  -- 0 importu v aktualnim kodu
```

### Zavislosti utility komponent

```
ErrorBoundary (globalni)
  <- React (class component)

PrivateRoute
  <- react-router-dom (Navigate, Outlet, useLocation)
  <- ../context/AuthContext (useAuth)

ScrollToTop
  <- react (useEffect)
  <- react-router-dom (useLocation)

SmoothScroll
  <- react (useEffect)
  <- lenis (Lenis)

AppIcon
  <- react
  <- lucide-react (vsechny ikony + HelpCircle fallback)

AppImage
  <- react

LoadingState
  <- react

ErrorState
  <- react

FilePreview / ModelPreview
  <- react (Suspense, useState, useEffect, useRef)
  <- @react-three/fiber (Canvas, useLoader)
  <- @react-three/drei (OrbitControls, useGLTF, Bounds, Html)
  <- three (STLLoader, THREE)
```

---

## 8. Komponenty -- detailni popis

---

### 8.1 ErrorBoundary (globalni)

**Soubor:** `src/components/ErrorBoundary.jsx`
**Export:** `export default ErrorBoundary` (class component)
**Radku:** 36

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `children` | ReactNode | (povinny) | Child strom ktery se ochranuje |

#### Chovani

1. Class component rozsiruji `React.Component` (Error boundaries MUSI byt class componenty -- React omezeni)
2. `getDerivedStateFromError(error)` -- zachyti chybu a ulozi do `state.hasError + state.error`
3. `componentDidCatch(error, errorInfo)` -- loguje do `console.error`
4. Fallback UI: cerveny box s textem "Neco se pokazilo pri vykreslovani." + `error.toString()`
5. **Zadne reset tlacitko** -- uzivatel musi refreshnout stranku

#### Pouziti v kodu

Globalni ErrorBoundary **NENI aktualne pouzivany nikde**. Vsechny importy odkazuji na per-page kopie.

---

### 8.2 ErrorBoundary (per-page kopie)

**Soubory:**
- `src/pages/test-kalkulacka/components/ErrorBoundary.jsx`
- `src/pages/test-kalkulacka-white/components/ErrorBoundary.jsx`
- `src/pages/widget-kalkulacka/components/ErrorBoundary.jsx`

**Export:** `export default class ErrorBoundary` (class component)
**Radku:** ~107

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `children` | ReactNode | (povinny) | Child strom |
| `onReset` | Function | undefined | Callback volany pri kliknuti na "Zkusit znovu" |

#### Chovani

1. Stejna error catching logika jako globalni verze
2. **Forge design tokens** -- inline styles pouzivaji `--forge-*` CSS promenne
3. **Reset tlacitko** "Zkusit znovu" -- resetuje `hasError` state a vola `props.onReset()`
4. Hover efekt na reset tlacitku (mouseEnter/mouseLeave inline handlery)
5. Pouziva `--forge-font-heading`, `--forge-font-body`, `--forge-font-mono`, `--forge-font-tech`

#### Pouziti v kodu

- `test-kalkulacka/index.jsx` -- obaluje cely wizard
- `test-kalkulacka-white/index.jsx` -- obaluje cely wizard
- `widget-kalkulacka/index.jsx` -- obaluje cely widget
- `*/components/ModelViewer.jsx` -- obaluje 3D Canvas (nejcastejsi source chyb)
- `admin/builder/BuilderPage.jsx` -- obaluje widget builder

---

### 8.3 PrivateRoute

**Soubor:** `src/components/PrivateRoute.jsx`
**Export:** `export default function PrivateRoute`
**Radku:** 24

#### Props

Zadne (pouziva React Router `<Outlet />` pattern).

#### Zavislosti

- `react-router-dom`: `Navigate`, `Outlet`, `useLocation`
- `../context/AuthContext`: `useAuth()` hook (Firebase auth)

#### Chovani

1. Nacte `currentUser` a `loading` z `useAuth()` hooku
2. **Loading stav:** zobrazi "Nacitani..." centered text (zabranuje flash redirect)
3. **Neprihlaseny:** `<Navigate to="/login" replace state={{ from: location }} />`
   - `replace` zabranuje zpetnemu navigovani na chraneny obsah
   - `state.from` umoznuje redirect zpet po prihlaseni
4. **Prihlaseny:** `<Outlet />` renderuje child routes

#### Aktualni stav v Routes.jsx

```jsx
{/* chranene - DOCASNE VYPNUTO PRO VYVOJ */}
{/* <Route element={<PrivateRoute />}> */}
  <Route path="/account" element={<AccountPage />} />
{/* </Route> */}
```

PrivateRoute je **zakomentovany**. Admin routes nemaji zadny guard. Viz Error Log [2026-02-13] [CONFIG].

---

### 8.4 ScrollToTop

**Soubor:** `src/components/ScrollToTop.jsx`
**Export:** `export default ScrollToTop`
**Radku:** 14

#### Props

Zadne.

#### Chovani

1. Nacte `pathname` z `useLocation()`
2. `useEffect` pri zmene `pathname` zavola `window.scrollTo(0, 0)`
3. Renderuje `null` (zadne vizualni UI)

#### Pouziti v Routes.jsx

```jsx
<SmoothScroll />
<ScrollToTop />
<Header />
<main>...</main>
<Footer />
```

ScrollToTop je renderovan uvnitr `<BrowserRouter>` ale **mimo** nested `<RouterRoutes>`. Aktivuje se pri kazde zmene URL pathname.

---

### 8.5 SmoothScroll

**Soubor:** `src/components/SmoothScroll.jsx`
**Export:** `export default function SmoothScroll`
**Radku:** 33

#### Props

Zadne.

#### Zavislosti

- `lenis` -- premium smooth scroll knihovna

#### Konfigurace Lenis

| Parametr | Hodnota | Popis |
|----------|---------|-------|
| `lerp` | 0.12 | Interpolacni faktor (nizsi = plovouci, vyssi = primy) |
| `smoothWheel` | true | Aktivuje smooth scroll pro kolecko mysi |
| `wheelMultiplier` | 1 | Nasobitel rychlosti scroll koleckem |
| `touchMultiplier` | 1.25 | Nasobitel rychlosti scroll dotykem (o 25% rychlejsi) |

#### Chovani

1. `useEffect` vytvori novou Lenis instanci pri mount
2. Registruje `requestAnimationFrame` loop ktery vola `lenis.raf(time)` kazdy frame
3. Cleanup: `cancelAnimationFrame` + `lenis.destroy()` pri unmount
4. Renderuje `null`
5. Bezpecny pro SSR (Lenis interně osetruje neexistenci `window`)

---

### 8.6 LoadingState

**Soubor:** `src/components/ui/LoadingState.jsx`
**Exporty:** `export function LoadingState` (named + default), `export function InlineLoader` (named)
**Radku:** 103

#### LoadingState Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `variant` | `'spinner' \| 'skeleton' \| 'dots'` | `'spinner'` | Vizualni styl |
| `text` | string | `''` | Text pod indakatorem |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Velikost |
| `className` | string | `''` | Dalsi CSS tridy |
| `fullPage` | boolean | `false` | Centruje do cele stranky (min-h 200px) |
| `skeletonRows` | number | `3` | Pocet skeleton radku (jen pro variant='skeleton') |

#### Varianty

**spinner** (default):
- Otacejici se kruh (`border-t-blue-600 animate-spin`)
- Volitelny text pod spinnerem

**skeleton:**
- Animovane sedy bloky (`animate-pulse`)
- Kazdy radek je uzsi nez predchozi (`100 - i * 15`% sirka, min 40%)
- Pocet radku dle `skeletonRows`

**dots:**
- 3 skakajici kolecka (`animate-bounce`)
- Casove posunuty start (0s, 0.15s, 0.3s)
- Animace 0.6s

#### InlineLoader Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Velikost |
| `className` | string | `''` | Dalsi CSS tridy |

InlineLoader je maly inline spinner pro pouziti v tlacitcich a malych oblastech.

#### Aktualni stav

LoadingState i InlineLoader maji **0 importu** v projektu. Byly vytvoreny pro Phase 4 Supabase async operace ale zatim nejsou integrovany.

---

### 8.7 ErrorState

**Soubor:** `src/components/ui/ErrorState.jsx`
**Export:** `export function ErrorState` (named + default)
**Radku:** 121

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `error` | Error \| string | (povinny) | Error objekt nebo string zprava |
| `onRetry` | Function | undefined | Retry callback (zobrazi tlacitko pokud definovany) |
| `title` | string | auto-detect | Vlastni title (jinak auto-detect na zaklade typu chyby) |
| `className` | string | `''` | Dalsi CSS tridy |
| `variant` | `'inline' \| 'card' \| 'fullPage'` | `'card'` | Vizualni styl |
| `showDetails` | boolean | `false` | Zobrazit technicky stack trace |

#### Varianty

**inline:**
- Jednoradkovy cerveny text s ikonou (SVG exclamation circle)
- Volitelny "Retry" odkaz napravo

**card** (default):
- Cerveny box (`bg-red-50 border-red-200`)
- Ikona + title + zprava + volitelny stack + volitelne Retry tlacitko
- Vhodny pro vlozeni do existujiciho layoutu

**fullPage:**
- Centrovany na stred (min-h 300px)
- Velka cervena ikona v kruhu
- Title + zprava + volitelny stack + velke modre "Try again" tlacitko

#### Automaticka detekce typu chyby

ErrorState automaticky rozpozna sitove chyby (hledani slov `fetch`, `network`, `CORS`, `Failed to fetch`) a zobrazi odpovidajici title "Connection error" misto generickeho "Something went wrong".

#### Aktualni stav

ErrorState ma **0 importu** v projektu. Vytvorena pro Phase 4 Supabase, zatim neintegrovana.

---

### 8.8 AppIcon

**Soubor:** `src/components/AppIcon.jsx`
**Export:** `export default Icon`
**Radku:** 27

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `name` | string | (povinny) | Nazev Lucide ikony (PascalCase, napr. `"ChevronRight"`) |
| `size` | number | `24` | Velikost v px |
| `color` | string | `"currentColor"` | Barva ikony |
| `className` | string | `""` | CSS tridy |
| `strokeWidth` | number | `2` | Sirka tahu |
| `...props` | any | -- | Dalsi HTML atributy predane na SVG |

#### Chovani

1. Hleda ikonu v `LucideIcons` objektu podle `name` propu
2. Pokud ikona **existuje** -- renderuje ji s danymi props
3. Pokud ikona **neexistuje** -- renderuje `HelpCircle` (otaznik v kruhu) se sedou barvou jako fallback
4. **Zadna chybova hlaska** -- tichy fallback

#### Backward-compat alias

`src/components/ui/Icon.jsx` je proxy ktera importuje AppIcon a preposila vsechny props:
```jsx
import AppIcon from "../AppIcon";
export default function Icon(props) {
  return <AppIcon {...props} />;
}
```

Nektere moduly importuji z `components/AppIcon`, jine z `components/ui/Icon`. Obe cesty vedou na stejnou komponentu.

---

### 8.9 AppImage

**Soubor:** `src/components/AppImage.jsx`
**Export:** `export default Image`
**Radku:** 23

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `src` | string | (povinny) | URL obrazku |
| `alt` | string | `"Image Name"` | Alt text |
| `className` | string | `""` | CSS tridy |
| `...props` | any | -- | Dalsi HTML atributy |

#### Chovani

1. Renderuje standardni `<img>` element
2. `onError` handler -- pri chybe nahradni obrazek: `/assets/images/no_image.png`
3. Fallback obrazek je v `public/assets/images/` -- nutno overit ze existuje

#### Aktualni stav

AppImage ma **0 importu** v projektu.

---

### 8.10 FilePreview a ModelPreview

**Soubory:**
- `src/components/FilePreview.jsx`
- `src/components/ModelPreview.jsx`

**Export:** `export default FilePreview` / `export default ModelPreview`
**Radku:** 134 kazdy

#### Props

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `file` | File | (povinny) | File objekt z input/drop uploadu |

#### Podporovane formaty

- `.stl` -- STLLoader
- `.gltf` -- useGLTF (drei)
- `.glb` -- useGLTF (drei)

#### Chovani

1. `useEffect` pri zmene `file`:
   - Extrahuje extension z `file.name`
   - Validuje format (stl/gltf/glb) -- jinak nastavi error
   - Vytvori Object URL pres `URL.createObjectURL(file)`
   - Cleanup: `URL.revokeObjectURL(url)` pri unmount/zmene
2. Interni `<Model>` komponenta:
   - STL: `useLoader(STLLoader, url)` + `<mesh>` se `meshStandardMaterial` (barva #E5E7EB)
   - GLTF/GLB: `useGLTF(url).scene` + `<primitive>`
   - `useLayoutEffect` pro nastaveni `castShadow`/`receiveShadow` na vsechny meshe
3. Canvas konfigurace:
   - Camera FOV: 50
   - Shadows enabled
   - `<Bounds fit clip observe margin={1.1}>` -- auto-fit modelu do viewportu
   - `<OrbitControls makeDefault />` -- rotace/zoom mysi
   - `<Suspense>` s "Nacitani..." fallback
4. Ovladani osvetleni:
   - 3 slidery (X/Y/Z) pro `directionalLight` pozici
   - Range: -50 az 50
   - Default: (10, 10, 10)
   - Shadow maps: 2048x2048

#### Rozdily FilePreview vs ModelPreview

Oba soubory jsou **prakticky identicke**. Jedine rozdily:
- Nazev exportovane komponenty (`FilePreview` vs `ModelPreview`)
- HTML `id` na sliderech (`light-file-preview-*` vs `light-preview-*`)

#### Aktualni stav

Oba maji **0 importu** v projektu. Kalkulacky pouzivaji vlastni `ModelViewer.jsx` subkomponenty misto techto globalnich.

---

## 10. Error handling

### 10.1 ErrorBoundary -- jak funguje v Reactu

React Error Boundaries jsou jediny zpusob jak zachytit JavaScript chyby behem renderovani, v lifecycle metodach a v konstruktorech celeho podstromu. **MUSI byt class componenty** -- funkcionalni komponenty nemohou implementovat `getDerivedStateFromError` ani `componentDidCatch`.

#### Co ErrorBoundary ZACHYTI

- Chyby v `render()` methode child komponent
- Chyby v `constructor()` child komponent
- Chyby v lifecycle metodach (`componentDidMount`, `componentDidUpdate`, atd.)

#### Co ErrorBoundary NEZACHYTI

- Chyby v event handlerech (onClick, onChange...) -- tyto musi byt osetreny try/catch
- Asynchronni chyby (setTimeout, fetch, async/await)
- Chyby v ErrorBoundary samotnem
- Chyby na serveru (SSR)

### 10.2 Aktualni stav error handlingu v projektu

```
Vrstva 1 (globalni):
  ErrorBoundary (components/) -- NENI POUZIVANY

Vrstva 2 (per-page):
  ErrorBoundary (test-kalkulacka/components/) -- obaluje wizard + ModelViewer
  ErrorBoundary (test-kalkulacka-white/components/) -- obaluje wizard + ModelViewer
  ErrorBoundary (widget-kalkulacka/components/) -- obaluje widget + ModelViewer
  ErrorBoundary (widget-kalkulacka, import v BuilderPage) -- obaluje builder

Vrstva 3 (framework):
  React.Suspense -- obaluje lazy-loaded admin stranky v Routes.jsx
  React.Suspense -- obaluje 3D Canvas v ModelViewer

Vrstva 4 (per-komponenta):
  try/catch v event handlerech (slice, upload, checkout)
  .catch() na Promise chainu (API volani)
```

### 10.3 Chybejici error handling

- Zadna globalni ErrorBoundary kolem cele aplikace (pres `<App>` nebo `<Routes>`)
- LoadingState a ErrorState existuji ale nejsou pouzivany
- Lazy-loaded admin stranky maji Suspense fallback ale ZADNY ErrorBoundary -- pokud chunk load selze, fallback se nezobrazi

### 10.4 ErrorBoundary duplikace -- dopad

Existuji 4 kopie ErrorBoundary s ruznymi vizualnimi styly:
- Globalni: Tailwind utility tridy (ne Forge theme)
- Per-page: Forge design tokens (inline styles)

Zmena v jedne kopii se NEPROPAGUJE do ostatnich. Per-page kopie jsou aktivne pouzivany; globalni je mrtvy kod.

---

## 13. Performance

### 13.1 Bundle size dopad

| Komponenta | Odhadovany dopad | Poznamka |
|------------|-----------------|----------|
| ErrorBoundary | Minimalní (~1 kB) | Cisty React, zadne deps |
| PrivateRoute | Minimalní (~1 kB) | useAuth + router hooks |
| ScrollToTop | Minimalní (<0.5 kB) | useEffect + window.scrollTo |
| SmoothScroll | **Stredni (~15-20 kB)** | Lenis knihovna |
| LoadingState | Minimalní (~2 kB) | Cisty React + CSS tridy |
| ErrorState | Minimalní (~3 kB) | Cisty React + inline SVG |
| AppIcon | **Velky (tree-shakeable)** | `import * as LucideIcons` -- Vite tree-shaking |
| AppImage | Minimalní (<0.5 kB) | Jen img wrapper |
| FilePreview/ModelPreview | **Velky (~100+ kB deps)** | Three.js + react-three-fiber + drei |

### 13.2 Kriticke body

**AppIcon a tree-shaking:**
AppIcon pouziva `import * as LucideIcons from 'lucide-react'`. V produkci Vite provadi tree-shaking a zahrne jen pouzivane ikony. Ale protoze lookup je dynamicky (`LucideIcons?.[name]`), Vite **NEMUZE** bezpecne tree-shakovat -- potencialne zahrne VSECHNY lucide ikony (~80+ kB).

**SmoothScroll a rAF loop:**
Lenis bezi `requestAnimationFrame` loop nepretrzite po celou dobu zivotnosti stranky. Na slabych zarizenich muze zvysit CPU zatez. Cleanup je spravne implementovan (`cancelAnimationFrame` + `lenis.destroy()`).

**FilePreview/ModelPreview (nepouzivane):**
Three.js a react-three-fiber jsou tezke zavislosti. Pokud tyto komponenty nejsou pouzivany ale jsou importovany nekde v kodu, mohou negativne ovlivnit bundle size. Aktualne nemaji zadne importy -- Vite je nezobrazi v buble.

### 13.3 Doporuceni

1. **AppIcon:** Zvazit prechod na prime importy (`import { ChevronRight } from 'lucide-react'`) misto wildcard importu pro lepsi tree-shaking. Alternativne pouzit `@lucide/lab` lazy loading pattern.
2. **SmoothScroll:** Zvazit zda je Lenis nutny -- na modernich prohlizecich je nativni scroll dostatecne plynuly. Pripadne aktivovat jen na desktop.
3. **FilePreview/ModelPreview:** Odstranit nebo oznacit jako deprecated -- kalkulacky maji vlastni ModelViewer.

---

## 14. Bezpecnost

### 14.1 PrivateRoute -- autentizacni guard

#### Jak funguje

```
Uzivatel -> PrivateRoute
  |-> loading=true  -> zobraz "Nacitani..."
  |-> loading=false, currentUser=null  -> Navigate to="/login"
  |-> loading=false, currentUser=objekt  -> Outlet (zobraz chraneny obsah)
```

#### Bezpecnostni vlastnosti

| Vlastnost | Stav | Detail |
|-----------|------|--------|
| Auth state check | OK | `useAuth()` cte z Firebase `onAuthStateChanged` |
| Loading guard | OK | Zabranuje flash redirect pri nacitani auth stavu |
| Location state | OK | `state={{ from: location }}` umoznuje redirect zpet |
| Replace navigate | OK | `replace` zabranuje zpetnemu navigovani na guard |

#### KRITICKE BEZPECNOSTNI PROBLEMY

**P0: PrivateRoute je zakomentovany**
V `Routes.jsx:86-88` je PrivateRoute zakomentovany pro `/account`. Admin routes (`/admin/*`) NIKDY nemely PrivateRoute guard. To znamena:
- Vsechny admin stranky jsou verejne pristupne
- Kdokoliv muze pristoupit na `/admin/pricing`, `/admin/orders`, `/admin/team`
- Data tenantu jsou pristupna bez autentizace

**P1: Zadna role-based autorizace**
PrivateRoute kontroluje jen `currentUser !== null`. Nekontroluje roli (admin vs bezny uzivatel). Bezny prihlaseny uzivatel by mel pristup ke vsem admin strankam.

**P2: Widget builder bez guardu**
Route `/admin/widget/builder/:id` je na top-level (mimo admin layout) a nema zadny guard.

### 14.2 ErrorBoundary -- informacni leakage

Globalni ErrorBoundary zobrazuje `error.toString()` vcetne potencialne citlivych informaci (cesty k souborum, stack trace).

Per-page ErrorBoundary zobrazuje jen `error.message` -- mene rizikove, ale stale muze obsahovat interni informace.

**Doporuceni:** V produkci nezobrazovat `error.message` koncovemu uzivateli. Misto toho logovat do error tracking sluzby a zobrazit genericky text.

### 14.3 AppImage -- fallback cesta

`onError` handler nastavuje `e.target.src = "/assets/images/no_image.png"`. Pokud i fallback selze, muze dojit k nekonecne smycce error eventu. Neni implementovan guard proti opakovani.

---

## 17. Zname omezeni

### 17.1 Architekturalni omezeni

| # | Omezeni | Dopad | Priorita |
|---|---------|-------|----------|
| 1 | ErrorBoundary existuje ve 4 kopiich s ruznymi styly | Nekonzistentni UX pri chybach, udrzba 4 souboru | P2 |
| 2 | Globalni ErrorBoundary neni pouzivan | Zadna catch-all ochrana pro celou app | P1 |
| 3 | PrivateRoute zakomentovany | Admin panel verejne pristupny | P0 |
| 4 | LoadingState a ErrorState nejsou pouzivany | Investice do kodu bez vyuziti | P3 |
| 5 | FilePreview a ModelPreview jsou duplicitni a nepouzivane | Mrtvy kod, potencialni bundle dopad | P3 |
| 6 | AppImage nepouzivana | Mrtvy kod | P3 |
| 7 | AppIcon wildcard import lucide-react | Potencialni negativni dopad na tree-shaking | P2 |

### 17.2 Technicke omezeni

| # | Omezeni | Detail |
|---|---------|--------|
| 1 | ErrorBoundary MUSI byt class component | React omezeni -- neni funkcionalni alternativa |
| 2 | ErrorBoundary nezachyti async chyby | Event handlery, setTimeout, fetch -- nutne rucni try/catch |
| 3 | SmoothScroll bezi rAF nepretrzite | CPU zatez i kdyz uzivatel nescrolluje |
| 4 | ScrollToTop resetuje scroll vzdy na (0,0) | Neni podpora pro hash-based scroll (#sekce) |
| 5 | AppIcon fallback (HelpCircle) neupozorni developera | Tichy fallback -- spatny nazev ikony se neprojevi jako chyba |
| 6 | AppImage nemá guard proti infinite error loop | Pokud fallback obrazek tez selze, onError se vola opakovaně |

### 17.3 Doporucene dalsi kroky

1. **P0:** Aktivovat PrivateRoute pro admin routes pred jakymkoliv deployem
2. **P1:** Pridat globalni ErrorBoundary kolem cele aplikace v Routes.jsx nebo App.jsx
3. **P1:** Integrovat LoadingState a ErrorState do admin stranek ktere nacitaji data
4. **P2:** Konsolidovat 4 kopie ErrorBoundary do jedne s konfigurovatelnym vzhledem
5. **P2:** Nahradit AppIcon wildcard import za tree-shakeable pattern
6. **P3:** Odstranit nepouzivane FilePreview, ModelPreview, AppImage (nebo je oznacit deprecated)

---

*Dokumentace vygenerovana: 2026-02-13*
*Agent: mp-sr-frontend*
*Zdrojove soubory: 10 komponent v 13 souborech*
