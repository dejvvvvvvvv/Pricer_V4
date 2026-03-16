# Beta Readiness Audit — ModelPricer V3

**Datum:** 2026-03-16
**Stav:** Nezahajeno — referencni dokument pro beta pripravu

---

## CO FUNGUJE (production-ready)

- [x] **Pricing Engine** — deterministicky, pure JS, plne funkcni
- [x] **Kalkulacka** — end-to-end flow (upload → slicing → cena → checkout) funguje s backendem
- [x] **Widget** — funkcni, spravne tenant-scoped
- [x] **PrusaSlicer integrace** — realne slicing pres child_process, cache, error classifier, queue
- [x] **Auth** — Firebase i Supabase provider implementovany, dual-auth middleware na backendu
- [x] **Backend Express** — security headers, rate limiting, CORS, tenant isolation, graceful shutdown
- [x] **Admin panel** — 15+ stranek s CRUD operacemi
- [x] **Firestore rules** — tenant-scoped, production-grade
- [x] **Supabase schema** — 25 tabulek, 102 RLS politik pripraveno
- [x] **PWA** — manifest, service worker, install banner
- [x] **25 unit testu** — pricing, storage, hooks, komponenty

---

## P0 BLOKERY (musi se opravit pred betou)

### 1. Backend nema deployment
- [ ] Express server bezi jen lokalne
- [ ] PrusaSlicer je Windows `.exe` — nelze nasadit na Linux cloud
- [ ] Zadna strategie pro hosting backendu
- **Reseni:** Windows VPS (Hetzner/OVH ~15 EUR/mesic) + PM2 + nginx + Let's Encrypt

### 2. Veskerá data v localStorage
- [ ] Objednavky, ceny, konfigurace — vse v prohlizeci
- [ ] Supabase je pripojeny ale feature flags defaultuji na `localStorage`
- [ ] Data se ztrati pri vymazani cache
- **Reseni:** Prepnout Supabase feature flags z `localStorage` na `dual-write` → `supabase`
- **Klicovy soubor:** `src/lib/supabase/featureFlags.js` (radek 91)

### 3. Email nefunguje
- [ ] `emailProvider.js` je 100% mock — `console.log("Would send...")` + `return { success: true }`
- [ ] Admin UI ukazuje "odeslano" ale nic se neposle
- [ ] Zadny nodemailer, @resend/node, @sendgrid/mail v package.json
- **Reseni:** Implementovat nodemailer + SMTP (~2h prace)
- **Klicovy soubor:** `backend-local/src/email/emailProvider.js`

### 4. Auth provider mismatch
- [ ] `.env.local` nastavuje `VITE_AUTH_PROVIDER=supabase`
- [ ] Supabase provider nema Google login (throws error "Google login bude dostupny pozdeji")
- **Reseni:** Bud prepnout na `firebase` nebo implementovat Google OAuth v SupabaseAuthProvider
- **Klicovy soubor:** `src/providers/SupabaseAuthProvider.jsx` (radek 111)

### 5. Stripe platby neexistuji
- [ ] UI ma volbu "kartou" ale zero Stripe SDK v kodu
- [ ] Zadny `loadStripe`, zadny PaymentIntent, zadny `@stripe/stripe-js` v dependencies
- **Reseni:** Bud implementovat Stripe nebo odstranit card option z UI pro betu
- **Klicove soubory:** `src/pages/test-kalkulacka/components/CheckoutForm.jsx`, `src/utils/adminPaymentStorage.js`

### 6. Soubory jen na lokalnim disku
- [ ] Nahrane 3D modely jdou na `C:\modelpricer\tmp`
- [ ] Zadne S3/Firebase Storage/Supabase Storage integrace
- **Reseni:** Pro Windows VPS staci persistent disk; pro cloud bude treba S3/Supabase Storage
- **Klicovy soubor:** `backend-local/src/storage/storageService.js`

### 7. `.env.example` bug
- [ ] Backend kod hleda `SUPABASE_SERVICE_ROLE_KEY` ale `.env.example` ma `SUPABASE_JWT_SECRET`
- [ ] Novy setup auth nespusti — silent fallback
- **Reseni:** Sjednotit nazvy promennych
- **Klicove soubory:** `backend-local/.env.example`, `backend-local/src/middleware/auth.js` (radek 6)

---

## P1 (melo by se opravit)

### 8. Zadne CI/CD
- [ ] Zero GitHub Actions
- [ ] Build se neverifikuje automaticky
- **Reseni:** Pridat `.github/workflows/ci.yml` — `npm run build` + `npm test` on push

### 9. Admin role enforcement je client-side only
- [ ] Kazdy prihlaseny uzivatel vidi admin panel
- [ ] Dokumentovano jako TODO v `AdminLayout.jsx:3` a `AdminTeamAccess.jsx:12`
- **Reseni:** Backend middleware pro role-based access

