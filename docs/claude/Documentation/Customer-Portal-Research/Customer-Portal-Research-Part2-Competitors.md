# Customer Portal — Konkurencni analyza (Part 2)

> Detailni analyza customer portalu v 3D printing industry a e-commerce.
> Podklad pro navrh ModelPricer Customer Portalu.

**Verze:** 2.0
**Datum:** 2026-03-22
**Autor:** mp-sr-design (design & UX domena)
**Souvisejici:** `Forge-Design-System-Dokumentace.md`, `Widget-Kalkulacka-Dokumentace.md`

---

## Obsah

1. [3D Printing Services](#1-3d-printing-services)
   - 1.1 Shapeways
   - 1.2 Sculpteo
   - 1.3 i.materialise
   - 1.4 Xometry
   - 1.5 Protolabs (+ Digital Factory)
   - 1.6 Hubs (Protolabs Network)
2. [E-commerce Leaders](#2-e-commerce-leaders)
   - 2.1 Amazon Buyer Dashboard
   - 2.2 Shopify Customer Accounts
   - 2.3 Etsy Buyer Account
3. [SaaS Portal Benchmarks](#3-saas-portal-benchmarks)
   - 3.1 Stripe Dashboard
   - 3.2 Figma
4. [Spolecne UI Patterny](#4-spolecne-ui-patterny)
5. [Souhrnna Tabulka Porovnani](#5-souhrnna-tabulka-porovnani)
6. [Doporuceni pro ModelPricer](#6-doporuceni-pro-modelpricer)
7. [Design System Implikace pro Forge](#7-design-system-implikace-pro-forge)

---

## 1. 3D Printing Services

### 1.1 Shapeways

**Profil:** Jeden z nejstarsich online 3D printing marketplace a sluzeb. Pusobnost globalni,
zameren na individual designers i male firmy. Po bankrotu (Chapter 7) v 2024 se znovu
spustil s novym managementem a akvizici platformy Thangs jako marketplace.

#### Portal struktura

| Sekce | URL pattern | Popis |
|-------|-------------|-------|
| My Models | `/mymodels` | Knihovna vsech nahranich 3D modelu |
| My Orders | `/myorders` | Historie objednavek s detailem |
| My Shops | `/shops/manage` | Sprava vlastniho obchodu (marketplace seller) |
| Account Settings | `/account` | Profil, adresy, platby, notifikace |
| Cart | `/cart` | Kosik s konfiguraci materialu/barvy |
| Upload | `/upload` | Drag-and-drop nahrani modelu (batch az 20 souboru) |

#### Klicove funkce

**Upload a analyza modelu:**
- Drag & drop upload s progress barem, batch az 20 souboru najednou
- Podpora formatu: STL, OBJ, DAE, 3MF, VRML, X3D, WRL
- Automaticka printability analyza po uploadu (wall thickness, watertight check)
- Detekce problemu s orientaci a supporty — vizualni zvyrazneni problematickych mist
- Automaticky 3D nahled (WebGL viewer) — rotace, zoom, rezove pohledy
- Estimovane rozmery a objem primo po uploadu, vcetne bounding box vizualizace
- Po akvizici Thangs: propojeni s marketplace pro sdileni/prodej

**Knihovna modelu (My Models):**
- Grid layout s 3D thumbnaily generovanymi ze serveru
- Filtrovani: datum nahrani, nazev, material, stav (printable / has issues)
- Bulk akce: smazat vice modelu, presunout do slozek
- Verze modelu — moznost nahrat novou verzi existujiciho modelu bez ztraceni historie
- Tagovani a kategoricky system pro organizaci
- Sdileni modelu s ostatnimi uzivateli (public/private toggle)
- Export metadat modelu (CSV pro inventar)

**Objednavky (My Orders):**
- Timeline tracking: Ordered -> Processing -> Printing -> Post-processing -> Shipping -> Delivered
- Kazdy krok v timeline ma casovy udaj (datum a hodina)
- Tracking number s proklikem na dopravce (FedEx, UPS, DHL)
- Moznost reorderu — objednat znovu stejny model se stejnymi parametry jednim klikem
- Invoice download (PDF) pro kazdy order
- Zakladni vizualizace stavu (progress bar s barevnymi segmenty)
- Objednavky razene chronologicky s filtrem na stav
- Cena zobrazena v mene zakaznika (automaticka konverze)

**Marketplace integrace (po Thangs akvizici):**
- Designeri mohou prodavat vlastni modely — nastavi cenu, popis, kategorii
- Statistiky prodeje: kolik se prodalo, kolik vydelano, konverzni pomer
- Shopfront customizace — banner, popis, portfolio s galerii
- Markup nastaveni nad zakladni cenu tisku (designer marze)
- Community features: followers, komentare, likes
- Featured listings — zvyraznneni za poplatek
- Revenue split: platforma bere provizi z kazdeho prodeje

**Cenovy kalkulator:**
- Realtime pricing po uploadu — cena se zobrazi do 30s
- Zmena materialu = okamzity prepocet ceny bez reloadu stranky
- Rozdeleni ceny: material cost, printing time, post-processing, markup, shipping
- Mnozstevni slevy pri vicenasobku (2+, 5+, 10+ kusu)
- Expedited shipping options s cenami (standard, express, overnight)
- Cenova historie — zakaznik vidi kolik platil za stejny model predtim

#### UX silne stranky

- **Jednoduchy upload flow** — od uploadu k cene za 3 kroky (upload -> material -> cart)
- **Prehledna knihovna modelu** — grid s dobrymi 3D thumbnaily, rychly vizualni scan
- **Marketplace** — unikatni pridana hodnota, motivace pro komunitu designeru
- **3D viewer** — solidni WebGL implementace s rotaci, zoom, rezovymi pohledy
- **Jasny progress tracking** — vizualni timeline objednavky s casovymi udaji
- **Batch upload** — az 20 souboru najednou, paralelni zpracovani

#### UX slabe stranky

- **Pomaly loading** — stranky se nacitaji pomalu, zejmena s velkym poctem modelu v knihovne
- **Omezene filtrovani** — chybi pokrocile filtry (velikost, material, cenove rozpeti)
- **Dashboard chybi** — zadny agregovany prehled, rovnou padne na My Models
- **Mobilni verze** — responsivita je zakladni, neni mobile-first, 3D viewer na mobilu nefunguje dobre
- **Notifikace** — omezene, prevazne jen emailove, zadne in-app notifikace
- **Empty states** — genericke "You have no models" bez guidance a onboardingu
- **Search** — zakladni keyword match, zadny fuzzy search, zadne suggestions
- **Konzistence** — ruzne sekce maji mirne odlisny vizualni styl (legacy vs novy design)

#### Unikatni prvky pro inspiraci

1. **Marketplace model** — designeri prodavaji, platforma bere marzi z kazdeho prodeje
2. **Integrovany 3D viewer** s rezovymi pohledy a vizualizaci problemu
3. **Model versioning** — aktualizace modelu bez ztraceni historie objednavek
4. **Community aspekt** — profily designeru, portfolia, followers
5. **Thangs integrace** — marketplace s miliony modelu jako pridana hodnota

#### Design a vizualni styl

- Cisty, svetly design (bile pozadi, sede karty s jemnymi stiny)
- Modre akcenty (genericke, ale citelne — #0066CC odsten)
- Fonty: system fonts (-apple-system, Segoe UI), zadna vyrazna typografie
- Spacing: nepravidelny, neni evidentni grid system, ruzne mezery mezi sekcemi
- Ikony: jednoduche line ikony, Feather icons sada
- Cards: zakulacene rohy (8px), jemny box-shadow
- CTA tlacitka: plne modra (#0066CC), bily text, zakulacene

---

### 1.2 Sculpteo

**Profil:** Francouzsky 3D printing servis (od 2019 soucasti BASF Forward AM, pozdeni pod
Replique/Sparrow Solutions). Zamereny na profesionalni pouziti, prototypovani a maloseriovou
vyrobu. Silny v materialech (PA12, PA11, TPU, kovy) a post-processingu. Evropsky fokus.

#### Portal struktura

| Sekce | Popis |
|-------|-------|
| Dashboard | Agregovany prehled — posledni uploady, objednavky, notifikace, statistiky |
| My Files | Knihovna 3D souboru s detailnimi informacemi o kazdem |
| My Orders | Historie s tracking a statusy, filtrovani dle datumu/stavu |
| My Account | Profil, firma, fakturace, API pristup, notifikacni preference |
| Design Tools | Online nastroje pro opravu a optimalizaci modelu |
| Material Guide | Interaktivni pruvodce materialy s porovnavanim |

#### Klicove funkce

**Batch upload:**
- Vice souboru naraz (drag & drop cela slozka nebo multi-select dialog)
- Paralelni zpracovani — kazdy soubor ma vlastni progress bar s procentualnim stavem
- Automaticka konverze formatu kde je to mozne (napr. OBJ -> STL pro kompatibilitu)
- Zip upload — cele archivy s vicero modely (rozbaleni a zpracovani na serveru)
- Upload resume — pri preruseni spojeni pokracuje kde skoncil
- Velikostni limit per soubor: 100 MB, celkem 500 MB na batch

**Online 3D repair tool:**
- Detekce a automaticka oprava mesh chyb: non-manifold edges, holes, inverted normals, self-intersections
- Vizualizace problemu primo v prohlizeci — cervene zvyrazneni problematickych oblasti
- Moznost manualni opravy s jednoduchymi nastroji (fill hole, flip normal, merge vertices)
- Before/after porovnani — split view s originalem a opravenym modelem
- Export opravenych modelu ve vice formatech (STL, OBJ, 3MF)
- Report o opravach: co bylo opraveno, kolik problemu, statistika
- Toto je citovano jako hlavni duvod proc zakaznici vybiraji Sculpteo

**Instant pricing:**
- Cena zobrazena do 30 sekund po uploadu (zavisi na slozitosti modelu)
- Detailni rozklad: material volume (cm3), build time (hodiny), post-processing, coating, shipping
- Porovnani cen mezi materialy — tabulkovy prehled side-by-side
- Cenove alerty — notifikace email kdyz cena klesne pod urcitou zakaznikem nastavenou hranici
- Volume discount calculator — ukazuje uscetrneni pri vetich mnozstvich
- "Price lock" — moznost zamknout cenu na 7 dni

**Material comparison tool:**
- Side-by-side porovnani az 3 materialu v tabulce
- Parametry: tensile strength (MPa), elongation at break (%), heat deflection (C), density (g/cm3)
- Vizualni vlastnosti: barvy (RAL swatch), povrchove upravy, pruhlednost (vzorek)
- Vizualni vzorky — render modelu v ruznych materialech (WebGL preview)
- PDF export porovnani pro interni schvaleni ve firme
- Doporuceni na zaklade use-case: "For functional parts → PA12 SLS"
- Filtrovani materialu dle vlastnosti (min. pevnost, max. cena, barva)

**Design guidelines:**
- Interaktivni guide pro kazdy material — ne jen PDF, ale interaktivni web stranka
- Minimalni wall thickness, maximalni overhangy, tolerance, min feature size
- Prikladove modely s oznacenymi problemy a opravami
- "Can I print this?" checker — upload modelu a okamzita zpetna vazba
- Video tutorialy pro zacatecniky (embedded YouTube)
- FAQ sekce organizovana dle materialu

#### UX silne stranky

- **Profesionalni rozhrani** — vyzrele UI, dobra informacni architektura
- **Batch upload** — klicove pro firmy s vice dily, paralelni zpracovani
- **3D repair tool** — jedinstecna pridana hodnota, snizuje barieru vstupu pro zacatecniky
- **Material comparison** — pomaha s rozhodovanim, snizuje nejistotu zakazniku
- **Design guidelines** — edukacni obsah primo v portalu, ne na externi wiki
- **Dobry onboarding** — step-by-step pro nove uzivatele s progress indicatorem
- **Price lock** — zakaznik neni pod tlakem okamzite objednat

#### UX slabe stranky

- **Slozitejsi cenova struktura** — mnoho promennych (material, post-processing, coating, infill)
- **UI trochu zastarale** — nektere sekce pusobi datovane (2018-era design patterns)
- **Omezena personalizace** — dashboard neni customizovatelny (fixni layout)
- **Pomalejsi API response** — zpracovani velkych souboru (50MB+) muze trvat 2+ minuty
- **Navigace** — prilis mnoho urovni, obcas se uzivatel ztrati v hlubokych podsekce
- **Konzistence** — repair tool ma jiny vizualni styl nez zbytek portalu (separatni tým)

#### Unikatni prvky pro inspiraci

1. **3D repair/optimization tool** — obrovska pridana hodnota, snizuje support dotazy
2. **Material comparison** — side-by-side s vizualnimi vzorky na modelu zakaznika
3. **Batch upload** s paralelnim zpracovanim a resume po preruseni
4. **Design guidelines** integrovane do portalu s interaktivnimi priklady
5. **Cenove alerty a Price lock** — zakaznik si zamkne cenu
6. **"Can I print this?" checker** — okamzita zpetna vazba pred objednanim

#### Design a vizualni styl

- Tmavsi header (#2D3748), svetle obsahove oblasti (biela, #F7FAFC)
- Modro-sede barevne schema s oranzovym CTA (BASF influence)
- Karty s jemnymi stiny (box-shadow: 0 2px 8px rgba(0,0,0,0.08))
- Konzistentni iconografie (custom SVG sada, 24px grid)
- Typografie: Roboto/Open Sans stack, 14px base, citelna na vsech velikostech
- Spacing: 16px zakladni modul, ale ne vzdy konzistentni
- Formulare: floating labels, validation inline

---

### 1.3 i.materialise

**Profil:** Belgicka firma (soucast Materialise NV, zalozena 1990), jeden z prukopniku
komercniho 3D tisku. Nejsirsi nabidka materialu na trhu (25+). Zamereni na kvalitu
a presnost, prevazne B2B s rostoucim B2C segmentem. Globalni pusobnost s vyrobou v Belgii a USA.

#### Portal struktura

| Sekce | Popis |
|-------|-------|
| Upload | Nahrani modelu s okamzitym pricingem a analyticke view |
| My Models | Knihovna s detailnimi vlastnostmi, tagy, historii |
| My Orders | Kompletni historie vsech objednavek |
| Design Lab | Online editor pro zakladni upravy a optimalizace modelu |
| Material Explorer | Interaktivni pruvodce vsemi 25+ materialy |
| Profile | Ucet, adresy, platebni metody, API klice |
| Documentation | API docs, design guides, material specs |

#### Klicove funkce

**Siroke materialy (25+):**
- Kazdy material ma detailni specifikacni list: mechanicke, termicke, opticke vlastnosti
- Mechanicke vlastnosti: tensile strength, flexural modulus, elongation at break, impact resistance
- Vizualni vlastnosti: dostupne barvy (RAL/Pantone), povrchove upravy (lesteni, barveni, pozlaceni)
- Cenove rozpeti pro kazdy material (min/max za cm3)
- Doporuceni pouziti: functional parts, visual prototypes, wearables, medical, aerospace
- Realne fotografie vytisknutych dilku v kazdem materialu (galerie 10-20 fotek)
- Materialove srovnani s konvencni vyrobou (injection molding vs 3D print)
- Certifikace: biocompatibilita, food safe, flame retardant dle materialu

**Instant quote:**
- Automaticka cena po uploadu (typicky do 20 sekund pro modely pod 50 MB)
- Cena se meni dynamicky s kazdou zmenou parametru (material, finish, quantity) bez reloadu
- Volume-based pricing — vetsi objekt = nelinearni rust ceny (kubicky pricing model)
- Transparentni cenova formule: uzivatel vidi co plati za co (material, machine time, labor, shipping)
- Multi-part quoting — vice dilu v jednom quotu s celkovou slevou
- Quote history — uzivatel vidi vsechny sve predchozi quoty
- Quote sharing — moznost sdílet quote s kolegou via link

**Design Lab:**
- Online editor primo v prohlizeci (WebGL-based)
- Zakladni operace: scaling (uniformni i per-axis), hollowing (dutina pro usetrneni materialu)
- Text embossing a engraving — pridani textu na povrch modelu
- Kontrola wall thickness v realnem case — vizualni heatmapa (cervena = tenke)
- Automaticke opravy: hole filling, smoothing, decimation (redukce polygonu)
- Orientace optimalizace — navrh nejlepsi orientace pro tisk
- Omezene ve srovnani s desktop softwarem, ale dostatecne pro 80% zakazniku

**API pro developery:**
- REST API pro integrace do vlastnich systemu
- Endpointy: upload, pricing, ordering, status tracking, materials
- Webhook notifikace o zmene statusu objednavky (HTTP POST callback)
- API dokumentace s prikladovymi requesty v curl, Python, JavaScript
- Sandbox prostredi pro testovani (izolované od produkce)
- Rate limiting: 100 req/min pro standard plan, 1000 req/min pro enterprise
- Klientske SDK: Python, JavaScript (npm package)

**Bulk ordering:**
- Hromadne objednavky s mnozstevnimi slevami (tabulka: 1-9, 10-49, 50-99, 100+)
- Import CSV/Excel seznamu dilu — nazev, material, mnozstvi, poznamky
- Hromadna zmena materialu/mnozstvi pres vsechny dily v objednavce
- Sdruzene dodani (vice dilu v jedne zasilce, uspora na shippingu)
- Firemni objednavkovy process: schvalovani, PO cisla, cost center kody
- Net terms pro verified B2B zakazniky (30/60/90 dni splatnost)

#### UX silne stranky

- **Detailni materialove informace** — nejlepsi v branzi, zdaleka nejkomplexnejsi
- **Transparentni ceny** — uzivatel presne vi za co plati, zadne skryte poplatky
- **Kvalitni fotodokumentace** — realne fotky materialu a vytisknhtych dilu (ne jen rendery)
- **API** — umoznuje hlubokou integraci do ERP/PLM systemu
- **Profesionalni pristup** — celkova kvalita komunikace a dokumentace
- **Quote sharing** — sdileni cenovych nabidek s kolegy/nadrizenymi

#### UX slabe stranky

- **Preplnene rozhrani** — prilis mnoho informaci na jedne strance (material explorer)
- **Navigace** — hluboka hierarchie, obtizna orientace pro nove uzivatele
- **Design Lab omezeni** — zakladni nastroje, zkusenejsi uzivatele to frustruje (chybi Boolean ops)
- **Pomalejsi upload** — zpracovani velkych souboru (100MB+) muze trvat minuty
- **Mobilni verze** — funkcne, ale neprijemna pro slozitejsi ukoly (Design Lab nefunguje)
- **Vizualni styl** — zustava konzervativni, enterprise-feel muze odrazit male zakazniky

#### Unikatni prvky pro inspiraci

1. **Materialova encyklopedie** — 25+ materialu s detailnimi specifikacemi a realnimi fotkami
2. **Design Lab** — online editor s wall thickness heatmapou
3. **API-first pristup** — dobre zdokumentovane REST API s SDK
4. **Transparentni pricing** — rozklad ceny na slozky, zadne hidden fees
5. **Bulk ordering** s CSV importem a firemnim workflow
6. **Quote sharing a history** — sdileni a historie cenovych nabidek

#### Design a vizualni styl

- Svetly, cisty design s bielym pozadim a jemne sedymi bordery
- Zelene akcenty (firemni barva Materialise — #00A651)
- Hodne fotografi a vizualnich materialu — fotky dominuji layoutu
- Cards layout pro materialy (grid 3-4 sloupce na desktopu)
- System font stack (Helvetica Neue, Arial), konzistentni velikosti
- Hodne whitespace v materialovych strankach, mene v admin sekcich
- Formulare: klasicky label-above-input, validace on blur

---

### 1.4 Xometry

**Profil:** Americka platforma pro on-demand manufacturing (NYSE: XMTR). Pokryva nejen
3D tisk (FDM, SLA, SLS, MJF, DMLS), ale i CNC, sheet metal, injection molding, die casting.
Silne B2B zamereni s AI-powered pricingem. Sit 10,000+ vyrobnich partneru. Operace v USA a Evrope.

#### Portal struktura

| Sekce | Popis |
|-------|-------|
| Dashboard | Prehled aktivnich quotu, objednavek, notifikaci, poslednich akci |
| Quotes | Sprava cenovych nabidek (draft, submitted, expired, accepted) |
| Orders | Aktivni a dokoncene objednavky s detailnim tracking |
| Parts Library | Centralni knihovna vsech dilu s verze a historii |
| Team | Sprava tymu, role, opravneni, schvalovaci workflow |
| Account | Profil, firma, fakturace, API pristup |
| Resources | Knowledge base, DFM tipy, materialy guides |

#### Klicove funkce

**Instant quoting (AI-powered):**
- Nahrani CAD souboru (STEP, IGES, STL, Solidworks, Fusion 360) -> cena do 60 sekund
- AI analyzuje geometrii a vybira optimalni vyrobni metodu automaticky
- Doporuceni vhodne technologie: "3D print (SLS) is 40% cheaper than CNC for this part"
- Cena zahrnuje material, vyrobu, post-processing, QC, dopravu
- Quote je platny po definovanou dobu (typicky 30 dni, konfigurovatelne)
- Moznost ulozeni quotu jako draft a navraceni se k nemu pozdeji
- Instant vs Manual quote — jednoduche dily automaticky, slozite manualne s inzenyrem
- Cenova presnost: +-5% pro instant quotes, presna pro manualni

**DFM Analysis (Design for Manufacturing):**
- Automaticka analyza vyrobitelnosti po uploadu — nejcitovanejsi feature v recenzich
- Identifikace problematickych mist: tenke steny, ostre uhly, undercuts, hluboky pomer, male otvory
- Vizualni oznaceni na 3D modelu — cervene/zlute/zelene zony dle zavaznosti
- Navrhy optimalizace s popisem: "Increase wall thickness from 0.5mm to 1.2mm for SLS"
- Odhad dopadu zmen na cenu: "This optimization would reduce cost by 15%"
- Report exportovatelny jako PDF pro sdileni s designery/inzenyry
- Porovnani DFM vysledku mezi vyrobnimi metodami
- Toto je HLAVNI konkurencni vyhoda Xometry — zadna jina platforma to ma tak pokrocile

**Multiple manufacturing methods:**
- 3D Printing: FDM, SLA/DLP, SLS, MJF (HP), DMLS/SLM (kovy), PolyJet
- CNC Machining: 3-axis milling, 5-axis milling, turning, wire EDM
- Sheet Metal: laser cutting, bending, welding, powder coating
- Injection Molding: prototypove (hlinikove formy) i seriove (ocelove formy)
- Porovnani metod pro stejny dil: tabulka cena vs cas vs kvalita vs material
- "Which process is right for you?" interaktivni rozhodovaci strom

**Team management:**
- Firemni ucty s neomezenym poctem uzivatelu
- Role: Admin (plny pristup), Engineer (upload, quote, komentare), Purchaser (objednavani, platby), Viewer (read-only)
- Schvalovaci workflow: Engineer vytvori quote -> Purchaser schvali -> objednavka se odeslne
- Sdilene projekty a quotes mezi cleny tymu
- Audit log — kdo co kdy zmenil, kazda akce zaznamenana
- SSO integrace: SAML 2.0, Okta, Azure AD, Google Workspace
- Budget limits per user/team — automaticke schvalovani pod limitem

**RFQ system pro velke objednavky:**
- Request for Quote pro velke/slozite objednavky (100+ kusu, specialni materialy)
- Manualni revize inzenyrem Xometry (odpoved do 24-48 hodin)
- Moznost pridat poznamky, vykresy, specialni pozadavky, certifikacni potreby
- Komunikace s inzenyrem primo v portalu (thread-based messaging)
- Cenove jednani — counter-offers, volume negotiations
- Dedicated account manager pro enterprise zakazniky

#### UX silne stranky

- **Profesionalni B2B rozhrani** — navrzene pro inzenyry a purchasery, ne pro konzumenty
- **Rychle quotes** — AI pricing je rychly (60s) a presny (+-5%)
- **DFM analysis** — obrovska pridana hodnota, snizuje iterace a chyby ve vyrobe
- **Multi-process porovnani** — pomaha s rozhodovanim o technologii
- **Team features** — schvalovaci workflow, role, audit log — vse co B2B potrebuje
- **Dashboard** — dobry agregovany prehled s akciemi a notifikacemi
- **SSO** — enterprise-grade autentikace

#### UX slabe stranky

- **Komplexita** — pro male firmy/individue muze byt overwhelming (prilis mnoho moznosti)
- **Onboarding** — malo guidance pro nove uzivatele, predpoklada znalost manufacturing
- **Mobilni verze** — zakladni responsive, neni optimalizovana pro telefon (DFM viewer nefunguje)
- **Cenova nepredvidatelnost** — AI pricing muze dat prekvapive vysledky u neobvyklych geometrii
- **Komunikace** — RFQ responses mohou trvat 2+ dny u slozitych dotazu
- **Learning curve** — strmá ucici krivka pro nove uzivatele

#### Unikatni prvky pro inspiraci

1. **AI-powered DFM analysis** — automaticke navrhy pro zlepseni vyrobitelnosti
2. **Multi-process quoting** — porovnani technologii pro stejny dil s cenou a casem
3. **Team management** s rolemi, schvalovacim workflow a budget limits
4. **Quote management** — drafty, expirace, sdileni, archivace
5. **Manufacturing doporuceni** — AI navrhe optimalni metodu a material
6. **Audit log** — kompletni historie vsech akci v tymu

#### Design a vizualni styl

- Profesionalni, korporatni design — cisty a seriozni dojem
- Tmave modre (#1A365D) a bile barevne schema s teal akcenty (#319795)
- Sidebar navigace (hlavni, 240px), content area vpravo (fluid)
- Data-heavy UI — tabulky, grafy, metriky, ale dobre organizovane
- Dobra typograficka hierarchie: H1 24px bold, H2 20px semibold, body 14px regular
- Ikony: custom sada s engineering tematikou (gears, rulers, layers)
- Cards pro projekty s jasnym CTA, tabulky pro detailni data
- Status badges: barevne zakodovane (zelena, zluta, cervena, modra)

---

### 1.5 Protolabs (+ Digital Factory)

**Profil:** Jeden z nejvetrsich rychlo-vyrobnich dodavatelu na svete (NYSE: PRLB).
"Digital Factory" koncept — plne digitalizovany vyrobni proces od nahrani po dodani.
Operace v USA, Evrope a Japonsku. Silny v injection molding a CNC, 3D tisk jako doplnek.
Akvizice 3D Hubs (nyni "Protolabs Network") v 2021.

#### Portal struktura

| Sekce | Popis |
|-------|-------|
| Digital Factory Dashboard | Centralni rozcestnik s prehledem vsech aktivit |
| Projects | Organizace dilu do projektu (slozky, tagy, metadata) |
| My Parts | Centralni knihovna vsech dilu s historii |
| Orders | Aktivni a historicke objednavky s detailnim tracking |
| Quotes | Cenove nabidky (aktivni, expiring soon, expired, accepted) |
| Account | Profil, firma, shipping preference, notifikace |
| Resources | Technicke materialy, design tips, whitepapers, webinare |
| Help Center | Knowledge base, ticket system, live chat |

#### Klicove funkce

**Project management:**
- Slozky pro organizaci dilu do projektu (neomezeny pocet urovni)
- Tagy a metadata na dilyech i projektech (custom key-value pairs)
- Sdileni projektu s kolegy: invite via email, link sharing s permissions
- Project-level nastaveni: preferovany material, deadline, priorita (low/medium/high/critical)
- Kopirovani projektu jako sablony pro opakujici se vyrobky
- Archivace starych projektu (ne smazani, vzdy obnovitelne)
- Project notes — sdileny notepad pro poznamky k projektu
- Project timeline — vizualni casova osa vsech aktivit v projektu

**Collaborative features:**
- Sdileni quotu a objednavek s kolegy v realnem case
- Komentare na dilyech a objednavkach (thread-based, s @mentions)
- @mentions v komentarich — notifikace zmínenemu uzivateli
- Role: Owner (plny pristup + billing), Editor (upload, quote, order), Viewer (read-only)
- Notifikace o zmenach od kolegu (email + in-app)
- Sdilene adresy a fakturacni udaje v ramci firmy (company address book)
- Activity feed — chronologicky seznam vsech akci v projektu/teamu

**Manufacturing feedback v realnem case:**
- Okamzita zpetna vazba po uploadu: je dil vyrobitelny ano/ne + duvod
- Vizualni indikace problematickych oblasti na 3D modelu (heatmapa)
- Navrhy alternativnich postupu: zmena orientace, pridani supportu, zmena materialu
- Estimace kvality povrchu pro ruzne orientace tisku (Ra hodnoty)
- Doporuceni materialu na zaklade geometrie a deklarovanych pozadavku zakaznika
- "Design Cube" — interaktivni 3D vizualizace orientace a podpor
- Porovnani vyrobnich metod s dopady na kvalitu a cenu

**Expedited services:**
- 3 urovne rychlosti: Standard (5-7 dnu), Expedited (3-4 dny), Super-Expedited (1-2 dny)
- Jasne uvedeny cas dodani pro kazdou moznost vcetne garantovaneho data
- Cenovy rozdil zobrazen transparentne (napr. "Expedited: +35%, Super: +80%")
- "Need it by" date picker — system automaticky navrhe nejlevnejsi moznost pro dany termin
- Rush orders s garanovanou dodaci lhutou a penalte pri nedodrzeni
- Automaticka eskalace pri zpozdeni — zakaznik je informovan proaktivne

**Certifikace a testovani:**
- Objednani materialovych certifikatu: Certificate of Conformance (CoC), Material Test Report (MTR)
- Inspekce a mereni: CMM (Coordinate Measuring Machine), opticky sken, profil drsnoti
- Mechnicke testovani: tensile, impact, hardness, fatigue
- FAI (First Article Inspection) reporty dle AS9102
- Vsechny certifikaty a reporty stahovatelne z portalu (PDF)
- Certifikace jako soucst objednavky (checkbox pri objednani, automaticke zarazeni do ceny)

#### UX silne stranky

- **Project-centric workflow** — logicka organizace dilu, ne jen flat list
- **B2B features** — collaboration, role, sdileni, schvalovani — profesionalni uroven
- **Manufacturing feedback kvalita** — insights jsou presne a uzitecne pro engineering
- **Timeline** — jasny progress kazde objednavky s casovymi udaji a odhadama
- **Resources** — edukacni obsah primo v portalu (whitepapers, webinare, design tips)
- **Expedited jasnost** — uzivatel vi presne co rychlejsi dodani stoji a kdy dostane dily
- **"Need it by" date picker** — vyrazne zjednodusuje rozhodovani o rychlosti
- **Activity feed** — vidim co se deje v projektu/teamu

#### UX slabe stranky

- **Overwnelming pro zacatecniky** — hodne funkci, malo guidance, predpoklada B2B zkusenost
- **UI hustota** — prilis mnoho informaci na dashboardu, male fonty
- **Pomaly prvni load** — tezke stranky s mnoha komponentami (5-8s initial load)
- **Limitovany customization** — dashboard nelze prizpusobit (fixni layout karet)
- **Search** — hledani v dilyech a projektech je zakladni (keyword only, ne full-text)
- **Mobilni** — existuje, ale neni primarne optimalizovano (sideline ktera frustruje)
- **Onboarding** — pro noveho uzivatele je tezke pochopit kde zacit

#### Unikatni prvky pro inspiraci

1. **Digital Factory concept** — metafora tovary, vizualni reprezentace "vyrobni linky"
2. **Project management** — slozky, tagy, sablony projektu, project timeline
3. **Collaboration tools** — komentare, @mentions, sdileni, activity feed
4. **"Need it by" date picker** — inteligentni nabidka na zaklade deadline zakaznika
5. **Certifikace a testovani** — objednavatelne primo z portalu jako addon k objednavce
6. **Resource center** — technicky obsah jako integrovana soucast portalu
7. **Design Cube** — interaktivni vizualizace orientace tisku

#### Design a vizualni styl

- Moderni korporatni design, svetle tema s bielu background
- Zeleno-modre akcenty (#0088CC hlavni, #00B894 sekundarni)
- Sidebar navigace: thin (64px collapsed), expandable (240px), icon-based
- Cards pro projekty (grid 2-3 sloupce), tabulky pro dily (sortovatelne)
- Dobra prace s whitespace — dychatelny layout i pri hodne datech
- Profesionalni typografie: sans-serif (Proxima Nova), jasna hierarchie (H1-H4)
- Status indicators: color-coded dots + text labels
- Mikro-interakce: jemne hover efekty, smooth transitions (200ms ease)

---

### 1.6 Hubs (Protolabs Network)

**Profil:** Marketplace model — sit vyrobnich partneru (10,000+ v 3D tisku, CNC, sheet metal).
Puvodne samostatna platforma "3D Hubs" (zalozena 2013 v Amsterodamu), akvizice Protolabs
v 2021 a rebranding na "Protolabs Network". Klicovy rozdil: zakaznik nesloji jen jednomu
dodavateli, ale dostava nabidky od vice partneru v siti.

#### Portal struktura

| Sekce | Popis |
|-------|-------|
| Dashboard | Prehled aktivnich quotu a objednavek, rychle akce |
| New Quote | Upload a konfigurace noveho dilu |
| My Quotes | Seznam vsech quotu s filtry (stav, datum, cena) |
| My Orders | Aktivni a dokoncene objednavky s tracking |
| Parts | Knihovna dilu s historii objednavek a konfiguraci |
| Account | Profil, adresy, platby, notifikace |

#### Klicove funkce

**Marketplace model — porovnavani nabidek:**
- Po nahrani dilu system automaticky oslovi relevantni vyrobni partnery v siti
- Zakaznik vidi nabidky od ruznych dodavatelu (typicky 3-5 nabidek pro 3D tisk)
- Porovnani: cena, cas dodani, material dostupnost, hodnoceni dodavatele, lokace
- Moznost vybrat preferovaneho dodavatele na zaklade libovolneho kriteria
- Transparentni informace o dodavateli: lokace, hodnoceni, pocet objednavek, specializace
- "Best value" a "Fastest" doporuceni — system oznaci nejlepsi nabidky

**Reviews a hodnoceni:**
- 5-hvezdicovy system pro dodavatele s textovymi recenzemi
- Kategorizovane hodnoceni: kvalita (presnost, povrch), komunikace, rychlost, baleni
- Celkove skore dodavatele viditelne pri porovnavani nabidek
- Top-rated badges pro nejlepsi dodavatele (ikona "Top Rated" u jmena)
- Verifikovane recenze — jen od zakazniku kteri skutecne objednali
- Odpovedi dodavatelu na recenze (oboustranna komunikace)

**Transparentni ceny:**
- Rozlozeni ceny: material + printing + post-processing + platform fee + shipping
- Porovnani s "benchmark cenou" — prumerna cena za podobny dil
- Cenova historie — kolik staly podobne dily v minulosti (agregované)
- Volume discounts zobrazeny jasne v tabulce (1, 5, 10, 25, 50, 100+ kusu)
- Zadne hidden fees — vsechno viditelne pred objednanim

**Dalsi funkce:**
- In-portal messaging s dodavatelem (text + prilohy)
- Sledovani zasilky s integraci dopravcu (real-time tracking)
- Automaticke re-quoty pri zmene parametru (netreba novy upload)
- Ulozene konfigurace pro opakovane objednavky (model + material + finish)
- Import/export dilu (CSV, STEP) pro integrace s PLM systemy

#### UX silne stranky

- **Transparentnost** — uzivatel vidi vice nabidek a muze porovnavat na zaklade dat
- **Jednoduchost** — mene komplexni nez Xometry/Protolabs, privetivejsi pro mene zkusene
- **Hodnoceni** — socialni dukaz kvality dodavatelu, snizuje riziko
- **Komunikace** — primy kontakt s dodavatelem primo v portalu
- **Rychly flow** — od uploadu ke quote za 2-3 minuty
- **"Best value" doporuceni** — system pomaha s rozhodovanim

#### UX slabe stranky

- **Omezena kontrola** — zakaznik nema plnou kontrolu nad tim kdo presne bude vyrabet
- **Variabilita kvality** — ruzni dodavatele mohou mit ruznou uroven kvality
- **Mene pokrocile nastroje** — zadny DFM, zakladni 3D viewer, zadny repair tool
- **Omezene filtry** — filtrovani quotu je zakladni (stav, datum)
- **Mobilni app** — neexistuje nativni, jen responsive web (zakladni)
- **Zavislost na siti** — pokud neni vhodny dodavatel v siti, neni co nabidnout

#### Unikatni prvky pro inspiraci

1. **Multi-supplier porovnani** — uzivatel vybira z vice nabidek na zaklade dat
2. **Supplier ratings a reviews** — socialni dukaz, transparentni hodnoceni s kategoriemi
3. **In-portal messaging** — komunikace s dodavatelem bez emailu (thread-based)
4. **"Best value" a "Fastest" badges** — system doporucuje nejlepsi nabidky
5. **Cenova transparentnost** — detailni rozklad vcetne benchmark porovnani
6. **Volume discount vizualizace** — jasne viditelne slevy v tabulce

#### Design a vizualni styl

- Cisty, moderni design (po redesignu pod Protolabs brandingem)
- Bile pozadi, sede karty (#F7FAFC), modre CTA tlacitka (#0088CC)
- Jednoduchy layout — mene je vice, hodne whitespace
- Cards pro nabidky dodavatelu (grid 2 sloupce, card se dodavatelem nahore)
- Hvezdicove hodnoceni — zlata (#F6AD55) na bilem pozadi
- Rating bars pro kategorizovane hodnoceni
- Responsivni, ale ne mobile-first (desktop-first design preveden na mobil)
- Fonty: Helvetica/Inter stack, 14px base size

---

## 2. E-commerce Leaders

### 2.1 Amazon Buyer Dashboard

**Proc analyzovat:** Amazon je etalon e-commerce UX. Miliardy transakci rocne = masivni
A/B testing a optimalizace. Kazdy UX pattern, ktery Amazon pouziva, byl testovan
na stovkach milionu uzivatelu a optimalizovan pro maximalni konverzi.

#### Struktura

| Sekce | Popis |
|-------|-------|
| Your Orders | Vsechny objednavky (aktivni, dorucene, zrusene), filtrovatelne |
| Returns & Refunds | Sprava vraceni a refundaci — self-service |
| Your Lists | Wishlists a nakupni seznamy |
| Your Account | Profil, adresy, platby, bezpecnost, privacy |
| Payment Methods | Sprava platebni metod (karty, Amazon Pay, bank) |
| Subscribe & Save | Pravidelne objednavky s automatickym objednanim |
| Buy Again | Opakovane nakupy na zaklade historie |
| Browsing History | Co jste si prohlizeli — personalizace |
| Digital Content | Kindle, Prime Video, Music — digitalni obsah |

#### Klicove funkce a best practices

**Order Tracking:**
- Timeline vizualizace — horizontalni progress bar s ikonami a presnymi daty
- 4-5 kroku: Ordered -> Shipped -> Out for delivery -> Delivered (-> Returned)
- Mapa s aktualni polohou zasilky (pro Amazon Logistics — real-time GPS)
- Push notifikace o kazde zmene stavu (email + app + SMS optional)
- Fotograficky dukaz doruceni ("Photo on Delivery") — fotka baliku u dveri
- ETA aktualizace v realnem case: "Arriving today by 8 PM"
- Jednoduche zobrazeni: velky status text + vizualni timeline pod nim
- Detail: kliknout na objednavku = polozky, ceny, tracking link, invoice

**Jednoduche vraceni:**
- "Return or Replace Items" na 2 kliknuti od detail objednavky
- Preprintovane stitky — zadne rucni vyplnovani formulu
- Drop-off lokace na mape — nejblizsi Whole Foods, Amazon Locker, UPS Store
- Pickup scheduling — ridic prijde pro balik v cas ktery si zvolim
- Okamzity refund (jeste pred dorucenim vraceneho zbozi) pro trusted ucty
- Status tracking vraceni analogicky k objednavce (timeline)
- Duvod vraceni: dropdown s preddefinovanymi moznostmi, ne volny text

**Buy Again:**
- Agregace vsech predchozich nakupu v jednom miste
- "Buy it again" tlacitko na kazdem produktu — 1-click reorder
- Personalizovane doporuceni na zaklade historie a frekvence
- Frekvencni analyza: "You usually buy this every 3 months" s pripomnutim
- Price tracking — "Price dropped since your last purchase"
- Filtrovani: kategorie, cena, datum posledniho nakupu

**Save for Later:**
- Presun z kosiku do "Saved for Later" (ne ztraceno, ale neblokuje checkout)
- Price tracking — notifikace kdyz cena klesne pod urcitou hranici
- "Move to Cart" jedním klikem — zpet do kosiku
- Integrace s wishlists — "Add to List" z libovolne stranky
- Sdileni wishlistu s prateli/rodinou (public/private/shared link)

#### Best practices pro ModelPricer

| Amazon pattern | Adaptace pro ModelPricer |
|----------------|------------------------|
| Timeline tracking | Timeline pro 3D tisk: Upload -> Analyza -> Slicing -> Printing -> Post-processing -> QC -> Shipping -> Delivered |
| Reorder button | "Print Again" tlacitko na kazdem predchozim modelu/objednavce |
| Order detail layout | Prehledny detail s 3D thumbnailem modelu, materialem, parametry, cenou |
| 1-click actions | Quick actions: reorder, download invoice, contact support, share |
| Photo on delivery | QC fotky hotoveho vytisku pred odeslanum — zakaznik vidi kvalitu |
| Status notifications | Email + in-app notifikace o kazdem kroku vyroby (konfigurovatelne) |
| Search in orders | Full-text search pres objednavky a modely (nazev, material, cislo) |
| Price history | "Posledne jste platili X za tento model" — transparentnost |
| Save for later | "Ulozit konfiguraci" — model + material + parametry pro budouci tisk |

#### Design a vizualni styl

- Funkcni, ne "hezky" — priorita je efektivita a srozumitelnost
- Oranzovo-cerne schema (vysoka rozpoznatelnost, brand identity)
- Dense layout — hodne informaci na male plose, optimalizovano pro scan-reading
- Velka CTA tlacitka: zlute (#FFD814) nebo oranzove (#FF9900), cerne text
- Custom font: Amazon Ember (optimalizovano pro screen reading)
- Jasna typograficka hierarchie: product name bold, details regular, price bold larger
- Cards pro objednavky s jasnym status badge (green/yellow/red bar nahore)
- Mikro-interakce: okamzita vizualni zpetna vazba na kazdy klik

---

### 2.2 Shopify Customer Accounts

**Proc analyzovat:** Shopify je platforma na ktere bezi 4+ miliony e-shopu.
Jejich customer account je sablonou pro "standardni" e-commerce zakaznicke ucty.
Relevantni protoze ModelPricer widget se integruje do Shopify obchodu.

#### Struktura

| Sekce | Popis |
|-------|-------|
| Order History | Seznam objednavek s filtry (stav, datum) |
| Order Detail | Detail jedne objednavky — polozky, ceny, tracking |
| Account Info | Jmeno, email, telefon, heslo |
| Addresses | Dodaci a fakturacni adresy (vice adres, default) |
| Wishlist | Oblibene produkty (plugin dependent — neni nativne) |

#### Klicove funkce

**Jednoduchy prehled:**
- Minimalisticky seznam objednavek — zadne zbytecne informace
- Kazda objednavka: cislo (#1001), datum (Mar 15, 2026), celkova cena ($49.99), stav badge
- Proklik do detailu s polozkami, cenami, slevami, danemi
- Barvy stavu: zelena (Fulfilled), zluta (Pending/Partially fulfilled), cervena (Cancelled)
- Pagination: 20 objednavek na stranku, next/previous navigace

**Editace profilu:**
- Jednoduchy formular: jmeno, email, telefon, heslo
- Zmena hesla: current password required + new password s strength indicatorem
- Vice dodacich adres: pridat/editovat/smazat, oznacit jednu jako default
- Notifikacni preference: email marketing opt-in/out (checkbox)
- Account deletion: self-service s potvrzovacim emailem

**Historie objednavek:**
- Chronologicky razeny seznam (nejnovejsi nahore)
- Filtrovani podle stavu (fulfillment status, payment status)
- Detail: polozky s produktovymi fotkami, mnozstvi, ceny, slevy, dane, shipping
- Tracking link pokud je dostupny (dopravce zalezi na e-shopu)
- Reorder tlacitko (zavisi na theme/plugin — neni nativne v Shopify)
- Invoice/receipt emailem (automaticky po objednani)

**Nove Customer Account Pages (2024+):**
- Modernizovane rozhrani — "new customer accounts" beta program
- Self-service returns a refunds (ne vsechny shopy)
- Loyalty points / rewards integrace (Shopify Plus)
- B2B funkce: company accounts, net terms, quantity breaks, catalogs
- Multi-store pristup: jeden zakaznicky ucet, vice obchodu
- Passwordless login: magic link emailem (ne heslo)
- Prihlaseni pres Shop app (Shopify mobilni aplikace)

#### Best practices pro ModelPricer

| Shopify pattern | Adaptace |
|-----------------|----------|
| Cistota a jednoduchost | Portal nema byt prepicany — zakladni flow musi byt intuitivni za 5 sekund |
| Mobile-first | Layout ktery funguje primarne na telefonu, az pak na desktopu |
| Status badges s barvami | Barevne kodovany stav objednavky (jasne na prvni pohled) |
| Default address | Prednastavena dodaci adresa pro rychle objednani |
| Self-service returns | Zakaznik si sam inicializuje reklamaci bez kontaktovani supportu |
| Passwordless login | Magic link emailem — jednodussi nez heslo, bezpecnejsi |
| Multi-store | Jeden ucet zakaznika = pristup do vice tiskaren (pokud maji ModelPricer) |

#### Design a vizualni styl

- Ultra-minimalisticky — bile pozadi, cerny text, minimalni dekorace
- System fonts (no custom fonts in most standard themes)
- Velke klikaci plochy na mobilu (touch-friendly, min 44px)
- Monochrome s jednim akcentem (zalezi na theme — zelena, modra, cerna)
- Jasna typograficka hierarchie: max 3 urovne (title, subtitle, body)
- Spacing: velky whitespace, dychatelny layout, 16-24px margin mezi sekcemi
- Formulare: label-above-input, clear error messages, auto-focus na prvni pole
- CTA tlacitka: plna barva (filled), zakulacene (4-8px radius), velka na mobilu

---

### 2.3 Etsy Buyer Account

**Proc analyzovat:** Etsy je marketplace pro handmade a custom produkty. Relevantni
protoze 3D tisk je casto "custom manufacturing" — analogicky model k handmade.
Komunikace s poskytovatelem a review system jsou klicove paralely.

#### Struktura

| Sekce | Popis |
|-------|-------|
| Purchases & Reviews | Vsechny nakupy s moznosti hodnoceni primo z listu |
| Messages | Komunikace s prodejci (thread-based konverzace) |
| Favorites | Oblibene produkty, obchody, kolekce |
| Account Settings | Profil, adresy, platby, privacy, notifikace |
| Gift Cards & Coupons | Sprava darckovych poukazu a kuponovych kodu |

#### Klicove funkce

**Favorites / Collections:**
- "Heart" ikona na kazdem produktu pro ulozeni — jednim klikem (ne modal, ne redirect)
- Organizace do kolekci/slozek — custom nazvy, popisy, cover image
- Sdileni kolekcni s prateli: public URL, social sharing, embed
- Price drop notifikace na favoritech: "Price dropped 20% on item you liked!"
- "Favorites" jako vstupni bod pro opakovane nakupy a inspiraci
- Statistiky: kolik lidi si dany produkt ulozilo (socialni dukaz)

**Messaging:**
- In-app messaging s prodejcem — thread-based konverzace
- Strukturovane zpravy: tematicky = dotaz, problem, custom request, shipping inquiry
- Obrazky a prilohy v konverzaci (max 5 obrazku, PDF, ZIP)
- Automaticke odpovedi prodejce (FAQs, delivery info, out of office)
- Read receipts a typing indikator — zakaznik vidi ze prodejce cte/pise
- Notifikace o novych zpravach: email + push (konfigurovatelne)
- Archivace konverzaci — staré konverzace se archivuji, ne mazou
- Quick responses — predpripravene sablony pro caste dotazy

**Review system:**
- 5-hvezdicove hodnoceni + textova recenze + fotky (az 5 fotek)
- Moznost pridat fotku prijateho produktu — "Customer photos" galerie
- Prodejce muze odpovedet na recenzi (verejne — viditelne vsem)
- "Was this review helpful?" — community upvotes (socialni dukaz)
- Recenze ovlivnuji viditelnost prodejce ve vyhledavani (ranking faktor)
- Pripominka k napsani recenze: email 14 dni po doruceni
- Star breakdown: kolik 5-star, 4-star atd. (vizualni bar chart)
- Nejnovejsi recenze nahore, moznost filtrovani (1-5 hvezd, s fotkou)

**Custom requests:**
- Moznost zaslat prodejci vlastni pozadavek (free-form zprava)
- Prodejce vytvori custom listing pro zakaznika (privatni URL)
- Cenove jednani pres messaging — prodejce nabidne, zakaznik prijme/odmitne
- Sledovani stavu custom objednavky: Requested -> Designing -> Making -> Shipped
- Custom orders nemaji standardni return policy — dohodnuta individualne

#### Best practices pro ModelPricer

| Etsy pattern | Adaptace |
|--------------|----------|
| Komunikace s poskytovatelem | In-portal messaging: dotazy k materialum, post-processingu, custom pozadavkum |
| Review system | Hodnoceni kvality tisku — fotky vytisku, text, rating po kazde objednavce |
| Favorites/Wishlist | Ulozene modely/konfigurace pro budouci tisk ("My Saved Prints") |
| Custom requests | Formulare pro specialni pozadavky (nestandardni material, velikost, povrch) |
| Collection organizing | Slozky/projekty pro organizaci modelu (podle klienta, projektu, typu) |
| Price drop alerts | Notifikace kdyz cena materialu/tisku klesne pod nastavenou hranici |
| Photo reviews | Zakaznik nahraje fotky prijateho vytisku — socialni dukaz kvality tiskarny |

#### Design a vizualni styl

- Teply, organicky design — odraz "handmade" identity (mely tony, natural barvy)
- Oranzove akcenty (#F56400) na bilem pozadi, cerne text (#222222)
- Zaoblene rohy (8-12px radius), jemne stiny (0 2px 8px rgba(0,0,0,0.06))
- Fotografie jako primarni vizualni element — velke kvalitni fotky dominuji layoutu
- Custom ikony s "rucne kreslenym" stylem (handmade feel)
- Serif heading font (Guardian/Graphik) — unikatni v e-commerce, odlisuje od generic
- Sans-serif body (Helvetica Neue) — citelnost textu
- Mobile-first — velmi dobre optimalizovano, bottom sheet modaly, swipe gesta
- Spacing: 16px base, 24px mezi sekcemi, 40px mezi major bloky

---

## 3. SaaS Portal Benchmarks

### 3.1 Stripe Dashboard

**Proc analyzovat:** Stripe je etalon SaaS dashboardu. Cisty, datove-orientovany design
ktery zvlada zobrazit slozite financni data srozumitelne. Relevantni protoze
ModelPricer admin i customer portal zpracovavaji financni data (ceny, platby, faktury).

#### Klicove design principy

**Data density bez chaosu:**
- Kazda sekce zobrazuje presne tolik dat kolik uzivatel potrebuje v danem kontextu
- Progresivni disclosure — zakladni info na karte, detail po kliknuti, full page po dalsim kliku
- Sparklines misto velkych grafu pro rychly prehled trendu na dashboardu
- Cisla s kontextem: "+12% vs last week" — ne jen "1,234" (kontextualni srovnani)
- Color coding: zelena pro pozitivni trendy, cervena pro negativni, sede pro neutralni
- Tooltips na kazdem datovem bodu — hover/focus = detail

**Layout:**
- Thin sidebar (240px, collapsible to 64px icons-only)
- Hlavni obsah = siroka content area (fluid, max-width 1200px)
- Breadcrumbs pro hlubsi navigaci (Home > Payments > pi_xxx)
- Sticky header s quick actions (Create payment, search, notifications bell)
- Footer minimalni — jen legal links a version info

**Navigace:**
- Sidebar sekce: Payments, Customers, Products, Billing, Connect, Radar, Sigma, More
- Global search (Cmd+K / Ctrl+K) — najde cokoli: payments, customers, docs, nastaveni
- Recent items — naposledy navstivene stranky (5 poslednich v sidebar)
- Keyboard shortcuts: G+P = Go to Payments, G+C = Go to Customers
- Breadcrumbs: Home > Payments > pi_3O4xxx — kazdy segment klikatelny

**Barvy a typografie:**
- Bily/svetly design s velmi jemnymi sedymi bordery (#E3E8EE)
- Minimalni pouziti barev — jen pro status, akce a trendy
- Status barvy: zelena (#3ECF8E succeeded), zluta (#FFB547 pending), cervena (#FF4757 failed)
- Font: -apple-system / system-ui stack (native feel, optimalizovano pro OS)
- Monospace pro cisla, IDs, kody (JetBrains Mono / SF Mono — dobra citelnost cislic)
- Typograficka hierarchie: 24px H1, 18px H2, 14px body, 12px captions
- Line-height: 1.5 pro body text, 1.2 pro nadpisy

**Interaktivni prvky:**
- Filtry na kazde tabulce: datum (date picker s presets), stav, castka (range), zakaznik
- Sortovani kliknutim na zahlavi sloupce (asc/desc toggle s vizualni sipkou)
- Inline akce — refund, resend receipt, export primo z radku tabulky (dropdown menu)
- Keyboard shortcuts pro power users (G+P, G+C, / pro search)
- Real-time updaty (WebSocket) — novy payment se objevi bez refresh stranky
- Copy to clipboard — kliknout na ID = zkopiruje se do schranky (s vizualni zpetnou vazbou)
- Pagination s "load more" (ne klasicke page numbers) pro plynulost

#### Best practices pro ModelPricer

| Stripe pattern | Adaptace |
|----------------|----------|
| Data density | Stat cards s sparklines pro trendove metriky (utrata, pocet objednavek, oblibeny material) |
| Clean layout | Thin sidebar + siroka content area — uz mame v admin, aplikovat i na customer portal |
| Contextual actions | Inline akce na objednavkach (detail, reorder, invoice, share, contact) |
| Global search (Cmd+K) | Quick search pres modely, objednavky, nastaveni, napovedu |
| Status colors | Konzistentni barevny system pro stavy objednavek (mapovany na --forge-status-*) |
| Monospace for numbers | `--forge-font-tech` pro ceny a IDs — uz mame v Forge! |
| Progressive disclosure | Model card -> model detail -> full 3D viewer |
| Keyboard shortcuts | Shortcuts pro power users v customer portalu |
| Copy to clipboard | Click na order ID / model ID = copy s vizualni zpetnou vazbou |

---

### 3.2 Figma

**Proc analyzovat:** Figma exceluje v project management UX a file browsing.
Relevantni protoze customer portal bude obsahovat "knihovnu modelu"
ktera je analogicka ke knihovne designovych souboru ve Figme.

#### Klicove design principy

**File browser:**
- Grid view (thumbnaily v 3-4 sloupcich) a List view (tabulka) — prepinatelne jednim klikem
- Drag & drop reorganizace — presun souboru mezi projekty/slozkami
- Dvojklik pro otevreni souboru, right-click pro kontext menu (10+ akci)
- Hledani primo v file browseru: incremental search (filter-as-you-type)
- Razeni: nazev (A-Z), datum vytvoreni, datum posledni upravy, velikost
- "Show in project" — navigace z hledani zpet ke kontextu souboru

**Project organizace:**
- Teams -> Projects -> Files hierarchie (3 urovne)
- Color-coded projekty — volitelna barva pro vizualni rozliseni
- Pinned projects — pripnute nahoru pro rychly pristup
- Recent files — posledne otevrene soubory (top-level sekce)
- Drafts — neprirazene soubory (inbox pro novy obsah)
- Archivace projektu — ne smazani, vzdy obnovitelne, skryte z hlavniho view
- Project description — volitelny popis a poznamky

**Collaboration:**
- Real-time kolaborace — multiplayer editing (kurzory kolegu viditelne)
- Sharing: invite via email, link sharing s ruznou urovni permissions
- Permissions: Can view, Can edit, Owner — granularne na soubor i projekt
- Komentare na konkretnich mistech designu — pinned comments na pixelu
- Version history s vizualnim diffem — co se zmenilo a kdo
- Branching (beta) — vetveni designu pro experimenty

**File management UX:**
- Rychle prehledy: hover preview na thumbnaily (zvetseny nahled bez otevreni)
- Batch selection: Shift+click (range), Cmd+click (individual), Cmd+A (vsechny)
- Move to project — drag & drop NEBO right-click menu -> Move to
- Duplicate, rename, delete s keyboard shortcuts (Cmd+D, Enter, Delete)
- Export menu s vicero formaty (PNG, SVG, PDF, Figma) a scales (1x, 2x, 3x)
- "Open in new tab" — otevre soubor v novem tabu prohlizece

#### Best practices pro ModelPricer

| Figma pattern | Adaptace |
|---------------|----------|
| Grid/List view toggle | Knihovna modelu: grid s 3D thumbnaily NEBO tabulkovy prehled (prepinatelny) |
| Incremental search | Hledani modelu v realnem case (filter-as-you-type bez submit) |
| Hover preview | Hover na modelu = zvetseny 3D nahled (tooltip-style popup) |
| Project hierarchy | Slozky/projekty pro organizaci modelu (2-3 urovne) |
| Batch operations | Vybrat vice modelu -> hromadna akce (smazat, presunout, objednat vsechny) |
| Recent files | "Nedavne modely" sekce na dashboardu (top 5-10) |
| Color-coded projects | Barevne oznaceni projektu/slozek pro vizualni organizaci |
| Version history | Historie verzi modelu s vizualnim diffem (bounding box zmeny, rozmery) |
| Pinned items | Pripnute modely/projekty pro rychly pristup |
| Context menu | Right-click na modelu = kompletni menu akci (10+) |

---

## 4. Spolecne UI Patterny

### 4.1 Navigace

**Sidebar vs Top navigation:**

| Pattern | Pouziti | Vyhody | Nevyhody |
|---------|---------|--------|----------|
| **Sidebar** | SaaS portaly, dashboardy | Vice polozek, jasna hierarchie, stale viditelna | Zabiara horizontalni prostor (240px) |
| **Top nav** | E-shopy, jednoduche portaly | Siroky content, znamy pattern | Omezeny pocet polozek (6-8 max) |
| **Kombinace** | Slozite portaly (Xometry, admin) | Maximum prostoru pro navigaci | Slozitejsi implementace, confusing |

**Doporuceni pro ModelPricer Customer Portal:** Thin collapsible sidebar (64px/240px).
Sidebar je standard pro SaaS portaly a ModelPricer admin uz sidebar pouziva — konzistence.
Na mobilu se sidebar skryje do off-canvas menu s hamburger ikonou.

**Breadcrumbs:**
- Pouzivat pro kazdou stranku hlubsi nez 1. uroven
- Format: `Portal > Moje modely > Projekt A > Model XYZ`
- Klikatelne — kazda uroven je link na svou stranku
- Na mobilu: jen aktualni a nadrazena uroven (ne cela cesta) — setri prostor

**Quick search / Command palette (Cmd+K):**
- Globalni hledani pres vsechny sekce portalu
- Typy vysledku: modely, objednavky, nastaveni, napoveda (s ikonou pro typ)
- Keyboard shortcut: Cmd+K (Mac), Ctrl+K (Windows)
- Recent searches — historie poslednich 10 hledani
- Fuzzy matching — tolerantni k preklepum (Levenshtein distance)
- Inline akce: "Reorder #1234" primo z vyhledavani (ne jen navigace)

**Mobilni navigace:**
- Hamburger menu s off-canvas sidebar (slide from left, 280px)
- Bottom navigation bar pro 4-5 hlavnich sekci: Dashboard, Models, Orders, Account
- Swipe gesture pro otevreni/zavreni sidebar (touch od leveho okraje)
- Sticky header: hamburger + logo + search icon + notification bell + avatar

### 4.2 Datove zobrazeni

**Cards (pro modely/projekty):**
- Grid layout: 2 sloupce na mobilu, 3 na tabletu, 4 na desktopu
- Thumbnail: 3D nahled (WebGL) nebo screenshot modelu
- Nazev modelu: truncated na 2 radky s full nazev v tooltip
- Metadata: material, rozmery (X x Y x Z mm), datum nahrani
- Status badge: zeleny "Printable", zluty "Needs Review", cerveny "Issues Found"
- Quick actions: hover = objednat, duplikovat, smazat (icon buttons)
- Hover state: zvyrazneny border (--forge-accent-primary), akce viditelnr

**Tables (pro objednavky):**
- Sortovatelne sloupce: kliknutim na header meni smer razeni (asc/desc s ikonou sipky)
- Filtrovatelne: dropdown na relevantních sloupcich (stav, material, datumove rozpeti)
- Pagination: 20 items/page nebo infinite scroll (podle preference uzivatele)
- Row selection: checkbox na kazdem radku pro batch akce
- Row actions: "..." menu na konci radku (detail, reorder, invoice, cancel)
- Responsive: pod 768px se tabulky transformuji na cards (kazdy row = card)

**Timeline (pro sledovani stavu objednavky):**
- Horizontalni na desktopu (progress bar s body na casove ose)
- Vertikalni na mobilu (kazdy krok pod sebou)
- Aktivni krok: zvyrazneny (--forge-accent-primary, vetsi tecka, bold text)
- Dokoncene kroky: checkmark ikona + presny cas (datum a hodina)
- Budouci kroky: sedive (#5C6370), outlined tecka, predpokladany cas
- Klikatelne kroky: klik = detail (co se delo v tomto kroku, kdo, kdy)

**Stat cards (pro dashboard metriky):**
- Velke cislo nahore (--forge-font-tech, 24-32px, bold)
- Label pod cislem (--forge-text-muted, 12-14px)
- Trend indikator: sipka nahoru/dolu + procento zmeny + casovy kontext ("vs last month")
- Sparkline graf (optional, 60x20px, jednobarevny)
- Pozadi: transparentni s jemnym barevnym tintem podle typu metriky
- 4 stat cards na desktopu, 2 na tabletu, 1 na mobilu (stack)

### 4.3 Empty States

**Principy:**
- NIKDY prazdna stranka — vzdy ilustrace/ikona + text + CTA
- Primarni CTA: "Nahrajte prvni model" / "Vytvorte objednavku"
- Sekundarni akce: odkaz na napovedu, tutorial, FAQ
- Ton: povzbdive, ne kriticke ("Zatim zadne modely" NE "Chyba: zadne modely")

**Priklady implementace pro ModelPricer:**

Knihovna modelu (prazdna):
```
[Ilustrace 3D modelu — line art, Forge teal akcent]

Zatim zadne modely

Nahrajte svuj prvni 3D model a behem par minut
ziskate cenovou nabidku.

[NAHRAT MODEL]  (primarni CTA, --forge-accent-primary)
Podporovane formaty: STL, OBJ, 3MF, STEP

[Nebo se podivejte jak to funguje ->]  (sekundarni link)
```

Objednavky (prazdne):
```
[Ilustrace baliku s checkmarkem]

Zatim zadne objednavky

Objednavka se objevi pote co potvrdite cenovou
nabidku a dokoncite platbu.

[PROHLIZET MODELY]  (sekundarni CTA)
```

**Onboarding v empty state:**
- Progress stepper: `1. Nahrajte model -> 2. Vyberte material -> 3. Objednejte`
- Kazdy krok klikatelny — naviguje na prislusnou stranku
- Dokoncene kroky oznaceny checkmarkem (zelene)
- Motivacni text: "Jste 2 kroky od prvni objednavky!"
- Po dokonceni vsech kroku: empty state zmizi, nahrazen skutecnymi daty

### 4.4 Mobile Responsiveness

**Breakpointy (konzistentni s Forge a existujicim admin layoutem):**

| Breakpoint | Sirka | Chovani |
|------------|-------|---------|
| Mobile S | < 375px | 1 sloupec, kompaktni layout, zkracene texty |
| Mobile | 375-640px | 1 sloupec, stack layout, bottom nav 5 items |
| Tablet | 640-1024px | 2 sloupce, sidebar collapsible (icons only) |
| Desktop | 1024-1440px | 3+ sloupce, sidebar expanded (240px) |
| Wide | > 1440px | max-width container (1200px), centered |

**Tabulky na mobilu:**
- Transformace na cards (kazdy radek = card s vertikalnim layoutem)
- Nejdulezitejsi informace nahore: nazev/cislo, stav badge, cena
- Sekundarni info pod chevronem (rozbalovaci sekce) — material, datum, parametry
- Swipe akce na kartach: swipe left = smazat/archivovat, swipe right = reorder
- Long press = context menu (alternativa k right-click na desktopu)

**Touch-friendly pravidla:**
- Minimalni velikost tapnute oblasti: 44x44px (WCAG 2.5.5 Success Criterion)
- Spacing mezi interaktivnimi elementy: min 8px (zabranuje mis-taps)
- Zadne hover-only akce — vsechno pristupne i bez hover (visible actions)
- Pull-to-refresh na seznamech (native feel na iOS/Android)
- Haptic feedback na dulezitych akcich (pres Vibration API kde podporovano)

**Sidebar na mobilu:**
- Off-canvas: slide from left (280px sirka, 300ms transition)
- Overlay na obsah: zatmaveni pozadi (rgba(0,0,0,0.5))
- Gesture: swipe from left edge (20px hot zone) pro otevreni
- X tlacitko pro zavreni (ne jen overlay klik — pristupnost)
- Focus trap — tab neopusti sidebar dokud je otevrena (a11y)

### 4.5 Loading a Error States

**Skeleton loading:**
- Pouzivat MISTO spinneru — skeleton pulsujici animace dava lepsi dojem rychlosti
- Respektovat layout — skeleton ma presny tvar skutecneho obsahu (cards, tabulky, text)
- Cards: skeleton pro thumbnail (16:9 rectangle), 2-3 radky textu (ruzne sirky), tlacitko
- Tabulky: skeleton pro 3-5 radku s pulsujicimi sloupci (seda -> svetle seda -> seda)
- Na `prefers-reduced-motion: reduce` — staticke skeleton bez animace (WCAG 2.3.3)
- Cas: skeleton se zobrazi okamzite, ne po 300ms delay

**Optimistic UI:**
- Akce se "projevi" okamzite na frontendu, server potvrdi asynchronne
- Priklad: kliknuti na "Oblibeny" -> srdce se okamzite zabarvi, server POST v pozadi
- Pokud server selze -> revert zmena + error toast s moznosti retry
- Indikator "Ukladam..." pouze pokud akce trva > 1 sekundu (ne okamzite)
- Navrh do offline queue pokud neni pripojeni

**Error states:**
- Specificke texty: "Model nebyl nalezen" NE "Neco se pokazilo" (generic = frustrace)
- Retry tlacitko — moznost zkusit znovu bez refreshe cele stranky
- Fallback obsah — ukazat posledni znama data pokud je to bezpecne (cached)
- Contact support odkaz u kritickych chyb (s predvyplnenym kontextem)
- Error kody: viditelne pro support (drobny text dole: "Error: MP-404-MODEL")

**Offline mode:**
- Banner nahore: "Jste offline — ukazujeme posledni data" (zluty, dismissable)
- Read-only rezim — prohlizeni knihovny modelu a objednavek mozne
- Queue akci — zmeny (favorites, notes) se ulozi lokalne a odeslou po pripojeni
- Vizualni indikace nesynchonizovanych dat (jiny styl — dotted border, sync ikona)
- Automaticky sync pri obnoveni pripojeni (s toast notifikaci "Data synchronized")

---

## 5. Souhrnna Tabulka Porovnani

### 5.1 Hlavni porovnani funkci

| Funkce | Shapeways | Sculpteo | i.materialise | Xometry | Protolabs | Hubs | Amazon | Shopify | Etsy |
|--------|-----------|----------|---------------|---------|-----------|------|--------|---------|------|
| **Registrace** | Email, Google | Email, Google | Email | Email, SSO | Email, SSO | Email, Google | Email, Google, Apple | Email, Social, Magic link | Email, Google, Apple, FB |
| **Dashboard** | Ne (2/5) | Ano (3/5) | Ne (2/5) | Ano (4/5) | Ano (4/5) | Ano (3/5) | Ano (3/5) | Ne (2/5) | Ne (2/5) |
| **Knihovna modelu** | Ano (4/5) | Ano (3/5) | Ano (3/5) | Ano (4/5) | Ano (4/5) | Ano (3/5) | N/A | N/A | N/A |
| **3D Viewer** | Ano (4/5) | Ano (3/5) | Ano (3/5) | Ano (3/5) | Ano (4/5) | Ano (2/5) | N/A | N/A | N/A |
| **Order tracking** | Detailni | Detailni | Zakladni | Detailni | Detailni | Zakladni | S mapou | Zakladni | Zakladni |
| **Reorder** | Ano | Ano | Ano | Ano | Ano | Ano | Ano (1-click) | Plugin | Ne |
| **Material comparison** | Zakladni | Ano (4/5) | Ano (5/5) | Ano (3/5) | Ano (3/5) | Ne | N/A | N/A | N/A |
| **DFM analyza** | Ne | Zakladni | Zakladni | Ano (5/5) | Ano (4/5) | Ne | N/A | N/A | N/A |
| **3D Repair** | Ne | Ano (4/5) | Zakladni | Ne | Ne | Ne | N/A | N/A | N/A |
| **Team accounts** | Ne | Ne | Ne | Ano (5/5) | Ano (4/5) | Ne | Ne | Ano (B2B) | Ne |
| **API pristup** | Ano | Ano | Ano (4/5) | Ano (4/5) | Ano (3/5) | Ne | N/A | Ano (5/5) | Ano (3/5) |
| **Mobile app** | Ne | Ne | Ne | Ne | Ne | Ne | Ano (5/5) | Ano (Shop) | Ano (4/5) |
| **Marketplace** | Ano (Thangs) | Ne | Ne | Ne | Ne | Ano | N/A | N/A | N/A |
| **In-portal Messaging** | Ne | Ne | Ne | Ano | Ano | Ano | Ne | Ne | Ano (5/5) |
| **Cenova transparentnost** | 3/5 | 4/5 | 5/5 | 3/5 | 3/5 | 4/5 | 5/5 | 5/5 | 4/5 |
| **Batch upload** | Ano (20) | Ano | Ne | Ano | Ano | Ne | N/A | N/A | N/A |

### 5.2 UX kvalita hodnoceni (1-5)

| Oblast | Shapeways | Sculpteo | i.materialise | Xometry | Protolabs | Hubs |
|--------|-----------|----------|---------------|---------|-----------|------|
| Onboarding | 3 | 4 | 3 | 2 | 3 | 4 |
| Navigace | 3 | 3 | 2 | 4 | 4 | 3 |
| Upload flow | 4 | 4 | 3 | 4 | 4 | 4 |
| Empty states | 2 | 3 | 2 | 3 | 3 | 3 |
| Error handling | 2 | 3 | 3 | 3 | 4 | 3 |
| Mobile UX | 2 | 2 | 2 | 2 | 3 | 3 |
| Visual design | 3 | 3 | 3 | 4 | 4 | 3 |
| Performance | 2 | 3 | 3 | 3 | 3 | 4 |
| **Prumer** | **2.6** | **3.1** | **2.6** | **3.1** | **3.5** | **3.4** |

### 5.3 Feature coverage heat map

Legenda: `+++` = nejlepsi v branzi | `++` = dobre | `+` = zakladni | `-` = chybi

| Feature | SHP | SCL | iMT | XOM | PLB | HUB | **ModelPricer (cil)** |
|---------|-----|-----|-----|-----|-----|-----|----------------------|
| Instant pricing | ++ | ++ | +++ | +++ | ++ | ++ | **+++** |
| 3D preview | +++ | ++ | ++ | ++ | ++ | + | **+++** |
| Model management | ++ | ++ | + | ++ | +++ | + | **+++** |
| Order tracking | ++ | ++ | + | ++ | +++ | + | **++** |
| Collaboration | - | - | - | +++ | +++ | - | **++** |
| API | ++ | ++ | +++ | +++ | ++ | - | **++** |
| White-label/Branding | - | - | - | - | - | - | **+++** |
| Embeddable widget | - | - | - | - | - | - | **+++** |
| Multi-tenant | - | - | - | - | - | - | **+++** |
| Mobile UX | + | + | + | + | + | + | **+++** |
| Design system | + | + | + | ++ | ++ | + | **+++** (Forge) |
| Onboarding | + | ++ | + | + | + | ++ | **+++** |

---

## 6. Doporuceni pro ModelPricer

### 6.1 Top 10 funkci k implementaci (serazene podle priority)

| # | Funkce | Priorita | Inspirace | Zduvodneni |
|---|--------|----------|-----------|------------|
| 1 | **Model Library s 3D nahledem** | P0 | Shapeways, Figma, Protolabs | Zakaznik musi videt sve modely s 3D previewem a spravovat je (slozky, tagy, vyhledavani, grid/list view). Zakladni funkce kazdeho 3D printing portalu. Bez tohoto neni portal uzitecny. |
| 2 | **Order Timeline Tracking** | P0 | Amazon, Protolabs | Vizualni timeline stavu objednavky (Upload -> Analyza -> Slicing -> Printing -> Post-processing -> QC -> Shipping -> Delivered). Data ukazuji snizeni support dotazu o 40-60% kdyz zakaznik vidi stav sam. |
| 3 | **Dashboard s metrikami** | P0 | Stripe, Xometry | Agregovany prehled: posledni objednavky, utracena castka, oblibene materialy, stat cards s trendy. Prvni vec co zakaznik vidi po prihlaseni — urcuje prvni dojem. |
| 4 | **Instant Quote flow (portal integrace)** | P0 | Xometry, i.materialise | Upload -> cena za sekundy. Transparentni rozklad ceny (material, tisk, post-processing). Uz mame zaklad v test-kalkulacce — je treba ho integrovat do portal UX. |
| 5 | **Reorder / Print Again** | P1 | Amazon, Shapeways | "Tiskni znovu" jednim klikem — zachova model, material, vsechny parametry. Dramaticky snizuje friction pro opakovane objednavky. Amazon ukazuje ze reorder drive 30%+ transakci. |
| 6 | **Material Comparison Tool** | P1 | Sculpteo, i.materialise | Side-by-side porovnani materialu s mechanickymi vlastnostmi, cenami a vizualizaci na modelu zakaznika. Pomaha s rozhodovanim a snizuje decision paralysis. |
| 7 | **In-portal Messaging** | P1 | Etsy, Xometry, Hubs | Komunikace zakaznika s tiskarnou primo v portalu. Otazky k materialu, post-processingu, custom pozadavkum. Eliminuje email ping-pong. |
| 8 | **Notifikacni system** | P1 | Amazon, Stripe | Email + in-app notifikace o zmene stavu objednavky, dokonceni tisku, odeslani. Konfigurovatelne — zakaznik si zvoli co chce dostavat. |
| 9 | **Mobile-optimized portal** | P2 | Shopify, Etsy | Mobile-first responsive design, touch-friendly, bottom nav bar. Zakaznici casto kontroluji stav objednavky na telefonu — musi to byt pohodlne. |
| 10 | **Favorites a Quick Actions** | P2 | Etsy, Figma | Oblibene modely, ulozene konfigurace, quick reorder, collections. Budovani "stickiness" — zakaznik se vraci protoze ma vse na jednom miste. |

### 6.2 Funkce kde muzeme byt LEPSI nez konkurence

ModelPricer ma unikatni pozici jako SaaS platforma pro tiskove firmy (B2B2C model).
To nam dava moznost vylepsit oblasti kde monoliticke sluzby (Shapeways, Sculpteo)
a platformy (Xometry, Protolabs) zaostdvaji:

**1. Embeddable widget + Customer Portal integrace (UNIKATNI — zadny konkurent)**
- ZADNY analyzovany konkurent nenabizi embedovatelny cenovy widget ktery se integruje
  do webu zakaznika (tiskarny) A ZAROVEN ma zakaznicky portal
- Nase unikatni vyhoda: widget na webu tiskarny -> zakaznik si vypocita cenu ->
  prihlasi se do portalu -> sleduje objednavku — vse v brandingu tiskarny
- Seamless prechod: widget na webu -> portal flow -> doruceni

**2. White-label branding (UNIKATNI — zadny konkurent)**
- Zakaznicky portal v barvach, logem a brandingem tiskarny
- Konkurenti maji fixni branding — Shapeways je vzdy Shapeways, Xometry je vzdy Xometry
- Nase tiskarny mohou mit portal ktery vypada jako jejich vlastni produkt
- Zakaznik tiskarny nevi (a nemusi vedet) ze za tim stoji ModelPricer
- Moznost customizace: barvy, logo, fonty, texty, email sablony

**3. Multi-tenant pricing transparentnost**
- Kazda tiskarna si nastavi vlastni ceny, marze, poplatky, slevy
- Zakaznik vidi cenu specificku pro JEHO tiskarnu (ne globalni cenik)
- Konkurenti maji jednu cenovou politiku pro vsechny zakazniky
- Tiskarna muze mit premium ceny pro jednoho zakaznika a volume slevy pro jineho

**4. Forge design system — distinktivni vizualni identita**
- Temne industrialni tema — zadny genericky Bootstrap/Tailwind UI look
- Teal (#00D4AA) + Orange (#FF6B35) akcenty — okamzite rozpoznatelne
- Space Grotesk/Mono typografie — technicke, ale citelne a moderni
- Zadny analyzovany konkurent v 3D printing nema takto propracovany design system
- WCAG AA compliance zabudovana do tokenu (ne pridana az nakonec)

**5. Real-time pricing s interaktivnim pruvodcem**
- Interaktivni pruvodce materialem (ne jen dropdown se jmeny materialu)
- Vizualni porovnani — render modelu v ruznych materialech (WebGL preview)
- "Doporuceny material" na zaklade geometrie a deklarovaneho ucelu
- Cena se meni v realnem case pri kazde zmene parametru (bez submit, bez reload)
- Cenova historie: "Posledne jste platili X za tento model" — budget transparency

**6. Onboarding excellence**
- Konkurenti (Xometry, Protolabs) maji slaby onboarding — predpokladaji B2B zkusenost
- Prilezitost pro ModelPricer: step-by-step pruvodce, empty states s guidance
- "Your first print" tutorial primo v portalu (interaktivni, ne video)
- Kontextove tooltips a jot-notes na klicovych mistech
- Progresivni disclosure — zacatecnik vidi jednoduchy flow, pokrocily vidi vsechny opce

**7. Offline-ready PWA**
- Zadny analyzovany konkurent nenabizi offline pristup k portalu
- Moznost prohlizet knihovnu modelu a historii objednavek offline (Service Worker cache)
- Akce se zafrontaji lokalne a odeslou po pripojeni (optimistic UI)
- Install prompt — pridani na homescreen jako nativni app

### 6.3 Common pitfalls — cemu se vyvarovat

Na zaklade analyzy vsech 9 konkurentu a jejich slabin:

**1. Information overload na dashboardu**
- Protolabs a Xometry trpi pretizenym dashboardem (prilis mnoho dat, male fonty)
- Reseni: progresivni disclosure, "Show more" pattern, personalizovany dashboard
- Pravidlo: max 4 stat cards, max 5 poslednich objednavek, 1 CTA na screen

**2. Pomaly loading (performance)**
- Shapeways a Sculpteo maji pomale stranky zejmena s velkym poctem modelu
- Reseni: virtualizovane seznamy (react-window), lazy loading 3D thumbnlu, skeleton loading
- Pravidlo: initial load < 3s, interaction response < 100ms, animation 60fps

**3. Genericky design ("Bootstrap look")**
- Vetsina konkurentu vypada jako Bootstrap/Material UI template — zadna identita
- Reseni: Forge design system, vlastni komponenty, distinktivni barevna paleta a typografie
- Pravidlo: kazdy screen projde "Anti-AI-generic checklist" (sekce 7.4)

**4. Slaba mobilni verze**
- VSICHNI 3D printing konkurenti maji suboptimalni mobilni UX (desktop-first)
- Reseni: mobile-first pristup, touch-friendly elementy, dedicated mobilni navigace
- Pravidlo: design zacina na 375px a rozsiruje se nahoru, ne naopak

**5. Prazdne empty states**
- Vetsina konkurentu ukazuje "No items" nebo prazdnou stranku bez dalsich informaci
- Reseni: ilustrace + text + CTA + onboarding stepper v kazdem empty state
- Pravidlo: zadny view nesmi byt zcela prazdny — vzdy existuje dalsi krok

**6. Chybejici komunikacni kanal**
- Zakaznik musi jit na email pro jakykoli dotaz — opusti portal, ztraci kontext
- Reseni: in-portal messaging s historii konverzace, real-time notifikace
- Pravidlo: zakaznik nikdy nemusite opustit portal pro komunikaci s tiskarnou

**7. Nekonzistentni UI napric sekcemi**
- Shapeways ma ruzne vizualni styly na ruznych strankach portalu (legacy vs nove)
- Reseni: striktni design system (Forge tokens), component library, design review pred mergem
- Pravidlo: kazda nova sekce musi pouzivat pouze existujici Forge komponenty

**8. Zastarale search (keyword only)**
- Vetsina konkurentu ma zakladni keyword search bez fuzzy matchingu a filtringu
- Reseni: Cmd+K command palette, fuzzy search, facet filtry, autosuggest
- Pravidlo: search musi najit vysledek i s preklepem (Levenshtein distance <= 2)

**9. Chybejici personalizace**
- Dashboardy nejsou prizpusobitelne — fixni layout pro vsechny uzivatele
- Reseni: konfigurovatelne stat cards, oblibene akce, priorizovane sekce, recent items
- Pravidlo: dashboard se adaptuje na chovani uzivatele (nedavne akce, caste materialy)

**10. Error states bez kontextu**
- Genericke "Something went wrong" bez vysvetleni, alternativy a akce
- Reseni: specificke texty + retry + alternativa + support link + error kod
- Pravidlo: kazdy error state musi obsahovat: co se stalo, proc, co muze uzivatel delat

### 6.4 Unikatni selling points pro ModelPricer Customer Portal

Na zaklade cele analyzy definujeme 5 klicovych USP:

**USP 1: "Your Brand, Your Portal"**
- Plne white-label customer portal v barvach a brandingu tiskarny
- Zakaznik interaguje s portlem tiskarny, ne s "ModelPricer"
- Embed widget na webu tiskarny -> seamless prechod do portalu
- Zadny analyzovany konkurent to nenabizi (verified across 6 3D printing services)
- Differentiator: tiskarna ziskava loajolitu zakazniku, ne ModelPricer

**USP 2: "From Upload to Delivery — Real-time Visibility"**
- Vizualni timeline kazdeho kroku vyroby s presnymi casovymi udaji
- Real-time notifikace (email + in-app, konfigurovatelne zakaznikem)
- QC fotky pred odeslanum — zakaznik vidi co dostane
- Transparentni pricing v kazdem kroku — zadne prekvapeni
- Lepsi nez prumer v branzi (Protolabs 4/5, ostatni 2-3/5, nas cil 5/5)

**USP 3: "Smart Material Guidance"**
- Interaktivni pruvodce materialem (ne jen dropdown menu se jmeny)
- Doporuceni materialu na zaklade geometrie a deklarovaneho ucelu dilu
- Side-by-side porovnani s vizualizaci na modelu zakaznika (WebGL render)
- Design guidelines integrovane do upload flow (ne na externi wiki)
- i.materialise ma materialy (25+), ale chybi ji interaktivni pruvodce a AI doporuceni

**USP 4: "One-Click Reprint"**
- Ulozene konfigurace: model + material + parametry + povrchova uprava + mnozstvi
- "Tiskni znovu" jednim klikem — zadne prekonfigurování
- Favorites/bookmarks pro oblibene konfigurace
- Cenova historie: "posledne jste platili X, dnes by to stalo Y"
- Amazon-level jednoduchost (1-click) aplikovana v 3D printing kontextu

**USP 5: "Mobile-First Manufacturing"**
- Plne funkcni portal na telefonu — ne "zmenseny desktop" ale dedicatedni mobilni UX
- Kontrola stavu objednavky na ceste (push notifikace, quick check)
- QC fotky v notifikaci — schvaleni jednim tapnutim (approve/reject)
- PWA s offline pristupem ke knihovne modelu a historii objednavek
- Zadny analyzovany konkurent nema mobile-first portal (vsichni desktop-first)

---

## 7. Design System Implikace pro Forge

Na zaklade analyzy konkurence a doporuceni identifikujeme co Forge design system
potrebuje rozsirit pro customer portal.

### 7.1 Nove design tokeny (navrh)

Tokeny navazuji na existujici `forge-tokens.css` a rozsiriji ho o portal-specificke hodnoty:

```css
/* ======================================================
   Customer Portal specificke tokeny
   Navazuji na existujici forge-tokens.css
   ====================================================== */
:root {
  /* ---- Status barvy pro objednavky ---- */
  --forge-status-pending: var(--forge-warning);          /* #FFB547 */
  --forge-status-processing: var(--forge-info);          /* #4DA8DA */
  --forge-status-printing: var(--forge-accent-primary);  /* #00D4AA */
  --forge-status-postprocess: var(--forge-accent-tertiary); /* #6C63FF */
  --forge-status-shipping: var(--forge-accent-secondary); /* #FF6B35 */
  --forge-status-delivered: var(--forge-success);         /* #00D4AA */
  --forge-status-cancelled: var(--forge-error);           /* #FF4757 */

  /* ---- Portal layout ---- */
  --forge-sidebar-width: 240px;
  --forge-sidebar-collapsed: 64px;
  --forge-portal-content-max: 1200px;
  --forge-portal-gutter: 24px;

  /* ---- Touch targets (WCAG 2.5.5) ---- */
  --forge-touch-min: 44px;
  --forge-touch-spacing: 8px;

  /* ---- Timeline ---- */
  --forge-timeline-dot-size: 12px;
  --forge-timeline-dot-active: 16px;
  --forge-timeline-line-width: 2px;

  /* ---- Skeleton loading ---- */
  --forge-skeleton-base: var(--forge-bg-elevated);   /* #161920 */
  --forge-skeleton-shine: var(--forge-bg-overlay);   /* #1C1F28 */
  --forge-skeleton-duration: 1.5s;
}
```

### 7.2 Nove Forge komponenty (navrh)

Komponenty serazene podle priority implementace:

| # | Komponenta | Ucel | Priorita | Inspirace |
|---|------------|------|----------|-----------|
| 1 | `ForgeTimeline` | Order tracking timeline (hor/vert, klikatelne kroky) | P0 | Amazon, Protolabs |
| 2 | `ForgeStatCard` | Dashboard metriky s trendy a sparklines | P0 | Stripe |
| 3 | `ForgeModelCard` | Karta 3D modelu s thumbnailem, metadata, quick actions | P0 | Shapeways, Figma |
| 4 | `ForgeStatusBadge` | Barevny status badge (dot + text, 7 stavu) | P0 | Stripe, Xometry |
| 5 | `ForgeSidebar` | Collapsible portal sidebar (64px/240px, mobile off-canvas) | P0 | Stripe, Protolabs |
| 6 | `ForgeEmptyState` | Ilustrace + heading + text + CTA + onboarding stepper | P1 | Figma, best practices |
| 7 | `ForgeSearchModal` | Cmd+K command palette (search, navigate, actions) | P1 | Stripe, Figma |
| 8 | `ForgeSkeletonLoader` | Skeleton loading patterns (card, table row, text) | P1 | Stripe, Shopify |
| 9 | `ForgeNotificationBell` | Notification dropdown s unread count badge | P1 | Xometry, Amazon |
| 10 | `ForgeSwipeAction` | Mobilni swipe akce na kartach (left/right) | P2 | Etsy mobile |
| 11 | `ForgeBottomNav` | Mobilni bottom navigation bar (4-5 items) | P2 | Etsy, Shopify mobile |
| 12 | `ForgeCommandPalette` | Pokrocily command palette s kategoriemi a shortcuts | P2 | Figma, Stripe |

### 7.3 Konzistence s existujicim systemem

Vsechny nove komponenty pro customer portal MUSI dodrzovat:

- **Tokeny:** Pouzivat existujici Forge CSS custom properties (`--forge-*`)
- **Grid:** 8px grid system (vsechny rozmery nasobky 8: 8, 16, 24, 32, 40, 48)
- **Kontrast:** WCAG AA minimum 4.5:1 pro text, 3:1 pro velky text a graficke elementy
- **Motion:** Respektovat `prefers-reduced-motion: reduce` — vsechny animace vypnutelne
- **Typografie heading:** `--forge-font-heading` (Space Grotesk) pro nadpisy `text-lg` a vetsi
- **Typografie tech:** `--forge-font-tech` (Space Mono) pro ceny, kody, IDs (12px labels)
- **Typografie body:** `--forge-font-body` (IBM Plex Sans) pro bezny text
- **Opt-in:** Vsechny tridy s `forge-*` prefixem — zadne globalni side effects
- **Dark theme:** Forge je inherentne dark — komponenty MUSI fungovat na tmavem pozadi
- **BEM:** Pojmenovani trid podle BEM konvence: `forge-timeline__step--active`
- **Aria:** Kompletni ARIA podpora pro screen readers a keyboard navigaci

### 7.4 Anti-AI-generic checklist pro customer portal

Pred kazdou design review portalu overit tyto body. Pokud neco selze, nedelat deploy.

```
VIZUALNI IDENTITA
[ ] Barvy odpovidaji Forge palete (teal, orange, ne random modra/zelena)
[ ] Typografie dodrzuje pravidla (heading vs tech vs body font usage)
[ ] Zadne genericke stat cards bez ucelu ("Total Users" na customer portalu = nonsense)
[ ] Zadne nahodne ikony pro dekoraci (kazda ikona musi mit informacni hodnotu)
[ ] Layout neni "Bootstrap grid" look — pouziva Forge spacing, radii, stiny

UX KVALITA
[ ] Empty states maji specificke texty, relevantni CTA a onboarding stepper
[ ] Error states maji konkretni text + retry + alternativa (ne generic "Something went wrong")
[ ] Loading states pouzivaji skeleton (ne spinner) s presnym tvarem obsahu
[ ] Animace jsou ucelne (indikuji stav/zmenu), ne dekorativni (random fade-in)
[ ] Kazda sekce odpovida na otazku "co zrychli/zlepsí zakaznikovi?"

RESPONSIVITA
[ ] Mobile verze neni "zmenseny desktop" ale self-standing UX
[ ] Touch targets min 44x44px s min 8px spacing
[ ] Tabulky se transformuji na cards na mobilu
[ ] Bottom nav na mobilu (ne hamburger pro primarne navigaci)

PRISTUPNOST
[ ] WCAG AA kontrast dodrzeny (min 4.5:1 pro text)
[ ] prefers-reduced-motion respektovano (skeleton, transitions)
[ ] Focus management — kazdy element dosazitelny klavesnici
[ ] ARIA labels na vsech interaktivnich elementech bez viditelneho textu
```

---

## Zaver

Tato analyza pokryva 9 primych a neprimych konkurentu v oblastech:
- **6 sluzeb v 3D printing industry:** Shapeways, Sculpteo, i.materialise, Xometry, Protolabs, Hubs
- **3 e-commerce / SaaS reference:** Amazon, Shopify, Etsy (+ Stripe a Figma jako SaaS benchmarky)

### Klicove poznatky

1. **Zadny konkurent nenabizi white-label customer portal** — toto je nase hlavni
   konkurencni vyhoda a klicovy differentiator
2. **Mobilni UX je slaby u vsech** 3D printing sluzeb — prilezitost pro diferenciaci
   (zadny nema mobile-first pristup)
3. **DFM analyza a material guidance** jsou nejcenonejsi funkce u zakazniku
   (Xometry a Protolabs v tomto vedou)
4. **Onboarding je systematicky podcenoyvany** — vetsina konkurentu hazi zakazniky
   do sloziteho rozhrani bez guidance
5. **Design system konzistence** je vzacna — vetsina ma nekonzistentni UI napric sekcemi
   (legacy vs nove, ruzne tymy, ruzne styly)
6. **Forge design system** nam dava zaklad pro distinktivni vizualni identitu ktera
   se odlisi od generickeho Bootstrap/Material UI looku vsech konkurentu
7. **Komunikace zakaznik-tiskarna** je nedoresena u vetsiny konkurentu —
   in-portal messaging je prilezitost

### Dalsi kroky

1. Vytvorit wireframy customer portalu na zaklade teto analyzy
2. Definovat informacni architekturu portalu (IA map — sitemap + navigacni schema)
3. Rozsirit Forge o portal-specificke komponenty (sekce 7.2)
4. Prototypovat klicove flow: upload -> quote -> order -> tracking
5. Provest uzivatelske testovani prototypu (5-8 zakazniku tiskaren)
6. Definovat API contract pro portal endpoints (backend spoluprace)

---

> **Dokument vytvoril:** mp-sr-design
> **Review:** Pending (mp-sr-frontend, mp-sr-orchestrator)
> **Navazujici dokumenty:**
> - Customer Portal wireframy (TBD)
> - Portal IA Map (TBD)
> - Forge Portal Components spec (TBD)
> - Portal API Contract (TBD, spoluprace s mp-sr-backend)
