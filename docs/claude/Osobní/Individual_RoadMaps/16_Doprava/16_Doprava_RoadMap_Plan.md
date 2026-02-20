# 16. Doprava a Shipping — Detailni RoadMap Plan

> **Stav:** 🟡 40% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** Kalkulacka (#1) pro integraci do UI
> **Kdo na nem zavisi:** Checkout (#1.6), Fakturace (#9), Orders (#7)

---

## Prehled

System pro spravu a vyber dopravy. Admin cast (konfigurace metod dopravy) je HOTOVA. Chybi integrace do kalkulacky UI — komponenta existuje ale neni renderovana.

**Admin soubor:** `src/pages/admin/AdminShipping.jsx` (~670 radku)
**Storage:** `src/utils/adminShippingStorage.js`
**UI komponenta:** `src/pages/test-kalkulacka/components/ShippingSelector.jsx`

---

## Co je HOTOVO (✅)

### Admin konfigurace (85%)
- [x] AdminShipping.jsx — plne funkcni stranka
- [x] CRUD metod dopravy (pridani, editace, smazani)
- [x] Nazev, cena, popis pro kazdu metodu
- [x] Razeni metod (poradi zobrazeni)
- [x] Active/inactive toggle
- [x] Free shipping threshold — konfigurovatelny prah (nad X Kc zdarma)
- [x] Persist do tenant storage

### UI komponenta (70%)
- [x] ShippingSelector.jsx existuje a je funkcni
- [x] Zobrazeni dostupnych metod dopravy
- [x] Progress bar k free shipping prahu
- [x] Vyber metody

---

## Co CHYBI / je potreba dodelat

### Faze 1: Integrace do kalkulacky (Priorita: VYSOKA)

> **SPOLECNA FAZE s Kalkulackou (#1), Express (#17) a Kupony (#18)**
> Vsechny tri komponenty se integruje najednou — viz `1_Kalkulacka_RoadMap_Plan.md` sekce 1.7

#### Ukol 1.1: Renderovat ShippingSelector v kalkulacce
- **Soubor:** `src/pages/test-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Najit spravne misto v JSX — idealne v kroku 3 (Pricing/Summary) nebo v checkout sekci
  - [ ] Pridat `<ShippingSelector ... />` s propsy:
    - `shippingMethods` — seznam metod z admin storage
    - `selectedMethod` — aktualne vybrana metoda
    - `onMethodChange` — handler pro zmenu
    - `orderSubtotal` — pro free shipping progress bar
    - `freeShippingThreshold` — prah z admin storage
  - [ ] State pro `selectedShippingMethod` uz pravdepodobne existuje v index.jsx (overit)
  - [ ] Propojit s pricing engine — pouzit `shippingCost` v `calculateOrderTotal()`

#### Ukol 1.2: Zobrazit shipping v price breakdown
- **Soubor:** `src/pages/test-kalkulacka/components/PriceSummary.jsx` (nebo podobny)
- **Co udelat:**
  - [ ] Pridat radek "Doprava: 89 Kc" (nebo "Doprava: ZDARMA") do cenoveho prehledu
  - [ ] Zobrazit nazev vybrane metody
  - [ ] Vizualne odlisit (napr. sipka nebo oddeleni)

#### Ukol 1.3: Widget integrace (paralelne)
- **Soubor:** `src/pages/widget-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Stejna integrace jako v test-kalkulacce
  - [ ] Pouzit CSS vars (ne Tailwind)
  - [ ] PostMessage pro komunikaci shipping volby s parent strankou

### Faze 2: Dobirka jako metoda (Priorita: STREDNI)

#### Ukol 2.1: Dobirka v shipping metodach
- **Co udelat:**
  - [ ] Pridat typ metody "dobirka" (COD — Cash on Delivery)
  - [ ] Priplatek za dobirku (konfigurovatelny v admin)
  - [ ] V kalkulacce — pokud zakaznik zvoli dobirku, pridat priplatek
  - [ ] Propojit s checkout flow — dobirka = objednavka bez online platby
- **Zavislost:** Checkout flow (#1.6), Fakturace (#9)

### Faze 3: Realni dopravci — POST-BETA

#### Ukol 3.1: API integrace (post-Beta)
- **Co udelat:**
  - [ ] Zasilkovna API — automaticky vypocet ceny dle hmotnosti/rozmeru
  - [ ] PPL, DPD, Ceska posta — podobne
  - [ ] Vyber pobocky (Zasilkovna widget)
- **Poznamka:** Pro Beta staci manualni metody — firma si nastavi dopravce rucne

---

## Implementacni poradi

1. **Faze 1** (Integrace do kalkulacky) — 2-3 hodiny, SPOLECNE s #1, #17, #18
2. **Faze 2** (Dobirka) — 2-3 hodiny, po Stripe/Fakturaci
3. **Faze 3** (Realni dopravci) — post-Beta

**Celkem pro Beta:** ~2-3 hodiny (spolecne s kalkulackou)

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/test-kalkulacka/index.jsx` | Render ShippingSelector | Maly |
| `src/pages/widget-kalkulacka/index.jsx` | Render ShippingSelector | Maly |
| Price summary komponenta | Pridat shipping radek | Maly |
| `src/pages/admin/AdminShipping.jsx` | Pripadne COD typ | Maly |

---

## Poznamky

- **KLICOVE:** Komponenta UZ existuje a je funkcni — staci ji "zapojit" do JSX
- **KLICOVE:** Admin cast je HOTOVA — neni treba menit
- Free shipping progress bar je skvely UX detail
- Pro Beta staci manualni metody — Zasilkovna API az pozdeji

---

## Kriticke doplnky (z review)

### Free shipping UX detail
- [ ] Progress bar ukazuje kolik chybi do free shipping:
  ```
  [=======>          ] 340/500 Kc — jeste 160 Kc do dopravy zdarma!
  ```
- [ ] Pokud je `orderSubtotal >= freeShippingThreshold` → vsechny metody jsou ZDARMA
- [ ] Progress bar mizne kdyz je free shipping dosazeno
- [ ] Animace pri dosazeni thresholdu (zelena checkmark)

### Zasilkovna API (post-Beta, detailni plan)
- [ ] Zasilkovna API endpoint: `https://www.zasilkovna.cz/api/rest`
- [ ] Potrebne: API klic (z Zasilkovna admin)
- [ ] Widget pro vyber pobocky: `<zasilkovna-pickup-point>` webcomponent nebo JS callback
- [ ] Data z vybrane pobocky: `{ id, name, city, zip, address }`
- [ ] Integrace do checkout flow: po vyberu "Zasilkovna" → otevre se widget pro vyber pobocky
- [ ] Alternativni dopravci (CZ): PPL, DPD, Ceska posta, Balikovna
- [ ] Alternativni dopravci (SK): GLS, SPS, Slovenska posta
