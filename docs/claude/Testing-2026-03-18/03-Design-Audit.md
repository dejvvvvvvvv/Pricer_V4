# Testovani 2026-03-18 — Design Audit

**Datum:** 2026-03-18
**Soubor:** 03-Design-Audit.md

Zaznamenavej zde vsechny vizualni a designove problemy.
Reference: Forge Design System (`src/forge-tokens.css`), WCAG AA.

---

## Legenda — Typy problemu

| Typ | Popis |
|-----|-------|
| Barva | Spatna barva, odchylka od Forge tokenu |
| Kontrast | Nedostatecny kontrast (WCAG AA min 4.5:1 text, 3:1 UI) |
| Pismo | Spatny font, velikost, line-height (heading vs tech vs body) |
| Layout | Zarovnani, mezery, overflow, rozliti obsahu |
| Konzistentnost | Prvek vypada jinak nez jinde na stejne strance nebo v admin |
| Responzivita | Rozbity layout na mensim viewportu |
| Animace | Chybejici, trhana nebo prilis dlouha animace |
| Prazdny stav | Chybejici empty state nebo uplne generick |

---

## Tabulka designovych problemu

| ID | Stranka (ID) | URL | Typ | Popis | Screenshot | Poznamky |
|----|--------------|-----|-----|-------|------------|----------|
| DES-001 | — | — | — | — | — | — |

---

## Checklist na stranku

Pro kazdou stranku projdi tento checklist a zaznacuj vysledky.

### Format checklistu

```
#### [Stranka ID] — [Nazev stranky] ([URL])

- [ ] Tlacitka jsou citelna (text kontrastni, min 4.5:1)
- [ ] Texty maji spravny kontrast (body text, muted text)
- [ ] Nadpisy pouzivaji --forge-font-heading (text-lg a vetsi)
- [ ] Tech font (--forge-font-tech) jen pro 12px labely / ceny / kody
- [ ] Barevna paleta odpovida Forge tokenum (teal, orange akcenty)
- [ ] Zadne "genericky modra" tlacitka bez opodstatneni
- [ ] Modaly a overlaye maji spravny z-index (nezakryvaji se navzajem)
- [ ] Loading stavy jsou pritomne (skeleton / spinner)
- [ ] Error stavy maji konkretni text (ne generic "Nastala chyba")
- [ ] Empty stavy jsou pritomne a nejsou prazdna bilaplocha
- [ ] Spacing je konzistentni (Forge spacing tokeny)
- [ ] Responzivita: otevri 1280px, 1024px — nerozbije se layout?

Nalezene problemy: [ID ze tabulky nebo "zadne"]
```

---

## Checklisty per stranka

#### P01 — Homepage (`/`)

- [ ] Tlacitka jsou citelna (text kontrastni, min 4.5:1)
- [ ] Texty maji spravny kontrast
- [ ] Nadpisy pouzivaji --forge-font-heading
- [ ] Tech font jen pro 12px labely / ceny / kody
- [ ] Barevna paleta odpovida Forge tokenum
- [ ] Zadne genericky modra tlacitka
- [ ] Loading stavy jsou pritomne
- [ ] Error stavy maji konkretni text
- [ ] Empty stavy jsou pritomne
- [ ] Spacing je konzistentni
- [ ] Responzivita 1280px / 1024px OK

Nalezene problemy: —

---

#### P02 — Pricing page (`/pricing`)

- [ ] Tlacitka jsou citelna
- [ ] Texty maji spravny kontrast
- [ ] Nadpisy pouzivaji --forge-font-heading
- [ ] Tech font jen pro labely / ceny
- [ ] Barevna paleta odpovida Forge tokenum
- [ ] Zadne genericky modra tlacitka
- [ ] Loading stavy jsou pritomne
- [ ] Empty stavy jsou pritomne
- [ ] Spacing je konzistentni
- [ ] Responzivita OK

Nalezene problemy: —

---

#### P03 — Support page (`/support`)

- [ ] Tlacitka jsou citelna
- [ ] Texty maji spravny kontrast
- [ ] Nadpisy pouzivaji --forge-font-heading
- [ ] Sticky sidebar funguje a neprekryva obsah
- [ ] Barevna paleta odpovida Forge tokenum
- [ ] Spacing je konzistentni
- [ ] Responzivita OK

Nalezene problemy: —

---

#### P09 — Test Kalkulacka (`/test-kalkulacka`)

