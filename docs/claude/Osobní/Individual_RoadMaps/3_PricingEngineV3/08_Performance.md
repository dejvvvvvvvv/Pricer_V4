# KD-5 — Performance a Caching

> **Zdroj:** Extrahovano z `3_PricingEngineV3_RoadMap_Plan.md` sekce KD-5
> **Ucel:** Optimalizace rychlosti pricing enginu pro velke objednavky
> **Odhad:** 1-4 hodiny
> **Zavislosti:** ZADNE
> **Priorita:** NIZKA — implementovat az pri meritelnem problemu

---

## Soucasny stav

- Zadna cache ani memoizace NEEXISTUJE
- Casova slozitost: `O(M * F)` kde M = modely, F = fees
- Pro typicke pouziti (5-20 modelu, 10-30 fees) je to **zanedbatelne**
- Pipeline bezi synchronne

---

## Strategie (serazeno dle priority)

### KD-5.1: Input hash (STREDNI priorita, 1h)

**Princip:** Pred kazdym volanim spocitat hash vstupu. Pokud se nezmenil → vrat predchozi vysledek.

**Kde implementovat:** V kalkulacce (PricingCalculator.jsx), NE v enginu!

```javascript
const inputHash = JSON.stringify({uploadedFiles, printConfigs, pricingConfig, ...});
if (inputHash === lastInputHash) return lastResult;
lastInputHash = inputHash;
lastResult = calculateOrderQuote({...});
return lastResult;
```

**Vyhoda:** Nulovy cost kdyz se nic nezmenilo (scrollovani, resize okna)
**Nevyhoda:** JSON.stringify muze byt pomalejsi nez samotny vypocet pro velke vstupy

### KD-5.2: Per-model incremental recalc (NIZKA, slozite)

Prepocitat pouze zmeneny model + ORDER kroky. Vyzaduje refactoring pipeline na 2 faze.
**Doporuceni:** Neimplementovat pokud neni jasny problem.

### KD-5.3: Web Worker offload (NIZKA, breaking change)

Presunout do Web Workeru. Asynchronni API = breaking change pro vsechny konzumenty.
**Doporuceni:** Pouze pokud UI lag > 50ms.

---

## Akce

- [ ] Pridat benchmark: zmerit `calculateOrderQuote` pro 100 modelu s 50 fees
- [ ] Pokud < 50ms → ZADNA akce (dostatecna rychlost)
- [ ] Pokud > 50ms → implementovat KD-5.1 (input hash)
- [ ] KD-5.2 a KD-5.3 odlozit na meritelny problem
