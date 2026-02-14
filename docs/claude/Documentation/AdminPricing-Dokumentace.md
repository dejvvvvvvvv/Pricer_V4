# AdminPricing — Dokumentace

> Admin konfigurace cenoveho systemu: materialy, fees, markup, volume discounts, minima, zaokrouhlovani.
> Route: `/admin/pricing` | Soubor: `src/pages/admin/AdminPricing.jsx` (3173 radku)

---

## 1. Prehled (URL /admin/pricing)

AdminPricing je jedina admin stranka pro kompletni konfiguraci cenoveho systemu (pricing pipeline).
Admin zde nastavuje:

- **Materialy** — nazev, slug (key), cena za gram, barvy s volitelnym price override
- **Cas tisku** — hodinova/minutova sazba, minimalni uctovany cas
- **Cenova pravidla** — minimalni cena za model, minimalni objednavka, zaokrouhlovani, markup
- **Mnozstevni slevy (S05)** — tier-based volume discounts (percent / fixed_price)
- **Preview sandbox** — interaktivni testovaci kalkulace s breakdown vizualizaci

Stranka pouziva **tab navigaci** s 5 kartami:

| Tab ID | Ikona | Popis CS | Popis EN |
|--------|-------|----------|----------|
| `materials` | Package | Materialy | Materials |
| `time` | Clock | Cas tisku | Print Time |
| `rules` | Calculator | Cenova pravidla | Pricing Rules |
| `discounts` | Percent | Slevy | Discounts |
| `preview` | Eye | Nahled | Preview |

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Jazyk | JavaScript (React, JSX) |
| Framework | React 18+ (hooks, funkcionalni komponenty) |
| Styling | CSS-in-JS pres `<style>` tag v JSX (inline v souboru), Forge design tokens |
| State management | useState + useMemo (lokalni), tenant-scoped localStorage |
| Storage | `loadPricingConfigV3()` / `savePricingConfigV3()` z `adminPricingStorage.js` |
| i18n | Inline preklady pres `useLanguage()` (CS/EN), `language === 'cs'` rozhodovani |
| UI knihovny | `ForgeDialog`, `ForgeCheckbox`, `Icon` (lucide-react wrapper) |
| Export/Import | JSON pres clipboard API / window.prompt fallback |

---

## 3. Architektura souboru (3173 radku)

Soubor je **monoliticky** — obsahuje vse v jednom souboru bez externiho rozdeleni do komponent.
Zadne subkomponenty v `components/pricing/` neexistuji.

### Blokova mapa

| Radky (priblizne) | Blok | Popis |
|--------------------|------|-------|
| 1-15 | Hlavicka + importy | React, Icon, ForgeDialog, ForgeCheckbox, useLanguage, storage |
| 16-41 | `DEFAULT_RULES` | Defaultni hodnoty pro pricing rules (time, minima, rounding, markup) |
| 43-49 | `DEFAULT_PREVIEW` | Defaultni vstupni parametry pro preview sandbox |
| 51-57 | `PRICING_TABS` | Definice 5 tab navigace (id, icon, label_cs, label_en) |
| 59-97 | Utility funkce | `safeNum`, `clampMin0`, `deepClone`, `createStableId`, `slugifyMaterialKey`, `isValidMaterialKey`, `ensureUniqueMaterialKey` |
| 114-147 | Color/material helpery | `normalizeHex`, `isValidHex`, `createDefaultWhiteColor`, `buildMaterialPrices`, `materialPricesToMaterialsV3`, `formatCzk` |
| 174-278 | `calcPricingPreview()` | Deterministicky pricing pipeline pro preview: base -> fees -> markup -> minima -> rounding |
| 280-340 | Hlavni komponenta (useState/useMemo) | State deklarace, `ui` prekladovy objekt |
| 342-359 | Pomocne settery | `setRule`, `setPreviewField`, `createDefaultMaterial`, `ensureAtLeastOneMaterial` |
| 368-498 | Material CRUD handlery | `addMaterial`, `updateMaterial`, `deleteMaterial`, color drafts, `addColorToMaterial` |
| 500-660 | Dialog handlery | `applyColorPatch`, `scheduleColorHexUpdate`, dialog open/close/save, `updateDialogDraft`, `addColorToDialog`, `updateDialogColor`, `deleteDialogColor` |
| 661-811 | Computed values | `currentConfigFull`, `dirty`, `materialIssues`, `validationErrors`, `isValid`, `previewResult` |
| 813-1068 | Akce handlery + useEffect | `handleResetDefaults`, `handleExport`, `handleImport`, `handleSave`, `useEffect` pro initial load |
| 1070-1101 | Mini komponenty | `enabledMaterials`, `setPreviewFromMaterial`, `ToggleRow`, `FieldError` |
| 1103-1127 | `DialogAddColor` | Inline komponenta pro pridani barvy v dialogu |
| 1129-2170 | JSX render | Loading state, header, banner, tab bar, 5 tab panelu (materials, time, rules, discounts, preview) |
| 2172-3168 | `<style>` blok | Kompletni CSS (~1000 radku) s Forge tokeny |
| 3173 | Export | `export default AdminPricing` |

