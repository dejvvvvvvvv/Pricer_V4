# PLAN: Oprava screenshotů + Vylepšení FunkcníchTestů

> **Tento dokument je PROMPT + PLAN.** Zkopíruj celý obsah do nového chatu jako zadání.
> **Uloženo:** `docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md`

---

## PROMPT PRO NOVÝ CHAT (zkopíruj vše níže)

---

# ÚKOL: Projdi všech 20 testovaných stránek, poříď screenshoty, ulož je na disk, vylepši reporty, po každé fázi ulož historii a proveď /compact

---

## ════════════════════════════════════════════════════
## KRITICKÉ INSTRUKCE — PŘEČTI PŘED ZAČÁTKEM PRÁCE
## ════════════════════════════════════════════════════

### PRAVIDLO #1: SCREENSHOTY MUSÍ BÝT ULOŽENY NA DISK
- Screenshoty se MUSÍ uložit jako reálné soubory do složek `Fotky_*`
- Pouhé pořízení screenshotu přes Chrome MCP NESTAČÍ — musíš ho ULOŽIT NA DISK!
- Po každém screenshotu OVĚŘ přes `ls` že soubor skutečně existuje

### PRAVIDLO #2: HISTORIE SE UKLÁDÁ PO KAŽDÉ FÁZI PŘES SPECIFICKÉHO AGENTA
- Agent pro historii: **`mp-spec-docs-historie`** (Task tool, subagent_type: `mp-spec-docs-historie`)
- NESMÍŠ použít jiného agenta! Pouze `mp-spec-docs-historie`!
- Instrukce pro agenta viz jeho definice v `.claude/agents/mp-spec-docs-historie.md`

### PRAVIDLO #3: PŘESNÉ POŘADÍ KROKŮ V KAŽDÉ FÁZI (ŽÁDNÉ VÝJIMKY!)
```
┌─────────────────────────────────────────────────────┐
│  POŘADÍ KROKŮ V KAŽDÉ FÁZI:                        │
│                                                      │
│  1. PŘEČTI PLÁN pro tuto fázi (tento soubor!)       │
│  2. SCREENSHOTY — poříď a ulož na disk              │
│  3. VYLEPŠENÍ REPORTŮ — až PO uložení screenshotů   │
│  4. HISTORIE — spusť agenta mp-spec-docs-historie   │
│  5. OVĚŘ že historie byla uložena (ls + cat)        │
│  6. /compact — AŽ PO potvrzení uložení historie    │
│  7. POKRAČUJ na další fázi                          │
│                                                      │
│  ⚠ NIKDY nesmíš udělat /compact PŘED historií!      │
│  ⚠ NIKDY nesmíš přeskočit žádný krok!              │
│  ⚠ NIKDY nesmíš změnit pořadí kroků!               │
└─────────────────────────────────────────────────────┘
```

### PRAVIDLO #4: NA ZAČÁTKU KAŽDÉ FÁZE SI PŘEČTI PLÁN
- Před začátkem KAŽDÉ fáze si MUSÍŠ přečíst tento plán:
  ```
  Read tool: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
  ```
- Najdi v něm sekci pro aktuální fázi
- Přečti si VŠECHNY kroky včetně historie a /compact
- Teprve POTOM začni pracovat

---

## PREREQUISITES (zkontroluj před začátkem)

1. **Vite dev server běží** na portu 4028
2. **Chrome MCP připojené:** `mcp__claude-in-chrome__tabs_context_mcp`
3. **Nový tab:** `mcp__claude-in-chrome__tabs_create_mcp` → zapamatuj tabId

---

## BAZOVÁ CESTA

```
{ROADMAPS} = C:\Users\Kuňákovi\Downloads\Model_Pricer-V2-main_VariantaA_A_to_F_Integrated\docs\claude\Osobní\Individual_RoadMaps
```

---

## METODA PRO UKLÁDÁNÍ SCREENSHOTŮ

Pro KAŽDOU stránku:

```
Krok A: Navigace + Pořízení
  1. mcp__claude-in-chrome__navigate → URL, tabId
  2. mcp__claude-in-chrome__computer → action=wait, duration=2, tabId
  3. mcp__claude-in-chrome__gif_creator → action=start_recording, tabId
  4. mcp__claude-in-chrome__computer → action=screenshot, tabId
  5. Pokud scrollovatelná: scroll down → screenshot znovu (opakuj)
  6. mcp__claude-in-chrome__gif_creator → action=stop_recording, tabId
  7. mcp__claude-in-chrome__gif_creator → action=export, tabId, download=true, filename="{NAZEV}.gif"
  8. mcp__claude-in-chrome__gif_creator → action=clear, tabId

Krok B: Přesun do správné složky
  Bash: mv "C:/Users/Kuňákovi/Downloads/{NAZEV}.gif" "{CILOVA_SLOZKA}/"

Krok C: Ověření (POVINNÉ!)
  Bash: ls "{CILOVA_SLOZKA}/" → MUSÍŠ vidět soubor .gif
  Pokud soubor NENÍ — opakuj Krok A+B!
```

---

# ╔═══════════════════════════════════════════════════════════╗
# ║  FÁZE 1: Kalkulačka, Dashboard, Pricing, Fees, Presets   ║
# ╚═══════════════════════════════════════════════════════════╝

## ► FÁZE 1 — KROK 1: PŘEČTI PLÁN

