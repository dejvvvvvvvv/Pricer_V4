# Browser Test: Widget Builder V3 -- Kompletni Testovaci Plan

**Datum vytvoreni:** 2026-02-03
**Testovana zmena:** Widget Builder V3 -- kompletni implementace (Phase 0-7)
**Dotcene stranky:** `/admin/widget`, `/admin/widget/builder/:id`, `/w/:publicWidgetId`
**Dev URL:** http://localhost:4028

---

## KONTEXT TESTU

Tento testovaci plan pokryva kompletni implementaci Widget Builder V3 -- vizualniho editoru pro embeddovatelne widgety. Zmeny zahrnuji novou Admin Widget stranku (2-sloupcovy layout), fullscreen Builder s CSS Grid layoutem, element system s 10 elementy, pokrocily color picker, quick themes, device preview (mobile/tablet/desktop), undo/redo s max 50 kroky, 5-krokovy onboarding overlay, nove widget komponenty (header, stepper, footer, skeleton), a PostMessage security. Celkem 56 theme vlastnosti, 71 i18n klicu.

---

## PRIPRAVA PRED TESTOVANIM

### Krok P1: Overeni ze dev server bezi
1. Otevri prohlizec Google Chrome
2. Do adresniho radku napis: `http://localhost:4028` a stiskni Enter
3. **Ocekavany vysledek:** Nacte se hlavni stranka ModelPricer (homepage s logem a navigaci)
4. **Pokud se stranka nenacte:** Dev server nebezi. Otevri terminal ve slozce projektu a spust `npm run dev`. Pockej az se v terminalu objevi hlaska o portu 4028

### Krok P2: Vymazani localStorage pro cisty test
1. Stiskni klavesu F12 pro otevreni DevTools
2. Klikni na zalozku "Application" v horni liste DevTools (muze byt schovanou pod sipkou >>)
3. V levem panelu DevTools klikni na "Local Storage" a pod nim na "http://localhost:4028"
4. V pravem panelu se zobrazi tabulka klicu a hodnot
5. Najdi a smaz vsechny klice zacinajici na `modelpricer:` -- klikni na radek a stiskni klavesu Delete, nebo klikni pravym tlacitkem a zvol "Delete"
6. **DULEZITE:** Konkretne smaz klice obsahujici:
   - `modelpricer:tenant_id`
   - Vsechny klice s `builder:onboarding_complete`
   - Vsechny klice s `widget_theme`
   - Vsechny klice s `widgets`
7. Obnov stranku stiskem F5
8. **Ocekavany vysledek:** Stranka se nacte znovu v cistym stavu

### Krok P3: Overeni ze existuje alespon jeden widget
1. Prejdi na URL: `http://localhost:4028/admin/widget`
2. Pockej az se stranka nacte (zmizi text "Nacitam...")
3. **Pokud vidis prazdny stav** (text "Zatim zadny widget" s ikonou krabice):
   a) Klikni na modre tlacitko "+ Vytvorit widget" v pravem hornim rohu stranky
   b) V otevrenem modalnim okne do pole "Nazev" napis: `Test Widget V3`
   c) V rozbalovacim menu "Typ" ponech vybranou moznost "Full Calculator"
   d) Klikni na modre tlacitko "Vytvorit" v pravem dolnim rohu modalu
   e) Pockej az se objevi zelena toast notifikace "Widget vytvoren" v pravem dolnim rohu obrazovky
   f) **Ocekavany vysledek:** V levem sloupci se objevi karta noveho widgetu s nazvem "Test Widget V3"
4. **Pokud uz widgety existuji:** Pokracuj na sekci A

---

## SEKCE A: ADMIN WIDGET STRANKA (`/admin/widget`)

### Ukol A1: Overeni 2-sloupcoveho layoutu

1. Prejdi na URL: `http://localhost:4028/admin/widget`
2. Pockej az se stranka nacte
3. **Vizualni kontrola -- horni bar (aw-topbar):**
   a) V leve casti stranky je velky nadpis "Widget Code" (tucny, tmave pismo)
   b) Pod nadpisem je sedy podnadpis: "Sprava widget instanci, embed kod a whitelist domen"
   c) V prave casti je zobrazeno pocitadlo widgetu ve formatu "X/Y widgetu" (sedy text)
   d) Vedle pocitadla je modre tlacitko s ikonou + a textem "Vytvorit widget"
4. **Vizualni kontrola -- 2-sloupcovy layout:**
   a) Pod hornim barem je rozlozeni se dvema sloupci
   b) Levy sloupec ma sirku priblizne 340px a obsahuje karty widgetu
   c) Pravy sloupec zabira zbytek sirky a ma bily pozadi s rameckem

**Pokud layout neni 2-sloupcovy:** Zkontroluj v DevTools (F12 -> Elements) zda existuje element s tridou `aw-layout` a ma styl `grid-template-columns: 340px 1fr`. Zapis chybu a pokracuj.

### Ukol A2: Vytvoreni noveho widgetu

1. Klikni na modre tlacitko "Vytvorit widget" v pravem hornim rohu
2. **Ocekavany vysledek:** Objevi se modalni okno s polopruhlednym tmavym pozadim
3. **Vizualni kontrola modalu:**
   a) Modal ma bily ramecek, zaoblene rohy, stin
   b) V zahlavi modalu je text "Vytvorit novy widget" (tucny, 15px)
   c) Vpravo nahore v zahlavi je male tlacitko s ikonou X
   d) V tele modalu jsou dve pole: "Nazev" (textovy input) a "Typ" (select)
   e) V zapati modalu jsou dve tlacitka: "Zrusit" (sede) a "Vytvorit" (modre s ikonou +)
4. Do pole "Nazev" napis: `Testovaci Widget Alpha`
5. V rozbalovacim menu "Typ" zvol moznost "Full Calculator"
6. Klikni na modre tlacitko "Vytvorit"
7. **Ocekavany vysledek:**
   a) Modal se zavre
   b) V pravem dolnim rohu obrazovky se objevi zelena toast notifikace s textem "Widget vytvoren"
   c) V levem sloupci se objevi nova karta widgetu s nazvem "Testovaci Widget Alpha"
   d) Karta ma barevny prouzek vlevo (modry, #2563EB)
   e) Na karte je zeleny badge "Aktivni"
   f) Pod nazvem je zobrazeno publicId monospace pismem (male sede pismo, napr. "w_abc123")

### Ukol A3: Validace vytvoreni -- kratky nazev

1. Klikni na modre tlacitko "Vytvorit widget"
2. Do pole "Nazev" napis pouze jedno pismeno: `A`
3. Klikni na modre tlacitko "Vytvorit"
4. **Ocekavany vysledek:** Objevi se cervena toast notifikace s textem "Zadej nazev (min. 2 znaky)." -- modal zustane otevreny
5. Klikni na tlacitko "Zrusit" nebo na ikonu X pro zavreni modalu

### Ukol A4: Vyber widgetu a taby

1. V levem sloupci klikni na kartu widgetu "Testovaci Widget Alpha"
2. **Ocekavany vysledek:**
   a) Karta se zvyrazni -- dostane modry ramecek a jemny modry stin
   b) V pravem sloupci se objevi tabovy panel se 4 zalozkami:
      - "Konfigurace" (ikona ozubeneho kolecka) -- aktivni/vybrana (modra spodni cara)
      - "Embed kod" (ikona kodu)
      - "Domeny" (ikona globusu)
      - "Nastaveni" (ikona ozubeneho kolecka)
   c) Pod taby je "save bar" s nazvem widgetu vlevo a tlacitky "Reset" a "Ulozit" vpravo

### Ukol A5: Konfiguracni tab -- editace

1. Na zalozce "Konfigurace" najdi pole "Nazev widgetu"
2. Vymaz stavajici text a napis: `Muj Upraveny Widget`
3. **Ocekavany vysledek:**
   a) Nad 2-sloupcovym layoutem se objevi zluty banner "Neulozene zmeny v konfiguraci widgetu."
   b) Banner ma ikonu vykricniku vlevo a dve tlacitka vpravo: "Zahodit" (sede) a "Ulozit" (modre s ikonou diskety)
   c) Tlacitko "Ulozit" v save baru uz neni sede (je aktivni)
