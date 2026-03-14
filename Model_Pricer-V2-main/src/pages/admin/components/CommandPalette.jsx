// CommandPalette — Global search / command palette for admin panel (Ctrl+K / Cmd+K)
// Enhanced: searches across orders, customers, presets, materials + admin pages/actions
// Storage: tenant-scoped via readTenantJson/writeTenantJson from adminTenantStorage.js
import React, { useState, useEffect, useRef, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut';
import { useAuth } from '../../../context/AuthContext';
import { loadOrders, getStatusLabel } from '../../../utils/adminOrdersStorage';
import { loadPricingConfigV3 } from '../../../utils/adminPricingStorage';
import { readTenantJson, writeTenantJson } from '../../../utils/adminTenantStorage';

// ─── Storage (recent items + recent searches) — tenant-scoped ───────────────
const RECENT_NAMESPACE = 'command-palette:recent';
const RECENT_SEARCHES_NAMESPACE = 'command-palette:searches';
const MAX_RECENT = 8;
const MAX_RECENT_SEARCHES = 5;
const MAX_PER_CATEGORY = 5;
const DEBOUNCE_MS = 300;

function loadRecent() {
  return readTenantJson(RECENT_NAMESPACE, []);
}

function saveRecent(items) {
  writeTenantJson(RECENT_NAMESPACE, items.slice(0, MAX_RECENT));
}

function loadRecentSearches() {
  return readTenantJson(RECENT_SEARCHES_NAMESPACE, []);
}

function saveRecentSearches(searches) {
  writeTenantJson(RECENT_SEARCHES_NAMESPACE, searches.slice(0, MAX_RECENT_SEARCHES));
}

// ─── Fuzzy match ────────────────────────────────────────────────────────────
function fuzzyMatch(query, text) {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  const queryWords = q.split(/\s+/).filter(Boolean);
  const textWords = t.split(/[\s\-_/]+/).filter(Boolean);
  return queryWords.every((qw) =>
    textWords.some((tw) => tw.startsWith(qw))
  );
}

function matchScore(query, text) {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  return 30;
}

// ─── Data loaders (lazy, cached per open) ───────────────────────────────────
function loadOrderItems() {
  try {
    const orders = loadOrders();
    if (!Array.isArray(orders)) return [];
    return orders.map((o) => {
      const name = o.customer?.name || o.customerName || '';
      const email = o.customer?.email || o.customerEmail || '';
      const orderId = o.id || o.orderId || '';
      const status = getStatusLabel(o.status || 'NEW', 'cs');
      return {
        id: `order-${orderId}`,
        label: `#${orderId}`,
        description: name ? `${name} — ${status}` : status,
        icon: 'ShoppingCart',
        path: `/admin/orders`,
        category: 'objednavky',
        categoryBadge: 'Objednavka',
        keywords: `${orderId} ${name} ${email} ${o.status || ''}`.trim(),
      };
    });
  } catch { return []; }
}

function loadCustomerItems() {
  try {
    const orders = loadOrders();
    if (!Array.isArray(orders)) return [];
    const byEmail = new Map();
    for (const o of orders) {
      const email = o.customer?.email || o.customerEmail || '';
      const name = o.customer?.name || o.customerName || '';
      if (!email && !name) continue;
      const key = email || name;
      if (!byEmail.has(key)) {
        byEmail.set(key, { name, email, count: 0 });
      }
      byEmail.get(key).count++;
    }
    const items = [];
    for (const [key, c] of byEmail) {
      items.push({
        id: `customer-${key}`,
        label: c.name || c.email,
        description: c.name ? `${c.email} — ${c.count} obj.` : `${c.count} obj.`,
        icon: 'User',
        path: '/admin/customers',
        category: 'zakaznici',
        categoryBadge: 'Zakaznik',
        keywords: `${c.name} ${c.email}`.trim(),
      });
    }
    return items;
  } catch { return []; }
}

function loadPresetItems() {
  try {
    const raw = readTenantJson('presets:v1', []);
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.presets) ? raw.presets : Array.isArray(raw?.items) ? raw.items : [];
    return list
      .filter((p) => p && (p.id || p.name))
      .map((p) => ({
        id: `preset-${p.id || p.name}`,
        label: p.name || p.id,
        description: p.material ? `Material: ${p.material}` : 'Konfigurace tisku',
        icon: 'Sliders',
        path: '/admin/presets',
        category: 'presety',
        categoryBadge: 'Preset',
        keywords: `${p.name || ''} ${p.material || ''} ${p.id || ''}`.trim(),
      }));
  } catch { return []; }
}

