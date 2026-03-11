# 126-GN — UPRAVY — Page Transitions a Loading Skeletons — 2026-03-10

## Metadata
- **ID:** 126-GN
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** General / Frontend UX
- **Souvisejici ID:** 107-112 (Code quality sprint skeletons + loading states)
- **Trigger:** Autonomní implementace — batch 4 UX vylepšení (plynulé přechody + loading states)

---

## Souhrn uprav

Přidány CSS animace pro page transitions (fade-in, slide-up, scale) a kontext-specifické loading skeletons pro admin/public/test-kalkulacku. Všechny animace respektují `prefers-reduced-motion`. Implementace pomocí PageTransition wrapperu a skeleton fallbacky v React.Suspense.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/styles/animations.css | Novy soubor | - | Page transition animace (fade-in, slide-in-up, scale-fade-in, 150ms) |
| 2 | src/components/PageTransition.jsx | Novy soubor | - | Wrapper komponenta s CSS classe control + Suspense integration |
| 3 | src/pages/test-kalkulacka/components/CalculatorSkeleton.jsx | Novy soubor | - | Loading skeleton pro kalkulačku (steps, model preview, pricing) |
| 4 | src/components/skeletons/AdminPageSkeleton.jsx | Novy soubor | - | Skeleton pro admin stránky (header, sidebar, content grid) |
| 5 | src/components/skeletons/PublicPageSkeleton.jsx | Novy soubor | - | Skeleton pro veřejné stránky (hero, content, footer) |
| 6 | src/Routes.jsx | Zmeneno | 150-180 | PageTransition wrapper kolem lazy-loaded route komponent |
| 7 | src/index.jsx | Zmeneno | 25-40 | Suspense boundary s PublicPageSkeleton fallback |
| 8 | src/pages/test-kalkulacka/index.jsx | Zmeneno | 42-58 | Suspense s CalculatorSkeleton fallback, PageTransition wrapper |
| 9 | src/pages/admin/AdminLayout.jsx | Zmeneno | 65-85 | Suspense s AdminPageSkeleton fallback pro route outlet |
| 10 | src/components/ui/SortableFileList.jsx | Zmeneno | 120-140 | PageTransition na reorder animaci |
| 11 | src/pages/test-kalkulacka/components/PricingCalculator.jsx | Zmeneno | 78-95 | PageTransition na step zmenu |

---

## Detailni zmeny

### 1. `src/styles/animations.css`

**Typ:** Novy soubor
**Radky:** -
**Duvod:** Centralizovat všechny page transition animace v jednom místě

**Co se zmenilo:**
- CSS klasse: `.page-fade-in` (opacity 0→1, 150ms ease-in-out)
- CSS klasse: `.page-slide-in-up` (transform translateY(20px)→0, 150ms)
- CSS klasse: `.page-scale-fade-in` (transform scale(0.98) + opacity 0→1, 150ms)
- Media query: `@media (prefers-reduced-motion: reduce)` — všechny animace 0ms
- Keyframes: `@keyframes pageEnter`, `@keyframes slideUp`, `@keyframes scaleFadeIn`

```css
@keyframes pageEnter {
  from { opacity: 0; }
  to { opacity: 1; }
}

.page-fade-in {
  animation: pageEnter 150ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .page-fade-in, .page-slide-in-up, .page-scale-fade-in {
    animation: none;
  }
}
```

### 2. `src/components/PageTransition.jsx`

**Typ:** Novy soubor
**Radky:** -
**Duvod:** Reusable wrapper pro page transition CSS klasse + Suspense integration

**Co se zmenilo:**
- Hook `usePageTransition(animationType = 'fade-in')`
- Komponenta **PageTransition** (props: children, type, fallback)
- Aplikuje CSS klasse na container div
- Default fallback: `<div className="skeleton-loading" />`
- Integrace s React.Suspense pro lazy-loaded stránky

```jsx
export function PageTransition({ children, type = 'fade-in', fallback = null }) {
  const classes = {
    'fade-in': 'page-fade-in',
    'slide-up': 'page-slide-in-up',
    'scale-fade': 'page-scale-fade-in'
  };

  return (
    <Suspense fallback={fallback || <div className="skeleton-loading" />}>
      <div className={classes[type]}>
        {children}
      </div>
    </Suspense>
  );
}
```

### 3. `src/pages/test-kalkulacka/components/CalculatorSkeleton.jsx`

**Typ:** Novy soubor
**Radky:** -
**Duvod:** Loading skeleton specificky pro kalkulačku (steps, model viewer, pricing)

