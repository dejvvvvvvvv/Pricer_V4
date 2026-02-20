# SABLONA: KONVERZACE

> Pouziti: Zaznamenavani konverzace mezi uzivatelem a Claude.
> Uzivateluv text se uklada V CELOSTI. Claude odpovedi zkraceene na klicove body.
> Tato sablona definuje PRESNY format — agent ji MUSI dodrzet.

---

<!--
NAZEV SOUBORU: {NNN}-{ZK}_KONVERZACE.md
PRIKLAD: 003-GN_KONVERZACE.md
UMISTENI: docs/claude/Historie/{YYYY-MM-DD}/
-->

# {NNN}-{ZK} — KONVERZACE — {Oblast} — {YYYY-MM-DD}

## Metadata
- **ID:** {NNN}-{ZK}
- **Session:** S{NN}
- **Datum:** {YYYY-MM-DD}
- **Oblast:** {Nazev oblasti}
- **Souvisejici ID:** {ID1, ID2, ...} nebo zadne

---

## Tema session

{1-2 vety shrnujici o cem se v teto casti konverzace jednalo.}

---

## Prubeh konverzace

### [1] Uzivatel
> {PLNY TEXT co uzivatel napsal — zachovat v celosti, vcetne formatovani.
> Pokud uzivatel psal vice odstavcu, zachovat vse.
> Jedine co se muze vynechat jsou systemove zpravy ktere uzivatel nenapsal.}

### [1] Claude
**Shrnuti odpovedi:**
- {Klicovy bod 1 odpovedi}
- {Klicovy bod 2}
- {Pripadne rozhodnuti/navrhy}

**Akce provedene:**
- {Soubor X upraven — strucne co}
- {Prikaz Y spusten}

**Soubory zminene:**
- `{cesta/k/souboru}`

---

### [2] Uzivatel
> {Dalsi zprava uzivatele — opet PLNY TEXT}

### [2] Claude
**Shrnuti odpovedi:**
- {...}

---

<!-- Opakovat [N] Uzivatel + [N] Claude pro kazdy pár zprav v konverzaci -->

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | {Co se rozhodlo} | {Proc — kratky kontext} | {Uzivatel / Claude / Spolecne} |

---

## Otevrene otazky

- [ ] {Otazka ktera zustala nezodpovezena — pokud zadna, smazat tuto sekci}

---

## Navaznost

- **Predchozi:** {ID predchoziho zaznamu, pokud existuje} nebo zadny
- **Nasledujici:** {ID nasledujiciho zaznamu, pokud existuje} nebo zatim zadny

---

<!-- KONEC SABLONY -->
