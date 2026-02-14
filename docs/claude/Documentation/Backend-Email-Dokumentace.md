# Backend Email — Dokumentace

> Email service pro transakcni emaily (objednavky, notifikace). Adapter-pattern architektura
> s podporou vice provideru (SMTP, Resend, SendGrid). Aktualne **demo mode** — vsechny
> providery jsou stubovane, zadne realne odesilani neprobliha.

---

## 1. Prehled

Email subsystem v `backend-local` zajistuje:
- **Rendering** transakcnich emailovych sablon (order confirmed, printing, shipped, completed, cancelled)
- **Odesilani** pres konfigurovatelneho providera (adapter pattern)
- **Trigger system** — automaticke emaily pri zmene stavu objednavky
- **In-memory log** — poslednich 200 emailovych operaci pro debugging

**Aktualni stav:** Vsechny providery (smtp, resend, sendgrid) jsou **stubovane** — nevyzaduji zadne
externi zavislosti (nodemailer, @resend/node, @sendgrid/mail). V demo modu se email pouze zaloguje
do in-memory pole. Realna integrace je pripravena k implementaci.

**Klicove charakteristiky:**
- **Zadne externi zavislosti** — cely modul funguje bez dalsich npm packages
- **Pure functions** — zadna zavislost na Express (req/res/next) v service vrstve
- **Adapter pattern** — provider se meni jednim konfiguracnim klicem
- **XSS ochrana** — HTML escaping ve vsech template promennych
- **Sablonovy system** — `{{variable}}` syntax s podporou nested objektu

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Runtime | Node.js 18+ ESM (import/export) |
| Jazyk | JavaScript (cisty, bez TypeScript) |
| Template engine | Vlastni `{{variable}}` parser (bez Handlebars) |
| Externi zavislosti | **Zadne** — cely modul je self-contained |
| Express zavislost | **NE** v service vrstve (jen v `emailRoutes.js`) |
| Provider pattern | Adapter — `createProvider(config)` vraci objekt s `send()` |
| Email format | HTML s inline CSS (email-compatible styling) |
| Logging | In-memory pole (max 200 zaznamu, FIFO) |

### Budouci zavislosti (pro realne odesilani)
- `nodemailer` — SMTP provider
- `@resend/node` nebo `fetch` — Resend API provider
- `@sendgrid/mail` nebo `fetch` — SendGrid API provider

---

## 3. Architektura souboru (5 souboru ~270 r.)

```
backend-local/src/email/
  emailService.js       # 87 r. — orchestrator: rendering + sending + logging
  emailProvider.js       # 49 r. — adapter factory: smtp/resend/sendgrid/none
  templateRenderer.js    # 45 r. — {{variable}} parser s HTML escapingem
  triggers.js            # 29 r. — event system: order status -> email trigger
  templates/
    index.js             # 60 r. — HTML sablony pro 5 order event typu

backend-local/src/routes/
  emailRoutes.js         # 40 r. — Express router (NE soucasti email modulu,
                         #         ale volajici — vlastni mp-mid-backend-api)
```

### Vlastnictvi souboru

| Soubor | Vlastnik | Poznamka |
|--------|----------|----------|
| `email/emailService.js` | `mp-mid-backend-services` | Hlavni orchestrator |
| `email/emailProvider.js` | `mp-mid-backend-services` | Provider adaptery |
| `email/templateRenderer.js` | `mp-mid-backend-services` | Template engine |
| `email/triggers.js` | `mp-mid-backend-services` | Event-to-email mapper |
| `email/templates/index.js` | `mp-mid-backend-services` | HTML sablony |
| `routes/emailRoutes.js` | `mp-mid-backend-api` | HTTP vrstva (mimo scope) |

---

## 4. Import graf

