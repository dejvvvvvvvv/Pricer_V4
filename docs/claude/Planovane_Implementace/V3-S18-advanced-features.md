# V3-S18: Pokrocile Funkce (Vice Technologii, Verzovani, Supply Chain)

> **Priorita:** P3 | **Obtiznost:** Very High | **Vlna:** 5
> **Zavislosti:** S01, S02, S03 (3D formaty), S06 (post-processing), S08 (mesh analyza), S15 (rozsirena cenotvorba)
> **Odhadovany rozsah:** ~80-120 souboru, 6-10 tydnu prace (3 vyvojari)

---

## A. KONTEXT

### A1. Ucel a cil

Toto je **architekturalne nejnarocnejsi sekce** celeho V3 planu. Obsahuje tri fundamentalni
rozsireni, ktera meni zakladni predpoklady systemu:

1. **Multi-Technology Support** — Rozsireni z jedine technologie (FDM) na vice vyrobnich metod
   (SLA, SLS, MJF, CNC, Laser Cutting). Toto zasahuje do KAZDE casti systemu — od widgetu
   pres pricing engine az po admin panel.

2. **Model Versioning** — Git-like verzovani nahradnych 3D modelu. Zakaznik muze iterovat
   nad navrhem, system zachovava historii a umoznuje porovnani verzi.

3. **Supply Chain Management** — Sprava dodavatelu pro firmy, ktere outsourcuji vyrobu.
   Automaticke routovani objednavek, sledovani stavu u dodavatele, financni prehled.

**Business value:**
- Multi-tech = otevreni novych trhovych segmentu (SLA firmy, CNC dilny, laserove rezani)
  - Aktualne ModelPricer oslovi jen ~40% trhu (FDM). S multi-tech = ~85% trhu
- Verzovani = lepsi uzivatelsky zazitek pro iterativni navrh (B2B zakaznici)
- Supply chain = enterprise feature ktera odemyka vyssi cenove plany a vetsi zakazniky
- Celkove: prechod z "FDM cenove kalkulacky" na "univerzalni vyrobni platformu"

### A2. Priorita, obtiznost, vlna

**Priorita P3:** Neni kriticka pro MVP, ale je strategicky nejdulezitejsi pro dlouhodoby rust.
Bez multi-tech podpory je ModelPricer limitovan na FDM segment.

**Obtiznost Very High:**
- Multi-tech je **fundamentalni architekturalni zmena** — pricing engine, ktery aktualne
  predpoklada slicer-based FDM workflow (hmotnost + cas), musi byt abstrahovan na libovolnou
  pricing metodu (volume-based, time-based, bounding-box)
- Kazda technologie ma jine parametry, materialy, slicery, metody cenotvorby
- Verzovani vyzaduje zmenu datoveho modelu pro soubory (z flat na hierarchicky)
- Supply chain je enterprise feature s komplexnim business logikou

**Vlna 5:** Posledni vlna. Vyzaduje:
- Stabilni zaklad (S01-S02)
- Rozsirene 3D formaty (S03) — kazda technologie pouziva jine formaty
- Mesh analyzu (S08) — ruzne analyzy pro ruzne technologie
- Rozsirenou cenotvorbu (S15) — zaklad pro multi-tech pricing rules

### A3. Zavislosti na jinych sekcich

**Musi byt hotove PRED S18:**
- **S01** (Bug Fixes) — stabilni zaklad
- **S02** (Objednavky) — funkcni objednavkovy system
- **S03** (Vice formatu) — STEP/IGES pro CNC, resin formaty pro SLA
- **S06** (Post-processing) — post-processing se lisi dle technologie
- **S08** (Mesh analyza) — ruzne analyzy pro ruzne technologie
- **S15** (Rozsirena cenotvorba) — json-rules-engine pro multi-tech pricing

**Silne doporuceno:**
- **S14** (Kanban board) — supply chain vyuziva workflow management
- **S16** (Multi-language) — nazvy technologii a parametru musi byt prekladatelne
- **S20** (Public API) — supply chain portual pro dodavatele

**Zavisi na S18:**
- Zadna sekce primo nezavisi na S18 (je to Vlna 5, posledni)
- Ale S18 vyrazne ovlivnuje celkovou architekturu pro budouci verze (V4+)

### A4. Soucasny stav v codebase

**Aktualni stav — FDM-only architektura:**

1. **Pricing Engine (`src/lib/pricing/pricingEngineV3.js`):**
   - Vsechny kalkulace predpokladaji FDM: `filamentGrams`, `estimatedTimeSeconds`
   - `calcBase()` pocita: `materialCostPerPiece = grams * pricePerGram` a
     `timeCostPerPiece = billedMinutes * ratePerHour`
   - Zadna abstrakce "technologie" — vsude hardcoded FDM predpoklady
   - Fee types: `per_gram`, `per_minute`, `per_cm3`, `per_cm2` — castecne univerzalni,
     ale semantika je FDM-specificka

2. **Model metrics (`getModelMetrics()` v pricingEngineV3.js):**
   - Cte: `estimatedTimeSeconds`, `filamentGrams`, `volumeMm3`, `surfaceMm2`
   - Tyto metriky pochazi z PrusaSlicer — jiny slicer/technologie vraci jina data

3. **Print Configuration (`src/pages/model-upload/components/PrintConfiguration.jsx`):**
   - FDM parametry: infill, layer height, supports, material (PLA/ABS/PETG...)
   - Zadny vyber technologie pred konfiguraci

4. **Admin Pricing (`src/pages/admin/AdminPricing.jsx`):**
   - Materialy: `materials` array s `price_per_gram` — FDM-specificke
   - `rate_per_hour` — slicer-based casova sazba
   - Zadna segmentace dle technologie

5. **Storage helpery:**
   - `src/utils/adminPricingStorage.js` — namespace `pricing:v3`, FDM schema
   - `src/utils/adminFeesStorage.js` — namespace `fees:v3`, univerzalni fee system
   - `src/utils/adminOrdersStorage.js` — namespace `orders:v1`

