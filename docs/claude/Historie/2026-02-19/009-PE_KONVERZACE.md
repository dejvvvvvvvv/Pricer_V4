# 009-PE — KONVERZACE — Pricing-Engine — 2026-02-19

## Metadata
- **ID:** 009-PE
- **Session:** S03
- **Datum:** 2026-02-19
- **Oblast:** Pricing-Engine
- **Souvisejici ID:** 010-PE, 011-PE

---

## Tema session

Diskuze nad Pricing Engine V3 roadmap planem (Vrstva 0) — analyza hotoveho (88%) a chybejiciho, vysvetleni expressSurcharge a KD ukolu, rozdeleni roadmapu do 8 podslouboru, rozhodnuti o scope/testech/currency/Supabase.

---

## Prubeh konverzace

### [1] Uzivatel
> Zamerime se na vrstvu 0 (MASTER_Implementacni_Poradi) a pricing engine roadmap. Co je hotove, co chybi? Co je expressSurcharge? Vytvor soubor s tim co ode me potrebujes. Rozdel hlavni roadmap na podsoubory pro snazsi praci pri implementaci.

### [1] Claude
**Shrnuti:** Precetl oba soubory + engine. Analyza 88% hotovo. expressSurcharge = priplatek za express (percent/fixed, per-model, krok 6). Vytvoril CO_POTREBUJI_OD_UZIVATELE.md + 8 podslouboru.

### [2] Uzivatel
> 1. Co jsou KD ukoly? 2. Admin stranky existuji ale nefunguji plne 3. Multi-currency slozitost? 4. Objednavky v Model Storage 5. Co jsou testy — stranka?

### [2] Claude
**Shrnuti:** KD = Kriticke Doplnky (technicka vylepseni). Overil AdminExpress/Shipping/Coupons existuji. Multi-currency Var A (1-2h) vs Var B (6-10h). Testy = automatizovane soubory, ne stranka.

### [3] Uzivatel (odpovedi)
> Scope: proverit vse v pricing engine. Testy: ano. Objednavky do Supabase. Currency Var A + Var B do planu. Uloz historii.

---

## Rozhodnuti

| # | Rozhodnuti | Kdo |
|---|-----------|-----|
| 1 | Kompletni audit (engine + propojeni s admin configy) | Uzivatel |
| 2 | Testy ANO (10-15 snapshot fixtures) | Uzivatel |
| 3 | Multi-currency Var A ted, Var B do roadmapy | Uzivatel |
| 4 | Objednavky do Supabase (ne localStorage) | Uzivatel |
| 5 | 8 podslouboru roadmapu pro implementaci | Spolecne |

---

## Otevrene otazky

- [ ] Propojeni admin Express/Shipping/Coupons s kalkulackou — overit
- [ ] Supabase schema pro pricing snapshot
- [ ] ENGINE_VERSION cislo
- [ ] Kam zapsat multi-currency Var B

---

## Navaznost
- **Predchozi:** 007-GN, 008-GN (S03)
- **Nasledujici:** zatim zadny
