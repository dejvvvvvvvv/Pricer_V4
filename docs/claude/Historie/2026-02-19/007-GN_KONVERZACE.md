# 007-GN — KONVERZACE — General (RoadMap + Order Processing Research) — 2026-02-19

## Metadata
- **ID:** 007-GN
- **Session:** S03
- **Datum:** 2026-02-19
- **Oblast:** General — RoadMap editace, order processing research
- **Souvisejici ID:** 008-GN

---

## Tema session

Rozsirovani RoadMap.md o Cloud Run, Supabase a domenu, nasledne research open-source order processing systemu a pridani doporuceni do RoadMap.md. Session pokracovala z predchozi (emoji fix dokoncen na zacatku).

---

## Prubeh konverzace

### [1] Uzivatel
> pridej do backendu a roadmapy jeste integraci Cloud Run ktery bude urceny pro Prusaslicer slicovani modelu a dokonceni plneho propojeni se Supabase, vice o tom se muzes dozvedet zde - docs/claude/PLANS/Cloude Run a Supabase implementace.md, Supabase propojeni take pridej i k jinym castem/sekcim kde je to potreba v Roadmape, take tam pridej jako jednu z poslednich casti ze musime zakoupit domenu modelpricer.com a .cz a propojit ji s nasim webem aby pri Beta verzi jsme pouzivali nasi vlastni domenu a nemuseli jsme pouzivat zdarma domenu z firebase hosting

