# Error Log — ModelPricer / Pricer V3

> Dokumentace chyb, erroru, pasti a oprav. Kazdy zaznam obsahuje co se stalo,
> proc, jak se to opravilo a co si z toho vzit do budoucna.

---

## Format zaznamu

```
### [DATUM] [KATEGORIE] Kratky popis
- **Kde:** soubor:radek
- **Symptom:** Co se deje spatne
- **Pricina:** Proc se to deje
- **Oprava:** Co jsem udelal
- **Pouceni:** Co si z toho vzit
```

**Kategorie:** `[BUG]` `[REGRESSION]` `[CSS]` `[STATE]` `[ERROR-HANDLING]` `[PERFORMANCE]` `[BUILD]` `[CONFIG]`

---

## Zaznamy

### [2026-02-07] [CSS] Rozlozeni ceny preteka mimo kontejner — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/components/PricingCalculator.jsx:188-215`
- **Symptom:** Cenovy breakdown (Material, Cas tisku, Sluzby...) je polovicne mimo okno karty
- **Pricina:** Flex layout `flex items-start justify-between gap-4` s `min-w-[200px]` na pravem sloupci. V uzke karte (pravy sloupec 3-col gridu) nebylo dost mista a obsah pretekal.
- **Oprava:** Zmeneno na vertikalni layout `flex flex-col gap-3`. Odstranen `min-w-[200px]`. Celkem nahore, breakdown dole — vejde se do libovolne sirky karty.
- **Pouceni:** V pravem panelu (lg:col-span-1) nepouzivat `min-w` na deti — sirka je omezena. Preferovat vertikalni stacking.

### [2026-02-07] [STATE] Data modelu se resetuji pri prepnuti mezi modely — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/index.jsx:163-170` (`handleConfigChange`)
- **Symptom:** Po "Spocitat vse" se data slicnou, ale pri prepnuti na druhy model se resetuji a musi se znovu individualne pocitat.
- **Pricina:** `PrintConfiguration` ma `key={selectedFile.id}` prop → pri prepnuti modelu se REMOUNTUJE. Uvnitr PrintConfiguration bezi useEffect (radek 106-140) ktery validuje material/color. Pokud je `config.color` null, nastavi `changed = true` a vola `onConfigChange(next)`. Parent `handleConfigChange` VZDY resetoval `status: 'pending', result: null, error: null` — i kdyz se config ve skutecnosti nezmenil.
- **Oprava:** V `handleConfigChange` pridam porovnani novych a starych meaningful keys (material, quality, infill, supports). Reset slice results se provede JEN kdyz se tyto klice skutecne zmenily. Zmena barvy nebo quantity neresetuje slice.
- **Pouceni:** Kdyz pouzivam `key` prop pro remount, musim pocitat s tim ze vsechny useEffecty v child komponente se znovu spusti. `onConfigChange` by mel porovnavat pred resetem. **Vzor: config change handler = compare-before-reset.**

### [2026-02-07] [ERROR-HANDLING] Chybejici error handling pro neplatne 3D modely — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/index.jsx` (handleSliceSelected, runBatchSlice)
- **Symptom:** AI-generovane modely a modely s chybami (malo sten, non-manifold, spatna orientace) padaji s technickou hlaskou typu "Backend error (500): PrusaSlicer returned non-zero exit code."
- **Pricina:** Frontend jen propagoval raw error string bez parsovani. Backend vraci `stderr` z PrusaSliceru, ktery obsahuje uzitecne info ale neni user-friendly.
- **Oprava:** Vytvoreno `src/utils/slicerErrorClassifier.js` s 12 error pattern kategorii (MESH_NON_MANIFOLD, MESH_ZERO_VOLUME, MESH_TOO_SMALL, MESH_TOO_LARGE, MESH_SELF_INTERSECTING, MESH_INVERTED_NORMALS, FILE_CORRUPT, FILE_UNSUPPORTED, CONFIG_MISSING, SLICER_NOT_FOUND, TIMEOUT, NETWORK_ERROR). Kazda kategorie ma severity (error/warning) a user-friendly CZ+EN hlasku. Integrovano do handleSliceSelected a runBatchSlice. Error se uklada s `errorCategory`, `errorSeverity`, `errorRaw` fieldy.
- **Pouceni:** Vzdy parsovat backend error zpravy na FE a mapovat na user-friendly hlasky. Raw error zachovat pro debugging.

### [2026-02-07] [UX] Cena se nezobrazuje prubezne per-model — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/components/PricingCalculator.jsx:84-101`
- **Symptom:** Cena se zobrazi az po spocteni VSECH modelu, ne prubezne per-model.
- **Pricina:** Radek 87: `if (incompleteModels.length > 0) return { quote: null, error: null }` — blokoval celou kalkulaci dokud nebyly vsechny modely hotove.
- **Oprava:** Zmeneno na pocitani ceny z `readyModels` (pouze completed). Pokud existuji incomplete modely, zobrazi se "Prubezna cena (X z Y)" s sedy text a info o zbyvajicich modelech. Quote state ma novy `isPartial` flag.
- **Pouceni:** Pro multi-model scenare vzdy ukazovat prubezny stav, ne cekat na vsechno. Zakaznik potrebuje vidiet cenu IHNED.

### [2026-02-07] [UX] Tlacitka pro vypocet na spatnem miste a spatny styl — OPRAVENO
- **Kde:** `src/pages/test-kalkulacka/index.jsx:586-624` (puvodni umisteni)
- **Symptom:** Tlacitka "Spocitat cenu / Spocitat vse / Reslice failed" byla velka, na boku stranky (v pravem sloupci nad 3D viewerem), mimo stepper.
- **Pricina:** Design rozhodnuti z drive — tyhle CTA tlacitka nemely stepper-level umisteni.
- **Oprava:** Presunuto do stepper radku (vedle progress baru Nahrani souboru -> Konfigurace -> Kontrola a cena). Zmenseno na `size="compact"` (~35% mensi). Pridan progress bar pro batch slicing (vizualni bar s X/Y countem). U modelu v seznamu pridan per-model progress indikator (pulzujici bar + "Vypocitavam..." text) a cas v minutach pro hotove modely.
- **Pouceni:** CTA tlacitka patri vizualne k workflow stepperu, ne oddelene na strane. Kompaktnejsi tlacitka = cistejsi UI.
# Error Log — FORGE Redesign (2026-02-09)

## Issues Found & Fixed

### 1. Garbled text on Home page feature cards
- **Location:** `src/pages/home/index.jsx` lines 244, 260, 275
- **Problem:** Feature card descriptions contained nonsensical AI-generated text:
  - Card 01: "Volume-based calculations to aviation 3D-printing and volume its own hanovation..."
  - Card 02: "Printing require models to upload models invvasanute eatoms in 3D-printing carriers."
  - Card 03: "Spool 3D-printing themed SVG filament enquires 3D-printing filament."
- **Fix:** Replaced with proper CZ/EN translated text via LanguageContext keys `home.forge.feature1/2/3`

### 2. Placeholder pricing plan features
- **Location:** `src/pages/home/index.jsx` lines 27-62
- **Problem:** All plan features showed "IBM Plex Sans 14px" (font spec used as placeholder)
- **Fix:** Replaced with real features via translation keys (1 widget, 100 calcs/mo, etc.)

