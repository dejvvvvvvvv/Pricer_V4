# V3-S02: Kontaktni formular a dokonceni objednavky

> **Priorita:** P0 | **Obtiznost:** Stredni-Vysoka | **Vlna:** 2
> **Zavislosti:** S01 (fungujici ceny, per-model konfigurace)
> **Odhadovany rozsah:** ~3000 radku novych komponent, ~500 radku storage/utils

---

## A. KONTEXT

### A1. Ucel a cil

Sekce S02 resi **kriticky chybejici krok** v objednavkovem flow: zakaznik aktualne nema
kam zadat kontaktni udaje, adresu doruceni, poznamku k objednavce, ani moznost objednavku
skutecne odeslat. Bez tohoto kroku je kalkulacka jen demo — neni mozne generovat realne
objednavky.

Co S02 pridava:
1. **Formular zakaznickych udaju** — jmeno, email, telefon, firma/ICO, adresy
2. **Poznamka k objednavce** — textarea pro specialni pozadavky
3. **Shrnuti objednavky pred odeslanim** — kompletni prehled modelu, cen, sluzeb
4. **Potvrzovaci stranka a email** — potvrzeni uspesneho odeslani, zaslani emailu

**Business value:** Toto je klicovy krok pro monetizaci produktu. Bez kontaktniho
formulare neni mozne generovat leads ani objednavky. Kazda 3D tiskova firma potrebuje
kontakt na zakaznika pro komunikaci o zakazce.

### A2. Priorita, obtiznost, vlna

- **P0** — bez tohoto kroku produkt negeneruje objednavky. Spolecne se S01 tvori
  absolutni zaklad pouzitelnosti.
- **Obtiznost: Stredni-Vysoka** — formular je standardni, ale dynamicka konfigurace
  poli v admin panelu, validace, GDPR checkbox a email odeslani zvysuji slozitost.
- **Vlna 2** — musi nasledovat po S01, protoze shrnuti objednavky zobrazuje ceny,
  ktere S01 opravuje.

### A3. Zavislosti na jinych sekcich

| Smer | Sekce | Typ zavislosti |
|------|-------|----------------|
| **S02 zavisi na S01** | Bug fixes | Fungujici ceny pro shrnuti objednavky |
| **S04 zavisi na S02** | Doprava | Doprava se zobrazuje v kroku 3, pred odeslanim |
| **S07 rozsiruje S02** | Emailove notifikace | Detailni email system; S02 implementuje zakladni |
| **S12 rozsiruje S02** | Zakaznicky portal | Predvyplneni formulare pro prihlasene zakazniky |
| **S13 vyuziva S02** | Generovani dokumentu | PDF shrnuti objednavky |

### A4. Soucasny stav v codebase

**Existujici soubory relevantni pro S02:**

| Soubor | Umisteni | Stav |
|--------|----------|------|
| Hlavni kalkulacka | `src/pages/test-kalkulacka/index.jsx` | Ma 3 kroky, chybi krok 4 (kontakt) |
| Print konfigurace | `src/pages/test-kalkulacka/components/PrintConfiguration.jsx` | Krok 2 — konfigurace |
| Pricing calculator | `src/pages/test-kalkulacka/components/PricingCalculator.jsx` | Krok 3 — zobrazeni ceny |
| Orders storage | `src/utils/adminOrdersStorage.js` | CRUD objednavek, demo data, namespace `orders:v1` |
| Admin Orders | `src/pages/admin/AdminOrders.jsx` | Zobrazeni objednavek v admin panelu |
| Tenant storage | `src/utils/adminTenantStorage.js` | `readTenantJson()`, `writeTenantJson()` |
| Admin Widget | `src/pages/admin/AdminWidget.jsx` | Konfigurace widgetu — sem pridat form config |
| i18n | `src/i18n.js` | Zaklad i18n, `useLanguage()` hook |
| Routes | `src/Routes.jsx` | Routing — bez zmen (formular je soucasti kalkulacky) |

**Co uz existuje:**
- `adminOrdersStorage.js` ma kompletni CRUD pro objednavky (namespace `orders:v1`)
- `computeOrderTotals()` pocita celkovou cenu objednavky
- `ORDER_STATUSES` — workflow stavy objednavky (NEW, REVIEW, APPROVED, ...)
- `AdminOrders.jsx` zobrazuje objednavky v admin panelu
- Step-based flow v kalkulacce (`currentStep` state, kroky 1-3)

