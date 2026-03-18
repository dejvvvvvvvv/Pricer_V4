# 214-GN — UPRAVY — Testování projektu (61 bugs dokumentovano) — 2026-03-18

## Metadata
- **ID:** 214-GN
- **Session:** S03
- **Datum:** 2026-03-18
- **Oblast:** General (testování)
- **Souvisejici ID:** 213-GN (KONVERZACE)
- **Trigger:** Komplexní testování všech stránek aplikace, detailní dokumentace bugs a problémů

---

## Souhrn uprav

Komprehenzivní testování 20 stránek (veřejné, auth, admin) za účelem identifikace bugs, problémů s i18n překlady a design konzistencí. Vytvořena detailní testovací dokumentace a seznam nalezených chyb. Celkem identifikováno 61 bugs v různých prioritách (1 P0, ~26 P1, ~23 P2, ~11 P3).

---

## Seznam upravenych souboru

| # | Soubor/Dokument | Typ zmeny | Obsah | Popis |
|---|-----------------|-----------|-------|-------|
| 1 | `docs/claude/Testing-2026-03-18/00-MASTER-Test-Overview.md` | Novy soubor | Master overview testování | Centrální index všech testovacích výsledků |
| 2 | `docs/claude/Testing-2026-03-18/01-Errors-And-Bugs.md` | Novy soubor | Tabulka 61 bugs | Detailní seznam všech nalezených chyb (Home, Pricing, Support, ModelUpload, Track, 404, Login, Register, Account, Invite, Dashboard, Pricing, Fees, Parameters, Presets, Express, Shipping, Coupons, Orders, Customers) |
| 3 | `docs/claude/Testing-2026-03-18/02-Correct-Behavior.md` | Novy soubor | Ověřené korektní chování | Stránky a funkce které pracují bez problémů (Express, Shipping, Customers - nejlépe otestovaná) |
| 4 | `docs/claude/Testing-2026-03-18/03-Design-Audit.md` | Novy soubor | Design konzistence | Audit designu, barvy, typografie, spacing, responsivnosti |
| 5 | `docs/claude/Testing-2026-03-18/04-Translation-Audit.md` | Novy soubor | i18n audit (CZ/EN) | Překlady chybějící, nesprávné, nebo nepřeložené prvky (Recommended badge, MODEL FEES, ORDER FEES, EMAIL label, atd.) |
| 6 | `docs/claude/Testing-2026-03-18/05-Cross-Function-Tests.md` | Novy soubor | Příprava cross-function testů | Načatok pro testování interakcí mezi stránkami (cart flow, payment flow, atd.) |
| 6 | `docs/claude/Testing-2026-03-18/06-Console-Errors.md` | Novy soubor | DevTools console analýza | Sbírka console errors, warnings a problémů ze všech stránek |
| 7 | `docs/claude/Fotky_Claude/Pricing_EN_CustomCustom_Duplication.png` | Novy soubor | Screenshot | Enterprise "Custom Custom" duplikace v Pricing page (EN) |
| 8 | `docs/claude/Fotky_Claude/Pricing_CZ_Recommended_NotTranslated.png` | Novy soubor | Screenshot | Recommended badge nenipřeloženo (CZ) |
| 9 | `docs/claude/Fotky_Claude/Pricing_CZ_i18n_Missing_Translations.png` | Novy soubor | Screenshot | Chybějící CZ překlady na Pricing page |
| 10 | `docs/claude/Fotky_Claude/Pricing_Footer_Privacy_404.png` | Novy soubor | Screenshot | Privacy link 404 v footeru |
| 11 | `docs/claude/Fotky_Claude/Pricing_Footer_Terms_404.png` | Novy soubor | Screenshot | Terms link 404 v footeru |
| 12 | `docs/claude/Fotky_Claude/ModelUpload_UploadModel_NotTranslated_CZ.png` | Novy soubor | Screenshot | "Upload Model" tlačítko nepřeloženo (CZ) |
| 13 | `docs/claude/Fotky_Claude/Track_ErrorMsg_NotTranslated_CZ.png` | Novy soubor | Screenshot | Chybová zpráva nepřeložena na Order Tracking (CZ) |
| 14 | `docs/claude/Fotky_Claude/404_Page_Overview_EN.png` | Novy soubor | Screenshot | 404 page design (EN) |
| 15 | `docs/claude/Fotky_Claude/Admin_Presets_TemplateValues_Empty.png` | Novy soubor | Screenshot | AdminPresets template hodnoty prázdné (P2 bug) |
| 16 | `docs/claude/Fotky_Claude/Admin_Presets_DeleteDialog_ScrollPosition.png` | Novy soubor | Screenshot | AdminPresets delete dialog off-viewport (P2 bug) |

