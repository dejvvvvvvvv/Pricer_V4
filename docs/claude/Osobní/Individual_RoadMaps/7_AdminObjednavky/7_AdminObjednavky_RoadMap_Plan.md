# 7. Admin — Objednavky (Orders) — Detailni RoadMap Plan

> **Stav:** 🟡 45% hotovo | **Priorita:** VYSOKA
> **Zavislosti na jine sekce:** Stripe (#8) pro platby, Emaily (#22) pro notifikace, Supabase (#27) pro databazi, Auth (#20) pro tenant
> **Kdo na nem zavisi:** Dashboard (#15), Model Storage (#14), Fakturace (#9)

---

## Prehled

Admin stranka pro spravu objednavek — seznam, Kanban board, detail objednavky. UI je z velke casti HOTOVE, ale data jsou v localStorage a chybi realny order processing (platba, emaily, backend zpracovani).

**Hlavni soubor:** `src/pages/admin/AdminOrders.jsx`
**Storage:** `src/utils/adminOrdersStorage.js`

---

## Co je HOTOVO (✅)

### Seznam a filtry (80%)
- [x] Zobrazeni vsech objednavek
- [x] Filtry podle statusu (nova, v tisku, odeslana atd.)
- [x] Filtry podle data
- [x] Vyhledavani
- [x] Paginace
- [x] Razeni

### Kanban board (75%)
- [x] 6 sloupcu (statusu): Nova, Potvrzena, V tisku, Hotovo, Odeslana, Dokoncena
- [x] Drag&drop mezi sloupci
- [x] Persist stavu do localStorage

### Order detail modal (70%)
- [x] 3 taby: Customer (zakaznik), Shipping (doprava), Items (polozky)
- [x] Zobrazeni vsech informaci o objednavce
- [x] Zmena statusu
- [x] Poznamky k objednavce
- [x] Audit log (historie zmen)

### Status management (70%)
- [x] Zmena statusu s potvrzenim
- [x] Poznamky pri zmene statusu
- [x] Audit log

---

## Co CHYBI / je potreba dodelat

### Faze 1: Supabase jako datovy zdroj (Priorita: VYSOKA)

#### Ukol 1.1: Presun dat z localStorage do Supabase
- **Aktualni stav:** Objednavky v localStorage pod `modelpricer:{tenantId}:orders:v1`
- **Cilovy stav:** Objednavky v Supabase tabulkach `orders` + `order_items`
- **Co udelat:**
  - [ ] Pouzit existujici StorageAdapter pro cteni/zapis objednavek
  - [ ] Upravit `adminOrdersStorage.js` aby pouzival async API (readTenantJsonAsync/writeTenantJsonAsync)
  - [ ] Prepnout feature flag pro namespace `orders` na `supabase` nebo `dual-write`
  - [ ] Otestovat ze CRUD funguje s Supabase
- **Zavislost:** Supabase propojeni (#27)
- **Poznamka:** Schema `orders` a `order_items` uz existuje v `supabase/schema.sql`

#### Ukol 1.2: Objednavkova cisla
- **Co udelat:**
  - [ ] Generovani unikatnich cisel objednavek (napr. ORD-2026-00001)
  - [ ] Sekvencni cislovani per-tenant
  - [ ] Cislo = variabilni symbol pro platbu (viz #9)

### Faze 2: Realny order processing pipeline (Priorita: VYSOKA)

#### Ukol 2.1: Vytvoreni objednavky z kalkulacky
- **Flow:**
  1. Zakaznik v kalkulacce klikne "Objednat"
  2. Backend endpoint `POST /api/orders` prijme data:
     - Polozky (modely s parametry a cenami)
     - Kontaktni udaje zakaznika
     - Vybrana doprava
     - Express tier
     - Kupon
     - Celkova cena (vypoctena pricing enginem)
  3. Backend OVERENI ceny (prepocita pricing enginem — zabrana manipulace z frontendu)
  4. Ulozeni do Supabase (`orders` + `order_items`)
  5. Vraceni `order_id` a `order_number`
- **Co udelat:**
  - [ ] Backend endpoint `POST /api/orders`
  - [ ] Validace vstupnich dat
  - [ ] Prepocet ceny na backendu (bezpecnost!)
  - [ ] Ulozeni do Supabase
  - [ ] Response s order_id

#### Ukol 2.2: Status workflow
- **Stavy objednavky:**
  ```
  pending → confirmed → printing → printed → shipped → delivered → completed
                ↓                      ↓
             cancelled              returned
  ```
- **Trigger pri zmene statusu:**
  - `pending → confirmed` → Email zakaznikovi "Objednavka potvrzena"
  - `confirmed → printing` → (interni)
  - `printing → printed` → (interni)
  - `printed → shipped` → Email zakaznikovi "Objednavka odeslana" + tracking
  - `shipped → delivered` → Email "Doruceno"
  - Zruseni → Email "Objednavka zrusena"
- **Zavislost:** Emaily (#22)

#### Ukol 2.3: Model a G-code ukladani
- **Co udelat:**
  - [ ] Po vytvoreni objednavky: ulozit nahrany 3D model do Supabase Storage (bucket `models`)
  - [ ] Po slicovani: ulozit G-code do Supabase Storage (bucket `documents`)
  - [ ] Propojit soubory s objednavkou (tabulka `order_files` nebo metadata)
  - [ ] V Order detail modalu: moznost stahnout model/G-code
- **Zavislost:** Model Storage (#14), Supabase Storage (#27)

### Faze 3: Platebni napojeni (Priorita: VYSOKA)

#### Ukol 3.1: Stripe payment status v objednavce
- **Co udelat:**
  - [ ] Objednavka obsahuje `payment_intent_id` z Stripe
  - [ ] Status platby se aktualizuje pres webhook (#8.3)
  - [ ] Zobrazeni stavu platby v Order detail modalu
  - [ ] Barevna indikace: zelena (zaplaceno), zluta (ceka se), cervena (selhalo)
- **Zavislost:** Stripe (#8)

#### Ukol 3.2: Bankovni prevod status
- **Co udelat:**
  - [ ] Objednavka s platbou prevodem → status "Ceka na platbu"
  - [ ] Rucni potvrzeni firmy ze platba dosla → zmena statusu
  - [ ] Tlacitko "Oznacit jako zaplaceno" v Order detail modalu

### Faze 4: Supabase Realtime (Priorita: NIZKA)

#### Ukol 4.1: Live aktualizace
- **Co udelat:**
  - [ ] Aktivovat `useSupabaseRealtime` pro tabulku `orders`
  - [ ] Admin vidi novou objednavku bez refreshe
  - [ ] Zvukova notifikace pri nove objednavce (volitelne)
- **Zavislost:** Supabase Realtime (#27.4)

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 1: Supabase data | 4-6h | Supabase (#27) | VYSOKA |
| 2 | Faze 2: Order processing | 8-12h | Auth (#20), Backend | VYSOKA |
| 3 | Faze 3: Platebni napojeni | 3-5h | Stripe (#8) | VYSOKA |
| 4 | Faze 4: Realtime | 2-3h | Supabase Realtime | NIZKA |

**Celkem pro Beta:** ~17-26 hodin

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Cena manipulovana z frontendu | Vysoka (ted) | Kriticky | Backend prepocet ceny (Faze 2) |
| Objednavka se ztrati | Stredni | Kriticky | Dual-write (localStorage + Supabase) |
| Status workflow prilis komplexni | Nizka | Nizky | Zjednodusit pro Beta |

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/admin/AdminOrders.jsx` | Supabase data, platby | Stredni |
| `src/utils/adminOrdersStorage.js` | Async API | Stredni |
| `backend-local/routes/orders.js` | NOVY — order endpoints | Velky |
| `backend-local/services/orderProcessing.js` | NOVY — order pipeline | Velky |

---

## Poznamky

- **KRITICKE:** Backend MUSI prepocitat cenu — nikdy neverit frontendu s cenami!
- **DULEZITE:** Objednavkove cisla musi byt unikatni a sekvencni per-tenant
- **TIP:** Pro Beta muze byt jednoduchy flow: objednavka → email → firma zpracuje rucne
- Kanban board je skvely pro UX — firma vidi stav vsech objednavek na jednom miste

---

## Kriticke doplnky (z review)

> Nasledujici sekce KD1-KD8 doplnuji mezery identifikovane pri review puvodni dokumentace.
> Kazda sekce je specificka, implementacne pripravena a odkazuje na existujici schema/kod.

---

### KD1: Detailni datove schema — orders vs order_items

> **Problem:** Puvodni plan odkazuje na Supabase tabulky `orders` + `order_items`, ale nespecifikuje jake konkretni pole jsou v kazde tabulce, jake jsou jejich typy, a co presne obsahuji JSONB snapshot sloupce. Bez tohoto se developer musi hrat detektiva v `supabase/schema.sql`.

#### Tabulka `orders` — pole a jejich ucel

| Sloupec | Typ | Popis | Priklady hodnot |
|---------|-----|-------|-----------------|
| `id` | UUID (PK) | Interni identifikator | `a1b2c3d4-...` |
| `tenant_id` | UUID (FK → tenants) | Vlastnik objednavky | Vazba na multi-tenancy |
| `order_number` | TEXT (UNIQUE per tenant) | Lidsky citelne cislo | `ORD-2026-00142` |
| `status` | TEXT | Aktualni stav objednavky | `NEW`, `REVIEW`, `APPROVED`, `PRINTING`, `POSTPROCESS`, `READY`, `SHIPPED`, `DONE`, `CANCELED` |
| `customer_id` | UUID (FK → customers, nullable) | Vazba na registrovaneho zakaznika | NULL pro anonymni objednavky |
| `customer_snapshot` | JSONB | Snapshot zakaznika v dobe objednani | `{ "name": "Jan Novak", "email": "...", "phone": "...", "company": "..." }` |
| `one_time_fees` | JSONB (array) | Jednorazove poplatky na urovni objednavky | `[{ "key": "setup", "label": "Setup fee", "amount": 50 }]` |
| `totals_snapshot` | JSONB | Agregovane castky | `{ "subtotal_models": 850, "one_time_fees_total": 50, "shipping_total": 99, "min_order_delta": 0, "rounding_delta": 0.50, "total": 999.50 }` |
| `flags` | TEXT[] | Order-level flagy | `['OUT_OF_BOUNDS', 'MISSING_SLICER_DATA']` |
| `notes` | JSONB (array) | Interni poznamky admina | `[{ "id": "n-1", "timestamp": "...", "user_id": "admin", "text": "Zakaznik volal" }]` |
| `metadata` | JSONB | Rozsiritelna metadata | `{ "source": "widget", "widget_id": "w-123", "coupon_code": "SLEVA10", "payment_method": "stripe", "payment_intent_id": "pi_xxx", "shipping_method_id": "ppl", "express_tier_id": null, "tracking_number": null, "estimated_completion": "2026-02-20T12:00:00Z" }` |
| `created_at` | TIMESTAMPTZ | Cas vytvoreni | Auto |
| `updated_at` | TIMESTAMPTZ | Cas posledni zmeny | Auto (trigger) |

**Poznamka k `metadata`:** Toto je "catch-all" pole pro data specificka pro integraci. Klice v metadata NEMAJI byt duplikovany v hlavnich sloupcich. Pokud se pole pouziva v queries/filtrech casto, presune se do vlastniho sloupce (napr. `payment_status` by mel byt vlastni sloupec az v produkci).

#### Tabulka `order_items` — pole a jejich ucel

| Sloupec | Typ | Popis | Priklady hodnot |
|---------|-----|-------|-----------------|
| `id` | UUID (PK) | Interni identifikator polozky | `e5f6g7h8-...` |
| `order_id` | UUID (FK → orders, CASCADE) | Rodicovska objednavka | Vazba |
| `tenant_id` | UUID (FK → tenants, CASCADE) | Pro RLS | Redundantni, ale nutne pro RLS policies |
| `item_number` | TEXT (nullable) | Pozicni cislo v ramci objednavky | `"1"`, `"2"`, `"3"` |
| `quantity` | INTEGER | Pocet kusu tohoto modelu | `3` |
| `file_snapshot` | JSONB | Snapshot souboru v dobe objednani | `{ "storage_path": "tenant-x/orders/ORD-123/benchy.stl", "filename": "benchy.stl", "size": 284000, "uploaded_at": "..." }` |
| `material_snapshot` | JSONB | Snapshot materialu | `{ "material_id": "pla", "name": "PLA", "price_per_gram_snapshot": 3.9 }` |
| `color_snapshot` | TEXT | Zvolena barva | `"Black"` |
| `preset_snapshot` | JSONB | Snapshot presetu (kvalita tisku) | `{ "preset_id": "preset_standard", "name": "Standard", "version": 1 }` |
| `resolved_config_snapshot` | JSONB | Vyreslitovane parametry (vrstva, infill, ...) | `{ "resolved_values": { "layer_height": 0.2, "fill_density": 18, ... }, "resolved_meta": { ... }, "validation_result": { "ok": true, "errors": [] } }` |
| `slicer_snapshot` | JSONB | Vysledky sliceru (cas, vaha, rozmery) | `{ "time_min": 145, "weight_g": 32.5, "dimensions_xyz": { "x": 60, "y": 45, "z": 48 }, "used_filament_mm": 10800 }` |
| `pricing_snapshot` | JSONB | Snapshot cenove konfigurace | `{ "rate_per_hour": 150 }` |
| `price_breakdown_snapshot` | JSONB | Detailni rozklad ceny 1 kusu | `{ "material_cost": 126.75, "time_cost": 362.50, "fees": [...], "fees_total": 25, "model_subtotal": 514.25, "model_total": 514.25 }` |
| `flags` | TEXT[] | Item-level flagy | `['OUT_OF_BOUNDS']` |
| `revisions` | JSONB | Historie revizi ceny a sliceru | `{ "price": [{ "id": "p0", "created_at": "...", "reason": "initial", ... }], "slicer": [...] }` |
| `created_at` | TIMESTAMPTZ | Cas vytvoreni | Auto |
| `updated_at` | TIMESTAMPTZ | Cas posledni zmeny | Auto (trigger) |

#### Tabulka `order_activity` — audit trail

| Sloupec | Typ | Popis | Priklady hodnot |
|---------|-----|-------|-----------------|
| `id` | UUID (PK) | Identifikator zaznamu | Auto |
| `tenant_id` | UUID (FK) | Pro RLS | Vazba |
| `order_id` | UUID (FK → orders, CASCADE) | K jake objednavce | Vazba |
| `user_id` | TEXT | Kdo provedl akci | `"admin"`, `"system"`, `"webhook"` |
| `type` | TEXT | Typ aktivity | `CREATED`, `STATUS_CHANGE`, `NOTE_ADDED`, `REPRICE`, `RESLICE`, `PAYMENT_RECEIVED`, `TRACKING_ADDED`, `FILE_UPLOADED`, `MESSAGE_SENT` |
| `payload` | JSONB | Detailni data akce | `{ "from": "NEW", "to": "APPROVED" }` |
| `created_at` | TIMESTAMPTZ | Cas akce | Auto |

**Dulezite:** Tabulka `order_activity` je append-only log. Zaznamy se NIKDY nemazi ani needituj. Toto je audit trail pro compliance a debugging.

#### Vztah mezi frontend statusy a DB statusy

Aktualni frontend (`adminOrdersStorage.js`) pouziva jinou sadu statusu nez puvodni plan. Je treba se rozhodnout ktera sada je autoritativni:

| Frontend (adminOrdersStorage.js) | Puvodni plan (Faze 2.2) | Doporuceni |
|----------------------------------|-------------------------|------------|
| `NEW` | `pending` | Pouzit `NEW` (uz v UI) |
| `REVIEW` | - | Zachovat (doplneno pro 3D tisk) |
| `APPROVED` | `confirmed` | Pouzit `APPROVED` (semanticky presnejsi) |
| `PRINTING` | `printing` | Shodne |
| `POSTPROCESS` | `printed` | Pouzit `POSTPROCESS` (lepsi popis) |
| `READY` | - | Zachovat (baleni/expedice) |
| `SHIPPED` | `shipped` | Shodne |
| `DONE` | `delivered`/`completed` | Sjednotit na `DONE` |
| `CANCELED` | `cancelled` | Sjednotit na `CANCELED` |
| - | `returned` | Pridat `RETURNED` do budouci verze |

**Doporuceni:** Pouzit sadu z `adminOrdersStorage.js` (uz funguje v UI), rozsirit o `RETURNED` pozdeji.

---

### KD2: Algoritmus generovani objednavkovych cisel

> **Problem:** Ukol 1.2 rika "generuj unikatni cisla per-tenant" ale nespecifikuje presny algoritmus, format, atomicitu ani co se stane pri race conditions.

#### Format cisla objednavky

```
ORD-{ROK}-{SEKVENCNI_CISLO}
```

- **Prefix:** `ORD` (pevny, identifikuje typ dokumentu)
- **Rok:** 4 cislice, rok vytvoreni objednavky
- **Sekvencni cislo:** 5 cislic s nulami, resetuje se kazdy rok
- **Priklady:** `ORD-2026-00001`, `ORD-2026-00142`, `ORD-2027-00001`

#### Numericke cislo pro variabilni symbol

Variabilni symbol (VS) pro bankovni prevody musi byt ciste numericke (ceske banky nepodporuji pismena):

```
VS = {ROK_2CISLICE}{SEKVENCNI_CISLO_6CISLIC}
```

- **Priklad:** Objednavka `ORD-2026-00142` → VS `2600000142`
- **Max delka VS:** 10 cislic (omezeni ceskych bank)
- **Mapovani:** Vzdy odvoditelne z `order_number` (deterministicka konverze)

#### Implementace v Supabase (atomicke generovani)

```sql
-- Sekvence per-tenant per-rok
CREATE TABLE IF NOT EXISTS order_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  UNIQUE(tenant_id, year)
);

-- Funkce pro atomicke generovani dalsiho cisla
CREATE OR REPLACE FUNCTION next_order_number(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM now());
  v_next INTEGER;
BEGIN
  INSERT INTO order_sequences (tenant_id, year, last_number)
  VALUES (p_tenant_id, v_year, 1)
  ON CONFLICT (tenant_id, year)
  DO UPDATE SET last_number = order_sequences.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'ORD-' || v_year || '-' || LPAD(v_next::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
```

#### Backend service implementace

```javascript
// backend-local/services/orderNumberService.js
import { supabase } from '../lib/supabase.js';

/**
 * Generuje dalsi objednavkove cislo pro tenant.
 * Atomicke — bezpecne pri concurrent requestech.
 * @param {string} tenantId - UUID tenanta
 * @returns {Promise<{orderNumber: string, variableSymbol: string}>}
 */
export async function generateOrderNumber(tenantId) {
  const { data, error } = await supabase
    .rpc('next_order_number', { p_tenant_id: tenantId });

  if (error) {
    throw { code: 'MP_ORDER_NUMBER_FAILED', message: `Failed to generate order number: ${error.message}` };
  }

  const orderNumber = data; // "ORD-2026-00142"
  const parts = orderNumber.match(/ORD-(\d{4})-(\d{5})/);
  const yearShort = parts[1].slice(-2);         // "26"
  const seqPadded = parts[2].padStart(6, '0');  // "000142"
  const variableSymbol = `${yearShort}${seqPadded}`; // "2600000142" — 8 cislic

  return { orderNumber, variableSymbol };
}
```

#### Edge cases

| Situace | Reseni |
|---------|--------|
| Prvni objednavka roku | `INSERT ON CONFLICT` vytvori novy radek s `last_number = 1` |
| 2 objednavky soucasne | PostgreSQL row lock v `ON CONFLICT DO UPDATE` zajistuje atomicitu |
| 99999 objednavek za rok | Nepravdepodobne pro 3D tisk SaaS. Pokud nastane, rozsir na 6 cislic. |
| Smazana objednavka | Cislo se NEUVOLNI. Smazane cislo zustane "obsazene" (audit trail) |
| Tenant migrace | Sekvence zustava per-tenant, nelze presunout |

---

### KD3: Notifikacni flow diagram — status → email mapping

> **Problem:** Ukol 2.2 jen vypisuje triggery, ale chybi jasna matice kdo dostane jaky email, jake data email obsahuje, a jake jsou fallbacky kdyz email provider neni nakonfigurovany.

#### Kompletni notifikacni matice

| Prechod statusu | Email zakaznikovi | Email adminovi | Email template ID | Povinne data v emailu | Priorita |
|-----------------|-------------------|----------------|--------------------|-----------------------|----------|
| `→ NEW` (vytvoreni) | Potvrzeni objednavky | Notifikace o nove objednavce | `order_confirmed` | order_number, polozky s cenami, celkova castka, platebni info (VS + cislo uctu pokud bank transfer) | P0 |
| `NEW → REVIEW` | - | - | - | - | - |
| `REVIEW → APPROVED` | Objednavka schvalena | - | `order_approved` | order_number, odhadovany cas dokonceni | P1 |
| `APPROVED → PRINTING` | Zacatek tisku (volitelne) | - | `order_printing` | order_number, odhadovany cas | P2 |
| `PRINTING → POSTPROCESS` | - | - | - | - | - |
| `POSTPROCESS → READY` | Pripraveno k vyzvednuti/odeslani | - | `order_ready` | order_number, zpusob doruceni | P1 |
| `READY → SHIPPED` | Odeslano + tracking | - | `order_shipped` | order_number, prepravce, tracking_number, tracking_url | P0 |
| `SHIPPED → DONE` | Doruceno (volitelne) | - | `order_delivered` | order_number, odkaz na zpetnou vazbu | P2 |
| `* → CANCELED` | Zruseni objednavky | - | `order_canceled` | order_number, duvod zruseni (pokud uveden), info o vraceni platby | P0 |
| Platba prijata (webhook) | Platba potvrzena | - | `payment_received` | order_number, castka, metoda platby | P0 |
| Platba selhala (webhook) | Platba selhala | - | `payment_failed` | order_number, duvod, odkaz na opakovani platby | P0 |
| Admin posle custom zpravu | Custom zprava | - | `custom_message` | order_number + freeform text od admina | P1 |

#### Vizualni flow

```
ZAKAZNIK OBJEDNA
       |
       v
   [NEW] ──── Email: order_confirmed (zakaznik)
       |       Email: new_order_notification (admin)
       v
  [REVIEW] ── (zadny email, interni krok)
       |
       v
 [APPROVED] ── Email: order_approved (zakaznik, volitelne)
       |
       v
 [PRINTING] ── Email: order_printing (zakaznik, volitelne)
       |
       v
[POSTPROCESS] ── (zadny email)
       |
       v
   [READY] ──── Email: order_ready (zakaznik)
       |
       v
  [SHIPPED] ── Email: order_shipped + tracking (zakaznik)
       |
       v
   [DONE] ──── Email: order_delivered (zakaznik, volitelne)


   Z LIBOVOLNEHO STAVU:
   [*] → [CANCELED] ── Email: order_canceled (zakaznik)
```

#### Konfigurace per-tenant

Firma si v Admin > Emaily (#22) muze nastavit ktere emaily chce odesilat a ktere ne:

```json
{
  "email_triggers": {
    "order_confirmed": { "enabled": true, "required": true },
    "order_approved": { "enabled": true, "required": false },
    "order_printing": { "enabled": false, "required": false },
    "order_ready": { "enabled": true, "required": false },
    "order_shipped": { "enabled": true, "required": true },
    "order_delivered": { "enabled": false, "required": false },
    "order_canceled": { "enabled": true, "required": true },
    "payment_received": { "enabled": true, "required": true },
    "payment_failed": { "enabled": true, "required": true },
    "new_order_admin": { "enabled": true, "required": false },
    "custom_message": { "enabled": true, "required": false }
  }
}
```

- `required: true` — nelze vypnout (zakonny pozadavek na potvrzeni objednavky)
- `required: false` — firma si muze vypnout

#### Fallback kdyz email provider neni nakonfigurovany

1. Objednavka se VZDY ulozi (email neni bloker pro vytvoreni objednavky)
2. Pokud neni provider nastaven → zapise se `order_activity` zaznam s `type: 'EMAIL_SKIPPED'` a `payload: { reason: 'no_provider', template: 'order_confirmed' }`
3. V Admin UI se zobrazi varovani: "Email notifikace nejsou nakonfigurovany. Zakaznici nedostavaji automaticke emaily."
4. Firma muze emaily doplnit kdykoli pozdeji (Emaily #22)

---

### KD4: Kanban state machine — povolene prechody statusu

> **Problem:** Aktualni implementace v `AdminOrders.jsx` povoluje drag&drop mezi JAKYMIKOLI sloupci. To znamena ze firma muze omylem presunout objednavku z `DONE` zpet do `NEW`, nebo z `CANCELED` do `PRINTING`. Je treba definovat povolene prechody a validovat je.

#### Matice povolenych prechodu

```
FROM \ TO       NEW  REVIEW  APPROVED  PRINTING  POSTPROCESS  READY  SHIPPED  DONE  CANCELED
NEW              -    YES      -         -          -           -       -        -      YES
REVIEW           -     -      YES        -          -           -       -        -      YES
APPROVED         -     -       -        YES         -           -       -        -      YES
PRINTING         -     -       -         -         YES          -       -        -      YES
POSTPROCESS      -     -       -         -          -          YES      -        -      YES
READY            -     -       -         -          -           -      YES       -      YES
SHIPPED          -     -       -         -          -           -       -       YES      -
DONE             -     -       -         -          -           -       -        -       -
CANCELED         -     -       -         -          -           -       -        -       -
```

**Pravidla:**
- **Linearni flow:** Kazdy status muze prejit JEN do nasledujiciho (sekvencne)
- **Zruseni:** Z jakehokoliv stavu krome `SHIPPED` a `DONE` lze zrusit (`CANCELED`)
- **Terminalni stavy:** `DONE` a `CANCELED` jsou konecne — z nich nelze prejit nikam
- **Zpetny krok:** Zakazan (pokud firma chce "vratit" objednavku, musi vytvorit novou)
- **Budouci rozsireni:** `RETURNED` bude dosazitelny z `SHIPPED` a `DONE`

#### Implementace validatoru

```javascript
// src/utils/orderStatusMachine.js (NOVY soubor)

export const STATUS_TRANSITIONS = {
  NEW:         ['REVIEW', 'CANCELED'],
  REVIEW:      ['APPROVED', 'CANCELED'],
  APPROVED:    ['PRINTING', 'CANCELED'],
  PRINTING:    ['POSTPROCESS', 'CANCELED'],
  POSTPROCESS: ['READY', 'CANCELED'],
  READY:       ['SHIPPED', 'CANCELED'],
  SHIPPED:     ['DONE'],
  DONE:        [],
  CANCELED:    [],
};

/**
 * Overi zda je prechod z jednoho statusu do druheho povoleny.
 * @param {string} from - Aktualni status
 * @param {string} to - Cilovy status
 * @returns {boolean}
 */
export function isTransitionAllowed(from, to) {
  const allowed = STATUS_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/**
 * Vrati seznam povolenych cilovych statusu z aktualniho stavu.
 * @param {string} currentStatus
 * @returns {string[]}
 */
export function getAllowedTransitions(currentStatus) {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Zjisti zda je status terminalni (konecny).
 * @param {string} status
 * @returns {boolean}
 */
export function isTerminalStatus(status) {
  return status === 'DONE' || status === 'CANCELED';
}
```

#### Zmeny v UI

1. **Kanban drag&drop:** Pri `onStatusChange` v `AdminOrders.jsx` volat `isTransitionAllowed(oldStatus, newStatus)`. Pokud `false`, zobrazit toast "Nelze presunout z {from} do {to}" a zamitnout drop.
2. **Status dropdown v detailu:** Zobrazit jen `getAllowedTransitions(currentStatus)` misto vsech statusu.
3. **Vizualni indikace:** Neplatne cilove sloupce v Kanbanu sedive/disabled pri dragování.
4. **Admin override:** Volitelny toggle "Force status change" pro edge cases (s potvrzovacim dialogem a audit log zaznamem `type: 'FORCE_STATUS_CHANGE'`).

---

### KD5: Export objednavek — CSV a PDF pro ucetnictvi

> **Problem:** Aktualni `exportCsv()` v `AdminOrders.jsx` je zakladni, chybi PDF export, detailni breakdown per-item, a formaty uzitecne pro ucetnictvi.

#### CSV export — rozsirene pole

Aktualni CSV exportuje jen zakladni info. Rozsirit o:

```
order_id, order_number, created_at, status, customer_name, customer_email,
customer_phone, customer_company, shipping_street, shipping_city, shipping_zip,
shipping_country, models_count, total_pieces, materials, presets,
total_print_time_min, total_weight_g, subtotal_models, one_time_fees_total,
shipping_total, min_order_delta, rounding_delta, total_price, currency,
payment_method, payment_status, variable_symbol, flags, tracking_number
```

#### CSV export per-item (druhy format)

Pro detailni ucetnictvi — jeden radek na polozku (model):

```
order_number, item_number, filename, material, color, preset, quantity,
time_min, weight_g, dimensions_xyz, material_cost, time_cost, fees_total,
model_total_per_piece, model_total_qty, flags
```

#### PDF export — fakturacni souhrn

- **Knihovna:** `jsPDF` nebo `@react-pdf/renderer` (frontendovy rendering)
- **Obsah PDF:**
  - Hlavicka: logo firmy (z branding storage), nazev firmy, fakturacni udaje
  - Cislo objednavky, datum, zakaznik
  - Tabulka polozek s cenami
  - Souhrn: subtotal, fees, shipping, total
  - Platebni udaje (VS, cislo uctu) — pokud bank transfer
- **Poznamka:** Toto NENI faktura (daňový doklad). Je to "potvrzeni objednavky" / "proforma". Pro fakturu firma pouziva vlastni ERP/ucetni system.

#### UI integrace

V `AdminOrders.jsx` rozsirit exportni tlacitko o dropdown:

```
[Export ▼]
  ├── CSV — Souhrn objednavek
  ├── CSV — Detail polozek
  ├── PDF — Potvrzeni objednavky (jednotliva)
  └── PDF — Soupis objednavek (hromadne, zvoleny rozsah)
```

#### Soubory ke zmene

| Soubor | Zmena |
|--------|-------|
| `src/pages/admin/AdminOrders.jsx` | Rozsirent export dropdown, novy `exportDetailCsv()` |
| `src/utils/orderExportService.js` | NOVY — funkce pro CSV/PDF generovani |
| `package.json` | Pridat `jspdf` dependency (pokud PDF) |

---

### KD6: Print queue management — prioritni razeni

> **Problem:** Firma s vice tiskovymi zakazkami potrebuje videt co tisknout jako dalsi. Aktualni radeni je jen "newest first" — chybi priorita, odhadovany cas a razeni podle deadline.

#### Koncept tiskovych slotu

Kazda objednavka v statusu `APPROVED` nebo `PRINTING` je soucasti tisknove fronty:

```
PRINT QUEUE (razeno podle priority):
  1. ORD-2026-00089 — Express (24h) — deadline za 6h — PLA, 2h15m
  2. ORD-2026-00142 — Standard — FIFO pozice 1 — PETG, 4h30m
  3. ORD-2026-00138 — Standard — FIFO pozice 2 — PLA, 1h45m
```

#### Prioritni algoritmus

```
Priorita = (base_priority * weight) + deadline_urgency + express_bonus

kde:
  base_priority = FIFO poradi (created_at)
  weight = 1 (default), 2 (VIP zakaznik), 0.5 (nizka priorita)
  deadline_urgency = max(0, 100 - (hours_until_deadline * 10))
  express_bonus = express_tier ? 500 : 0
```

Pro Beta staci jednodussi pristup:

1. **Express objednavky** vzdy navrchu
2. **Standardni** serazene podle `created_at` (FIFO)
3. **Rucni override:** Admin muze presunout objednavku nahoru/dolu v fronte

#### UI — nova zalozka "Print Queue"

Volitelna zalozka v `AdminOrders.jsx` vedle Table/Kanban:

```
[Table] [Kanban] [Print Queue]
```

Zobrazuje jen objednavky v `APPROVED` + `PRINTING`:
- Drag&drop pro rucni prerazeni
- Odhadovany cas tisku (sum `slicer_snapshot.time_min` vsech modelu)
- Kumulativni casova osa ("Hotovo cca v 18:30")
- Material seskupeni (kolik PLA, PETG, ABS je ve fronte)
- Varovani pokud nedostatek materialu (budouci napojeni na material inventory)

#### Datovy model

```json
// v metadata objednavky (orders.metadata)
{
  "queue_position": 3,
  "queue_priority": "standard",   // "express" | "standard" | "low"
  "queue_override": false,        // admin rucne preradil
  "estimated_start": "2026-02-18T14:00:00Z",
  "estimated_completion": "2026-02-18T18:30:00Z"
}
```

#### Priorita implementace

Toto je **P2** feature — pro Beta staci sortirovane FIFO v existujicim seznamu objednavek s filtrem na `APPROVED`/`PRINTING`. Plny print queue az po Beta.

---

### KD7: Komunikace se zakaznikem z order detailu

> **Problem:** Admin aktualne muze jen pridat interní poznamku. Chybi moznost poslat custom zpravu zakaznikovi primo z detailu objednavky — napr. "Vas model ma problem, prosim o upravu" nebo "Objednavka je ready k vyzvednuti dnes do 18h".

#### Flow

```
Admin v Order detail:
  1. Klikne "Poslat zpravu zakaznikovi"
  2. Otevre se modal/textarea s predvyplnenym:
     - Prijemce: zakaznik.email (z customer_snapshot)
     - Predmet: "Re: Vase objednavka #{order_number}"
     - Telo: freeform text
     - Volitelne: vyber sablony (predpripravene odpovedi)
  3. Klikne "Odeslat"
  4. Backend posle email pres nakonfigurovaneho providera (#22)
  5. Zprava se ulozi do:
     - order_activity (type: 'MESSAGE_SENT')
     - chat_messages tabulka (pro budouci in-app chat)
  6. V audit logu se zobrazi zaznam
```

#### Predpripravene sablony

```json
{
  "quick_replies": [
    {
      "id": "model_issue",
      "label": "Problem s modelem",
      "subject": "Problem s vasim 3D modelem — objednavka #{order_number}",
      "body": "Dobry den,\n\npri kontrole vaseho modelu jsme zjistili nasledujici problem:\n\n{ADMIN_DOPLNI}\n\nProsime o upravu a znovu nahrani. Odpovezte na tento email.\n\nS pozdravem,\n{company_name}"
    },
    {
      "id": "ready_pickup",
      "label": "Pripraveno k vyzvednuti",
      "subject": "Objednavka #{order_number} pripravena k vyzvednuti",
      "body": "Dobry den,\n\nvase objednavka #{order_number} je pripravena k osobnimu vyzvednuti.\n\nAdresa: {company_address}\nOtviraci doba: {opening_hours}\n\nS pozdravem,\n{company_name}"
    },
    {
      "id": "delay_notice",
      "label": "Zpozdeni objednavky",
      "subject": "Informace o zpozdeni objednavky #{order_number}",
      "body": "Dobry den,\n\nmrzas nas informovat ze vase objednavka #{order_number} bude dokoncena pozdeji nez puvodni odhad.\n\nNovy odhadovany termin: {ADMIN_DOPLNI}\nDuvod: {ADMIN_DOPLNI}\n\nOmlouvame se za komplikace.\n\nS pozdravem,\n{company_name}"
    }
  ]
}
```

#### Zmeny v UI

| Soubor | Zmena |
|--------|-------|
| `src/pages/admin/AdminOrders.jsx` (OrderDetail) | Pridat sekci "Komunikace se zakaznikem" s textarea, vyberem sablony, tlacitkem Odeslat |
| `src/pages/admin/components/orders/OrderDetailModal.jsx` | Pridat tab "Zpravy" |
| `backend-local/routes/orders.js` | Endpoint `POST /api/orders/:id/message` |
| `src/utils/adminOrdersStorage.js` | Helper pro quick_replies sablony |

#### Zavislost

Plna funkcionalita vyzaduje nakonfigurovany email provider (#22). Pred tim:
- UI muze existovat s varovnim "Email provider neni nastaven"
- Zpravy se ukladaji do `chat_messages` / `order_activity` i bez odeslani
- Admin muze zkopirovat text a rucne poslat email

---

### KD8: Data retention a archivacni politika

> **Problem:** SaaS pro 3D tisk bude hromadit data — objednavky, modely (STL soubory desitky MB), G-code (stovky MB), audit logy. Bez archivacni politiky databaze i storage porostou donekonecna.

#### Zakladni politika

| Typ dat | Aktivni | Archiv | Smazani | Poznamka |
|---------|---------|--------|---------|----------|
| Objednavky (orders + order_items) | 6 mesicu | 6-24 mesicu | Po 24 mesicich (volitelne) | GDPR: osobni udaje po zanikuti ucelu |
| Audit log (order_activity) | 12 mesicu | 12-36 mesicu | Po 36 mesicich | Zachovat pro compliance |
| 3D modely (STL/OBJ) | Do dokonceni objednavky | 3 mesice po DONE | Smazat po 3 mesicich | Velke soubory — nejvetsi storage cost |
| G-code | Do dokonceni objednavky | 1 mesic po DONE | Smazat po 1 mesici | Regenerovatelne ze STL + presetu |
| Chat/zpravy | 12 mesicu | 12-24 mesicu | Po 24 mesicich | GDPR relevantni |
| Customer data | Dokud ma objednavky | 24 mesicu po posledni objednavce | Po 24 mesicich bez aktivity | GDPR: pravo na vymazani |

#### Archivacni stavy objednavky

```
DONE/CANCELED (aktivni, < 6 mesicu)
       |
       v (automaticky po 6 mesicich)
  ARCHIVED (skryto z hlavniho seznamu, stale v DB)
       |
       v (po 24 mesicich, volitelne)
  PURGED (smazano z DB, metadata zachovana v anonymizovane podobe)
```

#### Implementace

1. **Archivace (P2):**
   - Novy status `ARCHIVED` v `ORDER_STATUSES`
   - Cron job / scheduled function: kazdy den najde DONE/CANCELED starsi nez 6 mesicu → presune do ARCHIVED
   - Archivovane objednavky se nezobrazuji v hlavnim seznamu (filtr `status != 'ARCHIVED'`)
   - Tlacitko "Zobrazit archivovane" (toggle)
   - STL soubory presunuty do cold storage (Supabase Storage tiering)

2. **GDPR compliance (P1 pro EU trh):**
   - Endpoint `DELETE /api/customers/:id/data` — anonymizace zakaznika
   - `customer_snapshot` se nahradi za `{ "name": "ANONYMIZOVANO", "email": "deleted@anonymized.local" }`
   - Skutecne soubory se smazou
   - Audit log zaznamy zustavaji (anonymizovane)

3. **Storage cleanup (P1):**
   - Backend job: pro objednavky starsi 3 mesicu v DONE/CANCELED smaz STL soubory ze Supabase Storage
   - Pred smazanim: kontrola ze model neni pouzivan jinou aktivni objednavkou
   - G-code: smaz po 1 mesici (regenerovatelny)
   - Zachovaj metadata v `file_snapshot` (filename, size, dimensions) i po smazani fyzickeho souboru

4. **Admin UI nastaveni:**
   - Nova sekce v AdminSettings nebo AdminIntegrations
   - Konfigurovatelne doby: `retention_active_months`, `retention_archive_months`, `file_retention_months`
   - Default hodnoty z tabulky vyse
   - Rucni tlacitko "Spustit archivaci ted"

#### Datovy model pro archivaci

Pridat do `orders.metadata`:

```json
{
  "archived_at": "2026-08-18T00:00:00Z",
  "archive_reason": "auto_retention",
  "files_purged_at": "2026-05-18T00:00:00Z",
  "gdpr_anonymized_at": null
}
```

#### Soubory ke zmene

| Soubor | Zmena |
|--------|-------|
| `src/utils/adminOrdersStorage.js` | Pridat `ARCHIVED` do `ORDER_STATUSES`, filter helper |
| `backend-local/services/archiveService.js` | NOVY — archivacni a cleanup logika |
| `backend-local/jobs/retentionJob.js` | NOVY — scheduled job pro automatickou archivaci |
| `src/pages/admin/AdminOrders.jsx` | Toggle "Zobrazit archivovane", vizualni odliseni |

#### Priorita

- **P1:** Storage cleanup (STL/G-code mazani) — primo ovlivnuje naklady na hosting
- **P2:** Archivace objednavek — UX zlepseni pro firmy s velkym objemem
- **P2:** GDPR anonymizace — povinne pred spustenim na EU trhu

---

## Aktualizovane implementacni poradi (vcetne doplnku)

| # | Faze / Doplnek | Hodiny | Zavislosti | Priorita |
|---|----------------|--------|------------|----------|
| 1 | Faze 1: Supabase data | 4-6h | Supabase (#27) | VYSOKA |
| 1b | KD2: Order number generator (SQL + service) | 2-3h | Supabase (#27) | VYSOKA |
| 2 | Faze 2: Order processing | 8-12h | Auth (#20), Backend | VYSOKA |
| 2b | KD4: Status machine validator | 2-3h | - | VYSOKA |
| 3 | Faze 3: Platebni napojeni | 3-5h | Stripe (#8) | VYSOKA |
| 3b | KD3: Notifikacni flow (config + triggery) | 3-4h | Emaily (#22) | VYSOKA |
| 4 | KD5: Export CSV rozsireny + PDF | 3-5h | jsPDF dependency | STREDNI |
| 5 | KD7: Komunikace se zakaznikem | 3-4h | Emaily (#22) | STREDNI |
| 6 | KD6: Print queue (zakladni FIFO) | 2-3h | - | NIZKA |
| 7 | Faze 4: Realtime | 2-3h | Supabase Realtime | NIZKA |
| 8 | KD8: Archivace + retention (storage cleanup) | 4-6h | Supabase Storage | NIZKA |

**Celkem vcetne doplnku:** ~36-54 hodin (vs puvodnich ~17-26h)

---

## Aktualizovana tabulka souboru ke zmene

| Soubor | Typ zmeny | Rozsah | Doplnek |
|--------|-----------|--------|---------|
| `src/pages/admin/AdminOrders.jsx` | Supabase data, platby, export, print queue, archivace | Velky | KD4, KD5, KD6, KD8 |
| `src/utils/adminOrdersStorage.js` | Async API, ARCHIVED status | Stredni | KD4, KD8 |
| `src/utils/orderStatusMachine.js` | NOVY — status prechody a validace | Maly | KD4 |
| `src/utils/orderExportService.js` | NOVY — CSV/PDF export funkce | Stredni | KD5 |
| `backend-local/routes/orders.js` | NOVY — order endpoints + message | Velky | KD3, KD7 |
| `backend-local/services/orderProcessing.js` | NOVY — order pipeline | Velky | - |
| `backend-local/services/orderNumberService.js` | NOVY — generovani cisel objednavek | Maly | KD2 |
| `backend-local/services/archiveService.js` | NOVY — archivace a cleanup | Stredni | KD8 |
| `backend-local/jobs/retentionJob.js` | NOVY — scheduled archivacni job | Maly | KD8 |
| `supabase/schema.sql` | Pridat `order_sequences` tabulku | Maly | KD2 |
| `supabase/migrations/add_order_sequences.sql` | NOVY — migrace pro sekvence | Maly | KD2 |

---

## Aktualizovana rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace | Doplnek |
|--------|-----------------|-------|----------|---------|
| Cena manipulovana z frontendu | Vysoka (ted) | Kriticky | Backend prepocet ceny (Faze 2) | - |
| Objednavka se ztrati | Stredni | Kriticky | Dual-write (localStorage + Supabase) | - |
| Status workflow prilis komplexni | Nizka | Nizky | Zjednodusit pro Beta | - |
| Race condition pri generovani order number | Stredni | Vysoky | PostgreSQL atomicke `ON CONFLICT DO UPDATE` | KD2 |
| Nepovoleny status prechod (drag&drop) | Vysoka (ted) | Stredni | Status machine validator | KD4 |
| Storage naklady rostou s poctem objednavek | Stredni | Stredni | Retention politika, STL cleanup po 3 mesicich | KD8 |
| GDPR poruseni — osobni udaje zakaznika bez retence | Stredni | Kriticky | Anonymizacni endpoint, konfigurovatelna retence | KD8 |
| Email provider neni nastaven pri prvni objednavce | Vysoka | Nizky | Graceful fallback — objednavka se ulozi, varovani v UI | KD3 |
| Admin posle spatnou zpravu zakaznikovi | Nizka | Stredni | Confirm dialog pred odeslanim, audit log | KD7 |
