# Hlavni Pozadavky pro Planovani a Implementaci

> **Tento soubor je template.** Pouziva se jako zaklad pro KAZDOU planovaci a implementacni session — bez ohledu na sprint, feature nebo bugfix.
> **4 povinne kontrolni kroky** jsou v samostatnem souboru: `docs/claude/Pravidla/4kroky.md`

---

## 1. Maximalni vyuziti agentu

### Pravidlo

V KAZDE pracovni fazi musi byt v planu jasne rozvrzeni agentu — ktery agent co dela, jake tasky resi, a co se paralelizuje.

### Proc

- **Efektivita** — agenti pracuji paralelne, coz dramaticky zrychluje praci
- **Mene chyb** — specializovany agent dela lip nez genericky pristup
- **Uspora kontextu** — prace v agentech nespotrebovava hlavni kontextove okno

### Jak to vypada v planu

Kazda pracovni faze MUSI obsahovat sekci:

```
### Rozlozeni agentu pro Fazi X

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| mp-mid-frontend-admin | Uprava admin panelu XYZ | Ano (s backend) |
| mp-mid-backend-api | Novy endpoint /api/xyz | Ano (s frontend) |
| mp-spec-docs-dev | Aktualizace dokumentace | Po dokonceni impl. |
```

- Pokud je vic nezavislych tasku — spoustej agenty PARALELNE
- Pokud na sobe zavisi — specifikuj poradi a zavislosti
- Hlavni okno koordinuje agenty, samo minimalne implementuje

---

## 2. Vytvareni novych agentu

### Kdy

Pokud zadny existujici agent nepokryva potrebnou oblast, SMIM vytvorit noveho.

### Pravidla

1. **Novy agent MUSI byt vytvoreny v dobe planovani** — ne az behem implementace
2. **Okamzite dokumentovat** do `docs/claude/AGENT_MAP.md` — zadny nezdokumentovany agent nesmi existovat
3. Agent se vytvori v `.claude/agents/` podle konvence `mp-{tier}-{domena}-{spec}.md`
4. V planu pak musi byt jasne napsano kde a jak se novy agent pouzije

### Proc v dobe planovani

Pokud se agent vytvori az behem implementace, neni mozne ho spravne rozvrhnout v planu. Vsichni agenti musi existovat PRED startem prace aby se dalo naplanovat jejich rozlozeni a spoluprace.

---

## 3. Otazky pred planovanim

### Pravidlo

Pokud mam JAKOUKOLI nejistotu — ZEPTAM SE. Minimalne 3 otazky pred finalizaci planu (viz CLAUDE.md sekce 0).

### Format otazek

Kazda otazka MUSI byt napsana ve dvou vrstvach:

1. **Jednoduche vysvetleni** — srozumitelne i pro uplneho zacatecnika, bez technickeho zargonu
2. **Technicke vysvetleni** — v zavorce `()` presny technicky popis proc se ptam a co to ovlivni

### Priklad

> **Otazka:** Ma se po kliknuti na tlacitko "Ulozit" zobrazit potvrzovaci okno, nebo se ma rovnou ulozit?
> *(Technicky: Rozhoduje to jestli pouzijeme synchronni `save()` s okamzitym UI feedbackem, nebo pridame `confirm()` dialog pred ukladanim. Potvrzovaci dialog pridava krok navic ale chrani pred nahodnym ulozenim.)*

### Typy otazek ktere se ptam

- Co presne ma byt vysledkem? (scope)
- Jak to ma vypadat? (UI/UX)
- Co se stane kdyz neco selze? (error handling)
- Narusi to neco co uz funguje? (kompatibilita)
- Je neco co sem NEMAM zahrnovat? (out of scope)

---

## 4. Kontrolni seznam pro plan

Pred odeslenim planu uzivateli overit:

- [ ] Kazda pracovni faze ma za sebou kontrolni fazi (4 kroky — viz `4kroky.md`)
- [ ] V kazde pracovni fazi je tabulka rozlozeni agentu
- [ ] Vsichni potrebni agenti existuji (nebo jsou naplanovani k vytvoreni)
- [ ] Novi agenti jsou zdokumentovani v AGENT_MAP.md
- [ ] Otazky byly polozeny a zodpovezeny pred finalizaci planu
- [ ] Plan je dostatecne detailni — kazdy krok je jasny bez dalsiho vysvetlovani
