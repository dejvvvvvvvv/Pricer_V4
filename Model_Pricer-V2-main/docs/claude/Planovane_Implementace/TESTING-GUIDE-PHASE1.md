# Navod na testovani Phase 1 uprav — krok po kroku

> **Verze:** 2026-02-07
> **Scope:** S01 (Bug Fixes) + S02 (Checkout) + S05 (Volume Discounts) + Widget Sync + Builder Fix

---

## 0) Predpoklady a spusteni

### 0.1 Spusteni backendu (potreba pro slicing)

1. Otevri terminal
2. Naviguj do slozky backendu:
   ```
   cd Model_Pricer-V2-main/backend-local
   ```
3. Nainstaluj zavislosti (pokud jeste nejsou):
   ```
   npm install
   ```
4. Spust backend:
   ```
   npm run dev
   ```
5. Over ze v terminalu vidis: `Server listening on port 3001`

### 0.2 Spusteni frontendu

1. Otevri DRUHY terminal
2. Naviguj do hlavni slozky:
   ```
   cd Model_Pricer-V2-main
   ```
3. Nainstaluj zavislosti (pokud jeste nejsou):
   ```
   npm install
   ```
4. Spust dev server:
   ```
   npm run dev
   ```
5. Over ze v terminalu vidis: `Local: http://localhost:4028/`

### 0.3 Otevri prohlizec

1. Otevri Chrome (doporuceno)
2. Otevri DevTools: `F12` nebo `Ctrl+Shift+I`
3. Prepni na tab **Console** — sleduj cervene chyby
4. Naviguj na `http://localhost:4028/`

---

## 1) TEST S01 — Bug Fixes

### 1.1 Bug 1: Auto-rekalkulace po zmene konfigurace

**Co testujeme:** Po zmene parametru tisku (material, kvalita, infill, supports) se cena automaticky prepocita bez nutnosti klikat "Prepocitat".

**Kroky:**

1. Naviguj na `http://localhost:4028/test-kalkulacka`
2. Nahraj libovolny `.stl` soubor (napr. testovaci kostku)
3. Pockej az se soubor nahraje a zobrazi se konfigurace (krok 2)
4. Klikni na **"Spocitat cenu"** — pockej na vysledek slicingu
5. Po dokonceni slicingu zmen **material** (napr. z PLA na PETG)
6. **Ocekavany vysledek:**
   - Stary vysledek se smaze (status se zmeni na "pending")
   - Po cca 0.5 sekundy se AUTOMATICKY spusti novy slicing
   - V pravem panelu se zobrazi nacitaci animace
   - Po dokonceni se objevi novy vysledek s novou cenou
7. Zmen **kvalitu vrstvy** (napr. ze Standardni na Jemny)
8. **Ocekavany vysledek:** Stejna automaticka rekalkulace jako v kroku 6
9. Pohni sliderem **Vypln** (infill)
10. **Ocekavany vysledek:** Rekalkulace se spusti s mirnym zpozdenim (~0.8s) — slider ma delsi debounce
11. Zaskrtni/odskrtni **Podpory**
12. **Ocekavany vysledek:** Automaticka rekalkulace

**Kontrola v DevTools Console:** Zadne cervene chyby.

---

### 1.2 Bug 2: Per-model preset selection

**Co testujeme:** Kazdy nahrary model ma VLASTNI preset, ne sdileny.

**Kroky:**

1. Naviguj na `http://localhost:4028/test-kalkulacka`
2. Nahraj **DVA ruzne** `.stl` soubory
3. Pockej az se oba nahraji
4. Vyber **prvni model** v seznamu vlevo
5. V sekci "Preset pro slicovani" vyber preset (napr. "Vysoka kvalita")
6. Vyber **druhy model** v seznamu vlevo
7. **Ocekavany vysledek:** Druhy model MA JINY preset nez prvni (bud defaultni nebo zadny)
8. Nastav druhemu modelu jiny preset (napr. "Rychly tisk")
9. Prepni zpet na **prvni model**
10. **Ocekavany vysledek:** Prvni model STALE MA svuj puvodni preset ("Vysoka kvalita")

**FAIL indikator:** Oba modely ukazuji vzdy stejny preset = bug neni opraven.

---

### 1.3 Bug 3: Preset retry pri selhani

