# 232-BK — UPRAVY — Backend — 2026-03-19

## Metadata
- **ID:** 232-BK
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** Backend (Config Routes — Storage Mode + Supabase Check)
- **Souvisejici ID:** 231-AS, 227-BK, 223-GN
- **Trigger:** Vlna 14 — Backend endpointy pro tenant-level storage configuration a Supabase connectivity check

---

## Souhrn uprav

Nove backend endpointy pro spravu storage modu na urovni tenanta — GET/POST storage-mode endpoint pro cteni a zapis aktualni konfigurace, Supabase connectivity check endpoint. Finalni build verify (frontend + backend PASS).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | backend-local/src/routes/config.js | Novy soubor / Zmeneno | cely soubor | Storage-mode GET/POST endpoint pro tenant-level konfiguraci |
| 2 | backend-local/src/routes/config.js | Novy soubor / Zmeneno | cely soubor | Supabase connectivity check endpoint |

---

## Detailni zmeny

### 1. Config Routes — Storage Mode Endpoint

**Typ:** Novy soubor nebo rozsireni existujiciho
**Radky:** cely soubor
**Duvod:** Frontend (AdminSettings) potrebuje backend API pro cteni a zapis storage modu

**Co se zmenilo:**
- GET /api/config/storage-mode — vrati aktualni storage mode pro daneho tenanta
- POST /api/config/storage-mode — nastavi novy storage mode (localStorage / dual-write / supabase)
- Tenant-scoped — kazdy tenant ma svuj vlastni storage mode
- Validace vstupu — pouze povolene hodnoty

---

### 2. Config Routes — Supabase Connectivity Check

**Typ:** Novy soubor nebo rozsireni existujiciho
**Radky:** cely soubor
**Duvod:** AdminSettings UI zobrazuje Supabase status — potrebuje backend endpoint pro overeni konektivity

**Co se zmenilo:**
- Endpoint pro overeni spojeni se Supabase
- Vraci boolean status (connected / disconnected)
- Pouzivano AdminSettings UI pro zobrazeni zeleneho/cerveneho badge

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminSettings (frontend consumer), backend index.js (mount point)
- **Breaking changes:** Ne — nove endpointy, zadne zmeny existujicich
- **Nove zavislosti:** Zadne
- **Rizika:** Minimalni — nove GET/POST endpointy, zpetne kompatibilni

---

## Testovani

- **Build:** Frontend PASS + Backend PASS
- **Manual test:** Finalni build verify cele session (14 vln)
- **Poznamky:** Toto je posledni vlna dnesni session

---
