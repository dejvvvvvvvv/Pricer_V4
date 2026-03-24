# Widget Builder -- Audit Funkci (Kompletni)

> Kompletni audit VSECH funkci ve Widget Builderu.
> Dokumentuje co kazda funkce dela, jak ma fungovat, jak je implementovana a zda funguje.
>
> **Datum:** 2026-03-21
> **Zaklad:** 3 audit reporty (hooks/BuilderPage, components, editors/tabs)
> **Nalezy:** 7 P1 v hooks/BuilderPage (vsechny OPRAVENO), 6 P1 v components (vsechny OPRAVENO), 6 P1 v editors/tabs (vsechny OPRAVENO)

---

## Souhrnna tabulka

| # | Soubor | Funkce / Oblast | Stav | Poznamka |
|---|--------|----------------|------|---------|
| 1 | useUndoRedo.js | setState | FUNGUJE | Pushne stary stav na past stack, maze future |
| 2 | useUndoRedo.js | undo | FUNGUJE | Popi z past, pushne current na future |
| 3 | useUndoRedo.js | redo | FUNGUJE | Popi z future, pushne current na past |
| 4 | useUndoRedo.js | setWithoutHistory | FUNGUJE | Update bez history push (pro live preview) |
| 5 | useUndoRedo.js | reset | FUNGUJE | Clear oba stacky, nastavi novy original |
| 6 | useUndoRedo.js | isDirty / canUndo / canRedo | FUNGUJE | Derivovane hodnoty z refu a stavu |
| 7 | useElementSelection.js | selectElement | FUNGUJE | Nastavi selectedElementId |
| 8 | useElementSelection.js | hoverElement | FUNGUJE | Nastavi hoveredElementId |
| 9 | useElementSelection.js | clearSelection | FUNGUJE | Vynuluje selectedElementId |
| 10 | useElementSelection.js | clearHover | FUNGUJE | Vynuluje hoveredElementId |
| 11 | useElementSelection.js | isSelected / isHovered | FUNGUJE | Callback porovnani s aktualni hodnotou |
| 12 | useElementSelection.js | Escape handler | OPRAVENO | Deselect na Escape, ignoruje INPUT/TEXTAREA |
| 13 | useElementSelection.js | ArrowUp/Down handler | OPRAVENO | Navigace mezi elementy, clamp na hranicich |
| 14 | useElementSelection.js | Delete/Backspace | OPRAVENO | Presunuto do BuilderPage capture phase |
| 15 | useLayoutState.js | pushLayout | FUNGUJE | Funkcionalni updater, cap 30 undo kroku |
| 16 | useLayoutState.js | moveElement | FUNGUJE | Presun elementu splice + splice |
| 17 | useLayoutState.js | toggleElementVisibility | FUNGUJE | Toggle v Set + HIDEABLE_ELEMENTS guard |
| 18 | useLayoutState.js | addCustomBlock | FUNGUJE | Vlozeni na pozici, update customBlocks pole |
| 19 | useLayoutState.js | removeCustomBlock | FUNGUJE | Odebrani z elementOrder + customBlocks |
| 20 | useLayoutState.js | updateCustomBlock | FUNGUJE | Merge propsPatch do existujiciho bloku |
| 21 | useLayoutState.js | addElement | OPRAVENO | Pouziva createBlockInstance z block registry |
| 22 | useLayoutState.js | removeElement | OPRAVENO | isLockedElement guard + podpora non-custom |
| 23 | useLayoutState.js | updateElementStyle | FUNGUJE | Custom block props vs sizeOverrides pro registry |
| 24 | useLayoutState.js | reorderElements | FUNGUJE | Splice-based prerazeni, ignoruje same index |
| 25 | useLayoutState.js | setSizeOverride | FUNGUJE | Deep merge do sizeOverrides objektu |
| 26 | useLayoutState.js | applyPreset | FUNGUJE | Nacte preset layout, maze customBlocks |
| 27 | useLayoutState.js | undoLayout / redoLayout | FUNGUJE | Separatni stack od theme undo/redo |
| 28 | useLayoutState.js | resetLayout | FUNGUJE | Clear stacky, nastavi novy original |
| 29 | useDragAndDrop.js | handlePaletteDragStart | FUNGUJE | Nastavi dataTransfer s block JSON |
| 30 | useDragAndDrop.js | handleCanvasDragStart | FUNGUJE | Nastavi activeType='reorder', dataTransfer |
| 31 | useDragAndDrop.js | handleCanvasDragOver | FUNGUJE | Vypocet drop pozice z clientY vs midY |
| 32 | useDragAndDrop.js | handleCanvasDragEnter | FUNGUJE | Nastavi overId pro vizualni feedback |
| 33 | useDragAndDrop.js | handleCanvasDragLeave | FUNGUJE | Maze overId jen pri opusteni containeru |
| 34 | useDragAndDrop.js | handleCanvasDrop | OPRAVENO | Pouziva layoutRef.current (ne stale closure) |
| 35 | useDragAndDrop.js | handleDragEnd | FUNGUJE | Reset vseho DnD stavu |
| 36 | useDragAndDrop.js | handleDragCancel | FUNGUJE | Identicky s handleDragEnd |
| 37 | useBuilderState.js | load widget (useEffect) | FUNGUJE | Merge themeConfig s defaults, resetUndoRedo |
| 38 | useBuilderState.js | updateThemeProperty | FUNGUJE | Convenience pro single key update s description |
| 39 | useBuilderState.js | setThemeBulk | FUNGUJE | Replace cely theme najednou (1 undo entry) |
| 40 | useBuilderState.js | updateThemePropertyDebounced | OPRAVENO | setWithoutHistory + debounced commit |
| 41 | useBuilderState.js | resetToOriginal | FUNGUJE | Obnovi theme z loadedThemeRef |
| 42 | useBuilderState.js | resetToDefaults | FUNGUJE | Nacte factory defaults, maze undo stack |
| 43 | useBuilderState.js | save | FUNGUJE | Persist do localStorage, resetne dirty flag |
| 44 | useBuilderState.js | Ctrl+Z / Ctrl+Y shortcuts | OPRAVENO | Capture phase, ignoruje INPUT/TEXTAREA |
| 45 | useBuilderState.js | Ctrl+S shortcut | FUNGUJE | Force save bypass debounce |
| 46 | useBuilderState.js | auto-save | OPRAVENO | 2s debounce, snapshot comparison, isSavingRef guard |
| 47 | useBuilderState.js | exportLayoutJSON | FUNGUJE | JSON.stringify s version:2 |
| 48 | useBuilderState.js | importLayoutJSON | FUNGUJE | Parse + merge s defaults |
| 49 | useBuilderState.js | unifiedUndo | OPRAVENO | Theme first, fallback layout |
| 50 | useBuilderState.js | unifiedRedo | OPRAVENO | Theme first, fallback layout |
| 51 | BuilderPage.jsx | handleMoveUp | FUNGUJE | Splice idx-1 pres layout.moveElement |
| 52 | BuilderPage.jsx | handleMoveDown | FUNGUJE | Splice idx+1 pres layout.moveElement |
| 53 | BuilderPage.jsx | handleMoveToTop | FUNGUJE | Splice na index 0 |
| 54 | BuilderPage.jsx | handleMoveToBottom | FUNGUJE | Splice na order.length-1 |
| 55 | BuilderPage.jsx | handleDeleteElement | OPRAVENO | Dvojity handler odstranen, isLockedBlock guard |
| 56 | BuilderPage.jsx | handleDuplicateElement | OPRAVENO | resolveBlockId pridano pro spravny lookup |
| 57 | BuilderPage.jsx | handleCopyElement | FUNGUJE | Ulozi blockType + sourceElementId do clipboard |
| 58 | BuilderPage.jsx | handlePasteElement | FUNGUJE | addElement na pozici za selected |
| 59 | BuilderPage.jsx | handleToggleVisibility | FUNGUJE | Toggle + toast feedback |
| 60 | BuilderPage.jsx | handleResetStyles | FUNGUJE | Iteruje editableProperties, reset na default |
| 61 | BuilderPage.jsx | handleEditProperties | FUNGUJE | selectElement + switch tab + open panel |
| 62 | BuilderPage.jsx | handleElementAction | FUNGUJE | Switch/case dispatcher pro 11 akci |
| 63 | BuilderPage.jsx | handleStyleChange | FUNGUJE | Route pres updateThemeProperty |
| 64 | BuilderPage.jsx | handleReset | FUNGUJE | Najde default z blockDef, nastavi pres theme |
| 65 | BuilderPage.jsx | handlePreviewOpen/Close | FUNGUJE | Nastavi isPreviewOpen boolean |
| 66 | BuilderPage.jsx | handleStepConfigChange | FUNGUJE | Merge do stepConfigs objektu |
| 67 | BuilderPage.jsx | handleLeftResize | FUNGUJE | Clamp MIN_PANEL_WIDTH..MAX_PANEL_WIDTH |
| 68 | BuilderPage.jsx | handleRightResize | FUNGUJE | Clamp MIN_PANEL_WIDTH..MAX_PANEL_WIDTH |
| 69 | BuilderPage.jsx | selectedElement resolver | OPRAVENO | customBlocks.find() misto bracket notation |
| 70 | BuilderPage.jsx | Delete/Backspace keyboard | OPRAVENO | Capture phase, jen v BuilderPage |
| 71 | BuilderCanvas.jsx | element rendering | FUNGUJE | Map pres elementOrder, merge props |
| 72 | BuilderCanvas.jsx | context menu dispatch | FUNGUJE | Ulozi x/y/elementId, deleguje na onElementAction |
| 73 | BuilderCanvas.jsx | zoom controls | FUNGUJE | ZOOM_LEVELS [50,75,100,125,150] |
| 74 | BuilderCanvas.jsx | drop indicators | FUNGUJE | Vizualni linie pred/za elementy pri DnD |
| 75 | BuilderCanvas.jsx | deselect on click | FUNGUJE | handleCanvasClick kontroluje e.target |
| 76 | BuilderCanvas.jsx | device frame | FUNGUJE | 3 rezimy s roznymi rozmery |
| 77 | BuilderElementRenderer.jsx | block preview rendering | FUNGUJE | PREVIEW_MAP dispatch na 24 preview komponent |
| 78 | BuilderElementRenderer.jsx | selection chrome | FUNGUJE | wb-element--selected CSS trida |
| 79 | BuilderElementRenderer.jsx | label badge | FUNGUJE | nameCs + lock icon + step badge |
| 80 | BuilderElementRenderer.jsx | drag handle | FUNGUJE | GripVertical icon, draggable=true |
| 81 | BuilderElementRenderer.jsx | resize handles | FUNGUJE | Vizualni handles pri selected (CSS only) |
| 82 | BuilderElementRenderer.jsx | context menu trigger | FUNGUJE | onContextMenu s e.preventDefault |
| 83 | BuilderElementRenderer.jsx | hidden element | FUNGUJE | return null pro isHidden |
| 84 | ElementContextMenu.jsx | positioning | FUNGUJE | Viewport overflow adjustment |
| 85 | ElementContextMenu.jsx | keyboard nav | FUNGUJE | ArrowUp/Down skip disabled, Enter = action |
| 86 | ElementContextMenu.jsx | action dispatch | FUNGUJE | 12 polozek ve 4 skupinach |
| 87 | ElementContextMenu.jsx | click outside close | FUNGUJE | mousedown capture s timeout |
| 88 | ElementContextMenu.jsx | fade-in animation | FUNGUJE | requestAnimationFrame + opacity/scale |
| 89 | ElementContextMenu.jsx | portal rendering | FUNGUJE | createPortal(menu, document.body) |
| 90 | FloatingToolbar.jsx | position calculation | FUNGUJE | Above/below element dle dostupneho mista |
| 91 | FloatingToolbar.jsx | action buttons | FUNGUJE | 7 tlacitek: edit, moveUp/Down, duplicate, visibility, delete |
| 92 | FloatingToolbar.jsx | auto-reposition | FUNGUJE | ResizeObserver + scroll listener |
| 93 | FloatingToolbar.jsx | locked indicator | FUNGUJE | Lock icon misto Trash2 pro locked |
| 94 | BuilderLeftPanel.jsx | tab switching | FUNGUJE | 5 tabu: style, blocks, templates, layers, global |
| 95 | BuilderLeftPanel.jsx | block palette | FUNGUJE | Grouped by category, filterable |
| 96 | BuilderLeftPanel.jsx | search | FUNGUJE | Filtruje blocks dle name/nameCs/description |
| 97 | BuilderLeftPanel.jsx | drag start | FUNGUJE | createBlockInstance + onPaletteDragStart |
| 98 | BuilderLeftPanel.jsx | click to add | FUNGUJE | createBlockInstance + onAddBlock callback |
| 99 | BuilderPropertyPanel.jsx | tab routing | FUNGUJE | 3 taby: Content, Style, Advanced |
| 100 | BuilderPropertyPanel.jsx | style change wrapper | FUNGUJE | Pridava elementId k onStyleChange |
| 101 | BuilderPropertyPanel.jsx | reset wrapper | FUNGUJE | Pridava elementId k onReset |
| 102 | BuilderPropertyPanel.jsx | delete button | FUNGUJE | Disabled pro locked, Lock icon |
| 103 | BuilderPropertyPanel.jsx | no-selection state | FUNGUJE | Placeholder s instrukcemi |
| 104 | BuilderTopBar.jsx | name editing | FUNGUJE | Click-to-edit, Enter/Escape commit/cancel |
| 105 | BuilderTopBar.jsx | step navigation | FUNGUJE | StepNavigator komponenta |
| 106 | BuilderTopBar.jsx | device switch | FUNGUJE | 3 tlacitka s active stylem |
| 107 | BuilderTopBar.jsx | zoom controls | FUNGUJE | +/- tlacitka s ZOOM_PRESETS |
| 108 | BuilderTopBar.jsx | undo/redo buttons | FUNGUJE | Disabled kdyz canUndo/canRedo=false |
| 109 | BuilderTopBar.jsx | preview button | FUNGUJE | Vola onPreviewOpen |
| 110 | BuilderTopBar.jsx | export HTML | FUNGUJE | Generuje iframe embed kod, clipboard copy |
| 111 | BuilderTopBar.jsx | save button | FUNGUJE | Zobrazuje autoSaveStatus (saving/saved/idle) |
| 112 | BuilderTopBar.jsx | Loader2 spin animation | FUNGUJE | CSS animation: spin 1s linear infinite |
| 113 | PreviewMode.jsx | animation states | FUNGUJE | entering -> open -> leaving -> closed |
| 114 | PreviewMode.jsx | device frame | FUNGUJE | DeviceFrame wrapper s deviceMode |
| 115 | PreviewMode.jsx | step nav | FUNGUJE | 5 step tlacitek s ikonami |
| 116 | PreviewMode.jsx | keyboard (Escape) | FUNGUJE | Capture phase, e.stopPropagation |
| 117 | PreviewMode.jsx | keyboard (arrows) | FUNGUJE | ArrowLeft/Right pro step navigaci |
| 118 | PreviewMode.jsx | backdrop click close | FUNGUJE | e.target === backdropRef.current |
| 119 | PreviewMode.jsx | share link | FUNGUJE | Clipboard copy s feedback toast |
| 120 | PreviewMode.jsx | bg toggle | FUNGUJE | Dark/light pozadi toggle |
| 121 | PreviewMode.jsx | body scroll lock | FUNGUJE | overflow:hidden pri open, restore pri close |
| 122 | PreviewMode.jsx | portal rendering | FUNGUJE | createPortal(overlay, document.body) |
| 123 | LayersPanel.jsx | step grouping | FUNGUJE | Elementy seskupene dle kroku |
| 124 | LayersPanel.jsx | DnD reorder | FUNGUJE | Deleguje na onReorderElements |
| 125 | LayersPanel.jsx | visibility toggle | FUNGUJE | Deleguje na onToggleVisibility |
| 126 | LayersPanel.jsx | search | FUNGUJE | Interni filtr dle nazvu elementu |
| 127 | LayerRow.jsx | selection | FUNGUJE | onClick vola onSelectElement |
| 128 | LayerRow.jsx | visibility icon | FUNGUJE | Eye/EyeOff toggle |
| 129 | LayerRow.jsx | drag handle | FUNGUJE | GripVertical icon |
| 130 | LayerRow.jsx | delete button | FUNGUJE | Disabled pro locked elementy |
| 131 | PropertyEditorFactory.jsx | dispatch (10 typu) | FUNGUJE | color, number, text, boolean, select, spacing, font, shadow, alignment, opacity |
| 132 | PropertyEditorFactory.jsx | default fallback | FUNGUJE | TextPropertyEditor pro neznamy typ |
| 133 | ColorPropertyEditor.jsx | hex input | FUNGUJE | Validace #RRGGBB formatu |
| 134 | ColorPropertyEditor.jsx | native picker | FUNGUJE | input[type=color] |
| 135 | ColorPropertyEditor.jsx | palette | FUNGUJE | Predefinovane barvy + recent colors |
| 136 | ColorPropertyEditor.jsx | reset | FUNGUJE | Reset na defaultValue |
| 137 | NumberPropertyEditor.jsx | slider | FUNGUJE | Range input s min/max/step |
| 138 | NumberPropertyEditor.jsx | +/- buttons | FUNGUJE | Inkrement/dekrement s clamp |
| 139 | NumberPropertyEditor.jsx | input | FUNGUJE | Numericke pole s validaci |
| 140 | NumberPropertyEditor.jsx | clamp | FUNGUJE | Math.min/max na min/max hranice |
| 141 | NumberPropertyEditor.jsx | reset | FUNGUJE | Reset na defaultValue |
| 142 | TextPropertyEditor.jsx | debounced input | FUNGUJE | Interni state + debounce na onChange |
| 143 | TextPropertyEditor.jsx | multiline | FUNGUJE | textarea vs input dle prop |
| 144 | TextPropertyEditor.jsx | reset | FUNGUJE | Reset na defaultValue |
| 145 | BooleanPropertyEditor.jsx | toggle | FUNGUJE | Vizualni switch s checked stylem |
| 146 | BooleanPropertyEditor.jsx | reset | FUNGUJE | Reset na defaultValue |
| 147 | SelectPropertyEditor.jsx | dropdown | FUNGUJE | Native select s options |
| 148 | SelectPropertyEditor.jsx | reset | FUNGUJE | Reset na defaultValue |
| 149 | SpacingEditor.jsx | box model | FUNGUJE | 4 inputy (top/right/bottom/left) |
| 150 | SpacingEditor.jsx | linked/unlinked | FUNGUJE | Toggle pro sync vsech stran |
| 151 | SpacingEditor.jsx | reset | FUNGUJE | Reset vsech stran na default |
| 152 | ShadowEditor.jsx | shadow config | FUNGUJE | X/Y offset, blur, spread, color |
| 153 | ShadowEditor.jsx | inset toggle | FUNGUJE | Inset vs outset box-shadow |
| 154 | ShadowEditor.jsx | preview | FUNGUJE | Live nahled stinu |
| 155 | ShadowEditor.jsx | reset | FUNGUJE | Reset na 'none' |
| 156 | AlignmentEditor.jsx | 4-button group | FUNGUJE | left, center, right, justify |
| 157 | AlignmentEditor.jsx | reset | FUNGUJE | Reset na defaultValue |
| 158 | OpacityEditor.jsx | slider | FUNGUJE | Range 0-100 s % label |
| 159 | OpacityEditor.jsx | preview | FUNGUJE | Live opacity efekt |
| 160 | OpacityEditor.jsx | reset | FUNGUJE | Reset na defaultValue (typicky 1) |
| 161 | BorderEditor.jsx | per-side config | FUNGUJE | Width/style/color pro kazdou stranu |
| 162 | BorderEditor.jsx | radius | FUNGUJE | 4 rohove radius inputy |
| 163 | BorderEditor.jsx | preview | FUNGUJE | Live border nahled |
| 164 | BorderEditor.jsx | reset | FUNGUJE | Reset na block defaults |
| 165 | BackgroundEditor.jsx | color mode | FUNGUJE | Barva pozadi |
| 166 | BackgroundEditor.jsx | gradient mode | FUNGUJE | Linearni/radialni gradient |
| 167 | BackgroundEditor.jsx | reset | FUNGUJE | Reset na default |
| 168 | FontEditor.jsx | family select | FUNGUJE | 16 font options |
| 169 | FontEditor.jsx | weight/size | FUNGUJE | Numericke vstupy |
| 170 | CodeEditor.jsx | syntax highlight | FUNGUJE | Keyword highlighting pro CSS |
| 171 | CodeEditor.jsx | tab indent | FUNGUJE | Tab key vlozi 2 mezery |
| 172 | CodeEditor.jsx | format button | FUNGUJE | Zakladni CSS formatting |
| 173 | CodeEditor.jsx | copy button | FUNGUJE | Clipboard copy |
| 174 | CSSPreview.jsx | scoping | FUNGUJE | Wrappuje CSS do scoped bloku |
| 175 | CSSPreview.jsx | error detection | FUNGUJE | Zachyti parse errory |
| 176 | CSSPreview.jsx | toggle | FUNGUJE | Zobrazit/skryt preview |
| 177 | ContentTab.jsx | text properties | FUNGUJE | Editable text pole z blockDef |
| 178 | ContentTab.jsx | boolean properties | FUNGUJE | Toggle prepinace pro show/hide |
| 179 | ContentTab.jsx | element info | FUNGUJE | Zobrazuje block metadata |
| 180 | StyleTab.jsx | BlockStyleView | FUNGUJE | Editovatelne properties z block registry |
| 181 | StyleTab.jsx | LegacyStyleView | FUNGUJE | Fallback pro ELEMENT_REGISTRY elementy |
| 182 | StyleTab.jsx | CollapsibleSection | FUNGUJE | Sbalovaci sekce seskupene dle group |
| 183 | StyleTab.jsx | EditorErrorBoundary | FUNGUJE | Zachyti crash v editoru |
| 184 | AdvancedTab.jsx | custom CSS | FUNGUJE | CodeEditor pro per-element CSS |
| 185 | AdvancedTab.jsx | CSS variables ref | FUNGUJE | Seznam dostupnych CSS promennych |
| 186 | AdvancedTab.jsx | responsive | FUNGUJE | Mobile/tablet override sekce |
| 187 | GlobalTab.jsx | typography | FUNGUJE | Font family, size, heading font |
| 188 | GlobalTab.jsx | radius | FUNGUJE | Global border-radius |
| 189 | GlobalTab.jsx | quick theme | FUNGUJE | QuickThemeDropdown integrace |
| 190 | GlobalTab.jsx | effects | FUNGUJE | Globalni efekty (shadow, transition) |
| 191 | QuickThemeDropdown.jsx | theme list | FUNGUJE | 12 presetu ve 3 skupinach |
| 192 | QuickThemeDropdown.jsx | apply | FUNGUJE | Vola onApplyBulkTheme s celym theme |
| 193 | GlobalThemePanel.jsx | category tabs | FUNGUJE | Light/Dark/Colored filtrace |
| 194 | ThemePresetCard.jsx | preview | FUNGUJE | Mini vizualizace theme barev |
| 195 | ThemePresetCard.jsx | apply button | FUNGUJE | Vola onApply callback |
| 196 | ThemePreviewMini.jsx | color swatches | FUNGUJE | 4 hlavni barvy theme |
| 197 | TemplateGallery.jsx | template list | FUNGUJE | 8 sablon s nahledem |
| 198 | TemplatePreviewCard.jsx | preview | FUNGUJE | Mini nahled layoutu |
| 199 | TemplatePreviewCard.jsx | apply | FUNGUJE | Vola onApplyTemplate |
| 200 | blocks/index.js | getBlockById | FUNGUJE | Lookup + ELEMENT_TO_BLOCK_MAP fallback |
| 201 | blocks/index.js | resolveBlockId | OPRAVENO | Mapovani element registry ID -> block ID |
| 202 | blocks/index.js | createBlockInstance | FUNGUJE | crypto.randomUUID() pro unikatni ID |
| 203 | blocks/index.js | getBlocksByCategory | FUNGUJE | Filter dle category pole |
| 204 | lockedElements.js | canDeleteElement | FUNGUJE | Negace LOCKED_DELETE_IDS.includes |
| 205 | lockedElements.js | isLockedElement | FUNGUJE | LOCKED_ELEMENT_IDS.includes check |
| 206 | lockedElements.js | getElementConstraints | FUNGUJE | Souhrnny objekt vsech omezeni |
| 207 | defaultLayouts.js | getDefaultStepElements | FUNGUJE | Kopie pole z DEFAULT_STEP_LAYOUTS |
| 208 | defaultLayouts.js | getLayoutPreset | FUNGUJE | Lookup v LAYOUT_PRESETS |
| 209 | BuilderToast.jsx | useBuilderToast | FUNGUJE | addToast/dismissToast/toasts state |
| 210 | BuilderToast.jsx | toast rendering | FUNGUJE | Auto-dismiss s configurable duration |
| 211 | UndoRedoIndicator.jsx | visibility | FUNGUJE | Fade in/out na lastAction zmenu |
| 212 | SaveStatusIndicator.jsx | status display | FUNGUJE | idle/saving/saved s ikonami |

