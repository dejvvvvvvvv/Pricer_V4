# AdminWidget & AdminWidgetBuilder -- Dokumentace

> Sprava widget instanci, embed kod, domain whitelist management a WYSIWYG Widget Builder.
> AdminWidget je admin panel pro widget CRUD operace, embedding a bezpecnost.
> AdminWidgetBuilder je fullscreen vizualni editor pro customizaci vzhledu widgetu.

---

## 1. Prehled

### URL a routing
| Route | Komponenta | Popis |
|-------|-----------|-------|
| `/admin/widget` | `AdminWidget` | Sprava widgetu -- CRUD, embed kod, domain whitelist, nastaveni |
| `/admin/widget/builder/:id` | `AdminWidgetBuilder` -> `BuilderPage` | Fullscreen WYSIWYG builder (mimo AdminLayout) |
| `/w/:publicWidgetId` | `WidgetPublicPage` | Verejna embed route (pouziva widget konfiguraci z AdminWidget) |
| `/widget/embed/:publicId` | `WidgetEmbed` | Alternativni Puck-based embed route |
| `/widget/preview/:publicId` | `WidgetPreview` | Admin preview widgetu |

### Routing poznamky
- `AdminWidget` je vnoreny uvnitr `AdminLayout` (standardni admin sidebar a header).
- `AdminWidgetBuilder` je na top-level route **mimo** AdminLayout pro fullscreen zazitku (zadny sidebar/header).
- Obe routes jsou definovany v `src/Routes.jsx`.

### Widget zivotni cyklus (admin strana)

```
1. Admin otevre /admin/widget
2. Zobrazi se seznam widget instanci (levy sloupec)
3. Admin vybere widget -> pravy sloupec zobrazi detail s taby
4. Tab "Konfigurace": nazev, typ, theme mode, primary color, sirka, jazyk
5. Tab "Embed kod": iframe snippet s auto-resize scriptem
6. Tab "Domeny": whitelist management (pridani/smazani/toggle domen)
7. Tab "Nastaveni": aktivace/deaktivace, odkaz na Builder, duplikace, smazani
8. Admin klikne "Otevrit Builder" -> presmerovan na /admin/widget/builder/:id
9. Builder: zive nahledy, theme editace, undo/redo, ulozeni
10. Embed kod vlozeny na externi web -> /w/:publicWidgetId servíruje widget
```

### Klicove vlastnosti
- Multi-widget management -- vice instanci dle tarifniho planu
- 4-tabovy detail panel (Konfigurace, Embed kod, Domeny, Nastaveni)
- Dirty tracking s beforeunload varovanim
- Domain whitelist s wildcard subdomenami
- Plan-based limity (max_widget_instances, can_use_domain_whitelist)
- Fullscreen WYSIWYG Builder s 56 theme vlastnostmi
- Undo/redo historie (max 50 kroku)
- Device preview (mobile/tablet/desktop)
- Branding auto-apply na prvnim nacteni
- Keyboard shortcuts (Ctrl+Z undo, Ctrl+Y/Ctrl+Shift+Z redo)

---

## 2. Technologie a jazyk

| Technologie | Pouziti |
|-------------|---------|
| React 19 | Zakladni framework, JSX komponenty |
| react-router-dom | useParams, useNavigate pro routing |
| lucide-react | Ikony v BuilderTopBar (ArrowLeft, Monitor, Undo2 atd.) |
| CSS Custom Properties | AdminWidget Forge theme (`--forge-*`), Builder tokens (`--builder-*`) |
| CSS-in-JS (inline styles) | Builder komponenty pouzivaji inline `style` objekty |
| Scoped `<style>` tagy | AdminWidget pouziva `aw-*` prefixovane CSS tridy ve `<style>` bloku |
| localStorage | Perzistence widgetu pres `adminBrandingWidgetStorage.js` |
| postMessage API | WidgetPublicPage komunikace s rodicovskou strankou |
| ResizeObserver | Automaticka vyska iframe v WidgetEmbed |
| navigator.clipboard | Kopirovani embed kodu do schranky |
| JSON.stringify/parse | Dirty tracking (porovnani editor vs editorBase) |

**Dulezite**: AdminWidget pouziva Forge dark theme (`--forge-*` CSS tokeny). Builder pouziva vlastni `--builder-*` tokeny definovane v `builder-tokens.css`.

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminWidget.jsx                              -- Hlavni admin stranka (~1555 radku)
  AdminWidgetBuilder.jsx                       -- Thin wrapper delegujici na BuilderPage (~10 radku)
  components/
    WidgetConfigTab.jsx                        -- Tab 1: konfiguracni formular
    WidgetEmbedTab.jsx                         -- Tab 2: embed kod + copy
    WidgetDomainsTab.jsx                       -- Tab 3: domain whitelist
    WidgetSettingsTab.jsx                      -- Tab 4: stav, builder CTA, duplikace, smazani
  builder/
    BuilderPage.jsx                            -- Hlavni kompozice Widget Builderu (~322 radku)
    styles/
      builder-tokens.css                       -- CSS custom properties pro builder
    hooks/
      useBuilderState.js                       -- Top-level kompozicni hook (~341 radku)
      useUndoRedo.js                           -- Genericka undo/redo state machine (~149 radku)
      useElementSelection.js                   -- Element selection/hover tracking (~87 radku)
    components/
      BuilderTopBar.jsx                        -- Navigace, device switcher, undo/redo, save
      BuilderLeftPanel.jsx                     -- 3-tabovy levy panel (Styl/Elementy/Globalni)
      BuilderRightPanel.jsx                    -- Pravy panel s preview
      DevicePreviewFrame.jsx                   -- Simulace device rozmeru
      BuilderColorPicker.jsx                   -- Color picker komponenta
      QuickThemeDropdown.jsx                   -- Predpripravene theme sablony
      OnboardingOverlay.jsx                    -- First-run walkthrough pro nove uzivatele
      tabs/
        StyleTab.jsx                           -- Editace stylu vybraneho elementu
        ElementsTab.jsx                        -- Seznam elementu widgetu
        GlobalTab.jsx                          -- Globalni nastaveni (Quick themes, bulk operace)

