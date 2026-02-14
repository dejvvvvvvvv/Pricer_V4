# Build Config — Dokumentace

> Vite, Tailwind, PostCSS a package.json konfigurace pro projekt ModelPricer / Pricer V3.
> Kompletni popis build pipeline, dev serveru, aliasu, pluginu a optimalizaci.

---

## 1. Prehled

Projekt pouziva moderni frontend build stack:

- **Vite 5** jako bundler a dev server (nahrazuje Create React App)
- **Tailwind CSS 3.4** jako utility-first CSS framework s vlastnim Forge design systemem
- **PostCSS 8** jako CSS procesor s nesting a autoprefixerem
- **React 19** jako UI framework
- **jsconfig.json** pro IDE path aliasy (`@/` -> `src/`)

Build pipeline: `src/**` -> PostCSS (nesting + Tailwind + autoprefixer) -> Vite (bundling + tree-shaking) -> `build/`

Dev server bezi na portu **4028** s proxy na backend-local (Express) na portu **3001**.

---

## 2. Technologie a verze (z package.json)

### 2.1 Core runtime zavislosti

| Balicek | Verze | Ucel |
|---------|-------|------|
| react | ^19.1.1 | UI framework |
| react-dom | ^19.1.1 | React DOM renderer |
| react-router-dom | 6.0.2 | Client-side routing |
| @reduxjs/toolkit | ^2.6.1 | State management |
| redux | ^5.0.1 | State store |

### 2.2 Build toolchain (devDependencies)

| Balicek | Verze | Ucel |
|---------|-------|------|
| vite | 5.0.0 | Bundler a dev server |
| @vitejs/plugin-react | 4.3.4 | React Fast Refresh + JSX transform |
| vite-tsconfig-paths | 3.6.0 | Resoluce `@/` aliasu z jsconfig.json |
| tailwindcss | 3.4.6 | Utility-first CSS framework |
| postcss | 8.4.8 | CSS procesor |
| autoprefixer | 10.4.2 | Vendor prefix automat |

### 2.3 Tailwind pluginy (devDependencies)

| Balicek | Verze | Ucel |
|---------|-------|------|
| @tailwindcss/forms | ^0.5.7 | Reset formularu (pouzity v tailwind.config.js) |
| @tailwindcss/typography | ^0.5.16 | Prose typografie (nainstalovany, nepouzity v configu) |
| @tailwindcss/aspect-ratio | ^0.4.2 | Aspect ratio utility (nainstalovany, nepouzity v configu) |
| @tailwindcss/container-queries | ^0.1.1 | Container queries (nainstalovany, nepouzity v configu) |
| @tailwindcss/line-clamp | ^0.1.0 | Text truncation (nainstalovany, nepouzity v configu) |
| tailwindcss-animate | ^1.0.7 | Animacni utility (pouzity v tailwind.config.js) |
| tailwindcss-elevation | ^2.0.0 | Elevation shadows (nainstalovany, nepouzity v configu) |
| tailwindcss-fluid-type | ^2.0.7 | Fluid typography (nainstalovany, nepouzity v configu) |

### 2.4 Ostatni vyznamne zavislosti

| Balicek | Verze | Ucel |
|---------|-------|------|
| @supabase/supabase-js | ^2.95.3 | Supabase klient (databaze, storage) |
| firebase | ^12.7.0 | Firebase SDK |
| three | ^0.180.0 | 3D rendering (WebGL) |
| @react-three/fiber | ^9.3.0 | React wrapper pro Three.js |
| @react-three/drei | ^9.122.0 | Three.js helpery |
| framer-motion | ^12.23.12 | Animace |
| react-hook-form | ^7.62.0 | Formularova logika |
| zod | ^4.1.9 | Schema validace |
| i18next | ^25.5.2 | Internacionalizace |
| d3 | ^7.9.0 | Data vizualizace |
| recharts | ^2.15.2 | Grafy |
| axios | ^1.8.4 | HTTP klient |
| lucide-react | ^0.484.0 | Ikony |
| sonner | ^2.0.7 | Toast notifikace |

### 2.5 NPM skripty

| Skript | Prikaz | Ucel |
|--------|--------|------|
| `npm start` | `vite` | Dev server na portu 4028 |
| `npm run dev` | `vite` | Alias pro start |
| `npm run build` | `vite build --sourcemap` | Produkci build do `build/` se source mapami |
| `npm run serve` | `vite preview` | Nahled produkciho buildu |

