# 11. Widget & Embed system — Detailni RoadMap Plan

> **Stav:** 🟡 50% hotovo | **Priorita:** VYSOKA
> **Zavislosti na jine sekce:** Kalkulacka (#1) — sdilene komponenty, Branding (#13)
> **Kdo na nem zavisi:** Widget Builder (#12), Shopify integrace

---

## Prehled

Embedovatelna verze kalkulacky kterou firma vlozi na svuj web pres iframe. Widget je duplikat test-kalkulacky bez checkout flow. Komunikuje s parent strankou pres postMessage.

**Hlavni adresar:** `src/pages/widget-kalkulacka/`
**Hlavni soubor:** `src/pages/widget-kalkulacka/index.jsx` (~907 radku, 17 komponent)
**Public route:** `/w/:publicWidgetId`
**Embed script:** `public/widget.js`
**PostMessage typy:** MODELPRICER_* prefix

---

## Co je HOTOVO (✅)

### Widget orchestrator (75%)
- [x] 3-step wizard (upload → konfigurace → cena) — BEZ checkoutu
- [x] 17 sub-komponent
- [x] Theme CSS vars pro customizaci
- [x] Nacitani konfigurace z tenant storage

### PostMessage protokol (80%)
- [x] Komunikace s parent strankou (iframe ↔ parent)
- [x] Origin validace (bezpecnost)
- [x] Typy zprav:
  - [x] MODELPRICER_SHOPIFY_CHECKOUT_URL
  - [x] MODELPRICER_ADD_TO_SHOPIFY_CART
  - [x] MODELPRICER_SHOPIFY_CONFIG
  - [x] Cenove info zpravy

### Domain whitelist (80%)
- [x] Omezeni na povolene domeny
- [x] Konfigurovatelne v admin

### Shopify integrace (75%)
- [x] ShopifyCartButton ve widgetu
- [x] Cart Permalink rezim
- [x] Storefront API rezim

---

## Co CHYBI / je potreba dodelat

### Faze 1: Shipping/Express/Coupons integrace (Priorita: VYSOKA)

> **SPOLECNA FAZE s Kalkulackou (#1) — ale pouziva CSS vars misto Tailwind!**

#### Ukol 1.1: Portovat Shipping/Express/Coupons do widgetu
- **Soubor:** `src/pages/widget-kalkulacka/index.jsx`
- **Co udelat:**
  - [ ] Pridat ShippingSelector (widgetova verze s CSS vars)
  - [ ] Pridat ExpressTierSelector (widgetova verze)
  - [ ] Pridat CouponInput (widgetova verze)
  - [ ] Propojit s pricing engine
  - [ ] **DULEZITE:** Widget pouziva theme CSS vars, NE Tailwind!
- **Poznamka:** Pouzit widgetove verze komponent (pokud existuji) nebo vytvorit widget-specificky wrapper

#### Ukol 1.2: PostMessage pro Shipping/Express/Coupon info
- **Soubor:** `public/widget.js`
- **Co udelat:**
  - [ ] Novy typ zpravy: MODELPRICER_SHIPPING_SELECTED
  - [ ] Novy typ zpravy: MODELPRICER_EXPRESS_SELECTED
  - [ ] Novy typ zpravy: MODELPRICER_COUPON_APPLIED
  - [ ] Parent stranka muze reagovat na tyto udalosti

### Faze 2: Responsivita (Priorita: STREDNI)

#### Ukol 2.1: Opravit breakpointy
- **Co udelat:**
  - [ ] Otestovat widget na ruznych sirech iframe (300px, 400px, 600px, 100%)
  - [ ] Opravit preteceni textu na malych sirkach
  - [ ] Stackovani elementu na mobilu
  - [ ] Touch-friendly tlacitka a inputy

### Faze 3: Builder mode opravy (Priorita: STREDNI)

#### Ukol 3.1: Widget Builder rezim
- **Co udelat:**
  - [ ] Overit ze builder mode (preview v editoru) funguje spolehlive
  - [ ] Mock data pro builder — nema pristuip k realnym datum
  - [ ] Resize handling v builder preview

### Faze 4: Embed script dokumentace (Priorita: STREDNI)

#### Ukol 4.1: Dokumentace pro firmy
- **Co udelat:**
  - [ ] Navod jak vlozit widget na web
  - [ ] Priklad embed snippetu
  - [ ] Konfiguracni atributy (widget ID, theme, jazyk)
  - [ ] Troubleshooting (CORS, origin whitelist)

---

## Implementacni poradi

1. **Faze 1** (Shipping/Express/Coupons) — 3-4 hodiny, po kalkulacce (#1)
2. **Faze 2** (Responsivita) — 2-3 hodiny
3. **Faze 3** (Builder mode) — 2-3 hodiny
4. **Faze 4** (Dokumentace) — 1-2 hodiny

**Celkem pro Beta:** ~8-12 hodin

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| CSS vars vs Tailwind konflikt | Stredni | Stredni | Vzdy CSS vars ve widgetu |
| PostMessage CORS problemy | Nizka | Vysoky | Domain whitelist |
| Widget nefunguje na nekterych webech | Stredni | Vysoky | Testovani na vice platformach |

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/widget-kalkulacka/index.jsx` | Render komponenty | Stredni |
| `src/pages/widget-kalkulacka/components/` | Widgetove verze | Stredni |
| `public/widget.js` | Nove postMessage typy | Maly |

---

## Poznamky

- **KRITICKE:** Widget NEMA checkout! Neportovat S02 (checkout flow). Widget posila cenu → parent stranka resi checkout.
- **KRITICKE:** Widget pouziva theme CSS vars, NE Tailwind
- **TIP:** Widget je v podstate "read-only kalkulacka" — zakaznik vidi cenu a firmu kontaktuje/prida do kosiku
- Widget Builder (#12) konfiguruje VZHLED widgetu, ne jeho FUNKCIONALITU

---

## Kriticke doplnky (z review)

### CSS vars referece (theme customization API)
- [ ] Widget theme vars (nastavitelne pres Widget Builder):
  ```css
  --mp-primary: #0d9488;     /* akcni barva */
  --mp-bg: #1a1e2e;          /* pozadi */
  --mp-surface: #242838;     /* karty/panely */
  --mp-text: #e2e8f0;        /* hlavni text */
  --mp-text-muted: #7a8291;  /* sekundarni text */
  --mp-border: #2d3348;      /* okraje */
  --mp-radius: 8px;          /* border-radius */
  --mp-font: 'Inter', sans-serif; /* font */
  ```
- [ ] Widget nesmie pouzivat Tailwind utility classes — vsechno pres CSS vars
- [ ] Parent stranka muze overridnout vars pres `<style>` v iframe nebo pres postMessage konfigurace
- [ ] Dark/Light mode prepinani pres jednu var (`--mp-mode: dark | light`)

### PostMessage protokol — kompletni reference
- [ ] Existujici typy:
  - `MODELPRICER_READY` — widget se nacetl
  - `MODELPRICER_RESIZE` — widget meni vysku (pro auto-resize iframe)
  - `MODELPRICER_PRICE_UPDATE` — nova cena (po zmene konfigurace)
  - `MODELPRICER_SHOPIFY_CHECKOUT_URL` — Shopify cart URL
  - `MODELPRICER_ADD_TO_SHOPIFY_CART` — pridani do Shopify kosiku
  - `MODELPRICER_SHOPIFY_CONFIG` — Shopify konfigurace z parent
- [ ] Nove typy k pridani:
  - `MODELPRICER_SHIPPING_SELECTED` — zakaznik vybral dopravu
  - `MODELPRICER_EXPRESS_SELECTED` — zakaznik vybral express tier
  - `MODELPRICER_COUPON_APPLIED` — zakaznik aplikoval kupon
  - `MODELPRICER_ORDER_READY` — vsechny data pripravena k objednavce
  - `MODELPRICER_ERROR` — chyba ve widgetu (slicing fail apod.)
- [ ] Kazda zprava: `{ type: 'MODELPRICER_*', payload: {...}, timestamp: Date.now() }`

### iframe bezpecnost
- [ ] `sandbox` atribut na iframe: `sandbox="allow-scripts allow-forms allow-same-origin"`
- [ ] Origin validace na OBOU stranach (widget i parent)
- [ ] Domain whitelist z admin konfigurace — widget odmitne komunikaci s nepovolenym originem
- [ ] CSP header na widget route: `frame-ancestors` omezeny na povolene domeny
- [ ] XSS prevence: nikdy `innerHTML` s daty z postMessage
- [ ] Rate limiting na postMessage (max 10 zprav/s)

### Widget loading optimalizace
- [ ] Lazy load Three.js (jen kdyz je model nahran)
- [ ] Skeleton loading pri nacitani konfigurace
- [ ] Widget embed script `widget.js` by mel byt < 5 KB (jen bootstrap, zbytek lazy)
- [ ] Preconnect/prefetch pro API endpointy
- [ ] Widget cachovani: `Cache-Control: public, max-age=3600` na static assets
