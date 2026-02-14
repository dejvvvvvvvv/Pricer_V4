# NotFound (404) -- Dokumentace

> Stranka zobrazena kdyz uzivatel navstivi neexistujici URL.
> Wildcard routa `path="*"` v Routes.jsx zachyti vsechny nenamapovane cesty
> a vyrenderuje tuto komponentu s vizualem ve Forge dark theme.

---

## 1. Prehled (wildcard routa *)

NotFound je jednoducha "dead-end" stranka bez obchodniho obsahu.
Jeji ucel je informovat uzivatele, ze pozadovana URL neexistuje,
a nabidnout mu dve moznosti navratu:

- **Back to Home** -- naviguje na `/` (pres `useNavigate` z react-router-dom)
- **Go Back** -- vola `window.history?.back()` (navrat na predchozi stranku)

### Routing konfigurace

V `src/Routes.jsx` (radek 118) je NotFound registrovana jako posledni
routa uvnitr vnoreneho `<RouterRoutes>` bloku:

```jsx
{/* 404 */}
<Route path="*" element={<NotFound />} />
```

Tato routa je uvnitr hlavniho layoutu (radek 65-124), coz znamena ze
404 stranka se renderuje **s Header a Footer** (na rozdil od napr. `/slicer`
nebo `/w/:publicWidgetId`, ktere jsou top-level routy bez layoutu).

### Hierarchie rout

```
BrowserRouter
  RouterRoutes
    /w/:publicWidgetId       -- top-level, bez Header/Footer
    /slicer                  -- top-level, lazy-loaded, bez Header/Footer
    /admin/widget/builder/:id -- top-level, bez Header/Footer
    path="*"                 -- hlavni layout s Header+Footer
      RouterRoutes (vnorene)
        /login
        /register
        /                    -- Home
        /test-kalkulacka
        /pricing
        /support
        /admin/*             -- Admin panel (nested routes)
        ...
        path="*"             -- ** NotFound stranka ** (radek 118)
```

NotFound tedy chyta vsechny URL, ktere neodpovidaji zadne definovane route
uvnitr hlavniho layoutu. Top-level routy (`/w/*`, `/slicer`,
`/admin/widget/builder/*`) jsou zachyceny drive a k NotFound se nedostanou.

### Lazy loading

NotFound **NENI** lazy-loaded -- je importovana primo na radku 14:

```jsx
import NotFound from './pages/NotFound';
```

Duvod: 404 stranka je drobna komponenta (~70 radku, zadne externi zavislosti
krome ForgeButton a AppIcon) a musi se zobrazit okamzite bez loading stavu.
Lazy loading by zde nemel smysl a zhoubil by UX (uzivatel uz ceka na neco
co neexistuje, nechceme mu jeste ukazovat "Loading...").

---

## 2. Technologie a jazyk

| Technologie | Verze | Pouziti |
|-------------|-------|---------|
| React | 18+ | Funkcionalni komponenta |
| react-router-dom | v6 | `useNavigate` hook, wildcard `path="*"` |
| Forge Design Tokens | -- | CSS custom properties pro barvy, fonty, rozmery |
| ForgeButton | -- | Tlacitka "Back to Home" a "Go Back" |
| AppIcon | -- | Importovana ale **NEPOUZITA** (viz sekce 17) |

Stranka nepouziva:
- Tailwind utility tridy (vsechno inline styles)
- React.lazy / Suspense
- Context providers (LanguageContext, AuthContext)
- Externi knihovny krome react-router-dom

---

## 3. Architektura souboru

```
src/pages/NotFound.jsx        -- jediny soubor, ~70 radku
```

Stranka nema:
- Vlastni slozku (neni `src/pages/not-found/`)
- Podkomponenty
- Testy
- Styly v samostatnem souboru (vse inline)

### Struktura komponenty

```
NotFound (funkcionalni komponenta)
  |-- pageStyle        -- fullscreen flex kontejner, vertikalne vycentrovany
  |-- codeStyle        -- velky "404" text (120px, mono font, accent barva, 15% opacita)
  |-- titleStyle       -- "Page Not Found" nadpis (heading font, 2xl)
  |-- descStyle        -- popisny text (body font, base velikost, muted barva)
  |-- <div>            -- wrapper
  |    |-- <div>       -- "404" (codeStyle)
  |    |-- <h2>        -- "Page Not Found" (titleStyle)
  |    |-- <p>         -- popis (descStyle)
  |    |-- <div>       -- flex kontejner pro tlacitka
  |         |-- <ForgeButton variant="primary">  -- "Back to Home"
  |         |-- <ForgeButton variant="outline">  -- "Go Back"
```

---

## 4. Import graf

```
NotFound.jsx
  |-- react                           (React)
  |-- react-router-dom                (useNavigate)
  |-- @/components/ui/forge/ForgeButton  (ForgeButton -- POUZITO)
  |-- @/components/AppIcon            (Icon -- IMPORTOVANO ale NEPOUZITO)
```

### Reverzni graf (kdo importuje NotFound)

