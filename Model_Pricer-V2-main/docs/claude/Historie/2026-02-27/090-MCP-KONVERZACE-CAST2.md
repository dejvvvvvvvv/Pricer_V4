# 090-MC KONVERZACE — Cast 2

> **Session:** S01 (2026-02-27) — pokracovani
> **Typ:** KONVERZACE
> **ID:** 090-MC (cast 2)

---

## Uzivatel — Zprava 7

> Nejprve uloz historii pres agenta! a uloz to na spravne miste a pouzij spravne sablony aby vse bylo prehledne v historii
> Dale -
> muzeme ten backend dat na muj lokalni ubuntu server? a dokazal by jsi se tam potom prihlasovat pres ssh aby jsi tam mohl delat zmeny?
> A Potom by jsme tedy pouzivaly ten cloude run pro slicovani prusasliceru v projektu, nebo bude lepsi to dat na neco jako fly.io atd.? jako ten lokalni ubuntu server je jakoby zdarma ale rekni ty co bude lepsi
> To API proxy moc nechapu, neboli chapu ze se API bude asi volat jinym zpusobem ale i tak to moc nechapu jelikoz nejsem moc technicky typ a nemam moc zkusenosti s temito vecmi tak mi to popis jednoduse
> Udelej jednodussi plan pro tu vercel migraci aby jsme se k tomu mohly vratit
> Github je osobni
> A vercel ucet zatim jeste nemam
> A vse mi kdyztak vysvetli jednoduse
> Napis mi to vse a uloz to do historie aby jsem na to mohl navazat v dalsim chatu po restartu

## Claude — Odpoved 7

### 1. Backend na Ubuntu serveru — Jednoduche vysvetleni

**ANO, muzes si backend behem na svem Ubuntu serveru.** To je super veci:
- Zdarma (nepotrebis placit cloud providera)
- Mam plnou kontrolu (muzes si zmenit cokoliv)
- Fyzicky na tveho internetu

**SSH pristup pro Claude:** Claude (ja) momentalne nema primy SSH klient v nastroji. Muzu pouzit `ssh` prikaz pres Bash tool, ale je to limitovane (nejsem schopen drzet dlouhodobou SSH session ani editovat soubory interaktivne). To znamena:
- Jednoduce prikazy: ANO (instalace, restartovani, checking status)
- Dlouhodobou spravu: radsi ne
- Editaci souboru: lepsi jsi to udelaj samy nebo pres SCP

Doporuceni: Ja pripravim instrukce, ty je spustis. Je to bezpecnejsi pro tvou infrastrukturu.

---

### 2. Ubuntu vs Cloud Run vs Fly.io — Srovnani pro lajka

Predstav si to takto:

| **Ubuntu (tvuj server)** | **Fly.io** | **Cloud Run** |
|---|---|---|
| Jako: Mam vlastni domecu | Jako: Najimam pronajmu bytu | Jako: Serverless taxi |
| Cena | Zdarma (internet uz platis) | ~$5-10/mesic | ~$1-5/mesic (zavis na pouziti) |
| Protoze | Tvuj laptop/NAS/server ktery uz maji | Maly server vkloubenem datoveho centra | Placis jen pouzitou dobu |
| Sprava | Ty servis, updates, backup | Oni servis, ty jen deploy kod | Oni servis vse |
| Prestanou | Kdyz vypnes internet | Vzdy online pokud platis | Vzdy online pokud platis |
| Best pro | Testovani, malych projekt | Startup s minimalnim IT | Busy aplikace se shluky zatizeni |

**Doporuceni pro tebe:** Zacni s Ubuntu (zdarma, muzes testovat). Kdyż budou platici zakaznici a Ubuntu by byl problem (struj, vypady), prejdes na Fly.io nebo Cloud Run.

---

### 3. API Proxy — Super jednoduche vysvetleni

**Tyhle:**
- Tvuj prohlizec (v Itarii) → Tvuj laptop (localhost:4028 frontend) → Tvuj laptop (localhost:3001 backend) — vse na jednom miste

