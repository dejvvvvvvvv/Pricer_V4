# Testovani 2026-03-18 — Spravne Chovani

**Datum:** 2026-03-18
**Soubor:** 02-Correct-Behavior.md

Zaznamenavej zde vse co funguje spravne. Tento dokument slouzi jako reference pro budouci
regresni testovani — vic co je zde zaznamenano, tim snazsi je odhalit regresi pri pristi zmene.

---

## Legenda — Stav

| Stav | Vyznam |
|------|--------|
| OK | Funguje spravne, bez vyhrad |
| Castecne | Funguje, ale s malymi nepresnostmi nebo omezenimi |
| Neovereno | Stranka nebyla v teto session testovana |

---

## Verejne stranky

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| P01 — Homepage | `/` | Nacteni stranky bez bile obrazovky | OK | Title "3D Print Pricing | ModelPricer" spravny |
| P01 — Homepage | `/` | Dark theme aktivni po nacteni | OK | Pozadi dark, text citelny |
| P01 — Homepage | `/` | Header — logo "ModelPricer" + ikona | OK | Viditelne, citelne |
| P01 — Homepage | `/` | Header — navigacni odkazy (Home, Demo, Pricing, Support, Admin) | OK | Vsechny zobrazeny, Home aktivni se zelenym zvyraznenim |
| P01 — Homepage | `/` | Header — prepinac jazyka CZ/EN | OK | Pritomny, dropdown funguje, prepinani funkcni |
| P01 — Homepage | `/` | Header — tlacitko "Upload Model" | OK | Zelene, citelny text, dobry kontrast |
| P01 — Homepage | `/` | Header — "Account" dropdown | OK | Zobrazuje Account + Sign Out moznosti |
| P01 — Homepage | `/` | Hero — badge "STATUS: PRINTING" | OK | Zeleny, viditelny |
| P01 — Homepage | `/` | Hero — hlavni nadpis | OK | Citelny text na tmatem pozadi |
| P01 — Homepage | `/` | Hero — podtext / subtext | OK | Svetlejsi seda, citelne |
| P01 — Homepage | `/` | Hero — teal/cyan dekorativni podtrzeni pod nadpisem | OK | Vizualne pritomne |
| P01 — Homepage | `/` | Feature bar scrolling — "Trusted by 120+ print farms", Multi-tenant, atd. | OK | Zobrazuje se, text citelny |
| P01 — Homepage | `/` | Sekce "What is ModelPricer?" | OK | Citelna, spravne formatovana |
| P01 — Homepage | `/` | Stats sekce — 8s, 60%, 24/7 | OK | Tri statistiky se zobrazuji spravne |
| P01 — Homepage | `/` | "How It Works" — 4 karty s ikonami a popisy | OK | Vsechny karty zobrazeny, ikony pritomne |
| P01 — Homepage | `/` | "Capabilities" — 4 karty | OK | Vsechny karty zobrazeny spravne |
| P01 — Homepage | `/` | "Pricing Plans" — 3 plany (Starter $20, Professional $80, Enterprise Custom) | OK | Vsechny tri plany zobrazeny |
| P01 — Homepage | `/` | FAQ — 3 otazky expand/collapse | OK | Rozbalovani funguje, ikona se meni + (zelena) → × (oranzova) |
| P01 — Homepage | `/` | FAQ — odkaz "View All Questions →" | OK | Spravne vede na /support |
| P01 — Homepage | `/` | Footer — logo, v3.2, socialni ikony, navigacni a pravni odkazy | OK | Vsechny prvky pritomne (socialni ikony nefunkcni — viz BUG-002) |
| P01 — Homepage | `/` | CTA "Try Starter" → /register | OK | Navigace funguje |
| P01 — Homepage | `/` | CTA "Start Professional" → /register | OK | Navigace funguje |
| P01 — Homepage | `/` | CTA "Contact Us" → /support | OK | Navigace funguje |
| P01 — Homepage | `/` | CTA "Upload Model" → /test-kalkulacka | OK | Navigace funguje |
| P01 — Homepage | `/` | Language switcher CZ/EN — funkcni prepinani | OK | Prepinani jazyka funguje |
| P02 — Pricing | `/pricing` | Nacteni stranky bez bile obrazovky | OK | Konzole cista |
| P02 — Pricing | `/pricing` | Hero / Stats sekce s nadpisem a 3 badge | OK | Zobrazuje se spravne |
| P02 — Pricing | `/pricing` | 3 pricing karty: Starter (Free), Professional (€49/mes Doporuceno), Enterprise (Custom) | OK | Vsechny tri zobrazeny |
| P02 — Pricing | `/pricing` | CTA "Try Starter" → /register | OK | Navigace funguje |
| P02 — Pricing | `/pricing` | CTA "Start Professional" → /register | OK | Navigace funguje |
| P02 — Pricing | `/pricing` | CTA "Contact Us" → /support | OK | Navigace funguje |
| P02 — Pricing | `/pricing` | FAQ — 4 kategorie tabu (Getting Started, Pricing, Technical, Account) | OK | Vsechny 4 taby fungují |
| P02 — Pricing | `/pricing` | FAQ — kazda kategorie ma 3 otazky, expand/collapse funguje CZ i EN | OK | Testovano v obou jazycich |
| P02 — Pricing | `/pricing` | CTA strip — "Start free" a "Contact" tlacitka | OK | Obe tlacitka fungují |
| P02 — Pricing | `/pricing` | Text kontrast WCAG AA | OK | Overeno vizualne |
| P02 — Pricing | `/pricing` | Scroll-to-top tlacitko | OK | Funguje spravne |
| P02 — Pricing | `/pricing` | Footer navigacni odkazy | OK | Fungují (krome /privacy, /terms — viz BUG-011/012) |
| P02 — Pricing | `/pricing` | Design konzistentni s Forge systemem | OK | Zadne designove odchylky od zbytku aplikace |
| P03 — Support | `/support` | Nacteni stranky | OK | Strana se nactla bez bile obrazovky |
| P03 — Support | `/support` | FAQ kategorie | OK | Kategorie se zobrazuji |
| P03 — Support | `/support` | Kontaktni informace | OK | Zobrazeny |
| P03 — Support | `/support` | Footer pritomny | OK | Stejna struktura jako ostatni verejne stranky |
| P04 — Model Upload | `/model-upload` | Nacteni stranky bez bile obrazovky | OK | Dark theme, heading "UPLOAD 3D MODEL" se zobrazi spravne |
| P04 — Model Upload | `/model-upload` | Dropzone s dashed border a upload ikonou | OK | "DRAG & DROP YOUR MODELS HERE" viditelne |
| P04 — Model Upload | `/model-upload` | "browse from your device" odkaz spousti file picker | OK | Systemovy dialog pro vyber souboru se otervre |
| P04 — Model Upload | `/model-upload` | 4 karty formatu souboru (.STL, .3MF, .OBJ, .STEP s "SOON" badge) | OK | Vsechny 4 karty zobrazeny, STEP ma badge SOON |
| P04 — Model Upload | `/model-upload` | Max 100MB per soubor, multiple files | OK | Limit zobrazen, vice souboru podporovano |
| P04 — Model Upload | `/model-upload` | Skeleton loading pri prvnim nacteni | OK | Loading skeleton se zobrazi a mizí po nacteni |
| P04 — Model Upload | `/model-upload` | Prepinac jazyka CZ/EN — heading a hlavni texty | OK | Hlavni obsah stranky se prelozi (krome karet formatu — BUG-017) |
| P05 — Order Tracking | `/track` | Nacteni stranky — teal 3D box ikona, heading "ORDER TRACKING" | OK | Stranka se nacte spravne, design konzistentni |
| P05 — Order Tracking | `/track` | Formular: Order ID input + Email input + "TRACK ORDER" button | OK | Oba vstupy pritomny, tlacitko funkcni |
| P05 — Order Tracking | `/track` | Validace prazdneho Order ID → "Please enter an order ID" | OK | Chybova zprava se zobrazi okamzite |
| P05 — Order Tracking | `/track` | Validace prazdneho Email → "Please enter your email" | OK | Chybova zprava se zobrazi okamzite |
| P05 — Order Tracking | `/track` | Neplatna objednavka → "Order not found." s cervenim bannerem | OK | Chybny stav vizualne odlisen |
| P05 — Order Tracking | `/track` | Prepinac jazyka — heading a hlavni tlacitko se prelozi | OK | "ORDER TRACKING" → "SLEDOVANI OBJEDNAVKY" v CZ |
| P06 — 404 stranka | `/some-nonexistent-page` | Velky "404" text v teal barve | OK | Vizualne dominantni, citelny |
| P06 — 404 stranka | `/some-nonexistent-page` | "Page Not Found" heading | OK | Spravny text, citelny |
| P06 — 404 stranka | `/some-nonexistent-page` | Badge s pokusenou URL cestou | OK | Zobrazuje konkretni neexistujici cestu |
| P06 — 404 stranka | `/some-nonexistent-page` | "Go Home" button → / funguje | OK | Navigace na homepage spravna |
| P06 — 404 stranka | `/some-nonexistent-page` | "Go Back" button → browser history funguje | OK | Browser back funguje |
| P06 — 404 stranka | `/some-nonexistent-page` | Shortcut stranky (Calculator, Pricing, Support, Admin Panel) | OK | Vsechny 4 linky fungují, Admin Panel jen pro prihlasene |
| P06 — 404 stranka | `/some-nonexistent-page` | Prepinac jazyka — "Stranka nenalezena", "Zpet na uvod" atd. | OK | CZ preklad 404 stranky funguje spravne |
| P07 — Login | `/login` | Prihlaseny uzivatel presmerovan na /admin | OK | Spravne chovani — zabranuje zbytecnemu zobrazeni login formulare |
| P08 — Register | `/register` | Prihlaseny uzivatel presmerovan na /admin | OK | Spravne chovani — zabranuje opetovne registraci |