4. V poli "Theme" zmen hodnotu z rozbalovaci menu na "Dark"
5. V poli "Primary color (override)" klikni na barevny ctverecek (color picker nativni HTML element)
6. Zvol cervenou barvu nebo rucne napis do textoveho pole vedle: `#EF4444`
7. V poli "Sirka" zmen rozbalovaci menu na "Fixni (px)"
8. Do ciselneho pole vedle napis: `600`
9. V poli "Jazyk" zmen na "Anglictina (en)"
10. Klikni na modre tlacitko "Ulozit" v save baru (nebo v dirty banneru nahore)
11. **Ocekavany vysledek:**
    a) Zelena toast notifikace "Ulozeno" se objevi v pravem dolnim rohu
    b) Zluty dirty banner zmizi
    c) Nazev widgetu v karte vlevo se zmeni na "Muj Upraveny Widget"

### Ukol A6: Embed kod tab

1. Klikni na zalozku "Embed kod" (druha zleva v tabovem panelu)
2. **Ocekavany vysledek:**
   a) Zobrazi se tmava oblast s kodem (cerne pozadi `#0f172a` se svetlym textem)
   b) Kod obsahuje `<iframe` tag s `src="http://localhost:4028/w/..."`
   c) Nad kodem je tlacitko "Kopirovat embed" nebo ikona kopirovani
3. Klikni na tlacitko pro kopirovani kodu
4. **Ocekavany vysledek:** Zelena toast notifikace "Embed kod zkopirovany"
5. Otevri libovolny textovy editor (napr. Notepad) a stiskni Ctrl+V
6. **Ocekavany vysledek:** Vlozeny text obsahuje `<iframe` tag se spravnou URL widgetu

### Ukol A7: Tab Domeny

1. Klikni na zalozku "Domeny" (treti zleva)
2. **Ocekavany vysledek:** Zobrazi se formular pro pridani domeny -- textove pole a tlacitko
3. Do textoveho pole napis: `example.com`
4. Zasvkrtni checkbox "Povolene subdomeny" (pokud existuje)
5. Klikni na tlacitko pro pridani domeny (modre tlacitko)
6. **Ocekavany vysledek:**
   a) Toast notifikace "Domena pridana"
   b) Pod formularem se objevi radek s domenou "example.com"
   c) Radek ma prepinac (toggle) pro aktivaci/deaktivaci a ikonu kosu pro smazani

### Ukol A8: Tab Nastaveni

1. Klikni na zalozku "Nastaveni" (ctvrta, posledni)
2. **Vizualni kontrola -- sekce:**
   a) **Stav widgetu:** Radek s textem "Stav widgetu", popisem a prepinacim tlacitkem (toggle). Zelena tecka + "Aktivni" pokud je widget aktivni
   b) **Vizualni editor:** Text "Vizualni editor" s popisem a velkym modrym tlacitkem "Otevrit Builder" (s ikonou palety)
   c) **Duplikovat widget:** Tlacitko "Duplikovat" (sede s ikonou CopyPlus)
   d) **Smazat widget:** Cervena oblast s tlacitkem "Smazat widget" (cervene tlacitko s ikonou kosu)

### Ukol A9: Otevreni Builderu z karty widgetu

1. V levem sloupci najdi kartu widgetu "Muj Upraveny Widget"
2. Ve spodni casti karty najdi radek s malymi ikonami (ikona palety, kopirovani, duplikace, kos)
3. Klikni na prvni ikonu (paleta -- ikona steti) -- tooltip "Otevrit Builder"
4. **Ocekavany vysledek:**
   a) URL se zmeni na `/admin/widget/builder/<ID_WIDGETU>` (napr. `/admin/widget/builder/w_abc123`)
   b) Stranka se zmeni na fullscreen builder (zmizi admin sidebar, header a footer)
   c) Pokud je to prvni navsteva, objevi se onboarding overlay (tmave polopruhledne pozadi s bilou kartou uprostred)

**Pokud se builder nenacte (bily screen):** Otevri DevTools (F12 -> Console), zapis chybovou hlasku. Zkontroluj URL -- musi obsahovat spravne ID widgetu. Pokud chyba pretrvava, oznac jako FAILED a prejdi na sekci B.

---

## SEKCE B: WIDGET BUILDER -- OTEVRENI A LAYOUT

### Ukol B1: Overeni fullscreen layoutu

1. Pokud uz nejsi v Builderu, prejdi na: `http://localhost:4028/admin/widget` a klikni na ikonu palety u libovolneho widgetu
2. Pockej az se builder nacte (zmizi text "Nacitani builderu..." a spinner)
3. **Vizualni kontrola -- celkovy layout:**
   a) Stranka zabira celou plochu prohlizece (100vh) -- zadny header, footer, ani admin sidebar
   b) Pozadi je tmave (builder pouziva dark theme s --builder-bg-primary)
   c) Layout ma 3 hlavni oblasti:
      - **Horni lista (TopBar):** Tenky bar na celou sirku, vyska cca 56px
      - **Levy panel:** Zabira priblizne 35% sirky, tmave pozadi
      - **Pravy panel:** Zabira priblizne 65% sirky, jeste tmavsi pozadi

### Ukol B2: Overeni TopBaru

1. **Vizualni kontrola -- leva cast TopBaru:**
   a) Ikona sipky doleva (tlacitko "Zpet na seznam widgetu")
   b) Text "Widget Builder" (tucny, 16px)
   c) Svisle oddelovaci cara (1px)
   d) Nazev widgetu zobrazy monospace pismem (napr. "Muj Upraveny Widget") -- je klikovatelny
2. **Vizualni kontrola -- stredni cast TopBaru:**
   a) Skupina 3 tlacitek pro prepinani zarizeni (Device Switcher)
   b) Tlacitka maji ikony: telefon (Smartphone), tablet (Tablet), monitor (Monitor)
   c) Jedno tlacitko je zvyraznene (aktivni, modre pozadi) -- defaultne Desktop (ikona monitoru)
   d) Skupina tlacitek je obalena v tmavem obdelniku se zaoblenymi rohy
3. **Vizualni kontrola -- prava cast TopBaru:**
   a) Dve ikony: Undo (sipka doleva s drobnou zatockou) a Redo (sipka doprava s zatockou)
   b) Oba by mely byt sede/neaktivni (protoze jsme jeste nic nezmenili)
   c) Svisle oddelovaci cara
   d) Text "Resetovat" (sede, klikovatelne)
   e) Zelene tlacitko "Ulozit" (pokud nebyly provedeny zmeny, je polopruhledne/disabled)

### Ukol B3: Editace nazvu widgetu v TopBaru

1. Klikni na nazev widgetu zobrazeny monospace pismem v leve casti TopBaru
2. **Ocekavany vysledek:** Text se zmeni na editovaci input pole (svetlejsi pozadi, modry ramecek focus) s oznacenym textem
3. Vymaz stavajici text a napis: `Builder Test Widget`
4. Stiskni klavesu Enter
5. **Ocekavany vysledek:**
   a) Input se zmeni zpet na textovy display
   b) Zobrazuje se novy nazev "Builder Test Widget"
   c) Tlacitko "Ulozit" by se melo stat aktivnim (zmena nazvu = isDirty)

### Ukol B4: Editace nazvu -- Escape zrusi zmeny

1. Klikni na nazev widgetu "Builder Test Widget" v TopBaru
2. Vymaz text a napis: `ZMENENY NAZEV`
3. Stiskni klavesu Escape
4. **Ocekavany vysledek:** Nazev se vrati na "Builder Test Widget" (zmena byla zrusena)

### Ukol B5: Overeni leveho panelu (3 taby)

1. **Vizualni kontrola -- levy panel:**
   a) Na vrchu panelu je tabovy bar se 3 zalozkami:
      - "Styl" (ikona sipky-kurzoru, MousePointerClick) -- defaultne aktivni
      - "Elementy" (ikona vrstev, Layers)
      - "Globalni" (ikona nastaveni, Settings2)
   b) Aktivni tab ma svetlejsi text a modrou spodni caru (2px solid)
   c) Pod taby je scrollovatelna oblast s obsahem aktualniho tabu
2. Kdyz je aktivni tab "Styl" a zadny element neni vybrany:
   a) **Ocekavany vysledek:** Zobrazi se placeholder s velkou ikonou kurzoru a textem "Kliknete na element v nahledu pro editaci"

