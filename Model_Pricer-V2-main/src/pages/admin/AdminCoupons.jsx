// Admin Coupons & Promotions Configuration Page — V2
// ---------------------------------------------------
// Scope: /admin/coupons only
// - Single source of truth: tenant-scoped V1 storage (namespace: coupons:v1)
// - 3 tabs: Coupons, Promotions, Settings
// - Coupons: CRUD cards with code, type (percent/fixed/free_shipping/combined), value,
//   min order, max uses (total + per customer), one-time toggle, validity dates,
//   material filter, active toggle, usage tracking (count + revenue impact + last used)
// - Auto-generate + bulk-generate coupon codes
// - Promotions: CRUD list with name, type, value, auto_apply, banner, validity, active
// - Settings: stacking rules, max discount cap

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { debug } from '@/lib/debug';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  loadCouponsConfigV1,
  saveCouponsConfigV1,
  generateCouponCode,
  bulkGenerateCoupons,
} from '../../utils/adminCouponStorage';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function createId(prefix = 'cpn') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  } catch { /* fallback */ }
  return `${prefix}_${crypto.randomUUID()}`;
}

function formatDate(isoStr) {
  if (!isoStr) return '---';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return isoStr.slice(0, 10);
  }
}

function formatCurrency(amount) {
  return `${safeNum(amount, 0).toLocaleString('cs-CZ')} Kc`;
}

const COUPON_TYPE_OPTIONS = [
  { value: 'percent', label_cs: 'Procento (%)', label_en: 'Percent (%)', icon: 'Percent' },
  { value: 'fixed', label_cs: 'Pevna castka (CZK)', label_en: 'Fixed amount (CZK)', icon: 'Banknote' },
  { value: 'free_shipping', label_cs: 'Doprava zdarma', label_en: 'Free shipping', icon: 'Truck' },
  { value: 'combined', label_cs: 'Procento + doprava zdarma', label_en: 'Percent + free shipping', icon: 'Package' },
];

const PROMO_TYPE_OPTIONS = [
  { value: 'percent', label_cs: 'Procento (%)', label_en: 'Percent (%)' },
  { value: 'fixed', label_cs: 'Pevna castka (CZK)', label_en: 'Fixed amount (CZK)' },
];

const APPLIES_TO_OPTIONS = [
  { value: 'all', label_cs: 'Vse', label_en: 'All' },
  { value: 'materials', label_cs: 'Konkretni materialy', label_en: 'Specific materials' },
  { value: 'specific_models', label_cs: 'Konkretni modely', label_en: 'Specific models' },
];