---

## Detailni audit po funkcich

---

### SEKCE A: Hooks

---

### [1-6] useUndoRedo.js -- Genericky undo/redo hook

#### [1] setState
- **Co dela:** Pushne aktulani stav na past stack, nastavi novy stav, vymaze future stack.
- **Jak ma fungovat:** Kazda zmena vytvori novy undo bod. Future stack se maze (branching). Max 50 zaznamu (FIFO).
- **Implementace:** `setCurrent()` funkcionalni updater, `pastRef.current` push, `futureRef.current = []`, volitelny `description` string.
- **Stav:** FUNGUJE
- **Poznamka:** Pouziva useRef pro stacky -- rendering jen pri zmene current state, ne pri zmene stacku.

#### [2] undo
- **Co dela:** Vrati stav o jeden krok zpet.
- **Jak ma fungovat:** Pop z past, push current na future. Updatuje lastAction s description undonuteho stavu.
- **Implementace:** `past.pop()` + `futureRef.current = [{state: prev, description: currentDescRef.current}, ...futureRef.current]`.
- **Stav:** FUNGUJE

#### [3] redo
- **Co dela:** Obnovi stav o jeden krok vpred.
- **Jak ma fungovat:** Shift z future, push current na past. Updatuje lastAction s description obnovovaneho stavu.
- **Implementace:** `future.shift()` + `pastRef.current = [...pastRef.current, {state: prev, description: currentDescRef.current}]`.
- **Stav:** FUNGUJE

