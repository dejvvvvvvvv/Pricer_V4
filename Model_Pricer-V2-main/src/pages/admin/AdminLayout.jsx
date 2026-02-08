// Admin Layout Component
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminLayout = () => {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/admin', label: t('admin.dashboard'), icon: 'LayoutDashboard' },
    { path: '/admin/branding', label: t('admin.branding'), icon: 'Palette' },
    { path: '/admin/pricing', label: t('admin.pricing'), icon: 'DollarSign' },
    { path: '/admin/fees', label: t('admin.fees'), icon: 'Receipt' },
    { path: '/admin/parameters', label: t('admin.parameters'), icon: 'Settings' },
    { path: '/admin/presets', label: t('admin.presets'), icon: 'Layers' },
    { path: '/admin/orders', label: t('admin.orders'), icon: 'ShoppingCart' },
    { path: '/admin/express', label: t('admin.express'), icon: 'Zap' },
    { path: '/admin/shipping', label: t('admin.shipping'), icon: 'Truck' },
    { path: '/admin/coupons', label: t('admin.coupons'), icon: 'Tag' },
    { path: '/admin/emails', label: t('admin.emails'), icon: 'Mail' },
    { path: '/admin/analytics', label: t('admin.analytics'), icon: 'BarChart3' },
    { path: '/admin/team', label: t('admin.teamAccess'), icon: 'Users' },
    { path: '/admin/widget', label: t('admin.widget'), icon: 'Code' },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <p className="text-sm text-gray-500">3D Print Calculator</p>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item">
            <Icon name="ArrowLeft" size={20} />
            <span>{t('nav.home')}</span>
          </Link>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>

      <style>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: #f5f5f5;
        }

        .admin-sidebar {
          width: 260px;
          background: white;
          border-right: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
        }

        .admin-sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid #e0e0e0;
        }

        .admin-sidebar-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .admin-nav {
          flex: 1;
          padding: 16px 0;
        }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          color: #666;
          text-decoration: none;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .admin-nav-item:hover {
          background: #f5f5f5;
          color: #1a1a1a;
        }

        .admin-nav-item.active {
          background: #e3f2fd;
          color: #1976d2;
          border-left-color: #1976d2;
          font-weight: 500;
        }

        .admin-sidebar-footer {
          padding: 16px 0;
          border-top: 1px solid #e0e0e0;
        }

        .admin-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        .text-sm {
          font-size: 14px;
        }

        .text-gray-500 {
          color: #9e9e9e;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
