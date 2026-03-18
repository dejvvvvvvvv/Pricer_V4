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
| DES-001 | P01 — Homepage | `/` | Konzistentnost | CTA tlacitka "Try for Free" a "View Demo" v hero sekci vypadaji jako plain text — zadne viditelne pozadi ani border, nelze je jednoznacne identifikovat jako tlacitka | — | Priorita P1 — vizualni affordance je slaba, clovek nepozna ze jsou klikatelna |
| DES-002 | P01 — Homepage | `/` | Kontrast | Spodni text v hero sekci ("No slicer installation, no manual pricing. Just embed the widget...") je velmi bledý / nizky kontrast na tmatem pozadi — obtizne citelne | — | Priorita P2 — mozne WCAG AA poruseni pro muted text |
| DES-003 | P01 — Homepage | `/` | Kontrast | Prava strana hero sekce obsahuje 3D vizualizaci modelu, ktera je prilis tmava / tezko viditelna na tmatem pozadi | — | Priorita P3 — dekorativni prvek, nerusi funkcionalitu |

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

> Stav: Dokonceno.

- [~] Tlacitka jsou citelna (text kontrastni, min 4.5:1) — PROBLEM: CTA tlacitka hero sekce bez jasneho button stylingu (DES-001)
- [~] Texty maji spravny kontrast — PROBLEM: spodni text hero sekce prilis bledý (DES-002); hlavni nadpis a subtext OK
- [x] Barevna paleta odpovida Forge tokenum — teal akcent a zeleny badge pritomny
- [x] Zadne genericky modra tlacitka — pouziva zelena / teal / oranzove akcenty
- [x] FAQ ikony — spravna barevna zmena (+ zelena → × oranzova)
- [x] Footer — vizualne konzistentni s designem stranky
- [ ] Nadpisy pouzivaji --forge-font-heading — neovereno detailne
- [ ] Tech font jen pro 12px labely / ceny / kody — neovereno
- [ ] Responzivita 1280px / 1024px OK — neovereno

Nalezene problemy: DES-001, DES-002, DES-003

---

#### P02 — Pricing page (`/pricing`)

> Stav: Dokonceno. Design je konzistentni — zadne designove odchylky.

- [x] Tlacitka jsou citelna — OK, spravny Forge styl
- [x] Texty maji spravny kontrast — WCAG AA overeno vizualne
- [x] Barevna paleta odpovida Forge tokenum — teal, oranzove akcenty spravne
- [x] Zadne genericky modra tlacitka — OK
- [x] Pricing karty vizualne odlisene — Recommended karta ma zvyrazneni
- [x] FAQ taby jsou citelne a aktivni tab je jasne vyznacen
- [x] Spacing je konzistentni
- [ ] Nadpisy pouzivaji --forge-font-heading — neovereno detailne
- [ ] Responzivita 1280px / 1024px OK — neovereno

Nalezene problemy: zadne designove problemy. (Pozn.: BUG-008 je datovy/i18n problem, ne design.)

---

#### P03 — Support page (`/support`)

> Stav: Castecne otestovano. Design detailne neoverovan.

- [ ] Tlacitka jsou citelna — neovereno
- [ ] Texty maji spravny kontrast — neovereno
- [ ] Nadpisy pouzivaji --forge-font-heading — neovereno
- [ ] Sticky sidebar funguje a neprekryva obsah — neovereno
- [ ] Barevna paleta odpovida Forge tokenum — neovereno
- [ ] Spacing je konzistentni — neovereno
- [ ] Responzivita OK — neovereno

Nalezene problemy: —

---

#### P04 — Model Upload (`/model-upload`)

> Stav: Dokonceno. Design je konzistentni — zadne designove odchylky.

- [x] Tlacitka jsou citelna — OK
- [x] Texty maji spravny kontrast — OK, dark theme konzistentni
- [x] Dropzone vizualne jasna — dashed border, upload ikona, instrukce citelne
- [x] 4 format karty vizualne odlisene — STEP karta ma "SOON" badge
- [x] Barevna paleta odpovida Forge tokenum — teal akcenty pritomny
- [x] Loading skeleton pritomny — zobrazi se pred nactenim stranky
- [ ] Nadpisy pouzivaji --forge-font-heading — neovereno detailne
- [ ] Responzivita 1280px / 1024px OK — neovereno

Nalezene problemy: zadne. (Pozn.: BUG-016/017 jsou i18n problemy, ne design.)

---

#### P05 — Order Tracking (`/track`)

> Stav: Dokonceno. Design je cistry — zadne designove odchylky.

- [x] Tlacitka jsou citelna — "TRACK ORDER" tlacitko ma spravny Forge styl
- [x] Texty maji spravny kontrast — OK
- [x] Chybovy stav vizualne odlisen — cerveny banner pro neplatnou objednavku
- [x] Ikona teal 3D boxu — vizualne konzistentni s ostatnimi strankami
- [x] Barevna paleta odpovida Forge tokenum — OK
- [ ] Nadpisy pouzivaji --forge-font-heading — neovereno detailne
- [ ] Responzivita OK — neovereno

