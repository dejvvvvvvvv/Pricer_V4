# Project Bug Scan #2C — Kalkulačky + Backend

**Datum:** 2026-03-18
**Průzkum:** 2. scan, Sekce C

---

## P0 nálezy

### P0-1. Widget: handleConfigChange nespouští auto-recalc
- **Soubor:** `src/pages/widget-kalkulacka/index.jsx:450-454`
- **Popis:** Po změně konfigurace (materiál, kvalita) se nespustí recalc — zůstane "pending" navždy
- **Dopad:** Uživatel musí ručně kliknout Vypočítat, test-kalkulačka to dělá automaticky
- **Oprava:** Portovat useDebouncedRecalculation z test-kalkulačky
- **Opraveno:** [ ]

### P0-2. Widget: hardcoded české texty bez i18n
- **Soubory:** index.jsx:145,176,191,772; PricingCalculator.jsx:56-58; FileUploadZone.jsx:161,174; ModelViewer.jsx:1015; PrintConfiguration.jsx:634,641
- **Popis:** ~15 hardcoded CZ textů bez diakritiky v embeddable widgetu
- **Oprava:** Přidat useLanguage + t() wrapping
- **Opraveno:** [ ]

### P0-3. Backend: /api/slice bez autentizace (optionalAuth)
- **Soubor:** `backend-local/src/index.js:209`
- **Popis:** CPU-heavy slicing endpoint přístupný bez přihlášení
- **Poznámka:** Může být záměrné pro demo/widget — vyžaduje rozhodnutí
- **Opraveno:** [ ]

---

## P1 nálezy

### P1-1. Test-kalkulačka: loadExpressConfigV1() bez tenantId
- **Soubor:** `src/pages/test-kalkulacka/index.jsx:196-215`
- **Opraveno:** [ ]

### P1-2. Backend: orderUpload stále 250MB (měl být snížen na 100MB)
- **Soubor:** `backend-local/src/storage/storageRouter.js:70-71`
- **Opraveno:** [ ]

### P1-3. Backend: /api/slice temp soubory nemazány při chybě
- **Soubor:** `backend-local/src/index.js` — slice handler
- **Opraveno:** [ ]

### P1-4. Widget: loadPresets useEffect prázdné deps
- **Soubor:** `src/pages/widget-kalkulacka/index.jsx:538-574`
- **Opraveno:** [ ]

### P1-5. Backend: slicingQueue.getQueueStats() bez tenant filtru
- **Soubor:** `backend-local/src/routes/slicer.js:134-145`
- **Opraveno:** [ ]

### P1-6. Backend: invoice totalPrice možný dvojnásobný fee
- **Soubor:** `backend-local/src/routes/invoices.js:170-175`
- **Opraveno:** [ ]

### P1-7. Widget: handleConfigChange UX problém (rozšíření P0-1)
- **Opraveno:** [ ]

### P1-8. Backend: PATCH /orders/:id vždy vrací 404
- **Soubor:** `backend-local/src/routes/orders.js:279-281`
- **Opraveno:** [ ]

### P1-9. Test-kalkulačka: analytics currency hardcoded CZK
- **Soubor:** `src/pages/test-kalkulacka/index.jsx:265,277`
- **Opraveno:** [ ]

---

## P2 nálezy

### P2-1. Widget BatchProgressBar bez i18n
### P2-2. Backend storageRouter temp dir hardcoded
### P2-3. Widget StyleableWrapper hardcoded barvy
### P2-4. Backend slicer profiles bez auth
### P2-5. Test-kalkulačka useCountUp stale deps
### P2-6. Backend invoices bez pattern validace orderId
### P2-7. Widget formatCzk "Kc" fallback

---

## Konzistence test-kalkulačka vs widget
| Feature | test-kalkulačka | widget |
|---------|----------------|--------|
| Auto-recalc | Ano | NE (P0) |
| i18n | Ano | Částečně (P0) |
| tenantId v storage | Implicitní | Explicitní |
| Undo/redo | Ano | Ne |
| Keyboard shortcuts | Ano | Ne |

## Statistika
- P0: 3 nálezy
- P1: 9 nálezů
- P2: 7 nálezů
