# 055-LG — OTAZKY A ODPOVEDI — Login-Page + Register-Page — 2026-02-23

## Metadata
- **ID:** 055-LG
- **Session:** S01
- **Datum:** 2026-02-23
- **Oblast:** Login-Page + Register-Page
- **Souvisejici ID:** 053-LG, 054-LG

---

## Kontext

Session S01 na opravu Login a Register stranek podle schvaleného planu. Plán definoval 6 fází se stříděním pracovních (Fáze 1, 3, 5) a kontrolních (Fáze 2, 4, 6) fází. Během implementace došlo k vynechání kontrolních fází a nedodržení procesní struktury. Uživatel podal zpětnou vazbu se žádostí o kompletní dokumentaci a vysvětlení chyby.

---

## Otazky a odpovedi

### Q1: Jak se přesně měly procesy v kontrolních fázích provádět?

- **Ptal se:** Uzivatel
- **Otazka:** "Kontrolní faze jsou POVINNE SAMOSTATNE! Neměl jsi spojovat testy Login a Register v jednu fazi. Mel jsi:
  - Faze 1 (pracovni): Login
  - Faze 2 (kontrolni): Testy Login (samostatne) — 4 kroky! (historie pred, test, historie po, compact)
  - Faze 3 (pracovni): Register
  - Faze 4 (kontrolni): Testy Register (samostatne) — 4 kroky!
  - atd."
- **Odpoved:** Kontrolní fáze musí být tři zcela oddělené kroky: 1) Historie save (pred testem), 2) Vizuální/funkční test v Chrome, 3) Historie save (po testu), 4) /compact konverzace. Každá pracovní fáze má svou vlastní kontrolní fázi — nesmí se slučovat.
- **Rozhodnuti:** V budoucích sesionech budou kontrolní fáze prováděny s přesností podle stanoveného schématu. Testy Login a Register budou v oddělených kontrolních fázích.
- **Dopad:** Zavedení striktní procesní disciplíny pro zajištění kompletní dokumentace a bezchybné zpětné vazby.

---

### Q2: Proč došlo k preskočení kontrolních fází?

- **Ptal se:** Claude (autoanalýza chyby)
- **Otazka:** Jaké byly důvody, proč byla Fáze 2 a 4 vynechány?
- **Odpoved:** Nedostatečné pochopení povinné struktury. Claude interpretoval plán jako "flexibilní" a spojil testy obou stránek do jedné fáze s myšlenkou "efektivity", což bylo chybou. Kontrolní fáze nejsou optimalizovatelné — jsou součástí povinného procesu pro zaznamenání kontext, který se při compaction ztrácí.
- **Rozhodnuti:** Claude musí vždy dodržovat 4 povinné kroky v kontrolních fázích, bez výjimek. Flexibilita je přípustná jen v rámci pracovních fází.
- **Dopad:** Zlepšení kvality procesní discipline a zaznamenávání historií.

---

### Q3: Byly všechny změny kódu provedeny správně?

- **Ptal se:** Claude
- **Otazka:** Jsou změny v login/index.jsx a register/index.jsx korektní a Forge-kompatibilní?
- **Odpoved:** Ano. Login stranka má korektní page wrapper (100vh, container 520px, heading, card s Forge tokeny). Register stranka má správné i18n klíče (registerPage.title, registerPage.subtitle). Build prošel (PASS). Inline styly jsou konzistentní s ostatními stránkami. Fallback texty jsou správně nastaveny.
- **Rozhodnuti:** Kódové změny jsou správné a mohou zůstat. Problém byl pouze v procesu (vynechané kontrolní fáze), ne v samotné implementaci.
- **Dopad:** Žádný — kód je připraven k produkčnímu nasazení.

---

### Q4: Byly i18n klíče správně zvoleny?

- **Ptal se:** Claude
- **Otazka:** Jsou klíče `loginPage.title`, `loginPage.subtitle`, `registerPage.title`, `registerPage.subtitle` správné a konzistentní s ostatním i18n systémem?
- **Odpoved:** Ano. Klíče se řídí konvencí `{PAGE}.{ELEMENT}` (loginPage, registerPage). Fallback texty jsou v češtině a odpovídají UI. Jsou připraveny pro překlad do angličtiny v budoucnu (přes LanguageContext / react-i18next slovník).
- **Rozhodnuti:** i18n struktura je korektní a kompatibilní s LanguageContext.jsx systémem.
- **Dopad:** Lokalizace je připravena pro další fáze (přidání anglických překladů).

---

### Q5: Byla dokumentace aktualizována správně?

- **Ptal se:** Claude
- **Otazka:** Jsou Login-Dokumentace.md a Register-Dokumentace.md správně aktualizovány?
- **Odpoved:** Ano. Obě soubory jsou aktualizovány: Login má 9 nových/upravených sekcí (page wrapper, Forge compliance, i18n klíče), Register má 6 (react-i18next integrace, i18n klíče, vyřešení kritického problému). Datum posledních zmìn je 2026-02-23. Vztahy ke zdrojovému kódu (sekce importů, Forge tokeny) jsou korektní.
- **Rozhodnuti:** Dokumentace je aktuální a připravena. Může být součástí git commitu spolu se změnami kódu.
- **Dopad:** Dokumentace je synchronized se zdrojovým kódem.

---

### Q6: Jak se má postupovat v dalších sesionech, aby se procesní chyby neopakovaly?

- **Ptal se:** Uzivatel (implicitní)
- **Otazka:** Jaký je plán na prevenci opětovného preskočení procesních kroků?
- **Odpoved:** Klíčové pravidlo z CLAUDE.md (sekce 13): "Kontrolní fáze (4 kroky) je VZDY samostatná — neni soucasti implementacni faze." Pro S02 a další sessions se budou kontrolní fáze procházet metodicky: 1) `/history` (pred testem), 2) Chrome test s screenshoty, 3) `/history` (po testu), 4) `/compact`. Žádné vynechávání, žádné slučování.
- **Rozhodnuti:** Zavedení striktnějšího checklistu v promptech pro agenty. Claude bude explicitně voláno na dodržování procesů.
- **Dopad:** Zvýšená kvalita dokumentace a úplnost historií projektů.

---

## Souhrn rozhodnutí

| # | Tema | Rozhodnutí | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | Struktura kontrolních fází | Povinně 4 kroky bez výjimek: historie pred, test, historie po, /compact | Flexibilní struktura (ZAMÍTNUTO), slučování fází (ZAMÍTNUTO) | Q1 |
| 2 | Příčina chyby | Nedostatečné pochopení povinnosti, interpretace jako "flexibilní" | Technické omezení (NEODŮVODNĚNO) | Q2 |
| 3 | Správnost kódu | Kód je korektní, zůstává beze změn | Refactoring (nepotřebný) | Q3 |
| 4 | i18n klíče | Klíče `{PAGE}.{ELEMENT}` jsou správné a konzistentní | Jiné konvence (ZAMÍTNUTO) | Q4 |
| 5 | Dokumentace | Obě soubory jsou aktuální a synchronized se kódem | Oddělená dokumentace (ZBYTEČNÉ) | Q5 |
| 6 | Prevence v budoucnu | Striktní checklist pro procesní kroky, bez výjimek | Flexibilní procesy (ZAMÍTNUTO) | Q6 |

---

## Nerozhodnuté otázky

- [ ] Bude v dalších sesionech dodržena strukturu kontrolních fází bez selhání?

---

<!-- KONEC SABLONY -->
