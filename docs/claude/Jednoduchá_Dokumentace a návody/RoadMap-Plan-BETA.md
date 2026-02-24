# RoadMap Plan pro BETA — Jednoduchy prehled

> Tento plan ukazuje VSECHNO co je treba udelat aby sla spustit BETA verze.
> Auth Sprinty (viz druhy dokument) jsou SOUCAST tohoto planu — spadaji pod Fazi 3.

---

## Jak to na sebe navazuje

```
Faze 0 --> Faze 1 --> Faze 2 --> Faze 3 --> Faze 4 --> BETA LAUNCH!
Server    Kalkulacka  Platby    Bezpecnost  Emaily
```

Nektere veci jdou delat paralelne (soucasne), ale zakladni poradi je toto.

---

## Faze 0 — Server a databaze ❌ NEZACATO

**Jednoduche vysvetleni:** Presunout backend z tveho pocitace do cloudu aby to fungovalo pro vsechny.

**Co se bude delat:**
- Google Cloud Run — PrusaSlicer bezi v cloudu (ne na tvem PC)
- Supabase databaze — data v realne databazi (ne jen v prohlizeci)
- Vlastni domena — modelpricer.com misto firebase URL

**Casovy odhad:** 2-3 tydny
**Proc je to dulezite:** Bez tohoto muze aplikaci pouzivat jen ty na svem pocitaci.

---

## Faze 1 — Kalkulacka a integrace ❌ NEZACATO (pripraveno)

**Jednoduche vysvetleni:** Propojit komponenty ktere uz existuji ale nejsou zapojene do kalkulacky.

**Co se bude delat:**
- Doprava — vyber zpusobu doruceni v kalkulacce
- Express — priplatek za rychlejsi tisk
- Kupony — slevove kody
- Ochrana adminu — prihlaseni pro pristup do admin sekce
- Podpora 3MF souboru (krome STL)

**Casovy odhad:** 1-2 tydny
**Proc je to dulezite:** Zakaznik musi videt celkovou cenu vcetne dopravy a slev.

---

## Faze 2 — Platby (Stripe) ❌ NEZACATO

**Jednoduche vysvetleni:** Zakaznik muze zaplatit kartou, prevodem nebo na dobirku.

**Co se bude delat:**
- Stripe integrace — platba kartou primo na webu
- Bankovni prevod — zobrazeni udaju pro platbu
- Dobirka — moznost platby pri prevzeti
- Fakturacni udaje firmy v adminu (ICO, DIC, cislo uctu)
- Variabilni symbol pro kazdou objednavku

**Casovy odhad:** 2-3 tydny
**Proc je to dulezite:** Bez plateb neni byznys.

---

## Faze 3 — Bezpecnost a izolace uctu 🟡 CASTECNE

**Jednoduche vysvetleni:** Kazdy uzivatel vidi jen sva data. API je chranene.

**Co se bude delat:**
- F3.1: Firebase Admin na backendu ✅ (hotovo v Auth Sprint 1)
- F3.2: Overovani tokenu na vsech API ✅ (hotovo, ale ma bug)
- F3.3: Frontend posila token automaticky ✅ (hotovo pro apiClient, ne pro presetsApi)
- **F3.4: Tenant izolace — kazdy uzivatel dostane vlastni ID** ❌ NEZACATO
- F3.5: Role (admin/editor/ctenar) ❌ NEZACATO

**Casovy odhad:** 1-2 tydny (F3.1-F3.3 uz castecne hotove)
**Proc je to dulezite:** Bez tohoto vsichni uzivatele sdili stejna data. Firma A vidi nastaveni firmy B.

> **TOTO je ta izolace uctu** o ktere jsme mluvili. Je to ukol F3.4 v teto fazi.

---

## Faze 4 — Emaily ❌ NEZACATO (admin UI existuje)

**Jednoduche vysvetleni:** Zakaznik dostane email kdyz si objedna a kdyz se zmeni stav objednavky.

**Co se bude delat:**
- Email sluzba (Resend nebo SendGrid)
- HTML sablona pro potvrzeni objednavky
- Automaticky email pri vytvoreni objednavky
- Automaticky email pri zmene stavu (zpracovava se → odeslano → doruceno)

**Casovy odhad:** 1 tyden
**Proc je to dulezite:** Zakaznik musi vedet ze jeho objednavka prosla.

---

## Celkovy stav

| Faze | Nazev | Stav | Odhad |
|------|-------|------|-------|
| **0** | Server a databaze | ❌ Nezacato | 2-3 tydny |
| **1** | Kalkulacka a integrace | ❌ Nezacato (pripraveno) | 1-2 tydny |
| **2** | Platby (Stripe) | ❌ Nezacato | 2-3 tydny |
| **3** | Bezpecnost a izolace | 🟡 Castecne (F3.1-F3.3) | 1-2 tydny |
| **4** | Emaily | ❌ Nezacato (UI hotove) | 1 tyden |

**Celkem do BETA:** cca 7-11 tydnu (pri praci 4h/den)
**Nebo:** cca 3-5 tydnu (full-time)

---

## Blokujici veci — Bez techto BETA NEJDE spustit

| # | Co | Proc | Kde v planu |
|---|-----|------|-------------|
| 1 | Ochrana admin sekce | Kdokoliv muze jit do /admin | Faze 1 |
| 2 | API overovani | Backend nema zadne zabezpeceni | Faze 3 |
| 3 | Izolace uctu | Vsichni sdili stejna data | Faze 3 (F3.4) |
| 4 | Cloud Run deploy | PrusaSlicer bezi jen na tvem PC | Faze 0 |
| 5 | Bezpecnost .env | API klice mozna v gitu | Faze 0 |

---

## Co uz je HOTOVE (pred temito fazemi)

- ✅ Kalkulacka funguje (zakladni verze)
- ✅ Admin panel (20+ stranek)
- ✅ Pricing engine V3 (deterministicky, volume discounts)
- ✅ Widget builder + embed
- ✅ Checkout flow (5-step wizard)
- ✅ Forge Design System (tmavy theme)
- ✅ Auth Sprint 1 (prihlaseni, registrace, Google tlacitko)
- ✅ Shopify integrace (Varianta A — client-side)
- ✅ Lokalizace CZ/EN (zakladni)
- ✅ 20 admin stranek otestovanych

---

## Kde jsou detailni technicke plany

Pokud chces videt technicky detail nekteho ukolu:
- Auth Sprinty: `docs/claude/Research/Auth/04-Implementation-Plan.md`
- Supabase migrace: `docs/claude/Planovane_Implementace/V3-S00c-database-migration-supabase.md`
- Kompletni RoadMap: `docs/claude/Osobni/RoadMap.md`
- Vsechny implementacni plany: `docs/claude/Planovane_Implementace/` (22 souboru)
