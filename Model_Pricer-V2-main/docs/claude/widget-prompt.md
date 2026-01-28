PROMPT — MP_WIDGET_CALC_BUILDER_v1 (FULL)
Jazyk výstupu: ČEŠTINA

──────────────────────────────────────────────────────────────────────────────
[EXTRA PŘÍSNÝ PŘÍKAZ — POVINNÉ SOUBORY KE STAŽENÍ]
1) Na konci KAŽDÉ odpovědi MUSÍŠ bez výjimky přiložit ZIP ke stažení.
2) ZIP musí být reálně vytvořen jako soubor v /mnt/data a musíš dát odkaz:
   [Download ZIP](sandbox:/mnt/data/NAZEV.zip)
3) I když je práce ROZPRACOVANÁ, stejně pošli ZIP a v názvu musí být:
   _NEDOKONCENO nebo _ROZPRACOVANO
4) ZIP vždy obsahuje kompletní aktuální stav práce:
   - ideálně PATCH_ONLY (jen změněné/nové soubory)
   - pokud se to rozkryje do více míst, udělej FULL
5) Na konci odpovědi vždy napiš:
   - Cíl (1–2 věty)
   - Stav: HOTOVO / NEDOKONČENO
   - Changelog (stručně)
   - Změněné soubory (přesné cesty)
   - Test checklist (5–10 kroků)
   - UX poznámky (co se změnilo pro uživatele a proč)
   - Návrhy na zlepšení (min. 5)

──────────────────────────────────────────────────────────────────────────────
ROLE
Jsi senior full-stack / frontend dev pro SaaS ModelPricer (Pricer V3).
Tvůj úkol: vytvořit embedovatelnou kalkulačku (widget) pro každého tenanta + admin builder (preview editace),
propojit s Branding, připravit iframe embed (responzivní), připravit postMessage eventy pro budoucí košík,
a vytvořit dokumentaci pro widget systém, aby nevznikl chaos.

──────────────────────────────────────────────────────────────────────────────
KONTEXT (aktuální stav v repu — důležité)
- Existuje admin stránka:
  - /src/pages/admin/AdminBranding.jsx (branding: logo, barvy, font, radius, přepínače)
  - /src/pages/admin/AdminWidget.jsx (widget instance, whitelist domén, embed snippet; zatím rozpracované)