6. **3D Viewer (`src/pages/model-upload/components/ModelViewer.jsx`):**
   - STL only (Three.js STLLoader)
   - Zadna podpora pro dalsi formaty (S03 to resi)

7. **File upload:**
   - `src/pages/model-upload/components/FileUploadZone.jsx` — upload zone
   - Flat file model (zadne verzovani)
   - Kazdy soubor = 1 model, zadna hierarchie verzi

**Co CHYBI:**
- Abstrakce "Technology" entity
- Technology-specific pricing methods
- Technology-specific parametry ve widgetu
- Model versioning (file history)
- Supplier management
- Order-to-supplier assignment
- Supplier portal

### A5. Referencni zdroje a konkurence

**OSS knihovny:**

| Knihovna | Ucel | Licence |
|----------|------|---------|
| `json-rules-engine` | Pravidlovy engine pro multi-tech pricing | MIT |
| `Prisma` | ORM pro komplexni datovy model (Variant B) | Apache-2.0 |
| `event-sourcing` pattern | Pro verzovani (vlastni implementace) | - |
| `decimal.js` | Presna aritmetika pro ceny | MIT |
| `opencascade.js` | STEP/IGES parser (CNC) | LGPL-2.1 (CAUTION) |
| `Kiri:Moto` (GridSpace) | Multi-tech slicer (FDM+SLA+CNC+Laser) | MIT |

**Konkurence:**
- **Xometry** — multi-tech (CNC, 3D Print, Sheet Metal), instant quoting
- **Hubs (Protolabs)** — FDM + SLA + SLS + CNC, automated pricing
- **Craftcloud** — multi-printer network, supply chain management
- **3D Hubs** (nyni Protolabs Network) — marketplace model s dodavateli

**Architekturalni vzory:**
- **Strategy pattern** pro pricing metody (kazda technologie = jina strategie)
- **Plugin architecture** pro slicery (PrusaSlicer, Chitubox, vlastni kalkulace)
- **Event sourcing** pro model versioning (kazda zmena = event, stav = projekce)

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

#### B1.1 Technologies (multi-tech)

**Namespace:** `modelpricer:${tenantId}:technologies:v1`

```json
{
  "technologies": [
    {
      "id": "tech_fdm",
      "slug": "fdm",
      "name": "FDM / FFF",
      "description": "Fused Deposition Modeling — taveny filament",
      "icon": "printer-3d",
      "pricing_method": "SLICER",
      "slicer_engine": "PRUSASLICER",
      "is_active": true,
      "is_default": true,
      "sort_order": 1,
      "supported_file_formats": [".stl", ".obj", ".3mf"],
      "parameters": [
        {
          "id": "param_infill",
          "slug": "infill",
          "name": "Vyplň",
          "type": "SLIDER",
          "default_value": "20",
          "min_value": 0,
          "max_value": 100,
          "step": 5,
          "unit": "%",
          "is_visible_in_widget": true,
          "sort_order": 1
        },
        {
          "id": "param_layer_height",
          "slug": "layer_height",
          "name": "Vyska vrstvy",
          "type": "DROPDOWN",
          "default_value": "0.2",
          "options": [
            {"value": "0.1", "label": "0.1 mm (jemne)"},
            {"value": "0.2", "label": "0.2 mm (standard)"},
            {"value": "0.3", "label": "0.3 mm (draft)"}
          ],
          "is_visible_in_widget": true,
          "sort_order": 2
        },
        {
          "id": "param_supports",
          "slug": "supports",
          "name": "Podpory",
          "type": "CHECKBOX",
          "default_value": "false",
          "is_visible_in_widget": true,
          "sort_order": 3
        }
      ],
      "materials": ["mat_pla", "mat_abs", "mat_petg", "mat_tpu", "mat_nylon"],
      "config": {
        "min_layer_height": 0.05,
        "max_layer_height": 0.4,
        "max_build_volume": {"x": 250, "y": 210, "z": 210},
        "supports_available": true,
        "post_processing_options": ["sanding", "painting", "vapor_smoothing"]
      }
    },
    {
      "id": "tech_sla",
      "slug": "sla",
      "name": "SLA (Resin)",
      "description": "Stereolithography — pryskyricovy tisk",
      "icon": "droplet",
      "pricing_method": "VOLUME",
      "slicer_engine": "NONE",
      "is_active": false,
      "is_default": false,
      "sort_order": 2,
      "supported_file_formats": [".stl", ".obj"],
      "parameters": [
        {
          "id": "param_sla_layer",
          "slug": "layer_height",
          "name": "Vyska vrstvy",
          "type": "DROPDOWN",
          "default_value": "0.05",
          "options": [
            {"value": "0.025", "label": "0.025 mm (ultra-fine)"},
            {"value": "0.05", "label": "0.05 mm (fine)"},
            {"value": "0.1", "label": "0.1 mm (standard)"}
          ],
          "is_visible_in_widget": true
        },
        {
          "id": "param_sla_orientation",
          "slug": "orientation",
          "name": "Orientace",
          "type": "DROPDOWN",
          "default_value": "auto",
          "options": [
            {"value": "auto", "label": "Automaticka"},
            {"value": "flat", "label": "Ploche"},
            {"value": "angled", "label": "Pod uhlem (45)"}
          ],
          "is_visible_in_widget": true
        },
        {
          "id": "param_sla_postcure",
          "slug": "post_cure",
          "name": "Post-Cure UV",
          "type": "CHECKBOX",
          "default_value": "true",
          "is_visible_in_widget": false
        }
      ],
      "materials": ["mat_standard_resin", "mat_tough_resin", "mat_flexible_resin"],
      "config": {
        "pricing_formula": "volume_mm3 * resin_price_per_ml / 1000 + base_fee",
        "max_build_volume": {"x": 130, "y": 80, "z": 150}
      }
    },
    {
      "id": "tech_sls",
      "slug": "sls",
      "name": "SLS (Powder)",
      "description": "Selective Laser Sintering — praskovy tisk",
      "icon": "flame",
      "pricing_method": "VOLUME_BBOX",
      "slicer_engine": "NONE",
      "is_active": false,
      "sort_order": 3,
      "supported_file_formats": [".stl", ".obj", ".3mf"],
      "parameters": [
        {
          "id": "param_sls_density",
          "slug": "packing_density",
          "name": "Hustota baleni",
          "type": "SLIDER",
          "default_value": "15",
          "min_value": 5,
          "max_value": 30,
          "unit": "%",
          "is_visible_in_widget": false
        }
      ],
      "materials": ["mat_pa11", "mat_pa12", "mat_tpu_sls"],
      "config": {
        "pricing_formula": "bounding_box_volume * packing_rate + model_volume * material_rate",
        "min_wall_thickness": 0.8
      }
    },
    {
      "id": "tech_cnc",
      "slug": "cnc",
      "name": "CNC Machining",
      "description": "Pocitacove rizene obrabeni",
      "icon": "cog",
      "pricing_method": "TIME_MATERIAL",
      "slicer_engine": "NONE",
      "is_active": false,
      "sort_order": 4,
      "supported_file_formats": [".step", ".stp", ".iges", ".igs", ".stl"],
      "parameters": [
        {
          "id": "param_cnc_tolerance",
          "slug": "tolerance",
          "name": "Tolerance",
          "type": "DROPDOWN",
          "default_value": "standard",
          "options": [
            {"value": "rough", "label": "+/- 0.5 mm"},
            {"value": "standard", "label": "+/- 0.1 mm"},
            {"value": "precision", "label": "+/- 0.05 mm"}
          ],
          "is_visible_in_widget": true
        },
        {
          "id": "param_cnc_finish",
          "slug": "surface_finish",
          "name": "Povrchova uprava",
          "type": "DROPDOWN",
          "default_value": "as_machined",
          "options": [
            {"value": "as_machined", "label": "Strojni povrch"},
            {"value": "polished", "label": "Lesteny"},
            {"value": "anodized", "label": "Eloxovany"}
          ],
          "is_visible_in_widget": true
        }
      ],
      "materials": ["mat_aluminum", "mat_steel", "mat_brass", "mat_plastic_cnc"],
      "config": {
        "pricing_formula": "machining_time_min * rate_per_min + material_block_cost + setup_fee",
        "requires_cam_estimate": true
      }
    }
  ],
  "default_technology_id": "tech_fdm"
}
```

