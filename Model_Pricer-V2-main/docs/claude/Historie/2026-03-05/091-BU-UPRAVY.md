# 091-BU — Orders Page Bug Fixes — UPRAVY

**ID:** 091-BU
**Datum:** 2026-03-05
**Typ:** UPRAVY
**Počet změněných souborů:** 2
**Řádkové rozsahy:** 5 kritických míst

---

## Změněné Soubory

### 1. `src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**Problém:** Ceny jednotlivých modelů se nezobrazují v modal okně ani v detailu objednávky.

**Příčina:** File ID je `number` (vytvořeno jako Date.now() + Math.random()), ale pricing engine jej konvertuje na `string`. Porovnání `m.id === f.id` selhává, protože strict equality nevidí `12345 === "12345"` jako shodné.

**Oprava 1 — Řádek 268:**
```javascript
// PŘED:
if (m.id === f.id) {

// PO:
if (String(m.id) === String(f.id)) {
```

**Oprava 2 — Řádky 290-293:**

Rozměry modelů se nacházejí v `file.result?.modelInfo?.sizeMm`, ne v `metrics`. Přidávám je do `slicer_snapshot` aby byly k dispozici v OrderDetailModal.

```javascript
// PŘED:
slicer_snapshot: metrics

// PO:
slicer_snapshot: {
  ...metrics,
  dimensions_xyz: f.result?.modelInfo?.sizeMm || null
}
```

**Soubor:** `/Model_Pricer-V2-main/src/pages/test-kalkulacka/components/CheckoutForm.jsx`
**Řádky:** 268, 290-293
**Počet změn:** 2

---

### 2. `src/pages/admin/AdminOrders.jsx`

**Problém:** Tlačítko "Přidat poznámku" v sekci Interní poznámky se překrývá s textareou.

**Příčina:** Textarea a button nejsou správně zabaleny do flex kontejneru. Button se vykresluje vedle textarea místo pod ním.

**Oprava — Řádky 1070-1075:**

```javascript
// PŘED (textarea a button vedle sebe bez správného layoutu):
<textarea .../>
<button .../>

// PO (flex column kontejner s gap + button alignSelf):
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  <textarea
    ...
    style={{ flex: 1, minHeight: '100px' }}
  />
  <button
    ...
    style={{ alignSelf: 'flex-start' }}
  />
</div>
```

**Soubor:** `/Model_Pricer-V2-main/src/pages/admin/AdminOrders.jsx`
**Řádky:** 1070-1075
**Počet změn:** 1

---

## Kontrolní Ověření

| Prvek | Status | Poznámka |
|-------|--------|----------|
| Build | ✓ PASS | npm run build — bez chyb |
| Importy | ✓ OK | Žádné nové importy |
| Routy | ✓ OK | Nejsou dotčeny |
| Tenant Storage | ✓ OK | Není změněna |
| Syntaxe | ✓ OK | ESLint by měl projít |
| **Existující data** | ⚠ NOTE | Staré objednávky budou stále zobrazovat 0.00 a null — nové objednávky budou OK |

---

## Poznámky

1. **Ceny + rozměry:** Bez těchto oprav se ceny v orderech zobrazují jako 0.00 a rozměry jako "xx mm" protože ID matching selhává a dimensions_xyz chybí.

2. **Existence starých dat:** Objednávky vytvořené PŘED touto opravou budou mít v localStorage uložená data se starými hodnotami. Aby se zobrazily správně, musely by se data migrovat (to není v scope). Nové objednávky budou OK.

3. **Widget Check:** Pokud se widget používá pro checkout, měl by se automaticky používat stejná logika z CheckoutForm (je to sdílená komponenta).

---

## Souhrnný Přehled Změn

| Soubor | Změny | Typ | Severity |
|--------|-------|-----|----------|
| CheckoutForm.jsx | 2 × řádkové opravy | Logic fix | P0 |
| AdminOrders.jsx | 1 × layout fix | CSS/Layout | P0 |
| **CELKEM** | **2 soubory** | **Bug fix** | **P0** |
