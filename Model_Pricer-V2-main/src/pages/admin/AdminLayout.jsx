// Admin Layout — FORGE Dark Theme
import React, { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';

const ADMIN_NAV = [
  {
    group: 'CONFIGURATION',
    items: [
      { path: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', exact: true },
      { path: '/admin/branding', label: 'Branding', icon: 'Palette' },
    ],
  },
  {
    group: 'PRICING',
    items: [
      { path: '/admin/pricing', label: 'Pricing', icon: 'Calculator' },
      { path: '/admin/fees', label: 'Fees', icon: 'Receipt' },
      { path: '/admin/presets', label: 'Presets', icon: 'Sliders' },
      { path: '/admin/parameters', label: 'Parameters', icon: 'Settings2' },
      { path: '/admin/express', label: 'Express', icon: 'Zap' },
      { path: '/admin/shipping', label: 'Shipping', icon: 'Truck' },
      { path: '/admin/coupons', label: 'Coupons', icon: 'Tag' },
    ],
  },
  {
    group: 'OPERATIONS',
    items: [
      { path: '/admin/orders', label: 'Orders', icon: 'ShoppingCart' },
      { path: '/admin/widget', label: 'Widget', icon: 'Code2' },
      { path: '/admin/emails', label: 'Emails', icon: 'Mail' },
      { path: '/admin/analytics', label: 'Analytics', icon: 'BarChart3' },
      { path: '/admin/team', label: 'Team', icon: 'Users' },
      { path: '/admin/migration', label: 'Migration', icon: 'Database' },
    ],
  },
];

const AdminLayout = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1400);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-collapse on medium screens
  useEffect(() => {
    if (windowWidth < 1200 && windowWidth >= 768) {
      setSidebarCollapsed(true);
    } else if (windowWidth >= 1200) {
      setSidebarCollapsed(false);
    }
  }, [windowWidth]);

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

  const isActive = useCallback((path, exact) => {
    if (exact || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

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
          padding: collapsed ? '12px 0' : '10px 20px',
          color: active ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
          textDecoration: 'none',
          transition: 'all 150ms ease-out',
          borderLeft: collapsed ? 'none' : (active ? '3px solid var(--forge-accent-primary)' : '3px solid transparent'),
          backgroundColor: active ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
          fontWeight: active ? 600 : 500,
          fontSize: '14px',
          fontFamily: 'var(--forge-font-body)',
          height: '44px',
          borderRadius: collapsed ? 'var(--forge-radius-sm)' : 0,
          margin: collapsed ? '2px 8px' : 0,
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
        <Icon name={item.icon} size={18} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const renderSidebarContent = (collapsed) => (
    <>
      {/* Header */}
      <div style={{
        padding: collapsed ? '20px 8px' : '20px',
        borderBottom: '1px solid var(--forge-border-default)',
        textAlign: collapsed ? 'center' : 'left',
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

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {ADMIN_NAV.map((group) => (
          <div key={group.group} style={{ marginTop: '16px' }}>
            {!collapsed && (
              <div style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                fontWeight: 400,
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0 20px',
                marginBottom: '6px',
              }}>
                {group.group}
              </div>
            )}
            {collapsed && (
              <div style={{
                height: '1px',
                backgroundColor: 'var(--forge-border-default)',
                margin: '8px 12px',
              }} />
            )}
            {group.items.map((item) => renderNavItem(item, collapsed))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: collapsed ? '12px 8px' : '16px 20px',
        borderTop: '1px solid var(--forge-border-default)',
      }}>
        {/* Status indicator */}
        {!collapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--forge-success)',
              display: 'inline-block',
            }} />
            <span style={{
              fontFamily: 'var(--forge-font-tech)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--forge-success)',
            }}>
              STATUS: ONLINE
            </span>
          </div>
        )}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : '8px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'var(--forge-text-muted)',
            textDecoration: 'none',
            fontSize: '13px',
            fontFamily: 'var(--forge-font-body)',
            padding: '6px 0',
            transition: 'color 150ms ease-out, transform 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--forge-text-primary)';
            if (!collapsed) e.currentTarget.style.transform = 'translateX(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--forge-text-muted)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <Icon name="ArrowLeft" size={16} />
          {!collapsed && <span>{t('nav.home')}</span>}
        </Link>
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
        <aside style={{
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
            <Link to="/" style={{ color: 'var(--forge-text-muted)', padding: '4px' }}>
              <Icon name="Home" size={18} />
            </Link>
          </div>
        )}

        {/* Collapse toggle for tablet */}
        {!isMobile && windowWidth < 1200 && (
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            style={{
              position: 'fixed',
              left: sidebarWidth - 12,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 50,
              width: 24,
              height: 24,
              borderRadius: '50%',
              backgroundColor: 'var(--forge-bg-elevated)',
              border: '1px solid var(--forge-border-default)',
              color: 'var(--forge-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'left 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={sidebarCollapsed ? 'ChevronRight' : 'ChevronLeft'} size={14} />
          </button>
        )}

        <div style={{
          padding: isMobile ? '16px' : (windowWidth < 1200 ? '24px' : '32px'),
        }}>
          <Outlet />
        </div>
      </main>

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
