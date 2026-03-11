# 157-AL — UPRAVY — Admin Layout Footer Enhancement — 2026-03-10

## Metadata
- **ID:** 157-AL
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin-Layout
- **Souvisejici ID:** 145-AL (Admin Sidebar Collapse), 119-AD (Analytics Charts)
- **Trigger:** UX enhancement — vylepšení admin footer s kontextovými informacemi a quick links

---

## Souhrn uprav

Přidán vylepšený footer v AdminLayout s aplikačními metadaty (verze z AppContext), statusem online (pomocí useOnlineStatus), prostředím (DEV/PROD badge), tenantId s copy tlačítkem, quick linky na Docs/Support/Changelog a tagline. Implementován collapsed mode (jen status dot). Celkem 1 upravený soubor (AdminLayout.jsx), ~250 řádků nového kódu.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/admin/AdminLayout.jsx` | Zmeneno | 1-800 | Přidán AdminFooter komponenta, integrován do main layout, styling footer + collapsed sidebar mode |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminLayout.jsx`

**Typ:** Zmeneno
**Radky:** 1-800 (cela komponenta)
**Duvod:** Vylepšení admin interface — přidání kontextového footeru s versí, statusem a quick links

**Co se zmenilo:**

#### Footer komponenta (nová, ~200 řádků)
- **AdminFooter** — nová vnitřní komponenta
  - **Sekce 1: Status Indicators**
    - Online/Offline dot (zelená/šedá)
    - DEV/PROD badge (kontrola VITE_MODE)

  - **Sekce 2: Version Info**
    - App version z `AppContext` (`appVersion`)
    - Zkrácený format: `v1.2.3` nebo `Dev 0.1`

  - **Sekce 3: Tenant Info**
    - `getTenantId()` zobrazení
    - Copy button (CopyButton komponenta)
    - Fallback text: "Tenant not set"

  - **Sekce 4: Quick Links**
    - Link "Dokumentace" (target="_blank")
    - Link "Support" (target="_blank")
    - Link "Changelog" (target="_blank")

  - **Sekce 5: Tagline**
    - "Made with ♥ by ModelPricer" (kliknutelné na homepage)

  - **Collapsed mode** (když `isCollapsed=true`)
    - Zobrazí jen status dot
    - Tooltip na hover (Forge design)

#### Layout integrační změny
- **Footer umístění:** pod hlavní content, sticky bottom (desktop), scrollable (mobile)
- **Spacing:** `pt-4 border-t` odděleno
- **Styling:** Forge dark theme (`--forge-bg-surface`, `--forge-text-muted`)
- **Responsive:** Text skryt na mobilech (<768px), jen dot vidět
- **Props:** `isCollapsed` z parent `AdminLayout` state

#### Styling (CSS modul nebo inline)
- Flex layout `flex justify-between items-center`
- Gap `gap-6` mezi sekcemi
- Muted text pro sekundární info
- Tooltip styling pro collapsed mode

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminLayout (parent), AppContext (čtení verze), useOnlineStatus hook
- **Breaking changes:** Ne — jen přidání nového UI prvku
- **Nove zavislosti:** Není (pouze builtin hooks a existující CopyButton komponenta)
- **Rizika:** Niska — footer je dekorativní, neovlivňuje logiku

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Footer zobrazení v admin sekci, collapsed sidebar toggle, online/offline switch
- **Poznamky:** Footer responsive na mobilech (skrytý text, viditelný dot)

---