- [ ] Tlacitka jsou citelna
- [ ] Texty maji spravny kontrast
- [ ] Stepper kroky jsou vizualne jasne (aktivni / dokonceny / cekajici)
- [ ] Material swatches jsou rozlisitelne
- [ ] Ceny pouzivaji --forge-font-tech
- [ ] Loading stav pri slicovani je pritomny
- [ ] Error stav pri neplatnem souboru je konkretni
- [ ] Spacing je konzistentni
- [ ] Responzivita OK

Nalezene problemy: —

---

#### P10 — Widget (`/w/:id`)

- [ ] Widget se zobrazuje bez Tailwind (pouziva CSS vars)
- [ ] Theme vars funguje (svetly / tmavy rezim)
- [ ] Tlacitka jsou citelna
- [ ] Texty maji spravny kontrast
- [ ] Sizing widgetu v iframe je OK (nepreteka)
- [ ] Loading skeleton se zobrazuje

Nalezene problemy: —

---

#### A01 — Admin Dashboard (`/admin`)

- [ ] Tlacitka jsou citelna
- [ ] Texty maji spravny kontrast
- [ ] Stat karty maji smysl (ne generic dekorace)
- [ ] Grafy jsou citelne a popisky jsou dobre
- [ ] Sidebar je konzistentni s ostatnimi admin strankami
- [ ] Dark / light theme prepina spravne
- [ ] Spacing je konzistentni
- [ ] Responzivita OK

Nalezene problemy: —

---

#### A02 — Admin Orders (`/admin/orders`)

- [ ] Tabulka je citelna
- [ ] Status badge barvy jsou konzistentni
- [ ] Filter panel nezakryva obsah
- [ ] Tlacitka akci jsou citelna
- [ ] Prazdny stav (zadne objednavky) je pritomny
- [ ] Spacing je konzistentni

Nalezene problemy: —

---

#### A03 — Admin Order Detail (`/admin/orders/:id`)

- [ ] Taby jsou citelne a aktivni tab je jasne zvyrazneny
- [ ] Sekce jsou vizualne oddeleny
- [ ] Modal se otevre spravne (pres portal, nezakryta transform)
- [ ] Timeline je citelna
- [ ] Grafy (SVG) jsou spravne
- [ ] Spacing je konzistentni

Nalezene problemy: —

---

#### A04 — Admin Analytics (`/admin/analytics`)

- [ ] Grafy se nacitaji a jsou citelne
- [ ] Legenda grafu je rozlisitelna
- [ ] Datum picker funguje vizualne spravne
- [ ] Stat karty jsou konzistentni
- [ ] Spacing je konzistentni

Nalezene problemy: —

---

#### A05 az A22 — Ostatni Admin stranky

> Vyplnit pri testovani. Pouzit stejny format jako A01-A04 vyse.

| Stranka | Vizualne OK? | Problemy (ID) |
|---------|--------------|---------------|
| A05 — Pricing | Neovereno | — |
| A06 — Fees | Neovereno | — |
| A07 — Parameters | Neovereno | — |
| A08 — Presets | Neovereno | — |
| A09 — Branding | Neovereno | — |
| A10 — Widget | Neovereno | — |
| A11 — Team | Neovereno | — |
| A12 — Customers | Neovereno | — |
| A13 — Integrations | Neovereno | — |
| A14 — Coupons | Neovereno | — |
| A15 — Shipping | Neovereno | — |
| A16 — Print Queue | Neovereno | — |
| A17 — System Health | Neovereno | — |
| A18 — Webhooks | Neovereno | — |
| A19 — Activity Log | Neovereno | — |
| A20 — Settings | Neovereno | — |
| A21 — Emails | Neovereno | — |
| A22 — Account | Neovereno | — |

---

## Forge Design Reference

### Klicove CSS promenne

```css
/* Typografie */
--forge-font-heading   /* Pro nadpisy text-lg a vetsi */
--forge-font-tech      /* Pouze 12px labely, ceny, kody */

/* Barvy textu */
--forge-text-primary   /* Hlavni text */
--forge-text-muted     /* Pomocny text (#7A8291, AA compliant) */

/* Akcenty */
/* Teal pro primary akce */
/* Orange pro sekundarni akcenty */
```

### WCAG AA minimalni kontrasty

| Prvek | Min. pomer |
|-------|-----------|
| Normalni text (pod 18px) | 4.5:1 |
| Velky text (18px+ nebo 14px+ bold) | 3:1 |
| UI komponenty (ikonky, okraje inputu) | 3:1 |

---

*Soubor vytvoren: 2026-03-18*
