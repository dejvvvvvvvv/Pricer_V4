# AdminBranding — Dokumentace

> Admin stranka pro nastaveni firemniho brandingu (logo, barvy, nazev, typografie) s live nahledem widgetu a tenant-scoped ukladanim.

---

## 1. Prehled

AdminBranding poskytuje:

- **Nastaveni firemni identity** — nazev firmy, slogan, logo upload
- **Barevne schema** — primarni, sekundarni, pozadi barva s HEX validaci
- **Typografie** — vyber z 4 fontu (Inter, Roboto, Poppins, Open Sans)
- **Nastaveni widgetu** — viditelnost loga/nazvu/sloganu/Powered by, zaobleni rohu
- **Live preview** — sticky panel vpravo zobrazuje simulovany widget v reealnem case
- **Dirty state tracking** — badge "Neuulozene zmeny" / "Ulozeno" v headeru
- **Plan gating** — "Powered by" nelze skryt ve Starter tarifu (vyzaduje PRO)
- **Logo optimalizace** — rasterove obrazky se resizuji na max 512px a konvertuji na WebP

Route: `/admin/branding`
Soubor: `src/pages/admin/AdminBranding.jsx` (1290 radku)

---

## 2. Data model

### 2.1 Branding objekt (localStorage)

Branding data se ukladaji pres tenant-scoped helper `adminBrandingWidgetStorage.js`.

```javascript
{
  businessName: "Moje 3D tiskarna",       // Nazev firmy (min 2 znaky, max 50)
  tagline: "Rychla kalkulace a objednavka", // Slogan (volitelne, max 100)
  logo: null,                              // Base64 data URL (PNG/JPG/SVG/WebP) nebo null
  primaryColor: "#2563EB",                 // HEX barva pro tlacitka, akcenty
  secondaryColor: "#10B981",               // HEX barva pro success, zvyrazneni
  backgroundColor: "#FFFFFF",              // HEX barva pozadi widgetu
  fontFamily: "Inter",                     // Rodina pisma (Inter|Roboto|Poppins|Open Sans)
  showLogo: true,                          // Zobrazit logo ve widgetu
  showBusinessName: true,                  // Zobrazit nazev firmy
  showTagline: true,                       // Zobrazit slogan
  showPoweredBy: true,                     // Zobrazit "Powered by ModelPricer"
  cornerRadius: 12,                        // Zaobleni rohu 0-24 px
  updated_at: "2026-02-13T12:00:00Z",      // Casova znacka posledni zmeny
  updated_by: "admin",                     // Kdo zmenu provedl
}
```

### 2.2 Plan features (ovlivnuji branding)

```javascript
{
  plan_name: "Starter",
  features: {
    can_hide_powered_by: false,    // false = Powered by je povinny
    max_widget_instances: 2,
    max_users: 3,
    can_use_domain_whitelist: true,
  },
  updated_at: "..."
}
```

### 2.3 localStorage klice

| Klic | Popis |
|------|-------|
| `modelpricer_branding__{tenantId}` | Branding konfigurace |
| `modelpricer_plan_features__{tenantId}` | Plan features (tarif) |

---

## 3. Soubory a komponenty

### 3.1 Hlavni stranka

```
src/pages/admin/AdminBranding.jsx            — Kompletni stranka (1290 radku)
```

### 3.2 Storage helper

```
src/utils/adminBrandingWidgetStorage.js      — CRUD pro branding + widget instances
```

Pouzivane exporty:

| Funkce | Popis |
|--------|-------|
| `getBranding(tenantId)` | Nacte branding z localStorage, seeduje defaults pokud neexistuje |
| `getDefaultBranding()` | Vrati vychozi branding objekt |
| `saveBranding(tenantId, data, updatedBy)` | Ulozi branding, enforces plan gating, dual-write Supabase |
| `getPlanFeatures(tenantId)` | Nacte plan features, seeduje Starter defaults |

### 3.3 Zavislosti (importy)

| Import | Zdroj | Popis |
|--------|-------|-------|
| `useLanguage` | `../../contexts/LanguageContext` | Preklady CS/EN |
| `ForgeCheckbox` | `../../components/ui/forge/ForgeCheckbox` | Forge checkbox UI |
| `Icon` | `../../components/AppIcon` | Ikonova komponenta (Upload, Image) |
| `useNavigate` | `react-router-dom` | Navigace (importovana ale nepouzita) |

---

## 4. Formulare a validace

### 4.1 Validacni pravidla (inline, live)

Validace se spousti v `useEffect` pri kazde zmene `branding` stavu.

