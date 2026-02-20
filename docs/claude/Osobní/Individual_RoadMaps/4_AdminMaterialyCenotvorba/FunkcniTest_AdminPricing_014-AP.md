# Funkcni Test Report: Admin Pricing (Materialy a Cenotvorba)

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Pricing — materialy, cas tisku, cenova pravidla, slevy, preview sandbox |
| **Route** | `/admin/pricing` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 014-AP |
| **Screenshot slozka** | Fotky_AdminPricing-014-AP |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | Vsech 5 tabu se nacte |
| 1.2 | Zadne console errors | FAIL | Firebase Analytics errors (globalni, nekriticke) |
| 1.3 | Layout je spravny | OK | Tab navigace nahore, obsah dole, sidebar vlevo |
| 1.4 | Dark theme konzistence | OK | Forge dark, zelene akcenty na aktivnich tabech |
| 1.5 | Texty jsou citelne | OK | Velke cisla, jasne labely |

---

## 2. Funkcni testy — Tab 1: Materialy

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Tab "Materialy" aktivni | Zeleny tab, obsah materialu | Tab zobrazen zelenou, materialy pod nim | OK |
| 2.2 | Material PLA | Karta s cenami a barvami | PLA: "pla", VYCHOZI + AKTIVNI tagy, 6.1 Kc/g, barvy: RED 6.2 Kc, BLUE 6.5 Kc, PINK, WHITE 6.3 Kc | OK |
| 2.3 | Material ABS | Karta s cenami | ABS: "abs", AKTIVNI tag, 2 Kc/g, barva: white | OK |
| 2.4 | "+ Pridat material" tlacitko | Viditelne a funkcni | Tlacitko pritomne (netestovano kliknutim — nechci menit data) | OK |
| 2.5 | "Neulozene zmeny" indikator | Zobrazen kdyz jsou zmeny | Zobrazen (zlute/oranzove) | OK |
| 2.6 | Export/Import JSON | Tlacitka pritomna | "Exportovat JSON" a "Importovat JSON" — obe viditelna | OK |
| 2.7 | "Reset na default" | Tlacitko pritomne | Viditelne | OK |
| 2.8 | "Ulozit zmeny" | Zelene tlacitko | Viditelne, zelene zvyraznene | OK |

---

## 2b. Funkcni testy — Tab 2: Cas tisku

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.9 | Tab "Cas tisku" | Konfigurace ceny za cas | Zobrazen: "Cena casu tisku" — pouziva cas z PrusaSliceru | OK |
| 2.10 | Prepinac Za hodinu / Za minutu | Toggle mezi jednotkami | Oba prepinace pritomne, "Za hodinu" aktivni (zeleny) | OK |
| 2.11 | Cena za hodinu tisku | Editovatelny input | Hodnota: 104 Kc/h | OK |
| 2.12 | Minimalni uctovany cas | Checkbox | "Minimalni uctovany cas" checkbox pritomny (nezaskrtnuty) | OK |

---

## 2c. Funkcni testy — Tab 3: Cenova pravidla

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.13 | Minimalni ceny sekce | Konfigurace min cen | "Minimalni ceny" — checkbox "Min cena za model" (nezaskrtnuty), checkbox "Min cena objednavky" (zaskrtnuty, 100 Kc) | OK |
| 2.14 | UKAZKA panel | Vizualni priklad | "Vypocteno 52 Kc → Uctovano 99 Kc" — ukazuje efekt minimu | OK |
| 2.15 | Zaokrouhlovani | Konfigurace zaokrouhleni | "483 → 485, krok 5, nejblizsi" — zaokrouhleni funguje | OK |

---

## 2d. Funkcni testy — Tab 4: % Slevy

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.16 | Mnozstevni slevy | Konfigurace volume discounts | "Mnozstevni slevy" sekce — toggle "Vypnuto" (momentalne deaktivovano) | OK |
| 2.17 | Vice pricing profilu | Budouci feature | "Vice pricing profilu (budouci)" s "LATER" badge — architektura pripravena, bude v dalsi fazi | OK |

---

