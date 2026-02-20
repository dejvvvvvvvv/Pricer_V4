# 24. Verejne stranky (Home, Pricing, Support) — Detailni RoadMap Plan

> **Stav:** 🟢 85% hotovo | **Priorita:** NIZKA
> **Zavislosti na jine sekce:** ZADNE
> **Kdo na nem zavisi:** Nikdo primo

---

## Prehled

Verejne stranky projektu — landing page, cenova stranka a podpora. Pouzivaji Forge Design System s dark theme.

**Hlavni soubory:**
- `src/pages/home/` — Home/Landing page
- `src/pages/pricing/` — Cenove plany
- `src/pages/support/` — Podpora + FAQ
- `src/pages/login/` — Prihlaseni
- `src/pages/register/` — Registrace
- `src/components/Header.jsx` — Sdileny header
- `src/components/Footer.jsx` — Sdileny footer

---

## Co je HOTOVO (✅)

### Home stranka (90%)
- [x] Forge dark theme design
- [x] Hero sekce (55/45 layout, ne genericka AI)
- [x] Features sekce s cislovanyma sekcemi
- [x] CTA (Call to Action) tlacitka
- [x] Version badge
- [x] Teal + orange akcenty (anti-AI-generic)
- [x] Responsivni layout

### Pricing stranka (88%)
- [x] 3 plany: Starter (499 Kc/$20), Professional (1999 Kc/$80), Enterprise (custom)
- [x] CZ/EN prepinani cen
- [x] Feature comparison tabulka
- [x] CTA tlacitka

### Support stranka (85%)
- [x] Kontaktni formular
- [x] FAQ sekce
- [x] Forge design

### Login/Register (85%)
- [x] Firebase Auth integrace
- [x] Login formular
- [x] Register formular
- [x] Forge dark theme styling

### Header/Footer (90%)
- [x] Forge dark theme
- [x] Sdileny mezi public a admin
- [x] Logo s `mix-blend-mode: lighten`
- [x] Navigace s aktivnim stavem

---

## Co CHYBI / je potreba dodelat

### Faze 1: SEO zaklady (Priorita: NIZKA, pro Beta staci)

#### Ukol 1.1: Open Graph meta tagy
- **Soubory:** `index.html` (root) + `public/index.html`
- **DULEZITE:** DVA index.html soubory — OBA musi byt synchronizovany!
- **Co udelat:**
  - [ ] Pridat `og:title`, `og:description`, `og:image`, `og:url`
  - [ ] Pridat Twitter Card meta tagy
  - [ ] Pridat favicon v ruznych velikostech (16x16, 32x32, apple-touch-icon)
  - [ ] Pridat `manifest.json` s ikonami
- **Poznamka:** Pro Beta staci zakladni meta tagy. Plne SEO az po spusteni.

#### Ukol 1.2: Structured data (post-Beta)
- **Co udelat:**
  - [ ] JSON-LD pro Organization
  - [ ] JSON-LD pro Product (SaaS)
  - [ ] Sitemap.xml
  - [ ] robots.txt
- **Poznamka:** Toto je ciste post-Beta

### Faze 2: Drobna responsivita (Priorita: NIZKA)

#### Ukol 2.1: Mobile opravy
- **Co udelat:**
  - [ ] Otestovat vsechny stranky na mobilnim zarizeni
  - [ ] Opravit pripadne preteceni textu
  - [ ] Overit ze hamburger menu funguje spravne
  - [ ] Overit pricing tabulka na mobilu (horizontalni scroll nebo stackovani)

### Faze 3: Obsahove zmeny (Priorita: STREDNI, pred spustenim)

#### Ukol 3.1: Aktualizace obsahu pred launchem
- **Co udelat:**
  - [ ] Finalni texty na Home page (value proposition, features)
  - [ ] Aktualizace cen na Pricing page (pokud se zmeni)
  - [ ] Aktualizace FAQ na Support page
  - [ ] Kontaktni udaje (email, telefon)
  - [ ] Legal stranky (ToS, Privacy Policy) — viz poznamka o reklamacich v RoadMap
- **Poznamka:** Obsah se bude menit az pri finalnim launchi

---

## Implementacni poradi

1. **Faze 1** (SEO) — 1-2 hodiny, kdykoli
2. **Faze 2** (Responsivita) — 1-2 hodiny, kdykoli
3. **Faze 3** (Obsah) — pred spustenim

**Celkem pro Beta:** ~2-4 hodiny

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `index.html` (root) | Meta tagy | Maly |
| `public/index.html` | Meta tagy (synchronizovat!) | Maly |
| `src/pages/home/` | Pripadne obsahove zmeny | Maly |
| `src/pages/pricing/` | Pripadne cenove zmeny | Maly |
| `src/pages/support/` | FAQ aktualizace | Maly |

---

## Poznamky

- **DULEZITE:** DVA index.html soubory! Root (Vite) a public/ — OBA musi byt synchronizovany
- Verejne stranky jsou **prakticky hotove** pro Beta
- Forge design je uz implementovan — neprepisovat
- `--forge-font-heading` pro nadpisy, `--forge-font-tech` JEN pro male labely/ceny/kody

---

## Kriticke doplnky (z review)

### Pravni stranky (NUTNE pred launchem)
- [ ] **Obchodni podminky (Terms of Service):**
  - Definice sluzby (SaaS pro 3D tisk)
  - Ceny a platebni podminky
  - Reklamacni rad
  - Zodpovednost za nahrane modely (uzivatel vlastni prava)
  - Omezeni zodpovednosti
  - [ ] Route: `/terms`
- [ ] **Ochrana osobnich udaju (Privacy Policy):**
  - Jake data shromazdujeme (email, jmeno, nahrane modely)
  - Ucel zpracovani (plneni sluzby, analyticka)
  - Pravni zaklad (souhlas, plneni smlouvy)
  - Doba uchovavani
  - Prava subjektu dat (pristup, oprava, smazani, prenositelnost)
  - Kontakt na spravce
  - Cookies a analytika
  - [ ] Route: `/privacy`
- [ ] **Cookie Policy:**
  - Technicke cookies (nutne pro fungovan)
  - Analyticke cookies (volitelne)
  - Cookie banner s moznosti odmitnou analyticke cookies
- [ ] **GDPR compliance:** Vsechny pravni stranky MUSI byt v cestine i anglictine

### SEO checklist pred spustenim
- [ ] Title tagy na kazde strance (unikatni, < 60 znaku)
- [ ] Meta description na kazde strance (unikatni, < 160 znaku)
- [ ] Kanonicky URL (`<link rel="canonical" href="...">`)
- [ ] Alt texty na vsech obcrazcich
- [ ] Heading hierarchie (jeden H1 per strane, H2/H3 v poradi)
- [ ] `robots.txt` — povoleni pro vyhledavace, blokovani admin
- [ ] `sitemap.xml` — verejne stranky (ne admin)
- [ ] 404 stranka (custom, ne defaultni)
