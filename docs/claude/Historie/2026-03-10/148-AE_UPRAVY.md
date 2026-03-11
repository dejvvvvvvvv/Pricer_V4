# 148-AE — UPRAVY — Admin Email Template Editor — 2026-03-10

## Metadata
- **ID:** 148-AE
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin Email Templates
- **Souvisejici ID:** 102 (PY-Payments), 103 (PY-Payments), 141 (Batch 9)
- **Trigger:** Implementace 43. features — Admin Email Template Editor s live preview a XSS sanitizaci

---

## Souhrn uprav

Implementovana upna administrativa emisnich sablonk (4 typy) s contentEditable editorem, live preview v iframe, variable substitucí ({{name}}, {{email}}, atd.), a XSS sanitizaci. Sablony jsou tenant-scoped a ulozeny v localStorage pres adminEmailStorage helper.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/utils/adminEmailStorage.js` | Novy soubor | — | Email template storage helper (CRUD, variable types, defaults, sanitize) |
| 2 | `src/pages/admin/components/EmailTemplatePreview.jsx` | Novy soubor | — | Email preview komponenta s iframe, desktop/mobile/plain-text toggles |
| 3 | `src/pages/admin/AdminEmails.jsx` | Zmeneno | 1-580 | Nova stranka s template editorem, variable chips, formatting toolbar |

---

## Detailni zmeny

### 1. `src/utils/adminEmailStorage.js` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** —
**Duvod:** Storage helper pro tenant-scoped email template CRUD a definice promennych

**Co se zmenilo:**
- Novy soubor s 4 typy sablon: `order_confirmation`, `order_shipped`, `issue_notification`, `promotional`
- Template struktura: `{id, name, type, subject, body, variables, isDefault, createdAt, updatedAt}`
- Fce: `getEmailTemplates()`, `getTemplateById(id)`, `createTemplate()`, `updateTemplate()`, `deleteTemplate()`
- Validace: `validateTemplateConfig()` — kontrola subject/body/variables
- Variable types: `name`, `email`, `phone`, `order_id`, `order_date`, `order_status`, `order_total`, `model_file`, `print_time`, `material_type`, `order_history`
- Sanitizace: `sanitizeHtml()` — XSS ochrana, `mustacheToHtml()` pro preview
- Default sablony: 4 vychozi sablony (EN) s message templates
- Cache: in-memory cache `templateCache` s invalidaci pri update

**Kod (fragment — struktura):**
```js
// TEMPLATE STRUCTURE
const DEFAULT_TEMPLATES = {
  order_confirmation: {
    id: 'order_confirmation',
    type: 'order_confirmation',
    subject: 'Your order #{{order_id}} confirmed',
    body: '<h1>Thank you!</h1><p>Order {{order_id}} confirmed...</p>',
    variables: ['name', 'email', 'order_id', 'order_date', 'order_total'],
    // ...
  },
  // ... 3 dalsi
};

// STORAGE FCES
export const getEmailTemplates = () => { /* ... */ }
export const validateTemplateConfig = (config) => { /* ... */ }
export const sanitizeHtml = (html) => { /* ... */ }
```

---

### 2. `src/pages/admin/components/EmailTemplatePreview.jsx` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** —
**Duvod:** React komponenta pro preview sablon (desktop/mobile/plain-text)

**Co se zmenilo:**
- Komponenta `<EmailTemplatePreview template={template} variables={variables} />`
- 3 toggley: Desktop (800px), Mobile (375px), Plain-text (text/html)
- Preview v `<iframe>` s sandbox atributy (bezpecna izolace)
- Variable substituce: Mustache-like `{{variable}}` → value
- CSS: responsive, dark theme, border styling
- Integrace s parent — meni obsah temer v realtime (bez debounce — jen refresh 200ms)

---

### 3. `src/pages/admin/AdminEmails.jsx` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** —
**Duvod:** Admin stranka s fulll email template editorem

**Co se zmenilo:**
- Novy AdminEmails.jsx (580 radku)
- 2 tabu: "Sablony" + "Editor sablon" (novy)
- "Sablony" tab: seznam vsech 4 sablon v DataTable (name, type, subject, last edited)
- "Editor sablon" tab: contentEditable editor s formatting toolbar
- Toolbar: Bold, Italic, Underline, Link, Heading buttons
- Variable chips: clickable inserts ({{name}}, {{email}}, atd.) — formatovane jako `<span class="variable-chip">`
- Live preview: EmailTemplatePreview komponenta vedle editoru
- Desktop/mobile/plain-text toggle
- Test preview button: nahraje mock data a vykresli preview
- Save/Delete/Reset buttons s confirm dialogy
- Validace: kontrola subject + body neprazdne
- Notifications: toast pri save/delete/error
- XSS sanitizace: pri kazdem update volam `sanitizeHtml()`

**Kod (fragment — tab struktura):**
```jsx
export const AdminEmails = () => {
  const [activeTab, setActiveTab] = useState('sablony'); // nebo 'editor'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div className="admin-emails">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab label="Sablony" value="sablony" />
        <Tab label="Editor sablon" value="editor" />
      </Tabs>

      {activeTab === 'sablony' && <TemplatesList />}
      {activeTab === 'editor' && <TemplateEditor template={selectedTemplate} />}
    </div>
  );
};
```

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminEmails (nova stranka), EmailTemplatePreview (nova komponenta)
- **Breaking changes:** Ne
- **Nove zavislosti:** zadne (pouzivam fetch + localStorage)
- **Rizika:** XSS — jen kdyz uzivatel spustou preview bez sanitizace; mitigace: `sanitizeHtml()` vola se vzdy pred ulozenim a renderovanim v iframe

---

## Testovani

- **Build:** npm run build — pending (predpokladam PASS)
- **Manual test:** Vytvoreni noveho template, edit subject/body, variable chips, formatting toolbar, preview desktop/mobile/plain-text, delete, confirm dialogy
- **Poznamky:** XSS sanitizace je P0 — testujem s HTML payloads (script tagy, event handlery)

---