### 3. Footer links were plain text, not navigable
- **Location:** `src/pages/home/index.jsx` lines 470-483
- **Problem:** Footer items ['UPPERCASE', 'PRICING', 'SUPPORT'] were `<span>` elements with no routing
- **Fix:** Changed to `<Link>` components with proper routes (/, /pricing, /support)

### 4. Design system inconsistency (3 themes across 3 pages)
- **Problem:**
  - Home: Forge dark theme (correct)
  - Pricing: shadcn/ui light theme (Container, Button, TooltipProvider, PricingPlanCard, etc.)
  - Support: Custom purple gradient with inline `<style>` CSS
- **Fix:** Rewrote both Pricing and Support pages to use Forge dark theme with shared components

### 5. Support page used inline CSS block
- **Location:** `src/pages/support/index.jsx` lines 239-442
- **Problem:** ~200 lines of `<style>{...}</style>` inline CSS with purple gradient (#667eea, #764ba2)
- **Fix:** Removed all inline CSS, using Forge CSS variables and Tailwind classes

## Build Status
- `npm run build` — PASS (0 errors)
- Chunk size warning (pre-existing) — index-*.js > 4MB


---

## Caste chyby (vzory)

### Windows cesty s diakritikou
- **Popis:** Cesty s `Kuňákovi` mohou zpusobit problemy v nekterych nastrojich
- **Reseni:** Pouzivat forward slashes, escapovat spravne

### Background agenti a acceptEdits mod
- **Popis:** Background Task agenti nemohou psat soubory v acceptEdits modu
- **Reseni:** Psat primo pomoci Write/Edit toolu, ne delegovat na background agenty

### React key prop zpusobuje reset stavu child komponent
- **Popis:** Pouziti `key={dynamicId}` na komponente zpusobi plny remount pri zmene klice. Vsechny useEffecty v child se znovu spusti a mohou triggerovat callbacks (napr. onConfigChange) ktere neocekavane resetuji parent state.
- **Reseni:** V parent callback handlerech porovnavat stary a novy stav pred destruktivni akci (napr. reset slice results).

### min-w v responsivnich grid kontejnerech
- **Popis:** `min-w-[Xpx]` na child elementu v uzkem grid sloupci (lg:col-span-1) zpusobi overflow.
- **Reseni:** Nepouzivat `min-w` v pravem panelu. Pouzit vertikalni stacking nebo `w-full`.

---

## Statistiky

| Kategorie | Pocet | Opraveno |
|-----------|-------|----------|
| CSS | 1 | 1 |
| STATE | 1 | 1 |
| ERROR-HANDLING | 1 | 1 |
| UX | 2 | 2 |
| BUILD | 0 | 0 |
| REGRESSION | 0 | 0 |

### [2026-02-13] [BUG] Mrtvy import Icon v NotFound.jsx — NERESENO
- **Kde:** `src/pages/NotFound.jsx:4`
- **Symptom:** `import Icon from '@/components/AppIcon'` je importovan ale nikde v komponente se nepouziva. Zadny `<Icon />` element v JSX.
- **Pricina:** Pravdepodobne zbytek z drive — ikona byla zamyslena ale nakonec se nepouzila.
- **Oprava:** Odstranit radek 4 (`import Icon from '@/components/AppIcon'`).
- **Pouceni:** Pri code review kontrolovat nepouzivane importy. ESLint pravidlo `no-unused-vars` / `no-unused-imports` by toto zachytilo.

### [2026-02-13] [BUG] NotFound.jsx nema i18n — vsechny texty hardcoded anglicky — NERESENO
- **Kde:** `src/pages/NotFound.jsx:53-63`
- **Symptom:** 404 stranka zobrazuje anglicke texty ("Page Not Found", "Back to Home", "Go Back") i kdyz uzivatel ma nastavenu cestinu. Vsechny ostatni verejne stranky pouzivaji LanguageContext.
- **Pricina:** Komponenta neimportuje `useLanguage` a prekladovy slovnik neobsahuje klice pro 404 stranku.
- **Oprava:** Pridat preklady do LanguageContext.jsx (`notFound.title`, `notFound.description`, `notFound.backHome`, `notFound.goBack`) a integrovat `useLanguage` hook do NotFound.jsx.
- **Pouceni:** Kazda nova stranka musi pouzivat LanguageContext — kontrolovat v review.

### [2026-02-13] [BUG] Account stranka — PrivateRoute vypnuta, stranka pristupna bez prihlaseni — NERESENO
- **Kde:** `src/Routes.jsx:86-88`
- **Symptom:** Account stranka je pristupna na `/account` bez autentizace. PrivateRoute wrapper je zakomentovany.
- **Pricina:** Docasne vypnuto pro vyvoj (komentar v kodu: "DOCASNE VYPNUTO PRO VYVOJ").
- **Oprava:** Odkomentovat `<Route element={<PrivateRoute />}>` wrapper pred produkci.
- **Pouceni:** Chranene routy musi byt vzdy za PrivateRoute. Pouzivat feature flags misto komentovani kodu.

### [2026-02-13] [STATE] Account stranka — console.log s profilovymi daty — NERESENO
- **Kde:** `src/pages/account/index.jsx:201`
- **Symptom:** `handleSaveProfile` loguje cely `profileData` objekt (jmeno, email, telefon, adresa, ICO, DIC) do browser console.
- **Pricina:** Debug log ponechany v kodu.
- **Oprava:** Odstranit `console.log('Saving profile:', profileData)` a nahradit skutecnou implementaci ukladani.
- **Pouceni:** Nelogovat PII (Personally Identifiable Information) do console. Pouzivat conditional logging jen v dev modu.

### [2026-02-13] [BUG] Account stranka — zadna formularova validace — NERESENO
- **Kde:** `src/pages/account/index.jsx:200-213`
- **Symptom:** Zadna validace pri ulozeni profilu nebo zmene hesla. Email muze byt "abc", ICO muze byt prazdne, PSC muze obsahovat pismena.
- **Pricina:** Stranka pouziva mock data bez planu na validaci. Chybi react-hook-form nebo zod schema.
- **Oprava:** Pridat validacni schema (zod) + react-hook-form jako na CheckoutForm. Validovat email regex, telefon format, ICO (8 cislic), DIC (CZ + 8-10 cislic), PSC (5 cislic).
- **Pouceni:** Formularove stranky vzdy implementovat s validaci od zacatku — doimplementace je pracnejsi nez prvotni implementace.

### [2026-02-13] [BUG] Account stranka — AccountOverviewCard existuje ale neni integrovana — NERESENO
- **Kde:** `src/pages/account/components/AccountOverviewCard.jsx`
- **Symptom:** Komponenta s Firebase Auth integraci (avatar, email verifikace, session revoke) existuje ale neni importovana v index.jsx.
- **Pricina:** Pravdepodobne vytvorena pro budouci integraci, ale nebyla zapojena.
- **Oprava:** Importovat a pouzit v Account strance jako prehledovou kartu nad tab navigaci.
- **Pouceni:** Sledovat nepouzite komponenty — mohou signalizovat nedokoncenou implementaci.

### [2026-02-13] [BUG] Account stranka — 2FA button nema handler — NERESENO
- **Kde:** `src/pages/account/index.jsx:724`
- **Symptom:** Tlacitko "Zapnout 2FA" / "Enable 2FA" nema onClick handler. Kliknuti nedela nic.
- **Pricina:** Placeholder UI bez implementace.
- **Oprava:** Implementovat 2FA setup flow (QR kod, TOTP overeni) nebo tlacitko oznacit jako "Pripravujeme" / disabled.
- **Pouceni:** Funkcni-vypadajici UI bez implementace je horsi nez jeho absence — uzivatel ocekava ze tlacitko neco udela.

### [2026-02-13] [PERFORMANCE] Account stranka — FormInput a Card definovane uvnitr komponenty — NERESENO
- **Kde:** `src/pages/account/index.jsx:301-358`
- **Symptom:** `FormInput` a `Card` komponenty jsou definovane uvnitr `AccountPage` funkce. Pri kazdem renderu se vytvari nova reference, coz znemoznuje React memoizaci a zpusobuje zbytecne re-rendery deti.
- **Pricina:** Rychly prototyp — komponenty byly definovany inline pro pohodli.
- **Oprava:** Extrahovat `FormInput` a `Card` mimo `AccountPage` (nad komponentu nebo do separatnich souboru).
- **Pouceni:** Nikdy nedefinovat komponenty uvnitr jine komponenty pokud nepotrebuji pristup k closure — pouzit props misto closure.

### [2026-02-13] [BUG] Unused import ForgeButton v Support strance — NERESENO
- **Kde:** `src/pages/support/index.jsx:5`
- **Symptom:** `import ForgeButton from '../../components/ui/forge/ForgeButton'` je importovan ale nikde v JSX neni pouzit. Zadny `<ForgeButton />` element v renderovane casti komponenty.
- **Pricina:** Pravdepodobne zbytek z redesignu (FORGE redesign 2026-02-10) — tlacitko bylo zamysleno ale nakonec se nepouzilo.
- **Oprava:** Odstranit radek 5 (`import ForgeButton from '../../components/ui/forge/ForgeButton'`).
- **Pouceni:** Pri redesignu stranek kontrolovat ze vsechny importy jsou skutecne pouzity. ESLint pravidlo `no-unused-vars` by toto zachytilo.

### [2026-02-13] [BUG] Quick link karty na Support strance nejsou klikatelne — NERESENO
- **Kde:** `src/pages/support/index.jsx:207-229`
- **Symptom:** Quick link karty (Dokumentace, Video navody, Live Chat, Email podpora) maji vizualni hover efekt (elevace, glow, cursor:pointer pres `forge-card-interactive`) ale nejsou obaleny v `<a>`, `<Link>` ani `<button>`. Kliknuti na kartu nedela nic.
- **Pricina:** Karty byly navrhnute jako vizualni odkazy ale chybi implementace interakce. Karta je pouze `<div>` s CSS hover efektem.
- **Oprava:** Obalit kazdu kartu v `<Link to="...">` nebo `<a href="...">` s prislusnou destinaci. Pripadne pro email pouzit `mailto:support@modelpricer.com`, pro chat implementovat otevreni chat widgetu.
- **Pouceni:** `cursor: pointer` a hover efekty implikuji interaktivnost — vzdy musi byt sparovany se skutecnou akci (onClick, href, to).

### [2026-02-13] [BUG] Nekonzistentni i18n na Support strance — 3 texty pouzivaji inline ternary — NERESENO
- **Kde:** `src/pages/support/index.jsx:243, 248, 345`
- **Symptom:** Tri texty pouzivaji `language === 'cs' ? ... : ...` inline misto `t()` funkce: nadpis FAQ sekce ("Casto kladene otazky"), zprava o zadnych vysledcich, a provozni hodiny Live Chatu.
- **Pricina:** Nekonzistentni pristup — cast textu pouziva `t()`, cast inline ternary. Pravdepodobne nedotazeny redesign.
- **Oprava:** Pridat klice do LanguageContext (`support.faq.title`, `support.search.noResults`, `support.contact.chatHours`) a nahradit inline ternary za `t()` volani.
- **Pouceni:** Na jedne strance pouzivat konzistentne jednu metodu prekladu. `t()` je preferovana metoda.

### [2026-02-13] [BUG] Pricing stranka — dead import ForgeSquiggle — NERESENO
- **Kde:** `src/pages/pricing/index.jsx:4`
- **Symptom:** `import ForgeSquiggle from '../../components/ui/forge/ForgeSquiggle'` je importovana ale nikde v JSX se nepouziva.
- **Pricina:** Zbytek z drive — squiggle byl zamyslen jako dekorace ale nebyl zapojen.
- **Oprava:** Odstranit neuzivany import na radku 4.
- **Pouceni:** ESLint `no-unused-imports` by toto zachytil automaticky.

### [2026-02-13] [BUG] Pricing stranka — vetsina textu mimo prekladovy system — NERESENO
- **Kde:** `src/pages/pricing/index.jsx:29-342` (mnoho mist)
- **Symptom:** Jen 7 textu pouziva `t()` z LanguageContext. Zbytek (KPI, features, nadpisy sekci, CTA texty, popisy) pouziva ternary `language === 'cs' ? '...' : '...'`.
- **Pricina:** Pricing stranka byla prepisana pri Forge redesignu a nove texty byly pridany primo misto integrace do prekladoveho systemu.
- **Oprava:** Presunout vsechny texty do LanguageContext.jsx pod klice `pricing.*` a pouzivat `t()`.
- **Pouceni:** I pri rychlem redesignu dodrzovat jednotny pristup k i18n. Ternary inline preklady jsou techicky dluh.

### [2026-02-13] [BUG] Home stranka — ~30 nepouzivanych prekladovych klicu v LanguageContext — NERESENO
- **Kde:** `src/contexts/LanguageContext.jsx:61-105` (CS), `604-648` (EN)
- **Symptom:** Klice `home.hero.note`, `home.trust.*`, `home.how.*`, `home.features.*`, `home.demo.*`, `home.pricing.*`, `home.audience.*`, `home.forge.plans.pro.cta`, `home.forge.plans.enterprise.cta` jsou definovane v prekladovem slovniku ale nejsou pouzivane v aktualnim Home indexu.
- **Pricina:** Pozustatky starsich verzi Home stranky pred Forge redesignem. Klice nebyly odebrane pri refactoru.
- **Oprava:** Provest audit vsech `home.*` klicu — smazat ty, ktere se nikde nepouzivaji (hledat pres grep v celkem projektu, vcetne pricing a support stranek).
- **Pouceni:** Pri redesignu stranky vzdy uklidit stare prekladove klice. Dead keys zvysuji velikost prekladoveho slovniku a zmatek.

### [2026-02-13] [BUG] Home stranka — hardcoded texty v trust strip a pricing plans bez t() — NERESENO
- **Kde:** `src/pages/home/index.jsx:175` (trust label), `46-75` (plan prices, CTA texts)
- **Symptom:** Trust strip label "Pouziva 120+ tiskovych farem" a pricing plan ceny/CTA texty pouzivaji `language === 'cs' ? ... : ...` inline ternary misto `t()` funkce.
- **Pricina:** Tyto texty byly pridany pri Forge redesignu primo do komponenty bez integrace do prekladoveho systemu.
- **Oprava:** Pridat prekladove klice (`home.trust.count`, `home.forge.plans.starter.price`, `home.forge.plans.starter.cta`, atd.) a nahradit inline ternary za `t()`.
- **Pouceni:** Konzistentne pouzivat `t()` pro vsechny user-facing texty. Inline ternary je OK jen pro technicke nazvy ktere se neprekladaji.

### [2026-02-13] [BUG] Login index.jsx predava handleLogin prop ktery LoginForm ignoruje — NERESENO
- **Kde:** `src/pages/login/index.jsx:19-29` a `src/pages/login/components/LoginForm.jsx:52`
- **Symptom:** `index.jsx` definuje `handleLogin` async funkci a predava ji jako prop `<LoginForm handleLogin={handleLogin} />`. LoginForm je ale definovan jako `const LoginForm = ()` — props neakceptuje. LoginForm ma vlastni kompletni auth logiku.
- **Pricina:** Pravdepodobne refactoring — puvodne LoginForm pouzival prop, pak byl prepsany na autonomni komponentu s react-hook-form + Zod + vlastnim Firebase volanim, ale parent nebyl aktualizovan.
- **Oprava:** Bud odstranit handleLogin z index.jsx a nechat LoginForm autonomni, nebo refaktorovat LoginForm aby prijimal handleLogin prop a index.jsx aby ridil redirect logiku (vcetne location.state?.from support).
- **Pouceni:** Pri refactoru child komponenty z prop-driven na autonomni vzdy aktualizovat parent. Duplicitni Firebase importy (signInWithEmailAndPassword) ve dvou souborech signalizuji nekonzistenci.

### [2026-02-13] [BUG] Redirect logika po prihlaseni ignoruje puvodni stranku — NERESENO
- **Kde:** `src/pages/login/index.jsx:12` vs `src/pages/login/components/LoginForm.jsx:79-83`
- **Symptom:** Uzivatel presmerovany na `/login` z chranene routy se po prihlaseni nedostane zpet na puvodni stranku. Vzdy jde na `/customer-dashboard` nebo `/host-dashboard`.
- **Pricina:** `index.jsx` ma logiku `location.state?.from?.pathname` ale ta je mrtvy kod. LoginForm.jsx pouziva vlastni redirect logiku zalozenu jen na Firestore roli.
- **Oprava:** Predat `from` cestu do LoginForm jako prop a pouzit ji po uspesnem prihlaseni, nebo presunout celou redirect logiku do index.jsx.
- **Pouceni:** Redirect-after-login je dulezity UX pattern. Pokud existuje PrivateRoute ktery smeruje na /login, musi login page respektovat puvodni cestu.

### [2026-02-13] [STATE] rememberMe checkbox nema zadny efekt — NERESENO
- **Kde:** `src/pages/login/components/LoginForm.jsx:154-164`
- **Symptom:** Checkbox "Zapamatovat si me" se renderuje a uklada do form data, ale nikde se nepouziva.
- **Pricina:** Firebase Auth persistence je globalne nastavena na `browserLocalPersistence` v `firebase.js:42` — session vzdy prezije bez ohledu na checkbox.
- **Oprava:** Bud odstranit checkbox (zavadejici UI), nebo implementovat logiku: `rememberMe=true` -> `browserLocalPersistence`, `rememberMe=false` -> `browserSessionPersistence`.
- **Pouceni:** Nerendrovat UI prvky ktere nemaji zadny efekt — mate uzivatele a snizuje duveru.

### [2026-02-13] [BUG] Register stranka — dva nezavisle jazykove systemy — NERESENO
- **Kde:** `src/pages/register/index.jsx:10,19-22` a `src/pages/register/components/RegistrationForm.jsx:11,97`
- **Symptom:** Prepnuti jazyka pres LanguageToggle v hlavicce register stranky neovlivni preklady ve formulari. Formular zustava v cestine bez ohledu na vybranou hodnotu toggle.
- **Pricina:** `index.jsx` pouziva vlastni `currentLanguage` state s `localStorage('language')`, zatimco `RegistrationForm.jsx` pouziva `react-i18next` (`useTranslation`). Tyto dva systemy nejsou propojene — zmena localStorage klice `language` nezmeni jazyk v `i18next`.
- **Oprava:** Bud (a) sjednotit na `react-i18next` v cele strance a napojit LanguageToggle na `i18n.changeLanguage()`, nebo (b) sjednotit na `useLanguage()` z LanguageContext jako zbytek verejnych stranek.
- **Pouceni:** V projektu pouzivat JEDEN jazykovy system. Momentalne existuji tri: `useLanguage()` (LanguageContext), `react-i18next`, a manualni localStorage. Sjednotit pred produkci.

### [2026-02-13] [BUG] Register stranka — hardcoded anglicke texty v index.jsx — NERESENO
- **Kde:** `src/pages/register/index.jsx:105-113,135-144,159,175-186,189` a dalsi
- **Symptom:** Vsechny texty v index.jsx (nadpisy, popisy, role options, benefity, stepper titulky) jsou hardcoded v anglictine. Na ceske verzi webu uzivatel vidi mixin ceskeho formulare s anglickymi nadpisy.
- **Pricina:** index.jsx neimportuje ani `useLanguage()` ani `useTranslation()`. Ma vlastni `currentLanguage` state ale nikde ho nepouziva pro preklady.
- **Oprava:** Prelozit vsechny texty — bud pres `useLanguage()` (konzistentne s ostatnimi strankami) nebo `useTranslation()` (konzistentne s formularem). Pridat prekladove klice pro step titles, role options a benefity.
- **Pouceni:** Pri vytvari novych stranek vzdy integrovat prekladovy system od zacatku. Hardcoded texty = dluh.

### [2026-02-13] [BUG] Register stranka — krok 3 (Verify) neexistuje — NERESENO
- **Kde:** `src/pages/register/index.jsx:24-28`
- **Symptom:** Stepper zobrazuje 3 kroky (Role, Details, Verify), ale krok 3 neni implementovan. Po odeslani formulare v kroku 2 dochazi k primu navigate bez overeni emailu.
- **Pricina:** Email verifikace nebyla implementovana. Firebase Auth podporuje `sendEmailVerification()` ale neni pouzita.
- **Oprava:** Bud (a) implementovat krok 3 s email verifikaci (`sendEmailVerification` + polling/manual check), nebo (b) odstranit krok 3 ze stepperu a zobrazovat jen 2 kroky.
- **Pouceni:** Nezobrazovat UI elementy ktere implikuji funkcionalitu jez neexistuje.

### [2026-02-13] [BUG] Register stranka — navigace na neexistujici routes po registraci — NERESENO
- **Kde:** `src/pages/register/components/RegistrationForm.jsx:147-150`
- **Symptom:** Po uspesne registraci naviguje na `/host-dashboard` nebo `/customer-dashboard`. Tyto routes nejsou definovane v Routes.jsx — uzivatel skonci na 404/NotFound strance.
- **Pricina:** Routes pro dashboard role nejsou implementovane.
- **Oprava:** Bud (a) pridat prislusne routes do Routes.jsx, nebo (b) navigovat na existujici stranku (napr. `/account` nebo `/`).
- **Pouceni:** Vzdy overit ze navigate target existuje v Routes.jsx pred nasazenim.

### [2026-02-13] [ERROR-HANDLING] Register stranka — chybejici rollback pri Firestore failure — NERESENO
- **Kde:** `src/pages/register/components/RegistrationForm.jsx:120-161`
- **Symptom:** Pokud `setDoc` (radek 144) selze po uspesnem `createUserWithEmailAndPassword` (radek 122), uzivatel ma Auth ucet bez profilu v Firestore. Pri pristim prihlaseni bude autentizovan ale bez dat.
- **Pricina:** Chybi try/catch s rollbackem (delete Auth uctu) nebo retry logika pro Firestore write.
- **Oprava:** Pridat vnoreny try/catch kolem Firestore write. Pri selhani zavolat `user.delete()` pro rollback Auth uctu a zobrazit error uzivateli.
- **Pouceni:** Dvoufazove operace (Auth + DB write) potrebuji rollback strategii. Firebase nema transakce pres Auth+Firestore.

### [2026-02-13] [BUG] Register stranka — zbytecny import ForgeButton v LanguageToggle — NERESENO
- **Kde:** `src/pages/register/components/LanguageToggle.jsx:2`
- **Symptom:** `ForgeButton` je importovan ale nikde v komponente se nepouziva. Vsechna tlacitka jsou nativni `<button>` elementy.
- **Pricina:** Pravdepodobne zbytek z drive kdy se planoval pouzit ForgeButton.
- **Oprava:** Odstranit `import ForgeButton from '../../../components/ui/forge/ForgeButton'` na radku 2.
- **Pouceni:** Pri code review kontrolovat nepouzivane importy.

### [2026-02-13] [BUG] Test-kalkulacka CheckoutForm — hardcoded tenant_id 'demo-tenant' — NERESENO
- **Kde:** `src/pages/test-kalkulacka/components/CheckoutForm.jsx:245`
- **Symptom:** Order objekt ma `tenant_id: 'demo-tenant'` natvrdo misto pouziti `getTenantId()` z `adminTenantStorage.js`. Objednavky vytvorene v jinem tenantu budou mit spatny tenant_id.
- **Pricina:** Pravdepodobne zbytek z vyvoje, kdy se pouzival demo tenant.
- **Oprava:** Importovat `getTenantId` z `../../utils/adminTenantStorage` a pouzit `tenant_id: getTenantId()`.
- **Pouceni:** Viz CLAUDE.md sekce 7 — nikdy nehardcodit tenantId. Vzdy pouzivat `getTenantId()`.

### [2026-02-13] [BUG] Test-kalkulacka FileUploadZone — 3MF format chybi v dropzone accept — NERESENO
- **Kde:** `src/pages/test-kalkulacka/components/FileUploadZone.jsx:183-191`
- **Symptom:** Dropzone accept objekt obsahuje pouze `.stl` a `.obj`. Format `.3mf` chybi, prestoze hidden file input v orchestratoru (index.jsx:654) akceptuje `.stl,.obj,.3mf`. Uzivatel nemuze nahrat 3MF soubor pres drag&drop.
- **Pricina:** 3MF nebyl pridan do dropzone konfigurace. MIME typ pro 3MF neni standardizovany, coz ztezuje konfiguraci.
- **Oprava:** Pridat `'model/3mf': ['.3mf']` a/nebo `'application/vnd.ms-package.3dmanufacturing-3dmodel+xml': ['.3mf']` do accept objektu.
- **Pouceni:** Podporovane formaty musi byt konzistentni mezi vsemi upload mechanismy (dropzone, hidden input, info text).

### [2026-02-13] [BUG] Test-kalkulacka PricingCalculator — nekonzistentni import pattern — NERESENO
- **Kde:** `src/pages/test-kalkulacka/components/PricingCalculator.jsx:2-4`
- **Symptom:** PricingCalculator importuje `{ Button }` (named) z `../../../components/ui/Button` a `Icon` z `../../../components/ui/Icon`. Vsechny ostatni subkomponenty importuji `Button` jako default a `Icon` z `../../../components/AppIcon`. Pokud by se export typ Button zmenil (napr. z named+default na jen default), PricingCalculator muze selhat.
- **Pricina:** Odlisny autor nebo cas implementace — nekoordinovany import styl.
- **Oprava:** Sjednotit na `import Button from '../../../components/ui/Button'` a `import Icon from '../../../components/AppIcon'` jako ostatni komponenty.
- **Pouceni:** V ramci jedne feature area pouzivat konzistentni import patterny. Code review by mel toto zachytit.

### [2026-02-13] [STATE] Test-kalkulacka — 5 komponent existuje ale neni integrovano — NERESENO
- **Kde:** `src/pages/test-kalkulacka/components/ShippingSelector.jsx`, `ExpressTierSelector.jsx`, `CouponInput.jsx`, `PostProcessingSelector.jsx`, `PromoBar.jsx`, `UpsellPanel.jsx`
- **Symptom:** Sest subkomponent existuje v components/ slozce s kompletnim kodem, ale ZADNA z nich neni importovana nebo renderovana v orchestratoru (index.jsx). State pro shipping (`selectedShippingMethodId`), express (`selectedExpressTierId`) a coupons (`appliedCouponCode`) existuje v orchestratoru, ale prislusne UI komponenty nejsou propojeny.
- **Pricina:** Komponenty byly vytvoreny pri Phase 2-3 implementaci ale nebyly integrovany do hlavniho flow.
- **Oprava:** Integrat komponenty do orchestratoru na prislusna mista (pravdepodobne do kroku 3 nebo jako soucasti PricingCalculator panelu), nebo je oznacit jako WIP/planned.
- **Pouceni:** Nedokoncena integrace subkomponent snizuje transparentnost kodu — neni jasne zda jde o planned feature nebo zapomenuty kod.

### [2026-02-13] [STATE] Test-kalkulacka — isProcessing state nikdy nepouzity — NERESENO
- **Kde:** `src/pages/test-kalkulacka/index.jsx:43`
- **Symptom:** State `isProcessing` je definovan (`const [isProcessing, setIsProcessing] = useState(false)`) ale nikde se nenastavi ani necte. Vsude se misto toho pouziva `selectedFile.status === 'processing'` nebo `sliceAllProcessing`.
- **Pricina:** Pravdepodobne pozustatek z drive pred refaktorem na per-model status tracking.
- **Oprava:** Odstranit `const [isProcessing, setIsProcessing] = useState(false)` na radku 43.
- **Pouceni:** Nepouzivane state promenne zvysuji kognitivni zatez a mohou vest k zamenami.

### [2026-02-13] [BUG] AdminLayout -- admin routes bez autentizace (PrivateRoute) -- NERESENO
- **Kde:** `src/Routes.jsx:94`
- **Symptom:** Admin panel na `/admin` a vsechny podstranky jsou pristupne bez prihlaseni. Zadny `<PrivateRoute />` wrapper. Uzivatel muze pristoupit primo na `/admin/pricing`, `/admin/orders` atd. bez autentizace.
- **Pricina:** PrivateRoute je zakomentovany i pro `/account` (komentar "DOCASNE VYPNUTO PRO VYVOJ"). Admin routes nemaji zadnou ochranu.
- **Oprava:** Obalit admin Route blok do `<Route element={<PrivateRoute />}>` pred produkci. Volitelne pridat role-based access (jen admin role).
- **Pouceni:** Admin panel MUSI byt za autentizaci a autorizaci. Verejne pristupny admin je bezpecnostni riziko i v dev prostredi.

### [2026-02-13] [BUG] AdminLayout -- "STATUS: ONLINE" je staticky text bez skutecneho health checku -- NERESENO
- **Kde:** `src/pages/admin/AdminLayout.jsx:267-292`
- **Symptom:** Sidebar footer zobrazuje zeleny indikator "STATUS: ONLINE" ktery je natvrdo v kodu. Nereflektuje zadny skutecny stav -- nezjistuje dostupnost backendu, API health, Supabase spojeni ani localStorage kapacitu.
- **Pricina:** Vizualni element pridany pro estetiku bez napojeni na skutecny monitoring.
- **Oprava:** Bud (a) napojit na skutecny health check endpoint (`/api/health`), nebo (b) odstranit indikator aby nematl uzivatele falesnym pocitem ze je vse v poradku.
- **Pouceni:** Status indikatory musi reflektovat skutecny stav. Falesne "ONLINE" muze vést k tomu ze admin neodhali vypadek.

### [2026-02-13] [SECURITY] Backend -- zadna autentizace na vsech API endpointech -- NERESENO
- **Kde:** `backend-local/src/index.js` (cely soubor), `backend-local/src/storage/storageRouter.js` (cely soubor)
- **Symptom:** Vsech 22 aktivnich API endpointu je pristupnych bez autentizace. Kdokoliv muze cist/mazat data libovolneho tenanta.
- **Pricina:** Auth middleware neni implementovan. Tenant izolace se opira pouze o `x-tenant-id` header ktery muze kdokoliv nastavit.
- **Oprava:** Implementovat auth middleware (JWT/session) pred vsemi endpointy krome `/api/health`. Tenant ID odvozovat z autentizovaneho uzivatele, ne z headeru.
- **Pouceni:** API bez autentizace je pristupne komukoliv kdo zna URL. Header-based tenant izolace bez auth je jen organizacni, ne bezpecnostni.

### [2026-02-13] [SECURITY] Backend -- /api/health lekuje interni cesty serveru -- NERESENO
- **Kde:** `backend-local/src/index.js:66-76`
- **Symptom:** Health check endpoint vraci `workspaceRoot`, `projectRoot`, `backendRoot` -- absolutni cesty na serveru. Utocnik ziska informace o souborovem systemu.
- **Pricina:** Debug informace ponechane v produkci.
- **Oprava:** Odstranit `workspaceRoot`, `projectRoot`, `backendRoot` z response. Ponechat pouze `ok`, `service`, `port`, `time`.
- **Pouceni:** Health endpointy nesmi odhalovat interni strukturu serveru. Debug data jen v dev modu.

### [2026-02-13] [SECURITY] Backend -- libraryUpload nema file type filtr -- NERESENO
- **Kde:** `backend-local/src/storage/storageRouter.js:68-71`
- **Symptom:** Multer instance `libraryUpload` pro `POST /api/storage/upload` nema zadny `fileFilter`. Uzivatel muze nahrat libovolny typ souboru vcetne .exe, .sh, .bat, .php.
- **Pricina:** Opomenuti pri implementaci -- `orderUpload` ma filtr ale `libraryUpload` ne.
- **Oprava:** Pridat fileFilter s whitelistem povolenych typu souboru (3D modely, dokumenty, obrazky).
- **Pouceni:** Kazda multer instance musi mit explicitni fileFilter. Upload bez filtru je bezpecnostni dira.

### [2026-02-13] [BUG] Backend -- nekonzistentni response format across endpoints -- NERESENO
- **Kde:** `backend-local/src/index.js:86-91,232-389,392-394`
- **Symptom:** Tri ruzne response formaty: (1) Presets+Storage: `{ ok: true, data }`, (2) Slice: `{ success: true, ... }`, (3) Widget presets: `{ presets, defaultPresetId }`. Globalni error handler pouziva `{ success: false, error }` misto `{ ok: false, errorCode, message }`.
- **Pricina:** Endpointy byly implementovany postupne ruznym zpusobem bez standardizace.
- **Oprava:** Sjednotit vsechny endpointy na format `{ ok: true/false, data/errorCode/message }`. Globalni error handler aktualizovat.
- **Pouceni:** Definovat response format jako konvenci a vynucovat ji od zacatku.

### [2026-02-13] [BUG] Backend -- emailRoutes existuji ale nejsou pripojeny v index.js -- NERESENO
- **Kde:** `backend-local/src/routes/emailRoutes.js` (existuje), `backend-local/src/index.js` (chybi import)
- **Symptom:** 4 email endpointy (templates, preview, send, log) jsou implementovany v routeru ale neni importovan ani mountovan v hlavnim souboru serveru.
- **Pricina:** Pravdepodobne planovana integrace ktera nebyla dokoncena.
- **Oprava:** Pridat `import emailRouter from "./routes/emailRoutes.js"` a `app.use("/api/email", emailRouter)` do index.js. Zaroven pridat auth middleware pred pripojenim.
- **Pouceni:** Sledovat nepripojene route moduly -- signalizuji nedokonceny work.

### [2026-02-13] [CONFIG] Routes.jsx -- admin routy bez PrivateRoute guardu -- NERESENO
- **Kde:** `src/Routes.jsx:85-115`
- **Symptom:** Vsechny admin routy (`/admin/*`) jsou pristupne bez autentizace. PrivateRoute pro `/account` je zakomentovany. Widget builder (`/admin/widget/builder/:id`) je tez bez guardu.
- **Pricina:** PrivateRoute byl docasne vypnut pro vyvoj (radky 86-88 maji komentar "DOCASNE VYPNUTO PRO VYVOJ") a admin routy nikdy guard nemely.
- **Oprava:** Obalit admin routy a account route do `<Route element={<PrivateRoute />}>` wrapperu. Widget builder tez zabezpecit.
- **Pouceni:** Route guards by mely byt zapnute od zacatku i pro vyvoj -- pouzit dev-only bypass (env variable) misto komentovani kodu.

### [2026-02-13] [PERFORMANCE] Routes.jsx -- 27 z 34 komponent eagerly-loaded -- NERESENO
- **Kde:** `src/Routes.jsx:1-30`
- **Symptom:** Velke komponenty jako AdminPricing (2500+ radku), TestKalkulacka (800+ radku) a AdminWidgetBuilder jsou eagerly-loaded, coz zvetsuje initial bundle.
- **Pricina:** Lazy loading byl pridan pouze pro Phase 2+3 admin stranky, Slicer a ModelStorage. Starsi admin stranky zustaly eagerly-loaded.
- **Oprava:** Konvertovat dalsi velke admin komponenty (AdminPricing, AdminWidgetBuilder) na React.lazy(). Zvazit lazy loading i pro TestKalkulacka.
- **Pouceni:** Pri pridavani novych rout vzdy zvazit lazy loading. Velke komponenty (500+ radku) by mely byt lazy-loaded pokud nejsou na kriticke ceste.

### [2026-02-13] [CONFIG] Storage helpery -- 5 helperu Skupiny B neprochazi pres adminTenantStorage -- NERESENO
- **Kde:** `src/utils/adminAuditLogStorage.js`, `adminAnalyticsStorage.js`, `adminTeamAccessStorage.js`, `adminBrandingWidgetStorage.js`, `widgetThemeStorage.js`
- **Symptom:** Pet storage helperu pouziva primo `localStorage.getItem`/`setItem` misto centralnich `readTenantJson`/`writeTenantJson` z adminTenantStorage. Supabase dual-write logika je duplikovana v kazdem souboru.
- **Pricina:** Tyto helpery byly vytvoreny pred refaktoringem na centralni tenant storage API, nebo maji specificke pozadavky (audit log retence, analytics prefix, branding legacy klice).
- **Oprava:** Refaktorovat na pouziti `readTenantJson`/`writeTenantJson` kde je to mozne. Pro audit log a analytics zvazit rozsireni appendTenantLog. Pro branding migrovat key pattern z `modelpricer_branding__{tenantId}` na `modelpricer:{tenantId}:branding`.
- **Pouceni:** Centralizovany storage entrypoint by mel pokryt vsechny use-case vcetne append, retence a legacy klicu.

### [2026-02-13] [CONFIG] adminAnalyticsStorage.js -- hardcoded tenant prefix -- NERESENO
- **Kde:** `src/utils/adminAnalyticsStorage.js:10`
- **Symptom:** `STORAGE_PREFIX` je hardcoded na `'modelpricer:demo-tenant:analytics'` misto dynamickeho tenant ID. V multi-tenant prostredi vsichni tenanti sdili stejny analytics klic.
- **Pricina:** Analytics helper byl napsany pro demo (single tenant) a nebyl aktualizovan po zavedeni tenant izolace.
- **Oprava:** Nahradit hardcoded prefix za dynamicky: `const storageKeyEvents = () => 'modelpricer:' + getTenantId() + ':analytics:events'`.
- **Pouceni:** Viz CLAUDE.md sekce 7 -- nikdy nehardcodit tenantId. Vzdy pouzivat `getTenantId()`.

### [2026-02-13] [CONFIG] Pricing Engine -- duplicitni shipping/coupon logika ve 3 souborech -- NERESENO
- **Kde:** `src/lib/pricing/pricingEngineV3.js:1103-1151` (shipping), `src/lib/pricing/pricingEngineV3.js:713-764` (coupon), `src/lib/pricing/shippingCalculator.js`, `src/lib/pricing/couponValidator.js`
- **Symptom:** Shipping kalkulace a coupon validace jsou inlined v pricingEngineV3.js A zaroven existuji jako standalone utility moduly (shippingCalculator.js, couponValidator.js). Utility moduly aktualne nikdo neimportuje.
- **Pricina:** Engine byl navrzen jako self-contained bez zavislosti. Utility soubory byly vytvoreny pravdepodobne pro standalone pouziti na backendu, ale nikdy nebyly integrovany.
- **Oprava:** Bud (a) odstranit standalone utility soubory pokud nejsou planovany k pouziti, nebo (b) refaktorovat engine aby importoval z utility modulu misto duplikace.
- **Pouceni:** Duplikovana logika ve vice souborech vede k divergenci pri budoucich zmenach. Jedna ze dvou kopii se zapomene aktualizovat.

### [2026-02-13] [CONFIG] Pricing Engine -- pricingService.js je mrtvy kod -- NERESENO
- **Kde:** `src/lib/pricingService.js` (236 radku)
- **Symptom:** Legacy pricing service neni importovan nikde v projektu (grep nenajde zadny import). Obsahuje starsi, jednodussi pipeline s hardcoded POST_PROCESSING_PRICES a DEFAULT_MATERIAL_PRICES. Vsechny kalkulacky pouzivaji pricingEngineV3.js.
- **Pricina:** Byl nahrazen pricingEngineV3.js pri Phase 1, ale nebyl odstranen.
- **Oprava:** Overit ze skutecne neni pouzivan (grep na 'pricingService') a odstranit. Nebo oznacit jako deprecated.
- **Pouceni:** Pri nahrazeni modulu novejsi verzi vzdy odstranit stary modul nebo ho jasne oznacit jako deprecated.

### [2026-02-13] [CONFIG] Supabase RLS policies -- permisivni anon pristup na vsech 25 tabulkach -- NERESENO
- **Kde:** `supabase/schema.sql:449-518`
- **Symptom:** Vsechny RLS policies pouzivaji `USING (true)` / `WITH CHECK (true)` pro anon roli. Kdokoliv s anon klicem muze cist, zapisovat, mazat data libovolneho tenanta.
- **Pricina:** Phase 4 je demo faze bez autentizace. Policies jsou zamerne permisivni s planem zprisneni v Phase 5.
- **Oprava:** Po implementaci JWT auth (Phase 5) nahradit `USING (true)` za `USING (auth.jwt() ->> 'tenant_id' = tenant_id::text)` na vsech datovych tabulkach. Odstranit `get_request_tenant_id()` helper funkci.
- **Pouceni:** Permisivni RLS nesmi zustat v produkci. Dokumentovat jako P0 bezpecnostni dluh.

### [2026-02-13] [CONFIG] Supabase storage bucket policies -- bez tenant scoping -- NERESENO
- **Kde:** `supabase/storage-policies.sql:1-101`
- **Symptom:** Storage bucket policies filtrují jen podle `bucket_id` ale ne podle tenanta. Kdokoliv muze cist/psat soubory jineho tenanta pokud zna cestu.
- **Pricina:** Demo faze bez auth -- neni zpusob jak scope-ovat storage na tenanta bez JWT claims.
- **Oprava:** Phase 5: Vyzadovat path pattern `{tenant_id}/...` a pridat RLS condition `(storage.foldername(name))[1] = auth.jwt() ->> 'tenant_id'`.
- **Pouceni:** Storage buckety bez tenant izolace jsou bezpecnostni riziko i pri private bucketech -- staci znat URL.

### [2026-02-13] [CONFIG] Supabase migrationRunner -- log migrace nema deduplikaci -- NERESENO
- **Kde:** `src/lib/supabase/migrationRunner.js:242-272` (migrateLog)
- **Symptom:** Opetovne spusteni `migrateLog` vlozi stejne zaznamy znovu (duplicity v audit_log, analytics_events, order_activity). Zadna kontrola na existujici data.
- **Pricina:** Log tabulky nemaji UNIQUE constraint na obsahu -- upsert neni mozny. Funkce pouziva ciste INSERT bez kontroly duplicit.
- **Oprava:** Pred insertem zkontrolovat pocet existujicich zaznamu pro dany tenant a preskocit pokud odpovidaji. Nebo pridat idempotency key (hash obsahu) do log tabulek.
- **Pouceni:** Migracni operace musi byt idempotentni -- bezpecne pro opetovne spusteni.

### [2026-02-13] [ERROR-HANDLING] Globalni ErrorBoundary neni pouzivan -- app nema catch-all ochranu -- NERESENO
- **Kde:** `src/components/ErrorBoundary.jsx` (existuje), `src/Routes.jsx` (chybi import)
- **Symptom:** Globalni ErrorBoundary v `src/components/ErrorBoundary.jsx` neni importovan ani pouzivan nikde v projektu. Aplikace nema zadnou catch-all error boundary kolem Routes nebo App. Pokud libovolna komponenta mimo kalkulacky (napr. Home, Pricing, admin) hodi chybu pri renderovani, zobrazi se bily screen.
- **Pricina:** Vsechny importy ErrorBoundary odkazuji na per-page kopie v `pages/*/components/ErrorBoundary.jsx`. Globalni verze nebyla nikdy integrovana.
- **Oprava:** Obalit hlavni route strom v Routes.jsx do `<ErrorBoundary>` importovaneho z `./components/ErrorBoundary`. Idealne aktualizovat globalni verzi aby pouzivala Forge tokeny a mela reset tlacitko.
- **Pouceni:** Kazda React aplikace by mela mit minimalne jednu globalni ErrorBoundary kolem celeho stromu. Per-page boundaries jsou doplnkove, ne nahradni.

### [2026-02-13] [STATE] ErrorBoundary -- 4 duplikovane kopie s ruznymi styly -- NERESENO
- **Kde:** `src/components/ErrorBoundary.jsx`, `src/pages/test-kalkulacka/components/ErrorBoundary.jsx`, `src/pages/test-kalkulacka-white/components/ErrorBoundary.jsx`, `src/pages/widget-kalkulacka/components/ErrorBoundary.jsx`
- **Symptom:** 4 kopie ErrorBoundary. Globalni pouziva Tailwind utility tridy, 3 per-page kopie pouzivaji Forge inline styles. Globalni verze nema reset tlacitko ani `onReset` prop. Per-page kopie jsou identicke navzajem.
- **Pricina:** Per-page kopie byly vytvoreny pri Forge redesignu (2026-02-10/11) bez konsolidace s globalni verzi.
- **Oprava:** Vytvorit jednu sdilenou ErrorBoundary s konfigurovatelnym vzhledem (prop `variant` nebo detekce theme). Pouzit ve vsech mistech vcetne globalni urovne.
- **Pouceni:** Duplikovane komponenty diverguji v case. Pri redesignu aktualizovat sdilene komponenty misto vytvareni lokalnich kopii.

### [2026-02-13] [STATE] FilePreview a ModelPreview -- identicke duplikovane soubory, oba nepouzivane -- NERESENO
- **Kde:** `src/components/FilePreview.jsx`, `src/components/ModelPreview.jsx`
- **Symptom:** Dva soubory po 134 radcich s identickym kodem (3D Canvas, STL/GLTF loading, osvetleni slidery). Jediny rozdil je nazev exportu a HTML id atributy na sliderech. Zadny z nich neni importovan nikde v projektu.
- **Pricina:** Pravdepodobne vznikly kopiovanim pri vyvoji. Kalkulacky pouzivaji vlastni ModelViewer.jsx subkomponenty.
- **Oprava:** Odstranit oba soubory nebo je oznacit jako deprecated. Pokud je 3D preview potreba, pouzit sdilenou ModelViewer komponentu.
- **Pouceni:** Duplicitni soubory s minimalni odlisnosti signalizuji chybejici abstrakci.

### [2026-02-13] [STATE] LoadingState a ErrorState -- implementovany ale nikde nepouzivane -- NERESENO
- **Kde:** `src/components/ui/LoadingState.jsx`, `src/components/ui/ErrorState.jsx`
- **Symptom:** Obe komponenty jsou plne implementovane (LoadingState: 3 varianty + InlineLoader, ErrorState: 3 varianty + auto-detect sitovych chyb + retry) ale nemaji zadny import v projektu. Admin stranky pouzivaji ad-hoc loading/error UI misto sdilenych komponent.
- **Pricina:** Vytvoreny jako soucast Phase 4 (Supabase migrace) pro async hooks useStorageQuery/useStorageMutation, ale integrace do admin stranek nebyla dokoncena.
- **Oprava:** Integrovat do vsech admin stranek ktere nacitaji data (AdminOrders, AdminAnalytics, AdminTeamAccess). Nahradit ad-hoc loading/error UI za tyto sdilene komponenty.
- **Pouceni:** Utility komponenty by mely byt integrovany ihned po vytvoreni, ne az "nekdy pozdeji".

### [2026-02-13] [PERFORMANCE] AppIcon -- wildcard import lucide-react brani tree-shakingu -- NERESENO
- **Kde:** `src/components/AppIcon.jsx:2`
- **Symptom:** `import * as LucideIcons from 'lucide-react'` importuje vsechny ikony. Dynamicky lookup `LucideIcons?.[name]` zabranuje Vite tree-shakeru odebrat nepouzivane ikony. Potencialni dopad 80+ kB na bundle.
- **Pricina:** Dynamicky icon resolver potrebuje pristup ke vsem ikonam za runtimu. Tree-shaker neumi staticky analyzovat dynamicky property access.
- **Oprava:** (a) Vytvorit explicitni mapu pouzivanych ikon (`const ICON_MAP = { ChevronRight, Upload, ... }`) a importovat jen ty, nebo (b) pouzit `@iconify/react` s lazy loading, nebo (c) akceptovat dopad pokud je Lucide pouzivana extenzivne (70+ importu).
- **Pouceni:** Wildcard importy (`import *`) s dynamickym pristupem zabranuji tree-shakingu. Pro velke icon knihovny preferovat explicitni import map.

### [2026-02-13] [CSS] Base UI nekonzistentni export pattern -- dual vs default vs named -- NERESENO
- **Kde:** `src/components/ui/` (Button, Card, Checkbox, Select, LoadingState, ErrorState, Slider, Label, Tooltip, Dialog)
- **Symptom:** Button ma dual export (default + named), Card/Checkbox/Slider/Label/Tooltip/Dialog maji jen named export, Select/Input/Container maji jen default. Konzumenti pouzivaji ruzne importy pro stejnou komponentu (`import Button` vs `import { Button }`).
- **Pricina:** Komponenty vznikaly v ruznych casech, nekdo kopiroval ze shadcn/ui (named), nekdo psal vlastni (default).
- **Oprava:** Sjednotit na jeden pattern -- idealne dual export (default + named) pro vsechny, aby oba importni styly fungovaly.
- **Pouceni:** Nekonzistentni exporty vedou k matoucim importum a obcasnym build chybam pri zamene default/named.

### [2026-02-13] [CSS] label.jsx import z @/lib/utils -- potencialni build error -- NERESENO
- **Kde:** `src/components/ui/label.jsx:5`
- **Symptom:** Import `import { cn } from "@/lib/utils"` se lisi od vsech ostatnich UI komponent (pouzivaji `../../utils/cn` nebo `@/utils/cn`). Soubor `src/lib/utils.js` NEMUSI existovat.
- **Pricina:** Zkopirovan z shadcn/ui generatoru bez upravy importu.
- **Oprava:** Zmenit na `import { cn } from "../../utils/cn"`.
- **Pouceni:** Po kopirovani shadcn/ui komponent overit importy. Kazdy project ma jinou strukturu.

### [2026-02-13] [CSS] Lowercase nazvy label.jsx a tooltip.jsx -- potencialni CI problem -- NERESENO
- **Kde:** `src/components/ui/label.jsx`, `src/components/ui/tooltip.jsx`
- **Symptom:** Dva soubory zacinaji malym pismenem, vsechny ostatni PascalCase. Na Windows to neni problem (case-insensitive FS), ale na Linux CI by import `from './Label'` selhal.
- **Pricina:** Shadcn/ui generator standardne produkuje lowercase nazvy. Zbytek projektu pouziva PascalCase.
- **Oprava:** Prejmenovavat soubory na `Label.jsx` a `Tooltip.jsx` a aktualizovat vsechny importy.
- **Pouceni:** Dodrzovat jednu naming konvenci pro soubory komponent (PascalCase).

### [2026-02-13] [STATE] 5 potencialne nepouzivanych base UI komponent -- NERESENO
- **Kde:** `src/components/ui/Container.jsx`, `src/components/ui/Slider.jsx`, `src/components/ui/label.jsx`, `src/components/ui/tooltip.jsx`, `src/components/ui/BackgroundPattern.jsx`
- **Symptom:** Grep pres cely `src/` adresar nenalezl zadne importy techto 5 komponent. Mohou byt dead code.
- **Pricina:** Mozna byly nahrazeny jinymi komponentami, mozna jsou importovane dynamicky nebo pres re-export ktery grep nezachytil.
- **Oprava:** Overit pres build a runtime. Pokud potvrzene nepouzivane, presunout do `_deprecated/` nebo smazat.
- **Pouceni:** Pravidelne audit nepouzivanych komponent. Dead code zvysuje kognitivni zatez a velikost bundle.