**Co chybi:**
- Krok 4 "Kontaktni udaje" nebo rozsireni kroku 3
- React komponenty pro formular (inputy, validace)
- GDPR checkbox
- Textarea poznamky
- Kompletni shrnuti objednavky
- Potvrzovaci stranka
- Zakladni email odeslani
- Admin konfigurace formularovych poli

### A5. Referencni zdroje a konkurence

**OSS knihovny doporucene pro S02:**

| Knihovna | Ucel | Github hvezdy |
|----------|------|---------------|
| **React Hook Form** (react-hook-form) | Form library s minimalnimi re-rendery | 41k+ |
| **Zod** (colinhacks/zod) | TypeScript-first schema validace | 33k+ |
| **Yup** (jquense/yup) | Alternativa k Zod, maturejsi | 22k+ |
| **Nodemailer** (nodemailer) | SMTP email odeslani | 16k+ |
| **Resend** (resend) | Moderni email API | - |

**Doporuceni:** `React Hook Form` + `Zod` pro validaci. Pro email v MVP staci
jednoduchy fetch na backend endpoint ktery posle email.

**Konkurence:**
- Xometry: 2-krokovy checkout (kontakt + shrnuti), GDPR checkbox, firma/ICO pole
- Craftcloud: Single-page checkout, inline validace, poznamka k objednavce
- AutoQuote3D: Multi-step wizard s progress barem, email potvrzeni

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Order schema (rozsireni `orders:v1`):**

```json
{
  "id": "ORD-000042",
  "tenant_id": "demo-tenant",
  "status": "NEW",
  "created_at": "2026-02-06T14:30:00Z",
  "updated_at": "2026-02-06T14:30:00Z",

  "customer": {
    "first_name": "Jan",
    "last_name": "Novak",
    "email": "jan.novak@example.com",
    "phone": "+420 777 123 456",
    "company": "Firma s.r.o.",
    "ico": "12345678",
    "dic": "CZ12345678"
  },

  "shipping_address": {
    "street": "Hlavni 123",
    "city": "Praha",
    "zip": "11000",
    "country": "CZ"
  },

  "billing_address": {
    "same_as_shipping": true,
    "street": null,
    "city": null,
    "zip": null,
    "country": null
  },

  "note": "Prosim o rychle dodani, potrebuji do patku.",

  "gdpr_consent": {
    "accepted": true,
    "accepted_at": "2026-02-06T14:30:00Z",
    "version": "1.0"
  },

  "models": [
    {
      "id": "file-123",
      "filename": "cylinder.stl",
      "material": "pla",
      "color": "white",
      "quality": "standard",
      "preset_id": "preset_abc",
      "quantity": 2,
      "unit_price": 150,
      "total_price": 300,
      "slicer_snapshot": { "time_min": 45, "weight_g": 12 }
    }
  ],

  "pricing_snapshot": {
    "total": 450,
    "currency": "CZK",
    "material": 120,
    "time": 180,
    "services": 50,
    "discount": -20,
    "markup": 120,
    "shipping": 0
  },

  "cta_text": "Odeslat nezavaznou poptavku",
  "confirmation_text": "Dekujeme za Vasi objednavku!"
}
```

**Admin form config (novy namespace `form:v1`):**

