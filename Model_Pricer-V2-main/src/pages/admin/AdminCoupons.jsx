// Admin Coupons & Promotions Configuration Page — V1
// ---------------------------------------------------
// Scope: /admin/coupons only
// - Single source of truth: tenant-scoped V1 storage (namespace: coupons:v1)
// - 3 tabs: Coupons, Promotions, Settings
// - Coupons: CRUD list with code, type, value, min order, max uses, validity, active toggle
// - Promotions: CRUD list with name, type, value, auto_apply, banner, validity, active toggle
// - Settings: stacking rules, max discount cap

import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  loadCouponsConfigV1,
  saveCouponsConfigV1,
} from '../../utils/adminCouponsStorage';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function createId(prefix = 'cpn') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch {}
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const COUPON_TYPE_OPTIONS = [
  { value: 'percent', label_cs: 'Procento (%)', label_en: 'Percent (%)' },
  { value: 'fixed', label_cs: 'Pevna castka (CZK)', label_en: 'Fixed amount (CZK)' },
  { value: 'free_shipping', label_cs: 'Doprava zdarma', label_en: 'Free shipping' },
];

const PROMO_TYPE_OPTIONS = [
  { value: 'percent', label_cs: 'Procento (%)', label_en: 'Percent (%)' },
  { value: 'fixed', label_cs: 'Pevna castka (CZK)', label_en: 'Fixed amount (CZK)' },
];

