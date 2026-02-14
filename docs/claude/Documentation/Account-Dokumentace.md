# Account — Dokumentace

> Stranka nastaveni uzivatelskeho uctu. Obsahuje 4 zalozky (Profil, Firma, Zabezpeceni, Fakturace) se spravou osobnich udaju, firemnich informaci, hesla a plateb. Forge dark theme s inline styly.

---

## 1. Prehled (URL /account)

Account stranka je dostupna na route `/account`. V soucasne dobe je **PrivateRoute docasne vypnuta** (zakomentovano v `Routes.jsx`, radky 86-88), takze stranka je pristupna bez autentizace.

Stranka poskytuje:
- **Profil** — editace jmena, prijmeni, emailu, telefonu
- **Firma** — editace firemnich udaju (nazev, ICO, DIC, adresa)
- **Zabezpeceni** — zmena hesla s password strength indikatorom, 2FA sekce, aktivni relace
- **Fakturace** — aktualni tarif, platebni metody, historie faktur

Stranka pouziva **mock data** (hardcoded useState) — neni napojena na backend ani storage. Veskerou logiku (ukladani, nacitani) je nutne doimplementovat.

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 (JSX) |
| Bundler | Vite |
| Styling | Inline styles (Forge CSS custom properties) |
| Animace | framer-motion (motion, AnimatePresence) |
| Ikony | lucide-react pres `AppIcon` wrapper |
| Preklady | Lokalni `t` objekt (inline CS/EN); `useLanguage()` z LanguageContext |
| Routing | React Router v6 (`/account`) |
| Auth (subkomponenta) | Firebase Auth (`firebase/auth`), Firebase Functions |

---

## 3. Architektura souboru

```
src/pages/account/
  index.jsx                          -- Hlavni stranka (1037 radku)
  components/
    AccountOverviewCard.jsx           -- Prehledova karta uctu (299 radku) — NEPOUZITA v index.jsx
```

### Poznamka k AccountOverviewCard.jsx

Komponenta `AccountOverviewCard` je **definovana, ale NENI importovana ani pouzita** v hlavnim `index.jsx`. Pouziva Firebase Auth (`auth.currentUser`) pro zobrazeni:
- Avatar (foto nebo inicialy)
- Jmeno, email, email verification stav
- Quick links (Upravit profil, Zmenit heslo)
- Odhlaseni na vsech zarizenich (pres Firebase Cloud Function `revokeUserTokens`)
- Skeleton loading stav kdyz neni user

Tato komponenta je pravdepodobne pripravena pro budouci integraci.

---

## 4. Import graf

### index.jsx

```
index.jsx
  +-- React, useState                    (react)
  +-- motion, AnimatePresence            (framer-motion)
  +-- Icon                               (../../components/AppIcon)
  +-- useLanguage                        (../../contexts/LanguageContext)
```

### AccountOverviewCard.jsx (nepouzita)

```
AccountOverviewCard.jsx
  +-- React, useMemo, useState           (react)
  +-- auth                               (../../../firebase)
  +-- sendEmailVerification              (firebase/auth)
  +-- getFunctions, httpsCallable        (firebase/functions)
  +-- Link                               (react-router-dom)
```

---

## 5. Design a vizual

### Theme

Stranka pouziva **Forge dark theme** s inline styly. Zadne Tailwind tridy, zadne externi CSS soubory.

### Forge tokeny pouzite na strance