**Co testujeme:** Pokud se presety nepodarilo nacist, zobrazi se retry tlacitko.

**Kroky (simulace chyby):**

1. **Zastav backend** (Ctrl+C v backend terminalu)
2. Naviguj na `http://localhost:4028/test-kalkulacka`
3. Nahraj `.stl` soubor
4. **Ocekavany vysledek:** V sekci "Preset pro slicovani" se zobrazi cerveny banner:
   - Text: "Presety se nepodarilo nacist — pouzivam default profil."
   - **Tlacitko "Zkusit znovu"** na prave strane banneru
5. **Spust backend znovu** (`npm run dev` v backend terminalu)
6. Klikni na **"Zkusit znovu"**
7. **Ocekavany vysledek:** Presety se nacitou a zobrazi se dropdown s dostupnymi presety

**FAIL indikator:** Chybi "Zkusit znovu" tlacitko, nebo po kliknuti nic neudela.

---

### 1.4 Bug 4: NaN safety v results display

**Co testujeme:** Pokud slicing vrati neplatna data (null, undefined, NaN), zobrazi se "—" misto NaN.

**Kroky:**

1. Naviguj na `http://localhost:4028/test-kalkulacka`
2. Nahraj `.stl` soubor
3. Klikni na "Spocitat cenu"
4. Po dokonceni slicingu zkontroluj vysledky:
   - Cas tisku: musi ukazovat format `Xh Ymin` nebo "—" (NIKDY "NaNh NaNmin")
   - Hmotnost: musi ukazovat `Xg` nebo "—" (NIKDY "NaNg")
   - Vrstvy: musi ukazovat cislo nebo "—" (NIKDY "NaN" nebo prazdno)
   - Cena v breakdown: musi ukazovat `X,XX CZK` nebo "0,00 CZK" (NIKDY "NaN CZK")
5. Zkontroluj i sekci "Cenovy breakdown" — vsechny radky musi mit platne cislo

**Kontrola v DevTools Console:** Zadne `NaN` warningy, zadne cervene chyby.

---

## 2) TEST S02 — Checkout Flow

### 2.1 Kompletni checkout cesta

**Co testujeme:** 5-krokovy wizard: Upload > Konfigurace > Cena > Objednavka > Potvrzeni.

**Kroky:**

1. Naviguj na `http://localhost:4028/test-kalkulacka`
2. **KROK 1 — Upload:**
   - Nahraj `.stl` soubor
   - Over ze se soubor objevi v seznamu
   - Over ze step indikator ukazuje krok 1 jako aktivni
3. **KROK 2 — Konfigurace:**
   - Klikni **"Dalsi krok"** nebo pockej na automaticky prechod
   - Nastav parametry tisku (material, kvalita, mnozstvi)
   - Over ze step indikator ukazuje krok 2
4. **KROK 3 — Cena:**
   - Klikni **"Dalsi krok"**
   - Spust slicing kliknutim na "Spocitat cenu" (pokud se nespustil automaticky)
   - Pockej na vysledek — musi se zobrazit cenovy breakdown
   - Over ze dole je tlacitko **"Prejit k objednavce"**
   - Over ze step indikator ukazuje krok 3
5. **KROK 4 — Objednavka (Checkout):**
   - Klikni **"Prejit k objednavce"**
   - **Ocekavany vysledek:** Zobrazi se formular s polozkami:
     - Jmeno (povinne)
     - Email (povinne)
     - Telefon (nepovinne)
     - Firma (nepovinne)
     - Poznamka (nepovinne)
     - GDPR souhlas (povinny checkbox)
   - Na prave strane (desktop) nebo dole (mobil): souhrn objednavky s celkovou cenou
   - Over ze step indikator ukazuje krok 4

6. Pokracuj na **2.2 Validace formulare** nize.

---

### 2.2 Validace formulare

**Co testujeme:** Formular spravne validuje vsechna pole.

**Kroky (stale na kroku 4):**

1. **Prazdny formular:** Klikni "Odeslat objednavku" BEZ vyplneni
   - **Ocekavany vysledek:** Pod polem Jmeno, Email a GDPR se objevi cervene chybove hlasky
   - Formular se NEODESLE