### 10. Zadny monitoring
- [ ] No Sentry, no structured logging
- **Reseni:** Pridat @sentry/react + @sentry/node (~30 min)

### 11. Firebase Hosting nema security headers
- [ ] Chybi `hosting.headers` v `firebase.json`
- **Reseni:** Pridat X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS

### 12. JSON file "databaze" na backendu
- [ ] Zadna concurrent write ochrana
- [ ] Zadne query — pagination je in-memory po full file load
- **Reseni:** Migrace na Supabase tabulky (schema uz existuje)

### 13. E2E testy neexistuji
- [ ] Zadny Playwright/Cypress
- **Reseni:** Zakladni E2E pro hlavni flow (upload → slice → checkout)

### 14. Reprice/Reslice v admin je mock
- [ ] `Math.random()` faktor s komentarem "DEMO: mock data only"
- **Klicovy soubor:** `AdminOrders.jsx` (radky 1497, 1548, 1887, 1927)

### 15. Model Upload stranka — simulovany progress
- [ ] `simulateUpload` funkce s `setInterval` fake progress
- [ ] Zadny backend call
- **Klicovy soubor:** `src/pages/model-upload/index.jsx` (radek 383)

---

## DOPORUCENY POSTUP (4 faze)

### Faze 1 — Infrastruktura (nejkritictejsi)
1. [ ] Windows VPS (Hetzner/OVH, ~15 EUR/mesic) pro backend + PrusaSlicer
2. [ ] PM2 + nginx s Let's Encrypt SSL pred Express
3. [ ] Firebase Hosting deploy pro frontend (`firebase deploy`)
4. [ ] Pridat security headers do `firebase.json`

### Faze 2 — Data persistence
5. [ ] Prepnout Supabase feature flags na `dual-write` → `supabase`
6. [ ] Opravit auth provider (bud Firebase s Google, nebo dodelat Google v Supabase)
7. [ ] Opravit `.env.example` mismatch

### Faze 3 — Komunikace
8. [ ] Implementovat email (nodemailer + SMTP)
9. [ ] Rozhodnout se o Stripe (pokud beta = placena) nebo odstranit card option z UI

### Faze 4 — Quality
10. [ ] GitHub Actions: build + test on push
11. [ ] Sentry integrace
12. [ ] Zakladni E2E test pro hlavni flow

---

## DETAILNI NALEZE Z AUDITU

### Backend — co je MOCK/SIMULATED
| Soubor | Co je mock |
|--------|-----------|
| `backend-local/src/email/emailProvider.js` | Vsechny email providery (SMTP, Resend) — console.log + fake success |
| `backend-local/src/routes/invoices.js` | JSON invoice, ne realne PDF — pouziva orderId.slice(-6) miste sekvencniho cisla |
| `backend-local/src/services/pdfService.js` | Generuje tisknutelne HTML, ne PDF binary |

### Backend — co CHYBI
- Zadny `nodemailer` v `package.json`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` nejsou v `.env.example`
- `SUPABASE_SERVICE_ROLE_KEY` pouzivane v kodu ale ne v `.env.example`
- Email log je in-memory (ztracen pri restartu)
- Slicer route module (`src/routes/slicer.js`) mozna neni mountovany v `index.js`

### Frontend — co je MOCK/SIMULATED
| Soubor | Co je mock |
|--------|-----------|
| `AdminEmails.jsx:291` | `setTimeout` simulate sending |
| `AdminOrderDetail.jsx:2797` | "Send (simulovano)" — log do localStorage |
| `AdminOrders.jsx:1501,1551` | `simulateReprice/simulateReslice` — Math.random() |
| `model-upload/index.jsx:383` | `simulateUpload` — fake progress |
| `order-tracking/index.jsx:9` | "simulated — production would use API" |
| `slicer/mockData.js` | Cela slicer stranka je mock data |
| `AdminIntegrations.jsx:10` | WooCommerce, Stripe, PayPal — "placeholder" |

### Infrastruktura — co CHYBI
- Zadny Dockerfile / docker-compose
- Zadne GitHub Actions / CI pipeline
- Zadna custom domena / DNS
- Firebase Hosting `hosting.headers` pro security
- `VITE_APP_URL` neni v `.env.example` (pouziva se v SupabaseAuthProvider)
- Service worker cache name `modelpricer-v1` hardcoded — nebude invalidovat pri deploy

### Deployment doporuceni
- **Nejrychlejsi:** Windows VPS + PM2 + nginx (~15 EUR/mesic, nasaditelne za 1 den)
- **Spravna cesta:** Linux VPS + Docker (Ubuntu + PrusaSlicer AppImage + Node.js, 1-2 tydny prace)

---

## REFERENCE
- Backend audit: mp-sr-backend agent (2026-03-16)
- Frontend audit: mp-sr-frontend agent (2026-03-16)
- Infra audit: mp-sr-infra agent (2026-03-16)
