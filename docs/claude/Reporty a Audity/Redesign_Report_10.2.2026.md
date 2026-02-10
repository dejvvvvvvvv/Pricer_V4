Komplexní designový audit — ModelPricer (localhost:4028)
Jako senior design specialista s 30 lety praxe ti předkládám podrobný audit tvého webu. Procházel jsem celý web — homepage, Demo kalkulačky, Ceník, Podpora — a analyzoval jsem vizuální stránku, typografii, layout, konzistenci, hierachii a celkový UX z designového pohledu.

1. HORIZONTÁLNÍ PŘETEČENÍ STRÁNKY (Kritický problém)
Celá stránka má viditelný horizontální scrollbar. Dokument má šířku 1160 px, zatímco viewport je 926 px. Viník je „marquee" (běžící pásek s texty jako PrusaSlicer CLI, Shopify, WooCommerce atd.) v trust baru, který se roztahuje na cca 2660 px bez správného ořezu.
Co opravit: Marquee kontejner potřebuje overflow: hidden na svém rodičovském prvku na úrovni celé stránky, nebo ještě lépe overflow-x: hidden na body/html. Tato chyba je fatální z hlediska prvního dojmu — uživatel vidí, že se stránka „rozjíždí" do strany, což okamžitě signalizuje neprofesionální zpracování.

2. KONFLIKT HEADER (SVĚTLÝ) vs. BODY (TMAVÝ)
Toto je nejzásadnější vizuální nesoulad celého webu. Header (navigace) má bílé poloprůhledné pozadí (rgba(255, 255, 255, 0.7) s backdrop-blur) a tmavý text (rgb(10, 10, 10)), zatímco veškerý obsah pod ním je v tmavém dark-mode schématu. Vzniká tak extrémně tvrdý vizuální přechod — bílý/šedý pruh nahoře, pak okamžitě neprůhledná temnota. Header se chová, jako by patřil ke zcela jinému webu.
Co opravit: Header potřebuje sjednotit s dark-mode estetikou celého webu. Doporučuji tmavý poloprůhledný header, např. rgba(8, 9, 12, 0.85) s blur efektem, světlé texty navigace a jemný border-bottom v tlumené barvě (např. rgba(255, 255, 255, 0.08)). Tím vznikne celistvý, profesionální dojem, kdy navigace plynule přechází do obsahu.

