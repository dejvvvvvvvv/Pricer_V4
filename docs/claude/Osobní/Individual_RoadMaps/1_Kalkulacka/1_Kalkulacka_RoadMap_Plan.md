# 1. Kalkulacka (end-to-end flow) — Detailni RoadMap Plan

> **Stav:** 🟡 50% hotovo | **Priorita:** KRITICKA
> **Zavislosti na jine sekce:** Pricing Engine (#3), PrusaSlicer Backend (#2), Admin konfigurace (#4, #5, #6)
> **Kdo na nem zavisi:** Widget (#11), Checkout → Orders (#7), Stripe (#8)
> **Spolecne faze s:** Shipping (#16), Express (#17), Kupony (#18)

---

## Prehled

Hlavni zakaznicka kalkulacka — 5-step wizard kde zakaznik nahra 3D model, vybere parametry tisku, vidi cenu a objedna. Je to **nejdulezitejsi cast projektu** protoze je to to co zakaznik vidi a pouziva.

**Hlavni soubor:** `src/pages/test-kalkulacka/index.jsx` (~800+ radku)
**Route:** `/calculator` (nebo `/test-kalkulacka`)
**Komponenty:** `src/pages/test-kalkulacka/components/`

---

## Architektura kalkulacky

### 5-Step Wizard
1. **Upload** — nahraji 3D modely (STL/OBJ/3MF)
2. **Konfigurace** — material, barva, kvalita, infill, supports, presety, fees
3. **Cena** — zobrazeni ceny, fee breakdown, volume discounts
4. **Checkout** — kontaktni udaje, doprava, platba (v budoucnu)
5. **Potvrzeni** — souhrn objednavky

### Datovy flow
```
Upload → clientModelInfo (rozmery, objem)
         ↓
Backend slice → slicerResult (cas, hmotnost, vrstvy)
         ↓
Pricing Engine → cena (base + fees + markup + discounts + shipping + express - coupon)
         ↓
Checkout → objednavka do localStorage/Supabase → email potvrzeni
```

---

## Co je HOTOVO (✅)

### Upload modelu (75%)
- [x] Drag & drop upload
- [x] Multi-file upload
- [x] STL podpora (plna)
- [x] OBJ podpora (upload funguje, nahled ne)
- [x] File list se soubory

### 3D Model Viewer (70%)
- [x] STL nahled s rotaci/zoomem (Three.js)
- [x] Surface area vypocet pro STL

### Print konfigurace (90%)
- [x] Material vyber z admin konfigurace
- [x] Barva dle materialu
- [x] Kvalita (standard/high)
- [x] Infill slider
- [x] Supports toggle
- [x] Preset vyber (per-model)
- [x] Fee selekce v UI

### Slicovani (92%)
- [x] Single model slice
- [x] Batch slice (vsechny modely)
- [x] Reslice failed
- [x] Auto-recalc s debounce pri zmene konfigurace
- [x] Fallback bez presetu

### Pricing Calculator (80%)
- [x] Per-model cena
- [x] Order total
- [x] Fee breakdown
- [x] Volume discount zobrazeni

### Checkout Form (65%)
- [x] react-hook-form + zod validace
- [x] Jmeno, email, telefon, adresa, poznamky
- [x] Ulozeni objednavky do localStorage

### Shopify rezim (75%)
- [x] ShopifyCartButton jako alternativni checkout
- [x] Cart Permalink + Storefront API

---

## Co CHYBI / je potreba dodelat

### Faze 1: Upload vylepseni (Priorita: STREDNI)

#### Ukol 1.1: 3MF podpora v dropzone
- **Soubor:** Upload komponenta v `src/pages/test-kalkulacka/components/`
- **Co udelat:**
  - [ ] Pridat `.3mf` do dropzone `accept` listu: `accept={{ 'model/stl': ['.stl'], 'model/obj': ['.obj'], 'model/3mf': ['.3mf'] }}`
  - [ ] Otestovat 3MF upload pres drag&drop
- **Ocekavany rozsah:** 1-2 radky zmeny

#### Ukol 1.2: Podporovane formaty info
- **Co udelat:**
  - [ ] Zobrazit v upload zone text: "Podporovane formaty: STL, OBJ, 3MF"
  - [ ] i18n preklad

### Faze 2: 3D Viewer vylepseni (Priorita: STREDNI)

#### Ukol 2.1: OBJ preview
- **Soubor:** 3D viewer komponenta (Three.js)
- **Co udelat:**
  - [ ] Pridat OBJLoader z three.js
  - [ ] Zobrazit OBJ model s wireframe nebo basic material
  - [ ] Fallback ikona pokud loader selze
- **Technicky detail:** Three.js ma `OBJLoader` v `three/addons/loaders/OBJLoader`

#### Ukol 2.2: 3MF preview
- **Co udelat:**
  - [ ] Pridat 3MFLoader z three.js
  - [ ] Zobrazit 3MF model
  - [ ] Surface area vypocet pro OBJ a 3MF (pokud je mozny)
- **Technicky detail:** `three/addons/loaders/3MFLoader`

### Faze 3: Shipping/Express/Coupons integrace (Priorita: VYSOKA) ⚡

> **TOTO JE NEJDULEZITEJSI FAZE PRO BETA**
> Spolecna s #16 (Shipping), #17 (Express), #18 (Kupony)

#### Ukol 3.1: Overit existujici state management
- **Soubor:** `src/pages/test-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Overit ze `shippingMethods`, `expressTiers`, `coupons` se nacitaji ze storage
  - [ ] Overit ze existuji state variables pro `selectedShippingMethod`, `selectedExpressTier`, `appliedCoupon`
  - [ ] Pokud neexistuji — pridat je
  - [ ] Overit ze jsou predavany do `calculateOrderTotal()`

#### Ukol 3.2: Renderovat komponenty v JSX
- **Soubor:** `src/pages/test-kalkulacka/index.jsx`
- **Presne misto:** V kroku 3 (Pricing/Summary) nebo tesne pred checkout form
- **Co udelat:**
  - [ ] Najit render sekci pro Step 3
  - [ ] Pridat `<ShippingSelector />` s propsy:
    ```jsx
    <ShippingSelector
      methods={shippingMethods}
      selected={selectedShippingMethod}
      onChange={setSelectedShippingMethod}
      orderSubtotal={orderTotal.subtotal}
      freeThreshold={shippingConfig.freeShippingThreshold}
    />
    ```
  - [ ] Pridat `<ExpressTierSelector />` s propsy:
    ```jsx
    <ExpressTierSelector
      tiers={expressTiers}
      selected={selectedExpressTier}
      onChange={setSelectedExpressTier}
      orderSubtotal={orderTotal.subtotal}
    />
    ```
  - [ ] Pridat `<CouponInput />` s propsy:
    ```jsx
    <CouponInput
      coupons={availableCoupons}
      applied={appliedCoupon}
      onApply={setAppliedCoupon}
      onRemove={() => setAppliedCoupon(null)}
      orderSubtotal={orderTotal.subtotal}
    />
    ```

#### Ukol 3.3: Propojit s pricing engine
- **Soubor:** `src/pages/test-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Upravit volani `calculateOrderTotal()` aby prijimalo:
    - `shippingMethod: selectedShippingMethod`
    - `expressTier: selectedExpressTier`
    - `coupon: appliedCoupon`
  - [ ] Overit ze zmena shipping/express/coupon spusti auto-recalc
  - [ ] Overit ze breakdown obsahuje vsechny polozky

#### Ukol 3.4: Aktualizovat price summary
- **Soubor:** Price summary komponenta
- **Co udelat:**
  - [ ] Zobrazit radek pro shipping (nazev metody + cena, nebo ZDARMA)
  - [ ] Zobrazit radek pro express (nazev + surcharge)
  - [ ] Zobrazit radek pro kupon (nazev + sleva, zelena barva)
  - [ ] Aktualizovat celkovy total

### Faze 4: Checkout vylepseni (Priorita: VYSOKA)

#### Ukol 4.1: Vyber dopravy v checkoutu
- **Soubor:** Checkout forma / Step 4
- **Co udelat:**
  - [ ] Pokud shipping jeste nebyl vybran v kroku 3, zobrazit vyber v checkoutu
  - [ ] Zobrazit vybranou dopravu jako souhrn

#### Ukol 4.2: Vyber platebni metody
- **Co udelat:**
  - [ ] Radio buttons: "Platba kartou" / "Bankovni prevod" / "Dobirka"
  - [ ] Platba kartou → Stripe (viz #8)
  - [ ] Bankovni prevod → zobrazeni fakturacnich udaju (viz #9)
  - [ ] Dobirka → objednavka bez platby
  - [ ] **Pro Beta:** Muze byt jen "Bankovni prevod" a "Dobirka" pokud Stripe neni hotov
- **Zavislost:** Stripe (#8), Fakturace (#9)

#### Ukol 4.3: Fakturacni udaje v checkoutu
- **Co udelat:**
  - [ ] Pokud firma ma nastavenou fakturaci (#9) → zobrazit cislo uctu a VS v potvrzeni
  - [ ] Variabilni symbol = cislo objednavky
- **Zavislost:** Fakturace (#9)

#### Ukol 4.4: Email potvrzeni po objednani
- **Co udelat:**
  - [ ] Po uspesnem odeslani objednavky → trigger email
  - [ ] Email obsahuje: souhrn objednavky, platebni udaje, kontakt firmy
- **Zavislost:** Emaily (#22)

### Faze 5: Tenant izolace (Priorita: VYSOKA)

#### Ukol 5.1: Odstranit hardcoded tenant IDs
- **Soubor:** `src/pages/test-kalkulacka/index.jsx` + komponenty
- **Co udelat:**
  - [ ] Najit vsechny vyskyty `test-customer-1` nebo hardcoded IDs
  - [ ] Nahradit za `getTenantId()` z `adminTenantStorage.js`
  - [ ] Overit ze vsechny storage cteni pouzivaji spravny tenant klic

#### Ukol 5.2: Dynamicky tenant z URL/auth
- **Co udelat:**
  - [ ] Widget: tenant z `publicWidgetId` v URL (`/w/:publicWidgetId`)
  - [ ] Demo kalkulacka: tenant z auth (prihlasena firma)
  - [ ] Fallback na `getTenantId()` (localStorage)
- **Zavislost:** Auth (#20)

### Faze 6: Wizard responsivita (Priorita: NIZKA)

#### Ukol 6.1: 5-step stepper na mobilu
- **Co udelat:**
  - [ ] Stepper na mobilu — horizontalni scroll nebo kompaktni verze
  - [ ] Swipe gesta pro prechod mezi kroky
  - [ ] Tlacitka "Dalsi" / "Zpet" vzdy viditelna

---

## Implementacni poradi (doporuceny)

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 3: Shipping/Express/Coupons | 4-6h | Pricing Engine (#3) | KRITICKA |
| 2 | Faze 5: Tenant izolace | 2-3h | Zadne | VYSOKA |
| 3 | Faze 1: Upload vylepseni | 1h | Zadne | STREDNI |
| 4 | Faze 2: 3D Viewer | 3-4h | Zadne | STREDNI |
| 5 | Faze 4: Checkout | 6-10h | Stripe (#8), Fakturace (#9), Emaily (#22) | VYSOKA |
| 6 | Faze 6: Responsivita | 2-3h | Zadne | NIZKA |

**Celkem pro Beta:** ~16-27 hodin
**Kriticke pro Beta:** Faze 3 (Shipping/Express/Coupons) + Faze 5 (Tenant) = ~6-9 hodin

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Shipping/Express/Coupon komponenty nefunguji po renderovani | Nizka | Vysoky | Komponenty uz jsou testovane, jen nezapojene |
| Pricing engine neprijima spravne parametry | Stredni | Vysoky | Faze 3.3 — overit API kontrakt |
| Checkout bez Stripe neni kompletni | Vysoka | Stredni | Pro Beta: jen bank transfer + dobirka |
| Hardcoded tenant ID zpusobi data leak | Stredni | Vysoky | Faze 5 — prioritne opravit |

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/test-kalkulacka/index.jsx` | Render komponenty, state, pricing | Velky |
| `src/pages/test-kalkulacka/components/*.jsx` | Drobne upravy | Maly |
| Upload komponenta | 3MF accept | Maly |
| 3D Viewer | OBJ/3MF loader | Stredni |
| Checkout form | Doprava, platba, fakturace | Velky |
| Price summary | Novepolozky | Stredni |

---

## Kriticke UX doplnky (z review)

### Loading & Error States
- [ ] Loading spinner pri slicovani (ukazat progress — "Slicuji model 2/5...")
- [ ] Error state pri selhani slice s konkretni zpravu (ne genericke "Chyba")
- [ ] Skeleton loading pri nacitani admin konfigurace (materialy, fees)
- [ ] Disabled "Objednat" tlacitko dokud neni vse validni
- [ ] Offline detection — varovani pokud neni backend dostupny

### Validace pred objednanim
- [ ] Vsechny modely musi byt uspesne slicovane (ne failed/pending)
- [ ] Minimalni objednavka (z pricing engine) — zobrazit kolik chybi
- [ ] Email validace (format + potvrzeni)
- [ ] Telefon validace (format CZ/SK/mezinarodni)

### Pristupnost (WCAG)
- [ ] Keyboard navigace pres wizard kroky (Tab, Enter, Escape)
- [ ] Screen reader labels na vsech interaktivnich prvcich
- [ ] Focus management pri zmene kroku (focus na nadpis noveho kroku)
- [ ] Aria-live pro dynamicke ceny (screen reader oznamuje zmenu)

### Mobile UX
- [ ] Touch-friendly drag&drop (nebo upload tlacitko jako primary na mobilu)
- [ ] Sticky "Dalsi krok" tlacitko na mobilu (bottom bar)
- [ ] Cenovy souhrn vzdy viditelny (sticky sidebar nebo collapsible)

---

## Poznamky

- **NEJKRITICTEJSI UKOL:** Faze 3 — zapojit Shipping/Express/Coupons. Komponenty UZ existuji, jen nejsou renderovane!
- **DULEZITE:** Zmeny v kalkulacce se MUSI portovat do widgetu (#11) — ale BEZ checkout flow
- **DULEZITE:** Auto-recalc s debounce uz funguje — zmena shipping/express/coupon ho musi triggerovat
- **TIP:** `index.jsx` je 800+ radku — byt opatrny pri editaci, idealne menit jen konkretni sekce
- **? OTAZKA:** Maji se Shipping/Express/Coupons zobrazit v kroku 3 (Summary) nebo v kroku 4 (Checkout)?
- **? OTAZKA:** Jak resit situaci kdy zakaznik zacne vyplnovat checkout a pak zmeni model/parametry? (Invalidace checkout dat)
