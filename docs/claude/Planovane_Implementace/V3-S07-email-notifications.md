# V3-S07: Emailove notifikace

> **Priorita:** P1 | **Obtiznost:** Vysoka | **Vlna:** 2
> **Zavislosti:** S02 (Checkout/Objednavky), S04 (Doprava), orders:v1 namespace
> **Odhadovany rozsah:** Velky (20-30 souboru, 7-10 dni)

---

## A. KONTEXT

### A1. Ucel a cil

Emailove notifikace jsou klicovym komunikacnim kanalem mezi 3D tiskovou sluzbou a zakaznikem.
Kazda zmena stavu objednavky (nova, kontrola, schvalena, tiskne se, post-processing, pripravena,
odeslana, hotovo, zrusena) by mela vyvolat automaticky email s relevantnimi informacemi.

Tato sekce je nejrozsahlejsi z implementovanych — vyzaduje:
1. Admin UI pro spravu emailovych sablon (WYSIWYG/HTML editor)
2. Admin UI pro konfiguraci email providera (SMTP/API)
3. Admin UI pro log odeslanych emailu
4. Backend service pro renderovani sablon a odesilani
5. Integrace s objednavkovym systemem (trigger pri zmene stavu)
6. Branding integrace (logo, barvy, paticka z Admin > Branding)

**Business value:**
- Profesionalni komunikace se zakazniky — automaticke notifikace misto manualniho posilani
- Zvyseni duvery zakazniku — zakaznik vi o kazdem kroku objednavky
- Snizeni support dotazu — zakaznik se nemusi ptat "kde je moje objednavka?"
- Sledovani dorucitelnosti — log odeslanych emailu s statusy
- Brandovane emaily — logo a barvy firmy v kazdem emailu

### A2. Priorita, obtiznost, vlna

**Priorita P1** — dulezita pro profesionalni dojem, ale neni blocker pro zakladni funkcnost.
Bez emailu objednavky funguji, jen zakaznik nedostava automaticke notifikace.

**Obtiznost Vysoka** — vyzaduje:
- Email provider integrace (Resend, SendGrid, Nodemailer + SMTP)
- Template system s promennymi (Handlebars-like)
- HTML email rendering (kompatibilita s emailovymi klienty)
- Backend service pro odesilani (neni mozne primo z browseru)
- WYSIWYG/HTML editor v admin UI
- Log system pro sledovani dorucitelnosti
- Security (API klice, DKIM, SPF)

**Vlna 2** — vyzaduje S02 (objednavkovy system) a benefit z S04 (dopravni informace v emailech).

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred touto sekci:**
- S02 (Checkout/Objednavky) — objednavkovy system a stavovy stroj
- S01 (Bug Fixes) — zakladni stabilita

**Silne doporucene:**
- S04 (Doprava) — tracking number, dopravce, odkaz na sledovani v emailu
- S06 (Post-Processing) — status ORDER_POSTPROCESS email

**Tato sekce je zavislost pro:**
- S11 (Chat) — emailove notifikace o novych zpravach v chatu
- S12 (Zakaznicky portal) — reset hesla email, potvrzeni registrace
- S10 (Kupony) — email s kuponovym kodem

**Paralelni implementace mozna s:**
- S05 (Volume Discounts) — nezavisly subsystem
- S06 (Post-Processing) — post-processing email je jen sablona

### A4. Soucasny stav v codebase

**Orders storage — `src/utils/adminOrdersStorage.js`:**
- `ORDER_STATUSES`: `['NEW', 'REVIEW', 'APPROVED', 'PRINTING', 'POSTPROCESS', 'READY', 'SHIPPED', 'DONE', 'CANCELED']`
- Kazda objednavka ma: `id, status, customer (name, email, phone), models[], totals, created_at`
- Funkce `computeOrderTotals()` pocita celkove ceny

**Backend — `backend-local/`:**
- Express server na portu 3001
- Vite proxy: `/api → :3001`
- Aktualne resi jen slicing (PrusaSlicer CLI)
- **NEMA** zadny email endpoint

**Branding — `src/utils/adminBrandingWidgetStorage.js`:**
- Obsahuje logo, nazev firmy, primarni barvu
- Tyto hodnoty se pouziji v emailovych sablonach

