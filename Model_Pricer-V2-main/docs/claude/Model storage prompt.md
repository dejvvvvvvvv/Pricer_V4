PROMPT — Claude Code (Opus) — Implementace “Model Storage” + propojení Orders/Calculator/Backend + robustní ukládání modelů, Gcode a preset snapshotů
Verze: MP_ModelStorage_Orders_Integration_v1

ROLE
Jsi senior full-stack engineer + architekt pro SaaS “ModelPricer / Pricer V3” (React/Vite frontend, Node backend, PrusaSlicer CLI). Tvým úkolem je navrhnout a následně implementovat komplexní a robustní systém “Model Storage” (Drive-like UI) pro ukládání objednaných modelů, G-code a preset snapshotů, plně propojený s kalkulačkou a Admin Orders. Důraz na správnost dat (žádné špatné presety), bezpečnost, audit, škálovatelnost a moderní UX.

CÍL (HIGH LEVEL)
1) Vytvořit novou admin stránku: “Model Storage” — rozhraní ve stylu Google Drive.
2) Zajistit end-to-end workflow: zákazník nahraje model → vybere parametry/preset → proběhne finální slicování → objednávka → vytvoření Order folderu v Model Storage → uložení relevantních souborů (model + gcode + preset snapshot + metadata).
3) Rozšířit Admin Orders:
   - Přehled objednávek + detail v modalu se sekcemi: Customer / Shipping / Items+Files.
   - V Items+Files odkaz “Open order folder” → přesměruje do Model Storage a otevře konkrétní složku objednávky.
4) Analytics oddělit od objednávkových dat:
   - Všechny “nefinální slicy” (experimenty) posílat jen do analytiky, ne do storage.
   - Do storage ukládat pouze finální relevantní soubory pro objednávku.

KONTEKST (zjednodušeně)
- Multi-tenant SaaS: každý tenant (firma) má svůj admin a své uložené soubory.
- Kalkulačka / widget je embed (iframe). Slicing (ostrý) přes PrusaSlicer CLI na backendu.
- Admin Orders existuje (demo), ale je potřeba ho rozšířit o detailní modal + link do Model Storage.
- Cíl: uložit objednané modely + vygenerované G-code + přesný preset (.ini), který byl použit pro finální slic.

P0 PRAVIDLA (KRITICKÉ)
- Žádné generické řešení, žádné “TODO” bez plánu.
- Žádné refactory mimo scope; minimal changes.
- Dodržet tenant izolaci (souborová data, metadata, přístupy).
- U objednávek: ukládat jen FINÁLNÍ relevantní soubory (žádné experimenty).
- Preset musí být VŽDY správný: ukládat “snapshot” (kopii) finálního .ini použitého pro finální slic.
- Složky objednávek musí být dohledatelné přes neměnné interní ID (orderFolderId/hash), ne jen přes název.
- Bezpečné stahování: preferovat signed URL + audit log.
- Moderní, udržitelné, dobře dokumentované open-source knihovny (licence kompatibilní s privátním kódem).

--------------------------------------------------------------------------------
A) DATA INTEGRITA — Kritické věci pro správnost dat (aby preset/Gcode nikdy nebyl špatně)
--------------------------------------------------------------------------------
A1) Preset snapshot per model (povinné)
- Při finálním checkoutu/objednávce se uloží PŘESNÁ kopie preset .ini použitého pro finální slic.
- Neodkazovat jen na “presetId” v adminu (protože se může změnit). Uložit:
  - preset_snapshot_ini (raw text / uložený soubor)
  - presetId (pokud existuje)
  - presetVersion nebo updatedAt (pokud existuje)
  - presetSHA256 (hash obsahu ini)
- Každý model v objednávce má svůj vlastní preset snapshot (i když je to stejný preset, uložit se může jednou a referencovat, ale integritně).

