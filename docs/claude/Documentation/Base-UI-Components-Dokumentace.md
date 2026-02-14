# Base UI Components -- Dokumentace

> 18 zakladnich UI komponent v `src/components/ui/`: Header, Footer, Button, Input, Card, Checkbox,
> Select, Slider, Dialog, Tooltip, Label, Icon, Container, ColorPicker, BackgroundPattern,
> WelcomeHeader, LoadingState, ErrorState.
> Tyto komponenty tvori zakladni vrstvu design systemu pouzitelnou v admin, public i widget strankach.
> **Forge komponenty** (`src/components/ui/forge/`) jsou zdokumentovany samostatne v
> `Forge-Design-System-Dokumentace.md` a v tomto dokumentu NEJSOU zahrnuty.

---

## 1. Prehled

Base UI Components jsou zakladni, znovupouzitelne stavebni bloky celeho projektu ModelPricer.
Na rozdil od Forge komponent (ktere jsou specificke pro dark Forge theme public stranek)
jsou base komponenty pouzivany NAPRIC celym projektem -- v admin panelu, v kalkulackach
(test-kalkulacka, test-kalkulacka-white, widget-kalkulacka) i v public strankach.

**Klicove vlastnosti:**
- Vsechny komponenty jsou v jedinem adresari `src/components/ui/`
- Vetsina pouziva `forwardRef` pro kompatibilitu s react-hook-form a externimi knihovnami
- Styling je mix Tailwind CSS (pres `cn()` utility) a inline stylu (Forge tokeny)
- Shadcn/ui inspirovany pattern (CVA varianty, compound components)
- Radix UI primitivy pro pristupnost (Dialog, Tooltip, Label, Slider)

**Pocet komponent:** 18 JSX souboru (bez slozky `forge/`)

---

## 2. Technologie

| Technologie | Pouziti | Kde |
|-------------|---------|-----|
| React 18+ | Zaklad vsech komponent, `forwardRef`, `useId`, `useState` | Vsechny soubory |
| Tailwind CSS | Utility-first CSS tridy pro layout, spacing, colors | Vsechny soubory |
| `cn()` utility | `clsx` + `tailwind-merge` wrapper pro podminene tridy | `src/utils/cn.js` |
| `class-variance-authority` (CVA) | Typesafe varianty pro Button a Label | `Button.jsx`, `label.jsx` |
| Radix UI | Pristupne primitivy (Dialog, Tooltip, Label, Slider, Slot) | 5 komponent |
| lucide-react | Ikony (pres `AppIcon` wrapper) | `Icon.jsx`, `Checkbox.jsx`, `Select.jsx` |
| react-colorful | Color picker s HEX inputem | `ColorPicker.jsx` |
| framer-motion | Animace mobile draweru v Header | `Header.jsx` |
| react-router-dom | Navigace, `useLocation`, `Link` | `Header.jsx`, `Footer.jsx` |
| Firebase Auth | Sign out v Header | `Header.jsx` |
| LanguageContext | Preklady `t()` | `Header.jsx`, `Footer.jsx` |
| CSS custom properties | Forge design tokeny (`--forge-*`) | `Header.jsx`, `Footer.jsx`, `Input.jsx` |

### Externi zavislosti base komponent

```
@radix-ui/react-slot       -- Button (asChild pattern)
@radix-ui/react-dialog     -- Dialog
@radix-ui/react-tooltip    -- Tooltip
@radix-ui/react-label      -- Label
@radix-ui/react-slider     -- Slider
class-variance-authority    -- Button, Label (CVA varianty)
react-colorful             -- ColorPicker
framer-motion              -- Header (AnimatePresence, motion)
lucide-react               -- Icon (vsechny ikony), Checkbox (Check), Select (ChevronDown, Check, Search, X)
```

---

## 3. Architektura souboru

```
src/components/ui/
|-- BackgroundPattern.jsx   (17 radku)  -- Dekorativni pozadi s gradientem
|-- Button.jsx              (149 radku) -- Hlavni tlacitko s variantami, CVA, loading, ikony
|-- Card.jsx                (61 radku)  -- Card compound component (Card, Header, Title, Description, Content, Footer)
|-- Checkbox.jsx            (55 radku)  -- Custom checkbox s label a error stavem
|-- ColorPicker.jsx         (151 radku) -- Color picker s HEX inputem a swatches
|-- Container.jsx           (12 radku)  -- Layout wrapper s max-width a padding
|-- Dialog.jsx              (109 radku) -- Modal dialog (Radix) s overlay, animacemi, close button
|-- ErrorState.jsx          (121 radku) -- Zobrazeni chyb (inline/card/fullPage) s retry
|-- Footer.jsx              (174 radku) -- Forge-styled footer s CSS-in-JS, responsive, sidebar offset
|-- Header.jsx              (463 radku) -- Hlavni navigace, mobile drawer, lang/user menu, auth
|-- Icon.jsx                (10 radku)  -- Backward-compatible alias pro AppIcon
|-- Input.jsx               (58 radku)  -- Textovy input s Forge tokeny, label, error
|-- label.jsx               (17 radku)  -- Radix Label s CVA variantou
|-- LoadingState.jsx        (104 radku) -- Loading indikatory (spinner/skeleton/dots) + InlineLoader
|-- Select.jsx              (239 radku) -- Custom select dropdown (single/multi, search, clear)
|-- Slider.jsx              (20 radku)  -- Radix Slider s Tailwind styly
|-- tooltip.jsx             (31 radku)  -- Radix Tooltip s animacemi
|-- WelcomeHeader.jsx       (17 radku)  -- Admin welcome banner s name + subtitle
```

