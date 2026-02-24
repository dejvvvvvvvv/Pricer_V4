# Univerzalni Pozadavky pro Planovani a Implementaci

> **Tento soubor je template.** Pouziva se jako zaklad pro KAZDOU planovaci a implementacni session — bez ohledu na sprint, feature nebo bugfix.

---

## 1. Struktura fazi — Stridam PRACE a KONTROLA

Kazdy plan MUSI stridat dva typy fazi:

- **Pracovni faze** — implementace, opravy, zmeny kodu
- **Kontrolni faze** — 4 povinne kroky (viz nize)

### Priklad struktury

```
Faze 1  → Pracovni   (napr. implementace tlacitka)
Faze 2  → KONTROLNI  (4 povinne kroky)
Faze 3  → Pracovni   (napr. uprava designu)
Faze 4  → KONTROLNI  (4 povinne kroky)
Faze 5  → Pracovni   (napr. backend endpoint)
Faze 6  → KONTROLNI  (4 povinne kroky)
...
```

### Proc je to takto

Kdyz jsou kontrolni kroky jen "na konci faze", Claude je preskoci nebo zapomene — to se stalo uz mnohokrat. Tim, ze kontrola je SAMOSTATNA FAZE, neni mozne ji preskocit, protoze je to povinny bod v planu ktery se musi splnit pred pokracovanim.

---

## 2. Ctyri povinne kontrolni kroky (Kontrolni faze)

Kazda kontrolni faze obsahuje presne tyto 4 kroky v tomto poradi:

### Krok 1 — Ulozeni historie (pred testovanim)

- Spust agenta `mp-spec-docs-historie` (Task agent, model haiku, subagent_type general-purpose)
- Agent ulozi: co se implementovalo, jake soubory se menily, jake rozhodnuti padla, co uzivatel psal
- **Pockej az agent dokonci** — nepokracuj dal dokud neni hotovo
- Toto zajistuje ze mame zaznam o implementaci PRED testovanim

### Krok 2 — Testovani na webu (Chrome/Playwright)

- Otestuj vsechny zmeny z predchozi pracovni faze primo v prohlizeci
- Pouzij `mcp__claude-in-chrome` nastroje pro interakci s webem
- Uloz snimky obrazovky pro kazdu testovanou cast
- Zapis poznatky z testu do `.md` souboru
- Snimky + dokument uloz do slozky prislusneho sprintu/tasku v `docs/claude/Research/`

### Krok 3 — Ulozeni historie (po testovani)

- Znovu spust agenta `mp-spec-docs-historie`
- Tentokrat se ukladaji POUZE vysledky testovani z Kroku 2 (snimky, poznatky, nalezene bugy)
- **Pockej az agent dokonci** — nepokracuj dal dokud neni hotovo

### Krok 4 — Compact kontextu

- Proved `/compact` pro uvolneni kontextoveho okna
- Toto je POSLEDNI krok — az po nem muzes pokracovat na dalsi pracovni fazi

> **KRITICKE:** Krok 3 (historie) MUSI probehnout PRED Krokem 4 (compact). Compact maze kontext — bez ulozene historie se ztrati vysledky testovani.

---

## 3. Maximalni vyuziti agentu

### Pravidlo

V KAZDE pracovni fazi musi byt v planu jasne rozvrzeni agentu — ktery agent co dela, jake tasky resi, a co se paralelizuje.

### Proc

- **Efektivita** — agenti pracuji paralelne, coz dramaticky zrychluje praci
- **Mene chyb** — specializovany agent dela lip nez genericky pristup
- **Uspora kontextu** — prace v agentech nespotrebovava hlavni kontextove okno

### Jak to vypada v planu

Kazda pracovni faze MUSI obsahovat sekci:

```
### Rozlozeni agentu pro Fazi X

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| mp-mid-frontend-admin | Uprava admin panelu XYZ | Ano (s backend) |
| mp-mid-backend-api | Novy endpoint /api/xyz | Ano (s frontend) |
| mp-spec-docs-dev | Aktualizace dokumentace | Po dokonceni impl. |
```

- Pokud je vic nezavislych tasku — spoustej agenty PARALELNE
- Pokud na sobe zavisi — specifikuj poradi a zavislosti
- Hlavni okno koordinuje agenty, samo minimalne implementuje

---

## 4. Vytvareni novych agentu

### Kdy

Pokud zadny existujici agent nepokryva potrebnou oblast, SMIM vytvorit noveho.

### Pravidla

1. **Novy agent MUSI byt vytvoreny v dobe planovani** — ne az behem implementace
2. **Okamzite dokumentovat** do `docs/claude/AGENT_MAP.md` — zadny nezdokumentovany agent nesmi existovat
3. Agent se vytvori v `.claude/agents/` podle konvence `mp-{tier}-{domena}-{spec}.md`
4. V planu pak musi byt jasne napsano kde a jak se novy agent pouzije

### Proc v dobe planovani

Pokud se agent vytvori az behem implementace, neni mozne ho spravne rozvrhnout v planu. Vsichni agenti musi existovat PRED startem prace aby se dalo naplat jejich rozlozeni a spoluprace.

---

## 5. Otazky pred planovanim

### Pravidlo

Pokud mam JAKOUKOLI nejistotu — ZEPTAM SE. Minimalne 3 otazky pred finalizaci planu (viz CLAUDE.md sekce 0).

### Format otazek

Kazda otazka MUSI byt napsana ve dvou vrstvach:

1. **Jednoduche vysvetleni** — srozumitelne i pro uplneho zacatecnika, bez technickeho zargonu
2. **Technicke vysvetleni** — v zavorce `()` presny technicky popis proc se ptam a co to ovlivni

### Priklad

> **Otazka:** Ma se po kliknuti na tlacitko "Ulozit" zobrazit potvrzovaci okno, nebo se ma rovnou ulozit?
> *(Technicky: Rozhoduje to jestli pouzijeme synchronni `save()` s okamzitym UI feedbackem, nebo pridame `confirm()` dialog pred ukladanim. Potvrzovaci dialog pridava krok navic ale chrani pred nahodnym ulozenim.)*

### Typy otazek ktere se ptam

- Co presne ma byt vysledkem? (scope)
- Jak to ma vypadat? (UI/UX)
- Co se stane kdyz neco selze? (error handling)
- Narusi to neco co uz funguje? (kompatibilita)
- Je neco co sem NEMAM zahrnovat? (out of scope)

---

## 6. Kontrolni seznam pro plan

Pred odeslenim planu uzivateile overit:

- [ ] Kazda pracovni faze ma za sebou kontrolni fazi (4 kroky)
- [ ] V kazde pracovni fazi je tabulka rozlozeni agentu
- [ ] Vsichni potrebni agenti existuji (nebo jsou naplanovani k vytvoreni)
- [ ] Novi agenti jsou zdokumentovani v AGENT_MAP.md
- [ ] Otazky byly polozeny a zodpovezeny pred finalizaci planu
- [ ] Plan je dostatecne detailni — kazdy krok je jasny bez dalsiho vysvetlovani
