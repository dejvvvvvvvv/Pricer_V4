---
name: history
description: 'Uloz historii konverzace, uprav a rozhodnuti do strukturovanych .md souboru. Pouzij /history pro rucni trigger, nebo se spousti automaticky pred compaction a pri checkpointech. Funguje s agentem mp-spec-docs-historie na modelu Haiku.'
license: MIT
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# Historie Save — Skill pro ukladani historie projektu

## Kdy se tento skill pouziva

- Uzivatel napise `/history`
- Uzivatel napise "uloz historii", "save history", "zaznamenej historii"
- Automaticky pred auto-compaction konverzace (P0 — BEZODKLADNE)
- Automaticky pred dodanim/spustenim planu (P0 — plan zacina /clear, uloz + PATH k planu)
- Automaticky pred /clear konverzace (P0)
- Automaticky pri checkpointech (CP1/CP2/CP3)
- Automaticky pred koncem session

## Workflow

### Krok 1: Zkompiluj kontext aktualni session

Projdi celou aktualni konverzaci a sestav nasledujici strukturu:

```
=== HISTORIE SAVE REQUEST ===

DATUM: {dnesni datum YYYY-MM-DD}
SESSION: S{NN — zjisti z existujicich zaznamu pro dnes, nebo S01 pokud prvni}
TYP TRIGGERU: {manual | auto-checkpoint | auto-pre-compaction}

--- KONVERZACE ---
{Pro kazdou vymenu zprav:}
[U] {PLNY text co uzivatel napsal — nezmeneny, nekraceny}
[C] {Klicove body Claude odpovedi — 5-15 bodu, ne cely text}

--- UPRAVY ---
{Pro kazdy soubor ktery byl v teto session upraven:}
SOUBOR: {cesta} | TYP: {Pridano/Zmeneno/Odebrano/Novy} | RADKY: {od-do} | POPIS: {co se zmenilo}

--- OTAZKY ---
{Pro kazdou otazku kterou Claude polozil uzivateli (nebo naopak):}
Q: {zneni otazky} | A: {zneni odpovedi} | ROZHODNUTI: {co z toho vyplynulo}

--- PLAN (pokud existuje) ---
{Pokud se vytvarel nebo dodaval plan:}
PLAN_PATH: {cesta k souboru planu, napr. docs/claude/PLANS/nazev.md}
PLAN_SHRNUTI: {co se bude implementovat, jake soubory, jake faze}
PLAN_ROZHODNUTI: {klicova rozhodnuti z diskuze pred planem}

--- KONTEXT ---
{Dalsi dulezity kontext:}
- Jake plany se delaly a kde jsou ulozeny (PATH!)
- Jake celkove rozhodnuti padla
- Co je otevrene / nedokoncene
- Navaznost na predchozi session (pokud je znama)

=== END ===
```

### Krok 2: Zjisti spravnou session

1. Precti `docs/claude/Historie/ID-REGISTRY.md` — zjisti aktualni pocitadlo
2. Podivej se jestli existuje slozka `docs/claude/Historie/{dnesni-datum}/`
3. Pokud existuje, podivej se na existujici soubory a zjisti posledni session cislo
4. Nova session = posledni + 1 (nebo S01 pokud prvni den)

### Krok 3: Spust Historie agenta

Pouzij **Task tool** s parametry:

```
subagent_type: "general-purpose"
model: "haiku"
description: "Historie save — {datum}"
prompt: {zkomplilovany kontext z Kroku 1}
```

V promptu VZDY pripoj tyto instrukce na zacatek:

```
Jsi historie-agent pro projekt ModelPricer V3.
Tvym JEDINYM ukolem je ulozit historii do strukturovanych .md souboru.

POSTUP:
1. Precti docs/claude/Historie/ID-REGISTRY.md — zjisti pocitadlo a zkratky
2. Precti docs/claude/Historie/MASTER-HISTORIE.md — zjisti existujici zaznamy
3. Precti sablony v docs/claude/Historie/SABLONY/ — dodrzuj je PRESNE
4. Vytvor slozku docs/claude/Historie/{DATUM}/ pokud neexistuje
5. Vytvor soubory podle obsahu (KONVERZACE, UPRAVY, OTAZKY)
6. Aktualizuj/vytvor DENNI-PREHLED.md
7. Aktualizuj MASTER-HISTORIE.md — pridej radky tabulky
8. Aktualizuj ID-REGISTRY.md — zvys pocitadlo

PRAVIDLA:
- Uzivateluv text VZDY v celosti (nekratit!)
- Claude odpovedi zkratit na klicove body
- Stredni uroven detailu pro UPRAVY + radkove rozsahy
- Fragmenty kodu jen pro architekturni/breaking zmeny (max 10 radku)
- Cestina v obsahu, ASCII-safe nazvy souboru
- NIKDY nezapisuj citlive udaje (API klice, hesla) — nahrad [REDACTED]
- Kazdy soubor musi mit unikatni ID z pocitadla
- Souvisejici ID vyplnit kde existuje souvislost

PREDANY KONTEXT:
```

Pak vloz zkomplilovany kontext.

### Krok 4: Potvrd uzivateli

Po uspesnem behu agenta informuj uzivatele:
- Kolik souboru bylo vytvoreno/aktualizovano
- Jake ID byly prideleny
- Stav MASTER-HISTORIE

## Dulezite poznamky

### Pre-compaction trigger (P0)
Kdyz hlavni Claude detekuje ze konverzace je dlouha a blizi se compaction:
1. NEJDRIV spust tento skill
2. POCKEJ az agent dokonci
3. TEPRVE PAK muze pokracovat compaction

### Session tracking
- Kazde nove chatove okno / terminal = nova session (S01, S02, ...)
- V ramci jedne session muze byt vice history saves (napr. po kazdem checkpointu)
- Session cislo se NEMENI v ramci jednoho chatu — meni se jen pri novem chatu

### Co nedelat
- Nespoustej agenta pokud neni co ulozit (prazdna konverzace)
- Nespoustej agenta dvakrat pro stejny obsah
- Nespoustej agenta uprostred kriticke operace (build, commit)

## Priklad pouziti

Uzivatel napise: `/history`

Claude odpovi:
"Kompiluju kontext aktualni session pro ulozeni historie..."
{spusti agenta}
"Historie ulozena. Vytvoreny soubory:
- 004-TK_KONVERZACE.md (konverzace o kalkulacce)
- 005-TK_UPRAVY.md (zmeny v Step2.jsx, index.jsx)
- 006-TK_OTAZKY.md (3 otazky/odpovedi)
- DENNI-PREHLED.md aktualizovan
Master Historie aktualizovana. Dalsi ID: 007."
