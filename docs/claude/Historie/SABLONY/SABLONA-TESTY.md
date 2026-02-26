# SABLONA-TESTY — Zaznam testovaci session

> Tento soubor slouzi jako sablona pro zaznam **browser testovani** — jake stranky byly tesovany, co se kontrolovalo, co bylo nalezeno.

---

## Metadata

**ID:** {NNN}-{ZK}
**Typ:** TESTY
**Datum:** {YYYY-MM-DD}
**Session:** S{NN}
**Oblast:** {oblast}
**Souvisejici ID:** {related IDs}

---

## Prehled testu

{Strucny popis co se testovalo a proc — 2-3 vety}

---

## Testovaci prostredi

- **Prohlizec:** {Chrome/Firefox/Safari/...}
- **URL:** {testovana URL, napr. localhost:4028}
- **Viewport:** {sirka x vyskarozliseni, napr. 1536x686}
- **Prihlaseni:** {prihlaseny / neprihlaseny uzivatel (jakou roli?)}

---

## Testovane stranky / komponenty

| # | Stranka/Komponenta | URL | Vysledek | Poznamky |
|---|-------------------|-----|----------|----------|
| 1 | {nazev stranky/komponenty} | {URL cesta} | PASS / FAIL | {kratkej popis: co se kontrolovalo, vysledek} |
| 2 | ... | ... | ... | ... |

---

## Vizualni kontroly — Design & Styling

| # | Kontrola | Ocekavany stav | Skutecny stav | Vysledek |
|---|----------|---------------|---------------|----------|
| 1 | {co se kontrolovalo} | {ocekavano} | {realita} | PASS / FAIL |
| 2 | ... | ... | ... | ... |

Poznamky:
- {jakekoli vypozorkovane detaily ke stilum, fontum, barvam, rozlozenym}

---

## Nalezene problemy

| # | Priorita | Popis | Soubor | Stav |
|---|----------|-------|--------|------|
| 1 | P0/P1/P2 | {popis problemu — co nefunguje nebo je blbe} | {soubor.jsx} | Opraven / Otevren |
| 2 | ... | ... | ... | ... |

---

## Funktionalita — Interakce & Stavy

| # | Akce | Ocekavany vysledek | Skutecny vysledek | Vysledek |
|---|------|-------------------|-------------------|----------|
| 1 | {klik na tlacitko X} | {ma se stat Y} | {co se skutecne stalo} | PASS / FAIL |
| 2 | ... | ... | ... | ... |

---

## Performance & Console

- **Cas nacitani stranky:** {napr. 1.2s}
- **Pocet modulu (npm run build):** {napr. 3023}
- **Console chyby:** {0 / seznam erroru}
- **Console warningy:** {0 / seznam warnings}
- **Network requesty:** {0 failed / seznam failed}

---

## Screenshoty a odkazy

{Popis pripadnych ulozoych snimku nebo zdroju ktere se kontrolovaly}

Např.:
- Screenshot: `/admin/widget` - teal accent working
- Screenshot: `/test-kalkulacka` - no console errors
- Console output: build PASS

---

## Zaver

**Celkovy vysledek:** PASS / FAIL (provedeni testu bylo uspesne / neuspesne)

**Statistika:**
- Celkem testu: {N}
- Uspesnych: {N}
- Neuspesnych: {N}
- Opraveno behem session: {N}

**Porizovane akce:**
- {Soupis veci ktere se musi udelat na zaklade naslehu — links na soubory/PR}

**Pristi kroky:**
- {Co se ma kontrolovat / opravit v dalsim testovani}

---
