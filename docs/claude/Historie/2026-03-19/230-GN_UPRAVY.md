# 230-GN — UPRAVY — General (CORS + API Client) — 2026-03-19

## Metadata
- **ID:** 230-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General (Backend CORS + Frontend API Client)
- **Souvisejici ID:** 229-GN (Vlna 11), 221-GN (Vlna 5 API base URL)
- **Trigger:** Vlna 12 BETA infrastruktury — production-ready CORS konfigurace a robustni error handling v API klientu

---

## Souhrn uprav

Vlna 12 se zamerila na dve klicove oblasti pro production readiness: (1) CORS konfigurace backendu s rozlisenim dev vs production rezimu a specialni CORS pro widget endpointy, (2) rozsireni API klienta o detailni error handling s ceskymi zpravami a rozlisenim ruznych typů chyb (network, auth, rate limit, server).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | backend-local/src/index.js | Zmeneno | - | buildCorsConfig() funkce, dev vs production CORS, widget-specific CORS |
| 2 | src/lib/apiClient.js | Zmeneno | - | Response interceptor rozsiren o 5 error typu, ceske zpravy, isApiReachable() |

---

## Detailni zmeny

### 1. `backend-local/src/index.js`

**Typ:** Zmeneno
**Duvod:** Production backend musi mit striktni CORS — dev povoluje vse, production jen whitelist z CORS_ORIGINS env var. Widget endpointy maji specialni CORS bez credentials.

**Co se zmenilo:**
- Nova funkce `buildCorsConfig()` — centralizovana CORS konfigurace
- Dev rezim: `origin: true` (povoluje vse pro lokalni vyvoj)
- Production rezim: `origin` nacitany z `CORS_ORIGINS` env var (whitelist)
- Widget-specific CORS pro `/api/widget` endpointy: `credentials: false` (widget iframe nepotrebuje cookies)
- Oddeleni hlavniho CORS (s credentials) od widget CORS (bez credentials)

### 2. `src/lib/apiClient.js`

**Typ:** Zmeneno
**Duvod:** API klient potrebuje rozlisovat ruzne typy chyb a poskytovat srozumitelne ceske chybove zpravy pro uzivatele.

**Co se zmenilo:**
- Response interceptor rozsiren o 5 error typu:
  - `NETWORK_ERROR` — sit neni dostupna
  - `AUTH_EXPIRED` — 401 po refreshi tokenu
  - `FORBIDDEN` — 403 pristup odepren
  - `RATE_LIMITED` — 429 prilis mnoho pozadavku
  - `SERVER_ERROR` — 500+ interni chyba serveru
- Ceske chybove zpravy pro kazdy typ (napr. "Pripojeni k serveru selhalo. Zkontrolujte internetove pripojeni.")
- Nova utility funkce `isApiReachable()` — rychly health check zda je API dostupna

---

## Dopad zmen

- **Ovlivnene komponenty:** Vsechny API volani pres apiClient (cely frontend), vsechny backend endpointy (CORS)
- **Breaking changes:** Ne — zpetne kompatibilni, dev rezim se nemeni
- **Nove zavislosti:** Zadne
- **Rizika:** CORS_ORIGINS env var musi byt spravne nastaven v produkci, jinak budou vsechny requesty blokovany

---

## Testovani

- **Build:** Soucasti dalsi vlny
- **Manual test:** CORS konfigurace vyzaduje testovani v production prostredi
- **Poznamky:** Widget CORS (credentials:false) je dulezity pro iframe embed scenar

---
