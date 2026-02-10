# SYSTEM_MAP - Prehled zmen v systemu

> Zjednoduseny prehled implementovanych zmen. Datum posledni aktualizace: 2026-02-10.

---

## Zmeny 2026-02-10: Material Dialog + Per-Color Pricing + Preset-Material Linking

### Co se zmenilo

Tri soubory byly upraveny paralelne:

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/admin/AdminPricing.jsx` | UI redesign + nova funkcionalita | Velky |
| `src/pages/admin/AdminPresets.jsx` | Nova funkcionalita | Stredni |
| `src/utils/adminPricingStorage.js` | Datovy model rozsiren | Maly |

---

### 1. AdminPricing.jsx - Materialy predelany na kompaktni karty + dialog

**Pred zmenou:** Materialy se editovaly primo na strance v roztazenych kartach. Barvy se zobrazovaly spatne, color pickery zabiraly moc mista.

**Po zmene:**

#### Kompaktni prehledove karty (3 na radek)
- Grid `repeat(3, 1fr)`, responzivni (2 na 900px, 1 na 560px)
- Kazda karta zobrazuje: nazev, klic (slug), badges, cenu, barevne chipsy
- Badges: Vychozi / Aktivni / Neaktivni / Chyba
- Barevne chipsy: maly 10x10 ctverecek + nazev barvy + pripadna vlastni cena
- Max 6 barev zobrazeno, zbytek jako "+N"
- Kliknuti na kartu = otevre edit dialog

#### Vyskakovaci okno (ForgeDialog)
- Sirka: `50vw` (50% viewportu), vycentrovane
- Titulek = nazev materialu
- Telo dialogu:
  - Nazev materialu (input)
  - Klic / slug (input, auto-generovany z nazvu)
  - Aktivni (checkbox)
  - Vychozi cena za gram (number input, Kc/g)
  - Sekce barev: nazev, color picker, hex, **vlastni cena za gram**, smazat
  - Formular pro pridani nove barvy
- Footer: Zrusit (zahodí zmeny) / Ulozit zmeny (zapise do stavu)
- Pridani noveho materialu automaticky otevre dialog

#### Per-color pricing (nova funkcionalita)
- Kazda barva materialu ma volitelne pole `price_per_gram`
- `null` = pouzije se vychozi cena materialu
- Cislo = specificka cena pro danou barvu (napr. cerveny PLA = 4.5 Kc/g, modry PLA = 4.3 Kc/g)
- V dialogu: number input s placeholder zobrazujicim default cenu
- V kompaktnich kartach: barvy s vlastni cenou zobrazuji cenu vedle nazvu

#### Technicke detaily
- Novy stav: `editingMaterialIndex`, `dialogDraft`
- Dialog pracuje s deep copy materialu (zmeny lze zahodit)
- `DialogAddColor` - vnitrni komponenta pro pridani barvy
- `price_per_gram` zachovano ve 3 normalizacnich cestach: `currentConfigFull`, `handleImport`, `normalizeLoadedConfig`
- Import: `ForgeDialog` z `../../components/ui/forge/ForgeDialog`

---

### 2. AdminPresets.jsx - Propojeni presetu s materialy

**Pred zmenou:** Presety (.ini soubory pro PrusaSlicer) nemely zadnou vazbu na materialy. Nebylo mozne urcit ktery preset patri ke kteremu materialu.

**Po zmene:**

#### Nova funkcionalita
- Kazdy preset ma volitelne pole `material_key` (null = vsechny materialy)
- Materialy se nacitaji z `loadPricingConfigV3()` pri loadu stranky
- Jen aktivni materialy s platnym klicem a nazvem se zobrazuji v dropdownu

#### UI zmeny
- **Upload formular**: novy dropdown "Material" pro prirazeni presetu k materialu
- **Tabulka presetu**: novy sloupec "Material" s inline editaci (dropdown)
- **Badge**: u presetu s prirazenym materialem se zobrazuje modry badge s nazvem materialu
- **CSS grid**: upload grid rozsiren z 5 na 6 sloupcu

#### Datovy model
- `normalizePreset()` rozsiren o `material_key`
- `isDirty()` porovnava i `material_key`
- `onSave()` uklada `material_key` (offline i online)
- Edit state sync zahrnuje `material_key`

---

### 3. adminPricingStorage.js - Datovy model pro per-color pricing

**Pred zmenou:** Barvy materialu mely jen `id`, `name`, `hex`.

**Po zmene:**

#### Rozsireny datovy model barvy
```
{
  id: 'clr-xxx',
  name: 'Red',
  hex: '#FF0000',
  price_per_gram: null  // null = default materialu, cislo = override
}
```

#### Zmeny v normalizaci
- `normalizePricingConfigV3()` - barvy se normalizuji s `price_per_gram`
- `normalizePricingConfigForEngine()` - totez
- Default material (PLA) ma barvu White s `price_per_gram: null`

#### Novy helper
```javascript
export function getColorEffectivePrice(material, colorId)
```
- Vraci efektivni cenu za gram pro konkretni barvu
- Pokud barva ma override → vrati override
- Pokud ne → vrati `material.price_per_gram`
- Graceful fallback na 0 pri chybejicich datech

#### Zpetna kompatibilita
- Existujici data bez `price_per_gram` funguji beze zmen (null = default)
- Celkova struktura configu se nezmenila

---

## Architektura po zmenach

```
AdminPricing.jsx
  |-- Kompaktni karty (prehled)
  |-- ForgeDialog (editace materialu)
  |     |-- Nazev, klic, aktivni, cena
  |     |-- Barvy s per-color pricing
  |     |-- Save/Cancel
  |-- Ostatni pricing karty (cas, minima, zaokrouhleni, markup, volume discounts)
  |
  |-- savePricingConfigV3() --> localStorage (pricing:v3)

