# 01 — Vyzkum: Account Section Pages

> **Datum:** 2026-02-20
> **Faze:** 1 ze 4 (Auth Research)
> **Ucel:** Zjistit jake stranky/taby musi mit Account sekce na modernim SaaS webu

---

## 1. Vyzkum SaaS platform

### 1.1 Stripe Dashboard
- **Profile:** jmeno, email, avatar, heslo, komunikacni preference, aktivni sessions
- **Account:** obchodni udaje (nazev, adresa, descriptor), bankovni ucty, custom domeny, PCI compliance
- **Team:** invite, role (Owner/Administrator/View Only/Custom)
- **Branding:** logo, barvy pro hosted checkout/invoices
- **Developers:** API klice, webhooky, eventy, logy, API verze

### 1.2 Vercel
- **Personal:** jmeno, avatar, username, slug
- **Billing:** plan, platebni metoda, faktury, usage alerts
- **Tokens:** personal access tokens s expiraci
- **Notifications:** deployment status, security, domeny
- **Security:** heslo, 2FA, SSO
- **Team:** clenove (Owner/Member/Viewer/Billing), SAML, audit log (Enterprise)

### 1.3 Shopify Admin
- Flat Settings menu: General, Plan, Billing, Users+Permissions, Payments, Checkout, Shipping, Taxes, Locations, Notifications, Metafields, Markets, Domains, Brand, Policies

### 1.4 Netlify
- **User:** jmeno, email, avatar, theme, Git accounts, 2FA, personal tokens
- **Team:** clenove (Owner/Collaborator/Billing Admin), billing, audit log, SAML SSO

### 1.5 DigitalOcean
- **Account:** jmeno, sign-in metoda, email+heslo, 2FA, email preference, tymy, deaktivace uctu
- **Team:** clenove (Owner/Member/Biller), billing, security, API, custom role

### 1.6 Cloudflare
- **Profile:** heslo, 2FA (TOTP/security key), API tokeny, komunikace, jazyk, theme, timezone
- **Account:** clenove, billing, audit logy, notifikace, account-level API tokeny

### 1.7 Linear
- **Personal:** profil, preference (theme, density), notifikace, security (API klice, sessions)
- **Workspace:** general, clenove, plany, billing, security, import/export, sablony, labels, integrace, API, audit log

### 1.8 Notion
- **Personal:** foto, jmeno, email, heslo, jazyk, notifikace, connections
- **Workspace:** nazev, ikona, clenove, billing (Free/Plus/Business/Enterprise), security, identity (SAML), connections, import

### 1.9 Figma
- **Account tab:** jmeno, email, avatar, heslo, 2FA, notifikace, personal access tokens, connected apps
- **Community tab:** handle, social connections
- **Notifications tab:** per-event toggles
- **Team/Org:** clenove, billing, security (SSO/SAML/SCIM), AI, fonty, knihovny, pluginy

---

## 2. Vyzkum 3D print platform

### 2.1 Xometry
- **Account:** kontaktni info, adresa, komunikacni preference
- **Company:** firemni udaje (nazev, IC/DIC), odvetvi, velikost firmy
- **Billing:** platebni metody, objednavkova historie, fakturacni adresa
- **Shipping:** ulozene dorucovaci adresy (vice adres)
- **Specificke:** material preference, tolerance defaults, historie nabidek

### 2.2 Hubs (dnes Protolabs Network)
- **Profile:** jmeno, email, telefon
- **Company:** firemni udaje pro fakturaci
- **Orders:** historie objednavek s tracking
- **Quotes:** ulozene cenove nabidky
- **Addresses:** fakturacni + dorucovaci
- **Specificke:** preferovane materialy, opakovane objednavky

### 2.3 Craftcloud (All3DP)
- **Profile:** zakladni info (jmeno, email)
- **Orders:** status tracking objednavek
- **Addresses:** dorucovaci adresy
- Zjednoduseny model — zameren na jednorazove zakazniky

### 2.4 Shapeways
- **Profile:** jmeno, avatar, bio (community profil)
- **Shop:** nastaveni obchodu (Shapeways marketplace)
- **Billing:** platebni metody, vyplaty (pro sellery)
- **API:** developer pristup
- **Specificke:** 3D model knihovna, cenove upozorneni

### 2.5 i.materialise
- **Profile:** kontaktni info, preference
- **Company:** firemni udaje
- **Models:** knihovna nahraných modelu
- **Orders:** historie s detailnimi parametry (material, finish, color)

### 2.6 Sculpteo
- **Profile:** zakladni info
- **Billing:** platebni metody, fakturacni adresa
- **Models:** 3D model knihovna s verzovanim
- **Specificke:** batch pricing, custom materialove nastaveni

### Co je specificke pro 3D print platformy
- **Dorucovaci adresy** (vic nez 1) — B2B casto deli fakturacni a dorucovaci
- **Firemni udaje** (IC, DIC, nazev) — B2B nutnost
- **Material preference** — zakazniky si ukladaji oblibene materialy
- **Model knihovna** — ulozene 3D modely pro opakovane objednavky
- **Quote/nabidka historie** — specificke pro manufacturing

