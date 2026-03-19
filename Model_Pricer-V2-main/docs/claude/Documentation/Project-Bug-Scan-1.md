# Project Bug Scan #1 — Systematický průzkum chyb

**Datum:** 2026-03-18
**Průzkum:** 1. scan (z minimálně 3)
**Stav:** Dokumentováno, čeká na opravu

---

## Kategorie: P0 — Kritické (musí se opravit)

### 1. Broken Analytics route
- **Soubor:** `src/Routes.jsx:161`
- **Popis:** Route je definována jako `path="lockanalytics"` (skryta pro beta), ale AdminDashboard.jsx naviguje na `/admin/analytics` (řádky 70, 437, 613 v QUICK_LINKS). Kliknutí na "Analytics" v dashboardu vede na 404.
- **Souvisí:** `src/pages/admin/AdminDashboard.jsx:70, :437, :613`
- **Oprava:** Zakomentovat QUICK_LINKS analytics entry, nebo přejmenovat route
- **Opraveno:** [ ]

### 2. createId() fallback v AdminCoupons.jsx
- **Soubor:** `src/pages/admin/AdminCoupons.jsx:35-40`
- **Popis:** catch větev volá `crypto.randomUUID()` znovu — pokud try selže, fallback taky selže. Nefunkční fallback.
- **Oprava:** Změnit fallback na `Date.now().toString(36) + Math.random().toString(36)`
- **Opraveno:** [ ]

---

## Kategorie: P1 — Důležité

### 3. fmtCurrency() hardcoded "Kc" místo "Kč"
- **Soubor:** `src/pages/admin/AdminDashboard.jsx:46`
- **Popis:** `fmtCurrency()` vrací `"150 Kc"` místo `"150 Kč"`. Chybí háček. Zobrazuje se na dashboard summary kartách.
- **Oprava:** Změnit "Kc" na "Kč"
- **Opraveno:** [ ]

### 4. Widget texty bez diakritiky
- **Soubor:** `src/pages/widget-kalkulacka/components/GenerateButton.jsx:20,65`
- **Popis:** 'Spocitat cenu' a 'Pocitam...' — chybí háčky/čárky. Widget je veřejně embeddovaný.
- **Oprava:** Opravit na 'Spočítat cenu' a 'Počítám...'
- **Opraveno:** [ ]

### 5. Widget PrintConfiguration "Kc/g"
- **Soubor:** `src/pages/widget-kalkulacka/components/PrintConfiguration.jsx:416`
- **Popis:** Hardcoded "Kc/g" místo "Kč/g"
- **Oprava:** Změnit na "Kč/g"
- **Opraveno:** [ ]

### 6. OnboardingTour text bez diakritiky
- **Soubor:** `src/pages/test-kalkulacka/components/OnboardingTour.jsx:39`
- **Popis:** Celý onboarding text bez háčků/čárek, viditelný zákazníkovi
- **Oprava:** Přidat správnou diakritiku
- **Opraveno:** [ ]

### 7. Header navigace přes window.location.href
- **Soubor:** `src/components/ui/Header.jsx:229-231, :241-243`
- **Popis:** "Upload Model" button používá `window.location.href` místo `navigate()`, způsobuje full page reload
- **Oprava:** Změnit na `navigate('/test-kalkulacka')`
- **Opraveno:** [ ]

### 8. Admin sidebar footer — 3 linky vedou na /support
- **Soubor:** `src/pages/admin/AdminLayout.jsx:992-994`
- **Popis:** Docs, Support i Changelog všechny odkazují na `/support`. Changelog by měl vést jinam.
- **Oprava:** Odlišit URL pro Docs a Changelog (nebo je skrýt dokud nemají vlastní stránku)
- **Opraveno:** [ ]

### 9. Admin panel loading state bez spinneru
- **Soubor:** `src/pages/admin/AdminLayout.jsx:1082-1090`
- **Popis:** Při authLoading jen `<div>Loading...</div>` bez vizuální animace. Projekt má AdminPageSkeleton a ForgeSkeleton.
- **Oprava:** Použít AdminPageSkeleton nebo ForgeSkeleton
- **Opraveno:** [ ]

---

## Kategorie: P2 — Kosmetické / Nice-to-have

### 10. Slicer loading fallback inline v Routes.jsx
- **Soubor:** `src/Routes.jsx:93-101`
- **Popis:** Inline JSX objekt místo pojmenované komponenty, nekonzistentní s ostatními routes
- **Oprava:** Extrahovat do SlicerFallback komponenty
- **Opraveno:** [ ]

### 11. AdminOrders hardcoded české texty
- **Soubor:** `src/pages/admin/AdminOrders.jsx:175`
- **Popis:** ConfirmModal má 'Potvrdit' a 'Zrusit' bez diakritiky a bez i18n
- **Oprava:** Použít t() funkci
- **Opraveno:** [ ]

### 12. AdminTeamAccess ROLE_META bez diakritiky
- **Soubor:** `src/pages/admin/AdminTeamAccess.jsx:52-56`
- **Popis:** 'Vlastnik', 'Plny pristup' — viditelné role texty bez háčků
- **Oprava:** Přidat správnou diakritiku nebo i18n
- **Opraveno:** [ ]

---

## Statistika
- **P0:** 2 nálezy
- **P1:** 7 nálezů
- **P2:** 3 nálezy
- **Celkem:** 12 nálezů

## Další kroky
- [ ] Opravit P0 nálezy
- [ ] Opravit P1 nálezy
- [ ] 2. průzkum projektu (hlubší)
- [ ] 3. průzkum projektu (finální)
