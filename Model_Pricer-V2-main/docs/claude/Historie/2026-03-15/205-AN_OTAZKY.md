# OTAZKY — Finalizace Admin Analytics planu (Session S06)

> Zaznam 6 otazek a odpovedi ohledne Admin Analytics planu. Vsechny otazky zodpovezeny, vsechna rozhodnuti padla.

---

## Hlavicka

**ID:** 205-AN
**Datum:** 2026-03-15
**Tema:** Admin Analytics — otazky k planu pro realna data
**Souvisejici:** 204-AN (konverzace), 203-AN (analyza a planovani)

---

## Q&A seznam

### Otazka 1: Reset tlacitko — zachovat, prejmenovat nebo odstranit?

**Odpoved:**
Uplyně odstranit. Uzivatel ho nepovazuje za uzitecne.

**Schvaleno:** Ano
**Rozhodnuti:** Reset tlacitko se KOMPLETNE ODSTRANI z Analytics stranky.

---

### Otazka 2: Tab Orders — co presne ma zobrazovat?

**Odpoved:**
Realne objednavky zamerene na analytiku. Uzivatel chce aby se tam ukladaly jen realne aktualni data od toho specifickeho uctu.

**Schvaleno:** Ano
**Rozhodnuti:** Orders tab bude zobrazovat realna data objednavek s analytickym pohledem (trendy, statistiky), ne surovy seznam.

---

### Otazka 3: Grafy — staticky layout nebo konfigurovatelny?

**Odpoved:**
Drag and drop system aby si uzivatel mohl zmenit polohu a velikost. Podobne jako v dashboard — odebrat nebo pridat specificke grafy.

**Schvaleno:** Ano
**Rozhodnuti:** Pouzit `react-grid-layout` (MIT, ~19k stars) pro drag & drop grid. Uzivatel muze menit pozici, velikost, pridavat a odebirat grafy z katalogu 10 grafu.

---

### Otazka 4: Top zakaznici — jak identifikovat zakazniky?

**Odpoved:**
Podle emailu.

**Schvaleno:** Ano
**Rozhodnuti:** Zakaznici budou identifikovani a agregovani podle emailove adresy z objednavek.

---

### Otazka 5: Summary karty — ma mit period selector a "dnes" highlight?

**Odpoved:**
Ano, period selector + "dnes" highlight.

**Schvaleno:** Ano
**Rozhodnuti:** Summary karty budou mit period selector (dnes, tyden, mesic, rok) s vizualnim zvyraznenim pro "dnes".

---

### Otazka 6: Scope — jak volny je scope pro zmeny?

**Odpoved:**
Volnejsi scope. Claude muze upravit veci podle sveho uvazeni ale musi si dat pozor aby to nezpusobilo chyby. Muze upravit i backend a tracking.

**Schvaleno:** Ano
**Rozhodnuti:** Scope zahrnuje frontend i backend zmeny. Claude muze upravovat dle uvazeni, ale MUSI overit ze zmeny nezpusobi regrese v jinych castech systemu.

---

## Shrnuti seznam rozhodnuti

- [x] Reset tlacitko — ODSTRANIT kompletne
- [x] Orders tab — realna data s analytickym pohledem
- [x] Grafy — drag & drop grid (`react-grid-layout`), resize, add/remove
- [x] Zakaznici — identifikace podle emailu
- [x] Summary karty — period selector + "dnes" highlight
- [x] Scope — volny vcetne backendu, ale s overenim regresi
