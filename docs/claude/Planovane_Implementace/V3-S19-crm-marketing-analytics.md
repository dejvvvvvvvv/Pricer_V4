# V3-S19: CRM, Marketing a Analytika

> **Priorita:** P3 | **Obtiznost:** High | **Vlna:** 4
> **Zavislosti:** S02 (objednavky), S07 (emaily), S10 (kupony), S12 (zakaznicky portal)
> **Odhadovany rozsah:** ~50-70 souboru, 4-5 tydnu prace (2 vyvojari)

---

## A. KONTEXT

### A1. Ucel a cil

S19 prinasi tri vzajemne propojene oblasti, ktere transformuji ModelPricer z "cenove kalkulacky"
na "obchodni platformu" s aktivnim rizenim vztahu se zakazniky:

1. **Rozsirena zakaznicka databaze a segmentace (CRM)** — Centralni sprava vsech zakazniku
   s historii objednavek, statistikami, tagy a segmenty. Umoznuje adminu porozumet
   zakaznikum a cilit na ne personalizovane.

2. **Abandoned Cart Tracking** — Sledovani nedokoncenych kalkulaci. Identifikace bodu,
   kde zakaznici odchazeji, a moznost follow-up (rucni nebo automaticky email).

3. **Emailove kampane a marketingova automatizace** — Odesilani jednorázovych kampani
   a automatizovanych emailu (welcome, abandoned cart follow-up, post-purchase, win-back).

**Business value:**
- CRM zvysuje lifetime value zakazniku pres lepsi understanding a personalizaci
- Abandoned cart recovery muze zvysit konverze o 5-15% (prumerny benchmark pro e-commerce)
- Marketing automatizace snizuje manualni praci a zvysuje engagement
- Segmentace umoznuje cileny upsell (napr. VIP zakaznikum nabidnout express tisk)
- Celkove: prechod od pasivniho "zakaznik prijde a objedna" k aktivnimu "oslovime zakazniky"

### A2. Priorita, obtiznost, vlna

**Priorita P3:** Neni kriticka pro MVP, ale prinasi meritelny business impact (konverze,
retence, lifetime value). Ve vlne 4 protoze vyzaduje funkcni zaklad z predchozich vln.

**Obtiznost High:**
- CRM vyzaduje komplexni datovy model (zakaznici, tagy, segmenty, statistiky)
- Abandoned cart tracking vyzaduje real-time sledovani aktivity ve widgetu
- Email kampane vyzaduji WYSIWYG editor, scheduling, tracking (otevrani, prokliky)
- Integrace s existujicim email systemem (S07) a kuponovym systemem (S10)
- GDPR compliance — souhlas s marketingovymi emaily, odhlaseni, smazani dat

**Vlna 4:** Vyzaduje:
- Objednavkovy system (S02) — zdroj dat pro CRM
- Emailove notifikace (S07) — infrastruktura pro kampane
- Kupony (S10) — integrace do kampani
- Zakaznicky portal (S12) — autentifikace zakazniku

### A3. Zavislosti na jinych sekcich

**Musi byt hotove PRED S19:**
- **S01** (Bug Fixes) — stabilni zaklad
- **S02** (Objednavky) — zdrojova data pro CRM (zakaznici z objednavek)
- **S07** (Emailove notifikace) — infrastruktura pro odesilani emailu (Nodemailer, sablony)
- **S10** (Kupony) — moznost vlozit kupon do kampane/follow-up emailu

**Silne doporuceno:**
- **S12** (Zakaznicky portal) — prihlaseni zakaznici = bogatsi CRM data
- **S11** (Widget Builder) — tracking eventu z widgetu pro analytics
- **S16** (Multi-language) — lokalizovane kampane

**Zavisi na S19:**
- **S17** (E-commerce) — enrichment CRM dat z e-commerce integraci
- **S22** (Onboarding) — onboarding CRM pro noveho admina

### A4. Soucasny stav v codebase

**Co uz existuje:**

1. **Analytics storage a stranka:**
   - `src/utils/adminAnalyticsStorage.js` — event tracking system
     - Event typy: `WIDGET_VIEW`, `MODEL_UPLOAD_STARTED/COMPLETED`, `SLICING_*`,
       `PRICE_SHOWN`, `ADD_TO_CART_CLICKED`, `ORDER_CREATED`
     - Session-based tracking (`generateSessionId()`)
     - Funnel analyza (kalkulator konverze)
   - `src/pages/admin/AdminAnalytics.jsx` — analytics dashboard
     - Prehledove metriky, ztracene kalkulace (abandoned sessions)
     - CSV export, date range filtr

2. **Orders storage:**
   - `src/utils/adminOrdersStorage.js` — namespace `orders:v1`
   - Zakaznicka data: `customer_name`, `customer_email`, `customer_phone`
   - Tyto data jsou embedovany v objednavce, NE v samostatne zakaznicke tabulce

3. **Audit log:**
   - `src/utils/adminAuditLogStorage.js` — zaznam admin akci

4. **Email infrastruktura:**
   - Aktualne ZADNA (S07 bude implementovat)
   - Widget nemá emailovy input (S02 prida kontaktni formular)

5. **Branding/Widget storage:**
   - `src/utils/adminBrandingWidgetStorage.js` — widget konfigurace

**Co CHYBI:**
- Samostatna zakaznicka tabulka (customers) — data jsou roztrousena v objednavkach
- Tagovaci system a segmentace
- Abandoned cart tracking (existuji "ztracene sessions" v analytics, ale ne abandoned carts)
- Email kampane a automatizace
- WYSIWYG email editor
- Marketing dashboard
- Unsubscribe/preference management
- GDPR compliance (souhlas s marketingem, export dat, smazani)

### A5. Referencni zdroje a konkurence

**OSS knihovny — Analytics:**

| Knihovna | Ucel | Licence |
|----------|------|---------|
| `Plausible Analytics` | Privacy-focused web analytics (self-hosted) | AGPL-3.0 (BLOCK pro embed, OK pro interni) |
| `Umami` | Simple, fast analytics | MIT |
| `PostHog` | Product analytics + feature flags | MIT (core) |
| `Matomo` | Full-featured GA alternativa | GPL-3.0 (BLOCK) |

**OSS knihovny — Charts/Dashboards:**

| Knihovna | Ucel | Licence |
|----------|------|---------|
| `Recharts` | React charting (nejpopularnejsi) | MIT |
| `Tremor` | Dashboard komponenty pro React | Apache-2.0 |
| `Nivo` | Data visualization (D3-based) | MIT |
| `Chart.js` | Universal charting library | MIT |
| `Metabase` | Embedded BI dashboards | AGPL-3.0 (BLOCK pro embed) |

**OSS knihovny — Email:**

| Knihovna | Ucel | Licence |
|----------|------|---------|
| `React Email` | React komponenty pro emaily | MIT |
| `MJML` | Responsive email framework | MIT |
| `Nodemailer` | SMTP sending | MIT |
| `BullMQ` | Redis-based job queue pro fronty | MIT |

**Integrace (alternativa k vlastnimu reseni):**