**Poznamka k pojmenovani souboru:** `label.jsx` a `tooltip.jsx` zacinaji malym pismenem
(lowercase), na rozdil od ostatnich komponent ktere pouzivaji PascalCase.
Toto je nekonzistentni a na case-sensitive systemu (Linux/CI) muze zpusobit problemy
pri importu s velkym pismenem.

**Celkovy pocet radku:** priblizne 1,857 radku kodu.

---

## 4. Import graf

### 4.1 Interni zavislosti (base ui -> base ui)

```
Select.jsx -----> Button.jsx
Select.jsx -----> Input.jsx
Dialog.jsx -----> Icon.jsx
Header.jsx -----> Button.jsx
Icon.jsx   -----> ../AppIcon.jsx (parent directory)
Button.jsx -----> ../AppIcon.jsx (parent directory)
Header.jsx -----> ../AppIcon.jsx (parent directory, primo -- ne pres Icon.jsx)
```

**Dulezite:** `Header.jsx` importuje `Icon` primo z `../AppIcon`, NE z `./Icon`.
`Button.jsx` take importuje z `../AppIcon`. Pouze `Dialog.jsx` importuje z `./Icon`.
To znamena ze `Icon.jsx` wrapper neni univerzalne pouzivany v ramci base komponent samotnych.

### 4.2 Kdo importuje base komponenty (konzumenti)

| Komponenta | Importovana v |
|------------|---------------|
| **Button** | Routes, test-kalkulacka (index, FileUpload, ModelViewer, PricingCalc, OrderConfirm, CheckoutForm), widget-kalkulacka (index, FileUpload, ModelViewer, PricingCalc), test-kalkulacka-white (index, FileUpload, ModelViewer, PricingCalc, OrderConfirm, CheckoutForm), Header |
| **Input** | test-kalkulacka (PrintConfig, CheckoutForm), widget-kalkulacka (PrintConfig), test-kalkulacka-white (PrintConfig, CheckoutForm), Select (interally) |
| **Select** | test-kalkulacka (PrintConfig), widget-kalkulacka (PrintConfig), test-kalkulacka-white (PrintConfig) |
| **Checkbox** | test-kalkulacka (PrintConfig, CheckoutForm), widget-kalkulacka (PrintConfig), test-kalkulacka-white (PrintConfig, CheckoutForm) |
| **Card** | test-kalkulacka (PricingCalc), widget-kalkulacka (PricingCalc), test-kalkulacka-white (PricingCalc) |
| **Icon** | test-kalkulacka (PricingCalc), widget-kalkulacka (PricingCalc), test-kalkulacka-white (PricingCalc), Dialog |
| **Header** | Routes.jsx (globalni layout) |
| **Footer** | Routes.jsx (globalni layout) |
| **Dialog** | (pouzivan neprime -- admin stranky preferuji ForgeDialog) |
| **LoadingState** | Admin stranky pres async hooks |
| **ErrorState** | Admin stranky pres async hooks |
| **ColorPicker** | Admin branding (neprimy import) |
| **Container** | Neni v grep vysledcich -- mozna nepouzivany |
| **WelcomeHeader** | Admin dashboard (neprimy import) |
| **Slider** | Neni v grep vysledcich -- mozna nepouzivany |
| **Label** | Neni v grep vysledcich -- mozna nepouzivany |
| **Tooltip** | Neni v grep vysledcich -- mozna nepouzivany |
| **BackgroundPattern** | Neni v grep vysledcich -- mozna nepouzivany |

### 4.3 Export pattern

| Komponenta | Export typ | Poznamka |
|------------|-----------|----------|
| Button | `export default Button` + `export { Button, buttonVariants }` | DUAL export (default + named) |
| Card | `export { Card, CardHeader, CardTitle, ... }` | Jen named exports |
| Checkbox | `export { Checkbox }` | Jen named export |
| Select | `export default Select` | Jen default export |
| Input | `export default Input` | Jen default export |
| Slider | `export { Slider }` | Jen named export |
| Label | `export { Label }` | Jen named export |
| Tooltip | `export { TooltipProvider, Tooltip, ... }` | Jen named exports |
| Dialog | `export { Dialog, DialogContent, ... }` | Jen named exports |
| LoadingState | `export { LoadingState, InlineLoader }` + `export default LoadingState` | DUAL export |
| ErrorState | `export { ErrorState }` + `export default ErrorState` | DUAL export |
| ColorPicker | `export default ColorPicker` | Jen default export |
| Container | `export default Container` | Jen default export |
| Icon | `export default function Icon` | Jen default export |
| Header | `export default Header` | Jen default export |
| Footer | `export default Footer` | Jen default export |
| BackgroundPattern | `export default BackgroundPattern` | Jen default export |
| WelcomeHeader | `export default WelcomeHeader` | Jen default export |

**VAROVANI:** Nekonzistentni export pattern. Nekdo importuje `Button` jako default, nekdo jako
named (`{ Button }`). Dualita exportu to umoznuje, ale je to matouci pro nove vyvojare.
Konzumenti MUSI overit presny import styl pred pouzitim.

---

## 5. Design (Forge compliance, inline styly vs tokeny)

### 5.1 Tri vrstvy stylingu

Base UI komponenty pouzivaji **tri ruzne pristupy k CSS** soucasne, coz je hlavni
architekturalni nesrovnalost:

**1) Tailwind CSS utility tridy (pres `cn()`)**
Pouzivano ve: Button, Card, Checkbox, Container, Select, Slider, Label, Tooltip, Dialog,
LoadingState, ErrorState

**2) Inline styly s Forge CSS custom properties (`var(--forge-*)`)**
Pouzivano ve: Header, Footer, Input

**3) CSS-in-JS (`<style>` tag uvnitr JSX)**
Pouzivano ve: Footer, ColorPicker

