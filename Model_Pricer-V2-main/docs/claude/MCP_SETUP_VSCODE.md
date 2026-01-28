# MCP Setup ve VS Code (Claude Code) — krok za krokem (Windows)

Tento návod počítá s tím, že ovládáš Claude Code z terminálu ve VS Code.

---

## 1) Vlož soubory do rootu repa

V rootu repa máš mít:
- `.mcp.json`
- `.env.mcp.example`
- `scripts/load-mcp-env.ps1`
- `.claude/agents/*.md`
- `docs/claude/*`

Pokud máš `.claude/agents` prázdné, nejčastější důvod je, že jsi rozbalil ZIP do špatné složky.
Správně: rozbal do **rootu repa** (kde je `package.json`).

---

## 2) Vytvoř si `.env.mcp`

1) Zkopíruj `.env.mcp.example` → `.env.mcp`
2) Do `.env.mcp` doplň klíče (příklady):

```env
CONTEXT7_API_KEY=...
# volitelně
GITHUB_TOKEN=...
BRAVE_API_KEY=...
EXA_API_KEY=...
```

3) Přidej do `.gitignore` řádek:
```
.env.mcp
```

> Nikdy necommituj `.env.mcp`.

---

## 3) Kde získat API klíče (rychle)

- Context7 API key: dashboard / vytvoření API key (viz Context7 repo)
- GitHub token: GitHub Settings → Developer settings → Personal access tokens
- Brave API key: Brave Search API dashboard
- Exa API key: Exa dashboard

---

## 4) Načti `.env.mcp` do aktuálního terminálu (PowerShell)

V rootu repa:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\load-mcp-env.ps1
```

Tím se env proměnné nastaví **jen pro aktuální okno terminálu**.

---

## 5) Přidej MCP server (project scope)

Obecný pattern:

```powershell
claude mcp add --scope project <name> -- <command>
```

### Context7 (příklad přes npx)
```powershell
claude mcp add --scope project context7 -- npx -y @upstash/context7-mcp
```

Pokud Context7 vyžaduje klíč jako parametr, použij env (doporučeno) nebo dle jejich instrukcí.

### Brave Search (pokud máš MCP server pro Brave)
Záleží na konkrétním MCP serveru, který používáš (implementace se liší).
Doporučení: nejdřív použij Context7, Brave jen když je nutné — a loguj použití do `/docs/claude/BRAVE_USAGE_LOG.md`.

---

## 6) Ověř, že MCP běží

```powershell
claude mcp list
```

---

## 7) Ověř, že Claude vidí agenty

V Claude Code:
- příkaz `/agents`
- reload/refresh
- měl bys vidět `mp-*` agenty načtené z `.claude/agents`.

---

## 8) Troubleshooting (nejčastější)

1) **Agent folder je prázdný** → ZIP rozbalen mimo repo root.
2) **MCP list je prázdný** → přidal jsi server do user scope, ne project scope; nebo nenačetl env.
3) **401 / auth** → špatný API key v `.env.mcp` nebo nenahraný do terminálu.
