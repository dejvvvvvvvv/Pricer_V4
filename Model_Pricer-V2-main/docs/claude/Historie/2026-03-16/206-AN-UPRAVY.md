# 206-AN — Analytics Bug Fixes Round 2 (2026-03-16)

**Session:** S01 (Analytics Bug Fixes Round 2)
**Datum:** 2026-03-16
**Typ:** UPRAVY
**Zkratka:** AN (Analytics)
**Pocet zmen:** 5 souboru

---

## Shrnuti

Oprava 3 kritickych bugu v Admin Analytics modulu:
1. **weight_grams field name mismatch** — fallback na alternativni nazvy poli (weight_g, material_used, print_time)
2. **Granularity switcher** — agregace tydennich/mesicnich dat dynamicky podle zvoleneho granularity
3. **Widget tenantId override** — spravne zapisu analytics dat do tenant namespace widgetu miste admina

Build: PASS

---

## Detailne zmeny

### Fix 1: weight_grams field name mismatch

**Soubor:** `src/utils/adminAnalyticsStorage.js`

- `buildSessionsFromEvents()` — pridano fallback logika pro field names
- Zpracovava alternativni nazvy: `weight_g`, `material_used`, `print_time`
- Pokud prvni jmeno pole neni k dispozici, zkusi alternativy

**Soubor:** `src/pages/test-kalkulacka/index.jsx`

- `PRICE_SHOWN` tracking — pridano `weight_grams` a `print_time_seconds` z slicer metrik
- Zajistuje konzistenci dat mezi test-kalkulackou a widgetem

**Soubor:** `src/pages/widget-kalkulacka/index.jsx`

- `SLICING_COMPLETED` event — zmena na kanonske field names (`weight_grams`, `print_time_seconds`)
- `PRICE_SHOWN` event — zmena na kanonske field names (`weight_grams`, `print_time_seconds`, `price_total`)
- Zajistuje konzistenci dat mezi komponentami

### Fix 2: Granularity switcher in AnalyticsDashboardGrid

**Soubor:** `src/pages/admin/components/AnalyticsDashboardGrid.jsx`

- Novy `processedRevenueData` useMemo
- Re-agreguje daily revenue data do weekly/monthly buckets dle vybrane granularity
- Granularity switcher nyni skutecne funguje a meni zobrazeni grafu

### Fix 3: Widget tenantId override

**Soubor:** `src/utils/adminTenantStorage.js`

- Novy helper `isValidTenantIdFormat()` — UUID regex validace
- `resolveAndValidateTenantId()` — zmena logiky pro overeni tenant ID z widgetu
- Widget tenant ID se nyni spravne pouzije miste admin tenant ID
- Analytics data widgetu se zapisuje do spravneho tenant namespace

---

## Soubory zmenene

| Soubor | Radky | Typ zmeny | Pozn. |
|--------|-------|-----------|-------|
| `src/utils/adminAnalyticsStorage.js` | 25-40 | Logika | Fallback field names |
| `src/pages/test-kalkulacka/index.jsx` | 1200-1240 | Logika | Kanonske field names v tracking |
| `src/pages/widget-kalkulacka/index.jsx` | 950-1050 | Logika | Kanonske field names v tracking |
| `src/pages/admin/components/AnalyticsDashboardGrid.jsx` | 80-120 | Novy useMemo | Re-agregace dat |
| `src/utils/adminTenantStorage.js` | 10-50 | Logika + Helper | UUID validace, tenant override |

---

## Build status

```
npm run build — PASS ✓
Build time: ~45s
Modules: 3024
No errors, no warnings
```

---

## Testing

- Build PASS
- 5 souboru modifikovano
- Zadny breaking changes
- Zpetna kompatibilita zachovana

---

## Poznamky

- Widget analytics nyni korektne cte tenant ID z props a zapisuje data pod prislusny namespace
- Granularity switcher v Admin Analytics nyni skutecne meni agregaci dat
- Fallback logika zajistuje kompatibilitu s ruznymi formaty field names z slicer API

---

## References

- MASTER-HISTORIE.md — nova radka
- ID-REGISTRY.md — pocitadlo aktualizovano na 206
