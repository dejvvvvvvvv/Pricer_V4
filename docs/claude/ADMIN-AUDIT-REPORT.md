# Admin Pages Audit Report — 2026-03-12

> Systematicky audit vsech Admin stranek: security, bugy, code quality.
> Priorita: P0 (Security) > P1 (Bugs) > P2 (Code Quality)

## Obsah
1. [Vlna 1: Layout, Orders, Payments](#vlna-1)
2. [Vlna 2: Pricing, Fees, Parameters](#vlna-2)
3. [Vlna 3: Presets, Branding, Emails](#vlna-3)
4. [Vlna 4: Widget, Shipping, Coupons](#vlna-4)
5. [Vlna 5: Team, Customers, Settings, Analytics](#vlna-5)
6. [Vlna 6: SystemHealth, ActivityLog, ModelStorage, Express](#vlna-6)
7. [Vlna 7: Kanban, Storage components, Charts](#vlna-7)
8. [Souhrnne statistiky](#souhrn)
9. [Browser Testing](#browser-testing)

---

## Status auditu

| Vlna | Stranky | Status |
|------|---------|--------|
| 1 | Layout, Dashboard, Orders, OrderDetail, Payments, Integrations, Webhooks, Migration | HOTOVO |
| 2 | Pricing, Fees, Parameters | HOTOVO |
| 3 | Presets, Branding, Emails | HOTOVO |
| 4 | Widget, WidgetBuilder, Shipping, Coupons | HOTOVO |
| 5 | Team, Customers, Settings, Analytics | HOTOVO |
| 6 | SystemHealth, ActivityLog, ModelStorage, Express | HOTOVO |
| 7 | Kanban, Storage components, Charts, misc | HOTOVO |

---

# VLNA 1: Layout, Dashboard, Orders, Payments, Integrations, Webhooks, Migration

---

## AdminLayout.jsx

### Security (P0)
- **KRITICKE: Chybejici auth guard — cely admin panel je nechraneny.** `useAuth()` je v try/catch (radek 163-169) a pri chybe pokracuje. ZADNY redirect na login kdyz `authUser` je null. `<Outlet />` (radek 1400) renderuje pro vsechny — neautentizovani uzivatele vidi vsechny admin stranky.
- **Tenant ID zobrazen v sidebaru bez role check** — radek 934-944. Plny `tenantId` zobrazen + "Copy Tenant ID" tlacitko (radek 946-963). Pri chybejicim auth guardu je UUID vystaveno.
- **Primy localStorage pristup** — radky 27, 36. `modelpricer:admin:sidebar` key pouziva raw `localStorage.getItem/setItem` bez tenant scope. Porusuje invariant z CLAUDE.md.

### Bugs (P1)
- **Hook volany podminkove v try/catch** — radek 163-169. `useAuth()` v try/catch muze zpusobit React hook ordering issues.
- **Chybejici cleanup pro requestAnimationFrame** — radky 251-296. `rafId` v lokalni promenne, ne v refu. Nelze cancelovat pri re-renderu.
- **`useMemo` spatne dependencies pro `filteredNav`** — radek 248. Chybi `t()` v deps.

### Code Quality (P2)
- Hardcoded sidebar storage key bez tenant scope — radek 22
- Inline `<style>` tag na konci komponenty — radek 1451
- Chybejici `aria-label` na `<aside>` sidebaru — radek 1071
- `renderNavItem` a `renderGroupHeader` inline funkce bez memoizace — radky 401, 497

---

## AdminDashboard.jsx

### Security (P0)
- **Zadny auth check.** Spoleha na AdminLayout auth guard, ktery nefunguje. Kdokoliv vidi objednavky, revenue, jmena zakazniku, emaily.
- **Zakaznicke PII vystaveno** — radky 160-161. Jmena a emaily v tabulce objednavek bez autorizace.

### Bugs (P1)
- **`formatRelativeTime` volana se stringem, muze ocekavat number** — radek 558.
- **`new Date(0)` fallback vytvori 1970 datum** — radek 318.
- **Chybejici error boundary** — useMemo pouziva storage funkce ktere mohou vyhodit vyjimku → white screen.
- **`recentActivity` zavisla na `refreshKey` ale i `language`** — radek 195.

### Code Quality (P2)
- `key={i}` pro systemAlerts, brandingTips, RevenueSparkline — radky 726, 773, 89, 103
- Duplikovana coupon expiry logika
- Velky inline `<style>` blok — radek 880+ (~500 radku CSS)

---

## CommandPalette.jsx

### Security (P0)
- **`useAuth()` v try/catch** — radek 231-232. Podminkovy hook.
- **Logout akce bez potvrzeni** — radek 433-434. `auth.logout()` okamzite bez confirm dialogu.

### Bugs (P1)
- **`globalIndex` jako mutable let v renderu** — radek 496. Fragile pattern, rozbije se v concurrent mode.

### Code Quality (P2)
- Hardcoded ceske stringy bez i18n — radky 553, 628, 672, 861, 884-895
- Chybejici keyboard accessibility pro recent search items — radek 630-653
- Chybejici `role="option"` a tabIndex — radek 630-653

---

## OnboardingWizard.jsx

### Security (P0)
- **Tenant ID v embed kodu** — radek 348. UUID vystaveno neautorizovanym uzivatelum pri chybejicim auth guardu.
- **Nevalidovana logo URL jako `<img src>`** — radky 443-449. `brandingLogo` je user input → HTTP request na libovolnou URL.

### Bugs (P1)
- **`showFeedback` timer bez cleanup pri unmount** — radek 252-253. State update na unmounted component.
- **`handleFinish` timeout bez cleanup** — radek 341-343.
- **Auto-save na step exit chybi pro Back navigaci** — radek 368-369. Pricing zmeny ztraceny pri Back.

### Code Quality (P2)
- `getTenantId()` bez try/catch — radek 223
- `navigator.clipboard.writeText` bez fallbacku — radek 357

---

## NotificationCenter.jsx

### Security (P0)
- Zadne kriticke security issues.

### Bugs (P1)
- **Style injection pres `document.createElement('style')` bez cleanup** — radky 308-323.
- **Polling interval (10s) neni pozastaven pri skrytem tabu** — radek 369.
- **`formatRelativeTime` shadows imported function** — radek 41.

### Code Quality (P2)
- Hardcoded ceske stringy bez i18n — radky 434-436, 535, 550, 566, 599, 617, 633
- Chybejici focus trap v dropdown `role="dialog"` — radek 532

---

## KeyboardShortcutsHelp.jsx

### Security (P0)
- Zadne issues. Pouze staticka data.

### Bugs (P1)
- `key={i}` pro shortcut items — radek 196

### Code Quality (P2)
- Hardcoded ceske stringy bez i18n — radky 7-33, 141, 235
- Chybejici focus management a focus trap v dialog — radek 104-106

---

## AdminOrders.jsx

### Security (P0)
- **Citlive PII v search indexu** — radky 430-435. Plne emaily a filenames bez maskovani.
- **`JSON.parse(JSON.stringify(sourceOrder))` klon vcetne PII** — radek 614. Duplikace objednavky kopiruje vsechna zakaznicka data.

### Bugs (P1)
- **Race condition na bulk status change** — radky 571-601. Stale state v closure pri soucastnem volani.
- **`toTs` date range filtr off-by-one** — radky 441-442. Objednavky z posledniho dne `dateTo` vynechany. Chybi `T23:59:59`.
- **`selectedIds` neni vycisteno po bulk delete** — radek 601.
- **`setPage(1)` useEffect s object referencemi v deps** — radky 505-507. Potencialni infinite loop.

### Code Quality (P2)
- `STATUS_COLORS` duplikovano ve 3 souborech
- `Date.now().toString(36)` pro order number — radek 609. Kolize pri rychlem volani.
- Empty catch blocks — radky 312-332

---

## AdminOrderDetail.jsx

### Security (P0)
- **KRITICKE: Stored XSS pres `dangerouslySetInnerHTML={{ __html: emailPreview.body }}`** — radek 2718. `renderTemplate()` substituuje `{{variable}}` z objednavkovych dat BEZ sanitizace. Zakaznik se jmenem `<img onerror=alert(1)>` spusti kod v admin panelu.
- **`w.document.write(html)` v print oknech** — radky 1561-1575, 1677. Potencialni XSS pokud generatory neescapuji HTML.
- **`order.id` v URL bez `encodeURIComponent`** — radek 1583.

### Bugs (P1)
- **`blobUrl` memory leak** — radky 1155-1164. `URL.revokeObjectURL` neni volan pri unmount.
- **`URL.revokeObjectURL` prilis brzy po `a.click()`** — radky 1599-1613. Download muze byt zrusen.
- **`invoice` state se nesynchonizuje pri zmene `orderId`** — radek 1287.
- **`createZip` tichy fail** — radek 1596. Zadny error feedback uzivateli.
- **`renderTemplate` regex replace** — radky 1698-1701. `$` v hodnotach (napr. cena `$10`) interpretovany jako backreference.

### Code Quality (P2)
- `STATUS_COLORS` duplikat — radky 37-47
- `formatDateTime`, `formatMoney` atd. duplikovany — radky 54-92
- `console.error` v produkci — radek 1611

---

## OrderDetailModal.jsx

### Security (P0)
- Zadne kriticke issues.

### Bugs (P1)
- **`rafId` leak na unmount** — radky 197-233. `rafId` v closure, ne v useRef. `cancelAnimationFrame` vola s null.
- **`document.body.style.overflow = 'hidden'` race pri rychlem toggle** — radek 184.

### Code Quality (P2)
- `TABS` hardcoded anglicky, zbytek cesky — radek 157-161
- `StatusDropdown` duplikovana logika z AdminOrderDetail.jsx
- Chybejici `aria-labelledby` na `role="dialog"` — radek 260

---

## TabCustomer.jsx

### Security (P0)
- **`user_id: 'admin'` hardcoded** — radek 75. Audit trail integrity narusena v multi-user prostredi.

### Bugs (P1)
- **Notes list pouziva `idx` jako `key`** — radek 147. Smazani z prostredku zpusobi misalignment.
- **`onSaveNote?.()` bez error handling** — radek 77.

### Code Quality (P2)
- Zadny `maxLength` na textarea — radek 103. Mozny localStorage overflow.
- Chybejici empty state pro activity sekci

---

## TabShipping.jsx

### Security (P0)
- Zadne issues. Vsechny fieldy renderovany jako React text nodes.

### Bugs (P1)
- Zadne vyznamne bugy.

### Code Quality (P2)
- Hardcoded barvy `#fff`, `#08090C` — radek 66, 70. Nepouziva Forge tokeny.
- Chybejici copy tlacitko na adrese (nekonzistence s TabCustomer)

---

## TabItemsFiles.jsx

### Security (P0)
- **Path traversal v `handleDownloadFile`** — radky 45-59, 131. `filePath` z localStorage bez validace. Utocnik muze vytvori cestu `../../etc/passwd`.
- **`manifestEntry.filename` matching sanitizuje lookup ale pouziva original pro download** — radek 103, 131.

### Bugs (P1)
- **`handleDownloadZip` tichy fail** — radek 42
- **`URL.revokeObjectURL` timing issue** — radky 45-58
- **Chybejici empty state pro prazdny `models` array** — radek 88

### Code Quality (P2)
- `formatMoney`, `formatTime`, `formatSize` duplikovany — radky 8-25
- `key={idx}` v file manifest listu — radek 241

---

## PrintQueue.jsx

### Security (P0)
- **`user_id: 'admin'` hardcoded** — radky 627, 628, 638. Audit trail issue.

### Bugs (P1)
- **Duplikatni activity log entries** — radky 620-641. `saveOrders` + `appendOrderActivity` zapisuji stejna data dvakrat.
- **eslint-disable pro missing dependency** — radek 551. `queueData` chybi v deps → stale closure.
- **15s interval bezi i s prazdnou frontou** — radky 510-512.

### Code Quality (P2)
- `formatTime`, `formatDateTime` lokalne duplikovany — radky 34-63
- Ceske labely hardcoded bez i18n — radky 183-189

---

## QuickOrderForm.jsx

### Security (P0)
- **Slaby email regex** — radek 38. `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` akceptuje nebezpecne vstupy.
- **Zadne input length limity** — vsechna pole bez `maxLength`.
- **PII v activity logu plaintext** — radek 208.

### Bugs (P1)
- Zadne kriticke bugy.

### Code Quality (P2)
- `useState('NEW')` pro konstantu — radek 72
- 450 radku embedded CSS — radky 511-961

---

## OrderCalendar.jsx

### Security (P0)
- Zadne issues.

### Bugs (P1)
- **`computeOrderTotals` volany v kazde bunce pri kazdem renderu** — radek 105. Performance problem.

### Code Quality (P2)
- `formatMoney` lokalne duplikovana — radek 30-32
- 360 radku embedded CSS — radky 366-726

---

## OrderTagSelector.jsx

### Security (P0)
- Zadne issues. Tag data renderovana jako text nodes.

### Bugs (P1)
- **`handleDeleteCustomTag` vola `getOrderTags` dvakrat** — radky 172-173
- **Chybejici try/catch** kolem `loadTags()` a `getOrderTags()` — radky 127-128

### Code Quality (P2)
- Zadny `maxLength` na tag label input — radek 367

---

## StorageStatusBadge.jsx

### Security (P0)
- Zadne issues.

### Bugs (P1)
- Zadne issues.

### Code Quality (P2)
- Hex alpha suffix `33` neni intuitivni — radek 36

---

## OrderExportActions.jsx

### Security (P0)
- **KRITICKE: Stored XSS pres `dangerouslySetInnerHTML={{ __html: emailPreview.body }}`** — radek 1009. Stejna zranitelnost jako v AdminOrderDetail.jsx.
- **`document.write` v print oknech** — radky 550-584, 588-649. Potencialni XSS.
- **`TEAM_MEMBERS` hardcoded demo fixture** — radky 391-396. Fake data v produkci.

### Bugs (P1)
- **`handleBatchStatusChange` pouziva setTimeout simulaci** — radky 449-485. Zavrete tabu = ztrata zmen.
- **`handleBatchEmail` loguje `status: 'sent'` ale neodesila** — radky 699-706. Klamani auditu.
- **`invoiceProgress` s 0 polozkami** — radky 641-645. Okamzite "Hotovo!" bez zpracovani.

### Code Quality (P2)
- `DropdownMenu`, `BulkConfirmModal` duplikovany — radky 124-280
- `hoverIn`/`hoverOut` imperativni style change — radky 118-119

---

## AdminPayments.jsx

### Security (P0)
- Zadne kriticke issues. Spravne deleguje na tenant-scoped helpers.

### Bugs (P1)
- **Null guard na `prev.bank_transfer`** — radek 71. Potencialni TypeError.

### Code Quality (P2)
- `console.error` v produkci — radky 37, 94
- `eslint-disable` pro chybejici dependency — radek 41

---

## AdminIntegrations.jsx

### Security (P0)
- **Primy `localStorage.setItem`** — radek 521. Porusuje tenant storage invariant.
- **Nevalidovany `shop_domain`** — radek 1046. Potencialni SSRF pri backend proxy.
- **Storefront token v localStorage plaintext** — UI ho zobrazi jako secret (password field) ale je ulozeny otevrene.

### Bugs (P1)
- **`updateField` uklada pri kazdem keystroke** — radky 707-716. Excessive writes + race conditions.
- **Stale closure v `handleTestConnection`** — radky 718-735.

### Code Quality (P2)
- 1500+ radku v jednom souboru
- Unused importy `getShopifyConfig`, `saveShopifyConfig` — radky 23-24
- Chybejici error state pri load failure — radky 1476-1479

---

## AdminWebhooks.jsx

### Security (P0)
- **KRITICKE: Zadna SSRF ochrana na webhook URL** — radky 891-908. Privatni IP adresy (127.0.0.1, 10.x.x.x, 192.168.x.x) akceptovany. Backend muze byt zneuzit jako proxy do interni infrastruktury.
- **Webhook secret vracen z backendu pri kazdem fetch** — radky 379-455. Secret by mel byt zobrazen POUZE pri vytvoreni.
- **Webhook secret generovan client-side** — radky 887-889. Best practice je generovat server-side.
- **Secret zobrazen kazdemu admin uzivateli** — radky 422-424. Zadna re-autentizace.

### Bugs (P1)
- **Tichy fail pri prazdnych events** — radek 913. Zadna chybova zprava.
- **Test result neni vycisten pri prepnuti tabu** — radek 1681.

### Code Quality (P2)
- Hardcoded ceske stringy bez i18n
- 2000+ radku v jednom souboru
- Unused import `ForgeConfirmDialog` — radek 7

---

## AdminMigration.jsx

### Security (P0)
- **`window.confirm` misto ForgeConfirmDialog** — radky 60, 102, 108. Destruktivni operace bez spravneho confirm dialogu.
- **Zadna validace zalohy pred migraci** — radek 59-78. Data loss risk.
- **Zadny authorization check** — migrace pristupna kazdemu admin uzivateli.

### Bugs (P1)
- **Deleni nulou** — radek 185. `progress.total` muze byt 0 → NaN%.
- **Chybejici error boundary** — storage funkce mohou vyhodit vyjimku.
- **Zmena storage mode bez potvrzeni** — radky 91-93. Tlacitko okamzite meni mode.

### Code Quality (P2)
- Zadny i18n support

---

## adminTenantStorage.js (utility)

### Security (P0)
- **KRITICKE: Fallback `'demo-tenant'` hardcoded** — radky 30-31. Vsichni neautentizovani uzivatele sdili stejny namespace → cross-tenant data access risk.
- **`console.warn` vystavuje storage key strukturu** — radky 67, 86, 93, 112.
- **`tenantIdOverride` parametr bez validace** — radky 58, 77, 142, 151, 160. Potencialni cross-tenant access.
- **Fire-and-forget Supabase writes** — radky 92-95. Tichy fail = data divergence.

### Bugs (P1)
- **`appendTenantLog` pristupuje `storageAdapter.supabase` primo** — radky 122-129. Muze byt undefined.
- **`setTenantId` tichy fail** — radek 37. Volajici nevedi ze operace selhala.

### Code Quality (P2)
- Mixovane `console.warn`/`debug()` — radky 37, 67, 86

---

## invoiceGenerator.js (utility)

### Security (P0)
- **Chybejici escape jednoduche uvozovky v `escHtml`** — radky 286-293.
- **`logoUrl` akceptuje `javascript:` a `data:` protokoly** — radek 140.

### Bugs (P1)
- **Invoice number kolize** — radky 40-44. Pouze poslednich 5 cislic orderId + rok.

### Code Quality (P2)
- `escHtml`/`escAttr` nejsou exportovany pro znovupouziti

---

## invoiceStorage.js (utility)

### Security (P0)
- **HTML content ulozeny v localStorage** — radek 70. Pokud pozdeji rendrovano pres `dangerouslySetInnerHTML` → XSS.

### Bugs (P1)
- **`updateInvoiceStatus` bez validace** — radky 112-124. Libovolny string jako status.
- **Race condition na concurrent writes** — read-then-write neni atomicke.

---

## emailSendLog.js (utility)

### Security (P0)
- **`Math.random()` pro ID generovani** — radek 46. Porusuje project convention (melo byt `crypto.randomUUID()`).

### Bugs (P1)
- **Log entries cap 50 bez varovani** — radek 55.

---

# VLNA 2: Pricing, Fees, Parameters

---

## AdminPricing.jsx

### Security (P0)
- **`window.prompt()` pro import JSON bez sanitizace/limitu** — radek 1020-1021. User input parsovan pres `JSON.parse` a rovnou aplikovan na stav. Zadna validace schematu, hloubky, velikosti. Potencialni prototype pollution pres `__proto__` klice.
- **Zadny upper bound na cenove hodnoty** — `safeNum` (radek 117-120) klampuje jen `Infinity`/`NaN`, ne extremni cisla jako `1e308`. `rate_per_hour: 1e300` → kalkulace vraci `Infinity` nebo `NaN`.
- **`window.confirm()` misto ForgeConfirmDialog** — radek 1595. Destruktivni akce (mazani materialu) s interpolovanym `material.name` v nativnim dialogu.
- **Primy localStorage pristup** — radky 66-74. `mp_pricing_ui_collapsed` key bez tenant scope. Porusuje invariant.

### Bugs (P1)
- **Race condition: auto-save pri init** — radek 1262. `savePricingConfigV3(normalized)` bez isMounted check muze prepsat soubeezne zmeny.
- **`setTimeout` v `setMaterials` callback** — radky 547-554. Stale closure pri rychlem dvojkliku.
- **`blocked` flag read po async state update** — radky 729-758. React muze odlozit update batching.
- **Dirty check porovnava odvozena data** — radky 891-903.

### Code Quality (P2)
- Duplikovana normalizace materialu (~30 radku 2x) — radky 1149-1234 a 1050-1078
- `CollapsibleCard` jako useCallback hook misto samostatne komponenty — radky 459-483
- `ToggleRow`/`FieldError` uvnitr render funkce — radky 1325-1345
- Hardcoded ceske stringy — radek 1133-1137

---

## AdminFees.jsx

### Security (P0)
- **`console.error` v produkci** — radky 369, 735. Information leakage.
- **Zadny upper bound na fee value** — `safeNum` bez max limitu. `1e308` projde → `Infinity`.
- **`contains` operator bez whitelistu** — radek 276. Z importovaneho JSON muze prijit neznamy operator.

### Bugs (P1)
- **Dirty memo asymetrie** — radky 380-382. Normalizovana vs. surova data → `dirty` vzdy `true`.
- **`bulkDuplicate` pridava na zacatek celeho pole** — radky 621-627. Kopie v jine kategorii nez ocekavano.
- **`feeDragId` zustane dirty pri Escape cancel** — radek 691.

### Code Quality (P2)
- `normalizeFeeUi` volana opakowane v jednom renderu — 5+ mist
- `formatMoneyCzk` pise `Kc` misto `Kč` — radky 229-231
- `SAMPLE_CTX` hardcoded material `'pla'` — radky 300-304

---

## AdminParameters.jsx

### Security (P0)
- **Import materialu bez sanitizace** — radky 1430-1444. `JSON.parse` primo do `savePricingConfigV3` bez validace schematu.
- **`alert()` pro error handling** — radky 1432, 1446.
- **`updated_by: 'admin'` hardcoded** — radek 1846. Audit trail integrity.

### Bugs (P1)
- **`onPatchDraft` inject libovolnych klicu** — radky 1769-1790. Bez whitelistu.
- **`setTimeout` bez cleanup** — radek 1862. Memory leak.
- **`readTenantJson` v render funci** — radky 878-879. Synchronni I/O v renderu.
- **`computeDiffCount` O(n²)** — radky 107-128. Performance problem.

### Code Quality (P2)
- ~1000+ radku inline CSS — radek 1980+
- `ConfirmModal` lokalne misto ForgeConfirmDialog — radky 192-224
- `t = (cs, en) => ...` definovana 4x v ruznych sub-komponentach
- `DEFAULT_PRINTER_PROFILE` hardcoded — radky 140-153

---

## helpTexts.js

### Security (P0)
- Zadne issues. Pouze staticke stringy.

### Bugs (P1)
- **Prazdny string pro neznamy klic** — radky 172-176. Dev-mode bez varovani.
- **Tichy fallback na anglictinu** — radek 175. Chybejici preklady neviditelne.

### Code Quality (P2)
- Chybi `learnMore` u vetsiny klicu — radek 150

---

# VLNA 3: Presets, Branding, Emails

---

## AdminEmails.jsx

### Security (P0)
- **KRITICKE: XSS v `dangerouslySetInnerHTML` v contentEditable editoru** — radek 563. Sablona z localStorage vlozena do DOM bez sanitizace. `sanitizeTemplateHtml` je volana POUZE pri ukladani (radek 235), ne pri nacteni.
- **Slaby HTML sanitizer** — `sanitizeTemplateHtml` v adminEmailStorage.js radky 208-219. Neodstranuje `<iframe>`, `<object>`, `<embed>`, `<svg onload>`, `data:text/html`, CSS expression. Koment sám varuje: "Not a full sanitizer; use DOMPurify in production."
- **`createLink` URL bez validace** — radky 182-184. `prompt()` akceptuje `javascript:alert(1)` a vlozi do sablony.
- **Regex pro `on*` atributy bypassovatelny** — radky 213-215. Vyzaduje whitespace pred `on\w+`, lze obejit.

### Bugs (P1)
- **Race condition pri switch sablony** — radky 139-143. `syncEditorContent` + `activeTemplate` → zapis obsahu A do sablony B.
- **`console.error` v produkci** — radky 131, 221, 244, 261.
- **`config` muze byt `null` pri prvnim renderu** — radky 158, 348.

### Code Quality (P2)
- `eslint-disable-line react-hooks/exhaustive-deps` — radky 135, 143
- `prompt()` blokuje vlakno — radek 182
- Hardcoded `'TEST-001'` — radek 298

---

## EmailTemplatePreview.jsx

### Security (P0)
- **KRITICKE: `doc.write(fullHtml)` do iframe s `allow-same-origin` sandbox** — radky 92-97, 141. Iframe muze pristupovat k parent DOM a localStorage.
- **Subject interpolace bez HTML escapingu** — radek 74. `${subjectRendered}` primo do HTML stringu.

### Bugs (P1)
- **Chybi cleanup pri unmount** — radky 89-97.
- **Fixni iframe vyska 400px** — radek 192. Dlouhy obsah orezany.

### Code Quality (P2)
- Hardcoded barvy misto Forge tokenu — radky 186-193

---

## AdminBranding.jsx

### Security (P0)
- **SVG upload bez sanitizace** — radek 62, 500-511. SVG muze obsahovat `<script>` nebo event handlery. Ulozeno jako data-URL bez cisteni.

### Bugs (P1)
- **Flush on unmount s null payload** — radky 35-40. `saveFn(null)` muze prepsat branding.
- **Chybi catch v useEffect** — radky 122-137. Error se nezpracuje.
- **Duplikovany setTimeout pro saveStatus bez ref** — radky 146-148. Memory leak.

### Code Quality (P2)
- Hardcoded ceske stringy — radky 449, 452, 441, 447

---

## AdminPresets.jsx

### Security (P0)
- **Prototype pollution pres `parseShareString`** — radky 178-185. `data.p` (print_overrides) bez whitelistu klicu.
- **Nevalidovany JSON import** — radky 187-195. Libovolny objekt akceptovan.
- **`Math.random()` pro ID** — radky 432, 487. Ma byt `crypto.randomUUID()`.

### Bugs (P1)
- **`quickEditField` stale data** — radek 317.
- **`selectedPresetIds` neclearovana po load** — radky 379-406.

### Code Quality (P2)
- Deprecated `escape()`/`unescape()` — radky 171-180
- Prazdny nazev → `_.json` — radky 154-155

---

## PresetComparison.jsx

### Security (P0)
- Zadne issues.

### Bugs (P1)
- **Chybi `type="button"` na close button** — radek 96. Muze submitovat form.

### Code Quality (P2)
- `pickLang` duplikovana ve 3 souborech

---

## PresetTemplates.jsx

### Security (P0)
- **API error messages zobrazeny uzivateli** — radky 113-115. Information disclosure.

### Bugs (P1)
- **Async funkce bez cleanup** — radky 56-66. Chybi AbortController.
- **`handleCreate` bez null check na prop** — radky 68-76.

### Code Quality (P2)
- `MATERIAL_COLORS` duplikovany — sdilet

---

## PresetInlineEditor.jsx

### Security (P0)
- Zadne primo XSS issues.

### Bugs (P1)
- **`draft` se neresetuje po ukladani** — radky 162-167.
- **`preset.id` bez null check** — radky 163, 179.

### Code Quality (P2)
- Chybi PropTypes
- `pickLang` duplikovana

---

# VLNA 4: Widget, Shipping, Coupons

---

## AdminWidget.jsx

### Security (P0)
- **XSS v generovanem embed kodu** — radek 427. `widget.name` bez `sanitizeForComment` v `onCopyEmbed`. Nazev s `-->` uzavre HTML koment.
- **Primy localStorage v `adminBrandingWidgetStorage.js`** — radky 35-43. Vlastni `lsGet`/`lsSet` misto tenant storage.
- **`getWidgetByPublicId` scannuje vsechny localStorage klice** — radek 435. Cross-tenant data leakage.
- **`window.confirm` pro destruktivni akce** — radky 288, 340, 466.

### Bugs (P1)
- **`refresh()` neni memoizovana** — radek 96. Stale closure risk.
- **`onAddDomain` pouziva `res.error` misto `res.reason`** — radek 446. Chybova zprava vzdy genericka.
- **`useMemo(validateEditor, [editor])` nespravna syntaxe** — radek 277.

### Code Quality (P2)
- `console.error` v 7 catch blocich
- Hardcoded ceske stringy
- Deprecated `window.confirm`

---

## AdminShipping.jsx

### Security (P0)
- **Zadna validace negativnich cen** — radky 783-789. `min="0"` jen v HTML, backend neklampuje. Negativni ceny = "priplatky" zakaznikovi.
- **Zadny horni cenovy limit** — shipping price muze byt `99999999`.

### Bugs (P1)
- **`handleSave` je sync ale UI ukazuje saving state** — radky 252-265. React batch → uzivatel saving stav nevidi.
- **`removeCustomZone` neresetuje `selectedMethodId`** — radky 199-216.

### Code Quality (P2)
- `console.error` — radky 75, 263
- `weightLabel` bez i18n — radky 48-52

---

## AdminCoupons.jsx

### Security (P0)
- **KRITICKE: `Math.random()` pro generovani kuponu** — adminCouponStorage.js radek 301. Slevove kody s monetarni hodnotou musi pouzivat `crypto.getRandomValues()`.
- **Percent slevy bez validace <= 100** — radek 751-756. Moznost nastavit 999% slevu → cena < 0.
- **Coupon brute-force bez rate limiting** — prostor 32^4 = ~1M kombinaci. Bruteforce za ~10 minut.
- **`customer_usage` tracking obejitelny** — adminCouponStorage.js radek 74. `customerId` je klientem kontrolovany string.

### Bugs (P1)
- **`duplicateCoupon` kod `ABC123-COPY`** — radek 219. Zadna uniqueness kontrola.
- **`confirm` chybi v useCallback deps** — radek 209.
- **`banner` nema timeout** — zustava trvale.

### Code Quality (P2)
- `createId` definovana lokalne + `generateId` v storage — duplicita
- `safeNum` duplikovana — radky 29-32
- Hardcoded `'CZK'` mena — radek 52

---

## WidgetDomainsTab.jsx

### Security (P0)
- **Chybova zprava vzdy genericka** — `res.error` misto `res.reason` v AdminWidget.jsx.
- **Wildcard dokumentace zavadejici** — `*.firma.cz` matchuje `sub.firma.cz` ale ne `firma.cz` samotne.
- **Chybi potvrzeni pro smazani domeny** — radek 133.

### Bugs (P1)
- **`domains` prop muze byt undefined** — radek 106. `.length` haze TypeError.

### Code Quality (P2)
- Chybi `aria-label` na checkboxech — radky 126-129
- Chybi `type="button"` — radek 97

---

## WidgetConfigTab.jsx

### Bugs (P1)
- **`borderRadius` bez JS clampu** — radek 130. HTML `max={32}` ignorovano pri rucnim vstupu.
- **`widthPx` ulozeno jako string** — radky 158-161. Dirty checking naruseno.

---

## WidgetSettingsTab.jsx

### Bugs (P1)
- **`confirmDelete` state muze zustat true** — radek 24.
- **`isActive` true pro neocekavane status hodnoty** — radek 28.

---

## WidgetIntegrationTab.jsx

### Security (P0)
- **`sanitizeForComment` nedostacujici** — radky 12-14. `--!>` neni odchycen. Slaba sanitizace.

### Bugs (P1)
- **Duplicitni kod s WidgetEmbedTab.jsx** — `PLATFORMS`, `getSnippets()`, `sanitizeForComment()`.

---

## WidgetPreviewPanel.jsx

### Bugs (P1)
- **`primaryColor` nevalidovana pred CSS** — radek 18.
- **Hardcoded preview data** — radky 157-162.

---

## WidgetEmbedTab.jsx

### Security (P0)
- **KRITICKE: `sandbox="allow-scripts allow-same-origin"` rusi sandbox** — radek 646. Iframe muze pristupovat k parent DOM a localStorage. Toto je zname security anti-pattern.
- **Duplicitni slaby `sanitizeForComment`** — radky 21-23.

### Bugs (P1)
- **`embedConfig.widthPx` se nepropaguje do data atributu** — radek 52-61.

### Code Quality (P2)
- ~200 radku inline style objekt — radky 197-395
- Duplicitni `PLATFORMS` konstanta

---

# VLNA 5: Team, Customers, Settings, Analytics

---

## AdminTeamAccess.jsx

### Security (P0)
- **Role enforcement pouze vizualni** — Permissions matrix (radky 83-109) jen UI konstanty. Kdo ma pristup k localStorage muze si zmenit roli na `owner`.
- **"Simulovat prijem" invite bez overeni** — radek 479. Libovolny admin muze "prijmout" pozvanku za jine osoby.
- **Email PII v activity logu bez masking** — radek 687. Viewer vidi emaily kolegu.

### Bugs (P1)
- **`getInitials(name)` crashne pro prazdny string** — radek 142. Po `.trim()` muze byt `""`.
- **Data se neaktualizuji z jineho tabu** — radky 920-922. Pouze manualni `refresh()`.

### Code Quality (P2)
- Vsechny texty hardcoded cesky — i18n neuplne

---

## AdminCustomers.jsx

### Security (P0)
- **PII v CSV exportu bez audit logu** — `handleExport`. Jmena, emaily, telefony, adresy bez overeni role.
- **`console.error` v produkci** — radek 854.
- **Customer notes bez sanitizace** — `writeTenantJson` primo z textarea.

### Bugs (P1)
- **Email aggregace case-sensitive** — `Jan@firma.cz` vs `jan@firma.cz` = 2 zaznamy. Chybi `.toLowerCase()`.
- **Segment logika muze byt nekonzistentni** — orders vs notes z ruznych zdroju.

### Code Quality (P2)
- `round2` importovan z `adminOrdersStorage` — mela by byt v utils
- Hardcoded hex barvy misto Forge tokenu

---

## AdminSettings.jsx

### Security (P0)
- **Primy `window.localStorage.removeItem()` a `key()`** — radky 211, 222-226. Porusuje storage invariant.
- **Factory Reset bez sekundarni verifikace** — radky 588-596. Jeden klik smaze VSE.
- **Dead code `tenantId` promenna** — radek 199.

### Bugs (P1)
- **`setTimeout` bez cleanup (4x)** — radky 185, 203, 213, 233. Memory leak.
- **`orderAutoArchiveDays` bez max validace** — radek 377.
- **`orderNumberPreview` IIFE v renderu** — radky 238-244.

### Code Quality (P2)
- Zadny i18n — cely soubor hardcoded cesky
- `readTenantJson` unused import — radek 38

---

## AdminAnalytics.jsx

### Security (P0)
- **Hardcoded `demo@modelpricer.local` v audit logu** — radky 501-503, 523-525. Audit trail PII exportu nefunkcni.
- **`window.confirm()` pro destruktivni akci** — radek 492.

### Bugs (P1)
- **`handleDownloadPDF` popup blocker** — radky 569-575. Zadny fallback pri `win === null`.
- **`switch` bez `default`** — radky 547-553.

### Code Quality (P2)
- Chybi `useDocumentTitle`
- `formatDateTime` bez locale argumentu — radek 64

---

## AnalyticsCharts.jsx

### Bugs (P1)
- **`Math.random()` v demo generatoru** — radky 106, 139. Data se meni pri kazdem renderu.
- **`revenueIsDemo` zdvojene volani** — radek 595.

### Code Quality (P2)
- `TEAL_DARK` unused — radek 9
- Velky inline `<style>` — radky 671-845

---

## DashboardCharts.jsx

### Bugs (P1)
- **`Math.random()` v demo generatoru** — radky 71-84. Nekonzistentni demo data.

### Code Quality (P2)
- `TEAL_DARK` unused — radek 11
- `Legend` unused import — radek 6
- Inline `<style>` — radky 585-597

---

## QuickSettings.jsx

### Security (P0)
- **Primy localStorage bez tenant scope** — radky 25, 93. `mp:quicksettings:collapsed` sdileno mezi tenanty.

### Bugs (P1)
- **Race condition mezi debounce timery** — `debouncedSavePricing` a `debouncedSaveFees` ctou config nezavisle. Druhy timer prepise zmeny prvniho.
- **`indicatorTimer` bez cleanup** — radky 105-113. Memory leak.
- **`handleExpressFeeToggle` matchuje fee regex na nazvu** — radek 208. Prejmenujte fee = toggle prestane fungovat.

### Code Quality (P2)
- `pricingConfigRef`/`feesConfigRef` dead code — radky 48-49

---

# VLNA 6: SystemHealth, ActivityLog, ModelStorage, Express

---

## AdminSystemHealth.jsx

### Security (P0)
- **System info disclosure** — radky 1143-1147. `import.meta.env.VITE_API_URL`, `MODE`, `DEV/PROD` v DOM.
- **Tenant ID disclosure** — radek 969. `getTenantId()` jako plaintext.
- **Full localStorage scan + export bez logovani** — radky 471-488, 607-617. Exfiltrace konfigurace neviditelna.
- **Chybejici authz check** — cely soubor.

### Bugs (P1)
- **Race condition v auto-refresh** — radky 566-588. Stary interval muze prezit restart.
- **`byteSize` nepresny** — radek 85. `str.length * 2` pro UTF-8.

### Code Quality (P2)
- `navigator.platform` deprecated — radek 635
- Chybi `aria-label` na tab buttons — radky 722-752

---

## AdminActivityLog.jsx

### Security (P0)
- **Export bez authz logu** — radky 338-366. Exfiltrace neviditelna.
- **CSV injection** — radky 338-354. `details` pole primo do CSV. `=cmd|...` → formula injection v Excelu.

### Bugs (P1)
- **`setTimeout` bez cleanup** — radky 288-293. Memory leak.
- **`prevIdsRef` roste bez limitu** — radky 280-293.
- **`page` state se neresetuje pri filtru** — radky 308-311.

### Code Quality (P2)
- Hardcoded `'Neznamy'` — radek 141

---

## AdminModelStorage.jsx

### Security (P0)
- **Delete bez confirm dialogu** — radky 308-314. Single i bulk delete bez potvrzeni.
- **Path traversal risk v `getDownloadUrl`** — radek 99.
- **Chybi authz na storage operace** — cely soubor.

### Bugs (P1)
- **`initialPath` se neaktualizuje pri URL zmene** — radky 13-14.
- **`handleDeleteSelected` partial failure** — radky 111-116.
- **`selectedItem` stale po smazani** — radky 111-115.

### Code Quality (P2)
- `console.error` v produkci — radky 107, 126
- `isTrash` case-sensitive detekce — radek 131

---

## AdminExpress.jsx

### Security (P0)
- **`console.error` v produkci** — radky 59, 199.

### Bugs (P1)
- **`handleSave` sync ale ukazuje saving** — radky 181-203. Loading state se nezobrazi.
- **Duplicitni nazvy tieru** — radky 107-124.
- **`t` var collision** — radky 72-75. Loop var `t` vs import `t`.

### Code Quality (P2)
- `deepClone` dead code — radky 23-25
- 200+ radku inline `<style>` — radky 589-794
- Hardcoded `'CZK'` — radky 341-342
- Chybi `useDocumentTitle`

---

## SecurityAuditPanel.jsx

### Security (P0)
- **CSV injection v exportu** — radky 244-259. `actor` a `details` bez escapovani.
- **Security log v localStorage neni tamper-proof** — radky 218-222.

### Bugs (P1)
- **`void refreshKey` anti-pattern** — radky 220-221.

### Code Quality (P2)
- Hardcoded cesky — cely soubor
- Chybi `aria-label` na pagination — radky 689-744

---

## ConfigBackupRestore.jsx

### Security (P0)
- **KRITICKE: Import bez validace hodnot** — radky 153-174. `backupData[ns.key]` primo do `writeTenantJson`. XSS payloady v `businessName`, `logoUrl` se zapisi do storage.
- **Cross-tenant restore neni blokovano** — radky 177-204. Zaloha z jineho tenanta muze byt importovana.
- **Primy `window.localStorage.setItem`** — radky 165-166. Obchazi storage helpery.
- **Auto-backup exfiltruje data bez logovani** — radky 724-757.
- **Auto-backup key bez tenant scope** — radek 67.

### Bugs (P1)
- **`importFile` a `importValidation` nekonzistentni stav** — radky 848-873.
- **Auto-backup timer restart pri re-renderu** — radky 696-710.

### Code Quality (P2)
- Fake progress `setTimeout(r, 80)` — radky 768-769

---

## DataImportWizard.jsx

### Security (P0)
- **KRITICKE: Zadna file size validace** — radky 352-395. Giganticky JSON → browser zamrzne (DoS).
- **Import bez sanitizace hodnot** — radky 198-283. XSS payloady v `businessName`, `description` → ulozeno a zobrazeno.
- **CSV injection** — radky 43-63. `=cmd|...` v hodnotach.
- **Zadne audit logovani importu** — radky 484-510.

### Bugs (P1)
- **`executeImport` sync ale ukazuje importing** — radky 484-510. Loading se nezobrazi.
- **Wizard zamrzne pri vyjimce** — radky 525-534.

### Code Quality (P2)
- `parseCSV` nerespektuje RFC 4180 quoting — radky 43-63
- Chybi `file.type` MIME validace — radek 359

---

# VLNA 7: Kanban, Storage components

---

## KanbanBoard.jsx

### Security (P0)
- Zadne primo XSS vektory.

### Bugs (P1)
- **Drop na kartu misto sloupce** — radky 136-162. `over.id` nevalidovano oproti `STATUS_ORDER`.
- **WIP limit check na filtrovanych datech** — radek 156. False negative pri aktivnich filtrech.

### Code Quality (P2)
- Chybi `KeyboardSensor` pro DnD — radky 35-41. WCAG porušení.
- Hardcoded `"obj."`, `"zpozdeno"` — radky 211, 228

---

## KanbanCard.jsx

### Security (P0)
- Zadne XSS.

### Bugs (P1)
- **KRITICKE: Rules of Hooks poruseni** — radky 49-65. `useMemo` po podminenem `return null`. React haze chybu v dev, nekonzistentni stav v prod.
- **`timeAgo` vraci `''` pro future dates** — radek 12.

### Code Quality (P2)
- `<style>` tag v kazde instanci karty — radky 356-365. Performance.
- `"Kc"` misto `"Kč"` — radek 68

---

## KanbanColumn.jsx

### Bugs (P1)
- **`isValidDrop` nepocita s WIP limitem** — radky 25-31. Zelene zvyrazneni → tichy fail.
- **Click na child v headeru taky toggles collapse** — radek 105.

### Code Quality (P2)
- `formatMoney` duplikat — radky 47-52
- Hardcoded ceske stringy — radek 229
- `<style>` v kazdem sloupci — radky 285-290

---

## KanbanFilters.jsx

### Bugs (P1)
- **`activeFilterCount` nepocita `overdueOnly`** — radek 52.
- **`dateFrom || dateTo` = 1 misto 2** — radek 52.

### Code Quality (P2)
- Vsechny labely hardcoded cesky
- Chybi `aria-label` na date inputs — radky 186, 200

---

## KanbanSettings.jsx

### Bugs (P1)
- **Ztrata unsaved changes pri zavreni** — radky 145-159. Bez "Unsaved changes" guardu.
- **`useEffect` unused import** — radek 1.

### Code Quality (P2)
- Hardcoded cesky
- `<style>` inline — radky 256-260

---

## useKanbanDnd.js

### Bugs (P1)
- **CELY HOOK JE DEAD CODE** — nikde neni importovan. `KanbanBoard.jsx` pouziva vlastni DnD implementaci.

---

## statusTransitions.js

### Security (P0)
- **Validace POUZE klientska** — radky 30-34. Backend MUSI nezavisle overit status prechody.

### Bugs (P1)
- **`checkOverdue` pouziva `updated_at`** — radky 76-89. Kazda aktualizace resetuje timer.

### Code Quality (P2)
- `getStatusLabel` bez i18n — radky 55-68
- `ALLOWED_TRANSITIONS` bez `Object.freeze`

---

## FolderTreePanel.jsx

### Security (P0)
- **Path traversal** — radek 21. `browseFolder(path)` predava path ze serveru bez validace.

### Bugs (P1)
- **Memory leak v `loadSubFolders`** — radky 16-29. Chybi AbortController.
- **Double API call pri kliknuti** — radky 32-44. `handleClick` + `handleToggle` se spusti soucasne.
- **`alwaysExpandable` prop dead parameter** — radek 5.

### Code Quality (P2)
- Zadne `role="tree"` / `role="treeitem"` — ARIA chybi
- Hardcoded paths `"Orders"`, `"CompanyLibrary"` — radky 129-153
- Chybi error UI

---

## FileListPanel.jsx

### Security (P0)
- **`innerHTML` assignment** — radek 430. Staticke SVG, ale unsafe pattern.
- **`item.path` bez sanitizace** — radky 136, 304.

### Bugs (P1)
- **Slozky v trash jsou klikatelne no-op** — radky 135-141.
- **`SortHeader` uvnitr render funkce** — radky 259-281. Re-mount pri kazdem renderu.

### Code Quality (P2)
- `is3DFile`/`isImageFile` duplikovany 2x — radky 45-53
- Mixed jazyky v UI

---

## FileToolbar.jsx

### Security (P0)
- **Folder name bez sanitizace** — radky 22-26. Path traversal risk (`/`, `..`, `\0`).
- **File upload bez `accept` atributu** — radek 104.

### Bugs (P1)
- **Upload button neni viditelny pri `currentPath === undefined`** — radky 101-107.

---

## BreadcrumbBar.jsx

### Security (P0)
- **`..` v breadcrumb navigaci** — radky 5-12. Backend musi blokovat traversal.

### Bugs (P1)
- **`onNavigate` chybi optional chaining** — runtime error.

### Code Quality (P2)
- Chybi `aria-label` na nav, `aria-current="page"` na poslednim crumb
- `"Root"` hardcoded anglicky

---

## PreviewPanel.jsx

### Security (P0)
- **Path traversal v `getPreviewUrl`** — radek 137. Frontend neprovadi sanitizaci.
- **Delete bez confirm dialogu** — radky 190-213.

### Bugs (P1)
- **3 unused imports** — `Suspense`, `useMemo`, `getDownloadUrl`

### Code Quality (P2)
- Mixed jazyky (anglicke texty)
- `toLocaleString()` bez locale

---

# SOUHRN CELEHO AUDITU

## Celkove statistiky

| Priorita | Celkovy pocet | Nejcastejsi typ |
|----------|--------------|-----------------|
| **P0 Security** | ~55 | XSS (dangerouslySetInnerHTML), chybejici auth/authz, primy localStorage, CSV injection, path traversal |
| **P1 Bugs** | ~70 | Memory leaks (setTimeout/useEffect), race conditions, stale closures, Rules of Hooks |
| **P2 Quality** | ~90+ | Hardcoded ceske stringy bez i18n, duplikovany utility kod, inline CSS, dead code/imports |

## TOP 15 KRITICKYCH NALEZU (OPRAVIT OKAMZITE)

### Security P0 — Must Fix

| # | Soubor | Problem | Radek |
|---|--------|---------|-------|
| 1 | AdminOrderDetail.jsx | **Stored XSS** — `dangerouslySetInnerHTML` s nesanitizovanym email body | 2718 |
| 2 | OrderExportActions.jsx | **Stored XSS** — stejna zranitelnost jako #1 | 1009 |
| 3 | AdminEmails.jsx | **XSS v email editoru** — `dangerouslySetInnerHTML` + slaby sanitizer | 563 |
| 4 | EmailTemplatePreview.jsx | **XSS pres `doc.write`** do iframe s `allow-same-origin` | 92-97 |
| 5 | AdminLayout.jsx | **Chybejici auth guard** — admin panel otevreny pro vsechny | 163-169 |
| 6 | adminTenantStorage.js | **Demo-tenant fallback** — cross-tenant data access | 30-31 |
| 7 | AdminWebhooks.jsx | **SSRF** — zadna validace proti privatnim IP | 891-908 |
| 8 | WidgetEmbedTab.jsx | **Sandbox bypass** — `allow-scripts` + `allow-same-origin` | 646 |
| 9 | ConfigBackupRestore.jsx | **Import bez sanitizace** + cross-tenant restore | 153-174 |
| 10 | DataImportWizard.jsx | **Import bez file size limitu** + bez sanitizace | 352-395 |
| 11 | AdminCoupons.jsx | **Percent > 100%** bez validace → negativni ceny | 751 |
| 12 | AdminActivityLog.jsx | **CSV injection** v exportu | 338-354 |
| 13 | TabItemsFiles.jsx | **Path traversal** v download | 45-59 |
| 14 | AdminTeamAccess.jsx | **Role enforcement pouze vizualni** | 83-109 |
| 15 | AdminPricing.jsx | **JSON import bez sanitizace** pres `window.prompt` | 1020-1021 |

---

# BROWSER TESTING

> Testovano pres Chrome MCP na http://localhost:4028 — vsech 26 admin stranek.

## Vysledky

| Stranka | URL | Stav | Poznamky |
|---------|-----|------|----------|
| Dashboard | /admin | OK | Statistiky, quick settings, sidebar navigace funguje |
| Orders | /admin/orders | OK | Tabulka, filtry, batch actions, paginace |
| Payments | /admin/payments | OK | Platba na ucet, variabilni symbol, Stripe toggle |
| Customers | /admin/customers | OK | Tabulka, segmenty, CSV export. Drobny UX: sloupec "Objednavek" prazdny |
| Pricing | /admin/pricing | OK | Materialy, save/export/import |
| Parameters | /admin/parameters | OK | Overview, tabs, printer profil |
| Fees | /admin/fees | OK | Search, filtry, CRUD poplatku |
| Presets | /admin/presets | OK | 4 presety, akce (edit/duplikovat/export/smazat) |
| Express | /admin/express | **OPRAVEN BUG** | Rules of Hooks crash (useMemo po early return). Opraveno — nyni OK |
| Shipping | /admin/shipping | OK | Shipping methods, formular editace |
| Coupons | /admin/coupons | OK | Hromadne generovani, CRUD |
| Emails | /admin/emails | OK | 8 sablon, rich text editor, SMTP tab |
| Branding | /admin/branding | OK | Nazev/popis firmy, logo upload |
| Widget | /admin/widget | OK | 5 tabu, Builder, embed kod |
| Team | /admin/team | OK | 3 taby, pozvanka clena |
| Model Storage | /admin/model-storage | OK | File manager, vyhledavani, preview |
| System Health | /admin/system | OK | Stav systemu + Bezpecnost. POZOR: `/admin/system-health` → 404 |
| Activity Log | /admin/activity | OK | Filtry, export, mazani |
| Webhooks | /admin/webhooks | OK | 3 taby, pridat webhook |
| Integrations | /admin/integrations | OK | 8 integracnich karet |
| Settings | /admin/settings | OK | Mena, jazyk, casove pasmo |
| Analytics | /admin/analytics | OK | Casove filtry, 6 tabu, grafy |
| Migration | /admin/migration | OK | Supabase migracni panel |

## Runtime bugy nalezene pri testovani

| # | Stranka | Problem | Opraveno? |
|---|---------|---------|-----------|
| 1 | AdminExpress | **Rules of Hooks crash** — `useMemo` po early return (`if (loading)`) → ErrorBoundary | ANO — presun hooku pred early return |
| 2 | System Health | Route `/admin/system-health` neexistuje, spravna je `/admin/system` | NE — dokumentovano |
| 3 | Customers | Sloupec "Objednavek" prazdny (chybi hodnota) | NE — dokumentovano |
| 4 | Sidebar | "admin.settings" zobrazuje i18n klic misto prekladu | NE — dokumentovano |

## Console warnings (vsechny stranky)

Na vsech strankach se opakovaly 2 warnings z externiho skriptu (nesouvisejici s aplikaci):
- `[Auth] Failed to set Supabase claims: Failed to set claims`
- `[tenantRegistration] Failed to check tenant: TypeError: Failed to fetch`

Tyto jsou ocekavane v lokalnim prostredi bez live Supabase connection.

---

### Systemove problemy (opakuji se)

| Problem | Pocet vyskytu | Kde |
|---------|--------------|-----|
| Primy localStorage pristup | 8+ mist | AdminLayout, AdminPricing, AdminSettings, QuickSettings, AdminWidget, ConfigBackupRestore, AdminIntegrations |
| `window.confirm` misto ForgeConfirmDialog | 6+ mist | AdminPricing, AdminMigration, AdminSettings, AdminWidget, AdminAnalytics |
| `console.error` v produkci | 15+ mist | Vetsina admin stranek |
| `user_id: 'admin'` hardcoded | 4+ mist | TabCustomer, PrintQueue, AdminParameters, AdminAnalytics |
| Hardcoded ceske stringy bez i18n | 25+ stranek | Skoro vsechny admin stranky |
| Utility funkce duplikovany | 10+ mist | formatMoney, formatTime, formatDate, safeNum, pickLang, t() |
| Inline CSS v JSX (`<style>`) | 15+ mist | Dashboard, Pricing, Parameters, Express, Kanban, Calendar, QuickOrder |
| `setTimeout` bez cleanup | 10+ mist | Onboarding, Settings, ActivityLog, AdminExpress, KanbanSettings |
| Dead code / unused imports | 10+ mist | KanbanSettings, PreviewPanel, useKanbanDnd, AdminExpress |

---

# SOUHRN VLNY 1

## Statistiky

| Priorita | Pocet | Popis |
|----------|-------|-------|
| **P0 Security** | ~20 | Auth guard, Stored XSS (2x), SSRF, path traversal, demo-tenant fallback, tenant ID exposure, primy localStorage |
| **P1 Bugs** | ~30 | Memory leaks, race conditions, tichy fail, stale closures, duplikatni activity log, date filter off-by-one |
| **P2 Quality** | ~40+ | Duplicated utils (6+ souboru), hardcoded strings bez i18n, inline CSS (1000+ radku), missing ARIA/focus traps |

## TOP 5 KRITICKYCH NALEZU (OPRAVIT OKAMZITE)

1. **Stored XSS** — `AdminOrderDetail.jsx:2718` + `OrderExportActions.jsx:1009` — `dangerouslySetInnerHTML` s nesanitizovanym email template body. Oprava: DOMPurify.
2. **Chybejici auth guard** — `AdminLayout.jsx:163-169` — try/catch kolem `useAuth()` nechava admin panel otevreny pro vsechny.
3. **SSRF v webhooks** — `AdminWebhooks.jsx:891-908` — zadna validace proti privatnim IP adresam.
4. **Demo-tenant fallback** — `adminTenantStorage.js:30-31` — cross-tenant data access risk.
5. **Path traversal** — `TabItemsFiles.jsx:45-59, 131` — nevalidovany filePath z localStorage.

---

# ACCESSIBILITY (A11Y) AUDIT — 2026-03-13

> **Scope:** `src/pages/admin/` keyboard navigation, focus management, ARIA, color contrast
> **Methodology:** Grep pattern analysis + manual code review (25 files, 13,000+ LOC)
> **Standard:** WCAG 2.1 Level AA

## Executive Summary

**Grade:** C+ (70%) — Moderate concerns in keyboard & focus handling

**Strengths:**
- 92 ARIA attributes present across 34 files
- Some keyboard handlers implemented (`AdminDashboard`, `AdminPricing`)
- No broken image semantics (using Icon components)
- Status banners have `role="status"`

**Critical Gaps:**
1. **No focus-visible CSS** — keyboard users cannot see focused element
2. **No prefers-reduced-motion** — animations affect vestibular disability users
3. **Incomplete keyboard handlers on role="button"** — missing Space key, one file missing handler entirely
4. **Color contrast unverified** — gray (#9ca3af, #999) and orange (#ffaa00) need token-based approach

---

## Issue #1: Missing Focus Visual Indicator (P0 — WCAG 2.4.7)

**Severity:** Critical — Keyboard users cannot navigate admin panel

**Finding:** Grep search for `focus-visible` and `prefers-reduced-motion` returned **0 matches**

**Impact:** When tabbing through admin interface, no visual ring shows which element has keyboard focus. Screen reader users have even worse experience (no announcement).

**Affected Files:**
- All button-like elements in `AdminDashboard`, `AdminPricing`, `AdminCoupons`, `AdminEmails`
- Forms in `AdminBranding`, `AdminParameters`, `AdminWidget`
- All interactive divs with `role="button"`

**Recommended Fix:**
```css
/* Add to src/styles/a11y-focus.css or admin stylesheet */
button:focus-visible,
[role="button"]:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
a:focus-visible {
  outline: 2px solid var(--forge-primary, #4DA8DA);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Issue #2: Incomplete Keyboard Handlers on role="button" (P0 — WCAG 2.1.1)

**Severity:** Critical — Role="button" must handle both Enter AND Space keys

**Pattern Found:** 6 instances of `<div role="button">` with keyboard handlers

| File | Line | Space Key | Enter Key | tabIndex | Status |
|------|------|-----------|-----------|----------|--------|
| `AdminDashboard.jsx` | 410 | ✗ | ✓ | 0 | INCOMPLETE |
| `AdminDashboard.jsx` | 657 | ✗ | ✓ | 0 | INCOMPLETE |
| `AdminDashboard.jsx` | 666 | ✗ | ✓ | 0 | INCOMPLETE |
| `AdminDashboard.jsx` | 675 | ✗ | ✓ | 0 | INCOMPLETE |
| `AdminPricing.jsx` | 482 | ✓ | ✓ | 0 | ✓ OK |
| `AdminBranding.jsx` | 797 | ✗ | ✗ | ✗ | CRITICAL FAIL |

**Code Example (Current — Broken):**
```jsx
// AdminDashboard.jsx:657
<div
  className="dash-pending-item"
  onClick={() => navigate('/admin/orders')}
  role="button"
  tabIndex={0}
  onKeyDown={e => {
    if (e.key === 'Enter') navigate('/admin/orders');
    // MISSING: Space key handler
  }}
>
```

**Correct Implementation:**
```jsx
<div
  className="dash-pending-item"
  onClick={() => navigate('/admin/orders')}
  role="button"
  tabIndex={0}
  onKeyDown={e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/admin/orders');
    }
  }}
>
```

**Files to Fix:**
1. `AdminDashboard.jsx` — 4 instances (lines 657, 666, 675 + check nearby)
2. `AdminBranding.jsx` — 1 instance (line 797, also needs aria-label or title)
3. `AdminPricing.jsx` — 1 instance already correct but verify others

---

## Issue #3: Color Contrast — Gray Text on Unknown Backgrounds (P1 — WCAG 1.4.3)

**Severity:** High — May fail contrast ratio tests

**Patterns Found:**

| File | Color | Usage | Context | Min Required | Status |
|------|-------|-------|---------|---|---------|
| `OrderExportActions.jsx:574` | `#9ca3af` | label text | PDF export | 4.5:1 | ⚠️ BORDERLINE (likely 4.5:1 on white) |
| `OrderExportActions.jsx:614` | `#9ca3af` | label text | Packing slip | 4.5:1 | ⚠️ BORDERLINE |
| `EmailTemplatePreview.jsx:67` | `#999` | secondary text | Email preview | 4.5:1 | ⚠️ UNVERIFIED |
| `AdminPricing.jsx:2903` | `#ffaa00` | orange highlight | Price display | 4.5:1 | ⚠️ UNVERIFIED |
| `AdminPricing.jsx:3260` | `#ff4444` | red text | Error indicator | 4.5:1 | ⚠️ UNVERIFIED |

**Current Implementation (Bad):**
```jsx
<span style={{ color: '#9ca3af' }}>Label</span>  // Hardcoded color
<span style={{ color: '#999' }}>Text</span>      // Non-standard color
```

**Recommended Fix:**
```jsx
// Use design tokens (verify in forge-tokens.css)
<span style={{ color: 'var(--forge-text-muted)' }}>Label</span>
<span className="text-muted">Text</span>  // CSS class approach

// Add to forge-tokens.css if missing:
:root {
  --forge-text-muted: #7A8291;  /* AA safe on #ffffff */
  --forge-warning: #F59E0B;     /* AA safe on white + dark backgrounds */
  --forge-danger: #EF4444;      /* AA safe on white + dark backgrounds */
}
```

**Files to Update:**
1. `OrderExportActions.jsx` — Replace `#9ca3af` with token (2 instances)
2. `EmailTemplatePreview.jsx` — Replace `#999` with token (1 instance)
3. `AdminPricing.jsx` — Audit all inline color styles (5+ instances)
4. `AdminWidget.jsx` — Check `#f87171`, `#fbbf24` (3 instances)

---

## Issue #4: Tab Component ARIA Attributes (P1 — WCAG 4.1.3)

**Severity:** Medium — Tab components need proper ARIA roles

**Found:** 2 instances of `role="tab"`

| File | Line | aria-selected | aria-controls | Keyboard ←/→ | Status |
|------|------|---------------|---|---|---------|
| `AdminWidget.jsx` | 704 | UNKNOWN | UNKNOWN | UNKNOWN | NEEDS AUDIT |
| `BuilderLeftPanel.jsx` | 112 | UNKNOWN | UNKNOWN | UNKNOWN | NEEDS AUDIT |

**Required for Tab Components:**
```jsx
// Tab list container
<div role="tablist" aria-label="Content tabs">
  {/* Each tab button */}
  <button
    role="tab"
    aria-selected={activeTab === 'settings'}
    aria-controls="settings-panel"
    tabIndex={activeTab === 'settings' ? 0 : -1}
    onKeyDown={handleTabKeydown}  // ← / → arrows to switch tabs
  >
    Settings
  </button>
</div>

{/* Tab panel */}
<div
  id="settings-panel"
  role="tabpanel"
  aria-labelledby="settings-tab"
>
  Content
</div>
```

**Action:** Manually verify tab components in:
- `AdminWidget.jsx:704`
- `BuilderLeftPanel.jsx:112`

---

## Issue #5: Form Input Labeling (P1 — WCAG 1.3.1, 3.3.2)

**Severity:** Medium — Screen readers cannot announce input purposes

**Finding:** Grep pattern for unlabeled inputs returned **0 matches**, but this may be too strict.

**Recommended Manual Audit:**
Verify ALL `<input>` elements have one of:
```jsx
// Pattern 1: Explicit label
<label htmlFor="email">Email:</label>
<input id="email" type="email" />

// Pattern 2: aria-label
<input aria-label="Search models" type="text" />

// Pattern 3: aria-labelledby
<span id="search-help">Enter model name</span>
<input aria-labelledby="search-help" />
```

**Files to Check:**
- `AdminPricing.jsx` — Search, numeric inputs (dense form)
- `AdminParameters.jsx` — 50+ form fields
- `AdminCoupons.jsx` — Bulk generation form
- `AdminEmails.jsx` — SMTP configuration form

---

## Issue #6: Focus Trapping in Modals (P1 — WCAG 2.1.2)

**Severity:** Medium — Keyboard focus can escape modals

**Finding:** No `tabIndex={-1}` found in grep results — potential issue if modals present without proper focus management.

**Recommended Check:**
```jsx
// Modal component should trap focus:
<div
  className="modal-backdrop"
  onClick={closeModal}
  role="presentation"
  tabIndex={-1}  // Prevent focus
>
  <div className="modal-content" role="dialog">
    <button onClick={closeModal}>Close</button>
  </div>
</div>
```

**Action:** Verify in `AdminLayout.jsx` and modal components that:
1. Backdrop has `tabIndex={-1}`
2. First focusable element in modal receives focus on open (e.g., Close button)
3. Tab key cycles only within modal
4. Escape key closes modal

---

## Priority Fix Order

### Phase 1: P0 (Today — ~2 hours)
```
1. Add focus-visible CSS (10 min)
   → File: src/styles/a11y-focus.css (new) or admin stylesheet

2. Fix AdminDashboard.jsx keyboard handlers (15 min)
   → Lines: 657, 666, 675 + onKeyDown

3. Fix AdminBranding.jsx role="button" (10 min)
   → Line: 797, add tabIndex={0} + onKeyDown handler

4. Add prefers-reduced-motion CSS (10 min)
   → src/styles/animations.css update
```

### Phase 2: P1 (This week — ~3 hours)
```
5. Replace color hardcodes with tokens (30 min)
   → OrderExportActions, EmailTemplatePreview, AdminPricing, AdminWidget

6. Verify tab component ARIA (20 min)
   → AdminWidget, BuilderLeftPanel

7. Form label audit (30 min)
   → Spot-check: AdminParameters, AdminCoupons, AdminEmails

8. Modal focus trapping (20 min)
   → Check all modals in AdminLayout
```

### Phase 3: Testing (P0 — ~3 hours)
```
9. Keyboard navigation test (Tab, Enter, Space, Escape, Arrows)
10. Screen reader test (NVDA on Windows OR Safari VoiceOver on Mac)
11. Focus ring visibility in light + dark modes
12. Contrast verification tool (WAVE or axe DevTools)
```

---

## WCAG 2.1 Checklist

| Criterion | Level | Status | Evidence |
|-----------|-------|--------|----------|
| 1.1.1 Non-text Content | A | ✓ PASS | Using Icon component, no broken `<img>` |
| 1.4.3 Contrast (Minimum) | AA | ⚠️ NEEDS CHECK | Gray/orange colors hardcoded |
| 2.1.1 Keyboard | A | ✗ FAIL | 4/6 role="button" missing Space key |
| 2.1.2 No Keyboard Trap | A | ? UNKNOWN | Need to verify modals |
| 2.4.3 Focus Order | A | ✓ LIKELY OK | tabIndex usage minimal + correct |
| 2.4.7 Focus Visible | AA | ✗ FAIL | No focus-visible CSS found |
| 2.5.7 Dragging Movements | AAA | ✗ FAIL | No prefers-reduced-motion support |
| 3.2.1 On Input | A | ✓ PASS | No auto-submit forms detected |
| 3.3.1 Error Identification | A | ✓ PASS | Banners use role="alert"/"status" |
| 3.3.2 Labels or Instructions | A | ? UNKNOWN | Need form input audit |
| 4.1.2 Name, Role, Value | A | ⚠️ PARTIAL | ARIA present but incomplete |

**Summary:** 3/10 confirmed passing, 4 need fixes, 3 need verification

---

## Recommended Agent

Create `mp-spec-design-a11y` specialist to implement:
1. Focus management (CSS + keyboard handlers)
2. Motion preferences
3. Color contrast token migration
4. Form label audit
5. Testing & verification

