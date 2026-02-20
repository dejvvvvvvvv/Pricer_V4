# 21. Admin — Analytika — Detailni RoadMap Plan

> **Stav:** 🟡 40% hotovo | **Priorita:** NIZKA
> **Zavislosti na jine sekce:** Backend (#2) pro tracking, Supabase (#27) pro ukladani
> **Kdo na nem zavisi:** Dashboard (#15)

---

## Prehled

Analyticka stranka v admin panelu — overview, sessions, materials, conversions, export. UI je hotove, ale data jsou demo seed data.

**Hlavni soubor:** `src/pages/admin/AdminAnalytics.jsx`
**Storage:** `src/utils/adminAnalyticsStorage.js`

---

## Co je HOTOVO (✅)

### UI (75%)
- [x] 5 tabu: Overview, Sessions, Materials, Conversions, Export
- [x] CSV export
- [x] Rozsahle filtrovani podle data
- [x] Demo seed data

---

## Co CHYBI / je potreba dodelat

### Faze 1: Tracking events v kalkulacce (Priorita: STREDNI)

#### Ukol 1.1: Event tracking implementace
- **Co udelat:**
  - [ ] Definovat tracking events:
    - `calculator_opened` — zakaznik otevrel kalkulacku
    - `model_uploaded` — nahral model (format, velikost)
    - `configuration_changed` — zmenil material/kvalitu/infill
    - `slice_started` / `slice_completed` / `slice_failed`
    - `price_viewed` — zobrazil cenu
    - `checkout_started` — zacal checkout
    - `order_completed` — dokoncil objednavku
    - `coupon_applied` — pouzil kupon
  - [ ] Kazdy event obsahuje: timestamp, tenant_id, session_id, event_type, metadata
  - [ ] Ukladat do Supabase tabulky `analytics_events` (nebo localStorage pro zacatek)

#### Ukol 1.2: Session tracking
- **Co udelat:**
  - [ ] Generovat unikatni session ID pri otevreni kalkulacky
  - [ ] Tracking doby stravene v kalkulacce
  - [ ] Conversion funnel: kolik lidi doslo do kazdeho kroku

### Faze 2: Agregace a zobrazeni (Priorita: NIZKA)

#### Ukol 2.1: Napojit UI na realna data
- **Co udelat:**
  - [ ] Nahradit demo data realnyimi z tracking events
  - [ ] Overview tab: celkove statistiky
  - [ ] Sessions tab: seznam sessions s detaily
  - [ ] Materials tab: popularita materialu
  - [ ] Conversions tab: funnel analza

### Faze 3: Pokrocile (post-Beta)

#### Ukol 3.1: Realtime analytika
- **Co udelat:**
  - [ ] Supabase Realtime pro live data
  - [ ] Heatmapy kliknuti (integrace s Hotjar nebo custom)

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti |
|---|------|--------|------------|
| 1 | Faze 1: Tracking | 4-6h | Kalkulacka (#1) |
| 2 | Faze 2: Agregace | 3-5h | Faze 1, Supabase (#27) |
| 3 | Faze 3: Pokrocile | post-Beta | - |

**Celkem pro Beta:** ~4-6 hodin (jen Faze 1)

---

## Poznamky

- Pro Beta staci zakladni tracking events — neprehaneet
- Analytika je "nice to have" — firma muze pouzivat Google Analytics misto toho
- Demo data mohou zustat pro prezentacni ucely

---

## Kriticke doplnky (z review)

### Event schema (Supabase tabulka `analytics_events`)
- [ ] Schema:
  ```sql
  CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_analytics_tenant_time ON analytics_events(tenant_id, created_at);
  ```
- [ ] Event typy: `calculator_opened`, `model_uploaded`, `slice_completed`, `slice_failed`, `price_viewed`, `checkout_started`, `order_completed`, `coupon_applied`
- [ ] Metadata priklady:
  - `model_uploaded`: `{ format: 'stl', size_mb: 12.5, dimensions: '100x50x30mm' }`
  - `slice_completed`: `{ time_ms: 3200, material: 'PLA', layers: 150 }`
  - `order_completed`: `{ total: 525, currency: 'CZK', items: 3, payment: 'card' }`

### Conversion funnel
- [ ] 5 kroky: Open → Upload → Configure → View Price → Order
- [ ] Vypocet: % uzivatelu kteri presli z kroku N do kroku N+1
- [ ] Identifikace "dropoff bodu" — kde zakaznici odchazeji
- [ ] Casovy udaj: prumerna doba v kazdem kroku

### GDPR compliance
- [ ] Analytika nesmie ukladat PII (jmeno, email) bez souhlasu
- [ ] Session ID = anonymni UUID, ne cookie tracking
- [ ] Firma musi mit cookie banner s moznosti odmitnout analytiku
- [ ] Data retention: 12 mesicu, pak automaticke smazani
- [ ] Export dat: firma muze stahnout vsechna data (GDPR Art. 20)