| Token | Ucel |
|-------|------|
| `--forge-bg-void` | Pozadi stranky |
| `--forge-bg-surface` | Pozadi karet |
| `--forge-bg-elevated` | Pozadi inputu, elevovane plochy |
| `--forge-bg-overlay` | Progress bar pozadi |
| `--forge-text-primary` | Hlavni text |
| `--forge-text-secondary` | Podtitulky, popisy |
| `--forge-text-muted` | Ikony v inputech, labels |
| `--forge-accent-primary` (#00D4AA) | Aktivni tab, primary buttony, badge |
| `--forge-error` (#FF4757) | Danger button, slabe heslo |
| `--forge-warning` (#FFB547) | Stredni heslo, neovereny email badge |
| `--forge-info` (#4DA8DA) | Dobre heslo |
| `--forge-success` (#00D4AA) | Silne heslo |
| `--forge-border-default` | Ohraniceni karet, inputu, tab bar |
| `--forge-border-highlight` | Zvyraznene ohraniceni (billing plan) |
| `--forge-gradient-brand` | Avatar gradient |
| `--forge-radius-sm/md/lg` | Zaobleni rohu |
| `--forge-font-heading` | Nadpisy, avatar text, cena tarifu |
| `--forge-font-body` | Telo textu, inputy, buttony |
| `--forge-font-tech` | Tab navigace (13px), ceny ve fakturach |

### Layout

- Max sirka: `960px`, centrovano (`margin: 0 auto`)
- Padding: `48px 16px` (horni + bocni)
- Karty: surface pozadi, 1px border, zaoblene rohy (radius-md)
- Grid: `repeat(auto-fit, minmax(260-320px, 1fr))` — responsivni 1-2 sloupce

### Animace

- **Header**: fade-in seshora (`opacity: 0, y: -20` -> `opacity: 1, y: 0`)
- **Tab bar**: fade-in zdola s 0.1s delay
- **Tab content**: AnimatePresence s `mode="wait"`, fade + posun (y: 20 -> 0 -> -10)
- **Karty**: staggered animace s 0.1s delay na index
- **Password strength bar**: animovana sirka (motion.div)

---

## 8. UI komponenty

### 8.1 Vnitrni komponenty (definovane uvnitr AccountPage)

| Komponenta | Popis | Props |
|------------|-------|-------|
| `FormInput` | Input s labelem a volitelnou ikonou | `icon, label, type, value, onChange, placeholder` |
| `Card` | Karta s header ikonou, titulem a children | `icon, title, children, index, style` |

**FormInput** — pouziva Forge inline styly. Ma focus efekt (border accent + box-shadow glow). Pokud je `icon` prop pritomen, vstup ma padding-left pro ikonu.

**Card** — wrapper s motion animaci (staggered). Header radek s ikonovou box (36x36, accent pozadi) a titulem. Body s 24px paddingem.

### 8.2 Tab navigace

4 zalozky definovane jako pole:

| ID | Label CS | Label EN | Ikona |
|----|----------|----------|-------|
| `profile` | Profil | Profile | User |
| `company` | Firma | Company | Building2 |
| `security` | Zabezpeceni | Security | Shield |
| `billing` | Fakturace | Billing | CreditCard |

Aktivni tab: accent barva + bottom border 2px. Tech font (`forge-font-tech`), 13px.

### 8.3 Button styly (definovane jako konstanty)

| Styl | Pouziti |
|------|---------|
| `forgePrimaryBtn` | Ulozit zmeny, Zmenit heslo, Zmenit tarif |
| `forgeOutlineBtn` | Zrusit |
| `forgeDangerOutlineBtn` | Zrusit predplatne |
| `forgeGhostBtn` | Zapnout 2FA |

### 8.4 Tab Profil

- Grid 2 sloupce (min 260px) — jmeno, prijmeni, email, telefon
- Spodni akce: Zrusit + Ulozit zmeny

### 8.5 Tab Firma

- 2 karty v gridu (min 320px): Zakladni udaje + Adresa
- Zakladni udaje: nazev firmy, ICO/DIC (2-col grid)
- Adresa: ulice, mesto/PSC (2-col grid), zeme (select)
- Select s custom SVG sipkou (appearance: none)
- Spodni akce: Zrusit + Ulozit zmeny (grid-column: 1/-1)

### 8.6 Tab Zabezpeceni

- Karta Zmena hesla: 3 password inputy + strength indikator
- Karta 2FA: popis + ghost button "Zapnout 2FA"
- Karta Aktivni relace: popis + mock session (Windows PC - Chrome, Praha)
- Password strength: 4 urovne (Slabe/Stredni/Dobre/Silne) — barevny bar + text

### 8.7 Tab Fakturace

- Karta Fakturace: aktualni tarif (Professional, 1299 Kc/mesic, ACTIVE badge) + platebni metoda (Visa 4242)
- Tlacitka: Zmenit tarif + Zrusit predplatne
- Pridat platebni metodu: dashed border button
- Karta Historie faktur: 3 mock faktury (#2024001-3, rijen-prosinec 2024)
- Download PDF ikona u kazde faktury

---

## 9. State management a data flow

### State (vse lokalni useState)

| State | Typ | Ucel |
|-------|-----|------|
| `activeTab` | string | Aktualne zvolena zalozka (`'profile'`) |
| `profileData` | object | Formularova data profilu + firmy |
| `passwordData` | object | 3 pole pro zmenu hesla |

### Handlery

| Handler | Popis |
|---------|-------|
| `handleProfileChange(field, value)` | Aktualizuje `profileData[field]` |
| `handlePasswordChange(field, value)` | Aktualizuje `passwordData[field]` |
| `handleSaveProfile()` | `console.log` + `alert()` — NENI implementovano |
| `handleChangePassword()` | Kontrola shody hesel, `alert()` + reset stavu — NENI implementovano |
| `getPasswordStrength(password)` | Vypocet sily hesla (delka 8+, velke pismeno, cislo, specialni znak) |

### Data flow

```
useState (mock data)
    |
    v
handleProfileChange / handlePasswordChange
    |
    v
setProfileData / setPasswordData (lokalni state update)
    |
    v
Re-render formulare s novymi hodnotami
    |
    v
handleSaveProfile / handleChangePassword → console.log + alert (STUB)
```

**DULEZITE:** Zadna data se neukladaji do localStorage, backendu ani Firebase. Vse je mock.

### AccountOverviewCard state (nepouzita komponenta)

| State | Typ | Ucel |
|-------|-----|------|
| `sending` | boolean | Probiha odesilani overeni emailu |
| `sent` | boolean | Overeni odeslano |
| `revoking` | boolean | Probiha odhlaseni vsech relaci |
| `message` | string/null | Zprava pro uzivatele |

---

## 10. Error handling

### Soucasny stav

Error handling je **minimalni**:

- **Zmena hesla**: kontrola `newPassword !== confirmPassword` → `alert()`. Zadna validace sily, delky, specialnich znaku.
- **Ulozeni profilu**: zadna validace — `handleSaveProfile` jen loguje a zobrazi alert.
- **Formularove validace**: NEEXISTUJI — zadne required pole, zadne format validace (email, telefon, ICO, DIC, PSC).
- **Chybove stavy UI**: NEEXISTUJI — zadne cervene bordery, chybove hlasky pod inputy.

### AccountOverviewCard (nepouzita)

- try/catch kolem `sendEmailVerification` a `revokeUserTokens`
- Chybove zpravy se ukladaji do `message` stavu
- Disabled stav tlacitek behem async operaci

---

## 11. Preklady (i18n)

### Mechanismus

Preklady jsou reseny **inline v komponente** pres lokalni `t` objekt (cca 40 klicu). NEPOUZIVA centralni LanguageContext prekladovy slovnik (krome `language` hodnoty).

### Pokryti

| Oblast | CS | EN | Poznamka |
|--------|----|----|----------|
| Titulek stranky | Nastaveni uctu | Account Settings | OK |
| Tab labels | Ano | Ano | OK |
| Formularove labels | Ano | Ano | OK |
| Billing sekce | Ano | Ano | OK |
| Security sekce | Ano | Ano | OK |
| Select options (zeme) | Hardcoded CS | Hardcoded CS | **BUG** — neprelozeno do EN |
| Session lokace | Praha, Ceska republika | Prague, Czech Republic | OK |
| Faktura mesice | Ano | Ano | OK |
| ACTIVE badge | Hardcoded EN | Hardcoded EN | **BUG** — neprelozeno do CS |
| Visa text | Ano | Ano | OK |
| Edit button | Ano | Ano | OK |

### LanguageContext integrace

V centralnim `LanguageContext.jsx` existuje pouze 1 relevantni klic:
- `nav.account`: "Ucet" (CS) / "Account" (EN)

Vsechny ostatni preklady jsou v lokalnim `t` objektu na strance.

### AccountOverviewCard preklady

**BUG**: Veskere texty jsou **hardcoded v cestine** bez i18n:
- "Uzivatel", "E-mail overen", "E-mail neoveren"
- "Odesilam...", "Odeslano", "Poslat overovaci e-mail"
- "Upravit profil", "Zmenit heslo", "Odhlasit na vsech zarizenich"
- Chybove zpravy v catch blocich

---

## 12. Pristupnost

### Soucasny stav

| Kriteriun | Stav | Detail |
|-----------|------|--------|
| Semanticke HTML | **Castecne** | `<h1>` pro titulek, `<h3>` v kartach, ale `<label>` neni propojen s inputem (`htmlFor` chybi) |
| ARIA atributy | **Chybi** | Zadne `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` na tab navigaci |
| Keyboard navigace | **Castecne** | Buttony a inputy jsou nativni (focusable), ale taby nemaji arrow key navigaci |
| Focus indicatory | **Custom** | Input ma custom focus (border accent + glow), ale tab buttony nemaji viditelny focus ring |
| Error hlaseni | **Chybi** | Zadne `aria-invalid`, `aria-describedby`, `role="alert"` pro chybove stavy |
| Skip navigation | **Chybi** | Zadny skip link |
| Kontrast | **OK** | Forge tokeny splnuji WCAG AA (text-muted 4.7:1 na void) |
| Screen reader | **Nedostatecne** | Download PDF button nema `aria-label`, tab panel nema `aria-labelledby` |

### Konkretni nedostatky

1. **Tab navigace nema ARIA role.** Tab buttony jsou `<button>` bez `role="tab"`, `aria-selected`, `aria-controls`. Neexistuje `role="tabpanel"` na obsahu.
2. **Labels nejsou propojene s inputy.** `<label>` existuje vizualne, ale chybi `htmlFor` a `id` na inputu.
3. **Password visibility toggle chybi.** Uzivatel nemuze prepnout zobrazeni hesla.
4. **Download PDF button nema textovy label.** Jen ikona bez `aria-label` nebo `title`.
5. **Avatar camera button nema label.** Jen ikona `Camera` bez pristupneho textu.

---

## 14. Bezpecnost

### Soucasny stav

| Polozka | Stav | Poznamka |
|---------|------|----------|
| Autentizace | **Vypnuta** | PrivateRoute zakomentovana v Routes.jsx (radky 86-88) |
| Password handling | **Nebezpecne** | Hesla v plain text useState, logovana do console (`console.log('Changing password')`) |
| Data ukladani | **Mock** | Zadna data se neukladaji — ale pri budouci implementaci bude treba zabezpecit |
| XSS | **Nizke riziko** | React escapuje JSX automaticky; zadne `dangerouslySetInnerHTML` |
| CSRF | **N/A** | Zadne HTTP pozadavky z teto stranky |
| 2FA | **Nefunkcni** | Tlacitko "Zapnout 2FA" nema handler (nic se nestane po kliknuti) |
| Session revoke | **Jen v AccountOverviewCard** | Pouziva Firebase Cloud Function `revokeUserTokens` — ale tato komponenta neni integrovana |

### Doporuceni

1. **Odkomentovat PrivateRoute** pred produkci
2. **Nelogovat password data** do console
3. **Implementovat HTTPS-only komunikaci** pro password change
4. **Pridat rate limiting** na zmenu hesla
5. **Pridat CAPTCHA** nebo throttling proti brute force

---

## 16. Souvisejici dokumenty

| Dokument | Cesta / odkaz |
|----------|---------------|
| Routes.jsx | `Model_Pricer-V2-main/src/Routes.jsx` (radek 87) |
| LanguageContext | `Model_Pricer-V2-main/src/contexts/LanguageContext.jsx` |
| Forge tokens | `Model_Pricer-V2-main/src/styles/forge-tokens.css` |
| AppIcon | `Model_Pricer-V2-main/src/components/AppIcon.jsx` |
| Firebase config | `Model_Pricer-V2-main/src/firebase.js` |
| Error Log | `docs/claude/Error_Log.md` |
| Design Error Log | `docs/claude/Design-Error_LOG.md` |

---

## 17. Zname omezeni

### Kriticke (P0)

1. **Zadna perzistence dat.** Vsechna data jsou mock useState — pri refreshi stranky se vrati na default. Neni napojeno na backend, localStorage ani Firebase.
2. **PrivateRoute je vypnuta.** Stranka je pristupna bez prihlaseni — v produkci musi byt ochranena.
3. **Hesla se loguji do console.** `handleSaveProfile` loguje cely `profileData` objekt. `handleChangePassword` loguje "Changing password" (bez dat, ale stale zbytecny log).

### Vysoke (P1)

4. **AccountOverviewCard neni integrovana.** Existuje plne funkcni komponenta s Firebase Auth integraci, ale neni pouzita v index.jsx.
5. **Zadna formularova validace.** Email, telefon, ICO, DIC, PSC — zadny regex, zadna schema validace.
6. **Select zemi je hardcoded.** Jen 5 zemi, bez moznosti rozsireni z konfigurace.
7. **Billing sekce je kompletni mock.** Cena 1,299 Kc/mesic, Visa 4242, 3 faktury — nic z toho neni realne.
8. **2FA button nema handler.** Kliknuti na "Zapnout 2FA" nedela nic.

### Stredni (P2)

9. **Preklady nejsou centralizovane.** Lokalni `t` objekt misto centralni i18n. Nektere texty hardcoded (select zemi = jen CS, ACTIVE badge = jen EN).
10. **AccountOverviewCard ma hardcoded CZ texty.** Zadna podpora pro EN.
11. **Tab navigace nema ARIA role.** Neni pristupna pro screen readery.
12. **Labels nejsou propojene s inputy.** Chybi `htmlFor` + `id`.
13. **FormInput a Card jsou definovane uvnitr komponenty.** Pri kazdem renderru se vytvari nova reference — neefektivni. Melo by se extrahovat ven.
14. **Cena tarifu (1,299 Kc) neodpovida cenikove strance.** Cenik uvadi Professional za 1,999 Kc/$80.
15. **Faktura expirace karty 12/2025.** V mock datech je expiry datum v minulosti (aktualni datum je 02/2026).

---

## Nalezene chyby — souhrn

| # | Typ | Popis | Kde |
|---|-----|-------|-----|
| A1 | i18n | Select zemi hardcoded jen v cestine | index.jsx:615-619 |
| A2 | i18n | ACTIVE badge hardcoded jen v anglictine | index.jsx:826 |
| A3 | i18n | AccountOverviewCard vsechny texty jen CS | AccountOverviewCard.jsx (cele) |
| A4 | a11y | Tab navigace bez ARIA roles | index.jsx:447-476 |
| A5 | a11y | Labels bez htmlFor/id propojeni | index.jsx:301-336 (FormInput) |
| A6 | a11y | Download button bez aria-label | index.jsx:1001-1021 |
| A7 | a11y | Camera button bez aria-label | index.jsx:393-410 |
| A8 | security | PrivateRoute vypnuta | Routes.jsx:86-88 |
| A9 | security | console.log s profilovymi daty | index.jsx:201 |
| A10 | data | Mock data bez perzistence | index.jsx:172-184 |
| A11 | design | Cena tarifu (1299) neodpovida ceniku (1999) | index.jsx:835-836 |
| A12 | design | Expirace karty v minulosti (12/2025) | index.jsx:894 |
| A13 | perf | FormInput/Card definovane uvnitr komponenty | index.jsx:301, 340 |
| A14 | integration | AccountOverviewCard nepouzita | components/AccountOverviewCard.jsx |
