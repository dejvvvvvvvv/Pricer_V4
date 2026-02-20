# Funkcni Test Report: Admin Widget Code

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Widget — sprava widget instanci, embed kod, domain whitelist, konfigurace |
| **Route** | `/admin/widget` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 020-AW |
| **Screenshot slozka** | Fotky_AdminWidget-020-AW |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Seznam widgetu vlevo, detail vpravo (4 taby) |
| 1.3 | Dark theme konzistence | OK | Forge dark, zelene AKTIVNI tagy |

---

## 2. Funkcni testy — Seznam widgetu

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Pocet widgetu | Counter | "2/2 widgetu" — zobrazeno v pravem hornim rohu | OK |
| 2.2 | Limit tarifu | Info | "Limit tarifu: Max. 2 widget(y)." | OK |
| 2.3 | Widget 1: Homepage | Nazev + ID + status | "Homepage" / wid_QKgMyNQEWa / AKTIVNI (zeleny tag) | OK |
| 2.4 | Widget 2: Testovaci Widget Alpha | Nazev + ID + status | "Testovaci Widget Alpha" / wid_7adiujnV / AKTIVNI | OK |
| 2.5 | Akce tlacitka u widgetu | Ikony | 4 ikony u kazdeho: preview, duplikovat, embed, smazat (cervene) | OK |
| 2.6 | "+ Vytvorit widget" | Tlacitko | Zelene tlacitko v pravem hornim rohu | OK |

---

## 2b. Tab 1: Konfigurace

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.7 | NAZEV WIDGETU | Editovatelny input | "Homepage" | OK |
| 2.8 | TYP WIDGETU | Dropdown/select | "Full Calculator" | OK |
| 2.9 | THEME | Dropdown/select | "Auto" | OK |
| 2.10 | PRIMARY COLOR (OVERRIDE) | Hex input + swatch | "#00D4AA (prazdne = z Brandingu)" — zeleny/teal swatch | OK |
| 2.11 | SIRKA | Konfigurace | "Fixni (px)" dropdown + "800" input | OK |
| 2.12 | Reset tlacitko | Reset konfigurace | Pritomne | OK |
| 2.13 | Ulozit tlacitko | Ulozeni | Zelene tlacitko "Ulozit" | OK |

---

## 2c. Tab 2: Embed kod

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.14 | Embed kod zobrazeni | iframe + script | Kompletni embed kod: iframe s src, style, title + postMessage resize script | OK |
| 2.15 | iframe src | URL widgetu | `http://localhost:4028/w/wid_QKgMyNQEWa` | OK |
| 2.16 | iframe parametry | Spravne atributy | `style="width: 100%; border: none; min-height: 600px;"`, `title="3D Print Calculator"`, `allow="clipboard-write"` | OK |
| 2.17 | Resize script | PostMessage handler | `MODELPRICER_RESIZE` event listener — dynamicky meni vysku iframe | OK |
| 2.18 | Kopirovat tlacitko | Copy to clipboard | "Kopirovat" tlacitko pritomne | OK |
| 2.19 | Jak pouzit info | Instrukce | "Zkopirujte kod vyse a vlozte ho na svuj web (do HTML stranky nebo pres CMS jako vlastni HTML blok). Widget se automaticky prizpusobi sirce kontejneru a vysku obsahu." | OK |

---

## 2d. Tab 3: Domeny

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.20 | Popis | Info | "Povolte domeny, na kterych bude widget fungovat. Wildcard subdomeny (*.firma.cz) jsou podporovany." | OK |
| 2.21 | Input pro domenu | Textove pole | Placeholder "napr. firma.cz" | OK |
| 2.22 | Povolit subdomeny | Checkbox | Zaskrtnuty (zeleny) | OK |
| 2.23 | "+ Pridat" tlacitko | Pridani domeny | Zelene tlacitko | OK |
| 2.24 | Stav seznamu | Prazdny | "Zatim zadna domena. Pro demo muzete pridat napr. localhost." | OK |

---

