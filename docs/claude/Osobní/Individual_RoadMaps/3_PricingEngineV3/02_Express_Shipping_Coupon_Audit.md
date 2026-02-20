# Faze 1 — Audit Express / Shipping / Coupon

> **Zdroj:** Extrahovano z `3_PricingEngineV3_RoadMap_Plan.md` Faze 1 (Ukoly 1.1-1.4)
> **Ucel:** Checklist pro overeni ze express, shipping a coupon pocitaji spravne
> **Odhad:** 2-4 hodiny
> **Zavislosti:** ZADNE (muze byt prvni krok)

---

## Ukol 1.1: Audit pipeline umisteni

**Soubor:** `src/lib/pricing/pricingEngineV3.js`

**Skutecne umisteni (overeno oproti kodu):**
- Express surcharge: **Krok 6, radky 677-711** (po per-model round, pred couponem)
- Coupon discount: **Krok 7, radky 714-764** (po expressu, pred volume discounty)
- Shipping cost: **Krok 14, radky 1103-1151** (posledni krok pred grand total)

**Spravne poradi:**
```
... -> per-model round -> EXPRESS -> COUPON -> VOLUME -> ORDER fees -> ... -> SHIPPING -> grand total
```

**Checklist:**
- [ ] Overit ze `expressConfig` a `selectedExpressTierId` se spravne predavaji do pipeline
- [ ] Overit ze `couponsConfig` a `appliedCouponCode` se spravne predavaji
- [ ] Overit ze `shippingConfig` a `selectedShippingMethodId` se spravne predavaji
- [ ] Overit ze kdyz jsou vsechny tri `null/undefined/disabled`, pipeline funguje beze zmeny

---

## Ukol 1.2: Test Express Surcharge

**Kde v kodu:** Radky 677-711 (inline loop pres `modelResults`)

**Jak funguje:**
- Typ `percent`: kazdy model total * (surcharge_value / 100) = priplatek
- Typ `fixed`: kazdy model dostane +fixed castka
- Modifikuje `modelTotalsById` **in-place**

**Testovaci scenare:**
| # | Scenar | Vstup | Ocekavany vysledek |
|---|--------|-------|-------------------|
| E1 | Zadny express | `selectedExpressTierId = null` | Zadna zmena |
| E2 | Express disabled | `expressConfig.enabled = false` | Zadna zmena |
| E3 | Express 20% | 1 model 500 Kc, tier 20% | 600 Kc (model total) |
| E4 | Express fixed 150 | 1 model 500 Kc, tier fixed 150 | 650 Kc (model total) |
| E5 | Express 20%, 3 modely | 3 modely po 500 Kc, tier 20% | kazdy 600 Kc, expressSurchargeTotal = 300 Kc |
| E6 | Neexistujici tier ID | `selectedExpressTierId = "xxx"` | Zadna zmena (graceful) |

**Overovaci checklist:**
- [ ] E1-E6 otestovany
- [ ] Express surcharge se objevuje v breakdown
- [ ] `expressSurchargeTotal` je spravne v navratovem objektu
- [ ] In-place modifikace `modelTotalsById` funguje (downstream ORDER fees vidi novou cenu)

---

## Ukol 1.3: Test Shipping Cost

**Kde v kodu:** Radky 1103-1151 (inline, posledni krok)

**Jak funguje:**
- Hleda `selectedShippingMethodId` v `shippingConfig.methods`
- Bere `price` z nalezene metody
- Kontroluje free shipping: `free_shipping_enabled && total >= free_shipping_threshold`
- Pokud free shipping splnena → shippingCost = 0

**Testovaci scenare:**
| # | Scenar | Vstup | Ocekavany vysledek |
|---|--------|-------|-------------------|
| S1 | Zadny shipping | `selectedShippingMethodId = null` | shippingCost = 0 |
| S2 | Shipping disabled | `shippingConfig.enabled = false` | shippingCost = 0 |
| S3 | Fixni 89 Kc | Objednavka 200 Kc, metoda 89 Kc | total 200 + 89 = 289 Kc |
| S4 | Free threshold splnen | Objednavka 600 Kc, threshold 500 Kc | shippingCost = 0, total = 600 Kc |
| S5 | Free threshold nesplnen | Objednavka 400 Kc, threshold 500 Kc, metoda 89 Kc | total = 489 Kc |
| S6 | Neexistujici metoda ID | `selectedShippingMethodId = "xxx"` | shippingCost = 0 (graceful) |

**Overovaci checklist:**
- [ ] S1-S6 otestovany
- [ ] Shipping se pridava AZ PO final rounding (total je uz zaokrouhleny)
- [ ] `shippingCost` je v navratovem objektu
- [ ] `grandTotal = total + shippingCost` (radek 1153)

---

## Ukol 1.4: Test Coupon Discount

**Kde v kodu:** Radky 714-764 (inline)

**Jak funguje:**
- Hleda `appliedCouponCode` v `couponsConfig.coupons`
- Kontroluje: `active`, `expires_at`, `starts_at`, `max_uses` (POZOR: `new Date()` = nedeterministicke!)
- Typy:
  - `percent`: procentualni sleva z celkove ceny modelu (proporcionalne rozdelena)
  - `fixed`: fixni castka odectena (proporcionalne rozdelena pres modely)
  - `free_shipping`: nastavi flag pro shipping krok
- Modifikuje `modelTotalsById` **in-place** (proporcionalni distribuce slevy)

**Testovaci scenare:**
| # | Scenar | Vstup | Ocekavany vysledek |
|---|--------|-------|-------------------|
| C1 | Zadny kupon | `appliedCouponCode = null` | Zadna zmena |
| C2 | Coupons disabled | `couponsConfig.enabled = false` | Zadna zmena |
| C3 | Percent -10% | Objednavka 500 Kc, kupon 10% | Sleva 50 Kc, total pred volume = 450 Kc |
| C4 | Fixed -50 Kc | Objednavka 500 Kc, kupon 50 Kc | Sleva 50 Kc, total pred volume = 450 Kc |
| C5 | Fixed > total | Objednavka 100 Kc, kupon 200 Kc | Total = 0 (ne zaporna) |
| C6 | Free shipping kupon | Objednavka 500 Kc + shipping 89 Kc | shippingCost = 0 |
| C7 | Expirovan kupon | `expires_at` v minulosti | Zadna zmena |
| C8 | Neexistujici kod | `appliedCouponCode = "FAKE"` | Zadna zmena |
| C9 | Max discount limit | `settings.max_discount_percent = 15`, kupon 50% | Sleva max 15% |

**Overovaci checklist:**
- [ ] C1-C9 otestovany
- [ ] Kupon se aplikuje PRED volume discounty (krok 7 pred krokem 8)
- [ ] Kupon se aplikuje PO expressu (krok 7 po kroku 6)
- [ ] Proporcionalni distribuce pres modely je spravna
- [ ] `couponDiscount` je v navratovem objektu
- [ ] Breakdown obsahuje coupon polozku

---

## Postup prace

1. Vytvorit testovaci fixture data (JSON) pro kazdou skupinu (E, S, C)
2. Spustit `calculateOrderQuote` s kazdym scenarem
3. Porovnat vysledky s ocekavanim
4. Zaznamenat nalezene chyby
5. Opravit chyby (pokud nejake)
6. Aktualizovat dokumentaci
