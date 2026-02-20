# Rozhodnutí a diskuze — Otázky.md + RoadMap.md

> Záznam celé diskuze a všech rozhodnutí před vytvořením souborů Otázky.md a RoadMap.md.
> Datum: 2026-02-17

---

## Cíl

Z původního souboru `Starter_Text.md` vytvořit dva nové soubory:
1. **Otázky.md** — seznam otázek pro firmy (3D tisk na zakázku)
2. **RoadMap.md** — roadmapa projektu s více úrovněmi detailu

Původní `Starter_Text.md` zůstává beze změny.

---

## Rozhodnutí ke souboru Otázky.md

### Jazyk
- **Čeština** — protože je to pro komunikaci s CZ firmami

### Struktura
Dvě hlavní ODDĚLENÉ sekce:

#### Sekce 1: České firmy
1. **Stručný seznam - Obecné otázky** (před ukázáním kalkulačky, 10-15 otázek)
   - O trhu, bolestivých bodech, procesech, konkurenci
2. **Stručný seznam - Specifické otázky** (po ukázání kalkulačky, 10-15 otázek)
   - O dojmu z kalkulačky, co chybí, kolik by zaplatili
3. **Podrobný seznam - Obecné otázky** (20-30 otázek, po kategoriích)
   - Kategorie: Trh a konkurence, Procesy a workflow, Zákazníci, Cenotvorba, Materiály a technika, Marketing a prodej, Bolesti a přání
4. **Podrobný seznam - Specifické otázky** (20-30 otázek, po kategoriích)
   - Kategorie: První dojem, Funkce kalkulačky, Pricing a poplatky, Widget a integrace, Admin panel, Objednávkový flow, Willingness to pay

#### Sekce 2: Mezinárodní firmy (EU + USA)
- Stejná struktura jako CZ
- Přizpůsobené pro: jiné měny (EUR/USD), daně (VAT), doprava, platební metody, trh, konkurence, jazyk (EN)
- CZ sekce a mezinárodní sekce MUSÍ být oddělené — nejdřív celá CZ, pak celá mezinárodní

### Formátování
- Každá otázka očíslovaná (průběžné číslování v rámci sekce)
- Otázky v češtině (i pro mezinárodní sekci — je to příprava, ne pro přímé použití v EN)
- Na začátku krátký úvod vysvětlující účel dokumentu

### Existujících 5 otázek z Starter_Text.md
1. Kolik času trávíte nacenováním modelů týdně nebo denně?
2. Jak dlouho vám trvá než odpovíte klientům?
3. Jaký máte turn over rate (konverze z poptávky na objednávku)?
4. Stává se často že lidé přestanou mít zájem uprostřed oceňování nebo hned po ocenění?
5. Co vás trápí v tomto odvětví? Co byste chtěli zlepšit/zjednodušit/automatizovat?

---

## Rozhodnutí ke souboru RoadMap.md

### Jazyk
- **Čeština**

### Barevné označení
- **Emoji štítky** (funguje všude):
  - 🔴 Neimplementováno (0%)
  - 🟠 Základ (1-25%)
  - 🟡 Rozpracováno (26-60%)
  - 🟢 Skoro hotovo (61-90%)
  - ✅ Hotovo pro Beta (91-100%)

### Přesná struktura souboru (v tomto pořadí):

#### 0. Callout box o reklamacích (úplně nahoře, nad legendou)
Výrazný callout s textem:
- Reklamace mého produktu (kalkulačky) — vrácení peněz firmám
- Reklamace objednávek přes firmy — zodpovědnost nese firma, ne my
- Podmínky služby (ToS)
- Nutné vyřešit před veřejným spuštěním

#### 1. Legenda stavu
- Formát: tabulka (Varianta A z diskuze)

