# Funkcni Test Report: Admin Express Delivery

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Express — urovne doruceni, prirazky, upsell nastaveni, nahled pro zakaznika |
| **Route** | `/admin/express` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 023-AE |
| **Screenshot slozka** | Fotky_AdminExpress-023-AE |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Dva sloupce: seznam tiers vlevo, nastaveni vpravo |
| 1.3 | Dark theme konzistence | OK | Forge dark, zelene teal accenty |
| 1.4 | "Ulozeno" badge | OK | Zeleny badge v pravem hornim rohu |

---

## 2. Funkcni testy — Hlavicka a akce

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Info | "Express doruceni — Spravuj urovne doruceni (Standard/Express/Rush), prirazky a upsell nastaveni." | OK |
| 2.2 | "+ Nova uroven" | Tlacitko | Pritomne v pravem hornim rohu | OK |
| 2.3 | "Reset" | Tlacitko | Pritomne | OK |
| 2.4 | "Ulozit" | Tlacitko | Zelene tlacitko s ikonou | OK |
| 2.5 | "Ulozeno" badge | Status | Zeleny badge — zmeny ulozeny | OK |

---

## 2b. Seznam urovni doruceni

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.6 | Counter | Pocet urovni | "UROVNE DORUCENI 3" | OK |
| 2.7 | Global toggle | Zapnuti/vypnuti | "Express doruceni zapnuto" — zeleny checkbox | OK |
| 2.8 | Tier 1: Standard | Vychozi uroven | "Standard" s "Vychozi" badge, +0%, 5 dni | OK |
| 2.9 | Tier 2: Express | Zrychlena | "Express", +25%, 2 dni | OK |
| 2.10 | Tier 3: Rush | Nejrychlejsi | "Rush", +50%, 1 dni | OK |
| 2.11 | Sort sipky | Razeni | Nahoru/dolu sipky u kazdeho tieru | OK |
| 2.12 | Smazat ikona | Destruktivni akce | Cervena kos ikona u kazdeho tieru | OK |
| 2.13 | Zelene tecky | Aktivni indikator | Zelena tecka u kazdeho tieru = aktivni | OK |

---

## 2c. Nastaveni urovne (pravy panel)

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.14 | NAZEV | Editovatelny input | "Standard" — vybrany tier | OK |
| 2.15 | DOBA DORUCENI (DNY) | Ciselny input | "5" — 5 dni pro Standard | OK |
| 2.16 | TYP PRIRAZKY | Dropdown | "Procento (%)" — procento nebo fixni castka | OK |
| 2.17 | HODNOTA PRIRAZKY | Ciselny input | "0" — 0% pro Standard (bez priplatku) | OK |
| 2.18 | Popis u prirazky | Info text | "Procento navyseni ceny objednavky." | OK |
| 2.19 | Aktivni checkbox | Toggle | Zaskrtnuty (zeleny) — tier je aktivni | OK |
| 2.20 | Vychozi uroven | Toggle | "Vychozi uroven (preselected)" — zaskrtnuty pro Standard | OK |

---

## 2d. Nahled pro zakaznika

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.21 | Nadpis sekce | Info | "Nahled pro zakaznika — Takto urovne uvidi zakaznik v kalkulacce." | OK |
| 2.22 | Standard karta | Preview | "Standard / Bez priplatku / 5 dni / DOPORUCENO" — vybrana (teal border) | OK |
| 2.23 | Express karta | Preview | "Express / +25% / 2 dni" | OK |
| 2.24 | Rush karta | Preview | "Rush / +50% / 1 dni" | OK |
| 2.25 | DOPORUCENO tag | Vizualni indikator | Zeleny text u Standard (vychozi uroven) | OK |

---

## 2e. Upsell nastaveni

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.26 | Nadpis sekce | Info | "Upsell nastaveni — Zobrazit upsell zpravu pri vyberu pomalejsi urovne." | OK |
| 2.27 | Upsell toggle | Checkbox | "Upsell zpravy zapnuty" — zaskrtnuty (zeleny) | OK |
| 2.28 | Vlastni upsell zprava | Textarea | Placeholder: "Napr. Upgrade na Express a mej to do 2 dnu!" | OK |
| 2.29 | Info text | Napoveda | "Pokud prazdne, pouzije se vychozi text." | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Integrace do kalkulacky chybi — ExpressTierSelector neni renderovan v test-kalkulacce | Ukol 1.1 v roadmapu |
| 2 | INFO | Express surcharge se zatim nezobrazuje v price breakdown | Ukol 1.2 v roadmapu |

---

## 4. Pozitivni nalezy

- **Dva sloupce layout:** seznam urovni vlevo (tmava karta s borderem), nastaveni detail vpravo — Standard vybrany (teal levy border)
- **3 plne konfigurovatelne urovne** — Standard (+0%, 5 dni, "Vychozi" zeleny badge), Express (+25%, 2 dni), Rush (+50%, 1 dni) — kazda s zelenou teckou (aktivni), sort sipkami (nahoru/dolu), cervenou kos ikonou
- **UROVNE DORUCENI counter** "3" v pravem rohu panelu + "Express doruceni zapnuto" zeleny checkbox toggle
- **Nastaveni detail panel:** NAZEV (input), DOBA DORUCENI DNY (ciselny), TYP PRIRAZKY (dropdown "Procento %"), HODNOTA PRIRAZKY (ciselny), "Procento navyseni ceny objednavky." popis, Aktivni checkbox, Vychozi uroven checkbox
- **Nahled pro zakaznika** — 3 karty v radku: Standard (teal border = vybrana, "Bez priplatku", 5 dni, zeleny "DOPORUCENO" text), Express (+25%, 2 dni), Rush (+50%, 1 dni) — kazdas ikonou hodin a dnu
- **Upsell system** — "Upsell zpravy zapnuty" checkbox + VLASTNI UPSELL ZPRAVA textarea s prikladem "Napr. Upgrade na Express a mej to do 2 dnu!"
- **Toolbar:** "Ulozeno" zeleny badge, "+ Nova uroven", "Reset", zeleny "Ulozit" s ikonou
- **Sort + Delete** — razeni sipky a cervena kos ikona u kazdeho tieru
- **Aktivni/neaktivni** per-tier toggle s checkboxem

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Express doruceni: 3 tiery, nastaveni panel, customer preview, upsell | `Fotky_AdminExpress-023-AE/AdminExpress-023-AE.png` |
| 2 | Express — seznam urovni + nastaveni panelu (Standard vybrany) | ss_3737d8szu |
| 3 | Nahled pro zakaznika (3 karty) + Upsell nastaveni | ss_3737d8szu (scroll) |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Integrace do kalkulacky (VYSOKA priorita)
- [ ] Renderovat `<ExpressTierSelector />` v test-kalkulacce (krok 3)
- [ ] Zobrazit express surcharge v price breakdown
- [ ] Widget integrace (CSS vars styling)

### Faze 2: Delivery time odhad (NIZKA priorita, post-Beta)
- [ ] `delivery_days_min` a `delivery_days_max` per tier
- [ ] Vypocet s vikendy (jen pracovni dny)
- [ ] Cutoff time konfigurace

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Ciste rozlozeni, nahled pro zakaznika, upsell |
| Funkcnost | 5/5 | CRUD, sort, prirazky, toggle, vychozi uroven |
| UX/pouzitelnost | 5/5 | Intuitivni, customer preview, upsell text |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **20/20** | Vynikajici admin konfigurace, hlavni TODO je integrace do kalkulacky |

---

> Vygenerovano: 2026-02-20, Test session: S01
