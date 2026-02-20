# 008-GN — UPRAVY — RoadMap.md — 2026-02-19

## Metadata
- **ID:** 008-GN
- **Session:** S03
- **Datum:** 2026-02-19
- **Oblast:** General — RoadMap.md
- **Souvisejici ID:** 007-GN
- **Trigger:** Uzivatelske pozadavky: (1) pridani Cloud Run/Supabase/Domain do RoadMap, (2) pridani order processing doporuceni po researchi

---

## Souhrn uprav

RoadMap.md byl rozsiren o 3 nove hlavni sekce (Cloud Run, Supabase plne propojeni, Vlastni domena) a aktualizovan o doporuceni pro order processing (DIY Stripe + Resend misto plnych ecommerce platforem). Zmeny se dotkly hrube tabulky, tree pohledu, detailnich karticek, beta roadmapy a seznamu NUTNO DOPLNIT. Celkem 16 editu v jednom souboru.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | docs/claude/Osobni/RoadMap.md | Pridano | hruba tabulka | 3 radky (#26-28): Cloud Run, Supabase, Domena |
| 2 | docs/claude/Osobni/RoadMap.md | Zmeneno | tree sekce 2 | Cloud Run poznamka u PrusaSlicer |
| 3 | docs/claude/Osobni/RoadMap.md | Zmeneno | tree sekce 7 | Supabase databaze + order processing doporuceni |
| 4 | docs/claude/Osobni/RoadMap.md | Zmeneno | tree sekce 8 | Doporuceny pristup — kompletni vysledek researche |
| 5 | docs/claude/Osobni/RoadMap.md | Zmeneno | tree sekce 14 | Supabase Storage bucket poznamka |
| 6 | docs/claude/Osobni/RoadMap.md | Zmeneno | tree sekce 15 | Supabase Analytics poznamka |
| 7 | docs/claude/Osobni/RoadMap.md | Zmeneno | tree sekce 20 | Supabase RLS poznamka u Auth |
| 8 | docs/claude/Osobni/RoadMap.md | Zmeneno | tree sekce 21 | Supabase events poznamka u Analytics |
| 9 | docs/claude/Osobni/RoadMap.md | Pridano | tree sekce 26-28 | 3 nove tree sekce s pod-polozkami |
| 10 | docs/claude/Osobni/RoadMap.md | Pridano | detailni sekce 26 | Cloud Run karta (4 podsekce: Docker, Firebase proxy, Cloud Functions, Local) |
| 11 | docs/claude/Osobni/RoadMap.md | Pridano | detailni sekce 27 | Supabase karta (4 podsekce: Schema, FE client, BE client, Realtime) |
| 12 | docs/claude/Osobni/RoadMap.md | Pridano | detailni sekce 28 | Domena karta (2 podsekce: Registrace, DNS/Firebase) |
| 13 | docs/claude/Osobni/RoadMap.md | Zmeneno | detailni sekce 7.4 | Doporuceny pristup blockquote — zamitnuty Medusa/Vendure + 5-bodovy DIY pipeline |
| 14 | docs/claude/Osobni/RoadMap.md | Zmeneno | detailni sekce 8.1-8.3 | Technologicke rozhodnuti callout + Payment Intents detaily + webhook varianty |
| 15 | docs/claude/Osobni/RoadMap.md | Pridano | Beta Testing Roadmap | Nova FAZE 0 (13 ukolu, 2-3 tydny), celkovy odhad 9-14 tydnu |
| 16 | docs/claude/Osobni/RoadMap.md | Pridano | NUTNO DOPLNIT seznam | 7 novych polozek (#14-20) + 3 polozky v "Co MUSI" |

---

## Detailni zmeny

### 1. Hruba tabulka — 3 nove radky

**Typ:** Pridano
**Duvod:** Cloud Run, Supabase a Domena jsou kriticke oblasti pro Beta release

**Co se zmenilo:**
- #26: Cloud Run (PrusaSlicer backend) — stav 🔴 (0%), priorita KRITICKA
- #27: Supabase plne propojeni — stav 🟠 (25%), priorita KRITICKA
- #28: Vlastni domena (modelpricer.com/.cz) — stav 🔴 (0%), priorita VYSOKA

---

### 2. Tree sekce — Supabase reference v 6 existujicich sekcich

**Typ:** Zmeneno
**Duvod:** Supabase a Cloud Run ovlivnuji vice oblasti — nutne krizove reference

**Co se zmenilo:**
- Sekce 2 (PrusaSlicer): pridano "Backend bezi na Cloud Run (viz #26)"
- Sekce 7 (Orders): pridano "Supabase databaze" + "Doporuceny pristup: DIY"
- Sekce 8 (Stripe): pridan kompletni "Doporuceny pristup" blok (7 radku s emoji)
- Sekce 14 (Model Storage): pridano "Supabase Storage buckety"
- Sekce 15 (Dashboard): pridano "Supabase Analytics data"
- Sekce 20 (Auth): pridano "Supabase RLS"
- Sekce 21 (Analytics): pridano "Supabase events tabulka"

---

### 3. Tree sekce 8 — Order processing doporuceni

**Typ:** Pridano
**Duvod:** Vysledek researche 3 paralelnimi agenty + Context7

**Co se zmenilo:**
- Pridano 7 radku s kompletnim doporucenim:
  - ❌ Medusa.js, Vendure, EverShop — plne ecommerce platformy OVERKILL
  - ✅ DIY: `stripe` npm + `resend` npm + stavajici Supabase tabulky
  - 💡 Volitelne: `stripe-sync-engine` npm pro auto-sync
  - 💡 Alternativa: Supabase Edge Functions misto Cloud Functions
  - ⏱️ Odhad: 2-3 tydny vs 3-8 tydnu pro platformu

---

### 4. Detailni sekce 7.4 — Realny order processing

**Typ:** Zmeneno
**Duvod:** Pridani podrobneho vysvetleni proc platformy zamitnuty + konkretni doporuceny pristup

**Co se zmenilo:**
- Pridan blockquote s vysvetlenim:
  - Medusa.js: 50+ tabulek vlastni DB, moduly nelze standalone
  - Vendure: OrderItemPriceCalculationStrategy ale cely NestJS+GraphQL stack
  - Dynamicke ceny ze sliceru nelze namapovat na SKU/varianty
- 5-bodovy doporuceny DIY pipeline s konkretnimi npm balicky
- Odhad prace: 2-3 tydny, zavislosti: 2-3 npm balicky

---

### 5. Detailni sekce 8 — Stripe integrace

**Typ:** Zmeneno
**Duvod:** Aktualizace na zaklade technologickych zjisteni z Context7 researche

**Co se zmenilo:**
- Novy callout na zacatku sekce 8: "Payment Intents NE Checkout Sessions"
- Sekce 8.2 aktualizovana:
  - Pridana "Technicky pristup" podsekce
  - POST /api/create-payment-intent → vrati client_secret
  - Stripe Elements s client_secret
  - CZK v halerech (napr. 52500 = 525 Kc)
  - `@stripe/react-stripe-js` na frontendu
- Sekce 8.3 aktualizovana:
  - Pridana "Technicky pristup" podsekce
  - Varianta A: Cloud Functions (express.raw + constructEvent)
  - Varianta B: Supabase Edge Functions (Deno + constructEventAsync)
  - Konkretni eventy: payment_intent.succeeded, payment_failed, charge.refunded
  - Napojeni na Resend pro emaily

---

### 6. Beta Testing Roadmap — FAZE 0

**Typ:** Pridano
**Duvod:** Cloud Run, Supabase a Domena vyzaduji novou fazi na zacatku

**Co se zmenilo:**
- Nova FAZE 0 "Infrastruktura" s 13 ukoly ve 3 skupinach:
  - Cloud Run: Docker image, gcloud/docker instalace, deploy, Firebase proxy
  - Supabase: schema finalizace, migrace existujicich dat, RLS overeni
  - Domena: registrace, DNS, Firebase Hosting propojeni
- Odhad FAZE 0: 2-3 tydny
- Celkovy odhad projektu: 7-11 → 9-14 tydnu

---

### 7. NUTNO DOPLNIT a "Co MUSI" seznamy

**Typ:** Pridano
**Duvod:** Nove oblasti vyzaduji rozhodnuti od uzivatele

**Co se zmenilo:**
- 7 novych NUTNO DOPLNIT polozek (#14-20):
  - #14: Google Cloud Project ID a region
  - #15: Supabase Project URL
  - #16: Supabase klice (anon + service role)
  - #17: Firebase Project ID
  - #18: PrusaSlicer profily (.ini soubory)
  - #19: Registrace domeny — u koho?
  - #20: Domena — modelpricer.com, .cz, nebo jina?
- 3 polozky v "Co MUSI byt v Beta":
  - Cloud Run backend pro slicovani
  - Supabase jako primarni databaze
  - Vlastni domena (modelpricer.com/.cz)

---

## Dopad zmen

- **Ovlivnene komponenty:** Zadne — zmeny jen v dokumentaci (RoadMap.md v docs/claude/Osobni/)
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne (budouci plan: `stripe`, `resend`, volitelne `stripe-sync-engine`)
- **Rizika:** Zadna — cistě dokumentacni zmeny

---

## Testovani

- **Build:** N/A (dokumentacni zmeny)
- **Manual test:** Overeno grepem ze vsechny "Doporuceny pristup" reference na 3 mistech
- **Poznamky:** RoadMap.md narostl z ~1387 na ~1550+ radku

---

<!-- KONEC SOUBORU 008-GN_UPRAVY.md -->
