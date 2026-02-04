# Browser Test: Widget Builder V3 — Comprehensive Test Suite

**Datum vytvoreni:** 2026-02-04
**Testovana zmena:** Widget Builder V3 implementation with multi-step preview, quick themes, undo/redo, color picker, domain whitelisting
**Dotcene stranky:**
- `/admin/widget/builder/:id` (Widget Builder)
- `/admin/widget` (Widget Management)
- `/w/:publicWidgetId` (Public Widget Page)
- `/admin` (Admin Dashboard)

**Dev URL:** http://localhost:4028

---

## KONTEXT TESTU

Widget Builder V3 je nová fullscreen editor pro konfiguraci widgetů. Klíčové komponenty:
- **Multi-step preview** (Step 1=Upload, Step 2=Config, Step 3=Summary) s mock daty
- **Quick theme switcher** (Modern Dark, Clean Light) s undo/redo
- **Color Picker** s HEX inputem a paletou
- **Public widget page** s domain whitelistingem
- **Undo/Redo system** (Ctrl+Z, Ctrl+Y)
- **Dirty tracking** a save toast

Testy pokrývají 20 kritických scénářů (P0/P1/P2).

---

## PRIPRAVA K TESTOVANI

### Pre-flight Checklist
```
1. Spusť dev server: npm run dev
2. Ověř URL odpovídá http://localhost:4028
3. Otevři DevTools: F12
4. Zjisti tenant ID: localStorage → hledej modelpricer:tenant_id
5. Ověř widget existuje: /admin/widget → měl by být alespoň 1 widget
```

### Inicializace
1. Prejdi na http://localhost:4028/admin/widget
2. Měl by se načíst "Widget Code" stránka
3. Pokud jsou widgety, vyber si jeden a poznamenej si jeho **publicId**
4. Pokud nejsou žádné widgety, vytvoř nový:
   - Klikni na zelené tlačítko "Vytvorit widget" v pravém horním rohu
   - Do modálu "Nazev" napis: "Test Widget"
   - Typ necháš na "Full Calculator"
   - Klikni "Vytvorit"
   - Počkej na toast "Widget vytvoren"
5. Klikni na ikonu "tužka" (Palette) v právě vytvořeném/vybraném widgetu
6. Měl by se otevřít Builder v nové konfiguraci (fullscreen, bez sidebar)

---

## TEST MATRIX

| # | ID | Scénář | Priorita | Status |
|----|-----|--------|----------|--------|
| 1 | P0-1 | Step 2 v builderu | P0 | TBD |
| 2 | P0-1 | Step 3 v builderu | P0 | TBD |
| 3 | P0-1 | Step 1 (Back) | P0 | TBD |
| 4 | P0-2 | Preview button → nový tab | P0 | TBD |
| 5 | P1-1 | Quick Theme Modern Dark | P1 | TBD |
| 6 | P1-1 | Quick Theme Clean Light | P1 | TBD |
| 7 | P1-1 | Undo po theme | P1 | TBD |
| 8 | P1-2 | Color Picker click | P1 | TBD |
| 9 | P1-2 | Color Picker apply | P1 | TBD |
| 10 | P1-3 | Public page header | P1 | TBD |
| 11 | P1-3 | Iframe bez headeru | P1 | TBD |
| 12 | P1-4 | Undo button | P1 | TBD |
| 13 | P1-4 | Ctrl+Z undo | P1 | TBD |
| 14 | P1-4 | Ctrl+Y redo | P1 | TBD |
| 15 | P2-1 | Name validation | P2 | TBD |
| 16 | P2-2 | Tab bar visibility | P2 | TBD |
| 17 | SAVE | Builder save | CORE | TBD |
| 18 | PERSIST | F5 persist | CORE | TBD |
| 19 | DEVICE | Device switch | DEVICE | TBD |
| 20 | RESET | Reset to original | CORE | TBD |

---

# DETAILNI TESTOVACI INSTRUKCE

## TEST #1: Step 2 v builderu (Multi-step preview)

**BUG ID:** P0-1
**Priorita:** P0 (CRITICAL)
**Expected:** Preview ukazuje konfiguraci s mock daty

