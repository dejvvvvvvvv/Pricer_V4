# 4 Povinne kontrolni kroky — Samostatna faze po kazde implementaci

> Tyto 4 kroky tvori SAMOSTATNOU FAZI, ktera nasleduje po kazde pracovni/implementacni fazi.
> NIKDY nesmi byt soucasti implementacni faze — vzdy jsou oddelena faze v planu.

---

## KRITICKE PRAVIDLO: Kontrolni faze MUSI byt v planu rozepsana DETAILNE

**ZAKAZANO** je napsat kontrolni fazi takto:

```
## Faze 2 — Kontrolni kroky
1. Ulozeni historie (pred testovanim)
2. Testovani na webu
3. Ulozeni historie (po testovani)
4. Compact kontextu
```

**Toto je SPATNE.** Kdyz jsou kroky napsane jako 4 kratke vety, Claude je preskoci a ignoruje — to se opakovane stavalo. Vagni popis = preskoceni.

**POVINNE** je napsat kontrolni fazi v planu VZDY v plnem rozsahu — kazdy krok musi byt rozepsany se vsemi detaily, specifikovanym agentem, cekanim na dokonceni a konkretnimi akcemi. Viz sekce "Jak MUSI vypadat kontrolni faze v planu" nize.

---

## Struktura fazi — Stridam PRACE a KONTROLA

Kazdy plan MUSI stridat dva typy fazi:

- **Pracovni faze** — implementace, opravy, zmeny kodu
- **Kontrolni faze** — 4 povinne kroky (viz nize)

### Priklad struktury

```
Faze 1  → Pracovni   (napr. implementace tlacitka)
Faze 2  → KONTROLNI  (4 povinne kroky — DETAILNE ROZEPSANE)
Faze 3  → Pracovni   (napr. uprava designu)
Faze 4  → KONTROLNI  (4 povinne kroky — DETAILNE ROZEPSANE)
Faze 5  → Pracovni   (napr. backend endpoint)
Faze 6  → KONTROLNI  (4 povinne kroky — DETAILNE ROZEPSANE)
...
```

### Proc je to takto

Kdyz jsou kontrolni kroky jen "na konci faze", Claude je preskoci nebo zapomene — to se stalo uz mnohokrat. Tim, ze kontrola je SAMOSTATNA FAZE, neni mozne ji preskocit, protoze je to povinny bod v planu ktery se musi splnit pred pokracovanim.

---

## 4 Povinne kontrolni kroky — Detailni popis

Kazda kontrolni faze obsahuje presne tyto 4 kroky v tomto poradi:

### Krok 1 — Ulozeni historie (pred testovanim)

- Spust agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose)
- Agentovi predej instrukce z `.claude/agents/mp-spec-docs-historie.md`
- Agent ulozi: co se implementovalo, jake soubory se menily, jake rozhodnuti padla, co uzivatel psal
- **POVINNE CEKANI:** Pockej az agent KOMPLETNE dokonci ukladani. NEPOKRACUJ na Krok 2 dokud agent neni hotovy. Zadna dalsi akce pred dokoncenim.
- Toto zajistuje ze mame zaznam o implementaci PRED testovanim

### Krok 2 — Testovani na webu (Chrome/Playwright)

- Otestuj vsechny zmeny z predchozi pracovni faze primo v prohlizeci
- Pouzij `mcp__claude-in-chrome` nastroje pro interakci s webem
- Projdi KAZDOU stranku/komponentu ktera byla zmenena v predchozi pracovni fazi
- Uloz snimky obrazovky pro kazdu testovanou cast
- Zapis poznatky z testu do `.md` souboru (co funguje, co nefunguje, co je treba opravit)
- Snimky + dokument uloz do slozky prislusneho sprintu/tasku v `docs/claude/Research/`

### Krok 3 — Ulozeni historie (po testovani)

- Znovu spust agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose)
- Tentokrat se ukladaji POUZE vysledky testovani z Kroku 2 (snimky, poznatky, nalezene bugy)
- **POVINNE CEKANI:** Pockej az agent KOMPLETNE dokonci ukladani. NEPOKRACUJ na Krok 4 dokud agent neni hotovy. Zadna dalsi akce pred dokoncenim.

### Krok 4 — Compact kontextu

- Proved `/compact` pro uvolneni kontextoveho okna
- Toto je POSLEDNI krok — az po nem muzes pokracovat na dalsi pracovni fazi
- NIKDY neprovadej compact bez predchoziho ulozeni historie (Krok 3)

> **KRITICKE:** Krok 3 (historie) MUSI probehnout PRED Krokem 4 (compact). Compact maze kontext — bez ulozene historie se ztrati vysledky testovani.

---

## Jak MUSI vypadat kontrolni faze v planu — POVINNY FORMAT

Kdyz pises plan, KAZDA kontrolni faze MUSI byt rozepsana v tomto plnem formatu. Toto neni volitelne — je to POVINNE.

### Priklad spravneho zapisu v planu:

```
## Faze 4 — Kontrolni kroky po Fazi 3

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type
general-purpose). Agent ulozi vsechny zmeny z Faze 3: implementovane soubory, rozhodnuti,
konverzaci s uzivatelem. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce
pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 3 v prohlizeci pomoci
mcp__claude-in-chrome nastroju. Konkretne otestuju:
- [konkretni stranka/komponenta 1 z Faze 3]
- [konkretni stranka/komponenta 2 z Faze 3]
- [konkretni stranka/komponenta 3 z Faze 3]
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce
docs/claude/Research/[sprint-slozka]/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi
POUZE vysledky testovani z Kroku 2 — snimky, poznatky, nalezene bugy. POCKAM az agent
kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze.
Az po compactu pokracuju na Fazi 5.
```

### Proc tento format

- **Kazdy krok ma vice vet** — neni to jednoradkova odbyvaciho.
- **Agent je explicitne jmenovan** — `mp-spec-docs-historie`, Task tool, haiku, general-purpose.
- **Cekani je zdurazneno** — "POCKAM az dokonci" je napsano explicitne u Kroku 1 i 3.
- **Testovani ma konkretni body** — co presne se testuje z predchozi faze.
- **Poradi je jasne** — kazdy krok zacina az po dokonceni predchoziho.

**Pokud kontrolni faze v planu NEMA tento detailni format, plan NENI kompletni a nesmi byt odeslan uzivateli.**
