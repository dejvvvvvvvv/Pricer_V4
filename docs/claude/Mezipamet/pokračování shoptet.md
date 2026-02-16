# Shoptet Integrace — Research + Pokracovaci Prompt

> Datum: 2026-02-14
> Status: Research faze — API info shromazdena, plan jeste NEVYTVOREN

---

## 1) SHROMAZDENE INFORMACE O SHOPTET API

### 1.1 Zakladni fakta
- **Platforma:** Shoptet — nejvetsi cesky e-commerce SaaS (45,885 e-shopu)
- **Developer portal:** https://developers.shoptet.com/
- **API docs:** https://api.docs.shoptet.com/
- **GitHub:** https://github.com/shoptet/developers (Postman collection)
- **API typ:** REST, JSON format

### 1.2 Autentizace — DVA tokeny (KLICOVY ROZDIL od Shopify!)

Shoptet pouziva **dvoustupnovou autentizaci** — to je ZASADNI rozdil od Shopify Storefront API:

1. **OAuth Access Token** (permanentni)
   - Ziskany pri instalaci addonu do e-shopu
   - Slouzi JEN k ziskani kratkodoba API tokenu
   - NENI urceny pro prime API volani

2. **Short-term API Token** (30 minut platnost)
   - Ziskany z: `https://<eshop>.myshoptet.com/action/ApiOAuthServer/getAccessToken`
   - Header: `Authorization: Bearer <OAuth access token>`
   - Odpoved: JSON s API tokenem a expiraci
   - Pouziva se v headeru: `Shoptet-Access-Token: <token>`

**DULEZITE:** Oba tokeny jsou SERVER-SIDE only! Na rozdil od Shopify Storefront API (ktery je verejny a bezpecny pro frontend), Shoptet API VYZADUJE backend/proxy. OAuth token NESMI byt na frontendu.

```
Shopify:  Storefront Token (verejny) → primo z browseru → OK
Shoptet:  OAuth Token (tajny) → server → Short-term Token → server → API call
```

### 1.3 JavaScript Frontend API (client-side, v ramci Shoptet sablony)

Shoptet ma VLASTNI JavaScript API dostupne UVNITR sveho frontendu (v ramci Shoptet template):

#### Pridani do kosiku:
```javascript
// Pres priceId (unikatni ID cenove polozky)
shoptet.cartShared.addToCart({priceId: 1745});

// Pres productCode (unikatni kod produktu/varianty)
shoptet.cartShared.addToCart({productCode: '183/GSB'});

// Pres productId + parameterValueId (varianta s parametry)
shoptet.cartShared.addToCart({productId: 183, parameterValueId: {78: 210, 10: 204}});

// S mnozstvim
shoptet.cartShared.addToCart({priceId: 1745, amount: 2});

// Silent (bez zobrazeni okna kosiku)
shoptet.cartShared.addToCart({priceId: 1745}, true);
```

#### Aktualizace mnozstvi:
```javascript
shoptet.cartShared.updateQuantityInCart({itemId: '621deef58184c', priceId: 1485, amount: 3});
```

#### Odstraneni z kosiku:
```javascript
// shoptet.cartShared.removeFromCart() — existuje, detail nezjisten
```

#### DataLayer (informace o produktech a kosiku):
```javascript
// Vsechny produkty na strance
var productsList = getShoptetProductsList(); // klic = priceId

// Data kosiku
var cart = getShoptetDataLayer('cart');
// → [{code: "293", quantity: 1, priceWithVat: 1309}, ...]

// Produkt z DOM
var guid = '9512fff7-302f-11e9-a065-0cc47a6c92bc';
var product = document.querySelector('[data-micro-identifier="' + guid + '"]');
var priceId = product.querySelector('input[name="priceId"]').value;
```

**OMEZENI:** Tyto JS funkce funguju JEN uvnitr Shoptet frontendu (sablony). Z externiho widgetu/iframe NEJSOU dostupne!

### 1.4 REST API endpointy (server-side)

**Base URL:** `https://<eshop-adresa>/api/`

