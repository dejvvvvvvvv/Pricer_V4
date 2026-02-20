# Funkcni Test Report: Admin Analytika

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Analytika — metriky widgetu, konverze, materialy, presety, exporty |
| **Route** | `/admin/analytics` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 021-AA |
| **Screenshot slozka** | Fotky_AdminAnalytika-021-AA |
| **Stav** | FUNKCNI (s demo daty) |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Tab navigace, KPI karty, tabulky |
| 1.3 | Dark theme konzistence | OK | Forge dark |

---

## 2. Funkcni testy — Prehled (hlavni tab)

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Info | "Analytika — Prehled toho, co se deje ve widgetu." | OK |
| 2.2 | OBDOBI dropdown | Filtr obdobi | "Poslednich 30 dni" — aktivni vyber | OK |
| 2.3 | "Reset demo dat" | Tlacitko | Pritomne | OK |
| 2.4 | "Obnovit" | Refresh tlacitko | Pritomne | OK |
| 2.5 | 5 tabu | Navigace | Prehled (aktivni), Kalkulace, Objednavky, Ztracene, Exporty | OK |
| 2.6 | KPI: KALKULACE | Cislo + typ | 4 (PRICE_SHOWN) | OK |
| 2.7 | KPI: OBJEDNAVKY | Cislo + typ | 0 (ORDER_CREATED / ADD_TO_CART) | OK |
| 2.8 | KPI: KONVERZE | Procento | 0,0 % (objednavky / kalkulace) | OK |
| 2.9 | KPI: PRUMERNA CENA | Castka | 1 035 Kc | OK |
| 2.10 | KPI: PRUMERNY CAS | Cas | 218,7 min | OK |
| 2.11 | KPI: PRUMERNA HMOTNOST | Hmotnost | 110,3 g | OK |
| 2.12 | KALKULACE / DEN tabulka | Denni prehled | 2026-01-20: 4 kalkulace | OK |
| 2.13 | OBJEDNAVKY / DEN tabulka | Denni prehled | 2026-01-20: 0 objednavek | OK |
| 2.14 | TOP MATERIALY | Tabulka | PLA: 2, PETG: 2 | OK |
| 2.15 | TOP PRESETY | Tabulka | Basic: 2 (0,0%), Detail: 1 (0,0%) | OK |
| 2.16 | TOP POPLATKY (FEES) | Tabulka | fee_packaging: 1 | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Data jsou z localStorage (demo) — ne realna | Napojit na Supabase analytics |
| 2 | INFO | Taby Kalkulace, Objednavky, Ztracene, Exporty — netestovano (vizualne jen Prehled) | Manualni test |

---

## 4. Pozitivni nalezy

- **6 KPI karet v radku:** KALKULACE (0), OBJEDNAVKY (0), KONVERZE (0,0%), PRUMERNA CENA (0 Kc), PRUMERNY CAS (0,0 min), PRUMERNA HMOTNOST (0,0 g) — monospace font, PRICE_SHOWN/ORDER_CREATED subtexty
- **5 tabu:** Prehled (zeleny aktivni), Kalkulace, Objednavky, Ztracene, Exporty — outline styl pro neaktivni
- **Toolbar vpravo:** OBDOBI dropdown "Poslednich 30 dni", "Reset demo dat" button, "Obnovit" button
- **Denni breakdown:** 2 tabulky vedle sebe — KALKULACE/DEN (DATUM + POCET) a OBJEDNAVKY/DEN (DATUM + POCET) — obe "Zadna data" empty state
- **3 TOP tabulky v radku:** TOP MATERIALY (MATERIAL + POCET), TOP PRESETY (PRESET + POCET + KONVERZE), TOP POPLATKY/FEES (FEE + ZVOLENO) — vsechny "Zadna data"
- **Tip dole:** "Pro demo data se pouziva simulace (localStorage)." — informativni pro demo prostredi
- **Obdobi filtr** — 30 dni dropdown s moznosti zmeny
- **Reset demo dat** — uzitecne pro cisteni testovacich dat

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Analytika kompletni: 6 KPI karet, denni tabulky, TOP materialy/presety/fees | `Fotky_AdminAnalytika-021-AA/AdminAnalytics-021-AA.png` |
| 2 | Prehled tab — KPI karty + denni breakdown + TOP tabulky | ss_4296dk7e6 |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Realna data (VYSOKA priorita)
- [ ] Napojit na Supabase analytics tabulku misto localStorage
- [ ] Pridat event tracking do widgetu (PRICE_SHOWN, ADD_TO_CART)

### Faze 2: Vizualizace
- [ ] Grafy (recharts/chart.js) pro casove rady — kalkulace/den, objednavky/den
- [ ] Funnel vizualizace — kalkulace -> objednavka -> dokonceni

### Faze 3: Exporty
- [ ] CSV/PDF export analytickych dat
- [ ] Schedulovane reporty emailem

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 4/5 | Prehledne, KPI karty, tabulky |
| Funkcnost | 4/5 | 6 KPI, denni breakdown, TOP tabulky — demo data |
| UX/pouzitelnost | 4/5 | Intuitivni, obdobi filtr |
| Stabilita | 5/5 | Zadne chyby |
| **Celkem** | **17/20** | Solidni analyticky dashboard, hlavni TODO je realna data |

---

> Vygenerovano: 2026-02-20, Test session: S01
