C:\Users\Kuňákovi\.claude\plans\piped-wibbling-ember.md

1. Krok 0: Kompletni Shoptet dokumentace (ulozi se do docs/claude/Documentation/Shoptet-Integrace-Dokumentace.md)
  2. Kroky 1-10: Implementacni plan s detailnimi zmenami v kazdem souboru
  3. 15 agentu namapovanych na kroky
  4. 6 skills k pouziti (frontend-design, security-testing, translate, verification-before-completion, review-pr, conventional-commit) 
  5. 5 vln paralelni delegace
  6. Graf zavislosti mezi kroky
  7. Security checklist a quality gates
  8. Rizika s mitigacemi

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── Ready to code?

 Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ Shoptet E-Commerce Integrace — Implementacni Plan

 Datum: 2026-02-15
 Status: PLAN — ceka na schvaleni
 Scope: Pridat Shoptet jako druhou e-commerce platformu vedle existujici Shopify integrace

 ---
 KROK 0: Dokumentace (ulozit pred implementaci)

 Soubor: docs/claude/Documentation/Shoptet-Integrace-Dokumentace.md
 Agent: mp-sr-docs

 Nasledujici dokumentace se ulozi jako prvni krok pred jakoukoli implementaci:

 # Shoptet Integrace — Technicka Dokumentace

 > **Datum:** 2026-02-15
 > **Verze:** 1.0 — Research + Architektura
 > **Status:** Implementace v prubehu

 ---

 ## 1. Co je Shoptet?

 Shoptet je nejvetsi cesky e-commerce SaaS s 45,885+ e-shopy.
 - **Webova stranka:** https://www.shoptet.cz/
 - **Developer portal:** https://developers.shoptet.com/
 - **API dokumentace:** https://api.docs.shoptet.com/
 - **GitHub:** https://github.com/shoptet/developers (Postman collection)
 - **Typ API:** REST, JSON format

 ---

 ## 2. Autentizace — Dva tokeny

 Shoptet pouziva **dvoustupnovou autentizaci** (ZASADNI rozdil od Shopify):

 ### 2.1 OAuth Access Token (permanentni)
 - Ziskany pri instalaci addonu do e-shopu
 - Slouzi **JEN** k ziskani kratkodobeho API tokenu
 - **NENI** pro prime API volani
 - **Tajny** — NESMI byt na frontendu

 ### 2.2 Short-term API Token (30 minut platnost)
 - Endpoint: `POST https://<eshop>.myshoptet.com/action/ApiOAuthServer/getAccessToken`
 - Header: `Authorization: Bearer <OAuth access token>`
 - Odpoved: JSON s API tokenem + expirace
 - Pouziti: header `Shoptet-Access-Token: <token>`

 ### 2.3 Premium API Token (alternativa)
 - 32-znakovy token pro Premium e-shopy
 - Spravovany v admin obrazovce Shoptetu
 - Bez potreby addon registrace

 ### 2.4 Srovnani se Shopify
 | Aspekt | Shopify | Shoptet |
 |--------|---------|---------|
 | Frontend token | Storefront API (verejny, safe) | ZADNY verejny token |
 | Auth model | 1 verejny token | 2 tajne tokeny (OAuth + short-term) |
 | Client-side volani | ANO | NE (vyzaduje backend) |
 | Bez backendu | ANO | NE (pro REST API) |

 ---

 ## 3. JavaScript Frontend API

 Shoptet ma vlastni JS API dostupne **JEN uvnitr Shoptet sablony** (template):

 ### 3.1 Pridani do kosiku
 - `shoptet.cartShared.addToCart({priceId: 1745})`
 - `shoptet.cartShared.addToCart({productCode: '183/GSB'})`
 - `shoptet.cartShared.addToCart({productId: 183, parameterValueId: {78: 210}})`
 - `shoptet.cartShared.addToCart({priceId: 1745, amount: 2})` — s mnozstvim
 - `shoptet.cartShared.addToCart({priceId: 1745}, true)` — silent (bez popup)

 ### 3.2 Aktualizace mnozstvi
 - `shoptet.cartShared.updateQuantityInCart({itemId: '621deef58184c', priceId: 1485, amount: 3})`

 ### 3.3 DataLayer
 - `getShoptetProductsList()` — vsechny produkty na strance
 - `getShoptetDataLayer('cart')` — data kosiku

 ### 3.4 OMEZENI
 Tyto JS funkce funguju **JEN uvnitr Shoptet frontendu** (sablony).
 Z externiho widgetu/iframe NEJSOU dostupne!

 ---

 ## 4. REST API Endpointy (server-side)

 **Base URL:** `https://<eshop-adresa>/api/`

 ### 4.1 Zjistene endpointy
 - **Products:** `GET /api/products`, `GET /api/products/{id}`, `POST /api/products`
 - **Orders:** Existuji (detail nezjisten)
 - **Customers:** Existuji
 - **Eshop info:** Existuji
 - **Pricelists:** Existuji

 ### 4.2 Nezjistene (TODO pro budouci fazi)
 - Cart API endpoints (create cart, add items server-side)
 - Order create endpoint (POST /api/orders)
 - Checkout URL generation
 - Webhook event types a payloady
 - Rate limity (implementovany od 08/2025)
 - CORS policy (pravdepodobne NENI povoleno z browseru)

 ---

 ## 5. Addon System

 - Registrace: https://salesforce-eu.123formbuilder.com/form-62354/
 - Addon dostane OAuth credentials pri instalaci
 - Muze vkladat HTML do sablony
 - Webhook system existuje
 - "Shoptet Bender" — lokalni vyvojovy nastroj

 ---

 ## 6. Architektura integrace v ModelPriceru

 ### 6.1 Zvolena strategie: Product URL Redirect (MVP)

 Protoze Shoptet NEMA verejne client-side API, pouzivame **URL redirect**:

 1. Admin nakonfiguruje URL e-shopu + kody produktu
 2. Zakaznik klikne "Prejit na e-shop"
 3. Presmerovani na Shoptet:
    - `https://<eshop>/<product-slug>` (na stranku produktu)
    - NEBO `https://<eshop>/action/Cart/addToCart?productCode=XXX&amount=Y` (experimentalni)
 4. Zakaznik dokonci nakup na Shoptet e-shopu
 5. ZERO backend, ZERO API calls — ciste client-side

 ### 6.2 Architekturalni diagram

 Admin Panel (/admin/integrations)
     |
     | saveShoptetConfig()
     v
 adminEcommerceStorage.js (localStorage)
     |
     | getShoptetConfig() / getActivePlatform()
     v
 +-----------------------+---------------------+-------------------+
 | test-kalkulacka       | widget-kalkulacka   | widget-public     |
 | getShoptetConfig()    | via props           | getShoptetConfig()|
 +-----------------------+---------------------+-------------------+
          |                      |                      |
          v                      v                      v
     ShoptetCartButton (renders in all contexts)
          |
     mapQuoteToShoptetLines (shoptetCartMapper.js)
          |
     buildProductRedirectUrl / buildCartAddUrl (shoptetCartClient.js)
          |
     Redirect to Shoptet e-shop / postMessage to parent (widget.js)

 ### 6.3 Klicove soubory

 | Soubor | Ucel |
 |--------|------|
 | `src/utils/adminEcommerceStorage.js` | Config storage (Shopify + Shoptet) |
 | `src/lib/shoptet/shoptetCartClient.js` | URL builder, validace |
 | `src/lib/shoptet/shoptetCartMapper.js` | Quote → Shoptet mapping |
 | `src/pages/widget-kalkulacka/components/ShoptetCartButton.jsx` | UI tlacitko |
 | `src/pages/admin/AdminIntegrations.jsx` | Admin konfigurace |
 | `public/widget.js` | PostMessage handlery pro embed |

 ### 6.4 Config schema

 ```javascript
 {
   active_platform: null,  // 'shopify' | 'shoptet' | null
   shopify: { /* existujici */ },
   shoptet: {
     enabled: false,
     eshop_url: '',                    // "mujeshop.myshoptet.com"
     integration_mode: 'url_redirect', // 'url_redirect' | budouci: 'api'
     currency: 'CZK',
     redirect_target: 'cart',          // 'product' | 'cart'
     cart_note_template: 'ModelPricer: {modelCount} modelu',
     mapping_mode: 'per_product',      // 'per_product' | 'universal'
     product_mappings: [],
     fallback_product_code: '',
     fallback_product_url: '',
     updated_at: '',
   },
   integrations_meta: { /* existujici */ }
 }

 ---
 7. Srovnani pristupu

 ┌─────┬────────────────────────────┬──────────┬───────────┬──────────────────────┬──────────────────────┐
 │  #  │          Pristup           │ Backend? │ Slozitost │          UX          │        Status        │
 ├─────┼────────────────────────────┼──────────┼───────────┼──────────────────────┼──────────────────────┤
 │ A   │ Product URL Redirect       │ NE       │ Nizka     │ Zakaznik presmerovan │ IMPLEMENTOVANO (MVP) │
 ├─────┼────────────────────────────┼──────────┼───────────┼──────────────────────┼──────────────────────┤
 │ B   │ Backend Proxy (REST API)   │ ANO      │ Vysoka    │ Plna integrace       │ Budouci Phase 2      │
 ├─────┼────────────────────────────┼──────────┼───────────┼──────────────────────┼──────────────────────┤
 │ C   │ Shoptet Addon (HTML embed) │ NE       │ Vysoka    │ Nejlepsi             │ Vyzaduje registraci  │
 ├─────┼────────────────────────────┼──────────┼───────────┼──────────────────────┼──────────────────────┤
 │ D   │ Hybrid (C + B)             │ Castecne │ Nejvyssi  │ Optimalni            │ Dlouhodoby cil       │
 └─────┴────────────────────────────┴──────────┴───────────┴──────────────────────┴──────────────────────┘

 ---
 8. Bezpecnost

 8.1 URL Security

 - Redirect URL MUSI matchovat nakonfigurovany eshop_url (domain pinning)
 - Pouze HTTPS
 - Product code sanitizace: [\w.-] only
 - Zadne tajne tokeny ve frontendu (MVP nema tokeny)

 8.2 PostMessage Security

 - Origin validace pro vsechny handlery
 - isValidShoptetUrl() kontroluje HTTPS + domena
 - CustomEvent pro parent page integration

 8.3 Data Flow

 - Zadne osobni udaje v redirect URL
 - Cena je informativni — Shoptet pouziva vlastni ceny
 - Product code je verejny identifikator

 ---
 9. Budouci rozsireni (mimo aktualni scope)

 Phase 2: Backend Proxy

 - Firebase Cloud Function pro OAuth token management
 - Token refresh (30min expiry)
 - Cart/Order creation pres Shoptet REST API
 - Cenova synchronizace

 Phase 3: Shoptet Addon

 - Registrace addonu u Shoptetu
 - HTML embed primo do Shoptet sablony
 - Pristup k shoptet.cartShared.addToCart() — nejlepsi UX

 ---
 10. Uzitecne odkazy

 - Developer Portal: https://developers.shoptet.com/
 - API Docs: https://api.docs.shoptet.com/
 - GitHub (Postman): https://github.com/shoptet/developers
 - OAuth Helper: https://github.com/borekb/shoptet-oauth-helper
 - JS Cart API:
 https://developers.shoptet.com/home/shoptet-tools/editing-templates/how-to-properly-add-product-to-cart-with-javascript/
 - DataLayer: https://developers.shoptet.com/information-about-products-in-javascript/
 - Addon Registrace: https://salesforce-eu.123formbuilder.com/form-62354/

 ---
 Posledni aktualizace: 2026-02-15

 ---

 ## Kontext

 ModelPricer ma fungujici Shopify integraci (Varianta A — client-side only). Uzivatel chce pridat **Shoptet** (cesky e-commerce SaaS,  
 45k+ e-shopu) jako druhou volitelnou platformu. Shoptet **nebude hlavni** — jen moznost pro zapnuti, stejne jako Shopify.

 **Klicovy rozdil:** Shoptet NEMA verejne client-side API (na rozdil od Shopify Storefront API). Proto pouzijeme strategii **"Product  
 URL Redirect"** — zero backend, zero API calls, ciste presmerovani na e-shop. Budouci upgrade na plne REST API pres backend proxy je  
 mozny.

 ---

 ## Architekturalni rozhodnuti

 | # | Rozhodnuti | Zduvodneni |
 |---|-----------|------------|
 | AD-1 | **Strategie: Product URL Redirect** | Shoptet nema verejne API; redirect je jedina client-side moznost |
 | AD-2 | **Multi-platform taby v AdminIntegrations** | Priprava pro budouci platformy (WooCommerce atd.) |
 | AD-3 | **`active_platform` pole v storage** | Jen 1 platforma aktivni v kalkulacce zaroven |
 | AD-4 | **Mutual exclusion v UI, ne v storage** | Obe platformy mohou byt nakonfigurovane, jen jedna `active` |
 | AD-5 | **Shoptet brand: #FCAF00 (zluta)** | Oficalni Shoptet barva pro vizualni odliseni od Shopify |

 ---

 ## Nove soubory (4)

 | Soubor | Ucel |
 |--------|------|
 | `src/lib/shoptet/shoptetCartClient.js` | URL builder, validace, test connection |
 | `src/lib/shoptet/shoptetCartMapper.js` | Quote → Shoptet produkt mapping |
 | `src/pages/widget-kalkulacka/components/ShoptetCartButton.jsx` | Tlacitko "Prejit na e-shop" |
 | `.claude/agents/mp-spec-ecom-shoptet.md` | Novy agent pro Shoptet |

 ## Modifikovane soubory (6)

 | Soubor | Rozsah zmeny |
 |--------|-------------|
 | `src/utils/adminEcommerceStorage.js` | STREDNI — Shoptet config + CRUD + active_platform |
 | `src/pages/admin/AdminIntegrations.jsx` | VELKY — Multi-platform taby + Shoptet sekce |
 | `src/pages/test-kalkulacka/index.jsx` | MALY — 3-way branch v Step 4 |
 | `src/pages/widget-kalkulacka/index.jsx` | MALY — shoptetConfig prop + ShoptetCartButton |
 | `src/pages/widget-public/WidgetPublicPage.jsx` | MALY — load + pass shoptetConfig |
 | `public/widget.js` | STREDNI — Shoptet postMessage handlery |

 ## Dokumentacni zmeny (3)

 | Soubor | Zmena |
 |--------|-------|
 | `docs/claude/AGENT_MAP.md` | Pridat mp-spec-ecom-shoptet |
 | `MEMORY.md` | Pridat Shoptet integrace sekci |
 | `docs/claude/SKILLS_MAP.md` | Bez zmeny (zadne nove skills) |

 ---

 ## Implementacni kroky (10 kroku, 5 fazi)

 ### FAZE 1: Storage & Data Layer

 #### Krok 1: Rozsireni `adminEcommerceStorage.js`

 **Soubor:** `src/utils/adminEcommerceStorage.js`
 **Agent:** `mp-mid-storage-tenant` (vlastnik storage helperu)
 **Review agent:** `mp-sr-storage`
 **Skill:** —

 **Zmeny:**

 1. Pridat `active_platform` a `shoptet` do `getDefaultEcommerceConfig()`:
 ```javascript
 {
   active_platform: null,  // 'shopify' | 'shoptet' | null
   shopify: { /* beze zmeny */ },
   shoptet: {
     enabled: false,
     eshop_url: '',                    // "mujeshop.myshoptet.com" nebo vlastni domena
     integration_mode: 'url_redirect', // 'url_redirect' | budouci: 'api'
     currency: 'CZK',
     redirect_target: 'cart',          // 'product' | 'cart'
     cart_note_template: 'ModelPricer: {modelCount} modelu, {totalPrice} {currency}',
     mapping_mode: 'per_product',      // 'per_product' | 'universal'
     product_mappings: [],
     fallback_product_code: '',
     fallback_product_url: '',
     updated_at: '',
   },
   integrations_meta: { /* beze zmeny */ },
 }

 2. Pridat funkce (mirror Shopify patternu):
   - getShoptetConfig(tenantId)
   - saveShoptetConfig(shoptetConfig, tenantId)
   - getProductMappings(tenantId)
   - addProductMapping(mapping, tenantId)
   - updateProductMapping(id, patch, tenantId)
   - deleteProductMapping(id, tenantId)
   - findProductForConfig(materialKey, qualityKey, tenantId)
   - getActivePlatform(tenantId) — vraci 'shopify' | 'shoptet' | null
   - setActivePlatform(platform, tenantId)
 3. Update saveEcommerceConfig() — stampovat shoptet.updated_at

 Zavislosti: Zadne (prvni krok)
 Overeni: Manualni test: ulozit/nacist Shoptet config, overit ze Shopify funguje beze zmeny

 ---
 Krok 2: Shoptet client knihovna

 Soubory: src/lib/shoptet/shoptetCartClient.js (NOVY)
 Agent: mp-spec-ecom-shoptet (NOVY agent — vytvorit v kroku 10)
 Fallback agent: mp-spec-ecom-api
 Review agent: mp-mid-security-app (URL security)
 Skill: —

 Obsah shoptetCartClient.js:

 // Error types
 export const ShoptetErrorType = {
   VALIDATION_ERROR: 'VALIDATION_ERROR',
   INVALID_URL: 'INVALID_URL',
 };

 // Validace konfigurace
 export function validateShoptetConfig(config)
 // → { valid: boolean, errors: string[] }
 // Overuje: eshop_url (HTTPS, validni domena), checkout_mode

 // Validace Shoptet domeny
 const SHOPTET_DOMAIN_RE = /^[a-z0-9][a-z0-9-]*\.myshoptet\.com$/i;
 // Akceptuje tez vlastni domeny

 // URL buildery
 export function buildProductRedirectUrl({ eshopUrl, productUrl, productCode, quantity })
 // → { url: string, tooLong: boolean }
 // Pattern: `https://${eshopUrl}/${productUrl || 'produkt/' + productCode}`

 export function buildCartAddUrl({ eshopUrl, productCode, quantity })
 // → { url: string, tooLong: boolean, experimental: true }
 // Pattern: `https://${eshopUrl}/action/Cart/addToCart?productCode=${code}&amount=${qty}`
 // POZN: Nezdokumentovany endpoint — experimentalni

 // Test pripojeni
 export function testShoptetConnection({ eshopUrl })
 // → Promise<{ success: boolean, error?: string }>
 // Otevre URL v novem tabu (neni API call)

 // Validace redirect URL
 export function isValidShoptetUrl(url, configuredDomain)
 // MUST match configured domain (prevence open redirect)
 // MUST be HTTPS
 // Blokovani javascript:, data:, blob: protokolu

 Bezpecnostni pravidla:
 - productCode stripovan na [\w.-] znaky + URL encoded
 - quantity clampovan na 1-999 integer
 - Zadna raw string concatenace user inputu
 - Domain pinning: redirect URL MUSI matchovat configuredDomain

 Zavislosti: Krok 1 (storage)
 Overeni: Unit testy: URL building s ruznym configem, injection pokusy (<script>, ../, null bytes)

 ---
 Krok 3: Shoptet cart mapper

 Soubory: src/lib/shoptet/shoptetCartMapper.js (NOVY)
 Agent: mp-spec-ecom-product-mapping
 Skill: —

 Obsah:

 export function mapQuoteToShoptetLines({
   quoteResult, productMappings, fallbackProductCode, fallbackProductUrl,
   mappingMode, feeHandling, uploadedFiles, currency, tenantId,
 })
 // Mirror mapQuoteToShopifyLines ale mapuje na Shoptet product codes
 // Returns: { lineItems, unmappedModels, warnings, totalCalculated }
 // lineItem = { productCode, productUrl, productName, quantity, properties }

 export function buildShoptetCartNote(template, { modelCount, totalPrice, currency })
 // Stejny pattern jako buildCartNote pro Shopify

 Dva mapping mody:
 - per_product: Kazdy material+quality → specificky produkt v Shoptetu
 - universal: Vsechny modely → jeden produkt, detaily v poznamce

 Zavislosti: Krok 1 (findProductForConfig z storage)
 Overeni: Unit test: mock quote → Shoptet line items

 ---
 FAZE 2: UI Komponenty

 Krok 4: ShoptetCartButton

 Soubor: src/pages/widget-kalkulacka/components/ShoptetCartButton.jsx (NOVY)
 Agent: mp-mid-frontend-widget
 Review agent: mp-mid-design-system, mp-spec-design-a11y
 Skill: frontend-design

 Props (stejne rozhrani jako ShopifyCartButton):
 ShoptetCartButton({ quoteResult, shoptetConfig, uploadedFiles, embedded, publicWidgetId, disabled, onCheckoutUrl })

 Stavy: idle | loading | success | error | warning

 Vizualni design:

 ┌─────────┬──────────────────────────┬─────────────┬───────────────┬────────────────────────────┬──────────────────────────┐
 │  Stav   │       Barva pozadi       │ Barva textu │     Ikona     │          Text CS           │         Text EN          │
 ├─────────┼──────────────────────────┼─────────────┼───────────────┼────────────────────────────┼──────────────────────────┤
 │ idle    │ #FCAF00 (Shoptet zluta)  │ #1A1A1A     │ ExternalLink  │ Prejit na e-shop           │ Go to e-shop             │
 ├─────────┼──────────────────────────┼─────────────┼───────────────┼────────────────────────────┼──────────────────────────┤
 │ loading │ #FCAF00 (0.8 opacity)    │ #1A1A1A     │ Spinner       │ Pripravuji presmerovani... │ Preparing redirect...    │
 ├─────────┼──────────────────────────┼─────────────┼───────────────┼────────────────────────────┼──────────────────────────┤
 │ success │ #00E25A (Shoptet zelena) │ #1A1A1A     │ Check         │ Presmerovani na e-shop...  │ Redirecting to e-shop... │
 ├─────────┼──────────────────────────┼─────────────┼───────────────┼────────────────────────────┼──────────────────────────┤
 │ error   │ #DC2626                  │ #fff        │ AlertCircle   │ Chyba — Zkuste znovu       │ Error — Try Again        │
 ├─────────┼──────────────────────────┼─────────────┼───────────────┼────────────────────────────┼──────────────────────────┤
 │ warning │ #F59E0B border           │ —           │ AlertTriangle │ (unmapped models dialog)   │ —                        │
 └─────────┴──────────────────────────┴─────────────┴───────────────┴────────────────────────────┴──────────────────────────┘

 Click handler flow:
 1. mapQuoteToShoptetLines() — mapovani quote
 2. Handle unmapped models → warning dialog
 3. Build URL dle checkout_mode (product_redirect / cart_add_url)
 4. Embedded → postMessage MODELPRICER_SHOPTET_CHECKOUT_URL
 5. Non-embedded → window.location.href = url po 1s

 CSS vars pro widget theming:
 --widget-button-primary: #FCAF00;  /* default Shoptet */
 --widget-border-radius, --widget-font-family, --widget-text-primary

 Accessibility:
 - aria-busy="true" v loading stavu
 - aria-disabled="true" kdyz disabled
 - Error messages pres aria-describedby

 Zavislosti: Krok 2 (shoptetCartClient), Krok 3 (shoptetCartMapper)
 Overeni: Vizualni test vsech 5 stavu

 ---
 Krok 5: Refaktor AdminIntegrations na multi-platform

 Soubor: src/pages/admin/AdminIntegrations.jsx
 Agent: mp-mid-frontend-admin
 Review agenti: mp-mid-design-ux, mp-mid-design-system, mp-spec-design-a11y, mp-spec-design-user-friendly
 Skill: frontend-design

 Zmeny:

 A) Platform Selector (taby nahore):
 +--------------------------------------------------+
 |  [ Shopify ]    [ Shoptet ]                      |
 |   CONNECTED      CONFIGURING                     |
 |   * ACTIVE *                                     |
 +--------------------------------------------------+

 Kazdy tab = card-like button s:
 - Platform ikona (40x40, brand barva na 10% opacity pozadi)
   - Shopify: ShoppingBag, #96BF48
   - Shoptet: Store, #FCAF00
 - Platform nazev (--forge-font-heading, 16px)
 - Status badge (--forge-font-tech, 11px, uppercase)
 - "ACTIVE" pill badge (teal, v rohu) — jen na aktivni platforme

 Tab ARIA atributy:
 - Container: role="tablist"
 - Kazdy tab: role="tab", aria-selected, aria-controls
 - Content: role="tabpanel", aria-labelledby
 - Keyboard: Arrow keys navigace, Enter/Space selekce

 B) Shopify panel: Existujici obsah zabaleny do {selectedTab === 'shopify' && (...)} — BEZ zmen v logice.

 C) Shoptet panel (NOVY):

 - Sekce A — Toggle: Enable/disable + status badge + "Nastavit jako aktivni" button
   - Mutual exclusion warning: "Pouze jedna platforma muze byt aktivni. Zapnuti Shoptet jako aktivni deaktivuje Shopify."
 - Sekce B — Setup Guide (5 kroku, pouziva existujici SetupStep komponentu):
   a. "Najdete URL vaseho e-shopu" — done: !!eshop_url
   b. "Vytvorte produkty s kody v Shoptet adminu" — done: mappings.length > 0
   c. "Zadejte URL e-shopu" — done: !!eshop_url
   d. "Namapujte materialy na kody produktu" — done: mappings.length > 0 || !!fallback_product_code
   e. "Otestujte presmerovani" — done: testResult?.success
 - Sekce C — Configuration Form:
   - Grid 1fr 1fr (jako Shopify)
   - Pole: eshop_url, integration_mode (select: URL redirect / API budouci-disabled), currency, redirect_target, cart_note_template    
   - ZADNY token input (rozdil od Shopify)
 - Sekce D — Product Code Mappings:
   - Mapping mode toggle: per_product / universal
   - Tabulka: Material | Kvalita | Kod produktu | Nazev | Aktivni | [Smazat]
   - Product code highlight: --forge-accent-secondary (#FF6B35 orange, odliseni od Shopify teal)
   - Add mapping form: material select, quality select, product code input, product name input
   - Universal mode: fallback product code input
 - Sekce E — Test Redirect:
   - "Otestovat URL" — window.open(eshopUrl, '_blank')
   - "Testovaci kosik" — build test URL a otevrit v novem tabu

 Zavislosti: Krok 1 (storage), Krok 2 (validateShoptetConfig, testShoptetConnection)
 Overeni: Vizualni test na /admin/integrations, oba taby, toggle, save/load, mutual exclusion

 ---
 FAZE 3: Integracni body

 Krok 6: Update kalkulacek

 Soubory:
 - src/pages/test-kalkulacka/index.jsx
 - src/pages/widget-kalkulacka/index.jsx
 - src/pages/widget-public/WidgetPublicPage.jsx

 Agenti:
 - mp-mid-frontend-admin (test-kalkulacka)
 - mp-mid-frontend-widget (widget-kalkulacka, WidgetPublicPage)
 Skill: —

 test-kalkulacka/index.jsx zmeny:
 // Importy
 import ShoptetCartButton from '../widget-kalkulacka/components/ShoptetCartButton';
 import { getShopifyConfig, getShoptetConfig, getActivePlatform } from '../../utils/adminEcommerceStorage';

 // State
 const [activePlatform] = useState(() => getActivePlatform());
 const [shopifyConfig] = useState(() => { /* existujici logika */ });
 const [shoptetConfig] = useState(() => {
   const cfg = getShoptetConfig();
   return (cfg?.enabled && cfg?.eshop_url) ? cfg : null;
 });

 // Step 4 render: 3-way branch
 {currentStep === 4 && activePlatform === 'shopify' && shopifyConfig ? (
   <ShopifyCartButton ... />
 ) : currentStep === 4 && activePlatform === 'shoptet' && shoptetConfig ? (
   <ShoptetCartButton quoteResult={...} shoptetConfig={shoptetConfig} uploadedFiles={uploadedFiles} embedded={false} />
 ) : currentStep === 4 && (
   <CheckoutForm ... />
 )}

 widget-kalkulacka/index.jsx zmeny:
 - Pridat prop shoptetConfig = null
 - Pridat isShoptetMode = shoptetConfig?.enabled && shoptetConfig?.eshop_url
 - Pridat shoptetQuoteResult memo (stejny pattern jako shopifyQuoteResult)
 - Render ShoptetCartButton vedle ShopifyCartButton podminek

 WidgetPublicPage.jsx zmeny:
 import { getShoptetConfig, getActivePlatform } from '../../utils/adminEcommerceStorage';
 // V useEffect:
 const shoptet = getShoptetConfig(tid);
 const platform = getActivePlatform(tid);
 setShoptetConf(platform === 'shoptet' && shoptet?.enabled ? shoptet : null);
 // V renderz:
 <WidgetKalkulacka ... shoptetConfig={shoptetConf} />

 Zavislosti: Krok 1 (storage), Krok 4 (ShoptetCartButton)
 Overeni:
 - /test-kalkulacka — zapnout Shoptet v adminu, overit ShoptetCartButton v Step 4
 - Widget embed — overit ShoptetCartButton kdyz je Shoptet aktivni
 - Overit ze Shopify stale funguje kdyz je aktivni

 ---
 Krok 7: Rozsireni widget.js

 Soubor: public/widget.js
 Agent: mp-spec-ecom-embed-bridge
 Review agent: mp-mid-security-app
 Skill: —

 Zmeny:

 1. Novy data atribut:
 <div data-modelpricer-widget="WID_XXXX" data-shoptet-url="mujeshop.myshoptet.com"></div>

 2. Config injection do iframe:
 var shoptetUrl = container.getAttribute('data-shoptet-url');
 if (shoptetUrl) {
   iframe.addEventListener('load', function() {
     iframe.contentWindow.postMessage({
       type: 'MODELPRICER_SHOPTET_CONFIG',
       eshopUrl: shoptetUrl,
     }, baseOrigin);
   });
 }

 3. Redirect handler v onMessage():
 if (type === 'MODELPRICER_SHOPTET_CHECKOUT_URL') {
   var redirectUrl = data.redirectUrl;
   if (!isValidShoptetUrl(redirectUrl)) { return; }
   // CustomEvent dispatch
   document.dispatchEvent(new CustomEvent('modelpricer:shoptet:redirect', { detail: {...} }));
   // Callbacks
   // Default: redirect
   window.location.href = redirectUrl;
 }

 4. isValidShoptetUrl() funkce:
 function isValidShoptetUrl(url) {
   if (!url) return false;
   var parsed = new URL(url);
   if (parsed.protocol !== 'https:') return false;
   if (parsed.hostname.indexOf('.myshoptet.com') !== -1) return true;
   if (parsed.hostname.indexOf('.shoptet.cz') !== -1) return true;
   return true; // Custom domains: allow HTTPS
 }

 5. Public API:
 window[GLOBAL_KEY].onShoptetRedirect = function(callback) { ... };

 Zavislosti: Krok 4 (ShoptetCartButton posilal postMessage)
 Overeni: Test v iframe: embed widget, trigger Shoptet checkout, overit redirect

 ---
 FAZE 4: Polish

 Krok 8: Preklady (CS/EN)

 Agent: mp-spec-i18n-translations
 Skill: translate

 Vsechny nove stringy pouzivaji inline cs ? '...' : '...' pattern (stejny jako existujici AdminIntegrations). Klicove stringy:

 Kontext: Tab label
 CS: Shoptet
 EN: Shoptet
 ────────────────────────────────────────
 Kontext: Toggle
 CS: Shoptet integrace
 EN: Shoptet integration
 ────────────────────────────────────────
 Kontext: Status connected
 CS: PRIPOJENO
 EN: CONNECTED
 ────────────────────────────────────────
 Kontext: Status configuring
 CS: KONFIGURACE
 EN: CONFIGURING
 ────────────────────────────────────────
 Kontext: Status disconnected
 CS: ODPOJENO
 EN: DISCONNECTED
 ────────────────────────────────────────
 Kontext: Active badge
 CS: AKTIVNI
 EN: ACTIVE
 ────────────────────────────────────────
 Kontext: Set active btn
 CS: Nastavit jako aktivni
 EN: Set as active
 ────────────────────────────────────────
 Kontext: Enabled info
 CS: Shoptet rezim aktivni — Zakaznici budou presmerovani na vas Shoptet e-shop.
 EN: Shoptet mode active — Customers will be redirected to your Shoptet e-shop.
 ────────────────────────────────────────
 Kontext: Eshop URL label
 CS: URL e-shopu
 EN: E-shop URL
 ────────────────────────────────────────
 Kontext: Integration mode
 CS: Rezim integrace
 EN: Integration Mode
 ────────────────────────────────────────
 Kontext: URL redirect
 CS: URL presmerovani
 EN: URL redirect
 ────────────────────────────────────────
 Kontext: Redirect to
 CS: Presmerovani na
 EN: Redirect To
 ────────────────────────────────────────
 Kontext: Product page
 CS: Na stranku produktu
 EN: To product page
 ────────────────────────────────────────
 Kontext: Add to cart
 CS: Pridat do kosiku
 EN: Add to cart
 ────────────────────────────────────────
 Kontext: Product code
 CS: Kod produktu
 EN: Product Code
 ────────────────────────────────────────
 Kontext: Product name
 CS: Nazev produktu
 EN: Product Name
 ────────────────────────────────────────
 Kontext: Test redirect
 CS: Test presmerovani
 EN: Test Redirect
 ────────────────────────────────────────
 Kontext: Button idle
 CS: Prejit na e-shop
 EN: Go to e-shop
 ────────────────────────────────────────
 Kontext: Button loading
 CS: Pripravuji presmerovani...
 EN: Preparing redirect...
 ────────────────────────────────────────
 Kontext: Button success
 CS: Presmerovani na e-shop...
 EN: Redirecting to e-shop...
 ────────────────────────────────────────
 Kontext: Button error
 CS: Chyba — Zkuste znovu
 EN: Error — Try Again
 ────────────────────────────────────────
 Kontext: Checkout title
 CS: Dokoncit na Shoptet
 EN: Complete on Shoptet
 ────────────────────────────────────────
 Kontext: Mutual exclusion
 CS: Pouze jedna platforma muze byt aktivni.
 EN: Only one platform can be active.

 Zavislosti: Krok 5 (AdminIntegrations strings), Krok 4 (ShoptetCartButton strings)
 Overeni: Prepnout jazyk CS/EN, zkontrolovat vsechny texty

 ---
 Krok 9: Security review + Quality gates

 Agenti (paralelne):
 - mp-mid-security-app — URL redirect bezpecnost, XSS prevence
 - mp-mid-quality-code — code review vsech novych/zmenenych souboru
 - mp-spec-test-build — npm run build PASS
 - mp-spec-design-a11y — accessibility audit tab navigace, formulare

 Skill: security-testing, verification-before-completion, review-pr

 Security checklist:
 - shoptetCartClient.js: Redirect URL validace — domain pinning, HTTPS only
 - shoptetCartClient.js: Product code sanitizace — [\w.-] only
 - widget.js: isValidShoptetUrl() — blokuje javascript:, data:, blob:
 - widget.js: Origin validace pro nove handlery
 - AdminIntegrations.jsx: eshop_url validace pri save
 - ShoptetCartButton.jsx: URL validace pred window.location.href
 - Zadne tajne tokeny v frontend kodu (Shoptet redirect = zadne tokeny)
 - Zadne osobni udaje v redirect URL

 Quality gates:
 - npm run build — PASS
 - Smoke test /admin/integrations — oba taby
 - Smoke test /test-kalkulacka — Shoptet button kdyz enabled
 - Widget iframe test — postMessage redirect
 - Shopify regrese — stale funguje beze zmeny

 ---
 FAZE 5: Dokumentace

 Krok 10: Agent + dokumentace

 Agenti: mp-sr-ecommerce (senior, vytvareni agentu)
 Skill: —

 1. Vytvorit .claude/agents/mp-spec-ecom-shoptet.md:
   - Tier: Specific, Model: sonnet
   - Scope IN: src/lib/shoptet/, shoptet sekce v adminEcommerceStorage.js
   - Scope OUT: Shopify soubory, Admin UI, Widget komponenty
 2. Aktualizovat docs/claude/AGENT_MAP.md — pridat do E-commerce domeny
 3. Aktualizovat MEMORY.md:
 ## Shoptet Integrace (2026-02-15) — URL Redirect
 - **Architektura:** Client-side only, zero backend (URL redirect)
 - **Strategie:** Product URL Redirect + experimental Cart Add URL
 - **Klicove soubory:** shoptetCartClient.js, shoptetCartMapper.js, ShoptetCartButton.jsx
 - **Prepinani:** active_platform === 'shoptet' && shoptetConfig.enabled
 - **Mutual exclusion:** Jen 1 platforma aktivni (active_platform pole)
 - **PostMessage:** MODELPRICER_SHOPTET_CHECKOUT_URL, MODELPRICER_SHOPTET_CONFIG

 ---
 Graf zavislosti

 Krok 1 (Storage) ─────────┐
                            ├──> Krok 2 (Client lib) ──> Krok 3 (Mapper)
                            │                                    │
                            │                                    v
                            ├──> Krok 5 (Admin tabs) <──── Krok 4 (Button)
                            │         │
                            │         ├──> Krok 6 (Kalkulacky)
                            │         │
                            │         └──> Krok 8 (Preklady)  [paralelne s 6,7]
                            │
                            └──> Krok 7 (widget.js) <── Krok 4

 Krok 9 (Security + QA) <── Vsechny kroky 1-8
 Krok 10 (Dokumentace) <── Vsechny kroky

 Paralelizovatelne: Kroky 5, 6, 7, 8 mohou bezet paralelne po dokonceni kroku 1-4.

 ---
 Mapovani agentu na kroky

 Krok: 1
 Implementacni agent: mp-mid-storage-tenant
 Review agent(i): mp-sr-storage
 Skill(s): —
 ────────────────────────────────────────
 Krok: 2
 Implementacni agent: mp-spec-ecom-api
 Review agent(i): mp-mid-security-app
 Skill(s): security-testing
 ────────────────────────────────────────
 Krok: 3
 Implementacni agent: mp-spec-ecom-product-mapping
 Review agent(i): —
 Skill(s): —
 ────────────────────────────────────────
 Krok: 4
 Implementacni agent: mp-mid-frontend-widget
 Review agent(i): mp-mid-design-system, mp-spec-design-a11y
 Skill(s): frontend-design
 ────────────────────────────────────────
 Krok: 5
 Implementacni agent: mp-mid-frontend-admin
 Review agent(i): mp-mid-design-ux, mp-spec-design-user-friendly
 Skill(s): frontend-design
 ────────────────────────────────────────
 Krok: 6a
 Implementacni agent: mp-mid-frontend-admin (test-kalkulacka)
 Review agent(i): —
 Skill(s): —
 ────────────────────────────────────────
 Krok: 6b
 Implementacni agent: mp-mid-frontend-widget (widget-kalkulacka, WidgetPublicPage)
 Review agent(i): —
 Skill(s): —
 ────────────────────────────────────────
 Krok: 7
 Implementacni agent: mp-spec-ecom-embed-bridge
 Review agent(i): mp-mid-security-app
 Skill(s): —
 ────────────────────────────────────────
 Krok: 8
 Implementacni agent: mp-spec-i18n-translations
 Review agent(i): —
 Skill(s): translate
 ────────────────────────────────────────
 Krok: 9
 Implementacni agent: mp-mid-quality-code, mp-spec-test-build
 Review agent(i): mp-sr-security
 Skill(s): security-testing, verification-before-completion, review-pr
 ────────────────────────────────────────
 Krok: 10
 Implementacni agent: mp-sr-ecommerce
 Review agent(i): —
 Skill(s): conventional-commit

 Celkem agentu pouzitych: 15
 Celkem skills pouzitych: 6 (frontend-design, security-testing, translate, verification-before-completion, review-pr,
 conventional-commit)

 ---
 Doporuceny execution plan (paralelni delegace)

 Vlna 1 (sekvencni):

 - mp-mid-storage-tenant → Krok 1

 Vlna 2 (paralelni, po dokonceni Kroku 1):

 - mp-spec-ecom-api → Krok 2
 - mp-spec-ecom-product-mapping → Krok 3

 Vlna 3 (po dokonceni Kroku 2+3):

 - mp-mid-frontend-widget → Krok 4

 Vlna 4 (paralelni, po dokonceni Kroku 4):

 - mp-mid-frontend-admin → Krok 5 + 6a
 - mp-mid-frontend-widget → Krok 6b
 - mp-spec-ecom-embed-bridge → Krok 7
 - mp-spec-i18n-translations → Krok 8

 Vlna 5 (po vsech):

 - mp-mid-quality-code + mp-spec-test-build + mp-mid-security-app → Krok 9
 - mp-sr-ecommerce → Krok 10

 Skill invokace:
 - brainstorming → pred Krokem 5 (Admin UI design)
 - subagent-driven-development → pro Vlnu 4 (paralelni delegace)
 - dispatching-parallel-agents → pro Vlnu 2 a 4
 - verification-before-completion → pred Krokem 9
 - requesting-code-review → po Kroku 9
 - conventional-commit → finalni commit

 ---
 Rizika

 Riziko: Cart Add URL (/action/Cart/addToCart) nemusi fungovat
 Zavaznost: Stredni
 Mitigace: Default = Product Redirect; Cart Add je opt-in "experimentalni"
 ────────────────────────────────────────
 Riziko: Admin zmaten prepinani platform
 Zavaznost: Nizka
 Mitigace: Jasna warning pri toggle, "ACTIVE" badge
 ────────────────────────────────────────
 Riziko: AdminIntegrations prilis velky (1006 → ~1600 radku)
 Zavaznost: Nizka
 Mitigace: Shopify a Shoptet panely jako sub-komponenty ve stejnem souboru
 ────────────────────────────────────────
 Riziko: Shoptet vlastni domeny nematchuji .myshoptet.com
 Zavaznost: Nizka
 Mitigace: URL validator akceptuje jakoukoli HTTPS domenu
 ────────────────────────────────────────
 Riziko: Cenovy nesoulad (kalkulacka vs Shoptet e-shop)
 Zavaznost: Stredni
 Mitigace: Disclaimer: "Konecna cena je urcena e-shopem"

 ---
 Budouci upgrade path (Phase 2 — MIMO SCOPE)

 Pro plnou Shoptet REST API integraci bude potreba:
 1. Backend proxy (Firebase Cloud Function)
 2. OAuth token management (server-side)
 3. Short-term token refresh (30min expiry)
 4. Cart/Order creation pres API
 5. Cenova synchronizace

 Toto je mimo scope aktualniho planu. Aktualni plan pokryva jen client-side URL redirect.
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Claude has written up a plan and is ready to execute. Would you like to proceed?

 ❯ 1. Yes, clear context and auto-accept edits (shift+tab)
   2. Yes, auto-accept edits
   3. Yes, manually approve edits
   4. Type here to tell Claude what to change