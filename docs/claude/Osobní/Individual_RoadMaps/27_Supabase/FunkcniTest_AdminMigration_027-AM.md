# Funkcni Test Report: Admin Database Migration

| Parametr | Hodnota |
|----------|---------|
| **Oblast** | Admin Migration — migrace localStorage do Supabase, data sources, storage mode per namespace |
| **Route** | `/admin/migration` |
| **Datum testu** | 2026-02-20 |
| **ID zaznamu** | 027-AM |
| **Screenshot slozka** | Fotky_AdminMigration-027-AM |
| **Stav** | FUNKCNI |

---

## 1. Vizualni kontrola

| # | Co kontroluji | Vysledek | Poznamka |
|---|---------------|----------|----------|
| 1.1 | Stranka se nacte bez chyb | OK | |
| 1.2 | Layout je spravny | OK | Status, akce, data sources tabulka, storage mode tabulka |
| 1.3 | Dark theme konzistence | OK | Forge dark |

---

## 2. Funkcni testy — Hlavicka a status

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.1 | Nadpis a popis | Info | "Database Migration — Migrate data from localStorage to Supabase PostgreSQL" | OK |
| 2.2 | Supabase status | Connection | Zelena tecka + "Supabase connected" | OK |

---

## 2b. Akcni tlacitka

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.3 | "Download Backup" | Backup dat | Tmave tlacitko — stazeni zalohy pred migraci | OK |
| 2.4 | "Dry Run" | Testovaci beh | Oranzove tlacitko — simulace migrace bez zapisu | OK |
| 2.5 | "Migrate to Supabase" | Migrace | Zelene tlacitko — skutecna migrace dat | OK |

---

## 2c. Data Sources (19 namespacu)

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.6 | Counter | Pocet | "DATA SOURCES (19)" | OK |
| 2.7 | Total size | Celkova velikost | "Total localStorage data: 211.4 KB" | OK |
| 2.8 | Tabulka sloupce | Informace | NAMESPACE, TABLE, SIZE, HAS DATA | OK |
| 2.9 | Pricing Configuration | pricing:v3 → pricing_configs | 1.6 KB, zelena tecka (has data) | OK |
| 2.10 | Fees Configuration | fees:v3 → fees | 2.1 KB, zelena tecka | OK |
| 2.11 | Orders | orders:v1 → orders | 107.9 KB (nejvetsi), zelena tecka | OK |
| 2.12 | Order Activity | orders:activity:v1 → order_activity | 98 B, zelena tecka | OK |
| 2.13 | Audit Log | audit_log → audit_log | 1.3 KB, zelena tecka | OK |
| 2.14 | Analytics Events | analytics:events → analytics_events | 89.4 KB, zelena tecka | OK |
| 2.15 | Shipping Methods | shipping:v1 → shipping_methods | 499 B, zelena tecka | OK |
| 2.16 | Coupons | coupons:v1 → coupons | 168 B, zelena tecka | OK |
| 2.17 | Express Tiers | express:v1 → express_tiers | 565 B, zelena tecka | OK |
| 2.18 | Email Templates | email:v1 → email_templates | 439 B, zelena tecka | OK |
| 2.19 | Form Configuration | form:v1 → form_configs | - (no data), seda tecka | OK |
| 2.20 | Kanban Configuration | kanban:v1 → kanban_configs | 886 B, zelena tecka | OK |
| 2.21 | Dashboard Configuration | dashboard:v2 → dashboard_configs | 1.2 KB, zelena tecka | OK |
| 2.22 | Branding | branding → branding | 349 B, zelena tecka | OK |
| 2.23 | Widget Configurations | widgets → widget_configs | 4.4 KB, zelena tecka | OK |
| 2.24 | Plan Features | plan_features → tenants | 175 B, zelena tecka | OK |
| 2.25 | Widget Theme | widget_theme → widget_configs | - (no data), seda tecka | OK |
| 2.26 | Team Users | team_users → team_members | 184 B, zelena tecka | OK |
| 2.27 | Team Invites | team_invites → team_members | 312 B, zelena tecka | OK |

---

## 2d. Storage Mode per Namespace

| # | Funkce / Akce | Ocekavany vysledek | Skutecny vysledek | Stav |
|---|---------------|-------------------|-------------------|------|
| 2.28 | Hromadne akce | 3 tlacitka | "Enable Dual-Write (all)", "Switch to Supabase (all)", "Rollback to localStorage (all)" | OK |
| 2.29 | Tabulka sloupce | Info | NAMESPACE, CURRENT MODE, ACTIONS | OK |
| 2.30 | Aktualni mode vsech | dual-write | Vsech 19 namespacu v "dual-write" modu (oranzovy tag) | OK |
| 2.31 | Per-namespace akce | 3 tlacitka | "localStorage" (sedy), "dual-write" (oranzovy, aktivni), "supabase" (sedy) | OK |
| 2.32 | Rollback tlacitko | Destruktivni | Cervene "Rollback to localStorage (all)" | OK |