### 5.2 Forge token compliance

| Komponenta | Pouziva Forge tokeny? | Typ stylu | Poznamka |
|------------|----------------------|-----------|----------|
| Header | ANO (plne) | Inline style | Barvy, pozadi, border, shadow -- vse pres `--forge-*` |
| Footer | ANO (plne) | CSS-in-JS `<style>` | Kompletni Forge theme vcetne fontu |
| Input | CASTECNE | Inline style + Tailwind | `--forge-bg-elevated`, `--forge-text-primary`, `--forge-border-default`, `--forge-font-body` |
| Button | NE | Tailwind CVA | Pouziva Tailwind semantic colors (`bg-primary`, `text-primary-foreground`) |
| Card | NE | Tailwind | `bg-card`, `text-card-foreground`, `shadow-card` |
| Checkbox | NE | Tailwind | `border-primary`, `bg-primary`, `text-primary-foreground` |
| Select | NE | Tailwind | `bg-white text-black` (HARDCODED svetle barvy!) |
| Dialog | NE | Tailwind | `bg-background`, Radix animations |
| Tooltip | NE | Tailwind | `bg-popover`, `text-popover-foreground` |
| Slider | NE | Tailwind | `bg-primary`, `bg-secondary` |
| LoadingState | NE | Tailwind | `bg-gray-200`, `bg-blue-500`, `border-blue-600` (HARDCODED) |
| ErrorState | NE | Tailwind | `bg-red-50`, `text-red-600`, `bg-blue-600` (HARDCODED) |
| ColorPicker | NE | Tailwind + CSS-in-JS | `bg-card`, `border-border`, Tailwind semantic |
| Container | NE | Tailwind | `max-w-7xl`, `px-4` |
| Label | NE | Tailwind CVA | `text-sm font-medium` |
| WelcomeHeader | NE | Tailwind | `text-foreground`, `text-muted-foreground` |
| BackgroundPattern | NE | Inline style | Hardcoded `background: 'white'` + radial gradient |
| Icon | N/A | Zadne styly | Pouze proxy na AppIcon |

### 5.3 Identifikovane design nesrovnalosti

**D1 - Select.jsx hardcoded svetle barvy (P1)**
`Select.jsx:121` ma `bg-white text-black` a dropdown na radku 176 take `bg-white text-black`.
Toto ROZBIJE dark theme (Forge). Vsechny ostatni form komponenty (Input, Checkbox) pouzivaji
semantic Tailwind barvy nebo Forge tokeny.

**D2 - LoadingState/ErrorState hardcoded barvy (P2)**
Oba pouzivaji primo barvy jako `bg-gray-200`, `bg-blue-500`, `text-red-600` misto
Forge semantic tokenu (`--forge-info`, `--forge-error`, `--forge-success`).
V dark theme budou vizualne nekonzistentni.

**D3 - BackgroundPattern hardcoded bile pozadi (P2)**
`background: 'white'` na radku 9 -- neni responsivni vuci theme. Pouzito jako fixed
pozadi ale jen pro svetly theme.

**D4 - Nesjednoceny styling approach (P3)**
Header/Footer pouzivaji inline Forge styly, Input pouziva mix, zbytek pouziva Tailwind
semantic barvy. Neni jasna hranice kdy pouzit ktery pristup.

---

## 8. Komponenty -- tabulka VSECH

### 8.1 BackgroundPattern

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/BackgroundPattern.jsx` |
| **Pocet radku** | 17 |
| **Popis** | Dekorativni fixed pozadi s radialnim gradientem (bile -> fialove). Pouziva `position: fixed` s `-z-10`. |
| **Props** | Zadne |
| **Export** | `export default BackgroundPattern` |
| **Forge compliance** | NE -- hardcoded `background: 'white'` |
| **Zavislosti** | React |

---

### 8.2 Button

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Button.jsx` |
| **Pocet radku** | 149 |
| **Popis** | Hlavni tlacitko s CVA variantami, loading spinner, ikonami, Radix Slot pattern. Nejpouzivaneji komponenta v projektu. |
| **Export** | `export default Button` + `export { Button, buttonVariants }` |
| **Forge compliance** | NE -- Tailwind semantic barvy |
| **Zavislosti** | React, `@radix-ui/react-slot`, `class-variance-authority`, `../AppIcon`, `cn()` |

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `variant` | `'default'` \| `'primary'` \| `'outline'` \| `'ghost'` \| `'gradient'` \| `'destructive'` \| `'link'` | `'default'` | Vizualni varianta |
| `size` | `'default'` \| `'sm'` \| `'lg'` \| `'icon'` | `'default'` | Velikost (`h-10`, `h-9`, `h-11`, `h-10 w-10`) |
| `asChild` | `boolean` | `false` | Radix Slot pattern -- renderuje child element misto `<button>` |
| `fullWidth` | `boolean` | `false` | `w-full` |
| `loading` | `boolean` | `false` | Zobrazi spinner, disabluje tlacitko |
| `iconName` | `string` | - | Lucide icon name (napr. `'Upload'`, `'Settings'`) |
| `icon` | `ReactNode` | - | Custom icon element (ma prednost pred `iconName`) |
| `iconPosition` | `'left'` \| `'right'` | `'left'` | Pozice ikony |
| `disabled` | `boolean` | - | Disabluje tlacitko |
| `className` | `string` | - | Custom CSS tridy |
| `children` | `ReactNode` | - | Obsah tlacitka |

**Dulezite:** Kdyz `asChild=true`, Radix `<Slot>` vyzaduje PRESNE JEDEN React element child.
Spinner a ikony se v asChild modu NERENDERUJI (stabilita > feature completeness).

---

