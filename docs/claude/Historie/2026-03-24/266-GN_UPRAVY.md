# 266-GN — UPRAVY — Batch 3 Bug Fixes — 2026-03-24

## Metadata
- **ID:** 266-GN
- **Session:** S01
- **Datum:** 2026-03-24
- **Oblast:** General (AX + GN + DS)
- **Souvisejici ID:** 264-GN (Batch 1), 265-GN (Batch 2)
- **Trigger:** Pokracovani oprav z Error LOGu — Batch 3 (Task 5.1 + 5.2 + 6.1 + 6.2)

---

## Souhrn uprav

Batch 3 obsahoval 4 tasky: zjednoduseni editoru presetu a oprava ukladani/nacitani material_key (Task 5.1+5.2), oprava fees sekce v Onboarding Wizardu kvuli V3 schema mismatch (Task 6.1), a oprava pozicovani modalu ve Wizardu pres createPortal (Task 6.2). Vsechny zmeny prosly npm run build.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | src/components/PresetInlineEditor.jsx | Zmeneno | vice oblasti | Zjednoduseni na 4 pole (nazev, poradi, material, viditelnost) |
| 2 | src/pages/admin/AdminPresets.jsx | Zmeneno | vice oblasti | Podpora zjednoduseneho editoru |
| 3 | src/lib/api/presetsApi.js | Zmeneno | upload funkce | Pridani material_key do FormData |
| 4 | backend-local/src/routes/presets.js | Zmeneno | upload handler | Cteni material_key z req.body |
| 5 | src/pages/admin/OnboardingWizard.jsx | Zmeneno | fees sekce + modal | 5 oprav V3 schema + createPortal fix |

---

## Detailni zmeny

### 1. `src/components/PresetInlineEditor.jsx`

**Typ:** Zmeneno
**Duvod:** Editor presetu byl prilis komplexni — zjednodusen na 4 zakladni pole.

**Co se zmenilo:**
- Editor zobrazi pouze: nazev, poradi, material, viditelnost
- Ostatni pokrocile parametry odebrani z inline editoru

---

### 2. `src/pages/admin/AdminPresets.jsx`

**Typ:** Zmeneno
**Duvod:** Podpora noveho zjednoduseneho inline editoru.

**Co se zmenilo:**
- Upravena integrace s PresetInlineEditor pro 4-polovou variantu

---

### 3. `src/lib/api/presetsApi.js`

**Typ:** Zmeneno
**Duvod:** Bug — material_key se ztracelo pri uploadu presetu (chybelo v FormData).

**Co se zmenilo:**
- Pridani material_key do FormData pri upload/update operaci
- Material key se nyni spravne prenasi na backend

---

### 4. `backend-local/src/routes/presets.js`

**Typ:** Zmeneno
**Duvod:** Backend necetl material_key z requestu.

**Co se zmenilo:**
- Upload handler nyni extrahuje material_key z req.body
- Hodnota se uklada do preset konfigurace

---

### 5. `src/pages/admin/OnboardingWizard.jsx`

**Typ:** Zmeneno
**Duvod:** Fees sekce ve wizardu pouzivala stare V2 schema misto V3, plus modal se spatne pozicoval.

**Co se zmenilo (Task 6.1 — 5 oprav fees sekce):**
- amount → value (V3 schema)
- fixed → flat (V3 fee type)
- enabled → active (V3 stav)
- Zobrazeni f.value misto f.amount
- Error resilience — try/catch kolem fees operaci

**Co se zmenilo (Task 6.2 — modal pozicovani):**
- Pridan createPortal do document.body pro modaly
- Stejny pattern jako ForgeDialog — portal zajisti spravne pozicovani nad vsemi vrstvami

---

## Dopad zmen

- **Ovlivnene komponenty:** PresetInlineEditor, AdminPresets, OnboardingWizard, Backend presets API
- **Breaking changes:** Ne (V3 schema uz bylo v ostatnich castech, wizard jen dohanal)
- **Nove zavislosti:** Zadne
- **Rizika:** Zjednoduseni preset editoru muze omezit pokrocile uzivatele — pokrocile parametry dostupne jinde

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Overeni ukladani presetu s materialem, wizard fees zobrazeni, modal pozicovani
- **Poznamky:** Zadne

---
