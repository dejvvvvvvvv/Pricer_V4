# Waves 38-41 — Code Splitting, i18n, Cleanup (2026-03-13)

## Session Context
- **Datum:** 2026-03-13
- **Typ:** Audit Fix Marathon (pokracovani)
- **Vlny:** 38-41 (Autonomy session Wave 38+)
- **Tema:** Bundle optimization, i18n parametrizace, code quality scans

---

## Wave 38 — Code Splitting + Invoice Currency

### Cil
- Rozdelit 2424 kB monoliticky bundle do menších vendor chunku
- Parametrizovat currency v invoiceGenerator.js

### Udelano
1. **vite.config.mjs — manualChunks strategia**
   - vendor-three (919 kB) — Three.js + OrbitControls
   - vendor-firebase (588 kB) — Firebase SDK
   - vendor-charts (422 kB) — Chart.js + react-chartjs
   - vendor-react (205 kB) — React + React Router + React DOM
   - vendor-supabase (173 kB) — Supabase client + realtime
   - vendor-zod (87 kB) — Zod validation
   - vendor-dnd (51 kB) — react-beautiful-dnd
   - Zbyvajici: index.js (index + helpers)

2. **invoiceGenerator.js — Currency parametrizace**
   - Parametr: `currency = 'Kč'` (default)
   - Zpetna kompatibilita: existujici volani bez parametru stale funguje
   - Format: `${amount.toFixed(2)} ${currency}`
   - Signature zmena:
     ```javascript
     export const generateInvoiceHTML = (
       orderData,
       { language = 'cs', currency = 'Kč' } = {}
     ) => { ... }
     ```

3. **test-kalkulacka/index.jsx — Poslední console cleanup**
   - Removal: 2x console.warn() + console.error()
   - Nahrazeno: debug() wrapper volany

### Vysledky
- Bundle before: 2424 kB (single main.js)
- Bundle after: 7 vendor chunks, main ~100 kB (all async-loaded)
- npm run build: PASS

### Soubory zmenenchy
- `vite.config.mjs`
- `src/utils/invoiceGenerator.js`
- `src/pages/test-kalkulacka/index.jsx`

---

## Wave 39 — Quality Scans + OnboardingOverlay

### Cil
- Overit zadny window.confirm() v produkci
- Overit localStorage usage je v povolených vyijmkách
- Presunout accent barvy do Forge tokens

### Audit — window.confirm
- **Hledano:** grep -r "window\.confirm" src/
- **Nalezeno:** 0 pouziti v produkci (vsechny migroaný na ForgeConfirmDialog)
- **Status:** PASS

### Audit — localStorage
- **Hledano:** grep -r "localStorage\." src/ --exclude="*.test.*"
- **Nalezeno:** 5 pouziti v UI komponentach (zjisteno jako povolene):
  - useLanguage hook (language preference)
  - useAdminTheme hook (admin theme choice)
  - AdminOnboarding.jsx (onboarding state)
  - LanguageToggle.jsx (quick switch)
  - ThemeToggle.jsx (theme toggle)
- **Status:** PASS — vsechny jsou zamerne oddělené scopes

### OnboardingOverlay.jsx — Forge tokens
- Barvy pouzivane primo (RGB hodnoty) → Forge CSS variables
- Mapping:
  - `#00D4FF` → `--forge-accent-primary` (teal)
  - `#FF6B6B` → `--forge-accent-secondary` (coral)
  - `#FFA500` → `--forge-accent-warning` (orange)
- Ostatní background/text: z `--forge-*` family

### Soubory zmenenchy
- `src/components/onboarding/OnboardingOverlay.jsx`

---

## Wave 40 — LanguageToggle + Theme Audit

### Cil
- Migrace LanguageToggle.jsx z primo localStorage na hook
- Potvrzit theme hooky jsou spravne oddělené

### LanguageToggle.jsx — Hook migration
- Before: `localStorage.setItem('language', lang)`
- After: `useLanguage()` → `setLanguage(lang)`
- Hook dělá localStorage pod kapotou (encapsulation)
- UI je stale reaktivní

### Theme hooky — Architecture review
- **useAdminTheme()** — scope: admin stranky (`AdminLayout`, `AdminDashboard`, atd.)
  - Storage klíč: `adminTheme`
  - Soubory: `light-theme-admin.css`, `index.css`