src/pages/widget-public/
  WidgetPublicPage.jsx                         -- Verejna embed route s domain validaci

src/pages/widget/
  WidgetEmbed.jsx                              -- Puck-based alternativni embed
  WidgetPreview.jsx                            -- Admin preview

src/utils/
  adminBrandingWidgetStorage.js                -- Storage CRUD operace pro widgety a domeny
  widgetThemeStorage.js                        -- Theme storage, CSS vars generovani, default theme
  adminTenantStorage.js                        -- getTenantId()
```

---

## 4. Datovy model

### Widget objekt

```javascript
{
  id: 'w_abc123def456',                     // Interni ID (prefix w_, 12 random znaku)
  publicId: 'wid_1234abcd',                // Verejne ID pro embed URL (prefix wid_)
  tenantId: 'test-customer-1',             // Tenant scope
  name: 'Homepage',                        // Uzivatelsky nazev
  status: 'active' | 'disabled',          // Stav widgetu
  type: 'full_calculator' | 'price_only', // Typ widgetu
  themeMode: 'auto' | 'light' | 'dark',  // Theme rezim
  primaryColorOverride: '#FF5500' | null, // Override barvy (null = z Brandingu)
  widthMode: 'auto' | 'fixed',           // Rezim sirky
  widthPx: 800 | null,                    // Fixni sirka v px (pokud widthMode === 'fixed')
  localeDefault: 'cs' | 'en',            // Vychozi jazyk
  configProfileId: null,                   // Budouci: profil konfigurace
  themeConfig: { ... },                    // 56 theme vlastnosti (viz sekce 8)
  domains: [                               // Domain whitelist
    {
      id: 'd_1234567890',
      domain: 'firma.cz',
      allowSubdomains: true,              // true = *.firma.cz take povoleno
      isActive: true,
      created_at: '2026-02-13T...'
    }
  ],
  created_at: '2026-02-13T...',
  updated_at: '2026-02-13T...'
}
```

### localStorage klice

| Klic | Obsah |
|------|-------|
| `modelpricer_widgets__${tenantId}` | Array widget objektu |
| `modelpricer_branding__${tenantId}` | Branding konfigurace |
| `modelpricer:widget_theme:${tenantId}` | Standalone theme storage |
| `modelpricer:${tenantId}:builder:onboarding_complete` | Flag pro Builder onboarding |

---

## 5. AdminWidget -- Detailni popis

### 5.1 State management

```
loading          -- bool, nacitaci stav
plan             -- tarifni plan (max_widget_instances, can_use_domain_whitelist)
widgets          -- pole widget objektu
selectedId       -- ID aktualne vybraneho widgetu
editor           -- deep clone vybraneho widgetu pro editaci
editorBase       -- deep clone pro dirty tracking (puvodni stav)
domains          -- pole domen pro vybrany widget
saving           -- bool, ukladaci stav
toast            -- { msg, kind } pro notifikace
activeTab        -- 'config' | 'embed' | 'domains' | 'settings'
createOpen       -- bool, modal pro vytvoreni widgetu
createName       -- nazev noveho widgetu
createType       -- typ noveho widgetu
createError      -- validacni chyba pri vytvareni
```

### 5.2 Dirty tracking

AdminWidget pouziva JSON.stringify porovnani `editor` vs `editorBase` pro detekci zmenenych dat:

```javascript
const isDirty = useMemo(() => {
  if (!editor || !editorBase) return false;
  return JSON.stringify(editor) !== JSON.stringify(editorBase);
}, [editor, editorBase]);
```

Pokud jsou neulozene zmeny:
- Zobrazuje se zluty "dirty banner" s tlacitky "Zahodit" a "Ulozit"
- `beforeunload` event handler varue uzivatele pred odchodem ze stranky
- Prepnuti na jiny widget vyzaduje potvrzeni (window.confirm)

### 5.3 Taby

| Tab | Komponenta | Funkcionalita |
|-----|-----------|---------------|
| Konfigurace | `WidgetConfigTab` | Nazev, typ, theme mode, primary color, sirka, jazyk |
| Embed kod | `WidgetEmbedTab` | Generovani a kopirovani iframe embed kodu |
| Domeny | `WidgetDomainsTab` | Pridavani/odebirani/toggle domen v whitelistu |
| Nastaveni | `WidgetSettingsTab` | Aktivace/deaktivace, Builder CTA, duplikace, smazani |

### 5.4 Embed kod format

```html
<!-- ModelPricer Widget: Homepage -->
<iframe
  src="https://app.modelpricer.com/w/wid_1234abcd"
  style="width: 100%; border: none; min-height: 600px;"
  title="3D Print Calculator"
  allow="clipboard-write"