---

## 4. Import graf

```
AdminPricing.jsx
  |-- react (useEffect, useMemo, useRef, useState)
  |-- ../../components/AppIcon          --> Icon (lucide-react wrapper)
  |-- ../../components/ui/forge/ForgeDialog  --> modalni dialog
  |-- ../../components/ui/forge/ForgeCheckbox --> stylizovany checkbox
  |-- ../../contexts/LanguageContext     --> useLanguage (t, language)
  |-- ../../utils/adminPricingStorage    --> loadPricingConfigV3, savePricingConfigV3
       |-- ../../utils/adminTenantStorage --> getTenantId, readTenantJson, writeTenantJson
```

### Kdo pouziva data z AdminPricing (downstream konzumenti)

- `pricingEngineV3.js` — cte pricing config z `pricing:v3` namespace
- `pricingService.js` — pouziva `normalizePricingConfigForEngine()` z `adminPricingStorage.js`
- `test-kalkulacka/index.jsx` — nacita config pro cenovou kalkulaci
- `widget-kalkulacka` — cte stejny tenant config

---

## 5. Design a vizual

### Forge dark theme

Stranka pouziva Forge design system s temito hlavnimi tokeny:

| Token | Pouziti | Hodnota (fallback) |
|-------|---------|-------------------|
| `--forge-bg-void` | Pozadi stranky | `#0a0a0f` |
| `--forge-bg-surface` | Karty, tab bar | `#12121a` |
| `--forge-bg-elevated` | Inputy, hover | `#1a1a2e` |
| `--forge-text-primary` | Nadpisy, ceny | `#e0e0e0` |
| `--forge-text-secondary` | Popisky | `#a0a0a0` |
| `--forge-text-muted` | Hinty, muted | `#666680` |
| `--forge-accent-primary` | Aktivni tab, CTA | `#00D4AA` (teal) |
| `--forge-border-default` | Bordery | `#1a1a2e` |

### Fonty

| Font token | Pouziti |
|-----------|---------|
| `--forge-font-heading` (Space Grotesk) | h1, h2, h3, material nazvy |
| `--forge-font-tech` (Share Tech Mono) | Labely, badges, tab buttony, tagy |
| `--forge-font-mono` (JetBrains Mono) | Ceny, cisla, input unity, breakdown |

### Layout

- Max-width: `1200px`, centered, padding `24px`
- Material grid: 3 sloupce (`repeat(3, 1fr)`), responsive na 2 sloupce pod 900px, 1 pod 560px
- Grid-2: 2 sloupce pro rules/preview, 1 sloupec pod 680px
- Modalni dialog pro editaci materialu: max-width `50vw`

### Vizualni prvky

- **Status pill** — zeleny/oranzovy badge (Ulozeno/Neulozene zmeny)
- **Banner** — info/success/error zpravy s ikony
- **Mini preview boxy** — v kartach pro Minima a Rounding jako vizualni ukazka
- **Breakdown** — stylizovany box s radky (material, cas, fees, markup, celkem)
- **Flags** — barevne badges pod breakdownem (min_price_applied, rounding_applied)
- **Empty state** — dashed border, ikona, text kdyz nejsou materialy

---

## 6. Datovy model (pricing config schema)

### 6.1 Ulozena konfigurace (pricing:v3 namespace)

