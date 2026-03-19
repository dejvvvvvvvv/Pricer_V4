// Admin Layout — FORGE Dark Theme with collapsible sidebar & grouped navigation
//
// SECURITY TODO: Role enforcement is CLIENT-SIDE ONLY. All nav items are rendered
// for every authenticated user regardless of their role. The ROLE_PERMISSIONS matrix
// in AdminTeamAccess.jsx defines per-role access levels but is NOT enforced here.
//
// Before production, implement:
//   1) A useUserRole() hook that fetches the current user's role from backend/auth
//   2) Filter ADMIN_NAV items below based on ROLE_PERMISSIONS[userRole][item.requiredPermission]
//   3) Add a <RoleGuard> wrapper or check in <Outlet> to block access to restricted pages
//   4) Server-side middleware MUST also enforce roles — client-side checks are bypassable
//
// Nav items below include a `requiredPermission` field (matching ROLE_PERMISSIONS keys)
// to facilitate future enforcement. Items without it default to 'dashboard' (everyone).
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { useApp } from '../../contexts/AppContext';
import { getTenantId } from '../../utils/adminTenantStorage';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ForgeBreadcrumb } from '../../components/ui/forge/ForgeBreadcrumb';
import Skeleton, { SkeletonCard } from '../../components/ui/forge/ForgeSkeleton';
import NotificationCenter from './components/NotificationCenter';
import CommandPalette from './components/CommandPalette';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { useAdminShortcuts } from '../../hooks/useAdminShortcuts';
import { useAuth } from '../../context/AuthContext';
import { readCompanyData } from '../../utils/adminCompanyStorage';
import { migrateLegacyBrandingWidgetKeys } from '../../utils/adminBrandingWidgetStorage';
import { loadOrders } from '../../utils/adminOrdersStorage';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import '../../styles/light-theme-admin.css';

