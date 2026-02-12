import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTenantId } from '../../utils/adminTenantStorage';

import {
  // branding + plan
  getBranding,
  getPlanFeatures,

  // widgets
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  duplicateWidget,
  toggleWidgetStatus,

  // domains
  getWidgetDomains,
  addWidgetDomain,
  toggleWidgetDomain,
  deleteWidgetDomain,
  validateDomainInput,
} from '../../utils/adminBrandingWidgetStorage';

import WidgetConfigTab from './components/WidgetConfigTab';
import WidgetEmbedTab from './components/WidgetEmbedTab';
import WidgetDomainsTab from './components/WidgetDomainsTab';
import WidgetSettingsTab from './components/WidgetSettingsTab';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const isValidHex = (val) => /^#([0-9a-fA-F]{6})$/.test(String(val || '').trim());

const toNullableHex = (val) => {
  const v = String(val || '').trim();
  if (!v) return null;
  return isValidHex(v) ? v.toUpperCase() : v;
};

const TABS = [
  { id: 'config', label: 'Konfigurace', icon: 'Settings' },
  { id: 'embed', label: 'Embed kod', icon: 'Code' },
  { id: 'domains', label: 'Domeny', icon: 'Globe' },
  { id: 'settings', label: 'Nastaveni', icon: 'Cog' },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const AdminWidget = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [editor, setEditor] = useState(null);
  const [editorBase, setEditorBase] = useState(null);

  const [domains, setDomains] = useState([]);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [activeTab, setActiveTab] = useState('config');

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('full_calculator');
  const [createError, setCreateError] = useState('');

  const toastTimer = useRef(null);
  const createOverlayRef = useRef(null);

  /* ---- toast ---- */
  const showToast = (msg, kind = 'ok') => {
    setToast({ msg, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  /* ---- data loading ---- */
  const refresh = () => {
    const tenantId = getTenantId();
    const p = getPlanFeatures(tenantId);
    const w = getWidgets(tenantId);

    setPlan(p);
    setWidgets(w);

    const nextSelected =
      selectedId && w.find((x) => x.id === selectedId)
        ? selectedId
        : w[0]?.id ?? null;
    setSelectedId(nextSelected);

    if (nextSelected) {
      const ww = w.find((x) => x.id === nextSelected);
      setEditor(deepClone(ww));
      setEditorBase(deepClone(ww));
      setDomains(getWidgetDomains(getTenantId(), ww.id));
    } else {
      setEditor(null);
      setEditorBase(null);
      setDomains([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    try {
      refresh();
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const w = widgets.find((x) => x.id === selectedId);
    if (!w) return;
    setEditor(deepClone(w));
    setEditorBase(deepClone(w));
    setDomains(getWidgetDomains(getTenantId(), w.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ---- dirty tracking ---- */
  const isDirty = useMemo(() => {
    if (!editor || !editorBase) return false;
    return JSON.stringify(editor) !== JSON.stringify(editorBase);
  }, [editor, editorBase]);

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Scroll containment for create widget modal
  useEffect(() => {
    if (!createOpen) return;
    document.body.style.overflow = 'hidden';
    const el = createOverlayRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); e.stopPropagation(); };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
    };
  }, [createOpen]);

  /* ---- plan limits ---- */
  const maxWidgets = plan?.features?.max_widget_instances ?? 1;
  const canUseWhitelist = plan?.features?.can_use_domain_whitelist ?? true;
  const canCreateMore = widgets.length < maxWidgets;

  /* ---- validation ---- */
  const validateEditor = () => {
    const errors = {};
    if (!editor) return errors;

    if (!editor.name || String(editor.name).trim().length < 2) {
      errors.name = 'Zadej nazev (min. 2 znaky).';
    }

    if (editor.primaryColorOverride && !isValidHex(editor.primaryColorOverride)) {
      errors.primaryColorOverride = 'Barva musi byt ve formatu #RRGGBB.';
    }

    if (editor.widthMode === 'fixed') {
      const v = Number(editor.widthPx);
      if (!Number.isFinite(v) || v <= 0) {
        errors.widthPx = 'Zadej sirku > 0.';
      }
    }

    return errors;
  };

  const errors = useMemo(validateEditor, [editor]);
  const canSave = isDirty && Object.keys(errors).length === 0 && !saving;

  /* ---- CRUD callbacks ---- */

  const selectWidget = (id) => {
    if (id === selectedId) return;
    if (isDirty) {
      const ok = window.confirm('Mas neulozene zmeny. Opravdu chces prepnout widget bez ulozeni?');
      if (!ok) return;
    }
    setSelectedId(id);
    setActiveTab('config');
  };

  const onEditorChange = (patch) => {
    setEditor((prev) => ({ ...prev, ...patch }));
  };

  const onSave = async () => {
    if (!editor) return;
    if (Object.keys(errors).length > 0) {
      showToast('Oprav chyby ve formulari.', 'err');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: String(editor.name || '').trim(),
        status: editor.status,
        type: editor.type,
        themeMode: editor.themeMode,
        primaryColorOverride: toNullableHex(editor.primaryColorOverride),
        widthMode: editor.widthMode,
        widthPx: editor.widthMode === 'fixed' ? Number(editor.widthPx || 0) : null,
        localeDefault: editor.localeDefault || 'cs',
        configProfileId: editor.configProfileId ?? null,
      };

      updateWidget(getTenantId(), editor.id, payload);
      showToast('Ulozeno');
      refresh();
    } catch (e) {
      console.error(e);
      showToast('Ulozeni se nezdarilo.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const onResetEditor = () => {
    if (!editorBase) return;
    const ok = window.confirm('Vratit neulozene zmeny do posledniho ulozeneho stavu?');
    if (!ok) return;
    setEditor(deepClone(editorBase));
  };

  const onCreate = () => {
    setCreateName('');
    setCreateType('full_calculator');
    setCreateError('');
    setCreateOpen(true);
  };

  const confirmCreate = () => {
    try {
      const name = String(createName || '').trim();
      if (name.length < 2) {
        setCreateError('Zadej nazev (min. 2 znaky).');
        return;
      }
      if (!canCreateMore) {
        showToast(`Limit tarifu: max. ${maxWidgets} widget(y).`, 'err');
        return;
      }

      const widget = createWidget(getTenantId(), {
        name,
        type: createType,
      });

      setCreateOpen(false);
      showToast('Widget vytvoren');

      const w = getWidgets(getTenantId());
      setWidgets(w);
      setSelectedId(widget.id);
      setEditor(deepClone(widget));
      setEditorBase(deepClone(widget));
      setDomains(getWidgetDomains(getTenantId(), widget.id));
      setActiveTab('config');
    } catch (e) {
      console.error(e);
      showToast('Nelze vytvorit widget (limit tarifu nebo chyba).', 'err');
    }
  };

  const onDuplicate = (id) => {
    try {
      if (!canCreateMore) {
        showToast(`Limit tarifu: max. ${maxWidgets} widget(y).`, 'err');
        return;
      }
      const dupe = duplicateWidget(getTenantId(), id);
      showToast('Zduplikovano');
      const w = getWidgets(getTenantId());
      setWidgets(w);
      setSelectedId(dupe.id);
    } catch (e) {
      console.error(e);
      showToast('Duplikace se nezdarila.', 'err');
    }
  };

  const onToggleEnabled = (id) => {
    try {
      toggleWidgetStatus(getTenantId(), id);
      showToast('Zmeneno');
      refresh();
    } catch (e) {
      console.error(e);
      showToast('Zmena stavu se nezdarila.', 'err');
    }
  };

  const onDelete = (id) => {
    try {
      deleteWidget(getTenantId(), id);
      showToast('Smazano');
      refresh();
    } catch (e) {
      console.error(e);
      showToast('Smazani se nezdarilo.', 'err');
    }
  };

  const onCopyEmbed = async (widget) => {
    try {
      const origin = window.location.origin;
      const code =
        `<!-- ModelPricer Widget: ${widget.name || widget.publicId} -->\n` +
        `<iframe\n  src="${origin}/w/${widget.publicId}"\n  style="width: 100%; border: none; min-height: 600px;"\n  title="3D Print Calculator"\n  allow="clipboard-write"\n></iframe>`;
      await navigator.clipboard.writeText(code);
      showToast('Embed kod zkopirovany');
    } catch {
      showToast('Nelze kopirovat do schranky.', 'err');
    }
  };

  /* ---- domain callbacks ---- */

  const onAddDomain = (domainInput, allowSubdomains) => {
    if (!editor) return;

    const candidate = String(domainInput || '').trim();
    const res = validateDomainInput(candidate);

    if (!res.ok) {
      throw new Error(res.error || 'Neplatna domena');
    }

    addWidgetDomain(getTenantId(), editor.id, res.host || candidate, allowSubdomains);
    setDomains(getWidgetDomains(getTenantId(), editor.id));
    showToast('Domena pridana');
  };

  const onToggleDomain = (domainId, enabled) => {
    try {
      toggleWidgetDomain(getTenantId(), editor.id, domainId, enabled);
      setDomains(getWidgetDomains(getTenantId(), editor.id));
    } catch (e) {
      console.error(e);
      showToast('Zmena domeny se nezdarila.', 'err');
    }
  };

  const onDeleteDomain = (domainId) => {
    const d = domains.find((x) => x.id === domainId);
    const ok = window.confirm(`Smazat domenu ${d?.domain || ''}?`);
    if (!ok) return;

    try {
      deleteWidgetDomain(getTenantId(), editor.id, domainId);
      setDomains(getWidgetDomains(getTenantId(), editor.id));
      showToast('Domena smazana');
    } catch (e) {
      console.error(e);
      showToast('Smazani domeny se nezdarilo.', 'err');
    }
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="aw-page">
        <div className="aw-loading">Nacitam...</div>
      </div>
    );
  }

  const selectedWidget = widgets.find((w) => w.id === selectedId) || null;

  return (
    <div className="aw-page">
      {/* Top bar */}
      <div className="aw-topbar">
        <div>
          <h1 className="aw-heading">Widget Code</h1>
          <p className="aw-subtitle">
            Sprava widget instanci, embed kod a whitelist domen
          </p>
        </div>
        <div className="aw-topbar-actions">
          <div className="aw-plan-info">
            <span className="aw-plan-count">
              {widgets.length}/{maxWidgets} widgetu
            </span>
          </div>
          <button className="aw-btn aw-btn-primary" onClick={onCreate} disabled={!canCreateMore}>
            <Icon name="Plus" size={18} />
            Vytvorit widget
          </button>
        </div>
      </div>

      {/* Dirty banner */}
      {isDirty ? (
        <div className="aw-dirty-banner">
          <div className="aw-dirty-left">
            <Icon name="AlertTriangle" size={18} />
            <span>Neulozene zmeny v konfiguraci widgetu.</span>
          </div>
          <div className="aw-dirty-actions">
            <button className="aw-btn aw-btn-secondary" onClick={onResetEditor}>
              Zahodit
            </button>
            <button className="aw-btn aw-btn-primary" onClick={onSave} disabled={!canSave}>
              <Icon name="Save" size={16} />
              Ulozit
            </button>
          </div>
        </div>
      ) : null}

      {/* 2-column layout */}
      <div className="aw-layout">
        {/* LEFT: Widget cards */}
        <div className="aw-left">
          {!canCreateMore ? (
            <div className="aw-limit-box">
              <Icon name="Lock" size={16} />
              <div>
                <strong>Limit tarifu</strong>
                <div className="aw-muted">Max. {maxWidgets} widget(y).</div>
              </div>
            </div>
          ) : null}

          <div className="aw-card-list">
            {widgets.map((w) => {
              const isActive = w.status !== 'disabled';
              const isSelected = w.id === selectedId;
              const barColor = isActive
                ? (w.primaryColorOverride || '#00D4AA')
                : '#4a5568';

              return (
                <div
                  key={w.id}
                  className={`aw-widget-card ${isSelected ? 'aw-card-selected' : ''}`}
                  onClick={() => selectWidget(w.id)}
                >
                  {/* Color bar */}
                  <div
                    className="aw-card-bar"
                    style={{ backgroundColor: barColor }}
                  />

                  <div className="aw-card-body">
                    <div className="aw-card-top">
                      <div className="aw-card-name">{w.name}</div>
                      <span
                        className={`aw-badge ${isActive ? 'aw-badge-active' : 'aw-badge-inactive'}`}
                      >
                        {isActive ? 'Aktivni' : 'Neaktivni'}
                      </span>
                    </div>

                    <div className="aw-card-id">{w.publicId}</div>

                    <div
                      className="aw-card-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="aw-icon-btn"
                        title="Otevrit Builder"
                        onClick={() => navigate(`/admin/widget/builder/${w.id}`)}
                      >
                        <Icon name="Palette" size={15} />
                      </button>
                      <button
                        className="aw-icon-btn"
                        title="Kopirovat embed"
                        onClick={() => onCopyEmbed(w)}
                      >
                        <Icon name="Copy" size={15} />
                      </button>
                      <button
                        className="aw-icon-btn"
                        title="Duplikovat"
                        onClick={() => onDuplicate(w.id)}
                        disabled={!canCreateMore}
                      >
                        <Icon name="CopyPlus" size={15} />
                      </button>
                      <button
                        className="aw-icon-btn aw-icon-btn-danger"
                        title="Smazat"
                        onClick={() => onDelete(w.id)}
                      >
                        <Icon name="Trash2" size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {widgets.length === 0 ? (
              <div className="aw-empty-state">
                <Icon name="Box" size={24} />
                <div>
                  <div style={{ fontWeight: 700 }}>Zatim zadny widget</div>
                  <div className="aw-muted">
                    Vytvorte si prvni widget a zkopirujte embed kod.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT: Detail with tabs */}
        <div className="aw-right">
          {!selectedWidget ? (
            <div className="aw-empty-detail">
              <Icon name="MousePointerClick" size={24} />
              <span>Vyberte widget vlevo</span>
            </div>
          ) : (
            <>
              {/* Tab bar */}
              <div className="aw-tabs" role="tablist" aria-label="Widget konfigurace">
                {TABS.map((tab, idx) => (
                  <button
                    key={tab.id}
                    role="tab"
                    id={`aw-tab-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    aria-controls={`aw-tabpanel-${tab.id}`}
                    className={`aw-tab ${activeTab === tab.id ? 'aw-tab-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        const next = TABS[(idx + 1) % TABS.length];
                        setActiveTab(next.id);
                        document.getElementById(`aw-tab-${next.id}`)?.focus();
                      } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const prev = TABS[(idx - 1 + TABS.length) % TABS.length];
                        setActiveTab(prev.id);
                        document.getElementById(`aw-tab-${prev.id}`)?.focus();
                      }
                    }}
                  >
                    <Icon name={tab.icon} size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Save bar (visible on config tab) */}
              {activeTab === 'config' ? (
                <div className="aw-save-bar">
                  <div className="aw-save-title">
                    <Icon name="FileEdit" size={18} />
                    {editor?.name || selectedWidget.name}
                  </div>
                  <div className="aw-save-actions">
                    <button
                      className="aw-btn aw-btn-secondary"
                      onClick={onResetEditor}
                      disabled={!isDirty}
                    >
                      Reset
                    </button>
                    <button
                      className="aw-btn aw-btn-primary"
                      onClick={onSave}
                      disabled={!canSave}
                    >
                      <Icon name="Save" size={16} />
                      Ulozit
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Tab content */}
              <div className="aw-tab-content" role="tabpanel" id={`aw-tabpanel-${activeTab}`} aria-labelledby={`aw-tab-${activeTab}`}>
                {activeTab === 'config' ? (
                  <WidgetConfigTab
                    editor={editor}
                    errors={errors}
                    onEditorChange={onEditorChange}
                  />
                ) : null}

                {activeTab === 'embed' ? (
                  <WidgetEmbedTab widget={selectedWidget} />
                ) : null}

                {activeTab === 'domains' ? (
                  <WidgetDomainsTab
                    domains={domains}
                    canUseWhitelist={canUseWhitelist}
                    onAddDomain={onAddDomain}
                    onToggleDomain={onToggleDomain}
                    onDeleteDomain={onDeleteDomain}
                  />
                ) : null}

                {activeTab === 'settings' ? (
                  <WidgetSettingsTab
                    widget={selectedWidget}
                    canCreateMore={canCreateMore}
                    onToggleEnabled={onToggleEnabled}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onNavigateBuilder={(id) => navigate(`/admin/widget/builder/${id}`)}
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div className={`aw-toast ${toast.kind === 'err' ? 'aw-toast-err' : 'aw-toast-ok'}`}>
          {toast.kind === 'err' ? (
            <Icon name="XCircle" size={18} />
          ) : (
            <Icon name="CheckCircle" size={18} />
          )}
          <span>{toast.msg}</span>
        </div>
      ) : null}

      {/* Create modal */}
      {createOpen ? (
        <div className="aw-overlay" ref={createOverlayRef} onClick={() => setCreateOpen(false)}>
          <div className="aw-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aw-modal-header">
              <div className="aw-modal-title">Vytvorit novy widget</div>
              <button className="aw-icon-btn" onClick={() => setCreateOpen(false)}>
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="aw-modal-body">
              <div className="aw-form-row">
                <label className="aw-label">Nazev</label>
                <input
                  className={`aw-input${createError ? ' aw-input-error' : ''}`}
                  value={createName}
                  onChange={(e) => { const v = e.target.value; setCreateName(v); if (v.trim().length >= 2) setCreateError(''); }}
                  placeholder="Napr. Homepage"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmCreate();
                  }}
                  autoFocus
                />
                {createError && (
                  <div role="alert" style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>
                    {createError}
                  </div>
                )}
              </div>

              <div className="aw-form-row">
                <label className="aw-label">Typ</label>
                <select
                  className="aw-input"
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value)}
                >
                  <option value="full_calculator">Full Calculator</option>
                  <option value="price_only">Price Only</option>
                </select>
              </div>
            </div>

            <div className="aw-modal-footer">
              <button className="aw-btn aw-btn-secondary" onClick={() => setCreateOpen(false)}>
                Zrusit
              </button>
              <button className="aw-btn aw-btn-primary" onClick={confirmCreate}>
                <Icon name="Plus" size={16} />
                Vytvorit
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        /* ============================================================= */
        /*  AdminWidget — aw-* scoped styles — FORGE Dark Theme          */
        /* ============================================================= */

        .aw-page {
          padding: 20px;
        }

        .aw-loading {
          padding: 40px;
          text-align: center;
          color: var(--forge-text-muted);
          font-family: var(--forge-font-tech);
        }

        /* ---- Top bar ---- */
        .aw-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .aw-heading {
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-tech);
          letter-spacing: 0.02em;
        }

        .aw-subtitle {
          color: var(--forge-text-muted);
          margin: 4px 0 0 0;
          font-size: 14px;
        }

        .aw-topbar-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .aw-plan-info {
          text-align: right;
        }

        .aw-plan-count {
          font-size: 13px;
          color: var(--forge-text-muted);
          font-weight: 600;
          font-family: var(--forge-font-tech);
        }

        /* ---- Buttons ---- */
        .aw-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--forge-radius-md);
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          border: 1px solid transparent;
          transition: all 0.15s;
          font-family: var(--forge-font-tech);
          letter-spacing: 0.02em;
        }

        .aw-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .aw-btn-primary {
          background: var(--forge-accent-primary);
          color: #0a0f1a;
        }
        .aw-btn-primary:hover:not(:disabled) {
          background: var(--forge-accent-hover, #00eabb);
          box-shadow: 0 0 12px rgba(0,212,170,0.3);
        }

        .aw-btn-secondary {
          background: var(--forge-bg-elevated);
          color: var(--forge-text-secondary);
          border-color: var(--forge-border-default);
        }
        .aw-btn-secondary:hover:not(:disabled) {
          background: var(--forge-bg-surface);
          color: var(--forge-text-primary);
        }

        .aw-btn-danger {
          background: rgba(239,68,68,0.15);
          color: #f87171;
          border-color: rgba(239,68,68,0.3);
        }
        .aw-btn-danger:hover:not(:disabled) {
          background: rgba(239,68,68,0.25);
        }

        .aw-btn-success {
          background: rgba(0,212,170,0.15);
          color: var(--forge-accent-primary);
          border-color: rgba(0,212,170,0.3);
        }

        .aw-btn-large {
          padding: 12px 20px;
          font-size: 14px;
        }

        /* ---- Icon buttons ---- */
        .aw-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
          cursor: pointer;
          transition: all 0.15s;
          color: var(--forge-text-secondary);
        }
        .aw-icon-btn:hover {
          background: var(--forge-bg-surface);
          color: var(--forge-text-primary);
          border-color: var(--forge-text-muted);
        }
        .aw-icon-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .aw-icon-btn-danger {
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
        }
        .aw-icon-btn-danger:hover {
          background: rgba(239,68,68,0.15);
        }

        /* ---- Dirty banner ---- */
        .aw-dirty-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 14px;
          border: 1px solid rgba(234,179,8,0.3);
          background: rgba(234,179,8,0.08);
          border-radius: var(--forge-radius-md);
          margin-bottom: 14px;
        }

        .aw-dirty-left {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fbbf24;
          font-weight: 600;
          font-size: 13px;
          font-family: var(--forge-font-tech);
        }

        .aw-dirty-actions {
          display: flex;
          gap: 8px;
        }

        /* ---- 2-column layout ---- */
        .aw-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 16px;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .aw-layout {
            grid-template-columns: 1fr;
          }
        }

        /* ---- Left column ---- */
        .aw-left {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .aw-limit-box {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px;
          border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface);
          font-size: 13px;
          color: var(--forge-text-secondary);
        }

        .aw-card-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* ---- Widget card ---- */
        .aw-widget-card {
          display: flex;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.15s;
          background: var(--forge-bg-surface);
        }
        .aw-widget-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          border-color: var(--forge-text-muted);
        }

        .aw-card-selected {
          border-color: var(--forge-accent-primary);
          box-shadow: 0 4px 16px rgba(0,212,170,0.15);
        }

        .aw-card-bar {
          width: 4px;
          flex-shrink: 0;
        }

        .aw-card-body {
          flex: 1;
          padding: 10px 12px;
          min-width: 0;
        }

        .aw-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .aw-card-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--forge-text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aw-badge {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: var(--forge-font-tech);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .aw-badge-active {
          background: rgba(0,212,170,0.15);
          color: var(--forge-accent-primary);
        }

        .aw-badge-inactive {
          background: rgba(255,255,255,0.05);
          color: var(--forge-text-muted);
        }

        .aw-card-id {
          font-family: var(--forge-font-mono);
          font-size: 11px;
          color: var(--forge-text-muted);
          margin-bottom: 6px;
        }

        .aw-card-actions {
          display: flex;
          gap: 4px;
        }

        /* ---- Right column ---- */
        .aw-right {
          background: var(--forge-bg-surface);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          overflow: hidden;
          min-height: 400px;
        }

        .aw-empty-detail {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 60px 20px;
          color: var(--forge-text-muted);
          font-size: 15px;
        }

        /* ---- Tabs ---- */
        .aw-tabs {
          display: flex;
          border-bottom: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
          overflow-x: auto;
        }

        .aw-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 12px 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--forge-text-muted);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
          flex: 1 1 0%;
          justify-content: center;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: var(--forge-font-tech);
          letter-spacing: 0.04em;
        }

        .aw-tab:hover {
          color: var(--forge-text-secondary);
          background: rgba(255,255,255,0.03);
        }

        .aw-tab-active {
          color: var(--forge-accent-primary);
          border-bottom-color: var(--forge-accent-primary);
        }
        .aw-tab-active:hover {
          color: var(--forge-accent-primary);
          background: transparent;
        }

        /* ---- Save bar ---- */
        .aw-save-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
        }

        .aw-save-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 14px;
          color: var(--forge-text-primary);
        }

        .aw-save-actions {
          display: flex;
          gap: 8px;
        }

        /* ---- Tab content ---- */
        .aw-tab-content {
          padding: 16px;
        }

        /* ---- Form elements ---- */
        .aw-form-row {
          margin-bottom: 14px;
        }

        .aw-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 6px;
          color: var(--forge-text-secondary);
          font-family: var(--forge-font-tech);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .aw-input {
          width: 100%;
          padding: 9px 12px;
          border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          outline: none;
          font-size: 13px;
          transition: all 0.15s;
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
          box-sizing: border-box;
        }

        .aw-input:focus {
          border-color: var(--forge-accent-primary);
          box-shadow: 0 0 0 3px rgba(0,212,170,0.15);
        }

        .aw-input-error {
          border-color: #f87171;
          box-shadow: 0 0 0 3px rgba(248,113,113,0.15);
        }

        .aw-input:disabled {
          background: var(--forge-bg-void);
          color: var(--forge-text-muted);
          cursor: not-allowed;
        }

        .aw-color-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .aw-color-picker {
          width: 40px;
          height: 38px;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          padding: 2px;
          cursor: pointer;
          flex-shrink: 0;
          background: var(--forge-bg-elevated);
        }

        .aw-inline-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .aw-error-text {
          color: #f87171;
          font-size: 12px;
          margin-top: 4px;
        }

        .aw-muted {
          color: var(--forge-text-muted);
          font-size: 12px;
        }

        /* ---- Config tab ---- */
        .aw-config-tab {
          max-width: 520px;
        }

        /* ---- Embed tab ---- */
        .aw-embed-tab {}

        .aw-embed-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .aw-embed-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--forge-text-primary);
          margin-bottom: 2px;
          font-family: var(--forge-font-tech);
        }

        .aw-code-area {
          width: 100%;
          min-height: 200px;
          border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          padding: 12px;
          font-family: var(--forge-font-mono);
          font-size: 12px;
          line-height: 1.6;
          background: var(--forge-bg-void);
          color: var(--forge-accent-primary);
          white-space: pre;
          resize: vertical;
          box-sizing: border-box;
        }

        .aw-embed-instructions {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          margin-top: 12px;
          padding: 10px;
          background: rgba(0,212,170,0.06);
          border: 1px solid rgba(0,212,170,0.2);
          border-radius: var(--forge-radius-md);
          font-size: 12px;
          color: var(--forge-text-secondary);
          line-height: 1.5;
        }

        /* ---- Domains tab ---- */
        .aw-domains-tab {}

        .aw-domain-add-form {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .aw-domain-add-form .aw-input {
          flex: 1;
          min-width: 160px;
        }

        .aw-check-label {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          font-size: 12px;
          color: var(--forge-text-secondary);
          white-space: nowrap;
          cursor: pointer;
        }

        .aw-domain-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 12px;
        }

        .aw-domain-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          padding: 10px 12px;
          background: var(--forge-bg-elevated);
        }

        .aw-domain-info {}

        .aw-domain-name {
          font-weight: 700;
          font-size: 13px;
          color: var(--forge-text-primary);
        }

        .aw-domain-chip {
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
          background: rgba(0,212,170,0.12);
          color: var(--forge-accent-primary);
          font-family: var(--forge-font-mono);
        }

        .aw-domain-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .aw-empty-domains {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 14px;
          border: 1px dashed var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          color: var(--forge-text-muted);
          font-size: 13px;
        }

        /* ---- Toggle ---- */
        .aw-toggle {
          position: relative;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
        .aw-toggle input {
          display: none;
        }
        .aw-toggle span {
          width: 42px;
          height: 22px;
          border-radius: 999px;
          background: var(--forge-border-default);
          position: relative;
          transition: background 0.2s;
        }
        .aw-toggle span::after {
          content: '';
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: var(--forge-text-muted);
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.2s;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }
        .aw-toggle input:checked + span {
          background: var(--forge-accent-primary);
        }
        .aw-toggle input:checked + span::after {
          transform: translateX(20px);
          background: #0a0f1a;
        }

        .aw-toggle-large span {
          width: 48px;
          height: 26px;
        }
        .aw-toggle-large span::after {
          width: 20px;
          height: 20px;
        }
        .aw-toggle-large input:checked + span::after {
          transform: translateX(22px);
        }

        /* ---- Settings tab ---- */
        .aw-settings-tab {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .aw-settings-section {
          padding: 16px 0;
          border-bottom: 1px solid var(--forge-border-default);
        }
        .aw-settings-section:last-child {
          border-bottom: none;
        }

        .aw-settings-danger {
          margin-top: 8px;
          padding: 16px;
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--forge-radius-md);
          background: rgba(239,68,68,0.06);
        }

        .aw-settings-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 8px;
        }

        .aw-settings-label {
          font-weight: 700;
          font-size: 14px;
          color: var(--forge-text-primary);
          margin-bottom: 4px;
        }

        .aw-status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--forge-font-tech);
        }

        .aw-status-active { color: var(--forge-accent-primary); }
        .aw-status-disabled { color: var(--forge-text-muted); }

        .aw-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .aw-dot-green {
          background: var(--forge-accent-primary);
          box-shadow: 0 0 6px rgba(0,212,170,0.4);
        }
        .aw-dot-grey { background: var(--forge-text-muted); }

        .aw-delete-confirm {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* ---- Empty state ---- */
        .aw-empty-state {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 20px 16px;
          border: 1px dashed var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          color: var(--forge-text-muted);
        }

        /* ---- Toast ---- */
        .aw-toast {
          position: fixed;
          right: 18px;
          bottom: 18px;
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 10px 14px;
          border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          z-index: 9999;
          font-weight: 600;
          font-size: 13px;
          color: var(--forge-text-primary);
        }
        .aw-toast-ok { border-color: rgba(0,212,170,0.4); color: var(--forge-accent-primary); }
        .aw-toast-err { border-color: rgba(239,68,68,0.4); color: #f87171; }

        /* ---- Modal ---- */
        .aw-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          padding: 16px;
          backdrop-filter: blur(4px);
        }

        .aw-modal {
          width: 480px;
          max-width: 100%;
          background: var(--forge-bg-surface);
          border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .aw-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid var(--forge-border-default);
        }

        .aw-modal-title {
          font-weight: 800;
          font-size: 15px;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-tech);
        }

        .aw-modal-body {
          padding: 16px;
        }

        .aw-modal-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--forge-border-default);
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        /* ---- Responsive ---- */
        @media (max-width: 1024px) {
          .aw-topbar {
            flex-direction: column;
          }
          .aw-topbar-actions {
            width: 100%;
            justify-content: flex-end;
          }
          .aw-tab {
            padding: 10px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 640px) {
          .aw-page { padding: 12px; }
          .aw-card-actions { flex-wrap: wrap; }
          .aw-domain-add-form { flex-direction: column; }
          .aw-domain-add-form .aw-input { min-width: 0; }
          .aw-delete-confirm { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default AdminWidget;
