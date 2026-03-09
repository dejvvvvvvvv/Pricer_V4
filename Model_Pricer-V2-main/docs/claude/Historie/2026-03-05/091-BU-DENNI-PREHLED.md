# 091-BU — Orders Page Bug Fixes — DENNÍ PŘEHLED

**Datum:** 2026-03-05 (Středa)
**Session:** S01
**Kategorie:** Bug fixes
**Status:** ✓ HOTOVO

---

## Shrnutí

Opraveny 3 bugy na Orders stránce v admin panelu:
1. Ceny jednotlivých modelů se nezobrazují (0.00 Kč)
2. Rozměry modelů ukazují "xx mm"
3. Tlačítko "Přidat poznámku" má špatné umístění (overlay s textarea)

**Počet změn:** 2 soubory, 3 kritické opravy
**Build:** ✓ PASS
**Dokumentace:** ✓ Aktualizována

---

## Klíčové Poznatky

- **File ID typ mismatch:** Number vs String → musela se konverze
- **Rozměry v modelInfo.sizeMm:** Nejsou v metrics, musí se kopírovat
- **Stará data:** Existující objednávky zůstávají nezměněny (nové objednávky OK)

---

## Co je Nové v Codebase

- CheckoutForm.jsx: String() konverze ID + dimensions_xyz do slicer_snapshot
- AdminOrders.jsx: Layout fix Interní poznámky (flex column + gap)
