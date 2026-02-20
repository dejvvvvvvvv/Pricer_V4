# 18. Kupony a slevy — Detailni RoadMap Plan

> **Stav:** 🟡 35% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** Kalkulacka (#1) pro UI, Backend (#2) pro validaci
> **Kdo na nem zavisi:** Checkout (#1.6)

---

## Prehled

System kuponovych kodu a slev. Admin cast je HOTOVA (konfigurace kuponu). Chybi integrace do kalkulacky UI a backendova validace.

**Admin soubor:** `src/pages/admin/AdminCoupons.jsx` (~989 radku)
**Storage:** `src/utils/adminCouponsStorage.js`
**UI komponenta:** `src/pages/test-kalkulacka/components/CouponInput.jsx`

---

## Co je HOTOVO (✅)

### Admin konfigurace (82%)
- [x] AdminCoupons.jsx — plne funkcni CRUD
- [x] Typy kuponu:
  - [x] Procentualni sleva (napr. -10%)
  - [x] Fixni castka (napr. -50 Kc)
  - [x] Free shipping
- [x] Platnost kuponu (od-do datum)
- [x] Limitace pouziti (max pocet pouziti)
- [x] Aktivni/neaktivni
- [x] Persist do tenant storage

### UI komponenta (70%)
- [x] CouponInput.jsx existuje a je funkcni
- [x] Input pole pro kod
- [x] Validace (klientska — overeni ze kupon existuje v storage)
- [x] Zobrazeni aplikovaneho kuponu (nazev, sleva)
- [x] Moznost odebrat kupon

### Pricing Engine (75%)
- [x] Coupon discount vypocet v `pricingEngineV3.js`
- [x] Podpora procento, fixni castka, free shipping

---

## Co CHYBI / je potreba dodelat

### Faze 1: Integrace do kalkulacky (Priorita: VYSOKA)

> **SPOLECNA FAZE s Kalkulackou (#1), Shipping (#16) a Express (#17)**

#### Ukol 1.1: Renderovat CouponInput v kalkulacce
- **Soubor:** `src/pages/test-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Pridat `<CouponInput ... />` v kroku 3 nebo checkoutu
  - [ ] Propsy:
    - `coupons` — seznam vsech kuponu z admin storage (pro validaci)
    - `appliedCoupon` — aktualne aplikovany kupon
    - `onApply` — handler pro aplikaci kuponu
    - `onRemove` — handler pro odebrani kuponu
    - `orderSubtotal` — pro vypocet slevy
  - [ ] State pro `appliedCoupon` — overit existence v index.jsx
  - [ ] Propojit s pricing engine

#### Ukol 1.2: Zobrazit slevu v price breakdown
- **Co udelat:**
  - [ ] Pridat radek "Kupon SLEVA10 (-10%): -52 Kc" do cenoveho prehledu
  - [ ] Zobrazit zelene/akcnii barvou
  - [ ] Pokud free shipping kupon — zobrazit "Doprava: ZDARMA (kupon)"

#### Ukol 1.3: Widget integrace
- **Soubor:** `src/pages/widget-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Stejna integrace
  - [ ] CSS vars styling

### Faze 2: Backend validace (Priorita: STREDNI)

#### Ukol 2.1: Server-side kupon validace
- **Soubor:** Novy endpoint v `backend-local/` (nebo Cloud Functions)
- **Co udelat:**
  - [ ] `POST /api/coupons/validate` endpoint
  - [ ] Overeni ze kupon existuje
  - [ ] Overeni ze je platny (datum platnosti)
  - [ ] Overeni ze nebyl vyuzit vice nez povoleno (usage counter)
  - [ ] Navratova hodnota: `{ valid: true, type: 'percentage', value: 10 }`
- **Proc:** Klientska validace je nespolehlivá — zakaznik muze obejit
- **Zavislost:** Backend (#2) nebo Cloud Functions (#26)

#### Ukol 2.2: Usage tracking
- **Co udelat:**
  - [ ] Pocitadlo pouziti kazdeho kuponu
  - [ ] Inkrementace pri uspesne objednavce
  - [ ] Deaktivace kuponu po dosazeni limitu
- **Zavislost:** Orders (#7) — inkrementace pri objednavce

### Faze 3: Pokrocile kuponove funkce (post-Beta)

#### Ukol 3.1: Darkove poukazky / predplacene karty
- **Co udelat:**
  - [ ] Kupon s pevnou castkou ktery se "odcerpava" (napr. darcek 500 Kc)
  - [ ] Zustatek po pouziti (napr. objednavka 300 Kc, zustatek 200 Kc)
- **Poznamka:** Post-Beta funkcionalita

---

## Implementacni poradi

1. **Faze 1** (Integrace) — 1-2 hodiny, SPOLECNE s #1, #16, #17
2. **Faze 2** (Backend validace) — 2-3 hodiny, po Cloud Functions/Cloud Run
3. **Faze 3** (Pokrocile) — post-Beta

**Celkem pro Beta:** ~1-2 hodiny (jen Faze 1)

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/test-kalkulacka/index.jsx` | Render CouponInput | Maly |
| `src/pages/widget-kalkulacka/index.jsx` | Render CouponInput | Maly |
| Price summary | Pridat coupon radek | Maly |
| `backend-local/` | Novy validate endpoint | Stredni |

---

## Poznamky

- Identicky pattern jako Shipping/Express — zapojit existujici komponentu
- **BEZPECNOSTNI RIZIKO:** Klientska validace je nedostatecna — zakaznik muze obejit. Pro Beta je to akceptovatelne, ale pro produkci MUSI byt backend validace.
- Kupony jsou mocny marketing nastroj — dobre fungujici system zvysi konverze

---

## Kriticke doplnky (z review)

### Backend validace — detailni flow
- [ ] Frontend posle: `POST /api/coupons/validate` s `{ code: "SLEVA10", orderSubtotal: 500, tenantId: "..." }`
- [ ] Backend kontrola (v poradi):
  1. Kupon existuje → 404 pokud ne
  2. Kupon je aktivni → "Kupon neni aktivni"
  3. Datum platnosti (start_date <= now <= end_date) → "Kupon vyprsel"
  4. Pocet pouziti < max_uses → "Kupon byl jiz vyuziit maximalne"
  5. Min order value (pokud nastaveno) → "Minimalni objednavka pro tento kupon je X Kc"
  6. Material restriction (pokud nastaveno) → "Kupon plati pouze pro material X"
- [ ] Uspesna odpoved: `{ valid: true, type: 'percentage', value: 10, description: '10% sleva' }`
- [ ] Neuspesna odpoved: `{ valid: false, reason: 'Kupon vyprsel', code: 'EXPIRED' }`

### Kupon stacking (budouci)
- [ ] Aktualne: maximalne 1 kupon na objednavku
- [ ] Budouci: moznost stackovat vice kuponu (napr. procentualni + free shipping)
- [ ] Stackovani pravidla: procentualni + fixni = OK, procentualni + procentualni = NOT OK
- [ ] Admin konfigurace: `{ allow_stacking: false }` (default)

### Anti-fraud opatreni
- [ ] Rate limiting na /api/coupons/validate — max 10 pokusu/min z jedne IP
- [ ] Logovani vsech pokusu o validaci (i neuspesnych)
- [ ] Automaticka deaktivace kuponu pri podezrelé aktivite (100+ neuspesnych pokusu)
- [ ] Kuponovy kod: min 6 znaku, case-insensitive, alfanumericke