### Ukol B6: Overeni praveho panelu (Preview)

1. **Vizualni kontrola -- pravy panel:**
   a) V pravem hornim rohu panelu je badge "LIVE PREVIEW" s zelenou pulzujici teckou a textem "Live"
   b) Badge je pouze informativni (nelze na nej klikat, ma pointerEvents: none)
   c) Uprostred panelu je vycentrovany nahled widgetu v bilem ramecku se stinem a zaoblenymi rohy
   d) Widget nahled zobrazuje: hlavicku s nazvem, stepper (3 kroky), upload zonu, a dalsi sekce

---

## SEKCE C: WIDGET BUILDER -- ELEMENT SELECTION & EDITING

### Ukol C1: Elements Tab -- zobrazeni stromu elementu

1. V levem panelu klikni na zalozku "Elementy" (druha zleva, ikona vrstev)
2. **Ocekavany vysledek -- seznam 10 elementu (shora dolu):**
   | Poradi | Nazev | Ikona | Stav |
   |--------|-------|-------|------|
   | 1 | Pozadi | Layout | Normalni |
   | 2 | Hlavicka | Type | Normalni |
   | 3 | Navigace (kroky) | ListOrdered | Normalni |
   | 4 | Upload zona | Upload | Normalni |
   | 5 | 3D Nahled | Box | Ztlumeny + badge "Non-editable" |
   | 6 | Konfigurace | Settings | Normalni |
   | 7 | Doplnkove sluzby | Receipt | Normalni |
   | 8 | Souhrn ceny | DollarSign | Normalni |
   | 9 | CTA Tlacitko | MousePointerClick | Normalni |
   | 10 | Paticka | PanelBottom | Normalni |
3. Kazdy radek elementu (krome "3D Nahled") ma vpravo maly barevny kruzek zobrazujici hlavni barvu elementu
4. Element "3D Nahled" je vizualne ztlumeny (opacity 0.5) a ma badge "Non-editable" -- nelze na nej kliknout

### Ukol C2: Vyber elementu z Elements Tab

1. V seznamu elementu klikni na radek "Hlavicka" (druhy shora, ikona Type)
2. **Ocekavany vysledek:**
   a) Radek "Hlavicka" se zvyrazni (tmavsi pozadi)
   b) Vlevo od ikony se objevi mala zelena tecka (active indicator)
   c) Panel se automaticky prepne na tab "Styl" (prvni tab)
   d) V Style tabu se zobrazi nadpis "Hlavicka" s ikonou Type
   e) Pod nadpisem jsou skupiny editoru:
      - **BARVY:** "Pozadi hlavicky" (color picker), "Nadpis" (color picker)
      - **ROZMERY:** "Velikost loga" (slider 24-80 px), "Padding hlavicky" (slider 0-48 px)
      - **STYL:** "Zarovnani" (select: left/center)
      - **TEXTY:** "Nadpis hlavicky" (textovy input), "Tagline" (textovy input)
      - **PREPINACE:** "Zobrazit tagline" (toggle/checkbox)

### Ukol C3: Vyber elementu "3D Nahled" (needitovatelny)

1. Klikni zpet na zalozku "Elementy"
2. Klikni na radek "3D Nahled" (paty shora)
3. **Ocekavany vysledek:** Nic se nestane -- klik je ignorovan (element je disabled). Tab se neprepne na "Styl"

### Ukol C4: Editace barev elementu "CTA Tlacitko"

1. V Elements tabu klikni na radek "CTA Tlacitko" (devaty, ikona MousePointerClick)
2. **Ocekavany vysledek:** Prepne se na Style tab s nadpisem "CTA Tlacitko"
3. Overeni editoru -- v sekci "BARVY" by melo byt:
   - "Tlacitko (barva)" -- aktualni barva v kruzku
   - "Tlacitko (text)" -- bily kruzek (#FFFFFF)
   - "Tlacitko (hover)" -- tmavsi odstin
4. V sekci "ROZMERY" by melo byt:
   - "Zaobleni" (slider 0-24 px)
   - "Vertikalni padding" (slider 4-24 px)
   - "Velikost textu" (slider 12-24 px)
5. V sekci "STYL" by melo byt:
   - "Stin" (select: none/subtle/medium/strong)
6. V sekci "TEXTY" by melo byt:
   - "CTA tlacitko" (textovy input s aktualnim textem)

### Ukol C5: Zmena barvy pres Style Tab a overeni live preview

1. V Style tabu pro "CTA Tlacitko" najdi editor "Tlacitko (barva)" v sekci BARVY
2. Klikni na barevny trigger tlacitko (obsahuje barevny kruzek a HEX kod)
3. **Ocekavany vysledek:** Otevre se color picker popover (viz sekce D)
4. V color pickeru do HEX textoveho pole napis: `#EF4444` (cervena)
5. Klikni na zelene tlacitko "Pouzit"
6. **Ocekavany vysledek:**
   a) Color picker se zavre
   b) Trigger tlacitko zobrazuje cerveny kruzek a text "#EF4444"
   c) **V PRAVEM PANELU (live preview):** CTA tlacitko ve widgetu by melo OKAMZITE zmenit barvu na cervenou
   d) V TopBaru se Undo tlacitko stane aktivnim (uz neni sede)
   e) Tlacitko "Ulozit" se stane aktivnim (isDirty = true)

### Ukol C6: Zmena textu pres Style Tab

1. Stale v Style tabu pro "CTA Tlacitko", najdi sekci "TEXTY"
2. V textovem poli "CTA tlacitko" vymaz stavajici text
3. Napis: `Objednat nyni`
4. **Ocekavany vysledek:** V live preview v pravem panelu se text na CTA tlacitku zmeni na "Objednat nyni"

---

## SEKCE D: WIDGET BUILDER -- COLOR PICKER

### Ukol D1: Otevreni a vizualni kontrola color pickeru

1. Pokud nejsi v Style tabu s vybranym elementem, klikni v Elements tabu na "Upload zona"
2. V sekci BARVY klikni na trigger "Pozadi" (obsahuje barevny kruzek a HEX hodnotu)
3. **Ocekavany vysledek -- Color Picker Popover:**
   a) Pod trigger tlacitkem se objevi popover panel (sirka 260px)
   b) **Gradientni oblast:** Na vrchu je farebny gradient (paleta barev s posuvnikem) -- pochazi z react-colorful (HexColorPicker)
   c) **HEX radek:** Pod gradientem je radek s labelem "HEX" vlevo a textovym polem s aktualni HEX hodnotou vpravo
   d) **Historie:** Pokud jsi uz pouzil barvy v predchozich krocich, zobrazi se sekce "HISTORIE" s malymi barevnymi kruzky (max 8)
   e) **Paleta:** Sekce "PALETA" s 8 prednastavenymi barvami v mrizce 4x2:
      - #3B82F6 (modra), #EF4444 (cervena), #10B981 (zelena), #F59E0B (zluta)
      - #8B5CF6 (fialova), #EC4899 (ruzova), #06B6D4 (tyrkysova), #6B7280 (seda)
   f) **Akcni tlacitka:** Dole jsou dve tlacitka: "Zrusit" (sede s rameckem) a "Pouzit" (zelene)

### Ukol D2: Vyber barvy z palety

1. V otevrena color pickeru klikni na druhy kruzek v palete (cerveny, #EF4444)
2. **Ocekavany vysledek:**
   a) Gradientni oblast se posune na cervenou oblast
   b) HEX pole zobrazi: `#EF4444` nebo `#ef4444`
   c) Cerveny kruzek v palete ziska modry outline (zvyrazneni aktivniho)
3. Klikni na tlacitko "Pouzit"
4. **Ocekavany vysledek:**
   a) Popover se zavre
   b) Trigger tlacitko ukazuje cervenou barvu a HEX kod
   c) Barva se okamzite projevi v live preview

### Ukol D3: Rucni zadani HEX barvy

1. Otevri znovu color picker (klikni na trigger)
2. Klikni do HEX textoveho pole
3. Vymaz stavajici hodnotu a napis: `#00FF00` (zelena)
4. **Ocekavany vysledek:**
   a) Gradientni oblast se posune na zelenou oblast
   b) HEX pole nema cerveny ramecek (validni barva)
5. Klikni na "Pouzit"
6. **Ocekavany vysledek:** Barva se zmeni na jasne zelenou v trigger i v preview

