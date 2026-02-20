# 5. Admin — Poplatky (Fees) — Detailni RoadMap Plan

> **Stav:** 🟢 87% hotovo | **Priorita:** KRITICKA
> **Zavislosti na jine sekce:** ZADNE
> **Kdo na nem zavisi:** Kalkulacka (#1), Pricing Engine (#3)

---

## Prehled

Admin stranka pro spravu poplatku (fees) s podminkovym systemem. Kazdy poplatek ma scope (MODEL/ORDER), typ podminky a dalsi konfigurace. Obsahuje take simulator pro testovani fee logiky.

**Hlavni soubor:** `src/pages/admin/AdminFees.jsx`
**Storage:** `src/utils/adminFeesStorage.js`

---

## Co je HOTOVO (✅)

### Fee CRUD a conditions (90%)
- [x] Pridani/editace/mazani poplatku
- [x] MODEL scope — poplatek na kazdy model zvlast
- [x] ORDER scope — poplatek na celou objednavku
- [x] Typed conditions:
  - [x] Material — poplatek jen pro specificky material
  - [x] Weight — poplatek podle hmotnosti (nad/pod X gramu)
  - [x] Volume — poplatek podle objemu modelu
  - [x] Surface — poplatek podle povrchu modelu
  - [x] Quantity — poplatek podle poctu kusu
- [x] Selectable flag — zakaznik si muze vybrat
- [x] Required flag — povinny poplatek
- [x] Default flag — predvybrany
- [x] Razeni a priorita
- [x] Negativni slevy (fee se zapornou hodnotou)

### Simulator (85%)
- [x] Testovaci prostredi pro fee logiku
- [x] Zadani testovacich parametru
- [x] Zobrazeni aplikovanych fees

### i18n (80%)
- [x] Vetsina textu prelozena CS/EN

---

## Co CHYBI / je potreba dodelat

### Faze 1: Doplneni i18n (Priorita: NIZKA)

#### Ukol 1.1: Audit a doplneni chybejicich prekladu
- **Soubor:** `src/pages/admin/AdminFees.jsx`
- **Co udelat:**
  - [ ] Projit vsechny stringy
  - [ ] Identifikovat a prelozit hardcoded texty
  - [ ] Pridat chybejici klice do `LanguageContext.jsx`
- **Ocekavany rozsah:** 5-15 textu

### Faze 2: Drobna vylepseni (Priorita: NIZKA, post-Beta)

#### Ukol 2.1: Simulator vylepseni
- **Co udelat:**
  - [ ] Vice preddefinovanych testovacich scenaru
  - [ ] Vizualizace ktere fees se aplikovaly a proc
  - [ ] Export simulace

#### Ukol 2.2: UX vylepseni
- **Co udelat:**
  - [ ] Lepsi vizualni indikace podminek (kdyz se fee uplatni)
  - [ ] Tooltip s vysvetlenim kazdeho typu podminky
  - [ ] Varovani pri potencialne konfliktnim nastaveni (dva fees na stejny material)

---

## Implementacni poradi

1. **Faze 1** (i18n) — 1-2 hodiny
2. **Faze 2** (UX) — post-Beta

**Celkem pro Beta:** ~1-2 hodiny

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/admin/AdminFees.jsx` | i18n doplneni | Maly |
| `src/contexts/LanguageContext.jsx` | Nove klice | Maly |

---

## Poznamky

- Tato sekce je prakticky HOTOVA pro Beta
- Fees system je jeden z nejstabilnejsich casti projektu
- Simulator je skvely nastroj pro testovani — muzeme ho pouzit i pri testovani pricing engine zmen

---

## Kriticke doplnky (z review)

### Fee condition kombinace (edge cases)
- [ ] Vice podminek na jednom fee — AND vs OR logika (aktualne: AND)
- [ ] Nested conditions (napr. material=PLA AND weight>100g) — overit ze funguje
- [ ] Negativni fee (sleva) nesmie snizit cenu pod 0
- [ ] Fee s procentualni hodnotou — z ceho se pocita? (z base price, ne z total)

### Fee template presets (post-Beta)
- [ ] Preddefinovane fee sady pro bezne scenare:
  - "3D tisk zaklad" — setup fee, podpery fee, urgentni priplatek
  - "CNC freza" — material fee, tooling fee, complexity fee
  - "Laser cut" — material fee, cut length fee
