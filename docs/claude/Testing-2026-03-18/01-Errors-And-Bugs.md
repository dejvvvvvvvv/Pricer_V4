# Testovani 2026-03-18 — Chyby a Bugy

**Datum:** 2026-03-18
**Soubor:** 01-Errors-And-Bugs.md

Zaznamenavej zde vsechny nalezene chyby — funkcionalni, konzolove i crashe.
Pouzivej prefixovana ID podle kategorie (viz tabulka nize).

---

## Legenda

### ID format
```
BUG-{NNN}   — genericka chyba
CRASH-{NNN} — bila obrazovka / JS crash / komponenta nespadla
FUNC-{NNN}  — funkcionalni problem (neco nefunguje jak ma)
CON-{NNN}   — console error / warning
```

### Zavaznost

| Uroven | Popis |
|--------|-------|
| P0 | Crash, bila obrazovka, stranka se nenacte |
| P1 | Dulezita funkce nefunguje (upload, objednavka, platba) |
| P2 | Mensi nespravne chovani, workaround existuje |
| P3 | Drobnost, vizualni nepresnost bez dopadu |

### Stav

| Stav | Vyznam |
|------|--------|
| Novy | Prave zaznamenant, neopraveny |
| Overeno | Reprodukovano a potvrzeno |
| Opraveno | Fix nasazen |
| Zamitnuto | Neni bug / nen reprodukovatelne |

---

## Tabulka chyb

