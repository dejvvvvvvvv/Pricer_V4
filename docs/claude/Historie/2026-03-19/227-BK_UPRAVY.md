# 227-BK — UPRAVY — Backend (Vlna 10) — 2026-03-19

## Metadata
- **ID:** 227-BK
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** Backend (Env Validator)
- **Souvisejici ID:** 218-BK (Vlna 3 backend infrastruktura), 223-GN (Vlna 7 BETA Checklist), 226-AD (Vlna 10 Setup Wizard)
- **Trigger:** Vlna 10 BETA infrastruktura — Env Validator pro backend startup aby uzivatel jasne videl ktere promenne chybi

---

## Souhrn uprav

Novy envValidator.js modul pro backend ktery pri startu serveru validuje vsechny potrebne environment promenne. Rozdeleno do 7 feature groups (Core, Firebase, Supabase, Stripe, Resend, Sentry, Storage) s celkem 16 promennymi. Vystup v ASCII box formatu do konzole. V produkci pri chybejicich REQUIRED promennych ukonci proces.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | backend-local/src/util/envValidator.js | Novy soubor | cely soubor | validateEnvironment() — 7 feature groups, 16 vars, ASCII box output |
| 2 | backend-local/src/index.js | Zmeneno | import sekce + startup | Import envValidator + volani validace pri startu serveru |

---

## Detailni zmeny

### 1. `backend-local/src/util/envValidator.js`

**Typ:** Novy soubor
**Radky:** cely soubor
**Duvod:** Prevence startu serveru s chybejici konfiguraci

**Co se zmenilo:**
- Funkce validateEnvironment() exportovana jako default
- 7 feature groups s prioritami:
  - Core (PORT, NODE_ENV) — REQUIRED
  - Firebase (FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT) — REQUIRED
  - Supabase (SUPABASE_URL, SUPABASE_SERVICE_KEY) — REQUIRED
  - Stripe (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) — OPTIONAL
  - Resend (RESEND_API_KEY, RESEND_FROM_EMAIL) — OPTIONAL
  - Sentry (SENTRY_DSN) — OPTIONAL
  - Storage (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) — OPTIONAL
- ASCII box output do konzole s color-coded statusy
- V produkci (NODE_ENV=production): exit(1) pri chybejicich REQUIRED promennych
- V development: jen varování (console.warn)
- Celkem 16 environment promennych kontrolovano

---

### 2. `backend-local/src/index.js`

**Typ:** Zmeneno
**Radky:** import sekce + startup blok
**Duvod:** Napojeni env validace na startup procesu

**Co se zmenilo:**
- Pridan import envValidator na zacatek souboru
- Volani validateEnvironment() pred inicializaci serveru
- V produkci: pokud validace selze na REQUIRED promennych, server se nespusti (process.exit(1))
- V development: server se spusti i s chybejicimi promennymi (jen warning)

---

## Dopad zmen

- **Ovlivnene komponenty:** Backend startup process
- **Breaking changes:** Potencialne v produkci — server se nespusti bez REQUIRED .env promennych
- **Nove zavislosti:** Zadne
- **Rizika:** V development neni blocking, v produkci muze zabranit startu pokud .env neni kompletni

---

## Testovani

- **Build:** Backend syntax check — PASS
- **Manual test:** Overeni ze server startuje s existujicimi .env promennymi
- **Poznamky:** ASCII box output vizualne zkontrolovan v konzoli

---