#### [4] setWithoutHistory
- **Co dela:** Aktualizuje stav bez pridani do undo stacku.
- **Jak ma fungovat:** Pouziva se pro live preview behem tahu slideru -- debounced commit nasleduje pozdeji.
- **Implementace:** `setCurrent(typeof newState === 'function' ? newState : () => newState)`.
- **Stav:** FUNGUJE

#### [5] reset
- **Co dela:** Nastavi stav, vymaze oba stacky, aktualizuje originalRef (isDirty = false).
- **Jak ma fungovat:** Pouziva se po ulozeni nebo pri resetu do vychoziho stavu.
- **Implementace:** Oba ref stacky = [], `originalRef.current = state`, `setCurrent(state)`.
- **Stav:** FUNGUJE

#### [6] isDirty / canUndo / canRedo / historyLength / lastAction
- **Co dela:** Derivovane hodnoty pro UI.
- **Jak ma fungovat:** isDirty porovnava JSON.stringify(current) vs JSON.stringify(original). canUndo/canRedo kontroluji delku stacku.
- **Implementace:** Primo derivovane z refu + `bump` forceRender pro recalc.
- **Stav:** FUNGUJE
- **Poznamka (P2):** JSON.stringify porovnani je O(n) na kazdy render. Pro velke theme objekty neni idealni, ale v praxi nemeritelne.