### 8.3 Card (Compound Component)

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Card.jsx` |
| **Pocet radku** | 61 |
| **Popis** | Shadcn-style Card compound component s 6 sub-komponentami. |
| **Export** | `export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }` |
| **Forge compliance** | NE -- Tailwind semantic (`bg-card`, `text-card-foreground`) |
| **Zavislosti** | React, `cn()` |

**Sub-komponenty a jejich props:**

| Sub-komponenta | HTML element | Default tridy | Vlastni props |
|----------------|-------------|---------------|---------------|
| `Card` | `<div>` | `rounded-xl border border-border bg-card text-card-foreground shadow-card` | `className`, `ref` |
| `CardHeader` | `<div>` | `flex flex-col space-y-1.5 p-6` | `className`, `ref` |
| `CardTitle` | `<h3>` | `text-lg font-semibold leading-none tracking-tight` | `className`, `ref` |
| `CardDescription` | `<p>` | `text-sm text-muted-foreground` | `className`, `ref` |
| `CardContent` | `<div>` | `p-6 pt-0` | `className`, `ref` |
| `CardFooter` | `<div>` | `flex items-center p-6 pt-0` | `className`, `ref` |

---

### 8.4 Checkbox

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Checkbox.jsx` |
| **Pocet radku** | 55 |
| **Popis** | Custom checkbox s hidden native inputem, custom vizualni check ikonou a volitelnym label + error. |
| **Export** | `export { Checkbox }` (POUZE named!) |
| **Forge compliance** | NE -- Tailwind semantic (`border-primary`, `bg-primary`) |
| **Zavislosti** | React, `lucide-react` (Check), `cn()` |

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `id` | `string` | auto `useId()` | HTML id pro label propojeni |
| `label` | `string` \| `ReactNode` | - | Text vedle checkboxu |
| `error` | `string` | - | Chybova zprava pod checkboxem |
| `className` | `string` | - | Custom CSS na wrapper |
| `disabled` | `boolean` | - | Disabluje checkbox |
| + | `...props` | - | Vsechny nativni `<input type="checkbox">` props |

**Poznamka k pristupnosti:** Nativni `<input>` je `sr-only` (screen reader only).
Vizualni check ikona (`<Check>`) NEMA `peer-checked:opacity-100` spravne -- trida
je na `<span>` ale CSS `peer-checked` scope saha jen na siblingy `<input>`.
Ikona se fakticky zobrazi spravne diky `peer-checked:bg-primary` na parent span.

---

### 8.5 ColorPicker

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/ColorPicker.jsx` |
| **Pocet radku** | 151 |
| **Popis** | Color picker s HEX inputem, swatch gridem a expandable picker panelem. Pouziva `react-colorful`. |
| **Export** | `export default ColorPicker` |
| **Forge compliance** | CASTECNE -- `bg-card`, `border-border` (Tailwind semantic) |
| **Zavislosti** | React, `react-colorful` (HexColorPicker, HexColorInput), `cn()` |

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `value` | `string` | `'#2563EB'` | Aktualni barva (HEX) |
| `onChange` | `(color: string) => void` | - | Callback pri zmene barvy |
| `label` | `string` | - | Label nad pickerem |
| `swatches` | `string[]` | 30 predefined barev | Pole HEX barev pro rychly vyber |
| `showInput` | `boolean` | `true` | Zobrazit HEX text input |
| `showSwatches` | `boolean` | `true` | Zobrazit swatch grid |
| `className` | `string` | - | Custom CSS |
| `disabled` | `boolean` | `false` | Disabluje picker |

**CSS-in-JS:** Komponenta obsahuje `<style>` tag pro sizing react-colorful widgetu.

---

### 8.6 Container

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Container.jsx` |
| **Pocet radku** | 12 |
| **Popis** | Jednoduchy layout wrapper s `max-w-7xl` a responsivnim paddingem. |
| **Export** | `export default Container` |
| **Forge compliance** | NE -- cisty Tailwind |
| **Zavislosti** | React, `cn()` (importovano z `@/utils/cn`) |

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `children` | `ReactNode` | - | Obsah |
| `className` | `string` | - | Custom CSS |

**Poznamka:** Import pouziva alias `@/utils/cn` misto relativni cesty.

---

### 8.7 Dialog (Compound Component)

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Dialog.jsx` |
| **Pocet radku** | 109 |
| **Popis** | Modal dialog postaveny na Radix UI. Obsahuje overlay, animace, close button s X ikonou. |
| **Export** | `export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }` |
| **Forge compliance** | NE -- Tailwind (`bg-background`, `bg-black/50`) |
| **Zavislosti** | React, `@radix-ui/react-dialog`, `cn()`, `./Icon` |

**Sub-komponenty:**

| Sub-komponenta | Zaklad | Vlastni props |
|----------------|--------|---------------|
| `Dialog` | `DialogPrimitive.Root` | Radix root props |
| `DialogTrigger` | `DialogPrimitive.Trigger` | Radix trigger props |
| `DialogPortal` | `DialogPrimitive.Portal` | Radix portal props |
| `DialogClose` | `DialogPrimitive.Close` | Radix close props |
| `DialogOverlay` | `DialogPrimitive.Overlay` | `className`, `ref` |
| `DialogContent` | `DialogPrimitive.Content` | `className`, `showClose` (default `true`), `children`, `ref` |
| `DialogHeader` | `<div>` | `className` |
| `DialogFooter` | `<div>` | `className` |
| `DialogTitle` | `DialogPrimitive.Title` | `className`, `ref` |
| `DialogDescription` | `DialogPrimitive.Description` | `className`, `ref` |

**Pristupnost:** Close button ma `<span className="sr-only">Zavrit</span>` (cesky text).
Dialog pouziva Radix primitivy ktere automaticky ridi focus trap a ESC dismiss.

---

### 8.8 ErrorState

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/ErrorState.jsx` |
| **Pocet radku** | 121 |
| **Popis** | Zobrazeni chyb s retry moznosti. Automaticky detekuje sitove chyby. 3 vizualni varianty. |
| **Export** | `export { ErrorState }` + `export default ErrorState` |
| **Forge compliance** | NE -- hardcoded `bg-red-50`, `text-red-600`, `bg-blue-600` |
| **Zavislosti** | React |

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `error` | `Error \| string` | - | Chybovy objekt nebo zprava |
| `onRetry` | `() => void` | - | Retry callback (zobrazuje Retry tlacitko) |
| `title` | `string` | auto-detect | Vlastni nadpis chyby |
| `className` | `string` | `''` | Custom CSS |
| `variant` | `'inline'` \| `'card'` \| `'fullPage'` | `'card'` | Vizualni styl |
| `showDetails` | `boolean` | `false` | Zobrazit error.stack |

