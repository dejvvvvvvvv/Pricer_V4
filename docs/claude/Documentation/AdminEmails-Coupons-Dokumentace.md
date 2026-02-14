# AdminEmails & AdminCoupons — Dokumentace

> Phase 3 lazy-loaded admin stranky pro konfiguraci emailovych notifikaci a slevoveho systemu
> (kupony + promocni akce). Obe stranky sdileji architekturalni vzor: 3-tabove rozhrani,
> tenant-scoped V1 storage, dirty tracking se snapshot porovnanim, Forge design tokeny.

---

## 1. Prehled

### AdminEmails (`/admin/emails`)

Admin stranka pro konfiguraci emailovych notifikaci. Poskytuje:

- **Templates tab** — seznam emailovych triggeru (event -> template_id), kazdy s enable/disable togglem a subject line
- **Provider tab** — konfigurace emailoveho poskytovatele (SMTP / Resend / SendGrid / None) s bezpecnostnimi poznamkami
- **Log tab** — historie odeslanych emailu z localStorage (read-only tabulka)
- **Dirty tracking** — status pill (Ulozeno / Neulozene zmeny) s JSON snapshot porovnanim
- **Save / Reset** — globalni ukladani cele konfigurace, reset na posledni ulozenou verzi

Celkovy rozsah: ~638 radku v jednom souboru vcetne inline `<style>` bloku.

### AdminCoupons (`/admin/coupons`)

Admin stranka pro spravu slevovych kuponu a promocnich akci. Poskytuje:

- **Coupons tab** — CRUD seznam slevovych kodu (code, type, value, min order, max uses, validity, active toggle, applies_to)
- **Promotions tab** — CRUD seznam promocnich akci (name, type, value, banner text+color, auto_apply, coupon_code, validity)
- **Settings tab** — globalni pravidla pro slevy (stacking, max discount cap)
- **Global enabled toggle** — master switch pro cely slevovy system
- **Tab badge** — pocet polozek v Coupons a Promotions tabech
- **Banner preview** — live nahled promocniho banneru s custom barvou a textem
- **Dirty tracking** — identicky vzor jako AdminEmails

Celkovy rozsah: ~989 radku v jednom souboru vcetne inline `<style>` bloku.

---

## 2. Technologie a jazyk

| Polozka | AdminEmails | AdminCoupons |
|---------|-------------|--------------|
| Framework | React 19 | React 19 |
| Bundler | Vite | Vite |
| Jazyk | JavaScript + JSX | JavaScript + JSX |
| Styling | Forge design tokeny (CSS vars) + inline `<style>` blok | Forge design tokeny (CSS vars) + inline `<style>` blok |
| Routing | React Router v6, lazy-loaded (`React.lazy`) | React Router v6, lazy-loaded (`React.lazy`) |
| i18n | `useLanguage()` hook z `LanguageContext.jsx` (CS/EN) | `useLanguage()` hook z `LanguageContext.jsx` (CS/EN) |
| UI komponenty | `ForgeCheckbox`, `Icon` (AppIcon) | `ForgeCheckbox`, `Icon` (AppIcon) |
| Storage | `adminEmailStorage.js` (namespace `email:v1`) | `adminCouponsStorage.js` (namespace `coupons:v1`) |
| Lazy loading | `React.lazy(() => import('./pages/admin/AdminEmails'))` | `React.lazy(() => import('./pages/admin/AdminCoupons'))` |

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminEmails.jsx               — 638 radku, export default AdminEmails
  AdminCoupons.jsx              — 989 radku, export default AdminCoupons

src/utils/
  adminEmailStorage.js          — Storage helper pro email config (98 radku)
  adminCouponsStorage.js        — Storage helper pro coupons config (143 radku)
```

Ani jedna stranka NEMA vlastni subkomponenty. Veskera logika, renderovani i CSS jsou v jednom souboru.

### Externi zavislosti (importy)

**AdminEmails:**

```
src/components/AppIcon.jsx                        — Ikony (lucide-react wrapper)
src/components/ui/forge/ForgeCheckbox.jsx          — Checkbox s labelem
src/contexts/LanguageContext.jsx                   — i18n hook (useLanguage)
src/utils/adminEmailStorage.js                     — loadEmailConfigV1, saveEmailConfigV1
src/utils/adminTenantStorage.js                    — readTenantJson (pro email-log:v1)
```

**AdminCoupons:**

```
src/components/AppIcon.jsx                        — Ikony (lucide-react wrapper)
src/components/ui/forge/ForgeCheckbox.jsx          — Checkbox s labelem
src/contexts/LanguageContext.jsx                   — i18n hook (useLanguage)
src/utils/adminCouponsStorage.js                   — loadCouponsConfigV1, saveCouponsConfigV1
```

### Registrace v Routes.jsx

Obe stranky jsou registrovane jako lazy-loaded routy v `src/Routes.jsx` (radky 35-36, 111-112):

```jsx
const AdminEmails = React.lazy(() => import('./pages/admin/AdminEmails'));
const AdminCoupons = React.lazy(() => import('./pages/admin/AdminCoupons'));