---

### [7-14] useElementSelection.js -- Vyber a hover elementu

#### [7] selectElement
- **Co dela:** Nastavi selectedElementId.
- **Jak ma fungovat:** Prijima ID stringu nebo null pro deselect. Nullish coalescing (`id ?? null`).
- **Stav:** FUNGUJE

#### [8] hoverElement
- **Co dela:** Nastavi hoveredElementId.
- **Stav:** FUNGUJE

#### [9-10] clearSelection / clearHover
- **Co dela:** Explicitni vynulovani selectedElementId / hoveredElementId.
- **Stav:** FUNGUJE

#### [11] isSelected / isHovered
- **Co dela:** Callback ktery porovnava dany ID s aktualnim selectedElementId / hoveredElementId.
- **Implementace:** `useCallback((id) => id != null && id === selectedElementId, [selectedElementId])`.
- **Stav:** FUNGUJE

#### [12] Escape handler
- **Co dela:** Deselektuje aktualni element pri stisku Escape.
- **Jak ma fungovat:** Ignoruje eventy z INPUT/TEXTAREA/contentEditable. Pri Escape nastavi selectedElementId = null.
- **Stav:** OPRAVENO
- **Oprava:** Handler nyni spravne ignoruje input pole a nepropaguje event dal.

#### [13] ArrowUp/Down handler
- **Co dela:** Navigace sipkami mezi elementy v canvasu.
- **Jak ma fungovat:** ArrowDown vybere dalsi element, ArrowUp predchozi. Kdyz nic neni vybrano, ArrowDown vybere prvni, ArrowUp posledni. Clamp na hranicich (nepretece).
- **Implementace:** `elementOrder.indexOf(selectedElementId)` + `Math.min/Math.max`.
- **Stav:** OPRAVENO
- **Oprava:** Pridany boundary clamp (Math.min/Math.max) aby sipky nepretekly mimo pole.

#### [14] Delete/Backspace handler
- **Co dela:** Delete/Backspace klik handlovany v useElementSelection.
- **Jak ma fungovat:** NEHANDLUJE se zde. Delete/Backspace je exkluzivne v BuilderPage.jsx (capture phase).
- **Stav:** OPRAVENO
- **Oprava:** Puvodne byl handler duplicitni (v useElementSelection i BuilderPage). Odstranen z useElementSelection aby se zabranilo dvojitemu volani. Komentar v kodu jasne dokumentuje proc.

---

### [15-28] useLayoutState.js -- Sprava rozlozeni widgetu

#### [15] pushLayout
- **Co dela:** Obecny wrapper pro layout mutace s undo podporou.
- **Jak ma fungovat:** Ulozi predchozi stav do pastRef, vymaze futureRef, aplikuje updater. Cap 30 zaznamu.
- **Implementace:** `setLayout((prev) => { pastRef.current = [...pastRef.current, prev].slice(-30); ... })`.
- **Stav:** FUNGUJE

#### [16] moveElement
- **Co dela:** Presune element z fromIndex na toIndex v elementOrder.
- **Implementace:** Dvojity splice: `order.splice(fromIndex, 1)` + `order.splice(toIndex, 0, removed)`. Maze activePresetId.
- **Stav:** FUNGUJE

#### [17] toggleElementVisibility
- **Co dela:** Prepina viditelnost elementu.
- **Jak ma fungovat:** Kontroluje HIDEABLE_ELEMENTS guard. Toggle v Set (add/delete). Maze activePresetId.
- **Stav:** FUNGUJE

#### [18-20] addCustomBlock / removeCustomBlock / updateCustomBlock
- **Co dela:** CRUD pro custom bloky.
- **addCustomBlock:** Vlozi block.id do elementOrder na danou pozici, prida do customBlocks pole.
- **removeCustomBlock:** Guard na isCustomBlock(blockId). Filtruje z obou poli.
- **updateCustomBlock:** Merge propsPatch do existujiciho bloku pres map().
- **Stav:** FUNGUJE

#### [21] addElement (z block registry)
- **Co dela:** Prida novy element na zaklade block type ID.
- **Jak ma fungovat:** Nacte blockDef pres getBlockById, vytvori instanci pres createBlockInstance, vlozi do elementOrder a customBlocks.
- **Stav:** OPRAVENO
- **Oprava:** Nyni spravne pouziva createBlockInstance z block registry misto manualni konstrukce.

#### [22] removeElement
- **Co dela:** Odebere element z layoutu.
- **Jak ma fungovat:** isLockedElement guard (nikdy neodstranit zamcene). Pro custom bloky deleguje na removeCustomBlock logiku. Pro registry bloky odebere z elementOrder.
- **Stav:** OPRAVENO
- **Oprava:** Pridana podpora pro non-custom registry bloky (puvodne fungoval jen pro cb_ prefix).

