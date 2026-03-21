# 216-GN — OTAZKY A ODPOVEDI — General (BETA Infrastruktura) — 2026-03-19

## Metadata
- **ID:** 216-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General — BETA infrastrukturni rozhodnuti
- **Souvisejici ID:** 215-GN

---

## Kontext

Rozhodovani o infrastrukture pro BETA verzi ModelPricer. Resily se 3 klicove otazky: backend deployment, file storage a celkova architektura. Vychazelo se z Beta Readiness Auditu (7 P0 blokeru) a existujicich planu.

---

## Otazky a odpovedi

### Q1: Backend deployment — Cloud Run vs Windows VPS

- **Ptal se:** Claude (navrhl alternativy)
- **Otazka:** Jaky backend deployment zvolit pro PrusaSlicer? Cloud Run (kontejner, auto-scaling) vs Windows VPS (jednoduchy, ale fixni naklady)?
- **Odpoved:** Cloud Run — existujici plan z 2026-02-14, auto-scaling, pay-per-use, kontejnerizace umozni konzistentni prostredi pro PrusaSlicer
- **Rozhodnuti:** Google Cloud Run s 4 CPU a 2 GB RAM
- **Dopad:** Pouzije se existujici plan v `docs/claude/PLANS/Cloude Run a Supabase implementace.md`, nebude treba zacinat od nuly

---

### Q2: File storage — Cloudflare R2 vs Supabase Storage vs S3

- **Ptal se:** Claude (cenove porovnani)
- **Otazka:** Kam ukladat 3D modely, gcode a branding assety? Supabase Storage (integrovane) vs Cloudflare R2 (levne) vs AWS S3 (standard)?
- **Odpoved:** Cloudflare R2 — 6x levnejsi nez Supabase Storage, nulovy egress fee, S3-kompatibilni API
- **Rozhodnuti:** Cloudflare R2 pro vsechny soubory (models, gcode, branding)
- **Dopad:** Cenova uspora: ~$4.50/mes vs ~$30/mes pro 300 GB. S3-kompatibilni API znamena snadna integrace s existujicimi knihovnami (@aws-sdk/client-s3)

---

### Q3: Cenove porovnani pro 30 firem

- **Ptal se:** Claude (analyza)
- **Otazka:** Kolik bude stat storage pro 30 firem x 10 GB (300 GB celkem)?
- **Odpoved:** Detailni porovnani:
  - Supabase Storage 300 GB = ~$30/mes + $0.09/GB egress
  - Cloudflare R2 300 GB = ~$4.50/mes + $0 egress
  - AWS S3 300 GB = ~$6.90/mes + $0.09/GB egress
  - GCS 300 GB = ~$6.00/mes + $0.12/GB egress
- **Rozhodnuti:** R2 je jasna volba — nejlevnejsi a nulovy egress
- **Dopad:** Mesicni naklady na storage budou pod $5 misto $30+

---

### Q4: Celkova architektura BETA

- **Ptal se:** Uzivatel (potvrzeni)
- **Otazka:** Jak bude vypadat finalni architektura pro BETA?
- **Odpoved:** 5 vrstev:
  1. Frontend: Firebase Hosting (beze zmeny)
  2. API (lehke endpointy): Cloud Functions
  3. Slicer (tezke operace): Cloud Run (4 CPU, 2 GB)
  4. Files: Cloudflare R2 (models, gcode, branding)
  5. DB: Supabase PostgreSQL (25 tabulek, 102 RLS politik)
- **Rozhodnuti:** Tato architektura potvrzena pro implementaci
- **Dopad:** Master plan bude obsahovat implementacni kroky pro vsech 5 vrstev

---

### Q5: MCP servery pro implementaci

- **Ptal se:** Uzivatel (pozadavek)
- **Otazka:** Pouzivat MCP servery kde je to mozne?
- **Odpoved:** Ano — R2 (Cloudflare MCP), Cloud Run (GCP MCP), Stripe (Stripe MCP)
- **Rozhodnuti:** Maximalni vyuziti MCP serveru pro automatizaci
- **Dopad:** Rychlejsi implementace, mene manualnich kroku

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnuti | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | Backend deployment | Google Cloud Run (4 CPU, 2 GB) | Windows VPS (fixni naklady, jednoduche) | Q1 |
| 2 | File storage | Cloudflare R2 | Supabase Storage ($30/mes), AWS S3 ($6.90/mes), GCS ($6/mes) | Q2 |
| 3 | Databaze | Supabase PostgreSQL (beze zmeny) | Zadne — uz nasazeno | Q4 |
| 4 | Frontend hosting | Firebase Hosting (beze zmeny) | Zadne — overene | Q4 |
| 5 | Implementacni pristup | MCP servery kde mozne | Manualni CLI/konzole | Q5 |

---

## Nerozhodnute otazky

- [ ] Konkretni Dockerfile pro PrusaSlicer na Cloud Run
- [ ] R2 bucket struktura (per-tenant vs flat)
- [ ] Stripe produkty a cenove plany
- [ ] Migrace existujicich souboru z localStorage/local serveru do R2

---