Zjistene endpoint kategorie:
- **Products:** `GET /api/products` (seznam), `GET /api/products/{id}` (detail), `POST /api/products` (vytvoreni)
- **Orders:** Existuji (detail nezjisten)
- **Customers:** Existuji
- **Customer Accounts:** Existuji
- **Eshop info:** Existuji
- **Pricelists:** Existuji (nedavno aktualizovany format)

**NEZJISTENO (potreba doresit):**
- Cart API endpoints (create cart, add items server-side)
- Order create endpoint (POST /api/orders)
- Checkout URL generation
- Webhook event types a payloady
- Rate limity (implementovany od 08/2025, detaily nezjisteny)
- CORS policy (pravdepodobne NENI povoleno z browseru)

### 1.5 Addon system

- Addony se registruji pres formular: https://salesforce-eu.123formbuilder.com/form-62354/eng-nabidka-noveho-doplnku
- Addon dostane OAuth credentials pri instalaci
- Addon muze vkladat HTML do sablony (Inserting HTML codes)
- Webhook system existuje (detaily nezjisteny)
- "Shoptet Bender" — nastroj pro lokalni vyvoj (injection do produkcniho e-shopu)

### 1.6 Premium funkce

- **Shoptet Premium:** Privatni API pristup pres 32-znakovy token (bez addon registrace)
- **Blank template:** Moznost uplne vlastni sablony
- Premium e-shopy maji admin obrazovku pro spravu API tokenu

---

## 2) KLICOVE ARCHITEKTURALNI ROZDILY SHOPIFY vs SHOPTET

| Aspekt | Shopify (Varianta A) | Shoptet |
|--------|---------------------|---------|
| **Frontend API** | Storefront API (verejny token, CORS OK) | ZADNY verejny API (JS funkce jen v sablone) |
| **Auth model** | 1 verejny token | 2 tajne tokeny (OAuth + short-term) |
| **Client-side volani** | ANO (primo z browseru) | NE (vyzaduje backend proxy) |
| **Cart creation** | GraphQL `cartCreate` + Cart Permalink URL | JS `shoptet.cartShared.addToCart()` (jen v sablone) NEBO REST API (server-side) |
| **Checkout redirect** | URL na `{shop}.myshopify.com/cart/...` | Neni primo — kosik je na Shoptet e-shopu |
| **Bez backendu** | ANO (cela Varianta A) | NE — backend/proxy NUTNY |
| **Addon registrace** | Custom App (self-service) | Formular + schvalovaci proces |

### Hlavni problem pro ModelPricer:

Shopify Varianta A = **ciste client-side** (zero backend). To u Shoptet **NENI MOZNE** kvuli:
1. OAuth tokeny jsou tajne → backend musi drzet tokeny
2. Short-term token ma 30min expiraci → backend musi refreshovat
3. JS cart API funguje jen v Shoptet sablone, ne z externiho widgetu

### Mozne pristupy pro Shoptet:

**Pristup A: "Cart Permalink" ekvivalent**
- Shoptet nema oficialni cart permalink URL (jako Shopify `/cart/{variant}:{qty}`)
- ALE: Mozna jde pouzit URL `https://<eshop>/action/Cart/addToCart?productCode=XXX&amount=Y`
- NUTNO OVERIT — toto neni zdokumentovano

**Pristup B: Backend proxy (doporuceny)**
- ModelPricer backend drzi OAuth token
- Frontend posle pozadavek na ModelPricer backend
- Backend ziska short-term token → zavola Shoptet API → vytvori objednavku/kosik
- Frontend presmeruje zakaznika na Shoptet checkout

**Pristup C: Shoptet addon s HTML embed**
- Zaregistrovat ModelPricer jako Shoptet addon
- Addon vlozi kalkulacku primo do Shoptet sablony
- V sablone je dostupne `shoptet.cartShared.addToCart()` → primo pridani do kosiku
- NEJLEPSI UX ale NEJSLOZITEJSI implementace (addon registrace, review proces)