| ID | Stranka (ID) | URL | Zavaznost | Kategorie | Popis | Screenshot | Stav |
|----|--------------|-----|-----------|-----------|-------|------------|------|
| BUG-001 | P01 — Homepage | `/` | P1 | Vizualni / UX | Hero CTA tlacitka "Try for Free" a "View Demo" nemaji zadne button stylovani — vypadaji jako plain text bez okraje ani pozadi | — | Novy |
| BUG-002 | P01 — Homepage | `/` | P1 | Funkcionalni | Footer socialni ikony (GitHub, X, LinkedIn) pouzivaji href="#" — placeholder, nevedou nikam | — | Novy |
| BUG-003 | P01 — Homepage | `/` | P1 | Routing | Footer odkaz "Privacy Policy" vede na /privacy — stranka vraci 404. GLOBALNI BUG — viz BUG-011, BUG-014. | — | Novy |
| BUG-004 | P01 — Homepage | `/` | P1 | Routing | Footer odkaz "Terms of Service" vede na /terms — stranka vraci 404. GLOBALNI BUG — viz BUG-012, BUG-015. | — | Novy |
| BUG-005 | P01 — Homepage | `/` | P2 | Storage / i18n | Stav jazyka se persistuje v localStorage; po reloadu muze dojit ke smisene jazykove situaci (CZ/EN kombinace), nez se nacte i18n kontext | — | Novy |
| BUG-006 | P01 — Homepage | `/` | P3 | UX / Ocekavani | Sipky (→) na kartach "How It Works" a "Capabilities" jsou dekorativni — uzivatel muze ocekavat ze jsou klikatelne | — | Novy |
| BUG-007 | P01 — Homepage | `/` | P3 | i18n / Hardcoded | Nazev demo kalkulacky "Moje 3D tiskarna" je natvrdo v cestine v JSX — nezohlednuje aktivni jazyk (CZ/EN) | — | Novy |
| BUG-008 | P02 — Pricing | `/pricing` | P1 | Vizualni / Data | Enterprise karta zobrazuje "Custom Custom" (EN) / "Na miru Na miru" (CZ) — cena i perioda se resolvuji do stejneho retezce, oba se vykresluje | — | Novy |
| BUG-009 | P02 — Pricing | `/pricing` | P2 | i18n | Badge "Recommended" na Professional karte neni prelozen do CZ — hardcoded anglicky text v ForgePricingCard.jsx radek ~41 | — | Novy |
| BUG-010 | P02 — Pricing | `/pricing` | P2 | i18n | 3 chybejici CZ preklady v Pricing planech: klic pricing.pro.f4 ("Widget builder"), pricing.enterprise.f5 ("Custom integrace"), pricing.enterprise.f6 ("on-premise") | — | Novy |
| BUG-011 | P02 — Pricing | `/pricing` | P1 | Routing | Footer odkaz "Privacy Policy" vede na /privacy → 404. GLOBALNI BUG — shodny s BUG-003, BUG-014. | Pricing_Footer_Privacy_404.png | Novy |
| BUG-012 | P02 — Pricing | `/pricing` | P1 | Routing | Footer odkaz "Terms of Service" vede na /terms → 404. GLOBALNI BUG — shodny s BUG-004, BUG-015. | Pricing_Footer_Terms_404.png | Novy |
| BUG-013 | P02 — Pricing | `/pricing` | P3 | Funkcionalni | Footer socialni ikony pouzivaji href="#" — placeholder. GLOBALNI BUG — shodny s BUG-002. | — | Novy |
| BUG-014 | P03 — Support | `/support` | P1 | Routing | Footer odkaz "Privacy Policy" vede na /privacy → 404. GLOBALNI BUG — shodny s BUG-003, BUG-011. | — | Novy |
| BUG-015 | P03 — Support | `/support` | P1 | Routing | Footer odkaz "Terms of Service" vede na /terms → 404. GLOBALNI BUG — shodny s BUG-004, BUG-012. | — | Novy |
| BUG-016 | P04 — Model Upload | `/model-upload` | P2 | i18n | Tlacitko "Upload Model" v navbaru se neprelozi do CZ — zustava anglicky zatimco ostatni polozky navigace se prelozi. GLOBALNI BUG — viz BUG-024. | ModelUpload_UploadModel_NotTranslated_CZ.png | Novy |
| BUG-017 | P04 — Model Upload | `/model-upload` | P3 | i18n | Popisy karet formatu souboru (.STL, .3MF, .OBJ, .STEP) nejsou prelozeny do CZ — zobrazuji se anglicky. | — | Novy |
| BUG-018 | P04 — Model Upload | `/model-upload` | P3 | i18n | Footer odkaz "Home" neni prekladan do CZ. GLOBALNI BUG — viz BUG-025. | — | Novy |
| BUG-019 | P04 — Model Upload | `/model-upload` | P1 | Routing | Footer odkaz "Privacy Policy" vede na /privacy → 404. GLOBALNI BUG — shodny s BUG-003/011/014. | — | Novy |
| BUG-020 | P04 — Model Upload | `/model-upload` | P1 | Routing | Footer odkaz "Terms of Service" vede na /terms → 404. GLOBALNI BUG — shodny s BUG-004/012/015. | — | Novy |
| BUG-021 | P05 — Order Tracking | `/track` | P2 | Validace | Pole EMAIL nema format validaci — "notanemail" projde client-side kontrolou a vrati "Order not found" misto "Invalid email format". | — | Novy |
| BUG-022 | P05 — Order Tracking | `/track` | P3 | i18n | Label pole "EMAIL" neni prelozeny do CZ. | Track_ErrorMsg_NotTranslated_CZ.png | Novy |
| BUG-023 | P05 — Order Tracking | `/track` | P3 | UX / State | Stav formulare (vyplnena pole) se resetuje pri prepinani jazyka — uzivatel ztrati rozepsanou hodnotu. | — | Novy |
| BUG-024 | P05 — Order Tracking | `/track` | P2 | i18n | Tlacitko "Upload Model" v navbaru neprelozeno do CZ. GLOBALNI BUG — shodny s BUG-016. | — | Novy |
| BUG-025 | P06 — 404 | `/some-nonexistent-page` | P3 | i18n | Footer "Home" neni prelozeno do CZ. GLOBALNI BUG — shodny s BUG-018. | — | Novy |
| BUG-026 | P06 — 404 | `/some-nonexistent-page` | P1 | Routing | Footer Privacy/Terms → 404. GLOBALNI BUG — shodny s BUG-003/004. | — | Novy |
| BUG-027 | P-Account | `/account` | P1 | Data / Storage | Telefonni cislo se neulozi — pole prijima vstup, toast zobrazi "uspech", ale po ulozeni je hodnota smazana. | — | Novy |
| BUG-028 | P-Account | `/account` | P2 | UX | Kliknuti na tab nescrolluje na odpovidajici sekci — pouze zvyrazni tab, obsah se neposune. | — | Novy |
| BUG-029 | P-Account | `/account` | P2 | UX | Chybi success toast po "Save Changes" na zalozce Company — ulozeni je tiché, uzivatel nevi ze se neco stalo. | — | Novy |
| BUG-030 | P-Account | `/account` | P2 | Funkcionalni | Tlacitko "Enable 2FA" je nefunkcni — po kliku se nic nestane (zadny modal, zadny redirect). | — | Novy |
| BUG-031 | P-Account | `/account` | P1 | Funkcionalni | Tlacitko "Change Plan" je nefunkcni — po kliku zadna reakce. | — | Novy |
| BUG-032 | P-Account | `/account` | P1 | Funkcionalni | Tlacitko "Add Payment Method" je nefunkcni — neotevre se Stripe formular ani zadny modal. | — | Novy |
| BUG-033 | P-Account | `/account` | P1 | Funkcionalni / Bezpecnost | Tlacitko "Cancel Subscription" je nefunkcni — zadna akce, zadny confirm dialog. Destruktivni akce bez potvrzeni je bezpecnostni riziko UX. | — | Novy |
| BUG-034 | P-Account | `/account` | P2 | i18n | Chybejici diakriticka v CZ prekladech na Account page: "Nastaveni uctu" → "Nastaveni uctu", "Telefonni cislo" → "Telefonni cislo", "Ulozit zmeny" → "Ulozit zmeny" a dalsi (min. 5 poli). | — | Novy |
| BUG-035 | P-Invite | `/invite/accept` | P1 | Produkcni | Debug label "DEMO ACCEPTANCE PAGE — NO REAL EMAIL / AUTH" je videt vsem uzivatelum — musi byt odstranen pred nasazenim do produkce. | — | Novy |
| BUG-036 | P-Invite | `/invite/accept` | P3 | i18n | Obsah stranky Invite Accept neni prelozeny do CZ — "Accept Invite", chybove zpravy zustava v anglictine. | — | Novy |
| BUG-044 | A01 — Admin Dashboard | `/admin` | P0 | Modal / Portal | "New order" modal se otevre 664px pod viewport — overlay je viditelny ale formular je neviditelny a nedostupny. QuickOrderForm.jsx pouziva inline position bez createPortal. Uzivatel nemuze vytvorit novou objednavku. | Admin_Dashboard_NewOrderModal_Below_Viewport.png | Novy |
| BUG-045 | A01 — Admin Dashboard | `/admin` | P1 | Routing | Odkaz "/admin/analytics" vraci 404. Route je registrovana jako "lockanalytics" (chybejici lomena). Postihnuto: Dashboard quick actions, Command palette. Analytics sekce je nedostupna. | — | Novy |
| BUG-046 | A05 — Admin Pricing | `/admin/pricing` | P1 | Funkcionalni | Tlacitko smazani materialu (trash ikona) je zcela nefunkcni. Root cause: AdminPricing.jsx radek 376 destrukturuje `{ confirm, ConfirmDialogPortal }` ale hook vraci `{ confirm, ConfirmDialog }`. ConfirmDialogPortal === undefined, dialog se nikdy nepripoji. | — | Novy |
| BUG-047 | A05 — Admin Pricing | `/admin/pricing` | P2 | Logika / UX | Auto-generovani slugu materialu zachyti pouze prvni znak. Psani "PETG Carbon" vygeneruje slug "p" misto "petg_carbon". Podminka kontroluje zda je klic prazdny a zamkne se po prvnim znaku. | — | Novy |
| BUG-048 | A05 — Admin Pricing | `/admin/pricing` | P2 | Validace / UX | Validacni chyby v dialogu materialu se nemazou behem psani. Chyby jsou odvozene z ulozeneho stavu, nikoli z draft stavu — uzivatel vidi starou chybu i kdyz ji opravuje. | — | Novy |
| BUG-037 | A06 — Admin Fees | `/admin/fees` | P1 | Input / UX | Zadavani zapornych hodnot do pole VALUE je rozbite — klavesnica vlozi "-25" ale input zobrazi "025" (minus je tichy zahozen). Hint "Negative = discount." naznacuje ze zapornost ma byt podporovana. Workaround: programaticke nastaveni pres nativeInputValueSetter funguje. | — | Novy |
| BUG-038 | A06 — Admin Fees | `/admin/fees` | P1 | Backend / Storage | Supabase RLS blokuje zapis poplatku: `[storageAdapter] Supabase write error (fees): new row violates row-level security policy for table "fees"`. UI zobrazi "Saved" toast a ulozi do localStorage, ale cloud-write selze. Konfigurace poplatku se nepersistuje do Supabase databaze. | — | Novy |
| BUG-039 | A06 — Admin Fees | `/admin/fees` | P2 | i18n | Statisticke labely "MODEL FEES" a "ORDER FEES" v stats-baru nejsou prelozeny do CZ — zustava anglicky zatimco ostatni UI se prelozi spravne. | — | Novy |
| BUG-040 | A07 — Admin Parameters | `/admin/parameters/*` | P2 | Funkcionalni | Kliknuti na zalozku "Validation" v navigaci parametru neprovede prechod — URL zustane na aktualnim sub-route (...widget). Pouze prime zadani URL `/admin/parameters/validation` funguje. | — | Novy |
| BUG-041 | A07 — Admin Parameters | `/admin/parameters/widget` | P2 | UX / State | Tlacitko "Reset" na Widget zalozce parametru nevraci zmeny — pocitadlo "Unsaved changes (1)" zustane po kliku na Reset beze zmeny. Zadny confirm dialog neni zobrazen, zadna akce neprovedena. | — | Novy |
| BUG-042 | A07 — Admin Parameters | `/admin/parameters/*` | P2 | UX / State | Navigace mezi zalozkami parametru tichy zahodí neulozenych zmeny — bez warning dialogu "masz neulozenych zmeny, opravdu chces odejit?". Uzivatel muze ztratit praci. | — | Novy |
| BUG-043 | A07 — Admin Parameters | `/admin/parameters/library` | P2 | State / UX | Po pouziti per-param reset ikonky (kruhovava sipka u inputu) se hodnota spravne vrati na default, ale hlavickovy pocitadlo "Unsaved changes (N)" zustava stale zvysene — nedecrementuje se. Filtr "Changed" naopak spravne zobrazi 0 zmen. Nesoulad stavu. | — | Novy |
| CON-001 | A07 — Admin Parameters | `/admin/parameters/library` | P3 | Console / HTML | React hydration warning: `<button> cannot be a descendant of <button>` v komponente CollapsibleSection — Enable/Disable/Reset tlacitka jsou vnorena do collapsible header buttonu. Nefunkcionalni bug, ale HTML je nevalidni. | — | Novy |
| BUG-049 | A08 — Admin Presets | `/admin/presets` | P1 | Funkcionalni | Hodnoty sablony se neprenasejí pri vytvareni presetu ze sablony. Kliknuti na "+ Create preset" na jakekoli sablone (napr. PLA Quality 0.2mm) vytvori preset se vsemi parametry jako "--" (prazdne) misto hodnot sablony (LAYER 0.2mm, INFILL 15% atd.). Uzivatel musi vsechny hodnoty zadat rucne. | Admin_Presets_TemplateValues_Empty.png | Novy |
| BUG-050 | A08 — Admin Presets | `/admin/presets` | P2 | Modal / Portal | Delete confirm dialog se vyrenderuje mimo viewport kdyz je stranka scrollovana. Dialog se zobrazuje u vrcholu obsahu stranky, ne ve stredu viewportu. Chybejici `createPortal(jsx, document.body)` — stejny vzor jako BUG-044 (Dashboard QuickOrderForm). | Admin_Presets_DeleteDialog_ScrollPosition.png | Novy |
| BUG-051 | A14 — Admin Coupons | `/admin/coupons` | P3 | UX / Pristupnost | Nativni `<select>` element pro typ kuponu (Discount Type) neodpovida na standardni klik v testovacim prostredi — vyzaduje programaticke nastaveni hodnoty. Muze negativne ovlivnit klavesnicovou navigaci pro skutecne uzivatele. | — | Novy |
| BUG-052 | A02 — Admin Orders | `/admin/orders` | P2 | i18n | Hlavicky tabulky objednavek nejsou prelozeny do CZ — zustava anglicky: ORDER / CUSTOMER / DATE / ITEMS / MATERIAL / STATUS / TOTAL. Melo by byt: OBJEDNAVKA / ZAKAZNIK / DATUM / POLOZKY / MATERIAL / STAV / CELKEM. | — | Novy |
| BUG-053 | A02 — Admin Orders | `/admin/orders` | P3 | UX / Layout | Prepinac jazyka je umisten blizko tlacitka Export. Pri kliku na rozbalovaci sipku Exportu muze dojit k nahodne aktivaci prepinace jazyka na mensich viewportech. | — | Novy |

