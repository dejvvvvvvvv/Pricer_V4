# 246-WB — UPRAVY — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 246-WB
- **Session:** S05
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 244-WB, 245-WB, 242-WB, 243-WB
- **Trigger:** Widget Builder Wave 4 — Agent 13 (Template System)

---

## Souhrn uprav

Agent 13 implementoval kompletni Template System pro Widget Builder. Zahrnuje 8 predpripravenych sablon kalkulacky (Standard 3D, Quick Quote, Compact, Sales-Focused, Professional, Shopify Integration, Material Comparison, Express Service), kartu pro nahled sablony s ThemePreviewMini a feature tagy, galerii s filtrovanim podle kategorii a confirmation dialogem, a integraci templates tabu do leveho panelu builderu (nyni 5 tabu celkem).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | templateLayouts.js | Novy soubor | cele | 8 predpripravenych sablon kalkulacky s layout konfiguracemi |
| 2 | TemplatePreviewCard.jsx | Novy soubor | cele | Karta nahledu sablony s ThemePreviewMini, step count, feature tagy, active badge |
| 3 | TemplateGallery.jsx | Novy soubor | cele | Galerie sablon s category filtry, confirmation dialog, Start from Scratch |
| 4 | BuilderLeftPanel.jsx | Zmeneno | vice sekci | Pridan Templates tab (5. tab), integrace TemplateGallery |

---

## Detailni zmeny

### 1. `templateLayouts.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Builder potrebuje predpripravene layouty aby uzivatele nemuseli zacinat od nuly

**Co se zmenilo:**
- 8 kompletních sablon s ruznym zamenim:
  - **Standard 3D** — vychozi plnohodnotna kalkulacka
  - **Quick Quote** — zjednodusena pro rychle naceneni
  - **Compact** — minimalisticky layout pro male prostory
  - **Sales-Focused** — duraz na konverzi, CTA prvky
  - **Professional** — cistý byznysovy design
  - **Shopify Integration** — optimalizovana pro Shopify embed
  - **Material Comparison** — duraz na porovnani materialu
  - **Express Service** — pro expresni tiskarny, rychle objednavky
- Kazda sablona obsahuje: nazev, popis, kategorie, konfigurace kroku, theme nastaveni, layout definice

---

### 2. `TemplatePreviewCard.jsx`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Vizualni nahled sablony pred aplikaci

**Co se zmenilo:**
- Card komponenta pro zobrazeni jedne sablony
- ThemePreviewMini — maly nahled barevneho schematu sablony
- Step count — pocet kroku ktere sablona definuje
- Feature tagy — klicove vlastnosti sablony (napr. "Shopify Ready", "Compact", "CTA Focus")
- Active badge — zvyrazneni aktualne aktivni/pouzivane sablony

---

### 3. `TemplateGallery.jsx`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Uzivatel potrebuje galerii pro vyber a aplikaci sablony

**Co se zmenilo:**
- Galerie zobrazujici vsechny dostupne sablony
- Category filtry — filtrovani podle kategorii (All, Standard, Minimal, Sales, Integration, atd.)
- Confirmation dialog — pred aplikaci sablony se zobrazi potvrzeni (protoze prepise aktualni layout)
- "Start from Scratch" — moznost zacinat s prazdnym layoutem
- Responsive grid layout

---

### 4. `BuilderLeftPanel.jsx`

**Typ:** Zmeneno
**Radky:** vice sekci
**Duvod:** Integrace TemplateGallery jako 5. tabu v levem panelu

**Co se zmenilo:**
- Pred: 4 taby v levem panelu (Blocks, Layers, Settings, ...)
- Po: 5 tabu — pridan Templates tab
- Import TemplateGallery komponenty
- Template tab renderuje TemplateGallery s propojenim na builder state (onApplyTemplate callback)

---

## Dopad zmen

- **Ovlivnene komponenty:** BuilderLeftPanel (primo), BuilderPage (neprime — left panel je child), useBuilderState (pokud template aplikace meni state)
- **Breaking changes:** Ne — novy tab neovlivnuje existujici funkcionalitu
- **Nove zavislosti:** Zadne npm balicky — vse custom
- **Rizika:** Minimalni — template aplikace by mela projit pres confirmation dialog aby uzivatel neprisel o rozpracovany layout

---

## Testovani

- **Build:** npm run build — PASS (overeno Agent 11 pred integraci)
- **Manual test:** Overeni rout a import chainu (Agent 11)
- **Poznamky:** Browser testovani template galerie zatim neprovedeno

---
