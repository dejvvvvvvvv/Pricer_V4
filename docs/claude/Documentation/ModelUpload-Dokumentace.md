# Model Upload -- Dokumentace

> Verejna stranka `/model-upload` pro nahradvani 3D modelu. Podporuje multi-file upload
> s drag-and-drop, simulaci progresu, 3D nahled (Three.js), session historii a propojeni
> s kalkulackou. Plne bilingvalni (CS/EN) pres useLanguage() a t() klice.

---

## 1. Prehled

| Vlastnost | Hodnota |
|-----------|---------|
| URL routa | `/model-upload` |
| Hlavni soubor | `src/pages/model-upload/index.jsx` (~982 radku) |
| CSS | `src/pages/model-upload/ModelUpload.css` |
| Subkomponenty | `FileListItem` (inline), `FileTypeIcon` (inline), `STLPreview`, `GroupPreview`, `ModelPreviewScene` |
| Ucel | Nahrani 3D modelu, 3D nahled, prochod do kalkulacky |

### Hlavni funkce

1. **Dropzone** -- drag-and-drop nebo klik pro nahrabi souboru (react-dropzone)
2. **File Queue** -- seznam nahravanych souboru s progressbarem, stavem a retry
3. **3D Nahled** -- Three.js Canvas s STL/OBJ/3MF podporou, OrbitControls, auto-rotate
4. **Model Info** -- rozmery (X/Y/Z mm), pocet trojuhelniku, pocet vertexy, velikost souboru
5. **Session History** -- nedavno nahrane soubory (sessionStorage, max 20 polozek)
6. **CTA do kalkulacky** -- navigate('/test-kalkulacka') s preloaded souborem jako state

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| 3D rendering | @react-three/fiber, @react-three/drei, three.js |
| 3D loadery | STLLoader, OBJLoader, ThreeMFLoader (three.js examples) |
| Upload | react-dropzone |
| Styling | `ModelUpload.css` (BEM tridy mu-*) + Forge CSS vars |
| i18n | `useLanguage()` -- `t()` + `cs` boolean flag (2026-03-14: vsechny hlavni texty pres t()) |
| Routing | React Router v6, navigate('/test-kalkulacka', { state: { preloadedFile } }) |
| Storage | sessionStorage (klic `modelpricer:upload-history`) |

---

## 3. Architektura souboru

```
src/pages/model-upload/
  index.jsx             -- Hlavni komponenta ModelUpload + inline sub-komponenty
  ModelUpload.css       -- BEM styling (mu-page, mu-dropzone, mu-filelist, mu-preview, mu-history)
```

---

## 4. Podporovane formaty

| Format | Podporovan | Loader |
|--------|-----------|--------|
| STL | Ano | STLLoader |
| 3MF | Ano | ThreeMFLoader |
| OBJ | Ano | OBJLoader |
| STEP | Ne (brzy) | -- |

Max velikost souboru: 100 MB.

---

## 5. Preklady (i18n)

Vsechny viditelne texty pouzivaji `t()` z useLanguage() s prefixem `modelUpload.*`.

### Klice pridane 2026-03-14

| Prefix | Pocet klicu | Oblast |
|--------|------------|--------|
| `modelUpload.title` / `modelUpload.subtitle` | 2 | Hlavicka stranky |
| `modelUpload.dropzone.*` | 9 | Dropzone texty |
| `modelUpload.files.*` | 7 | File queue |
| `modelUpload.success.*` | 5 | Success CTA |
| `modelUpload.preview.*` | 7 | 3D nahled a info |
| `modelUpload.history.*` | 2 | Session historie |
| `modelUpload.file.*` | 4 | FileListItem tlacitka |
| `modelUpload.error.*` | 4 | Validacni chyby |

### Poznamka: `cs` boolean

Komponenta stale pouziva `const cs = language === 'cs'` pro vnitrni logiku
(napr. pluralizace "model nahran" vs "modelu nahrano"). Toto je akceptovano --
pluralizacni logika je slozita a nelze ji jednoduche nahradit `t()` beze ztrat.

---

## 6. Zname omezeni

| Omezeni | Popis |
|---------|-------|
| Simulovany upload | Upload progress je simulovany (40ms intervaly), ne skutecny HTTP upload |
| Session storage | Historie se ztrati po zavreni prohlizece |
| Pluralizace pres cs bool | "1 model nahran" vs "X modelu nahrano" resi cs boolean, ne t() |
| FileListItem nema useLanguage | Sub-komponenta dostava preklady pres `labels` prop z rodice |