**POVINNÉ!** Před začátkem Fáze 1 si přečti tento plán:
```
Read tool: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
```
Najdi sekci "FÁZE 1" a přečti si VŠECHNY kroky (1-6) včetně historie a /compact.

---

## ► FÁZE 1 — KROK 2: SCREENSHOTY (5 stránek)

### 1.1 Test Kalkulačka
- **Route:** `http://localhost:4028/test`
- **Název souboru:** `Kalkulacka-012-TK.gif`
- **Cílová složka:** `{ROADMAPS}/1_Kalkulacka/Fotky_Kalkulacka-012-TK/`
- **Co zachytit:** Step 1 wizard (upload zóna), sidebar menu, celou stránku
- **Ověření:** `ls "{ROADMAPS}/1_Kalkulacka/Fotky_Kalkulacka-012-TK/"` → MUSÍŠ vidět soubor

### 1.2 Admin Dashboard
- **Route:** `http://localhost:4028/admin/dashboard`
- **Název souboru:** `AdminDashboard-013-AD.gif`
- **Cílová složka:** `{ROADMAPS}/15_AdminDashboard/Fotky_AdminDashboard-013-AD/`
- **Co zachytit:** KPI karty nahoře, grafy uprostřed, seznamy dole (scrolluj!)
- **Ověření:** `ls "{ROADMAPS}/15_AdminDashboard/Fotky_AdminDashboard-013-AD/"` → MUSÍŠ vidět soubor

### 1.3 Admin Pricing
- **Route:** `http://localhost:4028/admin/pricing`
- **Název souboru:** `AdminPricing-014-AP.gif`
- **Cílová složka:** `{ROADMAPS}/4_AdminMaterialyCenotvorba/Fotky_AdminPricing-014-AP/`
- **Co zachytit:** Materiály tabulka, markup, volume discounts, cenový náhled (scrolluj!)
- **Ověření:** `ls "{ROADMAPS}/4_AdminMaterialyCenotvorba/Fotky_AdminPricing-014-AP/"` → MUSÍŠ vidět soubor

### 1.4 Admin Fees
- **Route:** `http://localhost:4028/admin/fees`
- **Název souboru:** `AdminFees-015-AF.gif`
- **Cílová složka:** `{ROADMAPS}/5_AdminPoplatkyFees/Fotky_AdminFees-015-AF/`
- **Co zachytit:** MODEL fees tabulka, ORDER fees tabulka, fee detail panel
- **Ověření:** `ls "{ROADMAPS}/5_AdminPoplatkyFees/Fotky_AdminFees-015-AF/"` → MUSÍŠ vidět soubor

### 1.5 Admin Presets
- **Route:** `http://localhost:4028/admin/presets`
- **Název souboru:** `AdminPresets-016-AX.gif`
- **Cílová složka:** `{ROADMAPS}/6_AdminPresety/Fotky_AdminPresety-016-AX/`
- **Co zachytit:** Preset seznam, detail panel, parametry
- **Ověření:** `ls "{ROADMAPS}/6_AdminPresety/Fotky_AdminPresety-016-AX/"` → MUSÍŠ vidět soubor

---

## ► FÁZE 1 — KROK 3: VYLEPŠENÍ REPORTŮ

**Až PO uložení VŠECH 5 screenshotů** vylepši tyto reporty:

| # | Report soubor | Plná cesta |
|---|--------------|-----------|
| 1 | FunkcniTest_Kalkulacka_012-TK.md | `{ROADMAPS}/1_Kalkulacka/FunkcniTest_Kalkulacka_012-TK.md` |
| 2 | FunkcniTest_AdminDashboard_013-AD.md | `{ROADMAPS}/15_AdminDashboard/FunkcniTest_AdminDashboard_013-AD.md` |
| 3 | FunkcniTest_AdminPricing_014-AP.md | `{ROADMAPS}/4_AdminMaterialyCenotvorba/FunkcniTest_AdminPricing_014-AP.md` |
| 4 | FunkcniTest_AdminFees_015-AF.md | `{ROADMAPS}/5_AdminPoplatkyFees/FunkcniTest_AdminFees_015-AF.md` |
| 5 | FunkcniTest_AdminPresety_016-AX.md | `{ROADMAPS}/6_AdminPresety/FunkcniTest_AdminPresety_016-AX.md` |

**Co vylepšit:**
- Přesnější popis rozložení stránky (layout, sloupce, pozice prvků)
- Konkrétní barvy, fonty, ikony které vidíš na screenshotu
- Rozšířit sekci pozitivních nálezů
- Přidat sekci "6. Doporučení pro RoadMap" pokud chybí
- Aktualizovat sekci Screenshots s názvem uloženého .gif souboru
- Zachovat stávající skóre — jen doplnit a vylepšit

---

## ► FÁZE 1 — KROK 4: ULOŽENÍ HISTORIE (POVINNÉ!)

**NESMÍŠ PŘESKOČIT! NESMÍŠ POKRAČOVAT NA /compact BEZ TOHOTO KROKU!**

Spusť **specifického agenta pro historii** — `mp-spec-docs-historie`:

