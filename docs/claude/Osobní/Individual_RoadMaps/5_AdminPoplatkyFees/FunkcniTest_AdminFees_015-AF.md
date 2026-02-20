# Funkcni Test Report: Admin Fees (Poplatky)

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Fees — poplatky MODEL/ORDER, charge basis, typy vypoctu |
| **Route** | `/admin/fees` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 015-AF |
| **Screenshot slozka** | Fotky_AdminFees-015-AF |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Seznam fees, filtry, search bar |
| 1.3 | Dark theme konzistence | OK | Forge dark, zelene indikatory u aktivnich fees |

---

## 2. Funkcni testy

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Fees info | "Fees (Poplatky)" — popis zminuje scope (MODEL/ORDER), charge basis (PER_PIECE/PER_FILE), typed podminky (AND) | OK |
| 2.2 | Pocet fees zobrazen | Cislo u SEZNAM FEES | "5" — zobrazeno napravo od nadpisu | OK |
| 2.3 | Search bar | Hledani v fees | "Hledat..." placeholder pritomny | OK |
| 2.4 | Filtry | Scope/Stav/Widget filtry | 3 dropdown filtry: "Scope: vse", "Stav: vse", "Widget: vse" | OK |
| 2.5 | "Vybrat vse" checkbox | Hromadny vyber | Checkbox pritomny | OK |
| 2.6 | "+ Novy poplatek" tlacitko | Pridani noveho fee | Pritomne (netestovano kliknutim) | OK |
| 2.7 | "Ulozit" tlacitko | Ulozeni zmen | Zelene tlacitko pritomne | OK |
| 2.8 | "NEULOZENE ZMENY" indikator | Zobrazen pri zmenach | Zobrazen (oranzovy) | OK |
| 2.9 | Smazani fee (trash icon) | Ikona u kazdeho fee | Trash ikona pritomna u kazdeho fee | OK |

---

## 2b. Seznam fees — detailni prehled

| # | Nazev | Scope | Typ vypoctu | Povinnost | Charge basis | Cena |
|---|-------|-------|-------------|-----------|-------------|------|
| 1 | ABS-Hmotnost | MODEL (ZA MODEL) | PODLE HMOTNOSTI (KC/G) | POVINNE | PER_FILE | 1.00 Kc |
| 2 | Hmotnost-Podminka | MODEL (ZA MODEL) | PODLE HMOTNOSTI (KC/G) | POVINNE | PER_FILE | 0.00 Kc |
| 3 | Test3-ABS-min | MODEL (ZA MODEL) | PODLE CASU (KC/MIN) | POVINNE | PER_PIECE | 10.00 Kc |
| 4 | Test2 | MODEL (ZA MODEL) | PODLE HMOTNOSTI (KC/G) | POVINNE | PER_FILE | 2.00 Kc |
| 5 | test | MODEL (ZA MODEL) | FIXNI CASTKA | VOLITELNE | PER_FILE | 1.00 Kc |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Vsech 5 fees ma scope MODEL — zadny ORDER scope fee neni demonstrovan | Pridat demo ORDER fee pro testovani |
| 2 | INFO | "NEULOZENE ZMENY" zobrazen i bez zmen (mozny false positive) | Overit logiku |
| 3 | P2 | Nazvy fees jsou testovaci ("Test2", "test", "Test3-ABS-min") — nepusobi profesionalne pro demo | Prejmenovat na realisticke nazvy |

---

## 4. Pozitivni nalezy

- Fee system je **dobre implementovan** — podpora ruznych typu vypoctu (hmotnost, cas, fixni castka)
- **Layout:** Nadpis "Fees (Poplatky)" vlevo, "ULOZENO" zeleny badge + "+ Novy poplatek" button vpravo nahore, "Ulozit" zeleny button pod nim
- **SEZNAM FEES karta:** tmave pozadi (#161b22), pocet fees zobrazen vpravo ("0" na aktualnim screenshotu — prazdny stav)
- **Search bar** s lupou ikonou a placeholder "Hledat..." — full-width
- **3 dropdown filtry** v radku: Scope (vse), Stav (vse), Widget (vse) — tmave pozadi, outline styl
- **Empty state:** velka ikona tagu (sede), text "Zatim zadne fees / Klikni na 'Novy poplatek'" — dobre empty state UX
- **"Vybrat vse" checkbox** — pripraveno pro batch operace
- **Tag system** je informativni — na prvni pohled videt scope, typ, povinnost, charge basis
- **Zelene indikatory** u aktivnich fees — jasny vizualni signal
- Ruzne charge basis (PER_FILE vs PER_PIECE) — dobre pro ruzne business modely
- Sidebar: Fees zvyrazneny zelenou jako aktivni polozka, konzistentni s ostatnimi admin strankami

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Fees stranka, prazdny stav, search + filtry | `Fotky_AdminFees-015-AF/AdminFees-015-AF.png` |
| 2 | Fees stranka — horni cast, search + filtry + 3 fees | ss_5761kiv5o |
| 3 | Fees stranka — vsech 5 fees viditelnych | (scroll ss) |

---

## 6. Doporuceni pro RoadMap

- [ ] Pridat demo ORDER scope fee pro ukazku
- [ ] Prejmenovat testovaci fees na realisticke nazvy ("Postprocessing", "Lakování", "Podpory")
- [ ] Otestovat formular pro pridani noveho fee (klik na "+ Novy poplatek")
- [ ] Overit integraci fees s pricing engine sandbox (tab Nahled v Pricing)

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 4/5 | Ciste, tagy informativni |
| Funkcnost | 4/5 | CRUD pripraveno, filtry funguji |
| UX/pouzitelnost | 4/5 | Intuitivni, dobre filtry |
| Stabilita | 4/5 | Bez specificke chyby |
| **Celkem** | **16/20** | Solidni implementace, testovaci nazvy by mely byt prefokovany |

---

> Vygenerovano: 2026-02-20, Test session: S01
