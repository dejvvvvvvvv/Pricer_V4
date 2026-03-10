# 104-AG — KONVERZACE: Vsechny agenty na Opus 4.6

> **Datum:** 2026-03-09
> **Session:** S01
> **Oblast:** AG (Agents)
> **Souvisejici ID:** 102-PY, 103-PY (stejna session)

---

## Kontext

Uzivatel chtel zajistit, ze vsichni agenti kteri koduji (pisuji/edituji soubory) bezi na modelu Opus 4.6 pro maximalni kvalitu kodu. Kontrola odhalila 28 agentu na nizsi modely (Sonnet/Haiku).

---

## Uzivateluv pozadavek

1. "Zkontroluj zda vsichni agenti co koduji maji nastaveny model opus"
2. Po zjisteni vyjimek: "Ano, vsichni co koduji musi mit opus"

---

## Zjisteni

### Pred zmenou
- **81 agentu** uz bylo na Opus 4.6
- **20 agentu** bylo na Sonnet 4.5 (claude-sonnet-4-5-20250929)
- **8 agentu** bylo na Haiku 4.5 (claude-haiku-4-5-20251001)
- Celkem **107 agentu**

### Agenti prepnuti ze Sonnet na Opus (20)
- mp-spec-be-auth, mp-spec-be-pdf, mp-spec-be-queue, mp-spec-be-slicer
- mp-spec-be-email, mp-spec-be-upload, mp-spec-be-webhooks, mp-spec-be-websocket
- mp-spec-design-icons, mp-spec-design-user-friendly
- mp-spec-fe-animations, mp-spec-storage-branding
- mp-spec-docs-dev, mp-spec-docs-api
- mp-spec-plan-backend, mp-spec-plan-frontend, mp-spec-plan-product, mp-spec-plan-ux
- mp-spec-research-web, mp-spec-research-oss

### Agenti prepnuti z Haiku na Opus (8)
- mp-spec-fe-notifications, mp-spec-i18n-translations, mp-spec-i18n-currency
- mp-spec-i18n-dates, mp-spec-storage-tenant-id, mp-spec-test-browser
- mp-spec-security-api-keys, mp-spec-docs-historie

### Inline reference opraveny (4 soubory)
- mp-spec-test-e2e.md, mp-spec-security-upload.md, mp-spec-security-gdpr.md, mp-spec-test-unit.md

---

## Rozhodnuti

- Uzivatel rozhodl prepnout VSECHNY agenty (nejen kodujici) na Opus — jednodussi sprava, konzistentni kvalita
- Pred zmenou byla otazka zda jen aktivne pouzivane nebo vsechny — uzivatel zvolil vsechny

---

## Vysledek

- **107/107 agentu na claude-opus-4-6**
- Overeno: `grep` pro sonnet/haiku v `.claude/agents/` vraci 0 vysledku
- Zadne dalsi soubory zmeneny
