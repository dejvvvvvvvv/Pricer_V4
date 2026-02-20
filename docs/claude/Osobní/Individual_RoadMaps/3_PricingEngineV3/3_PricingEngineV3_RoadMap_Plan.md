# 3. Pricing Engine V3 — Detailni RoadMap Plan

> **Stav:** 🟢 88% hotovo | **Priorita:** KRITICKA
> **Zavislosti na jine sekce:** ZADNE (je zakladem pro ostatni)
> **Kdo na nem zavisi:** Kalkulacka (#1), Widget (#11), Checkout (#1.6), Shipping (#16), Express (#17), Kupony (#18)

---

## Prehled

Pricing Engine V3 je deterministicky pipeline pro vypocet cen 3D tisku. Je to **jedna z nejhotovejsich casti** projektu a zaroven **zaklad pro vsechny ostatni** — kalkulacka, widget, checkout i admin preview na nem zavisi.

**Hlavni soubor:** `src/lib/pricing/pricingEngineV3.js` (~1205 radku)

---

## Co je HOTOVO (✅)

### Core Pipeline (95%)
- [x] Deterministicky pipeline: `base -> fees -> markup -> volume discounts -> minima -> rounding`
- [x] `calculateModelPrice()` — per-model cena
- [x] `calculateOrderTotal()` — celkova cena objednavky
- [x] Fee breakdown generovani
- [x] Podpora pro `modelTotalsById` in-place modifikaci (dulezite pro downstream ORDER fees)

### Material & Time Pricing (95%)
- [x] Cena za gram materialu (globalni nebo per-barva)
- [x] Cena za hodinu tisku
- [x] Podpora skupin materialu
- [x] Per-unit pricing

### Fee System (90%)
- [x] MODEL scope fees (aplikuji se per-model)
- [x] ORDER scope fees (aplikuji se na celou objednavku)
- [x] Typed conditions: material, weight, volume, surface, quantity
- [x] Selectable / Required / Default flagy
- [x] Negativni slevy (fee se zapornou hodnotou = sleva)
- [x] Priorita a razeni fees

### Volume Discounts (95%)
- [x] Tier-based system
- [x] Trigger dle mnozstvi (quantity) nebo celkove castky (amount)
- [x] Modifikace `modelTotalsById` in-place (downstream ORDER fees referencuji)
- [x] Zobrazeni v breakdown

### Ostatni (90%)
- [x] Minimum order value
- [x] Rounding rules (ceil, floor, round, nearest)
- [x] Markup percentage
- [x] Preview sandbox kompatibilita

---

## Co CHYBI / je potreba dodelat

### Faze 1: Overeni Express/Shipping/Coupon integrace v engine (Priorita: VYSOKA)

**Stav:** Engine ma kod pro express surcharge, shipping cost a coupon discount, ale NENI plne propojeno s UI kalkulacky.

#### Ukol 1.1: Audit existujici express/shipping/coupon logiky v engine
- **Soubor:** `src/lib/pricing/pricingEngineV3.js`
- **Co udelat:**
  - [ ] Najit kde v pipeline se aplikuje `expressSurcharge`
  - [ ] Najit kde v pipeline se pridava `shippingCost`
  - [ ] Najit kde v pipeline se aplikuje `couponDiscount`
  - [ ] Overit poradi: base -> fees -> markup -> volume discounts -> **express** -> **shipping** -> **coupon** -> minima -> rounding
  - [ ] Overit ze `calculateOrderTotal()` prijima parametry `expressConfig`, `shippingMethod`, `couponCode`
- **Ocekavany vysledek:** Jasna mapa kde v engine se tyto tri polozky pocitaji

#### Ukol 1.2: Overit spravnost vypoctu express surcharge
- **Soubor:** `src/lib/pricing/pricingEngineV3.js`
- **Co udelat:**
  - [ ] Otestovat express surcharge jako procento (napr. +20%)
  - [ ] Otestovat express surcharge jako fixni castku (napr. +100 Kc)
  - [ ] Overit ze se aplikuje po volume discounts ale pred shipping
  - [ ] Overit breakdown obsahuje express polozku
- **Testovaci scenare:**
  - 1 model, standard delivery → zadny express
  - 1 model, express 20% → cena + 20%
  - 3 modely, express fixni 150 Kc → celkova cena + 150

#### Ukol 1.3: Overit spravnost vypoctu shipping cost
- **Soubor:** `src/lib/pricing/pricingEngineV3.js`
- **Co udelat:**
  - [ ] Otestovat fixni shipping cenu (napr. 89 Kc)
  - [ ] Otestovat free shipping threshold (napr. nad 500 Kc = zdarma)
  - [ ] Overit ze se shipping pridava az po express surcharge
  - [ ] Overit breakdown obsahuje shipping polozku
- **Testovaci scenare:**
  - Objednavka 200 Kc, shipping 89 Kc → total 289 Kc
  - Objednavka 600 Kc, free threshold 500 Kc → total 600 Kc (shipping zdarma)

#### Ukol 1.4: Overit spravnost aplikace kuponu
- **Soubor:** `src/lib/pricing/pricingEngineV3.js`
- **Co udelat:**
  - [ ] Otestovat procentualni kupon (napr. -10%)
  - [ ] Otestovat fixni kupon (napr. -50 Kc)
  - [ ] Otestovat free shipping kupon
  - [ ] Overit ze se kupon aplikuje po shipping (ne pred nim)
  - [ ] Overit ze vysledna cena nemuze byt zaporna
  - [ ] Overit breakdown obsahuje coupon polozku
- **Testovaci scenare:**
  - Objednavka 500 Kc, kupon -10% → 450 Kc
  - Objednavka 500 Kc, kupon -50 Kc → 450 Kc
  - Objednavka 100 Kc, kupon -200 Kc → 0 Kc (ne -100)

### Faze 2: Integracni propojeni s UI (Priorita: VYSOKA)

> **POZNAMKA:** Tato faze se dela SPOLECNE se sekci #1 (Kalkulacka) — viz `1_Kalkulacka_RoadMap_Plan.md`

#### Ukol 2.1: Definovat API kontrakt mezi engine a UI
- **Co udelat:**
  - [ ] Jasne definovat jake parametry `calculateOrderTotal()` ocekava pro shipping/express/coupon
  - [ ] Dokumentovat navratovou strukturu (breakdown polozky pro shipping, express, coupon)
  - [ ] Overit ze engine vraci dostatek informaci pro zobrazeni v UI (nazev metody, cena, sleva)

#### Ukol 2.2: Pripravit helper funkce (pokud neexistuji)
- **Soubor:** `src/lib/pricing/pricingEngineV3.js` nebo novy helper
- **Co udelat:**
  - [ ] `getShippingCost(shippingMethod, orderSubtotal, freeThreshold)` — pokud neni primo v engine
  - [ ] `getExpressSurcharge(expressTier, orderSubtotal)` — pokud neni primo v engine
  - [ ] `applyCoupon(couponData, orderSubtotal)` — pokud neni primo v engine
  - [ ] Export techto funkci pro pouziti v kalkulacce

### Faze 3: Edge cases a robustnost (Priorita: STREDNI)

#### Ukol 3.1: Edge case handling
- **Co udelat:**
  - [ ] Zadny material/cas → cena 0 (ne NaN, ne error)
  - [ ] Vsechny fees disabled → cena = base
  - [ ] Volume discount vynuluje cenu → minimalni cena se aplikuje
  - [ ] Express + coupon kombinace → spravne poradi
  - [ ] Zaokrouhleni s kupony → nedojde k floating point chybam
  - [ ] Prazdny order (0 modelu) → graceful handling

#### Ukol 3.2: Logovani a debug
- **Co udelat:**
  - [ ] Volitelny verbose mode pro logovani kazdeho kroku pipeline
  - [ ] Breakpoints pro admin preview sandbox
  - [ ] Console.log kazdeho mez-kroku pri debug flagu

---

## Implementacni poradi

1. **Faze 1** (Overeni) — 2-4 hodiny prace, zadne zavislosti
2. **Faze 2** (API kontrakt) — 1-2 hodiny, zavisle na rozhodnuti jak kalkulacka bude volat engine
3. **Faze 3** (Edge cases) — 2-3 hodiny, muze byt kdykoli

**Celkem:** ~5-9 hodin prace

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Express/shipping/coupon logika v engine nefunguje | Nizka | Vysoky | Faze 1 je prave pro toto |
| Floating point chyby v cenach | Nizka | Stredni | Rounding pravidla uz existuji |
| Breakdown nezobrazuje vsechny polozky | Stredni | Stredni | Faze 2 — definovat jasny kontrakt |
| Pipeline poradi je spatne (coupon pred shipping) | Nizka | Vysoky | Faze 1.4 testovani |

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/lib/pricing/pricingEngineV3.js` | Opravy, doplneni | Maly-Stredni |
| Dokumentace | Aktualizace | Maly |

---

## Kriticke doplnky (z review 2026-02-18)

> Nasledujici sekce pokryvaji mezery identifikovane pri hloubkovem review roadmapu proti skutecnemu kodu enginu.
> Kazda sekce obsahuje: proc je to dulezite, co presne chybi, a konkretni akce.

### KD-0: Oprava faktickych chyb v tomto roadmapu (Priorita: OKAMZITA)

Roadmap obsahuje nekolik faktickych chyb oproti skutecnemu kodu enginu. Tyto MUSI byt opraveny aby roadmap neslouzil jako zdroj dezinformaci.

**Chyba 0a: Neexistujici funkce**
- Roadmap referencuje `calculateModelPrice()` a `calculateOrderTotal()` (sekce "Co je HOTOVO").
- **Skutecnost:** Engine exportuje POUZE `calculateOrderQuote()` a `evaluateConditions()`. Zadna funkce `calculateModelPrice` nebo `calculateOrderTotal` NEEXISTUJE.
- **Akce:** Prejmenovat v roadmapu na spravne nazvy.

**Chyba 0b: Spatne pipeline poradi v Ukolu 1.1**
- Roadmap uvadi: `base -> fees -> markup -> volume discounts -> express -> shipping -> coupon -> minima -> rounding`
- **Skutecnost (radky 1-5 enginu):**
  ```
  base -> MODEL fees -> percent fees -> per-model min -> per-model round
       -> EXPRESS (S09) -> COUPON (S10) -> volume discounts (S05) -> ORDER fees
       -> markup -> order min -> final round -> clamp -> SHIPPING (S04)
  ```
- **Kriticke rozdily:**
  - EXPRESS je PRED couponem a volume discounty (ne po nich)
  - SHIPPING je posledni krok (ne pred couponem)
  - COUPON je PRED volume discounty (ne po shippingu)
  - Markup je AZ po ORDER fees (ne pred volume discounty)

**Chyba 0c: Ukol 1.4 tvrdeni o kuponu**
- Roadmap rika "Overit ze se kupon aplikuje po shipping (ne pred nim)"
- **Skutecnost:** Kupon se aplikuje PRED shippingem (radky 714-764 vs 1103-1151). Shipping je posledni krok pipeline.

**Akce:** [ ] Opravit vsechny tri chyby v tomto roadmapu.

---

### KD-1: Konkretni pipeline poradi s mapovanim na funkce a radky kodu (Priorita: VYSOKA)

**Proc:** Bez presneho mapovani "ktery krok = ktera funkce = ktere radky" neni mozne efektivne debugovat, auditovat nebo rozsirovat pipeline. Roadmap aktualne uvadi pouze abstraktni poradi bez vazby na kod.

**Kompletni pipeline mapa (16 kroku):**

| # | Krok | Kde v kodu (radky) | Funkce/blok | Vstup | Vystup |
|---|------|--------------------|-------------|-------|--------|
| 0 | Config normalizace | L420 | `normalizePricingConfigEngineShape()` (L37-92) | raw pricingConfig | normalizovany `pc` |
| 1 | Base price (per model) | L453 | `calcBase()` (L291-320) | file + cfg + pc | materialCost, timeCost, baseTotal |
| 2 | Model context | L454 | `buildModelContext()` (L338-392) | fileId + cfg + base | ctx pro condition eval |
| 3a | MODEL fees (non-percent) | L469-582 | `shouldApplyFee()` + `evaluateConditionsWithDebug()` + `feeTypeUnitAmount()` | fee + ctx + base | nonPercentTotal |
| 3b | MODEL fees (percent) | L588-611 | deferred pass | percentBasePerPiece | percentTotal |
| 4 | Per-model minimum | L623-627 | inline if | modelSubtotal | modelSubtotal (clamped) |
| 5 | Per-model rounding | L632-636 | `roundToStep()` (L94-99) | modelSubtotal | perModelRounded |
| 6 | Express surcharge (S09) | L677-711 | inline loop | modelTotalsById | +surcharge (in-place) |
| 7 | Coupon discount (S10) | L714-764 | inline | modelTotalsById | -discount (in-place, proportional) |
| 8 | Volume discounts (S05) | L770-827 | inline | modelTotalsById | -savings (in-place) |
| 9a | ORDER fees (non-percent) | L868-1031 | subset aggregation + feeTypeUnitAmount | aggregated metrics | orderNonPercentTotal |
| 9b | ORDER fees (percent) | L1034-1057 | deferred pass | subsetModelsTotal + subsetNonPercent | orderPercentTotal |
| 10 | Markup | L1066-1079 | inline | subtotalBeforeMarkup | +markupAmount |
| 11 | Order minimum | L1084-1088 | inline if | totalAfterMarkup | totalAfterMarkup (clamped) |
| 12 | Final rounding | L1091-1097 | `roundToStep()` | totalAfterMarkup | totalRounded |
| 13 | Clamp to >= 0 | L1100-1101 | `Math.max(0, ...)` | totalRounded | total |
| 14 | Shipping (S04) | L1103-1151 | inline | total + selectedMethod | shippingCost |
| 15 | Grand total | L1153 | `Math.max(0, total + shippingCost)` | total + shippingCost | grandTotal |

**Akce:**
- [ ] Pridat tuto tabulku do `Pricing-Engine-Dokumentace.md` sekce 8
- [ ] Vytvorit inline komentare v enginu oznacujici hranice kazdeho kroku (napr. `// --- STEP 6: Express surcharge ---`)
- [ ] Zvazit refaktoring: extrahovat kroky 6-8 (express/coupon/volume) do pojmenovanych funkci misto inline bloky

---

### KD-2: Skutecne signatury exportovanych funkci (Priorita: VYSOKA)

**Proc:** Roadmap referencuje neexistujici funkce. Kazdy konzument enginu (kalkulacka, widget, checkout, admin preview) MUSI znat presnou signaturu.

**Exportovane funkce (skutecnost):**

```javascript
// 1. HLAVNI PIPELINE — jedina funkce pro vypocet ceny
export function calculateOrderQuote({
  // Povinne
  uploadedFiles,          // Array<{id?, fileId?, key?, name?, file?, status?,
                          //   result: {metrics: {estimatedTimeSeconds, filamentGrams},
                          //            modelInfo: {volumeMm3, sizeMm, surfaceMm2}},
                          //   clientModelInfo?: {surfaceMm2}}>
  printConfigs,           // Record<fileId, {material?, materialKey?, quality?,
                          //   supports?: boolean, infill?: number, quantity?: number}>
  pricingConfig,          // PricingConfigV3 (viz KD-2a nize)
  feesConfig,             // {fees: Array<FeeDefinition>}

  // Volitelne — uzivatelsky vyber
  feeSelections,          // {selectedFeeIds: Set<string> | Array<string>,
                          //  feeTargetsById: Record<feeId, {mode: 'ALL'|'SELECTED', modelIds: string[]}>}

  // Volitelne — S09 Express
  expressConfig,          // {enabled: boolean, tiers: Array<{id, active?, surcharge_type: 'percent'|'fixed',
                          //   surcharge_value: number}>}
  selectedExpressTierId,  // string | null

  // Volitelne — S10 Coupon
  couponsConfig,          // {enabled: boolean, coupons: Array<Coupon>,
                          //  settings?: {max_discount_percent?: number}}
  appliedCouponCode,      // string | null

  // Volitelne — S04 Shipping
  shippingConfig,         // {enabled: boolean, methods: Array<ShippingMethod>,
                          //  free_shipping_enabled?: boolean, free_shipping_threshold?: number}
  selectedShippingMethodId, // string | null
})
// Vraci: OrderQuoteResult (viz Pricing-Engine-Dokumentace.md sekce 6.4)

// 2. CONDITION EVALUATOR — pouzivany i externe (napr. AdminFees preview)
export function evaluateConditions(conditions, context)
// conditions: Array<{key: string, op: string, value: any}>
// context: Record<string, any>
// Vraci: boolean (true = vsechny podminky splneny)
```

**Poznamka ke KD-2a: PricingConfigV3 po normalizaci** obsahuje tyto root-level fieldy:
`rate_per_hour`, `minimum_billed_minutes`, `minimum_price_per_model`, `minimum_order_total`,
`rounding: {enabled, step, mode, smart_rounding_enabled}`,
`markup: {enabled, mode, value, min_flat?}`,
`materials: Array<{key, price_per_gram, enabled}>`,
`volume_discounts: {enabled, mode, scope, tiers}`.

**Akce:**
- [ ] Prejmenovat vsechny reference v roadmapu z `calculateModelPrice` / `calculateOrderTotal` na `calculateOrderQuote`
- [ ] Pridat JSDoc komentare ke `calculateOrderQuote` a `evaluateConditions` do enginu
- [ ] Zvazit TypeScript .d.ts definicni soubor pro engine (bez nutnosti migrace na TS)

---

### KD-3: Multi-currency podpora (Priorita: STREDNI)

**Proc:** Engine aktualne hardcoduje `currency: 'CZK'` na radku 1156. Pro SaaS produkt je podpora vice men nevyhnutelna. CZK, EUR a USD maji odlisne zaokrouhlovaci pravidla a presnost.

**Soucasny stav:**
- `currency: 'CZK'` je hardcoded v navratovem objektu (radek 1156)
- Zadna konverze men neexistuje
- Rounding `step` je konfigurovatelny (typicky 1 pro CZK), ale neni navazany na menu
- Floating point: pro CZK (celociselne) je presnost dostatecna, pro EUR/USD (2 desetinna mista) muze dojit k odchylkam

**Co je potreba:**

#### Ukol KD-3.1: Currency-aware rounding a minor units
- **Co udelat:**
  - [ ] Pridat `currency` field do `PricingConfigV3` (default: `'CZK'`)
  - [ ] Definovat `CURRENCY_CONFIG` mapu:
    ```javascript
    const CURRENCY_CONFIG = {
      CZK: { decimals: 0, minorUnit: 1, defaultStep: 1, symbol: 'Kc' },
      EUR: { decimals: 2, minorUnit: 0.01, defaultStep: 0.01, symbol: 'EUR' },
      USD: { decimals: 2, minorUnit: 0.01, defaultStep: 0.01, symbol: '$' },
    };
    ```
  - [ ] Upravit `roundToStep` aby respektoval decimals meny (ne jen step)
  - [ ] Navratovy objekt: `currency` se bere z configu, ne hardcoded
  - [ ] Vsechny castky v breakdown zaokrouhlit na `decimals` meny pred vracenim

#### Ukol KD-3.2: Minor units strategie (integer aritmetika)
- **Zvazit (ne nutne pro MVP):** Interni vypocty v minor units (centy/halere):
  - CZK: 1 CZK = 100 haleru (ale CZK se zaokrouhluje na cele koruny)
  - EUR: 1 EUR = 100 centu
  - USD: 1 USD = 100 centu
- **Vyhoda:** Eliminuje floating point chyby uplne
- **Nevyhoda:** Vyzaduje konverzi na vstupu a vystupu, komplikuje kod
- **Doporuceni:** Pro fazi 1 staci currency-aware rounding. Integer aritmetiku implementovat az pokud floating point chyby budou realny problem.

#### Ukol KD-3.3: Zobrazovaci format
- **Co udelat:**
  - [ ] Utility funkce `formatPrice(amount, currency)` — pouziva `Intl.NumberFormat`
  - [ ] Umisteni: `src/lib/pricing/formatters.js` (novy soubor, ne v enginu)
  - [ ] Engine NESMI formatovat ceny — pouze vraci cisla + currency kod

**Riziko:** Zmena z hardcoded CZK vyzaduje aktualizaci vsech mist kde se cena zobrazuje (kalkulacka, widget, checkout, admin). Je to cross-cutting concern.

**Odhadovany rozsah:** 4-6 hodin (engine) + 2-4 hodin (UI aktualizace)

---

### KD-4: Rounding strategie — detail a invarianty (Priorita: VYSOKA)

**Proc:** Zaokrouhlovani je kriticke pro breakdown konzistenci. Pokud se zaokrouhluje na spatnem miste, soucet polozek nesedi s celkem. Roadmap nespecifikuje kde presne se zaokrouhluje a proc.

**Soucasny stav v enginu (dle kodu):**

| Misto | Podminka | Co se zaokrouhluje |
|-------|----------|-------------------|
| Per-model (krok 5, L632) | `rounding.enabled && !smart_rounding_enabled` | Kazdy model zvlast |
| Final (krok 12, L1091) | `rounding.enabled` (vzdy) | Celkovy total pred shippingem |
| **NIKDY** se nezaokrouhluje | — | Zadny mezikrok pipeline (fees, express, coupon, volume, markup) |

**Invariant zaokrouhleni:**
```
VZDY PLATI:
  Vsechny mezivypocty (fees, express, coupon, volume, ORDER fees, markup)
  probiha v plne presnosti (floating point).

  Zaokrouhleni se aplikuje POUZE:
  1. Na per-model urovni (pokud smart_rounding NENI zapnuto)
  2. Na finalnim totalu (vzdy pokud rounding je enabled)

  Shipping se NEPODLEHNE zaokrouhleni — pridava se k uz zaokrouhlenemu totalu.
```

**Problem s breakdown konzistenci:**
Kdyz `smart_rounding_enabled = false`, per-model zaokrouhleni zpusobi ze:
```
sum(zaokrouhleny_model_1, zaokrouhleny_model_2, ...) != zaokrouhleny_total
```
Protoze `round(a) + round(b) != round(a + b)` obecne. Toto je **znamé omezeni** (sekce 17.7 dokumentace), ale roadmap ho neadresuje.

**Akce:**
- [ ] Dokumentovat invariant zaokrouhleni v roadmapu a v kodu (komentare)
- [ ] Pridat `rounding_difference` pole do navratoveho objektu kdyz per-model rounding zpusobi nesoulad
- [ ] Zvazit "largest remainder" metodu pro distribuci zaokrouhlovaci chyby pres modely
- [ ] Pridat test case: 3 modely po 33.33 CZK, rounding step 1 → total by mel byt 100 ne 99

---

### KD-5: Performance — caching a memoizace (Priorita: NIZKA/STREDNI)

**Proc:** Kazda zmena v konfiguraci (material, kvalita, mnozstvi) v kalkulacce spousti znovu celou pipeline. Pro velke objednavky (50+ modelu, 30+ fees) muze byt znatelny lag.

**Soucasny stav:**
- Zadna cache ani memoizace NEEXISTUJE
- Casova slozitost: `O(M * F)` kde M = modely, F = fees
- Pro typicke pouziti (5-20 modelu, 10-30 fees) je to zanedbatelne
- Pipeline bezi synchronne, blokovane

**Strategie pro optimalizaci (serazeno dle priority):**

#### Ukol KD-5.1: Input hash pro skip-if-unchanged (Priorita: STREDNI)
- **Princip:** Pred kazdym volanim `calculateOrderQuote` se spocita hash vstupu. Pokud se hash nezmenil, vrati se predchozi vysledek.
- **Implementace:**
  ```javascript
  // V kalkulacce (NE v enginu!):
  const inputHash = JSON.stringify({uploadedFiles, printConfigs, pricingConfig, ...});
  if (inputHash === lastInputHash) return lastResult;
  ```
- **Kde:** V PricingCalculator.jsx (volajici), NE v enginu samotnem
- **Vyhoda:** Zero cost kdyz se nic nezmenilo (napr. uzivatel scrolluje, resizuje okno)
- **Nevyhoda:** JSON.stringify je O(N) — pro velke vstupy muze byt pomalejsi nez samotny vypocet

#### Ukol KD-5.2: Per-model incremental recalc (Priorita: NIZKA)
- **Princip:** Kdyz se zmeni konfigurace jednoho modelu, prepocitat POUZE tento model + ORDER kroky
- **Slozitost:** Vysoka — vyzaduje refactoring pipeline na 2 faze (per-model + order-level)
- **Doporuceni:** Neimplementovat pokud neni jasny performance problem

#### Ukol KD-5.3: Web Worker offload (Priorita: NIZKA)
- **Princip:** Presunout pricing vypocet do Web Workeru aby neblokoval UI thread
- **Vyhoda:** Plynuly UI i pri slozitych vypoctech
- **Nevyhoda:** Asynchronni API (breaking change pro vsechny konzumenty), serializace vstupu/vystupu
- **Doporuceni:** Pouze pokud bude meritelny UI lag (>50ms)

**Akce:**
- [ ] Pridat performance benchmark: zmerit cas `calculateOrderQuote` pro 100 modelu s 50 fees
- [ ] Implementovat input hash v PricingCalculator (KD-5.1) — odhadovany cas: 1 hodina
- [ ] KD-5.2 a KD-5.3 odlozit az po meritelnemu problemu

---

### KD-6: Garancni ramec determinismu (Priorita: VYSOKA)

**Proc:** Determinismus je ZAKLADNI invariant enginu. Stejny vstup MUSI vzdy produkovat stejny vystup. Roadmap to deklaruje, ale nedefinuje co presne to znamena, kde jsou vyjimky, a jak to overit.

**Soucasny stav — co JE deterministicke:**
- Vsechny utility funkce (`safeNum`, `clampMin0`, `normStr`, `roundToStep`) — pure, bez side effects
- `calcBase()` — pure
- `buildModelContext()` — pure
- `evaluateConditions()` — pure (string/numeric porovnani)
- Fee aplikace, ORDER fees, markup, rounding, volume discounts — vsechno pure

**Soucasny stav — co NENI deterministicke:**
- **Coupon expirace (radky 724-728):** `new Date()` se pouziva pro kontrolu `expires_at`, `starts_at`, `max_uses`.
  To znamena: stejny vstup v pondeli a v utery MUZE dat jiny vysledek pokud kupon mezitim expiroval.

**Strategie pro plnou garanci:**

#### Ukol KD-6.1: Inject `now` parametr (Priorita: VYSOKA)
- **Co udelat:**
  - [ ] Pridat volitelny parametr `now?: Date` do `calculateOrderQuote`
  - [ ] Pokud neni predany, pouzije se `new Date()` (zpetne kompatibilni)
  - [ ] Pokud JE predany, pouzije se pro vsechny casove kontroly
  - [ ] Toto umozni: (a) unit testy bez mockingu Date, (b) reprodukovatelne vypocty, (c) audit trail
- **Priklad:**
  ```javascript
  // Pro testy a reproducibilitu:
  calculateOrderQuote({ ..., now: new Date('2026-02-18T12:00:00Z') })
  // Pro bezny provoz (backward compat):
  calculateOrderQuote({ ... }) // pouzije new Date() interně
  ```

#### Ukol KD-6.2: Deterministicke razeni
- **Problem:** `fees` pole se iteruje v poradi jak prichazi. Pokud se fees pole seradi jinak (napr. pri ukladani v adminu), vysledek se NEZMENI co do celkove castky, ale ZMENI se poradi polozek v breakdown.
- **Akce:** [ ] Overit ze fees razeni je stabilni (napr. sort by `id` pred iteraci) — nebo dokumentovat ze poradi fees je "as provided"

#### Ukol KD-6.3: Snapshot test suite
- **Co udelat:**
  - [ ] Vytvorit 10-15 fixture souboru (JSON) s definovanymi vstupy
  - [ ] Pro kazdy fixture zaznamenat ocekavany vystup (snapshot)
  - [ ] Automaticky test: `assert.deepEqual(calculateOrderQuote(fixture.input), fixture.expectedOutput)`
  - [ ] Spoustet pri kazdem buildu
- **Fixtures by mely pokryvat:**
  - Zakladni kalkulace (1 model, zadne fees)
  - Vicemodely s ruznymu materialy
  - MODEL fees (vsech 7 typu)
  - ORDER fees s subset targeting
  - Volume discounts (oba mody, oba scopy)
  - Express + coupon + volume kombinace
  - Edge: nulova cena, nulovy cas, prazdny order, 0 quantity
  - Rounding: smart vs per-model
  - Markup: vsechny 3 mody

**Akce:**
- [ ] Implementovat KD-6.1 (now parametr) — 30 minut
- [ ] Vytvorit snapshot test suite (KD-6.3) — 3-4 hodiny
- [ ] Overit razeni determinismus (KD-6.2) — 30 minut

---

### KD-7: Pricing Preview API pro admin sandbox (Priorita: STREDNI)

**Proc:** Admin pricing page (`AdminPricing.jsx` tab 5) vola engine pro "co-by-kdyz" preview. Ale neni definovano jake data se poskytuji, jak se limutuji, a jak se sandbox izoluje od ostrych dat.

**Soucasny stav:**
- `AdminPricing.jsx` primo importuje `calculateOrderQuote` a vola ho s mock daty
- Neni definovany jasny "preview mode" kontrakt
- Neni osetreno ze preview muze mit jine (neuplne) vstupy nez ostra kalkulace

**Co je potreba:**

#### Ukol KD-7.1: Definovat preview kontrakt
- **Co udelat:**
  - [ ] Vytvorit wrapper funkci `calculatePricingPreview(previewParams)` ktera:
    - Vytvori synteticky `uploadedFiles` z mock metrik (admin zada: gramy, cas, objem)
    - Vytvori synteticky `printConfigs` z vyberu materialu/kvality
    - Vola `calculateOrderQuote` s temito syntetickymi daty
    - Vraci zjednoduseny vysledek pro admin zobrazeni
  - [ ] Umisteni: `src/lib/pricing/pricingPreview.js` (novy soubor)
  - [ ] Admin page importuje POUZE `calculatePricingPreview`, NE primo engine

#### Ukol KD-7.2: Mock data builder
- **Co udelat:**
  - [ ] Funkce `buildMockFile(params)` — vytvori objekt kompatibilni s engine vstupem
  - [ ] Parametry: `{ filamentGrams, estimatedTimeSeconds, volumeMm3, surfaceMm2? }`
  - [ ] Pouzivat v admin preview, testech, a potencialne v dokumentaci

**Akce:**
- [ ] Vytvorit `pricingPreview.js` s wrapper funkci — 2 hodiny
- [ ] Refaktorovat admin preview aby pouzival wrapper — 1 hodina

---

### KD-8: Verzovaci strategie — co pri zmene pravidel (Priorita: STREDNI)

**Proc:** Kdyz admin zmeni cenova pravidla (napr. nove fees, jiny markup), existujici objednavky v procesu by nemely byt ovlivneny. Aktualne zadny mechanismus pro "pricing snapshot" neexistuje.

**Scenare:**
1. Zakaznik vidi cenu 500 Kc, da objednavku. Admin mezitim zmeni fees. Objednavka se uklada s cenou 500 Kc nebo s novou?
2. Admin meni pricing pravidla. Chce videt "co se zmeni pro existujici objednavky"?
3. Zakaznik se vrati po 2 dnech s odkazem na cenovou nabidku. Ma stat porad 500 Kc?

**Navrhovane reseni:**

#### Ukol KD-8.1: Quote snapshot pri objednavce
- **Princip:** V okamziku objednavky se ulozi kompletni `OrderQuoteResult` jako snapshot
- **Co udelat:**
  - [ ] Pri vytvoreni objednavky ulozit `calculateOrderQuote` vystup do objednavky
  - [ ] Objednavka ma field `pricingSnapshot: OrderQuoteResult`
  - [ ] Tato cena se pouzije pro platbu, ne prepocet z aktualniho configu
  - [ ] V admin orders zobrazit "cena v okamziku objednavky" i "aktualni cena" (pro porovnani)

#### Ukol KD-8.2: Config versioning (nice-to-have)
- **Princip:** Kazda zmena pricing configu vytvori novou verzi. Objednavka referencuje `pricingConfigVersion`.
- **Implementace:** V localStorage pridame verzi: `modelpricer:${tenantId}:pricing:v3:version` (auto-increment)
- **Pouziti:** Pri Supabase migraci se toto stane trivialnim (timestamp = verze)
- **Doporuceni:** Neimplementovat v localStorage fazi — pockat na Supabase kde je to prirozene (audit log tabulka)

#### Ukol KD-8.3: Pipeline verze identifikator
- **Co udelat:**
  - [ ] Pridat konstantu `ENGINE_VERSION = 'v3.1.0'` do enginu
  - [ ] Pridat `engineVersion` field do navratoveho objektu `calculateOrderQuote`
  - [ ] Pri breaking change pipeline logiky inkrementovat verzi
  - [ ] Objednavky ukladaji `engineVersion` pro audit trail

**Akce:**
- [ ] Pridat ENGINE_VERSION konstantu — 15 minut
- [ ] Implementovat quote snapshot pri objednavce (KD-8.1) — 2-3 hodiny (spolecne s checkout flow)
- [ ] KD-8.2 odlozit na Supabase migraci

---

### Souhrn kriticke doplnky — prioritizovany backlog

| # | Doplnek | Priorita | Odhad | Zavislosti |
|---|---------|----------|-------|------------|
| KD-0 | Oprava faktickych chyb v roadmapu | OKAMZITA | 15 min | Zadne |
| KD-1 | Pipeline mapa (funkce -> radky) | VYSOKA | 1 hod | Zadne |
| KD-2 | Skutecne signatury + JSDoc | VYSOKA | 1 hod | Zadne |
| KD-4 | Rounding invarianty + breakdown konzistence | VYSOKA | 2 hod | Zadne |
| KD-6 | Determinismus garantie (now parametr + snapshot testy) | VYSOKA | 4 hod | Zadne |
| KD-3 | Multi-currency podpora | STREDNI | 6-10 hod | KD-4 |
| KD-7 | Pricing preview API | STREDNI | 3 hod | KD-2 |
| KD-8 | Verzovaci strategie | STREDNI | 3 hod | KD-6 |
| KD-5 | Performance (caching) | NIZKA | 1-4 hod | Zadne |

**Celkem navic:** ~20-35 hodin (nad ramec existujicich Fazi 1-3)

---

## Poznamky

- **DULEZITE:** Pricing engine je zaklad pro vse — jakakoli zmena MUSI byt zpetne kompatibilni
- **DULEZITE:** `modelTotalsById` modifikace in-place — toto chovani NESMI byt naruseno
- **TIP:** Admin Preview Sandbox (`AdminPricing.jsx` tab 5) je nejlepsi zpusob jak testovat zmeny v engine
- **ODPOVED na otazku:** Express surcharge se aplikuje PER-MODEL (radky 688-710 — loop `for (const model of modelResults)` s prirazkou per model total), ale celkovy `expressSurchargeTotal` je soucet pres vsechny modely. Fixed surcharge se aplikuje na kazdy model zvlast (kazdy model +fixni castka), percent se pocita z kazdeho model totalu zvlast.
- **OPRAVENO:** Hlavni exportovana funkce se jmenuje `calculateOrderQuote`, NE `calculateModelPrice` ani `calculateOrderTotal`. Tyto nazvy jsou chybne a v roadmapu musi byt opraveny.
- **OPRAVENO:** Skutecne pipeline poradi je: base -> MODEL fees -> per-model min -> per-model round -> EXPRESS -> COUPON -> VOLUME -> ORDER fees -> markup -> order min -> final round -> clamp -> SHIPPING. Coupon je PRED shippingem, ne po nem.