```javascript
{
  schema_version: 3,
  materials: [
    {
      id: "mat-pla",           // Stabilni unikatni ID
      key: "pla",              // Slug (a-z, 0-9, podtrzitka)
      name: "PLA",             // Zobrazovany nazev
      enabled: true,           // Aktivni/Neaktivni
      price_per_gram: 0.6,     // Vychozi cena za gram (Kc)
      colors: [
        {
          id: "clr-white",
          name: "White",
          hex: "#FFFFFF",        // HEX barva (#RRGGBB)
          price_per_gram: null   // null = pouzije se material default
        }
      ]
    }
  ],
  default_material_key: "pla",   // Klic vychoziho materialu
  materialPrices: { pla: 0.6 },  // Kompatibilni mapa (legacy)
  timeRate: 150,                  // Kompatibilni pole (legacy)
  tenant_pricing: {               // Vsechna pravidla
    rate_per_hour: 150,
    min_billed_minutes_enabled: false,
    min_billed_minutes_value: 30,
    min_price_per_model_enabled: false,
    min_price_per_model_value: 99,
    min_order_total_enabled: false,
    min_order_total_value: 199,
    rounding_enabled: false,
    rounding_step: 5,             // 1 | 5 | 10 | 50
    rounding_mode: "nearest",     // "nearest" | "up"
    smart_rounding_enabled: true, // true = round jen final; false = i per-model
    markup_enabled: false,
    markup_mode: "flat",          // "flat" | "percent" | "min_flat"
    markup_value: 20
  },
  volume_discounts: {             // S05: Mnozstevni slevy
    enabled: false,
    mode: "percent",              // "percent" | "fixed_price"
    scope: "per_model",           // "per_model" | "per_order"
    tiers: [
      { min_qty: 5, value: 5, label: "5% sleva" },
      { min_qty: 10, value: 10, label: "10% sleva" }
    ]
  },
  updated_at: "2026-02-13T12:00:00.000Z"
}
```

### 6.2 DEFAULT_RULES (in-component defaults)

```javascript
{
  rate_per_hour: 150,
  min_billed_minutes_enabled: false,
  min_billed_minutes_value: 30,
  min_price_per_model_enabled: false,
  min_price_per_model_value: 99,
  min_order_total_enabled: false,
  min_order_total_value: 199,
  rounding_enabled: false,
  rounding_step: 5,
  rounding_mode: 'nearest',
  smart_rounding_enabled: true,
  markup_enabled: false,
  markup_mode: 'flat',
  markup_value: 20,
}
```

### 6.3 DEFAULT_PREVIEW (sandbox vstupni hodnoty)

```javascript
{
  material_price_per_g: 0.6,
  weight_g: 100,
  time_min: 60,
  quantity: 1,
  fees_total: 0,    // simulovane fees pro preview
}
```

---

## 8. UI komponenty — detailni popis hlavnich sekci

### 8.1 Header

- Nadpis "Pricing" + popis
- **Status pill** — `clean` (zeleny, "Ulozeno") / `dirty` (oranzovy, "Neulozene zmeny")
- Tlacitka: Reset na default, Export JSON, Import JSON, Ulozit zmeny
- Tlacitko Ulozit je `disabled` kdyz: `!dirty || saving || !isValid`

### 8.2 Tab: Materials

**Material grid** — kompaktni karticky (3 sloupce) zobrazujici:
- Nazev materialu (nebo "(bez nazvu)")
- Slug key
- Badges: Vychozi (Default), Aktivni/Neaktivni, Chyba
- Cena za gram (velke cislo s jednotkou Kc/g)
- Color chips — max 6 barev s teckou, nazvem a volitelnou cenou; "+N" pro vice

**Klik na kartu** otvira **ForgeDialog** s:
- Nazev materialu (input)
- Klic/slug (input, auto-generovany z nazvu pokud prazdny)
- Checkbox "Aktivni"
- Vychozi cena za gram (number input)
- Sekce barev materialu:
  - Kazda barva: nazev, color picker (native), hex input, volitelna cena za gram, tlacitko smazat
  - Minimalne 1 barva (posledni nelze smazat)
  - "Pridat novou barvu" formulat dole

**Pridani materialu** — tlacitko "Pridat material" vytvori novy material a automaticky otevre dialog.

**Smazani materialu** — nelze smazat posledni material. Pokud je smazany material vychozi, prepne se default na jiny.

### 8.3 Tab: Time (Cas tisku)

