# PROJECT_STRUCTURE.md — ModelPricer / Pricer V3

> **Účel:** Kompletní mapa struktury projektu pro rychlou orientaci při implementaci.
> **Aktualizováno:** 2026-01-28

---

## 1. Přehled Technologií

| Kategorie | Technologie |
|-----------|-------------|
| **Frontend** | React 18 + Vite |
| **Routing** | React Router v6 |
| **Styling** | Tailwind CSS + CSS Modules |
| **UI Components** | Radix UI primitives + CVA (class-variance-authority) |
| **Animace** | Framer Motion |
| **Ikony** | Lucide React |
| **3D Viewer** | Three.js + @react-three/fiber + @react-three/drei |
| **i18n** | Custom LanguageContext (CZ/EN) |
| **Backend (dev)** | Express.js (port 3001) |
| **Build** | Vite (port 4028) |

---

## 2. Adresářová Struktura

```
/src
├── components/
│   ├── ui/                      # Sdílené UI komponenty
│   │   ├── Button.jsx           # CVA, variants (default/primary/outline/ghost/gradient/destructive/link)
│   │   ├── Input.jsx            # s label + error state
│   │   ├── Select.jsx           # searchable, multiple, clearable
│   │   ├── Checkbox.jsx         # custom styled
│   │   ├── Slider.jsx           # Radix UI
│   │   ├── Card.jsx             # Card/CardHeader/CardContent/CardFooter
│   │   ├── Label.jsx            # Radix Label
│   │   ├── Tooltip.jsx          # Radix Tooltip
│   │   ├── Icon.jsx             # Wrapper pro AppIcon
│   │   ├── Container.jsx        # Layout container
│   │   ├── Header.jsx           # Navigace + mobile drawer
│   │   └── Footer.jsx           # Footer
│   ├── marketing/               # Marketing komponenty
│   │   ├── Tabs.jsx             # Accessible tabs
│   │   ├── Accordion.jsx        # Framer Motion
│   │   ├── Reveal.jsx           # Scroll-trigger fade
│   │   ├── Sparkles.jsx         # Dekorativní efekt
│   │   └── LogoMarquee.jsx      # Scrollující loga
│   └── AppIcon.jsx              # Lucide ikony wrapper
│
├── contexts/
│   └── LanguageContext.jsx      # i18n (CZ/EN), useLanguage() hook
│
├── lib/
│   └── pricing/
│       └── pricingEngineV3.js   # Pricing engine (base → fees → markup → minima → rounding)
│
├── pages/
│   ├── home/                    # Landing page (/)
│   ├── pricing/                 # Pricing page (/pricing)
│   ├── support/                 # Support page (/support)
│   ├── model-upload/            # Model upload (/model-upload)
│   │
│   ├── test-kalkulacka/         # VZOROVÁ KALKULAČKA (NESMÍ SE MĚNIT!)
│   │   ├── index.jsx            # Hlavní orchestrátor (729 řádků)
│   │   ├── components/
│   │   │   ├── FileUploadZone.jsx
│   │   │   ├── PrintConfiguration.jsx
│   │   │   ├── ModelViewer.jsx        # Three.js + STLLoader
│   │   │   ├── PricingCalculator.jsx
│   │   │   ├── GenerateButton.jsx     # CSS Modules
│   │   │   ├── GenerateButton.module.css
│   │   │   └── ErrorBoundary.jsx
│   │   └── utils/
│   │       └── geomEstimate.js
│   │
│   └── admin/                   # Admin panel
│       ├── AdminLayout.jsx      # Shared layout (sidebar, header)
│       ├── AdminDashboard.jsx   # /admin
│       ├── AdminBranding.jsx    # /admin/branding (logo, barvy, font)
│       ├── AdminPricing.jsx     # /admin/pricing
│       ├── AdminFees.jsx        # /admin/fees
│       ├── AdminParameters.jsx  # /admin/parameters
│       ├── AdminPresets.jsx     # /admin/presets
│       ├── AdminOrders.jsx      # /admin/orders
│       ├── AdminWidget.jsx      # /admin/widget (ROZPRACOVANÉ)
│       ├── AdminAnalytics.jsx   # /admin/analytics
│       └── AdminTeamAccess.jsx  # /admin/team
│
├── services/
│   ├── slicerApi.js             # PrusaSlicer komunikace
│   └── presetsApi.js            # Widget presets API
│
├── utils/
│   ├── adminTenantStorage.js    # Tenant ID entrypoint (getTenantId())
│   ├── adminPricingStorage.js   # Pricing config (modelpricer:{tenantId}:pricing:v3)
│   ├── adminFeesStorage.js      # Fees config (modelpricer:{tenantId}:fees:v3)
│   ├── adminBrandingWidgetStorage.js # Branding + Widget instances
│   └── cn.js                    # clsx + tailwind-merge helper
│
├── styles/
│   └── tailwind.css             # Global styles + CSS custom properties
│
└── Routes.jsx                   # Router konfigurace

/backend-local                   # Express backend (dev)
/docs
├── claude/
│   ├── CLAUDE.md                # Hlavní instrukce pro Claude
│   ├── AGENT_MAP.md             # Mapa agentů
│   ├── Anti-AI-Design-list.md   # Design guardrails
│   ├── widget-prompt.md         # Widget kalkulačka prompt
│   └── PROJECT_STRUCTURE.md     # TENTO SOUBOR
└── widget/
    └── WIDGET_CALC.md           # (bude vytvořeno)
```

