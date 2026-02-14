# AdminExpress + AdminShipping — Dokumentace

> Dve admin stranky pro konfiguraci dorucovaciho workflow: AdminExpress (`/admin/express`) spravuje
> express/rush delivery tiery s prirazkami, AdminShipping (`/admin/shipping`) spravuje metody dopravy
> (FIXED, WEIGHT_BASED, PICKUP) s free shipping prahem. Obe sdili 2-sloupcovy layout (seznam vlevo,
> editor vpravo) a konzistentni CRUD vzor.

---

## 1. Prehled

### 1.1 AdminExpress (`/admin/express`)

AdminExpress je admin stranka pro spravu urovni doruceni (delivery tiers). Poskytuje:

- **Tier seznam** — levy panel s razenim (nahoru/dolu), smazanim a aktivacnimi indikatory
- **Tier editor** — pravy panel s nastavenim nazvu, doby doruceni, surcharge (procento nebo fixni castka)
- **Default tier** — moznost oznacit jednu uroven jako vychozi (preselected v kalkulacce)
- **Customer preview** — nahled jak tiery uvidi zakaznik (karty s cenami a dobou doruceni)
- **Upsell nastaveni** — volitelna zprava zobrazena pri vyberu pomalejsi urovne
- **Globaln zapnuti/vypnuti** — checkbox pro celkove aktivovani express doruceni

Celkovy rozsah: ~663 radku v jednom souboru vcetne inline `<style>` bloku (~200 radku CSS).

### 1.2 AdminShipping (`/admin/shipping`)

AdminShipping je admin stranka pro spravu zpusobu dopravy. Poskytuje:

- **Method seznam** — levy panel se zobrazenim typu (FIXED/WEIGHT_BASED/PICKUP), ceny a doby doruceni
- **Method editor** — pravy panel s nastavenim nazvu, typu, ceny, doby doruceni a popisu
- **Weight tiers** — tabulkovy editor hmotnostnich cennicku (jen pro WEIGHT_BASED typ)
- **Free shipping** — konfigurace prahu pro dopravu zdarma (minimalni castka objednavky)
- **Globaln zapnuti/vypnuti** — checkbox pro celkove aktivovani dopravy

Celkovy rozsah: ~670 radku v jednom souboru vcetne inline `<style>` bloku (~155 radku CSS).

### 1.3 Phase status

Obe stranky jsou **Phase 2 stranky** — lazy-loaded pres `React.lazy()` v `Routes.jsx`.
Navzdory oznaceni jako Phase 2 jsou plne implementovane (ne placeholdery).

---

## 2. Technologie a jazyk

| Polozka | AdminExpress | AdminShipping |
|---------|-------------|---------------|
| Framework | React 19 | React 19 |
| Bundler | Vite | Vite |
| Jazyk | JavaScript + JSX | JavaScript + JSX |
| Styling | Forge design tokeny (CSS vars) + inline `<style>` blok | Forge design tokeny (CSS vars) + inline `<style>` blok |
| Routing | React Router v6 (`/admin/express`, lazy-loaded) | React Router v6 (`/admin/shipping`, lazy-loaded) |
| i18n | Inline CS/EN pres `useLanguage()` hook, `const cs = language === 'cs'` | Inline CS/EN pres `useLanguage()` hook, `const cs = language === 'cs'` |
| UI komponenty | `ForgeCheckbox`, `Icon` (AppIcon) | `ForgeCheckbox`, `Icon` (AppIcon) |
| Storage | `adminExpressStorage.js` (namespace `express:v1`) | `adminShippingStorage.js` (namespace `shipping:v1`) |
| Data zdroj | `loadExpressConfigV1()` / `saveExpressConfigV1()` | `loadShippingConfigV1()` / `saveShippingConfigV1()` |

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminExpress.jsx               — 663 radku, export default AdminExpress
  AdminShipping.jsx              — 670 radku, export default AdminShipping

src/utils/
  adminExpressStorage.js         — Storage helper, namespace express:v1 (106 radku)
  adminShippingStorage.js        — Storage helper, namespace shipping:v1 (118 radku)
