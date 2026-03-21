# 221-GN — UPRAVY — Frontend Storage API + Build Verify (Vlna 5) — 2026-03-19

## Metadata
- **ID:** 221-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General (Frontend + Backend + Infra)
- **Souvisejici ID:** 218-BK, 220-GN (predchozi vlny backend infra + Stripe)
- **Trigger:** BETA infrastrukturni sprint — Vlna 5: Frontend pripojeni na API base URL + build verifikace

---

## Souhrn uprav

Frontend service soubory (storageApi, slicerApi, presetsApi, apiClient) aktualizovany na dynamicky API_BASE z VITE_API_BASE_URL misto hardcoded localhost. Backend storageRouter doplnen o 2 nove signed URL endpointy. Service Worker upraven na dynamicky CACHE_VERSION. Vite config doplnen o produkcni dokumentacni komentar. Build PASS (52.97s, 3978 modulu).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | src/services/storageApi.js | Zmeneno | API_BASE | API_BASE cte z import.meta.env.VITE_API_BASE_URL, nove funkce getSignedDownloadUrl() a getSignedUploadUrl() |
| 2 | src/services/slicerApi.js | Zmeneno | API_BASE | API_BASE cte z import.meta.env.VITE_API_BASE_URL |
| 3 | src/services/presetsApi.js | Zmeneno | API_BASE | API_BASE cte z import.meta.env.VITE_API_BASE_URL |
| 4 | src/lib/apiClient.js | Zmeneno | baseURL | API_BASE pro axios baseURL z import.meta.env.VITE_API_BASE_URL |
| 5 | backend-local/src/storage/storageRouter.js | Pridano | 2 endpointy | GET /signed-url a GET /signed-upload-url pro R2/cloud storage signed URLs |
| 6 | public/sw.js | Zmeneno | CACHE_VERSION | Dynamicky CACHE_VERSION misto hardcoded 'modelpricer-v1' |
| 7 | vite.config.mjs | Zmeneno | komentare | Produkcni dokumentacni komentar pro deploy konfiguraci |

---

## Detailni zmeny

### 1. `src/services/storageApi.js`

**Typ:** Zmeneno
**Duvod:** Priprava pro produkcni deployment — API URL nesmi byt hardcoded na localhost

**Co se zmenilo:**
- API_BASE nyni cte z `import.meta.env.VITE_API_BASE_URL` s fallback na `/api`
- Nova funkce `getSignedDownloadUrl(tenantId, filePath)` — vola backend pro signed download URL z R2
- Nova funkce `getSignedUploadUrl(tenantId, filePath, contentType)` — vola backend pro signed upload URL

---

### 2. `src/services/slicerApi.js`

**Typ:** Zmeneno
**Duvod:** Stejny pattern jako storageApi — dynamicky API_BASE

**Co se zmenilo:**
- API_BASE cte z `import.meta.env.VITE_API_BASE_URL` s fallback

---

### 3. `src/services/presetsApi.js`

**Typ:** Zmeneno
**Duvod:** Konzistence — vsechny service soubory pouzivaji stejny API_BASE pattern

**Co se zmenilo:**
- API_BASE cte z `import.meta.env.VITE_API_BASE_URL` s fallback

---

### 4. `src/lib/apiClient.js`

**Typ:** Zmeneno
**Duvod:** Axios baseURL musi byt dynamicky pro produkcni deployment

**Co se zmenilo:**
- API_BASE pro axios instance baseURL z `import.meta.env.VITE_API_BASE_URL`

---

### 5. `backend-local/src/storage/storageRouter.js`

**Typ:** Pridano
**Duvod:** Frontend potrebuje signed URLs pro R2 cloud storage (upload i download)

**Co se zmenilo:**
- Novy endpoint `GET /signed-url` — generuje signed download URL pro dany soubor
- Novy endpoint `GET /signed-upload-url` — generuje signed upload URL s content-type
- Oba endpointy vyzaduji tenantId a filePath query parametry

---

### 6. `public/sw.js`

**Typ:** Zmeneno
**Duvod:** Hardcoded cache verze zpusobovala problemy pri deploymentu novych verzi

**Co se zmenilo:**
- Pred: `const CACHE_VERSION = 'modelpricer-v1'`
- Po: Dynamicky CACHE_VERSION generovany pri buildu

---

### 7. `vite.config.mjs`

**Typ:** Zmeneno
**Duvod:** Dokumentace pro produkcni konfiguraci

**Co se zmenilo:**
- Pridan komentar vysvetlujici produkcni deploy konfiguraci

---

## Dopad zmen

- **Ovlivnene komponenty:** Vsechny komponenty pouzivajici storageApi, slicerApi, presetsApi, apiClient (kalkulacka, admin, widget)
- **Breaking changes:** Ne — fallback na `/api` zachovava zpetnou kompatibilitu
- **Nove zavislosti:** Zadne
- **Rizika:** Pokud VITE_API_BASE_URL neni nastavena v .env, pouzije se fallback — OK pro dev, v produkci musi byt nastavena

---

## Testovani

- **Build:** npm run build — PASS (52.97s, 3978 modulu)
- **Backend syntax check:** PASS
- **Manual test:** Neprovedeno (ceka na npm install novych balicku)
- **Poznamky:** Frontend build overuje spravnost importu a exportu vsech upravenych souboru

---