const APPLIES_TO_OPTIONS = [
  { value: 'all', label_cs: 'Vse', label_en: 'All' },
  { value: 'category', label_cs: 'Kategorie', label_en: 'Category' },
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('coupons');
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  /* ---- Init ---- */
  useEffect(() => {
    try {
      const cfg = loadCouponsConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      setLoading(false);
    } catch (e) {
      console.error('[AdminCoupons] Failed to init', e);
      setLoading(false);
      setBanner({
        type: 'error',
        text: cs ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.',
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
      title: cs ? 'Kupony a akce' : 'Coupons & Promotions',
      subtitle: cs
        ? 'Spravujte slevove kupony, automaticke akce a pravidla pro slevy.'
        : 'Manage discount coupons, auto-apply promotions and discount rules.',
      save: cs ? 'Ulozit' : 'Save',
      saving: cs ? 'Ukladam...' : 'Saving...',
      saved: cs ? 'Ulozeno' : 'Saved',
      unsaved: cs ? 'Neulozene zmeny' : 'Unsaved changes',
    }),
    [cs],
  );

  /* ---- Config updaters ---- */
  const updateConfig = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const updateSettings = (patch) => {
    setConfig((prev) => ({
      ...prev,
      settings: { ...(prev.settings || {}), ...patch },
    }));
  };

  /* -- Coupons CRUD -- */
  const updateCoupon = (idx, patch) => {
    setConfig((prev) => {
      const coupons = [...(prev.coupons || [])];
      coupons[idx] = { ...coupons[idx], ...patch };
      return { ...prev, coupons };
    });
  };

  const addCoupon = () => {
    setConfig((prev) => ({
      ...prev,
      coupons: [
        ...(prev.coupons || []),
        {
          id: createId('cpn'),
          code: '',
          type: 'percent',
          value: 10,
          min_order_total: 0,
          max_uses: 0,
          used_count: 0,
          starts_at: '',
          expires_at: '',
          active: true,
          created_at: new Date().toISOString(),
          applies_to: 'all',
        },
      ],
    }));
  };

  const removeCoupon = (idx) => {
    const ok = window.confirm(cs ? 'Opravdu smazat tento kupon?' : 'Really delete this coupon?');
    if (!ok) return;
    setConfig((prev) => {
      const coupons = [...(prev.coupons || [])];
      coupons.splice(idx, 1);
      return { ...prev, coupons };
    });
  };

  /* -- Promotions CRUD -- */
  const updatePromotion = (idx, patch) => {
    setConfig((prev) => {
      const promotions = [...(prev.promotions || [])];
      promotions[idx] = { ...promotions[idx], ...patch };
      return { ...prev, promotions };
    });
  };

  const addPromotion = () => {
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
  };

  const removePromotion = (idx) => {
    const ok = window.confirm(cs ? 'Opravdu smazat tuto akci?' : 'Really delete this promotion?');
    if (!ok) return;
    setConfig((prev) => {
      const promotions = [...(prev.promotions || [])];
      promotions.splice(idx, 1);
      return { ...prev, promotions };
    });
  };

  /* ---- Save / Reset ---- */
  const handleSave = () => {
    setBanner(null);
    try {
      setSaving(true);
      const saved = saveCouponsConfigV1(config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: ui.saved });
    } catch (e) {
      console.error('[AdminCoupons] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: cs ? 'Ulozeni selhalo.' : 'Save failed.' });
    }
  };

  const handleReset = () => {
    const ok = window.confirm(cs ? 'Zahodit zmeny?' : 'Discard changes?');
    if (!ok) return;
    try {
      const cfg = loadCouponsConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      setBanner({ type: 'success', text: cs ? 'Obnoveno.' : 'Reset done.' });
    } catch (e) {
      setBanner({ type: 'error', text: cs ? 'Reset selhal.' : 'Reset failed.' });
    }
  };

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="Loader2" size={18} />
              <span>{cs ? 'Nacitam...' : 'Loading...'}</span>
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
    <div className="admin-page">
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
            {cs ? 'Reset' : 'Reset'}
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!dirty || saving}>
            <Icon name="Save" size={18} />
            {saving ? ui.saving : ui.save}
          </button>
        </div>
      </div>

      {/* ---- BANNER ---- */}
      {banner && (
        <div className={`banner ${banner.type}`}>
          <Icon name={banner.type === 'error' ? 'XCircle' : 'CheckCircle2'} size={18} />
          <span>{banner.text}</span>
        </div>
      )}

      {/* ---- GLOBAL ENABLE TOGGLE ---- */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <label className="toggle" style={{ margin: 0 }}>
            <input
              type="checkbox"
              checked={!!config?.enabled}
              onChange={(e) => updateConfig({ enabled: e.target.checked })}
            />
            <span style={{ fontWeight: 700, color: '#111827' }}>
              {cs ? 'Kupony a akce zapnuty' : 'Coupons & Promotions enabled'}
            </span>
          </label>
          <span className="muted">
            {config?.enabled
              ? (cs ? 'Zakaznici mohou pouzivat slevove kody.' : 'Customers can use discount codes.')
              : (cs ? 'Slevovy system je vypnuty.' : 'Discount system is disabled.')}
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
                <h2>{cs ? 'Slevove kupony' : 'Discount coupons'}</h2>
                <p className="card-description">
                  {cs
                    ? 'Vytvarejte a spravujte slevove kody ktere zakaznici zadavaji rucne.'
                    : 'Create and manage discount codes that customers enter manually.'}
                </p>
              </div>
              <button className="btn-secondary" onClick={addCoupon}>
                <Icon name="Plus" size={18} />
                {cs ? 'Pridat kupon' : 'Add coupon'}
              </button>
            </div>
            <div className="card-body">
              {coupons.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Ticket" size={44} />
                  <h3>{cs ? 'Zadne kupony' : 'No coupons'}</h3>
                  <p>{cs ? 'Pridejte prvni slevovy kupon.' : 'Add your first discount coupon.'}</p>
                </div>
              ) : (
                <div className="item-list">
                  {coupons.map((coupon, idx) => (
                    <div key={coupon.id || idx} className="item-row">
                      <div className="item-header">
                        <div className="item-left">
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={coupon.active}
                              onChange={(e) => updateCoupon(idx, { active: e.target.checked })}
                            />
                            <span className="item-name">
                              {coupon.code || (cs ? '(bez kodu)' : '(no code)')}
                            </span>
                          </label>
                          <span className="muted">
                            {COUPON_TYPE_OPTIONS.find((o) => o.value === coupon.type)?.[cs ? 'label_cs' : 'label_en'] || coupon.type}
                            {coupon.type !== 'free_shipping' && ` — ${coupon.value}${coupon.type === 'percent' ? '%' : ' CZK'}`}
                          </span>
                        </div>
                        <div className="item-right">
                          {coupon.max_uses > 0 && (
                            <span className="usage-badge">
                              {coupon.used_count}/{coupon.max_uses}
                            </span>
                          )}
                          <button
                            className="icon-btn danger"
                            title={cs ? 'Smazat' : 'Remove'}
                            onClick={() => removeCoupon(idx)}
                          >
                            <Icon name="Trash2" size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="item-fields grid3">
                        <div className="field">
                          <label>{cs ? 'Kod' : 'Code'}</label>
                          <input
                            className="input"
                            value={coupon.code}
                            onChange={(e) => updateCoupon(idx, { code: e.target.value.toUpperCase() })}
                            placeholder={cs ? 'Napr. SLEVA20' : 'e.g. SAVE20'}
                          />
                        </div>
                        <div className="field">
                          <label>{cs ? 'Typ' : 'Type'}</label>
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
                        {coupon.type !== 'free_shipping' && (
                          <div className="field">
                            <label>
                              {cs ? 'Hodnota' : 'Value'}
                              {coupon.type === 'percent' ? ' (%)' : ' (CZK)'}
                            </label>
                            <input
                              className="input"
                              type="number"
                              min="0"
                              step={coupon.type === 'percent' ? '1' : '10'}
                              value={coupon.value}
                              onChange={(e) => updateCoupon(idx, { value: safeNum(e.target.value, 0) })}
                            />
                          </div>
                        )}
                      </div>
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
                          <label>{cs ? 'Max. pouziti' : 'Max. uses'}</label>
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
                      </div>
                      <div className="item-fields grid2" style={{ marginTop: 10 }}>
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
                    </div>
                  ))}
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
                <h2>{cs ? 'Promocni akce' : 'Promotions'}</h2>
                <p className="card-description">
                  {cs
                    ? 'Automaticke slevy a bannerove akce. Mohou se aplikovat automaticky nebo pres kupon.'
                    : 'Auto-apply discounts and banner deals. Can be applied automatically or via coupon code.'}
                </p>
              </div>
              <button className="btn-secondary" onClick={addPromotion}>
                <Icon name="Plus" size={18} />
                {cs ? 'Pridat akci' : 'Add promotion'}
              </button>
            </div>
            <div className="card-body">
              {promotions.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Megaphone" size={44} />
                  <h3>{cs ? 'Zadne akce' : 'No promotions'}</h3>
                  <p>{cs ? 'Pridejte prvni promocni akci.' : 'Add your first promotion.'}</p>
                </div>
              ) : (
                <div className="item-list">
                  {promotions.map((promo, idx) => (
                    <div key={promo.id || idx} className="item-row">
                      <div className="item-header">
                        <div className="item-left">
                          <label className="toggle">
                            <input
                              type="checkbox"
                              checked={promo.active}
                              onChange={(e) => updatePromotion(idx, { active: e.target.checked })}
                            />
                            <span className="item-name-text">
                              {promo.name || (cs ? '(bez nazvu)' : '(unnamed)')}
                            </span>
                          </label>
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
                            step={promo.type === 'percent' ? '1' : '10'}
                            value={promo.value}
                            onChange={(e) => updatePromotion(idx, { value: safeNum(e.target.value, 0) })}
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
                              style={{ width: 40, height: 36, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', padding: 2 }}
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
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={promo.auto_apply}
                            onChange={(e) => updatePromotion(idx, { auto_apply: e.target.checked })}
                          />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {cs ? 'Automaticky aplikovat (bez kodu)' : 'Auto-apply (no code needed)'}
                          </span>
                        </label>
                      </div>
                      {/* Banner preview */}
                      {promo.banner_text && (
                        <div
                          className="banner-preview"
                          style={{
                            marginTop: 10,
                            background: promo.banner_color || '#3b82f6',
                            color: '#fff',
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
                <h2>{cs ? 'Nastaveni slev' : 'Discount settings'}</h2>
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
                      <span>{cs ? 'Povoleni kombinaci slev' : 'Allow discount stacking'}</span>
                    </div>
                    <p className="settings-description">
                      {cs
                        ? 'Pokud zapnuto, zakaznik muze pouzit vice slevovych kodu najednou.'
                        : 'If enabled, customers can use multiple discount codes at once.'}
                    </p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={!!settings.allow_stacking}
                      onChange={(e) => updateSettings({ allow_stacking: e.target.checked })}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>

                {/* Max discount percent */}
                <div className="settings-row">
                  <div className="settings-info">
                    <div className="settings-label">
                      <Icon name="ShieldCheck" size={18} />
                      <span>{cs ? 'Maximalni sleva (%)' : 'Maximum discount (%)'}</span>
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
                  <strong>{cs ? 'Poznamka' : 'Note'}</strong>
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
      {/* INLINE STYLES (same pattern as AdminEmails)                       */}
      {/* ================================================================ */}
      <style>{`
        .admin-page {
          padding: 24px;
          max-width: 1320px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 14px;
        }

        h1 { margin: 0; font-size: 28px; font-weight: 600; color: #1a1a1a; }
        .subtitle { margin: 4px 0 0 0; color: #666; font-size: 14px; max-width: 760px; }

        .header-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 999px;
          padding: 6px 10px; font-size: 12px; border: 1px solid #e6e6e6; background: #fafafa; color: #555;
        }
        .status-pill.clean { border-color: #d7f0df; background: #f3fbf6; color: #1f6b3a; }
        .status-pill.dirty { border-color: #ffe0b2; background: #fff7e6; color: #8a5a00; }

        .btn-primary {
          background: #111827; color: white; border: 1px solid #111827; border-radius: 10px;
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          background: white; color: #111827; border: 1px solid #e5e7eb; border-radius: 10px;
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .banner {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: 8px; margin: 10px 0 16px 0; font-size: 14px;
          border: 1px solid #eaeaea; background: #fafafa; color: #444;
        }
        .banner.success { border-color: #d7f0df; background: #f3fbf6; }
        .banner.error { border-color: #ffd7d7; background: #fff2f2; }

        /* Tabs */
        .tab-bar {
          display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 2px solid #eee; padding-bottom: 0;
        }
        .tab-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px;
          border: none; background: none; font-size: 14px; font-weight: 600;
          color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent;
          margin-bottom: -2px; transition: color 0.15s, border-color 0.15s;
        }
        .tab-btn:hover { color: #111827; }
        .tab-btn.active { color: #111827; border-bottom-color: #111827; }

        .badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px; border-radius: 10px;
          background: #e5e7eb; color: #374151; font-size: 11px; font-weight: 700;
          padding: 0 6px;
        }
        .tab-btn.active .badge { background: #111827; color: #fff; }

        .tab-content { }

        .admin-card { background: white; border: 1px solid #eee; border-radius: 12px; overflow: hidden; }

        .card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 14px; border-bottom: 1px solid #eee; background: #fafafa;
        }
        .card-header h2 { margin: 0; font-size: 16px; font-weight: 800; color: #111827; }
        .card-description { margin: 4px 0 0 0; font-size: 13px; color: #6b7280; max-width: 760px; }
        .card-body { padding: 14px; }

        .empty-state { padding: 32px 18px; text-align: center; color: #6b7280; }
        .empty-state h3 { margin: 10px 0 4px 0; color: #111827; font-size: 16px; }
        .empty-state p { margin: 0; font-size: 13px; }

        .muted { color: #6b7280; font-size: 12px; }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 900px) { .grid3 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .grid2 { grid-template-columns: 1fr; }
          .grid3 { grid-template-columns: 1fr; }
        }

        .field label {
          display: block; font-size: 12px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.04em; color: #374151; margin-bottom: 6px;
        }

        .input {
          width: 100%; border: 1px solid #e5e7eb; border-radius: 10px;
          padding: 10px 12px; font-size: 14px; outline: none; background: #fff;
          box-sizing: border-box;
        }
        .input:focus { border-color: #111827; box-shadow: 0 0 0 2px rgba(17,24,39,0.08); }
        .help { font-size: 12px; color: #6b7280; margin-top: 4px; }

        .toggle { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #111827; cursor: pointer; }

        .icon-btn {
          border: 1px solid #e5e7eb; background: #fff; border-radius: 10px;
          padding: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
        }
        .icon-btn:hover { background: #f9fafb; }
        .icon-btn.danger:hover { background: #fff2f2; border-color: #fca5a5; color: #b91c1c; }

        /* Item list (coupons + promotions) */
        .item-list { display: grid; gap: 14px; }

        .item-row {
          border: 1px solid #eee; border-radius: 12px; padding: 14px; background: #fff;
          transition: border-color 0.15s;
        }
        .item-row:hover { border-color: #d1d5db; }

        .item-header {
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .item-left { display: flex; flex-direction: column; gap: 4px; }
        .item-right { display: flex; align-items: center; gap: 8px; }
        .item-name { font-weight: 700; color: #111827; font-family: monospace; font-size: 15px; letter-spacing: 0.02em; }
        .item-name-text { font-weight: 700; color: #111827; font-size: 15px; }
        .item-fields { }

        .usage-badge {
          display: inline-flex; align-items: center; padding: 3px 8px;
          border-radius: 6px; font-size: 11px; font-weight: 700;
          background: #f3f4f6; color: #374151; border: 1px solid #e5e7eb;
        }

        .auto-badge {
          display: inline-flex; align-items: center; padding: 1px 6px;
          border-radius: 4px; font-size: 10px; font-weight: 700;
          background: #dbeafe; color: #1d4ed8; margin-left: 6px;
        }

        /* Settings tab */
        .settings-grid { display: grid; gap: 0; }

        .settings-row {
          display: flex; justify-content: space-between; align-items: center; gap: 16px;
          padding: 16px 0; border-bottom: 1px solid #f1f1f1;
        }
        .settings-row:last-child { border-bottom: none; }

        .settings-info { flex: 1; }
        .settings-label {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: #111827;
        }
        .settings-description { margin: 4px 0 0 26px; font-size: 13px; color: #6b7280; }

        .settings-input-wrap { display: flex; align-items: center; gap: 6px; }

        /* Toggle switch */
        .switch {
          position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0;
        }
        .switch input { opacity: 0; width: 0; height: 0; }
        .switch-slider {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: #d1d5db; transition: 0.2s; border-radius: 24px;
        }
        .switch-slider::before {
          position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
          background-color: white; transition: 0.2s; border-radius: 50%;
        }
        .switch input:checked + .switch-slider { background-color: #111827; }
        .switch input:checked + .switch-slider::before { transform: translateX(20px); }

        /* Info box */
        .info-box {
          display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px;
          border: 1px solid #dbeafe; background: #eff6ff; border-radius: 10px;
          font-size: 13px; color: #1e40af;
        }
        .info-box strong { font-size: 13px; }

        /* Responsive header */
        @media (max-width: 768px) {
          .admin-header { flex-direction: column; }
          .header-actions { justify-content: flex-start; }
        }
      `}</style>
    </div>
  );
}