---

## Auth stranky

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| P07 — Login | `/login` | Presmerovani prihlaseneho uzivatele na /admin | OK | Redirect funguje spravne |
| P08 — Register | `/register` | Presmerovani prihlaseneho uzivatele na /admin | OK | Redirect funguje spravne |
| P09 — Forgot Password | `/forgot-password` | | Neovereno | |

## Uzivatelsky portal

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| P-Account — Account | `/account` | Nacteni stranky, 4 taby (Profile, Company, Security, Billing) | OK | Stranka se nacte, taby viditelne a klikatelne |
| P-Account — Account | `/account` | Profile tab: Avatar s inicialy se aktualizuje reaktivne | OK | Zmen jmena → iniciale se okamzite zmeni |
| P-Account — Account | `/account` | Profile tab: First Name, Last Name editovatelne a ulozitelne | OK | Ulozeni funguje, toast se zobrazi |
| P-Account — Account | `/account` | Profile tab: Email pole je read-only s popiskem pro Firebase console | OK | Spravne — email nemuze byt meneni pres UI |
| P-Account — Account | `/account` | Company tab: Vsechna pole editovatelna (Nazev, ICO, DIC, Adresa, Mesto, PSC, Stat) | OK | Dvousloupcovy layout, vsechna pole funkcni |
| P-Account — Account | `/account` | Security tab: Change Password s indikátorem sily hesla (weak/medium/good) | OK | Indikator se meni spravne |
| P-Account — Account | `/account` | Security tab: Validace hesla — prilis slabe, neshoda hesel | OK | Chybove zpravy se zobrazuji spravne |
| P-Account — Account | `/account` | Security tab: Aktivni sessions — zobrazuje realna data "Windows PC - Chrome / Prague" | OK | Real data ze zarizeni uzivatele |
| P-Account — Account | `/account` | Billing tab: Aktualni plan "Starter Plan / ACTIVE / 499 Kc/mesic" | OK | Stav predplatneho zobrazen |
| P-Account — Account | `/account` | Prepinac jazyka CZ/EN funguje | OK | Stranky se prelozi (diakriticka nekompletni — BUG-034) |
| P-Invite — Invite Accept | `/invite/accept` | Stranka se nacte, zobrazi kartu "Accept Invite / MODELPRICER TEAM" | OK | Zakladni nacteni funguje |
| P-Invite — Invite Accept | `/invite/accept` | Bez tokenu → cervena chyba "Missing invite token" | OK | Spravna validace |
| P-Invite — Invite Accept | `/invite/accept` | S neplatnym tokenem → "Invalid or expired invite" | OK | Spravna validace expiraceho nebo spatneho tokenu |