// Uvnitr AdminLayout:
<Route path="emails" element={<Suspense fallback={...}><AdminEmails /></Suspense>} />
<Route path="coupons" element={<Suspense fallback={...}><AdminCoupons /></Suspense>} />
```

---

## 4. Data model

### 4.1 Email Config objekt (email:v1)

```javascript
{
  schema_version: 1,
  provider: 'none',                    // 'none' | 'smtp' | 'resend' | 'sendgrid'
  sender_name: '',                     // Jmeno odesilatele
  sender_email: '',                    // Email odesilatele
  triggers: [                          // Pole emailovych triggeru
    {
      event: 'order_confirmed',        // Identifikator eventu
      enabled: false,                  // Zapnuto/vypnuto
      template_id: 'order_confirmed',  // Reference na sablonu
    },
  ],
  templates: {                         // Mapa event -> template metadata
    order_confirmed: {
      subject: 'Vase objednavka...',   // Predmet emailu
    },
  },
  // SMTP-specificke fieldy (pokud provider=smtp):
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  // API provider fieldy (pokud provider=resend/sendgrid):
  api_key_name: '',                    // Nazev env promenne (NE samotny klic!)
  updated_at: '2026-...',
}
```

### 4.2 Predefinovane eventy (EVENT_LABELS)

| Event | CS | EN |
|-------|----|----|
| `order_confirmed` | Objednavka potvrzena | Order confirmed |
| `order_printing` | Tisk zahajen | Printing started |
| `order_shipped` | Objednavka odeslana | Order shipped |
| `order_completed` | Objednavka dokoncena | Order completed |

Uzivatel muze pridat vlastni triggery s custom event nazvem (`custom_*`).

### 4.3 Email Log objekt (email-log:v1)

```javascript
[
  {
    date: '2026-02-13T12:00:00.000Z',  // ISO datum odeslani
    recipient: 'user@example.com',      // Prijemce
    subject: 'Objednavka potvrzena',    // Predmet
    status: 'sent',                     // 'sent' | 'failed'
    event: 'order_confirmed',           // Puvodni trigger
  },
]
```

Poznamka: Log se nacita primo pres `readTenantJson('email-log:v1', [])`, nikoliv pres dedicovany storage helper. Stranka log jen zobrazuje (read-only).

### 4.4 Provider Options

| Provider | CS label | EN label | Konfigurace |
|----------|----------|----------|-------------|
| `none` | Zadny (vypnuto) | None (disabled) | Zadna |
| `smtp` | SMTP | SMTP | host, port, username (heslo v .env) |
| `resend` | Resend | Resend | api_key_name (klic v .env) |
| `sendgrid` | SendGrid | SendGrid | api_key_name (klic v .env) |

### 4.5 Coupons Config objekt (coupons:v1)

```javascript
{
  schema_version: 1,
  enabled: false,                      // Master switch — cely slevovy system
  coupons: [                           // Pole slevovych kuponu
    {
      id: 'cpn-550e8400-...',          // Unikatni ID
      code: 'SLEVA20',                // Slevovy kod (uppercase)
      type: 'percent',                // 'percent' | 'fixed' | 'free_shipping'
      value: 20,                       // Hodnota slevy (% nebo CZK)
      min_order_total: 0,              // Minimalni objednavka (0 = bez minima)
      max_uses: 0,                     // Max. pouziti (0 = neomezeno)
      used_count: 0,                   // Pocet pouziti
      starts_at: '',                   // ISO datum (prazdny = bez omezeni)
      expires_at: '',                  // ISO datum (prazdny = bez omezeni)
      active: true,                    // Aktivni/neaktivni
      created_at: '2026-...',          // Datum vytvoreni
      applies_to: 'all',              // 'all' | 'category' | 'specific_models'
    },
  ],
  promotions: [                        // Pole promocnich akci
    {
      id: 'promo-550e8400-...',        // Unikatni ID
      name: 'Letni sleva',            // Nazev akce
      type: 'percent',                // 'percent' | 'fixed'
      value: 10,                       // Hodnota slevy
      banner_text: 'Sleva 10%!',      // Text pro banner
      banner_color: '#3b82f6',         // Barva banneru (hex)
      starts_at: '',                   // ISO datum
      expires_at: '',                  // ISO datum
      auto_apply: false,               // Automaticka aplikace (bez kodu)
      active: true,                    // Aktivni/neaktivni
      coupon_code: '',                 // Volitelny kuponovy kod pro aktivaci
    },
  ],
  settings: {
    allow_stacking: false,             // Povoleni kombinace slev
    max_discount_percent: 100,         // Maximalni celkova sleva v % (100 = bez limitu)
  },
  updated_at: '2026-...',
}
```

### 4.6 Coupon Type Options

| Type | CS | EN | Popis |
|------|----|----|-------|
| `percent` | Procento (%) | Percent (%) | Procentualni sleva z ceny |
| `fixed` | Pevna castka (CZK) | Fixed amount (CZK) | Absolutni castka slevy |
| `free_shipping` | Doprava zdarma | Free shipping | Nuluje shipping fee |

### 4.7 Promotion Type Options

| Type | CS | EN |
|------|----|----|
| `percent` | Procento (%) | Percent (%) |
| `fixed` | Pevna castka (CZK) | Fixed amount (CZK) |

Poznamka: Promotions nemaji `free_shipping` typ — to je vyhrazeno pro kupony.

### 4.8 Applies To Options (kupony)

| Value | CS | EN |
|-------|----|----|
| `all` | Vse | All |
| `category` | Kategorie | Category |
| `specific_models` | Konkretni modely | Specific models |

### 4.9 Storage format

Email config se uklada pres `adminEmailStorage.js`:
```
Klic: modelpricer:${tenantId}:email:v1
```

Email log se cte primo pres `readTenantJson`:
```
Klic: modelpricer:${tenantId}:email-log:v1
```

Coupons config se uklada pres `adminCouponsStorage.js`:
```
Klic: modelpricer:${tenantId}:coupons:v1
```

---

## 5. Klicove funkce a logika

### 5.1 Sdilene helper funkce (obe stranky)

| Funkce | Umisteni | Ucel |
|--------|----------|------|
| `createId(prefix)` | Obe stranky (inline) | UUID generator (crypto.randomUUID nebo Date.now+random fallback) |
| `safeNum(v, fallback)` | AdminCoupons (inline) | Bezpecna konverze na cislo, NaN vraci fallback |

### 5.2 AdminEmails — specificke funkce

| Funkce | Ucel |
|--------|------|
| `updateConfig(patch)` | Merge patch do root config objektu |
| `updateTrigger(idx, patch)` | Update konkretniho triggeru v poli (immutable) |
| `addTrigger()` | Prida novy custom trigger s unikatnim event nazvem |
| `removeTrigger(idx)` | Smaze trigger na indexu idx |
| `updateTemplate(event, patch)` | Update template metadata pro dany event |
| `handleSave()` | Ulozi config pres `saveEmailConfigV1()`, aktualizuje snapshot |
| `handleReset()` | Obnovi config ze storage (s confirm dialogem) |

### 5.3 AdminCoupons — specificke funkce

| Funkce | Ucel |
|--------|------|
| `updateConfig(patch)` | Merge patch do root config objektu |
| `updateSettings(patch)` | Merge patch do config.settings objektu |
| `updateCoupon(idx, patch)` | Update konkretniho kuponu v poli (immutable) |
| `addCoupon()` | Prida novy kupon s default hodnotami |
| `removeCoupon(idx)` | Smaze kupon (s confirm dialogem) |
| `updatePromotion(idx, patch)` | Update konkretni promoce v poli (immutable) |
| `addPromotion()` | Prida novou promocni akci s default hodnotami |
| `removePromotion(idx)` | Smaze promocni akci (s confirm dialogem) |
| `handleSave()` | Ulozi config pres `saveCouponsConfigV1()`, aktualizuje snapshot |
| `handleReset()` | Obnovi config ze storage (s confirm dialogem) |

### 5.4 Dirty tracking (obe stranky)

Obe stranky pouzivaji identicky vzor pro detekci neulozenych zmen:

```javascript
const [savedSnapshot, setSavedSnapshot] = useState('');

