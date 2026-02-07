# Anti-AI Design Principles — ModelPricer V3

> 20+ konkretnich principu jak se vyhnout generickemu AI vzhledu webu.
> Kazdy princip obsahuje: co delat, co NEdelat, a priklad aplikace v projektu.

---

## Proc je to dulezite

AI-generovane weby maji spolecne vizualni vzory ktere zkuseni uzivatele okamzite rozpoznaji:
- Stejna modra (#2563EB nebo #3B82F6) vsude
- Dokonala symetrie vsech layoutu
- Genericke stock fotky
- "Clean and modern" bez jakekoliv osobnosti
- Stejny Inter/Poppins font
- Bile karty se stinem na bilem pozadi
- Gradient blue-purple na kazdem CTA
- ChatGPT-style texty ("Vitejte v budoucnosti...")

**Cil:** Vytvorit design ktery vypada jako by ho navrhl zkuseny designer s jasnou vizi, ne AI s defaultnimi nastavenimi.

---

## Principy

### 1. ZADNA GENERICKA MODRA

**Delej:** Zvol si primarni barvu ktera reflektuje brand a industrii. Pro 3D tisk: oranzova (PLA filament, Prusa), teal/cyan (technicka, futuristicka), nebo amber (teplo trysky).

**Nedelej:** Nepouzivej #2563EB, #3B82F6, ani zadny "default Tailwind blue" jako primarni barvu. To je prvni signal ze web generovalo AI.

**Priklad:** Primarni akcent `#FF6B35` (Nozzle Orange) nebo `#F59E0B` (Warm Amber) — okamzite odlisne od AI defaultu.

---

### 2. ASYMETRICKE LAYOUTY

**Delej:** Pouzivej mirnou asymetrii v gridech. Levy sloupec 55%, pravy 45%. Hero text zarovnany doleva, ne centrovany. Karty ruznych velikosti v gridu.

**Nedelej:** Vsechno centrovane, vsechny karty stejne velke, dokonaly 3-sloupcovy grid. AI vzdy generuje symetricke layouty.

**Priklad:** Hero sekce — nadpis vlevo (60% sirky), 3D model vpravo (40%). Feature grid: 1 velka karta + 2 male v radku misto 3 stejnych.

---

### 3. TEXTURA A NOISE

**Delej:** Pridej jemny noise overlay (2-3% opacity) na tmave plochy. Pouzij subtilni grid pattern, dot pattern, nebo paper grain na pozadi.

**Nedelej:** Ciste, sterilni jednobarevne plochy bez jakekoliv textury. AI generuje perfektne ciste pozadi.

**Priklad:** Pozadi hero sekce — `#08090C` s SVG grid patternem (tenke linky v `#1E222D`, 40px spacing). Karty s noise overlay 2%.

---

### 4. RUCNE KRESLENE PRVKY

**Delej:** Pouzij aspon 1-2 rucne kreslene elementy na stranku: podtrzeni pod nadpisem, kreslena sipka, sketch-like ikona, handwritten font pro 1 slovo.

**Nedelej:** Vsechno dokonale geometricke a strojove presne. AI nikdy nepridava nedokonalosti.

**Priklad:** Pod nadpisem "Jak to funguje" — SVG rucne kreslene podtrzeni (wavy line, ne rovny). Nebo sketch-style sipky mezi kroky wizardu.

---

### 5. NESTANDARTNI SPACING

**Delej:** Pouzivej neocekavane hodnoty spacingu: 18px, 22px, 28px, 44px, 72px. Ruzne paddingy pro ruzne sekce — ne vsude stejne.

**Nedelej:** Striktni 4px grid (8, 16, 24, 32, 48, 64). AI vzdy pouziva standard spacing scale.

**Priklad:** Hero padding: 88px top, 64px bottom (asymetricke). Feature karty: padding 28px (ne 24 nebo 32).

---

### 6. MONOSPACE TECHNICKE AKCENTY

**Delej:** Pouzij monospace font pro ceny, technicke parametry, cisla objednavek, rozmery. To da webu technicke raz spojeny s 3D tiskem.

**Nedelej:** Vsechno v jednom fontu. AI pouziva Inter/Poppins na vsechno.

**Priklad:** Cena "192,48 Kc" v `JetBrains Mono 700`. Cislo objednavky "#MP-2024-0042" v monospace. Paramentry "0.2mm | 20% infill" v monospace.

---

### 7. MIKROKOPIE S OSOBNOSTI

**Delej:** Pis microcopy s lidskym hlasem. "Neco se pokazilo, zkuste to prosim znovu" misto "Error 500". "Jdeme na to!" misto "Submit". "Tadaa! Hotovo." misto "Success".

**Nedelej:** Genericke, formalni texty. AI generuje sterilni copie jako "Your request has been processed successfully".

**Priklad:** Upload zona: "Hodte sem svuj 3D model — zvladneme STL, 3MF i OBJ" misto "Upload your file here". Prazdny stav: "Zadne objednavky zatim. Cas to zmenit!" misto "No orders found".

---

### 8. NOSTALGICKY PRVEK

**Delej:** Pridej 1 nostalgicky/retro detail na stranku: pixel art ikona, custom cursor pri hoveru, vintage badge "Beta", ASCII art v konzoli, retro progress bar.

**Nedelej:** Cely retro design. Jeden detail staci k dodani osobnosti.

**Priklad:** V patice — maly "Craftde with [pixel srdce] in Prague" text. Nebo ASCII ModelPricer logo v konzoli prohlizece.

---

### 9. KONTRASTNI TYPOGRAFIE

**Delej:** Kombinuj vyrazne odlisne fonty — serif heading + sans-serif body, nebo heavy heading + light body. Vyrazny kontrast ve vahach (900 vs 300).

**Nedelej:** Jeden font, jedna vaha vsude. AI pouziva Inter 400/500/600 — zadny drama.

**Priklad Var. A:** JetBrains Mono 700 headings + Inter 400 body. **Var. B:** Instrument Serif 400 headings + Satoshi 400 body.

---

### 10. BARVY Z 3D TISKU

**Delej:** Inspiruj se realnymy barvami z 3D tiskarenskeho sveta: Prusa oranzova, filament barvy (biela, cerna, seda, modra, cervena, zelena), rozehavena tryska, svitici display, tmava komora tiskarny.

**Nedelej:** Genericke tech barvy (modra, fialova, tyrkysova). To nema zadnou spojitost s produktem.

**Priklad:** Primary accent = Prusa-style oranzova `#FF6B35`. Success = filament zelena `#00D4AA`. Error = stop cervena tiskarny `#FF4757`.

---

### 11. THIN-LINE ESTETIKA

**Delej:** Pouzivej tenke 1px linky pro oddeleni sekci, bordery karet, table separatory. Jemne, ne dominantni.

**Nedelej:** Tlusti 2-4px bordery nebo silne stiny pro kazdy element. AI casto prehani bordery a stiny.

**Priklad:** Sidebar navigace — oddeleni skupin jen 1px horizontal linka v `#1E222D`. Tabulky — jen spodni 1px border na radcich.

---

### 12. TECHNICKE DIAGRAMY ESTETIKA

**Delej:** Pro 3D tisk projekt pridej vizualni prvky pripominajici blueprint: tenke grid linky v pozadi, merici znacky u rozmeru, schema-style flow diagramy.

**Nedelej:** Genericke ilustrace. Blueprint/technical drawing styl je unikatni a spojeny s vyrobou.

**Priklad:** Pozadi "Jak to funguje" sekce — subtilni blueprint grid. U rozmeru modelu: merici znacky s rozmerovou linkou.

---

### 13. ANIMACE S UCELEM

**Delej:** Kazda animace MUSI mit funkci: ukazat ze neco funguje (loading), navigest pozornost (highlight), potvrdit akci (success), nebo vysvetlit vztah (transition).

**Nedelej:** Animace pro efekt — random floating elements, bezucelne parallax, auto-play videa. AI casto pridava animace ktere nic nedelaji.

**Priklad:** Po pridani modelu — karta se modelu jemne "posune dovnitr" (slide-in 200ms). Cena se "odflipuje" pri prepocitani (flip animace). Sidebar collapse — smooth width transition, ne instant.

---

### 14. REALNE FOTKY MISTO STOCKU

**Delej:** Pouzij realne fotky: 3D tiskarny v akci, hotove vyrobky, filament civky, tiskovy proces. Idealne vlastni fotky nebo unikatni vizualy.

**Nedelej:** AI-generovane stock fotky lidi u pocitacu, genericke ilustrace. Ty jsou okamzite rozpoznatelne.

**Priklad:** Na home page — fotka tiskarny v akci s rozpracovanym vytiskem. V sekcni "O nas" — realne foto tymu/dily.

---

### 15. GRADIENT S OSOBNOSTI

**Delej:** Pouzij gradienty s noise overlayem, nestandartni uhly (135deg, 160deg), a barvy ktere nejsou typicky AI (ne blue→purple). Radial gradienty, mesh gradienty.

**Nedelej:** `linear-gradient(to right, #4F46E5, #7C3AED)` — to je doslova AI default gradient.

**Priklad:** `linear-gradient(135deg, #FF6B35 0%, #FF4757 100%)` s 3% noise overlay. Nebo radial gradient z centra karty.

---

### 16. NEOCEKAVANE HOVER EFEKTY

**Delej:** Hover efekty ktere prekvapi: zmena border-radius (8px → 12px), barevny shift, rotace 1-2deg, border zmeni barvu, ikona se animuje.

**Nedelej:** Jen opacity 0.8 nebo scale 1.05 na hoveru. To je AI default.

**Priklad:** Feature karta hover — border zmeni barvu z `#1E222D` na `#00D4AA`, ikona v karte se otoci o 15deg. Sidebar item hover — jemny slide vpravo o 4px.

---

### 17. ORGANICKE TVARY

**Delej:** Pouzij SVG blob dividers mezi sekcemi, rounded corners s velkym radiusem (20-24px) na hero karty, organicke background shapes.

**Nedelej:** Rovne horizontalni cary vsude. Vsechny sekce striktne obdelnikove.

**Priklad:** Mezi hero a features — SVG wave divider v barve pozadi features. Hero karta s border-radius 20px.

---

### 18. VLASTNI IKONOGRAFIE

**Delej:** Pro klicove akce vytvor custom SVG ikony nebo pouzij ikonovy set ktery neni Lucide/HeroIcons (ty jsou default AI). Minimalne custom-styluj 5-10 klicovych ikon.

**Nedelej:** Default Lucide ikony na vsechno. AI vzdy pouziva Lucide nebo HeroIcons protoze je to nejjednodussi.

**Priklad:** Custom ikony pro: Upload 3D modelu (krychle se sipkou), tiskarna (stylizovana FDM tiskarna), filament (civka), kvalita (vrstvy), material (chemicka struktura).

---

### 19. DATOVY STORYTELLING

**Delej:** Cisla s kontextem: "12 objednavek (+23% vs minuly tyden)", "45 230 Kc celkovy obrat", "3.2s prumerna doba kalkulace". Trendove sipky, sparkline mini-grafy.

**Nedelej:** Izolovaná cisla bez kontextu. AI generuje "Orders: 12" bez dalsiho vysvetleni.

**Priklad:** Dashboard stat karta — velke cislo "12", pod nim "+23% ↑" v teal barve, a sparkline graf poslednic 7 dni v pozadi karty.

---

### 20. BREATHING ANIMATIONS

**Delej:** Pro dulezite prvky pouzij "dychani" animaci — jemne scale 1.0 → 1.02 → 1.0, nebo opacity 1.0 → 0.8 → 1.0, s dlouhym cyklem (3-4s). Jen na 1-2 prvcich na stranku.

**Nedelej:** Staticke prvky bez zivota, nebo naopak vsechno animovane. Rovnovaha.

**Priklad:** CTA tlacitko na hero — jemne "dycha" (scale pulse 3s). Oranzova tecka u "Live" statusu — pulsuje.

---

### 21. KONTEXT-SPECIFICKE PRAZDNE STAVY

**Delej:** Kazdy prazdny stav ma vlastni ilustraci a zpravou relevantni ke kontextu. Ne genericke "No data found".

**Nedelej:** Stejny prazdny stav vsude. AI pouziva stejny prazdny stav pro vsechno.

**Priklad:** Prazdne objednavky: Ilustrace prazdneho tiskoveho stolku + "Zadne objednavky zatim. Podelte se o svuj widget a zakaznici prijdou!" Prazdne materialy: Ilustrace prazdne civky + "Pridejte svuj prvni material a zacnete kalkulovat."

---

### 22. MICRO-ZVUKY (VOLITELNE)

**Delej:** Jemne zvukove efekty pri klicovych akcich: klik na CTA, uspesny upload, chyba. Vzdy s moznosti vypnout.

**Nedelej:** Zvuky bez moznosti vypnout. Automaticke prehravani.

**Priklad:** Uspesny upload souboru — jemne "ding". Chyba — kratke "tock". Toggle — "click".

---

### 23. TYPOGRAFICKY RHYTHM

**Delej:** Vytvor jasny vizualni rytmus strany — velky nadpis, mensi text, vizual, velky nadpis, mensi text... Stridani velikosti a prvku.

**Nedelej:** Monototorni rozlozeni — vsechny sekce vypadaji stejne (nadpis + 3 karty, nadpis + 3 karty, nadpis + 3 karty).

**Priklad:** Home page: VELKY hero → male feature karty → STREDNI "jak to funguje" → VELKA cenova tabulka → male FAQ → VELKE CTA.

---

### 24. DARK THEME JAKO DEFAULT

**Delej:** Pouzij tmavy theme jako primarni — tmave pozadi, svetly text. To je okamzite odlisne od 90% AI webu ktere jsou bile.

**Nedelej:** Svetly theme s modrou. To je AI default.

**Priklad:** Page background `#08090C`, card background `#0F1117`, primary text `#E8ECF4`. Svetle akcenty na tmavem pozadi.

---

### 25. JEDNODUCHA, NE PRAZDNA

**Delej:** Minimalismu dosahni pridanim "necem" do prazdnych mist — jemny pattern, gradient, textura. Prazdna mista vypadaji nedokoncene.

**Nedelej:** Prazdna bila mista (white space overuse). AI casto necha velke prazdne bile oblasti.

**Priklad:** Sidebar prazdny prostor — jemny dot pattern. Hero pozadi — blueprint grid. Admin obsah pozadi — subtle noise.

---

## Checklist pro review designu

Pri kazdem novem designu zkontroluj:

- [ ] Primarni barva NENI genericka modra
- [ ] Nadpisy pouzivaji jiny font nez body text
- [ ] Aspon 1 asymetricky layout na stranku
- [ ] Ceny a technicke udaje v monospace fontu
- [ ] Zadne AI stock fotky
- [ ] Prazdne stavy maji kontext-specificky obsah
- [ ] Mikrokopie ma lidsky hlas (ne formalni)
- [ ] Animace maji uceel (ne dekorace)
- [ ] Hover efekty jsou zajimave (ne jen opacity)
- [ ] Pozadi neni sterilne ciste (textura/pattern)
- [ ] Tmavy theme jako zaklad
- [ ] Barvy souvisi s brandem/industrií (3D tisk)
- [ ] Spacing neni striktne z 4px gridu
- [ ] Aspon 1 nostalgicky/handmade detail
- [ ] Gradient neni blue→purple

---

## Zdroje a inspirace

- **2026 Web Design Trends:** Organic layouts, human-first design, kinetic typography, purposeful motion
- **Anti-generic principy:** Rucne kreslene prvky, textura, asymetrie, neocekavane barvy
- **Dark theme best practices:** Material Design elevation system, WCAG AA kontrast, noise overlay
- **3D printing UI inspirace:** PrusaSlicer, Cura, Bambu Studio — technicke, precizni, tmave
- **Premium SaaS reference:** Linear, Vercel, Raycast — tmave, ciste, s osobnosti
- **Kontra Agency 2026:** Expressive typography, custom illustration systems, dark mode separate palettes
- **Elementor 2026:** Organic layouts, purposeful motion, accessibility-first
- **Graphic Design Junction 2026:** Hand-drawn details, imperfect photography, spaceship manual aesthetic
