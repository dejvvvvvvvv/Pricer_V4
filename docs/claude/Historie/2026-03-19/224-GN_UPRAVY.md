# 224-GN — UPRAVY — General (Vlna 8) — 2026-03-19

## Metadata
- **ID:** 224-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General (Admin System Health + Backend Email)
- **Souvisejici ID:** 223-GN (Vlna 7 Health Check), 219-GN (Sentry), 222-GN (Vlna 6 Stripe + AdminPayments)
- **Trigger:** Vlna 8 BETA infrastruktura — rozsireni System Health UI o service karty + email notifikace pri zmene statusu objednavky

---

## Souhrn uprav

Vlna 8 implementuje dve vylepseni: (1) Admin System Health stranka rozsirena o sekci "Stav sluzeb" s 5 service kartami (Storage, DB, Email, Payments, Monitoring) vcetne color-coded badges a auto-refreshe, (2) novy backend emailNotificationService ktery automaticky odesila email notifikace zakaznikum pri zmene statusu objednavky (fire-and-forget pattern).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminSystemHealth.jsx | Zmeneno | rozsireni | Nova sekce "Stav sluzeb" — 5 service karet s color-coded badges, auto-refresh 30s |
| 2 | src/contexts/LanguageContext.jsx | Zmeneno | i18n sekce | 12 novych i18n klicu (admin.system.svc*) pro service karty |
| 3 | backend-local/src/services/emailNotificationService.js | Novy soubor | cely soubor | onOrderStatusChange(), status-to-template mapping, tenant config, PII masking |
| 4 | backend-local/src/routes/orders.js | Zmeneno | PATCH handler | Integrace emailNotificationService do PATCH /:id/status, fire-and-forget |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminSystemHealth.jsx`

**Typ:** Zmeneno
**Radky:** rozsireni existujicich sekci
**Duvod:** Vizualizace stavu externich sluzeb primo v admin panelu

**Co se zmenilo:**
- Pridana nova sekce "Stav sluzeb" pod existujici system health informace
- 5 service karet: Storage (R2), Database (Supabase), Email (Resend), Payments (Stripe), Monitoring (Sentry)
- Kazda karta ma color-coded badge (zelena=OK, zluta=degraded, cervena=down, seda=unknown)
- Auto-refresh kazdych 30 sekund (konzistentni s existujicim health checkem)
- Karty pouzivaji Forge design system (forge-card, forge-badge)

---

### 2. `src/contexts/LanguageContext.jsx`

**Typ:** Zmeneno
**Radky:** i18n sekce
**Duvod:** Ceske a anglicke preklady pro nove service karty

**Co se zmenilo:**
- 12 novych i18n klicu s prefixem admin.system.svc
- Klice pro nazvy sluzeb (storage, database, email, payments, monitoring)
- Klice pro statusy (ok, degraded, down, unknown)
- Klice pro nadpis sekce a popis

---

### 3. `backend-local/src/services/emailNotificationService.js`

**Typ:** Novy soubor
**Radky:** cely soubor
**Duvod:** Automaticke email notifikace zakaznikum pri zmene statusu objednavky

**Co se zmenilo:**
- Funkce onOrderStatusChange(orderId, newStatus, orderData, tenantId)
- Status-to-template mapping: confirmed -> order-confirmed, printing -> printing-started, shipped -> order-shipped, completed -> order-completed
- Nacitani tenant konfigurace (email sender, nazev firmy)
- PII masking v logovani (email adresy maskovany)
- Fire-and-forget pattern — nechyta vyjimky do hlavniho flow, loguje chyby samostatne
- Graceful degradace — pokud emailProvider neni dostupny, pouze loguje

---

### 4. `backend-local/src/routes/orders.js`

**Typ:** Zmeneno
**Radky:** PATCH /:id/status handler
**Duvod:** Napojeni email notifikaci na zmenu statusu

**Co se zmenilo:**
- Import emailNotificationService
- Po uspesne zmene statusu objednavky se vola onOrderStatusChange()
- Fire-and-forget pattern: .then() pro log uspechu, .catch() pro log chyby
- Zpetne kompatibilni — pokud email service selze, status se stejne zmeni
- Zadna zmena v response — zakaznik dostane odpoved ihned, email se odesle na pozadi

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminSystemHealth (nova sekce), orders API (email trigger)
- **Breaking changes:** Ne — obe zmeny jsou additivni
- **Nove zavislosti:** Zadne nove npm balicky (vyuziva existujici emailProvider z Vlny 3)
- **Rizika:** Email notifikace zavisi na nainstalovanem Resend balicku (pending npm install)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Build verifikace, vizualni kontrola admin health page
- **Poznamky:** Email notifikace vyzaduji funkcni Resend provider (ceka na npm install + RESEND_API_KEY v .env)

---
