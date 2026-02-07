# V3-S13: Automaticke Generovani Dokumentu

> **Priorita:** P2 | **Obtiznost:** Stredni | **Vlna:** 3
> **Zavislosti:** S02, S07, S12, S14
> **Odhadovany rozsah:** Stredni-Velky (~40-60 souboru, 3000-5000 radku)

---

## A. KONTEXT

### A1. Ucel a cil

Sekce S13 resi automaticke generovani PDF a pripadne Word dokumentu
v ramci objednavkoveho procesu ModelPricer. Konkretne se jedna o:

1. **Faktury (Invoices)** — automaticky generovane po dokonceni objednavky
2. **Cenove nabidky (Quotes)** — generovane pred potvrzenim objednavky
3. **Dodaci listy (Delivery Notes)** — generovane pri zmene stavu na "Odeslano"
4. **Potvrzeni objednavky (Order Confirmations)** — zaslane emailem zakaznikovi
5. **Dobropisy / Storno (Credit Notes)** — pri zruseni/castecnem vraceni

**Business value:**
- Eliminace manualniho vytvareni dokumentu (casova uspora 15-30 min/objednavka)
- Konzistentni vizualni identita dokumentu (branding tenanta)
- Automaticke triggerovani z Kanban boardu (S14) pri zmene stavu
- Zakonny pozadavek — DIC, ICO, cislovani faktur dle legislativy
- Moznost stazeni zakaznikem z portalu (S12)
- Integrace s emailovymi notifikacemi (S07) — priloha k emailu

### A2. Priorita, obtiznost, vlna

**Priorita P2:** Dokumenty nejsou nutne pro MVP kalkulacky, ale jsou klicove
pro prodejni pipeline. Bez automatickych faktur je system neuplny pro realne
pouziti ve firme.

**Obtiznost Stredni:** Hlavni slozitost lezi v:
- Template systemu s dynamickymi daty a brandingem
- Spravnem formatovani cisel, dat, men dle locale
- Ciselnych radach (faktury musi mit sekvencni cisla)
- PDF renderovani v prohlizeci (client-side) i na serveru (future)

**Vlna 3:** Vyzaduje funkcni objednavkovy system (S02), emailove notifikace (S07)
a idealne zakaznicky portal (S12) pro stazeni dokumentu.

### A3. Zavislosti na jinych sekcich

**MUSI byt hotove pred S13:**
| Sekce | Duvod |
|-------|-------|
| S02 (Checkout) | Objednavkova data — kontakt, adresa, polozky |
| S07 (Emaily) | Prilohy k emailum — automaticke odeslani PDF |

**DOPORUCENE pred S13:**
| Sekce | Duvod |
|-------|-------|
| S12 (Portal) | Zakaznik si stahne dokumenty z portalu |
| S14 (Kanban) | Trigger generovani pri zmene stavu objednavky |
| S16 (i18n) | Dokumenty v jazyce zakaznika |

**Na S13 ZAVISI:**
| Sekce | Duvod |
|-------|-------|
| S14 (Kanban) | Trigger generovani pri presunu karty do urciteho stavu |
| S17 (Ecommerce) | Faktury pro e-commerce integrace |
| S21 (Dane) | DPH rozklad na fakturach |

### A4. Soucasny stav v codebase

**Co uz existuje:**
- `src/utils/adminOrdersStorage.js` — kompletni datovy model objednavek (NS `orders:v1`)
  vcetne `ORDER_STATUSES`, `computeOrderTotals()`, modelovych snapshotu
- `src/utils/adminBrandingWidgetStorage.js` — branding tenanta (logo, barvy, nazev firmy)
- `src/pages/admin/AdminOrders.jsx` — sprava objednavek s detailem, stavy, audit logem
- `src/utils/adminTenantStorage.js` — `readTenantJson()`, `writeTenantJson()`, `getTenantId()`
- `src/contexts/LanguageContext.jsx` — `useLanguage()` hook s cs/en prekladem

**Co chybi:**
- `src/utils/adminDocumentsStorage.js` — NEEXISTUJE (namespace `documents:v1`)
- `src/lib/documents/` — NEEXISTUJE (generovaci logika)
- `src/pages/admin/AdminDocuments.jsx` — NEEXISTUJE (admin sprava dokumentu)
- PDF sablony — NEEXISTUJI
- Ciselna rada faktur — NEEXISTUJE
- Zadna knihovna pro PDF generovani neni v `package.json`