- Existuje /src/pages/test-kalkulacka/* jako funkční template kalkulačky.
- DŮLEŽITÉ: /src/pages/test-kalkulacka NESMÍŠ UPRAVOVAT (zakázáno).
  Pokud cokoli potřebuješ změnit pro widget, UDĚLEJ DUPLIKÁT.
- Existuje tenant helper: /src/utils/adminTenantStorage.js (tenantId z localStorage).

──────────────────────────────────────────────────────────────────────────────
CÍLE (MVP + připravenost do budoucna)
MVP (musí být hotové):
1) Každý tenant/firma má vlastní veřejný widget dostupný zákazníkům BEZ loginu.
2) Widget se embeduje do webu firmy přes iframe — robustní, responzivní, bez vnitřního scrollu.
3) Widget se identifikuje přes publicWidgetId (URL /w/{publicWidgetId}), navenek neschovávej tenantId.
4) Admin:
   - /admin/widget: správa více widgetů pro tenant (list, create, enable/disable, whitelist domén, embed snippet)
   - /admin/widget/builder/:id: režim preview editace + klikací výběr elementu + color picker + úprava theme.
5) Branding propojení:
   - Widget přebírá logo + název firmy + tagline + základní barvy, font, radius z /admin/branding.
   - V builderu lze upravovat i font + radius + barvy a vše se ukládá tenant-scoped (sjednoceně).
6) Theme editor:
   - Kliknu na “box/okénko” ve widget preview → zvýrazní se a otevře se color-picker pro vybraný element.
   - Fallback sidebar se seznamem elementů (aby to šlo i když klikání nebude přesné).
   - Stylovat lze “vše kromě Model viewer container” (tj. neřeš barvu kontejneru 3D vieweru).
7) Domain whitelist (bezpečnost MVP):
   - Widget se má zobrazit pouze, když je embednut na povolených doménách (proti kradení embed kódu).
8) PostMessage events (pro budoucí košík):
   - Widget musí posílat eventy: PRICE_CALCULATED a ADD_TO_CART (payload definuj).
9) Prozatímní ukládání “quote session” + modelů:
   - Zatím NENÍ backend.
   - Udělej provizorní ukládání na straně prohlížeče (localStorage + IndexedDB pro soubory),
     aby se zákazník mohl vrátit později.
   - Připrav datový model a rozhraní, které půjde později snadno přepnout na server-side storage.
10) Dokumentace:
   - Vytvoř dedikovaný dokument (např. /docs/widget/WIDGET_CALC.md),
     kde bude do detailu popsáno: architektura, routy, storage klíče, postMessage protokol,
     whitelist domén, embed snippet, a “Bezpečnost — budoucí úpravy” (např. podpis URL / tokeny).

Budoucnost (NEimplementovat teď, jen připravit a zdokumentovat):
- Per-device layout builder (mobil/tablet/desktop vlastní rozvržení).
- Gating podle tarifů: PoweredBy nejde vypnout v levných tarifech; language switch jen ve vyšších tarifech.
- ShopID + add-to-cart integrace (Shoptet/Shopify/Woo).
- Server-side storage s TTL (neobjednané vs objednané, limity podle tarifu).

──────────────────────────────────────────────────────────────────────────────
TVÁ ROZHODNUTÍ (už potvrzené uživatelem)
- Embed metoda: IFRAME (ANO).
- Identifikace: publicWidgetId přes /w/:publicWidgetId (ANO).
- Multi-widget pro tenant: ANO.
- Widget veřejný bez loginu: ANO.
- Enable/disable: ANO.
- Domain whitelist: ANO.
- Responzivní výška iframe: vyber lepší a jednodušší implementaci.
  Pozn.: “iframe-resizer” vs vlastní postMessage; vyber řešení, které:
  - je spolehlivé na mobilu/tabletu,
  - je implementačně jednoduché,
  - nebude blokovat budoucí per-device layout.
  (Preferuj jednoduché, ale funkčně robustní.)
- Branding převzít do widgetu: ANO.
- Per-widget override: NE (theme je pro tenant globálně; všechny widgety sdílí theme).
- Klikání na box pro color picker: ANO.
- Sidebar fallback: ANO.
- Stylovat: vše kromě Model viewer container.
- Builder route: /admin/widget/builder/:id (ANO).
- Flow kalkulačky: stejně jako test-kalkulacka (A — stejné 3 kroky).
- Logo klikací URL: ANO.
- ShopID field: ANO (zatím jen uložit a připravit).
- URL token/signature: zatím NE, ale musí být v dokumentaci jako budoucí bezpečnost.
- Dark mode: zatím NE.
- Font + radius editace v editoru: ANO.
- Header ve widgetu: ANO.
- Powered by: musí existovat, ale vypínání jen pro vyšší tarif (teď implementuj “feature flag” model + mock).
- Jazyk: CZ + EN hned. Do budoucna více jazyků.
  Firma si nastaví “default jazyk” vždy.
  V dražších tarifech bude možné přepnout jazyk i pro zákazníka (teď implementuj “feature flag” model + mock).
- PostMessage events: ANO.
- Quote/model persistence: ANO, provizorně klientsky + připravit pro server TTL (rozlišit objednané/neobjednané).
  Požadovaná logika do budoucna:
  - objednané modely: vyšší tarify delší retence (např. 1 rok); levnější tarify kratší (např. 2 měsíce)
  - neobjednané: v levném tarifu se neukládá; ve vyšším tarifu se ukládá např. 2 týdny
  Teď udělej provizorní implementaci + dokumentaci + rozhraní pro budoucí backend.

──────────────────────────────────────────────────────────────────────────────
NEGOALS / CO SE NESMÍ
- Nesmíš měnit /src/pages/test-kalkulacka/* (ani “malé úpravy”).
- Nesmíš dělat refactor celého projektu ani UI redesign mimo widget scope.
- Nesmíš měnit soubory, které nejsou potřeba pro widget/branding/widget admin.
- Nesmíš mazat rozpracované soubory, pokud to není nutné (raději je nech, ale zajisti, aby nepadal build).
- Nesmíš “zavést nový systém” pro storage mimo tenant scope — musí to být tenant-scoped a konzistentní.

──────────────────────────────────────────────────────────────────────────────
ARTEFAKTY KTERÉ MUSÍ VZNIKNOUT (s přesnými doporučenými cestami)
A) DUPLIKÁT kalkulačky:
- /src/pages/widget-kalkulacka/*  (nový název, žádné “test” v názvech komponent)
  - např. /src/pages/widget-kalkulacka/index.jsx
  - /src/pages/widget-kalkulacka/components/* (WidgetUpload, WidgetPricing, …)
  - interní exporty a názvy komponent musí být přejmenované (žádné TestKalkulacka jména).
B) Veřejná widget route:
- /src/pages/widget-public/WidgetPublicPage.jsx (nebo /src/pages/widget/WidgetPublicPage.jsx)
- Router: přidat route /w/:publicWidgetId → veřejný widget.
C) Admin Widget:
- /src/pages/admin/AdminWidget.jsx (opravit tenantId hardcode, napojit na storage, create/list/edit)
- /src/pages/admin/AdminWidgetBuilder.jsx (nový) pro /admin/widget/builder/:id
D) Storage helpers (tenant scoped):
- /src/utils/adminWidgetStorageV3.js  (widgets list + per-widget config)
- rozšířit /src/utils/adminBrandingWidgetStorage.js nebo vytvořit /src/utils/adminThemeStorageV3.js
  (musí být jasné, co je branding vs widget theme; ale má to být sjednocené pro tenant).
E) Embed snippet:
- generátor embed kódu (iframe + resizer script podle zvoleného řešení).
F) Dokumentace:
- /docs/widget/WIDGET_CALC.md (detailní)
- plus “CHANGELOG sekce” uvnitř dokumentu (datum, co se změnilo).
G) PostMessage protokol:
- definovat v dokumentaci a v kódu jako konstanty (typy eventů + payload shape).

──────────────────────────────────────────────────────────────────────────────
ARCHITEKTURA (doporučený model, implementuj v MVP)
1) Widget model (uložený tenant-scoped):
   - id (interní)
   - publicWidgetId (veřejné, použité v URL)
   - name
   - enabled (bool)
   - allowedDomains (string[])
   - shopId (string | null)
   - defaultLanguage ("cs" | "en")
   - allowCustomerLanguageSwitch (bool)  [gated feature]
   - createdAt, updatedAt

2) Tenant Theme model (globální pro tenant, sdílené pro všechny widgety):
   - backgroundColor
   - cardColor
   - headerColor
   - buttonPrimaryColor
   - buttonTextColor
   - inputBgColor
   - inputBorderColor
   - summaryBgColor
   - feeListBgColor
   - atd. (podle stylovatelných bloků; “kromě model viewer container”)
   - fontFamily
   - cornerRadius
   - logoUrl (odkaz/klikací URL + image data z brandingu)

3) Plan/Feature gating (mock v localStorage — připrav pro budoucí backend):
   - plan: "starter" | "pro" | "business" (nebo podobně)
   - rules:
     - showPoweredBy: starter/pro = true forced, business = toggle
     - allowCustomerLanguageSwitch: pouze vyšší plán
   Implementuj zatím jako jednoduché “feature flags” načtené tenant-scoped.

4) Domain whitelist enforcement:
   - V public widget page zjisti, zda je stránka embednutá (window.top !== window.self).
   - Pokud je embednutá:
     - ověř referrer/origin handshake:
       - parent pošle HELLO postMessage s origin (nebo referrer se použije jako fallback).
       - widget ověří, že origin domény je v allowedDomains.
       - pokud není povolená → zobraz “Widget není povolen pro tuto doménu”.
   - Pokud není embednutá (otevřeno napřímo) → povol zobrazení (užitečné pro debug i sdílení linku).
   - V dokumentaci uveď, že bez tokenu nelze 100% zabránit “otevření linku”, ale embed ochrana funguje.

5) Iframe resizing:
   - Vyber nejlepší a jednoduché řešení:
     - Buď vlastní: ResizeObserver v widgetu + postMessage “HEIGHT” + embed snippet v parentu přenastaví iframe height
     - Nebo iframe-resizer (pokud je jednodušší a stabilnější)
   - Důraz: nesmí být vnitřní scroll, musí fungovat na mobilu/tabletu.

6) PostMessage events (pro košík):
   - PRICE_CALCULATED: { publicWidgetId, quoteSessionId, totals, currency, itemsSummary }
   - ADD_TO_CART: { publicWidgetId, quoteSessionId, payloadForShopIntegration }
   - V budoucnu přidáš: CART_OPEN, ORDER_CREATED, etc.
   - Zajisti, aby parent mohl eventy snadno zachytit (příklad v dokumentaci + v embed snippet).

7) Prozatímní quote/model storage:
   - localStorage: metadata session (quoteSessionId, nastavení, ceny, timestampy, ordered flag)
   - IndexedDB: file blobs (STL/OBJ) + slicer výsledky cache (pokud existují)
   - Cleanup: při startu widgetu smaž expirované session (podle “policy” vycházející z plánu).
   - Ulož to tak, aby se to dalo později nahradit server-side API bez refactoru:
     - vytvoř “storage adapter” s rozhraním: saveQuoteSession, loadQuoteSession, saveFiles, loadFiles, markOrdered, cleanup.

──────────────────────────────────────────────────────────────────────────────
CHECKPOINTY (musíš dodat po krocích; každý CP = ZIP)
CP1 (Foundation + routy + duplikát kalkulačky):
- vytvořit /src/pages/widget-kalkulacka (duplikát test-kalkulacka, bez úprav originálu)
- přidat public route /w/:publicWidgetId, která načte widget config + theme + branding
- základ embed snippet (iframe) generovaný v AdminWidget (zatím bez whitelist enforcement)
- dokumentace soubor založit, vypsat architekturu + rozhodnutí + TODO bezpečnost

CP2 (AdminWidget + Builder + Theme editor):
- opravit AdminWidget: tenantId hardcode pryč, vytvoření/editace widgetu, enable/disable, domains, shopId, defaultLanguage
- vytvořit /admin/widget/builder/:id:
  - preview (nejlépe render widget-kalkulacka v “builder mode”)
  - kliknutí na box vybere element a otevře color picker
  - sidebar fallback seznam elementů
  - změny se ukládají tenant-scoped (globální theme)
  - font + radius editace v editoru
- propojit s Branding (logo, name, tagline, show/hide)
- doplnit CZ/EN texty (aspoň základ; připravit i18n rozhraní)

CP3 (Whitelist + Resizing + PostMessage + Session storage):
- implementovat domain whitelist enforcement v public widgetu
- implementovat výškové resize řešení (včetně embed snippet části)
- implementovat postMessage eventy PRICE_CALCULATED a ADD_TO_CART
- implementovat provizorní quote session storage (localStorage + IndexedDB) + cleanup + policy mock
- doplnit dokumentaci: embed snippet, whitelist, postMessage protokol, session storage, budoucí security (token/sign)

──────────────────────────────────────────────────────────────────────────────
SEKCE 1 — Chat A (CORE / DATA / ROUTES / STORAGE) — paralelně
Scope:
- Widget datový model, tenant storage helpers, routy, public widget page, session storage adapter, postMessage protokol (konstanty).
NEřeš UI builder klikání ani color picker UI (to je Chat B).
Konkrétní úkoly:
A1) Založ adminWidgetStorageV3 (tenant scoped), přidej CRUD pro widgets.
A2) Přidej routu /w/:publicWidgetId + načítání widget configu + theme + branding.
A3) Připrav “WidgetRuntimeConfig” = sloučení: Branding + Theme + WidgetConfig + PlanFlags.
A4) Založ “QuoteSessionStorageAdapter” (localStorage + IndexedDB), zatím mock policy.
A5) Definuj postMessage typy + payload a exportuj konstanty.
A6) Připrav embed snippet (iframe src + event listeners pro výšku + event listeners pro PRICE_CALCULATED/ADD_TO_CART).
A7) Dokumentace: založ /docs/widget/WIDGET_CALC.md + vyplň architekturu, storage keys, routy.

Výstupy Chat A:
- CP1 a CP3 části (core).
- ZIP po každé odpovědi.

──────────────────────────────────────────────────────────────────────────────
SEKCE 2 — Chat B (ADMIN UI / BUILDER / THEME EDITOR) — paralelně
Scope:
- AdminWidget UI + AdminWidgetBuilder, preview editace, klikání na elementy, color picker, sidebar fallback, font/radius, napojení na branding.
NEřeš IndexedDB/session storage (to je Chat A).
Konkrétní úkoly:
B1) Oprav AdminWidget.jsx (tenantId hardcode pryč, UI pro multi widgets, domains, enable, embed snippet).
B2) Vytvoř /admin/widget/builder/:id:
    - 2-pane layout: Preview + Panel nastavení (selected element, color picker, font, radius, language).
    - Klikání na boxy ve preview vybere element (highlight).
    - “Stylovat vše kromě Model viewer container”.
    - Sidebar se seznamem stylovatelných elementů jako fallback.
B3) Propojení s Branding:
    - zobrazení logo, businessName, tagline ve widget headeru.
    - klikací logo URL.
    - showPoweredBy: respektovat feature gating (teď mock flags).
B4) i18n:
    - alespoň CZ/EN texty pro základní části widgetu + admin builder UI.
    - Firma nastaví defaultLanguage u widgetu.
    - allowCustomerLanguageSwitch je gated flag (zatím mock).

Výstupy Chat B:
- CP2 části + UI části embed snippet zobrazení.
- ZIP po každé odpovědi.

──────────────────────────────────────────────────────────────────────────────
SEKCE 3 — Chat C (DOC / QUALITY / INTEGRATION FIXES) — paralelně
Scope:
- dokumentace, sanity check, minimal bugfix integrace, sjednocení naming, odstranění rizika white-screen.
Konkrétní úkoly:
C1) Projdi zda nové routy/importy nezpůsobí Vite “white screen”.
C2) Zkontroluj duplicity souborů a naming konfliktů (test-kalkulacka vs widget-kalkulacka).
C3) Rozšiř /docs/widget/WIDGET_CALC.md o:
    - “Bezpečnost — budoucí úpravy” (token/signature, CSP, rate limits, server-side validation)
    - “Retence dat” (objednané vs neobjednané, tarify)
    - “Košík integrace — budoucí API” (shopId, cart session)
C4) Dodej “Testovací scénáře” (manuální i jednoduché unit testy pokud už projekt má infra).
C5) Doporučení (min. 10) — P0/P1/P2.

──────────────────────────────────────────────────────────────────────────────
SPECIFICKÉ IMPLEMENTAČNÍ DETAILY (aby nevznikl chaos)
1) Tenant scoping:
- VŠECHNY storage klíče musí obsahovat tenantId (např. modelpricer:{tenantId}:...).
- AdminWidget nesmí mít natvrdo tenantId.
- Public widget se mapuje přes publicWidgetId -> widget -> tenantId (v demo režimu to může být v localStorage,
  ale připrav rozhraní pro backend).

2) Duplikát kalkulačky:
- Musí být kompletní a funkční i bez úprav test-kalkulacka.
- Přejmenuj komponenty, exporty, texty tak, aby se nepletly.
- Pokud sdílíš některé komponenty/utilities, dělej to jen když je to bezpečné a NErozbije to test-kalkulacka.

3) Stylování elementů:
- Každý stylovatelný blok musí mít “styleId” (např. data-style-id="summaryCard").
- Builder mode:
  - kliknutí vybere styleId
  - highlight overlay
  - změna barvy = update theme config
- Model viewer container neřeš.

4) Embed snippet:
- Musí fungovat copy-paste.
- Musí obsahovat:
  - iframe src (public widget url)
  - inicializační script pro resizing
  - listener pro PRICE_CALCULATED a ADD_TO_CART (příklad)
- V dokumentaci ukaž 2 varianty:
  - Minimal embed
  - Embed s event handlery (pro shop integrace)

5) Fees ve widgetu:
- Widget kalkulačka musí být připravená na selectable fees z AdminFees (už existuje logika).
- Pokud je něco “demo fees”, nesmí to blokovat budoucí napojení; připrav “hook” pro načítání fees.

──────────────────────────────────────────────────────────────────────────────
POVINNÉ TEST CHECKLIST (použij v každém CP)
- /admin/widget funguje: list, create, edit, enable/disable, domains, embed snippet
- /admin/widget/builder/:id funguje: kliknutí vybere element, color picker změní barvu, ukládání persistuje
- /w/:publicWidgetId funguje: veřejné, načte branding/theme, je responsivní, bez vnitřního scrollu
- embed na cizí doméně mimo whitelist: zobrazí blokaci
- PRICE_CALCULATED posílá postMessage do parenta
- quote session se uloží a po refreshi se obnoví (aspoň metadata; soubory pokud se podaří přes IndexedDB)
- cleanup expirovaných session proběhne

──────────────────────────────────────────────────────────────────────────────
VÝSTUPY (co máš posílat v odpovědích)
- V každé odpovědi: ZIP + report (Cíl/Stav/Changelog/Soubory/Test/UX/Návrhy).
- Kód musí být čistý, s komentáři u složitých částí (postMessage, whitelist, storage).
- V dokumentaci musí být “zdroj pravdy” pro budoucí navazování.

KONEC PROMPTU
─────────────────────────────────────────────────────────────────────────────