```json
{
  "_schema_version": 1,
  "_updated_at": "2026-02-06T12:00:00Z",

  "fields": [
    {
      "key": "first_name",
      "label_cs": "Jmeno",
      "label_en": "First name",
      "type": "text",
      "required": true,
      "enabled": true,
      "order": 1,
      "placeholder_cs": "Zadejte jmeno",
      "placeholder_en": "Enter first name",
      "validation": { "min_length": 2, "max_length": 50 }
    },
    {
      "key": "last_name",
      "label_cs": "Prijmeni",
      "label_en": "Last name",
      "type": "text",
      "required": true,
      "enabled": true,
      "order": 2,
      "placeholder_cs": "Zadejte prijmeni",
      "placeholder_en": "Enter last name"
    },
    {
      "key": "email",
      "label_cs": "E-mail",
      "label_en": "E-mail",
      "type": "email",
      "required": true,
      "enabled": true,
      "order": 3,
      "validation": { "pattern": "email" }
    },
    {
      "key": "phone",
      "label_cs": "Telefon",
      "label_en": "Phone",
      "type": "tel",
      "required": true,
      "enabled": true,
      "order": 4,
      "validation": { "pattern": "phone_cz_intl" }
    },
    {
      "key": "company",
      "label_cs": "Firma",
      "label_en": "Company",
      "type": "text",
      "required": false,
      "enabled": true,
      "order": 5
    },
    {
      "key": "ico",
      "label_cs": "ICO",
      "label_en": "Company ID",
      "type": "text",
      "required": false,
      "enabled": false,
      "order": 6,
      "validation": { "pattern": "ico_cz" }
    },
    {
      "key": "shipping_address",
      "label_cs": "Dorucovaci adresa",
      "label_en": "Shipping address",
      "type": "address_group",
      "required": false,
      "enabled": true,
      "order": 7
    },
    {
      "key": "billing_address",
      "label_cs": "Fakturacni adresa",
      "label_en": "Billing address",
      "type": "address_group",
      "required": false,
      "enabled": false,
      "order": 8,
      "show_same_as_shipping": true
    }
  ],

  "note_enabled": true,
  "note_max_length": 1000,

  "gdpr": {
    "enabled": true,
    "text_cs": "Souhlasim se zpracovanim osobnich udaju",
    "text_en": "I agree to the processing of personal data",
    "link_cs": "/ochrana-osobnich-udaju",
    "link_en": "/privacy-policy",
    "version": "1.0"
  },

  "cta": {
    "text_cs": "Odeslat nezavaznou poptavku",
    "text_en": "Send non-binding inquiry",
    "style": "primary"
  },

  "confirmation": {
    "title_cs": "Dekujeme za Vasi objednavku!",
    "title_en": "Thank you for your order!",
    "message_cs": "Objednavku nyni zpracovavame. Na email vam prijde potvrzeni.",
    "message_en": "We are processing your order. You will receive a confirmation email.",
    "show_order_number": true,
    "show_estimated_time": true
  }
}
```

### B2. API kontrakty (endpointy)

**Novy endpoint — odeslani objednavky:**

```
POST /api/orders
  Request: {
    customer: {
      first_name: string,
      last_name: string,
      email: string,
      phone: string,
      company?: string,
      ico?: string
    },
    shipping_address?: {
      street: string,
      city: string,
      zip: string,
      country: string
    },
    billing_address?: {
      same_as_shipping: boolean,
      street?: string,
      city?: string,
      zip?: string,
      country?: string
    },
    note?: string,
    gdpr_consent: { accepted: boolean, version: string },
    models: [
      {
        file_id: string,
        filename: string,
        material: string,
        color: string,
        quality: string,
        preset_id: string,
        quantity: number
      }
    ],
    pricing_snapshot: { total: number, currency: string, ... }
  }
  Response (201): {
    order_id: string,
    order_number: string,
    status: "NEW",
    created_at: string
  }
  Errors:
    400: { error: "VALIDATION_ERROR", fields: { email: "Invalid email format" } }
    429: { error: "RATE_LIMITED", retry_after: 60 }
    500: { error: "INTERNAL_ERROR" }
```

**Novy endpoint — odeslani potvrzujiciho emailu (backend internal):**

```
POST /api/orders/:id/confirm-email
  (Interni, volany automaticky po vytvoreni objednavky)
  Response (200): { sent: true, email: "jan.novak@example.com" }
```

**Novy endpoint — nacteni form configu (pro widget):**

```
GET /api/form-config
  Response: { fields: [...], gdpr: {...}, cta: {...}, confirmation: {...} }
```

### B3. Komponentni strom (React)

```
TestKalkulacka (index.jsx)
|-- [Step 1] FileUploadZone
|-- [Step 2] PrintConfiguration + ModelViewer
|-- [Step 3] CheckoutStep                    << NOVY
|   |-- OrderSummary                         << NOVY
|   |   |-- OrderSummaryModelRow             << NOVY
|   |   |-- OrderSummaryPricing              << NOVY
|   |   +-- OrderSummaryServices             << NOVY
|   |-- ContactForm                          << NOVY
|   |   |-- FormField                        << NOVY (reusable)
|   |   |-- AddressGroup                     << NOVY
|   |   +-- GdprCheckbox                     << NOVY
|   |-- OrderNote                            << NOVY
|   +-- SubmitButton                         << NOVY
|-- [Step 4] ConfirmationPage                << NOVY
|   |-- ConfirmationIcon                     << NOVY
|   |-- OrderNumberDisplay                   << NOVY
|   +-- NextStepsInfo                        << NOVY
```

**Novy soubor: `src/pages/test-kalkulacka/components/CheckoutStep.jsx`**