function loadMaterialItems() {
  try {
    const config = loadPricingConfigV3();
    const materials = config?.materials || [];
    return materials
      .filter((m) => m && m.name)
      .map((m) => ({
        id: `material-${m.id || m.key || m.name}`,
        label: m.name,
        description: m.price_per_gram != null ? `${m.price_per_gram} Kc/g` : 'Material',
        icon: 'Layers',
        path: '/admin/parameters',
        category: 'materialy',
        categoryBadge: 'Material',
        keywords: `${m.name} ${m.key || ''} material`.trim(),
      }));
  } catch { return []; }
}

// ─── Static command definitions ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'nav-dashboard', label: 'Dashboard', description: 'Hlavni prehled', icon: 'LayoutDashboard', path: '/admin', category: 'stranky', categoryBadge: 'Stranka', keywords: 'dashboard prehled home uvod' },
  { id: 'nav-orders', label: 'Objednavky', description: 'Sprava objednavek', icon: 'ShoppingCart', path: '/admin/orders', category: 'stranky', categoryBadge: 'Stranka', keywords: 'orders objednavky seznam' },
  { id: 'nav-payments', label: 'Platby', description: 'Prehled plateb a fakturace', icon: 'CreditCard', path: '/admin/payments', category: 'stranky', categoryBadge: 'Stranka', keywords: 'payments platby fakturace' },
  { id: 'nav-customers', label: 'Zakaznici', description: 'Sprava zakazniku', icon: 'Users', path: '/admin/customers', category: 'stranky', categoryBadge: 'Stranka', keywords: 'customers zakaznici' },
  { id: 'nav-pricing', label: 'Pricing', description: 'Nastaveni ceniku', icon: 'Calculator', path: '/admin/pricing', category: 'stranky', categoryBadge: 'Stranka', keywords: 'pricing cenik ceny nastaveni' },
  { id: 'nav-fees', label: 'Poplatky', description: 'Sprava poplatku', icon: 'Receipt', path: '/admin/fees', category: 'stranky', categoryBadge: 'Stranka', keywords: 'fees poplatky priplatky' },
  { id: 'nav-parameters', label: 'Parametry', description: 'Materialy, technologie, barvy', icon: 'Settings2', path: '/admin/parameters', category: 'stranky', categoryBadge: 'Stranka', keywords: 'parameters parametry materialy technologie barvy' },
  { id: 'nav-presets', label: 'Presety', description: 'Ulozene konfigurace', icon: 'Sliders', path: '/admin/presets', category: 'stranky', categoryBadge: 'Stranka', keywords: 'presets presety konfigurace sablony' },
  { id: 'nav-express', label: 'Express', description: 'Expresni objednavky', icon: 'Zap', path: '/admin/express', category: 'stranky', categoryBadge: 'Stranka', keywords: 'express rychle objednavky' },
  { id: 'nav-shipping', label: 'Doprava', description: 'Nastaveni dopravy', icon: 'Truck', path: '/admin/shipping', category: 'stranky', categoryBadge: 'Stranka', keywords: 'shipping doprava zasilky' },
  { id: 'nav-coupons', label: 'Kupony', description: 'Slevove kody', icon: 'Tag', path: '/admin/coupons', category: 'stranky', categoryBadge: 'Stranka', keywords: 'coupons kupony slevy kody' },
  { id: 'nav-branding', label: 'Branding', description: 'Logo, barvy, vizualni identita', icon: 'Palette', path: '/admin/branding', category: 'stranky', categoryBadge: 'Stranka', keywords: 'branding logo barvy design vizual' },
  { id: 'nav-widget', label: 'Widget', description: 'Konfigurace embeddovaneho widgetu', icon: 'Code2', path: '/admin/widget', category: 'stranky', categoryBadge: 'Stranka', keywords: 'widget embed kalkulacka' },
  { id: 'nav-emails', label: 'Emaily', description: 'Emailove sablony', icon: 'Mail', path: '/admin/emails', category: 'stranky', categoryBadge: 'Stranka', keywords: 'emails emaily sablony notifikace' },
  { id: 'nav-team', label: 'Tym', description: 'Sprava tymu a pristupu', icon: 'Users', path: '/admin/team', category: 'stranky', categoryBadge: 'Stranka', keywords: 'team tym pristup uzivatele role' },
  { id: 'nav-analytics', label: 'Analytika', description: 'Statistiky a grafy', icon: 'BarChart3', path: '/admin/analytics', category: 'stranky', categoryBadge: 'Stranka', keywords: 'analytics analytika statistiky grafy' },
  { id: 'nav-activity', label: 'Log aktivity', description: 'Historie zmen a akci', icon: 'ClipboardList', path: '/admin/activity', category: 'stranky', categoryBadge: 'Stranka', keywords: 'activity log aktivita historie zmeny' },
  { id: 'nav-model-storage', label: 'Uloziste modelu', description: 'Sprava nahranych 3D modelu', icon: 'HardDrive', path: '/admin/model-storage', category: 'stranky', categoryBadge: 'Stranka', keywords: 'model storage uloziste soubory 3d' },
  { id: 'nav-system', label: 'System Health', description: 'Zdravi systemu a diagnostika', icon: 'HeartPulse', path: '/admin/system', category: 'stranky', categoryBadge: 'Stranka', keywords: 'system health zdravi stav diagnostika' },
  { id: 'nav-migration', label: 'Migrace', description: 'Datova migrace a Supabase', icon: 'Database', path: '/admin/migration', category: 'stranky', categoryBadge: 'Stranka', keywords: 'migration migrace databaze supabase' },
  { id: 'nav-integrations', label: 'Integrace', description: 'Externi sluzby a API', icon: 'Plug', path: '/admin/integrations', category: 'stranky', categoryBadge: 'Stranka', keywords: 'integrations integrace shopify api' },
  { id: 'nav-webhooks', label: 'Webhooky', description: 'Konfigurace webhooku', icon: 'Webhook', path: '/admin/webhooks', category: 'stranky', categoryBadge: 'Stranka', keywords: 'webhooks webhook notifikace' },
];