```
Task tool:
  subagent_type: "mp-spec-docs-historie"
  description: "Ulozit historii Faze 1 screenshoty"
  prompt: |
    === HISTORIE SAVE REQUEST ===

    DATUM: {DNESNI-DATUM}
    SESSION: S01
    TYP TRIGGERU: auto-checkpoint

    --- UPRAVY ---
    SOUBOR: {ROADMAPS}/1_Kalkulacka/Fotky_Kalkulacka-012-TK/Kalkulacka-012-TK.gif | TYP: Pridano | POPIS: Screenshot kalkulacky
    SOUBOR: {ROADMAPS}/15_AdminDashboard/Fotky_AdminDashboard-013-AD/AdminDashboard-013-AD.gif | TYP: Pridano | POPIS: Screenshot dashboardu
    SOUBOR: {ROADMAPS}/4_AdminMaterialyCenotvorba/Fotky_AdminPricing-014-AP/AdminPricing-014-AP.gif | TYP: Pridano | POPIS: Screenshot pricing
    SOUBOR: {ROADMAPS}/5_AdminPoplatkyFees/Fotky_AdminFees-015-AF/AdminFees-015-AF.gif | TYP: Pridano | POPIS: Screenshot fees
    SOUBOR: {ROADMAPS}/6_AdminPresety/Fotky_AdminPresety-016-AX/AdminPresets-016-AX.gif | TYP: Pridano | POPIS: Screenshot presets
    SOUBOR: {ROADMAPS}/1_Kalkulacka/FunkcniTest_Kalkulacka_012-TK.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/15_AdminDashboard/FunkcniTest_AdminDashboard_013-AD.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/4_AdminMaterialyCenotvorba/FunkcniTest_AdminPricing_014-AP.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/5_AdminPoplatkyFees/FunkcniTest_AdminFees_015-AF.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/6_AdminPresety/FunkcniTest_AdminPresety_016-AX.md | TYP: Zmeneno | POPIS: Vylepseny report

    --- KONTEXT ---
    Faze 1 ze 4: Oprava chybejicich screenshotu + vylepseni funkcnich testu.
    Plan: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
    Stranky: Kalkulacka, Dashboard, Pricing, Fees, Presets

    === END ===
```

---

## ► FÁZE 1 — KROK 5: OVĚŘENÍ HISTORIE

**POVINNÉ OVĚŘENÍ — bez něj NESMÍŠ pokračovat:**

```bash
# 1. Ověř že soubor historie existuje:
ls "docs/claude/Historie/{DNESNI-DATUM}/"

# 2. Ověř že counter v ID-REGISTRY se zvýšil:
head -12 "docs/claude/Historie/ID-REGISTRY.md"

# 3. Ověř že MASTER-HISTORIE má nový záznam:
tail -5 "docs/claude/Historie/MASTER-HISTORIE.md"
```

**Pokud cokoliv chybí — ulož historii RUČNĚ přes Write tool! NEPOKRAČUJ bez uložené historie!**

---

## ► FÁZE 1 — KROK 6: /compact (POSLEDNÍ KROK!)

**TEPRVE TEĎ, po potvrzení že historie je uložena, proveď:**

```
/compact
```

**Tím se uvolní kontextové okno pro další fázi.**
**Po /compact POKRAČUJ na Fázi 2 — začni Krokem 1 (přečti plán!).**

---

# ╔═══════════════════════════════════════════════════════════╗
# ║  FÁZE 2: Parameters, Orders, Branding, Widget, Analytics ║
# ╚═══════════════════════════════════════════════════════════╝

## ► FÁZE 2 — KROK 1: PŘEČTI PLÁN

**POVINNÉ!** Před začátkem Fáze 2 si přečti tento plán:
```
Read tool: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
```
Najdi sekci "FÁZE 2" a přečti si VŠECHNY kroky (1-6) včetně historie a /compact.

---

## ► FÁZE 2 — KROK 2: SCREENSHOTY (5 stránek)

### 2.1 Admin Parameters
- **Route:** `http://localhost:4028/admin/parameters`
- **Název souboru:** `AdminParameters-017-AR.gif`
- **Cílová složka:** `{ROADMAPS}/10_AdminParameters/Fotky_AdminParameters-017-AR/`
- **Co zachytit:** Parametry seznam, kategorie, detail panel
- **Ověření:** `ls "{ROADMAPS}/10_AdminParameters/Fotky_AdminParameters-017-AR/"` → soubor existuje?

### 2.2 Admin Orders
- **Route:** `http://localhost:4028/admin/orders`
- **Název souboru:** `AdminOrders-018-AO.gif`
- **Cílová složka:** `{ROADMAPS}/7_AdminObjednavky/Fotky_AdminOrders-018-AO/`
- **Co zachytit:** Seznam objednávek, statusy, kanban/tabulka, detail modal
- **Ověření:** `ls "{ROADMAPS}/7_AdminObjednavky/Fotky_AdminOrders-018-AO/"` → soubor existuje?

### 2.3 Admin Branding
- **Route:** `http://localhost:4028/admin/branding`
- **Název souboru:** `AdminBranding-019-AB.gif`
- **Cílová složka:** `{ROADMAPS}/13_AdminBranding/Fotky_AdminBranding-019-AB/`
- **Co zachytit:** Logo upload, barvy, firemní údaje, náhled
- **Ověření:** `ls "{ROADMAPS}/13_AdminBranding/Fotky_AdminBranding-019-AB/"` → soubor existuje?

