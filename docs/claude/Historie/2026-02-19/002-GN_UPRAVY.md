# 002-GN — UPRAVY — General (Historie System) — 2026-02-19

## Metadata
- **ID:** 002-GN
- **Session:** S01
- **Datum:** 2026-02-19
- **Oblast:** General — Historie system, agenti, skills, CLAUDE.md
- **Souvisejici ID:** 001-GN, 003-GN, 004-GN
- **Trigger:** Uzivatelsky pozadavek — vytvoreni automatizovaneho systemu ukládání historie

---

## Souhrn uprav

Vytvoreni kompletniho Historie systemu od nuly: 8 novych souboru (sablony, registry, master index, agent, skill) + 5 upravenych souboru (oba CLAUDE.md, AGENT_MAP, SKILLS_MAP, MEMORY). Celkem 13 souboru. Cil byl zprovoznit automatizovane ukladani konverzacni historie s agenty, triggery a ID systemem.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | docs/claude/Historie/ID-REGISTRY.md | Novy soubor | cely | Registr zkratek (40+), globalni pocitadlo, format ID, pravidla |
| 2 | docs/claude/Historie/MASTER-HISTORIE.md | Novy soubor | cely | Centralni index zaznamu, statistiky, format tabulky |
| 3 | docs/claude/Historie/SABLONY/SABLONA-KONVERZACE.md | Novy soubor | cely | Sablona KONVERZACE — metadata, prubeh, rozhodnuti |
| 4 | docs/claude/Historie/SABLONY/SABLONA-UPRAVY.md | Novy soubor | cely | Sablona UPRAVY — stredni detail, radkove rozsahy, dopad |
| 5 | docs/claude/Historie/SABLONY/SABLONA-OTAZKY.md | Novy soubor | cely | Sablona OTAZKY — plne zneni, rozhodnuti, souhrn |
| 6 | docs/claude/Historie/SABLONY/SABLONA-DENNI-PREHLED.md | Novy soubor | cely | Sablona DENNI-PREHLED — sessions, vsechny soubory, statistiky |
| 7 | .claude/agents/mp-spec-docs-historie.md | Novy soubor | cely | Agent definice (haiku, 12 sekci, presny postup) |
| 8 | .agents/skills/history/SKILL.md | Novy soubor | cely | Skill /history pro rucni trigger |
| 9 | CLAUDE.md (compact) | Zmeneno | 33-78, 244-249 | Pridana Historie sekce na pozici 2, triggery, opravy |
| 10 | Model_Pricer-V2-main/CLAUDE.md (master) | Zmeneno | 522-582, 247-266, 562 | Nova sekce 17.5 (7 podsekci), CP workflow, checklist |
| 11 | docs/claude/AGENT_MAP.md | Zmeneno | 38, 364, 392 | Novy agent v Docs domene, statistiky 107 agentu |
| 12 | docs/claude/SKILLS_MAP.md | Zmeneno | 8, 56-62 | Sekce 1.5 Historie s history skill, pocet 29 |
| 13 | MEMORY.md | Zmeneno | 5-9, 17, 96-106 | Cesta Historie dir, pocty, nova sekce Historie System |

---

## Detailni zmeny

### 1. `docs/claude/Historie/ID-REGISTRY.md`

**Typ:** Novy soubor
**Radky:** cely soubor
**Duvod:** Jeden centralni zdroj pravdy pro ID system — agent musi precist pred kazdym zaznamen

**Co se zmenilo:**
- Vytvoreno globalni pocitadlo (Posledni pouzite: 000, Dalsi: 001)
- Format ID: {NNN}-{ZK} (3-mistne cislo + 2-znakova zkratka)
- Session format: S{NN} (S01, S02, ...)
- 40+ registrovanych zkratek ve 5 skupinach: Admin, Kalkulacky, Verejne stranky, Systemy, UI, Infrastruktura, Business

---

### 2. `docs/claude/Historie/MASTER-HISTORIE.md`

**Typ:** Novy soubor
**Radky:** cely soubor
**Duvod:** Centralni rozcestnik — rychla navigace bez cteni jednotlivych souboru

**Co se zmenilo:**
- Sekce Statistiky (celkem zaznamu, prvni, posledni)
- Tabulkovy format zaznamu: ID | Session | Oblast | Typ | Popis | Souvisejici | Cesta
- Komentar s prikladem formatu vcetne headingu pro kazdy den

---

### 3-6. `docs/claude/Historie/SABLONY/*`

**Typ:** 4 nove soubory
**Radky:** kazdy cely
**Duvod:** Striktni format pro konzistenci — agent se ridi presne sablonami

**Co se zmenilo:**
- SABLONA-KONVERZACE.md: metadata, prubeh [N] Uzivatel/Claude, rozhodnuti, otevrene otazky, navaznost
- SABLONA-UPRAVY.md: metadata + trigger, souhrn, tabulka souboru, detailni sekce, dopad, testovani
- SABLONA-OTAZKY.md: metadata, QN sekce (ptal se, otazka, odpoved, rozhodnuti, dopad), souhrn tabulka
- SABLONA-DENNI-PREHLED.md: sessions tabulka, vsechny soubory, souhrn dne, otevrene ukoly, statistiky

---

### 7. `.claude/agents/mp-spec-docs-historie.md`