></iframe>
<script>
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'MODELPRICER_RESIZE') {
      var iframe = document.querySelector('iframe[src*="wid_1234abcd"]');
      if (iframe && e.data.height) {
        iframe.style.height = e.data.height + 'px';
      }
    }
  });
</script>
```

Embed kod obsahuje:
- iframe s URL `/w/:publicId`
- Auto-resize script ktery posloucha `MODELPRICER_RESIZE` postMessage
- `allow="clipboard-write"` pro kopirovani uvnitr widgetu

### 5.5 CRUD operace

| Operace | Funkce | Popis |
|---------|--------|-------|
| Vytvoreni | `createWidget(tenantId, { name, type })` | Kontroluje plan limit pred vytvorenim |
| Cteni | `getWidgets(tenantId)` | Vraci pole widgetu, seeduje default pokud prazdne |
| Aktualizace | `updateWidget(tenantId, widgetId, patch)` | Merge patch do widgetu |
| Smazani | `deleteWidget(tenantId, widgetId)` | Filtruje widget z pole |
| Duplikace | `duplicateWidget(tenantId, widgetId)` | Kopiruje vcetne domen, generuje nove ID |
| Toggle stavu | `toggleWidgetStatus(tenantId, widgetId)` | Prepina active/disabled |

### 5.6 Validace editoru

```javascript
const validateEditor = () => {
  const errors = {};
  // Nazev: min. 2 znaky
  if (!editor.name || String(editor.name).trim().length < 2) {
    errors.name = 'Zadej nazev (min. 2 znaky).';
  }
  // Primary color: musi byt #RRGGBB pokud vyplneno
  if (editor.primaryColorOverride && !isValidHex(editor.primaryColorOverride)) {
    errors.primaryColorOverride = 'Barva musi byt ve formatu #RRGGBB.';
  }
  // Sirka: musi byt > 0 pokud je widthMode === 'fixed'
  if (editor.widthMode === 'fixed') {
    const v = Number(editor.widthPx);
    if (!Number.isFinite(v) || v <= 0) {
      errors.widthPx = 'Zadej sirku > 0.';
    }
  }
  return errors;
};
```

---

## 6. AdminWidgetBuilder -- Detailni popis

### 6.1 Architektura

`AdminWidgetBuilder.jsx` je thin wrapper ktery deleguje na `BuilderPage.jsx`. Builder je renderovany **mimo AdminLayout** na top-level route pro plne fullscreen zazitek.

```
AdminWidgetBuilder (thin wrapper)
  -> BuilderPage (hlavni kompozice)
       -> useBuilderState (kompozicni hook)
            -> useUndoRedo (undo/redo state machine)
            -> useElementSelection (element tracking)
       -> BuilderTopBar (navigace, device switcher, save)
       -> BuilderLeftPanel (3-tabovy panel)
            -> StyleTab (editace stylu)
            -> ElementsTab (seznam elementu)
            -> GlobalTab (globalni nastaveni)
       -> BuilderRightPanel (preview)
            -> DevicePreviewFrame (device simulace)
                 -> WidgetKalkulacka (ziva widget instance)
