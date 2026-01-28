# Browser Test: [NÁZEV TESTU]

**Datum vytvoření:** YYYY-MM-DD
**Testovaná změna:** [stručný popis změny která se testuje]
**Dotčené stránky:** [seznam URL oddělených čárkou]
**Dev URL:** http://localhost:4028
**Priorita testu:** [P0-Critical / P1-High / P2-Medium / P3-Low]

---

## INSTRUKCE PRO TESTOVÁNÍ

> **POZNÁMKA PRO CLAUDE BROWSER EXTENSION:**
> Tyto instrukce jsou určeny k provedení v prohlížeči. Proveď všechny kroky přesně jak jsou popsány.
> Na konci vytvoř závěrečný report podle šablony na konci dokumentu.
> Pokud narazíš na chybu, zapiš ji a pokračuj dle instrukcí u každého úkolu.

---

### KONTEXT TESTU

[2-3 věty vysvětlující co se testuje a proč je tento test důležitý]

---

### PŘÍPRAVA

1. Otevři prohlížeč Chrome
2. Ověř že dev server běží na http://localhost:4028
3. Přejdi na URL: [PŘESNÁ_URL]
4. Počkej až se stránka plně načte (zmizí všechny loading indikátory)
5. [Případné další přípravné kroky]

---

### TESTOVACÍ KROKY

#### Úkol 1: [Název úkolu]

**Cíl:** [Co má tento úkol ověřit]

**Předpoklady:**
- [Co musí platit před začátkem úkolu]

**Kroky:**
1. [Přesný popis akce - např. "Klikni na modré tlačítko 'Přidat' v pravém horním rohu sekce 'Slevy'"]
2. [Další krok s přesnými detaily]
3. [Další krok...]

**Očekávaný výsledek:**
- [Bod 1 - co se má stát]
- [Bod 2 - co se má zobrazit]

**Pokud selže:**
- [ ] Zapiš přesnou chybovou hlášku (pokud existuje)
- [ ] Zapiš stav UI v okamžiku selhání
- [ ] Zkontroluj DevTools Console (F12 → Console) a zapiš chyby
- [ ] **AKCE:** [Pokračuj na Úkol 2 / Přeskoč na Úkol X / UKONČI TEST]

---

#### Úkol 2: [Název úkolu]

**Cíl:** [Co má tento úkol ověřit]

**Předpoklady:**
- Úkol 1 byl úspěšný / Úkol 1 může být přeskočen

**Kroky:**
1. [Kroky...]

**Očekávaný výsledek:**
- [Výsledky...]

**Pokud selže:**
- [Instrukce...]

---

#### Úkol N: Závěrečná kontrola

**Cíl:** Ověřit stabilitu změn po refreshi

**Kroky:**
1. Stiskni F5 pro refresh stránky
2. Počkej až se stránka načte
3. Ověř že všechny změny provedené v předchozích úkolech jsou zachovány

**Očekávaný výsledek:**
- Všechna data přežila refresh
- Žádné vizuální glitche

**Pokud selže:**
- Toto je CRITICAL bug - data se neukládají správně
- Zapiš přesně co chybí/zmizelo

---

### SPECIÁLNÍ INSTRUKCE

#### Při práci s formuláři:
- Vždy vyplň PŘESNĚ hodnoty uvedené v instrukcích
- Po vyplnění pole počkej 0.5s před dalším krokem
- Ověř že se pole aktualizovalo (někdy je debounce)

#### Při práci s modály:
- Počkej na animaci otevření (cca 0.3s)
- Ověř že overlay (tmavé pozadí) je viditelné
- Kliknutí mimo modal ho může zavřít - dávej pozor

#### Při práci s drag & drop:
- Najdi "handle" ikonu (obvykle ⋮⋮)
- Pohyb musí být plynulý, ne skokový
- Po puštění počkej na přeskupení

---

### ZÁVĚREČNÝ REPORT

**Vyplň tento report na konci testu:**

```
======================================
BROWSER TEST REPORT
======================================

TEST: [Název testu]
DATUM PROVEDENÍ: [YYYY-MM-DD HH:MM]
PROVEDL: Claude Browser Extension

--------------------------------------
CELKOVÝ VÝSLEDEK: [PASSED / FAILED / PARTIAL]
--------------------------------------

ÚSPĚŠNÉ ÚKOLY:
- [ ] Úkol 1: [stručný popis]
- [ ] Úkol 2: [stručný popis]
- ...

NEÚSPĚŠNÉ ÚKOLY:
- [ ] Úkol X: [popis selhání]
  Chyba: [přesná chybová hláška]
  Stav UI: [co bylo vidět]
  Console: [chyby z DevTools]

--------------------------------------
NALEZENÉ CHYBY:
--------------------------------------

[číslo]. [SEVERITY: CRITICAL/HIGH/MEDIUM/LOW]
   Popis: [co nefunguje]
   Kde: [URL + element]
   Repro: [jak reprodukovat]
   Screenshot: [pokud je možné]

--------------------------------------
UI/UX POZNÁMKY (volitelné):
--------------------------------------
- [postřehy k designu, UX problémům]

--------------------------------------
DOPORUČENÍ:
--------------------------------------
- [co by se mělo opravit]
- [co by se mělo zlepšit]

======================================
```

---

### METADATA PRO AGENTA

```yaml
agent: mp-browser-test-planner
version: 1.0
created_from_change: [odkaz na změnu/commit]
related_files:
  - [soubor1.jsx]
  - [soubor2.js]
test_environment:
  url: http://localhost:4028
  browser: Chrome
  extension: Claude Browser Extension
```
