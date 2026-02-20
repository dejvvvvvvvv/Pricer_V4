# 003-GN — OTAZKY A ODPOVEDI — General (Historie System) — 2026-02-19

## Metadata
- **ID:** 003-GN
- **Session:** S01
- **Datum:** 2026-02-19
- **Oblast:** General — navrh Historie systemu
- **Souvisejici ID:** 001-GN, 002-GN

---

## Kontext

Claude polozil 4 navrhovaci otazky pred finalni implementaci Historie systemu, aby overil uzivatelske preference pro triggery, uroven detailu, ID system a jazyk dokumentace. Otazky byly zodpovezeny ve zprave [2].

---

## Otazky a odpovedi

### Q1: Trigger — auto vs manual

- **Ptal se:** Claude
- **Otazka:** Chces aby se to spoustelo automaticky pri kazdem checkpointu, nebo chces rucni trigger pres /history?
- **Odpoved:** Chci aby se to spoustelo automaticky pri kazdem checkpointu — HLAVNE pred Compactovanim konverzace (P0 — bez kompromisu, prvne uloz historii, az pak compact) — ale take pri rucnim triggeru pres /history skill a pri "uloz historii" zprave
- **Rozhodnuti:** Oba rezimy — automaticky (vsechny checkpointy + P0 pred compact/plan/clear) + manual (/history skill)
- **Dopad:** Agent obsahuje 6 ruznych trigger podminek. Compact je nejkritictejsi (P0 priorita).

---

### Q2: Uroven detailu pro UPRAVY soubory

- **Ptal se:** Claude
- **Otazka:** Jak detailni maji byt UPRAVY soubory — minimalni (jen nazvy souboru), stredni (co se menilo, proc), nebo detailni (fragmenty kodu, diff-like)?
- **Odpoved:** Stredni s troukou detailnosti. Fragmenty kodu se mohou ukladat ale jen kdyz je to velmi dulezita vec (architektura, breaking change). Jinak prevazne stredni dokumentace. Hlavne aby tam bylo co presne se upravovalo a s tim radkovym rozsahem.
- **Rozhodnuti:** Stredni uroven + radkove rozsahy povinne. Fragmenty kodu max 10 radku jen pro arch/breaking.
- **Dopad:** Sablona UPRAVY nastavena na tuto uroven. Agent instrukce rikaji "fragmenty jen pro arch/breaking zmeny".

---

### Q3: Session-level ID system

- **Ptal se:** Claude
- **Otazka:** Chces session-level ID (S01, S02 uvnitr dne) pro odliseni vice sessions ve stejnem dni?
- **Odpoved:** To co ti prijde lepsi, jelikoz to budes prevazne pouzivat ty tak aby to pro tebe bylo jasne.
- **Rozhodnuti:** Globalni sekvencni pocitadlo (NNN) kombinovane se session oznacenim S01/S02 v ramci dne. Oba elementy jsou v metadatech kazdeho souboru.
- **Dopad:** ID format je {NNN}-{ZK}, Session je separatni pole v metadatech. Pocitadlo je v ID-REGISTRY.md.

---

### Q4: Jazyk dokumentace

- **Ptal se:** Claude
- **Otazka:** Cestina nebo anglictina pro obsah historickych souboru?
- **Odpoved:** Spise Cestina.
- **Rozhodnuti:** Cestina v obsahu vsech historickych souboru. ASCII-safe nazvy souboru (bez diakritiky v nazvu).
- **Dopad:** Vsechny sablony, agent instrukce a tento zaznam pouzivaji cestinu. Nazvy souboru jsou ASCII.

---

### Q5: Ulozeni do obou CLAUDE.md

- **Ptal se:** Uzivatel (zjistil chybu)
- **Otazka:** Ulozil jsi to do obou claude.md? Do toho master claude.md a do toho zkraceného claude.md ktery ctes vzdy na zacatku konverzace?
- **Odpoved:** Claude priznal ze ulozil jen do compact CLAUDE.md, master CLAUDE.md chybel.
- **Rozhodnuti:** Opravit — pridat sekci 17.5 do master CLAUDE.md se vsemi detaily (7 podsekci).
- **Dopad:** Master CLAUDE.md nyni obsahuje kompletni sekci 17.5. Oba CLAUDE.md jsou synchronizovany.

---

### Q6: Oprava preklepu NESMOLITELNE

- **Ptal se:** Uzivatel (zjistil chybu)
- **Otazka:** Mas to tam spravne napsane? Treba ze jsi tam napsal NESMOLITELNE?
- **Odpoved:** Claude priznal chybu — spravne slovo je BEZODKLADNE.
- **Rozhodnuti:** Opravit NESMOLITELNE → BEZODKLADNE vsude (compact CLAUDE.md, master CLAUDE.md, agent .md, skill .md).
- **Dopad:** Vsechny 4 dotcene soubory opraveny. Dalsi preklepe "pred ztra tou" → "pred ztratou" take opraveny.

---

### Q7: Triggery pred dodanim planu a pred /clear

- **Ptal se:** Uzivatel (rozsireni pozadavku)
- **Otazka:** Aby jsi vedel lepe kdy to mas spustit, jako treba pred tim Auto Compactem a hlavne take i pred dodanim planu jelikoz jak se zacina implementovat plan tak se dela clear konverzace a ztrati se informace, takze aby to ulozilo tu historii pred dodanim planu.
- **Odpoved:** Claude pridal oba triggery jako P0 do vsech relevantnich souboru.
- **Rozhodnuti:** Triggery pred dodanim planu (P0) a pred /clear (P0) pridany vedle compact triggeru. Vse v jedne P0 skupine.
- **Dopad:** Agent nyni ma 3 P0 triggery (compact, plan, /clear) a 3 standardni (CP1→CP2, CP2→CP3, manual).

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnuti | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | Trigger rezim | Oba: auto (checkpointy) + manual (/history) | Jen manual / jen auto | Q1 |
| 2 | Uroven detailu | Stredni + radkove rozsahy; fragmenty jen arch/breaking | Minimalni / Detailni | Q2 |
| 3 | ID system | Globalni NNN + Session S01/S02 separatne | Session-prefix ID / datum-prefix ID | Q3 |
| 4 | Jazyk | Cestina (ASCII-safe nazvy souboru) | Anglictina | Q4 |
| 5 | Master CLAUDE.md | Pridan sekce 17.5 (7 podsekci) — oba CLAUDE.md sync | — | Q5 |
| 6 | Preklepe | BEZODKLADNE (ne NESMOLITELNE) | — | Q6 |
| 7 | P0 triggery | Compact + dodani planu + /clear = vsechny P0 | Jen compact jako P0 | Q7 |

---

## Nerozhodnute otazky

(zadne — vsechny otazky z teto session zodpovezeny)

---

<!-- KONEC SOUBORU 003-GN_OTAZKY.md -->