---

## Globalni bugy — shrnutí duplicit

> Nize uvedene bugy jsou formalne zaznamenany vicekrat (pro kazde testovane misto), ale jedna se o JEDEN a ten samy problem v kodu.

| Skupinovy bug | Dotcene ID | Root cause | Priorita opravy |
|---------------|------------|------------|-----------------|
| /privacy → 404 | BUG-003, BUG-011, BUG-014, BUG-019, BUG-026 | Route `/privacy` neni definovana v Routes.jsx | P1 — opravit jednou v Routes.jsx + vytvorit placeholder stranku |
| /terms → 404 | BUG-004, BUG-012, BUG-015, BUG-020, BUG-026 | Route `/terms` neni definovana v Routes.jsx | P1 — opravit jednou v Routes.jsx + vytvorit placeholder stranku |
| Socialni ikony href="#" | BUG-002, BUG-013 | Placeholder hodnoty v komponent Footer | P1-P3 — doplnit realne URL nebo ikony docasne schovat |
| "Upload Model" navbar neprelozeno | BUG-016, BUG-024 | Hardcoded text v Header komponentu — neni obaleno t() | P2 — jednodukla i18n oprava v Header.jsx |
| Footer "Home" neprelozeno | BUG-018, BUG-025 | Hardcoded "Home" v Footer komponentu | P3 — jednodukla i18n oprava v Footer.jsx |

