# Cloud Run — Jak to funguje a jak se resi requesty

> Jednoduchy popis pro pochopeni. Zadne zbytecne detaily.

---

## Co je Cloud Run?

Cloud Run je sluzba od Googlu ktera spousti tvuj backend kod v Docker kontejnerech.
Nemusis mit vlastni server. Google se stara o vsechno — ty jen das svuj kod a on ho spusti.

**Klicova vec:** Platis JEN kdyz tvuj kod skutecne bezi. Kdyz nikdo nepouziva tvuj web, platis 0 Kc.

---

## Jak funguje v nasem projektu?

```
Zakaznik v prohlizeci (tvuj web na Firebase)
    |
    |-- otevre stranku, vybere model, klikne "Slicovat"
    |
    v
Firebase Hosting preroutuje pozadavek:
    |
    |-- /api/slice/**  --> Cloud Run (tezky kontejner s PrusaSlicer)
    |-- /api/**        --> Cloud Functions (lehky, pro jednoduche veci)
```

**Cloud Run pouzivame JENOM na slicovani** protoze je to narocne na CPU.
Vsechno ostatni (ukladani objednavek, admin data, atd.) jde pres levnejsi Cloud Functions.

---

## Jak se resi requesty na Cloud Run?

### Princip: Kazdy request = vlastni kontejner

Kdyz zakaznik posle model na slicovani, stane se toto:

```
1. Zakaznik klikne "Slicovat"
   └─> Posle se request na /api/slice

2. Cloud Run VYTVORI novy kontejner (nebo pouzije uz bezici)
   └─> Kontejner ma: 4 CPU, 2 GB RAM, PrusaSlicer nainstalovany

3. Kontejner zpracuje model
   └─> PrusaSlicer bezi, generuje gcode, parsuje metriky

4. Kontejner vrati vysledek
   └─> { printTime: "2h 15min", filament: "45g", ... }

5. Kontejner se VYPNE (pokud nikdo dalsi neslicuje)
   └─> Od ted platis 0 Kc
```

### Co kdyz pouziva vic lidi najednou?

```
Zakaznik A posle model  --> Kontejner 1 (4 CPU, 2 GB) --> slicuje model A
Zakaznik B posle model  --> Kontejner 2 (4 CPU, 2 GB) --> slicuje model B
Zakaznik C posle model  --> Kontejner 3 (4 CPU, 2 GB) --> slicuje model C

Kazdy zakaznik ma SVUJ VLASTNI kontejner.
Nesdili CPU ani RAM. Nepredbiha se. Vsichni bezi paralelne.
```

**Dulezite:** 4 CPU + 2 GB je PER KONTEJNER, ne celkove.
15 zakazniku najednou = 15 kontejneru, kazdy s 4 CPU + 2 GB.

### Omezeni

Mas nastaveny limit `--max-instances` (napr. 20).
Pokud prijde 21. zakaznik, jeho pozadavek ceka ve fronte nez se jeden kontejner uvolni.

---

## Jak se to ceni?

### Hlavni pravidlo: Platis jen za cas kdy kontejner SKUTECNE BEZI

- Uctuje se po **100ms intervalech** (ne za hodiny)
- Kdyz kontejner bezi 2 minuty a 300ms → platis za 2 minuty a 300ms
- Kdyz nikdo neslicuje → platis **0 Kc**

### Co se uctueje:

| Polozka | Priblizna cena |
|---------|---------------|
| CPU | ~0.0000240 USD za 1 vCPU za sekundu |
| RAM | ~0.0000025 USD za 1 GB za sekundu |
| Request | ~0.40 USD za milion requestu |

### Priklad — 1 model:

```
Slicing trva 2 minuty (120 sekund), konfigurace 4 vCPU + 2 GB RAM:

CPU:  120s x 4 vCPU x $0.0000240 = $0.01152  (~0.27 Kc)
RAM:  120s x 2 GB  x $0.0000025 = $0.00060  (~0.01 Kc)

1 model = cca 0.28 Kc
```

### Priklad — 300 modelu denne (1 mesic):