**Relevantni existujici soubory:**
```
src/utils/adminOrdersStorage.js          — datovy model objednavek
src/utils/adminBrandingWidgetStorage.js   — branding tenanta
src/utils/adminTenantStorage.js           — tenant storage entrypoint
src/pages/admin/AdminOrders.jsx           — admin objednavky (UI)
src/pages/admin/AdminLayout.jsx           — admin navigace
src/contexts/LanguageContext.jsx           — jazykovy kontext
src/lib/pricing/pricingEngineV3.js        — cenovy engine (breakdown data)
```

### A5. Referencni zdroje a konkurence

**Doporucene OSS knihovny (ze zdrojoveho dokumentu):**

| Knihovna | GitHub | Hvezdy | Popis | Licence |
|----------|--------|--------|-------|---------|
| **@react-pdf/renderer** | diegomura/react-pdf | 15k+ | React komponenty -> PDF | MIT |
| **jsPDF** | parallax/jsPDF | 29k+ | Client-side PDF generovani | MIT |
| **pdf-lib** | Hopding/pdf-lib | 7k+ | Vytvareni a editace PDF | MIT |
| **pdfmake** | bpampuch/pdfmake | 12k+ | Deklarativni PDF | MIT |
| **PDFKit** | foliojs/pdfkit | 9.5k+ | Nizkourovnove PDF | MIT |
| **docx** | dolanmiu/docx | 4k+ | Word dokument generovani | MIT |

**Doporuceni pro ModelPricer:**
- **Primarne:** `@react-pdf/renderer` — React-native pristup, sablony jako JSX komponenty
- **Alternativa:** `jsPDF` — lehci, client-side only, bez React dependency
- **Pro Word:** `docx` — pokud zakaznici pozaduji editovatelne sablony

**Konkurencni reseni:**
- Layers.app — generuje PDF faktury automaticky
- AutoQuote3D — PDF cenove nabidky s brandingem
- Craftcloud3D — automaticke faktury v zakaznickem portalu

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `documents:v1`
**Storage klic:** `modelpricer:${tenantId}:documents:v1`

```json
{
  "schema_version": 1,
  "settings": {
    "auto_generate": {
      "invoice_on_status": "SHIPPED",
      "quote_on_request": true,
      "delivery_note_on_status": "SHIPPED",
      "order_confirmation_on_status": "APPROVED",
      "credit_note_on_cancel": true
    },
    "numbering": {
      "invoice_prefix": "FV",
      "invoice_next_number": 1,
      "invoice_digits": 6,
      "invoice_year_prefix": true,
      "quote_prefix": "CN",
      "quote_next_number": 1,
      "delivery_prefix": "DL",
      "delivery_next_number": 1,
      "credit_prefix": "DB",
      "credit_next_number": 1
    },
    "company_info": {
      "name": "",
      "address": "",
      "city": "",
      "zip": "",
      "country": "CZ",
      "ico": "",
      "dic": "",
      "bank_account": "",
      "iban": "",
      "swift": "",
      "email": "",
      "phone": "",
      "web": "",
      "logo_url": ""
    },
    "template": {
      "primary_color": "#2563EB",
      "font_family": "Helvetica",
      "show_logo": true,
      "show_qr_payment": true,
      "footer_text": "",
      "payment_terms_days": 14,
      "default_note": ""
    },
    "locale": {
      "date_format": "DD.MM.YYYY",
      "currency": "CZK",
      "currency_symbol": "Kc",
      "decimal_separator": ",",
      "thousands_separator": " "
    }
  },
  "documents": [
    {
      "id": "doc_abc123",
      "type": "INVOICE",
      "number": "FV2026-000001",
      "order_id": "ord_xyz789",
      "status": "GENERATED",
      "created_at": "2026-02-06T10:00:00Z",
      "issued_date": "2026-02-06",
      "due_date": "2026-02-20",
      "customer": {
        "name": "Jan Novak",
        "email": "jan@example.com",
        "address": "Ulice 123",
        "city": "Praha",
        "zip": "110 00",
        "ico": "",
        "dic": ""
      },
      "items": [
        {
          "description": "3D tisk — PLA Bila — Model XYZ",
          "quantity": 2,
          "unit_price": 450.00,
          "total": 900.00,
          "vat_rate": 21
        }
      ],
      "subtotal": 900.00,
      "vat_amount": 189.00,
      "total": 1089.00,
      "currency": "CZK",
      "notes": "",
      "pdf_blob_key": "doc_abc123_pdf"
    }
  ],
  "updated_at": "2026-02-06T10:00:00Z"
}
```

