// Admin Shipping Methods Configuration Page — V1 Enhanced
// --------------------------------------------------------
// Scope: /admin/shipping only
// - Single source of truth: tenant-scoped V1 storage (namespace: shipping:v1)
// - 2-column layout: method list (left) + method editor (right)
// - Supports FIXED, WEIGHT_BASED, PICKUP and CUSTOM shipping types
// - Shipping zones (CZ, SK, EU, Custom) with per-zone pricing
// - Weight-based pricing with predefined tiers
// - Price per kg surcharge
// - Free shipping threshold configuration

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { SkeletonCard, SkeletonTable } from '../../components/ui/forge/ForgeSkeleton';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  loadShippingConfigV1,
  saveShippingConfigV1,
  DEFAULT_WEIGHT_TIERS,
} from '../../utils/adminShippingStorage';
import ForgeHelpIcon from '../../components/ui/forge/ForgeHelpIcon';
import { getHelpText } from './helpTexts';

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function createId(prefix = 'ship') {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  } catch { /* fallback below */ }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const SHIPPING_TYPES = [
  { value: 'FIXED', label_cs: 'Pevna cena', label_en: 'Fixed price', icon: 'DollarSign' },
  { value: 'WEIGHT_BASED', label_cs: 'Podle hmotnosti', label_en: 'Weight-based', icon: 'Scale' },
  { value: 'PICKUP', label_cs: 'Osobni odber', label_en: 'Personal pickup', icon: 'MapPin' },
  { value: 'CUSTOM', label_cs: 'Vlastni', label_en: 'Custom', icon: 'Settings' },
];

// --- Editor tab enum ---
const TABS = { BASIC: 'basic', WEIGHT: 'weight', ZONES: 'zones' };

function weightLabel(g) {
  if (g >= 999999) return '10+ kg';
  const kg = g / 1000;
  return kg >= 1 ? `${kg} kg` : `${g} g`;
}