```
emailRoutes.js (Express router — MIMO scope email modulu)
  |
  +-- emailService.js
  |     +-- templateRenderer.js
  |           +-- templates/index.js (DEFAULT_TEMPLATES)
  |
  +-- templateRenderer.js (primo pro preview/list)

triggers.js
  +-- emailService.js
        +-- templateRenderer.js
              +-- templates/index.js

emailProvider.js  <-- NEPOUZIVANY v aktualnim kodu!
                      (pripraveny pro budouci refactor, viz Zname omezeni)
```

**Poznamka:** `emailProvider.js` definuje `createProvider()` factory, ale `emailService.js`
aktualne provider logiku implementuje primo v `sendEmail()` funkci misto pouziti adapteru.
Jedna se o pripraveny, ale nezapojeny modul.

---

## 6. Datovy model (email templates, konfigurace)

### 6.1 Email sablony (DEFAULT_TEMPLATES)

5 vestavnych sablon, kazda obalena sdilenym `baseLayout()` wrapperem:

| Template ID | Ucel | Specificke promenne |
|-------------|------|---------------------|
| `order_confirmed` | Objednavka potvrzena | `order.total` (zobrazuje CZK) |
| `order_printing` | Objednavka se tiskne | — |
| `order_shipped` | Objednavka odeslana | — |
| `order_completed` | Objednavka dokoncena | — |
| `order_cancelled` | Objednavka zrusena | — |

### 6.2 Sdilene template promenne

Vsechny sablony pouzivaji tyto `{{promenne}}`:

| Promenna | Typ | Popis |
|----------|-----|-------|
| `order.shop_name` | string | Nazev obchodu (v base layout headeru) |
| `order.customer.name` | string | Jmeno zakaznika |
| `order.id` | string | ID objednavky |
| `order.total` | string/number | Celkova cena (jen v order_confirmed) |

### 6.3 Base layout struktura

```
+-------------------------------------------+
| HEADER (tmave pozadi #1a1a1a)             |
|   {{order.shop_name}}                     |
+-------------------------------------------+
| CONTENT (bile pozadi)                     |
|   [specificke sablone dle event typu]     |
+-------------------------------------------+
| FOOTER (svetle sede pozadi)               |
|   "This is an automated message..."       |
+-------------------------------------------+
```

- Max sirka: 600px (email standard)
- Inline CSS styling (zadne externi CSS soubory)
- Border radius 8px, border 1px solid #e5e7eb

### 6.4 Email konfigurace (providerConfig / emailConfig)

```javascript
// providerConfig — predava se do sendEmail()
{
  provider: 'none' | 'smtp' | 'resend' | 'sendgrid',
  // Budouci: SMTP host, port, auth, API klice...
}

// emailConfig — predava se do sendTriggeredEmail()
{
  provider: 'none' | 'smtp' | 'resend' | 'sendgrid',
  triggers: [
    {
      event: 'order_confirmed',  // event ID
      enabled: true,             // boolean — aktivni trigger?
      template_id: 'order_confirmed'  // optional, default = event name
    },
    // ...dalsi triggery
  ]
}
```

### 6.5 Email log entry

```javascript
{
  to: 'zakaznik@email.cz',
  subject: 'Order #abc123 Confirmed',
  templateId: 'order_confirmed',
  status: 'demo' | 'sent' | 'failed',
  timestamp: '2026-02-13T10:30:00.000Z',
  // Volitelne:
  html: '<!DOCTYPE...', // prvnich 200 znaku (jen v demo modu)
  provider: 'smtp',     // jen pri sent
  error: 'Template error: ...'  // jen pri failed
}
```

### 6.6 EVENT_MAP (triggers.js)

Mapovani order statusu na event ID:

| Order status | Event ID |
|-------------|----------|
| `confirmed` | `order_confirmed` |
| `printing` | `order_printing` |
| `shipped` | `order_shipped` |
| `completed` | `order_completed` |
| `cancelled` | `order_cancelled` |

---

## 7. API (vnitrni)

