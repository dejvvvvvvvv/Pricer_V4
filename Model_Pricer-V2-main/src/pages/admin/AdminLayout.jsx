// Admin Layout — FORGE Dark Theme with collapsible sidebar & grouped navigation
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { getTenantId } from '../../utils/adminTenantStorage';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ForgeBreadcrumb } from '../../components/ui/forge/ForgeBreadcrumb';
import NotificationCenter from './components/NotificationCenter';
import CommandPalette from './components/CommandPalette';

// Storage key for sidebar preferences
const SIDEBAR_STORAGE_KEY = 'modelpricer:admin:sidebar';

/** Read persisted sidebar state from localStorage */
function loadSidebarState() {
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

/** Persist sidebar state to localStorage */
function saveSidebarState(state) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

const ADMIN_NAV = [
  {
    group: 'Hlavni',
    groupIcon: 'Home',
    items: [
      { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', exact: true },
      { path: '/admin/orders', label: 'Orders', icon: 'ShoppingCart' },
      { path: '/admin/payments', label: 'Payments', icon: 'CreditCard' },
      { path: '/admin/customers', label: 'Customers', icon: 'Users' },
    ],
  },
  {
    group: 'Produkty',
    groupIcon: 'Package',
    items: [
      { path: '/admin/pricing', label: 'Pricing', icon: 'Calculator' },
      { path: '/admin/fees', label: 'Fees', icon: 'Receipt' },
      { path: '/admin/parameters', label: 'Parameters', icon: 'Settings2' },
      { path: '/admin/presets', label: 'Presets', icon: 'Sliders' },
      { path: '/admin/express', label: 'Express', icon: 'Zap' },
      { path: '/admin/shipping', label: 'Shipping', icon: 'Truck' },
      { path: '/admin/coupons', label: 'Coupons', icon: 'Tag' },
    ],
  },
  {
    group: 'Design',
    groupIcon: 'Paintbrush',
    items: [
      { path: '/admin/branding', label: 'Branding', icon: 'Palette' },
      { path: '/admin/widget', label: 'Widget', icon: 'Code2' },
      { path: '/admin/emails', label: 'Emails', icon: 'Mail' },
    ],
  },
  {
    group: 'System',
    groupIcon: 'Settings',
    items: [
      { path: '/admin/team', label: 'Team', icon: 'Users' },
      { path: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' },
      { path: '/admin/activity', label: 'Activity Log', icon: 'ClipboardList' },
      { path: '/admin/model-storage', label: 'Model Storage', icon: 'HardDrive' },
      { path: '/admin/system', label: 'System Health', icon: 'HeartPulse' },
      { path: '/admin/migration', label: 'Migration', icon: 'Database' },
      { path: '/admin/integrations', label: 'Integrations', icon: 'Plug' },
      { path: '/admin/webhooks', label: 'Webhooks', icon: 'Webhook' },
    ],
  },
];

const AdminLayout = () => {
  useDocumentTitle('Admin');
  const location = useLocation();
  const { t } = useLanguage();
  const { appVersion, isOnline } = useApp();
  const { copyToClipboard, copied: tenantCopied } = useCopyToClipboard();

  const tenantId = useMemo(() => {
    try { return getTenantId(); } catch { return ''; }
  }, []);
  const truncatedTenantId = tenantId ? (tenantId.length > 12 ? tenantId.slice(0, 12) + '...' : tenantId) : '';
  const isDev = import.meta.env.DEV;

  // --- Persisted sidebar state ---
  const savedState = useRef(loadSidebarState());

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return savedState.current?.collapsed ?? false;
  });
  const [userToggledCollapse, setUserToggledCollapse] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);
  const sidebarRef = useRef(null);

  // Group open/closed state — default all open
  const defaultGroups = () => {
    const map = {};
    ADMIN_NAV.forEach((g) => { map[g.group] = true; });
    return map;
  };
  const [openGroups, setOpenGroups] = useState(() => {
    return savedState.current?.openGroups ?? defaultGroups();
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Persist sidebar state on change
  useEffect(() => {
    saveSidebarState({ collapsed: sidebarCollapsed, openGroups });
  }, [sidebarCollapsed, openGroups]);

  // Toggle a nav group open/closed
  const toggleGroup = useCallback((groupName) => {
    setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  }, []);

  // Filter nav items by search
  const filteredNav = useMemo(() => {
    if (!searchQuery.trim()) return ADMIN_NAV;
    const q = searchQuery.toLowerCase();
    return ADMIN_NAV.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.path.toLowerCase().includes(q) ||
          group.group.toLowerCase().includes(q)
      ),
    })).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  // Robust scroll containment for fixed sidebar with smooth easing.
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;

    let targetY = 0;
    let rafId = null;

    const animate = () => {
      const nav = el.querySelector('nav');
      if (!nav) { rafId = null; return; }

      const diff = targetY - nav.scrollTop;
      if (Math.abs(diff) < 0.5) {
        nav.scrollTop = targetY;
        rafId = null;
        return;
      }
      nav.scrollTop += diff * 0.18;
      rafId = requestAnimationFrame(animate);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const nav = el.querySelector('nav');
      if (!nav) return;

      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 40;
      if (e.deltaMode === 2) delta *= nav.clientHeight;

      if (rafId === null) targetY = nav.scrollTop;

      const maxScroll = nav.scrollHeight - nav.clientHeight;
      targetY = Math.max(0, Math.min(maxScroll, targetY + delta));

      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-collapse on medium screens (only if user hasn't manually toggled)
  useEffect(() => {
    if (userToggledCollapse) return;
    if (windowWidth < 1200 && windowWidth >= 768) {
      setSidebarCollapsed(true);
    } else if (windowWidth >= 1200) {
      setSidebarCollapsed(false);
    }
  }, [windowWidth, userToggledCollapse]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [mobileDrawerOpen]);

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setUserToggledCollapse(true);
        setSidebarCollapsed((c) => !c);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const isActive = useCallback((path, exact) => {
    if (exact || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  const handleToggleCollapse = useCallback(() => {
    setUserToggledCollapse(true);
    setSidebarCollapsed((c) => !c);
  }, []);

  const isMobile = windowWidth < 768;
  const sidebarWidth = sidebarCollapsed ? 64 : 260;

  const renderNavItem = (item, collapsed) => {
    const active = isActive(item.path, item.exact);
    return (
      <Link
        key={item.path}
        to={item.path}
        title={collapsed ? item.label : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : '12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '10px 0' : '8px 16px 8px 20px',
          color: active ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
          textDecoration: 'none',
          transition: 'all 150ms ease-out',
          borderLeft: collapsed ? 'none' : (active ? '3px solid var(--forge-accent-primary)' : '3px solid transparent'),
          backgroundColor: active ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
          fontWeight: active ? 600 : 500,
          fontSize: '13px',
          fontFamily: 'var(--forge-font-body)',
          height: '38px',
          borderRadius: collapsed ? 'var(--forge-radius-sm)' : 0,
          margin: collapsed ? '2px 8px' : 0,
          position: 'relative',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
            e.currentTarget.style.color = 'var(--forge-text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--forge-text-secondary)';
          }
        }}
      >
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Icon name={item.icon} size={18} />
        </span>
        {!collapsed && <span>{item.label}</span>}
        {/* Active indicator dot for collapsed mode */}
        {collapsed && active && (
          <span style={{
            position: 'absolute',
            left: 2,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: 20,
            borderRadius: 2,
            backgroundColor: 'var(--forge-accent-primary)',
          }} />
        )}
      </Link>
    );
  };

  /** Render a collapsible group header */
  const renderGroupHeader = (group, collapsed, isOpen) => {
    if (collapsed) {
      return (
        <div
          key={group.group + '-sep'}
          title={group.group}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px 0',
            margin: '4px 8px',
            cursor: 'default',
          }}
        >
          <Icon name={group.groupIcon} size={14} style={{ color: 'var(--forge-text-muted)' }} />
        </div>
      );
    }

    return (
      <button
        key={group.group + '-header'}
        onClick={() => toggleGroup(group.group)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 16px 6px 20px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '10px',
          fontWeight: 500,
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          transition: 'color 150ms ease-out',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-text-secondary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
        aria-expanded={isOpen}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name={group.groupIcon} size={12} />
          {group.group}
        </span>
        <Icon
          name="ChevronDown"
          size={12}
          style={{
            transition: 'transform 200ms ease-out',
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}
        />
      </button>
    );
  };

  const renderSidebarContent = (collapsed) => (
    <>
      {/* Header */}
      <div style={{
        padding: collapsed ? '16px 8px' : '16px 20px',
        borderBottom: '1px solid var(--forge-border-default)',
        textAlign: collapsed ? 'center' : 'left',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--forge-accent-primary)',
            flexShrink: 0,
          }}>
            <Icon name="Layers3" size={24} />
          </div>
          {!collapsed && (
            <span style={{
              fontFamily: 'var(--forge-font-heading)',
              fontWeight: 600,
              fontSize: '16px',
              color: 'var(--forge-text-primary)',
            }}>
              ModelPricer
            </span>
          )}
        </div>
        {!collapsed && (
          <div style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '10px',
            fontWeight: 400,
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: '4px',
          }}>
            ADMIN CONSOLE
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div style={{
          padding: '12px 16px 4px',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--forge-bg-elevated)',
            borderRadius: 'var(--forge-radius-sm)',
            padding: '6px 10px',
            border: '1px solid var(--forge-border-default)',
            transition: 'border-color 150ms ease-out',
          }}>
            <Icon name="Search" size={14} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Hledat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--forge-text-primary)',
                fontFamily: 'var(--forge-font-body)',
                fontSize: '12px',
                width: '100%',
                padding: 0,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--forge-text-muted)',
                }}
                aria-label="Clear search"
              >
                <Icon name="X" size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '4px 0', overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {filteredNav.map((group) => {
          const isOpen = searchQuery ? true : (openGroups[group.group] ?? true);
          return (
            <div key={group.group} style={{ marginTop: '6px' }}>
              {renderGroupHeader(group, collapsed, isOpen)}
              {/* Items — collapsed groups hide in expanded mode, always show in collapsed sidebar */}
              <div style={{
                overflow: 'hidden',
                maxHeight: (collapsed || isOpen) ? '1000px' : '0px',
                transition: 'max-height 250ms ease-out',
              }}>
                {group.items.map((item) => renderNavItem(item, collapsed))}
              </div>
            </div>
          );
        })}
        {/* No results message */}
        {searchQuery && filteredNav.length === 0 && (
          <div style={{
            padding: '16px 20px',
            color: 'var(--forge-text-muted)',
            fontSize: '12px',
            fontFamily: 'var(--forge-font-body)',
            textAlign: 'center',
          }}>
            Nic nenalezeno
          </div>
        )}
      </nav>

      {/* Footer */}
      <div style={{
        padding: collapsed ? '10px 8px' : '10px 16px',
        borderTop: '1px solid var(--forge-border-default)',
        flexShrink: 0,
        fontFamily: 'var(--forge-font-tech)',
        fontSize: '11px',
        color: 'var(--forge-text-muted)',
      }}>
        {/* Row 1: Version + Status + Env badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          marginBottom: collapsed ? '6px' : '5px',
          flexWrap: 'nowrap',
        }}>
          {/* Online/offline dot */}
          <span
            title={isOnline ? 'Online' : 'Offline'}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isOnline ? 'var(--forge-success, #22c55e)' : 'var(--forge-error, #ef4444)',
              display: 'inline-block',
              flexShrink: 0,
              boxShadow: isOnline ? '0 0 4px rgba(34,197,94,0.4)' : '0 0 4px rgba(239,68,68,0.4)',
            }}
          />
          {!collapsed && (
            <>
              <span style={{ letterSpacing: '0.03em' }}>
                v{appVersion}
              </span>
              <span style={{
                padding: '1px 5px',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                backgroundColor: isDev
                  ? 'rgba(251, 191, 36, 0.15)'
                  : 'rgba(34, 197, 94, 0.12)',
                color: isDev
                  ? '#fbbf24'
                  : 'var(--forge-success, #22c55e)',
                lineHeight: '14px',
                marginLeft: 'auto',
              }}>
                {isDev ? 'DEV' : 'PROD'}
              </span>
            </>
          )}
        </div>

        {/* Row 2: Tenant ID (expanded only) */}
        {!collapsed && tenantId && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '5px',
          }}>
            <Icon name="Fingerprint" size={11} style={{ flexShrink: 0, opacity: 0.5 }} />
            <span
              title={tenantId}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '10px',
                opacity: 0.7,
              }}
            >
              {truncatedTenantId}
            </span>
            <button
              onClick={() => copyToClipboard(tenantId)}
              title="Copy Tenant ID"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '1px 3px',
                color: tenantCopied ? 'var(--forge-success, #22c55e)' : 'var(--forge-text-muted)',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                transition: 'color 150ms',
              }}
              aria-label="Copy Tenant ID"
            >
              <Icon name={tenantCopied ? 'Check' : 'Copy'} size={11} />
            </button>
          </div>
        )}

        {/* Row 3: Quick links (expanded only) */}
        {!collapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '6px',
            fontSize: '10px',
          }}>
            {[
              { label: 'Docs', href: '/support', icon: 'BookOpen' },
              { label: 'Support', href: '/support', icon: 'LifeBuoy' },
              { label: 'Changelog', href: '/support', icon: 'FileText' },
            ].map((link, i) => (
              <React.Fragment key={link.label}>
                {i > 0 && <span style={{ opacity: 0.3 }}>|</span>}
                <Link
                  to={link.href}
                  style={{
                    color: 'var(--forge-text-muted)',
                    textDecoration: 'none',
                    transition: 'color 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-accent-primary, #00D4AA)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
                >
                  {link.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Back to home + collapse toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
          borderTop: collapsed ? 'none' : '1px solid var(--forge-border-default)',
          paddingTop: collapsed ? 0 : '6px',
        }}>
          <Link
            to="/"
            title={collapsed ? t('nav.home') : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? 0 : '6px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'var(--forge-text-muted)',
              textDecoration: 'none',
              fontSize: '12px',
              fontFamily: 'var(--forge-font-body)',
              padding: '4px 0',
              transition: 'color 150ms ease-out',
              flex: collapsed ? 1 : 'unset',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
          >
            <Icon name="ArrowLeft" size={14} />
            {!collapsed && <span>{t('nav.home')}</span>}
          </Link>

          {/* Collapse toggle button */}
          {!isMobile && (
            <button
              onClick={handleToggleCollapse}
              title={sidebarCollapsed ? 'Rozbalit sidebar (Ctrl+B)' : 'Sbalit sidebar (Ctrl+B)'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--forge-text-muted)',
                padding: '4px',
                transition: 'color 150ms ease-out',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <Icon name={collapsed ? 'PanelLeftOpen' : 'PanelLeftClose'} size={14} />
            </button>
          )}
        </div>

        {/* Tagline (expanded only) */}
        {!collapsed && (
          <div style={{
            textAlign: 'center',
            fontSize: '9px',
            opacity: 0.4,
            marginTop: '4px',
            letterSpacing: '0.04em',
          }}>
            Made with &#9829; by ModelPricer
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--forge-bg-void)',
    }}>
      {/* Desktop/Tablet Sidebar */}
      {!isMobile && (
        <aside ref={sidebarRef} style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          backgroundColor: 'var(--forge-bg-surface)',
          borderRight: '1px solid var(--forge-border-default)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1)',
          overflowX: 'hidden',
          overflowY: 'hidden',
        }}>
          {renderSidebarContent(sidebarCollapsed)}
        </aside>
      )}

      {/* Mobile Overlay Drawer */}
      {isMobile && mobileDrawerOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
        }}>
          {/* Overlay backdrop */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(8, 9, 12, 0.5)',
            }}
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <aside style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 280,
            backgroundColor: 'var(--forge-bg-surface)',
            borderRight: '1px solid var(--forge-border-default)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--forge-shadow-lg)',
            animation: 'forge-slide-in-left 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}>
            {renderSidebarContent(false)}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : sidebarWidth,
        transition: 'margin-left 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        minHeight: '100vh',
        backgroundColor: 'var(--forge-bg-void)',
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'var(--forge-bg-surface)',
            borderBottom: '1px solid var(--forge-border-default)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}>
            <button
              onClick={() => setMobileDrawerOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--forge-text-secondary)',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="Open navigation"
            >
              <Icon name="Menu" size={22} />
            </button>
            <span style={{
              fontFamily: 'var(--forge-font-heading)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--forge-text-primary)',
            }}>
              Admin Console
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <NotificationCenter />
              <Link to="/" style={{ color: 'var(--forge-text-muted)', padding: '4px' }}>
                <Icon name="Home" size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* Desktop notification bar */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '8px 32px 0',
          }}>
            <NotificationCenter />
          </div>
        )}

        <div style={{
          padding: isMobile ? '16px' : (windowWidth < 1200 ? '24px' : '32px'),
        }}>
          <ForgeBreadcrumb />
          <Outlet />
        </div>
      </main>

      <CommandPalette />

      <style>{`
        @keyframes forge-slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
