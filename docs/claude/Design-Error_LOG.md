# Design Error Log — ModelPricer / Pricer V3

> Dokumentace design nesrovnalosti, Forge token poruseni, WCAG problemu a vizualnich bugu.

---

## Format zaznamu

```
### [DATUM] [KATEGORIE] Kratky popis
- **Kde:** soubor:radek
- **Symptom:** Co se deje spatne
- **Pricina:** Proc se to deje
- **Oprava:** Co by se melo udelat
- **Pouceni:** Pattern pro budoucnost
```

**Kategorie:** `[FONT]` `[COLOR]` `[WCAG]` `[SPACING]` `[RESPONSIVE]` `[INLINE-STYLE]` `[TOKEN]` `[LAYOUT]`

---

## Zaznamy

### [2026-02-13] [FONT] NotFound.jsx heading hierarchie — h2 misto h1
- **Kde:** `src/pages/NotFound.jsx:53`
- **Symptom:** Nadpis "Page Not Found" pouziva `<h2>` misto `<h1>`. Stranka je top-level page bez jineho h1 elementu.
- **Pricina:** Mozna puvodne zamysleno ze Header obsahuje h1 — ale Header pouziva `<header>` element bez h1 tagu.
- **Oprava:** Zmenit `<h2 style={titleStyle}>` na `<h1 style={titleStyle}>` a pridat `aria-hidden="true"` na dekorativni "404" div.
- **Pouceni:** Kazda stranka by mela mit prave jeden `<h1>`. Pro dekorativni velke texty pouzivat `<div>` s `aria-hidden`.

### [2026-02-13] [WCAG] NotFound.jsx chybejici ARIA atributy a document title
- **Kde:** `src/pages/NotFound.jsx` (cela komponenta)
- **Symptom:** Zadne ARIA atributy, document title se nemeni (zustava z predchozi stranky), dekorativni "404" neni oznacen jako `aria-hidden`.
- **Pricina:** Accessibility nebylo v puvodni implementaci zohledneno.
- **Oprava:** (1) Pridat `useEffect` pro `document.title = '404 | ModelPricer'`. (2) Pridat `aria-hidden="true"` na "404" div. (3) Zvazit `role="main"` nebo `<main>` wrapper.
- **Pouceni:** 404 stranky casto opomijeji accessibility protoze jsou "okrajove" — ale mohou byt casto navstevovane (broken linky, crawlery).

### [2026-02-13] [INLINE-STYLE] Pricing page — dead import ForgeSquiggle
- **Kde:** `src/pages/pricing/index.jsx:4`
- **Symptom:** `ForgeSquiggle` je importovana ale nikde nepouzita v JSX stranky.
- **Pricina:** Pravdepodobne zbytek z drive, kdy byl squiggle zamyslen jako dekorace pod nadpisem.
- **Oprava:** Odstranit neuzivany import na radku 4.
- **Pouceni:** Pri refactoru stranky vzdy overit ze vsechny importy jsou skutecne pouzite. ESLint `no-unused-vars` by toto zachytil.

### [2026-02-13] [TOKEN] ForgePricingCard — hardcoded "Recommended" text bez prekladu
- **Kde:** `src/components/ui/forge/ForgePricingCard.jsx:41`
- **Symptom:** Badge "Recommended" se zobrazuje anglicky i v ceske verzi stranky.
- **Pricina:** Text je hardcoded string, komponenta nema pristup k `useLanguage()` a neprijima `recommendedLabel` prop.
- **Oprava:** (1) Pridat prop `recommendedLabel` s default `'Recommended'`, nebo (2) pridat `useLanguage()` primo do ForgePricingCard a pouzit prekladovy klic `pricing.popular` ktery jiz existuje ("Nejoblibenejsi" / "Most Popular").
- **Pouceni:** Sdilene UI komponenty by mely byt jazykove agnosticke — text by mel prichazet jako prop nebo pres i18n.

### [2026-02-13] [TOKEN] forge-mono-bold definovana duplicitne ve dvou souborech
- **Kde:** `src/styles/forge-typography.css:90` a `src/styles/forge-utilities.css:118`
- **Symptom:** Trida `.forge-mono-bold` je definovana dvakrat s mirne odlisnymi styly. Typography verze nema `color`, utilities verze pridava `color: var(--forge-text-primary)`.
- **Pricina:** Nezavisle pridani do dvou souboru pri rozdeleni Forge CSS.
- **Oprava:** Sjednotit definici do jednoho souboru (preferovane `forge-typography.css` jako kanonicky zdroj pro font tridy) a odstranit druhou.
- **Pouceni:** Pri rozdeleni CSS do vice souboru overit unikatnost selektoru. Duplicitni definice muze vest k neocekavanym kaskadovym efektum.