### 7.1 emailService.js — exportovane funkce

#### `sendEmail({ to, subject, templateId, data, providerConfig })`

Hlavni orchestrator — rendruje sablonu a odesle pres provider.

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `to` | string | ANO | Email prijemce |
| `subject` | string | ANO | Predmet emailu |
| `templateId` | string | NE | ID sablony z DEFAULT_TEMPLATES |
| `data` | object | NE | Data pro template rendering |
| `providerConfig` | object | NE | `{ provider: 'none'/'smtp'/... }` |

**Navratova hodnota:** `Promise<{ success: boolean, mode: string, message?: string }>`

**Chovani podle providera:**
- `'none'` (default) — demo mode, zaloguje email, neposila
- `'smtp'` — stub, zaloguje jako sent
- `'resend'` — stub, zaloguje jako sent
- `'sendgrid'` — stub, zaloguje jako sent
- cokoliv jineho — throw `Error('Unknown email provider: ...')`

#### `sendTriggeredEmail({ event, orderData, emailConfig })`

Odeslani emailu na zaklade triggeru. Vola `sendEmail()` internne.

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `event` | string | ANO | Event ID (napr. `'order_confirmed'`) |
| `orderData` | object | ANO | Data objednavky vcetne `customer.email` |
| `emailConfig` | object | ANO | Konfigurace s polem `triggers` |

**Navratova hodnota:** `Promise<result | null>`
- `null` pokud emailConfig chybi, trigger neni nalezen/enabled, nebo chybi zakaznicky email

**Hledani email adresy:**
1. `orderData.customer.email`
2. `orderData.contact.email` (fallback)

#### `getEmailLog()`

Vraci kopii in-memory email logu.

**Navratova hodnota:** `Array<EmailLogEntry>` — max 200 zaznamu, nejnovejsi prvni (LIFO)

### 7.2 templateRenderer.js — exportovane funkce

#### `renderTemplate(templateId, data)`

Rendruje HTML sablonu s daty.

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `templateId` | string | ANO | Klic v DEFAULT_TEMPLATES |
| `data` | object | NE | Data pro `{{variable}}` nahrazovani |

**Navratova hodnota:** `string` — HTML string
- Pokud sablona neexistuje: vraci fallback HTML `<p>Template "..." not found.</p>`

#### `listTemplates()`

**Navratova hodnota:** `string[]` — pole template ID (aktualne 5 polozek)

### 7.3 emailProvider.js — exportovane funkce

#### `createProvider(config)`

Factory pro vytvoreni provider adapteru. **Aktualne nepouzivany v produkci.**

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `config` | object | NE | `{ provider: 'none'/'smtp'/... }` |

**Navratova hodnota:** `{ type: string, send: async ({ to, subject, html, from }) => result }`

### 7.4 triggers.js — exportovane funkce

#### `onOrderStatusChange({ orderId, newStatus, oldStatus, orderData, emailConfig })`

Reaguje na zmenu stavu objednavky a spousti odpovidajici email trigger.

| Parametr | Typ | Povinny | Popis |
|----------|-----|---------|-------|
| `orderId` | string | NE | ID objednavky (pro logging) |
| `newStatus` | string | ANO | Novy status (`confirmed`, `printing`, ...) |
| `oldStatus` | string | NE | Predchozi status |
| `orderData` | object | ANO | Data objednavky |
| `emailConfig` | object | ANO | Email konfigurace s triggery |

**Navratova hodnota:** `Promise<result | null>`
- `null` pokud status nema mapovany event
- `{ success: false, error: string }` pokud odesilani selze

#### `getEventForStatus(status)`

Utility funkce pro ziskani event ID z order statusu.

**Navratova hodnota:** `string | null`

---

## 9. Data flow

### 9.1 Manualni odeslani emailu (pres API)

