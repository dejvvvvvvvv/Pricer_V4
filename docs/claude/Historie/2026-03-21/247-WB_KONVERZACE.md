# 247-WB — KONVERZACE — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 247-WB
- **Session:** S06
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 244-WB, 245-WB, 246-WB, 248-WB

---

## Tema session

Browser testovani Widget Builderu v Chrome (MCP) na localhost:4028 po implementaci Wave 1-4. Identifikace 4 bugu a 1 hotfix.

---

## Prubeh konverzace

### [1] Uzivatel
> Save history for Widget Builder browser testing. Date: 2026-03-21.
>
> ## What was done (Browser Testing)
>
> ### Testing in Chrome (MCP)
> - Dev server running on localhost:4028
> - Widget builder loaded at /admin/widget/builder/w_K01fvDdgqT
> - Fixed: `SaveStatusIndicator.jsx` — `dirtyDotStyle` used before initialization (moved styles above STATUS_CONFIG)
>
> ### Test Results
> **Working:**
> - 3-panel layout renders correctly (dark left/right panels, light canvas)
> - Top bar with step tabs, device switcher, zoom controls, Preview/Export/Save buttons
> - Canvas shows widget elements: header, steps, 3D Model Viewer, Print Configuration
> - Element selection works (click -> teal border, floating toolbar, resize handles)
> - Floating toolbar with edit/move/duplicate/visibility/delete buttons
> - Escape key deselects element
> - LIVE PREVIEW badge visible
> - Zoom controls at bottom (-, 100%, +, fit)
> - Breadcrumb bar at bottom showing "body"
>
> **Bugs found:**
> 1. Left panel tabs don't switch content (clicking Bloky/Sablony/Vrstvy/Global doesn't change view)
> 2. Right panel shows "no editable style properties" for elements (block properties not loaded from registry)
> 3. Element IDs show UUID (bi_xxx) instead of human-readable names
> 4. Tenant ID mismatch — builder uses getTenantId() which returns different ID than where widgets are stored

### [1] Claude
**Shrnuti odpovedi:**
- Prijato jako historie save request pro browser testing session
- Agent spusten pro zapis zaznamu 247-WB (KONVERZACE) a 248-WB (UPRAVY)

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Hotfix SaveStatusIndicator.jsx — presun stylu pred STATUS_CONFIG | dirtyDotStyle pouzit pred inicializaci zpusoboval runtime error | Claude |

---

## Otevrene otazky

- [ ] Bug 1: Levy panel — taby Bloky/Sablony/Vrstvy/Global neprepinaji obsah
- [ ] Bug 2: Pravy panel — "no editable style properties" pro vsechny elementy (block properties nenacteny z registry)
- [ ] Bug 3: Element IDs zobrazuji UUID (bi_xxx) misto lidsky citelnych nazvu
- [ ] Bug 4: Tenant ID mismatch — getTenantId() vraci jiny ID nez kde jsou widgety ulozeny

---

## Navaznost

- **Predchozi:** 244-WB (Wave 4 KONVERZACE), 245-WB, 246-WB (Wave 4 UPRAVY)
- **Nasledujici:** zatim zadny

---
