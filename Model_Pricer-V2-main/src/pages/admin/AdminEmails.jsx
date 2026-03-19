// Admin Email Notifications Configuration Page — V3
// --------------------------------------------------
// Scope: /admin/emails only
// - Single source of truth: tenant-scoped V1 storage (namespace: email:v1 + email-templates:v1 + email-autosend:v1 + email-log:v1)
// - 4 tabs: Templates, Settings, Log, Auto-send Rules
// - Templates: left sidebar list + right editor/preview split
// - Settings: SMTP / API provider, sender info, test email
// - Log: recent sent emails table
// - Auto-send: configure automatic email sending on status changes

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debug } from '@/lib/debug';
import { sanitizeHtmlAllowBasic } from '@/utils/sanitizeHtml';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  EMAIL_TEMPLATE_TYPES,
  EMAIL_TEMPLATE_VARIABLES,
  ORDER_STATUSES,
  addEmailLogEntry,
  clearEmailLog,
  getDefaultAutoSendRules,
  getDefaultTemplateContent,
  loadAutoSendRules,
  loadEmailConfigV1,
  loadEmailLog,
  loadEmailTemplates,
  renderTemplatePreview,
  saveAutoSendRules,
  saveEmailConfigV1,
  saveEmailTemplates,
} from '../../utils/adminEmailStorage';
import EmailTemplatePreview from './components/EmailTemplatePreview';
import { finalizeDecimal, parseIntInput } from '@/utils/formatters';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PROVIDER_OPTIONS = [
  { value: 'none', label_cs: 'Simulace (test)', label_en: 'Simulation (test)', icon: 'TestTube2' },
  { value: 'smtp', label_cs: 'SMTP', label_en: 'SMTP', icon: 'Server' },
  { value: 'api', label_cs: 'API (budouci)', label_en: 'API (future)', icon: 'Cloud' },
];

const TABS = [
  { id: 'templates', icon: 'Mail', label_cs: 'Sablony', label_en: 'Templates' },
  { id: 'settings', icon: 'Settings', label_cs: 'Nastaveni', label_en: 'Settings' },
  { id: 'log', icon: 'FileText', label_cs: 'Log', label_en: 'Log' },
  { id: 'autosend', icon: 'Zap', label_cs: 'Automaticke odesilani', label_en: 'Auto-send Rules' },
];

const TOOLBAR_ACTIONS = [
  { cmd: 'bold', icon: 'Bold', title_cs: 'Tucne', title_en: 'Bold' },
  { cmd: 'italic', icon: 'Italic', title_cs: 'Kurziva', title_en: 'Italic' },
  { cmd: 'underline', icon: 'Underline', title_cs: 'Podtrzeni', title_en: 'Underline' },
  { cmd: 'sep1' },
  { cmd: 'formatBlock:h2', icon: 'Heading2', title_cs: 'Nadpis', title_en: 'Heading' },
  { cmd: 'formatBlock:p', icon: 'Pilcrow', title_cs: 'Odstavec', title_en: 'Paragraph' },
  { cmd: 'sep2' },
  { cmd: 'insertUnorderedList', icon: 'List', title_cs: 'Seznam', title_en: 'List' },
  { cmd: 'insertOrderedList', icon: 'ListOrdered', title_cs: 'Cislovany seznam', title_en: 'Ordered List' },
  { cmd: 'sep3' },
  { cmd: 'createLink', icon: 'Link', title_cs: 'Odkaz', title_en: 'Link' },
  { cmd: 'removeFormat', icon: 'RemoveFormatting', title_cs: 'Smazat formatovani', title_en: 'Remove formatting' },
];