### 2.4 Admin Widget
- **Route:** `http://localhost:4028/admin/widget`
- **Název souboru:** `AdminWidget-020-AW.gif`
- **Cílová složka:** `{ROADMAPS}/11_WidgetEmbed/Fotky_AdminWidget-020-AW/`
- **Co zachytit:** Widget builder, náhled, embed kód, nastavení
- **Ověření:** `ls "{ROADMAPS}/11_WidgetEmbed/Fotky_AdminWidget-020-AW/"` → soubor existuje?

### 2.5 Admin Analytics
- **Route:** `http://localhost:4028/admin/analytics`
- **Název souboru:** `AdminAnalytics-021-AA.gif`
- **Cílová složka:** `{ROADMAPS}/21_AdminAnalytika/Fotky_AdminAnalytika-021-AA/`
- **Co zachytit:** Grafy, metriky, filtry, časové řady
- **Ověření:** `ls "{ROADMAPS}/21_AdminAnalytika/Fotky_AdminAnalytika-021-AA/"` → soubor existuje?

---

## ► FÁZE 2 — KROK 3: VYLEPŠENÍ REPORTŮ

**Až PO uložení VŠECH 5 screenshotů** vylepši tyto reporty:

| # | Report soubor | Plná cesta |
|---|--------------|-----------|
| 1 | FunkcniTest_AdminParameters_017-AR.md | `{ROADMAPS}/10_AdminParameters/FunkcniTest_AdminParameters_017-AR.md` |
| 2 | FunkcniTest_AdminOrders_018-AO.md | `{ROADMAPS}/7_AdminObjednavky/FunkcniTest_AdminOrders_018-AO.md` |
| 3 | FunkcniTest_AdminBranding_019-AB.md | `{ROADMAPS}/13_AdminBranding/FunkcniTest_AdminBranding_019-AB.md` |
| 4 | FunkcniTest_AdminWidget_020-AW.md | `{ROADMAPS}/11_WidgetEmbed/FunkcniTest_AdminWidget_020-AW.md` |
| 5 | FunkcniTest_AdminAnalytika_021-AA.md | `{ROADMAPS}/21_AdminAnalytika/FunkcniTest_AdminAnalytika_021-AA.md` |

**Co vylepšit:** Přesnější layout popis, konkrétní barvy/fonty/ikony, rozšířit pozitivní nálezy, přidat "6. Doporučení pro RoadMap" pokud chybí, aktualizovat Screenshots sekci s .gif souborem.

---

## ► FÁZE 2 — KROK 4: ULOŽENÍ HISTORIE (POVINNÉ!)

**NESMÍŠ PŘESKOČIT! NESMÍŠ POKRAČOVAT NA /compact BEZ TOHOTO KROKU!**

Spusť **specifického agenta pro historii** — `mp-spec-docs-historie`:

```
Task tool:
  subagent_type: "mp-spec-docs-historie"
  description: "Ulozit historii Faze 2 screenshoty"
  prompt: |
    === HISTORIE SAVE REQUEST ===

    DATUM: {DNESNI-DATUM}
    SESSION: S01
    TYP TRIGGERU: auto-checkpoint

    --- UPRAVY ---
    SOUBOR: {ROADMAPS}/10_AdminParameters/Fotky_AdminParameters-017-AR/AdminParameters-017-AR.gif | TYP: Pridano | POPIS: Screenshot parameters
    SOUBOR: {ROADMAPS}/7_AdminObjednavky/Fotky_AdminOrders-018-AO/AdminOrders-018-AO.gif | TYP: Pridano | POPIS: Screenshot orders
    SOUBOR: {ROADMAPS}/13_AdminBranding/Fotky_AdminBranding-019-AB/AdminBranding-019-AB.gif | TYP: Pridano | POPIS: Screenshot branding
    SOUBOR: {ROADMAPS}/11_WidgetEmbed/Fotky_AdminWidget-020-AW/AdminWidget-020-AW.gif | TYP: Pridano | POPIS: Screenshot widget
    SOUBOR: {ROADMAPS}/21_AdminAnalytika/Fotky_AdminAnalytika-021-AA/AdminAnalytics-021-AA.gif | TYP: Pridano | POPIS: Screenshot analytics
    SOUBOR: {ROADMAPS}/10_AdminParameters/FunkcniTest_AdminParameters_017-AR.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/7_AdminObjednavky/FunkcniTest_AdminOrders_018-AO.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/13_AdminBranding/FunkcniTest_AdminBranding_019-AB.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/11_WidgetEmbed/FunkcniTest_AdminWidget_020-AW.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/21_AdminAnalytika/FunkcniTest_AdminAnalytika_021-AA.md | TYP: Zmeneno | POPIS: Vylepseny report

    --- KONTEXT ---
    Faze 2 ze 4: Oprava chybejicich screenshotu + vylepseni funkcnich testu.
    Plan: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
    Stranky: Parameters, Orders, Branding, Widget, Analytics

    === END ===
```

---

## ► FÁZE 2 — KROK 5: OVĚŘENÍ HISTORIE

**POVINNÉ OVĚŘENÍ — bez něj NESMÍŠ pokračovat:**

```bash
ls "docs/claude/Historie/{DNESNI-DATUM}/"
head -12 "docs/claude/Historie/ID-REGISTRY.md"
tail -5 "docs/claude/Historie/MASTER-HISTORIE.md"
```

