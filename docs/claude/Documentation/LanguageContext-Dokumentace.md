# LanguageContext -- Dokumentace

> Centralni i18n context s inline CS/EN prekladovym slovnikem a useLanguage() hookem.
> Jediny soubor (1131 radku) obsahujici React Context Provider, custom hook,
> toggle logiku a kompletni prekladovy slovnik pro cesky a anglicky jazyk.

---

## 1. Prehled

`LanguageContext.jsx` je jednoduchy, samostatny i18n system pro ModelPricer. Nema
zadne externi zavislosti (react-intl, i18next apod.) -- veskera lokalizacni logika
je implementovana rucne pomoci React Context API.

**Hlavni funkce:**
- Prepinani mezi cestinou (`cs`) a anglictinou (`en`)
- Persistentni ulozeni jazykove preference do `localStorage`
- Prekladova funkce `t(key)` s fallbackem na samotny klic
- 462 prekladovych klicu v kazdem jazyce (CS i EN plne pokryty)

**Pouziti v projektu:** 29 komponent importuje `useLanguage()` hook -- je to
nejrozsirenejsi sdileny context v cele aplikaci, pouzivany ve vsech vrstvach
(marketing pages, admin panel, kalkulacka, widget, checkout).

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Jazyk | JavaScript + JSX (NE TypeScript) |
| State management | React Context API (`createContext` + `useContext`) |
| Persistence | `localStorage` (klic `language`) |
| Default jazyk | `cs` (cestina) |
| Podporovane jazyky | `cs`, `en` |
| Externi zavislosti | Zadne (jen React) |
| Soubor | `src/contexts/LanguageContext.jsx` |
| Radku | 1131 (z toho ~40 radku logika, ~1090 radku prekladovy slovnik) |

---

## 3. Architektura souboru

```
src/contexts/
  LanguageContext.jsx         -- Jediny soubor, 1131 radku
                                  Radky 1-11:    useLanguage() hook (named export)
                                  Radky 13-39:   LanguageProvider komponenta (named export)
                                  Radky 43-1130: translations objekt (CS + EN slovnik)
```

### Vnitrni struktura souboru

```
LanguageContext.jsx
  |
  +-- LanguageContext (createContext)       -- privatni, neexportovany
  |
  +-- useLanguage() (named export)         -- custom hook pro konzumenty
  |     +-- vraci: { language, setLanguage, toggleLanguage, t }
  |
  +-- LanguageProvider (named export)      -- wrapper komponenta
  |     +-- useState(localStorage || 'cs')
  |     +-- useEffect(localStorage persist)
  |     +-- toggleLanguage()
  |     +-- t(key) lookup
  |
  +-- translations (const)                 -- inline slovnik
        +-- cs: { 462 klicu }
        +-- en: { 462 klicu }
```

### Mounting v aplikaci

`LanguageProvider` je mountovany jako **nejvyssi wrapper** v `src/index.jsx`:

```jsx
<LanguageProvider>          // 1. uroven -- jazyk
  <AuthProvider>            // 2. uroven -- autentizace
    <App />                 // 3. uroven -- routing + stranky
  </AuthProvider>
</LanguageProvider>
```

To znamena, ze language context je dostupny **vsude** v aplikaci, vcetne
AuthProvider a vsech jeho potomku.

---

## 4. Import graf (kdo importuje useLanguage)

### Souhrn: 29 komponent

`useLanguage()` je importovany v nasledujicich souborech (abecedne po oblastech):

#### Marketing pages (4)

| Soubor | Pouziti |
|--------|---------|
| `src/pages/home/index.jsx` | Preklady hero, features, FAQ, plans |
| `src/pages/pricing/index.jsx` | Preklady cenovych planu |
| `src/pages/support/index.jsx` | Preklady support stranky |
| `src/pages/account/index.jsx` | Preklady ucetni stranky |

#### Sdilene UI komponenty (2)

| Soubor | Pouziti |
|--------|---------|
| `src/components/ui/Header.jsx` | Navigacni labely, login/logout texty |
| `src/components/ui/Footer.jsx` | Footer texty, pravni odkazy |

#### Admin panel (15)

