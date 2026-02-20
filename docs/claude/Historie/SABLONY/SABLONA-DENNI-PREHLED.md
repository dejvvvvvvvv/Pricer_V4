# SABLONA: DENNI PREHLED

> Pouziti: Souhrn vsech aktivit za jeden den.
> Vytvari se/aktualizuje pri kazdem ulozeni historie v danem dni.
> Slouzi jako rychly prehled "co se ten den delo" bez nutnosti cist jednotlive soubory.
> Tato sablona definuje PRESNY format — agent ji MUSI dodrzet.

---

<!--
NAZEV SOUBORU: DENNI-PREHLED.md (vzdy stejny nazev)
UMISTENI: docs/claude/Historie/{YYYY-MM-DD}/
JE JEDEN NA DEN — aktualizuje se pri kazdem novem zaznamu
-->

# DENNI PREHLED — {YYYY-MM-DD}

## Sessions

| Session | Tema | Hlavni ukoly |
|---------|------|-------------|
| S01 | {O cem se jednalo} | {Seznam klicovych ukolu} |
| S02 | {O cem se jednalo} | {Seznam klicovych ukolu} |

---

## Vsechny soubory historie pro tento den

| ID | Oblast | Typ | Popis | Cesta |
|----|--------|-----|-------|-------|
| {001-TK} | {Test-Kalkulacka} | {UPRAVY} | {Strucny popis} | {001-TK_UPRAVY.md} |
| {002-TK} | {Test-Kalkulacka} | {KONVERZACE} | {O cem} | {002-TK_KONVERZACE.md} |

---

## Souhrn dne

### Co se povedlo
- {Uspeesne dokonceny ukol 1}
- {Uspesne dokonceny ukol 2}

### Problemy a prekazky
- {Problem 1 — jak se vyresil nebo ze zustal otevreny}

### Klicova rozhodnuti dne
| # | Rozhodnuti | Kontext |
|---|-----------|---------|
| 1 | {Co se rozhodlo} | {Proc} |

---

## Otevrene ukoly (do dalsiho dne)

- [ ] {Ukol ktery zustal nedokonceny}
- [ ] {Dalsi otevreny ukol}

---

## Statistiky dne

- **Pocet sessions:** {X}
- **Pocet zaznamu historie:** {X}
- **Pocet upravenych souboru (v kodu):** {X}
- **Pocet novych souboru (v kodu):** {X}
- **Hlavni oblasti:** {TK, AD, PE, ...}

---

<!-- KONEC SABLONY -->