| Platforma | Ucel | Poznamka |
|-----------|------|----------|
| `Mailchimp` | Email marketing (API integrace) | Nejrozsirenejsi, robustni API |
| `Brevo (ex Sendinblue)` | Email + SMS marketing | Dobra cena, EU hosting |
| `Klaviyo` | E-commerce email marketing | Specializovany na e-commerce |
| `Customer.io` | Flexibilni automatizace | Event-driven |

**Doporuceni:** Pro MVP integrovat s Mailchimp nebo Brevo. Vlastni email marketing budovat
pouze pokud je to core feature a zakaznici explicitne pozaduji "vse pod jednou strechou".

**Konkurence:**
- **Xometry** — zakaznicke ucty s historii objednavek, automated quotes
- **Hubs/Protolabs** — CRM propojeni, automatizovane follow-upy
- **Shapeways** — email kampane, abandoned cart emails

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

#### B1.1 Customers (CRM)

**Namespace:** `modelpricer:${tenantId}:customers:v1`

```json
{
  "customers": [
    {
      "id": "cust_abc123",
      "email": "jan.novak@example.com",
      "name": "Jan Novak",
      "phone": "+420 777 123 456",
      "company": "3D Print s.r.o.",
      "ico": "12345678",
      "dic": "CZ12345678",
      "address": {
        "street": "Vodickova 30",
        "city": "Praha",
        "zip": "11000",
        "country": "CZ"
      },
      "stats": {
        "total_spent": 15420.00,
        "order_count": 8,
        "average_order_value": 1927.50,
        "first_order_at": "2025-06-15T10:00:00Z",
        "last_order_at": "2026-01-10T14:30:00Z",
        "most_used_material": "pla",
        "most_used_technology": "fdm"
      },
      "tags": ["tag_vip", "tag_b2b", "tag_recurring"],
      "source": "WIDGET",
      "notes": "Pravidelny zakaznik, preferuje PETG. Vzdy objednava 5+ kusu.",
      "marketing_consent": true,
      "marketing_consent_at": "2025-06-15T10:00:00Z",
      "unsubscribed_at": null,
      "created_at": "2025-06-15T10:00:00Z",
      "updated_at": "2026-01-10T14:30:00Z"
    }
  ],
  "tags": [
    {
      "id": "tag_vip",
      "name": "VIP",
      "color": "#eab308",
      "is_auto": true,
      "auto_rules": {
        "conditions": [
          {"field": "stats.total_spent", "op": "gte", "value": 10000}
        ]
      }
    },
    {
      "id": "tag_b2b",
      "name": "B2B",
      "color": "#3b82f6",
      "is_auto": false
    },
    {
      "id": "tag_recurring",
      "name": "Opakujici se",
      "color": "#22c55e",
      "is_auto": true,
      "auto_rules": {
        "conditions": [
          {"field": "stats.order_count", "op": "gte", "value": 3}
        ]
      }
    },
    {
      "id": "tag_inactive",
      "name": "Neaktivni",
      "color": "#6b7280",
      "is_auto": true,
      "auto_rules": {
        "conditions": [
          {"field": "stats.last_order_at", "op": "older_than_days", "value": 180}
        ]
      }
    },
    {
      "id": "tag_problematic",
      "name": "Problemovy",
      "color": "#ef4444",
      "is_auto": false
    }
  ],
  "segments": [
    {
      "id": "seg_001",
      "name": "VIP zakaznici v Praze",
      "filters": {
        "tags_include": ["tag_vip"],
        "tags_exclude": [],
        "min_spent": null,
        "max_spent": null,
        "min_orders": null,
        "city": "Praha",
        "last_active_within_days": null
      },
      "customer_count_cache": 12,
      "last_computed_at": "2026-01-15T00:00:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "seg_002",
      "name": "Neaktivni zakaznici (180+ dni)",
      "filters": {
        "tags_include": ["tag_inactive"],
        "last_active_within_days": null
      },
      "customer_count_cache": 25,
      "last_computed_at": "2026-01-15T00:00:00Z"
    }
  ]
}
```

#### B1.2 Abandoned Carts

**Namespace:** `modelpricer:${tenantId}:abandoned-carts:v1`

```json
{
  "carts": [
    {
      "id": "cart_abc123",
      "session_id": "sess_m1abc_def456",
      "widget_instance_id": "w_xyz",
      "email": "petr@example.com",
      "name": "Petr Svoboda",
      "phone": null,
      "models": [
        {
          "file_name": "gear_housing.stl",
          "file_url": "/tmp/uploads/gear_housing.stl",
          "material": "petg",
          "quality": "normal",
          "quantity": 2,
          "config_snapshot": {
            "infill": 30,
            "supports": true,
            "layer_height": 0.2
          },
          "calculated_price": 320.00
        }
      ],
      "total_price": 640.00,
      "currency": "CZK",
      "last_step": "CONTACT",
      "source_url": "https://myshop.com/3d-tisk",
      "utm_params": {
        "source": "google",
        "medium": "cpc",
        "campaign": "3d-print-calculator"
      },
      "device_info": {
        "type": "desktop",
        "browser": "Chrome",
        "os": "Windows"
      },
      "started_at": "2026-01-15T14:00:00Z",
      "last_activity_at": "2026-01-15T14:25:00Z",
      "followup_count": 0,
      "last_followup_at": null,
      "recovered_at": null,
      "recovery_order_id": null,
      "is_deleted": false
    }
  ],
  "config": {
    "auto_followup_enabled": false,
    "followup_delay_hours": 24,
    "max_followups": 2,
    "followup_template_id": "tpl_abandoned_cart",
    "abandoned_threshold_minutes": 30,
    "track_anonymous": true,
    "track_with_email_only": false
  }
}
```

#### B1.3 Marketing Campaigns

**Namespace:** `modelpricer:${tenantId}:marketing:v1`

