ve widget builder v sekci Globální a části PREDNASTAVENY TEMA přešuň to upozornění o tom že nejsou uložené změny na stránku,         
  jelikož nyní se to ukazuje ve vyskakovacím okénku mimo stránku což není hezké a k tomu ti to při testování stránky zabrání možnosti  
  testova  

  --------

  dá se nějak uděat aby jsi vždy spouštěl třeba agenta s modelem haiku který by měl za jediný úkol udržovat historii a pamět toho co se dělá, dělalo,          
  řeší, řešilo atd. v tom chatu, neboli v tom terminálovém okně?                                                                                               
  Jakoby že budeme třeba řešit implementaci nějaké funkce, tak že by se vždy co nějakou chvíli spustil agent Historie co funguje na model haiku a ten by       
  si vždy přečetl část chatu třeba když už jednou dělal ukládání hisotorie tak jen tu část kterou ještě nemá prozkoumanou a nebo celý chat a vždy by           
  updatoval historii a paměť                                                                                                                                   
  Tím pádem by jsme nikdy neztratili pojem o tom co se v jaké dny implementovalo, v jaký den, na jakém místě, co jsem ti přesně psal, jak jsi mi               
  odpovídal, jaké soubory jsi upravil a zjednodušene zdokumentované co jsi upravoval v tu chvíli v těch dokumentech atd.                                       
  Prostě automatizované ukládání historie do .md souborů které by byly ve složce Historie, kde by vždy pro každý den udělal podsložku kde by udělal            
  několik souborů pro odlišné specifické informace, jako třeba v jednom by byla historie konverzace, druhý by byla histrie úprav, třetí by byla hstorie        
  plánů a třeba ještě další historie které by byly rozděleny a byly dokumntovány pro specifický den, a také by udržoval Master Historii kde by se ukládal      
  zjednodušený přehled o celé historii, ten by sloužil spíše jako directions k specifickým souborům a bylo to ve stylu seznamu, takže by to třeba bylo         
  napsané takto -                                                                                                                                              
  ID-36K_20.10.2026 - Test-Kalkulacka - Úprava rozložení, Změna designu, Dependences, Security Review //(Tyto ID jsou související soubory) ID24AD -            
  PATH/K/SOUBORU/ID-36K_20_10_2026-Test-Kalkulacka_History                                                                                                     
  Takto by vypadal každý LOG v Master History souboru aby to bylo přehldné, jasné a ukazovalo by to přesně na ten daný soubor s tou určitou historií           
  Přiřazovaly by jsme tam ke každému souboru své ID s tím že ID36 je že toto je třicátá šestá historie pro K(kalkulačka) neboli že je to 36 instance v         
  historii kde se něco dělá s kalkulačkou a to K je označení pro kalkulačku, když to bude ID21KS tak to bude 21 uložená instance(prostě dokumentace) v         
  historii o KS neboli Kupony(K) a Slevy(S), nebo třeba 11AE bude 11 instance o Admin(A) Storage(S) (AS), ty zkratky pro rozpoznání toho ID by se muselo       
  dobře rozdělit a uložit aby vždy ten Agent co ukládá historii věděl jaké ID má k tomu history souboru přidělit a aby agenti nebo modely mohly jednoduše      
  rozpoznat a najít všechny instance pro danou stránku/soubor , Do toho  ID-36K_20.10.2026 - Test-Kalkulacka - Úprava rozložení, Změna designu,                
  Dependences, Security Review //(Tyto ID jsou související soubory) ID24AD -                                                                                   
    PATH/K/SOUBORU/ID-36K_20_10_2026-Test-Kalkulacka_History je za dvěmi závorkami // napsané ID které určuje související Soubory aby se vědělo který          
  soubor k tomu také souvisí(třeba se neupravovala jen ta kalkulačka ale i Admin(A) Dashboard(D) takže je tam ID toho souboru od Admin Dashboard který s       
  tím souvisí                                                                                                                                                  
                                                                                                                                                               
  Ale pojďme se o tom teď ještě pobavit                                                                                                                        
  Šlo by to udělat?                                                                                                                                            
  Máš k tomu nějaké dodatky?                                                                                                                                   
  Máš nějaký lepší nápad pro rozložení toho ukládání, dokumentování, atd.?                                                                                     
  Jak by jsi rozdělil ty soubory pr tu Historii? je lepší to co se dělalo v jednom chatu do jednoho souboru a v druhém do druhého(bylo by to                   
  zredukované/zjednodušené jelikož nepotřebjeme úplně celý chat a všechen text v něm ale jen ty důležité věci pro robustní historii která nebude nějak         
  extra velká a náročná pro průzkum, ale stále by to muselo obsahovat nějaké informace v celé podobě jako třeba to co jsem napsal v chatu což to budu          
  chtít v celé podobě a co jsi na to třeba odpověděl), ale určitě mi přijde jako lepší nápad že by se to rozdělovalo na specifické soubory v každém dni,       
  tak že by byl třeba specifický soubor pro historii naší konverzace kde b byl v celku můj text co jsem ti napsal a co jsi mi na to odpověděl, soubor          
  třeba pro otázky na které jsi se ptal pro projekt a moje odpovědi na dané otázky(toto by možná mhlo být v tom konverzačním souboru ale asi by bylo lepší     
   to rozdělit), soubory pro úpravy nebo akce co se dělali jako třeba že v tom chatu jsme upravovali Admin Dashboard tak tam bude soubor s tím ID jako         
  jsem specifikoval nahoře kde by bylo summery toho co se upravovalo, Opravovalo, měnilo, atd. pro tu specifikou stránku a kdyby jsme v ten den upravovali     
   i jiné stránky tak tam budou další soubory pro historii uprav v tom dni pro tu stránku s tím specifickým ID, atd. , prostě že by se to rozdělilo na         
  více souborů které by byly správně evidovány přes ID a názvy těch souborů a v té Master historii by se to vše Dokumentovalo a evidovalo ve stylu jak         
  jsem ti napsal nahoře   



  1. Chci aby se to spouštělo automaticky při každém checkpointu(Chci aby se to spouštělo Hlaně i před Compactováním konverzace aby se to uložilo v plné       
  podobě jelikož po Compactování konverzace ztratíš ty detailní a potřebné informace takže historie nebude správná a kvaitní, takže prvně by se před           
  Compactem předaly informace pro dokumentaci historie a až po uložení historie by se mohla compactovat konverzace, toto je velmi důležitá část se kterou      
  nechci kompromizovat a musí být v tom automatickém checkpointu nebo že se to vždy musí spustit před Compactem konverzace/Chatu) a i při ručním triggeru,     
   pro ten ruční trigger by bylo dobré kdyby na to byl třeba i vyrobený skill a mohl jsem napsat jen /history pro spuštění ale také přes to když ti napíšu     
   třeba ulož historii                                                                                                                                         
  2. Střední s troškou detailnosti, fragmenty se mohou ukládat ale jen když je to třeba velmi důležitá věc, jinak převážně používat střední dokumentaci        
  historie, hlavně že tam bude co přesně se upravovalo a s tím řádkovým rozsahem                                                                               
  3. to co ti přijde lepší, jelikož to budeš převážně používat ty tak aby to pro tebe bylo jasné                                                               
  4. Spíše Čestina                                                                                                                                             
                                                                                                                                                               
  A všechny ty doporučení 1-6 co jsi mi napsal můžeš aplikovat, jen v tom checkpointu CHCI aby se to automaticky spouštělo před tím COMPACTEM ale i v těch     
   ostatních checkpointech                                                                                                                                     
                                                                                                                                                               
  Vytvoř na to Specifického agenata a dej si s ním velice moc záležet aby jsi ho vytvořil nejlépe jak dokážeš aby byl co nejlépe zaměřený na tu činnost        
  ukládání historie!                    


  -------


  dá se nějak uděat aby jsi vždy spouštěl třeba agenta s modelem haiku který by měl za jediný úkol udržovat historii a pamět toho co se dělá, dělalo,          
  řeší, řešilo atd. v tom chatu, neboli v tom terminálovém okně?                                                                                               
  Jakoby že budeme třeba řešit implementaci nějaké funkce, tak že by se vždy co nějakou chvíli spustil agent Historie co funguje na model haiku a ten by       
  si vždy přečetl část chatu třeba když už jednou dělal ukládání hisotorie tak jen tu část kterou ještě nemá prozkoumanou a nebo celý chat a vždy by           
  updatoval historii a paměť                                                                                                                                   
  Tím pádem by jsme nikdy neztratili pojem o tom co se v jaké dny implementovalo, v jaký den, na jakém místě, co jsem ti přesně psal, jak jsi mi               
  odpovídal, jaké soubory jsi upravil a zjednodušene zdokumentované co jsi upravoval v tu chvíli v těch dokumentech atd.                                       
  Prostě automatizované ukládání historie do .md souborů které by byly ve složce Historie, kde by vždy pro každý den udělal podsložku kde by udělal            
  několik souborů pro odlišné specifické informace, jako třeba v jednom by byla historie konverzace, druhý by byla histrie úprav, třetí by byla hstorie        
  plánů a třeba ještě další historie které by byly rozděleny a byly dokumntovány pro specifický den, a také by udržoval Master Historii kde by se ukládal      
  zjednodušený přehled o celé historii, ten by sloužil spíše jako directions k specifickým souborům a bylo to ve stylu seznamu, takže by to třeba bylo         
  napsané takto -                                                                                                                                              
  ID-36K_20.10.2026 - Test-Kalkulacka - Úprava rozložení, Změna designu, Dependences, Security Review //(Tyto ID jsou související soubory) ID24AD -            
  PATH/K/SOUBORU/ID-36K_20_10_2026-Test-Kalkulacka_History                                                                                                     
  Takto by vypadal každý LOG v Master History souboru aby to bylo přehldné, jasné a ukazovalo by to přesně na ten daný soubor s tou určitou historií           
  Přiřazovaly by jsme tam ke každému souboru své ID s tím že ID36 je že toto je třicátá šestá historie pro K(kalkulačka) neboli že je to 36 instance v         
  historii kde se něco dělá s kalkulačkou a to K je označení pro kalkulačku, když to bude ID21KS tak to bude 21 uložená instance(prostě dokumentace) v         
  historii o KS neboli Kupony(K) a Slevy(S), nebo třeba 11AE bude 11 instance o Admin(A) Storage(S) (AS), ty zkratky pro rozpoznání toho ID by se muselo       
  dobře rozdělit a uložit aby vždy ten Agent co ukládá historii věděl jaké ID má k tomu history souboru přidělit a aby agenti nebo modely mohly jednoduše      
  rozpoznat a najít všechny instance pro danou stránku/soubor , Do toho  ID-36K_20.10.2026 - Test-Kalkulacka - Úprava rozložení, Změna designu,                
  Dependences, Security Review //(Tyto ID jsou související soubory) ID24AD -                                                                                   
    PATH/K/SOUBORU/ID-36K_20_10_2026-Test-Kalkulacka_History je za dvěmi závorkami // napsané ID které určuje související Soubory aby se vědělo který          
  soubor k tomu také souvisí(třeba se neupravovala jen ta kalkulačka ale i Admin(A) Dashboard(D) takže je tam ID toho souboru od Admin Dashboard který s       
  tím souvisí                                                                                                                                                  
                                                                                                                                                               
  Ale pojďme se o tom teď ještě pobavit                                                                                                                        
  Šlo by to udělat?                                                                                                                                            
  Máš k tomu nějaké dodatky?                                                                                                                                   
  Máš nějaký lepší nápad pro rozložení toho ukládání, dokumentování, atd.?                                                                                     
  Jak by jsi rozdělil ty soubory pr tu Historii? je lepší to co se dělalo v jednom chatu do jednoho souboru a v druhém do druhého(bylo by to                   
  zredukované/zjednodušené jelikož nepotřebjeme úplně celý chat a všechen text v něm ale jen ty důležité věci pro robustní historii která nebude nějak         
  extra velká a náročná pro průzkum, ale stále by to muselo obsahovat nějaké informace v celé podobě jako třeba to co jsem napsal v chatu což to budu          
  chtít v celé podobě a co jsi na to třeba odpověděl), ale určitě mi přijde jako lepší nápad že by se to rozdělovalo na specifické soubory v každém dni,       
  tak že by byl třeba specifický soubor pro historii naší konverzace kde b byl v celku můj text co jsem ti napsal a co jsi mi na to odpověděl, soubor          
  třeba pro otázky na které jsi se ptal pro projekt a moje odpovědi na dané otázky(toto by možná mhlo být v tom konverzačním souboru ale asi by bylo lepší     
   to rozdělit), soubory pro úpravy nebo akce co se dělali jako třeba že v tom chatu jsme upravovali Admin Dashboard tak tam bude soubor s tím ID jako         
  jsem specifikoval nahoře kde by bylo summery toho co se upravovalo, Opravovalo, měnilo, atd. pro tu specifikou stránku a kdyby jsme v ten den upravovali     
   i jiné stránky tak tam budou další soubory pro historii uprav v tom dni pro tu stránku s tím specifickým ID, atd. , prostě že by se to rozdělilo na         
  více souborů které by byly správně evidovány přes ID a názvy těch souborů a v té Master historii by se to vše Dokumentovalo a evidovalo ve stylu jak         
  jsem ti napsal nahoře                                                                                                                                        
  Je dobrý nápad udělat i šablony pro ty jednotlivé soubory na které se to bude rozdělovat aby se na ně kdyžtak mohl kouknout a dokumentovat to ve stylu       
  podle těch šablon?                                                                                                                                           
                                                                                                                                                               

● Skvely napad! Pojdme to rozebrat.

  Jde to udelat?

  Ano, technicky to jde. Muzu spustit background Task agenta (haiku model) kteremu predam kontext o tom co se delo a on zapise do souboru. Ale je dulezite     
  rozumet omezenim:

  1. Agent nevidi chat automaticky — musel bych mu vzdy predat shrnuty kontext toho co se delo (co jsi psal, co jsem odpovedel, co jsem upravoval)
  2. Neni to "real-time" — agent se musi explicitne spustit v urcitych momentech, ne automaticky "kazdych 5 minut"
  3. Haiku je lacny a rychly — idealni pro tento typ prace

  Moje navrhy na vylepseni

  1. Spousteni — kdy?

  Misto "co nejakou chvili" navrhuji konkretni triggery:
  - Na zacatku session — zalozit zaznam "co budeme delat"
  - Po dokonceni tasku/checkpointu — zdokumentovat co se udelalo
  - Pred koncem session — finalni souhrn
  - Na pozadani — kdyz reknes "uloz historii"

  2. ID system — zjednoduseni

  Tvuj napad s ID-36K je kreativni, ale muze byt tezke udrzet konzistenci. Navrhuji dvouvrstvou strukturu:

  ID format: {poradove_cislo}-{zkratka}_{datum}
  Priklad:   036-TK_2026-02-19
             021-KS_2026-02-19
             011-AS_2026-02-19

  A k tomu registr zkratek (ID-REGISTRY.md):
  TK = Test-Kalkulacka
  WK = Widget-Kalkulacka
  AD = Admin-Dashboard
  AP = Admin-Pricing
  AF = Admin-Fees
  AB = Admin-Branding
  AI = Admin-Integrations
  PE = Pricing-Engine
  ST = Storage
  SB = Supabase
  SH = Shopify
  DS = Design-System
  RT = Routing
  BK = Backend
  ...

  Pocitadlo by bylo globalni (ne per-zkratka) — jednodussi na spravovani a vzdy unikatni.

  3. Struktura slozek

  docs/claude/Historie/
  ├── MASTER-HISTORIE.md          # Hlavni index/rozcestnik
  ├── ID-REGISTRY.md              # Registr zkratek + pocitadlo
  ├── SABLONY/                    # Templates
  │   ├── SABLONA-KONVERZACE.md
  │   ├── SABLONA-UPRAVY.md
  │   ├── SABLONA-OTAZKY.md
  │   └── SABLONA-DENNI-PREHLED.md
  ├── 2026-02-19/
  │   ├── DENNI-PREHLED.md        # Souhrn dne
  │   ├── 036-TK_KONVERZACE.md   # Co jsi psal + co jsem odpovedel
  │   ├── 037-TK_UPRAVY.md       # Technicke zmeny v TK
  │   ├── 038-AD_UPRAVY.md       # Technicke zmeny v AD
  │   └── 039-TK_OTAZKY.md       # Otazky + odpovedi
  ├── 2026-02-20/
  │   └── ...

  4. Rozdeleni souboru — muj navrh

  ┌───────────────┬───────────────────────────────────────────────────────────────────────┬────────────────────┐
  │  Typ souboru  │                              Co obsahuje                              │   Kdy se vytvari   │
  ├───────────────┼───────────────────────────────────────────────────────────────────────┼────────────────────┤
  │ KONVERZACE    │ Tvuj text (cely) + moje odpovedi (zkracene), rozhodovaci body         │ Kazda session      │
  ├───────────────┼───────────────────────────────────────────────────────────────────────┼────────────────────┤
  │ UPRAVY        │ Ktere soubory, co presne (summary), proc, klicove zmeny               │ Po dokonceni tasku │
  ├───────────────┼───────────────────────────────────────────────────────────────────────┼────────────────────┤
  │ OTAZKY        │ Otazky na uziv. + odpovedi, architekturni rozhodnuti                  │ Prubezne           │
  ├───────────────┼───────────────────────────────────────────────────────────────────────┼────────────────────┤
  │ DENNI-PREHLED │ Souhrn dne, seznam vsech UPRAVY a KONVERZACI, co se povedlo/nepovedlo │ Na konci dne       │
  └───────────────┴───────────────────────────────────────────────────────────────────────┴────────────────────┘

  Tvuj text bych ukladal cely (jak jsi rikal). Moje odpovedi bych zkratil na klicove body — jinak by soubory byly obrovske.

  5. MASTER-HISTORIE format

  Tvuj navrh je dobry, trochu bych upravil format:

  # MASTER HISTORIE

  ## 2026-02-19

  | ID | Oblast | Popis | Souvisejici | Cesta |
  |----|--------|-------|-------------|-------|
  | 036-TK | Test-Kalkulacka | Uprava rozlozeni, zmena designu | 038-AD | Historie/2026-02-19/036-TK_UPRAVY.md |
  | 037-TK | Test-Kalkulacka | Konverzace o implementaci | 036-TK | Historie/2026-02-19/037-TK_KONVERZACE.md |
  | 038-AD | Admin-Dashboard | Oprava sidebar, novy widget | 036-TK | Historie/2026-02-19/038-AD_UPRAVY.md |

  ## 2026-02-18
  ...

  Tabulkovy format je prehlednejsi nez plain text a snaze se v nem hleda.

  6. Sablony — ROZHODNE ANO

  Sablony jsou super napad. Zarucuji konzistenci a agent haiku bude presne vedet jak strukturovat obsah. Kazdou sablonu by mel mit jako "instrukci" pri kazdem 
  spusteni.

  Otazky na tebe

  1. Chces aby se historie agent spoustel automaticky pri kazdme checkpointu, nebo chces rucni trigger (napr. "uloz historii" / "history save")?
  2. Jak detailni maji byt UPRAVY soubory? Napr.:
    - Minimalni: "Upraven AdminDashboard.jsx — pridan novy sidebar widget"
    - Stredni: + diff summary (co pridano, co odebrano, radkove rozsahy)
    - Detailni: + fragmenty kodu (pred/po)
  3. Chces i sesn-level ID pro odliseni vice sessions ve stejnem dni? Napr. kdyz rano resime kalkulacku a vecer taky, bude to 036-TK a 042-TK (ciste poradove),   nebo chces i "session 1 / session 2" rozliseni?
  4. Jazyk historie — cestina (jako dokumentace), nebo anglictina (jako kod)?

✻ Churned for 1m 8s

❯ 1. Chci aby se to spouštělo automaticky při každém checkpointu(Chci aby se to spouštělo Hlaně i před Compactováním konverzace aby se to uložilo v plné       
  podobě jelikož po Compactování konverzace ztratíš ty detailní a potřebné informace takže historie nebude správná a kvaitní, takže prvně by se před           
  Compactem předaly informace pro dokumentaci historie a až po uložení historie by se mohla compactovat konverzace, toto je velmi důležitá část se kterou      
  nechci kompromizovat a musí být v tom automatickém checkpointu nebo že se to vždy musí spustit před Compactem konverzace/Chatu) a i při ručním triggeru,     
   pro ten ruční trigger by bylo dobré kdyby na to byl třeba i vyrobený skill a mohl jsem napsat jen /history pro spuštění ale také přes to když ti napíšu     
   třeba ulož historii                                                                                                                                         
  2. Střední s troškou detailnosti, fragmenty se mohou ukládat ale jen když je to třeba velmi důležitá věc, jinak převážně používat střední dokumentaci        
  historie, hlavně že tam bude co přesně se upravovalo a s tím řádkovým rozsahem                                                                               
  3. to co ti přijde lepší, jelikož to budeš převážně používat ty tak aby to pro tebe bylo jasné                                                               
  4. Spíše Čestina                                                                                                                                             
                                                                                                                                                               
  A všechny ty doporučení 1-6 co jsi mi napsal můžeš aplikovat, jen v tom checkpointu CHCI aby se to automaticky spouštělo před tím COMPACTEM ale i v těch     
   ostatních checkpointech                                                                                                                                     
                                                                                                                                                               
  Vytvoř na to Specifického agenata a dej si s ním velice moc záležet aby jsi ho vytvořil nejlépe jak dokážeš aby byl co nejlépe zaměřený na tu činnost        
  ukládání historie!                  


  ------



  Pricing Engine V3 — Co potrebuji od uzivatele                                                                                                     
        2 -                                                                                                                                                    
        3 -> **Ucel:** Seznam rozhodnuti a informaci ktere potrebuji od uzivatele pred zahajenim implementace.                                                 
        4 -> **Stav:** CEKA NA ODPOVEDI                                                                                                                        
        5 -                                                                                                                                                    
        6 ----                                                                                                                                                 
        7 -                                                                                                                                                    
        8 -## 1. Prioritizace — co je must-have pred launchem?                                                                                                 
        9 -                                                                                                                                                    
       10 -Roadmap obsahuje 8 KD (kriticke doplnky) + 3 faze. Potrebuji vedet ktere jsou **must-have pred betou** a ktere muzou pockat.                        
       11 -                                                                                                                                                    
       12 -**Otazka:** Oznac co je must-have (M), nice-to-have (N), a odlozit (O):                                                                             
       13 -                                                                                                                                                    
       14 -| # | Ukol | Muj navrh | Tvoje rozhodnuti |                                                                                                         
       15 -|---|------|-----------|-----------------|                                                                                                          
       16 -| Faze 1 | Audit express/shipping/coupon | M | |                                                                                                    
       17 -| Faze 2 | API kontrakt engine<->UI | M | |                                                                                                         
       18 -| Faze 3 | Edge cases + debug mode | N | |                                                                                                          
       19 -| KD-1 | Pipeline mapa do dokumentace | M | |                                                                                                       
       20 -| KD-2 | JSDoc signatury | N | |                                                                                                                    
       21 -| KD-3 | Multi-currency (EUR/USD) | O (az po bete) | |                                                                                              
       22 -| KD-4 | Rounding invarianty | M | |                                                                                                                
       23 -| KD-5 | Performance caching | O | |                                                                                                                
       24 -| KD-6 | Determinismus (now param + testy) | M | |                                                                                                  
       25 -| KD-7 | Preview API wrapper | N | |                                                                                                                
       26 -| KD-8 | Verzovaci strategie (quote snapshot) | N | |                                                                                               
       27 -                                                                                                                                                    
       28 ----                                                                                                                                                 
       29 -                                                                                                                                                    
       30 -## 2. Express Delivery — admin UI stav                                                                                                              
       31 -                                                                                                                                                    
       32 -**Otazka:** Je admin stranka pro nastaveni Express delivery uz hotova?                                                                              
       33 -- Kde se tiers (expresni urovne) nastavuji? Je to v AdminParameters, AdminFees, nebo jinde?                                                         
       34 -- Jsou nejake expresni tiers uz ulozene v localStorage pro testovani?                                                                               
       35 -- Nebo to cele jeste neexistuje a musi se vytvorit?                                                                                                 
       36 -                                                                                                                                                    
       37 ----                                                                                                                                                 
       38 -                                                                                                                                                    
       39 -## 3. Shipping — admin UI stav                                                                                                                      
       40 -                                                                                                                                                    
       41 -**Otazka:** Je admin stranka pro nastaveni Shipping metod uz hotova?                                                                                
       42 -- Kde se shipping metody nastavuji?                                                                                                                 
       43 -- Je nastaveny free shipping threshold?                                                                                                             
       44 -- Nebo to cele jeste neexistuje?                                                                                                                    
       45 -                                                                                                                                                    
       46 ----                                                                                                                                                 
       47 -                                                                                                                                                    
       48 -## 4. Kupony/Coupons — admin UI stav                                                                                                                
       49 -                                                                                                                                                    
       50 -**Otazka:** Je admin stranka pro spravu kuponu uz hotova?                                                                                           
       51 -- Kde se kupony vytvareji a spravuji?                                                                                                               
       52 -- Existuji nejake testovaci kupony v localStorage?                                                                                                  
       53 -- Nebo to cele jeste neexistuje?                                                                                                                    
       54 -                                                                                                                                                    
       55 -> **Proc se ptam na 2-4:** Faze 1 (audit) vyzaduje testovaci data. Pokud admin UI pro express/shipping/coupons                                      
       56 -> jeste neexistuje, musim vytvorit mock data primo v kodu pro testovani, a pak je nahradit                                                          
       57 -> az budou admin stranky hotove.                                                                                                                    
       58 -                                                                                                                                                    
       59 ----                                                                                                                                                 
       60 -                                                                                                                                                    
       61 -## 5. Testovaci data                                                                                                                                
       62 -                                                                                                                                                    
       63 -**Otazka:** Mas nejake realne scenare pro testovani cen?                                                                                            
       64 -- Napr.: "Model 50g PLA, 2h tisk, cena by mela byt cca X Kc"                                                                                        
       65 -- Napr.: "Express +20% z ceny 500 Kc = 600 Kc"                                                                                                      
       66 -- Pokud ne, vytvorim synteticka testovaci data sam — staci potvrdit                                                                                 
       67 -                                                                                                                                                    
       68 ----                                                                                                                                                 
       69 -                                                                                                                                                    
       70 -## 6. Multi-currency casovy horizont                                                                                                                
       71 -                                                                                                                                                    
       72 -**Otazka:** Kdy planujes podporu EUR/USD?                                                                                                           
       73 -- Moznosti:                                                                                                                                         
       74 -  - (a) Hned v ramci pricing engine — pridame `currency` do configu (6-10h navic)                                                                   
       75 -  - (b) Po bete — engine zustane CZK-only, pridame pozdeji                                                                                          
       76 -  - (c) Nikdy — jen CZK                                                                                                                             
       77 -- **Muj navrh:** (b) — engine pripravime (currency pole v configu, hardcoded CZK jako default),                                                     
       78 -  ale konverze a formatovani nechame na pozdeji. Trvani: 1h misto 6-10h.                                                                            
       79 -                                                                                                                                                    
       80 ----                                                                                                                                                 
       81 -                                                                                                                                                    
       82 -## 7. Quote snapshot — jak funguje order system?                                                                                                    
       83 -                                                                                                                                                    
       84 -**Otazka:** Jak se aktualne ukladaji objednavky?                                                                                                    
       85 -- Kam se uklada objednavka po checkoutu? (localStorage? Supabase? jine?)                                                                            
       86 -- Ma objednavka uz nejake pole pro cenu? Nebo se cena prepocitava pokazde?                                                                          
       87 -- **Proc:** KD-8.1 rika ze pri objednavce ulozime pricing snapshot. Musim vedet                                                                     
       88 -  kam ho ulozit a jaky je format objednavky.                                                                                                        
       89 -                                                                                                                                                    
       90 ----                                                                                                                                                 
       91 -                                                                                                                                                    
       92 -## 8. Snapshot testy — format a umisteni                                                                                                            
       93 -                                                                                                                                                    
       94 -**Otazka:** Kde chces mit testy pro pricing engine?                                                                                                 
       95 -- Moznosti:                                                                                                                                         
       96 -  - (a) `src/lib/pricing/__tests__/` (standardni Vitest konvence)                                                                                   
       97 -  - (b) `tests/pricing/` (oddelena slozka)                                                                                                          
       98 -  - (c) Jinam                                                                                                                                       
       99 -- **Muj navrh:** (a) — `src/lib/pricing/__tests__/pricingEngineV3.test.js`                                                                          
      100 -- Fixtures: `src/lib/pricing/__tests__/fixtures/` (JSON soubory se vstupy + ocekavane vystupy)                                                      
      101 -                                                                                                                                                    
      102 ----                                                                                                                                                 
      103 -                                                                                                                                                    
      104 -## 9. Engine version — jaka verze?                                                                                                                  
      105 -                                                                                                                                                    
      106 -**Otazka:** Mam pridat konstantu `ENGINE_VERSION` do enginu. Jaka verze?                                                                            
      107 -- Navrh: `'3.1.0'` (3 = major V3, 1 = first post-roadmap release, 0 = patch)                                                                        
      108 -- Nebo preferujes jiny format?                                                                                                                      
      109 -                                                                                                                                                    
      110 ----                                                                                                                                                 
      111 -                                                                                                                                                    
      112 -## Jak odpovedet                                                                                                                                    
      113 -                                                                                                                                                    
      114 -Staci mi strucne odpovedi, napr.:                                                                                                                   
      115 -```                                                                                                                                                 
      116 -1. Faze 1 M, Faze 2 M, Faze 3 O, KD-1 M, KD-2 O, KD-3 O, KD-4 M, KD-5 O, KD-6 N, KD-7 O, KD-8 O                                                     
      117 -2. Admin Express neexistuje, vytvorit mock data                                                                                                     
      118 -3. Shipping admin neexistuje                                                                                                                        
      119 -4. Coupons admin neexistuje                                                                                                                         
      120 -5. Nemam, vytvor synteticka                                                                                                                         
      121 -6. (b) pripravit pole, CZK default                                                                                                                  
      122 -7. localStorage, pole `totalPrice` uz existuje                                                                                                      
      123 -8. (a) OK                                                                                                                                           
      124 -9. 3.1.0 OK                                                                                                                                         
      125 -```                                                                                                                                                 
      126 -                                                                                                                                                    
      127 -Cim rychleji dostanu odpovedi, tim driv zacnu implementovat. 



      -----


      
  Historie (kompletni):
  - 009-PE_KONVERZACE.md — zaznam konverzace
  - 010-PE_UPRAVY.md — zaznam zmen (9 souboru)
  - 011-PE_OTAZKY.md — 7 Q&A zaznamu
  - ID-REGISTRY.md — counter 011/012
  - MASTER-HISTORIE.md — 3 nove radky

  Odpovedi uzivatele zpracovany:
  - CO_POTREBUJI_OD_UZIVATELE.md — aktualizovany stav vsech 9 otazek s odpovědmi (scope=vse, testy=ano, orders=Supabase, currency=Var A ted)
  - 05_Multi_Currency.md — pridana sekce "Varianta A (TED)" a presunuti KD-3.1/3.2/3.3 pod "Varianta B (PO BETE)"

  Co zbyva nezodpovezeno (3 otazky):
  1. Testovaci data (pouziji synteticka)
  2. Engine version (navrh 3.1.0)
  3. Prioritizace zbylych KD item-by-item (KD-2, KD-4, KD-5, KD-7)


  -------


  jsem v tom už docela zmatený a nevím pořádně co se má kdy dělat                                                                                              
                                                                                                                                                               
  Vím že budu chtít asi udělat ten sprint plán jako první ale bude rozhodně v něm udělat nějaké úpravy aby jsme do toho zakomponovaly i tu izolaci těch        
  uživatelů neboli tu fázi 3.4 z roadmapy                                                                                                                      
                                                                                                                                                               
  No ale nyní mi prosím udělej dva soubory kde bude velmi jednoduše zaznačené co máme tedy naplánované dělat jelikož nyní máme dva plány s tím že ten          
  sprint plán je jakoby odvozený od toho roadmap plánu, o tom si můžeš přečíst v historii, myslím že jsme to řešili na začátku historie al to si nejsem        
  jistý                                                                                                                                                        
                                                                                                                                                               
  No ale budu chtít aby jsi mi udělal dva dokumenty které budou určeny výhradně pro mě, takže to bude muset být velice jednoduše a přehledně napsáno,          
  neboli nějak v tomto stylu jak jsi mi to napsal tady aby šlo jednoduše pochopit co je v jaké fázi                                                            
  Nějak takto - - Auth Sprinty 1-4 — specificky auth implementace (Sprint 1 = foundation, Sprint 2 = account page, Sprint 3 = security hardening, Sprint 4     
   = 2FA)                                                                                                                                                      
    - RoadMap Fáze 0-4 — celkový plán k BETA launchi (Fáze 0 = Cloud Run, Fáze 1 = kalkulačka, Fáze 2 = Stripe, Fáze 3 = API security + tenant izolace,        
  Fáze 4 =                                                                                                                                                     
    emaily)                                                                                                                                                    
                                                                                                                                                               
  Ale s tím že do jednoho souboru dáš jen ten Jednoduchý Sprint plán a do druhého dáš celý ten roadmap plán pro rozjetí beta testu, také to tam napíšeš v      
  tom stylu jak jsem ti to zde ukázal neboli velmi jednoduchém stylu, rozděůíš to na ty individuální plány že napíšeš pro co je to plán jako třeba             
  kalkulacka nebo něco jiného a ty rozdělíš na ty fáze tak jak jsem ti to ukázal a jak jsi mi to napsal jednoduše v poslední konverzaci                        
  A ty soubory uložíš zde C:\Users\Kuňákovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Jednoduchá_Dokumentace a návody
  Připomínam že tyto soubory budou převážne jen pro mě aby jsem v tom měl přehled a nemusel se prodírat přes všechny ty technické věci ale měl hned na
  jednom místě velmi jednoduše vyznačené jak po sobě jsou ty fáze atd.
  Až to uděláš tak ulož historii
  A používej agenty!


  ------


  