### Jak se lisi od generic SaaS
1. **Adresovy management** je dulezitejsi (B2B shipping)
2. **Firemni udaje** jsou povinne (fakturace, DPH)
3. **Zadny subscription** u vetsiny — platba per-order
4. **Material/process knowledge** — uzivatele ocekavaji prednastaveni
5. **Model storage** — unikatni pro 3D print, neexistuje u generic SaaS

---

## 3. UX Best Practices pro Account/Settings stranky

### 3.1 Navigace
- **Dominantni pattern:** levy vertikalni sidebar se sekcemi (ne taby nahore)
- **Sekundarne:** breadcrumb header "Settings > Section Name"
- **Seskupovani:** Personal settings vs Team/Workspace settings oddelene vizualne
- **Mobile:** sidebar kolabuje do hamburger menu nebo full-screen navigace

### 3.2 Layout
- **Max content width** ~800px pro formulare (nestahovat na celou sirku)
- **Dva sloupce:** sidebar nav (240px levy) + content area (pravy)
- **Save button dole** u formularu (ne auto-save) — Stripe, Shopify, DigitalOcean, Cloudflare
- **Auto-save** jen pro toggle/boolean preference — Linear, Notion, Figma
- **Modalni dialog** pro destruktivni akce

### 3.3 Formularova UX
- **Inline validace** na polickach (ne az pri submit) — vsechny platformy
- **Specificke chybove hlasky** ("Tento email je jiz pouzivan", ne genericky "Chyba")
- **Toast/snackbar** pro uspech (3-5s auto-dismiss): "Profil ulozen", "Clen pozvan"
- **Confirmation dialogy** pro vsechny destruktivni akce
- **Disabled state s tooltipem** pro akce omezene planem/roli

### 3.4 Bezpecnostni nastaveni UX
- **Zmena hesla:** 3 pole (soucasne, nove, potvrzeni) + strength meter
- **2FA setup:** krokovy pruvodce (QR kod → overovaci kod → recovery kody)
- **Aktivni sessions:** tabulka (zarizeni, IP, posledni aktivita) + "Odhlasit vsechny"
- **Login historie:** timeline poslednich prihlaseni

### 3.5 Billing UX
- **Plan prominentne zobrazen** (nazev + cena + datum obnovy)
- **Platebni karta** s poslednimi 4 cislicemi a expiraci
- **"Zmenit tarif"** otevre srovnavaci modal (ne novou stranku)
- **Faktury** jako tabulka se statusem (Uhrazeno/Otevrzeno/Selhalo) + PDF download
- **Selhala platba:** persistentni banner s CTA "Aktualizovat platbu"

### 3.6 Role pattern (nejcastejsi)
| Role | Co muze delat |
|------|--------------|
| Owner | Vse: billing, smazani workspace, vsechna nastaveni |
| Admin | Clenove, nastaveni, integrace — NE billing/delete |
| Member | Core produkt, vlastni profil/notifikace |
| Viewer/Guest | Read-only pristup |

---

## 4. Spolecne sekce napric VSEMI platformami

| Sekce | Vyskyt | Priorita |
|-------|--------|----------|
| **Profile** (jmeno, email, avatar) | 8/8 SaaS + 6/6 3D | P0 |
| **Security** (2FA, heslo, sessions) | 8/8 SaaS | P0 |
| **Billing** (plan, platba, faktury) | 8/8 SaaS | P0 |
| **Team/Members** (invite, role, remove) | 8/8 SaaS | P1 |
| **Notifications** (email, in-app) | 8/8 SaaS | P1 |
| **Company/Firma** (nazev, IC, DIC) | 6/6 3D print | P0 (B2B) |
| **Addresses** (fakturacni + dorucovaci) | 6/6 3D print | P1 |
| **API Tokens** | 7/8 SaaS | P2 |
| **Integrations** | 7/8 SaaS | P2 |
| **Audit Log** | 6/8 SaaS | P2/Enterprise |
| **Appearance** (theme) | 5/8 SaaS | P2 |

---

## 5. Nase rozhodnuti — 4 taby pro ModelPricer

Na zaklade vyzkumu definujeme 4 taby pro Account sekci:

### Tab 1: Profil (Profile)
| Pole/Feature | Typ | Priorita |
|-------------|-----|----------|
| Jmeno | text input | P0 |
| Prijmeni | text input | P0 |
| Email | text input (readonly po verifikaci) | P0 |
| Telefon | text input | P1 |
| Avatar/foto | upload | P2 |
| Jazyk (CS/EN) | select | P0 |
| Timezone | select | P2 |
| **Save button** | button | P0 |

**Stavy:**
- Default: zobrazeni aktualnich dat z auth providera
- Editing: pole aktivni, Save button aktivni
- Saving: loading spinner na Save button
- Success: toast "Profil ulozen"
- Error: inline chybova hlaska na konkretnim poli

