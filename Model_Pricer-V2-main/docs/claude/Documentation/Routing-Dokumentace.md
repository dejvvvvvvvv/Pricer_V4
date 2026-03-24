# Routing — Dokumentace

> **Datum:** 2026-03-22
> **Verze:** 1.0

---

## 1. Prehled

Toto je dokumentace vsech routing pravidel v aplikaci ModelPricer.

---

## 2. Struktura Routes.jsx

Soubor `src/Routes.jsx` je centralni body routingu.

---

## 3. Verejne Stranky

Dostupne bez prihlaseni:

| Path | Komponenta | Popis |
|------|-----------|-------|
| `/` | Home | Domovska stranka |
| `/pricing` | Pricing | Cenikova stranka |
| `/support` | Support | Support stranka |
| `/model-upload` | ModelUpload | Upload 3D modelu |

---

## 4. Admin Routes

Chranene AdminPrivateRoute - admin-only.

| Path | Komponenta | Popis |
|------|-----------|-------|
| `/admin` | AdminDashboard | Admin dashboard |
| `/admin/branding` | AdminBranding | Sprava branding |

---

## 5. Customer Portal Routes

Chranene CustomerPrivateRoute - customer-only.

### 5.1 Verejne (bez prihlaseni)

| Path | Komponenta |
|------|-----------|
| `/portal/login` | CustomerLogin |
| `/portal/register` | CustomerRegister |

### 5.2 Chranene (s prihlasenim)

| Path | Komponenta | Popis |
|------|-----------|-------|
| `/portal` | CustomerDashboard | Uvodni stranka |
| `/portal/orders` | CustomerOrders | Seznam objednavek |
| `/portal/orders/:id` | CustomerOrderDetail | Detail objednavky |
| `/portal/models` | CustomerModels | Knihovna modelu |
| `/portal/presets` | CustomerPresets | Ulozene presety |
| `/portal/profile` | CustomerProfile | Profil zakaznika |
| `/portal/support` | CustomerSupport | Support a FAQ |

---

## 6. Zmeny v tomto dokumentu

| Datum | Zmena | Autor |
|-------|-------|-------|
| 2026-03-22 | Vytvoreni dokumentace | Claude Code |
