# SABLONA: UPRAVY

> Pouziti: Dokumentace technickych zmen v souborech.
> Uroven detailu: STREDNI + radkove rozsahy.
> Fragmenty kodu JEN pro velmi dulezite zmeny (architekturni, breaking changes).
> Tato sablona definuje PRESNY format — agent ji MUSI dodrzet.

---

<!--
NAZEV SOUBORU: {NNN}-{ZK}_UPRAVY.md
PRIKLAD: 001-TK_UPRAVY.md
UMISTENI: docs/claude/Historie/{YYYY-MM-DD}/
-->

# {NNN}-{ZK} — UPRAVY — {Oblast} — {YYYY-MM-DD}

## Metadata
- **ID:** {NNN}-{ZK}
- **Session:** S{NN}
- **Datum:** {YYYY-MM-DD}
- **Oblast:** {Nazev oblasti}
- **Souvisejici ID:** {ID1, ID2, ...} nebo zadne
- **Trigger:** {Co vyvolalo tyto zmeny — uzivatelsky pozadavek, bug fix, plan, atd.}

---

## Souhrn uprav

{1-3 vety co se celkove upravovalo a proc. Co byl cil techto zmen.}

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | {cesta/k/souboru.jsx} | Pridano | {42-67} | {Strucny popis zmeny} |
| 2 | {cesta/k/dalsiho.js} | Zmeneno | {120-135} | {Strucny popis} |
| 3 | {cesta/k/tretiho.css} | Odebrano | {88-92} | {Co bylo odebrano} |

---

## Detailni zmeny

### 1. `{cesta/k/souboru.jsx}`

**Typ:** {Pridano | Odebrano | Zmeneno | Refaktor | Novy soubor}
**Radky:** {od-do}
**Duvod:** {Proc se tato zmena delala}

**Co se zmenilo:**
- {Popis zmeny 1 — co pridano/odebrano/zmeneno}
- {Popis zmeny 2}
- {Pred: strucne jak to bylo pred zmenou}
- {Po: strucne jak to je po zmene}

<!-- FRAGMENT KODU — jen pro velmi dulezite zmeny (architektura, breaking, klicova logika): -->
<!--
```jsx
// PRED:
{stary kod — max 10 radku}

// PO:
{novy kod — max 10 radku}
```
-->

---

### 2. `{cesta/k/dalsiho.js}`

**Typ:** {...}
**Radky:** {...}
**Duvod:** {...}

**Co se zmenilo:**
- {...}

---

<!-- Opakovat sekci pro kazdy upraveny soubor -->

---

## Dopad zmen

- **Ovlivnene komponenty:** {Seznam komponent ktere mohou byt ovlivneny touto zmenou}
- **Breaking changes:** {Ano/Ne — pokud ano, popsat}
- **Nove zavislosti:** {Pokud byly pridany npm balicky nebo importy}
- **Rizika:** {Potencialni rizika — napr. "muze ovlivnit widget rendering"}

---

## Testovani

- **Build:** {npm run build — PASS/FAIL}
- **Manual test:** {Co bylo rucne otestovano}
- **Poznamky:** {Dalsi poznamky k testovani}

---

<!-- KONEC SABLONY -->