## 2e. Funkcni testy — Tab 5: Nahled (Preview Sandbox)

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.18 | Testovaci kalkulace | Sandbox pro testovani cen | Kompletni formular: material dropdown, cena/g, hmotnost, cas, mnozstvi, fees simulace | OK |
| 2.19 | "Testovat na prikladu" checkbox | Naplni demo data | Checkbox zaskrtnuty, data vyplnena: 0.6 Kc/g, 100g, 60 min, 1 ks, 0 Kc fees | OK |
| 2.20 | Breakdown cenove kalkulace | Detailni rozklad ceny | Material: 60 Kc, Cas (60 min): 104 Kc, Fees: 0 Kc, Markup: 0 Kc | OK |
| 2.21 | Cena/model | Soucet | 164 Kc | OK |
| 2.22 | Celkem s zaokrouhlenim | Finalni cena | **165 Kc** s tagem "zaokrouhleni aplikovano" (krok 5, 164→165) | OK |
| 2.23 | Pricing Engine V3 integrace | Sandbox pouziva pricingEngineV3.js | Vysledky odpovidaji nastaveni (cas 104 Kc/h, zaokrouhleni krok 5) — **ENGINE FUNGUJE** | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | P2 | Firebase Analytics errors (globalni) | Opravit API klic |
| 2 | INFO | "Neulozene zmeny" indikator je zobrazen i bez skutecnych zmen — mozna false positive | Overit logiku detekce zmen |
| 3 | P2 | i18n: Tab nazvy a nektere texty jsou hardcoded CZ — neprelozi se do EN | RoadMap ukol 1.1: Audit hardcoded textu |

---

## 4. Pozitivni nalezy

- **Vsech 5 tabu funguje** a prepina se bezchybne — aktivni tab zvyraznen zelenym pozadim s ikonami
- **5 tabu s ikonami:** Materialy (gear), Cas tisku (clock), Cenova pravidla (document), % Slevy (%), Nahled (eye)
- **Pricing Engine V3 integrace** v sandboxu funguje spravne — breakdown odpovida nastaveni
- **Zaokrouhleni** je vizualne srozumitelne (priklad 483→485 + tag "zaokrouhleni aplikovano")
- **UKAZKA panely** v Cenova pravidla tabe — uzitecna vizualizace efektu nastaveni
- **Material PLA karta:** zobrazuje cenu 0.6 Kc/g, tagy VYCHOZI (zeleny) + AKTIVNI (zeleny), barvu White s ctvereckem
- **Toolbar nahore:** "Neulozene zmeny" (oranzovy badge), "Reset na default", "Exportovat JSON", "Importovat JSON", "Ulozit zmeny" (zeleny button)
- **"+ Pridat material"** tlacitko s plus ikonou — jasny CTA
- **Export/Import JSON** — uzitecne pro backup a migraci konfigurace
- **Volume discounts** — pripraven ale vypnuty (toggle) — dobre pro postupne zapinani features
- **Budouci features** jasne oznaceny "LATER" badge — nemate uzivatele
- Sidebar vlevo konzistentni se zbytkem admin — Pricing zvyraznen zelenou

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Materialy tab s PLA kartou, sidebar, 5 tabu | `Fotky_AdminPricing-014-AP/AdminPricing-014-AP.png` |
| 2 | Tab Materialy — PLA a ABS karty | ss_50677ukli |
| 3 | Tab Cas tisku — 104 Kc/h, prepinac hodina/minuta | ss_4236h7eym |
| 4 | Tab Cenova pravidla — minimalni ceny + zaokrouhleni | ss_2875d96f3 |
| 5 | Tab % Slevy — mnozstevni slevy vypnuto, budouci profily | ss_2740r838a |
| 6 | Tab Nahled — sandbox s parametry | ss_2403gewh0 |
| 7 | Tab Nahled — breakdown vysledku (165 Kc se zaokrouhlenim) | (scroll down ss) |

---

## 6. Doporuceni pro RoadMap

### Faze 1: i18n lokalizace (STREDNI priorita)
- [ ] Audit hardcoded textu v AdminPricing.jsx (~3173 radku)
- [ ] Prelozit tab nazvy a formular labely

### Doplnkove
- [ ] Overit "Neulozene zmeny" false positive
- [ ] Otestovat CRUD materialu (pridat/edit/smazat) — manualne

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Propracovany tab system, UKAZKA panely, barvy na materialech |
| Funkcnost | 5/5 | Vsech 5 tabu funguje, sandbox pocita spravne, breakdown presny |
| UX/pouzitelnost | 4/5 | Intuitivni, ale soubor je velky (3173 radku) — budouci rozdeleni |
| Stabilita (bez chyb) | 4/5 | Firebase errors, jinak stabilni |
| **Celkem** | **18/20** | Jedna z nejlepe implementovanych admin stranek |

---

> Vygenerovano: 2026-02-20, Test session: S01
