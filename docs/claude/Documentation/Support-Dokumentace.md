# Support -- Dokumentace

> Stranka `/support` je verejna napoveda a FAQ sekce aplikace ModelPricer.
> Obsahuje vyhledavaci pole, rychle odkazy na zdroje, kategorizovane FAQ
> s accordion rozbalovanim a kontaktni sekci. Plne dvojjazycna (CS/EN),
> Forge dark theme, responsive mobile-first layout.

---

## 1. Prehled

| Vlastnost | Hodnota |
|-----------|---------|
| URL routa | `/support` |
| Definice routy | `src/Routes.jsx:83` (`<Route path="/support" element={<Support />} />`) |
| Import v routeru | `src/Routes.jsx:11` (`import Support from './pages/support'`) |
| Hlavni soubor | `src/pages/support/index.jsx` (359 radku) |
| Subkomponenty | Zadne -- stranka nema vlastni `components/` adresar |
| Ucel | Verejna napoveda, FAQ, kontaktni informace |

### Hlavni funkce
1. **Hero sekce** -- nadpis + podnadpis s vyhledavacim polem
2. **Quick Links** -- 4 karty zdroju (Dokumentace, Video navody, Live Chat, Email podpora)
3. **FAQ** -- 4 kategorie (Zaciname, Ceny, Technicke, Ucet), kazda s 3-4 otazkami
4. **Kontaktni sekce** -- email a live chat kontaktni karty
5. **Vyhledavani** -- real-time filtrovani FAQ otazek a odpovedi

---

## 2. Technologie a jazyk

| Polozka | Detail |
|---------|--------|
| Runtime | React 19 + Vite |
| Jazyk | JavaScript + JSX |
| Styling | Forge CSS tokeny (inline styles) + Tailwind utility classes |
| Animace | Framer Motion (pres `Reveal` komponentu) |
| i18n | `useLanguage()` hook z `LanguageContext` |
| Routing | React Router v6 (stranka je `<Route>` v `Routes.jsx`) |
| State management | Lokalni `useState` pro `searchQuery` |

---

## 3. Architektura souboru

```
src/pages/support/
  index.jsx ................. Jediny soubor -- cela stranka Support
                              (359 radku, zadne subkomponenty)
```

Stranka NEMA vlastni adresar `components/`. Vsechen JSX je v jednom souboru.
Toto je prijatelne pro stranku teto velikosti (pod 400 radku), ale pokud
se bude rozsirovat (napr. kontaktni formular, ticketing), doporucuje se
extrakce do subkomponent.

---

## 4. Import graf

```
src/pages/support/index.jsx
  |
  +-- react (useState)
  +-- contexts/LanguageContext.jsx .......... useLanguage() hook
  +-- components/marketing/Reveal.jsx ...... Scroll-in animace (framer-motion)
  +-- components/ui/forge/ForgeSquiggle.jsx  Dekorativni vlnovka pod nadpisem
  +-- components/ui/forge/ForgeButton.jsx .. IMPORTOVANO ALE NEPOUZITO (!)
  +-- components/ui/forge/ForgeSectionLabel.jsx  Uppercase section marker
  +-- components/ui/forge/ForgeFaqAccordion.jsx  Accordion pro FAQ otazky
```

### Poznamka: Neaktivni import
`ForgeButton` je importovan na radku 5, ale nikde v JSX neni pouzit.
Toto je **unused import** -- viz Error Log zaznam nize.

---

## 5. Design a vizual

### 5.1 Forge tokeny pouzite na strance

