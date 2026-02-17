# Widget Builder - Error LOG & Audit Report

> Datum: 2026-02-16
> Testovano na: http://localhost:4028/admin/widget/builder/w_eaG03wtjTX
> Tester: Claude Opus 4.6 (vizualni + kodovy audit)

---

## Obsah
1. [Vizualni chyby (Chrome testing)](#1-vizualni-chyby)
2. [Funkcni chyby (Chrome testing)](#2-funkcni-chyby)
3. [Kodove chyby (Agent audit 1 - Quality)](#3-kodove-chyby-audit-1)
4. [Kodove chyby (Agent audit 2 - Security/UX)](#4-kodove-chyby-audit-2)
5. [Design/UX problemy](#5-designux-problemy)
6. [Performance problemy](#6-performance-problemy)
7. [Pristupnost (a11y)](#7-pristupnost)

---

## 1. Vizualni chyby

### VIZ-001 [P1] - Tlacitko "Vybrat soubory" je temer neviditelne (ghosted)
- **Kde:** Upload zona v preview canvasu (vsechny device mody)
- **Popis:** Tlacitko "Vybrat soubory" v upload zone je velmi blede/ghosted a tezko citelne. Chybi dostatecny kontrast oproti pozadi.
- **Screenshot:** `Fotky_Claude/WB_02_full_builder_clean.png`

### VIZ-002 [P1] - Duplicitni panel vlastnosti (levy + pravy panel)
- **Kde:** Pri vyberu elementu v preview canvasu
- **Popis:** Po kliknuti na element (napr. Hlavicka) se IDENTICKY obsah vlastnosti zobrazi jak v levem panelu (Styl tab), tak v pravem panelu (Vlastnosti). Duplikace zabira misto a mate uzivatele.
- **Screenshot:** `Fotky_Claude/WB_05_duplicate_properties_panel.png`

### VIZ-003 [P2] - Header widgetu oriznuty v mobilnim zobrazeni
- **Kde:** Mobile device preview
- **Popis:** Titulek "3D Tisk Kalkulacka" je castecne oriznuty/utesen v mobilnim preview framu. Stepper labely se zalamou.
- **Screenshot:** `Fotky_Claude/WB_03_mobile_view.png`

---

## 2. Funkcni chyby

### FUNC-001 [P1] - Firebase Analytics API key invalid
- **Kde:** Konzole - pri nacteni builderu
- **Popis:** `FirebaseError: Analytics: Dynamic config fetch failed: [400] API key not valid.` Firebase analytics nefunguje kvuli neplatnemu API klici.
- **Konzolovy vystup:** `[ERROR] @firebase/analytics: FirebaseError: Analytics: Dynamic config fetch failed`

### FUNC-002 [P1] - Firebase Installations request failed
- **Kde:** Konzole - pri nacteni builderu
- **Popis:** `FirebaseError: Installations: Create Installation request failed with error "400 INVALID_ARGUMENT: API key not valid."` Firebase instalace selhava.

### FUNC-003 [P2] - Supabase write error - nevalidni UUID
- **Kde:** Konzole - pri ukladani do Supabase
- **Popis:** `[storageAdapter] Supabase write error (widget_configs): invalid input syntax for type uuid: "demo-tenant"`. Demo tenant ID "demo-tenant" neni validni UUID format, coz zpusobuje selhani zapisu do Supabase.
- **Screenshot:** `Fotky_Claude/WB_02_full_builder_clean.png` (konzolove chyby zachyceny pres API)

### FUNC-004 [P0] - Step preview kroky 2-5 zobrazuji identicky obsah
- **Kde:** Top bar step switcher (Konfig., Prehled, Obj., Hotovo)
- **Popis:** Prepnuti mezi kroky 2 (Konfig.), 3 (Prehled), 4 (Obj.) a 5 (Hotovo) NEMENI obsah preview canvasu. Vsechny 4 kroky zobrazuji identicky obsah (Material a barva, Kvalita tisku, Mnozstvi + Cena a souhrn). Kroky by mely zobrazovat ruzne stavy widgetu (konfigurace, cenovy souhrn, checkout mock, potvrzeni mock).
- **Screenshoty:**
  - `Fotky_Claude/WB_07_step2_konfig_preview.png` (step 2)
  - `Fotky_Claude/WB_08_step4_obj_identical.png` (step 4 - identicky)
  - `Fotky_Claude/WB_09_step5_hotovo_identical.png` (step 5 - identicky)

### FUNC-005 [P2] - Mock data: model cena 0,00 Kc vs celkem 100,00 Kc
- **Kde:** Step 2+ preview - cenovy souhrn
- **Popis:** V mock datech ukazka-model.stl zobrazuje "0,00 Kc" v rozpisu objednavky, ale celkova cena ukazuje "100,00 Kc". Nekonzistentni mock data matou uzivatele.
- **Screenshot:** `Fotky_Claude/WB_07_step2_konfig_preview.png`

### FUNC-006 [P2] - "Prepocitat" tlacitka text nectitelny
- **Kde:** Step 2+ preview - cenovy souhrn vpravo nahore
- **Popis:** Dve tlacitka "Prepocitat cenu" a "Prepocitat vybrany" maji velmi nizky kontrast textu - text je tezko citelny oproti pozadi.
- **Screenshot:** `Fotky_Claude/WB_07_step2_konfig_preview.png`

---

## 3. Kodove chyby (Agent audit 1 - Quality)

_Doplneno po dokonceni code auditu..._

---

## 4. Kodove chyby (Agent audit 2 - Security/UX)

_Doplneno po dokonceni code auditu..._

---

## 5. Design/UX problemy

_Postupne doplnovano behem testovani..._

---

## 6. Performance problemy

_Doplneno po dokonceni auditu..._

---

## 7. Pristupnost

_Doplneno po dokonceni auditu..._

---

## Screenshot Reference

| # | Popis | Soubor |
|---|-------|--------|
| | | |