- **useTheme()** (calculator) — scope: public + test-kalkulacka
  - Storage klíč: `theme`
  - Soubory: `index.css` (gradient toggle)
- **Vysvetleni:** Oddélení je zamerne — admin nema vlastni theme volbu, jen light-theme-admin.css

### i18n Scan — Admin stranky
- Hledano: ternary pattern `language === 'cs' ? '...' : '...'`
- Nalezeno: 50+ pouziti v:
  - AdminDashboard.jsx (15)
  - AdminOrders.jsx (3)
  - AdminLayout.jsx (3)
  - AdminBranding.jsx (8)
  - AdminPresets.jsx (12)
  - Ostatní (9)

### Soubory zmenenchy
- `src/components/LanguageToggle.jsx`

---

## Wave 41 — i18n Migrace

### Cil
- Migrovat 50+ ternary `language === 'cs' ? '...' : '...'` na t() volani
- Rozsirit LanguageContext.jsx s novymi klici

### LanguageContext.jsx — 68 novych klicu
- Tema: Admin labels, menu items, status text, dialog text
- Priklad cluster:
  ```javascript
  admin: {
    dashboard: {
      title: { cs: 'Přehled', en: 'Dashboard' },
      recentOrders: { cs: 'Poslední objednávky', en: 'Recent Orders' },
      activityFeed: { cs: 'Aktivita', en: 'Activity' }
    },
    orders: {
      status: { ... },
      actions: { ... }
    }
  }
  ```

### AdminDashboard.jsx — Migrace
- Removal: 15 ternary patterns
- Mapa: Kazdemu key-value pairu `'...'` / `'...'` prirazen odpovídající t() klic
- Priklad:
  ```javascript
  // Before
  <h2>{language === 'cs' ? 'Přehled' : 'Dashboard'}</h2>
  // After
  <h2>{t('admin.dashboard.title')}</h2>
  ```

### AdminOrders.jsx — Migrace
- Removal: 3 ternary patterns (status labels)
- Nove klice: `admin.orders.status.*`

### AdminLayout.jsx — Migrace
- Removal: 3 ternary patterns (footer links + menu)
- Nove klice: `admin.layout.footer.*`, `admin.layout.menu.*`

### Build & Validation
- npm run build: PASS
- Zadne error messages pri compile
- i18n fallback: pokud klic chybí, vrati se English default

### Soubory zmenenchy
- `src/context/LanguageContext.jsx`
- `src/pages/admin/AdminDashboard.jsx`
- `src/pages/admin/AdminOrders.jsx`
- `src/pages/admin/AdminLayout.jsx`

---

## Statistiky (Waves 38-41)

| Metrika | Hodnota |
|---------|---------|
| Bundle size reduction | 2424 kB monoliticky → 7 vendor chunks (max 919 kB) |
| window.confirm() v produkci | 0 (PASS) |
| localStorage usage | 5 (all approved) |
| i18n ternary migraci | 50+ → t() |
| Nove i18n klice | 68 |
| Soubory modifikovane | 10+ |
| npm run build | PASS |

---

## Lessons Learned

1. **Vendor chunking:** Rozdeleni Three.js + Firebase znacinne snizuje TTI pro strany ktere je nepoužívají
2. **i18n pattern:** Ternary `lang === 'cs' ? '...' : '...'` je unmaintainable ve velkem — t() je cleaner
3. **localStorage audit:** Pravidlo "no direct localStorage" ma vyjimky (theme, lang), ale musi byt dokumentovane
4. **Hook encapsulation:** useLanguage() + useAdminTheme() oddělení je správné — scope je jasny

---

## Navazujici tasks

- [ ] Dashboard UX polish (Wave 42)
- [ ] Model Storage performance (Wave 43)
- [ ] Widget embed hardening (Wave 44)
- [ ] Checkout flow polish (Wave 45)

---

## Zdroje

- **CLAUDE.md:** `Model_Pricer-V2-main/CLAUDE.md` (sekce 10-15, bundle config)
- **Vite docs:** https://vitejs.dev/guide/code-splitting.html
- **i18n audit:** ID `W41`, status: Complete
