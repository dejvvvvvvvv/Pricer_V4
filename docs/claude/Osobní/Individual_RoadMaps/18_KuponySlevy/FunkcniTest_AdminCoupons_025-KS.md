# Funkcni Test Report: Admin Kupony a akce (Coupons)

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Kupony — slevove kupony, promocni akce, nastaveni slev, kombinace |
| **Route** | `/admin/coupons` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 025-KS |
| **Screenshot slozka** | Fotky_AdminCoupons-025-KS |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | 3 taby, prehledne rozlozeni |
| 1.3 | Dark theme konzistence | OK | Forge dark |
| 1.4 | "ULOZENO" badge | OK | Zeleny badge v pravem hornim rohu |

---

## 2. Funkcni testy — Hlavicka a globalni stav

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Info | "Kupony a akce — Spravujte slevove kupony, automaticke akce a pravidla pro slevy." | OK |
| 2.2 | Global toggle | Stav systemu | "Kupony a akce zapnuty" — checkbox NEZASKRTNUTY, "Slevovy system je vypnuty." | OK |
| 2.3 | 3 taby | Navigace | Kupony (aktivni), Akce, Nastaveni | OK |
| 2.4 | "Reset" | Tlacitko | Pritomne | OK |
| 2.5 | "ULOZIT" | Tlacitko | Zelene tlacitko | OK |

---

## 2b. Tab 1: Kupony

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.6 | Nadpis sekce | Info | "SLEVOVE KUPONY — Vytvarejte a spravujte slevove kody ktere zakaznici zadavaji rucne." | OK |
| 2.7 | "+ Pridat kupon" | Tlacitko | Pritomne v pravem rohu | OK |
| 2.8 | Empty state | Prazdny seznam | "Zadne kupony — Pridejte prvni slevovy kupon." s ikonou | OK |

---

## 2c. Tab 2: Akce

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.9 | Nadpis sekce | Info | "PROMOCNI AKCE — Automaticke slevy a bannerove akce. Mohou se aplikovat automaticky nebo pres kupon." | OK |
| 2.10 | "+ Pridat akci" | Tlacitko | Pritomne v pravem rohu | OK |
| 2.11 | Empty state | Prazdny seznam | "Zadne akce — Pridejte prvni promocni akci." s ikonou | OK |

---

## 2d. Tab 3: Nastaveni

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.12 | Nadpis sekce | Info | "NASTAVENI SLEV — Globalni pravidla pro kombinovani slev a maximalni limity." | OK |
| 2.13 | Povoleni kombinaci slev | Toggle s popisem | "Pokud zapnuto, zakaznik muze pouzit vice slevovych kodu najednou." — checkbox NEZASKRTNUTY | OK |
| 2.14 | Maximalni sleva (%) | Ciselny input | "100" % — horni limit celkove slevy v procentech, "100 = bez limitu" | OK |
| 2.15 | Poznamka | Info box | Zeleny info box: "Tato nastaveni se aplikuji na vsechny kupony i akce. Maximalni sleva se pocita po slozeni vsech aplikovanych slev." | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Slevovy system je VYPNUTY — zadne kupony ani akce | Demo stav, ocekavane |
| 2 | INFO | CouponInput neni renderovan v test-kalkulacce | Ukol 1.1 v roadmapu |
| 3 | INFO | Backend validace chybi — klientska validace nedostatecna pro produkci | Ukol 2.1 v roadmapu |

---

## 4. Pozitivni nalezy

- **Hlavicka:** "Kupony a akce" s podtitulem, "ULOZENO" zeleny badge, "Reset", zeleny "ULOZIT" — konzistentni s ostatnimi admin strankami
- **Global toggle bar:** "Kupony a akce zapnuty" checkbox (nezaskrtnuty) + "Slevovy system je vypnuty." sedy text — jasne indikuje stav systemu
- **3 taby s ikonami:** Kupony (tag ikona, zeleny/teal aktivni), Akce (megafon ikona), Nastaveni (gear ikona) — ikony pred textem, zeleny underline pro aktivni tab
- **SLEVOVE KUPONY sekce:** uppercase monospace nadpis, informativni popis, "+ Pridat kupon" tlacitko v pravem rohu
- **Empty state:** velka ikona kuponu, "Zadne kupony" bold text, "Pridejte prvni slevovy kupon." sedy subtext — ciste a informativni
- **Promocni akce (tab 2)** — oddelene od kuponu, mohou se aplikovat automaticky
- **Nastaveni (tab 3)** — "Povoleni kombinaci slev" toggle, "Maximalni sleva (%)" ciselny input (100 = bez limitu), zeleny info box s vysvetlenim
- **Kupon stacking** — konfigurovatelne pravidlo pro kombinovani slev
- **Sidebar:** Coupons zvyraznen zelenou levou carou, konzistentni s admin navigaci

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Kupony a akce: global toggle, Kupony tab, empty state, sidebar | `Fotky_AdminCoupons-025-KS/AdminCoupons-025-KS.png` |
| 2 | Kupony tab — prazdny stav, global toggle vypnuty | ss_9468ouyhr |
| 3 | Akce tab — prazdny stav, "+ Pridat akci" | ss_3415cxd6g |
| 4 | Nastaveni tab — kombinace slev, max sleva %, poznamka | ss_86130zfss |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Integrace do kalkulacky (VYSOKA priorita)
- [ ] Renderovat `<CouponInput />` v test-kalkulacce
- [ ] Zobrazit slevu v price breakdown
- [ ] Widget integrace

### Faze 2: Backend validace (STREDNI priorita)
- [ ] `POST /api/coupons/validate` endpoint
- [ ] Usage tracking (pocitadlo pouziti)
- [ ] Anti-fraud opatreni (rate limiting)

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Prehledne, 3 taby, informativni texty |
| Funkcnost | 4/5 | Kompletni CRUD UI, chybi jen integrace a backend validace |
| UX/pouzitelnost | 5/5 | Intuitivni, jasne empty states, global toggle |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **19/20** | Solidni admin konfigurace, system je pripraveny na pouziti po zapojeni |

---

> Vygenerovano: 2026-02-20, Test session: S01