---

## 3. Tenant-Scoped Storage

### 3.1 Klíčová Konvence
```
modelpricer:{tenantId}:{namespace}

Příklady:
- modelpricer:test-customer-1:pricing:v3
- modelpricer:test-customer-1:fees:v3
- modelpricer:test-customer-1:branding
- modelpricer:test-customer-1:widgets
```

### 3.2 Storage Helpery

| Helper | Namespace | Účel |
|--------|-----------|------|
| `adminTenantStorage.js` | `tenant_id` | getTenantId(), readTenantJson(), writeTenantJson() |
| `adminPricingStorage.js` | `pricing:v3` | loadPricingConfigV3(), savePricingConfigV3() |
| `adminFeesStorage.js` | `fees:v3` | loadFeesConfigV3(), saveFeesConfigV3() |
| `adminBrandingWidgetStorage.js` | `branding`, `widgets` | getBranding(), getWidgets(), createWidget() |

### 3.3 Pravidla
- **NIKDY** nepoužívat hardcoded tenantId v UI komponentách
- **VŽDY** používat `getTenantId()` z adminTenantStorage.js
- Všechny operace musí být scoped pod tenant namespace

---

## 4. Design Systém

### 4.1 CSS Custom Properties (tokeny)
```css
/* Barvy (HSL) */
--primary: 221.2 83.2% 53.3%;        /* blue-600 */
--secondary: 210 40% 96.1%;          /* slate-100 */
--destructive: 0 84.2% 60.2%;        /* red-500 */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--muted: 210 40% 96.1%;
--border: 214.3 31.8% 91.4%;

/* Shadows (elevation) */
--elevation-1 až --elevation-5

/* Radius */
--radius: 0.5rem (8px)
```

### 4.2 Typografie
```
Font: Inter (400, 500, 600, 700)
Mono: JetBrains Mono

Škála:
- xs: 12px / 16px
- sm: 14px / 20px
- base: 16px / 24px
- lg: 18px / 28px
- xl: 20px / 28px
- 2xl-6xl: 24px-60px
```

### 4.3 Animace
```
transition-micro: 150ms ease-out
transition-layout: 250ms cubic-bezier(0.4, 0, 0.2, 1)

Animace:
- shimmer (loading skeleton)
- fade-in/out
- scale-in
- slide-down/up

Reduced Motion:
@media (prefers-reduced-motion: reduce) { ... }
```

---

## 5. Test-Kalkulačka Architektura

### 5.1 Komponenty Hierarchie
```
TestKalkulacka (main)
├── FileUploadZone (react-dropzone)
├── PrintConfiguration (material, quality, fees)
├── ModelViewer (Three.js + STLLoader)
├── PricingCalculator (quote display)
└── GenerateButton (CTA)
```

### 5.2 Data Flow
```
1. Upload: FileUploadZone → handleFilesUploaded() → uploadedFiles[]
2. Config: PrintConfiguration → onConfigChange() → printConfigs{}
3. Slice: GenerateButton → sliceModelLocal() → backend → result
4. Price: PricingCalculator → calculateOrderQuote() → quote
```

### 5.3 State
```javascript
// Lokální React state
uploadedFiles[]        // modely + status + result
selectedFileId         // aktuálně vybraný
printConfigs{}         // config per model
feeSelections          // výběr fees (Set + Map)
currentStep            // wizard step (1/2/3)

// Z tenant storage
pricingConfig          // modelpricer:{tenantId}:pricing:v3
feesConfig             // modelpricer:{tenantId}:fees:v3
```

---

## 6. Pricing Engine (pricingEngineV3.js)

