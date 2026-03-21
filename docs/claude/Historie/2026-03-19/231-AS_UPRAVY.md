# 231-AS — UPRAVY — Admin-Settings — 2026-03-19

## Metadata
- **ID:** 231-AS
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** Admin-Settings (Storage Mode UI + Supabase Status)
- **Souvisejici ID:** 226-AD, 227-BK, 230-GN
- **Trigger:** Vlna 13 — Admin Settings potrebuje UI pro prepinani storage modu (localStorage / dual-write / supabase)

---

## Souhrn uprav

Nova sekce "Uloziste dat" v AdminSettings — uzivatel muze prepnout storage mode (localStorage, dual-write, supabase), videt Supabase connectivity status a dostane varovani pri prepnuti. Nove i18n klice pro celou sekci.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminSettings.jsx | Zmeneno | nova sekce | Nova sekce "Uloziste dat": select localStorage/dual-write/supabase, Supabase status check, varovani pri prepnuti, badges |
| 2 | src/contexts/LanguageContext.jsx | Zmeneno | i18n sekce | 22 novych i18n klicu (admin.settings.storage.*) |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminSettings.jsx`

**Typ:** Zmeneno
**Radky:** nova sekce Storage Mode
**Duvod:** Admin potrebuje UI pro spravu storage modu — ktery backend pouziva (localStorage, dual-write, supabase)

**Co se zmenilo:**
- Pridana nova sekce "Uloziste dat" (Storage Mode)
- Select se 3 moznostmi: localStorage (vychozi), dual-write (migrujici), supabase (plne cloudove)
- Supabase connectivity status check — zeleny/cerveny badge dle dostupnosti
- Varovani pri prepnuti modu — uzivatel musi potvrdit zmenu
- Status badges u kazde moznosti (Lokalni / Migrace / Cloud)
- Forge design system kompatibilni

---

### 2. `src/contexts/LanguageContext.jsx`

**Typ:** Zmeneno
**Radky:** i18n sekce admin.settings.storage
**Duvod:** Ceske a anglicke preklady pro novou Storage Mode sekci

**Co se zmenilo:**
- 22 novych i18n klicu v namespace admin.settings.storage.*
- Klice pro: nazvy modu, popisy, varovani, status badges, tooltip texty
- Ceska i anglicka verze

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminSettings, LanguageContext
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne
- **Rizika:** Prepnuti storage modu vyzaduje funkcni backend endpoint (Vlna 14)

---

## Testovani

- **Build:** Frontend PASS
- **Manual test:** Vizualni overeni AdminSettings stranky
- **Poznamky:** Storage mode prepinani zavisi na backend config route (232-BK)

---