```
src/Routes.jsx:14  -->  import NotFound from './pages/NotFound'
src/Routes.jsx:118 -->  <Route path="*" element={<NotFound />} />
```

Zadna jina komponenta neimportuje NotFound -- pouziva se vyhradne jako
route element.

---

## 5. Design a vizual (Forge compliance)

### Forge tokeny pouzite v NotFound

| CSS Variable | Kde | Hodnota (z forge-tokens.css) |
|-------------|-----|------------------------------|
| `--forge-bg-void` | pozadi stranky | `#08090C` |
| `--forge-font-mono` | "404" text | `'JetBrains Mono', 'Fira Code', monospace` |
| `--forge-accent-primary` | barva "404" textu | `#00D4AA` (teal) |
| `--forge-font-heading` | nadpis "Page Not Found" | `'Space Grotesk', system-ui, sans-serif` |
| `--forge-text-2xl` | velikost nadpisu | `1.563rem` |
| `--forge-text-primary` | barva nadpisu | `#E8ECF1` |
| `--forge-font-body` | popis | `'IBM Plex Sans', system-ui, sans-serif` |
| `--forge-text-base` | velikost popisu | `0.875rem` |
| `--forge-text-muted` | barva popisu | `#7A8291` |

### Font pouziti -- SPRAVNE

- "404" cislo: `--forge-font-mono` -- spravne, jde o technicky/kodovy element
- Nadpis: `--forge-font-heading` -- spravne, jde o heading (text-2xl)
- Popis: `--forge-font-body` -- spravne, jde o body text
- Tlacitka: `--forge-font-heading` (dedeno z ForgeButton) -- spravne

Toto respektuje pravidlo z MEMORY.md:
> `--forge-font-tech` / `--forge-font-mono` jen pro ceny, kody, rozmery,
> male 12px labely; headingy (text-lg+) vzdy heading font.

### Vizualni popis

Stranka je celoobrazovkova (`min-height: 100vh`), vertikalne a horizontalne
vycentrovana (`display: flex`, `align-items: center`, `justify-content: center`).

Vizualni hierarchie shora dolu:
1. **"404"** -- velky polo-pruhledny text (120px, opacity 0.15, teal accent)
2. **"Page Not Found"** -- nadpis presakujici pres "404" (margin-top: -20px)
3. **Popis** -- 1 veta s tematickym textem (max-width: 400px, centered)
4. **Tlacitka** -- 2 vedle sebe (primary + outline variant)

### ForgeButton varianty

- **primary** (`Back to Home`): teal pozadi (`--forge-accent-primary`), tmave pismo, hover glow
- **outline** (`Go Back`): pruhledne pozadi, border (`--forge-border-active`), hover elevate

---

## 9. State management

NotFound je **stateless** komponenta. Nema:

- zadny `useState`
- zadny `useEffect`
- zadny `useContext`
- zadny `useReducer`
- zadne side-effecty

Jediny hook je `useNavigate()` z react-router-dom pro programatickou navigaci.

### Navigacni akce

| Tlacitko | Akce | Mechanismus |
|----------|------|-------------|
| Back to Home | `navigate('/')` | React Router `useNavigate` |
| Go Back | `window.history?.back()` | Nativni browser History API |

Pouziti `window.history?.back()` s optional chaining je bezpecne -- `history`
objekt vzdy existuje v browser prostredi, ale optional chaining je
opatrnost pro edge-case SSR/testovaci prostredi.

---

## 11. Preklady (i18n)

**STAV: NEPODPOROVANO**

Vsechny texty v NotFound jsou hardcoded v anglictine:

```
"404"
"Page Not Found"
"The coordinates you entered don't match any known location in our system."
"Back to Home"
"Go Back"
```

Komponenta **neimportuje** `useLanguage` z `LanguageContext.jsx`
a v prekladovem slovniku (`LanguageContext.jsx`) **neexistuji** klice
pro 404 stranku (napr. `notFound.title`, `notFound.description` apod.).

### Doporuceni pro budouci implementaci

Pridani i18n by vyzadovalo:
1. Import `useLanguage` z `@/contexts/LanguageContext`
2. Pridani prekladu do slovniku v `LanguageContext.jsx`:
   - `'notFound.title': 'Stranka nenalezena'` / `'Page Not Found'`
   - `'notFound.description': 'Zadana adresa neodpovida...'` / `'The coordinates...'`
   - `'notFound.backHome': 'Zpet na uvod'` / `'Back to Home'`
   - `'notFound.goBack': 'Zpet'` / `'Go Back'`
3. Nahrazeni hardcoded textu za `t('notFound.xxx')` volani

---

## 12. Pristupnost

### Soucasny stav

