# 063-AU — OTAZKY A ODPOVEDI — Auth — 2026-02-24

## Metadata
- **ID:** 063-AU
- **Session:** S01
- **Datum:** 2026-02-24
- **Oblast:** Auth — Sprint 1 Auth Bugfixy
- **Souvisejici ID:** 059-AU, 060-AU, 061-AU, 062-AU

---

## Kontext

Implementace planu Sprint 1 Auth Bugfixy. Uzivatel dodal kompletni plan, behem implementace vznikly otazky a rozhodnuti tykajici se procesu (historie, task tracking, compact).

---

## Otazky a odpovedi

### Q1: Task tracking pro faze

- **Ptal se:** Uzivatel
- **Otazka:** "udelej si tyokenka tech fazi, neboli ty ikonky"
- **Odpoved:** Claude vytvoril 6 tasku pres TaskCreate se zavislostmi (1→2→3→4→5→6), kazdy task = jedna faze planu
- **Rozhodnuti:** Pouzivat TaskCreate/TaskUpdate pro sledovani postupu implementace
- **Dopad:** Vizualni prehled o stavu kazde faze v task listu

---

### Q2: Proc chybi historie soubory na disku?

- **Ptal se:** Uzivatel
- **Otazka:** "jak jako ulozeno? Protoze ja nikde nevidim historii faze 5 a ani ty ostatni soubory v historii co tam maji byt"
- **Odpoved:** Background Task agenti (haiku, general-purpose) reportovali uspech ale fyzicky nezapsali soubory. Glob nastroj nenachazi soubory kvuli diakritice v ceste. Bash `ls -la` potvrdil ze jen 059-AU existoval (prvni agent), ostatni NE.
- **Rozhodnuti:** Historie se musi psat PRIMO z hlavniho okna, ne pres background agenty
- **Dopad:** 060-AU a 061-AU soubory vytvoreny primo. Pouceni zaznamenano.

---

### Q3: Chybejici typy zaznamu (KONVERZACE, OTAZKY, DENNI-PREHLED)

- **Ptal se:** Uzivatel
- **Otazka:** "ale neudelali se ty ostatni jako konverzace atd.! jsou tam na to vse sablony! nedelas to co mas tak kdyz uz to budes delat tak to delej poradne!"
- **Odpoved:** Claude priznal chybu — vytvoril jen UPRAVY zaznamy, ale ne KONVERZACE, OTAZKY a DENNI-PREHLED podle sablon v `docs/claude/Historie/SABLONY/`
- **Rozhodnuti:** Vytvorit vsechny typy zaznamu dle sablon — ne jen UPRAVY
- **Dopad:** Vytvoreni 062-AU (KONVERZACE), 063-AU (OTAZKY), DENNI-PREHLED

---

### Q4: Zakaz automatickeho compactu

- **Ptal se:** Uzivatel
- **Otazka:** "A mas zakazane nyni delat automaticky compact!"
- **Odpoved:** Claude potvrdil — zadny automaticky compact nebude proveden
- **Rozhodnuti:** Compact pouze na explicitni pokyn uzivatele
- **Dopad:** Zadne /compact v teto session bez vyzvy

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnuti | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | Task tracking | TaskCreate pro 6 fazi se zavislostmi | Zadne — uzivatel explicitne pozadal | Q1 |
| 2 | Historie write method | Primo z hlavniho okna, NE background agenti | Background agenti (selhali) | Q2 |
| 3 | Typy zaznamu | Vsechny 4 typy (UPRAVY + KONVERZACE + OTAZKY + DENNI-PREHLED) | Jen UPRAVY (nedostatecne) | Q3 |
| 4 | Compact | Zakazan bez explicitniho pokynu | Auto-compact po kazde fazi (dle planu) | Q4 |

---

## Nerozhodnute otazky

- [ ] Browser testovani — kdy a jak provest finalni end-to-end test

---