| Pole | Pravidlo | Chybova zprava |
|------|----------|----------------|
| `businessName` | Min 2 znaky, neprazdne | "Zadej alespon 2 znaky." |
| `primaryColor` | Regex `/^#[0-9a-fA-F]{6}$/` | "Pouzij HEX ve formatu #RRGGBB." |
| `secondaryColor` | Regex `/^#[0-9a-fA-F]{6}$/` | "Pouzij HEX ve formatu #RRGGBB." |
| `backgroundColor` | Regex `/^#[0-9a-fA-F]{6}$/` | "Pouzij HEX ve formatu #RRGGBB." |
| `cornerRadius` | Cislo 0-24, ne NaN | "Zaobleni musi byt v rozsahu 0-24." |

### 4.2 Logo validace (pri uploadu)

| Kontrola | Pravidlo | Chybova zprava |
|----------|----------|----------------|
| Format | PNG, JPG, SVG, WebP | "Nepodporovany format. Pouzij PNG/JPG/SVG/WEBP." |
| Velikost | Max 2 MB | "Soubor je prilis velky (max 2 MB)." |

### 4.3 Save gating

Tlacitko "Ulozit zmeny" je disabled pokud:
- `saving === true` (probiha ukladani)
- `loading === true` (nacitani dat)
- `isDirty === false` (zadne zmeny)
- `Object.keys(errors).length > 0` (existuji validacni chyby)

---

## 5. Logo upload pipeline

### 5.1 Dvoustupnovy proces

Logo upload pouziva "draft" pattern — uzivatel vybere soubor, zobrazi se nahled, a teprve po potvrzeni se logo aplikuje do branding stavu.

```
1. Uzivatel vybere soubor (klik nebo drag & drop)
2. Validace formatu a velikosti (startLogoDraftFromFile)
3. Vytvori se Object URL pro nahled (logoDraftPreview)
4. Uzivatel klikne "Pouzit logo" (applyLogoDraft)
   NEBO ulozi celou stranku (handleSave auto-aplikuje draft)
5. Rasterovy obrazek se resizuje na max 512px (createImageBitmap + canvas)
6. Konverze na WebP (0.92 kvalita), fallback na PNG
7. SVG se ponechava beze zmeny (readAsDataURL)
8. Base64 data URL se ulozi do branding.logo
```

### 5.2 Optimalizace rasteru

```javascript
// Max rozmer = 512px (zachovava pomer stran)
const MAX = 512;
const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));

// Prednost WebP (mensi velikost), fallback PNG
canvas.toDataURL('image/webp', 0.92);  // pokus o WebP
canvas.toDataURL('image/png');          // fallback
```

### 5.3 Memory management

- `URL.createObjectURL()` pro nahled — revokuje se pri aplikaci nebo odstraneni
- `URL.revokeObjectURL()` se vola v `applyLogoDraft`, `removeLogo` a `handleSave`

---

## 6. Plan gating (Powered by)

### 6.1 Mechanismus

"Powered by ModelPricer" text je povinny pro Starter tarif. Skryti je dostupne az v PRO tarifu.

Gating se enforceuje na 3 urovnich:

1. **UI level** — checkbox `showPoweredBy` je disabled + chip "PRO" pokud `can_hide_powered_by === false`
2. **useEffect enforcement** — pokud je checkbox nekdy vypnut ale plan to nepovoluje, automaticky se zapne zpet
3. **Storage level** — `saveBranding()` v helperu enforceuje `showPoweredBy = true` pro neoprravnene plany

### 6.2 Reset to defaults

"Reset" tlacitko nastavuje UI hodnoty na defaults ale nevola `saveBranding()` — uzivatel musi kliknout "Ulozit zmeny". Reset take respektuje plan gating.

---

## 8. Spusteni a predpoklady

### 8.1 Frontend

```bash
cd Model_Pricer-V2-main
npm run dev    # Vite na portu 4028
```

Navigovat na: `http://localhost:4028/admin/branding`

### 8.2 Predpoklady

- Zadny backend neni nutny (localStorage only, Varianta A)
- `customerId` je hardcoded na `'test-customer-1'` (TODO: napojit na auth/context)
- Supabase dual-write je fire-and-forget (pokud je Supabase dostupny a storage mode je nastaveny)

---

## 9. Preklady (i18n)

Vsechny user-facing texty pouzivaji `t()` z `useLanguage()` hooku. Prekladove klice v `LanguageContext.jsx`:

### CS