// Pri load:
setSavedSnapshot(JSON.stringify(cfg));

// Dirty detection:
const dirty = useMemo(() => {
  if (!config) return false;
  return savedSnapshot !== JSON.stringify(config);
}, [config, savedSnapshot]);
```

Vizualni indikace: `status-pill` s ikonou (AlertCircle pro dirty, CheckCircle2 pro clean).

### 5.5 Storage helper funkce

**adminEmailStorage.js:**

| Funkce | Export | Ucel |
|--------|--------|------|
| `getDefaultEmailConfigV1()` | named | Vrati default konfiguraci s predefinovanymi triggery |
| `normalizeEmailConfigV1(input)` | named | Normalizuje vstupni data (sanitizace, defaults) |
| `loadEmailConfigV1()` | named | Nacte z localStorage, pri prvnim cteni seedne defaults |
| `saveEmailConfigV1(data)` | named | Normalizuje a ulozi do localStorage |

Interni funkce: `nowIso()`, `parseBool()`, `uuid()`, `normalizeTrigger()`.

**adminCouponsStorage.js:**

| Funkce | Export | Ucel |
|--------|--------|------|
| `getDefaultCouponsConfigV1()` | named | Vrati prazdny default config (enabled=false) |
| `normalizeCouponsConfigV1(input)` | named | Normalizuje vsechny coupons, promotions, settings |
| `loadCouponsConfigV1()` | named | Nacte z localStorage, pri prvnim cteni seedne defaults |
| `saveCouponsConfigV1(data)` | named | Normalizuje a ulozi do localStorage |

Interni funkce: `nowIso()`, `safeNum()`, `parseBool()`, `uuid()`, `normalizeCoupon()`, `normalizePromotion()`, `normalizeSettings()`.

### 5.6 Normalizace kuponove dat

`normalizeCoupon()` vynucuje:
- Povolene typy: `percent`, `fixed`, `free_shipping` (jinak fallback `percent`)
- Povolene applies_to: `all`, `category`, `specific_models` (jinak fallback `all`)
- Code je vzdy uppercase
- Numericke hodnoty pres `safeNum()` (fallback 0)
- ID se generuje pokud chybi

`normalizePromotion()` vynucuje:
- Povolene typy: `percent`, `fixed` (jinak fallback `percent`)
- Coupon code je vzdy uppercase
- Default banner_color: `#3b82f6`
- Default name: `Promotion ${idx + 1}`

