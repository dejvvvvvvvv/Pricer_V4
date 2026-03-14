# 171-PE — OTAZKY A ODPOVEDI — Pricing Engine Design Decisions — 2026-03-13

## Metadata
- **ID:** 171-PE
- **Session:** S28
- **Datum:** 2026-03-13
- **Oblast:** Pricing Engine + Checkout Validation
- **Souvisejici ID:** 169-PE, 170-CO

---

## Kontext

Session S28 zahrňovala řešení 8 P1 bugů v pricing engine a checkout systému. Během implementace vznikly design decisions týkající se shipping handleru v displayTotal, per-color pricing architektury, volume guard strategie a mezinárodní validace IČO.

---

## Otazky a odpovedi

### Q1: displayTotal — quote.grandTotal vs quote.simple.grandTotal

- **Ptal se:** Claude (interní analýza)
- **Otazka:** Je quote.grandTotal již zahrnuje shipping fee, nebo je quote.simple.grandTotal bez shipping a máme přidat shipping zvlášť?
- **Odpoved:** quote.grandTotal je finální suma s veškerými poplatky včetně shipping. quote.simple.grandTotal je bez shipping. Přidávání shipping znovu v displayTotal je duplikace.
- **Rozhodnuti:** Usar quote.grandTotal přímo v displayTotal (ne quote.simple.grandTotal + shipping)
- **Dopad:** Uživatelé nyní vidí správnou cenu bez duplikace shipping poplatku

---

### Q2: Per-color pricing — parametrizace getMaterialPricePerGram()

- **Ptal se:** Claude (feature design)
- **Otazka:** Má getMaterialPricePerGram() akceptovat colorKey jako parametr, nebo je color info součástí modelCtx?
- **Odpoved:** color je součást calcBase() output (cfg.color). getMaterialPricePerGram() by měla akceptovat colorKey pro flexibilitu. calcBase() předá cfg.color.
- **Rozhodnuti:** Refactor getMaterialPricePerGram(materialId, colorKey) — parametrizovat colorKey, calcBase() předá cfg.color
- **Dopad:** Podpora per-color pricing, materiály s barevnými variantami mají správné ceny

---

### Q3: per_cm3 volume guard — edge case prevence

- **Ptal se:** Claude (robustnost)
- **Otazka:** Jak bezpečně řešit situaci, kdy volume je 0 nebo nedostupný? Fallback na 0 nebo vyhodit error?
- **Odpoved:** Volume === 0 je legitimní edge case. Fallback na 0 je bezpečnější než error (nekončí výpočet). Guard: `costPerUnit = volume > 0 ? baseCost / volume : 0`
- **Rozhodnuti:** Přidat guard v MODEL i ORDER scope: `volume > 0 ? baseCost / volume : 0`
- **Dopad:** Žádné NaN/Infinity v pricing, UI není rozbité pro edge cases

---

### Q4: Math.random → crypto.randomUUID — security impact

- **Ptal se:** Claude (security practice)
- **Otazka:** Je Math.random() dostatečný pro order ID generaci, nebo je crypto.randomUUID() nutný?
- **Odpoved:** Math.random() má nižší entropii a není k crypto účelům. crypto.randomUUID() je bezpečnější (256-bit entropie vs 53-bit). Best practice pro ID generaci.
- **Rozhodnuti:** Nahradit Math.random() → crypto.randomUUID() v generateOrderNumber()
- **Dopad:** Vyšší bezpečnost ID generace, compliance s security audit (SEC Wave 3)

---

### Q5: ShippingSelector & ExpressTierSelector — i18n scope

- **Ptal se:** Claude (UX feature)
- **Otazka:** Má i18n v ShippingSelector/ExpressTierSelector zahrnout i descriptions a tooltips, nebo jen hlavní labels?
- **Odpoved:** Všechny uživatelské texty by měly být lokalizovány (labels, descriptions, ETAs, price labels). Kompletní i18n.
- **Rozhodnuti:** Přidat useLanguage hook a lokalizovat ALL texty (labels, eta, descriptions, price_per_tier)
- **Dopad:** Komponenty nyní plně fungují v CZ/EN režimu, lepší UX pro anglické uživatele

---

### Q6: IČO validace — mezinárodní rozšíření

- **Ptal se:** Claude (data validation)
- **Otazka:** Má IČO validace zůstat CZ-only (8 číslic), nebo ji rozšířit na mezinárodní formáty (VAT ID, TAX ID)?
- **Odpoved:** CZ-only regex (^\d{8}$) blokuje mezinárodní zákazníky. Liberálnější regex ^[A-Za-z0-9]{5,15}$ pokryje CZ IČO + VAT/TAX ID (UK, EU). Backend by měl mít vlastní validaci.
- **Rozhodnuti:** Rozšířit IČO regex na 5-15 alfanumerických znaků (frontend validation), backend má server-side check
- **Dopad:** Mezinárodní uživatelé mohou nyní completovat checkout, lepší conversion rate

---

## Souhrn rozhodnuti

| # | Tema | Rozhodnuti | Alternativy (pokud byly) | Zdroj |
|---|------|-----------|--------------------------|-------|
| 1 | displayTotal shipping | quote.grandTotal (zahrnuje shipping) | quote.simple.grandTotal + shipping (duplikace) | Q1 |
| 2 | Per-color pricing | getMaterialPricePerGram(colorKey) parametr | Hardcode color v modelCtx | Q2 |
| 3 | Volume guard | volume > 0 ? cost/volume : 0 | Throw error (break computation) | Q3 |
| 4 | Order ID security | crypto.randomUUID() | Math.random() (nižší entropie) | Q4 |
| 5 | i18n scope | ALL texty (labels + descriptions + eta) | Pouze labels (incomplete) | Q5 |
| 6 | IČO validace | 5-15 alfanumerických (mezinárodní) | 8 číslic CZ-only (omezující) | Q6 |

---

## Nerozhodnute otazky

- [ ] Backend validace IČO — doporučuje se server-side check (mimo scope S28)
- [ ] PDF quote branding — archivováno z research pro budoucí sprint
- [ ] Educational tooltips v kalkulačce — priorita pro UX improvement (mimo scope S28)

---

<!-- KONEC SABLONY -->