| Soubor | Pouziti |
|--------|---------|
| `src/pages/admin/AdminLayout.jsx` | Sidebar navigace labely |
| `src/pages/admin/AdminDashboard.jsx` | Dashboard titulky a statistiky |
| `src/pages/admin/AdminBranding.jsx` | Branding formulare |
| `src/pages/admin/AdminPricing.jsx` | Materialy, hodinova sazba |
| `src/pages/admin/AdminFees.jsx` | Poplatky |
| `src/pages/admin/AdminParameters.jsx` | Slicovaci parametry |
| `src/pages/admin/AdminPresets.jsx` | Presety |
| `src/pages/admin/AdminOrders.jsx` | Objednavky |
| `src/pages/admin/AdminWidget.jsx` | Widget konfigurace |
| `src/pages/admin/AdminTeamAccess.jsx` | Tymovy pristup |
| `src/pages/admin/AdminAnalytics.jsx` | Analytika |
| `src/pages/admin/AdminExpress.jsx` | Express dodani |
| `src/pages/admin/AdminShipping.jsx` | Doprava |
| `src/pages/admin/AdminEmails.jsx` | Email notifikace |
| `src/pages/admin/AdminCoupons.jsx` | Kupony a akce |

#### Test kalkulacka (3)

| Soubor | Pouziti |
|--------|---------|
| `src/pages/test-kalkulacka/components/CheckoutForm.jsx` | Checkout formular texty |
| `src/pages/test-kalkulacka/components/PrintConfiguration.jsx` | Konfigurace tisku |
| `src/pages/test-kalkulacka/components/OrderConfirmation.jsx` | Potvrzeni objednavky |

#### Test kalkulacka white (3)

| Soubor | Pouziti |
|--------|---------|
| `src/pages/test-kalkulacka-white/components/CheckoutForm.jsx` | Checkout formular |
| `src/pages/test-kalkulacka-white/components/PrintConfiguration.jsx` | Konfigurace |
| `src/pages/test-kalkulacka-white/components/OrderConfirmation.jsx` | Potvrzeni |

#### Widget kalkulacka (1)

| Soubor | Pouziti |
|--------|---------|
| `src/pages/widget-kalkulacka/components/PrintConfiguration.jsx` | Konfigurace tisku |

#### Definice (1)

| Soubor | Pouziti |
|--------|---------|
| `src/contexts/LanguageContext.jsx` | Definice hooku a provideru |

---

## 5. Design a vizual

N/A -- `LanguageContext` je datovy/logicky context bez vlastniho vizualniho vystupu.
Nema zadne JSX renderovani krome `<LanguageContext.Provider>` wrapperu.

Prepinac jazyka je vizualne implementovany v `Header.jsx` (ne v LanguageContext).

---

## 6. Datovy model (prekladovy slovnik struktura)

### 6.1 Top-level struktura

```javascript
const translations = {
  cs: { /* 462 klicu */ },
  en: { /* 462 klicu */ }
};
```

### 6.2 Naming konvence klicu

Klice pouzivaji dot-notation s hierarchickou strukturou:

```
{oblast}.{sekce}.{podsekce}.{polozka}
```

Priklady:
- `nav.home` -- navigace, polozka home
- `home.hero.title` -- home stranka, hero sekce, titulek
- `admin.branding.businessName` -- admin, branding, nazev firmy
- `calc.checkout.submit` -- kalkulacka, checkout, odeslani

### 6.3 Rozdeleni klicu podle oblasti (462 celkem)

| Prefix | Pocet klicu | Popis |
|--------|-------------|-------|
| `admin.*` | 278 | Admin panel (60.2% vsech klicu) |
| `home.*` | 94 | Homepage sekce (20.3%) |
| `calc.*` | 43 | Kalkulacka + checkout (9.3%) |
| `nav.*` | 9 | Navigacni menu (1.9%) |
| `common.*` | 9 | Sdilene texty (1.9%) |
| `pricing.*` | 8 | Cenova stranka (1.7%) |
| `footer.*` | 6 | Paticka (1.3%) |
| `support.*` | 5 | Support stranka (1.1%) |
| `checkout.*` | 5 | Dodaci adresa (1.1%) |
| `widget.*` | 5 | Widget komponenty (1.1%) |

### 6.4 Top admin subsekce

| Subsekce | Pocet klicu | Popis |
|----------|-------------|-------|
| `admin.widget.*` | 78 | Widget konfigurace + builder + onboarding |
| `admin.branding.*` | 35 | Branding nastaveni |
| `admin.storage.*` | 17 | Model storage |
| `admin.orders.*` | 17 | Objednavky |
| `admin.coupons.*` | 17 | Kupony a akce |
| `admin.volume.*` | 15 | Mnozstevni slevy |
| `admin.parameters.*` | 15 | Parametry slicovani |
| `admin.dashboard.*` | 13 | Dashboard |
| `admin.pricing.*` | 13 | Ceny materialu |
| `admin.express.*` | 11 | Express dodani |
| `admin.shipping.*` | 11 | Doprava |
| `admin.emails.*` | 11 | Email notifikace |
| `admin.presets.*` | 11 | Presety |
| `admin.fees.*` | 10 | Poplatky |