`normalizeSettings()` vynucuje:
- `allow_stacking` je boolean (default false)
- `max_discount_percent` je cislo (default 100)

---

## 8. UI struktura

### 8.1 AdminEmails — page layout

```
admin-page (max-width 1320px, forge-bg-void)
  |-- admin-header (title + subtitle + status pill + Reset btn + Save btn)
  |-- banner (success/error notifikace, podmincene)
  |-- tab-bar (3 taby: Sablony, Provider, Log)
  |-- tab-content
       |
       |-- [templates tab]
       |    |-- admin-card
       |         |-- card-header (title + "Pridat trigger" btn)
       |         |-- card-body
       |              |-- empty-state (pokud zadne triggery)
       |              |-- trigger-list
       |                   |-- trigger-row * N
       |                        |-- trigger-header (checkbox + event name + delete btn)
       |                        |-- trigger-fields (template_id + subject inputs)
       |
       |-- [provider tab]
       |    |-- admin-card
       |         |-- card-header (title + description)
       |         |-- card-body
       |              |-- provider select
       |              |-- [smtp] SMTP nastaveni (host, port, username, heslo poznamka)
       |              |-- [resend/sendgrid] API key name input
       |              |-- [!none] Sender nastaveni (name + email)
       |
       |-- [log tab]
            |-- admin-card
                 |-- card-header (title + description)
                 |-- card-body
                      |-- empty-state (pokud zadne zaznamy)
                      |-- log-table
                           |-- log-header (Datum, Prijemce, Predmet, Stav, Trigger)
                           |-- log-row * N
```

### 8.2 AdminCoupons — page layout

```
admin-page (max-width 1320px)
  |-- admin-header (title + subtitle + status pill + Reset btn + Save btn)
  |-- banner (success/error notifikace, podmincene)
  |-- global-enable card (ForgeCheckbox: "Kupony a akce zapnuty")
  |-- tab-bar (3 taby: Kupony [badge], Akce [badge], Nastaveni)
  |-- tab-content
       |
       |-- [coupons tab]
       |    |-- admin-card
       |         |-- card-header (title + "Pridat kupon" btn)
       |         |-- card-body
       |              |-- empty-state (pokud zadne kupony)
       |              |-- item-list
       |                   |-- item-row * N
       |                        |-- item-header (checkbox + code + type info + usage badge + delete btn)
       |                        |-- item-fields grid3 (code, type, value)
       |                        |-- item-fields grid3 (min order, max uses, applies_to)
       |                        |-- item-fields grid2 (valid from, valid until)
       |
       |-- [promotions tab]
       |    |-- admin-card
       |         |-- card-header (title + "Pridat akci" btn)
       |         |-- card-body
       |              |-- empty-state (pokud zadne akce)
       |              |-- item-list
       |                   |-- item-row * N
       |                        |-- item-header (checkbox + name + type info + auto badge + delete btn)
       |                        |-- item-fields grid3 (name, type, value)
       |                        |-- item-fields grid2 (banner text, banner color picker)
       |                        |-- item-fields grid3 (coupon code, valid from, valid until)
       |                        |-- auto-apply checkbox
       |                        |-- banner-preview (live preview, podmincene)
       |
       |-- [settings tab]
            |-- admin-card
                 |-- card-header (title + description)
                 |-- card-body
                      |-- settings-grid
                      |    |-- settings-row (Allow stacking toggle)
                      |    |-- settings-row (Max discount % input)
                      |-- info-box (poznamka o aplikaci nastaveni)
```