---

## Detail nalezu

### BUG-001 — Hero CTA tlacitka bez stylovani

- **Stranka:** P01 — Homepage (`/`)
- **Zavaznost:** P1
- **Popis:** Tlacitka "Try for Free" a "View Demo" v hero sekci nemaji viditelne button stylovani. Zobrazuji se jako plain text bez okraje, pozadi ani hover efektu. Uzivatel nemuze jednoznacne identifikovat ze jsou klikatelna.
- **Ocekavane chovani:** Tlacitka maji mit Forge button styl (teal primary nebo outlined), viditelny border nebo fill, hover stav.
- **Mozna pricina:** Chybejici CSS class nebo spatny variant prop na button komponentu v Home page JSX.

---

### BUG-008 — Enterprise karta "Custom Custom" duplikace

- **Stranka:** P02 — Pricing (`/pricing`)
- **Zavaznost:** P1
- **Popis:** Enterprise pricing karta zobrazuje "Custom Custom" v EN a "Na miru Na miru" v CZ. Cena (price) a perioda (period) se obe resolvuji na stejny string.
- **Root cause:** `ForgePricingCard.jsx` renderuje oba props (`price` i `period`) a oba dostavaji stejnou hodnotu z i18n klice, ktery se pouziva pro Enterprise plan.
- **Ocekavane chovani:** Enterprise karta ma zobrazit pouze "Custom" / "Na miru" jednou, bez periodicke casti (nebo s prazdnou periodou).
- **Screenshot:** `Pricing_EN_CustomCustom_Duplication.png`

---

### BUG-010 — 3 chybejici CZ preklady na Pricing page

- **Stranka:** P02 — Pricing (`/pricing`)
- **Zavaznost:** P2
- **Detaily:**
  - `pricing.pro.f4` — "Widget builder" (zobrazuje se anglicky v CZ rezimu)
  - `pricing.enterprise.f5` — "Custom integrace" (zobrazuje se anglicky nebo chybi)
  - `pricing.enterprise.f6` — "on-premise" (zobrazuje se anglicky nebo chybi)