```
[Admin UI / Postman]
    |
    | POST /api/email/send { to, subject, templateId, data, providerConfig }
    v
emailRoutes.js (Express router)
    |
    v
emailService.sendEmail()
    |
    +-- templateRenderer.renderTemplate(templateId, data)
    |       |
    |       +-- templates/index.js (DEFAULT_TEMPLATES lookup)
    |       |
    |       +-- replaceVars() — rekurzivni {{var}} nahrazovani
    |       |       |
    |       |       +-- escapeHtml() — XSS ochrana
    |       |
    |       +-- return HTML string
    |
    +-- Provider routing (switch na providerConfig.provider)
    |       |
    |       +-- 'none'  -> demo log, return success
    |       +-- 'smtp'  -> stub log, return success
    |       +-- 'resend' / 'sendgrid' -> stub log, return success
    |       +-- unknown -> throw Error
    |
    +-- logEmail() — ulozeni do in-memory pole
    |
    +-- return { success, mode }
```

### 9.2 Automaticky trigger pri zmene stavu objednavky

```
[Order status change]
    |
    v
triggers.onOrderStatusChange({ orderId, newStatus, orderData, emailConfig })
    |
    +-- EVENT_MAP[newStatus] -> event ID (nebo null = return)
    |
    v
emailService.sendTriggeredEmail({ event, orderData, emailConfig })
    |
    +-- emailConfig.triggers.find(t => t.event === event && t.enabled)
    |       |
    |       +-- nenalezeno / disabled -> return null
    |
    +-- orderData.customer.email || orderData.contact.email
    |       |
    |       +-- chybi -> return null
    |
    +-- getSubjectForEvent(event, orderData)
    |       |
    |       +-- subjects mapa -> "Order #abc123 Confirmed" atd.
    |
    +-- sendEmail({ to, subject, templateId, data, providerConfig })
    |
    +-- return result
```

### 9.3 Template rendering pipeline

```
data = { order: { customer: { name: 'Jan' }, id: 'abc123', total: 500 } }
                    |
                    v
replaceVars(template, data, prefix='')
    |
    +-- Iterace pres entries:
    |     key='order', value=object -> recurse s prefix='order'
    |       key='customer', value=object -> recurse s prefix='order.customer'
    |         key='name', value='Jan' -> escapeHtml('Jan') -> 'Jan'
    |           replace /\{\{order\.customer\.name\}\}/g -> 'Jan'
    |       key='id', value='abc123' -> replace /\{\{order\.id\}\}/g -> 'abc123'
    |       key='total', value=500 -> replace /\{\{order\.total\}\}/g -> '500'
    |
    +-- return final HTML
```

---

## 10. Error handling

### 10.1 Chybove stavy v emailService.js

| Stav | Chovani | Log status |
|------|---------|------------|
| Chybi `to` nebo `subject` | `throw new Error('Missing required fields: to, subject')` | — (neprologovano) |
| Template rendering selze | Zaloguje `status: 'failed'` s error detailem, re-throw | `failed` |
| Neznamy provider | Zaloguje `status: 'failed'`, `throw new Error(...)` | `failed` |
| Demo mode (`none`) | Zaloguje `status: 'demo'`, return success | `demo` |
| Stub provider (`smtp/resend/sendgrid`) | Zaloguje `status: 'sent'`, return success | `sent` |

### 10.2 Chybove stavy v triggers.js

| Stav | Chovani |
|------|---------|
| `newStatus` neni v EVENT_MAP | Return `null` (tichy skip) |
| `sendTriggeredEmail()` vraci null | Return `null` (neni trigger/email) |
| `sendTriggeredEmail()` throws | Catch, `console.error()`, return `{ success: false, error }` |

### 10.3 Chybove stavy v templateRenderer.js