---

## Kalkulacky

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 1: upload souboru | Neovereno | |
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 2: volba parametru | Neovereno | |
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 3: naceneni | Neovereno | |
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 4: checkout formular | Neovereno | |
| P09 — Test Kalkulacka | `/test-kalkulacka` | Krok 5: potvrzeni objednavky | Neovereno | |
| P10 — Widget | `/w/:id` | Zobrazeni widgetu | Neovereno | |
| P10 — Widget | `/w/:id` | Cena se vypocita | Neovereno | |

---

## Admin stranky

| Stranka (ID) | URL | Funkce / Prvek | Stav | Poznamky |
|--------------|-----|----------------|------|----------|
| A01 — Dashboard | `/admin` | 2026-03-18 | Castecne | Stats karty, sidebar, theme toggle, language switch, command palette, notifications, recent orders, quick actions. Bugy: modal pod viewport (BUG-044 P0), analytics 404 (BUG-045). |
| A02 — Orders | `/admin/orders` | Nacteni stranky, tabulka objednavek | OK | Sloupce: Order, Customer, Date, Items, Material, Status, Total |
| A02 — Orders | `/admin/orders` | Kanban pohled — prepinac | OK | Kartove sloupce: NEW / IN PRODUCTION / READY / DELIVERED / CANCELLED |
| A02 — Orders | `/admin/orders` | Filter panel (Status, Material, Date Range) | OK | Vsechny filtry funkcni |
| A02 — Orders | `/admin/orders` | Search bar, razeni sloupcu | OK | Vyhledavani a sort (ascending/descending) funguje |
| A02 — Orders | `/admin/orders` | Hromadny vyber — checkbox + select all | OK | Individualni i hromadny vyber radku funguje |
| A02 — Orders | `/admin/orders` | Bulk Export (CSV/PDF/Excel) + Bulk Delete s confirm | OK | Obe akce dostupne a funkcni |
| A02 — Orders | `/admin/orders` | Klik na radek → navigace na Order Detail | OK | Navigace na /admin/orders/:id funguje |
| A02 — Orders | `/admin/orders` | Konzole | OK | Cista — zadne chyby ani varovani |
| A03 — Order Detail | `/admin/orders/:id` | Status update dropdown | OK | Zmena stavu objednavky funguje |
| A03 — Order Detail | `/admin/orders/:id` | Tab navigace (Items/Files/Customer/Shipping) | OK | Vsechny 4 taby funkcni |
| A03 — Order Detail | `/admin/orders/:id` | Customer tab, Items tab, Shipping tab | OK | Informace, polozky/ceny, adresa — vse zobrazeno spravne |
| A03 — Order Detail | `/admin/orders/:id` | Tlacitko Zpet, Export CSV | OK | Navigace zpet i export funguje |
| A04 — Analytics | `/admin/analytics` | Grafy | Neovereno | |
| A05 — Pricing | `/admin/pricing` | 2026-03-18 | Castecne | 5 tabu, stats header, materials karta-grid, sort buttons, add/duplicate material, save banner, print time, pricing rules, discounts, preview sandbox, reset to defaults, export/import JSON. Bugy: delete nefunkcni (BUG-046), slug (BUG-047), validation clear (BUG-048). |
| A06 — Fees | `/admin/fees` | 2026-03-18 | Castecne | Fee list, add/edit/delete, modal 5 tabs, preview simulator, CZ/EN switch, delete confirm dialog. Bugy: zaporny vstup, Supabase RLS, 2 i18n labely. |
| A07 — Parameters | `/admin/parameters` | 2026-03-18 | Castecne | Overview, Library (319 params, filtr/search, save/reset, group actions), Widget, Validation (placeholder). CZ/EN plne. Bugy: Validation tab click, Widget Reset, tichy zahoz zmen, per-param reset pocitadlo. |
| A08 — Presets | `/admin/presets` | 2026-03-18 | Castecne | Nacteni, ONLINE badge, sablony (6 ks), preset karty, search, pagination, CZ/EN plne. Bugy: BUG-049 (template hodnoty prazdne P1), BUG-050 (delete dialog off-viewport P2). |
| A-Express — Express Delivery | `/admin/express` | 2026-03-18 | OK | Plne funkcni — zero bugs. Viz detail sekce nize. |
| A15 — Shipping | `/admin/shipping` | 2026-03-18 | OK | Plne funkcni — zero bugs. Viz detail sekce nize. |
| A09 — Branding | `/admin/branding` | | Neovereno | |
| A10 — Widget | `/admin/widget` | | Neovereno | |
| A11 — Team | `/admin/team` | | Neovereno | |
| A12 — Customers | `/admin/customers` | 2026-03-18 | OK | ZERO BUGS. Nejlepe otestovana stranka. Viz detail sekce nize. |
| A13 — Integrations | `/admin/integrations` | | Neovereno | |
| A14 — Coupons | `/admin/coupons` | 2026-03-18 | Castecne | Tabulka kuponu, CRUD operace, vyhledavani, prepinani stavu, CZ/EN preklad. Bug: BUG-051 (native select P3). |
| A15 — Shipping | `/admin/shipping` | | Neovereno | |
| A16 — Print Queue | `/admin/print-queue` | | Neovereno | |
| A17 — System Health | `/admin/system-health` | | Neovereno | |
| A18 — Webhooks | `/admin/webhooks` | | Neovereno | |
| A19 — Activity Log | `/admin/activity-log` | | Neovereno | |
| A20 — Settings | `/admin/settings` | | Neovereno | |
| A21 — Emails | `/admin/emails` | | Neovereno | |
| A22 — Account | `/admin/account` | | Neovereno | |