**Doplnkovy namespace pro PDF bloby:** `documents:blobs:v1`
- Uklada base64 PDF data pro offline pristup
- Klice: `modelpricer:${tenantId}:documents:blobs:v1:${docId}`

### B2. API kontrakty (endpointy)

**Aktualni stav: Pouze frontend (localStorage)**

Pro budouci backend implementaci:

```
POST   /api/documents/generate
  Body: { order_id, type: "INVOICE"|"QUOTE"|"DELIVERY_NOTE"|"ORDER_CONFIRMATION"|"CREDIT_NOTE" }
  Response: { id, number, pdf_url, status }

GET    /api/documents
  Query: ?order_id=&type=&page=&limit=
  Response: { documents: [...], total, page }

GET    /api/documents/:id
  Response: { document }

GET    /api/documents/:id/pdf
  Response: application/pdf (binary)

PUT    /api/documents/:id
  Body: { notes, status }
  Response: { document }

DELETE /api/documents/:id
  Response: { success: true }

POST   /api/documents/:id/send
  Body: { email, subject, message }
  Response: { sent: true }

GET    /api/documents/settings
  Response: { settings }

PUT    /api/documents/settings
  Body: { settings }
  Response: { settings }

GET    /api/documents/next-number/:type
  Response: { next_number: "FV2026-000002" }
```

**Error kody:**
- `400` — Chybejici povinne udaje (order_id, type)
- `404` — Objednavka/dokument neexistuje
- `409` — Dokument uz byl vygenerovan (duplicita)
- `422` — Chybejici firemni udaje pro generovani faktury

### B3. Komponentni strom (React)

```
AdminDocuments (stranka /admin/documents)
├── DocumentsHeader
│   ├── PageTitle ("Dokumenty")
│   ├── FilterBar
│   │   ├── TypeFilter (dropdown: Vsechny | Faktury | Nabidky | DL | Potvrzeni)
│   │   ├── DateRangeFilter
│   │   ├── SearchInput (cislo dokumentu, zakaznik)
│   │   └── StatusFilter (Vygenerovano | Odeslano | Zaplaceno)
│   └── ActionButtons
│       ├── GenerateManualButton
│       └── ExportBulkButton
├── DocumentsTable
│   ├── DocumentRow
│   │   ├── DocumentNumber (link na detail)
│   │   ├── TypeBadge
│   │   ├── OrderLink
│   │   ├── CustomerName
│   │   ├── Amount
│   │   ├── DateColumn
│   │   ├── StatusBadge
│   │   └── RowActions
│   │       ├── DownloadPdfButton
│   │       ├── SendEmailButton
│   │       ├── ViewDetailButton
│   │       └── DeleteButton
│   └── Pagination
├── DocumentDetail (modal nebo sub-route)
│   ├── DocumentPreview (live PDF nahled)
│   ├── DocumentMetadata
│   ├── SendEmailForm
│   └── DocumentAuditLog
└── DocumentSettings (sub-tab nebo modal)
    ├── CompanyInfoForm
    │   ├── CompanyNameInput
    │   ├── AddressFields
    │   ├── IcoInput, DicInput
    │   ├── BankAccountInput
    │   └── LogoUpload
    ├── NumberingSettings
    │   ├── PrefixInput (per typ)
    │   ├── NextNumberInput
    │   ├── DigitCountSelect
    │   └── YearPrefixToggle
    ├── TemplateSettings
    │   ├── PrimaryColorPicker
    │   ├── FontSelect
    │   ├── ShowLogoToggle
    │   ├── ShowQrPaymentToggle
    │   ├── FooterTextInput
    │   └── PaymentTermsDaysInput
    ├── AutoGenerationSettings
    │   ├── InvoiceOnStatusSelect
    │   ├── QuoteOnRequestToggle
    │   ├── DeliveryNoteOnStatusSelect
    │   └── OrderConfirmationOnStatusSelect
    └── LocaleSettings
        ├── DateFormatSelect
        ├── CurrencySelect
        └── DecimalSeparatorSelect

DocumentGenerator (lib — ne UI)
├── InvoiceTemplate (React PDF komponenta)
├── QuoteTemplate
├── DeliveryNoteTemplate
├── OrderConfirmationTemplate
├── CreditNoteTemplate
└── SharedComponents
    ├── DocumentHeader (logo, firemni udaje)
    ├── DocumentTable (polozky)
    ├── DocumentFooter (poznamky, podpis)
    ├── QrPaymentCode
    └── DocumentSummary (mezisoucet, DPH, celkem)
```