**Pokud cokoliv chybí — ulož historii RUČNĚ! NEPOKRAČUJ bez uložené historie!**

---

## ► FÁZE 2 — KROK 6: /compact (POSLEDNÍ KROK!)

**TEPRVE TEĎ, po potvrzení že historie je uložena, proveď:**

```
/compact
```

**Po /compact POKRAČUJ na Fázi 3 — začni Krokem 1 (přečti plán!).**

---

# ╔═══════════════════════════════════════════════════════════╗
# ║  FÁZE 3: Team, Express, Shipping, Coupons, Emails        ║
# ╚═══════════════════════════════════════════════════════════╝

## ► FÁZE 3 — KROK 1: PŘEČTI PLÁN

**POVINNÉ!** Před začátkem Fáze 3 si přečti tento plán:
```
Read tool: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
```
Najdi sekci "FÁZE 3" a přečti si VŠECHNY kroky (1-6) včetně historie a /compact.

---

## ► FÁZE 3 — KROK 2: SCREENSHOTY (5 stránek)

### 3.1 Admin Team
- **Route:** `http://localhost:4028/admin/team`
- **Název souboru:** `AdminTeam-022-AT.gif`
- **Cílová složka:** `{ROADMAPS}/23_AdminTeam/Fotky_AdminTeam-022-AT/`
- **Co zachytit:** Seznam členů, role, pozvánky
- **Ověření:** `ls "{ROADMAPS}/23_AdminTeam/Fotky_AdminTeam-022-AT/"` → soubor existuje?

### 3.2 Admin Express
- **Route:** `http://localhost:4028/admin/express`
- **Název souboru:** `AdminExpress-023-AE.gif`
- **Cílová složka:** `{ROADMAPS}/17_ExpressDelivery/Fotky_AdminExpress-023-AE/`
- **Co zachytit:** 3 express tiers, zákaznický náhled s kartami, upsell nastavení (scrolluj!)
- **Ověření:** `ls "{ROADMAPS}/17_ExpressDelivery/Fotky_AdminExpress-023-AE/"` → soubor existuje?

### 3.3 Admin Shipping
- **Route:** `http://localhost:4028/admin/shipping`
- **Název souboru:** `AdminShipping-024-DP.gif`
- **Cílová složka:** `{ROADMAPS}/16_Doprava/Fotky_AdminShipping-024-DP/`
- **Co zachytit:** Metody dopravy, detail panel, free shipping práh (scrolluj!)
- **Ověření:** `ls "{ROADMAPS}/16_Doprava/Fotky_AdminShipping-024-DP/"` → soubor existuje?

### 3.4 Admin Coupons
- **Route:** `http://localhost:4028/admin/coupons`
- **Název souboru:** `AdminCoupons-025-KS.gif`
- **Cílová složka:** `{ROADMAPS}/18_KuponySlevy/Fotky_AdminCoupons-025-KS/`
- **Co zachytit:** 3 taby (Kupóny, Akce, Nastavení) — KLIKNI NA KAŽDÝ TAB a zachyť!
- **Ověření:** `ls "{ROADMAPS}/18_KuponySlevy/Fotky_AdminCoupons-025-KS/"` → soubor existuje?

### 3.5 Admin Emails
- **Route:** `http://localhost:4028/admin/emails`
- **Název souboru:** `AdminEmails-026-GN.gif`
- **Cílová složka:** `{ROADMAPS}/22_AdminEmaily/Fotky_AdminEmails-026-GN/`
- **Co zachytit:** 3 taby (Šablony, Provider, Log) — KLIKNI NA KAŽDÝ TAB a zachyť!
- **Ověření:** `ls "{ROADMAPS}/22_AdminEmaily/Fotky_AdminEmails-026-GN/"` → soubor existuje?

---

## ► FÁZE 3 — KROK 3: VYLEPŠENÍ REPORTŮ

**Až PO uložení VŠECH 5 screenshotů** vylepši tyto reporty:

| # | Report soubor | Plná cesta |
|---|--------------|-----------|
| 1 | FunkcniTest_AdminTeam_022-AT.md | `{ROADMAPS}/23_AdminTeam/FunkcniTest_AdminTeam_022-AT.md` |
| 2 | FunkcniTest_AdminExpress_023-AE.md | `{ROADMAPS}/17_ExpressDelivery/FunkcniTest_AdminExpress_023-AE.md` |
| 3 | FunkcniTest_AdminShipping_024-DP.md | `{ROADMAPS}/16_Doprava/FunkcniTest_AdminShipping_024-DP.md` |
| 4 | FunkcniTest_AdminCoupons_025-KS.md | `{ROADMAPS}/18_KuponySlevy/FunkcniTest_AdminCoupons_025-KS.md` |
| 5 | FunkcniTest_AdminEmails_026-GN.md | `{ROADMAPS}/22_AdminEmaily/FunkcniTest_AdminEmails_026-GN.md` |

**Co vylepšit:** Přesnější layout popis, konkrétní barvy/fonty/ikony, rozšířit pozitivní nálezy, přidat "6. Doporučení pro RoadMap" pokud chybí, aktualizovat Screenshots sekci s .gif souborem.

---

## ► FÁZE 3 — KROK 4: ULOŽENÍ HISTORIE (POVINNÉ!)

**NESMÍŠ PŘESKOČIT! NESMÍŠ POKRAČOVAT NA /compact BEZ TOHOTO KROKU!**

