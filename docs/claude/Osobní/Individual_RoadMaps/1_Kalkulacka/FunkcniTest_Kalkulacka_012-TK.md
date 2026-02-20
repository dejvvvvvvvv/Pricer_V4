# Funkcni Test Report: Kalkulacka (Test-Kalkulacka)

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Kalkulacka — end-to-end 5-step wizard |
| **Route** | `/test-kalkulacka` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 012-TK |
| **Screenshot slozka** | Fotky_Kalkulacka-012-TK |
| **Stav** | CASTECNE FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | Nacte se spravne, Forge dark theme |
| 1.2 | Zadne console errors | FAIL | 2x Firebase Analytics error: "API key not valid" — nekriticke pro funkcnost, jen analytics nefunguji |
| 1.3 | Layout je spravny (bez overflow, bez rozbiteho CSS) | OK | Dve-sloupce layout (upload vlevo, preview vpravo), footer dole |
| 1.4 | Responsivita (zuzeni okna) | NETESTOVANO | |
| 1.5 | Dark theme / Forge design konzistence | OK | Tmave pozadi, zelene akcenty (teal), spravne fonty |
| 1.6 | Texty jsou citelne (WCAG kontrast) | OK | Bile texty na tmavem pozadi, zelene ikony dobre viditelne |

---

## 2. Funkcni testy — Step 1: Upload

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | 5-step wizard stepper zobrazen | 5 kroku s ikonami a popisy | Vsech 5 kroku viditelnych: NAHRANI SOUBORU, KONFIGURACE, KONTROLA A CENA, OBJEDNAVKA, POTVRZENI | OK |
| 2.2 | Step 1 je aktivni (zeleny) | Prvni krok zvyraznen | Zelena ikona uploadu, ostatni sede | OK |
| 2.3 | Upload zona zobrazena | Drag & drop area s instrukcemi | Zobrazena: "Pretahnete STL nebo OBJ soubory nebo kliknete pro vyber" | OK |
| 2.4 | Podporovane formaty badgy | STL, OBJ (dle roadmapu i 3MF) | Zobrazeny jen .STL a .OBJ badgy — **3MF CHYBI** (roadmap ukol 1.1) | FAIL |
| 2.5 | Max velikost zobrazena | 50MB info | "Maximalni velikost: 50MB na soubor" — spravne | OK |
| 2.6 | Tlacitko "Vybrat soubory" | Otevre file dialog | Tlacitko pritomne, nelze otestovat pres browser automation (OS dialog) | NETESTOVANO |
| 2.7 | 3D Model Preview panel | Prazdny panel s placeholder textem | "NAHLED MODELU — Po nahrani souboru se zde zobrazi nahled a metriky ze sliceru." | OK |
| 2.8 | "Pokracovat" tlacitko bez souboru | Nemelo by pokracit (validace) | Klik na "Pokracovat" nic neudelal — stranka zustala na Step 1 | OK |
| 2.9 | "Zpet" tlacitko na Step 1 | Disabled (zadny predchozi krok) | Tlacitko je disabled (sede, neaktivni) | OK |
| 2.10 | Info box "Podporovane formaty" | Zobrazen s detaily | "STL, OBJ soubory - Maximalni velikost 50MB - Vice souboru najednou" | OK |

---

## 2b. Funkcni testy — Header a navigace

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.11 | Header zobrazen | Logo + navigace | ModelPricer logo, Home, Demo kalkulacky (zelene), Cenik, Podpora, Admin | OK |
| 2.12 | Jazykovy prepinac | CZ/EN switcher | "cz CS" dropdown viditelny v headeru | OK |
| 2.13 | Auth tlacitka | Prihlasit se / Zacit zdarma | Obe tlacitka viditelna | OK |
| 2.14 | Ucet dropdown | Ucet menu | "Ucet" s dropdown sipkou | OK |
| 2.15 | Breadcrumb navigace | Dashboard > Nahrani modelu | Zobrazena spravne | OK |

---