**Typ:** Novy soubor
**Radky:** cely soubor (~150 radku)
**Duvod:** Specificke zadani agenta — haiku model, 12 sekci, presny postup ukládání

**Co se zmenilo:**
- 12 sekci: PURPOSE, WHEN TO USE, INPUT FORMAT, WORKFLOW (6 kroku), OUTPUT, PRAVIDLA, OWNED PATHS, ERROR HANDLING, DEFINITION OF DONE, PRIKLADY, BEZPECNOST
- Triggery: Auto-checkpoint (pre-compact P0, pre-plan P0, pre-clear P0), Manual (/history)
- Pravidla: uzivatelsky text vzdy cely, Claude odpovedi zkracene, zadne citlive udaje [REDACTED]

```md
<!-- Klic z agenta — trigger seznam (architektura): -->
TRIGGERS (P0 — BEZODKLADNE pred):
- Auto Compact konverzace
- Dodani planu uzivateli (pred /clear)
- /clear konverzace
TRIGGERS (Standard — pri kazdém):
- CP1 → CP2 checkpoint
- CP2 → CP3 checkpoint
- Manual: /history nebo "uloz historii"
```

---

### 8. `.agents/skills/history/SKILL.md`

**Typ:** Novy soubor
**Radky:** cely soubor
**Duvod:** Rucni trigger pres /history — skill zkompiluje kontext a spusti agenta

**Co se zmenilo:**
- Workflow: cteni ID-REGISTRY → kompilace kontextu (konverzace, upravy, otazky) → spusteni agenta
- PLAN sekce: ulozeni PLAN_PATH, PLAN_SHRNUTI, PLAN_ROZHODNUTI kdyz existuje plan
- Trigger slova: /history, "uloz historii", "save history"

---

### 9. `CLAUDE.md` (compact)

**Typ:** Zmeneno
**Radky:** 33-78 (nova sekce Historie), 244-249 (workflow triggery)
**Duvod:** Uzivatel chtel Historie sekci dukladne popsanou a blize vrchu dokumentu

**Co se zmenilo:**
- Historie sekce presunuta na pozici 2 (hned pod Anti-Hallucination Gate)
- Oprava NESMOLITELNE → BEZODKLADNE
- Oprava "pred ztra tou" → "pred ztratou"
- Doplneni triggeru: pred dodanim planu (P0), pred /clear (P0)
- Sekce obsahuje: Triggery, Struktura slozek, ID system, 4 typy souboru, Co ulozit

---

### 10. `Model_Pricer-V2-main/CLAUDE.md` (master)

**Typ:** Zmeneno
**Radky:** 522-582 (nova sekce 17.5), 247-266 (CP workflow), 562 (pre-commit checklist)
**Duvod:** Uzivatel zjistil ze master chybel — opraveno

**Co se zmenilo:**
- Nova sekce 17.5 "Historie Konverzaci" s 7 podsekcemi (triggery, slozky, ID, typy, obsah, priority, pravidla)
- CP1/CP2/CP3 workflow — pridan HISTORIE SAVE pred kazdym checkpointem
- Pre-commit checklist — pridan radek "[ ] Historie ulozena"
- Oprava NESMOLITELNE → BEZODKLADNE vsude v master

---

### 11. `docs/claude/AGENT_MAP.md`

**Typ:** Zmeneno
**Radky:** 38 (statistiky), 364 (novy agent), 392 (hot spot)
**Duvod:** Novy agent musi byt evidovan v mape

**Co se zmenilo:**
- Statistiky: 101 → 107 agentu (pridano 6 v teto session: 5 Shopify z predchozi session + 1 Historie)
- Pridana polozka mp-spec-docs-historie do Docs domeny (haiku, 1 ukol, OWNED PATHS)
- Pridana hot spot cesta docs/claude/Historie/ s vlastnikem

---

### 12. `docs/claude/SKILLS_MAP.md`

**Typ:** Zmeneno
**Radky:** 8 (pocet), 56-62 (nova sekce)
**Duvod:** Novy skill history musi byt evidovan

**Co se zmenilo:**
- Pocet skills: 25 → 29 (ale presny pocet zavisi na predchozich sessions)
- Nova sekce 1.5 "Historie Skills" s history skill
- Popis: trigger slova, workflow, vazba na agenta

---

### 13. `MEMORY.md`

**Typ:** Zmeneno
**Radky:** 5-9 (cesty), 17 (pocet agentu), 96-106 (nova sekce)
**Duvod:** Memory musi reflektovat novy system

**Co se zmenilo:**
- Cesty: pridana "Historie dir: docs/claude/Historie/"
- Pocty: aktualizovano na 107 agentu, 29 skills
- Nova sekce "Historie System" s klicovymi informacemi o systemu

---

## Dopad zmen

- **Ovlivnene komponenty:** Zadny produkci kod — pouze dokumentace a konfigurace agentu
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne npm balicky — system je ciste .md soubory + agent konfigurace
- **Rizika:** Agent musi byt spousten manualně (Task agent) — neni automaticky runtime, jen dokumentace

---

## Testovani

- **Build:** Neprovedeno (ziadne JS/TSX zmeny)
- **Manual test:** Tento zaznam je prvnim testem systemu — agent spusten a vytvoren kompletni set souboru
- **Poznamky:** System je functional od tohoto zaznamu; dalsi session overi spravnost formatu

---

<!-- KONEC SOUBORU 002-GN_UPRAVY.md -->