| Stav | Chovani |
|------|---------|
| `templateId` neni v DEFAULT_TEMPLATES | Vraci fallback HTML: `<p>Template "..." not found.</p>` |
| `data` je null/undefined | Vraci template bez substituce ({{var}} zustanou) |
| Nested objekt v data | Rekurzivne prochazi — funguje spravne |
| Array v data | Ignorovany (zadna iterace/loop podpora) |

### 10.4 Chybi typed MP_ errors

**Poznamka:** Email service vrstva aktualne pouziva generic `new Error()` misto typed errors
s `MP_` kody. Toto je nesoulad s definici done pro service vrstvu, ktera pozaduje
`{ code: 'MP_NOT_FOUND', message }` pattern. Routes vrstva (`emailRoutes.js`) pouziva
vlastni chybove formaty (`{ ok: false, error: err.message }`).

---

## 14. Bezpecnost (SMTP credentials, injection)

### 14.1 XSS ochrana — implementovano

`escapeHtml()` v `templateRenderer.js` escapuje 4 znaky:
- `&` -> `&amp;`
- `<` -> `&lt;`
- `>` -> `&gt;`
- `"` -> `&quot;`

Vse co projde pres `{{variable}}` je automaticky escapovano pred vlozenim do HTML.

**Chybi:** Escapovani jednoduche uvozovky `'` -> `&#39;`. Pokud by promenna byla vlozena
do HTML atributu s jednoduchou uvozovkou (napr. `title='{{var}}'`), mohlo by dojit k XSS.
V aktualnich sablonach se to nedeje, ale je to potencialni riziko pri budoucich sablonach.

### 14.2 SMTP credentials — zatim nerelevantni

Aktualne zadne SMTP credentials neexistuji (vsechny providery jsou stubovane). Pri budouci
implementaci:
- SMTP hesla a API klice MUSI byt v `.env` (nikdy ne v kodu)
- `.env` je v `.gitignore` — nesmit commitovat
- Provider config se predava za behu, ne hardcoded

### 14.3 Template injection

- Sablony jsou staticke (definovane v `templates/index.js`)
- Uzivatel nemuze definovat vlastni sablony (zadne custom template upload)
- Data prochazi pres `escapeHtml()` — bezpecne

### 14.4 Email address validace

**CHYBI.** Aktualne zadna validace email formatu. Funkce `sendEmail()` pouze kontroluje
ze `to` neni falsy, ale neoveruje format. Mohlo by vest k:
- Odesilani na neplatne adresy
- Potencialni header injection (pokud by se email adresa pouzila v SMTP headerech bez sanitizace)

### 14.5 Rate limiting

**CHYBI.** Zadne omezeni poctu emailu za casovy usek. In-memory log ma limit 200 zaznamu,
ale to neni rate limiter. Pri realne implementaci nutne pridat rate limiting na API urovni.

---

## 15. Konfigurace (SMTP settings, template vars)

### 15.1 Provider konfigurace

Provider se nastavuje za behu pres `providerConfig` parametr:

```javascript
// Demo mode (default — zadna konfigurace nutna)
{ provider: 'none' }

// SMTP (budouci — vyzaduje nodemailer)
{
  provider: 'smtp',
  // Budouci parametry:
  // host: 'smtp.gmail.com',
  // port: 587,
  // secure: false,
  // auth: { user: '...', pass: '...' }
}

// Resend API (budouci)
{
  provider: 'resend',
  // apiKey: 'rs_...'
}

// SendGrid API (budouci)
{
  provider: 'sendgrid',
  // apiKey: 'SG.xxx'
}
```

### 15.2 Template promenne

Sablony ocekavaji data ve formatu:

```javascript
{
  order: {
    shop_name: 'MojeFirema 3D',  // nazev obchodu (header)
    id: 'ord-abc123def456',       // cele ID, subject pouzije posledních 6 znaku
    customer: {
      name: 'Jan Novak',         // jmeno zakaznika
      email: 'jan@example.com'   // email (pouzity jako "to")
    },
    total: '1 500'               // celkova cena (jen order_confirmed)
  }
}
```