## 2c. Funkcni testy — i18n (jazykovy prepinac)

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.16 | Jazykovy dropdown rozbaleni | Zobrazi CZ + EN moznosti | Dropdown se rozbalil: "Cestina" (checkmark) a "English" | OK |
| 2.17 | Prepnuti na English | Cela stranka v anglictine | **JEN HEADER se prelozil** (Home, Demo Calculator, Pricing, Support, Sign In, Get Started Free, Account). **OBSAH STRANKY ZUSTAL V CESTINE** — stepper nazvy, upload zona texty, preview panel, breadcrumb. | **FAIL — i18n BUG** |
| 2.18 | Prepnuti zpet na Cestinu | Vse zpet v cestine | Header se prepnul zpet na CZ (Cenik, Podpora, Prihlasit se, atd.) | OK |

> **KRITICKE ZJISTENI:** Jazykovy prepinac meni JEN header navigaci. Obsah stranky test-kalkulacka NENI napojen na i18n system (LanguageContext). Vsechny texty v kalkulacce jsou hardcoded v cestine.

---

## 2d. Funkcni testy — Shipping/Express/Coupons (dle RoadMap Faze 3)

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.16 | ShippingSelector komponenta v UI | Zobrazena v kroku 3 nebo 4 | **NELZE OVERIT** — nedostanu se na krok 3 bez nahrani souboru | NETESTOVANO |
| 2.17 | ExpressTierSelector | Zobrazena | **NELZE OVERIT** — stejny duvod | NETESTOVANO |
| 2.18 | CouponInput | Zobrazena | **NELZE OVERIT** — stejny duvod | NETESTOVANO |

> **POZNAMKA:** Pro uplne otestovani kroku 2-5 je nutne nahrat realny STL soubor. Browser automation neumi interagovat s OS file dialogem pro upload. Doporucuji manualni test.

---

## 2d. Test-kalkulacka-white

| # | Poznamka |
|---|----------|
| — | Uzivatel potvrdil ze `/test-kalkulacka-white` je jen **backup** — netestuje se |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | P2 | Firebase Analytics: "API key not valid" (2 errors v console) | Aktualizovat Firebase API klic nebo deaktivovat analytics v dev modu |
| 2 | P1 | 3MF format CHYBI v upload zone — zobrazeny jen .STL a .OBJ badgy | RoadMap ukol 1.1: Pridat `.3mf` do dropzone accept listu |
| 3 | **P1** | **i18n BUG: Prepnuti na English prelozi JEN header, obsah stranky zustava v cestine.** Wizard step nazvy, upload zona texty, preview panel, breadcrumb — vse hardcoded CZ. | Napojit vsechny texty na LanguageContext / useLanguage() hook. RoadMap #19 i18n. |
| 4 | P2 | Copyright v patice "2025" — melo by byt "2026" | Aktualizovat Footer.jsx |
| 5 | INFO | Kroky 2-5 nelze otestovat bez realneho STL souboru | Manualni test nutny |

---

## 4. Pozitivni nalezy