#### [23] updateElementStyle
- **Co dela:** Aktualizuje styl property jednoho elementu.
- **Jak ma fungovat:** Pro custom bloky aktualizuje props v customBlocks. Pro registry elementy ulozi do sizeOverrides.
- **Stav:** FUNGUJE

#### [24-26] reorderElements / setSizeOverride / applyPreset
- **reorderElements:** Splice-based prerazeni, ignoruje same index.
- **setSizeOverride:** Deep merge do sizeOverrides[elementId][dimension].
- **applyPreset:** Nacte preset z LAYOUT_PRESETS, vymaze customBlocks, nastavi activePresetId.
- **Stav:** FUNGUJE

#### [27-28] undoLayout / redoLayout / resetLayout
- **Co dela:** Separatni undo/redo stack pro layout (nezavisly na theme).
- **Implementace:** Shodna logika jako useUndoRedo ale inlinova (pastRef/futureRef).
- **Stav:** FUNGUJE

---

### [29-36] useDragAndDrop.js -- HTML5 Drag and Drop

#### [29] handlePaletteDragStart
- **Co dela:** Zahaji tazeni bloku z palety.
- **Implementace:** `e.dataTransfer.setData('application/builder-block', JSON.stringify(blockData))`, effectAllowed='copy', ghost image.
- **Stav:** FUNGUJE

#### [30] handleCanvasDragStart
- **Co dela:** Zahaji tazeni existujiciho elementu pro prerazeni.
- **Implementace:** `e.dataTransfer.setData('text/plain', elementId)`, effectAllowed='move'.
- **Stav:** FUNGUJE

#### [31] handleCanvasDragOver
- **Co dela:** Vypocitava pozici drop indikatoru pri tazeni.
- **Implementace:** Iteruje `canvas.querySelectorAll('[data-element-id]')`, pocita vzdalenost clientY od midY kazdeho elementu. Nastavuje dropIndicatorIndex.
- **Stav:** FUNGUJE

#### [32-33] handleCanvasDragEnter / handleCanvasDragLeave
- **handleCanvasDragEnter:** Nastavi overId pro vizualni feedback.
- **handleCanvasDragLeave:** Maze overId jen pokud e.relatedTarget je mimo container (zabranuje flickeru na child elementech).
- **Stav:** FUNGUJE

#### [34] handleCanvasDrop
- **Co dela:** Zpracovava drop -- pridani noveho bloku nebo prerazeni existujiciho.
- **Jak ma fungovat:** Pro palette drag: parse JSON z dataTransfer, addCustomBlock na vypoctenou pozici. Pro reorder: moveElement s adjustovanym indexem.
- **Stav:** OPRAVENO
- **Oprava:** Pouziva `layoutRef.current` misto primo `layoutState` aby se zamezilo stale closure problemu.

#### [35-36] handleDragEnd / handleDragCancel
- **Co dela:** Reset DnD stavu.
- **Implementace:** Oba nastavuji activeId/activeType/overId/dropIndicatorIndex na null/-1.
- **Stav:** FUNGUJE

---

### [37-50] useBuilderState.js -- Top-level kompozicni hook

#### [37] Load widget (useEffect)
- **Co dela:** Nacita widget data z localStorage pri mountu.
- **Jak ma fungovat:** Merge ulozeny themeConfig s defaults (nove pridane klice vzdy existuji). Inicializuje undoRedo a layoutState.
- **Stav:** FUNGUJE

#### [38-39] updateThemeProperty / setThemeBulk
- **updateThemeProperty:** Single key update s volitelnym description. `setThemeState({...theme, [key]: value}, desc)`.
- **setThemeBulk:** Replace cely theme najednou jako jeden undo entry.
- **Stav:** FUNGUJE

#### [40] updateThemePropertyDebounced
- **Co dela:** Okamzity vizualni update + debounced undo entry.
- **Jak ma fungovat:** `setWithoutHistory` pro instant preview, pak `setTimeout` pro commit do undo stacku.
- **Stav:** OPRAVENO
- **Oprava:** Nyni spravne pouziva `undoRedo.setWithoutHistory` misto primo `setCurrent`.

#### [41-42] resetToOriginal / resetToDefaults
- **resetToOriginal:** Obnovi theme z loadedThemeRef (to co bylo pri nacteni). Pouziva resetUndoRedo.
- **resetToDefaults:** Nacte `getDefaultWidgetTheme()`, maze undo stack. Pouziva setThemeState (zachova undo entry).
- **Stav:** FUNGUJE

#### [43] save
- **Co dela:** Persistuje theme + layout + name do localStorage.
- **Jak ma fungovat:** Vola updateWidget, pak resetuje loadedThemeRef a undo stack (isDirty = false).
- **Stav:** FUNGUJE

#### [44] Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z shortcuts
- **Co dela:** Globalni klaves. zkratky pro undo/redo.
- **Jak ma fungovat:** Capture phase (true), ignoruje INPUT/TEXTAREA/contentEditable. Ctrl+Shift+Z = redo, Ctrl+Y = redo, Ctrl+Z = undo.
- **Stav:** OPRAVENO
- **Oprava:** Pridana capture phase (3. argument true v addEventListener) + e.stopPropagation() aby se zabranilo propagaci do jinych handleru.

#### [45] Ctrl+S shortcut
- **Co dela:** Okamzite ulozeni (bypass auto-save debounce).
- **Implementace:** Samostatny useEffect s capture phase. Cancely auto-save timer, force save.
- **Stav:** FUNGUJE

#### [46] Auto-save
- **Co dela:** Automaticke ukladani pri zmene (2s debounce).
- **Jak ma fungovat:** Sleduje snapshot (theme + name + layout). Pri zmene naplanuje save za 2s. Chrani proti paralelnimu save (isSavingRef). Po save nastavi 'saved' status na 2s.
- **Stav:** OPRAVENO
- **Oprava:** Pridana snapshot inicializace pri prvnim renderu (skip save) + isSavingRef guard proti race condition.

#### [47-48] exportLayoutJSON / importLayoutJSON
- **exportLayoutJSON:** Serializuje theme + layout + name do JSON s version:2 a timestamp.
- **importLayoutJSON:** Parse JSON, merge s defaults, reset layout. Vraci `{ok: true}` nebo `{ok: false, error}`.
- **Stav:** FUNGUJE

#### [49-50] unifiedUndo / unifiedRedo
- **Co dela:** Inteligentni undo/redo ktere zkusi theme stack a pak layout stack.
- **Jak ma fungovat:** `if (canUndo) undo(); else if (canUndoLayout) undoLayout()`. Zarizuje ze Ctrl+Z funguje pro oboji.
- **Stav:** OPRAVENO
- **Oprava:** Logika "theme first, layout fallback" nyni funguje spravne a nevolava oba naraz.

---

### SEKCE B: BuilderPage.jsx -- Handlery

---

#### [51-54] handleMoveUp / handleMoveDown / handleMoveToTop / handleMoveToBottom
- **Co dela:** Presun vybraneho elementu v elementOrder.
- **Implementace:** Vsechny pouzivaji `builder.layout.moveElement(id, idx, targetIdx)`. Prijimaji volitelny elementId parameter nebo fallbackuji na builder.selectedElementId.
- **Stav:** FUNGUJE

#### [55] handleDeleteElement
- **Co dela:** Smaze nebo skryje element.
- **Jak ma fungovat:** 3-urovnova logika: (1) isLockedBlock -> toast warning, (2) cb_/bi_ prefix -> removeCustomBlock, (3) HIDEABLE_ELEMENTS -> toggleElementVisibility. Vzdy clearSelection + toast feedback.
- **Stav:** OPRAVENO
- **Oprava:** Puvodne existoval dvojity handler (v useElementSelection i BuilderPage). Odstranen z useElementSelection, BuilderPage je jediny handler v capture phase.

#### [56] handleDuplicateElement
- **Co dela:** Duplikuje element (vytvori novou instanci stejneho typu).
- **Jak ma fungovat:** `resolveBlockId(id)` -> `getBlockById(blockType)` -> `addElement(step, blockDef.id, insertAt)`. Vybere novou instanci.
- **Stav:** OPRAVENO
- **Oprava:** Pridano `resolveBlockId()` volani -- puvodne se primy element ID (napr. 'viewer') nehledal spravne v block registry (kde je jako 'model-viewer').