### 8.3 Tab navigace

**AdminEmails taby:**

| Tab | ID | Ikona | Obsah |
|-----|----|-------|-------|
| Sablony / Templates | `templates` | Mail | Event triggery s enable/disable a subject |
| Provider | `provider` | Settings | Vyber a konfigurace email providera |
| Log | `log` | FileText | Read-only tabulka odeslanych emailu |

**AdminCoupons taby:**

| Tab | ID | Ikona | Obsah |
|-----|----|-------|-------|
| Kupony / Coupons | `coupons` | Ticket | CRUD seznam slevovych kodu (s badge poctem) |
| Akce / Promotions | `promotions` | Megaphone | CRUD seznam promocnich akci (s badge poctem) |
| Nastaveni / Settings | `settings` | Settings | Globalni pravidla (stacking, max discount) |

### 8.4 Bezpecnostni prvky (AdminEmails)

SMTP heslo se NIKDY neuklada do localStorage. Misto toho se zobrazuje security-note:
```
"Heslo se nastavuje v .env souboru na serveru (nikdy ne v prohlizeci)."
```

Pro Resend/SendGrid se uklada pouze nazev env promenne (napr. `RESEND_API_KEY`), nikoliv samotny API klic:
```
"Samotny API klic patri do .env souboru na serveru. Zde uloz pouze nazev env promenne."
```

### 8.5 Banner preview (AdminCoupons)

Kazda promoce s neprazdnym `banner_text` zobrazuje live preview banneru:
- Barva pozadi: `promo.banner_color` (default `#3b82f6`)
- Barva textu: vzdy `#fff`
- Padding, border-radius, centered text
- Color picker: kombinace native `<input type="color">` + textovy hex input

---

## 9. Preklady (i18n)

Vsechny user-facing texty jsou lokalizovane inline pres `useMemo` objekt `ui` s CS/EN variantami.
Preklady NEJSOU v LanguageContext, ale primo v komponente.

### AdminEmails — klicove preklady

| Klic | CS | EN |
|------|----|----|
| title | Emailove notifikace | Email Notifications |
| subtitle | Nastaveni emailovych triggeru, providera... | Configure email triggers, provider... |
| save/saved/saving | Ulozit / Ulozeno / Ukladam... | Save / Saved / Saving... |
| unsaved | Neulozene zmeny | Unsaved changes |

Dalsi texty (tab labels, card headers, placeholders) jsou taktez inline lokalizovane pres ternary `cs ? '...' : '...'`.

### AdminCoupons — klicove preklady

| Klic | CS | EN |
|------|----|----|
| title | Kupony a akce | Coupons & Promotions |
| subtitle | Spravujte slevove kupony, automaticke akce... | Manage discount coupons, auto-apply promotions... |
| save/saved/saving | Ulozit / Ulozeno / Ukladam... | Save / Saved / Saving... |
| unsaved | Neulozene zmeny | Unsaved changes |

Tab labels, card headers, field labels, help texty a confirm dialogy jsou taktez inline lokalizovane.

---

## 11. Navaznosti na dalsi systemy

### 11.1 AdminTenantStorage

Obe storage helpery (`adminEmailStorage.js`, `adminCouponsStorage.js`) importuji `readTenantJson` a `writeTenantJson` z `adminTenantStorage.js`. Tenant-scoping je automaticky — klice maji format `modelpricer:${tenantId}:${namespace}`.

### 11.2 Test-kalkulacka a widget-kalkulacka (budouci integrace)

Aktualne AdminCoupons NEMA aktivni integraci s kalkulackami. Slevovy system je pripraveny v admin panelu, ale:
- Kalkulacka zatim nevaliduje slevove kody
- Pricing engine V3 zatim nezahrnuje kuponovy pipeline step
- Toto je planovano pro budouci fazi