**Sitova detekce:** Pokud `error.message` obsahuje `'fetch'`, `'network'`, `'CORS'` nebo
`'Failed to fetch'`, automaticky se zobrazi title "Connection error" misto "Something went wrong".

---

### 8.9 Footer

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Footer.jsx` |
| **Pocet radku** | 174 |
| **Popis** | Globalni footer s 3-column gridem (logo+popis, navigace, legal). Forge dark theme, sidebar offset pro admin. |
| **Export** | `export default Footer` |
| **Forge compliance** | ANO (plne) -- kompletni Forge tokeny v CSS-in-JS |
| **Zavislosti** | React, `react-router-dom`, `LanguageContext`, `logo.png` |

**Props:** Zadne (komponenta cte stav z hooku: `useLanguage`, `useLocation`, `window.innerWidth`)

**Klicove chovani:**
- Responsivni: 3-column grid na desktopu, 1-column na mobilu (`< 768px`)
- Sidebar offset: automaticky detekuje admin route a posouva footer o sirku sidebaru
  (`sidebarCollapsed ? 64 : 260` px kdyz `>= 768px`)
- CSS-in-JS: kompletni styling je v `<style>` tagu (ne Tailwind)
- Pouziva Forge tokeny: `--forge-bg-surface`, `--forge-text-primary`, `--forge-text-secondary`,
  `--forge-text-muted`, `--forge-border-default`, `--forge-accent-primary`,
  `--forge-font-heading`, `--forge-font-body`, `--forge-font-tech`

---

### 8.10 Header

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Header.jsx` |
| **Pocet radku** | 463 |
| **Popis** | Hlavni navigacni header. Sticky, dark Forge theme, desktop nav + mobile drawer, language switcher, user menu, auth. Nejslozitejsi base komponenta. |
| **Export** | `export default Header` |
| **Forge compliance** | ANO (plne) -- vsechny barvy, pozadi, border pres `--forge-*` inline styly |
| **Zavislosti** | React, `react-router-dom`, `framer-motion`, `../AppIcon`, `./Button`, `firebase/auth`, `LanguageContext`, `logo.png` |

**Props:** Zadne (veskerny stav je interni -- hooks, state, Firebase auth)

**Klicove chovani:**
- Sticky s `backdrop-blur` a polopruhlednym pozadim (`rgba(8, 9, 12, 0.92)`)
- 5 navigacnich polozek (Home, Demo, Pricing, Support, Admin) s ikonami
- Aktivni polozka zvyraznena Forge accent primary barvou
- Language dropdown (CS/EN, pripraveno pro DE/FR)
- User menu s account linkem a sign out
- Mobile drawer (framer-motion spring animace, overlay, ESC close, scroll lock)
- Hover efekty rucne implementovany pres `onMouseEnter`/`onMouseLeave` (ne CSS :hover)
- Auth stav urcuje zobrazeni (login/register vs upload/account)

**Pristupnost:**
- `aria-haspopup="menu"` na dropdown triggery
- `aria-expanded` na otevrene/zavrene stavy
- `role="dialog"` + `aria-modal="true"` na mobile drawer
- `role="menu"` + `role="menuitem"` na dropdown polozky
- ESC zavre drawer
- Overlay kliknutim zavre drawer

---

### 8.11 Icon

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Icon.jsx` |
| **Pocet radku** | 10 |
| **Popis** | Backward-compatible alias pro `../AppIcon`. Existuje protoze nektere moduly importuji `Icon` z `components/ui/Icon`. |
| **Export** | `export default function Icon` |
| **Forge compliance** | N/A (zadne styly) |
| **Zavislosti** | `../AppIcon` |

**Props:** Vsechny props jsou forwardovany na `AppIcon` (`name`, `size`, `color`, `className`, `strokeWidth`).

---

### 8.12 Input

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Input.jsx` |
| **Pocet radku** | 58 |
| **Popis** | Textovy input s Forge tokeny pro dark theme, label a error stavem. Pouziva `forwardRef` pro react-hook-form kompatibilitu. |
| **Export** | `export default Input` |
| **Forge compliance** | CASTECNE -- inline style s `--forge-bg-elevated`, `--forge-text-primary`, `--forge-border-default`, `--forge-font-body` + Tailwind tridy |
| **Zavislosti** | React, `cn()` |

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `type` | `string` | `'text'` | HTML input type |
| `label` | `string` \| `ReactNode` | - | Label nad inputem |
| `error` | `string` | - | Chybova zprava pod inputem |
| `className` | `string` | - | Custom CSS na `<input>` element |
| `id` | `string` | auto `useId()` | HTML id |
| `style` | `object` | - | Mergovano s Forge inline styly |
| + | `...props` | - | Vsechny nativni `<input>` props |