---

## Detail — Admin Dashboard (A01)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Nacteni stranky | Stranka se nacte, stats karty jsou viditelne okamzite |
| Stats karty | Today's Revenue, Orders, Pending Action, Active Prints — vsechny 4 zobrazeny spravne |
| Sidebar — navigace | Vsechny sekce se daji rozbalit/sbalit, vsechny odkazy naviguje spravne |
| Theme toggle | Dark/light prepinani funguje a persists po reloadu |
| Language switch CZ/EN | Prepinani jazyka funguje na Dashboard strance |
| Command palette (Ctrl+K) | Otevre se, vyhledavani funguje, zobrazuje 22 stranek + 7 akci, klavesnicova navigace (sipky, Enter, Escape) funguje |
| Notifications bell | Klik otevre notification panel |
| Recent orders | Sekce nedavnych objednavek je zobrazena se status badges |
| Quick action "All orders" | Klik naviguje spravne na /admin/orders |
| Konzole | Cista — zadne JS chyby ani varovani |

---

## Detail — Admin Pricing (A05)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Nacteni stranky | Stranka se nacte, 5 tabu viditelnych |
| Stats header | RATE, MARKUP, MIN ORDER, ROUND, MATERIALS — vsechny hodnoty spravne zobrazeny |
| Materials tab — karta grid | Mrizka karet materialu se vyrenderuje spravne |
| Sort buttons | Razeni dle Name, Type, Price, Status funguje |
| Add Material dialog | Tlacitko "Add Material" otevre dialog se vsemi poli |
| Material type selector | Dropdown pro volbu typu materialu funguje |
| Color picker | Vyber barvy materialu funguje |
| Duplicate material | Tlacitko duplikace funguje a vytvori kopii materialu |
| Save — zeleny banner | Po ulozeni zobrazi zeleny banner "Saved." |
| Unsaved / Saved badge | Badge v headeru spravne prepina mezi "Unsaved changes" a "Saved." |
| Print Time tab | Hourly rate input a min billed time input funguje |
| Pricing Rules tab | Min price per order, rounding nastaveni funguje |
| Discounts tab | Pridavani/mazani volume discount tiers funguje |
| Preview tab | Pricing sandbox se vypocitava live pri zmene vstupnich hodnot |
| Reset to defaults | Zobrazi banner "Settings reset to defaults.", statistiky se resetuji |
| Export JSON | Zkopiruje konfiguraci do schranky, zobrazi "Copied to clipboard." |
| Import JSON | Otevre window.prompt() pro vkladani JSON |
| Language switch CZ/EN | Prepinani jazyka funguje |
| Edge case — 0 Kc/g | Hodnota 0 je akceptovana |
| Edge case — velka cisla | Velka cisla jsou akceptovana |
| Edge case — negativni | Negativni hodnoty jsou tichy zahozeny (chraneni pred spatnymi hodnotami) |
| Konzole | Cista — zadne JS chyby ani varovani |

