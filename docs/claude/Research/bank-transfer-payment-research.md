# Bank Transfer Payment ("Platba na ucet") — Research

> **Datum:** 2026-03-09
> **Agent:** mp-researcher-web
> **Scope:** Jak ceske a mezinarodni e-shopy resi platbu bankovnim prevodem
> **Zdroje:** Shoptet, WooCommerce (CZ pluginy), PrestaShop (CZ moduly), Fio API, CNB vyhlasky

---

## 1. Variabilni symbol (VS) — Generovani a formaty

### Pravidla (CNB / legislativa)
- **Max delka:** 10 cislic (pouze cislice, zadna pismena)
- **Zdroj:** Vyhlaska CNB 62/2004 Sb. (zrusena, ale format zachovan v technickych pravidlech CERTIS)
- **Slozeni:** Nemá zadna zavazna pravidla — je na prijemci/obchodnikovi
- **Ucel:** Identifikace platby pro prijemce (cislo faktury, objednavky, smlouvy apod.)
- **Zdroj:** [Wikipedie — Variabilni symbol](https://cs.wikipedia.org/wiki/Variabiln%C3%AD_symbol), [MONETA](https://www.moneta.cz/caste-dotazy/odpoved/co-je-variabilni-symbol), [Mesec.cz](https://www.mesec.cz/clanky/kodovani-peneznich-uhrad-v-platebnim-styku/)

### Bezne vzory v e-shopech

| Vzor | Priklad | Pouziva |
|------|---------|---------|
| **Cislo objednavky = VS** | `2026030042` | Shoptet (vychozi), PrestaShop moduly, WooCommerce CZ |
| **ID objednavky (DB)** | `1542` | PrestaShop (volitelne), nektere WooCommerce |
| **Sekvencni s prefixem** | `20260301` (rok+mesic+seq) | Vlastni implementace |
| **Nahodny ciselny kod** | `8374926501` | PrestaShop modul "Nahodny kod objednavky" |
| **Cislo faktury = VS** | `2026000142` | Shoptet (volba "sjednotit VS s dokladem"), iDoklad |

### Doporuceni pro ModelPricer

1. **Primarni: cislo objednavky = VS** — nejbeznejsi, zakaznik snadno sparuje
2. **Format:** `{rok4}{seq6}` napr. `2026000042` — 10 cislic, unikatni, sekvencni
3. **Alternativa:** `{prefix2}{seq8}` kde prefix = tenant identifikator (pro multi-tenant SaaS)
4. **Konfigurovatelne:** Admin si muze zvolit zdroj VS (cislo objednavky vs cislo faktury)

### Pasti
- **PrestaShop default:** Generuje alfanumericky kod objednavky (napr. `XKJQRS`) — NELZE pouzit jako VS!
  - Resi se CZ moduly: "Nahodny kod objednavky" nebo "Posloupny kod objednavky"
- **Vodici nuly:** Nuly na zacatku JSOU vyznamne (napr. `0042` != `42`)
- **Max 10 cislic:** Prekroceni = banka orize nebo odmitne

---

## 2. Potvrzovaci stranka po objednavce ("Thank You Page")

### Co zobrazuji ceske e-shopy

| Udaj | Povinnost | Poznamka |
|------|-----------|----------|
| **Cislo uctu** (cesky format) | P0 | napr. `2600000123/2010` |
| **IBAN** | P0 | Pro mezinarodni platby, format `CZ6520100000002600000123` |
| **SWIFT/BIC** | P1 | Dulezite pro zahranicni zakazniky, napr. `FIOBCZPPXXX` |
| **Variabilni symbol** | P0 | Zvyrazneny, velky font |
| **Castka k uhrade** | P0 | Presna castka vcetne DPH |
| **Mena** | P0 | CZK / EUR |
| **Datum splatnosti** | P1 | napr. "Zaplaťte do 14.03.2026" |
| **Nazev banky** | P1 | napr. "Fio banka, a.s." |
| **Konstantni symbol** | P2 | Vetsina e-shopu neuvadi (neni povinny od 2011) |
| **Specificka symbol** | P2 | Zridka pouzivany |
| **QR kod pro platbu** | P0 | Czech QR Payment standard (SPD format) |
| **Zprava pro prijemce** | P2 | Volitelne, nekdy cislo objednavky |

### QR kod — cesky standard SPD

Format: `SPD*1.0*ACC:{IBAN}*AM:{castka}*CC:{mena}*X-VS:{vs}*MSG:{zprava}`

Priklad:
```
SPD*1.0*ACC:CZ6520100000002600000123*AM:1250.00*CC:CZK*X-VS:2026000042*MSG:Objednavka 2026000042
```

Shoptet automaticky generuje QR kod na fakturach i potvrzovacich strankach.

### Best practices pro potvrzovaci stranku

1. **QR kod prominentne** — vetsina zakazniku plati mobilem
2. **Vsechny udaje kopirovatelne** (click-to-copy)
3. **Deadline zvyrazneny** — "Zaplaťte prosím do DD.MM.YYYY"
4. **Email s temito udaji** — potvrzovaci email MUSI obsahovat stejna data
5. **Upozorneni:** "Správně vyplňte variabilní symbol pro rychlé zpracování"

### Zdroje
- [Shoptet — QR platba](https://www.shoptetpay.com/cs/qr-platba/)
- [Shoptet — Fakturace nastaveni](https://podpora.shoptet.cz/fakturace/)
- [Ceske pluginy — WooCommerce QR platby](https://ceskepluginy.cz/produkt/woo-qr-platby/)

---

## 3. Admin nastaveni pro platbu prevodem

### Shoptet

| Nastaveni | Kde | Detail |
|-----------|-----|--------|
| Cislo uctu | Nastaveni > Zakladni > Meny > detail meny | Cesky format + IBAN + SWIFT |
| VS format | Fakturace > Sjednotit cislo dokladu a VS s objednavkou | Zapnuto/vypnuto |
| Splatnost | Fakturace > Vychozi doba splatnosti | 7 / 14 / 21 dni |
| QR kod na fakturach | Fakturace > QR kod | Zapnuto pokud platba prevodem |
| Konstantni symbol | Editovatelny per faktura | Volitelne |
| Specificka symbol | Editovatelny per faktura | Volitelne |
| Propojeni s bankou | Shoptet Pay > Shoptet tlacitka | Automaticke parovani |

### WooCommerce (BACS + CZ pluginy)

| Nastaveni | Kde | Detail |
|-----------|-----|--------|
| Nazev uctu | WooCommerce > Nastaveni > Platby > Bankovni prevod | Jmeno majitele uctu |
| Cislo uctu / IBAN | Tamtez — vice uctu moznych | Kazdy ucet = radek |
| Nazev banky | Tamtez | Volny text |
| BIC/SWIFT | Tamtez | Volny text |
| Instrukce | Tamtez — textove pole | Zobrazeno na thank-you page |
| VS zdroj | CZ plugin (Toret QR, Ceske pluginy) | Cislo objednavky / ID |
| QR kod | CZ plugin | Automaticky generovany |
| Parovani plateb | Toret Fio / Platiti FIO plugin | API token nastaveni |

### PrestaShop (CZ moduly)

| Nastaveni | Kde | Detail |
|-----------|-----|--------|
| Bankovni ucty | Moduly > Bankovni prevod | Vice uctu, per mena |
| VS jako | CZ modul "Bankovni prevod + QR kod" | Cislo objednavky nebo ID objednavky |
| Ciselna rada objednavek | Modul "Posloupny kod" | Sekvencni ciselny format, reset rocne |
| Automaticke parovani | Moduly Fio/CSOB/KB | Bank API token |

### Doporucene admin nastaveni pro ModelPricer

```
Admin > Nastaveni plateb > Bankovni prevod
├── Zapnout/Vypnout platbu prevodem
├── Nazev banky (text)
├── Cislo uctu (cesky format: predcisli-cislo/kod)
├── IBAN
├── SWIFT/BIC
├── Variabilni symbol — zdroj:
│   ├── [x] Cislo objednavky (default)
│   ├── [ ] Cislo faktury
│   └── [ ] Vlastni prefix + sekvence
├── Splatnost (dny): [7] [14] [21] [vlastni]
├── Instrukce pro zakaznika (textarea, i18n)
├── Generovat QR kod: [x] Ano
└── Konstantni symbol (volitelne)
```

---

## 4. Sledovani stavu platby (Payment Status Tracking)

### Metody pouzivane v CZ e-shopech

| Metoda | Slozitost | Popis | Kdo pouziva |
|--------|-----------|-------|-------------|
| **Rucni potvrzeni** | Nizka | Admin manualne oznaci objednavku jako zaplacenou | Male e-shopy, zakladni WooCommerce |
| **Bank API (automaticke)** | Stredni | Periodicky dotaz na bankovni API, parovani dle VS+castka | Shoptet Pay, Toret Fio/KB, Fio API |
| **CSV/ABO import** | Stredni | Stazeni vypisu z banky, nahrani do e-shopu, automaticke parovani | Starsi systemy, ucetni software |
| **Email parsing** | Nizka-stredni | Parsovani notifikacnich emailu z banky | CSOB modul pro PrestaShop |
| **Platebni brana** | Vysoka | Shoptet Pay, GoPay, Comgate — instant notifikace | Velke e-shopy |

### Fio banka API (nejpouzivanejsi v CZ)

- **Endpoint:** REST API, JSON/XML format
- **Autorizace:** Read-only API token (generovany v internetovem bankovnictvi)
- **Moznosti:** Stazeni pohybu na uctu za obdobi
- **Parovani:** VS + castka → automaticke oznaceni objednavky
- **Interval:** Typicky kazdych 1-3 hodiny (Toret plugin: 3h default)
- **Zdroj:** [Fio API Bankovnictvi](https://www.fio.cz/bankovni-sluzby/api-bankovnictvi)

### Dalsi banky s API

| Banka | Typ API | Poznamka |
|-------|---------|----------|
| **Fio** | REST API (vlastni) | Nejpouzivanejsi v CZ e-shopech |
| **CSOB** | Email parsing / eAPI | Payment gateway ma vlastni eAPI |
| **KB** | API (omezene) | Moduly existuji pro PrestaShop |
| **Air Bank** | Omezene | Pres treti strany (iDoklad) |
| **Raiffeisen** | API | Podpora v iDoklad |
| **Moneta** | API | Podpora v iDoklad |

### Workflow parovani

```
1. Zakaznik odesle objednavku → stav "Cekajici na platbu"
2. Zakaznik provede prevod (rucne nebo QR kodem)
3. [Automaticky] E-shop dotazuje bankovni API (kazdych 1-3h)
4. [Automaticky] Najde platbu kde VS == objednavka.vs AND castka == objednavka.total
5. [Automaticky] Zmeni stav objednavky na "Zaplaceno"
6. [Automaticky] Odesle potvrzovaci email zakaznikovi
7. [Fallback] Admin rucne sparuje platby se spatnym VS
```

### Doporuceni pro ModelPricer

**Phase 1 (MVP):**
- Rucni potvrzeni adminem (zmena stavu objednavky v admin panelu)
- Admin vidi seznam objednavek s platbou prevodem a jejich VS

**Phase 2 (budouci):**
- Fio API integrace (nejpouzivanejsi CZ banka pro e-shopy)
- CSV import vypisu (univerzalni)

---

## 5. Best Practices — Shruti

### Variabilni symbol
1. **Max 10 cislic** — neprekracuj, banky mohou orizovat
2. **Pouze cislice** — zadna pismena, zadne specialni znaky
3. **Unikatni per objednavka** — nesmí se opakovat v ramci ucetniho obdobi
4. **Sekvencni format:** `{YYYY}{NNNNNN}` je nejbeznejsi (rok + poradove cislo)
5. **Kopie VS** na: thank-you page, potvrzovaci email, faktura, QR kod

### Potvrzovaci stranka
1. **QR kod je #1 priorita** — SPD format pro CZ banky
2. **Click-to-copy** na vsech udajich (VS, IBAN, castka)
3. **Jasny deadline** — "Platba musí být připsána do DD.MM.YYYY"
4. **Upozorneni na VS** — "Pro správné přiřazení platby prosím uveďte variabilní symbol"

### Admin panel
1. **Jednoduche nastaveni** — cislo uctu, IBAN, SWIFT, splatnost
2. **VS generovani konfigurovatelne** — ale rozumny default (= cislo objednavky)
3. **QR generovani automaticke** — SPD format

### Parovani plateb
1. **Paruj dle VS + castka** — oba musi sedet
2. **Fallback pro spatny VS** — admin manualni sparovani
3. **Casticne platby** — upozorneni admina, neoznacuj jako zaplaceno
4. **Expirace** — automaticky zrusit objednavku po vyprseni splatnosti (volitelne)

---

## 6. Implementacni navrh pro ModelPricer

### Data model (navrh)

```javascript
// Objednavka — payment sekce
{
  payment: {
    method: "bank_transfer",
    status: "pending" | "paid" | "expired" | "partial",
    variable_symbol: "2026000042",      // generovany
    amount: 1250.00,
    currency: "CZK",
    due_date: "2026-03-23",             // objednavka + splatnost_dnu
    paid_at: null,                       // datum zaplaceni
    paid_amount: null,                   // skutecne zaplacena castka
    confirmed_by: null                   // admin UID ktery potvrdil
  }
}

// Admin nastaveni — namespace "payment:v1"
{
  bank_transfer: {
    enabled: true,
    bank_name: "Fio banka, a.s.",
    account_number: "2600000123/2010",   // cesky format
    iban: "CZ6520100000002600000123",
    swift_bic: "FIOBCZPPXXX",
    due_days: 14,                         // splatnost
    vs_source: "order_number",           // "order_number" | "invoice_number" | "custom"
    vs_prefix: "",                        // volitelny prefix (max 2 cislice)
    vs_next_seq: 1,                       // dalsi sekvencni cislo (pro custom)
    instructions_cs: "Zaplaťte prosím...",
    instructions_en: "Please pay...",
    generate_qr: true,
    constant_symbol: ""                  // volitelne
  }
}
```

### QR kod generovani (SPD format)

```javascript
function generateSPD({ iban, amount, currency, vs, message }) {
  const parts = [
    'SPD*1.0',
    `ACC:${iban}`,
    `AM:${amount.toFixed(2)}`,
    `CC:${currency}`,
    `X-VS:${vs}`,
  ];
  if (message) parts.push(`MSG:${message}`);
  return parts.join('*');
}
// Vysledek: "SPD*1.0*ACC:CZ65...123*AM:1250.00*CC:CZK*X-VS:2026000042*MSG:Obj 2026000042"
// QR knihovna: qrcode (npm) nebo react-qr-code
```

---

## Zdroje a citace

1. **Wikipedie — Variabilni symbol:** https://cs.wikipedia.org/wiki/Variabiln%C3%AD_symbol
2. **MONETA — Co je VS:** https://www.moneta.cz/caste-dotazy/odpoved/co-je-variabilni-symbol
3. **CNB — Symboly v platebnim styku (PDF):** https://www.cnb.cz/export/sites/cnb/cs/platebni-styk/.galleries/pravni_predpisy/download/symboly_plat_styk.pdf
4. **Mesec.cz — Kodovani uhrad:** https://www.mesec.cz/clanky/kodovani-peneznich-uhrad-v-platebnim-styku/
5. **Euro.cz — KS, VS, SS:** https://www.euro.cz/clanky/konstantni-symbol-variabilni-specificky-kdy-vyplnit-platba-povinny-dane-1442597/
6. **Shoptet — Fakturace:** https://podpora.shoptet.cz/fakturace/
7. **Shoptet — QR platba:** https://www.shoptetpay.com/cs/qr-platba/
8. **Shoptet Pay — Parovani plateb:** https://support.shoptetpay.com/cs/zakladni-nastaveni-propojeni-s-bankou/
9. **Toret — WooCommerce parovani plateb:** https://toret.cz/jak-ve-woocommerce-automatizovat-parovani-plateb-bankovnim-prevodem-a-objednavek/
10. **Toret — Fio plugin:** https://toret.cz/produkt/toret-fio/
11. **Ceske pluginy — QR platby WooCommerce:** https://ceskepluginy.cz/produkt/woo-qr-platby/
12. **PSmoduly — PrestaShop bankovni prevod + QR:** https://psmoduly.cz/platebni-modul-bankovni-prevod-qr-kod-276/platebni-moduly.htm
13. **PSmoduly — Posloupny kod objednavky:** https://psmoduly.cz/posloupny-kod-objednavky-variabilni-symbol-kazdy-rok-cislovani-od-1-137/sprava-objednavek.htm
14. **Fio banka — API Bankovnictvi:** https://www.fio.cz/bankovni-sluzby/api-bankovnictvi
15. **CSOB — eAPI wiki:** https://github.com/csob/paymentgateway/wiki/eAPI-1.5
16. **Platiti.cz — FIO WooCommerce modul:** https://www.platiti.cz/WooCommerce-BankwireFio.php
17. **FAPI — Import plateb z banky:** https://napoveda.fapi.cz/article/30-import-plateb-z-banky
