# KONVERZACE — 090-MCP

**ID:** 090-MCP
**Datum:** 2026-02-27
**Session:** S01
**Tema:** MCP Server Research & Installation (Firebase, GitHub, Stripe, Sentry, Vercel)

---

## Plna konverzace

### Uzivatel (zprava 1)

> pred chvilkou se nainstaloval supabase mcp a hodne to pomohlo. Takze chci aby jsi zjistil jake dalsi MCP servery nebo jine veci zde potrebujeme aby jsi mohl byt co nejvice produktivni. Jelikoz kdyby jsem zde nedal Supabase MCP tak bych vse musel udelat sam ale jelikoz to tu je tam jsi to tam mohl jednodusse nastavit ty sam. Tak tedy zjisti a napis mi co vsechno se nam zde hodi nebo potrebujeme aby jsi mohl vse efektivne nastavovat.

### Claude (odpoved 1)

Vytvořil jsem research plán pro 5 paralelních agentu, kteří budou zkoumat:
1. Firebase MCP (auth, Firestore, storage integration)
2. GitHub MCP (API access, issues, PR management)
3. Node/Testing MCPs (Vitest, Playwright, Jest runners)
4. Vercel/Hosting MCPs (deployment, monitoring, analytics)
5. 3D/Filesystem MCPs (STL/OBJ processing, local storage)

Zmínio jsem že research bude trvat 2-3 minuty a že vše bude dokumentováno v MEMORY.md.

### Uzivatel (zprava 2)

> pouzij vice agentu

### Claude (odpoved 2)

Potvrdil jsem, že už jsem plánoval 5 paralelních agentu, čekáme na výsledky...

### Uzivatel (zprava 3)

> zasedkl jsi se, tak ted proste pokracuj

### Claude (odpoved 3)

Pokračoval jsem a spustil I/O operace pro research. Čekal jsem na výsledky z agentu.

### Uzivatel (zprava 4) — Instalace P0 a P1

> ano chci aby jsi nainstaloval p0 a p1, a jak to nainstalujes tak mi napis co budeme delat dale a zda by jsme mohly hned prejit na ten vercel aby jsme to meli presunute a nedelalo to problemy pozdeji. Github Token - [PROVIDED]. A vercel ucet zatim jeste nemam

Claude se zeptal na detailní informace o Vercelu před instalací (cena, features, MCP capabilities, migration effort). Informoval uživatele, že GitHub token bude bezpečně uložen, a že bez Vercel účtu zatím nemůžeme nastavit OAuth.

**Rozhodnutí:** Instalace P0 + P1 se provede, ale Vercel bude vyžadovat uživatelem vytvořený účet pro OAuth konfiguraci.

### Uzivatel (zprava 5) — Detailní Vercel info

> instaluj vsechny P0 a P1. Ale prvne mi napis vice informaci o tom vercel, docela me to zaujalo ale chtel bych o tom vedet vice, a to i kolik to stoji atd.

### Claude (odpoved 5)

Poskytl jsem detailní Vercel analýzu:

**Pricing:**
- Hobby: $0 (max 3 Serverless, 100GB bandwidth/měsíc)
- Pro: $20/měsíc (unlimited Serverless, 1TB bandwidth, analytics)
- Enterprise: custom

**Srovnání s Firebase Hosting:**
- Firebase Hosting: $0.12/GB (statické, zadarmo pod 10GB)
- Vercel Pro: $20/měsíc flat + $1/GB overage (serverless, built-in CI/CD)

**MCP Capabilities:** OAuth integration pro read/write permissions na deployments, environments, analytics data.

**Migrace:** Express backend (backend-local) není kompatibilní s Vercel serverless (stateless, max 10s timeout). Řešení: frontend na Vercel, backend na Cloud Run / Fly.io.

### Uzivatel (zprava 6) — Finální schválení + Otázky

> (na konci chce aby se ulozila historie a ptal se:)
> 1. Backend na Ubuntu serveru — jak to zvladneme?
> 2. Cloud Run vs Fly.io pro PrusaSlicer backend?
> 3. Jak se nastavuje API proxy v Vercelu?
> 4. Kdy začít Vercel migraci?

---

## Klicove rozhodovani

- **P0 Instalace:** Firebase (stdio, nepx firebase-tools, --only firestore,auth), GitHub (stdio, npx @modelcontextprotocol/server-github, PAT token), Stripe (HTTP OAuth, https://mcp.stripe.com)

- **P1 Instalace:** Sentry (HTTP OAuth, https://mcp.sentry.dev/mcp), Vercel (HTTP OAuth, https://mcp.vercel.com)

- **P2 Deferred:** Cloudflare (edge computing), Docker (containerization) — zkouší se později

- **GitHub Account:** Osobní account uživatele (Hobby plan compatible, PAT token provided)

- **Vercel:** Zatím bez účtu — uživatel jej vytvoří, až bude chtít migrovat

- **Backend Separation:** Express backend zůstane samostatný (Cloud Run / Fly.io), frontend se migruje na Vercel

---

## Vyvody

Session S01 úspěšně:
- Identifikoval kritické MCP servery (P0/P1)
- Provedl paralelní research na 5 agenty
- Nainstaloval 5 nových MCP serverů do .mcp.json
- Aktualizoval .claude/settings.local.json s permissions
- Poskytl detailní Vercel analýzu
- Připravil architekturální plán (Vercel + Cloud Run / Fly.io)
- Uživatel se zeptal na 4 follow-up otázky (Ubuntu, Cloud Run vs Fly.io, API proxy, timeline)

**Zbyva:** Zodpovězení follow-up otázek, zahájení Vercel migrace (čeká na uživatelův účet), backend deployment plán.

**Status:** P0 + P1 instalovány, dokumentace v MEMORY.md, historiografie ukončena.