**Zadne emailove soubory v codebase:**
- Zadny `adminEmailStorage.js`
- Zadne email sablony
- Zadny email service

### A5. Referencni zdroje a konkurence

**OSS knihovny (z doporuceni):**
- **Nodemailer** (16k+ stars) — SMTP sending, spolehlivy, overeny
- **React Email** (14k+ stars) — React komponenty pro emaily, moderni, TypeScript
- **MJML** (17k+ stars) — Responsive email framework, kompiluje do HTML
- **BullMQ** (6k+ stars) — Redis-based job queue pro email fronty
- **Handlebars** (18k+ stars) — Templating engine s promennymi a podmInkami
- **email-templates** (3.6k+ stars) — Template rendering

**Doporuceni:** `React Email` pro tvorbu sablon + `Nodemailer` pro SMTP + `BullMQ` pro fronty

**Email provideri (transactional):**
- **Resend** — moderni API, free tier 100 emailu/den, doporuceno
- **SendGrid** — robustni, free tier 100/den
- **Amazon SES** — nejlevnejsi pro velke objemy
- **Postmark** — zamereny na dorucitelnost
- **Mailgun** — dobry pomer cena/vykon
- **Vlastni SMTP** — pres Nodemailer, plna kontrola

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Novy namespace: `email:v1`**
**Novy helper: `src/utils/adminEmailStorage.js`**

**Email config schema:**
```json
{
  "schema_version": 1,
  "provider": {
    "type": "resend",
    "api_key_encrypted": "***",
    "from_name": "ModelPricer s.r.o.",
    "from_email": "objednavky@firma.cz",
    "reply_to": "info@firma.cz",
    "verified": false,
    "last_test_at": null
  },
  "branding": {
    "use_branding_logo": true,
    "custom_logo_url": null,
    "use_branding_color": true,
    "custom_primary_color": null,
    "footer_text": "{{company_name}} | {{company_address}}\nEmail: {{company_email}} | Tel: {{company_phone}}",
    "unsubscribe_enabled": true
  },
  "templates": [
    {
      "id": "tpl_order_created_customer",
      "name": "Nova objednavka (zakaznik)",
      "trigger_status": "NEW",
      "recipient_type": "CUSTOMER",
      "subject": "Potvrzeni objednavky #{{order_id}}",
      "content_html": "<h1>Dobry den, {{customer_name}}!</h1><p>Vase objednavka #{{order_id}} byla prijata.</p>...",
      "is_active": true,
      "created_at": "2026-02-06T12:00:00Z",
      "updated_at": "2026-02-06T12:00:00Z"
    },
    {
      "id": "tpl_order_created_admin",
      "name": "Nova objednavka (admin)",
      "trigger_status": "NEW",
      "recipient_type": "ADMIN",
      "subject": "Nova objednavka #{{order_id}} od {{customer_name}}",
      "content_html": "...",
      "is_active": true,
      "created_at": "2026-02-06T12:00:00Z",
      "updated_at": "2026-02-06T12:00:00Z"
    }
  ],
  "updated_at": "2026-02-06T12:00:00Z"
}
```

**Email log schema (separatni namespace `email:logs:v1`):**
```json
[
  {
    "id": "log_001",
    "template_id": "tpl_order_created_customer",
    "order_id": "ord_12345",
    "recipient": "jan@example.com",
    "subject": "Potvrzeni objednavky #12345",
    "status": "delivered",
    "provider_message_id": "msg_abc123",
    "sent_at": "2026-02-06T10:30:00Z",
    "opened_at": "2026-02-06T11:15:00Z",
    "clicked_at": null,
    "error_message": null
  }
]
```