### B4. Tenant storage namespace

**Helper soubor:** `src/utils/adminDocumentsStorage.js`

```javascript
// adminDocumentsStorage.js
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_DOCUMENTS = 'documents:v1';
const NS_DOC_BLOBS = 'documents:blobs:v1';
const SCHEMA_VERSION = 1;

// --- Settings ---
export function loadDocumentSettings() {
  const data = readTenantJson(NS_DOCUMENTS, { schema_version: SCHEMA_VERSION, settings: getDefaultSettings(), documents: [] });
  return data.settings || getDefaultSettings();
}

export function saveDocumentSettings(settings) {
  const data = readTenantJson(NS_DOCUMENTS, { schema_version: SCHEMA_VERSION, settings: {}, documents: [] });
  data.settings = { ...getDefaultSettings(), ...settings };
  data.updated_at = new Date().toISOString();
  writeTenantJson(NS_DOCUMENTS, data);
}

// --- Documents CRUD ---
export function loadDocuments(filters = {}) { ... }
export function saveDocument(doc) { ... }
export function deleteDocument(docId) { ... }
export function getNextDocumentNumber(type) { ... }
export function incrementDocumentNumber(type) { ... }

// --- PDF Blob Storage ---
export function savePdfBlob(docId, base64Pdf) { ... }
export function loadPdfBlob(docId) { ... }

// --- Defaults ---
export function getDefaultSettings() { ... }
```

**Konvence namespace:**
- `modelpricer:${tenantId}:documents:v1` — hlavni data (nastaveni + seznam dokumentu)
- `modelpricer:${tenantId}:documents:blobs:v1:${docId}` — PDF bloby (base64)

### B5. Widget integrace (postMessage)

Dokumenty jsou primarne admin-side feature, ale propagace do widgetu existuje:

**Zpravy z admin -> widget:**
```javascript
// Kdyz admin zmeni nastaveni dokumentu, propagovat do widgetu
// aby widget vedel, zda zobrazit "Stahnout cenovou nabidku" tlacitko
{
  type: 'MODELPRICER_CONFIG_UPDATE',
  payload: {
    documents: {
      quote_available: true,     // zobrazit tlacitko "Stahnout cenovou nabidku"
      invoice_available: false,  // faktury jen pro prihlasene zakazniky
    }
  }
}
```

**Zpravy z widget -> admin (zakaznicky portal):**
```javascript
// Zakaznik si vyzada cenovou nabidku z widgetu
{
  type: 'MODELPRICER_DOCUMENT_REQUEST',
  payload: {
    type: 'QUOTE',
    order_data: { ... },  // aktualni konfigurace z kalkulacky
    customer_email: 'zakaznik@example.com'
  }
}
```

### B6. Pricing engine integrace

Dokumenty **cerpaji data** z pricing engine, ale **nemeni** jeho logiku.

**Vstupy z pricingEngineV3.js:**
- `breakdown.baseMaterial` — naklad na material
- `breakdown.baseTime` — naklad na cas tisku
- `breakdown.fees[]` — poplatky (post-processing, express, atd.)
- `breakdown.discount` — sleva
- `breakdown.shipping` — doprava
- `breakdown.totalPerModel` — celkem za model
- `breakdown.grandTotal` — celkova cena objednavky