**Pristup D: Hybrid (C + B fallback)**
- Pro Shoptet e-shopy: addon s primym HTML embedem (Pristup C)
- Pro externi nasazeni: backend proxy (Pristup B)

---

## 3) CO JESTE POTREBA ZJISTIT

- [ ] Kompletni seznam API endpointu z https://api.docs.shoptet.com/shoptet-api/openapi/endpoints
- [ ] OAuth flow detail z https://github.com/borekb/shoptet-oauth-helper
- [ ] Postman collection z https://github.com/shoptet/developers
- [ ] Existuje endpoint `POST /api/orders` pro server-side vytvoreni objednavky?
- [ ] Existuje endpoint pro server-side pridani do kosiku?
- [ ] Jake jsou presne webhook event typy?
- [ ] Jak presne funguje addon HTML code insertion?
- [ ] Jake jsou rate limity (od 09/2025)?
- [ ] Je mozne pouzit `https://<eshop>/action/Cart/addToCart?productCode=XXX` jako cart permalink?
- [ ] Jake scopes/permissions existuji pro addon OAuth?
- [ ] Jak funguje Premium API token vs addon OAuth?
- [ ] CORS policy — vraci Shoptet API CORS hlavicky?

### Zdroje k prostudovani:
- https://api.docs.shoptet.com/shoptet-api/openapi/endpoints — kompletni endpoint list
- https://github.com/borekb/shoptet-oauth-helper — OAuth flow detail
- https://github.com/shoptet/developers — Postman collection
- https://developers.shoptet.com/api/documentation/ — vsechny API guides
- https://developers.shoptet.com/home/shoptet-tools/editing-templates/how-to-properly-add-product-to-cart-with-javascript/ — JS cart API
- https://developers.shoptet.com/information-about-products-in-javascript/ — dataLayer

---

## 4) POKRACOVACI PROMPT PRO NOVY CHAT

Zkopiruj a vloz tento prompt na zacatek noveho chatu:

```
Pokracuji v planovani Shoptet integrace pro ModelPricer.

KONTEXT:
- ModelPricer = SaaS kalkulacka pro 3D tiskove firmy (zakaznik nahra model, spocita se cena)
- Uz mame HOTOVOU Shopify integraci (Varianta A — client-side only, bez backendu)
- Ted chceme analogickou integraci pro Shoptet (cesky e-commerce SaaS, 45k e-shopu)

CO UZ JE HOTOVE:
- Shopify integrace: adminEcommerceStorage.js, shopifyCartClient.js, shopifyCartMapper.js, ShopifyCartButton.jsx, AdminIntegrations.jsx (obsahuje Shopify sekci)
- Upraveny soubory: widget.js, widget-kalkulacka, test-kalkulacka, WidgetPublicPage, Routes.jsx, AdminLayout.jsx

RESEARCH:
Vsechny zjistene informace o Shoptet API jsou ulozeny v:
docs/claude/Jednoduchá_Dokumentace a návody/pokračování shoptet.md

UKOL:
1. Precti research soubor vyse — obsahuje detailni info o Shoptet API, autentizaci, JS cart API, rozdily oproti Shopify
2. Dokonci research — v souboru je sekce "CO JESTE POTREBA ZJISTIT" s checklistem a odkazy
3. Hlavne zjisti:
   - Kompletni endpoint list z https://api.docs.shoptet.com/shoptet-api/openapi/endpoints
   - OAuth flow z https://github.com/borekb/shoptet-oauth-helper
   - Existenci cart/order create endpointu (POST /api/orders, cart API)
   - Rate limity, webhook typy, CORS policy
4. Na zaklade VSECH informaci vytvor KOMPLETNI implementacni plan (jako Shopify plan ktery je v docs/claude/PLANS/)
5. KLICOVY ROZDIL: Shoptet NENI client-side jako Shopify — pravdepodobne bude potreba backend proxy. Zvaz pristupy A-D z research souboru.
6. Plan uloz do docs/claude/PLANS/

Precti CLAUDE.md a MEMORY.md pro plny kontext projektu.
```
