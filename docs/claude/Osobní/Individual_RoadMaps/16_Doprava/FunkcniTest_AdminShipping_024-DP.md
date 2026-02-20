# Funkcni Test Report: Admin Doprava (Shipping)

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Doprava — metody dopravy, cenove nastaveni, doba doruceni, doprava zdarma |
| **Route** | `/admin/shipping` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 024-DP |
| **Screenshot slozka** | Fotky_AdminShipping-024-DP |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Dva sloupce: seznam metod vlevo, nastaveni vpravo |
| 1.3 | Dark theme konzistence | OK | Forge dark, zelene teal accenty |
| 1.4 | "ULOZENO" badge | OK | Zeleny badge v pravem hornim rohu |

---

## 2. Funkcni testy — Hlavicka a akce

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Info | "Doprava — Spravuj zpusoby dopravy, cenove tiery podle hmotnosti a prahu pro dopravu zdarma." | OK |
| 2.2 | "+ Nova metoda" | Tlacitko | Pritomne v pravem hornim rohu | OK |
| 2.3 | "Reset" | Tlacitko | Pritomne | OK |
| 2.4 | "ULOZIT" | Tlacitko | Zelene tlacitko s ikonou | OK |
| 2.5 | "ULOZENO" badge | Status | Zeleny badge — zmeny ulozeny | OK |

---

## 2b. Seznam metod dopravy

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.6 | Counter | Pocet metod | "METODY DOPRAVY 2" | OK |
| 2.7 | Global toggle | Zapnuti/vypnuti | "Doprava zapnuta" — zeleny checkbox | OK |
| 2.8 | Metoda 1: Standard Shipping | Placena doprava | "Standard Shipping" / Pevna cena / 99.00 CZK / 3-5 dni | OK |
| 2.9 | Metoda 2: Personal Pickup | Zdarma | "Personal Pickup" / Osobni odber / Zdarma | OK |
| 2.10 | Sort sipky | Razeni | Nahoru/dolu sipky u kazde metody | OK |
| 2.11 | Smazat ikona | Destruktivni akce | Kos ikona u kazde metody | OK |
| 2.12 | Zelene tecky | Aktivni indikator | Zelena tecka = aktivni metoda | OK |

---

## 2c. Zakladni nastaveni (pravy panel)

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.13 | Nadpis | Info | "Zakladni nastaveni — Nazev, typ, cena a doba doruceni." | OK |
| 2.14 | NAZEV | Editovatelny input | "Standard Shipping" | OK |
| 2.15 | TYP | Dropdown/select | "Pevna cena" | OK |
| 2.16 | CENA (CZK) | Ciselny input | "99" | OK |
| 2.17 | DOBA DORUCENI MIN (DNY) | Ciselny input | "3" | OK |
| 2.18 | DOBA DORUCENI MAX (DNY) | Ciselny input | "5" | OK |
| 2.19 | POPIS | Textarea | Placeholder "Kratky popis pro zakaznika..." | OK |
| 2.20 | Aktivni checkbox | Toggle | Zaskrtnuty (zeleny) | OK |

---

## 2d. Doprava zdarma

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.21 | Nadpis sekce | Info | "DOPRAVA ZDARMA — Nastav minimalni castku objednavky pro dopravu zdarma." | OK |
| 2.22 | Toggle | Checkbox | "Doprava zdarma zapnuta" — NEZASKRTNUTY (vypnuto) | OK |
| 2.23 | Threshold input | Neviditelny (skryty) | Threshold se zobrazi az po zapnuti checkboxu | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | ShippingSelector neni renderovan v test-kalkulacce — integrace chybi | Ukol 1.1 v roadmapu |
| 2 | INFO | Doprava zdarma je vypnuta — threshold neni konfigurovan | Demo nastaveni, OK |
| 3 | INFO | Personal Pickup nema nastaveni ceny (je zdarma) — spravne | OK |

---

## 4. Pozitivni nalezy

- **Dva sloupce layout:** seznam metod vlevo (tmava karta s borderem), zakladni nastaveni vpravo — Standard Shipping vybrany (teal levy border)
- **METODY DOPRAVY counter** "2" v pravem rohu + "Doprava zapnuta" zeleny checkbox toggle
- **2 plne konfigurovane metody:** Standard Shipping (zelena tecka, "Pevna cena", "99.00 CZK", "3-5 dni" s hodinami ikonou) a Personal Pickup (zelena tecka, "Osobni odber", "Zdarma" tag) — kazda se sort sipkami a kos ikonou
- **Zakladni nastaveni panel:** NAZEV (input), TYP (dropdown "Pevna cena"), CENA CZK (ciselny input "99"), DOBA DORUCENI MIN DNY ("3"), DOBA DORUCENI MAX DNY ("5"), POPIS (textarea placeholder "Kratky popis pro zakaznika..."), Aktivni checkbox (zeleny) — vsechny inputy v tmavych boxech s uppercase monospace labely
- **DOPRAVA ZDARMA sekce:** zlutavy/hnedy box s uppercase nadpisem, "Nastav minimalni castku objednavky pro dopravu zdarma.", "Doprava zdarma zapnuta" checkbox (nezaskrtnuty/vypnuto)
- **Toolbar:** "ULOZENO" zeleny badge, "+ Nova metoda", "Reset", zeleny "ULOZIT" s ikonou
- **Sort + Delete** — razeni sipky a kos ikona u kazde metody
- **Aktivni/neaktivni** per-metoda toggle s checkboxem
- **Footer:** ModelPricer v3.2, NAVIGACE + PRAVNI links, (c) 2025

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Doprava: 2 metody, zakladni nastaveni panel, doprava zdarma sekce | `Fotky_AdminShipping-024-DP/AdminShipping-024-DP.png` |
| 2 | Shipping — seznam metod + zakladni nastaveni (Standard vybrany) | ss_7593idheb |
| 3 | Doprava zdarma sekce + footer | ss_7593idheb (scroll) |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Integrace do kalkulacky (VYSOKA priorita)
- [ ] Renderovat `<ShippingSelector />` v test-kalkulacce
- [ ] Zobrazit shipping v price breakdown ("Doprava: 99 Kc" nebo "Doprava: ZDARMA")
- [ ] Progress bar k free shipping prahu
- [ ] Widget integrace (CSS vars, postMessage)

### Faze 2: Dobirka (STREDNI priorita)
- [ ] Typ metody "dobirka" (COD — Cash on Delivery)
- [ ] Priplatek za dobirku konfigurovatelny

### Faze 3: Realni dopravci (post-Beta)
- [ ] Zasilkovna API integrace
- [ ] PPL, DPD, Ceska posta
- [ ] Vyber pobocky widget

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Ciste rozlozeni, shodne s Express strankou |
| Funkcnost | 5/5 | CRUD, sort, pevna cena/osobni odber, free shipping threshold |
| UX/pouzitelnost | 5/5 | Intuitivni, jasne popisky, min/max dny |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **20/20** | Vynikajici admin konfigurace, hlavni TODO je integrace do kalkulacky |

---

> Vygenerovano: 2026-02-20, Test session: S01
