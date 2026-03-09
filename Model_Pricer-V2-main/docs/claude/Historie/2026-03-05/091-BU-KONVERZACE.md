# 091-BU — Orders Page Bug Fixes — KONVERZACE

**ID:** 091-BU
**Datum:** 2026-03-05
**Session:** S01
**Typ:** KONVERZACE
**Pocet zprav:** 1 + N (uživatel popis + snímky, Claude řešení)

---

## Uživatelova Zpráva

> Máme 3 bugy na stránce Orders v admin panelu. Poslal jsem 3 snímky obrazovky.

### Bug Popis (uživatel)

1. **Ceny v modálním okně a detailu objednávky (0.00 Kč):**
   - V modálním okně (Items + Files tab) se neukazují jednotlivé ceny za modely
   - V přehledu detailu objednávky také všude 0.00 Kč
   - Celková cena se zobrazuje správně (to není bug)

2. **XYZ rozměry modelů (xx mm):**
   - Rozměry zobrazují `xx mm` místo skutečných hodnot
   - Měly by být např. `140 mm × 80 mm × 50 mm`

3. **Tlačítko „Přidat poznámku" špatné umístění:**
   - V sekci „Interní poznámky" je textarea + button
   - Button se překrývá s textareou (layout bug)

### Snímky
- 3 snímky doloženy (Price_Err.png, Internální_poznatky_Err.png, Orders_Status_Placement.png)

### Požadavek
- Opravit 3 bugy
- Použít agenty pro delegaci práce

---

## Claude Odpověď — Řešení

### Analýza (CP1)
- Bug 1: Pricing data flow — CheckoutForm neukazuje ceny, protože ID souboru se neconvertuje správně
- Bug 2: Rozměry — slicer_snapshot neukazuje dimensions_xyz (jsou jen v metricsz metriky)
- Bug 3: Layout — Interní poznámky textarea + button bez správného flexu

### Opravy (CP2)
- **Soubor 1:** `CheckoutForm.jsx` — řádky 268, 290-293
  - Řádek 268: `String(m.id) === String(f.id)` místo `m.id === f.id`
  - Řádky 290-293: Přidání dimensions_xyz do slicer_snapshot

- **Soubor 2:** `AdminOrders.jsx` — řádky 1070-1075
  - Layout Interní poznámky: flex column, gap: 8px, button alignSelf: flex-start

### Ověření (CP3)
- Build: PASS ✓
- Poznámka: Opravy se projeví jen u NOVÝCH objednávek (existující mají uložená data s 0/null)

---

## Klíčové Poznatky

1. **File ID typ mismatch:** File ID je `number` (Date.now() + Math.random()), pricing engine ho konvertuje na `string`. Strict equality === vždy selhala.

2. **Rozměry v modelInfo.sizeMm:** Nejsou v metrics (které jdou do slicer_snapshot), ale v file.result?.modelInfo. Musí se ručně kopírovat.

3. **Existující data:** Už vytvořené objednávky mají uložené staré hodnoty (0/null) — budou se zobrazovat správně jen pro nové objednávky.

---

## Rozhodnutí

- Všechny 3 bugy opraveny
- Build prošel bez chyb
- Dokumentace aktualizována (viz UPRAVY.md)
