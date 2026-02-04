WIDGET BUILDER V3 – KOMPLETNI TESTOVACI REPORT

Datum testu: 2026-02-03  
Tester: Claude (Automatizovany test)  
Prohlizec: Google Chrome  
Dev URL: [http://localhost:4028](http://localhost:4028)  
Testovana zmena: Widget Builder V3 – kompletni implementace (Phase 0-7)  
Dotcene stranky: /admin/widget, /admin/widget/builder/:id, /w/:publicWidgetId

CELKOVY PREHLED VYSLEDKU  
PASS: 42 /

KRITICKE CHYBY (P0) – NUTNA OPRAVA

P0-1: CHYBI PREPINANI STRANEK KALKULACKY V BUILDERU  
Popis: V builder preview nelze prepnout na druhou stranku kalkulacky (stranku zobrazenou po nahrani 3D modelu). Elementy jako CTA Tlacitko, Konfigurace, Doplnkove sluzby a Souhrn ceny jsou editovatelne v levem panelu, ale jejich zmeny nejsou vizualne viditelne v preview, protoze preview zobrazuje pouze prvni krok (upload stranka).  
Dopad: Uzivatel nemuze overit vizualni zmeny na kriticke casti widgetu (CTA tlacitko, cena, konfigurace). To je cca 40% editovelnych elementu.  
Dotcene soubory: WidgetBuilderPreview.jsx, pripadne BuilderTopBar.jsx  
Navrh reseni: Pridat prepinac kroku (Step Switcher) do TopBaru vedle Device Switcheru, ktery umozni prepnout preview mezi kroky 1/2/3 kalkulacky s mock daty. Alternativne pridat tlacitko “Zobrazit krok ⅔” primo do preview oblasti.

P0-2: CHYBI TLACITKO PRO PREVIEW KALKULACKY V PLNE VELIKOSTI  
Popis: V builderu neni zadne tlacitko ani odkaz v hornim menu ani nikde jinde pro otevreni preview kalkulacky v plne

DULEZITE CHYBY (P1) – VYSOKA PRIORITA

P1-1: QUICK THEMES NEFUNGUJI  
Popis: Vyber prednastaveneho tematu (Modern Dark, Clean Light, Professional Blue, Warm Neutral) z dropdownu v Global tabu NEAPLIKUJE tema. Dropdown se zavre, ale trigger stale zobrazuje “Vlastni” a live preview se nezmeni. Zadne z prednastavených temat nelze pouzit.  
Dotcene soubory: QuickThemeDropdown.jsx, GlobalTab.jsx  
Presne misto chyby: Event handler pro vyber tematu – onSelect callback v QuickThemeDropdown. Pravdepodobne chybi volani applyQuickTheme() nebo theme data nejsou spravne propagovana do theme stahodnotu v textovem poli ani gradient. Barvu v color pickeru lze zmenit POUZE rucnim zadanim HEX hodnoty do textoveho pole. Gradient oblast (react-colorful) funguje, rucni HEX vstup funguje, ale paleta ne.  
Dotcene soubory: BuilderColorPicker.jsx  
Presne misto chyby: onClick handler na paletovych barevnych kruzcich. Chybi propojeni mezi kliknutim na paletu a aktualizaci stavu hex hodnoty v react-colorful komponente.  
Navrh reseni: Zajistit ze po kliknuti na paletu se vola setColor(hex) neboovedeni undo operace na theme.  
Dotcene soubory: [useUndoRedo.js](http://useUndoRedo.js) (nebo .hook), BuilderTopBar.jsx, [useKeyboardShortcuts.js](http://useKeyboardShortcuts.js)  
Presne mista chyby: (a) handleUndo() funkce v useUndoRedo – overit ze po undo se aktualizuje theme state a ze Style tab zobrazuje aktualizovane hodnoty. (b) Keyboard event listener – Ctrl+Z je pravdepodobne zachycen preview iframe/komponentou misto builderu. Je potreba globalni document.addEventListener na urovni WidgetBuilder.jsx.  
Navrh reseni: (a) Overit ze undo spravne nastavuje predchozi theme snapshot do aktivniho stavu. (b) Pridat event.preventDefault() a event.stopPropagation() v globalnim keyboard handleru a zajistit ze se nespousti kdyz je focus v input poli.

DROBNE CHYBY (P2) – NIZKA PRIORITA

P2-1: CHYBI TOAST NOTIFIKACE PRI VALIDACI VYTVORENI WIDGETU  
Popis: Pri pokusu o vytvoreni widgetu s kratkym nazvem (1 znak “A”) se nezobrazi cervena toast notifikace s chybovou hlaskou “Zadej nazev (min. 2 znaky).” Modal zustane otevreny a widget se nevytvori, ale uzivatel nedostava zadnou zpetnou vazbu proc.  
Dotcene soubory: CreateWidgetModal.jsx  
Presne misto: Validacni vetev pred volanim onCreate() – chybi toast.error() volani.  
Navrh reseni: Pridat toast.error(“Zadej nazev (min. 2 znaky).”) nebo pridat cerveny text pod pole “Nazev” s validacni hlaskou.

P2-2: TAB “NASTAVENI” JE CASTECNE ORIZNUTY  
Popis: Na strance /admin/widget je ctvrty tab “Nastaveni” castecne oriznuty a zobrazuje se jako “Nas…” protoze taby jsou prilis siroke pro dostupny prostor praveho sloupce. Je videt az po horizontalnim scrollu tab baru.  
Dotcene soubory: AdminWidgetPage.jsx – tab bar styling  
Navrh reseni: Zmensit font-size nebo padding tabu, nebo pridat vizualni indikator ze je mozne scrollovat (sipka/gradient na kraji).

DETAILNI VYSLEDKY TESTU PO SEKCICH

SEKCE A: ADMIN WIDGET STRANKA (/admin/widget)

A1 Layout: PASS – 2-sloupcovy layout funguje. Levy sloupec (340px) s kartami widgetu, pravy sloupec se zabira zbytek. Horni bar obsahuje nadpis “Widget Code”, podnadpis, pocitadlo “X/Y widgetu” a modre tlacitko “+ Vytvorit widget”.

A2 Vytvoreni widgetu: PASS – Modal “Vytvorit novy widget” se spravne otevre s bilym rameckem, zaoblenymi rohy, stinem. Pole “Nazev” a “Typ” (Full Calculator/Price Only), tlacitka “Zrusit”/”+ Vytvorit”. Widget “Testovaci Widget Alpha” uspesne vytvoren s publicId wid\_7adiujnV, badge “Aktivni”, modrym prouzkem. Poznamka: Toast “Widget vytvoren” nebyl vizualne zaznamenan.

A3 Validace kratkeho nazvu: PASS (CASTECNE) – Validace funguje, modal zustane otevreny s nazvem “A” (1 znak). ALE chybi vizualni error zprava (viz P2-1).

A4 Vyber widgetu a taby: PASS – Karta se zvyrazni (modry ramecek), v pravem sloupci 4 taby: Konfigurace, Embed kod, Domeny, Nastaveni. Save bar s Reset/Ulozit funguje.

A5 Konfiguracni tab: PASS – Pole Nazev, Typ, Theme (Auto/Light/Dark), Primary color override, Sirka (Auto/Fixni px), Jazyk (cs/en) – vsechny editovatelne a funkcni.

A6 Embed kod tab: PASS – Tmava oblast s iframe kodem, spravna URL, PostMessage resize script, tlacitko “Kopirovat” pritomno.

A7 Domeny tab: PASS – Input s placeholderem “napr. [firma.cz](http://firma.cz)”, checkbox “Povolit subdomeny”, tlacitko “+ Pridat”. Domena “[example.com](http://example.com)” uspesne pridana s wildcard “\*.[example.com](http://example.com)”, toggle a delete ikona.

A8 Nastaveni tab: PASS – Stav widgetu (toggle), Vizualni editor (tlacitko “Otevrit Builder”), Duplikovat (disabled pri limitu), Smazat widget (cervene tlacitko). Text limitu tarifu zobrazen spravne.

A9 Otevreni Builderu: PASS – Ikona palety na karte naviguje na /admin/widget/builder/\<ID\>. Fullscreen rezim bez admin chrome.

SEKCE B: WIDGET BUILDER – LAYOUT

B1 Fullscreen layout: PASS – Builder zabira 100vh. Tmave pozadi, 3 oblasti: TopBar (56px), levy panel (~~35%), pravy panel (~~65%) s live preview.

B2 TopBar: PASS – Leva cast: sipka zpet, “Widget Builder” (tucny), oddelovac, nazev widgetu (monospace). Stred: 3 device tlacitka (telefon/tablet/monitor) v tmavem obdelniku, desktop defaultne aktivni (modre). Pravo: Undo/Redo ikony, “Resetovat”, zelene “Ulozit”.

B3 Editace nazvu: PASS – Klik na nazev aktivuje input s modrym rameckem. Enter uklada zmenu.

B4 Escape cancel: PASS – Escape v editaci nazvu vrati puvodni text.

B5 Levy panel taby: PASS – 3 taby: “Styl” (defaultni, aktivni), “Elementy”, “Globalni”. Aktivni tab ma modrou spodni caru 2px. Placeholder “Kliknete na element v nahledu pro editaci” zobrazen kdyz neni vybrany element.

B6 Pravy panel: PASS – Badge “LIVE PREVIEW” se zelenou pulzujici teckou v pravem hornim rohu. Widget nahled vycentrovany s bilym rameckem, stinem, zaoblenymi rohy.

SEKCE C: ELEMENT SELECTION AND EDITING

C1 Elements Tab: PASS – Seznam 10 elementu v poradi: Pozadi, Hlavicka, Navigace (kroky), Upload zona, 3D Nahled (Non-editable, ztlumeny s badge), Konfigurace, Doplnkove sluzby, Souhrn ceny, CTA Tlacitko, Paticka. Kazdy ma ikonu a barevny kruzek vpravo.

C2 Vyber elementu: PASS – “Hlavicka” po kliknuti: zvyrazneny radek, zelena tecka, prepnuti na Styl tab, editory BARVY (Pozadi hlavicky \#FFFFFF, Nadpis \#1F2937), ROZMERY (Velikost loga 48px, Padding 16px), STYL (Zarovnani left), TEXTY (Nadpis, Tagline), PREPINACE (Zobrazit tagline toggle).

C3 3D Nahled locked: PASS – Kliknuti ignorovano, element disabled, nelze editovat.

C4 CTA Tlacitko editory: PASS – BARVY (barva \#2563EB, text \#FFFFFF, hover \#1D4ED8), ROZMERY (Zaobleni 8px, Vert. padding 12px, Velikost textu 16px), STYL (Stin none), TEXTY (“Spocitat cenu”).

C5 Live preview: PASS (CASTECNE) – Zmena barvy CTA (\#EF4444) se aplikovala v editoru. ALE: CTA tlacitko neni viditelne na prvni strance (je az na druhe po nahrani) viz P0-1.

C6 Text zmena: SKIP – Nelze overit vizualne kvuli P0-1.

SEKCE D: COLOR PICKER

D1 Vizualni: PASS – Popover (260px) pod triggerem. Gradientni oblast (react-colorful), HEX radek, PALETA 8 barev (4x2: modra, cervena, zelena, zluta, fialova, ruzova, tyrkysova, seda), tlacitka “Zrusit”/”Pouzit”. HISTORIE se zobrazi az po pouziti barev.

D2 Paleta: FAIL – Kliknuti na barevne kruzky v palete NEZMENI HEX hodnotu. Viz P1-2.

D3 HEX vstup: PASS – Rucni zadani “\#EF4444” funguje, gradient se posune, po “Pouzit” se barva aplikuje.

D4 Validace HEX: SKIP – Neotestovano.  
D5 Cancel: SKIP – Neotestovano.  
D6 Click-outside: SKIP – Neotestovano.  
D7 Historie: SKIP – Neotestovano.

SEKCE E: QUICK THEMES

E1 Global Tab: PASS – Vsechny sekce zobrazeny: TYPOGRAFIE (Font nadpisu “Inter”, Font textu “Inter” s preview), ZAOBLENI ROHU (slider 12px, preview obdelnik), PREDNASTAVENY TEMA (dropdown), EFEKTY (Stin karet “Jemny”, Globalni padding 24px), SKELETON LOADING (barvy \#E5E7EB, \#F3F4F6).

E2 Dropdown: PASS – Otevre se se 4 tematy (Modern Dark, Clean Light, Professional Blue, Warm Neutral) \+ “Vlastni” s fajfkou. Barevne tecky u temat, oddelovaci cara.

E3 Modern Dark: FAIL – Tema se neaplikuje. Viz P1-1.  
E4 Clean Light: FAIL – Tema se neaplikuje. Viz P1-1.  
E5 Vlastni: PASS – Defaultne aktivni, chovani spravne.  
E6 Typografie: SKIP – Neotestovano.  
E7 Zaobleni: SKIP – Neotestovano.

SEKCE F: DEVICE PREVIEW

F1 Mobile: PASS – Ikona telefonu, preview zuzen na \~375px, obsah se spravne prelomi.  
F2 Tablet: PASS – Ikona tabletu, preview \~768px.  
F3 Desktop: PASS – Ikona monitoru, plna sirka (max 1200px).  
F4 Animace: PASS – Prepinani plynule, CSS transition \~300ms, zadne trhani.

SEKCE G: UNDO / REDO

G1 Priprava: PASS – Po zmene barvy se Undo tlacitko stane aktivnim (neni sede).  
G2 Undo tlacitko: FAIL – Kliknuti na Undo v TopBaru nerevreovalo barvu CTA zpet. Viz P1-4.  
G3 Redo: SKIP – Zavisle na G2.  
G4 Ctrl+Z: FAIL – Prepnulo element misto theme undo. Viz P1-4.  
G5 Ctrl+Y: SKIP  
G6 Ctrl+Shift+Z: SKIP  
G7 Undo v inputu: SKIP  
G8 Reset: PASS – Klik na “Resetovat” uspesne obnovil puvodni barvy (info ikona z cervene zpet na modrou).

SEKCE H: GLOBAL TAB

H1 Stin karet: PASS – Dropdown pritomny s moznostmi Zadny/Jemny/Stredni/Silny.  
H2 Globalni padding: PASS – Slider 8-48px, aktualni 24px, funkcni.  
H3 Skeleton barvy: PASS – Zakladni barva \#E5E7EB, Shimmer barva \#F3F4F6, color pickery pritomny.

SEKCE I: ONBOARDING

I1 az I9: SKIP – Onboarding overlay se nezobrazil protoze klic onboarding\_complete byl jiz nastaven v localStorage z predchoziho pouziti. Pro kompletni test je potreba smazat klic modelpricer:\<TENANT\_ID\>:builder:onboarding\_complete z localStorage a znovu nacist builder.

SEKCE J: SAVE AND PERSISTENCE

J1 Ulozeni: PASS – Zelene tlacitko “Ulozit” funguje, zmeny se ulozi do localStorage.  
J2 F5 persistence: SKIP – Neotestovano explicitne.  
J3 Admin persistence: PASS – Nazev widgetu spravne zobrazen na admin strance po navratu z builderu.  
J4 isDirty indikator: PASS – “Ulozit” aktivni po zmene, disabled bez zmen.

SEKCE K: WIDGET PUBLIC STRANKA (/w/㊗️  
K1 PublicId: PASS – PublicId viditelny na karte widgetu v monospace pismu (wid\_7adiujnV).  
K2 Otevreni: PASS (CASTECNE) – Stranka se nacte BEZ admin chrome. Obsahuje stepper, upload zonu, model preview, info, paticku. ALE: Widget Header (nadpis a tagline) CHYBI. Viz P1-3.  
K3 Neexistujici ID: PASS – URL /w/neexistujici\_id\_12345 zobrazuje chybovou stranku: cerveny kruh s vykricnikem, “Widget neni dostupny”, “Widget nenalezen”, “Widget ID: neexistujici\_id\_12345”.  
K4 Deaktivovany widget: PASS – Po deaktivaci (toggle v Nastaveni) public stranka zobrazuje “Widget neni dostupny”, “Widget je deaktivovan”. Po reaktivaci widget opet funguje.

SEKCE L: WIDGET KOMPONENTY

L1 Header: FAIL – Widget Header se NEZOBRAZUJE na public strance. Viz P1-3.  
L2 Stepper: PASS – 3 kroky (Nahrani modelu, Nastaveni, Souhrn a cena). Krok 1 aktivni (modry kruzek), kroky 2-3 neaktivni (sede). Spojovaci cary pritomny. Progress bar pod stepperem.  
L3 Footer: PASS – “Powered by ModelPricer” centrovany, “ModelPricer” modry odkaz.  
L4 Skeleton: SKIP – Neotestovano s network throttlingem.

SEKCE M: POSTMESSAGE EVENTY

M1 Eventy: SKIP – Vyzaduje nahrani souboru a generovani kalkulace.  
M2 Origin: SKIP – Neotestovano.

SEKCE N: ZPETNA KOMPATIBILITA

N1 Theme merge: SKIP – Neotestovano manualni manipulaci localStorage.  
N2 Bez themeConfig: SKIP – Neotestovano.  
N3 Routes: PASS – /admin/widget v AdminLayout (sidebar), /admin/widget/builder/\<ID\> fullscreen (bez sidebaru), /w/\<ID\> bez Header/Footer/sidebar.

EDGE CASES

EC1 Prazdny nazev: SKIP  
EC2 Velmi dlouhy nazev: SKIP  
EC3 Specialni znaky XSS: SKIP  
EC4 Stress undo/redo: SKIP  
EC5 Prepnuti s neulozenymi zmenami: SKIP

CO FUNGUJE SPRAVNE (POZITIVNI ZJISTENI)

Admin stranka: 2-sloupcovy layout, vytvareni/mazani widgetu, 4-tabovy panel (Konfigurace, Embed kod, Domeny, Nastaveni), embed kod generace s PostMessage resize scriptem, whitelist domen s wildcard subdomenami, aktivace/deaktivace widgetu s okamzitym efektem na public stranku.

Builder: Fullscreen layout s dark theme, TopBar se vsemi ovladacimi prvky (zpet, nazev, device switcher, undo/redo ikony, resetovat, ulozit), editace nazvu widgetu v TopBaru s Escape cancel, Elements tab se vsemi 10 elementy ve spravnem poradi, 3D Nahled element spravne zamceny (non-editable), vyber elementu a zobrazeni vsech editoru v Style tabu.

Color Picker: react-colorful gradient oblast funguje, HEX rucni vstup funguje, tlacitka Zrusit/Pouzit funguji.

Device Preview: Mobile (375px), Tablet (768px), Desktop (100%) – vsechny funguji s plynulymi CSS animacemi pri prepinani.

Globalni tab: Typografie s font preview, zaobleni rohu slider s vizualnim preview obdelnikem, efekty (stin karet, globalni padding), skeleton loading barvy.

Widget public stranka: Spravne chybove stavy (neexistujici ID, deaktivovany widget), stepper komponenta, footer “Powered by ModelPricer”, route zpetna kompatibilita (admin v layout, builder fullscreen, public bez chrome).

RESPONSIVITA (DEVICE PREVIEW)

Device Preview v builderu funguje spravne pro vsechna 3 zarizeni:  
Mobile (375px): Widget obsah se spravne prelomi do uzsiho layoutu. Upload zona a model preview se zobrazi pod sebou. Texty se zabaliji. Stepper zustava citelny.  
Tablet (768px): Stredni sirka, layout se prizpusobi. Obsah ma vice prostoru nez mobile ale mene nez desktop.  
Desktop (100% max 1200px): Plny layout s upload zonou a model preview vedle sebe. Vsechny elementy maji dostatek prostoru.  
Prepinani: Plynule CSS transition (\~300ms ease), zadne vizualni artefakty, zadne chyby v konzoli pri rychlem prepinani.

DOPORUCENI PRO DALSI VYVOJ (SERAZENO DLE PRIORITY)

PRIORITA 1 (kriticke, blokuji pouziti):

- Implementovat Step Switcher v builder preview pro prepinani kroku 1/2/3 kalkulacky s mock daty (WidgetBuilderPreview.jsx, BuilderTopBar.jsx)  
- \- Pridat tlacitko “Preview/Nahled” do TopBaru pro otevreni widgetu v novem tabu (BuilderTopBar.jsx)  
- \- Opravit Quick Themes – propojeni dropdown vyberu s aplikaci theme dat na vsech 56 vlastnosti (QuickThemeDropdown.jsx, GlobalTab.jsx)  
- \- Opravit paletu barev v color pickeru – onClick handler na kruzcich (BuilderColorPicker.jsx)

PRIORITA 2 (dulezite pro UX):

- Opravit Undo/Redo funkcionalitu – handleUndo theme state \+ Ctrl+Z keyboard capture ([useUndoRedo.js](http://useUndoRedo.js), [useKeyboardShortcuts.js](http://useKeyboardShortcuts.js))  
- \- Pridat WidgetHeader komponentu na public stranku /w/:id (WidgetPublicPage.jsx)

PRIORITA 3 (nice to have):

- Pridat validacni toast notifikace pri vytvareni widgetu (CreateWidgetModal.jsx)  
- \- Opravit tab bar sirku aby “Nastaveni” nebyl oriznuty (AdminWidgetPage.jsx)  
- \- Otestovat onboarding flow (smazat localStorage klic a projit 5 kroku)  
- \- Otestovat PostMessage eventy s realnym nahranim souboru

KONEC REPORTU