```jsx
// Wireframe struktury
export default function CheckoutStep({
  uploadedFiles,
  printConfigs,
  quote,
  formConfig,
  onSubmit,
  isSubmitting,
}) {
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(checkoutSchema),
  });

  return (
    <div className="checkout-step">
      <OrderSummary
        models={uploadedFiles}
        configs={printConfigs}
        quote={quote}
      />
      <ContactForm
        fields={formConfig.fields}
        register={register}
        errors={formState.errors}
      />
      <OrderNote
        enabled={formConfig.note_enabled}
        maxLength={formConfig.note_max_length}
        register={register}
      />
      <GdprCheckbox
        config={formConfig.gdpr}
        register={register}
        error={formState.errors.gdpr_consent}
      />
      <SubmitButton
        text={formConfig.cta.text_cs}
        isSubmitting={isSubmitting}
        isValid={formState.isValid}
        onClick={handleSubmit(onSubmit)}
      />
    </div>
  );
}
```

### B4. Tenant storage namespace

| Namespace | Helper | Pouziti v S02 |
|-----------|--------|---------------|
| `form:v1` | Novy `adminFormStorage.js` | Konfigurace formularovych poli, GDPR, CTA |
| `orders:v1` | Existujici `adminOrdersStorage.js` | Ukladani novych objednavek |
| `orders:activity:v1` | Existujici `adminOrdersStorage.js` | Activity log objednavky |
| `pricing:v3` | `adminPricingStorage.js` | Pricing snapshot pro objednavku |
| `fees:v3` | `adminFeesStorage.js` | Fees snapshot pro objednavku |

**Novy storage helper: `src/utils/adminFormStorage.js`**

```js
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_FORM = 'form:v1';

export function loadFormConfig() {
  return readTenantJson(NS_FORM, getDefaultFormConfig());
}

export function saveFormConfig(config) {
  const normalized = normalizeFormConfig(config);
  writeTenantJson(NS_FORM, normalized);
  return normalized;
}

export function getDefaultFormConfig() {
  return {
    _schema_version: 1,
    fields: [
      { key: 'first_name', type: 'text', required: true, enabled: true, order: 1 },
      { key: 'last_name', type: 'text', required: true, enabled: true, order: 2 },
      { key: 'email', type: 'email', required: true, enabled: true, order: 3 },
      { key: 'phone', type: 'tel', required: true, enabled: true, order: 4 },
      { key: 'company', type: 'text', required: false, enabled: true, order: 5 },
      { key: 'ico', type: 'text', required: false, enabled: false, order: 6 },
      { key: 'shipping_address', type: 'address_group', required: false, enabled: true, order: 7 },
      { key: 'billing_address', type: 'address_group', required: false, enabled: false, order: 8 },
    ],
    note_enabled: true,
    note_max_length: 1000,
    gdpr: { enabled: true, text_cs: 'Souhlasim se zpracovanim osobnich udaju', version: '1.0' },
    cta: { text_cs: 'Odeslat nezavaznou poptavku', style: 'primary' },
    confirmation: { title_cs: 'Dekujeme!', show_order_number: true },
  };
}
```

### B5. Widget integrace (postMessage)

**Nove postMessage zpravy:**

```js
// Widget -> Parent (objednavka odeslana)
{
  type: 'MODEL_PRICER_ORDER_SUBMITTED',
  orderId: string,
  orderNumber: string,
  total: number,
  currency: string,
  customerEmail: string
}

// Widget -> Parent (checkout krok dosahnut)
{
  type: 'MODEL_PRICER_CHECKOUT_STEP',
  step: 'contact_form' | 'summary' | 'submitted',
  timestamp: string
}

// Parent -> Widget (predvyplneni formulare)
{
  type: 'MODEL_PRICER_PREFILL_CUSTOMER',
  customer: {
    first_name: string,
    last_name: string,
    email: string,
    phone: string
  }
}
```

### B6. Pricing engine integrace

Pricing engine se v S02 **nemeni**. S02 pouziva vysledek `calculateOrderQuote()` z S01
pro zobrazeni v shrnuti objednavky:

```js
// Pouziti v OrderSummary.jsx
const quote = calculateOrderQuote({
  uploadedFiles, printConfigs, pricingConfig, feesConfig, feeSelections,
});

// Zobrazeni
<OrderSummaryPricing
  total={quote.total}
  material={quote.simple.material}
  time={quote.simple.time}
  services={quote.simple.services}
  discount={quote.simple.discount}
  markup={quote.simple.markup}
/>
```