**Template promenne:**
```
// Zakaznik
{{customer_name}}        - Jmeno zakazniky
{{customer_email}}       - Email zakazniky
{{customer_phone}}       - Telefon zakazniky

// Objednavka
{{order_id}}             - Reference cislo objednavky
{{order_date}}           - Datum vytvoreni
{{order_total}}          - Celkova cena (formatovana)
{{order_items}}          - Pole polozek (pro #each loop)
{{order_status}}         - Aktualni stav
{{order_tracking_url}}   - URL pro sledovani objednavky

// Doprava (S04)
{{shipping_method}}      - Nazev dopravce/metody
{{shipping_price}}       - Cena dopravy
{{tracking_number}}      - Sledovaci cislo
{{tracking_url}}         - URL pro sledovani zasilky
{{estimated_delivery}}   - Odhadovane doruceni

// Firma (z Branding)
{{company_name}}         - Nazev firmy
{{company_logo}}         - URL loga
{{company_email}}        - Email firmy
{{company_phone}}        - Telefon firmy
{{company_address}}      - Adresa firmy
{{primary_color}}        - Primarni barva (#hex)
```

**Klic v localStorage:**
- Config: `modelpricer:${tenantId}:email:v1`
- Logs: `modelpricer:${tenantId}:email:logs:v1`

### B2. API kontrakty (endpointy)

**Nove backend endpointy (backend-local Express):**

```
# Email provider konfigurace
GET    /api/v1/email/config
Response: { provider: {...}, branding: {...} }

PUT    /api/v1/email/config
Body:   { provider: {...}, branding: {...} }
Response: { ...saved }

POST   /api/v1/email/test-connection
Body:   { provider: { type, api_key, from_email } }
Response: { success: true, message: "Pripojeni OK" }
         | { success: false, error: "Invalid API key" }

# Sablony
GET    /api/v1/email/templates
Response: { templates: [...] }

PUT    /api/v1/email/templates/:templateId
Body:   { subject, content_html, is_active, ... }
Response: { ...updated template }

# Odeslani
POST   /api/v1/email/send
Body:   { template_id, order_id, recipient_override? }
Response: { success: true, message_id: "msg_123" }

POST   /api/v1/email/send-test
Body:   { template_id, test_email: "test@example.com" }
Response: { success: true }

# Nahled
POST   /api/v1/email/preview
Body:   { template_id, order_id? }
Response: { html: "...rendered HTML...", subject: "..." }

# Log
GET    /api/v1/email/logs
Query:  ?page=1&limit=20&status=delivered&order_id=123
Response: { logs: [...], total: 42, page: 1 }

# Trigger (interni — volano pri zmene stavu objednavky)
POST   /api/v1/email/trigger
Body:   { order_id, old_status, new_status }
Response: { sent: true, template_id: "tpl_...", message_id: "msg_..." }
```

**Error kody:**
- `400` — nevalidni request
- `401` — chybejici autentizace
- `404` — sablona/objednavka nenalezena
- `422` — provider neni nakonfigurovany
- `429` — rate limit (max 100 emailu/hodinu)
- `500` — interni chyba (provider nedostupny)

### B3. Komponentni strom (React)

```
AdminEmailNotifications.jsx (NOVA STRANKA: /admin/emails)
├── EmailTabNav
│   ├── Tab: "Sablony" (active)
│   ├── Tab: "Nastaveni"
│   └── Tab: "Log"
│
├── [Tab: Sablony]
│   ├── TemplateList
│   │   ├── TemplateListItem (pro kazdou sablonu)
│   │   │   ├── StatusBadge (aktivni/neaktivni)
│   │   │   ├── TemplateName
│   │   │   ├── TriggerStatus (ORDER_CREATED, ...)
│   │   │   ├── RecipientType (CUSTOMER / ADMIN)
│   │   │   └── EditButton
│   │   └── [prazdny stav: "Zatim zadne sablony"]
│   └── TemplateEditor (modal nebo panel)
│       ├── TemplateActiveToggle
│       ├── SubjectInput (s template promennymi)
│       ├── ContentEditor
│       │   ├── HtmlEditor (CodeMirror / textarea)
│       │   └── VariablesHelper (seznam dostupnych promennych)
│       ├── PreviewButton → PreviewModal
│       │   ├── DesktopView
│       │   ├── MobileView
│       │   └── MockDataSelector
│       ├── SendTestButton → TestEmailDialog
│       │   ├── EmailInput
│       │   └── SendButton
│       └── SaveButton
│
├── [Tab: Nastaveni]
│   ├── ProviderConfig
│   │   ├── ProviderSelector (Resend / SendGrid / SMTP / disabled)
│   │   ├── ApiKeyInput (masked)
│   │   ├── FromNameInput
│   │   ├── FromEmailInput
│   │   ├── ReplyToInput
│   │   └── TestConnectionButton
│   ├── BrandingConfig
│   │   ├── LogoSelector ("Pouzit z Branding" / "Nahrat jiny")
│   │   ├── ColorSelector ("Pouzit z Branding" / "Vlastni")
│   │   ├── FooterEditor (textarea)
│   │   └── UnsubscribeToggle
│   └── SaveSettingsButton
│
└── [Tab: Log]
    ├── LogFilters
    │   ├── DateRangePicker
    │   ├── StatusFilter (vsechny / dorucene / nedorucene)
    │   ├── RecipientSearch
    │   └── OrderSearch
    ├── LogTable
    │   ├── LogRow
    │   │   ├── DateColumn
    │   │   ├── RecipientColumn
    │   │   ├── SubjectColumn
    │   │   ├── StatusBadge (doruceno / odeslano / nedoruceno)
    │   │   └── OrderLink
    │   └── Pagination
    └── LogStats (celkova statistika: odeslano, doruceno, nedoruceno)
```