- **Screenshot:** `Pricing_CZ_i18n_Missing_Translations.png`

---

### BUG-021 — Chybejici email format validace na Order Tracking

- **Stranka:** P05 — Order Tracking (`/track`)
- **Zavaznost:** P2
- **Popis:** Formular pro sledovani objednavky neprovadi format validaci emailu na strane klienta. Zadani "notanemail" projde bez varovani, formular odesle dotaz a server vrati "Order not found" misto chybove hlasky o neplatnem emailu.
- **Ocekavane chovani:** Client-side validace ma zkontrolovat format emailu (regex nebo HTML5 `type="email"`) a zobrazit "Invalid email format" nebo "Zadejte platny email" pred odelanim formulare.
- **Root cause:** Pravdepodobne chybejici validacni pravidlo v handler funkci nebo `type="email"` na input elementu neni pouzito.

---

### BUG-027 — Telefonni cislo se neulozi na Account page

- **Stranka:** P-Account — Account (`/account`)
- **Zavaznost:** P1
- **Popis:** Pole "Phone Number" na zalozce Profile prijima vstup a po kliknuti na "Save Changes" se zobrazi success toast. Po ulozeni je vsak hodnota smazana a pole je prazdne. Telefonni cislo se tedy neulozi.
- **Ocekavane chovani:** Telefonni cislo se ulozi do storage (adminCompanyStorage nebo adminTenantStorage) a po reloadu stranka zobrazuje ulozene cislo.
- **Root cause:** Pravdepodobne chybejici mapovani pole `phone` pri volani storage helper funkce — pole je v UI ale chybi ve save logice.

---

### BUG-033 — Cancel Subscription bez confirm dialogu

- **Stranka:** P-Account — Account (`/account`)
- **Zavaznost:** P1
- **Popis:** Tlacitko "Cancel Subscription" na zalozce Billing neprovadi zadnou akci. Navic — tlacitko by melo jako destruktivni akce vyvolat confirm dialog s jasnym varovanim. Aktualne: klik nema zadny efekt.
- **Ocekavane chovani:** Klik oterve ForgeConfirmDialog s textem o nasledcich zruseni predplatneho, uzivatel musi explicitne potvrdit. Teprve pote se vola Stripe/backend pro zruseni.

---

### BUG-035 — Debug label na Invite Accept page viditelny vsem

- **Stranka:** P-Invite — Invite Accept (`/invite/accept`)
- **Zavaznost:** P1
- **Popis:** Na strance `/invite/accept` je viditelny debug label "DEMO ACCEPTANCE PAGE — NO REAL EMAIL / AUTH". Tento label je videt vsem navstevnikum vcetne pozvanych uzivatelu — neni obaleno podminenym renderovanim pro DEV prostredi.
- **Ocekavane chovani:** Debug banner ma byt zobrazen pouze pokud `isDev === true` (nebo uplne odstranen ze stranky pokud nejde o potrebny debug output).
- **Mozna pricina:** Chybejici `{isDev && <...>}` podminka kolem debug banneru.

---

### Jak pridavat zaznamy

1. Pridat radek do tabulky vyse
2. Priradit unikatni ID (BUG-016, BUG-017, ...)
3. Vyplnit vsechny sloupce
4. Pridat screenshot filename pokud existuje (ulozit do `docs/claude/Testing-2026-03-18/screenshots/`)
5. Volitelne pridat detail sekci nize pro slozitejsi bugy

---

---

### BUG-044 — "New order" modal pod viewport (Admin Dashboard) — P0 KRITICKE

- **Stranka:** A01 — Admin Dashboard (`/admin`)
- **Zavaznost:** P0
- **Popis:** Kliknuti na tlacitko "New order" na Dashboardu otevre tmavy overlay (spravne), ale sam formular `QuickOrderForm.jsx` se vyrenderuje 664px pod spodni hranou viewportu — uzivatel ho nemuze videt ani pouzivat. Uzivatel je uveznen v overlay ktery nema jak zavrit (bez Escape klaves nebo viditelneho tlacitka zavreni).
- **Root cause:** `QuickOrderForm.jsx` nepouziva `createPortal` — modal je renderovan jako potomek elementu s CSS `transform`, `overflow: hidden` nebo jinou vlastnosti ktera odpojuje modal od viewport souradnic.
- **Ocekavane chovani:** Modal se otervre ve stredu viewportu, formulare je viditelny a dostupny.
- **Reseni:** Pridat `createPortal(jsx, document.body)` v `QuickOrderForm.jsx` — stejny pattern jako ostatni modaly v projektu.
- **Screenshot:** `Admin_Dashboard_NewOrderModal_Below_Viewport.png`

---

### BUG-045 — /admin/analytics vraci 404 (Admin Dashboard)