```
admin.branding.title = "Branding"
admin.branding.subtitle = "Prizpusobte vzhled kalkulacky"
admin.branding.businessInfo = "Informace o firme"
admin.branding.businessName = "Nazev firmy:"
admin.branding.businessNamePlaceholder = "Napr. 3DtiskOndra"
admin.branding.businessNameHelp = "Tento nazev se zobrazi v kalkulacce"
admin.branding.tagline = "Slogan (volitelne):"
admin.branding.taglinePlaceholder = "Napr. Profesionalni 3D tisk na miru"
admin.branding.logo = "Logo"
admin.branding.dragDrop = "Pretahnete logo sem"
admin.branding.orClick = "nebo kliknete pro vyber"
admin.branding.recommended = "Doporuceno: 200x200px, pruhledne PNG"
admin.branding.chooseFile = "Vybrat soubor"
admin.branding.removeLogo = "Odebrat logo"
admin.branding.colorScheme = "Barevne schema"
admin.branding.primaryColor = "Primarni barva:"
admin.branding.primaryColorHelp = "Pouziva se pro tlacitka, zvyrazneni a akcenty"
admin.branding.secondaryColor = "Sekundarni barva:"
admin.branding.secondaryColorHelp = "Pouziva se pro zpravy o uspechu a zvyrazneni"
admin.branding.backgroundColor = "Barva pozadi:"
admin.branding.backgroundColorHelp = "Pozadi kalkulacky"
admin.branding.presets = "Predvolby:"
admin.branding.typography = "Typografie"
admin.branding.fontFamily = "Rodina pisma:"
admin.branding.calculatorSettings = "Nastaveni kalkulacky"
admin.branding.showLogo = "Zobrazit logo v kalkulacce"
admin.branding.showBusinessName = "Zobrazit nazev firmy"
admin.branding.showTagline = "Zobrazit slogan"
admin.branding.showPoweredBy = "Zobrazit 'Powered by Commun Printing' odznak"
admin.branding.cornerRadius = "Zaobleni rohu:"
admin.branding.livePreview = "Zivy nahled"
admin.branding.uploadModel = "Nahrat model:"
admin.branding.material = "Material:"
admin.branding.calculatePrice = "Vypocitat cenu"
```

### EN

Anglicke preklady jsou k dispozici pod stejnymi klici s prefixem `admin.branding.*`.

---

## 11. UI sekce a layout

### 11.1 Layout

Stranka pouziva 2-sloupcovy grid (1fr 1fr) s responsive breakpointem na 1024px (prepne na 1fr).

```
+---------------------------------------------+
| h1 Branding     [Neuulozene zmeny] [Reset] [Ulozit] |
+---------------------------------------------+
| [unsaved banner - pokud isDirty]            |
+---------------------------------------------+
| LEVY SLOUPEC         | PRAVY SLOUPEC       |
|                      |                     |
| Informace o firme    | Zivy nahled         |
|  - nazev firmy       |  (sticky, top: 24)  |
|  - slogan            |                     |
|                      | +--simulovany-----+ |
| Logo                 | | widget          | |
|  - nahled aktualniho | | - logo          | |
|  - upload zona       | | - nazev         | |
|  - akce (vybrat,     | | - slogan        | |
|    pouzit, odebrat)  | | - formulare     | |
|                      | | - CTA button    | |
| Nastaveni kalkulacky | | - Powered by    | |
|  - checkboxy         | +------------------+ |
|  - corner radius     |                     |
|    slider            |                     |
|                      |                     |
| Barevne schema       |                     |
|  - primarni barva    |                     |
|  - sekundarni barva  |                     |
|  - barva pozadi      |                     |
|  - presety           |                     |
|                      |                     |
| Typografie           |                     |
|  - radio buttons     |                     |
|    (Inter, Roboto,   |                     |
|    Poppins, Open     |                     |
|    Sans)             |                     |
+---------------------------------------------+
```

### 11.2 Status badge system

Header zobrazuje kombinaci status badges:

| Stav | Badge | Barva |
|------|-------|-------|
| Neulozene zmeny | "Neuulozene zmeny" | Zluta (warning) |
| Ulozeno | "Ulozeno" | Zelena (success) |
| Validacni chyby | "Nx chyba" | Cervena (error) |

### 11.3 Barevne presety

4 predvolby rychle nastavi trojici barev:

| Preset | Primary | Secondary | Background |
|--------|---------|-----------|------------|
| Blue | #2563EB | #10B981 | #FFFFFF |
| Green | #10B981 | #F59E0B | #FFFFFF |
| Purple | #7C3AED | #EC4899 | #FFFFFF |
| Orange | #F97316 | #10B981 | #FFFFFF |

### 11.4 Dirty state detekce

Dirty state se pocita porovnanim JSON serializace aktualniho `branding` stavu s `savedSnapshot` pres `useMemo`:

```javascript
const isDirty = useMemo(() => {
  if (!savedSnapshot) return false;
  return JSON.stringify(pickEditable(branding)) !== JSON.stringify(pickEditable(savedSnapshot));
}, [branding, savedSnapshot]);
```

Funkce `pickEditable()` extrahuje jen editovatelna pole (vylucuje `updated_at`, `updated_by`).

---

## 15. Styling

### 15.1 Pristup

