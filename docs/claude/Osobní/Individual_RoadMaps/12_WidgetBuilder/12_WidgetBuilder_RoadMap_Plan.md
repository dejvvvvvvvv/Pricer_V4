# 12. Widget Builder (zakladni verze pro Beta) — Detailni RoadMap Plan

> **Stav:** 🟡 45% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** Branding (#13), Widget (#11)
> **Kdo na nem zavisi:** Widget embed (#11)

---

## Prehled

WYSIWYG editor pro vizualni customizaci widgetu. Firma si muze upravit vzhled kalkulacky ktera se embeduje na jejich web. Pro Beta staci **zjednodusenou verzi** — logo, texty, preset barvy.

**Hlavni soubor:** `src/pages/admin/widget-builder/BuilderPage.jsx`
**Route:** `/admin/widget-builder`

---

## Co je HOTOVO (✅)

### WYSIWYG editor (70%)
- [x] Fullscreen editor — BuilderPage.jsx
- [x] 10 core elementu (logo, text, barvy, layout atd.)
- [x] Drag&drop usporadani elementu
- [x] Undo/redo
- [x] Auto-save
- [x] Device preview (desktop/tablet/mobile)

### Quick themes (40%)
- [x] Zakladni preset barevna schemata
- [x] Omezeny vyber

---

## Co CHYBI / je potreba dodelat

### Faze 1: Stabilizace (Priorita: VYSOKA)

#### Ukol 1.1: Oprava BUILDER_MOCK stability
- **Soubor:** `src/pages/admin/widget-builder/BuilderPage.jsx`
- **Co udelat:**
  - [ ] Overit ze `useRef` fix pro BUILDER_MOCK je spravne implementovan (viz Memory: `useMemo` zpusoboval nestabilni ref)
  - [ ] Otestovat ze editor se necrashne pri rychlem prepinani
  - [ ] Otestovat ze undo/redo funguje stabilne
  - [ ] Otestovat auto-save — nepise prilis casto? (debounce)
- **Zname problemy:** `useMemo` pro BUILDER_MOCK zpusobooval nestabilni referenci → opraveno na `useRef`, ale obcas problemy pretrvavaji

#### Ukol 1.2: Memory leaks
- **Co udelat:**
  - [ ] Overit cleanup v useEffect hooks
  - [ ] Overit ze drag&drop event listenery se odpoji pri unmount
  - [ ] Profiling v Chrome DevTools (Memory tab)

### Faze 2: Zjednodusenou verzi pro Beta (Priorita: STREDNI)

#### Ukol 2.1: Skryt pokrocile moznosti
- **Co udelat:**
  - [ ] Identifikovat ktere elementy jsou "pokrocile" (custom CSS, advanced layout, animations)
  - [ ] Skryt je za "Advanced" toggle nebo je uplne odebrat pro Beta
  - [ ] Nechat jen zakladni: logo, text, barvy (3-5 elementu)

#### Ukol 2.2: Vice quick themes
- **Co udelat:**
  - [ ] Pridat 5-10 preset barevnych schemat:
    - [ ] Light (bile pozadi, tmave texty)
    - [ ] Dark (tmave pozadi, svetle texty)
    - [ ] Blue (modre akcenty)
    - [ ] Green (zelene akcenty)
    - [ ] Orange (oranzove akcenty)
    - [ ] Custom (vlastni barvy z branding)
  - [ ] Napojit na branding barvy firmy (automaticky custom theme)
  - [ ] Preview kazdeho theme pred aplikaci

#### Ukol 2.3: Embed snippet generovani
- **Co udelat:**
  - [ ] Po ulozeni konfigurace generovat embed snippet
  - [ ] Snippet obsahuje: `<script src="widget.js">`, `<div id="modelpricer-widget">`, config attributes
  - [ ] Tlacitko "Kopirovat snippet"
  - [ ] Navodna stranka jak vlozit na web
- **Zavislost:** Widget embed (#11)

### Faze 3: Pokrocile funkce (post-Beta)

#### Ukol 3.1: Custom CSS editor
- **Co udelat:**
  - [ ] Textovy editor pro vlastni CSS
  - [ ] Syntax highlighting
  - [ ] Preview zmen v realnem case

#### Ukol 3.2: Template marketplace (daleka budoucnost)
- **Co udelat:**
  - [ ] Sdileni templates mezi firmami
  - [ ] Import/export konfigurace

---

## Implementacni poradi

1. **Faze 1** (Stabilizace) — 2-3 hodiny
2. **Faze 2** (Beta verze) — 3-5 hodin
3. **Faze 3** (Pokrocile) — post-Beta

**Celkem pro Beta:** ~5-8 hodin

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/admin/widget-builder/BuilderPage.jsx` | Stabilizace, zjednoduseni | Stredni |
| Embed snippet logika | Nova funkcionalita | Maly |

---

## Poznamky

- **DULEZITE:** Pro Beta staci JEDNODUCHA verze — neprehaneet s featury
- **PAST:** `useMemo` pro BUILDER_MOCK → `useRef` (viz Memory)
- Widget Builder je "nice to have" pro Beta — firma muze pouzit default widget bez customizace

---

## Kriticke doplnky (z review)

### Builder stabilita — BUILDER_MOCK fix detail
- [ ] Problem: `useMemo` vytvarelo novou referenci pri kazdem renderovani kdyz dependencies nebyly stabilni
- [ ] Reseni: `useRef` s jednorazovou inicializaci:
  ```javascript
  const mockDataRef = useRef(null);
  if (!mockDataRef.current) {
    mockDataRef.current = createBuilderMockData();
  }
  ```
- [ ] Overit: DevTools Profiler → Highlight Updates → builder preview se nemusi re-rendovat pri kazdem keystroku
- [ ] Test: 20x rychle prepnout mezi elementy → zadny crash

### Embed snippet — presny format
- [ ] Generovany snippet pro firmu:
  ```html
  <!-- ModelPricer Widget -->
  <div id="modelpricer-widget"
       data-widget-id="abc123"
       data-theme="dark"
       data-lang="cs">
  </div>
  <script src="https://modelpricer.com/widget.js" async></script>
  ```
- [ ] Widget ID = `publicWidgetId` z tenant storage
- [ ] Atributy: `data-widget-id`, `data-theme` (dark/light), `data-lang` (cs/en), `data-height` (auto/fixed)
- [ ] `widget.js` vytvori iframe, nastavi src na `/w/{widgetId}`, nastavi sandbox atributy

### Plan gating pro Widget Builder
- [ ] Starter plan: default widget, zadna customizace
- [ ] Professional plan: plny builder, quick themes, barvy
- [ ] Enterprise plan: builder + custom CSS + multi-widget
- [ ] Gating check z tenant storage `plan` fielduu
