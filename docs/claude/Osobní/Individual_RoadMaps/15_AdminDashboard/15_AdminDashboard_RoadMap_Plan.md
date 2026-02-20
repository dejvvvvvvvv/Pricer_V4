# 15. Admin — Dashboard — Detailni RoadMap Plan

> **Stav:** 🟡 40% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** Orders (#7) pro data, Analytika (#21) pro metriky, Supabase (#27) pro agregace
> **Kdo na nem zavisi:** Nikdo primo

---

## Prehled

Admin dashboard — vstupni stranka admin panelu se souhrnnymi metrikami (KPI karty). UI je hotove (draggable karty, metric registry), ale vsechna data jsou demo/mock.

**Hlavni soubor:** `src/pages/admin/AdminDashboard.jsx`
**Metric registry:** Komplexni system (~1848 radku)

---

## Co je HOTOVO (✅)

### KPI grid (70%)
- [x] Draggable karty s metrikami
- [x] Drag&drop editace rozlozeni
- [x] Metric registry (1848 radku)
- [x] Branding tips
- [x] Responsivni grid

---

## Co CHYBI / je potreba dodelat

### Faze 1: Zakladni realna data (Priorita: STREDNI)

#### Ukol 1.1: Metriky z Orders storage
- **Soubor:** `src/pages/admin/AdminDashboard.jsx`
- **Co udelat:**
  - [ ] Nacist objednavky z Orders storage (localStorage/Supabase)
  - [ ] Vypocitat zakladni metriky:
    - Pocet objednavek dnes/tento tyden/tento mesic
    - Celkove trzby dnes/tento tyden/tento mesic
    - Prumerna hodnota objednavky
    - Pocet novych objednavek (cekajicich na zpracovani)
  - [ ] Nahradit mock data realnyimi hodnotami

#### Ukol 1.2: System health metriky
- **Co udelat:**
  - [ ] PrusaSlicer backend status (health check)
  - [ ] Supabase connection status
  - [ ] Pocet aktivnich presetu
  - [ ] Pocet materialu
  - [ ] Posledni objednavka datum

### Faze 2: Supabase agregace (Priorita: NIZKA, az po #27)

#### Ukol 2.1: Realtime metriky
- **Co udelat:**
  - [ ] Supabase RPC pro agregace (SQL funkce)
  - [ ] Cache metriky — nepocitat pri kazdem renderovani
  - [ ] Refresh interval (napr. kazdych 60s)

### Faze 3: Vizualizace (Priorita: NIZKA)

#### Ukol 3.1: Grafy
- **Co udelat:**
  - [ ] Trzby za posledních 7/30 dni (ciarovy graf)
  - [ ] Top materialy (kolacovy graf)
  - [ ] Objednavky po dnech (sloupcovy graf)
- **Poznamka:** Muze pouzit jednoduchou knihovnu (recharts, chart.js)

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 1: Realna data | 3-5h | Orders (#7) | STREDNI |
| 2 | Faze 2: Supabase | 2-4h | Supabase (#27) | NIZKA |
| 3 | Faze 3: Grafy | 3-5h | Faze 1 | NIZKA |

**Celkem pro Beta:** ~3-5 hodin (jen Faze 1)

---

## Poznamky

- Pro Beta staci zakladni metriky z Orders — neprehaneet
- Dashboard se zlepsi postupne jak se pridaji dalsi datove zdroje
- Mock data jsou OK pro demo — ale pro beta musi byt realna

---

## Kriticke doplnky (z review)

### Metriky — presna definice
- [ ] **KPI karty (zakladni):**
  | Metrika | Zdroj | Vypocet |
  |---------|-------|---------|
  | Objednavky dnes | orders WHERE created_at >= today | COUNT |
  | Trzby dnes | orders WHERE status=completed AND created_at >= today | SUM(total_price) |
  | Prumerna objednavka | trzby / pocet objednavek | AVG |
  | Cekajici objednavky | orders WHERE status IN ('pending', 'confirmed') | COUNT |
  | Uspesnost plateb | paid / total * 100 | % |
  | Top material | order_items GROUP BY material | MODE |
- [ ] **System health:**
  | Metrika | Zdroj | Jak ziskat |
  |---------|-------|-----------|
  | Slicer status | GET /api/health | fetch kazdych 60s |
  | Supabase status | Supabase client ping | connection test |
  | Aktivni presety | presets storage | COUNT where active=true |
  | Posledni objednavka | orders | MAX(created_at) |

### Anti-AI-generic pravidla pro Dashboard
- [ ] ZADNE nahodne stat karty (pouze relevantni metriky)
- [ ] ZADNE genericke ikony (pouzit konkretni ikony: objednavka, penize, material)
- [ ] Karty musi mit realna data nebo "Zatim zadna data" (ne fake cisla)
- [ ] Draggable grid je skvely — nechat, ale omezit na 6-8 karet maximum
- [ ] Graf jen kdyz existuji data za alespon 7 dnu