```

Obe stranky NEMAJI vlastni subkomponenty. Veskera logika, renderovani i CSS jsou v jednom souboru.

### Externi zavislosti (importy)

**AdminExpress:**
```
src/components/AppIcon.jsx                     — Ikony (lucide-react wrapper)
src/components/ui/forge/ForgeCheckbox.jsx      — Checkbox s labelem
src/contexts/LanguageContext.jsx                — i18n hook (useLanguage)
src/utils/adminExpressStorage.js               — CRUD pro express config (loadExpressConfigV1, saveExpressConfigV1)
```

**AdminShipping:**
```
src/components/AppIcon.jsx                     — Ikony (lucide-react wrapper)
src/components/ui/forge/ForgeCheckbox.jsx      — Checkbox s labelem
src/contexts/LanguageContext.jsx                — i18n hook (useLanguage)
src/utils/adminShippingStorage.js              — CRUD pro shipping config (loadShippingConfigV1, saveShippingConfigV1)
```

### Routes registrace (Routes.jsx)

```javascript
// radek 33-34: Lazy-loaded importy
const AdminExpress = React.lazy(() => import('./pages/admin/AdminExpress'));
const AdminShipping = React.lazy(() => import('./pages/admin/AdminShipping'));

// radek 109-110: Route definice (v ramci AdminLayout)
<Route path="express" element={<Suspense fallback={...}><AdminExpress /></Suspense>} />
<Route path="shipping" element={<Suspense fallback={...}><AdminShipping /></Suspense>} />
```

### Sidebar navigace (AdminLayout.jsx)

Obe stranky jsou v PRICING skupine v sidebar navigaci:
```javascript
// AdminLayout.jsx, ADMIN_NAV, radek 22-23
{ path: '/admin/express', label: 'Express', icon: 'Zap' },
{ path: '/admin/shipping', label: 'Shipping', icon: 'Truck' },
```

---

## 4. Data model

### 4.1 Express Config (normalizeExpressConfigV1)

```javascript
{
  schema_version: 1,
  enabled: true,                    // Boolean — express doruceni zapnuto/vypnuto
  tiers: [                          // Pole delivery tieru
    {
      id: "standard",              // Unikatni ID (crypto.randomUUID nebo fallback)
      name: "Standard",            // Nazev urovne
      surcharge_type: "percent",   // "percent" | "fixed"
      surcharge_value: 0,          // Hodnota prirazky (cislo >= 0)
      delivery_days: 5,            // Pocet dnu doruceni (cislo >= 0)
      is_default: true,            // Vychozi uroven (jen jedna muze byt default)
      sort_order: 0,               // Poradi v seznamu
      active: true,                // Aktivni/neaktivni
    },
    // dalsi tiery...
  ],
  upsell_enabled: true,             // Upsell zpravy zapnuty
  upsell_message: "",               // Vlastni upsell zprava (prazdne = default text)
  updated_at: "2026-02-13T..."      // ISO timestamp posledni zmeny
}
```

### 4.2 Express Tier — surcharge typy

| Typ | Popis CS | Popis EN | Priklad |
|-----|----------|----------|---------|
| `percent` | Procento (%) | Percent (%) | +25% z celkove ceny |
| `fixed` | Fixni castka (CZK) | Fixed (CZK) | +150.00 CZK |

### 4.3 Express defaultni data (seed)

Pokud neexistuji ulozena data, storage helper vytvori 3 vychozi tiery:

| ID | Nazev | Typ prirazky | Hodnota | Dny | Default |
|----|-------|-------------|---------|-----|---------|
| `standard` | Standard | percent | 0% | 5 | Ano |
| `express` | Express | percent | 25% | 2 | Ne |
| `rush` | Rush | percent | 50% | 1 | Ne |

### 4.4 Shipping Config (normalizeShippingConfigV1)

```javascript
{
  schema_version: 1,
  enabled: true,                        // Boolean — doprava zapnuta/vypnuta
  methods: [                            // Pole shipping metod
    {
      id: "standard",                  // Unikatni ID
      name: "Standard Shipping",       // Nazev metody
      type: "FIXED",                   // "FIXED" | "WEIGHT_BASED" | "PICKUP"
      price: 99,                       // Cena pro FIXED typ (cislo >= 0)
      weight_tiers: [],                // Hmotnostni tiery (jen pro WEIGHT_BASED)
      delivery_days_min: 3,            // Minimalni doba doruceni (dny)
      delivery_days_max: 5,            // Maximalni doba doruceni (dny)
      active: true,                    // Aktivni/neaktivni
      sort_order: 0,                   // Poradi v seznamu
      description: "",                 // Kratky popis pro zakaznika
    },
    // dalsi metody...
  ],
  free_shipping_threshold: 0,           // Minimalni castka pro dopravu zdarma (CZK)
  free_shipping_enabled: false,          // Doprava zdarma zapnuta
  updated_at: "2026-02-13T..."          // ISO timestamp
}
```

### 4.5 Shipping typy

| Typ | Popis CS | Popis EN | Specificka pole |
|-----|----------|----------|-----------------|
| `FIXED` | Pevna cena | Fixed price | `price` (CZK) |
| `WEIGHT_BASED` | Podle hmotnosti | Weight-based | `weight_tiers` (pole {max_weight_g, price}) |
| `PICKUP` | Osobni odber | Personal pickup | Zadna (implicitne zdarma) |

### 4.6 Weight tier objekt (pro WEIGHT_BASED)

```javascript
{
  max_weight_g: 1000,    // Maximalni hmotnost zasilky (gramy)
  price: 89,             // Cena pro zasilky az do dane hmotnosti (CZK)
}
```

### 4.7 Shipping defaultni data (seed)

| ID | Nazev | Typ | Cena | Dny | Aktivni |
|----|-------|-----|------|-----|---------|
| `standard` | Standard Shipping | FIXED | 99 CZK | 3-5 | Ano |
| `pickup` | Personal Pickup | PICKUP | 0 | 0-0 | Ano |

### 4.8 Storage format

**Express:**
```javascript
// Klic: modelpricer:${tenantId}:express:v1
{ schema_version: 1, enabled: true, tiers: [...], upsell_enabled: true, upsell_message: "", updated_at: "..." }
```

**Shipping:**
```javascript
// Klic: modelpricer:${tenantId}:shipping:v1
{ schema_version: 1, enabled: true, methods: [...], free_shipping_threshold: 0, free_shipping_enabled: false, updated_at: "..." }
```

---

## 5. Klicove funkce a logika

### 5.1 Sdilene helper funkce (obe stranky)

Obe stranky definuji vlastni lokalni kopie nasledujicich helpert (ne importovane, inlinovane):

| Funkce | Ucel |
|--------|------|
| `safeNum(v, fallback)` | Bezpecna konverze na cislo, NaN vraci fallback |
| `createId(prefix)` | UUID generator (crypto.randomUUID nebo Date.now fallback) |

AdminExpress navic definuje:
- `deepClone(obj)` — JSON parse/stringify klon (nepouzito v renderovani, mozny pozustatek)

### 5.2 AdminExpress — specificke funkce

| Funkce | Radek | Ucel |
|--------|-------|------|
| `updateConfig(patch)` | 89 | Immutable merge do config objektu |
| `updateTier(tierId, patch)` | 93 | Update konkretniho tieru v config.tiers poli |
| `addTier()` | 103 | Pridani noveho tieru s defaultnimi hodnotami |
| `removeTier(id)` | 120 | Smazani tieru (s confirm dialogem, blokuje smazani default tieru) |
| `setAsDefault(tierId)` | 135 | Nastaveni jednoho tieru jako default (odoznaci ostatni) |
| `moveTier(tierId, direction)` | 145 | Presunuti tieru nahoru/dolu (swap + sort_order recalc) |
| `handleSave()` | 157 | Ulozeni do storage pres saveExpressConfigV1 |
| `handleReset()` | 173 | Zahodeni zmen a reload ze storage (s confirm dialogem) |

### 5.3 AdminShipping — specificke funkce

| Funkce | Radek | Ucel |
|--------|-------|------|
| `updateConfig(patch)` | 85 | Immutable merge do config objektu |
| `updateMethod(methodId, patch)` | 89 | Update konkretni metody v config.methods poli |
| `addMethod()` | 99 | Pridani nove metody s defaultnimi hodnotami (typ FIXED) |
| `removeMethod(id)` | 118 | Smazani metody (s confirm dialogem) |
| `moveMethod(methodId, direction)` | 128 | Presunuti metody nahoru/dolu (swap + sort_order recalc) |
| `addWeightTier()` | 141 | Pridani weight tieru k vybrane metode |
| `updateWeightTier(idx, patch)` | 149 | Update weight tieru na danem indexu |
| `removeWeightTier(idx)` | 156 | Smazani weight tieru na danem indexu |
| `handleSave()` | 163 | Ulozeni do storage pres saveShippingConfigV1 |
| `handleReset()` | 179 | Zahodeni zmen a reload ze storage (s confirm dialogem) |

### 5.4 Storage helper funkce

**adminExpressStorage.js:**

| Export | Ucel |
|--------|------|
| `getDefaultExpressConfigV1()` | Vychozi config se 3 tiery (Standard/Express/Rush) |
| `normalizeExpressConfigV1(input)` | Normalizace — vynuti schema_version, parseBool, normalizeTier na kazdy tier |
| `loadExpressConfigV1()` | Nacte z localStorage, pokud neexistuje seeduje defaulty |
| `saveExpressConfigV1(data)` | Normalizuje a zapise do localStorage s updated_at |

**adminShippingStorage.js:**

| Export | Ucel |
|--------|------|
| `getDefaultShippingConfigV1()` | Vychozi config se 2 metodami (Standard + Pickup) |
| `normalizeShippingConfigV1(input)` | Normalizace — vynuti schema_version, parseBool, normalizeMethod |
| `loadShippingConfigV1()` | Nacte z localStorage, pokud neexistuje seeduje defaulty |
| `saveShippingConfigV1(data)` | Normalizuje a zapise do localStorage s updated_at |

Obe storage helpery:
- Importuji `readTenantJson` / `writeTenantJson` z `adminTenantStorage.js`
- Nepotrebuji legacy migraci (nove namespace, V1)
- Normalizuji kazdou polozku pri cteni i zapisu (defenzivni pattern)

### 5.5 Dirty detection pattern (sdileny)

Obe stranky pouzivaji stejny pattern pro detekci neulozenych zmen:

```
1. Pri loadu se ulozi JSON.stringify(config) do savedSnapshot
2. useMemo `dirty` porovnava aktualni JSON.stringify(config) se snapshotem
3. Po save se snapshot aktualizuje na novy stav
4. Status pill zobrazuje "Ulozeno"/"Neulozene zmeny" podle dirty flagu
5. Save a Reset tlacitka jsou disabled kdyz !dirty
```

---

## 8. UI struktura

### 8.1 AdminExpress — page layout

```
admin-page (max-width 1320px, forge-bg-void)
  |-- admin-header
  |    |-- title ("Express doruceni" / "Express Delivery")
  |    |-- subtitle (popis stranky)
  |    |-- header-actions
  |         |-- status-pill (Ulozeno / Neulozene zmeny)
  |         |-- btn-secondary "Nova uroven" (addTier)
  |         |-- btn-secondary "Reset" (handleReset, disabled when !dirty)
  |         |-- btn-primary "Ulozit" (handleSave, disabled when !dirty || saving)
  |-- banner (success/error notifikace, podmincene)
  |-- express-layout (2-column grid: 400px | 1fr)
       |-- express-panel (levy panel)
       |    |-- panel-header
       |    |    |-- panel-title ("Urovne doruceni" + count)
       |    |    |-- ForgeCheckbox "Express doruceni zapnuto"
       |    |-- panel-body (scrollable)
       |         |-- tier-list
       |              |-- tier-row * N
       |                   |-- dot (active/inactive)
       |                   |-- name-text + default chip
       |                   |-- tier-actions (ChevronUp, ChevronDown, Trash2)
       |                   |-- chipy (prirazka, dny doruceni)
       |-- express-editor (pravy panel, grid gap 14px)
            |-- admin-card "Nastaveni urovne" (podminene: selectedTier)
            |    |-- grid2: nazev + doba doruceni
            |    |-- grid2: typ prirazky (select) + hodnota prirazky
            |    |-- toggles: Aktivni + Vychozi uroven
            |-- admin-card "Nahled pro zakaznika" (podminene: selectedTier)
            |    |-- preview-tiers (flex wrap karty)
            |         |-- preview-card * N (name, surcharge, days, recommended badge)
            |-- admin-card "Upsell nastaveni" (vzdy viditelne)
                 |-- ForgeCheckbox "Upsell zpravy zapnuty"
                 |-- textarea "Vlastni upsell zprava" (podmincene: upsell_enabled)