Spusť **specifického agenta pro historii** — `mp-spec-docs-historie`:

```
Task tool:
  subagent_type: "mp-spec-docs-historie"
  description: "Ulozit historii Faze 3 screenshoty"
  prompt: |
    === HISTORIE SAVE REQUEST ===

    DATUM: {DNESNI-DATUM}
    SESSION: S01
    TYP TRIGGERU: auto-checkpoint

    --- UPRAVY ---
    SOUBOR: {ROADMAPS}/23_AdminTeam/Fotky_AdminTeam-022-AT/AdminTeam-022-AT.gif | TYP: Pridano | POPIS: Screenshot team
    SOUBOR: {ROADMAPS}/17_ExpressDelivery/Fotky_AdminExpress-023-AE/AdminExpress-023-AE.gif | TYP: Pridano | POPIS: Screenshot express
    SOUBOR: {ROADMAPS}/16_Doprava/Fotky_AdminShipping-024-DP/AdminShipping-024-DP.gif | TYP: Pridano | POPIS: Screenshot shipping
    SOUBOR: {ROADMAPS}/18_KuponySlevy/Fotky_AdminCoupons-025-KS/AdminCoupons-025-KS.gif | TYP: Pridano | POPIS: Screenshot coupons
    SOUBOR: {ROADMAPS}/22_AdminEmaily/Fotky_AdminEmails-026-GN/AdminEmails-026-GN.gif | TYP: Pridano | POPIS: Screenshot emails
    SOUBOR: {ROADMAPS}/23_AdminTeam/FunkcniTest_AdminTeam_022-AT.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/17_ExpressDelivery/FunkcniTest_AdminExpress_023-AE.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/16_Doprava/FunkcniTest_AdminShipping_024-DP.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/18_KuponySlevy/FunkcniTest_AdminCoupons_025-KS.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/22_AdminEmaily/FunkcniTest_AdminEmails_026-GN.md | TYP: Zmeneno | POPIS: Vylepseny report

    --- KONTEXT ---
    Faze 3 ze 4: Oprava chybejicich screenshotu + vylepseni funkcnich testu.
    Plan: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
    Stranky: Team, Express, Shipping, Coupons, Emails

    === END ===
```

---

## ► FÁZE 3 — KROK 5: OVĚŘENÍ HISTORIE

**POVINNÉ OVĚŘENÍ — bez něj NESMÍŠ pokračovat:**

```bash
ls "docs/claude/Historie/{DNESNI-DATUM}/"
head -12 "docs/claude/Historie/ID-REGISTRY.md"
tail -5 "docs/claude/Historie/MASTER-HISTORIE.md"
```

**Pokud cokoliv chybí — ulož historii RUČNĚ! NEPOKRAČUJ bez uložené historie!**

---

## ► FÁZE 3 — KROK 6: /compact (POSLEDNÍ KROK!)

**TEPRVE TEĎ, po potvrzení že historie je uložena, proveď:**

```
/compact
```

**Po /compact POKRAČUJ na Fázi 4 — začni Krokem 1 (přečti plán!).**

---

# ╔═══════════════════════════════════════════════════════════════╗
# ║  FÁZE 4: Migration, Integrations, Model Storage, Login, Acc. ║
# ╚═══════════════════════════════════════════════════════════════╝

## ► FÁZE 4 — KROK 1: PŘEČTI PLÁN

**POVINNÉ!** Před začátkem Fáze 4 si přečti tento plán:
```
Read tool: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
```
Najdi sekci "FÁZE 4" a přečti si VŠECHNY kroky (1-6) včetně historie a /compact.

---

## ► FÁZE 4 — KROK 2: SCREENSHOTY (5 stránek)

### 4.1 Admin Migration
- **Route:** `http://localhost:4028/admin/migration`
- **Název souboru:** `AdminMigration-027-AM.gif`
- **Cílová složka:** `{ROADMAPS}/27_Supabase/Fotky_AdminMigration-027-AM/`
- **Co zachytit:** Supabase status, data sources tabulka (19 namespaců), storage mode tabulka (scrolluj hodně!)
- **Ověření:** `ls "{ROADMAPS}/27_Supabase/Fotky_AdminMigration-027-AM/"` → soubor existuje?

### 4.2 Admin Integrations
- **Route:** `http://localhost:4028/admin/integrations`
- **Název souboru:** `AdminIntegrations-028-AI.gif`
- **Cílová složka:** `{ROADMAPS}/8_StripePlatby/Fotky_AdminIntegrations-028-AI/`
- **Co zachytit:** Shopify karta, status ODPOJENO, toggle
- **Ověření:** `ls "{ROADMAPS}/8_StripePlatby/Fotky_AdminIntegrations-028-AI/"` → soubor existuje?

### 4.3 Model Storage
- **Route:** `http://localhost:4028/admin/model-storage` (POZOR: BEZ /admin prefix NEFUNGUJE — dá 404!)
- **Název souboru:** `ModelStorage-029-MS.gif`
- **Cílová složka:** `{ROADMAPS}/14_ModelStorage/Fotky_ModelStorage-029-MS/`
- **Co zachytit:** 3-sloupcový file manager, strom vlevo, obsah uprostřed, preview vpravo. Klikni na Orders složku!
- **Ověření:** `ls "{ROADMAPS}/14_ModelStorage/Fotky_ModelStorage-029-MS/"` → soubor existuje?

