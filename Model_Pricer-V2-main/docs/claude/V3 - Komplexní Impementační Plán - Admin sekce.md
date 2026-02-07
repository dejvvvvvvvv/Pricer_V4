

# **OPEN SOURCE PROJEKTY PRO MODELPRICER \- KOMPLETNÍ PŘEHLED**

## **📋 RYCHLÝ PŘEHLED (TREE)**

SEKCE 1: Bug Fixes & Reaktivita  
├── Zustand / Jotai (state management)  
├── @preact/signals-react (reaktivní ceny)  
└── Immer (immutable state)

SEKCE 2: Kontaktní formulář & Objednávky  
├── React Hook Form  
├── Zod (validace)  
└── Resend / Nodemailer (emaily)

SEKCE 3: Podpora více formátů souborů  
├── Three.js (STLLoader, OBJLoader, 3MFLoader)  
├── usco-3mf-parser  
├── three-mf  
├── opencascade.js (STEP/IGES)  
└── Online-3D-Viewer

SEKCE 4: Doprava a časy doručení  
├── Karrio (self-hosted shipping API)  
├── PurplShip OSS  
└── node-shipping-ups/fedex/dhl

SEKCE 5: Množstevní slevy  
└── Vlastní implementace (pricing engine)

SEKCE 6: Post-processing  
└── Vlastní implementace

SEKCE 7: Emailové notifikace  
├── Nodemailer  
├── React Email  
├── MJML  
├── BullMQ (fronty)  
└── Resend

SEKCE 8: Printability Check & Mesh analýza  
├── GridSpace Kiri:Moto / Mesh:Tool  
├── manifold-3d (WASM)  
├── meshoptimizer  
└── three-mesh-bvh

SEKCE 9: Express pricing & Upselly  
└── Vlastní implementace

SEKCE 10: Kupóny a promo akce  
├── Voucherify (má open-source alternativu)  
└── Vlastní implementace

SEKCE 11: Chat a komentáře  
├── Chatwoot (self-hosted)  
├── Socket.io / Ably  
├── Liveblocks  
└── TipTap (rich text editor)

SEKCE 12: Zákaznický portál  
├── Auth.js (NextAuth)  
├── Lucia Auth  
├── Keycloak (enterprise SSO)  
└── Supabase Auth

SEKCE 13: Generování dokumentů  
├── React-PDF / @react-pdf/renderer  
├── PDFKit  
├── Puppeteer/Playwright (HTML→PDF)  
├── pdf-lib  
└── docx (Word generování)

SEKCE 14: Kanban board  
├── react-trello (2.2k ⭐)  
├── @dnd-kit/core  
├── react-beautiful-dnd  
└── react-kanban

SEKCE 15: Rozšířené cenotvorby  
└── json-rules-engine

SEKCE 16: Multi-language & Multi-currency  
├── next-intl / react-i18next / i18next  
├── Lingui  
├── dinero.js (currency)  
├── currency.js  
└── Intl API (nativní)

SEKCE 17: E-commerce pluginy  
├── @woocommerce/woocommerce-rest-api  
├── @shopify/shopify-api  
└── Medusa.js (headless commerce)

SEKCE 18: Pokročilé funkce  
├── Git-like versioning (vlastní)  
├── Prisma (ORM)  
└── PostgreSQL

SEKCE 19: CRM, Marketing, Analytika  
├── Plausible Analytics  
├── Matomo  
├── Umami  
├── Metabase (BI)  
├── Apache Superset  
├── Cube.js  
├── Recharts / Chart.js / Tremor  
├── RudderStack (CDP)  
└── Meilisearch

SEKCE 20: Public API & Developer Portal  
├── Swagger/OpenAPI \+ swagger-ui-express  
├── Redoc  
├── Stoplight Elements  
├── express-rate-limit  
├── helmet.js  
└── Hono / Fastify

SEKCE 21: Security, Taxes, Enterprise  
├── Casbin (RBAC/ABAC)  
├── CASL  
├── node-tax-calculator  
├── Avalara API wrapper  
├── argon2 / bcrypt  
├── jose (JWT)  
└── zxcvbn (password strength)

SEKCE 22: Onboarding & Tutoriály  
├── Shepherd.js  
├── Driver.js  
├── react-joyride  
├── Intro.js

└── Floating UI (tooltips)

---

## **DETAILNÍ ROZPIS PO SEKCÍCH**

---

### **SEKCE 1: BUG FIXES & REAKTIVNÍ CENOTVORBA**

**Cíl:** Real-time přepočet ceny při změně množství/barvy bez refresh

| Knihovna | GitHub | Hvězdy | Proč použít |
| ----- | ----- | ----- | ----- |
| **Zustand** | zustand | 48k+ ⭐ | Minimalistický state management, perfektní pro reaktivní ceny |
| **Jotai** | pmndrs/jotai | 18k+ ⭐ | Atomic state, skvělé pro nezávislé stavy jednotlivých modelů |
| **@preact/signals-react** | preactjs/signals | 4k+ ⭐ | Ultra-rychlé reaktivní signály |
| **Immer** | immerjs/immer | 27k+ ⭐ | Immutable state updates jednoduše |

**Doporučení:** `Zustand` pro globální stav kalkulačky \+ `Jotai` pro per-model stav presetů

---

### **SEKCE 2: KONTAKTNÍ FORMULÁŘ & DOKONČENÍ OBJEDNÁVKY**

| Knihovna | GitHub | Hvězdy | Proč použít |
| ----- | ----- | ----- | ----- |
| **React Hook Form** | react-hook-form | 41k+ ⭐ | Nejlepší form library, minimální re-rendery |
| **Zod** | colinhacks/zod | 33k+ ⭐ | TypeScript-first schema validace |
| **Yup** | jquense/yup | 22k+ ⭐ | Alternativa k Zod, více mature |
| **Resend** | resend | \- | Moderní email API (má i OSS část) |
| **Nodemailer** | nodemailer/nodemailer | 16k+ ⭐ | Klasika pro odesílání emailů |

**Doporučení:** `React Hook Form` \+ `Zod` \+ `Nodemailer`

---

### **SEKCE 3: PODPORA VÍCE FORMÁTŮ 3D SOUBORŮ**

| Knihovna | GitHub | Popis |
| ----- | ----- | ----- |
| **Three.js** | mrdoob/three.js | 102k+ ⭐ |
| **usco-3mf-parser** | usco/3mf-parser | Lightweight 3MF parser pro browser \+ Node |
| **three-mf** | npm | TypeScript-first 3MF parsing |
| **opencascade.js** | ocjs.org | WASM port OpenCASCADE pro STEP/IGES |
| **Online-3D-Viewer** | kovacsv/Online3DViewer | 2k+ ⭐ |
| **model-viewer** | google/model-viewer | 6.5k+ ⭐ |

**Doporučení:** `Three.js` jako základ \+ `usco-3mf-parser` pro 3MF \+ `opencascade.js` pro STEP

---

### **SEKCE 4: DOPRAVA A ČASY DORUČENÍ**

| Knihovna | GitHub | Popis |
| ----- | ----- | ----- |
| **Karrio** | karrioapi/karrio | 1.2k+ ⭐ |
| **PurplShip OSS** | purplship | Open-source multi-carrier API |
| **Vendure** | vendure-ecommerce/vendure | 5.5k+ ⭐ |
| **Medusa** | medusajs/medusa | 25k+ ⭐ |

**Doporučení:** `Karrio` pro self-hosted shipping rates/labels/tracking

---

### **SEKCE 5: MNOŽSTEVNÍ SLEVY**

**Není potřeba externí knihovna** \- implementuje se jako součást pricing engine.

Užitečné utility:

| Knihovna | Účel |
| ----- | ----- |
| **decimal.js** | Přesná desetinná aritmetika |
| **dinero.js** | Práce s měnami a cenami |

---

### **SEKCE 6: POST-PROCESSING MOŽNOSTI**

**Vlastní implementace** \- jedná se o konfigurační data, ne složitou logiku.

---

### **SEKCE 7: EMAILOVÉ NOTIFIKACE**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **Nodemailer** | nodemailer/nodemailer | 16k+ ⭐ | SMTP sending |
| **React Email** | resend/react-email | 14k+ ⭐ | React komponenty pro emaily |
| **MJML** | mjmlio/mjml | 17k+ ⭐ | Responsive email framework |
| **BullMQ** | taskforcesh/bullmq | 6k+ ⭐ | Redis-based job queue pro email fronty |
| **email-templates** | forwardemail/email-templates | 3.6k+ ⭐ | Template rendering |
| **Handlebars** | handlebars-lang/handlebars.js | 18k+ ⭐ | Templating engine |

**Doporučení:** `React Email` pro tvorbu šablon \+ `Nodemailer` \+ `BullMQ` pro fronty

---

### **SEKCE 8: PRINTABILITY CHECK & MESH ANALÝZA**

| Knihovna | GitHub | Popis |
| ----- | ----- | ----- |
| **GridSpace Kiri:Moto** | GridSpace/grid-apps | 2k+ ⭐ |
| **Mesh:Tool** | součást grid-apps | Mesh repair/editing |
| **manifold-3d** | elalish/manifold | 1k+ ⭐ |
| **meshoptimizer** | zeux/meshoptimizer | 5k+ ⭐ |
| **three-mesh-bvh** | gkjohnson/three-mesh-bvh | 2.4k+ ⭐ |
| **trimesh** (Python) | mikedh/trimesh | 3k+ ⭐ |

**Doporučení:** `Kiri:Moto` pro browser-based slicing \+ `manifold-3d` pro mesh validation

---

### **SEKCE 9: EXPRESS PRICING & UPSELLY**

**Vlastní implementace** na základě pricing rules engine.

Užitečné:

| Knihovna | Účel |
| ----- | ----- |
| **json-rules-engine** | Pravidlový engine pro pricing |

---

### **SEKCE 10: SLEVOVÉ KUPÓNY A PROMO AKCE**

| Knihovna | Popis |
| ----- | ----- |
| **Vlastní implementace** | Nejčastější volba \- kupónový systém je relativně jednoduchý |
| **Medusa Discounts** | Pokud používáte Medusa, má built-in discounts |

Struktura se většinou dělá vlastní v databázi \- není vhodná obecná knihovna.

---

### **SEKCE 11: CHAT A KOMENTÁŘE**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **Chatwoot** | chatwoot/chatwoot | 21k+ ⭐ | Self-hosted customer engagement platform |
| **Socket.io** | socketio/socket.io | 61k+ ⭐ | Real-time WebSocket komunikace |
| **Liveblocks** | liveblocks/liveblocks | 3k+ ⭐ | Real-time collaboration |
| **TipTap** | ueberdosis/tiptap | 27k+ ⭐ | Rich text editor pro komentáře |
| **Plate** | udecode/plate | 6k+ ⭐ | Headless rich text editor |

**Doporučení:** `Chatwoot` pro zákaznický chat NEBO `Socket.io` \+ vlastní

---

### **SEKCE 12: ZÁKAZNICKÝ PORTÁL (AUTENTIZACE)**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **Auth.js (NextAuth)** | nextauthjs/next-auth | 24k+ ⭐ | Kompletní auth pro Next.js |
| **Lucia** | lucia-auth/lucia | 9k+ ⭐ | Lightweight auth library |
| **Keycloak** | keycloak/keycloak | 23k+ ⭐ | Enterprise SSO (Java) |
| **Supabase Auth** | supabase | Built-in s Supabase |  |
| **Clerk** | má OSS části | Magic links, social login |  |

**Doporučení:** `Auth.js` pro Next.js nebo `Lucia` pro vlastní řešení

---

### **SEKCE 13: AUTOMATICKÉ GENEROVÁNÍ DOKUMENTŮ**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **@react-pdf/renderer** | diegomura/react-pdf | 15k+ ⭐ | React komponenty → PDF |
| **PDFKit** | foliojs/pdfkit | 9.5k+ ⭐ | Nízkoúrovňové PDF generování |
| **pdf-lib** | Hopding/pdf-lib | 7k+ ⭐ | Vytváření a editace PDF |
| **Puppeteer** | puppeteer/puppeteer | 89k+ ⭐ | HTML → PDF via headless Chrome |
| **Playwright** | microsoft/playwright | 67k+ ⭐ | Alternativa k Puppeteer |
| **docx** | dolanmiu/docx | 4k+ ⭐ | Word dokument generování |
| **pdfmake** | bpampuch/pdfmake | 12k+ ⭐ | Deklarativní PDF |
| **jsPDF** | parallax/jsPDF | 29k+ ⭐ | Client-side PDF |

**Doporučení:** `@react-pdf/renderer` pro faktury \+ `Puppeteer` pro komplexní layouts

---

### **SEKCE 14: KANBAN BOARD**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **react-trello** | rcdexta/react-trello | 2.2k ⭐ | Pluggable Kanban komponenty |
| **@dnd-kit/core** | clauderic/dnd-kit | 13k+ ⭐ | Moderní drag & drop |
| **react-beautiful-dnd** | atlassian/react-beautiful-dnd | 33k+ ⭐ | Atlassian's DnD (maintenance mode) |
| **react-kanban** | asseinfo/react-kanban | 652 ⭐ | Jednoduchý Kanban |
| **Shadcn Kanban** | Georgegriff/react-dnd-kit-tailwind-shadcn-ui | 808 ⭐ | DnD-kit \+ Tailwind \+ Shadcn |

**Doporučení:** `@dnd-kit/core` \+ vlastní komponenty NEBO `react-trello` pro rychlý start

---

### **SEKCE 15: ROZŠÍŘENÉ METODY CENOTVORBY**

| Knihovna | GitHub | Popis |
| ----- | ----- | ----- |
| **json-rules-engine** | CacheControl/json-rules-engine | 2.5k+ ⭐ |
| **nools** | C2FO/nools | Rules engine (starší) |

**Doporučení:** `json-rules-engine` pro komplexní pricing pravidla

---

### **SEKCE 16: MULTI-LANGUAGE & MULTI-CURRENCY**

**Lokalizace:**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **next-intl** | amannn/next-intl | 2k+ ⭐ | Nejlepší pro Next.js App Router |
| **react-i18next** | i18next/react-i18next | 9k+ ⭐ | Klasika, velmi flexibilní |
| **Lingui** | lingui/js-lingui | 4.5k+ ⭐ | Moderní i18n s compile-time extrakcí |
| **Format.js (react-intl)** | formatjs/formatjs | 14k+ ⭐ | Standardní ICU message formát |

**Multi-currency:**

| Knihovna | GitHub | Popis |
| ----- | ----- | ----- |
| **dinero.js** | dinerojs/dinero.js | 6.5k+ ⭐ |
| **currency.js** | scurker/currency.js | 3k+ ⭐ |
| **Intl.NumberFormat** | Nativní JS | Built-in formátování |

**Doporučení:** `next-intl` \+ `dinero.js`

---

### **SEKCE 17: E-COMMERCE PLUGINY (WOOCOMMERCE, SHOPIFY)**

| Knihovna | npm | Popis |
| ----- | ----- | ----- |
| **@woocommerce/woocommerce-rest-api** | npm | Oficiální WooCommerce REST API klient |
| **@shopify/shopify-api** | npm | Oficiální Shopify API library |
| **shopify-buy** | Shopify/js-buy-sdk | Storefront API |
| **Medusa.js** | medusajs/medusa | Headless commerce alternativa |
| **Vendure** | vendure-ecommerce/vendure | GraphQL-first headless commerce |

**Doporučení:** Oficiální knihovny \+ `Medusa` jako headless alternativa

---

### **SEKCE 18: POKROČILÉ FUNKCE (VERSIONING, SUPPLY CHAIN)**

| Knihovna | GitHub | Popis |
| ----- | ----- | ----- |
| **Prisma** | prisma/prisma | 39k+ ⭐ |
| **audit-log** | mindfreakthemon/node-auditlog | Audit logging |
| **event-sourcing** | Vlastní pattern | Pro versioning |

Většinou vlastní implementace.

---

### **SEKCE 19: CRM, MARKETING, ANALYTIKA**

**Analytics (self-hosted):**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **Plausible** | plausible/analytics | 20k+ ⭐ | Privacy-focused, lightweight |
| **Umami** | umami-software/umami | 22k+ ⭐ | Simple, fast analytics |
| **Matomo** | matomo-org/matomo | 19k+ ⭐ | Full-featured GA alternativa |
| **PostHog** | PostHog/posthog | 21k+ ⭐ | Product analytics \+ feature flags |

**BI/Dashboards:**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **Metabase** | metabase/metabase | 38k+ ⭐ | Easy BI \+ embedded analytics |
| **Apache Superset** | apache/superset | 63k+ ⭐ | Powerful open-source BI |
| **Cube.js** | cube-js/cube | 18k+ ⭐ | Headless BI / semantic layer |
| **Redash** | getredash/redash | 26k+ ⭐ | Query \+ visualize data |

**Charts:**

| Knihovna | GitHub | Hvězdy |
| ----- | ----- | ----- |
| **Recharts** | recharts/recharts | 24k+ ⭐ |
| **Chart.js** | chartjs/Chart.js | 65k+ ⭐ |
| **Tremor** | tremorlabs/tremor | 16k+ ⭐ |
| **Nivo** | plouc/nivo | 13k+ ⭐ |

**CDP/Data Pipeline:**

| Knihovna | GitHub | Popis |
| ----- | ----- | ----- |
| **RudderStack** | rudderlabs/rudder-server | 4k+ ⭐ |
| **Snowplow** | snowplow/snowplow | 7k+ ⭐ |

**Doporučení:** `Plausible/Umami` \+ `Metabase` \+ `Recharts/Tremor`

---

### **SEKCE 20: PUBLIC API & DEVELOPER PORTAL**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **Swagger/OpenAPI** | swagger-api/swagger-ui | 26k+ ⭐ | API dokumentace standard |
| **swagger-jsdoc** | Surnet/swagger-jsdoc | 1.7k ⭐ | Generování z JSDoc |
| **Redoc** | Redocly/redoc | 23k+ ⭐ | Krásná API dokumentace |
| **Stoplight Elements** | stoplightio/elements | 1.5k ⭐ | API docs komponenty |
| **express-rate-limit** | express-rate-limit | 3k+ ⭐ | Rate limiting |
| **helmet** | helmetjs/helmet | 10k+ ⭐ | Security headers |
| **Hono** | honojs/hono | 20k+ ⭐ | Ultra-fast web framework |
| **Fastify** | fastify/fastify | 32k+ ⭐ | Fast Node.js framework |

**Doporučení:** `OpenAPI` \+ `Redoc` \+ `express-rate-limit`

---

### **SEKCE 21: SECURITY, TAXES, ENTERPRISE**

**Autorizace (RBAC/ABAC):**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **Casbin** | casbin/node-casbin | 2.7k ⭐ | Powerful RBAC/ABAC |
| **CASL** | stalniy/casl | 6k+ ⭐ | Isomorphic authorization |
| **AccessControl** | onury/accesscontrol | 2k+ ⭐ | Role-based access control |

**Security:**

| Knihovna | GitHub | Popis |
| ----- | ----- | ----- |
| **argon2** | ranisalt/node-argon2 | Password hashing |
| **bcrypt** | kelektiv/node.bcrypt.js | Klasické password hashing |
| **jose** | panva/jose | JWT/JWE/JWS |
| **zxcvbn** | dropbox/zxcvbn | Password strength |
| **helmet** | helmetjs/helmet | Security headers |
| **csurf** | expressjs/csurf | CSRF protection |

**Taxes:**

| Knihovna | Popis |
| ----- | ----- |
| **Avalara SDK** | Enterprise tax calculation API |
| **TaxJar API** | Sales tax API |
| Vlastní VAT kalkulace | Pro EU je relativně jednoduché |

**Doporučení:** `CASL` pro autorizaci \+ `argon2` \+ `helmet`

---

### **SEKCE 22: ONBOARDING & TUTORIÁLY**

| Knihovna | GitHub | Hvězdy | Popis |
| ----- | ----- | ----- | ----- |
| **Shepherd.js** | shipshapecode/shepherd | 13k+ ⭐ | Product tours |
| **Driver.js** | kamranahmedse/driver.js | 22k+ ⭐ | Highlight \+ popover |
| **react-joyride** | gilbarbara/react-joyride | 6.5k+ ⭐ | React product tours |
| **Intro.js** | usablica/intro.js | 22k+ ⭐ | Step-by-step guides |
| **Floating UI** | floating-ui/floating-ui | 30k+ ⭐ | Tooltips/popovers positioning |
| **Tippy.js** | atomiks/tippyjs | 12k+ ⭐ | Tooltip library |

**Doporučení:** `Driver.js` nebo `react-joyride` \+ `Floating UI`

---

## **🎯 DOPORUČENÝ TECH STACK (SHRNUTÍ)**

### **Core Stack:**

Frontend: React/Next.js \+ TypeScript  
State: Zustand \+ Jotai (per-model state)  
Forms: React Hook Form \+ Zod  
Styling: Tailwind CSS \+ Shadcn/ui

3D: Three.js \+ usco-3mf-parser

### **Backend:**

Runtime: Node.js/Bun  
Framework: Hono nebo Fastify  
ORM: Prisma  
Database: PostgreSQL  
Queue: BullMQ \+ Redis

Auth: Auth.js nebo Lucia

### **Utilities:**

PDF: @react-pdf/renderer  
Email: React Email \+ Nodemailer \+ BullMQ  
i18n: next-intl  
Currency: dinero.js  
Analytics: Plausible/Umami

API Docs: OpenAPI \+ Redoc

### **3D/Mesh specifické:**

Viewer: Three.js  
3MF: usco-3mf-parser  
STEP: opencascade.js  
Slicing: Kiri:Moto (GridSpace)  
Mesh validation: manifold-3d

G-code: gcode-preview

---

Tento seznam pokrývá všechny 22 sekcí implementačního plánu s konkrétními, dobře dokumentovanými open source projekty, které minimalizují potřebu psaní kódu od nuly.

## **SEKCE 1 — Opravy bugů a nefunkčních prvků v kalkulačce**

Tato sekce řeší okamžité opravy existujících chyb a nefunkčních prvků v zákaznické kalkulačce. Jedná se o nejnižší prioritu implementace ve smyslu pořadí — tyto opravy by měly být provedeny jako první, protože ovlivňují základní funkčnost produktu.

### **1.1 Automatický přepočet ceny při změně parametrů**

**AKTUÁLNÍ STAV:** Když zákazník změní parametr (množství, barvu, materiál, výplň, kvalitu vrstvy, preset), cena se nepřepočítá automaticky. Zákazník musí ručně kliknout na tlačítko "Spočítat cenu" nebo "Přepočítat vše". To vede ke zmatení — zákazník vidí starou cenu, která neodpovídá aktuální konfiguraci.

**CO JE TŘEBA UDĚLAT:**

**Backend:** Endpoint pro přepočet ceny již existuje (používá se tlačítky "Spočítat cenu" a "Přepočítat vše"). Není potřeba měnit backend logiku, stačí frontend úprava.

**Frontend — Varianta A (Doporučená — Debounced auto-recalculation):** Přidat event listenery na všechny konfigurační prvky v kalkulačce: dropdown materiálu, barevné buttony, dropdown kvality vrstvy, slider výplně, checkbox podpěry, pole počet kusů, dropdown preset, checkboxy dodatečných služeb. Při každé změně kteréhokoliv z těchto prvků spustit debounced volání API pro přepočet (debounce 500-800ms). Během přepočtu zobrazit loading indikátor v sekci "Cena a souhrn" (spinner nebo skeleton). Po dokončení aktualizovat všechny cenové údaje: celkovou cenu, rozpad (materiál, čas, služby, sleva, markup), rozpis jednotlivých modelů.

**Frontend — Varianta B (Alternativa — Invalidace \+ prompt):** Při změně parametru označit cenu jako neplatnou — šedý text, přeškrtnutí, nebo varovný badge "Cena neaktuální". Zobrazit výrazné tlačítko "Přepočítat cenu" s animací/pulzem. Po kliknutí přepočítat a obnovit normální zobrazení.

**KDE V KÓDU:** Widget/kalkulačka frontend komponenta — pravděpodobně soubor řešící stav konfigurace modelu. Přidat useEffect/watcher na změny state parametrů, který triggeruje recalculation funkci.

**DŮLEŽITÉ DETAILY:**

* Debounce je nutný zejména u slideru výplně (uživatel táhne \= mnoho změn) a pole počet kusů (uživatel píše).  
* Při přepočtu jednoho modelu se musí aktualizovat i celková cena objednávky (součet všech modelů).  
* Pokud je přepočet v průběhu a uživatel změní další parametr, předchozí request by měl být zrušen (abort controller) a spuštěn nový.  
* Stav "probíhá výpočet" by měl blokovat tlačítko "Přejít k výběru tiskárny" aby zákazník neodeslal objednávku se starou cenou.

---

### **1.2 Per-model preset slicování (místo globálního)**

**AKTUÁLNÍ STAV:** Dropdown "Preset pro slicování" je nyní globální — nachází se v horní části konfiguračního kroku a platí pro celou objednávku. Když zákazník nahraje více modelů (např. cilinder for magnet 12.5mm.stl a small-leg.stl), oba modely sdílejí stejný preset. To je problém, protože zákazník může chtít různé presety pro různé modely (např. rychlý tisk pro jednoduchý díl, kvalitní tisk pro detailní díl).