**Mapovani na polozky faktury:**
```javascript
function orderToInvoiceItems(order) {
  return order.models.map(model => ({
    description: `3D tisk - ${model.material} - ${model.name}`,
    quantity: model.quantity,
    unit_price: model.price_per_piece,
    total: model.total_price,
    vat_rate: 21  // z nastaveni tenanta nebo S21
  }));
}
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-spec-be-pdf` | PDF generovaci logika, sablony | `src/lib/documents/*` | P0 |
| `mp-mid-frontend-admin` | Admin stranka DocumentSettings + DocumentList | `src/pages/admin/AdminDocuments.jsx` | P0 |
| `mp-mid-storage-tenant` | Storage helper pro documents:v1 | `src/utils/adminDocumentsStorage.js` | P0 |
| `mp-spec-fe-forms` | Formular firemnich udaju, nastaveni sablony | Komponenty v AdminDocuments | P1 |
| `mp-spec-fe-tables` | Tabulka dokumentu s filtry | Komponenty v AdminDocuments | P1 |
| `mp-spec-fe-routing` | Nova route /admin/documents | `src/Routes.jsx` | P0 |
| `mp-mid-design-system` | UI komponenty pro PDF preview | `src/components/ui/PdfPreview.jsx` | P1 |
| `mp-spec-be-email` | Integrace s emailovymi notifikacemi | `src/lib/documents/emailIntegration.js` | P2 |
| `mp-sr-pricing` | Review — spravnost cenoveho breakdown v dokumentech | — | P1 |
| `mp-sr-storage` | Review — storage schema a migrace | — | P0 |

### C2. Implementacni kroky (poradi)

**Faze 1: Zaklad (sekvencni)**
```
Krok 1: [mp-mid-storage-tenant] Vytvorit adminDocumentsStorage.js
        - Definovat schema, defaults, CRUD operace
        - Ciselna rada s automatickym inkrementem
        Soubor: src/utils/adminDocumentsStorage.js

Krok 2: [mp-spec-be-pdf] Nainstalovat @react-pdf/renderer
        - npm install @react-pdf/renderer
        - Vytvorit zakladni template strukturu
        Soubor: src/lib/documents/templates/

Krok 3: [mp-spec-be-pdf] Implementovat InvoiceTemplate
        - React PDF komponenta pro fakturu
        - Header (logo, firemni udaje), polozky, soucet, paticka
        Soubor: src/lib/documents/templates/InvoiceTemplate.jsx
```

**Faze 2: Dalsie sablony (paralelne)**
```
Krok 4a: [mp-spec-be-pdf] QuoteTemplate
          Soubor: src/lib/documents/templates/QuoteTemplate.jsx

Krok 4b: [mp-spec-be-pdf] DeliveryNoteTemplate
          Soubor: src/lib/documents/templates/DeliveryNoteTemplate.jsx

Krok 4c: [mp-spec-be-pdf] OrderConfirmationTemplate
          Soubor: src/lib/documents/templates/OrderConfirmationTemplate.jsx

Krok 4d: [mp-spec-be-pdf] CreditNoteTemplate
          Soubor: src/lib/documents/templates/CreditNoteTemplate.jsx
```

**Faze 3: Admin UI (paralelne s Fazi 2)**
```
Krok 5: [mp-spec-fe-routing] Pridat route /admin/documents
        Soubor: src/Routes.jsx, src/pages/admin/AdminLayout.jsx

Krok 6: [mp-mid-frontend-admin] AdminDocuments stranka
        - Zakladni layout: tabulka + nastaveni
        Soubor: src/pages/admin/AdminDocuments.jsx

Krok 7: [mp-spec-fe-forms] DocumentSettings formular
        - Firemni udaje, cislovani, sablona
        Soubor: src/pages/admin/components/DocumentSettingsForm.jsx
```

**Faze 4: Integrace (sekvencni, po Fazi 2+3)**
```
Krok 8: [mp-spec-be-pdf] DocumentGenerator service
        - Funkce generateDocument(order, type, settings)
        - Vraci PDF blob + metadata
        Soubor: src/lib/documents/documentGenerator.js

Krok 9: [mp-mid-frontend-admin] PDF preview v admin UI
        - Live nahled faktury v modalu
        - Download button

Krok 10: [mp-spec-be-email] Email integrace
         - Priloha PDF k emailu pri zmene stavu
         - Napojeni na S07 (emailove notifikace)
```

**Faze 5: Automatizace**
```
Krok 11: [mp-mid-frontend-admin] Auto-generovani pri zmene stavu
         - Hook do AdminOrders.jsx — pri zmene stavu triggernout generovani
         - Napojeni na S14 Kanban — pri presunu karty

Krok 12: [mp-mid-quality-code] Code review + testy
```

### C3. Kriticke rozhodovaci body