- **Stranka:** A01 — Admin Dashboard (`/admin`)
- **Zavaznost:** P1
- **Popis:** Vsechny odkazy na `/admin/analytics` vedou na 404 stranku. V `Routes.jsx` je route registrovana s chybnym nazvem "lockanalytics" (chybi lomeno `/` nebo je nazev chybny). Postizene misto: Dashboard quick actions ("View Analytics"), Command palette (polozka "Analytics").
- **Ocekavane chovani:** `/admin/analytics` nacte stranku Admin Analytics.
- **Reseni:** Opravit route definici v `Routes.jsx` — zmenit `"lockanalytics"` na spravnou hodnotu `"analytics"`.

---

### BUG-046 — Delete material nefunkcni — ConfirmDialogPortal undefined (Admin Pricing)

- **Stranka:** A05 — Admin Pricing (`/admin/pricing`)
- **Zavaznost:** P1
- **Popis:** Kliknuti na trash ikonu u materialu nevyvolava zadnou reakci. Confirm dialog se nezobrazi, mazani neprobehne.
- **Root cause:** `AdminPricing.jsx` radek ~376 destrukturuje `{ confirm, ConfirmDialogPortal }` z `useConfirmDialog()` hooku, ale hook exportuje `{ confirm, ConfirmDialog }` (ne Portal varianta). `ConfirmDialogPortal` je `undefined`, pri pokusu o mount `<ConfirmDialogPortal />` React vyrenderuje `null` bez chyby — dialog chybi.
- **Ocekavane chovani:** Klik na trash → confirm dialog "Smazat material?" s Cancel/Delete → po potvrzeni material smazan.
- **Reseni:** Opravit destrukturovani na `{ confirm, ConfirmDialog }` a pouzit `<ConfirmDialog />` misto `<ConfirmDialogPortal />`.

---

### BUG-047 — Auto-generovani slugu zachyti pouze prvni znak (Admin Pricing)

- **Stranka:** A05 — Admin Pricing (`/admin/pricing`)
- **Zavaznost:** P2
- **Popis:** Pri zadavani nazvu materialu v dialogu "Add Material" se pole SLUG auto-generuje ze zadaneho nazvu. Aktualne: psani "PETG Carbon" vygeneruje slug "p" misto "petg_carbon". Podminka v onChange handleru kontroluje zda je slug prazdny a zamkne ho po prvnim znaku — dalsi znaky uz slug neaktualizuji.
- **Ocekavane chovani:** Slug se kontinualne aktualizuje z celeho nazvu: "PETG Carbon" → "petg_carbon", dokud ho uzivatel manualne nezmeni (pak se auto-update zastavi).
- **Reseni:** Opravit podminka — slug se ma auto-aktualizovat dokud se lisi od predchozi auto-generated hodnoty, nebo odstranit predcasne zamknuti.

---

### BUG-048 — Validacni chyby se nemazou pri psani v material dialogu (Admin Pricing)

- **Stranka:** A05 — Admin Pricing (`/admin/pricing`)
- **Zavaznost:** P2
- **Popis:** Kdyz se v dialogu "Add/Edit Material" zobrazi validacni chyba (napr. "Name is required") a uzivatel zacne psat do pole, chyba zustava zobrazena. Chyby jsou odvozene z ulozeneho/submitted stavu, nikoli z aktualniho draft stavu inputu.
- **Ocekavane chovani:** Validacni chyba zmizi okamzite jakmile uzivatel zacne psat do dotceneho pole (on-change clear).
- **Reseni:** Pridat `onChange` handler ktery maze chybu pro dotcene pole: `setErrors(prev => ({ ...prev, [field]: undefined }))`.

---

### BUG-037 — Zaporny vstup do VALUE pole rozbit (Admin Fees)

- **Stranka:** A06 — Admin Fees (`/admin/fees`)
- **Zavaznost:** P1
- **Popis:** Kdyz uzivatel do pole VALUE zadava zapornou hodnotu (napr. "-25"), input type="number" tichy zahodi znak minus a zobrazi "025". Hint "Negative = discount." naznacuje ze zapornost ma byt podporovana. Programaticke nastaveni hodnoty pres `nativeInputValueSetter` (React internal) funguje spravne — aplikace hodnotu -25 prijme a zobrazi jako "-25.00 Kc" cervenou barvou.
- **Ocekavane chovani:** Uzivatel muze zadat "-25" na klavesnici a input zobrazi "-25".
- **Mozna pricina:** `type="number"` input s `min="0"` nebo chybejici `onChange` handler ktery by prepsal React synteticku hodnotu. Reseni: prepnout na `type="text"` s numerickou validaci nebo odstranit `min` attr.

### BUG-038 — Supabase RLS blokuje zapis fees (KRITICKE)

- **Stranka:** A06 — Admin Fees (`/admin/fees`)
- **Zavaznost:** P1
- **Popis:** Kazdy pokus o ulozeni fees vyvolava konzolovou chybu: `[storageAdapter] Supabase write error (fees): new row violates row-level security policy for table "fees"`. UI zobrazi zeleny "Saved" toast a data se ulozi do localStorage (funguje), ale fire-and-forget Supabase write selze. To znamena ze fees jsou ulozene pouze lokalne — pri prehrani aplikace na jinem zarizeni nebo po smazani localStorage jsou konfigurace ztraceny.
- **Ocekavane chovani:** Data se persistuji do Supabase i localStorage.
- **Mozna pricina:** RLS politika na tabulce `fees` neni nastavena pro roli `authenticated` nebo chybi WHERE clause `tenant_id = auth.uid()`. Viz `supabase/rls-policies-production.sql`.