`pricing_snapshot` v objednavce je zmrazeny stav ceny v okamziku odeslani —
nasledne zmeny v admin konfiguraci neovlivni existujici objednavky.

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-frontend` | Review architektura checkout flow | - | P0 |
| `mp-mid-frontend-public` | Hlavni implementace CheckoutStep, OrderSummary | `CheckoutStep.jsx`, `OrderSummary.jsx` | P0 |
| `mp-spec-fe-forms` | ContactForm, FormField, validace, Zod schema | `ContactForm.jsx`, `FormField.jsx`, `checkoutSchema.js` | P0 |
| `mp-spec-fe-checkout` | SubmitButton, ConfirmationPage, order submission logic | `ConfirmationPage.jsx`, `SubmitButton.jsx` | P0 |
| `mp-mid-frontend-admin` | Admin form config (pole, GDPR, CTA) | `AdminFormConfig.jsx` nebo sekce v `AdminWidget.jsx` | P1 |
| `mp-mid-storage-tenant` | Novy `adminFormStorage.js` | `src/utils/adminFormStorage.js` | P0 |
| `mp-spec-storage-migration` | Migrace orders schema (pridani customer, note) | `adminOrdersStorage.js` | P1 |
| `mp-spec-be-email` | Zakladni email odeslani (potvrzeni) | Backend endpoint | P1 |
| `mp-spec-design-responsive` | Responsive checkout na mobilech | CSS | P2 |
| `mp-spec-design-a11y` | A11y formular (labels, error messages, focus) | JSX/ARIA | P1 |
| `mp-spec-design-user-friendly` | UX review: flow, CTA, micro-copy | - | P2 |
| `mp-spec-security-gdpr` | GDPR compliance review | - | P0 |
| `mp-spec-security-injection` | Input sanitizace, XSS prevence | - | P1 |
| `mp-sr-quality` | Code review po implementaci | - | P0 |
| `mp-spec-test-unit` | Unit testy (validace, form logic) | `__tests__/` | P1 |
| `mp-spec-test-e2e` | E2E test checkout flow | `e2e/` | P2 |
| `mp-spec-i18n-translations` | CZ/EN preklady pro formular | i18n JSON | P1 |

### C2. Implementacni kroky (poradi)

```
KROK 1: [PARALELNE] Priprava
  1a. mp-mid-storage-tenant: Vytvorit adminFormStorage.js (load/save/defaults)
  1b. mp-spec-fe-forms: Vytvorit Zod schema pro checkout validaci
  1c. mp-spec-fe-forms: Vytvorit reusable FormField komponent
  1d. mp-spec-i18n-translations: Pripravit prekladove klice

KROK 2: [SEKVENCNE po 1] Formular a shrnuti
  2a. mp-mid-frontend-public: Vytvorit OrderSummary (zobrazeni modelu, cen, sluzeb)
  2b. mp-spec-fe-forms: Vytvorit ContactForm s dynamickymi poli z admin configu
  2c. mp-spec-fe-forms: Vytvorit AddressGroup (street, city, zip, country)
  2d. mp-spec-fe-forms: Vytvorit GdprCheckbox
  2e. mp-spec-fe-forms: Vytvorit OrderNote textarea

KROK 3: [SEKVENCNE po 2] Integrace do kalkulacky
  3a. mp-mid-frontend-public: Vytvorit CheckoutStep jako wrapper
  3b. mp-mid-frontend-public: Pridat krok 3 (nebo rozsireny krok 3) do step flow
  3c. mp-spec-fe-checkout: Implementovat submit logiku (create order, save to storage)
  3d. mp-spec-fe-checkout: Vytvorit ConfirmationPage

KROK 4: [SEKVENCNE po 3] Admin konfigurace
  4a. mp-mid-frontend-admin: Pridat sekci "Formular" do Admin > Widget
  4b. mp-mid-frontend-admin: Drag-and-drop razeni poli (nebo sort_order inputy)
  4c. mp-mid-frontend-admin: GDPR text editor, CTA text editor
  4d. mp-mid-frontend-admin: Konfirmacni text editor

KROK 5: [PARALELNE s 4] Email a backend
  5a. mp-spec-be-email: Implementovat zakladni email odeslani (Nodemailer nebo fetch)
  5b. mp-spec-be-email: Email sablona potvrzeni objednavky (HTML)

KROK 6: [PO VSEM] Quality gates
  6a. mp-spec-security-gdpr: GDPR review
  6b. mp-spec-security-injection: Security review formulare
  6c. mp-sr-quality: Code review
  6d. mp-spec-test-unit: Unit testy
  6e. mp-spec-test-e2e: E2E testy
  6f. mp-spec-test-build: Build test