```

### 6.2 Layout

CSS Grid s 2 sloupci a 2 radky:
- **Radek 1:** TopBar (56px, span oba sloupce)
- **Radek 2:** Levy panel (35%) | Pravy panel s preview (65%)

```javascript
gridTemplateRows: 'var(--builder-topbar-height, 56px) 1fr',
gridTemplateColumns: 'var(--builder-left-panel-width, 35%) var(--builder-right-panel-width, 65%)',
height: '100vh'
```

### 6.3 useBuilderState -- kompozicni hook

Hlavni hook ktery kombinuje:

| Concern | Zdroj | Popis |
|---------|-------|-------|
| Theme state | `useUndoRedo` | 56 theme vlastnosti s undo/redo historiou |
| Element tracking | `useElementSelection` | selectedElementId, hoveredElementId |
| Device mode | `useState` | 'mobile' / 'tablet' / 'desktop' |
| Tab navigace | `useState` | 'style' / 'elements' / 'global' |
| Text editing | `useState` | ID inline editovaneho textu |
| Widget metadata | `useState` | widget objekt + editable nazev |
| Persistence | save funkce | Uklada do localStorage pres updateWidget |
| Keyboard shortcuts | `useEffect` | Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z |

API vracene z hooku:

```javascript
{
  // Theme
  theme, updateThemeProperty, updateThemePropertyDebounced, setThemeBulk,
  undo, redo, canUndo, canRedo, isDirty, resetToOriginal, resetToDefaults,
  // Selection
  selectedElementId, hoveredElementId, selectElement, hoverElement, clearSelection,
  isSelected, isHovered,
  // UI
  deviceMode, setDeviceMode, activeTab, setActiveTab,
  editingTextId, setEditingTextId,
  // Widget
  widget, widgetName, setWidgetName,
  // Persistence
  save, saving, loading
}
```

### 6.4 useUndoRedo -- state machine

Genericka undo/redo implementace s nasledujicimi vlastnostmi:

- **Past/Future stacky** ulozeny v `useRef` (ne v state) pro minimalni re-rendery
- **Max historie:** 50 kroku (FIFO -- nejstarsi se zahodi)
- **Branching:** nova editace maze redo (future) stack
- **isDirty:** JSON.stringify porovnani aktualniho stavu s originalem
- **setWithoutHistory:** aktualizace bez pridani do undo stacku (pouzivano pro slider drag preview)
- **reset:** nastavi novy original, vymaze oba stacky

### 6.5 Branding auto-apply

Pri prvnim nacteni builderu (pokud widget jeste nebyl customizovan -- `themeConfig` prazdny nebo neexistujici):
1. Nacte branding tenanta (`getBranding`)
2. Aplikuje `branding.primaryColor` -> `buttonPrimaryColor`
3. Aplikuje `branding.businessName` -> `textHeaderTitle`
4. Bezi pouze jednou (`brandingAppliedRef`)

### 6.6 DevicePreviewFrame

Simuluje rozmery zarizeni:

| Mode | Sirka | Max vyska |
|------|-------|-----------|
| mobile | 375px | 812px |
| tablet | 768px | 1024px |
| desktop | 100% (max 1200px) | bez omezeni |

Animovany prechod sirky (300ms ease).

### 6.7 Onboarding overlay

- Zobrazuje se pri prvnim otevreni builderu (pokud `builder:onboarding_complete !== 'true'` v localStorage)
- Po dokonceni nastavi flag a uz se neukazuje
- Jazyk: CS

---

## 7. Storage -- CRUD operace

### 7.1 Widget CRUD (adminBrandingWidgetStorage.js)

| Funkce | Signatura | Popis |
|--------|-----------|-------|
| `getWidgets` | `(tenantId) -> Widget[]` | Vraci pole widgetu, seeduje default pokud prazdne |
| `saveWidgets` | `(tenantId, widgets) -> Widget[]` | Uklada pole + dual-write Supabase |
| `createWidget` | `(tenantId, input) -> Widget` | Vytvori novy widget, kontroluje plan limit |
| `duplicateWidget` | `(tenantId, widgetId) -> Widget` | Kopiruje widget vcetne domen |
| `deleteWidget` | `(tenantId, widgetId) -> Widget[]` | Smaze widget |
| `toggleWidgetStatus` | `(tenantId, widgetId, status?) -> Widget` | Toggle active/disabled |
| `updateWidget` | `(tenantId, widgetId, patch) -> Widget` | Merge patch do widgetu |
| `updateWidgetTheme` | `(tenantId, widgetId, themeConfig) -> Widget` | Merge theme config |
| `getWidgetByPublicId` | `(publicWidgetId) -> { widget, tenantId }` | Lookup pro embed route |
| `getWidgetByIdOrPublicId` | `(tenantId, id) -> Widget` | Lookup pro admin/preview |

### 7.2 Domain CRUD

| Funkce | Signatura | Popis |
|--------|-----------|-------|
| `getWidgetDomains` | `(tenantId, widgetId) -> Domain[]` | Vraci domeny z widget objektu |
| `validateDomainInput` | `(input) -> { ok, host?, reason? }` | Validuje hostname format |
| `addWidgetDomain` | `(tenantId, widgetId, domain, allowSubdomains) -> Domain` | Prida domenu |
| `toggleWidgetDomain` | `(tenantId, widgetId, domainId, isActive) -> Domain` | Toggle stavu |
| `deleteWidgetDomain` | `(tenantId, widgetId, domainId) -> Domain[]` | Smaze domenu |
| `isDomainAllowedByWhitelist` | `(hostname, domains) -> boolean` | Overi zda je domena povolena |

### 7.3 Theme storage (widgetThemeStorage.js)

| Funkce | Signatura | Popis |
|--------|-----------|-------|
| `getDefaultWidgetTheme` | `() -> Theme` | 56 defaultnich vlastnosti |
| `getWidgetTheme` | `(tenantId?) -> Theme` | Nacte theme, merge s defaults |
| `saveWidgetTheme` | `(themeUpdate, tenantId?) -> Theme` | Ulozi theme + Supabase dual-write |
| `resetWidgetTheme` | `(tenantId?) -> Theme` | Resetuje na defaults |
| `themeToCssVars` | `(theme) -> CSSVarsObject` | Generuje CSS custom properties |
| `applyThemeToDom` | `(theme, element?) -> void` | Aplikuje vars na DOM element |
| `themeToInlineStyle` | `(theme) -> string` | Generuje inline style string |

---

## 8. Theme system (56 vlastnosti)

### 8.1 Puvodnich 15 vlastnosti

| Klic | CSS var | Default | Popis |
|------|---------|---------|-------|
| `backgroundColor` | `--widget-bg` | `#FFFFFF` | Pozadi widgetu |
| `cardColor` | `--widget-card` | `#F9FAFB` | Pozadi karet |
| `headerColor` | `--widget-header` | `#1F2937` | Barva nadpisu |
| `textColor` | `--widget-text` | `#374151` | Hlavni text |
| `mutedColor` | `--widget-muted` | `#6B7280` | Sekundarni text |
| `buttonPrimaryColor` | `--widget-btn-primary` | `#2563EB` | Barva tlacitka |
| `buttonTextColor` | `--widget-btn-text` | `#FFFFFF` | Text tlacitka |
| `buttonHoverColor` | `--widget-btn-hover` | `#1D4ED8` | Hover barva |
| `inputBgColor` | `--widget-input-bg` | `#FFFFFF` | Pozadi inputu |
| `inputBorderColor` | `--widget-input-border` | `#D1D5DB` | Ramecek inputu |
| `inputFocusColor` | `--widget-input-focus` | `#2563EB` | Focus barva |
| `summaryBgColor` | `--widget-summary-bg` | `#F3F4F6` | Pozadi souhrnu |
| `borderColor` | `--widget-border` | `#E5E7EB` | Obecne ramecky |
| `fontFamily` | `--widget-font` | `Inter, system-ui, sans-serif` | Hlavni font |
| `cornerRadius` | `--widget-radius` | `12px` | Zaobleni rohu |