### 11.3 Order flow (budouci integrace)

AdminEmails triggery (`order_confirmed`, `order_printing`, atd.) predpokladaji backend ktery:
1. Odesila emaily pri zmene stavu objednavky
2. Zapisuje do `email-log:v1` logu
3. Pouziva nastavenou provider konfiguraci

Aktualne backend tuto funkcionalitu NEMA — admin stranka je pripravena pro budouci backend integraci.

### 11.4 AdminEmailStorage (adminEmailStorage.js)

| Funkce | Ucel |
|--------|------|
| `loadEmailConfigV1()` | Nacte config, pri prvnim cteni seedne defaults s 4 triggery |
| `saveEmailConfigV1(data)` | Normalizuje a ulozi (updated_at se nastavi) |
| `normalizeEmailConfigV1(input)` | Sanitizace vsech poli, normalizace triggeru |
| `getDefaultEmailConfigV1()` | Default config s predefinovanymi triggery |

Namespace: `email:v1`, tenant-scoped pres `readTenantJson` / `writeTenantJson`.

### 11.5 AdminCouponsStorage (adminCouponsStorage.js)

| Funkce | Ucel |
|--------|------|
| `loadCouponsConfigV1()` | Nacte config, pri prvnim cteni seedne defaults (enabled=false) |
| `saveCouponsConfigV1(data)` | Normalizuje a ulozi (updated_at se nastavi) |
| `normalizeCouponsConfigV1(input)` | Sanitizace vsech poli, normalizace coupons/promotions/settings |
| `getDefaultCouponsConfigV1()` | Default config s prazdnymi poli |

Namespace: `coupons:v1`, tenant-scoped pres `readTenantJson` / `writeTenantJson`.

---

## 15. Podrobne chovani komponent

### 15.1 AdminEmails — trigger management

- **Predefinovane eventy** (4): `order_confirmed`, `order_printing`, `order_shipped`, `order_completed` — kazdy ma CS/EN label v `EVENT_LABELS` konstanty
- **Custom triggery**: Uzivatel muze pridat novy trigger tlacitkem "Pridat trigger". Novy trigger dostane unikatni event nazev `custom_${UUID}` a je defaultne vypnuty
- **Smazani**: Trigger se smaze okamzite bez confirm dialogu (na rozdil od AdminCoupons kde je confirm)
- **Template ID a Subject**: Kazdy trigger ma template_id (reference na sablonu) a subject (predmet emailu). Subject se uklada v `config.templates[event].subject`

### 15.2 AdminEmails — provider konfigurace

Provider konfigurace se zobrazuje podmincene:

```
provider = 'none'     -> zadne dalsi fieldy
provider = 'smtp'     -> host, port, username, security note (heslo v .env)
provider = 'resend'   -> api_key_name input s help textem
provider = 'sendgrid' -> api_key_name input s help textem
provider != 'none'    -> sender_name + sender_email (spolecne pro vsechny providery)
```

### 15.3 AdminEmails — email log

Log tabulka ma 5 sloupcu s fixnim grid layoutem:
- `170px | 180px | 1fr | 90px | 130px`
- Na mobilech (`<900px`) se zobrazuji pouze Datum a Prijemce (ostatni skryty)
- Datumy se formatuji pres `new Date().toLocaleString()` s `cs-CZ` / `en-US` locale
- Status ma barevnou indikaci: `sent` (zelena), `failed` (cervena)

### 15.4 AdminCoupons — kupon lifecycle

1. **Vytvoreni**: `addCoupon()` generuje novy kupon s `id: createId('cpn')`, type `percent`, value `10`, active `true`
2. **Editace**: Vsechna pole jsou editovatelna inline (neni modal editor). Code se automaticky uppercase-uje
3. **Smazani**: `removeCoupon(idx)` s confirm dialogem
4. **Active/inactive**: ForgeCheckbox toggle na kazdem kuponu
5. **Usage tracking**: `used_count / max_uses` se zobrazuje jako badge (pokud max_uses > 0)

### 15.5 AdminCoupons — promoce lifecycle

1. **Vytvoreni**: `addPromotion()` generuje novou promocni akci s `id: createId('promo')`, type `percent`, value `10`, auto_apply `false`
2. **Editace**: Vsechna pole inline. Coupon code se uppercase-uje
3. **Smazani**: `removePromotion(idx)` s confirm dialogem
4. **Auto-apply**: Checkbox urcuje zda se sleva aplikuje automaticky (bez zadani kodu)
5. **Banner preview**: Pokud `banner_text` neni prazdny, zobrazuje se live preview s custom barvou

### 15.6 AdminCoupons — Settings tab