**CO JE TŘEBA UDĚLAT:**

**Datový model:** Rozšířit strukturu objednávky/modelu o pole preset\_id na úrovni jednotlivého modelu. Aktuálně je preset pravděpodobně uložen na úrovni objednávky/session. Potřeba přesunout na úroveň každého nahraného modelu.

**Backend:** API endpoint pro výpočet ceny musí přijímat preset\_id per model, ne globálně. Slicovací pipeline musí být schopen slicovat každý model s jeho vlastním presetem.

**Frontend — Přesun dropdownu:** Odstranit globální dropdown "Preset pro slicování" z horní části konfiguračního kroku. Místo toho přidat výběr presetu do kontextu každého modelu. Možné umístění:

* (a) V panelu 3D prohlížeče pod informacemi o modelu (rozměry, objem, povrch, čas, materiál)  
* (b) V panelu "Nahrané modely" jako rozbalovací detail u každého modelu  
* (c) Přímo do konfigurační sekce, která se mění podle vybraného modelu. Když uživatel klikne na model v seznamu "Nahrané modely", zobrazí se jeho konfigurace včetně presetu.

**DOPORUČENÉ ŘEŠENÍ:** Varianta (c) — konfigurace se mění podle vybraného modelu. To znamená, že celá sekce Materiál a barva, Kvalita tisku, Množství a preset budou reflektovat nastavení aktuálně vybraného modelu. Při přepnutí modelu se hodnoty přepíší na konfiguraci daného modelu.

**DŮLEŽITÉ DETAILY:**

* Výchozí preset pro nově nahraný model by měl být ten, který je nastaven jako "default" v admin panelu (Admin \> Presets).  
* Při změně presetu u jednoho modelu se nesmí změnit preset ostatních modelů.  
* V rozpisu objednávky (pravý panel) by u každého modelu měl být zobrazen název použitého presetu.  
* Pokud zákazník změní preset, musí se přepočítat cena daného modelu (napojení na bod 1.1).

---

### **1.3 Rychlé předvolby — přeměna na funkční tlačítka presetů**

**AKTUÁLNÍ STAV:** V kalkulačce existují dvě sekce pro výběr presetu: (1) dropdown "Preset pro slicování" nahoře (funkční, ale globální), a (2) sekce "Rychlé předvolby" s třemi kartami Basic/Middle/Pro (nefunkční — tlačítka nic nedělají). Plán je nahradit dropdown presetu právě těmito tlačítky, aby presety byly vizuálně přehlednější a rychleji volitelné.

**CO JE TŘEBA UDĚLAT:**

**Odstranit dropdown "Preset pro slicování":** Celý box s dropdownem odstranit z UI konfiguračního kroku. Ten je nyní zbytečný, protože jeho funkci převezmou tlačítka presetů.

**Přeměnit sekci "Rychlé předvolby" na funkční výběr presetu:** Místo statických karet Basic/Middle/Pro napojit na skutečné presety z admin panelu (Admin \> Presets). Každý preset, který má v adminu zapnutou viditelnost ve widgetu, se zobrazí jako karta/tlačítko. Karta zobrazí: název presetu (velký text), krátký popis/subtitle (volitelný, nastavitelný v adminu). Aktivní/vybraná karta bude vizuálně odlišena (border, pozadí, checkmark). Kliknutí na kartu nastaví daný preset pro aktuálně vybraný model (napojení na bod 1.2).

**Admin panel rozšíření (Admin \> Presets):** Přidat pole "popis pro widget" ke každému presetu — krátký text zobrazený pod názvem na kartě (např. "Rychlý tisk, nízká kvalita"). Přidat pole "pořadí zobrazení" pro řazení karet ve widgetu. Přidat pole "ikona" (volitelné) — možnost vybrat ikonu pro kartu.

**UMÍSTĚNÍ V UI:** Sekce presetových karet by měla být buď:

* (a) Na začátku konfigurace každého modelu (prvně preset, pak materiál, barva, kvalita)  
* (b) Integrovaná do per-model konfigurace (po výběru modelu v panelu "Nahrané modely")

Doporučení: varianta (a) — karty nahoře jako první volba, protože preset ovlivňuje dostupné parametry.

**VIZUÁLNÍ PODOBA:** Karty vedle sebe v jednom řádku (horizontální layout). Responsive — na malých obrazovkách pod sebou. Každá karta: ikona (vlevo), název presetu (tučně), popis (menší text pod názvem). Hover efekt, selected state s primární barvou border/pozadí.

**DŮLEŽITÉ DETAILY:**

* Pokud admin nemá presety viditelné ve widgetu, sekce se nezobrazí vůbec.  
* Pokud je jen jeden preset, může se automaticky vybrat bez zobrazení karet.  
* Výchozí vybraný preset \= ten označený jako "default" v adminu.  
* Změna presetu musí triggerovat přepočet ceny (napojení na 1.1).

---

### **1.4 Odstranění sekce Výsledky slicingu**

**AKTUÁLNÍ STAV:** Na spodní části kalkulačky je sekce "Výsledky slicingu" zobrazující 4 metriky: Doba tisku (NaNh NaNmin — nefunkční), Hmotnost (NaNg — nefunkční), Vrstvy (prázdné), Teplota (200°C). Sekce je nefunkční a dle uživatele zbytečná, protože tyto údaje jsou již dostupné v panelu modelu vpravo (Čas tisku, Materiál/hmotnost).

**CO JE TŘEBA UDĚLAT:**

Odstranit celou sekci "Výsledky slicingu" z frontend kódu kalkulačky. Najít komponentu, která renderuje tuto sekci (pravděpodobně na konci konfiguračního kroku, pod sekcí "Dodatečné služby"), a zcela ji odebrat.

**ALTERNATIVA (pokud by se údaje slicingu chtěly zachovat):** Místo samostatné sekce integrovat relevantní data přímo do panelu modelu vpravo, kde už jsou rozměry, objem, povrch, čas tisku a materiál. Přidat tam i počet vrstev a teplotu (pokud jsou užitečné pro zákazníka). Ale dle zadání je preferováno úplné odstranění.

**DŮLEŽITÉ:** Ujistit se, že odstranění nezlomí žádnou logiku — sekce by měla být čistě zobrazovací (read-only), takže smazání by nemělo ovlivnit výpočetní pipeline.

---

## **SEKCE 2 — Kontaktní formulář a dokončení objednávky**

Tato sekce řeší chybějící krok pro dokončení objednávky — zákazník aktuálně nemá kam zadat své kontaktní údaje, adresu doručení ani poznámku k objednávce. Bez tohoto kroku nelze objednávku reálně odeslat a zpracovat.

### **2.1 Formulář zákaznických údajů**

**AKTUÁLNÍ STAV:** Kalkulačka má 3 kroky: (1) Nahrání souborů, (2) Konfigurace, (3) Kontrola a cena. Po kroku 3 je tlačítko "Přejít k výběru tiskárny" ale chybí kompletní formulář pro zadání kontaktních údajů zákazníka.

**CO JE TŘEBA UDĚLAT:**

**Nový krok v průvodci:** Přidat krok 4 "Kontaktní údaje" nebo rozšířit stávající krok 3 "Kontrola a cena" o formulář. Doporučení: rozšířit krok 3, protože zákazník uvidí shrnutí ceny a zároveň vyplní údaje — je to přirozenější flow.

**Formulářová pole (povinná):**

* Jméno a příjmení (text input)  
* E-mail (email input s validací formátu)  
* Telefon (tel input s validací)

**Formulářová pole (volitelná / zobrazitelná dle nastavení admina):**

* Firma / IČO (pro B2B zákazníky)  
* Doručovací adresa — ulice, město, PSČ, země (skupina polí)  
* Fakturační adresa — checkbox "Stejná jako doručovací" \+ možnost zadat jinou

**Admin konfigurace formuláře:** V admin panelu (nová záložka nebo rozšíření Widget konfigurace) by měl být seznam polí formuláře s možností: zapnout/vypnout pole, nastavit jako povinné/volitelné, změnit label/placeholder, změnit pořadí polí. To umožní každé firmě přizpůsobit formulář svým potřebám (např. B2C firma nepotřebuje IČO, lokální firma nepotřebuje zemi).

**UMÍSTĚNÍ V UI KALKULAČKY:** Na stránce kroku 3 "Kontrola a cena" — pod shrnutím objednávky a cenou, před tlačítkem odeslání. Struktura: Shrnutí objednávky (nahoře) → Kontaktní formulář (uprostřed) → Poznámka (dole) → Tlačítko "Odeslat objednávku".

**VALIDACE:**

* Frontend validace v reálném čase (červený border, chybová hláška pod polem)  
* Backend validace při odeslání (double-check)  
* Email — regex \+ kontrola formátu  
* Telefon — regex pro české/mezinárodní formáty  
* Povinná pole — nesmí být prázdná

**DŮLEŽITÉ DETAILY:**

* Data z formuláře se uloží k objednávce do databáze a zobrazí v admin panelu v detailu objednávky.  
* Pokud bude v budoucnu zákaznický portál (Sekce 12), předvyplnit údaje z profilu přihlášeného zákazníka.  
* GDPR compliance — pod formulářem checkbox "Souhlasím se zpracováním osobních údajů" s odkazem na zásady ochrany soukromí. Tento checkbox bude konfigurovatelný v admin panelu (text, odkaz na stránku).

---

### **2.2 Poznámka k objednávce**

Textarea pole pod kontaktním formulářem s placeholderem typu "Napište speciální požadavky, poznámky k tisku nebo jiné informace..." Maximální délka: 1000 znaků. Počítadlo zbývajících znaků vpravo dole. V admin panelu se poznámka zobrazí v detailu objednávky. Volitelné pole — nepovinné.

---

### **2.3 Shrnutí objednávky před odesláním**

Na kroku 3 "Kontrola a cena" rozšířit stávající panel shrnutí o kompletní přehled objednávky. Zobrazit:

* Seznam všech modelů s názvem, miniaturou, materiálem, presetem, barvou, množstvím a cenou za model  
* Celkovou cenu se všemi složkami (materiál, čas, služby, sleva, markup)  
* Vybrané dodatečné služby  
* Doprava (jakmile bude implementována, Sekce 4\)  
* Kontaktní údaje zákazníka (z formuláře výše)

Tlačítko "Odeslat objednávku" s jasným CTA stylem (primární barva, velké). Nad tlačítkem text "Kliknutím odesíláte nezávaznou poptávku" nebo podobně (konfigurovatelný text v adminu, závisí na tom zda firma chce závazné objednávky nebo nezávazné poptávky).

---

### **2.4 Potvrzovací stránka a email**

Po úspěšném odeslání objednávky zobrazit potvrzovací stránku (krok 4 nebo overlay):

* Zelená ikona checkmarku  
* Text "Děkujeme za Vaši objednávku\!"  
* Číslo objednávky (referenční kód)  
* Shrnutí co bude následovat ("Objednávku nyní zpracováváme. Na email vám přijde potvrzení.")  
* Odhadovaný čas zpracování (pokud je nastaven)

Zároveň odeslat potvrzovací email (základní implementace — detailní emailový systém viz Sekce 7\) s číslem objednávky, shrnutím modelů a ceny, a kontaktem na firmu. Email odesílat přes jednoduchý SMTP nebo transactional email službu (SendGrid, Resend, apod.).

---

## **SEKCE 3 — Podpora více formátů souborů**

Tato sekce řeší rozšíření podporovaných 3D formátů. Aktuálně kalkulačka přijímá pouze .stl soubory, což je omezující — konkurence podporuje .obj, .step/.stp, .3mf a další. Zejména .step formát je silně vyžadován inženýry a průmyslovými zákazníky.

### **3.1 Podpora .obj, .3mf, .step/.stp**

**Backend:** Rozšířit upload endpoint o akceptování nových MIME typů a přípon (.obj, .3mf, .step, .stp).

**Pro .step/.stp soubory** je potřeba konverzní pipeline — STEP je CAD formát, ne mesh formát, takže jej musí backend převést na mesh (STL/OBJ) před slicováním. Knihovny:

* OpenCASCADE (open source, C++)  
* FreeCAD Python API  
* Cloudová služba (CADExchanger API)

**Pro .3mf** — tento formát PrusaSlicer nativně podporuje, takže by měl fungovat přímo.

**Pro .obj** — Three.js i PrusaSlicer obj podporují, minimální úpravy.

**Frontend upload:** Rozšířit drag-and-drop zónu a file input accept atribut o nové přípony. Aktualizovat text s popisem podporovaných formátů (např. "Podporované formáty: .stl, .obj, .3mf, .step, .stp"). Maximální velikost souboru: zachovat stávající limit nebo zvýšit (AutoQuote3D má 150 MB).

**PRIORITA FORMÁTŮ:**

1. .3mf (nejsnazší — PrusaSlicer native)  
2. .obj (snadné — běžná podpora)  
3. .step/.stp (nejtěžší — vyžaduje konverzní pipeline)

**DŮLEŽITÉ:** Konverze .step na mesh může být výpočetně náročná. Zvážit asynchronní zpracování — zákazník nahraje soubor, zobrazí se "Zpracováváme váš model..." a po konverzi se zobrazí 3D náhled a umožní výpočet ceny.

---

### **3.2 Validace a konverze nahraných souborů**

**Backend validační pipeline po uploadu:**

* Kontrola přípony a MIME typu  
* Kontrola, že soubor není poškozený (parsovatelný)  
* Pro mesh soubory (.stl, .obj): kontrola integrity mesh (uzavřený manifold, žádné díry)  
* Pro STEP soubory: kontrola, že soubor obsahuje validní geometrii  
* Extrakce základních metadat: rozměry (bounding box), objem, povrch, počet trojúhelníků/ploch  
* Konverze neSTL formátů na STL pro slicovací pipeline (pokud slicer neumí formát nativně)  
* Uložení jak originálního souboru, tak konvertovaného STL

**Chybové stavy:** soubor příliš velký, nevalidní formát, poškozený soubor, model příliš malý/velký pro tiskárnu — zobrazit uživateli srozumitelnou chybovou hlášku.

---

### **3.3 Aktualizace 3D prohlížeče pro nové formáty**

Stávající 3D prohlížeč (pravděpodobně Three.js) je potřeba rozšířit o loadery pro nové formáty.

**Three.js má dostupné loadery:**

* STLLoader (již implementováno)  
* OBJLoader (three/examples/jsm/loaders/OBJLoader)  
* 3MFLoader (three/examples/jsm/loaders/3MFLoader)

**Pro STEP formát** Three.js nemá nativní loader — řešení:

* Zobrazit konvertovaný STL/OBJ (z backend konverze) v prohlížeči  
* Nebo použít knihovnu opencascade.js (WebAssembly port OpenCASCADE)

Doporučení: pro jednoduchost zobrazovat vždy konvertovaný mesh, ne originální STEP.

## **SEKCE 4 — Doprava a dodací lhůty**

Tato sekce řeší přidání systému dopravy a dodacích lhůt. Zákazník aktuálně nevidí cenu dopravy ani odhadovaný čas doručení, což je pro dokončení objednávky zásadní.

### **4.1 Admin nastavení dopravních metod a cen**

**Nová stránka v admin panelu:** Admin \> Doprava (nebo Admin \> Shipping). Umístění v navigaci: za stránku Fees, před Orders.

**Struktura stránky:** Seznam dopravních metod s možností přidávat, editovat, mazat, řadit a aktivovat/deaktivovat.

**Každá dopravní metoda obsahuje:**

* Název (např. "Česká pošta", "Zásilkovna", "PPL", "Osobní odběr", "DPD")  
* Popis (krátký text zobrazený zákazníkovi)  
* Cena — buď pevná částka (např. 99 Kč), nebo kalkulovaná dle hmotnosti/objemu (cenová tabulka: od X kg do Y kg \= Z Kč)  
* Zdarma od určité částky objednávky (např. "Doprava zdarma od 1000 Kč")  
* Odhadovaná doba doručení v pracovních dnech (rozsah, např. 2-5 dnů)  
* Aktivní/neaktivní přepínač  
* Viditelnost ve widgetu (zobrazit/skrýt)  
* Ikona/logo dopravce (volitelné — upload obrázku)

**Speciální typ "Osobní odběr":**

* Adresa výdejního místa (zobrazená zákazníkovi)  
* Cena 0 Kč (nebo konfigurovatelná)  
* Otevírací doba (volitelné textové pole)

**Databázový model:** Tabulka shipping\_methods s poli: id, tenant\_id, name, description, price\_type (FIXED/WEIGHT\_BASED), fixed\_price, weight\_tiers (JSON pole cenových pásem), free\_above\_total, estimated\_days\_min, estimated\_days\_max, is\_active, sort\_order, icon\_url.

---

### **4.2 Výběr dopravy v kalkulačce**

**Umístění:** Na kroku 3 "Kontrola a cena", mezi shrnutím objednávky a kontaktním formulářem (Sekce 2).

**Nová sekce "Způsob doručení"** s radio buttony nebo kartami pro každou aktivní dopravní metodu.

**Každá karta zobrazuje:**

* Název dopravce  
* Ikonu/logo (pokud nastaveno)  
* Cenu dopravy (nebo "Zdarma" pokud splněna podmínka)  
* Odhadovanou dobu doručení ("Doručení za 2-5 pracovních dnů")

**Integrace s cenou:**

* Vybraná doprava se přičte k celkové ceně v panelu "Cena a souhrn"  
* V rozpisu ceny přidat nový řádek "Doprava: XX Kč"

**Pokud admin nemá nastavené žádné dopravní metody, sekce se nezobrazí.**

---

### **4.3 Odhadovaná dodací lhůta**

**Kalkulace celkové dodací lhůty:**

* Výrobní čas (součet tiskových časů všech modelů \+ odhadovaný čas post-processingu, pokud vybrán)  
* \\+ Doba doručení dopravce

**Admin nastavení:** V Admin \> Pricing nebo Admin \> Obecné přidat pole "Výrobní buffer" — počet pracovních dnů, které firma přidává k čistému tiskovému času (čas na kontrolu, balení apod.).

**Zobrazení v kalkulačce:**

* "Odhadované doručení: DD.MM.YYYY \- DD.MM.YYYY" nebo "za X-Y pracovních dnů"  
* Toto se zobrazuje na kroku 3 vedle vybrané dopravní metody a na potvrzovací stránce po odeslání objednávky

---

## **SEKCE 5 — Množstevní slevy a cenová degrese**

Aktuálně kalkulačka má pole "Počet kusů" ale cena se jednoduše násobí počtem — žádná degresivní sleva za větší množství.

### **5.1 Admin konfigurace cenových pásem**

**Umístění:** Admin \> Pricing — nová záložka "Množstevní slevy" nebo nová sekce na stávající stránce pod stávajícím nastavením cenotvorby.

**Konfigurace cenových pásem:** Tabulka s řádky definujícími slevová pásma. Každý řádek:

* Od (minimální počet kusů)  
* Do (maximální počet kusů, nebo "neomezeno")  
* Sleva v % (procento slevy z ceny za kus)

**Příklad:**

* 1-4 kusy \= 0%  
* 5-9 kusů \= 5%  
* 10-24 kusů \= 10%  
* 25-49 kusů \= 15%  
* 50+ kusů \= 20%

Tlačítko "Přidat pásmo" pro přidání řádku. Drag-and-drop řazení. Validace: pásma se nesmí překrývat, musí na sebe navazovat.

**Alternativní model:** Místo procentuální slevy pevná cena za kus v každém pásmu. Admin vybere model: PROCENTA nebo FIXNÍ CENA.

**Aplikace:** Slevy se aplikují na úrovni modelu — pokud zákazník objedná 10 kusů jednoho modelu a 2 kusy jiného, sleva 10% se aplikuje jen na ten s 10 kusy. Nebo alternativně: celkový počet kusů v objednávce (admin volba).

**Databázový model:** Tabulka quantity\_tiers: id, tenant\_id, min\_qty, max\_qty, discount\_percent (nebo fixed\_price\_per\_unit), is\_active. Nebo JSON pole v pricing konfiguraci tenanta.

---

### **5.2 Automatický výpočet slevy v kalkulačce**

**Backend cenotvorba:** Rozšířit pricing pipeline o krok množstevní slevy.

**Pipeline pořadí:** base cena (materiál \+ čas) → fees → množstevní sleva → markup → minima → zaokrouhlení.

**Při výpočtu ceny modelu:**

* Vzít počet kusů  
* Najít odpovídající pásmo  
* Aplikovat slevu

**V rozpisu ceny** (panel "Cena a souhrn") se sleva zobrazí v řádku "Sleva" (aktuálně je tam "+ 0,00 Kč" — naplnit skutečnou hodnotou).

**Developer režim:** Zobrazit detail — které pásmo bylo aplikováno, procento slevy, původní cena vs. cena po slevě.

---

### **5.3 Vizuální indikace slevy pro zákazníka**

**Vedle pole "Počet kusů" nebo pod ním** zobrazit informaci o slevě:

* "Objednejte 5+ kusů a získejte 5% slevu\!" (dynamicky dle nejbližšího vyššího pásma)

**Pokud je sleva aktivní:**

* Zobrazit badge/tag "Sleva \-10%" zeleně u modelu v rozpisu

**V cenové sumarizaci:**

* Zobrazit původní cenu přeškrtnutě a novou cenu vedle — klasický e-commerce pattern

**Volitelně:** Pod polem množství zobrazit mini tabulku všech pásem:

* "1-4 ks: plná cena | 5-9 ks: \-5% | 10+ ks: \-10%"  
* Aby zákazník viděl motivaci objednat více

---

## **SEKCE 6 — Post-processing (následné zpracování)**

Tato sekce řeší přidání systému post-processing služeb — broušení, leštění, barvení, lakování, odstranění supportů a dalších úprav po tisku. SeekMake toto nabízí komplexně, ModelPricer to zcela postrádá.

### **6.1 Admin správa post-processing služeb**

**POZNÁMKA:** Post-processing se do jisté míry překrývá se stávajícím systémem Fees (Admin \> Fees), který již umožňuje vytvářet příplatky na úrovni modelu/objednávky. Rozdíl je v tom, že post-processing služby potřebují:

* Dedikovanou UI sekci v kalkulačce (ne jen checkbox v "Dodatečné služby")  
* Vizuální prezentaci (ikony, popisy, obrázky výsledku)  
* Vliv na dodací lhůtu

**Možné řešení A (Rozšíření stávajících Fees):**

* Přidat ke stávajícímu systému Fees nový typ/kategorii "POST\_PROCESSING"  
* V admin Fees při vytváření fee přidat checkbox "Je post-processing služba" nebo dropdown kategorie (Příplatek / Post-processing / Expresní)  
* Post-processing fees se v kalkulačce zobrazí v dedikované sekci místo v "Dodatečné služby"  
* Přidat nová pole ke fee: ikona, popis pro zákazníka, odhadovaný čas zpracování (dny), obrázek ukázky výsledku

**Možné řešení B (Nová entita):**

* Vytvořit zcela nový model PostProcessingService nezávislý na Fees  
* Nová admin stránka Admin \> Post-processing  
* To je čistší oddělení ale více práce

**DOPORUČENÍ:** Řešení A — rozšíření stávajících Fees o kategorii. Šetří čas implementace a využívá existující logiku cenotvorby (podmínky, typy, scope).

**Admin UI rozšíření:**

* V Admin \> Fees přidat dropdown "Kategorie" (Příplatek / Post-processing)  
* U post-processing fees přidat pole:  
  * Popis pro widget (delší text, 200 znaků)  
  * Ikona (výběr z předdefinovaných ikon nebo upload)  
  * Čas zpracování v dnech (číslo — přičte se k odhadované dodací lhůtě)  
  * Obrázek ukázky (volitelný upload)  
* Filtrování fee seznamu dle kategorie

---

### **6.2 Výběr post-processingu v kalkulačce**

**Umístění v kalkulačce:** Nová dedikovaná sekce "Povrchová úprava" nebo "Post-processing" v konfiguračním kroku, pod sekcí "Dodatečné služby" nebo místo ní (a "Dodatečné služby" přejmenovat na obecné příplatky).

**Zobrazení:** Karty nebo dlaždice (ne jen checkboxy) — každá karta obsahuje:

* Ikonu  
* Název služby  
* Krátký popis  
* Cenu  
* Checkbox/toggle pro výběr

**Příklady služeb:**

* Broušení (+150 Kč, \+2 dny)  
* Leštění (+200 Kč, \+3 dny)  
* Barvení (+300 Kč, \+3 dny)  
* Lakování (+250 Kč, \+2 dny)  
* Odstranění supportů (+50 Kč, \+1 den)

---

### **6.3 Vliv na cenu a dodací lhůtu**

**Vliv na cenu:**

* Cena post-processing se přičte k celkové ceně v sekci "Služby" v rozpisu  
* V Developer režimu zobrazit detail: které post-processing služby byly vybrány a jejich cena

**Vliv na dodací lhůtu:**