### 8.2 Novych 41 vlastnosti (Widget Builder V3)

Kategorie:
- **Header** (5): headerBgColor, headerLogoSize, headerPadding, headerAlignment, headerTaglineVisible
- **Upload zone** (5): uploadBgColor, uploadBorderColor, uploadBorderHoverColor, uploadIconColor, uploadBorderStyle
- **Stepper** (4): stepperActiveColor, stepperCompletedColor, stepperInactiveColor, stepperProgressVisible
- **Config panel** (2): configBgColor, configLabelColor
- **Fees section** (2): feesBgColor, feesCheckboxColor
- **Price summary** (4): summaryHeaderColor, summaryDividerColor, summaryTotalBgColor, summaryTotalFontSize
- **CTA button** (4): buttonBorderRadius, buttonPaddingY, buttonFontSize, buttonShadow
- **Footer** (3): footerBgColor, footerTextColor, footerLinkColor
- **Typography** (2): headingFontFamily, codeFontFamily
- **Effects** (2): cardShadow, globalPadding
- **Skeleton** (2): skeletonBaseColor, skeletonShineColor
- **Editable texts** (6): textHeaderTitle, textHeaderTagline, textUploadTitle, textUploadDescription, textUploadButton, textCtaButton

### 8.3 Theme property typy

| Typ | Popis | Priklad |
|-----|-------|---------|
| `color` | HEX barva | `#2563EB` |
| `number` | Ciselna hodnota s min/max/unit | `cornerRadius: 12` (px) |
| `font` | Font family string | `'Inter, system-ui, sans-serif'` |
| `select` | Vyber z options | `'none' \| 'subtle' \| 'medium' \| 'strong'` |
| `boolean` | True/false | `headerTaglineVisible: true` |
| `text` | Editovatelny textovy obsah | `'3D Tisk Kalkulacka'` |

---

## 9. PostMessage protokol

### 9.1 Zpravy odesílane widgetem

| Typ | Smer | Data | Ucel |
|-----|------|------|------|
| `MODELPRICER_WIDGET_HEIGHT` | Widget -> Parent | `{ publicId, height }` | Auto-resize iframe |
| `MODELPRICER_RESIZE` | Widget -> Parent | `{ height }` | Auto-resize (alternativni format) |
| `MODELPRICER_QUOTE_CREATED` | Widget -> Parent | `{ publicWidgetId, quote }` | Oznameni o vypoctu ceny |

### 9.2 Auto-resize mechanismus

**WidgetEmbed.jsx** pouziva ResizeObserver:
```javascript
const postHeight = () => {
  const h = Math.ceil(el.getBoundingClientRect().height);
  window.parent?.postMessage(
    { type: 'MODELPRICER_WIDGET_HEIGHT', publicId, height: h },
    '*'
  );
};
const ro = new ResizeObserver(() => postHeight());
ro.observe(el);
```

**Embed kod** na strane zakaznika posloucha zpravy a updatuje iframe vysku:
```javascript
window.addEventListener('message', function(e) {
  if (e.data?.type === 'MODELPRICER_RESIZE') {
    var iframe = document.querySelector('iframe[src*="PUBLIC_ID"]');
    if (iframe && e.data.height) {
      iframe.style.height = e.data.height + 'px';
    }
  }
});
```

### 9.3 Target origin

`WidgetPublicPage` pouziva `document.referrer` pro urceni target origin:
```javascript
function getTargetOrigin() {
  try {
    if (document.referrer) {
      return new URL(document.referrer).origin;
    }
  } catch {
    // Invalid referrer URL
  }
  return '*';
}
```

---

## 10. Plan-based limity

### 10.1 Overovane limity

| Limit | Vlastnost | Default | Popis |
|-------|-----------|---------|-------|
| Max widgetu | `plan.features.max_widget_instances` | 1 | Maximalni pocet widget instanci |
| Domain whitelist | `plan.features.can_use_domain_whitelist` | true | Zda je whitelist dostupny |

### 10.2 Mista kde se limity kontroluji

- `AdminWidget.jsx`: `canCreateMore` = `widgets.length < maxWidgets`
- `AdminWidget.jsx`: `canUseWhitelist` = `plan.features.can_use_domain_whitelist`
- `createWidget()`: throwi `MAX_WIDGET_INSTANCES_REACHED` error
- `duplicateWidget()`: throwi `MAX_WIDGET_INSTANCES_REACHED` error
- `addWidgetDomain()`: throwi `DOMAIN_WHITELIST_NOT_AVAILABLE` error
- UI: "Vytvorit widget" tlacitko disabled pokud limit vyhlasan
- UI: Limit box s ikonou zamku pokud nelze vytvorit vice

---

## 11. Accessibility (a11y)

### 11.1 Co funguje dobre

- **Tab navigace** s ARIA roles: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `aria-labelledby`
- **Keyboard navigace v tabech**: ArrowLeft/ArrowRight pro prepinani
- **Toast notifikace** s ARIA `role="alert"` (err) / `role="status"` (ok), `aria-live`
- **Builder TopBar**: `aria-label` na vsech icon buttony, `aria-pressed` na device mode
- **Focus management**: autofocus na input pri vytvareni widgetu

