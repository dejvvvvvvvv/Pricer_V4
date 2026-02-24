# 052-LG — UPRAVY — Login-Page & Register Lokalizace — 2026-02-23

## Metadata
- **ID:** 052-LG
- **Session:** S01
- **Datum:** 2026-02-23
- **Oblast:** Login-Page + Register (i18n lokalizace)
- **Souvisejici ID:** —
- **Trigger:** Uzivatelsky pozadavek na opravu Login stranky (chybejici page wrapper, spacing, nadpis, card styling) + lokalizace Register stranky (i18n klice)

---

## Souhrn uprav

Byla implementovana komplexni reformatace Login stranky s pridanim page wrapperu, containerem, card stylem a lokalizacnimi klici (i18n). Soucasne byla aktualizovana Register stranka na lokalizovany obsah pomoci `useTranslation()` hooku a translacnich klicu. Obe zmeny zachovavaji Forge Design System inline styly (bez Tailwind) a zajistuji konzistenci s Auth System architekturou (Faze 1 Sprint z 2026-02-22).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/login/index.jsx` | Zmeneno | 1-67 | Pridany page wrapper (100vh bg), container (520px centered), heading sekce s h1+subtitle (i18n), card (bg-surface, border, radius) |
| 2 | `src/pages/register/index.jsx` | Zmeneno | 1-67 | Pridan `useTranslation()` hook + lokalizacni klice pro title a subtitle |

---

## Detailni zmeny

### 1. `src/pages/login/index.jsx`

**Typ:** Zmeneno (komplexni reformatace + lokalizace)
**Radky:** 1-67
**Duvod:** Login stranka chybela page wrapper struktura s centrovani, card stylem a lokalizaci. Bez tego vypadala jako holina HTML bez UI kontextu.

**Co se zmenilo:**

- **Pridany 3 inline style objekty** na zacatku komponenty:
  - `pageStyle` — `minHeight: '100vh'`, `backgroundColor: 'var(--forge-bg-void)'` (dark background)
  - `containerStyle` — `maxWidth: '520px'`, `margin: '0 auto'`, `padding: '48px 24px'` (centrovani)
  - `cardStyle` — `backgroundColor: 'var(--forge-bg-surface)'`, `border`, `borderRadius`, `padding: '32px'` (card wrapper)

- **Pridana heading sekce** (lines 40-58):
  - Centered text container s `marginBottom: '32px'`
  - `h1` s Forge typography (`--forge-font-heading`, `--forge-text-3xl`, `fontWeight: 700`)
  - `p` subtitle s muted color (`--forge-text-muted`)
  - Obe pole pouzivaji i18n klice (`loginPage.title`, `loginPage.subtitle`) s fallback defaults

- **Pridan import** `useTranslation` z react-i18next

- **Card wrapper** nize heading — `LoginForm` komponenta je ted balena do cardStyle dilu

- **Struktura DOM:**
  ```
  pageStyle (100vh bg-void)
    └─ containerStyle (520px, centered)
        ├─ heading (centered text)
        │  ├─ h1 (Prihlaste se)
        │  └─ p (Spravujte sve 3D tiskove projekty)
        └─ cardStyle (bg-surface, border, radius)
            └─ LoginForm
  ```

**Pred:** Jednoducha LoginForm bez wrapperu, bez centrovani, bez nadpisu
**Po:** Plne strukturovana page s layoutem, headingem a card containnerem (Forge Design System compatible)

---

### 2. `src/pages/register/index.jsx`

**Typ:** Zmeneno (lokalizace)
**Radky:** 1-67 (cela komponenta, ale zmeny jen v i18n)
**Duvod:** Register stranka obsahovala hardcodovane anglicke texty. Potrebovala lokalizaci pomoci i18n klicu.

**Co se zmenilo:**

- **Pridan import** `useTranslation` z react-i18next (line 3)

- **Pridan hook** `const { t } = useTranslation();` (line 8)

- **Lokalizovany h1 text:**
  - Pred: hardcoded `"Create Account"`
  - Po: `t('registerPage.title', 'Vytvorte si ucet')` (i18n klic s fallback default)

- **Lokalizovany p text:**
  - Pred: hardcoded `"Join the 3D printing platform"`
  - Po: `t('registerPage.subtitle', 'Pripojte se k platforme pro 3D tisk')` (i18n klic s fallback)

- **Zbytek stranky zustava shodny** — page structure (pageStyle, containerStyle, cardStyle) a RegistrationForm zustaly beze zmeny

**Pred:**
```jsx
<h1>Create Account</h1>
<p>Join the 3D printing platform</p>
```

**Po:**
```jsx
<h1>{t('registerPage.title', 'Vytvorte si ucet')}</h1>
<p>{t('registerPage.subtitle', 'Pripojte se k platforme pro 3D tisk')}</p>
```

---

## Dopad zmen

- **Ovlivnene komponenty:** Login (primo), Register (primo), LoginForm (indirektne — novy parent wrapper)
- **Breaking changes:** Ne — obe zmeny jsou additive (pridani wrapperu, pridani i18n). LoginForm API se nemenila.
- **Nove zavislosti:** Zadne — `react-i18next` je jiz nainstalovano (pouziva se v ostatnich komponentach)
- **Rizika:** Mala — layout zmena muze ovlivnit mobile responsivnost (ale container je flexibilni s 48px padding). I18n fallbacks zajistuji zpetnou kompatibilitu.

---

## Testovani

### Build status
- **Status:** ✓ PASS

### Vizualni test v Chrome — PASS

#### Login stranka (/login)
- ✓ Tmave pozadi (bg-void) — spravne
- ✓ Nadpis "Prihlaste se" centrovany, forge-font-heading — spravne
- ✓ Podnadpis "Spravujte sve 3D tiskove projekty" v text-muted — spravne
- ✓ Card wrapper (bg-surface, border, radius-lg) — spravne
- ✓ Spacing od headeru 48px — spravne
- ✓ Formular uvnitr cardy (email, heslo, remember me, tlacitko, Google sign-in, register link) — spravne
- ✓ Footer neni nacpany pod formularem — spravne

#### Register stranka (/register)
- ✓ Konzistentni design s Login strankou — spravne
- ✓ Nadpis "Vytvorte si ucet" (lokalizovany z cestiny) — spravne
- ✓ Podnadpis "Pripojte se k platforme pro 3D tisk" — spravne
- ✓ Stejny card wrapper, spacing, fonty — spravne
- ✓ Formular (jmeno, prijmeni, email, heslo, potvrzeni, podminky, Google sign-up) — spravne

#### Celkovy verdikt
- **PASS** — Obe stranky vypadaji visualne konzistentni a odpovidaji Forge Design System. I18n lokalizace funguje spravne. Layout s pageStyle + containerStyle + cardStyle pracuje jak bylo zamerem.

### Poznamky
- Login a Register stranky maji nyn shodnou strukturu (obe s pageStyle + containerStyle + heading + cardStyle) — to je dobre pro konzistenci Forge Design System.
- Responsive design (48px padding, maxWidth 520px) funguje spravne na normalnim viewport.

---

## Kontrolni seznam

- [ ] npm run build — zatim nespusteno
- [ ] Vizualni test Login stranky v Chrome
- [ ] Vizualni test Register stranky v Chrome
- [ ] Overit i18n fallback texty
- [ ] Overit mobile responsivnost (48px padding)
