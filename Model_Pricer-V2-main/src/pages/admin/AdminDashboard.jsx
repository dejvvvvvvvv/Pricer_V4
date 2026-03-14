import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';

import { computeOverview } from '../../utils/adminAnalyticsStorage';
import { loadOrders, computeOrderTotals, getStatusLabel, extractOrderMaterials } from '../../utils/adminOrdersStorage';
import { getAuditEntries } from '../../utils/adminAuditLogStorage';
import { readTenantJson, getTenantId } from '../../utils/adminTenantStorage';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { getBranding, getDefaultBranding } from '../../utils/adminBrandingWidgetStorage';
import { loadCouponsConfigV1 } from '../../utils/adminCouponStorage';
import { loadPricingConfigV3 } from '../../utils/adminPricingStorage';

import QuickSettings from './components/QuickSettings';
import DataImportWizard from './components/DataImportWizard';
import QuickOrderForm from './components/orders/QuickOrderForm';
import OnboardingWizard, { isOnboardingCompleted } from './components/OnboardingWizard';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isoNowEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function fmtCurrency(n, language) {
  const fmt = new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-US', { maximumFractionDigits: 0 });
  return `${fmt.format(n)} Kc`;
}

/* ── Status colors ────────────────────────────────────────────────────── */

const STATUS_COLORS = {
  NEW: '#00D4AA',
  REVIEW: '#4DA8DA',
  APPROVED: '#22C55E',
  PRINTING: '#FF6B35',
  POSTPROCESS: '#9B59B6',
  READY: '#FACC15',
  SHIPPED: '#06B6D4',
  DONE: '#10B981',
  CANCELED: '#EF4444',
};

/* ── Quick links config ───────────────────────────────────────────────── */

const QUICK_LINKS = [
  { icon: 'ShoppingCart', path: '/admin/orders', labelKey: 'admin.dashboard.link.orders', labelFallback: 'Orders' },
  { icon: 'DollarSign', path: '/admin/pricing', labelKey: 'admin.dashboard.link.pricing', labelFallback: 'Pricing' },
  { icon: 'Layers', path: '/admin/parameters', labelKey: 'admin.dashboard.link.materials', labelFallback: 'Materials' },
  { icon: 'Palette', path: '/admin/branding', labelKey: 'admin.dashboard.link.branding', labelFallback: 'Branding' },
  { icon: 'BarChart3', path: '/admin/analytics', labelKey: 'admin.dashboard.link.analytics', labelFallback: 'Analytics' },
  { icon: 'Layout', path: '/admin/widget', labelKey: 'admin.dashboard.link.widget', labelFallback: 'Widget' },
  { icon: 'Receipt', path: '/admin/fees', labelKey: 'admin.dashboard.link.fees', labelFallback: 'Fees' },
  { icon: 'BookOpen', path: '/admin/presets', labelKey: 'admin.dashboard.link.presets', labelFallback: 'Presets' },
];

/* ── RevenueSparkline ─────────────────────────────────────────────────── */

