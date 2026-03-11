// CommandPalette — Global search / command palette for admin panel (Ctrl+K / Cmd+K)
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut';
import { useAuth } from '../../../context/AuthContext';

// ─── Storage ────────────────────────────────────────────────────────────────
const RECENT_KEY = 'modelpricer:admin:command-palette-recent';
const MAX_RECENT = 5;

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRecent(items) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

// ─── Fuzzy match ────────────────────────────────────────────────────────────
function fuzzyMatch(query, text) {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact substring
  if (t.includes(q)) return true;

  // Word-start matching: each query word must match start of some word in text
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
  return 30; // word-start match
}

// ─── Command definitions ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'nav-dashboard', label: 'Dashboard', description: 'Hlavni prehled', icon: 'LayoutDashboard', path: '/admin', keywords: 'dashboard prehled home uvod' },
  { id: 'nav-orders', label: 'Objednavky', description: 'Sprava objednavek', icon: 'ShoppingCart', path: '/admin/orders', keywords: 'orders objednavky seznam' },
  { id: 'nav-payments', label: 'Platby', description: 'Prehled plateb a fakturace', icon: 'CreditCard', path: '/admin/payments', keywords: 'payments platby fakturace' },
  { id: 'nav-customers', label: 'Zakaznici', description: 'Sprava zakazniku', icon: 'Users', path: '/admin/customers', keywords: 'customers zakaznici' },
  { id: 'nav-pricing', label: 'Pricing', description: 'Nastaveni ceniku', icon: 'Calculator', path: '/admin/pricing', keywords: 'pricing cenik ceny nastaveni' },
  { id: 'nav-fees', label: 'Poplatky', description: 'Sprava poplatku', icon: 'Receipt', path: '/admin/fees', keywords: 'fees poplatky priplatky' },
  { id: 'nav-parameters', label: 'Parametry', description: 'Materialy, technologie, barvy', icon: 'Settings2', path: '/admin/parameters', keywords: 'parameters parametry materialy technologie barvy' },
  { id: 'nav-presets', label: 'Presety', description: 'Ulozene konfigurace', icon: 'Sliders', path: '/admin/presets', keywords: 'presets presety konfigurace sablony' },
  { id: 'nav-express', label: 'Express', description: 'Expresni objednavky', icon: 'Zap', path: '/admin/express', keywords: 'express rychle objednavky' },
  { id: 'nav-shipping', label: 'Doprava', description: 'Nastaveni dopravy', icon: 'Truck', path: '/admin/shipping', keywords: 'shipping doprava zasilky' },
  { id: 'nav-coupons', label: 'Kupony', description: 'Slevove kody', icon: 'Tag', path: '/admin/coupons', keywords: 'coupons kupony slevy kody' },
  { id: 'nav-branding', label: 'Branding', description: 'Logo, barvy, vizualni identita', icon: 'Palette', path: '/admin/branding', keywords: 'branding logo barvy design vizual' },
  { id: 'nav-widget', label: 'Widget', description: 'Konfigurace embeddovaneho widgetu', icon: 'Code2', path: '/admin/widget', keywords: 'widget embed kalkulacka' },
  { id: 'nav-emails', label: 'Emaily', description: 'Emailove sablony', icon: 'Mail', path: '/admin/emails', keywords: 'emails emaily sablony notifikace' },
  { id: 'nav-team', label: 'Tym', description: 'Sprava tymu a pristupu', icon: 'Users', path: '/admin/team', keywords: 'team tym pristup uzivatele role' },
  { id: 'nav-analytics', label: 'Analytika', description: 'Statistiky a grafy', icon: 'BarChart3', path: '/admin/analytics', keywords: 'analytics analytika statistiky grafy' },
  { id: 'nav-activity', label: 'Log aktivity', description: 'Historie zmen a akci', icon: 'ClipboardList', path: '/admin/activity', keywords: 'activity log aktivita historie zmeny' },
  { id: 'nav-model-storage', label: 'Uloziste modelu', description: 'Sprava nahraných 3D modelu', icon: 'HardDrive', path: '/admin/model-storage', keywords: 'model storage uloziste soubory 3d' },
  { id: 'nav-system', label: 'System Health', description: 'Zdravi systemu a diagnostika', icon: 'HeartPulse', path: '/admin/system', keywords: 'system health zdravi stav diagnostika' },
  { id: 'nav-migration', label: 'Migrace', description: 'Datova migrace a Supabase', icon: 'Database', path: '/admin/migration', keywords: 'migration migrace databaze supabase' },
  { id: 'nav-integrations', label: 'Integrace', description: 'Externi sluzby a API', icon: 'Plug', path: '/admin/integrations', keywords: 'integrations integrace shopify api' },
  { id: 'nav-webhooks', label: 'Webhooky', description: 'Konfigurace webhooku', icon: 'Webhook', path: '/admin/webhooks', keywords: 'webhooks webhook notifikace' },
];

const ACTION_ITEMS = [
  { id: 'act-new-order', label: 'Nova objednavka', description: 'Prejit na objednavky', icon: 'Plus', path: '/admin/orders', keywords: 'nova objednavka vytvorit pridat' },
  { id: 'act-export', label: 'Export objednavek', description: 'Stahnout CSV/JSON', icon: 'Download', action: 'export-orders', keywords: 'export objednavky csv json stahnout' },
  { id: 'act-theme', label: 'Prepnout motiv', description: 'Svetly / tmavy rezim', icon: 'Sun', action: 'toggle-theme', keywords: 'theme motiv svetly tmavy dark light prepnout' },
  { id: 'act-api-docs', label: 'API Dokumentace', description: 'Otevrit /api/docs/html', icon: 'BookOpen', action: 'open-api-docs', keywords: 'api docs dokumentace swagger' },
  { id: 'act-health', label: 'System Health', description: 'Zkontrolovat stav systemu', icon: 'HeartPulse', path: '/admin/system', keywords: 'health system stav kontrola' },
  { id: 'act-logout', label: 'Odhlasit se', description: 'Ukoncit relaci', icon: 'LogOut', action: 'logout', keywords: 'logout odhlasit konec relace' },
];