#### B1.2 Model Versions

**Namespace:** `modelpricer:${tenantId}:model-versions:v1`

```json
{
  "models": {
    "mdl_abc123": {
      "id": "mdl_abc123",
      "original_filename": "bracket_v2.stl",
      "current_version": 3,
      "created_at": "2026-01-10T10:00:00Z",
      "customer_id": "cust_xyz",
      "versions": [
        {
          "version": 1,
          "file_url": "/uploads/mdl_abc123_v1.stl",
          "file_name": "bracket.stl",
          "file_size": 102400,
          "uploaded_at": "2026-01-10T10:00:00Z",
          "uploaded_by": "cust_xyz",
          "metadata": {
            "bounding_box": {"x": 50, "y": 30, "z": 20},
            "volume_mm3": 15000,
            "surface_mm2": 8500,
            "triangle_count": 12400
          },
          "slicer_result": null,
          "calculated_price": null,
          "price_breakdown": null,
          "notes": "Prvni verze"
        },
        {
          "version": 2,
          "file_url": "/uploads/mdl_abc123_v2.stl",
          "file_name": "bracket_v2.stl",
          "file_size": 115200,
          "uploaded_at": "2026-01-12T14:30:00Z",
          "metadata": {
            "bounding_box": {"x": 52, "y": 32, "z": 22},
            "volume_mm3": 17500,
            "surface_mm2": 9200,
            "triangle_count": 14800
          },
          "slicer_result": {"estimatedTimeSeconds": 3600, "filamentGrams": 15.2},
          "calculated_price": 185.00,
          "price_breakdown": {"material": 45, "time": 120, "fees": 20},
          "notes": "Zvetseny uchyt"
        },
        {
          "version": 3,
          "file_url": "/uploads/mdl_abc123_v3.stl",
          "file_name": "bracket_v3_final.stl",
          "file_size": 118000,
          "uploaded_at": "2026-01-15T09:00:00Z",
          "metadata": {
            "bounding_box": {"x": 52, "y": 32, "z": 20},
            "volume_mm3": 16800,
            "surface_mm2": 9000,
            "triangle_count": 15200
          },
          "calculated_price": 178.00,
          "notes": "Optimalizovany tvar, mensi objem"
        }
      ]
    }
  }
}
```

#### B1.3 Suppliers (Supply Chain)

**Namespace:** `modelpricer:${tenantId}:suppliers:v1`

```json
{
  "suppliers": [
    {
      "id": "sup_001",
      "name": "3D Print Studio Praha",
      "email": "info@3dprintstudio.cz",
      "phone": "+420 123 456 789",
      "address": {
        "street": "Vodickova 30",
        "city": "Praha",
        "zip": "11000",
        "country": "CZ"
      },
      "supported_technologies": ["tech_fdm", "tech_sla"],
      "supported_materials": ["mat_pla", "mat_abs", "mat_standard_resin"],
      "capacity": {
        "printers": 5,
        "monthly_volume_pieces": 500,
        "current_utilization_percent": 65
      },
      "pricing": {
        "mode": "margin",
        "margin_percent": 15,
        "min_order_value": 200
      },
      "lead_time_days": 3,
      "rating": 4,
      "notes": "Spolehliva kvalita, obcas zpozdeni o 1 den",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "assignments": [
    {
      "id": "asgn_001",
      "order_id": "ord_abc",
      "supplier_id": "sup_001",
      "assigned_at": "2026-01-15T10:00:00Z",
      "assigned_by": "admin_user_1",
      "status": "IN_PRODUCTION",
      "supplier_notes": "Zahajeno, hotovo do 17.1.",
      "cost": 350.00,
      "tracking_number": null,
      "status_history": [
        {"status": "PENDING", "at": "2026-01-15T10:00:00Z"},
        {"status": "ACCEPTED", "at": "2026-01-15T10:30:00Z"},
        {"status": "IN_PRODUCTION", "at": "2026-01-15T14:00:00Z"}
      ]
    }
  ],
  "routing_rules": [
    {
      "id": "rule_001",
      "name": "SLA objednavky -> Studio Praha",
      "conditions": [
        {"key": "technology", "op": "eq", "value": "sla"}
      ],
      "supplier_id": "sup_001",
      "priority": 1,
      "is_active": true
    }
  ]
}
```

