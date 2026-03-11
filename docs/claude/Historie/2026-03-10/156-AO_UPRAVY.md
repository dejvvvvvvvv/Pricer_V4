# 156-AO — UPRAVY — Batch 16: Admin Customers Page — 2026-03-10

## Metadata
- **ID:** 156-AO
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin-Orders / Customers
- **Souvisejici ID:** 155 (Admin Order Detail), 154 (Onboarding Tour)
- **Trigger:** Autonomní implementace — Batch 16 z planu 115-151

---

## Souhrn uprav

Implementace nové Admin stránky pro správu a přehled zákazníků. Agregace dat z objednávek — automatické vypočítání customer metriky (počet objednávek, celkové tržby, poslední objednávka, status). Sortable tabulka s expandable detail rows, 4 stat karty (Total Customers, Total Revenue, Repeat Rate, Avg Order Value), search filtr, avatar placeholders, CZ/EN překlady.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminCustomers.jsx | Novy soubor | 1-620 | Nová stránka s customer agregací, stat kartami, sortable tabulkou, search filtrem |
| 2 | src/pages/admin/Routes.jsx | Zmeneno | 42-48 | Přidání route: `/admin/customers` → lazy AdminCustomers |
| 3 | src/pages/admin/AdminLayout.jsx | Zmeneno | 75-92 | Přidání "Customers" navigační položky do menu sidebar |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminCustomers.jsx`

**Typ:** Nový soubor
**Radky:** 1-620
**Duvod:** Centralizovaný přehled všech zákazníků s agregovanými metrikami a možností prohlídky jejich objednávek.

**Co se zmenilo:**
- Hook: `useEffect` fetch → GET `/api/orders` → agregace do customers map (groupBy email)
- Kalkulace per-customer:
  - `totalOrders`: count
  - `totalSpent`: sum cen
  - `lastOrderDate`: max date
  - `lastOrderStatus`: status poslední objednávky
- 4 stat karty (Forge design, teal accenty):
  - "Celkem zákazníků": `Object.keys(customers).length`
  - "Celkem tržby": `sum(totalSpent)` formatted CZK
  - "Opakovní zákazníci (%)": `(repeatCount / totalCustomers) * 100`
  - "Průměrná hodnota objednávky": `totalSpent / totalOrders` per-customer
- Sortable tabulka sloupce: Jméno, Email, Objednávek, Tržby, Poslední objednávka, Stav
  - `useSortableData` hook s sort config
  - Sortovatelné: Email (ASC/DESC), Objednávek (ASC/DESC), Tržby (ASC/DESC), Poslední objednávka (ASC/DESC)
- Expandable row: onClick → zobrazit seznam posledních 5 objednávek zákazníka
- Search filtr: input s live filtrováním (jméno/email)
- Avatar placeholder: `<div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-600">` + inicály
- I18n: LanguageContext pro CZ/EN překlady
- Empty state: "Žádní zákazníci nalezeni" když nema data

---

### 2. `src/pages/admin/Routes.jsx`

**Typ:** Zmeneno
**Radky:** 42-48
**Duvod:** Registrace nové route `/admin/customers`.

**Co se zmenilo:**
- Import: `const AdminCustomers = lazy(() => import('./AdminCustomers'))`
- Route: `<Route path="/admin/customers" element={<AdminCustomers />} />`
- Suspense fallback: `<AdminPageSkeleton />`

---

### 3. `src/pages/admin/AdminLayout.jsx`

**Typ:** Zmeneno
**Radky:** 75-92
**Duvod:** Přidání navigačního odkazu do Admin menu.

**Co se zmenilo:**
- Přidání nav item:
  ```jsx
  {
    id: 'customers',
    icon: <Users size={20} />,
    label: 'Customers',
    href: '/admin/customers',
    group: 'Hlavní'
  }
  ```
- Ikonka: `Users` z lucide-react
- Placement: pod "Orders" v navigaci

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminLayout (navigace), Routes.jsx (routing), backend API (GET /api/orders)
- **Breaking changes:** Ne — nová sekce
- **Nove zavislosti:** Žádné (interní hooks + Forge design)
- **Rizika:** Agregace velkého počtu objednávek (1000+) může být pomalá — frontend paging/caching na úrovni backend GET /api/customers s precomputed agregátem

---

## Testovani

- **Build:** npm run build — (pending)
- **Manual test:** (pending) —
  - [ ] Navigace: Admin menu má "Customers" link
  - [ ] Route: `/admin/customers` se načte bez erroru
  - [ ] Stat karty: zobrazují správné čísla (SQL agregát backup)
  - [ ] Search filtr: filtruje tabulku live (jméno/email)
  - [ ] Sort: kliknutí na header sortuje (ASC/DESC ikona)
  - [ ] Expand row: zobrazí 5 posledních objednávek zákazníka
  - [ ] Avatar: inicály se zobrazují správně (Kunyakov → KU)
  - [ ] Empty state: test s DB bez zákazníků
  - [ ] I18n: test CZ/EN překlady v stat kartách
- **Poznamky:** Performance: Pokud máte 10k+ objednávek, agregace bude trvat. Řešení: backend endpoint `/api/customers?aggregate=true` který vrátí precomputed statistiky.

---
