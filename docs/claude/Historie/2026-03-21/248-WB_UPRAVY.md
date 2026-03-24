# 248-WB — UPRAVY — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 248-WB
- **Session:** S06
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 247-WB, 243-WB
- **Trigger:** Browser testing Widget Builderu v Chrome — identifikace bugu a hotfix

---

## Souhrn uprav

Browser testovani Widget Builderu na localhost:4028. Jeden hotfix proveden (SaveStatusIndicator.jsx). 4 bugy identifikovany a zdokumentovany pro opravu.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/widget-builder/components/SaveStatusIndicator.jsx | Zmeneno | styles definice | Presun dirtyDotStyle a dalsich stylu NAD STATUS_CONFIG objekt ktery je referencoval |

---

## Detailni zmeny

### 1. `src/pages/admin/widget-builder/components/SaveStatusIndicator.jsx`

**Typ:** Zmeneno (bugfix)
**Radky:** styles definice
**Duvod:** `dirtyDotStyle` byl pouzit v STATUS_CONFIG objektu pred svou inicializaci — zpusoboval runtime error pri renderovani

**Co se zmenilo:**
- Pred: Styly definovany AZ za STATUS_CONFIG objektem ktery je referencoval
- Po: Styly presunuty NAD STATUS_CONFIG aby byly dostupne v dobe pouziti
- Typicky JavaScript hoisting problem — const/let nejsou hoistovany jako var

---

## Bugy nalezene (neopravene)

| # | Zavaznost | Popis | Soubor/Oblast |
|---|-----------|-------|---------------|
| 1 | P1 | Levy panel — taby Bloky/Sablony/Vrstvy/Global neprepinaji obsah (kliknutim se nezmeni zobrazeny content) | BuilderLeftPanel.jsx |
| 2 | P1 | Pravy panel — "no editable style properties" pro vsechny elementy (block properties nenacteny z registry) | BuilderPropertyPanel.jsx / PropertyEditorFactory.jsx |
| 3 | P2 | Element IDs zobrazuji UUID (bi_xxx) misto lidsky citelnych nazvu | BuilderElementRenderer.jsx / element naming |
| 4 | P1 | Tenant ID mismatch — getTenantId() vraci jiny ID nez kde jsou widgety ulozeny | useBuilderState.js / adminTenantStorage.js |

---

## Funkcni oblasti (potvrzene testem)

| # | Oblast | Status |
|---|--------|--------|
| 1 | 3-panelovy layout (dark levy/pravy, svetly canvas) | PASS |
| 2 | Top bar (step tabs, device switcher, zoom, Preview/Export/Save) | PASS |
| 3 | Canvas renderovani elementu (header, steps, 3D Model Viewer, Print Config) | PASS |
| 4 | Element selection (klik -> teal border, floating toolbar, resize handles) | PASS |
| 5 | Floating toolbar (edit/move/duplicate/visibility/delete) | PASS |
| 6 | Escape key deselect | PASS |
| 7 | LIVE PREVIEW badge | PASS |
| 8 | Zoom controls (-, 100%, +, fit) | PASS |
| 9 | Breadcrumb bar ("body") | PASS |

---

## Dopad zmen

- **Ovlivnene komponenty:** SaveStatusIndicator.jsx (jen tento soubor hotfixnut)
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne
- **Rizika:** 4 neopravene bugy (3x P1, 1x P2) — levy panel nefunkcni, pravy panel nefunkcni, tenant ID mismatch muze zpusobit ztratu dat pri ukladani

---

## Testovani

- **Build:** PASS (dev server localhost:4028)
- **Manual test:** Chrome browser test pres MCP — Widget Builder na /admin/widget/builder/w_K01fvDdgqT
- **Poznamky:** 9 z 13 testovanych oblasti PASS, 4 bugy identifikovany

---