### 2.6 Browserslist

| Prostredi | Pravidlo |
|-----------|---------|
| Production | `>0.2%`, `not dead`, `not op_mini all` |
| Development | `last 1 chrome version`, `last 1 firefox version`, `last 1 safari version` |

### 2.7 ESLint konfigurace (inline v package.json)

Pouziva `react-app` a `react-app/jest` extendy (CRA legacy). Zadny samostatny `.eslintrc` soubor.

### 2.8 rocketCritical sekce

Package.json obsahuje custom `rocketCritical` objekt — varovani pro agenty a nastroje, ktere balicky
a skripty jsou kriticke a NESMI byt odstranovany:

**Kriticke dependencies:** react, react-dom, @reduxjs/toolkit, redux, react-router-dom
**Kriticke devDependencies:** @vitejs/plugin-react, vite, vite-tsconfig-paths, tailwindcss, autoprefixer, postcss
**Kriticke skripty:** start, build, serve

---

## 3. Architektura souboru

```
Model_Pricer-V2-main/
  vite.config.mjs            — Vite konfigurace (build, plugins, alias, server, proxy)
  tailwind.config.js          — Tailwind CSS konfigurace (theme, colors, fonts, animations)
  postcss.config.js           — PostCSS pipeline (nesting + tailwind + autoprefixer)
  package.json                — Zavislosti, skripty, browserslist, eslint
  jsconfig.json               — IDE path aliasy (@/ -> src/)
  index.html                  — Vite entrypoint (root)
  public/
    index.html                — Staticka kopie (OBA musi byt synchronizovany!)
  src/
    styles/
      forge-tokens.css        — Forge design system CSS custom properties
    ...
  build/                      — Output adresare (generovany pres `npm run build`)
```

**Dulezite:** Projekt ma DVA `index.html` soubory — root `index.html` (Vite entrypoint)
a `public/index.html`. Oba musi byt synchronizovany (title, lang, meta tagy).

---

## 8. Kazdy config soubor — detailni popis

### 8.1 vite.config.mjs

**Cesta:** `Model_Pricer-V2-main/vite.config.mjs`
**Format:** ESM (`.mjs` — pouziva `import`/`export`)

#### 8.1.1 Build sekce

```js
build: {
  outDir: "build",
  chunkSizeWarningLimit: 2000,
}
```

| Vlastnost | Hodnota | Vychozi Vite | Popis |
|-----------|---------|--------------|-------|
| `outDir` | `"build"` | `"dist"` | Vystupni adresar — zmeneno z `dist` na `build` (CRA konvence) |
| `chunkSizeWarningLimit` | `2000` (kB) | `500` (kB) | Zvyseny 4x — potlacuje varovani pro velke chunky (Three.js, D3, Firebase) |

Build prikaz `vite build --sourcemap` (z package.json) generuje source mapy pro debugovani produkce.

#### 8.1.2 Plugins

```js
plugins: [
  tsconfigPaths(),
  react(),
]
```

| Plugin | Balicek | Ucel |
|--------|---------|------|
| `tsconfigPaths()` | vite-tsconfig-paths@3.6.0 | Cte `paths` z `jsconfig.json` a registruje `@/` alias pro Vite resolver |
| `react()` | @vitejs/plugin-react@4.3.4 | React Fast Refresh (HMR), JSX automaticky runtime transform |

**Zakomentovany plugin:** `viteStaticCopy` — byl zamyslen pro kopirovani Kiri:Moto engine souboru
(`public/kiri/**/*` -> `build/kiri/`). Momentalne neaktivni.

#### 8.1.3 Resolve aliasy

```js
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
}
```

Definuje alias `@` -> `./src` pro importy typu `import Foo from '@/components/Foo'`.
Toto je **duplicitni** s `jsconfig.json` (kde je stejna cesta). Duvod: `vite-tsconfig-paths` cte
jsconfig, ale explicitni `resolve.alias` je pojistka pro pripad ze plugin selze.

#### 8.1.4 Dev server

```js
server: {
  port: "4028",
  host: "0.0.0.0",
  strictPort: true,
  proxy: { ... },
  headers: { ... },
}
```

