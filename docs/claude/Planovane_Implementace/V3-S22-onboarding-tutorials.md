# V3-S22: Onboarding a Tutorialy

> **Priorita:** P2 | **Obtiznost:** Low | **Vlna:** 3
> **Zavislosti:** S1 (bug fixes), vetsina admin stranek (S1-S19) by mela existovat
> **Odhadovany rozsah:** ~25 souboru, 3000+ radku kodu, 1.5-2 tydny

---

## A. KONTEXT

### A1. Ucel a cil

Sekce 22 implementuje kompletni onboarding a napovedu pro ModelPricer admin panel.
Cil je minimalizovat "time to value" — cas od prvniho prihlaseni k prvni uspesne
nastavene kalkulacce. Snizuje support dotazy a zvysuje aktivaci novych uzivatelu.

**Tri hlavni pilire:**

1. **Video tutorialy** — serie 8 kratkych videí (3-7 min) pokryvajicich vsechny aspekty
   admin panelu, od zakladniho nastaveni cenotvorby az po vkladani widgetu na web
2. **Interaktivni onboarding pruvodce** — step-by-step wizard pri prvnim prihlaseni,
   ktery provede admina zakladnim nastavenim za 5 minut (branding, ceny, materialy,
   presety, vyzkouseni kalkulacky)
3. **Kontextova napoveda** — tooltipy, inline tipy, empty states s navodem, in-app
   help widget, knowledge base / help center

**Business value:**
- Snizeni churn rate novych uzivatelu (30-50% uzivatelu odejde pokud nepochopi produkt do 10 min)
- Snizeni poctu support ticketu o zakladnim nastaveni (~40% ticketu)
- Zvyseni aktivace (% uzivatelu kteri dokoncí setup a embedují widget)
- Zlepseni NPS (Net Promoter Score) diky lepsí prvni zkusenosti
- SEO benefit z video tutorialu na YouTube (discoverability)
- Template galerie snizuje barieru "prazdneho stavu" (cold start problem)

**Klicove deliverables:**
1. Onboarding wizard (5 kroku) s progress barem
2. Onboarding state tracking (ktery krok, preskoceno, dokonceno)
3. Video tutorial stranka (/tutorials nebo /podpora)
4. Embed video tutorialu v admin panelu (ikona "?" vedle kazde sekce)
5. Kontextove tooltipy u kazdeho duleziteho pole v admin panelu
6. Empty state komponenty s navodem pro prazdne seznamy
7. In-app help widget (plovouci "?" v pravem dolnim rohu)
8. Knowledge base / help center (MDX/Docusaurus)
9. Template galerie (prednastavene konfigurace pro bezne use cases)
10. Gamifikacni elementy (progress bar, checkmarky, konfety po dokonceni)

### A2. Priorita, obtiznost, vlna

**Priorita P2:** Onboarding neni kriticke pro funkcnost produktu, ale ma velky
vliv na adopci a retenci. Produkt bez onboardingu funguje, ale novy uzivatel
pravdepodobne nedokonci setup a odejde.

**Obtiznost Low:** Relativne jednoduche z technickeho hlediska:
- Onboarding wizard je sekvence modalu/formularu (UI only)
- Tooltipy/help jsou staticke texty + jednoducha UI komponenta
- Video tutorialy jsou content (ne kod) — produkce je mimo engineering scope
- Template galerie je predpripraveny JSON (konfigurace)
- Zadna slozita backendova logika, zadne externi API
- Hlavni slozitost je v UX designu a copywritingu (ne v kodu)

**Vlna 3:** Onboarding ma smysl az kdyz existuji admin stranky ktere bude pruvodce
navstevovat. Idealne implementovat po vetsine admin features (S1-S19) aby pruvodce
mohl referencovat vsechny sekce. Nemusi cekat na S20 (API) nebo S21 (dane/enterprise)
protoze ty nejsou soucasti zakladniho onboardingu.

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred S22:**
- **S1** (Bug Fixes & Reaktivita) — stabilni zaklad pro demo
- **Admin stranky** ktere pruvodce navstevuje:
  - AdminBranding (krok 1: branding)
  - AdminPricing (krok 2: cenotvorba)
  - AdminPresets (krok 4: presety)
  - AdminWidget (krok 5: embed kod)
  - Materialy (krok 3 — soucasti AdminPricing nebo samostatna stranka)

**Sekce ktere na S22 NEZAVISI:** Zadna sekce nezavisi na onboardingu. S22 je "leaf node"
v dependency grafu — nic ji neblokuje a nic na ni neceka.

**Paralelni implementace:**
- S22 a S20 (API) mohou bezet plne paralelne
- S22 a S21 (Security/Dane) mohou bezet plne paralelne

### A4. Soucasny stav v codebase

**Co uz existuje:**
- Admin stranky: `/src/pages/admin/AdminBranding.jsx`, `AdminPricing.jsx`,
  `AdminFees.jsx`, `AdminPresets.jsx`, `AdminParameters.jsx`, `AdminOrders.jsx`,
  `AdminWidget.jsx`, `AdminAnalytics.jsx`, `AdminTeamAccess.jsx`, `AdminDashboard.jsx`
- Admin layout: `/src/pages/admin/AdminLayout.jsx` — sidebar navigace
- Routes: `/src/Routes.jsx` — admin routes
- Tenant storage: `/src/utils/adminTenantStorage.js`
- UI komponenty: `/src/components/ui/` — Button, Card, Input, Select, Slider,
  Checkbox, tooltip.jsx, label.jsx, Container, WelcomeHeader