```json
{
  "campaigns": [
    {
      "id": "camp_001",
      "name": "Novorocni akce 2026",
      "type": "ONE_TIME",
      "status": "SENT",
      "subject": "Slepa 20 % na vse do konce ledna!",
      "body_html": "<h1>Novorocni akce</h1><p>Objednejte do 31.1. a usetrete...</p>",
      "body_text": "Novorocni akce. Objednejte do 31.1. a usetrete...",
      "recipients": {
        "type": "SEGMENT",
        "segment_id": "seg_001",
        "count": 12
      },
      "personalization": {
        "variables": ["{{name}}", "{{last_order_date}}", "{{total_spent}}"]
      },
      "schedule": {
        "send_at": "2026-01-05T09:00:00Z",
        "timezone": "Europe/Prague"
      },
      "stats": {
        "sent": 12,
        "delivered": 11,
        "opened": 7,
        "clicked": 3,
        "unsubscribed": 0,
        "converted": 2,
        "conversion_value": 3200.00
      },
      "coupon_id": null,
      "created_at": "2026-01-03T10:00:00Z",
      "sent_at": "2026-01-05T09:00:00Z"
    }
  ],
  "automations": [
    {
      "id": "auto_001",
      "name": "Welcome Email",
      "trigger": "CUSTOMER_REGISTERED",
      "status": "ACTIVE",
      "delay_hours": 0,
      "conditions": [],
      "template_id": "tpl_welcome",
      "stats": {
        "triggered": 150,
        "sent": 148,
        "opened": 95,
        "clicked": 42
      },
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "auto_002",
      "name": "Abandoned Cart Follow-up",
      "trigger": "ABANDONED_CART",
      "status": "ACTIVE",
      "delay_hours": 24,
      "conditions": [
        {"field": "cart.email", "op": "exists"},
        {"field": "cart.total_price", "op": "gte", "value": 100}
      ],
      "template_id": "tpl_abandoned_cart",
      "stats": {
        "triggered": 80,
        "sent": 65,
        "opened": 32,
        "clicked": 12,
        "recovered": 8,
        "recovery_value": 5600.00
      }
    },
    {
      "id": "auto_003",
      "name": "Post-Purchase Review Request",
      "trigger": "ORDER_COMPLETED",
      "status": "ACTIVE",
      "delay_hours": 168,
      "conditions": [
        {"field": "order.total", "op": "gte", "value": 200}
      ],
      "template_id": "tpl_review_request"
    },
    {
      "id": "auto_004",
      "name": "Win-Back (90 dni neaktivity)",
      "trigger": "CUSTOMER_INACTIVE",
      "status": "INACTIVE",
      "delay_hours": 0,
      "conditions": [
        {"field": "customer.last_order_days_ago", "op": "gte", "value": 90}
      ],
      "template_id": "tpl_winback"
    }
  ],
  "templates": [
    {
      "id": "tpl_welcome",
      "name": "Welcome Email",
      "subject": "Vitejte v {{company_name}}!",
      "body_html": "...",
      "body_text": "...",
      "category": "AUTOMATION",
      "variables": ["{{name}}", "{{company_name}}", "{{widget_url}}"],
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "tpl_abandoned_cart",
      "name": "Nedokoncena objednavka",
      "subject": "Zapomenli jste na svou objednavku?",
      "body_html": "...",
      "category": "AUTOMATION",
      "variables": ["{{name}}", "{{model_name}}", "{{material}}", "{{price}}", "{{recovery_url}}"]
    },
    {
      "id": "tpl_review_request",
      "name": "Zadost o recenzi",
      "subject": "Jak jste byli spokojeni s objednavkou?",
      "body_html": "...",
      "category": "AUTOMATION"
    },
    {
      "id": "tpl_winback",
      "name": "Chybite nam!",
      "subject": "{{name}}, uz je to dlouho! Mate slevu 15 %.",
      "body_html": "...",
      "category": "AUTOMATION",
      "coupon_id": "coupon_winback15"
    }
  ],
  "settings": {
    "sender_name": "ModelPricer",
    "sender_email": "info@modelpricer.com",
    "reply_to": "podpora@modelpricer.com",
    "unsubscribe_url": "{{base_url}}/unsubscribe/{{token}}",
    "footer_html": "<p>Nechcete tyto emaily? <a href='{{unsubscribe_url}}'>Odhlasit</a></p>",
    "integration": {
      "provider": null,
      "provider_api_key": null,
      "synced_at": null
    }
  }
}
```

### B2. API kontrakty (endpointy)

```
# Customers (CRM)
GET    /api/v1/customers                       # Seznam zakazniku (paginace, filtry)
GET    /api/v1/customers/:id                   # Detail zakaznika
POST   /api/v1/customers                       # Vytvorit zakaznika (manualne)
PATCH  /api/v1/customers/:id                   # Aktualizovat
DELETE /api/v1/customers/:id                   # GDPR smazani (hard delete)
GET    /api/v1/customers/:id/orders            # Objednavky zakaznika
GET    /api/v1/customers/:id/timeline          # Casova osa aktivit
POST   /api/v1/customers/:id/tags              # Pridat tag
DELETE /api/v1/customers/:id/tags/:tagId       # Odebrat tag
POST   /api/v1/customers/:id/notes             # Pridat poznamku
GET    /api/v1/customers/export                # CSV/Excel export

# Tags
GET    /api/v1/tags                            # Seznam tagu
POST   /api/v1/tags                            # Vytvorit tag
PATCH  /api/v1/tags/:id                        # Aktualizovat
DELETE /api/v1/tags/:id                        # Smazat tag

# Segments
GET    /api/v1/segments                        # Seznam segmentu
POST   /api/v1/segments                        # Vytvorit segment
GET    /api/v1/segments/:id                    # Detail segmentu
GET    /api/v1/segments/:id/customers          # Zakaznici v segmentu
PATCH  /api/v1/segments/:id                    # Aktualizovat filtry
DELETE /api/v1/segments/:id                    # Smazat segment
POST   /api/v1/segments/:id/recompute         # Prepocitat segment

# Abandoned Carts
GET    /api/v1/abandoned-carts                 # Seznam abandoned carts
GET    /api/v1/abandoned-carts/:id             # Detail
POST   /api/v1/abandoned-carts/:id/followup    # Odeslat follow-up email
POST   /api/v1/abandoned-carts/:id/convert     # Rucne dokoncit jako objednavku
DELETE /api/v1/abandoned-carts/:id             # GDPR smazani
GET    /api/v1/abandoned-carts/stats           # Statistiky (count, value, conversion)

# Campaigns
GET    /api/v1/campaigns                       # Seznam kampani
POST   /api/v1/campaigns                       # Vytvorit kampan
GET    /api/v1/campaigns/:id                   # Detail kampane
PATCH  /api/v1/campaigns/:id                   # Aktualizovat (draft)
POST   /api/v1/campaigns/:id/send              # Odeslat kampan
POST   /api/v1/campaigns/:id/schedule          # Naplanovat odeslani
GET    /api/v1/campaigns/:id/stats             # Statistiky kampane
POST   /api/v1/campaigns/:id/test              # Odeslat testovaci email

# Automations
GET    /api/v1/automations                     # Seznam automatizaci
POST   /api/v1/automations                     # Vytvorit
PATCH  /api/v1/automations/:id                 # Aktualizovat
PATCH  /api/v1/automations/:id/toggle          # Aktivovat/deaktivovat
GET    /api/v1/automations/:id/stats           # Statistiky

# Templates
GET    /api/v1/templates                       # Seznam sablon
POST   /api/v1/templates                       # Vytvorit sablonu
PATCH  /api/v1/templates/:id                   # Aktualizovat
DELETE /api/v1/templates/:id                   # Smazat
POST   /api/v1/templates/:id/preview           # Nahled s demo daty

# Unsubscribe
GET    /api/v1/unsubscribe/:token              # Odhlaseni z odberu
POST   /api/v1/unsubscribe/:token              # Potvrzeni odhlaseni
```

### B3. Komponentni strom (React)