2. **Kratke jmeno:** Zadej do pole Jmeno jen "A" (1 znak)
   - Klikni nekam jinam (onBlur validace)
   - **Ocekavany vysledek:** Chybova hlaska "Jmeno musi mit alespon 2 znaky" (nebo EN ekvivalent)

3. **Neplatny email:** Zadej "abc" do pole Email
   - Klikni nekam jinam
   - **Ocekavany vysledek:** Chybova hlaska "Neplatny format emailu"

4. **GDPR nezaskrtnuty:** Vyplni vsechna povinne pole spravne ALE nechej GDPR checkbox nezaskrtnuty
   - Klikni "Odeslat objednavku"
   - **Ocekavany vysledek:** Chybova hlaska u GDPR checkboxu

5. **Platny formular:** Vyplni:
   - Jmeno: `Test Uzivatel`
   - Email: `test@example.com`
   - Telefon: `+420123456789` (nepovinne, ale vyplnte pro test)
   - Firma: `Test s.r.o.` (nepovinne)
   - Poznamka: `Testovaci objednavka`
   - GDPR: **ZASKRTNI**
6. Klikni **"Odeslat objednavku"**

---

### 2.3 Potvrzeni objednavky (krok 5)

**Co testujeme:** Po odeslani se zobrazi potvrzovaci stranka.

**Kroky (po odeslani formulare):**

1. **Ocekavany vysledek po kliknuti "Odeslat objednavku":**
   - Zelena ikonka s fajtfkem (CheckCircle)
   - Nadpis: **"Objednavka odeslana!"**
   - Text: "Dekujeme za vasi objednavku. Brzy vas budeme kontaktovat."
   - **Cislo objednavky** (format: napr. `ORD-1738...`)
   - Souhrn objednavky (seznam modelu, celkova cena)
   - Kontaktni udaje (jmeno, email, telefon, firma)
   - Tlacitko **"Nova objednavka"**
   - Step indikator ukazuje krok 5

2. Klikni **"Nova objednavka"**
3. **Ocekavany vysledek:** Kalkulacka se resetuje na krok 1 (upload) — prazdna, pripravena na novy upload

---

### 2.4 Navigace zpet

**Co testujeme:** Tlacitko "Zpet" funguje v kazdem kroku.

**Kroky:**

1. Projdi kroky 1-4 (upload, konfigurace, cena, objednavka)
2. Na kroku 4 (checkout) klikni **"Zpet na souhrn"**
3. **Ocekavany vysledek:** Vrati se na krok 3 (cenovy souhrn)
4. Na kroku 3 klikni **"Zpet"** (sipka vlevo)
5. **Ocekavany vysledek:** Vrati se na krok 2 (konfigurace)

---

### 2.5 Overeni ulozeni objednavky do localStorage

**Co testujeme:** Objednavka se ulozi do tenant-scoped localStorage.

**Kroky:**

1. Projdi celou cestu (upload -> slicing -> checkout -> odeslani)
2. Otevri DevTools > tab **Application** > **Local Storage** > `http://localhost:4028`
3. Hledej klic obsahujici `orders`
4. **Ocekavany vysledek:** Existuje zaznam s objednavkou obsahujici:
   - `customer_snapshot` s vyplnenymi udaji (name, email, phone, company, note)
   - `models` s konfiguraci a cenami
   - `totals_snapshot` s celkovou cenou
   - `status: "NEW"`
   - `gdpr_consent_at` s casovym razitkem

---

## 3) TEST S05 — Volume Discounts

### 3.1 Admin UI — nastaveni volume discounts

**Co testujeme:** Admin muze nakonfigurovat mnozstevni slevy.

**Kroky:**

1. Naviguj na `http://localhost:4028/admin/pricing`
2. Scrollni dolu — hledej sekci **"Mnozstevni slevy"** (Volume Discounts)
3. **Ocekavany vysledek:** Collapsible sekce s:
   - Toggle "Zapnout mnozstevni slevy" (defaultne VYP)
   - Kdyz je toggle VYPLY, zbytek je skryty

4. **Zapni** toggle "Zapnout mnozstevni slevy"
5. **Ocekavany vysledek:** Objevi se:
   - **Typ slevy:** radio/select — "Procentualni" nebo "Fixni cena za kus"
   - **Rozsah:** radio/select — "Za model" nebo "Za objednavku"
   - **Tabulka tieru** (prazdna nebo s defaultem)
   - Tlacitko **"Pridat uroven"**