### B4. Tenant storage namespace

- **Config namespace:** `email:v1` (NOVY)
- **Logs namespace:** `email:logs:v1` (NOVY)
- **Helper:** `src/utils/adminEmailStorage.js` (NOVY)
- **Pattern:** Stejny jako existujici helpery — `readTenantJson()` / `writeTenantJson()` z `adminTenantStorage.js`

```javascript
// adminEmailStorage.js — API
export function loadEmailConfig()           // → { provider, branding, templates, ... }
export function saveEmailConfig(config)     // → normalized config
export function loadEmailLogs()             // → [{ id, template_id, ... }, ...]
export function appendEmailLog(entry)       // → updated logs
export function getDefaultEmailConfig()     // → default config s prazdnymi sablonami
export function normalizeEmailConfig(input) // → normalized config
export function getTemplateById(id)         // → template | null
export function getTemplatesForStatus(status, recipientType) // → [templates]
export function renderTemplate(html, data)  // → rendered HTML string
```

### B5. Widget integrace (postMessage)

Widget NEMA primou integraci s emailem — emaily se odesilaji z backendu.
Widget muze zobrazit info o emailovych notifikacich:

```javascript
// Po dokonceni objednavky pres widget
{
  type: 'MODELPRICER_ORDER_CONFIRMED',
  payload: {
    order_id: '12345',
    email_notification_sent: true,
    message: 'Potvrzeni objednavky bylo odeslano na vas email.'
  }
}
```

### B6. Pricing engine integrace

**Pricing engine NEPOTREBUJE ZMENU.** Emailovy system je nezavisly na cenotvorbe.