| Vlastnost | Hodnota | Popis |
|-----------|---------|-------|
| `port` | `"4028"` | Dev server port (pozn: string misto number, Vite akceptuje oboji) |
| `host` | `"0.0.0.0"` | Naslouchani na vsech rozhranich (pristup z LAN/kontejneru) |
| `strictPort` | `true` | Pokud je port 4028 obsazeny, server NESPADNE na dalsi volny — rovnou selze |

#### 8.1.5 Proxy konfigurace

```js
proxy: {
  '/api': {
    target: 'http://127.0.0.1:3001',
    changeOrigin: true,
    rewrite: (path) => path,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('Origin');
      });
    },
  },
}
```

Vsechny requesty zacinajici na `/api` jsou proxovany na backend-local (Express) bezici na portu 3001.

| Vlastnost | Hodnota | Popis |
|-----------|---------|-------|
| `target` | `http://127.0.0.1:3001` | Backend-local Express server |
| `changeOrigin` | `true` | Meni Origin header na target URL |
| `rewrite` | identity funkce | Zachovava `/api` prefix (NE strippuje) |
| `configure` | custom handler | Odebira `Origin` header aby backend videl same-origin pozadavek |

**Proc se odebira Origin:** Backend-local ma CORS allowlist. Odebranim Origin headeru se request
tvari jako server-side volani, cimz se obchazi CORS restrikce pri vyvoji.

#### 8.1.6 Security headers

```js
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}
```

Tyto headery povoleni pouziti `SharedArrayBuffer` a `Atomics` v prohlizeci — nutne pro:
- **Kiri:Moto** slicer engine (WebAssembly s vice vlakny)
- **Three.js** worker threads (offscreen rendering)
- Jakykoliv WebAssembly kod s `pthread` podporou

Bez techto headeru prohlizec zablokuje pristup k `SharedArrayBuffer`.

---

### 8.2 tailwind.config.js

**Cesta:** `Model_Pricer-V2-main/tailwind.config.js`
**Format:** ESM (`export default`)

#### 8.2.1 Dark mode

```js
darkMode: ["class"],
```

Pouziva class-based dark mode — temata se prepiaji pridanim/odebiranim tridy `.dark` na `<html>`.
Projekt pouziva Forge dark theme jako default, takze `.dark` je temer vzdy aktivni.

#### 8.2.2 Content scan

```js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
```

Tailwind skenuje tyto soubory pro pouzite utility tridy. Nepouzite tridy jsou odstranovany
v produkci (tree-shaking/purge).

**Pozor:** Skenuje pouze root `index.html`, NE `public/index.html`. Pokud `public/index.html`
pouziva Tailwind tridy primo v HTML, nebudou zahrnuty v produkci.

#### 8.2.3 Barevna paleta

Tailwind theme extenduje defaultni paletu o 4 skupiny barev:

**a) shadcn/ui systemove barvy (HSL CSS vars):**

| Nazev | CSS promenna | Ucel |
|-------|-------------|------|
| border | `--border` | Ohraniceni elementu |
| input | `--input` | Input borders |
| ring | `--ring` | Focus ringy |
| background | `--background` | Pozadi stranky |
| foreground | `--foreground` | Hlavni text |
| primary | `--primary` + `--primary-foreground` | Primarni akce |
| secondary | `--secondary` + `--secondary-foreground` | Sekundarni akce |
| destructive | `--destructive` + `--destructive-foreground` | Mazani, chyby |
| muted | `--muted` + `--muted-foreground` | Ztlumene pozadi/texty |
| accent | `--accent` + `--accent-foreground` | Akcentove prvky |
| popover | `--popover` + `--popover-foreground` | Vyskakovaci okna |
| card | `--card` + `--card-foreground` | Karty |
| chart.1-5 | `--chart-1` az `--chart-5` | Barvy grafu |

**b) Aplikacni statusove barvy (CSS vars bez HSL):**

| Nazev | CSS promenna | Ucel |
|-------|-------------|------|
| success | `--color-success` | Uspech |
| warning | `--color-warning` | Varovani |
| error | `--color-error` | Chyba |
| jade | `--color-jade` | Specialni akcentova barva |

**c) Forge design system barvy (hardcoded hex):**

