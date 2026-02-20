# Pricing Engine V3 — Co potrebuji od uzivatele

> **Ucel:** Seznam rozhodnuti a informaci ktere potrebuji od uzivatele pred zahajenim implementace.
> **Stav:** CASTECNE ZODPOVEZENO (2026-02-19, S03)

---

## 1. Prioritizace — co je must-have pred launchem?

Roadmap obsahuje 8 KD (kriticke doplnky) + 3 faze. Potrebuji vedet ktere jsou **must-have pred betou** a ktere muzou pockat.

**Otazka:** Oznac co je must-have (M), nice-to-have (N), a odlozit (O):

| # | Ukol | Muj navrh | Tvoje rozhodnuti |
|---|------|-----------|-----------------|
| Faze 1 | Audit express/shipping/coupon | M | **M** (potvrzeno — "proverit vse") |
| Faze 2 | API kontrakt engine<->UI | M | **M** (potvrzeno — "proverit vse") |
| Faze 3 | Edge cases + debug mode | N | **M** (potvrzeno — "proverit vse") |
| KD-1 | Pipeline mapa do dokumentace | M | **M** (potvrzeno — uz hotovo v 01_Pipeline_Reference.md) |
| KD-2 | JSDoc signatury | N | CEKA |
| KD-3 | Multi-currency (EUR/USD) | O (az po bete) | **Var A ted, Var B do planu** |
| KD-4 | Rounding invarianty | M | CEKA |
| KD-5 | Performance caching | O | CEKA |
| KD-6 | Determinismus (now param + testy) | M | **M** (potvrzeno — "ano, vytvor testy") |
| KD-7 | Preview API wrapper | N | CEKA |
| KD-8 | Verzovaci strategie (quote snapshot) | N | **M** (potvrzeno — snapshot do Supabase) |

---

## 2. Express Delivery — admin UI stav

**ODPOVED (2026-02-19):** Admin stranka `AdminExpress.jsx` **existuje** (route `/admin/express`).
- 2-column layout, tier editor, surcharge config (percent/fixed)
- Storage: `loadExpressConfigV1` / `saveExpressConfigV1` z `adminExpressStorage.js`
- **Stav:** Existuje ale "nefunguje plne" — potreba overit propojeni s kalkulackou

---

## 3. Shipping — admin UI stav

**ODPOVED (2026-02-19):** Admin stranka `AdminShipping.jsx` **existuje** (route `/admin/shipping`).
- FIXED/WEIGHT_BASED/PICKUP typy, free shipping threshold
- Storage: `loadShippingConfigV1` / `saveShippingConfigV1` z `adminShippingStorage.js`
- **Stav:** Existuje ale "nefunguje plne" — potreba overit propojeni s kalkulackou

---

## 4. Kupony/Coupons — admin UI stav

**ODPOVED (2026-02-19):** Admin stranka `AdminCoupons.jsx` **existuje** (route `/admin/coupons`).
- 3 tabs (Coupons, Promotions, Settings), CRUD
- Typy: percent, fixed, free_shipping
- Storage: `loadCouponsConfigV1` / `saveCouponsConfigV1` z `adminCouponsStorage.js`
- **Stav:** Existuje ale "nefunguje plne" — potreba overit propojeni s kalkulackou

---

## 5. Testovaci data

**ODPOVED:** CEKA — uzivatel neodpovedel primo. Vytvorim synteticka testovaci data.

---

## 6. Multi-currency casovy horizont

**ODPOVED (2026-02-19):** Varianta A ted + Varianta B do planu.
- **Var A (ted):** Pridame `currency` pole do configu, hardcoded CZK default (~1h)
- **Var B (pozdeji):** Plna konverze CZK/EUR/USD s kurzy, formatovanim (6-10h) — zapsat do roadmapy

---

## 7. Quote snapshot — jak funguje order system?

**ODPOVED (2026-02-19):** Objednavky ukladat do **Supabase** (ne localStorage).
- Uzivatel: "chci aby se ukladaly do Supabase jelikoz to zde uz mame propojene tu databazi"
- Pricing snapshot bude soucast objednavky v Supabase
- Schema pro snapshot: NEROZHODNUTO — potreba navrhnout

---

## 8. Snapshot testy — format a umisteni

**ODPOVED (2026-02-19):** "Ano, vytvor testy"
- Uzivatel potvrdil ze chce automatizovane testy (ne stranku)
- Format: `npx vitest`
- Umisteni: Muj navrh (a) — `src/lib/pricing/__tests__/pricingEngineV3.test.js`
- Fixtures: `src/lib/pricing/__tests__/fixtures/` (JSON)
- **Pozn:** Umisteni nebylo explicitne potvrzeno — pouziji standardni konvenci

---

## 9. Engine version — jaka verze?

**ODPOVED:** CEKA — uzivatel neodpovedel. Navrh `'3.1.0'` zustava.

---

## Souhrn stavu odpovedi

| # | Tema | Stav |
|---|------|------|
| 1 | Prioritizace | CASTECNE (scope = vse, ale ne item-by-item) |
| 2 | Express admin | ZODPOVEZENO (existuje, nefunguje plne) |
| 3 | Shipping admin | ZODPOVEZENO (existuje, nefunguje plne) |
| 4 | Coupons admin | ZODPOVEZENO (existuje, nefunguje plne) |
| 5 | Testovaci data | CEKA (vytvorim synteticka) |
| 6 | Multi-currency | ZODPOVEZENO (Var A ted, Var B do planu) |
| 7 | Quote snapshot | ZODPOVEZENO (Supabase) |
| 8 | Testy | ZODPOVEZENO (ano, vitest) |
| 9 | Engine version | CEKA (navrh 3.1.0) |