### 6.5 Priklad zaznamu (CS vs EN)

| Klic | CS | EN |
|------|----|----|
| `nav.login` | Prihlasit se | Sign In |
| `home.hero.title` | Automaticka kalkulacka cen 3D tisku jako sluzba | Automatic 3D Print Pricing Calculator as a Service |
| `admin.pricing.perHour` | Kc/hod | CZK/hour |
| `calc.checkout.submit` | Odeslat objednavku | Submit Order |
| `common.save` | Ulozit zmeny | Save Changes |

---

## 8. API -- useLanguage() hook

### 8.1 Import

```javascript
import { useLanguage } from '@/contexts/LanguageContext';
```

### 8.2 Pouziti v komponente

```javascript
const { t, language, setLanguage, toggleLanguage } = useLanguage();
```

### 8.3 Vracene hodnoty

| Vlastnost | Typ | Popis |
|-----------|-----|-------|
| `language` | `string` | Aktualni jazyk: `'cs'` nebo `'en'` |
| `setLanguage` | `(lang: string) => void` | Primo nastavi jazyk na libovolnou hodnotu |
| `toggleLanguage` | `() => void` | Prepne jazyk: `cs` -> `en`, `en` -> `cs` |
| `t` | `(key: string) => string` | Prekladova funkce -- vraci preklad nebo samotny klic jako fallback |

### 8.4 Funkce `t(key)` -- detailni chovani

```javascript
t: (key) => translations[language][key] || key
```

- **Input:** Klicovy retezec (napr. `'nav.home'`)
- **Output:** Prelozeny text pro aktualni jazyk
- **Fallback:** Pokud klic neexistuje ve slovniku, vraci samotny klic (napr. `'missing.key'` -> `'missing.key'`)
- **Zadne varovani:** Chybejici klice neloguji warning do console
- **Zadna interpolace:** Nepodporuje `{variable}` substituci -- pouze staticke retezce

### 8.5 Guard clause

```javascript
if (!context) {
  throw new Error('useLanguage must be used within LanguageProvider');
}
```

Hook vyhodI chybu pokud je pouzit mimo `LanguageProvider`. To zarucuje, ze kazda
komponenta pouzivajici `useLanguage()` musi byt potomkem provideru.

### 8.6 Priklady pouziti

**Zakladni preklad:**
```jsx
function MyComponent() {
  const { t } = useLanguage();
  return <h1>{t('home.hero.title')}</h1>;
}
```

**Prepnuti jazyka:**
```jsx
function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  return (
    <button onClick={toggleLanguage}>
      {language === 'cs' ? 'EN' : 'CZ'}
    </button>
  );
}
```

**Podminka podle jazyka:**
```jsx
function PriceDisplay({ price }) {
  const { language } = useLanguage();
  return language === 'cs'
    ? <span>{price} Kc</span>
    : <span>${price}</span>;
}
```

---

## 9. State management (React Context + localStorage persist)

### 9.1 Datovy tok

```
1. Inicializace:
   localStorage.getItem('language')  -->  useState('cs' || ulozena hodnota)

2. Zmena jazyka:
   toggleLanguage() / setLanguage()  -->  setState(novy jazyk)
                                     -->  useEffect --> localStorage.setItem('language', novy jazyk)
                                     -->  React re-render --> vsechny konzumenty dostanu novou hodnotu

3. Reload stranky:
   localStorage.getItem('language')  -->  obnovi posledni volbu
```

### 9.2 localStorage klic

| Klic | Mozne hodnoty | Default |
|------|---------------|---------|
| `language` | `'cs'`, `'en'` | `'cs'` |

**Poznamka:** Klic `language` je BEZ tenant prefixu (`modelpricer:`) -- jazykova
preference je globalni, ne per-tenant. To je zamerne -- admin i zakaznik sdili
stejnou jazykovou preferenci v ramci jednoho prohlizece.

### 9.3 React Context hodnota

```javascript
const value = {
  language,          // string: 'cs' | 'en'
  setLanguage,       // React setState funkce
  toggleLanguage,    // () => void
  t: (key) => translations[language][key] || key
};
```

Hodnota se meni pouze pri zmene `language` stavu. Objekt `value` se vytvari
pri kazdem renderu LanguageProvider (viz sekce 13 -- Performance).