---

## Detail — Admin Fees (A06)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Fee list | 7 fees zobrazeno, rozdeleno do 4 kategorii (Setup, Material, Processing, Shipping), kazda s badge poctem |
| Stats bar | ACTIVE FEES, MODEL FEES, ORDER FEES, SAMPLE ORDER IMPACT — spravne pocty (7, 3, 4, 549.00 Kc) |
| Pridat fee (+New fee) | Modal se otevre, 5 zalozek: Basics, Calculation, Widget, Conditions, Preview |
| Edit fee | Klik na nazev fee otevre edit modal se spravne naplnenymi hodnotami |
| Delete fee | Trash ikona → confirm dialog "Delete fee?" s Cancel/Delete (red) → spravne smazano |
| Fee modal — Basics | NAME, DESCRIPTION, FEE TYPE (6 options), SCOPE (MODEL/ORDER), CHARGE BASIS, ACTIVE toggle |
| Fee modal — Calculation | VALUE input, UNIT select (Kc, %, Kc/g...) |
| Fee modal — Preview | Plny simulator: MATERIAL, QUALITY, SUPPORTS, INFILL%, FILAMENT, TIME, VOLUME, SURFACE, QUANTITY, PERCENT BASE, MODEL SELECTED — vykresli vyslednou cenu |
| Fee modal — Conditions | AND podminkove radky s KEY/OP/VALUE — pridavani podminek funkci |
| Save / SAVED stav | Po Save button: zeleny "SAVED" pill v headeru, "Saved" toast notifikace |
| CZ/EN switch | Plny preklad — Poplatky a slevy, Sprava poplatku, Novy poplatek, Ulozit, Vzory a dalsi |
| Fee search | Vyhledavani v liste fees pracuje spravne (live filter) |
| Filter All/Required | Filtrovani podle pozadovanych/volitelenych fees funguje |
| Filter All/MODEL/ORDER | Filtrovani podle scope funguje |
| Drag and drop reorder | Drag handle (6 tecek) je pritomen pro reorder |
| Negative fees | Aplikace akceptuje negativni hodnoty (programaticky) — zobrazi "-25.00 Kc" cervenou |