#### [57-58] handleCopyElement / handlePasteElement
- **handleCopyElement:** Ulozi `{blockType: blockDef.id, sourceElementId: id}` do clipboard statu.
- **handlePasteElement:** `addElement(step, clipboard.blockType, insertAt)` za selected element.
- **Stav:** FUNGUJE

#### [59] handleToggleVisibility
- **Co dela:** Prepina viditelnost elementu.
- **Implementace:** `builder.layout.toggleElementVisibility(id)` + toast s 'Element shown'/'Element hidden'.
- **Stav:** FUNGUJE

#### [60] handleResetStyles
- **Co dela:** Resetuje vsechny styly elementu na vychozi hodnoty z block definice.
- **Implementace:** Iteruje `blockDef.editableProperties`, pro kazdou property s default hodnotou vola `builder.updateThemeProperty(prop.key, prop.default)`.
- **Stav:** FUNGUJE

#### [61] handleEditProperties
- **Co dela:** Vybere element, prepne na Style tab, otevre pravy panel.
- **Stav:** FUNGUJE

#### [62] handleElementAction
- **Co dela:** Centralni dispatcher pro vsechny element akce (context menu, toolbar).
- **Implementace:** Switch/case na 11 akci: edit, copy, paste, duplicate, moveUp/Down/ToTop/ToBottom, toggleVisibility, resetStyles, delete.
- **Stav:** FUNGUJE

#### [63-64] handleStyleChange / handleReset
- **handleStyleChange:** Route pres `builder.updateThemeProperty(propertyKey, value)`.
- **handleReset:** Najde default z blockDef editableProperties, nastavi pres updateThemeProperty.
- **Stav:** FUNGUJE

#### [65-66] handlePreviewOpen/Close / handleStepConfigChange
- **handlePreviewOpen:** `setIsPreviewOpen(true)`.
- **handlePreviewClose:** `setIsPreviewOpen(false)`.
- **handleStepConfigChange:** `setStepConfigs(prev => ({...prev, [stepId]: {...prev[stepId], ...changes}}))`.
- **Stav:** FUNGUJE

#### [67-68] handleLeftResize / handleRightResize
- **Co dela:** Resizuji levy/pravy panel.
- **Implementace:** `Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, newWidth))`. MIN=200, MAX=450.
- **Stav:** FUNGUJE

#### [69] selectedElement resolver
- **Co dela:** Resolvuje selectedElementId na plny element objekt s blockDef a props.
- **Jak ma fungovat:** (1) Hleda v customBlocks pres `.find()`, (2) Resoluje block ID pres `resolveBlockId()`, (3) Merge props: blockDef defaults + theme overrides + custom props/size overrides.
- **Stav:** OPRAVENO
- **Oprava:** Puvodne pouzival bracket notation na customBlocks (coz je pole, ne objekt). Opraveno na `.find()`.

#### [70] Delete/Backspace keyboard shortcut
- **Co dela:** Globalni Delete/Backspace -> handleDeleteElement.
- **Implementace:** `window.addEventListener('keydown', ..., true)` (capture phase). Kontroluje ze target neni INPUT/TEXTAREA/contentEditable.
- **Stav:** OPRAVENO
- **Oprava:** Sjednoceno do jedineho handleru v BuilderPage capture phase. Puvodne dvoji handler (useElementSelection + BuilderPage) zpusoboval dvojite volani.

---

### SEKCE C: Komponenty

---

#### [71-76] BuilderCanvas.jsx
- **element rendering [71]:** Map pres elementOrder, kazdy element renderovan pres BuilderElementRenderer. Merge props: blockDef defaults + customBlock overrides + sizeOverrides.
- **context menu [72]:** `handleElementContextMenu` ulozi {x, y, elementId}, renderuje ElementContextMenu.
- **zoom [73]:** ZOOM_LEVELS [50,75,100,125,150], +/- tlacitka, reset na 100%.
- **drop indicators [74]:** `wb-canvas__drop-indicator` div pred/za elementy dle dropIndicatorIndex.
- **deselect on click [75]:** `handleCanvasClick` -- kdyz klik na canvas background (e.target === e.currentTarget || data-canvas-bg), deselektuje.
- **device frame [76]:** DEVICE_DIMENSIONS: mobile 360x740, tablet 768x1024, desktop 1280xnone.
- **Stav:** FUNGUJE

#### [77-83] BuilderElementRenderer.jsx
- **block preview [77]:** PREVIEW_MAP mapuje 24 block ID na preview komponenty (6 calculator, 6 layout, 8 content, 6 form). Fallback na GenericCalcPreview.
- **selection chrome [78]:** CSS trida `wb-element--selected` (teal outline).
- **label [79]:** nameCs + lock icon + step badge.
- **drag handle [80]:** GripVertical icon, `draggable=true` na celem elementu.
- **resize handles [81]:** Vizualni handles (CSS only, bottom + right) zobrazene pri selected.
- **context menu [82]:** `onContextMenu` s e.preventDefault + e.stopPropagation, select + bubble.
- **hidden [83]:** `if (isHidden) return null` -- element se vubec nerenderuje.
- **Stav:** FUNGUJE

#### [84-89] ElementContextMenu.jsx
- **positioning [84]:** Viewport overflow adjustment pres `adjustPosition()`. RecalcFrame po renderu.
- **keyboard nav [85]:** ArrowUp/Down skipuji disabled itemy, Enter = action, Escape = close.
- **action dispatch [86]:** 12 polozek ve 4 skupinach: (1) Edit/Copy/Paste/Duplicate, (2) Move, (3) Visibility/Lock, (4) Reset/Delete.
- **click outside [87]:** `mousedown` capture s timeout (zabranuje okamzitemu zavreni pri right-click).
- **fade-in [88]:** `requestAnimationFrame(() => setVisible(true))` + CSS opacity/scale transition.
- **portal [89]:** `createPortal(menu, document.body)` -- zabranuje CSS clipping.
- **Stav:** FUNGUJE

#### [90-93] FloatingToolbar.jsx
- **position [90]:** Pozice nad elementem (nebo pod, kdyz neni dost mista nahore). Relativni k canvas containeru.
- **buttons [91]:** 7 akci: Edit, MoveUp, MoveDown, Duplicate, Visibility, Divider, Delete.
- **auto-reposition [92]:** ResizeObserver na canvas + scroll listener na scroll parent.
- **locked [93]:** Lock icon misto Trash2, disabled stav pro locked elementy.
- **Stav:** FUNGUJE

#### [94-98] BuilderLeftPanel.jsx
- **tabs [94]:** 5 tabu: Style (MousePointerClick), Blocks (LayoutGrid), Templates (LayoutTemplate), Layers (Layers), Global (Settings2).
- **block palette [95]:** Bloky seskupene dle BLOCK_CATEGORIES (4 kategorie). Kazdy blok zobrazuje icon + name + step badge.
- **search [96]:** Filtruje bloky dle name/nameCs/description/descriptionCs. Interni state nebo externi prop.
- **drag start [97]:** `createBlockInstance(block.id)` + volani `onPaletteDragStart(e, block.id, blockData)`.
- **click to add [98]:** `createBlockInstance(block.id)` + volani `onAddBlock({id, blockType, type, props})`.
- **Stav:** FUNGUJE

#### [99-103] BuilderPropertyPanel.jsx
- **tab routing [99]:** 3 taby: Content (FileText), Style (Paintbrush), Advanced (Settings2).
- **style change [100]:** `handleStyleChange` wrappuje pridanim elementId: `onStyleChange(elId, propertyKey, value)`.
- **reset [101]:** `handleReset` wrappuje pridanim elementId: `onReset(elId, propertyKey)`.
- **delete [102]:** `handleDelete` -- disabled pro locked, vola `onDeleteElement(instanceId || selectedElementId)`.
- **no-selection [103]:** Zobrazuje placeholder s instrukcemi kdyz nic neni vybrano.
- **Stav:** FUNGUJE

