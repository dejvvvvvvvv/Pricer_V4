# Testovani 2026-03-18 — Audit Prekladu (i18n)

**Datum:** 2026-03-18
**Soubor:** 04-Translation-Audit.md

Zaznamenavej zde vsechny problemy s prekladem, chybejici texty a hardcoded retezce.
Jazyk UI se prepina v `useLanguage()` hooku. Testuj oba jazyky: CZ a EN.

---

## Legenda — Typ problemu

| Typ | Popis |
|-----|-------|
| Chybejici | Text se zobrazuje jako klic (napr. `admin.orders.title`) nebo prazdny retezec |
| Spatny | Preklad existuje, ale je nepresny, gramaticky spatny nebo matouci |
| Hardcoded | Text je natvrdo v JSX, nepouziva `t()` / `useLanguage()` |
| Neprevedeno | Text je v CZ ale EN verze chybi (nebo naopak) |
| Prilis doslovny | Preklad je prilis doslovny, nepusobi prirozene v cilovem jazyce |

---

## Tabulka nalezu

| ID | Stranka (ID) | URL | Jazyk | Typ | Nalezeny text (co je tam) | Ocekavany text (co ma byt) | Klic (pokud znamy) |
|----|--------------|-----|-------|-----|--------------------------|---------------------------|---------------------|
| TRN-001 | — | — | — | — | — | — | — |

---

## Jak testovat

1. Prepni jazyk na **CZ** (default)
2. Projdi stranku — zapis vse co vypada jako klic nebo prazdne
3. Prepni jazyk na **EN**
4. Projdi stejnou stranku — zapis chybejici nebo spatne preklady
5. Zaznacuj v checklistech nize

---

## Checklist per stranka

### Postup pro kazdou stranku:
- Otevri stranku v CZ, pak prepni na EN
- Zaznacuj `[OK]` / `[PROBLEM]` / `[Neovereno]`

---

#### P01 — Homepage (`/`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Hlavni nadpis | Neovereno | Neovereno | |
| Podnadpis / popis | Neovereno | Neovereno | |
| CTA tlacitka | Neovereno | Neovereno | |
| Navigace | Neovereno | Neovereno | |
| Footer | Neovereno | Neovereno | |

---

#### P02 — Pricing page (`/pricing`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpis planu | Neovereno | Neovereno | |
| Popis funkci | Neovereno | Neovereno | |
| CTA tlacitka | Neovereno | Neovereno | |
| FAQ sekce | Neovereno | Neovereno | |

---

#### P03 — Support page (`/support`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpisy sekci | Neovereno | Neovereno | |
| FAQ otazky a odpovedi | Neovereno | Neovereno | |
| Navody (step-by-step) | Neovereno | Neovereno | |
| Kontaktni formular | Neovereno | Neovereno | |
| Sidebar navigace | Neovereno | Neovereno | |

---

#### P09 — Test Kalkulacka (`/test-kalkulacka`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nazvy kroku (stepper) | Neovereno | Neovereno | |
| Upload instrukce | Neovereno | Neovereno | |
| Nazvy materialu | Neovereno | Neovereno | |
| Nazvy parametru | Neovereno | Neovereno | |
| Cenovy prehled | Neovereno | Neovereno | |
| Checkout formular — labely | Neovereno | Neovereno | |
| Checkout formular — placeholder | Neovereno | Neovereno | |
| Validacni zpravy | Neovereno | Neovereno | |
| Potvrzeni objednavky | Neovereno | Neovereno | |
| Chybove zpravy | Neovereno | Neovereno | |

---

#### P10 — Widget (`/w/:id`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nazvy kroku | Neovereno | Neovereno | |
| Tlacitka | Neovereno | Neovereno | |
| Cenovy prehled | Neovereno | Neovereno | |
| Chybove zpravy | Neovereno | Neovereno | |

---

#### Admin stranky (obecne)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Sidebar nazvy polozek | Neovereno | Neovereno | |
| Dashboard stat labely | Neovereno | Neovereno | |
| Tabulkove hlavicky | Neovereno | Neovereno | |
| Akce tlacitka (Ulozit / Zrusit / Smazat) | Neovereno | Neovereno | |
| Toast notifikace | Neovereno | Neovereno | |
| Confirm dialogy | Neovereno | Neovereno | |
| Prazdne stavy | Neovereno | Neovereno | |
| Chybove zpravy | Neovereno | Neovereno | |

---

#### A02 — Admin Orders (`/admin/orders`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpis stranky | Neovereno | Neovereno | |
| Status hodnoty (Pending, Processing...) | Neovereno | Neovereno | |
| Filter labely | Neovereno | Neovereno | |
| Sloupce tabulky | Neovereno | Neovereno | |
| Export tlacitko | Neovereno | Neovereno | |

---

#### A03 — Admin Order Detail (`/admin/orders/:id`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nazvy tabu | Neovereno | Neovereno | |
| Labely poli (Customer / Shipping / Items) | Neovereno | Neovereno | |
| Timeline popisky | Neovereno | Neovereno | |
| Fakturacni sekce | Neovereno | Neovereno | |

---

#### A04 — Admin Analytics (`/admin/analytics`)

| Prvek | CZ | EN | Poznamky |
|-------|----|----|----------|
| Nadpisy sekcí a grafu | Neovereno | Neovereno | |
| Legenda grafu | Neovereno | Neovereno | |
| Datum filter labely | Neovereno | Neovereno | |

---

#### A05 az A22 — Ostatni Admin stranky

| Stranka | CZ ok? | EN ok? | Hardcoded? | Poznamky |
|---------|--------|--------|------------|----------|
| A05 — Pricing | Neovereno | Neovereno | Neovereno | |
| A06 — Fees | Neovereno | Neovereno | Neovereno | |
| A07 — Parameters | Neovereno | Neovereno | Neovereno | |
| A08 — Presets | Neovereno | Neovereno | Neovereno | |
| A09 — Branding | Neovereno | Neovereno | Neovereno | |
| A10 — Widget | Neovereno | Neovereno | Neovereno | |
| A11 — Team | Neovereno | Neovereno | Neovereno | |
| A12 — Customers | Neovereno | Neovereno | Neovereno | |
| A13 — Integrations | Neovereno | Neovereno | Neovereno | |
| A14 — Coupons | Neovereno | Neovereno | Neovereno | |
| A15 — Shipping | Neovereno | Neovereno | Neovereno | |
| A16 — Print Queue | Neovereno | Neovereno | Neovereno | |
| A17 — System Health | Neovereno | Neovereno | Neovereno | |
| A18 — Webhooks | Neovereno | Neovereno | Neovereno | |
| A19 — Activity Log | Neovereno | Neovereno | Neovereno | |
| A20 — Settings | Neovereno | Neovereno | Neovereno | |
| A21 — Emails | Neovereno | Neovereno | Neovereno | |
| A22 — Account | Neovereno | Neovereno | Neovereno | |

---

## Souhrn po dokonceni testovani

| Jazyk | Celkem problemu | Chybejici | Spatny | Hardcoded | Neprevedeno |
|-------|-----------------|-----------|--------|-----------|-------------|
| CZ | — | — | — | — | — |
| EN | — | — | — | — | — |

---

*Soubor vytvoren: 2026-03-18*