/** Read persisted sidebar state from localStorage (tenant-scoped) */
function loadSidebarState() {
  try {
    const tenantId = getTenantId() || 'default';
    const key = `modelpricer:${tenantId}:admin:sidebar`;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

/** Persist sidebar state to localStorage (tenant-scoped) */
function saveSidebarState(state) {
  try {
    const tenantId = getTenantId() || 'default';
    const key = `modelpricer:${tenantId}:admin:sidebar`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Nav groups — reorganized per spec
// ---------------------------------------------------------------------------
const ADMIN_NAV = [
  {
    group: 'Dashboard',
    groupKey: 'admin.nav.dashboard',
    groupIcon: 'Home',
    items: [
      { path: '/admin', label: 'Dashboard', labelKey: 'admin.dashboard', icon: 'LayoutDashboard', exact: true, requiredPermission: 'dashboard' },
    ],
  },
  {
    group: 'Business',
    groupKey: 'admin.nav.business',
    groupIcon: 'Briefcase',
    items: [
      { path: '/admin/orders', label: 'Orders', labelKey: 'admin.orders', icon: 'ShoppingCart', badge: 'orders', requiredPermission: 'orders' },
      { path: '/admin/payments', label: 'Payments', labelKey: 'admin.payments', icon: 'CreditCard', requiredPermission: 'billing' },
      { path: '/admin/customers', label: 'Customers', labelKey: 'admin.customers', icon: 'UserCircle', requiredPermission: 'orders' },
      // Hidden for beta - analytics not ready yet
      // { path: '/admin/analytics', label: 'Analytics', labelKey: 'admin.analytics', icon: 'BarChart3', requiredPermission: 'dashboard' },
    ],
  },
  {
    group: 'Configuration',
    groupKey: 'admin.nav.configuration',
    groupIcon: 'Sliders',
    items: [
      { path: '/admin/pricing', label: 'Pricing', labelKey: 'admin.pricing', icon: 'Calculator', requiredPermission: 'pricing' },
      { path: '/admin/parameters', label: 'Materials & Params', labelKey: 'admin.parameters', icon: 'Settings2', requiredPermission: 'parameters' },
      { path: '/admin/fees', label: 'Fees', labelKey: 'admin.fees', icon: 'Receipt', requiredPermission: 'fees' },
      { path: '/admin/presets', label: 'Presets', labelKey: 'admin.presets', icon: 'Sliders', requiredPermission: 'presets' },
      { path: '/admin/express', label: 'Express', labelKey: 'admin.express', icon: 'Zap', requiredPermission: 'pricing' },
      { path: '/admin/shipping', label: 'Shipping', labelKey: 'admin.shipping', icon: 'Truck', requiredPermission: 'orders' },
      { path: '/admin/coupons', label: 'Coupons', labelKey: 'admin.coupons', icon: 'Tag', requiredPermission: 'pricing' },
    ],
  },
  {
    group: 'Communication',
    groupKey: 'admin.nav.communication',
    groupIcon: 'MessageSquare',
    items: [
      { path: '/admin/emails', label: 'Emails', labelKey: 'admin.emails', icon: 'Mail', requiredPermission: 'orders' },
      { path: '/admin/webhooks', label: 'Webhooks', labelKey: 'admin.webhooks', icon: 'Webhook', requiredPermission: 'audit' },
    ],
  },
  {
    group: 'System',
    groupKey: 'admin.nav.system',
    groupIcon: 'Settings',
    items: [
      { path: '/admin/branding', label: 'Branding', labelKey: 'admin.branding', icon: 'Palette', requiredPermission: 'branding' },
      { path: '/admin/widget', label: 'Widget', labelKey: 'admin.widget', icon: 'Code2', requiredPermission: 'widget' },
      { path: '/admin/team', label: 'Team', labelKey: 'admin.teamAccess', icon: 'Users', requiredPermission: 'team' },
      { path: '/admin/model-storage', label: 'Model Storage', labelKey: 'admin.modelStorage', icon: 'HardDrive', requiredPermission: 'dashboard' },
      { path: '/admin/system', label: 'System Health', labelKey: 'admin.system', icon: 'HeartPulse', requiredPermission: 'audit' },
      { path: '/admin/activity', label: 'Activity Log', labelKey: 'admin.activity', icon: 'ClipboardList', requiredPermission: 'audit' },
      { path: '/admin/migration', label: 'Migration', labelKey: 'admin.migration', icon: 'Database', requiredPermission: 'audit' },
      { path: '/admin/integrations', label: 'Integrations', labelKey: 'admin.integrations', icon: 'Plug', requiredPermission: 'widget' },
      { path: '/admin/settings', label: 'Settings', labelKey: 'admin.settings', icon: 'Settings', requiredPermission: 'team' },
    ],
  },
];

// Page label key lookup for breadcrumb (stores labelKey for translation)
const PAGE_LABEL_KEYS = {};
ADMIN_NAV.forEach((g) => {
  g.items.forEach((item) => {
    PAGE_LABEL_KEYS[item.path] = item.labelKey || item.label;
  });
});

// Shortcut hints for nav items (path -> key combo displayed)
const NAV_SHORTCUT_HINTS = {
  '/admin': 'G D',
  '/admin/orders': 'G O',
  '/admin/pricing': 'G P',
  // '/admin/analytics': 'G A', // Hidden for beta
  '/admin/branding': 'G B',
  '/admin/widget': 'G W',
  '/admin/model-storage': 'G S',
};

/** Get user initials from displayName or email */
function getUserInitials(user) {
  if (!user) return '?';
  if (user.displayName) {
    const parts = user.displayName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0]?.toUpperCase() || '?';
  }
  if (user.email) return user.email[0].toUpperCase();
  return '?';
}

/** Count pending (NEW/REVIEW) orders */
function getPendingOrderCount() {
  try {
    const orders = loadOrders();
    return orders.filter((o) => o.status === 'NEW' || o.status === 'REVIEW').length;
  } catch {
    return 0;
  }
}

const AdminLayout = () => {
  useDocumentTitle('Admin');
  const location = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const { appVersion, isOnline } = useApp();
  const { copyToClipboard, copied: tenantCopied } = useCopyToClipboard();

  // Keyboard shortcuts (G+X navigation, ? help overlay)
  const { showHelp, setShowHelp, pendingG } = useAdminShortcuts();

  // Theme toggle (dark/light) — scoped to admin panel only
  const adminRootRef = useRef(null);
  const commandPaletteRef = useRef(null);
  const { theme: adminTheme, toggleTheme: toggleAdminTheme, isDark: isAdminDark } = useAdminTheme(adminRootRef);

  // Auth — must be called unconditionally at top level (React hook rules)
  const { currentUser: authUser, logout: authLogout, loading: authLoading } = useAuth();

  const tenantId = useMemo(() => {
    try { return getTenantId(); } catch { return ''; }
  }, []);
  const truncatedTenantId = tenantId ? (tenantId.length > 12 ? tenantId.slice(0, 12) + '...' : tenantId) : '';
  const isDev = import.meta.env.DEV;

  // One-time migration of legacy branding/widget/plan_features keys to modern namespace.
  // Safe to run every mount — skips keys that are already migrated.
  useEffect(() => {
    if (tenantId) migrateLegacyBrandingWidgetKeys(tenantId);
  }, [tenantId]);

  // Company name from branding storage
  const companyName = useMemo(() => {
    try {
      const data = readCompanyData();
      return data.companyName || '';
    } catch { return ''; }
  }, []);

  // Badge counts
  const [badgeCounts, setBadgeCounts] = useState({ orders: 0 });
  useEffect(() => {
    const count = getPendingOrderCount();
    setBadgeCounts((prev) => ({ ...prev, orders: count }));
  }, [location.pathname]); // refresh on navigation

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

  // Filter nav items by search (searches both original and translated labels)
  const filteredNav = useMemo(() => {
    if (!searchQuery.trim()) return ADMIN_NAV;
    const q = searchQuery.toLowerCase();
    return ADMIN_NAV.map((group) => {
      const groupName = group.groupKey ? t(group.groupKey) : group.group;
      return {
        ...group,
        items: group.items.filter(
          (item) => {
            const translatedLabel = item.labelKey ? t(item.labelKey) : item.label;
            return (
              item.label.toLowerCase().includes(q) ||
              translatedLabel.toLowerCase().includes(q) ||
              item.path.toLowerCase().includes(q) ||
              groupName.toLowerCase().includes(q)
            );
          }
        ),
      };
    }).filter((group) => group.items.length > 0);
  }, [searchQuery, language]);

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

  // Current page name for top bar breadcrumb (translated)
  const currentPageName = useMemo(() => {
    const resolveLabel = (key) => {
      // If key looks like a translation key (contains dots), translate it
      if (key && key.includes('.')) return t(key);
      return key;
    };
    // Try exact match first
    if (PAGE_LABEL_KEYS[location.pathname]) return resolveLabel(PAGE_LABEL_KEYS[location.pathname]);
    // Try prefix match for sub-routes
    const match = Object.entries(PAGE_LABEL_KEYS)
      .filter(([p]) => p !== '/admin' && location.pathname.startsWith(p))
      .sort((a, b) => b[0].length - a[0].length)[0];
    if (match) return resolveLabel(match[1]);
    if (location.pathname === '/admin') return t('admin.dashboard');
    return '';
  }, [location.pathname, language]);

  const isMobile = windowWidth < 768;
  const sidebarWidth = sidebarCollapsed ? 64 : 260;

  // ---------------------------------------------------------------------------
  // Badge renderer
  // ---------------------------------------------------------------------------
  const renderBadge = (count) => {
    if (!count || count <= 0) return null;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 9,
        backgroundColor: 'var(--forge-accent-primary, #00D4AA)',
        color: 'var(--forge-bg-surface, #13151A)',
        fontSize: '10px',
        fontWeight: 700,
        fontFamily: 'var(--forge-font-tech)',
        lineHeight: 1,
        marginLeft: 'auto',
        flexShrink: 0,
      }}>
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  const renderNavItem = (item, collapsed) => {
    const active = isActive(item.path, item.exact);
    const badgeCount = item.badge ? badgeCounts[item.badge] : 0;
    const displayLabel = item.labelKey ? t(item.labelKey) : item.label;

    return (
      <Link
        key={item.path}
        to={item.path}
        title={collapsed ? displayLabel : undefined}
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
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Icon name={item.icon} size={18} />
          {/* Badge dot in collapsed mode */}
          {collapsed && badgeCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -3,
              right: -5,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--forge-accent-primary, #00D4AA)',
              border: '2px solid var(--forge-bg-surface)',
            }} />
          )}
        </span>
        {!collapsed && <span style={{ flex: 1 }}>{displayLabel}</span>}
        {/* Shortcut hint in expanded mode */}
        {!collapsed && NAV_SHORTCUT_HINTS[item.path] && !badgeCount && (
          <span style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '9px',
            color: 'var(--forge-text-muted)',
            opacity: 0.5,
            letterSpacing: '0.04em',
            flexShrink: 0,
            marginLeft: 'auto',
            transition: 'opacity 150ms',
          }}>
            {NAV_SHORTCUT_HINTS[item.path]}
          </span>
        )}
        {/* Badge count in expanded mode */}
        {!collapsed && renderBadge(badgeCount)}
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
    const groupDisplayName = group.groupKey ? t(group.groupKey) : group.group;
    if (collapsed) {
      return (
        <div
          key={group.group + '-sep'}
          title={groupDisplayName}
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
          {groupDisplayName}
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

  // ---------------------------------------------------------------------------
  // User section (bottom of sidebar)
  // ---------------------------------------------------------------------------
  const renderUserSection = (collapsed) => {
    const initials = getUserInitials(authUser);
    const displayName = authUser?.displayName || '';
    const displayEmail = authUser?.email || '';

    if (!authUser) return null;

    if (collapsed) {
      return (
        <div style={{
          padding: '8px',
          borderTop: '1px solid var(--forge-border-default)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}>
          {/* Avatar */}
          <div
            title={displayName || displayEmail}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--forge-accent-primary, #00D4AA)',
              color: 'var(--forge-bg-surface, #13151A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--forge-font-tech)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          {/* Logout */}
          {authLogout && (
            <button
              onClick={authLogout}
              title={t('nav.logout')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--forge-text-muted)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 150ms',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-error, #ef4444)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
              aria-label="Logout"
            >
              <Icon name="LogOut" size={14} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--forge-border-default)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
      }}>
        {/* Avatar */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          backgroundColor: 'var(--forge-accent-primary, #00D4AA)',
          color: 'var(--forge-bg-surface, #13151A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'var(--forge-font-tech)',
          flexShrink: 0,
        }}>
          {initials}
        </div>
        {/* Name & email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {displayName && (
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--forge-text-primary)',
              fontFamily: 'var(--forge-font-body)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {displayName}
            </div>
          )}
          <div style={{
            fontSize: '11px',
            color: 'var(--forge-text-muted)',
            fontFamily: 'var(--forge-font-tech)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {displayEmail}
          </div>
        </div>
        {/* Logout button */}
        {authLogout && (
          <button
            onClick={authLogout}
            title={t('nav.logout')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--forge-text-muted)',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--forge-radius-sm)',
              transition: 'all 150ms',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--forge-error, #ef4444)';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--forge-text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Logout"
          >
            <Icon name="LogOut" size={16} />
          </button>
        )}
      </div>
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
              placeholder={t('admin.sidebar.search')}
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
            {t('admin.sidebar.noResults')}
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div style={{
        padding: collapsed ? '10px 8px' : '10px 16px',
        borderTop: '1px solid var(--forge-border-default)',
        flexShrink: 0,
        fontFamily: 'var(--forge-font-tech)',
        fontSize: '11px',
        color: 'var(--forge-text-muted)',
      }}>
        {/* Company name (expanded only) */}
        {!collapsed && companyName && (
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--forge-text-secondary)',
            fontFamily: 'var(--forge-font-body)',
            marginBottom: '6px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {companyName}
          </div>
        )}

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
              { label: t('admin.footer.docs'), href: '/support?tab=docs', icon: 'BookOpen' },
              { label: t('admin.footer.support'), href: '/support', icon: 'LifeBuoy' },
              { label: t('admin.footer.changelog'), href: '/support#changelog', icon: 'FileText' },
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
              title={sidebarCollapsed ? `${t('admin.sidebar.expand')} (Ctrl+B)` : `${t('admin.sidebar.collapse')} (Ctrl+B)`}
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
      </div>

      {/* User section */}
      {renderUserSection(collapsed)}
    </>
  );

  // Auth guard — redirect unauthenticated users to login
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '1rem',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', backgroundColor: 'var(--forge-bg-void)',
        padding: '2rem',
      }}>
        <SkeletonCard textLines={2} />
        <Skeleton width="60%" height="1.25rem" />
        <Skeleton width="40%" height="1rem" />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div ref={adminRootRef} style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--forge-bg-void)',
    }}>
      {/* Desktop/Tablet Sidebar */}
      {!isMobile && (
        <aside ref={sidebarRef} aria-label="Admin navigation" style={{
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

      {/* Mobile Overlay Drawer — rendered via portal to avoid CSS transform issues */}
      {isMobile && mobileDrawerOpen && createPortal(
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
          <aside aria-label="Admin navigation" style={{
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
        </div>,
        document.body
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '11px',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Admin
              </span>
              {currentPageName && (
                <>
                  <span style={{ color: 'var(--forge-text-muted)', opacity: 0.4, fontSize: '11px' }}>/</span>
                  <span style={{
                    fontFamily: 'var(--forge-font-heading)',
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--forge-text-primary)',
                  }}>
                    {currentPageName}
                  </span>
                </>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* Global search trigger (mobile) */}
              <button
                onClick={() => commandPaletteRef.current?.open()}
                title="Hledat (Ctrl+K)"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--forge-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Globalni vyhledavani"
              >
                <Icon name="Search" size={18} />
              </button>
              {/* Theme toggle (mobile) */}
              <button
                onClick={toggleAdminTheme}
                title={isAdminDark ? 'Light mode' : 'Dark mode'}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'var(--forge-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label={isAdminDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <Icon name={isAdminDark ? 'Sun' : 'Moon'} size={18} />
              </button>
              <button
                onClick={toggleLanguage}
                title={t('lang.switch')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontFamily: 'var(--forge-font-tech)',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--forge-text-secondary)',
                  letterSpacing: '0.04em',
                }}
                aria-label={t('lang.switch')}
              >
                <Icon name="Globe" size={14} />
                <span>{language === 'cs' ? 'CS' : 'EN'}</span>
              </button>
              <NotificationCenter />
              <Link to="/" style={{ color: 'var(--forge-text-muted)', padding: '4px' }}>
                <Icon name="Home" size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* Desktop top bar with breadcrumb */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 32px 0',
          }}>
            {/* Breadcrumb */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
            }}>
              <span style={{
                color: 'var(--forge-text-muted)',
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Admin
              </span>
              {currentPageName && (
                <>
                  <span style={{ color: 'var(--forge-text-muted)', opacity: 0.4 }}>/</span>
                  <span style={{
                    color: 'var(--forge-text-primary)',
                    fontWeight: 600,
                  }}>
                    {currentPageName}
                  </span>
                </>
              )}
            </div>

            {/* Right side: search + theme toggle + language switcher + notifications */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Global search trigger */}
              <button
                onClick={() => commandPaletteRef.current?.open()}
                title="Hledat (Ctrl+K)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: '1px solid var(--forge-border-default)',
                  borderRadius: 'var(--forge-radius-sm, 6px)',
                  cursor: 'pointer',
                  padding: '4px 12px',
                  fontFamily: 'var(--forge-font-body)',
                  fontSize: '12px',
                  color: 'var(--forge-text-muted)',
                  transition: 'all 150ms ease-out',
                  height: '30px',
                  minWidth: '160px',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--forge-accent-primary, #00D4AA)';
                  e.currentTarget.style.color = 'var(--forge-text-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                  e.currentTarget.style.color = 'var(--forge-text-muted)';
                }}
                aria-label="Globalni vyhledavani (Ctrl+K)"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="Search" size={14} />
                  <span>Hledat...</span>
                </span>
                <kbd style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '1px 5px',
                  fontSize: '10px',
                  fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted, #7A8291)',
                  backgroundColor: 'var(--forge-bg-elevated, #22232d)',
                  border: '1px solid var(--forge-border-default, #2a2b35)',
                  borderRadius: '3px',
                  lineHeight: '14px',
                }}>
                  Ctrl+K
                </kbd>
              </button>
              {/* Theme toggle */}
              <button
                onClick={toggleAdminTheme}
                title={isAdminDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="admin-theme-toggle"
                aria-label={isAdminDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <span className="admin-theme-toggle-icon">
                  <Icon name={isAdminDark ? 'Sun' : 'Moon'} size={14} />
                </span>
              </button>
              {/* Language switcher */}
              <button
                onClick={toggleLanguage}
                title={t('lang.switch')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: '1px solid var(--forge-border-default)',
                  borderRadius: 'var(--forge-radius-sm, 6px)',
                  cursor: 'pointer',
                  padding: '4px 10px',
                  fontFamily: 'var(--forge-font-tech)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--forge-text-secondary)',
                  letterSpacing: '0.04em',
                  transition: 'all 150ms ease-out',
                  height: '30px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--forge-accent-primary, #00D4AA)';
                  e.currentTarget.style.color = 'var(--forge-accent-primary, #00D4AA)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                  e.currentTarget.style.color = 'var(--forge-text-secondary)';
                }}
                aria-label={t('lang.switch')}
              >
                <Icon name="Globe" size={14} />
                <span>{language === 'cs' ? 'CS' : 'EN'}</span>
              </button>
              <NotificationCenter />
            </div>
          </div>
        )}

        <div style={{
          padding: isMobile ? '16px' : (windowWidth < 1200 ? '24px' : '32px'),
        }}>
          <ForgeBreadcrumb />
          <Outlet />
        </div>
      </main>

      <CommandPalette ref={commandPaletteRef} />

      <KeyboardShortcutsHelp
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Pending "G" indicator — shown briefly when user presses G */}
      {pendingG && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'var(--forge-bg-surface, #1a1b23)',
          border: '1px solid var(--forge-border-default, #2a2b35)',
          borderRadius: 'var(--forge-radius-md, 8px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '12px',
          color: 'var(--forge-text-secondary, #a0a4b0)',
          animation: 'forge-pending-g 150ms ease-out',
          pointerEvents: 'none',
        }}>
          <kbd style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '22px',
            height: '22px',
            padding: '0 6px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--forge-accent-primary, #00D4AA)',
            backgroundColor: 'rgba(0, 212, 170, 0.12)',
            border: '1px solid rgba(0, 212, 170, 0.25)',
            borderRadius: '4px',
          }}>G</kbd>
          <span>{t('admin.sidebar.pendingKey')}</span>
        </div>
      )}

      <style>{`
        @keyframes forge-slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes forge-pending-g {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
