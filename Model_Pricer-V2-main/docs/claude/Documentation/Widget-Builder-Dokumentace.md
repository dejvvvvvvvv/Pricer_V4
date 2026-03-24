# Widget Builder — Dokumentace

> Vizualni editor pro kastomizaci kalkulacky widgetu. Inspirovany VvvebJs, nabizi 3-panelovy
> layout s drag-and-drop, block systemem, theme presety a device preview.

**Route:** `/admin/widget/builder/:id`
**Pristup:** Admin panel -> Widget -> "Otevrit Builder" tlacitko
**Renderovani:** MIMO AdminLayout (fullscreen rezim, 100vh)
**Posledni aktualizace:** 2026-03-21

---

## Obsah

1. [Prehled](#1-prehled)
2. [Architektura](#2-architektura)
3. [Klicove soubory](#3-klicove-soubory)
4. [Block system](#4-block-system)
5. [Theme presety](#5-theme-presety)
6. [Template system](#6-template-system)
7. [Property editory](#7-property-editory)
8. [Interakce](#8-interakce)
9. [Device preview](#9-device-preview)
10. [Zname problemy](#10-zname-problemy)

---

## 1. Prehled

Widget Builder je vizualni WYSIWYG editor pro kastomizaci embedovatelne kalkulacky widgetu.
Umoznuje admin uzivatelum upravovat vzhled, rozlozeni a obsah widgetu bez psani kodu.

### Klicove vlastnosti

- **3-panelovy layout** inspirovany VvvebJs / Figma / Webflow
- **32 bloku** ve 4 kategoriich (Calculator, Layout, Content, Form)
- **12 theme presetu** ve 3 kategoriich (Light, Dark, Colored)
- **8 predpripravenych sablon** pro rychly start
- **Drag and drop** (nativni HTML5 API, bez knihoven)
- **Undo/Redo** s historii az 50 kroku pro theme a 30 kroku pro layout
- **Auto-save** s debounce (2s) + manualni save (Ctrl+S)
- **Device preview** (mobile 360px, tablet 768px, desktop 1280px)
- **Keyboard shortcuts** (Ctrl+Z/Y/S/C/V/D, Delete, Escape, sipky)
- **Onboarding overlay** pro prvni navstevu
- **Import/Export** layout jako JSON
- **Kontextove menu** s 12 akcemi na kazdem elementu
- **Floating toolbar** nad vybranym elementem
- **Layers panel** s drag-and-drop razenim

### Vizualni schema layoutu

```
+------------------------------------------------------------------+
|                          TOP BAR                                  |
|  Back | Widget Name | Step Tabs | Devices | Undo/Redo | Save     |
+----------+-----------------------------+-------------------------+
|          |                             |                         |
|  LEFT    |        CANVAS               |     RIGHT               |
|  PANEL   |        (Preview)            |     PANEL               |
|          |                             |                         |
| Blocks   |   +-------------------+    |  Content                |
| Layers   |   |   Widget          |    |  Style                  |
| Style    |   |   Preview         |    |  Advanced               |
| Global   |   |   (live)          |    |                         |
| Templates|   +-------------------+    |  [Props vybraneho       |
|          |                             |   elementu]             |
+----------+-----------------------------+-------------------------+
|  BOTTOM BAR: Breadcrumb (body > section > element)               |
+------------------------------------------------------------------+
```

---

## 2. Architektura

### 2.1 Hook kompozice

Hlavni architektonicky vzor je **hook kompozice** — `useBuilderState` je top-level hook
ktery kombinuje tri specializovane hooky + lokalni UI stav:

```
useBuilderState (top-level)
  |
  +-- useUndoRedo          (theme historie, undo/redo, isDirty)
  |     - past/future stacky v refs (minimalni re-renders)
  |     - max 50 undo kroku (FIFO)
  |     - lastAction pro UI feedback (toast)
  |     - setWithoutHistory pro live preview (debounced commit)
  |
  +-- useElementSelection  (selectedId, hoveredId, keyboard nav)
  |     - Escape: deselect
  |     - Delete/Backspace: smazat/skryt element
  |     - ArrowUp/Down: navigace mezi elementy
  |
  +-- useLayoutState       (element ordering, visibility, custom blocks, presets)
  |     - Vlastni undo/redo stack (max 30 kroku)
  |     - elementOrder, hiddenElements, customBlocks, sizeOverrides
  |     - Preset application + reset
  |
  +-- useDragAndDrop       (HTML5 DnD, palette + reorder mody)
  |     - "palette" mod: drag noveho bloku z leveho panelu
  |     - "reorder" mod: presun existujiciho elementu na canvasu
  |
  +-- lokalni UI stav
        - deviceMode (mobile/tablet/desktop)
        - currentStep (1-5)
        - leftPanelTab, rightPanelTab
        - panel visibility + widths (resizable)
        - zoom, editingTextId
        - auto-save status
```

### 2.2 Datovy tok

```
Widget Storage (localStorage)
  |
  v
useBuilderState (load on mount)
  |
  +-- theme: objekt s 56 CSS vlastnostmi
  |     |
  |     +-- themeToCssVars() --> CSS promenne na canvasu
  |     +-- updateThemeProperty() --> single key update + undo entry
  |     +-- setThemeBulk() --> bulk update (1 undo entry)
  |
  +-- layout: { elementOrder, hiddenElements, customBlocks, sizeOverrides, activePresetId }
  |     |
  |     +-- moveElement() / reorderElements() --> zmena poradi
  |     +-- toggleElementVisibility() --> skryti/zobrazeni
  |     +-- addCustomBlock() / removeCustomBlock() --> vlastni bloky
  |     +-- applyPreset() --> aplikace layout presetu
  |
  +-- auto-save (2s debounce) --> updateWidget(tenantId, widgetId, { themeConfig, layoutConfig, name })
```

### 2.3 Renderovaci hierarchie

```
BuilderPage (hlavni layout, 100vh, CSS Grid)
  |
  +-- BuilderTopBar
  |     +-- StepNavigator (kroky 1-5)
  |     +-- Device switcher (mobile/tablet/desktop)
  |     +-- UndoRedoIndicator
  |     +-- SaveStatusIndicator
  |
  +-- BuilderLeftPanel
  |     +-- Tabs: Blocks | Layers | Style | Global | Templates
  |     +-- BlockLibrary (drag-and-drop bloku)
  |     +-- LayersPanel (vizualni strom elementu)
  |     +-- StyleTab (editory pro vybrany element)
  |     +-- GlobalTab (globalni theme nastaveni)
  |     +-- LayoutSwitcher (preset layouts)
  |     +-- TemplateGallery (8 sablon)
  |
  +-- BuilderCanvas (stredni panel)
  |     +-- DevicePreviewFrame (device mockup)
  |     +-- BuilderElementRenderer (live preview elementu)
  |     +-- FloatingToolbar (nad vybranym elementem)
  |     +-- ElementContextMenu (prave tlacitko mysi)
  |     +-- Drop indicators (DnD vizualizace)
  |
  +-- BuilderPropertyPanel (pravy panel, podminkovy)
  |     +-- PropertyEditorFactory (dispatch na spravny editor)
  |     +-- 12 specializovanych editoru
  |
  +-- BreadcrumbBar (spodni lista, cesta k elementu)
  +-- OnboardingOverlay (prvni navsteva)
  +-- PreviewMode (fullscreen overlay)
  +-- BuilderToastContainer (notifikace)
```

---

## 3. Klicove soubory

### 3.1 Hlavni soubory

| Soubor | Popis | Radku (cca) |
|--------|-------|-------------|
| `BuilderPage.jsx` | Hlavni layout, event handlery, keyboard shortcuts | 970 |

### 3.2 Hooks

| Soubor | Popis |
|--------|-------|
| `hooks/useBuilderState.js` | Top-level kompozicni hook — theme, layout, selection, persistence, import/export |
| `hooks/useUndoRedo.js` | Genericka undo/redo logika s refs (past/future stacky, max 50 kroku) |
| `hooks/useElementSelection.js` | Vyber a hover elementu, keyboard navigace (Escape, Delete, sipky) |
| `hooks/useLayoutState.js` | Element ordering, visibility, custom blocks, presets, vlastni undo/redo (max 30) |
| `hooks/useDragAndDrop.js` | HTML5 DnD — palette (novy blok) + reorder (existujici element) |

### 3.3 Blocks (definice bloku)

| Soubor | Popis |
|--------|-------|
| `blocks/index.js` | Centraln registr — ALL_BLOCKS, ELEMENT_TO_BLOCK_MAP, lookup funkce |
| `blocks/calculatorBlocks.js` | 12 bloku: 6 locked core + 6 volitelnych |
| `blocks/layoutBlocks.js` | 6 bloku: section, row, column, spacer, divider, card |
| `blocks/contentBlocks.js` | 8 bloku: heading, text, image, button, badge, icon, alert, list |
| `blocks/formBlocks.js` | 6 bloku: text-input, select-input, checkbox, radio-group, textarea, number-input |
| `blocks/lockedElements.js` | 6 locked bloku, constraint checkery (canDelete, canReposition, canRestyle) |
| `blocks/defaultLayouts.js` | DEFAULT_STEP_LAYOUTS, LAYOUT_PRESETS, step info |

### 3.4 Config

| Soubor | Popis |
|--------|-------|
| `config/themePresets.js` | 12 theme presetu ve 3 kategoriich, kazdy s 56 vlastnostmi |
| `config/templateLayouts.js` | 8 kalkulackovych sablon s elementy per step + theme reference |
| `config/elementRegistry.js` | ELEMENT_REGISTRY — legacy element definice, HIDEABLE_ELEMENTS |
| `config/presetLayouts.js` | Layout preset konfigurace (element order + visibility) |
| `config/blockLibrary.js` | Block palette konfigurace pro levy panel |
| `config/quickThemes.js` | Quick theme dropdown presety (kompletni 56-vlastnostni objekty) |
| `config/onboardingSteps.js` | Kroky onboarding overlay pro prvni navstevu |
| `config/builderMockData.js` | Mock data pro development |

### 3.5 Komponenty

| Soubor | Popis |
|--------|-------|
| `components/BuilderTopBar.jsx` | Horni lista — nazev, kroky, devices, undo/redo, save |
| `components/BuilderLeftPanel.jsx` | Levy panel s taby (Blocks, Layers, Style, Global, Templates) |
| `components/BuilderCanvas.jsx` | Stredni oblast — canvas s device frame a DnD |
| `components/BuilderPropertyPanel.jsx` | Pravy panel — property editory pro vybrany element |
| `components/BuilderRightPanel.jsx` | Wrapper pro pravy panel |
| `components/BuilderElementRenderer.jsx` | Renderovani elementu v live preview |
| `components/BuilderColorPicker.jsx` | Color picker komponenta |
| `components/BuilderToast.jsx` | Toast notifikacni system (useBuilderToast hook) |
| `components/BlockLibrary.jsx` | Knihovna bloku pro drag-and-drop |
| `components/LayersPanel.jsx` | Vizualni strom elementu s razenim |
| `components/LayerRow.jsx` | Jeden radek v layers panelu |
| `components/DevicePreviewFrame.jsx` | Device frame wrapper pro canvas |
| `components/DeviceFrame.jsx` | Device mockup vizualizace (iPhone, iPad, Browser) |
| `components/ElementToolbar.jsx` | Toolbar pro element akce |
| `components/FloatingToolbar.jsx` | Floating toolbar nad vybranym elementem |
| `components/ElementContextMenu.jsx` | Kontextove menu (prave tlacitko) |
| `components/DraggableElement.jsx` | Obalka pro draggable elementy |
| `components/DragOverlayElement.jsx` | Overlay behem DnD operace |
| `components/StepNavigator.jsx` | Navigace mezi kroky (1-5) v top baru |
| `components/LayoutSwitcher.jsx` | Prepinac layout presetu |
| `components/GlobalThemePanel.jsx` | Panel pro globalni theme nastaveni |
| `components/QuickThemeDropdown.jsx` | Dropdown pro rychle prepnuti theme |
| `components/ThemePresetCard.jsx` | Karta jednoho theme presetu |
| `components/ThemePreviewMini.jsx` | Miniatura nahledu theme |
| `components/TemplateGallery.jsx` | Galerie sablon s filtrovanim |
| `components/TemplatePreviewCard.jsx` | Karta jedne sablony |
| `components/PreviewMode.jsx` | Fullscreen preview overlay |
| `components/OnboardingOverlay.jsx` | Onboarding pro prvni navstevu |
| `components/SaveStatusIndicator.jsx` | Indikator stavu ukladani (idle/saving/saved) |
| `components/UndoRedoIndicator.jsx` | Vizualni indikator undo/redo stavu |

### 3.6 Tabs (levy panel)

| Soubor | Popis |
|--------|-------|
| `components/tabs/StyleTab.jsx` | Tab pro editaci stylu vybraneho elementu |
| `components/tabs/GlobalTab.jsx` | Tab pro globalni theme nastaveni |
| `components/tabs/ElementsTab.jsx` | Tab pro seznam elementu |
| `components/tabs/ContentTab.jsx` | Tab pro editaci obsahu |
| `components/tabs/AdvancedTab.jsx` | Tab pro pokrocila nastaveni |

### 3.7 Property editory

| Soubor | Popis |
|--------|-------|
| `components/editors/PropertyEditorFactory.jsx` | Dispatcher — vybira spravny editor dle typu property |
| `components/editors/ColorPropertyEditor.jsx` | Barva (color picker + hex input) |
| `components/editors/NumberPropertyEditor.jsx` | Cislo (slider + input + unit) |
| `components/editors/TextPropertyEditor.jsx` | Text (input / textarea) |
| `components/editors/BooleanPropertyEditor.jsx` | Boolean (toggle/switch) |
| `components/editors/SelectPropertyEditor.jsx` | Vyber z moznosti (dropdown) |
| `components/editors/SpacingEditor.jsx` | Spacing (margin/padding, 4 strany) |
| `components/editors/FontEditor.jsx` | Font (rodina, velikost, vaha) |
| `components/editors/BorderEditor.jsx` | Ramecek (sirka, barva, styl, radius) |
| `components/editors/ShadowEditor.jsx` | Stin (none/subtle/medium/strong presety) |
| `components/editors/AlignmentEditor.jsx` | Zarovnani (left/center/right/justify) |
| `components/editors/OpacityEditor.jsx` | Pruhlednost (slider 0-100%) |
| `components/editors/BackgroundEditor.jsx` | Pozadi (barva + gradient) |
| `components/editors/CodeEditor.jsx` | Editor kodu (custom CSS) |
| `components/editors/CSSPreview.jsx` | Nahled vygenerovaneho CSS |

### 3.8 Styly

| Soubor | Popis | Radku (cca) |
|--------|-------|-------------|
| `styles/WidgetBuilder.css` | Hlavni CSS — vsechny `wb-*` tridy | 2609 |
| `styles/builder-tokens.css` | CSS custom properties (design tokeny) | ~100 |

---

## 4. Block system

### 4.1 Prehled

Builder pouziva **block system** pro definici vsech vizualnich elementu. Kazdy blok ma:

- `id` — unikatni identifikator (napr. `'upload-zone'`, `'heading'`)
- `name` / `nameCs` — zobrazovane jmeno (EN / CS)
- `category` — kategorie (`'calculator'` | `'layout'` | `'content'` | `'form'`)
- `step` — cislo kroku kde se blok primarne pouziva (1-5), nebo `null` pro floating bloky
- `icon` — Lucide ikona pro paletu
- `locked` — zda blok nelze smazat (true pro core kalkulackove bloky)
- `editableProperties` — pole definic editovatelnych vlastnosti
- `defaultProps` — vychozi hodnoty vlastnosti

### 4.2 Kategorie (4 kategorie, 32 bloku)

| Kategorie | Pocet | Bloky |
|-----------|-------|-------|
| **Calculator** | 12 | `upload-zone`*, `model-viewer`*, `print-config`*, `price-breakdown`*, `checkout-form`*, `order-confirmation`*, `coupon-input`, `express-tier`, `upsell-panel`, `shipping-selector`, `shopify-cart-button`, `promo-bar` |
| **Layout** | 6 | `section`, `row`, `column`, `spacer`, `divider`, `card` |
| **Content** | 8 | `heading`, `text`, `image`, `button`, `badge`, `icon`, `alert`, `list` |
| **Form** | 6 | `text-input`, `select-input`, `checkbox`, `radio-group`, `textarea`, `number-input` |

*Oznacene hvezdickou = **locked** bloky (nelze smazat).

### 4.3 Locked elementy (6 bloku)

Tyto bloky jsou kriticke pro funkcnost kalkulacky a **nelze je smazat**:

| Locked Block | Ucel |
|-------------|------|
| `upload-zone` | Nahrani 3D modelu |
| `model-viewer` | 3D nahled modelu |
| `print-config` | Konfigurace tisku (material, kvalita) |
| `price-breakdown` | Rozpis ceny |
| `checkout-form` | Objednavkovy formular |
| `order-confirmation` | Potvrzeni objednavky |

Tri urovne omezeni:
1. **LOCKED_DELETE** — nelze smazat (ale lze presunout a stylovat)
2. **FIXED_POSITION** — nelze presunout (aktualne prazdne)
3. **LOCKED_RESTYLE** — nelze stylovat (aktualne prazdne)

### 4.4 ELEMENT_TO_BLOCK_MAP

Mapovani mezi legacy element registry IDs a block registry IDs:

```
Element Registry ID  -->  Block Registry ID
'upload'             -->  'upload-zone'
'viewer'             -->  'model-viewer'
'config'             -->  'print-config'
'pricing'            -->  'price-breakdown'
'cta'                -->  'checkout-form'
```

Elementy bez mapovani (`header`, `steps`, `footer`, `fees`, `background`) pouzivaji
legacy ELEMENT_REGISTRY cestu v StyleTab.

### 4.5 Block instance

Nove bloky pridane uzivatelem se vytvari pres `createBlockInstance()`:

```
{
  instanceId: 'bi_{UUID}',     // unikatni ID instance (crypto.randomUUID)
  blockId: 'heading',          // reference na block definici
  type: 'heading',             // typ bloku
  position: 3,                 // pozice v elementOrder
  props: { ... },              // merge defaultProps
  visible: true,
  locked: false,
}
```

Custom block instance se ukladaji v `layout.customBlocks` poli.

---

## 5. Theme presety

### 5.1 Prehled

Theme system ridi vizualni vzhled widgetu pres **56 CSS vlastnosti**. Kazda zmena je
trackována v undo/redo historii.

### 5.2 Kategorie presetu (3 kategorie, 12 presetu)

| Kategorie | Presety |
|-----------|---------|
| **Light** (4) | Modern Light, Minimalist, Classic Business, Playful |
| **Dark** (3) | Modern Dark, Bold & Dark, Tech Startup |
| **Colored** (5) | Industrial, Ocean Blue, Sunset Orange, Forest Green, Purple Haze |

### 5.3 Theme vlastnosti (56 properties)

Kazdy preset definuje kompletni sadu 56 vlastnosti seskupenych do oblasti:

| Oblast | Pocet | Priklady |
|--------|-------|----------|
| Zakladni barvy | 7 | `backgroundColor`, `cardColor`, `headerColor`, `textColor`, `mutedColor`, `borderColor`, `fontFamily` |
| Tlacitka | 6 | `buttonPrimaryColor`, `buttonTextColor`, `buttonHoverColor`, `buttonBorderRadius`, `buttonPaddingY`, `buttonFontSize` |
| Inputy | 3 | `inputBgColor`, `inputBorderColor`, `inputFocusColor` |
| Header | 5 | `headerBgColor`, `headerLogoSize`, `headerPadding`, `headerAlignment`, `headerTaglineVisible` |
| Upload zona | 5 | `uploadBgColor`, `uploadBorderColor`, `uploadBorderHoverColor`, `uploadIconColor`, `uploadBorderStyle` |
| Stepper | 4 | `stepperActiveColor`, `stepperCompletedColor`, `stepperInactiveColor`, `stepperProgressVisible` |
| Konfigurace | 2 | `configBgColor`, `configLabelColor` |
| Fees | 2 | `feesBgColor`, `feesCheckboxColor` |
| Souhrn | 4 | `summaryBgColor`, `summaryHeaderColor`, `summaryDividerColor`, `summaryTotalBgColor` |
| Footer | 3 | `footerBgColor`, `footerTextColor`, `footerLinkColor` |
| Typografie | 3 | `headingFontFamily`, `codeFontFamily`, `fontFamily` |
| Vizualni | 5 | `cornerRadius`, `cardShadow`, `buttonShadow`, `globalPadding`, `summaryTotalFontSize` |
| Skeleton | 2 | `skeletonBaseColor`, `skeletonShineColor` |
| Textovy obsah | 6 | `textHeaderTitle`, `textHeaderTagline`, `textUploadTitle`, `textUploadDescription`, `textUploadButton`, `textCtaButton` |

### 5.4 QuickThemeDropdown

`QuickThemeDropdown` komponenta v top baru umoznuje rychle prepnuti celeho theme presetu
jednim kliknutim. Pouziva `setThemeBulk()` pro jedinou undo polozku.

### 5.5 Detekce aktivniho presetu

`detectActivePreset(theme)` porovnava 5 klicovych vlastnosti (`backgroundColor`,
`buttonPrimaryColor`, `headerColor`, `cardColor`, `borderColor`) s kazdym presetem.
Pokud se vsechny shoduji, vrati ID presetu; jinak vrati `null` (= custom theme).

---

## 6. Template system

### 6.1 Prehled

Templates jsou predpripravene konfigurace kalkulacky kombinujici layout (elementy per step)
a odkaz na theme preset. Uzivatel je aplikuje z TemplateGallery.

### 6.2 Sablony (8 sablon, 5 kategorii)

| ID | Nazev | Kategorie | Theme | Popis |
|----|-------|-----------|-------|-------|
| `standard-3d` | Standard 3D Print | recommended | modern-light | Plna 5-krokova kalkulacka se vsemi funkcemi |
| `quick-quote` | Quick Quote | minimal | minimalist | 3-krokovy tok bez checkout kroku |
| `compact` | Compact | minimal | minimalist | Minimalni design jen se zaklady |
| `sales-focused` | Sales Focused | sales | sunset-orange | Konverzne optimalizovana s promo/upselly |
| `professional` | Professional | recommended | classic-business | Business orientovana s detailnim rozpisem |
| `shopify-integration` | Shopify Integration | integration | modern-light | Optimalizovana pro Shopify kosik |
| `material-comparison` | Material Comparison | specialized | industrial | Zdurazneny vyber materialu |
| `express-service` | Express Service | specialized | bold-dark | Zduraznene express doruceni |

### 6.3 Kategorie sablon

- **Recommended** — doporucene pro vetsi pouziti
- **Minimal** — minimalisticky pristup
- **Sales** — prodejne orientovane
- **Integration** — integrace s externi platformou
- **Specialized** — specializovane use cases
- **All** — filtr pro vsechny

### 6.4 Validace sablon

Kazda sablona **MUSI** obsahovat vsech 6 locked bloku (`upload-zone`, `model-viewer`,
`print-config`, `price-breakdown`, `checkout-form`, `order-confirmation`) rozprostrzenych
pres kroky. Funkce `validateTemplate()` overi splneni tohoto pravidla.

### 6.5 TemplateGallery

`TemplateGallery` komponenta zobrazuje sablony s filtrovanim dle kategorie.
Kazda sablona ma `TemplatePreviewCard` s nazvem, popisem, tagy a tlacitkem pro aplikaci.

---

## 7. Property editory

### 7.1 PropertyEditorFactory

`PropertyEditorFactory` je centralni dispatcher ktery na zaklade property `type`
vybere a vyrenderuje spravny editor. Vsechny editory prijimaji bilingualni labely
(`label` + `labelCs`) pro CZ/EN zobrazeni.

### 7.2 Typy editoru (12 + 2 specialni)

| Typ | Editor | Popis |
|-----|--------|-------|
| `color` | ColorPropertyEditor | Color picker s hex inputem a pruhlednosti |
| `number` | NumberPropertyEditor | Slider + input s min/max/step/unit |
| `text` | TextPropertyEditor | Text input nebo textarea (dle klice) |
| `boolean` | BooleanPropertyEditor | Toggle / switch prepinac |
| `select` | SelectPropertyEditor | Dropdown s predem definovanymi moznostmi |
| `spacing` | SpacingEditor | 4-stranny editor pro margin/padding |
| `font` | FontEditor | Font family + size + weight |
| `border` | BorderEditor | Sirka + barva + styl + radius |
| `shadow` | ShadowEditor | Presety: none / subtle / medium / strong |
| `alignment` | AlignmentEditor | Left / center / right / justify tlacitka |
| `opacity` | OpacityEditor | Slider 0-100% |
| `background` | BackgroundEditor | Barva + gradient moznosti |
| — | CodeEditor | Custom CSS editor (specialni, ne v factory) |
| — | CSSPreview | Read-only nahled vygenerovaneho CSS |

### 7.3 Spolecne vlastnosti editoru

Kazdy editor:
- Prijima `label` (EN) a `labelCs` (CS) pro bilingualni zobrazeni
- Prijima `value`, `onChange`, `defaultValue`
- Ma reset-to-default tlacitko (vola `onReset`)
- Pouziva `wb-*` CSS tridy pro konzistentni styling

---

## 8. Interakce

### 8.1 Vyber elementu

Kliknuti na element na canvasu ho vybere. Vybrany element:
- Zobrazi se s modrou obrysovou carou
- Otevre pravy panel s property editory
- Zobrazi floating toolbar nad elementem
- Aktualizuje breadcrumb bar

### 8.2 Kontextove menu (prave tlacitko, 12 akci)

| Akce | Popis |
|------|-------|
| `edit` | Otevri property editory (pravy panel + Style tab) |
| `copy` | Kopiruj element do schranky |
| `paste` | Vloz element ze schranky |
| `duplicate` | Duplikuj element (novy za originalom) |
| `moveUp` | Posun o 1 pozici nahoru |
| `moveDown` | Posun o 1 pozici dolu |
| `moveToTop` | Posun na zacatek |
| `moveToBottom` | Posun na konec |
| `toggleVisibility` | Zobraz/skryj element |
| `resetStyles` | Reset stylu na default |
| `delete` | Smaz element (ne pro locked) |

### 8.3 Floating toolbar

Floating toolbar se zobrazi nad vybranym elementem a nabizi rychly pristup
k nejcastejsim akcim (edit, duplicate, delete, visibility, move).

### 8.4 Drag and drop (HTML5 API)

Dva mody:
1. **Palette drag** — pretazeni noveho bloku z leveho panelu na canvas
   - `e.dataTransfer.setData('application/builder-block', JSON.stringify(blockData))`
   - `effectAllowed = 'copy'`
2. **Reorder drag** — presun existujiciho elementu v ramci canvasu
   - `e.dataTransfer.setData('text/plain', elementId)`
   - `effectAllowed = 'move'`

Drop indicator zobrazuje vizualni caru na miste kam element spadne.

### 8.5 Keyboard shortcuts

| Zkratka | Akce |
|---------|------|
| `Ctrl+Z` | Undo (theme + layout) |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Manualni save (bypass auto-save debounce) |
| `Ctrl+C` | Kopiruj element |
| `Ctrl+V` | Vloz element |
| `Ctrl+D` | Duplikuj element |
| `Delete` / `Backspace` | Smaz vybrany element (ne locked) |
| `Escape` | Zrus vyber elementu |
| `ArrowUp` / `ArrowDown` | Navigace mezi elementy |

Vsechny keyboard shortcuts jsou ignorovany kdyz je focus v INPUT, TEXTAREA
nebo contentEditable elementu.

### 8.6 Toast notifikace

`BuilderToastContainer` + `useBuilderToast()` hook pro zobrazeni kratkych zprav:
- Info (modra): kopiruj, vloz, undo/redo feedback
- Success (zelena): duplikace, vlozeni
- Warning (oranzova): pokus o smazani locked elementu
- Auto-dismiss po nastavenem casu (typicky 2000-2500ms)

---

## 9. Device preview

### 9.1 Rezimy (3 velikosti)

| Rezim | Sirka | Popis |
|-------|-------|-------|
| **Mobile** | 360px | iPhone SE viewport |
| **Tablet** | 768px | iPad viewport |
| **Desktop** | 1280px | Standardni desktop |

### 9.2 DeviceFrame mockupy

`DeviceFrame` komponenta obaluje canvas obsah vizualnim mockupem zarizeni:
- **Mobile:** iPhone-style frame s notch, status bar, home indicator
- **Tablet:** iPad-style frame s tenkou obrubou
- **Desktop:** Browser-style frame s adresnim radkem a ovladaci lista

### 9.3 PreviewMode (fullscreen)

`PreviewMode` komponenta otevre fullscreen overlay s live preview widgetu.
Obsahuje:
- Device switcher (mobile/tablet/desktop)
- Step navigator (1-5)
- Zavirani tlacitko
- Renderuje skutecny `WidgetKalkulacka` komponent s `themeOverrides` a `previewMode={true}`
- Obaleny v `ErrorBoundary` pro zachyceni chyb

### 9.4 Canvas zoom

Canvas podporuje zoom (ovladany z top baru) pro priblizeni a oddaleni nahledy.
Hodnota zoom se uklada v `useBuilderState` a aplikuje se CSS transformaci.

---

## 10. Zname problemy

### 10.1 Element ID zobrazeni

V nekterych mistech UI (napr. Layers panel, property panel) se mohou zobrazovat
**raw element IDs** ve formatu `bi_{UUID}` misto lidsky citelnych nazvu.
Toto se tyka custom block instanci pridanych uzivatelem.

**Pricina:** Custom blocks pouzivaji `crypto.randomUUID()` jako instanceId
a ne vzdy se spravne resolvuje blizke pojmenovani.

### 10.2 Cross-step elementy v Layers panelu

Elementy ktere se zobrazuji napric vsemi kroky (napr. `header`, `steps`, `footer`)
se v Layers panelu radi do skupiny **"Vlastni bloky"** misto dedicovane
sekce pro globalni elementy.

**Pricina:** Layers panel pouziva jednoduchou logiku `isCustomBlock()` ktera
nerozlisuje mezi cross-step registry elementy a uzivatelskymi custom bloky.

### 10.3 Branding auto-apply

Pri prvnim otevreni builderu se automaticky aplikuji branding nastaveni
(primaryColor, businessName) pokud widget nema zadny themeConfig.
Toto muze byt neocekavane pokud uzivatel zacne od prazdneho widgetu.

### 10.4 Auto-save timing

Auto-save pouziva 2s debounce. Pri rychlych zmenach (napr. drag na color pickeru)
se muze stat ze intermediate stavy nejsou ulozeny. Pro live preview bez undo zaznamu
se pouziva `setWithoutHistory()` s debounced commitem.

---

## Souvisejici dokumenty

| Dokument | Popis |
|----------|-------|
| [Widget-Kalkulacka-Dokumentace.md](Widget-Kalkulacka-Dokumentace.md) | Embedovatelna widget kalkulacka (target editace) |
| [AdminWidget-Dokumentace.md](AdminWidget-Dokumentace.md) | Admin Widget config (vstupni bod do builderu) |
| [Forge-Design-System-Dokumentace.md](Forge-Design-System-Dokumentace.md) | Design tokeny a UI system |
| [Storage-Utilities-Dokumentace.md](Storage-Utilities-Dokumentace.md) | Tenant-scoped storage (persistence) |