Emailovy system cte data z:
- `adminOrdersStorage.js` — objednavkova data
- `adminBrandingWidgetStorage.js` — branding (logo, barvy, firma)
- `adminPricingStorage.js` — pricing data (pro zobrazeni cen v emailu)

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-backend` | Architektura email service | `backend-local/` | P0 |
| `mp-spec-be-email` | Email provider integrace (Nodemailer/Resend) | `backend-local/services/emailService.js` | P0 |
| `mp-spec-be-queue` | Email queue (pro budouci BullMQ) | `backend-local/services/emailQueue.js` | P2 |
| `mp-mid-storage-tenant` | adminEmailStorage.js | `src/utils/adminEmailStorage.js` | P0 |
| `mp-mid-frontend-admin` | AdminEmailNotifications stranka | `src/pages/admin/AdminEmailNotifications.jsx` | P0 |
| `mp-spec-fe-forms` | TemplateEditor, ProviderConfig | komponenty | P0 |
| `mp-spec-fe-tables` | LogTable, TemplateList | komponenty | P1 |
| `mp-spec-fe-routing` | Nova route /admin/emails | `src/Routes.jsx` | P0 |
| `mp-mid-backend-api` | REST endpointy pro email | `backend-local/routes/emailRoutes.js` | P0 |
| `mp-mid-backend-services` | Template rendering, trigger logic | `backend-local/services/` | P0 |
| `mp-sr-design` | Email template design | - | P1 |
| `mp-spec-design-a11y` | Accessibility emailoveho editoru | - | P1 |
| `mp-sr-security` | Security review (API klice, DKIM) | - | P0 |
| `mp-spec-security-gdpr` | GDPR compliance (unsubscribe, data retention) | - | P1 |
| `mp-spec-test-build` | Testy | testy | P0 |
| `mp-sr-i18n` | Prekladove klice CZ/EN | `src/locales/` | P1 |

### C2. Implementacni kroky (poradi)

**FAZE 1: Storage a backend zaklad (3-4 dny)**

**Krok 1.1: Email storage helper**
- Vytvorit `src/utils/adminEmailStorage.js`
- Implementovat load/save/normalize pro email:v1 namespace
- Default sablony pro vsechny ORDER_STATUSES
- Template rendering funkce (Handlebars-like s {{promenne}})

**Krok 1.2: Backend email service (paralelni s 1.1)**
- Vytvorit `backend-local/services/emailService.js`
- Provider abstrakce (Resend, SendGrid, SMTP/Nodemailer)
- Funkce: `sendEmail({ to, from, subject, html })`
- Error handling a retry logika (1x retry po 30s)

**Krok 1.3: Backend API routes (po 1.2)**
- Vytvorit `backend-local/routes/emailRoutes.js`
- Endpointy: config CRUD, send, send-test, preview, logs, trigger
- Validace requestu (express-validator)
- Rate limiting (express-rate-limit: 100/hodinu)

**Krok 1.4: Order status trigger (po 1.3)**
- Hook do zmeny stavu objednavky
- Pri zmene statusu → najit aktivni sablonu → renderovat → odeslat
- Log odeslani do email:logs:v1

**FAZE 2: Admin UI (3-4 dny)**

**Krok 2.1: Nova admin stranka a routing**
- Vytvorit `src/pages/admin/AdminEmailNotifications.jsx`
- Pridat route `/admin/emails` do `src/Routes.jsx`
- Pridat odkaz do admin navigace (AdminLayout.jsx)
- Tab navigace: Sablony | Nastaveni | Log

**Krok 2.2: Tab Sablony — TemplateList (paralelni s 2.3)**
- Seznam vsech sablon s filtrovanim
- Stav (aktivni/neaktivni), trigger status, recipient type
- Kliknuti otevre editor

**Krok 2.3: Tab Sablony — TemplateEditor (paralelni s 2.2)**
- Subject input s template promennymi
- HTML/text editor pro obsah (CodeMirror nebo textarea s syntax highlighting)
- Seznam dostupnych promennych (kliknutim vlozi)
- Toggle aktivni/neaktivni
- Ulozit/Zrusit

**Krok 2.4: Preview a testovaci email (po 2.3)**
- Preview modal: Desktop/Mobile view
- Mock data pro nahled (fiktivni objednavka)
- "Odeslat testovaci email" — input pro email adresu + send button

**Krok 2.5: Tab Nastaveni (paralelni s 2.2-2.4)**
- Provider konfigurace (typ, API klic, from, reply-to)
- Test pripojeni button
- Branding konfigurace (logo, barva, paticka)

**Krok 2.6: Tab Log (paralelni s 2.5)**
- Tabulka odeslanych emailu
- Filtry: datum, stav, prijemce, objednavka
- Pagination
- Statistiky

**FAZE 3: Integrace a testy (2-3 dny)**

**Krok 3.1: Integrace s objednavkovym systemem**
- Pri zmene stavu v AdminOrders → trigger email
- Potvrzeni "Email odeslan" v UI objednavky

**Krok 3.2: Default sablony**
- 9 defaultnich sablon (pro kazdy ORDER_STATUS)
- + 1 admin sablona pro ORDER_CREATED
- Kvalitni HTML s inline CSS (email-compatible)

**Krok 3.3: Testy**
- Unit testy: renderTemplate, normalizeEmailConfig
- Integration testy: send email flow
- Build test
- Smoke test: zmena stavu objednavky → email odeslan

**Paralelizovatelnost:**
- Faze 1: Kroky 1.1 + 1.2 paralelne. Pak 1.3, pak 1.4.
- Faze 2: Kroky 2.2 + 2.3 + 2.5 + 2.6 paralelne (po 2.1).
- Faze 3: Sekvencni.

### C3. Kriticke rozhodovaci body

1. **Ktery email provider jako default?**
   - Rozhodnuti: **Resend** jako doporuceny, SMTP jako fallback
   - Duvod: Resend ma jednoduche API, free tier, dobra dokumentace
   - Admin si muze vybrat: Resend / SendGrid / SMTP (Nodemailer)

2. **Template engine: Handlebars vs vlastni?**
   - Rozhodnuti: **Vlastni jednoduchy renderer** (regex replace pro {{promenne}})
   - Duvod: Handlebars je overkill pro jednoduche promenne, pridava zavislost
   - Podpora: `{{promenna}}`, `{{#each pole}}...{{/each}}`, `{{#if promenna}}...{{/if}}`

3. **Kam ukladat API klice?**
   - Rozhodnuti: **Backend environment variables** (NE v localStorage!)
   - localStorage varianta jen pro demo mode (sifrovany, s upozornenim)
   - Produkce: `.env` soubor na backendu

4. **WYSIWYG vs HTML editor?**
   - Rozhodnuti: **HTML editor** (textarea/CodeMirror) v prvni fazi
   - WYSIWYG (TipTap/ProseMirror) az v pozdejsi fazi — slozita integrace
   - Preview modal kompenzuje absenci WYSIWYG

5. **Synchronni vs asynchronni odesilani?**
   - Rozhodnuti: **Synchronni** v prvni fazi (prima response)
   - Asynchronni (BullMQ queue) az pri skale > 100 emailu/den
   - Timeout: 10s na odeslani, pak error log

6. **Kam ukladat email logy?**
   - Rozhodnuti: **localStorage** (email:logs:v1) pro demo, max 500 zaznamu
   - Produkce: Databaze (PostgreSQL) pres backend API

### C4. Testovaci strategie

**Unit testy:**
- `renderTemplate()` — vsechny typy promennych (string, pole, podminka)
- `normalizeEmailConfig()` — chybejici pole, nevalidni data
- `getTemplatesForStatus()` — spravne filtrovani
- Provider abstrakce — mock send

**Integration testy:**
- Zmena stavu objednavky → trigger → email odeslan (mock provider)
- Admin ulozi sablonu → zmena stavu → email s novou sablonou
- Test connection → uspech/chyba

**Edge cases:**
- Provider neni nakonfigurovany → graceful error, log, no crash
- Sablona neexistuje pro dany stav → skip, log warning
- Template promenna chybi v datech → prazdny string (ne {{...}})
- Email adresa nevalidni → error v logu, ne crash
- Velky pocet objednavek najednou → rate limiting

**E2E testy:**
- Admin nastavi provider → vytvori sablonu → zmeni stav objednavky → email odeslan
- Admin deaktivuje sablonu → zmena stavu → email se NEODESI
- Admin odesle testovaci email → prijde na zadanou adresu

**Security testy:**
- XSS v sablone (HTML injection pres template promenne)
- API klic neni viditelny v localStorage (demo mode)
- Rate limiting funguje

### C5. Migrace existujicich dat

**Zadna migrace — uplne novy namespace.**
- `email:v1` se vytvori pri prvnim nacteni s defaultnimi sablonami
- `email:logs:v1` zacina prazdny
- Existujici objednavky (orders:v1) nemaji email historii — to je OK

---

## D. KVALITA

### D1. Security review body

- **API klice:** NIKDY v localStorage pro produkci. Demo mode: encrypted, s varovnim banerem
- **XSS prevence:** Template promenne se MUSI escapovat pred vlozenim do HTML
  - `{{customer_name}}` → `escapeHtml(customer_name)`
  - Vyjimka: `{{{raw_html}}}` (triple braces) pro duveryhodny obsah (logo URL, atd.)
- **CSRF:** Backend endpointy chranene CSRF tokenem
- **Rate limiting:** Max 100 emailu/hodinu/tenant, max 10 testovacich emailu/hodinu
- **Input validace:**
  - Email adresa: regex + DNS MX check (backend)
  - Subject: max 255 znaku, strip HTML
  - Content: max 100KB HTML
  - API key: validace formatu dle provideru
- **DKIM/SPF:** Dokumentace pro adminy jak nastavit DNS zaznamy
- **Unsubscribe:** CAN-SPAM compliance — kazdy email ma unsubscribe odkaz
- **Data retention:** Email logy uchovavat max 90 dni (GDPR)

### D2. Performance budget

- **Admin stranka load:** < 500ms (lazy loaded)
- **Template preview:** < 200ms rendering
- **Email odeslani:** < 10s (timeout)
- **Log tabulka:** Virtualizovana pro > 100 zaznamu
- **Bundle size:** +~15KB minified (nova stranka + komponenty)
  - CodeMirror (pokud pouzity): lazy loaded, +~80KB
  - Alternativa: textarea s custom styling, +~2KB

### D3. Accessibility pozadavky

- **Template editor:** Label pro kazdy input, aria-describedby pro napovedu
- **Tab navigace:** ARIA role="tablist", role="tab", role="tabpanel"
- **Log tabulka:** role="table", scope="col" pro hlavicku
- **Modaly:** Focus trap, Escape pro zavreni, aria-modal="true"
- **Keyboard:** Vsechny akce dostupne pres klavesnici
- **Screen readers:** Oznameni o uspesnem/neuspesnem odeslani (aria-live)
- **Color contrast:** Status badges (zelena/cervena) s dostatecnym kontrastem + textovy label

### D4. Error handling a edge cases

| Chybovy stav | Reseni | UI zpetna vazba |
|-------------|--------|-----------------|
| Provider neni nakonfigurovany | Skip email, log warning | Banner "Emailovy provider neni nastaven" |
| API klic nevalidni | Error od provideru | Toast "Neplatny API klic" |
| Email bounced | Log status "bounced" | Cerveny status v logu |
| Template chybi promenna | Nahradit prazdnym stringem | Zadna UI indikace (graceful) |
| Email adresa nevalidni | Validace pred odeslanim | Toast "Neplatna emailova adresa" |
| Provider timeout (>10s) | Retry 1x, pak error log | Toast "Odeslani selhalo, zkuste pozdeji" |
| Rate limit exceeded | Reject, log | Toast "Prilis mnoho emailu, zkuste za hodinu" |
| localStorage plny (logs) | FIFO — smazat nejstarsi | Zadna UI indikace |
| HTML v sablone nefunkcni | Preview ukaze broken HTML | Preview funguje vzdy (i broken) |

### D5. i18n pozadavky

**Nove CZ/EN klice (vyber klicovych):**
```json
{
  "admin.emails.title": "Emailove notifikace / Email Notifications",
  "admin.emails.tabs.templates": "Sablony / Templates",
  "admin.emails.tabs.settings": "Nastaveni / Settings",
  "admin.emails.tabs.log": "Log odeslanych / Sent log",

  "admin.emails.templates.list_title": "Emailove sablony / Email templates",
  "admin.emails.templates.active": "Aktivni / Active",
  "admin.emails.templates.inactive": "Neaktivni / Inactive",
  "admin.emails.templates.trigger": "Trigger stav / Trigger status",
  "admin.emails.templates.recipient": "Prijemce / Recipient",
  "admin.emails.templates.edit": "Upravit / Edit",
  "admin.emails.templates.subject": "Predmet / Subject",
  "admin.emails.templates.content": "Obsah / Content",
  "admin.emails.templates.variables": "Dostupne promenne / Available variables",
  "admin.emails.templates.preview": "Nahled / Preview",
  "admin.emails.templates.send_test": "Odeslat testovaci email / Send test email",
  "admin.emails.templates.save": "Ulozit zmeny / Save changes",

  "admin.emails.settings.provider": "Email provider / Email provider",
  "admin.emails.settings.provider.resend": "Resend",
  "admin.emails.settings.provider.sendgrid": "SendGrid",
  "admin.emails.settings.provider.smtp": "SMTP (Nodemailer)",
  "admin.emails.settings.provider.disabled": "Vypnuto / Disabled",
  "admin.emails.settings.api_key": "API klic / API key",
  "admin.emails.settings.from_name": "Jmeno odesilatele / Sender name",
  "admin.emails.settings.from_email": "Email odesilatele / Sender email",
  "admin.emails.settings.reply_to": "Reply-to / Reply-to",
  "admin.emails.settings.test_connection": "Otestovat pripojeni / Test connection",
  "admin.emails.settings.branding.title": "Branding emailu / Email branding",
  "admin.emails.settings.branding.use_logo": "Pouzit logo z Branding / Use logo from Branding",
  "admin.emails.settings.branding.use_color": "Pouzit barvu z Branding / Use color from Branding",
  "admin.emails.settings.branding.footer": "Paticka emailu / Email footer",
  "admin.emails.settings.branding.unsubscribe": "Odhlaseni z odberu / Unsubscribe link",

  "admin.emails.log.title": "Log odeslanych emailu / Sent email log",
  "admin.emails.log.date": "Datum / Date",
  "admin.emails.log.recipient": "Prijemce / Recipient",
  "admin.emails.log.subject": "Predmet / Subject",
  "admin.emails.log.status": "Stav / Status",
  "admin.emails.log.status.sent": "Odeslano / Sent",
  "admin.emails.log.status.delivered": "Doruceno / Delivered",
  "admin.emails.log.status.bounced": "Nedoruceno / Bounced",
  "admin.emails.log.status.failed": "Selhalo / Failed",
  "admin.emails.log.order": "Objednavka / Order",

  "admin.emails.status.not_configured": "Emailovy provider neni nastaven / Email provider not configured",
  "admin.emails.toast.test_success": "Testovaci email odeslan / Test email sent",
  "admin.emails.toast.test_fail": "Odeslani selhalo / Sending failed",
  "admin.emails.toast.saved": "Nastaveni ulozeno / Settings saved",
  "admin.emails.toast.connection_ok": "Pripojeni OK / Connection OK",
  "admin.emails.toast.connection_fail": "Pripojeni selhalo / Connection failed"
}
```

**Samotne emaily:** Sablony jsou per-tenant, admin je pise v jazyce svych zakazniku.
System nepotrebuje automaticky preklad emailu (admin ma plnou kontrolu nad obsahem).

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

- **Feature flag:** Implicitni — pokud admin nenastavi provider, emaily se neodesilaji
- **Graceful degradation:** Bez nakonfigurovaneho provideru:
  - Admin vidi stranku /admin/emails
  - Banner "Nastavte emailovy provider pro odesilani notifikaci"
  - Sablony lze editovat a ukladat
  - Emaily se neodesilaji (jen log warning)

**Rollout postup:**
1. Merge kodu s prazdnym providerem (disabled)
2. Interni testovani s Resend test API key
3. Dokumentace pro adminy (jak nastavit Resend/SMTP)
4. Admin nastavi provider → emaily se zacinaji odesilat
5. Monitoring logu prvni tyden

### E2. Admin UI zmeny

- **Nova stranka:** `/admin/emails` — AdminEmailNotifications.jsx
- **Nova polozka v navigaci:** "Emaily" s ikonou Mail (v AdminLayout.jsx)
- **Umisteni v nav:** Za "Team" a pred "Analytics"
- **3 zAlozky:** Sablony | Nastaveni | Log
- **Default sablony:** 10 predpripravenych sablon (9 zakaznik + 1 admin)

### E3. Widget zmeny

- Widget NEMA primou UI zmenu pro emaily
- Po odeslani objednavky: zprava "Potvrzeni bylo odeslano na vas email"
- Widget nema pristup k emailovemu systemu (security)

### E4. Dokumentace pro uzivatele

- **Setup guide:** Jak nastavit email provider (Resend krok-za-krokem)
- **Template guide:** Jak editovat sablony, dostupne promenne
- **Troubleshooting:** Caste problemy (SPF/DKIM, bounced emaily, spam folder)
- **SMTP guide:** Jak pouzit vlastni SMTP server

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Admin setup completion | >60% tenantu nastavi provider | Storage analytics |
| Email dorucitelnost | >95% delivered | Email logs |
| Cas do prvniho emailu | <1 hodina po setup | Timestamp analyz |
| Pocet sablon aktivnich | >=5 z 10 | Template config |
| Template customizace | >30% adminu upravi sablonu | Updated_at tracking |
| Support dotazy "kde je objednavka" | -50% | Support metriky |
| Bug reports | 0 P0 | Issue tracker |