const TABS = [
  { id: 'coupons', icon: 'Ticket', label_cs: 'Kupony', label_en: 'Coupons' },
  { id: 'promotions', icon: 'Megaphone', label_cs: 'Akce', label_en: 'Promotions' },
  { id: 'settings', icon: 'Settings', label_cs: 'Nastaveni', label_en: 'Settings' },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AdminCoupons() {
  const { t, language } = useLanguage();
  const cs = language === 'cs';
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('coupons');
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  // Bulk generate state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkPrefix, setBulkPrefix] = useState('');
  const [bulkType, setBulkType] = useState('percent');
  const [bulkValue, setBulkValue] = useState(10);

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | inactive | expired

  /* ---- Init ---- */
  useEffect(() => {
    try {
      const cfg = loadCouponsConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      setLoading(false);
    } catch (e) {
      debug('[AdminCoupons] Failed to init', e);
      setLoading(false);
      setBanner({
        type: 'error',
        text: t('admin.coupons.loadError', 'Failed to load config.'),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Dirty tracking ---- */
  const dirty = useMemo(() => {
    if (!config) return false;
    return savedSnapshot !== JSON.stringify(config);
  }, [config, savedSnapshot]);

  /* ---- UI labels ---- */
  const ui = useMemo(
    () => ({
      title: t('admin.coupons.title', 'Coupons & Promotions'),
      subtitle: t('admin.coupons.subtitle', 'Manage discount coupons, auto-apply promotions and discount rules.'),
      save: t('admin.coupons.save', 'Save'),
      saving: t('admin.coupons.saving', 'Saving...'),
      saved: t('admin.coupons.saved', 'Saved'),
      unsaved: t('admin.coupons.unsaved', 'Unsaved changes'),
    }),
    [t],
  );

  /* ---- Config updaters ---- */
  const updateConfig = useCallback((patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setConfig((prev) => ({
      ...prev,
      settings: { ...(prev.settings || {}), ...patch },
    }));
  }, []);

  /* -- Coupons CRUD -- */
  const updateCoupon = useCallback((idx, patch) => {
    setConfig((prev) => {
      const coupons = [...(prev.coupons || [])];
      coupons[idx] = { ...coupons[idx], ...patch };
      return { ...prev, coupons };
    });
  }, []);

  const addCoupon = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      coupons: [
        ...(prev.coupons || []),
        {
          id: createId('cpn'),
          code: '',
          type: 'percent',
          value: 10,
          combined_percent: 0,
          min_order_total: 0,
          max_uses: 0,
          max_uses_per_customer: 0,
          one_time: false,
          used_count: 0,
          total_discount_given: 0,
          last_used_at: '',
          starts_at: '',
          expires_at: '',
          active: true,
          created_at: new Date().toISOString(),
          applies_to: 'all',
          material_ids: [],
          customer_usage: {},
        },
      ],
    }));
  }, []);

  const removeCoupon = useCallback(async (idx) => {
    const ok = await confirm({
      title: t('admin.coupons.deleteTitle', 'Delete coupon'),
      message: t('admin.coupons.deleteMessage', 'Really delete this coupon?'),
      confirmLabel: t('admin.coupons.deleteConfirm', 'Delete'),
      destructive: true,
    });
    if (!ok) return;
    setConfig((prev) => {
      const coupons = [...(prev.coupons || [])];
      coupons.splice(idx, 1);
      return { ...prev, coupons };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const duplicateCoupon = useCallback((idx) => {
    setConfig((prev) => {
      const src = prev.coupons[idx];
      if (!src) return prev;
      const dup = {
        ...src,
        id: createId('cpn'),
        code: src.code ? `${src.code}-COPY` : '',
        used_count: 0,
        total_discount_given: 0,
        last_used_at: '',
        customer_usage: {},
        created_at: new Date().toISOString(),
      };
      return { ...prev, coupons: [...prev.coupons, dup] };
    });
  }, []);

  const generateCodeForCoupon = useCallback((idx) => {
    const code = generateCouponCode('', 6);
    updateCoupon(idx, { code });
  }, [updateCoupon]);

  /* -- Bulk generate -- */
  const handleBulkGenerate = useCallback(() => {
    const count = Math.max(1, Math.min(100, safeNum(bulkCount, 5)));
    const newCoupons = bulkGenerateCoupons(count, {
      codePrefix: bulkPrefix,
      codeLength: 5,
      type: bulkType,
      value: bulkValue,
      active: true,
    });
    setConfig((prev) => ({
      ...prev,
      coupons: [...(prev.coupons || []), ...newCoupons],
    }));
    setBulkOpen(false);
    setBanner({
      type: 'success',
      text: cs ? `Vygenerovano ${newCoupons.length} kuponu.` : `Generated ${newCoupons.length} coupons.`,
    });
  }, [bulkCount, bulkPrefix, bulkType, bulkValue, cs]);

  /* -- Promotions CRUD -- */
  const updatePromotion = useCallback((idx, patch) => {
    setConfig((prev) => {
      const promotions = [...(prev.promotions || [])];
      promotions[idx] = { ...promotions[idx], ...patch };
      return { ...prev, promotions };
    });
  }, []);

  const addPromotion = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      promotions: [
        ...(prev.promotions || []),
        {
          id: createId('promo'),
          name: '',
          type: 'percent',
          value: 10,
          banner_text: '',
          banner_color: '#3b82f6',
          starts_at: '',
          expires_at: '',
          auto_apply: false,
          active: true,
          coupon_code: '',
        },
      ],
    }));
  }, []);

  const removePromotion = useCallback(async (idx) => {
    const ok = await confirm({
      title: t('admin.coupons.deletePromoTitle', 'Delete promotion'),
      message: t('admin.coupons.deletePromoMessage', 'Really delete this promotion?'),
      confirmLabel: t('admin.coupons.deleteConfirm', 'Delete'),
      destructive: true,
    });
    if (!ok) return;
    setConfig((prev) => {
      const promotions = [...(prev.promotions || [])];
      promotions.splice(idx, 1);
      return { ...prev, promotions };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  /* ---- Save / Reset ---- */
  const handleSave = useCallback(() => {
    setBanner(null);
    try {
      setSaving(true);
      // Clamp percent values to 0-100 before saving
      const sanitized = {
        ...config,
        coupons: (config.coupons || []).map((c) => {
          if (c.type === 'percent' || c.type === 'combined') {
            const val = Math.max(0, Math.min(100, Number(c.value) || 0));
            const cp = c.type === 'combined' ? Math.max(0, Math.min(100, Number(c.combined_percent) || 0)) : c.combined_percent;
            return { ...c, value: val, combined_percent: cp };
          }
          return c;
        }),
        promotions: (config.promotions || []).map((p) => {
          if (p.type === 'percent') return { ...p, value: Math.max(0, Math.min(100, Number(p.value) || 0)) };
          return p;
        }),
      };
      const saved = saveCouponsConfigV1(sanitized);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: ui.saved });
    } catch (e) {
      debug('[AdminCoupons] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: t('admin.coupons.saveError', 'Save failed.') });
    }
  }, [config, ui.saved, t]);

  const handleReset = useCallback(async () => {
    const ok = await confirm({
      title: t('admin.coupons.discardTitle', 'Discard changes'),
      message: t('admin.coupons.discardMessage', 'Discard changes?'),
      confirmLabel: t('admin.coupons.discardConfirm', 'Discard'),
      destructive: true,
    });
    if (!ok) return;
    try {
      const cfg = loadCouponsConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      setBanner({ type: 'success', text: t('admin.coupons.resetDone', 'Reset done.') });
    } catch {
      setBanner({ type: 'error', text: t('admin.coupons.resetError', 'Reset failed.') });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  /* ---- Coupon status helper ---- */
  const getCouponStatus = useCallback((coupon) => {
    if (!coupon.active) return 'inactive';
    const now = new Date();
    if (coupon.expires_at && new Date(coupon.expires_at) < now) return 'expired';
    if (coupon.starts_at && new Date(coupon.starts_at) > now) return 'scheduled';
    if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) return 'exhausted';
    if (coupon.one_time && coupon.used_count > 0) return 'exhausted';
    return 'active';
  }, []);

  /* ---- Filtered coupons ---- */
  const filteredCoupons = useMemo(() => {
    if (!config?.coupons) return [];
    let list = [...config.coupons];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      list = list.filter((c) => c.code.includes(q));
    }

    // Status filter
    if (filterStatus !== 'all') {
      list = list.filter((c) => {
        const status = getCouponStatus(c);
        if (filterStatus === 'active') return status === 'active' || status === 'scheduled';
        if (filterStatus === 'inactive') return status === 'inactive';
        if (filterStatus === 'expired') return status === 'expired' || status === 'exhausted';
        return true;
      });
    }

    return list;
  }, [config?.coupons, searchQuery, filterStatus, getCouponStatus]);

  /* ---- Stats ---- */
  const stats = useMemo(() => {
    const coupons = config?.coupons || [];
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter((c) => getCouponStatus(c) === 'active').length;
    const totalUsed = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
    const totalRevImpact = coupons.reduce((sum, c) => sum + (c.total_discount_given || 0), 0);
    return { totalCoupons, activeCoupons, totalUsed, totalRevImpact };
  }, [config?.coupons, getCouponStatus]);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="Loader2" size={18} className="spin" />
              <span>{t('admin.coupons.loading', 'Loading...')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const coupons = config?.coupons || [];
  const promotions = config?.promotions || [];
  const settings = config?.settings || {};

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */
  return (
    <div className="admin-page cpn-page">
      {/* ---- HEADER ---- */}
      <div className="admin-header">
        <div>
          <h1>{ui.title}</h1>
          <p className="subtitle">{ui.subtitle}</p>
        </div>
        <div className="header-actions">
          <div className={`status-pill ${dirty ? 'dirty' : 'clean'}`}>
            <Icon name={dirty ? 'AlertCircle' : 'CheckCircle2'} size={16} />
            <span>{dirty ? ui.unsaved : ui.saved}</span>
          </div>
          <button className="btn-secondary" onClick={handleReset} disabled={!dirty}>
            <Icon name="RotateCcw" size={18} />
            {t('admin.coupons.reset', 'Reset')}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!dirty || saving}>
            <Icon name="Save" size={18} />
            {saving ? ui.saving : ui.save}
          </button>
        </div>
      </div>

      {/* ---- BANNER ---- */}
      {banner && (
        <div className={`banner ${banner.type}`} onClick={() => setBanner(null)} role="status">
          <Icon name={banner.type === 'error' ? 'XCircle' : 'CheckCircle2'} size={18} />
          <span>{banner.text}</span>
        </div>
      )}

      {/* ---- STATS BAR ---- */}
      <div className="cpn-stats-bar">
        <div className="cpn-stat">
          <Icon name="Ticket" size={16} />
          <span className="cpn-stat-value">{stats.totalCoupons}</span>
          <span className="cpn-stat-label">{t('admin.coupons.statTotal', 'Total')}</span>
        </div>
        <div className="cpn-stat">
          <Icon name="CheckCircle2" size={16} style={{ color: 'var(--forge-success)' }} />
          <span className="cpn-stat-value">{stats.activeCoupons}</span>
          <span className="cpn-stat-label">{t('admin.coupons.statActive', 'Active')}</span>
        </div>
        <div className="cpn-stat">
          <Icon name="BarChart3" size={16} />
          <span className="cpn-stat-value">{stats.totalUsed}</span>
          <span className="cpn-stat-label">{t('admin.coupons.statUses', 'Uses')}</span>
        </div>
        <div className="cpn-stat">
          <Icon name="TrendingDown" size={16} style={{ color: 'var(--forge-warning, #f59e0b)' }} />
          <span className="cpn-stat-value">{formatCurrency(stats.totalRevImpact)}</span>
          <span className="cpn-stat-label">{t('admin.coupons.statDiscount', 'Total discount')}</span>
        </div>
      </div>

      {/* ---- GLOBAL ENABLE TOGGLE ---- */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <ForgeCheckbox
            checked={!!config?.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            label={
              <span style={{ fontWeight: 700, color: 'var(--forge-text-primary)' }}>
                {t('admin.coupons.enabledLabel', 'Coupons & Promotions enabled')}
              </span>
            }
          />
          <span className="muted">
            {config?.enabled
              ? t('admin.coupons.enabledDesc', 'Customers can use discount codes.')
              : t('admin.coupons.disabledDesc', 'Discount system is disabled.')}
          </span>
        </div>
      </div>

      {/* ---- TAB NAVIGATION ---- */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            <span>{cs ? tab.label_cs : tab.label_en}</span>
            {tab.id === 'coupons' && coupons.length > 0 && (
              <span className="badge">{coupons.length}</span>
            )}
            {tab.id === 'promotions' && promotions.length > 0 && (
              <span className="badge">{promotions.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ================================================================ */}
      {/* TAB: COUPONS                                                      */}
      {/* ================================================================ */}
      {activeTab === 'coupons' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{t('admin.coupons.sectionTitle', 'Discount coupons')}</h2>
                <p className="card-description">
                  {t('admin.coupons.sectionDesc', 'Create and manage discount codes that customers enter manually.')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => setBulkOpen(!bulkOpen)}>
                  <Icon name="Layers" size={18} />
                  {t('admin.coupons.bulk', 'Bulk')}
                </button>
                <button className="btn-secondary" onClick={addCoupon}>
                  <Icon name="Plus" size={18} />
                  {t('admin.coupons.addCouponBtn', 'Add coupon')}
                </button>
              </div>
            </div>

            {/* ---- Bulk generate panel ---- */}
            {bulkOpen && (
              <div className="bulk-panel">
                <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: 'var(--forge-text-primary)' }}>
                  <Icon name="Layers" size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
                  {t('admin.coupons.bulkTitle', 'Bulk generate coupons')}
                </h3>
                <div className="grid4">
                  <div className="field">
                    <label>{t('admin.coupons.bulkCount', 'Count')}</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      max="100"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(safeNum(e.target.value, 5))}
                    />
                  </div>
                  <div className="field">
                    <label>{t('admin.coupons.bulkPrefix', 'Code prefix')}</label>
                    <input
                      className="input"
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
                      placeholder={t('admin.coupons.bulkPrefixPlaceholder', 'e.g. SAVE')}
                    />
                  </div>
                  <div className="field">
                    <label>{t('admin.coupons.bulkType', 'Type')}</label>
                    <select className="input" value={bulkType} onChange={(e) => setBulkType(e.target.value)}>
                      {COUPON_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>{t('admin.coupons.bulkValue', 'Value')}</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(safeNum(e.target.value, 0))}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn-primary" onClick={handleBulkGenerate}>
                    <Icon name="Zap" size={16} />
                    {cs ? `Vygenerovat ${bulkCount} kuponu` : `Generate ${bulkCount} coupons`}
                  </button>
                  <button className="btn-secondary" onClick={() => setBulkOpen(false)}>
                    {t('admin.coupons.cancel', 'Cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* ---- Search + Filter bar ---- */}
            {coupons.length > 0 && (
              <div className="cpn-filter-bar">
                <div className="cpn-search-wrap">
                  <Icon name="Search" size={16} className="cpn-search-icon" />
                  <input
                    className="input cpn-search-input"
                    placeholder={t('admin.coupons.searchPlaceholder', 'Search code...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="cpn-filter-pills">
                  {[
                    { value: 'all', label: t('admin.coupons.filterAll', 'All') },
                    { value: 'active', label: t('admin.coupons.filterActive', 'Active') },
                    { value: 'inactive', label: t('admin.coupons.filterInactive', 'Inactive') },
                    { value: 'expired', label: t('admin.coupons.filterExpired', 'Expired') },
                  ].map((f) => (
                    <button
                      key={f.value}
                      className={`cpn-filter-pill ${filterStatus === f.value ? 'active' : ''}`}
                      onClick={() => setFilterStatus(f.value)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="card-body">
              {coupons.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Ticket" size={44} />
                  <h3>{t('admin.coupons.noCoupons', 'No coupons')}</h3>
                  <p>{t('admin.coupons.noCouponsDesc', 'Add your first discount coupon or bulk generate.')}</p>
                </div>
              ) : filteredCoupons.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Search" size={44} />
                  <h3>{t('admin.coupons.noResults', 'No results')}</h3>
                  <p>{t('admin.coupons.noResultsDesc', 'Try a different filter or search term.')}</p>
                </div>
              ) : (
                <div className="item-list">
                  {filteredCoupons.map((coupon) => {
                    // Find real index in config.coupons for updates
                    const idx = config.coupons.findIndex((c) => c.id === coupon.id);
                    if (idx < 0) return null;
                    const status = getCouponStatus(coupon);
                    const statusLabel = {
                      active: { text: t('admin.coupons.statusActive', 'Active'), cls: 'st-active' },
                      scheduled: { text: t('admin.coupons.statusScheduled', 'Scheduled'), cls: 'st-scheduled' },
                      inactive: { text: t('admin.coupons.statusInactive', 'Inactive'), cls: 'st-inactive' },
                      expired: { text: t('admin.coupons.statusExpired', 'Expired'), cls: 'st-expired' },
                      exhausted: { text: t('admin.coupons.statusExhausted', 'Exhausted'), cls: 'st-expired' },
                    }[status] || { text: status, cls: '' };

                    return (
                      <div key={coupon.id} className={`item-row ${status === 'inactive' || status === 'expired' || status === 'exhausted' ? 'item-row-dim' : ''}`}>
                        {/* Card header */}
                        <div className="item-header">
                          <div className="item-left">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <ForgeCheckbox
                                checked={coupon.active}
                                onChange={(e) => updateCoupon(idx, { active: e.target.checked })}
                              />
                              <span className="item-name">{coupon.code || t('admin.coupons.noCode', '(no code)')}</span>
                              <span className={`cpn-status-badge ${statusLabel.cls}`}>{statusLabel.text}</span>
                            </div>
                            <span className="muted" style={{ marginLeft: 30 }}>
                              {COUPON_TYPE_OPTIONS.find((o) => o.value === coupon.type)?.[cs ? 'label_cs' : 'label_en'] || coupon.type}
                              {coupon.type === 'percent' && ` — ${coupon.value}%`}
                              {coupon.type === 'fixed' && ` — ${coupon.value} CZK`}
                              {coupon.type === 'combined' && ` — ${coupon.combined_percent || coupon.value}% + doprava zdarma`}
                            </span>
                          </div>
                          <div className="item-right">
                            {/* Usage stats */}
                            <div className="cpn-usage-info">
                              {coupon.max_uses > 0 ? (
                                <span className="usage-badge">
                                  <Icon name="Users" size={12} />
                                  {coupon.used_count}/{coupon.max_uses}
                                </span>
                              ) : coupon.used_count > 0 ? (
                                <span className="usage-badge">
                                  <Icon name="Users" size={12} />
                                  {coupon.used_count}x
                                </span>
                              ) : null}
                              {coupon.total_discount_given > 0 && (
                                <span className="usage-badge rev-badge" title={t('admin.coupons.totalDiscountTitle', 'Total discount given')}>
                                  <Icon name="TrendingDown" size={12} />
                                  {formatCurrency(coupon.total_discount_given)}
                                </span>
                              )}
                            </div>
                            <button
                              className="icon-btn"
                              title={t('admin.coupons.duplicate', 'Duplicate')}
                              onClick={() => duplicateCoupon(idx)}
                            >
                              <Icon name="Copy" size={14} />
                            </button>
                            <button
                              className="icon-btn danger"
                              title={t('admin.coupons.remove', 'Remove')}
                              onClick={() => removeCoupon(idx)}
                            >
                              <Icon name="Trash2" size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Row 1: Code + Type + Value */}
                        <div className="item-fields grid3">
                          <div className="field">
                            <label>{t('admin.coupons.fieldCode', 'Code')}</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <input
                                className="input"
                                value={coupon.code}
                                onChange={(e) => updateCoupon(idx, { code: e.target.value.toUpperCase() })}
                                placeholder={t('admin.coupons.codePlaceholder', 'e.g. SAVE20')}
                                style={{ flex: 1 }}
                              />
                              <button
                                className="icon-btn"
                                title={t('admin.coupons.generateCode', 'Generate code')}
                                onClick={() => generateCodeForCoupon(idx)}
                              >
                                <Icon name="RefreshCw" size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="field">
                            <label>{t('admin.coupons.fieldType', 'Type')}</label>
                            <select
                              className="input"
                              value={coupon.type}
                              onChange={(e) => updateCoupon(idx, { type: e.target.value })}
                            >
                              {COUPON_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {cs ? o.label_cs : o.label_en}
                                </option>
                              ))}
                            </select>
                          </div>
                          {(coupon.type === 'percent' || coupon.type === 'fixed') && (
                            <div className="field">
                              <label>
                                {cs ? 'Hodnota' : 'Value'}
                                {coupon.type === 'percent' ? ' (%)' : ' (CZK)'}
                              </label>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                max={coupon.type === 'percent' ? '100' : undefined}
                                step={coupon.type === 'percent' ? '1' : '10'}
                                value={coupon.value}
                                onChange={(e) => {
                                  let v = safeNum(e.target.value, 0);
                                  if (coupon.type === 'percent') v = Math.max(0, Math.min(100, v));
                                  updateCoupon(idx, { value: v });
                                }}
                              />
                            </div>
                          )}
                          {coupon.type === 'combined' && (
                            <div className="field">
                              <label>{cs ? 'Procento (%)' : 'Percent (%)'}</label>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={coupon.combined_percent || coupon.value}
                                onChange={(e) => updateCoupon(idx, { combined_percent: safeNum(e.target.value, 0), value: safeNum(e.target.value, 0) })}
                              />
                              <div className="help">{cs ? '+ doprava zdarma automaticky' : '+ free shipping included'}</div>
                            </div>
                          )}
                        </div>

                        {/* Row 2: Min order + Max uses + Max per customer */}
                        <div className="item-fields grid3" style={{ marginTop: 10 }}>
                          <div className="field">
                            <label>{cs ? 'Min. objednavka (CZK)' : 'Min. order (CZK)'}</label>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              step="100"
                              value={coupon.min_order_total}
                              onChange={(e) => updateCoupon(idx, { min_order_total: safeNum(e.target.value, 0) })}
                              placeholder="0"
                            />
                            <div className="help">{cs ? '0 = bez minima' : '0 = no minimum'}</div>
                          </div>
                          <div className="field">
                            <label>{cs ? 'Max. pouziti celkem' : 'Max. total uses'}</label>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={coupon.max_uses}
                              onChange={(e) => updateCoupon(idx, { max_uses: safeNum(e.target.value, 0) })}
                              placeholder="0"
                            />
                            <div className="help">{cs ? '0 = neomezeno' : '0 = unlimited'}</div>
                          </div>
                          <div className="field">
                            <label>{cs ? 'Max. na zakaznika' : 'Max. per customer'}</label>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              value={coupon.max_uses_per_customer || 0}
                              onChange={(e) => updateCoupon(idx, { max_uses_per_customer: safeNum(e.target.value, 0) })}
                              placeholder="0"
                            />
                            <div className="help">{cs ? '0 = neomezeno' : '0 = unlimited'}</div>
                          </div>
                        </div>

                        {/* Row 3: Applies to + Dates */}
                        <div className="item-fields grid3" style={{ marginTop: 10 }}>
                          <div className="field">
                            <label>{cs ? 'Plati pro' : 'Applies to'}</label>
                            <select
                              className="input"
                              value={coupon.applies_to || 'all'}
                              onChange={(e) => updateCoupon(idx, { applies_to: e.target.value })}
                            >
                              {APPLIES_TO_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {cs ? o.label_cs : o.label_en}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>{cs ? 'Platny od' : 'Valid from'}</label>
                            <input
                              className="input"
                              type="date"
                              value={coupon.starts_at ? coupon.starts_at.slice(0, 10) : ''}
                              onChange={(e) => updateCoupon(idx, { starts_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                            />
                          </div>
                          <div className="field">
                            <label>{cs ? 'Platny do' : 'Valid until'}</label>
                            <input
                              className="input"
                              type="date"
                              value={coupon.expires_at ? coupon.expires_at.slice(0, 10) : ''}
                              onChange={(e) => updateCoupon(idx, { expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                            />
                          </div>
                        </div>

                        {/* Row 4: One-time toggle + Material IDs (if materials) */}
                        <div className="item-fields" style={{ marginTop: 10, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                          <ForgeCheckbox
                            checked={!!coupon.one_time}
                            onChange={(e) => updateCoupon(idx, { one_time: e.target.checked })}
                            label={
                              <span style={{ fontWeight: 600, fontSize: 13 }}>
                                {cs ? 'Jednorazovy (1 pouziti celkem)' : 'One-time use (1 use total)'}
                              </span>
                            }
                          />
                          {coupon.applies_to === 'materials' && (
                            <div className="field" style={{ flex: 1, minWidth: 200 }}>
                              <label>{cs ? 'ID materialu (oddelene carkou)' : 'Material IDs (comma-separated)'}</label>
                              <input
                                className="input"
                                value={(coupon.material_ids || []).join(', ')}
                                onChange={(e) => {
                                  const ids = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                  updateCoupon(idx, { material_ids: ids });
                                }}
                                placeholder={cs ? 'Napr. pla, petg, abs' : 'e.g. pla, petg, abs'}
                              />
                            </div>
                          )}
                        </div>

                        {/* Usage tracking footer */}
                        {(coupon.used_count > 0 || coupon.last_used_at) && (
                          <div className="cpn-usage-footer">
                            <span>
                              <Icon name="BarChart3" size={13} />
                              {cs ? 'Pouzito' : 'Used'}: <strong>{coupon.used_count}x</strong>
                            </span>
                            {coupon.total_discount_given > 0 && (
                              <span>
                                <Icon name="TrendingDown" size={13} />
                                {cs ? 'Sleva celkem' : 'Total discount'}: <strong>{formatCurrency(coupon.total_discount_given)}</strong>
                              </span>
                            )}
                            {coupon.last_used_at && (
                              <span>
                                <Icon name="Clock" size={13} />
                                {cs ? 'Naposledy' : 'Last used'}: <strong>{formatDate(coupon.last_used_at)}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB: PROMOTIONS                                                   */}
      {/* ================================================================ */}
      {activeTab === 'promotions' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{t('admin.coupons.promotionsTitle', 'Promotions')}</h2>
                <p className="card-description">
                  {cs
                    ? 'Automaticke slevy a bannerove akce. Mohou se aplikovat automaticky nebo pres kupon.'
                    : 'Auto-apply discounts and banner deals. Can be applied automatically or via coupon code.'}
                </p>
              </div>
              <button className="btn-secondary" onClick={addPromotion}>
                <Icon name="Plus" size={18} />
                {t('admin.coupons.addPromoBtn', 'Add promotion')}
              </button>
            </div>
            <div className="card-body">
              {promotions.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Megaphone" size={44} />
                  <h3>{t('admin.coupons.noPromos', 'No promotions')}</h3>
                  <p>{t('admin.coupons.noPromosDesc', 'Add your first promotion.')}</p>
                </div>
              ) : (
                <div className="item-list">
                  {promotions.map((promo, idx) => (
                    <div key={promo.id || idx} className="item-row">
                      <div className="item-header">
                        <div className="item-left">
                          <ForgeCheckbox
                            checked={promo.active}
                            onChange={(e) => updatePromotion(idx, { active: e.target.checked })}
                            label={<span className="item-name-text">{promo.name || t('admin.coupons.noName', '(unnamed)')}</span>}
                          />
                          <span className="muted">
                            {PROMO_TYPE_OPTIONS.find((o) => o.value === promo.type)?.[cs ? 'label_cs' : 'label_en'] || promo.type}
                            {` — ${promo.value}${promo.type === 'percent' ? '%' : ' CZK'}`}
                            {promo.auto_apply && (
                              <span className="auto-badge">{cs ? ' Auto' : ' Auto'}</span>
                            )}
                          </span>
                        </div>
                        <div className="item-right">
                          <button
                            className="icon-btn danger"
                            title={cs ? 'Smazat' : 'Remove'}
                            onClick={() => removePromotion(idx)}
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="item-fields grid3">
                        <div className="field">
                          <label>{cs ? 'Nazev' : 'Name'}</label>
                          <input
                            className="input"
                            value={promo.name}
                            onChange={(e) => updatePromotion(idx, { name: e.target.value })}
                            placeholder={cs ? 'Napr. Letni sleva' : 'e.g. Summer Sale'}
                          />
                        </div>
                        <div className="field">
                          <label>{cs ? 'Typ' : 'Type'}</label>
                          <select
                            className="input"
                            value={promo.type}
                            onChange={(e) => updatePromotion(idx, { type: e.target.value })}
                          >
                            {PROMO_TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {cs ? o.label_cs : o.label_en}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <label>
                            {cs ? 'Hodnota' : 'Value'}
                            {promo.type === 'percent' ? ' (%)' : ' (CZK)'}
                          </label>
                          <input
                            className="input"
                            type="number"
                            min="0"
                            max={promo.type === 'percent' ? '100' : undefined}
                            step={promo.type === 'percent' ? '1' : '10'}
                            value={promo.value}
                            onChange={(e) => {
                              let v = safeNum(e.target.value, 0);
                              if (promo.type === 'percent') v = Math.max(0, Math.min(100, v));
                              updatePromotion(idx, { value: v });
                            }}
                          />
                        </div>
                      </div>
                      <div className="item-fields grid2" style={{ marginTop: 10 }}>
                        <div className="field">
                          <label>{cs ? 'Text banneru' : 'Banner text'}</label>
                          <input
                            className="input"
                            value={promo.banner_text}
                            onChange={(e) => updatePromotion(idx, { banner_text: e.target.value })}
                            placeholder={cs ? 'Napr. Sleva 20% na vse!' : 'e.g. 20% off everything!'}
                          />
                        </div>
                        <div className="field">
                          <label>{cs ? 'Barva banneru' : 'Banner color'}</label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                              type="color"
                              value={promo.banner_color || '#3b82f6'}
                              onChange={(e) => updatePromotion(idx, { banner_color: e.target.value })}
                              style={{ width: 40, height: 36, border: '1px solid var(--forge-border-default)', borderRadius: 8, cursor: 'pointer', padding: 2, background: 'var(--forge-bg-elevated)' }}
                            />
                            <input
                              className="input"
                              value={promo.banner_color || '#3b82f6'}
                              onChange={(e) => updatePromotion(idx, { banner_color: e.target.value })}
                              placeholder="#3b82f6"
                              style={{ flex: 1 }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="item-fields grid3" style={{ marginTop: 10 }}>
                        <div className="field">
                          <label>{cs ? 'Kuponovy kod (volitelne)' : 'Coupon code (optional)'}</label>
                          <input
                            className="input"
                            value={promo.coupon_code || ''}
                            onChange={(e) => updatePromotion(idx, { coupon_code: e.target.value.toUpperCase() })}
                            placeholder={cs ? 'Napr. LETO2026' : 'e.g. SUMMER2026'}
                          />
                          <div className="help">
                            {cs
                              ? 'Pokud je vyplneno, akce se aktivuje timto kodem.'
                              : 'If filled, the promotion activates with this code.'}
                          </div>
                        </div>
                        <div className="field">
                          <label>{cs ? 'Platna od' : 'Valid from'}</label>
                          <input
                            className="input"
                            type="date"
                            value={promo.starts_at ? promo.starts_at.slice(0, 10) : ''}
                            onChange={(e) => updatePromotion(idx, { starts_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                          />
                        </div>
                        <div className="field">
                          <label>{cs ? 'Platna do' : 'Valid until'}</label>
                          <input
                            className="input"
                            type="date"
                            value={promo.expires_at ? promo.expires_at.slice(0, 10) : ''}
                            onChange={(e) => updatePromotion(idx, { expires_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: 10 }}>
                        <ForgeCheckbox
                          checked={promo.auto_apply}
                          onChange={(e) => updatePromotion(idx, { auto_apply: e.target.checked })}
                          label={<span style={{ fontWeight: 600, fontSize: 13 }}>{cs ? 'Automaticky aplikovat (bez kodu)' : 'Auto-apply (no code needed)'}</span>}
                        />
                      </div>
                      {/* Banner preview */}
                      {promo.banner_text && (
                        <div
                          className="banner-preview"
                          style={{
                            marginTop: 10,
                            background: promo.banner_color || 'var(--forge-info)',
                            color: 'var(--forge-text-primary)',
                            padding: '8px 14px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            textAlign: 'center',
                          }}
                        >
                          {promo.banner_text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB: SETTINGS                                                     */}
      {/* ================================================================ */}
      {activeTab === 'settings' && (
        <div className="tab-content">
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{t('admin.coupons.settingsTitle', 'Discount settings')}</h2>
                <p className="card-description">
                  {cs
                    ? 'Globalni pravidla pro kombinovani slev a maximalni limity.'
                    : 'Global rules for combining discounts and maximum limits.'}
                </p>
              </div>
            </div>
            <div className="card-body">
              <div className="settings-grid">
                {/* Stacking toggle */}
                <div className="settings-row">
                  <div className="settings-info">
                    <div className="settings-label">
                      <Icon name="Layers" size={18} />
                      <span>{t('admin.coupons.allowStacking', 'Allow discount stacking')}</span>
                    </div>
                    <p className="settings-description">
                      {cs
                        ? 'Pokud zapnuto, zakaznik muze pouzit vice slevovych kodu najednou.'
                        : 'If enabled, customers can use multiple discount codes at once.'}
                    </p>
                  </div>
                  <ForgeCheckbox
                    checked={!!settings.allow_stacking}
                    onChange={(e) => updateSettings({ allow_stacking: e.target.checked })}
                  />
                </div>

                {/* Max discount percent */}
                <div className="settings-row">
                  <div className="settings-info">
                    <div className="settings-label">
                      <Icon name="ShieldCheck" size={18} />
                      <span>{t('admin.coupons.maxDiscount', 'Maximum discount (%)')}</span>
                    </div>
                    <p className="settings-description">
                      {cs
                        ? 'Horni limit celkove slevy v procentech. 100 = bez limitu.'
                        : 'Upper limit of total discount percentage. 100 = no limit.'}
                    </p>
                  </div>
                  <div className="settings-input-wrap">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={settings.max_discount_percent ?? 100}
                      onChange={(e) =>
                        updateSettings({
                          max_discount_percent: Math.min(100, Math.max(0, safeNum(e.target.value, 0))),
                        })
                      }
                      style={{ width: 90, textAlign: 'center' }}
                    />
                    <span className="muted">%</span>
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="info-box" style={{ marginTop: 20 }}>
                <Icon name="Info" size={18} />
                <div>
                  <strong>{t('admin.coupons.note', 'Note')}</strong>
                  <p style={{ margin: '4px 0 0 0' }}>
                    {cs
                      ? 'Tato nastaveni se aplikuji na vsechny kupony i akce. Maximalni sleva se pocita po slozeni vsech aplikovanych slev.'
                      : 'These settings apply to all coupons and promotions. Maximum discount is calculated after combining all applied discounts.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* INLINE STYLES                                                     */}
      {/* ================================================================ */}
      <style>{`
        .cpn-page { padding: 24px; max-width: 1320px; margin: 0 auto; }

        .admin-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; margin-bottom: 14px;
        }
        h1 { margin: 0; font-size: 28px; font-weight: 600; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .subtitle { margin: 4px 0 0 0; color: var(--forge-text-secondary); font-size: 14px; max-width: 760px; }

        .header-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 999px;
          padding: 6px 10px; font-size: 12px; border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface); color: var(--forge-text-muted);
          font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.08em;
        }
        .status-pill.clean { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .status-pill.dirty { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }

        .btn-primary {
          background: var(--forge-accent-primary); color: #0A0E17; border: 1px solid var(--forge-accent-primary);
          border-radius: var(--forge-radius-md); padding: 10px 14px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.04em; font-size: 13px;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          background: var(--forge-bg-elevated); color: var(--forge-text-primary);
          border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .btn-secondary:hover { background: var(--forge-bg-surface); border-color: var(--forge-accent-primary); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .banner {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: var(--forge-radius-md); margin: 10px 0 16px 0; font-size: 14px;
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-surface);
          color: var(--forge-text-secondary); cursor: pointer;
        }
        .banner.success { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .banner.error { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }

        /* Stats bar */
        .cpn-stats-bar {
          display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .cpn-stat {
          display: flex; align-items: center; gap: 8px; padding: 10px 14px;
          background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md); flex: 1; min-width: 140px;
        }
        .cpn-stat-value { font-weight: 700; font-size: 16px; color: var(--forge-text-primary); font-family: var(--forge-font-tech); }
        .cpn-stat-label { font-size: 12px; color: var(--forge-text-muted); }

        /* Tabs */
        .tab-bar {
          display: flex; gap: 4px; margin-bottom: 16px;
          border-bottom: 2px solid var(--forge-border-default); padding-bottom: 0;
        }
        .tab-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px;
          border: none; background: none; font-size: 14px; font-weight: 600;
          color: var(--forge-text-muted); cursor: pointer; border-bottom: 2px solid transparent;
          margin-bottom: -2px; transition: color 0.15s, border-color 0.15s;
        }
        .tab-btn:hover { color: var(--forge-text-primary); }
        .tab-btn.active { color: var(--forge-accent-primary); border-bottom-color: var(--forge-accent-primary); }

        .badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px; border-radius: 10px;
          background: var(--forge-bg-elevated); color: var(--forge-text-secondary);
          font-size: 11px; font-weight: 700; padding: 0 6px;
        }
        .tab-btn.active .badge { background: var(--forge-accent-primary); color: #0A0E17; }

        .admin-card {
          background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md); overflow: hidden;
        }
        .card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 14px; border-bottom: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
        }
        .card-header h2 {
          margin: 0; font-size: 11px; font-weight: 800; color: var(--forge-text-muted);
          font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.08em;
        }
        .card-description { margin: 4px 0 0 0; font-size: 13px; color: var(--forge-text-muted); max-width: 760px; }
        .card-body { padding: 14px; }

        .empty-state { padding: 32px 18px; text-align: center; color: var(--forge-text-muted); }
        .empty-state h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); font-size: 16px; }
        .empty-state p { margin: 0; font-size: 13px; }

        .muted { color: var(--forge-text-muted); font-size: 12px; }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 900px) { .grid3, .grid4 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .grid2, .grid3, .grid4 { grid-template-columns: 1fr; }
        }

        .field label {
          display: block; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); margin-bottom: 6px;
          font-family: var(--forge-font-tech);
        }

        .input {
          width: 100%; border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md); padding: 10px 12px; font-size: 14px;
          outline: none; background: var(--forge-bg-elevated);
          box-sizing: border-box; color: var(--forge-text-primary);
        }
        .input:focus { border-color: var(--forge-accent-primary); box-shadow: 0 0 0 2px rgba(0,212,170,0.15); }
        .help { font-size: 12px; color: var(--forge-text-muted); margin-top: 4px; }

        .icon-btn {
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
          border-radius: var(--forge-radius-md); padding: 6px; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--forge-text-secondary);
        }
        .icon-btn:hover { background: var(--forge-bg-surface); border-color: var(--forge-accent-primary); }
        .icon-btn.danger:hover { background: rgba(255,71,87,0.1); border-color: var(--forge-error); color: var(--forge-error); }

        /* Item list */
        .item-list { display: grid; gap: 14px; }

        .item-row {
          border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 14px; background: var(--forge-bg-surface); transition: border-color 0.15s;
        }
        .item-row:hover { border-color: var(--forge-accent-primary); }
        .item-row-dim { opacity: 0.65; }
        .item-row-dim:hover { opacity: 0.85; }

        .item-header {
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .item-left { display: flex; flex-direction: column; gap: 4px; }
        .item-right { display: flex; align-items: center; gap: 8px; }
        .item-name {
          font-weight: 700; color: var(--forge-accent-primary);
          font-family: var(--forge-font-tech); font-size: 15px; letter-spacing: 0.02em;
        }
        .item-name-text { font-weight: 700; color: var(--forge-text-primary); font-size: 15px; }

        .usage-badge {
          display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px;
          border-radius: 6px; font-size: 11px; font-weight: 700;
          background: var(--forge-bg-elevated); color: var(--forge-text-secondary);
          border: 1px solid var(--forge-border-default); font-family: var(--forge-font-tech);
        }
        .rev-badge { color: var(--forge-warning, #f59e0b); border-color: rgba(245,158,11,0.3); }

        .auto-badge {
          display: inline-flex; align-items: center; padding: 1px 6px;
          border-radius: 4px; font-size: 10px; font-weight: 700;
          background: rgba(0,212,170,0.12); color: var(--forge-accent-primary); margin-left: 6px;
        }

        /* Coupon status badges */
        .cpn-status-badge {
          display: inline-flex; align-items: center; padding: 2px 8px;
          border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; font-family: var(--forge-font-tech);
        }
        .st-active { background: rgba(0,212,170,0.12); color: var(--forge-success); }
        .st-scheduled { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .st-inactive { background: var(--forge-bg-elevated); color: var(--forge-text-muted); }
        .st-expired { background: rgba(255,71,87,0.1); color: var(--forge-error); }

        /* Usage tracking footer */
        .cpn-usage-footer {
          display: flex; gap: 16px; flex-wrap: wrap; margin-top: 12px; padding-top: 10px;
          border-top: 1px solid var(--forge-border-default);
          font-size: 12px; color: var(--forge-text-muted);
        }
        .cpn-usage-footer span { display: inline-flex; align-items: center; gap: 4px; }
        .cpn-usage-footer strong { color: var(--forge-text-primary); }

        /* Usage info in header */
        .cpn-usage-info { display: flex; gap: 6px; align-items: center; }

        /* Bulk generate panel */
        .bulk-panel {
          padding: 14px; border-bottom: 1px solid var(--forge-border-default);
          background: rgba(0,212,170,0.03);
        }

        /* Filter bar */
        .cpn-filter-bar {
          display: flex; gap: 12px; align-items: center; padding: 10px 14px;
          border-bottom: 1px solid var(--forge-border-default); flex-wrap: wrap;
        }
        .cpn-search-wrap { position: relative; flex: 1; min-width: 180px; }
        .cpn-search-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: var(--forge-text-muted); pointer-events: none;
        }
        .cpn-search-input { padding-left: 32px !important; }
        .cpn-filter-pills { display: flex; gap: 4px; }
        .cpn-filter-pill {
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
          border-radius: 999px; padding: 5px 12px; font-size: 12px; font-weight: 600;
          color: var(--forge-text-muted); cursor: pointer; transition: all 0.15s;
        }
        .cpn-filter-pill:hover { border-color: var(--forge-accent-primary); color: var(--forge-text-primary); }
        .cpn-filter-pill.active {
          background: var(--forge-accent-primary); color: #0A0E17;
          border-color: var(--forge-accent-primary);
        }

        /* Settings tab */
        .settings-grid { display: grid; gap: 0; }
        .settings-row {
          display: flex; justify-content: space-between; align-items: center; gap: 16px;
          padding: 16px 0; border-bottom: 1px solid var(--forge-border-default);
        }
        .settings-row:last-child { border-bottom: none; }
        .settings-info { flex: 1; }
        .settings-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: var(--forge-text-primary);
        }
        .settings-description { margin: 4px 0 0 26px; font-size: 13px; color: var(--forge-text-muted); }
        .settings-input-wrap { display: flex; align-items: center; gap: 6px; }

        /* Info box */
        .info-box {
          display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px;
          border: 1px solid rgba(0,212,170,0.2); background: rgba(0,212,170,0.05);
          border-radius: var(--forge-radius-md); font-size: 13px; color: var(--forge-accent-primary);
        }
        .info-box strong { font-size: 13px; }

        /* Spinner */
        @keyframes cpn-spin { to { transform: rotate(360deg); } }
        .spin { animation: cpn-spin 1s linear infinite; }

        /* Responsive */
        @media (max-width: 768px) {
          .admin-header { flex-direction: column; }
          .header-actions { justify-content: flex-start; }
          .cpn-stats-bar { flex-direction: column; }
          .cpn-stat { min-width: auto; }
        }
      `}</style>
      <ConfirmDialog />
    </div>
  );
}