Nalezene problemy: zadne. (Pozn.: BUG-021/022/023 jsou funkcni / i18n problemy, ne design.)

---

#### P06 — 404 stranka (`/some-nonexistent-page`)

> Stav: Dokonceno. Design je vylozene povedeny — cista, vzdusna stranka.

- [x] Tlacitka jsou citelna — "Go Home" a "Go Back" maj spravny Forge styl
- [x] Texty maji spravny kontrast — OK
- [x] Velke "404" v teal — dominantni, jednoznacne, vizualne silne
- [x] Badge s URL cestou — konkretni, negenericke
- [x] Shortcut karty — citelne, konzistentni design
- [x] Spacing je vzdusny a konzistentni
- [x] Barevna paleta odpovida Forge tokenum — teal akcent spravny

Nalezene problemy: zadne.

---

#### P-Account — Account (`/account`)

> Stav: Dokonceno. Layout je cistry — zadne designove odchylky nalezeny.

- [x] Tlacitka jsou citelna — "Save Changes" tlacitka maji spravny Forge styl
- [x] Texty maji spravny kontrast — OK
- [x] 4 taby vizualne jasne rozlisene — aktivni tab zvyrazneny
- [x] Company form — dvousloupcovy layout konzistentni a prehledny
- [x] Security: indikator sily hesla vizualne reaguje na vstup
- [x] Billing: plan badge "ACTIVE" vizualne odlisen
- [x] Avatar s inicialy se aktualizuje reaktivne — OK
- [ ] Nadpisy pouzivaji --forge-font-heading — neovereno detailne
- [ ] Responzivita OK — neovereno

Nalezene problemy: zadne designove. (Pozn.: BUG-028 tab scroll a BUG-029/030-033 nefunkcni tlacitka jsou funkcni problemy, ne design.)

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

> Stav: Dokonceno. Design je konzistentni s Forge dark theme — zadne designove problemy.

- [x] Tlacitka jsou citelna — OK, spravny Forge styl
- [x] Texty maji spravny kontrast — OK
- [x] Stat karty maji smysl — Today's Revenue, Orders, Pending Action, Active Prints — relevatni data
- [x] Sidebar je konzistentni s ostatnimi admin strankami — OK
- [x] Dark / light theme prepina spravne a persists — OK
- [x] Spacing je konzistentni — OK
- [x] Status badges v Recent orders jsou vizualne odlisene — OK
- [ ] Grafy jsou citelne — neovereno (zadne grafy na prvni strance)
- [ ] Responzivita 1280px / 1024px OK — neovereno

Nalezene problemy: zadne designove. (Pozn.: BUG-044 modal pod viewport je funkcni/portal bug, ne design. BUG-045 analytics 404 je routing bug.)

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
| A05 — Pricing | OK — zadne designove problemy | — | Konzistentni Forge dark theme. BUG-046/047/048 jsou funkcni bugy, ne design. |
| A06 — Fees | OK — zadne designove problemy | — | Konzistentni Forge dark theme. |
| A07 — Parameters | OK — zadne designove problemy | — | Konzistentni Forge dark theme. |
| A08 — Presets | OK — zadne designove problemy | — | Konzistentni Forge dark theme. Sablony, preset karty, drag handles, search, pagination — vse vizualne OK. BUG-049/050 jsou funkcni problemy, ne design. |
| A-Express — Express Delivery | OK — zadne designove problemy | — | Cisty dvoupanelovy layout. Reaktivni odznak prikazu aktualizuje spravne. Konzistentni Forge dark theme. |
| A15 — Shipping | OK — zadne designove problemy | — | Dvoupanelovy layout kopiruje Express — konzistentni admin UX. Zakryvani poli pri "Osobni odber" vizualne spravne. |
| A09 — Branding | Neovereno | — |
| A10 — Widget | Neovereno | — |
| A11 — Team | Neovereno | — |
| A12 — Customers | OK — VYBORNE provedeni | — | Nejpolisovanejsi stranka. Teal segment badges, avatary s inicialy, inline stats panel, ORDER HISTORY se status badges, konzistentni spacing. |
| A13 — Integrations | Neovereno | — |
| A14 — Coupons | OK — zadne designove problemy | — | Konzistentni Forge dark theme, teal akcenty, spravne rozestupe v tabulce i v modalu. |
| A02 — Orders | OK — status badges povedene | — | Status badges jsou vizualne odlisene barevnym kodem (dobre). Kanban pohled konzistentni. BUG-052 je i18n problem, ne design. |
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

*Soubor vytvoren: 2026-03-18 | Aktualizovan: 2026-03-18 (davka 6 — A14/Coupons OK, A02/Orders OK (status badges povedene), A12/Customers VYBORNE provedeni — nejpolisovanejsi stranka)*