**Poznamka:** Label barva pri chybe pouziva DVE definice soucasne:
Tailwind trida `text-destructive` A inline style `color: var(--forge-error)`.
Inline style ma prednost, takze Tailwind trida je efektivne ignorovana.

---

### 8.13 Label

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/label.jsx` |
| **Pocet radku** | 17 |
| **Popis** | Radix Label s CVA variantou. Standardni shadcn/ui pattern. |
| **Export** | `export { Label }` |
| **Forge compliance** | NE -- Tailwind (`text-sm font-medium`) |
| **Zavislosti** | React, `@radix-ui/react-label`, `class-variance-authority`, `@/lib/utils` |

**Props:** Vsechny Radix Label props + `className`.

**VAROVANI:** Import path `@/lib/utils` JE ODLISNY od ostatnich komponent ktere importuji
z `../../utils/cn` nebo `@/utils/cn`. Soubor `src/lib/utils` NEMUSI existovat -- overit!
Toto je potencialni build error.

---

### 8.14 LoadingState

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/LoadingState.jsx` |
| **Pocet radku** | 104 |
| **Popis** | Loading indikatory s 3 variantami (spinner, skeleton, dots) + samostatny InlineLoader. |
| **Export** | `export { LoadingState, InlineLoader }` + `export default LoadingState` |
| **Forge compliance** | NE -- hardcoded `bg-gray-200`, `bg-blue-500`, `border-blue-600` |
| **Zavislosti** | React |

**Props (LoadingState):**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `variant` | `'spinner'` \| `'skeleton'` \| `'dots'` | `'spinner'` | Vizualni styl |
| `text` | `string` | `''` | Loading text pod indikotorem |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` | Velikost |
| `className` | `string` | `''` | Custom CSS |
| `fullPage` | `boolean` | `false` | Center v celem kontejneru (`min-h-[200px]`) |
| `skeletonRows` | `number` | `3` | Pocet skeleton radku (jen pro `variant='skeleton'`) |

**Props (InlineLoader):**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'sm'` | Velikost |
| `className` | `string` | `''` | Custom CSS |

**JSDoc:** Obe komponenty maji JSDoc komentare s popisem props -- jedine base komponenty
ktere to maji.

---

### 8.15 Select

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Select.jsx` |
| **Pocet radku** | 239 |
| **Popis** | Custom select dropdown s single/multi vyberem, vyhledavanim, clear tlacitkem a loading stavem. Hidden native `<select>` pro form submission. |
| **Export** | `export default Select` |
| **Forge compliance** | NE -- hardcoded `bg-white text-black` (!!!) |
| **Zavislosti** | React, `lucide-react` (ChevronDown, Check, Search, X), `cn()`, `./Button`, `./Input` |

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `options` | `Array<{ value, label, description?, disabled? }>` | `[]` | Pole moznosti |
| `value` | `any` \| `any[]` | - | Aktualni hodnota (pole pro `multiple`) |
| `defaultValue` | `any` | - | Vychozi hodnota (nepouzivano v kodu) |
| `placeholder` | `string` | `'Select an option'` | Placeholder text |
| `multiple` | `boolean` | `false` | Multi-select mod |
| `disabled` | `boolean` | `false` | Disabluje select |
| `required` | `boolean` | `false` | Povinne pole (hvezdicka + native required) |
| `label` | `string` | - | Label nad selectem |
| `description` | `string` | - | Popis pod selectem (skryje se pri chybe) |
| `error` | `string` | - | Chybova zprava |
| `searchable` | `boolean` | `false` | Vyhledavani v moznostech |
| `clearable` | `boolean` | `false` | Tlacitko pro smazani vyberu |
| `loading` | `boolean` | `false` | Loading spinner |
| `id` | `string` | auto random | HTML id |
| `name` | `string` | - | Form field name |
| `onChange` | `(value) => void` | - | Callback pri zmene |
| `onOpenChange` | `(isOpen: boolean) => void` | - | Callback pri otevreni/zavreni |
| `className` | `string` | - | Custom CSS |

**Pristupnost:** `aria-expanded`, `aria-haspopup="listbox"` na trigger button.
Hidden native `<select>` pro form submission. Chybi `role="listbox"` na dropdown kontejneru
a `role="option"` na polozkach -- WCAG nesplneno pro keyboard navigaci.

---

### 8.16 Slider

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/Slider.jsx` |
| **Pocet radku** | 20 |
| **Popis** | Radix Slider s Tailwind styly. Standardni shadcn/ui pattern. |
| **Export** | `export { Slider }` |
| **Forge compliance** | NE -- Tailwind semantic (`bg-primary`, `bg-secondary`) |
| **Zavislosti** | React, `@radix-ui/react-slider`, `cn()` |

**Props:** Vsechny Radix Slider props (`value`, `onValueChange`, `min`, `max`, `step`, atd.) + `className`.

**Poznamka:** Import `cn` z `utils/cn` (bez `../../` nebo `@/`) -- pouziva bare path
coz predpoklada Vite alias nebo resolve config.

---