```

### 8.2 AdminShipping — page layout

```
admin-page (max-width 1320px)
  |-- admin-header
  |    |-- title ("Doprava" / "Shipping")
  |    |-- subtitle (popis stranky)
  |    |-- header-actions
  |         |-- status-pill (Ulozeno / Neulozene zmeny)
  |         |-- btn-secondary "Nova metoda" (addMethod)
  |         |-- btn-secondary "Reset" (handleReset, disabled when !dirty)
  |         |-- btn-primary "Ulozit" (handleSave, disabled when !dirty || saving)
  |-- banner (success/error notifikace, podmincene)
  |-- shipping-layout (2-column grid: 400px | 1fr)
       |-- shipping-panel (levy panel)
       |    |-- panel-header
       |    |    |-- panel-title ("Metody dopravy" + count)
       |    |    |-- ForgeCheckbox "Doprava zapnuta"
       |    |-- panel-body (scrollable)
       |         |-- method-list
       |              |-- method-row * N
       |                   |-- dot (active/inactive)
       |                   |-- name-text
       |                   |-- method-actions (ChevronUp, ChevronDown, Trash2)
       |                   |-- chipy (typ, cena/tiers/zdarma, dny)
       |-- shipping-editor (pravy panel, grid gap 14px)
            |-- admin-card "Zakladni nastaveni" (podminene: selectedMethod)
            |    |-- grid2: nazev + typ (select FIXED/WEIGHT_BASED/PICKUP)
            |    |-- grid2: cena CZK (jen FIXED)
            |    |-- grid2: doba doruceni MIN + MAX
            |    |-- textarea: popis
            |    |-- toggles: Aktivni
            |-- admin-card "Hmotnostni tiery" (podminene: selectedMethod + WEIGHT_BASED)
            |    |-- weight-table (grid 3-column: max hmotnost, cena, smazat)
            |    |-- btn-secondary "Pridat tier"
            |-- admin-card "Doprava zdarma" (vzdy viditelne)
                 |-- ForgeCheckbox "Doprava zdarma zapnuta"
                 |-- input "Minimalni castka objednavky" (podmincene: free_shipping_enabled)
