# 217-GN — UPRAVY — General (Planovani) — 2026-03-19

## Metadata
- **ID:** 217-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General — Planovani a priprava
- **Souvisejici ID:** 215-GN, 216-GN, 218-BK
- **Trigger:** Vlna 2 — navazujici na infrastrukturni rozhodnuti z Vlny 1, tvorba master planu a aktualizace existujicich planu

---

## Souhrn uprav

Vytvoreni master planu pro BETA infrastrukturu (8 casti A-H, 6 fazi, 45-bodovy checklist), aktualizace existujiciho Cloud Run planu o nove technologie (R2, Resend, Sentry, pdfmake, CI/CD), a ulozeni referencni dokumentace do MEMORY.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | docs/claude/PLANS/MASTER-BETA-INFRASTRUCTURE-PLAN.md | Novy soubor | cele | Master plan — 8 casti (A-H), 6 fazi, 45 checklistu |
| 2 | docs/claude/PLANS/Cloude Run a Supabase implementace.md | Zmeneno | rozsireni | Pridano R2, Resend, Sentry, pdfmake, CI/CD sekce |
| 3 | project_beta_infrastructure.md (MEMORY) | Novy soubor | cele | Reference na infrastrukturni rozhodnuti a plany |
| 4 | reference_mcp_servers.md (MEMORY) | Novy soubor | cele | Reference na MCP servery pro implementaci |
| 5 | MEMORY.md | Zmeneno | doplneni | Aktualizovany o BETA infrastrukturni reference |

---

## Detailni zmeny

### 1. `docs/claude/PLANS/MASTER-BETA-INFRASTRUCTURE-PLAN.md`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Centralni plan pro celou BETA infrastrukturu — vsech 8 oblasti v jednom dokumentu

**Co se zmenilo:**
- Novy soubor — 8 casti: A (Cloud Run), B (Cloudflare R2), C (Email/Resend), D (PDF Faktury), E (Sentry), F (CI/CD), G (Firebase Hosting), H (Stripe)
- 6 fazi implementace s prioritami a zavislostmi
- 45-bodovy checklist pro sledovani postupu
- Risk register a dependencies matice

---

### 2. `docs/claude/PLANS/Cloude Run a Supabase implementace.md`

**Typ:** Zmeneno
**Radky:** rozsireni existujiciho planu
**Duvod:** Puvodni plan pokryval jen Cloud Run + Supabase, ted rozsireno o dalsich 5 technologii

**Co se zmenilo:**
- Pridana sekce Cloudflare R2 (storage provider abstrakce, presigned URLs)
- Pridana sekce Resend (email provider, sablony)
- Pridana sekce Sentry (error monitoring, source maps)
- Pridana sekce pdfmake (PDF faktury, QR platby)
- Pridana sekce CI/CD (GitHub Actions, deploy skripty)

---

### 3. `project_beta_infrastructure.md` (MEMORY)

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Perzistentni reference na infrastrukturni rozhodnuti pro budouci sessions

**Co se zmenilo:**
- Souhrn klicovych rozhodnuti z Vlny 1 a 2
- Linky na plany a dokumentaci
- Cenove odhady a architekturni diagram

---

### 4. `reference_mcp_servers.md` (MEMORY)

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Prehled MCP serveru potrebnych pro implementaci infrastruktury

**Co se zmenilo:**
- Seznam aktivnich MCP serveru (Firebase, GitHub, Stripe, Supabase, atd.)
- Mapovani MCP server -> infrastrukturni oblast

---

### 5. `MEMORY.md`

**Typ:** Zmeneno
**Radky:** doplneni novych referenci
**Duvod:** Aktualizace centralni pameti o BETA infrastrukturni plany

**Co se zmenilo:**
- Pridany reference na project_beta_infrastructure.md a reference_mcp_servers.md
- Aktualizovana sekce o planech

---

## Dopad zmen

- **Ovlivnene komponenty:** Zadne — pouze planovaci dokumentace
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne
- **Rizika:** Zadna — ciste planovaci faze

---

## Testovani

- **Build:** N/A (pouze dokumentace)
- **Manual test:** Overeny linky mezi plany
- **Poznamky:** Plan slouzi jako zaklad pro implementacni Vlnu 3

---
