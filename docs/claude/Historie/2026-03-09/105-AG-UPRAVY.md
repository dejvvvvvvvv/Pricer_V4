# 105-AG — UPRAVY: Vsechny agenty na Opus 4.6

> **Datum:** 2026-03-09
> **Session:** S01
> **Oblast:** AG (Agents)
> **Souvisejici ID:** 104-AG

---

## Zmenene soubory (28 agent definic)

### Ze Sonnet 4.5 na Opus 4.6 (radek 5: `model:`)

| # | Soubor | Puvodni model |
|---|--------|---------------|
| 1 | `.claude/agents/mp-spec-be-auth.md` | claude-sonnet-4-5-20250929 |
| 2 | `.claude/agents/mp-spec-be-pdf.md` | claude-sonnet-4-5-20250929 |
| 3 | `.claude/agents/mp-spec-be-queue.md` | claude-sonnet-4-5-20250929 |
| 4 | `.claude/agents/mp-spec-be-slicer.md` | claude-sonnet-4-5-20250929 |
| 5 | `.claude/agents/mp-spec-be-email.md` | claude-sonnet-4-5-20250929 |
| 6 | `.claude/agents/mp-spec-be-upload.md` | claude-sonnet-4-5-20250929 |
| 7 | `.claude/agents/mp-spec-be-webhooks.md` | claude-sonnet-4-5-20250929 |
| 8 | `.claude/agents/mp-spec-be-websocket.md` | claude-sonnet-4-5-20250929 |
| 9 | `.claude/agents/mp-spec-design-icons.md` | claude-sonnet-4-5-20250929 |
| 10 | `.claude/agents/mp-spec-design-user-friendly.md` | claude-sonnet-4-5-20250929 |
| 11 | `.claude/agents/mp-spec-fe-animations.md` | claude-sonnet-4-5-20250929 |
| 12 | `.claude/agents/mp-spec-storage-branding.md` | claude-sonnet-4-5-20250929 |
| 13 | `.claude/agents/mp-spec-docs-dev.md` | claude-sonnet-4-5-20250929 |
| 14 | `.claude/agents/mp-spec-docs-api.md` | claude-sonnet-4-5-20250929 |
| 15 | `.claude/agents/mp-spec-plan-backend.md` | claude-sonnet-4-5-20250929 |
| 16 | `.claude/agents/mp-spec-plan-frontend.md` | claude-sonnet-4-5-20250929 |
| 17 | `.claude/agents/mp-spec-plan-product.md` | claude-sonnet-4-5-20250929 |
| 18 | `.claude/agents/mp-spec-plan-ux.md` | claude-sonnet-4-5-20250929 |
| 19 | `.claude/agents/mp-spec-research-web.md` | claude-sonnet-4-5-20250929 |
| 20 | `.claude/agents/mp-spec-research-oss.md` | claude-sonnet-4-5-20250929 |

### Z Haiku 4.5 na Opus 4.6 (radek 5: `model:`)

| # | Soubor | Puvodni model |
|---|--------|---------------|
| 21 | `.claude/agents/mp-spec-fe-notifications.md` | claude-haiku-4-5-20251001 |
| 22 | `.claude/agents/mp-spec-i18n-translations.md` | claude-haiku-4-5-20251001 |
| 23 | `.claude/agents/mp-spec-i18n-currency.md` | claude-haiku-4-5-20251001 |
| 24 | `.claude/agents/mp-spec-i18n-dates.md` | claude-haiku-4-5-20251001 |
| 25 | `.claude/agents/mp-spec-storage-tenant-id.md` | claude-haiku-4-5-20251001 |
| 26 | `.claude/agents/mp-spec-test-browser.md` | claude-haiku-4-5-20251001 |
| 27 | `.claude/agents/mp-spec-security-api-keys.md` | claude-haiku-4-5-20251001 |
| 28 | `.claude/agents/mp-spec-docs-historie.md` | claude-haiku-4-5-20251001 |

### Inline reference opraveny (dalsi zmeny v tele souboru)

| # | Soubor | Typ zmeny |
|---|--------|-----------|
| 29 | `.claude/agents/mp-spec-test-e2e.md` | radek 332: `**Model**: claude-sonnet-4-5-20250929` → opus |
| 30 | `.claude/agents/mp-spec-security-upload.md` | radek 296: `**Model:** claude-sonnet-4-5-20250929` → opus |
| 31 | `.claude/agents/mp-spec-security-gdpr.md` | radek 22: `Model: **claude-sonnet-4-5-20250929**` → opus |
| 32 | `.claude/agents/mp-spec-test-unit.md` | radek 23: `**Model:** claude-sonnet-4-5-20250929` → opus |
| 33 | `.claude/agents/mp-spec-security-api-keys.md` | radek 18: `**Model:** claude-haiku-4-5-20251001` → opus |

---

## Metoda zmeny

- `sed -i 's/claude-sonnet-4-5-20250929/claude-opus-4-6/'` pro Sonnet soubory
- `sed -i 's/claude-haiku-4-5-20251001/claude-opus-4-6/'` pro Haiku soubory
- Globalni replace (`/g`) pro soubory s inline referencemi

## Overeni

- `grep 'claude-sonnet-4-5\|claude-haiku-4-5' .claude/agents/*.md` → **0 vysledku**
- Vsech 107 agentu nyni na `claude-opus-4-6`
