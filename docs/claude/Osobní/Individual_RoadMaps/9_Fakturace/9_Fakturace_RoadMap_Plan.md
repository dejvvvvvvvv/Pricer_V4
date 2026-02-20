# 9. Fakturace (zobrazeni platebnich udaju + VS) — Detailni RoadMap Plan

> **Stav:** 🔴 0% hotovo | **Priorita:** VYSOKA
> **Zavislosti na jine sekce:** Auth (#20) pro tenant, Orders (#7) pro cisla objednavek
> **Kdo na nem zavisi:** Checkout (#1.6), Emaily (#22)

---

## Prehled

System pro zobrazeni platebnich/fakturacnich udaju firmy zakaznikovi pri bankovnim prevodu. Neni to plny fakturacni system (ERP) — firma si sama vystavi fakturu. Tato sekce zajistuje ze zakaznik VID kam a kolik platit.

**Klicova funkce:** Po objednani s platbou prevodem zakaznik vidi: cislo uctu firmy, variabilni symbol (= cislo objednavky), castku k uhrade.

---

## Co je HOTOVO (✅)

Nic. Tato sekce je kompletne nova.

---

## Co CHYBI / je potreba dodelat

### Faze 1: Admin — Fakturacni udaje firmy (Priorita: VYSOKA)

#### Ukol 1.1: UI pro fakturacni udaje
- **Kde:** Nova sekce v AdminIntegrations.jsx NEBO nova stranka AdminBilling.jsx
- **Co udelat:**
  - [ ] Formular pro fakturacni udaje:
    - Nazev firmy
    - ICO (8 cislic)
    - DIC (CZ + 8-10 cislic)
    - Adresa sidla (ulice, mesto, PSC, stat)
    - Cislo bankovniho uctu (format: 123456789/0100)
    - IBAN (volitelne, pro zahranicni platby)
    - Kontaktni email firmy
    - Telefon firmy
  - [ ] Validace:
    - ICO: 8 cislic, kontrolni soucet (modulo 11)
    - DIC: CZ + ICO
    - Cislo uctu: format X/YYYY (X = cislo uctu, YYYY = kod banky)
    - IBAN: format CZxx xxxx xxxx xxxx xxxx xxxx
  - [ ] Ulozeni do tenant storage (namespace `billing:v1`)
  - [ ] i18n preklady

#### Ukol 1.2: Storage helper
- **Soubor:** `src/utils/adminBillingStorage.js` (NOVY)
- **Co udelat:**
  - [ ] `readBillingConfig(tenantId)` — nacteni fakturacnich udaju
  - [ ] `writeBillingConfig(tenantId, data)` — ulozeni
  - [ ] Namespace: `billing:v1`
  - [ ] Stejna struktura jako ostatni storage helpery

### Faze 2: Zobrazeni v potvrzeni objednavky (Priorita: VYSOKA)

#### Ukol 2.1: Generovani variabilniho symbolu
- **Co udelat:**
  - [ ] VS = cislo objednavky (numericke, bez pismen)
  - [ ] Format: napr. `2026000001` (rok + sekvencni cislo)
  - [ ] NEBO: posledních 10 cislic z order ID
  - [ ] VS musi byt unikatni per-tenant
- **Poznamka:** VS v CR/SK je az 10 cislic

#### Ukol 2.2: Order Confirmation stranka/komponenta
- **Soubor:** `src/pages/test-kalkulacka/components/OrderConfirmation.jsx` (NOVY nebo existujici)
- **Co udelat:**
  - [ ] Zobrazeni po uspesnem objednani s platbou prevodem:
    ```
    ✅ Objednavka #ORD-2026-00001 prijata!

    Platebni udaje:
    Cislo uctu: 123456789/0100
    Variabilni symbol: 2026000001
    Castka: 525 Kc

    Pouzijte tyto udaje pro bankovni prevod.
    Po obdrzeni platby vam potvrdime objednavku.
    ```
  - [ ] CTA: "Zkopirovat platebni udaje"
  - [ ] Stejna informace se odesle emailem
  - [ ] Pokud firma nema vyplnene udaje → zobrazit "Firma vas bude kontaktovat"

### Faze 3: Dobirka (Priorita: STREDNI)

#### Ukol 3.1: Dobirka jako platebni moznost
- **Co udelat:**
  - [ ] V checkout flow: radio button "Dobirka"
  - [ ] Konfigurovatelny priplatek za dobirku v admin (napr. +39 Kc)
  - [ ] Admin nastaveni: zapnout/vypnout dobirku, nastavit priplatek
  - [ ] Po objednani s dobirkou: "Objednavka prijata, platba pri prevzeti"
  - [ ] V Order detail: indikace ze se plati dobirkou
- **? OTAZKA:** Ma se priplatek za dobirku pridat jako shipping method nebo jako oddelena polozka?
  - Doporuceni: jako shipping method typ "COD" (Cash on Delivery)

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 1: Admin fakturacni udaje | 3-4h | Auth (#20) | VYSOKA |
| 2 | Faze 2: Zobrazeni v potvrzeni | 3-4h | Orders (#7) | VYSOKA |
| 3 | Faze 3: Dobirka | 2-3h | Shipping (#16) | STREDNI |

**Celkem pro Beta:** ~8-11 hodin

---

## Soubory ke zmene/vytvorit

| Soubor | Typ | Rozsah |
|--------|-----|--------|
| `src/pages/admin/AdminIntegrations.jsx` nebo `AdminBilling.jsx` | Fakturacni formular | Stredni |
| `src/utils/adminBillingStorage.js` | NOVY — storage helper | Maly |
| `src/pages/test-kalkulacka/components/OrderConfirmation.jsx` | NOVY/upravit | Stredni |
| `src/contexts/LanguageContext.jsx` | Nove klice | Maly |

---

## Poznamky

- Toto NENI plny fakturacni system — firma si sama vystavi fakturu
- ModelPricer jen zobrazuje kam zaplatit a generuje VS
- ICO validace v CR: modulo 11 kontrolni soucet (existuji JS knihovny)
- Pro SK: ICO je 8 cislic, DIC je SK + 10 cislic
- **? OTAZKA:** Ma admin fakturace byt v AdminIntegrations nebo oddelena stranka?

---

## Kriticke doplnky (z review)

### ICO validace — algoritmus
- [ ] Ceske ICO (8 cislic) — modulo 11 kontrolni soucet:
  ```
  Vahy: 8, 7, 6, 5, 4, 3, 2
  Soucet = sum(cifra[i] * vaha[i]) pro i=0..6
  Zbytek = soucet % 11
  Posledni cifra = (11 - zbytek) % 10
  Specialni pripady: zbytek=0 → posledni=1, zbytek=1 → posledni=0
  ```
- [ ] JS knihovna `czech-id-validator` nebo vlastni implementace (20 radku)
- [ ] Slovenska ICO: 8 cislic, jiny kontrolni soucet (modulo 11 s jinymi vahami)
- [ ] DIC = "CZ" + ICO (pro CZ) nebo "SK" + 10 cislic (pro SK)

### QR platebni kod (Ceska specificka vec)
- [ ] QR Platba — standard pro ceske bankovnictvi
  - Generovat QR kod s plaebnimi udaji (IBAN, castka, VS, zprava)
  - Format: `SPD*1.0*ACC:CZ...IBAN*AM:52500*CC:CZK*X-VS:2026000001*MSG:Objednavka ORD-2026-00001`
  - JS knihovna: `spayd` (Simple Payment Descriptor) nebo `qrcode` + manualni generovani
- [ ] Zobrazit QR kod v Order Confirmation vedle textovych udaju
- [ ] Zobrazit QR kod v emailu s potvrzenim objednavky
- [ ] Mobilni banking apps v CR/SK ctou QR kody primo — skvely UX

### Pravni pozadavky (CZ)
- [ ] Firma MUSI zobrazovat ICO a DIC na vsech obchodnich dokumentech
- [ ] Variabilni symbol je povinny pro identifikaci platby v CR bankovnictvi
- [ ] IBAN format pro CZ: CZxx xxxx xxxx xxxx xxxx xxxx (24 znaku)
- [ ] Cislo uctu v ceskem formatu: predcisli-cislo/kod_banky (napr. 0000123456/0800)
- [ ] Pro platce DPH: zobrazit DPH sazbu (21% zakladni, 12% snizena)
- [ ] Reklamacni podminky — odkaz na reklamacni rad firmy (konfigurovatelny v admin)

### Dobirka — detailni implementace
- [ ] Dobirka (COD) jako platebni metoda, ne shipping metoda
  - Duvod: zakaznik si vybira DOPRAVU (PPL, Zasilkovna) a PLATBU (kartou, prevodem, dobirkou) nezavisle
  - Priplatek za dobirku se pridava k celkove cene, ne k cene dopravy
- [ ] Admin konfigurace: `{ cod_enabled: true, cod_fee: 39, cod_fee_label: "Dobirka" }`
- [ ] V pricing engine: COD fee jako specialni ORDER-scope fee (po shipping, pred coupon)
- [ ] V checkout: radio buttons pro platebni metodu (Karta / Prevod / Dobirka)
- [ ] V order: `payment_method: 'cod' | 'bank_transfer' | 'card'`

### Proforma faktura (budouci)
- [ ] Generovani proforma faktury jako PDF (post-Beta)
- [ ] Obsahuje: udaje firmy, udaje zakaznika, polozky, DPH, celkem, platebni udaje
- [ ] Cislovani: PF-2026-00001 (oddelene od objednavek)
- [ ] Knihovna: `jspdf` nebo `puppeteer` (HTML-to-PDF) na backendu