```

### 8.3 Empty states

**AdminExpress — prazdny seznam:**
- Ikona: `Truck` (44px)
- Text: "Zadne urovne doruceni" / "No delivery tiers"
- Hint: 'Klikni na "Nova uroven".' / 'Click "New tier".'

**AdminExpress — zadny tier vybrany:**
- Ikona: `MousePointer2` (44px)
- Text: "Editor urovne" / "Tier editor"
- Hint: "Vyber uroven vlevo." / "Select a tier on the left."

**AdminShipping — prazdny seznam:**
- Ikona: `Package` (44px)
- Text: "Zadne metody dopravy" / "No shipping methods"
- Hint: 'Klikni na "Nova metoda".' / 'Click "New method".'

**AdminShipping — zadna metoda vybrana:**
- Ikona: `MousePointer2` (44px)
- Text: "Editor metody" / "Method editor"
- Hint: "Vyber metodu vlevo." / "Select a method on the left."

### 8.4 Responsive breakpointy

| Breakpoint | Efekt |
|-----------|-------|
| `<= 1100px` | 2-column layout se zmeni na 1-column (panel + editor pod sebe) |
| `<= 640px` | grid2 (2-column form grid) se zmeni na 1-column |

### 8.5 Loading state

Obe stranky zobrazuji loading spinner s textem "Nacitam..." / "Loading..." uvnitr admin-card
v dobe inicializace (loading === true). Ikona: `Loader2`.

---

## 9. Preklady (i18n)

Obe stranky pouzivaji `useLanguage()` hook a inline `const cs = language === 'cs'` pattern.
Preklady jsou definovane v `useMemo` objektu `ui` (cachovane dle jazyka).

### AdminExpress — klicove preklady

| Klic | CS | EN |
|------|----|----|
| title | Express doruceni | Express Delivery |
| subtitle | Spravuj urovne doruceni... | Manage delivery tiers... |
| newTier | Nova uroven | New tier |
| save/saved/saving | Ulozit / Ulozeno / Ukladam... | Save / Saved / Saving... |
| unsaved | Neulozene zmeny | Unsaved changes |
| noTiers | Zadne urovne doruceni | No delivery tiers |
| editorTitle | Editor urovne | Tier editor |
| emptyEditor | Vyber uroven vlevo. | Select a tier on the left. |

Dalsi inline preklady (mimo ui objekt): nazev pole (Nazev/Name), typ prirazky (Typ prirazky/Surcharge type),
doba doruceni (Doba doruceni/Delivery days), nahled (Nahled pro zakaznika/Customer preview),
upsell (Upsell nastaveni/Upsell settings), aktivni/default/prirazka/dny — celkem cca 30 prekladovych retezcu.

### AdminShipping — klicove preklady

| Klic | CS | EN |
|------|----|----|
| title | Doprava | Shipping |
| subtitle | Spravuj zpusoby dopravy... | Manage shipping methods... |
| newMethod | Nova metoda | New method |
| save/saved/saving | Ulozit / Ulozeno / Ukladam... | Save / Saved / Saving... |
| unsaved | Neulozene zmeny | Unsaved changes |
| noMethods | Zadne metody dopravy | No shipping methods |
| editorTitle | Editor metody | Method editor |
| emptyEditor | Vyber metodu vlevo. | Select a method on the left. |

Dalsi inline preklady: zakladni nastaveni, typ, cena, doba doruceni MIN/MAX, hmotnostni tiery,
doprava zdarma, minimalni castka — celkem cca 25 prekladovych retezcu.

---

## 11. Navaznosti na dalsi systemy

### 11.1 AdminTenantStorage (adminTenantStorage.js)

Oba storage helpery (`adminExpressStorage.js`, `adminShippingStorage.js`) importuji
`readTenantJson` / `writeTenantJson` z `adminTenantStorage.js`. Tyto funkce zabaloji
tenant-scoped localStorage pristup pres `modelpricer:${tenantId}:${namespace}` klic.

### 11.2 AdminLayout (AdminLayout.jsx)

AdminExpress a AdminShipping jsou registrovany v sidebar navigaci (PRICING skupina)
a renderovany jako `<Outlet>` vnorene v AdminLayout.

### 11.3 Routes.jsx

Obe stranky jsou lazy-loaded pres `React.lazy()` s `<Suspense>` fallbackem.
Suspense fallback je jednoduchy `<div>` s "Loading..." textem a padding 32px.

### 11.4 Pricing engine / kalkulacka (budouci integrace)

Aktualne AdminExpress a AdminShipping **pouze konfiguruji data** — ukladaji je do localStorage.
Data z `express:v1` a `shipping:v1` namespaces zatim **nejsou konzumovana** pricing enginem
ani kalkulackou. Toto je pripravena konfigurace pro budouci Phase 2 integraci:

- Express tiery by meli byt dostupne jako vyberove pole v kalkulacce (krok 3 nebo 4)
- Shipping metody by meli byt dostupne v checkout kroku
- Free shipping prah by mel automaticky vynulovat shipping cenu pri prekroceni

### 11.5 ForgeCheckbox (src/components/ui/forge/ForgeCheckbox.jsx)

Sdilena Forge UI komponenta pouzivana pro toggle checkboxy v obou strankach.
Vlastnena agentem `mp-mid-design-system`.

### 11.6 AppIcon (src/components/AppIcon.jsx)

Lucide-react icon wrapper pouzivany pro vsechny ikony v obou strankach.

---

## 15. AdminExpress — detailni specificka logika

### 15.1 Default tier ochrana

- Jen jeden tier muze byt oznacen jako `is_default: true`
- Pri volani `setAsDefault(tierId)` se ostatni tiery nastaveni na `is_default: false`
- Default tier nelze smazat — pri pokusu o smazani se zobrazi error banner
- Ve frontendovem preview se default tier zobrazi s badgem "Doporuceno"/"Recommended"

### 15.2 Surcharge kalkulace (preview)

Preview karty zobrazuji:
- `surcharge_value === 0`: "Bez priplatku" / "No surcharge"
- `surcharge_type === 'percent'`: "+X%"
- `surcharge_type === 'fixed'`: "+X.XX CZK"

### 15.3 Upsell message

- Upsell zpravy se zobrazuji pokud `upsell_enabled === true`
- Pokud `upsell_message` je prazdny retezec, pouzije se vychozi text (logika pro vychozi text
  neni implementovana v AdminExpress — je to zodpovednost konzumujici kalkulacky)
- Placeholder napoveda: "Upgrade na Express a mej to do 2 dnu!"

### 15.4 Tier razeni

- Sort je manualni pres sipky nahoru/dolu (swap algoritmus)
- Po kazdem presunu se `sort_order` prepocita sekvencne (0, 1, 2, ...)
- Prvni tier nemuze jit nahoru, posledni dolu (tlacitka disabled)

---

## 16. AdminShipping — detailni specificka logika

### 16.1 Shipping typ FIXED

- Zobrazuje pole "Cena (CZK)" s number inputem
- Chip v seznamu: "99.00 CZK"

### 16.2 Shipping typ WEIGHT_BASED

- Nezobrazuje pole "Cena" (cena je urcena weight tiery)
- Zobrazuje sekci "Hmotnostni tiery" s tabulkovym editorem
- Kazdy tier ma: max_weight_g (gramy) + price (CZK)
- Tlacitko "Pridat tier" automaticky nastavi max_weight_g na predchozi max + 1000g
- Chip v seznamu: "N tieru" / "N tiers"

### 16.3 Shipping typ PICKUP

- Nezobrazuje pole "Cena" (implicitne zdarma)
- Chip v seznamu: "Zdarma" / "Free"

### 16.4 Delivery days range

Na rozdil od AdminExpress (kde je jen `delivery_days`), AdminShipping pouziva rozsah:
- `delivery_days_min` — minimalni pocet dnu
- `delivery_days_max` — maximalni pocet dnu
- Zobrazeni v chipu: "3-5 dni" / "3-5 days"

### 16.5 Free shipping prah

- Aktivuje se checkboxem `free_shipping_enabled`
- Jakmile je aktivni, zobrazi se input pro `free_shipping_threshold` (CZK)
- Help text: "Objednavky nad tuto castku budou mit dopravu zdarma."
- Defaultne vypnuto (`free_shipping_enabled: false`, `free_shipping_threshold: 0`)

### 16.6 Weight tiers tabulka

- 3-sloupcova tabulka: Max hmotnost (g) | Cena (CZK) | Smazat (X ikona)
- Header s tech fontem, uppercase labels
- Kazdy radek je editovatelny inline (number inputy)
- Prazdny stav: "Zadne tiery. Pridej aspon jeden." / "No tiers. Add at least one."

### 16.7 Metoda razeni

Stejny pattern jako AdminExpress — manualni swap nahoru/dolu, sekvencni sort_order.
Na rozdil od Express: shipping metody nemaji `is_default` flag, takze nelze oznacit "vychozi"
a neexistuje ochrana proti smazani.

---

## 17. Validace

### 17.1 AdminExpress

AdminExpress **nema formalni validaci** pred ukladanim. Potencialni problemy:

- Prazdny nazev tieru — povolen (uklada se prazdny retezec, normalizace nastavi "Tier N")
- Nulova prirazka — povolena (Standard tier implicitne ma 0)
- Duplicitni nazvy — povoleny (zadna kontrola unikatnosti)
- Zadne tiery — povoleno (prazdne pole se ulozi)
- Viceslave default tiery — nemozne (setAsDefault spravne prepina na jedineho)

Normalizace v storage helperech zaruci ze:
- Surcharge type je vzdy "percent" nebo "fixed"
- Cisla jsou vzdy finite (NaN => fallback)
- ID je vzdy neprazdny retezec

### 17.2 AdminShipping

AdminShipping **nema formalni validaci** pred ukladanim. Potencialni problemy:

- Prazdny nazev metody — povolen (normalizace nastavi "Shipping N")
- Nulova cena u FIXED — povolena
- delivery_days_min > delivery_days_max — povoleno (neni kontrolovano)
- Prazdne weight_tiers u WEIGHT_BASED — povoleno (neni vynucen minimalne 1 tier)
- Nesortovane weight_tiers (max_weight_g neni vzestupne) — povoleno

Normalizace v storage helperech zaruci ze:
- Shipping typ je vzdy FIXED, WEIGHT_BASED nebo PICKUP
- Weight tiers se clearuji pokud typ neni WEIGHT_BASED
- Cisla jsou vzdy finite

---

## Appendix A: Konstanty

### SURCHARGE_TYPES (AdminExpress)
```javascript
[
  { value: 'percent', label_cs: 'Procento (%)', label_en: 'Percent (%)' },
  { value: 'fixed', label_cs: 'Fixni castka (CZK)', label_en: 'Fixed (CZK)' },
]
```

### SHIPPING_TYPES (AdminShipping)
```javascript
[
  { value: 'FIXED', label_cs: 'Pevna cena', label_en: 'Fixed price' },
  { value: 'WEIGHT_BASED', label_cs: 'Podle hmotnosti', label_en: 'Weight-based' },
  { value: 'PICKUP', label_cs: 'Osobni odber', label_en: 'Personal pickup' },
]
```

---

## Appendix B: Porovnani AdminExpress vs AdminShipping

| Vlastnost | AdminExpress | AdminShipping |
|-----------|-------------|---------------|
| Namespace | `express:v1` | `shipping:v1` |
| Polozky | Delivery tiers | Shipping methods |
| Kolekce klic | `tiers` | `methods` |
| Default oznaceni | Ano (`is_default` flag) | Ne |
| Ochrana smazani | Ano (default tier nelze smazat) | Ne |
| Dodaci doba | Jedina hodnota (`delivery_days`) | Rozsah (`delivery_days_min` + `delivery_days_max`) |
| Cenovy model | Surcharge (procento nebo fixed) | Typ (FIXED cena / WEIGHT_BASED / PICKUP zdarma) |
| Popis/description | Ne | Ano (textarea) |
| Extra sekce dole | Upsell message + customer preview | Free shipping threshold |
| Weight sub-tabulka | Ne | Ano (pro WEIGHT_BASED) |
| Preview cards | Ano (vizualni nahled pro zakaznika) | Ne |
| admin-page background | `var(--forge-bg-void)` (explicitne) | (implicitne — chybi explicitni deklarace) |
| Status pill dirty barva | Warning (zluta, `rgba(255,181,71,...)`) | Error (cervena, `rgba(255,71,87,...)`) |
| Panel border-radius | `var(--forge-radius-xl)` | `var(--forge-radius-md)` |
| card-header h2 font-size | 16px + heading font | 11px + tech font (uppercase) |
| Input focus efekt | `border-color` only | `border-color` + `box-shadow` |

---

## Appendix C: Zname omezeni

### Spolecne

1. **Vsechno v jednom souboru** — obe stranky maji JSX + CSS v jednom souboru bez subkomponent
2. **Inline CSS** — `<style>` tag na konci komponenty, ne externi CSS soubor
3. **Inline preklady** — texty v `useMemo`, ne v LanguageContext slovniku
4. **Bez formalni validace** — Save je mozny i s nekonzistentnimi daty (normalizace to zachrani)
5. **Bez undo/redo** — zmeny se ukladaji jednoraze, nelze se vratit
6. **Bez importu/exportu** — config nelze exportovat/importovat jako JSON
7. **Duplikovane utility funkce** — `safeNum()` a `createId()` jsou definovany v obou souborech i ve storage helperech (celkem 4x `safeNum`)
8. **Data zatim nekonzumovana** — express:v1 a shipping:v1 data nejsou integrovana do pricing engine ani kalkulacky

### AdminExpress specificke

9. **deepClone importovano ale nepouzito** — funkce je definovana (radek 21) ale nikde v kodu volana
10. **Customer preview nezobrazuje neaktivni tiery** — filtruje `tiers.filter(t => t.active)`, coz je spravne chovani ale muze byt matouci pri editaci neaktivniho tieru

### AdminShipping specificke

11. **delivery_days_min > delivery_days_max** — neni validovano, uzivatel muze nastavit MIN vetsi nez MAX
12. **Weight tiers neserazene** — `max_weight_g` nemusi byt vzestupne, neni vizualni upozorneni
13. **Chybi admin-page background** — AdminShipping nema explicitni `background: var(--forge-bg-void)` na `.admin-page` (AdminExpress ho ma)