### Kroky:

1. V Builder TopBar (horní pruh) najdi stepper se kroky (Step 1, Step 2, Step 3)
   - Step 1 by měl být označen jako aktivní (modře zvýrazněný)

2. V preview panelu napravo najdi sekci "Step selector" nebo navigaci
   - Měl by zde být soupis kroků nebo tlačítka se čísly

3. Klikni na Step 2 (druhý krok)
   - Počkej 500ms na animaci

4. Ověř že preview se změnil:
   - Měl by se zobrazit "Konfigurace tisku" nebo "Print Configuration" sekce
   - Měl by být viditelný form s poli (material, quality, infill, etc.)
   - **Mock data** by měla obsahovat default hodnoty (PLA, standard quality, 20% infill)

5. Zkontroluj že Step 2 je nyní aktivní (zvýrazněný)

**Cekani:** Max 2 sekundy na změnu preview
**Ocekavany vysledek:** Preview ukazuje konfiguraci s formulářem
**Chybove stavy:**
- Pokud se preview nezměnil → zkontroluj DevTools → Console (chyba?)
- Pokud se zobrazil error → zapiš ho
- Pokud Step 2 zůstal neaktivní → bug v UI state

---

## TEST #2: Step 3 v builderu (Pricing summary)

**BUG ID:** P0-1
**Priorita:** P0 (CRITICAL)
**Expected:** Preview ukazuje pricing s mock cenami

### Kroky:

1. Pokud nejsi v Builder, vraťse na /admin/widget/builder/:id
2. V topbar steperu klikni na Step 3
   - Počkej 500ms

3. Ověř že preview se změnil:
   - Měla by se zobrazit sekce "Souhrn" nebo "Summary" nebo "Pricing"
   - Měly by být viditelné:
     - Cena za tisk (s mock hodnotou)
     - Slevy aplikované (pokud jsou)
     - Celková cena

4. Zkontroluj že Step 3 je nyní aktivní

**Cekani:** Max 2 sekundy na změnu
**Ocekavany vysledek:** Preview zobrazuje pricing summary
**Poznamka:** Mock ceny mohou být např. "999 Kc" nebo "49.99 EUR"

---

## TEST #3: Step 1 (Back to upload)

**BUG ID:** P0-1
**Priorita:** P0 (CRITICAL)
**Expected:** Preview se vrátí na upload zónu

### Kroky:

1. Pokud jsi v Step 2 nebo 3, klikni na Step 1 v topbar steperu
2. Ověř že preview se vrátil:
   - Měla by se zobrazit "Upload zone" nebo "Nahraj model"
   - Měl by být viditelný drag-and-drop box nebo tlačítko "Vybrat soubor"

3. Step 1 by měl být nyní aktivní

**Cekani:** Max 1 sekunda
**Ocekavany vysledek:** Upload zone se zobrazí

---

## TEST #4: Preview button → nový tab (Public widget page)

**BUG ID:** P0-2
**Priorita:** P0 (CRITICAL)
**Expected:** Nový tab s URL /w/:publicId a dostupným widgetem

### Kroky:

1. V BuilderTopBar najdi tlačítko "Nahled" nebo "Preview" (modré tlačítko)
   - Mělo by být napravo od "Back" tlačítka

2. Klikni na "Nahled"
   - Počkej na otevření nového tabu (Chrome má Default chování - kliknutí = nový tab)

3. Nový tab by se měl otevřít s URL:
   - `http://localhost:4028/w/{publicWidgetId}`
   - Např. `http://localhost:4028/w/pub_abc123def456`

4. Na nové stránce by měl být viditelný:
   - Widget se step stepper (Step 1, Step 2, Step 3)
   - Upload zóna v Step 1
   - Header s logem/názvem (pokud je nastaven)

5. Vrať se na builder tab (Alt+Tab nebo kliknutí na builder tab)

**Cekani:** Max 3 sekundy na otevření
**Ocekavany vysledek:** Nový tab s public widget stránkou
**Chybove stavy:**
- Pokud se tab neotevře → zkontroluj zda jsi v správném kroku builder UI
- Pokud URL není správný → bug v publicId

---