AdminPresets.jsx
  |-- Upload formular + material dropdown
  |-- Tabulka presetu + material sloupec
  |-- loadPricingConfigV3() --> cte materialy pro dropdown
  |
  |-- presetsApi / localStorage (presets:v1)

adminPricingStorage.js
  |-- normalizePricingConfigV3() --> zachovava price_per_gram na barvach
  |-- getColorEffectivePrice() --> resolvuje efektivni cenu barvy
```

---

## Build status

- **Vite build**: PASS (0 chyb)
- **Zpetna kompatibilita**: ANO - existujici data funguji beze zmen

---
---

## Redesign Dokumentace: FORGE Dark Theme (2026-02-10)

### Prehled

Kompletni vizualni redesign celeho webu (krome widgetu a builderu) z puvodniho bileho generického AI designu na tmave FORGE tema. Cilem bylo odstranit genericky "AI-generated" vzhled a nahradit ho distinktivnim dark themem inspirovanym 3D tiskovym prostredim.

**Pred redesignem:** Bily design (#f5f5f5 pozadi), genericka modra (#1976d2), Inter font, zaoblene rohy 12-16px, sterilni prazdne plochy.

**Po redesignu:** Tmave tema (#08090C void pozadi), teal accent (#00D4AA), 4 fonty (Space Grotesk, IBM Plex Sans, JetBrains Mono, Space Mono), male border-radius 4-6px, textury, asymetricke layouty.

---

### Design System - CSS zaklad (5 souboru)

| Soubor | Popis |
|--------|-------|
| `src/styles/forge-tokens.css` | CSS custom properties — barvy, stiny, radius, spacing, fonty |
| `src/styles/forge-textures.css` | Grain, blueprint grid, scanlines, dot grid textury |
| `src/styles/forge-typography.css` | Font-face deklarace, typograficke utility tridy |
| `src/styles/forge-utilities.css` | Pomocne tridy (leader-line, callout, badge, mono-bold, price-lg) |
| `src/styles/forge-animations.css` | Animace (draw-check, slide-in, breathing pulse) |

### Klicove FORGE design tokeny

| Token | Hodnota | Pouziti |
|-------|---------|---------|
| `--forge-bg-void` | `#08090C` | Hlavni pozadi stranek |
| `--forge-bg-surface` | `#0D0F14` | Karty, panely |
| `--forge-bg-elevated` | `#161920` | Inputy, vnorene plochy |
| `--forge-accent-primary` | `#00D4AA` | CTA, aktivni stavy, linky |
| `--forge-accent-secondary` | `#FF6B35` | Sekundarni zvyrazneni |
| `--forge-text-primary` | `#E8E9ED` | Hlavni text |
| `--forge-text-muted` | `#6B7280` | Utlumeny text |
| `--forge-border-default` | `#1E2230` | Ohraniceni |
| `--forge-font-heading` | Space Grotesk | Nadpisy |
| `--forge-font-body` | IBM Plex Sans | Telo textu |
| `--forge-font-mono` | JetBrains Mono | Ceny, rozmery, ID, data |
| `--forge-font-tech` | Space Mono | Labely, tab headers, badges |

---

### FORGE Komponenty (23 souboru)

Vsechny v `src/components/ui/forge/`:

| Komponenta | Typ | Pouziti |
|-----------|-----|---------|
| `ForgeButton.jsx` | Form | Vsechny tlacitka v aplikaci |
| `ForgeInput.jsx` | Form | Textove inputy (dark bg, teal focus) |
| `ForgeSelect.jsx` | Form | Dropdown selecty |
| `ForgeToggle.jsx` | Form | Toggle switche |
| `ForgeSlider.jsx` | Form | Range slidery (infill apod.) |
| `ForgeColorPicker.jsx` | Form | Vyber barvy (branding) |
| `ForgeCard.jsx` | Display | Elevated surface kontejner |
| `ForgeDialog.jsx` | Display | Modalni dialog |
| `ForgeToast.jsx` | Display | Notifikace (success/error/warning) |
| `ForgePageHeader.jsx` | Display | Hlavicka admin stranek s breadcrumb |
| `ForgeStatCard.jsx` | Display | Statisticka karta na dashboardu |
| `ForgeStatusBadge.jsx` | Display | Stavove badgy (active/inactive/error) |
| `ForgeStatusIndicator.jsx` | Display | STATUS: ONLINE indikator v sidebar |
| `ForgeNumberedCard.jsx` | Display | Cislovana karta (pricing stranky) |
| `ForgePricingCard.jsx` | Display | Cenikova karta |
| `ForgeFaqAccordion.jsx` | Display | FAQ akordeon (support stranka) |
| `ForgeSectionLabel.jsx` | Display | Sekci label (uppercase, tech font) |
| `ForgePrinterSVG.jsx` | Display | Vlastni SVG ilustrace tiskarny |
| `ForgeSquiggle.jsx` | Display | Rucne-kresleny podtrzeni SVG |
| `ForgeTable.jsx` | Data | Tabulka (mono headers, alternating rows) |
| `ForgeTabs.jsx` | Data | Tab navigace (tech font, teal active) |
| `ForgeProgressBar.jsx` | Data | Progress bar |
| `ForgePriceBreakdown.jsx` | Data | Receipt-style cenovy rozpad |

---

### Upravene stranky — Admin panel (16 + 8 sub-komponent)

**AdminLayout** — kompletni prepis sidebaru:
- `src/pages/admin/AdminLayout.jsx` — dark sidebar, seskupena navigace (CONFIGURATION/PRICING/OPERATIONS), responsive (260px/64px/drawer)

**Admin stranky (kazda = prepis `<style>` bloku na FORGE CSS variables):**

| Soubor | Cca FORGE var referenci | Klicove zmeny |
|--------|------------------------|---------------|
| `AdminDashboard.jsx` | 142 | Asymmetric stat grid, sparklines, recent orders table |
| `AdminPricing.jsx` | 124 | Tab navigace, inline-editable cells, volume discount builder |
| `AdminFees.jsx` | 169 | Fee config tabulky, editable cells |
| `AdminParameters.jsx` | 254 | Sub-routes, 13 inline style bloku prepis |
| `AdminBranding.jsx` | 133 | Logo upload, color picker, live preview |
| `AdminWidget.jsx` | 114 | Config/Embed/Domains/Settings tabs |
| `AdminOrders.jsx` | 128 | Filter pills, order table + kanban view |
| `AdminCoupons.jsx` | 57 | Kuponovy formular, toggle, info box |
| `AdminPresets.jsx` | 43 | Preset tabulka, upload formular |
| `AdminTeamAccess.jsx` | 131 | Member tabulka, invite modal, audit log |
| `AdminShipping.jsx` | 50 | Shipping methods, weight tiers |
| `AdminExpress.jsx` | 62 | Express tier config, preview cards |
| `AdminEmails.jsx` | 57 | Email sablony, SMTP config, log tabulka |
| `AdminAnalytics.jsx` | 33 | Chart styling, time range selector, modal |
| `AdminMigration.jsx` | 58 | Migracni UI (kompletni JSX prepis z Tailwindu) |

**Admin sub-komponenty:**

| Soubor | Upraveno s |
|--------|------------|
| `admin/components/WidgetConfigTab.jsx` | AdminWidget |
| `admin/components/WidgetDomainsTab.jsx` | AdminWidget |
| `admin/components/WidgetEmbedTab.jsx` | AdminWidget |
| `admin/components/WidgetSettingsTab.jsx` | AdminWidget |
| `admin/components/kanban/KanbanBoard.jsx` | AdminOrders |
| `admin/components/kanban/KanbanCard.jsx` | AdminOrders |
| `admin/components/kanban/KanbanColumn.jsx` | AdminOrders |
| `admin/components/kanban/KanbanFilters.jsx` | AdminOrders |

**Beze zmeny (cista logika):** `kanban/statusTransitions.js`, `kanban/useKanbanDnd.js`

---

### Upravene stranky — Test-Kalkulacka (8 souboru)

