# 054-LG — UPRAVY — Login-Page + Register-Page — 2026-02-23

## Metadata
- **ID:** 054-LG
- **Session:** S01
- **Datum:** 2026-02-23
- **Oblast:** Login-Page + Register-Page (design + i18n)
- **Souvisejici ID:** 053-LG, 055-LG
- **Trigger:** Oprava Login a Register stranek — Forge Design System konzistence, page wrapper, i18n lokalizace

---

## Souhrn uprav

Kompletni oprava Login stranky — pridani page wrapper struktura (minHeight 100vh, backgroundColor, container, heading, card wrapper). Lokalizace Register stranky — pridani react-i18next pro nadpis a podnadpis. Aktualizace dokumentace (Login-Dokumentace.md, Register-Dokumentace.md) s novymi sekcemi o page wrapperu, i18n, Forge compliance. Build PASS.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/login/index.jsx` | Zmeneno (kompletni prepis) | 1-67 | Page wrapper struktura, i18n, Forge styling |
| 2 | `src/pages/register/index.jsx` | Zmeneno | 3, 8, 46, 54 | Pridani useTranslation hook, i18n klice v nadpisech |
| 3 | `docs/claude/Documentation/Login-Dokumentace.md` | Zmeneno (9 sekci) | 4, 5.0, 5.4, 8.1, 11.1-11.5, 18 | Page wrapper, Forge compliance, i18n klice, posledni update |
| 4 | `docs/claude/Documentation/Register-Dokumentace.md` | Zmeneno (6 sekci) | 2, 4, 11.1, 11.2, 11.4, datum | react-i18next integraci, Forge compliance, i18n klice |

---

## Detailni zmeny

### 1. `src/pages/login/index.jsx`

**Typ:** Zmeneno (kompletni prepis)
**Radky:** 1-67 (cely soubor)
**Duvod:** Aby Login stranka odpovídala Forge Design System standardum a byla vizuálne konzistentní s ostatními stránkami (Register, Admin).

**Co se zmenilo:**
- Puvodni stav: Jedina polozka v komponentě — `<LoginForm redirectTo={from} />`
- Novy stav: Kompletni page wrapper struktura se 4 vrstvami (page, container, heading section, card)
- **Vrstva 1 (pageStyle):** minHeight 100vh, backgroundColor var(--forge-bg-void), color var(--forge-text-primary)
- **Vrstva 2 (containerStyle):** maxWidth 520px, margin 0 auto, padding 48px 24px
- **Vrstva 3 (heading):** h1 s nadpisem, podnadpis s muted barvou
- **Vrstva 4 (cardStyle):** backgroundColor var(--forge-bg-surface), border 1px solid var(--forge-border-default), borderRadius var(--forge-radius-lg), padding 32px
- Pridan import `useTranslation` z react-i18next
- Pridan hook `const { t } = useTranslation()`
- i18n klice: `loginPage.title` (fallback "Prihlaste se"), `loginPage.subtitle` (fallback "Spravujte sve 3D tiskove projekty")
- Vsechny styly jsou inline (zadny Tailwind), shodne s Register strankou

**Fragment kodu:**
```jsx
// PRED:
export default function LoginPage() {
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  return <LoginForm redirectTo={from} />;
}

// PO:
const pageStyle = { minHeight: '100vh', backgroundColor: 'var(--forge-bg-void)', color: 'var(--forge-text-primary)' };
const containerStyle = { maxWidth: '520px', margin: '0 auto', padding: '48px 24px' };
const cardStyle = { backgroundColor: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)', borderRadius: 'var(--forge-radius-lg)', padding: '32px' };

export default function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1>{t('loginPage.title', 'Prihlaste se')}</h1>
        <p style={{ color: 'var(--forge-text-muted)' }}>{t('loginPage.subtitle', '...')}</p>
        <div style={cardStyle}>
          <LoginForm redirectTo={from} />
        </div>
      </div>
    </div>
  );
}
```

---

### 2. `src/pages/register/index.jsx`

**Typ:** Zmeneno (lokalizace)
**Radky:** 3, 8, 46, 54
**Duvod:** Aby Register stranka pouzivala react-i18next pro lokalizace nadpisu a podnadpisu, konzistentne s Login strankou.

**Co se zmenilo:**
- Radek 3: Pridan import `import { useTranslation } from 'react-i18next';`
- Radek 8: Pridan hook `const { t } = useTranslation();`
- Radek 46: "Create Account" nahrazeno za `{t('registerPage.title', 'Vytvorte si ucet')}`
- Radek 54: "Join the 3D printing platform" nahrazeno za `{t('registerPage.subtitle', 'Pripojte se k platforme pro 3D tisk')}`
- Zbytek komponenty bez zmen

**Fragment kodu:**
```jsx
// PRED (radky 46, 54):
<h1>Create Account</h1>
<p>Join the 3D printing platform</p>