### BUG-039 — Stats labely MODEL FEES / ORDER FEES neprelozeny (Admin Fees)

- **Stranka:** A06 — Admin Fees (`/admin/fees`)
- **Zavaznost:** P2
- **Popis:** Statisticke labely ve stats baru "MODEL FEES" a "ORDER FEES" nejsou prelozeny do CZ — zustava anglicky. Ostatni labely ("ACTIVE FEES", "SAMPLE ORDER IMPACT") se prekladaji spravne.
- **Mozna pricina:** Chybejici i18n klice pro tyto dva labely ve fees komponente. Pridani `t('admin.fees.modelFees')` a `t('admin.fees.orderFees')` + odpovidajici CZ preklady.

### BUG-040 — Klik na Validation tab neprovede navigaci (Admin Parameters)

- **Stranka:** A07 — Admin Parameters (`/admin/parameters/widget`)
- **Zavaznost:** P2
- **Popis:** Kliknuti na zalozku "Validation" v tab navigaci parametru neprovede prechod na `/admin/parameters/validation`. URL zustava na soucasnem sub-route. Kliknuti pres ref (accessibility tree) take nenaviguje. Pouze prime zadani URL `/admin/parameters/validation` v adresnim radku funguje spravne.
- **Ocekavane chovani:** Klik na "Validation" tab naviguje na `/admin/parameters/validation`.
- **Mozna pricina:** onClick handler na Validation tab buttonu chybi nebo pouziva neplatny `navigate()` argument. Ostatni taby (Overview, Parameter Library, Widget) funguje spravne.

### BUG-041 — Reset tlacitko nefunkcni na Widget zalozce (Admin Parameters)

- **Stranka:** A07 — Admin Parameters (`/admin/parameters/widget`)
- **Zavaznost:** P2
- **Popis:** Na Widget zalozce parametru po provedeni zmeny (stav "Unsaved changes (1)") kliknuti na tlacitko "Reset" nevraci zmenu. Pocitadlo zustane na "(1)", zadna akce se neprovede, zadny confirm dialog se nezobrazi.
- **Ocekavane chovani:** Reset by mel restartovat draft stav Widget zalozky na posledni ulozeny stav (nebo zobrazit confirm dialog).
- **Mozna pricina:** onClick handler Reset buttonu pro Widget sub-page neni napojen nebo zavolava neplatny referer na draft state.

### BUG-042 — Tichy zahoz neulozenych zmen pri navigaci (Admin Parameters)

- **Stranka:** A07 — Admin Parameters (`/admin/parameters/*`)
- **Zavaznost:** P2
- **Popis:** Pri navigaci mezi zalozkami parametru (napr. z Widget na Library) jsou neulozenych zmeny tichy zahozeny bez upozorneni. Zadny "masz neulozenych zmeny — chces odejit?" dialog neni zobrazen.
- **Ocekavane chovani:** Uzivatel by mel byt vyzvan potvrzenim pred opustenim stranky s neulozenymi zmenami. Standardni React Router pattern: `useBlocker` nebo `useBeforeUnload`.

### BUG-043 — Per-param reset nedecrementuje hlavni pocitadlo (Admin Parameters Library)

- **Stranka:** A07 — Admin Parameters (`/admin/parameters/library`)
- **Zavaznost:** P2
- **Popis:** Po pouziti individualni reset ikonky (kruhovava sipka) u konkretniho parametru se hodnota vrati na default a filtr "Changed" spravne zobrazi 0 zmen. Avsak hlavickovy stav "Unsaved changes (N)" stale zobrazi puvodni cislo — nedecrementuje se. Dochazi k nesouladu stavu mezi headerem a filtrovacim systemem.
- **Ocekavane chovani:** Per-param reset by mel snizit pocitadlo v headeru stejne jako snizuje pocet Changed parametru.
- **Mozna pricina:** Stav v `draft` objektu se aktualizuje (proto filtr funguje), ale odvozenych `unsavedCount` v headeru se pocita jinak a nerespektuje per-param reset.

### BUG-049 — Template hodnoty prazdne pri vytvareni presetu ze sablony (Admin Presets)

- **Stranka:** A08 — Admin Presets (`/admin/presets`)
- **Zavaznost:** P1
- **Popis:** Sekce "Preset Templates" zobrazuje 6 sablon (PLA Quality 0.2mm, PLA Fine 0.15mm, PLA Draft 0.3mm, PETG Quality, ABS Quality, TPU Quality) s viditelnymi hodnotami (VRSTVA, INFILL, RYCHLOST, TEPLOTA, POSTEL, PODPORY). Pri kliknuti na tlacitko "+ Create preset" na libovolne sablone se vytvori novy preset, ale vsechny jeho parametry jsou "--" (prazdne). Hodnoty ze sablony nejsou preneseny.
- **Ocekavane chovani:** Klik na "+ Create preset" u sablony "PLA Quality 0.2mm" vytvori preset s predvyplnenymi hodnotami: LAYER HEIGHT = 0.2mm, INFILL = 15%, SPEED = 50mm/s, TEMP = 215C atd.
- **Root cause:** Pravdepodobne handler pro "Create from template" nepredava hodnoty sablony do nove vytvoreneho presetu — bud chybi mapovani nebo se pouziva prazdny defaultni stav misto stavu sablony.
- **Screenshot:** `Admin_Presets_TemplateValues_Empty.png`

