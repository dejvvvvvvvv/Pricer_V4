# Seznam chyb k vyreseni

> Posledni aktualizace: 2026-02-09

---

## Uzivatelske chyby (nahlasene)

### B01 — Objednavky v adminu neukazuji cenu
- **Kde:** `/admin/orders` — seznam objednavek
- **Popis:** Po vytvoreni objednavky pres kalkulacku (`/test-kalkulacka`) se objednavka objevi v admin panelu, ale cena je vzdy 0 Kc. Chybi take hmotnost a cas tisku. Spravne se ukazuje pouze pocet modelu.
- **Zavaznost:** P1 — zakladni funkcionalita admin panelu
- **Mozna pricina:** `totals_snapshot` se pri vytvareni objednavky neuklada s vypoctenymi cenami, nebo se cte spatny klic

### B02 — Detail objednavky hodi 404
- **Kde:** `/admin/orders` → tlacitko "Open" u objednavky
- **Popis:** Kliknuti na "Open" presmeruje na URL ktera neexistuje (404). Nelze se dostat k detailu objednavky.
- **Zavaznost:** P1 — nelze spravovat objednavky
- **Mozna pricina:** Chybejici route v `Routes.jsx` pro detail objednavky, nebo spatny format URL

### B03 — Nelze menit stav objednavky
- **Kde:** `/admin/orders`
- **Popis:** V seznamu objednavek chybi moznost zmenit status (NEW → PRINTING → COMPLETED atd.). Dropdown nebo tlacitka pro zmenu stavu nefunguji nebo nejsou pritomna.
- **Zavaznost:** P1 — zakladni workflow spravy objednavek

### B04 — Chybejici doprava a expresni dodani v kalkulacce
- **Kde:** `/test-kalkulacka` — checkout flow (krok dokonceni objednavky)
- **Popis:** Pri dokoncovani objednavky se nezobrazuje vyber dopravy (shipping methods) ani moznost expresniho dodani. Uzivatel nema jak zvolit zpusob doruceni.
- **Zavaznost:** P1 — checkout flow je neuplny
- **Mozna pricina:** Shipping a express komponenty nejsou integrovany do checkout stepu

### B05 — Chybejici pole pro slevovy kupon v kalkulacce
- **Kde:** `/test-kalkulacka` — checkout flow
- **Popis:** V checkout procesu neni zadne pole pro vlozeni slevoveho kuponu/kodu. Kuponovy system existuje v adminu (`/admin/coupons`), ale v kalkulacce ho nelze pouzit.
- **Zavaznost:** P2 — funkcionalita existuje v backendu ale neni propojena s UI

### B06 — Spatny color picker na admin pricing
- **Kde:** `/admin/pricing` — vyber barvy pro material
- **Popis:** Color picker pro barvu materialu se seka, nereaguje plynule a vizualne nevypada dobre. V projektu existuji jine color picker komponenty ktere funguji spravne — je potreba vymenit za jeden z nich.
- **Zavaznost:** P2 — UX problem, neni kriticke ale zhorsuje pouzitelnost

---

## Zname technicke chyby (z code review a security review)

### T01 — Unbounded queryCache v useStorageQuery
- **Kde:** `src/hooks/useStorageQuery.js`
- **Popis:** In-memory cache (`queryCache` Map) nema limit na pocet polozek. Pri dlouhem pouzivani aplikace muze rust bez omezeni.
- **Zavaznost:** P2 — potencialni memory leak pri dlouhych sessions
- **Fix:** Pridat LRU limit (napr. max 50 polozek)

### T02 — Double localStorage write v writeTenantJson
- **Kde:** `src/utils/adminTenantStorage.js`
- **Popis:** `writeTenantJson()` vzdy pise do localStorage (sync backward compat) a pak `storageAdapter.write()` pise znovu do localStorage v dual-write modu. Idempotentni, ale zbytecny duplicitni zapis.
- **Zavaznost:** P3 — nema funkcni dopad, jen zbytecna operace

### T03 — Slaby invite token (Math.random)
- **Kde:** `src/utils/adminTeamAccessStorage.js`
- **Popis:** `randomToken()` pouziva `Math.random()` ktery neni kryptograficky bezpecny. Invite tokeny jsou predikovatelne.
- **Zavaznost:** P2 — bezpecnostni riziko pro team invitations
- **Fix:** Pouzit `crypto.randomUUID()` nebo `crypto.getRandomValues()`

