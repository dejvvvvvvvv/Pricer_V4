# KD-3 — Multi-Currency Podpora

> **Zdroj:** Extrahovano z `3_PricingEngineV3_RoadMap_Plan.md` sekce KD-3
> **Ucel:** Podpora CZK/EUR/USD v pricing enginu
> **Odhad:** 6-10 hodin (engine) + 2-4 hodin (UI)
> **Zavislosti:** KD-4 (rounding invarianty)
> **Priorita:** Var A = TED (1h), Var B = PO BETE (6-10h)
> **Rozhodnuti uzivatele (2026-02-19):** Var A implementovat hned, Var B zapsat do planu

---

## Soucasny stav

- `currency: 'CZK'` je **hardcoded** v navratovem objektu (radek 1156)
- Zadna konverze men NEEXISTUJE
- Rounding `step` je konfigurovatelny, ale neni navazany na menu
- Pro CZK (celociselne) je presnost dostatecna
- Pro EUR/USD (2 desetinna mista) muze dojit k floating point odchylkam

---

## Varianta A (TED — ~1h) — Currency pole v configu

**Scope:**
- [ ] Pridat `currency` field do `PricingConfigV3` (default: `'CZK'`)
- [ ] Navratovy objekt: `currency` z configu, ne hardcoded `'CZK'`
- [ ] Admin UI: dropdown pro vyber meny (zatim jen CZK, pripraveno na dalsi)
- [ ] Zadna konverze, zadne formatovani — jen propagace currency kodu

**Proc:** Minimalni zmena (~1h), priprava infrastruktury pro Var B.

---

## Varianta B (PO BETE — 6-10h) — Plna multi-currency podpora

Vse nize patri do Varianty B a bude implementovano az po bete.

---

## Ukol KD-3.1: Currency-aware rounding

**Co udelat:**
- [ ] Pridat `currency` field do `PricingConfigV3` (default: `'CZK'`)
- [ ] Definovat `CURRENCY_CONFIG` mapu:
  ```javascript
  const CURRENCY_CONFIG = {
    CZK: { decimals: 0, minorUnit: 1, defaultStep: 1, symbol: 'Kc' },
    EUR: { decimals: 2, minorUnit: 0.01, defaultStep: 0.01, symbol: 'EUR' },
    USD: { decimals: 2, minorUnit: 0.01, defaultStep: 0.01, symbol: '$' },
  };
  ```
- [ ] Upravit `roundToStep` aby respektoval decimals meny
- [ ] Navratovy objekt: `currency` z configu, ne hardcoded
- [ ] Vsechny castky v breakdown zaokrouhlit na spravny pocet des. mist

---

## Ukol KD-3.2: Minor units (budoucnost)

**Princip:** Interni vypocty v centech/halerech (integer aritmetika)
- CZK: zaokrouhluje se na cele koruny (step=1)
- EUR: 1 EUR = 100 centu (step=0.01)
- USD: 1 USD = 100 centu (step=0.01)

**Doporuceni:** Neimplementovat pro MVP. Pouze pokud floating point chyby budou realny problem.

---

## Ukol KD-3.3: Zobrazovaci format

**Co udelat:**
- [ ] Utility funkce `formatPrice(amount, currency)` — pouziva `Intl.NumberFormat`
- [ ] Umisteni: `src/lib/pricing/formatters.js` (NOVY soubor)
- [ ] Engine NESMI formatovat ceny — pouze vraci cisla + currency kod
- [ ] Vsechny UI komponenty pouzivaji `formatPrice()` misto vlastniho formatovani

**Priklad:**
```javascript
formatPrice(1999, 'CZK')  // "1 999 Kc"
formatPrice(24.99, 'EUR')  // "24,99 EUR"
formatPrice(24.99, 'USD')  // "$24.99"
```

---

## Riziko

Zmena z hardcoded CZK vyzaduje aktualizaci VSECH mist kde se cena zobrazuje:
- test-kalkulacka
- widget-kalkulacka
- admin preview (AdminPricing tab 5)
- checkout flow
- admin orders

Je to **cross-cutting concern** — proto se doporucuje implementovat az po stabilizaci ostatnich casti.
