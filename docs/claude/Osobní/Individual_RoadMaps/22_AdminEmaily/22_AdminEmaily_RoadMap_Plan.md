# 22. Admin — Emaily/notifikace — Detailni RoadMap Plan

> **Stav:** 🟠 20% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** Backend/Cloud Functions (#26) pro odesilani, Orders (#7) pro triggery
> **Kdo na nem zavisi:** Orders (#7) — notifikace pri zmene statusu, Stripe (#8) — potvrzeni platby

---

## Prehled

System pro odesilani transakcnich emailu — potvrzeni objednavky, zmena statusu, doruceni. Admin UI pro konfiguraci uz existuje, ale backend odesilani je NEPRIPOJENO.

**Admin soubor:** `src/pages/admin/AdminEmails.jsx`
**Doporuceny provider:** Resend (moderni, jednoduche API, React Email sablony)

---

## Co je HOTOVO (✅)

### Admin UI (70%)
- [x] 3 taby: Templates, Provider, Log
- [x] Event triggers: order_confirmed, printing, shipped, completed
- [x] Provider konfigurace UI: SMTP, Resend, SendGrid options
- [x] Zakladni subject line sablony

---

## Co CHYBI / je potreba dodelat

### Faze 1: Resend setup (Priorita: VYSOKA)

#### Ukol 1.1: Instalace a konfigurace
- **Co udelat:**
  - [ ] `npm install resend` na backendu (Cloud Functions)
  - [ ] Volitelne: `npm install @react-email/components` pro sablony
  - [ ] Admin: input pro Resend API klic
  - [ ] Env variable `RESEND_API_KEY` na backendu
  - [ ] Overeni klice: `POST /api/emails/verify-provider`
- **Poznamka:** Resend nabizi 100 emailu/den zdarma (Free tier), pak od $20/mesic

#### Ukol 1.2: Domena overeni
- **Co udelat:**
  - [ ] Pro odesilani z vlastni domeny: overeni DNS zaznamu (SPF, DKIM)
  - [ ] Pro zacatek: odesilani z `onboarding@resend.dev` (dev mode)
  - [ ] Admin UI: navod jak overit domenu

### Faze 2: Email sablony (Priorita: VYSOKA)

#### Ukol 2.1: HTML email sablony
- **Potrebne sablony:**
  - [ ] **order_confirmed** — "Dekujeme za objednavku #ORD-2026-00001"
    - Souhrn objednavky (polozky, ceny, celkem)
    - Platebni udaje (cislo uctu, VS, castka) — pokud bank transfer
    - Kontakt firmy
  - [ ] **order_paid** — "Platba prijata"
    - Potvrzeni ze platba dorazi
    - Dalsi kroky
  - [ ] **order_printing** — "Vase objednavka se tiskne"
    - Status update
  - [ ] **order_shipped** — "Objednavka odeslana"
    - Tracking cislo (pokud existuje)
    - Odhadovane doruceni
  - [ ] **order_completed** — "Objednavka dorucena"
    - Dekujeme
    - Zpetna vazba CTA
  - [ ] **order_cancelled** — "Objednavka zrusena"
    - Duvod (pokud zadany)
    - Refund informace
  - [ ] **payment_failed** — "Platba selhala"
    - Moznost zopakovat platbu

#### Ukol 2.2: Sablonovy system
- **Co udelat:**
  - [ ] Kazda sablona ma:
    - Subject line (s promennymi: `{{orderNumber}}`, `{{customerName}}`)
    - HTML body (responsivni, funguje ve vsech email klientech)
    - Plaintext fallback
  - [ ] Promenne: `{{orderNumber}}`, `{{customerName}}`, `{{totalPrice}}`, `{{items}}`, `{{bankAccount}}`, `{{variableSymbol}}`, `{{trackingNumber}}`
  - [ ] Firma muze upravit subject line a zakladni texty v admin
  - [ ] Logo firmy v emailu (z branding konfigurace)

#### Ukol 2.3: React Email sablony (volitelne)
- **Co udelat:**
  - [ ] Pouzit `@react-email/components` pro psani sablon jako React komponenty
  - [ ] Vyhoda: JSX syntax, testovatelne, opakovatelne
  - [ ] Nevyhoda: dalsi dependency
- **Poznamka:** Pro MVP/Beta staci jednoduche HTML stringy s promennymi

### Faze 3: Backend email service (Priorita: VYSOKA)

#### Ukol 3.1: Email service
- **Soubor:** `backend-local/services/emailService.js` (NOVY) nebo Cloud Function
- **Co udelat:**
  - [ ] Funkce `sendEmail({ to, template, variables, tenantId })`
  - [ ] Nacitani Resend API klice z tenant konfigurace
  - [ ] Nahrazeni promennych v sablone
  - [ ] Odesilani pres Resend API:
    ```javascript
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: `${companyName} <orders@${domain}>`,
      to: customerEmail,
      subject: processedSubject,
      html: processedHtml
    });
    ```
  - [ ] Logovani — ulozit odeslany email do `email_log` tabulky
  - [ ] Error handling — retry pri selhani (max 3x)

#### Ukol 3.2: Trigger system
- **Co udelat:**
  - [ ] Po zmene statusu objednavky → automaticky email dle event typu
  - [ ] Mapovani: `order.status_change` → `email_template`
  - [ ] Konfigurovatelne v admin — firma muze vypnout/zapnout jednotlive emaily
  - [ ] Webhook od Stripe → email (payment_succeeded, payment_failed)

### Faze 4: Pokrocile (post-Beta)

#### Ukol 4.1: Email delivery tracking
- **Co udelat:**
  - [ ] Resend webhooky pro delivery status (delivered, bounced, opened)
  - [ ] Zobrazeni statusu v admin Email Log tabu

#### Ukol 4.2: Custom emaily
- **Co udelat:**
  - [ ] Firma muze poslat vlastni email zakaznikovi z order detail modalu
  - [ ] WYSIWYG editor pro vlastni emaily

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 1: Resend setup | 2-3h | Cloud Functions (#26) | VYSOKA |
| 2 | Faze 2: Email sablony | 4-6h | Zadne | VYSOKA |
| 3 | Faze 3: Backend service | 4-6h | Faze 1, Orders (#7) | VYSOKA |
| 4 | Faze 4: Pokrocile | post-Beta | - | NIZKA |

**Celkem pro Beta:** ~10-15 hodin

---

## Soubory ke zmene/vytvorit

| Soubor | Typ | Rozsah |
|--------|-----|--------|
| `backend-local/services/emailService.js` | NOVY | Stredni |
| `backend-local/templates/` | NOVY adresar s HTML sablonami | Stredni |
| `src/pages/admin/AdminEmails.jsx` | Drobne upravy admin UI | Maly |
| `src/utils/adminEmailStorage.js` | Rozsireni — provider klice | Maly |

---

## Poznamky

- **TIP:** Resend je od tvurcu Vercel/Next.js — moderni, jednoduche API, skvela DX
- **TIP:** Free tier 100 emailu/den staci pro beta testovani
- **DULEZITE:** Email sablony MUSI byt responsivni — Gmail, Outlook, Apple Mail, Yahoo
- **DULEZITE:** Firma si nastavuje svuj Resend API klic — kazda firma svuj ucet
- **? OTAZKA:** Defaultni sablony v cestine nebo anglictine? (Doporucuji dle jazyka zakaznika)

---

## Kriticke doplnky (z review)

> Nasledujicich 8 sekci pokryva mezery identifikovane pri code review existujiciho planu a AdminEmails.jsx.
> Kazda sekce obsahuje konkretni ukoly, soubory a implementacni detaily.

---

### D1: Resend API — detailni specifikace providera

Puvodni plan zminuje Resend jen povrchne. Pro korektni implementaci je treba znat presne limity a API kontrakt.

#### Resend pricing a rate limity

| Tier | Cena | Limit emailu | Rate limit | Vlastni domeny |
|------|------|--------------|------------|----------------|
| Free | $0 | 100/den, 3 000/mesic | 2 req/s | 1 domena |
| Pro | $20/mesic | 50 000/mesic | 10 req/s | neomezene |
| Enterprise | custom | custom | custom | neomezene |

**Dulezite limity pro nasi implementaci:**
- Free tier: max 100 emailu/den — dostatecne pro dev/staging, ale maly 3D printing byznys s 10+ objednavkami/den to muze prekrocit (kazda objednavka = 2-4 emaily: confirmed, paid, printing, shipped)
- API key format: `re_` prefix, napr. `re_123abc456def` — pouzit pro validaci v admin UI
- Sender na Free tier: jen `onboarding@resend.dev` nebo overena vlastni domena
- Batch API: `resend.batch.send()` — az 100 emailu v jednom API callu (uzitecne pro hromadne notifikace)

#### API key validace v admin UI

```javascript
// backend-local/services/emailService.js
async function verifyResendApiKey(apiKey) {
  // Resend API key vzdy zacina 're_'
  if (!apiKey || !apiKey.startsWith('re_')) {
    return { valid: false, error: 'Invalid API key format (must start with re_)' };
  }
  try {
    // Resend nema dedicatedny verify endpoint — pouzijeme GET /domains
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401) return { valid: false, error: 'Invalid API key' };
    if (!res.ok) return { valid: false, error: `API error: ${res.status}` };
    const data = await res.json();
    return { valid: true, domains: data.data || [] };
  } catch (err) {
    return { valid: false, error: `Connection failed: ${err.message}` };
  }
}
```

#### Ukoly

- [ ] Admin UI: validace formatu API klice (`re_` prefix) pri ukladani v Provider tabu
- [ ] Backend: endpoint `POST /api/emails/verify-provider` — overi klic pres Resend `/domains` API
- [ ] Admin UI: zobrazit overene domeny po uspesne validaci klice
- [ ] Admin UI: varovani kdyz tenant pouziva Free tier a ma hodne objednavek (>50/den)
- [ ] Dokumentace: tabulka s limity zobrazena v admin UI jako info panel

---

### D2: Strategie testovani email renderingu

Puvodni plan zminuje "responsivni, funguje ve vsech email klientech" ale nedefinuje JAK to testovat. Email rendering je notoricky nespolehlivy — kazdy klient renderuje HTML jinak.

#### Problematicke email klienty

| Klient | Hlavni problemy |
|--------|----------------|
| **Outlook (Windows)** | Pouziva Word rendering engine (!), nema `<style>` v `<head>`, ignoruje `max-width`, `flexbox`, `grid` |
| **Gmail** | Stripuje `<style>` tagy v `<head>`, vynucuje inline styly, ignoruje media queries v ne-AMP emailech |
| **Apple Mail** | Relativne dobra podpora, ale dark mode muze invertovat barvy |
| **Yahoo Mail** | Stripuje `<style>`, nepodporuje CSS animace |

#### Doporuceny testing stack

1. **Lokalni preview (dev):**
   - [ ] Pridat 4. tab "Preview" do `AdminEmails.jsx` — admin vidi rendered HTML primo v prohlizeci
   - [ ] Iframe sandbox pro bezpecne renderovani: `<iframe srcdoc={renderedHtml} sandbox="allow-same-origin" />`
   - [ ] Prepinac Desktop/Mobile viewport (600px vs 375px)
   - [ ] Prepinac CS/EN jazyk pro preview s testovacimi daty

2. **Testovaci email (staging):**
   - [ ] Tlacitko "Odeslat testovaci email" v kazde sablone — posle na admin email s mock daty
   - [ ] Mock data generator: vygeneruje realistickou objednavku s 2-3 polozkami, cenami, adresou
   - [ ] Backend endpoint: `POST /api/emails/send-test` — prijem `{ template, locale, testEmail }`

3. **Cross-client testing (pred releasem):**
   - [ ] Pouzit [Litmus](https://litmus.com/) nebo [Email on Acid](https://www.emailonacid.com/) pro screenshots ze vsech klientu (placene, ale jednorazove)
   - [ ] Alternativa: manualni odeslani na Gmail, Outlook.com, Apple Mail a vizualni kontrola
   - [ ] Checklist pro kazdy release sablon: otevrit v 4 klientech, zkontrolovat layout, obrazky, CTA tlacitka

4. **HTML email best practices (kodovat do sablon):**
   - [ ] Pouzivat `<table>` layout misto `<div>` (Outlook kompatibilita)
   - [ ] Vsechny styly inline (Gmail kompatibilita) — pouzit CSS inliner (napr. `juice` npm package)
   - [ ] Max sirka 600px (mobilni + desktop kompatibilita)
   - [ ] Fallback font stack: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
   - [ ] Alt text na vsech obrazcich (pristupnost + blokace obrazku v Outlooku)
   - [ ] Preheader text (snippet viditelny v inbox listu pred otevrenim emailu)

#### Novy soubor

| Soubor | Typ | Ucel |
|--------|-----|------|
| `backend-local/services/emailTestUtils.js` | NOVY | Mock data generator + test send helper |

---

### D3: Bounce a complaint handling (Resend webhooky)

Puvodni Faze 4 zminuje webhooky jednou vetou. Bez spravneho bounce handlingu hrozi:
- Odesilani na neexistujici adresy (poskodit sender reputaci)
- Ignorovani stiznosti (poruseni CAN-SPAM/GDPR)
- Zadne info pro admina proc email nedosel

#### Resend webhook eventy

| Event | Kdy nastane | Akce v nasi aplikaci |
|-------|-------------|---------------------|
| `email.sent` | Email prisel k Resend | Log: status = "sent" |
| `email.delivered` | Email dorucen do schranky prijemce | Log: status = "delivered" |
| `email.delivery_delayed` | Docasny problem s dorucenim | Log: status = "delayed", retry automaticky |
| `email.bounced` | Email nedorucitelny (neexistujici adresa, plna schranka) | Log: status = "bounced", **oznacit adresu jako problematickou** |
| `email.complained` | Prijemce oznacil email jako spam | Log: status = "complained", **automaticky unsubscribe**, upozornit admina |
| `email.opened` | Prijemce otevrel email (tracking pixel) | Log: status = "opened" (volitelne, privacy concern) |
| `email.clicked` | Prijemce kliknul na odkaz v emailu | Log: status = "clicked" (volitelne) |

#### Implementacni ukoly

- [ ] Backend endpoint: `POST /api/webhooks/resend` — prijem Resend webhook eventu
- [ ] Webhook signature validace: Resend pouziva `svix-id`, `svix-timestamp`, `svix-signature` headers
  ```javascript
  // Overeni podpisu (Resend pouziva Svix)
  // npm install svix
  import { Webhook } from 'svix';
  const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
  const payload = wh.verify(body, headers); // throws pri neplatnem podpisu
  ```
- [ ] Bounce handling:
  - [ ] Pri `email.bounced` — ulozit adresu do `bounced_addresses` listu tenanta
  - [ ] Pred kazdym odeslanim kontrolovat `bounced_addresses` — neodesilat na bounced adresy
  - [ ] Admin UI: zobrazit bounced adresy v Log tabu s moznosti "opakovat" (rucne smazat z bounced listu)
- [ ] Complaint handling:
  - [ ] Pri `email.complained` — automaticky pridat adresu do suppression listu
  - [ ] Admin notifikace (v admin UI banner/toast): "Zakaznik X oznacil vas email jako spam"
  - [ ] Suppression list: `email-suppression:v1` namespace v tenant storage
- [ ] Delivery status v admin Email Log:
  - [ ] Pridana sloupec "Delivery status" (sent / delivered / bounced / complained / opened)
  - [ ] Barvy: delivered=zelena, bounced=cervena, complained=oranzova, sent=seda
  - [ ] Resend message ID ulozen v logu pro korelaci s webhooky

#### Nove soubory

| Soubor | Typ | Ucel |
|--------|-----|------|
| `backend-local/routes/webhookResend.js` | NOVY | Resend webhook handler + signature validace |
| `src/utils/adminEmailSuppressionStorage.js` | NOVY | Bounce/complaint/suppression list per tenant |

#### Data schema pro webhook log

```javascript
// Rozsireni email-log:v1 zaznamu
{
  id: 'log_abc123',
  date: '2026-02-18T10:30:00Z',
  recipient: 'jan@example.com',       // maskovano v UI: j***@example.com
  subject: 'Objednavka #ORD-2026-001 potvrzena',
  event: 'order_confirmed',
  status: 'sent',                      // sent | delivered | bounced | complained | opened
  resend_message_id: 'msg_abc123',     // pro korelaci s webhooky
  delivery_status_history: [           // NOVE — timeline doruceni
    { status: 'sent', at: '2026-02-18T10:30:00Z' },
    { status: 'delivered', at: '2026-02-18T10:30:05Z' },
  ],
  bounce_reason: null,                 // vyplneno pri bounced (napr. 'mailbox_full', 'invalid_address')
}
```

---

### D4: Spam prevence — SPF, DKIM, DMARC setup

Puvodni plan zminuje "overeni DNS zaznamu (SPF, DKIM)" bez detailu. Bez spravneho nastaveni budou emaily padat do spamu.

#### Co je potreba a proc

| Zaznam | Ucel | Bez nej |
|--------|------|---------|
| **SPF** (Sender Policy Framework) | Rika prijemci "tyto servery smi odesilat emaily za mou domenu" | Emaily spadnou do spamu u 90%+ provideru |
| **DKIM** (DomainKeys Identified Mail) | Kryptograficky podpis — dokazuje ze email nebyl zmenen pri prenosu | Gmail a Outlook oznaci jako "neovereno" |
| **DMARC** (Domain-based Message Auth) | Politika co delat s emaily ktere projdou SPF/DKIM kontrolou | Bez nej: phisheri mohou odesilat emaily z vasi domeny |

#### Resend automaticky nastaveni

Resend po overeni domeny **automaticky generuje DKIM a Return-Path zaznamy**. Admin musi pridat do DNS:

```
; Resend vygeneruje po pridani domeny v dashboardu (https://resend.com/domains)
; Typicky 3 zaznamy:

; DKIM (3 CNAME zaznamy)
resend._domainkey.example.com  CNAME  resend._domainkey.xxx.dkim.resend.dev
resend2._domainkey.example.com CNAME  resend2._domainkey.xxx.dkim.resend.dev
resend3._domainkey.example.com CNAME  resend3._domainkey.xxx.dkim.resend.dev

; SPF (TXT zaznam — pridat k existujicimu nebo vytvorit novy)
example.com  TXT  "v=spf1 include:send.resend.com ~all"

; DMARC (doporuceny — ne povinny, ale silne doporuceny)
_dmarc.example.com  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@example.com"
```

#### Implementacni ukoly

- [ ] Admin UI: krok-za-krokem pruvodce nastavenim domeny (v Provider tabu)
  - Krok 1: "Pridejte domenu v Resend dashboardu"
  - Krok 2: "Pridejte tyto DNS zaznamy u vaseho registratora" (zobrazit konkretni zaznamy z Resend API)
  - Krok 3: "Pridejte SPF zaznam" (s prikladem)
  - Krok 4: "Pridejte DMARC zaznam (doporuceno)" (s prikladem a vysvetlenim)
  - Krok 5: "Kliknete na overit" — zavolame Resend API pro stav overeni
- [ ] Backend: `GET /api/emails/domain-status` — dotaz na Resend `/domains` API pro stav overeni kazde domeny
- [ ] Admin UI: barevny indikator stavu domeny:
  - Zelena: SPF + DKIM + DMARC vse OK
  - Oranzova: SPF + DKIM OK, DMARC chybi
  - Cervena: SPF nebo DKIM neni overeno
- [ ] Admin UI: varovani pokud tenant pouziva `onboarding@resend.dev` v produkci — "Emaily z @resend.dev mohou skonci ve spamu. Overte vlastni domenu."
- [ ] Logovani: zaznamenavat jestli email byl odeslan z overene domeny nebo z `@resend.dev`

---

### D5: Email queue a retry logika

Puvodni plan zminuje "retry pri selhani (max 3x)" ale nedefinuje mechanismus. Bez queue se emaily ztrati pri vypadku Resend nebo backendu.

#### Problem

Synchronni volani `resend.emails.send()` v request handleru ma 3 problemy:
1. **Pomalost** — Resend API odpovi typicky za 200-500ms, prodluzuje response time objednavky
2. **Ztrata pri vypadku** — pokud Resend neni dostupny v momente odeslani, email se ztrati
3. **Zadna retry** — 500ka od Resend = email nikdy neodejde

#### Reseni: lokalni persistent queue

Protoze ModelPricer zatim nepouziva Redis/RabbitMQ, implementujeme lightweight file-based queue:

```javascript
// backend-local/services/emailQueue.js

const QUEUE_NAMESPACE = 'email-queue:v1';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [30_000, 120_000, 600_000]; // 30s, 2min, 10min

/**
 * Prida email do fronty — vola se misto primeho resend.emails.send()
 */
export function enqueueEmail({ to, template, variables, tenantId, locale }) {
  const job = {
    id: `eq_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    to,
    template,
    variables,
    tenantId,
    locale,
    status: 'pending',       // pending | processing | sent | failed
    retries: 0,
    created_at: new Date().toISOString(),
    next_retry_at: null,
    last_error: null,
  };
  // Ulozit do localStorage/Supabase tenant-scoped storage
  appendToQueue(tenantId, job);
  return job.id;
}

/**
 * Background worker — spousti se kazdych 15 sekund
 * Zpracovava pending joby a retryuje failed
 */
export async function processEmailQueue(tenantId) {
  const queue = getQueue(tenantId);
  const now = Date.now();

  for (const job of queue) {
    if (job.status === 'sent' || job.status === 'failed') continue;
    if (job.status === 'processing') continue; // jiny worker uz zpracovava
    if (job.next_retry_at && new Date(job.next_retry_at).getTime() > now) continue;

    job.status = 'processing';
    updateJob(tenantId, job);

    try {
      await sendEmailDirect(job); // primne Resend API volani
      job.status = 'sent';
    } catch (err) {
      job.retries += 1;
      job.last_error = err.message;
      if (job.retries >= MAX_RETRIES) {
        job.status = 'failed'; // permanentni selhani — notifikovat admina
      } else {
        job.status = 'pending';
        job.next_retry_at = new Date(now + RETRY_DELAYS[job.retries - 1]).toISOString();
      }
    }
    updateJob(tenantId, job);
  }
}
```

#### Implementacni ukoly

- [ ] Novy soubor: `backend-local/services/emailQueue.js` — persistent queue s retry
- [ ] Worker: `setInterval(processEmailQueue, 15_000)` — spousti se pri startu backendu
- [ ] Trigger system (Ukol 3.2) vola `enqueueEmail()` misto primeho `sendEmail()`
- [ ] Admin UI v Log tabu: zobrazit stav fronty (kolik emailu ceka, kolik selhalo, dalsi retry za)
- [ ] Dead letter queue: emaily ktere selhaly 3x — zobrazit v admin UI s moznosti rucniho retry
- [ ] Cleanup: smazat uspesne odeslane emaily z queue po 24h (neakumulovat data)
- [ ] Metriky: prumerny cas doruceni, uspesnost (%), pocet retry

#### Nove soubory

| Soubor | Typ | Ucel |
|--------|-----|------|
| `backend-local/services/emailQueue.js` | NOVY | Persistent email queue + retry worker |

#### Budouci rozsireni (post-Beta)

- Nahradit file-based queue za BullMQ + Redis kdyz bude infrastruktura
- Integrace s `mp-spec-be-queue` agentem pro sdilenou queue infrastrukturu

---

### D6: Per-tenant "from" address a custom domeny

Puvodni plan predpoklada jednu sender adresu. V multi-tenant SaaS kazda firma potrebuje odesilat z vlastni domeny.

#### Architektura

```
Tenant A (PrintShop Praha)  → orders@printshop-praha.cz  → Resend API (Tenant A's key)
Tenant B (3DPrint Brno)     → info@3dprint-brno.cz       → Resend API (Tenant B's key)
Tenant C (demo)             → onboarding@resend.dev      → Resend API (shared dev key)
```

**Kazdy tenant ma SVUJ Resend ucet a API klic.** Toto uz existuje v admin UI (Provider tab), ale chybi:

#### Implementacni ukoly

- [ ] Rozsireni `email:v1` namespace o domena konfiguraci:
  ```javascript
  {
    // ... existujici pole ...
    sender_domain: 'printshop-praha.cz',         // NOVE
    sender_domain_verified: false,                // NOVE — stav overeni
    sender_domain_verified_at: null,              // NOVE
    reply_to_email: 'podpora@printshop-praha.cz', // NOVE — Reply-To header
    custom_from_addresses: {                       // NOVE — ruzne adresy pro ruzne typy emailu
      orders: 'objednavky@printshop-praha.cz',
      support: 'podpora@printshop-praha.cz',
      noreply: 'noreply@printshop-praha.cz',
    },
  }
  ```
- [ ] Admin UI (Provider tab): sekce "Domena a odesilatel"
  - Input pro domenu (napr. `printshop-praha.cz`)
  - Stav overeni domeny (zelena/cervena/oranzova — viz D4)
  - Reply-To email (dulezite — zakaznik odpovi na tento email, ne na noreply)
  - Volba from adresy pro kazdy typ emailu (orders, support, noreply)
- [ ] Backend: `sendEmail()` nacita sender konfiguraci z tenant storage a pouzije spravnou from adresu
- [ ] Fallback: pokud tenant nema overenou domenu, pouzije `onboarding@resend.dev` s varovnym logem
- [ ] Validace: from adresa MUSI byt na overene domene — Resend odmitne email z neoverene domeny

#### Uprava existujiciho souboru

| Soubor | Zmena |
|--------|-------|
| `src/utils/adminEmailStorage.js` | Pridat nova pole do `normalizeEmailConfigV1()` a `getDefaultEmailConfigV1()` |
| `src/pages/admin/AdminEmails.jsx` | Rozsirit Provider tab o domena + reply-to + custom from sekci |

---

### D7: Unsubscribe mechanismus (CAN-SPAM / GDPR compliance)

Puvodni plan vubec nezminuje unsubscribe. Transakcni emaily (potvrzeni objednavky, zmena stavu) **nevyzaduji unsubscribe link** podle zakona — ale marketing emaily (upselly, novinky, reviews) ANO.

#### Pravni pozadavky

| Typ emailu | Unsubscribe povinny? | Zakon |
|------------|---------------------|-------|
| Transakcni (order confirmed, shipped, etc.) | NE | CAN-SPAM Sec. 3(2)(A) |
| Marketing (upsell, newsletter, review request) | ANO | CAN-SPAM + GDPR Art. 7 |
| Smerovane (zpetna vazba CTA v order_completed) | SEDA ZONA — doporuceno ANO | Best practice |

#### Implementace

##### List-Unsubscribe header (one-click unsubscribe)
Google a Yahoo od 02/2024 vyzaduji `List-Unsubscribe` header u hromadnych emailu. I kdyz nase emaily jsou transakcni, je best practice ho pridat:

```javascript
// V emailService.js pri odesilani
const headers = {
  'List-Unsubscribe': `<https://app.modelpricer.com/unsubscribe?token=${unsubToken}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
```

##### Unsubscribe landing page
- URL: `/unsubscribe?token=<jwt>` — verejna stranka (neni nutne prihlaseni)
- JWT token obsahuje: `{ tenantId, email, categories }` — podepisovano server-side
- Stranka: "Ktere emaily chcete prestat odebrat?" s checkboxy per kategorie
- Kategorie: `marketing` (newsletter, upsell), `reviews` (zpetna vazba), `all` (vse krome transakcnich)
- Transakcni emaily NELZE odhlasit (zakaznik je informovan proc)

#### Implementacni ukoly

- [ ] Backend: generovani unsubscribe tokenu (JWT s `tenantId` + `email` + `categories`)
- [ ] Backend: `GET /api/unsubscribe?token=xxx` — dekoduje token, zobrazi unsubscribe formular
- [ ] Backend: `POST /api/unsubscribe` — zpracuje odhlaseni, ulozi do tenant storage
- [ ] Frontend: `/unsubscribe` — verejna stranka s kategoriovym odhlasenim (ne prihlaseni!)
- [ ] Unsubscribe storage: `email-unsubscribe:v1` namespace per tenant
  ```javascript
  {
    "jan@example.com": {
      unsubscribed_categories: ["marketing", "reviews"],
      unsubscribed_at: "2026-02-18T10:30:00Z",
      all_unsubscribed: false,
    }
  }
  ```
- [ ] Email service: pred odeslanim zkontrolovat unsubscribe list — neodesilat marketing na odhlasene adresy
- [ ] HTML sablony: pridat unsubscribe link do paticky VSECH emailu (vcetne transakcnich — pro dobrou praxi)
  - Transakcni: "Tento email jste obdrzeli protoze jste vytvorili objednavku. [Spravovat emailove preference]"
  - Marketing: "Nechcete odebrat tyto emaily? [Odhlasit se]"
- [ ] Admin UI: zobrazit pocet odhlasenych adres v Log tabu
- [ ] `List-Unsubscribe` a `List-Unsubscribe-Post` headers ve VSECH emailech

#### Nove soubory

| Soubor | Typ | Ucel |
|--------|-----|------|
| `src/pages/public/Unsubscribe.jsx` | NOVY | Verejna unsubscribe stranka |
| `backend-local/routes/unsubscribe.js` | NOVY | Token validace + odhlaseni endpoint |
| `src/utils/adminEmailUnsubscribeStorage.js` | NOVY | Per-tenant unsubscribe list |

---

### D8: Email preview v admin UI

Admin musi videt jak bude email vypadat PRO zakaznika, vcetne tenant brandingu (logo, barvy), lokalizace a realistickych dat. Bez preview admini zaslepe edituji subject liny a nemaji tuseni jak vysledek vypada.

#### Navrh UI

Pridat **4. tab "Preview"** do `AdminEmails.jsx` (vedle Templates, Provider, Log):

```
[Templates] [Provider] [Log] [Preview]    <-- NOVY tab
```

#### Preview tab obsah

1. **Vyber sablony** — dropdown se vsemi event typy (order_confirmed, order_shipped, ...)
2. **Vyber jazyka** — CS / EN prepinac
3. **Mock data panel** — editovatelny JSON s testovacimi daty:
   ```json
   {
     "orderNumber": "ORD-2026-00042",
     "customerName": "Jan Novak",
     "totalPrice": "1 250 Kc",
     "items": [
       { "name": "Kryci deska v2.stl", "material": "PLA", "quality": "0.2mm", "price": "450 Kc" },
       { "name": "Drzak telefonu.stl", "material": "PETG", "quality": "0.15mm", "price": "800 Kc" }
     ],
     "trackingNumber": "CZ1234567890",
     "companyName": "PrintShop Praha",
     "companyLogo": "https://..."
   }
   ```
4. **Rendered preview** — iframe se skutecnym HTML emailem (s brandingovymi daty tenanta)
5. **Prepinac viewport** — Desktop (600px) / Mobile (375px)
6. **"Odeslat testovaci email"** — tlacitko ktere posle preview na zadanou adresu

#### Implementacni ukoly

- [ ] Pridat tab "Preview" do `AdminEmails.jsx` TABS pole:
  ```javascript
  { id: 'preview', icon: 'Eye', label_cs: 'Nahled', label_en: 'Preview' }
  ```
- [ ] Novy komponent: `EmailPreview.jsx` — dropdown sablony, JSON editor, iframe render
- [ ] Backend: `POST /api/emails/render-preview` — prijme `{ template, variables, locale, tenantId }`, vrati HTML
- [ ] Branding integrace: nacist logo, primary_color, company_name z tenant branding storage a vlozit do preview
- [ ] Mock data presets: tlacitko "Naplnit testovaci daty" — predpripravena realisticka objednavka
- [ ] Subject line preview: zobrazit i rendered subject (s nahrazenymi promennymi) nad iframe
- [ ] Mobilni simulace: CSS `transform: scale()` pro zmenseni iframe na mobilni viewport

#### Nove soubory

| Soubor | Typ | Ucel |
|--------|-----|------|
| `src/pages/admin/components/EmailPreview.jsx` | NOVY | Preview komponent pro AdminEmails |

---

### Aktualizovana implementacni tabulka (vcetne doplnku)

| # | Polozka | Hodiny | Zavislosti | Priorita |
|---|---------|--------|------------|----------|
| 1 | Faze 1: Resend setup | 2-3h | Cloud Functions (#26) | VYSOKA |
| 2 | Faze 2: Email sablony | 4-6h | Zadne | VYSOKA |
| 3 | Faze 3: Backend service | 4-6h | Faze 1, Orders (#7) | VYSOKA |
| 4 | D1: Resend API detaily + validace | 1-2h | Faze 1 | VYSOKA |
| 5 | D4: SPF/DKIM/DMARC pruvodce | 2-3h | Faze 1, D1 | VYSOKA |
| 6 | D5: Email queue + retry | 3-4h | Faze 3 | VYSOKA |
| 7 | D6: Per-tenant from address | 2-3h | Faze 1, D4 | STREDNI |
| 8 | D7: Unsubscribe mechanismus | 3-4h | Faze 2, Faze 3 | STREDNI |
| 9 | D8: Email preview v admin | 3-4h | Faze 2 | STREDNI |
| 10 | D2: Email rendering testing | 2-3h | Faze 2, D8 | STREDNI |
| 11 | D3: Bounce/complaint handling | 3-4h | Faze 3, D5 | NIZKA (post-Beta) |
| 12 | Faze 4: Pokrocile | post-Beta | - | NIZKA |

**Celkem pro Beta (1-8):** ~25-35 hodin (puvodnich 10-15 + 15-20 za kriticke doplnky)
**Celkem vcetne post-Beta (1-12):** ~30-42 hodin

---

### Souhrnna tabulka VSECH novych souboru (z doplnku)

| Soubor | Z doplnku | Ucel |
|--------|-----------|------|
| `backend-local/services/emailQueue.js` | D5 | Persistent email queue + retry worker |
| `backend-local/services/emailTestUtils.js` | D2 | Mock data generator + test send helper |
| `backend-local/routes/webhookResend.js` | D3 | Resend webhook handler + signature validace |
| `backend-local/routes/unsubscribe.js` | D7 | Unsubscribe endpoint (token + odhlaseni) |
| `src/pages/admin/components/EmailPreview.jsx` | D8 | Preview komponent pro AdminEmails tab |
| `src/pages/public/Unsubscribe.jsx` | D7 | Verejna unsubscribe stranka |
| `src/utils/adminEmailSuppressionStorage.js` | D3 | Bounce/complaint suppression list |
| `src/utils/adminEmailUnsubscribeStorage.js` | D7 | Per-tenant unsubscribe list |