### Tab 2: Firma (Company)
| Pole/Feature | Typ | Priorita |
|-------------|-----|----------|
| Nazev firmy | text input | P0 |
| ICO | text input | P0 |
| DIC | text input | P0 |
| Fakturacni adresa | text input | P0 |
| Mesto | text input | P0 |
| PSC | text input | P0 |
| Zeme | select | P0 |
| Dorucovaci adresa (stejna/jina) | toggle + pole | P1 |
| Logo firmy | upload | P2 |
| **Save button** | button | P0 |

**Stavy:**
- Prazdny stav: "Vyplnte firemni udaje pro fakturaci" s ikonou Building
- Vyplneny: zobrazeni s moznosti editace
- Saving/Success/Error: stejne jako Profil

### Tab 3: Zabezpeceni (Security)
| Pole/Feature | Typ | Priorita |
|-------------|-----|----------|
| Zmena hesla (3 pole + strength meter) | form | P0 |
| 2FA setup (TOTP) | krokovy wizard | P1 |
| Aktivni sessions (tabulka) | read-only tabulka | P1 |
| "Odhlasit vsechna zarizeni" | danger button | P1 |
| Login historie | timeline/tabulka | P2 |
| Recovery kody (pro 2FA) | generovani + download | P1 |

**Stavy:**
- Password change: validace sily hesla v realnem case
- 2FA: 3-krokovy flow (QR → kod → recovery)
- Sessions: loading state pro nacitani, empty state pokud jen 1 session
- Odhlaseni: confirm dialog pred provedenim

### Tab 4: Predplatne (Billing/Subscription)
| Pole/Feature | Typ | Priorita |
|-------------|-----|----------|
| Aktualni tarif (nazev + cena) | zobrazeni | P0 |
| Zmena tarifu | modal se srovnanim | P0 |
| Platebni metoda (posledni 4 cislice) | zobrazeni + edit | P1 |
| Historie faktur (tabulka) | tabulka s PDF download | P1 |
| Zruseni predplatneho | danger button + confirm | P1 |
| Usage metriky | progress bary | P2 |

**Stavy:**
- Free plan: "Upgradujte na Professional" CTA prominentne
- Active plan: nazev, cena, datum obnovy
- Failed payment: cerveny banner "Aktualizujte platebni metodu"
- Cancellation: confirm dialog s vysvetlenim co se stane

---

## 6. Co je kriticke pro BETA vs co muze pockat

### P0 — BETA launch (den 1)
- [x] Tab Profil: jmeno, email, heslo (ze skutecnych auth dat)
- [x] Tab Firma: zakladni firemni udaje
- [x] Tab Zabezpeceni: zmena hesla + strength meter
- [x] Tab Predplatne: zobrazeni aktualniho planu
- [x] Vsechny 4 taby navigovatelne
- [x] Save/Cancel funguje s real daty (ne mock)

### P1 — BETA faze (do 30 dni)
- [ ] 2FA setup (TOTP)
- [ ] Aktivni sessions + odhlaseni
- [ ] Platebni metody + faktury
- [ ] Dorucovaci adresy
- [ ] Notifikacni preference

### P2 — Post-BETA
- [ ] Avatar/logo upload
- [ ] Login historie
- [ ] Usage dashboardy
- [ ] API tokeny
- [ ] Audit log
- [ ] SAML SSO / SCIM

---

## 7. Srovnani s nasim aktualni stavem

### Co uz mame (Account page — 1036 radku)
- 4 taby: Profile, Company, Security, Billing — **SPRAVNE**
- Forge inline styles — **SPRAVNE**
- Mock data — **NUTNE NAHRADIT** real auth daty
- `alert()` pro zpetnou vazbu — **NUTNE NAHRADIT** toast/snackbar
- Password strength meter — **EXISTUJE**, jen prepojit
- Billingova sekce — **MOCK**, nema napojeni na Stripe/platbu
- Zadna skutecna validace — **PRIDAT** inline validaci

### Co chybi
- Napojeni na AuthContext (real user data)
- API calls pro save/update (backend endpointy)
- 2FA setup flow
- Session management
- Platebni integrace (Stripe/paddle)
- Inline validace (ne alert)
- Toast/snackbar system
- Loading/error states na taby

---

## 8. Doporuceni pro implementaci

1. **Zachovat 4-tabovou strukturu** — odpovida industry standardu
2. **Nahradit mock data** real auth user daty z AuthProvider
3. **Pridat inline validaci** na vsechna pole (zvalidovat pred save)
4. **Implementovat toast system** misto `alert()` (forge-styled)
5. **Backend endpointy** pro CRUD profilu a firemních udaju
6. **Password change** prepojit na auth provider (Firebase → agnosticky)
7. **Billing** — pro BETA staci zobrazeni planu, real platby az post-BETA
8. **2FA** — implementovat jako P1 (ne blokujici pro launch)
9. **Session management** — P1, zavisi na auth provider capabilities

---

*Dokument vytvoren: 2026-02-20*
*Zdroje: Web research (Stripe, Vercel, Shopify, Netlify, DigitalOcean, Cloudflare, Linear, Notion, Figma, Xometry, Hubs, Craftcloud, Shapeways, i.materialise, Sculpteo)*