### 11.2 Nedostatky

- Domain whitelist `ForgeCheckbox` -- overit ze ma pristupne label
- Widget card list nema `role="listbox"` / `role="option"` semantiku
- Modal overlay -- chybi focus trap (uzivatel muze tabovat ven z modalu)
- Scroll containment na modalu je implementovano pres `wheel` event ale ne pres keyboard

---

## 12. Responsivita

### AdminWidget breakpointy

| Breakpoint | Zmena |
|------------|-------|
| >1024px | 2-sloupcovy grid (340px + 1fr) |
| <=1024px | 1 sloupec, topbar vertical, mensi taby |
| <=640px | Mensi padding, wrapping card actions, vertikalni domain form |

### Builder

Builder je navrzeny pro desktop (fullscreen) -- nema mobilni breakpointy. Grid je fixni 35%/65% rozdeleni.

---

## 13. CSS architektura

### AdminWidget -- Scoped `aw-*` styly

AdminWidget pouziva `<style>` tag s `aw-` prefixem pro vsechny CSS tridy:

```css
.aw-page          /* Hlavni wrapper */
.aw-topbar        /* Horni bar */
.aw-layout        /* Grid layout */
.aw-widget-card   /* Karta widgetu v seznamu */
.aw-tabs          /* Tab navigace */
.aw-tab           /* Jednotlivy tab */
.aw-btn           /* Tlacitko (+ varianty: primary, secondary, danger, success) */
.aw-icon-btn      /* Ikona tlacitko */
.aw-input         /* Input field */
.aw-label         /* Form label */
.aw-toast         /* Toast notifikace */
.aw-overlay       /* Modal overlay */
.aw-modal         /* Modalni okno */
```

Pouziva Forge dark theme tokeny: `--forge-bg-surface`, `--forge-text-primary`, `--forge-accent-primary` atd.

### Builder -- `--builder-*` tokeny

Builder ma vlastni CSS token system definovany v `builder-tokens.css`:

```css
--builder-bg-primary     /* Hlavni pozadi */
--builder-bg-secondary   /* Levy panel */
--builder-bg-topbar      /* TopBar */
--builder-accent-primary /* Akcent barva */
--builder-text-primary   /* Text */
--builder-font-body      /* Body font */
--builder-font-heading   /* Heading font */
--builder-font-code      /* Mono font */
--builder-radius-sm/md/lg /* Zaobleni */
--builder-transition-fast /* Prechod */
```

---

## 14. Bezpecnost -- Origin whitelist

### 14.1 Jak whitelist funguje

```
1. Admin prida domenu do whitelistu (napr. "firma.cz", allowSubdomains: true)
2. Zakaznik vlozi iframe s /w/:publicWidgetId na svuj web
3. WidgetPublicPage se nacte
4. Ziska hostname z document.referrer (= domena kde je iframe vlozeny)
5. Kontroluje isDomainAllowedByWhitelist(hostname, widget.domains)
6. Pokud domena neni v whitelistu a ma aktivni zaznamy -> zobrazi error
7. Vyjimka: localhost/127.0.0.1 jsou vzdy povoleny (dev mode)
```

### 14.2 Domain validace (validateDomainInput)

```javascript
// Kontroly:
1. Neprazdny vstup
2. Bez protokolu (http://, https://) -> PROTOCOL_NOT_ALLOWED
3. Bez cesty (/) -> PATH_NOT_ALLOWED
4. Bez mezer -> SPACE_NOT_ALLOWED
5. Validni hostname format (regex) -> INVALID_HOSTNAME
6. Musi obsahovat TLD (tecku) -> MISSING_TLD

// Regex: ^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$
```

### 14.3 isDomainAllowedByWhitelist

```javascript
function isDomainAllowedByWhitelist(hostname, domains) {
  const host = (hostname || '').toLowerCase();
  const list = domains.filter((d) => d.isActive);
  for (const d of list) {
    if (host === d.domain) return true;                   // Presna shoda
    if (d.allowSubdomains && host.endsWith(`.${d.domain}`)) return true; // Wildcard
  }
  return false;
}
```

### 14.4 Bezpecnostni poznamky a rizika

**Aktualni stav (Varianta A -- demo):**

1. **postMessage target origin `'*'`**: WidgetEmbed.jsx odesila postMessage s `'*'` target origin. Toto je bezpecnostni riziko v produkci -- utocnik muze odposlouchavat zpravy. **Doporuceni:** Pouzivat konkretni origin z widget konfigurace.

2. **Tenant lookup scanuje vsechny klice**: `getWidgetByPublicId` iteruje pres vsechny `modelpricer_widgets__*` klice v localStorage. V produkci bude nahrazeno serverovym lookupem.

3. **Domain validation je client-side**: Validace domen probiha ciste na klientovi. V produkci by mel server overovat referrer/origin pri kazdem requestu na `/w/:publicWidgetId`.

4. **Hardcoded TENANT_ID v WidgetEmbed/WidgetPreview**: Oba soubory pouzivaji `const TENANT_ID = 'test-customer-1'`. Toto je demo-only -- v produkci bude tenant resolution jinym mechanismem.

5. **Localhost bypass**: `['localhost', '127.0.0.1', '']` jsou vzdy povoleny. V produkci by toto melo byt konfigurovatelne a/nebo omezene jen na dev prostredi.

### 14.5 Plan-gated pristup

