# 113-GN — KONVERZACE — Autonomní Implementační Session — 2026-03-10

## Metadata
- **ID:** 113-GN
- **Session:** S01 (Autonomní, uživatel nepřítomen)
- **Datum:** 2026-03-10
- **Oblast:** General / 3D Features (Build Plate Viewer + Mesh Repair)
- **Souvisejici ID:** zatím žádné (nová session)

---

## Tema session

Autonomní implementační session bez přítomnosti uživatele. Klíčová rozhodnutí:
- Paralelní implementace 3 velkých features pomocí agentů
- Build Plate Viewer jako nová záložka (ne nahrazení)
- Mesh Repair čistě klientsky (Three.js)
- Postupná integrace a dokumentace

---

## Prubeh konverzace

### [1] Uzivatel

> Ulož historii plánování nové pracovní session.
>
> SESSION INFO:
> - Datum: 2026-03-10
> - Typ: Autonomní implementační session (uživatel nepřítomen)
>
> KONTEXT KONVERZACE:
> Uživatel zadal autonomní práci na projektu bez nutnosti jeho přítomnosti. Klíčové úkoly:
>
> 1. **Build Plate Viewer** — nová záložka v ModelVieweru v test-kalkulačce, zobrazení modelu na tiskové podložce s gridem, orbit controls, auto-orient tlačítko pro automatické položení modelu
> 2. **Mesh Repair** — implementace klientské opravy 3D modelů (analýza mesh, detekce problémů, automatická oprava, export opraveného STL)
> 3. **Další vylepšení** — postupná implementace dalších užitečných funkcí
>
> ROZHODNUTÍ:
> - Vše se implementuje paralelně pomocí agentů
> - Build plate viewer jako záložka vedle existujícího vieweru (ne nahrazení)
> - Mesh repair čistě klientsky pomocí Three.js
> - Po každé implementaci se ukládá historie
>
> SOUBORY KTERÉ SE BUDOU MĚNIT:
> - `src/pages/test-kalkulacka/components/ModelViewer.jsx` — přidání tab systému + build plate viewer
> - `src/lib/meshRepair.js` — nový soubor pro mesh repair utility
> - `src/pages/test-kalkulacka/components/MeshRepairPanel.jsx` — nový UI panel
> - `src/pages/test-kalkulacka/index.jsx` — integrace nových komponent
> - Další soubory dle potřeby

### [1] Claude

**Shrnuti odpovedi:**
- Chápu autonomní session bez přítomnosti uživatele
- Rozumím 3 hlavním úkolům: Build Plate Viewer, Mesh Repair, další vylepšení
- Potvrzuji klíčová rozhodnutí: paralelní implementace, záložka (ne nahrazení), čistě klientsky Mesh Repair
- Architektura: ModelViewer.jsx bude mít tab systém, nový MeshRepairPanel.jsx pro UI, meshRepair.js pro logiku
- Plánuji postupný save historie po každé fázi (build plate → mesh repair → dokumentace)

**Akce provedene:**
- Uložen seznam souboru které se budou měnit
- Zaznamenán plán autonomní session do historie
- Připraven postup: explore fáze → implementace → CP1/CP2/CP3 → history save

**Soubory zminene:**
- `src/pages/test-kalkulacka/components/ModelViewer.jsx` — bude mít tab systém
- `src/lib/meshRepair.js` — nový soubor pro mesh logiku
- `src/pages/test-kalkulacka/components/MeshRepairPanel.jsx` — nový UI panel
- `src/pages/test-kalkulacka/index.jsx` — integrace
- `src/components/ui/` — případně nové UI komponenty (ForgeTabs, ForgeBadge)

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Build Plate Viewer jako **nová záložka** v ModelVieweru | Lepší UX, zachování stávajícího vieweru, nenarušuje test-kalkulačku | Uživatel |
| 2 | Mesh Repair **čistě klientsky** (Three.js) | Bez závislostí na backend, Privacy, Performance | Uživatel |
| 3 | Implementace **paralelně pomocí agentů** | Rychleji, lepší dělba práce | Uživatel |
| 4 | **Historie save po každé fázi** | Bezpečnostní P0, prevence ztráty kontextu | Dohodnuté (CLAUDE.md P0) |

---

## Otevrene otazky

- [ ] Který z 3 úkolů (Build Plate / Mesh Repair / Další) se implementuje **prvním**?
- [ ] Jaké jsou **minimální requirements** pro Build Plate Viewer (jen grid + model, nebo i orienting)?
- [ ] Má Mesh Repair mít **persistence** (lokální storage) nebo je to jen pro sessiony?
- [ ] Kolik **agentů se zapojí** do implementace (1 na feature, nebo sdílení)?

---

## Navaznost

- **Predchozi:** 112-GN (Code quality sprint final batch 2, 2026-03-09)
- **Nasledujici:** zatím neznámý — čeká na explore fázi a implementaci

---

## Poznamky

- **Status:** Plán hotov, čeká na start implementace
- **Next action:** Zahájit explore fázi + spustit paralelní agenty pro Build Plate Viewer
- **Kritická čekání:** Zodpovězení otevřených otázek před zahájením CP1 (analýza)