Stranka pouziva **inline Forge styles** (JavaScript style objekty) s CSS tokens z `forge-tokens.css`. Zadne Tailwind tridy.

### 15.2 Pouzite Forge tokeny

| Token | Popis |
|-------|-------|
| `--forge-bg-surface` | Pozadi sekci |
| `--forge-bg-elevated` | Pozadi inputu, upload zony |
| `--forge-bg-overlay` | Hover stavy |
| `--forge-border-default` | Rramecky sekci a inputu |
| `--forge-border-active` | Aktivni rramecky |
| `--forge-text-primary` | Primarni text, nadpisy |
| `--forge-text-secondary` | Sekundarni text, labely |
| `--forge-text-muted` | Napovedy, help text |
| `--forge-accent-primary` | Primarni akcentova barva (tlacitka) |
| `--forge-accent-primary-h` | Hover stav primarniho akcentu |
| `--forge-accent-tertiary` | Chip badge barva |
| `--forge-warning` | Warning status badge |
| `--forge-success` | Success status badge |
| `--forge-error` | Error text, validace |
| `--forge-radius-sm` | Male zaobleni (inputy, tlacitka) |
| `--forge-radius-md` | Stredni zaobleni (sekce, bannery) |
| `--forge-radius-lg` | Velke zaobleni (logo preview, swatch) |
| `--forge-font-heading` | Nadpisy (h1, h3, tlacitka) |
| `--forge-font-body` | Body text, popisy, inputy |
| `--forge-font-tech` | Uppercase labely (11px) |
| `--forge-font-mono` | Status badges, chipy |
| `--forge-shadow-glow` | Hover glow na primary button |

### 15.3 Hover handlery

Hover efekty jsou implementovane pres inline `onMouseEnter`/`onMouseLeave` event handlery (ne CSS :hover), protoze inline styles neumi pseudo-selektory.

Definovane hover objekty:
- `btnPrimaryHover` — glow + translateY(-1px)
- `btnSecondaryHover` — background change
- `btnDangerHover` — red background tint
- `btnTertiaryHover` — border highlight
- `presetBtnHover` — accent color highlight
- `uploadAreaHover` — border + background change
- `inputFocusHandler` / `inputBlurHandler` — focus ring na inputech

### 15.4 Embedded CSS (style tag)

Stranka obsahuje `<style>` tag v JSX pro:
- Forge slider thumb styling (webkit + moz)
- Responsive breakpoint: `@media (max-width: 1024px)` → single column

---

## 16. Zname omezeni

- **Hardcoded customerId** — `const customerId = 'test-customer-1'` (radek 17) — neni napojeno na auth
- **Nepouzity import** — `useNavigate` je importovano ale nikde nepouzito
- **Duplicitni `rasterToOptimizedDataUrl`** — funkce je definovana 2x (v `handleSave` i v `applyLogoDraft`) se stejnou logikou
- **Alert pro UX** — `alert('Branding ulozen.')` a `alert('Oprav prosim chyby...')` misto Forge toast/notifikace
- **Bez undo** — reset nastavuje defaults v UI ale nema moznost vratit predchozi stav (pouze "Ulozit" potvrdi)
- **Nekompletni i18n** — nektere texty jsou hardcoded cesky: "Neuulozene zmeny", "Ulozeno", "Nx chyba", "Pouzit logo", "Ulozit zmeny", "Pripraveno k nahrani", banner text, slider labels "Sharp"/"Rounded"
- **Logo v localStorage** — base64 data URL zabira znacny prostor v localStorage (max ~5-10 MB dle prohlizece)
- **Bez drag-and-drop indikace** — upload zona nema vizualni zmenu pri pretazeni souboru nad ni (chybi `onDragEnter`/`onDragLeave`)
- **Bez color pickeru** — barvy se zadavaji jen textove jako HEX, neni nativni `<input type="color">`
- **Live preview neodpovida plne widgetu** — preview je zjednoduseny mockup, ne skutecny widget

---

## 17. Souvisejici dokumentace

| Soubor | Popis |
|--------|-------|
| `src/utils/adminBrandingWidgetStorage.js` | Storage helper pro branding + widget instances |
| `src/utils/widgetThemeStorage.js` | Default widget theme (re-exportovany z branding helperu) |
| `src/contexts/LanguageContext.jsx` | Prekladove klice `admin.branding.*` (CS/EN) |
| `src/components/ui/forge/ForgeCheckbox.jsx` | Forge checkbox komponenta |
| `src/Routes.jsx` | Route: `/admin/branding` → `<AdminBranding />` (radek 96) |
| `src/lib/supabase/storageAdapter.js` | Supabase dual-write adapter (fire-and-forget) |
| `src/lib/supabase/featureFlags.js` | Storage mode flags (localStorage/supabase/dual-write) |
