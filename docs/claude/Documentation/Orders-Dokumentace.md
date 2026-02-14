# Orders — Dokumentace

> Admin system pro spravu objednavek vcetne checkout flow, order detail modalu a integrace s Model Storage.

---

## 1. Prehled

Orders system poskytuje:

- **Checkout flow** — 5-krokovy wizard v test-kalkulacce pro zakaznika
- **Admin Orders stranka** (`/admin/orders`) — seznam objednavek s filtry, razenim, paginaci
- **OrderDetailModal** — 70% overlay s 3 zalozkami (Customer, Shipping, Items + Files)
- **Kanban board** — vizualni workflow pro statusy objednavek
- **Storage integrace** — automaticke ukladani souboru na disk pri checkoutu

---

## 2. Data model

### 2.1 Order objekt (localStorage)

Objednavky se ukladaji v localStorage pres tenant-scoped helpery.

```javascript
{
  id: "ORD-202602131200-1234",       // Unikatni ID objednavky
  orderNumber: "000001",              // Cislo objednavky (padded)
  status: "NEW",                      // Stav (viz 2.2)
  createdAt: "2026-02-13T12:00:00Z",
  updatedAt: "2026-02-13T12:05:00Z",

  // Zakaznik
  customer: {
    firstName: "Jan",
    lastName: "Novak",
    email: "jan@example.com",
    phone: "+420 777 123 456",
    company: "3D Print s.r.o.",
    gdprConsent: true,
  },

  // Dodaci adresa
  shipping_address: {
    street: "Hlavni 123",
    city: "Praha",
    zip: "110 00",
    country: "CZ",
  },

  // Modely
  models: [
    {
      id: "model-1",
      filename: "benchy.stl",
      quantity: 2,
      material_snapshot: { id: "PLA", name: "PLA", price_per_gram_snapshot: 0.5 },
      config_snapshot: { infill: 20, layerHeight: 0.2, totalPrice: 186 },
      slicer_snapshot: {
        estimatedTimeSeconds: 2700,  // Cas tisku v sekundach
        filamentGrams: 12.5,          // Hmotnost filamentu v gramech
        slicerJobId: "job-abc123",
      },
      price_breakdown_snapshot: {
        model_total: 186.00,          // Cena z pricing engine
      },
    },
  ],

  // Fees (poplatky)
  fees: [ { label: "Express", amount: 50 } ],

  // Pricing snapshot
  pricing_snapshot: { /* zmrazena cenova konfigurace */ },

  // Storage (soubory na disku)
  storage: {
    orderFolderId: "550e8400-e29b-41d4-a716-446655440000",
    storagePath: "Orders/#000001__550e8400/",
    savedAt: "2026-02-13T12:00:00Z",
    fileManifest: [
      { type: "model", filename: "benchy.stl", sha256: "abc...", sizeBytes: 123456 },
      { type: "gcode", filename: "benchy.gcode", sha256: "def...", sizeBytes: 789000 },
    ],
    status: "complete",  // "complete" | "partial" | "failed" | "pending"
  },

  // Interni poznamky
  notes: "",
  activity: [
    { ts: "2026-02-13T12:00:00Z", type: "status_change", from: null, to: "NEW", by: "system" },
  ],
  flags: [],               // Varovanf: OUT_OF_BOUNDS, SLICER_FAILED, atd.
}
```

### 2.2 Order statusy

| Status | Popis | Barva |
|--------|-------|-------|
| `NEW` | Nova objednavka | blue |
| `REVIEW` | V revizi | gray |
| `APPROVED` | Schvalena | green |
| `PRINTING` | Tiskne se | blue |
| `POSTPROCESS` | Post-processing | gray |
| `READY` | Hotovo k odeslani | green |
| `SHIPPED` | Odeslano | green |
| `DONE` | Dokonceno | green |
| `CANCELED` | Zruseno | red |

### 2.3 Order flags

| Flag | Popis |
|------|-------|
| `OUT_OF_BOUNDS` | Model presahuje tiskovy objem |
| `SLICER_FAILED` | Slicovani selhalo |
| `MISSING_SLICER_DATA` | Chybi data ze sliceru |
| `INVALID_CONFIG` | Neplatna konfigurace |

---

## 3. Soubory a komponenty

### 3.1 Frontend