Dva nastaveni:

1. **Allow stacking** (ForgeCheckbox)
   - Pokud zapnuto: zakaznik muze pouzit vice slevovych kodu najednou
   - Default: false (vypnuto)

2. **Max discount percent** (number input, range 0-100)
   - Horni limit celkove slevy v procentech
   - 100 = bez limitu
   - Default: 100
   - Input je clamped na rozsah 0-100 pres `Math.min/Math.max`

---

## 16. Inline CSS styly

### 16.1 AdminEmails CSS (~162 radku)

Definuje styly pro:
- `.admin-page`, `.admin-header`, `.header-actions` — zakladni layout
- `.status-pill` (clean/dirty) — indikator stavu
- `.btn-primary`, `.btn-secondary` — akce tlacitka
- `.banner` (success/error) — notifikacni banner
- `.tab-bar`, `.tab-btn` — tab navigace
- `.admin-card`, `.card-header`, `.card-body` — karta
- `.trigger-list`, `.trigger-row`, `.trigger-header`, `.trigger-fields` — trigger layout
- `.log-table`, `.log-header`, `.log-row` — email log tabulka
- `.security-note` — bezpecnostni upozorneni (warning barva)
- `.input`, `.field label` — formularove prvky
- Responsive: `@media (max-width: 640px)` pro grid2, `@media (max-width: 900px)` pro log tabulku

### 16.2 AdminCoupons CSS (~203 radku)

Definuje navic oproti AdminEmails:
- `.badge` — pocet polozek v tab tlacitku
- `.item-list`, `.item-row`, `.item-header`, `.item-left`, `.item-right` — kupon/promoce layout
- `.item-name` — accent-primary barva, tech font (pro kupon kod)
- `.item-name-text` — standardni text barva (pro nazev promoce)
- `.usage-badge` — pouziti kuponu (napr. "3/10")
- `.auto-badge` — indikator automaticke aplikace (zelena)
- `.settings-grid`, `.settings-row`, `.settings-label`, `.settings-description` — settings layout
- `.info-box` — informacni box s accent barvou
- `.grid3` — tri-sloupcovy grid (responsivni)
- `.icon-btn.danger` — cervena trash ikona pri hoveru
- Responsive: `@media (max-width: 768px)` pro header, `@media (max-width: 900px)` pro grid3

### 16.3 Vizualni rozdily mezi strankami

I pres sdileny vzor existuji drobne vizualni nekonzistence:

| Prvek | AdminEmails | AdminCoupons |
|-------|-------------|--------------|
| h1 font-family | `var(--forge-font-heading)` | chybi (defaultni) |
| status-pill dirty barva | warning (zluta) | error (cervena) |
| admin-card border-radius | `var(--forge-radius-xl)` | `var(--forge-radius-md)` |
| card-header h2 font-size | 16px, heading font | 11px, tech font, uppercase |
| btn-primary text | bez uppercase | uppercase s letter-spacing |
| admin-page background | `var(--forge-bg-void)` | implicitni (chybi) |

Tyto rozdily jsou zdokumentovany v Design Error Logu.

---

## 17. Validace

### 17.1 AdminEmails — validace

AdminEmails NEMA explicitni validacni logiku. Formularova pole nemaji required atributy ani validacni hlasky.

Potencialni problemy:
- Prazdny template_id je povoleny
- Prazdny subject je povoleny
- Neplatny email odesilatele neni validovany (jen `type="email"` na inputu)
- SMTP port muze byt 0 nebo zaporne cislo (jen `type="number"`)

### 17.2 AdminCoupons — validace

AdminCoupons taktez NEMA explicitni validacni logiku. Vsechna pole jsou bez required validace.

Potencialni problemy:
- Kupon bez kodu je povoleny (zobrazuje se "(bez kodu)")
- Duplicitni kody nejsou detekovany
- Promoce bez nazvu je povolena (zobrazuje se "(bez nazvu)")
- Hodnota muze byt 0 nebo zaporna (neni clamped)
- Min_order_total muze byt zaporne cislo
- Dates nejsou validovany (expires_at muze byt pred starts_at)

### 17.3 Storage-level normalizace

Obrana proti invalidnim datum je castecne resena na storage urovni:
- Storage helpery pouzivaji `safeNum()` pro numericke hodnoty
- `parseBool()` pro boolean fieldy
- Type/applies_to jsou validovany proti allowlists s fallback hodnotami
- Code/coupon_code jsou forcovany na uppercase

Toto vsak nezabranuje ulozeni logicky nekonzistentnich dat (napr. expires < starts).

---

## Appendix: Konstanty

### AdminEmails