**Po migraci:**
- Tvuj prohlizec (v Itarii) → Vercel (serverless frontend na Vercelove siti) → Tvuj Ubuntu server (backend na tveho internetu) — dve ruzne mista

**Problema:** Vercel nevi kam poslat API pozadavky (na koji server?). **Reseni:** Nova env promenna:

```
VITE_API_URL = "https://api.tvoje-domena.cz"
```

Kod:
```javascript
const API_URL = import.meta.env.VITE_API_URL || '';
// Na tvem laptopi: VITE_API_URL = "" (prazdne = localhost:3001 pres Vite proxy)
// Na Vercelu: VITE_API_URL = "https://api.tvoje-domena.cz" (Tvuj Ubuntu server)
```

**Prakticky:** Frontend se pta: "Kde je muj backend?" Odpoved je v env promenne. To je vse.

---

### 4. Vercel migrace — Jednodussi plan

Vytvoril jsem plan: `docs/claude/PLANS/Vercel-Migration-Plan-2026-02-27.md`

**Shrnutí v 4 krocich:**

**Krok 1: Priprava (30 minut)**
- Jdes na vercel.com, prihlasis se pres GitHub
- Vytvoris soubor `vercel.json` (konfiguraci pro Vercel)
- Pridat `VITE_API_URL` do kodu

**Krok 2: Deploy frontend (30 minut)**
- `npm i -g vercel` (stahnes Vercel utility)
- `vercel link` (pripojis se)
- `vercel --prod` (vyslav frontend na Vercel)
- Hotovo! Frontend je online na `neco.vercel.app`

**Krok 3: Backend na Ubuntu (1-2 hodiny)**
- Node.js + PrusaSlicer na Ubuntu
- Nginx pro bezpecny HTTPS
- Systemd aby se restartoval sam pri vypadku
- Backend posloucha na `https://api.tvoje-domena.cz`

**Krok 4: Custom domena (30 minut, volitelne)**
- Pokud chces `tvoje-domena.cz` miste `neco.vercel.app`
- DNS nastaveni (CNAME/A record)

**Celkem: ~3-4 hodiny, vetsi casti je cekani na instalace.**

---

### 5. Odpoved na specifika

**GitHub je osobni:**
- Super! Vercel Hobby plan pracuje se standardnim GitHub. Zadny problem.

**Vercel ucet zatim nemas:**
- Vytvoris na vercel.com pri prvnim logu pres GitHub. Je to instant.

**Jednoduche vysvetleni:**
- Frontend na Vercelu = mozny pristup kdekoliv (z auta, z dovolene, z kolegova pocitace)
- Backend na Ubuntu = byva dostupny jen kdyz je server online
- Vysledek: Profesional app bez slozitych serveru, ale s kontrolou nad backendem

---

## Stav na konci session S01 — Cast 2

### Nove dokumenty ulozene
1. **Plan:** `docs/claude/PLANS/Vercel-Migration-Plan-2026-02-27.md` — detailni instrukce s 4 fazemi
2. **Historie:** `docs/claude/Historie/2026-02-27/090-MCP-KONVERZACE-CAST2.md` — tato cást

### Rozhodnuti uzivatele
- Backend na Ubuntu serveru (zdarma, radi se vratis na Fly.io vs Cloud Run)
- Vercel pro frontend (moderniste deploy, preview URLs)
- API proxy pres VITE_API_URL env promenna

### Otazky pro dalsich session
1. **Kdy spustit migraci?** Je plan jasny, chces ho zkusit ted nebo pozdeji?
2. **SSH pristup pro Claude:** Pripravit instrukcni soubor ktory muzes spoustet nebo pridat MCP server pro SSH?
3. **Custom domena:** Mas si uz vybranou domenu nebo si ji jeste vyhledavas?

### Klicovy nastroje
- **Vercel CLI:** `npm i -g vercel` (povinne pre deploy)
- **Ubuntu:** Node.js 22 + PrusaSlicer + nginx + systemd
- **Supabase + Firebase:** Existujici, migrujeme jen frontend/backend hosty