const ACTION_ITEMS = [
  { id: 'act-new-order', label: 'Vytvorit objednavku', description: 'Prejit na objednavky a pridat novou', icon: 'Plus', path: '/admin/orders', category: 'akce', categoryBadge: 'Akce', keywords: 'nova objednavka vytvorit pridat create order' },
  { id: 'act-export', label: 'Export objednavek', description: 'Stahnout CSV/JSON', icon: 'Download', action: 'export-orders', category: 'akce', categoryBadge: 'Akce', keywords: 'export objednavky csv json stahnout' },
  { id: 'act-report', label: 'Generovat report', description: 'Prejit na analytiku a generovat report', icon: 'FileText', path: '/admin/analytics', category: 'akce', categoryBadge: 'Akce', keywords: 'report generovat analytika statistiky prehled' },
  { id: 'act-theme', label: 'Prepnout motiv', description: 'Svetly / tmavy rezim', icon: 'Sun', action: 'toggle-theme', category: 'akce', categoryBadge: 'Akce', keywords: 'theme motiv svetly tmavy dark light prepnout' },
  { id: 'act-api-docs', label: 'API Dokumentace', description: 'Otevrit /api/docs/html', icon: 'BookOpen', action: 'open-api-docs', category: 'akce', categoryBadge: 'Akce', keywords: 'api docs dokumentace swagger' },
  { id: 'act-health', label: 'System Health', description: 'Zkontrolovat stav systemu', icon: 'HeartPulse', path: '/admin/system', category: 'akce', categoryBadge: 'Akce', keywords: 'health system stav kontrola' },
  { id: 'act-logout', label: 'Odhlasit se', description: 'Ukoncit relaci', icon: 'LogOut', action: 'logout', category: 'akce', categoryBadge: 'Akce', keywords: 'logout odhlasit konec relace' },
];