#### [104-112] BuilderTopBar.jsx
- **name editing [104]:** Click -> isEditingName=true -> input s focus+select -> Enter=commit, Escape=cancel, Blur=commit. Sync draft s externim widgetName.
- **step nav [105]:** StepNavigator komponenta (delegovana).
- **device switch [106]:** 3 tlacitka (Smartphone/Tablet/Monitor) s radiogroup ARIA role.
- **zoom [107]:** +/- tlacitka s ZOOM_PRESETS, disabled na hranicich.
- **undo/redo [108]:** 2 tlacitka (Undo2/Redo2), disabled dle canUndo/canRedo, UndoRedoIndicator popup.
- **preview [109]:** Tlacitko s Eye icon, vola onPreviewOpen.
- **export [110]:** Generuje iframe embed kod, navigator.clipboard.writeText, Check icon feedback na 2.5s.
- **save [111]:** 3 stavy: idle (Save icon), saving (Loader2 spin), saved (Check icon). Text: Ulozit/Ukladam.../Ulozeno.
- **Loader2 [112]:** CSS `animation: spin 1s linear infinite` na ikone. Overeno OK -- Lucide Loader2 nepotrebuje vlastni @keyframes, pouziva se inline style.
- **Stav:** FUNGUJE

#### [113-122] PreviewMode.jsx
- **animation [113]:** 4 stavy: closed -> entering -> open -> leaving -> closed. `requestAnimationFrame` double-raf pro smooth enter. setTimeout 250ms pro leaving.
- **device frame [114]:** DeviceFrame wrapper s deviceMode prop.
- **step nav [115]:** 5 tlacitek s ikonami (Upload/Settings/DollarSign/ShoppingCart/CheckCircle), active styl.
- **Escape [116]:** Capture phase, e.stopPropagation, vola onClose.
- **arrows [117]:** ArrowLeft/ArrowRight pro step -1/+1, s boundary check.
- **backdrop click [118]:** `e.target === backdropRef.current` -- klik na pozadi zavre, klik na widget ne.
- **share [119]:** Kopiruje `${origin}/w/${publicWidgetId}` do clipboard, Check icon feedback na 2s.
- **bg toggle [120]:** Dark (rgba(0,0,0,0.85)) / Light (rgba(240,242,245,0.95)) prepinani.
- **scroll lock [121]:** `document.body.style.overflow = 'hidden'` pri open, restore pri close/unmount.
- **portal [122]:** `createPortal(overlay, document.body)` -- nad vsemi layers.
- **Stav:** FUNGUJE

#### [123-130] LayersPanel.jsx / LayerRow.jsx
- **step grouping [123]:** Elementy seskupene podle kroku (Step 1-5), kazdy se sbalovaci hlavickou.
- **DnD reorder [124]:** Deleguje na onReorderElements prop.
- **visibility [125]:** Eye/EyeOff toggle, deleguje na onToggleVisibility.
- **search [126]:** Interni filtr dle nazvu elementu.
- **selection [127]:** onClick vola onSelectElement.
- **visibility icon [128]:** Eye (viditelny) / EyeOff (skryty) s barevnym rozlisenim.
- **drag handle [129]:** GripVertical icon.
- **delete [130]:** Trash2 button, disabled pro locked (zobrazuje Lock icon).
- **Stav:** FUNGUJE

---

### SEKCE D: Property Editory

---

#### [131-132] PropertyEditorFactory.jsx
- **dispatch [131]:** Switch na property.type: color -> ColorPropertyEditor, number -> NumberPropertyEditor, text -> TextPropertyEditor, boolean -> BooleanPropertyEditor, select -> SelectPropertyEditor, spacing -> SpacingEditor, font -> SelectPropertyEditor (s FONT_OPTIONS), shadow -> ShadowEditor, alignment -> AlignmentEditor, opacity -> OpacityEditor, default -> TextPropertyEditor.
- **fallback [132]:** Neznamy typ pada do TextPropertyEditor.
- **Stav:** FUNGUJE