- **Toggle hodina/minuta** — prepinac pro zobrazeni sazby (ulozena hodnota je vzdy `rate_per_hour`)
- **Hodinova/minutova sazba** — number input s jednotkou Kc/h nebo Kc/min
- **Minimalni uctovany cas** — toggle + input (v minutach)
  - Help text: "Pouzije se jen pro vypocet ceny casu, material zustava realny."

### 8.4 Tab: Rules (Cenova pravidla)

**Karta 1: Minimalni ceny**
- Toggle "Minimalni cena za model" + input (Kc)
- Toggle "Minimalni cena objednavky" + input (Kc)
- Mini preview box ukazujici priklad (Vypocteno 52 Kc -> Uctovano 99 Kc)

**Karta 2: Zaokrouhlovani**
- Toggle "Zaokrouhlovat cenu"
- Select "Zaokrouhlit na" (1, 5, 10, 50)
- Select "Smer" (Nejblizsi / Vzdy nahoru)
- Toggle "Zaokrouhlovat jen finalni castku" (smart rounding)
- Mini preview box (483 -> 485)

**Karta 3: Automaticka prirazka (Markup)**
- Toggle "Automaticka prirazka"
- Radio group rezim: Fixni (Kc) / Procentni (%) / Minimalni cena (Kc)
- Number input pro hodnotu
- Mini preview box (120 + 20 = 140)

### 8.5 Tab: Discounts (Slevy)

**Volume Discounts karta** (S05):
- Checkbox zapnout/vypnout
- Select "Typ slevy" — Procentni sleva / Fixni cena za kus
- Select "Rozsah" — Za model (qty jednoho modelu) / Za objednavku (celkovy qty)
- **Tiers tabulka** — editovatelna tabulka s radky:
  - "Od (ks)" — minimalni mnozstvi (int, min 1)
  - "Sleva (%)" nebo "Cena/ks (Kc)" — hodnota dle rezimu
  - "Popis" — volitelny label
  - Tlacitko smazat radek
- Tlacitko "Pridat tier" — prida novy radek, automaticky sortuje dle min_qty
- Prikladovy text pod tabulkou ("5+ ks = -5%, 10+ ks = -10%")

**Budouci pricing profily (stub):**
- Vizualne odlisena karta s dashed borderem a opacity 0.7
- Disabled checkbox, informacni text o budoucich profilech (Standard/Engineering/Bulk)
- Tag "later"

### 8.6 Tab: Preview (Nahled)

**Sandbox kalkulace:**
- Toggle zapnout/vypnout preview
- Dropdown pro rychly vyber materialu
- Inputy: cena materialu (Kc/g), hmotnost (g), cas (min), mnozstvi (ks), fees simulace (Kc)

**Breakdown vizualizace:**

```
Material                    60.00 Kc
Cas (60 min)              150.00 Kc
Poplatky (Fees)             0.00 Kc
Markup                      0.00 Kc
------------------------------------
Cena / model              210.00 Kc
[Zaokrouhleno / model     210.00 Kc]  (jen kdyz rounding && !smart)
Mnozstvi                       1x
------------------------------------
Celkem                    210.00 Kc
```

**Flags** — barevne badges pod breakdownem:
- `warn`: "min cena / model aplikovana", "min cena objednavky aplikovana"
- `info`: "zaokrouhleni aplikovano"

### 8.7 Pricing pipeline (calcPricingPreview)

Pipeline pro preview sandbox, **deterministicky** (stejny vstup = stejny vystup):

```
1. material = weight_g * material_price_per_g
2. billedMinutes = max(time_min, min_billed_minutes)  [pokud enabled]
3. time = (billedMinutes / 60) * rate_per_hour
4. fees = fees_total (simulovane)
5. perModel = material + time + fees
6. markup:
   - flat: perModel += markup_value
   - percent: perModel += (perModel * markup_value) / 100
   - min_flat: pokud perModel < markup_value, bump na markup_value
7. min_price_per_model: pokud perModel < min, bump na min
8. rounding per-model: pokud rounding_enabled && !smart_rounding, round
9. total = perModelRounded * quantity
10. min_order_total: pokud total < min, bump na min
11. rounding final: pokud rounding_enabled, round total
```

Navratovy objekt:

```javascript
{
  material, time, billedMinutes, fees,
  basePlusFees,     // material + time + fees
  markup,           // castka prirazky
  perModel,         // cena za model pred zaokrouhlenim
  perModelRounded,  // cena za model po per-model zaokrouhleni
  qty,
  totalBeforeFinalRounding,
  total,            // finalni cena
  flags: {
    min_price_per_model_applied: boolean,
    min_order_total_applied: boolean,
    rounding_per_model_applied: boolean,
    rounding_final_applied: boolean,
  }
}
```

