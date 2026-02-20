# 19. i18n (CZ/EN lokalizace) — Detailni RoadMap Plan

> **Stav:** 🟡 45% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** ZADNE (horizontalni concern)
> **Kdo na nem zavisi:** Vsechny stranky a komponenty

---

## Prehled

Lokalizacni system pro cestinu a anglictinu. Pouziva `LanguageContext` s inline slovnikem (vsechny preklady v jednom souboru). Prepinani jazyku funguje.

**Hlavni soubor:** `src/contexts/LanguageContext.jsx` (~1130 radku, 462 klicu CS/EN)
**Hook:** `useLanguage()` → `{ t, language, setLanguage }`

---

## Co je HOTOVO (✅)

### LanguageContext a prepinani (70%)
- [x] LanguageContext s 462 prekladovymi klici
- [x] `useLanguage()` hook
- [x] `t('klic')` funkce pro preklad
- [x] Prepinani CZ/EN v UI (header)
- [x] Persist vybraneho jazyka

### Pokryti admin stranek (70%)
- [x] AdminPricing — vetsina prelozena
- [x] AdminFees — vetsina prelozena
- [x] AdminPresets — vetsina prelozena
- [x] AdminBranding — vetsina prelozena
- [x] Verejne stranky (Home, Pricing, Support) — prelozeny

---

## Co CHYBI / je potreba dodelat

### Faze 1: Doplnit chybejici preklady (Priorita: STREDNI)

#### Ukol 1.1: Audit vsech hardcoded textu
- **Metoda:** Prohledat vsechny `.jsx` soubory pro hardcoded ceske/anglicke texty
- **Co hledat:**
  - Stringy v JSX ktere nejsou obaleny `t()`
  - Placeholdery, labely, tooltipy, error messages, toasty
  - Button texty, nadpisy
- **Nastroj:** `grep -r "\"[A-Z]" src/pages/ --include="*.jsx"` (hledani stringu zacinajicich velkym pismenem)

#### Ukol 1.2: Kalkulacka (test-kalkulacka)
- **Soubory:** `src/pages/test-kalkulacka/` — vsechny komponenty
- **Co udelat:**
  - [ ] Projit index.jsx — najit hardcoded texty
  - [ ] Projit vsechny sub-komponenty:
    - [ ] FileUpload / DropZone texty
    - [ ] Model list texty
    - [ ] Print config labely
    - [ ] Price summary texty
    - [ ] Checkout form labely a validacni zpravy
    - [ ] ShippingSelector texty
    - [ ] ExpressTierSelector texty
    - [ ] CouponInput texty
  - [ ] Pridat chybejici klice do LanguageContext.jsx
  - [ ] Nahradit hardcoded texty za `t('klic')`
- **Ocekavany rozsah:** 30-60 novych klicu

#### Ukol 1.3: Novejsi admin stranky
- **Soubory:** Novejsi admin stranky ktere mohly byt pridany bez i18n
- **Co udelat:**
  - [ ] AdminShipping.jsx — audit a prelozit
  - [ ] AdminExpress.jsx — audit a prelozit
  - [ ] AdminCoupons.jsx — audit a prelozit
  - [ ] AdminOrders.jsx — audit a prelozit
  - [ ] AdminAnalytics.jsx — audit a prelozit
  - [ ] AdminEmails.jsx — audit a prelozit
  - [ ] AdminTeam.jsx — audit a prelozit
  - [ ] AdminMigration.jsx — audit a prelozit
  - [ ] AdminIntegrations.jsx — audit a prelozit
  - [ ] ModelStorage stranka — audit a prelozit
  - [ ] Account stranka — audit a prelozit
- **Ocekavany rozsah:** 50-100 novych klicu celkem

#### Ukol 1.4: Widget-kalkulacka
- **Soubory:** `src/pages/widget-kalkulacka/` — vsechny komponenty
- **Co udelat:**
  - [ ] Stejna kontrola jako v test-kalkulacce
  - [ ] Widget by mel mit minimalni texty (vetsinou konfigurovane pres branding)
- **Ocekavany rozsah:** 10-20 novych klicu

### Faze 2: Architektura prekladu (Priorita: NIZKA, post-Beta)

#### Ukol 2.1: Rozdeleni slovniku na moduly
- **Aktualni stav:** Vsech 462+ klicu v jednom souboru (1130 radku)
- **Navrh:**
  ```
  src/i18n/
    common.js       — sdilene (menu, buttons, general)
    admin.js         — admin panel texty
    calculator.js    — kalkulacka texty
    widget.js        — widget texty
    public.js        — verejne stranky
    index.js         — merge vsech modulu
  ```
- **Poznamka:** Pro Beta neni nutne — jeden soubor staci. Ale pro udrzovatelnost je lepsi rozdelit.

#### Ukol 2.2: Automaticka detekce chybejicich klicu
- **Co udelat:**
  - [ ] Dev-only warning kdyz `t('klic')` nenajde preklad
  - [ ] Console.warn s nazvem chybejiciho klice
  - [ ] Script pro generovani seznamu chybejicich klicu

### Faze 3: Dalsi jazyky (post-Beta)