```
src/pages/admin/AdminOrders.jsx                    — Hlavni stranka (1489 radku)
src/pages/admin/components/orders/
  OrderDetailModal.jsx    — 70% overlay modal (3 zalozky)
  TabCustomer.jsx         — Zalozka Customer (kontakt, poznamky, aktivita)
  TabShipping.jsx         — Zalozka Shipping (adresa, formatovany stitek)
  TabItemsFiles.jsx       — Zalozka Items + Files (tabulka modelu, stazeni, ZIP)
  StorageStatusBadge.jsx  — Badge se stavem storage (Ready/Processing/Error)
src/pages/admin/components/kanban/
  KanbanBoard.jsx         — Kanban board pro vizualni workflow
```

### 3.2 Checkout

```
src/pages/test-kalkulacka/components/CheckoutForm.jsx  — Formular objednavky
```

### 3.3 Storage a utility

```
src/utils/adminOrdersStorage.js    — CRUD pro objednavky (localStorage)
src/utils/adminKanbanStorage.js    — Konfigurace kanban boardu
src/services/storageApi.js         — API klient pro /api/storage/*
```

---

## 4. Checkout flow

### 4.1 Kroky formulare

Checkout formular je soucasti 5-krokoveho wizardu v test-kalkulacce (krok 5):

1. **Upload modelu** — Nahrani STL/OBJ/3MF souboru
2. **Konfigurace** — Material, infill, layer height, pocet kusu
3. **Slicovani** — Backend PrusaSlicer vrati cas a material
4. **Rekapitulace** — Prehled ceny a parametru
5. **Checkout** — Osobni udaje, adresa, GDPR, odeslani

### 4.2 Pole formulare

**Osobni udaje:**
- Jmeno (povinne)
- Prijmeni (povinne)
- Email (povinne, validace formatu)
- Telefon (volitelne)
- Firma (volitelne)

**Dodaci adresa:**
- Ulice (povinne)
- Mesto (povinne)
- PSC (povinne)
- Stat (povinne, default CZ)

**Souhlas:**
- GDPR checkbox (povinne)
- Poznamka k objednavce (volitelne)

### 4.3 Storage pipeline pri odeslani

```
1. Validace formulare (zod schema)
2. Sestaveni order objektu
3. Generovani orderFolderId (crypto.randomUUID())
4. Zobrazeni "Ukladam objednavku..." spinner
5. POST /api/storage/orders:
   - orderData: order + pricing snapshot + model mapping
   - models[]: puvodni File objekty
   - modelMapping: [{ modelId, slicerJobId, presetId, originalFilename }]
6. Uspech → pripojit storage info k objednavce → ulozit do localStorage
7. Neuspech → ulozit objednavku BEZ souboru (storage.status = "failed")
```

Backend pri vytvareni order slozky:
- Kopiruje modely z multer tmp do `models/`
- Hleda G-code ve slicer workspace (`job-{id}/output/`) → kopiruje do `gcode/`
- Hleda preset INI → kopiruje do `presets/`
- Generuje SHA256 checksums pro kazdy soubor
- Zapisuje metadata soubory do `meta/`

---

## 5. OrderDetailModal

### 5.1 Design

- Sirka: 70% viewportu (min 600px, max 1100px)
- Overlay: `rgba(8,9,12,0.85)`
- Scroll: exponential ease-out (faktor 0.18) — stejny jako ForgeDialog
- Zavirani: klik na overlay, Escape, X tlacitko
- Design: Forge tokeny (--forge-bg-surface, --forge-border-default, atd.)

### 5.2 Zalozky

**Customer:**
- Kontaktni udaje (jmeno, email, telefon, firma)
- Copy-to-clipboard pro kazde pole
- Interni poznamky (textarea + Ulozit)
- Activity log (chronologicky seznam udalosti)

**Shipping:**
- Dodaci adresa (ulice, mesto, PSC, stat)
- Formatovany stitek pripraveny k tisku

**Items + Files:**
- Tabulka modelu: filename, material, pocet kusu, cas tisku, hmotnost, cena
- Per-model akce: Stahnout model / gcode / preset
- Storage status badge (Ready/Processing/Error)
- Akce: "Open folder" (naviguje do Model Storage), "Download all ZIP"
- Re-slice / Re-price tlacitka (simulovane)

### 5.3 Mapovani slicer dat

Slicer vraci metriky v tomto formatu:

| Pole v slicer_snapshot | Popis | Jednotka |
|------------------------|-------|----------|
| `estimatedTimeSeconds` | Cas tisku | sekundy |
| `filamentGrams` | Hmotnost filamentu | gramy |
| `filamentMm` | Delka filamentu | milimetry |