### 8.8 Inline pomocne komponenty

| Komponenta | Radky | Popis |
|------------|-------|-------|
| `ToggleRow` | 1081-1096 | Checkbox + label + volitelny hint (Info ikona s title) |
| `FieldError` | 1098-1101 | Chybova hlaska "Zadej hodnotu >= 0" |
| `DialogAddColor` | 1103-1127 | Samostatna mini-komponenta pro formular pridani barvy v dialogu |

---

## 9. State management (jak se data ukladaji/nacitaji)

### 9.1 Lokalni state

| State | Typ | Popis |
|-------|-----|-------|
| `loading` | boolean | Inicializacni nacitani |
| `saving` | boolean | Probiha ukladani |
| `materials` | array | Seznam materialu (hlavni data) |
| `defaultMaterialKey` | string | Klic vychoziho materialu |
| `rules` | object | Pricing pravidla (rate, minima, rounding, markup) |
| `volumeDiscounts` | object | S05: konfigurace mnozstevnich slev |
| `previewEnabled` | boolean | Zapnuti/vypnuti preview |
| `preview` | object | Vstupni parametry preview sandboxu |
| `activeTab` | string | Aktivni tab ('materials', 'time', 'rules', 'discounts', 'preview') |
| `timeUnit` | string | Zobrazeni sazby ('hour' / 'minute') — jen display |
| `banner` | object/null | `{ type, text }` pro notifikace |
| `savedSnapshot` | string | JSON snapshot posledniho ulozeni pro dirty detekci |
| `touched` | boolean | Priznak ze uzivatel neco zmenil |
| `editingMaterialIndex` | number/null | Index materialu pro dialog |
| `dialogDraft` | object/null | Deep kopie editovaneho materialu v dialogu |
| `colorDrafts` | object | Drafty pro novou barvu per material `{ [materialId]: { name, hex } }` |

### 9.2 Computed values (useMemo)

| Computed | Zavislosti | Popis |
|----------|-----------|-------|
| `ui` | `language` | Prekladovy objekt pro UI texty |
| `currentConfigFull` | `materials, rules, defaultMaterialKey, volumeDiscounts` | Kompletni konfigurce pro ulozeni |
| `dirty` | `savedSnapshot, currentConfigFull, touched` | Zda jsou neulozene zmeny |
| `materialIssues` | `materials` | Validacni problemy per material (nazev, key, cena, barvy) |
| `validationErrors` | `rules, materialIssues` | Seznam chyb (pravidla + materialy) |
| `isValid` | `validationErrors` | Boolean — zadne validacni chyby |
| `previewResult` | `rules, preview` | Vypocet cenoveho preview |
| `enabledMaterials` | `materials` | Filtrovane aktivni materialy pro dropdown |

### 9.3 Persistence flow

```
LOAD:
  useEffect (mount) -> loadPricingConfigV3()
    -> readTenantJson('pricing:v3')
       -> localStorage: modelpricer:<tenantId>:pricing:v3
    -> normalizeLoadedConfig()
    -> nastav state (materials, rules, defaultMaterialKey, volumeDiscounts)
    -> setSavedSnapshot(JSON.stringify(normalized))

SAVE:
  handleSave() -> savePricingConfigV3(currentConfigFull)
    -> normalizePricingConfigV3(config)
    -> writeTenantJson('pricing:v3', normalized)
       -> localStorage.setItem(modelpricer:<tenantId>:pricing:v3, JSON)
    -> setSavedSnapshot(newSnap)
    -> setTouched(false)
```

### 9.4 Dirty detection

Porovnava `savedSnapshot` (JSON string) s `currentConfigFull` (bez `updated_at`).
Pokud se lisi, stranka je oznacena jako "dirty" (neulozene zmeny).

### 9.5 Legacy migrace

Pokud `pricing:v3` namespace je prazdny pri loadu:
1. Pokusi se najit data v legacy klicich (`modelpricer_pricing_config__test-customer-1`, `admin_pricing_demo_v2:test-customer-1`)
2. Konvertuje `materialPrices` mapu na V3 materials array
3. Ulozi do V3 namespace
4. Pokud nic nenajde, seedne defaulty