#### Ukol 3.1: Priprava pro dalsi jazyky
- **Co udelat:**
  - [ ] Refactor LanguageContext pro dynamicke nacitani jazyku
  - [ ] Pridani DE (nemcina) jako prvni dalsi jazyk
  - [ ] Pridani SK (slovenstina)
  - [ ] Fallback chain: SK → CZ → EN (slovenstina fallbackne na cestinu)
- **Poznamka:** Ciste post-Beta

---

## Implementacni poradi

1. **Faze 1** (Doplneni prekladu) — 6-10 hodin (hodne manualni prace)
2. **Faze 2** (Architektura) — post-Beta
3. **Faze 3** (Dalsi jazyky) — post-Beta

**Celkem pro Beta:** ~6-10 hodin

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Preskoceni nekterych textu | Vysoka | Nizky | Systematicky audit |
| Preklady nejsou konzistentni | Stredni | Nizky | Glossar (jednotne terminy) |
| Monoliticky slovnik tezko udrzitelny | Stredni | Nizky | Faze 2 post-Beta |

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/contexts/LanguageContext.jsx` | Pridani 80-180 novych klicu | Stredni |
| `src/pages/test-kalkulacka/*.jsx` | Nahrada hardcoded za t() | Stredni |
| `src/pages/admin/*.jsx` | Nahrada hardcoded za t() | Stredni |
| `src/pages/widget-kalkulacka/*.jsx` | Nahrada hardcoded za t() | Maly |

---

## Poznamky

- **TIP:** Pouzivat konzistentni terminy — vytvorit glossar (napr. "objednavka" = "order", "doprava" = "shipping")
- **TIP:** Nejdriv prelozit kalkulacku (zakaznik-facing), pak admin (firma-facing)
- **DULEZITE:** Widget texty by meli byt minimalni — vetsina obsahu je z branding konfigurace
- **? OTAZKA:** Maji se chybejici preklady zobrazovat jako anglicky fallback nebo jako klic? (Doporucuji anglicky fallback)

---

## Kriticke doplnky (z review)

### Glossar — jednotne terminy (CZ ↔ EN)
- [ ] Vytvorit a udrzovat glossar v `docs/claude/Documentation/i18n-glossar.md`
- [ ] Klicove terminy:
  | CZ | EN | Poznamka |
  |----|----|---------|
  | Objednavka | Order | |
  | Doprava | Shipping | |
  | Dobirka | Cash on Delivery / COD | |
  | Priplatek | Surcharge / Fee | |
  | Sleva | Discount | |
  | Kupon | Coupon | |
  | Material | Material | |
  | Cas tisku | Print time | |
  | Hmotnost | Weight | |
  | Infill | Infill | Neprelozovat — 3D tisk termin |
  | Podpory | Supports | V kontextu 3D tisku |
  | Preset | Preset | Neprelozovat |
  | Variabilni symbol | Variable symbol / Reference number | |
  | Faktura | Invoice | |
- [ ] Konzistence: VZDY pouzit stejny preklad pro stejny termin v cele aplikaci

### Automaticka detekce chybejicich klicu (dev-only)
- [ ] Wrapper pro `t()` funkci v development mode:
  ```javascript
  const t = (key) => {
    const translation = translations[language][key];
    if (!translation && process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Missing key: "${key}" for language "${language}"`);
      missingKeys.add(key);
    }
    return translation || translations['en'][key] || key;
  };
  ```
- [ ] DevTools panel/overlay zobrazujici seznam chybejicich klicu na aktualni strance
- [ ] Script `npm run i18n:audit` — projde vsechny JSX soubory a porovnat s klici v LanguageContext

### Pluralizace a formatovani
- [ ] Ceska pluralizace je SLOZITA (1 model, 2-4 modely, 5+ modelu)
  - Pravidlo: `n===1 ? 'model' : n>=2 && n<=4 ? 'modely' : 'modelu'`
  - Helper: `tPlural(key, count)` — vrati spravny tvar
- [ ] Formatovani cisel: `Intl.NumberFormat('cs-CZ')` pro 1 234,56 vs `en-US` pro 1,234.56
- [ ] Formatovani men: `Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' })` → "525,00 Kc"
- [ ] Formatovani dat: `Intl.DateTimeFormat('cs-CZ')` → "18. 2. 2026"

### Priorita prekladu (co delat prvni)
1. **Kalkulacka** (zakaznik-facing) — nejvyssi priorita, 30-60 klicu
2. **Widget** — zakaznik vidi, 10-20 klicu
3. **Order Confirmation / Checkout** — zakaznik vidi, 15-25 klicu
4. **Admin stranky** — firma vidi, 50-100 klicu (ale firma je tech-savvy, EN staci)
5. **Login/Register** — oba jazyky, 10-15 klicu

### Budouci: i18n pro email sablony
- [ ] Email sablony musi byt tez prelozeny (CS/EN)
- [ ] Jazyk emailu = jazyk zakaznika (ne firmy)
- [ ] Kde zjistit jazyk zakaznika? Z kalkulacky `language` atributu nebo z prohlizece `Accept-Language`