### [2026-02-13] [WCAG] Home trust strip items — nizky kontrast kvuli opacity 0.6
- **Kde:** `src/pages/home/index.jsx:194`
- **Symptom:** Trust strip polozky (PrusaSlicer CLI, White-label widget, atd.) maji `opacity: 0.6` na textu s barvou `--forge-text-secondary` (#9BA3B0). Vizualne text pusobi vybledne a spatne citelne na malych velikostech (forge-text-sm = 0.75rem = 12px).
- **Pricina:** Inline style `opacity: 0.6` snizuje kontrast. Samotny token `--forge-text-secondary` (#9BA3B0) na `--forge-bg-void` (#08090C) ma kontrast ~8.3:1, ale opacity 0.6 ho snizi na ~5.3:1 — tesne nad WCAG AA pro normalni text, ale pod doporuceny prah pro text 12px.
- **Oprava:** Zvysit opacity na 0.75+ nebo pouzit `--forge-text-muted` (#7A8291, 4.7:1 kontrast) bez dalsi opacity redukce.
- **Pouceni:** Nepouzivat CSS opacity na textu pro snizeni vizualni dulezitosti. Pouzit vhodny color token primo — tokeny jsou navrhovane s ohledem na WCAG.

### [2026-02-13] [LAYOUT] Home Capabilities karty naznacuji klikatelnost ale nejsou interaktivni
- **Kde:** `src/pages/home/index.jsx:311-374` + `src/components/ui/forge/ForgeNumberedCard.jsx:5`
- **Symptom:** Capabilities karty maji hover efekt (glow, translateY -2px, cursor pointer, animovana sipka) diky `.forge-card-interactive`, ale nekliknou se nikam.
- **Pricina:** ForgeNumberedCard vzdy pouziva `.forge-card-interactive` (cursor: pointer, hover translateY, glow shadow). Karty v Capabilities sekci nemaji zadny link ani onClick.
- **Oprava:** Rozlisit v ForgeNumberedCard — pokud neni predana `to`/`onClick` prop, pouzit `.forge-card` (statickou verzi bez cursor pointer a hover animace).
- **Pouceni:** Hover efekty naznacujici interaktivitu (cursor pointer, translateY, sipka) aplikovat jen na skutecne interaktivni elementy. Jinak to zmateni uzivatele (WCAG 3.2.4).

### [2026-02-13] [WCAG] Support stranka — search input bez pristupneho labelu
- **Kde:** `src/pages/support/index.jsx:181-192`
- **Symptom:** Vyhledavaci pole v hero sekci nema `<label>`, `aria-label` ani `aria-labelledby`. Pouze `placeholder` text, ktery neni ekvivalent labelu pro screen readery (placeholder zmizi po zacatku psani a neni spolehlivy pro AT).
- **Pricina:** Pri redesignu na Forge theme byla zachovana vizualni podoba ale opominuta pristupnost.
- **Oprava:** Pridat `aria-label={t('support.search.placeholder')}` na `<input>` element, nebo vytvorit vizualne skryty `<label>` s CSS tridou `sr-only`.
- **Pouceni:** Kazdy formularovy input musi mit pristupny label — `placeholder` neni nahrada za `<label>` nebo `aria-label`.

### [2026-02-13] [WCAG] Support stranka — SVG ikony v Quick Links bez aria-hidden
- **Kde:** `src/pages/support/index.jsx:104-127`
- **Symptom:** Inline SVG ikony (book, video, chat, mail) v quick link kartach a kontaktni sekci nemaji `aria-hidden="true"`. Screen reader muze oznamit prazdny SVG element. Porovnani: `ForgeSquiggle` spravne pouziva `aria-hidden="true"`.
- **Pricina:** Ikony byly definovany inline bez ohledu na pristupnost (dekorativni ucely).
- **Oprava:** Pridat `aria-hidden="true"` na vsechny 4 SVG elementy v objektu `icons`.
- **Pouceni:** Dekorativni ikony (bez informacniho obsahu) musi mit `aria-hidden="true"`. Pokud ikona nese vyznam, pouzit `aria-label` nebo `<title>` uvnitr SVG.

### [2026-02-13] [LAYOUT] Support stranka — Quick link karty vizualne klikatelne ale nefunkcni
- **Kde:** `src/pages/support/index.jsx:207-229`
- **Symptom:** Karty pouzivaji tridu `forge-card-interactive` ktera pridava `cursor: pointer`, hover elevaci a glow efekt. Uzivatel predpoklada ze kliknutim se dostane na prislusny zdroj (dokumentaci, video, chat). Ve skutecnosti karta neni obalena zadnym interaktivnim elementem a kliknuti nedela nic.
- **Pricina:** Vizualni design predbehl implementaci interakce pri redesignu.
- **Oprava:** (1) Pridat `<Link to="...">` wrapper kolem kazde karty, nebo (2) pokud destinace jeste neexistuje, nahradit `forge-card-interactive` za `forge-card` (statickou verzi bez hover efektu a pointer kurzoru).
- **Pouceni:** Vizualni affordance (hover, pointer) musi vzdy odpovidat skutecne interaktivnosti. Neinteraktivni prvky nesmi pouzivat `cursor: pointer` (WCAG 3.2.4 Consistent Identification).

### [2026-02-13] [WCAG] Login — labels nepropojene s inputy pres htmlFor/id
- **Kde:** `src/pages/login/components/LoginForm.jsx:121-133` (email), `138-151` (password)
- **Symptom:** `<label>` elementy pro email a heslo nemaji `htmlFor` atribut a `<input>` elementy nemaji `id`. Kliknuti na text labelu neaktivuje prislusny input. Screen reader nenapoji label s polem.
- **Pricina:** Inline style pristup — labely a inputy jsou vizualne blizko ale semanticky nepropojene.
- **Oprava:** Pridat `htmlFor="login-email"` na email label + `id="login-email"` na email input. Analogicky pro heslo: `htmlFor="login-password"` + `id="login-password"`. Pripadne pouzit pattern obaleni inputu do labelu.
- **Pouceni:** Kazdy `<label>` MUSI byt propojen s inputem — bud pres `htmlFor`/`id` nebo obalenim. Vizualni blizko nestaci.

### [2026-02-13] [WCAG] Login — chybejici aria-describedby pro error zpravy a aria-invalid
- **Kde:** `src/pages/login/components/LoginForm.jsx:134` (email error), `151` (password error), `166-186` (server error)
- **Symptom:** Validacni chyby pod inputy nejsou propojene pres `aria-describedby`. Inputy s chybou nemaji `aria-invalid="true"`. Server error box nema `role="alert"` ani `aria-live="assertive"`.
- **Pricina:** Pristupnost nebyla soucasti implementace formulare.
- **Oprava:** (1) Pridat `id="login-email-error"` na email error div + `aria-describedby="login-email-error"` a `aria-invalid={!!errors.email}` na email input. Analogicky pro password. (2) Pridat `role="alert"` na server error box.
- **Pouceni:** Formularove chyby musi byt programaticky propojene s prislusnymi inputy pro screen readery. Pattern: `aria-invalid` + `aria-describedby` + `role="alert"` pro globalni chyby.

### [2026-02-13] [FONT] Login — nekonzistentni pouziti fontu pro uppercase labely
- **Kde:** `src/pages/login/components/LoginForm.jsx:34-43` (labelStyle) vs `LoginActions.jsx:58-59` a `SocialLogin.jsx:28-29`
- **Symptom:** LoginForm pouziva `--forge-font-body` s `textTransform: uppercase` a `letterSpacing: 0.05em` pro labely. LoginActions a SocialLogin pouzivaji `--forge-font-tech` pro stejny vizualni styl (uppercase, letter-spacing). Tyto dve varianty vypadaji odlisne ale slouzi stejnemu ucelu.
- **Pricina:** Komponenty byly psany nezavisle bez sdileneho design systemu pro formularove labely.
- **Oprava:** Sjednotit na `--forge-font-tech` pro vsechny uppercase male labely (12px a mensi) — to odpovida Forge typography konvenci (forge-font-tech = tech/mono pro 12px labels/prices/codes).
- **Pouceni:** Forge pravidlo: `--forge-font-tech` pro 12px labels, uppercase, kody. `--forge-font-body` pro body text, popisy. Uppercase labely s letter-spacing vzdy pouzivat tech font.

### [2026-02-13] [WCAG] Register — RoleSelectionCard neni dostupna klavesnici
- **Kde:** `src/pages/register/components/RoleSelectionCard.jsx:43`
- **Symptom:** Karta pro vyber role je implementovana jako `<div onClick>`. Nema `role="button"`, `tabIndex={0}`, ani `onKeyDown` handler. Uzivatel s klavesnici nemuze kartu vybrat — fokus na ni nelze nastavit, Enter/Space neaktivuje vyber.
- **Pricina:** Karta byla implementovana jako vizualni element s klik handlerem bez ohledu na pristupnost.
- **Oprava:** Pridat na `<div>`: `role="button"`, `tabIndex={0}`, `aria-pressed={isSelected}`, `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(role); } }}`. Alternativne pouzit `<button>` element misto `<div>`.
- **Pouceni:** Interaktivni elementy musi byt vzdy fokusovatelne a ovladatelne klavesnici (WCAG 2.1.1 Keyboard). `<div onClick>` BEZ `role`/`tabIndex`/`onKeyDown` je vzdy chyba.

### [2026-02-13] [WCAG] Register — formularove inputy bez htmlFor/id propojeni
- **Kde:** `src/pages/register/components/RegistrationForm.jsx:174-191` (renderInput), `193-222` (renderPasswordInput)
- **Symptom:** `<label>` elementy nemaji `htmlFor` atribut a `<input>` elementy nemaji `id`. Kliknuti na label text neaktivuje prislusny input. Screen reader neasociuje label s polem.
- **Pricina:** Render helper funkce vytvari label a input nezavisle bez propojovacich atributu.
- **Oprava:** V `renderInput` pridat `htmlFor={name}` na `<label>` a `id={name}` na `<input>`. V `renderPasswordInput` analogicky. Volitelne pridat `aria-describedby` pro error message.
- **Pouceni:** Formularove inputy MUSI mit propojeny label — bud pres htmlFor/id nebo obalenim. Render helper funkce jsou idealni misto pro systematicke pridani.

### [2026-02-13] [TOKEN] Register — hardcoded rgba barvy misto Forge tokenu
- **Kde:** `src/pages/register/components/RoleSelectionCard.jsx:10,48`, `ProgressSteps.jsx:30`, `LanguageToggle.jsx:21`, `RegistrationForm.jsx:166`
- **Symptom:** Hodnoty `rgba(0,212,170,0.06)`, `rgba(0,212,170,0.1)`, `rgba(0,212,170,0.15)`, `rgba(0,212,170,0.4)` jsou pouzivany primo misto existujicich Forge tokenu.
- **Pricina:** Tokeny `--forge-accent-primary-ghost` (0.06) a `--forge-accent-primary-subtle` (0.15) existuji v `forge-tokens.css` ale nebyly pouzity. Pro 0.1 a 0.4 varianty tokeny neexistuji.
- **Oprava:** Nahradit `rgba(0,212,170,0.06)` za `var(--forge-accent-primary-ghost)` a `rgba(0,212,170,0.15)` za `var(--forge-accent-primary-subtle)`. Pro 0.1 a 0.4 zvazit pridani novych tokenu nebo ponechat inline.
- **Pouceni:** Pred pouzitim hardcoded rgba hodnot vzdy overit zda existuje ekvivalentni Forge token. Centralizovane tokeny umoznuji snadny theme switching.

### [2026-02-13] [WCAG] Account stranka — tab navigace bez ARIA roles
- **Kde:** `src/pages/account/index.jsx:447-476`
- **Symptom:** Tab navigace (Profil, Firma, Zabezpeceni, Fakturace) pouziva `<button>` elementy bez `role="tab"`, `aria-selected`, `aria-controls`. Wrapper nema `role="tablist"`. Obsah nema `role="tabpanel"`.
- **Pricina:** Accessibility nebylo v implementaci zohledneno.
- **Oprava:** (1) Pridat `role="tablist"` na wrapper div. (2) Pridat `role="tab"`, `aria-selected={isActive}`, `aria-controls` na kazdy button. (3) Pridat `role="tabpanel"`, `id`, `aria-labelledby` na content div. (4) Implementovat arrow key navigaci mezi taby.
- **Pouceni:** Tab patterny vzdy implementovat podle WAI-ARIA Authoring Practices. Vizualni taby bez ARIA roles jsou pro screen readery nerozlisitelne od beznych tlacitek.

### [2026-02-13] [WCAG] Account stranka — labels nepropojene s inputy (htmlFor/id chybi)
- **Kde:** `src/pages/account/index.jsx:301-336` (FormInput komponenta)
- **Symptom:** `<label>` element existuje vizualne, ale chybi `htmlFor` atribut. Inputy nemaji `id`. Kliknuti na label nefocusuje input. Screen reader neasociuje label s inputem.
- **Pricina:** FormInput pouziva inline `<label>` bez propojeni — vizualne spravne, semanticky chybne.
- **Oprava:** Generovat unikatni `id` pro kazdy input (napr. `account-${field}`) a pridat `htmlFor` na label.
- **Pouceni:** Vizualni blizkost label-input nestaci — musi byt semanticke propojeni pres `htmlFor`/`id` nebo vnoreni inputu do label.

### [2026-02-13] [WCAG] Account stranka — ikona-only buttony bez aria-label
- **Kde:** `src/pages/account/index.jsx:393-410` (camera button), `src/pages/account/index.jsx:1001-1021` (download button)
- **Symptom:** Camera button (zmena avataru) a Download PDF button obsahuji jen ikonu bez textoveho popisu. Screen reader ohlasi "button" bez kontextu.
- **Pricina:** Ikony pouzite bez doprovodneho textu nebo aria-label.
- **Oprava:** Pridat `aria-label` na camera button a download button s popisnym textem.
- **Pouceni:** Kazdy interaktivni element musi mit pristupny nazev — bud viditelny text, aria-label nebo aria-labelledby.

### [2026-02-13] [TOKEN] Account stranka — cena tarifu neodpovida cenikove strance
- **Kde:** `src/pages/account/index.jsx:835-836`
- **Symptom:** Billing tab zobrazuje "Professional tarif" za "1,299 Kc/mesic". Cenikova stranka a MEMORY.md uvadi Professional za 1,999 Kc/$80.
- **Pricina:** Mock data s neaktualni cenou.
- **Oprava:** Aktualizovat mock cenu na 1,999 Kc nebo nacitat dynamicky z pricing konfigurace.
- **Pouceni:** Mock data musi byt konzistentni s ostatnimi castmi aplikace — nesoulad mate uzivatele i vyvojare.

### [2026-02-13] [TOKEN] Account stranka — expirace platebni karty v minulosti
- **Kde:** `src/pages/account/index.jsx:894`
- **Symptom:** Mock platebni karta zobrazuje "Expires 12/2025" — ale aktualni datum je 02/2026, takze karta je expirovana.
- **Pricina:** Mock data nebyla aktualizovana.
- **Oprava:** Zmenit expiraci na budouci datum (napr. 12/2027) nebo pridat vizualni varovani ze karta expirovala.
- **Pouceni:** Mock datumy nastavovat relativne do budoucna, ne absolutne.

### [2026-02-13] [FONT] Account stranka — forge-font-tech na tab navigaci
- **Kde:** `src/pages/account/index.jsx:457`
- **Symptom:** Tab labels (Profil, Firma, Zabezpeceni, Fakturace) pouzivaji `forge-font-tech` (mono font). Podle Forge typografickych pravidel je tech/mono font urcen pro ceny, kody, rozmery a male 12px labely — ne pro navigacni prvky.
- **Pricina:** Mozna zamena s forge-font-heading nebo forge-font-body.
- **Oprava:** Zmenit na `forge-font-body` (pro navigacni text) nebo `forge-font-heading` (pokud maji vyraznejsi styl).
- **Pouceni:** forge-font-tech = POUZE pro ceny, kody, technicky text (12px). Navigace, labels a headingy pouzivaji body nebo heading font.

### [2026-02-13] [WCAG] Test-kalkulacka — stepper bez ARIA roles
- **Kde:** `src/pages/test-kalkulacka/index.jsx:689-749`
- **Symptom:** 5-krokovy wizard stepper je implementovan jako serie `<div>` elementu bez ARIA roles. Chybi `role="progressbar"` nebo alternativne `role="list"` s `role="listitem"` na krocich. `aria-current="step"` na aktivnim kroku chybi. Screen reader nerozpozna ze se jedna o postupny wizard.
- **Pricina:** Pristupnost nebyla v implementaci stepperu zohlednena.
- **Oprava:** Pridat `role="list"` na wrapper, `role="listitem"` na kroky, `aria-current="step"` na aktivni krok.
- **Pouceni:** Wizard steppery musi byt semanticky oznaceny pro screen readery. Viz WAI-ARIA Authoring Practices.

### [2026-02-13] [WCAG] Test-kalkulacka — fee karta nesemanticky onClick na div
- **Kde:** `src/pages/test-kalkulacka/components/PrintConfiguration.jsx:769-778`
- **Symptom:** Fee karty pouzivaji `<div onClick>` s `ForgeCheckbox` uvnitr. Checkbox ma `onChange={() => {}}` (prazdny handler) — skutecny toggle se deje pres parent div. Screen reader nerozpozna ze jde o zaskrtavatelnou polozku.
- **Pricina:** UI design preferoval celou kartu jako klikatelnou oblast.
- **Oprava:** Pridat `role="checkbox"`, `aria-checked`, `tabIndex={0}`, `onKeyDown` na div, nebo presunout toggle na checkbox.
- **Pouceni:** Interactive `<div>` musi mit ARIA roles a keyboard support (WCAG 2.1.1).

### [2026-02-13] [WCAG] Test-kalkulacka — fullscreen bez Escape key handleru
- **Kde:** `src/pages/test-kalkulacka/components/ModelViewer.jsx:371-413`
- **Symptom:** Fullscreen modal se zavre kliknutim na overlay ale nema Escape key handler. Uzivatel s klavesnici nemuze zavrit fullscreen.
- **Pricina:** Keyboard event handling opominut.
- **Oprava:** Pridat `useEffect` s `document.addEventListener('keydown')` pro Escape klavesu.
- **Pouceni:** Modalni dialogy MUSI podporovat Escape (WCAG 2.1.1, WAI-ARIA Dialog pattern).

### [2026-02-13] [TOKEN] Test-kalkulacka — 6 subkomponent kompletne v anglictine
- **Kde:** `src/pages/test-kalkulacka/components/ShippingSelector.jsx`, `ExpressTierSelector.jsx`, `CouponInput.jsx`, `PostProcessingSelector.jsx`, `PromoBar.jsx`, `UpsellPanel.jsx`
- **Symptom:** 6 subkomponent ma vsechny texty hardcoded v anglictine ("Shipping", "Coupon Code", "Apply", "Delivery Speed", "Post-Processing Services", "Need it faster?") bez jakekoli lokalizace.
- **Pricina:** Komponenty vytvoreny jako prototyp z anglickeho zadani, nebyly lokalizovany.
- **Oprava:** Pridat `useLanguage()` hook a prelozit vsechny texty pres `t()`.
- **Pouceni:** Vsechny user-facing texty musi byt lokalizovany. Nove komponenty vzdy zacinat s `useLanguage()`.

### [2026-02-13] [TOKEN] Test-Kalkulacka-White — 5 komponent pouze v anglictine (i18n)
- **Kde:** `src/pages/test-kalkulacka-white/components/ExpressTierSelector.jsx`, `ShippingSelector.jsx`, `CouponInput.jsx`, `UpsellPanel.jsx`, `PostProcessingSelector.jsx`
- **Symptom:** Vsechny texty v techto 5 komponentach jsou hardcoded v anglictine ("Delivery Speed", "Shipping", "Coupon Code", "Apply", "Post-Processing Services"). Ostatni komponenty ve stejne slozce (CheckoutForm, OrderConfirmation, PrintConfiguration) maji plnou CS/EN podporu pres `useLanguage()`.
- **Pricina:** Komponenty byly pravdepodobne portovany z anglickeho prototypu bez lokalizace.
- **Oprava:** Pridat `useLanguage()` hook do vsech 5 komponent a prelozit vsechny user-facing texty do CS/EN.
- **Pouceni:** Pri vytvareni novych komponent vzdy pouzivat i18n od zacatku. Anglicke texty v jinak ceske aplikaci jsou nekonzistentni.

### [2026-02-13] [TOKEN] Test-Kalkulacka-White — hardcoded tenant_id v CheckoutForm
- **Kde:** `src/pages/test-kalkulacka-white/components/CheckoutForm.jsx:105`
- **Symptom:** Objednavka se vytvari s `tenant_id: 'demo-tenant'` — hardcoded string misto pouziti `getTenantId()` z `adminTenantStorage.js`.
- **Pricina:** Zjednoduseni pri implementaci checkout flow.
- **Oprava:** Importovat `getTenantId` z `../../utils/adminTenantStorage` a nahradit `'demo-tenant'` za `getTenantId()`.
- **Pouceni:** Invariant #3 z CLAUDE.md: "Tenant-scoped storage — zadny hardcode tenantId/customerId v UI ani v utils." Vzdy pouzivat `getTenantId()`.

### [2026-02-13] [TOKEN] Test-Kalkulacka-White — index.jsx komentar odkazuje na spatnou cestu
- **Kde:** `src/pages/test-kalkulacka-white/index.jsx:1`
- **Symptom:** Komentar na radku 1 rika `// src/pages/test-kalkulacka/index.jsx` — neodpovida skutecne ceste `src/pages/test-kalkulacka-white/index.jsx`. Take vsechny console.log/warn/error zpravy pouzivaji prefix `[test-kalkulacka]`.
- **Pricina:** Soubor byl zkopirovany z test-kalkulacka bez aktualizace komentaru a log prefixu.
- **Oprava:** Zmenit komentar na `// src/pages/test-kalkulacka-white/index.jsx` a log prefixy na `[test-kalkulacka-white]`.
- **Pouceni:** Pri kopirovani souboru mezi slozkami vzdy aktualizovat komentare, log prefixy a meta-informace.

### [2026-02-13] [WCAG] Test-Kalkulacka-White — stepper bez ARIA roles
- **Kde:** `src/pages/test-kalkulacka-white/index.jsx:666-696`
- **Symptom:** 5-krokovy stepper nema `role="progressbar"`, `aria-current="step"` ani `aria-label`. Screen reader nevi v jakem kroku uzivatel je.
- **Pricina:** Accessibility nebylo v puvodni implementaci zohledneno.
- **Oprava:** Pridat `role="list"` na wrapper, `role="listitem"` na kazdy krok, `aria-current="step"` na aktualni krok. Alternativne pouzit `aria-label="Krok X z 5: Nazev"`.
- **Pouceni:** Multi-step wizardy musi mit ARIA roles pro screen readery — vizualni indikace (barvy, ikony) nestaci.

### [2026-02-13] [TOKEN] Test-Kalkulacka-White — nekonzistentni Icon import cesta
- **Kde:** `src/pages/test-kalkulacka-white/components/PricingCalculator.jsx:4`
- **Symptom:** PricingCalculator importuje `Icon` z `../../../components/ui/Icon`, zatimco vsechny ostatni komponenty ve slozce importuji z `../../../components/AppIcon`. Obe cesty funguji, ale je to nekonzistentni.
- **Pricina:** PricingCalculator mozna kopirovan z jineho kontextu kde se pouzival jiny wrapper.
- **Oprava:** Sjednotit import na `../../../components/AppIcon` pro konzistenci.
- **Pouceni:** V ramci jedne stranky/modulu pouzivat jednotny import pro sdilene utility (ikony, buttony, atd.).

### [2026-02-13] [TOKEN] Test-Kalkulacka-White — .3mf v hidden inputu ale ne v FileUploadZone
- **Kde:** `src/pages/test-kalkulacka-white/index.jsx:645` vs `components/FileUploadZone.jsx:62-65`
- **Symptom:** Skryty file input v index.jsx ma `accept=".stl,.obj,.3mf"` (zahrnuje .3mf). FileUploadZone pouziva react-dropzone accept konfiguraci jen pro `.stl` a `.obj` — neakceptuje `.3mf`. Uzivatel muze nahrat .3mf pres "Pridani modelu" tlacitko ale ne pres drag & drop.
- **Pricina:** Konfigurace accept nebyla synchronizovana mezi dvema vstupnimi body.
- **Oprava:** Bud pridat `.3mf` do FileUploadZone accept konfigurace, nebo odebrat `.3mf` z hidden inputu. Rozhodnuti zavisi na tom zda backend slicer podporuje 3MF format.
- **Pouceni:** Vsechny vstupni body pro upload souboru musi mit identickou accept konfiguraci.

### [2026-02-13] [TOKEN] Widget-Kalkulacka — .3mf v hidden inputu ale ne v FileUploadZone (stejny bug jako test-kalkulacka-white)
- **Kde:** `src/pages/widget-kalkulacka/index.jsx:698` vs `components/FileUploadZone.jsx:56-64`
- **Symptom:** Skryty file input v index.jsx ma `accept=".stl,.obj,.3mf"` ale FileUploadZone react-dropzone accept jen `.stl` a `.obj`. Nekonzistentni chovani — drag & drop neprijme .3mf ale tlacitko "+" ano.
- **Pricina:** Stejna pricina jako u test-kalkulacka-white — nesynchronizovane accept konfigurace.
- **Oprava:** Synchronizovat accept konfiguraci mezi hidden input a FileUploadZone. Pridat `.3mf` do dropzone pokud je podporovany, nebo odebrat z hidden inputu.
- **Pouceni:** Stejny bug jako v test-kalkulacka-white — pri kopirovani widgetu se skopiroval i bug.

### [2026-02-13] [TOKEN] Widget-Kalkulacka — nepouzite komponenty se starsi CSS var konvenci (--mp-* vs --widget-*)
- **Kde:** `src/pages/widget-kalkulacka/components/PostProcessingSelector.jsx`, `ExpressTierSelector.jsx`, `UpsellPanel.jsx`, `ShippingSelector.jsx`, `CouponInput.jsx`, `PromoBar.jsx`
- **Symptom:** 6 komponent ve slozce pouziva CSS promenne s prefixem `--mp-*` (napr. `--mp-primary`, `--mp-border`, `--mp-bg`). Hlavni flow widgetu pouziva `--widget-*` prefix. Pokud by se tyto komponenty integrovaly, vizualni tema by nefungovala.
- **Pricina:** Komponenty byly vytvoreny v drive fazi s jinou konvenci a nebyly migrovany.
- **Oprava:** Pred integraci do hlavniho flow preklopit vsechny `--mp-*` CSS vars na `--widget-*` ekvivalenty.
- **Pouceni:** Konvence CSS promennych musi byt jednotna v ramci jedne stranky/widgetu. Nepouzite komponenty mohou skryvat nekonzistence.

### [2026-02-13] [TOKEN] Widget-Kalkulacka — nepouzite komponenty hardcoded anglicky (bez i18n)
- **Kde:** `src/pages/widget-kalkulacka/components/PostProcessingSelector.jsx`, `ExpressTierSelector.jsx`, `UpsellPanel.jsx`, `ShippingSelector.jsx`, `CouponInput.jsx`, `PromoBar.jsx`
- **Symptom:** Vsech 6 nepouzitych komponent ma texty pouze v anglictine ("Delivery Speed", "Shipping", "Coupon Code", "Apply", "Post-Processing"). Hlavni flow widgetu je v cestine s castecnou CS/EN podporou.
- **Pricina:** Portovano z anglickeho prototypu bez lokalizace (stejny problem jako u test-kalkulacka-white).
- **Oprava:** Pred integraci pridat `useLanguage()` a prelozit vsechny user-facing texty.
- **Pouceni:** Jazykova konzistence musi byt zajistena pred integraci. Anglicke texty v ceskem kontextu jsou UX problem.

### [2026-02-13] [WCAG] Widget-Kalkulacka — stepper bez ARIA roles
- **Kde:** `src/pages/widget-kalkulacka/components/WidgetStepper.jsx:126-187`
- **Symptom:** 3-krokovy stepper nema `role="progressbar"` nebo `role="list"`, `aria-current="step"` ani `aria-label`. Screen reader nevi v jakem kroku uzivatel je.
- **Pricina:** Accessibility nebylo v puvodni implementaci zohledneno.
- **Oprava:** Pridat `role="list"` na wrapper, `role="listitem"` + `aria-current="step"` na aktivni krok. Pridat `aria-label="Krok X z 3"`.
- **Pouceni:** Multi-step wizardy musi mit ARIA roles — stejny problem jako test-kalkulacka-white stepper.

### [2026-02-13] [WCAG] Widget-Kalkulacka — range slider (infill) bez pristupneho labelu
- **Kde:** `src/pages/widget-kalkulacka/components/PrintConfiguration.jsx:446-459`
- **Symptom:** Infill range slider (`<input type="range">`) nema `aria-label`, `aria-valuetext` ani `aria-labelledby`. Screen reader oznami pouze "slider" bez kontextu.
- **Pricina:** Accessibility opominut u range inputu.
- **Oprava:** Pridat `aria-label="Hustota vyplne"` a `aria-valuetext={`${config.infill}%`}` na range input.
- **Pouceni:** Range slidery vzdy potrebuji explicitni aria-label a aria-valuetext pro smysluplne oznameni aktualniho stavu.

### [2026-02-13] [WCAG] Widget-Kalkulacka — color selektor bez role="radiogroup"
- **Kde:** `src/pages/widget-kalkulacka/components/PrintConfiguration.jsx:396-415`
- **Symptom:** Barevne tlacitka nemaji `aria-pressed` nebo `role="radio"`. Wrapper nema `role="radiogroup"`. Screen reader nevi ze jde o exkluzivni vyber barvy.
- **Pricina:** Accessibility nebylo implementovano u barevneho selektoru.
- **Oprava:** Pridat `role="radiogroup"` + `aria-label="Vyber barvy"` na wrapper div. Pridat `role="radio"` + `aria-checked={isSelected}` na kazde barevne tlacitko.
- **Pouceni:** Exkluzivni selektory (kde lze vybrat jen jednu moznost) by mely pouzivat radiogroup pattern.

### [2026-02-13] [INLINE-STYLE] Widget-Kalkulacka — PricingCalculator importuje Icon z jine cesty
- **Kde:** `src/pages/widget-kalkulacka/components/PricingCalculator.jsx:4`
- **Symptom:** `import Icon from '../../../components/ui/Icon'` — zatimco ostatni komponenty v widget-kalkulacka importuji z `../../../components/AppIcon`. Nekonzistentni import cesta (stejny problem jako u test-kalkulacka-white).
- **Pricina:** PricingCalculator kopirovan z jineho kontextu.
- **Oprava:** Sjednotit import na `../../../components/AppIcon`.
- **Pouceni:** V ramci jedne stranky/modulu pouzivat jednotny import pro sdilene utility.

### [2026-02-13] [WCAG] Slicer — DarkSelect bez ARIA atributu a keyboard support
- **Kde:** `src/pages/slicer/components/SlicerLeftPanel.jsx:6-70`, `SlicerRightPanel.jsx:8-48`, `SlicerMaterialsPanel.jsx:6-55`
- **Symptom:** DarkSelect (3 kopie) nemaji `role="listbox"` na options containeru, `role="option"` na options, ani keyboard support (Escape, Arrow Up/Down). Dropdown neni ovladatelny klavesnici — Tab nekrokuje pres options, Escape nezavre dropdown.
- **Pricina:** Inline helper komponent implementovan ciste vizualne bez pristupnosti.
- **Oprava:** (1) Pridat `role="listbox"` na options container, `role="option"` na kazdy option. (2) Pridat `onKeyDown` handler: Escape zavre, ArrowUp/ArrowDown naviguje, Enter vybere. (3) Pridat `aria-expanded={open}` na trigger button. (4) Implementovat click-outside pro zavreni.
- **Pouceni:** Custom dropdown MUSI implementovat ARIA Listbox pattern + keyboard navigaci. Nativni `<select>` toto poskytuje automaticky.

### [2026-02-13] [WCAG] Slicer — DarkToggle bez role="switch" a aria-checked
- **Kde:** `src/pages/slicer/components/SlicerRightPanel.jsx:50-67`, `SlicerMaterialsPanel.jsx:57-74`
- **Symptom:** DarkToggle `<button>` nema `role="switch"`, `aria-checked`, ani `aria-label`. Screen reader oznami pouze "button" bez kontextu a stavu (on/off).
- **Pricina:** Toggle implementovan vizualne bez ARIA atributu.
- **Oprava:** Pridat `role="switch"`, `aria-checked={on}`, `aria-label={label}` na button element.
- **Pouceni:** Toggle switche MUSI mit `role="switch"` a `aria-checked` (WAI-ARIA).

### [2026-02-13] [WCAG] Slicer — SlicerSlicePanel radio buttons bez ARIA radiogroup
- **Kde:** `src/pages/slicer/components/SlicerSlicePanel.jsx:30-72`
- **Symptom:** Dva radio-style buttony (AI Auto-Slice, Manual slicing) jsou implementovany jako `<button>` bez `role="radio"`, `aria-checked` nebo `role="radiogroup"` na wrapperu. Screen reader je oznami jako bezne tlacitka.
- **Pricina:** Custom radio vizualne spravny ale bez ARIA semantiky.
- **Oprava:** Pridat `role="radiogroup"` na wrapper div, `role="radio"` a `aria-checked={method === 'xxx'}` na kazdy button.
- **Pouceni:** Exkluzivni vyber vzdy implementovat s radiogroup ARIA patternem.

### [2026-02-13] [TOKEN] Slicer — vsechny texty hardcoded anglicky (chybi i18n)
- **Kde:** Cela slozka `src/pages/slicer/` (vsech 11 komponent)
- **Symptom:** Zadna komponenta nepouziva `useLanguage()`. Vsechny user-facing texty ("Print Settings", "Materials", "Support", "Slice", "AI Auto-Slice", atd.) jsou hardcoded anglicky. Cesky uzivatel vidi anglickou stranku.
- **Pricina:** Stranka vytvorena jako vizualni shell s anglickymi mock daty, i18n odlozeno.
- **Oprava:** Pridat `useLanguage()` a prelozit vsechny user-facing texty. Technicke labely (X, Y, Z, mm) mohou zustat.
- **Pouceni:** I pro vizualni shelly/prototypy implementovat zakladni i18n — pozdejsi pridani je nakladnejsi.

### [2026-02-13] [INLINE-STYLE] Slicer — DarkSelect duplikovan 3x, DarkToggle 2x, DarkInput 2x
- **Kde:** `src/pages/slicer/components/SlicerLeftPanel.jsx:6-70`, `SlicerRightPanel.jsx:8-112`, `SlicerMaterialsPanel.jsx:6-74`
- **Symptom:** DarkSelect je definovan jako interni helper ve 3 souborech s drobne odlisnymi styly (napr. padding 8px vs 7px, ChevronDown vs ChevronUp). DarkToggle existuje ve 2 souborech, DarkInput take ve 2. Celkove 7 duplikaci.
- **Pricina:** Kazda komponenta si definovala vlastni helpery nezavisle, bez sdileneho modulu.
- **Oprava:** Extrahovat do `src/pages/slicer/components/SlicerFormElements.jsx` a sjednotit styly.
- **Pouceni:** Duplikovane interni helpery vedou k nekonzistentnim stylum a ztezuji udrzbu. I pro izolovanou stranku vytvaret sdileny modul kdyz se helper pouziva 2+ krat.

### [2026-02-13] [RESPONSIVE] Slicer — zadna responsivita, pouze fixni desktop layout
- **Kde:** `src/pages/slicer/components/SlicerLayout.jsx:8` (`gridTemplateColumns: '260px 1fr 320px'`)
- **Symptom:** Grid layout pouziva fixni sloupce 260px a 320px. Na mobilnich zarizenich a tabletech je stranka nepouzitelna — panely se nevejdou, viewport je minimalni, floating panely se prekryvaji.
- **Pricina:** Stranka vytvorena jako desktop-only prototyp, mobilni layout nebyl v scope.
- **Oprava:** Pridat media queries: na tabletu (<1024px) skryt levy panel nebo pouzit collapsible sidebar, na mobilu (<768px) presunout panely do tabulek/sheets (bottom sheet pattern).
- **Pouceni:** I pro prototypy alespon pripravit breakpoint kostru aby se predchazelo kompletnimu prepisu pri mobilni adaptaci.

### [2026-02-13] [TOKEN] AdminBranding — hardcoded customerId 'test-customer-1'
- **Kde:** `src/pages/admin/AdminBranding.jsx:17`
- **Symptom:** `const customerId = 'test-customer-1'` je hardcoded string. Porusuje invariant #3 z CLAUDE.md: "Tenant-scoped storage — zadny hardcode tenantId/customerId v UI ani v utils."
- **Pricina:** Placeholder z rane implementace s TODO komentarem, nikdy nahrazeny za `getTenantId()`.
- **Oprava:** Importovat `getTenantId` z `../../utils/adminTenantStorage` a nahradit `'test-customer-1'` za `getTenantId()`.
- **Pouceni:** Hardcoded tenant ID v admin strankach rozbije multi-tenant scenare. Vzdy pouzivat `getTenantId()`.

### [2026-02-13] [TOKEN] AdminBranding — nepouzity import useNavigate
- **Kde:** `src/pages/admin/AdminBranding.jsx:2`
- **Symptom:** `import { useNavigate } from 'react-router-dom'` je na radku 2, ale `useNavigate` neni nikde v komponente pouzit.
- **Pricina:** Pravdepodobne zbytek z drive planovane navigace, ktera byla implementovana jinak (`window.location.href`).
- **Oprava:** Odstranit nepouzity import na radku 2.
- **Pouceni:** Nepouzite importy zvetsuji bundle a matou vyvojare. ESLint `no-unused-vars` by toto zachytil.

### [2026-02-13] [INLINE-STYLE] AdminBranding — duplicitni rasterToOptimizedDataUrl funkce
- **Kde:** `src/pages/admin/AdminBranding.jsx:120-141` (v handleSave) a `220-239` (v applyLogoDraft)
- **Symptom:** Funkce `rasterToOptimizedDataUrl` a `readAsDataUrl` jsou definovany 2x se zcela identickou logikou — jednou v `handleSave` a podruhe v `applyLogoDraft`.
- **Pricina:** Kazda metoda potrebovala funkci pro konverzi, byly definovany lokalne misto na urovni komponenty.
- **Oprava:** Extrahovat obe funkce na uroven komponenty (pred return) nebo do samostatneho utility modulu. Pouzivat jednu sdilenou instanci.
- **Pouceni:** Duplicitni funkce v ramci jedne komponenty ztezuji udrzbu — zmena v jedne kopii se nepropise do druhe.

### [2026-02-13] [TOKEN] AdminBranding — nekompletni i18n, hardcoded ceske texty
- **Kde:** `src/pages/admin/AdminBranding.jsx:806,808,815,841,849,942,969` a dalsi
- **Symptom:** Minimalne 10 user-facing textu je hardcoded cesky bez `t()`: "Neuulozene zmeny", "Ulozeno", "Nx chyba", "Ulozit zmeny", "Pouzit logo", "Pripraveno k nahrani", banner text, "0px (Sharp)", "24px (Rounded)", tip callout text. Anglicky uzivatel vidi mix CS a EN.
- **Pricina:** Texty pridany po puvodni i18n implementaci bez pridani do LanguageContext.
- **Oprava:** Pridat vsechny hardcoded texty jako prekladove klice do LanguageContext a nahradit za volani `t()`.
- **Pouceni:** Pri pridavani novych textu vzdy pouzivat `t()` a zaroven pridat klic do obou jazykovych vetvi v LanguageContext.

### [2026-02-13] [TOKEN] AdminBranding — alert() misto Forge toast/notifikace
- **Kde:** `src/pages/admin/AdminBranding.jsx:108,158,161`
- **Symptom:** Stranka pouziva `alert('Branding ulozen.')`, `alert('Oprav prosim chyby...')` a `alert('Ulozeni se nepodarilo.')` misto konzistentniho Forge notifikacniho systemu. Nativni alert blokuje UI a vizualne neodpovida Forge design systemu.
- **Pricina:** Jednoducha implementace pro demo ucely.
- **Oprava:** Nahradit za Forge toast/snackbar komponentu (pokud existuje) nebo vytvorit inline success/error notifikacni banner.
- **Pouceni:** Nativni `alert()` v admin panelu je anti-pattern — blokuje UI thread, nelze stylovat, neodpovida design systemu.

### [2026-02-13] [WCAG] AdminBranding — upload zona bez vizualni indikace pri drag-over
- **Kde:** `src/pages/admin/AdminBranding.jsx:918-951`
- **Symptom:** Upload zona ma `onDragOver` handler ktery jen vola `preventDefault()` a `stopPropagation()`, ale nepridava zadnou vizualni indikaci ze uzivatel pretahuje soubor nad zonou. Chybi `onDragEnter`/`onDragLeave` pro zmenu stylu (napr. zvyrazneni okraje, zmena pozadi).
- **Pricina:** Drag-and-drop implementovan minimalne — jen pro funkcnost, ne pro UX.
- **Oprava:** Pridat stav `isDragging` a v `onDragEnter` ho zapnout, v `onDragLeave`/`onDrop` vypnout. Pokud `isDragging`, zobrazit vizualni zvyrazneni (napr. teal border, zvyraznene pozadi).
- **Pouceni:** Drag-and-drop upload zony musi vizualne reagovat na pretazeni souboru — jinak uzivatel nevi ze zona funguje.

### [2026-02-13] [TOKEN] AdminDashboard — pricing a fees data ctene primo z localStorage
- **Kde:** `src/pages/admin/AdminDashboard.jsx:186-298`
- **Symptom:** Metriky `pricingData` a `feesData` ctou primo z localStorage s manualni fallback chain `[tenantId, test-customer-1, demo-tenant]` a JSON.parse. Obchazeji `readTenantJson()` helper a porusuji invariant #4 z CLAUDE.md ("Jeden zdroj pravdy — pricing/fees cti pres tenant storage helpery").
- **Pricina:** AdminPricing a AdminFees ukladaji data pod vlastnimi klici (`modelpricer_pricing_config__*`, `modelpricer_fees_config__*`) mimo standardni tenant namespace, takze dashboard musel implementovat vlastni cteni.
- **Oprava:** Refaktorovat na `readTenantJson('pricing:v3')` a `readTenantJson('fees:v3')`, pripadne pridat helper funkce do prislusnych storage souboru.
- **Pouceni:** Pokud admin stranky ukladaji data pod nestandardnimi klici, vsechny konzumenti musi duplikovat cteci logiku. Centralizovat storage interface.

### [2026-02-13] [TOKEN] AdminDashboard — hardcoded BRANDING_TENANT_ID 'test-customer-1'
- **Kde:** `src/pages/admin/AdminDashboard.jsx:143`
- **Symptom:** Konstanta `BRANDING_TENANT_ID = 'test-customer-1'` je pouzita pro vsechna volani `getBranding()`, `getWidgets()`, `getWidgetDomains()`, `getPlanFeatures()`. Porusuje invariant #3 z CLAUDE.md.
- **Pricina:** Placeholder z rane implementace, stejny pattern jako v AdminBranding.
- **Oprava:** Importovat `getTenantId` z `../../utils/adminTenantStorage` a nahradit hardcoded string.
- **Pouceni:** Hardcoded tenant ID je opakovany pattern v admin strankach — melo by se opravit systematicky.

### [2026-02-13] [WCAG] AdminDashboard — modaly bez role="dialog", focus trap a Escape handleru
- **Kde:** `src/pages/admin/AdminDashboard.jsx:908-963` (Add Metric modal), `1670-1836` (SettingsModal)
- **Symptom:** Oba modaly se zaviraji klikem na overlay (`onMouseDown`), ale nemaji `role="dialog"`, `aria-modal="true"`, Escape key handler ani focus trap. Uzivatel s klavesnici nemuze zavrit modal bez mysi. Tab navigace muze uniknout z modalu.
- **Pricina:** Modaly implementovany vizualne bez ohledu na ARIA dialog pattern.
- **Oprava:** Pridat `role="dialog"`, `aria-modal="true"`, `aria-labelledby` na modal container. Pridat useEffect s keydown handlerem pro Escape. Implementovat focus trap.
- **Pouceni:** Modalni dialogy MUSI implementovat WAI-ARIA Dialog pattern: role, aria-modal, focus trap, Escape zavreni.

### [2026-02-13] [INLINE-STYLE] AdminDashboard — duplicitni scroll containment useEffect
- **Kde:** `src/pages/admin/AdminDashboard.jsx:102-140` a `1608-1646`
- **Symptom:** Identicky smooth scroll useEffect (30+ radku, exponential easing, RAF animace, wheel event listener) je zkopirovany dvakrat — jednou pro Add Metric modal v hlavni komponente a podruhe v SettingsModal.
- **Pricina:** SettingsModal byl pridan pozdeji a logika byla zkopirovana misto extrakce do sdileneho hooku.
- **Oprava:** Extrahovat do sdileneho hooku `useModalScrollContainment(overlayRef, isOpen)`.
- **Pouceni:** Identicky useEffect v ramci jednoho souboru je signal pro extrakci do custom hooku.

### [2026-02-13] [INLINE-STYLE] AdminDashboard — duplicitni setDashboardCols a setGridCols funkce
- **Kde:** `src/pages/admin/AdminDashboard.jsx:481-490` a `529-538`
- **Symptom:** Funkce `setDashboardCols` a `setGridCols` maji prakticky identickou logiku (clamp cols 2-6, repack cards, update draft). `setGridCols` se nikde nepouziva v JSX — je mrtvy kod.
- **Pricina:** Pravdepodobne pozustatek z refaktoringu kdy jedna verze nahradila druhou.
- **Oprava:** Odstranit `setGridCols` (radky 529-538).
- **Pouceni:** Pri refaktorovani funkci smazat starou verzi — ponechani vytvari matouci duplikaty.

### [2026-02-13] [TOKEN] AdminPresets — material_key a print_overrides se neposilaji v upload multipart
- **Kde:** `src/services/presetsApi.js:148-151` a `src/pages/admin/AdminPresets.jsx:316-328`
- **Symptom:** Pri uploadu noveho presetu se v multipart FormData posilaji jen `name`, `order` a `visibleInWidget`. Pole `material_key` a `print_overrides` se neposilaji — musi se nastavit naslednym PATCH volanim. Frontend vsak po uploadu nevolam PATCH pro material_key (v online rezimu). Material prirazeny pri uploadu se tak de facto ztrati.
- **Pricina:** `uploadPreset()` v `presetsApi.js` nepridava `material_key` do FormData. Frontend po uspesnem uploadu pouze zavola `load()` a nenasleduje PATCH s material_key.
- **Oprava:** Pridat `if (meta?.material_key) form.append('material_key', meta.material_key);` do `uploadPreset()`. Alternativne po uspesnem uploadu zavolat `patchPreset(newId, { material_key })`.
- **Pouceni:** Pri pridavani novych metadata poli overit ze se posilaji ve vsech CRUD operacich (nejen PATCH ale i POST/upload).

### [2026-02-13] [WCAG] AdminPresets — tabulka radek pouziva onClick na tr bez keyboard support
- **Kde:** `src/pages/admin/AdminPresets.jsx:762`
- **Symptom:** Radky tabulky maji `onClick={() => openPresetDialog(p.id)}` a `style={{ cursor: 'pointer' }}`, ale chybi `tabIndex={0}`, `role="button"` a `onKeyDown` handler. Uzivatel s klavesnici nemuze otevrit editacni dialog pro preset.
- **Pricina:** Interaktivita pridana na `<tr>` element bez ohledu na pristupnost.
- **Oprava:** Pridat `tabIndex={0}`, `role="row"` (uz implicitni), `onKeyDown` handler pro Enter/Space. Alternativne pridat explicitni "Editovat" tlacitko do sloupce akci.
- **Pouceni:** Interaktivni tabulkove radky musi byt fokusovatelne a ovladatelne klavesnici (WCAG 2.1.1).

### [2026-02-13] [TOKEN] AdminPresets — offline presety maji ID prefix "local-" ale nikdy se nesyncuji zpet
- **Kde:** `src/pages/admin/AdminPresets.jsx:333`
- **Symptom:** Presety vytvorene v offline rezimu dostavaji ID `local-{timestamp}-{random}`. Pri navratu do online rezimu se tyto presety nacitaji z localStorage cache, ale nikdy se neposilaji na backend. Po refreshi s aktivnim backendem se ztrati — backend je nezna.
- **Pricina:** Chybi sync mechanismus pro offline-to-online migraci.
- **Oprava:** Pri prechodu z offline do online rezimu detekovat presety s `local-*` ID a nabidnout synchronizaci (upload na backend + nahrazeni lokalniho ID za serverove).
- **Pouceni:** Offline-first architektura vyzaduje explicitni sync strategii. Samotne cachovani do localStorage neni dostatecne pro obousmernou synchronizaci.

### [2026-02-13] [INLINE-STYLE] AdminPresets — prazdny catch block v writeLocalFallback
- **Kde:** `src/pages/admin/AdminPresets.jsx:86-88`
- **Symptom:** Funkce `writeLocalFallback()` ma prazdny `catch {}` block bez logovani. Pokud localStorage zapis selze (napr. plny quota), uzivatel se o tom nedozvi a data se tichy ztrati.
- **Pricina:** Defenzivni programovani bez chyboveho reportovani.
- **Oprava:** Pridat `console.warn('[AdminPresets] writeLocalFallback failed:', e)` do catch bloku. Volitelne zobrazit toast varujici o plnem localStorage.
- **Pouceni:** Prazdne catch bloky skryvaji chyby. Minimalne logovat do console.warn pro diagnostiku.

### [2026-02-13] [WCAG] AdminPresets — delete modal scroll containment pouziva wheel event
- **Kde:** `src/pages/admin/AdminPresets.jsx:298-309`
- **Symptom:** Delete konfirmacni modal zastavuje scroll pozadi pres `document.body.style.overflow = 'hidden'` a `addEventListener('wheel', handleWheel, { passive: false })`. Toto funguje pro mysove kolecko, ale neresi touch scroll na mobilnich zarizenich. Take `e.preventDefault()` na wheel eventu muze zpusobit nefunkcni scroll UVNITR modalu pokud by modal mel vlastni scrollovatelny obsah.
- **Pricina:** Scroll containment implementovano jen pro desktop wheel events.
- **Oprava:** Pouzit standardni focus trap pattern nebo `inert` atribut na background content. `overflow: hidden` na body je dostatecne pro vetsinu pripadu — wheel event listener je redundantni.
- **Pouceni:** Scroll containment pro modaly resi lepe `overflow: hidden` na body + `inert` na pozadi nez manualni event prevence.

### [2026-02-13] [INLINE-STYLE] AdminPricing — monoliticky soubor 3173 radku vcetne ~1000 radku CSS
- **Kde:** `src/pages/admin/AdminPricing.jsx` (cely soubor)
- **Symptom:** Soubor obsahuje kompletni komponentu (logika + render + ~1000 radku CSS) v jednom souboru bez extrakce subkomponent nebo externich stylu. Genericky CSS tridy (`.input`, `.field`, `.select`) mohou kolidovat s globalni CSS.
- **Pricina:** Inkrementalni vyvoj — soubor rostl bez refactoru na subkomponenty.
- **Oprava:** Extrahovat CSS do samostatneho `.module.css` souboru nebo pouzit CSS Modules. Extrahovat tab panely do subkomponent (`MaterialsTab.jsx`, `TimeTab.jsx`, `RulesTab.jsx`, `DiscountsTab.jsx`, `PreviewTab.jsx`).
- **Pouceni:** Soubory nad 1000 radku by mely byt rozdeleny na logicke casti. Genericky pojmenovane CSS tridy v `<style>` tagu riskuji kolize.

### [2026-02-13] [TOKEN] AdminPricing — duplikace utility funkci s adminPricingStorage.js
- **Kde:** `src/pages/admin/AdminPricing.jsx:59-97` vs `src/utils/adminPricingStorage.js:36-66`
- **Symptom:** Funkce `safeNum`, `clampMin0`, `slugifyMaterialKey` (resp. `normalizeMaterialKey`), `materialPricesToMaterialsV3` a dalsi jsou definovany duplicitne — jednou v AdminPricing.jsx a podruhe v adminPricingStorage.js. Implementace jsou shodne ale oddelene — zmena v jednom souboru se nepropise do druheho.
- **Pricina:** AdminPricing.jsx definuje vlastni kopie pro pouziti v UI logice misto importu z centralizovaneho modulu.
- **Oprava:** Extrahovat sdilene utility do `src/lib/pricing/pricingUtils.js` a importovat v obou souborech. Nebo importovat primo z `adminPricingStorage.js` pokud jsou exportovane.
- **Pouceni:** Sdilene utility funkce definovat na jednom miste a importovat. Duplicitni definice vede k divergenci implementaci.

### [2026-02-13] [TOKEN] AdminPricing — preview dropdown zobrazuje `m.price` misto `m.price_per_gram`
- **Kde:** `src/pages/admin/AdminPricing.jsx:2000`
- **Symptom:** Material dropdown v preview tabu zobrazuje `{m.name} ({clampMin0(m.price)} Kc/g)` — ale material objekt nema pole `price`, ma `price_per_gram`. `clampMin0(m.price)` vraci 0 pro vsechny materialy (protoze `m.price` je `undefined`).
- **Pricina:** Preklep — `m.price` misto `m.price_per_gram`.
- **Oprava:** Zmenit `clampMin0(m.price)` na `clampMin0(m.price_per_gram)`.
- **Pouceni:** Material schema pouziva `price_per_gram`, ne `price`. Pri pristupu k datum z materialu vzdy overit nazev pole.

### [2026-02-13] [LAYOUT] AdminPricing — volume discounts preview chybi v sandbox
- **Kde:** `src/pages/admin/AdminPricing.jsx:181-278` (`calcPricingPreview`)
- **Symptom:** Preview sandbox nepocita s volume discounts (mnozstevnimi slevami). Admin nakonfiguruje tiers (napr. 5+ ks = -10%), ale v preview breakdownu se sleva nezobrazi. Admin nema moznost overit ze volume discounts funguji spravne.
- **Pricina:** `calcPricingPreview()` je jednoduchy pipeline ktery nema volume discount step (ty se aplikuji az v `pricingEngineV3.js`).
- **Oprava:** Pridat volume discount step do `calcPricingPreview()` ktery aplikuje matching tier na zaklade `preview.quantity` a `volumeDiscounts` konfigurace.
- **Pouceni:** Admin preview by mel pokryvat vsechny pipeline kroky ktere admin muze konfigurovat na teto strance.

### [2026-02-13] [TOKEN] AdminLayout -- 20+ textu hardcoded anglicky, jen 1 prelozeny
- **Kde:** `src/pages/admin/AdminLayout.jsx:7-39` (ADMIN_NAV), `228` ("ADMIN CONSOLE"), `289` ("STATUS: ONLINE"), `429` ("Admin Console")
- **Symptom:** Vsechny navigacni labely (Dashboard, Branding, Pricing, Fees, Presets, Parameters, Express, Shipping, Coupons, Orders, Model Storage, Widget, Emails, Analytics, Team, Migration), skupinove nadpisy (CONFIGURATION, PRICING, OPERATIONS), staticke texty ("ModelPricer", "ADMIN CONSOLE", "STATUS: ONLINE", "Admin Console") a aria-labely jsou hardcoded v anglictine. Jediny prelozeny text je `t('nav.home')` v footer linku.
- **Pricina:** Admin panel byl vytvoren s anglickymi labely jako prototyp, i18n nebyla aplikovana.
- **Oprava:** Pridat prekladove klice do LanguageContext (napr. `admin.nav.dashboard`, `admin.nav.branding`, `admin.nav.group.configuration`, atd.) a pouzit `t()` ve vsech user-facing textech.
- **Pouceni:** Admin panel musi byt lokalizovany stejne jako verejne stranky. Anglicke labely v ceskem admin panelu jsou nekonzistentni s verejnym UI.

### [2026-02-13] [WCAG] AdminLayout -- chybejici aria-current="page" na aktivnim nav itemu
- **Kde:** `src/pages/admin/AdminLayout.jsx:138-179` (renderNavItem)
- **Symptom:** Aktivni navigacni polozka ma vizualni zvyrazneni (teal barva, levy border, pozadi) ale nema `aria-current="page"`. Screen reader neoznami ktera polozka je aktualni.
- **Pricina:** Accessibility opominuta pri implementaci navigace.
- **Oprava:** Pridat `aria-current={active ? 'page' : undefined}` na `<Link>` element v `renderNavItem`.
- **Pouceni:** Aktivni navigacni polozka MUSI mit `aria-current="page"` (WAI-ARIA). Vizualni zvyrazneni nestaci pro screen readery.

### [2026-02-13] [WCAG] AdminLayout -- mobile drawer bez focus trap a Escape handleru
- **Kde:** `src/pages/admin/AdminLayout.jsx:352-384` (mobile drawer)
- **Symptom:** (1) Po otevreni mobile draweru neni focus zachycen uvnitr -- uzivatel muze tabbovat za overlay do obsahu. (2) Escape klavesa drawer nezavre. (3) Hamburger button nema `aria-expanded`.
- **Pricina:** Drawer implementovan jen s vizualnimi efekty (overlay klik, body scroll lock) bez klavesnicove pristupnosti.
- **Oprava:** (1) Pridat focus trap (napr. `react-focus-lock` nebo manualni `tabindex` management). (2) Pridat `useEffect` s `keydown` listenerem pro Escape klavesu. (3) Pridat `aria-expanded={mobileDrawerOpen}` na hamburger button.
- **Pouceni:** Overlay/drawer patterny MUSI implementovat focus trap + Escape handler + aria-expanded (WAI-ARIA Dialog pattern).

### [2026-02-13] [WCAG] AdminLayout -- nav element bez aria-label, koliduje s Header nav
- **Kde:** `src/pages/admin/AdminLayout.jsx:233`
- **Symptom:** Admin sidebar obsahuje `<nav>` element bez `aria-label`. Stranka ma zaroven public Header ktery take obsahuje navigaci. Screen reader nerozlisi mezi "Admin navigace" a "Hlavni navigace" -- obe jsou oznameny jako "navigation".
- **Pricina:** Chybejici aria-label na admin nav elementu.
- **Oprava:** Pridat `aria-label="Admin navigation"` na `<nav>` element v sidebaru.
- **Pouceni:** Pokud stranka obsahuje vice navigation landmarku, kazdy musi mit unikatni `aria-label` pro rozliseni.

### [2026-02-13] [INLINE-STYLE] AdminLayout -- hover stavy pres JS misto CSS :hover
- **Kde:** `src/pages/admin/AdminLayout.jsx:163-174` (nav item hover), `307-314` (back link hover)
- **Symptom:** Hover efekty na nav items a back linku jsou implementovany pres `onMouseEnter`/`onMouseLeave` JS handlery ktery manualne meni `style` atributy. To zpusobuje: (1) Hover nefunguje na dotykovych zarizenich spravne (touch-hover ghosting). (2) Pri rychlem pohybu mysi muze zustat element v hover stavu (race condition). (3) Focus stav (keyboard navigace) nespousti hover vizual.
- **Pricina:** Vsechny styly jsou inline -- CSS `:hover` pseudo-tridu nelze pouzit v inline stylech.
- **Oprava:** Extrahovat styly do CSS modulu nebo styled-components kde lze pouzit `:hover` a `:focus-visible` pseudo-tridy.
- **Pouceni:** Inline styly neumoznuji pseudo-tridy (:hover, :focus, :active). Pro interaktivni elementy je to limitace -- JS hover handlery jsou krehci nez CSS.

### [2026-02-13] [LAYOUT] AdminLayout -- renderovany uvnitr public Header + Footer wrapperu
- **Kde:** `src/Routes.jsx:94` (AdminLayout je nested pod radkem 64-124 "Main app with Header/Footer")
- **Symptom:** Admin panel zobrazuje public Header (s odkazy na Home, Pricing, Support) nad admin obsahem a public Footer pod admin obsahem. Uzivatel vidi dva navigacni systemy -- public header navigace + admin sidebar navigace.
- **Pricina:** AdminLayout route je vnorena do catch-all `path="*"` bloku ktery wrappuje vsechny stranky do Header + Footer.
- **Oprava:** Presunout `<Route path="/admin" element={<AdminLayout />}>` blok na top-level urovni v Routes.jsx (vedle Widget Public Route a Slicer), mimo Header/Footer wrapper. Analogicky jako je udelano pro AdminWidgetBuilder (radek 62).
- **Pouceni:** Admin layout by mel byt nezavisly na public layoutu. Sdileny Header/Footer u admin panelu je matouci pro uzivatele a plytva vertikalnim prostorem.

### [2026-02-13] [INLINE-STYLE] AdminFees — ~890 radku inline CSS v style tagu
- **Kde:** `src/pages/admin/AdminFees.jsx:1528-2413`
- **Symptom:** Cela CSS vrstva stranky (~890 radku) je vlozena jako inline `<style>` tag na konci JSX. To zvysuje velikost komponenty na ~2418 radku a ztezuje udrzbu — CSS neni cachovane prohlizecem a zmena jednoho stylu vyzaduje editaci JSX souboru.
- **Pricina:** Pravdepodobne zvoleno pro jednodussi vyvoj bez externiho CSS souboru a rizika kolizi tridy.
- **Oprava:** Extrahovat CSS do `src/pages/admin/styles/AdminFees.css` nebo pouzit CSS modules. Alternativne pouzit Forge utility classes kde je to mozne.
- **Pouceni:** Inline `<style>` tagy v React komponentach jsou akceptabilni pro male bloky (<50 radku), ale 890+ radku patri do externiho souboru.

### [2026-02-13] [LAYOUT] AdminFees — 2418 radku v jednom souboru bez subkomponent
- **Kde:** `src/pages/admin/AdminFees.jsx` (cely soubor)
- **Symptom:** Cela stranka vcetne helper funkci (normalizeFeeUi, evaluateCondition, simulateFeeAmount), komponentniho stavu, CRUD handleru, 5 tabu renderovani a CSS je v jednom souboru. Neexistuji zadne subkomponenty v `components/fees/`.
- **Pricina:** Postupny rust souboru bez refactoru do subkomponent. Puvodni implementace mohla byt mensi.
- **Oprava:** Rozdelit na subkomponenty: `FeeListPanel.jsx`, `FeeEditorDialog.jsx`, `FeeConditionEditor.jsx`, `FeeSimulator.jsx`. Helper funkce extrahovat do `utils/feeHelpers.js`.
- **Pouceni:** Komponenty nad ~500 radku by mely byt rozdeleny. 2400+ radku v jednom souboru vyrazne snizuje citelnost a ztezuje code review.

### [2026-02-13] [TOKEN] AdminFees — inline preklady misto LanguageContext
- **Kde:** `src/pages/admin/AdminFees.jsx:418-467` (ui useMemo)
- **Symptom:** Vsechny prekladove texty (40+ retezcu) jsou definovane inline v `useMemo` bloku primo v komponente misto v `LanguageContext.jsx` kde jsou preklady pro vsechny ostatni stranky. Cini texty nepouzitelnymi pro jine komponenty a ztezuje centralni spravu prekladu.
- **Pricina:** Rychlejsi implementace — inline preklady nevyzaduji aktualizaci centralni slovniku.
- **Oprava:** Presunout klice do `LanguageContext.jsx` pod `admin.fees.*` namespace a pouzivat `t('admin.fees.title')` misto `ui.title`.
- **Pouceni:** I kdyz inline preklady funguji, porusuji princip jedineho zdroje pravdy pro i18n. Vsechny user-facing texty patri do centralni lokalizace.

### [2026-02-13] [WCAG] AdminFees — tab navigace bez ARIA roles
- **Kde:** `src/pages/admin/AdminFees.jsx:1032-1044` (tab-bar v ForgeDialog)
- **Symptom:** 5-tabova navigace v modalni okne pouziva `<button>` elementy bez `role="tab"`, `aria-selected`, `aria-controls`. Wrapper `div.tab-bar` nema `role="tablist"`. Tab content nema `role="tabpanel"` ani `id` pro propojeni.
- **Pricina:** Accessibility nebyla v implementaci tabu zohlednena.
- **Oprava:** (1) Pridat `role="tablist"` na `.tab-bar` div. (2) Pridat `role="tab"`, `aria-selected={activeTab === tab.id}`, `aria-controls` na kazdy button. (3) Pridat `role="tabpanel"`, `id` na content div.
- **Pouceni:** Tab patterny vzdy implementovat podle WAI-ARIA Authoring Practices. Stejny problem jako Account stranka (viz drive v logu).

### [2026-02-13] [WCAG] AdminFees — fee-row jako div s onClick bez keyboard support
- **Kde:** `src/pages/admin/AdminFees.jsx:970` (fee-row div)
- **Symptom:** Fee radky v seznamu pouzivaji `<div onClick={...}>` bez `role="button"`, `tabIndex={0}` ani `onKeyDown` handleru. Uzivatel s klavesnici nemuze otevrit editor pro konkretni fee — fokusu nelze nastavit na radek.
- **Pricina:** Fee radek implementovan jako vizualni element s klik handlerem bez ohledu na pristupnost.
- **Oprava:** Pridat `role="button"`, `tabIndex={0}`, `onKeyDown` handler na fee-row div. Alternativne pouzit `<button>` element.
- **Pouceni:** Interaktivni `<div onClick>` BEZ `role`/`tabIndex`/`onKeyDown` je WCAG 2.1.1 poruseni. Stejny pattern jako RoleSelectionCard v Register strance.

### [2026-02-13] [TOKEN] AdminWidget/WidgetEmbed — hardcoded TENANT_ID v WidgetEmbed a WidgetPreview
- **Kde:** `src/pages/widget/WidgetEmbed.jsx:14`, `src/pages/widget/WidgetPreview.jsx:15`
- **Symptom:** `const TENANT_ID = 'test-customer-1'` pouzivan pro vsechny widget embed a preview requesty. V multi-tenant prostredi by vsechny widgety ukazovaly na jednoho tenanta.
- **Pricina:** Demo-only zjednoduseni (Varianta A). Komentare v kodu toto priznavaji.
- **Oprava:** Implementovat tenant resolution z URL, tokenu nebo hostname mappingu.
- **Pouceni:** Invariant #3 z CLAUDE.md: "Tenant-scoped storage — zadny hardcode tenantId."

### [2026-02-13] [TOKEN] AdminWidget/WidgetEmbed — postMessage type nekonzistence MODELPRICER_WIDGET_HEIGHT vs MODELPRICER_RESIZE
- **Kde:** `src/pages/widget/WidgetEmbed.jsx:40` vs `src/pages/admin/components/WidgetEmbedTab.jsx:30`
- **Symptom:** WidgetEmbed odesila `type: 'MODELPRICER_WIDGET_HEIGHT'`, ale generovany embed kod posloucha `type: 'MODELPRICER_RESIZE'`. Auto-resize nebude fungovat pokud zakaznik pouzije embed kod z AdminWidget tabu.
- **Pricina:** Dva ruzne vyvojove cykly bez synchronizace nazvu zprav.
- **Oprava:** Sjednotit na jeden nazev (napr. `MODELPRICER_RESIZE`) a aktualizovat WidgetEmbed.jsx. Pripadne embed kod updatovat aby akceptoval oba.
- **Pouceni:** PostMessage types musi byt definovany jako konstanty ve sdilem modulu, ne hardcoded stringy v ruznych souborech.

### [2026-02-13] [TOKEN] AdminWidget/WidgetEmbed — postMessage target origin '*' (bezpecnostni riziko)
- **Kde:** `src/pages/widget/WidgetEmbed.jsx:41`
- **Symptom:** `window.parent?.postMessage(..., '*')` odesila zpravy na libovolny origin. Utocnik muze vlozit iframe a odposlouchavat vyskove zpravy.
- **Pricina:** Zjednoduseni pro demo — WidgetPublicPage.jsx ma spravnejsi `getTargetOrigin()` funkci, ale WidgetEmbed ji nepouziva.
- **Oprava:** Pouzivat `document.referrer` origin jako target (jak to dela WidgetPublicPage.jsx), nebo nacist povolene originy z widget konfigurace.
- **Pouceni:** PostMessage vzdy posilat s co nejpresnejsim target origin. `'*'` pouzivat jen kdyz je absolutne nutne.

### [2026-02-13] [WCAG] AdminWidget — modal pro vytvoreni widgetu bez focus trap a Escape handleru
- **Kde:** `src/pages/admin/AdminWidget.jsx:664-718`
- **Symptom:** Modal nema focus trap (uzivatel muze tabovat ven), Escape klaves nezavira modal, chybi `role="dialog"` a `aria-modal="true"`.
- **Pricina:** Modal implementovan jako jednoduchy overlay s click-outside zavrenim, bez keyboard accessibility.
- **Oprava:** Pridat focus trap, Escape handler, `role="dialog"`, `aria-modal="true"`.
- **Pouceni:** Modalni dialogy MUSI implementovat WAI-ARIA Dialog pattern: focus trap + Escape + role.

### [2026-02-13] [WCAG] AdminWidget — widget card list bez ARIA roles pro vyberovy seznam
- **Kde:** `src/pages/admin/AdminWidget.jsx:459-541`
- **Symptom:** Seznam widgetu je vizualne klikatelny ale nema `role="listbox"` / `role="option"` semantiku. Screen reader nerozpozna vyberovy seznam.
- **Pricina:** Karty implementovany jako `<div onClick>` bez ARIA.
- **Oprava:** Pridat `role="listbox"` na wrapper, `role="option"` + `aria-selected` na karty.
- **Pouceni:** Interaktivni seznamy s vyberem jedne polozky pouzivat listbox/option ARIA pattern.

### [2026-02-13] [TOKEN] AdminAnalytics — BUG: generateCsv vrati string, handleExport ocekava objekt
- **Kde:** `src/pages/admin/AdminAnalytics.jsx:274` vs `src/utils/adminAnalyticsStorage.js:314-371`
- **Symptom:** `handleExport()` na radku 274 destructuruje `const { filename, csv } = generateCsv(...)`. Funkce `generateCsv` vraci plain string (CSV obsah), ne objekt. Destructuring `{ filename, csv }` ze stringu da `undefined` pro obe promenne. Vysledkem je prazdny stahovany soubor s nazvem "undefined".
- **Pricina:** Nesoulad mezi ocekavanym API (objekt `{ filename, csv }`) a skutecnou implementaci (plain string). Pravdepodobne zmena v jednom souboru bez aktualizace druheho.
- **Oprava:** (1) Upravit `generateCsv` aby vracela `{ filename: 'analytics_calculations_2026-02-13.csv', csv: '...' }`, nebo (2) upravit `handleExport` aby pracoval s plain stringem a sam sestavil filename.
- **Pouceni:** Pri zmene navratoveho typu funkce aktualizovat VSECHNA mista ktere funkci volaji. TypeScript by tuto chybu zachytil v compile time.

### [2026-02-13] [TOKEN] AdminAnalytics — hardcoded tenant ID v analytics storage
- **Kde:** `src/utils/adminAnalyticsStorage.js:9-10`
- **Symptom:** `DEFAULT_TENANT_ID = 'demo-tenant'` a `STORAGE_PREFIX = 'modelpricer:demo-tenant:analytics'` — tenant ID je hardcoded jako konstanta. Nerespektuje `getTenantId()` z `adminTenantStorage.js`.
- **Pricina:** Implementace pro demo rezim bez multi-tenant podpory.
- **Oprava:** Importovat `getTenantId` a pouzit dynamicky prefix: `modelpricer:${getTenantId()}:analytics`.
- **Pouceni:** Invariant #3 z CLAUDE.md: "Tenant-scoped storage — zadny hardcode tenantId/customerId." Plati i pro storage helpery.

### [2026-02-13] [TOKEN] AdminAnalytics — hardcoded mena "Kc" misto dynamickeho currency
- **Kde:** `src/pages/admin/AdminAnalytics.jsx:354,488,511,513,608`
- **Symptom:** Mena je vsude hardcoded jako ` Kc` — stat karty, tabulky, session detail. Nereaguje na jazyk (anglicky uzivatel vidi "Kc") ani na `currency` pole ktere session summary obsahuje (vraci 'CZK').
- **Pricina:** Zjednoduseni pro demo verzi s ceskou menou.
- **Oprava:** Cist `currency` z session summary a formatovat pomoci `Intl.NumberFormat` nebo podminenym mapovanim (CZK -> Kc, USD -> $, EUR -> E).
- **Pouceni:** Menou se musi ridit data (session.summary.currency), ne hardcoded string v UI.

### [2026-02-13] [TOKEN] AdminAnalytics — "overview" export typ neni implementovan v generateCsv
- **Kde:** `src/utils/adminAnalyticsStorage.js:314-371` + `src/pages/admin/AdminAnalytics.jsx:578`
- **Symptom:** Export select nabizi moznost "Shrnuti prehledu" / "Overview summary" (`value="overview"`). Funkce `generateCsv` nema handler pro typ `'overview'` — spadne do default vetve ktera vrati `['message', 'unknown export type']`. Uzivatel dostane CSV s jednim radkem "unknown export type".
- **Pricina:** Export typ pridan do UI ale ne do storage funkce.
- **Oprava:** Pridat `if (type === 'overview')` vetev do `generateCsv` ktera exportuje agregovane metriky.
- **Pouceni:** Kazda moznost v UI selectu musi mit odpovidajici implementaci v datove vrstve.

### [2026-02-13] [WCAG] AdminAnalytics — tab navigace bez ARIA roles
- **Kde:** `src/pages/admin/AdminAnalytics.jsx:336-342` (tabs), `58-68` (TabButton)
- **Symptom:** Tab navigace pouziva `<button>` elementy bez `role="tab"`, `aria-selected`, `aria-controls`. Wrapper nema `role="tablist"`. Tab panely nemaji `role="tabpanel"`. Screen reader oznami taby jako bezna tlacitka.
- **Pricina:** Accessibility nebyla v implementaci tabu zohlednena.
- **Oprava:** (1) Pridat `role="tablist"` na `.mp-tabs` div. (2) Pridat `role="tab"`, `aria-selected={active}` na kazdy TabButton. (3) Pridat `role="tabpanel"` na content sekce. (4) Implementovat arrow key navigaci mezi taby.
- **Pouceni:** Tab patterny vzdy implementovat podle WAI-ARIA Authoring Practices.

### [2026-02-13] [TOKEN] AdminAnalytics — inline lokalizace misto centralniho t() slovniku
- **Kde:** `src/pages/admin/AdminAnalytics.jsx:115-202`
- **Symptom:** Preklady jsou definovane v inline `useMemo` slovniku (80+ klicu) pomoci `cs ? '...' : '...'`. Nepouziva `t()` z `useLanguage()`. Texty nejsou soucasti centralniho prekladoveho slovniku v `LanguageContext.jsx`.
- **Pricina:** Stranka implementovana nezavisle na centralizovanem i18n systemu.
- **Oprava:** Presunout vsech 80+ klicu do `LanguageContext.jsx` pod namespace `admin.analytics.*` a nahradit inline slovnik za volani `t()`.
- **Pouceni:** Vsechny user-facing texty maji byt v centralnim prekladovem slovniku. Inline slovniky ztezuji spravu prekladu.

### [2026-02-13] [TOKEN] AdminParameters — h1 nadpis "Parameters" hardcoded anglicky
- **Kde:** `src/pages/admin/AdminParameters.jsx:2336`
- **Symptom:** Nadpis `<h1>Parameters</h1>` je hardcoded v anglictine. Cesky uzivatel vidi anglicky nadpis na jinak ceske strance.
- **Pricina:** Chybejici inline ternary pro CS/EN prepnuti.
- **Oprava:** Zmenit na `<h1>{language === 'cs' ? 'Parametry' : 'Parameters'}</h1>`.
- **Pouceni:** Vsechny user-facing texty na admin strankach musi byt lokalizovane pres inline ternary nebo `t()`.

### [2026-02-13] [TOKEN] AdminParameters — "Enable all"/"Disable all" bez ceske varianty
- **Kde:** `src/pages/admin/AdminParameters.jsx:623-627`
- **Symptom:** Bulk akce tlacitka maji CS verzi nastavenou na stejny anglicky text: `language === 'cs' ? 'Enable all' : 'Enable all'`. Ceska varianta by mela byt "Zapnout vse" / "Vypnout vse".
- **Pricina:** Opomenuti pri implementaci — ternary pripraven ale CS text nevyplen.
- **Oprava:** Zmenit CS variantu na "Zapnout vse" a "Vypnout vse".
- **Pouceni:** Pri pouziti inline ternary overit ze CS a EN varianty jsou skutecne odlisne.

### [2026-02-13] [WCAG] AdminParameters — ConfirmModal bez Escape key handleru
- **Kde:** `src/pages/admin/AdminParameters.jsx:310-397`
- **Symptom:** ConfirmModal se zavre pouze kliknutim na "Cancel" nebo "Confirm" tlacitko. Chybi Escape key handler pro zavreni. Uzivatel s klavesnici nemuze modal zavrit standardnim zpusobem.
- **Pricina:** Keyboard event handling opominut v modalni komponente.
- **Oprava:** Pridat `useEffect` s `document.addEventListener('keydown')` pro Escape klavesu ktery zavola `onCancel`.
- **Pouceni:** Modalni dialogy MUSI podporovat Escape klavesu (WCAG 2.1.1, WAI-ARIA Dialog pattern).

### [2026-02-13] [WCAG] AdminParameters — ConfirmModal bez click-outside zavreni
- **Kde:** `src/pages/admin/AdminParameters.jsx:328`
- **Symptom:** Kliknuti na backdrop overlay (`.modal-backdrop`) nezavre modal. Overlay ma `role="dialog"` ale chybi onClick handler na backdrop.
- **Pricina:** Backdrop implementovan jen jako vizualni prvek, ne jako zaviraci mechanismus.
- **Oprava:** Pridat `onClick={onCancel}` na `.modal-backdrop` div a `onClick={(e) => e.stopPropagation()}` na `.modal` div aby klik na obsah modalu nezavre modal.
- **Pouceni:** Modalni dialogy by mely podporovat zavreni klikem mimo obsah — standardni UX ocekavani.

### [2026-02-13] [INLINE-STYLE] AdminParameters — nescopovane CSS tridy koliduji mezi komponentami
- **Kde:** `src/pages/admin/AdminParameters.jsx` (cely soubor, vsechny `<style>` bloky)
- **Symptom:** Interni komponenty pouzivaji genericke CSS nazvy (`.row`, `.title`, `.badge`, `.btn`, `.key`, `.meta`, `.value`, atd.) bez scope. Napr. `.badge` je definovana v `Badge` komponente (radek 286) i v `ParamRow` (radek 1252) s ruznym vizualem. `.title` je definovana v ConfirmModal (radek 357), KpiCard (radek 1562), ValidationPage (radek 2121) a ParamRow (radek 1220).
- **Pricina:** Kazda komponenta definuje sve styly nezavisle bez CSS modules, BEM konvence nebo scope.
- **Oprava:** Pouzit prefixovane nazvy (napr. `.param-badge`, `.kpi-title`, `.modal-btn`) nebo CSS modules.
- **Pouceni:** Genericke CSS nazvy v inline `<style>` blocich jsou spolehlivy zdroj kolizi. Pouzivat BEM-like prefixy nebo scope mechanismus.

### [2026-02-13] [TOKEN] AdminParameters — ParamRow props nesoulad (selected/onToggleSelected)
- **Kde:** `src/pages/admin/AdminParameters.jsx:1022` (definice) vs `669-676` (pouziti)
- **Symptom:** ParamRow definuje props `selected` a `onToggleSelected` (radek 1022), ale LibraryPage tyto props nepredava — predava jen `def`, `language`, `row` (jako `draft.parameters[def.key]`), `persistedRow` a `onChange`. ForgeCheckbox v ParamRow (radek 1123-1126) pouziva `selected` (ktery je `undefined`) a `onToggleSelected` (ktery je `undefined`), takze checkbox je nekontrolovany a nefunkcni.
- **Pricina:** Props interface se zmenilo pri refactoru (prechod z multi-select na per-row editing) ale ParamRow nebyla aktualizovana.
- **Oprava:** Bud odstranit `selected`/`onToggleSelected` z ParamRow a ForgeCheckbox, nebo pridat multi-select logiku do LibraryPage.
- **Pouceni:** Pri zmene props interface overit ze vsechny pouziti komponenty predavaji spravne props.

### [2026-02-13] [WCAG] AdminParameters — tab navigace bez ARIA roles
- **Kde:** `src/pages/admin/AdminParameters.jsx:2360-2377`
- **Symptom:** Tab navigace (Overview, Widget parametry, Knihovna Parametru, Validace) pouziva `<button>` elementy bez `role="tab"`, `aria-selected`, `aria-controls`. Wrapper nema `role="tablist"`. Tab content nema `role="tabpanel"`.
- **Pricina:** Pristupnost nebyla v implementaci tabulek zohlednena.
- **Oprava:** Pridat `role="tablist"` na wrapper, `role="tab"` a `aria-selected={active}` na kazdy button, `role="tabpanel"` na content oblast.
- **Pouceni:** Tab navigace vzdy implementovat s WAI-ARIA Tab patternem. Vizualni taby bez ARIA jsou pro screen readery nerozlisitelne od beznych tlacitek.

### [2026-02-13] [TOKEN] AdminTeamAccess — searchAuditEntries volani s nespravnou signaturou
- **Kde:** `src/pages/admin/AdminTeamAccess.jsx:150-158`
- **Symptom:** Audit log filtry (search, actor, entity, action, date from/to) nemaji zadny efekt — vzdy se zobrazi vsechny zaznamy. UI vola `searchAuditEntries({ q, actor_email, entity_type, action, date_from, date_to })` jako jediny argument, ale `filterAuditEntries(entries, filterObj)` ocekava pole zaznamu jako prvni argument a filtr jako druhy. Navic property nazvy se lisi (UI: `actor_email`/`entity_type`/`date_from`/`date_to` vs storage: `actor`/`entity`/`dateFrom`/`dateTo`).
- **Pricina:** Nesoulad mezi API kontraktem storage helperu a volanim v UI. Pravdepodobne zmena signatury storage funkce bez aktualizace UI.
- **Oprava:** Zmenit volani v UI na `searchAuditEntries(getAuditEntries(), { q: auditQ, actor: auditActor, entity: auditEntity, action: auditAction, dateFrom: auditDateFrom, dateTo: auditDateTo })`, nebo alternativne vytvorit wrapper v storage ktery nacte zaznamy sam.
- **Pouceni:** Pri zmene signatury storage funkce aktualizovat vsechna volajici mista. Idealne mit TypeScript typy nebo alespon JSDoc.

### [2026-02-13] [TOKEN] AdminTeamAccess — createInvite error handling pres try/catch ale funkce vraci { ok: false }
- **Kde:** `src/pages/admin/AdminTeamAccess.jsx:209-223`
- **Symptom:** Pri zadani neplatneho emailu, duplicitniho clena nebo prekroceni seat limitu se uzivatel nedozvi o chybe. `handleInviteSend` pouziva try/catch ale `createInvite` (alias `inviteUser`) nikdy nevyhazuje vyjimku — vraci `{ ok: false, error: 'REASON' }`.
- **Pricina:** UI predpoklada exception-based error handling ale storage helper pouziva result-based pattern.
- **Oprava:** Zmenit `handleInviteSend` na kontrolu navratove hodnoty: `const result = createInvite({...}); if (!result.ok) { setInviteError(result.error); return; }`.
- **Pouceni:** Vzdy overit error handling kontrakt volane funkce — result-based vs exception-based. Nesoulad zpusobi tichou ztratu chybovych stavu.

### [2026-02-13] [TOKEN] AdminTeamAccess — acceptInviteToken volani s nespravnymi argumenty
- **Kde:** `src/pages/admin/AdminTeamAccess.jsx:453`
- **Symptom:** Tlacitko "Simulate accept" nefunguje. UI vola `acceptInviteToken(inv.token, { name: inv.email.split('@')[0] })` kde prvni argument je string, ale storage funkce `acceptInviteToken({ token, name }, ctx)` ocekava objekt `{ token, name }`.
- **Pricina:** Nesoulad signatury — UI predpoklada `(token, options)` ale funkce ocekava `({token, name}, ctx)`.
- **Oprava:** Zmenit volani na `acceptInviteToken({ token: inv.token, name: inv.email.split('@')[0] })`.
- **Pouceni:** UI aliasy v storage helperech musi mit jasne dokumentovanou signaturu a idealne TypeScript typy.

### [2026-02-13] [WCAG] AdminTeamAccess — tab navigace bez ARIA roles
- **Kde:** `src/pages/admin/AdminTeamAccess.jsx:261-295`
- **Symptom:** Tri tab tlacitka (Users, Roles & Permissions, Audit Log) jsou implementovany jako bezne `<button>` elementy bez `role="tab"`, `aria-selected`, `aria-controls`. Wrapper nema `role="tablist"`. Tab content nema `role="tabpanel"`. Screen reader nerozpozna navigaci jako tab pattern.
- **Pricina:** Accessibility nebylo v implementaci zohledneno.
- **Oprava:** Pridat `role="tablist"` na wrapper div, `role="tab"` + `aria-selected` + `aria-controls` na kazdy button, `role="tabpanel"` + `id` + `aria-labelledby` na content kontejner. Implementovat arrow key navigaci.
- **Pouceni:** Tab patterny vzdy implementovat podle WAI-ARIA Authoring Practices — vizualni taby bez ARIA roles jsou pro screen readery nerozlisitelne od beznych tlacitek.

### [2026-02-13] [TOKEN] AdminTeamAccess — kompletni absence i18n krome titulku
- **Kde:** `src/pages/admin/AdminTeamAccess.jsx` (cele) + `src/pages/InviteAccept.jsx` (cele)
- **Symptom:** Vsechny texty krome `t('admin.teamAccess')` jsou hardcoded — tab labels, tabulkove hlavicky, button texty, modal texty, role popisy. Role popisy ("Plny pristup...", "Prace s objednavkami...") jsou v cestine uprostred jinak anglickeho UI. InviteAccept stranka je kompletne v anglictine.
- **Pricina:** Stranka vytvorena jako anglicky prototyp s castecnymi ceskymi texty, i18n nebylo prioritou.
- **Oprava:** Pridat `useLanguage()` a `t()` pro vsechny user-facing texty. Pridat prekladove klice do `LanguageContext.jsx`.
- **Pouceni:** Nove admin stranky musi mit i18n od zacatku. Michani jazyku na jedne strance je horsi nez konzistentni anglictina.

### [2026-02-13] [TOKEN] AdminTeamAccess — select role onChange nesynchronizuje vizualni stav
- **Kde:** `src/pages/admin/AdminTeamAccess.jsx:349-359`
- **Symptom:** Pri zmene role v selectu se zobrazi confirm dialog. Pokud uzivatel klikne Cancel, select vizualne zustava na nove hodnote ale data v localStorage se nezmeni. Vizualni stav selectu je nesynchronizovany s daty.
- **Pricina:** HTML select nativne zmeni svou hodnotu pred confirm dialogem. Po Cancel se nedochazi k obnoveni puvodniho stavu.
- **Oprava:** Pouzit controlled select s explicitnim state managementem — pri onChange ulozit novou hodnotu do docasneho stavu, po confirm zapsat do storage, po cancel obnovit puvodni hodnotu. Pripadne pouzit custom dropdown misto nativniho select.
- **Pouceni:** Nativni `<select>` s `window.confirm()` ve stredovem `onChange` vede k nesynchronizovanemu stavu. Pouzivat controlled pattern nebo custom UI.

### [2026-02-13] [TOKEN] Backend Email — emailProvider.js nepouzivany adapter
- **Kde:** `backend-local/src/email/emailProvider.js` (cely soubor) + `backend-local/src/email/emailService.js:33-54`
- **Symptom:** `emailProvider.js` definuje `createProvider()` factory s adapter patternem, ale `emailService.js` tuto factory vubec neimportuje ani nepouziva. Misto toho `sendEmail()` implementuje provider routing primo pres if/else bloky. Duplicitni logika ve dvou souborech.
- **Pricina:** Adapter pattern byl navrzeny, ale nebyl zapojen do hlavniho orchestratoru.
- **Oprava:** Refaktorovat `sendEmail()` aby pouzival `createProvider(providerConfig).send({ to, subject, html, from })` misto inline if/else.
- **Pouceni:** Pri implementaci adapter patternu vzdy overit ze factory je skutecne volana z orchestratoru. Dead code v codebase vytrvari falsenou iluzi funkcionality.

### [2026-02-13] [TOKEN] Backend Email — emailRoutes.js neni mountovany v index.js
- **Kde:** `backend-local/src/routes/emailRoutes.js` + `backend-local/src/index.js`
- **Symptom:** Express router `emailRoutes.js` existuje s 4 endpointy (`GET /templates`, `POST /preview`, `POST /send`, `GET /log`), ale neni importovany ani mountovany v `index.js`. Vsechny `/api/email/*` endpointy jsou nedostupne.
- **Pricina:** Router byl vytvoren ale nebyl pripojen do hlavni Express aplikace.
- **Oprava:** Pridat do `index.js`: `import emailRouter from './routes/emailRoutes.js'` a `app.use('/api/email', emailRouter)`.
- **Pouceni:** Po vytvoreni noveho Express routeru vzdy overit ze je mountovany v hlavnim `app.use()`. Existujici soubor bez mount pointu je mrtvy kod.

### [2026-02-13] [TOKEN] Backend Email — chybi escapovani jednoduche uvozovky v escapeHtml()
- **Kde:** `backend-local/src/email/templateRenderer.js:7-13`
- **Symptom:** `escapeHtml()` escapuje `&`, `<`, `>`, `"` ale chybi `'` -> `&#39;`. Pokud by budouci sablona pouzila atribut s jednoduchou uvozovkou (`title='{{var}}'`), mohlo by dojit k XSS.
- **Pricina:** Neuplna implementace HTML entity escapovani.
- **Oprava:** Pridat `.replace(/'/g, '&#39;')` do `escapeHtml()` funkce.
- **Pouceni:** HTML escape musi vzdy pokryvat vsech 5 kritickych znaku: `& < > " '`. Standardni OWASP doporuceni.

### [2026-02-13] [TOKEN] Backend Email — chybi email format validace
- **Kde:** `backend-local/src/email/emailService.js:19-21`
- **Symptom:** `sendEmail()` kontroluje pouze `if (!to || !subject)` — overuje ze `to` neni falsy, ale nevaliduje format emailove adresy. Prijme jakykoli neprazdny string.
- **Pricina:** Validace nebyla implementovana v demo fazi.
- **Oprava:** Pridat basic regex validaci emailu (napr. `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) nebo pouzit validacni knihovnu.
- **Pouceni:** I v demo/stub implementaci je dobre mit zakladni input validaci — predchazi se tim chybam pri budouci integraci s realnym providerem.

### [2026-02-13] [CODE] Backend Slicer — duplicitni spawnWithTimeout implementace
- **Kde:** `backend-local/src/slicer/runPrusaSlicer.js:27-55` a `backend-local/src/slicer/runPrusaInfo.js:13-42`
- **Symptom:** Funkce `spawnWithTimeout` je implementovana dvakrat — jednou v `runPrusaSlicer.js` a jednou v `runPrusaInfo.js`. Obe verze jsou temer identicke, ale lisi se v handlovani exit code: `runPrusaInfo` pouziva `code ?? 0` (fallback na 0 pri null), zatimco `runPrusaSlicer` pouziva `code` primo (muze byt null).
- **Pricina:** Moduly byly pravdepodobne psany nezavisle, bez sdileneho utility modulu.
- **Oprava:** Extrahovat `spawnWithTimeout` do sdileneho utility modulu (napr. `slicer/spawnUtil.js`) a pouzivat konzistentni exit code handling.
- **Pouceni:** Pri duplikaci utility funkce napric moduly extrahovat do sdileneho souboru. Nekonzistentni null handling u exit code muze zpusobit tichy false-positive.

### [2026-02-13] [CODE] Backend Slicer — zadny concurrency limit na /api/slice
- **Kde:** `backend-local/src/index.js:232-389`
- **Symptom:** Endpoint `/api/slice` nema zadny rate limiting ani queue. Kazdy request spousti novy PrusaSlicer proces (200-800 MB RAM) bez omezeni.
- **Pricina:** MVP implementace bez zohledneni zateze.
- **Oprava:** Pridat jednoduchy semaphore/queue (napr. `p-limit` nebo vlastni counter) pro omezeni soucasnych slicer jobu (doporuceno max 2-3).
- **Pouceni:** CPU/RAM intenzivni spawn operace musi mit concurrency limit. Bez nej muze nekolik soucasnych requestu vyradit server z provozu.

### [2026-02-13] [CODE] Backend Slicer — synchronni nacteni celeho G-code do pameti
- **Kde:** `backend-local/src/index.js:363`
- **Symptom:** `fs.readFile(run.outGcodePath, "utf8")` nacte cely G-code soubor do pameti. Pro slozite modely muze G-code mit stovky MB.
- **Pricina:** Jednoducha implementace bez streamovaneho cteni.
- **Oprava:** Pouzit `fs.createReadStream` s radkovym parserem a cist pouze prvnich/poslednich N radku misto celeho souboru.
- **Pouceni:** Velke soubory nikdy necist cele do pameti pres `readFile`. Pouzivat streamy nebo castecne cteni.

### [2026-02-13] [TOKEN] AdminEmails vs AdminCoupons — nekonzistentni Forge tokeny mezi Phase 3 strankami
- **Kde:** `src/pages/admin/AdminEmails.jsx:474-635` vs `src/pages/admin/AdminCoupons.jsx:783-986`
- **Symptom:** Vizualni nekonzistence mezi dvema strankami ktere by mely mit identicky vzor: (1) AdminEmails h1 ma `font-family: var(--forge-font-heading)`, AdminCoupons ne; (2) AdminEmails status-pill.dirty pouziva warning barvu (zluta), AdminCoupons pouziva error barvu (cervena); (3) AdminEmails admin-card pouziva `border-radius: var(--forge-radius-xl)`, AdminCoupons `var(--forge-radius-md)`; (4) AdminEmails card-header h2 je 16px heading font, AdminCoupons je 11px tech font uppercase; (5) AdminEmails admin-page ma `background: var(--forge-bg-void)`, AdminCoupons tuto vlastnost nema.
- **Pricina:** Stranky byly pravdepodobne psany nezavisle bez sdileneho CSS modulu. Inline `<style>` bloky se snadno rozchazi.
- **Oprava:** Sjednotit CSS styly obou stranek — idealne extrahovat sdileny admin CSS modul nebo pouzit konzistentni kopii. Doporuceny vzor: AdminEmails (pouziva heading font, void background, xl radius).
- **Pouceni:** Phase 3 lazy-loaded admin stranky se sdilenym vizualnim vzorem musi mit sdileny (nebo kopirovany s overenim) CSS blok. Inline styly se rozchazi pri nezavislom vyvoji.

### [2026-02-13] [WCAG] AdminEmails + AdminCoupons — tab navigace bez ARIA roles
- **Kde:** `src/pages/admin/AdminEmails.jsx:205-216` a `src/pages/admin/AdminCoupons.jsx:313-330`
- **Symptom:** Tab tlacitka jsou implementovany jako bezne `<button>` elementy bez `role="tab"`, `aria-selected`, `aria-controls`. Wrapper div nema `role="tablist"`. Tab content nema `role="tabpanel"`. Screen reader nerozpozna tab navigaci.
- **Pricina:** Accessibility nebylo v implementaci zohledneno (stejny problem jako u AdminTeamAccess).
- **Oprava:** Pridat `role="tablist"` na `.tab-bar` wrapper, `role="tab"` + `aria-selected` + `aria-controls` na kazdy `.tab-btn`, `role="tabpanel"` + `id` + `aria-labelledby` na content. Implementovat arrow key navigaci.
- **Pouceni:** Vsechny tab patterny v admin panelu maji stejny WCAG problem — melo by se resit systemove pres sdilenou TabBar komponentu.

### [2026-02-13] [TOKEN] AdminEmails — trigger smazani bez confirm dialogu
- **Kde:** `src/pages/admin/AdminEmails.jsx:110-116`
- **Symptom:** Funkce `removeTrigger(idx)` maze trigger okamzite bez confirm dialogu. Na rozdil od AdminCoupons kde `removeCoupon(idx)` a `removePromotion(idx)` maji `window.confirm()`.
- **Pricina:** Nekonzistentni implementace destruktivnich akci mezi Phase 3 strankami.
- **Oprava:** Pridat `window.confirm()` do `removeTrigger()` — stejny vzor jako v AdminCoupons.
- **Pouceni:** Destruktivni akce (smazani) musi vzdy vyzadovat potvrzeni. Viz invariant v CLAUDE.md sekce 9: "Destruktivni akce: confirm + disabled kdyz by rozbila stav."

### [2026-02-13] [TOKEN] AdminCoupons — chybejici validace (duplicitni kody, datumova konzistence)
- **Kde:** `src/pages/admin/AdminCoupons.jsx` (cele)
- **Symptom:** (1) Dva kupony mohou mit stejny kod — zadna duplicitni detekce. (2) `expires_at` muze byt pred `starts_at` — zadna datumova validace. (3) Kupon muze mit prazdny kod a byt aktivni. (4) Hodnota muze byt 0 pro percent/fixed typ (nulova sleva). Na rozdil od AdminFees ktery ma explicitni validacni useMemo s error indikaci.
- **Pricina:** AdminCoupons byl implementovan jako V1 stranka bez validacni logiky — data jsou sanitizovana na storage urovni ale ne na UI urovni.
- **Oprava:** Pridat validacni `useMemo` podobne jako v AdminFees: (1) duplicitni kody, (2) expires < starts, (3) prazdny kod u aktivniho kuponu, (4) nulova hodnota. Zobrazit error banner a disable Save tlacitko.
- **Pouceni:** Admin stranky s CRUD operacemi musi mit UI-level validaci krome storage-level normalizace. Normalizace opravuje data, validace informuje uzivatele.

### [2026-02-13] [TOKEN] AdminCoupons — applies_to pole bez navazne konfigurace
- **Kde:** `src/pages/admin/AdminCoupons.jsx:458-469`
- **Symptom:** Select pro "Plati pro" (applies_to) nabizi moznosti `category` a `specific_models`, ale po jejich vybranni se nezobrazuje zadne dalsi nastaveni — chybi input pro vyber kategorii nebo modelu. Uzivatel vybere "Kategorie" ale nemuze specifikovat kterou.
- **Pricina:** UI pripraveno na budouci rozsireni, ale implementace nebyla dokoncena.
- **Oprava:** Bud pridat navazne pole (category selector, model multi-select), nebo docasne skryt neimplementovane moznosti ze selectu a ponechat pouze "Vse".
- **Pouceni:** Formularove fieldy s neimplementovanymi moznostmi matou uzivatele. Lepsi je funkcionalitu nezobrazovat nez zobrazit nefunkcni.

### [2026-02-13] [TOKEN] AdminExpress vs AdminShipping — nekonzistentni Forge tokeny mezi dvema strankami
- **Kde:** `src/pages/admin/AdminExpress.jsx` (inline CSS) vs `src/pages/admin/AdminShipping.jsx` (inline CSS)
- **Symptom:** Dve stranky se stejnym UX patternem (2-column list+editor) pouzivaji rozdilne Forge tokeny a styly:
  - Status pill dirty barva: Express pouziva warning (zluta `rgba(255,181,71,...)`), Shipping pouziva error (cervena `rgba(255,71,87,...)`).
  - Panel border-radius: Express pouziva `--forge-radius-xl`, Shipping pouziva `--forge-radius-md`.
  - Card header h2: Express pouziva 16px + `--forge-font-heading`, Shipping pouziva 11px + `--forge-font-tech` (uppercase).
  - Input focus: Express pouziva jen `border-color`, Shipping pridava `box-shadow`.
  - Admin-page: Express ma explicitni `background: var(--forge-bg-void)`, Shipping ho nema.
- **Pricina:** Stranky byly pravdepodobne vytvoreny v ruznych fazich bez sdileneho CSS zakladu.
- **Oprava:** Sjednotit styly obou stranek — extrahovat sdilene CSS tridy do spolecneho souboru nebo pouzit konzistentni inline styly. Primarni standard: Express varianta (heading font pro h2, warning pro dirty, radius-xl pro panely, explicitni bg-void).
- **Pouceni:** Stranky se stejnym vizualnim patternem (2-column list+editor) by mely sdilet CSS definice nebo pouzivat spolecnou komponentu.

### [2026-02-13] [LAYOUT] AdminExpress — nepouzita funkce deepClone
- **Kde:** `src/pages/admin/AdminExpress.jsx:21-23`
- **Symptom:** Funkce `deepClone(obj)` je definovana ale nikde v kodu neni volana. Mrtvy kod.
- **Pricina:** Pravdepodobne pozustatek z drive implementace ktera pouzivala deep clone pro drafty.
- **Oprava:** Smazat funkci `deepClone` z AdminExpress.jsx.
- **Pouceni:** Mrtvy kod snizuje citelnost. Po refaktoringu kontrolovat nepouzite funkce.

### [2026-02-13] [TOKEN] AdminExpress + AdminShipping — duplikovane utility funkce
- **Kde:** `src/pages/admin/AdminExpress.jsx:15-28`, `src/pages/admin/AdminShipping.jsx:15-25`, `src/utils/adminExpressStorage.js:22-37`, `src/utils/adminShippingStorage.js:22-37`
- **Symptom:** Funkce `safeNum()` je definovana 4x (2x v JSX, 2x ve storage helperech). `createId()`/`uuid()` jsou definovany 4x se 4 ruznymi implementacemi a prefixovymi konvencemi. Kazda kopie se mirne lisi (napr. Express `createId` pouziva `crypto.randomUUID` s prefixem, storage `uuid` pouziva `crypto.randomUUID` bez prefixu).
- **Pricina:** Copy-paste vyvoj bez sdilene utility knihovny.
- **Oprava:** Extrahovat `safeNum()` a `createId()` do sdileneho utility modulu (napr. `src/utils/helpers.js`) a importovat ve vsech 4 souborech.
- **Pouceni:** Sdilene utility funkce by mely existovat v jednom miste. Kazda duplikace je potencialni zdroj nekonzistence.

### [2026-02-13] [LAYOUT] AdminShipping — chybejici validace delivery_days rozsahu
- **Kde:** `src/pages/admin/AdminShipping.jsx:380-401`
- **Symptom:** Uzivatel muze nastavit `delivery_days_min` vetsi nez `delivery_days_max` (napr. MIN=5, MAX=2). Neni zadne vizualni upozorneni ani automaticka korekce. V seznamu se pak zobrazi "5-2 dni" coz je nekonzistentni.
- **Pricina:** Formularova pole jsou nezavisle number inputy bez vzajemne validace.
- **Oprava:** Pridat validaci: pokud MIN > MAX, zobrazit warning border/text a pri save automaticky prohodit hodnoty. Nebo omezit MIN input `max` atributem na aktualni MAX hodnotu a naopak.
- **Pouceni:** Rozsahove inputy (min/max) vyzaduji vzajemnou validaci. Nikdy nenechavat oba pole nezavisle.

### [2026-02-13] [CODE] Backend presetsStore — zadne atomic writes pro presets.json
- **Kde:** `backend-local/src/presetsStore.js:42`
- **Symptom:** `writePresetsState()` pise primo do `presets.json` pres `fs.writeFile()`. Pokud proces spadne behem zapisu (napr. OOM kill, SIGKILL, vypadek proudu), soubor muze zustat prazdny nebo corrupted. Nasledujici `readPresetsState()` pak vraci prazdny stav `{ presets: [], defaultPresetId: null }` — vsechny presety jsou ztraceny.
- **Pricina:** MVP implementace bez atomic write patternu.
- **Oprava:** Implementovat write-to-temp-then-rename pattern: `fs.writeFile(statePath + '.tmp', data)` nasledovane `fs.rename(statePath + '.tmp', statePath)`. Rename je na POSIX atomic operace na stejnem filesystem.
- **Pouceni:** Dulezita state data (JSON soubory) musi pouzivat atomic write (temp + rename). `fsSafe.js` by mel obsahovat sdilenou `atomicWriteFile()` utility.

### [2026-02-13] [CODE] Backend presetsStore — read-modify-write race condition
- **Kde:** `backend-local/src/presetsStore.js:50-80` (createPresetFromIni), `:82-105` (updatePresetMeta), `:107-114` (setDefaultPreset), `:116-136` (deletePreset)
- **Symptom:** Vsechny CRUD operace ctou cely state z disku, modifikuji v pameti a zapisuji zpet. Dva soucasne requesty (napr. paralelni create + update) mohou zpusobit, ze druhy zapis prepise zmeny prvniho — lost update problem.
- **Pricina:** File-system based persistence bez locking mechanismu.
- **Oprava:** Pridat per-tenant in-memory mutex (napr. `async-mutex` nebo jednoduchy Promise chain) pro serializaci write operaci. Budouci reseni: migrace na databazi s transakcemi.
- **Pouceni:** File-system CRUD bez locking je akceptovatelny jen pro single-user/low-concurrency scenare. Jakmile je moznost paralelnich requestu, potreba serializace.

### [2026-02-13] [CODE] Backend storage — trash name encoding kolize pri `___` v nazvu
- **Kde:** `backend-local/src/storage/storageService.js:284-301` (softDelete), `:310-339` (restoreFromTrash)
- **Symptom:** Soft delete koduje cestu nahrazenim `/` za `___`. Obnova dekoduje zpet pres `split("___")`. Pokud nazev souboru nebo slozky sam obsahuje retezec `___`, dekodovani vygeneruje nekorektni cestu — soubor nebude obnoven na puvodni misto.
- **Pricina:** Jednoduchy encoding pouziva delimiter ktery muze byt v nazvu souboru.
- **Oprava:** Pouzit URL-safe encoding (napr. `encodeURIComponent` pro kazdy segment) nebo Base64 encoding pro celou cestu. Alternativne ulozit puvodni cestu v sidecar JSON souboru vedle trash polozky.
- **Pouceni:** Delimitery v nazevch souboru musi byt unikatni nebo escapovane. Jednoduchy string replace neni dostatecny pro round-trip encoding.

### [2026-02-13] [TOKEN] AdminMigration — kompletni absence i18n
- **Kde:** `src/pages/admin/AdminMigration.jsx` (cely soubor, 407 radku)
- **Symptom:** Vsechny user-facing texty jsou hardcoded v anglictine: "Database Migration", "Download Backup", "Dry Run", "Migrate to Supabase", "Enable Dual-Write (all)", "Switch to Supabase (all)", "Rollback to localStorage (all)", tabulkove hlavicky, confirm dialogy.
- **Pricina:** Stranka vznikla jako intern-admin nastroj kde lokalizace nebyla prioritou.
- **Oprava:** Pridat `useLanguage()` a `t()` pro vsechny texty. Alternativne ponechat anglicky pokud je stranka urcena pouze pro vyvojare/adminy.
- **Pouceni:** I intern-admin stranky by mely byt konzistentni s lokalizacni strategii zbytku admin panelu.

### [2026-02-13] [CODE] AdminMigration — order_items duplikace pri opakovanem spusteni migrace
- **Kde:** `src/lib/supabase/migrationRunner.js:339`
- **Symptom:** Migrace objednavek pouziva `upsert` pro `orders` tabulku (bezpecne), ale `insert` pro `order_items`. Pri opakovanem spusteni migrace se order items zduplikuji.
- **Pricina:** Order items nemaji unique constraint na `order_id + item_number`, takze upsert neni mozny bez upravy DB schematu.
- **Oprava:** (1) Pridat unique constraint `(order_id, item_number)` a pouzit upsert, nebo (2) pred migraci smazat existujici items pro danou objednavku, nebo (3) preskocit insert pokud objednavka jiz existuje.
- **Pouceni:** Migrace musi byt idempotentni na vsech urovnich — pokud hlavni entita pouziva upsert, child entity musi byt take bezpecne pro opakovaney spusteni.

### [2026-02-13] [CODE] AdminMigration — feature flags jsou tenant-agnosticke
- **Kde:** `src/lib/supabase/featureFlags.js:14`
- **Symptom:** Feature flags jsou ulozeny pod globalnim klicem `modelpricer:feature_flags:storage_modes` bez tenant prefixu. Pokud admin spravuje vice tenantu, zmena modu ovlivni vsechny tenanty najednou.
- **Pricina:** Feature flags byly navrzeny pro single-tenant pouziti.
- **Oprava:** Pridat tenant prefix: `modelpricer:{tenantId}:feature_flags:storage_modes`.
- **Pouceni:** V multi-tenant systemu musi byt kazda konfigurace tenant-scoped. I metadata o storage rezimu patri do tenant namespace.

### [2026-02-13] [CODE] AdminMigration — nesoulad ALL_NAMESPACES (20) vs MIGRATIONS (19)
- **Kde:** `src/lib/supabase/featureFlags.js:17-38` vs `src/lib/supabase/migrationRunner.js:18-171`
- **Symptom:** `featureFlags.js` definuje 20 namespaces vcetne `dashboard:v1`, ale `migrationRunner.js` definuje pouze 19 migraci (013 je pro `dashboard:v2`). Namespace `dashboard:v1` lze prepnout na supabase mod, ale migrace neexistuje.
- **Pricina:** `dashboard:v1` je legacy namespace nahrazeny `dashboard:v2`, nebyl odstranen z `ALL_NAMESPACES`.
- **Oprava:** (1) Pridat migraci pro `dashboard:v1`, nebo (2) odstranit z `ALL_NAMESPACES`, nebo (3) pridat komentar proc je v seznamu bez migrace.
- **Pouceni:** Seznamy pro stejnou domenu v ruznych modulech musi byt synchronizovane nebo explicitne dokumentovane.

### [2026-02-13] [WCAG] AdminMigration — destruktivni akce pres window.confirm
- **Kde:** `src/pages/admin/AdminMigration.jsx:60,102,109`
- **Symptom:** Tri destruktivni akce pouzivaji `window.confirm()` — nativni dialog nelze stylovat, nema Forge theme, texty v anglictine bez lokalizace. Blokuje hlavni vlakno.
- **Pricina:** Jednoducha MVP implementace.
- **Oprava:** Nahradit za `ForgeDialog` s vlastnim stylingem a lokalizaci.
- **Pouceni:** Destruktivni akce v admin panelu maji pouzivat ForgeDialog misto nativniho `window.confirm()`.

### [2026-02-13] [CODE] AdminMigration — backup bez restore funkcionality
- **Kde:** `src/pages/admin/AdminMigration.jsx:80-89` + `src/lib/supabase/migrationRunner.js:493-511`
- **Symptom:** Stranka umoznuje stahnout JSON backup, ale neobsahuje zadnou funkcionalitu pro nahrani backupu zpet. Restore je manualni pres DevTools.
- **Pricina:** Restore nebyl implementovan v prvni fazi.
- **Oprava:** Pridat "Upload Backup" tlacitko s file inputem, validaci JSON struktury a zapisem dat zpet do localStorage.
- **Pouceni:** Backup bez restore je pouze polovicni reseni. Pro produkci-ready migracni nastroj je restore nezbytny.

### [2026-02-13] [CODE] Duplicitni useAuth — dva soubory, dva ruzne kontrakty
- **Kde:** `src/context/AuthContext.jsx:36-40` + `src/hooks/useAuth.js:5-17`
- **Symptom:** V projektu existuji DVA exporty `useAuth()` s ruznymi kontrakty. AuthContext verze vraci `{ currentUser, loading }` (s Firestore profilem), hooks verze vraci `{ user }` (bez profilu, bez loading). Importujici komponenty musi vedet kterou verzi importuji.
- **Pricina:** Hooks verze byla pravdepodobne vytvorena drive nez AuthContext verze. Obe zustavaji v kodebazi.
- **Oprava:** Konsolidovat na jednu implementaci (preferovane AuthContext verze ktera ma loading stav i Firestore profil). Odstranit `src/hooks/useAuth.js` a aktualizovat importy v souborech ktere ho pouzivaji.
- **Pouceni:** Duplicitni hooky se stejnym nazvem ale ruznymi kontrakty jsou zdrojem tezko laditelnych bugu. Vzdy overit zda hook s danym nazvem jiz existuje pred vytvorenim noveho.

### [2026-02-13] [CODE] Firestore rules — prilis siroky wildcard pristup
- **Kde:** `firestore.rules:15-17`
- **Symptom:** Pravidlo `match /{document=**} { allow read, write: if request.auth != null; }` umoznuje kazdemu prihlasenenmu uzivateli cist a zapisovat do LIBOVOLNE kolekce. Zadna tenant izolace.
- **Pricina:** Jednoducha pocatecni konfigurace bez granularnich pravidel.
- **Oprava:** Pridat per-collection pravidla s tenant-level izolaci (napr. `match /tenants/{tenantId}/{document=**} { allow read, write: if request.auth.token.tenantId == tenantId; }`). Odstranit wildcard pravidlo.
- **Pouceni:** Firestore wildcard pravidla jsou vhodna pro prototypovani, ale v produkci musi byt nahrazena granularnimi pravidly s tenant izolaci.

### [2026-02-13] [CODE] Firestore rules — verejne cteni uzivatelskych profilu
- **Kde:** `firestore.rules:9`
- **Symptom:** `allow read: if true` na kolekci `/users/{userId}` umoznuje komukoli (vcetne neprihlasennych) cist profily vsech uzivatelu.
- **Pricina:** Pravdepodobne zamysleno pro verejne zobrazovani uzivatelskych jmen, ale prilis siroky scope (cela kolekce, vsechna pole).
- **Oprava:** Zmenit na `allow read: if request.auth != null` nebo pouzit field-level security (napr. oddeleni verejnych a soukromych dat do subkolekcí).
- **Pouceni:** `if true` v Firestore rules by melo byt pouzivano velmi opatrne. I pro verejne data je lepsi omezit na prihlasene uzivatele nebo pouzit get-list rozdeleni.

### [2026-02-13] [CODE] LanguageContext.jsx -- inline slovnik 1131 radku bez externi separace
- **Kde:** `src/contexts/LanguageContext.jsx:43-1130`
- **Symptom:** 462 prekladovych klicu pro 2 jazyky (CS/EN) definovano inline v jednom souboru. Soubor ma 1131 radku, z toho ~1090 jsou retezce slovniku. Obtizna udrzba, merge konflikty, nemoznost predani prekladateli.
- **Pricina:** Jednoduchy MVP pristup bez externiho i18n frameworku.
- **Oprava:** Extrahovat slovnik do `src/locales/cs.json` a `src/locales/en.json`. LanguageContext by importoval JSON soubory misto inline definice.
- **Pouceni:** I u MVP projektu se vyplati separovat preklady od logiky. Inline slovnik se rychle stane neudrzovateny pri >100 klicich.

### [2026-02-13] [CODE] LanguageContext.jsx -- t() funkce bez warning logu pro chybejici klice
- **Kde:** `src/contexts/LanguageContext.jsx:32`
- **Symptom:** `t(key)` vraci samotny klic jako fallback kdyz preklad neexistuje, ale neloguje zadne varovani do console. Preklepy v klicich zustavaji neodhaleny.
- **Pricina:** Jednoducha implementace `translations[language][key] || key` bez diagnostiky.
- **Oprava:** V development modu pridat `console.warn` pro chybejici klice: `if (process.env.NODE_ENV !== 'production' && !translations[language][key]) console.warn('[i18n] Missing key:', key);`
- **Pouceni:** Fallback na klic je spravny pro produkci (zabranuje blank textu), ale v development modu by mel byt warning pro vcasne odhaleni chyb.

### [2026-02-13] [CODE] LanguageContext.jsx -- value objekt bez useMemo
- **Kde:** `src/contexts/LanguageContext.jsx:28-33`
- **Symptom:** `value` objekt v LanguageProvider se vytvari nova reference pri kazdem renderu. To potencialne zpusobi zbytecne re-rendery vsech 29 konzumentu.
- **Pricina:** Nebylo pouzito `useMemo`/`useCallback` pro optimalizaci.
- **Oprava:** Zabalit `value` do `useMemo` a `t` do `useCallback` s dependency na `[language]`.
- **Pouceni:** U Context provideru s mnoha konzumenty je dobre pouzit useMemo pro value objekt, i kdyz aktualni dopad na performance je minimalni (prepnuti jazyka je vzacna akce).

### [2026-02-13] [TOKEN] LanguageContext.jsx -- localStorage klic bez tenant prefixu
- **Kde:** `src/contexts/LanguageContext.jsx:16,21`
- **Symptom:** Jazykova preference je ulozena pod klicem `language` bez `modelpricer:` prefixu. Nekonzistentni s konvenci tenant-scoped klicu v projektu.
- **Pricina:** Language context byl implementovan pred zavedenim tenant storage konvence.
- **Oprava:** Zvazit zmenu na `modelpricer:language` pro konzistenci, ale zaroven pozor -- jazykova preference je zamerne globalni (ne per-tenant), coz je validni architektonicke rozhodnuti.
- **Pouceni:** I globalni preference by mely pouzivat konzistentni prefix pro snadnou identifikaci a pripadny cleanup localStorage.

### [2026-02-13] [TOKEN] vite.config.mjs — port definovan jako string misto number
- **Kde:** `vite.config.mjs:36`
- **Symptom:** `port: "4028"` je string, ale typova definice `ServerOptions.port` ocekava `number`.
- **Pricina:** Vite internu konvertuje string na number, takze to funguje, ale je to nekonzistentni s typy.
- **Oprava:** Zmenit `port: "4028"` na `port: 4028`.
- **Pouceni:** I kdyz runtime akceptuje oba typy, dodrzovat typove definice prevence chyb pri budoucich upgradech.

### [2026-02-13] [CODE] package.json — 6 nepouzitych Tailwind pluginu v devDependencies
- **Kde:** `package.json:103-107` + `tailwind.config.js:274-277`
- **Symptom:** 6 Tailwind pluginu (@tailwindcss/typography, aspect-ratio, container-queries, line-clamp, tailwindcss-elevation, tailwindcss-fluid-type) je nainstalovano v devDependencies, ale NENI registrovano v `tailwind.config.js` plugins poli.
- **Pricina:** Balicky byly pravdepodobne nainstalovany behem experimentovani, ale nikdy nebyly aktivovany.
- **Oprava:** Bud registrovat v plugins poli (pokud jsou zamyslene) nebo odinstalovat (`npm uninstall`).
- **Pouceni:** Po instalaci Tailwind pluginu vzdy overit registraci v `tailwind.config.js` plugins poli.

### [2026-02-13] [CODE] package.json — react-router-dom pinnuta verze bez semver range
- **Kde:** `package.json:65`
- **Symptom:** `react-router-dom` je pinnuto na presnou verzi `6.0.2` (bez `^`), zatimco vsechny ostatni balicky pouzivaji semver range.
- **Pricina:** Pravdepodobne zamerne kvuli kompatibilite, ale duvod neni zdokumentovany.
- **Oprava:** Bud pridat `^` prefix (`^6.0.2`) nebo zdokumentovat duvod pinnovani v package.json komentari/CLAUDE.md.
- **Pouceni:** Pinnovane verze bez dokumentace zpusobuji zmatek pri updatu zavislosti.

### [2026-02-13] [CODE] useStorageBrowser — chybi mountedRef anti-leak pattern
- **Kde:** `src/hooks/useStorageBrowser.js:1-164`
- **Symptom:** Vsechny async operace (loadFolder, doSearch, doDelete, doRestore, doCreateFolder, doRename, doUpload) volaji setState po await bez kontroly zda je komponenta stale mounted. Pri rychle navigaci pryc z `/admin/storage` muze React vyhodit warning "Can't perform a React state update on an unmounted component".
- **Pricina:** Hook byl napsany bez mountedRef patternu ktery pouzivaji useStorageQuery a useStorageMutation.
- **Oprava:** Pridat `const mountedRef = useRef(true)` s useEffect cleanup, a do kazdeho async callbacku pridat guard `if (!mountedRef.current) return` pred setState volanimi.
- **Pouceni:** Kazdy hook s async operacemi musi pouzivat mountedRef pattern. Konzistence napric hooks je dulezita — vsechny data hooky (Query, Mutation) ho maji, file browser hook ne.

### [2026-02-13] [CODE] useStorageMutation — callback dependency churn
- **Kde:** `src/hooks/useStorageMutation.js:73,106`
- **Symptom:** `mutate` a `mutateAsync` useCallback maji `onSuccess`, `onError`, `onSettled` v dependency array. Pokud caller preda inline funkce (non-memoized), `mutate` reference se zbytecne meni kazdy render.
- **Pricina:** Callbacky nejsou ulozeny v refs (na rozdil od useSupabaseRealtime ktery pouziva ref pattern pro callbacky).
- **Oprava:** Presunout onSuccess/onError/onSettled do refs (stejne jako onInsertRef atd. v useSupabaseRealtime) a odebrat je z useCallback dependencies.
- **Pouceni:** Hooks ktere prijimaji callback options by meli ukladat callbacky do refs aby zajistily stabilni reference na vracene funkce. useSupabaseRealtime to dela spravne, useStorageMutation ne.

### [2026-02-13] [TOKEN] Forge Design System — .forge-mono-bold duplicitni definice
- **Kde:** `src/styles/forge-typography.css:90` a `src/styles/forge-utilities.css:118`
- **Symptom:** Trida `.forge-mono-bold` je definovana dvakrat. V `forge-typography.css` bez `color`, v `forge-utilities.css` s `color: var(--forge-text-primary)`. Ktera varianta se aplikuje zavisi na cascade poradi importu.
- **Pricina:** Nezavisle pridani do dvou souboru pri rozdeleni Forge CSS.
- **Oprava:** Sjednotit definici do jednoho souboru (preferovane `forge-typography.css` jako kanonicky zdroj pro font tridy) a odstranit druhou.
- **Pouceni:** Pri rozdeleni CSS do vice souboru overit unikatnost selektoru napr. pres `grep -r '.forge-mono-bold'`.

### [2026-02-13] [TOKEN] Forge Design System — 14 nepouzivanych komponent
- **Kde:** `src/components/ui/forge/` (ForgeCard, ForgeColorPicker, ForgeInput, ForgePageHeader, ForgePriceBreakdown, ForgeProgressBar, ForgeSelect, ForgeSlider, ForgeStatCard, ForgeStatusBadge, ForgeTable, ForgeTabs, ForgeToast, ForgeToggle)
- **Symptom:** 14 z 26 Forge komponent neni importovano v zadne strance aplikace. Jsou dead code z hlediska produkcniho buildu.
- **Pricina:** Komponenty byly pripraveny dopredu pro admin redesign a widget builder, ktery jeste neprobehl.
- **Oprava:** Ponechat — jsou pripraveny pro budouci pouziti. Overit ze Vite tree-shaking je efektivne eliminuje z production bundle.
- **Pouceni:** Dokumentovat zamyslene pouziti nepouzivanych komponent aby se nepovazovaly za dead code k smazani.

### [2026-02-13] [LAYOUT] Forge Design System — ForgeSlider injektuje globalni style tag
- **Kde:** `src/components/ui/forge/ForgeSlider.jsx:67-119`
- **Symptom:** Pri prvnim renderovani ForgeSlider se injektuje `<style id="forge-slider-thumb-styles">` do `<head>` pro pseudo-element styling (`::-webkit-slider-thumb`, `::-moz-range-thumb`). Tento tag neni odstranen pri unmount komponenty.
- **Pricina:** Neni mozne stylovat pseudo-elementy pres inline styles, takze se pouziva globalni style injection.
- **Oprava:** Preskocit — singleton pattern (kontroluje existenci pres `document.getElementById`) zajistuje ze se tag vytvori maximalne jednou. Ale pro cistsi reseni by sel presunout do `forge-utilities.css`.
- **Pouceni:** Pseudo-element styling preferovat v CSS souborech. JS injection pouzivat jen jako posledni moznost a vzdy s cleanup pri unmount.

### [2026-02-13] [TOKEN] Forge Design System — chybejici spacing tokeny
- **Kde:** `src/styles/forge-tokens.css` (cely soubor)
- **Symptom:** Forge token system definuje barvy, typografii, radii, stiny, motion — ale NEMA spacing tokeny (`--forge-space-*`). Spacing je definovan ad-hoc primo v komponentach (8px, 12px, 16px, 20px, 24px).
- **Pricina:** Spacing system nebyl tokenizovan pri puvodni tvorbe design systemu.
- **Oprava:** Zvazit pridani spacing scale tokenu (napr. `--forge-space-1: 4px` az `--forge-space-8: 32px`) do `forge-tokens.css` a postupnou migraci komponent.
- **Pouceni:** Spacing tokeny zajistuji vizualni konzistenci a usnadnuji globalni zmeny spacing. Jejich absence znamena ze kazda komponenta definuje vlastni spacing nezavisle.

### [2026-02-13] [TOKEN] ForgePriceBreakdown — hardcoded anglicky text "COST ANALYSIS"
- **Kde:** `src/components/ui/forge/ForgePriceBreakdown.jsx:128`
- **Symptom:** Header text "COST ANALYSIS" je hardcoded anglicky bez moznosti prekladu.
- **Pricina:** Komponenta nema pristup k i18n a neprijima headerLabel prop.
- **Oprava:** Pridat prop `headerLabel` s default `'COST ANALYSIS'` aby volajici kod mohl predat prelozeny text.
- **Pouceni:** Sdilene UI komponenty by mely byt jazykove agnosticke — text by mel prichazet jako prop.

### [2026-02-13] [CODE] pricingService.js — hardcoded POST_PROCESSING_PRICES mimo tenant storage
- **Kde:** `src/lib/pricingService.js:24-29`
- **Symptom:** Post-processing ceny (sanding=50, painting=100, assembly=150, drilling=80) jsou hardcoded konstanty v kodu. Admin nemuze upravit ceny post-processingu pres UI — zmena vyzaduje deploy.
- **Pricina:** Demo implementace s pevnymi hodnotami, nikdy migrovano do tenant storage.
- **Oprava:** Precist post-processing ceny z PricingConfigV3 nebo z dedicatedniho fees storage helperu. Hardcoded hodnoty ponechat jako fallback.
- **Pouceni:** Cenove udaje patri do konfigurace, ne do kodu. Invariant #4 z CLAUDE.md: "Jeden zdroj pravdy — pricing/fees cti pres tenant storage helpery."

### [2026-02-13] [TOKEN] pricingService.js — breakdown labels hardcoded v cestine bez i18n
- **Kde:** `src/lib/pricingService.js:203-214`
- **Symptom:** Breakdown labels ("Material", "Cas tisku", "Dodatecne sluzby", "Expres", "Prirazhka", "Minimum za model", "Minimum objednavky", "Zaokrouhleni") jsou hardcoded ceske retezce. Anglicky uzivatel vidi ceske labely v rozpisu ceny.
- **Pricina:** Service vrstva nema pristup k i18n systemu (useLanguage je React hook, ne pouzitelny v utility modulu).
- **Oprava:** (1) Nahradit labels za jazykove-agnosticke klice (napr. `'breakdown.material'`) a preklad delat v UI vrstve, nebo (2) prijimat `language` parametr a pouzivat lookup tabulku.
- **Pouceni:** Utility moduly mimo React strom by nemely obsahovat user-facing texty — maji vracet klice ktere UI prelozi.

### [2026-02-13] [CODE] pricingService.js — formatPrice hardcoded na Kc
- **Kde:** `src/lib/pricingService.js:224-226`
- **Symptom:** `formatPrice()` vzdy vraci " Kc" suffix bez ohledu na menu uzivatele. Neni pripraveno pro mezinarodni pouziti.
- **Pricina:** MVP implementace pro cesky trh.
- **Oprava:** Prijimat mena/locale parametr nebo delegovat formatovani na UI vrstvu s `Intl.NumberFormat`.
- **Pouceni:** Formatovaci utility by mely byt locale-aware nebo mena-agnosticke.

### [2026-02-13] [CODE] slicingApiClient.js — modul neni pouzivan (orphaned code)
- **Kde:** `src/lib/slicingApiClient.js` (cely soubor, 109 radku)
- **Symptom:** Zadna komponenta v projektu neimportuje `sliceModel` z tohoto souboru. Vsechny kalkulacky (test-kalkulacka, test-kalkulacka-white, widget-kalkulacka) pouzivaji `sliceModelLocal` z `src/services/slicerApi.js`.
- **Pricina:** Modul byl pravdepodobne nahrazen `slicerApi.js` ale nebyl odstranen.
- **Oprava:** (1) Odstranit soubor pokud je plne nahrazen, nebo (2) zdokumentovat proc existuje a kdy se pouzije (napr. budouci cloud slicing endpoint).
- **Pouceni:** Orphaned moduly ztezuji orientaci v kodebazi. Pri nahrazeni modulu novym vzdy smazat nebo jasne oznacit stary.

### [2026-02-13] [CODE] slicingApiClient.js — API_BASE_URL je hardcoded LAN adresa
- **Kde:** `src/config/api.js:2` (pouziva `src/lib/slicingApiClient.js:3`)
- **Symptom:** `API_BASE_URL = 'http://192.168.1.213:3001'` je LAN IP adresa. Nefunguje mimo lokalni sit, neni konfigurovatelna pres environment promenne.
- **Pricina:** Konfigurace pro lokalni vyvoj bez .env podpory.
- **Oprava:** Pouzit Vite env promenne: `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'`.
- **Pouceni:** Sitove adresy nemaji byt hardcoded — pouzivat env promenne s rozumnym fallbackem.

### [2026-02-13] [CODE] cn.js — tailwind-merge v projektu bez Tailwindu
- **Kde:** `src/utils/cn.js:2`
- **Symptom:** Projekt pouziva custom CSS (ne Tailwind), ale `cn()` pouziva `twMerge` z `tailwind-merge`. Knihovna `tailwind-merge` pridava ~12kB do bundle a ma smysl pouze pro resolving Tailwind utility class konfliktu.
- **Pricina:** Modul byl prevzat ze shadcn/ui boilerplate ktery predpoklada Tailwind.
- **Oprava:** Pokud se Tailwind utility tridy nepouzivaji, nahradit `twMerge(clsx(inputs))` za `clsx(inputs)` a odinstalovat `tailwind-merge`.
- **Pouceni:** Pri prevzeti kodu z boilerplate overit ze zavislosti odpovidaji skutecne pouzivane technologii.

### [2026-02-13] [CODE] cn.js — 4 ruzne import cesty pro stejnou funkci
- **Kde:** `src/utils/cn.js` importovano pres: `@/lib/utils`, `../../utils/cn`, `@/utils/cn`, `utils/cn`
- **Symptom:** 22+ komponent importuje `cn` pres 4 ruzne cesty. Ztezuje refactoring, grep a automaticke nastroje.
- **Pricina:** Ruznorode importy vznikly nezavisle — nektere kopirujici shadcn konvenci (`@/lib/utils`), jine pouzivajici relativni cesty, jine alias.
- **Oprava:** Kanonizovat na jednu cestu (napr. `@/utils/cn`) a aktualizovat vsechny importy. Odstranit `src/lib/utils.js` re-export pokud se sjednocuje.
- **Pouceni:** Pro sdilene utility definovat jednu kanonickou import cestu a vynucovat ji pres ESLint `no-restricted-imports`.

### [2026-02-13] [CODE] ini.js — modul neni pouzivan (orphaned code)
- **Kde:** `src/utils/ini.js` (cely soubor, 42 radku)
- **Symptom:** Zadna komponenta v projektu neimportuje `parseIniToKeyValue` ani `coerceIniValue`. Modul je dead code.
- **Pricina:** Pripraven pro budouci PrusaSlicer preset import feature ktera jeste nebyla implementovana.
- **Oprava:** Ponechat pokud je preset import planovany — ale pridat komentar s odkazem na plan/issue. Pokud neni planovany, odstranit.
- **Pouceni:** Orphaned utility moduly by meli mit komentar proc existuji a kdy budou pouzity, jinak hrozi ze budou smazany pri cleanup.

### [2026-02-13] [TOKEN] presetsApi.js — duplicitni getTenantId implementace
- **Kde:** `src/services/presetsApi.js:11-18`
- **Symptom:** `presetsApi.js` ma vlastni kopii funkce `getTenantId()` misto importu ze sdileneho `src/utils/adminTenantStorage.js`. Ostatni dva service moduly (`slicerApi.js`, `storageApi.js`) importuji sdilenou verzi.
- **Pricina:** Komentar `// Keep consistent with /src/utils/adminTenantStorage.js` naznacuje vedomou duplicitu, ale duvod neni jasny — mozna snaha o nulovy externi import.
- **Oprava:** Nahradit vlastni `getTenantId()` za `import { getTenantId } from '../utils/adminTenantStorage'` pro konzistenci se zbytkem codebase.
- **Pouceni:** Duplicitni logika = riziko desynchronizace. Pokud se zmeni fallback nebo storage klic v `adminTenantStorage`, presetsApi zustane neaktualizovany.

### [2026-02-13] [TOKEN] Services — nekonzistentni error handling pattern mezi API klienty
- **Kde:** `src/services/presetsApi.js`, `src/services/slicerApi.js`, `src/services/storageApi.js`
- **Symptom:** `presetsApi` pouziva Result pattern (`{ ok: true/false }` — nikdy nevyhodi Error), zatimco `slicerApi` a `storageApi` vyhazuji Error pri selhani. Consumer musi vedet ktery pattern dany service pouziva.
- **Pricina:** Servicy byly psany v ruznych casech ruznymi autory bez sdileneho API convention dokumentu.
- **Oprava:** Zvazit sjednoceni na jeden pattern (idealne Result pattern z presetsApi ktery je bezpecnejsi). Alternativne zdokumentovat konvenci v JSDoc kazde funkce.
- **Pouceni:** Pri pridavani novych service modulu se rozhodnout pro jeden pattern a drzet ho konzistentne. Result pattern je bezpecnejsi protoze consumer nemuze zapomenout na try/catch.

### [2026-02-13] [TOKEN] slicerApi — legacy response format { success: true/false }
- **Kde:** `src/services/slicerApi.js` (cely response flow), `backend-local/src/index.js:232-389`
- **Symptom:** `POST /api/slice` endpoint vraci `{ success: true/false }` misto moderniho `{ ok: true/false, data: ... }` formatu pouzivaneho vsemi ostatnimi endpointy (presets, storage).
- **Pricina:** Slice endpoint je legacy implementace ktera nebyla migrovana na novy response format.
- **Oprava:** Migrovat backend slice handler na `{ ok: true, data: { metrics, modelInfo, ... } }` format a aktualizovat vsechny consumery.
- **Pouceni:** Response format konvence by mela byt zavedena pred implementaci prvniho endpointu. Migrace pozdeji vyzaduje koordinaci s vice consumery.

### [2026-02-13] [WCAG] ForgeFaqAccordion — chybejici ARIA atributy oproti Accordion
- **Kde:** `src/components/ui/forge/ForgeFaqAccordion.jsx:27-60`
- **Symptom:** ForgeFaqAccordion (pouzivany na vsech 3 public strankach) ma jen `aria-expanded`. Chybi `aria-controls`, `role="region"`, `aria-labelledby` a unikatni ID pro panel. Puvodne nahrazeny `marketing/Accordion` vse mel.
- **Pricina:** Forge varianta byla napsana zjednodusene, a11y atributy nebyly preneseny z puvodni komponenty.
- **Oprava:** Pridat `useId()` pro generovani ID, `aria-controls={panelId}` na button, `role="region"` a `aria-labelledby={buttonId}` na odpoved panel.
- **Pouceni:** Pri nahrazovani komponenty za vizualni variantu vzdy overit ze se neprisel o a11y funkcionalitu.

### [2026-02-13] [WCAG] InteractiveWorldMap — tooltip jen na hover, chybi keyboard focus
- **Kde:** `src/components/marketing/InteractiveWorldMap.jsx:78-85`
- **Symptom:** Pin buttony reaguji jen na `onMouseEnter/onMouseLeave`. Pri keyboard navigaci (Tab + Enter) se tooltip nezobrazi. Chybi i viditelny focus ring.
- **Pricina:** Interakce implementovana jen pro mys, chybi `onFocus/onBlur` handlery.
- **Oprava:** Pridat `onFocus={() => setActivePoint(loc.id)}` a `onBlur={() => setActivePoint(null)}` na pin button. Pridat focus-visible ring styl.
- **Pouceni:** Kazdy hover efekt ktery zpristupnuje informaci musi mit keyboard ekvivalent (focus/blur).

### [2026-02-13] [CODE] ForgePrinterSVG — inline keyframes s globalni kolizi
- **Kde:** `src/components/ui/forge/ForgePrinterSVG.jsx:33-56`
- **Symptom:** 8 keyframes (`fp-layer-0` az `fp-layer-7`) jsou generovany v inline `<style>` tagu. Pokud by se na strance vyskytlo vice instanci ForgePrinterSVG, doslo by ke kolizi nazvu.
- **Pricina:** Keyframes nazvy jsou staticke, nepouzivaji `useId()` ani jiny unikatni prefix.
- **Oprava:** Pridat `useId()` a prefixovat nazvy keyframes unikatnim ID (napr. `fp-layer-${uid}-0`). Alternativne zajistit na urovni stranky ze existuje max 1 instance.
- **Pouceni:** Inline `<style>` s globalne viditelnymi nazvy je anti-pattern. Pouzivat CSS Modules, scoped styles, nebo unikatni prefixy.

### [2026-02-13] [TOKEN] SupportHoverCards — inline CS/EN texty misto useLanguage/props
- **Kde:** `src/components/marketing/SupportHoverCards.jsx:44-96`
- **Symptom:** Komponenta obsahuje dve kompletni sady textu (cesky a anglicky) jako lokalni pole. Pri pridani dalsiho jazyka by bylo nutne rozsirit switch uvnitr komponenty.
- **Pricina:** Rychla implementace s language propem misto pouziti `useLanguage()` nebo predani textu pres props.
- **Oprava:** Refaktorovat tak, aby texty prichazely jako prop `cards: [{icon, title, desc, to?, href?}]` a rodic se staral o preklad.
- **Pouceni:** Marketing komponenty by mely byt jazykove agnosticke. Texty predavat jako props, ne resit jazyk uvnitr.

### [2026-02-13] [CODE] ForgeSquiggle — globalni SVG filter ID kolize
- **Kde:** `src/components/ui/forge/ForgeSquiggle.jsx:22`
- **Symptom:** SVG filter `id="squiggle-roughen"` je globalni. Vice instanci ForgeSquiggle na strance sdili stejny filter, coz je aktualne nevinne ale muze vest k neocekavanym vizualnim vysledkum.
- **Pricina:** Filter ID je staticke bez unikatniho prefixu.
- **Oprava:** Pridat `useId()` a pouzit `id={squiggle-roughen-${uid}}` s odpovidajicim `url(#...)` referencemi.
- **Pouceni:** SVG filter a gradient ID jsou globalni v ramci DOM — vzdy pouzivat unikatni identifikatory pro znovupouzitelne komponenty.

### [2026-02-13] [CODE] Marketing — 15 z 16 komponent v marketing/ slozce nepouzivanych na public strankach
- **Kde:** `src/components/marketing/` (vsechny krome Reveal.jsx)
- **Symptom:** Z 16 souboru v marketing/ slozce je na verejnych strankach (home, pricing, support) importovana pouze `Reveal`. Zbytek je bud nahrazen Forge variantami nebo nikdy nebyl integrovany.
- **Pricina:** FORGE redesign nahradil puvodni Tailwind marketing komponenty Forge variantami, ale puvodni soubory nebyly smazany.
- **Oprava:** (1) Identifikovat ktere jsou skutecne dead code vs planovane pro budouci pouziti. (2) Nepouzivane presunout do `_deprecated/` nebo smazat. (3) Zvazit spojeni duplicit (Accordion+ForgeFaqAccordion, PricingPlanCard+ForgePricingCard).
- **Pouceni:** Pri vizualnim redesignu (Tailwind -> Forge) vzdy udelat cleanup starych komponent aby nevznikal mrtvej kod.

### [2026-02-13] [COLOR] Select.jsx -- hardcoded bg-white text-black rozbiji dark theme
- **Kde:** `src/components/ui/Select.jsx:121,176`
- **Symptom:** Select trigger ma `bg-white text-black` a dropdown take `bg-white text-black`. Jedina form komponenta ktera je hardcoded na svetly theme. V dark Forge theme vytvari ostry vizualni nesoulad s Input, Checkbox a dalsimy form elementy.
- **Pricina:** Select nebyl aktualizovan pri Forge redesignu. Ostatni form komponenty (Input, Checkbox) pouzivaji bud Tailwind semantic barvy nebo Forge tokeny.
- **Oprava:** Nahradit `bg-white text-black` za `bg-background text-foreground` (Tailwind semantic) nebo inline Forge tokeny (`--forge-bg-elevated`, `--forge-text-primary`) aby odpovidal Input.jsx patternu.
- **Pouceni:** Pri redesignu overit VSECHNY form komponenty, ne jen nejpouzivanejsi. Select je taky form element.

### [2026-02-13] [COLOR] LoadingState/ErrorState -- hardcoded Tailwind barvy misto semantic tokenu
- **Kde:** `src/components/ui/LoadingState.jsx`, `src/components/ui/ErrorState.jsx`
- **Symptom:** LoadingState pouziva `bg-gray-200`, `bg-blue-500`, `border-blue-600`. ErrorState pouziva `bg-red-50`, `text-red-600`, `bg-blue-600`. Tyto barvy jsou hardcoded a neodpovidaji Forge theme ani Tailwind semantic barvam.
- **Pricina:** Obe komponenty byly pridany v Phase 4 (Supabase hooks) bez integrace do Forge design systemu.
- **Oprava:** Nahradit hardcoded barvy za Forge semantic tokeny: `--forge-info` (loading), `--forge-error` (error), `--forge-success` (retry button). Alternativne pouzit Tailwind semantic barvy (`bg-destructive`, `text-destructive`).
- **Pouceni:** Nove utility komponenty musi respektovat existujici design system od zacatku, ne az pri budoucim auditu.

### [2026-02-13] [INLINE-STYLE] Base UI -- tri ruzne styling pristupy bez strategie
- **Kde:** `src/components/ui/` (vsechny soubory)
- **Symptom:** Header/Footer pouzivaji inline Forge tokeny, Input pouziva mix Tailwind + Forge inline, zbytek pouziva Tailwind utility/semantic tridy. Neni definovana strategie kdy pouzit ktery pristup.
- **Pricina:** Komponenty vznikaly v ruznych fazich: puvodni (Tailwind), Phase 4 (hardcoded), Forge redesign (inline tokeny).
- **Oprava:** Definovat jasnou strategii: (a) Forge tokeny pres inline style pro barvy, fonty, shadows NEBO (b) Tailwind semantic tridy mapovane na CSS custom properties. Postupne migrovat vsechny base komponenty na jeden pristup.
- **Pouceni:** Design system musi mit jednu strategii pro styling. Smiseny pristup vede k nekonzistenci a stezuje udrzbu.

### [2026-02-13] [TOKEN] label.jsx -- import z neexistujiciho @/lib/utils
- **Kde:** `src/components/ui/label.jsx:5`
- **Symptom:** Import `import { cn } from "@/lib/utils"` se lisi od vsech ostatnich komponent ktere importuji z `../../utils/cn` nebo `@/utils/cn`. Path `src/lib/utils` nemusi existovat.
- **Pricina:** Komponenta byla pravdepodobne zkopirana ze shadcn/ui generatoru ktery predpoklada jiny path alias.
- **Oprava:** Zmenit import na `import { cn } from "../../utils/cn"` pro konzistenci se zbytkem base komponent.
- **Pouceni:** Pri kopirovani shadcn/ui komponent overit ze import paths odpovidaji projektove strukture.

### [2026-02-13] [WCAG] Select.jsx -- chybejici ARIA role a keyboard navigace
- **Kde:** `src/components/ui/Select.jsx:175-220`
- **Symptom:** Dropdown kontejner nema `role="listbox"`, polozky nemaji `role="option"`. Chybi keyboard navigace (sipky, Home/End, type-ahead). Uzivatel bez mysi nemuze efektivne vybrat polozku.
- **Pricina:** Select byl implementovan jako custom dropdown bez pouziti Radix Select primitivu. ARIA role a keyboard handling nebyly doplneny.
- **Oprava:** (a) Prepsat na `@radix-ui/react-select` pro plnou WCAG compliance, nebo (b) manualne pridat `role="listbox"`, `role="option"`, `onKeyDown` handler pro sipky/Enter/Escape.
- **Pouceni:** Custom select/dropdown je jeden z nejnarocnejsich prvku na pristupnost. Pokud je to mozne, pouzit Radix/HeadlessUI primitiva.

### [2026-02-13] [WCAG] LoadingState -- chybejici aria-live pro screen readery
- **Kde:** `src/components/ui/LoadingState.jsx` (cela komponenta)
- **Symptom:** Loading indikatory nemaji `role="status"` ani `aria-live="polite"`. Screen reader neoznami uzivateli ze se neco nacita.
- **Pricina:** Pristupnost nebyla zohlednena pri implementaci v Phase 4.
- **Oprava:** Pridat `role="status"` a `aria-live="polite"` na wrapper element. Pro skeleton variantu zvazit `aria-busy="true"` na parent kontejner.
- **Pouceni:** Loading stavy jsou kriticke pro screen reader uzivatele. Bez `aria-live` uzivatel nevi ze se neco deje.

