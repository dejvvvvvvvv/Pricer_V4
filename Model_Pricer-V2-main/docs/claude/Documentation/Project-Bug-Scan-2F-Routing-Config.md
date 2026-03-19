# Project Bug Scan #2F — Routing, Konfigurace, Infrastruktura

**Datum:** 2026-03-18
**Průzkum:** 2. scan, Sekce F

---

## P0 nálezy (2)

### P0-1. Lazy import SlicerPage — soubor neexistuje
- **Soubor:** `src/Routes.jsx:28`
- **Popis:** `React.lazy(() => import('./pages/slicer'))` — adresář src/pages/slicer/ neexistuje
- **Dopad:** Route /slicer crashne do ErrorBoundary
- **Oprava:** Odebrat route nebo vytvořit placeholder
- **Opraveno:** [ ]

### P0-2. Lazy import WidgetPublicPage — soubor neexistuje
- **Soubor:** `src/Routes.jsx:27`
- **Popis:** `import('./pages/widget-public/WidgetPublicPage')` — neexistuje
- **Dopad:** Widget embed route /w/:publicWidgetId nefunguje — production-critical
- **Oprava:** Vytvořit redirect na widget-kalkulacka nebo odebrat
- **Opraveno:** [ ]

---

## P1 nálezy (5)

### P1-1. VITE_APP_URL chybí v .env.example
- Používáno v SupabaseAuthProvider pro OAuth redirect
- **Opraveno:** [ ]

### P1-2. react-router-dom 6.0.2 — zastaralá, nekompatibilní s React 19
- Aktuální: 6.28+, projekt má React 19
- **Opraveno:** [ ]

### P1-3. COEP/COOP headers blokují iframe widget embed v dev
- vite.config.mjs:88-91
- **Opraveno:** [ ]

### P1-4. Sourcemap v produkčním buildu
- package.json build script: --sourcemap
- **Opraveno:** [ ]

### P1-5. Dva Supabase createClient — session konflikt
- client.js vs authClient.js
- **Opraveno:** [ ]

---

## P2 / Vylepšení (6)

### P2-1. Redux v dependencies ale nepoužíván (~50KB zbytečně)
### P2-2. react-helmet nepoužíván
### P2-3. react-spinners, react-resizable nepoužívány
### P2-4. d3 plná distribuce — možná jen tree-shaking dependency
### P2-5. lockanalytics route — security through obscurity
### P2-6. vite.config port jako string místo čísla

---

## PWA Status
- swRegister.js existuje, správně implementován
- sw.js a manifest.json CHYBÍ v public/ složce
- PWA install prompt nikdy nenastane bez service workera
- PwaInstallBanner v App.jsx je neúčinný

---

## Nepoužívané závislosti
| Závislost | Velikost | Importy v src/ |
|-----------|----------|----------------|
| @reduxjs/toolkit | ~50KB | 0 |
| redux | ~15KB | 0 |
| react-helmet | ~6KB | 0 |
| react-spinners | ~20KB | 0 |
| react-resizable | ~10KB | 0 |

## Statistika
- P0: 2
- P1: 5
- P2/Vylepšení: 6