| Nazev | Hex | Ucel |
|-------|-----|------|
| forge-void | `#08090C` | Nejtmavsi pozadi |
| forge-surface | `#0E1015` | Hlavni pozadi |
| forge-elevated | `#161920` | Zvysene pozadi (karty) |
| forge-overlay | `#1C1F28` | Overlay pozadi |
| forge-text-primary | `#E8ECF1` | Hlavni text |
| forge-text-secondary | `#9BA3B0` | Sekundarni text |
| forge-text-muted | `#5C6370` | Ztlumeny text |
| forge-accent-primary | `#00D4AA` | Teal akcent (hlavni) |
| forge-accent-primary-h | `#00F0C0` | Teal akcent hover |
| forge-accent-secondary | `#FF6B35` | Oranzovy akcent |
| forge-accent-tertiary | `#6C63FF` | Fialovy akcent |
| forge-success | `#00D4AA` | Uspech (= accent primary) |
| forge-warning | `#FFB547` | Varovani |
| forge-error | `#FF4757` | Chyba |
| forge-info | `#4DA8DA` | Info |
| forge-border-default | `#1E2230` | Vychozi border |
| forge-border-active | `#2A3040` | Aktivni border |
| forge-border-grid | `#141720` | Grid border |

#### 8.2.4 Fonty (fontFamily)

| Nazev | Fonty | Pouziti |
|-------|-------|---------|
| `sans` | Inter, sans-serif | Default body text |
| `mono` | JetBrains Mono, monospace | Kod, technicke udaje |
| `forge-heading` | Space Grotesk, system-ui, sans-serif | Nadpisy (text-lg a vetsi) |
| `forge-body` | IBM Plex Sans, system-ui, sans-serif | Body text ve Forge theme |
| `forge-mono` | JetBrains Mono, Fira Code, monospace | Monospacovy kod |
| `forge-tech` | Space Mono, JetBrains Mono, monospace | Male labely, ceny, kody, rozmery (12px) |

**Pravidlo:** `forge-heading` pro nadpisy (text-lg+), `forge-tech` POUZE pro 12px labely/ceny/kody.
Viz MEMORY.md — forge-font-tech vs forge-font-heading.

#### 8.2.5 Font sizes (fontSize)

Kompletni stupnice od `xs` (0.75rem/12px) po `6xl` (3.75rem/60px) s explicitnimi line-height
hodnotami. Odpovida standardni Tailwind stupnici.

| Trida | Velikost | Line-height |
|-------|----------|-------------|
| xs | 0.75rem (12px) | 1rem (16px) |
| sm | 0.875rem (14px) | 1.25rem (20px) |
| base | 1rem (16px) | 1.5rem (24px) |
| lg | 1.125rem (18px) | 1.75rem (28px) |
| xl | 1.25rem (20px) | 1.75rem (28px) |
| 2xl | 1.5rem (24px) | 2rem (32px) |
| 3xl | 1.875rem (30px) | 2.25rem (36px) |
| 4xl | 2.25rem (36px) | 2.5rem (40px) |
| 5xl | 3rem (48px) | 1 (= font-size) |
| 6xl | 3.75rem (60px) | 1 (= font-size) |

#### 8.2.6 Spacing (vlastni)

Pridava 3 custom spacing hodnoty nad standardni Tailwind stupnici:

| Trida | Hodnota | Pouziti |
|-------|---------|---------|
| `18` | 4.5rem (72px) | Stredni mezera |
| `88` | 22rem (352px) | Siroka mezera/kontejner |
| `128` | 32rem (512px) | Extra siroky kontejner |

#### 8.2.7 Box shadows

Pouziva CSS custom properties pro stiny, propojene s Forge token systemem:

| Trida | CSS var | Alternativni nazev |
|-------|---------|--------------------|
| sm | `--shadow-sm` | elevation-1 |
| DEFAULT | `--shadow-default` | elevation-2 |
| md | `--shadow-md` | elevation-3 |
| lg | `--shadow-lg` | elevation-4 |
| xl | `--shadow-xl` | elevation-5 |

Elevation system (1-5) odpovida Material Design konvenci — vyssi cislo = vetsi vyvyseni.

#### 8.2.8 Animace a keyframes