#### 2. Hrubá RoadMap
- Formát: **tabulka s prioritami** (# | Funkce | Stav | Priorita)
- Seřazeno podle priority: KRITICKÁ → VYSOKÁ → STŘEDNÍ → NÍZKÁ

#### 3. Detailní RoadMap (Tree)
- Odsazený seznam s emoji
- U každé položky **název + emoji + krátká poznámka** kde je potřeba
- VŠECHNY funkce z hrubé roadmapy rozvedené do tree

#### 4. Rozsáhlá detailní RoadMap
Formát pro každou funkci:
```
### X. EMOJI Název (XX%)

#### X.1 EMOJI Pod-funkce (XX%)
**Co to dělá:** [popis]
**Aktuální stav:** [co funguje]
**Jak se má chovat:** [cíl] nebo ⚠️ NUTNO DOPLNIT
**Fáze:** [stav]
**Co chybí pro Beta:** [úkoly]
**Odhadovaná práce:** Malá / Střední / Velká
**Závislosti:** [co musí být hotové předtím]
```

- Kde si nejsem jistý: `⚠️ NUTNO DOPLNIT`
- Na konci sekce: SEZNAM všech míst s ⚠️ NUTNO DOPLNIT

#### 5. Vlastní Beta Testing Roadmap
- Můj navržený plán rozdělený do fází/sprintů

#### 6. Budoucí vize — Marketplace
- Úplně poslední sekce
- Krátký popis Uber/Bolt styl marketplace, PickAndPrint, databáze modelů
- Poznámka: řeší se až po plné verzi a stálých zákaznících

### Definice Beta verze

**MUSÍ být v Beta:**
- Funkční end-to-end kalkulačka (upload → slicer → cena → objednávka)
- Stripe integrace (firma si propojí svůj Stripe účet přes Admin sekci)
- Zobrazení platebních údajů pro bankovní převod (číslo účtu firmy + variabilní symbol = číslo objednávky), firma si fakturu vystaví sama
- Funkční admin panel: Pricing, Fees, Materials, Presets, Orders, Parameters
- Widget embed (základní — logo, text, preset barvy)
- Branding (logo, barvy, název)
- Model Storage
- Doprava a shipping integrace do kalkulačky
- Express delivery integrace do kalkulačky
- Kupóny integrace do kalkulačky
- Email notifikace (alespoň potvrzení objednávky)
- Auth (PrivateRoute zapnutý, API autentizace)
- Dashboard (základní)
- Analytics (základní)
- i18n (kompletní CZ/EN)

**NEMUSÍ být v Beta:**
- Shopify/Shoptet/eshop integrace (až po Beta)
- Marketplace (vzdálená budoucnost)
- Pokročilý Widget Builder (jen základní verze)
- Team Access s reálným auth (demo stačí ale musí být funkční)

### Widget Builder pro Beta
- Zjednodušená verze
- Jen: přidání loga, změna textu, základní změna barvy přes přednastavené preset barvy
- Simple ale solidní

### Fakturace pro Beta
- Firma si v Admin nastaví své platební údaje (číslo účtu)
- Zákazníkovi se zobrazí: číslo účtu firmy + variabilní symbol (= číslo objednávky)
- Firma si fakturu vystaví sama ve svém účetním systému
- Žádné automatické generování PDF faktur

### Marketplace vize (budoucnost)
- Řeší se až po veřejném spuštění plné verze + stálí zákazníci
- Uber/Bolt styl — zákazník objedná, ukážou se mu firmy s cenami
- Nebo Foodora styl — zákazník vytvoří objednávku, firmy si vybírají
- PickAndPrint — marketplace s ready-made 3D modely
- Databáze modelů (jako Thingiverse ale s možností koupě/tisku)
- Autoři modelů dostávají podíl z prodeje

---

## Hodnocení stavu funkcí (reference)

| Funkce | Stav | % | Poznámka |
|--------|------|---|----------|
| Kalkulačka | 🟡 | 60% | Funguje ale Shipping/Express/Coupons neintegrovány, žádné Stripe |
| PrusaSlicer Backend | 🟢 | 80% | CLI, presety, health check funguje |
| Pricing Engine V3 | 🟢 | 85% | Pipeline funguje deterministicky |
| Admin Pricing | 🟢 | 85% | Materials, time, rules, discounts, preview — vše funguje |
| Admin Fees | 🟢 | 85% | MODEL/ORDER, conditions, simulator — vše funguje |
| Admin Presets | 🟢 | 80% | Upload, CRUD, default, material linking, offline |
| Admin Orders | 🟡 | 60% | Seznam, kanban, detail modal fungují, žádné notifikace/Stripe |
| Admin Parameters | 🟢 | 80% | PrusaSlicer parameter katalog |
| Widget & Embed | 🟡 | 55% | Rendering, postMessage, whitelist, BEZ checkoutu |
| Widget Builder | 🟡 | 50% | WYSIWYG funguje ale pro Beta zjednodušit |
| Branding | 🟢 | 80% | Logo, barvy, název, font, live preview |
| Model Storage | 🟡 | 55% | Drive-like, upload/download, search |
| Dashboard | 🟡 | 60% | KPI grid, edit mode, demo data |
| Analytics | 🟡 | 50% | 5 tabů, demo seed, CSV export |
| Team Access | 🟡 | 45% | Demo localStorage, ne reální auth |
| Express/Shipping | 🟡 | 45% | Admin config funguje, NENÍ v kalkulačce |
| Emails | 🟠 | 25% | Admin UI existuje, backend nepřipojen |
| Coupons | 🟡 | 40% | Admin config funguje, NENÍ v kalkulačce |
| i18n | 🟡 | 55% | 462 klíčů, hodně hardcoded textů |
| Auth/Security | 🟠 | 25% | Firebase Auth, PrivateRoute zakomentován, žádná API auth |
| Stripe | 🔴 | 0% | Neexistuje |
| Fakturace | 🔴 | 0% | Neexistuje, plán: číslo účtu + VS |
| Veřejné stránky | 🟢 | 80% | Home, Pricing, Support s Forge design |
| Account | 🟡 | 50% | Profil existuje, bez PrivateRoute |

---

## Poznámky k souborům

- Oba soubory se ukládají do: `docs/claude/Osobní/`
- Původní `Starter_Text.md` zůstává beze změny
- Všechny 3 úrovně detailu roadmapy jsou v jednom RoadMap.md
- Tento soubor (`Rozhodnutí-Diskuze.md`) slouží jako backup všech rozhodnutí