**PROVIDER_OPTIONS:** `none`, `smtp`, `resend`, `sendgrid`

**EVENT_LABELS:** `order_confirmed`, `order_printing`, `order_shipped`, `order_completed`

**TABS:** `templates`, `provider`, `log`

### AdminCoupons

**COUPON_TYPE_OPTIONS:** `percent`, `fixed`, `free_shipping`

**PROMO_TYPE_OPTIONS:** `percent`, `fixed`

**APPLIES_TO_OPTIONS:** `all`, `category`, `specific_models`

**TABS:** `coupons`, `promotions`, `settings`

---

## Appendix: State management prehled

### AdminEmails useState hooks

| State | Typ | Default | Ucel |
|-------|-----|---------|------|
| `loading` | boolean | true | Inicializacni spinner |
| `saving` | boolean | false | Probiha ukladani |
| `config` | object/null | null | Hlavni konfiguracni objekt |
| `activeTab` | string | 'templates' | Aktivni tab |
| `emailLog` | array | [] | Historie odeslanych emailu |
| `banner` | object/null | null | Notifikacni banner {type, text} |
| `savedSnapshot` | string | '' | JSON snapshot pro dirty detekci |

### AdminEmails useMemo hooks

| Memo | Ucel |
|------|------|
| `dirty` | Porovnani aktualniho config s ulozenym snapshotem |
| `ui` | Prekladove texty (CS/EN) |

### AdminCoupons useState hooks

| State | Typ | Default | Ucel |
|-------|-----|---------|------|
| `loading` | boolean | true | Inicializacni spinner |
| `saving` | boolean | false | Probiha ukladani |
| `config` | object/null | null | Hlavni konfiguracni objekt |
| `activeTab` | string | 'coupons' | Aktivni tab |
| `banner` | object/null | null | Notifikacni banner {type, text} |
| `savedSnapshot` | string | '' | JSON snapshot pro dirty detekci |

### AdminCoupons useMemo hooks

| Memo | Ucel |
|------|------|
| `dirty` | Porovnani aktualniho config s ulozenym snapshotem |
| `ui` | Prekladove texty (CS/EN) |

### Data flow (spolecny vzor)

```
Init:
  loadXxxConfigV1() -> normalize -> setConfig + setSavedSnapshot

Edit flow:
  updateConfig/updateCoupon/updatePromotion(patch) -> setConfig(prev => merge)

Save flow:
  handleSave() -> saveXxxConfigV1(config) -> setConfig(normalized) + setSavedSnapshot

Reset flow:
  handleReset() -> confirm -> loadXxxConfigV1() -> setConfig + setSavedSnapshot
```

---

## Appendix: Zname omezeni

### AdminEmails

- **Vsechno v jednom souboru** — 638 radku bez subkomponent
- **Inline CSS** — styly v `<style>` tagu, ne v externim souboru
- **Log je read-only** — stranka neumoznuje mazani nebo filtraci logu
- **Bez skutecneho odesilani** — admin stranka pouze konfiguruje; backend pro odesilani emailu zatim neexistuje
- **Bez template editoru** — templates se definuji pouze referencne (template_id a subject); obsah sablony je referencovany ale neni editovatelny v admin panelu
- **Heslo se neuklada** — SMTP heslo musi byt v .env na serveru; admin panel ho nezna
- **Bez validace emailu** — sender_email pole nema validaci krome nativniho `type="email"`
- **Bez test emailu** — neni tlacitko "Odeslat testovaci email" pro overeni nastaveni
- **Email log bez paginace** — pri velkem poctu zaznamu muze byt neprehledny

### AdminCoupons

- **Vsechno v jednom souboru** — 989 radku bez subkomponent
- **Inline CSS** — styly v `<style>` tagu
- **Bez integrace s kalkulackou** — slevovy system je nakonfigurovany ale kalkulacka ho zatim nepouziva
- **Bez duplicitni detekce kodu** — dva kupony mohou mit stejny kod
- **Bez datumove validace** — expires_at muze byt pred starts_at
- **Bez importu/exportu** — kupony nelze importovat/exportovat
- **applies_to nepouzivane** — pole `category` a `specific_models` existuji v selectu ale nemaji navaznou konfiguraci (ktere kategorie? ktere modely?)
- **used_count se neinkrementuje** — admin panel umoznuje nastavit used_count ale zadny system ho automaticky nezvysuje
- **Bez vyhledavani/filtrovani** — na rozdil od AdminFees chybi fulltext vyhledavani a filtrovani kuponu
- **Banner preview omezeny** — zobrazuje se jen text + barva; neni preview umisteni na strance