A2) Slicer audit balíček (povinné)
- Uložit metadata o slicování:
  - prusaSlicerVersion
  - timestamp
  - slicer commandline (string)
  - slicer stdout/stderr log (nebo zkrácený)
  - výstupy: estimated_print_time, filament_grams, volume, etc.
- Doporučení: uložit jako JSON do /meta/slicer_run.json + /meta/slicer_commandline.txt.

A3) Checksumy souborů (povinné)
- Uložit SHA256 (nebo blake3) pro:
  - originální model file
  - gcode file
  - preset snapshot ini file
- Uložit i velikost souboru a mime/type.

A4) Immutable order folder identity (povinné)
- Každá objednávka má:
  - orderId (display: číslo objednávky)
  - orderFolderId (immutable internal id, UUID / hash)
  - orderFolderSlug (např. "#12345__AB12CD", kde AB12CD = short hash)
- UI může zobrazovat hezký název, ale linkování a lookup musí používat orderFolderId.

A5) Read-only Orders složky (doporučeno)
- Orders foldery jsou “immutable” (nepřepisovat / nemazat bez admin oprávnění).
- Firma může ukládat vlastní soubory do “Company Library”.

--------------------------------------------------------------------------------
B) STRUKTURA SLOŽEK — navržená organizace (Drive-like, ale deterministická)
--------------------------------------------------------------------------------
B1) Root složky (tenantscope)
- Orders/                     (default, povinné)
- Company Library/            (default, povinné)
- Trash/                      (soft delete, povinné)
- Exports/                    (volitelně)

B2) Struktura objednávky (povinné)
Orders/
  #<orderNumber>__<shortId>/             (display)
    models/
      <original_filename>.<ext>
    gcode/
      <modelName>__<variant>.gcode
    presets/
      <modelName>__final_preset.ini
    meta/
      order.json
      slicer_run_<modelId>.json
      checksums.json
      logs_<modelId>.txt
    renders/                            (volitelně)
      <modelId>.png

B3) Trash / retention (povinné)
- Smazání ve Storage = přesun do Trash.
- Trash auto-cleanup po 30 dnech.

--------------------------------------------------------------------------------
C) UX/FEATURES Model Storage (Drive-like UI)
--------------------------------------------------------------------------------
C1) MVP funkce (povinné)
- Breadcrumb navigace + back/forward.
- Search bar (název, metadata).
- List view (tabulka) + sorting (name/date/size/type).
- Kontext menu (rename, move, delete, download).
- Upload do Company Library (Orders složky typicky read-only).
- Multi-select pro bulk akce (minimálně download zip / move / delete).

C2) Doporučené “profi” funkce (silně doporučeno)
- Preview panel vpravo:
  - metadata (size, createdAt, sha256, type)
  - 3D preview STL/OBJ/3MF (pokud umíme)
  - Gcode preview (pokud umíme)
  - rychlé akce (download, open folder)
- Favorites / pinned složky.
- Recent (naposledy otevřené / poslední objednávky).
- Tagy a filtry (order/customer/status/material/preset).

C3) Deep link opening (povinné)
- Z Admin Orders: “Open order folder” přesměruje do Model Storage a rovnou otevře konkrétní order složku.
- Implementace: route např. /admin/model-storage?folder=<orderFolderId> (nebo nested route).
- Model Storage musí umět:
  - načíst folder tree
  - otevřít folder dle ID
  - zvýraznit v tree + nastavit breadcrumb.

--------------------------------------------------------------------------------
D) PROPOJENÍ Admin Orders — Detail modal + odkazy do Storage
--------------------------------------------------------------------------------
D1) Orders list (povinné)
- Zůstat tabulka, ale doplnit:
  - status “Storage Ready” (Processing → Ready)
  - počet modelů, celková cena, createdAt
  - rychlé akce: Open (modal), Open order folder

D2) Detail modal (povinné) — 3 taby/sekce
1) Customer
   - name, email, phone
   - copy-to-clipboard
   - interní poznámka (staff notes)
2) Shipping
   - adresa, city, zip, country
   - formatted label view