```
Admin UI:
  AdminCustomers/
    CustomersPage.jsx                  # /admin/customers — Hlavni CRM stranka
      CustomerFilters.jsx              # Filtrovani a vyhledavani
        TagFilter.jsx                  # Filtr dle tagu
        DateRangeFilter.jsx            # Filtr dle data
        SpentRangeFilter.jsx           # Filtr dle utraty
      CustomerTable.jsx                # Tabulka zakazniku (sortable, paginated)
        CustomerRow.jsx                # Radek se zakladnimi info + tagy
      CustomerDetail.jsx               # Detail zakaznika (modal nebo stranka)
        CustomerInfoCard.jsx           # Kontaktni udaje (editovatelne)
        CustomerStatsCard.jsx          # Statistiky (utrata, objednavky, avg value)
        CustomerOrderHistory.jsx       # Historie objednavek (odkaz na AdminOrders)
        CustomerTagManager.jsx         # Pridavani/odebirani tagu
        CustomerNotes.jsx              # Interni poznamky
        CustomerTimeline.jsx           # Casova osa vsech aktivit
      CustomerExportButton.jsx         # Export CSV/Excel
    TagsManager.jsx                    # Sprava tagu (/admin/customers/tags)
      TagRow.jsx                       # Jeden tag (barva, nazev, auto pravidla)
      AutoTagRuleEditor.jsx            # Editor pravidel automatickeho tagovani
    SegmentsManager.jsx                # Sprava segmentu
      SegmentRow.jsx                   # Jeden segment (nazev, filtry, pocet)
      SegmentEditor.jsx                # Vizualni editor filtru segmentu

  AdminAbandonedCarts/
    AbandonedCartsPage.jsx             # /admin/abandoned-carts
      AbandonedCartsDashboard.jsx      # Prehled: pocet, hodnota, konverze, graf
      AbandonedCartsList.jsx           # Tabulka abandoned carts
        AbandonedCartRow.jsx           # Radek: datum, email, modely, cena, posledni krok
      AbandonedCartDetail.jsx          # Detail abandoned cart
        CartModelPreview.jsx           # 3D nahled modelu v kosiku
        FollowupActions.jsx            # Akce: follow-up, convert, delete
      AbandonedCartsConfig.jsx         # Nastaveni auto follow-up

  AdminMarketing/
    MarketingPage.jsx                  # /admin/marketing — Hlavni marketing stranka
      MarketingDashboard.jsx           # Prehled: aktivni kampane, stats
      CampaignsList.jsx                # Seznam kampani (drafted, scheduled, sent)
        CampaignCard.jsx               # Karta kampane (nazev, stav, statistiky)
      CampaignEditor.jsx               # Editor kampane (multi-step wizard)
        CampaignRecipientsStep.jsx     # Krok 1: Vyber prijemcu (segment, manual)
        CampaignContentStep.jsx        # Krok 2: Obsah emailu
          EmailWysiwyg.jsx             # WYSIWYG email editor
          EmailHtmlEditor.jsx          # Raw HTML editor (advanced)
          EmailPreview.jsx             # Nahled (desktop/mobile)
        CampaignScheduleStep.jsx       # Krok 3: Cas odeslani
        CampaignReviewStep.jsx         # Krok 4: Souhrn a odeslani
      CampaignStats.jsx                # Statistiky kampane (otevrani, prokliky...)
      AutomationsList.jsx              # Seznam automatizaci
        AutomationCard.jsx             # Karta automatizace (trigger, stav, stats)
        AutomationEditor.jsx           # Editor automatizace
      TemplatesLibrary.jsx             # Knihovna emailovych sablon
        TemplateCard.jsx               # Jedna sablona (nahled, akce)
        TemplateEditor.jsx             # Editor sablony
      MarketingSettings.jsx            # Nastaveni (sender, integrace)
        MailProviderConfig.jsx         # Konfigurace Mailchimp/Brevo/vlastni SMTP

  AdminAnalytics (rozsireni existujicich):
    AnalyticsEnhanced.jsx              # Rozsireni AdminAnalytics.jsx
      ConversionFunnel.jsx             # Vizualni funnel (view -> upload -> price -> order)
      RevenueChart.jsx                 # Trzby v case (Recharts)
      CustomerAcquisition.jsx          # Nove zakaznici v case
      TopCustomersTable.jsx            # Top 10 zakazniku dle utraty
      MaterialPopularity.jsx           # Nejpopularnejsi materialy
      GeographicDistribution.jsx       # Mapa zakazniku (pokud mame adresy)
```

### B4. Tenant storage namespace

| Namespace | Helper | Obsah |
|-----------|--------|-------|
| `customers:v1` | `adminCustomerStorage.js` | Zakaznici, tagy, segmenty |
| `abandoned-carts:v1` | `adminAbandonedCartStorage.js` | Nedokoncene kalkulace |
| `marketing:v1` | `adminMarketingStorage.js` | Kampane, automatizace, sablony, nastaveni |
| `analytics` (existujici) | `adminAnalyticsStorage.js` | Rozsireni o CRM metriky |
| `orders:v1` (existujici) | `adminOrdersStorage.js` | Bez zmeny — propojeni pres customer_id |

**Novy helper — `src/utils/adminCustomerStorage.js`:**

```javascript
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS = 'customers:v1';

const DEFAULT_TAGS = [
  { id: 'tag_vip', name: 'VIP', color: '#eab308', is_auto: true,
    auto_rules: { conditions: [{ field: 'stats.total_spent', op: 'gte', value: 10000 }] } },
  { id: 'tag_recurring', name: 'Opakujici se', color: '#22c55e', is_auto: true,
    auto_rules: { conditions: [{ field: 'stats.order_count', op: 'gte', value: 3 }] } },
  { id: 'tag_inactive', name: 'Neaktivni', color: '#6b7280', is_auto: true,
    auto_rules: { conditions: [{ field: 'stats.last_order_at', op: 'older_than_days', value: 180 }] } },
  { id: 'tag_b2b', name: 'B2B', color: '#3b82f6', is_auto: false },
  { id: 'tag_problematic', name: 'Problemovy', color: '#ef4444', is_auto: false },
];

export function getCustomerData() {
  return readTenantJson(NS, { customers: [], tags: DEFAULT_TAGS, segments: [] });
}

export function saveCustomerData(data) {
  writeTenantJson(NS, data);
}

export function getCustomers() {
  return getCustomerData().customers || [];
}

export function getCustomerByEmail(email) {
  const customers = getCustomers();
  return customers.find(c => c.email?.toLowerCase() === email?.toLowerCase()) || null;
}

export function getCustomerById(id) {
  const customers = getCustomers();
  return customers.find(c => c.id === id) || null;
}

export function upsertCustomerFromOrder(order) {
  // Vytvorit/aktualizovat zakaznika z objednavky
  const data = getCustomerData();
  const email = order.customer_email?.toLowerCase();
  if (!email) return null;

  const existing = data.customers.find(c => c.email?.toLowerCase() === email);
  if (existing) {
    // Aktualizovat statistiky
    existing.stats.total_spent += order.total || 0;
    existing.stats.order_count += 1;
    existing.stats.average_order_value = existing.stats.total_spent / existing.stats.order_count;
    existing.stats.last_order_at = new Date().toISOString();
    existing.updated_at = new Date().toISOString();
    // Reapply auto tags
    applyAutoTags(existing, data.tags);
  } else {
    // Vytvorit noveho zakaznika
    const newCustomer = {
      id: `cust_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      email: email,
      name: order.customer_name || '',
      phone: order.customer_phone || '',
      company: order.customer_company || '',
      stats: {
        total_spent: order.total || 0,
        order_count: 1,
        average_order_value: order.total || 0,
        first_order_at: new Date().toISOString(),
        last_order_at: new Date().toISOString(),
      },
      tags: [],
      source: 'WIDGET',
      marketing_consent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    applyAutoTags(newCustomer, data.tags);
    data.customers.push(newCustomer);
  }

  saveCustomerData(data);
  return getCustomerByEmail(email);
}