### [1] Claude
**Shrnuti odpovedi:**
- Precetl Cloud Run & Supabase implementacni plan (411 radku)
- Precetl cely RoadMap.md (1387 radku)
- 12 editu v 5 davkach:
  - 3 nove radky v Hrube tabulce (#26 Cloud Run, #27 Supabase, #28 Vlastni domena)
  - 3 nove Tree sekce (26, 27, 28) s detailnimi pod-polozkami
  - Supabase reference pridany do existujicich sekci: PrusaSlicer (#2), Orders (#7), Model Storage (#14), Dashboard (#15), Auth (#20), Analytics (#21)
  - 3 nove Rozsahle detailni sekce (26, 27, 28)
  - Nova FAZE 0 v Beta Testing Roadmape (13 ukolu, 2-3 tydny)
  - Aktualizovany celkovy odhad: 7-11 -> 9-14 tydnu
  - 7 novych NUTNO DOPLNIT polozek (#14-20)
  - 3 polozky pridany do "Co MUSI byt v Beta"

**Akce provedene:**
- 12x Edit `docs/claude/Osobni/RoadMap.md`

**Soubory zminene:**
- `docs/claude/Osobni/RoadMap.md`
- `docs/claude/PLANS/Cloude Run a Supabase implementace.md`

---

### [2] Uzivatel
> nejsou nejake pluginy, extensions nebo nejake uz ready made open source Order processing projekty? neboli aby jsme to nemuseli cele programovat sami tak ze by jsme jako zaklad pouzili uz hotovy objednavkovy system a jen to doupravili aby to bylo spravne propojeno s celym nasim objednavkovym systemem co mame nyni i kdyz mama zatim jenom zaklad Zjsti zda neco takoveho znas nebo zda to najdes na internetu nebo v context7 a napis mi to zde, pokud najdes vice kandidatu nebo moznosti tak mi to zde vypis do chatu s Plusy a minusy a doporuc kterou moznost by jsme meli pouzit

### [2] Claude
**Shrnuti odpovedi:**
- Provedeny web searches pres Brave Search pro Medusa.js, Vendure, EverShop, Spurtcommerce
- Context7 search pro Medusa.js
- Prvni srovnani 5 moznosti s plusy/minusy
- Doporucena Varianta 4 (Stripe + Supabase + Resend) jako nejlepsi fit

**Akce provedene:**
- Brave Search queries (5+)
- Context7 resolve-library-id + query-docs

---

### [3] Uzivatel
> pouzivej agenty

### [3] Claude
**Shrnuti odpovedi:**
- Spusteny 3 paralelni agenti pro hlubsi research:
  - Agent 1: Medusa.js v2 — potvrzeno NENI vhodny, moduly nelze standalone, custom pricing je hack
  - Agent 2: Vendure + lightweight knihovny + Stripe — Vendure ma OrderItemPriceCalculationStrategy ale overkill, zadne standalone order npm balicky
  - Agent 3: GitHub search — nalezeny HiyoRi (165 hvezd), next-supabase-stripe-starter (749 hvezd), PizzaQL (709 hvezd, stalled)

**Akce provedene:**
- 3x Task (general-purpose agenti) — paralelni research

---

### [4] Uzivatel
> a pouzivej ten context7 pro zjiteni informaci o tech vecech pokud tam jsou

### [4] Claude
**Shrnuti odpovedi:**
- Context7 research (4 knihovny):
  - Stripe Node SDK: Payment Intents, Checkout Sessions, Webhook handling
  - Vendure: OrderItemPriceCalculationStrategy interface
  - Supabase: Edge Functions pro Stripe webhooky, Database Webhooks
  - stripe-sync-engine: TypeScript knihovna, auto-sync Stripe dat do PostgreSQL
- Finalni srovnani 6+ moznosti se vsemi nalezy
- Doporuceni: DIY s `stripe` + `resend` + Supabase (2-3 tydny)

**Akce provedene:**
- Context7 resolve-library-id + query-docs (8 volani)

---

### [5] Uzivatel
> pridej to doporuceni do RoadMap.md k sekci Stripe a order processing

### [5] Claude
**Shrnuti odpovedi:**
- Doporuceni pridano do 4 mist v RoadMap.md:
  1. Tree sekce 7 (radek 168) — kratka poznamka u Orders
  2. Tree sekce 8 (radek 178) — kompletni vysledek researche
  3. Detailni sekce 7.4 — rozsahly blok (zamitnuty platformy + 5-bodovy DIY pipeline)
  4. Detailni sekce 8.1-8.3 — Payment Intents technicke detaily, webhook varianty

**Akce provedene:**
- 4x Edit `docs/claude/Osobni/RoadMap.md`

**Soubory zminene:**
- `docs/claude/Osobni/RoadMap.md`

---

### [6] Uzivatel
> uloz historii podle popisu v claude.md

### [6] Claude
**Shrnuti odpovedi:**
- Vytvoreni historie zaznamu (tento soubor 007-GN + UPRAVY 008-GN)
- Aktualizace MASTER-HISTORIE.md a ID-REGISTRY.md

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Cloud Run, Supabase, Domena pridany do RoadMap.md | Uzivatel chtel vsechny planovane funkce v jednom dokumentu | Uzivatel |
| 2 | Zamitnuty plne ecommerce platformy (Medusa, Vendure, EverShop) | Dynamicke ceny z PrusaSliceru se neda namapovat na standardni SKU/varianty | Spolecne |
| 3 | DIY Stripe + Resend + Supabase jako doporuceny pristup | Nejmensi overhead (2-3 npm deps), zachova existujici kod, 2-3 tydny | Claude doporucil, uzivatel souhlasil |
| 4 | Payment Intents misto Checkout Sessions | Plna kontrola UI, dynamicke castky, podpora CZK | Claude doporucil |
| 5 | stripe-sync-engine jako volitelny doplnek | Auto-sync Stripe dat do PostgreSQL, neni kriticke pro Beta | Claude doporucil |
| 6 | Cloud Functions vs Supabase Edge Functions — obe varianty ponechany | Rozhodnuti odlozeno na implementaci — obe moznosti zdokumentovany | Spolecne |

---

## Otevrene otazky

- [ ] Stripe Connect vs jednoduche API klice — ktera varianta pro Beta?
- [ ] Cloud Functions vs Supabase Edge Functions pro Stripe webhook handler?
- [ ] Presny seznam .ini profilu pro PrusaSlicer (viz Cloud Run plan CAST 5)
- [ ] Registrace domeny modelpricer.com/.cz — u jakeho registratora?

---

## Navaznost

- **Predchozi:** 001-GN (S01 — Historie system setup)
- **Nasledujici:** zatim zadny

---

<!-- KONEC SOUBORU 007-GN_KONVERZACE.md -->