// Category display order and labels
const CATEGORY_CONFIG = {
  nedavne:    { label: 'NEDAVNE',     icon: 'Clock',        color: 'var(--forge-text-muted, #7A8291)' },
  stranky:    { label: 'STRANKY',     icon: 'Layout',       color: '#60A5FA' },
  objednavky: { label: 'OBJEDNAVKY',  icon: 'ShoppingCart', color: '#F0A030' },
  zakaznici:  { label: 'ZAKAZNICI',   icon: 'Users',        color: '#A78BFA' },
  presety:    { label: 'PRESETY',     icon: 'Sliders',      color: '#34D399' },
  materialy:  { label: 'MATERIALY',   icon: 'Layers',       color: '#F472B6' },
  akce:       { label: 'AKCE',        icon: 'Zap',          color: '#FBBF24' },
};

const CATEGORY_ORDER = ['nedavne', 'objednavky', 'zakaznici', 'presety', 'materialy', 'stranky', 'akce'];

// Badge colors per category
const BADGE_COLORS = {
  Stranka: { bg: 'rgba(96,165,250,0.12)', text: '#60A5FA' },
  Objednavka: { bg: 'rgba(240,160,48,0.12)', text: '#F0A030' },
  Zakaznik: { bg: 'rgba(167,139,250,0.12)', text: '#A78BFA' },
  Preset: { bg: 'rgba(52,211,153,0.12)', text: '#34D399' },
  Material: { bg: 'rgba(244,114,182,0.12)', text: '#F472B6' },
  Akce: { bg: 'rgba(251,191,36,0.12)', text: '#FBBF24' },
};