6. Vyber **Procentualni** a **Za model**
7. Klikni **"Pridat uroven"**
8. Vyplni:
   - Min. mnozstvi: `5`
   - Hodnota: `10` (= 10% sleva od 5 kusu)
   - Popisek: `Mala sleva` (nepovinne)
9. Pridej dalsi uroven:
   - Min. mnozstvi: `10`
   - Hodnota: `20` (= 20% sleva od 10 kusu)
   - Popisek: `Velka sleva`
10. Klikni **"Ulozit zmeny"** (hlavni save tlacitko stranky)
11. **Ocekavany vysledek:** Konfigurace se ulozi (success feedback)
12. **Obnov stranku** (F5) a over ze nastaveni prezilo reload

---

### 3.2 Volume discount v kalkulacce — procentualni mod

**Co testujeme:** Mnozstevni sleva se projevuje v cenove kalkulaci.

**Predpoklad:** Nastaveno dle kroku 3.1 (procentualni, za model, 5ks=10%, 10ks=20%).

**Kroky:**

1. Naviguj na `http://localhost:4028/test-kalkulacka`
2. Nahraj `.stl` soubor
3. V konfiguraci nastav **Mnozstvi = 1**
4. Klikni "Spocitat cenu"
5. Pockej na vysledek — zapamatuj si celkovou cenu (napr. 150 CZK)
6. **Ocekavany vysledek:** V breakdown NENI radek "Mnozstevni sleva" (1 kus = pod minimem 5)

7. Zmen **Mnozstvi na 5**
8. Pockej na rekalkulaci (nebo klikni "Prepocitat")
9. **Ocekavany vysledek:**
   - V breakdown se OBJEVI zeleny blok **"Mnozstevni sleva (%)"**
   - Ukazuje usporou (napr. "- 75,00 CZK")
   - Pod tim: `5+ ks: -10%`
   - Celkova cena je NIZSI nez 5 * puvodni cena za kus

10. Zmen **Mnozstvi na 10**
11. Pockej na rekalkulaci
12. **Ocekavany vysledek:**
    - Mnozstevni sleva je VETSI (20% misto 10%)
    - Pod tim: `10+ ks: -20%`
    - Celkova cena je jeste nizsi

13. Zmen **Mnozstvi zpet na 1**
14. **Ocekavany vysledek:** Mnozstevni sleva ZMIZI z breakdown

---

### 3.3 Volume discount — fixed_price mod

**Co testujeme:** Fixni cena za kus misto procent.

**Kroky:**

1. Naviguj na `http://localhost:4028/admin/pricing`
2. V sekci "Mnozstevni slevy" zmen **Typ slevy** na **"Fixni cena za kus"**
3. Nastav tier:
   - Min. mnozstvi: `3`
   - Hodnota: `89` (= 89 CZK za kus od 3 kusu)
4. Uloz
5. Naviguj na `http://localhost:4028/test-kalkulacka`
6. Nahraj `.stl`, nastav mnozstvi na **3**, spust slicing
7. **Ocekavany vysledek:**
   - V breakdown: "Mnozstevni sleva (fixni)"
   - `3+ ks: 89,00 CZK/ks`
   - Celkova cena = 3 * 89 = 267 CZK (priblizne — zavisi na fees/markup)

---

### 3.4 Volume discount — per_order scope

**Co testujeme:** Sleva se pocita z celkoveho poctu kusu VSECH modelu.

**Kroky:**

1. V admin/pricing nastav:
   - Typ: Procentualni
   - Rozsah: **Za objednavku**
   - Tier: 5 ks = 15%
2. Uloz
3. Naviguj na test-kalkulacka
4. Nahraj **DVA** `.stl` soubory
5. Nastav prvnimu modelu **Mnozstvi = 3**
6. Nastav druhemu modelu **Mnozstvi = 3**
7. Spust slicing pro oba (tlacitko "Prepocitat vse")
8. **Ocekavany vysledek:**
   - Celkovy pocet = 3 + 3 = 6 kusu -> prekracuje tier 5 ks
   - V breakdown se objevi mnozstevni sleva pro OBA modely
   - Sleva je 15%