| Animace | Trvani | Easing | Popis |
|---------|--------|--------|-------|
| shimmer | 1.5s infinite | default | Loading skeleton efekt |
| progress-ring | 2s linear infinite | linear | Rotujici loading indicator |
| fade-in | 150ms | ease-out | Plynule zobrazeni |
| fade-out | 150ms | ease-out | Plynule skryti |
| scale-in | 150ms | ease-out | Zoom-in + fade |
| slide-down | 250ms | cubic-bezier(0.4, 0, 0.2, 1) | Accordion otevreni (Radix) |
| slide-up | 250ms | cubic-bezier(0.4, 0, 0.2, 1) | Accordion zavreni (Radix) |

`slide-down`/`slide-up` pouzivaji `--radix-accordion-content-height` — integrace s Radix UI.

#### 8.2.9 Transition timing a duration

| Nazev | Hodnota | Pouziti |
|-------|---------|---------|
| micro | cubic-bezier(0.4, 0, 0.2, 1) | Kratke UI interakce (hover, focus) |
| layout | cubic-bezier(0.4, 0, 0.2, 1) | Layoutove prechody (accordion, modaly) |
| 150 | 150ms | Micro interakce |
| 250 | 250ms | Layoutove prechody |

#### 8.2.10 Z-index

| Trida | Hodnota | Ucel |
|-------|---------|------|
| 1000 | 1000 | Sticky elementy, dropdown |
| 1100 | 1100 | Modaly, dialogy |
| 1200 | 1200 | Toasty, notifikace (nad modaly) |

#### 8.2.11 Border radius

Pouziva CSS custom property `--radius` jako zaklad:

| Trida | Hodnota |
|-------|---------|
| lg | `var(--radius)` |
| md | `calc(var(--radius) - 2px)` |
| sm | `calc(var(--radius) - 4px)` |

Toto je shadcn/ui konvence — menit `--radius` v CSS meni vsechny border-radius naraz.

#### 8.2.12 Plugins

```js
plugins: [
  require('@tailwindcss/forms'),
  require('tailwindcss-animate'),
]
```

| Plugin | Ucel |
|--------|------|
| @tailwindcss/forms | Resetuje a stylizuje nativni formulare (input, select, textarea, checkbox) |
| tailwindcss-animate | Pridava animacni utility tridy (animate-in, animate-out, fade, slide, zoom) |

**Nainstalovane ale NEPOUZITE v configu:** @tailwindcss/typography, @tailwindcss/aspect-ratio,
@tailwindcss/container-queries, @tailwindcss/line-clamp, tailwindcss-elevation, tailwindcss-fluid-type.
Tyto balicky jsou v devDependencies, ale nejsou registrovany v `plugins` poli.

---

### 8.3 postcss.config.js

**Cesta:** `Model_Pricer-V2-main/postcss.config.js`
**Format:** CommonJS (`module.exports`)

```js
module.exports = {
  plugins: {
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Pipeline (poradi je dulezite):

| Poradi | Plugin | Ucel |
|--------|--------|------|
| 1 | tailwindcss/nesting | Povoleni CSS nesting syntaxe (`& .child { }`) pred zpracovanim Tailwindem |
| 2 | tailwindcss | Generovani utility trid, zpracovani `@tailwind` direktiv |
| 3 | autoprefixer | Pridavani vendor prefixu (`-webkit-`, `-moz-`) podle browserslist |

**Poradi je kriticke:** Nesting musi byt prvni, protoze Tailwind neumi zpracovat vnoreny CSS.
Autoprefixer musi byt posledni, protoze potrebuje finalni CSS.

---

### 8.4 jsconfig.json

**Cesta:** `Model_Pricer-V2-main/jsconfig.json`
**Format:** JSON

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "exclude": ["node_modules", "build"]
}
```

| Vlastnost | Hodnota | Ucel |
|-----------|---------|------|
| `baseUrl` | `"."` | Zakladni adresar pro path resoluce (root projektu) |
| `paths.@/*` | `["src/*"]` | Alias `@/` -> `src/` pro IDE autocomplete a navigaci |
| `exclude` | `["node_modules", "build"]` | Ignorovane adresare pro IDE indexovani |

**Poznamka:** Projekt NEMA `tsconfig.json`. Plugin `vite-tsconfig-paths` umi cist i `jsconfig.json`,
takze alias `@/` funguje jak v IDE, tak v Vite builderu.

---

### 8.5 package.json

**Cesta:** `Model_Pricer-V2-main/package.json`
**Format:** JSON

Detailni rozbor viz sekce 2 (Technologie a verze). Klicove body:

- **Nazev:** `model-pricer`, verze `0.1.0`, `private: true` (nepublikovatelny na npm)
- **46 dependencies** (runtime), **10 devDependencies** (build tooling)
- **4 skripty:** start, dev, build, serve
- **rocketCritical:** Custom sekce s varovanim pro AI agenty — kriticke balicky NESMI byt odstranovany
- **eslintConfig:** Inline CRA legacy konfigurace (react-app extend)
- **browserslist:** Produkce pro >0.2% trhu, dev pro posledni verze 3 prohlizecu

---

## 13. Performance (build optimalizace, chunks)

### 13.1 Chunk size limit

`chunkSizeWarningLimit: 2000` (kB) — zvyseno 4x oproti defaultnimu Vite limitu (500 kB).
Duvod: projekt pouziva velke knihovny ktere generuji velke chunky:

| Knihovna | Odhadovana velikost | Duvod |
|----------|-------------------|-------|
| three / @react-three/* | ~600-800 kB | 3D rendering engine |
| firebase | ~300-500 kB | Firebase SDK (auth, firestore, storage) |
| d3 | ~200-300 kB | Data vizualizace |
| framer-motion | ~100-150 kB | Animacni knihovna |
| recharts | ~150-200 kB | Grafy (zavisi na D3) |

### 13.2 Source mapy

Build prikaz: `vite build --sourcemap` — generuje `.map` soubory vedle kazdeho JS/CSS output souboru.
Source mapy jsou uzitecne pro:
- Debugovani produkce v DevTools (originalni radky, ne minified)
- Error tracking (Sentry, LogRocket — mapovani stack traces na zdrojovy kod)

**Pozor:** Source mapy zvetsuj build output a mohou odhalovat zdrojovy kod. Pro verejny deployment
zvazit `--sourcemap hidden` (source mapy se generuji, ale nejsou linkovany v output souborech).

### 13.3 Tree-shaking

Vite pouziva Rollup pro produkci build, ktery provadi tree-shaking automaticky. Tailwind CSS
provadi vlastni tree-shaking (purge) na zaklade `content` pole — nepouzite utility tridy jsou
odstranovany.

### 13.4 Vite Fast Refresh (HMR)

Plugin `@vitejs/plugin-react` povoluje React Fast Refresh — pri zmene JSX souboru se aktualizuje
pouze zmenena komponenta BEZ reloadu cele stranky a BEZ ztraty React stanu.

---

## 15. Konfigurace (env vars, aliases, plugins)

### 15.1 Path aliasy

Alias `@/` -> `src/` je definovan na DVOU mistech:

| Zdroj | Ucel | Pouziva |
|-------|------|---------|
| `jsconfig.json` paths | IDE autocomplete, navigace | VS Code, WebStorm |
| `vite.config.mjs` resolve.alias | Vite bundler resoluce | Vite dev server + build |
| `vite-tsconfig-paths` plugin | Cte jsconfig.json a registruje aliasy ve Vite | Vite |

**Redundance:** `resolve.alias` a `vite-tsconfig-paths` delaji to same. Explicitni `resolve.alias`
je pojistka — viz komentar v kodu: "we define it here to avoid Vite import-resolution errors."

### 15.2 Environment variables

Vite pouziva `VITE_` prefix pro env promenne pristupne v klientskem kodu:
- `import.meta.env.VITE_*` — dostupne v `src/**` souborech
- `.env`, `.env.local`, `.env.development`, `.env.production` — standardni Vite env soubory

Projekt pouziva `dotenv` balicek v dependencies (runtime), ale pro frontend je to zbytecne —
Vite ma vestavenou env podporu. `dotenv` je pravdepodobne pouzivany jen v backend-local.

### 15.3 Dev server proxy

Proxy `/api` -> `http://127.0.0.1:3001` umoznuje:
- Frontend vola `/api/...` relativne (bez CORS problemu)
- Backend-local (Express) zpracovava API pozadavky
- Origin header se odebira pro obejiti CORS allowlistu

### 15.4 Security headers (COOP/COEP)

| Header | Hodnota | Ucel |
|--------|---------|------|
| Cross-Origin-Opener-Policy | same-origin | Izoluje browsing context (ochrana pred Spectre) |
| Cross-Origin-Embedder-Policy | require-corp | Pozaduje CORS/CORP pro vsechny sub-resources |

Tyto headery dohromady povoleni `crossOriginIsolated` stav prohlizece, ktery odemyka:
- `SharedArrayBuffer` (nutny pro WebAssembly multi-threading)
- `Atomics` (synchronizacni primitivy)
- Presnejsi `performance.now()` (vyssi rozliseni casovace)

**Omezeni:** Vsechny externi zdroje (CDN, fonty, obrazky) musi mit `Cross-Origin-Resource-Policy`
header nebo CORS headery, jinak budou zablokovany.

### 15.5 Vite pluginy — souhrn

| Plugin | Stav | Ucel |
|--------|------|------|
| vite-tsconfig-paths | AKTIVNI | Path alias resoluce z jsconfig.json |
| @vitejs/plugin-react | AKTIVNI | React Fast Refresh + JSX transform |
| vite-plugin-static-copy | ZAKOMENTOVANY | Kopirovani Kiri:Moto souboru (momentalne neaktivni) |

---

## 17. Zname omezeni

### 17.1 Port jako string

V `vite.config.mjs` je port definovany jako string `"4028"` misto cisla `4028`. Vite to akceptuje
a internu konvertuje, ale je to nekonzistentni s typovou definici (`ServerOptions.port: number`).

### 17.2 Nepouzite Tailwind pluginy

6 nainstalovanych Tailwind pluginu NENI registrovano v `tailwind.config.js`:
- @tailwindcss/typography
- @tailwindcss/aspect-ratio
- @tailwindcss/container-queries
- @tailwindcss/line-clamp
- tailwindcss-elevation
- tailwindcss-fluid-type

Tyto balicky zvetsuj `node_modules` ale nemaji zadny efekt bez registrace v `plugins` poli.
Zvazit odstranovani nepotrených nebo registraci tech ktere jsou zamyslene.

### 17.3 Duplicitni alias konfigurace

Alias `@/` je definovan trikrat — v `jsconfig.json`, pres `vite-tsconfig-paths` plugin
a explicitne v `resolve.alias`. Zmena v jednom miste bez zmeny v ostatnich muze zpusobit
nekonzistenci mezi IDE a build procesem.

### 17.4 chunkSizeWarningLimit neni reseni

Zvyseni `chunkSizeWarningLimit` na 2000 kB potlacuje varovani, ale neresi velke chunky samotne.
Pro produkci by bylo vhodne zavest manual chunk splitting:

```js
// Priklad (zatim neimplementovano):
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        three: ['three', '@react-three/fiber', '@react-three/drei'],
        firebase: ['firebase'],
        d3: ['d3', 'recharts'],
      }
    }
  }
}
```

### 17.5 COOP/COEP omezeni

Security headery `same-origin` + `require-corp` mohou blokovat:
- Externi obrazky bez CORS headeru
- Google Fonts (pokud neposlouzi CORP header)
- Third-party skripty (analytics, chat widgety)
- Embedovane iframe z jinych domen

Pro kazdou externi resource je nutne overit CORS/CORP kompatibilitu.

### 17.6 Source mapy v produkci

`vite build --sourcemap` generuje verejne pristupne source mapy. Utocnik muze ziskat
originalni zdrojovy kod. Pro produkci zvazit `--sourcemap hidden`.

### 17.7 Dva index.html soubory

Root `index.html` (Vite entrypoint) a `public/index.html` musi byt synchronizovany.
Zmena v jednom bez zmeny v druhem zpusobuje nekonzistentni meta tagy, title a lang atribut.

### 17.8 dotenv v frontend dependencies

Balicek `dotenv` je v runtime `dependencies`, ale Vite ma vestavenou env podporu (`import.meta.env`).
`dotenv` je pravdepodobne potrebny jen pro backend-local, ale je nainstalovany v hlavnim package.json.

### 17.9 react-router-dom pinned verze

`react-router-dom` je pinnuto na `6.0.2` (bez `^` prefixu), zatimco vsechny ostatni balicky
pouzivaji semver range (`^`). To zabranjuje automatickym minor/patch updatum. Pokud je to zamerne
(kvuli kompatibilite), mel by byt duvod zdokumentovany.

---

*Dokumentace vytvorena: 2026-02-13*
*Zdrojove soubory: vite.config.mjs, tailwind.config.js, postcss.config.js, package.json, jsconfig.json*