---

## 10. Error handling

### 10.1 Validace

**Material validace** (`materialIssues` useMemo):
- `nameMissing` — prazdny nazev
- `keyMissing` — prazdny slug
- `keyInvalid` — nevalidni format (musi byt `^[a-z0-9]+(?:_[a-z0-9]+)*$`)
- `keyDuplicate` — duplicitni slug mezi materialy
- `priceInvalid` — cena < 0
- Color: `nameMissing`, `hexInvalid` (musi byt `#RRGGBB`)

**Rules validace** (`validationErrors` useMemo):
- `rate_per_hour`, `min_billed_minutes_value`, `min_price_per_model_value`, `min_order_total_value`, `markup_value` >= 0
- `rounding_step` musi byt 1, 5, 10 nebo 50
- `rounding_mode` musi byt 'nearest' nebo 'up'
- `markup_mode` musi byt 'flat', 'percent' nebo 'min_flat'

### 10.2 Chybove stavy

| Stav | Vizualizace |
|------|-------------|
| Field error | Cerveny border na inputu (`input-error`), text "Zadej hodnotu >= 0" |
| Material issue | Cerveny badge "Chyba" na kartce, cerveny border |
| Banner error | Cerveny banner s XCircle ikonu |
| Validation box | Oranzovy box s AlertTriangle dole na Preview tabu |
| Save blocked | Tlacitko Ulozit je `disabled` dokud neni validni |

### 10.3 Bezpecnostni guardy

- `safeNum()` — prevadi na cislo, vraci fallback kdyz NaN/Infinity
- `clampMin0()` — nikdy nepusti zapornou hodnotu
- `ensureAtLeastOneMaterial()` — vzdy garantuje min 1 material (PLA fallback)
- Smazani posledniho materialu je zablokovano
- Smazani posledni barvy materialu je zablokovano s info bannerem
- `handleSave()` nekdy validation check pred ulozenim

---

## 11. Preklady (i18n)

Stranka pouziva **dva pristup**:

1. **`useLanguage()` hook** — `t('admin.pricing.materials')` pro klice z LanguageContext slovniku
2. **Inline ternary** — `language === 'cs' ? 'Cesky text' : 'English text'` (prevazuje)

Vetsina textu pouziva inline ternary protoze jsou specificke pro tuto stranku
a nejsou sdilene s jinymi komponentami.

Nektere klice pouzivane pres `t()`:
- `admin.pricing.materials`
- `admin.pricing.addMaterial`
- `common.saving`

---

## 15. Konfigurace (co admin muze menit)

### 15.1 Materialy

| Polozka | Typ | Omezeni |
|---------|-----|---------|
| Nazev materialu | string | Povinny, zobrazovany v kalkulacce |
| Klic (slug) | string | Povinny, unikatni, `[a-z0-9_]`, auto-generovany z nazvu |
| Aktivni | boolean | Neaktivni materialy se nezobrazi v kalkulacce |
| Cena za gram | number | >= 0, v Kc |
| Vychozi material | radio | Jeden material je oznacen jako default |
| Barvy | array | Min 1 barva, kazda ma nazev + hex + volitelnou cenu |

### 15.2 Cas tisku

| Polozka | Typ | Default | Omezeni |
|---------|-----|---------|---------|
| Sazba za hodinu | number | 150 Kc/h | >= 0 |
| Minimalni uctovany cas | boolean + number | off, 30 min | >= 0 min |

### 15.3 Cenova pravidla

| Polozka | Typ | Default | Omezeni |
|---------|-----|---------|---------|
| Min cena za model | boolean + number | off, 99 Kc | >= 0 |
| Min cena objednavky | boolean + number | off, 199 Kc | >= 0 |
| Zaokrouhlovani | boolean | off | — |
| Zaokrouhlit na | select | 5 | 1, 5, 10, 50 |
| Smer zaokrouhleni | select | nearest | nearest, up |
| Smart rounding | boolean | true (jen final) | — |
| Markup | boolean | off | — |
| Markup rezim | radio | flat | flat, percent, min_flat |
| Markup hodnota | number | 20 | >= 0 |

### 15.4 Mnozstevni slevy (S05)

| Polozka | Typ | Default | Omezeni |
|---------|-----|---------|---------|
| Zapnuto | boolean | false | — |
| Typ slevy | select | percent | percent, fixed_price |
| Rozsah | select | per_model | per_model, per_order |
| Tiers | array | [] | min_qty >= 1, value >= 0, auto-sort dle min_qty |