### Ukol D4: Nevalidni HEX -- validace

1. Otevri color picker
2. Do HEX pole napis: `#ZZZZZZ`
3. **Ocekavany vysledek:** HEX pole ziska cerveny ramecek (--builder-accent-error) -- nevalidni barva
4. Gradient se NEZMENI (zustane na predchozi barve)
5. Klikni na "Pouzit"
6. **Ocekavany vysledek:** Aplikuje se posledni validni barva (ne nevalidni vstup)

### Ukol D5: Zruseni zmeny (Cancel)

1. Otevri color picker
2. Zmen barvu na nejakou jinou (napr. klikni na modry kruzek v palete)
3. Klikni na tlacitko "Zrusit"
4. **Ocekavany vysledek:**
   a) Popover se zavre
   b) Trigger tlacitko stale ukazuje PUVODNI barvu (pred otevrenim pickeru)
   c) Live preview se NEZMENI

### Ukol D6: Click-outside zavira picker (cancel)

1. Otevri color picker
2. Zmen barvu na jinou (napr. posun gradient)
3. Klikni kamkoli MIMO color picker popover (napr. na prazdne misto v levem panelu)
4. **Ocekavany vysledek:** Popover se zavre a barva se VRATI na puvodni (cancel chovani, ne apply)

### Ukol D7: Historie barev

1. Otevri color picker
2. Zvol nahodnou barvu z palety a klikni "Pouzit"
3. Otevri color picker ZNOVU
4. **Ocekavany vysledek:** V sekci "HISTORIE" se objevi posledni pouzita barva jako maly kruzek
5. Opakuj 2-3 krat s ruznymi barvami
6. **Ocekavany vysledek:** Historie ukazuje vsechny pouzite barvy (nejnovejsi vlevo), max 8 polozek

---

## SEKCE E: WIDGET BUILDER -- QUICK THEMES

### Ukol E1: Otevreni GlobalTab a nalezeni Quick Themes

1. V levem panelu builderu klikni na zalozku "Globalni" (treti, ikona Settings2)
2. **Vizualni kontrola -- sekce v GlobalTab:**
   a) **TYPOGRAFIE:** Dva select dropdowny ("Font nadpisu", "Font textu") s font preview
   b) **ZAOBLENI ROHU:** Slider 0-24px s preview obdelnikem
   c) **PREDNASTAVENY TEMA:** QuickThemeDropdown -- tlacitko s ikonou palety a nazvem aktualniho tematu
   d) **EFEKTY:** Select "Stin karet" (none/subtle/medium/strong) a slider "Globalni padding" (8-48px)
   e) **SKELETON LOADING:** Dva color pickery ("Zakladni barva", "Shimmer barva")

### Ukol E2: Otevreni QuickTheme dropdownu

1. V sekci "PREDNASTAVENY TEMA" klikni na tlacitko dropdownu (zobrazuje ikonu palety + aktualni nazev)
2. **Ocekavany vysledek -- Dropdown se otevri a ukazuje:**
   a) **Modern Dark** -- 3 barevne tecky: tmave pozadi, modra, svetla
   b) **Clean Light** -- 3 tecky: svetle pozadi, zelena, tmava
   c) **Professional Blue** -- 3 tecky: svetle modre pozadi, tmava modra, tmava
   d) **Warm Neutral** -- 3 tecky: teple svetle pozadi, oranzova, tmava
   e) Oddelovaci cara
   f) **Vlastni** -- ikona palety, bez barevnych tecek
   g) Aktivni tema ma zelenou ikonku fajfky (Check) vpravo
   h) Sipka ChevronDown na triggeru se otoci o 180 stupnu

### Ukol E3: Aplikace tematu "Modern Dark"

1. V otevrenem dropdownu klikni na "Modern Dark"
2. **Pokud se objevi confirm dialog** "Neulozene zmeny budou ztraceny. Pokracovat?" -- klikni "OK"
3. **Ocekavany vysledek:**
   a) Dropdown se zavre
   b) Trigger nyni ukazuje "Modern Dark" s 3 barevnymi teckami
   c) **V LIVE PREVIEW:** Widget kompletne zmeni vzhled:
      - Pozadi se zmeni na tmave (#1A1A2E)
      - Karty maji tmavsi pozadi (#16213E)
      - Text je svetly (#EAEAEA nadpisy, #D1D5DB body text)
      - Tlacitka zustanou modra (#3B82F6)
      - Ramecky jsou tmave (#2E3340)
   d) V Style tabu (pokud je vybrany element) se hodnoty aktualizuji

### Ukol E4: Aplikace tematu "Clean Light"

1. Klikni na QuickTheme dropdown
2. Zvol "Clean Light"
3. **Ocekavany vysledek v live preview:**
   a) Pozadi se zmeni na svetle (#FAFBFC)
   b) Tlacitka zmeni barvu na zelenou (#059669)
   c) Upload zona ma zelenkave pozadi (#F0FDF4)
   d) Celkovy vzhled je cisty a svetly

### Ukol E5: Vlastni tema

1. Klikni na QuickTheme dropdown
2. Klikni na "Vlastni"
3. **Ocekavany vysledek:** Dropdown se zavre. Trigger ukazuje "Vlastni". Zadna zmena barvy (zachovaji se aktualni barvy)

### Ukol E6: Zmena typografie

1. V sekci "TYPOGRAFIE" najdi dropdown "Font nadpisu"
2. Klikni na dropdown a zvol "DM Sans"
3. **Ocekavany vysledek:** Pod dropdownem se zobrazi preview text "Ukazkovy nadpis Aa" fontem DM Sans
4. Najdi dropdown "Font textu"
5. Zvol "Poppins"
6. **Ocekavany vysledek:** Preview text "Ukazkovy text odstavce lorem ipsum." se zmeni na font Poppins
7. **V live preview:** Nadpisy a body text ve widgetu by mely pouzivat nove fonty

### Ukol E7: Zmena zaobleni rohu

1. V sekci "ZAOBLENI ROHU" najdi slider
2. Posun slider doleva na hodnotu 0 (sleduj ciselny readout vpravo od slideru)
3. **Ocekavany vysledek:**
   a) Ciselny readout ukazuje "0px"
   b) Preview obdelnik vedle ma ostre rohy (borderRadius: 0)
   c) **V live preview:** Vsechny zaoblene rohy widgetu se zmenily na ostre
4. Posun slider doprava na hodnotu 20
5. **Ocekavany vysledek:** Rohy jsou vyrazne zaoblene. Preview box ukazuje zaobleni

---

## SEKCE F: WIDGET BUILDER -- DEVICE PREVIEW

### Ukol F1: Prepnuti na mobilni nahled

1. V TopBaru najdi skupinu 3 tlacitek uprostred (Device Switcher)
2. Klikni na prvni tlacitko (ikona telefonu -- Smartphone, nalevo)
3. **Ocekavany vysledek:**
   a) Tlacitko telefonu ziska modre pozadi (aktivni stav), ikona je bila
   b) Ostatni tlacitka (tablet, desktop) maji pruhledne pozadi, ikony sede
   c) **V pravem panelu:** Widget preview se ZUZI na sirku 375px
   d) Widget preview ma MAX vysku 812px (pokud obsah presahuje, objevi se scrollbar)
   e) Zmena sirky je animovana (prechod trvajici cca 300ms)
   f) Widget je centrovany v pravem panelu (margin: 0 auto)

### Ukol F2: Prepnuti na tablet nahled

1. Klikni na prostredni tlacitko v Device Switcheru (ikona tabletu -- Tablet)
2. **Ocekavany vysledek:**
   a) Tablet tlacitko ziska modre pozadi
   b) Widget preview se roztahne na sirku 768px
   c) MAX vyska je 1024px
   d) Prechod je plynuly (animace sirky)

### Ukol F3: Prepnuti na desktop nahled

1. Klikni na treti tlacitko (ikona monitoru -- Monitor, napravo)
2. **Ocekavany vysledek:**
   a) Desktop tlacitko ziska modre pozadi
   b) Widget preview zabira 100% sirky (max 1200px)
   c) Zadne omezeni max vysky
   d) Widget je plne rozbaleny

### Ukol F4: Rychle prepinani -- vizualni kontrola animace

