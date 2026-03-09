# 091-BU — Orders Page Bug Fixes — OTAZKY

**ID:** 091-BU
**Datum:** 2026-03-05
**Typ:** OTAZKY
**Počet Q&A:** 3 + závěr

---

## Q1: Ověření Priorit

**Otázka:**
> Měl bych řešit všechny 3 bugy v jedné session nebo postupně?

**Odpověď:**
Všechny 3 bugy se řeší v jedné session — jsou malé a nezávislé. Mohou se delegovat paralelně (Bug 1+2 → frontend agent, Bug 3 → admin agent).

---

## Q2: Ověření Datového Modelu

**Otázka:**
> Jak se ceny ukládají do localStorage? Jsou v slicer_snapshot nebo jinde?

**Odpověď:**
Ceny jsou počítány **dynamicky** z pricingEngineV3.js na základě:
- Materiálu (ABS, PLA, PETG)
- Kvality (Draft, Standard, Premium)
- Rozměrů a hmotnosti

Ale **ID matching selhává**, protože:
- `file.id` je `number` (Date.now())
- `modelPricing.id` je `string` (konvertovaný v pricing enginu)
- Když se porovnávají `12345 === "12345"`, resultat je `false`

Řešení: Konvertovat oba na string: `String(m.id) === String(f.id)`.

Rozměry jsou uloženy v `file.result?.modelInfo?.sizeMm` — musí se přidat do `slicer_snapshot` aby byly v OrderDetailModal dostupné.

---

## Q3: Ověření Scope Opravy

**Otázka:**
> Bude tato oprava ovlivňovat existující objednávky nebo jen nové?

**Odpověď:**
Jen **nové objednávky** budou mít správné ceny a rozměry. Staré objednávky mají uložená data s 0.00 a null — ta se budou zobrazovat stejně.

Důvod: Objednávky se ukládají s finálními hodnotami do adminOrdersStorage.js v čase vytvoření. Pozdější oprava v CheckoutForm je nezmění.

**Migrování starých dat** není v scope — to by vyžadovalo AdminMigration komponentu.

---

## Závěr — Rozhodnutí

✓ Všechny 3 bugy jsou opraveny v miniálním scope (2 soubory, 5 řádkových změn)
✓ Build: PASS
✓ Existující data: Nezměněna (staré objednávky zůstávají stejné)
✓ Nové objednávky: Budou mít správné ceny a rozměry
