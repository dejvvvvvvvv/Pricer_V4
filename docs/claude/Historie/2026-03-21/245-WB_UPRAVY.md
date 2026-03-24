# 245-WB — UPRAVY — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 245-WB
- **Session:** S05
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 244-WB, 246-WB, 242-WB, 243-WB
- **Trigger:** Widget Builder Wave 4 — Agent 11 (Dev Server Verification) + Agent 12 (Code Editor + CSS Preview)

---

## Souhrn uprav

Agent 11 overil funkcnost dev serveru (localhost:4028), vsech rout a import chainu (AdminWidgetBuilder -> BuilderPage -> vsechny komponenty). Build prochazi s 0 chybami. Agent 12 implementoval pokrocily CSS editor (CodeEditor.jsx) s line numbers, syntax highlighting, auto-indent a bracket auto-closing, a live CSS preview komponentu (CSSPreview.jsx) se scoped styles a mini widget mockupem. AdvancedTab.jsx aktualizovan s integraci obou novych komponent plus Quick Snippets (9 patternu) a CSS Variables Reference (18 promennych).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | CodeEditor.jsx | Novy soubor | cele | Textarea CSS editor: line numbers, Tab->spaces, auto-indent, bracket closing, format/copy/reset, brace balance, dark theme |
| 2 | CSSPreview.jsx | Novy soubor | cele | Live CSS preview: scoped styles, mini widget mockup, error detection, toggle on/off |
| 3 | AdvancedTab.jsx | Zmeneno | vice sekci | Nahrazen plain textarea za CodeEditor, pridana CSSPreview, Quick Snippets (9), CSS Vars Reference (18) |

---

## Detailni zmeny

### 1. `CodeEditor.jsx`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Puvodni AdvancedTab mel jen plain textarea pro custom CSS — nedostatecne pro UX builderu

**Co se zmenilo:**
- Textarea-based CSS editor (ne externi knihovna — mensi bundle)
- Line numbers na levem okraji synchronizovane se scrollem
- Tab key vklada spaces (ne zmena focusu)
- Auto-indent po Enter (zachovava uroven odsazeni)
- Bracket auto-closing ( `{` automaticky prida `}` )
- Format tlacitko pro auto-formatovani CSS
- Copy to clipboard tlacitko
- Reset tlacitko pro navrat k vychozimu CSS
- Brace balance error detection (zvyrazneni neuzavrenych zavorek)
- Dark theme konzistentni s builder designem

---

### 2. `CSSPreview.jsx`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Uzivatel potrebuje videt live vysledek vlastniho CSS bez preskakovat do preview mode

**Co se zmenilo:**
- Live CSS preview panel vedle editoru
- Scoped styles (CSS aplikovan jen na preview, ne na cely builder)
- Mini widget mockup zobrazujici zakladni strukturu kalkulacky
- CSS error detection (zachyti syntax chyby)
- Toggle on/off pro skryti/zobrazeni preview

---

### 3. `AdvancedTab.jsx`

**Typ:** Zmeneno
**Radky:** vice sekci
**Duvod:** Integrace CodeEditor a CSSPreview do existujiciho Advanced tabu

**Co se zmenilo:**
- Pred: plain `<textarea>` pro custom CSS vstup
- Po: `<CodeEditor>` komponenta s plnou funkcionalitou
- Pridana `<CSSPreview>` komponenta pod editor
- Quick Snippets dropdown — 9 predpripravenych CSS patternu (border-radius, box-shadow, hover effects, gradient backgrounds, transitions, responsive media queries, atd.)
- CSS Variables Reference — 18 builder CSS promennych s popisem a hodnotami (--wb-primary, --wb-bg, --wb-text, atd.)

---

## Dopad zmen

- **Ovlivnene komponenty:** AdvancedTab (primo), BuilderPropertyPanel (neprime — AdvancedTab je child)
- **Breaking changes:** Ne — zpetne kompatibilni, CodeEditor akceptuje stejne props jako puvodni textarea
- **Nove zavislosti:** Zadne npm balicky — vse custom
- **Rizika:** Minimalni — CodeEditor je izolovan, CSSPreview pouziva scoped styles

---

## Testovani

- **Build:** npm run build — PASS (0 errors, overeno Agent 11)
- **Manual test:** Dev server localhost:4028 overeny, vsechny routy funkcni, import chain kompletni
- **Poznamky:** Agent 11 overil AdminWidgetBuilder -> BuilderPage -> vsechny komponenty

---
