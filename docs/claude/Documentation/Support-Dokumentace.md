# Support -- Dokumentace

> Stranka `/support` je kompletni verejna napoveda, FAQ, navody krok za krokem,
> video sekce, kontaktni formular, systemove pozadavky a troubleshooting.
> Plne dvojjazycna (CS/EN), Forge dark theme, responsive layout se sticky sidebar navigaci.

---

## 1. Prehled

| Vlastnost | Hodnota |
|-----------|---------|
| URL routa | `/support` |
| Hlavni soubor | `src/pages/support/index.jsx` (1346 radku) |
| Ucel | Verejna napoveda, FAQ, navody, kontaktni formular, troubleshooting |

### Hlavni sekce
1. **Hero** -- nadpis + vyhledavaci pole pro FAQ
2. **Sticky sidebar navigace** -- 6 sekci s IntersectionObserver tracking
3. **FAQ** -- 7 kategorii (20+ otazek), vyhledavani, accordion
4. **Navody krok za krokem** -- 6 detailnich navodu s collapsible obsahem
5. **Video navody** -- 3 kategorie (6 videi), placeholder karty pro budouci obsah
6. **Kontaktni formular** -- jmeno, email, predmet (select), zprava, validace
7. **Systemove pozadavky** -- prohlizece, 3D formaty, doporucene nastaveni
8. **Troubleshooting** -- 3 problemy s kroky k reseni

---

## 2. Technologie

| Polozka | Detail |
|---------|--------|
| Runtime | React 19 + Vite |
| Jazyk | JavaScript + JSX |
| Styling | Forge CSS tokeny (inline styles) + Tailwind utility classes |
| Animace | Framer Motion (pres `Reveal` komponentu) |
| i18n | `useLanguage()` hook — vsechny texty pres `t()` s prefixem `support.*` |
| Navigace | IntersectionObserver pro aktivni sekci + smooth scroll |
| Formular | Validace (jmeno, email regex, zprava), mailto odeslani |

---

## 3. FAQ kategorie (7)

| Kategorie | Klicovy prefix | Pocet otazek |
|-----------|----------------|--------------|
| Zaciname | `support.faq.gs.*` | 3 |
| Nahravani modelu | `support.faq.mod.*` | 3 |
| Kalkulace ceny | `support.faq.price.*` | 3 |
| Objednavky | `support.faq.ord.*` | 2 |
| Fakturace a platby | `support.faq.bill.*` | 3 |
| Widget a integrace | `support.faq.wid.*` | 2 |
| Ucet a nastaveni | `support.faq.acc.*` | 2 |

Vyhledavani filtruje v realtau pres otazky i odpovedi (case-insensitive).

---

## 4. Navody (6)

| # | Nazev | Klicovy prefix | Kroky |
|---|-------|----------------|-------|
| 1 | Jak nahrat 3D model a ziskat cenovou kalkulaci | `support.guide.1.*` | 5 |
| 2 | Jak nastavit cenik a materialy | `support.guide.2.*` | 5 |
| 3 | Jak vlozit widget kalkulacky na e-shop | `support.guide.3.*` | 4 |
| 4 | Jak spravovat objednavky | `support.guide.4.*` | 5 |
| 5 | Jak nastavit branding | `support.guide.5.*` | 4 |
| 6 | Jak nastavit expresni tisk a priplatky | `support.guide.6.*` | 4 |

Kazdy navod je collapsible (accordion), s ikonou a cislovanymi kroky.

---

## 5. Kontaktni formular

| Pole | Validace |
|------|----------|
| Jmeno | Povinne (nesmí byt prazdne) |
| Email | Povinne + regex validace emailu |
| Predmet | Select: Technicky problem, Otazka k cene, Navrh, Jine |
| Zprava | Povinne (nesmí byt prazdne) |

Odeslani: konstruuje mailto URL a otevre emailoveho klienta.
Stavy: success toast, error toast.

---

## 6. Troubleshooting (3 problemy)

1. Co delat kdyz se model nenahraje (4 kroky)
2. Co delat kdyz kalkulacka neukazuje cenu (3 kroky)
3. Co delat kdyz widget nefunguje na e-shopu (4 kroky)

---

## 7. i18n klice

Vsechny texty pouzivaji `t()` z LanguageContext s prefixem `support.*`.
Odhadovany pocet klicu: ~130+ (FAQ otazky/odpovedi, navody, labels, validace, atd.)

Hlavni skupiny:
- `support.hero.*` — hero sekce
- `support.nav.*` — sidebar navigace
- `support.faq.*` — FAQ (cat, gs, mod, price, ord, bill, wid, acc)
- `support.guide.*` — navody (1-6, s title a s1-s5)
- `support.video.*` — video sekce
- `support.contact.*` — kontaktni formular
- `support.sysreq.*` — systemove pozadavky
- `support.trouble.*` — troubleshooting
- `support.search.*` — vyhledavani

---

## 8. Design

- Forge dark theme, `forge-grain` overlay, `forge-grid-bg` v hero
- Sticky sidebar s aktivni sekci zvyraznenim (teal accent)
- Responsive: sidebar skryty na mobilu, 2-sloupcovy layout na desktopu
- Animace: `Reveal` komponenta s kaskadovym delay
- SVG ikony inline (20+ ikon pro sekce, kroky, kategorie)

---

## 9. Souvisejici soubory

| Soubor | Relevance |
|--------|-----------|
| `src/contexts/LanguageContext.jsx` | i18n klice `support.*` |
| `src/components/ui/forge/ForgeFaqAccordion.jsx` | FAQ accordion komponenta |
| `src/components/marketing/Reveal.jsx` | Scroll-in animace |
| `src/Routes.jsx` | Route definice `/support` |

---

*Posledni aktualizace: 2026-03-14 (kompletni prepracovani stranky)*