| Soubor | Klicove zmeny |
|--------|---------------|
| `test-kalkulacka/index.jsx` | FORGE page wrapper, wizard progress bar (24px kruznice, Space Mono, dashed connectors) |
| `components/FileUploadZone.jsx` | Dot-grid pattern, dashed border, file type badges (.STL/.OBJ/.3MF) |
| `components/PrintConfiguration.jsx` | Radio cards, filament color dots, ForgeSlider s mono value, fee pills |
| `components/PricingCalculator.jsx` | Receipt-style layout, dotted leader lines, monospace hodnoty |
| `components/ModelViewer.jsx` | Void bg, dimensions overlay, mesh barva #00D4AA (misto #1E90FF) |
| `components/CheckoutForm.jsx` | FORGE inputs, order summary, GDPR checkbox accent |
| `components/OrderConfirmation.jsx` | Animovany teal checkmark, monospace order cislo |
| Mensi komponenty | ShippingSelector, CouponInput, ExpressTierSelector, PostProcessingSelector, PromoBar, UpsellPanel |

**KRITICKE:** Zadna business logika nebyla zmenena — pricing engine, checkout validace, file handling zustavaji beze zmeny.

---

### Upravene stranky — Auth & Account (11 souboru)

| Soubor | Stav |
|--------|------|
| `account/index.jsx` | FORGE inline styles, tabs navigace |
| `account/components/AccountOverviewCard.jsx` | FORGE inline styles |
| `login/index.jsx` | FORGE dark page wrapper |
| `login/components/LoginForm.jsx` | FORGE inputs, error box, button |
| `login/components/LoginHeader.jsx` | FORGE heading, tech font |
| `login/components/LoginActions.jsx` | FORGE links, demo credentials |
| `login/components/SocialLogin.jsx` | FORGE divider, social buttons |
| `login/components/LanguageToggle.jsx` | FORGE border, tech font |
| `register/index.jsx` | FORGE page wrapper, card |
| `register/components/RegistrationForm.jsx` | FORGE inline styles, section headings |
| `register/components/RoleSelectionCard.jsx` | FORGE card, teal selection state |
| `register/components/ProgressSteps.jsx` | FORGE step circles, mono font, dashed connectors |

**Dalsi stranky:**

| Soubor | Zmeny |
|--------|-------|
| `NotFound.jsx` | Velke "404" v JetBrains Mono, ForgeButton na Home |
| `InviteAccept.jsx` | Centered ForgeCard, accept/decline buttony |

---

### Backup a cleanup

| Akce | Detail |
|------|--------|
| **Backup kalkulacka** | `src/pages/test-kalkulacka/` zkopirovan do `src/pages/test-kalkulacka-white/` (puvodni bily design, route `/test-kalkulacka-white`) |
| **Model-upload odstranen** | `src/pages/model-upload/` smazan (6 souboru), route presmerovana na `/test-kalkulacka-white` |
| **Routes.jsx** | Import `Navigate`, nova route pro white backup, redirect pro model-upload |

---

### Vylouceno z redesignu (separatni prace)

| Oblast | Duvod |
|--------|-------|
| `src/pages/admin/builder/` (Widget Builder) | Vlastni theme system (`--builder-*` vars), bude se delat separatne |
| `src/pages/widget-kalkulacka/` | Vlastni theme system (`--widget-*` vars), embeduje se do cizich stranek |
| `src/pages/widget-public/` | Widget public wrapper |
| `src/pages/widget/WidgetPreview.jsx` | Widget nahled |
| `src/pages/test-kalkulacka-white/` | Intentionalni backup, NEMENIT |

---

### Anti-AI Design pravidla dodrzena

1. Primarni barva `#00D4AA` teal (ne genericka modra)
2. 4 ruzne fonty (heading/body/mono/tech)
3. Asymetricke layouty (2fr/1fr gridy, ne rovne sloupce)
4. Ceny/rozmery v JetBrains Mono
5. Vlastni SVG ilustrace (ForgePrinterSVG, ForgeSquiggle)
6. Kontextove empty states (ne genericke "No data")
7. Male border-radius 4-6px (ne 12-16px zakulacene rohy)
8. Textury v pozadi (grain, dot-grid)
9. Dark theme jako default
10. Barvy souvisi s 3D tiskem (nozzle hot, bed heated)

### Pristup k implementaci

- **Jen styling zmeny** — zadna business logika nebyla modifikovana v zadnem souboru
- **Inline style objekty** s `var(--forge-*)` CSS promennymi (konzistentni vzor pres vsechny stranky)
- **`<style>` bloky** v admin strankach prepsany z light-mode hodnot na FORGE tokeny
- **Tailwind tridy** v nekterych souborech nahrazeny inline FORGE styly (AdminMigration, AdminTeamAccess)

### Build status

- **Vite build**: PASS (2972 modulu, 0 chyb)
- **Zpetna kompatibilita**: ANO — zadna zmena v datech, API, logice
- **Celkem upravenych souboru**: ~55 (16 admin + 8 sub-komponent + 8 kalkulacka + 11 auth/account + 2 misc + 5 CSS + 23 novych komponent)
- **Celkem novych souboru**: 28 (23 FORGE komponent + 5 CSS)