1. **Client-side vs Server-side PDF generovani?**
   - Rozhodnuti: Client-side (@react-pdf/renderer) pro MVP
   - Duvod: Bez backendu, okamzity nahled, snadne sablony v JSX
   - Budouci migrace: Puppeteer na serveru pro slozite layouts

2. **Kde ukladat PDF soubory?**
   - Rozhodnuti: Base64 v localStorage pro MVP (documents:blobs:v1)
   - Omezeni: localStorage limit ~5MB, max ~20-30 faktur
   - Budouci migrace: Firebase Storage / S3

3. **Jak resit ciselnou radu?**
   - Rozhodnuti: Sekvencni cislo v localStorage s rokem prefix
   - Format: `{PREFIX}{ROK}-{CISLO}` napr. `FV2026-000001`
   - Race condition: Nehrozi v single-user localStorage

4. **QR platebni kod na fakturach?**
   - Rozhodnuti: Implementovat pomoci SPAYD formatu (cesky standard)
   - Knihovna: Generovat QR pomoci `qrcode` npm baliku

### C4. Testovaci strategie

**Unit testy:**
- `adminDocumentsStorage.test.js` — CRUD, ciselna rada, migrace
- `documentGenerator.test.js` — spravnost dat na fakture
- `invoiceTemplate.test.js` — renderovani sablony

**Integracni testy:**
- Generovani faktury z realne objednavky
- Ciselna rada — sekvencnost po vice generovanich
- Auto-generovani pri zmene stavu objednavky

**E2E testy (Playwright):**
- Admin otevre /admin/documents
- Nastavi firemni udaje
- Manualne vygeneruje fakturu z objednavky
- Stahne PDF
- Overi ze PDF obsahuje spravna data

**Vizualni testy:**
- Screenshot sablony faktury — porovnani s referencnim snimkem
- Ruzne jazykove verze (cs, en, de)
- Ruzne delky dat (1 polozka vs 50 polozek — strankovani)

### C5. Migrace existujicich dat

**Migrace z V0 (zadna data):**
- Pri prvnim pristupu na /admin/documents se vytvori defaultni nastaveni
- Firemni udaje se pre-fill z existujiciho brandingu (`adminBrandingWidgetStorage.js`)
- Logo se prevezme z branding nastaveni

**Migrace schema:**
```javascript
function migrateDocumentsSchema(data) {
  if (!data || !data.schema_version) {
    return { schema_version: 1, settings: getDefaultSettings(), documents: [] };
  }
  // Budouci migrace: v1 -> v2 atd.
  return data;
}
```

---

## D. KVALITA

### D1. Security review body

- **Firemni udaje:** ICO, DIC, bankovni ucet — ulozeno v localStorage (demo).
  V produkci MUSI byt v zabezpecenem backendu.
- **PDF bloby:** Base64 v localStorage — neni sifrovano.
  Riziko: Kdo ma pristup k prohlizeci, vidi vsechna data.
- **Ciselna rada:** Manipulovatelna v localStorage.
  V produkci: Server-side sekvencni generator s databazovym zamkem.
- **XSS v sablonach:** React PDF renderer escapuje vstupy automaticky.
  Presto validovat vsechny vstupy (company_info, notes).
- **Email odeslani:** Overit ze email endpointy nelze zneuzit (rate limiting, validace adres).

### D2. Performance budget

| Operace | Budget | Metrika |
|---------|--------|---------|
| Generovani PDF (1 stranka) | < 500ms | Time to render |
| Generovani PDF (5 stran, 50 polozek) | < 2s | Time to render |
| Nacteni seznamu dokumentu | < 100ms | Time to first paint |
| Download PDF | < 200ms | Time to download |
| Velikost PDF (1 stranka) | < 200KB | File size |
| Velikost PDF (5 stran) | < 500KB | File size |
| Velikost @react-pdf bundle | < 150KB gzip | Bundle impact |

### D3. Accessibility pozadavky

- Admin UI: Vsechny formulare maji `label` s `htmlFor`
- Tabulka dokumentu: Spravne `<th>` hlavicky, `aria-sort` pro razeni
- PDF download: Button s jasnym `aria-label` ("Stahnout fakturu FV2026-000001")
- PDF preview modal: `role="dialog"`, `aria-modal="true"`, Escape pro zavreni
- Barevny kontrast: Minimalne 4.5:1 pro text v PDF sablonach
- Keyboard navigace: Tab-order pres vsechny akce v tabulce