## Detail — Admin Parameters (A07)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Overview tab | Printer Profile (Prusa MK4S), BUILD VOLUME, NOZZLE select, LAYER HEIGHT slider (0.05-0.35mm), TEMPERATURE PRESETS (PLA/PETG/ASA/TPU/PC), Recent Changes — vse funguje |
| Parameter Library — nacitani | 319/319 params nacte spravne, rozdelen do 13 skupin (Advanced, Extruders, Extrusion Width, Fuzzy Skin, Infill, Ironing, Layers and Perimeters...) |
| Skupinove akcni tlacitka | Enable/Disable/Reset pro celou skupinu — funguje spravne |
| Expand/collapse skupin | Klik na skupinu rozbaluje/sbaluje seznam parametru |
| Per-param hodnota | Kazdy param ma value input, reset ikonku, toggle Active/Inactive, type/level badges |
| "changed" badge | Po zmene hodnoty param dostane teal "changed" badge a teal border kolem inputu |
| "N params / N Changed" | Skupina v headeru spravne ukazuje pocet zmenych parametru uvnitr skupiny |
| Save changes | "Unsaved changes (N)" → klik Save → "Saved" (green pill), Supabase bez RLS chyby (na rozdil od Fees) |
| Global Reset button | Confirm dialog "Reset all parameters? This is destructive." s Cancel/Reset — spravna destruktivni UX |
| Filtr Changed | Zobrazuje pouze zmenene parametry, aktualizuje pocitadlo na "N / 319 PARAMS", Clear button |
| Filtr Active/Inactive | Filtrovani podle stavu funguje |
| Search | Live vyhledavani — "layer" → 33/319 params okamzite |
| Widget tab | Per-param widget konfigurace s WIDGET LABEL, HELP TEXT, ALLOWED VALUES, INPUT TYPE, READ-ONLY, "In widget" toggle |
| Validation tab (direct URL) | `/admin/parameters/validation` nacte stranku spravne — placeholder "rule engine will be added later" |
| Presets button | Naviguje na `/admin/presets` (cista stranka, "No presets yet") |
| CZ/EN switch | Plny preklad — Parametry, Knihovna Parametru, Widget parametry, Validace, Presety, Ulozit zmeny, Zapnout/Vypnout/Reset, Aktivni/Neaktivni/Zmenene, vse bez chybejicich klicu |
| Per-param reset ikonka | Kruhovava sipka vraci hodnotu na default, "changed" badge zmizi, filtr Changed snizi pocet — spravne |
| "Reset all to defaults" button | Viditelne tlacitko s potvrzovacim dialogem (Cancel + Reset red) |

## Globalni prvky

| Prvek | Kde | Stav | Poznamky |
|-------|-----|------|----------|
| Navigace — Header | Verejne stranky (P01, P02, P03) | OK | Logo, navigace, Upload Model, Account, jazykovy prepinac — otestovano na P01 a P02 |
| Navigace — Footer | Verejne stranky (P01, P02, P03) | Castecne | Struktura OK, ale /privacy a /terms vraci 404 (BUG-003/004), socialni ikony nefunkcni (BUG-002) |
| Admin Sidebar | Admin stranky | OK | Overeno na A01 Dashboard — vsechny sekce, vsechny odkazy |
| Admin — Command Palette | Admin (Ctrl+K) | OK | Overeno na A01 — 22 stranek + 7 akci, vyhledavani, klavesnicova nav |
| Admin — Theme toggle | Admin (dark/light) | OK | Overeno na A01 — prepinani funguje a persists |
| Admin — Notification center | Admin | OK | Overeno na A01 — bell otevre notification panel |
| i18n — prepinac jazyka CZ/EN | Vsude (P01, P02, P04, P05, P06, P-Account) | Castecne | Funguje na vsech testovanych strankach. Globalni problemy: Upload Model button, Footer Home (BUG-016/018/024/025) |
| Toast notifikace | Vsude | Neovereno | |
| Offline banner | Vsude | Neovereno | |
| PWA install banner | Chrome | Neovereno | |

## Detail — Admin Presets (A08)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Nacteni stranky | Stranka se nacte s nadpisem "Presets" a zelenym odznakem ONLINE (slicer backend dostupny) |
| Podnadpis | "Manage presets (.ini) — print parameters for calculator and widget." |
| Akce v hlavicce | Upload preset (rozbaluje inline upload zonu), Export all, Import (otevre modal), Refresh, Compare (zobrazi kdyz jsou 2+ presety vybrane) |
| Preset Templates accordion | 6 sablon: PLA Quality 0.2mm, PLA Fine 0.15mm, PLA Draft 0.3mm, PETG Quality, ABS Quality, TPU Quality — vsechny zobrazeny |
| Sablona — material a tier badge | Kazda sablonova karta zobrazuje material badge a tier badge |
| Sablona — hodnoty parametru | LAYER / INFILL / SPEED / TEMP / BED / SUPPORTS hodnoty viditelne na kartach sablon |
| Preset karty | Nazev, ID, hodnoty parametru, akcni lista (Edit, Duplicate, Set Default, Archive, Download, Share, Delete) |
| Odznaky "Default" a "Active" | Zobrazuji se spravne na odpovidajicich presetech |
| Drag handle pro razeni | Ikona drag handle je pritomna na kazde karte |
| Expand / collapse per karta | Rozbalovani a sbalovani jednotlivych karet funguje |
| Search bar | Filtrovani presetu podle nazvu funguje |
| Strankovani | Zobrazi pocet X/Y |
| Jazyk CZ — plna pokrytost | "Presety", "Sablony presetu", labely parametru: VRSTVA/INFILL/RYCHLOST/TEPLOTA/POSTEL/PODPORY |
| Konzole | Cista — zadne chyby ani varovani |
| Design | Konzistentni Forge dark theme |