- Existujici tooltip komponenta: `/src/components/ui/tooltip.jsx`
- Support stranka: `/src/pages/support/index.jsx`
- i18n: `/src/i18n.js` — jazykova podpora existuje
- Language context: `/src/contexts/LanguageContext.jsx` (importovano v AdminLayout)

**Co chybi (nutne vytvorit):**
- Onboarding wizard komponenta: `/src/components/onboarding/OnboardingWizard.jsx`
- Onboarding kroky: `/src/components/onboarding/steps/` (5 souboru)
- Onboarding state storage: `/src/utils/adminOnboardingStorage.js`
- HelpIcon komponenta: `/src/components/ui/HelpIcon.jsx`
- EmptyState komponenta: `/src/components/ui/EmptyState.jsx`
- InAppHelp widget: `/src/components/help/InAppHelpWidget.jsx`
- Video tutorial data: `/src/data/tutorials.js`
- Template galerie data: `/src/data/onboardingTemplates.js`
- Tutorial stranka: `/src/pages/tutorials/index.jsx`
- Help center (Docusaurus/VitePress) — externi projekt

### A5. Referencni zdroje a konkurence

**Doporucene OSS knihovny (ze zdrojoveho dokumentu):**

| Knihovna | Stars | Ucel |
|----------|-------|------|
| **Shepherd.js** | 13k+ | Product tours — framework-agnostic |
| **Driver.js** | 22k+ | Highlight + popover guided tours |
| **react-joyride** | 6.5k+ | React product tours |
| **Intro.js** | 22k+ | Step-by-step guides |
| **Floating UI** | 30k+ | Tooltip/popover positioning engine |
| **Tippy.js** | 12k+ | Tooltip library (nadstavba Floating UI) |

**Doporuceny stack:** `Driver.js` nebo `react-joyride` + `Floating UI`

**Oduvodneni volby:**
- `react-joyride` je React-native, snadna integrace do existujiciho kodu
- `Driver.js` je lehci (8kb gzip) a framework-agnostic
- `Floating UI` je zakladni positioning engine (uz pouziva Tippy.js)
- Doporuceni: `react-joyride` pro onboarding wizard + `Floating UI` pro tooltipy

**Konkurence:**
- **AutoQuote3D** — 7 video tutorialu, zadny interaktivni onboarding
- **Stripe Dashboard** — vynikajici onboarding, checklist-based
- **Notion** — interaktivni pruchod s templates
- **Figma** — onboarding s "try it yourself" momenty

**Best practices:**
- Max 5-7 kroku v onboardingu (vice = dropout)
- Umoznit preskoceni a navrat k pruvodci pozdeji
- Progress bar s jasnou indikaci "kde jsem"
- Gamifikace: checkmarky, konfety, badge
- Empty states s CTA (Call to Action) — ne prazdna stranka
- Kontextove tipy: max 2-3 vety, konkretni doporuceni

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `onboarding:v1` (novy storage helper `adminOnboardingStorage.js`)

**localStorage schema pro onboarding stav:**
```json
{
  "schema_version": 1,
  "wizard": {
    "started_at": "2024-01-15T10:00:00Z",
    "completed_at": null,
    "skipped_at": null,
    "current_step": 2,
    "completed_steps": ["branding", "pricing"],
    "step_data": {
      "branding": {
        "logo_uploaded": true,
        "primary_color": "#3B82F6"
      },
      "pricing": {
        "material_rate": 0.50,
        "time_rate": 1.00,
        "min_price": 50
      },
      "materials": {
        "selected": ["pla", "petg"]
      },
      "presets": {
        "method": "default",
        "uploaded_file": null
      }
    }
  },
  "checklist": {
    "branding_set": true,
    "pricing_configured": true,
    "material_added": true,
    "preset_configured": false,
    "widget_tested": false,
    "widget_embedded": false,
    "first_order_received": false
  },
  "tooltips_seen": {
    "pricing_rate_per_gram": true,
    "pricing_rate_per_hour": true,
    "fees_explanation": false
  },
  "tutorials_watched": [
    "intro",
    "pricing"
  ],
  "help_dismissed": false,
  "template_used": null,
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**localStorage klic:** `modelpricer:${tenantId}:onboarding:v1`

**Budouci databazovy model (PostgreSQL):**
```sql
CREATE TABLE user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  current_step INTEGER DEFAULT 1,
  completed_steps VARCHAR(50)[] DEFAULT '{}',
  step_data JSONB DEFAULT '{}',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  skipped_at TIMESTAMP,
  template_used VARCHAR(100)
);

CREATE INDEX idx_user_onboarding_tenant ON user_onboarding(tenant_id);

CREATE TABLE onboarding_checklist (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
  branding_set BOOLEAN DEFAULT false,
  pricing_configured BOOLEAN DEFAULT false,
  material_added BOOLEAN DEFAULT false,
  preset_configured BOOLEAN DEFAULT false,
  widget_tested BOOLEAN DEFAULT false,
  widget_embedded BOOLEAN DEFAULT false,
  first_order_received BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tooltip_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tooltip_id VARCHAR(100) NOT NULL,
  seen_at TIMESTAMP DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT false
);

