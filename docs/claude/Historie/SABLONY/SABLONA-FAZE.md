# SABLONA: INDIVIDUALNI FAZE

> Pouziti: Dokumentace jedne konkretni faze v ramci vicefazoveho planu/sprintu.
> Kazda faze ma vlastni zaznam — umoznuje granularni sledovani postupu, zavislosti mezi fazemi a process compliance.
> Tato sablona definuje PRESNY format — agent ji MUSI dodrzet.

---

<!--
NAZEV SOUBORU: {NNN}-{ZK}_FAZE-{Cislo}-{KratkyNazev}.md
PRIKLADY:
  047-AU_FAZE-0-Priprava.md
  048-AU_FAZE-1-Auth-Foundation.md
  034-GN_FAZE-1-Screenshoty.md
UMISTENI: docs/claude/Historie/{YYYY-MM-DD}/
POZNAMKA: Pro kazdu fazi planu JEDEN soubor. Nekombinovej vice fazi do jednoho souboru.
-->

# {NNN}-{ZK} — FAZE {Cislo} — {Nazev faze} — {YYYY-MM-DD}

## Metadata

| Pole | Hodnota |
|------|---------|
| **ID** | {NNN}-{ZK} |
| **Session** | S{NN} |
| **Datum** | {YYYY-MM-DD} |
| **Oblast** | {Nazev oblasti} |
| **Typ zaznamu** | FAZE |

---

## Zarazeni faze

| Pole | Hodnota |
|------|---------|
| **Plan** | {Nazev planu — napr. "Sprint 1 Auth Foundation"} |
| **Cesta k planu** | {docs/claude/PLANS/nazev-planu.md} |
| **Cislo faze** | {N} z {celkem} (napr. "Faze 2 z 5") |
| **Nazev faze** | {Plny nazev — napr. "Routes + Login + Register"} |
| **Kroky planu** | {Ktere kroky planu tato faze pokryva — napr. "kroky 2.1 az 2.5"} |

### Souvisejici ID

| Typ | ID | Popis |
|-----|-----|-------|
| **Predchozi faze** | {NNN-ZK} nebo `—` (prvni faze) | {Kratky popis co predchozi faze dodala} |
| **Nasledujici faze** | {NNN-ZK} nebo `—` (posledni faze) nebo `zatim neexistuje` | {Co nasledujici faze udela} |
| **Globalni UPRAVY** | {NNN-ZK} nebo `—` | {ID souhrnneho zaznamu uprav pro cely sprint/plan, pokud existuje} |
| **KONVERZACE** | {NNN-ZK} nebo `—` | {ID zaznamu konverzace z teto session} |
| **OTAZKY** | {NNN-ZK} nebo `—` | {ID zaznamu otazek, pokud existuji} |
| **DENNI-PREHLED** | {NNN-ZK} nebo `—` | {ID denniho prehledu} |

---

## Scope faze

### IN scope (co tato faze resi)

- {Konkretni ukol/zmena 1 ktera patri do teto faze}
- {Konkretni ukol/zmena 2}
- {Konkretni ukol/zmena 3}

### OUT of scope (explicitne NENI soucasti teto faze)

- {Vec ktera by mohla byt zamena s touto fazi ale patri jinam}
- {Vec odlozena na pozdeji}

### Zavislosti na predchozich fazich

- {Co muselo byt hotove z predchozi faze aby tato faze mohla zacit}
- {Soubory/struktury/konfigurace pripravene v predchozich fazich}
- Pokud prvni faze: `Zadne — toto je startovaci faze.`

### Co tato faze pripravuje pro nasledujici

- {Soubory, struktury nebo API ktere nasledujici faze ocekava od teto}
- {Kontrakty, interfacy nebo konvence zavedene v teto fazi}
- Pokud posledni faze: `Zadne — toto je finalni faze.`

---

## Souhrn faze

{2-5 vet shrnujicich co se v teto fazi udelalo, proc a jaky je vysledek.
Melo by byt srozumitelne i bez cteni detailnich zmen — rychly prehled pro denni report.}

---

## Seznam upravenych souboru

| # | Soubor | Operace | Radky | Popis zmeny |
|---|--------|---------|-------|-------------|
| 1 | `{cesta/k/souboru.jsx}` | {VYTVORENY / UPRAVEN / SMAZAN / PREJMENOVANY} | {pocet nebo rozsah} | {Strucny popis} |
| 2 | `{cesta/k/dalsiho.js}` | {...} | {...} | {...} |
| 3 | `{cesta/k/tretiho.css}` | {...} | {...} | {...} |

**Celkem:** {X} souboru ({Y} novych, {Z} upravenych, {W} smazanych)

---

## Detailni zmeny

### 1. `{cesta/k/souboru.jsx}`

**Operace:** {VYTVORENY | UPRAVEN | SMAZAN | PREJMENOVANY | OVERENI}
**Radky:** {celkovy pocet nebo rozsah zmen}
**Duvod:** {Proc se tato zmena delala v kontextu TETO faze}

**Co se zmenilo:**
- {Popis zmeny 1}
- {Popis zmeny 2}
- {Pred: strucne jak to bylo (pokud UPRAVEN/SMAZAN)}
- {Po: strucne jak to je nyni}