---

## Detail — Admin Express Delivery (A-Express)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Nacteni stranky | Stranka se nacte s nadpisem "Express Delivery" |
| Dvoupanelovy layout | Leva strana = seznam tiers, prava strana = editor tier |
| 3 vychozi tiery | Standard (+0%), Express (+25%), Rush (+50%) — vsechny zobrazeny |
| Zvyrazneni aktivniho tieru | Aktivni tier je vizualne zvyrazneny, editor se naplni po vyberu |
| Editor tier — pole | Nazev, typ prikazu (Percent/Fixed CZK), hodnota prikazu, min/max dni doruceni, popis, toggle aktivni — vse funkcni |
| Ulozeni | Odznak "Saved" se zobrazi po ulozeni |
| Zahozeni zmen | Confirm dialog se spravne zobrazuje ve stredu viewportu (portal rendering funguje) |
| Pridani tieru | Vytvori novy prazdny tier, editor se otevre |
| Smazani tieru | Confirm dialog ve stredu viewportu, smazani odebere tier |
| Sledovani "dirty" stavu | Odznak "Unsaved changes" / "Saved" funguje spravne |
| Nastaveni upsell | Sekce s togglem |
| Nahled pro zakaznika | Live preview se reaktivne aktualizuje |
| Reaktivni odznak prikazu | Zmena z Percent na Fixed aktualizuje zobrazenou hodnotu (napr. "+50%" → "+50.00 CZK") |
| Jazyk CZ — plna pokrytost | "Expresni doruceni", formulare v cestine |
| Konzole | Cista — zadne chyby ani varovani |
| Design | Cisty dvoupanelovy layout, konzistentni Forge dark theme |

---

## Detail — Admin Shipping (A15)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Nacteni stranky | Stranka se nacte s nadpisem "Shipping" / "Doprava" |
| Dvoupanelovy layout | Leva strana = seznam metod + bezplatne doruceni + zony, prava strana = editor metody |
| 2 vychozi metody | Fixed-price a osobni odber — obe zobrazeny |
| Zvyrazneni aktivni metody | Aktivni metoda je vizualne zvyraznena |
| Toggle bezplatneho doruceni | Toggle + input pro minimalni hodnotu objednavky |
| Prepravni zony | 3 zony (CZ, SK, EU) s checkbox prepinaci, CZ+SK vychozi aktivni |
| Editor metody — 2 taby | Zakladni | Zony |
| Tab Zakladni | Nazev metody, selektor typu (Fixed/Osobni odber), zakladni cena, priplatek za kg, min/max dni doruceni, popis, toggle aktivni |
| Typ "Osobni odber" | Spravne skryva pole Zakladni cena a Priplatek |
| Tab Zony | Vstupy pro prepisovani ceny per zona pro aktivni zony, reaktivni (aktivace EU zony ji prida) |
| Pridani metody | Vytvori novou, editor se otevre |
| Smazani metody | Confirm dialog ve stredu viewportu (portal funguje), smazani odebere metodu |
| Sledovani "dirty" stavu | "Unsaved changes" / "Saved" funguje spravne |
| Jazyk CZ — plna pokrytost | "Doprava", "Metody doruceni", "Bezplatne doruceni", "Prepravni zony" |
| Konzole | Cista — zadne chyby ani varovani |
| Design | Dvoupanelovy layout kopiruje Express — konzistentni admin UX |

---

## Detail — Admin Coupons (A14)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Nacteni stranky | Stranka se nacte, tabulka kuponu zobrazena spravne |
| Tabulka sloupcu | Code, Type, Value, Min. Order, Valid From/Until, Usage, Status — vsechny sloupce zobrazeny |
| Tlacitko Add Coupon | Otevre modal se vsemi poli |
| Vstup pro kuponovy kod | Funguje spravne |
| Vyber typu slevy | percent, fixed, free_shipping, combined — vsechny moznosti dostupne |
| Vstup hodnoty slevy | Funguje |
| Vstup minimalni hodnoty objednavky | Funguje |
| Limity pouziti (Max uses / per zakaznika) | Funguje |
| Date pickers (Valid From / Valid Until) | Kalendar se otevre, datum lze vybrat |
| Ulozeni kuponu | Kupon se objevi v tabulce |
| Editace kuponu (ikona tuzky) | Modal predvyplnen aktualnimi daty |
| Smazani kuponu (ikona kose) | Kupon odstranen ze seznamu |
| Vyhledavani / filtrovani | Vyhledavaci panel funkcni |
| Prepinani stavu Active/Inactive | Funguje |
| Jazyk CZ/EN | Plna CZ pokryti — vsechny labely prelozeny spravne |
| Konzole | Cista — zadne chyby ani varovani |
| Design | Forge dark theme, teal akcenty, spravne rozestupe |