function RevenueSparkline({ data, language }) {
  if (!data || !data.days || data.days.length === 0) return null;
  const { days, max } = data;
  const barW = 100 / days.length;
  return (
    <div style={{ width: '100%', marginTop: 8 }}>
      <svg width="100%" height="64" viewBox="0 0 100 64" preserveAspectRatio="none" style={{ display: 'block' }}>
        {days.map((d, i) => {
          const h = max > 0 ? (d.revenue / max) * 54 : 0;
          return (
            <rect
              key={i}
              x={i * barW + barW * 0.15}
              y={64 - h - 2}
              width={barW * 0.7}
              height={Math.max(h, 1)}
              rx={1.5}
              fill="var(--forge-accent, #00D4AA)"
              opacity={0.85}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {days.map((d, i) => (
          <span key={i} style={{ fontSize: 10, color: 'var(--forge-text-muted, #7A8291)', textAlign: 'center', flex: 1 }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────── */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingCompleted = useMemo(() => isOnboardingCompleted(), [refreshKey]);
  const cs = language === 'cs';

  const tenantId = getTenantId();

  // ── Data ──

  const allOrders = useMemo(() => loadOrders(), [refreshKey]);

  // Shared reads — avoid duplicate storage access across multiple useMemos
  const couponsConfig = useMemo(() => {
    try { return loadCouponsConfigV1(); } catch { return { coupons: [] }; }
  }, [refreshKey]);

  const currentBranding = useMemo(() => {
    try { return getBranding(tenantId); } catch { return null; }
  }, [tenantId, refreshKey]);

  const todayStats = useMemo(() => {
    let revenue = 0;
    let newOrders = 0;

    for (const order of allOrders) {
      const created = order.created_at || order.createdAt;
      if (isToday(created)) {
        newOrders++;
        const totals = computeOrderTotals(order);
        revenue += totals.total || 0;
      }
    }

    const pending = allOrders.filter(o => o.status === 'NEW' || o.status === 'REVIEW').length;
    const activePrints = allOrders.filter(o => o.status === 'PRINTING' || o.status === 'POSTPROCESS').length;

    return { revenue, newOrders, pending, activePrints };
  }, [allOrders]);

  const recentOrders = useMemo(() => {
    const sorted = [...allOrders].sort((a, b) => {
      const da = a.created_at || a.createdAt || '';
      const db = b.created_at || b.createdAt || '';
      return db.localeCompare(da);
    });
    return sorted.slice(0, 8).map(order => {
      const totals = computeOrderTotals(order);
      return {
        id: order.id,
        orderNumber: order.order_number || order.id?.slice(0, 8) || '---',
        customer: order.customer?.name || order.customer?.email || t('admin.dashboard.unknownCustomer', 'Unknown'),
        status: order.status || 'NEW',
        total: totals.total,
        created: order.created_at || order.createdAt,
        models: (order.models || []).length,
      };
    });
  }, [allOrders, cs]);

  const attentionOrders = useMemo(() => {
    return allOrders.filter(o => {
      // Stuck: NEW/REVIEW for more than 48h
      if (o.status === 'NEW' || o.status === 'REVIEW') {
        const created = new Date(o.created_at || o.createdAt || Date.now());
        const hoursOld = (Date.now() - created.getTime()) / (1000 * 60 * 60);
        if (hoursOld > 48) return true;
      }
      // Has flags
      if (o.flags && o.flags.length > 0) return true;
      return false;
    }).slice(0, 5);
  }, [allOrders]);

  const recentActivity = useMemo(() => {
    const entries = getAuditEntries();
    return entries.slice(0, 12).map(e => ({
      id: e.id,
      text: e.summary || e.action,
      actor: e.actor_email || 'System',
      type: e.action?.includes('CREATE') || e.action?.includes('ADD') ? 'add'
        : e.action?.includes('DELETE') || e.action?.includes('REMOVE') ? 'delete'
        : 'update',
      time: formatRelativeTime(e.timestamp, language),
      timestamp: e.timestamp,
    }));
  }, [refreshKey, language]);

  const analytics30d = useMemo(() => {
    return computeOverview({ fromISO: isoDaysAgo(30), toISO: isoNowEnd() });
  }, [refreshKey]);

  const brandingTips = useMemo(() => {
    const defaults = getDefaultBranding();
    const tips = [];
    if (!currentBranding?.logo) tips.push(t('admin.dashboard.tip.addLogo', 'Add a logo'));
    if (!currentBranding?.businessName || currentBranding.businessName === defaults.businessName) tips.push(t('admin.dashboard.tip.setBusinessName', 'Set business name'));
    if (!currentBranding?.tagline || currentBranding.tagline === defaults.tagline) tips.push(t('admin.dashboard.tip.addTagline', 'Add tagline'));
    return tips;
  }, [currentBranding, cs]);

  const systemStatus = useMemo(() => {
    const pricing = readTenantJson('pricing:v3', null);
    const fees = readTenantJson('fees:v3', null);
    const feesList = Array.isArray(fees) ? fees : (Array.isArray(fees?.fees) ? fees.fees : []);

    const hasPricing = !!(pricing && (pricing.materialPrices || pricing.materials?.length));
    const hasFees = feesList.length > 0;

    return { hasPricing, hasFees, totalOrders: allOrders.length };
  }, [allOrders, refreshKey]);

  // ── System alerts ──
  const systemAlerts = useMemo(() => {
    const alerts = [];
    const now = new Date();

    // Expired or expiring coupons (uses shared couponsConfig)
    const coupons = couponsConfig.coupons || [];
    const expiredCount = coupons.filter(c => {
      if (!c.expires_at || !c.active) return false;
      return new Date(c.expires_at) < now;
    }).length;
    const expiringCount = coupons.filter(c => {
      if (!c.expires_at || !c.active) return false;
      const exp = new Date(c.expires_at);
      const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;
    if (expiredCount > 0) alerts.push({
      type: 'error',
      icon: 'Tag',
      text: `${expiredCount} ${t('admin.dashboard.alert.couponsExpired', 'coupon(s) expired')}`,
      action: '/admin/pricing',
    });
    if (expiringCount > 0) alerts.push({
      type: 'warning',
      icon: 'Tag',
      text: `${expiringCount} ${t('admin.dashboard.alert.couponsExpiring', 'coupon(s) expiring within 7 days')}`,
      action: '/admin/pricing',
    });

    // Presets without materials
    try {
      const pricingConfig = loadPricingConfigV3();
      const materials = pricingConfig?.materials || [];
      if (materials.length === 0 && pricingConfig) {
        alerts.push({
          type: 'warning',
          icon: 'Layers',
          text: t('admin.dashboard.alert.noMaterials', 'No materials in pricing'),
          action: '/admin/parameters',
        });
      }
    } catch { /* ignore */ }

    // Missing branding logo (uses shared currentBranding)
    if (!currentBranding?.logo) {
      alerts.push({
        type: 'info',
        icon: 'Image',
        text: t('admin.dashboard.alert.missingLogo', 'Missing branding logo'),
        action: '/admin/branding',
      });
    }

    // Storage approaching limit (estimate based on tenant keys)
    try {
      let totalSize = 0;
      const tid = getTenantId();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(tid)) {
          totalSize += (localStorage.getItem(key) || '').length;
        }
      }
      const sizeMB = totalSize / (1024 * 1024);
      if (sizeMB > 3) {
        alerts.push({
          type: 'warning',
          icon: 'HardDrive',
          text: `${t('admin.dashboard.alert.storageLabel', 'Storage')}: ${sizeMB.toFixed(1)} MB (${t('admin.dashboard.alert.storageLimit', 'limit ~5 MB')})`,
          action: '/admin',
        });
      }
    } catch { /* ignore */ }

    return alerts;
  }, [couponsConfig, currentBranding, refreshKey, cs]);

  // ── Revenue sparkline data (last 7 days) ──
  const revenueSparkline = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ date: d, revenue: 0, label: d.toLocaleDateString(cs ? 'cs-CZ' : 'en-US', { weekday: 'short' }) });
    }

    for (const order of allOrders) {
      const created = new Date(order.created_at || order.createdAt || Date.now());
      for (const day of days) {
        if (created.getFullYear() === day.date.getFullYear()
          && created.getMonth() === day.date.getMonth()
          && created.getDate() === day.date.getDate()) {
          const totals = computeOrderTotals(order);
          day.revenue += totals.total || 0;
          break;
        }
      }
    }

    const max = Math.max(...days.map(d => d.revenue), 1);
    const total7d = days.reduce((s, d) => s + d.revenue, 0);
    return { days, max, total7d };
  }, [allOrders, cs]);

  // ── Popular materials (top 3) ──
  const popularMaterials = useMemo(() => {
    const counts = {};
    for (const order of allOrders) {
      const mats = extractOrderMaterials(order);
      for (const mat of mats) {
        counts[mat] = (counts[mat] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [allOrders]);

  // ── Pending actions counter ──
  const pendingActions = useMemo(() => {
    const newOrders = allOrders.filter(o => o.status === 'NEW').length;

    let pendingInvoices = 0;
    for (const order of allOrders) {
      if (['APPROVED', 'READY', 'SHIPPED', 'DONE'].includes(order.status)) {
        if (!order.invoice_number && !order.payment_status) {
          pendingInvoices++;
        }
      }
    }

    // Uses shared couponsConfig — no duplicate storage read
    const now = new Date();
    const expiringCoupons = (couponsConfig.coupons || []).filter(c => {
      if (!c.expires_at || !c.active) return false;
      const exp = new Date(c.expires_at);
      const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    const total = newOrders + pendingInvoices + expiringCoupons;
    return { newOrders, pendingInvoices, expiringCoupons, total };
  }, [allOrders, couponsConfig]);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  // ── Render ──

  return (
    <div className="admin-dashboard-v2">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">
            {t('admin.dashboard.businessOverview', 'Your business overview')}
          </p>
        </div>
        <div className="dash-header-actions">
          <button className="dash-btn dash-btn--primary" onClick={() => setShowQuickOrder(true)}>
            <Icon name="Plus" size={16} />
            {t('admin.dashboard.newOrder', 'New order')}
          </button>
          <button className="dash-btn dash-btn--secondary" onClick={() => setShowImportWizard(true)}>
            <Icon name="Download" size={16} />
            {t('admin.dashboard.importData', 'Import data')}
          </button>
          <button className="dash-btn dash-btn--secondary" onClick={handleRefresh}>
            <Icon name="RefreshCw" size={16} />
            {t('admin.dashboard.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Onboarding banner */}
      {!onboardingCompleted && (
        <div className="dash-onboarding-banner" onClick={() => setShowOnboarding(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowOnboarding(true); } }}>
          <div className="dash-onboarding-banner-left">
            <Icon name="Rocket" size={20} color="#00D4AA" />
            <div>
              <strong>{t('admin.dashboard.onboarding.completeSetup', 'Complete your setup')}</strong>
              <span className="dash-onboarding-banner-sub">
                {t('admin.dashboard.onboarding.runWizard', 'Run the setup wizard and get your calculator ready')}
              </span>
            </div>
          </div>
          <div className="dash-onboarding-banner-action">
            <span>{t('admin.dashboard.onboarding.startWizard', 'Start wizard')}</span>
            <Icon name="ArrowRight" size={14} />
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="dash-summary-cards">
        <SummaryCard
          icon="DollarSign"
          color="#00D4AA"
          label={t('admin.dashboard.card.todayRevenue', "Today's revenue")}
          value={fmtCurrency(todayStats.revenue, language)}
          sub={analytics30d?.metrics?.total_revenue > 0
            ? `${t('admin.dashboard.card.total30d', '30d total')}: ${fmtCurrency(analytics30d.metrics.total_revenue, language)}`
            : null}
          onClick={() => navigate('/admin/analytics')}
        />
        <SummaryCard
          icon="ShoppingCart"
          color="#4DA8DA"
          label={t('admin.dashboard.card.todayOrders', "Today's orders")}
          value={todayStats.newOrders}
          sub={`${t('admin.dashboard.card.total', 'Total')}: ${allOrders.length}`}
          onClick={() => navigate('/admin/orders')}
        />
        <SummaryCard
          icon="Clock"
          color="#FF6B35"
          label={t('admin.dashboard.card.pendingAction', 'Pending action')}
          value={todayStats.pending}
          sub={t('admin.dashboard.card.newAndReview', 'New + Review')}
          highlight={todayStats.pending > 0}
          onClick={() => navigate('/admin/orders')}
        />
        <SummaryCard
          icon="Printer"
          color="#9B59B6"
          label={t('admin.dashboard.card.activePrints', 'Active prints')}
          value={todayStats.activePrints}
          sub={t('admin.dashboard.card.printingAndPostprocess', 'Printing + Postprocess')}
          onClick={() => navigate('/admin/orders')}
        />
      </div>

      {/* 2-column layout */}
      <div className="dash-columns">
        {/* Main column */}
        <div className="dash-main">

          {/* Orders needing attention */}
          {attentionOrders.length > 0 && (
            <div className="dash-section dash-section--warning">
              <div className="dash-section-header">
                <div className="dash-section-header-left">
                  <Icon name="AlertTriangle" size={18} color="#F59E0B" />
                  <h3>{t('admin.dashboard.needsAttention', 'Needs attention')}</h3>
                </div>
                <span className="dash-badge dash-badge--warning">{attentionOrders.length}</span>
              </div>
              <div className="dash-attention-list">
                {attentionOrders.map(order => {
                  const created = new Date(order.created_at || order.createdAt || Date.now());
                  const hoursOld = Math.round((Date.now() - created.getTime()) / (1000 * 60 * 60));
                  return (
                    <div
                      key={order.id}
                      className="dash-attention-item"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <div className="dash-attention-info">
                        <span className="dash-attention-id">
                          #{order.order_number || order.id?.slice(0, 8)}
                        </span>
                        <span className="dash-attention-reason">
                          {hoursOld > 48
                            ? `${t('admin.dashboard.attention.waiting', 'Waiting')} ${hoursOld}h`
                            : t('admin.dashboard.attention.hasFlags', 'Has flags')}
                        </span>
                      </div>
                      <StatusBadge status={order.status} language={language} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent orders */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3>{t('admin.dashboard.recentOrders', 'Recent orders')}</h3>
              <button
                className="dash-link-btn"
                onClick={() => navigate('/admin/orders')}
              >
                {t('admin.dashboard.viewAll', 'View all')}
                <Icon name="ArrowRight" size={14} />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="dash-empty">
                <Icon name="Package" size={32} color="var(--forge-text-muted)" />
                <p>{t('admin.dashboard.noOrdersYet', 'No orders yet')}</p>
                <button
                  className="dash-btn dash-btn--secondary"
                  onClick={() => setShowQuickOrder(true)}
                >
                  {t('admin.dashboard.createFirstOrder', 'Create first order')}
                </button>
              </div>
            ) : (
              <div className="dash-orders-table">
                <div className="dash-orders-head">
                  <span className="dash-col-id">#</span>
                  <span className="dash-col-customer">{t('admin.dashboard.col.customer', 'Customer')}</span>
                  <span className="dash-col-status">{t('admin.dashboard.col.status', 'Status')}</span>
                  <span className="dash-col-models">{t('admin.dashboard.col.models', 'Models')}</span>
                  <span className="dash-col-total">{t('admin.dashboard.col.total', 'Total')}</span>
                  <span className="dash-col-date">{t('admin.dashboard.col.date', 'Date')}</span>
                </div>
                {recentOrders.map(order => (
                  <div
                    key={order.id}
                    className="dash-orders-row"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <span className="dash-col-id dash-order-num">{order.orderNumber}</span>
                    <span className="dash-col-customer">{order.customer}</span>
                    <span className="dash-col-status">
                      <StatusBadge status={order.status} language={language} />
                    </span>
                    <span className="dash-col-models">{order.models}</span>
                    <span className="dash-col-total dash-mono">{fmtCurrency(order.total, language)}</span>
                    <span className="dash-col-date dash-muted">
                      {order.created ? formatRelativeTime(order.created, language) : '---'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3>{t('admin.dashboard.recentActivity', 'Recent activity')}</h3>
            </div>
            {recentActivity.length === 0 ? (
              <div className="dash-empty" style={{ padding: '20px 12px' }}>
                <Icon name="Activity" size={24} color="var(--forge-text-muted)" />
                <p style={{ fontSize: 13 }}>
                  {t('admin.dashboard.noActivityYet', 'No activity yet')}
                </p>
                <p style={{ fontSize: 12, color: 'var(--forge-text-muted)', margin: 0 }}>
                  {t('admin.dashboard.activityEmptyHint', 'Actions like order changes or config edits will appear here.')}
                </p>
              </div>
            ) : (
              <div className="dash-activity-feed">
                {recentActivity.map(a => (
                  <div key={a.id} className="dash-activity-item">
                    <div className={`dash-activity-dot dash-activity-dot--${a.type}`} />
                    <div className="dash-activity-content">
                      <p className="dash-activity-text">{a.text}</p>
                      <span className="dash-activity-meta">
                        {a.actor} &bull; {a.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="dash-sidebar">

          {/* Quick actions */}
          <div className="dash-section">
            <h3 className="dash-section-title">{t('admin.dashboard.quickActions', 'Quick actions')}</h3>
            <div className="dash-quick-actions">
              <button className="dash-btn dash-btn--primary dash-btn--full" onClick={() => setShowQuickOrder(true)}>
                <Icon name="Plus" size={16} />
                {t('admin.dashboard.newOrder', 'New order')}
              </button>
              <button className="dash-btn dash-btn--secondary dash-btn--full" onClick={() => navigate('/admin/orders')}>
                <Icon name="ShoppingCart" size={16} />
                {t('admin.dashboard.allOrders', 'All orders')}
              </button>
              <button className="dash-btn dash-btn--secondary dash-btn--full" onClick={() => navigate('/admin/analytics')}>
                <Icon name="BarChart3" size={16} />
                {t('admin.dashboard.analytics', 'Analytics')}
              </button>
              <button className="dash-link-btn" onClick={() => setShowOnboarding(true)} style={{ marginTop: 4, justifyContent: 'center' }}>
                <Icon name="Rocket" size={12} />
                {t('admin.dashboard.setupWizard', 'Setup wizard')}
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div className="dash-section">
            <h3 className="dash-section-title">{t('admin.dashboard.navigation', 'Navigation')}</h3>
            <div className="dash-quick-links">
              {QUICK_LINKS.map(link => (
                <button
                  key={link.path}
                  className="dash-quick-link"
                  onClick={() => navigate(link.path)}
                >
                  <div className="dash-quick-link-icon">
                    <Icon name={link.icon} size={16} />
                  </div>
                  <span>{t(link.labelKey, link.labelFallback)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pending actions counter */}
          {pendingActions.total > 0 && (
            <div className="dash-section dash-section--pending">
              <div className="dash-section-header">
                <div className="dash-section-header-left">
                  <Icon name="Bell" size={16} color="#FF6B35" />
                  <h3>{t('admin.dashboard.pendingActions', 'Pending actions')}</h3>
                </div>
                <span className="dash-badge dash-badge--pending">{pendingActions.total}</span>
              </div>
              <div className="dash-pending-list">
                {pendingActions.newOrders > 0 && (
                  <div className="dash-pending-item" onClick={() => navigate('/admin/orders')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/admin/orders'); } }}>
                    <div className="dash-pending-left">
                      <Icon name="ShoppingCart" size={14} color="#4DA8DA" />
                      <span>{t('admin.dashboard.pending.newOrders', 'New orders')}</span>
                    </div>
                    <span className="dash-pending-count">{pendingActions.newOrders}</span>
                  </div>
                )}
                {pendingActions.pendingInvoices > 0 && (
                  <div className="dash-pending-item" onClick={() => navigate('/admin/orders')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/admin/orders'); } }}>
                    <div className="dash-pending-left">
                      <Icon name="Receipt" size={14} color="#F59E0B" />
                      <span>{t('admin.dashboard.pending.invoices', 'Pending invoices')}</span>
                    </div>
                    <span className="dash-pending-count">{pendingActions.pendingInvoices}</span>
                  </div>
                )}
                {pendingActions.expiringCoupons > 0 && (
                  <div className="dash-pending-item" onClick={() => navigate('/admin/pricing')} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/admin/pricing'); } }}>
                    <div className="dash-pending-left">
                      <Icon name="Tag" size={14} color="#EF4444" />
                      <span>{t('admin.dashboard.pending.expiringCoupons', 'Expiring coupons')}</span>
                    </div>
                    <span className="dash-pending-count">{pendingActions.expiringCoupons}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Revenue sparkline */}
          <div className="dash-section">
            <div className="dash-section-header">
              <h3 className="dash-section-title" style={{ marginBottom: 0 }}>{t('admin.dashboard.revenue7days', 'Revenue (7 days)')}</h3>
              <span className="dash-sparkline-total">{fmtCurrency(revenueSparkline.total7d, language)}</span>
            </div>
            <RevenueSparkline data={revenueSparkline} language={language} />
          </div>

          {/* Popular materials */}
          {popularMaterials.length > 0 && (
            <div className="dash-section">
              <h3 className="dash-section-title">{t('admin.dashboard.popularMaterials', 'Popular materials')}</h3>
              <div className="dash-popular-materials">
                {popularMaterials.map((mat, i) => (
                  <div key={mat.name} className="dash-material-row">
                    <div className="dash-material-rank">{i + 1}.</div>
                    <div className="dash-material-name">{mat.name}</div>
                    <div className="dash-material-count">
                      {mat.count} {t('admin.dashboard.ordersAbbr', 'ord.')}
                    </div>
                    <div className="dash-material-bar-track">
                      <div
                        className="dash-material-bar-fill"
                        style={{ width: `${Math.round((mat.count / (popularMaterials[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button className="dash-link-btn" onClick={() => navigate('/admin/parameters')} style={{ marginTop: 10 }}>
                {t('admin.dashboard.allMaterials', 'All materials')}
                <Icon name="ArrowRight" size={14} />
              </button>
            </div>
          )}

          {/* System alerts */}
          {systemAlerts.length > 0 && (
            <div className="dash-section">
              <div className="dash-section-header">
                <div className="dash-section-header-left">
                  <Icon name="AlertCircle" size={16} color="#F59E0B" />
                  <h3 className="dash-section-title" style={{ marginBottom: 0 }}>{t('admin.dashboard.alerts', 'Alerts')}</h3>
                </div>
              </div>
              <div className="dash-alerts-list">
                {systemAlerts.map((alert, i) => (
                  <div
                    key={alert.id || alert.message || i}
                    className={`dash-alert-item dash-alert-item--${alert.type}`}
                    onClick={() => navigate(alert.action)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(alert.action); } }}
                  >
                    <Icon name={alert.icon} size={14} className="dash-alert-icon" />
                    <span className="dash-alert-text">{alert.text}</span>
                    <Icon name="ChevronRight" size={12} className="dash-alert-arrow" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System status */}
          <div className="dash-section">
            <h3 className="dash-section-title">{t('admin.dashboard.systemStatus', 'System status')}</h3>
            <div className="dash-status-list">
              <StatusRow
                label={t('admin.dashboard.status.pricingConfigured', 'Pricing configured')}
                ok={systemStatus.hasPricing}
                language={language}
                t={t}
              />
              <StatusRow
                label={t('admin.dashboard.status.feesConfigured', 'Fees configured')}
                ok={systemStatus.hasFees}
                language={language}
                t={t}
              />
              <StatusRow
                label={t('admin.dashboard.status.ordersInSystem', 'Orders in system')}
                ok={systemStatus.totalOrders > 0}
                language={language}
                t={t}
                value={systemStatus.totalOrders}
              />
            </div>

            {/* Branding tips */}
            {brandingTips.length > 0 && (
              <div className="dash-branding-tips">
                <div className="dash-branding-tips-header">
                  <Icon name="Sparkles" size={14} color="#F59E0B" />
                  <span>{t('admin.dashboard.tips', 'Tips')}</span>
                </div>
                <ul className="dash-branding-tips-list">
                  {brandingTips.map((tip, i) => <li key={tip.id || (typeof tip === 'string' ? tip.slice(0, 30) : i) || i}>{tip}</li>)}
                </ul>
                <button
                  className="dash-link-btn"
                  onClick={() => navigate('/admin/branding')}
                  style={{ marginTop: 8 }}
                >
                  {t('admin.dashboard.openBranding', 'Open Branding')}
                  <Icon name="ArrowRight" size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Quick Settings */}
          <QuickSettings language={language} />
        </div>
      </div>

      <DataImportWizard
        open={showImportWizard}
        onClose={() => {
          setShowImportWizard(false);
          handleRefresh();
        }}
      />

      <QuickOrderForm
        open={showQuickOrder}
        onClose={() => setShowQuickOrder(false)}
        onCreated={() => {
          setShowQuickOrder(false);
          handleRefresh();
        }}
      />

      <OnboardingWizard
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          handleRefresh();
        }}
      />

      <style>{dashboardStyles}</style>
    </div>
  );
};

/* ── Sub-components ───────────────────────────────────────────────────── */

function SummaryCard({ icon, color, label, value, sub, highlight, onClick }) {
  return (
    <div
      className={`dash-summary-card${highlight ? ' dash-summary-card--highlight' : ''}`}
      style={{ borderTop: `2px solid ${color}` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
    >
      <div className="dash-summary-card-top">
        <div className="dash-summary-card-icon" style={{ background: `${color}15` }}>
          <Icon name={icon} size={20} color={color} />
        </div>
        <span className="dash-summary-card-label">{label}</span>
      </div>
      <div className="dash-summary-card-value">{value}</div>
      {sub && <div className="dash-summary-card-sub">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status, language }) {
  const color = STATUS_COLORS[status] || '#7A8291';
  const label = getStatusLabel(status, language);
  return (
    <span
      className="dash-status-badge"
      style={{
        color,
        background: `${color}15`,
        borderColor: `${color}30`,
      }}
    >
      {label}
    </span>
  );
}

function StatusRow({ label, ok, language, t, value }) {
  return (
    <div className="dash-status-row">
      <div className="dash-status-row-left">
        <div className={`dash-status-indicator ${ok ? 'dash-status-indicator--ok' : 'dash-status-indicator--warn'}`} />
        <span>{label}</span>
      </div>
      <span className="dash-status-row-value">
        {value !== undefined ? value : (ok ? t('admin.dashboard.yes', 'Yes') : t('admin.dashboard.no', 'No'))}
      </span>
    </div>
  );
}

/* ── Styles ────────────────────────────────────────────────────────────── */

const dashboardStyles = `
  .admin-dashboard-v2 {
    max-width: 1400px;
    padding: 24px;
    background: var(--forge-bg-void, #0A0E17);
    min-height: 100vh;
  }

  /* Header */
  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
  }

  .dash-title {
    margin: 0 0 4px 0;
    font-size: 28px;
    font-weight: 700;
    font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
    color: var(--forge-text-primary, #F1F5F9);
    letter-spacing: -0.02em;
  }

  .dash-subtitle {
    margin: 0;
    color: var(--forge-text-muted, #7A8291);
    font-size: 13px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .dash-header-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  /* Buttons */
  .dash-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: var(--forge-radius-md, 6px);
    font-size: 13px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .dash-btn--primary {
    background: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #0A0E17);
  }

  .dash-btn--primary:hover {
    background: #00E8BB;
    box-shadow: 0 0 16px rgba(0, 212, 170, 0.25);
  }

  .dash-btn--secondary {
    background: var(--forge-bg-surface, #111827);
    color: var(--forge-text-secondary, #94A3B8);
    border-color: var(--forge-border-default, #1E293B);
  }

  .dash-btn--secondary:hover {
    background: var(--forge-bg-elevated, #1E293B);
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .dash-btn--full {
    width: 100%;
    justify-content: center;
  }

  .dash-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    color: var(--forge-accent-primary, #00D4AA);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .dash-link-btn:hover {
    color: #00E8BB;
  }

  /* Summary cards */
  .dash-summary-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .dash-summary-card {
    background: var(--forge-bg-surface, #111827);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .dash-summary-card:hover {
    border-color: rgba(0, 212, 170, 0.3);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }

  .dash-summary-card--highlight {
    border-color: rgba(255, 107, 53, 0.3);
    box-shadow: 0 0 12px rgba(255, 107, 53, 0.08);
  }

  .dash-summary-card-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .dash-summary-card-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--forge-radius-md, 6px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dash-summary-card-label {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--forge-text-muted, #7A8291);
    font-weight: 500;
  }

  .dash-summary-card-value {
    font-size: 28px;
    font-weight: 700;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-text-primary, #F1F5F9);
    line-height: 1.1;
    margin-bottom: 4px;
  }

  .dash-summary-card-sub {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    color: var(--forge-text-muted, #7A8291);
  }

  /* 2-column layout */
  .dash-columns {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
  }

  .dash-main {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  .dash-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* Sections */
  .dash-section {
    background: var(--forge-bg-surface, #111827);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    padding: 20px;
  }

  .dash-section--warning {
    border-left: 3px solid #F59E0B;
  }

  .dash-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .dash-section-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dash-section-header h3,
  .dash-section-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .dash-section-title {
    margin-bottom: 12px;
  }

  .dash-badge {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 600;
  }

  .dash-badge--warning {
    background: rgba(245, 158, 11, 0.15);
    color: #F59E0B;
  }

  /* Attention list */
  .dash-attention-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dash-attention-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: var(--forge-radius-md, 6px);
    background: var(--forge-bg-elevated, #0D1117);
    cursor: pointer;
    transition: background 0.15s;
  }

  .dash-attention-item:hover {
    background: var(--forge-bg-void, #0A0E17);
  }

  .dash-attention-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dash-attention-id {
    font-size: 13px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-text-primary, #F1F5F9);
    font-weight: 600;
  }

  .dash-attention-reason {
    font-size: 12px;
    color: #F59E0B;
    font-family: var(--forge-font-body, 'IBM Plex Sans', sans-serif);
  }

  /* Orders table */
  .dash-orders-table {
    display: flex;
    flex-direction: column;
  }

  .dash-orders-head {
    display: grid;
    grid-template-columns: 80px 1fr 110px 60px 100px 90px;
    gap: 8px;
    padding: 8px 12px;
    font-size: 10px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--forge-text-muted, #7A8291);
    border-bottom: 1px solid var(--forge-border-default, #1E293B);
  }

  .dash-orders-row {
    display: grid;
    grid-template-columns: 80px 1fr 110px 60px 100px 90px;
    gap: 8px;
    padding: 10px 12px;
    align-items: center;
    border-bottom: 1px solid var(--forge-border-default, #1E293B);
    cursor: pointer;
    transition: background 0.15s;
    font-size: 13px;
    color: var(--forge-text-secondary, #94A3B8);
  }

  .dash-orders-row:last-child {
    border-bottom: none;
  }

  .dash-orders-row:hover {
    background: var(--forge-bg-elevated, #1E293B);
  }

  .dash-order-num {
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-accent-primary, #00D4AA);
    font-weight: 600;
    font-size: 12px;
  }

  .dash-mono {
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    font-weight: 600;
    color: var(--forge-text-primary, #F1F5F9);
  }

  .dash-muted {
    font-size: 11px;
    color: var(--forge-text-muted, #7A8291);
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
  }

  /* Status badge */
  .dash-status-badge {
    display: inline-block;
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  /* Activity feed */
  .dash-activity-feed {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 400px;
    overflow-y: auto;
  }

  .dash-activity-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 8px 10px;
    border-radius: var(--forge-radius-md, 6px);
    transition: background 0.15s;
  }

  .dash-activity-item:hover {
    background: var(--forge-bg-elevated, #1E293B);
  }

  .dash-activity-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-top: 6px;
    flex-shrink: 0;
  }

  .dash-activity-dot--add { background: #00D4AA; }
  .dash-activity-dot--update { background: #4DA8DA; }
  .dash-activity-dot--delete { background: #EF4444; }

  .dash-activity-content {
    min-width: 0;
  }

  .dash-activity-text {
    margin: 0 0 2px 0;
    font-size: 13px;
    color: var(--forge-text-primary, #F1F5F9);
    line-height: 1.4;
  }

  .dash-activity-meta {
    font-size: 11px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-text-muted, #7A8291);
  }

  /* Empty state */
  .dash-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px;
    text-align: center;
  }

  .dash-empty p {
    margin: 0;
    color: var(--forge-text-muted, #7A8291);
    font-size: 14px;
  }

  .dash-empty-text {
    color: var(--forge-text-muted, #7A8291);
    font-size: 14px;
    margin: 0;
    font-style: italic;
  }

  /* Quick actions */
  .dash-quick-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Quick links grid */
  .dash-quick-links {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .dash-quick-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    color: var(--forge-text-secondary, #94A3B8);
    font-size: 12px;
    font-family: var(--forge-font-body, 'IBM Plex Sans', sans-serif);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .dash-quick-link:hover {
    background: var(--forge-bg-surface, #111827);
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .dash-quick-link-icon {
    width: 28px;
    height: 28px;
    border-radius: var(--forge-radius-sm, 4px);
    background: rgba(0, 212, 170, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--forge-accent-primary, #00D4AA);
  }

  /* System status */
  .dash-status-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dash-status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
    color: var(--forge-text-secondary, #94A3B8);
  }

  .dash-status-row-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dash-status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dash-status-indicator--ok {
    background: #00D4AA;
  }

  .dash-status-indicator--warn {
    background: #F59E0B;
  }

  .dash-status-row-value {
    font-size: 12px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-text-primary, #F1F5F9);
    font-weight: 600;
  }

  /* Branding tips */
  .dash-branding-tips {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--forge-border-default, #1E293B);
  }

  .dash-branding-tips-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #F59E0B;
    margin-bottom: 8px;
  }

  .dash-branding-tips-list {
    margin: 0;
    padding-left: 20px;
    font-size: 12px;
    color: var(--forge-text-secondary, #94A3B8);
    line-height: 1.6;
  }

  /* Activity feed scrollbar */
  .dash-activity-feed::-webkit-scrollbar {
    width: 4px;
  }
  .dash-activity-feed::-webkit-scrollbar-track {
    background: transparent;
  }
  .dash-activity-feed::-webkit-scrollbar-thumb {
    background: var(--forge-border-default, #1E293B);
    border-radius: 2px;
  }

  /* Onboarding banner */
  .dash-onboarding-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, rgba(0, 212, 170, 0.08) 0%, rgba(0, 212, 170, 0.02) 100%);
    border: 1px solid rgba(0, 212, 170, 0.25);
    border-radius: var(--forge-radius-md, 6px);
    cursor: pointer;
    transition: all 0.2s;
  }

  .dash-onboarding-banner:hover {
    border-color: rgba(0, 212, 170, 0.5);
    box-shadow: 0 4px 20px rgba(0, 212, 170, 0.1);
    transform: translateY(-1px);
  }

  .dash-onboarding-banner-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .dash-onboarding-banner-left strong {
    display: block;
    font-size: 14px;
    font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
    color: var(--forge-text-primary, #F1F5F9);
    font-weight: 600;
  }

  .dash-onboarding-banner-sub {
    display: block;
    font-size: 12px;
    color: var(--forge-text-muted, #7A8291);
    margin-top: 2px;
  }

  .dash-onboarding-banner-action {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    color: var(--forge-accent-primary, #00D4AA);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    white-space: nowrap;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .dash-columns {
      grid-template-columns: 1fr;
    }

    .dash-sidebar {
      order: -1;
    }
  }

  @media (max-width: 768px) {
    .dash-summary-cards {
      grid-template-columns: repeat(2, 1fr);
    }

    .dash-header {
      flex-direction: column;
    }

    .dash-orders-head,
    .dash-orders-row {
      grid-template-columns: 70px 1fr 90px 80px;
    }

    .dash-col-models,
    .dash-col-date {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .admin-dashboard-v2 {
      padding: 16px;
    }

    .dash-summary-cards {
      grid-template-columns: 1fr;
    }

    .dash-quick-links {
      grid-template-columns: 1fr;
    }

    .dash-summary-card-value {
      font-size: 22px;
    }
  }
`;

export default AdminDashboard;