* Čas post-processingu (dny) se přičte k odhadované dodací lhůtě (Sekce 4.3)  
* Při výběru post-processingu se dynamicky aktualizuje zobrazený odhadovaný čas doručení  
* Upozornění: "Vybraná povrchová úprava prodlouží dodání o X dní."

**SEKCE 7 — E-mailové notifikace**

Komplexní systém automatických emailových notifikací pro zákazníky i tým. Tato sekce je středně náročná na implementaci — vyžaduje emailový provider, šablonový systém a integraci se stavovým strojem objednávek.

### **7.1 Šablony emailů pro jednotlivé stavy objednávky**

**Emailové šablony navázané na existující statusy v Admin \> Orders:**

**1\. Nová objednávka (ORDER\_CREATED)**

* **Příjemce:** Zákazník \+ Admin/tým  
* **Předmět zákazník:** "Potvrzení objednávky \#{{order\_id}}"  
* **Předmět admin:** "Nová objednávka \#{{order\_id}} od {{customer\_name}}"  
* **Obsah:** Shrnutí objednávky, seznam modelů, celková cena, kontaktní údaje zákazníka, další kroky

**2\. Kontrola (ORDER\_REVIEW)**

* **Příjemce:** Zákazník  
* **Předmět:** "Vaše objednávka \#{{order\_id}} se kontroluje"  
* **Obsah:** Informace že objednávka byla přijata a probíhá kontrola modelů, odhadovaný čas kontroly

**3\. Schváleno (ORDER\_APPROVED)**

* **Příjemce:** Zákazník  
* **Předmět:** "Objednávka \#{{order\_id}} schválena — začínáme výrobu"  
* **Obsah:** Potvrzení schválení, očekávaný termín dokončení, informace o platbě (pokud aplikovatelné)

**4\. Tiskne se (ORDER\_PRINTING)**

* **Příjemce:** Zákazník  
* **Předmět:** "Vaše objednávka \#{{order\_id}} se právě tiskne 🖨️"  
* **Obsah:** Výroba zahájena, odhadovaný čas dokončení tisku

**5\. Postprocess (ORDER\_POSTPROCESS)**

* **Příjemce:** Zákazník  
* **Předmět:** "Objednávka \#{{order\_id}} — probíhá povrchová úprava"  
* **Obsah:** Tisk dokončen, probíhá post-processing (broušení, lakování...), odhadovaný čas

**6\. Připraveno (ORDER\_READY)**

* **Příjemce:** Zákazník  
* **Předmět:** "Objednávka \#{{order\_id}} je připravena\! ✅"  
* **Obsah:** Objednávka hotová, informace o expedici/vyzvednutí, platební údaje (pokud platba na dobírku)

**7\. Odesláno (ORDER\_SHIPPED)**

* **Příjemce:** Zákazník  
* **Předmět:** "Objednávka \#{{order\_id}} byla odeslána 📦"  
* **Obsah:** Tracking číslo, dopravce, odkaz na sledování zásilky, odhadované doručení

**8\. Hotovo (ORDER\_COMPLETED)**

* **Příjemce:** Zákazník  
* **Předmět:** "Děkujeme za objednávku \#{{order\_id}}\!"  
* **Obsah:** Poděkování, žádost o recenzi/feedback, odkaz na zákaznický portál, pozvánka k další objednávce

**9\. Zrušeno (ORDER\_CANCELLED)**

* **Příjemce:** Zákazník  
* **Předmět:** "Objednávka \#{{order\_id}} byla zrušena"  
* **Obsah:** Důvod zrušení, informace o refundu (pokud aplikovatelné), kontakt pro dotazy

**Technologie šablon:**

**HTML emailové šablony s proměnnými (template variables):**

html  
\<\!DOCTYPE html\>  
\<html\>  
\<head\>  
  \<style\>  
    */\* Inline CSS pro emailové klienty \*/*  
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }  
    .header { background: {{primary\_color}}; padding: 20px; text-align: center; }  
    .logo { max-height: 50px; }  
    .content { padding: 30px; }  
    .order-summary { background: \#f5f5f5; padding: 20px; border-radius: 8px; }  
    .button { background: {{primary\_color}}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }  
    .footer { padding: 20px; text-align: center; color: \#666; font-size: 12px; }  
  \</style\>  
\</head\>  
\<body\>  
  \<div class\="container"\>  
    \<div class\="header"\>  
      \<img src\="{{company\_logo}}" alt\="{{company\_name}}" class\="logo"\>  
    \</div\>  
      
    \<div class\="content"\>  
      \<h1\>Dobrý den, {{customer\_name}}\!\</h1\>  
        
      \<p\>Vaše objednávka \<strong\>\#{{order\_id}}\</strong\> byla přijata.\</p\>  
        
      \<div class\="order-summary"\>  
        \<h3\>Shrnutí objednávky\</h3\>  
        {{\#each order\_items}}  
        \<div class\="item"\>  
          \<span\>{{this.name}}\</span\>  
          \<span\>{{this.quantity}}× {{this.price}} Kč\</span\>  
        \</div\>  
        {{/each}}  
        \<hr\>  
        \<div class\="total"\>  
          \<strong\>Celkem: {{order\_total}} Kč\</strong\>  
        \</div\>  
      \</div\>  
        
      \<p\>O dalším postupu vás budeme informovat emailem.\</p\>  
        
      \<a href\="{{order\_tracking\_url}}" class\="button"\>Sledovat objednávku\</a\>  
    \</div\>  
      
    \<div class\="footer"\>  
      \<p\>{{company\_name}} | {{company\_address}}\</p\>  
      \<p\>{{company\_email}} | {{company\_phone}}\</p\>  
    \</div\>  
  \</div\>  
\</body\>  
\</html\>  
\`\`\`

\*\*Dostupné proměnné:\*\*  
\`\`\`  
// Zákazník  
{{customer\_name}}  
{{customer\_email}}  
{{customer\_phone}}

// Objednávka  
{{order\_id}}  
{{order\_date}}  
{{order\_total}}  
{{order\_items}} — pole položek  
{{order\_status}}  
{{order\_tracking\_url}}

// Doprava  
{{shipping\_method}}  
{{shipping\_price}}  
{{tracking\_number}}  
{{tracking\_url}}  
{{estimated\_delivery}}

// Firma  
{{company\_name}}  
{{company\_logo}}  
{{company\_email}}  
{{company\_phone}}  
{{company\_address}}  
{{primary\_color}}  
\`\`\`

\*\*Knihovny pro emailové šablony:\*\*  
\- \*\*React Email\*\* — komponenty pro emaily, moderní, TypeScript  
\- \*\*MJML\*\* — markup jazyk pro responzivní emaily, kompiluje do HTML  
\- \*\*Handlebars\*\* — šablonovací engine s proměnnými a podmínkami  
\- \*\*Liquid\*\* — podobné Handlebars, používá Shopify

\*\*Email provider (transactional email služba):\*\*  
\- \*\*Resend\*\* — moderní, vývojářsky přívětivé API, free tier 100 emailů/den, doporučeno  
\- \*\*SendGrid\*\* — robustní, škálovatelný, free tier 100 emailů/den  
\- \*\*Amazon SES\*\* — nejlevnější pro velké objemy, složitější setup  
\- \*\*Postmark\*\* — zaměřený na doručitelnost, dražší  
\- \*\*Mailgun\*\* — dobrý poměr cena/výkon

\---

\#\#\# 7.2 Admin konfigurace notifikací

\*\*Nová stránka Admin \> Notifikace (nebo Admin \> E-maily):\*\*

\*\*Struktura stránky:\*\*

\*\*Záložka 1: Šablony\*\*  
Seznam všech emailových šablon:  
| Název | Stav objednávky | Příjemce | Aktivní | Akce |  
|-------|-----------------|----------|---------|------|  
| Nová objednávka | ORDER\_CREATED | Zákazník | ✅ | Upravit |  
| Nová objednávka (admin) | ORDER\_CREATED | Tým | ✅ | Upravit |  
| Kontrola | ORDER\_REVIEW | Zákazník | ✅ | Upravit |  
| ... | ... | ... | ... | ... |

\*\*Editor šablony (po kliknutí na "Upravit"):\*\*  
\`\`\`  
┌─────────────────────────────────────────────────────────────┐  
│ Šablona: Nová objednávka                                    │  
├─────────────────────────────────────────────────────────────┤  
│                                                             │  
│ Aktivní: \[✓\]                                               │  
│                                                             │  
│ Předmět:                                                    │  
│ ┌─────────────────────────────────────────────────────────┐ │  
│ │ Potvrzení objednávky \#{{order\_id}}                      │ │  
│ └─────────────────────────────────────────────────────────┘ │  
│                                                             │  
│ Obsah:                                                      │  
│ ┌─────────────────────────────────────────────────────────┐ │  
│ │ \[WYSIWYG EDITOR / HTML EDITOR\]                          │ │  
│ │                                                         │ │  
│ │ Dobrý den, {{customer\_name}}\!                          │ │  
│ │                                                         │ │  
│ │ Vaše objednávka \#{{order\_id}} byla přijata...          │ │  
│ │                                                         │ │  
│ └─────────────────────────────────────────────────────────┘ │  
│                                                             │  
│ Dostupné proměnné: \[?\]                                     │  
│ {{customer\_name}}, {{order\_id}}, {{order\_total}}...        │  
│                                                             │  
│ ┌─────────────┐  ┌─────────────────────┐                   │  
│ │ Náhled 👁️  │  │ Odeslat test email  │                   │  
│ └─────────────┘  └─────────────────────┘                   │  
│                                                             │  
│         \[ Uložit změny \]     \[ Zrušit \]                    │  
└─────────────────────────────────────────────────────────────┘  
\`\`\`

\*\*Náhled emailu:\*\*  
\- Modal s renderovaným emailem  
\- Přepínač Desktop / Mobile view  
\- Testovací data (mock objednávka)

\*\*Odeslat testovací email:\*\*  
\- Input pro email adresu  
\- Odešle email s testovacími daty  
\- Potvrzení "Email odeslán na xyz@example.com"

\*\*Záložka 2: Globální nastavení\*\*

\*\*Email provider konfigurace:\*\*  
\`\`\`  
Provider: \[ Resend ▼ \]

API klíč: \[••••••••••••••••\] \[Zobrazit\]

Odesílatel:  
  Jméno: \[ ModelPricer s.r.o.        \]  
  Email: \[ objednavky@firma.cz       \]

Reply-to: \[ info@firma.cz            \]

\[ Otestovat připojení \]  
\`\`\`

\*\*Branding emailů:\*\*  
\- Logo v emailu: \[Použít logo z Admin \> Branding\] nebo \[Nahrát jiné\]  
\- Primární barva: \[Použít z Branding\] nebo \[Vlastní\]  
\- Patička emailu:  
\`\`\`  
  ┌─────────────────────────────────────────────────────────┐  
  │ {{company\_name}}                                        │  
  │ {{company\_address}}                                     │  
  │ Email: {{company\_email}} | Tel: {{company\_phone}}      │  
  │                                                         │  
  │ \[Odhlásit se z odběru\]                                 │

  └─────────────────────────────────────────────────────────┘

**Záložka 3: Log odeslaných emailů**

Tabulka s historií:

| Datum | Příjemce | Předmět | Stav | Objednávka |
| ----- | ----- | ----- | ----- | ----- |
| 15.1. 10:30 | jan@example.com | Potvrzení objednávky \#1234 | ✅ Doručeno | \#1234 |
| 15.1. 10:25 | anna@test.cz | Objednávka odeslána | ⏳ Odesláno | \#1233 |
| 15.1. 09:15 | bad@email | Nová objednávka | ❌ Nedoručeno | \#1232 |

Filtry: období, stav (všechny/doručené/nedoručené), příjemce, objednávka

---

### **7.3 Automatické odesílání při změně stavu**

**Backend integrace:**

**Hook při změně stavu objednávky:**

typescript  
*// V service/controlleru objednávek*  
async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {  
  const order \= await orderRepository.findById(orderId);  
  const oldStatus \= order.status;  
    
  *// Update stavu*  
  order.status \= newStatus;  
  await orderRepository.save(order);  
    
  *// Trigger emailové notifikace*  
  await emailNotificationService.onOrderStatusChange(order, oldStatus, newStatus);  
    
  *// Trigger dalších akcí (generování dokumentů, webhooky...)*  
  await eventBus.emit('order.status\_changed', { order, oldStatus, newStatus });

}

**Email notification service:**

typescript  
class EmailNotificationService {  
  async onOrderStatusChange(order: Order, oldStatus: string, newStatus: string) {  
    *// Najít aktivní šablonu pro daný stav*  
    const template \= await templateRepository.findByStatusAndTenant(  
      newStatus,   
      order.tenantId,  
      { active: true }  
    );  
      
    if (\!template) {  
      return; *// Žádná aktivní šablona pro tento stav*  
    }  
      
    *// Připravit data pro šablonu*  
    const templateData \= {  
      customer\_name: order.customer.name,  
      customer\_email: order.customer.email,  
      order\_id: order.referenceNumber,  
      order\_total: formatCurrency(order.total),  
      order\_items: order.items.map(item \=\> ({  
        name: item.model.name,  
        quantity: item.quantity,  
        price: formatCurrency(item.price)  
      })),  
      tracking\_number: order.trackingNumber,  
      company\_name: order.tenant.companyName,  
      company\_logo: order.tenant.logoUrl,  
      *// ... další proměnné*  
    };  
      
    *// Renderovat šablonu*  
    const html \= await renderTemplate(template.content, templateData);  
    const subject \= renderTemplate(template.subject, templateData);  
      
    *// Odeslat email*  
    await emailProvider.send({  
      to: order.customer.email,  
      from: order.tenant.emailSettings.fromEmail,  
      fromName: order.tenant.emailSettings.fromName,  
      subject: subject,  
      html: html  
    });  
      
    *// Zalogovat*  
    await emailLogRepository.create({  
      orderId: order.id,  
      templateId: template.id,  
      recipient: order.customer.email,  
      subject: subject,  
      status: 'sent',  
      sentAt: new Date()  
    });  
  }

}

**Databázový model:**

sql  
*\-- Emailové šablony*  
CREATE TABLE email\_templates (  
  id UUID PRIMARY KEY,  
  tenant\_id UUID REFERENCES tenants(id),  
  name VARCHAR(100) NOT NULL,  
  trigger\_status VARCHAR(50), *\-- ORDER\_CREATED, ORDER\_SHIPPED, etc.*  
  recipient\_type VARCHAR(20), *\-- CUSTOMER, ADMIN, BOTH*  
  subject VARCHAR(255) NOT NULL,  
  content TEXT NOT NULL, *\-- HTML s proměnnými*  
  is\_active BOOLEAN DEFAULT true,  
  created\_at TIMESTAMP DEFAULT NOW(),  
  updated\_at TIMESTAMP DEFAULT NOW()  
);

*\-- Log odeslaných emailů*  
CREATE TABLE email\_logs (  
  id UUID PRIMARY KEY,  
  tenant\_id UUID REFERENCES tenants(id),  
  template\_id UUID REFERENCES email\_templates(id),  
  order\_id UUID REFERENCES orders(id),  
  recipient VARCHAR(255) NOT NULL,  
  subject VARCHAR(255),  
  status VARCHAR(20), *\-- sent, delivered, bounced, failed*  
  provider\_message\_id VARCHAR(100), *\-- ID z email provideru*  
  opened\_at TIMESTAMP, *\-- Tracking pixel*  
  clicked\_at TIMESTAMP, *\-- Link tracking*  
  error\_message TEXT,  
  sent\_at TIMESTAMP DEFAULT NOW()  
);

CREATE INDEX idx\_email\_logs\_order ON email\_logs(order\_id);

CREATE INDEX idx\_email\_logs\_tenant\_sent ON email\_logs(tenant\_id, sent\_at);

---

## **SEKCE 8 — Kontrola tisknutelnosti a chytrá manipulace s modely**

Tato sekce je technicky náročnější — vyžaduje analýzu 3D geometrie na backendu. Layers.app nabízí printability check (tloušťka stěn, mesh integrita, bounding box). Zákazníci z fór silně žádají DFM zpětnou vazbu.

### **8.1 Printability check (tloušťka stěn, mesh integrita, bounding box)**

**Backend analýza po uploadu modelu:**

**1\. Mesh integrita (Watertight/Manifold check):**

* **Co kontroluje:** Je mesh uzavřený? Nemá díry, otevřené hrany, obrácené normály?  
* **Proč důležité:** Neuzavřený mesh může způsobit problémy při slicování a tisku  
* **Výsledek:** OK / Warning / Error  
* **Zpráva:** "Model je v pořádku" / "Model má otevřené hrany — může způsobit problémy při tisku" / "Model nelze vytisknout — kritické chyby v geometrii"

**2\. Tloušťka stěn (Wall thickness):**

* **Co kontroluje:** Minimální tloušťka stěn v modelu  
* **Proč důležité:** Příliš tenké stěny (\< 0.4-0.8mm pro FDM) nelze vytisknout nebo budou křehké  
* **Výsledek:** Minimální nalezená tloušťka v mm  
* **Zpráva:** "Některé stěny jsou tenčí než {{min\_thickness}}mm — mohou být křehké nebo se nevytisknout"

**3\. Bounding box check:**

* **Co kontroluje:** Porovnání rozměrů modelu s maximálním tiskovým objemem tiskárny  
* **Konfigurace:** Admin nastaví max. rozměry tiskárny (X, Y, Z v mm)  
* **Výsledek:** OK / Warning (blízko limitu) / Error (přesahuje)  
* **Zpráva:** "Model přesahuje tiskový objem tiskárny (max. {{max\_x}} × {{max\_y}} × {{max\_z}} mm)"

**4\. Počet dílů (Part count):**

* **Co kontroluje:** Obsahuje soubor více oddělených těles?  
* **Proč důležité:** Více dílů v jednom souboru může být záměr nebo chyba  
* **Výsledek:** Počet oddělených těles  
* **Zpráva:** "Soubor obsahuje {{count}} oddělených dílů — budou vytištěny společně"

**5\. Objem a váha:**

* **Co kontroluje:** Celkový objem modelu a odhadovaná hmotnost  
* **Výsledek:** Objem v cm³, hmotnost v gramech  
* **Zpráva:** Informativní, zobrazeno v detailu modelu

**Knihovny pro analýzu:**

**Python:**

python  
import trimesh

def analyze\_model(file\_path):  
    mesh \= trimesh.load(file\_path)  
      
    analysis \= {  
        *\# Základní metriky*  
        'volume': mesh.volume,  *\# cm³*  
        'surface\_area': mesh.area,  *\# cm²*  
        'bounding\_box': mesh.bounding\_box.extents.tolist(),  *\# \[x, y, z\] mm*  
        'triangle\_count': len(mesh.faces),  
          
        *\# Mesh integrita*  
        'is\_watertight': mesh.is\_watertight,  
        'is\_winding\_consistent': mesh.is\_winding\_consistent,  
        'euler\_number': mesh.euler\_number,  
          
        *\# Počet dílů*  
        'body\_count': len(mesh.split(only\_watertight\=False)),  
          
        *\# Problémy*  
        'issues': \[\]  
    }  
      
    *\# Kontrola watertight*  
    if not mesh.is\_watertight:  
        analysis\['issues'\].append({  
            'type': 'MESH\_NOT\_WATERTIGHT',  
            'severity': 'WARNING',  
            'message': 'Model má otevřené hrany nebo díry'  
        })  
      
    *\# Kontrola bounding boxu (příklad: max 250x210x210mm)*  
    max\_dimensions \= \[250, 210, 210\]  
    for i, (dim, max\_dim) in enumerate(zip(analysis\['bounding\_box'\], max\_dimensions)):  
        if dim \> max\_dim:  
            analysis\['issues'\].append({  
                'type': 'EXCEEDS\_BUILD\_VOLUME',  
                'severity': 'ERROR',  
                'message': f'Model přesahuje tiskový objem (osa {"XYZ"\[i\]}: {dim:.1f}mm \> {max\_dim}mm)'  
            })  
      
    return analysis  