3) Items + Files
   - tabulka modelů:
     - modelName, material, qty
     - preset name + preset snapshot hash
     - print time, filament grams
     - price breakdown (pokud dostupné)
     - akce: Download model / Download gcode / Download preset
   - tlačítko “Open order folder”
   - tlačítko “Download all as ZIP”
   - zobrazit storage status:
     - Processing files… / Ready
     - případně error + retry

D3) Linkování na folder (povinné)
- Orders detail musí mít orderFolderId.
- Klik na link otevře Model Storage s folderId.

--------------------------------------------------------------------------------
E) BACKEND & BEZPEČNOST (moderní a robustní)
--------------------------------------------------------------------------------
E1) Storage architektura (doporučeno)
- Soubory: objektové úložiště (S3 kompatibilní nebo file storage s abstrakcí).
- Metadata: DB (folders, files, relations: orderId ↔ orderFolderId ↔ fileIds).
- Frontend file manager komunikuje jen s tvým API.

E2) Signed URL downloads (povinné)
- Pro download generovat signed URL s krátkou expirací.
- Přístup kontrolovat dle tenantId + RBAC.
- Audit log: kdo, co, kdy stáhl.

E3) Permissions/RBAC (doporučeno)
- Team role: admin vs staff.
- Definovat, kdo může:
  - download gcode
  - mazat soubory
  - mazat trash
- Audit log pro kritické akce (download/delete/move).

E4) Quota a limity podle tarifu (doporučeno)
- Ukazatel využití (2/5/10GB atd.)
- Blokovat upload v Company Library při překročení.
- Orders artefakty jsou “povinné” -> při limitu řešit pravidla (např. retention).

E5) Retention policy (doporučeno)
- Gcode držet X měsíců (nebo dle tarifu).
- Trash auto-delete po 30 dnech.

--------------------------------------------------------------------------------
F) SPOLEHLIVOST WORKFLOW (ať se ukládání vždy dokončí)
--------------------------------------------------------------------------------
F1) Order storage job pipeline (povinné)
Po dokončení objednávky spustit job:
1) uložit order record (DB) + items + selected presets
2) vytvořit folder strukturu (Orders/<slug>/...)
3) upload:
   - originální model file
   - gcode file (finální)
   - preset snapshot ini
   - meta json + checksums
4) nastavit order.storage_ready = true
5) v případě failu: order.storage_status = "error" + retry

F2) UI status “Storage Ready” (povinné)
- Orders list i detail ukazují stav:
  - Processing → Ready → Error
- Button “Retry” (jen admin) spustí znovu pipeline job.

--------------------------------------------------------------------------------
G) ANALYTIKA VS ORDER DATA (oddělit, jak chceš)
--------------------------------------------------------------------------------
G1) Experimentální slicy (povinné oddělení)
- Přepínání presetů, zkoušení parametrů, “nefinální” kalkulace:
  - ukládat jen eventy do analytics (např. presetSelected, pricingCalculated, sliceAttempted).
  - neukládat do storage.

G2) Do objednávky/storages ukládat pouze finální výsledek
- Pouze model + finální gcode + finální preset snapshot + meta.

--------------------------------------------------------------------------------
H) EXTRA: 5 dodatečných vylepšení, která MUSÍ být zahrnuta
--------------------------------------------------------------------------------
H1) “Storage Ready” stav u objednávky (Processing → Ready) + retry jobů
H2) Download přes signed URL (časově omezené) + audit log “kdo co stáhl”
H3) Trash / soft delete + auto-cleanup po 30 dnech
H4) ZIP export celé objednávky (models + gcode + preset snapshot + meta)
H5) Preview panel (metadata + 3D preview + gcode preview) vpravo jako Google Drive

--------------------------------------------------------------------------------
I) OPEN-SOURCE KOMPONENTY — kde, kde a jak přesně je používat (doporučené nasazení)
--------------------------------------------------------------------------------
Níže jsou open-source projekty, které doporučuji využít, včetně toho, KDE přesně v systému se použijí:

I1) Frontend “Drive UI”
- Primární volba:
  - SVAR React File Manager (Drive-like UI)
    - použít pro celou stránku /admin/model-storage:
      - folder tree / file list / breadcrumbs / context actions / multi-select / upload
- Alternativa:
  - Chonky (React file browser)
    - pokud bude SVAR nevyhovovat, použít Chonky na list/grid + actions
- Tree view sidebar (pokud nebude vestavěný):
  - React Arborist
    - použít pro levý strom složek (virtualizace, drag-drop struktura)

I2) Upload (resumable, velké soubory)
- Uppy + Tus plugin
  - použít v kalkulačce i v admin storage pro upload modelů do Company Library
  - dává: resume, retry, UI, i18n
- tusd (tus server)
  - použít jako backend službu pro resumable uploady
  - napojení na storage target (disk/object storage)

I3) Storage backend (objektové úložiště)
- SeaweedFS (Apache-2.0)
  - doporučené pro moderní self-host object storage (S3 gateway)
  - soubory model/gcode/preset/meta
- Ceph (LGPL)
  - enterprise varianta (vyšší komplexita)

Poznámka: MinIO je populární, ale má AGPL a může být licenčně problematický pro privátní SaaS. Pokud bys ho chtěl, musí se vyřešit licenčně (komerční licence / právní review). Preferujeme SeaweedFS.

I4) Search (metadata vyhledávání)
- OpenSearch (Apache-2.0)
  - použít pro search bar v Model Storage:
    - indexovat file metadata + order metadata
    - rychlé filtrování a vyhledávání

I5) Background jobs & pipeline
- BullMQ (MIT) + Redis
  - použít pro:
    - post-order storage pipeline
    - retry mechanism
    - retention cleanup
    - zip export generation (pokud bude async)
    - antivirus scan (volitelně)
  - UI: status “Processing / Ready”

I6) Preview (G-code a 3D)
- gcode-viewer (MIT) nebo Liquid-gcode-renderer (MIT)
  - použít pro preview panel v Model Storage pro .gcode
- Three.js (MIT) + loaders (STLLoader atd.)
  - použít pro 3D preview STL/OBJ/3MF
  - využít i pro generaci thumbnailů (renders/)

I7) RBAC & Security
- Casbin (Apache-2.0)
  - použít pro kontrolu oprávnění:
    - download gcode
    - delete/move
    - admin/staff roles

I8) ZIP export
- archiver (Node)
  - použít pro “Download all as ZIP”
  - streamovat ZIP nebo generovat do Exports/

--------------------------------------------------------------------------------
J) CO OD TEBE CHCI JAKO VÝSTUP (Claude)
--------------------------------------------------------------------------------
J1) Nejprve vytvoř KOMPLEXNÍ IMPLEMENTAČNÍ PLÁN
- Rozděl na fáze (např. 1) backend metadata + storage, 2) order pipeline, 3) Model Storage UI, 4) Orders modal + deep links, 5) security/audit, 6) polishing)
- U každé fáze:
  - přesné kroky
  - nové endpointy + request/response
  - DB modely (tabulky/collections)
  - storage folder logic
  - UI komponenty a routy
  - error states + retry
  - test checklist (min 10 bodů)
- Vyjmenuj “Must-have MVP” vs “Nice-to-have”.

J2) Poté implementuj (minimální změny mimo scope)
- Přidej novou stránku /admin/model-storage
- Uprav /admin/orders:
  - detail modal (3 taby)
  - Open order folder link
  - status Storage Ready
- Propoj kalkulačku/backend:
  - finální checkout → order creation → pipeline job → storage ready
- Přidej audit log + signed URL download
- Přidej trash + cleanup job
- Přidej zip export pro objednávku

J3) Kvalita a dokumentace
- Přidej stručnou interní dokumentaci:
  - “Jak funguje order storage pipeline”
  - “Jak se generuje preset snapshot”
  - “Jak funguje signed URL”
  - “Jak se řeší tenant izolace”
