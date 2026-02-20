# Faze 3 + KD-4 — Edge Cases a Rounding

> **Zdroj:** Extrahovano z `3_PricingEngineV3_RoadMap_Plan.md` Faze 3 + KD-4
> **Ucel:** Robustnost enginu, edge case handling, rounding invarianty
> **Odhad:** 4-5 hodin (Faze 3: 2-3h + KD-4: 2h)
> **Zavislosti:** ZADNE

---

## Edge Cases (Faze 3, Ukol 3.1)

### Checklist edge case scenaru:

| # | Scenar | Ocekavane chovani | Stav |
|---|--------|------------------|------|
| EC1 | Zadny material, zadny cas | Cena = 0 (ne NaN, ne error) | [ ] |
| EC2 | Vsechny fees disabled | Cena = base price only | [ ] |
| EC3 | Volume discount vynuluje cenu | Minimalni cena se aplikuje | [ ] |
| EC4 | Express + coupon kombinace | Express zvysi, pak coupon snizi — spravne poradi | [ ] |
| EC5 | Zaokrouhleni s kupony | Zadne floating point chyby (0.1 + 0.2 != 0.3) | [ ] |
| EC6 | Prazdny order (0 modelu) | Graceful return s total = 0 | [ ] |
| EC7 | Model s quantity = 0 | Preskocit nebo cena = 0 | [ ] |
| EC8 | Vsechny ceny na 0 | Total = 0, zadny NaN | [ ] |
| EC9 | Extrene velky order (1000 modelu) | Nevypada z pameti, vrati vysledek | [ ] |
| EC10 | Fee s `value: "abc"` (neciselna) | `safeNum` vrati 0, nezpadne | [ ] |
| EC11 | Coupon + express + volume + shipping naraz | Vsechno dohromady funguje | [ ] |
| EC12 | Stejny coupon aplikovany 2x | Jen jednou se aplikuje | [ ] |

---

## Debug mode (Faze 3, Ukol 3.2)

### Co implementovat:
- [ ] Volitelny `debug: true` parametr v `calculateOrderQuote`
- [ ] Kdyz `debug = true`, pridej do vystupu pole `debugLog: Array<string>`
- [ ] Kazdy krok pipeline zapise do debugLog co udelal:
  ```
  "[Step 1] Base price: material=120.50, time=85.30, total=205.80"
  "[Step 3a] Fee 'setup-fee' applied: +50.00 (fixed, MODEL scope)"
  "[Step 6] Express 'express-24h' applied: +41.16 per model (20%)"
  "[Step 7] Coupon 'SLEVA10' applied: -24.70 (-10%)"
  ...
  ```
- [ ] Admin preview sandbox muze zapnout debug mode pro detailni breakdown

---

## Rounding Invarianty (KD-4)

### Kde se zaokrouhluje:

| Misto | Podminka | Co se zaokrouhluje |
|-------|----------|-------------------|
| Per-model (krok 5, L632) | `rounding.enabled && !smart_rounding_enabled` | Kazdy model zvlast |
| Final (krok 12, L1091) | `rounding.enabled` (vzdy) | Celkovy total pred shippingem |
| **NIKDY** | — | Mezikroky (fees, express, coupon, volume, ORDER fees, markup) |
| **NIKDY** | — | Shipping (pridava se k uz zaokrouhlenemu) |

### Invariant:
```
Vsechny mezivypocty probiha v plne presnosti (floating point).
Zaokrouhleni se aplikuje POUZE:
  1. Na per-model urovni (pokud smart_rounding NENI zapnuto)
  2. Na finalnim totalu (vzdy pokud rounding je enabled)
Shipping se NEPODLEHA zaokrouhleni.
```

### Problem: Breakdown konzistence

Kdyz `smart_rounding_enabled = false`:
```
round(model_1) + round(model_2) + round(model_3) != round(model_1 + model_2 + model_3)
```

Napr.: 3 modely po 33.33 Kc, rounding step 1:
- Per-model: round(33.33) * 3 = 33 * 3 = 99 Kc
- Total: round(33.33 * 3) = round(99.99) = 100 Kc
- **Rozdil: 1 Kc** — soucet polozek nesedi s celkem!

### Navrhovana reseni:

**Moznost A (minimalni):** Pridat `rounding_difference` pole do vystupu
- UI zobrazi: "Zaokrouhlovaci rozdil: +1 Kc"
- Implementace: 15 minut

**Moznost B (presnejsi):** Largest Remainder metoda
- Distribuovat zaokrouhlovaci chybu pres modely
- Napr.: 2 modely dostanou 33, 1 model dostane 34 → soucet = 100
- Implementace: 1-2 hodiny
- Slozitejsi, ale soucet vzdy sedi

**Moznost C (smart rounding — uz existuje):**
- `smart_rounding_enabled = true` → per-model se NEzaokrouhluje, jen final
- Soucet per-model = total (pred zaokrouhlenim)
- **Doporuceni:** Defaultne zapnout smart_rounding pro nove tenanty

### Akce:
- [ ] Dokumentovat invariant v kodu (komentare u kroku 5 a 12)
- [ ] Pridat `rounding_difference` pole do vystupu (Moznost A — minimum)
- [ ] Zvazit Moznost B pro budoucnost
- [ ] Pridat test case: 3 modely po 33.33, step 1 → overit chovani