3. DVĚ PATIČKY (DUPLIKOVANÝ FOOTER)
Na stránce existují doslova dva elementy <footer> naskládané přes sebe. První footer je tmavý (s textem „[ MODEL.PRICER ] · v3.2" a linky HOME, PRICING, SUPPORT). Druhý footer pod ním má šedé pozadí (rgb(31, 41, 55)) a obsahuje logo ModelPricer, navigační sloupec, právní sloupec a copyright. Navíc druhý footer má v sobě inline <style> tagy přímo v textovém obsahu, což je nepořádek v HTML.
Co opravit: Zachovat pouze jeden footer — sloučit obsah obou do jednoho koherentního bloku. První footer s jeho monospace/terminálovou estetikou („[ MODEL.PRICER ] · v3.2") je designově zajímavý, ale informačně chudý. Druhý footer má správnou strukturu (navigace, právní info, copyright). Řešení: jeden footer s vizuálním stylem odpovídajícím celému webu — tmavé pozadí konzistentní se zbytkem, terminálový podtón z prvního footeru jako dekorativní prvek, a kompletní navigaci/právní info z druhého footeru.

4. ROZBITÁ DIAKRITIKA NA STRÁNCE „DEMO KALKULAČKY"
Na stránce /test-kalkulacka se namísto českých znaků zobrazují unicode escape sekvence: „P\u0159et\u00e1hn\u011bte STL nebo OBJ soubory nebo klikn\u011bte pro v\u00fdb\u011br", „Maxim\u00e1ln\u00ed velikost: 50MB na soubor", „Podporovan\u00e9 form\u00e1ty". To je z designového hlediska naprosto nepřijatelné — uživatel vidí nesmyslné řetězce místo srozumitelného textu.
Co opravit: I když je to primárně problém s kódováním, z designového pohledu je to katastrofální pro uživatelský zážitek. Texty musí být čitelné. Doporučuji provést audit všech textových řetězců na této stránce a zajistit, aby čeština (háčky, čárky) fungovala správně na všech místech, kde se používá.

5. NEKONZISTENCE MĚNY NA HOMEPAGE vs. CENÍKU
Na homepage v sekci „Cenové plány" jsou ceny v dolarech: $0, $49, $199. Na dedikované stránce Ceník (/pricing) jsou ceny v korunách: 499 Kč, 999 Kč, „Na míru". Nejen, že se liší měna, ale i samotné hodnoty — undefined). Uživatel se oprávněně zeptá: kolik to vlastně stojí?

Co opravit: Sjednotit měnu napříč celým webem. Pokud cílíte primárně na český trh (navigace je v češtině, jazyk je nastaven na CS), použijte Kč všude. Homepage pricing sekce by měla zobrazovat stejné ceny jako stránka Ceník. Pokud potřebujete multi-currency, pak přepínač jazyka by měl současně přepínat i měnu — ale nikdy by neměla existovat nekonzistence na jednom jazykovém nastavení.

6. JAZYKOVÝ CHAOS — ANGLIČTINA vs. ČEŠTINA
Web je nastaven na češtinu (přepínač ukazuje „CZ CS"), ale na mnoha místech je obsah stále anglicky. Hlavní hero: „Precision Pricing for 3D Manufacturing" a „Start Building" / „See Demo" jsou anglicky, zatímco popis pod tím je anglicky. Sekce „Co je ModelPricer?" a „Jak to funguje" jsou česky. Pricing na homepage má „Recommended" badge anglicky, ale tlačítka „Podívat se na demo" / „Doporučeno" jsou česky. První footer má „HOME", „PRICING", „SUPPORT" anglicky, druhý má „Home", „Ceník", „Podpora" česky. Stepper na demo stránce je česky, ale headline „NAHRAJTE 3D MODELY" je uppercase česky.
Co opravit: Kompletní jazykový audit. Když je přepínač na CS, VŠECHNO musí být v češtině — hero headline, CTA tlačítka, badge „Doporučeno" (ne „Recommended"), navigační linky v footeru. Udělat jednotný glossář pojmů a důsledně ho dodržovat. Žádný smíšený jazyk na jedné stránce — to vypadá nehotově a neprofesionálně.

7. HERO SEKCE — PRÁZDNÝ PROSTOR A CHYBĚJÍCÍ VIZUÁLNÍ KOTVA
Hero sekce zabírá celou výšku viewportu, ale pravá polovina je zcela prázdná — jen tmavé pozadí s jemným grid patternem. Nadpis, popis a CTA tlačítka jsou zarovnané doleva a obsazují pouze cca 40 % šířky. Zbývajících 60 % je vizuální prázdnota. Chybí jakýkoli vizuální prvek (ilustrace, 3D model, screenshot produktu, animace), který by vysvětloval, co produkt dělá.
Co opravit: Doporučuji přidat na pravou stranu hero sekce vizuální prvek — buď screenshot kalkulačky/widgetu v akci, mockup embedovaného widgetu na e-shopu, nebo alespoň stylizovanou 3D vizualizaci modelu. SaaS produkty potřebují v hero sekci ukázat, co dělají. Samotný text nestačí — uživatel musí okamžitě visuálně pochopit, o co jde. Také badge „STATUS: PRINTING" v horní části je ztracený — malý, nenápadný, bez jasného účelu. Buď ho výrazněji integrujte do příběhu, nebo odstraňte.

8. TYPOGRAFICKÁ NEKONZISTENCE ACROSS PAGES
Na hlavních stránkách se používá „Space Grotesk" pro headingy, což je dobrá volba pro tech/SaaS produkt. Ale na stránce Demo kalkulačky se stepper labely zobrazují ve fontu „Space Mono" / „JetBrains Mono" (monospace) s textTransform: uppercase. Upload area headline „NAHRAJTE 3D MODELY" je také v monospace uppercase. To vytváří vizuální nesoulad — hlavní stránky mají čistý, moderní look se Space Grotesk, ale demo stránka vypadá jako terminálový interface.
Co opravit: Rozhodněte se pro jednu designovou řeč. Pokud chcete terminálový/tech nádech, používejte monospace konzistentně jako dekorativní prvek (labely, kódy, čísla), ale nikdy jako hlavní font pro uživatelské rozhraní. Stepper labely by měly být v Space Grotesk (shodně s hlavní navigací), monospace zachovejte pouze pro technické údaje (.STL, .OBJ badges), terminálový footer text apod.

9. KONTRASTNÍ PROBLÉMY A ČITELNOST TEXTU
Popisné texty v sekcích (např. pod „Co je ModelPricer?", popisy v kartách „Jak to funguje") mají šedou barvu (rgb(155, 163, 176) nebo rgb(92, 99, 112)) na tmavém pozadí (rgb(8, 9, 12)). Zejména světlejší šedá rgb(92, 99, 112) na tak tmavém pozadí dosahuje kontrastního poměru jen kolem 3.5:1, což nesplňuje WCAG AA standard (vyžadující 4.5:1 pro běžný text). Podobně "See Demo" tlačítko má barvu rgb(155, 163, 176), což je sice čitelnější, ale stále na hranici.
Co opravit: Zvýšit jasnost sekundárních textů minimálně na rgb(170, 178, 190) nebo světlejší, aby kontrastní poměr vůči tmavému pozadí spolehlivě překročil 4.5:1. U interaktivních prvků (tlačítka, linky) je požadavek ještě přísnější. Doporučuji vytvořit design token systém s definovanými barvami textu: primary text (rgb(232, 236, 241)), secondary text (rgb(180, 188, 200)), disabled text (~rgb(120, 128, 140)).

10. STAT KARTY — VERTIKÁLNÍ LAYOUT JE NEVYUŽITÝ
Sekce s čísly „8s", „60%", „24/7" je rozložená vertikálně (tři karty pod sebou, každá na celou šířku). Při šířce obrazovky 926+ px toto plýtvá prostorem. Tři statistiky by měly být vedle sebe v jednom řádku jako „bento grid" nebo horizontální stat bar, jak to ostatně správně řeší stránka Ceník, kde jsou tyto tři statistiky zobrazeny v horizontálním rozložení vedle sebe.
Co opravit: Přepracovat na homepage stat sekci do horizontálního layoutu 3 sloupců (shodně s tím, jak je to na stránce Ceník). Každý stat dostane rovnoměrný prostor, čísla budou výrazná a čitelná na jeden pohled, a sekce nebude zbytečně vertikálně roztahovat stránku. Konzistence mezi homepage a Ceníkem v tomto ohledu je nutná.

11. PRICING KARTY — VIZUÁLNÍ HIERARCHIE CTA TLAČÍTEK
V pricing sekci na homepage: Starter má „Podívat se na demo" (tmavé tlačítko s bordrem), Pro má „Doporučeno" (zelený CTA), Enterprise má „Kontaktovat" (tmavé tlačítko s bordrem). Problém je, že CTA text u Pro plánu říká „Doporučeno" — to není akce, to je popisek. Tlačítko by mělo říkat, CO se stane po kliknutí (např. „Začít zdarma", „Vyzkoušet Pro", „Aktivovat"). Na stránce Ceník je to řešeno lépe: „Začít zdarma", „Vyzkoušet zdarma", „Kontaktovat" — to jsou akční výzvy. Sjednotit.
Na stránce Ceník je ale zase nekonzistence v rámci samotné pricing karty — Starter i Pro mají oba text s „zdarma", což je matoucí, když Starter stojí 499 Kč a Pro 999 Kč. „Začít zdarma" u 499 Kč tarifu je zavádějící.
Co opravit: Každé CTA tlačítko musí jasně komunikovat akci: „Vyzkoušet Starter", „Aktivovat Pro", „Kontaktovat nás". Na homepage sjednotit pricing data se stránkou Ceník. Tlačítko na Pro plánu nemůže říkat „Doporučeno" — to je label, ne CTA.

12. CHYBĚJÍCÍ VIZUÁLNÍ ODDĚLOVAČE MEZI SEKCEMI
Přechody mezi sekcemi (Hero → Trust bar → About → Stats → Process → Capabilities → Pricing → FAQ) jsou řešené pouze vertikálním paddingem. Všechny sekce mají stejné tmavé pozadí bez jakéhokoli vizuálního odlišení. Uživatel při scrollování ztrácí orientaci, kde jedna sekce končí a druhá začíná. Jedinou výjimkou je pricing sekce, která má mírně odlišený pozadí (skewed bg).
Co opravit: Zavést jemné vizuální oddělovače — alternující pozadí (např. střídání rgb(8, 9, 12) a rgb(12, 14, 18)), jemné gradient přechody mezi sekcemi, nebo subtilní horizontální linky. Klíčové sekce (pricing, CTA) mohou mít výraznější pozadí. Cílem je vytvořit vizuální rytmus, který vede oko uživatele stránkou dolů a jasně komunikuje strukturu obsahu.

13. ZELENÁ AKCENTOVÁ BARVA — PŘEPOUŽITÍ BEZ HIERARCHIE
Zelená/tyrkysová (rgb(0, 212, 170)) je použitá jako akcentová barva všude: CTA tlačítka, stat čísla, ikony, category labels (STATUS: PRINTING, ABOUT, PROCESS, CAPABILITIES), badge „Recommended", checkmarks v pricing, FAQ „+" ikony, hover stavy. Když je jedna barva použitá pro úplně všechno, ztrácí svou schopnost přitáhnout pozornost ke klíčovým prvkům. CTA tlačítko „Start Building" vizuálně nesoutěží o pozornost, protože stejná barva je rozlitá po celém webu.
Co opravit: Hierarchizovat použití akcentové barvy. Plná zelená by měla být vyhrazena POUZE pro primární CTA tlačítka a nejvýznamnější interaktivní prvky. Stat čísla mohou mít světlejší odstín nebo gradient. Section labels (ABOUT, PROCESS) mohou být v tlumené zelené nebo zcela v šedé. Checkmarks v pricing mohou být jemnější. Tím vznikne jasná vizuální hierarchie, kde zelené CTA skutečně „křičí" na uživatele.

14. CAPTION LABELS — MONOSPACE ALL-CAPS PŘETÍŽENOST
Popisky sekcí (STATUS: PRINTING, ABOUT, PROCESS, CAPABILITIES, PLANS, FAQ) jsou všechny v monospace fontu, uppercase, zelené barvě. Tento designový vzor je sám o sobě dobrý — dává to tech nádech. Ale když je použitý u každé sekce bez výjimky, stává se monotónním. Navíc některé labely jsou v angličtině (ABOUT, PROCESS, CAPABILITIES, PLANS, FAQ) na jinak české stránce.
Co opravit: Přeložit všechny section labels do češtiny (O NÁS, PROCES, FUNKCE, PLÁNY, DOTAZY) a zvážit, zda potřebujete label u KAŽDÉ sekce. Některé sekce (zejména ty s jasným hlavním nadpisem) ho nepotřebují — samotný heading „Jak to funguje" je dostatečně jasný bez „PROCESS" labelu nad ním.

15. NAVIGACE — „PŘIHLÁSIT SE" JE OŘÍZNUTÉ A VIZUÁLNĚ ODDĚLENÉ
Tlačítko/link „Přihlásit se" v pravém horním rohu je vizuálně odříznuté od navigace scrollbarem a chybí mu jasné tlačítkové zpracování — vypadá jako obyčejný text. Zároveň přepínač jazyka „CZ CS" s dropdown šipkou je mezi navigací a přihlášením, což vytváří nelogickou sekvenci: navigační linky → přepínač jazyka → akce přihlášení.
Co opravit: „Přihlásit se" by mělo mít jasný button styl (alespoň outlined button s border) a mělo by být posledním prvkem v navigaci, jasně oddělené od navigačních linků. Přepínač jazyka přesunout na úplný konec nebo do jiné pozice (např. footer, nebo jako dropdown uvnitř ikony). Zajistit, aby „Přihlásit se" nebylo oříznuté — to znamená opravit horizontální overflow problém z bodu 1.

16. KARTY CAPABILITIES — NEROVNOMĚRNÝ LAYOUT
Sekce „Capabilities" má 3 karty: „Přesný cenotvorný engine" (01/), „Multi-formát upload" (02/) a „White-label widget" (03/). Prvními dvě karty jsou vedle sebe v řádku (2 sloupce), třetí karta je samotná na celé šířce. To vytváří asymetrický, neukončený vzhled — jako by chyběla čtvrtá karta. Grid 2+1 je vizuálně nesymetrický.
Co opravit: Buď přidat čtvrtou capability kartu (pro symetrický 2×2 grid), nebo přepracovat layout na 3 sloupce v jednom řádku (shodně s Process sekcí „Jak to funguje", kde máte 4 karty 2×2). Případně třetí kartu stylovat jako „featured" kartu přes celou šířku se zcela jiným vizuálním zpracováním, aby asymetrie vypadala záměrně.

17. FAQ SEKCE — ACCORDION BEZ VIZUÁLNÍHO FEEDBACKU
FAQ otázky na homepage (3 otázky s „+" ikonou) nemají žádnou vizuální indikaci hover stavu viditelnou na první pohled. „+" ikona je malá, zelená a umístěná na samém konci řádku. Uživatel nemusí okamžitě pochopit, že na otázky může kliknout. Dále odkaz „Zobrazit všechny otázky →" pod FAQ je v šedé barvě, což je v kontrastu s jinak zelenými interaktivními prvky — není jasné, že je klikatelný.
Co opravit: FAQ řádky by měly mít jemný hover efekt (změna pozadí, jemný border), „+" ikona by měla být větší a jasnější. Odkaz „Zobrazit všechny otázky" by měl být v zelené akcentové barvě (konzistentně s ostatními CTA na stránce) a mít jasný hover stav.

18. CHYBĚJÍCÍ SOCIAL PROOF A VIZUÁLNÍ DŮVĚRYHODNOST
Trust bar říká „Trusted by 120+ print farms", ale žádné loga firem, žádné testimonials, žádné case studies. Běžící text s technickými features (PrusaSlicer CLI, Shopify, WooCommerce) není social proof — to jsou vaše vlastní funkce, ne důkaz důvěry zákazníků. Pro SaaS produkt, který chce přesvědčit tiskové farmy, aby mu svěřily svůj pricing, je absence důvěryhodnostních signálů zásadní slabina.
Co opravit: Přidat skutečná loga zákazníků nebo partnerů do trust baru. Pod hero nebo do vlastní sekce přidat alespoň 2-3 testimonials s citátem, jménem a firmou. Zvážit přidání metrik (např. „Zpracováno 50 000+ cenových nabídek") s konkrétními čísly, která posilují důvěru.

SOUHRNNÉ HODNOCENÍ
Web ModelPricer má solidní základ — dark-mode estetika s tech nádechy je vhodná pro SaaS produkt zaměřený na 3D tisk. Typografie Space Grotesk je dobrá volba, zelená akcentová barva je výrazná. Ale provedení trpí řadou nedodělků, které společně vytvářejí dojem „práce v procesu" — rozbitá diakritika, jazykový mix, duplicitní footer, horizontální scrollbar, nekonzistentní ceny. Z pohledu profesionálního designu bych tento web klasifikoval jako solidní prototyp / alpha verzi, která potřebuje ještě jedno kolo designového polishe před tím, než půjde do produkce.
Klíčové priority pro okamžitou opravu (v pořadí důležitosti): horizontální overflow, rozbitá diakritika, sjednocení headeru s dark theme, odstranění duplicitního footeru, a sjednocení jazyku a měny.