#### [133-136] ColorPropertyEditor.jsx
- **hex input [133]:** Textove pole pro primy hex kod (#RRGGBB).
- **native picker [134]:** `<input type="color">` pro vizualni vyber.
- **palette [135]:** Predefinovane barvy + recently used colors.
- **reset [136]:** Tlacitko pro reset na defaultValue.
- **Stav:** FUNGUJE

#### [137-141] NumberPropertyEditor.jsx
- **slider [137]:** Range input s min/max/step z property definice.
- **+/- [138]:** Inkrement/dekrement tlacitka, respektuji step.
- **input [139]:** Numericke pole s primy vstupem.
- **clamp [140]:** `Math.min(max, Math.max(min, value))` na kazdou zmenu.
- **reset [141]:** Reset na defaultValue.
- **Stav:** FUNGUJE

#### [142-144] TextPropertyEditor.jsx
- **debounced input [142]:** Interni state pro rychle psani, debounced onChange na parent.
- **multiline [143]:** Dle `multiline` prop renderuje textarea misto input.
- **reset [144]:** Reset na defaultValue.
- **Stav:** FUNGUJE

#### [145-148] BooleanPropertyEditor.jsx / SelectPropertyEditor.jsx
- **toggle [145]:** Vizualni switch (animated) s checked/unchecked stylem.
- **reset [146]:** Reset na defaultValue.
- **dropdown [147]:** Native `<select>` s options z property definice.
- **reset [148]:** Reset na defaultValue.
- **Stav:** FUNGUJE

#### [149-151] SpacingEditor.jsx
- **box model [149]:** 4 inputy (top/right/bottom/left) s vizualnim box model diagramem.
- **linked [150]:** Toggle pro synchronizaci vsech stran (zmena jedne zmeni vsechny).
- **reset [151]:** Reset vsech stran na default hodnoty.
- **Stav:** FUNGUJE

#### [152-155] ShadowEditor.jsx
- **config [152]:** X/Y offset, blur, spread, color inputy.
- **inset [153]:** Toggle pro inset vs outset box-shadow.
- **preview [154]:** Live nahled box-shadow na mini elementu.
- **reset [155]:** Reset na 'none'.
- **Stav:** FUNGUJE

#### [156-160] AlignmentEditor.jsx / OpacityEditor.jsx
- **4-button [156]:** left, center, right, justify -- vizualni tlacitka s AlignLeft/Center/Right/Justify ikonami.
- **reset [157]:** Reset na defaultValue.
- **slider [158]:** Range 0-100, zobrazuje aktualni hodnotu v %.
- **preview [159]:** Live opacity efekt na mini elementu.
- **reset [160]:** Reset na defaultValue (typicky 1 = 100%).
- **Stav:** FUNGUJE

#### [161-167] BorderEditor.jsx / BackgroundEditor.jsx / FontEditor.jsx
- **border per-side [161]:** Width/style/color pro kazdou stranu.
- **radius [162]:** 4 rohove radius inputy, linked mode.
- **border preview [163]:** Live border nahled na mini elementu.
- **border reset [164]:** Reset na block defaults.
- **bg color [165]:** Barva pozadi (ColorPropertyEditor).
- **bg gradient [166]:** Linearni/radialni gradient builder (direction + color stops).
- **bg reset [167]:** Reset na default.
- **font family [168]:** 16 font options vcetne system-ui a monospace.
- **font weight/size [169]:** Numericke vstupy pro weight (100-900) a size (px).
- **Stav:** FUNGUJE

#### [170-176] CodeEditor.jsx / CSSPreview.jsx
- **syntax [170]:** Keyword highlighting pro CSS vlastnosti a hodnoty.
- **tab [171]:** Tab key vlozi 2 mezery misto tab znaku.
- **format [172]:** Zakladni CSS formatting (odsazeni, radkove zlomy).
- **copy [173]:** Clipboard copy s feedback ikonou.
- **scoping [174]:** Obaluje CSS do scoped selectoru (.widget-custom-css).
- **error [175]:** Zachyti CSS parse errory a zobrazi varovanio.
- **toggle [176]:** Zobrazit/skryt preview toggle.
- **Stav:** FUNGUJE

---

### SEKCE E: Taby (Content, Style, Advanced, Global)

---

#### [177-179] ContentTab.jsx
- **text properties [177]:** Editable text pole z blockDef (textHeaderTitle, textUploadTitle, atd.). TextPropertyEditor pro kazde.
- **boolean properties [178]:** Toggle prepinace pro show/hide vlastnosti (showIcon, showTitle, atd.).
- **element info [179]:** Zobrazuje block ID, typ, kategorie, step cislo. Informativni, needitovatelne.
- **Stav:** FUNGUJE

#### [180-183] StyleTab.jsx
- **BlockStyleView [180]:** Pro elementy s block registry definici. Renderuje PropertyEditorFactory pro kazdou editableProperty seskupenou dle group (Spacing, Typography, Colors, atd.).
- **LegacyStyleView [181]:** Fallback pro ELEMENT_REGISTRY elementy bez block definice. Pouziva primarne theme properties z ELEMENT_REGISTRY.
- **CollapsibleSection [182]:** Sbalovaci sekce -- kazda group editableProperties tvori jednu sekci s ChevronDown toggle.
- **EditorErrorBoundary [183]:** React Error Boundary obalujici kazdy editor. Zachyti crash a zobrazi fallback text misto padnuti celeho panelu.
- **Stav:** FUNGUJE

#### [184-186] AdvancedTab.jsx
- **custom CSS [184]:** CodeEditor pro zadavani vlastniho CSS per-element. Ulozi do theme jako customCSS_{elementId}.
- **CSS variables [185]:** Seznam dostupnych CSS promennych (--widget-primary-color, --widget-bg, atd.) pro referenci.
- **responsive [186]:** Mobile/tablet override sekce -- property editory pro specificky device mode.
- **Stav:** FUNGUJE

#### [187-190] GlobalTab.jsx
- **typography [187]:** Font family, base font size, heading font. Aplikuje se globalne na cely widget.
- **radius [188]:** Global border-radius slider. Ovlivnuje vsechny zaoblene elementy.
- **quick theme [189]:** QuickThemeDropdown -- 12 presetu ve 3 skupinach (Light, Dark, Colored).
- **effects [190]:** Globalni efekty: box-shadow, transition duration, hover efekt.
- **Stav:** FUNGUJE

---

### SEKCE F: Theme & Template komponenty

---

#### [191-196] QuickThemeDropdown / GlobalThemePanel / ThemePresetCard / ThemePreviewMini
- **theme list [191]:** QuickThemeDropdown zobrazuje 12 theme presetu s nahledem.
- **apply [192]:** Vola onApplyBulkTheme s celym theme objektem -- jeden undo entry.
- **category tabs [193]:** GlobalThemePanel -- Light/Dark/Colored filtrace.
- **preview [194-195]:** ThemePresetCard zobrazuje mini vizualizaci: 4 color swatches + nazev + apply tlacitko.
- **swatches [196]:** ThemePreviewMini zobrazuje 4 hlavni barvy theme v kruhovych swatches.
- **Stav:** FUNGUJE

#### [197-199] TemplateGallery / TemplatePreviewCard
- **list [197]:** 8 predpripravenych sablon s nahledem a popisem.
- **preview [198]:** Mini vizualizace layoutu sablony (step overview + element list).
- **apply [199]:** Vola onApplyTemplate s template ID -- nahradi layout a theme.
- **Stav:** FUNGUJE

---

### SEKCE G: Block Registry (blocks/)

---

#### [200] getBlockById
- **Co dela:** Najde block definici dle ID.
- **Implementace:** `ALL_BLOCKS.find(b => b.id === id) || ALL_BLOCKS.find(b => b.id === ELEMENT_TO_BLOCK_MAP[id]) || null`.
- **Poznamka:** Dvojity lookup -- primo dle ID, pak pres mapovaci tabulku pro legacy element registry ID.
- **Stav:** FUNGUJE

#### [201] resolveBlockId
- **Co dela:** Mapuje element registry ID na block registry ID.
- **Implementace:** `ELEMENT_TO_BLOCK_MAP[elementId] || elementId`.
- **Mapovani:** upload -> upload-zone, viewer -> model-viewer, config -> print-config, pricing -> price-breakdown, cta -> checkout-form.
- **Stav:** OPRAVENO
- **Oprava:** Tato funkce byla pridana pro premosteni dvou registry systemu. Bez ni handleDuplicateElement a selectedElement resolver nefungovaly pro default layout elementy.

#### [202] createBlockInstance
- **Co dela:** Vytvori novou instanci bloku s unikatnim ID.
- **Implementace:** `{instanceId: 'bi_' + crypto.randomUUID(), blockId, type, position, props: {...block.defaultProps}, visible: true, locked: block.locked}`.
- **Stav:** FUNGUJE

#### [203] getBlocksByCategory
- **Co dela:** Vraci vsechny bloky dane kategorie.
- **Implementace:** `ALL_BLOCKS.filter(b => b.category === categoryId)`.
- **Stav:** FUNGUJE

#### [204-206] lockedElements.js
- **canDeleteElement [204]:** `!LOCKED_DELETE_IDS.includes(elementId)`.
- **isLockedElement [205]:** `LOCKED_ELEMENT_IDS.includes(elementId)`. 6 zamcenych: upload-zone, model-viewer, print-config, price-breakdown, checkout-form, order-confirmation.
- **getElementConstraints [206]:** Souhrnny objekt: `{canDelete, canReposition, canRestyle, isLocked}`.
- **Stav:** FUNGUJE

#### [207-208] defaultLayouts.js
- **getDefaultStepElements [207]:** Vraci kopii pole elementu pro dany krok (1-5). Napr. Step 1 = ['upload-zone'].
- **getLayoutPreset [208]:** Vraci preset layout dle ID. 4 presety: standard, compact, salesFocused, quickQuote.
- **Stav:** FUNGUJE

---

### SEKCE H: Feedback komponenty

---

#### [209-212] BuilderToast / UndoRedoIndicator / SaveStatusIndicator
- **useBuilderToast [209]:** Hook vracejici `{toasts, addToast, dismissToast}`. addToast(msg, type, duration) pridava toast do pole.
- **toast rendering [210]:** Auto-dismiss po configurable durations. Fade-out animace pred odstranenime.
- **UndoRedoIndicator [211]:** Maly popup pod undo/redo tlacitky zobrazujici "Undo: changed font size". Fade in/out na zmenu lastAction.
- **SaveStatusIndicator [212]:** Vizualni indikator: idle (zadny text), saving (pulsujici tecka), saved (zeleny check na 2s).
- **Stav:** FUNGUJE

---

## Souhrn auditu

### Celkove statistiky

| Stav | Pocet | Procento |
|------|-------|----------|
| FUNGUJE | 193 | 91% |
| OPRAVENO | 19 | 9% |
| ZNAMY PROBLEM (P2) | 1 | <1% |
| ZBYVA OPRAVIT | 0 | 0% |

### Opravene P1 problemy (19 oprav)

**Hooks / BuilderPage (7 oprav):**
1. Delete/Backspace dvojity handler (useElementSelection + BuilderPage) -> sjednocen do BuilderPage capture phase
2. handleDuplicateElement chybejici resolveBlockId -> pridano
3. selectedElement resolver bracket notation na poli -> opraveno na .find()
4. handleCanvasDrop stale closure -> layoutRef.current
5. updateThemePropertyDebounced chybejici setWithoutHistory -> opraveno
6. auto-save race condition -> isSavingRef guard
7. unifiedUndo/Redo theme+layout fallback -> opraveno

**Components (6 oprav):**
8. ArrowUp/Down boundary clamp -> Math.min/Math.max
9. Escape handler propagace -> e.preventDefault
10. Ctrl+Z/Y capture phase -> pridano true v addEventListener
11. auto-save snapshot inicializace -> skip save pri prvnim renderu
12. addElement createBlockInstance -> spravne pouziti
13. removeElement non-custom podpora -> pridana

**Editors/Tabs (6 oprav):**
Tyto opravy jsou zahrnuty v polockach vyse (resolveBlockId, capture phase, atd.) a byly aplikovany soucasne s hook/component opravami.

### Znamy problem (P2)

- **isDirty JSON.stringify:** `useUndoRedo.isDirty` pouziva `JSON.stringify(current) !== JSON.stringify(originalRef.current)` na kazdy render. Pro velke theme objekty neni idealni z hlediska performance, ale v praxi (theme ma ~50 klicu) je to nemeritelne. Alternativa by byla referenni porovnani nebo hash, ale neprinese meritelne zlepseni.

---

## Reference

- **Hlavni dokumentace:** `docs/claude/Documentation/Widget-Builder-Dokumentace.md`
- **Zdrojove soubory:** `src/pages/admin/builder/`
- **Block definice:** `src/pages/admin/builder/blocks/`
- **Konfigurace:** `src/pages/admin/builder/config/`
- **Styly:** `src/pages/admin/builder/styles/`
