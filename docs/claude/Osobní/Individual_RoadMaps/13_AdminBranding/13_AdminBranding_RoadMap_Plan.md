# 13. Admin — Branding — Detailni RoadMap Plan

> **Stav:** 🟢 80% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** Auth (#20) — pro dynamicky customerId
> **Kdo na nem zavisi:** Widget Builder (#12), Widget (#11)

---

## Prehled

Admin stranka kde firma nastavuje svuj brand — logo, nazev firmy, barvy, font. Tyto nastaveni se pouzivaji v kalkulacce a widgetu.

**Hlavni soubor:** `src/pages/admin/AdminBranding.jsx`
**Storage:** `src/utils/adminBrandingStorage.js`

---

## Co je HOTOVO (✅)

### Zakladni branding (88%)
- [x] Logo upload a nahled
- [x] Business name a tagline
- [x] Barvy — primary, secondary, background
- [x] Font vyber
- [x] Live preview
- [x] Plan gating (omezeni podle planu — Starter vs Professional vs Enterprise)
- [x] Corner radius a dalsi detaily
- [x] Persist do tenant storage

### Live preview (75%)
- [x] Zakladni preview jak bude vypadat kalkulacka s nastavenim
- [x] Real-time aktualizace pri zmenach

---

## Co CHYBI / je potreba dodelat

### Faze 1: Odstranit hardcoded customerId (Priorita: VYSOKA)

#### Ukol 1.1: Dynamicky customerId
- **Soubor:** `src/pages/admin/AdminBranding.jsx`
- **Co udelat:**
  - [ ] Najit vsechny vyskyty `test-customer-1` nebo hardcoded customer ID
  - [ ] Nahradit za `getTenantId()` z `adminTenantStorage.js`
  - [ ] Overit ze branding se uklada pod spravnym tenant klicem
- **Ocekavany rozsah:** 3-5 mist ke zmene
- **Zavislost:** Idealne az po zapnuti Auth (#20), ale muze se udelat i ted s `getTenantId()`

### Faze 2: Napojeni na Supabase Storage (Priorita: STREDNI)

#### Ukol 2.1: Logo v Supabase Storage
- **Co udelat:**
  - [ ] Logo se aktualne uklada jako base64 v localStorage → presunout do Supabase Storage bucket `branding`
  - [ ] Upload logo souboru do Supabase Storage
  - [ ] Nacitani logo URL ze Supabase
  - [ ] Fallback na localStorage pokud Supabase neni dostupny
- **Zavislost:** Supabase propojeni (#27)
- **Poznamka:** Bucket `branding` je public — logo musi byt verejne pristupne

### Faze 3: i18n a UX (Priorita: NIZKA)

#### Ukol 3.1: i18n doplneni
- **Co udelat:**
  - [ ] Audit hardcoded textu
  - [ ] Prelozit chybejici texty

#### Ukol 3.2: UX vylepseni
- **Co udelat:**
  - [ ] Lepsi color picker (s prednastavenymi barvami)
  - [ ] Font preview v selectu (kazdy font zobrazen svym stylem)
  - [ ] Branding reset na default

---

## Implementacni poradi

1. **Faze 1** (hardcoded ID) — 1 hodina, UDELAT PRED BETA
2. **Faze 2** (Supabase) — 2-3 hodiny, az po Supabase propojeni (#27)
3. **Faze 3** (i18n/UX) — 1-2 hodiny, nizka priorita

**Celkem pro Beta:** ~1 hodina (jen Faze 1)

---

## Soubory ke zmene

| Soubor | Typ zmeny | Rozsah |
|--------|-----------|--------|
| `src/pages/admin/AdminBranding.jsx` | Hardcoded ID fix | Maly |
| `src/utils/adminBrandingStorage.js` | Pripadne Supabase upload | Stredni |

---

## Poznamky

- **KRITICKE:** Hardcoded `test-customer-1` MUSI byt opraveno pred Beta
- Logo jako base64 v localStorage neni idealni (velke, limit 5MB) — Supabase Storage je lepsi
- Plan gating funguje ale neni napojeny na realne predplatne (az po Stripe)

---

## Kriticke doplnky (z review)

### Logo constraints
- [ ] Maximalni velikost logo souboru: 2 MB (base64 v localStorage = ~2.6 MB)
- [ ] Podporovane formaty: PNG (doporuceny, transparentni pozadi), SVG, JPEG
- [ ] Automaticky resize pri uploadu: max 400x200 px (pro header)
- [ ] Thumbnail generovani: 64x64 px (pro favicon, email header)
- [ ] `mix-blend-mode: lighten` pro logo na tmahem pozadi (Forge theme)

### Supabase Storage migrace — konkretni plan
- [ ] Krok 1: Detekce existujiciho base64 loga v localStorage
- [ ] Krok 2: Konverze base64 → Blob → upload do Supabase Storage (`branding/{tenantId}/logo.png`)
- [ ] Krok 3: Ulozeni URL do branding konfigurace (misto base64)
- [ ] Krok 4: Fallback chain: Supabase URL → localStorage base64 → default placeholder
- [ ] Bucket `branding` je PUBLIC — logo musi byt pristupne bez autentizace (pouziva se ve widgetu)