V UI se sekundy konvertuji na minuty: `Math.round(estimatedTimeSeconds / 60)`.

Fallback pole pro zpetnou kompatibilitu: `time_min`, `weight_g`.

---

## 6. Admin Orders stranka

### 6.1 OrdersList

- Tabulka s filtry: status, material, preset, hledani
- Razeni: datum, cislo, zakaznik, celkova cena
- Paginace: 15 objednavek na stranku
- Sloupec "Storage" — ikona stavu (zelena = Ready, zluta = Processing, cervena = Error)
- Klik na radek = otevre OrderDetailModal

### 6.2 Kanban Board

- Alternativni zobrazeni objednavek jako kanban
- Sloupce = statusy (NEW, REVIEW, APPROVED, atd.)
- Drag & drop mezi sloupci meni status
- Konfigurace sloupcu v `adminKanbanStorage.js`

---

## 7. Integrace s Model Storage

### 7.1 Orders → Model Storage

V OrderDetailModal (zalozka Items + Files):
- Tlacitko "Open folder" naviguje na `/admin/model-storage?path={storagePath}`
- Tlacitko "Download all ZIP" vola POST /api/storage/zip s cestou order slozky

### 7.2 Model Storage → Orders

V Model Storage pri prochazeni Orders slozky:
- Kazda objednavka ma vlastni slozku `#000001__abc12345/`
- Uvnitr: `models/`, `gcode/`, `presets/`, `meta/`

### 7.3 Storage status v OrdersList

| Status | Ikona | Vyznam |
|--------|-------|--------|
| `complete` | Zelena fajfka | Vsechny soubory ulozeny |
| `partial` | Zluta hodiny | Nektery soubor chybi (napr. gcode) |
| `failed` | Cerveny krizek | Ukladani selhalo (backend nefungoval) |
| `pending` | Seda tecka | Ceka na ulozeni |

---

## 8. Spusteni a predpoklady

### 8.1 Frontend

```bash
npm run dev    # spusti Vite na portu 4028
```

### 8.2 Backend (nutny pro storage)

```bash
cd backend-local
npm install
node src/index.js    # spusti na portu 3001
```

### 8.3 Slicer (pro G-code)

PrusaSlicer musi byt nakonfigurovany a slicer workspace musi existovat na:
- Windows: `C:\modelpricer\tmp`
- Linux: `/tmp/modelpricer`

Pokud slicer neni dostupny, objednavka se ulozi bez G-code souboru (status: `partial`).

---

## 9. Preklady (i18n)

Nove klice v `LanguageContext.jsx`:

### CZ
```
admin.storage.title = "Model Storage"
admin.storage.company_library = "Firemni knihovna"
admin.storage.trash = "Kos"
admin.storage.open_folder = "Otevrit slozku"
admin.storage.download_zip = "Stahnout vse (ZIP)"
admin.storage.storage_ready = "Ulozeno"
admin.storage.storage_processing = "Zpracovava se"
admin.storage.storage_error = "Chyba ulozeni"
admin.storage.storage_retry = "Zkusit znovu"
admin.storage.file_manifest = "Manifest souboru"
admin.storage.checksum = "Kontrolni soucet"
admin.storage.preset_snapshot = "Snapshot presetu"
admin.storage.no_files = "Zadne soubory"
admin.storage.search_placeholder = "Hledat soubory..."
admin.storage.new_folder = "Nova slozka"
admin.storage.upload = "Nahrat"
admin.storage.download = "Stahnout"
admin.storage.delete = "Smazat"
checkout.shipping_address = "Dodaci adresa"
checkout.street = "Ulice"
checkout.city = "Mesto"
checkout.zip_code = "PSC"
checkout.country = "Stat"
```

### EN
Anglicke preklady jsou k dispozici pod stejnymi klici v `admin.storage.*` a `checkout.*` sekcich.

---

## 10. Zname omezeni

- **localStorage limit** — objednavky se ukladaji v localStorage (max ~5-10 MB dle prohlizece)
- **Bez real-time updatu** — zmeny se neprojevuji automaticky u ostatnich uzivatelu
- **Bez emailovych notifikaci** — zadne automaticke emaily pri zmene statusu
- **Bez platebni brany** — checkout je pouze informativni (bez platby)
- **Bez tiskovych sestav** — generovani PDF faktur neni implementovano
- **Backend nutny pro storage** — bez backendu se objednavky ulozi jen do localStorage
- **Slicer nutny pro G-code** — bez PrusaSliceru se G-code neuklada