### B2. API kontrakty (endpointy)

```
# Technologies
GET    /api/v1/technologies                    # Seznam technologii tenanta
GET    /api/v1/technologies/:id                # Detail technologie
POST   /api/v1/technologies                    # Vytvorit custom technologii
PATCH  /api/v1/technologies/:id                # Aktualizovat
PATCH  /api/v1/technologies/:id/activate       # Aktivovat/deaktivovat
GET    /api/v1/technologies/:id/materials      # Materialy pro technologii
GET    /api/v1/technologies/:id/parameters     # Parametry pro widget

# Model Versions
GET    /api/v1/models/:modelId/versions        # Seznam verzi modelu
POST   /api/v1/models/:modelId/versions        # Nahrat novou verzi
GET    /api/v1/models/:modelId/versions/:ver   # Detail verze
GET    /api/v1/models/:modelId/compare/:v1/:v2 # Porovnani dvou verzi
DELETE /api/v1/models/:modelId/versions/:ver   # Smazat verzi (soft)

# Suppliers
GET    /api/v1/suppliers                       # Seznam dodavatelu
POST   /api/v1/suppliers                       # Pridat dodavatele
GET    /api/v1/suppliers/:id                   # Detail dodavatele
PATCH  /api/v1/suppliers/:id                   # Aktualizovat
DELETE /api/v1/suppliers/:id                   # Smazat (soft)

# Order-Supplier Assignments
POST   /api/v1/orders/:orderId/assign          # Priradit objednavku dodavateli
PATCH  /api/v1/assignments/:id/status          # Aktualizovat stav u dodavatele
GET    /api/v1/suppliers/:id/assignments       # Objednavky dodavatele
GET    /api/v1/suppliers/:id/stats             # Statistiky dodavatele

# Routing Rules
GET    /api/v1/routing-rules                   # Seznam pravidel
POST   /api/v1/routing-rules                   # Vytvorit pravidlo
PATCH  /api/v1/routing-rules/:id               # Aktualizovat
DELETE /api/v1/routing-rules/:id               # Smazat
POST   /api/v1/routing-rules/evaluate          # Otestovat pravidla na objednavce
```

### B3. Komponentni strom (React)

```
Admin UI:
  AdminTechnologies/
    TechnologiesPage.jsx               # /admin/technologies
      TechnologyList.jsx               # Seznam technologii (karty)
        TechnologyCard.jsx             # Jedna technologie (ikona, nazev, stav)
      TechnologyDetail.jsx             # Detail/konfigurace technologie
        TechGeneralSettings.jsx        # Nazev, popis, ikona, pricing method
        TechParameterEditor.jsx        # Editor parametru (dynamicky formular)
          ParameterRow.jsx             # Jeden parametr (type, default, options)
        TechMaterialLinker.jsx         # Propojeni s materialy
        TechPricingConfig.jsx          # Pricing konfigurace dle metody
          SlicerPricingConfig.jsx      # FDM: rate_per_hour, min_billed_minutes
          VolumePricingConfig.jsx      # SLA: price_per_ml, base_fee
          BboxPricingConfig.jsx        # SLS: packing_rate, material_rate
          TimeMaterialPricingConfig.jsx # CNC: rate_per_min, setup_fee

  AdminModelVersions/ (v ramci order detail)
    ModelVersionHistory.jsx            # Historie verzi v detailu objednavky
      VersionRow.jsx                   # Jedna verze (datum, metriky, cena)
      VersionCompare.jsx              # Side-by-side porovnani
        VersionDiff.jsx                # Rozdily v metrikach
        ModelViewer3DCompare.jsx       # Dva 3D viewery vedle sebe

  AdminSuppliers/
    SuppliersPage.jsx                  # /admin/suppliers
      SupplierList.jsx                 # Tabulka dodavatelu
      SupplierDetail.jsx               # Detail dodavatele
        SupplierGeneralInfo.jsx        # Kontakt, adresa
        SupplierCapabilities.jsx       # Technologie, materialy, kapacita
        SupplierPricingConfig.jsx      # Cenova nastaveni (marze, min objednavka)
        SupplierAssignments.jsx        # Prirazene objednavky
        SupplierStats.jsx             # Statistiky (vykon, naklady, marze)
      AssignOrderDialog.jsx            # Modal pro prirazeni objednavky
      RoutingRulesEditor.jsx           # Editor automatickeho routovani
        RoutingRuleRow.jsx             # Jedno pravidlo (condition -> supplier)

Widget (rozsireni):
  TechnologySelector.jsx               # Vyber technologie (pred uploadem)
    TechnologyTile.jsx                 # Dlazdice s technologii (ikona, nazev, od X Kc)
  DynamicPrintConfig.jsx               # Parametry dle vybrane technologie
  ModelVersionUploader.jsx             # Upload nove verze k existujicimu modelu
```

### B4. Tenant storage namespace

| Namespace | Helper | Obsah |
|-----------|--------|-------|
| `technologies:v1` | `adminTechnologyStorage.js` | Definice technologii, parametry, materialy |
| `model-versions:v1` | `adminModelVersionStorage.js` | Historie verzi modelu |
| `suppliers:v1` | `adminSupplierStorage.js` | Dodavatele, prirazeni, routing pravidla |
| `pricing:v3` (existujici) | `adminPricingStorage.js` | Rozsireni o per-technology pricing |
| `fees:v3` (existujici) | `adminFeesStorage.js` | Bez zmeny — fees jsou technology-agnostic |

**Novy helper priklad — `src/utils/adminTechnologyStorage.js`:**

