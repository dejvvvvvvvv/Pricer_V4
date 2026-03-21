# Cloudflare MCP Server — Setup Guide

Navod pro pripojeni Cloudflare MCP serveru do Claude Code.
Pouziva se pro spravu R2 bucketu, DNS a Workers primo z Claude Code.

---

## Prerekvizity

1. Cloudflare ucet (https://dash.cloudflare.com)
2. API Token s R2 opravnenimi
3. Claude Code (VS Code extension nebo CLI)

---

## Vytvoreni API tokenu

1. Jdi na https://dash.cloudflare.com/profile/api-tokens
2. Klikni **"Create Token"**
3. Pouzij template **"Custom Token"**
4. Permissions:
   - **Account > Workers R2 Storage > Edit**
   - **Account > Workers Scripts > Edit** (optional, pro Workers)
5. Account Resources: **Include > All accounts** (nebo konkretni ucet)
6. Klikni **"Continue to summary"** > **"Create Token"**
7. **Zkopiruj token** — zobrazi se jen jednou!

> **TIP:** Uloz token do bezpecneho spravce hesel (1Password, Bitwarden).
> Nikdy ho necommituj do Gitu.

---

## Pridani do Claude Code

### Varianta A: MCP config soubor (.mcp.json)

Pridej do `Model_Pricer-V2-main/.mcp.json` (soubor je gitignored):

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "npx",
      "args": ["mcp-remote", "https://bindings.mcp.cloudflare.com/sse"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}"
      }
    }
  }
}
```

Pak nastav env promennou:
```bash
# Windows (PowerShell)
$env:CLOUDFLARE_API_TOKEN = "tvuj-token-zde"