1. Rychle klikej mezi Mobile -> Desktop -> Tablet -> Mobile
2. **Ocekavany vysledek:** Kazdy prechod je plynuly s animaci sirky (transition: width 300ms ease). Zadne trhani, zadne chyby v konzoli

---

## SEKCE G: WIDGET BUILDER -- UNDO / REDO

### Ukol G1: Priprava -- provedeni nekolika zmen

1. Klikni na tab "Elementy" a vyber "Pozadi"
2. V Style tabu zmen barvu "Pozadi" na: `#F0F0F0` (klikni na color picker, napis hex, klikni "Pouzit")
3. Vyber element "Hlavicka" (klikni v Elements tabu)
4. Zmen barvu "Pozadi hlavicky" na: `#FF0000` (cervena)
5. Zmen text "Nadpis hlavicky" na: `Zmeneho Hlavicka`
6. **Stav po priprave:** Byly provedeny 3 zmeny. Undo tlacitko by melo byt aktivni (ne sede)

### Ukol G2: Undo pomoci tlacitka

1. V TopBaru klikni na tlacitko Undo (ikona sipky doleva s zatockou, vlevo od Redo)
2. **Ocekavany vysledek:**
   a) Posledni zmena (text "Zmeneho Hlavicka") se vrati na predchozi hodnotu
   b) Redo tlacitko se stane aktivnim
   c) V live preview se text nadpisu zmeni zpet
3. Klikni na Undo znovu
4. **Ocekavany vysledek:** Barva hlavicky se vrati z cervene na predchozi barvu

### Ukol G3: Redo pomoci tlacitka

1. Klikni na Redo tlacitko (ikona sipky doprava s zatockou)
2. **Ocekavany vysledek:** Barva hlavicky se znovu zmeni na cervenou (#FF0000)
3. Klikni na Redo znovu
4. **Ocekavany vysledek:** Text nadpisu se zmeni zpet na "Zmeneho Hlavicka"

### Ukol G4: Keyboard shortcut -- Ctrl+Z (Undo)

1. Proved dalsi zmenu: Vyber element "Paticka" a zmen barvu "Pozadi" na `#333333`
2. Klikni na prazdne misto v pravem panelu (preview oblast) aby zadny input nemel focus
3. Stiskni klavesu Ctrl+Z (drz Ctrl a stiskni Z)
4. **Ocekavany vysledek:** Posledni zmena (barva paticky) se vrati zpet

### Ukol G5: Keyboard shortcut -- Ctrl+Y (Redo)

1. Stiskni Ctrl+Y
2. **Ocekavany vysledek:** Zmena barvy paticky se znovu aplikuje

### Ukol G6: Keyboard shortcut -- Ctrl+Shift+Z (Redo alternativa)

1. Stiskni Ctrl+Z (undo posledni zmenu)
2. Stiskni Ctrl+Shift+Z
3. **Ocekavany vysledek:** Redo funguje stejne jako Ctrl+Y

### Ukol G7: Undo nefunguje v input poli

1. Klikni na nazev widgetu v TopBaru (vstoupis do editacniho rezimu input pole)
2. Napis par znaku
3. Stiskni Ctrl+Z
4. **Ocekavany vysledek:** Ctrl+Z provede nativni undo v input poli (smaze posledni znaky), NE undo builder theme zmeny

### Ukol G8: Reset pomoci tlacitka "Resetovat"

1. Klikni na text "Resetovat" v prave casti TopBaru
2. **Ocekavany vysledek:** Tema se vrati do stavu, v jakem bylo pri naceteni builderu (nuluje vsechny zmeny od posledniho ulozeni)
3. Undo tlacitko by nemelo byt aktivni (historie je smazana po resetu)

---

## SEKCE H: WIDGET BUILDER -- GLOBAL TAB

### Ukol H1: Efekty -- Stin karet

1. Klikni na tab "Globalni" v levem panelu
2. V sekci "EFEKTY" najdi dropdown "Stin karet"
3. Postupne zvol kazdou moznost a sleduj live preview:
   a) "Zadny" (none) -- widgetove karty nemaji stin
   b) "Jemny" (subtle) -- jemny stin pod kartami
   c) "Stredni" (medium) -- viditelny stin
   d) "Silny" (strong) -- vyrazny stin
4. **Ocekavany vysledek:** S kazdou zmenou se zmena projevi v live preview

### Ukol H2: Efekty -- Globalni padding

1. V sekci "EFEKTY" najdi slider "Globalni padding"
2. Posun slider na minimum (8px)
3. **Ocekavany vysledek:** Widget v preview ma mensi vnitrni odsazeni -- obsah je blize okrajum
4. Posun slider na maximum (48px)
5. **Ocekavany vysledek:** Widget ma hodne vnitrniho odsazeni -- obsah je daleko od okraju

### Ukol H3: Skeleton Loading barvy

1. V sekci "SKELETON LOADING" klikni na color picker "Zakladni barva"
2. Zmen barvu na: `#CBD5E1`
3. Klikni "Pouzit"
4. Klikni na color picker "Shimmer barva"
5. Zmen barvu na: `#E2E8F0`
6. Klikni "Pouzit"
7. **Ocekavany vysledek:** Hodnoty se ulozily do theme. Vizualni efekt je videt jen kdyz se widget nacita (skeleton loading stav)

---

## SEKCE I: WIDGET BUILDER -- ONBOARDING

### Ukol I1: Priprava -- reset onboarding stavu

1. Otevri DevTools (F12)
2. Prejdi na zalozku "Application" -> "Local Storage" -> "http://localhost:4028"
3. Najdi klic ve formatu `modelpricer:<TENANT_ID>:builder:onboarding_complete`
4. Smaz tento klic (klikni na nej a stiskni Delete)
5. Zavri DevTools

### Ukol I2: Spusteni onboardingu

1. Obnov stranku builderu (stiskni F5, nebo prejdi zpet na `/admin/widget` a znovu otevri builder)
2. **Ocekavany vysledek:** Po nacteni builderu se objevi tmave polopruhledne pozadi (overlay) pres celou stranku

### Ukol I3: Krok 1 z 5 -- Vitejte

1. **Vizualni kontrola:**
   a) Uprostred obrazovky je bila karta se stinem (max 360px sirka)
   b) V horni casti karty je text "1 z 5" (maly, sedy, uppercase)
   c) Nadpis: "Vitejte ve Widget Builderu!" (tucny, 18px)
   d) Text: "Zde muzete vizualne upravit vzhled vaseho widgetu. Zmente barvy, texty a layout -- vsechny zmeny vidite okamzite v nahledu."
   e) Pod textem je rada 5 tecek -- prvni tecka je modra a vetsi (aktivni), zbyle 4 sede
   f) Dole jsou dve tlacitka: "Preskocit" (sede, vlevo) a "Dalsi" (modre, vpravo)
   g) **Karta se animuje pri objeveni** (animation: onboardingCardIn 300ms ease)
2. Klikni na "Dalsi"

### Ukol I4: Krok 2 z 5 -- Nahled widgetu

1. **Ocekavany vysledek:**
   a) Step counter ukazuje "2 z 5"
   b) Nadpis: "Nahled widgetu"
   c) Text: "Kliknete na libovolny element v nahledu pro jeho editaci. Zmeny se projevuji v realnem case."
   d) Druha tecka je modra (aktivni), prvni tecka je zelena (completed)
   e) **Pravy panel (preview oblast)** ma pulzujici modry outline (area hint) -- modry ramecek s animaci onboardingPulse
   f) Karta je umistena v pravem stredu obrazovky (ne uprostred)
2. Klikni na "Dalsi"

### Ukol I5: Krok 3 z 5 -- Editor vlastnosti

1. **Ocekavany vysledek:**
   a) Step counter: "3 z 5"
   b) Nadpis: "Editor vlastnosti"
   c) Text: "Po vybrani elementu zde vidite jeho editovatelne vlastnosti -- barvy, rozmery, texty."
   d) **Levy panel** ma pulzujici modry outline (area hint)
   e) Karta je umistena v levem stredu obrazovky
2. Klikni na "Dalsi"

### Ukol I6: Krok 4 z 5 -- Quick Themes

1. **Ocekavany vysledek:**
   a) Step counter: "4 z 5"
   b) Nadpis: "Quick Themes"
   c) Text: "Pouzijte prednastavena temata pro rychly start nebo jako inspiraci."
   d) **Levy panel (horni polovina)** ma area hint
   e) Karta je umistena vlevo nahore (top: 35%)
