# 240-WB — UPRAVY — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 240-WB
- **Session:** S03
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 239-WB, 241-WB, 233-WB, 235-WB, 238-WB
- **Trigger:** Widget Builder Wave 3 — Agent 6 (Preview Mode + Step Navigation + Device Frames) a Agent 8 (Context Menu + Floating Toolbar + Keyboard Shortcuts)

---

## Souhrn uprav

Wave 3 implementace dvou agentu: Agent 6 pridal Preview Mode s full-screen overlayem, 5-krokovou navigaci a device frame mockupy (iPhone/iPad/Browser). Agent 8 pridal context menu s 12 akcemi, floating toolbar se 7 tlacitky a 10 klavesovych zkratek (Ctrl+C/V/D/Delete). Obe skupiny zmen integrovany do BuilderPage.jsx a BuilderCanvas.jsx.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | PreviewMode.jsx | Novy soubor | 1-~300 | Full-screen overlay, device frames, step navigation, dark/light toggle, share link, portal, animations |
| 2 | StepNavigator.jsx | Novy soubor | 1-~200 | 5-step navigation bar, ikony, badges, compact mode, per-step config |
| 3 | DeviceFrame.jsx | Novy soubor | 1-~250 | iPhone/iPad/Browser mockupy, realisticky chrome, notch, status bars |
| 4 | ElementContextMenu.jsx | Novy soubor | 1-~300 | 12-action right-click menu, keyboard nav, ARIA, viewport-aware |
| 5 | FloatingToolbar.jsx | Novy soubor | 1-~200 | 7-button toolbar, auto-positioning, drag handle, locked guards |
| 6 | BuilderTopBar.jsx | Zmeneno | vice sekci | Integrace StepNavigator, zoom controls, Preview/Export buttons |
| 7 | BuilderPage.jsx | Zmeneno | vice sekci | PreviewMode state, step configs, 10 action handlers, clipboard state, Ctrl+C/V/D/Delete shortcuts, unified dispatcher |
| 8 | BuilderElementRenderer.jsx | Zmeneno | vice sekci | Pridany onContextMenu handler |
| 9 | BuilderCanvas.jsx | Zmeneno | vice sekci | Context menu state, renders ElementContextMenu, drop indikatory |

---

## Detailni zmeny

### 1. `PreviewMode.jsx`

**Typ:** Novy soubor
**Radky:** 1-~300
**Duvod:** Uzivatel potrebuje videt realisticky nahled widgetu pred exportem

**Co se zmenilo:**
- Full-screen overlay pres cely builder (createPortal do document.body)
- 3 device frame varianty (iPhone, iPad, Browser) s realistickym chrome
- Step navigation pro prochazeni 5 kroku kalkulacky
- Dark/light mode toggle pro testovani obou temat
- Share link generovani
- Animace pro prechody mezi kroky
- Escape klavesa pro zavreni

---

### 2. `StepNavigator.jsx`

**Typ:** Novy soubor
**Radky:** 1-~200
**Duvod:** Navigace mezi 5 kroky widgetu v builderu i v preview

**Co se zmenilo:**
- 5-step navigation bar s ikonami pro kazdy krok
- Badges pro indikaci stavu (aktivni, dokonceny, s chybou)
- Compact mode pro pouziti v top baru
- Per-step konfigurace (nazev, ikona, barva)

---

### 3. `DeviceFrame.jsx`

**Typ:** Novy soubor
**Radky:** 1-~250
**Duvod:** Realisticky mockup zarizeni pro preview widgetu

**Co se zmenilo:**
- iPhone mockup s notch, status bar, home indikator
- iPad mockup s tabletovym chrome
- Browser mockup s adresni listou a toolbar ikonami
- Responzivni sizing

---

### 4. `ElementContextMenu.jsx`

**Typ:** Novy soubor
**Radky:** 1-~300
**Duvod:** Profesionalni right-click menu pro elementy na canvasu

**Co se zmenilo:**
- 12 akci: Copy, Paste, Duplicate, Delete, Move Up/Down, Lock/Unlock, Bring to Front/Back, Select Parent, Inspect
- Keyboard navigace (sipky, Enter, Escape)
- ARIA atributy pro pristupnost (role="menu", role="menuitem")
- Viewport-aware pozicinovani (menu se nezobrazi mimo obrazovku)
- Locked element guard (nebezpecne akce disablovany pro LOCKED elementy)

