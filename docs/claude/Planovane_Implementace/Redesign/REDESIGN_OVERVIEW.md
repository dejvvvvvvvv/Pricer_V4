# Redesign Overview — ModelPricer V3

> Prehledovy dokument k redesignu celeho projektu.
> Detailni specifikace viz: REDESIGN_VARIANTA_A_Industrial.md a REDESIGN_VARIANTA_B_Premium.md

---

## 1. PROC REDESIGN

### Soucasne problemy
1. **Genericke AI vypadani** — svetly theme, modra #2563EB, Inter font, symetricke layouty, sterilni bile karty
2. **Zadna vizualni identita** — web nepripomina 3D tiskove odvetvi, mohl by byt cokoliv
3. **Stejna estetika jako tisice AI-generovanych webu** — zkuseni uzivatele to poznanaji do 3 sekund
4. **Nulova osobnost** — formalni texty, genericke ikony, zadne emocialni spojeni
5. **Svetly theme** — 90% AI webu je svetlych, tmavy theme je okamzite odlisny

### Cile redesignu
1. Tmavy theme jako default — profesionalni, moderni, odlisny
2. 3D tisk vizualni identita — barvy, metafory, ikonografie z 3D tiskarenskeho sveta
3. Anti-AI estetika — 25 principu jak se vyhnout generickemu vzhledu (viz ANTI_AI_DESIGN_PRINCIPLES.md)
4. Implementovatelny design — specificke hex kody, font names, px values, ne vague popisy
5. Dva navrhy na vyber — Industrial/Technical vs Premium/Elegant

---

## 2. DVA NAVRHY