<!-- FRAGMENT KODU — jen pro klicove architekturni zmeny, nove API kontrakty nebo breaking changes: -->
<!--
```jsx
// Klicova cast kodu (max 15 radku):
{kod}
```
-->

**Exporty/API (pokud novy soubor nebo zmena interfacu):**
- {Co soubor exportuje a jak se to pouziva}

---

### 2. `{cesta/k/dalsiho.js}`

**Operace:** {...}
**Radky:** {...}
**Duvod:** {...}

**Co se zmenilo:**
- {...}

---

<!-- Opakovat sekci pro kazdy upraveny soubor -->

---

## Architekturni kontext

<!--
Tato sekce je VOLITELNA — vyplnit JEN pokud faze zavadi novy architekturni vzor,
meni strukturu aplikace, nebo vytvari nove konvence ktere musi nasledujici faze dodrzet.
Pokud faze je ciste aditivni (napr. screenshoty, dokumentace), tuto sekci vynechat.
-->

### Diagram / schema

```
{ASCII diagram architektury, data flow, nebo komponentni hierarchie
relevantni pro tuto fazi — max 15 radku}
```

### Nove konvence zavedene touto fazi

- {Konvence 1 — napr. "Vsechny auth funkce jsou useCallback pro stabilni reference"}
- {Konvence 2 — napr. "window.__auth* bridge pattern pro token passing"}

### Klicova rozhodnuti v teto fazi

| # | Rozhodnuti | Proc | Alternativy zvazene |
|---|-----------|------|---------------------|
| 1 | {Co se rozhodlo} | {Duvod} | {Jake jine moznosti byly — nebo "zadne"} |

---

## Dopad zmen

### Ovlivnene komponenty

- {Komponenta/modul 1 — jak je ovlivnena}
- {Komponenta/modul 2 — jak je ovlivnena}
- Pokud zadne: `Zadne — izolovaná faze bez vlivu na existujici kod.`

### Breaking changes

- {Popis breaking change a jak se resí — nebo "Zadne"}

### Nove zavislosti

- {npm balicek: verze — nebo "Zadne nove zavislosti"}

### Env promenne

- {NOVA_ENV_VAR — popis a kde je potreba — nebo "Zadne zmeny"}

### Rizika a technicke dluhy

- {Riziko 1 — napr. "Chybejici browser testy pro tuto fazi"}
- {Technicky dluh — napr. "Stub soubor ktery bude implementovan v budouci fazi"}
- Pokud zadna: `Zadna identifikovana rizika.`

---

## Testovani faze

### Automaticke testy

| Test | Typ | Vysledek | Poznamka |
|------|-----|----------|----------|
| `npm run build` | Build | {PASS / FAIL} | {Cas buildu, pocet warnings — nebo "—"} |
| {nazev testu} | {Unit / Integration / E2E} | {PASS / FAIL / SKIP} | {Poznamka} |

### Manualni / browser testy

| Test | Vysledek | Poznamka |
|------|----------|----------|
| {Popis co se testovalo} | {OK / FAIL / NEPROVEDENO} | {Detail} |

### Screenshoty a vizualni evidence

- {Cesta k screenshotu — nebo "Zadne screenshoty pro tuto fazi"}

---

## Process compliance (povinne kroky po fazi)

<!--
Tato sekce sleduje zda byly provedeny VSECHNY povinne kroky specifikovane v planu
po dokonceni teto faze. Viz docs/claude/Pravidla/4kroky.md.
Pokud plan specifikuje jine/dalsi kroky, pridat je.
-->

| # | Povinny krok | Stav | Poznamka |
|---|-------------|------|----------|
| 1 | Historie save (pred fazi) | {PROVEDENO / NEPROVEDENO / N/A} | {ID zaznamu nebo duvod proc ne} |
| 2 | Historie save (po fazi) | {PROVEDENO / NEPROVEDENO} | {ID zaznamu — tento soubor} |
| 3 | Browser / smoke testy | {PROVEDENO / NEPROVEDENO / N/A} | {Co bylo otestovano} |
| 4 | Testovaci report | {PROVEDENO / NEPROVEDENO / N/A} | {Kde je report} |
| 5 | /compact (uvolneni kontextu) | {PROVEDENO / NEPROVEDENO / N/A} | {—} |
| 6 | Dokumentace aktualizovana | {PROVEDENO / NEPROVEDENO / N/A} | {Ktere docs soubory} |

**Celkova compliance:** {X}/{Y} povinnych kroku splneno

---

## Status faze

| Pole | Hodnota |
|------|---------|
| **Stav** | {DOKONCENA / CASTECNE DOKONCENA / SELHALA / PRESKOCENA} |
| **Dokonceno** | {Datum a cas — nebo "—"} |
| **Blocker** | {Co branilo dokonceni — nebo "Zadny"} |
| **Navazuje** | {ID nasledujici faze — nebo "Posledni faze — plan dokoncen"} |

---

## Poznamky a pasti

<!--
Dulezite poznatky z teto faze ktere mohou pomoci v budoucich fazich nebo sessich.
Technicke pasti, neintuitivni chovani, lessons learned.
-->

1. {Past/poznatek 1 — napr. "Soubor MUSI mit .jsx priponu kvuli Vite esbuild"}
2. {Past/poznatek 2}
3. {Poznamka pro dalsi fazi — co si dat pozor}

---

<!-- KONEC SABLONY -->