2. Klikni na "Dalsi"

### Ukol I7: Krok 5 z 5 -- Nezapomente ulozit

1. **Ocekavany vysledek:**
   a) Step counter: "5 z 5"
   b) Nadpis: "Nezapomente ulozit!"
   c) Text: "Po dokonceni uprav kliknete na zelene tlacitko \"Ulozit\" v hornim panelu."
   d) **TopBar (prava cast, cca 240px)** ma area hint -- ukazuje na tlacitko Save
   e) Karta je umistena vpravo nahore (top: 72px, right: 24px)
   f) Tlacitko vpravo dole rika "Hotovo" (misto "Dalsi")
2. Klikni na "Hotovo"
3. **Ocekavany vysledek:**
   a) Overlay se zavre s fade-out animaci (opacity prechod 250ms)
   b) Builder je nyni plne pristupny
   c) V DevTools Local Storage se objevi klic `modelpricer:<TENANT_ID>:builder:onboarding_complete` s hodnotou `true`

### Ukol I8: Overeni ze se onboarding nezobrazi znovu

1. Obnov stranku (F5 nebo naviguj pryc a zpet do builderu)
2. **Ocekavany vysledek:** Onboarding overlay se NEZOBRAZI -- je preskocen protoze klic v localStorage je nastaveny na "true"

### Ukol I9: Preskoceni onboardingu

1. Smaz klic onboarding_complete z localStorage (viz Ukol I1)
2. Znovu otevri builder
3. Na prvnim kroku klikni na "Preskocit" (misto "Dalsi")
4. **Ocekavany vysledek:**
   a) Overlay se okamzite zavre
   b) Klic `onboarding_complete` je nastaveny na "true" (onboarding se uz nezobrazi)

---

## SEKCE J: WIDGET BUILDER -- SAVE & PERSISTENCE

### Ukol J1: Ulozeni zmen

1. Proved libovolne zmeny v builderu:
   a) Vyber element "Hlavicka" a zmen "Nadpis hlavicky" na: `Test Persistence`
   b) Zmen barvu pozadi hlavicky na: `#EFF6FF`
2. V TopBaru klikni na zelene tlacitko "Ulozit"
3. **Ocekavany vysledek:**
   a) Tlacitko docasne zobrazi text "Ukladam..." (behem ukladani)
   b) Po ulozeni se tlacitko vrati na "Ulozit" a stane se disabled (isDirty = false)
   c) Undo/Redo historie se smaze (oba tlacitka budou disabled)

### Ukol J2: Overeni persistence po obnoveni stranky

1. Obnov stranku (F5)
2. Pockej az se builder nacte
3. Vyber element "Hlavicka" z Elements tabu
4. **Ocekavany vysledek:**
   a) V textovem poli "Nadpis hlavicky" je text: `Test Persistence`
   b) Barva "Pozadi hlavicky" ukazuje: `#EFF6FF`
   c) V live preview je hlavicka se svetle modrym pozadim a textem "Test Persistence"

### Ukol J3: Overeni persistence na Widget Admin strance

1. Klikni na sipku zpet (ArrowLeft ikona) v leve casti TopBaru
2. **Ocekavany vysledek:** Naviguje na `/admin/widget`
3. Najdi widget v levem sloupci a klikni na nej
4. Nazev widgetu by mel odpovidat tomu, co jsi nastavil v builderu

### Ukol J4: isDirty indikator

1. Vrat se do builderu (klikni na ikonu palety u widgetu)
2. **Kontrola:** Tlacitko "Ulozit" by melo byt disabled/polopruhledne (zadne zmeny)
3. Proved libovolnou zmenu (napr. zmen jakoukoli barvu)
4. **Ocekavany vysledek:** Tlacitko "Ulozit" se stane aktivnim (plne zelene, klikatelne)
5. Klikni na "Resetovat"
6. **Ocekavany vysledek:** Tema se vrati do ulozeneho stavu, "Ulozit" tlacitko je opet disabled

---

## SEKCE K: WIDGET PUBLIC STRANKA (`/w/:id`)

### Ukol K1: Nalezeni publicId widgetu

1. Prejdi na: `http://localhost:4028/admin/widget`
2. V levem sloupci najdi widget a podivej se na jeho publicId (male sede pismo pod nazvem, napr. `w_abc123` nebo podobny identifikator)
3. Zapamatuj si nebo zkopiruj toto publicId

### Ukol K2: Otevreni widget public stranky

1. Do adresniho radku napis: `http://localhost:4028/w/<PUBLIC_ID>` (nahrad `<PUBLIC_ID>` skutecnym publicId z predchoziho kroku)
2. Stiskni Enter
3. **Ocekavany vysledek:**
   a) Stranka se nacte BEZ admin sidebaru, headeru a footeru (cista widgetova stranka)
   b) **Behem nacitani:** Zobrazi se skeleton loading (viz sekce L)
   c) **Po nacteni:** Zobrazi se widget kalkulacka s hlavickou, stepperem, upload zonou atd.
   d) Widget pouziva barvy a nastaveni z builderu (pokud byly nastaveny a ulozeny)

### Ukol K3: Widget s neexistujicim ID

1. Do adresniho radku napis: `http://localhost:4028/w/neexistujici_id_12345`
2. Stiskni Enter
3. **Ocekavany vysledek:**
   a) Zobrazi se chybova stranka s cervenym kruhem a ikonou vykricniku
   b) Nadpis: "Widget neni dostupny"
   c) Text: "Widget nenalezen"
   d) Dole male sede pismo: "Widget ID: neexistujici_id_12345"

### Ukol K4: Deaktivovany widget

1. Prejdi na: `http://localhost:4028/admin/widget`
2. Klikni na widget v levem sloupci
3. Prejdi na tab "Nastaveni"
4. V sekci "Stav widgetu" klikni na toggle prepinac (prepni z aktivniho na neaktivni)
5. **Ocekavany vysledek:** Badge na karte se zmeni na "Neaktivni" (sede), zelena tecka zmizi
6. Do adresniho radku napis URL public widgetu: `http://localhost:4028/w/<PUBLIC_ID>`
7. **Ocekavany vysledek:** Zobrazi se chybova stranka s textem "Widget je deaktivovan"
8. **DULEZITE -- Navrat:** Vrat se na admin a znovu aktivuj widget (toggle zpet na aktivni)

---

## SEKCE L: WIDGET KOMPONENTY (Header, Stepper, Footer, Skeleton)

### Ukol L1: Widget Header

1. Otevri widget public stranku: `http://localhost:4028/w/<PUBLIC_ID>`
2. **Vizualni kontrola hlavicky:**
   a) V horni casti widgetu je hlavicka s pozadim (defaultne bile #FFFFFF)
   b) Nadpis ve velkem tucnem pismu (1.5rem, 700 weight) -- text odpovida nastaveni v theme (napr. "3D Tisk Kalkulacka" nebo uzivatelsky definovany text)
   c) Pokud je tagline nastaveny a viditelny (headerTaglineVisible: true), pod nadpisem je mensi sedy text
   d) Pokud je logo nastaveno v brandingu, je zobrazeno nad nadpisem
   e) Zarovnani odpovida nastaveni headerAlignment (defaultne "left")

### Ukol L2: Widget Stepper

1. Na widgetove strance (pod hlavickou) je stepper s 3 kroky:
2. **Vizualni kontrola:**
   a) Krok 1: "Nahrani modelu" -- aktivni (modry kruzek s cislem 1, modre pozadi #3B82F6)
   b) Krok 2: "Nastaveni" -- neaktivni (prazdny kruzek se sedym rameckem a cislem 2)
   c) Krok 3: "Souhrn a cena" -- neaktivni
   d) Mezi kroky jsou spojovaci cary (2px tluste)
   e) Cary pred aktivnim krokem jsou zelene (completed), za aktivnim krokem sede
   f) Pod kroky je progress bar (tenka cara, 4px) -- ukazuje 0% (jsme na kroku 1 ze 3)

### Ukol L3: Widget Footer

1. Skroluj uplne dolu na widgetove strance
2. **Vizualni kontrola:**
   a) Na konci widgetu je paticka s textem "Powered by ModelPricer"
   b) "ModelPricer" je odkaz (modry text, klikatelny)
   c) Text je centrovany
   d) Barvy odpovidaji nastaveni theme (footerTextColor, footerLinkColor)

