# Plánovací Agent Systém — ModelPricer

> Hierarchický systém plánovacích agentů pro komplexní úkoly.

---

## Přehled

Plánovací systém zajišťuje kvalitní plány před implementací komplexních změn. Skládá se z:

| Agent | Model | Role |
|-------|-------|------|
| `mp-plan-manager` | opus-4.5 | Hlavní koordinátor |
| `mp-plan-frontend` | sonnet | FE architektura |
| `mp-plan-backend` | sonnet | BE architektura |
| `mp-plan-ux` | sonnet | User experience |
| `mp-plan-critic` | opus-4.5 | Kritická revize |
| `mp-oss-scout` | sonnet | OSS vyhledávání |

---

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                      UŽIVATEL                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  mp-orchestrator                             │
│  • Vyhodnotí komplexitu                                      │
│  • Rozhodne: přímo implementér NEBO → plánovací systém       │
└─────────────────────┬───────────────────────────────────────┘
                      │ (komplexní úkol)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  mp-plan-manager                             │
│  • Analyzuje scope                                           │
│  • Vytváří Context Briefs (max 500 slov)                    │
│  • Koordinuje specializované plánovače                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌──────────┬┴─────────┬──────────┐
          │          │          │          │
          ▼          ▼          ▼          │
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│mp-plan-     │ │mp-plan-     │ │mp-plan-ux  │
│frontend     │ │backend      │ │            │
└─────────────┘ └─────────────┘ └─────────────┘
          │          │          │
          └──────────┴──────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  mp-plan-manager                             │
│  • Syntetizuje dílčí plány                                  │
│  • Řeší konflikty                                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  mp-plan-critic                              │
│  • Kontroluje z pohledu zákazníka                           │
│  • Identifikuje P0/P1/P2 issues                             │
│  • POVINNÝ pro >3 souborů                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  FINÁLNÍ PLÁN                                │
│  → mp-orchestrator → implementační agenti                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Rozhodovací Matice

| Situace | Akce |
|---------|------|
| Jednoduchá změna (1 soubor) | Přímo implementér |
| Střední změna (2–5 souborů, jeden subsystém) | 1 plánovač + critic |
| Velká feature (více subsystémů) | Všichni plánovači + critic |
| Hledání knihovny | Jen `mp-oss-scout` |

---

## Context Brief Format

Manager předává plánovačům strukturovaný brief (max 500 slov):

```markdown
## Context Brief pro [agent-name]

### Úkol (1 věta)
[Co se má naplánovat]

### Scope
- IN: [konkrétní soubory/oblasti]
- OUT: [co je mimo scope]

### Relevantní Kontext (max 200 slov)
[Pouze nezbytné informace]

### Existující Patterns
- [Pattern 1]: [krátký popis]

### Očekávaný Output
- [Typ outputu]
```

---

## Kritický Agent — Checklist

### Povinné kontroly
- [ ] Je flow intuitivní bez manuálu?
- [ ] Jsou všechny loading states pokryty?
- [ ] Jsou error messages srozumitelné (ne technické)?
- [ ] Existuje success feedback?
- [ ] Jsou destruktivní akce chráněny confirmem?
- [ ] Co když data chybí?
- [ ] Co když je pomalý backend?
- [ ] Funguje keyboard navigace?

### Perspektivy
1. **Nový uživatel** — první návštěva
2. **Admin 3D print firmy** — denní použití
3. **Koncový zákazník** — embed widget

### Prioritizace
| Priorita | Význam | Akce |
|----------|--------|------|
| P0 | MUST-FIX | Blokuje implementaci |
| P1 | SHOULD-FIX | Řešit před release |
| P2 | NICE-TO-HAVE | Backlog |

---

## OSS Scout — Licenční Matice

### ✅ SAFE (bez omezení)
- MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC

### ⚠️ CAUTION (vyžaduje review)
- MPL-2.0, LGPL-2.1, LGPL-3.0

### ❌ BLOCK (nepoužívat)
- GPL-2.0, GPL-3.0, AGPL-3.0, CC-BY-NC-*, Proprietary, Unlicensed

### Kvalitativní kritéria
- GitHub stars > 500 (ideálně > 1000)
- Poslední commit < 6 měsíců
- Issue response time < 1 týden
- Dokumentace existuje a je aktuální
- Žádné známé CVE

---

## Pravidla

1. **Plánovači NESMÍ číst celý projekt** — info dostávají přes Context Brief
2. **Plánovači NESMÍ implementovat** — pouze plánují
3. **Critic běží VŽDY** pro větší změny (>3 souborů nebo více subsystémů)
4. **OSS Scout kontroluje licence** — GPL/AGPL = automatický BLOCK
5. **Brave search je logován** — viz `BRAVE_USAGE_LOG.md`

---

## Soubory

| Soubor | Účel |
|--------|------|
| `.claude/agents/mp-plan-manager.md` | Hlavní koordinátor |
| `.claude/agents/mp-plan-frontend.md` | FE plánovač |
| `.claude/agents/mp-plan-backend.md` | BE plánovač |
| `.claude/agents/mp-plan-ux.md` | UX plánovač |
| `.claude/agents/mp-plan-critic.md` | Kritický agent |
| `.claude/agents/mp-oss-scout.md` | OSS scout |
| `docs/claude/PLANNING_SYSTEM.md` | Tato dokumentace |
| `docs/claude/BRAVE_USAGE_LOG.md` | Log Brave dotazů |