---

## Detailni zmeny

### 1. Testovací dokumentace (7 souborů)

**Typ:** Novy soubor
**Umisteni:** docs/claude/Testing-2026-03-18/
**Duvod:** Zdokumentovat výsledky komplexního testování 20 stránek

**Popis obsahu:**

- **00-MASTER-Test-Overview.md** — centrální index, statistiky (20 stránek, 61 bugs, 10 screenshot), pokrytí 61%
- **01-Errors-And-Bugs.md** — tabulka s 61 bugs roztrídění podle stránky, priority (1 P0, ~26 P1, ~23 P2, ~11 P3) a typu (UI, i18n, funkce, design)
- **02-Correct-Behavior.md** — seznam stránek bez problémů (Express, Shipping, Customers — 100% OK)
- **03-Design-Audit.md** — audit barev, typografie, spacing, responsivity a designových prvků
- **04-Translation-Audit.md** — audit chybějících/nesprávných/nepřeložených i18n klíčů (30+ chyb v CZ)
- **05-Cross-Function-Tests.md** — příprava pro testování inter-page flow (zatím prázdný, pro další fázi)
- **06-Console-Errors.md** — DevTools console analýza, kategorisace runtime errors

---

### 2. Screenshot evidence (10 soborů)

**Typ:** Novy soubor
**Umisteni:** docs/claude/Fotky_Claude/
**Duvod:** Vizuální evidence nalezených bugs a problémů

**Evidence:**
- 3x Pricing page (Enterprise duplikace, Recommended badge, chybějící CZ překlady)
- 2x Footer issues (Privacy 404, Terms 404)
- 1x ModelUpload (button nepřeloženo)
- 1x Order Tracking (error message nepřeloženo)
- 1x 404 page (design overview)
- 2x AdminPresets (template values, dialog position)

---

## Dopad zmen

- **Ovlivnene komponenty:** Všechny stránky projektu (20 otestovaných, 13 zbývajících)
- **Breaking changes:** Ne — jedná se jen o dokumentaci chyb
- **Nove zavislosti:** Žádné
- **Rizika:**
  - P0 bug (Dashboard modal) je kritický — blokuje nové objednávky
  - i18n chyby ovlivňují UX v CZ (30+ klíčů)
  - Supabase RLS v AdminFees vyžaduje backend opravu

---

## Testovani

- **Scope:** 20/33 stránek (61% pokrytí)
- **Metoda:** Chrome MCP browser automation + manuální inspekce
- **Bugs:** 61 identifikováno (1 P0, ~26 P1, ~23 P2, ~11 P3)
- **Screenshot:** 10 ks evidence
- **Build:** N/A (testování bez změn kódu)
- **Poznamky:**
  - Zbývá 13 stránek (Payments, Branding, Widget, Emails, Integrations, Webhooks, Settings, Team, SystemHealth, ActivityLog, Migration, ModelStorage, test-kalkulacka, widget-kalkulacka)
  - Cross-function testy připraveny ale neprovedeny
  - Console errors zaznamenány pro Wave 34+ opravy

---