Domain whitelist je gated pres `can_use_domain_whitelist` v plan features:
- Pokud tarif neumoznuje whitelist, cely tab "Domeny" zobrazi lock box
- `addWidgetDomain` throwi `DOMAIN_WHITELIST_NOT_AVAILABLE` error pri pokusu o pridani

---

## 15. Zname problemy a pasti

### 15.1 Widget Builder white screen (OPRAVENO)

**Problem:** Builder se puvodni implementaci renderoval bily screen.
**Pricina:** `useMemo` pro BUILDER_MOCK zpusoboval nestabilni referenci.
**Reseni:** Nahrazeni `useMemo` za `useRef` pro stabilni referenci.
**Reference:** MEMORY.md -- "Widget builder white screen: `useRef` misto `useMemo` pro BUILDER_MOCK"

### 15.2 PostMessage message type nekonzistence

WidgetEmbed.jsx odesila typ `MODELPRICER_WIDGET_HEIGHT`, ale embed kod v WidgetEmbedTab.jsx posloucha typ `MODELPRICER_RESIZE`. Tyto nazvy se lisi. V praxi musi byt sjednoceny nebo oba typy podporovany na prijimaci strane.

### 15.3 Hardcoded TENANT_ID

`WidgetEmbed.jsx` a `WidgetPreview.jsx` pouzivaji `const TENANT_ID = 'test-customer-1'`. Toto je ok pro Variantu A (demo), ale musi byt nahrazeno dynamickym tenant resolution v produkci.

### 15.4 JSON.stringify dirty tracking performance

Dirty tracking v AdminWidget i useBuilderState pouziva `JSON.stringify` porovnani. Pro 56-property theme objekt je to akceptovatelne, ale pri prudkem narustu vlastnosti by mohlo zpusobovat performance problemy. useUndoRedo minimalizuje re-rendery drzenim stacku v useRef.

---

## 16. Zavislosti a propojeni s ostatnimi moduly

### 16.1 Importy v AdminWidget

| Modul | Import | Ucel |
|-------|--------|------|
| `adminTenantStorage.js` | `getTenantId` | Ziskani aktualni tenant ID |
| `adminBrandingWidgetStorage.js` | 12+ funkci | Widget/domain CRUD, branding, plan |
| `LanguageContext.jsx` | `useLanguage` (t) | Prekladovy kontext |
| `AppIcon.jsx` | `Icon` | Ikony (Lucide wrapper) |

### 16.2 Importy v BuilderPage

| Modul | Import | Ucel |
|-------|--------|------|
| `adminTenantStorage.js` | `getTenantId` | Tenant ID |
| `adminBrandingWidgetStorage.js` | `getBranding` | Branding pro auto-apply |
| `widgetThemeStorage.js` | `themeToCssVars` | Generovani CSS vars |
| `useBuilderState.js` | default | Kompozicni hook |
| `widget-kalkulacka/index.jsx` | `WidgetKalkulacka` | Ziva instance widgetu pro preview |
| `widget-kalkulacka/components/ErrorBoundary` | `ErrorBoundary` | Error boundary kolem preview |
| `builder-tokens.css` | CSS import | Builder token system |

### 16.3 Hot spot konflikty

Podle AGENT_MAP:
- `AdminWidget*.jsx` je sdileny: `mp-mid-frontend-widget` vlastni protokol+bezpecnost cast, `mp-mid-frontend-admin` vlastni layout cast.
- Pri konfliktu rozhoduje `mp-sr-orchestrator`.
- `Routes.jsx` -- zmeny routingu koordinovat s `mp-spec-fe-routing`.

---

## 17. Testy a overeni

### Manualni smoke test checklist

- [ ] `/admin/widget` se nacte bez chyb v konzoli
- [ ] Vytvoreni noveho widgetu (modal, nazev min. 2 znaky, vyber typu)
- [ ] Editace konfigurace widgetu (nazev, typ, barva, sirka) -> dirty banner se zobrazi
- [ ] Ulozeni zmen -> toast "Ulozeno", dirty banner zmizi
- [ ] Kopirovani embed kodu -> "Zkopirovano!" feedback
- [ ] Pridani domeny do whitelistu -> validace chyb (prazdny, s protokolem, neplatny)
- [ ] Toggle domeny, smazani domeny
- [ ] Duplikace widgetu -> nova kopie v seznamu
- [ ] Smazani widgetu -> potvrzeni, widget odstranen
- [ ] Klik na "Otevrit Builder" -> navigace na `/admin/widget/builder/:id`
- [ ] Builder: theme editace, device switcher, undo/redo
- [ ] Builder: ulozeni -> toast, isDirty false
- [ ] Builder: klavesove zkratky (Ctrl+Z, Ctrl+Y)
- [ ] `/w/:publicWidgetId` -- widget se renderuje (pokud aktivni a domena povolena)
- [ ] Plan limit -- nelze vytvorit vice widgetu nez dovoluje tarif

---

## 18. Budouci rozsireni (TODO)

- [ ] Server-side tenant resolution (nahrada hardcoded TENANT_ID)
- [ ] Server-side domain validation (nejen client-side)
- [ ] Specificke target origin v postMessage (nahrada `'*'`)
- [ ] Widget analytics (pocet zobrazeni, konverze)
- [ ] A/B testing mezi widgety
- [ ] Widget verze (snapshot theme pred zmenou)
- [ ] Export/import theme konfigurace
- [ ] Mobilni responsivita pro Builder
- [ ] Focus trap v modal dialozich
- [ ] Sjednoceni postMessage type nazvu (MODELPRICER_WIDGET_HEIGHT vs MODELPRICER_RESIZE)

