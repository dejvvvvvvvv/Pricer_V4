# 25. Ucet uzivatele (Account) — Detailni RoadMap Plan

> **Stav:** 🟡 30% hotovo | **Priorita:** NIZKA
> **Zavislosti na jine sekce:** Auth (#20) pro prihlaseni, Stripe (#8) pro platebni historii
> **Kdo na nem zavisi:** Nikdo primo

---

## Prehled

Account stranka kde prihlaseny uzivatel (firma) spravuje svuj profil, vidi platebni historii a spravuje predplatne.

**Hlavni soubor:** `src/pages/account/` (nebo podobny)
**Route:** `/account`

---

## Co je HOTOVO (✅)

### Account stranka (60%)
- [x] Zakladni layout existuje
- [x] Zobrazeni uzivatelskeho profilu

---

## Co CHYBI / je potreba dodelat

### Faze 1: Profil editace (Priorita: STREDNI)

#### Ukol 1.1: Editace profilu
- **Co udelat:**
  - [ ] Formular: nazev firmy, email, telefon
  - [ ] Zmena hesla (Firebase Auth)
  - [ ] Upload profiloveho obrazku
  - [ ] Ulozeni do Firebase Auth + tenant storage

#### Ukol 1.2: Zobrazeni aktualniho planu
- **Co udelat:**
  - [ ] Ktery plan je aktivni (Starter/Professional/Enterprise)
  - [ ] Datum expirace
  - [ ] CTA "Upgradovat plan"

### Faze 2: Platebni historie (Priorita: NIZKA)

#### Ukol 2.1: Stripe Customer Portal
- **Co udelat:**
  - [ ] Stripe Customer Portal integrace — sprava predplatneho
  - [ ] Historie plateb z Stripe API
  - [ ] Stazeni faktur (Stripe Invoice PDF)
- **Zavislost:** Stripe (#8)

### Faze 3: Sprava predplatneho (Priorita: NIZKA)

#### Ukol 3.1: Plan management
- **Co udelat:**
  - [ ] Zmena planu (upgrade/downgrade)
  - [ ] Zruseni predplatneho
  - [ ] Stripe Billing Portal

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti |
|---|------|--------|------------|
| 1 | Faze 1: Profil | 3-4h | Auth (#20) |
| 2 | Faze 2: Platby | 3-5h | Stripe (#8) |
| 3 | Faze 3: Predplatne | 2-3h | Stripe Billing |

**Celkem pro Beta:** ~3-4 hodiny (jen Faze 1)

---

## Poznamky

- Pro Beta staci zakladni profil editace
- Platebni historie az po Stripe integraci
- Stripe Customer Portal resi hodne z toho automaticky

---

## Kriticke doplnky (z review)

### Stripe Customer Portal — detailni integrace
- [ ] Stripe Customer Portal = predpristaveny UI od Stripe pro spravu predplatneho
- [ ] Setup:
  ```javascript
  // Backend endpoint: POST /api/billing/portal
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${FRONTEND_URL}/account`,
  });
  res.json({ url: session.url });
  ```
- [ ] Frontend: tlacitko "Spravovat predplatne" → redirect na Stripe Portal
- [ ] Portal umoznuje: zmena planu, aktualizace karty, zruseni, stazeni faktur
- [ ] Konfigurace v Stripe Dashboard: ktere akce jsou povoleny
- [ ] Stripe automaticky resi proration pri zmene planu

### Account data export (GDPR)
- [ ] Tlacitko "Exportovat moje data" v account page
- [ ] Export obsahuje: profil, objednavky, faktury, konfigurace
- [ ] Format: JSON nebo ZIP s vice soubory
- [ ] GDPR Art. 20 — pravo na prenositelnost dat

### Account deletion (GDPR)
- [ ] Tlacitko "Smazat ucet" s potvrzenim + duvod
- [ ] Mazani: deaktivace uctu → 30-denni grace period → permanentni smazani
- [ ] Notifikace emailem pred permanentnim smazanim
- [ ] Co se maze: profil, konfigurace, presety, branding
- [ ] Co se NEMAZE: dokoncene objednavky (pravni povinnost uchovavat 5 let)