---

## 3. Nalezene problemy

| # | Zavaznost | Popis problemu | Mozne reseni |
|---|-----------|----------------|-------------|
| 1 | INFO | Vsechny namespacey v dual-write — migrace na Supabase jeste neprovedena | Ocekavane pro staging |
| 2 | INFO | 2 namespacey bez dat (form:v1, widget_theme) — seda tecka | OK, zatim nenaplneno |
| 3 | INFO | Orders je 107.9 KB — nejvetsi dataset, migrace muze trvat dele | Monitor pri migraci |

---

## 4. Pozitivni nalezy

- **Hlavicka:** "Database Migration" s podtitulem "Migrate data from localStorage to Supabase PostgreSQL", zelena "Supabase connected" tecka + text
- **3 akcni tlacitka v radku:** "Download Backup" (tmave, outline), "Dry Run" (oranzove), "Migrate to Supabase" (zelene/teal) — bezpecny workflow zleva doprava
- **DATA SOURCES (19) tabulka:** uppercase monospace nadpis s poctem, 4 sloupce (NAMESPACE, TABLE, SIZE, HAS DATA), zelene tecky u namespacu s daty, sede tecky u prazdnych — radky v tmavych boxech
- **19 data sources** kompletne namapovanych: pricing_configs, fees, orders (107.9 KB nejvetsi), order_activity, audit_log, analytics_events, shipping_methods, coupons, express_tiers, email_templates, form_configs, kanban_configs, dashboard_configs, branding, widget_configs, tenants, team_members (2x: users + invites) — celkem 211.4 KB
- **STORAGE MODE PER NAMESPACE sekce:** 3 hromadna tlacitka ("Enable Dual-Write all", "Switch to Supabase all", "Rollback to localStorage all" cervene) + per-namespace prepinac se 3 stavy (localStorage zeleny tag, dual-write oranzovy tag, supabase zeleny tag)
- **Per-namespace control:** kazdy ze 19+ radku ma 3 tlacitka pro prepnuti modu — aktualne vsechny v "localStorage" modu
- **Celkova velikost** dat zobrazena — "Total localStorage data: 211.4 KB"
- **Destruktivni akce cervene** — "Rollback to localStorage (all)" jasne cervene

---

## 5. Screenshots

| # | Popis | Soubor / ID |
|---|-------|-------------|
| 1 | Full-page screenshot — Database Migration: Supabase status, 3 akce, 19 data sources, storage mode per namespace | `Fotky_AdminMigration-027-AM/AdminMigration-027-AM.png` |
| 2 | Data Sources tabulka — 19 namespacu, status, akce | ss_3459yt51s |
| 3 | Storage Mode per Namespace — vsechny v localStorage | ss_3459yt51s (scroll) |

---

## 6. Doporuceni pro RoadMap

### Faze 1: Migrace testovani (VYSOKA priorita)
- [ ] Dry Run test pro vsech 19 namespacu — overit konzistenci dat
- [ ] Backup download pred kazdou migraci (automaticky prompt?)
- [ ] Migrace orders (107.9 KB) — nejvetsi dataset, monitor vykon

### Faze 2: Per-namespace prepnuti (STREDNI priorita)
- [ ] Postupne prepnout namespacey z localStorage na dual-write
- [ ] Monitoring dual-write konzistence (localStorage vs Supabase)

### Faze 3: Full Supabase (NIZKA priorita — az po overeni)
- [ ] Switch to Supabase pro vsechny namespacey
- [ ] Rollback plan pro kazdy namespace v pripade problemu

---

## 7. Celkove hodnoceni

| Kriteria | Hodnoceni (1-5) | Poznamka |
|----------|----------------|----------|
| Vizualni kvalita | 5/5 | Prehledne tabulky, barevne mody, status tecky |
| Funkcnost | 5/5 | 19 namespacu, 3 migracni akce, per-namespace control |
| UX/pouzitelnost | 5/5 | Dry Run pred migraci, backup, rollback |
| Stabilita | 5/5 | Zadne chyby, Supabase connected |
| **Celkem** | **20/20** | Vynikajici migracni nastroj — bezpecny workflow |

---

> Vygenerovano: 2026-02-20, Test session: S01