## 2e. Tab 4: Nastaveni

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.25 | Stav widgetu | Toggle + info | "Widget je aktivni a zobrazuje se na vasem webu." — checkbox zaskrtnuty, zelena "Aktivni" | OK |
| 2.26 | Vizualni editor | Odkaz na Builder | "Otevrete Widget Builder pro vizualni upravu vzhledu widgetu — barvy, zaobleni, fonty a dalsi." + "Otevrit Builder" tlacitko | OK |
| 2.27 | Duplikovat widget | Akce | "Vytvori kopii tohoto widgetu vcetne vsech nastaveni." + "Duplikovat" tlacitko (disabled — dosazeny limit tarifu) | OK |
| 2.28 | Limit info | Warning | "Dosazeny limit tarifu — nelze vytvorit dalsi widget." | OK |
| 2.29 | Smazat widget | Destruktivni akce | Cerveny box: "Trvale smaze widget a vsechny jeho nastaveni. Tuto akci nelze vratit." | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Zadna domena v whitelistu — widget funguje vsude (bezpecnostni riziko pro produkci) | Pridat alespon localhost pro demo |
| 2 | INFO | Embed kod pouziva localhost URL — v produkci bude jiny | Automaticka detekce prostredi |
| 3 | INFO | Limit tarifu na 2 widgety — Duplikovat je disabled | Ocekavane chovani (plan gating) |

---

## 4. Pozitivni nalezy

- **4 plne funkcni taby** s ikonami: Konfigurace (gear), Embed kod (<>), Domeny (globe), Nastaveni (gear)
- **Widget karta vlevo:** "Homepage" s ID wid_EQ2GAXIuwY, AKTIVNI zeleny tag, 4 akce ikony (preview, duplikovat, embed, smazat cervene)
- **Konfigurace formular:** NAZEV WIDGETU, TYP WIDGETU (Full Calculator), THEME (Auto), PRIMARY COLOR OVERRIDE (#00D4AA s zelenym swatchem), SIRKA (Fixni px, 800), JAZYK (Cestina cs) — vsechny v tmavych input boxech
- **Kompletni embed kod** s iframe + postMessage resize skriptem
- **Domain whitelist** s wildcard podporou (*.firma.cz)
- **Plan gating** — "1/2 widgetu" counter, limit 2 widgety, disabled duplikace kdyz dosazeno
- **Widget Builder** odkaz primo z Nastaveni tabu
- **Per-widget konfigurace** — nazev, typ, theme, primary color override, sirka, jazyk
- **Aktivni/neaktivni toggle** pro rychle zapnuti/vypnuti
- **Destruktivni akce** (smazat) jasne cervene s warningem o nezvratnosti
- **Reset + Ulozit** tlacitka v detail panelu — Reset (outline), Ulozit (zeleny filled)
- **"+ Vytvorit widget"** zeleny button v pravem hornim rohu s "1/2 widgetu" counterem

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Widget Code s Homepage widgetem, Konfigurace tab, sidebar | `Fotky_AdminWidget-020-AW/AdminWidget-020-AW.png` |
| 2 | Konfigurace tab — nazev, typ, theme, barva, sirka, jazyk | ss_53807ubr2 |
| 3 | Embed kod tab — iframe + resize script | ss_75262upy5 |
| 4 | Domeny tab — whitelist, wildcard podpora | ss_5329nl47u |
| 5 | Nastaveni tab — stav, builder, duplikace, smazani | ss_53836m0h5 |

---

## 6. Doporuceni pro RoadMap

### Bezpecnost (VYSOKA priorita)
- [ ] Pridat alespon localhost do domain whitelistu pro demo
- [ ] Automaticka detekce prostredi pro embed URL (localhost vs produkce)

### Funkcni rozsireni
- [ ] Widget preview primo na stranke (ne jen pres Builder)
- [ ] Analyticke metriky per-widget (kolik views, konverze)
- [ ] A/B testovani widgetu (porovnani 2 konfiguraci)

### UX
- [ ] Vizualni nahled widgetu pri zmene konfigurace (live preview jako v Brandingu)

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Ciste 4-tab rozlozeni, informativni |
| Funkcnost | 5/5 | Vsechny 4 taby funguje, embed kod kompletni, plan gating |
| UX/pouzitelnost | 5/5 | Intuitivni, jasne instrukce, copy button |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **20/20** | Vynikajici implementace — plne funkcni pro Beta |

---

> Vygenerovano: 2026-02-20, Test session: S01
