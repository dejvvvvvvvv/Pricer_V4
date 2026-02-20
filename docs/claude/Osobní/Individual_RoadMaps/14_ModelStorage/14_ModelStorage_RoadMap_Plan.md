# 14. Model Storage (souborovy manazer) — Detailni RoadMap Plan

> **Stav:** 🟡 55% hotovo | **Priorita:** STREDNI
> **Zavislosti na jine sekce:** Orders (#7) pro napojeni, Supabase (#27) pro cloud storage, Backend (#26) pro upload
> **Kdo na nem zavisi:** Orders (#7) — stazeni modelu/G-code z objednavky

---

## Prehled

Drive-like souborovy manazer pro spravu 3D modelu, G-code a dokumentu. UI je z velke casti hotove, ale soubory jsou lokalni (ne v cloudu) a napojeni na objednavky je castecne.

**Hlavni soubor:** `src/pages/admin/ModelStorage.jsx` (nebo podobny)
**Storage API:** `src/utils/storageApi.js`

---

## Co je HOTOVO (✅)

### Drive-like rozhrani (75%)
- [x] Folder tree — slozky a podslozky
- [x] File list — zobrazeni souboru
- [x] Upload souboru
- [x] Download souboru a ZIP
- [x] Soft delete (kos)
- [x] Vyhledavani
- [x] Breadcrumb navigace
- [x] Preview (zakladni)

---

## Co CHYBI / je potreba dodelat

### Faze 1: Napojeni na objednavky (Priorita: STREDNI)

#### Ukol 1.1: Automaticke ukladani po objednavce
- **Co udelat:**
  - [ ] Po potvrzeni objednavky: vytvorit slozku `Orders/ORD-2026-00001/`
  - [ ] Ulozit nahrany 3D model do teto slozky
  - [ ] Ulozit G-code (po slicovani) do teto slozky
  - [ ] Ulozit order metadata (JSON s konfigurace)
  - [ ] Pouzit existujici `saveOrderFiles` funkci ze `storageApi`

#### Ukol 1.2: Propojeni s Order detail modalem
- **Co udelat:**
  - [ ] V Order detail modalu: tlacitko "Stahnout model"
  - [ ] V Order detail modalu: tlacitko "Stahnout G-code"
  - [ ] Link na slozku v Model Storage

### Faze 2: Supabase Storage (Priorita: STREDNI)

#### Ukol 2.1: Presun na cloud storage
- **Co udelat:**
  - [ ] Upload souboru do Supabase Storage (bucket `models` a `documents`)
  - [ ] Download pres Signed URLs (docasne URL s expiraci)
  - [ ] Migrace existujicich lokalnich souboru do Supabase
  - [ ] Fallback na lokalni storage pokud Supabase neni dostupny

### Faze 3: Pokrocile (post-Beta)

#### Ukol 3.1: Sdileni souboru
- **Co udelat:**
  - [ ] Generovani verejneho linku na soubor
  - [ ] Expirace sdileneho linku
  - [ ] Password-protected sdileni

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti |
|---|------|--------|------------|
| 1 | Faze 1: Objednavky | 3-5h | Orders (#7) |
| 2 | Faze 2: Supabase | 3-5h | Supabase (#27) |
| 3 | Faze 3: Sdileni | post-Beta | - |

**Celkem pro Beta:** ~6-10 hodin

---

## Poznamky

- Pro Beta staci lokalni storage — Supabase migrace muze byt pozdeji
- Napojeni na objednavky je dulezitejsi nez cloud storage pro Beta
- **? OTAZKA:** Maji se soubory mazat po X dnech? Nebo nechat navzdy?

---

## Kriticke doplnky (z review)

### Souborova struktura v Supabase Storage
- [ ] Navrzena hierarchie:
  ```
  models/
    {tenantId}/
      {orderId}/
        original/          — puvodni nahrany model (.stl, .obj, .3mf)
        processed/         — zpracovany model (opraveny, oriented)
  documents/
    {tenantId}/
      {orderId}/
        gcode/             — vygenerovany G-code
        metadata/          — order JSON, pricing snapshot
  branding/
    {tenantId}/
      logo.png             — logo firmy (public bucket)
  ```

### Retencni politika
- [ ] Aktivni objednavky: soubory zustavaji navzdy
- [ ] Dokoncene objednavky: soubory zustavaji 90 dnu (konfigurovatelne v admin)
- [ ] Zrusene objednavky: soubory se smazou po 30 dnech
- [ ] Automatic cleanup cron job (Cloud Scheduler + Cloud Function)
- [ ] Varovani firme 7 dnu pred smazanim
- [ ] Moznost prodlouzit retenci (Premium feature)

### Velikostni limity
- [ ] Maximalni velikost jednoho souboru: 100 MB (STL modely mohou byt velke)
- [ ] Maximalni celkovy storage per-tenant: 5 GB (Starter), 50 GB (Professional), neomezeny (Enterprise)
- [ ] Zobrazeni pouziteho uloziste v admin (progress bar)
- [ ] Supabase Storage free tier: 1 GB, Pro: 100 GB ($0.021/GB navic)