### 6.1 Pipeline
```
Base (materiál + čas)
    ↓
Fees (flat, percent, per_gram, per_minute, per_cm2, per_cm3, per_piece)
    ↓
Markup (percent nebo flat)
    ↓
Minima (min_price_per_model, min_order_total, min_billed_minutes)
    ↓
Rounding (step, mode)
    ↓
Quote Output
```

### 6.2 Vstup
```javascript
{
  uploadedFiles: [...],
  printConfigs: {...},
  pricingConfig: {
    rate_per_hour,
    materials: [...],
    minimum_price_per_model,
    minimum_order_total,
    markup: { enabled, mode, value },
    rounding: { enabled, step, mode }
  },
  feesConfig: { fees: [...] },
  feeSelections: { selectedFeeIds, feeTargetsById }
}
```

### 6.3 Výstup
```javascript
{
  total: number,
  simple: { material, time, services, discount, markup },
  totals: { modelsTotal, orderFeesTotal, subtotalBeforeMarkup, ... },
  models: [{ id, name, quantity, base, fees, totals }],
  orderFees: [{ id, name, scope, applied, amount, reason }],
  flags: { min_order_total_applied, clamped_to_zero, ... }
}
```

---

## 7. Admin Stránky Pattern

### 7.1 Inicializace
```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  setLoading(true);
  const loaded = loadData(getTenantId()); // ✅ Správně
  setData(loaded);
  setLoading(false);
}, []);
```

### 7.2 Dirty State
```javascript
const isDirty = useMemo(() => {
  return JSON.stringify(current) !== JSON.stringify(savedSnapshot);
}, [current, savedSnapshot]);
```

### 7.3 Save
```javascript
const handleSave = async () => {
  setSaving(true);
  try {
    saveData(getTenantId(), data);
    setSavedSnapshot(data);
    showToast('Uloženo', 'ok');
  } catch (e) {
    showToast('Chyba', 'err');
  } finally {
    setSaving(false);
  }
};
```

---

## 8. Známé Problémy

| Problém | Soubor | Priorita |
|---------|--------|----------|
| Hardcoded tenantId | AdminWidget.jsx (řádek 26) | **P0** |
| Hardcoded customerId | AdminBranding.jsx (řádek 16) | **P0** |
| Chybí Color Picker komponenta | - | **P1** |
| Chybí Modal Dialog komponenta | - | **P1** |
| Chybí Toast/Notification system | - | **P2** |

---

## 9. Chybějící Komponenty pro Widget Builder

- ❌ Color Picker (potřeba react-color nebo @ark-ui/color-picker)
- ❌ Modal Dialog (jen drawer pattern)
- ❌ Toast/Notification
- ❌ Empty State komponenta
- ❌ Skeleton Loading komponenta
- ❌ Stepper/Timeline

---

## 10. Anti-AI Design Pravidla

### Zakázáno:
- Fialovo-modré gradienty + glow všude
- Bento grid na každé sekci
- 3 ikonové boxy bez konkrétní hodnoty
- Generické claimy ("Streamline workflow")
- Fake proof (bez jména/role)
- Přehnané scroll animace

### Povinně:
- Typografie jako hlavní design
- Evidence-first obsah (konkrétní benefity + čísla)
- Aspoň 1–2 unikátní bloky na stránku
- Promyšlené empty/loading/error/success stavy
- Design tokeny + konzistence
- Specifické CTA ("Vyzkoušet demo kalkulace" místo "Get started")

---

## 11. Routy

```javascript
// Public
/                      → Home
/pricing               → Pricing
/support               → Support
/model-upload          → Model Upload
/test-kalkulacka       → Test Kalkulačka (VZOR)

// Admin (nested pod /admin)
/admin                 → Dashboard
/admin/branding        → Branding
/admin/pricing         → Pricing
/admin/fees            → Fees
/admin/parameters      → Parameters
/admin/presets         → Presets
/admin/orders          → Orders
/admin/widget          → Widget Management
/admin/analytics       → Analytics
/admin/team            → Team Access

// Widget (BUDE PŘIDÁNO)
/w/:publicWidgetId     → Public Widget
/admin/widget/builder/:id → Widget Builder
```

---

## 12. Vite Konfigurace

```javascript
// vite.config.mjs
{
  port: 4028,
  alias: { '@': '/src' },
  build: { outDir: 'build' },
  proxy: { '/api': 'http://127.0.0.1:3001' }
}
```

---

*Tento dokument je zdrojem pravdy pro strukturu projektu. Aktualizujte při významných změnách.*
