# 011-PE — OTAZKY A ODPOVEDI — Pricing-Engine — 2026-02-19

## Metadata
- **ID:** 011-PE
- **Session:** S03
- **Datum:** 2026-02-19
- **Oblast:** Pricing-Engine
- **Souvisejici ID:** 009-PE, 010-PE

---

## Kontext

Pricing Engine V3 roadmap — otazky o pojmech, scope, testech, currency, ulozisti.

---

## Otazky a odpovedi

### Q1: expressSurcharge
- **Kdo:** Uzivatel
- **Odpoved:** Priplatek za express, per-model, percent/fixed, krok 6 L677-711

### Q2: KD ukoly
- **Kdo:** Uzivatel
- **Odpoved:** KD-0 az KD-8, technicka vylepseni pod kapotou

### Q3: Scope auditu
- **Kdo:** Claude
- **Odpoved:** "Proverit vse v ramci pricing engine"
- **Rozhodnuti:** Kompletni audit vcetne propojeni

### Q4: Testy
- **Kdo:** Claude
- **Odpoved:** "Ano, vytvor testy"
- **Rozhodnuti:** 10-15 snapshot fixtures

### Q5: Co jsou testy
- **Kdo:** Uzivatel
- **Odpoved:** Automatizovane soubory, ne stranka. `npx vitest`

### Q6: Multi-currency
- **Kdo:** Uzivatel
- **Odpoved:** Var A ted, Var B do planu
- **Rozhodnuti:** Currency pole v configu, CZK default

### Q7: Objednavky
- **Kdo:** Uzivatel
- **Odpoved:** "Do Supabase, uz propojene"
- **Rozhodnuti:** Pricing snapshot do Supabase

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnuti |
|---|------|-----------|
| 1 | Scope | Kompletni audit + propojeni |
| 2 | Testy | Ano, 10-15 fixtures |
| 3 | Currency | Var A ted, Var B do planu |
| 4 | Objednavky | Supabase |

---

## Nerozhodnute

- [ ] Supabase schema pro snapshot
- [ ] ENGINE_VERSION
- [ ] Stav propojeni admin s kalkulackou
- [ ] Kam Var B v roadmape