## TEST #5: Quick Theme Modern Dark

**BUG ID:** P1-1
**Priorita:** P1 (HIGH)
**Expected:** Všechny barvy se změní na tmavý motiv

### Kroky:

1. V Builder Left Panel (levá strana) najdi záložku "Global"
   - Klikni na ni aby byla aktivní

2. V Global záložce najdi sekci "Quick Themes" nebo "Motivy"
   - Měly by být dostupné možnosti: "Modern Dark", "Clean Light", apod.

3. Klikni na "Modern Dark"
   - Počkej 500ms

4. Ověř změny v preview:
   - Background by měl být tmavý (popř. černý/tmavě šedý)
   - Text by měl být světlý (bílý/světle šedý)
   - Tlačítka by měla být v dark theme variantě

5. V Global záložce zkontroluj že dropdown (nebo label) ukazuje "Modern Dark"

**Cekani:** Max 1 sekunda
**Ocekavany vysledek:** Preview se změní na tmavé barvy
**Chybove stavy:**
- Pokud se barvy nezměnily → zkontroluj DevTools Network (API call?)
- Pokud dropdown stále ukazuje něco jiného → state sync bug

---

## TEST #6: Quick Theme Clean Light

**BUG ID:** P1-1
**Priorita:** P1 (HIGH)
**Expected:** Všechny barvy se změní na světlý zelený motiv

### Kroky:

1. Zůstaň v Global záložce
2. Klikni na "Clean Light"
   - Počkej 500ms

3. Ověř změny:
   - Background by měl být světlý (bílý)
   - Text by měl být tmavý
   - Akcentní barvy by měly být zelené (dle "Clean Light" definice)
   - Tlačítka by měla být zelená

4. Dropdown by měl ukazovat "Clean Light"

**Cekani:** Max 1 sekunda
**Ocekavany vysledek:** Preview zobrazuje zelený light motiv

---

## TEST #7: Undo po theme aplikaci (Ctrl+Z)

**BUG ID:** P1-1
**Priorita:** P1 (HIGH)
**Expected:** Theme se vrátí na předchozí stav jedním Ctrl+Z

### Kroky:

1. Zjisti aktuální theme (měl by být "Clean Light" z předchozího testu)
2. Stiskni Ctrl+Z (Windows) nebo Cmd+Z (Mac)
   - Počkej 300ms