---

## 11. Preklady -- statistika klicu

### 11.1 Celkova statistika

| Metrika | Hodnota |
|---------|---------|
| Celkem klicu (CS) | **462** |
| Celkem klicu (EN) | **462** |
| Chybejici v EN (CS ma, EN nema) | **0** |
| Chybejici v CS (EN ma, CS nema) | **0** |
| Parita CS/EN | **100%** -- vsechny klice pokryty v obou jazycich |

### 11.2 Rozdeleni podle oblasti

| Oblast | Klicu | % z celku |
|--------|-------|-----------|
| Admin panel | 278 | 60.2% |
| Homepage | 94 | 20.3% |
| Kalkulacka | 43 | 9.3% |
| Navigace | 9 | 1.9% |
| Sdilene (common) | 9 | 1.9% |
| Cenova stranka | 8 | 1.7% |
| Footer | 6 | 1.3% |
| Support | 5 | 1.1% |
| Checkout (shipping) | 5 | 1.1% |
| Widget | 5 | 1.1% |

### 11.3 Komentarove sekce ve slovniku

Slovnik je organizovany pomoci komentaru do tematickych bloku:

```
// Header (nav.*)
// Home Page (home.hero.*, home.trust.*, home.how.*, home.features.*, home.demo.*, home.pricing.*, home.audience.*, home.faq.*)
// Home -- What We Do (home.whatWeDo.*)
// Home -- How It Works (home.howItWorks.*)
// Home -- Section Labels (home.trust.label, home.section.*)
// Home -- Feature Cards (home.forge.feature*.*)
// Home -- Plans (home.forge.plans.*)
// Footer (footer.*)
// Pricing Page (pricing.*)
// Support Page (support.*)
// Admin Navigation (admin.dashboard .. admin.coupons)
// S09: Express (admin.express.*)
// S04: Shipping (admin.shipping.*)
// S07: Email (admin.emails.*)
// S10: Coupons (admin.coupons.*)
// S14: Kanban (admin.orders.viewTable, admin.kanban.*)
// Admin Dashboard (admin.dashboard.*)
// Admin Branding (admin.branding.*)
// Admin Pricing (admin.pricing.*)
// Admin Fees (admin.fees.*)
// Admin Parameters (admin.parameters.*)
// Admin Presets (admin.presets.*)
// Admin Orders (admin.orders.*)
// Admin Model Storage (admin.storage.*)
// Checkout -- Shipping (checkout.*)
// Admin Widget (admin.widget.*)
// Admin Widget Builder (admin.widget.builder.*)
// Device modes (admin.widget.builder.device.*)
// Quick themes (admin.widget.builder.quickTheme.*)
// Onboarding (admin.widget.builder.onboarding.*)
// Admin Widget Page (admin.widget.page.*)
// Widget Components (widget.*)
// Common (common.*)
// S01: Bug fixes (calc.presets.*, calc.recalc.*)
// S02: Checkout flow (calc.step.*, calc.checkout.*, calc.confirmation.*)
// S05: Volume discounts (calc.volume.*, admin.volume.*)
```

---

## 13. Performance

### 13.1 Hlavni problemy

**Problem 1: Velky inline objekt (1090 radku slovniku)**

Cely `translations` objekt (924 retezcu ve 2 jazycich) je definovany jako module-level
konstanta. To samo o sobe neni problem -- objekt se vytvori jednou pri importu modulu.
Ale je sucastI closure funkce `t()`.

**Problem 2: Nova reference `value` pri kazdem renderu**

```javascript
const value = {
  language,
  setLanguage,
  toggleLanguage,
  t: (key) => translations[language][key] || key  // nova arrow funkce pri kazdem renderu
};
```

Pri kazde zmene jazyka (nebo re-renderu LanguageProvider) se vytvari:
1. Novy `value` objekt
2. Nova `t` arrow funkce

To zpusobi re-render **vsech** 29 konzumentu `useLanguage()`, protoze React Context
porovnava referenci objektu (ne hodnotu).

### 13.2 Realne dopady

- Prepnuti jazyka zpusobi re-render cele aplikace (vsech 29 konzumentu)
- To je ale **ocekavane chovani** -- prepnuti jazyka je vzacna akce (uzivatel to udela 0-1x za session)
- Bezny provoz (bez prepnuti jazyka) nezpusobuje zbytecne re-rendery -- `language` state se nemeni

### 13.3 Mozna optimalizace (neni implementovana)

