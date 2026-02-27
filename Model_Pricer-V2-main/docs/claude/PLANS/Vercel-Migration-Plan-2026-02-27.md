# Vercel Migration Plan — ModelPricer Frontend

> **Datum:** 2026-02-27
> **Status:** PRIPRAVENO (ceka na spusteni)
> **Predpoklad:** User ma GitHub osobni ucet, Vercel ucet jeste nema

---

## Architektura po migraci

```
[Prohlizec] --> [Vercel] (React Vite SPA frontend)
                   |
                   +--> [Ubuntu server / Fly.io] (Express + PrusaSlicer backend)
                   |
                   +--> [Supabase] (PostgreSQL databaze)
                   |
                   +--> [Firebase Auth] (autentizace)
```

## Proc Vercel

- Automaticky deploy pri `git push` (zadne rucni `firebase deploy`)
- Preview URL pro kazdou branch/PR (testovani pred mergen)
- Lepsi analytics (bez cookies, GDPR-free)
- WAF zdarma (3 pravidla)
- 100 GB bandwidth zdarma (10x vice nez Firebase Hosting)
- Nativni Vite podpora (zero config)

## Proc backend NEMUZE na Vercel

- PrusaSlicer CLI = ~100-150 MB binarni soubor
- Vercel serverless ma 250 MB bundle limit
- Read-only filesystem (PrusaSlicer potrebuje zapisovat)
- 4.5 MB request body limit (STL soubory jsou vetsi)

---

## Faze 1: Priprava (30 min)

### 1.1 Vytvorit Vercel ucet
- Jdi na https://vercel.com/signup
- Prihlasit pres GitHub (osobni ucet)
- Vybrat Hobby plan (zdarma)

### 1.2 Vytvorit vercel.json
Umisteni: `Model_Pricer-V2-main/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "outputDirectory": "build",
  "buildCommand": "npm run build",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 1.3 Pridat VITE_API_URL do kodu
V `src/lib/apiClient.js` (nebo kde se nastavuje axios baseURL):
```js
const API_BASE = import.meta.env.VITE_API_URL || '';
```
Lokalne: prazdny string (pouzije Vite proxy)
Produkce: `https://api.vasedomena.cz` (nastavi se v Vercel env vars)

---

## Faze 2: Deploy frontend na Vercel (30 min)

### 2.1 Instalace Vercel CLI
```bash
npm i -g vercel
```

### 2.2 Propojeni s uctem
```bash
cd Model_Pricer-V2-main
vercel link
```

### 2.3 Nastaveni env prommenych na Vercel
Pres Vercel dashboard (Settings -> Environment Variables):
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_API_URL (URL backendu)

### 2.4 Prvni deploy
```bash
vercel --prod
```

### 2.5 Overeni
- Otevrit URL z vystupu v prohlizeci
- Overit ze stranky se nacitaji
- Login/register nebude fungovat dokud backend neni online

---

## Faze 3: Backend na Ubuntu serveru (1-2 hodiny)

### 3.1 Priprava Ubuntu
```bash
# Instalace Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalace PrusaSlicer CLI
sudo apt-get install -y prusa-slicer
# NEBO stahnout z https://github.com/prusa3d/PrusaSlicer/releases

# Instalace nginx (reverse proxy + HTTPS)
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 3.2 Deploy backendu
```bash
# Na Ubuntu serveru
mkdir -p /opt/modelpricer
cd /opt/modelpricer

# Kopie backend souboru (scp z Windows nebo git clone)
scp -r backend-local/ user@ubuntu-ip:/opt/modelpricer/

# Instalace zavislosti
cd /opt/modelpricer/backend-local
npm install

# Env variables
cp .env.example .env
# Upravit .env s produknimi hodnotami
```

### 3.3 Nastaveni HTTPS (nginx + certbot)
```nginx
# /etc/nginx/sites-available/modelpricer-api
server {
    listen 80;
    server_name api.vasedomena.cz;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/modelpricer-api /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.vasedomena.cz
```

### 3.4 Autostart (systemd)
```ini
# /etc/systemd/system/modelpricer-backend.service
[Unit]
Description=ModelPricer Backend
After=network.target

[Service]
Type=simple
User=modelpricer
WorkingDirectory=/opt/modelpricer/backend-local
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/modelpricer/backend-local/.env

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable modelpricer-backend
sudo systemctl start modelpricer-backend
```

### 3.5 CORS nastaveni na backendu
V `.env`:
```
CORS_ORIGINS=https://vasedomena.cz,https://www.vasedomena.cz,https://modelpricer.vercel.app
```

---

## Faze 4: Custom domena (volitelne, 30 min)

### 4.1 Frontend domena
- Vercel Dashboard -> Settings -> Domains
- Pridat `vasedomena.cz`
- Nastavit DNS (CNAME nebo A record dle instrukci Vercelu)

### 4.2 Backend subdomena
- DNS: `api.vasedomena.cz` -> IP vaseho Ubuntu serveru
- Certbot uz vygeneroval SSL v kroku 3.3

---

## Co se NEZMENI

- Zadny React kod (komponenty, routing, pages)
- Firebase Auth (funguje z jakehokoliv hostu)
- Supabase (externi HTTP volani, funguje vsude)
- Admin panel (vsechny stranky zustavaji)
- Widget (funguje pres postMessage, nezavisi na hostu)
- Pricing engine (ciste frontend vypocty)
- Storage helpery (localStorage + Supabase, nezavisi na hostu)

## Co se zmeni

- `vercel.json` (novy soubor)
- `apiClient.js` — pridani VITE_API_URL
- `.env` na backendu — CORS_ORIGINS
- Deploy proces: `git push` miste `firebase deploy`

---

## Alternativa k Ubuntu: Fly.io

Pokud se nechce spravovat server rucne:
```bash
# V backend-local/
fly launch
fly deploy
```
Cena: ~$5-10/mesic, automaticke HTTPS, zero-maintenance.

---

## Casovy odhad

| Faze | Cas | Predpoklady |
|------|-----|-------------|
| Priprava | 30 min | Vercel ucet existuje |
| Frontend deploy | 30 min | Build prochazi |
| Backend Ubuntu | 1-2 hod | SSH pristup, domena |
| Custom domena | 30 min | DNS pristup |
| **Celkem** | **~3-4 hod** | |

## Rizika

| Riziko | Reseni |
|--------|--------|
| Build failure na Vercelu | Lokalne `npm run build` pred pushem |
| CORS chyby | Spravne CORS_ORIGINS v backend .env |
| PrusaSlicer nefunguje na Ubuntu | Overit cestu v .env, otestovat `prusa-slicer --help` |
| Velke STL soubory | nginx `client_max_body_size 100M` |