3. Ověř:
   - Preview by se měl vrátit na "Modern Dark" (z TEST #5)
   - Dropdown v Global záložce by měl ukazovat "Modern Dark"

4. Stiskni Ctrl+Z znovu
   - Měl by se vrátit na stav PŘED "Modern Dark"

**Cekani:** Okamžitě (cca 100ms)
**Ocekavany vysledek:** Změny se vrátí v jednom kroku
**Poznamka:** Undo by mělo vracet CELÝ theme, ne jen jednu vlastnost

---

## TEST #8: Color Picker click — HEX input

**BUG ID:** P1-2
**Priorita:** P1 (HIGH)
**Expected:** Po kliknutí na barvu v paletě se HEX změní a gradient posune

### Kroky:

1. V Global (nebo Style) záložce najdi pole "Primary Color" (primární barva)
   - Mělo by zde být:
     - Barevný čtvereček (náhled barvy)
     - HEX inputové pole (s # prefixem)

2. Klikni na barevný čtvereček
   - Měl by se otevřít ColorPicker s paletou
   - Paleta by měla obsahovat sadu barev (předdefinované)

3. V paletě najdi modrou barvu (HEX: #3B82F6)
   - Měla by být jako jeden z kruhů/čtverců v paletě

4. Klikni na ni
   - Počkej 200ms

5. Ověř:
   - HEX input by měl ukazovat "#3B82F6" (nebo podobně)
   - Barevný čtvereček by měl být modrý
   - Gradient/slider by se měl posunout na odpovídající pozici

6. Klikni někam mimo ColorPicker aby se zavřel

**Cekani:** Instant
**Ocekavany vysledek:** HEX se změní, gradient se posune
**Chybove stavy:**
- Pokud se ColorPicker neotevře → možná chyba v onClick handleru
- Pokud se HEX změní ale preview ne → barva se neaplikuje na widget

---

## TEST #9: Color Picker apply — effect na preview

**BUG ID:** P1-2
**Priorita:** P1 (HIGH)
**Expected:** Zvolená barva se aplikuje na preview widget

### Kroky:

1. Pokud jsi z TEST #8, měl by čtvereček být modrý a HEX: #3B82F6
2. Podívej se na preview widget vpravo:
   - Primární tlačítka by měla být modrá (#3B82F6)
   - Texty/komponenty by měly být v nové barvě

3. Pro potvrzení: ručně změň HEX na jinou barvu:
   - Klikni na HEX input pole
   - Vymažeš obsah
   - Napis: "#FF0000" (červená)
   - Stiskni Enter

4. Preview by měl změnit tlačítka na červenou

**Cekani:** Instant (React re-render)
**Ocekavany vysledek:** Widget preview se změní barvou
**Poznamka:** Pokud se barva nezmění = bug v theme application

---

## TEST #10: Public page header visibility

**BUG ID:** P1-3
**Priorita:** P1 (HIGH)
**Expected:** Na /w/:publicWidgetId je viditelný header s titlem a tagline

### Kroky:

1. Vejdi na public widget page (ze TEST #4)
   - URL by měla být: http://localhost:4028/w/{publicId}

2. Nad widget stepperem by měl být "Header" s:
   - Titulek (widget name nebo business name z brandingu)
   - Tagline nebo popis (pokud je nastaven)
   - Logo (pokud je v branding)

3. Header by měl být viditelný a čitelný

**Cekani:** Max 2 sekundy
**Ocekavany vysledek:** Header je viditelný
**Chybove stavy:**
- Pokud header chybí → bug v WidgetPublicPage/WidgetHeader
- Pokud je header prázdný → branding nebyl aplikován

---

## TEST #11: Iframe bez headeru

**BUG ID:** P1-3
**Priorita:** P1 (HIGH)
**Expected:** Když je widget vložen přes iframe, header by měl být SKRYTÝ

### Kroky:

1. V /admin/widget (Widget Code) najdi widget z TEST #1
2. Klikni na ikonu "Copy" (kopírovat embed kód)
   - Toast by měl ukázat "Embed kod zkopirovany"

3. Otevři nový soubor HTML (např. v VS Code):
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>Widget Test</title>
   </head>
   <body>
     <h1>Test Embed</h1>
     <!-- Vlez sem tvůj copied embed kod -->
   </body>
   </html>
   ```

4. Vlož zkopírovaný embed kód (měl by být iframe tag)
5. Ulož soubor a otevři v prohlížeči
6. Ověř:
   - Widget se zobrazí
   - **Header by měl být SKRYTÝ** (bez titulku nad stepper)
   - Viditelné by měly být jen Steps 1, 2, 3

**Cekani:** Max 3 sekundy na load widgetu
**Ocekavany vysledek:** Widget bez headeru v iframe
**Poznamka:** Je to bezpečnostní feature - embed chce minimalizovat

---

## TEST #12: Undo button (UI button)

**BUG ID:** P1-4
**Priorita:** P1 (HIGH)
**Expected:** Kliknutí na "Undo" tlačítko vrátí poslední změnu

### Kroky:

1. V Builder TopBar (horní pruh) najdi tlačítka pro Undo/Redo
   - Měla by být vedle sebe, blízko "Save" tlačítka
   - Undo by mělo být šipka doleva/back ikona
   - Redo by mělo být šipka doprava/forward ikona

2. Změň něco v preview (např. Primary Color na #FF0000)
   - Toast "Ulozeno?" by neměl vyjít (je to jen change, ne save)

3. Klikni na Undo tlačítko
   - Počkej 200ms

4. Ověř:
   - Barva se vrátí na předchozí
   - Preview se aktualizuje
   - Undo tlačítko by teď mělo být disabled (šedé)

**Cekani:** Instant
**Ocekavany vysledek:** Změna se vrátí
**Chybove stavy:**
- Pokud Undo button je disabled = ne je v history
- Pokud se nic nevrátilo = bug v undo logic

---

## TEST #13: Ctrl+Z keyboard undo

**BUG ID:** P1-4
**Priorita:** P1 (HIGH)
**Expected:** Ctrl+Z vrací změny bez přepínání elementů

### Kroky:

1. V Global záložce klikni na Quick Theme "Modern Dark"
   - Preview se změní

2. Vyber nějaký element v Style záložce (např. "Header Title")
   - V preview by měl být zvýrazněný/focused

3. Stiskni Ctrl+Z
   - Počkej 200ms

4. Ověř:
   - Theme se vrátí (barvy se vrátí na původní)
   - **Vybraný element by měl zůstat vybraný** (ne se vrátit na něco jiného)

**Cekani:** Instant
**Ocekavany vysledek:** Undo bez side-effects
**Poznamka:** P0-1 bug byl, že undo přepínalo element selection

---

## TEST #14: Ctrl+Y redo

**BUG ID:** P1-4
**Priorita:** P1 (HIGH)
**Expected:** Po Undo, Ctrl+Y vrátí změnu zpět

### Kroky:

1. Pokud jsi z TEST #13, měl by jsi mít undo v historii
   - Theme by měl být v původním stavu (ne Modern Dark)

2. Stiskni Ctrl+Y
   - Počkej 200ms

3. Ověř:
   - Theme se vrátí na "Modern Dark" (co bylo před Undo)
   - Preview se změní barvy zpět

4. Stiskni Ctrl+Y znovu
   - Redo by mělo být nyní disabled

**Cekani:** Instant
**Ocekavany vysledek:** Redo funguje a je omezené (jen když je v history)

---

## TEST #15: Name validation — chyba (min. 2 znaky)

**BUG ID:** P2-1
**Priorita:** P2 (MEDIUM)
**Expected:** Cuando uživatel zadá 1 znak, zobrazí se chyba

### Kroky:

1. V /admin/widget klikni na "Vytvorit widget" (zelené tlačítko vpravo)
2. V modálu se zobrazí formulář "Vytvorit novy widget"
3. Do pole "Nazev" napis: "A"
   - Počkej 300ms (validation by mělo proběhnout)

4. Ověř:
   - Pod inputem by se měla zobrazit chyba v červeném textu
   - Chyba by měla znít: "Zadej nazev (min. 2 znaky)" nebo podobně
   - Tlačítko "Vytvorit" by mělo být disabled (šedé)

5. Napis: "AB"
   - Chyba by měla zmizet
   - Tlačítko "Vytvorit" by mělo být nyní enabled (modré)

**Cekani:** Max 300ms na validaci
**Ocekavany vysledek:** Chyba se zobrazí pro 1 znak
**Poznamka:** Validace běží v confirmCreate funkci

---

## TEST #16: Tab bar visibility — všechny 4 záložky

**BUG ID:** P2-2
**Priorita:** P2 (MEDIUM)
**Expected:** V /admin/widget jsou viditelné všechny 4 záložky

### Kroky:

1. Vejdi do /admin/widget
2. Vyber nějaký widget (klikni na něj vlevo)
3. Vpravo by měl být tab bar s 4 záložkami:
   - "Konfigurace" (Settings ikona)
   - "Embed kod" (Code ikona)
   - "Domeny" (Globe ikona)
   - "Nastaveni" (Cog ikona)

4. Klikni na každou záložku aby se jistil, že se obsah změní

**Cekani:** Instant
**Ocekavany vysledek:** Všechny 4 záložky jsou viditelné a fungují

---

## TEST #17: Builder save — toast notification

**BUG ID:** SAVE
**Priorita:** CORE (CRITICAL)
**Expected:** Po kliknutí Save se zobrazí toast "Ulozeno"

### Kroky:

1. V Builder TopBar změň cokoli:
   - Primary Color na #FF0000
   - Widget name na "Test Widget 2"

2. Zjisti že se widget označil jako "dirty" (měl by být jakýsi vizuální indikátor)
   - V TopBar by měla být viditelná změna nebo varování

3. Klikni na modré tlačítko "Ulozit" v TopBar
   - Počkej 1 sekunda

4. Ověř:
   - V pravém dolním rohu se zobrazí toast "Ulozeno" (zelené)
   - Toast zmizí po cca 2.5 sekundách
   - Widget by měl být označen jako "clean" (změny jsou uloženy)
   - isDirty by mělo být nyní false

**Cekani:** Max 1 sekunda
**Ocekavany vysledek:** Toast "Ulozeno" se zobrazí
**Chybove stavy:**
- Pokud se zobrazí "err" toast → zkontroluj DevTools Console

---

## TEST #18: Persistence po F5 refresh

**BUG ID:** PERSIST
**Priorita:** CORE (CRITICAL)
**Expected:** Po uložení a F5, změny přetrvávají

### Kroky:

1. Pokud jsi z TEST #17, měl bys mít uložené změny (Primary Color #FF0000)
2. Stiskni F5 aby se stránka refreshnula
   - Počkej na load (spinner "Nacitani builderu...")

3. Jakmile se Builder znovu načte, ověř:
   - Primary Color by měl být stále #FF0000 (zůstal uložený)
   - Widget name by měl být "Test Widget 2" (pokud sis to změnil)
   - isDirty by mělo být false

4. Pro dvojí ověření: Vejdi do /admin/widget a vyber stejný widget
   - Klikni na ikonku "tužka" aby se Builder otevřel znovu
   - Barva by měla zůstat #FF0000

**Cekani:** Max 3 sekundy na load Builderu
**Ocekavany vysledek:** Změny jsou trvalé
**Chybove stavy:**
- Pokud se barva vrátila na originál → storage není uložen
- Pokud se Builder crashnul → bug v load logice

---

## TEST #19: Device switch — responsivní náhled

**BUG ID:** DEVICE
**Priorita:** DEVICE (MEDIUM)
**Expected:** Na mobilní šířce (375px) se layout změní správně

### Kroky:

1. V BuilderTopBar najdi "Device mode" selector
   - Měly by být volby: "Desktop", "Tablet", "Mobile"

2. Klikni na "Mobile"
   - Preview by měl se zmenšit na 375px šířku
   - Preview rámec by měl ukazovat mobilní device

3. Přejdi do Step 2 (Print Configuration)
   - Formulář by měl být čitelný na mobilní šířce
   - Tlačítka by měla být stisknutelná
   - Bez horizontálního scrollbaru

4. Přejdi do Step 3 (Pricing)
   - Tabulka cen by měla být čitelná
   - Bez horizontal overflow

5. Přepni zpět na "Desktop"
   - Preview by se měl vrátit na full width

**Cekani:** Max 500ms na resize
**Ocekavany vysledek:** Layout se přizpůsobí šířce
**Poznamka:** Test responsivity, ne pixel-perfect

---

## TEST #20: Reset — vraťse k originálnímu stavu

**BUG ID:** RESET
**Priorita:** CORE (CRITICAL)
**Expected:** Kliknutí Reset vrátí všechny změny na posledně uložený stav

### Kroky:

1. V BuilderTopBar (nebo TopBar v /admin/widget) najdi tlačítko "Reset"
   - Mělo by být vedle "Ulozit" tlačítka nebo v menu

2. Udělej nějaké změny, které si NEBUDEŠ ukládat:
   - Změň Primary Color na #00FF00 (zelená)
   - Změň widget name na "RESET TEST"

3. Klikni na "Reset"
   - Měl by se zobrazit confirm dialog: "Vratit neulozene zmeny do posledniho ulozeneho stavu?"

4. Klikni "Ano" (nebo Yes)
   - Počkej 300ms

5. Ověř:
   - Primary Color se vrátí na původní (#FF0000 z TEST #17/18)
   - Widget name se vrátí na "Test Widget 2"
   - isDirty se změní na false
   - Preview se aktualizuje

**Cekani:** Instant
**Ocekavany vysledek:** Všechny změny jsou zahozeny
**Chybove stavy:**
- Pokud dialog se nezobrazil → možná chybí confirm
- Pokud se data nevrátila → bug v reset logice

---

# ADVANCED SCENARIOS (Volitelné)

## Domain Whitelist Test (Advanced P1-3)

**Scénář:** Widget s aktivním domainwhitelistem by měl odmítnout z jiné domény

### Kroky:
1. V /admin/widget vyber widget
2. Klikni na "Domeny" záložku
3. Přidej doménu: "example.com"
4. Aktivuj whitelist (toggle)
5. Zjisti public ID widgetu
6. Na jiné doméně (např. localhost:5000) vložíš iframe s `/w/:publicId`
7. Widget by měl zobrazit chybu: "Domena ... neni povolena"

---

## Undo/Redo History Limit (Advanced P1-4)

**Scénář:** Pokud jsou stovky změn, undo/redo by měl být omezený na N kroků

### Kroky:
1. Udělej 50+ malých změn (změň barvu, vrat se Ctrl+Z, znovu, apod.)
2. Zkus jít až na začátek Ctrl+Z
3. Zjisti, zda se zastavil na nějaké limitní pozici (např. max 20 kroků)

---

# ERROR HANDLING & EDGE CASES

## Chybový Stav: Network Error
```
Pokud se Builder neloadne (chyba v loadPricingConfigV3 atd.):
1. Zkontroluj DevTools → Network → zjisti zda je 4xx/5xx
2. Zkontroluj DevTools → Console → najdi error message
3. Zapiš stack trace
4. Zkus F5 refresh
```

## Chybový Stav: Widget Not Found
```
Pokud se Widget nenačte v /admin/widget/builder/:id:
1. Zkontroluj že :id je správný (viz URL)
2. Zkontroluj Storage (F12 → Application → LocalStorage)
   - měl by být: modelpricer:tenant_id:widgets
3. Pokud Storage je prázdný → widget nebyl vytvořen
```

## Chybový Stav: Save Failed
```
Pokud save vrátí error toast:
1. DevTools → Console → najdi error message
2. Zkontroluj že widget má všechny povinné pole (name min. 2 znaky)
3. Zkontroluj tenant ID: localStorage.getItem("modelpricer:tenant_id")
4. Pokud je problem s barva → ověř HEX formát (#RRGGBB)
```

---

# SANITY CHECKLIST (Před Done)

- [ ] Všechny kroky v TEST #1 až #20 jsou hotové
- [ ] Žádný error v DevTools Console
- [ ] Preview se zobrazuje bez chyb
- [ ] Save funguje a data se persistují
- [ ] Undo/Redo funguje bez side-effects
- [ ] Public widget page se zobrazuje
- [ ] iframe embed pracuje bez headeru
- [ ] Device switcher změní šířku
- [ ] Validace funguje (min 2 znaky)
- [ ] Toast notifikace se zobrazují

---

# FINÁLNÍ REPORT TEMPLATE

Vyplň tento template a ulož do nového souboru `REPORT_WIDGET_BUILDER_V3_[DATE].md`:

```markdown
# Browser Test Report: Widget Builder V3

**Datum testu:** [YYYY-MM-DD]
**Tester:** [Jméno]
**Build:** [Git commit hash nebo version]

## Souhrnné výsledky

| Test # | Scénář | Výsledek | Poznámka |
|--------|--------|----------|----------|
| 1 | Step 2 | PASS / FAIL | ... |
| 2 | Step 3 | PASS / FAIL | ... |
| ... | ... | ... | ... |

## Regrese / Nové bugs

- **BUG-001:** [Popis] (P0/P1/P2)
- **BUG-002:** [Popis] (P0/P1/P2)

## Poznámky
[Cokoliv dalšího...]
```

---

# REFERENCE

- **Builder Page:** `/src/pages/admin/builder/BuilderPage.jsx`
- **Widget Component:** `/src/pages/widget-kalkulacka/index.jsx`
- **Public Widget Page:** `/src/pages/widget-public/WidgetPublicPage.jsx`
- **Admin Widget:** `/src/pages/admin/AdminWidget.jsx`
- **Routes:** `/src/Routes.jsx`
- **DevTools:** F12 → Console, Network, Storage

---

**Status:** Připraveno k testování
**Počet testů:** 20 (P0: 4, P1: 8, P2: 2, CORE: 4, DEVICE: 1)
**Odhadovaný čas:** 45-60 minut pro kompletní run