// ─── Component ──────────────────────────────────────────────────────────────
function CommandPaletteInner(_props, ref) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState(loadRecent);
  const [recentSearches, setRecentSearches] = useState(loadRecentSearches);

  // Dynamic data, loaded once when palette opens
  const [dynamicData, setDynamicData] = useState(null);

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const overlayRef = useRef(null);
  const debounceRef = useRef(null);

  const auth = useAuth();

  // Open/close
  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
    setDynamicData(null);
  }, []);

  // Expose open method via ref so header search button can trigger it
  useImperativeHandle(ref, () => ({ open: handleOpen }), [handleOpen]);

  // Ctrl+K / Cmd+K to open
  useKeyboardShortcut('k', handleOpen, { ctrlKey: true, allowInInputs: true });

  // Load dynamic data when palette opens
  useEffect(() => {
    if (!open) return;
    // Load data on open (not on every keystroke)
    const data = {
      orders: loadOrderItems(),
      customers: loadCustomerItems(),
      presets: loadPresetItems(),
      materials: loadMaterialItems(),
    };
    setDynamicData(data);
  }, [open]);

  // Debounce search query
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // All static items combined (for recent lookup)
  const allStaticItems = useMemo(() => [...NAV_ITEMS, ...ACTION_ITEMS], []);

  // Build flat result list from debounced query
  const { flatItems, groupedResults, totalCounts } = useMemo(() => {
    const grouped = [];
    const flat = [];
    const counts = {};

    const dynamicCategories = dynamicData ? {
      objednavky: dynamicData.orders,
      zakaznici: dynamicData.customers,
      presety: dynamicData.presets,
      materialy: dynamicData.materials,
    } : {};

    const staticCategories = {
      stranky: NAV_ITEMS,
      akce: ACTION_ITEMS,
    };

    const allCategories = { ...dynamicCategories, ...staticCategories };

    if (!debouncedQuery.trim()) {
      // --- No query: show recent items, then recent searches hint ---
      // Recent visited items
      const recentItems = recentIds
        .map((id) => {
          // Search static items
          const found = allStaticItems.find((it) => it.id === id);
          if (found) return found;
          // Search dynamic items
          if (dynamicData) {
            for (const arr of Object.values(dynamicData)) {
              const d = arr.find((it) => it.id === id);
              if (d) return d;
            }
          }
          return null;
        })
        .filter(Boolean);

      if (recentItems.length > 0) {
        grouped.push({ key: 'nedavne', items: recentItems });
        recentItems.forEach((it) => flat.push(it));
      }

      // Show first few from pages and actions
      const pagesSlice = NAV_ITEMS.slice(0, MAX_PER_CATEGORY);
      if (pagesSlice.length > 0) {
        grouped.push({ key: 'stranky', items: pagesSlice, totalCount: NAV_ITEMS.length });
        pagesSlice.forEach((it) => flat.push(it));
      }

      const actionsSlice = ACTION_ITEMS.slice(0, MAX_PER_CATEGORY);
      if (actionsSlice.length > 0) {
        grouped.push({ key: 'akce', items: actionsSlice, totalCount: ACTION_ITEMS.length });
        actionsSlice.forEach((it) => flat.push(it));
      }
    } else {
      // --- Query active: search all categories ---
      for (const catKey of CATEGORY_ORDER) {
        if (catKey === 'nedavne') continue;
        const items = allCategories[catKey];
        if (!items || items.length === 0) continue;

        const matches = items
          .filter((it) => {
            const searchable = `${it.label} ${it.description} ${it.keywords || ''}`;
            return fuzzyMatch(debouncedQuery, searchable);
          })
          .sort((a, b) => {
            const aScore = matchScore(debouncedQuery, `${a.label} ${a.keywords || ''}`);
            const bScore = matchScore(debouncedQuery, `${b.label} ${b.keywords || ''}`);
            return bScore - aScore;
          });

        counts[catKey] = matches.length;
        const sliced = matches.slice(0, MAX_PER_CATEGORY);

        if (sliced.length > 0) {
          grouped.push({ key: catKey, items: sliced, totalCount: matches.length });
          sliced.forEach((it) => flat.push(it));
        }
      }
    }

    return { flatItems: flat, groupedResults: grouped, totalCounts: counts };
  }, [debouncedQuery, recentIds, dynamicData, allStaticItems]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  // Save search query to recent searches
  const recordSearch = useCallback((q) => {
    if (!q || q.trim().length < 2) return;
    const trimmed = q.trim();
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((s) => s !== trimmed)].slice(0, MAX_RECENT_SEARCHES);
      saveRecentSearches(next);
      return next;
    });
  }, []);

  // Execute a command item
  const executeItem = useCallback((item) => {
    // Record the search query if there was one
    if (debouncedQuery.trim()) {
      recordSearch(debouncedQuery);
    }

    // Add to recent visited
    setRecentIds((prev) => {
      const next = [item.id, ...prev.filter((id) => id !== item.id)].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });

    handleClose();

    if (item.path) {
      navigate(item.path);
      return;
    }

    if (item.action) {
      switch (item.action) {
        case 'export-orders':
          navigate('/admin/orders');
          break;
        case 'toggle-theme':
          document.documentElement.classList.toggle('light-theme');
          break;
        case 'open-api-docs':
          window.open('/api/docs/html', '_blank');
          break;
        case 'logout':
          if (auth?.logout) auth.logout();
          break;
        default:
          break;
      }
    }
  }, [navigate, handleClose, auth, debouncedQuery, recordSearch]);

  // Apply a recent search
  const applyRecentSearch = useCallback((searchTerm) => {
    setQuery(searchTerm);
    // Immediately set debounced too for instant feedback
    setDebouncedQuery(searchTerm);
    setSelectedIndex(0);
  }, []);

  // Keyboard navigation inside palette
  const handleKeyDown = useCallback((e) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          executeItem(flatItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        handleClose();
        break;
      default:
        break;
    }
  }, [open, flatItems, selectedIndex, executeItem, handleClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Click outside to close
  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) {
      handleClose();
    }
  }, [handleClose]);

  // Pre-compute flat index for each item in each group (avoids mutable let in render)
  const groupsWithIndex = useMemo(() => {
    let idx = 0;
    return groupedResults.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item, _flatIdx: idx++ })),
    }));
  }, [groupedResults]);

  if (!open) return null;

  const showRecentSearches = !debouncedQuery.trim() && recentSearches.length > 0;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
        backgroundColor: 'rgba(8, 9, 12, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'cp-fade-in 150ms ease-out',
      }}
      role="presentation"
    >
      {/* Palette container */}
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          margin: '0 16px',
          backgroundColor: 'var(--forge-bg-surface, #1a1b23)',
          border: '1px solid var(--forge-border-default, #2a2b35)',
          borderRadius: 'var(--forge-radius-lg, 12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
          animation: 'cp-scale-in 150ms ease-out',
        }}
        role="combobox"
        aria-expanded="true"
        aria-haspopup="listbox"
        aria-owns="command-palette-list"
      >
        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderBottom: '1px solid var(--forge-border-default, #2a2b35)',
        }}>
          <Icon name="Search" size={18} style={{ color: 'var(--forge-text-muted, #7A8291)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hledat objednavky, zakazniky, presety, stranky..."
            autoComplete="off"
            spellCheck="false"
            aria-label="Globalni vyhledavani v admin panelu"
            aria-autocomplete="list"
            aria-controls="command-palette-list"
            aria-activedescendant={flatItems[selectedIndex] ? `cp-item-${flatItems[selectedIndex].id}` : undefined}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--forge-text-primary, #e8e9ed)',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '15px',
              padding: 0,
              lineHeight: '24px',
            }}
          />
          {/* Debounce indicator */}
          {query && query !== debouncedQuery && (
            <span style={{
              width: 14, height: 14, flexShrink: 0,
              border: '2px solid var(--forge-text-muted, #7A8291)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'cp-spin 600ms linear infinite',
            }} />
          )}
          <kbd style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 6px',
            fontSize: '11px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted, #7A8291)',
            backgroundColor: 'var(--forge-bg-elevated, #22232d)',
            border: '1px solid var(--forge-border-default, #2a2b35)',
            borderRadius: '4px',
            lineHeight: '16px',
            flexShrink: 0,
          }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          aria-label="Vysledky vyhledavani"
          style={{
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '6px 0',
            flex: 1,
          }}
        >
          {/* Recent searches (when no query) */}
          {showRecentSearches && (
            <div>
              <div style={{
                padding: '8px 18px 4px',
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--forge-text-muted, #7A8291)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Icon name="History" size={11} style={{ opacity: 0.6 }} />
                NEDAVNA HLEDANI
              </div>
              {recentSearches.map((term) => (
                <div
                  key={`rs-${term}`}
                  onClick={() => applyRecentSearch(term)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 18px',
                    margin: '1px 6px',
                    borderRadius: 'var(--forge-radius-sm, 6px)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontFamily: 'var(--forge-font-body)',
                    color: 'var(--forge-text-secondary, #a0a4b0)',
                    transition: 'background-color 80ms ease-out',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Icon name="Search" size={13} style={{ opacity: 0.4, flexShrink: 0 }} />
                  {term}
                </div>
              ))}
              <div style={{
                height: 1,
                backgroundColor: 'var(--forge-border-default, #2a2b35)',
                margin: '6px 18px',
              }} />
            </div>
          )}

          {/* No results */}
          {groupedResults.length === 0 && debouncedQuery.trim() && (
            <div style={{
              padding: '32px 18px',
              textAlign: 'center',
              color: 'var(--forge-text-muted, #7A8291)',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
            }}>
              <Icon name="SearchX" size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div>Zadne vysledky pro &ldquo;{debouncedQuery}&rdquo;</div>
            </div>
          )}

          {/* Grouped results */}
          {groupsWithIndex.map((group) => {
            const catConfig = CATEGORY_CONFIG[group.key] || { label: group.key.toUpperCase(), icon: 'Circle', color: '#7A8291' };

            return (
              <div key={group.key}>
                {/* Category header */}
                <div style={{
                  padding: '8px 18px 4px',
                  fontFamily: 'var(--forge-font-tech)',
                  fontSize: '10px',
                  fontWeight: 500,
                  color: catConfig.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Icon name={catConfig.icon} size={11} style={{ opacity: 0.7 }} />
                  {catConfig.label}
                  {group.totalCount != null && group.totalCount > MAX_PER_CATEGORY && (
                    <span style={{
                      fontSize: '9px',
                      color: 'var(--forge-text-muted, #7A8291)',
                      fontWeight: 400,
                    }}>
                      ({group.totalCount})
                    </span>
                  )}
                </div>

                {/* Items */}
                {group.items.map((item) => {
                  const idx = item._flatIdx;
                  const isSelected = idx === selectedIndex;
                  const badgeColors = BADGE_COLORS[item.categoryBadge] || { bg: 'rgba(122,130,145,0.12)', text: '#7A8291' };

                  return (
                    <div
                      key={item.id}
                      id={`cp-item-${item.id}`}
                      data-index={idx}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => executeItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 18px',
                        margin: '1px 6px',
                        borderRadius: 'var(--forge-radius-sm, 6px)',
                        cursor: 'pointer',
                        transition: 'background-color 80ms ease-out',
                        backgroundColor: isSelected
                          ? 'rgba(0, 212, 170, 0.12)'
                          : 'transparent',
                      }}
                    >
                      {/* Icon */}
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--forge-radius-sm, 6px)',
                        backgroundColor: isSelected
                          ? 'rgba(0, 212, 170, 0.15)'
                          : 'var(--forge-bg-elevated, #22232d)',
                        color: isSelected
                          ? 'var(--forge-accent-primary, #00D4AA)'
                          : 'var(--forge-text-secondary, #a0a4b0)',
                        flexShrink: 0,
                        transition: 'all 80ms ease-out',
                      }}>
                        <Icon name={item.icon} size={15} />
                      </span>

                      {/* Title + Subtitle */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '13px',
                          fontFamily: 'var(--forge-font-body)',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected
                            ? 'var(--forge-text-primary, #e8e9ed)'
                            : 'var(--forge-text-secondary, #a0a4b0)',
                          lineHeight: '18px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.label}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          fontFamily: 'var(--forge-font-body)',
                          color: 'var(--forge-text-muted, #7A8291)',
                          lineHeight: '16px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.description}
                        </div>
                      </div>

                      {/* Category badge */}
                      {item.categoryBadge && group.key !== 'nedavne' && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 7px',
                          fontSize: '9px',
                          fontFamily: 'var(--forge-font-tech)',
                          fontWeight: 500,
                          color: badgeColors.text,
                          backgroundColor: badgeColors.bg,
                          borderRadius: '3px',
                          lineHeight: '14px',
                          flexShrink: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          {item.categoryBadge}
                        </span>
                      )}

                      {/* Keyboard hint for selected */}
                      {isSelected && (
                        <kbd style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '1px 5px',
                          fontSize: '10px',
                          fontFamily: 'var(--forge-font-tech)',
                          color: 'var(--forge-text-muted, #7A8291)',
                          backgroundColor: 'rgba(0, 212, 170, 0.08)',
                          border: '1px solid rgba(0, 212, 170, 0.2)',
                          borderRadius: '3px',
                          lineHeight: '14px',
                          flexShrink: 0,
                        }}>
                          ENTER
                        </kbd>
                      )}
                    </div>
                  );
                })}

                {/* "See all X results" link */}
                {debouncedQuery.trim() && group.totalCount != null && group.totalCount > MAX_PER_CATEGORY && (
                  <div
                    onClick={() => {
                      const targetPaths = {
                        objednavky: '/admin/orders',
                        zakaznici: '/admin/customers',
                        presety: '/admin/presets',
                        materialy: '/admin/parameters',
                        stranky: null,
                        akce: null,
                      };
                      const path = targetPaths[group.key];
                      if (path) {
                        handleClose();
                        navigate(path);
                      }
                    }}
                    style={{
                      padding: '4px 18px 6px',
                      margin: '0 6px',
                      fontSize: '11px',
                      fontFamily: 'var(--forge-font-body)',
                      color: 'var(--forge-accent-primary, #00D4AA)',
                      cursor: 'pointer',
                      opacity: 0.8,
                      transition: 'opacity 80ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                  >
                    Zobrazit vsech {group.totalCount} vysledku...
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          borderTop: '1px solid var(--forge-border-default, #2a2b35)',
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '10px',
          color: 'var(--forge-text-muted, #7A8291)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={kbdStyle}>&#8593;</kbd>
              <kbd style={kbdStyle}>&#8595;</kbd>
              navigace
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={kbdStyle}>&#8629;</kbd>
              potvrdit
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <kbd style={kbdStyle}>ESC</kbd>
              zavrit
            </span>
          </div>
          <span>{flatItems.length} vysledku</span>
        </div>
      </div>

      <style>{`
        @keyframes cp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cp-scale-in {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cp-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const CommandPalette = forwardRef(CommandPaletteInner);
export default CommandPalette;

const kbdStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '18px',
  padding: '1px 4px',
  fontSize: '10px',
  fontFamily: 'var(--forge-font-tech)',
  color: 'var(--forge-text-muted, #7A8291)',
  backgroundColor: 'var(--forge-bg-elevated, #22232d)',
  border: '1px solid var(--forge-border-default, #2a2b35)',
  borderRadius: '3px',
  lineHeight: '14px',
};