---

## Detail — Admin Orders (A02) + Order Detail (A03)

### Co funguje spravne

| Funkce | Detail |
|--------|--------|
| Nacteni stranky | Stranka se nacte, seznam objednavek zobrazen |
| Tabulkovy pohled (default) | Sloupce Order, Customer, Date, Items, Material, Status, Total |
| Kanban pohled | Prepinac funguje — kartove sloupce NEW / IN PRODUCTION / READY / DELIVERED / CANCELLED |
| Prepinani pohledu | Oba smery (tabulka <-> kanban) funguje |
| Filter panel | Status, Material, Date Range filtry pritomne a funkcni |
| Vyhledavani | Live vyhledavani pracuje spravne |
| Razeni sloupcu (Status klik) | Ascending/descending prepinani funguje |
| Hromadny vyber — jednotlive checkboxy | Individualni radky lze zaznacit |
| Hromadny vyber — select all | Vsechny radky najednou |
| Bulk Export | Rozbalovaci menu s CSV/PDF/Excel moznostmi |
| Bulk Delete | Confirm dialog se zobrazi pred smazanim |
| Klik na objednavku | Naviguje na /admin/orders/:id |
| Order Detail — status update | Dropdown pro zmenu stavu funguje |
| Order Detail — taby | Items / Files / Customer / Shipping — vsechny 4 taby funkcni |
| Order Detail — Customer tab | Informace o zakaznikovi spravne zobrazeny |
| Order Detail — Items tab | Polozky, mnozstvi a ceny zobrazeny |
| Order Detail — Shipping tab | Adresa doruceni zobrazena |
| Order Detail — Zpet | Navigace zpet na seznam |
| Export CSV | Tlacitko funkcni |
| Jazyk CZ | Nadpis stranky "Objednavky" se prelozi (hlavicky tabulky ne — BUG-052) |
| Status badges | Vizualne odlisene barevnym kodem |
| Konzole | Cista — zadne chyby ani varovani |
| Design | Forge dark theme, status badges dobre provedene, konzistentni layout |

---

## Detail — Admin Customers (A12)

### Co funguje spravne

> Tato stranka je nejlepe otestovana stranka v projektu — nulova chybovost.

| Funkce | Detail |
|--------|--------|
| Nacteni stranky | Stranka se nacte spravne |
| Stats karty | Total Customers (3), New This Month (3), Avg. Lifetime Value (729.08 Kc), Repeat Customer Rate (33%) |
| Tabulka zakazniku | Sloupce: Customer, Phone, Segment, Orders, Total Spent, Avg. Order, Last Order |
| Vyhledavani | "Roman" → 1 vysledek, X clear resetuje — funguje |
| Filter taby | All(3) / New(3) / Regular(0) / VIP(0) — vsechny fungují |
| Rozbaleni radku zakaznika (chevron) | Otevre inline stats panel: Total Orders, Total Spent, Average Order, Favorite Material, Order Frequency, First Order |
| Kontaktni akce — kopirovat email | Email Copy button kopiruje do schranky |
| Kontaktni akce — kopirovat telefon | Phone Copy button kopiruje do schranky |
| ORDER HISTORY | Sekce v rozbalenem radku zobrazuje historii s status badges |
| Poznamky — pridani | "+ Add" otevre textarea, text se ulozi a zobrazi s Edit tlacitkem |
| Persistence poznamek | Poznamka prezije collapse/re-expand radku |
| Razeni sloupcu | ORDERS ascending/descending funguje, TOTAL SPENT sort funguje |
| Export CSV | Tlacitko viditelne a klikatelne |
| Jazyk CZ | PLNA pokryti — "Zakaznici", vsechny stat labely, hlavicky tabulky, filter taby, tlacitka, segment badges |
| Konzole | Cista — zadne chyby ani varovani |
| Design | Forge dark theme, teal segment badges (NEW), avatary s inicialy, spravne rozestupe |

---

*Soubor vytvoren: 2026-03-18 | Aktualizovan: 2026-03-18 (davka 6 — A14/Coupons, A02+A03/Orders, A12/Customers detailni sekce pridany)*