```
CPU:  300 x 120s x 4 x 30 x $0.0000240 = ~$104/mesic
RAM:  300 x 120s x 2 x 30 x $0.0000025 = ~$5/mesic

Celkem: ~$109/mesic (~2 500 Kc)
```

### Free tier (zdarma kazdy mesic):

- 180 000 vCPU-sekund
- 360 000 GB-sekund
- 2 000 000 requestu

To pokryje zhruba **prvnich 50 modelu denne zdarma**.

---

## Cloud Run vs Cloud Functions — proc dva?

| | Cloud Run (slicer) | Cloud Functions (API) |
|---|---|---|
| **Ucel** | Slicovani modelu (PrusaSlicer) | Vsechno ostatni |
| **CPU** | 4 vCPU (hodne) | 0.17 vCPU (malo) |
| **RAM** | 2 GB | 256 MB |
| **Cena za request** | Draha (~0.28 Kc) | Skoro nic |
| **Free tier** | 180k vCPU-sec | 2M volani/mesic |
| **Kdy bezi** | Jen pri slicovani | Pri kazdem API volani |

**Proc nechceme slat vsechno pres Cloud Run:**
Ukladani objednavky do databaze trva 50ms a nepotrebuje 4 CPU.
Kdyby to slo pres Cloud Run, zbytecne bys platil za tezky kontejner.

Cloud Functions jsou super lehke — pro jednoduche databazove operace jsou skoro zdarma.

---

## Co se deje s requesty — cely flow

```
KROK 1: Zakaznik nahraje STL soubor
  Browser --> POST /api/upload --> Cloud Functions
  Cloud Functions ulozi soubor do Supabase Storage
  Vrati: { fileId: "abc-123" }

KROK 2: Zakaznik klikne "Slicovat"
  Browser --> POST /api/slice --> Cloud Run
  Cloud Run stahne soubor ze Supabase Storage
  Spusti PrusaSlicer CLI
  Ulozi gcode do Supabase Storage
  Vrati: { jobId: "xyz-789", status: "processing" }

KROK 3: Browser kontroluje stav (kazdych 2s)
  Browser --> GET /api/slice/jobs/xyz-789 --> Cloud Run (nebo Functions)
  Vrati: { status: "processing", progress: 45 }
  ...
  Vrati: { status: "completed", metrics: { printTime: "2h", ... } }

KROK 4: Zakaznik objedna
  Browser --> POST /api/orders --> Cloud Functions
  Cloud Functions ulozi objednavku do Supabase DB
  Vrati: { orderId: "ord-456" }
```

**Vsimni si:** Cloud Run se pouziva JENOM v kroku 2 (slicovani).
Vsechno ostatni jde pres levne Cloud Functions.

---

## Jak poznam ze Cloud Run funguje spravne?

1. **Google Cloud Console** > Cloud Run > tvoje sluzba > Metrics
   - Vidis pocet requestu, dobu odezvy, chyby
2. **Logy** > Cloud Run > Logs
   - Vidis co kazdy kontejner vypsal (console.log)
3. **Health check** > `GET /api/health`
   - Melo by vratit `{ status: "ok", prusaslicer: true }`

---

## Kroky pro implementaci

### Pred implementaci potrebuji od tebe:
- [ ] Google Cloud Project ID
- [ ] Region (doporucuji `europe-west1`)
- [ ] Nainstalovany `gcloud` CLI + `docker`
- [ ] PrusaSlicer .ini profily (exportovane)
- [ ] Firebase Project ID (musi byt stejny jako GCloud projekt)

### Kroky implementace:
1. **Vytvorit Dockerfile** — kontejner s Node.js + PrusaSlicer
2. **Napsat Express.js API** — upload, slice, jobs endpointy
3. **Lokalni test** — spustit Docker kontejner na tvem PC
4. **Deploy na Cloud Run** — `gcloud run deploy`
5. **Propojit Firebase Hosting** — firebase.json rewrite pravidla
6. **Otestovat end-to-end** — upload > slice > vysledek

---

*Posledni aktualizace: 2026-02-14*