# Linux/Mac
export CLOUDFLARE_API_TOKEN="tvuj-token-zde"
```

### Varianta B: Claude Code CLI

```bash
claude mcp add cloudflare --transport sse "https://bindings.mcp.cloudflare.com/sse"
```

Po pridani restartuj Claude Code aby se MCP server pripojil.

### Varianta C: npx primo

```bash
npx @anthropic-ai/mcp-cloudflare@latest
```

Toto spusti interaktivniho pruvodce ktery te provede konfiguraci.

---

## Overeni pripojeni

Po restartu Claude Code over ze Cloudflare MCP server je pripojeny:
- V Claude Code by mel byt viditelny v seznamu aktivnich MCP serveru
- Zkus prikaz: "Vylistuj moje R2 buckety"

---

## Vytvoreni R2 bucketu

### Pres Claude Code (doporuceno)

Po pripojeni MCP serveru muzes vytvaret buckety primo z Claude Code:

```
"Vytvor R2 bucket 'modelpricer-files'"
"Nastav CORS na bucketu modelpricer-files pro domenu modelpricer.web.app"
```

### Manualni vytvoreni (zalozni postup)

1. Cloudflare Dashboard > **R2 Object Storage**
2. Klikni **Create Bucket**
3. Nazev: `modelpricer-files`
4. Location: **Automatic** (nebo Europe pro nizsi latenci z CR)
5. Po vytvoreni jdi do **Settings > CORS Policy**:

```json
[
  {
    "AllowedOrigins": [
      "https://tvoje-domena.web.app",
      "http://localhost:4028"
    ],
    "AllowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

> **DULEZITE:** Pridej `http://localhost:4028` pro lokalni vyvoj.
> V produkci pouzivej jen produkcni domenu.

---

## R2 API klice pro backend

Backend (Express server) pristupuje k R2 pres S3-kompatibilni API.
Potrebuje vlastni sadu API klicu (ne Cloudflare API Token).

1. Cloudflare Dashboard > **R2** > **Manage R2 API Tokens**
2. Klikni **Create API Token**
3. Permissions: **Object Read & Write**
4. Vyber bucket: `modelpricer-files` (nebo All buckets)
5. Klikni **Create API Token**
6. Zkopiruj tyto hodnoty:

| Hodnota | Env promenna | Kde |
|---------|-------------|-----|
| Access Key ID | `R2_ACCESS_KEY_ID` | `backend-local/.env` |
| Secret Access Key | `R2_ACCESS_KEY_SECRET` | `backend-local/.env` |
| Account ID (z URL dashboardu) | `R2_ACCOUNT_ID` | `backend-local/.env` |
| Bucket name | `R2_BUCKET_NAME` | `backend-local/.env` |

### Konfigurace v .env

Pridej do `backend-local/.env`:

```env
# === Cloudflare R2 Storage ===
STORAGE_PROVIDER=r2
R2_ACCESS_KEY_ID=tvuj-access-key-id
R2_ACCESS_KEY_SECRET=tvuj-secret-access-key
R2_ACCOUNT_ID=tvuj-account-id
R2_BUCKET_NAME=modelpricer-files
```

> **Pro lokalni vyvoj** ponech `STORAGE_PROVIDER=filesystem` (default).
> R2 pouzivej jen v produkci nebo pri testovani R2 integrace.

---

## Jak to funguje v projektu

### Storage Provider Factory

Projekt pouziva factory pattern pro storage — viz:
- `backend-local/src/storage/storageProviderFactory.js` — factory (filesystem vs r2)
- `backend-local/src/storage/providers/r2Provider.js` — R2 implementace (@aws-sdk/client-s3)
- `backend-local/src/storage/providers/filesystemProvider.js` — lokalni filesystem

```
STORAGE_PROVIDER=filesystem  →  FilesystemProvider (default, lokalni vyvoj)
STORAGE_PROVIDER=r2          →  R2Provider (produkce, Cloudflare R2)
```

### Potrebne npm packages

```bash
cd backend-local
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Overeni

### Test z backendu

```bash
# Nastav env promenne a spust test
STORAGE_PROVIDER=r2 node -e "
  import('./backend-local/src/storage/storageProviderFactory.js')
    .then(m => m.createStorageProviderAsync())
    .then(p => p.listFiles('test-tenant', ''))
    .then(console.log)
    .catch(console.error)
"
```

### Test z Claude Code (s Cloudflare MCP)

```
"Vylistuj obsah bucketu modelpricer-files"
"Nahraj testovaci soubor do modelpricer-files/test-tenant/test.txt"
```

---

## Troubleshooting

| Problem | Reseni |
|---------|--------|
| `AccessDenied` pri pristupu k bucketu | Over ze API token ma `Object Read & Write` permission |
| MCP server se nepripoji | Restartuj Claude Code, over CLOUDFLARE_API_TOKEN env |
| CORS chyba v prohlizeci | Over CORS policy na bucketu (AllowedOrigins) |
| `Cannot find module '@aws-sdk/client-s3'` | Spust `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` |
| `R2Provider requires async init` | Pouzij `createStorageProviderAsync()` misto `createStorageProvider()` |

---

## Bezpecnost

- **API Token** a **R2 API klice** NIKDY necommituj do Gitu
- Oba `.env` soubory jsou v `.gitignore`
- Pro CI/CD pouzij GitHub Secrets nebo Google Secret Manager
- R2 buckety pouzivej s tenant-scoped key prefix (`{tenantId}/...`)
- CORS policy omez na produkcni domeny (odeber `localhost` pred nasazenim)

---

## Reference

| Tema | Odkaz |
|------|-------|
| Cloudflare R2 docs | https://developers.cloudflare.com/r2/ |
| R2 S3 compatibility | https://developers.cloudflare.com/r2/api/s3/ |
| MCP Cloudflare | https://github.com/cloudflare/mcp-server-cloudflare |
| Storage Provider Factory | `backend-local/src/storage/storageProviderFactory.js` |
| R2 Provider | `backend-local/src/storage/providers/r2Provider.js` |
| MASTER plan | `docs/claude/PLANS/MASTER-BETA-INFRASTRUCTURE-PLAN.md` |
| MCP setup (obecny) | `docs/claude/MCP_SETUP_VSCODE.md` |

---

*Posledni aktualizace: 2026-03-19*