- Bez “AI generic” UI, ale čisté B2B admin UI.

--------------------------------------------------------------------------------
K) OPEN-SOURCE PROJEKTY — samostatná sekce (seznam + popis jako dřív)
--------------------------------------------------------------------------------
1) SVAR React File Manager (MIT)
- K čemu: kompletní Drive-like UI (složky/soubory, breadcrumbs, search, upload/download, copy/move/rename).
- Jak se používá: napojí se na tvé API pro list/CRUD operace.
- Co nabízí: rychlá implementace profesionálního file manager UI.

2) Chonky (MIT)
- K čemu: alternativní file browser (list/grid, selection, keyboard shortcuts, actions).
- Jak se používá: UI vrstva nad tvým API.
- Co nabízí: “desktop-like” ovládání a hotové akce.

3) React Arborist
- K čemu: strom složek v sidebaru (virtualizace, drag&drop).
- Jak se používá: zdroj dat = folder nodes z backendu.
- Co nabízí: velmi plynulé UI i pro tisíce položek.

4) Uppy + Tus plugin
- K čemu: upload velkých souborů s resume/retry.
- Jak se používá: UI uploader v kalkulačce i admin storage.
- Co nabízí: robustní upload UX bez psaní vlastního resumable systému.

5) tusd server (MIT)
- K čemu: backend pro tus protokol (resumable uploads).
- Jak se používá: samostatná služba, ukládání do storage.
- Co nabízí: standardní resumable upload protokol.

6) SeaweedFS (Apache-2.0)
- K čemu: objektové úložiště pro modely/gcode/presety s S3 gateway.
- Jak se používá: appka ukládá přes S3 API.
- Co nabízí: moderní storage s replikací a dobrou licencí pro SaaS.

7) Ceph (LGPL)
- K čemu: enterprise storage (object/block/file).
- Jak se používá: RGW pro S3 + cluster.
- Co nabízí: extrémní robustnost (vyšší provozní složitost).

8) OpenSearch (Apache-2.0)
- K čemu: full-text search pro metadata (file names, orderId, tags, filters).
- Jak se používá: indexace metadata z DB, search bar query.
- Co nabízí: rychlé vyhledávání + dashboards.

9) BullMQ (MIT)
- K čemu: background joby (post-order pipeline, retry, cleanup, zip export).
- Jak se používá: Node workers + Redis.
- Co nabízí: produkční queue + tracking stavů.

10) gcode-viewer (MIT) / Liquid-gcode-renderer (MIT)
- K čemu: Gcode preview ve Storage.
- Jak se používá: render Gcode do canvas/threejs.
- Co nabízí: rychlá kontrola Gcode bez stahování.

11) Three.js (MIT)
- K čemu: 3D preview STL/OBJ/3MF (a thumbnails).
- Jak se používá: viewer v preview panelu.
- Co nabízí: standardní web 3D ekosystém.

12) Casbin (Apache-2.0)
- K čemu: RBAC/ABAC permissions pro admin/team.
- Jak se používá: policy evaluation pro každou API akci.
- Co nabízí: rychlé a čisté řízení přístupů.

13) archiver (Node)
- K čemu: generování ZIP (Download all as ZIP).
- Jak se používá: stream ZIP do response nebo uložit do Exports/.
- Co nabízí: jednoduché ZIP/TAR generování.

--------------------------------------------------------------------------------
L) DŮLEŽITÁ POZNÁMKA K LICENCÍM
--------------------------------------------------------------------------------
- Preferovat MIT/Apache/BSD.
- Vyhýbat se AGPL komponentám v core storage části (pokud nechceme řešit komerční licence / právní dopady).
- Pokud bude zvažován MinIO (AGPL): navrhnout alternativu (SeaweedFS) nebo explicitně vyžádat licenční rozhodnutí.

KONEC PROMPTU