### T04 — Invite tokeny v audit logu
- **Kde:** `src/utils/adminTeamAccessStorage.js` — `resendInvite()`
- **Popis:** Pri resend invite se do audit logu uklada plna hodnota stareho i noveho tokenu v diff poli. Kdokoliv s pristupem k audit logu vidi invite tokeny.
- **Zavaznost:** P2 — information disclosure
- **Fix:** Logovat jen zkraceny prefix tokenu (napr. prvni 4 znaky)

### T05 — Analytics localStorage hardcoded prefix
- **Kde:** `src/utils/adminAnalyticsStorage.js`
- **Popis:** `STORAGE_PREFIX` je hardcoded na `modelpricer:demo-tenant:analytics`. Vsechny tenanty sdili stejny localStorage klic pro analytics.
- **Zavaznost:** P2 — multi-tenant data izolace
- **Fix:** Pouzit `getTenantId()` pro dynamicky klic

### T06 — Feature flags ovladane z browseru
- **Kde:** `src/lib/supabase/featureFlags.js`
- **Popis:** Storage mode flags (localStorage/supabase/dual-write) jsou ulozene v localStorage a uzivatel je muze zmenit pres DevTools. Muze obejit Supabase a pracovat jen s localStorage.
- **Zavaznost:** P2 — bezpecnostni riziko pro produkcni prostredi
- **Fix:** V produkci nacitat flags ze serveru, ne z localStorage

---

## Bezpecnostni chyby (pro Phase 5 — Supabase Auth)

### S01 — RLS policies jsou uplne otevrene
- **Kde:** `supabase/schema.sql` — vsech 24 tabulek
- **Popis:** Vsechny RLS policies pouzivaji `USING(true)` — kdokoliv s anon klicem muze cist/psat/mazat data jakehokoliv tenanta.
- **Zavaznost:** P0 pro produkci, akceptovatelne pro demo/dev
- **Fix:** Implementovat Supabase Auth + JWT-based RLS v Phase 5

### S02 — Storage bucket policies otevrene
- **Kde:** `supabase/storage-policies.sql` — vsechny 3 buckety
- **Popis:** Vsechny storage buckety (models, documents, branding) maji plne otevrene policies. Kdokoliv muze uploadovat/mazat soubory.
- **Zavaznost:** P0 pro produkci, akceptovatelne pro demo/dev
- **Fix:** Scopovat policies na tenant cesty v Phase 5

### S03 — Tenants tabulka umoznuje anonymni INSERT/UPDATE
- **Kde:** `supabase/schema.sql` — tabulka `tenants`
- **Popis:** Kdokoliv muze vytvorit noveho tenanta nebo zmenit existujiciho (vcetne plan_features).
- **Zavaznost:** P0 pro produkci
- **Fix:** Omezit na server-side only (service_role) v Phase 5

### S04 — Tenant ID z localStorage je ovladany utocnikem
- **Kde:** `src/utils/adminTenantStorage.js` — `getTenantId()`
- **Popis:** Tenant ID se cte z localStorage. Utocnik ho muze zmenit na jiny tenant a cist/psat cizi data (v kombinaci s otevrenymi RLS).
- **Zavaznost:** P1 pro produkci
- **Fix:** Derivovat tenant_id z JWT claims pres Supabase Auth

### S05 — supabaseUpdate/Delete bez tenant_id filtru
- **Kde:** `src/lib/supabase/storageAdapter.js`
- **Popis:** `supabaseUpdate()` a `supabaseDelete()` filtruji jen podle `id`, ne podle `tenant_id`. Defense-in-depth problem.
- **Zavaznost:** P1
- **Fix:** Pridat `tenant_id` jako povinny parametr a filtrovat v query

---

## Legenda

| Zavaznost | Popis |
|-----------|-------|
| **P0** | Kriticke — blokuje produkci nebo zpusobuje ztrace dat |
| **P1** | Vysoke — zakladni funkcionalita nefunguje |
| **P2** | Stredni — funguje ale spatne, UX problem nebo bezpecnostni riziko |
| **P3** | Nizke — kosmeticke nebo optimalizacni |