```javascript
import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS = 'technologies:v1';

const DEFAULT_TECHNOLOGIES = {
  technologies: [
    {
      id: 'tech_fdm',
      slug: 'fdm',
      name: 'FDM / FFF',
      pricing_method: 'SLICER',
      slicer_engine: 'PRUSASLICER',
      is_active: true,
      is_default: true,
      sort_order: 1,
      // ... (kompletni schema viz B1.1)
    }
  ],
  default_technology_id: 'tech_fdm'
};

export function getTechnologies() {
  return readTenantJson(NS, DEFAULT_TECHNOLOGIES);
}

export function saveTechnologies(data) {
  writeTenantJson(NS, data);
}

export function getActiveTechnologies() {
  const data = getTechnologies();
  return (data.technologies || []).filter(t => t.is_active);
}

export function getTechnologyById(techId) {
  const data = getTechnologies();
  return (data.technologies || []).find(t => t.id === techId) || null;
}

export function getDefaultTechnology() {
  const data = getTechnologies();
  const defaultId = data.default_technology_id;
  return (data.technologies || []).find(t => t.id === defaultId) || null;
}
```

### B5. Widget integrace (postMessage)

**Nove postMessage zpravy pro multi-tech:**

```javascript
// Widget -> Parent:
{
  type: 'MODELPRICER_TECHNOLOGY_SELECTED',
  publicId: 'w_xyz',
  technology: {
    id: 'tech_sla',
    slug: 'sla',
    name: 'SLA (Resin)'
  }
}

{
  type: 'MODELPRICER_VERSION_UPLOADED',
  publicId: 'w_xyz',
  model: {
    id: 'mdl_abc',
    version: 3,
    filename: 'bracket_v3.stl'
  }
}

// Parent -> Widget:
{
  type: 'MODELPRICER_SET_TECHNOLOGY',
  technologyId: 'tech_sla'
}

{
  type: 'MODELPRICER_SET_AVAILABLE_TECHNOLOGIES',
  technologyIds: ['tech_fdm', 'tech_sla']
}
```

### B6. Pricing engine integrace

**Toto je KRITICKA architekturalni zmena v `pricingEngineV3.js`.**

**Aktualni stav:**
```javascript
// calcBase() v pricingEngineV3.js — radek 289-318
function calcBase({ file, cfg, pricingConfig }) {
  // HARDCODED FDM:
  const materialCostPerPiece = filamentGrams * pricePerGram;
  const timeCostPerPiece = billedMinutes * (ratePerHour / 60);
  return { basePerPiece: materialCostPerPiece + timeCostPerPiece, ... };
}
```

**Navrhovany stav — Strategy pattern:**

```javascript
// Novy soubor: src/lib/pricing/pricingStrategies.js

// Interface (kazda strategie implementuje):
// calculateBase(file, cfg, pricingConfig, technologyConfig) -> { basePerPiece, ... }

export function fdmStrategy(file, cfg, pricingConfig, techConfig) {
  const metrics = getModelMetrics(file);
  const pricePerGram = getMaterialPricePerGram(pricingConfig, cfg.material);
  const ratePerHour = pricingConfig.rate_per_hour || 0;
  const billedMinutes = Math.max(metrics.estimatedTimeSeconds / 60, pricingConfig.minimum_billed_minutes || 0);

  return {
    materialCostPerPiece: metrics.filamentGrams * pricePerGram,
    timeCostPerPiece: billedMinutes * (ratePerHour / 60),
    basePerPiece: /* sum */,
    metrics: { filamentGrams: metrics.filamentGrams, billedMinutes, ... }
  };
}

export function slaStrategy(file, cfg, pricingConfig, techConfig) {
  const metrics = getModelMetrics(file);
  const volumeMl = metrics.volumeMm3 / 1000;
  const resinPricePerMl = getMaterialPricePerMl(pricingConfig, cfg.material);
  const baseFee = techConfig.config?.base_fee || 0;

  return {
    materialCostPerPiece: volumeMl * resinPricePerMl,
    baseFee: baseFee,
    basePerPiece: volumeMl * resinPricePerMl + baseFee,
    metrics: { volumeMl, ... }
  };
}

export function slsStrategy(file, cfg, pricingConfig, techConfig) {
  const metrics = getModelMetrics(file);
  const bbox = metrics.sizeMm;
  const bboxVolumeCm3 = (bbox.x * bbox.y * bbox.z) / 1000;
  const modelVolumeCm3 = metrics.volumeMm3 / 1000;
  const packingRate = techConfig.config?.packing_rate || 0.5;
  const materialRate = getMaterialPricePerCm3(pricingConfig, cfg.material);

  return {
    bboxCost: bboxVolumeCm3 * packingRate,
    materialCost: modelVolumeCm3 * materialRate,
    basePerPiece: bboxVolumeCm3 * packingRate + modelVolumeCm3 * materialRate,
    metrics: { bboxVolumeCm3, modelVolumeCm3, ... }
  };
}

export function cncStrategy(file, cfg, pricingConfig, techConfig) {
  // CNC: cas obrabeni (odhad z objemu a slozitosti) + material bloku + setup fee
  const metrics = getModelMetrics(file);
  const estimatedMinutes = estimateCncTime(metrics, cfg);
  const ratePerMin = techConfig.config?.rate_per_min || 2;
  const materialBlockCost = estimateMaterialBlockCost(metrics, cfg.material, pricingConfig);
  const setupFee = techConfig.config?.setup_fee || 50;

  return {
    machiningCost: estimatedMinutes * ratePerMin,
    materialBlockCost,
    setupFee,
    basePerPiece: estimatedMinutes * ratePerMin + materialBlockCost + setupFee,
    metrics: { estimatedMinutes, ... }
  };
}

// Registry
const STRATEGIES = {
  SLICER: fdmStrategy,       // FDM: slicer-based
  VOLUME: slaStrategy,       // SLA: volume-based
  VOLUME_BBOX: slsStrategy,  // SLS: volume + bounding box
  TIME_MATERIAL: cncStrategy  // CNC: time + material
};

export function getStrategy(pricingMethod) {
  return STRATEGIES[pricingMethod] || fdmStrategy;
}
```