| Token | Kde se pouziva | Popis |
|-------|---------------|-------|
| `--forge-bg-void` | `forgePageStyles` (root div) | Nejhlubsi pozadi stranky (#08090C) |
| `--forge-bg-surface` | Search input, kontaktni box | Povrchova plocha (#0E1015) |
| `--forge-bg-elevated` | Kontaktni karty (email, chat) | Zvysena plocha (#161920) |
| `--forge-text-primary` | Root div, nadpisy, otazky | Primarni text (#E8ECF1) |
| `--forge-text-secondary` | Hero subtitle, FAQ odpovedi, kontaktni subtitle | Sekundarni text (#9BA3B0) |
| `--forge-text-muted` | Quick link popisy, search icon, "no results" zprava | Ztlumeny text (#7A8291) |
| `--forge-accent-primary` | Ikony, kategorie nadpisy, kontaktni border | Hlavni accent teal (#00D4AA) |
| `--forge-accent-secondary` | --- | Pouzito v `ForgeFaqAccordion` (otevrent "+" ikona) |
| `--forge-border-default` | FAQ sekce horni border, kontaktni karty | Standardni border (#1E2230) |
| `--forge-border-active` | Search input border | Aktivni border (#2A3040) |
| `--forge-font-body` | Root div, search input | IBM Plex Sans |
| `--forge-font-heading` | Quick link tituly, FAQ kategorie, kontaktni labely | Space Grotesk |
| `--forge-text-base` | Search input font-size | 0.875rem |
| `--forge-text-sm` | Quick link popisy, kontaktni detaily | 0.75rem |
| `--forge-text-lg` | Quick link tituly (inline) | 1rem |
| `--forge-text-xl` | FAQ kategorie nadpis (inline) | 1.25rem |
| `--forge-radius-sm` | Search input, kontaktni karty | 4px |
| `--forge-radius-md` | Kontaktni box | 6px |

### 5.2 Layout

| Sekce | Layout | Max-width | Responsive chovani |
|-------|--------|-----------|-------------------|
| Hero | Centrovany text | `max-w-7xl` (vnejsi), `max-w-xl` (search) | `py-20 lg:py-28` |
| Quick Links | CSS Grid 4 sloupce | `max-w-7xl` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| FAQ | Jeden sloupec | `max-w-3xl` | Plna sirka na mobile |
| Kontakt | Centrovany box | `max-w-2xl` uvnitr `max-w-7xl` | `grid-cols-1 sm:grid-cols-2` pro kontaktni karty |

Padding na vsech sekcich: `px-6 lg:px-8`.

### 5.3 Animace

Vsechny vizualne sekce jsou obaleny v `<Reveal>` komponente:

| Sekce | Delay pattern | Chovani |
|-------|--------------|---------|
| Hero nadpis + text | `delay=0` (default) | Fade-in + slide-up (12px) |
| Hero search | `delay=0.05` | Mirne pozdrzen za nadpisem |
| Section label "RESOURCES" | `delay=0` | Standardni reveal |
| Quick Link karty | `delay={i * 0.04}` | Kaskadove odhaleni (0, 40ms, 80ms, 120ms) |
| Section label "FAQ" + nadpis | `delay=0` | Standardni reveal |
| FAQ kategorie | `delay={i * 0.03}` | Kaskadove odhaleni per kategorie |
| Kontaktni box | `delay=0` | Standardni reveal |

`Reveal` pouziva `framer-motion`:
- `initial`: `opacity: 0, y: 12`
- `whileInView`: `opacity: 1, y: 0`
- `viewport`: `{ once: true, margin: '-15% 0px' }` (trigger pred plnym vstupem do viewportu)
- `transition`: `duration: 0.5, ease: 'easeOut'`

### FAQ Accordion animace (ForgeFaqAccordion)
- Rozbaleni: `max-height: 0 -> 500px`, `transition: max-height 250ms ease`
- "+" ikona: `transform: rotate(0deg) -> rotate(45deg)` (stane se "x")
- Barva ikony: `--forge-accent-primary` (zavreno) -> `--forge-accent-secondary` (otevreno)
- Hover na radku: `background: transparent -> var(--forge-bg-surface)`

### 5.4 Forge compliance

| Pravidlo | Status | Poznamka |
|----------|--------|---------|
| Forge dark theme | OK | `--forge-bg-void` jako zaklad |
| `forge-grain` overlay | OK | Aplikovano na root div |
| `forge-grid-bg` | OK | Pouzito v hero sekci |
| Heading font | OK | `forge-h1`, `forge-h2`, `forge-h3` CSS tridy + inline `--forge-font-heading` |
| Body font | OK | `--forge-font-body` na root div |
| Tech font | OK | Pouzit spravne jen na `ForgeSectionLabel` (male uppercase labely) |
| Dekorativni prvky | OK | `ForgeSquiggle` pod hero nadpisem |
| Kontaktni box glow | OK | `box-shadow: 0 0 40px rgba(0,212,170,0.08)` -- subtilni teal glow |

---

## 8. UI komponenty -- detailni popis

### 8.1 Hero sekce (radky 142-196)

**Vizualni struktura:**
```
+----------------------------------------------------+
|  [forge-grid-bg pozadi s 24px mrizkou]             |
|  [radial-gradient teal glow nahore]                |
|                                                    |
|     Jak vam muzeme pomoci?                         |
|     ~~~~~~~~~~~~ (ForgeSquiggle)                   |
|     Najdete odpovedi na nejcastejsi otazky...      |
|                                                    |
|  +----------------------------------------------+  |
|  | [lupa icon]  Hledat v napovede...            |  |
|  +----------------------------------------------+  |
|                                                    |
+----------------------------------------------------+
```

- Radial gradient: `rgba(0,212,170,0.05)`, 600x400px, centrovany
- ForgeSquiggle: absolutne poziciovany pod nadpisem (`-bottom-2`)
- Search input: flex container s ikonou lupy (SVG 20x20), transparentni pozadi

### 8.2 Quick Links sekce (radky 198-231)

**Vizualni struktura:**
```
RESOURCES                          (ForgeSectionLabel)

+-------------+  +-------------+  +-------------+  +-------------+
|   [book]    |  |   [video]   |  |   [chat]    |  |   [mail]    |
| Dokumentace |  | Video navody|  |  Live Chat  |  |Email podpora|
| Kompletni   |  | Krok za     |  | Okamzita    |  | support@    |
| navody...   |  | krokem...   |  | podpora...  |  | modelp...   |
+-------------+  +-------------+  +-------------+  +-------------+
```

- 4 karty s `forge-card-interactive` tridou (hover: elevace + glow + translateY(-2px))
- Ikony: inline SVG 28x28, `stroke="currentColor"`, barva `--forge-accent-primary`
- Karty: `text-center`, `h-full` pro vyrovnani vysky v gridu

**Definovane ikony (radky 102-127):**

| Klic | Popis | SVG |
|------|-------|-----|
| `book` | Otevrena kniha | Obrys knihy s dělicí carou uprostred |
| `video` | Kamera | Obdelnik + trojuhelnik vpravo |
| `chat` | Chat bublina | Obdelnik s ocaskem + 2 radky textu |
| `mail` | Obalka | Obdelnik s trojuhelnkiovy obalkovym vzorem |

### 8.3 FAQ sekce (radky 233-270)

**Vizualni struktura:**
```
FAQ                                (ForgeSectionLabel)
Casto kladene otazky               (forge-h2)

  Zaciname                         (kategorie nadpis, teal accent)
  +------------------------------------------+
  | Jak zacit pouzivat ModelPricer?     [+]  |
  +------------------------------------------+
  | Potrebuji mit vlastni server...?    [+]  |
  +------------------------------------------+
  | Jak vlozim kalkulacku na svuj web?  [+]  |
  +------------------------------------------+

  Ceny a poplatky
  ...
```

- FAQ data: hardcoded pole objektu (radky 20-88), nikoliv z API
- 4 kategorie: Zaciname (3 otazky), Ceny a poplatky (3), Technicke (4), Ucet a fakturace (3)
- Celkem **13 FAQ otazek** v kazdem jazyce
- `ForgeFaqAccordion` prijima `items` s klici `{q, a}`
- Kategorie nadpis: inline styl, `--forge-font-heading`, `--forge-text-xl`, barva `--forge-accent-primary`

### 8.4 Vyhledavani (radky 129-138 logika, 167-194 UI)

**Algoritmus filtrovani:**
1. Pokud `searchQuery.trim()` je prazdny -> zobraz vsechny FAQ
2. Jinak: pro kazdou kategorii filtruj otazky kde `q` nebo `a` obsahuje query (case-insensitive)
3. Kategorie s 0 odpovidajicimi otazkami se skryji
4. Pokud zadna kategorie neobsahuje vysledky -> zobraz "Zadne vysledky" zpravu

**Omezeni:**
- Pouze client-side filtrovani (zadne API volani)
- Filtrace je jen na `q` a `a` textech, nikoliv na nazvu kategorie
- Zadne debounce -- filtruje pri kazdem stisknuti klavesy
- Zadne zvyrazneni nalezenych textu ve vysledcich

### 8.5 Kontaktni sekce (radky 273-352)

**Vizualni struktura:**
```
+--------------------------------------------------+
|  [teal border, glow shadow]                      |
|                                                  |
|  Nenasli jste odpoved?                           |
|  Nas tym je tu pro vas...                        |
|                                                  |
|  +-----------------------+ +-------------------+ |
|  | [mail icon]           | | [chat icon]       | |
|  | Email                 | | Live Chat         | |
|  | support@modelpric...  | | Po-Pa 9:00-17:00  | |
|  +-----------------------+ +-------------------+ |
|                                                  |
+--------------------------------------------------+
```

- Vnejsi box: `--forge-bg-surface`, border `--forge-accent-primary` (1px plny), zaobleni `--forge-radius-md`
- Glow efekt: `box-shadow: 0 0 40px rgba(0,212,170,0.08)`
- Kontaktni karty: `--forge-bg-elevated`, border `--forge-border-default`
- Responsive: `grid-cols-1 sm:grid-cols-2`

---

## 9. State management a data flow

### Lokalni state

| State | Typ | Default | Pouziti |
|-------|-----|---------|---------|
| `searchQuery` | `string` | `''` | Text v search inputu, filtruje FAQ |

### Odvozena data (computed)

| Promenna | Zdroj | Popis |
|----------|-------|-------|
| `faqs` | Hardcoded pole | 4 kategorie, 13 otazek, plne CS/EN |
| `quickLinks` | Hardcoded pole | 4 odkazy na zdroje, plne CS/EN |
| `icons` | Hardcoded objekt | 4 SVG ikony (book, video, chat, mail) |
| `filteredFaqs` | Odvozeno z `faqs` + `searchQuery` | Filtrovane FAQ kategorie |

### Data flow diagram

```
LanguageContext (language, t())
        |
        v
  +-- language --> Vybere CS nebo EN vetev `faqs` a `quickLinks`
  +-- t() ------> Preklady pro hero, search placeholder, kontakt
        |
        v
searchQuery (useState)
        |
        v
filteredFaqs = faqs.map(...).filter(...)
        |
        v
  ForgeFaqAccordion (items={category.questions})
```

### Zadne externi API volani
Stranka je plne staticka (zadne fetch, zadne useEffect s API volanimi).
Vsechna data jsou definovana inline v komponente.

---

## 11. Preklady (i18n) -- pouzite klice + hardcoded texty

### Klice pouzite pres `t()` (z LanguageContext)

| Klic | CS | EN | Radek |
|------|----|----|-------|
| `support.hero.title` | Jak vam muzeme pomoci? | How Can We Help You? | 155 |
| `support.hero.subtitle` | Najdete odpovedi na nejcastejsi otazky nebo nas kontaktujte | Find answers to common questions or contact us | 163 |
| `support.search.placeholder` | Hledat v napovede... | Search help... | 183 |
| `support.contact.title` | Nenasli jste odpoved? | Didn't Find an Answer? | 289 |
| `support.contact.subtitle` | Nas tym je tu pro vas... | Our team is here for you... | 292 |

### Hardcoded texty (language === 'cs' ? ... : ...)

| Text (CS) | Text (EN) | Radek | Poznamka |
|-----------|-----------|-------|----------|
| Casto kladene otazky | Frequently Asked Questions | 243 | Mohl by byt `t()` klic |
| Zadne vysledky pro hledany vyraz. | No results found for your search. | 248 | Mohl by byt `t()` klic |
| Po-Pa 9:00-17:00 | Mon-Fri 9:00-17:00 | 345 | Mohl by byt `t()` klic |

### Hardcoded texty (bez prekladu -- pouze anglicky)

| Text | Radek | Poznamka |
|------|-------|----------|
| `"RESOURCES"` | 201 | ForgeSectionLabel text -- section labels jsou anglicky by design |
| `"FAQ"` | 240 | ForgeSectionLabel text -- anglicka zkratka, OK |
| `"Email"` | 316 | Label kontaktniho boxu -- shodne v CS i EN |
| `"Live Chat"` | 342 | Label kontaktniho boxu -- shodne v CS i EN |
| `"support@modelpricer.com"` | 94, 318 | Email adresa -- neni treba prekladat |

### FAQ data: plne prekladane inline

FAQ pole na radcich 20-88 obsahuje kompletni CS a EN verze vsech 13 otazek a odpovedi.
Tyto texty NEJSOU v LanguageContext -- jsou definovany primo v komponente.
Toto je design rozhodnuti (FAQ data mohou byt v budoucnu nahrazena API volanim).

---

## 12. Pristupnost

### Co je spravne

| Prvek | ARIA/A11y | Poznamka |
|-------|-----------|---------|
| ForgeSquiggle | `aria-hidden="true"` | Dekorativni SVG spravne skryto |
| ForgeFaqAccordion button | `aria-expanded={isOpen}` | Accordion tlacitko oznamuje stav |
| FAQ accordion | `<button>` element | Spravne pouzit semanticky button (ne div) |
| Ikony (book, video, chat, mail) | --- | **CHYBI** `aria-hidden="true"` -- viz Design Error Log |

### Problemy pristupnosti

| # | Problem | Radek | Zavaznost |
|---|---------|-------|-----------|
| 1 | Search input **nema `aria-label`** ani `<label>` element | 181 | Stredni -- screen reader neoznamui ucel pole |
| 2 | Search input nema `role="search"` na obalovacim divu | 169 | Nizka -- semanticke zlepseni |
| 3 | Quick link SVG ikony **nemaji `aria-hidden="true"`** | 104-127 | Nizka -- screen reader muze cist prazdne SVG |
| 4 | Quick link karty **nejsou interaktivni** (zadne `<a>`, `<button>`, `onClick`) | 207-229 | Vysoka -- `forge-card-interactive` + `cursor: pointer` vizualne naznacuje kliknutelnost, ale karta neni ve skutecnosti klikatelna |
| 5 | Kontaktni karty (email, chat) **nejsou odkazy** | 296-348 | Stredni -- email by mel byt `<a href="mailto:...">`, chat by mel mit akci |
| 6 | FAQ accordion **nema `id`** propojeni mezi tlacitkem a panelem | ForgeFaqAccordion.jsx:26-80 | Nizka -- `aria-controls` chybi |

---

## 13. Performance

### Pozitivni aspekty

| Aspekt | Detail |
|--------|--------|
| Zadne API volani | Stranka je plne staticka, data jsou inline |
| Reveal animace | `viewport: { once: true }` -- animace se spusti jen jednou |
| SVG ikony inline | Zadne externi HTTP pozadavky na ikony |
| Jednoduchy state | Pouze 1x `useState` (searchQuery) |

### Potencialni problemy

| # | Problem | Dopad | Reseni |
|---|---------|-------|--------|
| 1 | FAQ data se rekonstruuji pri kazdem renderingu | Nizky (13 polozek) | Muze se obalit `useMemo` zavislym na `language` |
| 2 | `filteredFaqs` se pocita pri kazdem stisknuti klavesy | Nizky (13 polozek) | Muze se pridat debounce (napr. 200ms) |
| 3 | 4 SVG ikony definovane jako JSX objekty v renderingu | Minimalni | Muze se extrahovat mimo komponentu |
| 4 | `forgePageStyles` objekt je definovan mimo komponentu | OK | Spravne -- nerekreuje se pri renderu |

### Velikost
- Jediny soubor: ~359 radku (primerene)
- Zavislost na `framer-motion` (velka knihovna) pres `Reveal`
- Zadne lazy-loading (neni potreba pro statickou stranku)

---

## 16. Souvisejici dokumenty

| Dokument | Cesta | Relevance |
|----------|-------|-----------|
| CLAUDE.md | `Model_Pricer-V2-main/CLAUDE.md` sekce 5 | Mapa routingu, stranka je `/support` |
| Routes.jsx | `Model_Pricer-V2-main/src/Routes.jsx:83` | Definice routy |
| LanguageContext | `Model_Pricer-V2-main/src/contexts/LanguageContext.jsx:188-192, 731-735` | Prekladove klice pro support |
| Forge tokens | `Model_Pricer-V2-main/src/styles/forge-tokens.css` | CSS promenne |
| Forge typography | `Model_Pricer-V2-main/src/styles/forge-typography.css` | `.forge-h1/h2/h3/body-lg` tridy |
| Forge utilities | `Model_Pricer-V2-main/src/styles/forge-utilities.css` | `.forge-card-interactive` trida |
| Forge textures | `Model_Pricer-V2-main/src/styles/forge-textures.css` | `.forge-grain`, `.forge-grid-bg` |
| Error Log | `docs/claude/Error_Log.md` | Zaznamy o chybach |
| Design Error Log | `docs/claude/Design-Error_LOG.md` | Zaznamy o design chybach |

---

## 17. Zname omezeni

### Funkcni omezeni

| # | Omezeni | Popis |
|---|---------|-------|
| 1 | **FAQ data jsou hardcoded** | Vsech 13 otazek + odpovedi je natvrdo v kodu. Neni mozne je editovat z admin panelu. |
| 2 | **Quick Links nikam nevedou** | Karty maji vizualni hover efekt (`forge-card-interactive`) ale nejsou interaktivni -- zadne `onClick`, `<a>`, ani `<Link>`. Uzivatel ocekava kliknutelnost. |
| 3 | **Kontaktni informace jsou staticke** | Email `support@modelpricer.com` a provozni hodiny jsou natvrdo v kodu. |
| 4 | **Zadny kontaktni formular** | Sekce "Nenasli jste odpoved?" obsahuje jen kontaktni info, nikoliv formular. |
| 5 | **Vyhledavani je pouze FAQ** | Search pole filtruje jen FAQ otazky, ne quicklinks ani jiny obsah. |
| 6 | **Zadne zvyrazneni nalezenych textu** | Filtrovane vysledky neukazuji kde presne se query nachazi. |

### Technicke omezeni

| # | Omezeni | Popis |
|---|---------|-------|
| 7 | **Unused import ForgeButton** | Import na radku 5 neni nikde pouzit -- mrtvy kod. |
| 8 | **3 texty pouzivaji inline ternary misto `t()`** | "Casto kladene otazky", "Zadne vysledky...", "Po-Pa 9:00-17:00" -- nekonzistentni s ostatnimi preklady. |
| 9 | **FAQ accordion maxHeight 500px** | Pokud odpoved presahne 500px vysky, bude oriznuta. |
| 10 | **Zadny loading/error state** | Stranka je staticka, ale pokud by se v budoucnu pripojila na API, chybi pattern pro loading/error. |
| 11 | **SVG filter ID kolize** | `ForgeSquiggle` pouziva filter `id="squiggle-roughen"` -- pokud je na strance vice instanci, ID se zduplikuje (aktualne jen 1 instance, OK). |

### Designove omezeni

| # | Omezeni | Popis |
|---|---------|-------|
| 12 | **Quick link ikony nemaji aria-hidden** | SVG ikony v quick links a kontaktni sekci nemaji `aria-hidden="true"` (na rozdil od ForgeSquiggle). |
| 13 | **Search input bez labelu** | Nema `<label>`, `aria-label` ani `aria-labelledby`. Pouze `placeholder` text. |