### Ukol L4: Widget Skeleton (loading stav)

1. Otevri DevTools (F12) -> zalozka "Network"
2. V DevTools klikni na ikonu "Throttle" a zvol "Slow 3G" (nebo "Offline")
3. Obnov widgetovou stranku (F5)
4. **Ocekavany vysledek behem nacitani:**
   a) Misto plneho widgetu se zobrazi skeleton loading:
      - Blok pro logo (maly obdelnik s shimmer animaci)
      - Blok pro nadpis (sirsi obdelnik, shimmer)
      - Blok pro tagline (jeste sirsi obdelnik, shimmer)
      - 3 kruzky spojene carami (stepper skeleton)
      - Velky obdelnik (upload zona skeleton)
      - 4 mensi bloky v pravem sloupci (config sidebar skeleton)
   b) Vsechny bloky maji **shimmer animaci** -- gradient ktery se pohybuje zleva doprava (animation: widgetSkeletonShimmer 1.5s infinite)
   c) Zakladni barva odpovidat theme (skeletonBaseColor), shimmer barva (skeletonShineColor)
5. **Navrat:** V DevTools zrus throttling (zmen zpet na "Online"/"No throttling")

---

## SEKCE M: POSTMESSAGE EVENTY

### Ukol M1: Overeni bezpecneho origin

1. Otevri DevTools na widgetove public strance
2. Prejdi na zalozku "Console"
3. Do konzole napis:
   ```
   window.addEventListener('message', (e) => console.log('PostMessage:', e.data, 'origin:', e.origin));
   ```
4. Stiskni Enter
5. Nyni interaguj s widgetem -- nahraj soubor nebo proved akci ktera generuje cenovou kalkulaci
6. **Ocekavany vysledek:** Pokud widget odesila postMessage, v konzoli se objevi zaznam typu:
   ```
   PostMessage: {type: "MODELPRICER_QUOTE_CREATED", publicWidgetId: "...", quote: {...}} origin: http://localhost:4028
   ```
7. **Bezpecnostni kontrola:** `type` pole musi byt jeden z:
   - `MODELPRICER_QUOTE_CREATED`
   - `MODELPRICER_PRICE_CALCULATED`
   - `MODELPRICER_ERROR`

### Ukol M2: Overeni getTargetOrigin

1. V DevTools Console napis:
   ```
   document.referrer
   ```
2. **Ocekavany vysledek:** Pokud jsi na strance primo (ne v iframe), vrati prazdny string `""`
3. **Poznamka:** Funkce `getTargetOrigin()` v WidgetPublicPage.jsx pouziva `document.referrer` -- pokud je prazdny, fallback je `*`. Toto je spravne pro lokalni vyvoj, ale v produkci (widget v iframe) by mel getTargetOrigin() vracet origin rodice

---

## SEKCE N: ZPETNA KOMPATIBILITA

### Ukol N1: Theme merge s defaults

1. Otevri DevTools -> Application -> Local Storage
2. Najdi klic s widget theme daty (muze byt v ramci widget objektu, napr. `themeConfig`)
3. Rucne uprav tato data tak, ze odstranis nektere nove klice (napr. smaz `uploadBgColor`, `stepperActiveColor`)
4. Obnov stranku builderu
5. **Ocekavany vysledek:**
   a) Builder se nacte bez chyby
   b) Chybejici klice jsou automaticky doplneny z `getDefaultWidgetTheme()` (merge pattern: `{ ...defaults, ...stored }`)
   c) Vsechny editory v Style tabu ukazuji hodnoty (zadne undefined nebo prazdne)

### Ukol N2: Widget bez themeConfig

1. V localStorage najdi widget objekt a smaz cely `themeConfig` klic (nebo nastav na `null`)
2. Otevri builder pro tento widget
3. **Ocekavany vysledek:**
   a) Builder se nacte s defaultnim tematem (vsechny hodnoty z `getDefaultWidgetTheme()`)
   b) Pokud je nastaveny branding (primaryColor, businessName), pri prvnim otevreni se automaticky aplikuji branding barvy na widget theme:
      - `buttonPrimaryColor` se nastavi na branding primaryColor
      - `textHeaderTitle` se nastavi na branding businessName

### Ukol N3: Route zpetna kompatibilita

1. Prejdi na: `http://localhost:4028/admin/widget`
2. **Ocekavany vysledek:** Stranka se nacte v ramci AdminLayout (sidebar vlevo, admin navigace)
3. Prejdi na: `http://localhost:4028/admin/widget/builder/<ID>`
4. **Ocekavany vysledek:** Builder se nacte MIMO AdminLayout (fullscreen, bez sidebaru)
5. Prejdi na: `http://localhost:4028/w/<PUBLIC_ID>`
6. **Ocekavany vysledek:** Widget public stranka se nacte BEZ Header/Footer a BEZ admin sidebaru

---

## EDGE CASES A SPECIALNI SCENARE

### Edge Case EC1: Prazdny nazev widgetu

1. V builderu klikni na nazev widgetu v TopBaru
2. Vymaz cely text (ponech pole prazdne)
3. Klikni nekam jinam (blur)
4. **Ocekavany vysledek:** Nazev se vrati na predchozi hodnotu (prazdny nazev se neuklada, commitName() revertuje)

### Edge Case EC2: Velmi dlouhy nazev widgetu

1. V Admin Widget strance klikni na "Vytvorit widget"
2. Do nazvu napis 60+ znaku: `Toto je velmi dlouhy nazev widgetu ktery by mel byt orezany nebo zabalen na vice radku v karte`
3. Klikni "Vytvorit"
4. **Ocekavany vysledek:**
   a) Widget se vytvori (nazev v input je orezany na 60 znaku -- maxLength)
   b) Na karte v levem sloupci je nazev orezany s "..." (text-overflow: ellipsis)
   c) V builderu TopBaru je nazev take orezany

### Edge Case EC3: Specialni znaky v nazvu

1. Vytvor widget s nazvem: `Test <script>alert("xss")</script> Widget`
2. **Ocekavany vysledek:** Nazev se zobrazi jako plain text (React automaticky escapuje HTML). Zadny alert se neobjevi

### Edge Case EC4: Rychle Undo/Redo (stresovy test)

1. V builderu proved 10+ rychlych zmen (zmen barvy, texty, slidery)
2. Rychle klikej na Undo 10x
3. Rychle klikej na Redo 10x
4. **Ocekavany vysledek:**
   a) Kazdy undo/redo je korektni
   b) Live preview se plynule aktualizuje
   c) Zadne chyby v konzoli
   d) Maximum 50 undo kroku (po 50 se nejstarsi ztrati)

### Edge Case EC5: Prepnuti widgetu s neulozenymi zmenami

1. Na `/admin/widget` proved zmeny v konfiguraci widgetu (napr. zmen nazev)
2. NEULOZ zmeny
3. V levem sloupci klikni na JINY widget (pokud existuje vice nez jeden)
4. **Ocekavany vysledek:** Objevi se confirm dialog: "Mas neulozene zmeny. Opravdu chces prepnout widget bez ulozeni?"
5. Klikni "OK" -- prepne se na druhy widget (zmeny se ztrati)
6. Zopakuj postup, ale klikni "Zrusit" -- zustane na puvodnm widgetu

---

## INSTRUKCE PRO CHYBOVE STAVY

### Pokud se stranka nenacte (bily screen):
1. Otevri DevTools (F12) -> Console
2. Zapis PRVNI cervenou chybovou hlasku (typicky "Cannot read property..." nebo "Module not found")
3. Zkontroluj URL -- musi byt spravna
4. Zkus obnovit stranku (F5)
5. Oznac jako FAILED a pokracuj dalsi sekci

### Pokud se builder nenacte (spinner bezi nekonecne):
1. Zkontroluj Console v DevTools -- hledej chyby
2. Over ze ID widgetu v URL existuje (porovnej s admin strankou)
3. Pokud ve 10 sekund nic, oznac jako FAILED

### Pokud live preview nereaguje na zmeny:
1. Zkontroluj Console -- hledej errory
2. Zkus vybrat jiny element a vrati se zpet
3. Zkus obnovit stranku
4. Oznac jako PARTIAL FAIL (builder funguje, preview ne)