---

### BUG-050 — Delete confirm dialog mimo viewport pri scrollovani (Admin Presets)

- **Stranka:** A08 — Admin Presets (`/admin/presets`)
- **Zavaznost:** P2
- **Popis:** Kdyz uzivatel scrolluje stranku Presets dolu (napr. k 5. nebo 6. presetove karte) a klikne na tlacitko Delete, confirm dialog se zobrazi mimo viditelny viewport — u vrcholu obsahu stranky, ne ve stredu obrazovky.
- **Ocekavane chovani:** Confirm dialog se zobrazi vzdy ve stredu viewportu bez ohledu na pozici scrollu.
- **Root cause:** Dialog nepouziva `createPortal(jsx, document.body)` — renderuje se jako potomek komponenty s CSS `transform` nebo `overflow` vlastnosti, ktera odpojuje dialog od viewport souradnic. Stejny vzor jako BUG-044 (Dashboard QuickOrderForm).
- **Reseni:** Pridat `createPortal(jsx, document.body)` pro delete confirm dialog v Presets komponente — stejny pattern jako ostatni spravne fungujici dialogy v projektu (napr. Express Delivery, Shipping strana).
- **Screenshot:** `Admin_Presets_DeleteDialog_ScrollPosition.png`

---

### CON-001 — Nested button HTML error (Admin Parameters Library)

- **Stranka:** A07 — Admin Parameters (`/admin/parameters/library`)
- **Zavaznost:** P3
- **Popis:** React konzolova chyba: `In HTML, <button> cannot be a descendant of <button>. This will cause a hydration error.` Zdrojem je `CollapsibleSection` komponenta — Enable/Disable/Reset group tlacitka jsou vnorena uvnitr `<button className="ap-collapsible-header">` elementu, ktery obsluhuje otevreni/zavreni skupiny.
- **Ocekavane chovani:** Tlacitka maji byt sourozenci, ne potomci collapsible header buttonu. HTML standard nedovoluje button uvnitr buttonu.
- **Mozna pricina:** Div-based header s event propagation stoppage by byl spravnym resenim misto button-in-button.

---

### BUG-051 — Native select element neodpovida na klik (Admin Coupons)

- **Stranka:** A14 — Admin Coupons (`/admin/coupons`)
- **Zavaznost:** P3
- **Popis:** Nativni `<select>` element pro volbu typu kuponu (Discount Type: percent, fixed, free_shipping, combined) neodpovida na standardni klik pri testovani. Element vyzaduje programaticke nastaveni hodnoty pres JavaScript. Muze negativne ovlivnit pristupnost a klavesnicovou navigaci pro skutecne uzivatele.
- **Ocekavane chovani:** Klik na select element otevre nativni dropdown, uzivatel muze vybrat hodnotu mysi i klavesnici.
- **Mozna pricina:** Komponenta obaluje nativni select vlastni click handlerem ktery blokuje propagaci, nebo select je stylovan zpusobem ktery zakryva klikatelnou oblast.

---

### BUG-052 — Hlavicky tabulky Orders neprelozeny do CZ (Admin Orders)

- **Stranka:** A02 — Admin Orders (`/admin/orders`)
- **Zavaznost:** P2
- **Popis:** V CZ rezimu zustava nazvy sloupcu tabulky objednavek v anglictine: ORDER / CUSTOMER / DATE / ITEMS / MATERIAL / STATUS / TOTAL. Ostatni prvky stranky (nadpis, filtry, status badges) se spravne prelozi.
- **Ocekavane chovani:** V CZ rezimu by se melo zobrazit: OBJEDNAVKA / ZAKAZNIK / DATUM / POLOZKY / MATERIAL / STAV / CELKEM.
- **Mozna pricina:** Chybejici i18n klice pro hlavicky tabulky ve OrdersTable komponente — pravdepodobne hardcoded retezce v definici sloupcu.

---

### BUG-053 — Prepinac jazyka blizko tlacitka Export (Admin Orders)

- **Stranka:** A02 — Admin Orders (`/admin/orders`)
- **Zavaznost:** P3
- **Popis:** Prepinac jazyka (CZ/EN) je umisten blizko tlacitka Export s rozbalovaci sipkou. Na mensich viewportech (nebo pri nepresnem kliku) muze uzivatel omylem aktivovat prepinac jazyka pri pokusu kliknout na Export chevron.
- **Ocekavane chovani:** Dostatecna vizualni oddelovani mezi tlacitkem Export a prepinacen jazyka.
- **Navrh:** Zvysit mezeru mezi prvky nebo presunout prepinac jazyka do samostatne oblasti headeru.

---

*Soubor vytvoren: 2026-03-18 | Aktualizovan: 2026-03-18 (davka 6 — BUG-051 az BUG-053 pridany: A14/Coupons, A02/Orders; A12/Customers zero bugs)*
