# Testovani 2026-03-18 — Chyby a Bugy

**Datum:** 2026-03-18
**Soubor:** 01-Errors-And-Bugs.md

Zaznamenavej zde vsechny nalezene chyby — funkcionalni, konzolove i crashe.
Pouzivej prefixovana ID podle kategorie (viz tabulka nize).

---

## Legenda

### ID format
```
BUG-{NNN}   — genericka chyba
CRASH-{NNN} — bila obrazovka / JS crash / komponenta nespadla
FUNC-{NNN}  — funkcionalni problem (neco nefunguje jak ma)
CON-{NNN}   — console error / warning
```

### Zavaznost

| Uroven | Popis |
|--------|-------|
| P0 | Crash, bila obrazovka, stranka se nenacte |
| P1 | Dulezita funkce nefunguje (upload, objednavka, platba) |
| P2 | Mensi nespravne chovani, workaround existuje |
| P3 | Drobnost, vizualni nepresnost bez dopadu |

### Stav

| Stav | Vyznam |
|------|--------|
| Novy | Prave zaznamenant, neopraveny |
| Overeno | Reprodukovano a potvrzeno |
| Opraveno | Fix nasazen |
| Zamitnuto | Neni bug / nen reprodukovatelne |

---

## Tabulka chyb

| ID | Stranka (ID) | URL | Zavaznost | Kategorie | Popis | Screenshot | Stav |
|----|--------------|-----|-----------|-----------|-------|------------|------|
| — | — | — | — | — | — | — | — |

---

## Detail nalezu

> Ke kazdemu zaznamu v tabulce lze pridat rozsirenous sekci nize.
> Format: `### BUG-001 — Strucny nazev`

---

### Jak pridavat zaznamy

1. Pridat radek do tabulky vyse
2. Priradit unikatni ID (BUG-001, BUG-002, ...)
3. Vyplnit vsechny sloupce
4. Pridat screenshot filename pokud existuje (ulozit do `docs/claude/Testing-2026-03-18/screenshots/`)
5. Volitelne pridat detail sekci nize pro slozitejsi bugy

### Priklad zaznamu

```
| BUG-001 | P09 — Test Kalkulacka | /test-kalkulacka | P1 | Funkcionalni | Tlacitko "Pokracovat" v kroku 2 nereaguje na klik | bug-001-krok2.png | Novy |
```

---

*Soubor vytvoren: 2026-03-18*
