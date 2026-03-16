# KONVERZACE — Finalizace Analytics planu (Session S06)

> Zaznam konverzace o finalizaci planu pro Admin Analytics s realnyma datama. Uzivatel odpovidal na 6 otazek o Analytics planu, padla klicova rozhodnuti o drag & drop, zakaznicich, scope.

---

## Hlavicka

**ID:** 204-AN
**Datum:** 2026-03-15
**Session:** S06
**Tema:** Finalizace Admin Analytics planu — odpovedi na otazky, rozhodnuti, plan ulozen
**Souvisejici:** 203-AN (analyza a planovani Analytics)

---

## Plna konverzace

### Uzivatel (zprava 1 — odpovedi na 6 otazek)

> Uzivatel odpovidal na 6 otazek o Analytics planu:
>
> 1. **Reset tlacitko** — uplyně odstranit
> 2. **Tab Orders** — realne objednavky zamerene na analytiku
> 3. **Grafy** — drag & drop system pro presuvani, resize, pridavani/odebirani grafu
> 4. **Top zakaznici** — identifikace podle emailu
> 5. **Summary karty** — period selector + "dnes" highlight
> 6. **Scope** — volnejsi, muze upravit i backend/tracking, ale MUSI overit ze nezpusobi chyby

Klicove citace uzivatele:
- "Chci aby se tam ukladaly jen realne aktualni data od toho specifickeho uctu"
- "Drag and drop system aby jsem si mohl zmenit polohu a velikost"
- "Podobne jako v dashboard — odebrat nebo pridat specificke grafy"
- "Podle emailu" (identifikace zakazniku)
- "Muzes upravit veci podle tveho uvazeni ale musis si dat pozor aby to nezpusobilo chyby"

### Claude (odpoved 1)

> Klicove body odpovedi:
> - Navrhl pouziti knihovny `react-grid-layout` (MIT, ~19k stars) pro drag & drop grid system
> - Layout persistence do localStorage pod klicem `analytics:dashboard-layout`
> - Katalog 10 grafu (6 existujicich + 4 nove) s moznosti pridavat/odebirat
> - Zakaznici identifikovani podle emailu (z objednavek)
> - Odhad implementace: 4-5 hodin
> - Plan ulozen do `docs/claude/PLANS/admin-analytics-real-data.md`

---

## Klicove rozhodovani

- **Rozhodnuti 1:** Reset tlacitko se UPLNE ODSTRANI — uzivatel ho nechce, nepovazuje za uzitecne
- **Rozhodnuti 2:** Drag & drop grid misto statickeho layoutu — uzivatel chce plnou kontrolu nad pozici a velikosti grafu, podobne jako v dashboard
- **Rozhodnuti 3:** Nova zavislost `react-grid-layout` (MIT, ~19k stars) — vybrana pro drag & drop, resize, a grid layout. Licencne OK (MIT = SAFE)
- **Rozhodnuti 4:** Zakaznici identifikovani podle emailu, ne podle jmena/ID — email je jednoznacny identifikator
- **Rozhodnuti 5:** Scope je volnejsi nez obvykle — Claude muze upravit i backend a tracking, ale MUSI overit ze zmeny nezpusobi chyby v jinych castech systemu
- **Rozhodnuti 6:** Layout persistence v localStorage pod `analytics:dashboard-layout` — konzistentni s existujicim tenant-scoped storage patternem

---

## Vyvody

Plan pro Admin Analytics s realnyma datama je kompletne finalizovan a ulozen v `docs/claude/PLANS/admin-analytics-real-data.md`. Klicova rozhodnuti:
- `react-grid-layout` pro drag & drop grid
- 10 grafu v katalogu (6 existujicich refaktorizovanych + 4 nove)
- Zakaznici identifikovani podle emailu
- Volnejsi scope vcetne backend uprav
- Odhad 4-5 hodin implementace

Dalsi krok: Implementace podle planu (Session S07+).