### D4. Error handling a edge cases

| Edge case | Reseni |
|-----------|--------|
| Chybejici firemni udaje | Zobrazit varovani, neumoznit generovani faktury |
| Objednavka bez polozek | Zobrazit toast "Objednavka nema zadne polozky" |
| localStorage plny | Catch QuotaExceededError, nabidnout smazani starych PDF |
| Duplicitni cislo faktury | Kontrola pred ulozenim, auto-increment |
| Velky pocet polozek (>50) | Strankovani v PDF sablone |
| Zrusena objednavka | Generovat dobropis, ne fakturu |
| Zmena firemnych udaju po generovani | Stare dokumenty si zachovaji puvodni udaje |
| Chybejici logo (URL neni dostupne) | Fallback — text nazvu firmy misto loga |
| Nevalidni ICO/DIC format | Validace formatu (CZ ICO: 8 cislic, DIC: CZ + 8-10 cislic) |

### D5. i18n pozadavky

**Dokumenty musi podporovat jazyk zakaznika:**
- Faktura pro ceskeho zakaznika — cesky
- Faktura pro nemeckeho zakaznika — nemecky
- Dvojjazycna faktura (cs + en) — konfigurovatelne

**Prekladove klice pro dokumenty:**
```json
{
  "documents": {
    "invoice": "Faktura",
    "quote": "Cenova nabidka",
    "delivery_note": "Dodaci list",
    "order_confirmation": "Potvrzeni objednavky",
    "credit_note": "Dobropis",
    "item": "Polozka",
    "quantity": "Pocet",
    "unit_price": "Jednotkova cena",
    "total": "Celkem",
    "subtotal": "Mezisoucet",
    "vat": "DPH",
    "vat_rate": "Sazba DPH",
    "grand_total": "Celkem vcetne DPH",
    "due_date": "Datum splatnosti",
    "issued_date": "Datum vystaveni",
    "payment_terms": "Platebni podminky",
    "bank_account": "Bankovni ucet",
    "variable_symbol": "Variabilni symbol",
    "thank_you": "Dekujeme za Vasi objednavku!"
  }
}
```

**Formatovani cisel a dat dle locale:**
```javascript
// Pouzit Intl.NumberFormat a Intl.DateTimeFormat
const formatCurrency = (amount, currency, locale) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

const formatDate = (date, locale) =>
  new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(date));
```

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flag:** `documents_enabled` v tenant settings

```javascript
// V adminDocumentsStorage.js
export function isDocumentsEnabled() {
  const settings = loadDocumentSettings();
  return settings?.enabled !== false; // default: true
}
```

**Postupne nasazeni:**
1. **Alpha:** Pouze generovani faktur (manualni trigger z admin)
2. **Beta:** Vsechny typy dokumentu + auto-generovani
3. **GA:** Email prilohy + zakaznicky portal integrace

### E2. Admin UI zmeny

**Nova polozka v admin navigaci:**
- Menu: Objednavky > **Dokumenty** (nova polozka)
- Nebo: Samostatna polozka "Dokumenty" v hlavni navigaci
- Ikona: `FileText` (z lucide-react)

**Zmeny v existujicich admin strankach:**
- `AdminOrders.jsx` — pridat tlacitko "Generovat fakturu" v detailu objednavky
- `AdminLayout.jsx` — pridat navigacni odkaz na /admin/documents
- `AdminBranding.jsx` — informace ze logo se pouziva i na dokumentech

**Nova admin stranka:**
- Route: `/admin/documents`
- Soubor: `src/pages/admin/AdminDocuments.jsx`
- Sub-taby: Seznam | Nastaveni | Sablony

### E3. Widget zmeny

**Minimalni zmeny ve widgetu:**
- Tlacitko "Stahnout cenovou nabidku" (pokud je quote_available = true)
- Tlacitko "Stahnout potvrzeni" po odeslani objednavky
- Obe tlacitka generuji PDF client-side a spusti download

### E4. Dokumentace pro uzivatele

**Admin dokumentace (in-app tooltips):**
- "Firemni udaje: Vyplnte ICO, DIC a bankovni ucet pro automaticke generovani faktur"
- "Cislovani: Nastavte prefix a pocatecni cislo pro kazdou radu dokumentu"
- "Auto-generovani: Zvolte pri jakem stavu objednavky se automaticky vygeneruje dokument"