9. Zmen prvnimu modelu mnozstvi na **1** (celkem 1 + 3 = 4)
10. **Ocekavany vysledek:** Sleva ZMIZI (4 < 5 = pod minimem tieru)

---

## 4) TEST Widget-kalkulacka Sync

### 4.1 Widget — NaN safety (Bug 4 port)

**Predpoklad:** Musite mit vytvoreny widget v admin panelu.

**Kroky:**

1. Naviguj na `http://localhost:4028/admin/widget`
2. Pokud nemate widget, vytvorte novy
3. Otevrete widget v novem tabu (pouzijte embed URL nebo `/w/:publicWidgetId`)
4. Alternativne: naviguj na widget builder a zkontroluj preview
5. Nahrajte model a spuste slicing
6. **Ocekavany vysledek:** Vysledky ukazuji platne hodnoty nebo "—", NIKDY "NaN"

---

### 4.2 Widget — Preset retry (Bug 3 port)

**Kroky:**

1. **Zastav backend** (Ctrl+C)
2. Otevri widget (nebo reload)
3. **Ocekavany vysledek:** Cerveny banner s "Presety se nepodarilo nacist" + tlacitko **"Zkusit znovu"**
4. **Spust backend**
5. Klikni **"Zkusit znovu"**
6. **Ocekavany vysledek:** Presety se nacitou

---

### 4.3 Widget — Per-model presets (Bug 2 port)

**Kroky:**

1. Otevri widget
2. Nahraj dva modely
3. Vyber prvni model, nastav preset
4. Vyber druhy model
5. **Ocekavany vysledek:** Druhy model ma svuj vlastni preset (ne sdileny)

---

### 4.4 Widget — Volume discount display (S05 port)

**Predpoklad:** Volume discounts nastaveny v admin/pricing (viz sekce 3.1).

**Kroky:**

1. Otevri widget
2. Nahraj model, nastav mnozstvi >= min tieru
3. Spust slicing
4. **Ocekavany vysledek:** V cenovem breakdown se zobrazi zeleny blok s mnozstevni slevou

---

## 5) TEST Widget Builder — White Screen Fix

### 5.1 Prepinani kroku bez bile obrazovky

**Co testujeme:** Klikani na Upload/Konfigurace/Souhrn v horni liste builderu nezpusobi bilou obrazovku.

**Kroky:**

1. Naviguj na `http://localhost:4028/admin/widget`
2. Vytvor nebo vyber existujici widget
3. Klikni na **"Otevrit Builder"** (nebo naviguj primo na `/admin/widget/builder/:id`)
4. Pockej az se builder nacte — musi se zobrazit:
   - Horni lista s nazvem widgetu
   - Levy panel (Style/Elements/Global taby)
   - Pravy panel s preview widgetu

5. V horni liste klikni na **"Nahrani"** (Upload tab / krok 1)
6. **Ocekavany vysledek:** Preview ukazuje upload zonu, ZADNA bila obrazovka

7. Klikni na **"Konfigurace"** (krok 2)
8. **Ocekavany vysledek:** Preview ukazuje konfiguracni panely (material, kvalita...), ZADNA bila obrazovka

9. Klikni na **"Souhrn"** (krok 3)
10. **Ocekavany vysledek:** Preview ukazuje cenovy souhrn, ZADNA bila obrazovka

11. **Rychle klikani:** Klikejte rychle tam a zpet mezi vsemi tremi kroky (5-10x)
12. **Ocekavany vysledek:** Preview se vzdy spravne prepne, NIKDY bila obrazovka

13. **Kontrola v DevTools Console:** Zadne cervene chyby behem prepinani

---

### 5.2 Builder — editace elementu

**Co testujeme:** Po oprave white screen stale funguje klikani na elementy pro editaci.

**Kroky:**

1. V builderu klikni na **"Konfigurace"** (krok 2 v horni liste)
2. Klikni na NADPIS widgetu v preview (napr. "Kalkulacka 3D tisku")
3. **Ocekavany vysledek:** Element se zvyrazni modrou outline, v levem panelu se objevi editacni moznosti
4. Klikni na jiny element (napr. stepper)
5. **Ocekavany vysledek:** Zvyrazneni se presune, levy panel se aktualizuje

---

## 6) TEST i18n — Prepnuti jazyka

### 6.1 Ceske a anglicke texty

**Co testujeme:** Nove texty (checkout, volume discounts) existuji v obou jazycich.

