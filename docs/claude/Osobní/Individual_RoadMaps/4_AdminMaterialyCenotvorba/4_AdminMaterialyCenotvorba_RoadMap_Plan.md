# 4. Admin — Materialy a cenotvorba — Detailni RoadMap Plan

> **Stav:** 🟢 85% hotovo | **Priorita:** KRITICKA
> **Zavislosti na jine sekce:** ZADNE
> **Kdo na nem zavisi:** Kalkulacka (#1), Pricing Engine (#3), Presety (#6)

---

## Prehled

Admin stranka pro spravu materialu, cen za cas, markup pravidel, volume discounts a preview sandboxu. Je to **jedna z nejkomplexnejsich admin stranek** (3173 radku v jednom souboru).

**Hlavni soubor:** `src/pages/admin/AdminPricing.jsx` (~3173 radku)
**Storage:** `src/utils/adminPricingStorage.js`

---

## Co je HOTOVO (✅)

### CRUD materialu (92%)
- [x] Pridani noveho materialu (nazev, typ, cena za gram)
- [x] Editace existujiciho materialu
- [x] Smazani materialu (s potvrzenim)
- [x] Razeni materialu (drag&drop nebo sipky)
- [x] Barvy per-material — globalni cena nebo per-barva cena za gram
- [x] Skupiny materialu
- [x] Active/inactive toggle

### 5 tabu (95%)
- [x] **Materials** — CRUD materialu s barvami
- [x] **Time** — cena za hodinu tisku
- [x] **Rules** — markup pravidla
- [x] **Discounts** — volume discount tiers
- [x] **Preview** — sandbox pro testovani cen

### Time Pricing (90%)
- [x] Cena za hodinu tisku (konfigurovatelna)
- [x] Prehledne UI

### Markup pravidla (90%)
- [x] Markup procento
- [x] Konfigurovatelne v admin

### Volume Discounts (88%)
- [x] Tier-based system
- [x] Konfigurovatelne prahy a procenta
- [x] Trigger dle quantity nebo amount

### Preview Sandbox (85%)
- [x] Testovaci prostredi
- [x] Zadani testovacich parametru (material, vaha, cas, pocet)
- [x] Zobrazeni vysledne ceny a breakdownu
- [x] Vyuziva `pricingEngineV3.js` pro vypocet

---

## Co CHYBI / je potreba dodelat

### Faze 1: CS/EN lokalizace doplneni (Priorita: STREDNI)

#### Ukol 1.1: Audit hardcoded textu
- **Soubor:** `src/pages/admin/AdminPricing.jsx`
- **Co udelat:**
  - [ ] Projit vsechny stringy v JSX renderovani
  - [ ] Identifikovat hardcoded ceske/anglicke texty
  - [ ] Pridat chybejici klice do `LanguageContext.jsx`
  - [ ] Nahradit hardcoded texty volanim `t('klic')`
- **Ocekavany rozsah:** 20-40 textu k prelozeni
- **Poznamka:** Vetsina uz je prelozena, chybi par novejsich casti

#### Ukol 1.2: Zkontrolovat tooltips a placeholdery
- **Co udelat:**
  - [ ] Vsechny tooltips maji CS/EN preklad
  - [ ] Vsechny input placeholdery maji CS/EN preklad
  - [ ] Error messages maji CS/EN preklad
  - [ ] Success toasty maji CS/EN preklad

### Faze 2: Kod kvalita — monoliticky soubor (Priorita: NIZKA, post-Beta)

> **POZNAMKA:** Pro Beta neni nutne. Ale pro dlouhodobou udrzovatelnost je to dulezite.

#### Ukol 2.1: Analyza pro budouci refactoring
- **Soubor:** `src/pages/admin/AdminPricing.jsx` (3173 radku)
- **Co udelat:**
  - [ ] Identifikovat logicke bloky (materials tab, time tab, rules tab, discounts tab, preview tab)
  - [ ] Navrhnout rozdeleni do podkomponent:
    - `AdminPricingMaterials.jsx` — materials tab
    - `AdminPricingTime.jsx` — time tab
    - `AdminPricingRules.jsx` — rules tab
    - `AdminPricingDiscounts.jsx` — discounts tab
    - `AdminPricingPreview.jsx` — preview sandbox
  - [ ] Identifikovat sdileny stav ktery musi zustat v parent komponente
  - [ ] Naplanovat migraci bez narušeni funkcionality
- **DULEZITE:** Toto je PLAN, ne implementace. Implementovat az po Beta.

### Faze 3: Drobna UI vylepseni (Priorita: NIZKA)

#### Ukol 3.1: Material form UX
- **Co udelat:**
  - [ ] Tooltip u kazdeho parametru materialu (vysvetleni co dela)
  - [ ] Lepsi vizualni odliseni per-barva vs globalni cena
  - [ ] Validace — upozorneni pri nulove cene
  - [ ] Zobrazeni poctu pouziti materialu v kalkulacce (pokud data existuji)

#### Ukol 3.2: Preview sandbox vylepseni
- **Co udelat:**
  - [ ] Moznost ulozit testovaci scenare
  - [ ] Porovnani dvou konfigurace side-by-side
  - [ ] Export vysledku do CSV

---

## Implementacni poradi

1. **Faze 1** (i18n) — 2-3 hodiny, zadne zavislosti, muze byt kdykoli
2. **Faze 2** (refactoring plan) — 1-2 hodiny analyzy, implementace az post-Beta
3. **Faze 3** (UX) — 2-3 hodiny, nizka priorita

**Celkem pro Beta:** ~2-3 hodiny (jen Faze 1)

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| i18n zmeny rozbiji existujici preklady | Nizka | Nizky | Kontrola pred commitem |
| Monoliticky soubor zpomaluje vyvoj | Stredni | Nizky (pro Beta) | Plan pro refactoring post-Beta |

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/admin/AdminPricing.jsx` | i18n doplneni | Maly |
| `src/contexts/LanguageContext.jsx` | Nove klice | Maly |
| Dokumentace | Aktualizace | Maly |

---

## Poznamky

- **DULEZITE:** AdminPricing je 3173 radku — NEPRESOVAT refactoring do Beta
- **TIP:** Zmeny v materialech se okamzite projeji v kalkulacce (pres tenant storage)
- **TIP:** Preview Sandbox je nejlepsi zpusob jak testovat ceny

---

## Kriticke doplnky (z review)

### Refactoring plan pro 3173-radkovy monolith (post-Beta)
- [ ] Navrzene rozdeleni:
  ```
  src/pages/admin/pricing/
    AdminPricing.jsx          — tab router, sdileny state (~100 radku)
    MaterialsTab.jsx          — CRUD materialu + barvy (~800 radku)
    TimePricingTab.jsx        — cena za hodinu (~200 radku)
    MarkupRulesTab.jsx        — markup pravidla (~300 radku)
    VolumeDiscountsTab.jsx    — discount tiers (~400 radku)
    PreviewSandboxTab.jsx     — testovaci prostredi (~500 radku)
    hooks/usePricingState.js  — sdileny state hook (~200 radku)
    components/               — sdilene sub-komponenty (ColorPicker, MaterialForm atd.)
  ```
- [ ] Sdileny stav: `pricingConfig`, `materials`, `fees` musi zustat v parent nebo v custom hooku
- [ ] Kazdy tab je lazy-loaded (React.lazy) — zrychli prvni render

### Material import/export (post-Beta)
- [ ] Export materialu do JSON/CSV (pro backup nebo sdileni)
- [ ] Import materialu z JSON/CSV (pro obnovu nebo kopirovani z jineho tenantu)
- [ ] Template materialu — preddefinovane sady (PLA, PETG, ABS, ASA, Nylon, TPU)
