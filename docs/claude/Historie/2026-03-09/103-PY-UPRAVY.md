# 103-PY — UPRAVY: Payment Methods + Checkout Integrace

> **Datum:** 2026-03-09
> **Session:** S01
> **Oblast:** PY (Admin-Payments + Checkout Flow)
> **Souvisejici ID:** 102-PY

---

## Nove soubory

### 1. `src/utils/adminPaymentStorage.js`
- **Radky:** 175
- **Namespace:** `payment:v1`
- **Exporty:** `getDefaultPaymentConfig`, `normalizePaymentConfig`, `getPaymentConfig`, `savePaymentConfig`, `getBankTransferConfig`, `getEnabledPaymentMethods`, `getNextVariableSymbol`
- **Klicove:** Auto-increment VS counter, max 10 digits, schema_version 1, parseBool/safeNum helpery

### 2. `src/pages/admin/AdminPayments.jsx`
- **Radky:** ~350+
- **Route:** `/admin/payments` (lazy-loaded)
- **Sekce:** Bank Transfer (account details, due days, VS config), Card Payment (Stripe toggle)
- **UX:** Dirty tracking (JSON snapshot), save banner, loading/saving states, CS/EN lokalizace
- **Import:** `getPaymentConfig`, `savePaymentConfig` z adminPaymentStorage

### 3. `docs/claude/Research/bank-transfer-payment-research.md`
- Cesky VS standard (max 10 cislic, CNB pravidla)
- E-shop vzory (Shoptet, WooCommerce CZ, PrestaShop)
- Doporuceni pro ModelPricer

---

## Zmenene soubory

### 4. `src/Routes.jsx` (+2 radky)
- **Radek ~38:** `const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments'));`
- **Radek ~104:** `<Route path="payments" element={<Suspense ...><AdminPayments /></Suspense>} />`

### 5. `src/pages/admin/AdminLayout.jsx` (+1 radek)
- **Radek ~31:** Pridana polozka `{ path: '/admin/payments', label: 'Payments', icon: 'CreditCard' }` do OPERATIONS skupiny

### 6. `src/pages/test-kalkulacka/components/CheckoutForm.jsx` (+225 radku)
- **Import:** `getEnabledPaymentMethods`, `getBankTransferConfig`, `getNextVariableSymbol`, `getPaymentConfig`
- **pmStyles:** Novy style objekt pro payment method radio options
- **getPaymentMethodMeta():** Vraci icon/label/description pro bank_transfer a card
- **Nove state/hooks:** `enabledMethods` (useMemo), `bankTransferConfig` (useMemo), `defaultMethod` (useMemo), `selectedPaymentMethod` (watch), useEffect pro single-method enforcement
- **Form default:** `payment_method: defaultMethod`
- **onSubmit:** Generuje `paymentInfo` objekt — bank_transfer (VS, bank account, due date, instructions, status) nebo card (status: pending)
- **Order objekt:** Nove pole `payment_method` a `payment_info`
- **JSX:** Payment Method Selection karta s radio group, ARIA radiogroup role, error display

### 7. `src/pages/test-kalkulacka/components/OrderConfirmation.jsx` (+398 radku)
- **formatDate():** Nova helper funkce (Intl.DateTimeFormat, cs-CZ/en-GB)
- **paymentCardStyles:** Rozsahly style objekt pro bank transfer platebni kartu (wrapper, header, grid, VS box, copy btn, amount box, instructions, warning, QR placeholder)
- **cardPaymentStyles:** Style pro card payment placeholder
- **CopyButton:** Komponenta s clipboard API + fallback (execCommand), copied state s timeout
- **BankTransferPaymentCard:** Komponenta — amber border, prominent VS s copy, castka, bank details grid (account, IBAN, SWIFT, banka), splatnost, custom instructions, QR placeholder, warning text
- **CardPaymentCard:** Stub komponenta s ikonou a textem
- **OrderConfirmation:** Pridano `paymentMethod`/`paymentInfo` z order, podminene renderovani BankTransferPaymentCard/CardPaymentCard PRED order summary

### 8. `src/pages/test-kalkulacka/schemas/checkoutSchema.js` (+2 radky)
- **Radek ~64:** `payment_method: z.enum(['bank_transfer', 'card']).default('bank_transfer')`

---

## Zavislosti a importy

- **Nove zavislosti:** zadne (vsechno existujici: react-hook-form, zod, lucide-react icons, adminTenantStorage)
- **Nove importy v CheckoutForm:** 4 funkce z `adminPaymentStorage.js`
- **Nove importy v OrderConfirmation:** `useState`, `useCallback` z React

---

## Rizika

| # | Riziko | Severity | Popis |
|---|--------|----------|-------|
| 1 | Build neoveren | P1 | `npm run build` nebylo spusteno — mozne import chyby |
| 2 | VS race condition | P2 | getNextVariableSymbol cte+inkrementuje+uklada — v localStorage je OK (single-tab), ale v Supabase dual-write modu by mohl byt race |
| 3 | Widget sync | P2 | Widget-kalkulacka NEMA checkout → netreba portovat, ale pokud se prida, bude treba payment methods taky |
| 4 | AdminPayments neotestovano | P1 | Admin stranka funguje ale nebyla otestovana v prohlizeci |