**Onboarding wizard (S22 napojeni):**
- Krok "Nastavte firemni udaje pro dokumenty"
- Pre-fill z registrace (nazev firmy, adresa)

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Pocet vygenerovanych dokumentu / mesic | > 80% objednavek ma fakturu | Pocitadlo v storage |
| Cas na generovani PDF | < 500ms (median) | Performance monitoring |
| Procento automaticky generovanych vs manualnich | > 70% automaticky | Pomer v audit logu |
| Zakazniku, kteri si stahli dokument z portalu | > 30% | Event tracking |
| Admin spokojenost (firemni udaje vyplneny) | > 90% tenantu | Kontrola settings |
| Chybovost (failed generovani) | < 1% | Error tracking |

---

## F. REFERENCNI SNIPPETY

### F1. Priklad React PDF sablony (InvoiceTemplate)

```jsx
// src/lib/documents/templates/InvoiceTemplate.jsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  logo: { width: 120, height: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2563EB' },
  table: { width: '100%', marginTop: 20 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #E5E7EB', padding: '8px 0' },
  tableHeader: { fontWeight: 'bold', backgroundColor: '#F3F4F6' },
  col1: { width: '45%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  summary: { marginTop: 20, alignItems: 'flex-end' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', width: 200, padding: '4px 0' },
  grandTotal: { fontWeight: 'bold', fontSize: 14, borderTop: '2px solid #000', paddingTop: 8 },
});

export function InvoiceTemplate({ invoice, settings }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {settings.show_logo && settings.company_info.logo_url && (
              <Image src={settings.company_info.logo_url} style={styles.logo} />
            )}
            <Text>{settings.company_info.name}</Text>
            <Text>{settings.company_info.address}</Text>
            <Text>{settings.company_info.city} {settings.company_info.zip}</Text>
            <Text>ICO: {settings.company_info.ico}</Text>
            <Text>DIC: {settings.company_info.dic}</Text>
          </View>
          <View>
            <Text style={styles.title}>FAKTURA</Text>
            <Text>Cislo: {invoice.number}</Text>
            <Text>Datum vystaveni: {invoice.issued_date}</Text>
            <Text>Datum splatnosti: {invoice.due_date}</Text>
          </View>
        </View>

        {/* Odberatel */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Odberatel:</Text>
          <Text>{invoice.customer.name}</Text>
          <Text>{invoice.customer.address}</Text>
          <Text>{invoice.customer.city} {invoice.customer.zip}</Text>
        </View>

        {/* Polozky */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col1}>Popis</Text>
            <Text style={styles.col2}>Pocet</Text>
            <Text style={styles.col3}>Cena/ks</Text>
            <Text style={styles.col4}>Celkem</Text>
          </View>
          {invoice.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatCurrency(item.unit_price)}</Text>
              <Text style={styles.col4}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Soucet */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Mezisoucet:</Text>
            <Text>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>DPH {invoice.items[0]?.vat_rate || 21}%:</Text>
            <Text>{formatCurrency(invoice.vat_amount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotal]}>
            <Text>Celkem:</Text>
            <Text>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

### F2. Priklad generovaci funkce

```javascript
// src/lib/documents/documentGenerator.js
import { pdf } from '@react-pdf/renderer';
import { InvoiceTemplate } from './templates/InvoiceTemplate';
import { QuoteTemplate } from './templates/QuoteTemplate';

const TEMPLATES = {
  INVOICE: InvoiceTemplate,
  QUOTE: QuoteTemplate,
  DELIVERY_NOTE: DeliveryNoteTemplate,
  ORDER_CONFIRMATION: OrderConfirmationTemplate,
  CREDIT_NOTE: CreditNoteTemplate,
};

export async function generateDocument(order, type, settings) {
  const Template = TEMPLATES[type];
  if (!Template) throw new Error(`Unknown document type: ${type}`);

  const docData = buildDocumentData(order, type, settings);
  const blob = await pdf(<Template document={docData} settings={settings} />).toBlob();

  return {
    blob,
    metadata: {
      id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      number: docData.number,
      order_id: order.id,
      created_at: new Date().toISOString(),
      total: docData.total,
    }
  };
}
```