### Pokud toast notifikace nezmizi:
1. Toast by mel zmizet po 2.5 sekundach
2. Pokud nezmizi, zkontroluj ze neni fixovany v rohu (pozice: fixed, right: 18px, bottom: 18px)
3. Oznac jako MINOR BUG

---

## ZAVERECNY REPORT

Po dokonceni vsech testu vyplnte nasledujici report:

```
========================================
WIDGET BUILDER V3 -- TESTOVACI REPORT
========================================
Datum testu: ____-__-__
Tester: ___________
Prohlizec: Chrome verze ___

SEKCE A: Admin Widget stranka
  A1 Layout:           [ ] PASS  [ ] FAIL  [ ] SKIP
  A2 Vytvoreni:        [ ] PASS  [ ] FAIL  [ ] SKIP
  A3 Validace:         [ ] PASS  [ ] FAIL  [ ] SKIP
  A4 Taby:             [ ] PASS  [ ] FAIL  [ ] SKIP
  A5 Config editace:   [ ] PASS  [ ] FAIL  [ ] SKIP
  A6 Embed kod:        [ ] PASS  [ ] FAIL  [ ] SKIP
  A7 Domeny:           [ ] PASS  [ ] FAIL  [ ] SKIP
  A8 Nastaveni:        [ ] PASS  [ ] FAIL  [ ] SKIP
  A9 Builder otevreni: [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE B: Builder Layout
  B1 Fullscreen:       [ ] PASS  [ ] FAIL  [ ] SKIP
  B2 TopBar:           [ ] PASS  [ ] FAIL  [ ] SKIP
  B3 Editace nazvu:    [ ] PASS  [ ] FAIL  [ ] SKIP
  B4 Escape cancel:    [ ] PASS  [ ] FAIL  [ ] SKIP
  B5 Levy panel taby:  [ ] PASS  [ ] FAIL  [ ] SKIP
  B6 Pravy panel:      [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE C: Element Selection & Editing
  C1 Elements Tab:     [ ] PASS  [ ] FAIL  [ ] SKIP
  C2 Vyber elementu:   [ ] PASS  [ ] FAIL  [ ] SKIP
  C3 3D Nahled locked: [ ] PASS  [ ] FAIL  [ ] SKIP
  C4 CTA editory:      [ ] PASS  [ ] FAIL  [ ] SKIP
  C5 Live preview:     [ ] PASS  [ ] FAIL  [ ] SKIP
  C6 Text zmena:       [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE D: Color Picker
  D1 Vizualni:         [ ] PASS  [ ] FAIL  [ ] SKIP
  D2 Paleta:           [ ] PASS  [ ] FAIL  [ ] SKIP
  D3 HEX vstup:        [ ] PASS  [ ] FAIL  [ ] SKIP
  D4 Validace:         [ ] PASS  [ ] FAIL  [ ] SKIP
  D5 Cancel:           [ ] PASS  [ ] FAIL  [ ] SKIP
  D6 Click-outside:    [ ] PASS  [ ] FAIL  [ ] SKIP
  D7 Historie:         [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE E: Quick Themes
  E1 Global Tab:       [ ] PASS  [ ] FAIL  [ ] SKIP
  E2 Dropdown:         [ ] PASS  [ ] FAIL  [ ] SKIP
  E3 Modern Dark:      [ ] PASS  [ ] FAIL  [ ] SKIP
  E4 Clean Light:      [ ] PASS  [ ] FAIL  [ ] SKIP
  E5 Vlastni:          [ ] PASS  [ ] FAIL  [ ] SKIP
  E6 Typografie:       [ ] PASS  [ ] FAIL  [ ] SKIP
  E7 Zaobleni rohu:    [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE F: Device Preview
  F1 Mobile:           [ ] PASS  [ ] FAIL  [ ] SKIP
  F2 Tablet:           [ ] PASS  [ ] FAIL  [ ] SKIP
  F3 Desktop:          [ ] PASS  [ ] FAIL  [ ] SKIP
  F4 Animace:          [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE G: Undo / Redo
  G1 Priprava:         [ ] PASS  [ ] FAIL  [ ] SKIP
  G2 Undo tlacitko:    [ ] PASS  [ ] FAIL  [ ] SKIP
  G3 Redo tlacitko:    [ ] PASS  [ ] FAIL  [ ] SKIP
  G4 Ctrl+Z:           [ ] PASS  [ ] FAIL  [ ] SKIP
  G5 Ctrl+Y:           [ ] PASS  [ ] FAIL  [ ] SKIP
  G6 Ctrl+Shift+Z:     [ ] PASS  [ ] FAIL  [ ] SKIP
  G7 Undo v inputu:    [ ] PASS  [ ] FAIL  [ ] SKIP
  G8 Reset:            [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE H: Global Tab
  H1 Stin karet:       [ ] PASS  [ ] FAIL  [ ] SKIP
  H2 Padding:          [ ] PASS  [ ] FAIL  [ ] SKIP
  H3 Skeleton barvy:   [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE I: Onboarding
  I1 Reset:            [ ] PASS  [ ] FAIL  [ ] SKIP
  I2 Spusteni:         [ ] PASS  [ ] FAIL  [ ] SKIP
  I3 Krok 1:           [ ] PASS  [ ] FAIL  [ ] SKIP
  I4 Krok 2:           [ ] PASS  [ ] FAIL  [ ] SKIP
  I5 Krok 3:           [ ] PASS  [ ] FAIL  [ ] SKIP
  I6 Krok 4:           [ ] PASS  [ ] FAIL  [ ] SKIP
  I7 Krok 5:           [ ] PASS  [ ] FAIL  [ ] SKIP
  I8 Nezobrazi znovu:  [ ] PASS  [ ] FAIL  [ ] SKIP
  I9 Preskoceni:       [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE J: Save & Persistence
  J1 Ulozeni:          [ ] PASS  [ ] FAIL  [ ] SKIP
  J2 F5 persistence:   [ ] PASS  [ ] FAIL  [ ] SKIP
  J3 Admin persistence:[ ] PASS  [ ] FAIL  [ ] SKIP
  J4 isDirty:          [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE K: Widget Public
  K1 PublicId:         [ ] PASS  [ ] FAIL  [ ] SKIP
  K2 Otevreni:        [ ] PASS  [ ] FAIL  [ ] SKIP
  K3 Neexistujici ID: [ ] PASS  [ ] FAIL  [ ] SKIP
  K4 Deaktivovany:    [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE L: Widget Komponenty
  L1 Header:           [ ] PASS  [ ] FAIL  [ ] SKIP
  L2 Stepper:          [ ] PASS  [ ] FAIL  [ ] SKIP
  L3 Footer:           [ ] PASS  [ ] FAIL  [ ] SKIP
  L4 Skeleton:         [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE M: PostMessage
  M1 Eventy:           [ ] PASS  [ ] FAIL  [ ] SKIP
  M2 Origin:           [ ] PASS  [ ] FAIL  [ ] SKIP

SEKCE N: Zpetna kompatibilita
  N1 Theme merge:      [ ] PASS  [ ] FAIL  [ ] SKIP
  N2 Bez themeConfig:  [ ] PASS  [ ] FAIL  [ ] SKIP
  N3 Routes:           [ ] PASS  [ ] FAIL  [ ] SKIP

EDGE CASES:
  EC1 Prazdny nazev:   [ ] PASS  [ ] FAIL  [ ] SKIP
  EC2 Dlouhy nazev:    [ ] PASS  [ ] FAIL  [ ] SKIP
  EC3 Spec. znaky:     [ ] PASS  [ ] FAIL  [ ] SKIP
  EC4 Stress undo:     [ ] PASS  [ ] FAIL  [ ] SKIP
  EC5 Unsaved switch:  [ ] PASS  [ ] FAIL  [ ] SKIP

----------------------------------------
CELKOVY VYSLEDEK:
  PASS:  ____ / 68
  FAIL:  ____ / 68
  SKIP:  ____ / 68

KRITICKE CHYBY (P0):
  1. ________________________________
  2. ________________________________

DULEZITE CHYBY (P1):
  1. ________________________________
  2. ________________________________

DROBNE CHYBY (P2):
  1. ________________________________
  2. ________________________________

POZNAMKY:
  ___________________________________
  ___________________________________
========================================
```