### 8.17 Tooltip (Compound Component)

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/tooltip.jsx` |
| **Pocet radku** | 31 |
| **Popis** | Radix Tooltip s animacemi a stylovanym contentem. |
| **Export** | `export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }` |
| **Forge compliance** | NE -- Tailwind (`bg-popover`, `text-popover-foreground`) |
| **Zavislosti** | React, `@radix-ui/react-tooltip`, `cn()` |

**Sub-komponenty:**

| Sub-komponenta | Vlastni props |
|----------------|---------------|
| `TooltipProvider` | Radix Provider props (`delayDuration`, `skipDelayDuration`) |
| `Tooltip` | Radix Root props (`open`, `onOpenChange`, `defaultOpen`) |
| `TooltipTrigger` | Radix Trigger props (`asChild`) |
| `TooltipContent` | `sideOffset` (default `8`), `className`, `ref` + Radix Content props |

---

### 8.18 WelcomeHeader

| Vlastnost | Hodnota |
|-----------|---------|
| **Soubor** | `src/components/ui/WelcomeHeader.jsx` |
| **Pocet radku** | 17 |
| **Popis** | Jednoduchy welcome banner pro admin. Hardcoded cesky pozdrav. |
| **Export** | `export default WelcomeHeader` |
| **Forge compliance** | NE -- Tailwind (`text-foreground`, `text-muted-foreground`) |
| **Zavislosti** | React |

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `name` | `string` | - | Jmeno uzivatele |
| `subtitle` | `string` \| `ReactNode` | - | Popis pod pozdravem |

**VAROVANI:** Hardcoded cesky text `"Vitejte zpet, {name}!"` -- neni prelozitelne.
V anglicke verzi se zobrazi cesky pozdrav.

---

## 11. Preklady (i18n)

### 11.1 Komponenty s i18n podporou

| Komponenta | i18n metoda | Preklady |
|------------|------------|----------|
| **Header** | `useLanguage()` + `t()` | `nav.home`, `nav.demo`, `nav.pricing`, `nav.support`, `nav.admin`, `nav.login`, `nav.register`, `nav.account`, `nav.logout` |
| **Footer** | `useLanguage()` + `t()` | `footer.description`, `footer.nav.title`, `footer.legal.title`, `footer.legal.privacy`, `footer.legal.terms`, `footer.copyright`, `nav.home`, `nav.demo`, `nav.pricing`, `nav.support` |

### 11.2 Komponenty s hardcoded textem (i18n problemy)

| Komponenta | Hardcoded text | Jazyk | Priorita |
|------------|---------------|-------|----------|
| **WelcomeHeader** | `"Vitejte zpet, {name}!"` | CS | P1 -- viditelne v admin |
| **Select** | `"Select an option"`, `"No options found"`, `"No options available"`, `"Search options..."` | EN | P2 -- form placeholder |
| **ErrorState** | `"Connection error"`, `"Something went wrong"`, `"An unexpected error occurred"`, `"Retry"`, `"Try again"` | EN | P2 |
| **LoadingState** | Zadny hardcoded text (text prichazi jako prop) | - | OK |
| **Dialog** | `"Zavrit"` (sr-only close button) | CS | P3 -- jen screen reader |
| **ColorPicker** | `"Vybrat barvu"`, `"Hotovo"`, `"Vybrat {color}"` | CS | P2 -- admin branding |
| **Select** | `"Select..."` (native hidden select) | EN | P3 |

### 11.3 Shruti

Projekt ma **smiseny jazyk** v base komponentach:
- Header a Footer korektne pouzivaji LanguageContext
- WelcomeHeader, Dialog, ColorPicker maji cesky hardcoded text
- Select, ErrorState maji anglicky hardcoded text
- Zadna base komponenta krome Header/Footer nepouziva `useLanguage()` hook

---

## 12. Pristupnost

### 12.1 Komponenty s dobrou pristupnosti

| Komponenta | WCAG splneni | Detaily |
|------------|-------------|---------|
| **Button** | Dobre | `focus-visible:ring-2`, `aria-disabled`, `disabled`, spinner s `aria-hidden` |
| **Dialog** | Dobre | Radix zajistuje focus trap, ESC dismiss, `role="dialog"`, `aria-modal`, sr-only close text |
| **Tooltip** | Dobre | Radix zajistuje keyboard trigger, dismiss, correct ARIA |
| **Slider** | Dobre | Radix zajistuje keyboard arrows, ARIA slider role |
| **Label** | Dobre | Radix zajistuje spravne `htmlFor` propojeni |
| **Checkbox** | Dobre | `htmlFor` propojeni, `sr-only` nativni input, focus ring |
| **Header** | Dobre | `aria-haspopup`, `aria-expanded`, `role="dialog"`, `role="menu"`, ESC close |
| **Input** | Dobre | `htmlFor` propojeni, focus ring, error stav |

### 12.2 Komponenty s pristupnostnimi nedostatky

| Komponenta | Problem | Zavaznost |
|------------|---------|-----------|
| **Select** | Chybi `role="listbox"` na dropdown, chybi `role="option"` na polozkach, chybi keyboard navigace (sipky, Home/End, type-ahead) | P1 -- WCAG AA nesplneno |
| **ErrorState** | SVG ikony nemaji `aria-hidden="true"` | P3 -- minor |
| **LoadingState** | Chybi `role="status"` a `aria-live="polite"` pro screen readery | P2 -- screen reader neoznami loading |
| **ColorPicker** | Chybi keyboard navigace ve swatches gridu | P2 |
| **BackgroundPattern** | Chybi `aria-hidden="true"` na dekorativnim elementu | P3 -- minor |
| **WelcomeHeader** | Heading level `h1` -- overit zda stranka nema jiny h1 | P3 |
| **Footer** | `<h4>` tagy pro section headings -- heading hierarchie neodpovida HTML strukture | P3 |

### 12.3 WCAG AA kontrastni problemy

| Komponenta | Element | Predek/Pozadi | Barva textu | Problem |
|------------|---------|--------------|-------------|---------|
| **LoadingState** | Loading text | `bg-gray-200` (skeleton) | `text-gray-500` | Kontrast 3.13:1 -- NESPLNUJE AA (4.5:1 pro text) |
| **ErrorState** (inline) | Error text | White bg (assumed) | `text-red-600` (#DC2626) | OK -- 4.63:1 |
| **Select** | Dropdown | `bg-white` | `text-black` | OK -- maximalni kontrast, ale neodpovida dark theme |

---

## 17. Zname omezeni

### 17.1 Architekturalni omezeni

**O1 - Tri ruzne styling pristupy**
Tailwind + inline Forge tokeny + CSS-in-JS koexistuji bez jasne strategie. Header/Footer
pouzivaji inline Forge, Input pouziva mix, zbytek pouziva Tailwind. Neni definovano
kdy pouzit ktery pristup.

**O2 - Nekonzistentni export pattern**
Nektere komponenty maji dual export (default + named), jine jen default, jine jen named.
Button je obzvlast matouci -- oba importy funguje, ale ruzni konzumenti pouzivaji ruzny styl.

**O3 - Zadne TypeScript typy**
Vsechny komponenty jsou v JSX (ne TSX). Zadne PropTypes ani TypeScript typy.
Pouze LoadingState a ErrorState maji JSDoc komentare s @param.

**O4 - Zadne unit testy**
Neexistuji testy pro zadnou base UI komponentu.

### 17.2 Theme omezeni

**O5 - Select.jsx neni dark-theme compatible**
Hardcoded `bg-white text-black` na trigeru i dropdown -- jedina form komponenta
ktera neni theme-agnosticka.

**O6 - LoadingState/ErrorState hardcoded barvy**
Pouzivaji primo Tailwind barvy (`bg-gray-200`, `bg-blue-500`, `text-red-600`) misto
semantic tokenu nebo Forge CSS custom properties.

**O7 - BackgroundPattern je light-only**
Hardcoded `background: 'white'` -- nepouzitelne v dark theme.

### 17.3 Pristupnostni omezeni

**O8 - Select chybi kompletni keyboard navigace**
Dropdown nema `role="listbox"`, polozky nemaji `role="option"`, chybi sipkova navigace
a type-ahead search. Pro WCAG AA compliance by bylo treba prepsat na Radix Select
nebo pridat manualni keyboard handling.

**O9 - LoadingState chybi aria-live**
Screen readery neoznami zmenu loading stavu. Chybi `role="status"` a `aria-live="polite"`.

### 17.4 i18n omezeni

**O10 - Mix CS/EN hardcoded textu**
WelcomeHeader, Dialog, ColorPicker maji ceske texty; Select a ErrorState maji anglicke.
Pouze Header a Footer pouzivaji LanguageContext.

### 17.5 Potencialni build problemy

**O11 - label.jsx importuje z `@/lib/utils`**
Vsechny ostatni komponenty importuji cn z `../../utils/cn` nebo `@/utils/cn`.
Label importuje z `@/lib/utils` coz je jiny path -- OVERIT zda existuje.

**O12 - Slider.jsx importuje z `utils/cn` (bare path)**
Bez `../../` nebo `@/` -- spolehaceny na Vite resolve konfiguraci.

**O13 - Lowercase nazvy souboru**
`label.jsx` a `tooltip.jsx` zacinaji malym pismenem. Na case-sensitive OS (Linux/CI)
muze import `from './Label'` selhat.

### 17.6 Nepouzivane komponenty (potencialne)

Na zaklade grep analazy nebyly nalezeny zadne importy pro:
- `Container.jsx`
- `Slider.jsx`
- `label.jsx`
- `tooltip.jsx`
- `BackgroundPattern.jsx`

Tyto komponenty MOHOU byt importovany dynamicky, pres re-exporty, nebo neprime cesty
ktere grep nezachytil. Pred odstranenin je NUTNE overit build + runtime.

---

## Appendix A -- Souhrnna tabulka

| # | Komponenta | Radku | Export | forwardRef | Forge | Radix | i18n | A11y |
|---|-----------|-------|--------|-----------|-------|-------|------|------|
| 1 | BackgroundPattern | 17 | default | NE | NE | NE | - | Chybi aria-hidden |
| 2 | Button | 149 | dual | ANO | NE | Slot | - | Dobre |
| 3 | Card | 61 | named | ANO | NE | NE | - | OK |
| 4 | Checkbox | 55 | named | ANO | NE | NE | - | Dobre |
| 5 | ColorPicker | 151 | default | NE | Cast. | NE | CS hard | P2 keyboard |
| 6 | Container | 12 | default | NE | NE | NE | - | OK |
| 7 | Dialog | 109 | named | ANO | NE | Dialog | CS hard | Dobre |
| 8 | ErrorState | 121 | dual | NE | NE | NE | EN hard | P3 svg |
| 9 | Footer | 174 | default | NE | ANO | NE | ANO | P3 heading |
| 10 | Header | 463 | default | NE | ANO | NE | ANO | Dobre |
| 11 | Icon | 10 | default | NE | N/A | NE | - | N/A |
| 12 | Input | 58 | default | ANO | Cast. | NE | - | Dobre |
| 13 | Label | 17 | named | ANO | NE | Label | - | Dobre |
| 14 | LoadingState | 104 | dual | NE | NE | NE | - | P2 aria-live |
| 15 | Select | 239 | default | ANO | NE | NE | EN hard | P1 keyboard |
| 16 | Slider | 20 | named | ANO | NE | Slider | - | Dobre |
| 17 | Tooltip | 31 | named | ANO | NE | Tooltip | - | Dobre |
| 18 | WelcomeHeader | 17 | default | NE | NE | NE | CS hard | P3 |

**Legenda:**
- **dual** = default + named export
- **Cast.** = castecna Forge compliance
- **CS hard** = hardcoded cesky text
- **EN hard** = hardcoded anglicky text

---

*Dokument vygenerovan: 2026-02-13*
*Agent: mp-mid-design-system*
*Stav: Pouze dokumentace, zadne zmeny kodu*