### 15.5 Export/Import

- **Export** — kopiruje kompletni JSON config do schranky (clipboard API, fallback: window.prompt)
- **Import** — vlozeni JSON pres window.prompt, normalizace + validace, podporuje V3 i legacy formaty
- **Reset** — resetuje rules + preview na defaulty (materialy zustavaji)

---

## 16. Souvisejici dokumenty

| Dokument | Cesta | Vztah |
|----------|-------|-------|
| Pricing storage | `src/utils/adminPricingStorage.js` | Load/save, normalizace, schema, legacy migrace |
| Pricing engine | `src/lib/pricing/pricingEngineV3.js` | Konzument konfigurace (runtime kalkulace) |
| Pricing service | `src/lib/pricingService.js` | Konzument, pouziva `normalizePricingConfigForEngine()` |
| Fees admin | `src/pages/admin/AdminFees.jsx` | Fees se aplikuji v pipeline mezi base a markup |
| Fees storage | `src/utils/adminFeesStorage.js` | Namespace `fees:v3` |
| Tenant storage | `src/utils/adminTenantStorage.js` | Zakladni read/write pro tenant-scoped data |
| Test kalkulacka | `src/pages/test-kalkulacka/index.jsx` | Pouziva pricing config pro cenovy vypocet |
| Widget kalkulacka | `src/pages/widget-kalkulacka/` | Embedovatelna verze, cte stejny config |
| Pricing page (public) | `src/pages/pricing/index.jsx` | Verejna cenova stranka (nepouziva tento config primo) |
| Phase 1 plan | `docs/claude/Planovane_Implementace/V3-PHASE1-COMPLETE.md` | S05 volume discounts implementace |

---

## 17. Zname omezeni

### 17.1 Architekturalni

- **Monoliticky soubor** — 3173 radku v jednom souboru vcetne ~1000 radku CSS. Ztezuje orientaci a udrzbu.
  Zadne subkomponenty nejsou extrahovany do `components/pricing/`.
- **CSS-in-JS pres `<style>` tag** — styly nejsou modularni, mohou kolidovat s globalnimi CSS.
  Tridy jako `.input`, `.field`, `.select` jsou genericke nazvy.
- **Duplikace utility funkci** — `safeNum`, `clampMin0`, `slugifyMaterialKey` aj. jsou definovany
  jak v `AdminPricing.jsx` tak v `adminPricingStorage.js`. Zmena v jednom nezmeni druhy.
- **Volume discounts jen v admin UI** — tiers se ukladaji do configu, ale
  `calcPricingPreview()` v tomto souboru volume discounts NEAPLIKUJE v breakdown preview.
  (Volume discounts se aplikuji az v `pricingEngineV3.js` na urovni objednavky.)

### 17.2 UX

- **Import pres window.prompt** — omezeny na kratke JSON, neni pohodlny pro velke konfigurace.
  Chybi drag-and-drop nebo file input.
- **Zadny undo/redo** — po zmene neni moznost vratit se (krome "Reset na default" ktery resetuje vse).
- **Dialog barvy** — pridani barvy v dialogu vyzaduje rucni zadani HEX kodu + nazvu;
  chybi paleta preddefinovanych barev.
- **Pricing profiles stub** — karta "Vice pricing profilu" je jen placeholder.
  Architektura pro vice profilu neni implementovana.

### 17.3 Technicke

- **Volume discounts preview** — sandbox/preview tab neaplikuje volume discounts v breakdownu.
  Admin nema moznost otestovat slevy primo na teto strance.
- **Bez real-time sync** — zmeny se ukladaji do localStorage synchronne.
  Pokud ma vice admin tabu otevrenych, mohou si navzajem prepsat data.
- **Color hex RAF throttling** — `scheduleColorHexUpdate` pouziva `requestAnimationFrame`
  pro optimalizaci, ale tento kod se v praxi pouziva jen v legacy non-dialog editaci
  (soucastne dialog handlery (`updateDialogColor`) volaji primo `setDialogDraft`).
- **Preview dropdown material ceny** — material dropdown zobrazuje `m.price` misto `m.price_per_gram`
  (radek 2000), coz muze ukazat `NaN` pokud material nema pole `price`.