---

### 5. `FloatingToolbar.jsx`

**Typ:** Novy soubor
**Radky:** 1-~200
**Duvod:** Rychly pristup k castym akcim nad vybranym elementem

**Co se zmenilo:**
- 7 akci: Duplicate, Delete, Move Up/Down, Lock/Unlock, Align, Style Reset
- Auto-positioning nad vybranym elementem
- Drag handle pro presun toolbaru
- Locked element guards (destruktivni akce disabled)

---

### 6. `BuilderTopBar.jsx`

**Typ:** Zmeneno
**Radky:** vice sekci
**Duvod:** Integrace StepNavigator a novych ovladacich prvku

**Co se zmenilo:**
- Import a render StepNavigator komponenty
- Nove zoom controls (zoom in/out/reset, slider)
- Preview button — otvira PreviewMode
- Export button — otvira export dialog
- Pred: Zakladni top bar s step taby a device switcherem
- Po: Kompletni top bar se StepNavigator, zoom, preview a export

---

### 7. `BuilderPage.jsx`

**Typ:** Zmeneno
**Radky:** vice sekci
**Duvod:** Centralni koordinator Wave 3 — preview state, akce, klavesove zkratky

**Co se zmenilo:**
- PreviewMode state management (isPreviewOpen, currentPreviewStep)
- Step configs pro vsech 5 kroku (nazev, ikona, barva, obsah)
- 10 action handlers: handleCopy, handlePaste, handleDuplicate, handleDelete, handleMoveUp, handleMoveDown, handleLock, handleUnlock, handleBringToFront, handleSendToBack
- Clipboard state (copiedElement, clipboardData)
- 10 keyboard shortcuts: Ctrl+C (copy), Ctrl+V (paste), Ctrl+D (duplicate), Delete (smazat), Ctrl+Z (undo), Ctrl+Shift+Z (redo), Escape (deselect)
- Unified dispatcher pro vsechny akce z context menu, floating toolbar a keyboard shortcuts
- Pred: BuilderPage jako koordinator panelu z Wave 2
- Po: Plne funkcni builder s preview, akcemi a klav. zkratkami

---

### 8. `BuilderElementRenderer.jsx`

**Typ:** Zmeneno
**Radky:** vice sekci
**Duvod:** Propojeni pravym klikem na context menu

**Co se zmenilo:**
- Pridany onContextMenu handler na kazdy rendrovany element
- Handler predava event + elementId do parent (BuilderCanvas)
- Pred: Element renderovani bez context menu
- Po: Right-click na element otvira ElementContextMenu

---

### 9. `BuilderCanvas.jsx`

**Typ:** Zmeneno
**Radky:** vice sekci
**Duvod:** Sprava stavu context menu a jeho renderovani

**Co se zmenilo:**
- Novy state: contextMenuPosition, contextMenuElementId
- Handler pro otevreni/zavreni context menu
- Render ElementContextMenu pres portal
- Propojeni akci z context menu do BuilderPage dispatcher
- Pred: Canvas s elementy a drop overlay
- Po: Canvas s elementy, drop overlay, context menu a floating toolbar

---

## Dopad zmen

- **Ovlivnene komponenty:** BuilderPage, BuilderCanvas, BuilderTopBar, BuilderElementRenderer, vsechny child komponenty
- **Breaking changes:** Ne — vsechny zmeny jsou aditivni
- **Nove zavislosti:** Zadne externi npm balicky (React portaly, HTML5 eventy)
- **Rizika:** Interakce mezi keyboard shortcuts a existujicimi event listenery (muze kolidovat s jinymi strankami)

---

## Testovani

- **Build:** Zatim neovereno (Wave 3 ceka na build verifikaci)
- **Manual test:** Zatim neprovedeno
- **Poznamky:** Doporuceno otestovat: preview mode ve vsech 3 device framech, vsech 12 akci context menu, vsech 10 keyboard shortcuts, floating toolbar poziciovani

---