export default function AdminShipping() {
  const { language } = useLanguage();
  const cs = language === 'cs';
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS.BASIC);
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  useEffect(() => {
    try {
      const cfg = loadShippingConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      if (cfg.methods?.length) setSelectedMethodId(cfg.methods[0].id);
      setLoading(false);
    } catch (e) {
      console.error('[AdminShipping] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: cs ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    if (!config) return false;
    return savedSnapshot !== JSON.stringify(config);
  }, [config, savedSnapshot]);

  const selectedMethod = useMemo(() => {
    if (!config?.methods || !selectedMethodId) return null;
    return config.methods.find((m) => m.id === selectedMethodId) || null;
  }, [config, selectedMethodId]);

  const allZones = useMemo(() => {
    if (!config) return [];
    return [...(config.zones || []), ...(config.custom_zones || [])];
  }, [config]);

  // --- Mutations ---
  const updateConfig = useCallback((patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateMethod = useCallback((methodId, patch) => {
    setConfig((prev) => {
      const methods = (prev.methods || []).map((m) => {
        if (m.id !== methodId) return m;
        return { ...m, ...patch };
      });
      return { ...prev, methods };
    });
  }, []);

  const addMethod = useCallback(() => {
    const id = createId('ship');
    const newMethod = {
      id,
      name: cs ? 'Nova doprava' : 'New shipping',
      type: 'FIXED',
      price: 0,
      price_per_kg: 0,
      weight_tiers: [],
      zone_pricing: [],
      delivery_days_min: 1,
      delivery_days_max: 3,
      active: true,
      sort_order: (config?.methods?.length || 0),
      description: '',
    };
    setConfig((prev) => ({ ...prev, methods: [...(prev.methods || []), newMethod] }));
    setSelectedMethodId(id);
    setActiveTab(TABS.BASIC);
    setBanner(null);
  }, [config, cs]);

  const removeMethod = useCallback(async (id) => {
    const ok = await confirm({
      title: cs ? 'Smazat metodu' : 'Delete method',
      message: cs ? 'Smazat tuto metodu dopravy?' : 'Delete this shipping method?',
      confirmLabel: cs ? 'Smazat' : 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setConfig((prev) => ({
      ...prev,
      methods: (prev.methods || []).filter((m) => m.id !== id),
    }));
    if (selectedMethodId === id) setSelectedMethodId(null);
  }, [confirm, cs, selectedMethodId]);

  const moveMethod = useCallback((methodId, direction) => {
    setConfig((prev) => {
      const methods = [...(prev.methods || [])];
      const idx = methods.findIndex((m) => m.id === methodId);
      if (idx < 0) return prev;
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= methods.length) return prev;
      [methods[idx], methods[swapIdx]] = [methods[swapIdx], methods[idx]];
      return { ...prev, methods: methods.map((m, i) => ({ ...m, sort_order: i })) };
    });
  }, []);

  // Weight tier CRUD
  const addWeightTier = useCallback(() => {
    if (!selectedMethod) return;
    const tiers = [...(selectedMethod.weight_tiers || [])];
    const lastMax = tiers.length > 0 ? safeNum(tiers[tiers.length - 1].max_weight_g, 0) : 0;
    tiers.push({ max_weight_g: lastMax + 1000, price: 0 });
    updateMethod(selectedMethod.id, { weight_tiers: tiers });
  }, [selectedMethod, updateMethod]);

  const seedDefaultWeightTiers = useCallback(() => {
    if (!selectedMethod) return;
    updateMethod(selectedMethod.id, { weight_tiers: DEFAULT_WEIGHT_TIERS.map(t => ({ ...t })) });
  }, [selectedMethod, updateMethod]);

  const updateWeightTier = useCallback((idx, patch) => {
    if (!selectedMethod) return;
    const tiers = [...(selectedMethod.weight_tiers || [])];
    tiers[idx] = { ...tiers[idx], ...patch };
    updateMethod(selectedMethod.id, { weight_tiers: tiers });
  }, [selectedMethod, updateMethod]);

  const removeWeightTier = useCallback((idx) => {
    if (!selectedMethod) return;
    const tiers = [...(selectedMethod.weight_tiers || [])];
    tiers.splice(idx, 1);
    updateMethod(selectedMethod.id, { weight_tiers: tiers });
  }, [selectedMethod, updateMethod]);

  // Zone CRUD
  const addCustomZone = useCallback(() => {
    const id = createId('zone');
    const newZone = { id, name: cs ? 'Vlastni zona' : 'Custom zone', name_en: 'Custom zone', active: true };
    setConfig((prev) => ({
      ...prev,
      custom_zones: [...(prev.custom_zones || []), newZone],
    }));
  }, [cs]);

  const removeCustomZone = useCallback(async (zoneId) => {
    const ok = await confirm({
      title: cs ? 'Smazat zonu' : 'Delete zone',
      message: cs ? 'Smazat tuto prepravni zonu?' : 'Delete this shipping zone?',
      confirmLabel: cs ? 'Smazat' : 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setConfig((prev) => ({
      ...prev,
      custom_zones: (prev.custom_zones || []).filter(z => z.id !== zoneId),
      // Also remove zone_pricing from all methods
      methods: (prev.methods || []).map(m => ({
        ...m,
        zone_pricing: (m.zone_pricing || []).filter(zp => zp.zone_id !== zoneId),
      })),
    }));
  }, [confirm, cs]);

  const updateZone = useCallback((zoneId, patch, isCustom) => {
    setConfig((prev) => {
      const key = isCustom ? 'custom_zones' : 'zones';
      return {
        ...prev,
        [key]: (prev[key] || []).map(z => z.id === zoneId ? { ...z, ...patch } : z),
      };
    });
  }, []);

  // Zone pricing per method
  const getZonePrice = useCallback((method, zoneId) => {
    if (!method) return null;
    return (method.zone_pricing || []).find(zp => zp.zone_id === zoneId) || null;
  }, []);

  const setZonePrice = useCallback((methodId, zoneId, patch) => {
    setConfig((prev) => ({
      ...prev,
      methods: (prev.methods || []).map(m => {
        if (m.id !== methodId) return m;
        const existing = (m.zone_pricing || []).find(zp => zp.zone_id === zoneId);
        let zonePricing;
        if (existing) {
          zonePricing = (m.zone_pricing || []).map(zp => zp.zone_id === zoneId ? { ...zp, ...patch } : zp);
        } else {
          zonePricing = [...(m.zone_pricing || []), { zone_id: zoneId, price_override: null, price_per_kg_override: null, weight_tiers_override: null, ...patch }];
        }
        return { ...m, zone_pricing: zonePricing };
      }),
    }));
  }, []);

  // Save / Reset
  const handleSave = useCallback(() => {
    setBanner(null);
    try {
      setSaving(true);
      const saved = saveShippingConfigV1(config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: cs ? 'Ulozeno' : 'Saved' });
    } catch (e) {
      console.error('[AdminShipping] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: cs ? 'Ulozeni selhalo.' : 'Save failed.' });
    }
  }, [config, cs]);

  const handleReset = useCallback(async () => {
    const ok = await confirm({
      title: cs ? 'Zahodit zmeny' : 'Discard changes',
      message: cs ? 'Zahodit zmeny?' : 'Discard changes?',
      confirmLabel: cs ? 'Zahodit' : 'Discard',
      destructive: true,
    });
    if (!ok) return;
    try {
      const cfg = loadShippingConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));
      if (cfg.methods?.length) setSelectedMethodId(cfg.methods[0].id);
      setBanner({ type: 'success', text: cs ? 'Obnoveno.' : 'Reset done.' });
    } catch (e) {
      setBanner({ type: 'error', text: cs ? 'Reset selhal.' : 'Reset failed.' });
    }
  }, [confirm, cs]);

  // --- RENDER ---
  if (loading) {
    return (
      <div className="admin-page">
        <div style={{ display: 'grid', gap: '16px' }}>
          <SkeletonCard textLines={2} />
          <SkeletonTable rows={4} cols={3} />
        </div>
      </div>
    );
  }

  const methods = config?.methods || [];

  return (
    <div className="admin-page">
      {/* HEADER */}
      <div className="admin-header">
        <div>
          <h1>{cs ? 'Doprava' : 'Shipping'}</h1>
          <p className="subtitle">
            {cs
              ? 'Spravuj zpusoby dopravy, prepravni zony, cenove tiery podle hmotnosti a prah pro dopravu zdarma.'
              : 'Manage shipping methods, zones, weight-based pricing tiers and free shipping threshold.'}
          </p>
        </div>
        <div className="header-actions">
          <div className={`status-pill ${dirty ? 'dirty' : 'clean'}`}>
            <Icon name={dirty ? 'AlertCircle' : 'CheckCircle2'} size={16} />
            <span>{dirty ? (cs ? 'Neulozene zmeny' : 'Unsaved changes') : (cs ? 'Ulozeno' : 'Saved')}</span>
          </div>
          <button className="btn-secondary" onClick={addMethod}>
            <Icon name="Plus" size={18} />
            {cs ? 'Nova metoda' : 'New method'}
          </button>
          <button className="btn-secondary" onClick={handleReset} disabled={!dirty}>
            <Icon name="RotateCcw" size={18} />
            Reset
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!dirty || saving}>
            <Icon name="Save" size={18} />
            {saving ? (cs ? 'Ukladam...' : 'Saving...') : (cs ? 'Ulozit' : 'Save')}
          </button>
        </div>
      </div>

      {banner && (
        <div className={`banner ${banner.type}`}>
          <Icon name={banner.type === 'error' ? 'XCircle' : 'CheckCircle2'} size={18} />
          <span>{banner.text}</span>
        </div>
      )}

      <div className="shipping-layout">
        {/* LEFT: METHOD LIST + GLOBAL SETTINGS */}
        <div className="shipping-left">
          {/* Method list panel */}
          <div className="shipping-panel">
            <div className="panel-header">
              <div className="panel-title">
                <h2>{cs ? 'Metody dopravy' : 'Shipping methods'}</h2>
                <span className="muted">{methods.length}</span>
              </div>
              <ForgeCheckbox
                checked={config?.enabled !== false}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
                label={cs ? 'Doprava zapnuta' : 'Shipping enabled'}
                style={{ marginTop: 8 }}
              />
            </div>

            <div className="panel-body">
              {methods.length === 0 ? (
                <div className="empty-state">
                  <Icon name="Package" size={44} />
                  <h3>{cs ? 'Zadne metody dopravy' : 'No shipping methods'}</h3>
                  <p>{cs ? 'Klikni na "Nova metoda".' : 'Click "New method".'}</p>
                </div>
              ) : (
                <div className="method-list">
                  {methods.map((method, idx) => {
                    const isActive = method.id === selectedMethodId;
                    const typeLabel = SHIPPING_TYPES.find((t) => t.value === method.type);
                    return (
                      <div
                        key={method.id}
                        className={`method-row ${isActive ? 'active' : ''}`}
                        onClick={() => { setSelectedMethodId(method.id); setActiveTab(TABS.BASIC); }}
                      >
                        <div className="method-row-main">
                          <div className="method-row-top">
                            <div className="method-name">
                              <span className={`dot ${method.active ? 'on' : 'off'}`} />
                              <span className="name-text">{method.name}</span>
                            </div>
                            <div className="method-actions">
                              <button className="icon-btn" title={cs ? 'Nahoru' : 'Up'} onClick={(e) => { e.stopPropagation(); moveMethod(method.id, -1); }} disabled={idx === 0}>
                                <Icon name="ChevronUp" size={14} />
                              </button>
                              <button className="icon-btn" title={cs ? 'Dolu' : 'Down'} onClick={(e) => { e.stopPropagation(); moveMethod(method.id, 1); }} disabled={idx === methods.length - 1}>
                                <Icon name="ChevronDown" size={14} />
                              </button>
                              <button className="icon-btn" title={cs ? 'Smazat' : 'Delete'} onClick={(e) => { e.stopPropagation(); removeMethod(method.id); }}>
                                <Icon name="Trash2" size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="method-row-bottom">
                            <span className="chip">
                              <Icon name={typeLabel?.icon || 'Package'} size={12} />
                              {typeLabel ? (cs ? typeLabel.label_cs : typeLabel.label_en) : method.type}
                            </span>
                            {method.type === 'FIXED' && <span className="chip">{safeNum(method.price).toFixed(0)} CZK</span>}
                            {method.type === 'PICKUP' && <span className="chip">{cs ? 'Zdarma' : 'Free'}</span>}
                            {method.type === 'WEIGHT_BASED' && <span className="chip">{(method.weight_tiers || []).length} {cs ? 'tieru' : 'tiers'}</span>}
                            {method.type === 'CUSTOM' && <span className="chip">{safeNum(method.price).toFixed(0)} CZK</span>}
                            {safeNum(method.price_per_kg) > 0 && (
                              <span className="chip">+{safeNum(method.price_per_kg)} CZK/kg</span>
                            )}
                            {(method.delivery_days_min > 0 || method.delivery_days_max > 0) && (
                              <span className="chip">
                                <Icon name="Clock" size={12} />
                                {method.delivery_days_min}–{method.delivery_days_max} {cs ? 'dni' : 'days'}
                              </span>
                            )}
                            {(method.zone_pricing || []).length > 0 && (
                              <span className="chip">
                                <Icon name="Globe" size={12} />
                                {(method.zone_pricing || []).length} {cs ? 'zon' : 'zones'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Free shipping card */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Doprava zdarma' : 'Free shipping'} <ForgeHelpIcon text={getHelpText('shipping_free_threshold', language)} size={14} /></h2>
                <p className="card-description">{cs ? 'Nastav minimalni castku objednavky pro dopravu zdarma.' : 'Set minimum order amount for free shipping.'}</p>
              </div>
            </div>
            <div className="card-body">
              <div className="toggles">
                <ForgeCheckbox
                  checked={config?.free_shipping_enabled === true}
                  onChange={(e) => updateConfig({ free_shipping_enabled: e.target.checked })}
                  label={cs ? 'Doprava zdarma zapnuta' : 'Free shipping enabled'}
                />
              </div>
              {config?.free_shipping_enabled && (
                <div className="field" style={{ marginTop: 12, maxWidth: 300 }}>
                  <label>{cs ? 'Minimalni castka objednavky (CZK)' : 'Minimum order amount (CZK)'}</label>
                  <input
                    className="input"
                    type="number"
                    step="1"
                    min="0"
                    value={config?.free_shipping_threshold || 0}
                    onChange={(e) => updateConfig({ free_shipping_threshold: safeNum(e.target.value, 0) })}
                  />
                  <div className="help">{cs ? 'Objednavky nad tuto castku budou mit dopravu zdarma.' : 'Orders above this amount get free shipping.'}</div>
                </div>
              )}
              {config?.free_shipping_enabled && safeNum(config?.free_shipping_threshold) > 0 && (
                <div className="free-shipping-preview">
                  <Icon name="Truck" size={16} />
                  <span>
                    {cs
                      ? `Doprava zdarma od ${safeNum(config.free_shipping_threshold).toLocaleString('cs-CZ')} CZK`
                      : `Free shipping from ${safeNum(config.free_shipping_threshold).toLocaleString('en-US')} CZK`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping zones card */}
          <div className="admin-card">
            <div className="card-header">
              <div>
                <h2>{cs ? 'Prepravni zony' : 'Shipping zones'} <ForgeHelpIcon text={getHelpText('shipping_zones', language)} size={14} /></h2>
                <p className="card-description">{cs ? 'Definuj zony pro ruzne ceny dopravy.' : 'Define zones for different shipping prices.'}</p>
              </div>
              <button className="btn-secondary btn-sm" onClick={addCustomZone}>
                <Icon name="Plus" size={14} />
                {cs ? 'Vlastni zona' : 'Custom zone'}
              </button>
            </div>
            <div className="card-body">
              <div className="zone-list">
                {/* Built-in zones */}
                {(config?.zones || []).map((zone) => (
                  <div key={zone.id} className="zone-row">
                    <div className="zone-info">
                      <ForgeCheckbox
                        checked={zone.active}
                        onChange={(e) => updateZone(zone.id, { active: e.target.checked }, false)}
                      />
                      <Icon name="Globe" size={16} style={{ color: 'var(--forge-text-muted)' }} />
                      <span className="zone-name">{cs ? zone.name : zone.name_en}</span>
                      <span className="zone-badge">{zone.id}</span>
                    </div>
                  </div>
                ))}
                {/* Custom zones */}
                {(config?.custom_zones || []).map((zone) => (
                  <div key={zone.id} className="zone-row">
                    <div className="zone-info">
                      <ForgeCheckbox
                        checked={zone.active}
                        onChange={(e) => updateZone(zone.id, { active: e.target.checked }, true)}
                      />
                      <Icon name="MapPin" size={16} style={{ color: 'var(--forge-accent-secondary)' }} />
                      <input
                        className="input input-inline"
                        value={zone.name}
                        onChange={(e) => updateZone(zone.id, { name: e.target.value, name_en: e.target.value }, true)}
                        placeholder={cs ? 'Nazev zony' : 'Zone name'}
                      />
                      <span className="zone-badge custom">{cs ? 'Vlastni' : 'Custom'}</span>
                      <button className="icon-btn icon-btn-sm" onClick={() => removeCustomZone(zone.id)} title={cs ? 'Smazat' : 'Delete'}>
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: EDITOR */}
        <div className="shipping-editor">
          {!selectedMethod ? (
            <div className="admin-card">
              <div className="card-body" style={{ padding: 16 }}>
                <div className="empty-editor">
                  <Icon name="MousePointer2" size={44} />
                  <h3>{cs ? 'Editor metody' : 'Method editor'}</h3>
                  <p>{cs ? 'Vyber metodu vlevo.' : 'Select a method on the left.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TABS */}
              <div className="editor-tabs">
                <button
                  className={`editor-tab ${activeTab === TABS.BASIC ? 'active' : ''}`}
                  onClick={() => setActiveTab(TABS.BASIC)}
                >
                  <Icon name="Settings" size={14} />
                  {cs ? 'Zakladni' : 'Basic'}
                </button>
                {selectedMethod.type === 'WEIGHT_BASED' && (
                  <button
                    className={`editor-tab ${activeTab === TABS.WEIGHT ? 'active' : ''}`}
                    onClick={() => setActiveTab(TABS.WEIGHT)}
                  >
                    <Icon name="Scale" size={14} />
                    {cs ? 'Hmotnost' : 'Weight'}
                  </button>
                )}
                <button
                  className={`editor-tab ${activeTab === TABS.ZONES ? 'active' : ''}`}
                  onClick={() => setActiveTab(TABS.ZONES)}
                >
                  <Icon name="Globe" size={14} />
                  {cs ? 'Zony' : 'Zones'}
                </button>
              </div>

              {/* TAB: BASIC SETTINGS */}
              {activeTab === TABS.BASIC && (
                <div className="admin-card">
                  <div className="card-header">
                    <div>
                      <h2>{cs ? 'Zakladni nastaveni' : 'Basic settings'}</h2>
                      <p className="card-description">{cs ? 'Nazev, typ, cena a doba doruceni.' : 'Name, type, price and delivery time.'}</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="grid2">
                      <div className="field">
                        <label>{cs ? 'Nazev' : 'Name'}</label>
                        <input
                          className="input"
                          value={selectedMethod.name}
                          onChange={(e) => updateMethod(selectedMethod.id, { name: e.target.value })}
                          placeholder={cs ? 'Napr. Ceska posta' : 'e.g. Standard Shipping'}
                        />
                      </div>
                      <div className="field">
                        <label>{cs ? 'Typ' : 'Type'}</label>
                        <select
                          className="input"
                          value={selectedMethod.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const patch = { type: newType };
                            if (newType === 'WEIGHT_BASED') {
                              patch.weight_tiers = selectedMethod.weight_tiers?.length > 0
                                ? selectedMethod.weight_tiers
                                : DEFAULT_WEIGHT_TIERS.map(t => ({ ...t }));
                            } else {
                              patch.weight_tiers = [];
                            }
                            if (newType === 'PICKUP') {
                              patch.price = 0;
                              patch.price_per_kg = 0;
                            }
                            updateMethod(selectedMethod.id, patch);
                            if (newType === 'WEIGHT_BASED') setActiveTab(TABS.WEIGHT);
                          }}
                        >
                          {SHIPPING_TYPES.map((o) => (
                            <option key={o.value} value={o.value}>{cs ? o.label_cs : o.label_en}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(selectedMethod.type === 'FIXED' || selectedMethod.type === 'CUSTOM') && (
                      <div className="grid2" style={{ marginTop: 12 }}>
                        <div className="field">
                          <label>{cs ? 'Zakladni cena (CZK)' : 'Base price (CZK)'}</label>
                          <input
                            className="input"
                            type="number"
                            step="1"
                            min="0"
                            value={selectedMethod.price}
                            onChange={(e) => updateMethod(selectedMethod.id, { price: safeNum(e.target.value, 0) })}
                          />
                        </div>
                        <div className="field">
                          <label>{cs ? 'Priplatek za kg (CZK/kg)' : 'Surcharge per kg (CZK/kg)'} <ForgeHelpIcon text={getHelpText('shipping_price_per_kg', language)} size={14} /></label>
                          <input
                            className="input"
                            type="number"
                            step="1"
                            min="0"
                            value={selectedMethod.price_per_kg || 0}
                            onChange={(e) => updateMethod(selectedMethod.id, { price_per_kg: safeNum(e.target.value, 0) })}
                          />
                          <div className="help">{cs ? '0 = zadny priplatek za hmotnost' : '0 = no weight surcharge'}</div>
                        </div>
                      </div>
                    )}

                    <div className="grid2" style={{ marginTop: 12 }}>
                      <div className="field">
                        <label>{cs ? 'Doba doruceni MIN (dny)' : 'Delivery days MIN'}</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={selectedMethod.delivery_days_min}
                          onChange={(e) => updateMethod(selectedMethod.id, { delivery_days_min: safeNum(e.target.value, 0) })}
                        />
                      </div>
                      <div className="field">
                        <label>{cs ? 'Doba doruceni MAX (dny)' : 'Delivery days MAX'}</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={selectedMethod.delivery_days_max}
                          onChange={(e) => updateMethod(selectedMethod.id, { delivery_days_max: safeNum(e.target.value, 0) })}
                        />
                      </div>
                    </div>

                    <div className="field" style={{ marginTop: 12 }}>
                      <label>{cs ? 'Popis' : 'Description'}</label>
                      <textarea
                        className="input"
                        rows={2}
                        value={selectedMethod.description}
                        onChange={(e) => updateMethod(selectedMethod.id, { description: e.target.value })}
                        placeholder={cs ? 'Kratky popis pro zakaznika...' : 'Short description for customer...'}
                      />
                    </div>

                    <div className="toggles" style={{ marginTop: 12 }}>
                      <ForgeCheckbox
                        checked={selectedMethod.active}
                        onChange={(e) => updateMethod(selectedMethod.id, { active: e.target.checked })}
                        label={cs ? 'Aktivni' : 'Active'}
                      />
                    </div>

                    {/* Price summary */}
                    <div className="price-summary">
                      <Icon name="Info" size={14} />
                      <span>
                        {selectedMethod.type === 'PICKUP' && (cs ? 'Osobni odber — zdarma' : 'Personal pickup — free')}
                        {selectedMethod.type === 'FIXED' && (
                          cs
                            ? `Zakladni: ${safeNum(selectedMethod.price)} CZK${safeNum(selectedMethod.price_per_kg) > 0 ? ` + ${safeNum(selectedMethod.price_per_kg)} CZK/kg` : ''}`
                            : `Base: ${safeNum(selectedMethod.price)} CZK${safeNum(selectedMethod.price_per_kg) > 0 ? ` + ${safeNum(selectedMethod.price_per_kg)} CZK/kg` : ''}`
                        )}
                        {selectedMethod.type === 'WEIGHT_BASED' && (
                          cs
                            ? `Cena dle hmotnosti — ${(selectedMethod.weight_tiers || []).length} tieru`
                            : `Price by weight — ${(selectedMethod.weight_tiers || []).length} tiers`
                        )}
                        {selectedMethod.type === 'CUSTOM' && (
                          cs
                            ? `Vlastni: ${safeNum(selectedMethod.price)} CZK${safeNum(selectedMethod.price_per_kg) > 0 ? ` + ${safeNum(selectedMethod.price_per_kg)} CZK/kg` : ''}`
                            : `Custom: ${safeNum(selectedMethod.price)} CZK${safeNum(selectedMethod.price_per_kg) > 0 ? ` + ${safeNum(selectedMethod.price_per_kg)} CZK/kg` : ''}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: WEIGHT TIERS */}
              {activeTab === TABS.WEIGHT && selectedMethod.type === 'WEIGHT_BASED' && (
                <div className="admin-card">
                  <div className="card-header">
                    <div>
                      <h2>{cs ? 'Hmotnostni tiery' : 'Weight tiers'} <ForgeHelpIcon text={getHelpText('shipping_weight_tiers', language)} size={14} /></h2>
                      <p className="card-description">
                        {cs
                          ? 'Definuj cenove tiery podle hmotnosti zasilky. Cena se pouzije pro zasilky az do dane hmotnosti.'
                          : 'Define price tiers by parcel weight. Price applies to parcels up to the given weight.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(selectedMethod.weight_tiers || []).length === 0 && (
                        <button className="btn-secondary btn-sm" onClick={seedDefaultWeightTiers}>
                          <Icon name="Zap" size={14} />
                          {cs ? 'Prednastavit' : 'Use defaults'}
                        </button>
                      )}
                      <button className="btn-secondary btn-sm" onClick={addWeightTier}>
                        <Icon name="Plus" size={14} />
                        {cs ? 'Pridat tier' : 'Add tier'}
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {(selectedMethod.weight_tiers || []).length === 0 ? (
                      <div className="empty-state" style={{ padding: 24 }}>
                        <Icon name="Scale" size={36} />
                        <h3>{cs ? 'Zadne tiery' : 'No tiers'}</h3>
                        <p>{cs ? 'Pridej aspon jeden tier nebo pouzij prednastavene.' : 'Add at least one tier or use defaults.'}</p>
                      </div>
                    ) : (
                      <div className="weight-table">
                        <div className="weight-header">
                          <span>{cs ? 'Rozsah' : 'Range'}</span>
                          <span>{cs ? 'Max hmotnost (g)' : 'Max weight (g)'}</span>
                          <span>{cs ? 'Cena (CZK)' : 'Price (CZK)'}</span>
                          <span></span>
                        </div>
                        {(selectedMethod.weight_tiers || []).map((wt, idx) => {
                          const prevMax = idx > 0 ? safeNum(selectedMethod.weight_tiers[idx - 1].max_weight_g) : 0;
                          return (
                            <div key={idx} className="weight-row">
                              <span className="weight-range">
                                {weightLabel(prevMax)} – {weightLabel(wt.max_weight_g)}
                              </span>
                              <input
                                className="input"
                                type="number"
                                min="0"
                                value={wt.max_weight_g}
                                onChange={(e) => updateWeightTier(idx, { max_weight_g: safeNum(e.target.value, 0) })}
                              />
                              <input
                                className="input"
                                type="number"
                                step="1"
                                min="0"
                                value={wt.price}
                                onChange={(e) => updateWeightTier(idx, { price: safeNum(e.target.value, 0) })}
                              />
                              <button className="icon-btn icon-btn-sm" onClick={() => removeWeightTier(idx)} title={cs ? 'Smazat' : 'Remove'}>
                                <Icon name="X" size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Optional price per kg surcharge */}
                    <div className="field" style={{ marginTop: 16, maxWidth: 300 }}>
                      <label>{cs ? 'Dodatkovy priplatek za kg (CZK/kg)' : 'Additional surcharge per kg (CZK/kg)'}</label>
                      <input
                        className="input"
                        type="number"
                        step="1"
                        min="0"
                        value={selectedMethod.price_per_kg || 0}
                        onChange={(e) => updateMethod(selectedMethod.id, { price_per_kg: safeNum(e.target.value, 0) })}
                      />
                      <div className="help">{cs ? '0 = bez dodatecneho priplatku. Pricita se k cene tieru.' : '0 = no additional surcharge. Added on top of tier price.'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ZONE PRICING */}
              {activeTab === TABS.ZONES && (
                <div className="admin-card">
                  <div className="card-header">
                    <div>
                      <h2>{cs ? 'Cenove odlisnosti dle zon' : 'Zone pricing overrides'}</h2>
                      <p className="card-description">
                        {cs
                          ? `Nastav odlisne ceny pro metodu "${selectedMethod.name}" v jednotlivych zonach. Prazdne = pouzije se zakladni cena.`
                          : `Set price overrides for "${selectedMethod.name}" in each zone. Empty = base price is used.`}
                      </p>
                    </div>
                  </div>
                  <div className="card-body">
                    {allZones.filter(z => z.active).length === 0 ? (
                      <div className="empty-state" style={{ padding: 24 }}>
                        <Icon name="Globe" size={36} />
                        <h3>{cs ? 'Zadne aktivni zony' : 'No active zones'}</h3>
                        <p>{cs ? 'Aktivuj zony v panelu vlevo.' : 'Activate zones in the left panel.'}</p>
                      </div>
                    ) : (
                      <div className="zone-pricing-table">
                        <div className="zone-pricing-header">
                          <span>{cs ? 'Zona' : 'Zone'}</span>
                          <span>{cs ? 'Cena (CZK)' : 'Price (CZK)'}</span>
                          {(selectedMethod.type === 'FIXED' || selectedMethod.type === 'CUSTOM') && (
                            <span>{cs ? 'CZK/kg' : 'CZK/kg'}</span>
                          )}
                        </div>
                        {allZones.filter(z => z.active).map((zone) => {
                          const zp = getZonePrice(selectedMethod, zone.id);
                          const isDefault = !zp || zp.price_override == null;
                          return (
                            <div key={zone.id} className="zone-pricing-row">
                              <div className="zone-pricing-name">
                                <span className="zone-badge">{zone.id}</span>
                                <span>{cs ? zone.name : zone.name_en}</span>
                                {isDefault && <span className="zone-default-tag">{cs ? 'zaklad' : 'default'}</span>}
                              </div>
                              <div className="field-inline">
                                <input
                                  className="input"
                                  type="number"
                                  step="1"
                                  min="0"
                                  placeholder={String(safeNum(selectedMethod.price))}
                                  value={zp?.price_override != null ? zp.price_override : ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : safeNum(e.target.value, 0);
                                    setZonePrice(selectedMethod.id, zone.id, { price_override: val });
                                  }}
                                />
                              </div>
                              {(selectedMethod.type === 'FIXED' || selectedMethod.type === 'CUSTOM') && (
                                <div className="field-inline">
                                  <input
                                    className="input"
                                    type="number"
                                    step="1"
                                    min="0"
                                    placeholder={String(safeNum(selectedMethod.price_per_kg))}
                                    value={zp?.price_per_kg_override != null ? zp.price_per_kg_override : ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? null : safeNum(e.target.value, 0);
                                      setZonePrice(selectedMethod.id, zone.id, { price_per_kg_override: val });
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <div className="help" style={{ marginTop: 8 }}>
                          {cs
                            ? 'Prazdne pole = pouzije se zakladni cena metody. Vyplnene pole prepisuji zakladni cenu pro danou zonu.'
                            : 'Empty field = base method price is used. Filled fields override the base price for that zone.'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
          flex-wrap: wrap;
        }

        h1 { margin: 0; font-size: 28px; font-weight: 600; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .subtitle { margin: 4px 0 0 0; color: var(--forge-text-secondary); font-size: 14px; max-width: 760px; }

        .header-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;
        }

        .status-pill {
          display: inline-flex; align-items: center; gap: 6px; border-radius: 999px;
          padding: 6px 10px; font-size: 12px; border: 1px solid var(--forge-border-default); background: var(--forge-bg-surface); color: var(--forge-text-muted);
          font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.08em;
        }
        .status-pill.clean { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .status-pill.dirty { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }

        .btn-primary {
          background: var(--forge-accent-primary); color: #0A0E17; border: 1px solid var(--forge-accent-primary); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.04em; font-size: 13px;
        }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-secondary {
          background: var(--forge-bg-elevated); color: var(--forge-text-primary); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .btn-secondary:hover { background: var(--forge-bg-surface); border-color: var(--forge-accent-primary); }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-sm { padding: 6px 10px; font-size: 12px; }

        .banner {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          border-radius: var(--forge-radius-md); margin: 10px 0 16px 0; font-size: 14px;
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-surface); color: var(--forge-text-secondary);
        }
        .banner.success { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .banner.error { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }

        .shipping-layout {
          display: grid; grid-template-columns: 400px 1fr; gap: 16px; align-items: start;
        }
        @media (max-width: 1100px) { .shipping-layout { grid-template-columns: 1fr; } }

        .shipping-left { display: grid; gap: 14px; }

        .shipping-panel { background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md); overflow: hidden; }

        .panel-header { padding: 12px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); }
        .panel-title { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 4px; }
        .panel-title h2 {
          margin: 0; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); font-family: var(--forge-font-tech);
        }
        .muted { color: var(--forge-text-muted); font-size: 12px; }
        .panel-body { max-height: calc(100vh - 300px); overflow: auto; }
        @media (max-width: 1100px) { .panel-body { max-height: none; } }

        .method-list { display: grid; }
        .method-row {
          padding: 12px; border-bottom: 1px solid var(--forge-border-default); cursor: pointer; background: var(--forge-bg-surface);
          transition: background 120ms ease;
        }
        .method-row:hover { background: var(--forge-bg-elevated); }
        .method-row.active { background: rgba(0,212,170,0.06); border-left: 4px solid var(--forge-accent-primary); padding-left: 8px; }
        .method-row-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .method-name { display: inline-flex; align-items: center; gap: 8px; }
        .method-actions { display: flex; gap: 4px; }
        .method-row-bottom { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; align-items: center; }

        .dot { width: 10px; height: 10px; border-radius: 999px; display: inline-block; border: 2px solid var(--forge-border-default); }
        .dot.on { background: var(--forge-success); border-color: var(--forge-success); }
        .dot.off { background: var(--forge-text-muted); border-color: var(--forge-text-muted); }
        .name-text { font-weight: 700; color: var(--forge-text-primary); }

        .chip {
          border: 1px solid var(--forge-border-default); border-radius: 999px; padding: 4px 8px;
          font-size: 12px; color: var(--forge-text-secondary); background: var(--forge-bg-elevated); display: inline-flex; align-items: center; gap: 4px;
          font-family: var(--forge-font-tech);
        }

        .icon-btn {
          border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); border-radius: var(--forge-radius-md);
          padding: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
          color: var(--forge-text-secondary);
        }
        .icon-btn:hover { background: var(--forge-bg-surface); border-color: var(--forge-accent-primary); }
        .icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .icon-btn-sm { padding: 4px; }

        .empty-state { padding: 18px; text-align: center; color: var(--forge-text-muted); }
        .empty-state h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); font-size: 16px; }
        .empty-state p { margin: 0; font-size: 13px; }

        .shipping-editor { display: grid; gap: 14px; }

        .admin-card { background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md); overflow: hidden; }

        .card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 14px; border-bottom: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated);
        }
        .card-header h2 { margin: 0; font-size: 11px; font-weight: 800; color: var(--forge-text-muted); font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.08em; }
        .card-description { margin: 4px 0 0 0; font-size: 13px; color: var(--forge-text-muted); max-width: 760px; }
        .card-body { padding: 14px; }

        .empty-editor { text-align: center; color: var(--forge-text-muted); }
        .empty-editor h3 { margin: 10px 0 4px 0; color: var(--forge-text-primary); }

        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 640px) { .grid2 { grid-template-columns: 1fr; } }

        .field label {
          display: block; font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); margin-bottom: 6px;
          font-family: var(--forge-font-tech);
        }

        .input {
          width: 100%; border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-md);
          padding: 10px 12px; font-size: 14px; outline: none; background: var(--forge-bg-elevated);
          color: var(--forge-text-primary); box-sizing: border-box;
        }
        .input:focus { border-color: var(--forge-accent-primary); box-shadow: 0 0 0 2px rgba(0,212,170,0.15); }
        .input-inline { max-width: 200px; }
        textarea.input { resize: vertical; }
        .help { font-size: 12px; color: var(--forge-text-muted); margin-top: 6px; }

        .toggles { display: grid; gap: 10px; margin-top: 6px; }

        /* Editor tabs */
        .editor-tabs {
          display: flex; gap: 4px; background: var(--forge-bg-surface); border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md); padding: 4px; overflow-x: auto;
        }
        .editor-tab {
          display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: none;
          background: transparent; color: var(--forge-text-secondary); cursor: pointer; border-radius: var(--forge-radius-sm);
          font-size: 13px; font-weight: 600; white-space: nowrap; transition: all 120ms ease;
        }
        .editor-tab:hover { background: var(--forge-bg-elevated); color: var(--forge-text-primary); }
        .editor-tab.active {
          background: rgba(0,212,170,0.12); color: var(--forge-accent-primary); border: 1px solid rgba(0,212,170,0.25);
        }

        /* Weight tiers table */
        .weight-table { display: grid; gap: 8px; }
        .weight-header {
          display: grid; grid-template-columns: 140px 1fr 1fr 40px; gap: 8px;
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); padding: 0 0 4px 0;
          border-bottom: 1px solid var(--forge-border-default);
          font-family: var(--forge-font-tech);
        }
        .weight-row {
          display: grid; grid-template-columns: 140px 1fr 1fr 40px; gap: 8px; align-items: center;
        }
        .weight-range {
          font-size: 12px; color: var(--forge-text-secondary); font-family: var(--forge-font-tech);
          white-space: nowrap;
        }

        /* Price summary pill */
        .price-summary {
          display: flex; align-items: center; gap: 8px; margin-top: 16px; padding: 10px 14px;
          background: rgba(0,212,170,0.06); border: 1px solid rgba(0,212,170,0.15);
          border-radius: var(--forge-radius-md); font-size: 13px; color: var(--forge-accent-primary);
        }

        /* Free shipping preview */
        .free-shipping-preview {
          display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 10px 14px;
          background: rgba(0,212,170,0.06); border: 1px solid rgba(0,212,170,0.15);
          border-radius: var(--forge-radius-md); font-size: 13px; color: var(--forge-accent-primary);
          font-weight: 600;
        }

        /* Zone list */
        .zone-list { display: grid; gap: 6px; }
        .zone-row {
          padding: 8px 0; border-bottom: 1px solid var(--forge-border-default);
        }
        .zone-row:last-child { border-bottom: none; }
        .zone-info { display: flex; align-items: center; gap: 10px; }
        .zone-name { font-weight: 600; color: var(--forge-text-primary); font-size: 14px; }
        .zone-badge {
          font-family: var(--forge-font-tech); font-size: 10px; font-weight: 800;
          padding: 2px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em;
          background: var(--forge-bg-elevated); border: 1px solid var(--forge-border-default);
          color: var(--forge-text-muted);
        }
        .zone-badge.custom { background: rgba(255,165,0,0.1); border-color: rgba(255,165,0,0.3); color: var(--forge-accent-secondary); }

        /* Zone pricing table */
        .zone-pricing-table { display: grid; gap: 8px; }
        .zone-pricing-header {
          display: grid; grid-template-columns: 1fr 140px 140px; gap: 10px;
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted); padding: 0 0 6px 0;
          border-bottom: 1px solid var(--forge-border-default);
          font-family: var(--forge-font-tech);
        }
        .zone-pricing-row {
          display: grid; grid-template-columns: 1fr 140px 140px; gap: 10px; align-items: center;
          padding: 6px 0;
        }
        .zone-pricing-name { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .zone-default-tag {
          font-size: 10px; color: var(--forge-text-muted); font-family: var(--forge-font-tech);
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .field-inline { max-width: 140px; }

        @media (max-width: 640px) {
          .zone-pricing-header { grid-template-columns: 1fr; }
          .zone-pricing-row { grid-template-columns: 1fr; gap: 6px; }
          .weight-header { grid-template-columns: 1fr 1fr 40px; }
          .weight-row { grid-template-columns: 1fr 1fr 40px; }
          .weight-range { display: none; }
        }
      `}</style>
      <ConfirmDialog />
    </div>
  );
}