\`\`\`

\*\*Alternativní nástroje:\*\*  
\- \*\*admesh\*\* — C knihovna pro STL analýzu a opravu  
\- \*\*PrusaSlicer CLI\*\* — \`\--check\-model\` flag pro kontrolu  
\- \*\*MeshLab\*\* — skriptovatelný, ale těžší integrace  
\- \*\*OpenCASCADE\*\* — pro STEP soubory

\*\*Asynchronní zpracování:\*\*  
\`\`\`  
1\. Zákazník nahraje soubor  
2\. Soubor se uloží, vrátí se ID  
3\. Backend spustí analýzu na pozadí (queue job)  
4\. Frontend polluje stav nebo čeká na WebSocket notifikaci  
5\. Po dokončení analýzy se zobrazí výsledky  
\`\`\`

\*\*Zobrazení ve widgetu:\*\*

\*\*V panelu modelu (pod rozměry, objemem, povrchem):\*\*  
\`\`\`  
┌─────────────────────────────────────────┐  
│ 📊 Kontrola tisknutelnosti              │  
├─────────────────────────────────────────┤  
│ ✅ Mesh integrita: V pořádku            │  
│ ✅ Rozměry: 45 × 30 × 20 mm            │  
│ ⚠️ Tenké stěny: min. 0.6mm             │  
│    └─ Některé detaily mohou být křehké │  
│ ℹ️ Počet dílů: 1                        │  
├─────────────────────────────────────────┤  
│ \[ Zobrazit detaily \]                    │  
└─────────────────────────────────────────┘  
\`\`\`

\*\*Barevné kódování:\*\*  
\- ✅ Zelená: V pořádku  
\- ⚠️ Žlutá: Varování (tisk možný, ale s omezeními)  
\- ❌ Červená: Chyba (tisk není možný nebo vysoce problematický)

\---

*\#\#\# 8.2 Automatická detekce jednotek a scale*

\*\*Problém:\*\* STL soubory nemají definovanou jednotku. Některé modely jsou v mm, jiné v inches, cm, nebo metrech. Zákazník nahraje model a rozměry jsou nesmyslné.

\*\*Heuristika pro detekci:\*\*

\*\*Příliš malý model (pravděpodobně inches → mm):\*\*  
\- Pokud bounding box \< 1mm ve všech osách  
\- Nabídnout: "Rozměry se zdají malé. Je model v palcích?"  
\- Konverze: × 25.4

\*\*Příliš velký model (pravděpodobně metry → mm nebo cm → mm):\*\*  
\- Pokud bounding box \> 1000mm v jakékoliv ose  
\- Nabídnout: "Rozměry se zdají velké. Je model v metrech nebo centimetrech?"  
\- Konverze: × 0.001 (m→mm) nebo × 10 (cm→mm)

\*\*UI dialog při detekci problému:\*\*  
\`\`\`  
┌─────────────────────────────────────────────────────┐  
│ ⚠️ Neobvyklé rozměry modelu                        │  
├─────────────────────────────────────────────────────┤  
│                                                     │  
│ Rozměry vašeho modelu: 0.5 × 0.5 × 1.0             │  
│                                                     │  
│ To se zdá být velmi malé. V jakých jednotkách     │  
│ je váš model?                                       │  
│                                                     │  
│ ○ Milimetry (0.5 × 0.5 × 1.0 mm) — ponechat       │  
│ ● Palce (12.7 × 12.7 × 25.4 mm) — přepočítat      │  
│ ○ Centimetry (5 × 5 × 10 mm) — přepočítat         │  
│                                                     │  
│              \[ Potvrdit \]                           │  
└─────────────────────────────────────────────────────┘  
\`\`\`

\*\*Po výběru:\*\*  
\- Přepočítat rozměry, objem, povrch  
\- Přepočítat cenu  
\- Uložit zvolenou jednotku k modelu (pro budoucí referenci)

\*\*Automatické škálování:\*\*  
\- Volitelná funkce: "Přizpůsobit velikosti tiskárny"  
\- Pokud model přesahuje tiskový objem, nabídnout automatické zmenšení  
\- Zobrazit nové rozměry a poměr zmenšení (např. "Zmenšeno na 85%")

\---

*\#\#\# 8.3 DFM zpětná vazba pro zákazníka ve widgetu*

\*\*DFM (Design for Manufacturing)\*\* — tipy specifické pro FDM tisk, které pomohou zákazníkovi optimalizovat model.

\*\*Typy DFM zpětné vazby:\*\*

\*\*1\. Orientace a supporty:\*\*  
\- Detekce převisů \> 45°  
\- Zpráva: "Model obsahuje převisy, které vyžadují podpěry. Zvažte otočení modelu pro minimalizaci supportů."  
\- Vizualizace: zvýraznění problematických ploch v 3D prohlížeči (červeně)

\*\*2\. Tenké výčnělky:\*\*  
\- Detekce tenkých vertikálních prvků  
\- Zpráva: "Tenké výčnělky (\< 1mm) mohou být křehké a náchylné k zlomení."

\*\*3\. Velké rovné plochy:\*\*  
\- Detekce velkých horizontálních ploch u základny  
\- Zpráva: "Velká rovná plocha u podložky může způsobit warping. Doporučujeme použít brim."

\*\*4\. Malé díry:\*\*  
\- Detekce děr menších než průměr trysky  
\- Zpráva: "Malé díry (\< 0.5mm) se nemusí vytisknout správně."

\*\*5\. Ostré rohy:\*\*  
\- Detekce ostrých vnitřních rohů  
\- Zpráva: "Ostré vnitřní rohy mohou koncentrovat napětí. Zvažte přidání zaoblení."

\*\*Zobrazení ve widgetu:\*\*

\*\*Sekce "Tipy pro lepší tisk" (pod kontrolou tisknutelnosti):\*\*  
\`\`\`  
┌─────────────────────────────────────────────────────┐  
│ 💡 Tipy pro lepší tisk                              │  
├─────────────────────────────────────────────────────┤  
│                                                     │  
│ 🔄 Orientace                                        │  
│    Model obsahuje převisy vyžadující podpěry.      │  
│    \[ Zobrazit problematické oblasti \]               │  
│                                                     │  
│ 📏 Tenké části                                      │  
│    Některé detaily jsou tenčí než 1mm.             │  
│    Mohou být křehké po vytištění.                  │  
│                                                     │  
│ ────────────────────────────────────────────────── │  
│ ℹ️ Tyto tipy jsou orientační. Tisk je možný       │  
│    i bez úprav.                                     │  
│                                                     │  
└─────────────────────────────────────────────────────┘  
\`\`\`

\*\*Vizualizace v 3D prohlížeči:\*\*  
\- Tlačítko "Zobrazit problémové oblasti"  
\- Přepne 3D prohlížeč do "DFM režimu"  
\- Problematické plochy zvýrazněny barevně (červená \= kritické, žlutá \= varování)  
\- Legenda vysvětlující barvy

\*\*Implementační poznámka:\*\*  
\- DFM analýza je výpočetně náročná  
\- Implementovat postupně — začít s jednoduchými kontrolami (bounding box, watertight)  
\- Pokročilé analýzy (převisy, tloušťka stěn) přidávat iterativně  
\- Některé kontroly může provádět slicer a vrátit warnings

\---

*\#\# SEKCE 9 — Expresní cenotvorba a upselly*

*\#\#\# 9.1 Admin nastavení expresních úrovní (standard, express, rush)*

\*\*Umístění:\*\* Admin \> Pricing \> Expresní úrovně (nová záložka) nebo Admin \> Fees s kategorií "EXPRESS"

\*\*Konfigurace expresních úrovní:\*\*

\*\*Tabulka úrovní:\*\*  
| Název | Příplatek | Doba zpracování | Výchozí | Aktivní | Akce |  
|-------|-----------|-----------------|---------|---------|------|  
| Standard | 0% | 5\-7 pracovních dnů | ✅ | ✅ | Upravit |  
| Express | \+25% | 2\-3 pracovní dny | ❌ | ✅ | Upravit |  
| Rush | \+50% | 24 hodin | ❌ | ✅ | Upravit |

\*\*Editor úrovně:\*\*  
\`\`\`  
┌─────────────────────────────────────────────────────┐  
│ Expresní úroveň: Express                            │  
├─────────────────────────────────────────────────────┤  
│                                                     │  
│ Název: \[ Express                    \]               │  
│                                                     │  
│ Popis pro zákazníka:                               │  
│ \[ Rychlejší zpracování vaší objednávky \]           │  
│                                                     │  
│ Příplatek:                                          │  
│ ○ Procenta z ceny: \[ 25 \] %                        │  
│ ○ Pevná částka:    \[    \] Kč                       │  
│                                                     │  
│ Doba zpracování:                                    │  
│ Od: \[ 2 \] do: \[ 3 \] pracovních dnů                 │  
│                                                     │  
│ Ikona: \[ ⚡ ▼ \]                                     │  
│                                                     │  
│ \[ \] Nastavit jako výchozí                          │  
│ \[✓\] Aktivní                                        │  
│                                                     │  
│         \[ Uložit \]     \[ Zrušit \]                  │

└─────────────────────────────────────────────────────┘

**Možnosti příplatku:**

* **Procenta z ceny:** příplatek se počítá jako % z celkové ceny objednávky (před dopravou)  
* **Pevná částka:** fixní příplatek bez ohledu na cenu objednávky  
* **Kombinace:** procenta s minimem/maximem (např. 25% ale min. 100 Kč, max. 500 Kč)

**Databázový model:**

sql  
CREATE TABLE express\_tiers (  
  id UUID PRIMARY KEY,  
  tenant\_id UUID REFERENCES tenants(id),  
  name VARCHAR(100) NOT NULL,  
  description VARCHAR(255),  
  *\-- Příplatek*  
  surcharge\_type VARCHAR(20), *\-- PERCENT, FIXED*  
  surcharge\_percent NUMERIC(5,2),  
  surcharge\_fixed NUMERIC(10,2),  
  surcharge\_min NUMERIC(10,2), *\-- Minimum pro PERCENT*  
  surcharge\_max NUMERIC(10,2), *\-- Maximum pro PERCENT*  
  *\-- Doba*  
  processing\_days\_min INTEGER,  
  processing\_days\_max INTEGER,  
  *\-- UI*  
  icon VARCHAR(10), *\-- Emoji nebo kód ikony*  
  sort\_order INTEGER,  
  is\_default BOOLEAN DEFAULT false,  
  is\_active BOOLEAN DEFAULT true,  
  created\_at TIMESTAMP DEFAULT NOW()  
);  
\`\`\`

\---

\#\#\# 9.2 UI výběr urgence v kalkulačce

\*\*Umístění:\*\* V konfiguračním kroku kalkulačky, jako samostatná sekce "Rychlost zpracování" nebo "Termín dodání"

\*\*Zobrazení — karty vedle sebe:\*\*  
\`\`\`  
┌─────────────────────────────────────────────────────────────────────┐  
│ ⏱️ Rychlost zpracování                                              │  
├─────────────────────────────────────────────────────────────────────┤  
│                                                                     │  
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │  
│ │    📦           │ │    ⚡           │ │    🚀           │        │  
│ │   Standard      │ │   Express       │ │   Rush          │        │  
│ │                 │ │                 │ │                 │        │  
│ │  5\-7 prac. dnů  │ │  2\-3 prac. dny  │ │   24 hodin      │        │  
│ │                 │ │                 │ │                 │        │  
│ │   Bez příplatku │ │   \+25%          │ │   \+50%          │        │  
│ │                 │ │  (\+162,50 Kč)   │ │  (\+325 Kč)      │        │  
│ │                 │ │                 │ │                 │        │  
│ │    \[Vybráno\]    │ │    \[Vybrat\]     │ │    \[Vybrat\]     │        │  
│ └─────────────────┘ └─────────────────┘ └─────────────────┘        │  
│                                                                     │  
│ 📅 Odhadované doručení: 22\. \- 24\. ledna 2024                       │  
│                                                                     │  
└─────────────────────────────────────────────────────────────────────┘  
\`\`\`

\*\*Interakce:\*\*  
\- Kliknutí na kartu vybere danou úroveň  
\- Vybraná karta má výrazný border (primární barva) a checkmark  
\- Při změně výběru se okamžitě aktualizuje:  
  \- Celková cena v panelu "Cena a souhrn"  
  \- Odhadovaný termín doručení  
  \- Řádek "Expresní příplatek: \+XXX Kč" v rozpisu ceny

\*\*Dynamický výpočet příplatku:\*\*  
\`\`\`  
Základní cena objednávky: 650 Kč  
Express (\+25%): 650 × 0.25 \= 162,50 Kč  
Celkem s Express: 812,50 Kč  
\`\`\`

\*\*Zobrazení v rozpisu ceny:\*\*  
\`\`\`  
Materiál:           44,35 Kč  
Čas tisku:         202,00 Kč  
Služby:            \+14,54 Kč  
Expresní příplatek: \+162,50 Kč  ← Nový řádek  
Sleva:              \+0,00 Kč  
Doprava:            99,00 Kč  
────────────────────────────

Celkem:            522,39 Kč

---

### **9.3 Upsell mechanismus při checkout**

**Princip:** Při checkout (krok 3 "Kontrola a cena") zobrazit kontextuální doporučení, která mohou zvýšit hodnotu objednávky a/nebo zlepšit výsledek pro zákazníka.

**Typy upsellů:**

**1\. Post-processing upsell:**

* **Podmínka:** Zákazník nemá vybraný žádný post-processing  
* **Zobrazení:**

 ┌─────────────────────────────────────────────────────┐  
  │ ✨ Vylepšete svůj výtisk                           │  
  │                                                     │  
  │ Přidejte povrchovou úpravu pro profesionální      │  
  │ výsledek:                                          │  
  │                                                     │  
  │ 🔧 Broušení         \+150 Kč  \[ Přidat \]           │  
  │ ✨ Leštění          \+200 Kč  \[ Přidat \]           │

  │ 🎨 Barvení          \+300 Kč

# **SEKCE 10: SLEVOVÉ KUPÓNY A PROMO AKCE**

## **10.1 Systém kupónů**

### **10.1.1 Databázová struktura kupónů**

**Tabulka `coupons`:**

sql

CREATE TABLE coupons (

    id UUID PRIMARY KEY,

    code VARCHAR(50) UNIQUE NOT NULL,

    name VARCHAR(255),

    description TEXT,

    discount\_type ENUM('percentage', 'fixed\_amount', 'free\_shipping', 'free\_postprocessing') NOT NULL,

    discount\_value DECIMAL(10,2) NOT NULL,

    minimum\_order\_value DECIMAL(10,2) DEFAULT 0,

    maximum\_discount DECIMAL(10,2) DEFAULT NULL,

    usage\_limit\_total INTEGER DEFAULT NULL,

    usage\_limit\_per\_customer INTEGER DEFAULT 1,

    usage\_count INTEGER DEFAULT 0,

    valid\_from TIMESTAMP NOT NULL,

    valid\_until TIMESTAMP,

    is\_active BOOLEAN DEFAULT true,

    applies\_to ENUM('all', 'specific\_materials', 'specific\_technologies', 'specific\_categories') DEFAULT 'all',

    applicable\_items JSONB DEFAULT '\[\]',

    excluded\_items JSONB DEFAULT '\[\]',

    first\_order\_only BOOLEAN DEFAULT false,

    combinable BOOLEAN DEFAULT false,

    created\_by UUID REFERENCES users(id),

    created\_at TIMESTAMP DEFAULT NOW(),

    updated\_at TIMESTAMP DEFAULT NOW()

);

**Tabulka `coupon_usages`:**

sql

CREATE TABLE coupon\_usages (

    id UUID PRIMARY KEY,

    coupon\_id UUID REFERENCES coupons(id),

    order\_id UUID REFERENCES orders(id),

    customer\_email VARCHAR(255),

    customer\_id UUID,

    discount\_applied DECIMAL(10,2),

    used\_at TIMESTAMP DEFAULT NOW()

);

\`\`\`

\#\#\# 10.1.2 Typy slev

\*\*Procentuální sleva:\*\*

\- Hodnota: 1-100%

\- Možnost nastavit maximální částku slevy (např. max 500 Kč)

\- Aplikace na celkovou cenu nebo pouze na vybrané položky

\*\*Fixní částka:\*\*

\- Pevná sleva v měně obchodu

\- Automatická konverze při multi-currency (dle aktuálního kurzu)

\- Nelze aplikovat pokud je objednávka nižší než sleva

\*\*Doprava zdarma:\*\*

\- Nastavení pro konkrétní dopravce nebo všechny

\- Možnost omezení na určitou váhu/velikost

\- Kombinovatelné s jinými slevami

\*\*Post-processing zdarma:\*\*

\- Sleva na konkrétní typ úpravy (např. barvení zdarma)

\- Nebo všechny post-processing služby

\#\#\# 10.1.3 Admin rozhraní pro správu kupónů

\*\*Umístění:\*\* Admin panel → Marketing → Kupóny

\*\*Seznam kupónů \- zobrazované informace:\*\*

\- Kód kupónu (zvýrazněný, kopírovatelný)

\- Název/popis

\- Typ a hodnota slevy

\- Platnost (od-do) s vizuální indikací stavu

\- Využití (použito/limit)

\- Status badge (aktivní/neaktivní/expirovaný/vyčerpaný)

\- Akce: Upravit, Duplikovat, Deaktivovat, Smazat

\*\*Formulář vytvoření/editace kupónu:\*\*

\`\`\`

┌─────────────────────────────────────────────────────┐

│ VYTVOŘIT KUPÓN                                       │

├─────────────────────────────────────────────────────┤

│ Základní informace                                   │

│ ┌─────────────────────────────────────────────────┐ │

│ │ Kód: \[AUTO\-GENERATE\] nebo \[Vlastní kód\_\_\_\_\_\_\]  │ │

│ │ Název: \[Letní sleva 2025\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]      │ │

│ │ Popis: \[20% sleva na všechny materiály\_\_\_\]     │ │

│ └─────────────────────────────────────────────────┘ │

│                                                      │

│ Typ slevy                                            │

│ ○ Procentuální   ○ Fixní částka                     │

│ ○ Doprava zdarma ○ Post\-processing zdarma           │

│                                                      │

│ Hodnota: \[20\] \[%/Kč\]  Max. sleva: \[500 Kč\]          │

│                                                      │

│ Omezení                                              │

│ Min. hodnota objednávky: \[1000 Kč\]                  │

│ Celkový limit použití: \[100\] (prázdné \= neomezeně)  │

│ Limit na zákazníka: \[1\]                             │

│ □ Pouze první objednávka                            │

│ □ Kombinovatelné s jinými kupóny                    │

│                                                      │

│ Platnost                                             │

│ Od: \[01.06.2025 00:00\]  Do: \[30.06.2025 23:59\]      │

│                                                      │

│ Aplikovat na                                         │

│ ○ Vše  ○ Vybrané materiály  ○ Vybrané technologie   │

│ \[Multi\-select pro výběr položek\]                    │

│                                                      │

│ Vyloučit položky                                     │

│ \[Multi\-select pro vyloučení\]                        │

│                                                      │

│           \[Zrušit\]  \[Uložit kupón\]                  │

└─────────────────────────────────────────────────────┘

\`\`\`

\#\#\# 10.1.4 Aplikace kupónu v kalkulačce

\*\*UI element v kalkulačce:\*\*

\`\`\`

┌─────────────────────────────────────────┐

│ Máte slevový kód?                        │

│ ┌─────────────────────┐ ┌─────────────┐ │

│ │ LETO2025            │ │ Uplatnit    │ │

│ └─────────────────────┘ └─────────────┘ │

└─────────────────────────────────────────┘

\`\`\`

\*\*Po úspěšném uplatnění:\*\*

\`\`\`

┌─────────────────────────────────────────┐

│ ✓ Kupón LETO2025 uplatněn               │

│   Sleva 20% (max. 500 Kč)               │

│                              \[Odstranit\] │

├─────────────────────────────────────────┤

│ Mezisoučet:              2 450 Kč       │

│ Sleva (LETO2025):          \-490 Kč      │

│ ─────────────────────────────────        │

│ Celkem:                  1 960 Kč       │

└─────────────────────────────────────────┘

\`\`\`

\*\*Validace kupónu \- endpoint:\*\*

\`\`\`

POST /api/coupons/validate

{

    "code": "LETO2025",

    "cart\_total": 2450,

    "customer\_email": "jan@example.cz",

    "items": \[

        {"material\_id": "uuid", "technology": "fdm", "price": 1200},

        {"material\_id": "uuid", "technology": "fdm", "price": 1250}

    \]

}

Response (success):

{

    "valid": true,

    "coupon": {

        "code": "LETO2025",

        "discount\_type": "percentage",

        "discount\_value": 20,

        "maximum\_discount": 500

    },

    "discount\_amount": 490,

    "message": "Sleva 20% uplatněna (max. 500 Kč)"

}

Response (error):

{

    "valid": false,

    "error\_code": "MINIMUM\_NOT\_MET",

    "message": "Minimální hodnota objednávky je 1000 Kč"

}

\`\`\`

\*\*Chybové stavy kupónu:\*\*

\- \`INVALID\_CODE\` \- Neplatný kód

\- \`EXPIRED\` \- Kupón vypršel

\- \`NOT\_YET\_VALID\` \- Kupón ještě není platný

\- \`USAGE\_LIMIT\_REACHED\` \- Vyčerpán celkový limit

\- \`CUSTOMER\_LIMIT\_REACHED\` \- Zákazník již kupón využil

\- \`MINIMUM\_NOT\_MET\` \- Nedosažena minimální hodnota

\- \`NOT\_APPLICABLE\` \- Nelze aplikovat na položky v košíku

\- \`FIRST\_ORDER\_ONLY\` \- Pouze pro první objednávku

\- \`NOT\_COMBINABLE\` \- Nelze kombinovat s jiným kupónem

\#\#\# 10.1.5 Automatické generování kupónů

\*\*Hromadné generování pro kampaně:\*\*

\- Prefix \+ náhodný suffix (např. LETO-A7X9K2)

\- Počet kupónů k vygenerování

\- Sdílená pravidla pro všechny

\- Export do CSV pro distribuci

\*\*API pro programatické generování:\*\*

\`\`\`

POST /api/admin/coupons/generate\-batch

{

    "prefix": "PARTNER",

    "count": 50,

    "template": {

        "discount\_type": "percentage",

        "discount\_value": 15,

        "usage\_limit\_per\_customer": 1,

        "valid\_days": 30

    }

}

---

## **10.2 Promo akce a časové slevy**

### **10.2.1 Databázová struktura**

**Tabulka `promotions`:**

sql

CREATE TABLE promotions (

    id UUID PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    promotion\_type ENUM('time\_based', 'quantity\_based', 'bundle', 'flash\_sale') NOT NULL,

    discount\_type ENUM('percentage', 'fixed\_amount') NOT NULL,

    discount\_value DECIMAL(10,2) NOT NULL,

    conditions JSONB NOT NULL,

    applies\_to JSONB NOT NULL,

    priority INTEGER DEFAULT 0,

    stackable BOOLEAN DEFAULT false,

    valid\_from TIMESTAMP NOT NULL,

    valid\_until TIMESTAMP,

    is\_active BOOLEAN DEFAULT true,

    display\_banner BOOLEAN DEFAULT true,

    banner\_text VARCHAR(255),

    banner\_color VARCHAR(7) DEFAULT '\#FF6B00',

    created\_at TIMESTAMP DEFAULT NOW()

);

\`\`\`

\#\#\# 10.2.2 Typy promo akcí

\*\*Časově omezené slevy (Flash Sales):\*\*

\- Sleva platná pouze v určitém čase (např. Happy Hours 14:00-16:00)

\- Countdown timer v kalkulačce

\- Automatická aktivace/deaktivace

\*\*Sezónní akce:\*\*

\- Vánoční slevy, Black Friday, Letní výprodej

\- Delší časové období

\- Možnost bannerů a speciální grafiky

\*\*Bundlové akce:\*\*

\- Sleva při objednání více položek různých typů

\- Např. "Objednej FDM \+ SLA a získej 10% slevu"

\#\#\# 10.2.3 Zobrazení v kalkulačce

\*\*Banner aktivní akce:\*\*

\`\`\`

┌─────────────────────────────────────────────────────┐

│ 🔥 FLASH SALE\! 15% sleva na všechny materiály       │

│    Končí za: 02:45:33                               │

└─────────────────────────────────────────────────────┘

\`\`\`

\*\*Zobrazení slevy u ceny:\*\*

\`\`\`

┌─────────────────────────────────────────┐

│ Model: cube.stl                         │

│ Materiál: PLA Basic                     │

│ ┌─────────────────────────────────────┐ │

│ │ Původní cena:    ██████  1 200 Kč  │ │

│ │ Flash Sale \-15%:          \-180 Kč  │ │

│ │ ─────────────────────────────────── │ │

│ │ Vaše cena:              1 020 Kč  │ │

│ └─────────────────────────────────────┘ │

└─────────────────────────────────────────┘

### **10.2.4 Admin správa promo akcí**

**Umístění:** Admin panel → Marketing → Promo akce

**Konfigurace akce:**

* Název a popis  
* Typ akce (časová, množstevní, bundle)  
* Hodnota slevy  
* Časové omezení  
* Na co se vztahuje (materiály, technologie, vše)  
* Priorita (při překryvu více akcí)  
* Nastavení banneru (text, barva, zobrazení)

---

## **10.3 Analytika kupónů a akcí**

### **10.3.1 Dashboard statistiky**

**Umístění:** Admin panel → Marketing → Analytika

**Metriky kupónů:**

* Celkový počet použití  
* Celková hodnota poskytnutých slev  
* Průměrná sleva na objednávku  
* Konverzní rate (zobrazení → použití)  
* Nejúspěšnější kupóny  
* Revenue attribution (tržby připsané kupónům)

**Graf využití v čase:**

* Denní/týdenní/měsíční zobrazení  
* Porovnání různých kupónů  
* Korelace s tržbami

### **10.3.2 Export dat**

**Formáty:** CSV, Excel, PDF report **Data:** Seznam všech použití, souhrnné statistiky, ROI analýza

---

# **SEKCE 11: CHAT A KOMENTÁŘE K OBJEDNÁVKÁM**

## **11.1 Interní komentáře (Admin only)**

### **11.1.1 Účel a použití**

Interní komentáře slouží pro komunikaci mezi členy týmu ohledně konkrétní objednávky. Zákazník tyto komentáře nevidí.

### **11.1.2 Databázová struktura**

**Tabulka `order_comments`:**

sql

CREATE TABLE order\_comments (

    id UUID PRIMARY KEY,

    order\_id UUID REFERENCES orders(id) NOT NULL,

    user\_id UUID REFERENCES users(id) NOT NULL,

    comment\_type ENUM('internal', 'customer') NOT NULL,

    content TEXT NOT NULL,

    attachments JSONB DEFAULT '\[\]',

    is\_pinned BOOLEAN DEFAULT false,

    created\_at TIMESTAMP DEFAULT NOW(),

    updated\_at TIMESTAMP DEFAULT NOW(),

    deleted\_at TIMESTAMP

);

\`\`\`

\#\#\# 11.1.3 UI v admin detailu objednávky

\*\*Umístění:\*\* Detail objednávky → pravý panel nebo spodní sekce

\*\*Zobrazení komentářů:\*\*

\`\`\`

┌─────────────────────────────────────────────────────┐

│ INTERNÍ POZNÁMKY                          \[\+ Přidat\]│

├─────────────────────────────────────────────────────┤

│ 📌 \[Jan Novák\] 15.01.2025 10:30                     │

│ Zákazník žádá expresní dodání \- potvrzeno telefonicky│

│ Přislíbeno dodání do 17.01.                         │

│                                    \[Odepnout\] \[···\] │

├─────────────────────────────────────────────────────┤

│ \[Marie Svobodová\] 14.01.2025 16:45                  │

│ Model má tenké stěny, doporučuji konzultovat se     │

│ zákazníkem před tiskem.                             │

│ 📎 screenshot\_walls.png                             │

│                                       \[Připnout\] \[···\]│

├─────────────────────────────────────────────────────┤

│ ┌─────────────────────────────────────────────────┐ │

│ │ Napište komentář...                             │ │

│ │                                                 │ │

│ └─────────────────────────────────────────────────┘ │

│ \[📎 Příloha\]                              \[Odeslat\] │

└─────────────────────────────────────────────────────┘

**Funkce:**

* Přidání nového komentáře s formátováním  
* Připnutí důležitého komentáře (zobrazí se nahoře)  
* Přílohy (obrázky, dokumenty)  
* Editace vlastních komentářů  
* Smazání (soft delete)  
* @zmínky kolegů s notifikací

### **11.1.4 Notifikace při zmínce**

Když uživatel napíše `@jan.novak`, systém:

1. Zvýrazní zmínku v komentáři  
2. Odešle notifikaci zmíněnému uživateli  
3. Zobrazí v notifikačním centru  
4. Volitelně odešle email

---

## **11.2 Chat se zákazníkem**

### **11.2.1 Databázová struktura**

**Tabulka `order_messages`:**

sql

CREATE TABLE order\_messages (

    id UUID PRIMARY KEY,

    order\_id UUID REFERENCES orders(id) NOT NULL,

    sender\_type ENUM('admin', 'customer') NOT NULL,

    sender\_id UUID,

    sender\_name VARCHAR(255),

    sender\_email VARCHAR(255),

    content TEXT NOT NULL,

    attachments JSONB DEFAULT '\[\]',

    is\_read BOOLEAN DEFAULT false,

    read\_at TIMESTAMP,

    created\_at TIMESTAMP DEFAULT NOW()

);

\`\`\`

\#\#\# 11.2.2 Admin rozhraní chatu

\*\*Umístění:\*\* Detail objednávky → záložka "Komunikace" nebo panel vedle

\*\*Chat interface v admin panelu:\*\*

\`\`\`

┌─────────────────────────────────────────────────────┐

│ CHAT SE ZÁKAZNÍKEM                                  │

│ Jan Novák (jan@example.cz)              ● Online    │

├─────────────────────────────────────────────────────┤

│                                                     │

│                      14.01.2025                     │

│                                                     │

│ ┌─────────────────────────────────┐                 │

│ │ Dobrý den, chtěl bych se        │ 09:15          │

│ │ zeptat na termín dodání.        │                 │

│ └─────────────────────────────────┘                 │

│                                                     │

│                 ┌─────────────────────────────────┐ │

│          09:22 │ Dobrý den, vaše objednávka bude │ │

│                │ odeslána zítra. Předpokládané   │ │

│                │ doručení je 17.01.              │ │

│                └─────────────────────────────────┘ │

│                                                     │

│ ┌─────────────────────────────────┐                 │

│ │ Děkuji za informaci\!           │ 09:25          │

│ └─────────────────────────────────┘                 │

│                                                     │

├─────────────────────────────────────────────────────┤

│ ┌─────────────────────────────────────────────────┐ │

│ │ Napište zprávu...                               │ │

│ └─────────────────────────────────────────────────┘ │

│ \[📎\] \[📷\]  \[Šablony ▼\]                   \[Odeslat\] │

└─────────────────────────────────────────────────────┘

\`\`\`

\*\*Šablony rychlých odpovědí:\*\*

\`\`\`

┌─────────────────────────────────────┐

│ ŠABLONY ODPOVĚDÍ                    │

├─────────────────────────────────────┤

│ ▶ Potvrzení objednávky              │

│ ▶ Informace o odeslání              │

│ ▶ Žádost o upřesnění                │

│ ▶ Problém s modelem                 │

│ ▶ Dotaz na změnu materiálu          │

│ \+ Vytvořit novou šablonu            │

└─────────────────────────────────────┘

\`\`\`

\#\#\# 11.2.3 Zákaznické rozhraní

\*\*Přístup pro zákazníka:\*\*

1\. Odkaz v emailu s objednávkou: \`example.com/order/ABC123/chat?token\=xyz\`

2\. Nebo přes zákaznický portál (pokud je registrován)

\*\*UI pro zákazníka:\*\*

\`\`\`

┌─────────────────────────────────────────────────────┐

│ OBJEDNÁVKA *\#ABC123                                  │*

│ Komunikace s prodejcem                              │

├─────────────────────────────────────────────────────┤

│ \[Chat messages \- stejné jako admin view\]            │

│                                                     │

├─────────────────────────────────────────────────────┤

│ ┌─────────────────────────────────────────────────┐ │

│ │ Napište zprávu...                               │ │

│ └─────────────────────────────────────────────────┘ │

│ \[📎 Příloha\]                              \[Odeslat\] │

│                                                     │

│ ℹ️ Obvykle odpovídáme do 2 hodin                    │

└─────────────────────────────────────────────────────┘

\`\`\`

\#\#\# 11.2.4 Notifikace

\*\*Pro admina:\*\*

\- Real-time notifikace v admin panelu (WebSocket/polling)

\- Badge s počtem nepřečtených zpráv

\- Email notifikace (konfigurovatelné \- ihned/souhrn)

\- Push notifikace (volitelné)

\*\*Pro zákazníka:\*\*

\- Email při nové zprávě od admina

\- Volitelně SMS notifikace

\#\#\# 11.2.5 Správa šablon odpovědí

\*\*Umístění:\*\* Admin → Nastavení → Šablony zpráv

\*\*Konfigurace šablony:\*\*

\`\`\`

┌─────────────────────────────────────────────────────┐

│ UPRAVIT ŠABLONU                                     │

├─────────────────────────────────────────────────────┤

│ Název: \[Informace o odeslání\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\]       │

│                                                     │

│ Text šablony:                                       │

│ ┌─────────────────────────────────────────────────┐ │

│ │ Dobrý den,                                      │ │

│ │                                                 │ │

│ │ vaše objednávka *\#{order\_number} byla právě     │ │*

│ │ odeslána.                                       │ │

│ │                                                 │ │

│ │ Sledovací číslo: {tracking\_number}             │ │

│ │ Dopravce: {carrier\_name}                       │ │

│ │                                                 │ │

│ │ S pozdravem,                                   │ │

│ │ {admin\_name}                                   │ │

│ └─────────────────────────────────────────────────┘ │

│                                                     │

│ Dostupné proměnné:                                  │

│ {order\_number}, {customer\_name}, {tracking\_number}, │

│ {carrier\_name}, {admin\_name}, {company\_name}        │

│                                                     │

│              \[Zrušit\]  \[Uložit šablonu\]             │

└─────────────────────────────────────────────────────┘

\`\`\`

\---

\#\# 11.3 Historie komunikace

\#\#\# 11.3.1 Unified timeline

V detailu objednávky zobrazit chronologickou časovou osu všech událostí:

\`\`\`

┌─────────────────────────────────────────────────────┐

│ HISTORIE OBJEDNÁVKY                    \[Filtr ▼\]    │

├─────────────────────────────────────────────────────┤

│ ● 15.01. 14:30 \- Objednávka odeslána               │

│   Tracking: PPL123456789                            │

│                                                     │

│ 💬 15.01. 14:25 \- Zpráva zákazníkovi               │

│   "Vaše objednávka byla právě odeslána..."         │

│                                                     │

│ 📝 15.01. 10:30 \- Interní poznámka (Jan Novák)     │

│   "Zákazník žádá expresní dodání..."               │

│                                                     │

│ ● 14.01. 16:00 \- Status změněn: Tisk dokončen     │

│                                                     │

│ 💬 14.01. 09:25 \- Zpráva od zákazníka              │

│   "Děkuji za informaci\!"                           │

│                                                     │

│ 💬 14.01. 09:22 \- Zpráva zákazníkovi               │

│   "Dobrý den, vaše objednávka bude..."             │

│                                                     │

│ 💬 14.01. 09:15 \- Zpráva od zákazníka              │

│   "Dobrý den, chtěl bych se zeptat..."             │

│                                                     │

│ ● 13.01. 18:00 \- Objednávka vytvořena              │

└─────────────────────────────────────────────────────┘

**Filtry:**

* Vše  
* Pouze zprávy  
* Pouze interní poznámky  
* Pouze změny stavu

---

# **SEKCE 12: ZÁKAZNICKÝ PORTÁL**

## **12.1 Registrace a přihlášení**

### **12.1.1 Možnosti autentizace**

**Registrace emailem:**

* Email \+ heslo  
* Potvrzovací email  
* Volitelně: jméno, firma, telefon

**Social login (volitelné):**

* Google  
* Facebook  
* Apple ID

**Magic link:**

* Přihlášení bez hesla  
* Email s jednorázovým odkazem

### **12.1.2 Databázová struktura**

**Tabulka `customers`:**

sql

CREATE TABLE customers (

    id UUID PRIMARY KEY,

    email VARCHAR(255) UNIQUE NOT NULL,

    password\_hash VARCHAR(255),

    first\_name VARCHAR(100),

    last\_name VARCHAR(100),

    company\_name VARCHAR(255),

    phone VARCHAR(50),

    tax\_id VARCHAR(50),

    vat\_id VARCHAR(50),

    preferred\_language VARCHAR(5) DEFAULT 'cs',

    preferred\_currency VARCHAR(3) DEFAULT 'CZK',

    email\_verified BOOLEAN DEFAULT false,

    email\_verified\_at TIMESTAMP,

    last\_login\_at TIMESTAMP,

    login\_count INTEGER DEFAULT 0,

    created\_at TIMESTAMP DEFAULT NOW(),

    updated\_at TIMESTAMP DEFAULT NOW()

);

**Tabulka `customer_addresses`:**

sql

CREATE TABLE customer\_addresses (

    id UUID PRIMARY KEY,

    customer\_id UUID REFERENCES customers(id),

    address\_type ENUM('billing', 'shipping') NOT NULL,

    is\_default BOOLEAN DEFAULT false,

    company\_name VARCHAR(255),

    first\_name VARCHAR(100),

    last\_name VARCHAR(100),

    street VARCHAR(255) NOT NULL,

    city VARCHAR(100) NOT NULL,

    postal\_code VARCHAR(20) NOT NULL,

    country\_code VARCHAR(2) NOT NULL,

    phone VARCHAR(50),

    created\_at TIMESTAMP DEFAULT NOW()

);

\`\`\`

\#\#\# 12.1.3 Registrační formulář

\*\*Umístění:\*\* Kalkulačka nebo samostatná stránka \`/register\`

\`\`\`

┌─────────────────────────────────────────────────────┐

│              VYTVOŘTE SI ÚČET                       │

├─────────────────────────────────────────────────────┤

│                                                     │

│ Email \*                                             │

│ ┌─────────────────────────────────────────────────┐ │

│ │ vas@email.cz                                    │ │

│ └─────────────────────────────────────────────────┘ │

│                                                     │

│ Heslo \*                                             │

│ ┌─────────────────────────────────────────────────┐ │

│ │ ••••••••••                                      │ │

│ └─────────────────────────────────────────────────┘ │

│ ✓ Min. 8 znaků  ✓ Číslo  ○ Velké písmeno          │

│                                                     │

│ Potvrzení hesla \*                                   │

│ ┌─────────────────────────────────────────────────┐ │

│ │ ••••••••••                                      │ │

│ └─────────────────────────────────────────────────┘ │

│                                                     │

│ ☐ Souhlasím s obchodními podmínkami               │

│ ☐ Přihlásit k odběru novinek (volitelné)          │

│                                                     │

│          \[    REGISTROVAT    \]                      │

│                                                     │

│ ─────────────── nebo ───────────────               │

│                                                     │

│ \[G\] Pokračovat s Google                             │

│                                                     │

│ Již máte účet? \[Přihlásit se\]                       │

└─────────────────────────────────────────────────────┘

\`\`\`

\---

\#\# 12.2 Dashboard zákazníka

\#\#\# 12.2.1 Hlavní přehled

\*\*URL:\*\* \`/account\` nebo \`/portal\`

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ Logo                          Ahoj, Jano\! ▼  🔔  \[Odhlásit se\] │

├─────────────────────────────────────────────────────────────────┤

│                                                                  │

│  PŘEHLED                                                         │

│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │

│  │      5       │ │      2       │ │   12 450 Kč  │             │

│  │  Objednávek  │ │  Aktivních   │ │  Celkem      │             │

│  └──────────────┘ └──────────────┘ └──────────────┘             │

│                                                                  │

│  AKTIVNÍ OBJEDNÁVKY                                              │

│  ┌─────────────────────────────────────────────────────────────┐│

│  │ *\#ORD-2025-042  │ Ve výrobě   │ 3 450 Kč │ \[Detail\]         ││*

│  │ *\#ORD-2025-041  │ Odesláno    │ 1 890 Kč │ \[Sledovat\]       ││*

│  └─────────────────────────────────────────────────────────────┘│

│                                                                  │

│  RYCHLÉ AKCE                                                     │

│  \[📦 Nová objednávka\]  \[💬 Kontaktovat podporu\]                 │

│                                                                  │

└─────────────────────────────────────────────────────────────────┘

\`\`\`

\#\#\# 12.2.2 Navigace portálu

\*\*Menu položky:\*\*

\- Dashboard (přehled)

\- Moje objednávky

\- Moje modely (knihovna)

\- Adresy

\- Nastavení účtu

\- Faktury a dokumenty

\---

\#\# 12.3 Seznam objednávek

\#\#\# 12.3.1 Přehled objednávek

\*\*URL:\*\* \`/account/orders\`

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ MOJE OBJEDNÁVKY                                                 │

│                                                                  │

│ \[Všechny ▼\] \[Období ▼\]                      🔍 Hledat...        │

│                                                                  │

│ ┌─────────────────────────────────────────────────────────────┐ │

│ │ *\#ORD-2025-042                              15.01.2025       │ │*

│ │ ┌─────┐                                                     │ │

│ │ │ 🔲 │  3× Model, PLA Basic                                │ │

│ │ └─────┘  Status: ████░░░░░░ Ve výrobě (60%)                │ │

│ │          Celkem: 3 450 Kč                                   │ │

│ │                                                             │ │

│ │          \[Zobrazit detail\] \[Chat s podporou\]                │ │

│ └─────────────────────────────────────────────────────────────┘ │

│                                                                  │

│ ┌─────────────────────────────────────────────────────────────┐ │

│ │ *\#ORD-2025-041                              12.01.2025       │ │*

│ │ ┌─────┐                                                     │ │

│ │ │ 🔲 │  1× Prototype, PETG                                 │ │

│ │ └─────┘  Status: ✓ Doručeno                                │ │

│ │          Celkem: 1 890 Kč                                   │ │

│ │                                                             │ │

│ │          \[Zobrazit detail\] \[Objednat znovu\]                 │ │

│ └─────────────────────────────────────────────────────────────┘ │

│                                                                  │

│                        \[1\] \[2\] \[3\] ... \[Další →\]               │

└─────────────────────────────────────────────────────────────────┘

\`\`\`

\#\#\# 12.3.2 Detail objednávky

\*\*URL:\*\* \`/account/orders/{order\_id}\`

\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ ← Zpět na objednávky                                            │

│                                                                  │

│ OBJEDNÁVKA *\#ORD-2025-042                                        │*

│ Vytvořeno: 15.01.2025 14:30                                     │

│                                                                  │

│ STAV OBJEDNÁVKY                                                  │

│ ●────●────●────○────○                                           │

│ Přijato  Výroba  QC   Odesláno  Doručeno                        │

│                                                                  │

│ POLOŽKY                                                          │

│ ┌─────────────────────────────────────────────────────────────┐ │

│ │ ┌─────┐ cube.stl                                            │ │

│ │ │     │ PLA Basic \- Modrá                                   │ │

│ │ │ 3D  │ Množství: 3                                         │ │

│ │ │     │ Výplň: 20%, Vrstva: 0.2mm                           │ │

│ │ └─────┘                                     3× 450 \= 1 350 Kč│ │

│ ├─────────────────────────────────────────────────────────────┤ │

│ │ ┌─────┐ holder.stl                                          │ │

│ │ │     │ PETG \- Černá                                        │ │

│ │ │ 3D  │ Množství: 2                                         │ │

│ │ │     │ Výplň: 40%, Vrstva: 0.15mm                          │ │

│ │ └─────┘                                     2× 780 \= 1 560 Kč│ │

│ └─────────────────────────────────────────────────────────────┘ │

│                                                                  │

│ SOUHRN                                                           │

│ Mezisoučet:                                         2 910 Kč    │

│ Doprava (PPL):                                        149 Kč    │

│ Sleva (LETO2025):                                    \-150 Kč    │

│ ─────────────────────────────────────────────────────────       │

│ Celkem s DPH:                                       2 909 Kč    │

│                                                                  │

│ DORUČOVACÍ ADRESA           FAKTURAČNÍ ADRESA                   │

│ Jan Novák                   Jan Novák                           │

│ Ulice 123                   Ulice 123                           │

│ 110 00 Praha                110 00 Praha                        │

│                                                                  │

│ \[📄 Stáhnout fakturu\]  \[💬 Chat s podporou\]  \[🔄 Objednat znovu\]│

└─────────────────────────────────────────────────────────────────┘

---

## **12.4 Knihovna modelů**

### **12.4.1 Uložené modely**

**URL:** `/account/models`

Zákazník může ukládat své modely pro pozdější opakované objednávky.

┌─────────────────────────────────────────────────────────────────┐

│ MOJE MODELY                                    \[+ Nahrát model\] │

│                                                                  │

│ \[Grid view

## **SEKCE 14 — Vizuální pipeline objednávek (Kanban)**

Stávající Admin \> Orders zobrazuje objednávky v tabulce. Přidat alternativní zobrazení: Kanban board (přepínač Table/Kanban view).

### **14.1 Kanban board v admin panelu**

**Umístění:** Admin \> Orders — přepínací tlačítka nahoře (Tabulka | Kanban). Přidat toggle "Skrýt dokončené" pro skrytí sloupců Hotovo/Zrušeno.

**Struktura boardu:** Sloupce odpovídající stavům objednávky: Nová | Kontrola | Schváleno | Tiskne se | Postprocess | Připraveno | Odesláno | Hotovo. Stav "Zrušeno" jako speciální sloupec — karty sem přesunuté zmizí po potvrzení.

**Karta objednávky:** Každá objednávka jako karta ve sloupci zobrazuje: číslo objednávky (prominentně nahoře), jméno zákazníka, počet modelů a kusů, celková cena, datum vytvoření, barevný tag (materiál nebo priorita — expresní objednávky červeně, standardní modře), malá miniatura prvního modelu (volitelné).

### **14.2 Drag-and-drop přesuny mezi stavy**

**Interakce:** Uživatel uchopí kartu a přetáhne ji do jiného sloupce \= změna stavu objednávky.

**Při přesunu se spustí:**

* Backend update stavu objednávky v databázi  
* Trigger emailové notifikace zákazníkovi (napojení na Sekci 7\)  
* Trigger generování dokumentů pokud je nastaveno pro daný stav (napojení na Sekci 13\)  
* Zápis do audit logu

**Validace přesunů:** Některé přechody mohou být omezené — např. nelze přesunout z "Hotovo" zpět na "Nová" (volitelně konfigurovatelné v adminu). Při pokusu o nevalidní přesun zobrazit toast s vysvětlením.

**Konfirmace při určitých stavech:** Při přesunu do "Zrušeno" zobrazit modal s potvrzením a polem pro důvod zrušení. Při přesunu do "Odesláno" zobrazit modal pro zadání tracking čísla.

### **14.3 Filtry a vyhledávání na boardu**

**Filtry nad boardem:**

* Dle materiálu (dropdown/multiselect)  
* Dle presetu  
* Dle zákazníka (search autocomplete)  
* Dle data (date range picker)  
* Dle priority/expresní úrovně

**Vyhledávání:** Search box pro rychlé hledání dle čísla objednávky nebo jména zákazníka — filtruje karty v reálném čase.

**WIP limity (volitelné):** Možnost nastavit maximální počet objednávek v daném stavu (Work In Progress limit). Pokud je limit překročen, sloupec se vizuálně zvýrazní (červený border/pozadí) jako varování o přetížení.

### **Technická implementace**

**Knihovny pro drag-and-drop:**

* @dnd-kit/core (React) — doporučeno, moderní, lehký, dobře podporovaný  
* react-beautiful-dnd (Atlassian) — starší ale osvědčený  
* Pragmatic drag-and-drop (nový od Atlassian) — nejnovější, vysoký výkon

**Datový model:** Žádné změny v databázi — využívá existující pole `status` v tabulce orders. Stačí frontend implementace \+ API endpoint pro update stavu.

**API endpoint:** PUT /api/orders/:id/status s body { status: "PRINTING" }. Endpoint provede validaci, update, a vrátí aktualizovanou objednávku.

**Real-time aktualizace (volitelné):** Pokud více uživatelů pracuje na boardu současně, WebSocket notifikace o změnách — když jeden uživatel přesune kartu, ostatní vidí změnu okamžitě bez refreshe.

**Responzivita:** Na malých obrazovkách zobrazit sloupce jako horizontálně scrollovatelný kontejner, nebo přepnout na kompaktní seznam místo plného kanban boardu.

**Výkon:** Při velkém počtu objednávek implementovat virtualizaci (react-window) pro plynulé scrollování. Lazy loading karet — načítat jen viditelné karty \+ buffer.

## **SEKCE 15 — Rozšířené metody cenotvorby**

Aktuálně ModelPricer počítá cenu na základě: hmotnosti materiálu (Kč/gram) \+ doby tisku (Kč/hodina). Layers.app nabízí alternativní metody: Bounding Box, Volume, Weight, Time. Přidat volbu metody cenotvorby v admin panelu.

### **15.1 Cenotvorba dle Bounding Boxu**

**Princip:** Cena závisí na objemu bounding boxu modelu (X × Y × Z v cm³). Vhodné pro firmy, které účtují podle zabraného prostoru v tiskárně, ne podle skutečné hmotnosti.

**Admin nastavení:**

* Cena za cm³ bounding boxu (např. 0.50 Kč/cm³)  
* Minimální cena za model (aby malé modely nebyly příliš levné)  
* Volitelně: cenové pásma dle velikosti bounding boxu (0-100 cm³ \= X Kč/cm³, 100-500 cm³ \= Y Kč/cm³, 500+ cm³ \= Z Kč/cm³)

**Výpočet:** Bounding box volume \= max\_x × max\_y × max\_z (rozměry modelu). Cena \= bounding\_box\_volume × cena\_za\_cm³.

**Výhody:** Jednoduchý výpočet, nevyžaduje slicování, okamžitý výsledek po uploadu modelu.

**Nevýhody:** Neodráží skutečnou složitost tisku — dutý model má stejnou cenu jako plný model stejných rozměrů.

---

### **15.2 Cenotvorba dle objemu modelu**

**Princip:** Cena závisí na objemu samotného modelu (ne bounding box, ale skutečný objem 3D tělesa v cm³). Přesnější než bounding box, protože odráží skutečné množství materiálu.

**Admin nastavení:**

* Cena za cm³ objemu modelu (např. 2.00 Kč/cm³)  
* Minimální cena za model  
* Volitelně: koeficient pro zohlednění výplně (objem × infill\_percentage × koeficient)

**Výpočet:** Volume se extrahuje při uploadu modelu (knihovny jako trimesh v Pythonu umí spočítat objem mesh). Cena \= model\_volume × cena\_za\_cm³.

**Výhody:** Přesnější než bounding box, stále nevyžaduje plné slicování (jen analýzu geometrie).

**Nevýhody:** Neodráží dobu tisku — vysoký tenký model trvá déle než nízký široký model stejného objemu.

---

### **15.3 Admin výběr metody per materiál/technologii**

**Umístění:** Admin \> Pricing — nová sekce "Metoda cenotvorby" nebo dropdown na stávající stránce.

**Globální nastavení:** Dropdown "Výchozí metoda cenotvorby" s volbami:

* **Slicer-based** (stávající — hmotnost \+ čas z PrusaSliceru) — nejpřesnější, ale vyžaduje slicování  
* **Bounding Box** — nejrychlejší, nejméně přesný  
* **Volume** — kompromis mezi rychlostí a přesností  
* **Weight-only** — pouze hmotnost materiálu bez času  
* **Time-only** — pouze doba tisku bez materiálu

**Per-materiál nastavení:** V Admin \> Pricing \> Materiály — u každého materiálu možnost override globální metody. Příklad: PLA používá slicer-based (přesné), ale speciální materiály (pryskyřice, kov) používají volume-based.

**Per-technologie nastavení (pro budoucnost — Sekce 18):** Různé technologie mohou vyžadovat různé metody:

* FDM: slicer-based nebo volume  
* SLA: volume-based (pryskyřice se počítá dle objemu)  
* CNC: time-based (čas obrábění)

**Backend implementace:**

Refaktorovat pricing pipeline tak, aby metoda cenotvorby byla konfigurovatelná:

// Abstraktní interface

interface PricingStrategy {

  calculatePrice(model: Model, config: PricingConfig): PriceBreakdown;

}

// Implementace

class SlicerBasedPricing implements PricingStrategy { ... }

class BoundingBoxPricing implements PricingStrategy { ... }

class VolumePricing implements PricingStrategy { ... }

// Factory

function getPricingStrategy(method: PricingMethod): PricingStrategy {

  switch(method) {

    case 'SLICER': return new SlicerBasedPricing();

    case 'BOUNDING\_BOX': return new BoundingBoxPricing();

    case 'VOLUME': return new VolumePricing();

  }

}

**V konfiguraci tenanta** uložit zvolenou metodu. Při výpočtu ceny vybrat odpovídající strategii.

**UI indikace:** V Developer režimu v kalkulačce zobrazit, která metoda cenotvorby byla použita.

---

## **SEKCE 16 — Multijazyčnost a multiměnovost**

### **16.1 Systém překladů pro widget**

**Princip i18n (internacionalizace):** Všechny textové řetězce ve widgetu/kalkulačce nahradit klíči překladu. Překlady uložit v JSON souborech per jazyk.

**Struktura překladových souborů:**

/locales

  /cs.json    // Čeština (výchozí)

  /en.json    // Angličtina

  /de.json    // Němčina

  /sk.json    // Slovenština

  /pl.json    // Polština

**Příklad cs.json:**

json

{

  "upload": {

    "title": "Nahrání 3D modelu",

    "subtitle": "Nahrajte své 3D modely a nakonfigurujte parametry tisku.",

    "dropzone": "Přetáhněte soubory sem nebo klikněte pro výběr",

    "supportedFormats": "Podporované formáty: .stl, .obj, .3mf, .step"

  },

  "configuration": {

    "material": "Materiál",

    "color": "Barva",

    "layerQuality": "Kvalita vrstvy",

    "infill": "Výplň",

    "supports": "Podpěry",

    "quantity": "Počet kusů"

  },

  "pricing": {

    "total": "Celkem",

    "material": "Materiál",

    "printTime": "Čas tisku",

    "services": "Služby",

    "discount": "Sleva",

    "shipping": "Doprava",

    "calculate": "Spočítat cenu",

    "recalculate": "Přepočítat"

  },

  "checkout": {

    "contactInfo": "Kontaktní údaje",

    "name": "Jméno a příjmení",

    "email": "E-mail",

    "phone": "Telefon",

    "address": "Adresa",

    "note": "Poznámka k objednávce",

    "submit": "Odeslat objednávku",

    "gdprConsent": "Souhlasím se zpracováním osobních údajů"

  },

  "confirmation": {

    "title": "Děkujeme za Vaši objednávku\!",

    "orderNumber": "Číslo objednávky",

    "nextSteps": "Objednávku nyní zpracováváme. Na email vám přijde potvrzení."

  }

}

**Knihovny pro React:**

* **next-intl** (pro Next.js projekty) — doporučeno  
* **react-intl** (Format.js) — robustní, široce používaný  
* **i18next** \+ react-i18next — velmi flexibilní, velká komunita

**Implementace:**

jsx

*// Použití v komponentě*

import { useTranslations } from 'next-intl';

function UploadStep() {

  const t \= useTranslations('upload');


  return (

    \<div\>

      \<h1\>{t('title')}\</h1\>

      \<p\>{t('subtitle')}\</p\>

      \<Dropzone label\={t('dropzone')} /\>

    \</div\>

  );

}

\`\`\`

\---

\#\#\# 16.2 Admin správa jazyků

\*\*Umístění:\*\* Admin \> Widget \> Jazyk (rozšíření stávajícího přepínače CZ/CS) nebo nová stránka Admin \> Lokalizace.

\*\*Nastavení:\*\*

\- \*\*Výchozí jazyk widgetu\*\* — dropdown s dostupnými jazyky

\- \*\*Povolené jazyky\*\* — multiselect, které jazyky zákazník může vybrat

\- \*\*Zobrazit přepínač jazyků\*\* — toggle (ano/ne) — pokud ne, widget je jen ve výchozím jazyce

\- \*\*Pozice přepínače\*\* — hlavička widgetu / patička / skrytý (jen URL parametr)

\*\*Vlastní překlady (override):\*\*

\- Tabulka s klíči překladu a hodnotami

\- Admin může přepsat výchozí překlady vlastními texty

\- Např. změnit "Odeslat objednávku" na "Odeslat poptávku" nebo "Objednat"

\- Search/filter pro rychlé hledání klíče

\*\*Přidání nového jazyka:\*\*

\- Tlačítko "Přidat jazyk"

\- Výběr z předpřipravených jazyků (cs, en, de, sk, pl, fr, es, it...)

\- Nebo upload vlastního JSON souboru s překlady

\- Možnost exportovat stávající překlady jako JSON šablonu pro překlad

\*\*Databázový model:\*\*

\`\`\`

Tabulka: tenant\_translations

\- id

\- tenant\_id

\- locale (cs, en, de...)

\- translation\_key (např. "upload.title")

\- translation\_value (přepsaná hodnota)

\- created\_at, updated\_at

---

### **16.3 Podpora více měn s přepočtem**

**Admin nastavení (Admin \> Pricing nebo Admin \> Lokalizace):**

**Hlavní měna:**

* Dropdown: CZK, EUR, USD, GBP, PLN, CHF...  
* Všechny ceny v admin panelu se zadávají v této měně  
* Symbol měny a formát (1.234,56 Kč vs 1,234.56 €)

**Dodatečné měny pro widget:**

* Multiselect povolených měn pro zákazníka  
* U každé měny: pevný kurz (admin zadá manuálně) NEBO automatický kurz (z API)

**Zdroj kurzů (pro automatický přepočet):**

* exchangeratesapi.io (free tier dostupný)  
* fixer.io  
* Open Exchange Rates  
* Nebo vlastní endpoint firmy

**Frekvence aktualizace kurzů:** Denně / při každém načtení / manuálně

**Zobrazení ve widgetu:**

**Přepínač měny:**

* V hlavičce widgetu vedle přepínače jazyků  
* Dropdown nebo segmented control (CZK | EUR | USD)

**Formátování cen:**

* Použít Intl.NumberFormat pro správné formátování dle locale

javascript

const formatPrice \= (amount, currency, locale) \=\> {

  return new Intl.NumberFormat(locale, {

    style: 'currency',

    currency: currency

  }).format(amount);

};

formatPrice(1234.56, 'CZK', 'cs-CZ'); *// "1 234,56 Kč"*

formatPrice(1234.56, 'EUR', 'de-DE'); *// "1.234,56 €"*

formatPrice(1234.56, 'USD', 'en-US'); *// "$1,234.56"*

\`\`\`

\*\*Zobrazení přepočtu:\*\*

\- Primární cena ve vybrané měně (velké)

\- Volitelně: původní cena v hlavní měně v závorce (menší text)

\- Např. "€45.50 (1 150 Kč)"

\*\*Důležité:\*\*

\- Objednávka se vždy ukládá v hlavní měně tenanta (pro konzistenci účetnictví)

\- Zobrazená měna zákazníka je informativní

\- Na faktuře/potvrzení uvést obě měny nebo jen hlavní měnu (konfigurovatelné)

\---

\#\# SEKCE 17 — E-commerce pluginy a integrace

ModelPricer aktuálně nabízí iframe embed s auto-resize skriptem a domain whitelist. AutoQuote3D nabízí one-line install pro Shopify, WordPress, Webflow. Rozšíření o dedikované pluginy.

\#\#\# 17.1 WordPress/WooCommerce plugin

\*\*Funkcionalita pluginu:\*\*

\- Přidá shortcode \`\[modelpricer\]\` pro vložení kalkulačky do stránky/příspěvku

\- Přidá Gutenberg block "ModelPricer Calculator" pro vizuální editor

\- Automaticky vloží iframe s konfigurací (widget ID, API klíč)

\- Responsive — přizpůsobí se šířce kontejneru

\*\*Nastavení v WordPress admin:\*\*

\- Stránka Settings \> ModelPricer

\- Pole: API klíč (z ModelPricer admin panelu)

\- Pole: Widget ID (z ModelPricer admin panelu)

\- Pole: Výchozí šířka (px nebo %)

\- Pole: Výchozí jazyk

\- Checkbox: Povolit zákazníkovi měnit jazyk/měnu

\*\*Shortcode parametry:\*\*

\`\`\`

\[modelpricer\]

\[modelpricer width\="100%" lang\="cs"\]

\[modelpricer widget\_id\="xyz123" height\="800px"\]

**Gutenberg block:**

* Vizuální náhled v editoru (placeholder nebo live preview)  
* Sidebar s nastavením: šířka, výška, jazyk, téma  
* Drag-and-drop umístění na stránce

**WooCommerce integrace (pokročilé):**

* Vytvořit WooCommerce produkt typu "3D Print Service"  
* Zákazník nakonfiguruje v kalkulačce, přidá do košíku WooCommerce  
* Checkout přes WooCommerce (využití stávajících platebních bran)  
* Objednávka se synchronizuje zpět do ModelPricer admin panelu  
* Toto vyžaduje API integraci (Sekce 20\)

**Technická implementace:**

php

\<?php

*/\**

Plugin Name: ModelPricer 3D Print Calculator

Description: Embed ModelPricer calculator in your WordPress site

Version: 1.0.0

*\*/*

*// Shortcode*

function modelpricer\_shortcode($atts) {

    $atts \= shortcode\_atts(array(

        'widget\_id' \=\> get\_option('modelpricer\_widget\_id'),

        'width' \=\> '100%',

        'height' \=\> '800px',

        'lang' \=\> 'cs'

    ), $atts);

    

    $iframe\_url \= 'https://app.modelpricer.com/widget/' . $atts\['widget\_id'\] . '?lang=' . $atts\['lang'\];

    

    return '\<iframe 

        src="' . esc\_url($iframe\_url) . '" 

        width="' . esc\_attr($atts\['width'\]) . '" 

        height="' . esc\_attr($atts\['height'\]) . '"

        frameborder="0"

        style="border: none;"

    \>\</iframe\>';

}

add\_shortcode('modelpricer', 'modelpricer\_shortcode');

*// Admin settings page*

function modelpricer\_admin\_menu() {

    add\_options\_page(

        'ModelPricer Settings',

        'ModelPricer',

        'manage\_options',

        'modelpricer',

        'modelpricer\_settings\_page'

    );

}

add\_action('admin\_menu', 'modelpricer\_admin\_menu');

**Distribuce:**

* WordPress.org plugin repository (free, veřejné)  
* Nebo stažení ZIP z ModelPricer admin panelu / webu  
* Automatické aktualizace přes WordPress update systém

---

### **17.2 Shopify plugin**

**Shopify App:**

* Registrace v Shopify Partner Dashboard  
* App typu "Embedded app" s App Bridge  
* Distribuce přes Shopify App Store (nebo unlisted pro vlastní zákazníky)

**Funkcionalita:**

* Přidá "App Block" do Shopify Online Store 2.0 theme editoru  
* Merchant přetáhne block na stránku (product page, custom page...)  
* Block renderuje ModelPricer iframe

**Nastavení v Shopify admin:**

* App stránka s konfigurací  
* Propojení s ModelPricer účtem (OAuth flow nebo API klíč)  
* Výběr widget instance  
* Nastavení vzhledu (šířka, výška, téma)

**App Block (theme extension):**

liquid

{% comment %} *blocks/modelpricer-calculator.liquid* {% endcomment %}

{% schema %}

{

  "name": "3D Print Calculator",

  "target": "section",

  "settings": \[

    {

      "type": "text",

      "id": "widget\_id",

      "label": "Widget ID",

      "default": ""

    },

    {

      "type": "range",

      "id": "height",

      "label": "Height (px)",

      "min": 400,

      "max": 1200,

      "step": 50,

      "default": 800

    }

  \]

}

{% endschema %}

\<div class\="modelpricer-container" style\="width: 100%;"\>

  \<iframe 

    src\="https://app.modelpricer.com/widget/{{ block.settings.widget\_id }}"

    width\="100%"

    height\="{{ block.settings.height }}px"

    frameborder\="0"

    style\="border: none;"\>

  \</iframe\>

\</div\>

**Shopify Checkout integrace (pokročilé):**

* Podobně jako WooCommerce — přidat produkt do Shopify košíku  
* Využít Shopify Cart API a Checkout API  
* Vyžaduje Shopify Plus pro plnou checkout customizaci (nebo draft orders API)

---

### **17.3 Dokumentace pro integraci**

**Veřejná dokumentační stránka:** /docs nebo /integrace nebo docs.modelpricer.com

**Struktura dokumentace:**

**Začínáme (Getting Started):**

* Co je ModelPricer  
* Vytvoření účtu  
* Základní nastavení admin panelu  
* Získání Widget ID a API klíče

**Iframe Embed (základní):**

* Kód pro vložení iframe  
* Parametry URL (lang, theme, currency...)  
* Auto-resize skript  
* Příklady pro různé platformy (HTML, React, Vue, Angular)

**WordPress plugin:**

* Instalace pluginu  
* Konfigurace  
* Použití shortcode  
* Použití Gutenberg blocku  
* Troubleshooting

**Shopify app:**

* Instalace z App Store  
* Propojení účtu  
* Přidání na stránku  
* Nastavení vzhledu

**Webflow/Squarespace/Wix:**

* Návod pro iframe vkládání na platformách bez pluginů  
* Custom code embed  
* Responzivní nastavení

**API dokumentace (Sekce 20):**

* Odkaz na API reference  
* Autentizace  
* Příklady použití

**Webhooky:**

* Dostupné události  
* Formát payload  
* Ověření podpisu  
* Příklady handlerů

**Kódové příklady:**

**HTML:**

html

\<iframe 

  src\="https://app.modelpricer.com/widget/YOUR\_WIDGET\_ID" 

  width\="100%" 

  height\="800" 

  frameborder\="0"\>

\</iframe\>

\<script src\="https://app.modelpricer.com/embed.js"\>\</script\>

**React:**

jsx

import { ModelPricerWidget } from '@modelpricer/react';

function App() {

  return (

    \<ModelPricerWidget 

      widgetId\="YOUR\_WIDGET\_ID"

      lang\="cs"

      theme\="light"

      onOrderSubmit\={(order) \=\> console.log('Order:', order)}

    /\>

  );

}

**Vue:**

vue

\<template\>

  \<ModelPricerWidget 

    widget-id="YOUR\_WIDGET\_ID"

    lang="cs"

    @order-submit="handleOrder"

  /\>

\</template\>

\<script\>

import { ModelPricerWidget } from '@modelpricer/vue';

export default {

  components: { ModelPricerWidget },

  methods: {

    handleOrder(order) {

      console.log('Order:', order);

    }

  }

}

\</script\>

**Technologie dokumentace:**

* Staticky generované stránky (MDX \+ Next.js, Docusaurus, nebo VitePress)  
* Nebo integrace s platformou (Notion, GitBook, ReadMe.io)  
* Search functionality (Algolia DocSearch nebo built-in)  
* Verzování dokumentace (v1, v2...)  
* Changelog / What's New sekce

## **SEKCE 18 — Pokročilé funkce (Více technologií, Verzování, Supply chain)**

Toto je nejnáročnější sekce — obsahuje fundamentální rozšíření architektury platformy.

### **18.1 Podpora více výrobních technologií (SLA, SLS, CNC)**

**AKTUÁLNÍ STAV:** ModelPricer je zaměřen na FDM/FFF tisk s PrusaSlicer. Rozšíření o další technologie vyžaduje zásadní architekturální změny.

**Abstrakce konceptu "technologie":**

Nová entita v systému — **Technology** (nebo Manufacturing Method):

* FDM (Fused Deposition Modeling) — stávající  
* SLA (Stereolithography) — pryskyřicový tisk  
* SLS (Selective Laser Sintering) — práškový tisk  
* CNC Machining — obrábění  
* Laser Cutting — laserové řezání

**Každá technologie má vlastní:**

**Parametry:**

* FDM: výplň, výška vrstvy, podpěry, teplota, rychlost  
* SLA: expozice, výška vrstvy, orientace, podpěry, post-cure  
* SLS: orientace, hustota balení, post-processing  
* CNC: hloubka řezu, nástroj, rychlost posuvu, chlazení

**Materiály:**

* FDM: PLA, ABS, PETG, TPU, Nylon, PC...  
* SLA: Standard resin, Tough resin, Flexible resin, Castable resin...  
* SLS: Nylon PA11, PA12, TPU, PEEK...  
* CNC: Hliník, Ocel, Mosaz, Dřevo, Plast...

**Metodu cenotvorby:**

* FDM: slicer-based (hmotnost \+ čas)  
* SLA: volume-based (objem modelu × cena pryskyřice)  
* SLS: volume-based \+ bounding box (prostor v komoře)  
* CNC: time-based (čas obrábění) \+ materiál

**Slicovací/výpočetní engine:**

* FDM: PrusaSlicer, Cura, Slic3r  
* SLA: Chitubox, Lychee, nebo vlastní výpočet  
* SLS: vlastní výpočet (není standardní slicer)  
* CNC: CAM software nebo vlastní kalkulace

**Admin panel — Admin \> Technologie:**

**Seznam technologií:**

* Předdefinované technologie (FDM, SLA, SLS, CNC, Laser)  
* Možnost aktivovat/deaktivovat pro daného tenanta  
* Možnost přidat vlastní technologii (custom název, parametry)

**Konfigurace per technologie:**

* Název a popis  
* Ikona  
* Dostupné materiály (propojení na Admin \> Pricing \> Materiály)  
* Parametry zobrazené ve widgetu (které parametry zákazník může nastavit)  
* Metoda cenotvorby (Sekce 15\)  
* Slicovací engine (pokud aplikovatelné)  
* Výchozí nastavení

**Widget — výběr technologie:**

**Umístění:** Jako první krok před uploadem modelu, nebo jako součást konfigurace.

**UI:** Karty/dlaždice s ikonami technologií:

┌─────────────┐  ┌─────────────┐  ┌─────────────┐

│   🖨️ FDM    │  │   💧 SLA    │  │   ⚙️ CNC    │

│  3D Tisk    │  │  Pryskyřice │  │  Obrábění   │

│  od 50 Kč   │  │  od 150 Kč  │  │  od 500 Kč  │

└─────────────┘  └─────────────┘  └─────────────┘

**Po výběru technologie:**

* Zobrazí se relevantní upload (formáty dle technologie)  
* Zobrazí se relevantní parametry konfigurace  
* Zobrazí se relevantní materiály

**Databázový model:**

sql

*\-- Tabulka technologií*

CREATE TABLE technologies (

  id UUID PRIMARY KEY,

  tenant\_id UUID REFERENCES tenants(id),

  name VARCHAR(100) NOT NULL,

  slug VARCHAR(50) NOT NULL,

  description TEXT,

  icon\_url VARCHAR(500),

  pricing\_method VARCHAR(50), *\-- SLICER, VOLUME, BOUNDING\_BOX, TIME*

  slicer\_engine VARCHAR(50), *\-- PRUSASLICER, CHITUBOX, NONE*

  is\_active BOOLEAN DEFAULT true,

  sort\_order INTEGER,

  config JSONB, *\-- Další konfigurace specifická pro technologii*

  created\_at TIMESTAMP DEFAULT NOW()

);

*\-- Propojení technologie s materiály*

CREATE TABLE technology\_materials (

  technology\_id UUID REFERENCES technologies(id),

  material\_id UUID REFERENCES materials(id),

  PRIMARY KEY (technology\_id, material\_id)

);

*\-- Parametry technologie*

CREATE TABLE technology\_parameters (

  id UUID PRIMARY KEY,

  technology\_id UUID REFERENCES technologies(id),

  name VARCHAR(100),

  slug VARCHAR(50),

  type VARCHAR(50), *\-- SLIDER, DROPDOWN, CHECKBOX, NUMBER*

  default\_value VARCHAR(100),

  options JSONB, *\-- Pro dropdown: \[{value, label}\]*

  min\_value NUMERIC,

  max\_value NUMERIC,

  is\_visible\_in\_widget BOOLEAN DEFAULT true,

  sort\_order INTEGER

);

**DŮLEŽITÉ:** Toto je velká architekturální změna. Doporučení:

1. Začít s refaktorem backendu pro podporu abstrakce technologií  
2. FDM zůstane výchozí a plně funkční  
3. Přidávat další technologie postupně (SLA jako druhá, pak SLS, pak CNC)  
4. Každá technologie může být v "beta" stavu než bude plně otestovaná

---

### **18.2 Verzování modelů**

**Princip:** Zákazník může nahrát aktualizovaný model a systém zachová historii verzí. Užitečné pro iterativní návrh — zákazník upraví model, nahraje novou verzi, porovná ceny.

**Databázový model:**

sql

*\-- Rozšíření tabulky modelů*

CREATE TABLE model\_versions (

  id UUID PRIMARY KEY,

  model\_id UUID REFERENCES models(id), *\-- Hlavní model*

  version INTEGER NOT NULL, *\-- 1, 2, 3...*

  file\_url VARCHAR(500) NOT NULL,

  file\_name VARCHAR(255),

  file\_size BIGINT,

  *\-- Metadata z analýzy*

  bounding\_box JSONB, *\-- {x, y, z}*

  volume NUMERIC,

  surface\_area NUMERIC,

  triangle\_count INTEGER,

  *\-- Výsledky slicování (pokud provedeno)*

  slicer\_result JSONB,

  *\-- Cena (pokud spočítána)*

  calculated\_price NUMERIC,

  price\_breakdown JSONB,

  *\-- Timestamps*

  uploaded\_at TIMESTAMP DEFAULT NOW(),

  uploaded\_by UUID REFERENCES users(id)

);

*\-- Index pro rychlé hledání verzí modelu*

CREATE INDEX idx\_model\_versions\_model\_id ON model\_versions(model\_id);

**Workflow v kalkulačce:**

**Nahrání nové verze:**

* U existujícího modelu v panelu "Nahrané modely" tlačítko "Nahrát novou verzi"  
* Nebo drag-and-drop na existující model  
* Systém detekuje, že jde o aktualizaci (stejný název souboru nebo explicitní akce)

**Zobrazení verzí:**

* U modelu ikona/badge "v3" indikující aktuální verzi  
* Kliknutím rozbalit historii verzí  
* Každá verze zobrazuje: datum, rozměry, cenu (pokud spočítána)

**Porovnání verzí:**

* Tlačítko "Porovnat s předchozí verzí"  
* Side-by-side zobrazení: 3D náhled obou verzí, rozdíly v rozměrech, rozdíl v ceně  
* Vizuální diff (pokud technicky možné) — overlay změněných částí

**Admin panel:**

* V detailu objednávky zobrazit historii verzí modelu  
* Možnost stáhnout kteroukoliv verzi  
* Audit log změn

**Zákaznický portál:**

* Zákazník vidí historii verzí svých modelů  
* Může se vrátit k předchozí verzi  
* Může objednat starší verzi

---

### **18.3 Supply chain a správa dodavatelů**

**Princip:** Pro firmy, které outsourcují tisk externím dodavatelům nebo mají síť partnerských tiskáren.

**Admin panel — Admin \> Dodavatelé:**

**Seznam dodavatelů:**

* Název firmy  
* Kontaktní údaje (email, telefon, adresa)  
* Podporované technologie (FDM, SLA, SLS...)  
* Podporované materiály  
* Kapacita (počet tiskáren, max. objem/měsíc)  
* Ceník (marže nebo fixní ceny)  
* Dodací lhůty  
* Kvalitativní hodnocení (interní)  
* Aktivní/neaktivní

**Přiřazení objednávky dodavateli:**

**Manuální přiřazení:**

* V detailu objednávky dropdown "Přiřadit dodavateli"  
* Výběr z aktivních dodavatelů  
* Volitelně: automatické odeslání emailu dodavateli s detaily objednávky

**Automatické přiřazení (pokročilé):**

* Pravidla pro automatické routování objednávek  
* Např. "Objednávky SLA → Dodavatel X", "Objednávky nad 1000 Kč → Dodavatel Y"  
* Load balancing — rovnoměrné rozdělení mezi dodavatele dle kapacity

**Sledování stavu u dodavatele:**

* Dodavatel může mít přístup do omezeného portálu  
* Nebo integrace přes API/webhook  
* Stavy: Přijato dodavatelem → Ve výrobě → Odesláno → Doručeno zpět

**Finanční přehled:**

* Náklady na dodavatele vs. cena pro zákazníka  
* Marže per objednávka  
* Report nákladů per dodavatel za období

**Databázový model:**

sql

CREATE TABLE suppliers (

  id UUID PRIMARY KEY,

  tenant\_id UUID REFERENCES tenants(id),

  name VARCHAR(255) NOT NULL,

  email VARCHAR(255),

  phone VARCHAR(50),

  address JSONB,

  supported\_technologies UUID\[\], *\-- Reference na technologies*

  supported\_materials UUID\[\], *\-- Reference na materials*

  capacity JSONB, *\-- {printers: 5, monthly\_volume: 1000}*

  pricing JSONB, *\-- Ceník nebo marže*

  lead\_time\_days INTEGER,

  rating INTEGER, *\-- 1-5*

  notes TEXT,

  is\_active BOOLEAN DEFAULT true,

  created\_at TIMESTAMP DEFAULT NOW()

);

CREATE TABLE order\_supplier\_assignments (

  id UUID PRIMARY KEY,

  order\_id UUID REFERENCES orders(id),

  supplier\_id UUID REFERENCES suppliers(id),

  assigned\_at TIMESTAMP DEFAULT NOW(),

  assigned\_by UUID REFERENCES users(id),

  status VARCHAR(50), *\-- PENDING, ACCEPTED, IN\_PRODUCTION, SHIPPED, DELIVERED*

  supplier\_notes TEXT,

  cost NUMERIC, *\-- Náklady od dodavatele*

  tracking\_number VARCHAR(100)

);

**DŮLEŽITÉ:** Toto je enterprise funkce. Implementovat až po stabilizaci základních funkcí. Většina menších tiskáren toto nepotřebuje.

---

## **SEKCE 19 — CRM, Marketing a Analytika**

### **19.1 Rozšířená zákaznická databáze a segmentace**

**Admin panel — Admin \> Zákazníci:**

**Seznam zákazníků:**

* Tabulka všech zákazníků (z objednávek a registrací v zákaznickém portálu)  
* Sloupce: Jméno, Email, Telefon, Počet objednávek, Celková útrata, Poslední aktivita, Tagy  
* Filtry: dle tagů, útraty, frekvence, data registrace  
* Vyhledávání: dle jména, emailu, telefonu  
* Export: CSV, Excel

**Detail zákazníka:**

* Kontaktní údaje (editovatelné)  
* Historie objednávek (tabulka s odkazy na detail objednávky)  
* Statistiky:  
  * Celková útrata (lifetime value)  
  * Počet objednávek  
  * Průměrná hodnota objednávky  
  * Nejčastější materiály  
  * Poslední objednávka (datum)  
  * První objednávka (datum)  
* Komunikace (pokud implementován chat — Sekce 11\)  
* Poznámky (interní poznámky týmu o zákazníkovi)  
* Tagy/štítky

**Segmentace — Tagy:**

* Předdefinované tagy: VIP, B2B, Nový, Opakovaný, Problémový, Neaktivní  
* Vlastní tagy (admin vytváří)  
* Automatické tagování dle pravidel:  
  * "VIP" pokud celková útrata \> 10 000 Kč  
  * "Opakovaný" pokud počet objednávek \> 3  
  * "Neaktivní" pokud poslední objednávka \> 180 dní

**Segmenty (uložené filtry):**

* Admin může vytvořit pojmenovaný segment s filtry  
* Např. "VIP zákazníci v Praze" \= tag:VIP AND město:Praha  
* Segmenty se používají pro cílené kampaně (bod 19.3)

**Databázový model:**

sql

CREATE TABLE customers (

  id UUID PRIMARY KEY,

  tenant\_id UUID REFERENCES tenants(id),

  email VARCHAR(255) NOT NULL,

  name VARCHAR(255),

  phone VARCHAR(50),

  company VARCHAR(255),

  ico VARCHAR(20),

  dic VARCHAR(20),

  address JSONB,

  *\-- Statistiky (denormalizované pro rychlost)*

  total\_spent NUMERIC DEFAULT 0,

  order\_count INTEGER DEFAULT 0,

  average\_order\_value NUMERIC DEFAULT 0,

  first\_order\_at TIMESTAMP,

  last\_order\_at TIMESTAMP,

  *\-- Metadata*

  source VARCHAR(50), *\-- WIDGET, IMPORT, MANUAL*

  notes TEXT,

  created\_at TIMESTAMP DEFAULT NOW(),

  updated\_at TIMESTAMP DEFAULT NOW()

);

CREATE TABLE customer\_tags (

  customer\_id UUID REFERENCES customers(id),

  tag\_id UUID REFERENCES tags(id),

  assigned\_at TIMESTAMP DEFAULT NOW(),

  assigned\_by UUID REFERENCES users(id),

  PRIMARY KEY (customer\_id, tag\_id)

);

CREATE TABLE tags (

  id UUID PRIMARY KEY,

  tenant\_id UUID REFERENCES tenants(id),

  name VARCHAR(100) NOT NULL,

  color VARCHAR(7), *\-- Hex color*

  is\_auto BOOLEAN DEFAULT false, *\-- Automaticky přiřazovaný*

  auto\_rules JSONB *\-- Pravidla pro automatické přiřazení*

);

CREATE TABLE customer\_segments (

  id UUID PRIMARY KEY,

  tenant\_id UUID REFERENCES tenants(id),

  name VARCHAR(100) NOT NULL,

  filters JSONB NOT NULL, *\-- {tags: \[...\], min\_spent: 1000, ...}*

  customer\_count INTEGER, *\-- Cache počtu zákazníků*

  created\_at TIMESTAMP DEFAULT NOW()

);

\`\`\`

\---

\#\#\# 19.2 Abandoned cart tracking

\*\*Princip:\*\* Sledování kalkulací, které nebyly dokončeny jako objednávka. Cenná data pro pochopení konverzního trychtýře a možnost follow-up.

\*\*Co se sleduje:\*\*

\- Zákazník nahraje model ✓

\- Zákazník nakonfiguruje parametry ✓

\- Zákazník spočítá cenu ✓

\- Zákazník zadá kontaktní údaje (částečně nebo úplně)

\- Zákazník NEODEŠLE objednávku ✗

\*\*Uložená data pro abandoned cart:\*\*

\- Session ID / fingerprint

\- Timestamp začátku a poslední aktivity

\- Nahrané modely (URL souborů)

\- Konfigurace (materiál, preset, množství...)

\- Spočítaná cena

\- Kontaktní údaje (pokud zadány — zejména email)

\- Zdroj návštěvy (referrer, UTM parametry)

\- Zařízení (desktop/mobile, prohlížeč)

\*\*Admin panel — Admin \> Analytics \> Ztracené kalkulace:\*\*

Záložka již existuje — rozšířit o:

\*\*Přehledový dashboard:\*\*

\- Počet abandoned carts za období

\- Celková hodnota abandoned carts

\- Konverzní poměr (dokončené / započaté)

\- Graf trendu v čase

\*\*Seznam abandoned carts:\*\*

\- Tabulka: Datum, Email (pokud znám), Modely, Cena, Poslední krok, Akce

\- Filtry: období, cenové rozmezí, s emailem / bez emailu

\- Detail: kompletní informace o session, možnost vidět 3D náhledy modelů

\*\*Akce:\*\*

\- "Odeslat follow-up email" (manuální) — pokud máme email

\- "Vytvořit objednávku" — admin může ručně dokončit objednávku za zákazníka (po telefonické dohodě)

\- "Smazat" — GDPR compliance, smazání dat

\*\*Automatický follow-up email (volitelné):\*\*

\*\*Konfigurace v Admin \> Notifikace nebo Admin \> Marketing:\*\*

\- Zapnout/vypnout automatický follow-up

\- Časový delay (např. 24 hodin po opuštění)

\- Maximální počet follow-upů (např. max 2\)

\- Emailová šablona

\*\*Šablona emailu:\*\*

\`\`\`

Předmět: Zapomněli jste na svou objednávku?

Dobrý den,

všimli jsme si, že jste nedokončili svou objednávku 3D tisku.

Vaše cenová nabídka:

\- Model: \[název souboru\]

\- Materiál: \[materiál\]

\- Cena: \[cena\] Kč

\[Tlačítko: Dokončit objednávku\]

Odkaz vás vrátí přímo k vaší rozpracované objednávce.

Máte dotazy? Odpovězte na tento email.

**Technická implementace:**

* Při každé významné akci v kalkulačce ukládat stav do abandoned\_carts tabulky  
* Cron job / scheduled task kontroluje abandoned carts starší než X hodin  
* Pokud je email a nebyl odeslán follow-up, odeslat  
* Sledovat otevření emailu a kliknutí (tracking pixel, UTM parametry)

**Databázový model:**

sql

CREATE TABLE abandoned\_carts (

  id UUID PRIMARY KEY,

  tenant\_id UUID REFERENCES tenants(id),

  session\_id VARCHAR(100),

  *\-- Kontakt*

  email VARCHAR(255),

  name VARCHAR(255),

  phone VARCHAR(50),

  *\-- Obsah košíku*

  models JSONB, *\-- \[{file\_url, file\_name, config, price}\]*

  total\_price NUMERIC,

  *\-- Metadata*

  last\_step VARCHAR(50), *\-- UPLOAD, CONFIG, PRICING, CONTACT*

  source\_url VARCHAR(500),

  utm\_params JSONB,

  device\_info JSONB,

  *\-- Timestamps*

  started\_at TIMESTAMP DEFAULT NOW(),

  last\_activity\_at TIMESTAMP DEFAULT NOW(),

  *\-- Follow-up tracking*

  followup\_count INTEGER DEFAULT 0,

  last\_followup\_at TIMESTAMP,

  recovered\_at TIMESTAMP, *\-- Pokud se vrátil a dokončil*

  order\_id UUID REFERENCES orders(id) *\-- Pokud konvertoval*

);

CREATE INDEX idx\_abandoned\_carts\_email ON abandoned\_carts(email);

CREATE INDEX idx\_abandoned\_carts\_tenant\_last\_activity 

  ON abandoned\_carts(tenant\_id, last\_activity\_at);

\`\`\`

\---

\#\#\# 19.3 Emailové kampaně a marketingová automatizace

\*\*Admin panel — Admin \> Marketing:\*\*

\*\*Dashboard:\*\*

\- Přehled aktivních kampaní

\- Statistiky: odesláno, otevřeno, prokliknuto, konvertováno

\- Rychlé akce: Nová kampaň, Nová automatizace

\*\*Kampaně (jednorázové emaily):\*\*

\*\*Vytvoření kampaně:\*\*

1\. Název kampaně

2\. Výběr příjemců:

   \- Všichni zákazníci

   \- Segment (z bodu 19.1)

   \- Manuální výběr

   \- Import seznamu emailů

3\. Obsah emailu:

   \- Předmět

   \- WYSIWYG editor nebo HTML editor

   \- Personalizace: {{name}}, {{last\_order\_date}}, {{total\_spent}}

   \- Náhled (desktop/mobile)

4\. Plánování:

   \- Odeslat ihned

   \- Naplánovat na datum/čas

5\. Odeslání / uložení jako draft

\*\*Statistiky kampaně:\*\*

\- Odesláno: X

\- Doručeno: X (X%)

\- Otevřeno: X (X%) — tracking pixel

\- Prokliknuto: X (X%) — UTM tracking

\- Odhlášeno: X

\- Konvertováno (objednávka): X

\*\*Automatizace (triggered emaily):\*\*

\*\*Typy automatizací:\*\*

\- \*\*Welcome email\*\* — při registraci zákazníka

\- \*\*Abandoned cart\*\* — po opuštění košíku (bod 19.2)

\- \*\*Post-purchase\*\* — X dní po dokončení objednávky (žádost o recenzi)

\- \*\*Win-back\*\* — zákazník neobjednal X dní

\- \*\*Birthday\*\* — narozeniny (pokud máme datum)

\- \*\*Milestone\*\* — X-tá objednávka, utraceno X Kč

\*\*Konfigurace automatizace:\*\*

\- Trigger (událost)

\- Delay (ihned / za X hodin/dní)

\- Podmínky (jen pro segment, jen pokud...)

\- Emailová šablona

\- Aktivní/neaktivní

\*\*Šablony emailů:\*\*

\- Knihovna předdefinovaných šablon

\- Drag-and-drop email builder (nebo integrace s existujícím)

\- Responzivní design

\- Uložení vlastních šablon

\*\*Alternativa — integrace s existující platformou:\*\*

Místo budování vlastního email marketingu integrovat s:

\- \*\*Mailchimp\*\* — nejrozšířenější, robustní API

\- \*\*Brevo (ex Sendinblue)\*\* — dobrá cena, EU hosting

\- \*\*Klaviyo\*\* — specializovaný na e-commerce

\- \*\*Customer.io\*\* — flexibilní automatizace

\*\*Integrace by zahrnovala:\*\*

\- Synchronizace zákazníků (customers → email list)

\- Synchronizace tagů/segmentů

\- Webhook pro eventy (objednávka, abandoned cart)

\- Admin UI pro propojení účtů a základní nastavení

\*\*Doporučení:\*\* Pro MVP integrovat s Mailchimp/Brevo. Vlastní email marketing budovat jen pokud je to core feature.

\---

\#\# SEKCE 20 — Veřejné API a Developer portál

\#\#\# 20.1 REST API design a endpointy

\*\*Base URL:\*\* \`https:*//api.modelpricer.com/v1\`*

\*\*Autentizace:\*\* Bearer token v hlavičce

\`\`\`

Authorization: Bearer mp\_live\_xxxxxxxxxxxx

**Formát odpovědí:** JSON

json

{

  "success": true,

  "data": { ... },

  "meta": {

    "request\_id": "req\_abc123",

    "timestamp": "2024-01-15T10:30:00Z"

  }

}

**Chybové odpovědi:**

json

{

  "success": false,

  "error": {

    "code": "VALIDATION\_ERROR",

    "message": "Invalid file format",

    "details": {

      "field": "file",

      "allowed": \[".stl", ".obj", ".3mf"\]

    }

  }

}

\`\`\`

\*\*Endpointy:\*\*

\*\*Models (Modely):\*\*

\`\`\`

POST   /models/upload          Nahrání modelu

GET    /models/{id}            Detail modelu

DELETE /models/{id}            Smazání modelu

GET    /models/{id}/analysis   Analýza modelu (rozměry, objem...)

\`\`\`

\*\*Quotes (Cenové nabídky):\*\*

\`\`\`

POST   /quotes                 Vytvoření cenové nabídky

GET    /quotes/{id}            Detail nabídky

GET    /quotes                 Seznam nabídek (s filtrací)

\`\`\`

\*\*Orders (Objednávky):\*\*

\`\`\`

POST   /orders                 Vytvoření objednávky

GET    /orders/{id}            Detail objednávky

GET    /orders                 Seznam objednávek (s filtrací)

PATCH  /orders/{id}            Aktualizace objednávky (status, poznámky)

\`\`\`

\*\*Materials (Materiály):\*\*

\`\`\`

GET    /materials              Seznam dostupných materiálů

GET    /materials/{id}         Detail materiálu

\`\`\`

\*\*Presets:\*\*

\`\`\`

GET    /presets                Seznam dostupných presetů

GET    /presets/{id}           Detail presetu

\`\`\`

\*\*Shipping (Doprava):\*\*

\`\`\`

GET    /shipping-methods       Seznam dopravních metod

POST   /shipping/calculate     Kalkulace ceny dopravy

\`\`\`

\*\*Customers (Zákazníci):\*\*

\`\`\`

GET    /customers              Seznam zákazníků

GET    /customers/{id}         Detail zákazníka

POST   /customers              Vytvoření zákazníka

PATCH  /customers/{id}         Aktualizace zákazníka

\`\`\`

\*\*Webhooks:\*\*

\`\`\`

GET    /webhooks               Seznam webhooků

POST   /webhooks               Vytvoření webhooku

DELETE /webhooks/{id}          Smazání webhooku

**Příklady requestů:**

**Upload modelu:**

bash

curl \-X POST https://api.modelpricer.com/v1/models/upload \\\\

  \-H "Authorization: Bearer mp\_live\_xxx" \\\\

  \-F "file=@model.stl" \\\\

  \-F "name=My Model"

Response:

json

{

  "success": true,

  "data": {

    "id": "mod\_abc123",

    "name": "My Model",

    "file\_name": "model.stl",

    "file\_size": 1234567,

    "status": "processing",

    "analysis": null,

    "created\_at": "2024-01-15T10:30:00Z"

  }

}

**Vytvoření cenové nabídky:**

bash

curl \-X POST https://api.modelpricer.com/v1/quotes \\\\

  \-H "Authorization: Bearer mp\_live\_xxx" \\\\

  \-H "Content-Type: application/json" \\\\

  \-d '{

    "models": \[

      {

        "model\_id": "mod\_abc123",

        "material\_id": "mat\_pla",

        "preset\_id": "pre\_standard",

        "quantity": 5,

        "color": "red",

        "infill": 20

      }

    \]

  }'

Response:

json

{

  "success": true,

  "data": {

    "id": "quo\_xyz789",

    "status": "calculated",

    "models": \[

      {

        "model\_id": "mod\_abc123",

        "name": "My Model",

        "quantity": 5,

        "unit\_price": 150.00,

        "total\_price": 750.00,

        "breakdown": {

          "material": 45.00,

          "time": 95.00,

          "fees": 10.00

        }

      }

    \],

    "subtotal": 750.00,

    "discount": 0,

    "shipping": null,

    "total": 750.00,

    "currency": "CZK",

    "valid\_until": "2024-01-22T10:30:00Z"

  }

}

**Vytvoření objednávky:**

bash

curl \-X POST https://api.modelpricer.com/v1/orders \\\\

  \-H "Authorization: Bearer mp\_live\_xxx" \\\\

  \-H "Content-Type: application/json" \\\\

  \-d '{

    "quote\_id": "quo\_xyz789",

    "customer": {

      "name": "Jan Novák",

      "email": "jan@example.com",

      "phone": "+420123456789"

    },

    "shipping\_address": {

      "street": "Hlavní 123",

      "city": "Praha",

      "postal\_code": "11000",

      "country": "CZ"

    },

    "shipping\_method\_id": "shp\_ceska\_posta",

    "note": "Prosím zabalit jednotlivě"

  }'

\`\`\`

\---

*\#\#\# 20.2 API klíče a autentizace*

\*\*Admin panel — Admin \> API:\*\*

\*\*Správa API klíčů:\*\*

\- Seznam existujících klíčů

\- Vytvoření nového klíče

\- Smazání/revokace klíče

\- Regenerace klíče

\*\*Vytvoření API klíče:\*\*

\- Název (pro identifikaci, např. "E-shop integrace", "Mobilní app")

\- Typ: Live (produkční) / Test (sandbox)

\- Oprávnění (scopes):

  \- \`models:read\`, \`models:write\`

  \- \`quotes:read\`, \`quotes:write\`

  \- \`orders:read\`, \`orders:write\`

  \- \`customers:read\`, \`customers:write\`

  \- \`webhooks:manage\`

\- IP whitelist (volitelné — omezení na konkrétní IP adresy)

\- Expirační datum (volitelné)

\*\*Formát klíčů:\*\*

\- Live: \`mp\_live\_xxxxxxxxxxxxxxxxxxxxxxxx\`

\- Test: \`mp\_test\_xxxxxxxxxxxxxxxxxxxxxxxx\`

\*\*Zobrazení klíče:\*\*

\- Klíč se zobrazí pouze jednou při vytvoření

\- Poté je uložen hashovaný (nelze znovu zobrazit)

\- Možnost regenerovat (starý přestane fungovat)

\*\*Rate limiting:\*\*

\- Výchozí: 100 requestů/minuta

\- Vyšší limity pro vyšší tarify

\- Hlavičky v response:

\`\`\`

  X-RateLimit-Limit: 100

  X-RateLimit-Remaining: 95

  X-RateLimit-Reset: 1705312260

* Při překročení: HTTP 429 Too Many Requests

**Logování API volání:**

sql

CREATE TABLE api\_logs (

  id UUID PRIMARY KEY,

  api\_key\_id UUID REFERENCES api\_keys(id),

  tenant\_id UUID REFERENCES tenants(id),

  endpoint VARCHAR(255),

  method VARCHAR(10),

  request\_body JSONB,

  response\_status INTEGER,

  response\_time\_ms INTEGER,

  ip\_address INET,

  user\_agent VARCHAR(500),

  created\_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX idx\_api\_logs\_key\_created ON api\_logs(api\_key\_id, created\_at);

**Statistiky v admin panelu:**

* Počet API volání za období  
* Graf volání v čase  
* Nejpoužívanější endpointy  
* Chybovost (4xx, 5xx responses)  
* Průměrná response time

---

### **20.3 Developer dokumentace a portál**

**URL:** `developers.modelpricer.com` nebo `modelpricer.com/developers`

**Struktura dokumentace:**

**1\. Úvod (Getting Started):**

* Co je ModelPricer API  
* Registrace a získání API klíče  
* Autentizace  
* První API volání (quick start)  
* Sandbox vs. Production

**2\. API Reference:**

* Interaktivní dokumentace (Swagger/OpenAPI)  
* Každý endpoint:  
  * Popis  
  * HTTP metoda a URL  
  * Parametry (path, query, body)  
  * Request příklad  
  * Response příklad  
  * Možné chyby  
* "Try it out" — možnost testovat přímo z dokumentace

**3\. Guides (Návody):**

* Kompletní integrace krok za krokem  
* Headless widget implementace  
* Webhook handling  
* Error handling best practices  
* Pagination a filtrování  
* Optimalizace výkonu

**4\. Webhooky:**

* Dostupné události:  
  * `order.created`  
  * `order.updated`  
  * `order.completed`  
  * `order.cancelled`  
  * `quote.created`  
  * `quote.expired`  
* Formát payload  
* Ověření podpisu (HMAC)  
* Retry policy  
* Příklady handlerů (Node.js, Python, PHP)

**5\. SDKs a knihovny:**

* JavaScript/TypeScript: `@modelpricer/js`  
* Python: `modelpricer-python`  
* PHP: `modelpricer/modelpricer-php`  
* (Nebo community maintained)

**6\. Changelog:**

* Historie změn API  
* Breaking changes  
* Nové features  
* Deprecation notices

**7\. Status page:**

* Aktuální stav služby  
* Plánovaná údržba  
* Historie incidentů

**Technická implementace dokumentace:**

**OpenAPI specifikace:**

yaml

openapi: 3.0.3

info:

  title: ModelPricer API

  version: 1.0.0

  description: API for 3D printing price calculation and order management

servers:

  \- url: https://api.modelpricer.com/v1

    description: Production

  \- url: https://api.sandbox.modelpricer.com/v1

    description: Sandbox

security:

  \- bearerAuth: \[\]

paths:

  /models/upload:

    post:

      summary: Upload a 3D model

      tags: \[Models\]

      requestBody:

        content:

          multipart/form-data:

            schema:

              type: object

              properties:

                file:

                  type: string

                  format: binary

                name:

                  type: string

      responses:

        '201':

          description: Model uploaded successfully

          content:

            application/json:

              schema:

                $ref: '\#/components/schemas/Model'

        '400':

          description: Invalid file

        '401':

          description: Unauthorized

components:

  securitySchemes:

    bearerAuth:

      type: http

      scheme: bearer

  schemas:

    Model:

      type: object

      properties:

        id:

          type: string

        name:

          type: string

        file\_name:

          type: string

        status:

          type: string

          enum: \[processing, ready, error\]

        created\_at:

          type: string

          format: date-time

**Nástroje pro dokumentaci:**

* **Swagger UI** — interaktivní dokumentace z OpenAPI spec  
* **Redoc** — alternativní renderer, hezčí design  
* **Stoplight** — komplexní platforma pro API design a dokumentaci  
* **ReadMe.io** — hosted dokumentace s analytics

**SDK příklad (JavaScript):**

javascript

*// @modelpricer/js*

import { ModelPricer } from '@modelpricer/js';

const client \= new ModelPricer({

  apiKey: 'mp\_live\_xxx',

  *// sandbox: true // Pro testování*

});

*// Upload modelu*

const model \= await client.models.upload({

  file: fs.createReadStream('model.stl'),

  name: 'My Model'

});

*// Vytvoření cenové nabídky*

const quote \= await client.quotes.create({

  models: \[{

    modelId: model.id,

    materialId: 'mat\_pla',

    quantity: 5

  }\]

});

*// Vytvoření objednávky*

const order \= await client.orders.create({

  quoteId: quote.id,

  customer: {

    name: 'Jan Novák',

    email: 'jan@example.com'

  }

});

*// Webhook handling*

client.webhooks.on('order.created', (event) \=\> {

  console.log('New order:', event.data.order);

});

## **SEKCE 21 — Bezpečnost, Daně a Enterprise**

### **21.1 Daňový management (DPH/VAT)**

**Admin panel — Admin \> Nastavení \> Daně (nebo Admin \> Pricing \> Daně):**

**Základní nastavení DPH:**

* **Hlavní sazba DPH:** dropdown s běžnými sazbami (21% CZ, 19% DE, 20% SK, 23% PL, 20% AT...) nebo vlastní hodnota  
* **Ceny v admin panelu jsou:** radio button — "S DPH" / "Bez DPH"  
* **Zobrazení ve widgetu:** checkbox volby:  
  * Zobrazit cenu bez DPH  
  * Zobrazit cenu s DPH  
  * Zobrazit obě (např. "1 000 Kč bez DPH / 1 210 Kč s DPH")

**Vícero daňových sazeb:**

* Některé služby mohou mít jinou sazbu (např. doprava 21%, ale speciální služby 15%)  
* Tabulka sazeb: Název, Sazba (%), Výchozí (ano/ne), Použít pro (Produkty/Služby/Doprava)  
* U každého materiálu/fee možnost vybrat daňovou sazbu

**Fakturační údaje firmy:**

* Název firmy  
* IČO  
* DIČ (pro plátce DPH)  
* Adresa sídla  
* Bankovní účet (číslo účtu, IBAN, SWIFT)  
* Tyto údaje se použijí na fakturách (Sekce 13\) a v patičce emailů

**B2B — Reverse charge (přenesená daňová povinnost):**

**Princip:** Při prodeji do EU firmám s platným DIČ se DPH neúčtuje (reverse charge mechanismus).

**Implementace:**

* V kontaktním formuláři (Sekce 2\) pole "DIČ" pro B2B zákazníky  
* Při zadání DIČ automatická validace přes **VIES API** (EU služba pro ověření DIČ)  
* Pokud je DIČ platné a zákazník je z jiné EU země:  
  * Cena se zobrazí bez DPH  
  * Na faktuře text "Reverse charge — daň odvede odběratel"  
* Pokud DIČ neplatné nebo stejná země: standardní DPH

**VIES API integrace:**

javascript

*// Příklad volání VIES API*

async function validateVAT(countryCode, vatNumber) {

  const response \= await fetch('https://ec.europa.eu/taxation\_customs/vies/rest-api/ms/' \+ countryCode \+ '/vat/' \+ vatNumber);

  const data \= await response.json();

  return {

    valid: data.isValid,

    name: data.name,

    address: data.address

  };

}

**Zobrazení v kalkulačce:**

* Pokud zákazník zadá platné EU DIČ: "Cena bez DPH (reverse charge): XXX €"  
* Badge/info box vysvětlující reverse charge

**Databázový model:**

sql

CREATE TABLE tax\_rates (

  id UUID PRIMARY KEY,

  tenant\_id UUID REFERENCES tenants(id),

  name VARCHAR(100) NOT NULL, *\-- "Základní sazba", "Snížená sazba"*

  rate NUMERIC(5,2) NOT NULL, *\-- 21.00, 15.00, 10.00*

  is\_default BOOLEAN DEFAULT false,

  applies\_to VARCHAR(50)\[\], *\-- \['PRODUCTS', 'SERVICES', 'SHIPPING'\]*

  is\_active BOOLEAN DEFAULT true

);

CREATE TABLE tenant\_tax\_settings (

  tenant\_id UUID PRIMARY KEY REFERENCES tenants(id),

  prices\_include\_tax BOOLEAN DEFAULT true,

  display\_price\_with\_tax BOOLEAN DEFAULT true,

  display\_price\_without\_tax BOOLEAN DEFAULT false,

  enable\_reverse\_charge BOOLEAN DEFAULT true,

  company\_name VARCHAR(255),

  company\_ico VARCHAR(20),

  company\_dic VARCHAR(20),

  company\_address JSONB,

  bank\_account VARCHAR(50),

  iban VARCHAR(50),

  swift VARCHAR(20)

);

\`\`\`

\---

\#\#\# 21.2 Kreditový systém pro zákazníky

\*\*Princip:\*\* Zákazníci si mohou předplatit kredit (dobít účet) a poté objednávat z kreditního zůstatku. Výhodné pro opakované zákazníky a B2B klienty.

\*\*Admin nastavení — Admin \> Nastavení \> Kredity:\*\*

\- \*\*Povolit kreditový systém:\*\* toggle (ano/ne)

\- \*\*Minimální dobití:\*\* částka (např. 500 Kč)

\- \*\*Bonusové kredity:\*\* volitelně — "Při dobití 1000 Kč bonus 50 Kč" (tabulka pásem)

\- \*\*Expirace kreditů:\*\* počet dní nebo "nikdy" (POZOR: účetní/právní implikace)

\*\*Zákaznický portál — sekce "Můj kredit":\*\*

\*\*Přehled:\*\*

\- Aktuální zůstatek (prominentně)

\- Tlačítko "Dobít kredit"

\- Historie transakcí

\*\*Dobití kreditu:\*\*

\- Výběr částky (předdefinované: 500 / 1000 / 2000 Kč nebo vlastní)

\- Zobrazení bonusu (pokud nastaven)

\- Přesměrování na platební bránu (napojení na Stripe/PayPal — implementováno samostatně dle uživatele)

\- Po úspěšné platbě: připsání kreditu, email s potvrzením

\*\*Historie transakcí:\*\*

\- Tabulka: Datum, Typ, Částka, Zůstatek po transakci, Popis

\- Typy: DOBITÍ, PLATBA\_OBJEDNÁVKY, REFUND, MANUÁLNÍ\_ÚPRAVA, EXPIRACE

\- Export CSV

\*\*Platba kreditem v kalkulačce:\*\*

\*\*Na kroku checkout:\*\*

\- Pokud má zákazník kredit \> 0, zobrazit:

\`\`\`

  ┌─────────────────────────────────────────┐

  │ 💳 Váš kreditový zůstatek: 1 500 Kč    │

  │                                         │

  │ ○ Zaplatit kreditem (zbyde 800 Kč)     │

  │ ○ Zaplatit jinak                        │

  └─────────────────────────────────────────┘

* Pokud kredit nestačí na celou objednávku:  
  * Možnost A: "Kredit nestačí. Dobijte si kredit nebo zvolte jinou platbu."  
  * Možnost B: Kombinovaná platba — část kreditem, zbytek kartou (složitější implementace)

**Admin panel — správa kreditů zákazníků:**

**V detailu zákazníka (Admin \> Zákazníci \> Detail):**

* Aktuální zůstatek  
* Historie transakcí  
* Tlačítko "Přidat/Odebrat kredit" (manuální úprava):  
  * Částka (+/-)  
  * Důvod (poznámka do logu)  
  * Notifikovat zákazníka emailem (checkbox)

**Přehled v Admin \> Zákazníci:**

* Sloupec "Kredit" v tabulce  
* Filtr "Zákazníci s kreditem \> 0"  
* Celkový objem nevyčerpaných kreditů (účetní přehled)

**Databázový model:**

sql

CREATE TABLE customer\_credit\_balances (

  customer\_id UUID PRIMARY KEY REFERENCES customers(id),

  balance NUMERIC(12,2) NOT NULL DEFAULT 0,

  updated\_at TIMESTAMP DEFAULT NOW()

);

CREATE TABLE credit\_transactions (

  id UUID PRIMARY KEY,

  customer\_id UUID REFERENCES customers(id),

  type VARCHAR(50) NOT NULL, *\-- TOPUP, CHARGE, REFUND, MANUAL, EXPIRATION, BONUS*

  amount NUMERIC(12,2) NOT NULL, *\-- Kladné \= připsání, záporné \= odepsání*

  balance\_after NUMERIC(12,2) NOT NULL,

  *\-- Reference*

  order\_id UUID REFERENCES orders(id), *\-- Pro CHARGE a REFUND*

  payment\_id VARCHAR(100), *\-- ID platby z platební brány pro TOPUP*

  *\-- Metadata*

  description TEXT,

  created\_by UUID REFERENCES users(id), *\-- Pro MANUAL*

  created\_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX idx\_credit\_transactions\_customer ON credit\_transactions(customer\_id, created\_at);

\`\`\`

\---

\#\#\# 21.3 Custom domény pro widget

\*\*Princip:\*\* Zákazník ModelPriceru může nastavit vlastní subdoménu (např. \`kalkulacka.mojefirma.cz\`) místo používání iframe embedu. Widget pak běží přímo na doméně zákazníka.

\*\*Admin panel — Admin \> Widget \> Custom Domain:\*\*

\*\*Nastavení:\*\*

1\. \*\*Zadání domény:\*\* input pole pro doménu (např. \`kalkulacka.mojefirma.cz\` nebo \`cenova\-nabidka.firma.com\`)

2\. \*\*DNS instrukce:\*\* zobrazit zákazníkovi co musí nastavit:

\`\`\`

   Pro aktivaci custom domény přidejte tento DNS záznam:

   

   Typ: CNAME

   Název: kalkulacka (nebo vaše subdoména)

   Hodnota: custom.modelpricer.com

   TTL: 3600

3. **Ověření:** tlačítko "Ověřit DNS" — systém zkontroluje CNAME záznam  
4. **SSL certifikát:** po ověření DNS automatické vystavení Let's Encrypt certifikátu  
5. **Status:** Pending DNS / DNS ověřeno / SSL aktivní / Aktivní

**Stavy domény:**

* **Pending DNS:** čeká na nastavení CNAME zákazníkem  
* **DNS ověřeno:** CNAME správně, generuje se SSL  
* **SSL aktivní:** certifikát vystaven, doména funguje  
* **Chyba:** problém s DNS nebo SSL (zobrazit detail)

**Technická implementace:**

**Reverse proxy (nginx/Caddy):**

nginx

*\# Nginx konfigurace pro custom domény*

server {

    listen 443 ssl http2;

    server\_name \~^(?\<subdomain\>.+)\\\\.modelpricer\\\\.com$ \~^(?\<custom\_domain\>.+)$;

    

    *\# Dynamický SSL certifikát (Let's Encrypt)*

    ssl\_certificate /etc/letsencrypt/live/$host/fullchain.pem;

    ssl\_certificate\_key /etc/letsencrypt/live/$host/privkey.pem;

    

    location / {

        proxy\_pass http://widget-app:3000;

        proxy\_set\_header Host $host;

        proxy\_set\_header X-Custom-Domain $host;

    }

}

\`\`\`

\*\*Nebo Caddy (jednodušší automatický SSL):\*\*

\`\`\`

{

    on\_demand\_tls {

        ask http://api:8000/verify-domain

    }

}

:443 {

    tls {

        on\_demand

    }

    reverse\_proxy widget-app:3000

}

**Backend logika:**

* Při requestu na custom doménu: lookup v databázi která tenant/widget instance patří k doméně  
* Vrátit odpovídající widget konfiguraci (branding, materiály, presety...)  
* Endpoint `/verify-domain` pro Caddy — ověří že doména je v DB a aktivní

**Databázový model:**

sql

CREATE TABLE custom\_domains (

  id UUID PRIMARY KEY,

  tenant\_id UUID REFERENCES tenants(id),

  widget\_id UUID REFERENCES widgets(id),

  domain VARCHAR(255) NOT NULL UNIQUE,

  status VARCHAR(50) DEFAULT 'pending\_dns', *\-- pending\_dns, dns\_verified, ssl\_active, active, error*

  dns\_verified\_at TIMESTAMP,

  ssl\_issued\_at TIMESTAMP,

  ssl\_expires\_at TIMESTAMP,

  error\_message TEXT,

  created\_at TIMESTAMP DEFAULT NOW(),

  updated\_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX idx\_custom\_domains\_domain ON custom\_domains(domain);

\`\`\`

\*\*Omezení dle tarifu:\*\*

\- Free/Starter: žádná custom doména

\- Professional: 1 custom doména

\- Enterprise: neomezeno

\---

\#\#\# 21.4 Bezpečnostní standardy a SLA

\*\*Aktuální bezpečnostní opatření (již implementovaná nebo standardní):\*\*

\*\*Šifrování:\*\*

\- HTTPS/TLS 1.3 pro veškerou komunikaci

\- Certifikáty: Let's Encrypt s automatickou obnovou

\- HSTS hlavička pro vynucení HTTPS

\*\*Autentizace a autorizace:\*\*

\- Hesla hashovaná pomocí bcrypt (cost factor 12+)

\- JWT tokeny pro session management

\- Refresh tokeny s rotací

\- Rate limiting na login endpoint (ochrana proti brute-force)

\- Account lockout po X neúspěšných pokusech

\*\*Ochrana aplikace:\*\*

\- CSRF tokeny pro všechny formuláře

\- XSS ochrana — sanitizace vstupů, Content-Security-Policy hlavička

\- SQL injection prevence — parameterizované dotazy (ORM)

\- File upload validace — kontrola MIME typu, velikosti, rozšíření

\*\*Infrastruktura:\*\*

\- Firewall pravidla

\- DDoS ochrana (Cloudflare nebo podobné)

\- Oddělené databázové servery

\- Pravidelné bezpečnostní aktualizace

\*\*GDPR compliance:\*\*

\*\*Práva subjektů údajů:\*\*

\- \*\*Právo na přístup:\*\* zákazník může v portálu vidět všechna svá data

\- \*\*Právo na výmaz:\*\* tlačítko "Smazat můj účet" — smaže osobní údaje, anonymizuje objednávky

\- \*\*Právo na přenositelnost:\*\* export dat ve strojově čitelném formátu (JSON/CSV)

\- \*\*Právo na opravu:\*\* zákazník může editovat své údaje

\*\*Admin nástroje pro GDPR:\*\*

\- Admin \> Zákazníci \> Detail \> "Exportovat data zákazníka"

\- Admin \> Zákazníci \> Detail \> "Smazat zákazníka" (s potvrzením a logem)

\- Automatické mazání neaktivních účtů po X letech (konfigurovatelné)

\*\*Dokumentace:\*\*

\- Zásady ochrany osobních údajů (Privacy Policy) — šablona \+ možnost úpravy

\- Cookie policy

\- Souhlas se zpracováním (checkbox v kontaktním formuláři)

\*\*Zálohy a disaster recovery:\*\*

\*\*Zálohy databáze:\*\*

\- Automatické denní zálohy

\- Point-in-time recovery (poslední 7-30 dní)

\- Zálohy uložené v jiné geografické lokaci

\- Testování obnovy ze zálohy (měsíčně)

\*\*Zálohy souborů:\*\*

\- 3D modely uložené na redundantním storage (S3 s cross-region replication)

\- Verzování souborů

\*\*Disaster recovery plán:\*\*

\- RTO (Recovery Time Objective): max 4 hodiny

\- RPO (Recovery Point Objective): max 1 hodina

\- Dokumentovaný postup obnovy

\- Pravidelné DR testy

\*\*SLA (Service Level Agreement):\*\*

\*\*Pro Enterprise zákazníky:\*\*

\- \*\*Dostupnost:\*\* 99.9% uptime (max \~8.7 hodin výpadku/rok)

\- \*\*Response time:\*\* 95% requestů pod 500ms

\- \*\*Support response:\*\* 

  \- Critical issues: 1 hodina

  \- High priority: 4 hodiny

  \- Normal: 24 hodin

\- \*\*Planned maintenance:\*\* oznámení 72 hodin předem, mimo špičku

\- \*\*Kompenzace:\*\* kredity za nedodržení SLA (např. 10% měsíčního poplatku za každých 0.1% pod SLA)

\*\*Monitoring a alerting:\*\*

\- Uptime monitoring (Pingdom, UptimeRobot, nebo vlastní)

\- APM (Application Performance Monitoring) — Sentry, DataDog, New Relic

\- Alerting na Slack/email při výpadku nebo degradaci

\- Status page (status.modelpricer.com) s historií incidentů

\*\*Budoucí bezpečnostní certifikace (Enterprise roadmap):\*\*

\- \*\*SOC 2 Type II:\*\* audit bezpečnostních kontrol

\- \*\*ISO 27001:\*\* certifikace systému řízení bezpečnosti informací

\- \*\*ITAR compliance:\*\* pro zákazníky z defense sektoru (US)

\---

\#\# SEKCE 22 — Onboarding a Tutoriály

\#\#\# 22.1 Video tutoriály pro admin panel

\*\*Princip:\*\* Série krátkých, zaměřených video tutoriálů pokrývajících všechny aspekty admin panelu. AutoQuote3D má 7 videí — ModelPricer by měl mít minimálně stejně.

\*\*Seznam video tutoriálů:\*\*

\*\*1. Úvod do ModelPricer (3-5 min)\*\*

\- Co je ModelPricer a jak funguje

\- Přehled admin panelu — navigace, sekce

\- Workflow: nastavení → widget → objednávky

\*\*2. Nastavení cenotvorby (5-7 min)\*\*

\- Admin \> Pricing — přehled stránky

\- Nastavení ceny za materiál (Kč/gram)

\- Nastavení ceny za čas tisku (Kč/hodina)

\- Minimální ceny a zaokrouhlování

\- Testovací kalkulačka — jak ověřit nastavení

\*\*3. Správa materiálů a barev (4-6 min)\*\*

\- Přidání nového materiálu

\- Nastavení barev pro materiál

\- Aktivace/deaktivace materiálů

\- Zobrazení ve widgetu

\*\*4. Presety a parametry tisku (5-7 min)\*\*

\- Co jsou presety a proč jsou důležité

\- Nahrání .ini souboru z PrusaSliceru

\- Konfigurace viditelnosti presetů

\- Nastavení výchozího presetu

\- Parametry tisku — viditelnost ve widgetu

\*\*5. Příplatky a služby (4-6 min)\*\*

\- Admin \> Fees — přehled

\- Vytvoření příplatku (express, post-processing...)

\- Typy příplatků (dle hmotnosti, času, procenta)

\- Podmínky pro aplikaci příplatku

\- Zobrazení ve widgetu

\*\*6. Vložení kalkulačky na web (3-5 min)\*\*

\- Admin \> Widget — konfigurace

\- Získání embed kódu

\- Vložení na WordPress/Shopify/HTML stránku

\- Nastavení domén (whitelist)

\- Testování embedu

\*\*7. Správa objednávek (5-7 min)\*\*

\- Admin \> Orders — přehled

\- Filtry a vyhledávání

\- Detail objednávky

\- Změna stavu objednávky

\- Export objednávek

\*\*8. Branding a vzhled (3-5 min)\*\*

\- Admin \> Branding

\- Nahrání loga

\- Nastavení barev

\- Výběr fontu

\- Náhled změn

\*\*Produkce videí:\*\*

\*\*Formát:\*\*

\- Screencast s voice-over

\- Rozlišení: 1080p

\- Délka: 3-7 minut (kratší \= lepší)

\- Jasná struktura: úvod → kroky → shrnutí

\*\*Nástroje:\*\*

\- Nahrávání: Loom, OBS Studio, Camtasia, ScreenFlow

\- Editace: DaVinci Resolve (free), Premiere Pro, Final Cut

\- Hosting: YouTube (embed), Vimeo, nebo vlastní (Cloudflare Stream, Mux)

\*\*Umístění videí:\*\*

\- Stránka \`/podpora\` nebo \`/tutorials\` na webu ModelPricer

\- Embed v admin panelu — ikona "?" vedle každé sekce s odkazem na relevantní video

\- YouTube playlist pro SEO a discoverability

\*\*Lokalizace:\*\*

\- Primárně čeština

\- Anglické titulky (pro mezinárodní zákazníky)

\- V budoucnu: anglická verze voice-over

\---

\#\#\# 22.2 Interaktivní onboarding průvodce

\*\*Princip:\*\* Při prvním přihlášení nového admina zobrazit step-by-step průvodce, který ho provede základním nastavením. Snižuje "time to value" a redukuje support dotazy.

\*\*Trigger:\*\* Průvodce se zobrazí automaticky při:

\- Prvním přihlášení po registraci

\- Nebo pokud tenant nemá dokončený základní setup (žádný materiál, žádný preset)

\*\*Struktura průvodce:\*\*

\*\*Úvodní obrazovka (modal):\*\*

\`\`\`

┌─────────────────────────────────────────────────┐

│                                                 │

│         🎉 Vítejte v ModelPricer\!              │

│                                                 │

│   Provedeme vás základním nastavením za        │

│   5 minut. Poté budete připraveni přijímat     │

│   objednávky.                                   │

│                                                 │

│   \[ Začít nastavení \]     \[ Přeskočit \]        │

│                                                 │

└─────────────────────────────────────────────────┘

\`\`\`

\*\*Krok 1: Branding\*\*

\`\`\`

Krok 1 z 5: Vaše značka

━━━━━━━━━━━━━━━━━━━━━━●○○○○

Nahrajte logo vaší firmy a nastavte základní barvy.

Toto se zobrazí zákazníkům v kalkulačce.

\[Nahrát logo\]

Primární barva: \[████████\] 🎨

\[ ← Zpět \]              \[ Další → \]

\`\`\`

\*\*Krok 2: Cenotvorba\*\*

\`\`\`

Krok 2 z 5: Nastavení cen

━━━━━━━━━━━━━━━━━━━━━━━●●○○○

Nastavte základní ceny pro výpočet.

Cena materiálu:    \[ 0.50 \] Kč/gram

Cena času tisku:   \[ 1.00 \] Kč/minuta

Minimální cena:    \[ 50   \] Kč

💡 Tip: Tyto hodnoty můžete kdykoliv upravit v Admin \> Pricing.

\[ ← Zpět \]              \[ Další → \]

\`\`\`

\*\*Krok 3: Materiály\*\*

\`\`\`

Krok 3 z 5: Materiály

━━━━━━━━━━━━━━━━━━━━━━━━●●●○○

Vyberte materiály, které nabízíte:

☑️ PLA (nejběžnější)

☑️ PETG

☐ ABS

☐ TPU (flexibilní)

☐ Nylon

Nebo přidejte vlastní: \[ \+ Přidat materiál \]

\[ ← Zpět \]              \[ Další → \]

\`\`\`

\*\*Krok 4: Preset\*\*

\`\`\`

Krok 4 z 5: Tisková kvalita

━━━━━━━━━━━━━━━━━━━━━━━━━●●●●○

Nahrajte konfigurační soubor z vašeho sliceru

nebo použijte výchozí nastavení.

\[ Nahrát .ini soubor z PrusaSliceru \]

nebo

\[ Použít výchozí nastavení \]

💡 Tip: Můžete přidat více presetů pro různé kvality tisku.

\[ ← Zpět \]              \[ Další → \]

\`\`\`

\*\*Krok 5: Vyzkoušení\*\*

\`\`\`

Krok 5 z 5: Vyzkoušejte to\!

━━━━━━━━━━━━━━━━━━━━━━━━━━●●●●●

Skvělé\! Základní nastavení je hotové.

\[ 🧪 Otevřít testovací kalkulačku \]

Vyzkoušejte nahrát model a spočítat cenu.

Až budete spokojeni, vložte kalkulačku na váš web.

\[ 📋 Získat embed kód \]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\[ Dokončit a přejít do admin panelu \]

**Technická implementace:**

**State management:**

javascript

*// Uložení stavu onboardingu*

const onboardingState \= {

  userId: 'user\_123',

  startedAt: '2024-01-15T10:00:00Z',

  currentStep: 3,

  completedSteps: \['branding', 'pricing'\],

  skipped: false,

  completedAt: null

};

**Databázový model:**

sql

CREATE TABLE user\_onboarding (

  user\_id UUID PRIMARY KEY REFERENCES users(id),

  current\_step INTEGER DEFAULT 1,

  completed\_steps VARCHAR(50)\[\] DEFAULT '{}',

  started\_at TIMESTAMP DEFAULT NOW(),

  completed\_at TIMESTAMP,

  skipped\_at TIMESTAMP,

  data JSONB *\-- Dočasná data z průvodce před uložením*

);

**UI komponenta:**

* Modal/overlay přes celou stránku  
* Progress bar nahoře  
* Navigační tlačítka (Zpět, Další, Přeskočit)  
* Možnost zavřít a vrátit se později  
* Responsive design (funguje i na tabletu)

**Knihovny:**

* **react-joyride** — tooltipový průvodce přímo v UI (alternativa k modalu)  
* **shepherd.js** — podobné, framework-agnostic  
* **intro.js** — lehký, jednoduchý  
* Nebo vlastní implementace s modaly

**Gamifikace (volitelné):**

* Progress bar s procenty  
* Checkmarky u dokončených kroků  
* Konfety/animace po dokončení  
* Badge "Setup Complete" v profilu

---

### **22.3 Nápovědné tooltipy a dokumentace**

**Kontextová nápověda v admin panelu:**

**Ikony nápovědy (?):**

* U každé sekce/pole přidat ikonu otazníku  
* Při hoveru: tooltip s krátkým vysvětlením  
* Při kliknutí: otevře se sidebar nebo modal s detailnějším popisem \+ odkaz na dokumentaci/video

**Příklad implementace:**

jsx

\<FormField\>

  \<Label\>

    Cena za gram materiálu

    \<HelpIcon tooltip\="Základní cena za 1 gram spotřebovaného materiálu. Doporučujeme 0.30-0.80 Kč pro PLA."\>

      \<Link href\="/docs/pricing/material-cost"\>Více info\</Link\>

    \</HelpIcon\>

  \</Label\>

  \<Input type\="number" ... /\>

\</FormField\>

\`\`\`

\*\*Tooltip obsah — krátký a užitečný:\*\*

\- Max 2-3 věty

\- Konkrétní doporučení nebo příklad

\- Odkaz na detailní dokumentaci

\*\*Inline tipy:\*\*

\- Pod některými formuláři zobrazit "💡 Tip: ..." box

\- Kontextuální rady dle aktuálního stavu

\- Např. pokud nemá nastavený žádný preset: "💡 Tip: Nahrajte alespoň jeden preset pro přesnější kalkulaci cen."

\*\*Empty states s nápovědou:\*\*

\- Když je seznam prázdný (žádné objednávky, materiály...), zobrazit:

\`\`\`

  ┌─────────────────────────────────────────┐

  │                                         │

  │     📦 Zatím nemáte žádné objednávky   │

  │                                         │

  │   Objednávky se zde zobrazí, jakmile   │

  │   zákazníci začnou používat vaši       │

  │   kalkulačku.                          │

  │                                         │

  │   \[ Jak získat první objednávky? \]     │

  │                                         │

  └─────────────────────────────────────────┘

\`\`\`

\*\*Knowledge base / Help center:\*\*

\*\*Struktura:\*\*

\`\`\`

/docs

├── getting\-started/

│   ├── introduction.md

│   ├── quick\-setup.md

│   └── first\-order.md

├── admin\-panel/

│   ├── dashboard.md

│   ├── pricing.md

│   ├── materials.md

│   ├── presets.md

│   ├── fees.md

│   ├── orders.md

│   ├── branding.md

│   └── widget.md

├── widget/

│   ├── embedding.md

│   ├── customization.md

│   └── troubleshooting.md

├── integrations/

│   ├── wordpress.md

│   ├── shopify.md

│   └── api.md

└── faq.md

**Každý článek obsahuje:**

* Jasný název a popis  
* Krok za krokem instrukce s obrázky/GIFy  
* Příklady a best practices  
* Odkazy na související články  
* "Bylo to užitečné?" feedback tlačítka

**Vyhledávání:**

* Full-text search přes všechny články  
* Autocomplete s návrhy  
* Zvýraznění hledaného textu ve výsledcích

**Technologie:**

* **Docusaurus** (React, MDX, dobrý search)  
* **VitePress** (Vue, rychlý, minimalistický)  
* **GitBook** (hosted, WYSIWYG editor)  
* **Notion** (jednoduchý, ale omezená customizace)  
* **ReadMe.io** (placený, ale profi look)

**In-app help widget:**

* Plovoucí tlačítko "?" v pravém dolním rohu admin panelu  
* Po kliknutí: search box \+ populární články \+ kontakt na support  
* Integrace s Intercom, Crisp, nebo vlastní řešení

**Feedback loop:**

* Na konci každého článku: "Pomohl vám tento článek? 👍 👎"  
* Možnost napsat komentář/dotaz  
* Data se sbírají pro zlepšování dokumentace

**Lokalizace dokumentace:**

* Primárně čeština  
* Anglická verze pro mezinárodní expanzi  
* Struktura: `/docs/cs/...` a `/docs/en/...`  
* Přepínač jazyků v headeru dokumentace

