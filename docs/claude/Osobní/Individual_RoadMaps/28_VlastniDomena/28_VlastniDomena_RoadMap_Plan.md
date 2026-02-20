# 28. Vlastni domena (modelpricer.com / .cz) — Detailni RoadMap Plan

> **Stav:** 🔴 0% hotovo | **Priorita:** VYSOKA
> **Zavislosti na jine sekce:** Firebase Hosting (#26.4), Backend deploy (#26)
> **Kdo na nem zavisi:** SEO, profesionalni prezentace

---

## Prehled

Registrace vlastni domeny a propojeni s Firebase Hosting pro profesionalni URL misto `projekt.web.app`.

---

## Co je HOTOVO (✅)

Nic. Aktualne pouzivame Firebase default domenu.

---

## Co CHYBI / je potreba dodelat

### Faze 1: Registrace domeny (Priorita: VYSOKA)

#### Ukol 1.1: Vyber registratora a registrace
- **Co udelat:**
  - [ ] Vybrat registratora:
    - **Cloudflare Registrar** — nejlevnejsi, at-cost ceny, dobre DNS
    - **Wedos** — cesky registrator, .cz domeny
    - **Forpsi** — cesky registrator
    - **Google Domains** → Squarespace (prevzato) — drazsi
  - [ ] Zaregistrovat `modelpricer.com` (~$10-15/rok)
  - [ ] Zaregistrovat `modelpricer.cz` (~200-300 Kc/rok)
  - [ ] Overit dostupnost domen
- **? OTAZKA:** `modelpricer.com` nebo `model-pricer.com`? Kontrola dostupnosti.

### Faze 2: DNS a Firebase propojeni (Priorita: VYSOKA)

#### Ukol 2.1: Firebase Hosting custom domain
- **Co udelat:**
  - [ ] V Firebase Console: Hosting → Add custom domain
  - [ ] Pridat `modelpricer.com` a `www.modelpricer.com`
  - [ ] Firebase zobrazi DNS zaznamy k nastaveni:
    - TXT zaznam pro overeni vlastnictvi
    - A zaznamy (IP adresy Firebase)
    - NEBO CNAME zaznam
  - [ ] U registratora: nastavit DNS zaznamy
  - [ ] Cekat na DNS propagaci (0-48 hodin)
  - [ ] Firebase automaticky ziska SSL certifikat (Let's Encrypt)

#### Ukol 2.2: Presmerovani
- **Co udelat:**
  - [ ] `modelpricer.cz` → `modelpricer.com` (301 redirect)
  - [ ] `www.modelpricer.com` → `modelpricer.com` (kanonicky)
  - [ ] NEBO naopak — rozhodnout se co je hlavni domena

#### Ukol 2.3: CORS a backend update
- **Co udelat:**
  - [ ] Pridat `modelpricer.com` do CORS allowed origins na backendu
  - [ ] Pridat do Supabase allowed origins
  - [ ] Pridat do widget domain whitelist
  - [ ] Aktualizovat vsechny env variables s URL

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti |
|---|------|--------|------------|
| 1 | Faze 1: Registrace | 1h | Financni (~$25) |
| 2 | Faze 2: DNS + Firebase | 2-3h | Firebase deploy |

**Celkem:** ~3-4 hodiny + 0-48h cekani na DNS

---

## Poznamky

- Jednoduche — hlavne administrativa
- **TIP:** Cloudflare je nejlevnejsi registrator pro .com domeny
- **TIP:** DNS propagace muze trvat az 48 hodin
- Firebase automaticky resi SSL — zadna rucni konfigurace

---

## Kriticke doplnky (z review)

### Email domena (pro Resend)
- [ ] Pro odesilani emailu z vlastni domeny (ne z `onboarding@resend.dev`):
  - Pridat DNS zaznamy pro Resend (SPF, DKIM, DMARC)
  - SPF: `TXT "v=spf1 include:amazonses.com ~all"` (Resend pouziva AWS SES)
  - DKIM: CNAME zaznamy (Resend vygeneruje pri overeni domeny)
  - DMARC: `TXT "v=DMARC1; p=none; rua=mailto:dmarc@modelpricer.com"`
- [ ] Odeslaici adresa: `orders@modelpricer.com` nebo `noreply@modelpricer.com`
- [ ] Reply-to: `support@modelpricer.com` (konfigurovatelne)

### Subdomeny
- [ ] `app.modelpricer.com` — hlavni aplikace (Firebase Hosting)
- [ ] `api.modelpricer.com` — Cloud Run backend (volitelne, misto Firebase proxy)
- [ ] `widget.modelpricer.com` — widget CDN (volitelne, pro rychlejsi load)
- [ ] `docs.modelpricer.com` — dokumentace pro firmy (post-Beta)

### SSL a bezpecnost
- [ ] Firebase Hosting automaticky ziskava Let's Encrypt certifikat
- [ ] HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] HTTP → HTTPS redirect (Firebase Hosting automaticky)
- [ ] Cloudflare (pokud pouzito jako DNS): zapnout proxy pro DDoS ochranu + CDN
