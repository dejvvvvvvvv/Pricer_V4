# 102-PY — KONVERZACE: Payment Methods + Checkout Integrace

> **Datum:** 2026-03-09
> **Session:** S01
> **Oblast:** PY (Admin-Payments + Checkout Flow)
> **Souvisejici ID:** 101-AO (Admin Orders), zadne dalsi

---

## Kontext

Uzivatel chtel implementovat platebni metody (bank transfer + card payment) a propojit je s checkout flow v test-kalkulacce. Cil: admin si v novem panelu `/admin/payments` nastavi bankovni ucet a platebni podminka, a kdyz zakaznik v kalkulacce dokoncuje objednavku, vybere si zpusob platby a v potvrzeni objednavky uvidi platebni udaje.

---

## Uzivateluv pozadavek (plny text)

1. Vytvorit admin stranku `/admin/payments` — nastaveni platby na ucet (cislo uctu, IBAN, SWIFT, banka, splatnost, variabilni symbol) a prepinac pro kartovou platbu (Stripe stub)
2. Vytvorit tenant-scoped storage `adminPaymentStorage.js` (namespace `payment:v1`)
3. Propojit payment methods s CheckoutForm — radio vyber zpusobu platby
4. Propojit s OrderConfirmation — zobrazit platebni udaje (bank transfer karta s VS, castkou, uctem, splatnosti, QR placeholder)
5. Research ceske bankovni standardy pro variabilni symbol (max 10 cislic, CNB pravidla)

---

## Klicova rozhodnuti

1. **Variabilni symbol:** Dva rezimy — `auto` (sekvencni s prefixem, auto-increment) nebo `order_number` (pouzije cisla z cisla objednavky)
2. **Default method:** Bank transfer je enabled by default, card payment disabled by default
3. **Fallback:** Pokud zadna metoda neni povolena, fallback na bank_transfer
4. **VS max 10 cislic:** Cesky bankovni standard (CNB), orizne se zprava pokud prefix+cislo > 10
5. **Platebni karta stranka:** Na OrderConfirmation se zobrazi BankTransferPaymentCard s warning barvou (amber border) + prominent VS + copy-to-clipboard + QR placeholder
6. **Admin navigace:** Payments polozka pridana do OPERATIONS skupiny v AdminLayout (ikona CreditCard)

---

## Co Claude implementoval

### Nove soubory (2)
- `src/utils/adminPaymentStorage.js` — storage helper (namespace payment:v1, normalize, get/save, VS auto-increment)
- `src/pages/admin/AdminPayments.jsx` — admin stranka (bank transfer sekce, card payment sekce, dirty tracking, save)

### Zmenene soubory (5)
- `src/Routes.jsx` — pridana lazy-loaded route `/admin/payments`
- `src/pages/admin/AdminLayout.jsx` — pridana polozka Payments do nav (OPERATIONS skupina)
- `src/pages/test-kalkulacka/components/CheckoutForm.jsx` — payment method radio vyber, payment_info generovani pri submit
- `src/pages/test-kalkulacka/components/OrderConfirmation.jsx` — BankTransferPaymentCard, CardPaymentCard, CopyButton komponenty
- `src/pages/test-kalkulacka/schemas/checkoutSchema.js` — pridano `payment_method` pole (z.enum)

### Research (1)
- `docs/claude/Research/bank-transfer-payment-research.md` — ceske bankovni standardy, VS formaty, e-shop vzory

---

## Architektura reseni

```
AdminPayments (/admin/payments)
  └─ adminPaymentStorage.js (payment:v1)
       ├─ getPaymentConfig() / savePaymentConfig()
       ├─ getBankTransferConfig()
       ├─ getEnabledPaymentMethods()
       └─ getNextVariableSymbol() (auto-increment + persist)

CheckoutForm (test-kalkulacka)
  ├─ Nacte enabled methods pres getEnabledPaymentMethods()
  ├─ Radio group pro vyber platby (bank_transfer / card)
  ├─ Pri submit: generuje payment_info objekt
  │   └─ bank_transfer: VS (auto/order_number), bank account, due_date, instructions
  └─ Uklada do order objektu (payment_method + payment_info)

OrderConfirmation
  ├─ BankTransferPaymentCard — amber border, VS prominent, copy btn, bank details grid, QR placeholder
  └─ CardPaymentCard — stub s potvrzovaci zpravou
```

---

## Status

- **Implementace:** HOTOVA (vsechny soubory zmeneny/vytvoreny)
- **Build:** NEOVERENO (uzivatel zatim nespustil `npm run build`)
- **Smoke test:** NEOVERENO
- **Dokumentace:** Tato historie + research soubor