function applyAutoTags(customer, tags) {
  const autoTags = tags.filter(t => t.is_auto && t.auto_rules?.conditions);
  for (const tag of autoTags) {
    const match = evaluateAutoTagRules(customer, tag.auto_rules.conditions);
    if (match && !customer.tags.includes(tag.id)) {
      customer.tags.push(tag.id);
    } else if (!match && customer.tags.includes(tag.id)) {
      customer.tags = customer.tags.filter(t => t !== tag.id);
    }
  }
}

function evaluateAutoTagRules(customer, conditions) {
  return conditions.every(cond => {
    const value = getNestedValue(customer, cond.field);
    switch (cond.op) {
      case 'gte': return Number(value) >= Number(cond.value);
      case 'lte': return Number(value) <= Number(cond.value);
      case 'eq': return value === cond.value;
      case 'older_than_days': {
        if (!value) return true; // no date = considered inactive
        const days = (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24);
        return days >= Number(cond.value);
      }
      default: return false;
    }
  });
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}
```

### B5. Widget integrace (postMessage)

**Nove postMessage zpravy pro abandoned cart tracking:**

```javascript
// Widget -> Admin (interni tracking, ne parent page):
// Tyto zpravy se odesilaji pres adminAnalyticsStorage
{
  type: 'ANALYTICS_ABANDONED_CART_UPDATE',
  sessionId: 'sess_...',
  data: {
    step: 'CONTACT',      // UPLOAD, CONFIG, PRICING, CONTACT
    models: [...],
    total_price: 640.00,
    email: 'petr@example.com',  // pokud zadano
    name: 'Petr Svoboda'
  }
}

// Widget -> Parent (e-shop):
{
  type: 'MODELPRICER_CUSTOMER_IDENTIFIED',
  publicId: 'w_xyz',
  customer: {
    email: 'petr@example.com',
    name: 'Petr Svoboda'
  }
}
```

**Abandoned cart detekce:**
- Widget meri cas necinnosti (inactivity timer)
- Pokud zakaznik neudela akci > `abandoned_threshold_minutes` (default 30)
  a dosahl alespon kroku PRICING, system ulozi abandoned cart
- Pokud zakaznik se vrati (same session), cart je aktualizovan
- Pokud zakaznik dokonci objednavku, cart je oznacen jako `recovered`

### B6. Pricing engine integrace

S19 **primo neprisahuje** do `pricingEngineV3.js`. Pricing engine zustava beze zmeny.

**Neprime interakce:**
- CRM statistiky (`total_spent`, `average_order_value`) se pocitaji z vysledku pricing engine
- Abandoned cart `total_price` je posledni `calculateOrderQuote().total` pred opustenim
- Kampane mohou obsahovat kupony (S10) ktere ovlivnuji pricing pres fees
- Segmentace muze filtrovat dle `most_used_material` — tato data pochazi z pricing configu

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-frontend` | Architektura CRM a marketing UI | Celkovy plan | P0 |
| `mp-mid-frontend-admin` | Admin stranky (Customers, Marketing, Abandoned Carts) | `src/pages/admin/Admin*.jsx` | P1 |
| `mp-mid-storage-tenant` | 3 nove storage helpery | `src/utils/admin*Storage.js` | P0 |
| `mp-spec-fe-forms` | CRM formulare, campaign wizard, tag editor | `*Editor.jsx`, `*Dialog.jsx` | P1 |
| `mp-spec-fe-tables` | Zakaznicka tabulka, abandoned cart list, campaign list | `*Table.jsx`, `*List.jsx` | P1 |
| `mp-spec-fe-charts` | Analytics grafy (Recharts) | `*Chart.jsx`, `ConversionFunnel.jsx` | P2 |
| `mp-mid-frontend-widget` | Abandoned cart tracking ve widgetu | `src/pages/widget/*` | P1 |
| `mp-mid-backend-services` | Email campaign sending, scheduled jobs | `backend-local/routes/marketing.js` | P2 |
| `mp-spec-be-email` | Email sending (Nodemailer), template rendering | `backend-local/services/email.js` | P1 |
| `mp-spec-security-gdpr` | GDPR compliance (souhlas, smazani, export) | Celkovy review | P0 |
| `mp-mid-security-app` | Bezpecnost kampani (unsubscribe token, rate limit) | Security review | P0 |
| `mp-spec-fe-routing` | Nove routy | `src/Routes.jsx` | P1 |
| `mp-sr-docs` | CRM a marketing dokumentace | `docs/admin/` | P2 |
| `mp-spec-i18n-translations` | Preklady CRM a marketing retezcu | `locales/*.json` | P2 |

### C2. Implementacni kroky (poradi)

**Faze 1: CRM zaklad (tyden 1-2)**

1. **[PARALELNI, P0]** Vytvorit `src/utils/adminCustomerStorage.js`
   - CRUD operace, upsert z objednavky, auto-tagging
   - Default tagy (VIP, B2B, Recurring, Inactive, Problematic)

2. **[PARALELNI, P0]** Vytvorit `src/utils/adminAbandonedCartStorage.js`
   - CRUD, abandoned cart detekce, follow-up tracking

3. **[SEKVENCNI po 1, P1]** Admin UI: `CustomersPage.jsx`
   - Tabulka zakazniku s filtry a vyhledavanim
   - Detail zakaznika (statistiky, objednavky, tagy, poznamky)
   - CSV/Excel export

4. **[SEKVENCNI po 3, P1]** Tags a segmenty
   - `TagsManager.jsx` — sprava tagu vcetne auto pravidel
   - `SegmentsManager.jsx` — vizualni editor segmentu

5. **[SEKVENCNI po 3]** Route `/admin/customers` + navigace

**Faze 2: Abandoned Cart Tracking (tyden 2-3)**

6. **[PARALELNI, P1]** Widget tracking — rozsireni `WidgetEmbed.jsx`
   - Sledovani kroku (UPLOAD -> CONFIG -> PRICING -> CONTACT)
   - Inactivity timer pro detekci abandoned carts
   - Ulozeni abandoned cart dat do storage

7. **[SEKVENCNI po 2+6, P1]** Admin UI: `AbandonedCartsPage.jsx`
   - Dashboard: pocet, celkova hodnota, konverzni pomer, trendovy graf
   - Seznam s filtry (obdobi, cenove rozmezi, s/bez emailu)
   - Detail: kompletni info, 3D nahled modelu, akce (follow-up, convert, delete)