### 4.4 Login
- **Route:** `http://localhost:4028/login`
- **Název souboru:** `Login-030-LG.gif`
- **Cílová složka:** `{ROADMAPS}/20_AuthBezpecnost/Fotky_Login-030-LG/`
- **Co zachytit:** Login formulář, email + heslo, zapamatovat, tlačítko přihlásit
- **Ověření:** `ls "{ROADMAPS}/20_AuthBezpecnost/Fotky_Login-030-LG/"` → soubor existuje?

### 4.5 Account
- **Route:** `http://localhost:4028/account`
- **Název souboru:** `Account-031-GN.gif`
- **Cílová složka:** `{ROADMAPS}/25_UcetUzivatele/Fotky_Account-031-GN/`
- **Co zachytit:** Avatar JN, osobní informace (4 pole), uložit/zrušit tlačítka
- **Ověření:** `ls "{ROADMAPS}/25_UcetUzivatele/Fotky_Account-031-GN/"` → soubor existuje?

---

## ► FÁZE 4 — KROK 3: VYLEPŠENÍ REPORTŮ

**Až PO uložení VŠECH 5 screenshotů** vylepši tyto reporty:

| # | Report soubor | Plná cesta |
|---|--------------|-----------|
| 1 | FunkcniTest_AdminMigration_027-AM.md | `{ROADMAPS}/27_Supabase/FunkcniTest_AdminMigration_027-AM.md` |
| 2 | FunkcniTest_AdminIntegrations_028-AI.md | `{ROADMAPS}/8_StripePlatby/FunkcniTest_AdminIntegrations_028-AI.md` |
| 3 | FunkcniTest_ModelStorage_029-MS.md | `{ROADMAPS}/14_ModelStorage/FunkcniTest_ModelStorage_029-MS.md` |
| 4 | FunkcniTest_Login_030-LG.md | `{ROADMAPS}/20_AuthBezpecnost/FunkcniTest_Login_030-LG.md` |
| 5 | FunkcniTest_Account_031-GN.md | `{ROADMAPS}/25_UcetUzivatele/FunkcniTest_Account_031-GN.md` |

**Co vylepšit:** Přesnější layout popis, konkrétní barvy/fonty/ikony, rozšířit pozitivní nálezy, přidat "6. Doporučení pro RoadMap" pokud chybí, aktualizovat Screenshots sekci s .gif souborem.

---

## ► FÁZE 4 — KROK 4: ULOŽENÍ HISTORIE (POVINNÉ!)

**NESMÍŠ PŘESKOČIT! TOTO JE POSLEDNÍ FÁZE ALE HISTORIE JE STÁLE POVINNÁ!**

Spusť **specifického agenta pro historii** — `mp-spec-docs-historie`:

```
Task tool:
  subagent_type: "mp-spec-docs-historie"
  description: "Ulozit historii Faze 4 + finalni souhrn"
  prompt: |
    === HISTORIE SAVE REQUEST ===

    DATUM: {DNESNI-DATUM}
    SESSION: S01
    TYP TRIGGERU: auto-checkpoint

    --- UPRAVY ---
    SOUBOR: {ROADMAPS}/27_Supabase/Fotky_AdminMigration-027-AM/AdminMigration-027-AM.gif | TYP: Pridano | POPIS: Screenshot migration
    SOUBOR: {ROADMAPS}/8_StripePlatby/Fotky_AdminIntegrations-028-AI/AdminIntegrations-028-AI.gif | TYP: Pridano | POPIS: Screenshot integrations
    SOUBOR: {ROADMAPS}/14_ModelStorage/Fotky_ModelStorage-029-MS/ModelStorage-029-MS.gif | TYP: Pridano | POPIS: Screenshot model storage
    SOUBOR: {ROADMAPS}/20_AuthBezpecnost/Fotky_Login-030-LG/Login-030-LG.gif | TYP: Pridano | POPIS: Screenshot login
    SOUBOR: {ROADMAPS}/25_UcetUzivatele/Fotky_Account-031-GN/Account-031-GN.gif | TYP: Pridano | POPIS: Screenshot account
    SOUBOR: {ROADMAPS}/27_Supabase/FunkcniTest_AdminMigration_027-AM.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/8_StripePlatby/FunkcniTest_AdminIntegrations_028-AI.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/14_ModelStorage/FunkcniTest_ModelStorage_029-MS.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/20_AuthBezpecnost/FunkcniTest_Login_030-LG.md | TYP: Zmeneno | POPIS: Vylepseny report
    SOUBOR: {ROADMAPS}/25_UcetUzivatele/FunkcniTest_Account_031-GN.md | TYP: Zmeneno | POPIS: Vylepseny report

    --- KONTEXT ---
    Faze 4 ze 4 (POSLEDNI): Oprava chybejicich screenshotu + vylepseni funkcnich testu.
    Plan: docs/claude/PLANS/Screenshot-Oprava-FunkcniTesty-Plan.md
    Stranky: Migration, Integrations, Model Storage, Login, Account

    CELKOVY SOUHRN VSECH 4 FAZI:
    - 20 GIF screenshotu ulozeno do 20 Fotky_* slozek
    - 20 FunkcniTest reportu vylepseno
    - Historie ulozena po kazde fazi (4x)
    - Vytvor take DENNI-PREHLED.md s celkovym souhrnem

    === END ===
```

