# SABLONA: OTAZKY A ODPOVEDI

> Pouziti: Zaznamenavani otazek (od Claude i od uzivatele), odpovedi a rozhodnuti z nich vyplyvajicich.
> Dulezite pro zachyceni PROC se neco rozhodlo — kontextu ktery se pri compaction ztraci.
> Tato sablona definuje PRESNY format — agent ji MUSI dodrzet.

---

<!--
NAZEV SOUBORU: {NNN}-{ZK}_OTAZKY.md
PRIKLAD: 005-TK_OTAZKY.md
UMISTENI: docs/claude/Historie/{YYYY-MM-DD}/
-->

# {NNN}-{ZK} — OTAZKY A ODPOVEDI — {Oblast} — {YYYY-MM-DD}

## Metadata
- **ID:** {NNN}-{ZK}
- **Session:** S{NN}
- **Datum:** {YYYY-MM-DD}
- **Oblast:** {Nazev oblasti}
- **Souvisejici ID:** {ID1, ID2, ...} nebo zadne

---

## Kontext

{1-2 vety o kontextu ve kterem tyto otazky vznikly — jaky ukol se resil, jaka implementace.}

---

## Otazky a odpovedi

### Q1: {Kratky nazev tematu otazky}

- **Ptal se:** {Claude / Uzivatel}
- **Otazka:** {Presne zneni otazky — zachovat v celosti}
- **Odpoved:** {Presne zneni odpovedi — zachovat v celosti}
- **Rozhodnuti:** {Co z toho vyplynulo — jake rozhodnuti se ucinilo}
- **Dopad:** {Jak to ovlivnilo implementaci — strucne}

---

### Q2: {Kratky nazev tematu otazky}

- **Ptal se:** {Claude / Uzivatel}
- **Otazka:** {...}
- **Odpoved:** {...}
- **Rozhodnuti:** {...}
- **Dopad:** {...}

---

<!-- Opakovat QN pro kazdy par otazka/odpoved -->

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnuti | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | {Tema} | {Co se finalne rozhodlo} | {Jake dalsi moznosti byly zvazeny} | Q1 |
| 2 | {Tema} | {...} | {...} | Q2 |

---

## Nerozhodnute otazky

- [ ] {Otazka ktera zustala otevrena — pokud zadna, smazat tuto sekci}

---

<!-- KONEC SABLONY -->