```

### C3. Kriticke rozhodovaci body

**RB1: Rozsireni kroku 3 vs. novy krok 4?**
- **Moznost A (doporucena):** Rozsirit krok 3 "Kontrola a cena" o formular.
  Zakaznik vidi shrnuti + vyplni udaje na jedne strance. Prirozeny flow.
- **Moznost B:** Novy krok 4 "Kontaktni udaje". Oddeluje shrnuti od formulare,
  ale pridava klik navic.
- **Doporuceni:** Moznost A — shrnuti nahoze, formular uprostred, CTA dole.

**RB2: React Hook Form vs. plain controlled inputs?**
- **React Hook Form:** Minimalni re-rendery, built-in validace, resolver pro Zod.
  Vyzaduje novou zavislost (~10kB gzipped).
- **Plain useState:** Zadna nova zavislost, ale vice boilerplate a re-renderu.
- **Doporuceni:** React Hook Form — standardni volba pro formulare v React.

**RB3: Zod vs. Yup vs. manualni validace?**
- Zod: TypeScript-first, moderni, dobra composability.
- Yup: Vice maturni, vetsi komunita, ale verbose.
- Manualni: Zadna zavislost, ale vice kodu a chyb.
- **Doporuceni:** Zod — mensi bundle, lepsi TypeScript podpora.

**RB4: GDPR checkbox — hard-coded vs. konfigurovatelny?**
- Hard-coded: Rychlejsi implementace, ale kazda firma chce jiny text.
- Konfigurovatelny: Slozitejsi, ale flexibilnejsi.
- **Doporuceni:** Konfigurovatelny text + odkaz v admin panelu.

**RB5: Email — Nodemailer vs. transactional API (SendGrid/Resend)?**
- Nodemailer + vlastni SMTP: Flexibilni, ale vyzaduje SMTP server.
- SendGrid/Resend: Jednoduche, spolehlivejsi doruceni, ale externi sluzba.
- **Doporuceni:** Pro MVP zakladni Nodemailer. Pozdeji (S07) plny email system.

### C4. Testovaci strategie

**Unit testy:**
- Zod schema: validni/nevalidni data, edge cases (prazdne stringy, specialni znaky)
- `adminFormStorage.js`: load/save, defaulty, migrace
- `ContactForm`: render s ruznymi konfiguracemi poli (enabled/disabled, required/optional)
- `OrderSummary`: spravne zobrazeni modelu, cen, sluzeb
- `GdprCheckbox`: render s vlastnim textem a odkazem
- `computeOrderTotals()`: snap pricing do objednavky

**E2E testy:**
- Kompletni flow: upload -> konfigurace -> vyplneni formulare -> odeslani
- Validace: odeslani bez povinnych poli -> cervene chybove hlasky
- Validace: nevalidni email -> chyba pod polem
- GDPR: nelze odeslat bez zatrhnuti GDPR
- Poznamka: pocitadlo znaku, max 1000
- Potvrzeni: zobrazeni cisla objednavky, spravna zprava
- Admin: zmena labelu -> zmena ve widgetu

**Manualni testy:**
- B2B flow: zapnout ICO pole, vyplnit, overit v admin Orders
- Adresa: "Stejna jako dorucovaci" checkbox
- Mobile: formular na malych obrazovkach
- i18n: prepnuti jazyka, vsechny labels se zmeni

### C5. Migrace existujicich dat

**Orders (namespace `orders:v1`):**
- Stavajici demo objednavky nemaji `customer` objekt.
- Migrace: pri cteni objednavky doplnit `customer: null` pokud chybi.
- Nove objednavky vzdy maji `customer` objekt.
- Zpetna kompatibilita: `AdminOrders.jsx` zobrazuje customer jen pokud existuje.

**Form config (namespace `form:v1`):**
- Novy namespace, zadna migrace.
- Pri prvnim pouziti se nacte default config z `getDefaultFormConfig()`.

---

## D. KVALITA

### D1. Security review body

| Oblast | Riziko | Opatreni |
|--------|--------|----------|
| **XSS v inputech** | Zakaznik muze zadat `<script>` do jmena | React JSX automaticky escapuje, zadne `dangerouslySetInnerHTML` |
| **Email injection** | Zakaznik muze zadat `email\nBcc: spam@hack.com` | Validace emailu pres Zod regex, backend sanitizace |
| **Telefon injection** | Nevalidni format telefonu | Regex validace `^\+?[0-9\s\-\(\)]{6,20}$` |
| **ICO validace** | Nevalidni ICO muze byt pouzito pro fraud | Regex `^[0-9]{8}$`, volitelna ARES validace |
| **GDPR compliance** | Chybejici souhlas, uchovavani dat | Povinny checkbox, zaznam casu souhlasu, verze |
| **Rate limiting** | Spam objednavek | Backend rate limit 5 objednavek/min/IP |
| **CSRF** | Cross-site request forgery | CSRF token nebo SameSite cookies |
| **SQL injection** | N/A (localStorage) | Zen backend — prepared statements |
| **Prototype pollution** | JSON.parse customer dat | Validace pres Zod schema |
| **Note XSS** | Dlouha poznamka s HTML | Escapovani pri zobrazeni, max 1000 znaku |

### D2. Performance budget

| Metrika | Budget | Strategie |
|---------|--------|-----------|
| **Bundle size (React Hook Form + Zod)** | ~15kB gzipped | Tree-shaking, lazy import |
| **Form render time** | < 50ms | React Hook Form uncontrolled inputs |
| **Validace latence** | < 10ms | Zod synchronni validace |
| **Order submission** | < 2s | Async fetch + loading spinner |
| **Email odeslani** | < 5s (background) | Backend queue, ne blokujici UI |
| **Lazy loading** | CheckoutStep lazy-loaded | `React.lazy()` pro krok 3 |

### D3. Accessibility pozadavky

| Pozadavek | Implementace |
|-----------|-------------|
| **Labels** | Kazdy input ma `<label htmlFor>`, ne jen placeholder |
| **Error messages** | `aria-describedby` propojeni erroru s inputem, `role="alert"` |
| **Focus management** | Po odeslani focus na potvrzovaci stranku, po chybe focus na prvni chybny input |
| **Keyboard** | Tab poradi odpovidá vizualnimu poradi, Enter pro submit |
| **Screen readers** | `aria-required` na povinnych polich, `aria-invalid` na chybnych |
| **Kontrast** | Chybove hlasky cervene (#EF4444) na bilem = 4.69:1 (OK) |
| **GDPR checkbox** | `aria-label` s plnym textem souhlasu |
| **Autocomplete** | `autoComplete="given-name"`, `autoComplete="email"` atd. |

### D4. Error handling a edge cases

| Stav | Reseni |
|------|--------|
| Backend nedostupny pri odeslani | Zobrazit "Nelze odeslat, zkuste to pozdeji", retry tlacitko |
| Duplicitni odeslani (double-click) | Disable tlacitko po prvnim kliknuti, debounce |
| Session expired behem vyplnovani | Data formulare v sessionStorage, obnova po refreshi |
| Admin zmeni povinnost pole behem session | Revalidace pri odeslani (ne jen pri typing) |
| Zakaznik zada HTML do poznamky | Escapovani, zobrazeni jako plain text |
| Velmi dlouhe jmeno (> 50 znaku) | Validace maxLength v Zod schema |
| Neexistujici zeme v adrese | Dropdown s predefinovanymi zememi |
| Email s diakritikou | Punycode konverze na backendu |
| Falesny email (test@test.test) | Format validace projde, ale email nedojde — informovat admina |

### D5. i18n pozadavky

**Nove prekladove klice (CZ/EN):**

```json
{
  "checkout.title": "Kontrola a objednavka / Review and order",
  "checkout.summary.title": "Shrnuti objednavky / Order summary",
  "checkout.summary.model": "Model / Model",
  "checkout.summary.material": "Material / Material",
  "checkout.summary.quantity": "Mnozstvi / Quantity",
  "checkout.summary.price": "Cena / Price",
  "checkout.summary.total": "Celkem / Total",
  "checkout.summary.services": "Dodatecne sluzby / Additional services",
  "checkout.summary.discount": "Sleva / Discount",
  "checkout.contact.title": "Kontaktni udaje / Contact information",
  "checkout.note.title": "Poznamka k objednavce / Order note",
  "checkout.note.placeholder": "Napiste specialni pozadavky... / Write special requirements...",
  "checkout.note.remaining": "{count} znaku zbyvá / {count} characters remaining",
  "checkout.gdpr.label": "Souhlasim se zpracovanim osobnich udaju / I agree to processing of personal data",
  "checkout.submit": "Odeslat objednavku / Submit order",
  "checkout.submitting": "Odesilam... / Submitting...",
  "checkout.confirm.title": "Dekujeme! / Thank you!",
  "checkout.confirm.orderNumber": "Cislo objednavky / Order number",
  "checkout.confirm.nextSteps": "Objednavku nyni zpracovavame / We are processing your order",
  "checkout.error.required": "Toto pole je povinne / This field is required",
  "checkout.error.email": "Neplatny email / Invalid email",
  "checkout.error.phone": "Neplatny telefon / Invalid phone",
  "checkout.error.submitFailed": "Odeslani se nezdarilo / Submission failed",
  "admin.form.title": "Konfigurace formulare / Form configuration",
  "admin.form.fieldEnabled": "Zapnuto / Enabled",
  "admin.form.fieldRequired": "Povinne / Required"
}
```

Formatovani: `useLanguage()` hook, `t()` funkce, `pickLang(language, cs, en)` helper.

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flag `ENABLE_CHECKOUT`:**
- Ulozeny v `modelpricer:${tenantId}:feature_flags`
- Default: `false` (nejdrive interni testovani)
- Kdyz `false`: krok 3 zobrazuje starou podobu (jen cena, bez formulare)
- Kdyz `true`: krok 3 ma formular + shrnuti + CTA

**Feature flag `ENABLE_ORDER_EMAILS`:**
- Default: `false` (emaily se odesilaji az po nastaveni SMTP)
- Kdyz `false`: objednavka se ulozi, ale email se neodesle
- Kdyz `true`: objednavka + potvrzovaci email

**Postupne nasazeni:**
1. Merge do `develop` — interni testovani
2. Feature flag `ENABLE_CHECKOUT: true` na staging
3. QA testovani kompletniho flow
4. Zapnout na produkci pro 20% tenantu
5. Monitoring: konverzni pomer, error rate
6. Zapnout pro vsechny

### E2. Admin UI zmeny

| Zmena | Stranka | Detail |
|-------|---------|--------|
| Nova sekce "Formular" | Admin > Widget (nebo nova zalozka Admin > Formular) | Konfigurace poli, GDPR, CTA |
| Customer detail v objednavce | Admin > Orders > Detail | Zobrazeni kontaktu, adresy, poznamky |
| Email konfigurace | Admin > Widget > Email | SMTP nastaveni (pro budoucnost, S07) |

**Rozhodnuti: Kam umistit konfiguraci formulare?**
- **Admin > Widget:** Logicke — formular je soucast widgetu.
  Pridat novou tab "Formular" do widget konfigurace.
- **Admin > Formular (nova stranka):** Ciste oddeleni, ale dalsi polozka v menu.
- **Doporuceni:** Tab "Formular" v existujicim Admin > Widget.

### E3. Widget zmeny

| Zmena | Komponenta | Detail |
|-------|-----------|--------|
| Checkout step (krok 3 rozsireny) | `CheckoutStep.jsx` | Novy soubor, shrnuti + formular + CTA |
| Confirmation page | `ConfirmationPage.jsx` | Novy soubor, potvrzeni po odeslani |
| Step flow | `test-kalkulacka/index.jsx` | Krok 3 = checkout, krok 4 = potvrzeni |
| PostMessage | `WidgetEmbed.jsx` | `MODEL_PRICER_ORDER_SUBMITTED` zprava |
| Contact form | `ContactForm.jsx` | Dynamicke pole podle admin configu |

### E4. Dokumentace pro uzivatele

| Dokument | Obsah |
|----------|-------|
| Admin guide: Formular | Jak konfigurovat pole formulare, poradi, povinnost |
| Admin guide: GDPR | Jak nastavit text souhlasu a odkaz na zasady |
| Admin guide: Objednavky | Kde najit nove objednavky, co obsahuji |
| Widget changelog | "Nyni muzete prijmat objednavky primo z kalkulacky" |
| API docs | Novy endpoint POST /api/orders |

### E5. Metriky uspechu (KPI)

| KPI | Cilova hodnota | Mereni |
|-----|---------------|--------|
| **Konverzni pomer (upload -> objednavka)** | > 5% | Analytics |
| **Pocet odeslanych objednavek/den** | > 1 na aktivniho tenanta | Orders storage |
| **Abandon rate na formulari** | < 40% | Step tracking |
| **Cas vyplneni formulare** | < 2 minuty | Session analytics |
| **Validacni chyby** | < 20% odeslani konci chybou | Error tracking |
| **Email dorucitelnost** | > 95% | Email service metriky |
| **GDPR compliance** | 100% objednavek ma souhlas | Audit log |
| **Build success** | 100% | CI/CD |
| **Regrese** | 0 | Test suite |
| **Admin adoption** | > 80% tenantu nakonfiguruje formular | Feature usage tracking |
