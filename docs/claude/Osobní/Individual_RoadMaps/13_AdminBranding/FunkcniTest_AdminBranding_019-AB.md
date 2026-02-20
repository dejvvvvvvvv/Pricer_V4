# Funkcni Test Report: Admin Branding

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Branding — logo, nazev firmy, barvy, typografie, live preview |
| **Route** | `/admin/branding` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 019-AB |
| **Screenshot slozka** | Fotky_AdminBranding-019-AB |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Dva sloupce: nastaveni vlevo, zivy nahled vpravo |
| 1.3 | Dark theme konzistence | OK | Forge dark |
| 1.4 | "Ulozeno" badge | OK | Zeleny badge v pravem hornim rohu |

---

## 2. Funkcni testy — Informace o firme

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | NAZEV FIRMY | Editovatelny input | "Moje 3D tiskarna" — s popiskem "Tento nazev se zobrazi v kalkulacce" | OK |
| 2.2 | SLOGAN (VOLITELNE) | Editovatelny input | "Rychla kalkulace a objednavka" | OK |
| 2.3 | "Obnovit vychozi" tlacitko | Reset branding | Pritomne v pravem hornim rohu | OK |
| 2.4 | "Ulozit zmeny" tlacitko | Ulozeni | Cervene/zelene tlacitko | OK |

---

## 2b. Funkcni testy — Logo

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.5 | Logo nahled | Nahled aktualniho loga | 3D tiskarna ikona zobrazena | OK |
| 2.6 | Logo formaty | Info o podporovanych formatech | "PNG, JPG, SVG (max 2 MB)" | OK |
| 2.7 | Logo upload info | Jak se uklada | "Logo se ulozi po kliknuti na Ulozit zmeny." | OK |

---

## 2c. Funkcni testy — Nastaveni kalkulacky

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.8 | Tip box | Informace | "Tip: zde nastavujes hlavne logo/barvy/typografii a co se ukazuje v hlavicce widgetu. Rozmery, embed kod a instance widgetu nastavis ve strance Widget." | OK |
| 2.9 | "Otevrit Widget" tlacitko | Odkaz na widget stranku | Pritomne vedle nadpisu | OK |
| 2.10 | Zobrazit logo v kalkulacce | Checkbox | Zaskrtnuty (zeleny) | OK |
| 2.11 | Zobrazit nazev firmy | Checkbox | Zaskrtnuty (zeleny) | OK |
| 2.12 | Zobrazit slogan | Checkbox | Zaskrtnuty (zeleny) | OK |
| 2.13 | Zobrazit "Powered by" odznak | Checkbox s PRO badge | Zaskrtnuty + "PRO" badge (plan gating) | OK |
| 2.14 | ZAOBLENI ROHU | Slider | 12px — slider od 0px (Sharp) do 24px (Rounded) | OK |

---

## 2d. Funkcni testy — Barevne schema

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.15 | PRIMARNI BARVA | Hex input + color swatch | #2563EB (modra) — "Pouziva se pro tlacitka, zvyrazneni a akcenty" | OK |
| 2.16 | SEKUNDARNI BARVA | Hex input + color swatch | #10B981 (zelena) — "Pouziva se pro zpravy o uspechu a zvyrazneni" | OK |
| 2.17 | BARVA POZADI | Hex input + color swatch | #FFFFFF (bila) — "Pozadi kalkulacky" | OK |
| 2.18 | PREDVOLBY | Quick-set barevne schemata | 4 predvolby: Blue, Green, Purple, Orange | OK |

---

## 2e. Funkcni testy — Typografie

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.19 | RODINA PISMA | Radio button vyber | 4 moznosti: Inter (Default, aktivni), Roboto, Poppins, Open Sans | OK |

---

## 2f. Funkcni testy — Zivy nahled

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.20 | Live preview panel | Nahled kalkulacky | Pravy sloupec: "Zivy nahled" s nazvem firmy, logem, sloganem, file uploaderem, material dropdownem, "Vypocitat cenu" tlacitkem, "Powered by ModelPricer" | OK |
| 2.21 | Nazev firmy v preview | Odpovida nastaveni | "Moje 3D tiskarna" — spravne | OK |
| 2.22 | Slogan v preview | Odpovida nastaveni | "Rychla kalkulace a objednavka" — spravne | OK |
| 2.23 | Tlacitko barva v preview | Primarni barva | Modre tlacitko "Vypocitat cenu" — odpovida #2563EB | OK |
| 2.24 | Powered by text | Zobrazeny | "Powered by ModelPricer" — dole v preview | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | P1 | **Hardcoded customerId** — dle roadmapu obsahuje `test-customer-1` (neoveritelne vizualne, nutna code review) | Nahradit za `getTenantId()` — roadmap ukol 1.1 |
| 2 | P2 | Logo ulozeno jako base64 v localStorage — limit 5MB, velke soubory | Migrace na Supabase Storage — roadmap ukol 2.1 |
| 3 | P2 | Copyright footer "2025" misto "2026" | Aktualizovat Footer.jsx |
| 4 | INFO | Predvolby (Blue, Green, Purple, Orange) nezobrazi barvy vizualne — jen textove nazvy | Pridat barevne swatche k predvolbam |

---

## 4. Pozitivni nalezy

- **Zivy nahled** v realnem case — firma vidi jak bude kalkulacka vypadat
- **Kompletni branding nastaveni** — nazev, slogan, logo, barvy, typografie, zaobleni
- **Barevne schema** s 3 barvami (primarni, sekundarni, pozadi) + 4 predvolby
- **4 fonty** na vyber (Inter, Roboto, Poppins, Open Sans)
- **Plan gating** — "Powered by" odznak oznacen PRO badge
- **Zaobleni rohu** slider — jemne nastaveni od 0px do 24px
- **Toggle checkboxy** pro logo/nazev/slogan/powered by — flexibilni
- **Odkaz na Widget stranku** pro navaznou konfiguraci
- **Popis u kazde barvy** — uzivatel vi k cemu se pouziva

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Branding kompletni: info o firme, logo, kalkulacka nastaveni, barevne schema, typografie, live preview | `Fotky_AdminBranding-019-AB/AdminBranding-019-AB.png` |
| 2 | Branding — nazev, slogan, logo + zivy nahled | ss_7968zlnj0 |
| 3 | Nastaveni kalkulacky — checkboxy, zaobleni + barevne schema | (scroll ss) |
| 4 | Barevne schema detailne + typografie + footer | (scroll ss) |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Hardcoded ID fix (VYSOKA priorita — pred Beta)
- [ ] Nahradit `test-customer-1` za `getTenantId()` v AdminBranding.jsx (~1h)

### Faze 2: Supabase Storage (STREDNI priorita)
- [ ] Migrace base64 loga do Supabase Storage bucket `branding`
- [ ] Fallback chain: Supabase URL -> localStorage base64 -> default placeholder

### Faze 3: UX vylepseni (NIZKA priorita)
- [ ] Barevne swatche u predvoleb (Blue/Green/Purple/Orange)
- [ ] Font preview v radio button selectu
- [ ] Branding reset confirmation dialog

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Zivy nahled, ciste rozlozeni, informativni popisy |
| Funkcnost | 4/5 | Kompletni branding — logo, barvy, font, zaobleni, checkboxy |
| UX/pouzitelnost | 5/5 | Intuitivni, okamzity feedback v live preview |
| Stabilita | 5/5 | Zadne chyby specificky pro tuto stranku |
| **Celkem** | **19/20** | Vyborne implementovana stranka, hlavni TODO je hardcoded ID fix |

---

> Vygenerovano: 2026-02-20, Test session: S01