### Varianta A: "INDUSTRIAL / COMMAND CENTER"
**Filozofie:** Ridici panel 3D tiskove farmy. Precizni, technicky, jako cockpit nebo laboratorni software.
**Inspirace:** SpaceX ridici centra, PrusaSlicer UI, terminaly, blueprint vykressy.
**Klicove znaky:**
- Monospace headings (JetBrains Mono)
- Blueprint grid patterns v pozadi
- Nozzle Orange (#FF6B35) + Filament Teal (#00D4AA)
- Thin-line estetika (1px bordery)
- Uppercase labels s letter-spacing
- Technicke diagramove prvky

### Varianta B: "PREMIUM / DESIGN STUDIO"
**Filozofie:** High-end designove studio. Elegantni, minimalisticke, sofistikovane.
**Inspirace:** Apple produktove stranky, Linear, Vercel, Raycast.
**Klicove znaky:**
- Serif headings (Instrument Serif)
- Velke border-radius (16-20px)
- Warm Amber (#F59E0B) + Cool Violet (#8B5CF6)
- Velkorysé spacing a padding
- Spring-like animace
- Zinc color scale pro neutraly

---

## 3. POROVNANI VARIANT

| Aspekt | Varianta A: Industrial | Varianta B: Premium |
|--------|----------------------|---------------------|
| **Celkovy dojem** | Technicky, precizni, "cockpit" | Elegantni, premium, "studio" |
| **Heading font** | JetBrains Mono (monospace) | Instrument Serif (serif) |
| **Body font** | Inter | Satoshi / General Sans |
| **Primary color** | #FF6B35 (oranzova) | #F59E0B (amber) |
| **Secondary color** | #00D4AA (teal) | #8B5CF6 (violet) |
| **Background** | #08090C (temer cerna, modry podton) | #09090B (temer cerna, neutralni) |
| **Cards** | Thin border, 8px radius | Bez borderu, 16px radius, shadow |
| **Labels** | UPPERCASE 11px, letter-spacing | Normal case 12px |
| **Animace** | Kratsi (120ms micro), precizni | Delsi (150ms), spring-like |
| **Patterns** | Blueprint grid, dot grid | Subtle radial gradient |
| **3D tisk vibe** | Silny (blueprint, technicke) | Jemny (premium, sofisticky) |
| **Cilova skupina** | Technicky zdatni uzivatele, makeri | Firmy, designove studia, brand-focused |
| **Sidebar** | Kompaktni (240px), ikony + text | Prostorna (220px), velke spacing |
| **Buttons** | Male (40px md), ostre (6px radius) | Vetsi (44px md), rounded (12px) |
| **Tables** | Zebra stripes, kompaktni radky | Bez stripes, velke radky (56px) |
| **Toasts** | Levy barevny border, jemne | Rounded, shadow, jemne |

---

## 4. SPOLECNE DESIGNOVE ROZHODNUTI

Bez ohledu na zvolenou variantu:

### 4.1 Tmavy theme jako default
- Stranky se VZDY nacitaji v tmavem modu
- Svetly mod muze byt pridan pozdeji jako volba
- Widget muze mit vlastni tema (svetle/tmave) nastavitelne builderem

### 4.2 Monospace pro technicke udaje
- Ceny: `192,48 Kc` v monospace
- Rozmery: `120 x 80 x 45 mm` v monospace
- Cisla objednavek: `#MP-2024-0042` v monospace
- Procenta: `20%`, `0.2mm` v monospace
- G-code parametry v monospace

### 4.3 Barvy z 3D tisku
- Primary akcent inspirovany filamentem (oranzova/amber)
- Success = filament zelena
- Error = tiskarna stop cervena
- Background = tmava komora tiskarny
- Gradienty = rozehavena tryska efekt

### 4.4 Responzivni pravidla
- Mobile-first pristup
- Admin sidebar → overlay drawer na < 768px
- 2-sloupcove layouty → 1 sloupec na < 768px
- Stepper horizontalni → vertikalni na < 640px
- Touch-friendly: min 44px tap target

### 4.5 Accessibility
- WCAG AA minimalne (4.5:1 kontrast pro text)
- Focus visible na vsech interaktivnich prvcich
- Keyboard navigace vsude
- `prefers-reduced-motion` respektovano
- ARIA labels na Radix komponentech
- Semantic HTML (h1-h6, nav, main, aside, footer)

### 4.6 Performance
- Fonty: `font-display: swap`, preload pro klicove fonty
- Animace: GPU-only properties (transform, opacity)
- Lazy loading obrazku a komponent
- Skeleton loading misto spinneru kde mozno

---

## 5. 3D TISK VIZUALNI IDENTITA

### Vizualni metafory
| Metafora | Kde pouzit | Jak |
|----------|-----------|-----|
| Vrstvy (layers) | Karty, elevation | Vizualni vrstveni, stacking efekt |
| Filament | Barvy, ikony | Akcenty v barvach filamentu |
| Tryska (nozzle) | CTA, loading | Glow efekt, oranzove/zlute svetlo |
| Build plate | Pozadi | Tmave rovne plochy |
| G-code | Technicke texty | Monospace, code-like zobrazeni |
| Wireframe | 3D viewer, loading | Wireframe modus modelu |
| Podpory (supports) | Pomocne prvky | Vizualni "podpora" UI elementu |

### Ikonografie
Klicove custom ikony (ne generic Lucide):
1. **Upload modelu** — 3D krychle se sipkou nahoru
2. **Material** — civka filamentu
3. **Kvalita** — vrstvy (layers stack)
4. **Tiskarna** — stylizovana FDM tiskarna
5. **Tryska** — extrusion icon s glow
6. **Build plate** — rovina s objektem
7. **Support** — podpurna struktura
8. **Slicing** — nuz/sekera rezici model
9. **Infill** — honeycomb/grid pattern
10. **Hotovo** — model s fajfkou

---

## 6. IMPLEMENTACNI STRATEGIE

### Faze implementace redesignu

**Faze R1: Design System zaklad (1-2 dny)**
- Aktualizace `tailwind.config.js` — nove barvy, fonty, spacing
- Aktualizace `src/styles/tailwind.css` — nove CSS promenne, dark theme default
- Import novych fontu v `index.html`
- Zakladni komponenty: Button, Card, Input, Label v novem designu

**Faze R2: Layout shell (1-2 dny)**
- Novy Header design
- Novy Footer design
- Novy Admin Sidebar design
- Admin Layout aktualizace

**Faze R3: Public pages (2-3 dny)**
- Home page redesign
- Login / Register redesign
- Pricing / Support redesign

**Faze R4: Kalkulacka (2-3 dny)**
- Test kalkulacka — vsech 5 kroku
- Widget kalkulacka — synchronizace s novym designem
- 3D viewer restyling

**Faze R5: Admin pages (3-5 dnu)**
- Dashboard redesign
- Pricing admin redesign
- Fees, Parameters, Presets, Orders, Widget, Analytics, Team

**Faze R6: Widget Builder (1-2 dny)**
- Aktualizace builder-tokens.css
- Synchronizace s novou paletou

---

## 7. SOUBORY K MODIFIKACI

| Soubor | Zmena |
|--------|-------|
| `tailwind.config.js` | Nova paleta, fonty, spacing, animace |
| `src/styles/tailwind.css` | Nove CSS promenne, dark theme default |
| `src/styles/index.css` | Nove font importy |
| `index.html` | Font preload, meta theme-color |
| `src/components/ui/Button.jsx` | Nove varianty, barvy, sizes |
| `src/components/ui/Card.jsx` | Novy design (border/shadow) |
| `src/components/ui/Input.jsx` | Tmave pozadi, focus barvy |
| `src/components/ui/Header.jsx` | Kompletni redesign |
| `src/components/ui/Footer.jsx` | Kompletni redesign |
| `src/components/ui/Dialog.jsx` | Tmave modaly |
| `src/components/ui/Select.jsx` | Tmave dropdown |
| `src/pages/admin/AdminLayout.jsx` | Novy sidebar |
| `src/pages/home/index.jsx` | Kompletni redesign |
| `src/pages/login/index.jsx` | Tmave, nove barvy |
| `src/pages/register/index.jsx` | Tmave, nove barvy |
| `src/pages/test-kalkulacka/index.jsx` | Tmave, nove barvy |
| `src/pages/test-kalkulacka/components/*.jsx` | Vsechny komponenty |
| `src/pages/widget-kalkulacka/index.jsx` | Theme sync |
| `src/pages/admin/*.jsx` | Vsechny admin pages |
| `src/pages/admin/builder/styles/builder-tokens.css` | Sync s novou paletou |
