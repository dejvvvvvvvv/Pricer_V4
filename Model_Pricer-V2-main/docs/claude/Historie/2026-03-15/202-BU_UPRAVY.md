# UPRAVY — Bug analyza a opravy po Supabase Auth migraci

---

## Hlavicka

**ID:** 202-BU
**Datum:** 2026-03-15
**Oblast:** Bug fixes (Calculator + Orders + Backend)
**Titulek:** 5 bugu nalezeno (3x P0, 2x P1), 1 opraven, 4 cekaji na implementaci

---

## Popis

Analyza a oprava bugu ktere se projevily po Supabase Auth migraci. Hlavni root cause: response envelope mismatch v slicerApi.js (backend vraci `{ ok, data }` wrapper, frontend ocekava flat strukturu). Dalsi bugy: hooks poradi v AdminOrderDetail, chybejici auth bypass pro verejnou kalkulacku, chybejici rendering billing dat, neuplny totals_snapshot.

---

## Soubory a zmeny

### 1. `src/pages/admin/AdminOrderDetail.jsx` — OPRAVENO

**Typ:** Zmeneno
**Popis:**
- BUG 1 [P0] FIXED: `filteredNotes` useMemo hook byl volany PO early return `if (!order) return`
- Presunut PRED early return s optional chaining `order?.notes`
- React Rules of Hooks — hooks nesmi byt volany podmínene

**Duvod:** Crash "Rendered more hooks than during the previous render" pri nacitani stranky.

---

### 2. `src/services/slicerApi.js` — CEKA NA OPRAVU

**Typ:** Bude zmeneno
**Planovana zmena:** `return json;` → `return json?.data ?? json;`
**Popis:**
- BUG 2 [P0]: Backend vraci `{ ok: true, data: { metrics, modelInfo } }`
- Frontend (12+ souboru) cte `file.result.metrics` — ocekava flat bez `data` wrapperu
- Ovlivnene soubory: pricingEngineV3.js, SortableFileList, CheckoutForm, ModelViewer, atd.

**Duvod:** Kalkulacka ukazuje 0 Kc — pricing engine dostava `undefined` metriky.

---

### 3. `backend-local/src/routes/slicer.js` — CEKA NA OPRAVU

**Typ:** Bude zmeneno
**Planovana zmena:** `requireAuth` → `optionalAuth` na `/api/slice` endpoint
**Popis:**
- BUG 3 [P0]: Test-kalkulacka je verejna stranka bez auth kontextu
- `/api/slice` vyzaduje `requireAuth` middleware — verejne pozadavky failuji

**Duvod:** Neautentifikovany uzivatele nemohou pouzivat kalkulacku.

---

### 4. `src/pages/admin/AdminOrderDetail.jsx` — CEKA NA OPRAVU

**Typ:** Bude zmeneno (pridani rendering sekce)
**Popis:**
- BUG 4 [P1]: Data billing_address, company_info, is_company_purchase JSOU v order objektu
- AdminOrderDetail nema rendering kod pro tyto fieldy
- Planovano: Pridat rendering sekce za existujici shipping_address blok

**Duvod:** Fakturacni a firemni data se nezobrazuji v admin objednavce.

---

### 5. `src/pages/test-kalkulacka/components/CheckoutForm.jsx` — CEKA NA OPRAVU

**Typ:** Bude zmeneno (rozsireni totals_snapshot)
**Popis:**
- BUG 5 [P1]: CheckoutForm uklada do objednavky jen `total` (bez shipping)
- Chybi: shipping_total, min_order_delta, rounding_delta
- Planovano: Rozsirit totals_snapshot o vsechny fieldy z quote objektu

**Duvod:** Objednavky nemaji kompletni cenova data.

---

## Shrnuty seznam

- [x] AdminOrderDetail.jsx — hooks order fix (BUG 1 P0 DONE)
- [ ] slicerApi.js — response envelope unwrap (BUG 2 P0)
- [ ] backend slicer.js — requireAuth → optionalAuth (BUG 3 P0)
- [ ] AdminOrderDetail.jsx — billing/company rendering (BUG 4 P1)
- [ ] CheckoutForm.jsx — totals_snapshot rozsireni (BUG 5 P1)

---

## Poznamky

- BUG 2 je root cause pro vice symptomu (0 Kc ceny, chybejici rozmery, prazdne model info)
- Oprava BUG 2 v slicerApi.js je preferovana pred opravou 12+ consumer souboru (single point of change)
- BUG 3 souvisi s Supabase Auth migraci — endpoint byl zabezpecen requireAuth ale verejna kalkulacka nema auth token
- Stare objednavky (pred opravou BUG 5) zustanou s neuplnym totals_snapshot — retroaktivni oprava neni planovana
- Souvisejici ID: 200-PF (createPortal opravy ze stejneho dne), 091-BU (predchozi orders bug fixy)