---

## ► FÁZE 4 — KROK 5: OVĚŘENÍ HISTORIE

**POVINNÉ OVĚŘENÍ — bez něj NESMÍŠ pokračovat:**

```bash
ls "docs/claude/Historie/{DNESNI-DATUM}/"
head -12 "docs/claude/Historie/ID-REGISTRY.md"
tail -5 "docs/claude/Historie/MASTER-HISTORIE.md"
```

**Pokud cokoliv chybí — ulož historii RUČNĚ! NEPOKRAČUJ bez uložené historie!**

---

## ► FÁZE 4 — KROK 6: /compact (POSLEDNÍ KROK!)

**TEPRVE TEĎ, po potvrzení že historie je uložena, proveď:**

```
/compact
```

---

# ╔═══════════════════════════════════════════════════════════╗
# ║  FINÁLNÍ OVĚŘENÍ (po dokončení všech 4 fází)              ║
# ╚═══════════════════════════════════════════════════════════╝

## Kontrola: 20 screenshotů existuje na disku?

```bash
for dir in \
  "1_Kalkulacka/Fotky_Kalkulacka-012-TK" \
  "15_AdminDashboard/Fotky_AdminDashboard-013-AD" \
  "4_AdminMaterialyCenotvorba/Fotky_AdminPricing-014-AP" \
  "5_AdminPoplatkyFees/Fotky_AdminFees-015-AF" \
  "6_AdminPresety/Fotky_AdminPresety-016-AX" \
  "10_AdminParameters/Fotky_AdminParameters-017-AR" \
  "7_AdminObjednavky/Fotky_AdminOrders-018-AO" \
  "13_AdminBranding/Fotky_AdminBranding-019-AB" \
  "11_WidgetEmbed/Fotky_AdminWidget-020-AW" \
  "21_AdminAnalytika/Fotky_AdminAnalytika-021-AA" \
  "23_AdminTeam/Fotky_AdminTeam-022-AT" \
  "17_ExpressDelivery/Fotky_AdminExpress-023-AE" \
  "16_Doprava/Fotky_AdminShipping-024-DP" \
  "18_KuponySlevy/Fotky_AdminCoupons-025-KS" \
  "22_AdminEmaily/Fotky_AdminEmails-026-GN" \
  "27_Supabase/Fotky_AdminMigration-027-AM" \
  "8_StripePlatby/Fotky_AdminIntegrations-028-AI" \
  "14_ModelStorage/Fotky_ModelStorage-029-MS" \
  "20_AuthBezpecnost/Fotky_Login-030-LG" \
  "25_UcetUzivatele/Fotky_Account-031-GN" \
; do
  count=$(ls "C:/Users/Kuňákovi/Downloads/Model_Pricer-V2-main_VariantaA_A_to_F_Integrated/docs/claude/Osobní/Individual_RoadMaps/$dir/" 2>/dev/null | wc -l)
  if [ "$count" -eq "0" ]; then
    echo "CHYBI: $dir"
  else
    echo "OK: $dir ($count souboru)"
  fi
done
```

**VŠECH 20 složek MUSÍ mít alespoň 1 soubor. Pokud některá má 0 — vrať se a oprav!**

## Kontrola: Historie záznamy

```bash
ls "docs/claude/Historie/{DNESNI-DATUM}/"
# Musí obsahovat minimálně 4 soubory (1 per fáze) + případně DENNI-PREHLED
```

---

## FALLBACK: Pokud GIF export nefunguje

Pokud `gif_creator export download=true` nefunguje:

### Alternativa: Playwright screenshot
```bash
npx playwright screenshot http://localhost:4028/admin/dashboard "{CILOVA_CESTA}/screenshot.png" --full-page
```

---

## SHRNUTÍ POŘADÍ PRO KAŽDOU FÁZI

```
┌────────────────────────────────────────────────────────┐
│                                                         │
│  1. PŘEČTI PLÁN (Read tool → tento soubor, najdi fázi) │
│          ↓                                              │
│  2. SCREENSHOTY (5 stránek, uložit na disk, ověřit)    │
│          ↓                                              │
│  3. VYLEPŠENÍ REPORTŮ (5 reportů, doplnit detaily)     │
│          ↓                                              │
│  4. HISTORIE (Task: mp-spec-docs-historie agent)        │
│          ↓                                              │
│  5. OVĚŘENÍ HISTORIE (ls + head + tail)                 │
│          ↓                                              │
│  6. /compact (uvolnit kontext)                          │
│          ↓                                              │
│  7. DALŠÍ FÁZE (zpět na krok 1)                        │
│                                                         │
│  ⚠ Pořadí je NEMĚNNÉ!                                 │
│  ⚠ /compact je VŽDY POSLEDNÍ!                          │
│  ⚠ Historie je VŽDY PŘED /compact!                     │
│  ⚠ Na začátku VŽDY přečti plán!                       │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

> Plan vytvořen: 2026-02-20
> Agent pro historii: mp-spec-docs-historie (subagent_type v Task tool)
> Definice agenta: .claude/agents/mp-spec-docs-historie.md
> Odhadovaný čas: 45-60 minut pro všechny 4 fáze
> Soubory: 20 GIF screenshotů + 20 vylepšených reportů + 4+ historie záznamů
