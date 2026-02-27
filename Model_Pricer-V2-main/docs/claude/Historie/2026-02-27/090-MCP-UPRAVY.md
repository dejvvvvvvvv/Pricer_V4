# UPRAVY — 090-MCP

**ID:** 090-MCP
**Datum:** 2026-02-27
**Oblast:** Infrastructure (MCP Servers)
**Titulek:** MCP Server Installation (P0 + P1 — Firebase, GitHub, Stripe, Sentry, Vercel)

---

## Popis

Instalováno 5 nových MCP serverů do `.mcp.json` a aktualizovány permissions v `.claude/settings.local.json`. Servery poskytují přístup k Firebase Admin API, GitHub API, Stripe API, Sentry API a Vercel API — umožňují Claude autonomně konfigurovat infrastrukturu bez manuálního nastavování.

---

## Soubory a zmeny

### 1. `Model_Pricer-V2-main/.mcp.json`

**Zmeny:**
- Přidán Firebase MCP server (stdio, npx firebase-tools, --only firestore,auth)
- Přidán GitHub MCP server (stdio, npx @modelcontextprotocol/server-github, auth token)
- Přidán Stripe MCP server (HTTP OAuth, https://mcp.stripe.com)
- Přidán Sentry MCP server (HTTP OAuth, https://mcp.sentry.dev/mcp)
- Přidán Vercel MCP server (HTTP OAuth, https://mcp.vercel.com)

**Duvod:** Rozšíření autonomie Claude pro infrastrukturní tasky (Firebase schema, GitHub issue management, payment processing, error monitoring, deployment automation).

---

### 2. `.claude/settings.local.json`

**Zmeny:**
- Přidán wildcard permission pro Firebase MCP ("*")
- Přidán wildcard permission pro GitHub MCP ("*")
- Přidán wildcard permission pro Stripe MCP ("*")
- Přidán wildcard permission pro Sentry MCP ("*")
- Přidán wildcard permission pro Vercel MCP ("*")
- Přidáno `enabledMcpjsonServers: ["firebase", "github", "stripe", "sentry", "vercel", ...]`

**Duvod:** Povolení Claude přístupu k novým MCP serverům pro všechny operace (read/write/delete).

---

### 3. `MEMORY.md` (auto-memory)

**Zmeny:**
- Přidána sekce `## MCP Servery (2026-02-27)`
  - Firebase: Firestore read/write, Auth Admin API
  - GitHub: Repository management, issues, PRs, API access
  - Stripe: Payment processing, customer management, webhook handling
  - Sentry: Error monitoring, releases, performance tracking
  - Vercel: Deployment automation, environment variables, analytics

**Duvod:** Dokumentace nově instalovaných MCP serverů pro referenci v budoucích konverzacích.

---

## Shrnuty seznam

- [x] Firebase MCP nainstalován a konfigurován
- [x] GitHub MCP nainstalován s PAT tokenem
- [x] Stripe MCP nainstalován (HTTP OAuth)
- [x] Sentry MCP nainstalován (HTTP OAuth)
- [x] Vercel MCP nainstalován (HTTP OAuth)
- [x] Permissions aktualizovány v settings.local.json
- [x] MEMORY.md aktualizován
- [x] Detailní Vercel analýza dokumentována (cena, features, migrace)

---

## Poznamky

**P0 instalace (3 servery):**
- Firebase: Nutný pro Firestore schema a Auth Admin operace
- GitHub: Nutný pro issue management a PR automation
- Stripe: Nutný pro payment processing (budoucí feature)

**P1 instalace (2 servery):**
- Sentry: Pro error monitoring a analytics
- Vercel: Pro deployment automation a CD/CD pipeline

**P2 deferred (2 servery):**
- Cloudflare: Edge computing, DDoS protection (zkouší se později)
- Docker: Containerization (zkouší se později)

**GitHub Account:** Osobní account uživatele (Hobby plan compatible), GitHub PAT token uložen bezpečně.

**Vercel Account:** Zatím nevytvořen — OAuth konfiguraci bude mít až uživatel vytvoří a conectuje svůj účet.

**Backend Architecture:**
- Frontend (React): Vercel (serverless)
- Backend (Express + PrusaSlicer): Cloud Run / Fly.io (containerized, long-running processes)
- API Gateway: Vercel rewrites proxy → Cloud Run / Fly.io

**Follow-up otázky od uživatele (zjišťuje se v příští session):**
1. Backend na Ubuntu serveru — jak to zvladneme?
2. Cloud Run vs Fly.io pro PrusaSlicer backend?
3. Jak se nastavuje API proxy v Vercelu?
4. Kdy začít Vercel migraci?

**Bezpečnost:** Všechny OAuth tokeny a PAT tokeny uloženy v `.env` (NIKDY necommitovat do git). Firebase credentials uloženy v service account JSON (NIKDY v repo).
