import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { debug } from '../../lib/debug';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
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
import WidgetIntegrationTab from './components/WidgetIntegrationTab';
import WidgetPreviewPanel from './components/WidgetPreviewPanel';
import ForgeHelpIcon from '../../components/ui/forge/ForgeHelpIcon';
import { getHelpText, getLearnMore } from './helpTexts';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// Sanitize a string for use inside an HTML comment — prevents comment breakout via --> sequences.
const safeComment = (s) => String(s || '').replace(/-{2,}/g, '-').replace(/>/g, '');

const isValidHex = (val) => /^#([0-9a-fA-F]{6})$/.test(String(val || '').trim());

const toNullableHex = (val) => {
  const v = String(val || '').trim();
  if (!v) return null;
  return isValidHex(v) ? v.toUpperCase() : v;
};

const TABS = [
  { id: 'config', label: 'Konfigurace', icon: 'Settings' },
  { id: 'embed', label: 'Embed kod', icon: 'Code' },
  { id: 'integration', label: 'Integrace', icon: 'Puzzle' },
  { id: 'domains', label: 'Domeny', icon: 'Globe' },
  { id: 'settings', label: 'Nastaveni', icon: 'Cog' },
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const AdminWidget = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { copyToClipboard: copyText } = useCopyToClipboard();
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();

  const [loading, setLoading] = useState(true);

  const [plan, setPlan] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [editor, setEditor] = useState(null);
  const [editorBase, setEditorBase] = useState(null);

  const [domains, setDomains] = useState([]);

  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('config');

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('full_calculator');
  const [createError, setCreateError] = useState('');

  const createOverlayRef = useRef(null);
  const modalRef = useRef(null);

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

  // Modal focus trap + Escape handler
  useEffect(() => {
    if (!createOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCreateOpen(false);
        return;
      }

      if (e.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusable = modal.querySelectorAll(
          'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the first input when modal opens
    const timer = setTimeout(() => {
      const modal = modalRef.current;
      if (modal) {
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
      }
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [createOpen]);

  // Ctrl+S / Cmd+S keyboard shortcut for saving
  const onSaveRef = useRef(null);
  const canSaveRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (canSaveRef.current && onSaveRef.current) {
          onSaveRef.current();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ---- plan limits ---- */
  const maxWidgets = plan?.features?.max_widget_instances ?? 1;
  const canUseWhitelist = plan?.features?.can_use_domain_whitelist ?? true;
  const canCreateMore = widgets.length < maxWidgets;

  /* ---- validation ---- */
  const validateEditor = () => {
    const errors = {};
    if (!editor) return errors;

    if (!editor.name || String(editor.name).trim().length < 2) {
      errors.name = t('admin.widget.page.nameValidation', 'Enter a name (min. 2 characters).');
    }

    if (editor.primaryColorOverride && !isValidHex(editor.primaryColorOverride)) {
      errors.primaryColorOverride = t('admin.widget.page.colorValidation', 'Color must be in #RRGGBB format.');
    }

    if (editor.widthMode === 'fixed') {
      const v = Number(editor.widthPx);
      if (!Number.isFinite(v) || v <= 0) {
        errors.widthPx = t('admin.widget.page.widthValidation', 'Enter width > 0.');
      }
    }

    if ((editor.heightMode || 'auto') === 'fixed') {
      const v = Number(editor.heightPx);
      if (!Number.isFinite(v) || v <= 0) {
        errors.heightPx = t('admin.widget.page.heightValidation', 'Enter height > 0.');
      }
    }

    return errors;
  };

  const errors = useMemo(validateEditor, [editor]);
  const canSave = isDirty && Object.keys(errors).length === 0 && !saving;

  // Keep refs in sync for Ctrl+S handler
  canSaveRef.current = canSave;

  /* ---- CRUD callbacks ---- */

  const selectWidget = async (id) => {
    if (id === selectedId) return;
    if (isDirty) {
      const ok = await confirm({
        title: t('admin.widget.page.unsavedTitle', 'Unsaved changes'),
        message: t('admin.widget.page.unsavedMessage', 'You have unsaved changes. Really switch widget without saving?'),
      });
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
      showError(t('admin.widget.page.formError', 'Fix form errors.'));
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
        heightMode: editor.heightMode || 'auto',
        heightPx: (editor.heightMode || 'auto') === 'fixed' ? Number(editor.heightPx || 0) : null,
        borderRadius: typeof editor.borderRadius === 'number' ? editor.borderRadius : 8,
        showSections: editor.showSections || { upload: true, materials: true, pricingBreakdown: true },
        localeDefault: editor.localeDefault || 'cs',
        configProfileId: editor.configProfileId ?? null,
      };

      updateWidget(getTenantId(), editor.id, payload);
      showSuccess(t('admin.widget.page.saveSuccess', 'Saved'));
      refresh();
    } catch (e) {
      debug('[AdminWidget] Save widget failed', e);
      showError(t('admin.widget.page.saveError', 'Save failed.'));
    } finally {
      setSaving(false);
    }
  };

  // Keep onSave ref in sync for Ctrl+S handler
  onSaveRef.current = onSave;

  const onResetEditor = async () => {
    if (!editorBase) return;
    const ok = await confirm({
      title: t('admin.widget.page.discardTitle', 'Discard changes'),
      message: t('admin.widget.page.discardMessage', 'Revert unsaved changes to last saved state?'),
    });
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
        setCreateError(t('admin.widget.page.nameValidation', 'Enter a name (min. 2 characters).'));
        return;
      }
      if (!canCreateMore) {
        showError(t('admin.widget.page.planLimitError', 'Plan limit: max. {max} widget(s).').replace('{max}', maxWidgets));
        return;
      }

      const widget = createWidget(getTenantId(), {
        name,
        type: createType,
      });

      setCreateOpen(false);
      showSuccess(t('admin.widget.page.createSuccess', 'Widget created'));

      const w = getWidgets(getTenantId());
      setWidgets(w);
      setSelectedId(widget.id);
      setEditor(deepClone(widget));
      setEditorBase(deepClone(widget));
      setDomains(getWidgetDomains(getTenantId(), widget.id));
      setActiveTab('config');
    } catch (e) {
      debug('[AdminWidget] Create widget failed', e);
      showError(t('admin.widget.page.createError', 'Cannot create widget (plan limit or error).'));
    }
  };

  const onDuplicate = (id) => {
    try {
      if (!canCreateMore) {
        showError(t('admin.widget.page.planLimitError', 'Plan limit: max. {max} widget(s).').replace('{max}', maxWidgets));
        return;
      }
      const dupe = duplicateWidget(getTenantId(), id);
      showSuccess(t('admin.widget.page.duplicateSuccess', 'Duplicated'));
      const w = getWidgets(getTenantId());
      setWidgets(w);
      setSelectedId(dupe.id);
    } catch (e) {
      debug('[AdminWidget] Duplicate widget failed', e);
      showError(t('admin.widget.page.duplicateError', 'Duplication failed.'));
    }
  };

  const onToggleEnabled = (id) => {
    try {
      toggleWidgetStatus(getTenantId(), id);
      showSuccess(t('admin.widget.page.toggleSuccess', 'Changed'));
      refresh();
    } catch (e) {
      debug('[AdminWidget] Toggle widget status failed', e);
      showError(t('admin.widget.page.toggleError', 'Status change failed.'));
    }
  };

  const onDelete = (id) => {
    try {
      deleteWidget(getTenantId(), id);
      showSuccess(t('admin.widget.page.deleteSuccess', 'Deleted'));
      refresh();
    } catch (e) {
      debug('[AdminWidget] Delete widget failed', e);
      showError(t('admin.widget.page.deleteError', 'Delete failed.'));
    }
  };

  const onCopyEmbed = async (widget) => {
    const origin = window.location.origin;
    // Use the widget.js script-tag pattern so auto-resize, Shopify integration
    // and event callbacks work correctly. A raw <iframe> would bypass widget.js.
    const code =
      `<!-- ModelPricer Widget: ${safeComment(widget.name || widget.publicId)} -->\n` +
      `<div data-modelpricer-widget="${widget.publicId}"></div>\n` +
      `<script src="${origin}/widget.js" async></script>`;
    const ok = await copyText(code);
    if (ok) {
      showSuccess(t('admin.widget.page.copySuccess', 'Embed code copied'));
    } else {
      showError(t('admin.widget.page.copyError', 'Cannot copy to clipboard.'));
    }
  };

  /* ---- domain callbacks ---- */

  const onAddDomain = (domainInput, allowSubdomains) => {
    if (!editor) return;

    const candidate = String(domainInput || '').trim();
    const res = validateDomainInput(candidate);

    if (!res.ok) {
      throw new Error(res.error || t('admin.widget.page.domainInvalid', 'Invalid domain'));
    }

    addWidgetDomain(getTenantId(), editor.id, res.host || candidate, allowSubdomains);
    setDomains(getWidgetDomains(getTenantId(), editor.id));
    showSuccess(t('admin.widget.page.domainAdded', 'Domain added'));
  };

  const onToggleDomain = (domainId, enabled) => {
    try {
      toggleWidgetDomain(getTenantId(), editor.id, domainId, enabled);
      setDomains(getWidgetDomains(getTenantId(), editor.id));
    } catch (e) {
      debug('[AdminWidget] Toggle domain failed', e);
      showError(t('admin.widget.page.domainToggleError', 'Domain toggle failed.'));
    }
  };

  const onDeleteDomain = async (domainId) => {
    const d = domains.find((x) => x.id === domainId);
    const ok = await confirm({
      title: t('admin.widget.page.deleteDomainTitle', 'Delete domain'),
      message: `${t('admin.widget.page.deleteDomainTitle', 'Delete domain')} ${d?.domain || ''}?`,
    });
    if (!ok) return;

    try {
      deleteWidgetDomain(getTenantId(), editor.id, domainId);
      setDomains(getWidgetDomains(getTenantId(), editor.id));
      showSuccess(t('admin.widget.page.domainDeleted', 'Domain deleted'));
    } catch (e) {
      debug('[AdminWidget] Delete domain failed', e);
      showError(t('admin.widget.page.domainDeleteError', 'Domain delete failed.'));
    }
  };

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="aw-page">
        {/* Skeleton top bar */}
        <div className="aw-topbar">
          <div>
            <div className="aw-skeleton aw-skeleton-title" />
            <div className="aw-skeleton aw-skeleton-subtitle" />
          </div>
          <div className="aw-skeleton aw-skeleton-btn" />
        </div>

        {/* Skeleton 2-column layout */}
        <div className="aw-layout">
          {/* Left: 3 skeleton widget cards */}
          <div className="aw-left">
            <div className="aw-card-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aw-widget-card" style={{ cursor: 'default' }}>
                  <div className="aw-card-bar" style={{ backgroundColor: 'var(--forge-bg-tertiary, #2a2f3a)' }} />
                  <div className="aw-card-body">
                    <div className="aw-skeleton aw-skeleton-card-name" />
                    <div className="aw-skeleton aw-skeleton-card-id" />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="aw-skeleton aw-skeleton-icon" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: skeleton detail panel */}
          <div className="aw-right">
            <div style={{ padding: 16 }}>
              <div className="aw-skeleton aw-skeleton-tab-bar" />
              <div style={{ marginTop: 16 }}>
                <div className="aw-skeleton aw-skeleton-field" />
                <div className="aw-skeleton aw-skeleton-field" style={{ width: '70%' }} />
                <div className="aw-skeleton aw-skeleton-field" style={{ width: '50%' }} />
                <div className="aw-skeleton aw-skeleton-field-tall" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedWidget = widgets.find((w) => w.id === selectedId) || null;

  return (
    <div className="aw-page">
      {/* Top bar */}
      <div className="aw-topbar">
        <div>
          <h1 className="aw-heading">{t('admin.widget.page.heading', 'Widget Code')}</h1>
          <p className="aw-subtitle">
            {t('admin.widget.page.subtitle', 'Manage widget instances, embed code and domain whitelist')}
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
            {t('admin.widget.page.createBtn', 'Create Widget')}
          </button>
        </div>
      </div>

      {/* Dirty banner */}
      {isDirty ? (
        <div className="aw-dirty-banner">
          <div className="aw-dirty-left">
            <Icon name="AlertTriangle" size={18} />
            <span>{t('admin.widget.page.dirtyBanner', 'Unsaved changes in widget configuration.')}</span>
          </div>
          <div className="aw-dirty-actions">
            <button className="aw-btn aw-btn-secondary" onClick={onResetEditor}>
              {t('admin.widget.page.discard', 'Discard')}
            </button>
            <button className="aw-btn aw-btn-primary" onClick={onSave} disabled={!canSave}>
              <Icon name="Save" size={16} />
              {t('admin.widget.page.save', 'Save')}
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
                <strong>{t('admin.widget.page.planLimit', 'Plan limit')}</strong>
                <div className="aw-muted">{t('admin.widget.page.planLimitDesc', 'Max. {max} widget(s).').replace('{max}', maxWidgets)}</div>
              </div>
            </div>
          ) : null}

          <div className="aw-card-list">
            {widgets.map((w) => {
              const isActive = w.status !== 'disabled';
              const isSelected = w.id === selectedId;
              const barColor = isActive
                ? (w.primaryColorOverride || '#00D4AA')
                : 'var(--forge-text-muted)';

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
                        {isActive ? t('admin.widget.page.statusActive', 'Active') : t('admin.widget.page.statusInactive', 'Inactive')}
                      </span>
                    </div>

                    <div className="aw-card-id">{w.publicId}</div>

                    <div
                      className="aw-card-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* WIDGET_BUILDER_DEACTIVATED: vizualni builder deaktivovan pro BETA, zalohovano 2026-03-21
                      <button
                        type="button"
                        className="aw-icon-btn"
                        title={t('admin.widget.page.openBuilder', 'Open Builder')}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/admin/widget/builder/${w.id}`);
                        }}
                      >
                        <Icon name="Palette" size={15} />
                      </button>
                      */}
                      <button
                        className="aw-icon-btn"
                        title={t('admin.widget.page.copyEmbed', 'Copy embed')}
                        onClick={() => onCopyEmbed(w)}
                      >
                        <Icon name="Copy" size={15} />
                      </button>
                      <button
                        className="aw-icon-btn"
                        title={t('admin.widget.page.duplicateWidget', 'Duplicate')}
                        onClick={() => onDuplicate(w.id)}
                        disabled={!canCreateMore}
                      >
                        <Icon name="CopyPlus" size={15} />
                      </button>
                      <button
                        className="aw-icon-btn aw-icon-btn-danger"
                        title={t('admin.widget.page.deleteWidget', 'Delete')}
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
                  <div style={{ fontWeight: 700 }}>{t('admin.widget.page.emptyTitle', 'No widgets yet')}</div>
                  <div className="aw-muted">
                    {t('admin.widget.page.emptyDesc', 'Create your first widget and copy the embed code.')}
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
              <span>{t('admin.widget.page.selectHint', 'Select a widget on the left')}</span>
            </div>
          ) : (
            <>
              {/* Tab bar */}
              <div className="aw-tabs" role="tablist" aria-label={t('admin.widget.page.tabsAriaLabel', 'Widget configuration')}>
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
                      {t('admin.widget.page.reset', 'Reset')}
                    </button>
                    <button
                      className="aw-btn aw-btn-primary"
                      onClick={onSave}
                      disabled={!canSave}
                    >
                      <Icon name="Save" size={16} />
                      {t('admin.widget.page.save', 'Save')}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Tab content */}
              <div className="aw-tab-content" role="tabpanel" id={`aw-tabpanel-${activeTab}`} aria-labelledby={`aw-tab-${activeTab}`}>
                {activeTab === 'config' ? (
                  <div className="aw-config-with-preview">
                    <div className="aw-config-form-col">
                      <WidgetConfigTab
                        editor={editor}
                        errors={errors}
                        onEditorChange={onEditorChange}
                      />
                    </div>
                    <div className="aw-config-preview-col">
                      <WidgetPreviewPanel editor={editor} />
                    </div>
                  </div>
                ) : null}

                {activeTab === 'embed' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <ForgeHelpIcon text={getHelpText('widget_embed_code', 'cs')} position="right" size={16} />
                      <span style={{ fontSize: 12, color: 'var(--forge-text-muted)' }}>{t('admin.widget.page.embedHelpLabel', 'Embed code help')}</span>
                    </div>
                    <WidgetEmbedTab widget={selectedWidget} />
                  </div>
                ) : null}

                {activeTab === 'integration' ? (
                  <WidgetIntegrationTab widget={selectedWidget} />
                ) : null}

                {activeTab === 'domains' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <ForgeHelpIcon text={getHelpText('widget_domain_whitelist', 'cs')} learnMore={getLearnMore('widget_domain_whitelist')} position="right" size={16} />
                      <span style={{ fontSize: 12, color: 'var(--forge-text-muted)' }}>{t('admin.widget.page.domainsHelpLabel', 'Domain whitelist help')}</span>
                    </div>
                    <WidgetDomainsTab
                      domains={domains}
                      canUseWhitelist={canUseWhitelist}
                      onAddDomain={onAddDomain}
                      onToggleDomain={onToggleDomain}
                      onDeleteDomain={onDeleteDomain}
                    />
                  </div>
                ) : null}

                {activeTab === 'settings' ? (
                  <WidgetSettingsTab
                    widget={selectedWidget}
                    canCreateMore={canCreateMore}
                    onToggleEnabled={onToggleEnabled}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    /* WIDGET_BUILDER_DEACTIVATED: vizualni builder deaktivovan pro BETA, zalohovano 2026-03-21 */
                    /* onNavigateBuilder={(id) => navigate(`/admin/widget/builder/${id}`)} */
                  />
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      {createOpen ? (
        <div className="aw-overlay" ref={createOverlayRef} onClick={() => setCreateOpen(false)}>
          <div
            className="aw-modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="aw-create-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aw-modal-header">
              <div className="aw-modal-title" id="aw-create-modal-title">{t('admin.widget.page.createModalTitle', 'Create new widget')}</div>
              <button className="aw-icon-btn" onClick={() => setCreateOpen(false)}>
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="aw-modal-body">
              <div className="aw-form-row">
                <label className="aw-label">{t('admin.widget.page.createNameLabel', 'Name')}</label>
                <input
                  className={`aw-input${createError ? ' aw-input-error' : ''}`}
                  value={createName}
                  onChange={(e) => { const v = e.target.value; setCreateName(v); if (v.trim().length >= 2) setCreateError(''); }}
                  placeholder={t('admin.widget.page.createNamePlaceholder', 'e.g. Homepage')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmCreate();
                  }}
                  autoFocus
                />
                {createError && (
                  <div role="alert" style={{ color: 'var(--forge-error)', fontSize: 12, marginTop: 4 }}>
                    {createError}
                  </div>
                )}
              </div>

              <div className="aw-form-row">
                <label className="aw-label">{t('admin.widget.page.createTypeLabel', 'Type')}</label>
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
                {t('admin.widget.page.createCancelBtn', 'Cancel')}
              </button>
              <button className="aw-btn aw-btn-primary" onClick={confirmCreate}>
                <Icon name="Plus" size={16} />
                {t('admin.widget.page.createConfirmBtn', 'Create')}
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

        /* ---- Skeleton loading ---- */
        @keyframes aw-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .aw-skeleton {
          border-radius: var(--forge-radius-md, 6px);
          background: linear-gradient(
            90deg,
            var(--forge-bg-tertiary, #1e2330) 25%,
            var(--forge-bg-secondary, #2a2f3a) 50%,
            var(--forge-bg-tertiary, #1e2330) 75%
          );
          background-size: 200% 100%;
          animation: aw-shimmer 1.5s ease-in-out infinite;
        }

        .aw-skeleton-title {
          width: 180px;
          height: 24px;
          margin-bottom: 6px;
        }

        .aw-skeleton-subtitle {
          width: 300px;
          height: 14px;
        }

        .aw-skeleton-btn {
          width: 140px;
          height: 36px;
          border-radius: var(--forge-radius-md, 6px);
        }

        .aw-skeleton-card-name {
          width: 60%;
          height: 14px;
          margin-bottom: 6px;
        }

        .aw-skeleton-card-id {
          width: 80%;
          height: 11px;
          margin-bottom: 8px;
        }

        .aw-skeleton-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--forge-radius-md, 6px);
        }

        .aw-skeleton-tab-bar {
          width: 100%;
          height: 42px;
          border-radius: var(--forge-radius-md, 6px);
        }

        .aw-skeleton-field {
          width: 100%;
          height: 16px;
          margin-bottom: 14px;
          border-radius: 4px;
        }

        .aw-skeleton-field-tall {
          width: 100%;
          height: 80px;
          border-radius: var(--forge-radius-md, 6px);
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
          font-family: var(--forge-font-heading);
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
          font-family: var(--forge-font-body);
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
          font-family: var(--forge-font-body);
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

        /* ---- Config tab with preview ---- */
        .aw-config-with-preview {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1200px) {
          .aw-config-with-preview {
            grid-template-columns: 1fr;
          }
          .aw-config-preview-col {
            order: -1;
          }
        }

        .aw-config-form-col {
          min-width: 0;
        }

        .aw-config-preview-col {
          position: sticky;
          top: 16px;
        }

        .aw-config-tab {
          max-width: 520px;
        }

        .aw-config-section {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--forge-border-default);
        }
        .aw-config-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .aw-config-section-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--forge-text-primary);
          margin-bottom: 12px;
          font-family: var(--forge-font-heading);
        }

        /* Theme switcher */
        .aw-theme-switcher {
          display: flex;
          gap: 4px;
          background: var(--forge-bg-tertiary, #1A1D23);
          border-radius: 8px;
          padding: 4px;
        }

        .aw-theme-option {
          flex: 1;
          padding: 7px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-family: var(--forge-font-body);
          font-weight: 400;
          background: transparent;
          color: var(--forge-text-secondary, #94A3B8);
          transition: all 150ms ease;
        }
        .aw-theme-option-active {
          font-weight: 600;
          background: var(--forge-accent-primary, #00D4AA);
          color: #000;
        }

        /* Border radius preview */
        .aw-border-radius-preview {
          width: 60px;
          height: 40px;
          margin-top: 6px;
          border: 2px solid var(--forge-accent-primary);
          background: rgba(0,212,170,0.08);
          transition: border-radius 0.2s ease;
        }

        /* Section toggles */
        .aw-section-toggles {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .aw-section-toggle-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px;
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          background: var(--forge-bg-elevated);
          cursor: pointer;
          transition: all 0.15s;
        }
        .aw-section-toggle-row:hover {
          border-color: var(--forge-text-muted);
        }

        .aw-section-toggle-label {
          font-weight: 600;
          font-size: 13px;
          color: var(--forge-text-primary);
          margin-bottom: 2px;
        }

        /* ---- Preview panel ---- */
        .aw-preview-panel {
          background: var(--forge-bg-elevated);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md);
          overflow: hidden;
        }

        .aw-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface);
        }

        .aw-preview-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 13px;
          color: var(--forge-text-primary);
        }

        .aw-preview-devices {
          display: flex;
          gap: 4px;
        }

        .aw-device-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 6px;
          border: 1px solid var(--forge-border-default);
          background: transparent;
          color: var(--forge-text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .aw-device-btn:hover {
          color: var(--forge-text-primary);
          border-color: var(--forge-text-muted);
        }
        .aw-device-btn-active {
          background: var(--forge-accent-primary);
          color: #0a0f1a;
          border-color: var(--forge-accent-primary);
        }

        .aw-preview-viewport {
          padding: 16px;
          background: repeating-conic-gradient(
            rgba(255,255,255,0.03) 0% 25%,
            transparent 0% 50%
          ) 50% / 20px 20px;
          min-height: 300px;
        }

        .aw-preview-frame {
          /* dynamic width via style prop */
        }

        .aw-preview-widget {
          overflow: hidden;
        }

        .aw-preview-widget-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
        }

        .aw-preview-section {
          padding: 10px 14px;
          border-bottom: 1px solid;
        }

        .aw-preview-upload {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 16px;
          border: 2px dashed;
          border-radius: 6px;
        }

        .aw-preview-device-label {
          text-align: center;
          margin-top: 8px;
          font-size: 11px;
          color: var(--forge-text-muted);
          font-family: var(--forge-font-tech);
        }

        /* ---- Integration tab ---- */
        .aw-integration-tab {}

        .aw-platform-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: var(--forge-bg-tertiary, #1A1D23);
          border-radius: 8px;
          padding: 4px;
          overflow-x: auto;
        }

        .aw-platform-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex: 1 1 0%;
          justify-content: center;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-family: var(--forge-font-body);
          font-weight: 400;
          background: transparent;
          color: var(--forge-text-secondary, #94A3B8);
          transition: all 150ms ease;
          white-space: nowrap;
        }
        .aw-platform-tab-active {
          font-weight: 600;
          background: var(--forge-accent-primary, #00D4AA);
          color: #000;
        }

        .aw-platform-content {
          /* wrapper */
        }

        .aw-platform-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .aw-platform-title {
          font-weight: 700;
          font-size: 14px;
          color: var(--forge-text-primary);
          margin-bottom: 2px;
          font-family: var(--forge-font-tech);
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
          font-family: var(--forge-font-heading);
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
      {ConfirmDialogPortal}
    </div>
  );
};

export default AdminWidget;
