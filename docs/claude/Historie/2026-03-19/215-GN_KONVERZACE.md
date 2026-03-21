# 215-GN — KONVERZACE — General (BETA Infrastruktura) — 2026-03-19

## Metadata
- **ID:** 215-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General — BETA infrastrukturni rozhodnuti
- **Souvisejici ID:** 216-GN

---

## Tema session

Uzivatel se ptal co je potreba pro BETA verzi. Diskutovaly se infrastrukturni volby pro deployment — backend, file storage, databaze. Padla klicova rozhodnuti o architekture: Cloud Run, Cloudflare R2, Supabase.

---

## Prubeh konverzace

### [1] Uzivatel
> Uzivatel se ptal co je potreba pro BETA verzi projektu ModelPricer.

### [1] Claude
**Shrnuti odpovedi:**
- Odkaz na Beta Readiness Audit z 2026-03-16 (plan v `docs/claude/PLANS/beta-readiness-audit-2026-03-16.md`)
- Identifikovano 7 P0 blokeru pro BETA
- Hlavni blokery: backend deployment, localStorage->Supabase migrace, email mock, auth mismatch, Stripe, cloud storage, .env bug

**Soubory zminene:**
- `docs/claude/PLANS/beta-readiness-audit-2026-03-16.md`

---

### [2] Uzivatel
> Diskuze o backend deployment — Cloud Run vs Windows VPS.

### [2] Claude
**Shrnuti odpovedi:**
- Porovnani Cloud Run vs Windows VPS
- Cloud Run vyhody: auto-scaling, pay-per-use, kontejnerizace, existujici plan
- Existujici plan v `docs/claude/PLANS/Cloude Run a Supabase implementace.md` (z 2026-02-14)
- Doporuceni: Cloud Run (4 CPU, 2 GB RAM pro slicer)

**Soubory zminene:**
- `docs/claude/PLANS/Cloude Run a Supabase implementace.md`

---

### [3] Uzivatel
> Diskuze o cloud storage pro 3D modely — jake moznosti existuji.

### [3] Claude
**Shrnuti odpovedi:**
- Porovnani: Supabase Storage vs Cloudflare R2 vs AWS S3 vs GCS
- Cenove porovnani pro 30 firem x 10 GB (300 GB celkem):
  - Supabase Storage: ~$30/mes + drahy egress ($0.09/GB)
  - Cloudflare R2: ~$4.50/mes + $0 egress (nulovy!)
  - AWS S3: ~$6.90/mes + $0.09/GB egress
  - GCS: ~$6.00/mes + $0.12/GB egress
- R2 je 6x levnejsi nez Supabase Storage a ma nulovy egress
- R2 je S3-kompatibilni (snadna migrace, existujici knihovny)
- Doporuceni: Cloudflare R2

---

### [4] Uzivatel
> Rozhodl se pro celkovou architekturu a zadal implementacni task.

### [4] Claude
**Shrnuti odpovedi:**
- Finalni architektura potvrzena:
  - Frontend: Firebase Hosting (beze zmeny)
  - API (lehke): Cloud Functions
  - Slicer (tezke): Cloud Run (4 CPU, 2 GB)
  - Files: Cloudflare R2 (models, gcode, branding)
  - DB: Supabase PostgreSQL (25 tabulek, 102 RLS politik)
- Plan: vytvorit master plan, aktualizovat existujici plany, implementovat infrastrukturu
- Pouzit MCP servery kde je to mozne (R2, Cloud Run, Stripe)

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Backend deployment: Google Cloud Run | Existujici plan z 2026-02-14, auto-scaling, pay-per-use, kontejnerizace pro PrusaSlicer | Spolecne |
| 2 | File storage: Cloudflare R2 | 6x levnejsi nez Supabase Storage, nulovy egress, S3-kompatibilni API | Spolecne |
| 3 | Databaze: Supabase PostgreSQL | Zustava beze zmeny — 25 tabulek, 102 RLS politik uz nasazeno | Spolecne |
| 4 | Frontend hosting: Firebase Hosting | Beze zmeny, overene reseni | Spolecne |
| 5 | Cloud Run spec: 4 CPU, 2 GB RAM | Dostatecne pro PrusaSlicer, skalovateline | Spolecne |

---

## Otevrene otazky

- [ ] Implementace master planu pro BETA infrastrukturu
- [ ] Aktualizace existujicich planu (Cloud Run plan z 2026-02-14)
- [ ] Integrace MCP serveru pro R2, Cloud Run, Stripe
- [ ] Stripe implementace pro platby

---

## Navaznost

- **Predchozi:** 213-GN, 214-GN (testovani projektu pred BETA)
- **Nasledujici:** zatim zadny (implementace infrastruktury)

---