| Kriteria | Stav | Poznamka |
|----------|------|----------|
| Semanticky HTML | CASTECNE | Pouziva `<h2>` pro nadpis, ale chybi `<h1>` |
| ARIA atributy | CHYBI | Zadne `role`, `aria-label`, `aria-live` |
| Kontrast (WCAG AA) | OK | `--forge-text-muted` (#7A8291) na `--forge-bg-void` (#08090C) = 4.7:1 (pres AA) |
| Kontrast nadpisu | OK | `--forge-text-primary` (#E8ECF1) na void = 15.7:1 |
| Fokus management | DELEGOVANO | ForgeButton renderuje `<button>` se standardnim fokusem |
| Document title | CHYBI | Stranka nemeni `<title>` (zustava posledni nastaveny) |
| Skip links | CHYBI | Zadne skip-to-content (ale stranka ma minimalni obsah) |
| Screen reader | SLABE | "404" text je `user-select: none` ale neni `aria-hidden` |
| Klavesnice | OK | Tlacitka jsou standardni `<button>`, navigovatelne Tabem |

### Doporuceni pro zlepseni

1. **Zmenit `<h2>` na `<h1>`** -- stranka je top-level, hlavni nadpis by mel byt h1
2. **Pridat `aria-hidden="true"`** na dekorativni "404" div (je vizualni, ne informacni)
3. **Pridat `role="main"`** na obalovy div nebo pouzit `<main>` element
4. **Nastavit document.title** pres useEffect na "404 - Page Not Found | ModelPricer"
5. **Pridat `aria-label`** na navigacni div s tlacitky

---

## 16. Souvisejici dokumenty

| Dokument | Cesta | Relevance |
|----------|-------|-----------|
| Routes.jsx | `Model_Pricer-V2-main/src/Routes.jsx` | Definice wildcard routy |
| ForgeButton | `Model_Pricer-V2-main/src/components/ui/forge/ForgeButton.jsx` | Tlacitka na 404 strance |
| AppIcon | `Model_Pricer-V2-main/src/components/AppIcon.jsx` | Importovana ale nepouzita |
| forge-tokens.css | `Model_Pricer-V2-main/src/styles/forge-tokens.css` | Designove tokeny |
| LanguageContext | `Model_Pricer-V2-main/src/contexts/LanguageContext.jsx` | i18n slovnik (bez 404 klicu) |
| MEMORY.md | `.claude/projects/.../memory/MEMORY.md` | Hot spots, Forge font pravidla |

---

## 17. Zname omezeni

### O1: Mrtvy import -- Icon (AppIcon)

- **Kde:** `src/pages/NotFound.jsx:4`
- **Popis:** `import Icon from '@/components/AppIcon'` je importovany ale nikde v komponente
  se nepouziva. Zadny `<Icon ... />` element neexistuje v JSX.
- **Dopad:** Zbytecny import zvetsuje bundle (i kdyz minimalne -- AppIcon je maly).
  Nema funkcni dopad.
- **Doporuceni:** Odstranit radek 4.

### O2: Chybejici i18n podpora

- **Kde:** Cela komponenta
- **Popis:** Vsechny texty jsou hardcoded v anglictine. Projekt jinak pouziva
  `LanguageContext` s CS/EN preklady na vsech ostatnich strankach.
- **Dopad:** Cesky uzivatel uvidí anglickou 404 stranku, coz je nekonzistentni
  s ostatnimi strankami.
- **Doporuceni:** Viz sekce 11 -- pridat prekladove klice a integrovat `useLanguage`.

### O3: Chybejici accessibility atributy

- **Kde:** Cela komponenta
- **Popis:** Viz sekce 12 -- chybi aria atributy, document title, spravna heading
  hierarchie.
- **Dopad:** Screen reader uzivatele nemaji optimalní experience.
- **Doporuceni:** Viz sekce 12.

### O4: Heading hierarchie -- h2 misto h1

- **Kde:** `src/pages/NotFound.jsx:53`
- **Popis:** Nadpis "Page Not Found" pouziva `<h2>`. Stranka je top-level page
  a mela by mit `<h1>` jako hlavni nadpis. Dekorativni "404" text je `<div>`,
  takze neni duvod k preskoceni h1.
- **Dopad:** SEO a accessibility -- h1 je ocekavany jako prvni heading na strance.
- **Poznamka:** Mozna puvodne zamysleno tak ze Header komponenta obsahuje h1,
  ale Header renderuje `<header>` element bez h1.

### O5: Neni lazy-loaded (zamerne)

- **Kde:** `src/Routes.jsx:14`
- **Popis:** NotFound je importovana primo, ne pres `React.lazy()`.
  Toto je **zamerne** -- viz vysvetleni v sekci 1 (lazy loading).
- **Dopad:** Komponenta se nacte pri initialnim bundle load.
  Velikost je zanedbatelna (~70 radku, inline styles).

### O6: window.history?.back() edge case

- **Kde:** `src/pages/NotFound.jsx:61`
- **Popis:** Pokud uzivatel prijde na 404 stranku primo (napr. zada neexistujici
  URL primo do address baru jako svou prvni akci), `history.back()` naviguje
  pryc z aplikace (napr. na predchozi tab ci prazdnou stranku).
- **Dopad:** Maly -- uzivatel ma stale tlacitko "Back to Home".
- **Mozne zlepseni:** Kontrolovat `window.history.length > 1` pred volanim
  `back()` a pokud neni kam se vratit, zobrazit jen "Back to Home".

---

*Posledni aktualizace: 2026-02-13*
*Autor: mp-spec-fe-routing agent*