CREATE INDEX idx_tooltip_user ON tooltip_interactions(user_id);

CREATE TABLE tutorial_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tutorial_id VARCHAR(100) NOT NULL,
  watched_at TIMESTAMP DEFAULT NOW(),
  completion_percent INTEGER DEFAULT 0
);
```

### B2. API kontrakty (endpointy)

**Admin API (interni, session-based):**

| Method | Endpoint | Popis |
|--------|----------|-------|
| GET | /api/admin/onboarding/state | Nacist stav onboardingu |
| PUT | /api/admin/onboarding/state | Ulozit stav onboardingu |
| POST | /api/admin/onboarding/step/{step}/complete | Oznacit krok za dokonceny |
| POST | /api/admin/onboarding/skip | Preskocit onboarding |
| POST | /api/admin/onboarding/restart | Restartovat onboarding |
| GET | /api/admin/onboarding/checklist | Nacist checklist |
| POST | /api/admin/onboarding/template/{id}/apply | Aplikovat template |
| POST | /api/admin/onboarding/tooltip/{id}/seen | Oznacit tooltip za viděny |
| POST | /api/admin/onboarding/tutorial/{id}/watched | Zaznamenat sledovane video |

Vetsina techto endpointu je jednoduchy CRUD nad localStorage/DB — zadna slozita logika.

### B3. Komponentni strom (React)

**Onboarding Wizard (overlay pri prvnim prihlaseni):**
```
OnboardingWizard
  ├── OnboardingOverlay (fullscreen backdrop)
  ├── OnboardingProgressBar (krok X z 5)
  ├── OnboardingSteps
  │   ├── StepWelcome (uvodni obrazovka s "Zacit" / "Preskocit")
  │   ├── StepBranding (upload loga, primární barva)
  │   │   ├── LogoUploader (drag & drop)
  │   │   └── ColorPicker
  │   ├── StepPricing (zakladni ceny)
  │   │   ├── MaterialRateInput (Kc/gram)
  │   │   ├── TimeRateInput (Kc/minuta)
  │   │   └── MinPriceInput (minimalni cena)
  │   ├── StepMaterials (vyber materialu)
  │   │   ├── MaterialCheckboxList (PLA, PETG, ABS, TPU, Nylon)
  │   │   └── AddCustomMaterialButton
  │   ├── StepPresets (nacteni presetu)
  │   │   ├── UploadIniButton (PrusaSlicer .ini)
  │   │   └── UseDefaultButton
  │   └── StepFinish (vyzkouseni + embed kod)
  │       ├── OpenTestCalcButton
  │       └── GetEmbedCodeButton
  └── OnboardingNavigation
      ├── BackButton
      ├── NextButton
      └── SkipButton
```

**Setup Checklist (dashboard widget po dokonceni/preskoceni onboardingu):**
```
SetupChecklist
  ├── ChecklistHeader ("Dokoncete nastaveni")
  ├── ChecklistProgress (60% kompletni — progress bar)
  └── ChecklistItems
      ├── ChecklistItem (branding — done/pending)
      ├── ChecklistItem (pricing — done/pending)
      ├── ChecklistItem (materials — done/pending)
      ├── ChecklistItem (preset — done/pending)
      ├── ChecklistItem (test calculator — done/pending)
      ├── ChecklistItem (embed widget — done/pending)
      └── ChecklistItem (first order — done/pending)
```

**HelpIcon (kontextova napoveda):**
```
HelpIcon
  ├── QuestionMarkIcon (?)
  ├── TooltipPopover (pri hoveru — kratky text)
  └── HelpSidebar (pri kliknuti — detailni popis + odkaz na video/docs)
```

**EmptyState (pro prazdne seznamy):**
```
EmptyState
  ├── EmptyStateIcon (ilustrace/ikona)
  ├── EmptyStateTitle ("Zatim nemate zadne objednavky")
  ├── EmptyStateDescription (kratky popis co delat)
  └── EmptyStateCTA (tlacitko s akci)
```

**InAppHelpWidget (plovouci "?" v pravem dolnim rohu):**
```
InAppHelpWidget
  ├── FloatingButton (kruhovy "?" button)
  └── HelpPanel (slide-up panel)
      ├── SearchBox (full-text hledani v clanckach)
      ├── PopularArticles (5 nejctenejsich)
      ├── VideoTutorialsLink
      └── ContactSupportLink
```

**Tutorial Page (/tutorials):**
```
TutorialsPage
  ├── TutorialHeader ("Video tutorialy")
  ├── TutorialGrid
  │   └── TutorialCard (thumbnail, nazev, delka, popis)
  │       ├── VideoEmbed (YouTube/Vimeo iframe)
  │       └── TutorialMeta (delka, difficulty, related)
  └── TutorialSearch
```

**Template Gallery (v onboarding wizard nebo samostatne):**
```
TemplateGallery
  ├── TemplateGrid
  │   └── TemplateCard
  │       ├── TemplatePreview (screenshot)
  │       ├── TemplateName ("3D Tisk — zakladni")
  │       ├── TemplateDescription
  │       └── UseTemplateButton
  └── TemplatePreviewModal (detail pred aplikaci)