8. **[SEKVENCNI po 7]** Abandoned cart konfigurace
   - Nastaveni auto follow-up (delay, max count, sablona)
   - GDPR: moznost smazani dat

**Faze 3: Marketing zaklad (tyden 3-4)**

9. **[PARALELNI, P1]** Vytvorit `src/utils/adminMarketingStorage.js`
   - Kampane, automatizace, sablony, nastaveni

10. **[SEKVENCNI po 9, P1]** Admin UI: `MarketingPage.jsx`
    - Marketing dashboard (aktivni kampane, statistiky)
    - Prehled automatizaci

11. **[SEKVENCNI po 10, P2]** Campaign editor (multi-step wizard)
    - Krok 1: Vyber prijemcu (vsichni, segment, manualni, import)
    - Krok 2: Obsah emailu (WYSIWYG + HTML editor + nahled)
    - Krok 3: Planovani (ihned, naplanovat)
    - Krok 4: Souhrn a potvrzeni

12. **[PARALELNI po 9, P2]** Sablony emailu
    - Knihovna predefinovanych sablon (welcome, abandoned cart, post-purchase, winback)
    - Editor sablon

**Faze 4: Email automatizace (tyden 4-5)**

13. **[SEKVENCNI po 11+12, P2]** Automatizace engine
    - Trigger detekce (customer registered, abandoned cart, order completed, inactive)
    - Delay scheduling (cron job nebo setTimeout pattern)
    - Template rendering s personalizaci ({{name}}, {{price}}, {{recovery_url}})
    - Integrace s S07 email infrastrukturou (Nodemailer)

14. **[PARALELNI, P2]** Tracking (otevrani, prokliky)
    - Tracking pixel pro otevrani (1x1 transparent GIF s unique ID)
    - UTM parametry pro prokliky
    - Unsubscribe link s tokenem

15. **[PARALELNI, P2]** Integrace s externim providerem (Mailchimp/Brevo)
    - Konfigurace API klice v admin UI
    - Synchronizace zakazniku (bi-directional sync)
    - Synchronizace tagu/segmentu
    - Kampane pres providera misto vlastniho odesilatele

**Faze 5: Analytics rozsireni + testovani (tyden 5)**

16. **[PARALELNI, P2]** Rozsireni AdminAnalytics.jsx
    - Konverzni funnel (vizualni trychtyr)
    - Revenue chart (Recharts line chart)
    - Top zakazniku tabulka
    - Material popularita

17. **[PARALELNI]** Testovani
    - Unit testy: storage helpery, auto-tagging, segment evaluation
    - Integracni testy: abandoned cart flow, campaign sending
    - E2E: cely flow od widget navstevy pres abandoned cart po follow-up email
    - GDPR compliance testy

### C3. Kriticke rozhodovaci body

1. **Vlastni email marketing vs. integrace s providerem?**
   - **Doporuceni:** Hybridni pristup
     - MVP: vlastni zakladni sending (Nodemailer) + Mailchimp/Brevo integrace
     - Zakaznik si vybere: "Pouzit vlastni" nebo "Propojit s Mailchimp"
   - Vlastni reseni pro abandoned cart follow-up (jednoduche, automaticke)
   - Provider pro kampane (lepsi deliverability, unsubscribe management)

2. **WYSIWYG email editor: vlastni vs. knihovna?**
   - **Doporuceni:** Pouzit existujici knihovnu
   - Kandidati: `TipTap` (rich text) + `React Email` (rendering)
   - Nebo: `MJML` editor s live preview
   - NEVYTVAREJTE vlastni drag-and-drop email builder — prilis slozite pro MVP

3. **Abandoned cart: client-side vs. server-side detekce?**
   - **Client-side** (doporuceno pro Variant A): widget posila heartbeat eventu,
     absence = abandoned
   - Server-side (pro Variant B): API endpoint pro session updates, cron pro detekci
   - **Rozhodnuti:** Client-side pro demo, s pripravenym API interface pro budouci migraci

4. **Customer deduplication: email-based vs. account-based?**
   - **Email-based** (doporuceno): email je primarni identifikator
   - Account-based: vyzaduje S12 (zakaznicky portal)
   - **Rozhodnuti:** Email-based pro MVP, propojeni s ucty az po S12

### C4. Testovaci strategie

**Unit testy (P0):**
- `adminCustomerStorage.js` — CRUD, upsert, auto-tagging, segment evaluation
- `adminAbandonedCartStorage.js` — CRUD, abandoned detection, follow-up tracking
- `adminMarketingStorage.js` — campaign CRUD, template rendering, scheduling
- Auto-tag pravidla: VIP (total_spent >= 10000), Recurring (orders >= 3), Inactive (180 dni)
- Segment filtrování: kombinace tagu, utraty, mesta

**Integracni testy (P1):**
- Widget -> abandoned cart: upload model -> calculate price -> leave -> check abandoned cart
- Objednavka -> CRM: create order -> verify customer upserted with correct stats
- Campaign -> email: create campaign -> select segment -> send -> verify delivery
- Follow-up flow: abandoned cart detected -> auto follow-up sent -> customer returns -> recovered

**E2E testy (P1):**
- Admin: zobrazit zakazniky -> filtrovat dle tagu -> detail zakaznika -> pridat poznamku
- Admin: zobrazit abandoned carts -> odeslat follow-up -> zakaznik dokonci objednavku
- Admin: vytvorit kampan -> vybrat segment -> napsat email -> odeslat -> zkontrolovat statistiky

**GDPR testy (P0):**
- Smazani zakaznika: vsechna data vcetne poznamek a tagu smazana
- Export dat: JSON/CSV obsahuje vsechna zakaznicka data
- Unsubscribe: token funguje, marketing_consent se nastavi na false
- Souhlas: marketing emaily se neodeseilaji bez marketing_consent = true

### C5. Migrace existujicich dat

**Migrace 1: Extrakce zakazniku z objednavek**

Existujici objednavky v `orders:v1` obsahuji zakaznicka data (`customer_name`,
`customer_email`, `customer_phone`). Pri prvnim spusteni CRM se zakaznici extahuji:

```javascript
// V adminCustomerStorage.js:
export function migrateCustomersFromOrders() {
  const data = getCustomerData();
  if (data.customers.length > 0) return; // uz migrovano

  const orders = readTenantJson('orders:v1', { orders: [] });
  const customerMap = new Map();

  for (const order of (orders.orders || [])) {
    const email = order.customer_email?.toLowerCase();
    if (!email) continue;

    if (customerMap.has(email)) {
      const existing = customerMap.get(email);
      existing.stats.total_spent += order.total || 0;
      existing.stats.order_count += 1;
      existing.stats.average_order_value = existing.stats.total_spent / existing.stats.order_count;
      if (order.created_at > existing.stats.last_order_at) {
        existing.stats.last_order_at = order.created_at;
      }
      if (order.created_at < existing.stats.first_order_at) {
        existing.stats.first_order_at = order.created_at;
      }
    } else {
      customerMap.set(email, {
        id: `cust_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        email,
        name: order.customer_name || '',
        phone: order.customer_phone || '',
        stats: {
          total_spent: order.total || 0,
          order_count: 1,
          average_order_value: order.total || 0,
          first_order_at: order.created_at,
          last_order_at: order.created_at,
        },
        tags: [],
        source: 'MIGRATION',
        marketing_consent: false,  // DULEZITE: default false, admin musi ziskat souhlas
        created_at: order.created_at,
        updated_at: new Date().toISOString(),
      });
    }
  }

  data.customers = Array.from(customerMap.values());
  // Apply auto tags
  for (const customer of data.customers) {
    applyAutoTags(customer, data.tags);
  }
  saveCustomerData(data);
}
```

**Migrace 2: Konverze existujicich "ztracenach sessions" na abandoned carts**

`adminAnalyticsStorage.js` jiz sleduje sessions. Ty ktere nemaji `ORDER_CREATED` event
mohou byt migrovany do abandoned carts:

```javascript
export function migrateFromAnalyticsSessions() {
  // Konvertovat existujici "lost sessions" z analytics do abandoned-carts:v1
  const sessions = getAnalyticsSessions();
  const lostSessions = findLostSessions(sessions);
  // ... mapovat na abandoned cart format
}
```

---

## D. KVALITA

### D1. Security review body

**P0 — Kriticke:**
- **GDPR compliance:**
  - Marketing emaily POUZE s explicitnim souhlasem (`marketing_consent = true`)
  - Unsubscribe link v KAZDEM marketingovem emailu (povinne dle GDPR a CAN-SPAM)
  - "Pravo byt zapomenut" — hard delete zakaznickeho zaznamu vcetne vsech spojenych dat
  - Export osobnich dat na zadost (Article 15 GDPR)
  - Data retention policy — automaticke smazani abandoned carts po X dnech
- **Unsubscribe token:** Kryptograficky bezpecny, single-use token
  - Pouzit HMAC-SHA256 s tenant secret: `HMAC(email + timestamp, tenantSecret)`
  - Token nesmi byt uhopitelny (no sequential IDs)
- **Email injection:** Sanitizace vsech personalizacnich promennych
  - `{{name}}` nesmi obsahovat HTML/script injection
  - Vsechny promenne musi projit HTML entity encoding
- **Rate limiting:** Limit na pocet emailu za hodinu/den per tenant
  - Prevence zneuziti pro spam

**P1 — Dulezite:**
- **Tracking pixel:** Nesmi leakovat osobni data v URL
  - Pouzit opaque token, ne email v URL
- **CSV export:** Nesmi byt pristupny bez admin autentizace
- **Segment SQL injection (budouci):** Pokud segment filtry pujdou na backend, sanitizovat
- **Campaign scheduling:** Ochrana proti duplicitnimu odeslani (idempotency)
- **Customer data v localStorage:** Variant A uklada PII do localStorage
  - Pro produkci: MUSI se presunout na backend s encryption at rest

### D2. Performance budget

| Metrika | Cil | Jak merit |
|---------|-----|-----------|
| Customer list (1000 zakazniku) | < 500ms render | React Profiler |
| Segment evaluation (1000 zakazniku, 5 filtru) | < 200ms | Performance.now() |
| Abandoned cart dashboard | < 300ms first paint | Lighthouse |
| Campaign editor | < 1s load | Lighthouse |
| Email template preview | < 500ms render | Performance.now() |
| Analytics charts (6 mesicu dat) | < 1s render | Recharts profiling |
| CSV export (5000 radku) | < 3s generation | Performance.now() |

**Optimalizace:**
- Virtualizace zakaznicke tabulky (react-window) pro > 100 zaznamu
- Lazy load kampani a automatizaci (tab-based loading)
- Memoizace segmentu — cache vysledku, prepocitat jen pri zmene filtru
- Debounce vyhledavani zakazniku (300ms)
- Progresivni nacitani analytics dat (nejdrive prehled, pak detaily)

### D3. Accessibility pozadavky

- **CustomerTable:** `role="table"` s `<caption>`, sortable hlavicky s `aria-sort`
- **TagManager:** Tagy jako `role="listbox"`, barva tagu s text labelem (ne jen barva)
- **SegmentEditor:** Formularove elementy s `aria-label` a `aria-describedby`
- **CampaignWizard:** Stepper s `aria-current="step"`, `aria-label` pro kazdy krok
- **EmailPreview:** `aria-label="Nahled emailu"` s prepinaci desktop/mobile
- **Charts (Recharts):** `aria-label` na SVG, tabulkova alternativa pro screen readery
- **AbandonedCartDetail:** Focus management pri otevreni detailu
- **Unsubscribe page:** Jednoducha, pristupna stranka (klavesnice, screen reader)

### D4. Error handling a edge cases

**CRM:**
- Zakaznik bez emailu (telefonni objednavka) -> vytvori se se specialnim tagem "Bez emailu"
- Duplikatni zakaznik (ruzna jmena, stejny email) -> merge s confirmation dialogem
- Auto-tag infinite loop (tag pridava/odebira se donekonecna) -> max 1 iterace pravidel
- Segment bez zakazniku -> zobrazit prazdny stav, varovat pred kampani
- Smazani tagu ktery je soucasti segmentu -> warning, aktualizovat segment

**Abandoned Carts:**
- Session bez modelu (zakaznik okamzite odesel) -> neukladat jako abandoned
- Anonymni session (bez emailu) -> ulozit, ale bez moznosti follow-up emailu
- Follow-up email bounce -> increment failure_count, zastavit po 3 bounces
- Zakaznik se vrati a dokonci objednavku -> oznacit cart jako "recovered", propojit s order_id
- Velmi stare abandoned carts (> 90 dni) -> automaticke archivovani/smazani

**Marketing:**
- Email sablona s neexistujici promennou -> nahradit prazdnym retezcem, log warning
- Kampan bez prijemcu -> blokovat odeslani s chybovou hlaskou
- Duplicitni email v prijemcich -> deduplikace pred odeslanim
- Scheduling v minulosti -> odeslat ihned s warningem
- Provider (Mailchimp) API error -> retry 3x, pak oznacit kampan jako "FAILED"
- Unsubscribe token expired -> zobrazit formular pro rucni odhlaseni pres email

**Analytics:**
- Zadna data za vybrane obdobi -> zobrazit prazdny stav, ne nulove grafy
- Velky objem dat (>100k sessions) -> agregace na server-side (Variant B)
- Chart rendering s extremnimi hodnotami -> automaticke scaleovani os

### D5. i18n pozadavky

**Vysoka priorita (~120 novych retezcu):**

- **CRM:** Nazvy sloupcu tabulky (Jmeno, Email, Objednavky, Utrata, Posledni aktivita)
- **CRM:** Defaultni tagy (VIP, B2B, Opakujici se, Neaktivni, Problemovy)
- **CRM:** Akce (Pridat tag, Odebrat, Export, Smazat, Ulozit poznamku)
- **Abandoned Carts:** Stavy (Upload, Config, Pricing, Contact)
- **Abandoned Carts:** Akce (Follow-up, Konvertovat, Smazat)
- **Marketing:** Campaign stavy (Draft, Scheduled, Sending, Sent, Failed)
- **Marketing:** Automation triggers (Welcome, Abandoned Cart, Post-Purchase, Win-Back)
- **Marketing:** Email statistiky (Odeslano, Doruceno, Otevreno, Prokliknuto, Odhlaseno)
- **Analytics:** Nazvy grafu a metrik (Konverze, Trzby, Zakaznici)
- **GDPR:** Texty souhlasu, unsubscribe stranka, export dat

**Email sablony (vicejazycne):**
- Welcome email: cs, en, de, sk
- Abandoned cart follow-up: cs, en, de, sk
- Post-purchase review request: cs, en
- Win-back: cs, en

**Format:** Pouzit `react-i18next` namespace `crm`, `marketing`, `analytics`

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

```javascript
{
  "features": {
    "crm_customers": false,              // P0: zakaznicka databaze
    "crm_tags": false,                   // P0: tagy a auto-tagging
    "crm_segments": false,               // P1: segmentace
    "abandoned_cart_tracking": false,     // P1: sledovani nedokoncenych kalkulaci
    "abandoned_cart_auto_followup": false,// P2: automaticky follow-up email
    "marketing_campaigns": false,        // P2: jednorázove kampane
    "marketing_automations": false,      // P2: automatizovane emaily
    "marketing_provider_integration": false, // P3: Mailchimp/Brevo integrace
    "analytics_enhanced": false,         // P1: rozsirene analytics (grafy)
    "gdpr_compliance": true              // P0: VZDY AKTIVNI
  }
}
```

**Rollout plan:**
1. **Alpha (tyden 2):** CRM zaklad — zakaznicka tabulka, tagy (interni testing)
2. **Alpha (tyden 3):** Abandoned cart tracking ve widgetu
3. **Beta (tyden 4):** CRM + abandoned carts pro 5-10 zakazniku
4. **Public (tyden 5):** CRM + abandoned carts pro vsechny
5. **Beta (tyden 6):** Marketing kampane (5 zakazniku)
6. **Public (tyden 7):** Marketing kampane pro vsechny
7. **Iterace (tyden 8+):** Automatizace, provider integrace

### E2. Admin UI zmeny

**Nove stranky:**
- `/admin/customers` — Zakaznicka databaze (CRM)
- `/admin/customers/tags` — Sprava tagu
- `/admin/customers/segments` — Sprava segmentu
- `/admin/abandoned-carts` — Nedokoncene kalkulace
- `/admin/marketing` — Marketingovy dashboard
- `/admin/marketing/campaigns` — Seznam kampani
- `/admin/marketing/campaigns/new` — Editor nove kampane
- `/admin/marketing/automations` — Automatizace
- `/admin/marketing/templates` — Knihovna sablon
- `/admin/marketing/settings` — Nastaveni (sender, provider)

**Zmeny existujicich stranek:**
- `/admin/analytics` — Rozsireni o nove grafy (funnel, revenue, top customers)
- `/admin/orders` (detail) — Odkaz na detail zakaznika v CRM

**Navigace (AdminLayout.jsx):**
```
Admin Dashboard
├── Branding          (existujici)
├── Pricing           (existujici)
├── Fees              (existujici)
├── Presets           (existujici)
├── Parameters        (existujici)
├── Orders            (existujici, rozsirene o CRM link)
├── Zakaznici         (NOVE — /admin/customers)
│   ├── Seznam        (/admin/customers)
│   ├── Tagy          (/admin/customers/tags)
│   └── Segmenty      (/admin/customers/segments)
├── Nedokoncene       (NOVE — /admin/abandoned-carts)
├── Marketing         (NOVE — /admin/marketing)
│   ├── Dashboard     (/admin/marketing)
│   ├── Kampane       (/admin/marketing/campaigns)
│   ├── Automatizace  (/admin/marketing/automations)
│   ├── Sablony       (/admin/marketing/templates)
│   └── Nastaveni     (/admin/marketing/settings)
├── Widget Builder    (existujici)
├── Analytics         (existujici, rozsirene)
└── Team & Access     (existujici)
```

### E3. Widget zmeny

**Zmeny v `WidgetEmbed.jsx` a widget flow:**

1. **Abandoned cart tracking (neinvazivni):**
   - Pridani event listeneru pro sledovani kroku (upload, config, pricing, contact)
   - Inactivity timer (defaultne 30 min)
   - Ulozeni stavu do `adminAbandonedCartStorage.js` pri kazdem kroku
   - Pri dokonceni objednavky: oznaceni cartu jako recovered

2. **Marketing consent checkbox (v kontaktnim formulari - S02):**
   - Checkbox "Souhlasim se zasilanim marketingovych emailu"
   - Default: unchecked (opt-in model — GDPR)
   - Text s odkazem na privacy policy

3. **Recovery URL:**
   - Abandoned cart follow-up email obsahuje odkaz na widget s pre-loaded konfiguraci
   - URL format: `/widget/embed/:publicId?recovery=:cartId`
   - Widget detekuje `recovery` parametr a nacte ulozeny stav

**DULEZITE:** Widget zmeny musi byt minimalne invazivni — nesmi ovlivnit zakladni flow
nebo performance. Tracking musi byt asynchronni a nesmi blokovat UI.

### E4. Dokumentace pro uzivatele

1. **Admin guide: CRM** — Prehled zakazniku, filtrovani, tagy, segmenty
2. **Admin guide: Tagy** — Jak vytvorit tag, nastavit automaticke pravidla
3. **Admin guide: Segmenty** — Jak vytvorit segment, pouziti v kampanich
4. **Admin guide: Abandoned Carts** — Co jsou nedokoncene kalkulace, jak na ne reagovat
5. **Admin guide: Marketing** — Jak vytvorit kampan, vybrat prijemce, odeslat
6. **Admin guide: Automatizace** — Jak nastavit welcome email, abandoned cart follow-up
7. **Admin guide: Sablony** — Jak editovat emailove sablony, personalizace
8. **Admin guide: Integrace s Mailchimp** — Propojeni, synchronizace
9. **GDPR guide** — Jak spravit souhlasy, exportovat data, smazat zakaznika
10. **API reference** — Endpointy pro CRM, marketing, analytics

### E5. Metriky uspechu (KPI)

| KPI | Cil (6 mesicu) | Jak merit |
|-----|----------------|-----------|
| Zakaznici v CRM | 500+ na aktivniho tenanta | Customer count |
| Abandoned cart recovery rate | 8-12% | (recovered / total abandoned) |
| Abandoned cart follow-up open rate | > 30% | Email tracking |
| Campaign open rate | > 25% | Email tracking |
| Campaign click rate | > 5% | UTM tracking |
| Customer lifetime value | +15% po zavedeni CRM | Before/after comparison |
| Segmentu na tenanta | prumer 3-5 | Segment count |
| Marketing campaigns/mesic | prumer 2-3 | Campaign count |
| GDPR compliance | 100% (0 poruch) | Audit log |
| Admin cas na CRM (weekly) | < 2 hodiny | Admin activity tracking |
| Email deliverability | > 95% | Provider stats |
| NPS CRM feature | > 45 | In-app survey |