**Kroky:**

1. Naviguj na `http://localhost:4028/test-kalkulacka`
2. Over ze jazyk je **cestina** (default)
3. Projdi checkout flow — texty musi byt cesky:
   - "Objednavka odeslana!"
   - "Kontaktni udaje"
   - "Odeslat objednavku"
   - "Souhlasim se zpracovanim osobnich udaju..."
4. **Prepni jazyk na anglictinu** (toggle v header navigaci)
5. Projdi checkout flow znovu — texty musi byt anglicky:
   - "Order Submitted!"
   - "Contact Information"
   - "Submit Order"
   - "I consent to the processing of my personal data..."

---

## 7) Regresni testy

### 7.1 Existujici funkcionalita — nesmela se rozbit

**Zkontroluj ze tyto veci stale funguji:**

| # | Co testovat | Jak | URL |
|---|-------------|-----|-----|
| R1 | Homepage se nacte | Otevri hlavni stranku | `http://localhost:4028/` |
| R2 | Admin dashboard | Otevri admin | `http://localhost:4028/admin` |
| R3 | Admin Pricing | Materialove tabulky se zobrazuji a edituji | `http://localhost:4028/admin/pricing` |
| R4 | Admin Fees | Poplatky se zobrazuji | `http://localhost:4028/admin/fees` |
| R5 | Admin Presets | Presety se nacitou | `http://localhost:4028/admin/presets` |
| R6 | Admin Orders | Objednavky se zobrazuji | `http://localhost:4028/admin/orders` |
| R7 | Single model flow | Upload 1 model -> slice -> cena | `http://localhost:4028/test-kalkulacka` |
| R8 | Multi model flow | Upload 2+ modely -> slice all | `http://localhost:4028/test-kalkulacka` |
| R9 | Fee selection | Volitelne poplatky se daji zapinat/vypinat | `http://localhost:4028/test-kalkulacka` (krok 2) |

---

## 8) Checklist — souhrnny prehled

Oznacte kazdou polozku jako PASS/FAIL:

```
[ ] S01 Bug 1: Auto-rekalkulace po zmene konfigurace
[ ] S01 Bug 2: Per-model preset selection (2+ modely)
[ ] S01 Bug 3: Preset retry tlacitko
[ ] S01 Bug 4: NaN safety (zadne NaN v UI)

[ ] S02: Upload -> Konfigurace -> Cena -> Checkout -> Potvrzeni
[ ] S02: Validace formulare (prazdny, kratke jmeno, neplatny email, bez GDPR)
[ ] S02: Potvrzovaci stranka (cislo objednavky, souhrn, "Nova objednavka")
[ ] S02: Navigace zpet (Checkout -> Cena -> Konfigurace)
[ ] S02: Objednavka ulozena v localStorage

[ ] S05: Admin UI volume discounts (enable, mode, scope, tiers)
[ ] S05: Procentualni sleva v kalkulacce
[ ] S05: Fixni cena za kus v kalkulacce
[ ] S05: Per-order scope (celkovy pocet vsech modelu)
[ ] S05: Sleva zmizi pod minimem tieru

[ ] Widget: NaN safety ve vysledcich
[ ] Widget: Preset retry tlacitko
[ ] Widget: Per-model presets
[ ] Widget: Volume discount display

[ ] Builder: Prepinani kroku BEZ bile obrazovky
[ ] Builder: Rychle prepinani (5-10x) BEZ padu
[ ] Builder: Editace elementu po fix

[ ] i18n: Ceske texty v checkout
[ ] i18n: Anglicke texty v checkout

[ ] Regrese R1-R9: Vsechno funguje

[ ] DevTools Console: Zadne NOVE cervene chyby
[ ] npm run build: PASS
```

---

## 9) Zname limitace (neni bug)

1. **Email se neodesila** — S07, zatim se objednavka uklada jen do localStorage
2. **Widget nema checkout** — by design, widget je embedovany
3. **Widget nema auto-recalc** — Bug 1 nebyl portovan (nizka priorita)
4. **Nektere texty ve widgetu jsou hardcoded cesky** — widget pouziva jiny i18n pattern nez test-kalkulacka
5. **Chunk size warning pri buildu** — pre-existing, neni zpusoben Phase 1 zmenami