**Zmena v `calculateOrderQuote()`:**

```javascript
// V calculateOrderQuote() pridat:
export function calculateOrderQuote({
  uploadedFiles,
  printConfigs,
  pricingConfig,
  feesConfig,
  feeSelections,
  technologyId,          // NOVY parametr
  technologiesConfig,     // NOVY parametr
}) {
  // Resolve technology
  const techConfig = (technologiesConfig?.technologies || [])
    .find(t => t.id === technologyId) || null;
  const pricingMethod = techConfig?.pricing_method || 'SLICER';
  const strategy = getStrategy(pricingMethod);

  // V calcBase() pouzit strategii misto hardcoded FDM:
  for (const file of files) {
    const base = strategy(file, cfg, pc, techConfig);
    // ... zbytek pipeline (fees, markup, rounding) zustava stejny
  }
}
```

**DULEZITE:** Tato zmena MUSI byt zpetne kompatibilni:
- Pokud `technologyId` neni poskytnuto, pouzit `tech_fdm` (default)
- Pokud `technologiesConfig` neni poskytnuto, pouzit aktualni FDM logiku
- Vsechny existujici testy musi projit beze zmeny

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-sr-pricing` | Architektura multi-tech pricing, strategy pattern | `src/lib/pricing/*` | P0 |
| `mp-mid-pricing-engine` | Implementace pricing strategii, refaktor calcBase | `pricingEngineV3.js`, `pricingStrategies.js` | P0 |
| `mp-sr-frontend` | Architektura multi-tech widgetu a admin UI | Celkovy plan | P0 |
| `mp-mid-frontend-admin` | Admin > Technologie, Admin > Dodavatele stranky | `src/pages/admin/Admin*.jsx` | P1 |
| `mp-mid-frontend-widget` | TechnologySelector, DynamicPrintConfig | `src/pages/widget/*`, `model-upload/*` | P1 |
| `mp-mid-storage-tenant` | 3 nove storage helpery | `src/utils/admin*Storage.js` | P1 |
| `mp-spec-pricing-materials` | Per-technology materialy a pricing metody | Material konfigurace | P1 |
| `mp-spec-3d-viewer` | Side-by-side version compare viewer | `ModelViewer3DCompare.jsx` | P2 |
| `mp-spec-3d-analysis` | Technologie-specificka mesh analyza | `geomEstimate.js` rozsireni | P2 |
| `mp-mid-backend-services` | Supplier portal API, order assignment | `backend-local/routes/suppliers.js` | P2 |
| `mp-spec-fe-routing` | Nove routy (technologies, suppliers) | `src/Routes.jsx` | P1 |
| `mp-mid-security-app` | RBAC pro supplier portal, data isolation | Security review | P0 |
| `mp-spec-plan-critic` | Review architekturalnich rozhodnuti | Review document | P0 |

### C2. Implementacni kroky (poradi)

**Faze 1: Technology Abstraction (tyden 1-2) — KRITICKA CESTA**

1. **[SEKVENCNI, P0]** Architekturalni navrh: Strategy pattern pro pricing
   - `mp-sr-pricing` + `mp-spec-plan-critic` review
   - Definice interface pro kazdu strategii
   - Plan zpetne kompatibility

2. **[PARALELNI po 1]** Vytvorit `src/utils/adminTechnologyStorage.js`
   - Default data: FDM jako jedina aktivni technologie
   - CRUD operace pro technologie, parametry, materialy

3. **[PARALELNI po 1]** Vytvorit `src/lib/pricing/pricingStrategies.js`
   - fdmStrategy (extrakce z aktualni calcBase)
   - slaStrategy, slsStrategy, cncStrategy (nove)
   - Registry pattern pro vyber strategie

4. **[SEKVENCNI po 3]** Refaktor `pricingEngineV3.js`
   - `calculateOrderQuote()` prijima `technologyId` + `technologiesConfig`
   - `calcBase()` deleguje na strategii
   - VSECHNY existujici testy MUSI projit

5. **[PARALELNI po 2]** Admin UI: `AdminTechnologies.jsx`
   - Seznam technologii (karty s aktivaci/deaktivaci)
   - Detail technologie (parametry, materialy, pricing config)

6. **[SEKVENCNI po 5]** Route `/admin/technologies` + navigace

**Faze 2: Widget Multi-Tech (tyden 2-3)**

7. **[SEKVENCNI po 4]** TechnologySelector ve widgetu
   - Dlazdice s aktivnimi technologiemi
   - Po vyberu: dynamicke parametry + materialy dle technologie

8. **[SEKVENCNI po 7]** DynamicPrintConfig
   - Nahrada statickeho PrintConfiguration.jsx
   - Dynamicky generovany formular dle `technology.parameters`

9. **[PARALELNI]** Testy multi-tech pricing
   - Unit testy pro kazdou strategii
   - Integracni test: FDM flow beze zmeny
   - Integracni test: SLA flow (volume pricing)

**Faze 3: Model Versioning (tyden 3-4)**

10. **[PARALELNI]** Vytvorit `src/utils/adminModelVersionStorage.js`
11. **[SEKVENCNI po 10]** ModelVersionUploader + VersionHistory komponenty
12. **[PARALELNI]** VersionCompare — side-by-side 3D viewer + diff metrik

**Faze 4: Supply Chain (tyden 5-6)**

13. **[PARALELNI]** Vytvorit `src/utils/adminSupplierStorage.js`
14. **[SEKVENCNI po 13]** Admin UI: SuppliersPage + SupplierDetail
15. **[SEKVENCNI po 14]** AssignOrderDialog v detailu objednavky
16. **[PARALELNI po 15]** RoutingRulesEditor (automaticke prirazeni)

**Faze 5: Integrace a testovani (tyden 7-8)**

17. **[PARALELNI]** End-to-end testy: cely flow od vyberu technologie po objednavku
18. **[PARALELNI]** Performance testy: pricing engine s vice technologiemi
19. **[SEKVENCNI]** Security review celeho multi-tech systemu
20. **[SEKVENCNI]** Dokumentace a migracni guide

### C3. Kriticke rozhodovaci body

1. **Pricing engine refaktor: Strategy vs. Config-driven?**
   - **Strategy pattern** (doporuceno) = kazda technologie ma vlastni funkci
   - Config-driven = univerzalni funkce s JSON pravidly (json-rules-engine)
   - **Rozhodnuti:** Strategy pro zakladni technologie, config pro custom technologie
   - Strategy je predikatabilnejsi a testovatelnejsi

2. **Widget UX: Technology selection PRED nebo PO uploadu?**
   - **PRED** (doporuceno) = zakaznik vybere technologii, pak system filtruje formaty
   - PO = zakaznik nahra soubor, system nabidne kompatibilni technologie
   - **Rozhodnuti:** PRED — umoznuje filtrovat soubory a parametry od zacatku

3. **Backward compatibility: Novy endpoint nebo rozsireni stavajiciho?**
   - **Rozhodnuti:** Rozsireni `calculateOrderQuote()` s optional parametry
   - Pokud `technologyId` chybi, chovani je IDENTICHE s aktualni verzi

4. **Supply chain: Interni vs. externi supplier portal?**
   - **Interni** (doporuceno pro MVP) = admin prideluje objednavky, dodavatel nema pristup
   - Externi = dodavatel se prihlasi do vlastniho portalu
   - **Rozhodnuti:** Interni pro MVP, externi portal jako V4 feature

### C4. Testovaci strategie

**Unit testy (P0):**
- Kazda pricing strategie: fdm, sla, sls, cnc — vstup/vystup validace
- `getStrategy()` — spravny vyber strategie dle pricing_method
- Zpetna kompatibilita: `calculateOrderQuote()` bez technologyId = FDM

**Integracni testy (P1):**
- Cely pricing pipeline: technologie -> strategie -> fees -> markup -> rounding
- Multi-model objednavka: ruzne technologie v jedne objednavce (budouci feature)
- Version upload flow: upload v1 -> upload v2 -> compare
- Supplier assignment: priradit -> zmenit stav -> financni prehled

**E2E testy (P1):**
- Widget: vybrat SLA -> nahrat model -> spocitat cenu -> objednat
- Admin: vytvorit novou technologii -> konfigurovat -> aktivovat
- Admin: priradit objednavku dodavateli -> sledovat stav

**Regression testy (P0):**
- Vsechny existujici testy MUSI projit beze zmeny po refaktoru
- FDM-only workflow MUSI fungovat identicky

### C5. Migrace existujicich dat

**Kriticka migrace: `pricing:v3` schema rozsireni**

Aktualni `pricing:v3` data obsahuji FDM-specificke polozky (`rate_per_hour`, `materials` s
`price_per_gram`). Migrace musi:

1. Zachovat vsechna existujici data beze zmeny
2. Pridat `technology_id: 'tech_fdm'` ke vsem existujicim materialum
3. Vytvorit default `technologies:v1` s jednou aktivni FDM technologii

```javascript
// Migrace v adminTechnologyStorage.js:
export function migrateFromPricingV3() {
  const existingPricing = readTenantJson('pricing:v3', null);
  if (!existingPricing) return;

  const technologies = getTechnologies();
  if (technologies.technologies.length > 0) return; // uz migrovano

  // Vytvorit FDM technologii z existujicich dat
  const fdmTech = {
    id: 'tech_fdm',
    slug: 'fdm',
    name: 'FDM / FFF',
    pricing_method: 'SLICER',
    is_active: true,
    is_default: true,
    materials: (existingPricing.materials || []).map(m => m.key),
    // ... doplnit z defaults
  };

  saveTechnologies({
    technologies: [fdmTech],
    default_technology_id: 'tech_fdm'
  });
}
```

---

## D. KVALITA

### D1. Security review body

**P0 — Kriticke:**
- **Technology config injection** — admin muze definovat custom pricing formula
  - NESMI obsahovat eval() nebo Function() constructor
  - Formula musi byt parsovana pres safe expression evaluator
- **Supplier data isolation** — dodavatel nesmi videt data jineho tenanta
- **Version file access** — overeni ze uzivatel ma pravo k pristupu ke vsem verzim modelu
- **Pricing integrity** — strategie musi vracet konzistentni vysledky (zadny NaN, Infinity)

**P1 — Dulezite:**
- **Rate limiting** na nahravani verzi (prevence DDoS pres file upload)
- **File size limity** per technologie (CNC STEP soubory mohou byt velke)
- **Supplier email leakage** — kontaktni udaje dodavatelu nesmeni byt viditelne ve widgetu

### D2. Performance budget

| Metrika | Cil | Jak merit |
|---------|-----|-----------|
| calculateOrderQuote() latence | < 50ms (FDM), < 100ms (SLA/SLS) | Performance.now() |
| Technology list render | < 200ms | React Profiler |
| Version compare (2x 3D viewer) | < 2s load, 60fps rotate | requestAnimationFrame |
| Admin Technologies page | < 500ms first paint | Lighthouse |
| Supplier list (100 dodavatelu) | < 300ms render | React Profiler |

**Optimalizace:**
- Lazy load strategii — pouze aktivni technologie se nacitaji
- Version thumbnaily — generovat pri uploadu, ne pri zobrazeni
- Supplier list — virtualizace pro > 50 zaznamu

### D3. Accessibility pozadavky

- **TechnologySelector:** Role `radiogroup`, kazda dlazdice `role="radio"`
- **VersionHistory:** `role="list"` s `aria-label="Historie verzi modelu"`
- **VersionCompare:** `aria-label` pro oba viewery ("Verze 1", "Verze 2")
- **SupplierList:** Tabulka s `<caption>` a `scope` atributy na hlavickach
- **DynamicPrintConfig:** Dynamicky generovane formulare musi mit label pro kazdy input
- **Focus management:** Pri zmene technologie focus na prvni parametr

### D4. Error handling a edge cases

**Multi-tech:**
- Technologie bez materialu -> warning v admin, disabled ve widgetu
- Technologie bez parametru -> zobrazit jen material a quantity
- Custom technologie s neplatnou formulou -> fallback na flat fee
- Prepnuti technologie po uploadu -> reset konfigurace, zachovat model
- Model nekompatibilni s technologii (format) -> chybova zprava

**Versioning:**
- Upload verze k neexistujicimu modelu -> vytvorit novy model s v1
- Duplicate upload (stejny soubor) -> warning, umoznit ale oznacit
- Smazani verze ktera je v aktivni objednavce -> blokovat s vysvetlenim
- Objednavka stare verze -> snapshot ceny z dane verze, ne aktualni

**Supply chain:**
- Prirazeni objednavky neaktivnimu dodavateli -> blokovat
- Dodavatel bez podporovane technologie -> warning pri prirazeni
- Vsichni dodavatele plne vytizeni -> zobrazit warning, umoznit prirazeni
- Cyklicke prirazeni (objednavka uz prirazena jinemu) -> confirm dialog

### D5. i18n pozadavky

**Vysoka priorita (~100 novych retezcu):**
- Nazvy technologii (FDM, SLA, SLS, CNC, Laser)
- Nazvy parametru (Infill, Layer Height, Supports, Orientation...)
- Nazvy materialu (PLA, ABS, Resin, Nylon, Aluminum...)
- Stavy dodavatele (Pending, Accepted, In Production, Shipped...)
- Stavy verze (Draft, Active, Archived)
- Error messages pro vsechny edge cases

**Format:**
- Pouzit `react-i18next` namespace `technologies`, `suppliers`, `versions`
- Fallback: en -> cs (pro ceske specificky vyrazy)

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

```javascript
{
  "features": {
    "multi_technology": false,          // P0: zaklad multi-tech
    "technology_sla": false,            // P1: SLA technologie
    "technology_sls": false,            // P2: SLS technologie
    "technology_cnc": false,            // P2: CNC technologie
    "technology_custom": false,         // P3: custom technologie
    "model_versioning": false,          // P1: verzovani modelu
    "version_compare_3d": false,        // P2: 3D porovnani verzi
    "supply_chain": false,              // P2: sprava dodavatelu
    "supplier_portal": false,           // P3: externi portal (V4)
    "auto_routing": false               // P3: automaticke routovani
  }
}
```

**Rollout plan:**
1. **Alpha (tyden 3):** Multi-tech FDM refaktor — MUSI projit vsechny testy
2. **Alpha (tyden 4):** SLA jako druha technologie (interni testing)
3. **Beta (tyden 6):** Multi-tech + versioning pro 5 zakazniku
4. **Public (tyden 8):** Multi-tech (FDM + SLA) pro vsechny
5. **Iterace (tyden 10+):** SLS, CNC, supply chain postupne

### E2. Admin UI zmeny

**Nove stranky:**
- `/admin/technologies` — Sprava technologii
- `/admin/suppliers` — Sprava dodavatelu (pouze s feature flagou `supply_chain`)

**Zmeny existujicich stranek:**
- `/admin/pricing` — Filtrovani dle technologie (dropdown nad materialovou tabulkou)
- `/admin/orders` (detail) — Zobrazeni technologie, historie verzi, prirazeni dodavateli
- `/admin/parameters` — Presunuti do Technology detail (per-tech parametry)

**Navigace (AdminLayout.jsx):**
```
Admin Dashboard
├── Branding         (existujici)
├── Technologie      (NOVE — /admin/technologies)
├── Pricing          (existujici, rozsirene)
├── Fees             (existujici, beze zmeny)
├── Presets          (existujici)
├── Parameters       (presunuto do Technology detail)
├── Orders           (existujici, rozsirene)
├── Integrace        (S17)
├── Dodavatele       (NOVE — /admin/suppliers)
├── Widget Builder   (existujici)
├── Analytics        (existujici)
└── Team & Access    (existujici)
```

### E3. Widget zmeny

**Kriticky zmena: TechnologySelector pred FileUploadZone**

Aktualni widget flow:
```
Upload Model -> Configure -> Calculate Price -> Order
```

Novy widget flow:
```
Select Technology -> Upload Model -> Configure (dynamic) -> Calculate Price -> Order
```

**Implementace:**
- Novy krok "Select Technology" jako prvni ve widget stepperu
- `TechnologySelector.jsx` — dlazdice s aktivnimi technologiemi
- Po vyberu se filtruje `FileUploadZone` na povolene formaty
- `PrintConfiguration.jsx` se nahrazuje dynamickym `DynamicPrintConfig.jsx`
- Pricing engine dostava `technologyId` pro spravnou strategii

**Zpetna kompatibilita:**
- Pokud je aktivni jen 1 technologie (FDM), TechnologySelector se preskoci
- Widget se chova identicky jako aktualne

### E4. Dokumentace pro uzivatele

1. **Admin guide: Sprava technologii** — Jak aktivovat SLA, konfigurovat parametry
2. **Admin guide: Sprava dodavatelu** — Pridani dodavatele, prirazeni objednavek
3. **Widget guide: Multi-tech** — Jak zobrazit vyber technologie zakaznikum
4. **API reference** — Nove endpointy pro technologies, versions, suppliers
5. **Migration guide** — Co se zmeni pro existujici zakazniky (nic, FDM default)
6. **Pricing guide** — Jak nastavit cenove strategie pro ruzne technologie

### E5. Metriky uspechu (KPI)

| KPI | Cil (6 mesicu) | Jak merit |
|-----|----------------|-----------|
| Zakaznici s > 1 technologii | 30% | Admin analytics |
| SLA objednavky | 15% vsech objednavek | Order technology tracking |
| Prumerne verze na model | > 1.5 | Model version stats |
| Dodavatelu na tenanta | prumer 2-3 | Supplier count |
| Conversion rate (s tech selection) | >= aktualni rate | A/B test |
| Pricing engine accuracy | < 5% odchylka od manualni kalkulace | Manual validation |
| Cas pro novy typ technologie | < 30 min setup | Admin UX tracking |
| NPS multi-tech | > 50 | In-app survey |