**Co se zmenilo:**
- Komponenta zobrazuje: Steps placeholder (4x), Model Preview skelet, Pricing breakdown skelet
- Používá ForgeSkeleton variant="card" a variant="text"
- Height: 600px (matching real calculator)
- Animation: ForgeSkeleton pulse effect
- Tailwind classes pro layout (flex, gap-4, sm:grid-cols-2)

### 4. `src/components/skeletons/AdminPageSkeleton.jsx`

**Typ:** Novy soubor
**Radky:** -
**Duvod:** Standardní skeleton pro všechny admin stránky (dashboard, pricing, atd.)

**Co se zmenilo:**
- Layout: Header (50px), Sidebar (200px, float left), Content grid
- Content: 3x card skeletony (height 200px each)
- Responsive: md: 2 sloupce, lg: 3 sloupce
- ForgeSkeleton usage: variant="card" (default)

### 5. `src/components/skeletons/PublicPageSkeleton.jsx`

**Typ:** Novy soubor
**Radky:** -
**Duvod:** Standardní skeleton pro veřejné stránky (home, pricing, support)

**Co se zmenilo:**
- Hero section placeholder (height 300px)
- Content section (3x paragraph skeletony)
- Footer placeholder (height 100px)
- Responsive: full width na mobilu, centered na desktop

### 6. `src/Routes.jsx`

**Typ:** Zmeneno
**Radky:** 150-180
**Duvod:** Obvolnutí lazy-loaded route komponent do PageTransition wrapper

**Co se zmenilo:**
- Každá lazy-loaded route zabalena: `<PageTransition type="fade-in" fallback={<PublicPageSkeleton />}>`
- Admin routes: fallback `<AdminPageSkeleton />`
- Public routes: fallback `<PublicPageSkeleton />`
- Test-kalkulacka: fallback `<CalculatorSkeleton />`

Příklad:
```jsx
// PRED:
const HomePage = lazy(() => import('@/pages/home'));

// PO:
<Route
  path="/"
  element={
    <PageTransition type="fade-in" fallback={<PublicPageSkeleton />}>
      <HomePage />
    </PageTransition>
  }
/>
```

### 7. `src/index.jsx`

**Typ:** Zmeneno
**Radky:** 25-40
**Duvod:** Top-level Suspense boundary s fallback skeleton

**Co se zmenilo:**
- Přidán `<Suspense fallback={<PublicPageSkeleton />}>` okolo `<BrowserRouter>`
- Fallback se zobrazí při chybě v route loading

### 8. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 42-58
**Duvod:** Suspense boundary kolem kalkulačky s CalculatorSkeleton

**Co se zmenilo:**
- Root wrapper: `<PageTransition type="scale-fade" fallback={<CalculatorSkeleton />}>`
- Step komponenty zabaleny v Suspense s CalculatorSkeleton fallback

### 9. `src/pages/admin/AdminLayout.jsx`

**Typ:** Zmeneno
**Radky:** 65-85
**Duvod:** Suspense kolem route outlet v admin layout

**Co se zmenilo:**
- `<Suspense fallback={<AdminPageSkeleton />}>{<Outlet />}</Suspense>`
- Aplikuje se na všechny admin sub-routes

### 10. `src/components/ui/SortableFileList.jsx`

**Typ:** Zmeneno
**Radky:** 120-140
**Duvod:** PageTransition na reorder animaci souborů

**Co se zmenilo:**
- Obvolnula se .file-list-item div v PageTransition komponenty (kde se renderují soubory)
- Při drag-end triggeru PageTransition re-render s "slide-up" animací

### 11. `src/pages/test-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno
**Radky:** 78-95
**Duvod:** PageTransition na step-change animaci

**Co se zmenilo:**
- Při zmene activeStep: trigger `setTransitionType('slide-up')`
- Step content obvolnuta v `<PageTransition type={transitionType}>`
- Animuje zmenu obsahu step-u

---

## Dopad zmen

- **Ovlivnene komponenty:** Routes (parent), AdminLayout, test-kalkulacka/index, všechny lazy-loaded componenty
- **Breaking changes:** Ne (čistě UX vylepšení)
- **Nove zavislosti:** Žádné nové (używa ForgeSkeleton z existujícího UI kit)
- **Rizika:** prefers-reduced-motion test na starších browserech (iOS < 15, Android < 9)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Navigace home → admin → calculator — smooth fade-in ✓
- **Manual test:** prefers-reduced-motion: reduce — animace vypnuté ✓
- **Manual test:** Skeleton loading viditelný při Suspense suspend ✓
- **Poznamky:** Unit testy pro PageTransition + skeletons pending

---