const TEMPLATE_CATEGORIES = [
  { id: 'order', label_cs: 'Objednavky', label_en: 'Orders' },
  { id: 'payment', label_cs: 'Platby', label_en: 'Payments' },
  { id: 'general', label_cs: 'Obecne', label_en: 'General' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AdminEmails() {
  const { language, t } = useLanguage();
  const cs = language === 'cs';
  const csRef = useRef(cs);
  csRef.current = cs;
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [emailLog, setEmailLog] = useState([]);
  const [banner, setBanner] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');

  // Template editor state
  const [templates, setTemplates] = useState({});
  const [templatesSavedSnapshot, setTemplatesSavedSnapshot] = useState('');
  const [activeTemplate, setActiveTemplate] = useState(EMAIL_TEMPLATE_TYPES[0]?.id || 'order_confirmed');
  const [tplSaving, setTplSaving] = useState(false);
  const [editorMode, setEditorMode] = useState('edit'); // edit | preview
  const editorRef = useRef(null);

  // Auto-send rules state
  const [autoSendRules, setAutoSendRules] = useState([]);
  const [autoSendSaved, setAutoSendSaved] = useState('');
  const [autoSendSaving, setAutoSendSaving] = useState(false);

  // Test email state
  const [testSending, setTestSending] = useState(false);

  // Banner auto-clear
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    try {
      const cfg = loadEmailConfigV1();
      setConfig(cfg);
      setSavedSnapshot(JSON.stringify(cfg));

      const tpls = loadEmailTemplates();
      setTemplates(tpls);
      setTemplatesSavedSnapshot(JSON.stringify(tpls));

      const log = loadEmailLog();
      setEmailLog(log);

      const rules = loadAutoSendRules();
      setAutoSendRules(rules);
      setAutoSendSaved(JSON.stringify(rules));

      setLoading(false);
    } catch (e) {
      debug('[AdminEmails] Failed to init', e);
      setLoading(false);
      setBanner({ type: 'error', text: csRef.current ? 'Nepodarilo se nacist konfiguraci.' : 'Failed to load config.' }); // csRef used here (before t is stable)
    }
  }, []);

  // Sync editor content when switching templates or when templates data loads.
  useEffect(() => {
    if (editorRef.current && templates[activeTemplate]) {
      editorRef.current.innerHTML = sanitizeHtmlAllowBasic(templates[activeTemplate].body || '');
    }
  }, [activeTemplate, templates]);

  const dirty = useMemo(() => {
    if (!config) return false;
    return savedSnapshot !== JSON.stringify(config);
  }, [config, savedSnapshot]);

  const templatesDirty = useMemo(() => {
    return templatesSavedSnapshot !== JSON.stringify(templates);
  }, [templates, templatesSavedSnapshot]);

  const autoSendDirty = useMemo(() => {
    return autoSendSaved !== JSON.stringify(autoSendRules);
  }, [autoSendRules, autoSendSaved]);

  const updateConfig = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  // Template editor helpers
  const updateTemplateContent = useCallback((templateId, patch) => {
    setTemplates((prev) => ({
      ...prev,
      [templateId]: { ...(prev[templateId] || {}), ...patch },
    }));
  }, []);

  const syncEditorContent = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      updateTemplateContent(activeTemplate, { body: html });
    }
  }, [activeTemplate, updateTemplateContent]);

  const execCommand = useCallback((cmdStr) => {
    if (cmdStr.startsWith('formatBlock:')) {
      const tag = cmdStr.split(':')[1];
      document.execCommand('formatBlock', false, `<${tag}>`);
    } else if (cmdStr === 'createLink') {
      const url = prompt(t('admin.emails.prompt.linkUrl', 'Enter link URL:'), 'https://');
      if (url) {
        document.execCommand('createLink', false, url);
      }
    } else {
      document.execCommand(cmdStr, false, null);
    }
    syncEditorContent();
    editorRef.current?.focus();
  }, [cs, syncEditorContent]);

  const insertVariable = useCallback((varKey) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = document.createTextNode(`{{${varKey}}}`);
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
    syncEditorContent();
  }, [syncEditorContent]);

  // Save handlers
  const handleSaveConfig = () => {
    setBanner(null);
    try {
      setSaving(true);
      const saved = saveEmailConfigV1(config);
      setConfig(saved);
      setSavedSnapshot(JSON.stringify(saved));
      setSaving(false);
      setBanner({ type: 'success', text: t('admin.emails.settingsSaved', 'Settings saved.') });
    } catch (e) {
      debug('[AdminEmails] Save failed', e);
      setSaving(false);
      setBanner({ type: 'error', text: t('admin.emails.saveFailed', 'Save failed.') });
    }
  };

  const handleSaveTemplates = useCallback(() => {
    setBanner(null);
    try {
      setTplSaving(true);
      const sanitized = {};
      for (const [key, tpl] of Object.entries(templates)) {
        sanitized[key] = {
          ...tpl,
          // Use DOM-based sanitizer (consistent with preview rendering)
          body: sanitizeHtmlAllowBasic(tpl.body || ''),
        };
      }
      const saved = saveEmailTemplates(sanitized);
      setTemplates(saved);
      setTemplatesSavedSnapshot(JSON.stringify(saved));
      setTplSaving(false);
      setBanner({ type: 'success', text: t('admin.emails.templatesSaved', 'Templates saved.') });
    } catch (e) {
      debug('[AdminEmails] Template save failed', e);
      setTplSaving(false);
      setBanner({ type: 'error', text: t('admin.emails.templateSaveFailed', 'Template save failed.') });
    }
  }, [templates, cs]);

  const handleSaveAutoSend = useCallback(() => {
    setBanner(null);
    try {
      setAutoSendSaving(true);
      const saved = saveAutoSendRules(autoSendRules);
      setAutoSendRules(saved);
      setAutoSendSaved(JSON.stringify(saved));
      setAutoSendSaving(false);
      setBanner({ type: 'success', text: t('admin.emails.rulesSaved', 'Rules saved.') });
    } catch (e) {
      debug('[AdminEmails] AutoSend save failed', e);
      setAutoSendSaving(false);
      setBanner({ type: 'error', text: t('admin.emails.rulesSaveFailed', 'Rules save failed.') });
    }
  }, [autoSendRules, cs]);

  const handleResetTemplate = useCallback(async () => {
    const ok = await confirm({
      title: t('admin.emails.tpl.resetDialog.title', 'Reset to default template'),
      message: t('admin.emails.tpl.resetDialog.message', 'Reset this template to default content? Unsaved changes will be lost.'),
      confirmLabel: t('admin.emails.tpl.resetDialog.confirm', 'Reset'),
      destructive: true,
    });
    if (!ok) return;
    const def = getDefaultTemplateContent(activeTemplate);
    updateTemplateContent(activeTemplate, def);
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeHtmlAllowBasic(def.body || '');
    }
  }, [activeTemplate, confirm, cs, updateTemplateContent]);

  const handleTestEmail = useCallback(() => {
    const testAddr = config?.test_email || config?.sender_email || '';
    if (!testAddr) {
      setBanner({ type: 'error', text: t('admin.emails.settings.noTestEmail', 'Enter test email in settings.') });
      return;
    }
    setTestSending(true);
    // Simulate sending
    setTimeout(() => {
      const rendered = renderTemplatePreview(
        templates[activeTemplate]?.body || '',
        templates[activeTemplate]?.subject || ''
      );
      const newLog = addEmailLogEntry({
        template: activeTemplate,
        recipient: testAddr,
        subject: rendered.subject,
        orderId: 'TEST-001',
        status: 'sent',
      });
      setEmailLog(newLog);
      setTestSending(false);
      setBanner({ type: 'success', text: t('admin.emails.settings.testSentSuccess', 'Test email sent to {addr} (simulated).').replace('{addr}', testAddr) });
    }, 1200);
  }, [activeTemplate, config, cs, templates]);

  const handleClearLog = useCallback(async () => {
    const ok = await confirm({
      title: t('admin.emails.log.clearDialog.title', 'Clear log'),
      message: t('admin.emails.log.clearDialog.message', 'Clear entire email history?'),
      confirmLabel: t('admin.emails.log.clearDialog.confirm', 'Clear'),
      destructive: true,
    });
    if (!ok) return;
    const cleared = clearEmailLog();
    setEmailLog(cleared);
    setBanner({ type: 'success', text: t('admin.emails.logCleared', 'Log cleared.') });
  }, [confirm, cs]);

  const handleResetAutoSend = useCallback(async () => {
    const ok = await confirm({
      title: t('admin.emails.autosend.resetDialog.title', 'Reset to default rules'),
      message: t('admin.emails.autosend.resetDialog.message', 'Reset auto-send rules to defaults?'),
      confirmLabel: t('admin.emails.autosend.resetDialog.confirm', 'Reset'),
      destructive: true,
    });
    if (!ok) return;
    const defaults = getDefaultAutoSendRules();
    setAutoSendRules(defaults);
  }, [confirm, cs]);

  // -----------------------------------------------------------------------
  // LOADING
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="ae-page">
        <div className="ae-card">
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="Loader2" size={18} className="ae-spin" />
            <span>{t('admin.emails.loading', 'Loading...')}</span>
          </div>
        </div>
      </div>
    );
  }

  const provider = config?.provider || 'none';
  const currentTpl = templates[activeTemplate] || { subject: '', body: '' };
  const activeTplMeta = EMAIL_TEMPLATE_TYPES.find((t) => t.id === activeTemplate);

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------
  return (
    <div className="ae-page">
      {/* Header */}
      <div className="ae-header">
        <div className="ae-header-left">
          <div className="ae-header-icon">
            <Icon name="Mail" size={22} />
          </div>
          <div>
            <h1 className="ae-title">{t('admin.emails.pageTitle', 'Email Notifications')}</h1>
            <p className="ae-subtitle">
              {t('admin.emails.pageSubtitle', 'Manage email templates, sending settings and auto-send rules.')}
            </p>
          </div>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className={`ae-banner ae-banner--${banner.type}`}>
          <Icon name={banner.type === 'error' ? 'XCircle' : 'CheckCircle2'} size={16} />
          <span>{banner.text}</span>
          <button className="ae-banner-close" onClick={() => setBanner(null)}>
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="ae-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`ae-tab ${activeTab === tab.id ? 'ae-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            <span>{cs ? tab.label_cs : tab.label_en}</span>
            {tab.id === 'templates' && templatesDirty && <span className="ae-tab-dot" />}
            {tab.id === 'settings' && dirty && <span className="ae-tab-dot" />}
            {tab.id === 'autosend' && autoSendDirty && <span className="ae-tab-dot" />}
            {tab.id === 'log' && emailLog.length > 0 && (
              <span className="ae-tab-badge">{emailLog.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB: TEMPLATES
          ============================================================ */}
      {activeTab === 'templates' && (
        <div className="ae-templates-layout">
          {/* Left sidebar — template list */}
          <div className="ae-tpl-sidebar">
            <div className="ae-card">
              <div className="ae-card-header">
                <h2 className="ae-card-title">{t('admin.emails.tpl.sectionTitle', 'Templates')}</h2>
              </div>
              <div className="ae-tpl-list">
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const catTemplates = EMAIL_TEMPLATE_TYPES.filter((t) => t.category === cat.id);
                  if (catTemplates.length === 0) return null;
                  return (
                    <div key={cat.id} className="ae-tpl-category">
                      <div className="ae-tpl-category-label">
                        {cs ? cat.label_cs : cat.label_en}
                      </div>
                      {catTemplates.map((tType) => (
                        <button
                          key={tType.id}
                          className={`ae-tpl-item ${activeTemplate === tType.id ? 'ae-tpl-item--active' : ''}`}
                          onClick={() => { syncEditorContent(); setActiveTemplate(tType.id); setEditorMode('edit'); }}
                        >
                          <Icon name={tType.icon} size={16} />
                          <span className="ae-tpl-item-label">{cs ? tType.label_cs : tType.label_en}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel — editor + preview */}
          <div className="ae-tpl-main">
            {/* Template header with save actions */}
            <div className="ae-card ae-tpl-header-card">
              <div className="ae-tpl-header-inner">
                <div className="ae-tpl-header-left">
                  <Icon name={activeTplMeta?.icon || 'Mail'} size={20} />
                  <div>
                    <h2 className="ae-card-title" style={{ margin: 0 }}>
                      {cs ? activeTplMeta?.label_cs : activeTplMeta?.label_en}
                    </h2>
                    <span className="ae-text-muted" style={{ fontSize: 12 }}>{activeTemplate}</span>
                  </div>
                </div>
                <div className="ae-tpl-header-actions">
                  {/* Edit / Preview toggle */}
                  <div className="ae-mode-toggle">
                    <button
                      className={`ae-mode-btn ${editorMode === 'edit' ? 'ae-mode-btn--active' : ''}`}
                      onClick={() => setEditorMode('edit')}
                    >
                      <Icon name="Pencil" size={14} />
                      {t('admin.emails.tpl.modeEdit', 'Edit')}
                    </button>
                    <button
                      className={`ae-mode-btn ${editorMode === 'preview' ? 'ae-mode-btn--active' : ''}`}
                      onClick={() => setEditorMode('preview')}
                    >
                      <Icon name="Eye" size={14} />
                      {t('admin.emails.tpl.modePreview', 'Preview')}
                    </button>
                  </div>

                  <button className="ae-btn ae-btn--ghost" onClick={handleResetTemplate} title={t('admin.emails.tpl.resetToDefault', 'Reset to default')}>
                    <Icon name="RotateCcw" size={15} />
                  </button>
                  <button className="ae-btn ae-btn--ghost" onClick={handleTestEmail} disabled={testSending} title={t('admin.emails.tpl.sendTest', 'Send test email')}>
                    <Icon name={testSending ? 'Loader2' : 'Send'} size={15} className={testSending ? 'ae-spin' : ''} />
                  </button>
                  <div className={`ae-status-pill ${templatesDirty ? 'ae-status--dirty' : 'ae-status--clean'}`}>
                    <Icon name={templatesDirty ? 'AlertCircle' : 'CheckCircle2'} size={14} />
                    <span>{templatesDirty ? t('admin.emails.unsaved', 'Unsaved') : t('admin.emails.saved', 'Saved')}</span>
                  </div>
                  <button className="ae-btn ae-btn--primary" onClick={handleSaveTemplates} disabled={!templatesDirty || tplSaving}>
                    <Icon name="Save" size={15} />
                    {tplSaving ? t('admin.emails.saving', 'Saving...') : t('admin.emails.saveTemplates', 'Save')}
                  </button>
                </div>
              </div>
            </div>

            {/* Editor mode */}
            {editorMode === 'edit' && (
              <div className="ae-card">
                <div className="ae-card-body">
                  {/* Subject line */}
                  <div className="ae-field" style={{ marginBottom: 16 }}>
                    <label className="ae-label" htmlFor="tpl-editor-subject">
                      {t('admin.emails.tpl.subject', 'Email subject')}
                    </label>
                    <input
                      id="tpl-editor-subject"
                      className="ae-input"
                      value={currentTpl.subject || ''}
                      onChange={(e) => updateTemplateContent(activeTemplate, { subject: e.target.value })}
                      placeholder={t('admin.emails.tpl.subjectPlaceholder', 'Email subject...')}
                    />
                  </div>

                  {/* Variable insertion buttons */}
                  <div className="ae-field" style={{ marginBottom: 14 }}>
                    <label className="ae-label">{t('admin.emails.tpl.insertVariable', 'Insert variable')}</label>
                    <div className="ae-var-chips">
                      {EMAIL_TEMPLATE_VARIABLES.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          className="ae-var-chip"
                          onClick={() => insertVariable(v.key)}
                          title={`${cs ? v.label_cs : v.label_en} — ${v.sample}`}
                        >
                          <span className="ae-var-chip-key">{`{{${v.key}}}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Formatting toolbar */}
                  <div className="ae-editor-toolbar" role="toolbar" aria-label={t('admin.emails.tpl.formattingToolbar', 'Formatting')}>
                    {TOOLBAR_ACTIONS.map((action) => {
                      if (action.cmd.startsWith('sep')) {
                        return <div key={action.cmd} className="ae-toolbar-sep" />;
                      }
                      return (
                        <button
                          key={action.cmd}
                          type="button"
                          className="ae-toolbar-btn"
                          title={cs ? action.title_cs : action.title_en}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            execCommand(action.cmd);
                          }}
                        >
                          <Icon name={action.icon} size={15} />
                        </button>
                      );
                    })}
                  </div>

                  {/* ContentEditable editor */}
                  <div
                    ref={editorRef}
                    className="ae-editor-body"
                    contentEditable
                    role="textbox"
                    aria-label={t('admin.emails.tpl.bodyAriaLabel', 'Email body')}
                    aria-multiline="true"
                    onInput={syncEditorContent}
                    onBlur={syncEditorContent}
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlAllowBasic(currentTpl.body || '') }}
                  />

                  <div className="ae-help" style={{ marginTop: 8 }}>
                    <Icon name="Info" size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    {t('admin.emails.tpl.variableHint', 'Variables in {{name}} format will be replaced with actual values when sent.')}
                  </div>
                </div>
              </div>
            )}

            {/* Preview mode */}
            {editorMode === 'preview' && (
              <EmailTemplatePreview
                subject={currentTpl.subject || ''}
                body={currentTpl.body || ''}
                cs={cs}
              />
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: SETTINGS
          ============================================================ */}
      {activeTab === 'settings' && (
        <div className="ae-settings-layout">
          {/* Provider selection */}
          <div className="ae-card">
            <div className="ae-card-header">
              <div>
                <h2 className="ae-card-title">{t('admin.emails.settings.providerTitle', 'Email Provider')}</h2>
                <p className="ae-card-desc">
                  {t('admin.emails.settings.providerDesc', 'Select email sending method. In simulation mode, emails are logged but not actually sent.')}
                </p>
              </div>
            </div>
            <div className="ae-card-body">
              <div className="ae-provider-grid">
                {PROVIDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`ae-provider-card ${provider === opt.value ? 'ae-provider-card--active' : ''}`}
                    onClick={() => updateConfig({ provider: opt.value })}
                  >
                    <Icon name={opt.icon} size={24} />
                    <span className="ae-provider-label">{cs ? opt.label_cs : opt.label_en}</span>
                    {provider === opt.value && (
                      <Icon name="CheckCircle2" size={16} className="ae-provider-check" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SMTP settings */}
          {provider === 'smtp' && (
            <div className="ae-card">
              <div className="ae-card-header">
                <div>
                  <h2 className="ae-card-title">{t('admin.emails.settings.smtpTitle', 'SMTP Settings')}</h2>
                  <p className="ae-card-desc">
                    {t('admin.emails.settings.smtpDesc', 'Configure SMTP server connection.')}
                  </p>
                </div>
              </div>
              <div className="ae-card-body">
                <div className="ae-grid-2">
                  <div className="ae-field">
                    <label className="ae-label" htmlFor="smtp-host">{t('admin.emails.settings.smtpHost', 'Host')}</label>
                    <input
                      id="smtp-host"
                      className="ae-input"
                      value={config?.smtp_host || ''}
                      onChange={(e) => updateConfig({ smtp_host: e.target.value })}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="ae-field">
                    <label className="ae-label" htmlFor="smtp-port">{t('admin.emails.settings.smtpPort', 'Port')}</label>
                    <input
                      id="smtp-port"
                      className="ae-input"
                      type="text"
                      inputMode="numeric"
                      value={config?.smtp_port ?? ''}
                      onChange={(e) => updateConfig({ smtp_port: parseIntInput(e.target.value) })}
                      onBlur={() => updateConfig({ smtp_port: finalizeDecimal(config?.smtp_port, 587) })}
                      placeholder="587"
                    />
                  </div>
                </div>
                <div className="ae-grid-2" style={{ marginTop: 12 }}>
                  <div className="ae-field">
                    <label className="ae-label" htmlFor="smtp-user">{t('admin.emails.settings.smtpUser', 'Username')}</label>
                    <input
                      id="smtp-user"
                      className="ae-input"
                      value={config?.smtp_user || ''}
                      onChange={(e) => updateConfig({ smtp_user: e.target.value })}
                      placeholder={t('admin.emails.settings.smtpUserPlaceholder', 'Username')}
                    />
                  </div>
                  <div className="ae-field">
                    <label className="ae-label">{t('admin.emails.settings.smtpPassword', 'Password')}</label>
                    <div className="ae-security-note">
                      <Icon name="ShieldAlert" size={16} />
                      <span>{t('admin.emails.settings.smtpPasswordNote', 'Password is set in .env file on server (never in browser).')}</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <ForgeCheckbox
                    checked={config?.smtp_secure ?? true}
                    onChange={(e) => updateConfig({ smtp_secure: e.target.checked })}
                    label={t('admin.emails.settings.smtpTls', 'Use TLS/SSL')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* API settings */}
          {provider === 'api' && (
            <div className="ae-card">
              <div className="ae-card-header">
                <div>
                  <h2 className="ae-card-title">{t('admin.emails.settings.apiTitle', 'API Settings')}</h2>
                  <p className="ae-card-desc">
                    {t('admin.emails.settings.apiDesc', 'API provider support (Resend, SendGrid) will be added in a future version.')}
                  </p>
                </div>
              </div>
              <div className="ae-card-body">
                <div className="ae-field">
                  <label className="ae-label" htmlFor="api-key-name">{t('admin.emails.settings.apiKeyName', 'API key env variable name')}</label>
                  <input
                    id="api-key-name"
                    className="ae-input"
                    value={config?.api_key_name || ''}
                    onChange={(e) => updateConfig({ api_key_name: e.target.value })}
                    placeholder={t('admin.emails.settings.apiKeyNamePlaceholder', 'e.g. RESEND_API_KEY')}
                  />
                  <div className="ae-help">
                    {t('admin.emails.settings.apiKeyHint', 'The actual API key belongs in .env on the server.')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sender info */}
          <div className="ae-card">
            <div className="ae-card-header">
              <div>
                <h2 className="ae-card-title">{t('admin.emails.settings.senderTitle', 'Sender')}</h2>
                <p className="ae-card-desc">
                  {t('admin.emails.settings.senderDesc', 'Sender name and email displayed in emails.')}
                </p>
              </div>
            </div>
            <div className="ae-card-body">
              <div className="ae-grid-2">
                <div className="ae-field">
                  <label className="ae-label" htmlFor="sender-name">{t('admin.emails.settings.senderNameLabel', 'Sender name')}</label>
                  <input
                    id="sender-name"
                    className="ae-input"
                    value={config?.sender_name || ''}
                    onChange={(e) => updateConfig({ sender_name: e.target.value })}
                    placeholder={t('admin.emails.settings.senderNamePlaceholder', 'e.g. ModelPricer')}
                  />
                </div>
                <div className="ae-field">
                  <label className="ae-label" htmlFor="sender-email">{t('admin.emails.settings.senderEmailLabel', 'Sender email')}</label>
                  <input
                    id="sender-email"
                    className="ae-input"
                    type="email"
                    value={config?.sender_email || ''}
                    onChange={(e) => updateConfig({ sender_email: e.target.value })}
                    placeholder="noreply@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Test email */}
          <div className="ae-card">
            <div className="ae-card-header">
              <div>
                <h2 className="ae-card-title">{t('admin.emails.settings.testTitle', 'Test Email')}</h2>
                <p className="ae-card-desc">
                  {t('admin.emails.settings.testDesc', 'Send a test email to verify settings.')}
                </p>
              </div>
            </div>
            <div className="ae-card-body">
              <div className="ae-grid-2">
                <div className="ae-field">
                  <label className="ae-label" htmlFor="test-email-addr">{t('admin.emails.settings.testAddrLabel', 'Test email address')}</label>
                  <input
                    id="test-email-addr"
                    className="ae-input"
                    type="email"
                    value={config?.test_email || ''}
                    onChange={(e) => updateConfig({ test_email: e.target.value })}
                    placeholder="test@example.com"
                  />
                </div>
                <div className="ae-field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    className="ae-btn ae-btn--secondary"
                    onClick={handleTestEmail}
                    disabled={testSending || !config?.test_email}
                    style={{ marginBottom: 0 }}
                  >
                    <Icon name={testSending ? 'Loader2' : 'Send'} size={16} className={testSending ? 'ae-spin' : ''} />
                    {testSending ? t('admin.emails.settings.sending', 'Sending...') : t('admin.emails.settings.sendTest', 'Send test')}
                  </button>
                </div>
              </div>
              <div className="ae-help" style={{ marginTop: 8 }}>
                {t('admin.emails.settings.testSimHint', 'In simulation mode, the email is not sent but logged.')}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="ae-save-bar">
            <div className={`ae-status-pill ${dirty ? 'ae-status--dirty' : 'ae-status--clean'}`}>
              <Icon name={dirty ? 'AlertCircle' : 'CheckCircle2'} size={14} />
              <span>{dirty ? t('admin.emails.unsavedChanges', 'Unsaved changes') : t('admin.emails.saved', 'Saved')}</span>
            </div>
            <button className="ae-btn ae-btn--primary" onClick={handleSaveConfig} disabled={!dirty || saving}>
              <Icon name="Save" size={16} />
              {saving ? t('admin.emails.saving', 'Saving...') : t('admin.emails.saveSettings', 'Save settings')}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: LOG
          ============================================================ */}
      {activeTab === 'log' && (
        <div className="ae-tab-content">
          <div className="ae-card">
            <div className="ae-card-header">
              <div>
                <h2 className="ae-card-title">{t('admin.emails.log.title', 'Email Send History')}</h2>
                <p className="ae-card-desc">
                  {cs
                    ? `Posledni odeslane emaily (${emailLog.length} zaznamu).`
                    : `Recent sent emails (${emailLog.length} records).`}
                </p>
              </div>
              {emailLog.length > 0 && (
                <button className="ae-btn ae-btn--ghost ae-btn--danger" onClick={handleClearLog}>
                  <Icon name="Trash2" size={15} />
                  {t('admin.emails.log.clearBtn', 'Clear log')}
                </button>
              )}
            </div>
            <div className="ae-card-body" style={{ padding: 0 }}>
              {emailLog.length === 0 ? (
                <div className="ae-empty">
                  <Icon name="Mail" size={44} />
                  <h3>{t('admin.emails.log.emptyTitle', 'No emails sent yet')}</h3>
                  <p>{t('admin.emails.log.emptyDesc', 'Emails sent from templates or test sends will appear here.')}</p>
                </div>
              ) : (
                <div className="ae-log-table">
                  <div className="ae-log-header">
                    <span>{t('admin.emails.log.colDate', 'Date')}</span>
                    <span>{t('admin.emails.log.colTemplate', 'Template')}</span>
                    <span>{t('admin.emails.log.colRecipient', 'Recipient')}</span>
                    <span>{t('admin.emails.log.colOrder', 'Order')}</span>
                    <span>{t('admin.emails.log.colStatus', 'Status')}</span>
                  </div>
                  {emailLog.map((entry) => {
                    const tplMeta = EMAIL_TEMPLATE_TYPES.find((t) => t.id === entry.template);
                    return (
                      <div key={entry.id || entry.date} className="ae-log-row">
                        <span className="ae-log-date">
                          {entry.date ? new Date(entry.date).toLocaleString(cs ? 'cs-CZ' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014'}
                        </span>
                        <span className="ae-log-template">
                          {tplMeta && <Icon name={tplMeta.icon} size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                          {tplMeta ? (cs ? tplMeta.label_cs : tplMeta.label_en) : (entry.template || '\u2014')}
                        </span>
                        <span className="ae-log-recipient">{entry.recipient || '\u2014'}</span>
                        <span className="ae-log-order">{entry.orderId || '\u2014'}</span>
                        <span className={`ae-log-status ae-log-status--${entry.status === 'sent' ? 'sent' : 'failed'}`}>
                          <Icon name={entry.status === 'sent' ? 'CheckCircle2' : 'XCircle'} size={14} />
                          {entry.status === 'sent' ? t('admin.emails.log.statusSent', 'Sent') : t('admin.emails.log.statusFailed', 'Failed')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB: AUTO-SEND RULES
          ============================================================ */}
      {activeTab === 'autosend' && (
        <div className="ae-tab-content">
          <div className="ae-card">
            <div className="ae-card-header">
              <div>
                <h2 className="ae-card-title">{t('admin.emails.autosend.title', 'Auto-send Rules')}</h2>
                <p className="ae-card-desc">
                  {t('admin.emails.autosend.desc', 'Configure which emails are sent automatically when order status changes.')}
                </p>
              </div>
              <div className="ae-card-header-actions">
                <button className="ae-btn ae-btn--ghost" onClick={handleResetAutoSend}>
                  <Icon name="RotateCcw" size={15} />
                  {t('admin.emails.autosend.resetBtn', 'Reset')}
                </button>
              </div>
            </div>
            <div className="ae-card-body" style={{ padding: 0 }}>
              <div className="ae-autosend-list">
                {autoSendRules.length === 0 && (
                  <div className="ae-empty" style={{ padding: '32px 24px' }}>
                    <Icon name="Zap" size={40} />
                    <h3>{t('admin.emails.autosend.emptyTitle', 'No auto-send rules')}</h3>
                    <p>
                      {t('admin.emails.autosend.emptyDesc', 'Click "Reset" to load the default set of rules.')}
                    </p>
                  </div>
                )}
                {autoSendRules.map((rule, idx) => {
                  const tplMeta = EMAIL_TEMPLATE_TYPES.find((t) => t.id === rule.template_id);
                  return (
                    <div key={rule.template_id} className={`ae-autosend-row ${rule.enabled ? 'ae-autosend-row--enabled' : ''}`}>
                      <div className="ae-autosend-left">
                        <ForgeCheckbox
                          checked={rule.enabled}
                          onChange={(e) => {
                            const next = [...autoSendRules];
                            next[idx] = { ...next[idx], enabled: e.target.checked };
                            setAutoSendRules(next);
                          }}
                          label=""
                        />
                        <div className="ae-autosend-tpl">
                          {tplMeta && <Icon name={tplMeta.icon} size={16} />}
                          <span className="ae-autosend-tpl-name">
                            {tplMeta ? (cs ? tplMeta.label_cs : tplMeta.label_en) : rule.template_id}
                          </span>
                        </div>
                      </div>
                      <div className="ae-autosend-right">
                        <span className="ae-autosend-arrow-label">
                          {t('admin.emails.autosend.sendWhen', 'Send when status becomes:')}
                        </span>
                        <select
                          className="ae-input ae-autosend-select"
                          value={rule.status_trigger}
                          onChange={(e) => {
                            const next = [...autoSendRules];
                            next[idx] = { ...next[idx], status_trigger: e.target.value };
                            setAutoSendRules(next);
                          }}
                        >
                          <option value="">{t('admin.emails.autosend.noneOption', '-- None --')}</option>
                          {ORDER_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{cs ? s.label_cs : s.label_en}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="ae-save-bar">
            <div className={`ae-status-pill ${autoSendDirty ? 'ae-status--dirty' : 'ae-status--clean'}`}>
              <Icon name={autoSendDirty ? 'AlertCircle' : 'CheckCircle2'} size={14} />
              <span>{autoSendDirty ? t('admin.emails.unsavedChanges', 'Unsaved changes') : t('admin.emails.saved', 'Saved')}</span>
            </div>
            <button className="ae-btn ae-btn--primary" onClick={handleSaveAutoSend} disabled={!autoSendDirty || autoSendSaving}>
              <Icon name="Save" size={16} />
              {autoSendSaving ? t('admin.emails.saving', 'Saving...') : t('admin.emails.saveRules', 'Save rules')}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          STYLES
          ============================================================ */}
      <style>{`
        /* ---- Page Layout ---- */
        .ae-page {
          padding: 24px;
          max-width: 1360px;
          margin: 0 auto;
          min-height: 100vh;
        }

        .ae-spin { animation: ae-spin-anim 1s linear infinite; }
        @keyframes ae-spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ---- Header ---- */
        .ae-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .ae-header-left { display: flex; align-items: flex-start; gap: 14px; }
        .ae-header-icon {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--forge-radius-lg, 12px);
          background: rgba(0,212,170,0.1);
          color: var(--forge-accent-primary);
          flex-shrink: 0;
        }
        .ae-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-heading);
        }
        .ae-subtitle {
          margin: 4px 0 0 0;
          color: var(--forge-text-secondary);
          font-size: 14px;
          max-width: 600px;
          line-height: 1.5;
        }

        /* ---- Banner ---- */
        .ae-banner {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: var(--forge-radius-md, 8px);
          margin-bottom: 16px; font-size: 14px;
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
          color: var(--forge-text-secondary);
        }
        .ae-banner--success { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .ae-banner--error { border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.08); color: var(--forge-error); }
        .ae-banner-close {
          margin-left: auto; border: none; background: none; cursor: pointer;
          color: inherit; padding: 2px; display: inline-flex; opacity: 0.6;
        }
        .ae-banner-close:hover { opacity: 1; }

        /* ---- Tabs ---- */
        .ae-tabs {
          display: flex; gap: 2px; margin-bottom: 20px;
          border-bottom: 2px solid var(--forge-border-default);
          overflow-x: auto;
        }
        .ae-tab {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 18px; border: none; background: none;
          font-size: 13px; font-weight: 600;
          color: var(--forge-text-muted); cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px; transition: color 0.15s, border-color 0.15s;
          font-family: var(--forge-font-tech);
          letter-spacing: 0.03em;
          white-space: nowrap;
          position: relative;
        }
        .ae-tab:hover { color: var(--forge-text-primary); }
        .ae-tab--active { color: var(--forge-accent-primary); border-bottom-color: var(--forge-accent-primary); }
        .ae-tab-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--forge-warning, #FFB547);
          display: inline-block;
        }
        .ae-tab-badge {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px; border-radius: 9px;
          background: var(--forge-bg-overlay); color: var(--forge-text-muted);
          font-size: 11px; font-weight: 700; padding: 0 5px;
        }

        /* ---- Cards ---- */
        .ae-card {
          background: var(--forge-bg-surface);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-xl, 16px);
          overflow: hidden;
        }
        .ae-card + .ae-card { margin-top: 16px; }
        .ae-card-header {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
          padding: 16px 18px; border-bottom: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
        }
        .ae-card-header-actions { display: flex; gap: 8px; align-items: center; }
        .ae-card-title {
          margin: 0; font-size: 15px; font-weight: 700;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-heading);
        }
        .ae-card-desc { margin: 3px 0 0; font-size: 13px; color: var(--forge-text-muted); max-width: 600px; }
        .ae-card-body { padding: 18px; }

        /* ---- Common ---- */
        .ae-text-muted { color: var(--forge-text-muted); }
        .ae-empty { padding: 40px 18px; text-align: center; color: var(--forge-text-muted); }
        .ae-empty h3 { margin: 12px 0 4px; color: var(--forge-text-primary); font-size: 16px; }
        .ae-empty p { margin: 0; font-size: 13px; }

        .ae-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 640px) { .ae-grid-2 { grid-template-columns: 1fr; } }

        .ae-field { margin-bottom: 0; }
        .ae-label {
          display: block; font-size: 11px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--forge-text-secondary); margin-bottom: 6px;
          font-family: var(--forge-font-tech);
        }
        .ae-input {
          width: 100%; border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md, 8px);
          padding: 10px 12px; font-size: 14px; outline: none;
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
          transition: border-color 0.15s;
        }
        .ae-input:focus { border-color: var(--forge-accent-primary); }
        .ae-help { font-size: 12px; color: var(--forge-text-muted); margin-top: 6px; }

        .ae-security-note {
          display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px;
          border: 1px solid rgba(255,181,71,0.3); background: rgba(255,181,71,0.08);
          border-radius: var(--forge-radius-md, 8px);
          font-size: 13px; color: var(--forge-warning);
        }

        /* ---- Buttons ---- */
        .ae-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 14px; border-radius: var(--forge-radius-md, 8px);
          font-size: 13px; font-weight: 600; cursor: pointer;
          border: 1px solid transparent; transition: all 0.15s;
          font-family: var(--forge-font-tech); letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .ae-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ae-btn--primary {
          background: var(--forge-accent-primary); color: var(--forge-bg-void);
          border-color: var(--forge-accent-primary);
        }
        .ae-btn--primary:hover:not(:disabled) { background: var(--forge-accent-primary-h); }
        .ae-btn--secondary {
          background: var(--forge-bg-elevated); color: var(--forge-text-primary);
          border-color: var(--forge-border-default);
        }
        .ae-btn--secondary:hover:not(:disabled) { background: var(--forge-bg-overlay); border-color: var(--forge-border-active); }
        .ae-btn--ghost {
          background: transparent; color: var(--forge-text-secondary);
          border: 1px solid var(--forge-border-default); padding: 7px 10px;
        }
        .ae-btn--ghost:hover:not(:disabled) { background: var(--forge-bg-elevated); color: var(--forge-text-primary); }
        .ae-btn--danger { color: var(--forge-error, #FF4757); }
        .ae-btn--danger:hover:not(:disabled) { background: rgba(255,71,87,0.1); border-color: rgba(255,71,87,0.3); }

        /* ---- Status Pill ---- */
        .ae-status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          border-radius: 999px; padding: 5px 10px; font-size: 12px;
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
          color: var(--forge-text-secondary);
          font-family: var(--forge-font-tech);
        }
        .ae-status--clean { border-color: rgba(0,212,170,0.3); background: rgba(0,212,170,0.08); color: var(--forge-success); }
        .ae-status--dirty { border-color: rgba(255,181,71,0.3); background: rgba(255,181,71,0.08); color: var(--forge-warning); }

        .ae-save-bar {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 12px; margin-top: 16px;
        }

        /* ---- Provider Grid ---- */
        .ae-provider-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }
        @media (max-width: 640px) { .ae-provider-grid { grid-template-columns: 1fr; } }
        .ae-provider-card {
          position: relative;
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 20px 16px;
          border: 2px solid var(--forge-border-default);
          border-radius: var(--forge-radius-xl, 16px);
          background: var(--forge-bg-surface);
          color: var(--forge-text-secondary);
          cursor: pointer; transition: all 0.15s;
        }
        .ae-provider-card:hover {
          border-color: var(--forge-border-active);
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
        }
        .ae-provider-card--active {
          border-color: var(--forge-accent-primary);
          background: rgba(0,212,170,0.06);
          color: var(--forge-accent-primary);
        }
        .ae-provider-label {
          font-size: 14px; font-weight: 600;
          font-family: var(--forge-font-heading);
        }
        .ae-provider-check {
          position: absolute; top: 10px; right: 10px;
          color: var(--forge-accent-primary);
        }

        /* ============================================================
           TEMPLATE EDITOR SECTION
           ============================================================ */
        .ae-templates-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 16px;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .ae-templates-layout { grid-template-columns: 1fr; }
        }

        /* Sidebar */
        .ae-tpl-sidebar { position: sticky; top: 16px; }
        .ae-tpl-list { padding: 8px; }
        .ae-tpl-category { margin-bottom: 8px; }
        .ae-tpl-category:last-child { margin-bottom: 0; }
        .ae-tpl-category-label {
          font-size: 10px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--forge-text-muted);
          padding: 6px 10px 4px; font-family: var(--forge-font-tech);
        }
        .ae-tpl-item {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 10px; border: none; background: none;
          border-radius: var(--forge-radius-md, 8px);
          color: var(--forge-text-secondary);
          font-size: 13px; font-weight: 500; cursor: pointer;
          transition: background 0.12s, color 0.12s;
          text-align: left;
        }
        .ae-tpl-item:hover { background: var(--forge-bg-elevated); color: var(--forge-text-primary); }
        .ae-tpl-item--active {
          background: rgba(0,212,170,0.1);
          color: var(--forge-accent-primary);
          font-weight: 600;
        }
        .ae-tpl-item-label {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* Template header card */
        .ae-tpl-header-card { margin-bottom: 16px; }
        .ae-tpl-header-inner {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 12px 18px; flex-wrap: wrap;
        }
        .ae-tpl-header-left { display: flex; align-items: center; gap: 10px; color: var(--forge-text-primary); }
        .ae-tpl-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        /* Edit/Preview toggle */
        .ae-mode-toggle {
          display: flex; border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-md, 8px); overflow: hidden;
        }
        .ae-mode-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 12px; border: none; background: var(--forge-bg-surface);
          color: var(--forge-text-muted); font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.12s;
          font-family: var(--forge-font-tech);
        }
        .ae-mode-btn:first-child { border-right: 1px solid var(--forge-border-default); }
        .ae-mode-btn:hover { color: var(--forge-text-primary); background: var(--forge-bg-elevated); }
        .ae-mode-btn--active {
          background: var(--forge-accent-primary);
          color: var(--forge-bg-void);
        }

        /* Variable chips */
        .ae-var-chips { display: flex; flex-wrap: wrap; gap: 5px; }
        .ae-var-chip {
          display: inline-flex; align-items: center;
          padding: 3px 9px; border-radius: 999px;
          border: 1px solid rgba(0,212,170,0.25);
          background: rgba(0,212,170,0.06);
          color: var(--forge-accent-primary);
          font-size: 11px; font-weight: 600; cursor: pointer;
          transition: background 0.12s, border-color 0.12s;
          font-family: var(--forge-font-tech);
        }
        .ae-var-chip:hover {
          background: rgba(0,212,170,0.15);
          border-color: var(--forge-accent-primary);
        }
        .ae-var-chip-key { font-family: var(--forge-font-mono, monospace); }

        /* Editor toolbar */
        .ae-editor-toolbar {
          display: flex; gap: 2px; padding: 6px 8px;
          background: var(--forge-bg-elevated);
          border: 1px solid var(--forge-border-default);
          border-bottom: none;
          border-radius: var(--forge-radius-md, 8px) var(--forge-radius-md, 8px) 0 0;
          flex-wrap: wrap;
        }
        .ae-toolbar-btn {
          border: none; background: none; cursor: pointer;
          padding: 6px 8px; border-radius: 4px;
          color: var(--forge-text-secondary); display: inline-flex; align-items: center;
          transition: background 0.1s, color 0.1s;
        }
        .ae-toolbar-btn:hover { background: var(--forge-bg-overlay); color: var(--forge-text-primary); }
        .ae-toolbar-sep {
          width: 1px; background: var(--forge-border-default);
          margin: 4px 4px; align-self: stretch;
        }

        /* ContentEditable body */
        .ae-editor-body {
          border: 1px solid var(--forge-border-default);
          border-top: none;
          border-radius: 0 0 var(--forge-radius-md, 8px) var(--forge-radius-md, 8px);
          padding: 16px;
          min-height: 300px;
          background: #ffffff;
          color: #1a1a2e;
          font-size: 14px;
          line-height: 1.6;
          outline: none;
          overflow-y: auto;
          max-height: 520px;
        }
        .ae-editor-body:focus { border-color: var(--forge-accent-primary); }
        .ae-editor-body h2 { font-size: 18px; margin-bottom: 8px; color: #1a1a2e; }
        .ae-editor-body p { margin-bottom: 8px; }
        .ae-editor-body a { color: #00d4aa; text-decoration: underline; }
        .ae-editor-body ul, .ae-editor-body ol { margin: 0 0 8px 20px; }
        .ae-editor-body li { margin-bottom: 4px; }
        .ae-editor-body table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        .ae-editor-body td { padding: 6px 8px; border-bottom: 1px solid #e8e8e8; }

        /* ============================================================
           LOG TABLE
           ============================================================ */
        .ae-log-table { }
        .ae-log-header {
          display: grid; grid-template-columns: 150px 1fr 180px 110px 100px; gap: 8px;
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--forge-text-muted);
          padding: 10px 18px;
          background: var(--forge-bg-elevated);
          border-bottom: 1px solid var(--forge-border-default);
          font-family: var(--forge-font-tech);
        }
        .ae-log-row {
          display: grid; grid-template-columns: 150px 1fr 180px 110px 100px; gap: 8px;
          font-size: 13px; color: var(--forge-text-secondary);
          padding: 10px 18px; align-items: center;
          border-bottom: 1px solid var(--forge-border-default);
          transition: background 0.1s;
        }
        .ae-log-row:last-child { border-bottom: none; }
        .ae-log-row:hover { background: var(--forge-bg-elevated); }
        .ae-log-date { font-size: 12px; color: var(--forge-text-muted); font-family: var(--forge-font-mono, monospace); }
        .ae-log-template { display: flex; align-items: center; color: var(--forge-text-primary); font-weight: 500; }
        .ae-log-recipient { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ae-log-order { font-size: 12px; font-family: var(--forge-font-mono, monospace); color: var(--forge-text-muted); }
        .ae-log-status { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }
        .ae-log-status--sent { color: var(--forge-success); }
        .ae-log-status--failed { color: var(--forge-error); }
        @media (max-width: 900px) {
          .ae-log-header, .ae-log-row { grid-template-columns: 1fr 1fr 100px; }
          .ae-log-header span:nth-child(4), .ae-log-row span:nth-child(4),
          .ae-log-header span:nth-child(3), .ae-log-row span:nth-child(3) { display: none; }
        }
        @media (max-width: 600px) {
          .ae-log-header, .ae-log-row { grid-template-columns: 1fr 80px; }
          .ae-log-header span:nth-child(2), .ae-log-row span:nth-child(2) { display: none; }
        }

        /* ============================================================
           AUTO-SEND
           ============================================================ */
        .ae-autosend-list { }
        .ae-autosend-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 14px 18px;
          border-bottom: 1px solid var(--forge-border-default);
          transition: background 0.1s;
        }
        .ae-autosend-row:last-child { border-bottom: none; }
        .ae-autosend-row:hover { background: var(--forge-bg-elevated); }
        .ae-autosend-row--enabled { background: rgba(0,212,170,0.03); }
        .ae-autosend-left { display: flex; align-items: center; gap: 10px; }
        .ae-autosend-tpl { display: flex; align-items: center; gap: 7px; color: var(--forge-text-primary); }
        .ae-autosend-tpl-name { font-size: 14px; font-weight: 600; }
        .ae-autosend-right { display: flex; align-items: center; gap: 10px; }
        .ae-autosend-arrow-label {
          font-size: 12px; color: var(--forge-text-muted);
          font-family: var(--forge-font-tech); white-space: nowrap;
        }
        .ae-autosend-select { width: 160px; padding: 8px 10px; font-size: 13px; }
        @media (max-width: 700px) {
          .ae-autosend-row { flex-direction: column; align-items: flex-start; gap: 8px; }
          .ae-autosend-right { width: 100%; }
          .ae-autosend-select { flex: 1; }
        }

        .ae-tab-content { }
      `}</style>
      <ConfirmDialog />
    </div>
  );
}
