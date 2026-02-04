1MODELPRICER \- FINALNI DESIGN REPORT V3  
Widget Builder, Admin Widget, Widget Kalkulacka  
Datum: 3.2.2026 | Verze: 3.0 | Finalni verze

Tento report je finalnim dokumentem shrnujicim kompletni analyzu soucasneho stavu, konkurencni pruzkum 20+ webu, designove rozhodnuti (na zaklade odpovedi z V2), a detailni specifikace pro implementaci noveho designu Widget Builderu, Widget Kalkulacky a Admin Widget stranky.

ROZHODNUTI Z V2 (shrhnuti odpovedi):

- Tema: Tmave tema se svetlymi prvky (inspirace [uCalc.pro](http://uCalc.pro))  
- \- Kodovy editor: ANO, ale az jako Enterprise feature v budoucnu (samostatna implementace)  
- \- Onboarding: Varianta B+C (prednastavenych barvy z brandingu \+ interaktivni walkthrough)  
- \- Editace textu v builderu: ANO  
- \- Quick theme prepinac: ANO  
- \- Animovany prechod mezi kroky: NE (ponechat soucasny zpusob, implementovat pozdeji)  
- \- Embed kod: Varianta A (jednoduchy iframe tag)  
- \- Loading skeleton: ANO  
- \- Nahledy emailu v builderu: NE (budouci implementace)  
- \- Export designu jako JSON/CSS: NE

CAST 1: KRITICKA ANALYZA SOUCASNEHO STAVU  
1.1 Widget Builder (/admin/widget/builder/)  
Hodnoceni: NEDOSTATECNY \- Vyzaduje kompletni redesign

KRITICKE CHYBY LAYOUTU:

Problem 1 \- Rozpadla struktura dvou-paneloveho layoutu: Levy panel (Theme Editor) a pravy panel (Preview) nemaji konzistentni vysku. Preview panel nema jasnou vizualni hierarchii a chybi vizualni oddelovac. Uzivatel nema jasno kde konci editace a kde zacina nahled.

Problem 2 \- Accordion sekce jsou neprehledne: Sekce Pozadi, Text, Tlacitka, Inputy, Ramecky, Typografie a Rozmery jsou v neprehlednem accordion. Pri otevreni jedne sekce je nutne scrollovat a nahled zmizi z viewportu \- nelze sledovat zmeny v realnem case.

Problem 3 \- Preview je nereprezentativni: Nahled zobrazuje pouze fragment kalkulacky (Pocet kusu \+ Spocitat cenu). Chybi upload zona, 3D viewer, materialy, presets, fees, souhrn. Firma nevi jak bude kalkulacka vypadat.

Problem 4 \- Chybi interaktivni editace: Nelze kliknout na element v preview a upravit ho. Vse se musi hledat v accordion menu. Neprirozeny workflow.

ESTETICKE CHYBY:

Problem 5 \- Genericke barevne schema: Primarni \#2563EB je Tailwind default. Bile pozadi \+ sede karty \= zadna vizualni identita. Chybi gradienty, stiny, moderni efekty.

Problem 6 \- Genericka typografie: Inter font pouziva 90% AI webu. Chybi hierarchie velikosti.

Problem 7 \- Primitivni color picker: Zakladni browser picker. Chybi eyedropper, historie barev, palety, live preview.

Problem 8 \- Neefektivni prostor: Prava tretina prazdna pod preview. Embed kod pod scrollem.

1.2 Widget Kalkulacka (/w/wid\_QKgMyNQEWa)  
Hodnoceni: ZAKLADNI PROTOTYP \- Vyzaduje vizualni a funkcni vylepseni

Problem 1 \- Matouci stepper navigace: Kroky jsou ikony bez jasneho stavu. Aktivni krok neni zvyraznen. Chybi progress bar.  
Problem 2 \- Genericka upload zona: Standardni dashed border bez animaci a engagementu.  
Problem 3 \- Prazdny panel nahledu: Pred nahranim jen placeholder ikona. 40% sirky bez obsahu.  
Problem 4 \- Chybi identita firmy: Zadne logo, nazev. Zakaznik nevi komu patri kalkulacka.  
Problem 5 \- Chybi duveryhodnost: Zadne “Powered by”, kontakt, info o bezpecnosti dat.

1.3 Admin Widget Stranka (/admin/widget)  
Hodnoceni: FUNKCNI ALE CHAOTICKY \- Vyzaduje reorganizaci

Problem 1 \- Tri sloupce nepouzitelne: Prilis informaci najednou na jedne obrazovce. Na mensi obrazovce je Preview oriznut.  
Problem 2 \- Widget karty bez vizualniho odliseni: Chybi barevna indikace a hierarchie akcnich tlacitek.  
Problem 3 \- Prilis dlouhy editor formular: Vertikalni scroll s \~10 poli. Rozdelit do tabu nebo presunout do builderu.

CAST 2: KONKURENCNI ANALYZA \- KLICOVE POZNATKY Z 20+ WEBU  
2.1 Primi konkurenti \- Calculator/Widget Builders  
Calconic ([calconic.com](http://calconic.com)) \- Calculator widget builder. Levy panel s elementy, pravy s preview. Inspirace: Goal-based onboarding.

ConvertCalculator ([convertcalculator.com](http://convertcalculator.com)) \- No-code interactive tools. Drag-and-drop builder s charts, eSignature, show/hide logic. Inspirace: Modularni pristup k elementum.

Calculoid ([calculoid.com](http://calculoid.com)) \- Web calculator designer. Live preview na homepage. Silna integrace plateb. Inspirace: Inline editing.

uCalc ([ucalc.pro](http://ucalc.pro)) \- NEJBLIZSI INSPIRACE. Tmave pozadi, zluta/oranzova akcenty. Levy panel s elementy (List, Slider, Checkbox, Radio, Field, Text, Image, Button, Result, HTML code) \+ Design/Formula taby. Stredni cast s live editorem. Inspirace pro nas builder: Element panel vlevo, Design/Formula taby, inline editace, tmave tema se svetlymi prvky.

Outgrow ([outgrow.co](http://outgrow.co)) \- Quiz/calculator builder. Theme switcher primo v nahledu (barevne tecky). Inspirace: Rychly theme switching \- implementujeme jako Quick Theme prepinac.

[involve.me](http://involve.me) \- Funnely a widgety. “Create with AI” tlacitko. Inspirace: AI-assisted building jako budouci funkce.

Typeform ([typeform.com](http://typeform.com)) \- Elegantni minimalisticky design. Konverzacni pristup misto standardniho form layoutu. Inspirace: Originalita.

Tally ([tally.so](http://tally.so)) \- Ultra minimalisticky. No signup pro zacatek. Inspirace: Pristupnost a jednoduchost.

Jotform ([jotform.com](http://jotform.com)) \- Build/Settings/Publish taby. “Add Element” floating button. Preview toggle vpravo nahore. Inspirace: Build/Settings/Publish workflow.

2.2 Design nastroje a Website Builders  
Webflow ([webflow.com](http://webflow.com)) \- Style panel vpravo, element panel vlevo, live preview uprostred. Design variables system (background, text, heading-accent, border). Inspirace: Design variables system, on-brand konzistence.

Framer ([framer.com](http://framer.com)) \- Cerne pozadi, velka bila typografie. Inspirace: Odvazna typografie a cistota.

GrapesJS ([grapesjs.com](http://grapesjs.com)) \- Open source web template editor. AI-first pristup. Inspirace: Drag-and-drop builder architektura.

Unlayer ([unlayer.com](http://unlayer.com)) \- Embeddable builder pro emaily a stranky. Inspirace: Embed builder pattern.

2.3 Premium SaaS Design Inspirace  
Linear (linear.app) \- Precizni tmave tema. Inspirace: Hloubka tmaveho rezimu, precizni typografie.  
Notion ([notion.so](http://notion.so)) \- Hrave ilustrace dodavaji lidskost. Inspirace: Kombinace profesionality a hravosti.  
Clerk ([clerk.com](http://clerk.com)) \- Fialovy gradient, silna typografie. Inspirace: Developer-friendly marketing.  
Liveblocks ([liveblocks.io](http://liveblocks.io)) \- Tab-based demo ukazka. Inspirace: Prezentace funkcnosti.  
V7 Labs ([v7labs.com](http://v7labs.com)) \- Enterprise ale lidsky pristup. Inspirace: Profesionalni kredibilita.

2.4 Open-Source UI knihovny a animace  
shadcn/ui ([ui.shadcn.com](http://ui.shadcn.com)) \- Zakladni design system. Color picker, slider, accordion, tabs, dialog, popover. Inspirace: Komponentovy system, Theme Neutral selector.  
Aceternity UI ([ui.aceternity.com](http://ui.aceternity.com)) \- 200+ animated components. Inspirace: Spotlight efekt, Floating dock, Background beams, Moving borders.  
Magic UI (magicui.design) \- 150+ free animated components. Inspirace: Shimmer button, Animated beam, Globe, Marquee, Meteors.  
Animata (animata.design) \- 80+ hand-crafted interakcnich animaci. Inspirace: Hover efekty, loading states, transition animace.

CAST 3: NAVRH NOVEHO DESIGNU \- WIDGET BUILDER (TMAVE TEMA)  
Rozhodnuti o tematu: TMAVE TEMA se svetlymi prvky (inspirace [uCalc.pro](http://uCalc.pro)). Builder pouziva tmave pozadi s kontrastnimi svetlymi kartami a prvky editoru. Kalkulacka samotna (widget pro zakazniky) zustava s moznosti svetleho i tmaveho modu dle nastaveni firmy.

3.1 Layout Builder \- 35/65 Split  
Levy panel (35%): Editacni nastroje (tmave pozadi \#1A1D23)  
Pravy panel (65%): PLNY live preview kalkulacky (svetlejsi sede pozadi \#2A2D35)

HORNI BAR (tmave pozadi \#12141A):

- Levy: Sipka zpet \+ “Widget Builder” \+ nazev widgetu (editable)  
- \- Stred: Device preview toggle ikony (Mobile / Tablet / Desktop)  
- \- Pravy: Quick Theme dropdown \+ Undo/Redo ikony \+ “Resetovat” (ghost) \+ “Ulozit” (primary zelena)

LEVY PANEL \- TRI TABY:

TAB 1 \- STYL (vychozi):  
Zobrazuje editacni panel pro vybrany element. Obsahuje:

- Nazev vybraneho elementu (napr. “Upload zona”) s ikonou  
- \- Sekce BARVY: Pozadi, Ohraniceni, Ohraniceni hover, Text, Ikona \- kazda s color pickerem  
- \- Sekce ROZMERY: Padding, Border radius, Border width, Min height  
- \- Sekce STYL OHRANICENI: Solid / Dashed / Dotted prepinac  
- \- Sekce STIN: None / Subtle / Medium / Strong  
- \- Sekce TEXTY (NOVE \- na zaklade rozhodnuti): Editace vsech textu elementu (hlavni text, popis, placeholder, tlacitko text)  
- \- Sekce POKROCILE: Rozbalovaci s dalsimi moznostmi

TAB 2 \- ELEMENTY:  
Stromova struktura vsech editovatelnych elementu:

- Background  
- \- Header (Logo, Nazev firmy, Tagline)  
- \- Upload zona  
- \- 3D Viewer container (needitovatelny vizualne)  
- \- Konfigurace panel (Material dropdown, Preset selector, Inputy)  
- \- Doplnkove sluzby (fees)  
- \- Souhrn ceny  
- \- Tlacitko “Vypocitat” / CTA  
- \- Footer (Powered by)  
- Kliknutim na nazev v seznamu se vybere element v preview. Aktivni element oznacen barevnou teckou.

TAB 3 \- GLOBALNI:

- Font selector (dropdown s preview fontu)  
- \- Zaobleni rohu (slider \+ px hodnota, globalni)  
- \- Jazyk (CZ / EN dropdown)  
- \- Logo upload a klikaci URL  
- \- Quick Theme prepinac (NOVE): “Modern Dark”, “Clean Light”, “Professional Blue”, “Warm Neutral”, “Custom” \- firma vybere zaklad jednim klikem a pak upravuje  
- \- Loading skeleton toggle (NOVE): Zapnout/vypnout skeleton animaci pri nacitani widgetu

PRAVY PANEL \- LIVE PREVIEW:  
“LIVE PREVIEW” label se zelenou teckou a statusem “Live” (pravo nahore)  
PLNA kalkulacka se VSEMI elementy:

1. Header \- Logo firmy \+ Nazev \+ Tagline  
2. 2\. Stepper navigace \- 3 kroky s progress barem  
3. 3\. Upload zona \- Drag and drop \+ tlacitko  
4. 4\. 3D Model viewer \- Placeholder nebo realny viewer  
5. 5\. Konfigurace panel \- Material, preset, pocet, parametry  
6. 6\. Doplnkove sluzby \- Selectable fees  
7. 7\. Souhrn ceny \- Breakdown \+ celkova cena  
8. 8\. CTA tlacitko \- “Vypocitat cenu” / “Pridat do kosiku”  
9. 9\. Footer \- Powered by (pokud aktivni)

INTERAKTIVNI EDITACE (klikani na elementy):

- Hover efekt: dashed outline s modrou barvou (\#3B82F6)  
- \- Klik na element: solid outline \+ selection handles v rozich  
- \- Tooltip pri hoveru: nazev elementu \+ “Klikni pro editaci”  
- \- Vybrany element se automaticky zobrazi v levem edit panelu (Tab 1 \- Styl)  
- \- Dvojklik na text: moznost primo editovat text v preview (inline editing)

3.2 Barevny system \- TMAVE TEMA “Dark Professional”  
BUILDER BARVY (tmave tema):

- Background hlavni: \#0F1117 (temer cerna)  
- \- Background sekundarni: \#1A1D23 (levy panel)  
- \- Background preview: \#2A2D35 (preview oblast)  
- \- Surface/Card: \#1E2128 (karty, sekce v panelu)  
- \- Surface Hover: \#262A33  
- \- Border: \#2E3340 (jemne ohraniceni)  
- \- Border Focus: \#3B82F6 (modra pro fokus a selekci)  
- \- Text Primary: \#F1F5F9 (svetly text na tmavem pozadi)  
- \- Text Secondary: \#94A3B8 (sekundarni text)  
- \- Text Muted: \#64748B (utlumeny text)  
- \- Accent Primary: \#3B82F6 (modra pro interaktivni prvky)  
- \- Accent Hover: \#2563EB  
- \- Success: \#10B981 (zelena \- ulozeno, aktivni)  
- \- Warning: \#F59E0B (oranzova \- upozorneni)  
- \- Error: \#EF4444 (cervena \- chyby)  
- \- Selection Outline: \#3B82F6 (outline vybraneho elementu)

WIDGET/KALKULACKA VYCHOZI BARVY (svetle tema pro zakazniky):

- Primary: \#1E40AF (tmavsi autoritativni modra)  
- \- Primary Hover: \#1E3A8A  
- \- Secondary: \#059669 (emerald green)  
- \- Background: \#FAFBFC (lehky cool ton)  
- \- Card: \#FFFFFF  
- \- Card Hover: \#F8FAFC  
- \- Border: \#E2E8F0  
- \- Border Focus: \#1E40AF  
- \- Text Primary: \#0F172A  
- \- Text Secondary: \#475569  
- \- Text Muted: \#94A3B8  
- \- Success: \#10B981  
- \- Warning: \#F59E0B  
- \- Error: \#EF4444

QUICK THEME PRESETY (NOVE):

1. “Modern Dark” \- Tmave pozadi (\#1A1D23), svetly text, modry accent (\#3B82F6)  
2. 2\. “Clean Light” \- Bile pozadi, tmava typografie, zeleny accent (\#059669)  
3. 3\. “Professional Blue” \- Svetle modre tony, autoritativni modra primary (\#1E40AF)  
4. 4\. “Warm Neutral” \- Teple sede tony (\#F5F0EB), hneda/oranzova akcenty (\#D97706)  
5. 5\. “Custom” \- Firma si vybere vlastni barvy od zacatku

3.3 Typografie  
Headings: DM Sans (600-700 weight) \- Moderni SaaS feel, odliseni od generickych AI webu  
Body: Inter (400-500 weight) \- Citelnost a profesionalita  
Code: JetBrains Mono \- Pro embed kod snippety

Velikostni skala:  
H1 (Page title): 32px / line-height 1.2  
H2 (Section title): 24px / line-height 1.3  
H3 (Card title): 18px / line-height 1.4  
Body: 14px / line-height 1.5  
Small/Caption: 12px / line-height 1.5  
Label: 13px / line-height 1.4 / font-weight 500

3.4 Color Picker komponenta  
Musi obsahovat:

- Gradient picker oblast (saturation \+ lightness) \- velka oblast pro presny vyber  
- \- Hue slider (horizontalni)  
- \- Opacity slider (horizontalni)  
- \- HEX i RGB input pole (prepinatelne)  
- \- Historie poslednich 8 barev (automaticky se uklada)  
- \- Preset palety: Blue, Green, Grey, Custom  
- \- Eyedropper tlacitko pro vyber barvy z obrazovky  
- \- Live preview na elementu pri vyberu (zmena v realnem case)  
- \- Tlacitka “Pouzit” a “Zrusit”  
- \- Tmave pozadi popoveru (\#1E2128) s svetlymi ovladacimi prvky

3.5 Onboarding \- Prvni otevreni builderu (B+C varianta)  
Rozhodnuti: Kombinace variant B a C. Kalkulacka se zobrazi s prednastavenymi barvami z Branding sekce firmy a hned se spusti interaktivni walkthrough.

Krok 1: “Vitejte ve Widget Builderu\!” \- Overlay s vysvetlenim ze toto je nastroj pro vizualni upravu kalkulacky. Tlacitko “Zacit pruvodce” / “Preskocit”.  
Krok 2: Zvyrazneni preview panelu \- “Toto je nahled vasi kalkulacky. Kliknete na libovolny element pro jeho upravu.”  
Krok 3: Zvyrazneni leveho panelu \- “Zde upravite barvy, rozmery a texty vybraneho elementu.”  
Krok 4: Zvyrazneni Quick Theme \- “Rychla zmena celkoveho vzhledu jednim klikem.”  
Krok 5: Zvyrazneni tlacitka Ulozit \- “Po dokonceni uprav nezapomente ulozit zmeny.”

Barvy z Brandingu se automaticky aplikuji na kalkulacku pri prvnim otevreni:

- Primary barva z brandingu \-\> tlacitka, aktivni prvky  
- \- Sekundarni barva \-\> akcenty  
- \- Logo z brandingu \-\> header kalkulacky  
- \- Nazev firmy z brandingu \-\> header kalkulacky

CAST 4: NAVRH ADMIN WIDGET STRANKY  
4.1 Redesign /admin/widget  
Soucasny tri-sloupcovy layout se nahrazuje prehlednejsim dvou-sloupcovym.

HORNI BAR:

- Nazev stranky “Widget Code” \+ podnazev “Sprava widgetu a embed kodu”  
- \- Tarif badge (Starter / Pro / Business)  
- \- Tlacitko “Vytvorit widget” (primary CTA)

HLAVNI OBSAH \- DVA SLOUPCE:

Levy sloupec (35%) \- Widget instances seznam:

- Karty widgetu s: Nazev, Status badge (Active/Disabled), Typ (Full/Compact), Pocet domen  
- \- Aktivni widget zvyraznen modrim okrajem  
- \- Akcni ikony: Builder (hlavni), Duplikovat, Disable, Smazat  
- \- Karta ukazuje miniaturni preview  
- \- Barevny prouzek vlevo na karte (zelena \= active, seda \= disabled)

Pravy sloupec (65%) \- Detail vybraneho widgetu:  
Taby: Konfigurace | Embed kod | Domeny | Nastaveni

TAB KONFIGURACE: Nazev widgetu, Typ (dropdown: Full/Compact), Jazyk (CZ/EN), Sirka (px nebo %)  
TAB EMBED KOD: Jednoduchy iframe snippet (Varianta A) s copy-paste tlacitkem. Jasne instrukce “Vlozte tento kod na vasi webovou stranku.”  
TAB DOMENY: Whitelist sprava \+ “Pridat domenu” formular \+ podpora wildcard (\*.[firma.cz](http://firma.cz))  
TAB NASTAVENI: Enable/Disable toggle, ShopID, Zobrazit/skryt Powered by (dle tarifu)

DULEZITE ZMENY:

- Preview se KOMPLETNE presouva do builderu (ne na hlavni admin stranku)  
- \- Editor formulare se rozdeli do tabu (ne jeden dlouhy formular)  
- \- Widget karty maji vizualni odliseni (barevny prouzek \+ status badge)

4.2 Widget Karta \- Redesign  
Kazda karta obsahuje:

- Barevny prouzek vlevo (zelena \= active, seda \= disabled)  
- \- Nazev widgetu (tucne, DM Sans 600\)  
- \- Status badge s barvou (zelena “Active” / seda “Disabled”)  
- \- Widget ID (maly text, monospace)  
- \- Typ (Full/Compact) a pocet domen  
- \- Quick actions ikony: Builder, Kopirovat embed, Duplikovat, Disable, Smazat  
- \- Hover efekt s jemnym stinem a zvysenim elevation  
- \- Miniaturni preview v rohu karty (maly screenshot widgetu)

CAST 5: NAVRH WIDGET KALKULACKY  
5.1 Header kalkulacky  
\- Logo firmy (klikaci URL na homepage firmy)

- Nazev firmy (tucne, vetsi font)  
- \- Tagline pod nazvem (mensi, sekundarni barva)  
- \- Editovatelne v builderu: velikost loga (40-80px), zaobleni, padding, font size a weight nazvu, barva textu, tagline zobrazit/skryt, background color/gradient, spacing, zarovnani (left/center)  
- \- Editovatelne texty: Nazev firmy, Tagline text

5.2 Stepper navigace \- Redesign  
Tri kroky: Nahrani modelu \> Nastaveni \> Souhrn a cena  
Kazdy krok: Ikona \+ cislo \+ nazev kroku  
Spojovaci linka mezi kroky (plna pro dokoncene, dashed pro budouci)  
Progress bar pod steppery (vizualni postup v %)

Stavy kroku:

- Dokonceny: zelena fajfka, zelena barva  
- \- Aktivni: modra tecka (bez animace \- rozhodnuto v V2), modra barva  
- \- Neaktivni: sedy kruh, seda barva

Prechody mezi kroky: BEZ ANIMACE (rozhodnuto v V2 \- ponechava se soucasny zpusob prepinani, animace se muze pridat pozdeji)

Editovatelne v builderu: Barva aktivniho/dokonceneho/neaktivniho kroku, styl spojovaci linky, zobrazit/skryt progress bar, zobrazit/skryt popisky  
Editovatelne texty: Nazvy vsech tri kroku

5.3 Upload zona \- Redesign  
Hlavni oblast pro nahrani 3D modelu. Dva zpusoby: Drag and drop nebo klik na tlacitko.  
Podporovane formaty: STL, OBJ. Max velikost: 50MB.

Stavy:

- Default: prazdna zona s ikonou a textem  
- \- Hover/Drag-over: zvyrazneni ohraniceni, zmena barvy pozadi  
- \- Loading: progress bar s procentem  
- \- Success: zelena fajfka s nazvem souboru  
- \- Error: cervene hlasenka s popisem chyby

Editovatelne vlastnosti v builderu:

- Vzhled: Minimalisticky / Standardni / Rozsireny  
- \- Barvy: pozadi, ohraniceni, hover, ikona, text hlavni, text sekundarni  
- \- Animace: drag-over toggle, pulzujici ikona toggle  
- \- Editovatelne texty: Nadpis (“Nahrajte 3D model”), Popis (“Pretahnete STL nebo OBJ soubory”), Tlacitko (“Vybrat soubor”), Chybova hlaska, Uspechova hlaska

5.4 3D Model Viewer  
\- Placeholder stav pred nahranim (skeleton animace \- NOVE rozhodnuti)

- Po nahrani: Interaktivni 3D nahled modelu  
- \- Metriky ze sliceru (objem, rozmer, cas tisku)  
- \- POZN: Kontejner 3D vieweru se NESTYLUJE v builderu (funkcni komponenta, ne vizualni)  
- \- Loading skeleton se zobrazi misto prazdneho placeholder stavu (rozhodnuti z V2)

5.5 Konfigurace panel  
\- Material selector (dropdown)

- Preset selector (pokud existuji presety)  
- \- Pocet kusu (number input)  
- \- Dalsi parametry dle nastaveni firmy  
- \- Fees/doplnkove sluzby (checkboxy)  
- \- Editovatelne texty: Label pro kazdy input, placeholder texty, popisky materialu

5.6 Souhrn ceny  
Struktura: Material \+ Cas tisku \+ Fees \= Celkem bez DPH \+ DPH \= CELKEM  
CTA tlacitko: “Pridat do kosiku” s ikonou kosiku

Editovatelne v builderu:

- Barva pozadi karty, oddelovacich car, celkove ceny (highlight)  
- \- Font size a weight  
- \- Zobrazit/skryt DPH breakdown  
- \- Mena a format cisla  
- \- CTA tlacitko: barva, text, ikona  
- \- Editovatelne texty: “Souhrn ceny” nadpis, “Material” label, “Cas tisku” label, “Celkem” label, CTA tlacitko text

5.7 Footer  
”Powered by ModelPricer” text  
Zobrazeni dle tarifu:

- Starter/Pro: Povinne zobrazeno (nelze skryt)  
- \- Business: Moznost skryt (feature flag v nastaveni widgetu)

5.8 Loading Skeleton (NOVE \- rozhodnuti z V2)

Widget pri nacitani zobrazi skeleton animaci misto prazdne obrazovky. Sede bloky ve tvaru obsahu (header, stepper, upload zona, konfigurace) s jemnou shimmer animaci. Zakaznik vi ze se neco nacita. Profesionalni dojem.

CAST 6: FUNKCE K IMPLEMENTACI \- PRIORITIZACE  
6.1 PRIORITA 1 \- MVP (Sprint 1\)

1. Tmave tema builderu (kompletni vizualni prestavba)  
2. 2\. Plny live preview v builderu (kompletni kalkulacka, ne fragment)  
3. 3\. Klikaci editace elementu (klik na element v preview otevre editor)  
4. 4\. Sidebar element list (Tab 2 \- fallback pro vyber elementu)  
5. 5\. Vylepseny color picker (gradient, history, eyedropper)  
6. 6\. Device preview toggle (Mobile/Tablet/Desktop)  
7. 7\. Undo/Redo (zakladni historie zmen)  
8. 8\. Editace textu v builderu (vsechny texty kalkulacky editovatelne)  
9. 9\. Quick Theme prepinac (5 prednastavnych temat)  
10. 10\. Onboarding walkthrough (B+C varianta s barvami z brandingu)  
11. 11\. Loading skeleton pro widget  
12. 12\. Admin Widget stranka redesign (dva sloupce, taby)

6.2 PRIORITA 2 \- Near-term (Sprint 2-3)

1. Per-device layout (ruzne rozlozeni pro ruzna zarizeni)  
2. 2\. Drag and drop layout (presunuti bloku v kalkulacce)  
3. 3\. Template presets (“Minimal”, “Full”, “Compact” sablony)  
4. 4\. Brand palette import (import barev z URL nebo obrazku)  
5. 5\. Animovane prechody mezi kroky kalkulacky  
6. 6\. Custom CSS injection (PRO tier \- pro pokrocile upravy)

6.3 PRIORITA 3 \- Future / Enterprise

1. Kodovy editor / CSS+JSON editace (Enterprise tier \- samostatna implementace)  
2.    \- API pristup pres zabezpecene importy (napr. import slicing sdk)  
3.    \- Firmy s vlastnim programatorem si mohou kalkulacku vice prizpusobit  
4.    \- Nutna ochrana proprietary kodu pres obfuskaci a API klice  
5.    \- Propojeni na backend (PrusaSlicer atd.) pres zabezpecene SDK/API endpointy  
6.    \- Podrobny plan bude vypracovan jako samostatny dokument  
7. 2\. A/B testing (vice verzi widgetu pro testovani konverzi)  
8. 3\. Analytics overlay (heatmapa kliknuti primo v builderu)  
9. 4\. Collaboration (real-time editace vice uzivatelu)  
10. 5\. Version history (casova osa zmen s moznosti rollback)  
11. 6\. Nahledy emailu v builderu (editace emailu s rekapitulaci)  
12. 7\. AI-assisted building (automaticke navrzeni designu)

CAST 7: EMBED SYSTEM A BEZPECNOST  
7.1 Iframe Embed Kod (Varianta A \- jednoduchy)  
Rozhodnuti z V2: Pouze Varianta A (jednoduchy iframe tag s komentarem). Pokrocily embed s event handlery se prida v budouci verzi.

Widget se embeduje pres iframe s automatickym resize. Snippet obsahuje:

- iframe src URL  
- \- Inicializacni script pro auto-resizing  
- \- Komentar s instrukcemi

PostMessage eventy (interni, pro budouci pouziti):

- MODELPRICER\_RESIZE  
- \- MODELPRICER\_PRICE\_CALCULATED  
- \- MODELPRICER\_ADD\_TO\_CART  
- \- MODELPRICER\_ERROR

7.2 Domain Whitelist  
\- Widget kontroluje zda je embednut na povolene domene

- Nepovolena domena: zobrazi hlaseni “Widget neni povolen pro tuto domenu”  
- \- Podpora wildcard domen (\*.[firma.cz](http://firma.cz))  
- \- Sprava v admin sekci (Tab Domeny)

7.3 Bezpecnost \- Budouci upravy  
\- URL Token/Signature (HMAC-SHA256)

- Rate limiting (100 slicing requests/hodina/IP)  
- \- CSP hlavicky  
- \- Server-side validace originu  
- \- Pro Enterprise: Zabezpecene SDK/API pro pristup k backend sluzbam (PrusaSlicer). Import pres zkracene identifikatory (napr. import slicing sdk:12345). Ochrana proprietary kodu pres obfuskaci. Detailni bezpecnostni plan bude zpracovan samostatne.

CAST 8: OPEN-SOURCE UI PRVKY K VYUZITI  
Ze shadcn/ui: Color picker (zaklad), Slider (pro radius a dalsi hodnoty), Tabs (pro builder sekce), Dialog/Popover (pro color picker popup), Accordion (pro sbalovaci sekce), Command palette (pro rychly pristup k elementum)

Z Aceternity UI: Spotlight efekt (pro hover na elementy v preview), Moving border (pro aktivni element selection), Background beams (pro prazdny stav preview)

Z Magic UI: Shimmer button (pro CTA tlacitka v kalkulacce), Animated beam (pro spojeni mezi kroky stepperu), Dock (pro builder toolbar)

Z Animata: Hover card efekty (pro widget karty v admin), Loading skeleton (pro nacitani preview a widgetu), Smooth transitions (pro prepinani mezi elementy)

CAST 9: ODKAZY NA INSPIRACI  
CALCULATOR BUILDERS:  
Calconic: [https://www.calconic.com](https://www.calconic.com)  
ConvertCalculator: [https://www.convertcalculator.com](https://www.convertcalculator.com)  
Calculoid: [https://www.calculoid.com](https://www.calculoid.com)  
uCalc (HLAVNI INSPIRACE): [https://ucalc.pro/en](https://ucalc.pro/en)  
Outgrow: [https://outgrow.co](https://outgrow.co)

FORM BUILDERS:  
Typeform: [https://www.typeform.com](https://www.typeform.com)  
Tally: [https://tally.so](https://tally.so)  
Jotform: [https://www.jotform.com](https://www.jotform.com)  
[involve.me](http://involve.me): [https://www.involve.me](https://www.involve.me)

WEBSITE/APP BUILDERS:  
Webflow: [https://webflow.com/designer](https://webflow.com/designer)  
Framer: [https://framer.com](https://framer.com)  
GrapesJS: [https://grapesjs.com](https://grapesjs.com)  
Unlayer: [https://unlayer.com](https://unlayer.com)

PREMIUM SAAS DESIGN:  
Linear: [https://linear.app](https://linear.app)  
Notion: [https://notion.so](https://notion.so)  
Clerk: [https://clerk.com](https://clerk.com)  
Liveblocks: [https://liveblocks.io](https://liveblocks.io)  
V7 Labs: [https://www.v7labs.com](https://www.v7labs.com)

UI KNIHOVNY:  
shadcn/ui: [https://ui.shadcn.com](https://ui.shadcn.com)  
Aceternity UI: [https://ui.aceternity.com](https://ui.aceternity.com)  
Magic UI: [https://magicui.design](https://magicui.design)  
Animata: [https://animata.design](https://animata.design)

CAST 10: SOUHRN KLICOVYCH ZMEN V3 vs V2  
Toto je prehled vsech klicovych zmen oproti V2 reportu na zaklade odpovedi na otazky:

1. TMAVE TEMA BUILDERU: Builder pouziva tmave pozadi inspirovane [uCalc.pro](http://uCalc.pro). Tmave pozadi (\#0F1117 az \#1A1D23) se svetlymi kartami a prvky. Kalkulacka samotna (pro zakazniky) ma vlastni barevne schema editovatelne firmou.  
2. EDITACE TEXTU: Vsechny texty v kalkulacce jsou editovatelne v builderu. Kazdy element ma sekci “Texty” kde firma muze zmenit nadpisy, popisy, placeholder texty, texty tlacitek. Firma si prizpusobi jazyk a ton komunikace.  
3. QUICK THEME PREPINAC: 5 preddefinovanych barevnych temat (Modern Dark, Clean Light, Professional Blue, Warm Neutral, Custom). Firma vybere zaklad jednim klikem a pak individualne upravuje. Inspirace z Outgrow theme switcheru.  
4. ONBOARDING B+C: Kalkulacka se pri prvnim otevreni builderu zobrazi s barvami z Branding sekce firmy (Primary, logo, nazev) a soucasne se spusti 5-krokovy interaktivni walkthrough pruvodce.  
5. LOADING SKELETON: Widget pri nacitani zobrazi skeleton animaci (sede bloky ve tvaru obsahu s shimmer efektem) misto prazdne obrazovky.  
6. BEZ ANIMOVANYCH PRECHODU: Prechody mezi kroky kalkulacky zustavaji jako nyni (bez slide animace). Muze se pridat v budouci verzi.  
7. JEDNODUCHY EMBED KOD: Pouze iframe tag s komentarem (Varianta A). Pokrocily embed s event handlery se prida pozdeji.  
8. KODOVY EDITOR ODLOZEN: Enterprise feature s vlastnim CSS/JSON editorem bude implementovan samostatne. Vyzaduje bezpecnostni plan pro ochranu proprietary kodu a API pro pristup k backendu.  
9. BEZ EXPORTU DESIGNU: Export konfigurace jako JSON/CSS neni implementovan.  
10. BEZ NAHLEDU EMAILU: Editace emailovych sablon v builderu bude resena v budouci verzi.  
11. LEVY PANEL MA 3 TABY: Styl (editace vybraneho elementu vcetne textu), Elementy (stromova struktura), Globalni (font, jazyk, logo, quick theme, skeleton toggle).  
12. ADMIN STRANKA REDESIGN: Dva sloupce misto tri. Widget karty s barevnym prouzkem a status badge. Detail widgetu v tabech (Konfigurace, Embed kod, Domeny, Nastaveni). Preview presunuto kompletne do builderu.

CAST 11: VIZUALNI SCHEMATICKA MAPA BUILDERU  
ASCII wireframe noveho Widget Builderu:

\+================================================================+  
|  \<- Widget Builder: Homepage    \[M\] \[T\] \[D\]    Theme v  U/R  \[Ulozit\] |  
\+================================================================+  
|  \[Styl\] \[Elementy\] \[Globalni\]  |                               |  
|--------------------------------|    LIVE PREVIEW        \* Live  |  
|  \> Upload zona                 |                               |  
|  \+--------------------------+  |  \+-------------------------+  |  
|  | BARVY                    |  |  | \[Logo\] Nazev firmy      |  |  
|  | Pozadi:    \[\#\] \[picker\]  |  |  | Tagline text            |  |  
|  | Ohraniceni:\[\#\] \[picker\]  |  |  \+-------------------------+  |  
|  | Text:      \[\#\] \[picker\]  |  |  | (1)-----(2)-----(3)     |  |  
|  | Ikona:     \[\#\] \[picker\]  |  |  | Nahrani  Nastav  Souhrn |  |  
|  \+--------------------------+  |  | \[====progress 33%====\]  |  |  
|  | ROZMERY                  |  |  \+-------------------------+  |  
|  | Padding: \[--o—-\] 16px  |  |  |                         |  |  
|  | Radius:  \[----o–\] 12px  |  |  |  \+-------------------+  |  |  
|  | Border:  \[-o—--\]  1px  |  |  |  | Nahrajte 3D model |  |  |  
|  \+--------------------------+  |  |  | .STL .OBJ do 50MB |  |  |  
|  | TEXTY (NOVE)             |  |  |  | \[Vybrat soubor\]   |  |  |  
|  | Nadpis: \[Nahrajte 3D..\]  |  |  |  \+-------------------+  |  |  
|  | Popis:  \[Pretahnete..\]   |  |  |                         |  |  
|  | Tlacitko:\[Vybrat soub.\]  |  |  |  \+---3D VIEWER—---+  |  |  
|  \+--------------------------+  |  |  | (skeleton/model)  |  |  |  
|  | STYL OHRANICENI          |  |  |  \+-------------------+  |  |  
|  | \[Solid\] \[Dashed\] \[Dotted\]|  |  |                         |  |  
|  \+--------------------------+  |  |  Material: \[dropdown v\]  |  |  
|  | STIN                     |  |  |  Pocet:    \[1      \]     |  |  
|  | \[N\] \[S\] \[M\] \[Strong\]    |  |  |  \[\] Dodatecna sluzba \+1  |  |  
|  \+--------------------------+  |  |                         |  |  
|                                |  |  \+---SOUHRN CENY—--+  |  |  
|                                |  |  | Material:   850 Kc|  |  |  
|                                |  |  | Cas tisku:  400 Kc|  |  |  
|                                |  |  |===================|  |  |  
|                                |  |  | CELKEM:  1 250 Kc |  |  |  
|                                |  |  | \[Pridat do kosiku\] |  |  |  
|                                |  |  \+-------------------+  |  |  
|                                |  |  Powered by ModelPricer  |  |  
|                                |  \+-------------------------+  |  
\+================================================================+

Poznamka: \[M\] \[T\] \[D\] \= Mobile / Tablet / Desktop toggle  
Levy panel: 35% sirky, tmave pozadi (\#1A1D23)  
Pravy panel: 65% sirky, svetlejsi pozadi (\#2A2D35)  
Horni bar: nejtmavsi (\#12141A)

—  
KONEC REPORTU V3  
Toto je finalni verze designoveho reportu pro ModelPricer Widget system.  
Vsechna rozhodnuti z V2 otazek jsou zapracovana.  
Pripraveno k implementaci.

Autor: Claude Opus 4.5 | Datum: 3.2.2026