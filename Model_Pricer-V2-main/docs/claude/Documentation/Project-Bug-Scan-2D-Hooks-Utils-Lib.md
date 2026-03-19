# Project Bug Scan #2D — Hooks, Utils, Lib, Kontexty

**Datum:** 2026-03-18
**Průzkum:** 2. scan, Sekce D

---

## P1 nálezy (8)

### W1. LanguageContext přímý localStorage bez try/catch
- **Soubor:** `src/contexts/LanguageContext.jsx:16`
- **Popis:** localStorage.getItem('language') bez try/catch — white screen v private mode
- **Opraveno:** [ ]

### W2. useThemeToggle/useAdminTheme přímý localStorage
- **Soubory:** `src/hooks/useThemeToggle.js:47`, `src/hooks/useAdminTheme.js:48`
- **Popis:** Přímý localStorage pro theme preference — porušuje invariant
- **Opraveno:** [ ]

### W3. useStorageQuery cache shared between tenants
- **Soubor:** `src/hooks/useStorageQuery.js:16`
- **Popis:** Module-level cache Map bez invalidace při tenant switch
- **Opraveno:** [ ]

### W4. useAdminShortcuts GO_TARGETS recreated
- **Soubor:** `src/hooks/useAdminShortcuts.js:27`
- **Popis:** Objekt recreated na každém renderu — měl by být module-level konstanta
- **Opraveno:** [ ]

### W5. formatters.js importuje round2 z adminOrdersStorage
- **Soubor:** `src/utils/formatters.js:8`
- **Popis:** Obecný util závisí na admin-specific storage modulu — inverted dependency
- **Opraveno:** [ ]

### W6. useOnboardingTour klíč není tenant-scoped
- **Soubor:** `src/hooks/useOnboardingTour.js:77`
- **Popis:** Sdílený klíč mezi tenanty na stejném zařízení
- **Opraveno:** [ ]

### W7. safeNum definována 5+ krát redundantně
- **Soubory:** pricingEngineV3.js, adminPricingStorage.js, couponValidator.js, shippingCalculator.js, formatters.js
- **Popis:** Mírně odlišné implementace v různých souborech
- **Opraveno:** [ ]

### W8. appendTenantLog spread pořadí — tenant_id bypass
- **Soubor:** `src/utils/adminTenantStorage.js:201`
- **Popis:** `...entry` spread může přepsat tenant_id — potenciální tenant isolation bypass
- **Opraveno:** [ ]

---

## P2 nálezy (11)

### S1. useCopyToClipboard deprecated execCommand fallback
### S2. useStorageMutation duplicitní logika mutate/mutateAsync
### S3. useUndoRedo JSON.stringify pro shallow compare
### S4. AppContext __APP_VERSION__ bez type deklarace
### S5. exportData.js downloadFile bez appendChild
### S6. useUrlState window.location v render fázi
### S7. usePricingHistory chybí default export
### S8. couponValidator max_uses=0 nejasná sémantika
### S9. NotificationContext value nememoizovaný
### S10. featureFlags loadFlags() voláno při každém getStorageMode
### S11. appendTenantLogAsync spread (viz W8)

---

## Statistika
- P0: 0
- P1: 8
- P2: 11