```

### B4. Tenant storage namespace

**Namespace:** `onboarding:v1`
**Helper:** `/src/utils/adminOnboardingStorage.js` (novy soubor)
**Pattern:** `modelpricer:${tenantId}:onboarding:v1`

**Exporty helperu:**
```javascript
// adminOnboardingStorage.js
export function loadOnboardingState()               // nacte cely stav
export function saveOnboardingState(state)           // ulozi stav
export function getWizardState()                     // stav wizardu (current step, completed)
export function completeWizardStep(stepId, data)     // oznaci krok za dokonceny
export function skipWizard()                         // preskoci wizard
export function restartWizard()                      // restartuje wizard
export function isWizardComplete()                   // vraci true pokud dokoncen nebo preskocen
export function shouldShowWizard()                   // vraci true pokud se ma zobrazit
export function getChecklist()                       // vraci checklist stav
export function updateChecklistItem(item, done)      // aktualizuje polozku checklistu
export function markTooltipSeen(tooltipId)           // oznaci tooltip za videny
export function isTooltipSeen(tooltipId)             // kontrola zda tooltip videt
export function markTutorialWatched(tutorialId)      // zaznamena sledovane video
export function getWatchedTutorials()                // vraci pole sledovanych videi
export function applyTemplate(templateId, config)    // aplikuje template konfiguraci
export function getDefaultOnboardingState()          // defaultni stav
```

### B5. Widget integrace (postMessage)

**Onboarding nema primy vliv na widget.** Widget funguje nezavisle na stavu onboardingu.

Neprime vazby:
- Onboarding wizard zapisuje konfiguraci (branding, pricing, materialy, presety)
  do standardnich tenant storage namespaces (`pricing:v3`, `fees:v3`, atd.)
- Widget tyto zmeny reflektuje pri dalsim renderovani
- Krok 5 (vyzkouseni) otevre testovaci kalkulacku, ne widget primo

**PostMessage pro budouci embed preview v onboardingu:**
```json
{
  "type": "MODELPRICER_ONBOARDING_PREVIEW",
  "payload": {
    "step": "branding",
    "preview_data": {
      "logo_url": "data:image/png;base64,...",
      "primary_color": "#3B82F6"
    }
  }
}
```

### B6. Pricing engine integrace

**Onboarding wizard v kroku 2 (Cenotvorba) zapisuje primo do `pricing:v3` namespace.**

Flow:
1. Uzivatel zada material rate, time rate, min price v onboarding wizardu
2. Wizard zavola `savePricingConfigV3()` z `/src/utils/adminPricingStorage.js`
3. Data jsou ulozena do `modelpricer:${tenantId}:pricing:v3`
4. Pricing engine (`pricingEngineV3.js`) je pouziva pri dalsich kalkulacich

**Kriticke:** Onboarding NESMI mit vlastni kopii pricing dat. Vzdy zapisuje do
existujicich storage helperu (pricing, fees, branding). Onboarding storage (`onboarding:v1`)
obsahuje POUZE stav pruvodce (ktery krok, co je dokonceno), NE konfiguraci.

**Template galerie — pricing presets:**
```javascript
// Priklad template "3D Tisk — zakladni"
const basicPrintingTemplate = {
  id: "tmpl_basic_printing",
  name: "3D Tisk — zakladni",
  description: "Zakladni konfigurace pro FDM tiskove sluzby",
  pricing: {
    rate_per_hour: 60,  // 60 Kc/hod = 1 Kc/min
    materials: [
      { key: "pla", name: "PLA", price_per_gram: 0.50, enabled: true },
      { key: "petg", name: "PETG", price_per_gram: 0.70, enabled: true }
    ],
    minimum_price_per_model: 50,
    rounding: { enabled: true, step: 10, mode: "up" }
  },
  branding: {
    primary_color: "#3B82F6",
    font_family: "Inter"
  }
};
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-spec-design-onboarding` | UX design wizardu, flow, copy | Wireframy, copy texty | P0 |
| `mp-mid-design-ux` | Celkovy UX review, consistency s admin panelem | Vsechny onboarding soubory | P0 |
| `mp-mid-frontend-admin` | Implementace wizardu a admin komponent | `/src/components/onboarding/*.jsx` | P0 |
| `mp-spec-fe-forms` | Formulare v onboarding krocich (pricing, materials) | Step komponenty | P1 |
| `mp-mid-storage-tenant` | Storage helper `adminOnboardingStorage.js` | `/src/utils/adminOnboardingStorage.js` | P0 |
| `mp-spec-fe-routing` | Route /tutorials, integrace wizardu do AdminLayout | `/src/Routes.jsx` | P0 |
| `mp-sr-design` | Design system — HelpIcon, EmptyState, InAppHelp | `/src/components/ui/HelpIcon.jsx`, `EmptyState.jsx` | P1 |
| `mp-spec-design-a11y` | Accessibility audit wizardu a tooltipù | Vsechny onboarding soubory | P1 |
| `mp-mid-design-system` | Animace (konfety, progress, transitions) | CSS/Framer Motion | P2 |
| `mp-sr-i18n` | Preklady onboarding textu (CZ + EN) | i18n JSON soubory | P1 |
| `mp-spec-i18n-translations` | Konkretni preklady | i18n soubory | P1 |
| `mp-sr-docs` | Knowledge base struktura a obsah | `/docs/help-center/` | P2 |
| `mp-spec-docs-user` | Obsahove clanky pro help center | MDX soubory | P2 |
| `mp-spec-test-build` | Build verifikace | Build pipeline | P0 |
| `mp-spec-test-e2e` | E2E testy onboarding flow | Playwright testy | P1 |

### C2. Implementacni kroky (poradi)

**Faze 1: Zaklady (3-4 dny)**
1. **Vytvorit `adminOnboardingStorage.js`** (namespace `onboarding:v1`)
   - Schema, defaults, CRUD pro wizard stav, checklist, tooltipy
   - Zavislosti: zadne
2. **Vytvorit zakladni UI komponenty**
   - `HelpIcon.jsx` — ikona "?" s tooltip + sidebar
   - `EmptyState.jsx` — pouzitelny across admin stranek
   - Zavislosti: zadne (paralelne s 1)
3. **Vytvorit data soubory**
   - `/src/data/tutorials.js` — metadata o video tutorialech
   - `/src/data/onboardingTemplates.js` — template konfigurace
   - `/src/data/tooltipContent.js` — texty tooltipu pro vsechna pole
   - Zavislosti: zadne (paralelne s 1, 2)

Kroky 1, 2, 3 mohou bezet plne paralelne.

**Faze 2: Onboarding Wizard (3-4 dny)**
4. **OnboardingWizard hlavni komponenta**
   - Overlay, progress bar, navigace (zpet/dalsi/preskocit)
   - Zavislosti: 1 (storage helper)
5. **Onboarding kroky (5 souboru)**
   - `StepWelcome.jsx` — uvitani, "Zacit" / "Preskocit"
   - `StepBranding.jsx` — upload loga, barva (zapisuje do branding storage)
   - `StepPricing.jsx` — material rate, time rate, min price (zapisuje do pricing:v3)
   - `StepMaterials.jsx` — vyber materialu (zapisuje do pricing:v3)
   - `StepPresets.jsx` — upload .ini nebo default (zapisuje do presets storage)
   - `StepFinish.jsx` — test kalkulacka + embed kod
   - Zavislosti: 4 (wizard framework), 1 (storage)
6. **Integrace wizardu do AdminLayout**
   - Kontrola `shouldShowWizard()` pri renderovani AdminLayout
   - Zobrazeni wizardu jako overlay pokud neni dokoncen
   - Zavislosti: 4, 5

Kroky 4 a 5 musi byt sekvencni (5 zavisi na 4). Krok 6 zavisi na 4 a 5.

**Faze 3: Kontextova napoveda (2-3 dny)**
7. **HelpIcon integrace do admin stranek**
   - Pridat HelpIcon ke kazdemu dulezitemu poli v AdminPricing, AdminFees, AdminBranding, atd.
   - Pouzit texty z `/src/data/tooltipContent.js`
   - Zavislosti: 2 (HelpIcon komponenta), 3 (tooltip data)
8. **EmptyState integrace**
   - Nahradit prazdne stavy (zadne objednavky, materialy, presety) komponentou EmptyState
   - Zavislosti: 2 (EmptyState komponenta)
9. **InAppHelpWidget**
   - Plovouci "?" button v pravem dolnim rohu admin panelu
   - Search, popularni clanky, odkaz na tutorials
   - Zavislosti: 3 (tutorial data)

Kroky 7, 8, 9 mohou bezet paralelne (ruzni agenti).

**Faze 4: Tutorials a Help Center (2-3 dny)**
10. **Tutorial stranka** (/tutorials)
    - Grid s kartami tutorialu
    - Video embed (YouTube/Vimeo iframe)
    - Zavislosti: 3 (tutorial data)
11. **Setup Checklist widget na dashboard**
    - Widget v AdminDashboard s checklistem "co jeste zbyte nastavit"
    - Zavislosti: 1 (checklist v storage)
12. **Template galerie**
    - Modal/stranka s prednastavenymi konfiguracemi
    - "Pouzit template" -> zapise do prislusnych storage namespace
    - Zavislosti: 3 (template data)

Kroky 10, 11, 12 mohou bezet paralelne.

**Faze 5: Finalizace (1-2 dny)**
13. **Routes a navigace**
    - Route /tutorials, integrace do navigace
    - Zavislosti: 10
14. **i18n preklady**
    - CZ a EN texty pro vsechny onboarding komponenty
    - Zavislosti: 4-12 (vsechny texty finalni)
15. **E2E testy**
    - Zavislosti: vsechny predchozi
16. **Accessibility audit**
    - Zavislosti: vsechny predchozi

### C3. Kriticke rozhodovaci body

1. **react-joyride vs. Driver.js vs. vlastni implementace**
   - react-joyride: Pro — React-native, snadna integrace. Proti — 45kb gzip, zavislost
   - Driver.js: Pro — 8kb, framework-agnostic. Proti — nutny React wrapper
   - Vlastni: Pro — plna kontrola, zadna zavislost. Proti — vice prace
   - **Doporuceni:** Vlastni implementace pro onboarding wizard (full-screen modal,
     jednoduchy) + Floating UI pro tooltipy (uz pouziva existujici tooltip.jsx)

2. **Video hosting**
   - YouTube: Pro — bezplatny, SEO, embed. Proti — reklamy, branding YouTube
   - Vimeo: Pro — cisty player, bez reklam. Proti — placeny pro vice videi
   - Self-hosted (Cloudflare Stream/Mux): Pro — plna kontrola. Proti — naklady
   - **Doporuceni:** YouTube (embed bez reklam pres youtube-nocookie.com) + budouci
     migrace na Cloudflare Stream

3. **Knowledge base platforma**
   - Docusaurus: Pro — React, MDX, search, bezplatny. Proti — dalsi build step
   - VitePress: Pro — rychly, Vite-based. Proti — Vue (ne React)
   - Vlastni v aplikaci: Pro — bezesva integrace. Proti — udrzba
   - **Doporuceni:** Docusaurus jako samostatny deployment na help.modelpricer.com

4. **Template galerie — scope**
   - Minimalni: 3 templates (zakladni, pokrocily, e-shop)
   - Stredni: 5-8 templates pro ruzne industrie
   - **Doporuceni:** Zacit s 3 templates, rozsirit dle feedbacku

5. **Gamifikace — rozsah**
   - Minimalni: progress bar + checkmarky
   - Stredni: + konfety po dokonceni + badge "Setup Complete"
   - Plna: + XP body, leaderboard (overkill pro admin tool)
   - **Doporuceni:** Stredni — progress + checkmarky + konfety (canvas-confetti lib, 4kb)

### C4. Testovaci strategie

**Unit testy:**
- Onboarding storage CRUD (create, read, update, step completion)
- `shouldShowWizard()` logika (novy uzivatel, dokonceny, preskoceny, navrat)
- Template aplikace (spravne zapisuje do pricing/branding storage)
- Checklist auto-detection (automaticke zaznamenani ze branding je nastaven)
- Tooltip seen tracking

**Integration testy:**
- Wizard flow: krok 1 -> 2 -> 3 -> 4 -> 5 -> dokonceni
- Wizard preskoceni -> checklist se zobrazi na dashboardu
- Template aplikace -> pricing config obsahuje spravne hodnoty
- HelpIcon -> tooltip se zobrazi -> sidebar se otevre

**E2E testy (Playwright):**
- Novy uzivatel: prihlaseni -> wizard se zobrazi -> projit vsech 5 kroku -> dokonceni
- Preskoceni: wizard -> "Preskocit" -> dashboard s checklistem
- Navrat: preskoceni -> klik "Dokoncit nastaveni" -> wizard pokracuje
- Tooltip: hover nad "?" -> tooltip se zobrazi se spravnym textem
- Empty state: admin orders s nulou objednavek -> zobrazi EmptyState s CTA
- Tutorial stranka: navigace -> video se nacte -> "sledovano" se zaznamena

**Nastroje:** Vitest (unit), Playwright (E2E), manual UX review

### C5. Migrace existujicich dat

**Zadna migrace dat** — S22 je kompletne novy subsystem.

**Detekce existujiciho nastaveni:**
Pri prvnim pristupu `shouldShowWizard()` kontroluje:
1. Existuje `onboarding:v1` v storage? Pokud ano, respektuj stav.
2. Pokud ne, zkontroluj zda tenant uz ma nastaveni (pricing:v3, branding, atd.)
   - Pokud ano (existujici uzivatel): nezbrazovat wizard, nastavit checklist dle realnych dat
   - Pokud ne (novy uzivatel): zobrazit wizard

```javascript
export function shouldShowWizard() {
  const state = loadOnboardingState();

  // Uz dokonceno nebo preskoceno
  if (state.wizard.completed_at || state.wizard.skipped_at) return false;

  // Kontrola zda je to opravdu novy uzivatel
  // Pokud uz ma pricing config, pravdepodobne neni novy
  const pricingConfig = loadPricingConfigV3();
  const hasPricing = pricingConfig?.rate_per_hour > 0
                  || (pricingConfig?.materials?.length > 0);

  if (hasPricing && !state.wizard.started_at) {
    // Existujici uzivatel — preskocit wizard, ale naplnit checklist
    skipWizardSilently();
    return false;
  }

  return true;
}
```

---

## D. KVALITA

### D1. Security review body

**P1 — Dulezite (onboarding neni security-critical, ale ma sve pozadavky):**
- [ ] Template galerie neobsahuje executable kod (jen JSON konfigurace)
- [ ] Video embed pouziva youtube-nocookie.com (GDPR)
- [ ] InAppHelp widget neslouzi externi obsah (jen staticke clanky)
- [ ] Onboarding storage neobsahuje citliva data (jen stav pruvodce)
- [ ] Tooltip texty jsou sanitizovane (XSS prevence)
- [ ] Template "pouziti" validuje data pred zapisem do pricing/branding storage
- [ ] Zadne externi skripty v onboarding komponentach

**P2 — Doporucene:**
- [ ] Content Security Policy povoluje youtube-nocookie.com pro iframe
- [ ] Tooltip content je staticky (ne z API — zabrani injection)
- [ ] Help center clanky jsou prednactene (ne lazy-loaded z externiho zdroje)

### D2. Performance budget

| Metrika | Target | Mereni |
|---------|--------|--------|
| Wizard render time | < 200ms | React Profiler |
| Wizard step transition | < 100ms | UX benchmark |
| Tooltip show delay | 200-500ms (hover) | CSS transition |
| EmptyState render | < 50ms | React Profiler |
| InAppHelp panel open | < 300ms | Animation benchmark |
| Tutorial page load | < 2s | Lighthouse |
| Template application | < 500ms | Storage write benchmark |
| Onboarding storage read | < 10ms | Storage benchmark |
| Konfety animace | 60fps, < 3s duration | FPS monitor |
| Total JS bundle increase | < 30kb gzip | Build analysis |

**Bundle size kontrola:**
- Onboarding wizard: max 15kb gzip (vlastni implementace)
- Floating UI (pokud neni uz v bundle): ~8kb gzip
- canvas-confetti: ~4kb gzip
- Celkem novy kod: < 30kb gzip

### D3. Accessibility pozadavky

**Onboarding Wizard:**
- Keyboard navigace (Tab mezi kroky, Enter pro "Dalsi", Escape pro zavreni)
- Focus trap v overlay (focus neodejde mimo wizard)
- aria-label na progress baru ("Krok 2 z 5: Nastaveni cen")
- Screen reader ohlaseni pri prechodu na novy krok (aria-live)
- "Preskocit" tlacitko pristupne z klavesnice (ne jen mysi)
- Barevny kontrast 4.5:1 na vsech textech
- Input labels propojene s inputy (htmlFor)

**HelpIcon:**
- aria-label="Napoveda: {nazev pole}"
- Tooltip se zobrazi pri focus (ne jen hover) — pristupnost klavesnici
- Tooltip obsah cteny screen readarem
- Sidebar/modal pristupny z klavesnice

**EmptyState:**
- aria-label na CTA tlacitku
- Dostatecny kontrast ilustrace/ikony
- Screen reader precte titulek + popis + CTA

**InAppHelp:**
- Plovouci button ma aria-label="Otevrit napovedu"
- Panel se zavre Escape klavesou
- Focus se presune do panelu pri otevreni
- Search box ma aria-label

**Video tutorialy:**
- YouTube embed s title attribute
- Textovy alternativa pro kazde video (popis + kroky)
- Anglicke titulky (v budoucnu i ceske)

### D4. Error handling a edge cases

**Onboarding wizard:**
- Uzivatel zavre prohlizec uprostred wizardu -> stav ulozen, pokracuje pri dalsim prihlaseni
- Upload loga se nezdari -> zobrazit error, umoznit preskoceni kroku
- PrusaSlicer .ini soubor nevalidni -> zobrazit error, nabidnout "Pouzit default"
- Uzivatel klikne "Zpet" na prvnim kroku -> nic se nestane (button disabled)
- Uzivatel klikne "Dalsi" bez vyplneni -> validace s chybovou zpravou (ne silent fail)
- Concurrent pristupy (2 taby) -> posledni zapis vyhrave (localStorage limit)

**Tooltipy:**
- Tooltip se nevejde na obrazovku -> Floating UI automaticky repositionuje
- Velmi dlouhy tooltip text -> max-width + scroll
- Tooltip na dotykove obrazovce -> klik misto hover

**Empty states:**
- Admin stranka s daty se nacita pomalu -> loading skeleton (ne empty state)
- Rozliseni "nacitam" vs. "opravdu prazdne" -> loading state flag

**Template galerie:**
- Template nekompatibilni s aktualni verzi -> varovani pred aplikaci
- Template prepise existujici nastaveni -> potvrzovaci dialog
- Aplikace template se nezdarila -> rollback, error message

**Video tutorialy:**
- YouTube nedostupny (blokace, offline) -> fallback text s kroky
- Video smazano z YouTube -> periodická kontrola, fallback

### D5. i18n pozadavky

**Onboarding texty (CZ + EN):**
```
admin.onboarding.welcome.title = "Vitejte v ModelPricer!" / "Welcome to ModelPricer!"
admin.onboarding.welcome.subtitle = "Provedeme vas nastavenim za 5 minut."
admin.onboarding.step.branding = "Vase znacka"
admin.onboarding.step.pricing = "Nastaveni cen"
admin.onboarding.step.materials = "Materialy"
admin.onboarding.step.presets = "Tiskova kvalita"
admin.onboarding.step.finish = "Vyzkousejte to!"
admin.onboarding.btn.next = "Dalsi"
admin.onboarding.btn.back = "Zpet"
admin.onboarding.btn.skip = "Preskocit"
admin.onboarding.btn.finish = "Dokoncit"
admin.onboarding.tip.pricing.material = "Doporucujeme 0.30-0.80 Kc/g pro PLA"
...
```

**Tooltip texty (CZ + EN):**
```
tooltip.pricing.rate_per_gram = "Zakladni cena za 1 gram materialu."
tooltip.pricing.rate_per_hour = "Cena za 1 hodinu tisku."
tooltip.pricing.min_price = "Minimalni cena za jeden model."
tooltip.fees.explanation = "Priplaky se pridavaji k zakladni cene."
...
```

**Video tutorial titulky:** Primarni CZ, sekundarni EN subtitles

**Empty state texty (CZ + EN):**
```
emptyState.orders.title = "Zatim nemate zadne objednavky"
emptyState.orders.description = "Objednavky se zobrazi, jakmile zakaznici zacnou pouzivat kalkulacku."
emptyState.orders.cta = "Jak ziskat prvni objednavky?"
emptyState.materials.title = "Zatim nemate zadne materialy"
...
```

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flagy:**
- `FEATURE_ONBOARDING_WIZARD` — interaktivni pruvodce
- `FEATURE_HELP_TOOLTIPS` — kontextove tooltipy v admin panelu
- `FEATURE_IN_APP_HELP` — plovouci help widget
- `FEATURE_TEMPLATE_GALLERY` — template galerie

**Postupny rollout:**
1. **Alpha** (den 1-3): Onboarding wizard + storage
   - Testovani flow na demo uctech
   - Sber feedbacku od interniho tymu
2. **Beta** (den 4-7): Tooltipy + Empty states + InAppHelp
   - Zapnuto pro vsechny nove registrace
   - Existujici uzivatele: wizard se nezobrazi (respektuje existujici setup)
3. **GA** (den 8+): Vsechny features verejne
   - Template galerie
   - Tutorial stranka
   - Help center (externi Docusaurus)

**Rollback plan:**
- Kazdy feature flag lze vypnout nezavisle
- Pokud wizard zpusobuje problemy -> vypnout `FEATURE_ONBOARDING_WIZARD`
- Data v `onboarding:v1` zustanou, wizard se proste nezobrazi

### E2. Admin UI zmeny

**AdminLayout.jsx zmeny:**
- Onboarding wizard overlay se renderuje uvnitr AdminLayout (nad obsahem)
- Kontrola `shouldShowWizard()` v useEffect

**AdminDashboard.jsx zmeny:**
- Novy widget: "Setup Checklist" (pokud neni vse dokonceno)
- Umisteni: nahore, pred ostatnimi widgety
- Zmizi az je checklist 100% kompletni

**Vsechny admin stranky — HelpIcon integrace:**
- `AdminPricing.jsx`: HelpIcon u rate_per_gram, rate_per_hour, minimum_price, markup, rounding
- `AdminFees.jsx`: HelpIcon u nazvu sekce, typu fee, charge_basis
- `AdminBranding.jsx`: HelpIcon u logo upload, color picker, font selector
- `AdminPresets.jsx`: HelpIcon u upload .ini, viditelnost presetu
- `AdminOrders.jsx`: EmptyState pokud zadne objednavky
- `AdminWidget.jsx`: HelpIcon u embed kodu, domain whitelist

**Routes.jsx zmeny:**
```javascript
import TutorialsPage from './pages/tutorials';

// Verejná route (neni pod admin):
<Route path="/tutorials" element={<TutorialsPage />} />
```

### E3. Widget zmeny

**Zadne prime zmeny widgetu.** Onboarding je admin-only feature.

Widget se meni neprime — onboarding wizard zapisuje konfiguraci do existujicich
tenant storage namespaces (pricing:v3, branding, atd.) a widget tyto zmeny
reflektuje pri renderovani.

### E4. Dokumentace pro uzivatele

**Video tutorialy (8 videi):**

| # | Nazev | Delka | Obsah |
|---|-------|-------|-------|
| 1 | Uvod do ModelPricer | 3-5 min | Navigace, sekce, workflow |
| 2 | Nastaveni cenotvorby | 5-7 min | Pricing stranka, testovaci kalkulacka |
| 3 | Sprava materialu a barev | 4-6 min | Pridani materialu, barvy, aktivace |
| 4 | Presety a parametry tisku | 5-7 min | Upload .ini, konfigurace, viditelnost |
| 5 | Priplaky a sluzby | 4-6 min | Fees stranka, typy priplatku, podminky |
| 6 | Vlozeni kalkulacky na web | 3-5 min | Embed kod, WordPress, Shopify, domeny |
| 7 | Sprava objednavek | 5-7 min | Orders, filtry, detail, stavy, export |
| 8 | Branding a vzhled | 3-5 min | Logo, barvy, font, nahled |

**Produkce videi:**
- Format: screencast s voice-over (1080p)
- Nastroj: OBS Studio (nahravani) + DaVinci Resolve (editace)
- Hosting: YouTube (embed pres youtube-nocookie.com)
- Playlist: "ModelPricer — Zaciname"

**Help center clanky (Docusaurus):**
```
/docs
  /getting-started/
    introduction.mdx
    quick-setup.mdx
    first-order.mdx
  /admin-panel/
    dashboard.mdx
    pricing.mdx
    materials.mdx
    presets.mdx
    fees.mdx
    orders.mdx
    branding.mdx
    widget.mdx
  /widget/
    embedding.mdx
    customization.mdx
    troubleshooting.mdx
  /integrations/
    wordpress.mdx
    shopify.mdx
    api.mdx
  faq.mdx
```

### E5. Metriky uspechu (KPI)

| KPI | Target (3 mesice) | Mereni |
|-----|-------------------|--------|
| Onboarding completion rate | > 70% | Storage analytics |
| Onboarding skip rate | < 30% | Storage analytics |
| Time to complete wizard | < 5 min | Wizard timestamps |
| Checklist completion rate | > 50% (vsech 7 polozek) | Checklist analytics |
| Widget embed rate (po onboardingu) | > 60% | Checklist item |
| First order rate (do 7 dnu) | > 20% | Order analytics |
| Support tickets (setup related) | -40% oproti pred onboardingem | Support system |
| Tutorial video views | 500+ / mesic | YouTube analytics |
| Tutorial completion rate | > 60% (cele video) | YouTube analytics |
| HelpIcon click rate | > 10% uzivatelu | Tooltip tracking |
| InAppHelp usage | > 20% uzivatelu | Help widget tracking |
| NPS score (po onboardingu) | > 40 | In-app survey |
| Template usage rate | > 30% novych registraci | Template tracking |
| EmptyState CTA click rate | > 25% | Event tracking |
| Aktivace (setup done + 1 objednavka) | > 15% novych registraci | Funnel analytics |