// PO:
<h1>{t('registerPage.title', 'Vytvorte si ucet')}</h1>
<p>{t('registerPage.subtitle', 'Pripojte se k platforme pro 3D tisk')}</p>
```

---

### 3. `docs/claude/Documentation/Login-Dokumentace.md`

**Typ:** Zmeneno (9 sekci aktualizo)
**Radky:** 4, 5.0, 5.4, 8.1, 11.1-11.5, 18
**Duvod:** Dokumentovat novy page wrapper design, Forge compliance, i18n integraci, aktualizovat datum posledni zmeny.

**Co se zmenilo:**
- **Sekce 4 (Import graf):** Pridan import ukazatel `react-i18next --> useTranslation` do index.jsx
- **Sekce 5.0 (NOVA):** "Page wrapper" — tabulka vsech vrstev (page, container, heading, h1, podnadpis, card) s CSS vlastnostmi
- **Sekce 5.4 (Forge compliance):** Prepsan — odebrane "potencialni problemy" (vsechny vyreseny), pridany page wrapper tokeny (--forge-bg-void, --forge-bg-surface, atd.)
- **Sekce 8.1:** Kompletne prepsan — zmena z "Struktura: LoginForm primo" na "Page wrapper + vstupni kontejner" s ASCII diagramem a i18n klici
- **Sekce 11.1:** Aktualizovana — z "Nema" na "react-i18next" (useTranslation hook)
- **Sekce 11.2 (NOVA):** "Prekladove klice stranky" — tabulka (loginPage.title, loginPage.subtitle)
- **Sekce 11.3 (NOVA):** "Prekladove klice formulare" (puvodni 11.2, jen preposloupano)
- **Sekce 11.4, 11.5:** Precisleny (puvodni 11.3, 11.4)
- **Sekce 18 (Posledni zmena):** Datum zmeněn na 2026-02-23, novy popis: "Page wrapper struktura, i18n integrace, Forge compliance"

---

### 4. `docs/claude/Documentation/Register-Dokumentace.md`

**Typ:** Zmeneno (6 sekci aktualizovano)
**Radky:** 2 (jazykove), 4 (import graf), 11.1, 11.2, 11.4, datum
**Duvod:** Dokumentovat i18n integraci, aktualizovat stav jazykoveho systemu (uz neni problem), aktualizovat datum.

**Co se zmenilo:**
- **Sekce 2 (Technologie - Jazykove poznamky):** Prepsan — z "Nema react-i18next" na "Obe komponenty (Login i Register) pouzivaji react-i18next s useTranslation hook"
- **Sekce 4 (Import graf):** Pridan import ukazatel `react-i18next --> useTranslation` do index.jsx
- **Sekce 11.1:** index.jsx zmenen z "ZADNY" na "react-i18next"
- **Sekce 11.2:** Prepsan z "Hardcoded texty: Create Account, Join the 3D..." na "Prekladove klice v index.jsx: registerPage.title, registerPage.subtitle" s tabulkou
- **Sekce 11.4:** Prepsan z "Kriticky problem: Dva nezavisle jazykove systemy" na "Jazykovy system: React-i18next" — problem vyreseny
- **Datum (konec dokumentu):** Aktualizovan na 2026-02-23

---

## Dopad zmen

- **Ovlivnene komponenty:** `LoginForm`, `RegistrationForm` (oba jsou nyni zabaleny v page wrapperu)
- **Breaking changes:** Ne — zpetna kompatibilita zachovana, login/register funkce nedotcena
- **Nove zavislosti:** react-i18next (uz byl zavislost projektu)
- **Rizika:** Zadna — inline styly a i18n kody jsou bezpecne

---

## Testovani

- **Build:** `npm run build` — PASS, 0 errors, 3019 modulu, build cas ~1 min (warning chunk > 2000kB je existujici problem)
- **Manual test:** Chrome MCP — Login a Register stranky otestovany, design konzistentni, i18n klice fungujici (fallback texty zobrazeny)
  - Login: Nadpis "Prihlaste se", podnadpis "Spravujte sve 3D tiskove projekty", card OK
  - Register: Nadpis "Vytvorte si ucet", podnadpis "Pripojte se k platforme pro 3D tisk", card OK
- **Poznamky:** Obe stranky nyní odpovídají Forge Design System standardum a jsou vizuálně konzistentní s administracními stránkami

---

<!-- KONEC SABLONY -->