const SETTINGS_ITEMS = [
  { id: 'set-pricing', label: 'Nastaveni ceniku', description: 'Upravit ceny a pravidla', icon: 'Calculator', path: '/admin/pricing', keywords: 'pricing cenik nastaveni ceny' },
  { id: 'set-fees', label: 'Nastaveni poplatku', description: 'Upravit poplatky', icon: 'Receipt', path: '/admin/fees', keywords: 'fees poplatky nastaveni' },
  { id: 'set-branding', label: 'Nastaveni brandingu', description: 'Logo, barvy, fonty', icon: 'Palette', path: '/admin/branding', keywords: 'branding logo nastaveni' },
  { id: 'set-shipping', label: 'Nastaveni dopravy', description: 'Ceny a metody dopravy', icon: 'Truck', path: '/admin/shipping', keywords: 'shipping doprava nastaveni' },
  { id: 'set-team', label: 'Sprava tymu', description: 'Role a pristupy', icon: 'Users', path: '/admin/team', keywords: 'team tym nastaveni role' },
  { id: 'set-integrations', label: 'Integrace', description: 'Shopify, API klice', icon: 'Plug', path: '/admin/integrations', keywords: 'integrace nastaveni shopify api' },
];

const CATEGORIES = [
  { key: 'recent', label: 'NEDAVNE', items: [] }, // filled dynamically
  { key: 'navigace', label: 'NAVIGACE', items: NAV_ITEMS },
  { key: 'akce', label: 'AKCE', items: ACTION_ITEMS },
  { key: 'nastaveni', label: 'NASTAVENI', items: SETTINGS_ITEMS },
];

const MAX_PER_CATEGORY = 10;

// ─── Component ──────────────────────────────────────────────────────────────
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState(loadRecent);

  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const overlayRef = useRef(null);

  let auth = null;
  try { auth = useAuth(); } catch { /* auth not available */ }

  // Open/close
  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  // Ctrl+K / Cmd+K to open
  useKeyboardShortcut('k', handleOpen, { ctrlKey: true, allowInInputs: true });

  // Focus input on open
  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM is ready
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

  // Build flat result list
  const { flatItems, groupedResults } = useMemo(() => {
    const grouped = [];
    const flat = [];

    if (!query.trim()) {
      // Show recent items first, then all categories
      const recentItems = recentIds
        .map((id) => {
          for (const cat of CATEGORIES) {
            const found = cat.items.find((it) => it.id === id);
            if (found) return found;
          }
          return null;
        })
        .filter(Boolean);

      if (recentItems.length > 0) {
        grouped.push({ label: 'NEDAVNE', items: recentItems });
        recentItems.forEach((it) => flat.push(it));
      }

      // Show first few from each category
      for (const cat of CATEGORIES) {
        if (cat.key === 'recent') continue;
        const items = cat.items.slice(0, 5);
        if (items.length > 0) {
          grouped.push({ label: cat.label, items });
          items.forEach((it) => flat.push(it));
        }
      }
    } else {
      // Filter by query
      for (const cat of CATEGORIES) {
        if (cat.key === 'recent') continue;
        const matches = cat.items
          .filter((it) => {
            const searchable = `${it.label} ${it.description} ${it.keywords || ''}`;
            return fuzzyMatch(query, searchable);
          })
          .sort((a, b) => {
            const aScore = matchScore(query, `${a.label} ${a.keywords || ''}`);
            const bScore = matchScore(query, `${b.label} ${b.keywords || ''}`);
            return bScore - aScore;
          })
          .slice(0, MAX_PER_CATEGORY);

        if (matches.length > 0) {
          grouped.push({ label: cat.label, items: matches });
          matches.forEach((it) => flat.push(it));
        }
      }
    }

    return { flatItems: flat, groupedResults: grouped };
  }, [query, recentIds]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Execute a command item
  const executeItem = useCallback((item) => {
    // Add to recent
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
          // Brief delay then trigger export UI hint
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
  }, [navigate, handleClose, auth]);

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

  if (!open) return null;

  let globalIndex = -1;

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
          maxWidth: 560,
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
            placeholder="Hledat stranky, akce, nastaveni..."
            autoComplete="off"
            spellCheck="false"
            aria-label="Vyhledavani v command palette"
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
          {groupedResults.length === 0 && (
            <div style={{
              padding: '32px 18px',
              textAlign: 'center',
              color: 'var(--forge-text-muted, #7A8291)',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
            }}>
              <Icon name="SearchX" size={28} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <div>Zadne vysledky pro "{query}"</div>
            </div>
          )}

          {groupedResults.map((group) => (
            <div key={group.label}>
              {/* Category header */}
              <div style={{
                padding: '8px 18px 4px',
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--forge-text-muted, #7A8291)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                {group.label}
              </div>

              {/* Items */}
              {group.items.map((item) => {
                globalIndex++;
                const idx = globalIndex;
                const isSelected = idx === selectedIndex;

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
            </div>
          ))}
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
      `}</style>
    </div>
  );
}

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
