Vylepšení, Opravy a úpravy Vyskakovaciho okna New Order(nova objednávka) urceneho pro možnost vytvareni nove objednavky v Admin sekci - 

0.1 - Ber si většinu inspirace z Kalkulačky jelikož zde budeme pouzivat všechny funkce a veci ktere máme v kalkulačce aby jsme vse měli přesné

1. Dashboard Nová objednávka a Orders Nová objednávka (oboje je to úplně stejné) - Předělání funkce výroby nové objednavky pro Admina/Firmu - Ve funkci Nová objednávka kde si Firma muze vytvořit novou objednávku kdyz například ji ocenili prez email
Ale ta funkce neboli vyskakovací okno pro výrobu nové objednavky je jen velice provizorní a chybí tak většina věcí jako je moznost Přidání souboru(Modelu), Přidání informací o zákazníkovi jako je dodací adresa, fakturační adresa, firemní údaje, atd.
Dále tam musí firma sama vyplnit všechny udaje o modelu a firma tam take musí samotná napsat presnou cenu za model, atd.
- Budeme tam uplatňovat stejné funkce, data, atd. Co používáme v naší Kalkulačce
1. - rozdel to na dvě sekce/stránky mezi kterými bude moct Admin/Firma přepnout stejně jako to máme ve vyskakovací okně s nastavením na strance /Admin/fees
1.1 - Prvni sekce/stránka bude sekce pro modely a jejich Nastavování atd.
1.2 - Druhá sekce/stránka bude pro vyplňování údajů o zákazníkovi (jako například jméno, tel. Číslo, dodací adresa, atd.)
2. - Přepracování Funkce Nova objednávka tak aby firma mohla vyplnit všechny udaje co se vyplňují v objednávce v kalkulačce, neboli udaje o zákazníkovi jako jmeno, email, tel. Číslo, dodací adresa, fakturační adresa, firemní údaje, atd.
3. - Přidání souboru(modelu) k objednávce(Toto potřebujeme pro dalsi funkce) + Zobrazení modelu v objednavce - 
3.1 - Jak to je nyní (Popis) - v tuto chvíli tam nejde nahrát model ale jde jen pridat model s tim ze potom tam mohu jen napsat název modelu, materiál se kterým se bude tisknout, počet kusů, váhu kterou musim napsat sám,  čas tisku také musim napsat sám a cenu za model coz také musím napsat sám 
3.2 - Nahrání modelu/modelů - Pred tim než se nahraje model bude na prvni stránce/sekci(viz. 1.1) velké okénko pro nahrání modelu jako máme na první sekci v kalkulačce, Admin tam bude moct buď přetáhnout model do toho okénka aby ho nahrál nebo zmáčknout na okénko aby mohl vybrat model(klasické nahrávání souboru)
3.3 - pod okenkem pro nahrání modelu bude moznost vybraní modelů přímo z Model Storage kde si bude moct vybrat modely které si firma nahrála a ktere ma nahrané v jejich Admin sekci neboli v Model Storage
3.4 - Pokud bude chtít Admin nahrat dalsi model po tom co uz budou nahrané modely tak bude moct nahrát dalsi model prez tlačítko na vrchní liště vyskakovaciho okna neboli na vrchní liště kde je header "Nova Objednavka" a tlačítko pro vypnutí "×"
Tlačítko bude fungovat ve stylu vysunutí, neboli ze po zmacknuti se rozevre neboli rozšíří směrem dolů vrchní lišta kde bude umístěno okénko pro nahrani modelu a moznost vybraní modelů z Model Storage
3.5 - Odebrání modelu z objednávky - U každého modelu bude tlačítko "×" pro odebrání modelu, aby admin mohl odebrat model kdyby například nahrál špatný 
3.6 - Zobrazení modelů v Objednávce - U každého individuálního modelu bude okénko pro zobrazení daného modelu kde Admin bude moct prozkoumat ten specificky model(rotovat ho, přiblížit,  atd.), Admin bude mit moznost přepnout mezi dvěma zobrazeními stejne jako to máme udělané v kalkulačce kde si zákazník muze přepnout bud na zobrazení prez model viewer a nebo zobrazení modelu na podložce, 
Na toto pouzij stejne nastavení jako máme v kalkulačce kde mezi těmi zobrazenimi(pohledy) můžeme přepínat 
3.9 - Automaticke Položení modelu na podložku - Chci aby Admin mohl po zmacknuti tlacitka automaticky polozit model na podložku diky čemuž muze admin opravit chybu spatneho polozeni na podložce,  neboli kdyz napriklad bude model postaveny jen na rohu nebo bude ve vzduchu tak admin bude moct po zmacknuti tlacitka pro automaticke položení polozit model na rovnou plochu aby se model mohl spravne slicovat a zarucime tim ze pri tisku se nebude zbytecne pouzivat moc materiálu a neprodlouzi se zbytecne cas tisku(Tuto funkci máme také nastavenou v kalkulačce, upravovali jsme ji nedávno tak aby plně fungovala a ukládala to položení pro výrobu Gcode , takze ji vyuzij ale udelej lepší a hezčí design tlacitka pro ten interface/rozhraní/pozici kde se to bude vybírat aby to udrzelo konzistentni design co mame v tom vyskakovacim okně)
4. - Výběr presetu - je potřeba tam mit i vyber presetu pro každý specificky model, stejne jako to máme v kalkulačce(vice v 12. )
5. - Výběr Poplatků/Fees - Je potřeba tam mit také moznost u kazdeho modelu vybrat specificke poplatky ktere se uplatní při nacenění modelu po slicingi stejne jak v kalkulačce
V kalkulačce se uplatňuje automaticky a zde (neboli v tom Nová objednávka) se budou také uplatňovat automaticky podle specifikaci a Dat toho specifickeho modelu, ale poplatky ktere jsou nastaveny pro výběr v kalkulačce jako například "Broušení" bude muset Admin/Firma vybrat stejne jako to je v kalkulačce kde si to zákazník take musí vybrat
6. - Slicovani modelu
6.1 - Modely budou potřeba slicovat stejne jako to je v kalkulačce aby se získaly data od modelů jako je hmotnost, čas, atd. Aby jsme podle tech dat pote mohly soicitat cenu společně s poplatky, atd. Stejne jako to ziskavame a pocitame v kalkulačce, 
Neboli Firma po nahrání modelu a vyplnění specifikaci pro model jako je preset a výběr poplatků tak bude moct buď slicovat ten specificky model nebo pokud nahraje a nastaví vice modelů v objednávce tak bude moct spočítat/slicovat vše naráz(všechny modely se začnou počítat/slicovat ve stejnou chvíli)
7. - Výběr dopravy ,expresní výroba(bývalé expresní dodání) a kupóny
7.1 - je tam potřeba dat také moznost výběru dopravy( vyber dopravy bude v druhe sekci sekci/stránce u údajů o zákazníkovi 
7.2 Expresní vyroba bude v prvni sekci u nastavení modelů 
7.3 - Kupóny se budou aplikovat v prehledu ceny, vice v 10.2
8. - Výpočet ceny objednávky - Po slicování modelů se bude postupně vypočítávat cena objednávky(zase se uplatni stejný princip jako v kalkulačce), každý model bude pote ukazovat vlastní cenu a prehled jako jaké poplatky se uplatnili pro specifický model, atd.
A na spodní liště se zobrazí celková cena objednavky
9. - Spodní lišta s celkovou cenou objednávky
9.1 - Na spodní části vyskakovaciho okna se po vypočítané ceny rozšíří spodní ohraničení neboli lišta kde je v tuto chvíli například tlačítko "Zrusit" a "Vytvorit Objednávku" (Tyto tlačítka přemýšlíš/upravíš tak aby byly stale dobře viditelné ale při tom nezávázely v přehledu ceny objednavky)
9.2 - Lišta s přehledem celkové ceny bude fungovat takto - Pokud neni spocitana žádná cena za jakýkoliv model tak spodní lišta bude vypadat podobně jako je nastavena v tuto chvíli neboli zůstane malá aby zbytecne nezavazela pri vyplnovani údajů a nastavovani modelů, 

9.3 - Ale Jakmile se spočítat cena objednavky(bud cena individuálního modelu nebo vsech modelů)tak se se lišta změní na přehled ceny objednávky
Ale lišta bude mit dvě funkční zobrazení 
9.4 - První zobrazení - bude jednoduchý rychlý přehled ceny objednávky s jen nezbytnými údaji což bude celkový počet kusů, celková hmotnost materiálu, celkový čas tisku 
První varianta bude minilalisticka pro rychlý přehled, toto nam zaručí ze ta lišta nebude moc vysoká a tim padem nebude závazet Adminovi pokud bude chtít změnit nějaké udaje v objednávce 
9.5 - Druhé zobrazení - Bude celkový prehled objednávky kde bude rozpad celé ceny a všech údajů 
Admin/Firma to bude moct zobrazit kdyz klikne dole na tu listu s prvním zobrazením, po kliknutí se vysune ta lišta nahoru a diky toho se zobrazi Druhé zobrazení prehledu
A v tom druhem zobrazeni bude celkový rozpad ceny jako je v kalkulačce aby Admin/Firma viděla jaké poplatky se Použili, kolik jaký poplatek přidal, cena za materiál , cena za čas tisku, atd.
Prostě to bude dukladny rozpad ceny objednavky aby tam Admin/Firma mohla vidět všechny udaje o ceně objednavky, atd.
V tom prvním ani v tom druhém zobrazení nebudou ukazany grafy jelikoz to by zabralo az moc prostoru a neni to tam potřeba jelikoz grafy si bude moct Admin zobrazit v celkovém prehledu objednavky na strance Orders
10. - Kupony a vlastni slevy určené pro specifické modely nebo objednávku - 
10.1 - V druhém přehledu bude moznost vybrat kupony pro uplatnění, chci aby se kupony daly vybrat ze seznamu aby Admin nemusel psát specificky kód ale mohl ho primo vybrat
10.2 - take budu chtít mit moznost nastavit vlastní slevu
Sleva se bude moct nastavit u uplatnění kuponu kde bude tlačítko pro přidání slevy
Admin bude moct pote nastavit jakou slevu chce a podle jakých specifikací 
První kolonka bude pro částku neboli hodnotu 
A v druhe kolonce Bude moct vybrat buď fixní slevu nebo % slevu
Třetí kolonka bude tlačítko pro uplatnění slevy
10.3 - Sleva se bude moct uplatnit na dvou místech 
10.3.1 - První misto bude v prehledu ceny/objednávky, tam se sleva uplatni na celou objednávku 
10.3.2 - Druhé misto bude u individualnich modelů kde bude moct Admin nastavit individuální slevu pro specifický model
10.4 - Množstevní slevy - Bude potřeba take nastavit aby fungovaly a správně se uplatnili množstevní slevy podle toho jak je ma Admin/Firma nastavené v Admin sekci aby se správně uplatnili na modely s více kusy
11. Materiály -
11.1 - U každého modelu bude moznost vybrat specificky materiál pro daný model
12. - Presety
12.1 - U každého modelu se v základu použije výchozí preset stejně jako to je nastavené/udělané v kalkulačce
12.2 - U každého modelu bude moct admin vybrat specifický preset pro určený model
12.3 - Moznost vyberu presetu se ovlivni podle vybraného materiálu u modelu aby při materiálu ABS se nemohl použít preset určený/nastaveny pro PLA