---

## 19. Zaznamy pro Error Log

> Nasledujici zaznamy jsou urceny k pripojeni na konec `docs/claude/Design-Error_LOG.md`.

### [2026-02-13] [TOKEN] WidgetEmbed.jsx -- hardcoded TENANT_ID misto dynamickeho resolution
- **Kde:** `src/pages/widget/WidgetEmbed.jsx:14`
- **Symptom:** `const TENANT_ID = 'test-customer-1'` pouzivan pro vsechny widget embed requesty. V multi-tenant prostredi by vsechny widgety ukazovaly na jednoho tenanta.
- **Pricina:** Demo-only zjednoduseni (Varianta A). Komentar v kodu toto priznavaz.
- **Oprava:** Implementovat tenant resolution z URL, tokenu nebo hostname mappingu.
- **Pouceni:** Invariant #3 z CLAUDE.md: "Tenant-scoped storage -- zadny hardcode tenantId."

### [2026-02-13] [TOKEN] WidgetPreview.jsx -- stejny hardcoded TENANT_ID
- **Kde:** `src/pages/widget/WidgetPreview.jsx:15`
- **Symptom:** Stejny problem jako WidgetEmbed -- `const TENANT_ID = 'test-customer-1'`.
- **Pricina:** Stejna pricina jako WidgetEmbed.
- **Oprava:** Stejna oprava.
- **Pouceni:** Sdileny problem mezi dvema soubory -- opravovat najednou.

### [2026-02-13] [TOKEN] PostMessage type nekonzistence -- MODELPRICER_WIDGET_HEIGHT vs MODELPRICER_RESIZE
- **Kde:** `src/pages/widget/WidgetEmbed.jsx:40` vs `src/pages/admin/components/WidgetEmbedTab.jsx:30`
- **Symptom:** WidgetEmbed odesila `type: 'MODELPRICER_WIDGET_HEIGHT'`, ale generovany embed kod posloucha `type: 'MODELPRICER_RESIZE'`. Tyto nazvy se lisi -- auto-resize nebude fungovat pokud zakaznik pouzije embed kod z tabu.
- **Pricina:** Dva ruzne vyvojove cykly bez synchronizace nazvu zprav.
- **Oprava:** Sjednotit na jeden nazev (napr. `MODELPRICER_RESIZE`) a aktualizovat WidgetEmbed.jsx. Pripadne prijimaci stranu updatovat aby akceptovala oba.
- **Pouceni:** PostMessage types musi byt definovany jako konstanty ve sdilem modulu, ne hardcoded stringy v ruznych souborech.

### [2026-02-13] [TOKEN] WidgetEmbed.jsx -- postMessage target origin '*' (bezpecnostni riziko)
- **Kde:** `src/pages/widget/WidgetEmbed.jsx:41`
- **Symptom:** `window.parent?.postMessage(..., '*')` odesila zpravy na libovolny origin. Utocnik muze vlozit iframe a odposlouchavat vyskove zpravy.
- **Pricina:** Zjednoduseni pro demo -- v produkci neni znamy parent origin bez server-side konfigurace.
- **Oprava:** Pouzivat `document.referrer` origin jako target (jak to dela WidgetPublicPage.jsx v `getTargetOrigin()`), nebo nacist povolene originy z widget konfigurace.
- **Pouceni:** PostMessage vzdy posilat s co nejpresnejsim target origin. `'*'` pouzivat jen kdyz je absolutne nutne (napr. initial handshake).

### [2026-02-13] [WCAG] AdminWidget -- modal bez focus trap
- **Kde:** `src/pages/admin/AdminWidget.jsx:664-718` (create modal)
- **Symptom:** Modal pro vytvoreni widgetu nema focus trap. Uzivatel muze tabovat ven z modalu na elementy pod overlay. Escape klaves nezavira modal.
- **Pricina:** Modal implementovan jako jednoduchy overlay s click-outside zavrenim, bez keyboard accessibiliy.
- **Oprava:** (1) Pridat focus trap (prvni a posledni focusable element cykluji). (2) Pridat Escape handler pro zavreni. (3) Pridat `role="dialog"` a `aria-modal="true"` na modal. (4) Nastavit focus na prvni input pri otevreni (uz funguje -- autoFocus).
- **Pouceni:** Vsechny modalni dialogy MUSI implementovat focus trap + Escape zavreni (WAI-ARIA Dialog pattern).

### [2026-02-13] [WCAG] AdminWidget -- widget card list bez semantickych ARIA roles
- **Kde:** `src/pages/admin/AdminWidget.jsx:459-541` (card list)
- **Symptom:** Seznam widgetu je vizualne klikatelny seznam karet ale nema `role="listbox"` nebo `role="list"` semantiku. Karty nemaji `role="option"` nebo `role="listitem"`. Screen reader nerozpozna ze se jedna o vyberovy seznam.
- **Pricina:** Karty implementovany jako `<div onClick>` bez ARIA semantiky.
- **Oprava:** Pridat `role="listbox"` na wrapper, `role="option"` + `aria-selected={isSelected}` na kazdy card div. Alternativne pouzit `role="radiogroup"` s `role="radio"` pokud je vyber exkluzivni.
- **Pouceni:** Interaktivni seznamy s vyberem jedne polozky by mely pouzivat listbox/option nebo radiogroup/radio ARIA pattern.