- 5-step wizard stepper je vizualne kvalitni — zelena aktivni ikona (upload), sede neaktivni ikony (gear, grid, cart, check), propojene dashed linkami
- Upload zona ma spravny design — dashed border (#3a3a3a), drag&drop instrukce, format badgy (.STL, .OBJ) v sedych boxech
- Dva-sloupcovy layout: hlavni upload zona (65% sirky) vlevo, NAHLED MODELU panel (35%) vpravo s placeholder ikonou braket
- Validace "Pokracovat" funguje — nechava uzivatele na Step 1 bez souboru; zelene tlacitko vpravo dole
- "Zpet" je spravne disabled na prvnim kroku (sede, neaktivni, vlevo dole)
- 3D Model Preview panel je pripraven s placeholder textem a loader ikonou (dve zavorky)
- Dark theme (Forge) je konzistentni — tmave pozadi (#0d1117), zelene (teal #10b981) akcenty pro aktivni prvky
- Header: ModelPricer logo, "Demo kalkulacky" zvyraznene zelenym buttonem, jazykovy prepinac CZ
- Footer: 3 sloupce — logo+verze vlevo (MODEL.PRICER v3.2), NAVIGACE uprostred, PRAVNI vpravo
- Breadcrumb navigace "Dashboard > Nahrani modelu" funguje
- Info box "Podporovane formaty" s ikonou (i) — STL, OBJ, max 50MB, vice souboru
- Tlacitko "Vybrat soubory" s ikonou slozky — sedy outline styl

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — 5-step wizard, upload zona, model preview, footer | `Fotky_Kalkulacka-012-TK/Kalkulacka-012-TK.png` |
| 2 | Step 1 — Upload zona, cela stranka (top) | ss_1290aeyl8 |
| 3 | Step 1 — Spodni cast s footer a "Pokracovat" | ss_486354ncv |
| 4 | Po kliknuti na "Pokracovat" bez souboru — zadna zmena (validace OK) | ss_486354ncv (beze zmeny) |
| 5 | Jazykovy prepinac dropdown (CZ aktivni, EN moznost) | ss_6297agjid |
| 6 | Po prepnuti na English — header EN ale obsah CZ (i18n bug) | ss_0449cpy77 |
| 7 | Prepnuti zpet na CZ — dropdown zobrazen | ss_5791nr31q |

---

## 6. Doporuceni pro RoadMap (mapovano na faze z planu)

### Faze 1: Upload vylepseni
- [ ] **P1:** Pridat 3MF badge a accept do dropzone (ukol 1.1) — momentalne chybi
- [ ] Aktualizovat text "Podporovane formaty" aby zahrnoval 3MF

### Faze 2: 3D Viewer
- [ ] Nelze overit bez souboru — nutny manualni test OBJ/3MF preview

### Faze 3: Shipping/Express/Coupons
- [ ] Nelze overit bez souboru — nutny manualni test zda jsou komponenty renderovane v kroku 3

### Faze 4: Checkout
- [ ] Nelze overit bez souboru — nutny manualni test formulare

### Faze 5: Tenant izolace
- [ ] Nutna code review — overit zda se pouziva `getTenantId()` misto hardcoded IDs

### Obecne
- [ ] Opravit Firebase Analytics API klic nebo deaktivovat v dev modu
- [ ] Copyright v patice je "2025" — melo by byt "2026"

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 4/5 | Forge dark theme konzistentni, ciste |
| Funkcnost | 3/5 | Step 1 funguje, ale kroky 2-5 nelze overit bez souboru; 3MF chybi |
| UX/pouzitelnost | 4/5 | Jasny wizard, dobre instrukce, validace funguje |
| Stabilita (bez chyb) | 3/5 | Firebase errors v console (nekriticke), jinak stabilni |
| **Celkem** | **14/20** | Step 1 je solidni, ale plny end-to-end test vyzaduje manualni upload souboru |

---

## 8. Doplnkove poznatky (code review — dle RoadMap)

### Overeno vizualne:
- [x] Drag & drop upload zona pritomna
- [x] Multi-file upload zminka ("Vice souboru najednou")
- [x] STL podpora — badge zobrazen
- [x] OBJ podpora — badge zobrazen
- [x] 3D Model Viewer panel pripraven
- [x] 5-step stepper s ikonami
- [x] "Pokracovat" / "Zpet" navigace

### Neovereno (nutny manualni test nebo code review):
- [ ] Realny upload a slicovani
- [ ] Material/barva/kvalita vyber (krok 2)
- [ ] Auto-recalc pri zmene konfigurace
- [ ] Pricing breakdown (krok 3)
- [ ] Volume discounts zobrazeni
- [ ] Checkout form validace (krok 4)
- [ ] Shopify rezim (ShopifyCartButton)
- [ ] Shipping/Express/Coupons komponenty (krok 3/4)

---

> Vygenerovano: 2026-02-20, Test session: S01
> Doplneni: Prubezne pri dalsim testovani