```javascript
// useMemo pro value objekt:
const t = useCallback((key) => translations[language][key] || key, [language]);

const value = useMemo(() => ({
  language,
  setLanguage,
  toggleLanguage,
  t
}), [language, setLanguage, toggleLanguage, t]);
```

Toto by zabranilo zbytecnym re-renderum konzumentu kdyz se LanguageProvider
re-renderuje z jineho duvodu nez zmena jazyka. V praxi je to ale nerelevantni,
protoze LanguageProvider je na urovni `index.jsx` a re-renderuje se pouze pri
zmene vlastniho stavu (tj. jazyka).

### 13.4 Bundle size dopad

Soubor ma 1131 radku, z cehoz ~1090 jsou retezce slovniku. Pri minifikaci Vite
zmensi soubor, ale vsechny retezce zustanou. Odhadovana velikost po minifikaci:
- Retezce: ~35-40 KB (462 klicu x 2 jazyky, prumerne 40-50 znaku na retezec)
- Logika: ~0.5 KB

Slovnik se nacte vzdy cely -- i kdyz uzivatel pouziva jen jeden jazyk. Code splitting
slovniku neni implementovany.

---

## 17. Zname omezeni

### 17.1 Inline slovnik = 1131 radku v jednom souboru

Vsech 462 klicu pro oba jazyky je definovano primo v `LanguageContext.jsx`.
To znamena:
- Kazda uprava prekladu vyzaduje editaci tohoto souboru
- Soubor je tezko citelny a udrzovatelny (1131 radku)
- Neni mozne predavat preklady prekladatelum jako externi JSON/PO soubory
- Git merge konflikty jsou casty kdyz vice lidi edituje preklady soucasne

**Alternativa (neimplementovana):** Externi JSON soubory `cs.json` / `en.json`
v `src/locales/` s dynamickym importem.

### 17.2 Zadna interpolace

Funkce `t(key)` vraci pouze staticky retezec. Nepodporuje:
- `t('greeting', { name: 'Jan' })` -- nahrazeni promennych
- Pluralizaci (`1 polozka` vs `5 polozek`)
- Vnorene HTML v prekladech

Pokud je potreba dynamicky text, musi se rucne sestavit:
```javascript
// Misto t('items.count', { count: 5 })
`${count} ${t('calc.checkout.pieces')}`
```

### 17.3 Zadne varovani pro chybejici klice

Kdyz `t('neexistujici.klic')` nenajde klic, tise vraci samotny klic.
V development modu neloguje warning do console. To ztezuje detekci
preklepu v klicich.

### 17.4 Dva jazyky natvrdo

System podporuje pouze `cs` a `en`. Pridani dalsiho jazyka vyzaduje:
1. Pridani noveho objektu do `translations` (napr. `de: { ... }`)
2. Uprava `toggleLanguage()` (aktualne jen preklapi cs/en)
3. Uprava UI prepinace v Header.jsx

### 17.5 Globalni localStorage klic bez tenant prefixu

Klic `language` v localStorage nema tenant prefix (`modelpricer:`). To je
funkcni, ale nekonzistentni s ostatnimi storage klici v projektu.
V multi-tenant prostredi to znamena, ze jazykova preference je sdilena
mezi vsemi tenanty v jednom prohlizeci.

### 17.6 Nekompletni pokryti nekterych oblasti

Nektere komponenty v projektu pouzivaji hardcoded texty misto prekladovych klicu:
- `ForgePricingCard.jsx` -- "Recommended" badge bez prekladu
- Nektere admin komponenty mohou mit anglicke texty primo v JSX
- Error messages z backendu nejsou lokalizovane

### 17.7 Soubor `src/i18n.js` existuje ale neni pouzivan pro preklady

V `src/index.jsx` je import `import "./i18n"` ale tento soubor slouzi pro jinou
konfiguraci (pravdepodobne legacy). Skutecne preklady jsou reseny pouze
pres `LanguageContext.jsx`.

---

## Souvisejici soubory

| Soubor | Vztah |
|--------|-------|
| `src/contexts/LanguageContext.jsx` | Hlavni soubor (tento dokument) |
| `src/index.jsx` | Mounting LanguageProvider |
| `src/components/ui/Header.jsx` | UI prepinac jazyka |
| `src/i18n.js` | Legacy/doplnkova i18n konfigurace |

---

## Vlastnictvi

| Role | Agent |
|------|-------|
| Senior owner | `mp-sr-i18n` |
| Preklady | `mp-spec-i18n-translations` |
| Meny | `mp-spec-i18n-currency` |
| Datumy | `mp-spec-i18n-dates` |