### 15.3 Trigger konfigurace

```javascript
{
  provider: 'smtp',          // provider pro odesilani
  triggers: [
    { event: 'order_confirmed', enabled: true },
    { event: 'order_printing', enabled: true },
    { event: 'order_shipped', enabled: true },
    { event: 'order_completed', enabled: true },
    { event: 'order_cancelled', enabled: false }  // deaktivovany
  ]
}
```

### 15.4 Predmet emailu (automaticky generovany)

Subject se generuje v `getSubjectForEvent()` a pouziva poslednich 6 znaku z `order.id`:

| Event | Subject vzor |
|-------|-------------|
| `order_confirmed` | `Order #abc123 Confirmed` |
| `order_printing` | `Order #abc123 is Being Printed` |
| `order_shipped` | `Order #abc123 Has Been Shipped` |
| `order_completed` | `Order #abc123 Completed` |
| `order_cancelled` | `Order #abc123 Cancelled` |
| neznamy event | `Order Update #abc123` |

---

## 17. Zname omezeni

### 17.1 emailProvider.js je nepouzivany

`createProvider()` factory existuje ale neni zapojena v `emailService.js`. Service misto toho
implementuje provider routing primo v `sendEmail()` pres if/else bloky. Toto znamena:
- Duplicitni logika (provider switch v obou souborech)
- Adapter pattern neni skutecne pouzit
- Refactor: `sendEmail()` by mel volat `createProvider(config).send()`

### 17.2 Vsechny providery jsou stubovane

Zadny provider realne neodesila emaily. Vsechny tri (smtp, resend, sendgrid) jen logují
do konzole a vraci `{ success: true }`. Pro produkci nutne implementovat:
- nodemailer integrace pro SMTP
- fetch/SDK volani pro Resend a SendGrid

### 17.3 In-memory log se ztrati pri restartu

Email log je ulozeny v `const emailLog = []` — pri restartu serveru se ztrati. Pro produkci:
- Persistovat do souboru nebo databaze
- Nebo aspon logovat do stdout pro zachyceni log collektorem

### 17.4 Chybi email validace

Zadna validace email formatu v `to` poli. Pouze kontrola na truthy hodnotu.

### 17.5 Chybi i18n v sablonach

Vsechny sablony a subjecty jsou v anglictine. Pro cesky trh nutne:
- Lokalizovane sablony (CS/EN)
- Lokalizovane subjecty
- Jazykova preference na zaklade tenant/zakaznik nastaveni

### 17.6 Chybi podpora pro prilohy

Zadna moznost odeslat email s prilohou (napr. faktura PDF, gcode).

### 17.7 Template system bez cyklu a podminek

`{{variable}}` parser nepodporuje:
- Cykly ({{#each items}})
- Podminky ({{#if condition}})
- Pole (Array hodnoty se ignoruji)

Pro slozitejsi sablony bude nutny upgrade na Handlebars nebo jiny template engine.

### 17.8 Chybi typed MP_ errors

Service vrstva pouziva generic `throw new Error()` misto typed errors s `MP_` kodem
(napr. `{ code: 'MP_EMAIL_TEMPLATE_NOT_FOUND', message }`), coz je nesoulad
s definici done pro service vrstvu.

### 17.9 Subject line neni konfigurovatelny

Predmety emailu jsou hardcoded v `getSubjectForEvent()`. Tenant si nemuze nastavit
vlastni subject sablony.

### 17.10 Chybi `from` adresa

Zadna konfigurace odesilatele (from). Pri realne SMTP/API integraci je `from` povinny
parametr. Aktualne neni predavan do provider `send()`.

### 17.11 emailRoutes.js neni pripojen v index.js

Express router `emailRoutes.js` existuje ale neni importovan ani mountovan v `index.js`.
Email API endpointy (`/api/email/*`) jsou aktualne nedostupne.
